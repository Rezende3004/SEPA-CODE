import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@tanstack/react-query', 'axios', 'zod'],
          'charts-vendor': ['recharts'],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/shared/test/setup.ts'],
    restoreMocks: true,
    testTimeout: 15000,
    hookTimeout: 15000,
    css: false,
    env: {
      VITE_USE_MOCKS: 'false',
    },
  },
});
