// src/core/migrations.ts

import type { KGState } from '../types/state';
import { CURRENT_SCHEMA_VERSION } from '../types/state';
import { createInitialState } from './factories';

type Migration = (raw: unknown) => unknown;

/**
 * Таблица миграций: migrations[v] переводит схему v → v+1.
 * Порядок строгий. Новая версия = APPEND, никогда не править старые шаги.
 */
const MIGRATIONS: Record<number, Migration> = {
  // 1: (raw) => raw, // пример: v1 → v2
};

/**
 * Нормализация state.
 *
 * Даже если schemaVersion совпадает, но state старый (например,
 * добавлено поле `recurring` без бампа версии) — подстрахуемся.
 *
 * Правило: любое новое обязательное поле массива/объекта —
 * проверяем и инициализируем пустым значением.
 */
function normalize(state: KGState): KGState {
  return {
    ...state,
    recurring: Array.isArray(state.recurring) ? state.recurring : [],
    transactions: Array.isArray(state.transactions) ? state.transactions : [],
    deposits: Array.isArray(state.deposits) ? state.deposits : [],
    goals: Array.isArray(state.goals) ? state.goals : [],
    categories: Array.isArray(state.categories) ? state.categories : [],
  };
}

export function migrateState(raw: unknown): KGState {
  if (typeof raw !== 'object' || raw === null) {
    return createInitialState();
  }

  const obj = raw as { schemaVersion?: number };

  // Нет версии — не наше состояние → чистый старт
  if (typeof obj.schemaVersion !== 'number') {
    return createInitialState();
  }

  let version = obj.schemaVersion;
  let state = raw;

  while (version < CURRENT_SCHEMA_VERSION) {
    const step = MIGRATIONS[version];
    if (!step) break;
    state = step(state);
    version++;
  }

  return normalize(state as KGState);
}