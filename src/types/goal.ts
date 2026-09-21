import { ISODate, Money } from './common';

export interface Goal {
  id: string;
  title: string;
  targetAmount: Money;
  /** Опционально: дата-дедлайн → показываем «нужный темп X ₽/мес». */
  targetDate: ISODate | null;
  createdAt: ISODate;
  archived: boolean;
  /** Прогресс НЕ храним — вычисляется суммой DepositEvent с goalId. */
}
