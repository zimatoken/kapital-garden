// src/core/goals.ts

import type { Goal } from '../types/goal';
import type { DepositEvent } from '../types/deposit';
import type { Money, ISODate } from '../types/common';
import { sumMoney, makeMoney } from './money';
import { todayISODate, diffDays, addDays } from './dates';

/**
 * Уровень дерева цели.
 * Растёт вместе с прогрессом.
 */
export type GoalStage =
  | 'seed'        // 0-10%
  | 'sprout'      // 10-25%
  | 'stem'        // 25-50%
  | 'young'       // 50-75%
  | 'flowering'   // 75-90%
  | 'fruiting'    // 90-99%
  | 'achieved';   // 100%

/**
 * Прогресс одной цели.
 */
export interface GoalProgress {
  goal: Goal;
  saved: Money;              // уже отложено
  target: Money;             // цель
  percent: number;           // 0..100
  remaining: Money;          // осталось
  etaDays: number | null;    // дней до цели при текущем темпе (null = мало данных)
  etaDate: ISODate | null;   // дата достижения
  stage: GoalStage;          // уровень дерева
  daysActive: number;        // сколько дней с первого отложения
  hasEnoughData: boolean;    // ≥ 7 дней данных
}

/**
 * Эмодзи стадии дерева.
 */
export const STAGE_EMOJI: Record<GoalStage, string> = {
  seed: '🌱',
  sprout: '🌿',
  stem: '🌾',
  young: '🌳',
  flowering: '🌸',
  fruiting: '🍎',
  achieved: '🏆',
};

/**
 * Название стадии.
 */
export const STAGE_LABEL: Record<GoalStage, string> = {
  seed: 'Семя',
  sprout: 'Росток',
  stem: 'Стебель',
  young: 'Молодое дерево',
  flowering: 'Цветущее дерево',
  fruiting: 'Плодоносящее дерево',
  achieved: 'Достигнута',
};

const MIN_DAYS_FOR_ETA = 7;

/**
 * Уровень дерева по проценту.
 */
export function goalStage(percent: number): GoalStage {
  if (percent >= 100) return 'achieved';
  if (percent >= 90) return 'fruiting';
  if (percent >= 75) return 'flowering';
  if (percent >= 50) return 'young';
  if (percent >= 25) return 'stem';
  if (percent >= 10) return 'sprout';
  return 'seed';
}

/**
 * Прогресс одной цели.
 *
 * Логика:
 * 1. Суммируем DepositEvent с goalId = goal.id.
 * 2. Считаем процент, остаток, стадию.
 * 3. ETA — если данных ≥ 7 дней.
 */
export function computeGoalProgress(
  goal: Goal,
  deposits: DepositEvent[],
  today: ISODate = todayISODate(),
): GoalProgress {
  // Все отложения по этой цели
  const goalDeposits = deposits.filter((d) => d.goalId === goal.id);

  // Сумма
  const saved =
    goalDeposits.length > 0
      ? sumMoney(goalDeposits.map((d) => d.amount))
      : makeMoney(0, goal.targetAmount.currency);

  const target = goal.targetAmount;
  const remaining = makeMoney(
    Math.max(0, target.minorUnits - saved.minorUnits),
    target.currency,
  );
  const percent =
    target.minorUnits > 0
      ? Math.min(100, (saved.minorUnits / target.minorUnits) * 100)
      : 0;
  const stage = goalStage(percent);

  // Дней с первого отложения
  let daysActive = 0;
  let firstDate: ISODate | null = null;
  if (goalDeposits.length > 0) {
    firstDate = goalDeposits
      .map((d) => d.date)
      .sort()[0];
    daysActive = Math.max(1, diffDays(firstDate, today) + 1);
  }

  // ETA — только если данных достаточно
  let etaDays: number | null = null;
  let etaDate: ISODate | null = null;

  if (daysActive >= MIN_DAYS_FOR_ETA && saved.minorUnits > 0) {
    const dailyAvg = saved.minorUnits / daysActive;
    if (dailyAvg > 0 && remaining.minorUnits > 0) {
      etaDays = Math.ceil(remaining.minorUnits / dailyAvg);
      // Ограничиваем сверху 100 годами — чтобы не было переполнения
      if (etaDays > 36500) etaDays = null;
      else etaDate = addDays(today, etaDays);
    } else if (remaining.minorUnits === 0) {
      etaDays = 0;
      etaDate = today;
    }
  }

  return {
    goal,
    saved,
    target,
    percent,
    remaining,
    etaDays,
    etaDate,
    stage,
    daysActive,
    hasEnoughData: daysActive >= MIN_DAYS_FOR_ETA,
  };
}

/**
 * Прогресс для списка целей.
 * Активные — сначала. Архивные — в конце.
 */
export function computeAllGoals(
  goals: Goal[],
  deposits: DepositEvent[],
  today: ISODate = todayISODate(),
): GoalProgress[] {
  return goals
    .map((g) => computeGoalProgress(g, deposits, today))
    .sort((a, b) => {
      // Архивные — в конце
      if (a.goal.archived !== b.goal.archived) {
        return a.goal.archived ? 1 : -1;
      }
      // Среди активных — по проценту (выше — раньше)
      return b.percent - a.percent;
    });
}

/**
 * Активные цели (не архивные).
 */
export function activeGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => !g.archived);
}

/**
 * Форматирование ETA как «14 месяцев» / «1 год 2 месяца» / «3 дня».
 */
export function formatEta(days: number | null): string | null {
  if (days === null) return null;
  if (days === 0) return 'уже здесь';
  if (days < 30) return `${days} ${plural(days, 'день', 'дня', 'дней')}`;

  const months = Math.round(days / 30);
  if (months < 12) {
    return `${months} ${plural(months, 'месяц', 'месяца', 'месяцев')}`;
  }

  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (remMonths === 0) {
    return `${years} ${plural(years, 'год', 'года', 'лет')}`;
  }
  return `${years} г. ${remMonths} мес.`;
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}