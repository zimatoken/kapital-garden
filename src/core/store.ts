// src/core/store.ts

import type { KGState } from '../types/state';
import type { DepositEvent, DepositSource } from '../types/deposit';
import type { Transaction, TxType } from '../types/transaction';
import { makeMoney } from './money';
import { todayISODate } from './dates';
import type { StorageAdapter } from './storage';

/**
 * Хранилище состояния приложения.
 * Синглтон: одно состояние на всё приложение.
 *
 * Архитектура:
 * - StorageAdapter — источник правды (localStorage).
 * - Store — обёртка для UI (subscriptions).
 * - Все вычисляемые величины — ЧИСТЫЕ функции от state (не в Store).
 */
export class Store {
  private state: KGState;
  private adapter: StorageAdapter;
  private listeners: Set<() => void> = new Set();

  constructor(adapter: StorageAdapter, initialState: KGState) {
    this.adapter = adapter;
    this.state = initialState;
  }

  /** Получить текущее состояние (immutable). */
  getState(): KGState {
    return this.state;
  }

  /** Подписка на изменения. Возвращает unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Уведомить всех слушателей. */
  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /* ─── Отложения (семена) ──────────────────── */

  /** Добавить отложение. */
  async addDeposit(params: {
    amountMinor: number;
    source: DepositSource;
    goalId?: string | null;
    note?: string;
    date?: string;
  }): Promise<DepositEvent> {
    const event: DepositEvent = {
      id: crypto.randomUUID(),
      date: params.date ?? todayISODate(),
      amount: makeMoney(params.amountMinor, this.state.settings.baseCurrency),
      source: params.source,
      goalId: params.goalId ?? null,
      note: params.note ?? '',
    };

    this.state = {
      ...this.state,
      deposits: [...this.state.deposits, event],
    };

    await this.adapter.save(this.state);
    this.notify();

    return event;
  }

  /** Удалить отложение. */
  async removeDeposit(id: string): Promise<void> {
    this.state = {
      ...this.state,
      deposits: this.state.deposits.filter((d) => d.id !== id),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Транзакции (бюджет) ─────────────────── */

  /** Добавить транзакцию (доход или расход). */
  async addTransaction(params: {
    type: TxType;
    amountMinor: number;
    categoryId: string;
    note?: string;
    date?: string;
  }): Promise<Transaction> {
    const tx: Transaction = {
      id: crypto.randomUUID(),
      date: params.date ?? todayISODate(),
      type: params.type,
      amount: makeMoney(params.amountMinor, this.state.settings.baseCurrency),
      categoryId: params.categoryId,
      note: params.note ?? '',
    };

    this.state = {
      ...this.state,
      transactions: [...this.state.transactions, tx],
    };

    await this.adapter.save(this.state);
    this.notify();

    return tx;
  }

  /** Удалить транзакцию. */
  async removeTransaction(id: string): Promise<void> {
    this.state = {
      ...this.state,
      transactions: this.state.transactions.filter((t) => t.id !== id),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Настройки ───────────────────────────── */

  /** Обновить настройки. */
  async updateSettings(patch: Partial<KGState['settings']>): Promise<void> {
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...patch },
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Отложить 10% от дохода ──────────────── */

  /**
   * Добавить доход + предложить отложить 10%.
   *
   * Логика:
   * 1. Сохранить доход как Transaction.
   * 2. Вернуть размер предлагаемого отложения (10% от суммы).
   * 3. Пользователь решает — подтвердить или нет.
   * 4. Если подтвердил — вызывается addDeposit.
   */
  async addIncome(params: {
    amountMinor: number;
    categoryId: string;
    note?: string;
    date?: string;
  }): Promise<{
    transaction: Transaction;
    suggestedDepositMinor: number;
  }> {
    const transaction = await this.addTransaction({
      type: 'income',
      amountMinor: params.amountMinor,
      categoryId: params.categoryId,
      note: params.note,
      date: params.date,
    });

    const percent = this.state.settings.savings.percent;
    const suggestedDepositMinor = Math.round((params.amountMinor * percent) / 100);

    return { transaction, suggestedDepositMinor };
  }
}

/**
 * Глобальный экземпляр Store.
 * Создаётся в App.tsx после загрузки состояния.
 */
let _store: Store | null = null;

export function initStore(adapter: StorageAdapter, state: KGState): Store {
  _store = new Store(adapter, state);
  return _store;
}

export function getStore(): Store {
  if (!_store) {
    throw new Error('Store не инициализирован. Вызови initStore() сначала.');
  }
  return _store;
}