// src/components/GardenYear.tsx

import { useState } from 'react';
import type { GardenMonth } from '../core/garden';
import { STATUS_EMOJI } from '../core/garden';

interface GardenYearProps {
  months: GardenMonth[];
  year: number;
}

const MONTH_NAMES = [
  'янв', 'фев', 'мар', 'апр', 'май', 'июн',
  'июл', 'авг', 'сен', 'окт', 'ноя', 'дек',
];

/**
 * Сад года — 12 ячеек.
 *
 * На узких экранах (< 400px) — горизонтальный скролл.
 * На широких — все 12 месяцев влезают.
 * Клик на месяц — раскрывает детали.
 */
export function GardenYear({ months, year }: GardenYearProps) {
  const [selected, setSelected] = useState<GardenMonth | null>(null);

  return (
    <div className="garden-year">
      <div className="garden-year-header">
        <h2>📅 Сад года — {year}</h2>
        <span className="garden-year-hint">Клик на месяц — детали</span>
      </div>

      <div className="garden-year-scroll">
        <div className="garden-row">
          {months.map((m) => (
            <button
              key={m.label}
              className={`garden-cell garden-cell-${m.status} ${
                selected?.label === m.label ? 'garden-cell-selected' : ''
              }`}
              onClick={() =>
                setSelected(selected?.label === m.label ? null : m)
              }
              title={`${MONTH_NAMES[m.month - 1]}: ${m.daysActive}/${m.daysTotal} дней`}
              type="button"
            >
              <span className="garden-cell-emoji">
                {STATUS_EMOJI[m.status]}
              </span>
              <span className="garden-cell-label">
                {MONTH_NAMES[m.month - 1]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <div className="garden-details">
          <strong>
            {MONTH_NAMES[selected.month - 1]} {year}
          </strong>
          <span>
            {selected.daysActive} из {selected.daysTotal} дней с отложениями
          </span>
        </div>
      )}
    </div>
  );
}