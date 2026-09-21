import { describe, expect, it } from 'vitest';
import { forecastGrowth } from '../forecast';

describe('forecastGrowth', () => {
  it('ставка 0 → ровно вложенное (линейно)', () => {
    const fc = forecastGrowth(10_000_00, 0, 1); // 10 000 ₽/мес, год
    expect(fc).toHaveLength(1);
    expect(fc[0].totalMinorUnits).toBe(12 * 10_000_00);
    expect(fc[0].investedMinorUnits).toBe(fc[0].totalMinorUnits);
  });

  it('ставка 10% → больше, чем вложено', () => {
    const fc = forecastGrowth(10_000_00, 10, 10);
    const last = fc[fc.length - 1];
    expect(last.year).toBe(10);
    expect(last.totalMinorUnits).toBeGreaterThan(last.investedMinorUnits);
  });

  it('вывод — всегда integer minorUnits', () => {
    const fc = forecastGrowth(3_333_33, 10, 5);
    for (const p of fc) {
      expect(Number.isInteger(p.totalMinorUnits)).toBe(true);
      expect(Number.isInteger(p.investedMinorUnits)).toBe(true);
    }
  });
});
