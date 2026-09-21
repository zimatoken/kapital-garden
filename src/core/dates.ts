import { ISODate } from '../types/common';

/** Сегодня как ISODate. */
export function todayISODate(): ISODate {
  return new Date().toISOString().slice(0, 10);
}

/** n дней от даты. Без timezone-магии — только UTC-арифметика по частям. */
export function addDays(iso: ISODate, n: number): ISODate {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** Сколько дней от `from` до `to` (to - from). */
export function diffDays(from: ISODate, to: ISODate): number {
  const [ay, am, ad] = from.split('-').map(Number);
  const [by, bm, bd] = to.split('-').map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/** Число дней в месяце. monthIndex0: 0 = январь. */
export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).getUTCDate();
}
