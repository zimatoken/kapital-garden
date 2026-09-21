import { AppSettings } from './settings';
import { DepositEvent } from './deposit';
import { Goal } from './goal';
import { Category, Transaction } from './transaction';

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
}
