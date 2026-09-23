// src/core/goalScenarios.ts

import type { GoalProgress } from './goals';
import type { ISODate } from '../types/common';
import { addDays, diffDays, todayISODate } from './dates';

/**
 * Сценарии цели — «что если ускорить темп?».
 *
 * ТОЛЬКО ФАКТЫ. Никаких «ты должен копить быстрее».
 * Просто математика: если темп x1.1 → цель на N дней раньше.
 */
export interface GoalScenario {
  /** Коэффициент ускорения (1.0 = базовый, 1.1 = +10%). */
  multiplier: number;
  /** Человеко-читаемая подпись: '+10% к темпу'. */
  label: string;
  /** Новый ETA в днях. */
  etaDays: number;
  /** Новая дата достижения. */
  etaDate: ISODate;
  /** Разница с базовым ETA в днях (отрицательная = быстрее). */
  deltaDays: number;
}

export interface GoalScenarios {
  /** Базовый ETA (без ускорения). */
  base: GoalScenario | null;
  /** Сценарии ускорения. */
  scenarios: GoalScenario[];
  /** План: сколько нужно откладывать в месяц, чтобы уложиться в базовый ETA. */
  monthlyPlan: {
    perMonthMinor: number;
    perDayMinor: number;
  } | null;
}

const MIN_DAYS_FOR_SCENARIOS = 7;

/**
 * Рассчитать сценарии для цели.
 *
 * @param progress — прогресс цели (уже посчитан computeGoalProgress)
 * @param today — текущая дата
 */
export function computeGoalScenarios(
  progress: GoalProgress,
  today: ISODate = todayISODate(),
): GoalScenarios {
  // Мало данных — сценариев нет
  if (
    !progress.hasEnoughData ||
    progress.saved.minorUnits === 0 ||
    progress.remaining.minorUnits === 0 ||
    progress.daysActive < MIN_DAYS_FOR_SCENARIOS
  ) {
    return { base: null, scenarios: [], monthlyPlan: null };
  }

  const dailyAvg = progress.saved.minorUnits / progress.daysActive;

  if (dailyAvg <= 0) {
    return { base: null, scenarios: [], monthlyPlan: null };
  }

  // Базовый ETA
  const baseEtaDays = Math.ceil(progress.remaining.minorUnits / dailyAvg);
  const baseEtaDate = addDays(today, baseEtaDays);

  const base: GoalScenario = {
    multiplier: 1.0,
    label: 'Текущий темп',
    etaDays: baseEtaDays,
    etaDate: baseEtaDate,
    deltaDays: 0,
  };

  // Сценарии ускорения
  const multipliers = [1.1, 1.25, 1.5, 2.0];
  const scenarios: GoalScenario[] = multipliers.map((m) => {
    const eta = Math.ceil(progress.remaining.minorUnits / (dailyAvg * m));
    return {
      multiplier: m,
      label: labelFor(m),
      etaDays: eta,
      etaDate: addDays(today, eta),
      deltaDays: eta - baseEtaDays,
    };
  });

  // План: сколько в месяц нужно, чтобы уложиться в базовый ETA
  const monthsLeft = Math.max(1, Math.round(baseEtaDays / 30));
  const perMonthMinor = Math.ceil(progress.remaining.minorUnits / monthsLeft);
  const perDayMinor = Math.ceil(progress.remaining.minorUnits / baseEtaDays);

  return {
    base,
    scenarios,
    monthlyPlan: {
      perMonthMinor,
      perDayMinor,
    },
  };
}

/**
 * Подпись для множителя.
 */
function labelFor(m: number): string {
  if (m === 1.1) return '+10%';
  if (m === 1.25) return '+25%';
  if (m === 1.5) return '+50%';
  if (m === 2.0) return '+100%';
  return `×${m.toFixed(2)}`;
}

/**
 * Форматирование delta в днях: '-1.3 мес' / '-15 дней'.
 */
export function formatDelta(days: number): string {
  if (days === 0) return '—';
  if (Math.abs(days) < 30) return `${days} дн.`;
  const months = Math.round(days / 30);
  return `${months > 0 ? '+' : ''}${months} мес.`;
}

/**
 * Форматирование дней в 'X дн.' / 'X мес.' / 'X лет'.
 * Переиспользует логику formatEta из goals.ts, но не импортирует —
 * чтобы не было циклической зависимости.
 */
export function formatDaysShort(days: number): string {
  if (days < 30) return `${days} дн.`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} мес.`;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (rem === 0) return `${years} г.`;
  return `${years} г. ${rem} мес.`;
}