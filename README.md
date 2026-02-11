# SciTools - 科研工具箱

AI 驱动的科研作图桌面应用，基于 Gemini 模型实现文生图和图生图功能。

An AI-powered scientific illustration desktop app built with Electron + Vue 3 + Express, featuring text-to-image and image-to-image generation via Gemini models.

---

## 功能 / Features

- **文生图** — 输入文字描述，AI 生成图片（支持中文，自动翻译）
- **图生图** — 上传图片 + 文字指令，AI 编辑修改图片
- **画板编辑** — 内置画板，可对生成的图片进行标注和编辑
- **双模式支持**：
  - 💰 余额模式 — 通过 dmxapi 代理调用，按 token 计费
  - 🔑 Google API — 使用自己的 Google AI Studio API Key，免费调用
- **用户系统** — 邮箱注册登录，JWT 鉴权
- **钱包系统** — 余额充值与扣费记录

- **Text-to-Image** — Describe what you want, AI generates it (Chinese auto-translated)
- **Image-to-Image** — Upload an image + text instruction, AI edits it
- **Canvas Editor** — Built-in canvas for annotating and editing generated images
- **Dual Mode**:
  - 💰 Balance Mode — Via dmxapi proxy, token-based billing
  - 🔑 Google API — Use your own Google AI Studio API Key for free
- **User System** — Email registration & login with JWT auth
- **Wallet System** — Balance top-up and transaction history

---

## 技术栈 / Tech Stack

- **前端**: Vue 3 + Vite + Vue Router + Pinia
- **后端**: Express + better-sqlite3 + JWT
- **桌面**: Electron
- **AI**: Google Gemini API (via dmxapi proxy or direct)

---

## 快速开始 / Quick Start

### 1. 克隆项目 / Clone

```bash
git clone https://github.com/dapeng233/scitools.git
cd scitools-app
```

### 2. 安装依赖 / Install

```bash
npm install
```

### 3. 配置环境变量 / Configure

```bash
cp .env.example .env
```

编辑 `.env`，填入你的配置（API Key、SMTP 等）。
Edit `.env` with your own config (API Key, SMTP, etc.).

### 4. 启动开发模式 / Dev Mode

```bash
# Web 模式（浏览器访问）
npm run dev

# Electron 桌面模式
npm run electron:dev
```

### 5. 构建桌面应用 / Build

```bash
npm run electron:build
```

---

## 使用方式 / Usage

### 余额模式（Balance Mode）

站长在 `.env` 中配置 `OWNER_API_KEY`（dmxapi 密钥），用户通过充值余额使用，按 token 计费。

The admin configures `OWNER_API_KEY` in `.env` (dmxapi key). Users top up their balance and pay per token.

### Google API 模式

用户自行从 [Google AI Studio](https://aistudio.google.com/apikey) 获取免费 API Key，在界面中填入即可使用。国内用户需填写本地代理地址（如 `http://127.0.0.1:7890`）。

Users get a free API Key from [Google AI Studio](https://aistudio.google.com/apikey) and enter it in the app. Users in China need to provide a local proxy address.

---

## 支持的模型 / Supported Models

| 模型 / Model | 说明 / Description |
|---|---|
| Gemini 2.5 Flash Image | 快速生成，性价比高 / Fast generation, cost-effective |
| Gemini 3 Pro Image Preview | 高质量，支持复杂指令 / High quality, complex instructions |

---

## License

MIT
