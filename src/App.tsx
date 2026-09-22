// src/App.tsx

import { useEffect, useState } from 'react';
import { GardenScreen } from './screens/GardenScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { GoalsScreen } from './screens/GoalsScreen';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { createLocalStorageAdapter } from './core/storage';
import { createInitialState } from './core/factories';
import { initStore } from './core/store';
import type { KGState } from './types/state';

type Tab = 'garden' | 'budget' | 'goals' | 'achievements' | 'settings';

export default function App() {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<KGState | null>(null);
  const [tab, setTab] = useState<Tab>('garden');

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

  if (!ready || !state) {
    return (
      <div className="loading-screen">
        <div className="loading-emoji">🌳</div>
        <div className="loading-text">Сажаю сад...</div>
      </div>
    );
  }

  return (
    <div className="app-root">
      {tab === 'garden' && <GardenScreen />}
      {tab === 'budget' && <BudgetScreen />}
      {tab === 'goals' && <GoalsScreen />}
      {tab === 'achievements' && <AchievementsScreen />}
      {tab === 'settings' && <SettingsScreen />}

      {/* Нижний таб-бар */}
      <nav className="tab-bar">
        <button
          className={`tab-item ${tab === 'garden' ? 'tab-item-active' : ''}`}
          onClick={() => setTab('garden')}
        >
          <span className="tab-icon">🌳</span>
          <span className="tab-label">Сад</span>
        </button>
        <button
          className={`tab-item ${tab === 'budget' ? 'tab-item-active' : ''}`}
          onClick={() => setTab('budget')}
        >
          <span className="tab-icon">💰</span>
          <span className="tab-label">Бюджет</span>
        </button>
        <button
          className={`tab-item ${tab === 'goals' ? 'tab-item-active' : ''}`}
          onClick={() => setTab('goals')}
        >
          <span className="tab-icon">🎯</span>
          <span className="tab-label">Цели</span>
        </button>
        <button
          className={`tab-item ${tab === 'achievements' ? 'tab-item-active' : ''}`}
          onClick={() => setTab('achievements')}
        >
          <span className="tab-icon">🏆</span>
          <span className="tab-label">Награды</span>
        </button>
        <button
          className={`tab-item ${tab === 'settings' ? 'tab-item-active' : ''}`}
          onClick={() => setTab('settings')}
        >
          <span className="tab-icon">⚙️</span>
          <span className="tab-label">Настройки</span>
        </button>
      </nav>
    </div>
  );
}
