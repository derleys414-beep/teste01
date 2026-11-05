/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#6254e8',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3',
        },
      },
      keyframes: {
        'modal-in': {
          '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-fast': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(16px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'modal-in': 'modal-in 260ms cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 400ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in-fast': 'fade-in-fast 200ms ease-out both',
        'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'scale-in': 'scale-in 300ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'count-up': 'count-up 500ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'shimmer': 'shimmer 1.8s linear infinite',
        'toast-in': 'toast-in 320ms cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
