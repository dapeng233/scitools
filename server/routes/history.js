const express = require('express');
const db = require('../services/database');

const router = express.Router();

// 获取历史记录
router.get('/', (req, res) => {
  const records = db.prepare(
    `SELECT id, mode, prompt, translated_prompt as translatedPrompt, model, size,
     image_filename as imageFile, cost, created_at as timestamp
     FROM history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100`
  ).all(req.userId);

  const result = records.map(item => ({
    ...item,
    imageUrl: item.imageFile ? `/images/${item.imageFile}` : null
  }));
  res.json(result);
});

// 清空历史记录
router.delete('/', (req, res) => {
  db.prepare('DELETE FROM history WHERE user_id = ?').run(req.userId);
  res.json({ message: '历史记录已清空' });
});

module.exports = router;
