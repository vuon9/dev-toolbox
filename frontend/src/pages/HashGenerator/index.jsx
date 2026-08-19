import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui/Button';
import { hashGeneratorAPI } from './api/hashGeneratorAPI';
import MultiHashOutput from './components/MultiHashOutput';
import { ToolHeader } from '../../components/ToolUI';
import { ToolEditorPane, EditorToggle } from '../../components/inputs';
import { ToolLayout } from '../../components/layout';

const METHODS = [
  'All',
  'MD5',
  'SHA-1',
  'SHA-224',
  'SHA-256',
  'SHA-384',
  'SHA-512',
  'SHA-3 (Keccak)',
  'BLAKE2b',
  'BLAKE3',
  'RIPEMD-160',
  'bcrypt',
  'scrypt',
  'Argon2',
  'HMAC',
  'CRC32',
  'Adler-32',
  'MurmurHash3',
  'xxHash',
  'FNV-1a',
];

const TOOL_TITLE = 'Hash Generator';
const TOOL_DESCRIPTION = 'Compute cryptographic and non-cryptographic hash digests.';
const TOOL_KEY = 'hash-generator';

export default function HashGenerator() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [method, setMethod] = useState('MD5');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [hmacKey, setHmacKey] = useState('');

  const isAll = method === 'All';
  const isHmac = method === 'HMAC';

  const performHash = useCallback(
    async (text, meth) => {
      if (!text && meth !== 'All') {
        setOutput('');
        setError('');
        return;
      }
      if (!text && meth === 'All') {
        setOutput('');
        setError('');
        return;
      }
      try {
        if (meth === 'All') {
          const result = await hashGeneratorAPI.HashAll(text);
          setOutput(JSON.stringify(result, null, 2));
        } else {
          const config = isHmac ? { key: hmacKey } : {};
          const result = await hashGeneratorAPI.Hash(text, meth, config);
          setOutput(result);
        }
        setError('');
      } catch (err) {
        setError(err.message);
        setOutput('');
      }
    },
    [isHmac, hmacKey]
  );

  useEffect(() => {
    const timer = setTimeout(() => performHash(input, method), 300);
    return () => clearTimeout(timer);
  }, [input, method, hmacKey, performHash]);

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
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        {isHmac && (
          <input
            type="text"
            value={hmacKey}
            onChange={(e) => setHmacKey(e.target.value)}
            placeholder="HMAC Key"
            style={{
              height: '36px',
              padding: '0 12px',
              fontSize: '13px',
              borderRadius: '6px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--foreground)',
              outline: 'none',
              width: '200px',
            }}
          />
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
        </div>
      </div>

      <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
        <ToolEditorPane
          label="Input"
          value={input}
          onChange={(val) => setInput(val)}
          placeholder="Enter text to hash..."
          indicator="Source"
          indicatorColor="green"
          highlightOn={highlightOn}
          dataTestId="hash-generator-input"
          ariaLabel="Input"
        />
        {isAll ? (
          <div className="flex flex-col flex-1 min-h-0 border rounded-lg overflow-hidden" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}>
            <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Output</label>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>All Hashes</span>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <MultiHashOutput value={output} error={error} />
            </div>
          </div>
        ) : (
          <ToolEditorPane
            label="Output"
            value={output}
            readOnly
            placeholder="Hash result will appear here..."
            indicator="Result"
            indicatorColor="blue"
            error={!!error}
            highlightOn={highlightOn}
            dataTestId="hash-generator-output"
            ariaLabel="Output"
          />
        )}
      </ToolLayout>
    </div>
  );
}
