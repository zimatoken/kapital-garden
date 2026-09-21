import { ISODate, Money } from './common';

export type TxType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: ISODate;
  type: TxType;
  amount: Money;
  categoryId: string;
  note: string;
}

export interface Category {
  id: string;
  name: string;
  kind: TxType;
  icon: string; // emoji — проще и теплее, чем иконочный шрифт
}
