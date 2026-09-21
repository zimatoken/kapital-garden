import { ISODate } from '../types/common';
import { DepositEvent } from '../types/deposit';
import { addDays, diffDays } from './dates';

/**
 * СТРИК v1.1 — не наказание, а температура.
 * Сгорает частично, с грейсом, и никогда не стирает лучшее достижение.
 */
export interface StreakInfo {
  /** АКТИВНЫЙ — сколько дней подряд от текущего дня назад. Может увядать. */
  active: number;
  /** ЛУЧШИЙ — максимум за всю историю. НЕ СГОРАЕТ НИКОГДА. */
  best: number;
  /** 0..1 — для визуала круга. 1 = горит ярко, 0.15 = тёплое ядро в сером. */
  vitality: number;
  status: 'growing' | 'wilting' | 'dormant';
  lastDepositDate: ISODate | null;
}

function countBack(days: Set<ISODate>, from: ISODate): number {
  let n = 0;
  let d = from;
  while (days.has(d)) {
    n += 1;
    d = addDays(d, -1);
  }
  return n;
}

function computeBestStreak(days: Set<ISODate>): number {
  const sorted = [...days].sort();
  let best = 0;
  let cur = 0;
  let prev: ISODate | null = null;
  for (const d of sorted) {
    cur = prev !== null && diffDays(prev, d) === 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
    prev = d;
  }
  return best;
}

function lastDepositDate(deposits: DepositEvent[]): ISODate | null {
  if (deposits.length === 0) return null;
  const sorted = deposits.map((d) => d.date).sort();
  return sorted[sorted.length - 1];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * ГРЕЙС-МЕХАНИКА (правило увядания):
 *   1 день пропуска → −1 | 2 дня → −3 | 3 дня → −7 | 4+ → active 0 (dormant)
 * ЛУЧШИЙ стрик при этом НИКОГДА не уменьшается.
 */
export function computeStreak(deposits: DepositEvent[], today: ISODate): StreakInfo {
  const days = new Set(deposits.map((d) => d.date));
  const best = computeBestStreak(days);
  const last = lastDepositDate(deposits);

  if (!last) {
    return { active: 0, best: 0, vitality: 0, status: 'dormant', lastDepositDate: null };
  }

  const daysSinceLast = diffDays(last, today);

  if (daysSinceLast === 0) {
    const active = countBack(days, today);
    return { active, best, vitality: 1, status: 'growing', lastDepositDate: last };
  }

  const decay =
    daysSinceLast === 1 ? 1
    : daysSinceLast === 2 ? 3
    : daysSinceLast === 3 ? 7
    : Number.POSITIVE_INFINITY;

  const rawActive = countBack(days, addDays(last, -1)); // стрик до пропуска
  const active = decay === Number.POSITIVE_INFINITY ? 0 : Math.max(0, rawActive - decay);
  const vitality = active === 0
    ? 0.15 // «Сад дремлет. Он помнит тебя.» — тёплое ядро, не пустота
    : clamp(active / Math.max(best, 30), 0.3, 0.95);

  return {
    active,
    best,
    vitality,
    status: active === 0 ? 'dormant' : 'wilting',
    lastDepositDate: last,
  };
}

/** Вызывать ПОСЛЕ добавления нового DepositEvent: было ли это возрождение. */
export function isRevival(prev: StreakInfo, next: StreakInfo): boolean {
  return (
    prev.status !== 'growing' &&
    next.status === 'growing' &&
    prev.lastDepositDate !== next.lastDepositDate
  );
}
