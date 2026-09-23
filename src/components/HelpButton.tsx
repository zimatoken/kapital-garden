// src/components/HelpButton.tsx

interface Props {
  onClick: () => void;
  title?: string;
}

export function HelpButton({ onClick, title = 'Инструкция' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={title}
      title={title}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        background: 'var(--card-bg-soft)',
        color: 'var(--text)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        cursor: 'pointer',
        fontSize: 16,
        fontWeight: 700,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--success)';
        e.currentTarget.style.color = 'var(--success)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text)';
      }}
    >
      ?
    </button>
  );
}