import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Zap, Filter, Braces, Code2, Code } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ToolHeader } from '../../components/ToolUI';
import { ToolEditorPane, EditorToggle } from '../../components/inputs';
import { ToolLayout } from '../../components/layout';
import { Format } from '../../generated';

const TOOL_KEY = 'code-formatter';

const languages = [
  { id: 'json', label: 'JSON', icon: Braces },
  { id: 'xml', label: 'XML', icon: Code2 },
  { id: 'html', label: 'HTML', icon: Code },
  { id: 'css', label: 'CSS', icon: Code },
];

const sampleData = {
  json: '{"users":[{"name":"Alice","age":30},{"name":"Bob","age":25}],"count":2}',
  xml: '<?xml version="1.0"?><catalog><book id="1"><title>Example</title><author>John</author></book></catalog>',
  html: '<!DOCTYPE html><html><head><title>Test</title></head><body><div class="header"><h1>Welcome</h1></div></body></html>',
  css: '.container { display: flex; padding: 20px; } .header { background: #333; color: white; }',
};

const filterPlaceholders = {
  json: '.users[].name',
  xml: '//book',
  html: '.header',
  css: '',
};

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

function LanguageSelect({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLang = languages.find((l) => l.id === value) || languages[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          height: '36px',
          padding: '0 12px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--foreground)',
          fontSize: '14px',
          cursor: 'pointer',
          minWidth: '140px',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <selectedLang.icon style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
          <span>{selectedLang.label}</span>
        </div>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ opacity: 0.5 }}
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
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          {languages.map((lang) => (
            <button
              key={lang.id}
              onClick={() => {
                onChange(lang.id);
                setIsOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                backgroundColor: value === lang.id ? 'var(--muted)' : 'transparent',
                border: 'none',
                color: 'var(--foreground)',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <lang.icon style={{ width: '16px', height: '16px', color: '#3b82f6' }} />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterBar({ value, onChange, placeholder, show, error }) {
  if (!show) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '8px 12px',
        backgroundColor: error ? 'rgba(239, 68, 68, 0.1)' : 'var(--muted)',
        borderRadius: '6px',
        border: error ? '1px solid #ef4444' : '1px solid var(--border)',
        marginBottom: '8px',
      }}
    >
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <Filter
          style={{
            width: '16px',
            height: '16px',
            color: error ? '#ef4444' : 'var(--muted-foreground)',
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            backgroundColor: 'transparent',
            border: 'none',
            color: error ? '#ef4444' : 'var(--foreground)',
            padding: '4px 0',
            fontSize: '13px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            outline: 'none',
          }}
        />
      </div>
      {error && (
        <div
          style={{
            fontSize: '11px',
            color: '#ef4444',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}

export default function CodeFormatter() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [wordWrap, setWordWrap] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-word-wrap`) !== 'false'
  );
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState(
    () => localStorage.getItem('code-formatter-lang') || 'json'
  );
  const [filter, setFilter] = useState('');
  const [minify, setMinify] = useState(false);
  const [error, setError] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);

  const debouncedFormat = useCallback(
    debounce(async (content, lang, filterText, minifyMode) => {
      if (!content.trim()) {
        setOutput('');
        setError('');
        return;
      }

      setIsFormatting(true);
      setError('');

      try {
        const result = await Format({
          Input: content,
          FormatType: lang,
          Filter: filterText,
          Minify: minifyMode,
        });

        if (result.error) {
          setError(result.error);
          setOutput('');
        } else {
          setOutput(result.output);
        }
      } catch (err) {
        setError(err.message || 'Formatting failed');
        setOutput('');
      } finally {
        setIsFormatting(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    debouncedFormat(input, language, filter, minify);
  }, [input, language, filter, minify, debouncedFormat]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    localStorage.setItem('code-formatter-lang', newLang);
    setFilter('');
  };

  const handleLoadSample = () => {
    setInput(sampleData[language]);
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
        title="Code Formatter"
        description="Clean up and prettify your markup. Supports JSON, XML, HTML, and CSS with intelligent formatting and filtering."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      {/* Top Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: 'var(--muted-foreground)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Language
          </span>
          <LanguageSelect value={language} onChange={handleLanguageChange} />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="secondary" onClick={handleLoadSample} disabled={isFormatting}>
            <FileText size={14} />
            Load Sample
          </Button>
          <Button active={minify} onClick={() => setMinify(!minify)}>
            <Zap size={14} />
            Minify
          </Button>
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
          <button
            onClick={() => {
              const next = !wordWrap;
              setWordWrap(next);
              try {
                localStorage.setItem(`${TOOL_KEY}-word-wrap`, JSON.stringify(next));
              } catch {
                /* ignore */
              }
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

      {/* Main Content Area */}
      <ToolLayout toolKey={TOOL_KEY} persist togglePosition="top-right">
        <ToolEditorPane
          label="Input"
          value={input}
          onChange={(val) => setInput(val)}
          placeholder={`Paste your ${language.toUpperCase()} here...`}
          highlightOn={highlightOn}
          language={language}
          dataTestId="code-formatter-input"
          ariaLabel="Input"
          impl="monaco"
          wordWrap={wordWrap}
        />
        <div className="flex flex-col flex-1 min-h-0">
          <ToolEditorPane
            label="Output"
            value={output}
            readOnly
            highlightOn={highlightOn}
            showLineNumbers
            language={language}
            placeholder="Formatted output will appear here..."
            dataTestId="code-formatter-output"
            ariaLabel="Output"
            impl="monaco"
            wordWrap={wordWrap}
          />
          <FilterBar
            value={filter}
            onChange={setFilter}
            placeholder={filterPlaceholders[language]}
            show={language !== 'css'}
            error={error && error.toLowerCase().includes('filter') ? error : ''}
          />
          {error && !error.toLowerCase().includes('filter') && (
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                marginBottom: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#ef4444',
                fontSize: '12px',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              }}
            >
              {error}
            </div>
          )}
        </div>
      </ToolLayout>
    </div>
  );
}
