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
        // Deep dark surface palette for OVOU-inspired dark theme
        // Used across auth, card public view, and profile edit pages
        surface: {
          950: '#07070f',  // deepest (used sparingly)
          900: '#0a0a14',  // page background
          800: '#12121e',  // card / section container
          700: '#1a1a2a',  // elevated elements, hover targets
          600: '#222236',  // borders, dividers
          500: '#2e2e46',  // muted / disabled elements
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
