import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { ScanBarcode, Download, QrCode, Hash, Columns, Trash2 } from 'lucide-react';
import { GenerateBarcode } from '../services/barcodeService';

const types = [
  {
    id: 'QR',
    label: 'QR Code',
    icon: QrCode,
    placeholder: 'Enter text or URL to encode...',
    defaultInput: 'https://github.com/wailsapp/wails',
  },
  {
    id: 'Code128',
    label: 'Code 128',
    icon: ScanBarcode,
    placeholder: 'Enter alphanumeric text...',
    defaultInput: 'HELLO-2024',
  },
  {
    id: 'Code39',
    label: 'Code 39',
    icon: ScanBarcode,
    placeholder: 'Enter uppercase letters, digits, - . $ / + % space',
    defaultInput: 'CODE39TEST',
  },
  {
    id: 'EAN-13',
    label: 'EAN-13',
    icon: Hash,
    placeholder: 'Enter 12-13 digits (e.g., product barcode)',
    defaultInput: '5901234123457',
  },
  {
    id: 'EAN-8',
    label: 'EAN-8',
    icon: Hash,
    placeholder: 'Enter 7-8 digits (e.g., small product barcode)',
    defaultInput: '12345670',
  },
];

// Size for barcode generation
const BARCODE_SIZE = 512;

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

function ToolTextArea({ label, value, onChange, placeholder }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <label
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: 'var(--muted-foreground)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '8px',
        }}
      >
        {label}
      </label>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          flex: 1,
          width: '100%',
          minHeight: '200px',
          padding: '12px',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          fontSize: '14px',
          lineHeight: 1.5,
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

function ToolSplitPane({ children, isVertical }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: isVertical ? '1fr' : '1fr 1fr',
        gap: '16px',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function TypeToggle({ types, value, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: 'var(--card)',
        borderRadius: '8px',
        padding: '4px',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
      }}
    >
      {types.map((t) => {
        const Icon = t.icon;
        const isActive = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
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
            <Icon style={{ width: '16px', height: '16px' }} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

export default function BarcodeGenerator() {
  const [input, setInput] = useState('https://github.com/wailsapp/wails');
  const [type, setType] = useState('QR');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVertical, setIsVertical] = useState(
    () => localStorage.getItem('barcode-layout') === 'vertical'
  );

  // Get current type config
  const currentType = types.find((t) => t.id === type) || types[0];

  useEffect(() => {
    localStorage.setItem('barcode-layout', isVertical ? 'vertical' : 'horizontal');
  }, [isVertical]);

  // Handle type change - update input with appropriate default
  const handleTypeChange = (newType) => {
    const typeConfig = types.find((t) => t.id === newType);
    setType(newType);
    setInput(typeConfig?.defaultInput || '');
    setOutput('');
    setError('');
  };

  const handleGenerate = async () => {
    if (!input) return;
    setIsGenerating(true);
    setError('');
    try {
      // For 1D barcodes, we need a larger size to meet the minimum requirement
      const size = type === 'QR' ? BARCODE_SIZE : 512;
      const res = await GenerateBarcode({
        content: input,
        standard: type,
        size: size,
      });
      if (res.error) {
        setError(res.error);
        setOutput('');
      } else if (res.dataUrl) {
        setOutput(res.dataUrl);
        setError('');
      } else {
        setError('Unexpected response format');
        setOutput('');
      }
    } catch (err) {
      console.error('Barcode error:', err);
      setError(err.message || 'Failed to generate barcode');
      setOutput('');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (input) handleGenerate();
  }, [input, type]);

  const handleDownloadPNG = () => {
    if (!output) return;
    const a = document.createElement('a');
    a.href = output;
    a.download = `${type.toLowerCase().replace('-', '')}.png`;
    a.click();
  };

  const handleDownloadSVG = () => {
    if (!output) return;
    // Convert PNG data URL to SVG with embedded image
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
      <image href="${output}" width="512" height="512"/>
    </svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type.toLowerCase().replace('-', '')}.svg`;
    a.click();
    URL.revokeObjectURL(url);
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
      <ToolHeader
        title="Barcode / QR Code"
        description="Generate high-quality QR codes and barcodes for various standards. Customize appearance and download directly as PNG."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

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
        <TypeToggle types={types} value={type} onChange={handleTypeChange} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button variant="danger" onClick={() => setInput('')}>
            <Trash2 style={{ width: '14px', height: '14px' }} />
            Clear
          </Button>
          <div
            style={{
              width: '1px',
              height: '16px',
              backgroundColor: 'var(--border)',
              margin: '0 8px',
            }}
          />
          <Button
            variant="secondary"
            onClick={() => setIsVertical(!isVertical)}
            style={{ padding: '4px' }}
            title="Toggle layout orientation"
            aria-label="Toggle layout orientation"
          >
            <Columns
              style={{
                width: '14px',
                height: '14px',
                transform: isVertical ? 'rotate(90deg)' : 'none',
              }}
            />
          </Button>
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: 'var(--destructive)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      <ToolSplitPane isVertical={isVertical}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ToolTextArea
            label="Input Content"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={currentType.placeholder}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <label
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}
          >
            Preview
          </label>
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              backgroundColor: 'var(--card)',
              padding: '24px',
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--background)',
                padding: '24px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
              }}
            >
              {output ? (
                <img
                  src={output}
                  alt="Barcode"
                  style={{
                    height: 'auto',
                    width: '100%',
                    maxWidth: '300px',
                    objectFit: 'contain',
                    imageRendering: type === 'QR' ? 'auto' : 'pixelated',
                  }}
                />
              ) : (
                <div
                  style={{
                    height: '200px',
                    width: '200px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'var(--card)',
                    borderRadius: '8px',
                  }}
                >
                  <QrCode style={{ width: '48px', height: '48px', opacity: 0.2 }} />
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      opacity: 0.3,
                      marginTop: '12px',
                    }}
                  >
                    {isGenerating ? 'Generating...' : 'Enter content'}
                  </span>
                </div>
              )}
            </div>

            {output && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <Button onClick={handleDownloadPNG}>
                  <Download style={{ width: '14px', height: '14px' }} />
                  PNG
                </Button>
                <Button variant="secondary" onClick={handleDownloadSVG}>
                  <Download style={{ width: '14px', height: '14px' }} />
                  SVG
                </Button>
              </div>
            )}
          </div>
        </div>
      </ToolSplitPane>
    </div>
  );
}
