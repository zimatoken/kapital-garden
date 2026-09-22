// src/core/factories.ts

import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { CURRENT_SCHEMA_VERSION, type KGState } from '../types/state';
import { todayISODate } from './dates';

/**
 * Создаёт чистое состояние приложения.
 *
 * Используется:
 * - при первом запуске (localStorage пуст);
 * - после сброса данных;
 * - при ошибке загрузки.
 */
export function createInitialState(): KGState {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    createdAt: todayISODate(),
    settings: {
      baseCurrency: 'RUB',
      savings: {
        mode: 'percent',
        percent: 10,
        fixedAmount: null,
        remindDaily: true,
      },
      theme: 'system',
      language: 'ru',
      calmMode: true,
    },
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    deposits: [],
    goals: [],
    recurring: [],
  };
}