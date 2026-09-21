/**
 * ПРОГНОЗ РОСТА. Храним параметры, а не числа —
 * ставка может измениться, прогноз пересчитается честно.
 * Ежемесячная капитализация, вывод — integer minorUnits.
 */
export interface ForecastPoint {
  year: number;
  months: number;
  totalMinorUnits: number;
  investedMinorUnits: number;
}

export function forecastGrowth(
  monthlyMinorUnits: number,
  annualRatePct: number,
  years: number,
): ForecastPoint[] {
  const months = years * 12;
  const r = annualRatePct / 100 / 12;
  const out: ForecastPoint[] = [];
  let total = 0;
  for (let m = 1; m <= months; m++) {
    total = (total + monthlyMinorUnits) * (1 + r);
    if (m % 12 === 0) {
      out.push({
        year: m / 12,
        months: m,
        totalMinorUnits: Math.round(total),
        investedMinorUnits: monthlyMinorUnits * m,
      });
    }
  }
  return out;
}
