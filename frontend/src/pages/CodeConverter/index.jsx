import React, { useState, useEffect, useCallback } from 'react';
import { Columns } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { codeConverterAPI } from './api/codeConverterAPI';
import CodeEditor from '../../components/inputs/CodeEditor';
import HighlightedCode from '../../components/inputs/HighlightedCode';
import EditorToggle from '../../components/inputs/EditorToggle';

const METHODS = [
  'JSON ↔ YAML',
  'JSON ↔ XML',
  'JSON ↔ CSV / TSV',
  'YAML ↔ TOML',
  'Markdown ↔ HTML',
  'Case Swapping',
  'CURL ↔ Fetch',
  'Cron ↔ Text',
  'CSV ↔ TSV',
  'Key-Value ↔ Query String',
  'Properties ↔ JSON',
  'INI ↔ JSON',
];

const TOOL_TITLE = 'Code Converter';
const TOOL_DESCRIPTION = 'Convert between data formats.';
const TOOL_KEY = 'code-converter';

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

function ToolPane({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  indicator,
  indicatorColor,
  error,
  highlightOn,
  language = 'plaintext',
  dataTestId,
}) {
  const handleCopy = () => {
    if (value) navigator.clipboard.writeText(value);
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
                color: indicatorColor === 'green' ? '#22c55e' : '#3b82f6',
              }}
            >
              {indicator}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          disabled={!value}
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
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        </button>
      </div>
      {readOnly ? (
        highlightOn ? (
          <HighlightedCode
            code={value}
            language={language}
            copyable={false}
            dataTestId={dataTestId}
            ariaLabel={label}
          />
        ) : (
          <textarea
            data-testid={dataTestId ? `${dataTestId}-content` : undefined}
            aria-label={label}
            value={value}
            readOnly
            placeholder={placeholder}
            style={{
              flex: 1,
              width: '100%',
              padding: '12px',
              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              fontSize: '14px',
              lineHeight: 1.6,
              backgroundColor: 'var(--background)',
              border: error ? '1px solid #ef4444' : '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              resize: 'none',
              outline: 'none',
            }}
          />
        )
      ) : (
        <CodeEditor
          value={value}
          onChange={(val) => onChange?.(val)}
          language={language}
          highlight={highlightOn}
          placeholder={placeholder}
          dataTestId={dataTestId}
          ariaLabel={label}
        />
      )}
    </div>
  );
}

function ToolSplitPane({ children, isVertical }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}

const STORAGE_KEY = 'code-converter-layout';

export default function CodeConverter() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [method, setMethod] = useState(METHODS[0]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isVertical, setIsVertical] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'vertical'
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, isVertical ? 'vertical' : 'horizontal');
  }, [isVertical]);

  const performConversion = useCallback(async (text, meth) => {
    if (!text) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const result = await codeConverterAPI.Convert(text, meth);
      setOutput(result);
      setError('');
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => performConversion(input, method), 300);
    return () => clearTimeout(timer);
  }, [input, method, performConversion]);

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
      <ToolHeader title={TOOL_TITLE} description={TOOL_DESCRIPTION} />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value)}
          style={{
            height: '36px',
            padding: '0 12px',
            fontSize: '13px',
            borderRadius: '6px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
            outline: 'none',
            minWidth: '240px',
          }}
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
          <Button
            variant="secondary"
            onClick={() => setIsVertical(!isVertical)}
            style={{ padding: '4px' }}
          >
            <Columns
              style={{
                width: '16px',
                height: '16px',
                transform: isVertical ? 'rotate(90deg)' : 'none',
              }}
            />
          </Button>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <ToolSplitPane isVertical={isVertical}>
          <ToolPane
            label="Input"
            value={input}
            onChange={(val) => setInput(val)}
            placeholder="Enter data to convert..."
            indicator="Source"
            indicatorColor="green"
            highlightOn={highlightOn}
            dataTestId="code-converter-input"
          />
          <ToolPane
            label="Output"
            value={output}
            readOnly
            placeholder="Converted data will appear here..."
            indicator="Result"
            indicatorColor="blue"
            error={!!error}
            highlightOn={highlightOn}
            dataTestId="code-converter-output"
          />
        </ToolSplitPane>
      </div>
    </div>
  );
}
