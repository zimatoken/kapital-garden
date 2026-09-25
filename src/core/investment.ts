// src/core/investment.ts

import type { Money } from '../types/common';

/**
 * Пакет для передачи в «Золотой Инвестор».
 *
 * PHASE 5 — пока заглушка. Реальная интеграция позже.
 */
export interface ZITransferPacket {
  version: 1;
  transferredAt: string; // ISO datetime
  amount: Money;
  source: 'kapital-garden';
}

/**
 * Открыть «Золотой Инвестор» с передачей суммы.
 *
 * Если ЗИ открыт в новой вкладке — передаём через localStorage.
 * Если позже будет общая шина — заменим на postMessage.
 */
export function openGoldenInvestor(amountMinor: number): void {
  // 1. Формируем URL с параметрами
  const params = new URLSearchParams({
    from: 'kg',
    amount: String(amountMinor), // обязательно строка
    currency: 'RUB',
    ts: String(Date.now()), // метка времени
  });

  const url = `https://zimatoken.github.io/golden-investor/?${params.toString()}`;

  // 2. Открываем ЗИ по этому URL
  window.open(url, '_blank');

  // 3. (Опционально) Можем записать в свой лог, что передали данные
  console.log(`[KG → ЗИ] Передано ${amountMinor / 100} ₽. URL: ${url}`);
}