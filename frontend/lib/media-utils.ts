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
