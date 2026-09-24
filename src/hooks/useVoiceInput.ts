// src/hooks/useVoiceInput.ts

import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface UseVoiceInputOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
}

/**
 * Web Speech API — хук для голосового ввода.
 *
 * Работает в Chrome (Android/Desktop) и Safari (iOS 14.5+).
 * Если не поддерживается — возвращает `supported: false`.
 *
 * ВАЖНО: onResult хранится в ref — чтобы recognition
 * не пересоздавался на каждый рендер (иначе abort-цикл).
 */
export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { lang = 'ru-RU', onResult } = options;

  // 🔑 Стабильная ссылка на колбэк — не ломает эффект
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }

    setSupported(true);

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // 🔑 Используем resultIndex — правильный результат
      const res = event.results[event.resultIndex];
      const text = res?.[0]?.transcript ?? '';
      console.log('[voice] result:', text);
      setTranscript(text);
      onResultRef.current?.(text);
    };

    recognition.onerror = (event) => {
      console.error('[voice] error:', event.error);
      const map: Record<string, string> = {
        'no-speech': 'Ничего не услышал. Говори чётче.',
        'audio-capture': 'Микрофон недоступен.',
        'not-allowed': 'Разреши доступ к микрофону в настройках Chrome.',
        'network': 'Нет связи с сервером распознавания. Проверь интернет и открой именно Chrome.',
        'language-not-supported': 'Русский язык не поддерживается. Обнови Chrome.',
        'aborted': '',
      };
      const message = map[event.error] ?? `Ошибка: ${event.error}`;
      if (message) setError(message);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [lang]); // 🔑 ТОЛЬКО lang — recognition живёт всё время жизни хука

  const start = () => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      // Уже запущено — игнорируем
      console.warn('[voice] start:', e);
    }
  };

  const stop = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return { supported, listening, transcript, error, start, stop };
}
