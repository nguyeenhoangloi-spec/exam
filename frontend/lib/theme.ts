/**
 * Centralized Theme Manager with Zero-Lag Transition Guard
 * Ensures seamless, synchronized Dark/Light mode switching without color flashing or disjointed transitions.
 */

export type ThemeMode = 'light' | 'dark' | 'system';

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light';
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || saved === 'light' || saved === 'system') {
    return saved;
  }
  return 'light';
}

export function isDarkModeActive(): boolean {
  if (typeof window === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

/**
 * Apply theme mode across DOM.
 * Uses View Transitions API when available for a cinematic 200ms cross-fade,
 * or the synchronous Zero-Lag Transition Guard for instant unified repaint without flash.
 */
export function applyTheme(mode: ThemeMode, withViewTransition = true) {
  if (typeof window === 'undefined') return;

  const isDark = mode === 'dark' || (mode === 'system' && getSystemTheme() === 'dark');
  const root = document.documentElement;

  const updateDom = () => {
    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    localStorage.setItem('theme', mode);
    window.dispatchEvent(new CustomEvent('theme-change', { detail: { mode, isDark } }));
  };

  // 1. If View Transitions API is supported and user hasn't requested reduced motion
  if (
    withViewTransition &&
    typeof document !== 'undefined' &&
    'startViewTransition' in document &&
    typeof (document as any).startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    // Tạm khóa transitions cá thể để snapshot của View Transitions hoàn toàn sắc nét, không bị giật kép
    root.classList.add('disable-transitions');
    const transition = (document as any).startViewTransition(() => {
      updateDom();
      void window.getComputedStyle(root).opacity;
    });

    const cleanup = () => {
      root.classList.remove('disable-transitions');
    };

    if (transition && transition.finished) {
      transition.finished.finally(cleanup);
    } else {
      setTimeout(cleanup, 220);
    }
    return;
  }

  // 2. Synchronous Zero-Lag Transition Guard (freeze individual CSS transitions during switch)
  root.classList.add('disable-transitions');
  updateDom();

  // Force synchronous CSS layout evaluation so all styles apply in one single paint frame
  void window.getComputedStyle(root).opacity;

  // Unfreeze transitions on the next animation frames so normal hover/click effects work
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      root.classList.remove('disable-transitions');
    });
  });
}

/**
 * Toggle between light and dark mode with smooth transition
 */
export function toggleTheme(): ThemeMode {
  const isCurrentlyDark = isDarkModeActive();
  const nextMode: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
  applyTheme(nextMode, true);
  return nextMode;
}

/**
 * Initialize theme listeners (e.g. system theme changes when mode is 'system')
 */
export function initThemeListener() {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleChange = () => {
    if (getSavedTheme() === 'system') {
      applyTheme('system', false);
    }
  };

  mediaQuery.addEventListener('change', handleChange);
  return () => mediaQuery.removeEventListener('change', handleChange);
}
