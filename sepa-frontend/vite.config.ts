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
