import { describe, expect, it } from 'vitest';
import { DepositEvent } from '../../types/deposit';
import { addDays } from '../dates';
import { makeMoney } from '../money';
import { computeStreak } from '../streak';

const TODAY = '2026-09-20';

function dep(date: string): DepositEvent {
  return { id: crypto.randomUUID(), date, amount: makeMoney(100_00), source: 'manual', goalId: null, note: '' };
}

function range(from: string, n: number): DepositEvent[] {
  return Array.from({ length: n }, (_, i) => dep(addDays(from, i)));
}

describe('computeStreak v1.1', () => {
  it('пустой сад → dormant, всё по нулям', () => {
    const s = computeStreak([], TODAY);
    expect(s).toEqual({ active: 0, best: 0, vitality: 0, status: 'dormant', lastDepositDate: null });
  });

  it('30 дней подряд → active 30, best 30, growing', () => {
    // 2026-08-22 + 29 дней = 2026-09-20 — последний день = сегодня
    const s = computeStreak(range('2026-08-22', 30), TODAY);
    expect(s.active).toBe(30);
    expect(s.best).toBe(30);
    expect(s.status).toBe('growing');
    expect(s.vitality).toBe(1);
  });

  it('пропуск 1 день → wilting, active увял на 1, best СОХРАНЁН', () => {
    // последнее отложение 2026-09-19, сегодня 20-е
    const s = computeStreak(range('2026-08-22', 29), TODAY);
    expect(s.status).toBe('wilting');
    expect(s.active).toBe(27); // 28 подряд до пропуска − 1 грейс
    expect(s.best).toBe(29);
  });

  it('пропуск 5 дней → dormant, но best НЕ сгорел + тёплое ядро', () => {
    // последнее отложение 2026-09-13
    const s = computeStreak(range('2026-08-15', 30), TODAY);
    expect(s.status).toBe('dormant');
    expect(s.active).toBe(0);
    expect(s.best).toBe(30);
    expect(s.vitality).toBe(0.15);
  });

  it('возрождение → active 1, best цел', () => {
    const deposits = [...range('2026-08-15', 30), dep(TODAY)];
    const s = computeStreak(deposits, TODAY);
    expect(s.status).toBe('growing');
    expect(s.active).toBe(1);
    expect(s.best).toBe(30);
  });

  it('лучший стрик считается по истории, а не только с конца', () => {
    // 10 дней в августе + сегодня (без сентября)
    const deposits = [...range('2026-08-01', 10), dep(TODAY)];
    const s = computeStreak(deposits, TODAY);
    expect(s.best).toBe(10);
    expect(s.active).toBe(1);
  });
});
