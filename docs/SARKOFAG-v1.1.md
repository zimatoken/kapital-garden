📦 САРКОФАГ ЗНАНИЙ — KAPITAL GARDEN v1.1 (дополнение)
Дата: 20.09.2026
Статус: ✅ УТВЕРЖДЕНО, ОБЯЗАТЕЛЬНО К PHASE 0-1

________________________________________
🔑 КЛЮЧЕВЫЕ РЕШЕНИЯ v1.1

1. САД ПИТАЕТСЯ НЕ ТРАНЗАКЦИЯМИ, А СОБЫТИЯМИ «ОТЛОЖЕНО».
   DepositEvent — единственный источник для октав, стрика и сада.
   Transaction (приход/расход) — только для экрана Бюджет.

2. СТРИК БОЛЬШЕ НЕ ОБНУЛЯЕТСЯ.
   Пропуск → дерево «увядает», а не умирает.
   Два стрика: АКТИВНЫЙ и ЛУЧШИЙ. Сгорает только активный,
   частично, через грейс-период.

3. ВСЯ МАГИЯ ВЫЧИСЛЯЕТСЯ, А НЕ ХРАНИТСЯ.
   Октавы, стрик, сад года, прогноз — чистые функции от DepositEvent[].
   Храним только факты, деривируем всё остальное.

4. STORAGE — ЗА ИНТЕРФЕЙСОМ.
   core не знает про localStorage. Только StorageAdapter.

5. СХЕМА ВЕРСИОНИРУЕТСЯ С ПЕРВОГО БАЙТА.
   Любой экспорт/импорт/бэкап — через KGExportSchema с schemaVersion.

________________________________________
🧬 МОДЕЛЬ ДАННЫХ (TypeScript)

// src/types/common.ts
export type Currency = 'RUB' | 'USD' | 'EUR' | (string & {});
export interface Money { minorUnits: number; currency: Currency; }
// minorUnits: integer. 15000 = 150.00 ₽. Никогда float для денег!
export type ISODate = string; // 'YYYY-MM-DD' — нет timezone-адов

// src/types/deposit.ts
export type DepositSource =
  | 'auto10' | 'manual' | 'fixedDaily' | 'goal' | 'imported';

export interface DepositEvent {
  id: string;             // crypto.randomUUID()
  date: ISODate;
  amount: Money;
  source: DepositSource;
  goalId: string | null;  // null = в общий сад
  note: string;
}

// src/types/transaction.ts
export type TxType = 'income' | 'expense';
export interface Transaction {
  id: string; date: ISODate; type: TxType;
  amount: Money; categoryId: string; note: string;
}
export interface Category { id: string; name: string; kind: TxType; icon: string; }

// src/types/goal.ts
export interface Goal {
  id: string; title: string; targetAmount: Money;
  targetDate: ISODate | null; createdAt: ISODate; archived: boolean;
}

// src/types/settings.ts
export interface SavingsSettings {
  mode: 'percent' | 'fixed';
  percent: number;              // 10 по умолчанию
  fixedAmount: Money | null;
  remindDaily: boolean;
}
export interface AppSettings {
  baseCurrency: Currency;
  savings: SavingsSettings;
  theme: 'light' | 'dark' | 'system';
  language: 'ru';
  calmMode: boolean;
}

// src/types/state.ts
export const CURRENT_SCHEMA_VERSION = 1;
export interface KGState {
  schemaVersion: number;
  createdAt: string;
  settings: AppSettings;
  categories: Category[];
  transactions: Transaction[];
  deposits: DepositEvent[];   // ← сад, октавы, стрик — ВСЁ отсюда
  goals: Goal[];
}

// src/types/export.ts
export interface KGExportSchema {
  schemaVersion: number;
  app: 'kapital-garden';
  exportedAt: string;
  state: KGState;
}
// PHASE 4: ZITransferPacket — синк с «Золотым Инвестором»

________________________________________
🔥 ПЕРЕРАБОТАННАЯ МЕХАНИКА СТРИКА (v1.1)

ПРИНЦИП: Стрик — не наказание, а температура.

ДВА СТРИКА:
• АКТИВНЫЙ (current) — сколько дней подряд от текущего дня назад.
  Может увядать. Показываем в огненном круге.
• ЛУЧШИЙ (best) — максимум за всю историю. НЕ СГОРАЕТ НИКОГДА.
  Показываем мелко: «Лучший: 🔥 100».

ГРЕЙС-МЕХАНИКА (правило увядания):
1 день пропуска  → стрик −1, дерево слегка увядает
2 дня пропуска   → стрик −3
3 дня пропуска   → стрик −7
4+ дней пропуска → активный стрик = 0. НО круг не гаснет:
                   «Сад дремлет. Он помнит тебя.» (тёплое ядро, vitality 0.15)

ВОЗРОЖДЕНИЕ:
Любое новое отложение после пропуска →
• активный стрик = max(уцелевший, 1)
• «Дерево выпустило новый росток. Сад продолжается.»
• ЛУЧШИЙ обновляется, если активный его превысил.

ПОЧЕМУ ТАК:
• «Лучший 100» не даёт стереть 100 дней дисциплины из-за болезни.
• Увядание вместо смерти = уважение к принципу №10 «нет оценок».
• Возрождение = подтверждение принципа №5 «постоянство важнее рывка».

РЕАЛИЗАЦИЯ: src/core/streak.ts — computeStreak(deposits, today): StreakInfo
{ active, best, vitality: 0..1, status: 'growing'|'wilting'|'dormant', lastDepositDate }
Плюс isRevival(prev, next) — для экрана возрождения.

________________________________________
🧪 ТЕСТЫ — ОБЯЗАТЕЛЬНЫ ДЛЯ CORE

1. streak.test.ts   — 30 дней / пропуск 1 день / пропуск 5 дней / возрождение
2. octaves.test.ts  — границы всех 8 октав (14→15, 30→31, 90→91, 180→181, 365→366)
3. forecast.test.ts — r=0 линейно, r>0 больше вложенного, integer-вывод
4. money.test.ts    — minorUnits integer, сложение, formatMoney
5. migrations.test.ts — v1 проходит, мусор → чистое начальное состояние

ПРАВИЛО: ноль логики роста/денег без теста. Это и есть «наследие».

________________________________________
📌 ОБНОВЛЁННОЕ ПРАВИЛО АРХИТЕКТУРЫ

core/ НИКОГДА не импортирует из components/, screens/ И:
• не импортирует localStorage напрямую (только StorageAdapter)
• не содержит строк текста, видимых пользователем (только data/strings)
• не денормализует: вычисляемые величины = чистые функции от состояния
• не использует Date-объекты для бизнес-логики (только ISODate)
• не использует float для денег (только minorUnits: integer)

________________________________________
💚 ВЫВОД v1.1

Данные теперь — факты, а не интерпретация.
Сад растёт из семян, стрик не мстит,
схема переживёт любые фичи.

«Сад дремлет. Он помнит тебя.»
