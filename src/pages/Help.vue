<template>
  <div class="help-page">
    <h2 class="page-title">📖 使用帮助</h2>

    <!-- 获取 API 密钥 -->
    <div class="help-panel">
      <h3>🔑 获取 API 密钥</h3>
      <div class="step" v-for="(s, i) in steps" :key="i">
        <div class="step-num">{{ i + 1 }}</div>
        <div class="step-content" v-html="s"></div>
      </div>
      <div class="tip-box">
        💡 API Key 只会显示一次，请妥善保存。丢失了可以重新创建。
      </div>
    </div>

    <!-- 模型价格 -->
    <div class="help-panel">
      <h3>💰 模型价格说明</h3>
      <table class="price-table">
        <thead>
          <tr><th>模型</th><th>计费方式</th><th>价格</th></tr>
        </thead>
        <tbody>
          <tr>
            <td>Gemini 2.5 Flash Image</td>
            <td>按次计费</td>
            <td>￥0.25 / 次</td>
          </tr>
          <tr>
            <td>Gemini 3 Pro Image Preview</td>
            <td>按 Token 计费</td>
            <td>输入 ￥5.84 / M tokens<br/>输出 ￥350.4 / M tokens</td>
          </tr>
        </tbody>
      </table>
      <div class="tip-box">
        💡 Gemini 2.5 固定 ￥0.25/次，适合日常使用；Gemini 3 效果更好但输出价格较高。
      </div>
    </div>

    <!-- 使用说明 -->
    <div class="help-panel">
      <h3>🎨 使用说明</h3>
      <p><strong>文生图：</strong>选择「文生图」模式，输入描述，点击生成。支持中文（自动翻译）。</p>
      <p style="margin-top:12px"><strong>图生图：</strong>选择「图生图」模式，上传图片，描述修改内容，点击生成。</p>
      <div class="tip-box">
        💡 图片生成需要一定时间，请耐心等待。超时可换模型或简化提示词。
      </div>
    </div>
  </div>
</template>

<script setup>
const steps = [
  '打开 <a href="https://www.dmxapi.cn/rmb" target="_blank">dmxapi 官网</a>，注册账号并登录。',
  '点击右上角头像，选择「余额充值」，充值所需金额。',
  '在左侧菜单找到「API 令牌」，点击「添加令牌」创建 API Key。',
  '复制生成的 API Key（以 <code>sk-</code> 开头），粘贴到 AI 作图页面的密钥输入框中。'
];
</script>

<style scoped>
.page-title {
  font-size: 1.6em;
  color: #333;
  margin-bottom: 20px;
}

.help-panel {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  margin-bottom: 16px;
}

.help-panel h3 {
  font-size: 1.2em;
  color: #333;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
  margin-bottom: 16px;
}

.help-panel p {
  color: #555;
  line-height: 1.8;
}

.step {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
  padding: 14px;
  background: #f8f9ff;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.step-num {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.step-content {
  flex: 1;
  color: #555;
  line-height: 1.6;
  align-self: center;
}

.step-content :deep(a) {
  color: #667eea;
  font-weight: 600;
}

.price-table {
  width: 100%;
  border-collapse: collapse;
  margin: 12px 0;
}

.price-table th, .price-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.price-table th {
  background: #f0f2ff;
  color: #333;
  font-weight: 600;
}

.price-table td {
  color: #555;
}

.tip-box {
  background: #fff8e1;
  border-left: 4px solid #ffc107;
  padding: 12px 16px;
  border-radius: 6px;
  margin-top: 14px;
  color: #666;
  font-size: 0.95em;
}
</style>
