import axios, { AxiosAdapter } from 'axios';
import { getAuthToken, removeAuth } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fast in-memory cache for GET requests (5-second TTL)
const cache = new Map<string, { timestamp: number; data: any }>();

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Return cached response if fresh (less than 5 seconds old)
    if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.noCache) {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 5000) {
        config.adapter = (async () => ({
          data: cached.data,
          status: 200,
          statusText: 'OK (Cache)',
          headers: config.headers,
          config,
        })) as AxiosAdapter;
      }
    } else if (config.method && ['post', 'put', 'patch', 'delete'].includes(config.method.toLowerCase())) {
      // Invalidate cache on mutations
      cache.clear();
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => {
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}`;
      cache.set(cacheKey, { timestamp: Date.now(), data: response.data });
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        removeAuth();
        window.location.href = '/login';
      }
    }
    const message =
      error.response?.data?.message ||
      (Array.isArray(error.response?.data?.message) ? error.response.data.message.join(', ') : 'Đã có lỗi xảy ra');
    return Promise.reject(new Error(message));
  },
);

export default api;
