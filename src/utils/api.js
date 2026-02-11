import { useAuthStore } from '@/stores/auth';

async function request(url, options = {}) {
  const auth = useAuthStore();
  const headers = { ...options.headers };
  if (auth.token) {
    headers['x-auth-token'] = auth.token;
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `请求失败 (${res.status})`);
  }
  return data;
}

export const api = {
  get(url) {
    return request(url);
  },
  post(url, body) {
    return request(url, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },
  postForm(url, formData) {
    return request(url, {
      method: 'POST',
      body: formData
    });
  },
  delete(url) {
    return request(url, { method: 'DELETE' });
  }
};
