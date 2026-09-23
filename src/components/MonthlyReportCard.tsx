// src/components/MonthlyReportCard.tsx

import type { MonthlyReport } from '../core/monthlyReport';
import { formatMoney } from '../core/money';

interface Props {
  report: MonthlyReport;
  onClose?: () => void;
}

/**
 * Карточка «Отчёт за месяц» — итоги прошлого месяца.
 */
export function MonthlyReportCard({ report, onClose }: Props) {
  if (!report.isReady) return null;

  const depositedDelta = report.depositedDeltaPercent;
  const expenseDelta = report.expenseDeltaPercent;

  return (
    <section className="card monthly-report">
      <div className="report-header">
        <h2>📅 Отчёт за {report.monthLabel}</h2>
        {onClose && (
          <button className="report-close" onClick={onClose} aria-label="Скрыть">
            ✕
          </button>
        )}
      </div>

      {/* Итоги */}
      <div className="report-totals">
        <div className="report-row">
          <span className="report-label">💼 Доход</span>
          <span className="report-value report-income">
            {formatMoney(report.totalIncome)}
          </span>
        </div>
        <div className="report-row">
          <span className="report-label">💸 Расход</span>
          <span className="report-value report-expense">
            {formatMoney(report.totalExpense)}
          </span>
        </div>
        <div className="report-row">
          <span className="report-label">💚 Отложено</span>
          <span className="report-value report-deposit">
            {formatMoney(report.totalDeposited)}
          </span>
        </div>
      </div>

      {/* Факты месяца */}
      <div className="report-facts">
        {report.topCategory && (
          <div className="report-fact">
            <span className="fact-label">🏆 Топ-категория</span>
            <span className="fact-value">
              {report.topCategory.category.icon}{' '}
              {report.topCategory.category.name} ·{' '}
              {formatMoney(report.topCategory.amount)}
            </span>
          </div>
        )}

        {report.expenseCount > 0 && (
          <div className="report-fact">
            <span className="fact-label">🧾 Средний чек</span>
            <span className="fact-value">{formatMoney(report.avgCheck)}</span>
          </div>
        )}

        {report.activeDays > 0 && (
          <div className="report-fact">
            <span className="fact-label">📆 Дней с отложениями</span>
            <span className="fact-value">{report.activeDays}</span>
          </div>
        )}

        {report.bestStreakInMonth > 1 && (
          <div className="report-fact">
            <span className="fact-label">🔥 Лучший стрик</span>
            <span className="fact-value">{report.bestStreakInMonth} дней</span>
          </div>
        )}
      </div>

      {/* Сравнение с прошлым месяцем */}
      {(depositedDelta !== null || expenseDelta !== null) && (
        <div className="report-compare">
          <div className="report-compare-title">
            Сравнение с {report.prevMonthLabel}:
          </div>
          {depositedDelta !== null && (
            <div className="report-compare-row">
              <span className="report-compare-label">💚 Отложено</span>
              <Delta value={depositedDelta} />
            </div>
          )}
          {expenseDelta !== null && (
            <div className="report-compare-row">
              <span className="report-compare-label">💸 Расходы</span>
              <Delta value={expenseDelta} />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Delta({ value }: { value: number }) {
  const sign = value > 0 ? '+' : '';
  return (
    <span className="report-delta">
      {sign}
      {value}%
    </span>
  );
}