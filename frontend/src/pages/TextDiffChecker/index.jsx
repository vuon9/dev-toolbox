import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../../components/ui/Button';
import { Undo2, Split, Rows, Eye, Edit3 } from 'lucide-react';
import { computeDiffResult } from './diffUtils';
import CodeEditor from '../../components/inputs/CodeEditor';

// Inline-styled components
function ToolHeader({ title, description }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 600,
          letterSpacing: '-0.025em',
          color: 'var(--foreground)',
        }}
      >
        {title}
      </h2>
      <p style={{ color: 'var(--muted-foreground)', marginTop: '4px' }}>{description}</p>
    </div>
  );
}

function ToolTextArea({ label, value, onChange, placeholder, indicator, indicatorColor }) {
  const handleCopy = () => {
    if (value) {
      navigator.clipboard.writeText(value);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </label>
          {indicator && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor:
                  indicatorColor === 'green'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : 'rgba(59, 130, 246, 0.15)',
                color: indicatorColor === 'green' ? 'var(--success)' : 'var(--primary)',
              }}
            >
              {indicator}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          title="Copy to clipboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
            padding: '6px',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '4px',
            color: value ? 'var(--muted-foreground)' : 'var(--border)',
            cursor: value ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (value) {
              e.currentTarget.style.backgroundColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--foreground)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = value ? 'var(--muted-foreground)' : 'var(--border)';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          width: '100%',
          minHeight: '400px',
          padding: '12px',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          fontSize: '14px',
          lineHeight: 1.6,
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          color: 'var(--foreground)',
          resize: 'none',
          outline: 'none',
        }}
      />
    </div>
  );
}

function ToggleGroup({ options, value, onChange, size = 'default' }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--card)',
        borderRadius: '8px',
        padding: '4px',
        border: '1px solid var(--border)',
      }}
    >
      {options.map((option) => {
        const isActive = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: size === 'sm' ? '6px 12px' : '8px 16px',
              backgroundColor: isActive ? 'var(--border)' : 'transparent',
              border: 'none',
              borderRadius: '6px',
              color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'var(--border)';
                e.currentTarget.style.color = 'var(--muted-foreground)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--muted-foreground)';
              }
            }}
          >
            {option.icon && <option.icon style={{ width: '14px', height: '14px' }} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// Process diff for split view
function processDiffForSplit(diff) {
  const left = [];
  const right = [];
  let leftLineNum = 1;
  let rightLineNum = 1;

  diff.forEach((part) => {
    const lines = part.value.split('\n').filter(
      (line, idx, arr) =>
        // Keep empty lines but remove trailing empty line
        idx < arr.length - 1 || line !== ''
    );

    if (part.added) {
      lines.forEach((line) => {
        right.push({ type: 'added', content: line, lineNum: rightLineNum++ });
        left.push({ type: 'gap', content: '', lineNum: null });
      });
    } else if (part.removed) {
      lines.forEach((line) => {
        left.push({ type: 'removed', content: line, lineNum: leftLineNum++ });
        right.push({ type: 'gap', content: '', lineNum: null });
      });
    } else {
      lines.forEach((line) => {
        left.push({ type: 'unchanged', content: line, lineNum: leftLineNum++ });
        right.push({ type: 'unchanged', content: line, lineNum: rightLineNum++ });
      });
    }
  });

  return { left, right };
}

// Process diff for unified view
function processDiffForUnified(diff) {
  const lines = [];
  let lineNum = 1;

  diff.forEach((part) => {
    const partLines = part.value
      .split('\n')
      .filter((line, idx, arr) => idx < arr.length - 1 || line !== '');

    partLines.forEach((line) => {
      if (part.added) {
        lines.push({ type: 'added', content: line, lineNum: lineNum++ });
      } else if (part.removed) {
        lines.push({ type: 'removed', content: line, lineNum: null });
      } else {
        lines.push({ type: 'unchanged', content: line, lineNum: lineNum++ });
      }
    });
  });

  return lines;
}

function DiffLine({ item, showLineNum = true }) {
  const styles = {
    unchanged: {
      backgroundColor: 'transparent',
      borderLeft: '3px solid transparent',
      color: 'var(--muted-foreground)',
    },
    added: {
      backgroundColor: 'rgba(34, 197, 94, 0.15)',
      borderLeft: '3px solid var(--success)',
      color: 'var(--success)',
    },
    removed: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderLeft: '3px solid var(--destructive)',
      color: 'var(--destructive)',
    },
    gap: {
      backgroundColor: 'rgba(39, 39, 42, 0.3)',
      borderLeft: '3px solid transparent',
      color: 'transparent',
    },
  };

  const style = styles[item.type] || styles.unchanged;
  const prefix = item.type === 'added' ? '+' : item.type === 'removed' ? '-' : ' ';
  const lineHeight = 22; // Fixed line height in pixels for alignment

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        ...style,
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
        fontSize: '13px',
        height: `${lineHeight}px`,
        paddingLeft: '8px',
      }}
    >
      {showLineNum && (
        <span
          style={{
            minWidth: '40px',
            paddingRight: '12px',
            textAlign: 'right',
            color: 'var(--muted-foreground)',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {item.lineNum || ''}
        </span>
      )}
      <span
        style={{
          minWidth: '16px',
          color: item.type === 'gap' ? 'transparent' : style.color,
          opacity: 0.6,
        }}
      >
        {item.type === 'gap' ? '\u00A0' : prefix}
      </span>
      <span
        style={{
          color: style.color,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {item.content || (item.type === 'gap' ? '\u00A0' : '')}
      </span>
    </div>
  );
}

function DiffSplitView({ leftLines, rightLines }) {
  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const syncing = useRef(false);

  const handleScroll = (sourceRef, targetRef) => {
    if (syncing.current) return;
    syncing.current = true;
    targetRef.current.scrollTop = sourceRef.current.scrollTop;
    requestAnimationFrame(() => {
      syncing.current = false;
    });
  };

  return (
    <div
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0', flex: 1, minHeight: 0 }}
    >
      {/* Left pane - Original */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRight: 'none',
          borderRadius: '8px 0 0 8px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Original
        </div>
        <div
          ref={leftRef}
          onScroll={() => handleScroll(leftRef, rightRef)}
          style={{ flex: 1, overflow: 'auto' }}
        >
          <div style={{ padding: '0' }}>
            {leftLines.map((item, idx) => (
              <DiffLine key={idx} item={item} />
            ))}
          </div>
        </div>
      </div>

      {/* Right pane - Modified */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '0 8px 8px 0',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Modified
        </div>
        <div
          ref={rightRef}
          onScroll={() => handleScroll(rightRef, leftRef)}
          style={{ flex: 1, overflow: 'auto' }}
        >
          <div style={{ padding: '0' }}>
            {rightLines.map((item, idx) => (
              <DiffLine key={idx} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DiffUnifiedView({ lines }) {
  const stats = useMemo(() => {
    let added = 0,
      removed = 0;
    lines.forEach((line) => {
      if (line.type === 'added') added++;
      if (line.type === 'removed') removed++;
    });
    return { added, removed };
  }, [lines]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        overflow: 'hidden',
        flex: 1,
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          gap: '16px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--success)', fontWeight: 500 }}>
          +{stats.added}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--destructive)', fontWeight: 500 }}>
          -{stats.removed}
        </span>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {lines.map((item, idx) => (
          <DiffLine key={idx} item={item} showLineNum={true} />
        ))}
      </div>
    </div>
  );
}

export default function TextDiffChecker() {
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [mode, setMode] = useState('edit'); // 'edit' | 'diff'
  const [viewMode, setViewMode] = useState('split'); // 'split' | 'unified'
  const [diffMode, setDiffMode] = useState('lines'); // 'lines' | 'words' | 'chars'

  useEffect(() => {
    localStorage.setItem('diff-mode', mode);
  }, [mode]);

  const handleReset = () => {
    setOriginal('');
    setModified('');
  };

  // Compute diff
  const diffResult = useMemo(() => {
    if (!original && !modified) return null;
    return computeDiffResult(original, modified, diffMode, false);
  }, [original, modified, diffMode]);

  // Process for display
  const { leftLines, rightLines, unifiedLines } = useMemo(() => {
    if (!diffResult) return { leftLines: [], rightLines: [], unifiedLines: [] };
    const split = processDiffForSplit(diffResult);
    const unified = processDiffForUnified(diffResult);
    return { leftLines: split.left, rightLines: split.right, unifiedLines: unified };
  }, [diffResult]);

  const diffModeOptions = [
    { value: 'lines', label: 'Lines' },
    { value: 'words', label: 'Words' },
    { value: 'chars', label: 'Chars' },
  ];

  const viewModeOptions = [
    { value: 'split', label: 'Split', icon: Split },
    { value: 'unified', label: 'Unified', icon: Rows },
  ];

  const modeOptions = [
    { value: 'edit', label: 'Edit', icon: Edit3 },
    { value: 'diff', label: 'Diff', icon: Eye },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '24px',
        overflow: 'hidden',
        backgroundColor: 'var(--background)',
      }}
    >
      <ToolHeader
        title="Text Diff"
        description="Compare two pieces of text and visualize differences instantly. Supports line, word, and character-level diffs."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      {/* Controls */}
      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Diff granularity */}
          <ToggleGroup options={diffModeOptions} value={diffMode} onChange={setDiffMode} />

          {/* View mode toggle - only in diff mode */}
          {mode === 'diff' && (
            <ToggleGroup options={viewModeOptions} value={viewMode} onChange={setViewMode} />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Mode toggle */}
          <ToggleGroup options={modeOptions} value={mode} onChange={setMode} />

          <Button variant="danger" onClick={handleReset}>
            <Undo2 style={{ width: '14px', height: '14px' }} />
            Reset
          </Button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {mode === 'edit' ? (
          /* Edit mode */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              flex: 1,
              minHeight: 0,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
              >
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Original Text
                </label>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                    color: '#22c55e',
                  }}
                >
                  Base Version
                </span>
              </div>
              <CodeEditor
                value={original}
                onChange={(val) => setOriginal(val)}
                language="plaintext"
                placeholder="Paste original version here..."
                dataTestId="text-diff-original"
                ariaLabel="Original Text"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}
              >
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Modified Text
                </label>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: '#3b82f6',
                  }}
                >
                  Comparison Target
                </span>
              </div>
              <CodeEditor
                value={modified}
                onChange={(val) => setModified(val)}
                language="plaintext"
                placeholder="Paste modified version here..."
                dataTestId="text-diff-modified"
                ariaLabel="Modified Text"
              />
            </div>
          </div>
        ) : (
          /* Diff mode */
          <div style={{ flex: 1, minHeight: 0 }}>
            {viewMode === 'split' ? (
              <DiffSplitView leftLines={leftLines} rightLines={rightLines} />
            ) : (
              <DiffUnifiedView lines={unifiedLines} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
