import { KGState } from './state';

/** Любой экспорт/импорт/бэкап — только через эту схему. */
export interface KGExportSchema {
  schemaVersion: number;
  app: 'kapital-garden';
  exportedAt: string;
  state: KGState;
}

// PHASE 4: ZITransferPacket — минимальный пакет синка с «Золотым Инвестором»
// (availableToInvest, lastDepositAt). Обмен данными — только по версионированным схемам.
