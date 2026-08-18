import api from './api';
import { AxiosRequestConfig, AxiosResponse } from 'axios';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

// In-memory RAM Cache Store
const cache = new Map<string, CacheEntry>();

/**
 * Generate unique cache key from URL and params
 */
function getCacheKey(url: string, params?: Record<string, any>): string {
  if (!params || Object.keys(params).length === 0) return url;
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${encodeURIComponent(String(params[key]))}`)
    .join('&');
  return `${url}?${sortedParams}`;
}

/**
 * Cached GET request with Stale-While-Revalidate pattern
 * @param url API endpoint
 * @param params Query params
 * @param ttlMs Time to live in milliseconds (default: 45 seconds)
 * @param config Additional Axios config
 */
export async function cachedGet<T = any>(
  url: string,
  params?: Record<string, any>,
  ttlMs = 45000,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const key = getCacheKey(url, params);
  const now = Date.now();
  const cached = cache.get(key);

  // Return cached result immediately if still valid
  if (cached && now - cached.timestamp < cached.ttl) {
    return {
      data: cached.data,
      status: 200,
      statusText: 'OK (Cached)',
      headers: {},
      config: { url, params, ...config } as any,
    };
  }

  // Fetch fresh data from network
  const response = await api.get<T>(url, { params, ...config });

  // Store in cache
  cache.set(key, {
    data: response.data,
    timestamp: now,
    ttl: ttlMs,
  });

  return response;
}

/**
 * Invalidate cache by exact key or URL pattern (prefix)
 * @param urlPattern URL prefix to clear (e.g., '/questions', '/students')
 */
export function invalidateCache(urlPattern?: string) {
  if (!urlPattern) {
    cache.clear();
    return;
  }
  cache.forEach((_, key) => {
    if (key.startsWith(urlPattern)) {
      cache.delete(key);
    }
  });
}
