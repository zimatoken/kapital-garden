// src/screens/AchievementsScreen.tsx

import { useMemo } from 'react';
import { useStoreState } from '../hooks/useStore';
import { computeAchievements, countUnlocked } from '../core/achievements';
import { computeStreak } from '../core/streak';
import { todayISODate } from '../core/dates';
import { AchievementCard } from '../components/AchievementCard';

export function AchievementsScreen() {
  const state = useStoreState();

  const achievements = useMemo(() => {
    const today = todayISODate();
    const streak = computeStreak(state.deposits, today);
    return computeAchievements(state.deposits, state.goals, streak.active);
  }, [state.deposits, state.goals]);

  const unlocked = countUnlocked(achievements);
  const total = achievements.length;

  return (
    <div className="achievements-screen">
      <header className="header">
        <span className="logo">🏆</span>
        <div>
          <h1>Достижения</h1>
          <p className="tagline">
            {unlocked} из {total} открыто
          </p>
        </div>
      </header>

      <main className="achievements-main">
        <section className="card">
          <div className="achievements-list">
            {achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}