import React from 'react';

const COPY_FEEDBACK_DURATION = 1500;

export default function MultiHashOutput({ value, error }) {
  const [copiedIndex, setCopiedIndex] = React.useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), COPY_FEEDBACK_DURATION);
  };

  if (error) {
    return <div style={{ color: '#ef4444', padding: '12px', fontSize: '13px' }}>{error}</div>;
  }

  let data;
  try {
    data = typeof value === 'string' ? JSON.parse(value) : value;
  } catch {
    return (
      <div style={{ color: 'var(--muted-foreground)', padding: '12px', fontSize: '13px' }}>
        {value}
      </div>
    );
  }

  if (!data || typeof data !== 'object') {
    return (
      <div style={{ color: 'var(--muted-foreground)', padding: '12px', fontSize: '13px' }}>
        No hash results
      </div>
    );
  }

  const entries = Object.entries(data);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([key, val], idx) => (
        <div
          key={key}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {key}
            </span>
            <button
              onClick={() => handleCopy(val, idx)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor: copiedIndex === idx ? 'rgba(34, 197, 94, 0.15)' : 'var(--muted)',
                color: copiedIndex === idx ? '#22c55e' : 'var(--muted-foreground)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {copiedIndex === idx ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div
            style={{
              fontSize: '12px',
              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              color: 'var(--foreground)',
              wordBreak: 'break-all',
            }}
          >
            {val}
          </div>
        </div>
      ))}
    </div>
  );
}
