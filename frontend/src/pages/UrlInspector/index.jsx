import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw, SortAsc, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ToolHeader } from '../../components/ToolUI';
import { ToolInput, ToolCopyButton } from '../../components/inputs';
import { buildUrl, parseUrlInput, sortQueryRows } from './urlUtils';

const SAMPLE_URL = 'https://example.com:8443/api/search?q=hello%20world&debug=true#results';

function createRow() {
  return { id: `param-${crypto.randomUUID()}`, key: '', value: '' };
}

export default function UrlInspector() {
  const [inputUrl, setInputUrl] = useState(SAMPLE_URL);
  const [parts, setParts] = useState({
    scheme: 'https',
    host: 'example.com:8443',
    path: '/api/search',
    hash: 'results',
  });
  const [queryRows, setQueryRows] = useState([
    { id: 'q-0', key: 'q', value: 'hello world' },
    { id: 'debug-1', key: 'debug', value: 'true' },
  ]);
  const [parseError, setParseError] = useState(null);

  const builtResult = useMemo(() => buildUrl({ ...parts, queryRows }), [parts, queryRows]);

  useEffect(() => {
    const result = parseUrlInput(inputUrl);
    setParseError(result.error);
    if (!result.error && result.parts) {
      setParts(result.parts);
      setQueryRows(result.queryRows.length > 0 ? result.queryRows : [createRow()]);
    }
  }, [inputUrl]);

  const updatePart = (name, value) => {
    setParts((current) => ({ ...current, [name]: value }));
  };

  const updateRow = (id, field, value) => {
    setQueryRows((rows) => rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  };

  const removeRow = (id) => {
    setQueryRows((rows) => rows.filter((row) => row.id !== id));
  };

  const transformValue = (id, transform) => {
    setQueryRows((rows) =>
      rows.map((row) => {
        if (row.id !== id) return row;
        try {
          return { ...row, value: transform(row.value) };
        } catch {
          return row;
        }
      })
    );
  };

  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
      }}
    >
      <ToolHeader
        title="URL Inspector"
        description="Parse, edit, sort, encode, and rebuild URLs."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          backgroundColor: 'var(--card)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            URL
          </span>
          <textarea
            value={inputUrl}
            onChange={(event) => setInputUrl(event.target.value)}
            spellCheck={false}
            style={{
              minHeight: '78px',
              resize: 'vertical',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              padding: '12px',
              fontSize: '13px',
              outline: 'none',
              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            }}
          />
        </label>
        {parseError && (
          <div
            role="alert"
            style={{
              border: '1px solid var(--destructive)',
              color: 'var(--destructive)',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '13px',
              backgroundColor: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
            }}
          >
            {parseError}
          </div>
        )}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '12px',
        }}
      >
        <ToolInput
          label="Scheme"
          value={parts.scheme}
          onChange={(event) => updatePart('scheme', event.target.value)}
        />
        <ToolInput
          label="Host"
          value={parts.host}
          onChange={(event) => updatePart('host', event.target.value)}
        />
        <ToolInput
          label="Path"
          value={parts.path}
          onChange={(event) => updatePart('path', event.target.value)}
          className="font-mono"
        />
        <ToolInput
          label="Hash"
          value={parts.hash}
          onChange={(event) => updatePart('hash', event.target.value)}
        />
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          backgroundColor: 'var(--card)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Query Params</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setQueryRows(sortQueryRows(queryRows))}>
              <SortAsc size={14} /> Sort
            </Button>
            <Button
              variant="secondary"
              onClick={() => setQueryRows((rows) => [...rows, createRow()])}
            >
              <Plus size={14} /> Add
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {queryRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(120px, 0.8fr) minmax(160px, 1.2fr) auto',
                gap: '8px',
                alignItems: 'center',
              }}
            >
              <input
                aria-label="Query key"
                value={row.key}
                onChange={(event) => updateRow(row.id, 'key', event.target.value)}
                placeholder="key"
                style={{
                  height: '34px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  padding: '0 10px',
                  minWidth: 0,
                }}
              />
              <input
                aria-label="Query value"
                value={row.value}
                onChange={(event) => updateRow(row.id, 'value', event.target.value)}
                placeholder="value"
                style={{
                  height: '34px',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  padding: '0 10px',
                  minWidth: 0,
                }}
              />
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button
                  title="Encode value"
                  variant="outline"
                  onClick={() => transformValue(row.id, encodeURIComponent)}
                  style={{ width: '34px', height: '34px', padding: 0 }}
                >
                  %
                </Button>
                <Button
                  title="Decode value"
                  variant="outline"
                  onClick={() => transformValue(row.id, decodeURIComponent)}
                  style={{ width: '34px', height: '34px', padding: 0 }}
                >
                  <RefreshCw size={14} />
                </Button>
                <Button
                  title="Remove param"
                  variant="danger"
                  onClick={() => removeRow(row.id)}
                  style={{ width: '34px', height: '34px', padding: 0 }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          border: '1px solid var(--border)',
          borderRadius: '8px',
          backgroundColor: 'var(--card)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Built URL</h3>
          <ToolCopyButton text={builtResult.url} disabled={!builtResult.url} variant="secondary" />
        </div>
        <pre
          style={{
            margin: 0,
            minHeight: '54px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            backgroundColor: 'var(--background)',
            color: builtResult.error ? 'var(--destructive)' : 'var(--foreground)',
            padding: '12px',
            fontSize: '13px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {builtResult.error || builtResult.url}
        </pre>
      </section>
    </div>
  );
}
