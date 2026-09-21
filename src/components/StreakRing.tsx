// src/components/StreakRing.tsx

import type { StreakInfo } from '../core/streak';
import { STRINGS } from '../data/strings';

interface StreakRingProps {
  streak: StreakInfo;
}

const STATUS_TEXT: Record<StreakInfo['status'], string> = {
  growing: STRINGS.statusGrowing,
  wilting: STRINGS.statusWilting,
  dormant: STRINGS.statusDormant,
};

/**
 * Огненный круг стрика.
 * Vitality (0..1) определяет яркость.
 * Показывает АКТИВНЫЙ стрик + ЛУЧШИЙ мелко снизу.
 */
export function StreakRing({ streak }: StreakRingProps) {
  const degrees = streak.vitality * 360;

  return (
    <div className="streak-block">
      <div
        className={`ring ring-${streak.status}`}
        style={{
          background: `conic-gradient(var(--fire) ${degrees}deg, var(--ring-empty) 0deg)`,
        }}
      >
        <div className="ring-inner">
          <span className="ring-number">{streak.active}</span>
          <span className="ring-label">дней</span>
        </div>
      </div>

      <div className="streak-info">
        <div className="streak-title">🔥 Стрик</div>
        <div className="streak-status">{STATUS_TEXT[streak.status]}</div>
        <div className="streak-best">{STRINGS.bestStreak(streak.best)}</div>
      </div>
    </div>
  );
}