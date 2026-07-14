/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand color — OVOU orange-red
        brand: {
          50:  '#fff4ee',
          100: '#ffe6d5',
          200: '#ffc9aa',
          300: '#ffa375',
          400: '#ff733a',
          500: '#f05535',
          600: '#de3a16',
          700: '#b82b10',
          800: '#93250f',
          900: '#78210f',
        },
        // Warm light surface palette used across auth, card public view, and profile edit pages
        surface: {
          950: '#f7efdf',
          900: '#ffffff',
          800: '#faf3e7',
          700: '#f1e4cf',
          600: '#dfccb0',
          500: '#c9b08b',
        },
      },
      // Animations for card flip reveal and page transitions
      animation: {
        'fade-in':    'fadeIn 0.4s ease-in-out',
        'slide-up':   'slideUp 0.5s ease-out',
        'slide-up-1': 'slideUp 0.5s ease-out 0.1s both',
        'slide-up-2': 'slideUp 0.5s ease-out 0.2s both',
        'slide-up-3': 'slideUp 0.5s ease-out 0.3s both',
        'slide-up-4': 'slideUp 0.5s ease-out 0.4s both',
        'slide-up-5': 'slideUp 0.5s ease-out 0.5s both',
        'pop-in':     'popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        'sheet-up':   'slideUpSheet 0.3s ease-out both',
        'modal-pop':  'popInModal 0.28s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popIn: {
          '0%':   { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUpSheet: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        popInModal: {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.96)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
