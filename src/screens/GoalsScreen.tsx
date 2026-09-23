// src/screens/GoalsScreen.tsx

import { useMemo, useState } from 'react';
import { useStoreState } from '../hooks/useStore';
import { GoalCard } from '../components/GoalCard';
import { GoalEditor } from '../components/GoalEditor';
import { computeAllGoals } from '../core/goals';
import { STRINGS } from '../data/strings';
import { todayISODate } from '../core/dates';

/**
 * Экран «Цели».
 *
 * Показывает:
 * - Список активных целей с прогрессом
 * - Кнопка «+ Новая цель»
 * - Архив достигнутых
 * - Сводку по всем целям (общая сумма, средний прогресс)
 */
export function GoalsScreen() {
  const state = useStoreState();
  const [editorOpen, setEditorOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const today = todayISODate();

  // Все цели с прогрессом
  const allProgress = useMemo(
    () => computeAllGoals(state.goals, state.deposits, today),
    [state.goals, state.deposits, today],
  );

  // Активные (не архивные, не достигнутые)
  const active = allProgress.filter((p) => !p.goal.archived && p.stage !== 'achieved');

  // Достигнутые (100%)
  const achieved = allProgress.filter((p) => p.stage === 'achieved');

  // Архивные
  const archived = allProgress.filter((p) => p.goal.archived);

  // Сводка по активным целям
  const summary = useMemo(() => {
    if (active.length === 0) return null;

    const totalSavedMinor = active.reduce(
      (sum, p) => sum + p.saved.minorUnits,
      0,
    );
    const totalTargetMinor = active.reduce(
      (sum, p) => sum + p.target.minorUnits,
      0,
    );
    const avgPercent =
      totalTargetMinor > 0
        ? (totalSavedMinor / totalTargetMinor) * 100
        : 0;

    return {
      count: active.length,
      totalSavedMinor,
      totalTargetMinor,
      avgPercent,
    };
  }, [active]);

  const hasAny = allProgress.length > 0;

  return (
    <div className="goals-screen">
      <header className="header">
        <span className="logo">🎯</span>
        <div>
          <h1>Мои цели</h1>
          <p className="tagline">Куда растёт твой сад</p>
        </div>
      </header>

      <main className="goals-main">
        {/* Сводка по активным */}
        {summary && (
          <section className="card goals-summary">
            <div className="goals-summary-header">
              <span className="goals-summary-icon">🌱</span>
              <div>
                <div className="goals-summary-title">
                  {summary.count}{' '}
                  {summary.count === 1
                    ? 'цель растёт'
                    : summary.count < 5
                    ? 'цели растут'
                    : 'целей растёт'}
                </div>
                <div className="goals-summary-sub">
                  Общий прогресс: {summary.avgPercent.toFixed(1)}%
                </div>
              </div>
            </div>
            <div className="goals-summary-bar">
              <div
                className="goals-summary-bar-fill"
                style={{ width: `${Math.min(100, summary.avgPercent)}%` }}
              />
            </div>
          </section>
        )}

        {/* Пусто */}
        {!hasAny && (
          <section className="card welcome">
            <h2>{STRINGS.goalsEmptyTitle}</h2>
            <p className="muted">{STRINGS.goalsEmptyBody}</p>
            <button
              className="btn-primary"
              onClick={() => setEditorOpen(true)}
              style={{ marginTop: 16 }}
            >
              🌱 Посадить первую цель
            </button>
          </section>
        )}

        {/* Активные */}
        {active.length > 0 && (
          <section className="goals-section">
            <div className="goals-section-header">
              <h2>Растут сейчас</h2>
              <button
                className="btn-small"
                onClick={() => setEditorOpen(true)}
              >
                + Новая цель
              </button>
            </div>
            <div className="goals-list">
              {active.map((p) => (
                <GoalCard key={p.goal.id} progress={p} />
              ))}
            </div>
          </section>
        )}

        {/* Достигнутые */}
        {achieved.length > 0 && (
          <section className="goals-section">
            <h2>🏆 Достигнуты</h2>
            <div className="goals-list">
              {achieved.map((p) => (
                <GoalCard key={p.goal.id} progress={p} />
              ))}
            </div>
          </section>
        )}

        {/* Архив */}
        {archived.length > 0 && (
          <section className="goals-section">
            <button
              className="goals-archive-toggle"
              onClick={() => setArchivedOpen(!archivedOpen)}
            >
              {archivedOpen ? '▼' : '▶'} Архив ({archived.length})
            </button>
            {archivedOpen && (
              <div className="goals-list">
                {archived.map((p) => (
                  <GoalCard key={p.goal.id} progress={p} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* Кнопка «+» если есть цели, но нет активных */}
        {hasAny && active.length === 0 && (
          <button
            className="btn-primary"
            onClick={() => setEditorOpen(true)}
            style={{ marginTop: 16 }}
          >
            🌱 Посадить новую цель
          </button>
        )}
      </main>

      {/* Модалка создания цели */}
      <GoalEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
      />
    </div>
  );
}