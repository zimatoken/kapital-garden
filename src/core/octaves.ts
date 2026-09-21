import { ISODate } from '../types/common';
import { DepositEvent } from '../types/deposit';
import { diffDays } from './dates';

/**
 * 8 ОКТАВ РОСТА. Каждая — мотивация, достижение, шаг к свободе.
 * Уровень вычисляется из дня роста: от первого отложения до сегодня.
 */
export interface OctaveInfo {
  level: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  emoji: string;
  name: string;
  motivation: string;
  /** Текущий день роста (первое отложение = день 1). */
  day: number;
  rangeStart: number;
  rangeEnd: number | null; // null = бесконечность (ЛЕС)
}

const OCTAVES: OctaveInfo[] = [
  { level: 1, emoji: '🌱', name: 'СЕМЯ', day: 0, rangeStart: 1, rangeEnd: 1,
    motivation: 'Ты посадил семя. Оно прорастёт.' },
  { level: 2, emoji: '🌿', name: 'РОСТОК', day: 0, rangeStart: 2, rangeEnd: 7,
    motivation: 'Росток пробился. Не бросай.' },
  { level: 3, emoji: '🌾', name: 'СТЕБЕЛЬ', day: 0, rangeStart: 8, rangeEnd: 14,
    motivation: 'Стебель растёт. Ты набираешь силу.' },
  { level: 4, emoji: '🌳', name: 'МОЛОДОЕ ДЕРЕВО', day: 0, rangeStart: 15, rangeEnd: 30,
    motivation: 'Первое дерево. Ты садовник.' },
  { level: 5, emoji: '🌸', name: 'ЦВЕТУЩЕЕ ДЕРЕВО', day: 0, rangeStart: 31, rangeEnd: 90,
    motivation: 'Твой сад цветёт. Продолжай.' },
  { level: 6, emoji: '🍎', name: 'ПЛОДОНОСЯЩЕЕ ДЕРЕВО', day: 0, rangeStart: 91, rangeEnd: 180,
    motivation: 'Ты собираешь первые плоды.' },
  { level: 7, emoji: '🌲', name: 'БОЛЬШОЕ ДЕРЕВО', day: 0, rangeStart: 181, rangeEnd: 365,
    motivation: 'Ты построил дерево жизни.' },
  { level: 8, emoji: '🏞️', name: 'ЛЕС', day: 0, rangeStart: 366, rangeEnd: null,
    motivation: 'Твой лес растёт. Это наследие.' },
];

export function octaveFromDay(day: number): OctaveInfo {
  for (let i = OCTAVES.length - 1; i >= 0; i--) {
    const o = OCTAVES[i];
    if (day >= o.rangeStart) return { ...o, day };
  }
  return { ...OCTAVES[0], day };
}

/** null, если семян ещё нет — сад ждёт первого посева. */
export function computeOctave(deposits: DepositEvent[], today: ISODate): OctaveInfo | null {
  if (deposits.length === 0) return null;
  const first = deposits.map((d) => d.date).sort()[0];
  return octaveFromDay(diffDays(first, today) + 1);
}
