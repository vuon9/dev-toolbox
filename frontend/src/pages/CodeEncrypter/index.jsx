import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Columns } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { encrypterAPI } from './api/encrypterAPI';
import CodeEditor from '../../components/inputs/CodeEditor';
import HighlightedCode from '../../components/inputs/HighlightedCode';
import EditorToggle from '../../components/inputs/EditorToggle';

const METHODS = [
  'AES',
  'AES-GCM',
  'DES',
  'Triple DES',
  'Rabbit',
  'RC4',
  'RC4Drop',
  'ChaCha20',
  'Salsa20',
  'Blowfish',
  'Twofish',
  'RSA',
  'Fernet',
  'BIP38',
  'XOR',
];

const NEED_KEY_AND_IV = new Set([
  'AES',
  'AES-GCM',
  'DES',
  'Triple DES',
  'ChaCha20',
  'Salsa20',
  'Blowfish',
  'Twofish',
]);
const NEED_KEY_ONLY = new Set(['RC4', 'RC4Drop', 'XOR', 'Rabbit']);
const NEED_RSA = new Set(['RSA']);
const PRESETS = ['AES', 'XOR', 'ChaCha20'];
const STORAGE_KEY = 'tool-encrypter';
const DEBOUNCE_MS = 400;
const TOOL_KEY = 'code-encrypter';

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

export default function CodeEncrypter() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [method, setMethod] = useState(
    () => localStorage.getItem(`${STORAGE_KEY}-method`) || 'AES'
  );
  const [isEncrypt, setIsEncrypt] = useState(
    () => localStorage.getItem(`${STORAGE_KEY}-mode`) !== 'decrypt'
  );
  const [isVertical, setIsVertical] = useState(
    () => localStorage.getItem(`${STORAGE_KEY}-layout`) === 'vertical'
  );
  const [key, setKey] = useState(() => localStorage.getItem(`${STORAGE_KEY}-key`) || '');
  const [iv, setIv] = useState(() => localStorage.getItem(`${STORAGE_KEY}-iv`) || '');
  const [autoRun, setAutoRun] = useState(
    () => localStorage.getItem(`${STORAGE_KEY}-autoRun`) !== 'false'
  );
  const [publicKey, setPublicKey] = useState(
    () => localStorage.getItem(`${STORAGE_KEY}-publicKey`) || ''
  );
  const [privateKey, setPrivateKey] = useState(
    () => localStorage.getItem(`${STORAGE_KEY}-privateKey`) || ''
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const convert = useCallback(async () => {
    if (!input) {
      setOutput('');
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const k = NEED_RSA.has(method) ? publicKey : key;
      const i = NEED_RSA.has(method) ? privateKey : iv;
      const result = isEncrypt
        ? await encrypterAPI.Encrypt(input, method, k, i)
        : await encrypterAPI.Decrypt(input, method, k, i);
      setOutput(result);
    } catch (err) {
      setError(err.message || 'Operation failed');
      setOutput('');
    } finally {
      setLoading(false);
    }
  }, [input, method, key, iv, isEncrypt, publicKey, privateKey]);

  useEffect(() => {
    if (!autoRun) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(convert, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [convert, autoRun]);

  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-method`, method);
  }, [method]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-mode`, isEncrypt ? 'encrypt' : 'decrypt');
  }, [isEncrypt]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-layout`, isVertical ? 'vertical' : 'horizontal');
  }, [isVertical]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-key`, key);
  }, [key]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-iv`, iv);
  }, [iv]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-autoRun`, String(autoRun));
  }, [autoRun]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-publicKey`, publicKey);
  }, [publicKey]);
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}-privateKey`, privateKey);
  }, [privateKey]);

  const handlePreset = (presetMethod) => {
    setMethod(presetMethod);
    setInput(input);
    if (!autoRun) {
      const k = NEED_RSA.has(presetMethod) ? publicKey : key;
      const i = NEED_RSA.has(presetMethod) ? privateKey : iv;
      (async () => {
        setLoading(true);
        setError('');
        try {
          const result = isEncrypt
            ? await encrypterAPI.Encrypt(input, presetMethod, k, i)
            : await encrypterAPI.Decrypt(input, presetMethod, k, i);
          setOutput(result);
        } catch (err) {
          setError(err.message || 'Operation failed');
          setOutput('');
        } finally {
          setLoading(false);
        }
      })();
    }
  };

  const showKeyInput = !NEED_RSA.has(method);
  const showIvInput = NEED_KEY_AND_IV.has(method);
  const showRsaConfig = NEED_RSA.has(method);

  const inputLabel = isEncrypt ? 'Input' : 'Input';
  const outputLabel = isEncrypt ? 'Encrypted' : 'Decrypted';
  const outputIndicator = isEncrypt ? 'Encrypt' : 'Decrypt';
  const inputIndicator = method;

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
        title="Code Encrypter"
        description="Encrypt and decrypt text using various algorithms"
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '16px' }}>
        <div>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Method
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            style={{
              height: '40px',
              padding: '0 12px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--foreground)',
              fontSize: '14px',
              fontWeight: 500,
              outline: 'none',
              cursor: 'pointer',
              minWidth: '160px',
            }}
          >
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Mode
          </label>
          <div
            style={{
              display: 'inline-flex',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setIsEncrypt(true)}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: isEncrypt ? 'var(--primary)' : 'var(--background)',
                color: isEncrypt ? '#ffffff' : 'var(--muted-foreground)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Encrypt
            </button>
            <button
              onClick={() => setIsEncrypt(false)}
              style={{
                padding: '8px 16px',
                fontSize: '12px',
                fontWeight: 500,
                backgroundColor: !isEncrypt ? 'var(--primary)' : 'var(--background)',
                color: !isEncrypt ? '#ffffff' : 'var(--muted-foreground)',
                border: 'none',
                borderLeft: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Decrypt
            </button>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
          <button
            onClick={() => setIsVertical(!isVertical)}
            title={isVertical ? 'Switch to horizontal layout' : 'Switch to vertical layout'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              padding: '8px',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Columns style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      <div
        style={{
          marginBottom: '12px',
          padding: '12px',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
          {showKeyInput && (
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Key
              </label>
              <input
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Enter encryption key..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '13px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
            </div>
          )}
          {showIvInput && (
            <div style={{ flex: '1', minWidth: '180px' }}>
              <label
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                IV / Nonce
              </label>
              <input
                value={iv}
                onChange={(e) => setIv(e.target.value)}
                placeholder="Enter IV or nonce..."
                style={{
                  width: '100%',
                  height: '36px',
                  padding: '0 10px',
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '13px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />
            </div>
          )}
          {showRsaConfig && (
            <>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Public Key
                </label>
                <textarea
                  value={publicKey}
                  onChange={(e) => setPublicKey(e.target.value)}
                  placeholder="Enter RSA public key..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    fontSize: '12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Private Key
                </label>
                <textarea
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter RSA private key..."
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    fontSize: '12px',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                    borderRadius: '6px',
                    color: 'var(--foreground)',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>
            </>
          )}
          <div
            style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', paddingBottom: '2px' }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--muted-foreground)',
                cursor: 'pointer',
              }}
            >
              <input
                type="checkbox"
                checked={autoRun}
                onChange={(e) => setAutoRun(e.target.checked)}
                style={{ accentColor: 'var(--primary)' }}
              />
              Auto-run
            </label>
            {!autoRun && (
              <Button variant="secondary" onClick={convert} disabled={loading || !input}>
                {loading ? 'Running...' : 'Convert'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {PRESETS.map((p) => (
          <Button
            key={p}
            variant={method === p ? 'default' : 'secondary'}
            onClick={() => handlePreset(p)}
          >
            {p}
          </Button>
        ))}
      </div>

      {error && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#ef4444',
            fontSize: '13px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {error}
        </div>
      )}

      <ToolSplitPane isVertical={isVertical}>
        <ToolPane
          label={inputLabel}
          value={input}
          onChange={(val) => setInput(val)}
          placeholder="Enter text to encrypt or decrypt..."
          indicator={inputIndicator}
          indicatorColor="green"
          highlightOn={highlightOn}
          dataTestId="code-encrypter-input"
        />
        <ToolPane
          label={outputLabel}
          value={output}
          readOnly
          placeholder={loading ? 'Processing...' : 'Result will appear here...'}
          indicator={outputIndicator}
          indicatorColor="blue"
          error={!!error}
          highlightOn={highlightOn}
          dataTestId="code-encrypter-output"
        />
      </ToolSplitPane>
    </div>
  );
}
