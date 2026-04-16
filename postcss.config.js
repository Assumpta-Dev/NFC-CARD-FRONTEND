// postcss.config.js
// PostCSS processes CSS — required for Tailwind to work.
// autoprefixer adds vendor prefixes automatically so you don't have
// to write -webkit-, -moz- prefixes manually in your CSS.
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
