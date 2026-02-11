const nodemailer = require('nodemailer');
const db = require('./database');
const config = require('../config');

// 生成 6 位验证码
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// 创建邮件发送器（需要在 .env 中配置 SMTP）
function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });
}

// 发送验证码
async function sendCode(email, purpose = 'register') {
  // 检查 1 分钟内是否已发送
  const recent = db.prepare(
    `SELECT id FROM email_codes
     WHERE email = ? AND purpose = ? AND created_at > datetime('now', '-1 minutes')`
  ).get(email, purpose);
  if (recent) throw new Error('验证码发送太频繁，请 1 分钟后再试');

  const code = generateCode();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // 存入数据库
  db.prepare(
    'INSERT INTO email_codes (email, code, purpose, expires_at) VALUES (?, ?, ?, ?)'
  ).run(email, code, purpose, expiresAt);

  // 发送邮件
  const subjects = {
    register: 'SciTools 注册验证码',
    reset: 'SciTools 密码重置验证码'
  };

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"SciTools" <${config.smtp.user}>`,
    to: email,
    subject: subjects[purpose] || 'SciTools 验证码',
    html: `
      <div style="max-width:400px;margin:0 auto;padding:30px;font-family:sans-serif;">
        <h2 style="color:#667eea;">SciTools 科研工具箱</h2>
        <p>您的验证码是：</p>
        <div style="font-size:32px;font-weight:bold;color:#333;letter-spacing:6px;padding:16px 0;">${code}</div>
        <p style="color:#999;font-size:13px;">验证码 10 分钟内有效，请勿泄露给他人。</p>
      </div>
    `
  });

  return true;
}

// 验证验证码
function verifyCode(email, code, purpose = 'register') {
  const record = db.prepare(
    `SELECT id FROM email_codes
     WHERE email = ? AND code = ? AND purpose = ? AND used = 0 AND expires_at > datetime('now')
     ORDER BY created_at DESC LIMIT 1`
  ).get(email, code, purpose);

  if (!record) throw new Error('验证码错误或已过期');

  // 标记为已使用
  db.prepare('UPDATE email_codes SET used = 1 WHERE id = ?').run(record.id);
  return true;
}

module.exports = { sendCode, verifyCode };
