/** @type {import('tailwindcss').Config} */
export default {
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
        'fade-in': 'fadeIn 0.4s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
