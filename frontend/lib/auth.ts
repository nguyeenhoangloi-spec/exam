import { User } from '../types';
import { clearApiCache } from './api';

const TOKEN_KEY = 'exam_app_token';
const USER_KEY = 'exam_app_user';
let accessToken: string | null = null;

export const setAuthToken = (token: string, user: User) => {
  if (typeof window !== 'undefined') {
    accessToken = token;
    // Remove tokens persisted by older builds. Access tokens stay in memory only.
    localStorage.removeItem(TOKEN_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    clearApiCache();
    window.dispatchEvent(new Event('auth-change'));
  }
};

export const getAuthToken = (): string | null => {
  return typeof window !== 'undefined' ? accessToken : null;
};

export const getAuthUser = (): User | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem(USER_KEY);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const removeAuth = (notify = true) => {
  if (typeof window !== 'undefined') {
    accessToken = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    clearApiCache();
    if (notify) window.dispatchEvent(new Event('auth-change'));
  }
};
