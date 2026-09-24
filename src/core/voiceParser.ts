// src/core/voiceParser.ts

/**
 * Парсинг голосовой фразы в сумму + заметку.
 *
 * Примеры:
 *   «заправка 2000»       → { amount: 2000, note: 'заправка' }
 *   «обед 450 рублей»     → { amount: 450, note: 'обед' }
 *   «потратил 350 на кино» → { amount: 350, note: 'потратил на кино' }
 *   «две тысячи»          → { amount: 2000, note: '' }
 *
 * Логика:
 * 1. Ищем число в тексте (арабские цифры и слова).
 * 2. Первое найденное = сумма.
 * 3. Убираем слово-число из текста — остальное = заметка.
 */

export interface ParsedVoice {
  amountMinor: number;      // сумма в копейках (0, если не нашли)
  note: string;             // очищенный текст
  raw: string;              // исходная фраза
}

/** Слова-числа: «сто», «двести», «тысяча» и т.д. */
const WORD_NUMBERS: Record<string, number> = {
  'ноль': 0,
  'один': 1, 'одна': 1,
  'два': 2, 'две': 2,
  'три': 3,
  'четыре': 4,
  'пять': 5,
  'шесть': 6,
  'семь': 7,
  'восемь': 8,
  'девять': 9,
  'десять': 10,
  'одиннадцать': 11,
  'двенадцать': 12,
  'тринадцать': 13,
  'четырнадцать': 14,
  'пятнадцать': 15,
  'шестнадцать': 16,
  'семнадцать': 17,
  'восемнадцать': 18,
  'девятнадцать': 19,
  'двадцать': 20,
  'тридцать': 30,
  'сорок': 40,
  'пятьдесят': 50,
  'шестьдесят': 60,
  'семьдесят': 70,
  'восемьдесят': 80,
  'девяносто': 90,
  'сто': 100,
  'двести': 200,
  'триста': 300,
  'четыреста': 400,
  'пятьсот': 500,
  'шестьсот': 600,
  'семьсот': 700,
  'восемьсот': 800,
  'девятьсот': 900,
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000,
  'миллион': 1000000, 'миллиона': 1000000, 'миллионов': 1000000,
};

/**
 * Собрать число из слов-чисел: «две тысячи пятьсот» → 2500.
 */
function parseWordsNumber(text: string): number | null {
  const words = text.toLowerCase().split(/\s+/);
  let result = 0;
  let current = 0;
  let hasAny = false;

  for (const w of words) {
    const clean = w.replace(/[^а-яё]/gi, '');
    const num = WORD_NUMBERS[clean];

    if (num !== undefined) {
      hasAny = true;
      if (num >= 1000) {
        current = (current || 1) * num;
        result += current;
        current = 0;
      } else {
        current += num;
      }
    }
  }

  if (!hasAny) return null;
  return result + current;
}

/**
 * Парсит фразу. Возвращает amount (в minorUnits) и очищенную заметку.
 */
export function parseVoicePhrase(raw: string): ParsedVoice {
  const trimmed = raw.trim();

  // 1. Ищем арабское число: 2000, 1.5, 2 000, 450р, 300₽
  const arabicMatch = trimmed.match(/(\d[\d\s.,]*)/);
  if (arabicMatch) {
    const cleaned = arabicMatch[1].replace(/\s/g, '').replace(',', '.');
    const value = parseFloat(cleaned);
    if (!isNaN(value) && value > 0) {
      const amountMinor = Math.round(value * 100);
      const note = trimmed
        .replace(arabicMatch[1], '')
        .replace(/\s+/g, ' ')
        .replace(/\b(рублей|рубля|рубль|руб|₽|р)\b\.?/gi, '')
        .trim();

      return { amountMinor, note, raw: trimmed };
    }
  }

  // 2. Ищем число словами
  const wordsValue = parseWordsNumber(trimmed);
  if (wordsValue && wordsValue > 0) {
    const amountMinor = Math.round(wordsValue * 100);
    // Убираем слова-числа из заметки
    const noteWords = trimmed
      .split(/\s+/)
      .filter((w) => {
        const clean = w.toLowerCase().replace(/[^а-яё]/gi, '');
        return WORD_NUMBERS[clean] === undefined;
      })
      .join(' ')
      .trim();

    return { amountMinor, note: noteWords, raw: trimmed };
  }

  // 3. Ничего не нашли — вся фраза в заметку
  return { amountMinor: 0, note: trimmed, raw: trimmed };
}

/**
 * Форматирует число в строку для поля ввода.
 */
export function formatVoiceAmount(amountMinor: number): string {
  return (amountMinor / 100).toString().replace('.', ',');
}