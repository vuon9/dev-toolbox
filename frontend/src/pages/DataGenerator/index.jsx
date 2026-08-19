import React, { useState, useEffect } from 'react';
import { Button } from '../../components/ui/Button';
import {
  Play,
  FileJson,
  FileType,
  FileCode,
  Columns,
  Trash2,
  Plus,
  HelpCircle,
  X,
  Copy,
} from 'lucide-react';
import { Generate } from '../../services/dataGeneratorService';
import { HELP_CONTENT } from './constants';
import HighlightedCode from '../../components/inputs/HighlightedCode';
import EditorToggle from '../../components/inputs/EditorToggle';

const formats = [
  { id: 'json', label: 'JSON', icon: FileJson },
  { id: 'csv', label: 'CSV', icon: FileType },
  { id: 'tsv', label: 'TSV', icon: FileType },
  { id: 'raw', label: 'Raw', icon: FileCode },
  { id: 'xml', label: 'XML', icon: FileCode },
  { id: 'yaml', label: 'YAML', icon: FileType },
];

const fieldTypes = [
  'UUID',
  'ULID',
  'FirstName',
  'LastName',
  'Name',
  'Gender',
  'Email',
  'Phone',
  'Username',
  'URL',
  'Domain',
  'IP',
  'Password',
  'Street',
  'City',
  'State',
  'Zip',
  'Country',
  'Latitude',
  'Longitude',
  'Company',
  'JobTitle',
  'Past',
  'Future',
  'Recent',
  'Birthday',
  'Int',
  'Float',
  'Price',
  'Word',
  'Sentence',
  'Paragraph',
  'Bool',
];

const typeToTemplate = {
  UUID: '"{{UUID}}"',
  ULID: '"{{ULID}}"',
  FirstName: '"{{FirstName}}"',
  LastName: '"{{LastName}}"',
  Name: '"{{Name}}"',
  Gender: '"{{Gender}}"',
  Email: '"{{Email}}"',
  Phone: '"{{Phone}}"',
  Username: '"{{Username}}"',
  URL: '"{{URL}}"',
  Domain: '"{{Domain}}"',
  IP: '"{{IP}}"',
  Password: '"{{Password}}"',
  Street: '"{{Street}}"',
  City: '"{{City}}"',
  State: '"{{State}}"',
  Zip: '"{{Zip}}"',
  Country: '"{{Country}}"',
  Latitude: '{{Latitude}}',
  Longitude: '{{Longitude}}',
  Company: '"{{Company}}"',
  JobTitle: '"{{JobTitle}}"',
  Past: '"{{Past}}"',
  Future: '"{{Future}}"',
  Recent: '"{{Recent}}"',
  Birthday: '"{{Birthday}}"',
  Int: '{{Int 1 100}}',
  Float: '{{Float 1.0 100.0}}',
  Price: '{{Price 1.0 100.0}}',
  Word: '"{{Word}}"',
  Sentence: '"{{Sentence}}"',
  Paragraph: '"{{Paragraph}}"',
  Bool: '{{Bool}}',
};

const defaultSchemaFields = [
  { label: 'id', type: 'UUID' },
  { label: 'name', type: 'Name' },
  { label: 'email', type: 'Email' },
  { label: 'phone', type: 'Phone' },
  { label: 'created_at', type: 'Recent' },
];

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

function ToolTextArea({
  label,
  value,
  onChange,
  placeholder,
  readOnly,
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
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (value) {
              e.currentTarget.style.backgroundColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--foreground)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = value ? 'var(--muted-foreground)' : 'var(--border)';
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
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
              minHeight: '300px',
              padding: '12px',
              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
              fontSize: '13px',
              lineHeight: 1.5,
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--foreground)',
              resize: 'none',
              outline: 'none',
            }}
          />
        )
      ) : (
        <textarea
          data-testid={dataTestId ? `${dataTestId}-content` : undefined}
          aria-label={label}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            flex: 1,
            width: '100%',
            minHeight: '300px',
            padding: '12px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '13px',
            lineHeight: 1.5,
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            color: 'var(--foreground)',
            resize: 'none',
            outline: 'none',
          }}
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
        overflow: 'hidden',
      }}
    >
      {children}
    </div>
  );
}

function SelectDropdown({ label, value, onChange, options, width = '160px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o) => o.id === value || o.value === value);
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
            {selectedOption?.label || selectedOption?.id || value}
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
              maxHeight: '300px',
              overflowY: 'auto',
            }}
          >
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id || opt.value}
                  onClick={() => {
                    onChange(opt.id || opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '8px 12px',
                    fontSize: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color:
                      value === opt.id || value === opt.value
                        ? 'var(--foreground)'
                        : 'var(--muted-foreground)',
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
                      value === opt.id || value === opt.value
                        ? 'var(--foreground)'
                        : 'var(--muted-foreground)';
                  }}
                >
                  {Icon && <Icon style={{ width: '16px', height: '16px' }} />}
                  {opt.label}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupedSelectDropdown({ label, value, onChange, groups, width = '200px' }) {
  const [isOpen, setIsOpen] = useState(false);
  const allOptions = groups.flatMap((g) => g.items);
  const selectedOption = allOptions.find((o) => o === value);
  return (
    <div style={{ position: 'relative', width }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '32px',
          padding: '0 8px',
          backgroundColor: isOpen ? 'var(--border)' : 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '4px',
          color: 'var(--foreground)',
          fontSize: '13px',
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
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '13px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {value || 'Select type'}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            marginLeft: '4px',
            opacity: 0.6,
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
            maxHeight: '300px',
            overflowY: 'auto',
          }}
        >
          {groups.map((group) => (
            <div key={group.name}>
              <div
                style={{
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--border)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--card)',
                }}
              >
                {group.name}
              </div>
              {group.items.map((item) => (
                <div
                  key={item}
                  onClick={() => {
                    onChange(item);
                    setIsOpen(false);
                  }}
                  style={{
                    padding: '6px 10px',
                    fontSize: '13px',
                    fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                    color: value === item ? '#22c55e' : 'var(--muted-foreground)',
                    cursor: 'pointer',
                    transition: 'all 0.1s ease',
                    backgroundColor: value === item ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (value !== item) {
                      e.currentTarget.style.backgroundColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--foreground)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (value !== item) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--muted-foreground)';
                    }
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const fieldTypeGroups = [
  { name: 'Identity', items: ['UUID', 'ULID'] },
  {
    name: 'Profile',
    items: ['FirstName', 'LastName', 'Name', 'Gender', 'Email', 'Phone', 'JobTitle', 'Company'],
  },
  {
    name: 'Location',
    items: ['Street', 'City', 'State', 'Zip', 'Country', 'Latitude', 'Longitude'],
  },
  { name: 'Web', items: ['URL', 'Domain', 'IP', 'Username', 'Password'] },
  { name: 'Dates', items: ['Past', 'Future', 'Recent', 'Birthday'] },
  { name: 'Numbers', items: ['Int', 'Float', 'Price', 'Bool'] },
  { name: 'Text', items: ['Word', 'Sentence', 'Paragraph'] },
];

function Input({ label, type, value, onChange, placeholder, min, max, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
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
      <input
        type={type || 'text'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        style={{
          padding: '0 12px',
          height: '32px',
          width: '80px',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          color: 'var(--foreground)',
          fontSize: '14px',
          outline: 'none',
        }}
      />
    </div>
  );
}

function SchemaField({ field, index, onUpdate, onRemove }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '8px 12px',
        borderRadius: '6px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--card)',
      }}
    >
      <input
        value={field.label}
        onChange={(e) => onUpdate(index, 'label', e.target.value)}
        placeholder="Field name"
        style={{
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          fontSize: '13px',
          background: 'transparent',
          border: 'none',
          color: 'var(--foreground)',
          width: '120px',
          outline: 'none',
        }}
      />
      <GroupedSelectDropdown
        value={field.type}
        onChange={(val) => onUpdate(index, 'type', val)}
        groups={fieldTypeGroups}
        width="160px"
      />
      <button
        onClick={() => onRemove(index)}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--muted-foreground)',
          cursor: 'pointer',
          padding: '4px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#ef4444';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'var(--muted-foreground)';
        }}
      >
        <Trash2 style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
}

function HelpModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--background)',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 24px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--foreground)' }}>
            Documentation & Help
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--muted-foreground)',
              cursor: 'pointer',
            }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>
        </div>
        <div style={{ padding: '24px' }}>
          <section style={{ marginBottom: '32px' }}>
            <h4 style={{ marginBottom: '8px', color: 'var(--foreground)' }}>
              {HELP_CONTENT.syntax.title}
            </h4>
            <p style={{ marginBottom: '16px', color: 'var(--muted-foreground)' }}>
              {HELP_CONTENT.syntax.description}
            </p>
            <div
              style={{
                backgroundColor: 'var(--background)',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
              }}
            >
              {HELP_CONTENT.syntax.examples.map((ex, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    marginBottom: idx < HELP_CONTENT.syntax.examples.length - 1 ? '12px' : 0,
                    alignItems: 'center',
                  }}
                >
                  <code
                    style={{
                      backgroundColor: 'var(--border)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      minWidth: '300px',
                      color: '#22c55e',
                    }}
                  >
                    {ex.syntax}
                  </code>
                  <span style={{ color: 'var(--muted-foreground)', fontSize: '13px' }}>
                    {ex.desc}
                  </span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h4 style={{ marginBottom: '8px', color: 'var(--foreground)' }}>Available Functions</h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                gap: '12px',
              }}
            >
              {HELP_CONTENT.functions.map((func, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: 'var(--card)',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: 'var(--foreground)',
                      marginBottom: '4px',
                    }}
                  >
                    {func.category}
                  </div>
                  <code style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                    {func.items}
                  </code>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

const TOOL_KEY = 'data-generator';

export default function DataGenerator() {
  const [highlightOn, setHighlightOn] = useState(
    () => localStorage.getItem(`${TOOL_KEY}-editor-highlight`) !== 'false'
  );
  const [format, setFormat] = useState('json');
  const [count, setCount] = useState(10);
  const [output, setOutput] = useState('');
  const [schema, setSchema] = useState(defaultSchemaFields);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isVertical, setIsVertical] = useState(
    () => localStorage.getItem('datagen-layout') === 'vertical'
  );
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    localStorage.setItem('datagen-layout', isVertical ? 'vertical' : 'horizontal');
  }, [isVertical]);

  const buildTemplate = (schemaFields) => {
    const fields = schemaFields
      .map((field) => {
        const template = typeToTemplate[field.type] || '"{{UUID}}"';
        return `  "${field.label}": ${template}`;
      })
      .join(',\n');
    return `{\n${fields}\n}`;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const template = buildTemplate(schema);
      const res = await Generate({ format, count, template });
      if (res && res.output) {
        try {
          const parsed = JSON.parse(res.output);
          if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
            const objects = parsed.map((str) => {
              try {
                return JSON.parse(str);
              } catch {
                return { raw: str };
              }
            });
            setOutput(JSON.stringify(objects, null, 2));
          } else {
            setOutput(JSON.stringify(parsed, null, 2));
          }
        } catch {
          setOutput(res.output);
        }
      } else if (res && res.error) {
        setOutput(`Error: ${res.error}`);
      } else {
        setOutput(JSON.stringify(res, null, 2));
      }
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (output) navigator.clipboard.writeText(output);
  };

  const addField = () =>
    setSchema([...schema, { label: `field_${schema.length + 1}`, type: 'String' }]);
  const updateField = (index, key, value) => {
    const updated = [...schema];
    updated[index] = { ...updated[index], [key]: value };
    setSchema(updated);
  };
  const removeField = (index) => setSchema(schema.filter((_, i) => i !== index));

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
        title="Data Generator"
        description="Generate mock data for testing and development. Create realistic datasets in JSON, CSV, or raw formats."
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <SelectDropdown label="Format" value={format} onChange={setFormat} options={formats} />
          <Input
            label="Count"
            type="number"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            min={1}
            max={1000}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button onClick={handleGenerate} disabled={isGenerating}>
            <Play style={{ width: '14px', height: '14px' }} />{' '}
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
          <Button variant="secondary" onClick={() => setShowHelp(true)}>
            <HelpCircle style={{ width: '14px', height: '14px' }} /> Help
          </Button>
          <div
            style={{
              width: '1px',
              height: '16px',
              backgroundColor: 'var(--border)',
              margin: '0 8px',
            }}
          />
          <EditorToggle enabled={highlightOn} onToggle={setHighlightOn} toolKey={TOOL_KEY} />
          <Button
            variant="secondary"
            onClick={() => setIsVertical(!isVertical)}
            style={{ padding: '4px' }}
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

      <ToolSplitPane isVertical={isVertical}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
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
            Schema Definition
          </label>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--card)',
              }}
            >
              <Button
                size="sm"
                onClick={addField}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <Plus style={{ width: '14px', height: '14px' }} /> Add Field
              </Button>
            </div>
            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflow: 'auto',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {schema.map((field, idx) => (
                <SchemaField
                  key={idx}
                  field={field}
                  index={idx}
                  onUpdate={updateField}
                  onRemove={removeField}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <ToolTextArea
            label="Generated Output"
            value={output}
            readOnly
            placeholder="Generated data will appear here..."
            highlightOn={highlightOn}
            language="json"
            dataTestId="data-generator-output"
          />
          {output && (
            <div style={{ marginTop: '12px' }}>
              <Button onClick={handleCopy} style={{ backgroundColor: 'var(--success)' }}>
                <Copy style={{ width: '14px', height: '14px' }} /> Copy to Clipboard
              </Button>
            </div>
          )}
        </div>
      </ToolSplitPane>
      <HelpModal open={showHelp} onClose={() => setShowHelp(false)} />
    </div>
  );
}
