const axios = require('axios');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { containsChinese, translateToEnglish } = require('./translator');
const storage = require('./storage');
const config = require('../config');

const GOOGLE_BASE_URL = 'https://generativelanguage.googleapis.com';

// Google 官方 API 支持的模型
const GOOGLE_MODELS = [
  {
    id: 'gemini-2.5-flash-image',
    name: 'Gemini 2.5 Flash Image',
    type: 'image'
  },
  {
    id: 'gemini-3-pro-image-preview',
    name: 'Gemini 3 Pro Image Preview',
    type: 'image'
  }
];

// 生成配置：2.5 不需要 responseModalities，3.0 需要
function getGenerationConfig(model) {
  if (model.startsWith('gemini-2.5')) {
    return {};
  }
  return { responseModalities: ['TEXT', 'IMAGE'] };
}

// 从 API 响应中提取图片（与 dmxapi 相同结构）
function extractImageFromResponse(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (!parts || parts.length === 0) {
    return { error: '无法从 API 响应中提取数据' };
  }
  for (const part of parts) {
    if (part?.inlineData?.data) {
      return {
        type: 'base64',
        mimeType: part.inlineData.mimeType || 'image/png',
        data: part.inlineData.data
      };
    }
  }
  const textPart = parts.find(p => p?.text);
  if (textPart) {
    return { error: 'API 返回了文本而非图片: ' + textPart.text.substring(0, 200) };
  }
  return { error: '无法从 API 响应中提取图片数据' };
}

// 构建 axios 请求配置（含代理支持）
function buildAxiosConfig(timeout, proxyUrl) {
  const cfg = {
    headers: { 'Content-Type': 'application/json' },
    timeout,
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  };
  const proxy = proxyUrl || process.env.https_proxy || process.env.HTTPS_PROXY;
  if (proxy) {
    cfg.httpsAgent = new HttpsProxyAgent(proxy);
    cfg.proxy = false;
  }
  return cfg;
}

// 文生图
async function textToImage(prompt, model, apiKey, userId, proxyUrl) {
  const finalPrompt = containsChinese(prompt)
    ? await translateToEnglish(prompt, apiKey, true)
    : prompt;

  const url = `${GOOGLE_BASE_URL}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    contents: [{ parts: [{ text: finalPrompt }] }],
    generationConfig: getGenerationConfig(model)
  }, buildAxiosConfig(config.timeout.textToImage, proxyUrl));

  const imageData = extractImageFromResponse(response.data);
  if (imageData.error) throw new Error(imageData.error);

  const usage = response.data?.usageMetadata || {};
  const filename = storage.saveImageFile(imageData.data, imageData.mimeType);

  const result = {
    type: 'text-to-image', prompt, model,
    imageFile: filename, status: 'success', usage,
    cost: { type: 'free', totalCost: 0, description: '免费（Google API）' }
  };
  storage.saveHistory(result, userId);
  return { ...result, imageUrl: `/images/${filename}` };
}

// 图生图
async function imageToImage(prompt, model, apiKey, imageBuffer, mimeType, userId, proxyUrl) {
  const base64Image = imageBuffer.toString('base64');

  const translatedPrompt = containsChinese(prompt)
    ? await translateToEnglish(prompt, apiKey, true)
    : prompt;
  const editInstruction = `Edit this image according to the following instruction. You must return the modified image: ${translatedPrompt}`;

  const url = `${GOOGLE_BASE_URL}/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const response = await axios.post(url, {
    contents: [{
      parts: [
        { text: editInstruction },
        { inlineData: { mimeType, data: base64Image } }
      ]
    }],
    generationConfig: getGenerationConfig(model)
  }, buildAxiosConfig(config.timeout.imageToImage, proxyUrl));

  const imageData = extractImageFromResponse(response.data);
  if (imageData.error) throw new Error(imageData.error);

  const usage = response.data?.usageMetadata || {};
  const filename = storage.saveImageFile(imageData.data, imageData.mimeType);

  const result = {
    type: 'image-to-image', prompt, model,
    imageFile: filename, status: 'success', usage,
    cost: { type: 'free', totalCost: 0, description: '免费（Google API）' }
  };
  storage.saveHistory(result, userId);
  return { ...result, imageUrl: `/images/${filename}` };
}

module.exports = { GOOGLE_MODELS, textToImage, imageToImage };
