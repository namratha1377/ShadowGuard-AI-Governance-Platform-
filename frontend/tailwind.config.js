/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          925: '#0b0f19',
          950: '#070a12',
        },
        brand: {
          50: '#eep2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        verdict: {
          allowed: '#10b981',
          'allowed-bg': 'rgba(16, 185, 129, 0.1)',
          restricted: '#f59e0b',
          'restricted-bg': 'rgba(245, 158, 11, 0.1)',
          blocked: '#f43f5e',
          'blocked-bg': 'rgba(244, 63, 94, 0.1)',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(99, 102, 241, 0.15)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.2)',
        'glow-rose': '0 0 20px -5px rgba(244, 63, 94, 0.2)',
      },
    },
  },
  plugins: [],
};
