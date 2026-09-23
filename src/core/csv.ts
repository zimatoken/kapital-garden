// src/core/csv.ts

import type { KGState } from '../types/state';

/**
 * Экспорт данных в CSV.
 *
 * Формат подходит для Excel / Google Sheets / Numbers.
 * Разделитель — точка с запятой (для русской локали Excel).
 * BOM в начале — чтобы Excel не ломал кириллицу.
 */
export function exportTransactionsCSV(state: KGState): void {
  const rows: string[][] = [];

  // Заголовки
  rows.push([
    'Дата',
    'Тип',
    'Категория',
    'Сумма',
    'Валюта',
    'Заметка',
  ]);

  // Транзакции
  for (const tx of state.transactions) {
    const cat = state.categories.find((c) => c.id === tx.categoryId);
    rows.push([
      tx.date,
      tx.type === 'income' ? 'Доход' : 'Расход',
      cat ? `${cat.icon} ${cat.name}` : tx.categoryId,
      (tx.amount.minorUnits / 100).toFixed(2),
      tx.amount.currency,
      tx.note ?? '',
    ]);
  }

  downloadCSV(
    rows,
    `kapital-garden-transactions-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

export function exportDepositsCSV(state: KGState): void {
  const rows: string[][] = [];

  rows.push([
    'Дата',
    'Сумма',
    'Валюта',
    'Источник',
    'Цель',
    'Заметка',
  ]);

  for (const d of state.deposits) {
    const goal = d.goalId
      ? state.goals.find((g) => g.id === d.goalId)
      : null;
    rows.push([
      d.date,
      (d.amount.minorUnits / 100).toFixed(2),
      d.amount.currency,
      d.source,
      goal ? `${goal.icon} ${goal.title}` : '—',
      d.note ?? '',
    ]);
  }

  downloadCSV(
    rows,
    `kapital-garden-deposits-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

/**
 * Общий экспорт — все данные в одном файле.
 */
export function exportFullCSV(state: KGState): void {
  const rows: string[][] = [];

  // Секция 1: Транзакции
  rows.push(['=== ТРАНЗАКЦИИ ===']);
  rows.push(['Дата', 'Тип', 'Категория', 'Сумма', 'Валюта', 'Заметка']);
  for (const tx of state.transactions) {
    const cat = state.categories.find((c) => c.id === tx.categoryId);
    rows.push([
      tx.date,
      tx.type === 'income' ? 'Доход' : 'Расход',
      cat ? `${cat.icon} ${cat.name}` : tx.categoryId,
      (tx.amount.minorUnits / 100).toFixed(2),
      tx.amount.currency,
      tx.note ?? '',
    ]);
  }

  rows.push([]);

  // Секция 2: Отложения
  rows.push(['=== ОТЛОЖЕНИЯ ===']);
  rows.push(['Дата', 'Сумма', 'Валюта', 'Источник', 'Цель', 'Заметка']);
  for (const d of state.deposits) {
    const goal = d.goalId
      ? state.goals.find((g) => g.id === d.goalId)
      : null;
    rows.push([
      d.date,
      (d.amount.minorUnits / 100).toFixed(2),
      d.amount.currency,
      d.source,
      goal ? `${goal.icon} ${goal.title}` : '—',
      d.note ?? '',
    ]);
  }

  downloadCSV(
    rows,
    `kapital-garden-full-${new Date().toISOString().slice(0, 10)}.csv`,
  );
}

/**
 * Скачать CSV с BOM и ;
 */
function downloadCSV(rows: string[][], filename: string): void {
  const SEPARATOR = ';';

  const escape = (value: string): string => {
    if (value.includes(SEPARATOR) || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const csv = rows
    .map((row) => row.map(escape).join(SEPARATOR))
    .join('\r\n');

  // BOM для Excel, чтобы кириллица была видна
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}