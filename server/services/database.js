const Database = require('better-sqlite3');
const path = require('path');
const config = require('../config');
const fs = require('fs');

// 确保 data 目录存在
const dataDir = config.dataDir;
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'scitools.db');
const db = new Database(dbPath);

// 开启 WAL 模式，提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    nickname TEXT DEFAULT '',
    email_verified INTEGER DEFAULT 0,
    balance REAL DEFAULT 0,
    total_recharge REAL DEFAULT 0,
    total_spent REAL DEFAULT 0,
    image_count INTEGER DEFAULT 0,
    api_key TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    amount REAL NOT NULL,
    api_cost REAL DEFAULT 0,
    balance_after REAL NOT NULL,
    description TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    mode TEXT DEFAULT 'text2img',
    prompt TEXT DEFAULT '',
    translated_prompt TEXT DEFAULT '',
    model TEXT DEFAULT '',
    size TEXT DEFAULT '',
    image_filename TEXT DEFAULT '',
    cost REAL DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS email_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    purpose TEXT DEFAULT 'register',
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id);
  CREATE INDEX IF NOT EXISTS idx_email_codes_email ON email_codes(email);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    order_no TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    pay_type TEXT DEFAULT '',
    trade_no TEXT DEFAULT '',
    created_at TEXT DEFAULT (datetime('now')),
    paid_at TEXT DEFAULT '',
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
  CREATE INDEX IF NOT EXISTS idx_orders_no ON orders(order_no);

  CREATE TABLE IF NOT EXISTS recharge_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    amount REAL NOT NULL,
    used INTEGER DEFAULT 0,
    used_by INTEGER DEFAULT NULL,
    used_at TEXT DEFAULT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (used_by) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_recharge_codes_code ON recharge_codes(code);
`);

module.exports = db;
