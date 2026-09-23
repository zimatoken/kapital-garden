// src/core/pulse.ts

import type { Transaction } from '../types/transaction';
import type { DepositEvent } from '../types/deposit';
import type { Money } from '../types/common';
import { sumMoney, makeMoney } from './money';

/**
 * Пульс — сравнение с собой.
 *
 * ТОЛЬКО ФАКТЫ. Никаких оценок, советов, «хорошо/плохо».
 */
export interface Pulse {
  currentMonth: string;
  previousMonth: string;

  depositedCurrent: Money;
  depositedPrevious: Money;
  depositedDeltaPercent: number | null;

  expenseCurrent: Money;
  expensePrevious: Money;
  expenseDeltaPercent: number | null;

  avgCheckCurrent: Money;
  avgCheckPrevious: Money;

  incomeCurrent: Money;
  incomePrevious: Money;

  txCountCurrent: number;
  txCountPrevious: number;

  hasEnoughData: boolean;
}

/**
 * Получить ключ предыдущего месяца.
 * '2026-09' → '2026-08'. '2026-01' → '2025-12'.
 *
 * ЭКСПОРТИРУЕТСЯ для использования в BudgetScreen (фильтр «Прошлый месяц»).
 */
export function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  const year = prev.getUTCFullYear();
  const month = String(prev.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Процент изменения: (cur - prev) / prev * 100.
 * Если prev = 0 → null (нечего сравнивать).
 */
function deltaPercent(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

/**
 * Считает Пульс за текущий и прошлый месяц.
 */
export function computePulse(
  transactions: Transaction[],
  deposits: DepositEvent[],
  currentMonthKey: string,
): Pulse {
  const prevMonthKey = previousMonthKey(currentMonthKey);

  // ─── Транзакции по месяцам ───
  const txCurrent = transactions.filter((t) => t.date.startsWith(currentMonthKey));
  const txPrev = transactions.filter((t) => t.date.startsWith(prevMonthKey));

  const incomeCurrent = sumOrZero(
    txCurrent.filter((t) => t.type === 'income').map((t) => t.amount),
  );
  const incomePrev = sumOrZero(
    txPrev.filter((t) => t.type === 'income').map((t) => t.amount),
  );

  const expenseCurrentTx = txCurrent.filter((t) => t.type === 'expense');
  const expensePrevTx = txPrev.filter((t) => t.type === 'expense');

  const expenseCurrent = sumOrZero(expenseCurrentTx.map((t) => t.amount));
  const expensePrev = sumOrZero(expensePrevTx.map((t) => t.amount));

  const avgCheckCurrent =
    expenseCurrentTx.length > 0
      ? makeMoney(
          Math.round(expenseCurrent.minorUnits / expenseCurrentTx.length),
          expenseCurrent.currency,
        )
      : makeMoney(0, 'RUB');

  const avgCheckPrevious =
    expensePrevTx.length > 0
      ? makeMoney(
          Math.round(expensePrev.minorUnits / expensePrevTx.length),
          expensePrev.currency,
        )
      : makeMoney(0, 'RUB');

  // ─── Отложения по месяцам ───
  const depCurrent = deposits.filter((d) => d.date.startsWith(currentMonthKey));
  const depPrev = deposits.filter((d) => d.date.startsWith(prevMonthKey));

  const depositedCurrent = sumOrZero(depCurrent.map((d) => d.amount));
  const depositedPrevious = sumOrZero(depPrev.map((d) => d.amount));

  // ─── Флаг достаточности данных ───
  const hasEnoughData = txCurrent.length >= 3 || txPrev.length >= 3;

  return {
    currentMonth: currentMonthKey,
    previousMonth: prevMonthKey,

    depositedCurrent,
    depositedPrevious,
    depositedDeltaPercent: deltaPercent(
      depositedCurrent.minorUnits,
      depositedPrevious.minorUnits,
    ),

    expenseCurrent,
    expensePrevious: expensePrev,
    expenseDeltaPercent: deltaPercent(
      expenseCurrent.minorUnits,
      expensePrev.minorUnits,
    ),

    avgCheckCurrent,
    avgCheckPrevious,

    incomeCurrent,
    incomePrevious: incomePrev,

    txCountCurrent: txCurrent.length,
    txCountPrevious: txPrev.length,

    hasEnoughData,
  };
}

function sumOrZero(amounts: Money[]): Money {
  return amounts.length > 0 ? sumMoney(amounts) : makeMoney(0, 'RUB');
}

/**
 * Название месяца по ключу 'YYYY-MM'.
 */
const MONTH_NAMES = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
];

export function monthName(monthKey: string): string {
  const [, m] = monthKey.split('-');
  return MONTH_NAMES[parseInt(m, 10) - 1] ?? '';
}