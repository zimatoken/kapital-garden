import { DepositEvent } from '../types/deposit';
import { daysInMonth } from './dates';

/**
 * САД ГОДА — 12 деревьев = 12 месяцев.
 * Полный месяц — цветущее дерево. Пропущенный — пустое место.
 */
export type MonthStatus = 'full' | 'partial' | 'little' | 'missed';

export interface GardenMonth {
  year: number;
  month: number; // 1-12
  label: string; // '2026-01'
  daysActive: number;
  daysTotal: number;
  status: MonthStatus;
}

export const STATUS_EMOJI: Record<MonthStatus, string> = {
  full: '🌸', // все дни месяца — цветущее дерево
  partial: '🍎', // 15-29 дней — с плодами
  little: '🌱', // 1-14 дней — тонкое дерево
  missed: '⚫', // 0 дней — пустое место
};

export function computeGardenYear(deposits: DepositEvent[], year: number): GardenMonth[] {
  const byMonth = new Map<string, Set<number>>();
  for (const d of deposits) {
    const [y, m, day] = d.date.split('-').map(Number);
    if (y !== year) continue;
    const key = `${y}-${String(m).padStart(2, '0')}`;
    if (!byMonth.has(key)) byMonth.set(key, new Set());
    byMonth.get(key)!.add(day);
  }

  const out: GardenMonth[] = [];
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`;
    const days = byMonth.get(key) ?? new Set<number>();
    const total = daysInMonth(year, m - 1);
    const n = days.size;
    const status: MonthStatus =
      n === 0 ? 'missed'
      : n >= total ? 'full'
      : n >= 15 ? 'partial'
      : 'little';
    out.push({ year, month: m, label: key, daysActive: n, daysTotal: total, status });
  }
  return out;
}
