/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        // Keep Tailwind's `font-sans` aligned with the application-wide Inter stack.
        sans: [
          'var(--font-inter)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
      },
      fontSize: {
        'type-display': ['var(--fs-display)', { lineHeight: 'var(--lh-display)' }],
        'type-display-sm': ['var(--fs-display-sm)', { lineHeight: 'var(--lh-display-sm)' }],
        'type-page': ['var(--fs-page-title)', { lineHeight: 'var(--lh-page-title)' }],
        'type-section': ['var(--fs-section-title)', { lineHeight: 'var(--lh-section-title)' }],
        'type-card': ['var(--fs-card-title)', { lineHeight: 'var(--lh-card-title)' }],
        'type-reading': ['var(--fs-reading)', { lineHeight: 'var(--lh-reading)' }],
        'type-body': ['var(--fs-body)', { lineHeight: 'var(--lh-body)' }],
        'type-body-sm': ['var(--fs-body-sm)', { lineHeight: 'var(--lh-body-sm)' }],
        'type-label': ['var(--fs-label)', { lineHeight: 'var(--lh-label)' }],
        'type-helper': ['var(--fs-helper)', { lineHeight: 'var(--lh-helper)' }],
        'type-badge': ['var(--fs-badge)', { lineHeight: 'var(--lh-badge)' }],
        'type-kpi': ['var(--fs-kpi)', { lineHeight: 'var(--lh-kpi)' }],
        'type-otp': ['var(--fs-otp)', { lineHeight: 'var(--lh-otp)' }],
      },
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb', // Primary Standard #2563EB
          700: '#1d4ed8', // Primary Hover #1D4ED8
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554', // Sidebar Hover #172554
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgb(15 23 42 / 0.04)',
        xs: '0 1px 2px 0 rgb(15 23 42 / 0.05)',
        sm: '0 1px 3px 0 rgb(15 23 42 / 0.08), 0 1px 2px -1px rgb(15 23 42 / 0.04)',
        md: '0 4px 6px -1px rgb(15 23 42 / 0.08), 0 2px 4px -2px rgb(15 23 42 / 0.04)',
        lg: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.04)',
        'soft': '0 2px 16px -2px rgb(15 23 42 / 0.06), 0 0 0 1px rgb(15 23 42 / 0.02)',
        'glow-blue': '0 0 0 4px rgb(37 99 235 / 0.12)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'modal-backdrop-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'modal-dialog-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'drawer-slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'popover-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ripple: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '0.4' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        'slide-in-right': 'slide-in-right 0.3s ease-out both',
        'scale-in': 'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1) both',
        'modal-backdrop': 'modal-backdrop-in 180ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'modal-dialog': 'modal-dialog-in 220ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'drawer-in': 'drawer-slide-in-right 240ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'popover-in': 'popover-in 150ms cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 1.8s linear infinite',
        ripple: 'ripple 600ms ease-out forwards',
      },
      transitionDuration: {
        '200': '200ms',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
