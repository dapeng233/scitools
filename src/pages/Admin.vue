<template>
  <div class="admin-page">
    <!-- 管理员登录 -->
    <div v-if="!authenticated" class="admin-login">
      <div class="login-card">
        <h2>管理员后台</h2>
        <p>请输入管理员密钥</p>
        <input
          v-model="adminKey"
          type="password"
          placeholder="Admin Key"
          class="input-field"
          @keydown.enter="login"
        />
        <button class="btn btn-primary" @click="login" :disabled="loading">
          {{ loading ? '验证中...' : '登录' }}
        </button>
        <p v-if="error" class="error-msg">{{ error }}</p>
      </div>
    </div>

    <!-- 管理后台内容 -->
    <div v-else class="admin-content">
      <div class="admin-header">
        <h2>充值码管理</h2>
        <button class="btn btn-secondary" @click="logout">退出登录</button>
      </div>

      <!-- 生成充值码 -->
      <div class="panel">
        <h3>生成充值码 <span class="discount-info">🎉 当前优惠: 8折</span></h3>
        <div class="form-row">
          <div class="form-group">
            <label>金额 (元)</label>
            <input v-model.number="generateAmount" type="number" min="1" step="1" class="input-field" />
            <div class="price-calc" v-if="generateAmount > 0">
              <span class="calc-item">原价: <strong>￥{{ (generateAmount / 0.8).toFixed(2) }}</strong></span>
              <span class="calc-item discount">8折优惠: <strong>￥{{ generateAmount }}</strong></span>
              <span class="calc-item save">节省: ￥{{ (generateAmount / 0.8 - generateAmount).toFixed(2) }}</span>
            </div>
          </div>
          <div class="form-group">
            <label>数量</label>
            <input v-model.number="generateCount" type="number" min="1" max="100" class="input-field" />
          </div>
          <button class="btn btn-primary" @click="generateCodes" :disabled="generating">
            {{ generating ? '生成中...' : '生成' }}
          </button>
        </div>
        <p v-if="generateMsg" class="success-msg">{{ generateMsg }}</p>

        <!-- 新生成的充值码 -->
        <div v-if="newCodes.length > 0" class="new-codes">
          <h4>新生成的充值码：</h4>
          <div class="code-list">
            <div v-for="c in newCodes" :key="c.code" class="code-item">
              <code>{{ c.code }}</code>
              <span class="code-amount">￥{{ c.amount }}</span>
              <button class="btn-copy" @click="copyCode(c.code)">复制</button>
            </div>
          </div>
          <button class="btn btn-secondary" @click="copyAllCodes">复制全部</button>
        </div>
      </div>

      <!-- 充值码列表 -->
      <div class="panel">
        <h3>所有充值码</h3>
        <div class="filter-row">
          <label>
            <input type="checkbox" v-model="showUsed" /> 显示已使用
          </label>
          <button class="btn btn-secondary" @click="loadCodes">刷新</button>
        </div>
        <div v-if="codes.length === 0" class="empty-state">暂无充值码</div>
        <table v-else class="codes-table">
          <thead>
            <tr>
              <th>充值码</th>
              <th>金额</th>
              <th>状态</th>
              <th>使用者</th>
              <th>创建时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filteredCodes" :key="c.id" :class="{ used: c.used }">
              <td><code>{{ c.code }}</code></td>
              <td>￥{{ c.amount }}</td>
              <td>
                <span class="status-tag" :class="c.used ? 'used' : 'unused'">
                  {{ c.used ? '已使用' : '未使用' }}
                </span>
              </td>
              <td>{{ c.used_by_email || '-' }}</td>
              <td>{{ formatTime(c.created_at) }}</td>
              <td>
                <button v-if="!c.used" class="btn-delete" @click="deleteCode(c.id)">删除</button>
                <span v-else class="text-muted">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const adminKey = ref('');
const authenticated = ref(false);
const loading = ref(false);
const error = ref('');
const generating = ref(false);
const generateMsg = ref('');
const generateAmount = ref(10);
const generateCount = ref(1);
const newCodes = ref([]);
const codes = ref([]);
const showUsed = ref(false);

const filteredCodes = computed(() => {
  if (showUsed.value) return codes.value;
  return codes.value.filter(c => !c.used);
});

async function login() {
  if (!adminKey.value.trim()) {
    error.value = '请输入管理员密钥';
    return;
  }
  loading.value = true;
  error.value = '';
  try {
    const res = await fetch('/api/admin/codes', {
      headers: {
        'X-Admin-Key': adminKey.value
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '验证失败');
    }
    authenticated.value = true;
    localStorage.setItem('adminKey', adminKey.value);
    codes.value = await res.json();
  } catch (e) {
    error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function logout() {
  authenticated.value = false;
  localStorage.removeItem('adminKey');
  adminKey.value = '';
}

async function loadCodes() {
  try {
    const res = await fetch('/api/admin/codes', {
      headers: {
        'X-Admin-Key': localStorage.getItem('adminKey')
      }
    });
    if (res.ok) {
      codes.value = await res.json();
    }
  } catch (e) {
    console.error('加载充值码失败', e);
  }
}

async function generateCodes() {
  if (generateAmount.value <= 0) {
    alert('请输入有效金额');
    return;
  }
  generating.value = true;
  generateMsg.value = '';
  newCodes.value = [];
  try {
    const res = await fetch('/api/admin/generate-codes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Key': localStorage.getItem('adminKey')
      },
      body: JSON.stringify({
        amount: generateAmount.value,
        count: generateCount.value
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '生成失败');
    generateMsg.value = data.message;
    newCodes.value = data.codes;
    await loadCodes();
  } catch (e) {
    alert(e.message);
  } finally {
    generating.value = false;
  }
}

async function deleteCode(id) {
  if (!confirm('确定删除此充值码？')) return;
  try {
    const res = await fetch(`/api/admin/codes/${id}`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': localStorage.getItem('adminKey')
      }
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || '删除失败');
    }
    await loadCodes();
  } catch (e) {
    alert(e.message);
  }
}

function copyCode(code) {
  navigator.clipboard.writeText(code);
  alert('已复制: ' + code);
}

function copyAllCodes() {
  const text = newCodes.value.map(c => `${c.code} (￥${c.amount})`).join('\n');
  navigator.clipboard.writeText(text);
  alert('已复制全部充值码');
}

function formatTime(ts) {
  if (!ts) return '-';
  return new Date(ts).toLocaleString();
}

onMounted(() => {
  const saved = localStorage.getItem('adminKey');
  if (saved) {
    adminKey.value = saved;
    login();
  }
});
</script>

<style scoped>
.admin-page {
  max-width: 900px;
  margin: 0 auto;
}

.admin-login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.login-card {
  background: var(--bg-card);
  padding: 40px;
  border-radius: 12px;
  text-align: center;
  width: 360px;
  box-shadow: var(--shadow-card);
}

.login-card h2 {
  margin-bottom: 8px;
  color: var(--text-primary);
}

.login-card p {
  color: var(--text-muted);
  margin-bottom: 20px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.admin-header h2 {
  color: var(--text-primary);
  font-size: 1.3em;
}

.panel {
  background: var(--bg-card);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
}

.panel h3 {
  font-size: 1em;
  margin-bottom: 14px;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 8px;
}

.form-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.form-group {
  flex: 1;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 600;
  color: var(--text-primary);
  font-size: 0.9em;
}

.input-field {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.9em;
  background: var(--bg-input);
  color: var(--text-primary);
}

.input-field:focus {
  outline: none;
  border-color: var(--accent);
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: var(--accent);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.85;
}

.btn-primary:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-tag);
  color: var(--text-primary);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.error-msg {
  color: #e74c3c;
  margin-top: 12px;
  font-size: 0.9em;
}

.success-msg {
  color: #27ae60;
  margin-top: 12px;
  font-size: 0.9em;
}

.new-codes {
  margin-top: 16px;
  padding: 14px;
  background: var(--bg-info);
  border-radius: 8px;
}

.new-codes h4 {
  font-size: 0.95em;
  margin-bottom: 10px;
  color: var(--text-primary);
}

.code-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.code-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--bg-card);
  border-radius: 6px;
}

.code-item code {
  font-family: monospace;
  font-size: 0.95em;
  color: var(--text-primary);
}

.code-amount {
  color: var(--text-muted);
  font-size: 0.85em;
}

.btn-copy {
  margin-left: auto;
  padding: 4px 10px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 0.8em;
  cursor: pointer;
}

.btn-copy:hover {
  background: var(--bg-card-hover);
}

.filter-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.filter-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.9em;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.codes-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9em;
}

.codes-table th, .codes-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.codes-table th {
  font-weight: 600;
  color: var(--text-primary);
  background: var(--bg-info);
}

.codes-table td {
  color: var(--text-secondary);
}

.codes-table code {
  font-family: monospace;
  color: var(--text-primary);
}

.codes-table tr.used {
  opacity: 0.6;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.status-tag.unused {
  background: var(--bg-success);
  color: #27ae60;
}

.status-tag.used {
  background: var(--bg-tag);
  color: var(--text-muted);
}

.btn-delete {
  padding: 4px 10px;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  background: transparent;
  color: #e74c3c;
  font-size: 0.8em;
  cursor: pointer;
}

.btn-delete:hover {
  background: #fdf0f0;
}

.text-muted {
  color: var(--text-muted);
}

.discount-info {
  font-size: 0.75em;
  font-weight: 600;
  color: #ee5a24;
  margin-left: 8px;
}

.price-calc {
  margin-top: 8px;
  padding: 10px;
  background: var(--bg-info);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85em;
}

.calc-item {
  color: var(--text-secondary);
}

.calc-item strong {
  color: var(--text-primary);
}

.calc-item.discount {
  color: #27ae60;
}

.calc-item.discount strong {
  color: #27ae60;
}

.calc-item.save {
  color: #ee5a24;
  font-weight: 600;
}
</style>
