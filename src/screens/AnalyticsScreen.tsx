// src/screens/AnalyticsScreen.tsx

import { useMemo, useState } from 'react';
import { useStoreState } from '../hooks/useStore';
import { computeAnalytics } from '../core/analytics';
import { todayISODate } from '../core/dates';
import { formatMoney } from '../core/money';
import { MonthChart } from '../components/MonthChart';
import { CategoryPie } from '../components/CategoryPie';

const PERIOD_OPTIONS = [
  { months: 3, label: '3 мес' },
  { months: 6, label: '6 мес' },
  { months: 12, label: '12 мес' },
];

export function AnalyticsScreen() {
  const state = useStoreState();
  const [monthsBack, setMonthsBack] = useState(6);

  const todayKey = todayISODate().slice(0, 7);

  const analytics = useMemo(
    () =>
      computeAnalytics(
        state.transactions,
        state.deposits,
        state.categories,
        todayKey,
        monthsBack,
      ),
    [state.transactions, state.deposits, state.categories, todayKey, monthsBack],
  );

  const growthSign = analytics.expenseGrowth > 0 ? '+' : '';
  const growthText =
    analytics.expenseGrowth === 0
      ? 'без изменений'
      : `${growthSign}${analytics.expenseGrowth.toFixed(0)}%`;

  return (
    <div className="analytics-screen">
      <header className="header">
        <span className="logo">📊</span>
        <div>
          <h1>Аналитика</h1>
          <p className="tagline">Куда уходят деньги и как растёт сад</p>
        </div>
      </header>

      <main className="analytics-main">
        <div className="period-switch">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.months}
              className={`period-btn ${monthsBack === opt.months ? 'period-btn-active' : ''}`}
              onClick={() => setMonthsBack(opt.months)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* ─── Карточка «факты о саде» ─── */}
        {analytics.totalIncome.minorUnits > 0 && (
          <section className="card analytics-facts">
            <div className="fact-row">
              <span className="fact-emoji">💚</span>
              <span className="fact-text">
                В сад уходит{' '}
                <strong>{analytics.savingsRate.toFixed(1)}%</strong> дохода
                {analytics.avgMonthlySavings.minorUnits > 0 && (
                  <>
                    {' · '}
                    в среднем{' '}
                    <strong>{formatMoney(analytics.avgMonthlySavings)}</strong>/мес
                  </>
                )}
              </span>
            </div>

            {analytics.bestMonthLabel && (
              <div className="fact-row">
                <span className="fact-emoji">📅</span>
                <span className="fact-text">
                  Рекордный месяц: <strong>{analytics.bestMonthLabel}</strong>
                </span>
              </div>
            )}

            {analytics.expenseGrowth !== 0 && (
              <div className="fact-row">
                <span className="fact-emoji">📉</span>
                <span className="fact-text">
                  Расходы: <strong>{growthText}</strong> (последние{' '}
                  {Math.floor(monthsBack / 2)} мес vs предыдущие)
                </span>
              </div>
            )}
          </section>
        )}

        {/* ─── Итого за период ─── */}
        <section className="card">
          <h2>📈 Итого за {monthsBack} мес</h2>
          <div className="analytics-summary">
            <div className="summary-row">
              <span className="summary-label">💼 Доход</span>
              <span className="summary-value summary-income">
                {formatMoney(analytics.totalIncome)}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💸 Расход</span>
              <span className="summary-value summary-expense">
                {formatMoney(analytics.totalExpense)}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">💚 Отложено</span>
              <span className="summary-value summary-deposit">
                {formatMoney(analytics.totalDeposited)}
              </span>
            </div>
          </div>
        </section>

        {/* ─── График по месяцам ─── */}
        <section className="card">
          <h2>📅 По месяцам</h2>
          <MonthChart months={analytics.months} />
        </section>

        {/* ─── Круговая диаграмма ─── */}
        <section className="card">
          <h2>🍩 Куда уходят деньги</h2>
          <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
            Топ категорий за {monthsBack} мес
          </p>
          <CategoryPie slices={analytics.topCategories} />
        </section>

        {!analytics.hasEnoughData && (
          <section className="card welcome">
            <h2>Мало данных</h2>
            <p className="muted">
              Добавь ещё несколько транзакций — аналитика станет точнее.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}