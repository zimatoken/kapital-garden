// src/components/AchievementCard.tsx

import type { Achievement } from '../types/achievement';

export function AchievementCard({ achievement }: { achievement: Achievement }) {
  const unlocked = achievement.unlockedAt !== null;

  return (
    <div className={`achievement-card ${unlocked ? 'achievement-unlocked' : 'achievement-locked'}`}>
      <div className="achievement-icon">{achievement.icon}</div>
      <div className="achievement-info">
        <div className="achievement-title">{achievement.title}</div>
        <div className="achievement-desc">{achievement.description}</div>
      </div>
      {unlocked && <div className="achievement-check">✓</div>}
    </div>
  );
}