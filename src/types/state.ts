// src/types/state.ts

import type { AppSettings } from './settings';
import type { DepositEvent } from './deposit';
import type { Goal } from './goal';
import type { RecurringExpense } from './recurring';
import type { Category, Transaction } from './transaction';

export const CURRENT_SCHEMA_VERSION = 1;

/** Единственный источник истины в приложении. */
export interface KGState {
  schemaVersion: number;
  createdAt: string;
  settings: AppSettings;
  categories: Category[];
  transactions: Transaction[];
  /** ← сад, октавы, стрик — ВСЁ вычисляется из этого массива. */
  deposits: DepositEvent[];
  goals: Goal[];
  /** ← регулярные расходы (ипотека, ЖКХ, подписки). */
  recurring: RecurringExpense[];
}