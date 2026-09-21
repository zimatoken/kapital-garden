import { Currency, Money } from '../types/common';

export function makeMoney(minorUnits: number, currency: Currency = 'RUB'): Money {
  if (!Number.isInteger(minorUnits)) {
    throw new Error('Money must be integer minor units — no floats for money');
  }
  return { minorUnits, currency };
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) throw new Error('Currency mismatch');
  return makeMoney(a.minorUnits + b.minorUnits, a.currency);
}

export function sumMoney(items: Money[]): Money {
  const currency = items[0]?.currency ?? 'RUB';
  const total = items.reduce((s, m) => {
    if (m.currency !== currency) throw new Error('Currency mismatch');
    return s + m.minorUnits;
  }, 0);
  return makeMoney(total, currency);
}

export function formatMoney(m: Money, locale = 'ru-RU'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: m.currency }).format(
    m.minorUnits / 100,
  );
}
