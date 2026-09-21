import { describe, expect, it } from 'vitest';
import { addMoney, formatMoney, makeMoney, sumMoney } from '../money';

describe('money — integer minorUnits', () => {
  it('сложение копеек без float-адов', () => {
    const a = makeMoney(10); // 0.10 ₽
    const b = makeMoney(20); // 0.20 ₽
    expect(addMoney(a, b).minorUnits).toBe(30); // а не 29.999...
  });

  it('sumMoney пустого = 0 RUB', () => {
    expect(sumMoney([])).toEqual({ minorUnits: 0, currency: 'RUB' });
  });

  it('несовпадение валют → ошибка', () => {
    expect(() => addMoney(makeMoney(100, 'RUB'), makeMoney(100, 'USD'))).toThrow();
  });

  it('float в minorUnits → ошибка сразу', () => {
    expect(() => makeMoney(0.1 + 0.2)).toThrow();
  });

  it('formatMoney — человекочитаемо', () => {
    const s = formatMoney(makeMoney(150_00));
    expect(s).toContain('150');
  });
});
