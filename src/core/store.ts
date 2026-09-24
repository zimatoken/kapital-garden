// src/core/store.ts

import type { KGState } from '../types/state';
import type { DepositEvent, DepositSource } from '../types/deposit';
import type { Transaction, TxType } from '../types/transaction';
import type { Goal, GoalKind, GoalIcon } from '../types/goal';
import type { RecurringExpense } from '../types/recurring';
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

  getState(): KGState {
    return this.state;
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) listener();
  }

  /* ─── Отложения (семена) ──────────────────── */

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

  async removeDeposit(id: string): Promise<void> {
    this.state = {
      ...this.state,
      deposits: this.state.deposits.filter((d) => d.id !== id),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Транзакции (бюджет) ─────────────────── */

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

  async removeTransaction(id: string): Promise<void> {
    this.state = {
      ...this.state,
      transactions: this.state.transactions.filter((t) => t.id !== id),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Отложить 10% от дохода ──────────────── */

  async addIncome(params: {
    amountMinor: number;
    categoryId: string;
    note?: string;
    date?: string;
    goalId?: string | null;
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

  /* ─── Цели ────────────────────────────────── */

  async addGoal(params: {
    kind: GoalKind;
    icon: GoalIcon;
    title: string;
    targetMinor: number;
    targetDate?: string | null;
  }): Promise<Goal> {
    const goal: Goal = {
      id: crypto.randomUUID(),
      kind: params.kind,
      icon: params.icon,
      title: params.title,
      targetAmount: makeMoney(params.targetMinor, this.state.settings.baseCurrency),
      targetDate: params.targetDate ?? null,
      createdAt: todayISODate(),
      archived: false,
    };

    this.state = {
      ...this.state,
      goals: [...this.state.goals, goal],
    };

    await this.adapter.save(this.state);
    this.notify();

    return goal;
  }

  async updateGoal(id: string, patch: Partial<Goal>): Promise<void> {
    this.state = {
      ...this.state,
      goals: this.state.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  async archiveGoal(id: string): Promise<void> {
    await this.updateGoal(id, { archived: true });
  }

  async unarchiveGoal(id: string): Promise<void> {
    await this.updateGoal(id, { archived: false });
  }

  /**
   * Удалить цель полностью.
   *
   * Отложения с этим goalId НЕ удаляются — они просто
   * перестают быть привязанными к цели (goalId остаётся,
   * но computeGoalProgress больше её не найдёт).
   *
   * Так пользователь не теряет историю отложений.
   */
  async removeGoal(id: string): Promise<void> {
    this.state = {
      ...this.state,
      goals: this.state.goals.filter((g) => g.id !== id),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Регулярные расходы ─────────────────── */

  async addRecurring(params: {
    title: string;
    amountMinor: number;
    categoryId: string;
    dayOfMonth: number;
    note?: string;
  }): Promise<RecurringExpense> {
    const recurring: RecurringExpense = {
      id: crypto.randomUUID(),
      title: params.title,
      amount: makeMoney(params.amountMinor, this.state.settings.baseCurrency),
      categoryId: params.categoryId,
      dayOfMonth: params.dayOfMonth,
      lastAppliedMonth: null,
      active: true,
      note: params.note ?? params.title,
      createdAt: todayISODate(),
    };

    this.state = {
      ...this.state,
      recurring: [...this.state.recurring, recurring],
    };

    await this.adapter.save(this.state);
    this.notify();

    return recurring;
  }

  async updateRecurring(recurring: RecurringExpense): Promise<void> {
    this.state = {
      ...this.state,
      recurring: this.state.recurring.map((r) =>
        r.id === recurring.id ? recurring : r,
      ),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  async removeRecurring(id: string): Promise<void> {
    this.state = {
      ...this.state,
      recurring: this.state.recurring.filter((r) => r.id !== id),
    };
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Импорт / экспорт ─────────────────── */

  async replaceState(next: KGState): Promise<void> {
    const safe: KGState = {
      ...next,
      recurring: Array.isArray(next.recurring) ? next.recurring : [],
      transactions: Array.isArray(next.transactions) ? next.transactions : [],
      deposits: Array.isArray(next.deposits) ? next.deposits : [],
      goals: Array.isArray(next.goals) ? next.goals : [],
      categories: Array.isArray(next.categories) ? next.categories : [],
    };

    this.state = safe;
    await this.adapter.save(this.state);
    this.notify();
  }

  /* ─── Настройки ───────────────────────────── */

  async updateSettings(patch: Partial<KGState['settings']>): Promise<void> {
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...patch },
    };
    await this.adapter.save(this.state);
    this.notify();
  }
}

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