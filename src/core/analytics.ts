// src/core/analytics.ts

import type { Transaction, Category } from '../types/transaction';
import type { DepositEvent } from '../types/deposit';
import type { Money } from '../types/common';
import { sumMoney, makeMoney } from './money';

/**
 * Аналитика — данные для графиков и диаграмм.
 * ТОЛЬКО ФАКТЫ. Никаких оценок, советов, «хорошо/плохо».
 */

export interface MonthPoint {
  monthKey: string;         // 'YYYY-MM'
  monthLabel: string;       // 'янв'
  monthFull: string;        // 'Январь 2026'
  income: Money;
  expense: Money;
  deposited: Money;
}

export interface CategorySlice {
  category: Category;
  amount: Money;
  percent: number;          // 0..100 от общей суммы
  count: number;
}

export interface Analytics {
  months: MonthPoint[];
  topCategories: CategorySlice[];
  totalIncome: Money;
  totalExpense: Money;
  totalDeposited: Money;
  hasEnoughData: boolean;         // ≥ 2 месяца с данными
  avgMonthlySavings: Money;       // среднее «отложено» в месяц
  savingsRate: number;            // % от дохода, уходящий в сад (0..100)
  bestMonthKey: string | null;    // месяц с максимальным deposited
  bestMonthLabel: string | null;  // 'Январь 2026'
  expenseGrowth: number;          // % изменения расхода: последняя половина vs первая
}

const MONTHS_RU = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

const MONTHS_RU_FULL = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

function monthKeyOf(iso: string): string {
  return iso.slice(0, 7);
}

function lastNMonthKeys(todayKey: string, n: number): string[] {
  const [y, m] = todayKey.split('-').map(Number);
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(y, m - 1 - i, 1));
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    keys.push(`${year}-${month}`);
  }
  return keys;
}

function shortLabel(monthKey: string): string {
  const [, m] = monthKey.split('-');
  return MONTHS_RU[parseInt(m, 10) - 1] ?? '';
}

function fullLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-');
  return `${MONTHS_RU_FULL[parseInt(m, 10) - 1]} ${y}`;
}

const TOP_CATEGORIES_COUNT = 5; // + «Остальное» = 6 секторов максимум

export function computeAnalytics(
  transactions: Transaction[],
  deposits: DepositEvent[],
  categories: Category[],
  todayKey: string,
  monthsBack: number = 6,
): Analytics {
  const monthKeys = lastNMonthKeys(todayKey, monthsBack);
  const monthKeySet = new Set(monthKeys);

  // ─── Группировка за один проход (O(N)) ───
  const txByMonth = new Map<string, Transaction[]>();
  const depByMonth = new Map<string, DepositEvent[]>();

  for (const t of transactions) {
    const key = monthKeyOf(t.date);
    if (!monthKeySet.has(key)) continue;
    const arr = txByMonth.get(key) ?? [];
    arr.push(t);
    txByMonth.set(key, arr);
  }

  for (const d of deposits) {
    const key = monthKeyOf(d.date);
    if (!monthKeySet.has(key)) continue;
    const arr = depByMonth.get(key) ?? [];
    arr.push(d);
    depByMonth.set(key, arr);
  }

  // ─── Точки по месяцам ───
  const months: MonthPoint[] = monthKeys.map((monthKey) => {
    const txInMonth = txByMonth.get(monthKey) ?? [];
    const depInMonth = depByMonth.get(monthKey) ?? [];

    const income = sumOrZero(
      txInMonth.filter((t) => t.type === 'income').map((t) => t.amount),
    );
    const expense = sumOrZero(
      txInMonth.filter((t) => t.type === 'expense').map((t) => t.amount),
    );
    const deposited = sumOrZero(depInMonth.map((d) => d.amount));

    return {
      monthKey,
      monthLabel: shortLabel(monthKey),
      monthFull: fullLabel(monthKey),
      income,
      expense,
      deposited,
    };
  });

  // ─── Категории за весь период ───
  const categoryMap = new Map<string, Category>();
  for (const c of categories) categoryMap.set(c.id, c);

  const byCategory = new Map<string, { amount: number; count: number }>();
  let totalExpenseMinor = 0;
  let allExpensesCount = 0;

  for (const txList of txByMonth.values()) {
    for (const t of txList) {
      if (t.type !== 'expense') continue;
      const cur = byCategory.get(t.categoryId) ?? { amount: 0, count: 0 };
      cur.amount += t.amount.minorUnits;
      cur.count += 1;
      byCategory.set(t.categoryId, cur);
      totalExpenseMinor += t.amount.minorUnits;
      allExpensesCount += 1;
    }
  }

  const sorted = [...byCategory.entries()]
    .map(([catId, stat]) => {
      const category = categoryMap.get(catId);
      if (!category) return null;
      return {
        category,
        amountMinor: stat.amount,
        count: stat.count,
      };
    })
    .filter((x): x is { category: Category; amountMinor: number; count: number } => x !== null)
    .sort((a, b) => b.amountMinor - a.amountMinor);

  const topCategories: CategorySlice[] = sorted
    .slice(0, TOP_CATEGORIES_COUNT)
    .map((s) => ({
      category: s.category,
      amount: makeMoney(s.amountMinor, 'RUB'),
      percent: totalExpenseMinor > 0 ? (s.amountMinor / totalExpenseMinor) * 100 : 0,
      count: s.count,
    }));

  // ─── Бакет «Остальное» ───
  const topSumMinor = topCategories.reduce((sum, c) => sum + c.amount.minorUnits, 0);
  const topCountSum = topCategories.reduce((sum, c) => sum + c.count, 0);
  const restMinor = totalExpenseMinor - topSumMinor;

  if (restMinor > 0) {
    topCategories.push({
      category: {
        id: '__rest',
        name: 'Остальное',
        kind: 'expense',
        icon: '✨',
      },
      amount: makeMoney(restMinor, 'RUB'),
      percent: (restMinor / totalExpenseMinor) * 100,
      count: allExpensesCount - topCountSum,
    });
  }

  // ─── Итого ───
  const totalIncome = sumOrZero(months.map((m) => m.income));
  const totalExpense = sumOrZero(months.map((m) => m.expense));
  const totalDeposited = sumOrZero(months.map((m) => m.deposited));

  const monthsWithData = months.filter(
    (m) => m.income.minorUnits > 0 || m.expense.minorUnits > 0,
  ).length;

  // ─── Среднее «отложено» в месяц ───
  const activeMonths = months.filter((m) => m.deposited.minorUnits > 0).length;
  const avgMonthlySavings =
    activeMonths > 0
      ? makeMoney(Math.round(totalDeposited.minorUnits / activeMonths), 'RUB')
      : makeMoney(0, 'RUB');

  // ─── Savings rate ───
  const savingsRate =
    totalIncome.minorUnits > 0
      ? (totalDeposited.minorUnits / totalIncome.minorUnits) * 100
      : 0;

  // ─── Рекордный месяц ───
  let bestMonthKey: string | null = null;
  let bestMonthLabel: string | null = null;
  let bestMinor = 0;
  for (const m of months) {
    if (m.deposited.minorUnits > bestMinor) {
      bestMinor = m.deposited.minorUnits;
      bestMonthKey = m.monthKey;
      bestMonthLabel = m.monthFull;
    }
  }

  // ─── Growth: последняя половина vs первая ───
  const half = Math.floor(months.length / 2);
  const earlier = months.slice(0, half);
  const recent = months.slice(half);
  const avgExpense = (arr: MonthPoint[]) =>
    arr.length > 0
      ? arr.reduce((s, m) => s + m.expense.minorUnits, 0) / arr.length
      : 0;
  const earlierAvg = avgExpense(earlier);
  const recentAvg = avgExpense(recent);
  const expenseGrowth =
    earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

  return {
    months,
    topCategories,
    totalIncome,
    totalExpense,
    totalDeposited,
    hasEnoughData: monthsWithData >= 2,
    avgMonthlySavings,
    savingsRate,
    bestMonthKey,
    bestMonthLabel,
    expenseGrowth,
  };
}

function sumOrZero(amounts: Money[]): Money {
  return amounts.length > 0 ? sumMoney(amounts) : makeMoney(0, 'RUB');
}