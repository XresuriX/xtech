import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [vue()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{js,ts}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{js,ts}'],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'src': resolve(__dirname, './src'),
      'boot': resolve(__dirname, './src/boot'),
    },
  },
});