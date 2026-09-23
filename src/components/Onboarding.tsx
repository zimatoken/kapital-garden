// src/components/Onboarding.tsx

import { useState } from 'react';

const STORAGE_KEY = 'kg.onboarding.done';

interface Props {
  onFinish: () => void;
}

const SLIDES = [
  {
    icon: '🌳',
    title: 'Это твой сад',
    body: 'Каждая отложенная копейка — семя. Со временем из семян вырастает дерево, а из деревьев — целый лес капитала.',
  },
  {
    icon: '🌱',
    title: 'Откладывай 10%',
    body: 'С каждого дохода приложение предложит отложить 10%. Не бойся ошибиться — можно менять в любой момент.',
  },
  {
    icon: '🔥',
    title: 'Смотри, как растёт',
    body: 'Стрик, октавы, сад года — всё покажет твой прогресс. Не оценивает, не советует. Просто показывает.',
  },
];

export function Onboarding({ onFinish }: Props) {
  const [step, setStep] = useState(0);

  const slide = SLIDES[step];
  const isLast = step === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, '1');
      onFinish();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    onFinish();
  };

  return (
    <div className="onboarding-backdrop">
      <div className="onboarding">
        <button className="onboarding-skip" onClick={handleSkip}>
          Пропустить
        </button>

        <div className="onboarding-slide">
          <div className="onboarding-icon">{slide.icon}</div>
          <h1 className="onboarding-title">{slide.title}</h1>
          <p className="onboarding-body">{slide.body}</p>
        </div>

        <div className="onboarding-dots">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className={`onboarding-dot ${i === step ? 'onboarding-dot-active' : ''}`}
            />
          ))}
        </div>

        <button className="onboarding-next" onClick={handleNext}>
          {isLast ? '🌱 Посадить первое семя' : 'Далее'}
        </button>
      </div>
    </div>
  );
}

export function shouldShowOnboarding(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== '1';
}