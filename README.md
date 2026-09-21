# 🌳 Kapital Garden

> Каждая отложенная копейка — семя твоего будущего.

«Kapital Garden» — не учёт трат и не бюджет. Это сад твоего капитала:
каждая отложенная копейка — семя, каждая неделя — росток, каждый год — лес.

## Быстрый старт

```bash
npm install
npm run dev      # http://localhost:5173/kapital-garden/
npm test         # vitest — 5 тестовых файлов ядра
npm run build    # dist/ → GitHub Pages
```

## Статус: PHASE 0 ✅ (фундамент)

- ✅ Типы данных (DepositEvent — единый источник сада)
- ✅ Деньги как integer minorUnits (никакого float-дрейга)
- ✅ ISODate 'YYYY-MM-DD' (нет timezone-адов)
- ✅ StorageAdapter (core не знает про localStorage)
- ✅ Миграции + schemaVersion
- ✅ Стрик v1.1: active + best, грейс-увядание, возрождение
- ✅ 8 октав роста, сад года (12 деревьев), прогноз роста
- ✅ 5 тестовых файлов ядра (vitest)
- ✅ PWA-заготовка, токены темы (светлая/тёмная)

## Структура

```
src/
├── types/        # common, deposit, transaction, goal, settings, state, export
├── core/         # storage, migrations, factories, dates, money,
│                 # streak, octaves, garden, forecast + __tests__/
├── data/         # defaultCategories, strings
├── styles/       # theme.css (дизайн-токены)
├── App.tsx       # PHASE 0 shell
└── main.tsx
```

## Правила core/ (обновлено v1.1)

- НИКОГДА не импортирует из components/ и screens/
- НЕ импортирует localStorage напрямую (только StorageAdapter)
- НЕ содержит строк текста, видимых пользователем (только data/strings)
- НЕ денормализует: вычисляемые величины = чистые функции от состояния
- НЕ использует Date-объекты для бизнес-логики (только ISODate)
- НЕ использует float для денег (только minorUnits: integer)

## Дальше — PHASE 1

Экраны: GardenScreen, DepositsScreen, BudgetScreen, GoalsScreen, SettingsScreen.
Подробности — в docs/SARKOFAG-v1.1.md
