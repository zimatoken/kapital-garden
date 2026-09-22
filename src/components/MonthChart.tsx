// src/components/MonthChart.tsx

import type { MonthPoint } from '../core/analytics';
import { formatMoney } from '../core/money';

/**
 * Столбчатый график: доход / расход / отложено по месяцам.
 * Чистый CSS, без библиотек.
 */
export function MonthChart({ months }: { months: MonthPoint[] }) {
  // Максимум для нормализации высоты
  const maxMinor = Math.max(
    1,
    ...months.flatMap((m) => [
      m.income.minorUnits,
      m.expense.minorUnits,
      m.deposited.minorUnits,
    ]),
  );

  // 3 горизонтальные линии сетки: 1/3, 2/3, max
  const gridLevels = [
    { percent: 100, value: maxMinor },
    { percent: 66, value: Math.round(maxMinor * 0.66) },
    { percent: 33, value: Math.round(maxMinor * 0.33) },
  ];

  return (
    <div className="month-chart">
      <div className="month-chart-legend">
        <span className="legend-item">
          <span className="legend-dot legend-income" /> Доход
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-expense" /> Расход
        </span>
        <span className="legend-item">
          <span className="legend-dot legend-deposit" /> Отложено
        </span>
      </div>

      <div className="month-chart-grid">
        <div className="grid-lines">
          {gridLevels.map((lvl) => (
            <div
              key={lvl.percent}
              className="grid-line"
              style={{ bottom: `${lvl.percent}%` }}
            >
              <span className="grid-line-label">
                {formatMoney({ minorUnits: lvl.value, currency: 'RUB' })}
              </span>
            </div>
          ))}
        </div>

        <div className="month-chart-bars">
          {months.map((m, idx) => (
            <div key={m.monthKey} className="month-col">
              <div className="month-bars">
                <Bar
                  valueMinor={m.income.minorUnits}
                  maxMinor={maxMinor}
                  className="bar-income"
                  title={`${m.monthFull} · Доход: ${formatMoney(m.income)}`}
                />
                <Bar
                  valueMinor={m.expense.minorUnits}
                  maxMinor={maxMinor}
                  className="bar-expense"
                  title={`${m.monthFull} · Расход: ${formatMoney(m.expense)}`}
                />
                <Bar
                  valueMinor={m.deposited.minorUnits}
                  maxMinor={maxMinor}
                  className="bar-deposit"
                  title={`${m.monthFull} · Отложено: ${formatMoney(m.deposited)}`}
                />
              </div>
              <div
                className={`month-label ${idx === months.length - 1 ? 'month-label-current' : ''}`}
              >
                {m.monthLabel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Bar({
  valueMinor,
  maxMinor,
  className,
  title,
}: {
  valueMinor: number;
  maxMinor: number;
  className: string;
  title: string;
}) {
  const isEmpty = valueMinor <= 0;
  const heightPercent = isEmpty ? 0 : (valueMinor / maxMinor) * 100;
  const h = isEmpty ? 0 : Math.max(2, heightPercent);

  return (
    <div
      className={`bar ${className} ${isEmpty ? 'bar-empty' : ''}`}
      style={{ height: isEmpty ? '0' : `${h}%` }}
      title={title}
    />
  );
}