// src/hooks/useTheme.ts

import { useEffect } from 'react';
import { useStoreState } from './useStore';

/**
 * Применяет тему к <html data-theme>.
 * 'system' — слушает медиа-запрос prefers-color-scheme.
 */
export function useTheme(): void {
  const theme = useStoreState().settings.theme;

  useEffect(() => {
    const root = document.documentElement;

    const apply = (t: 'light' | 'dark') => {
      root.setAttribute('data-theme', t);
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');

      const onChange = (e: MediaQueryListEvent) => {
        apply(e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', onChange);
      return () => mq.removeEventListener('change', onChange);
    } else {
      apply(theme);
    }
  }, [theme]);
}