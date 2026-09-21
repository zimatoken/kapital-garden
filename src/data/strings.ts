// src/data/strings.ts

/**
 * ВСЕ строки, видимые пользователю — здесь.
 *
 * core/ не содержит текста. Тон приложения редактируется одним файлом.
 * Мотивирующий, не давящий. Никаких «ТЫ ПОТРАТИЛ СЛИШКОМ МНОГО!».
 */
export const STRINGS = {
  // ─── Общие ─────────────────────────────────
  appTitle: 'KAPITAL GARDEN',
  tagline: 'Каждая отложенная копейка — семя твоего будущего.',

  // ─── Статусы стрика ────────────────────────
  statusGrowing: 'Сад растёт.',
  statusWilting: 'Сад немного увядает. Всё можно вернуть.',
  statusDormant: 'Сад дремлет. Он помнит тебя.',
  revival: 'Дерево выпустило новый росток. Сад продолжается.',
  bestStreak: (n: number) => `Лучший: 🔥 ${n}`,

  // ─── Пустой сад ────────────────────────────
  gardenEmptyTitle: '🌱 Твой сад ждёт первого семени',
  gardenEmptyBody:
    'Каждая отложенная копейка — семя. Каждое семя — шаг к свободе. Нажми на 🌱 внизу экрана и посади первое семя.',

  // ─── Кнопка отложения ──────────────────────
  depositButton: '🌱 Посадить семя',
  depositTitle: '🌱 Посадить семя',
  depositAmountLabel: 'Сколько отложить?',
  depositNoteLabel: 'Заметка (необязательно)',
  depositNotePlaceholder: 'Например: с зарплаты',
  depositSubmit: '🌱 Посадить',
  depositSubmitting: 'Сажаю...',
  depositCancel: 'Отмена',

  // ─── Числа роста ───────────────────────────
  growthTitle: '💰 Твой темп роста',
  growthSubtitle: 'Если продолжишь так — столько будет к концу периода:',
  growthSubtitleEarly: 'Пока рано строить прогнозы. Вот что уже есть:',
  growthToday: 'Сегодня',
  growthMonth: 'За месяц',
  growthYear: 'За год',
  growth10Years: 'За 10 лет',
  growthNote: '* без учёта инвестиций. Если инвестировать под 10% — будет больше.',
  growthNoteEarly: (days: number) =>
    `Прогноз появится после 7 дней наблюдений. Пока прошло ${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}.`,

  // ─── Сад года ──────────────────────────────
  gardenYearTitle: (year: number) => `📅 Сад года — ${year}`,
  gardenYearHint: 'Клик на месяц — детали',
  gardenYearDays: (active: number, total: number) => `${active} из ${total} дней с отложениями`,

  // ─── Бюджет ────────────────────────────────
  budgetTitle: '💰 Бюджет',
  budgetIncome: 'Доход',
  budgetExpense: 'Расход',
  budgetDeposited: 'Отложено (10%)',
  budgetFree: 'Свободно',
  budgetInvestButton: '💎 Инвестировать',
  budgetAddIncome: '💼 + Доход',
  budgetAddExpense: '🛒 + Расход',
  budgetTransactions: 'Транзакции',
  budgetNoTransactions: 'В этом месяце пока нет записей.',
  budgetAmountLabel: 'Сумма',
  budgetNoteLabel: 'Заметка (необязательно)',
  budgetNotePlaceholder: 'Например: зарплата, продукты',
  budgetAutoDepositHint: 'Приложение предложит отложить 10% автоматически.',

  // ─── Стрик ─────────────────────────────────
  streakTitle: '🔥 Стрик',
  streakDays: 'дней',

  // ─── Прогноз ───────────────────────────────
  forecastTitle: '🍎 Прогноз',
} as const;

export type Strings = typeof STRINGS;