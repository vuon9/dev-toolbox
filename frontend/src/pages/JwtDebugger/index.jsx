import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import {
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Hash,
  Binary,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { Decode, Encode, Verify } from '../../services/jwtService';
import { ToolHeader } from '../../components/ToolUI';
import { ToolEditorPane, EditorToggle } from '../../components/inputs';
import { ToolLayout } from '../../components/layout';

const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
const SAMPLE_HEADER = '{"alg": "HS256", "typ": "JWT"}';
const SAMPLE_PAYLOAD = '{"sub": "1234567890", "name": "John Doe", "iat": 1516239022}';
const SAMPLE_SECRET = 'your-256-bit-secret';
const TOOL_KEY = 'jwt-debugger';

function ToggleGroup({ options, value, onChange }) {
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
        const isActive = value === option.id;
        const Icon = option.icon;
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
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
            {Icon && <Icon style={{ width: '14px', height: '14px' }} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function StatusMessage({ type, children }) {
  const styles = {
    success: {
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
      color: '#22c55e',
    },
    error: {
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
      color: '#ef4444',
    },
  };
  const style = styles[type] || styles.error;
  return (
    <div
      style={{
        padding: '12px',
        borderRadius: '8px',
        border: `1px solid ${style.borderColor}`,
        backgroundColor: style.backgroundColor,
        color: style.color,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

function SecretInput({ label, value, onChange, placeholder }) {
  const [showSecret, setShowSecret] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
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
      <div style={{ display: 'flex', gap: '8px' }}>
        <input
          type={showSecret ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '8px 12px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--foreground)',
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <button
          onClick={() => setShowSecret(!showSecret)}
          style={{
            padding: '8px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--muted-foreground)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--foreground)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
        >
          {showSecret ? (
            <EyeOff style={{ width: '16px', height: '16px' }} />
          ) : (
            <Eye style={{ width: '16px', height: '16px' }} />
          )}
        </button>
      </div>
    </div>
  );
}

function SelectDropdown({ label, value, onChange, options, width = '140px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.value === value);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {label && (
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
      )}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width,
            height: '32px',
            padding: '0 12px',
            backgroundColor: isOpen ? 'var(--border)' : 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            color: 'var(--foreground)',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none',
          }}
          onMouseEnter={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = 'var(--border)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.backgroundColor = 'var(--background)';
            }
          }}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedOption?.label || value}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              marginLeft: '8px',
              opacity: 0.7,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s ease',
            }}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              zIndex: 50,
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '8px 12px',
                  fontSize: '14px',
                  color: value === opt.value ? 'var(--foreground)' : 'var(--muted-foreground)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--foreground)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color =
                    value === opt.value ? 'var(--foreground)' : 'var(--muted-foreground)';
                }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function JwtDebugger() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [jwt, setJwt] = useState('');
  const [payload, setPayload] = useState('');
  const [header, setHeader] = useState('');
  const [error, setError] = useState('');
  const [isValid, setIsValid] = useState(null);
  const [activeMode, setActiveMode] = useState('decode');
  const [secret, setSecret] = useState('');
  const [algorithm, setAlgorithm] = useState('HS256');
  const [verifySecret, setVerifySecret] = useState('');
  const [verifyEncoding, setVerifyEncoding] = useState('raw');

  const fillSample = () => {
    if (activeMode === 'decode') {
      setJwt(SAMPLE_JWT);
      setVerifySecret(SAMPLE_SECRET);
      setVerifyEncoding('raw');
    } else {
      setHeader(SAMPLE_HEADER);
      setPayload(SAMPLE_PAYLOAD);
      setSecret(SAMPLE_SECRET);
    }
  };

  const handleDecode = async (token = jwt) => {
    if (!token.trim()) return;
    try {
      const decodeRes = await Decode(token);
      setPayload(JSON.stringify(decodeRes.payload, null, 2));
      setHeader(JSON.stringify(decodeRes.header, null, 2));
      if (verifySecret.trim()) {
        const verifyRes = await Verify(token, verifySecret, verifyEncoding);
        setIsValid(verifyRes.valid || verifyRes.isValid);
        setError(verifyRes.error || '');
      } else {
        setIsValid(null);
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Invalid JWT format.');
      setPayload('');
      setHeader('');
      setIsValid(false);
    }
  };

  const handleEncode = async () => {
    try {
      const res = await Encode(header, payload, algorithm, secret || 'your-256-bit-secret');
      setJwt(res.token || res);
      setError('');
    } catch (err) {
      setError(err.message || 'Encoding failed. Check JSON format.');
    }
  };

  useEffect(() => {
    if (jwt && activeMode === 'decode') handleDecode(jwt);
  }, [jwt, activeMode, verifySecret, verifyEncoding]);

  useEffect(() => {
    if (activeMode !== 'encode') return;
    const timeoutId = setTimeout(() => {
      if (header.trim() && payload.trim()) handleEncode();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [header, payload, algorithm, secret, activeMode]);

  const modes = [
    { id: 'decode', label: 'Decode', icon: Hash },
    { id: 'encode', label: 'Encode', icon: Binary },
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
        title="JWT Debugger"
        description="Inspect, decode, and encode JSON Web Tokens. Verify signatures and visualize payload contents with ease."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      <div
        style={{
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <ToggleGroup options={modes} value={activeMode} onChange={setActiveMode} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
          <Button variant="secondary" onClick={fillSample}>
            <FileText style={{ width: '14px', height: '14px' }} /> Sample
          </Button>
          {activeMode === 'encode' && (
            <Button onClick={handleEncode}>
              <Lock style={{ width: '14px', height: '14px' }} /> Sign & Encode
            </Button>
          )}
        </div>
      </div>

      {activeMode === 'decode' ? (
        <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ToolEditorPane
              label="Encoded Token"
              value={jwt}
              onChange={(val) => setJwt(val)}
              placeholder="Paste encoded JWT here..."
              highlightOn={highlightOn}
              dataTestId="jwt-decode-token"
              ariaLabel="Encoded Token"
            />
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
              >
                <Key style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Signature Verification (Optional)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <SelectDropdown
                  label="Encoding"
                  value={verifyEncoding}
                  onChange={setVerifyEncoding}
                  options={[
                    { value: 'base64', label: 'Base64' },
                    { value: 'hex', label: 'Hex' },
                    { value: 'raw', label: 'Raw' },
                  ]}
                  width="120px"
                />
              </div>
              <SecretInput
                label="Secret"
                value={verifySecret}
                onChange={(e) => setVerifySecret(e.target.value)}
                placeholder="Enter secret to verify signature..."
              />
            </div>
            {isValid !== null && (
              <StatusMessage type={isValid ? 'success' : 'error'}>
                {isValid ? (
                  <>
                    <CheckCircle2 style={{ width: '16px', height: '16px' }} /> Signature Verified
                  </>
                ) : (
                  <>
                    <AlertCircle style={{ width: '16px', height: '16px' }} /> Invalid Signature /
                    Format
                  </>
                )}
              </StatusMessage>
            )}
            {error && !isValid && <StatusMessage type="error">{error}</StatusMessage>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ToolEditorPane
              label="Header (Algorithm & Type)"
              value={header}
              readOnly
              placeholder="{ 'alg': 'HS256', 'typ': 'JWT' }"
              highlightOn={highlightOn}
              language="json"
              dataTestId="jwt-decode-header"
              ariaLabel="Header (Algorithm & Type)"
            />
            <ToolEditorPane
              label="Payload (Data)"
              value={payload}
              readOnly
              placeholder="{ 'sub': '1234567890', 'name': 'John Doe' }"
              highlightOn={highlightOn}
              language="json"
              dataTestId="jwt-decode-payload"
              ariaLabel="Payload (Data)"
            />
          </div>
        </ToolLayout>
      ) : (
        <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ToolEditorPane
              label="Header (JSON)"
              value={header}
              onChange={(val) => setHeader(val)}
              placeholder='{"alg": "HS256", "typ": "JWT"}'
              highlightOn={highlightOn}
              language="json"
              dataTestId="jwt-encode-header"
              ariaLabel="Header (JSON)"
            />
            <ToolEditorPane
              label="Payload (JSON)"
              value={payload}
              onChange={(val) => setPayload(val)}
              placeholder='{"sub": "1234567890", "name": "John Doe"}'
              highlightOn={highlightOn}
              language="json"
              dataTestId="jwt-encode-payload"
              ariaLabel="Payload (JSON)"
            />
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}
              >
                <Key style={{ width: '14px', height: '14px', color: 'var(--muted-foreground)' }} />
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Signing Configuration
                </span>
              </div>
              <SelectDropdown
                label="Algorithm"
                value={algorithm}
                onChange={setAlgorithm}
                options={[
                  { value: 'HS256', label: 'HS256' },
                  { value: 'HS384', label: 'HS384' },
                  { value: 'HS512', label: 'HS512' },
                  { value: 'RS256', label: 'RS256' },
                ]}
                width="120px"
              />
              <div style={{ marginTop: '12px' }}>
                <SecretInput
                  label="Secret"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter secret for signing..."
                />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <ToolEditorPane
              label="Encoded Token"
              value={jwt}
              readOnly
              placeholder="Encoded JWT will appear here..."
              highlightOn={highlightOn}
              dataTestId="jwt-encode-token"
              ariaLabel="Encoded Token"
            />
            {error && <StatusMessage type="error">{error}</StatusMessage>}
          </div>
        </ToolLayout>
      )}
    </div>
  );
}
