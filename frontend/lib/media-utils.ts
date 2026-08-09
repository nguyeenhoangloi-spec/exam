/**
 * Helper to construct a full backend URL for uploaded images/media.
 */
export function getImageUrl(url?: string | null): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const cleanPath = url.startsWith('/') ? url : `/${url}`;
  return `${apiBase}${cleanPath}`;
}

/**
 * Helper to rewrite relative src="/uploads/..." paths inside HTML content
 */
export function fixHtmlImageUrls(html?: string): string {
  if (!html) return '';
  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  return html.replace(/src=["'](\/uploads\/[^"']+)["']/g, `src="${apiBase}$1"`);
}

/**
 * Decode Latin-1/UTF-8 mojibake strings (e.g. tá°¡o -> tạo)
 */
export function decodeUtf8String(str?: string | null): string {
  if (!str) return '';
  try {
    if (/[\u00C0-\u00FF]/.test(str)) {
      const bytes = Uint8Array.from(str, (c) => c.charCodeAt(0));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      if (decoded && !decoded.includes('')) {
        return decoded;
      }
    }
  } catch {
    // ignore fallback
  }
  return str;
}

/**
 * Get a clean, properly decoded display name for media files
 */
export function cleanMediaFileName(fileName?: string | null, fallback = 'Tập tin media'): string {
  if (!fileName) return fallback;
  const decoded = decodeUtf8String(fileName);
  // If string still has unresolvable corrupted encoding sequences or invalid characters
  if (/[\u00C0-\u00FF]{2,}/.test(decoded) && /[\u0080-\u00FF]/.test(decoded)) {
    return fallback;
  }
  return decoded || fallback;
}
