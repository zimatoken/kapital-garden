// src/main.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/theme.css';

/**
 * Автопроверка обновлений PWA.
 *
 * Chrome иногда держит старую версию в кэше неделями.
 * Эта проверка — принудительно просит Service Worker
 * обновиться при каждом старте приложения.
 *
 * Если найдено обновление — браузер подтянет его
 * при следующем открытии (или сразу, если skipWaiting
 * настроен в vite.config.ts — у нас настроен).
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then((registration) => {
    // Проверяем обновления раз в минуту, пока приложение открыто
    registration.update();

    // Опционально — периодическая проверка (раз в час)
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);
  });

  // Если найден новый воркер — перезагружаем страницу
  // (только если пользователь давно не взаимодействовал)
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) return;
    refreshing = true;
    // НЕ перезагружаем автоматически — слишком агрессивно.
    // Просто логируем для отладки.
    console.log('[SW] New version available. Reload to update.');
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);