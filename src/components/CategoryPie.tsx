// src/components/CategoryPie.tsx

import type { CategorySlice } from '../core/analytics';
import { formatMoney } from '../core/money';

const PALETTE = [
  '#22c55e', // green
  '#eab308', // gold
  '#3b82f6', // blue
  '#ef4444', // red
  '#a855f7', // purple
  '#06b6d4', // cyan
];

/**
 * Круговая диаграмма категорий.
 * SVG + stroke-dasharray, без библиотек.
 */
export function CategoryPie({ slices }: { slices: CategorySlice[] }) {
  if (slices.length === 0) {
    return (
      <p className="muted" style={{ fontSize: 13 }}>
        Нет данных о расходах за период.
      </p>
    );
  }

  const RADIUS = 60;
  const STROKE = 20;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const SIZE = (RADIUS + STROKE) * 2;

  let cumulative = 0;

  return (
    <div className="category-pie">
      <div className="category-pie-chart">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          {/* Фон */}
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(148, 163, 184, 0.15)"
            strokeWidth={STROKE}
          />

          {slices.map((slice, i) => {
            const percent = slice.percent / 100;
            const dash = percent * CIRCUMFERENCE;
            const offset = -cumulative * CIRCUMFERENCE;
            cumulative += percent;

            return (
              <circle
                key={slice.category.id}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            );
          })}
        </svg>
      </div>

      <div className="category-pie-legend">
        {slices.map((slice, i) => (
          <div key={slice.category.id} className="pie-legend-row">
            <span
              className="pie-legend-dot"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="pie-legend-icon">{slice.category.icon}</span>
            <span className="pie-legend-name">{slice.category.name}</span>
            <span className="pie-legend-amount">
              {formatMoney(slice.amount)}
            </span>
            <span className="pie-legend-percent">
              {slice.percent.toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}