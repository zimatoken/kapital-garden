// src/core/voiceParser.ts

/**
 * Парсинг голосовой фразы в сумму + заметку.
 *
 * Примеры:
 *   «заправка 2000»               → { amount: 2000, note: 'заправка' }
 *   «обед 450 рублей»             → { amount: 450, note: 'обед' }
 *   «одна тысяча рублей»          → { amount: 1000, note: '' }
 *   «1 тысяча рублей»             → { amount: 1000, note: '' }
 *   «заправка авто одна тысяча»   → { amount: 1000, note: 'заправка авто' }
 *   «две тысячи пятьсот»          → { amount: 2500, note: '' }
 *   «потратил 350 на кино»        → { amount: 350, note: 'потратил на кино' }
 *
 * Логика:
 * 1. Ищем арабские цифры. Если после них «тысяча» / «миллион» — умножаем.
 * 2. Иначе — ищем слова-числа.
 * 3. Первое найденное = сумма. Остальное = заметка.
 */

export interface ParsedVoice {
  amountMinor: number;      // сумма в копейках (0, если не нашли)
  note: string;             // очищенный текст
  raw: string;              // исходная фраза
}

/** Слова-числа: «сто», «двести», «тысяча» и т.д. */
const WORD_NUMBERS: Record<string, number> = {
  'ноль': 0,
  'один': 1, 'одна': 1, 'одно': 1,
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

/** Слова-множители. */
const MULTIPLIERS: Record<string, number> = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000,
  'миллион': 1000000, 'миллиона': 1000000, 'миллионов': 1000000,
};

/** Слова, которые убираем из заметки. */
const NOISE_WORDS = [
  'рублей', 'рубля', 'рубль', 'руб', 'р', '₽',
  'тысяча', 'тысячи', 'тысяч', 'миллион', 'миллиона', 'миллионов',
];

function cleanWord(w: string): string {
  return w.toLowerCase().replace(/[^а-яё0-9]/gi, '');
}

/**
 * Собрать число из слов-чисел: «две тысячи пятьсот» → 2500.
 * Также обрабатывает «1 тысяча» (арабская цифра + слово).
 */
function parseWordsNumber(text: string): { value: number; fromIndex: number; toIndex: number } | null {
  const words = text.toLowerCase().split(/\s+/);
  let result = 0;
  let current = 0;
  let hasAny = false;
  let firstIdx = -1;
  let lastIdx = -1;

  for (let i = 0; i < words.length; i++) {
    const clean = cleanWord(words[i]);
    const num = WORD_NUMBERS[clean];

    if (num === undefined) continue;

    if (firstIdx === -1) firstIdx = i;
    lastIdx = i;
    hasAny = true;

    if (num >= 1000) {
      current = (current || 1) * num;
      result += current;
      current = 0;
    } else {
      current += num;
    }
  }

  if (!hasAny) return null;
  return { value: result + current, fromIndex: firstIdx, toIndex: lastIdx };
}

/**
 * Парсит фразу. Возвращает amount (в minorUnits) и очищенную заметку.
 */
export function parseVoicePhrase(raw: string): ParsedVoice {
  const trimmed = raw.trim();
  const words = trimmed.split(/\s+/);

  // ─── 1. Арабская цифра, возможно + множитель ───
  // Ищем «1500», «1 500», «1.5», а также «1 тысяча», «2 миллиона».
  const arabicRegex = /(\d[\d\s.,]*)/;
  const arabicMatch = trimmed.match(arabicRegex);

  if (arabicMatch) {
    const digitsStr = arabicMatch[1].replace(/\s/g, '').replace(',', '.');
    const baseValue = parseFloat(digitsStr);

    if (!isNaN(baseValue) && baseValue > 0) {
      // Смотрим слово сразу после цифры — вдруг это множитель
      const afterDigitsIdx = trimmed.indexOf(arabicMatch[1]) + arabicMatch[1].length;
      const afterText = trimmed.slice(afterDigitsIdx).trim();
      const nextWord = afterText.split(/\s+/)[0] ?? '';
      const nextWordClean = cleanWord(nextWord);
      const multiplier = MULTIPLIERS[nextWordClean];

      let finalValue = baseValue;
      let note = trimmed;

      if (multiplier) {
        finalValue = baseValue * multiplier;
        // Убираем из заметки и цифру, и слово-множитель
        note = note.replace(arabicMatch[1], ' ');
        // Убираем первое вхождение слова-множителя
        const multRegex = new RegExp(`\\b${nextWord}\\b`, 'i');
        note = note.replace(multRegex, ' ');
      } else {
        // Обычное число без множителя
        note = note.replace(arabicMatch[1], ' ');
      }

      // Убираем шумовые слова
      note = removeNoiseWords(note);

      return {
        amountMinor: Math.round(finalValue * 100),
        note: note.trim(),
        raw: trimmed,
      };
    }
  }

  // ─── 2. Слова-числа ───
  const wordsResult = parseWordsNumber(trimmed);
  if (wordsResult && wordsResult.value > 0) {
    // Убираем из текста слова, которые являются числами
    const note = words
      .filter((w) => {
        const clean = cleanWord(w);
        // Убираем слова-числа и слова-множители
        return WORD_NUMBERS[clean] === undefined;
      })
      .join(' ');

    return {
      amountMinor: Math.round(wordsResult.value * 100),
      note: removeNoiseWords(note).trim(),
      raw: trimmed,
    };
  }

  // ─── 3. Ничего не нашли — вся фраза в заметку ───
  return { amountMinor: 0, note: trimmed, raw: trimmed };
}

/**
 * Убирает шумовые слова (рубли, тысяч и т.д.).
 */
function removeNoiseWords(text: string): string {
  let result = text;
  for (const w of NOISE_WORDS) {
    const regex = new RegExp(`\\b${w}\\b\\.?`, 'gi');
    result = result.replace(regex, ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

/**
 * Форматирует число в строку для поля ввода.
 */
export function formatVoiceAmount(amountMinor: number): string {
  return (amountMinor / 100).toString().replace('.', ',');
}

// ВРЕМЕННЫЙ ТЕСТ — удалить после проверки
if (typeof window !== 'undefined') {
  (window as unknown as { testVoice: () => void }).testVoice = () => {
    const tests = [
      'обед четыреста пятьдесят рублей',
      'ремонт пятьсот рублей',
      'заправка авто одна тысяча рублей',
      '1 тысяча рублей',
      '1 000 рублей',
      '1500 рублей',
      'две тысячи пятьсот',
      'потратил 350 на кино',
    ];
    for (const t of tests) {
      const r = parseVoicePhrase(t);
      console.log(`"${t}" → ${r.amountMinor / 100} ₽ | note="${r.note}"`);
    }
  };
}