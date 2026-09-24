// src/components/GoalActions.tsx

import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import type { GoalProgress } from '../core/goals';
import { GoalEditor } from './GoalEditor';

interface Props {
  progress: GoalProgress;
  onClose: () => void;
}

/**
 * Меню действий для цели:
 * ✏️ Редактировать · 📦 Архив · 🗑 Удалить
 */
export function GoalActions({ progress, onClose }: Props) {
  const store = useStore();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { goal } = progress;

  const handleArchive = async () => {
    if (goal.archived) {
      await store.unarchiveGoal(goal.id);
    } else {
      await store.archiveGoal(goal.id);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await store.removeGoal(goal.id);
    onClose();
  };

  // Открываем редактор, закрывая меню действий
  if (editOpen) {
    return (
      <GoalEditor
        open={true}
        onClose={() => {
          setEditOpen(false);
          onClose();
        }}
        initialGoal={goal}
      />
    );
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header modal-header-goal">
          <h2>
            {goal.icon} {goal.title}
          </h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </header>

        <div className="modal-body modal-body-actions">
          <button
            className="action-row"
            onClick={() => setEditOpen(true)}
          >
            <span className="action-icon">✏️</span>
            <span className="action-label">Редактировать</span>
          </button>

          <button
            className="action-row"
            onClick={handleArchive}
          >
            <span className="action-icon">
              {goal.archived ? '↩️' : '📦'}
            </span>
            <span className="action-label">
              {goal.archived ? 'Вернуть из архива' : 'В архив'}
            </span>
          </button>

          <button
            className={`action-row ${confirmDelete ? 'action-row-danger' : ''}`}
            onClick={handleDelete}
          >
            <span className="action-icon">
              {confirmDelete ? '❗' : '🗑'}
            </span>
            <span className="action-label">
              {confirmDelete ? 'Нажми ещё раз — удалить' : 'Удалить цель'}
            </span>
          </button>

          {confirmDelete && (
            <button
              className="btn-cancel"
              onClick={() => setConfirmDelete(false)}
            >
              Отмена
            </button>
          )}

          <p className="muted action-hint">
            {confirmDelete
              ? 'Удаление цели не удалит накопления — просто отвяжет их.'
              : 'Накопления по этой цели сохраняются при редактировании.'}
          </p>
        </div>
      </div>
    </div>
  );
}