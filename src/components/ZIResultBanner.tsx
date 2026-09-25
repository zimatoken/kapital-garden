// src/components/ZIResultBanner.tsx
//
// Баннер «ЗИ принял X ₽» — появляется в KG, когда пользователь вернулся
// из Золотого Инвестора после «Принять» / «Позже».

import { useEffect, useState } from 'react';
import {
  loadFreshZIResult,
  clearZIResult,
  formatZIMoney,
  type KGZIResult,
} from '../core/bridgeFromZI';

export function ZIResultBanner() {
  const [result, setResult] = useState<KGZIResult | null>(null);

  // Читаем при монтировании + при возврате на вкладку (focus).
  useEffect(() => {
    const read = () => setResult(loadFreshZIResult());

    read();

    const onFocus = () => read();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') read();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  if (!result) return null;

  const amount = formatZIMoney(result.amountMinor, result.currency);

  // Текст зависит от статуса
  const text = (() => {
    if (result.status === 'accepted') {
      return (
        <>
          ✅ <strong>Золотой Инвестор</strong> принял{' '}
          <strong style={{ color: 'var(--success)' }}>{amount}</strong>. Готово к распределению.
        </>
      );
    }
    if (result.status === 'dismissed') {
      return (
        <>
          ⏸ <strong>Золотой Инвестор</strong> отложил{' '}
          <strong>{amount}</strong>. Можно вернуться позже.
        </>
      );
    }
    if (result.status === 'invested') {
      const label =
        result.action === 'ofz' ? 'ОФЗ'
        : result.action === 'gold' ? 'золото'
        : result.action === 'deposit' ? 'вклад'
        : 'инструмент';
      return (
        <>
          🎉 <strong>Золотой Инвестор</strong> вложил{' '}
          <strong style={{ color: 'var(--success)' }}>{amount}</strong> в {label}.
        </>
      );
    }
    return null;
  })();

  const borderColor =
    result.status === 'invested' || result.status === 'accepted'
      ? 'var(--success)'
      : 'var(--warning)';

  const bgColor =
    result.status === 'invested' || result.status === 'accepted'
      ? 'rgba(34,197,94,0.08)'
      : 'rgba(234,179,8,0.08)';

  return (
    <div
      style={{
        marginBottom: '1rem',
        padding: '0.85rem 1rem',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        fontSize: 13,
        lineHeight: 1.5,
        color: 'var(--text)',
      }}
    >
      <div style={{ flex: 1 }}>{text}</div>
      <button
        onClick={() => {
          clearZIResult();
          setResult(null);
        }}
        aria-label="Закрыть"
        style={{
          padding: '4px 8px',
          background: 'transparent',
          color: 'var(--subtext)',
          border: 'none',
          cursor: 'pointer',
          fontSize: 16,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}