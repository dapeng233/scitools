const express = require('express');
const payment = require('../services/payment');

const router = express.Router();

// 创建支付订单（需要登录）
router.post('/create', async (req, res) => {
  try {
    const { amount, payType } = req.body;
    const validAmounts = [5, 10, 20, 50, 100];
    if (!validAmounts.includes(Number(amount))) {
      return res.status(400).json({ error: '请选择有效的充值金额' });
    }

    const result = await payment.createOrder(req.userId, Number(amount), payType || 'alipay');
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 查询订单状态（需要登录）
router.get('/status/:orderNo', (req, res) => {
  const order = payment.getOrderStatus(req.params.orderNo, req.userId);
  if (!order) return res.status(404).json({ error: '订单不存在' });
  res.json(order);
});

// 我的订单列表（需要登录）
router.get('/orders', (req, res) => {
  res.json(payment.getUserOrders(req.userId));
});

module.exports = router;
