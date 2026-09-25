// src/screens/SettingsScreen.tsx

import { useState } from 'react';
import { useStore, useStoreState } from '../hooks/useStore';
import { RecurringEditor } from '../components/RecurringEditor';
import { formatMoney } from '../core/money';
import { exportFullCSV } from '../core/csv';
import { HelpButton } from '../components/HelpButton';
import { HelpModal } from '../components/HelpModal';
import type { AppSettings } from '../types/settings';

export function SettingsScreen() {
  const state = useStoreState();
  const store = useStore();
  const [confirmReset, setConfirmReset] = useState(false);
  const [recurringOpen, setRecurringOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

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
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        await store.replaceState(parsed);
        alert('Данные успешно загружены');
      } catch (err) {
        const message = (err as Error).message;
        alert(`Не удалось прочитать файл: ${message}`);
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

        {/* ─── Тема ─── */}
        <section className="card">
          <h2>🎨 Тема оформления</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Как выглядит приложение
          </p>
          <div className="theme-switch">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <button
                key={t}
                className={`theme-btn ${state.settings.theme === t ? 'theme-btn-active' : ''}`}
                onClick={() =>
                  store.updateSettings({ ...state.settings, theme: t })
                }
              >
                {t === 'light' && '☀️ Светлая'}
                {t === 'dark' && '🌙 Тёмная'}
                {t === 'system' && '⚙️ Системная'}
              </button>
            ))}
          </div>
        </section>

        {/* ─── Регулярные расходы ─── */}
        <section className="card">
          <h2>🔁 Регулярные расходы</h2>
          <p className="muted" style={{ marginBottom: 12 }}>
            Ипотека, ЖКХ, подписки. Приложение напомнит в начале месяца.
          </p>

          {state.recurring.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>
              Пока пусто. Добавь — и больше не забывай.
            </p>
          ) : (
            <div className="recurring-list">
              {state.recurring.map((r) => (
                <div key={r.id} className="recurring-row">
                  <div className="recurring-info">
                    <div className="recurring-title">{r.title}</div>
                    <div className="recurring-sub">
                      {formatMoney(r.amount)} · {r.dayOfMonth}-е число
                    </div>
                  </div>
                  <button
                    className="tx-delete"
                    onClick={() => store.removeRecurring(r.id)}
                    aria-label="Удалить"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            className="recurring-add-btn"
            onClick={() => setRecurringOpen(true)}
          >
            + Добавить регулярный
          </button>
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
            <button className="btn-secondary" onClick={() => exportFullCSV(state)}>
              📊 Экспорт CSV (для Excel)
            </button>
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
              className="btn-cancel"
              style={{ marginTop: 8, width: '100%' }}
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
            Версия 1.5 · PHASE 11<br />
            Данные только у тебя. Никакой регистрации.
          </p>
        </section>
      </main>

      {/* Модалка регулярных расходов */}
      <RecurringEditor
        open={recurringOpen}
        onClose={() => setRecurringOpen(false)}
      />

      {/* Модалка инструкции */}
      <HelpModal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        initialSectionId="settings"
      />
    </div>
  );
}