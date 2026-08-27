/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans:    ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        bg: {
          900: '#0a0a1a',
          800: '#0f0f27',
          700: '#13132d',
          600: '#1a1a3e',
          500: '#22225a',
          400: '#2d2d72',
        },
        success: { 400: '#4ade80', 500: '#22c55e', 600: '#16a34a' },
        danger:  { 400: '#f87171', 500: '#ef4444', 600: '#dc2626' },
        warning: { 400: '#facc15', 500: '#eab308', 600: '#ca8a04' },
        accent: {
          purple: '#a855f7',
          cyan:   '#06b6d4',
          pink:   '#ec4899',
        },
      },
      boxShadow: {
        'glow-primary': '0 0 24px rgba(99, 102, 241, 0.3)',
        'glow-success': '0 0 16px rgba(34, 197, 94, 0.25)',
        'glow-danger':  '0 0 16px rgba(239, 68, 68, 0.25)',
        'card':         '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover':   '0 8px 40px rgba(0,0,0,0.6)',
      },
      backgroundImage: {
        'gradient-radial':   'radial-gradient(var(--tw-gradient-stops))',
        'gradient-brand':    'linear-gradient(135deg, #6366f1, #a855f7)',
        'gradient-hero':     'linear-gradient(135deg, #1e1b4b 0%, #0a0a1a 50%, #1e1b4b 100%)',
        'gradient-card':     'linear-gradient(135deg, rgba(19,19,45,0.8), rgba(26,26,62,0.8))',
      },
      borderRadius: {
        'xl':  '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      animation: {
        'float':        'float 6s ease-in-out infinite',
        'glow-pulse':   'glowPulse 3s ease-in-out infinite',
        'shimmer':      'shimmer 1.5s infinite',
        'count-up':     'countUp 1s ease-out forwards',
        'slide-up':     'slideUp 0.4s ease-out forwards',
        'fade-in':      'fadeIn 0.3s ease-out forwards',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-10px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(99,102,241,0.2)' },
          '50%':      { boxShadow: '0 0 40px rgba(99,102,241,0.5)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
