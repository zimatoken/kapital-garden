// src/core/monthlyReport.ts

import type { Transaction } from '../types/transaction';
import type { DepositEvent } from '../types/deposit';
import type { Category } from '../types/transaction';
import type { Money } from '../types/common';
import { sumMoney, makeMoney } from './money';

/**
 * Отчёт за месяц — итоговая карточка с фактами.
 *
 * ПРИНЦИП: только факты. Никаких «ты молодец» / «ты потратил много».
 */
export interface MonthlyReport {
  monthKey: string;              // 'YYYY-MM' — отчётный месяц
  monthLabel: string;            // 'Сентябрь 2026'
  isReady: boolean;              // есть ли данные

  // Итоги
  totalIncome: Money;
  totalExpense: Money;
  totalDeposited: Money;

  // Топ-категория
  topCategory: {
    category: Category;
    amount: Money;
    count: number;
  } | null;

  // Средний чек
  avgCheck: Money;
  expenseCount: number;

  // Стрик в последний день месяца
  bestStreakInMonth: number;

  // Сравнение с прошлым месяцем
  prevMonthKey: string;
  prevMonthLabel: string;
  depositedDeltaPercent: number | null;
  expenseDeltaPercent: number | null;

  // Кол-во активных дней
  activeDays: number;            // сколько дней были отложения
}

const MONTHS_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function monthLabel(key: string): string {
  const [y, m] = key.split('-');
  return `${MONTHS_FULL[parseInt(m, 10) - 1]} ${y}`;
}

function previousMonthKey(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const prev = new Date(Date.UTC(y, m - 2, 1));
  const year = prev.getUTCFullYear();
  const month = String(prev.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function deltaPercent(cur: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 100);
}

function sumOrZero(amounts: Money[]): Money {
  return amounts.length > 0 ? sumMoney(amounts) : makeMoney(0, 'RUB');
}

/**
 * Считает отчёт за конкретный месяц.
 */
export function computeMonthlyReport(
  transactions: Transaction[],
  deposits: DepositEvent[],
  categories: Category[],
  monthKey: string,
): MonthlyReport {
  const prevKey = previousMonthKey(monthKey);

  const txInMonth = transactions.filter((t) => t.date.startsWith(monthKey));
  const txInPrev = transactions.filter((t) => t.date.startsWith(prevKey));
  const depInMonth = deposits.filter((d) => d.date.startsWith(monthKey));
  const depInPrev = deposits.filter((d) => d.date.startsWith(prevKey));

  const totalIncome = sumOrZero(
    txInMonth.filter((t) => t.type === 'income').map((t) => t.amount),
  );
  const totalExpense = sumOrZero(
    txInMonth.filter((t) => t.type === 'expense').map((t) => t.amount),
  );
  const totalDeposited = sumOrZero(depInMonth.map((d) => d.amount));

  const totalDepositedPrev = sumOrZero(depInPrev.map((d) => d.amount));
  const totalExpensePrev = sumOrZero(
    txInPrev.filter((t) => t.type === 'expense').map((t) => t.amount),
  );

  // ─── Топ-категория ───
  const expenseTx = txInMonth.filter((t) => t.type === 'expense');
  const byCategory = new Map<string, { amount: number; count: number }>();
  for (const t of expenseTx) {
    const cur = byCategory.get(t.categoryId) ?? { amount: 0, count: 0 };
    cur.amount += t.amount.minorUnits;
    cur.count += 1;
    byCategory.set(t.categoryId, cur);
  }

  let topCategory: MonthlyReport['topCategory'] = null;
  let topAmount = -1;
  for (const [catId, stat] of byCategory.entries()) {
    if (stat.amount > topAmount) {
      const cat = categories.find((c) => c.id === catId);
      if (cat) {
        topAmount = stat.amount;
        topCategory = {
          category: cat,
          amount: makeMoney(stat.amount, 'RUB'),
          count: stat.count,
        };
      }
    }
  }

  // ─── Средний чек ───
  const expenseCount = expenseTx.length;
  const avgCheck =
    expenseCount > 0
      ? makeMoney(Math.round(totalExpense.minorUnits / expenseCount), 'RUB')
      : makeMoney(0, 'RUB');

  // ─── Активные дни ───
  const activeDaysSet = new Set<string>();
  for (const d of depInMonth) {
    activeDaysSet.add(d.date);
  }
  const activeDays = activeDaysSet.size;

  // ─── Лучший стрик в месяце ───
  const sortedDays = [...activeDaysSet].sort();
  let bestStreak = 0;
  let curStreak = 0;
  let prevDate: Date | null = null;
  for (const iso of sortedDays) {
    const d = new Date(iso);
    if (prevDate) {
      const diff = Math.round(
        (d.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (diff === 1) {
        curStreak += 1;
      } else {
        curStreak = 1;
      }
    } else {
      curStreak = 1;
    }
    if (curStreak > bestStreak) bestStreak = curStreak;
    prevDate = d;
  }

  return {
    monthKey,
    monthLabel: monthLabel(monthKey),
    isReady: txInMonth.length > 0 || depInMonth.length > 0,

    totalIncome,
    totalExpense,
    totalDeposited,

    topCategory,
    avgCheck,
    expenseCount,

    bestStreakInMonth: bestStreak,

    prevMonthKey: prevKey,
    prevMonthLabel: monthLabel(prevKey),
    depositedDeltaPercent: deltaPercent(
      totalDeposited.minorUnits,
      totalDepositedPrev.minorUnits,
    ),
    expenseDeltaPercent: deltaPercent(
      totalExpense.minorUnits,
      totalExpensePrev.minorUnits,
    ),

    activeDays,
  };
}

/**
 * Получить ключ прошлого месяца 'YYYY-MM' от текущего.
 * Используется для отчёта: если сегодня «2026-10-01», отчёт за «2026-09».
 */
export function previousMonthKeyOf(todayKey: string): string {
  return previousMonthKey(todayKey);
}