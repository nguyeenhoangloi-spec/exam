import axios from 'axios';
import { getAuthToken, removeAuth } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
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
