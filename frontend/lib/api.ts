import axios, { AxiosAdapter } from 'axios';
import { getAuthToken, removeAuth } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fast in-memory cache for GET requests (30-second TTL)
const cache = new Map<string, { timestamp: number; data: any }>();
let isWarmedUp = false;

export function clearApiCache() {
  cache.clear();
  isWarmedUp = false;
}

export function getCachedData<T = any>(url: string, params?: any): T | null {
  if (typeof window === 'undefined') return null;
  const cacheKey = `${url}?${new URLSearchParams(params || {}).toString()}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < 30000) {
    return cached.data as T;
  }
  return null;
}

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (typeof window !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    // Return cached response if fresh (less than 30 seconds old)
    if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.noCache) {
      const cacheKey = `${config.url}?${new URLSearchParams(config.params || {}).toString()}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < 30000) {
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
      isWarmedUp = false;
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
    const rawMessage = error.response?.data?.message;
    const message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage || 'Đã có lỗi xảy ra');
    return Promise.reject(new Error(message));
  },
);

export const warmupGlobalCache = (role?: string) => {
  if (isWarmedUp || typeof window === 'undefined') return;
  const token = getAuthToken();
  if (!token) return;
  isWarmedUp = true;

  const endpoints = role === 'ADMIN' ? [
    '/dashboard/overview',
    '/departments',
    '/classes',
    '/students?page=1&limit=20',
    '/teachers',
    '/subjects',
    '/exam-rooms',
    '/exam-periods',
    '/exam-schedules',
    '/exam-schedules/trash',
    '/exam-papers',
    '/questions?page=1&limit=20',
    '/questions/filter-options',
    '/questions/statistics',
    '/exam-arrangement/history',
  ] : role === 'TEACHER' ? [
    '/teachers/my-assignments',
    '/exam-schedules',
    '/exam-papers',
    '/questions?page=1&limit=20',
    '/questions/filter-options',
    '/questions/statistics',
    '/subjects',
  ] : [
    '/students/my-schedule',
    '/students/my-curriculum',
  ];

  // Silently warm up cache in the background
  setTimeout(() => {
    void Promise.allSettled(endpoints.map((url) => api.get(url)));
  }, 100);
};

export default api;
