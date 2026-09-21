import { Currency, Money } from './common';

export interface SavingsSettings {
  mode: 'percent' | 'fixed';
  percent: number; // 10 по умолчанию
  fixedAmount: Money | null;
  remindDaily: boolean;
}

export interface AppSettings {
  baseCurrency: Currency;
  savings: SavingsSettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ru'; // вшито сейчас; архитектурно готово к i18n
  calmMode: boolean;
}
