// vite.config.ts
// Vite is chosen over CRA because it's significantly faster in dev
// (native ESM, no bundling during dev) and produces optimized production builds.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          react: ["react", "react-dom", "react-router-dom"],
          // Charting library — largest chunk
          recharts: ["recharts"],
          // Icons — large due to many icon sets
          icons: ["react-icons"],
          // HTTP + query
          network: ["axios", "@tanstack/react-query"],
        },
      },
    },
  },
  server: {
    port: 3000,
    // Proxy API calls to backend during development
    // This avoids CORS issues in dev without changing production config
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
