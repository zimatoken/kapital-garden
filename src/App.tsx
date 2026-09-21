// src/App.tsx

import { useEffect, useState } from 'react';
import { GardenScreen } from './screens/GardenScreen';
import { BudgetScreen } from './screens/BudgetScreen';
import { createLocalStorageAdapter } from './core/storage';
import { createInitialState } from './core/factories';
import { initStore } from './core/store';
import type { KGState } from './types/state';

type Tab = 'garden' | 'budget';

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
      {tab === 'garden' ? <GardenScreen /> : <BudgetScreen />}

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
      </nav>
    </div>
  );
}