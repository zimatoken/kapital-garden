// src/core/bridgeFromZI.ts
//
// Обратный поток: читает результат от ЗИ (общий origin zimatoken.github.io).

export type KGZIStatus = 'accepted' | 'dismissed' | 'invested';

export interface KGZIResult {
  ts: number;
  amountMinor: number;
  currency: string;
  status: KGZIStatus;
  updatedAt: string;
  action?: 'ofz' | 'gold' | 'deposit' | null;
}

const STORAGE_KEY = 'kg_zi_result_v1';

/** Максимальный возраст записи, которую показываем — 7 дней. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/** Прочитать результат от ЗИ. Возвращает null, если нет или старый. */
export function loadFreshZIResult(): KGZIResult | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as KGZIResult;
    if (
      typeof parsed.ts !== 'number' ||
      typeof parsed.amountMinor !== 'number' ||
      typeof parsed.status !== 'string' ||
      typeof parsed.updatedAt !== 'string'
    ) {
      return null;
    }

    // Фильтр свежести
    const age = Date.now() - new Date(parsed.updatedAt).getTime();
    if (age > MAX_AGE_MS) return null;

    return parsed;
  } catch {
    return null;
  }
}

/** Очистить (например, когда пользователь закрыл баннер). */
export function clearZIResult(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Форматирование суммы. */
export function formatZIMoney(amountMinor: number, currency: string): string {
  const symbol = currency === 'RUB' ? '₽' : currency;
  const major = amountMinor / 100;
  return `${major.toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ${symbol}`;
}