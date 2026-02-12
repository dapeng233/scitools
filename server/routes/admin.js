const express = require('express');
const db = require('../services/database');
const wallet = require('../services/wallet');
const crypto = require('crypto');

const router = express.Router();

// 生成充值码
router.post('/generate-codes', (req, res) => {
  try {
    const { amount, count = 1 } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: '请指定有效金额' });
    }

    if (count < 1 || count > 100) {
      return res.status(400).json({ error: '数量范围 1-100' });
    }

    const codes = [];
    const stmt = db.prepare('INSERT INTO recharge_codes (code, amount) VALUES (?, ?)');

    for (let i = 0; i < count; i++) {
      // 生成格式：SCI-XXXX-XXXX（8位随机字符）
      const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
      const code = `SCI-${randomPart.slice(0, 4)}-${randomPart.slice(4, 8)}`;

      try {
        stmt.run(code, amount);
        codes.push({ code, amount });
      } catch (e) {
        // 如果重复则重试
        i--;
      }
    }

    res.json({
      message: `成功生成 ${codes.length} 个充值码`,
      codes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取所有充值码
router.get('/codes', (req, res) => {
  try {
    const codes = db.prepare(`
      SELECT rc.*, u.email as used_by_email
      FROM recharge_codes rc
      LEFT JOIN users u ON rc.used_by = u.id
      ORDER BY rc.created_at DESC
    `).all();
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除未使用的充值码
router.delete('/codes/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM recharge_codes WHERE id = ? AND used = 0').run(req.params.id);
    if (result.changes === 0) {
      return res.status(400).json({ error: '充值码不存在或已被使用' });
    }
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
