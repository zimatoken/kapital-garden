// src/screens/BudgetScreen.tsx

import { useMemo, useState, useEffect } from 'react';
import { useStore, useStoreState } from '../hooks/useStore';
import { todayISODate } from '../core/dates';
import { sumMoney, formatMoney } from '../core/money';
import { STRINGS } from '../data/strings';
import { DEFAULT_CATEGORIES } from '../data/defaultCategories';
import { computePatterns } from '../core/patterns';
import { PatternsCard } from '../components/PatternsCard';
import { guessCategory } from '../core/categoryRules';
import { openGoldenInvestor } from '../core/investment';
import { previousMonthKey } from '../core/pulse';
import {
  TransactionFilters,
  applyFilters,
  type TxFilters,
} from '../components/TransactionFilters';
import type { Transaction, TxType } from '../types/transaction';
import type { Goal } from '../types/goal';

export function BudgetScreen() {
  const state = useStoreState();
  const store = useStore();
  const [addType, setAddType] = useState<TxType | null>(null);

  const today = todayISODate();
  const monthKey = today.slice(0, 7);

  const monthTransactions = useMemo(
    () => state.transactions.filter((t) => t.date.startsWith(monthKey)),
    [state.transactions, monthKey],
  );

  const income = useMemo(
    () =>
      sumMoney(
        monthTransactions.filter((t) => t.type === 'income').map((t) => t.amount),
      ),
    [monthTransactions],
  );

  const expense = useMemo(
    () =>
      sumMoney(
        monthTransactions.filter((t) => t.type === 'expense').map((t) => t.amount),
      ),
    [monthTransactions],
  );

  const deposited = useMemo(
    () =>
      sumMoney(
        state.deposits
          .filter((d) => d.date.startsWith(monthKey))
          .map((d) => d.amount),
      ),
    [state.deposits, monthKey],
  );

  const freeMinor = income.minorUnits - expense.minorUnits - deposited.minorUnits;

  const patterns = useMemo(
    () => computePatterns(state.transactions, state.categories, monthKey),
    [state.transactions, state.categories, monthKey],
  );

  const monthLabel = useMemo(() => {
    const MONTHS = [
      'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
      'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
    ];
    const [year, month] = monthKey.split('-');
    return `${MONTHS[parseInt(month, 10) - 1]} ${year}`;
  }, [monthKey]);

  // ─── Фильтры транзакций ───
  const [txFilters, setTxFilters] = useState<TxFilters>({
    type: 'all',
    categoryId: 'all',
    month: 'current',
    query: '',
  });

  const prevMonthKey = useMemo(() => previousMonthKey(monthKey), [monthKey]);

  const filteredTransactions = useMemo(
    () =>
      applyFilters(
        state.transactions,
        txFilters,
        monthKey,
        prevMonthKey,
      ),
    [state.transactions, txFilters, monthKey, prevMonthKey],
  );

  return (
    <div className="budget-screen">
      <header className="header">
        <span className="logo">💰</span>
        <div>
          <h1>{STRINGS.budgetTitle}</h1>
          <p className="tagline">{formatMonth(monthKey)}</p>
        </div>
      </header>

      <main className="budget-main">
        <section className="card budget-summary">
          <div className="budget-row">
            <span className="budget-label">{STRINGS.budgetIncome}</span>
            <span className="budget-value budget-value-income">
              {formatMoney(income)}
            </span>
          </div>
          <div className="budget-row">
            <span className="budget-label">{STRINGS.budgetExpense}</span>
            <span className="budget-value budget-value-expense">
              {formatMoney(expense)}
            </span>
          </div>
          <div className="budget-row">
            <span className="budget-label">{STRINGS.budgetDeposited}</span>
            <span className="budget-value budget-value-deposited">
              {formatMoney(deposited)}
            </span>
          </div>
          <div className="budget-divider" />
          <div className="budget-row budget-row-total">
            <span className="budget-label">{STRINGS.budgetFree}</span>
            <span
              className={`budget-value ${freeMinor >= 0 ? 'budget-value-free' : 'budget-value-negative'}`}
            >
              {formatMoney({ minorUnits: freeMinor, currency: 'RUB' })}
            </span>
          </div>

          {freeMinor > 0 && (
            <button
              className="btn-invest"
              onClick={() => openGoldenInvestor(freeMinor)}
            >
              {STRINGS.budgetInvestButton}
            </button>
          )}
        </section>

        <div className="budget-actions">
          <button
            className="btn-action btn-action-income"
            onClick={() => setAddType('income')}
          >
            {STRINGS.budgetAddIncome}
          </button>
          <button
            className="btn-action btn-action-expense"
            onClick={() => setAddType('expense')}
          >
            {STRINGS.budgetAddExpense}
          </button>
        </div>

        <section className="card">
          <h2>{STRINGS.budgetTransactions}</h2>

          <TransactionFilters
            filters={txFilters}
            onChange={setTxFilters}
            categories={state.categories}
            monthLabel={monthLabel}
          />

          {filteredTransactions.length === 0 ? (
            <p className="muted">
              {monthTransactions.length === 0
                ? STRINGS.budgetNoTransactions
                : 'Ничего не найдено. Попробуй изменить фильтры.'}
            </p>
          ) : (
            <div className="tx-list">
              {filteredTransactions
                .slice()
                .reverse()
                .map((t) => (
                  <TransactionRow
                    key={t.id}
                    tx={t}
                    onDelete={() => store.removeTransaction(t.id)}
                  />
                ))}
            </div>
          )}

          {filteredTransactions.length > 0 && (
            <p className="tx-count muted">
              Показано: {filteredTransactions.length} из {state.transactions.length}
            </p>
          )}
        </section>

        {monthTransactions.length > 0 && (
          <PatternsCard patterns={patterns} monthLabel={monthLabel} />
        )}
      </main>

      {addType && (
        <AddTransactionModal
          type={addType}
          activeGoals={state.goals.filter((g) => !g.archived)}
          categories={state.categories}
          onClose={() => setAddType(null)}
        />
      )}
    </div>
  );
}

/* ─── Транзакция в списке ─── */

function TransactionRow({ tx, onDelete }: { tx: Transaction; onDelete: () => void }) {
  const isIncome = tx.type === 'income';
  const category = DEFAULT_CATEGORIES.find((c) => c.id === tx.categoryId);
  const categoryLabel = category ? `${category.icon} ${category.name}` : tx.categoryId;

  return (
    <div className={`tx-row ${isIncome ? 'tx-row-income' : 'tx-row-expense'}`}>
      <div className="tx-info">
        <div className="tx-category">{categoryLabel}</div>
        {tx.note && <div className="tx-note">{tx.note}</div>}
      </div>
      <div className="tx-right">
        <div className={`tx-amount ${isIncome ? 'tx-amount-income' : 'tx-amount-expense'}`}>
          {isIncome ? '+' : '−'} {formatMoney(tx.amount)}
        </div>
        <button className="tx-delete" onClick={onDelete} aria-label="Удалить">
          ✕
        </button>
      </div>
    </div>
  );
}

/* ─── Модалка ввода ─── */

type ModalStep = 'amount' | 'choose-goal';

function AddTransactionModal({
  type,
  activeGoals,
  categories,
  onClose,
}: {
  type: TxType;
  activeGoals: Goal[];
  categories: import('../types/transaction').Category[];
  onClose: () => void;
}) {
  const store = useStore();
  const [step, setStep] = useState<ModalStep>('amount');
  const [amountStr, setAmountStr] = useState('1000');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestDeposit, setSuggestDeposit] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<string>('');

  const isIncome = type === 'income';
  const title = isIncome ? STRINGS.budgetAddIncome : STRINGS.budgetAddExpense;

  const amountMinor = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0;
  const canSave = amountMinor > 0 && !saving;

  // Авто-определение категории при вводе заметки
  useEffect(() => {
    if (!note.trim()) {
      setCategoryId(isIncome ? 'cat-income-salary' : 'cat-food');
      return;
    }
    const guessed = guessCategory(note, categories, type);
    if (guessed) {
      setCategoryId(guessed);
    } else {
      setCategoryId(isIncome ? 'cat-income-other' : 'cat-other');
    }
  }, [note, categories, type, isIncome]);

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isIncome) {
        const result = await store.addIncome({
          amountMinor,
          categoryId,
          note: note.trim(),
        });

        if (result.suggestedDepositMinor > 0) {
          setSuggestDeposit(result.suggestedDepositMinor);
          setStep('choose-goal');
          setSaving(false);
          return;
        }
      } else {
        await store.addTransaction({
          type: 'expense',
          amountMinor,
          categoryId,
          note: note.trim(),
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleChooseGoal = async (goalId: string | null) => {
    if (suggestDeposit === null) return;
    setSaving(true);
    try {
      await store.addDeposit({
        amountMinor: suggestDeposit,
        source: 'auto10',
        goalId,
        note: note.trim() ? `10% от ${note.trim()}` : '10% от дохода',
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleSkipDeposit = () => {
    onClose();
  };

  if (step === 'choose-goal' && suggestDeposit !== null) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <header className="modal-header">
            <h2>🌱 Куда посадить {formatMoney({ minorUnits: suggestDeposit, currency: 'RUB' })}</h2>
            <button className="modal-close" onClick={onClose}>✕</button>
          </header>

          <div className="modal-body">
            <p className="muted" style={{ marginBottom: '1rem' }}>
              10% от дохода ({formatMoney({ minorUnits: amountMinor, currency: 'RUB' })}).
            </p>

            <div className="goal-choices">
              <button
                className="goal-choice goal-choice-general"
                onClick={() => handleChooseGoal(null)}
                disabled={saving}
              >
                <span className="goal-choice-icon">🌳</span>
                <div className="goal-choice-info">
                  <div className="goal-choice-title">Общий сад</div>
                  <div className="goal-choice-sub">Без привязки к цели</div>
                </div>
              </button>

              {activeGoals.map((goal) => (
                <button
                  key={goal.id}
                  className="goal-choice"
                  onClick={() => handleChooseGoal(goal.id)}
                  disabled={saving}
                >
                  <span className="goal-choice-icon">{goal.icon}</span>
                  <div className="goal-choice-info">
                    <div className="goal-choice-title">{goal.title}</div>
                    <div className="goal-choice-sub">
                      Цель: {formatMoney(goal.targetAmount)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <footer className="modal-footer modal-footer-split">
            <button className="btn-secondary" onClick={handleSkipDeposit} disabled={saving}>
              Позже
            </button>
          </footer>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          <label className="field-label">{STRINGS.budgetAmountLabel}</label>
          <div className="amount-input-wrap">
            <input
              type="text"
              inputMode="decimal"
              className="amount-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
            />
            <span className="amount-suffix">₽</span>
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>
            {STRINGS.budgetNoteLabel}
          </label>
          <input
            type="text"
            className="note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={STRINGS.budgetNotePlaceholder}
            maxLength={80}
          />

          {/* Индикатор авто-категории */}
          {categoryId && (
            <div className="auto-category-hint">
              {(() => {
                const cat = categories.find((c) => c.id === categoryId);
                return cat ? (
                  <>Категория: {cat.icon} {cat.name}</>
                ) : null;
              })()}
            </div>
          )}

          {isIncome && (
            <div className="auto-deposit-hint">
              💡 {STRINGS.budgetAutoDepositHint}
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Сохраняю...' : title}
          </button>
        </footer>
      </div>
    </div>
  );
}

function formatMonth(key: string): string {
  const MONTH_NAMES = [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
  ];
  const [year, month] = key.split('-');
  return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
}