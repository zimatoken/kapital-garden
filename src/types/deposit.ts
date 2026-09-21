import { ISODate, Money } from './common';

/**
 * СЕМЯ. Единственный источник правды для сада, октав и стрика.
 * Transaction (приход/расход) сад НЕ питает — только экран Бюджет.
 */
export type DepositSource = 'auto10' | 'manual' | 'fixedDaily' | 'goal' | 'imported';

export interface DepositEvent {
  id: string; // crypto.randomUUID()
  date: ISODate; // день, когда посажено (не timestamp!)
  amount: Money;
  source: DepositSource;
  /** К цели ли привязано. null = в общий сад. */
  goalId: string | null;
  /** Свободный комментарий. Пустая строка по умолчанию. */
  note: string;
}
