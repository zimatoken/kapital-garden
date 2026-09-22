// src/types/transaction.ts

export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISODate 'YYYY-MM-DD'
  type: TxType;
  amount: import('./common').Money;
  categoryId: string;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  kind: TxType;
  icon: string;
  /** Ключевые слова для авто-определения категории */
  keywords?: string[];
}
