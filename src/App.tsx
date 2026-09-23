// src/App.tsx

import { useEffect, useState } from 'react';
import { GardenScreen } from './screens/GardenScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { Onboarding, shouldShowOnboarding } from './components/Onboarding';
import { ThemeApplier } from './components/ThemeApplier';
import { createLocalStorageAdapter } from './core/storage';
import { createInitialState } from './core/factories';
import { initStore } from './core/store';
import type { KGState } from './types/state';

type Tab = 'garden' | 'budget' | 'goals' | 'analytics' | 'achievements' | 'settings';

const VALID_TABS: Tab[] = [
  'garden',
  'budget',
  'goals',
  'analytics',
  'achievements',
  'settings',
];

function tabFromHash(): Tab {
  const raw = location.hash.replace('#', '');
  return (VALID_TABS as string[]).includes(raw) ? (raw as Tab) : 'garden';
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<KGState | null>(null);
  const [tab, setTab] = useState<Tab>(() => tabFromHash());
  const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding());

  // Синхронизация hash → state
  useEffect(() => {
    const onHash = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const adapter = createLocalStorageAdapter();

    adapter
      .load()
      .then((loaded) => {
        if (cancelled) return;
        const initial = loaded ?? createInitialState();
        initStore(adapter, initial);
        setState(initial);
        setReady(true);
      })
      .catch((err) => {
        console.warn('[App] Ошибка загрузки состояния', err);
        if (cancelled) return;
        const initial = createInitialState();
        initStore(adapter, initial);
        setState(initial);
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const go = (t: Tab) => {
    if (location.hash !== `#${t}`) {
      location.hash = t;
    }
    setTab(t);
  };

  // ─── Загрузка ───
  if (!ready || !state) {
    return (
      <div className="loading-screen">
        <div className="loading-emoji">🌳</div>
        <div className="loading-text">Сажаю сад...</div>
      </div>
    );
  }

  // ─── Онбординг (первый запуск) ───
  if (showOnboarding) {
    return (
      <Onboarding
        onFinish={() => {
          setShowOnboarding(false);
          // Открываем Сад — там FAB для первого семени
          go('garden');
        }}
      />
    );
  }

  // ─── Основной интерфейс ───
  return (
    <div className="app-root">
      {/* Применяет тему из settings.theme → data-theme на <html> */}
      <ThemeApplier />

      {tab === 'garden' && <GardenScreen />}
      {tab === 'budget' && <BudgetScreen />}
      {tab === 'goals' && <GoalsScreen />}
      {tab === 'analytics' && <AnalyticsScreen />}
      {tab === 'achievements' && <AchievementsScreen />}
      {tab === 'settings' && <SettingsScreen />}

      <nav className="tab-bar">
        <button
          className={`tab-item ${tab === 'garden' ? 'tab-item-active' : ''}`}
          onClick={() => go('garden')}
        >
          <span className="tab-icon">🌳</span>
          <span className="tab-label">Сад</span>
        </button>
        <button
          className={`tab-item ${tab === 'budget' ? 'tab-item-active' : ''}`}
          onClick={() => go('budget')}
        >
          <span className="tab-icon">💰</span>
          <span className="tab-label">Бюджет</span>
        </button>
        <button
          className={`tab-item ${tab === 'goals' ? 'tab-item-active' : ''}`}
          onClick={() => go('goals')}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Цели</span>
        </button>
        <button
          className={`tab-item ${tab === 'analytics' ? 'tab-item-active' : ''}`}
          onClick={() => go('analytics')}
        >
          <span className="tab-icon">📊</span>
          <span className="tab-label">Анализ</span>
        </button>
        <button
          className={`tab-item ${tab === 'achievements' ? 'tab-item-active' : ''}`}
          onClick={() => go('achievements')}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Награды</span>
        </button>
        <button
          className={`tab-item ${tab === 'settings' ? 'tab-item-active' : ''}`}
          onClick={() => go('settings')}
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">Ещё</span>
        </button>
      </nav>
    </div>
  );
}