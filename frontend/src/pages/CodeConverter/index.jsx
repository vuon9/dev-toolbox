import React, { useState, useEffect, useCallback } from 'react';
import { FileText } from 'lucide-react';
import { codeConverterAPI } from './api/codeConverterAPI';
import { ToolHeader } from '../../components/ToolUI';
import { ToolEditorPane, EditorToggle } from '../../components/inputs';
import { ToolLayout } from '../../components/layout';

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

export default function CodeConverter() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [wordWrap, setWordWrap] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-word-wrap`) !== 'false'
  );
  const [method, setMethod] = useState(METHODS[0]);
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const performConversion = useCallback(async (text, meth) => {
    if (!text) {
      setOutput('');
      setError('');
      return;
    }
    try {
      const result = await codeConverterAPI.Convert(text, meth);
      // The backend returns HTTP 200 with a structured {error} body for invalid
      // input; treat it as an error rather than as output.
      if (result && typeof result === 'object' && result.error) {
        setError(result.error);
        setOutput('');
        return;
      }
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
          <button
            onClick={() => {
              const next = !wordWrap;
              setWordWrap(next);
              try {
                localStorage.setItem(`${TOOL_KEY}-word-wrap`, JSON.stringify(next));
              } catch {}
            }}
            title={wordWrap ? 'Disable word wrap' : 'Enable word wrap'}
            aria-pressed={wordWrap}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              padding: '6px',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '4px',
              color: wordWrap ? 'var(--foreground)' : 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <FileText style={{ width: '16px', height: '16px', opacity: wordWrap ? 1 : 0.4 }} />
          </button>
        </div>
      </div>

      <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
        <ToolEditorPane
          label="Input"
          value={input}
          onChange={(val) => setInput(val)}
          placeholder="Enter data to convert..."
          indicator="Source"
          indicatorColor="green"
          highlightOn={highlightOn}
          dataTestId="code-converter-input"
          ariaLabel="Input"
          impl="monaco"
          wordWrap={wordWrap}
        />
        <ToolEditorPane
          label="Output"
          value={output}
          readOnly
          placeholder="Converted data will appear here..."
          indicator="Result"
          indicatorColor="blue"
          error={!!error}
          highlightOn={highlightOn}
          dataTestId="code-converter-output"
          ariaLabel="Output"
          impl="monaco"
          wordWrap={wordWrap}
        />
      </ToolLayout>
    </div>
  );
}
