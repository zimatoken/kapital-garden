// src/components/GoalEditor.tsx

import { useEffect, useState } from 'react';
import type { Goal, GoalKind, GoalIcon } from '../types/goal';
import { useStore } from '../hooks/useStore';

interface GoalEditorProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (goal: Goal) => void;
  /** Если передан — режим редактирования. */
  initialGoal?: Goal | null;
}

/**
 * Модалка создания или редактирования цели.
 *
 * Режимы:
 * - Создание: `initialGoal` не передан.
 * - Редактирование: `initialGoal` — существующая цель.
 */
export function GoalEditor({
  open,
  onClose,
  onSuccess,
  initialGoal = null,
}: GoalEditorProps) {
  const store = useStore();
  const isEditing = initialGoal !== null;

  const [kind, setKind] = useState<GoalKind>('apartment');
  const [icon, setIcon] = useState<GoalIcon>('🏡');
  const [title, setTitle] = useState('Квартира');
  const [amountStr, setAmountStr] = useState('5000000');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Сброс / подстановка при открытии
  useEffect(() => {
    if (!open) return;

    if (initialGoal) {
      setKind(initialGoal.kind);
      setIcon(initialGoal.icon);
      setTitle(initialGoal.title);
      setAmountStr(String(initialGoal.targetAmount.minorUnits / 100));
      setTargetDate(initialGoal.targetDate ?? '');
    } else {
      setKind('apartment');
      setIcon('🏡');
      setTitle('Квартира');
      setAmountStr('5000000');
      setTargetDate('');
    }
    setError(null);
  }, [open, initialGoal]);

  if (!open) return null;

  const amountMinor = Math.round(parseFloat(amountStr.replace(',', '.')) * 100) || 0;
  const canSave = title.trim().length > 0 && amountMinor > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      if (isEditing && initialGoal) {
        await store.updateGoal(initialGoal.id, {
          kind,
          icon,
          title: title.trim(),
          targetAmount: { minorUnits: amountMinor, currency: 'RUB' },
          targetDate: targetDate || null,
        });
        onSuccess?.({ ...initialGoal, title: title.trim() });
      } else {
        const goal = await store.addGoal({
          kind,
          icon,
          title: title.trim(),
          targetMinor: amountMinor,
          targetDate: targetDate || null,
        });
        onSuccess?.(goal);
      }
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const chooseKind = (k: GoalKind, i: GoalIcon, defaultTitle: string) => {
    setKind(k);
    setIcon(i);
    if (!isEditing) setTitle(defaultTitle);
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className={`modal-header ${isEditing ? 'modal-header-goal' : ''}`}>
          <h2>{isEditing ? '✏️ Изменить цель' : '🌱 Новая цель'}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </header>

        <div className="modal-body">
          {/* Выбор типа */}
          <label className="field-label">Что копишь?</label>
          <div className="goal-kinds">
            <button
              className={`goal-kind ${kind === 'apartment' ? 'goal-kind-active' : ''}`}
              onClick={() => chooseKind('apartment', '🏡', 'Квартира')}
            >
              🏡 Квартира
            </button>
            <button
              className={`goal-kind ${kind === 'car' ? 'goal-kind-active' : ''}`}
              onClick={() => chooseKind('car', '🚗', 'Машина')}
            >
              🚗 Машина
            </button>
            <button
              className={`goal-kind ${kind === 'pension' ? 'goal-kind-active' : ''}`}
              onClick={() => chooseKind('pension', '🌴', 'Пенсия')}
            >
              🌴 Пенсия
            </button>
            <button
              className={`goal-kind ${kind === 'education' ? 'goal-kind-active' : ''}`}
              onClick={() => chooseKind('education', '🎓', 'Образование')}
            >
              🎓 Образование
            </button>
            <button
              className={`goal-kind ${kind === 'custom' ? 'goal-kind-active' : ''}`}
              onClick={() => chooseKind('custom', '💎', '')}
            >
              💎 Своё
            </button>
          </div>

          {/* Название */}
          <label className="field-label" style={{ marginTop: 16 }}>
            Название
          </label>
          <input
            type="text"
            className="note-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Квартира в Казани"
            maxLength={60}
            autoFocus
          />

          {/* Сумма */}
          <label className="field-label" style={{ marginTop: 16 }}>
            Сколько нужно?
          </label>
          <div className="amount-input-wrap">
            <input
              type="text"
              inputMode="decimal"
              className="amount-input"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onClose();
              }}
            />
            <span className="amount-suffix">₽</span>
          </div>

          {/* Дата */}
          <label className="field-label" style={{ marginTop: 16 }}>
            К какому сроку? <span className="muted">(опционально)</span>
          </label>
          <input
            type="date"
            className="note-input"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />

          {error && <div className="goal-error">⚠️ {error}</div>}
        </div>

        <footer className="modal-footer">
          <button className="btn-primary" onClick={handleSave} disabled={!canSave}>
            {saving
              ? 'Сохраняю...'
              : isEditing
              ? '💾 Сохранить'
              : '🌱 Посадить'}
          </button>
        </footer>
      </div>
    </div>
  );
}