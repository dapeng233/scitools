<template>
  <div class="wallet-page">
    <h2 class="page-title">💰 我的钱包</h2>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-main">
        <span class="balance-label">当前余额</span>
        <span class="balance-amount">￥{{ balance.toFixed(2) }}</span>
      </div>
      <div class="balance-stats">
        <div class="stat-item">
          <span class="stat-value">{{ imageCount }}</span>
          <span class="stat-label">已生成图片</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">￥{{ totalSpent.toFixed(2) }}</span>
          <span class="stat-label">累计消费</span>
        </div>
        <div class="stat-item">
          <span class="stat-value">￥{{ totalRecharge.toFixed(2) }}</span>
          <span class="stat-label">累计充值</span>
        </div>
      </div>
    </div>

    <div class="wallet-layout">
      <!-- 充值面板 -->
      <div class="panel">
        <h3>充值</h3>

        <!-- 充值方式切换 -->
        <div class="pay-tabs">
          <button class="pay-tab" :class="{ active: payMode === 'online' }" @click="payMode = 'online'">在线支付</button>
          <button class="pay-tab" :class="{ active: payMode === 'code' }" @click="payMode = 'code'">充值码</button>
        </div>

        <!-- 金额选择 -->
        <div class="recharge-options">
          <button
            v-for="opt in rechargeOptions"
            :key="opt.amount"
            class="recharge-option"
            :class="{ selected: selectedAmount === opt.amount }"
            @click="selectedAmount = opt.amount"
          >
            <span class="opt-amount">￥{{ opt.amount }}</span>
            <span class="opt-desc">约 {{ opt.images }} 张图</span>
          </button>
        </div>

        <!-- 在线支付 -->
        <template v-if="payMode === 'online'">
          <div class="pay-type-row">
            <button class="pay-type-btn" :class="{ active: payType === 'alipay' }" @click="payType = 'alipay'">支付宝</button>
            <button class="pay-type-btn" :class="{ active: payType === 'wechat' }" @click="payType = 'wechat'">微信支付</button>
          </div>
          <button class="btn btn-primary" @click="handleOnlinePay" :disabled="paying">
            {{ paying ? '创建订单中...' : `支付 ￥${selectedAmount}` }}
          </button>

          <!-- 支付弹窗 -->
          <div v-if="payUrl" class="pay-modal-overlay" @click.self="closePayModal">
            <div class="pay-modal">
              <h4>请完成支付</h4>
              <p>订单金额：￥{{ selectedAmount }}</p>
              <p class="pay-hint">请在新窗口中完成支付</p>
              <a :href="payUrl" target="_blank" class="btn btn-primary" style="display:block;text-align:center;text-decoration:none;margin:16px 0;">打开支付页面</a>
              <button class="btn btn-check" @click="checkPayStatus">{{ checking ? '查询中...' : '我已支付' }}</button>
              <button class="btn btn-cancel" @click="closePayModal">取消</button>
              <p v-if="payStatusMsg" class="pay-status-msg" :class="{ success: payStatusSuccess }">{{ payStatusMsg }}</p>
            </div>
          </div>
        </template>

        <!-- 充值码 -->
        <template v-if="payMode === 'code'">
          <div class="form-group" style="margin-top: 16px">
            <label>充值码</label>
            <input v-model="rechargeCode" type="text" placeholder="输入充值码" class="input-field" @keydown.enter="handleRecharge" />
            <small>充值码由管理员提供</small>
          </div>
          <button class="btn btn-primary" @click="handleRecharge" :disabled="recharging">
            {{ recharging ? '充值中...' : '确认充值' }}
          </button>
        </template>

        <p v-if="rechargeMsg" class="recharge-msg" :class="{ error: rechargeMsgIsError }">{{ rechargeMsg }}</p>
      </div>

      <!-- 交易记录 -->
      <div class="panel">
        <h3>交易记录</h3>
        <div v-if="transactions.length === 0" class="empty-state">
          <p>暂无交易记录</p>
        </div>
        <div v-else class="transaction-list">
          <div v-for="(tx, idx) in transactions" :key="idx" class="transaction-item" :class="tx.type">
            <div class="tx-left">
              <span class="tx-icon">{{ tx.type === 'recharge' ? '➕' : '🖼️' }}</span>
              <div>
                <p class="tx-desc">{{ tx.description }}</p>
                <p class="tx-time">{{ formatTime(tx.timestamp) }}</p>
              </div>
            </div>
            <div class="tx-right">
              <span class="tx-amount" :class="tx.type">
                {{ tx.type === 'recharge' ? '+' : '-' }}￥{{ tx.amount.toFixed(2) }}
              </span>
              <span class="tx-balance">余额 ￥{{ tx.balance.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { api } from '@/utils/api';

const balance = ref(0);
const totalRecharge = ref(0);
const totalSpent = ref(0);
const imageCount = ref(0);
const transactions = ref([]);
const payMode = ref('online');
const selectedAmount = ref(5);
const payType = ref('alipay');
const paying = ref(false);
const payUrl = ref('');
const currentOrderNo = ref('');
const checking = ref(false);
const payStatusMsg = ref('');
const payStatusSuccess = ref(false);
const rechargeCode = ref('');
const recharging = ref(false);
const rechargeMsg = ref('');
const rechargeMsgIsError = ref(false);

const rechargeOptions = [
  { amount: 5, images: 10 },
  { amount: 10, images: 20 },
  { amount: 20, images: 40 },
  { amount: 50, images: 100 },
  { amount: 100, images: 200 }
];

onMounted(() => { loadBalance(); loadTransactions(); });

async function loadBalance() {
  try {
    const data = await api.get('/api/wallet/balance');
    balance.value = data.balance || 0;
    totalRecharge.value = data.totalRecharge || 0;
    totalSpent.value = data.totalSpent || 0;
    imageCount.value = data.imageCount || 0;
  } catch (e) { console.error('加载余额失败:', e); }
}

async function loadTransactions() {
  try { transactions.value = await api.get('/api/wallet/transactions'); }
  catch (e) { console.error('加载交易记录失败:', e); }
}

async function handleOnlinePay() {
  paying.value = true; rechargeMsg.value = ''; payStatusMsg.value = '';
  try {
    const data = await api.post('/api/payment/create', { amount: selectedAmount.value, payType: payType.value });
    currentOrderNo.value = data.orderNo;
    payUrl.value = data.payUrl || data.qrcode;
    if (!payUrl.value) throw new Error('未获取到支付链接');
  } catch (e) { rechargeMsg.value = e.message; rechargeMsgIsError.value = true; }
  finally { paying.value = false; }
}

async function checkPayStatus() {
  if (!currentOrderNo.value) return;
  checking.value = true; payStatusMsg.value = '';
  try {
    const order = await api.get(`/api/payment/status/${currentOrderNo.value}`);
    if (order.status === 'paid') {
      payStatusMsg.value = '支付成功！余额已更新'; payStatusSuccess.value = true;
      await loadBalance(); await loadTransactions();
      setTimeout(() => closePayModal(), 1500);
    } else { payStatusMsg.value = '暂未收到支付结果，请稍后再试'; payStatusSuccess.value = false; }
  } catch (e) { payStatusMsg.value = e.message; payStatusSuccess.value = false; }
  finally { checking.value = false; }
}

function closePayModal() { payUrl.value = ''; currentOrderNo.value = ''; payStatusMsg.value = ''; }

async function handleRecharge() {
  const code = rechargeCode.value.trim();
  if (!code) { rechargeMsg.value = '请输入充值码'; rechargeMsgIsError.value = true; return; }
  recharging.value = true; rechargeMsg.value = '';
  try {
    const data = await api.post('/api/wallet/recharge', { rechargeCode: code });
    rechargeMsg.value = data.message; rechargeMsgIsError.value = false; rechargeCode.value = '';
    await loadBalance(); await loadTransactions();
  } catch (e) { rechargeMsg.value = e.message; rechargeMsgIsError.value = true; }
  finally { recharging.value = false; }
}

function formatTime(ts) { return new Date(ts).toLocaleString(); }
</script>

<style scoped>
.page-title { font-size: 1.6em; color: #333; margin-bottom: 20px; }

.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px; padding: 28px; color: white; margin-bottom: 20px;
}
.balance-main { display: flex; flex-direction: column; margin-bottom: 20px; }
.balance-label { font-size: 0.9em; opacity: 0.8; }
.balance-amount { font-size: 2.4em; font-weight: 700; margin-top: 4px; }
.balance-stats { display: flex; gap: 24px; }
.stat-item { display: flex; flex-direction: column; }
.stat-value { font-size: 1.1em; font-weight: 600; }
.stat-label { font-size: 0.8em; opacity: 0.7; margin-top: 2px; }

.wallet-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.panel { background: white; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.panel h3 { font-size: 1.2em; margin-bottom: 18px; color: #333; border-bottom: 2px solid #667eea; padding-bottom: 8px; }

.pay-tabs { display: flex; gap: 8px; margin-bottom: 16px; }
.pay-tab {
  flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;
  background: white; cursor: pointer; font-weight: 600; font-size: 0.95em; transition: all 0.2s;
}
.pay-tab.active { border-color: #667eea; background: #f0f2ff; color: #667eea; }

.recharge-options { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 16px; }
.recharge-option {
  flex: 1; min-width: 80px; padding: 14px; border: 2px solid #e0e0e0;
  border-radius: 10px; background: white; cursor: pointer; text-align: center; transition: all 0.3s;
}
.recharge-option:hover { border-color: #667eea; }
.recharge-option.selected { border-color: #667eea; background: #f0f2ff; }
.opt-amount { display: block; font-size: 1.3em; font-weight: 700; color: #333; }
.opt-desc { display: block; font-size: 0.8em; color: #999; margin-top: 4px; }

.pay-type-row { display: flex; gap: 8px; margin-bottom: 16px; }
.pay-type-btn {
  flex: 1; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px;
  background: white; cursor: pointer; font-weight: 600; transition: all 0.2s;
}
.pay-type-btn.active { border-color: #667eea; background: #f0f2ff; color: #667eea; }

.form-group { margin-bottom: 16px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: #333; font-size: 0.95em; }
.form-group small { display: block; margin-top: 4px; color: #999; font-size: 0.85em; }
.input-field {
  width: 100%; padding: 10px 12px; border: 2px solid #e0e0e0;
  border-radius: 8px; font-size: 0.95em; transition: border-color 0.3s; box-sizing: border-box;
}
.input-field:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102,126,234,0.1); }

.btn {
  width: 100%; padding: 12px; border: none; border-radius: 8px;
  font-size: 1em; font-weight: 600; cursor: pointer; transition: all 0.3s;
}
.btn-primary { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.btn-primary:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(102,126,234,0.3); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-check { background: #27ae60; color: white; margin-top: 8px; }
.btn-check:hover { background: #219a52; }
.btn-cancel { background: #f0f0f0; color: #666; margin-top: 8px; }
.btn-cancel:hover { background: #e0e0e0; }

.recharge-msg { margin-top: 12px; padding: 10px; border-radius: 8px; background: #f0fff4; color: #2d8a4e; font-size: 0.95em; }
.recharge-msg.error { background: #fff5f5; color: #c0392b; }

.pay-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.pay-modal {
  background: white; padding: 32px; border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3); width: 360px; text-align: center;
}
.pay-modal h4 { font-size: 1.3em; margin-bottom: 12px; color: #333; }
.pay-hint { color: #999; font-size: 0.9em; margin: 8px 0; }
.pay-status-msg { margin-top: 12px; font-size: 0.9em; color: #e74c3c; }
.pay-status-msg.success { color: #27ae60; }

.empty-state { display: flex; align-items: center; justify-content: center; min-height: 200px; color: #999; }
.transaction-list { max-height: 400px; overflow-y: auto; }
.transaction-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px; margin-bottom: 8px; background: #f8f9ff; border-radius: 8px;
}
.tx-left { display: flex; align-items: center; gap: 10px; }
.tx-icon { font-size: 1.2em; }
.tx-desc { font-weight: 600; color: #333; font-size: 0.95em; }
.tx-time { font-size: 0.8em; color: #999; margin-top: 2px; }
.tx-right { text-align: right; }
.tx-amount { display: block; font-weight: 700; font-size: 1em; }
.tx-amount.recharge { color: #2d8a4e; }
.tx-amount.deduct { color: #e74c3c; }
.tx-balance { font-size: 0.8em; color: #999; }

@media (max-width: 1024px) { .wallet-layout { grid-template-columns: 1fr; } }
</style>
