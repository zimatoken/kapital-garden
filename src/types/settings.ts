// src/types/settings.ts

import type { Currency, Money } from './common';

/**
 * Настройки отложений (10% от дохода — золотое правило).
 */
export interface SavingsSettings {
  mode: 'percent' | 'fixed';
  percent: number; // 10 по умолчанию
  fixedAmount: Money | null;
  remindDaily: boolean;
}

/**
 * Общие настройки приложения.
 *
 * ВАЖНО: сохраняем всё как факты, никаких вычисляемых полей.
 */
export interface AppSettings {
  baseCurrency: Currency;
  savings: SavingsSettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ru'; // вшито сейчас; архитектурно готово к i18n
  calmMode: boolean;
}