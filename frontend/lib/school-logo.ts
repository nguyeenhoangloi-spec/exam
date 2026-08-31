/**
 * School Logo Utilities for Print Templates, PDF Exports, and Live Previews.
 * Default official logo for Trường Đại học Nam Cần Thơ (DNC).
 */

export const DEFAULT_DNC_LOGO_PATH = '/logo-dnc.jpg';
export const DEFAULT_DNC_LOGO_DATA_URL = '/logo-dnc.jpg';

/**
 * Returns the active school logo (either custom uploaded logo or default official DNC logo).
 */
export function getSchoolLogoUrl(customLogo?: string | null): string {
  if (customLogo && customLogo.trim()) {
    return customLogo.trim();
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}${DEFAULT_DNC_LOGO_PATH}`;
  }
  return DEFAULT_DNC_LOGO_PATH;
}
