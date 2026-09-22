// src/screens/GardenScreen.tsx

import { useMemo, useState } from 'react';
import { useStoreState } from '../hooks/useStore';
import { QuickDeposit } from '../components/QuickDeposit';
import { QuickExpense } from '../components/QuickExpense';
import { TreeVisual } from '../components/TreeVisual';
import { StreakRing } from '../components/StreakRing';
import { GardenYear } from '../components/GardenYear';
import { GrowthNumbers } from '../components/GrowthNumbers';
import { PulseCard } from '../components/PulseCard';
import { RecurringPrompt } from '../components/RecurringPrompt';
import { computeStreak } from '../core/streak';
import { computeOctave } from '../core/octaves';
import { computeGardenYear } from '../core/garden';
import { computePulse } from '../core/pulse';
import { todayISODate, diffDays } from '../core/dates';
import { forecastGrowth } from '../core/forecast';
import { formatMoney, sumMoney } from '../core/money';
import { STRINGS } from '../data/strings';

export function GardenScreen() {
  const state = useStoreState();
  const [depositOpen, setDepositOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const today = todayISODate();
  const year = Number(today.slice(0, 4));
  const monthKey = today.slice(0, 7);

  const streak = useMemo(() => computeStreak(state.deposits, today), [state.deposits, today]);
  const octave = useMemo(() => computeOctave(state.deposits, today), [state.deposits, today]);
  const garden = useMemo(() => computeGardenYear(state.deposits, year), [state.deposits, year]);
  const total = useMemo(() => sumMoney(state.deposits.map((d) => d.amount)), [state.deposits]);

  // Пульс — сравнение с собой
  const pulse = useMemo(
    () => computePulse(state.transactions, state.deposits, monthKey),
    [state.transactions, state.deposits, monthKey],
  );

  // Средний дневной темп
  const dailyAvgMinor = useMemo(() => {
    if (state.deposits.length === 0) return 0;
    const first = state.deposits.map((d) => d.date).sort()[0];
    const days = Math.max(1, diffDays(first, today) + 1);
    return Math.round(total.minorUnits / days);
  }, [state.deposits, total.minorUnits, today]);

  const daysActive = useMemo(() => {
    if (state.deposits.length === 0) return 0;
    const first = state.deposits.map((d) => d.date).sort()[0];
    return Math.max(1, diffDays(first, today) + 1);
  }, [state.deposits, today]);

  const octaveProgress = useMemo(() => {
    if (!octave || octave.level >= 8 || octave.rangeEnd === null) return 0;
    const span = octave.rangeEnd - octave.rangeStart + 1;
    const done = octave.day - octave.rangeStart;
    return Math.min(1, done / span);
  }, [octave]);

  const isEmpty = state.deposits.length === 0;

  return (
    <div className="garden-screen">
      <header className="header">
        <span className="logo">🌳</span>
        <div>
          <h1>{STRINGS.appTitle}</h1>
          <p className="tagline">{STRINGS.tagline}</p>
        </div>
      </header>

      <main className="garden-main">
        {/* Дерево */}
        <section className="card card-tree">
          <TreeVisual octave={octave} progress={octaveProgress} />
        </section>

        {/* Пульс — сравнение с собой */}
        {!isEmpty && <PulseCard pulse={pulse} />}

        {/* Промпт регулярных расходов */}
        {!isEmpty && <RecurringPrompt />}

        {/* Стрик */}
        {!isEmpty && (
          <section className="card card-streak">
            <StreakRing streak={streak} />
          </section>
        )}

        {/* Числа роста */}
        {!isEmpty && (
          <GrowthNumbers
            dailyAvgMinor={dailyAvgMinor}
            daysActive={daysActive}
          />
        )}

        {/* Сад года */}
        <section className="card">
          <GardenYear months={garden} year={year} />
        </section>

        {/* Прогноз */}
        {!isEmpty && dailyAvgMinor > 0 && (
          <section className="card">
            <h2>{STRINGS.forecastTitle}</h2>
            <p className="muted">
              {formatMoney({ minorUnits: dailyAvgMinor * 30, currency: 'RUB' })}/мес ·
              10% годовых · 10 лет
            </p>
            <p className="big">
              {formatMoney({
                minorUnits:
                  forecastGrowth(dailyAvgMinor * 30, 10, 10).at(-1)?.totalMinorUnits ?? 0,
                currency: 'RUB',
              })}
            </p>
            <p className="muted" style={{ fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
              {daysActive < 7
                ? `Прогноз появится после 7 дней наблюдений.`
                : `Прогноз — на основе текущего темпа.`}
            </p>
          </section>
        )}

        {/* Пустой сад */}
        {isEmpty && (
          <section className="card welcome">
            <h2>{STRINGS.gardenEmptyTitle}</h2>
            <p className="muted">{STRINGS.gardenEmptyBody}</p>
          </section>
        )}
      </main>

      {/* Плавающие кнопки */}
      <div className="fab-group">
        <button
          className="fab fab-expense"
          onClick={() => setExpenseOpen(true)}
          aria-label="Записать расход"
        >
          💸
        </button>
        <button
          className="fab fab-deposit"
          onClick={() => setDepositOpen(true)}
          aria-label="Посадить семя"
        >
          🌱
        </button>
      </div>

      <QuickDeposit
        open={depositOpen}
        onClose={() => setDepositOpen(false)}
      />

      <QuickExpense
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
      />
    </div>
  );
}