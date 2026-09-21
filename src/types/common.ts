export type Currency = 'RUB' | 'USD' | 'EUR' | (string & {});

/**
 * Деньги — ВСЕГДА integer minorUnits (копейки).
 * 15000 = 150.00 ₽. Никогда float: иначе 0.1 + 0.2 ≠ 0.3 в продукте.
 */
export interface Money {
  minorUnits: number;
  currency: Currency;
}

/**
 * Дата как ISO-строка 'YYYY-MM-DD' — ключи, стрик, сад года.
 * НЕ Date-объекты: нет timezone-адов, сериализация детерминирована.
 */
export type ISODate = string;
