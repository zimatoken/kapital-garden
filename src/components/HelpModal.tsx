// src/components/HelpModal.tsx

import { useEffect, useMemo, useState } from 'react';
import { HELP_CONTENT, type HelpBlock } from '../data/helpContent';
import { useIsMobile } from '../hooks/useIsMobile';
import { openPrintableInstructions, downloadInstructionsHTML } from '../core/helpPdf';

interface Props {
  open: boolean;
  onClose: () => void;
  initialSectionId?: string;
}

export function HelpModal({ open, onClose, initialSectionId = 'general' }: Props) {
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string>(initialSectionId);

  useEffect(() => {
    if (open) {
      setActiveId(initialSectionId);
      setQuery('');
    }
  }, [open, initialSectionId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return HELP_CONTENT;
    const q = query.toLowerCase();
    return HELP_CONTENT.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q) ||
        s.blocks.some((b) => blockToText(b).toLowerCase().includes(q)),
    );
  }, [query]);

  const active = HELP_CONTENT.find((s) => s.id === activeId) || HELP_CONTENT[0];

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Инструкция"
      className="help-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 1000,
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        padding: isMobile ? '0.5rem' : '1rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 900,
          height: isMobile ? 'calc(100dvh - 1rem)' : 'min(90vh, 700px)',
          background: 'var(--card-bg)',
          color: 'var(--text)',
          borderRadius: isMobile ? 12 : 16,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Заголовок */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.25rem',
            borderBottom: '1px solid var(--border)',
            background: 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>📘</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Инструкция</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                {isMobile ? 'Kapital Garden' : 'Kapital Garden — курс садовника'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              onClick={downloadInstructionsHTML}
              title="Скачать HTML-инструкцию"
              style={{
                padding: '0.4rem 0.7rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              📥 <span>{isMobile ? 'HTML' : 'Скачать'}</span>
            </button>
            <button
              onClick={openPrintableInstructions}
              title="Печать / Сохранить как PDF"
              style={{
                padding: '0.4rem 0.7rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              🖨 <span>{isMobile ? 'PDF' : 'Печать PDF'}</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              style={{
                padding: '0.4rem 0.6rem',
                background: 'transparent',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 16,
                fontFamily: 'inherit',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Тело */}
        {isMobile ? (
          /* Мобильная версия */
          <>
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="🔍 Поиск..."
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  background: 'var(--card-bg-soft)',
                  color: 'var(--text)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '0.5rem',
                overflowX: 'auto',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
                background: 'var(--card-bg-soft)',
                scrollbarWidth: 'none',
              }}
            >
              {filtered.map((s) => {
                const isActive = s.id === active.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveId(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid ' + (isActive ? 'var(--success)' : 'var(--border)'),
                      borderRadius: 20,
                      background: isActive ? 'rgba(34,197,94,0.15)' : 'var(--card-bg)',
                      color: isActive ? 'var(--success)' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      fontFamily: 'inherit',
                    }}
                  >
                    <span style={{ fontSize: 15 }}>{s.icon}</span>
                    <span>{s.title}</span>
                  </button>
                );
              })}
            </div>

            <main style={{ flex: 1, overflowY: 'auto', padding: '1rem', minHeight: 0 }}>
              <SectionContent active={active} onGo={setActiveId} />
            </main>
          </>
        ) : (
          /* Десктопная версия */
          <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
            <aside
              style={{
                width: 240,
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                background: 'var(--card-bg-soft)',
                flexShrink: 0,
              }}
            >
              <div style={{ padding: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="🔍 Поиск..."
                  style={{
                    width: '100%',
                    padding: '0.4rem 0.6rem',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    background: 'var(--card-bg)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                {filtered.map((s) => {
                  const isActive = s.id === active.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setActiveId(s.id)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '0.6rem 0.75rem',
                        border: 'none',
                        borderRadius: 8,
                        background: isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
                        color: isActive ? 'var(--success)' : 'var(--text)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        marginBottom: 2,
                        fontSize: 13,
                        fontFamily: 'inherit',
                      }}
                    >
                      <span style={{ fontSize: 18 }}>{s.icon}</span>
                      <span style={{ flex: 1, fontWeight: isActive ? 600 : 500 }}>{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem', minHeight: 0 }}>
              <SectionContent active={active} onGo={setActiveId} />
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionContent({
  active,
  onGo,
}: {
  active: typeof HELP_CONTENT[number];
  onGo: (id: string) => void;
}) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <span style={{ fontSize: 32 }}>{active.icon}</span>
        <div>
          <h2 style={{ margin: 0, color: 'var(--heading)', fontSize: 20 }}>{active.title}</h2>
          <div style={{ color: 'var(--subtext)', fontSize: 13 }}>{active.subtitle}</div>
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {active.blocks.map((block, i) => (
          <HelpBlockView key={i} block={block} />
        ))}
      </div>

      <div style={{ marginTop: 32, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <NextSectionLink currentId={active.id} onGo={onGo} />
      </div>
    </>
  );
}

function HelpBlockView({ block }: { block: HelpBlock }) {
  const base: React.CSSProperties = {
    fontSize: 14,
    lineHeight: 1.65,
    color: 'var(--text)',
  };

  if (block.type === 'paragraph') return <p style={{ ...base, margin: 0 }}>{block.text}</p>;

  if (block.type === 'list') {
    return (
      <ul style={{ ...base, paddingLeft: 20, margin: 0 }}>
        {block.items.map((it, i) => (
          <li key={i} style={{ marginBottom: 6 }}>{it}</li>
        ))}
      </ul>
    );
  }

  if (block.type === 'steps') {
    return (
      <ol style={{ ...base, paddingLeft: 20, margin: 0 }}>
        {block.items.map((it, i) => (
          <li key={i} style={{ marginBottom: 8 }}>{it}</li>
        ))}
      </ol>
    );
  }

  if (block.type === 'warning') {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        borderLeft: '4px solid #ef4444',
        background: 'rgba(239,68,68,0.08)',
        borderRadius: 8,
        ...base,
      }}>
        ⚠️ {block.text}
      </div>
    );
  }

  if (block.type === 'tip') {
    return (
      <div style={{
        padding: '0.75rem 1rem',
        borderLeft: '4px solid #22c55e',
        background: 'rgba(34,197,94,0.08)',
        borderRadius: 8,
        ...base,
      }}>
        💡 {block.text}
      </div>
    );
  }

  if (block.type === 'statusRow') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '0.75rem 1rem',
        borderLeft: `4px solid ${block.color}`,
        background: 'var(--card-bg-soft)',
        borderRadius: 8,
      }}>
        <div style={{ fontWeight: 700, fontSize: 14, minWidth: 120, color: 'var(--heading)' }}>
          {block.label}
        </div>
        <div style={{ fontSize: 13, color: 'var(--subtext)', lineHeight: 1.6 }}>
          {block.description}
        </div>
      </div>
    );
  }

  return null;
}

function NextSectionLink({
  currentId,
  onGo,
}: {
  currentId: string;
  onGo: (id: string) => void;
}) {
  const idx = HELP_CONTENT.findIndex((s) => s.id === currentId);
  const next = HELP_CONTENT[idx + 1];
  if (!next) return null;

  return (
    <button
      onClick={() => onGo(next.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '0.75rem 1rem',
        background: 'var(--card-bg-soft)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        cursor: 'pointer',
        fontSize: 13,
        color: 'var(--text)',
        gap: 8,
        fontFamily: 'inherit',
      }}
    >
      <span style={{ color: 'var(--subtext)', fontSize: 12, whiteSpace: 'nowrap' }}>
        Далее
      </span>
      <span style={{ fontWeight: 600, color: 'var(--heading)', textAlign: 'right' }}>
        {next.icon} {next.title} →
      </span>
    </button>
  );
}

function blockToText(b: HelpBlock): string {
  if (b.type === 'paragraph' || b.type === 'warning' || b.type === 'tip') return b.text;
  if (b.type === 'list' || b.type === 'steps') return b.items.join(' ');
  if (b.type === 'statusRow') return `${b.label} ${b.description}`;
  return '';
}