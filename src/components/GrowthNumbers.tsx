// src/components/GrowthNumbers.tsx

import { formatMoney } from '../core/money';
import { STRINGS } from '../data/strings';

interface GrowthNumbersProps {
  /** Средний дневной темп в minorUnits. */
  dailyAvgMinor: number;
  /** Сколько дней с первого отложения. */
  daysActive: number;
}

const MIN_DAYS_FOR_FORECAST = 7;

/**
 * Числа, которые мотивируют.
 *
 * Если данных < 7 дней — показываем только «Сегодня»,
 * без экстраполяции на год и 10 лет.
 */
export function GrowthNumbers({ dailyAvgMinor, daysActive }: GrowthNumbersProps) {
  if (dailyAvgMinor <= 0) return null;

  const canForecast = daysActive >= MIN_DAYS_FOR_FORECAST;

  // Если мало данных — только одна цифра
  if (!canForecast) {
    return (
      <div className="growth-numbers">
        <h2>{STRINGS.growthTitle}</h2>
        <p className="muted">{STRINGS.growthSubtitleEarly}</p>
        <div className="growth-grid growth-grid-single">
          <div className="growth-item">
            <div className="growth-label">{STRINGS.growthToday}</div>
            <div className="growth-value">
              {formatMoney({ minorUnits: dailyAvgMinor, currency: 'RUB' })}
            </div>
          </div>
        </div>
        <p className="growth-note">{STRINGS.growthNoteEarly(daysActive)}</p>
      </div>
    );
  }

  // Полная картина
  const windows = [
    { label: STRINGS.growthToday, days: 1 },
    { label: STRINGS.growthMonth, days: 30 },
    { label: STRINGS.growthYear, days: 365 },
    { label: STRINGS.growth10Years, days: 3650 },
  ];

  return (
    <div className="growth-numbers">
      <h2>{STRINGS.growthTitle}</h2>
      <p className="muted">{STRINGS.growthSubtitle}</p>

      <div className="growth-grid">
        {windows.map((w) => (
          <div key={w.label} className="growth-item">
            <div className="growth-label">{w.label}</div>
            <div className="growth-value">
              {formatMoney({
                minorUnits: dailyAvgMinor * w.days,
                currency: 'RUB',
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="growth-note">{STRINGS.growthNote}</p>
    </div>
  );
}