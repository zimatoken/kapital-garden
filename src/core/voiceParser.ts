// src/core/voiceParser.ts

/**
 * Парсинг голосовой фразы в сумму + заметку.
 *
 * Примеры:
 *   «заправка 2000»                 → { amount: 2000, note: 'заправка' }
 *   «обед четыреста пятьдесят»      → { amount: 450, note: 'обед' }
 *   «одна тысяча рублей»            → { amount: 1000, note: '' }
 *   «1 000 рублей»                  → { amount: 1000, note: '' }
 *   «две тысячи пятьсот»            → { amount: 2500, note: '' }
 *   «потратил 350 на кино»          → { amount: 350, note: 'потратил на кино' }
 *   «1,5 тысячи на еду»             → { amount: 1500, note: 'на еду' }
 *   «пятьдесят копеек»              → { amount: 0.5, note: '' }
 *   «двадцать-пять рублей за суши»  → { amount: 25, note: 'за суши' }
 *
 * Логика:
 * 1. Ищем арабские числа. Выбираем лучший кандидат (скоринг: рядом «рублей»/«₽»,
 *    множитель, конец фразы). Даты (25.10.2026) и телефоны (8 800 555 35 35) игнорим.
 * 2. Иначе — ищем слова-числа (включая дефисные «двадцать-пять» и «полторы»).
 *    Если чисел несколько — берём блок, за которым стоит валюта (или последний).
 * 3. Найденное = сумма. Остальное = заметка.
 *
 * ─── ВАЖНО ПРО МИКРОФОН ───
 * Этот файл работает только с ТЕКСТОМ. Запись/распознавание — снаружи:
 * - Web Speech API: recognition.lang = 'ru-RU', interimResults = true;
 *   в onresult берём final transcript и передаём сюда.
 * - MediaRecorder + серверный STT: проверить echoCancellation/noiseSuppression.
 * - Если распознаётся с ошибками («две» → «3») — это распознаватель/модель STT,
 *   здесь чинить нечего; этот модуль лишь стабилизирует числа после распознавания.
 */

export interface ParsedVoice {
  amountMinor: number;      // сумма в копейках (0, если не нашли)
  note: string;             // очищенный текст
  raw: string;              // исходная фраза
}

/** Слова-числа: «сто», «двести», «тысяча», «полторы» и т.д. */
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
  'полтора': 1.5, 'полторы': 1.5,
};

/** Слова-множители. */
const MULTIPLIERS: Record<string, number> = {
  'тысяча': 1000, 'тысячи': 1000, 'тысяч': 1000,
  'миллион': 1000000, 'миллиона': 1000000, 'миллионов': 1000000,
};

/** Слова-копейки: после них сумма делится на 100. */
const KOP_WORDS = new Set(['копейка', 'копейки', 'копеек', 'копейку', 'коп']);

/** Валюта: рядом с таким словом число почти наверняка сумма. */
const CURRENCY_WORDS = new Set(['рублей', 'рубля', 'рубль', 'руб', 'р', '₽']);

/** Слова, которые убираем из заметки (длинные первыми, чтобы «рублей» не съел «руб»). */
const NOISE_WORDS = [
  ...[...CURRENCY_WORDS].sort((a, b) => b.length - a.length),
  ...Object.keys(MULTIPLIERS),
  ...KOP_WORDS,
];

function cleanWord(w: string): string {
  return w.toLowerCase().replace(/[^а-яё0-9]/gi, '');
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Значение токена как слова-числа: «пятьсот» → 500, «двадцать-пять» → 25, иначе null. */
function tokenNumberValue(token: string): number | null {
  const low = token.toLowerCase();
  const parts = low.split(/-+/).filter(Boolean);
  if (parts.length > 1 && parts.every((p) => cleanWord(p) in WORD_NUMBERS)) {
    return parts.reduce((sum, p) => sum + WORD_NUMBERS[cleanWord(p)], 0);
  }
  const cleaned = cleanWord(low);
  return cleaned in WORD_NUMBERS ? WORD_NUMBERS[cleaned] : null;
}

/**
 * Нормализация арабского числа:
 * «1 000» → 1000, «1,5»/«1.5» → 1.5, «1,500» → 1500 (тысячный разделитель),
 * «25.10.2026» → null (дата), «8 800 555 35 35» → null (телефон, >9 цифр).
 */
function normalizeArabic(raw: string): number | null {
  if (/^\d{1,2}[./]\d{1,2}[./]\d{2,4}$/.test(raw)) return null; // дата
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length > 9) return null;               // телефон/ИНН/длинное
  let s = raw.replace(/[\s\u00a0]/g, '');

  const lastComma = s.lastIndexOf(',');
  const lastDot = s.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    // оба разделителя: последний — десятичный, другой — тысячный
    const dec = lastComma > lastDot ? ',' : '.';
    s = s.replace(dec === ',' ? /\./g : /,/g, '').replace(dec, '.');
  } else if (lastComma !== -1 || lastDot !== -1) {
    const sep = lastComma !== -1 ? ',' : '.';
    const parts = s.split(sep);
    const isDecimal = parts.length === 2 && parts[1].length <= 2;
    s = isDecimal ? parts[0] + '.' + parts[1] : parts.join('');
  }

  const v = parseFloat(s);
  return Number.isFinite(v) && v > 0 ? v : null;
}

interface ArabicCandidate {
  raw: string;
  start: number;
  end: number;
  value: number;
  score: number;
  nextRaw: string;      // слово сразу после числа (в нижнем регистре)
  nextClean: string;
  nextPos: number;      // абсолютная позиция nextRaw в тексте
}

/**
 * Все арабские числа в фразе + скоринг.
 * Цифра, приклеенная к буквам («в3часа»), игнорируется — lookbehind.
 */
function findArabicCandidates(text: string): ArabicCandidate[] {
  const re = /(?<![а-яёa-z0-9])(\d[\d\s.,]*\d|\d)(?![\d.,])/g;
  const out: ArabicCandidate[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const value = normalizeArabic(m[1]);
    if (value === null) continue;
    const rest = text.slice(m.index + m[1].length);
    const m2 = /^\s*(\S+)/.exec(rest);
    const nextRaw = m2 ? m2[1].toLowerCase() : '';
    const nextClean = cleanWord(nextRaw);
    let score = 0;
    if (nextClean in MULTIPLIERS) score += 1;
    if (KOP_WORDS.has(nextClean) || KOP_WORDS.has(nextRaw)) score += 2;
    if (CURRENCY_WORDS.has(nextClean) || CURRENCY_WORDS.has(nextRaw)) score += 2;
    if (!rest.trim()) score += 1;
    out.push({
      raw: m[1],
      start: m.index,
      end: m.index + m[1].length,
      value,
      score,
      nextRaw,
      nextClean,
      nextPos: m.index + m[1].length + (m2 ? m2[0].length - m2[1].length : 0),
    });
  }
  return out;
}

/**
 * Убирает шумовые слова (рубли, копейки, тысяч и т.д.).
 * Lookaround вместо \b, потому что «₽» — не word-символ.
 */
function removeNoiseWords(text: string): string {
  let result = text;
  for (const w of NOISE_WORDS) {
    const regex = new RegExp(`(?<![а-яё0-9])${escapeRegExp(w)}(?![а-яё0-9])\\.?`, 'gi');
    result = result.replace(regex, ' ');
  }
  return result.replace(/\s+/g, ' ').trim();
}

interface WordRun {
  from: number;
  to: number;           // exclusive
  value: number;
  score: number;
  isKopecks: boolean;
}

/**
 * Собирает «две тысячи пятьсот» → 2500 из смежных слов-чисел.
 * Если чисел несколько («в три часа на пятьсот рублей») — берёт блок,
 * за которым идёт валюта (или последний блок).
 */
function parseWordsNumber(text: string): { amount: number; note: string } | null {
  const tokens = text.split(/[\s\u00a0]+/).filter(Boolean);
  const values = tokens.map(tokenNumberValue);

  const runs: WordRun[] = [];
  let i = 0;
  while (i < tokens.length) {
    if (values[i] === null) { i++; continue; }
    let j = i;
    let current = 0;
    let result = 0;
    while (j < tokens.length && values[j] !== null) {
      const n = values[j] as number;
      if (n >= 1000) {
        current = (current || 1) * n;
        result += current;
        current = 0;
      } else {
        current += n;
      }
      j++;
    }
    let score = 0;
    let isKopecks = false;
    if (j < tokens.length) {
      const nr = tokens[j].toLowerCase();
      const nc = cleanWord(nr);
      if (CURRENCY_WORDS.has(nc) || CURRENCY_WORDS.has(nr)) score += 2;
      if (KOP_WORDS.has(nc) || KOP_WORDS.has(nr)) { score += 2; isKopecks = true; }
    } else {
      score += 1;
    }
    runs.push({ from: i, to: j, value: result + current, score, isKopecks });
    i = j;
  }

  if (runs.length === 0) return null;
  const best = runs.reduce((a, b) => (b.score > a.score ? b : a)); // tie → первый
  if (best.value <= 0) return null;

  const amount = best.isKopecks ? best.value / 100 : best.value;
  const kept = tokens.filter((_, idx) => {
    if (idx >= best.from && idx < best.to) return false;
    if (best.isKopecks && idx === best.to) return false; // слово «копеек»
    return true;
  });

  return { amount, note: removeNoiseWords(kept.join(' ')) };
}

/**
 * Парсит фразу. Возвращает amount (в minorUnits) и очищенную заметку.
 */
export function parseVoicePhrase(raw: string): ParsedVoice {
  const trimmed = raw.trim();
  if (!trimmed) return { amountMinor: 0, note: '', raw };

  // ─── 1. Арабские цифры (с выбором лучшего кандидата) ───
  const candidates = findArabicCandidates(trimmed);
  if (candidates.length > 0) {
    const best = candidates.reduce((a, b) => (b.score > a.score ? b : a));
    let value = best.value;
    let note = trimmed.slice(0, best.start) + ' ' + trimmed.slice(best.end);

    // позиция слова после числа сдвинулась после вырезания числа
    const shift = best.nextPos - (best.end - best.start) + 1;
    const cutWord = () => {
      note = note.slice(0, shift) + ' ' + note.slice(shift + best.nextRaw.length);
    };

    if (best.nextClean in MULTIPLIERS) {
      value *= MULTIPLIERS[best.nextClean]; // «1 тысяча», «1,5 тысячи»
      cutWord();
    } else if (KOP_WORDS.has(best.nextClean) || KOP_WORDS.has(best.nextRaw)) {
      value /= 100;                          // «50 копеек»
      cutWord();
    }

    return {
      amountMinor: Math.round(value * 100),
      note: removeNoiseWords(note),
      raw: trimmed,
    };
  }

  // ─── 2. Слова-числа ───
  const wordsResult = parseWordsNumber(trimmed);
  if (wordsResult) {
    return {
      amountMinor: Math.round(wordsResult.amount * 100),
      note: wordsResult.note,
      raw: trimmed,
    };
  }

  // ─── 3. Ничего не нашли — вся фраза в заметку ───
  return { amountMinor: 0, note: trimmed, raw: trimmed };
}

/**
 * Форматирует число в строку для поля ввода.
 */
export function formatVoiceAmount(amountMinor: number): string {
  if (!Number.isFinite(amountMinor)) return '';
  return (amountMinor / 100).toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

/**
 * Самотест. В dev-консоли: console.table(runVoiceParserSelfTests())
 */
export function runVoiceParserSelfTests(): { input: string; amount: number; note: string }[] {
  const cases = [
    'обед четыреста пятьдесят рублей',
    'ремонт пятьсот рублей',
    'заправка авто одна тысяча рублей',
    '1 тысяча рублей',
    '1 000 рублей',
    '1500 рублей',
    'две тысячи пятьсот',
    'потратил 350 на кино',
    '1,5 тысячи на еду',
    'пятьдесят копеек',
    '50 копеек',
    'полторы тысячи на продукты',
    'заправка в 3 часа дня на 500 рублей',
    'заправка в три часа дня на пятьсот рублей',
    'такси двести двадцать рублей',
    'потратил 2 500 на еду',
    'телефон 8 800 555 35 35',
    'в3часа потратил 200',
    'двадцать-пять рублей за суши',
  ];
  return cases.map((input) => {
    const r = parseVoicePhrase(input);
    return { input, amount: r.amountMinor / 100, note: r.note };
  });
}

// Dev-автотест: в консоли браузера → (window as any).__VOICE_DEBUG__ = true, затем любой ввод.
if (typeof window !== 'undefined' && (window as unknown as { __VOICE_DEBUG__?: boolean }).__VOICE_DEBUG__) {
  console.table(runVoiceParserSelfTests());
}