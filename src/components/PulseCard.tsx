// src/components/PulseCard.tsx

import type { Pulse } from '../core/pulse';
import { monthName } from '../core/pulse';
import { formatMoney } from '../core/money';

export function PulseCard({ pulse }: { pulse: Pulse }) {
  if (!pulse.hasEnoughData) {
    return (
      <section className="card pulse-card">
        <div className="pulse-header">
          <h2>📊 Пульс</h2>
          <span className="pulse-month">
            {monthName(pulse.currentMonth)}
          </span>
        </div>
        <p className="muted">
          Сравнение появится, когда будет хотя бы 3 записи в месяце.
        </p>
      </section>
    );
  }

  return (
    <section className="card pulse-card">
      <div className="pulse-header">
        <h2>📊 Пульс</h2>
        <span className="pulse-month">
          {monthName(pulse.currentMonth)} vs {monthName(pulse.previousMonth)}
        </span>
      </div>

      {/* Отложения */}
      <div className="pulse-row">
        <span className="pulse-label">💚 Отложено</span>
        <span className="pulse-value">
          {formatMoney(pulse.depositedCurrent)}
          <DeltaBadge delta={pulse.depositedDeltaPercent} />
        </span>
      </div>

      {/* Расходы */}
      <div className="pulse-row">
        <span className="pulse-label">💸 Расходы</span>
        <span className="pulse-value">
          {formatMoney(pulse.expenseCurrent)}
          <DeltaBadge delta={pulse.expenseDeltaPercent} invert />
        </span>
      </div>

      {/* Средний чек */}
      <div className="pulse-row">
        <span className="pulse-label">🧾 Средний чек</span>
        <span className="pulse-value">
          {formatMoney(pulse.avgCheckCurrent)}
        </span>
      </div>

      {/* Записей */}
      <div className="pulse-row pulse-row-muted">
        <span className="pulse-label">📝 Записей</span>
        <span className="pulse-value">
          {pulse.txCountCurrent}
          <span className="pulse-prev"> (было {pulse.txCountPrevious})</span>
        </span>
      </div>
    </section>
  );
}

/**
 * Бейдж изменения в %.
 *
 * invert = true → для расходов: рост = нейтральный (не «плохо»),
 * падение = нейтральный. Мы НЕ оцениваем. Просто показываем.
 */
function DeltaBadge({
  delta,
  invert = false,
}: {
  delta: number | null;
  invert?: boolean;
}) {
  if (delta === null) {
    return <span className="pulse-delta pulse-delta-neutral">—</span>;
  }

  if (delta === 0) {
    return <span className="pulse-delta pulse-delta-neutral">0%</span>;
  }

  const sign = delta > 0 ? '+' : '';
  // invert — не используется для цвета. Нейтральный тон для всех.
  // Показываем как факт. Никаких «плохо» / «хорошо».
  void invert;

  return (
    <span className="pulse-delta pulse-delta-neutral">
      {sign}{delta}%
    </span>
  );
}