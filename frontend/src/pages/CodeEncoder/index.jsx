import React, { useState, useEffect, useCallback } from 'react';
import { encoderAPI } from './api/encoderAPI';
import { ToolHeader } from '../../components/ToolUI';
import { ToolEditorPane, EditorToggle } from '../../components/inputs';
import { ToolLayout } from '../../components/layout';

const ENCODE_METHODS = [
  'Base16 (Hex)',
  'Base32',
  'Base58',
  'Base64',
  'Base64URL',
  'Base85',
  'URL',
  'HTML Entities',
  'Binary',
  'Morse Code',
  'Punnycode',
  'Bencoded',
  'Protobuf',
  'ROT13',
  'ROT47',
  'Quoted-Printable',
];

const ESCAPE_METHODS = ['URL', 'HTML/XML', 'Regex'];

const TOOL_TITLE = 'Code Encoder';
const TOOL_DESCRIPTION = 'Encode, decode, and escape data using various schemes.';
const TOOL_KEY = 'code-encoder';

function ModeToggle({ mode, onEncodeLabel, onDecodeLabel, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: '32px',
          borderRadius: '6px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          padding: '4px',
        }}
      >
        <button
          type="button"
          onClick={() => onChange(onEncodeLabel)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: mode === onEncodeLabel ? 'var(--border)' : 'transparent',
            color: mode === onEncodeLabel ? 'var(--foreground)' : 'var(--muted-foreground)',
            boxShadow: mode === onEncodeLabel ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          {onEncodeLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(onDecodeLabel)}
          style={{
            padding: '4px 12px',
            fontSize: '12px',
            fontWeight: 500,
            borderRadius: '4px',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            backgroundColor: mode === onDecodeLabel ? 'var(--border)' : 'transparent',
            color: mode === onDecodeLabel ? 'var(--foreground)' : 'var(--muted-foreground)',
            boxShadow: mode === onDecodeLabel ? '0 1px 2px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          {onDecodeLabel}
        </button>
      </div>
    </div>
  );
}

export default function CodeEncoder() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [method, setMethod] = useState('Base64');
  const [mode, setMode] = useState('Encode');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  const isEscapeMethod = ESCAPE_METHODS.includes(method);
  const currentMethods = isEscapeMethod ? ESCAPE_METHODS : ENCODE_METHODS;
  const onLabel = isEscapeMethod ? 'Escape' : 'Encode';
  const offLabel = isEscapeMethod ? 'Unescape' : 'Decode';

  useEffect(() => {
    if (!currentMethods.includes(method)) {
      setMethod(currentMethods[0]);
    }
  }, [isEscapeMethod]);

  const performConversion = useCallback(
    async (text, meth, sub) => {
      if (!text) {
        setOutput('');
        setError('');
        return;
      }
      try {
        const isEncode = sub === onLabel;
        let result;
        if (isEscapeMethod) {
          result = isEncode
            ? await encoderAPI.Escape(text, meth)
            : await encoderAPI.Unescape(text, meth);
        } else {
          result = isEncode
            ? await encoderAPI.Encode(text, meth)
            : await encoderAPI.Decode(text, meth);
        }
        setOutput(result);
        setError('');
      } catch (err) {
        setError(err.message);
        setOutput('');
      }
    },
    [isEscapeMethod, onLabel]
  );

  useEffect(() => {
    const timer = setTimeout(() => performConversion(input, method, mode), 300);
    return () => clearTimeout(timer);
  }, [input, method, mode, performConversion]);

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
            minWidth: '180px',
          }}
        >
          <optgroup label="Encode / Decode">
            {ENCODE_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </optgroup>
          <optgroup label="Escape / Unescape">
            {ESCAPE_METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </optgroup>
        </select>

        <ModeToggle
          mode={mode}
          onEncodeLabel={onLabel}
          onDecodeLabel={offLabel}
          onChange={setMode}
        />

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
        </div>
      </div>

      <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
        <ToolEditorPane
          label="Input"
          value={input}
          onChange={(val) => setInput(val)}
          placeholder="Enter text to encode, decode, or escape..."
          indicator="Source"
          indicatorColor="green"
          highlightOn={highlightOn}
          dataTestId="code-encoder-input"
          ariaLabel="Input"
        />
        <ToolEditorPane
          label="Output"
          value={output}
          readOnly
          placeholder="Result will appear here..."
          indicator="Result"
          indicatorColor="blue"
          error={!!error}
          highlightOn={highlightOn}
          dataTestId="code-encoder-output"
          ariaLabel="Output"
        />
      </ToolLayout>
    </div>
  );
}
