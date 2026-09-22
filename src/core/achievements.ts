// src/core/achievements.ts

import type { Achievement, AchievementId } from '../types/achievement';
import type { DepositEvent } from '../types/deposit';
import type { Goal } from '../types/goal';
import type { ISODate } from '../types/common';
import { todayISODate } from './dates';

/**
 * Достижения — только факты. Никаких оценок.
 *
 * Открываются, когда пользователь достигает определённого рубежа.
 * Разблокированные — сохраняются навсегда.
 */
export const ACHIEVEMENT_DEFS: Record<AchievementId, Omit<Achievement, 'unlockedAt'>> = {
  'first-seed': {
    id: 'first-seed',
    title: 'Первый росток',
    description: 'Первое отложение в саду',
    icon: '🌱',
  },
  'ten-seeds': {
    id: 'ten-seeds',
    title: '10 семян',
    description: '10 отложений за всё время',
    icon: '🌿',
  },
  'full-month': {
    id: 'full-month',
    title: 'Полная ромашка',
    description: 'Месяц без пропусков',
    icon: '🌸',
  },
  'first-tree': {
    id: 'first-tree',
    title: 'Первое дерево',
    description: '100 дней отложений',
    icon: '🌳',
  },
  'hundred-days': {
    id: 'hundred-days',
    title: '100 дней роста',
    description: 'Стрик 100 дней',
    icon: '🔥',
  },
  'forest': {
    id: 'forest',
    title: 'Лес',
    description: 'Год с отложениями',
    icon: '🏞',
  },
  'big-saver': {
    id: 'big-saver',
    title: 'Крупный вклад',
    description: 'Отложено 100 000 ₽',
    icon: '💰',
  },
  'goal-reached': {
    id: 'goal-reached',
    title: 'Цель достигнута',
    description: 'Первая закрытая цель',
    icon: '🏆',
  },
  'investor': {
    id: 'investor',
    title: 'Инвестор',
    description: 'Первая инвестиция',
    icon: '💎',
  },
};

/**
 * Проверить, разблокировано ли достижение.
 */
function isUnlocked(
  id: AchievementId,
  deposits: DepositEvent[],
  goals: Goal[],
  totalDepositedMinor: number,
  streakActive: number,
  monthsWithDeposits: number,
): boolean {
  switch (id) {
    case 'first-seed':
      return deposits.length >= 1;

    case 'ten-seeds':
      return deposits.length >= 10;

    case 'full-month':
      return monthsWithDeposits >= 1;

    case 'first-tree':
      return deposits.length >= 100;

    case 'hundred-days':
      return streakActive >= 100;

    case 'forest':
      return monthsWithDeposits >= 12;

    case 'big-saver':
      return totalDepositedMinor >= 100_000_00; // 100 000 ₽

    case 'goal-reached':
      return goals.some((g) => {
        const saved = deposits
          .filter((d) => d.goalId === g.id)
          .reduce((sum, d) => sum + d.amount.minorUnits, 0);
        return saved >= g.targetAmount.minorUnits;
      });

    case 'investor':
      // Пока нет реального поля investments — заглушка.
      // Активируется в PHASE 5, когда ЗИ передаст первый пакет.
      return false;

    default:
      return false;
  }
}

/**
 * Вычислить все достижения на основе текущего состояния.
 */
export function computeAchievements(
  deposits: DepositEvent[],
  goals: Goal[],
  streakActive: number,
): Achievement[] {
  // Общая сумма отложений
  const totalDepositedMinor = deposits.reduce(
    (sum, d) => sum + d.amount.minorUnits,
    0,
  );

  // Уникальные месяцы с отложениями
  const monthsSet = new Set<string>();
  for (const d of deposits) {
    monthsSet.add(d.date.slice(0, 7));
  }
  const monthsWithDeposits = monthsSet.size;

  const today = todayISODate();

  return Object.values(ACHIEVEMENT_DEFS).map((def) => {
    const unlocked = isUnlocked(
      def.id,
      deposits,
      goals,
      totalDepositedMinor,
      streakActive,
      monthsWithDeposits,
    );

    return {
      ...def,
      unlockedAt: unlocked ? today : null,
    };
  });
}

/**
 * Количество разблокированных.
 */
export function countUnlocked(achievements: Achievement[]): number {
  return achievements.filter((a) => a.unlockedAt !== null).length;
}