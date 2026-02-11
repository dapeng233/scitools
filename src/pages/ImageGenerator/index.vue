<template>
  <div class="image-generator">
    <h2 class="page-title">🎨 AI 作图</h2>
    <div class="generator-layout">
      <!-- 左侧：输入面板 -->
      <div class="panel input-panel">
        <h3>生成设置</h3>

        <!-- 计费模式切换 -->
        <div class="form-group">
          <label>使用方式</label>
          <div class="mode-switch">
            <button
              class="mode-btn"
              :class="{ active: billingMode === 'wallet' }"
              @click="switchMode('wallet')"
            >💰 余额模式</button>
            <button
              class="mode-btn"
              :class="{ active: billingMode === 'google' }"
              @click="switchMode('google')"
            >🔑 Google API</button>
          </div>
        </div>

        <!-- 余额模式信息 -->
        <div v-if="billingMode === 'wallet'" class="form-group">
          <div class="wallet-info">
            <span class="wallet-balance">余额: ￥{{ walletBalance.toFixed(2) }}</span>
            <span class="wallet-price">每张约 ￥0.3~0.5</span>
            <router-link to="/wallet" class="wallet-link">充值</router-link>
          </div>
        </div>

        <!-- Google API 模式 -->
        <div v-if="billingMode === 'google'" class="form-group">
          <label>Google API Key *</label>
          <input v-model="googleApiKey" type="password" placeholder="输入你的 Google AI Studio API Key" class="input-field" />
          <small>从 <a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a> 获取，免费使用，密钥仅用于本次请求</small>
        </div>
        <div v-if="billingMode === 'google'" class="form-group">
          <label>代理地址（国内必填）</label>
          <input v-model="googleProxy" type="text" placeholder="http://127.0.0.1:7890" class="input-field" />
          <small>填写本地代理地址，如 Clash 默认 7890、V2Ray 默认 10809</small>
        </div>

        <!-- 模型选择 -->
        <div class="form-group">
          <label>选择模型 *</label>
          <select v-model="selectedModel" class="input-field">
            <option v-for="m in models" :key="m.id" :value="m.id">
              {{ m.name }} {{ formatPricing(m.pricing) }}
            </option>
          </select>
        </div>

        <!-- 生成方式 -->
        <div class="form-group">
          <label>生成方式 *</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" v-model="mode" value="text" /> 文生图
            </label>
            <label class="radio-label">
              <input type="radio" v-model="mode" value="image" /> 图生图
            </label>
          </div>
        </div>

        <!-- 文生图输入 -->
        <div v-if="mode === 'text'" class="form-group">
          <label>提示词 *</label>
          <textarea v-model="prompt" placeholder="描述你想要生成的图片..." class="input-field textarea" rows="4"></textarea>
          <small>支持中文，系统会自动翻译为英文</small>
        </div>

        <!-- 图生图输入 -->
        <div v-if="mode === 'image'" class="form-group">
          <label>上传图片 *</label>
          <div
            class="file-upload-area"
            @click="$refs.fileInput.click()"
            @dragover.prevent="dragOver = true"
            @dragleave="dragOver = false"
            @drop.prevent="handleDrop"
            :class="{ 'drag-over': dragOver }"
          >
            <p>点击选择图片或拖拽到此处</p>
            <small>支持 JPG、PNG、WebP 等格式</small>
          </div>
          <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="handleFileSelect" />
          <div v-if="imagePreview" class="image-preview">
            <img :src="imagePreview" alt="预览" />
          </div>

          <label style="margin-top: 12px">处理提示词 *</label>
          <textarea v-model="imagePrompt" placeholder="描述你想对图片进行的处理..." class="input-field textarea" rows="4"></textarea>
        </div>

        <!-- 生成按钮 -->
        <button class="btn btn-primary" @click="handleGenerate" :disabled="generating">
          {{ generating ? '⏳ 生成中...' : '🎨 生成图片' }}
        </button>
      </div>

      <!-- 右侧：结果面板 -->
      <div class="panel result-panel">
        <div class="tabs">
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'result' }"
            @click="activeTab = 'result'"
          >生成结果</button>
          <button
            class="tab-btn"
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'; loadHistory()"
          >历史记录</button>
        </div>

        <!-- 结果 -->
        <div v-if="activeTab === 'result'" class="result-area">
          <div v-if="errorMsg" class="error-message">❌ {{ errorMsg }}</div>
          <div v-else-if="result" class="result-content">
            <div class="result-image">
              <img :src="result.imageUrl" alt="生成的图片" />
            </div>
            <div class="result-info">
              <p><strong>模型:</strong> {{ result.model }}</p>
              <p><strong>提示词:</strong> {{ result.prompt }}</p>
              <p v-if="result.cost">
                <strong>本次费用:</strong>
                <span class="cost-tag">￥{{ result.cost.totalCost }}</span>
                {{ result.cost.description }}
              </p>
            </div>
            <div class="result-actions">
              <a :href="result.imageUrl" download="generated-image.png" class="btn btn-secondary">💾 下载图片</a>
              <a :href="result.imageUrl" target="_blank" class="btn btn-secondary">🔗 新标签页打开</a>
              <router-link :to="'/canvas?image=' + encodeURIComponent(result.imageUrl)" class="btn btn-secondary">✏️ 编辑图片</router-link>
            </div>
            <div v-if="result.walletInfo" class="wallet-deduct-info">
              本次扣费 ￥{{ result.walletInfo.charged }} · 剩余余额 ￥{{ result.walletInfo.balance.toFixed(2) }}
            </div>
          </div>
          <div v-else-if="generating" class="empty-state">
            <p>{{ statusText }}</p>
          </div>
          <div v-else class="empty-state">
            <p>填写左侧表单并点击"生成图片"</p>
          </div>
        </div>

        <!-- 历史记录 -->
        <div v-if="activeTab === 'history'" class="history-area">
          <div v-if="history.length === 0" class="empty-state">
            <p>暂无历史记录</p>
          </div>
          <div v-else class="history-list">
            <div
              v-for="(item, idx) in history"
              :key="idx"
              class="history-item"
              @click="viewHistoryItem(item)"
            >
              <img :src="item.imageUrl" alt="缩略图" class="history-thumb" />
              <div class="history-info">
                <p class="history-prompt">{{ item.prompt }}</p>
                <p class="history-meta">{{ item.model }} · {{ formatTime(item.timestamp) }}</p>
              </div>
            </div>
          </div>
          <button v-if="history.length > 0" class="btn btn-secondary" @click="clearHistory">清空历史</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { api } from '@/utils/api';

const route = useRoute();

const googleApiKey = ref('');
const googleProxy = ref('');
const billingMode = ref('wallet');
const walletBalance = ref(0);
const selectedModel = ref('');
const mode = ref('text');
const prompt = ref('');
const imagePrompt = ref('');
const models = ref([]);
const generating = ref(false);
const result = ref(null);
const errorMsg = ref('');
const activeTab = ref('result');
const history = ref([]);
const statusText = ref('⏳ 生成中...');
const dragOver = ref(false);
const imagePreview = ref('');
const selectedFile = ref(null);

onMounted(() => {
  loadModels();
  loadWalletBalance();
  // 从画板跳转过来时，自动加载编辑后的图片
  if (route.query.from === 'canvas') {
    const dataUrl = sessionStorage.getItem('canvasImage');
    if (dataUrl) {
      mode.value = 'image';
      imagePreview.value = dataUrl;
      // 将 dataUrl 转为 File 对象
      fetch(dataUrl).then(r => r.blob()).then(blob => {
        selectedFile.value = new File([blob], 'canvas_edit.png', { type: 'image/png' });
      });
      sessionStorage.removeItem('canvasImage');
    }
  }
});

async function loadWalletBalance() {
  try {
    const data = await api.get('/api/wallet/balance');
    walletBalance.value = data.balance || 0;
  } catch (e) {
    console.error('加载余额失败:', e);
  }
}

async function loadModels() {
  try {
    const provider = billingMode.value === 'google' ? 'google' : 'wallet';
    const data = await api.get(`/api/models?provider=${provider}`);
    models.value = data;
    if (data.length > 0) selectedModel.value = data[0].id;
  } catch (e) {
    console.error('加载模型失败:', e);
  }
}

function switchMode(newMode) {
  billingMode.value = newMode;
  loadModels();
}

function formatPricing(pricing) {
  if (!pricing) return '';
  return pricing.type === 'per_request'
    ? `（￥${pricing.price}/次）`
    : '（按 token 计费）';
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile.value = file;
  const reader = new FileReader();
  reader.onload = (ev) => { imagePreview.value = ev.target.result; };
  reader.readAsDataURL(file);
}

function handleDrop(e) {
  dragOver.value = false;
  const file = e.dataTransfer.files[0];
  if (file) {
    selectedFile.value = file;
    const reader = new FileReader();
    reader.onload = (ev) => { imagePreview.value = ev.target.result; };
    reader.readAsDataURL(file);
  }
}

function compressImage(file, maxWidth = 1024, quality = 0.8) {
  return new Promise((resolve) => {
    if (file.size < 500 * 1024) { resolve(file); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round(h * maxWidth / w); w = maxWidth; }
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/jpeg' }));
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handleGenerate() {
  if (billingMode.value === 'google' && !googleApiKey.value.trim()) { errorMsg.value = '请输入 Google API Key'; return; }
  if (billingMode.value === 'wallet' && walletBalance.value < 0.35) { errorMsg.value = '余额不足，请先充值'; return; }
  if (!selectedModel.value) { errorMsg.value = '请选择模型'; return; }

  if (mode.value === 'text') {
    if (!prompt.value.trim()) { errorMsg.value = '请输入提示词'; return; }
    await generateTextToImage();
  } else {
    if (!selectedFile.value) { errorMsg.value = '请上传图片'; return; }
    if (!imagePrompt.value.trim()) { errorMsg.value = '请输入处理提示词'; return; }
    await generateImageToImage();
  }
}

async function generateTextToImage() {
  generating.value = true;
  result.value = null;
  errorMsg.value = '';
  activeTab.value = 'result';
  statusText.value = '⏳ 正在生成图片...';
  try {
    const body = { model: selectedModel.value, prompt: prompt.value };
    if (billingMode.value === 'google') {
      body.provider = 'google';
      body.googleApiKey = googleApiKey.value;
      if (googleProxy.value.trim()) body.proxyUrl = googleProxy.value.trim();
    } else {
      body.provider = 'wallet';
      body.useWallet = true;
    }
    const data = await api.post('/api/text-to-image', body);
    result.value = data;
    if (data.walletInfo) walletBalance.value = data.walletInfo.balance;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    generating.value = false;
  }
}

async function generateImageToImage() {
  generating.value = true;
  result.value = null;
  errorMsg.value = '';
  activeTab.value = 'result';
  statusText.value = '⏳ 正在压缩图片并上传...';
  try {
    const compressed = await compressImage(selectedFile.value);
    statusText.value = '⏳ 图片已上传，等待 API 生成中...';
    const formData = new FormData();
    formData.append('model', selectedModel.value);
    formData.append('prompt', imagePrompt.value);
    formData.append('image', compressed);
    if (billingMode.value === 'google') {
      formData.append('provider', 'google');
      formData.append('googleApiKey', googleApiKey.value);
      if (googleProxy.value.trim()) formData.append('proxyUrl', googleProxy.value.trim());
    } else {
      formData.append('provider', 'wallet');
      formData.append('useWallet', 'true');
    }
    const data = await api.postForm('/api/image-to-image', formData);
    result.value = data;
    if (data.walletInfo) walletBalance.value = data.walletInfo.balance;
  } catch (e) {
    errorMsg.value = e.message;
  } finally {
    generating.value = false;
  }
}

async function loadHistory() {
  try {
    const data = await api.get('/api/history');
    history.value = data;
  } catch (e) {
    console.error('加载历史失败:', e);
  }
}

function viewHistoryItem(item) {
  result.value = item;
  errorMsg.value = '';
  activeTab.value = 'result';
}

async function clearHistory() {
  if (!confirm('确定要清除所有历史记录吗？')) return;
  try {
    await api.delete('/api/history');
    history.value = [];
  } catch (e) {
    alert('清除失败: ' + e.message);
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleString();
}
</script>

<style scoped>
.page-title {
  font-size: 1.6em;
  color: #333;
  margin-bottom: 20px;
}

.generator-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
}

.panel h3 {
  font-size: 1.2em;
  margin-bottom: 18px;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #333;
  font-size: 0.95em;
}

.form-group small {
  display: block;
  margin-top: 4px;
  color: #999;
  font-size: 0.85em;
}

.input-field {
  width: 100%;
  padding: 10px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.95em;
  transition: border-color 0.3s;
  font-family: inherit;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.radio-group {
  display: flex;
  gap: 20px;
}

.radio-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 6px;
}

.radio-label input[type="radio"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.file-upload-area {
  border: 2px dashed #667eea;
  border-radius: 8px;
  padding: 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8f9ff;
}

.file-upload-area:hover, .file-upload-area.drag-over {
  background: #f0f2ff;
  border-color: #764ba2;
}

.file-upload-area p {
  color: #333;
  font-weight: 600;
  margin-bottom: 4px;
}

.image-preview {
  margin-top: 12px;
  text-align: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 180px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 1em;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
  margin-top: 12px;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

/* 标签页 */
.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 2px solid #e0e0e0;
}

.tab-btn {
  padding: 8px 18px;
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 600;
  color: #999;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
}

.tab-btn.active {
  color: #667eea;
  border-bottom-color: #667eea;
}

/* 结果区域 */
.result-area, .history-area {
  min-height: 300px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: #999;
  font-size: 1.05em;
}

.error-message {
  padding: 16px;
  background: #fff5f5;
  border-left: 4px solid #e74c3c;
  border-radius: 8px;
  color: #c0392b;
}

.result-image {
  text-align: center;
}

.result-image img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  object-fit: contain;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.result-info {
  margin-top: 14px;
  padding: 14px;
  background: #f8f9ff;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.result-info p {
  margin: 6px 0;
  color: #666;
  font-size: 0.95em;
}

.result-info strong {
  color: #333;
}

.cost-tag {
  display: inline-block;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9em;
}

.result-actions {
  display: flex;
  gap: 10px;
  margin-top: 12px;
}

.result-actions .btn {
  flex: 1;
}

/* 历史记录 */
.history-list {
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9ff;
  border-radius: 8px;
  border-left: 4px solid #667eea;
  cursor: pointer;
  transition: all 0.2s;
}

.history-item:hover {
  background: #f0f2ff;
  transform: translateX(4px);
}

.history-thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
  background: #e0e0e0;
}

.history-prompt {
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 280px;
}

.history-meta {
  font-size: 0.85em;
  color: #999;
  margin-top: 4px;
}

@media (max-width: 1024px) {
  .generator-layout {
    grid-template-columns: 1fr;
  }
}

/* 计费模式切换 */
.mode-switch {
  display: flex;
  gap: 8px;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 4px;
}

.mode-btn {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9em;
  color: #666;
  transition: all 0.3s;
}

.mode-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.wallet-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f0fff4;
  border-radius: 8px;
  border-left: 4px solid #48bb78;
}

.wallet-balance {
  font-weight: 700;
  color: #2d8a4e;
  font-size: 1.05em;
}

.wallet-price {
  color: #999;
  font-size: 0.85em;
}

.wallet-link {
  margin-left: auto;
  color: #667eea;
  font-weight: 600;
  text-decoration: none;
  font-size: 0.9em;
}

.wallet-link:hover {
  text-decoration: underline;
}

.wallet-deduct-info {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fff8e1;
  border-left: 4px solid #ffc107;
  border-radius: 6px;
  color: #666;
  font-size: 0.9em;
}
</style>
