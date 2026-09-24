// src/components/VoiceInputButton.tsx

import { useState } from 'react';
import { useVoiceInput } from '../hooks/useVoiceInput';
import { parseVoicePhrase } from '../core/voiceParser';

interface Props {
  onResult: (amountMinor: number, note: string) => void;
}

/**
 * Кнопка голосового ввода.
 *
 * Скрыта, если браузер не поддерживает Web Speech API.
 */
export function VoiceInputButton({ onResult }: Props) {
  const [pulse, setPulse] = useState(false);

  const { supported, listening, error, start, stop } = useVoiceInput({
    onResult: (transcript) => {
      const parsed = parseVoicePhrase(transcript);
      onResult(parsed.amountMinor, parsed.note);
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
    },
  });

  if (!supported) return null;

  const handleClick = () => {
    if (listening) {
      stop();
    } else {
      start();
    }
  };

  return (
    <div className="voice-input">
      <button
        type="button"
        className={`voice-btn ${listening ? 'voice-btn-active' : ''} ${pulse ? 'voice-btn-pulse' : ''}`}
        onClick={handleClick}
        aria-label={listening ? 'Остановить запись' : 'Говорить'}
        title={listening ? 'Слушаю...' : 'Сказать: «обед 450»'}
      >
        🎤
      </button>

      {listening && (
        <div className="voice-hint">
          🎤 Говори: «обед 450» или «заправка 2000»
        </div>
      )}

      {error && !listening && (
        <div className="voice-error">⚠️ {error}</div>
      )}
    </div>
  );
}