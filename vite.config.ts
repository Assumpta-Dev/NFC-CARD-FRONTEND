// vite.config.ts
// Vite is chosen over CRA because it's significantly faster in dev
// (native ESM, no bundling during dev) and produces optimized production builds.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          react:    ["react", "react-dom", "react-router-dom"],
          recharts: ["recharts"],
          icons:    ["react-icons"],
          network:  ["axios"],
        },
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      // Backend runs on 5001 (see NFC-CARD-BACKEND PORT / .env)
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
