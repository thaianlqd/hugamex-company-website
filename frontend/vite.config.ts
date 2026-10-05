import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/sitemap.xml': {
        target: 'http://127.0.0.1:8080',
        rewrite: () => '/api/v1/public/sitemap.xml',
      },
      '/api': 'http://127.0.0.1:8080',
      '/oauth2': 'http://127.0.0.1:8080',
      '/login/oauth2': 'http://127.0.0.1:8080',
    },
  },
  test: {
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
