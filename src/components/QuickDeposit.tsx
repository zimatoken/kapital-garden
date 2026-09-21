// src/components/QuickDeposit.tsx

import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { STRINGS } from '../data/strings';
import { formatMoney } from '../core/money';
import { todayISODate } from '../core/dates';

interface QuickDepositProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (amountMinor: number) => void;
}

const QUICK_AMOUNTS = [100_00, 500_00, 1000_00, 5000_00]; // ₽ × 100

/**
 * Модалка быстрого отложения.
 * Ввод за 5 секунд: сумма → кнопка → готово.
 */
export function QuickDeposit({ open, onClose, onSuccess }: QuickDepositProps) {
  const store = useStore();
  const [amountStr, setAmountStr] = useState('500');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const amountMinor = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0;
  const canSave = amountMinor > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await store.addDeposit({
        amountMinor,
        source: 'manual',
        note: note.trim(),
        date: todayISODate(),
      });
      onSuccess?.(amountMinor);
      setAmountStr('500');
      setNote('');
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2>🌱 Посадить семя</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <div className="modal-body">
          <label className="field-label">Сколько отложить?</label>
          <div className="amount-input-wrap">
            <input
              type="text"
              inputMode="decimal"
              className="amount-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
            />
            <span className="amount-suffix">₽</span>
          </div>

          <div className="quick-amounts">
            {QUICK_AMOUNTS.map((m) => (
              <button
                key={m}
                className="quick-amount"
                onClick={() => setAmountStr(String(m / 100))}
              >
                {formatMoney({ minorUnits: m, currency: 'RUB' })}
              </button>
            ))}
          </div>

          <label className="field-label" style={{ marginTop: 16 }}>
            Заметка (необязательно)
          </label>
          <input
            type="text"
            className="note-input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Например: с зарплаты"
            maxLength={80}
          />
        </div>

        <footer className="modal-footer">
          <button
            className="btn-primary"
            disabled={!canSave}
            onClick={handleSave}
          >
            {saving ? 'Сажаю...' : '🌱 Посадить'}
          </button>
        </footer>
      </div>
    </div>
  );
}