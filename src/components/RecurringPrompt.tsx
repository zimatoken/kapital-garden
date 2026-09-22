// src/components/RecurringPrompt.tsx

import { useMemo, useState } from 'react';
import { useStore, useStoreState } from '../hooks/useStore';
import { todayISODate } from '../core/dates';
import { dueRecurring, markApplied } from '../core/recurring';
import { formatMoney } from '../core/money';
import type { RecurringExpense } from '../types/recurring';

/**
 * Промпт «Созрели регулярные расходы» — показывается на Саду,
 * если в этом месяце есть неподтверждённые регулярные платежи.
 */
export function RecurringPrompt() {
  const state = useStoreState();
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<Set<string>>(new Set());

  const today = todayISODate();
  const monthKey = today.slice(0, 7);
  const dayOfMonth = parseInt(today.slice(8, 10), 10);

  const due = useMemo(
    () => dueRecurring(state.recurring, monthKey, dayOfMonth),
    [state.recurring, monthKey, dayOfMonth],
  );

  const pending = due.filter((r) => !applied.has(r.id));

  if (pending.length === 0) return null;

  const handleApply = async (r: RecurringExpense) => {
    await store.addTransaction({
      type: 'expense',
      amountMinor: r.amount.minorUnits,
      categoryId: r.categoryId,
      note: r.note || r.title,
    });

    await store.updateRecurring(markApplied(r, monthKey));
    setApplied((prev) => new Set(prev).add(r.id));
  };

  const handleApplyAll = async () => {
    for (const r of pending) {
      await handleApply(r);
    }
    setOpen(false);
  };

  return (
    <>
      <section className="card recurring-prompt">
        <div className="recurring-prompt-header">
          <span className="recurring-prompt-icon">🔁</span>
          <div>
            <div className="recurring-prompt-title">
              {pending.length} {pending.length === 1 ? 'платёж' : 'платежей'} ждёт
            </div>
            <div className="recurring-prompt-sub">
              Регулярные расходы этого месяца
            </div>
          </div>
        </div>
        <button
          className="btn-secondary"
          style={{ width: '100%', marginTop: 12 }}
          onClick={() => setOpen(true)}
        >
          Проверить
        </button>
      </section>

      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header className="modal-header">
              <h2>🔁 Регулярные платежи</h2>
              <button className="modal-close" onClick={() => setOpen(false)}>✕</button>
            </header>

            <div className="modal-body">
              <p className="muted" style={{ marginBottom: 12, fontSize: 13 }}>
                Подтверди — и они попадут в бюджет.
              </p>

              <div className="recurring-list">
                {pending.map((r) => (
                  <div key={r.id} className="recurring-row">
                    <div className="recurring-info">
                      <div className="recurring-title">{r.title}</div>
                      <div className="recurring-sub">
                        {formatMoney(r.amount)}
                      </div>
                    </div>
                    <button
                      className="btn-secondary"
                      onClick={() => handleApply(r)}
                    >
                      Записать
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <footer className="modal-footer">
              <button className="btn-primary" onClick={handleApplyAll}>
                Записать все ({pending.length})
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  );
}