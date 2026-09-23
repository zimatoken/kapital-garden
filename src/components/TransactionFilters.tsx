// src/components/TransactionFilters.tsx

import type { Category, TxType } from '../types/transaction';

export type FilterType = TxType | 'all';
export type FilterMonth = 'current' | 'prev' | 'all';

export interface TxFilters {
  type: FilterType;
  categoryId: string | 'all';
  month: FilterMonth;
  query: string;
}

interface Props {
  filters: TxFilters;
  onChange: (f: TxFilters) => void;
  categories: Category[];
  monthLabel: string;
}

/**
 * Панель фильтров транзакций.
 */
export function TransactionFilters({
  filters,
  onChange,
  categories,
  monthLabel,
}: Props) {
  const expenseCategories = categories.filter((c) => c.kind === 'expense');
  const incomeCategories = categories.filter((c) => c.kind === 'income');

  return (
    <div className="tx-filters">
      {/* Поиск */}
      <input
        type="text"
        className="tx-search"
        placeholder="🔍 Поиск по заметке..."
        value={filters.query}
        onChange={(e) => onChange({ ...filters, query: e.target.value })}
      />

      {/* Тип */}
      <div className="tx-filter-row">
        <button
          className={`tx-chip ${filters.type === 'all' ? 'tx-chip-active' : ''}`}
          onClick={() => onChange({ ...filters, type: 'all' })}
        >
          Все
        </button>
        <button
          className={`tx-chip ${filters.type === 'expense' ? 'tx-chip-active' : ''}`}
          onClick={() => onChange({ ...filters, type: 'expense' })}
        >
          💸 Расход
        </button>
        <button
          className={`tx-chip ${filters.type === 'income' ? 'tx-chip-active' : ''}`}
          onClick={() => onChange({ ...filters, type: 'income' })}
        >
          💼 Доход
        </button>
      </div>

      {/* Период */}
      <div className="tx-filter-row">
        <button
          className={`tx-chip ${filters.month === 'current' ? 'tx-chip-active' : ''}`}
          onClick={() => onChange({ ...filters, month: 'current' })}
        >
          {monthLabel}
        </button>
        <button
          className={`tx-chip ${filters.month === 'prev' ? 'tx-chip-active' : ''}`}
          onClick={() => onChange({ ...filters, month: 'prev' })}
        >
          Прошлый
        </button>
        <button
          className={`tx-chip ${filters.month === 'all' ? 'tx-chip-active' : ''}`}
          onClick={() => onChange({ ...filters, month: 'all' })}
        >
          Все
        </button>
      </div>

      {/* Категории — показываем только если выбран конкретный тип */}
      {filters.type !== 'all' && (
        <div className="tx-filter-row tx-filter-scroll">
          <button
            className={`tx-chip ${filters.categoryId === 'all' ? 'tx-chip-active' : ''}`}
            onClick={() => onChange({ ...filters, categoryId: 'all' })}
          >
            Все категории
          </button>
          {(filters.type === 'expense' ? expenseCategories : incomeCategories).map(
            (cat) => (
              <button
                key={cat.id}
                className={`tx-chip ${filters.categoryId === cat.id ? 'tx-chip-active' : ''}`}
                onClick={() => onChange({ ...filters, categoryId: cat.id })}
              >
                {cat.icon} {cat.name}
              </button>
            ),
          )}
        </div>
      )}

      {/* Сброс */}
      {(filters.type !== 'all' ||
        filters.categoryId !== 'all' ||
        filters.month !== 'current' ||
        filters.query.length > 0) && (
        <button
          className="tx-filter-reset"
          onClick={() =>
            onChange({
              type: 'all',
              categoryId: 'all',
              month: 'current',
              query: '',
            })
          }
        >
          ✕ Сбросить фильтры
        </button>
      )}
    </div>
  );
}

/**
 * Применить фильтры к списку транзакций.
 * Чистая функция — легко тестировать.
 */
export function applyFilters<T extends { type: TxType; categoryId: string; note: string; date: string }>(
  transactions: T[],
  filters: TxFilters,
  monthKey: string,
  prevMonthKey: string,
): T[] {
  return transactions.filter((t) => {
    // Тип
    if (filters.type !== 'all' && t.type !== filters.type) return false;

    // Категория
    if (filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) {
      return false;
    }

    // Месяц
    if (filters.month === 'current' && !t.date.startsWith(monthKey)) return false;
    if (filters.month === 'prev' && !t.date.startsWith(prevMonthKey)) return false;

    // Поиск
    if (filters.query.trim()) {
      const q = filters.query.toLowerCase();
      if (!t.note.toLowerCase().includes(q)) return false;
    }

    return true;
  });
}