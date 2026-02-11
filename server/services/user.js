const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const config = require('../config');

const JWT_SECRET = config.jwtSecret || 'scitools-secret-key-change-in-production';
const JWT_EXPIRES = '7d';

// 注册
function register(email, password, nickname = '') {
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) throw new Error('该邮箱已注册');

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, nickname) VALUES (?, ?, ?)'
  ).run(email, hash, nickname || email.split('@')[0]);

  const userId = result.lastInsertRowid;
  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return { userId, token, email, nickname: nickname || email.split('@')[0] };
}

// 登录
function login(email, password) {
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) throw new Error('邮箱或密码错误');
  if (!bcrypt.compareSync(password, user.password_hash)) throw new Error('邮箱或密码错误');

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
  return {
    userId: user.id, token, email: user.email,
    nickname: user.nickname, balance: user.balance
  };
}

// 验证 JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// 获取用户信息
function getUserById(userId) {
  return db.prepare(
    'SELECT id, email, nickname, email_verified, balance, total_recharge, total_spent, image_count, api_key, created_at FROM users WHERE id = ?'
  ).get(userId);
}

// 更新昵称
function updateNickname(userId, nickname) {
  db.prepare(`UPDATE users SET nickname = ?, updated_at = datetime('now') WHERE id = ?`).run(nickname, userId);
}

// 更新用户自有 API Key
function updateApiKey(userId, apiKey) {
  db.prepare(`UPDATE users SET api_key = ?, updated_at = datetime('now') WHERE id = ?`).run(apiKey, userId);
}

// 修改密码
function changePassword(userId, oldPassword, newPassword) {
  const user = db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId);
  if (!user) throw new Error('用户不存在');
  if (!bcrypt.compareSync(oldPassword, user.password_hash)) throw new Error('原密码错误');

  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(hash, userId);
}

// 重置密码（通过邮箱验证码）
function resetPassword(email, newPassword) {
  const hash = bcrypt.hashSync(newPassword, 10);
  const result = db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE email = ?`).run(hash, email);
  if (result.changes === 0) throw new Error('用户不存在');
}

module.exports = {
  register, login, verifyToken, getUserById,
  updateNickname, updateApiKey, changePassword, resetPassword,
  JWT_SECRET
};
