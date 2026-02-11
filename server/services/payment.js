const crypto = require('crypto');
const axios = require('axios');
const db = require('./database');
const wallet = require('./wallet');
const config = require('../config');

// 生成订单号
function generateOrderNo() {
  const now = new Date();
  const ts = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `SC${ts}${rand}`;
}

// 虎皮椒签名
function sign(params, appSecret) {
  const keys = Object.keys(params).filter(k => params[k] !== '' && k !== 'hash').sort();
  const str = keys.map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHash('md5').update(str + appSecret).digest('hex');
}

// 创建支付订单
async function createOrder(userId, amount, payType = 'alipay') {
  const { appId, appSecret, notifyUrl, apiUrl } = config.payment;
  if (!appId || !appSecret) throw new Error('支付未配置，请联系管理员');

  const orderNo = generateOrderNo();

  // 存入数据库
  db.prepare(
    'INSERT INTO orders (user_id, order_no, amount, pay_type) VALUES (?, ?, ?, ?)'
  ).run(userId, orderNo, amount, payType);

  // 调用虎皮椒 API
  const params = {
    version: '1.1',
    appid: appId,
    trade_order_id: orderNo,
    total_fee: amount.toFixed(2),
    title: `SciTools 充值 ￥${amount}`,
    notify_url: notifyUrl,
    nonce_str: Math.random().toString(36).slice(2, 14)
  };

  if (payType === 'wechat') {
    params.type = 'WAP';
  }

  params.hash = sign(params, appSecret);

  const resp = await axios.post(apiUrl, new URLSearchParams(params).toString(), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    timeout: 15000
  });

  if (resp.data.errcode !== 0 && resp.data.errcode !== undefined) {
    throw new Error(resp.data.errmsg || '创建支付订单失败');
  }

  return {
    orderNo,
    payUrl: resp.data.url || resp.data.url_qrcode || '',
    qrcode: resp.data.url_qrcode || ''
  };
}

// 验证回调签名并处理
function handleNotify(params) {
  const { appSecret } = config.payment;
  const expectedHash = sign(params, appSecret);

  if (expectedHash !== params.hash) {
    throw new Error('签名验证失败');
  }

  if (params.status !== 'OD') return { success: false, msg: '订单未支付' };

  const orderNo = params.trade_order_id;
  const order = db.prepare('SELECT * FROM orders WHERE order_no = ?').get(orderNo);
  if (!order) throw new Error('订单不存在');
  if (order.status === 'paid') return { success: true, msg: '已处理' };

  // 事务：更新订单 + 充值
  const txn = db.transaction(() => {
    db.prepare(
      'UPDATE orders SET status = ?, trade_no = ?, paid_at = datetime(\'now\') WHERE order_no = ?'
    ).run('paid', params.transaction_id || '', orderNo);

    wallet.recharge(order.user_id, order.amount);
  });

  txn();
  return { success: true, msg: 'OK' };
}

// 查询订单状态
function getOrderStatus(orderNo, userId) {
  const order = db.prepare(
    'SELECT order_no, amount, status, pay_type, created_at, paid_at FROM orders WHERE order_no = ? AND user_id = ?'
  ).get(orderNo, userId);
  return order || null;
}

// 用户订单列表
function getUserOrders(userId, limit = 20) {
  return db.prepare(
    'SELECT order_no, amount, status, pay_type, created_at, paid_at FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit);
}

module.exports = { createOrder, handleNotify, getOrderStatus, getUserOrders };
