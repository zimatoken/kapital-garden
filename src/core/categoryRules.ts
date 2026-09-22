// src/core/categoryRules.ts

import type { Category, TxType } from '../types/transaction';

/**
 * Умный парсер категорий.
 *
 * При вводе заметки — ищет ключевые слова и предлагает категорию.
 * Работает на чистой функции. Никаких оценок, только подсказка.
 */

/**
 * Найти подходящую категорию по тексту заметки.
 *
 * @param note — текст заметки (например, «Заправил машину»)
 * @param categories — список доступных категорий
 * @param type — тип транзакции (income / expense)
 * @returns categoryId или null, если ничего не найдено
 */
export function guessCategory(
  note: string,
  categories: Category[],
  type: TxType,
): string | null {
  const text = note.toLowerCase().trim();
  if (!text) return null;

  const filtered = categories.filter((c) => c.kind === type);

  // Ищем точное совпадение по ключевым словам
  let bestMatch: { id: string; score: number } | null = null;

  for (const cat of filtered) {
    if (!cat.keywords || cat.keywords.length === 0) continue;

    for (const kw of cat.keywords) {
      const keyword = kw.toLowerCase();
      if (text.includes(keyword)) {
        // Чем длиннее ключевое слово — тем точнее совпадение
        const score = keyword.length;
        if (!bestMatch || score > bestMatch.score) {
          bestMatch = { id: cat.id, score };
        }
      }
    }
  }

  return bestMatch?.id ?? null;
}

/**
 * Получить категорию по id.
 */
export function getCategoryById(
  id: string,
  categories: Category[],
): Category | null {
  return categories.find((c) => c.id === id) ?? null;
}