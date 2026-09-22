// src/core/recurring.ts

import type { RecurringExpense } from '../types/recurring';
import type { Money } from '../types/common';
import { makeMoney } from './money';

/**
 * Логика регулярных расходов.
 *
 * ПРИНЦИП: не автоматизируем вслепую. Пользователь подтверждает.
 * Мы только предлагаем — он решает.
 */

/**
 * Какие регулярные расходы «созрели» в текущем месяце,
 * но ещё не подтверждены.
 */
export function dueRecurring(
  recurring: RecurringExpense[],
  todayKey: string,        // 'YYYY-MM'
  todayDay: number,        // 1..31
): RecurringExpense[] {
  return recurring.filter((r) => {
    if (!r.active) return false;
    if (r.lastAppliedMonth === todayKey) return false;  // уже применён
    return todayDay >= r.dayOfMonth;
  });
}

/**
 * Суммарная «ожидаемая» сумма регулярных расходов за месяц.
 */
export function monthlyRecurringTotal(
  recurring: RecurringExpense[],
): Money {
  const active = recurring.filter((r) => r.active);
  if (active.length === 0) return makeMoney(0, 'RUB');

  const total = active.reduce((sum, r) => sum + r.amount.minorUnits, 0);
  return makeMoney(total, 'RUB');
}

/**
 * Пометить регулярный расход как применённый в этом месяце.
 */
export function markApplied(
  recurring: RecurringExpense,
  monthKey: string,
): RecurringExpense {
  return { ...recurring, lastAppliedMonth: monthKey };
}