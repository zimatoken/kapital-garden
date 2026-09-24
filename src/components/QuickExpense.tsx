// src/components/QuickExpense.tsx

import { useEffect, useMemo, useState } from 'react';
import { useStore, useStoreState } from '../hooks/useStore';
import { guessCategory } from '../core/categoryRules';
import { formatMoney } from '../core/money';
import { VoiceInputButton } from './VoiceInputButton';

interface QuickExpenseProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Быстрый ввод расхода — из главного экрана.
 *
 * Отличие от AddTransactionModal в BudgetScreen:
 * - Открывается с экрана Сада.
 * - Минимум полей: сумма + заметка.
 * - Категория определяется автоматически по заметке.
 * - Голосовой ввод: скажи «заправка 2000» → всё заполнится.
 */
export function QuickExpense({ open, onClose }: QuickExpenseProps) {
  const store = useStore();
  const state = useStoreState();
  const [amountStr, setAmountStr] = useState('500');
  const [note, setNote] = useState('');
  const [categoryId, setCategoryId] = useState('cat-food');
  const [saving, setSaving] = useState(false);

  const expenseCategories = useMemo(
    () => state.categories.filter((c) => c.kind === 'expense'),
    [state.categories],
  );

  const amountMinor = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0;
  const canSave = amountMinor > 0 && !saving;

  // Авто-определение категории по заметке
  useEffect(() => {
    if (!note.trim()) return;
    const guessed = guessCategory(note, state.categories, 'expense');
    if (guessed) {
      setCategoryId(guessed);
    }
  }, [note, state.categories]);

  // Сброс при открытии
  useEffect(() => {
    if (open) {
      setAmountStr('500');
      setNote('');
      setCategoryId('cat-food');
    }
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await store.addTransaction({
        type: 'expense',
        amountMinor,
        categoryId,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  /**
   * Результат голосового ввода.
   * Заполняем сумму и заметку. Категория подсветится автоматически
   * через useEffect выше.
   */
  const handleVoiceResult = (voiceAmountMinor: number, voiceNote: string) => {
    if (voiceAmountMinor > 0) {
      setAmountStr(String(voiceAmountMinor / 100));
    }
    if (voiceNote) {
      setNote(voiceNote);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-quick" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header modal-header-expense">
          <h2>💸 Быстрый расход</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body">
          {/* Сумма */}
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

          {/* Заметка + голосовой ввод */}
          <div className="note-input-row">
            <input
              type="text"
              className="note-input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Например: обед, заправка, аптека..."
              maxLength={80}
            />
            <VoiceInputButton onResult={handleVoiceResult} />
          </div>

          {/* Выбор категории — чипы */}
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
            {saving
              ? 'Сохраняю...'
              : `Записать ${formatMoney({ minorUnits: amountMinor, currency: 'RUB' })}`}
          </button>
        </footer>
      </div>
    </div>
  );
}