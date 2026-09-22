// src/screens/SettingsScreen.tsx

import { useState } from 'react';
import { useStore, useStoreState } from '../hooks/useStore';
import type { AppSettings } from '../types/settings';

export function SettingsScreen() {
  const state = useStoreState();
  const store = useStore();
  const [confirmReset, setConfirmReset] = useState(false);

  const savings = state.settings.savings;

  const handlePercentChange = (percent: number) => {
    const next: AppSettings = {
      ...state.settings,
      savings: { ...savings, mode: 'percent', percent },
    };
    store.updateSettings(next);
  };

  const handleExport = () => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kapital-garden-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        store.replaceState(parsed);
      } catch (err) {
        alert('Не удалось прочитать файл');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    localStorage.removeItem('kg.state');
    location.reload();
  };

  return (
    <div className="settings-screen">
      <header className="header">
        <span className="logo">⚙️</span>
        <div>
          <h1>Настройки</h1>
          <p className="tagline">Твой сад, твои правила</p>
        </div>
      </header>

      <main className="settings-main">
        {/* ─── Процент отложений ─── */}
        <section className="card">
          <h2>💰 Процент отложений</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Сколько откладывать с каждого дохода
          </p>
          <div className="settings-percent-grid">
            {[5, 10, 15, 20].map((p) => (
              <button
                key={p}
                className={`settings-percent-btn ${savings.percent === p && savings.mode === 'percent' ? 'settings-percent-active' : ''}`}
                onClick={() => handlePercentChange(p)}
              >
                {p}%
              </button>
            ))}
          </div>
          <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>
            Сейчас: {savings.mode === 'percent' ? `${savings.percent}%` : 'фиксированная сумма'}
          </p>
        </section>

        {/* ─── Данные ─── */}
        <section className="card">
          <h2>📦 Данные</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Всё хранится только у тебя. Экспортируй — и не потеряешь.
          </p>
          <div className="settings-actions">
            <button className="btn-secondary" onClick={handleExport}>
              📤 Экспорт JSON
            </button>
            <label className="btn-secondary settings-upload">
              📥 Импорт JSON
              <input
                type="file"
                accept="application/json"
                onChange={handleImport}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </section>

        {/* ─── Опасная зона ─── */}
        <section className="card card-danger">
          <h2>⚠️ Опасная зона</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Сброс удалит все транзакции, отложения и цели. Необратимо.
          </p>
          <button
            className={`btn-danger ${confirmReset ? 'btn-danger-confirm' : ''}`}
            onClick={handleReset}
          >
            {confirmReset ? '❗ Нажми ещё раз — стереть' : '🗑 Сбросить все данные'}
          </button>
          {confirmReset && (
            <button
              className="btn-secondary"
              style={{ marginTop: 8 }}
              onClick={() => setConfirmReset(false)}
            >
              Отмена
            </button>
          )}
        </section>

        {/* ─── О приложении ─── */}
        <section className="card">
          <h2>🌳 О Kapital Garden</h2>
          <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            Каждая отложенная копейка — семя твоего будущего.<br />
            Версия 0.7 · PHASE 6<br />
            Данные только у тебя. Никакой регистрации.
          </p>
        </section>
      </main>
    </div>
  );
}