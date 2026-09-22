// src/types/recurring.ts

import type { Money } from './common';
import type { ISODate } from './common';

/**
 * Регулярный расход — шаблон, который повторяется каждый месяц.
 *
 * Ипотека, ЖКХ, подписки, интернет, аренда.
 */
export interface RecurringExpense {
  id: string;
  title: string;              // 'Ипотека', 'Netflix', 'ЖКХ'
  amount: Money;
  categoryId: string;
  /** День месяца, когда списывается (1-28, чтобы не падать на феврале). */
  dayOfMonth: number;
  /** Последний месяц, в котором расход был подтверждён. */
  lastAppliedMonth: string | null;  // 'YYYY-MM'
  /** Активен ли шаблон. */
  active: boolean;
  /** Заметка для транзакции (может отличаться от title). */
  note: string;
  createdAt: ISODate;
}