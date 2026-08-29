import axios, { AxiosAdapter } from 'axios';
import { getAuthToken, removeAuth, setAuthToken } from './auth';
import { getUserErrorMessage } from './error-message';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Fast in-memory cache for GET requests (30-second TTL)
const cache = new Map<string, { timestamp: number; data: any }>();
let isWarmedUp = false;
let refreshPromise: Promise<string> | null = null;
let restoreSessionPromise: Promise<boolean> | null = null;

const shouldNeverCache = (url?: string) => /profile|attempt|exam-paper|question|result|report|appeal|proctor|essay|student|teacher|user|dashboard|archive/i.test(url || '');

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
    if (config.method?.toLowerCase() === 'get' && config.url && !config.params?.noCache && !shouldNeverCache(config.url)) {
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
    if (response.config.method?.toLowerCase() === 'get' && response.config.url && !shouldNeverCache(response.config.url)) {
      const cacheKey = `${response.config.url}?${new URLSearchParams(response.config.params || {}).toString()}`;
      cache.set(cacheKey, { timestamp: Date.now(), data: response.data });
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401 && error.config && !String(error.config.url || '').includes('/auth/refresh') && !String(error.config.url || '').includes('/auth/login')) {
      const original = error.config as typeof error.config & { _authRetry?: boolean };
      if (!original._authRetry) {
        original._authRetry = true;
        try {
          refreshPromise ||= api.post('/auth/refresh').then((refreshResponse) => {
            const { accessToken, user } = refreshResponse.data || {};
            if (!accessToken || !user) throw new Error('Phiên đăng nhập không hợp lệ.');
            setAuthToken(accessToken, user);
            return accessToken;
          }).finally(() => {
            refreshPromise = null;
          });
          const token = await refreshPromise;
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        } catch {
          removeAuth(false);
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }

    const message = getUserErrorMessage(error, 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.');
    if (error.response?.data && typeof error.response.data === 'object' && !Array.isArray(error.response.data)) {
      error.response.data.message = message;
    }

    const normalizedError = new Error(message) as Error & { response?: any; code?: string; status?: number };
    normalizedError.response = error.response;
    normalizedError.code = error.code;
    normalizedError.status = error.response?.status;
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

export const restoreAuthSession = async () => {
  if (getAuthToken()) return true;

  restoreSessionPromise ||= (async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { accessToken, user } = response.data || {};
      if (!accessToken || !user) return false;
      setAuthToken(accessToken, user);
      return true;
    } catch {
      removeAuth(false);
      return false;
    } finally {
      restoreSessionPromise = null;
    }
  })();

  return restoreSessionPromise;
};

export const logoutApi = async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignore server error on logout to always clean client session
  } finally {
    removeAuth(true);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};

export default api;
