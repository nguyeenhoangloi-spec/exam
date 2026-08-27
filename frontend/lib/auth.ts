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
  if (typeof window === 'undefined') return null;

  // A removed user record means another tab (or the current logout flow) has
  // ended the browser session. Never keep using a stale in-memory token.
  return getAuthUser() ? accessToken : null;
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

const getAvatarStorageKey = (user?: Partial<User> | null) => {
  if (!user) return 'exam_user_avatar_current';
  return `exam_user_avatar_${user.id || user.username || 'current'}`;
};

export const getUserAvatar = (user?: Partial<User> | null): string => {
  if (typeof window === 'undefined') return '';
  const current = user || getAuthUser();
  const localAvatar = localStorage.getItem(getAvatarStorageKey(current)) || localStorage.getItem('exam_user_avatar_current');
  if (localAvatar) return localAvatar;
  return current?.avatarUrl || (current as any)?.teacher?.avatarUrl || (current as any)?.student?.avatarUrl || '';
};

export const setUserAvatar = (avatarUrl: string, user?: Partial<User> | null) => {
  if (typeof window !== 'undefined') {
    const current = user || getAuthUser();
    const key = getAvatarStorageKey(current);
    if (avatarUrl) {
      localStorage.setItem(key, avatarUrl);
      localStorage.setItem('exam_user_avatar_current', avatarUrl);
    } else {
      localStorage.removeItem(key);
      localStorage.removeItem('exam_user_avatar_current');
    }
    // Update auth user record in localStorage as well
    if (current) {
      const authUser = getAuthUser();
      const updatedUser = { ...(authUser || {}), ...current, avatarUrl };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    }
    window.dispatchEvent(new Event('auth-change'));
    window.dispatchEvent(new CustomEvent('user-avatar-change', { detail: { avatarUrl } }));
  }
};
