// src/components/PatternsCard.tsx

import type { Patterns } from '../core/patterns';
import { weekdayName } from '../core/patterns';
import { formatMoney } from '../core/money';

interface PatternsCardProps {
  patterns: Patterns;
  /** Название месяца для заголовка. */
  monthLabel: string;
}

const MIN_TRANSACTIONS_MESSAGE = 5;

/**
 * Паттерны трат за месяц.
 *
 * Показывает ФАКТЫ без оценок:
 * • Средний чек
 * • День недели с максимумом расходов
 * • Топ-3 категории
 *
 * НИКАКИХ советов, сравнений, оценок.
 */
export function PatternsCard({ patterns, monthLabel }: PatternsCardProps) {
  const {
    totalExpense,
    expenseCount,
    avgCheck,
    topWeekday,
    topWeekdayAmount,
    topCategories,
    hasEnoughData,
    transactionCount,
  } = patterns;

  return (
    <section className="card patterns-card">
      <div className="patterns-header">
        <h2>📊 Паттерны</h2>
        <span className="patterns-month">{monthLabel}</span>
      </div>

      {/* Мало данных */}
      {!hasEnoughData && (
        <p className="muted">
          Паттерны появятся после {MIN_TRANSACTIONS_MESSAGE} записей. Сейчас:{' '}
          {transactionCount}.
        </p>
      )}

      {/* Есть данные */}
      {hasEnoughData && (
        <>
          {/* Средний чек */}
          {expenseCount > 0 && (
            <div className="pattern-row">
              <span className="pattern-label">💸 Средний чек</span>
              <span className="pattern-value">{formatMoney(avgCheck)}</span>
            </div>
          )}

          {/* Топ день недели */}
          {topWeekday !== null && topWeekdayAmount !== null && (
            <div className="pattern-row">
              <span className="pattern-label">📅 Чаще тратишь:</span>
              <span className="pattern-value">{weekdayName(topWeekday)}</span>
            </div>
          )}

          {/* Топ категории */}
          {topCategories.length > 0 && (
            <div className="pattern-categories">
              <div className="pattern-categories-title">
                🏷️ Топ-{topCategories.length} категорий
              </div>
              {topCategories.map((c) => (
                <div key={c.category.id} className="pattern-category">
                  <span className="pattern-category-icon">{c.category.icon}</span>
                  <span className="pattern-category-name">{c.category.name}</span>
                  <span className="pattern-category-amount">
                    {formatMoney(c.amount)}
                  </span>
                  <span className="pattern-category-percent">
                    {c.percent.toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Итого */}
          <div className="pattern-total">
            <span className="pattern-label">Всего расходов</span>
            <span className="pattern-value">{formatMoney(totalExpense)}</span>
          </div>
        </>
      )}
    </section>
  );
}
