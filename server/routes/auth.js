const express = require('express');
const userService = require('../services/user');
const emailService = require('../services/email');
const db = require('../services/database');

const router = express.Router();

// 注册 - 发送验证码
router.post('/send-code', async (req, res) => {
  try {
    const { email, purpose } = req.body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: '请输入有效的邮箱地址' });
    }

    if (purpose === 'register') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (existing) return res.status(400).json({ error: '该邮箱已注册' });
    }

    if (purpose === 'reset') {
      const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
      if (!existing) return res.status(400).json({ error: '该邮箱未注册' });
    }

    await emailService.sendCode(email, purpose || 'register');
    res.json({ success: true, message: '验证码已发送' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 注册
router.post('/register', (req, res) => {
  try {
    const { email, password, code, nickname } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少 6 位' });
    if (!code) return res.status(400).json({ error: '请输入验证码' });

    // 验证邮箱验证码
    emailService.verifyCode(email, code, 'register');

    const result = userService.register(email, password, nickname);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 登录
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: '邮箱和密码不能为空' });

    const result = userService.login(email, password);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// 检查登录状态
router.get('/check-auth', (req, res) => {
  const token = req.headers['x-auth-token'];
  if (!token) return res.json({ authenticated: false });

  const payload = userService.verifyToken(token);
  if (!payload) return res.json({ authenticated: false });

  const user = userService.getUserById(payload.userId);
  if (!user) return res.json({ authenticated: false });

  res.json({
    authenticated: true,
    user: { id: user.id, email: user.email, nickname: user.nickname, balance: user.balance }
  });
});

// 重置密码
router.post('/reset-password', (req, res) => {
  try {
    const { email, password, code } = req.body;
    if (!email || !password || !code) return res.status(400).json({ error: '参数不完整' });
    if (password.length < 6) return res.status(400).json({ error: '密码至少 6 位' });

    emailService.verifyCode(email, code, 'reset');
    userService.resetPassword(email, password);
    res.json({ success: true, message: '密码已重置，请重新登录' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// JWT 鉴权中间件
function authMiddleware(req, res, next) {
  const token = req.headers['x-auth-token'];
  if (!token) return res.status(401).json({ error: '请先登录' });

  const payload = userService.verifyToken(token);
  if (!payload) return res.status(401).json({ error: '登录已过期，请重新登录' });

  req.userId = payload.userId;
  req.userEmail = payload.email;
  next();
}

module.exports = { router, authMiddleware };
