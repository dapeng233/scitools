<template>
  <div class="placeholder-page">
    <div class="placeholder-icon">📚</div>
    <h2>文献助手</h2>
    <p>此功能正在开发中，敬请期待</p>
    <ul class="feature-list">
      <li>PubMed 文献检索</li>
      <li>AI 辅助文献摘要</li>
      <li>文献管理与收藏</li>
      <li>大语言模型对话分析</li>
    </ul>
  </div>
</template>

<style scoped>
.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  color: #666;
}
.placeholder-icon {
  font-size: 4em;
  margin-bottom: 16px;
}
.placeholder-page h2 {
  font-size: 1.5em;
  color: #333;
  margin-bottom: 8px;
}
.placeholder-page p {
  color: #999;
  margin-bottom: 24px;
}
.feature-list {
  list-style: none;
  text-align: left;
}
.feature-list li {
  padding: 8px 0;
  color: #666;
}
.feature-list li::before {
  content: '✦ ';
  color: #667eea;
}
</style>
