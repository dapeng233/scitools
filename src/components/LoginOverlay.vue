<template>
  <div class="login-overlay">
    <div class="login-box">
      <!-- 登录 -->
      <template v-if="mode === 'login'">
        <h2>SciTools</h2>
        <p>科研工具箱 - 登录</p>
        <input v-model="email" type="email" placeholder="邮箱" class="login-input" @keydown.enter="handleLogin" autofocus />
        <input v-model="password" type="password" placeholder="密码" class="login-input" @keydown.enter="handleLogin" />
        <button class="login-btn" @click="handleLogin" :disabled="loading">
          {{ loading ? '登录中...' : '登录' }}
        </button>
        <div class="login-links">
          <a @click="mode = 'register'">注册账号</a>
          <a @click="mode = 'reset'">忘记密码</a>
        </div>
      </template>

      <!-- 注册 -->
      <template v-if="mode === 'register'">
        <h2>注册账号</h2>
        <p>使用邮箱注册</p>
        <input v-model="email" type="email" placeholder="邮箱" class="login-input" />
        <input v-model="nickname" type="text" placeholder="昵称（选填）" class="login-input" />
        <input v-model="password" type="password" placeholder="密码（至少6位）" class="login-input" />
        <div class="code-row">
          <input v-model="code" type="text" placeholder="验证码" class="login-input code-input" maxlength="6" />
          <button class="code-btn" @click="handleSendCode('register')" :disabled="codeCd > 0">
            {{ codeCd > 0 ? `${codeCd}s` : '发送验证码' }}
          </button>
        </div>
        <button class="login-btn" @click="handleRegister" :disabled="loading">
          {{ loading ? '注册中...' : '注册' }}
        </button>
        <div class="login-links">
          <a @click="mode = 'login'">已有账号？去登录</a>
        </div>
      </template>

      <!-- 忘记密码 -->
      <template v-if="mode === 'reset'">
        <h2>重置密码</h2>
        <p>通过邮箱验证码重置</p>
        <input v-model="email" type="email" placeholder="注册邮箱" class="login-input" />
        <div class="code-row">
          <input v-model="code" type="text" placeholder="验证码" class="login-input code-input" maxlength="6" />
          <button class="code-btn" @click="handleSendCode('reset')" :disabled="codeCd > 0">
            {{ codeCd > 0 ? `${codeCd}s` : '发送验证码' }}
          </button>
        </div>
        <input v-model="password" type="password" placeholder="新密码（至少6位）" class="login-input" />
        <button class="login-btn" @click="handleReset" :disabled="loading">
          {{ loading ? '重置中...' : '重置密码' }}
        </button>
        <div class="login-links">
          <a @click="mode = 'login'">返回登录</a>
        </div>
      </template>

      <p v-if="error" class="login-error">{{ error }}</p>
      <p v-if="success" class="login-success">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const emit = defineEmits(['login-success']);
const authStore = useAuthStore();

const mode = ref('login');
const email = ref('');
const password = ref('');
const nickname = ref('');
const code = ref('');
const error = ref('');
const success = ref('');
const loading = ref(false);
const codeCd = ref(0);
let cdTimer = null;

function startCooldown() {
  codeCd.value = 60;
  cdTimer = setInterval(() => {
    codeCd.value--;
    if (codeCd.value <= 0) clearInterval(cdTimer);
  }, 1000);
}

async function handleSendCode(purpose) {
  if (!email.value.trim()) { error.value = '请输入邮箱'; return; }
  error.value = '';
  try {
    await authStore.sendCode(email.value.trim(), purpose);
    success.value = '验证码已发送，请查收邮箱';
    startCooldown();
  } catch (e) {
    error.value = e.message || '发送失败';
  }
}

async function handleLogin() {
  if (!email.value.trim() || !password.value) { error.value = '请输入邮箱和密码'; return; }
  loading.value = true; error.value = ''; success.value = '';
  try {
    await authStore.login(email.value.trim(), password.value);
    emit('login-success');
  } catch (e) {
    error.value = e.message || '登录失败';
  } finally { loading.value = false; }
}

async function handleRegister() {
  if (!email.value.trim() || !password.value || !code.value) {
    error.value = '请填写完整信息'; return;
  }
  loading.value = true; error.value = ''; success.value = '';
  try {
    await authStore.register(email.value.trim(), password.value, code.value, nickname.value.trim());
    emit('login-success');
  } catch (e) {
    error.value = e.message || '注册失败';
  } finally { loading.value = false; }
}

async function handleReset() {
  if (!email.value.trim() || !password.value || !code.value) {
    error.value = '请填写完整信息'; return;
  }
  loading.value = true; error.value = ''; success.value = '';
  try {
    await authStore.resetPassword(email.value.trim(), password.value, code.value);
    success.value = '密码已重置，请登录';
    mode.value = 'login';
    password.value = '';
    code.value = '';
  } catch (e) {
    error.value = e.message || '重置失败';
  } finally { loading.value = false; }
}
</script>

<style scoped>
.login-overlay {
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  text-align: center;
  width: 380px;
}

.login-box h2 { margin-bottom: 6px; color: #333; font-size: 1.6em; }
.login-box > p { color: #666; margin-bottom: 20px; font-size: 0.95em; }

.login-input {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 1em;
  margin-bottom: 12px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.login-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.code-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.code-row .code-input { flex: 1; margin-bottom: 0; }

.code-btn {
  padding: 0 16px;
  border: 2px solid #667eea;
  border-radius: 8px;
  background: white;
  color: #667eea;
  font-weight: 600;
  font-size: 0.85em;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.code-btn:hover:not(:disabled) { background: #f0f2ff; }
.code-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.login-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.login-links {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 20px;
}

.login-links a {
  color: #667eea;
  font-size: 0.9em;
  cursor: pointer;
  text-decoration: none;
}

.login-links a:hover { text-decoration: underline; }

.login-error { color: #e74c3c; margin-top: 12px; font-size: 0.9em; }
.login-success { color: #27ae60; margin-top: 12px; font-size: 0.9em; }
</style>
