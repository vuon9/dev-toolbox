import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Check, Dice5 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ToolHeader } from '../../components/ToolUI';
import { numberConverterAPI } from './api/numberConverterAPI';

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function getRandomNumber() {
  return Math.floor(Math.random() * 1000000);
}

function Column1Bases({ result, base }) {
  const bases = [
    { id: 'binary', label: 'Binary', value: result.binary },
    { id: 'decimal', label: 'Decimal', value: result.decimal, active: true },
    { id: 'hex', label: 'Hex', value: result.hex },
    { id: 'octal', label: 'Octal', value: result.octal },
  ];

  const [copied, setCopied] = useState({});

  const handleCopy = (id, value) => {
    navigator.clipboard.writeText(value);
    setCopied({ ...copied, [id]: true });
    setTimeout(() => setCopied({ ...copied, [id]: false }), 2000);
  };

  return (
    <div>
      <h4
        style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          margin: '0 0 8px 0',
          letterSpacing: '0.05em',
        }}
      >
        Number Bases
      </h4>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {bases.map((b) => (
          <div
            key={b.id}
            onClick={() => handleCopy(b.id, b.value)}
            style={{
              backgroundColor: 'var(--card)',
              padding: '8px 10px',
              borderRadius: '6px',
              border: b.active ? '1px solid var(--primary)' : '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'border-color 0.15s ease',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                color: b.active ? 'var(--primary)' : 'var(--muted-foreground)',
                textTransform: 'uppercase',
              }}
            >
              {b.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '14px',
                  color: 'var(--foreground)',
                }}
              >
                {b.value}
              </span>
              {copied[b.id] ? (
                <Check size={12} style={{ color: 'var(--success)' }} />
              ) : (
                <Copy size={12} style={{ color: 'var(--muted-foreground)' }} />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bit Breakdown */}
      <h4
        style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          margin: '12px 0 6px 0',
          letterSpacing: '0.05em',
        }}
      >
        Bit Values
      </h4>
      <div
        style={{
          backgroundColor: 'var(--card)',
          padding: '8px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', gap: '1px', marginBottom: '6px' }}>
          {result.bits &&
            result.bits.map((bit, i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center' }}>
                <div
                  style={{
                    backgroundColor: bit === 1 ? 'rgba(59,130,246,0.2)' : 'rgba(24,24,27,0.4)',
                    borderRadius: '2px',
                    padding: '3px 0',
                    marginBottom: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      color: bit === 1 ? 'var(--primary)' : 'rgba(113,113,122,0.3)',
                      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    }}
                  >
                    {bit}
                  </span>
                </div>
                <span style={{ fontSize: '8px', color: 'var(--muted-foreground)' }}>
                  {result.bitValues[i]}
                </span>
              </div>
            ))}
        </div>
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {result.bitValues &&
            result.bits &&
            result.bitValues.filter((_, i) => result.bits[i] === 1).join('+')}
          ={result.decimal}
        </div>
      </div>
    </div>
  );
}

function Column2Data({ result }) {
  return (
    <div>
      {/* Bytes */}
      <h4
        style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          margin: '0 0 8px 0',
          letterSpacing: '0.05em',
        }}
      >
        As Bytes
      </h4>
      <div
        style={{
          backgroundColor: 'var(--card)',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          marginBottom: '10px',
        }}
      >
        <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
          {result.bytes.bigEndian.map((byte, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                backgroundColor:
                  i === result.bytes.highlighted ? 'rgba(59,130,246,0.2)' : 'var(--border)',
                padding: '6px',
                borderRadius: '4px',
                textAlign: 'center',
                border: i === result.bytes.highlighted ? '1px solid rgba(59,130,246,0.4)' : 'none',
              }}
            >
              <div
                style={{
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '14px',
                  color: i === result.bytes.highlighted ? 'var(--primary)' : 'var(--foreground)',
                }}
              >
                {byte}
              </div>
              <div style={{ fontSize: '8px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
                {i === 0 ? 'MSB' : i === 3 ? 'LSB' : ''}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', textAlign: 'center' }}>
          32-bit big-endian
        </div>
      </div>

      {/* ASCII */}
      {result.ascii && result.ascii.code !== undefined && (
        <>
          <h4
            style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              margin: '10px 0 6px 0',
              letterSpacing: '0.05em',
            }}
          >
            As ASCII
          </h4>
          <div
            style={{
              backgroundColor: 'var(--card)',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              marginBottom: '10px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: '24px',
                color: 'var(--foreground)',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                marginBottom: '4px',
              }}
            >
              {result.ascii.printable ? result.ascii.char : '•'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
              Code {result.ascii.code} {result.ascii.printable ? '' : '(non-printable)'}
            </div>
          </div>
        </>
      )}

      {/* Color */}
      {result.color && result.color.valid && (
        <>
          <h4
            style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              margin: '10px 0 6px 0',
              letterSpacing: '0.05em',
            }}
          >
            As Color
          </h4>
          <div
            style={{
              backgroundColor: 'var(--card)',
              padding: '8px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                backgroundColor: result.color.hex,
                borderRadius: '4px',
                border: '2px solid var(--border)',
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '14px',
                  color: 'var(--foreground)',
                }}
              >
                {result.color.hex}
              </div>
              <div style={{ fontSize: '9px', color: 'var(--muted-foreground)' }}>
                RGB blue channel
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Column3Context({ result }) {
  return (
    <div>
      {/* IPv4 */}
      {result.ipv4 && result.ipv4.address && (
        <>
          <h4
            style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              margin: '0 0 8px 0',
              letterSpacing: '0.05em',
            }}
          >
            As IPv4
          </h4>
          <div
            style={{
              backgroundColor: 'var(--card)',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '15px',
                color: 'var(--foreground)',
                textAlign: 'center',
              }}
            >
              {result.ipv4.address}
            </div>
            <div
              style={{
                fontSize: '9px',
                color: 'var(--muted-foreground)',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              {result.ipv4.type === 'broadcast'
                ? 'Broadcast address'
                : result.ipv4.type === 'network'
                  ? 'Network address'
                  : 'Last octet only'}
            </div>
          </div>
        </>
      )}

      {/* File Size */}
      <h4
        style={{
          fontSize: '11px',
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          margin: '10px 0 6px 0',
          letterSpacing: '0.05em',
        }}
      >
        As File Size
      </h4>
      <div
        style={{
          backgroundColor: 'var(--card)',
          padding: '10px',
          borderRadius: '6px',
          border: '1px solid var(--border)',
          marginBottom: '10px',
        }}
      >
        <div
          style={{
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '15px',
            color: 'var(--foreground)',
            textAlign: 'center',
          }}
        >
          {result.fileSize.human}
        </div>
        <div
          style={{
            fontSize: '9px',
            color: 'var(--muted-foreground)',
            textAlign: 'center',
            marginTop: '4px',
          }}
        >
          {result.fileSize.kb.toFixed(2)} KB · {result.fileSize.mb.toFixed(5)} MB
        </div>
      </div>

      {/* Unix Timestamp */}
      {result.timestamp && result.timestamp.datetime && (
        <>
          <h4
            style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              margin: '10px 0 6px 0',
              letterSpacing: '0.05em',
            }}
          >
            As Unix Time
          </h4>
          <div
            style={{
              backgroundColor: 'var(--card)',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              marginBottom: '10px',
            }}
          >
            <div
              style={{
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                color: 'var(--foreground)',
                textAlign: 'center',
              }}
            >
              {result.timestamp.datetime}
            </div>
            <div
              style={{
                fontSize: '9px',
                color: 'var(--muted-foreground)',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              {result.timestamp.duration} since epoch
            </div>
          </div>
        </>
      )}

      {/* Percentage */}
      {result.percentage !== undefined && (
        <>
          <h4
            style={{
              fontSize: '11px',
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              margin: '10px 0 6px 0',
              letterSpacing: '0.05em',
            }}
          >
            As Percentage
          </h4>
          <div
            style={{
              backgroundColor: 'var(--card)',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '15px',
                color: 'var(--foreground)',
                textAlign: 'center',
              }}
            >
              {result.percentage}%
            </div>
            <div
              style={{
                fontSize: '9px',
                color: 'var(--muted-foreground)',
                textAlign: 'center',
                marginTop: '4px',
              }}
            >
              of 8-bit max (255)
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TOOL_TITLE = 'Number Converter';
const TOOL_DESCRIPTION = 'Convert and interpret numbers in different contexts';

export default function NumberConverter() {
  const [input, setInput] = useState('255');
  const [base] = useState('decimal');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const convertNumber = useCallback(async (value, currentBase) => {
    if (!value.trim()) {
      setResult(null);
      setError('');
      return;
    }

    try {
      const response = await numberConverterAPI.Convert({
        value: value,
        base: currentBase,
      });

      if (response.error) {
        setError(response.error);
        setResult(null);
      } else {
        setResult(response);
        setError('');
      }
    } catch (err) {
      setError(err.message || 'Conversion failed');
      setResult(null);
    }
  }, []);

  const debouncedConvert = useCallback(
    debounce((value, currentBase) => {
      convertNumber(value, currentBase);
    }, 150),
    [convertNumber]
  );

  // Immediate conversion on mount
  useEffect(() => {
    convertNumber(input, base);
  }, []);

  // Debounced conversion when input changes
  useEffect(() => {
    debouncedConvert(input, base);
  }, [input, base, debouncedConvert]);

  const handleRandom = () => {
    const num = getRandomNumber();
    setInput(num.toString());
  };

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
      {/* Header */}
      <ToolHeader title={TOOL_TITLE} description={TOOL_DESCRIPTION} />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      {/* Input row */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter number..."
          style={{
            flex: 1,
            backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : 'var(--card)',
            border: error ? '1px solid var(--destructive)' : '1px solid var(--primary)',
            borderRadius: '6px',
            padding: '10px 12px',
            color: 'var(--foreground)',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '14px',
            outline: 'none',
          }}
        />
        <Button variant="secondary" onClick={handleRandom}>
          <Dice5 size={14} />
          Random
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div
          style={{
            padding: '8px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '6px',
            color: 'var(--destructive)',
            fontSize: '14px',
            marginBottom: '12px',
          }}
        >
          {error}
        </div>
      )}

      {/* 3 Column Layout */}
      {result && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            flex: 1,
            overflow: 'auto',
          }}
        >
          {/* Column 1: Number Bases */}
          <Column1Bases result={result} base={base} />

          {/* Column 2: Data Representation */}
          <Column2Data result={result} />

          {/* Column 3: Network & Time */}
          <Column3Context result={result} />
        </div>
      )}
    </div>
  );
}
