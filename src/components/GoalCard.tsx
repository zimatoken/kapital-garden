// src/components/GoalCard.tsx

import type { GoalProgress } from '../core/goals';
import { STAGE_EMOJI, STAGE_LABEL, formatEta } from '../core/goals';
import { formatMoney } from '../core/money';
import { todayISODate } from '../core/dates';
import { GoalScenario } from './GoalScenario';

interface GoalCardProps {
  progress: GoalProgress;
  onClick?: () => void;
}

/**
 * Карточка цели.
 *
 * Показывает:
 * - Иконку цели (🏡/🚗/🌴/🎓/💎)
 * - Название
 * - Прогресс (дерево + бар + %)
 * - Остаток
 * - ETA (если данных достаточно)
 * - Сценарии «что если ускорить»
 */
export function GoalCard({ progress, onClick }: GoalCardProps) {
  const { goal, saved, target, percent, remaining, etaDays, stage, hasEnoughData } = progress;
  const etaText = formatEta(etaDays);
  const today = todayISODate();

  return (
    <div
      className={`goal-card goal-stage-${stage}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Заголовок */}
      <div className="goal-card-header">
        <span className="goal-card-icon">{goal.icon}</span>
        <h3 className="goal-card-title">{goal.title}</h3>
        {goal.archived && <span className="goal-card-archive-badge">в архиве</span>}
      </div>

      {/* Дерево стадий */}
      <div className="goal-card-stages">
        <StageTrack stage={stage} />
      </div>

      {/* Прогресс */}
      <div className="goal-card-amounts">
        <span className="goal-card-saved">{formatMoney(saved)}</span>
        <span className="goal-card-divider"> / </span>
        <span className="goal-card-target">{formatMoney(target)}</span>
      </div>

      {/* Бар */}
      <div className="goal-card-bar-wrap">
        <div
          className="goal-card-bar"
          style={{ width: `${Math.max(2, Math.min(100, percent))}%` }}
        />
      </div>

      {/* Процент */}
      <div className="goal-card-percent">{percent.toFixed(0)}%</div>

      {/* Осталось */}
      {remaining.minorUnits > 0 && (
        <div className="goal-card-remaining">
          Осталось: <strong>{formatMoney(remaining)}</strong>
        </div>
      )}

      {/* ETA */}
      <div className="goal-card-eta">
        {hasEnoughData && etaText ? (
          <>
            Прогноз: <strong>{etaText}</strong>{' '}
            <span className="goal-card-eta-hint">(при текущем темпе)</span>
          </>
        ) : (
          <span className="goal-card-eta-hint">
            Прогноз появится после 7 дней наблюдений.
          </span>
        )}
      </div>

      {/* Сценарии — только для активных целей с данными */}
      {!goal.archived && stage !== 'achieved' && (
        <GoalScenario progress={progress} today={today} />
      )}
    </div>
  );
}

/* ─── Дорожка стадий ─────────────────── */

const STAGE_ORDER = ['seed', 'sprout', 'stem', 'young', 'flowering', 'fruiting'] as const;

function StageTrack({ stage }: { stage: GoalProgress['stage'] }) {
  if (stage === 'achieved') {
    return (
      <div className="stage-track stage-track-achieved">
        <span className="stage-item stage-item-done">🏆</span>
        <span className="stage-label">{STAGE_LABEL.achieved}</span>
      </div>
    );
  }

  const currentIdx = STAGE_ORDER.indexOf(stage as (typeof STAGE_ORDER)[number]);

  return (
    <div className="stage-track">
      {STAGE_ORDER.map((s, i) => (
        <span
          key={s}
          className={`stage-item ${i <= currentIdx ? 'stage-item-done' : 'stage-item-future'}`}
          title={STAGE_LABEL[s]}
        >
          {STAGE_EMOJI[s]}
        </span>
      ))}
    </div>
  );
}