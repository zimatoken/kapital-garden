/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/kapital-garden/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kapital Garden',
        short_name: 'Kapital Garden',
        description: 'Каждая отложенная копейка — семя твоего будущего.',
        theme_color: '#22c55e',
        background_color: '#0c1426',
        display: 'standalone',
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
