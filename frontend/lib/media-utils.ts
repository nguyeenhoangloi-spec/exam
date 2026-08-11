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
  if (typeof window === 'undefined') {
    return html
      .replace(/<\/?(script|iframe|object|embed|form|base|meta|link)[^>]*>/gi, '')
      .replace(/\son[a-z]+\s*=\s*(["']).*?\1/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      .replace(/src=["'](\/uploads\/[^"']+)["']/g, `src="${apiBase}$1"`);
  }

  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,iframe,object,embed,form,base,meta,link').forEach((node) => node.remove());
  doc.querySelectorAll('*').forEach((node) => {
    Array.from(node.attributes).forEach((attribute) => {
      if (/^on/i.test(attribute.name) || /^(style|srcdoc)$/i.test(attribute.name)) node.removeAttribute(attribute.name);
      if (/^(href|src|action|formaction)$/i.test(attribute.name) && /^(javascript:|data:text\/html)/i.test(attribute.value.trim())) {
        node.removeAttribute(attribute.name);
      }
    });
  });
  doc.querySelectorAll('[src]').forEach((node) => {
    const value = node.getAttribute('src') || '';
    if (value.startsWith('/uploads/')) node.setAttribute('src', `${apiBase}${value}`);
  });
  return doc.body.innerHTML;
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
