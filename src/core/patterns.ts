// src/core/patterns.ts

import type { Transaction, Category } from '../types/transaction';
import type { Money } from '../types/common';
import { sumMoney, makeMoney } from './money';

/**
 * Статистика по одной категории.
 */
export interface CategoryStat {
  category: Category;
  amount: Money;
  percent: number;      // 0..100 от totalExpense
  count: number;        // сколько транзакций в категории
}

/**
 * Паттерны трат за месяц.
 *
 * ВАЖНО: только факты. Никаких оценок, советов, сравнений.
 */
export interface Patterns {
  month: string;                    // 'YYYY-MM'
  totalIncome: Money;
  totalExpense: Money;
  transactionCount: number;         // всего транзакций
  expenseCount: number;             // только расходов
  avgCheck: Money;                  // средний чек (расходы / кол-во расходов)
  topWeekday: number | null;        // 0=Пн … 6=Вс
  topWeekdayAmount: Money | null;
  topCategories: CategoryStat[];    // топ-3 категории по расходам
  hasEnoughData: boolean;           // ≥ 5 транзакций
}

const MIN_TRANSACTIONS_FOR_PATTERNS = 5;
const TOP_CATEGORIES_COUNT = 3;

/**
 * День недели из ISODate 'YYYY-MM-DD'.
 * Возвращает 0=Пн … 6=Вс.
 */
function weekdayFromISO(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  // getUTCDay: 0=Вс, 1=Пн, ..., 6=Сб
  const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  // Приводим к 0=Пн … 6=Вс
  return (jsDay + 6) % 7;
}

/**
 * Паттерны за конкретный месяц.
 *
 * @param transactions — все транзакции (отфильтруем по month)
 * @param categories — все категории (для маппинга)
 * @param monthKey — 'YYYY-MM'
 */
export function computePatterns(
  transactions: Transaction[],
  categories: Category[],
  monthKey: string,
): Patterns {
  // Только за нужный месяц
  const monthTx = transactions.filter((t) => t.date.startsWith(monthKey));

  // Доходы и расходы
  const incomeTx = monthTx.filter((t) => t.type === 'income');
  const expenseTx = monthTx.filter((t) => t.type === 'expense');

  const totalIncome =
    incomeTx.length > 0
      ? sumMoney(incomeTx.map((t) => t.amount))
      : makeMoney(0, 'RUB');

  const totalExpense =
    expenseTx.length > 0
      ? sumMoney(expenseTx.map((t) => t.amount))
      : makeMoney(0, 'RUB');

  const expenseCount = expenseTx.length;

  // Средний чек
  const avgCheck =
    expenseCount > 0
      ? makeMoney(Math.round(totalExpense.minorUnits / expenseCount), totalExpense.currency)
      : makeMoney(0, totalExpense.currency);

  // Топ день недели (по сумме расходов)
  let topWeekday: number | null = null;
  let topWeekdayAmount: Money | null = null;

  if (expenseCount > 0) {
    const byWeekday: number[] = [0, 0, 0, 0, 0, 0, 0]; // 7 дней
    for (const t of expenseTx) {
      const day = weekdayFromISO(t.date);
      byWeekday[day] += t.amount.minorUnits;
    }

    let maxIdx = 0;
    let maxVal = byWeekday[0];
    for (let i = 1; i < 7; i++) {
      if (byWeekday[i] > maxVal) {
        maxVal = byWeekday[i];
        maxIdx = i;
      }
    }

    // Показываем только если есть хоть какая-то активность
    if (maxVal > 0) {
      topWeekday = maxIdx;
      topWeekdayAmount = makeMoney(maxVal, totalExpense.currency);
    }
  }

  // Топ-3 категории
  const categoryMap = new Map<string, Category>();
  for (const c of categories) {
    categoryMap.set(c.id, c);
  }

  const byCategory = new Map<string, { amount: number; count: number }>();
  for (const t of expenseTx) {
    const cur = byCategory.get(t.categoryId) ?? { amount: 0, count: 0 };
    cur.amount += t.amount.minorUnits;
    cur.count += 1;
    byCategory.set(t.categoryId, cur);
  }

  const topCategories: CategoryStat[] = [...byCategory.entries()]
    .map(([catId, stat]) => {
      const category = categoryMap.get(catId);
      if (!category) return null;
      const percent =
        totalExpense.minorUnits > 0
          ? (stat.amount / totalExpense.minorUnits) * 100
          : 0;
      return {
        category,
        amount: makeMoney(stat.amount, totalExpense.currency),
        percent,
        count: stat.count,
      };
    })
    .filter((x): x is CategoryStat => x !== null)
    .sort((a, b) => b.amount.minorUnits - a.amount.minorUnits)
    .slice(0, TOP_CATEGORIES_COUNT);

  const hasEnoughData = monthTx.length >= MIN_TRANSACTIONS_FOR_PATTERNS;

  return {
    month: monthKey,
    totalIncome,
    totalExpense,
    transactionCount: monthTx.length,
    expenseCount,
    avgCheck,
    topWeekday,
    topWeekdayAmount,
    topCategories,
    hasEnoughData,
  };
}

/**
 * Название дня недели.
 */
export const WEEKDAY_NAMES = [
  'понедельник',
  'вторник',
  'среда',
  'четверг',
  'пятница',
  'суббота',
  'воскресенье',
] as const;

/**
 * Название дня недели по индексу.
 */
export function weekdayName(idx: number): string {
  return WEEKDAY_NAMES[idx] ?? '';
}