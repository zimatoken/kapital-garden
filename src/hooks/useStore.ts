// src/hooks/useStore.ts

import { useSyncExternalStore } from 'react';
import type { KGState } from '../types/state';
import { getStore } from '../core/store';

/**
 * React-хук для подписки на состояние Store.
 * Использует useSyncExternalStore — корректно работает со StrictMode.
 */
export function useStoreState(): KGState {
  const store = getStore();

  return useSyncExternalStore(
    (listener) => store.subscribe(listener),
    () => store.getState(),
    () => store.getState(),
  );
}

/** Быстрый доступ к Store. */
export function useStore() {
  return getStore();
}