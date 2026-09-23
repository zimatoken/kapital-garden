// src/components/MonthlyReportModal.tsx

import { useEffect, useState } from 'react';
import type { MonthlyReport } from '../core/monthlyReport';
import { formatMoney } from '../core/money';

const STORAGE_KEY = 'kg.report.seen';

interface Props {
  report: MonthlyReport;
}

/**
 * Модалка «Отчёт за прошлый месяц» — показывается один раз в начале
 * нового месяца. Пользователь закрывает — больше не увидит до
 * следующего месяца.
 */
export function MonthlyReportModal({ report }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!report.isReady) return;

    const seen = localStorage.getItem(STORAGE_KEY);
    if (seen === report.monthKey) return;

    // Показать через 800ms после загрузки — чтобы не мерцало
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, [report.isReady, report.monthKey]);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, report.monthKey);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header modal-header-report">
          <h2>📅 Отчёт за {report.monthLabel}</h2>
          <button className="modal-close" onClick={handleClose}>✕</button>
        </header>

        <div className="modal-body">
          <div className="report-totals">
            <div className="report-row">
              <span className="report-label">💼 Доход</span>
              <span className="report-value report-income">
                {formatMoney(report.totalIncome)}
              </span>
            </div>
            <div className="report-row">
              <span className="report-label">💸 Расход</span>
              <span className="report-value report-expense">
                {formatMoney(report.totalExpense)}
              </span>
            </div>
            <div className="report-row">
              <span className="report-label">💚 Отложено</span>
              <span className="report-value report-deposit">
                {formatMoney(report.totalDeposited)}
              </span>
            </div>
          </div>

          {report.topCategory && (
            <div className="report-fact" style={{ marginTop: 16 }}>
              <span className="fact-label">🏆 Топ-категория</span>
              <span className="fact-value">
                {report.topCategory.category.icon}{' '}
                {report.topCategory.category.name} ·{' '}
                {formatMoney(report.topCategory.amount)}
              </span>
            </div>
          )}

          {report.activeDays > 0 && (
            <div className="report-fact">
              <span className="fact-label">📆 Дней с отложениями</span>
              <span className="fact-value">{report.activeDays}</span>
            </div>
          )}

          {report.bestStreakInMonth > 1 && (
            <div className="report-fact">
              <span className="fact-label">🔥 Лучший стрик</span>
              <span className="fact-value">{report.bestStreakInMonth} дней</span>
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="btn-primary" onClick={handleClose}>
            Понятно
          </button>
        </footer>
      </div>
    </div>
  );
}