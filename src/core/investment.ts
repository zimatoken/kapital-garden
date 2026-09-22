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
  const packet: ZITransferPacket = {
    version: 1,
    transferredAt: new Date().toISOString(),
    amount: { minorUnits: amountMinor, currency: 'RUB' },
    source: 'kapital-garden',
  };

  // Кладём пакет в localStorage (ЗИ его подхватит при старте)
  localStorage.setItem('zi.transfer.packet', JSON.stringify(packet));

  // Открываем ЗИ (замени на реальный URL, когда будет)
  window.open('https://zimatoken.github.io/golden-investor/', '_blank');
}