import { Category } from '../types/transaction';

/** 5-7 категорий, не 50. Ввод за 5 секунд. */
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-income-salary', name: 'Зарплата', kind: 'income', icon: '💼' },
  { id: 'cat-income-other', name: 'Прочий доход', kind: 'income', icon: '💫' },
  { id: 'cat-food', name: 'Еда', kind: 'expense', icon: '🍲' },
  { id: 'cat-home', name: 'Дом', kind: 'expense', icon: '🏠' },
  { id: 'cat-transport', name: 'Транспорт', kind: 'expense', icon: '🚇' },
  { id: 'cat-fun', name: 'Развлечения', kind: 'expense', icon: '🎈' },
  { id: 'cat-other', name: 'Прочее', kind: 'expense', icon: '📦' },
];
