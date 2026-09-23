// src/components/ThemeApplier.tsx

import { useTheme } from '../hooks/useTheme';

/**
 * Невидимый компонент — просто применяет тему из настроек.
 * Рендерится один раз на верхнем уровне приложения.
 */
export function ThemeApplier() {
  useTheme();
  return null;
}