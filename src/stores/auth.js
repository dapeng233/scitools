import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '@/utils/api';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('authToken') || '');
  const authenticated = ref(false);
  const user = ref(null);

  const nickname = computed(() => user.value?.nickname || '');
  const balance = computed(() => user.value?.balance || 0);

  async function checkAuth() {
    if (!token.value) return false;
    try {
      const data = await api.get('/api/auth/check-auth');
      authenticated.value = data.authenticated;
      if (data.authenticated && data.user) {
        user.value = data.user;
      } else {
        token.value = '';
        user.value = null;
        localStorage.removeItem('authToken');
      }
      return data.authenticated;
    } catch {
      return false;
    }
  }

  async function login(email, password) {
    const data = await api.post('/api/auth/login', { email, password });
    if (data.token) {
      token.value = data.token;
      authenticated.value = true;
      user.value = { id: data.userId, email: data.email, nickname: data.nickname, balance: data.balance };
      localStorage.setItem('authToken', data.token);
      return true;
    }
    throw new Error(data.error || '登录失败');
  }

  async function register(email, password, code, nickname) {
    const data = await api.post('/api/auth/register', { email, password, code, nickname });
    if (data.token) {
      token.value = data.token;
      authenticated.value = true;
      user.value = { id: data.userId, email: data.email, nickname: data.nickname, balance: 0 };
      localStorage.setItem('authToken', data.token);
      return true;
    }
    throw new Error(data.error || '注册失败');
  }

  async function sendCode(email, purpose = 'register') {
    return await api.post('/api/auth/send-code', { email, purpose });
  }

  async function resetPassword(email, password, code) {
    return await api.post('/api/auth/reset-password', { email, password, code });
  }

  function logout() {
    token.value = '';
    authenticated.value = false;
    user.value = null;
    localStorage.removeItem('authToken');
  }

  return {
    token, authenticated, user, nickname, balance,
    checkAuth, login, register, sendCode, resetPassword, logout
  };
});
