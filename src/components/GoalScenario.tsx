// src/components/GoalScenario.tsx

import { useMemo } from 'react';
import type { GoalProgress } from '../core/goals';
import { computeGoalScenarios, formatDelta } from '../core/goalScenarios';
import { formatEta } from '../core/goals';
import { formatMoney } from '../core/money';

interface Props {
  progress: GoalProgress;
  today: string;
}

/**
 * Блок «Сценарии» внутри карточки цели.
 *
 * Показывает:
 * - Базовый прогноз (текущий темп).
 * - Что если ускорить +10% / +25% / +50% / +100%.
 * - План: сколько нужно в месяц, чтобы уложиться в базовый ETA.
 */
export function GoalScenario({ progress, today }: Props) {
  const scenarios = useMemo(
    () => computeGoalScenarios(progress, today),
    [progress, today],
  );

  // Нет сценариев — не рендерим блок
  if (!scenarios.base) return null;

  const { base, scenarios: accel, monthlyPlan } = scenarios;

  return (
    <div className="goal-scenarios">
      <div className="goal-scenarios-title">🎯 Что если ускорить?</div>

      {/* Базовый */}
      <div className="goal-scenario-row goal-scenario-base">
        <span className="goal-scenario-label">{base.label}</span>
        <span className="goal-scenario-value">
          {formatEta(base.etaDays) ?? '—'}
        </span>
      </div>

      {/* Сценарии */}
      {accel.map((s) => (
        <div key={s.multiplier} className="goal-scenario-row">
          <span className="goal-scenario-label">{s.label}</span>
          <span className="goal-scenario-value">
            {formatEta(s.etaDays) ?? '—'}
            {s.deltaDays < 0 && (
              <span className="goal-scenario-delta">
                {' '}({formatDelta(s.deltaDays)})
              </span>
            )}
          </span>
        </div>
      ))}

      {/* План на месяц */}
      {monthlyPlan && (
        <div className="goal-scenario-plan">
          💡 Чтобы уложиться в текущий прогноз —{' '}
          <strong>
            {formatMoney({
              minorUnits: monthlyPlan.perMonthMinor,
              currency: 'RUB',
            })}
          </strong>
          /мес
        </div>
      )}
    </div>
  );
}