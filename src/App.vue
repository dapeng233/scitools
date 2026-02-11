<template>
  <!-- 登录遮罩 -->
  <LoginOverlay v-if="!authStore.authenticated" @login-success="onLoginSuccess" />

  <!-- 主应用 -->
  <div v-else class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1 class="app-title">SciTools</h1>
        <p class="app-subtitle">科研工具箱</p>
      </div>
      <nav class="sidebar-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ disabled: item.disabled }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.disabled" class="nav-badge">即将推出</span>
        </router-link>
      </nav>
      <div class="sidebar-footer">
        <router-link to="/help" class="nav-item">
          <span class="nav-icon">📖</span>
          <span class="nav-label">使用帮助</span>
        </router-link>
      </div>
    </aside>
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import LoginOverlay from '@/components/LoginOverlay.vue';

const authStore = useAuthStore();

const navItems = ref([
  { path: '/image-generator', icon: '🎨', label: 'AI 作图', disabled: false },
  { path: '/canvas', icon: '✏️', label: '图片编辑', disabled: false },
  { path: '/wallet', icon: '💰', label: '我的钱包', disabled: false },
  { path: '/sci-chart', icon: '📊', label: '科研绘图', disabled: true },
  { path: '/literature', icon: '📚', label: '文献助手', disabled: true }
]);

onMounted(async () => {
  await authStore.checkAuth();
});

function onLoginSuccess() {
  // 登录成功后 authStore.authenticated 已更新
}
</script>
