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

    // ── Chuẩn hóa message lỗi cho người dùng ─────────────────────────────
    let message: string;
    const status = error.response?.status;
    const rawMessage = error.response?.data?.message;

    if (typeof rawMessage === 'string' && rawMessage.trim()) {
      message = rawMessage.trim();
    } else if (Array.isArray(rawMessage) && rawMessage.length) {
      message = rawMessage.join(', ');
    } else if (status === 500 || status === 502 || status === 503) {
      message = 'Hệ thống đang gặp sự cố. Vui lòng thử lại sau.';
    } else if (status === 404) {
      message = 'Không tìm thấy dữ liệu yêu cầu.';
    } else if (status === 403) {
      message = 'Bạn không có quyền thực hiện thao tác này.';
    } else if (status === 400) {
      message = 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      message = 'Kết nối bị quá tải. Vui lòng thử lại sau.';
    } else if (!error.response || error.code === 'ERR_NETWORK' || /network error/i.test(error.message || '')) {
      message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.';
    } else {
      message = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
    }

    // Cắt message quá dài (toast chỉ hiển thị 4 giây)
    if (message.length > 200) {
      message = `${message.slice(0, 200)}...`;
    }

    const normalizedError = new Error(message) as Error & { response?: any; code?: string; status?: number };
    normalizedError.response = error.response;
    normalizedError.code = error.code;
    normalizedError.status = status;
    return Promise.reject(normalizedError);
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
