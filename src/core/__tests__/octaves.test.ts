import { describe, expect, it } from 'vitest';
import { octaveFromDay } from '../octaves';

describe('octaveFromDay — границы 8 октав', () => {
  it.each([
    [1, 1], [2, 2], [7, 2],
    [8, 3], [14, 3],
    [15, 4], [30, 4],
    [31, 5], [90, 5],
    [91, 6], [180, 6],
    [181, 7], [365, 7],
    [366, 8], [1000, 8],
  ])('день %i → октава %i', (day, level) => {
    expect(octaveFromDay(day).level).toBe(level);
  });

  it('день 1 — СЕМЯ, с мотивацией', () => {
    const o = octaveFromDay(1);
    expect(o.emoji).toBe('🌱');
    expect(o.motivation.length).toBeGreaterThan(0);
  });

  it('ЛЕС — без верхней границы', () => {
    expect(octaveFromDay(366).rangeEnd).toBeNull();
  });
});
