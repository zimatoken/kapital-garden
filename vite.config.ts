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
      includeAssets: ['favicon.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Kapital Garden',
        short_name: 'Kapital',
        description: 'Каждая отложенная копейка — семя твоего будущего.',
        theme_color: '#0c1426',
        background_color: '#0c1426',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/kapital-garden/',
        scope: '/kapital-garden/',
        lang: 'ru',
        dir: 'ltr',
        categories: ['finance', 'productivity'],
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Записать расход',
            short_name: 'Расход',
            description: 'Быстрый ввод расхода',
            url: '/kapital-garden/#budget',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Посадить семя',
            short_name: 'Отложить',
            description: 'Записать отложение в сад',
            url: '/kapital-garden/#garden',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Аналитика',
            short_name: 'Анализ',
            description: 'Куда уходят деньги',
            url: '/kapital-garden/#analytics',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Мои цели',
            short_name: 'Цели',
            description: 'Прогресс к целям',
            url: '/kapital-garden/#goals',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});