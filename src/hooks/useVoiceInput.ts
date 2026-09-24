// src/hooks/useVoiceInput.ts

import { useEffect, useRef, useState } from 'react';

/**
 * Web Speech API — хук для голосового ввода.
 *
 * Работает в Chrome (Android/Desktop) и Safari (iOS 14.5+).
 * Если не поддерживается — возвращает `supported: false`.
 */

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
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface UseVoiceInputOptions {
  lang?: string;
  onResult?: (transcript: string) => void;
}

export function useVoiceInput(options: UseVoiceInputOptions = {}) {
  const { lang = 'ru-RU', onResult } = options;

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
      const text = event.results[0]?.[0]?.transcript ?? '';
      setTranscript(text);
      onResult?.(text);
    };

    recognition.onerror = (event) => {
      const map: Record<string, string> = {
        'no-speech': 'Ничего не услышал. Попробуй снова.',
        'audio-capture': 'Микрофон недоступен.',
        'not-allowed': 'Разреши доступ к микрофону в настройках браузера.',
        'network': 'Нет соединения для распознавания.',
        'aborted': '',
      };
      const message = map[event.error] ?? 'Ошибка распознавания.';
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
  }, [lang, onResult]);

  const start = () => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript('');
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      // Уже запущено — игнорируем
      console.warn('[voice]', e);
    }
  };

  const stop = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setListening(false);
  };

  return { supported, listening, transcript, error, start, stop };
}