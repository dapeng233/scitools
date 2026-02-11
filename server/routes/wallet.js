const express = require('express');
const wallet = require('../services/wallet');
const config = require('../config');

const router = express.Router();

// 获取余额
router.get('/balance', (req, res) => {
  res.json(wallet.getBalance(req.userId));
});

// 充值
router.post('/recharge', (req, res) => {
  try {
    const { amount, rechargeCode } = req.body;

    const validCodes = {
      'SCITOOLS5': 5,
      'SCITOOLS10': 10,
      'SCITOOLS20': 20
    };

    let rechargeAmount;
    if (rechargeCode && validCodes[rechargeCode.toUpperCase()]) {
      rechargeAmount = validCodes[rechargeCode.toUpperCase()];
    } else if (rechargeCode) {
      return res.status(400).json({ error: '无效的充值码' });
    } else if (amount && amount > 0) {
      const adminKey = req.headers['x-admin-key'];
      if (adminKey !== config.adminKey) {
        return res.status(403).json({ error: '无权限' });
      }
      rechargeAmount = amount;
    } else {
      return res.status(400).json({ error: '请提供充值码或充值金额' });
    }

    const newBalance = wallet.recharge(req.userId, rechargeAmount);
    res.json({ message: `充值成功 ￥${rechargeAmount}`, balance: newBalance });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 交易记录
router.get('/transactions', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json(wallet.getTransactions(req.userId, limit));
});

module.exports = router;
