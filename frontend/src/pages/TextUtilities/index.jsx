import React, { useState, useCallback } from 'react';
import { Undo2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { textUtilitiesAPI } from './api/textUtilitiesAPI';
import { ToolHeader } from '../../components/ToolUI';
import { ToolEditorPane, EditorToggle } from '../../components/inputs';
import { ToolLayout } from '../../components/layout';

const ESCAPE_METHODS = ['String Literal', 'Unicode/Hex'];

const TOOL_TITLE = 'Text Utilities';
const TOOL_DESCRIPTION = 'Sort, deduplicate, case-convert, escape, and inspect text.';
const TOOL_KEY = 'text-utilities';

function StatBadge({ label, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        backgroundColor: 'var(--background)',
        borderRadius: '6px',
        border: '1px solid var(--border)',
      }}
    >
      <span style={{ fontSize: '11px', color: 'var(--muted-foreground)', fontWeight: 500 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: '14px',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          fontWeight: 600,
          color: 'var(--foreground)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const cases = [
  { id: 'upper', label: 'UPPER' },
  { id: 'lower', label: 'lower' },
  { id: 'camel', label: 'camelCase' },
  { id: 'pascal', label: 'PascalCase' },
  { id: 'snake', label: 'snake_case' },
  { id: 'kebab', label: 'kebab-case' },
  { id: 'sentence', label: 'Sentence' },
];

export default function TextUtilities() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [stats, setStats] = useState({ chars: 0, words: 0, lines: 0, bytes: 0, sentences: 0 });
  const [escapeMethod, setEscapeMethod] = useState(ESCAPE_METHODS[0]);
  const [escapeMode, setEscapeMode] = useState('Escape');
  const [escapeResult, setEscapeResult] = useState('');

  const updateOutput = useCallback(async (text) => {
    if (!text) {
      setOutput('');
      setStats({ chars: 0, words: 0, lines: 0, bytes: 0, sentences: 0 });
      return;
    }
    setOutput(text);
    const s = await textUtilitiesAPI.GetStats(text);
    setStats(s);
  }, []);

  const handleInputChange = useCallback(
    (text) => {
      setInput(text);
      updateOutput(text);
    },
    [updateOutput]
  );

  const handleSort = useCallback(async () => {
    if (!input) return;
    const result = await textUtilitiesAPI.SortLines(input, false);
    setOutput(result);
    setInput(result);
  }, [input]);

  const handleSortDesc = useCallback(async () => {
    if (!input) return;
    const result = await textUtilitiesAPI.SortLines(input, true);
    setOutput(result);
    setInput(result);
  }, [input]);

  const handleDedupe = useCallback(async () => {
    if (!input) return;
    const result = await textUtilitiesAPI.RemoveDuplicates(input);
    setOutput(result);
    setInput(result);
  }, [input]);

  const handleTrim = useCallback(async () => {
    if (!input) return;
    const result = await textUtilitiesAPI.TrimLines(input);
    setOutput(result);
    setInput(result);
  }, [input]);

  const handleRemoveEmpty = useCallback(async () => {
    if (!input) return;
    const result = await textUtilitiesAPI.RemoveEmptyLines(input);
    setOutput(result);
    setInput(result);
  }, [input]);

  const handleConvertCase = useCallback(
    async (targetCase) => {
      if (!input) return;
      const result = await textUtilitiesAPI.ConvertCase(input, targetCase);
      setOutput(result);
      setInput(result);
    },
    [input]
  );

  const handleEscape = useCallback(async () => {
    if (!input) return;
    const isEscape = escapeMode === 'Escape';
    const result = isEscape
      ? await textUtilitiesAPI.Escape(input, escapeMethod)
      : await textUtilitiesAPI.Unescape(input, escapeMethod);
    setEscapeResult(result);
  }, [input, escapeMethod, escapeMode]);

  const handleReset = useCallback(() => {
    setInput('');
    setOutput('');
    setEscapeResult('');
    setStats({ chars: 0, words: 0, lines: 0, bytes: 0, sentences: 0 });
  }, []);

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

      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--muted-foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Quick Actions:
        </span>
        <Button size="sm" onClick={handleSort}>
          <ArrowUp style={{ width: '14px', height: '14px' }} /> Asc
        </Button>
        <Button size="sm" onClick={handleSortDesc}>
          <ArrowDown style={{ width: '14px', height: '14px' }} /> Desc
        </Button>
        <Button size="sm" onClick={handleDedupe}>
          <ArrowUpDown style={{ width: '14px', height: '14px' }} /> Dedupe
        </Button>
        <Button size="sm" onClick={handleTrim}>
          Trim
        </Button>
        <Button size="sm" onClick={handleRemoveEmpty}>
          Rm Empty
        </Button>
        <div style={{ width: '1px', height: '16px', backgroundColor: 'var(--border)' }} />
        <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
        <Button variant="danger" onClick={handleReset}>
          <Undo2 style={{ width: '14px', height: '14px' }} /> Reset
        </Button>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          flexShrink: 0,
          marginBottom: '16px',
        }}
      >
        <StatBadge label="Chars" value={stats.chars.toLocaleString()} />
        <StatBadge label="Words" value={stats.words.toLocaleString()} />
        <StatBadge label="Lines" value={stats.lines.toLocaleString()} />
        <StatBadge label="Bytes" value={stats.bytes.toLocaleString()} />
        <StatBadge label="Sentences" value={stats.sentences.toLocaleString()} />
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          flexShrink: 0,
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Case Conversion
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {cases.map((c) => (
            <Button key={c.id} size="sm" onClick={() => handleConvertCase(c.id)}>
              {c.label}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: '8px 12px',
          borderRadius: '8px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          flexShrink: 0,
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Escape / Unescape
          </span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={escapeMethod}
            onChange={(e) => setEscapeMethod(e.target.value)}
            style={{
              height: '32px',
              padding: '0 8px',
              fontSize: '12px',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              outline: 'none',
            }}
          >
            {ESCAPE_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              padding: '3px',
            }}
          >
            <button
              type="button"
              onClick={() => setEscapeMode('Escape')}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: escapeMode === 'Escape' ? 'var(--border)' : 'transparent',
                color: escapeMode === 'Escape' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              Escape
            </button>
            <button
              type="button"
              onClick={() => setEscapeMode('Unescape')}
              style={{
                padding: '3px 10px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: escapeMode === 'Unescape' ? 'var(--border)' : 'transparent',
                color: escapeMode === 'Unescape' ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
            >
              Unescape
            </button>
          </div>
          <Button size="sm" onClick={handleEscape}>
            Run
          </Button>
          {escapeResult && (
            <span
              style={{
                fontSize: '12px',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                color: '#22c55e',
                wordBreak: 'break-all',
                maxWidth: '300px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {escapeResult}
            </span>
          )}
        </div>
      </div>

      <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
        <ToolEditorPane
          label="Input"
          value={input}
          onChange={handleInputChange}
          placeholder="Paste or type text here..."
          indicator="Source"
          indicatorColor="green"
          highlightOn={highlightOn}
          dataTestId="text-utilities-input"
          ariaLabel="Input"
        />
        <ToolEditorPane
          label="Output"
          value={output}
          readOnly
          placeholder="Transformed text will appear here..."
          indicator="Result"
          indicatorColor="blue"
          highlightOn={highlightOn}
          dataTestId="text-utilities-output"
          ariaLabel="Output"
        />
      </ToolLayout>
    </div>
  );
}
