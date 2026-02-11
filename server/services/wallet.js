const db = require('./database');

// 充值
function recharge(userId, amount) {
  const txn = db.transaction(() => {
    db.prepare(
      `UPDATE users SET balance = balance + ?, total_recharge = total_recharge + ?, updated_at = datetime('now') WHERE id = ?`
    ).run(amount, amount, userId);

    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

    db.prepare(
      'INSERT INTO transactions (user_id, type, amount, balance_after, description) VALUES (?, ?, ?, ?, ?)'
    ).run(userId, 'recharge', amount, user.balance, `充值 ￥${amount}`);

    return user.balance;
  });

  return txn();
}

// 扣费（apiCost 已包含最低消费逻辑）
function deduct(userId, apiCost, description) {
  const charge = parseFloat(apiCost.toFixed(2));

  const txn = db.transaction(() => {
    const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);
    if (!user) throw new Error('账户不存在');
    if (user.balance < charge) {
      throw new Error(`余额不足，当前余额 ￥${user.balance}，本次需要 ￥${charge}`);
    }

    db.prepare(
      `UPDATE users SET balance = balance - ?, total_spent = total_spent + ?, image_count = image_count + 1, updated_at = datetime('now') WHERE id = ?`
    ).run(charge, charge, userId);

    const updated = db.prepare('SELECT balance FROM users WHERE id = ?').get(userId);

    db.prepare(
      'INSERT INTO transactions (user_id, type, amount, api_cost, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(userId, 'deduct', charge, parseFloat(apiCost.toFixed(4)), updated.balance, description);

    return { charge, balance: updated.balance };
  });

  return txn();
}

// 查询余额
function getBalance(userId) {
  const user = db.prepare(
    'SELECT balance, total_recharge, total_spent, image_count FROM users WHERE id = ?'
  ).get(userId);
  if (!user) return { balance: 0, totalRecharge: 0, totalSpent: 0, imageCount: 0 };
  return {
    balance: user.balance,
    totalRecharge: user.total_recharge,
    totalSpent: user.total_spent,
    imageCount: user.image_count
  };
}

// 查询交易记录
function getTransactions(userId, limit = 50) {
  return db.prepare(
    'SELECT type, amount, api_cost as apiCost, balance_after as balance, description, created_at as timestamp FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(userId, limit);
}

module.exports = { recharge, deduct, getBalance, getTransactions };
