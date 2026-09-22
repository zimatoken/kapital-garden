// src/components/RecurringEditor.tsx

import { useMemo, useState } from 'react';
import { useStore, useStoreState } from '../hooks/useStore';
import { todayISODate } from '../core/dates';

interface RecurringEditorProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Простой редактор регулярного расхода (без сложной формы).
 */
export function RecurringEditor({ open, onClose }: RecurringEditorProps) {
  const store = useStore();
  const state = useStoreState();
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('1000');
  const [categoryId, setCategoryId] = useState('cat-home');
  const [dayOfMonth, setDayOfMonth] = useState(10);
  const [saving, setSaving] = useState(false);

  const expenseCategories = useMemo(
    () => state.categories.filter((c) => c.kind === 'expense'),
    [state.categories],
  );

  const amountMinor = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0;
  const canSave = title.trim().length > 0 && amountMinor > 0 && !saving;

  if (!open) return null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await store.addRecurring({
        title: title.trim(),
        amountMinor,
        categoryId,
        dayOfMonth,
        note: title.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>🔁 Новый регулярный платёж</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          <label className="field-label">Название</label>
          <input
            type="text"
            className="note-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ипотека, ЖКХ, Netflix..."
            maxLength={40}
            autoFocus
          />

          <label className="field-label" style={{ marginTop: 12 }}>Сумма</label>
          <div className="amount-input-wrap">
            <input
              type="text"
              inputMode="decimal"
              className="amount-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
            <span className="amount-suffix">₽</span>
          </div>

          <label className="field-label" style={{ marginTop: 12 }}>День месяца</label>
          <input
            type="number"
            min={1}
            max={28}
            className="note-input"
            value={dayOfMonth}
            onChange={(e) => setDayOfMonth(Math.min(28, Math.max(1, parseInt(e.target.value) || 1)))}
          />
          <p className="muted" style={{ fontSize: 11, marginTop: 4 }}>
            1-28 (безопасно для февраля)
          </p>

          <label className="field-label" style={{ marginTop: 12 }}>Категория</label>
          <div className="quick-category-chips">
            {expenseCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`quick-chip ${categoryId === cat.id ? 'quick-chip-active' : ''}`}
                onClick={() => setCategoryId(cat.id)}
              >
                <span className="quick-chip-icon">{cat.icon}</span>
                <span className="quick-chip-name">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        <footer className="modal-footer">
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving ? 'Сохраняю...' : 'Создать'}
          </button>
        </footer>
      </div>
    </div>
  );
}