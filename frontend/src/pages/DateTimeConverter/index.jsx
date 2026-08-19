import React, { useState, useEffect, useMemo } from 'react';
import { Copy, Check, Clock, Globe, Star, Trash2, ArrowRight, GripVertical } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Backend service functions (Wails bindings)
// These will be injected at runtime by Wails
const Convert =
  window.go?.service?.DateTimeService?.Convert ||
  (async (req) => {
    // Fallback implementation for development
    const input = req.input || req.Input || '';
    const isTimestamp = /^\d+$/.test(input);
    let date;

    if (isTimestamp) {
      const val = parseInt(input, 10);
      date = new Date(val > 1e12 ? val : val * 1000);
    } else {
      date = new Date(input);
    }

    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    return {
      result: {
        unixSeconds: Math.floor(date.getTime() / 1000),
        unixMillis: date.getTime(),
        unixMicros: date.getTime() * 1000,
        utc: date.toISOString(),
        local: date.toLocaleString(),
        relative: 'just now',
      },
      detectedType: isTimestamp ? 'timestamp' : 'iso',
      detectedPrec: isTimestamp ? (input.length > 10 ? 'millis' : 'seconds') : '',
    };
  });

const GetAvailableTimezones =
  window.go?.service?.DateTimeService?.GetAvailableTimezones ||
  (async () => {
    // Fallback list of common timezones
    return {
      timezones: [
        { label: 'UTC', timezone: 'UTC' },
        { label: 'Asia/Ho_Chi_Minh', timezone: 'Asia/Ho_Chi_Minh' },
        { label: 'America/New_York', timezone: 'America/New_York' },
        { label: 'America/Los_Angeles', timezone: 'America/Los_Angeles' },
        { label: 'Europe/London', timezone: 'Europe/London' },
        { label: 'Europe/Paris', timezone: 'Europe/Paris' },
        { label: 'Asia/Tokyo', timezone: 'Asia/Tokyo' },
        { label: 'Asia/Singapore', timezone: 'Asia/Singapore' },
        { label: 'Australia/Sydney', timezone: 'Australia/Sydney' },
        { label: 'Asia/Dubai', timezone: 'Asia/Dubai' },
        { label: 'Asia/Shanghai', timezone: 'Asia/Shanghai' },
        { label: 'Asia/Hong_Kong', timezone: 'Asia/Hong_Kong' },
        { label: 'Europe/Berlin', timezone: 'Europe/Berlin' },
        { label: 'America/Chicago', timezone: 'America/Chicago' },
        { label: 'America/Denver', timezone: 'America/Denver' },
        { label: 'America/Phoenix', timezone: 'America/Phoenix' },
        { label: 'America/Toronto', timezone: 'America/Toronto' },
        { label: 'America/Vancouver', timezone: 'America/Vancouver' },
        { label: 'Pacific/Auckland', timezone: 'Pacific/Auckland' },
        { label: 'Asia/Seoul', timezone: 'Asia/Seoul' },
        { label: 'Asia/Mumbai', timezone: 'Asia/Mumbai' },
        { label: 'Asia/Bangkok', timezone: 'Asia/Bangkok' },
        { label: 'Asia/Jakarta', timezone: 'Asia/Jakarta' },
        { label: 'Europe/Moscow', timezone: 'Europe/Moscow' },
      ],
    };
  });

export default function DateTimeConverter() {
  const [input, setInput] = useState('1710508200');
  const [detectedFormat, setDetectedFormat] = useState('Unix Timestamp (seconds)');
  const [results, setResults] = useState(null);
  const [favoriteTimezones, setFavoriteTimezones] = useLocalStorage('datetime-favorite-timezones', [
    'Asia/Ho_Chi_Minh',
    'America/New_York',
  ]);
  const [fromTimezone, setFromTimezone] = useState('Asia/Ho_Chi_Minh');
  const [toTimezone, setToTimezone] = useState('America/New_York');
  const [timezoneResult, setTimezoneResult] = useState(null);
  const [availableTimezones, setAvailableTimezones] = useState([]);
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Dnd-kit sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end for reordering favorites
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFavoriteTimezones((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Real-time clock updates (every second for live ticking clock)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load available timezones from backend
  useEffect(() => {
    const loadTimezones = async () => {
      try {
        const response = await GetAvailableTimezones();
        if (response?.timezones) {
          setAvailableTimezones(response.timezones);
        }
      } catch (err) {
        console.error('Failed to load timezones:', err);
      }
    };
    loadTimezones();
  }, []);

  // Detect input format
  const detectInputFormat = (value) => {
    if (!value) return '';

    const trimmed = value.trim();

    // Check for ISO 8601 format
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(trimmed)) {
      return 'ISO 8601 Date';
    }

    // Check for timestamp (all digits)
    if (/^\d+$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      // If greater than 1 billion and has 10 digits, likely seconds
      // If greater than 1 trillion and has 13 digits, likely milliseconds
      if (trimmed.length === 10) {
        return 'Unix Timestamp (seconds)';
      } else if (trimmed.length === 13) {
        return 'Unix Timestamp (milliseconds)';
      } else if (num > 1e15) {
        return 'Unix Timestamp (microseconds)';
      } else {
        return 'Unix Timestamp';
      }
    }

    // Check for RFC 2822 format
    if (/^[A-Za-z]{3},\s+\d{1,2}\s+[A-Za-z]{3}/.test(trimmed)) {
      return 'RFC 2822 Date';
    }

    // Check for common date formats
    if (/^\d{1,2}\/\d{1,2}\/\d{4}/.test(trimmed)) {
      return 'Date (MM/DD/YYYY)';
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      return 'Date (YYYY-MM-DD)';
    }

    return 'Unknown Format';
  };

  // Convert input
  const convertInput = async (value) => {
    if (!value) {
      setResults(null);
      return;
    }

    try {
      const format = detectInputFormat(value);
      setDetectedFormat(format);

      const response = await Convert({ input: value });

      if (response?.result) {
        setResults({
          seconds: response.result.unixSeconds,
          milliseconds: response.result.unixMillis,
          micros: response.result.unixMicros,
          iso: response.result.utc,
          local: response.result.local,
          relative: response.result.relative,
        });

        // Also trigger timezone conversion if we have a result
        await convertTimezone(response.result.unixMillis, fromTimezone, toTimezone);
      } else if (response?.error) {
        console.error('Conversion error:', response.error);
        setResults(null);
      }
    } catch (err) {
      console.error('Failed to convert:', err);
      setResults(null);
    }
  };

  // Convert between timezones
  const convertTimezone = async (timestampMs, from, to) => {
    try {
      const date = new Date(timestampMs);

      // Use Intl.DateTimeFormat for timezone conversion
      const fromFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: from,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const toFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: to,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });

      const fromParts = fromFormatter.formatToParts(date);
      const toParts = toFormatter.formatToParts(date);

      const getPart = (parts, type) => parts.find((p) => p.type === type)?.value;

      const fromFormatted = `${getPart(fromParts, 'year')}-${getPart(fromParts, 'month')}-${getPart(fromParts, 'day')} ${getPart(fromParts, 'hour')}:${getPart(fromParts, 'minute')}:${getPart(fromParts, 'second')}`;
      const toFormatted = `${getPart(toParts, 'year')}-${getPart(toParts, 'month')}-${getPart(toParts, 'day')} ${getPart(toParts, 'hour')}:${getPart(toParts, 'minute')}:${getPart(toParts, 'second')}`;

      // Calculate offset
      const getOffset = (tz) => {
        const now = new Date();
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: tz }));
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const offset = (tzDate - utcDate) / (1000 * 60);
        const hours = Math.floor(Math.abs(offset) / 60);
        const mins = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        return `GMT${sign}${hours}${mins > 0 ? ':' + String(mins).padStart(2, '0') : ''}`;
      };

      setTimezoneResult({
        from: fromFormatted,
        to: toFormatted,
        fromOffset: getOffset(from),
        toOffset: getOffset(to),
        fromTz: from,
        toTz: to,
      });
    } catch (err) {
      console.error('Timezone conversion error:', err);
      setTimezoneResult(null);
    }
  };

  // Copy to clipboard
  const copyToClipboard = async (text, format) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Add favorite timezone
  const addFavorite = (tz) => {
    if (!favoriteTimezones.includes(tz)) {
      setFavoriteTimezones([...favoriteTimezones, tz]);
    }
  };

  // Remove favorite timezone
  const removeFavorite = (tz) => {
    setFavoriteTimezones(favoriteTimezones.filter((t) => t !== tz));
  };

  // Get timezone info for world clock (uses converted timestamp or current time)
  const getTimezoneInfo = (tz, timestampMs = null) => {
    try {
      const now = timestampMs ? new Date(timestampMs) : currentTime;
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });

      const dateFormatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

      // Calculate offset
      const getOffset = (timezone) => {
        const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
        const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
        const offset = (tzDate - utcDate) / (1000 * 60);
        const hours = Math.floor(Math.abs(offset) / 60);
        const mins = Math.abs(offset) % 60;
        const sign = offset >= 0 ? '+' : '-';
        return `GMT${sign}${hours}${mins > 0 ? ':' + String(mins).padStart(2, '0') : ''}`;
      };

      const parts = tz.split('/');
      const city = parts[parts.length - 1].replace(/_/g, ' ');
      const region = parts[0];

      return {
        city,
        region,
        timezone: tz,
        time: formatter.format(now),
        date: dateFormatter.format(now),
        offset: getOffset(tz),
      };
    } catch (err) {
      return { city: tz, timezone: tz, time: '--:--', date: '', offset: '' };
    }
  };

  // Sortable timezone card component - compact table-style layout
  const SortableTimezoneCard = ({ tz, info, onRemove }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
      id: tz,
    });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'var(--background)',
          borderBottom: '1px solid var(--border)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        {...attributes}
      >
        {/* Drag handle */}
        <div
          style={{
            color: 'var(--border)',
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            flexShrink: 0,
          }}
          {...listeners}
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </div>

        {/* City and timezone info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
            {info.city}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>{info.timezone}</div>
        </div>

        {/* Time */}
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--foreground)',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            flexShrink: 0,
          }}
        >
          {info.time}
        </div>

        {/* Offset */}
        <div
          style={{
            fontSize: '11px',
            color: 'var(--muted-foreground)',
            padding: '2px 6px',
            backgroundColor: 'var(--card)',
            borderRadius: '4px',
            flexShrink: 0,
          }}
        >
          {info.offset}
        </div>

        {/* Remove button */}
        <button
          onClick={() => onRemove(tz)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--muted-foreground)',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
          title="Remove from favorites"
        >
          <Trash2 size={12} />
        </button>
      </div>
    );
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    convertInput(value);
  };

  // Handle timezone changes
  useEffect(() => {
    if (results?.milliseconds) {
      convertTimezone(results.milliseconds, fromTimezone, toTimezone);
    }
  }, [fromTimezone, toTimezone, results?.milliseconds]);

  // Initial conversion
  useEffect(() => {
    convertInput(input);
  }, []);

  // Get sorted timezones with favorites first
  const sortedTimezones = useMemo(() => {
    if (!availableTimezones.length) return [];

    const favorites = availableTimezones.filter((tz) => favoriteTimezones.includes(tz.timezone));
    const others = availableTimezones.filter((tz) => !favoriteTimezones.includes(tz.timezone));

    return [
      ...favorites.map((tz) => ({ ...tz, isFavorite: true })),
      ...others.map((tz) => ({ ...tz, isFavorite: false })),
    ];
  }, [availableTimezones, favoriteTimezones]);

  // Quick presets
  const handleQuickPreset = (preset) => {
    let newVal = '';
    const now = new Date();

    if (preset === 'now') {
      newVal = Math.floor(now.getTime() / 1000).toString();
    } else if (preset === 'today') {
      now.setHours(0, 0, 0, 0);
      newVal = Math.floor(now.getTime() / 1000).toString();
    } else if (preset === 'tomorrow') {
      now.setDate(now.getDate() + 1);
      now.setHours(0, 0, 0, 0);
      newVal = Math.floor(now.getTime() / 1000).toString();
    } else if (preset === 'iso-now') {
      newVal = now.toISOString();
    }

    setInput(newVal);
    convertInput(newVal);
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
      <div style={{ marginBottom: '20px' }}>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: 'var(--foreground)',
          }}
        >
          DateTime Converter
        </h2>
        <p style={{ color: 'var(--muted-foreground)', marginTop: '4px', fontSize: '14px' }}>
          Convert between Unix timestamps, ISO dates, and timezones
        </p>
        <div style={{ marginTop: '16px', borderBottom: '1px solid var(--border)' }} />
      </div>

      {/* Main 2-column layout */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        {/* Left Column - Stacked sections */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'auto',
            paddingRight: '8px',
          }}
        >
          {/* 1. Your Current Local Time - At top */}
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              <Globe
                size={12}
                style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}
              />
              Your current local time
            </span>
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  letterSpacing: '-0.02em',
                }}
              >
                {currentTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true,
                })}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '6px' }}>
                {currentTime.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
            </div>
          </div>

          {/* 2. Input Section */}
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              Input
            </span>
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              {/* Quick presets */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <Button size="sm" onClick={() => handleQuickPreset('now')}>
                  Now (Unix)
                </Button>
                <Button size="sm" onClick={() => handleQuickPreset('iso-now')}>
                  Now (ISO)
                </Button>
                <Button size="sm" onClick={() => handleQuickPreset('today')}>
                  Today 00:00
                </Button>
                <Button size="sm" onClick={() => handleQuickPreset('tomorrow')}>
                  Tomorrow 00:00
                </Button>
              </div>

              {/* Input field */}
              <input
                type="text"
                value={input}
                onChange={handleInputChange}
                placeholder="Enter timestamp, ISO date, or any date format..."
                style={{
                  width: '100%',
                  padding: '12px',
                  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                  fontSize: '14px',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  borderRadius: '6px',
                  color: 'var(--foreground)',
                  outline: 'none',
                }}
              />

              {/* Format detection badge */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                  Recognized as:
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    padding: '4px 10px',
                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                    color: 'var(--primary)',
                    borderRadius: '4px',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                  }}
                >
                  {detectedFormat}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Conversion Results */}
          {results && (
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '12px',
                }}
              >
                <Clock
                  size={12}
                  style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}
                />
                Conversion Results
              </span>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Unix Seconds */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        minWidth: '100px',
                      }}
                    >
                      Seconds
                    </span>
                    <code
                      style={{
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                        color: 'var(--foreground)',
                        flex: 1,
                        textAlign: 'right',
                        marginRight: '12px',
                      }}
                    >
                      {results.seconds}
                    </code>
                    <button
                      onClick={() => copyToClipboard(results.seconds.toString(), 'seconds')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color:
                          copiedFormat === 'seconds' ? 'var(--success)' : 'var(--muted-foreground)',
                      }}
                    >
                      {copiedFormat === 'seconds' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Milliseconds */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        minWidth: '100px',
                      }}
                    >
                      Milliseconds
                    </span>
                    <code
                      style={{
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                        color: 'var(--foreground)',
                        flex: 1,
                        textAlign: 'right',
                        marginRight: '12px',
                      }}
                    >
                      {results.milliseconds}
                    </code>
                    <button
                      onClick={() =>
                        copyToClipboard(results.milliseconds.toString(), 'milliseconds')
                      }
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color:
                          copiedFormat === 'milliseconds'
                            ? 'var(--success)'
                            : 'var(--muted-foreground)',
                      }}
                    >
                      {copiedFormat === 'milliseconds' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* ISO 8601 */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        minWidth: '100px',
                      }}
                    >
                      ISO 8601
                    </span>
                    <code
                      style={{
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                        color: 'var(--foreground)',
                        flex: 1,
                        textAlign: 'right',
                        marginRight: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {results.iso}
                    </code>
                    <button
                      onClick={() => copyToClipboard(results.iso, 'iso')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color:
                          copiedFormat === 'iso' ? 'var(--success)' : 'var(--muted-foreground)',
                      }}
                    >
                      {copiedFormat === 'iso' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Local Time */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        minWidth: '100px',
                      }}
                    >
                      Local Time
                    </span>
                    <code
                      style={{
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                        color: 'var(--foreground)',
                        flex: 1,
                        textAlign: 'right',
                        marginRight: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {results.local}
                    </code>
                    <button
                      onClick={() => copyToClipboard(results.local, 'local')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color:
                          copiedFormat === 'local' ? 'var(--success)' : 'var(--muted-foreground)',
                      }}
                    >
                      {copiedFormat === 'local' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* UTC */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        minWidth: '100px',
                      }}
                    >
                      UTC
                    </span>
                    <code
                      style={{
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                        color: 'var(--foreground)',
                        flex: 1,
                        textAlign: 'right',
                        marginRight: '12px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {results.iso}
                    </code>
                    <button
                      onClick={() => copyToClipboard(results.iso, 'utc')}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        color:
                          copiedFormat === 'utc' ? 'var(--success)' : 'var(--muted-foreground)',
                      }}
                    >
                      {copiedFormat === 'utc' ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Relative time */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--background)',
                      borderRadius: '6px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--muted-foreground)',
                        minWidth: '100px',
                      }}
                    >
                      Relative
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        color: 'var(--muted-foreground)',
                        flex: 1,
                        textAlign: 'right',
                        marginRight: '12px',
                      }}
                    >
                      {results.relative}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Favorite Timezones + Timezone Converter */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'auto',
          }}
        >
          {/* Timezone Converter - Moved to right column */}
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              <Globe
                size={12}
                style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}
              />
              Timezone Converter
            </span>
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}
              >
                {/* From timezone */}
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                      marginBottom: '4px',
                      display: 'block',
                    }}
                  >
                    From
                  </label>
                  <select
                    value={fromTimezone}
                    onChange={(e) => setFromTimezone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <optgroup label="Favorites">
                      {sortedTimezones
                        .filter((tz) => tz.isFavorite)
                        .map((tz) => (
                          <option key={tz.timezone} value={tz.timezone}>
                            ★ {tz.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="All Timezones">
                      {sortedTimezones
                        .filter((tz) => !tz.isFavorite)
                        .map((tz) => (
                          <option key={tz.timezone} value={tz.timezone}>
                            {tz.label}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>

                <ArrowRight
                  size={20}
                  style={{ color: 'var(--muted-foreground)', marginTop: '16px' }}
                />

                {/* To timezone */}
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: '11px',
                      color: 'var(--muted-foreground)',
                      marginBottom: '4px',
                      display: 'block',
                    }}
                  >
                    To
                  </label>
                  <select
                    value={toTimezone}
                    onChange={(e) => setToTimezone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      color: 'var(--foreground)',
                      fontSize: '12px',
                      cursor: 'pointer',
                    }}
                  >
                    <optgroup label="Favorites">
                      {sortedTimezones
                        .filter((tz) => tz.isFavorite)
                        .map((tz) => (
                          <option key={tz.timezone} value={tz.timezone}>
                            ★ {tz.label}
                          </option>
                        ))}
                    </optgroup>
                    <optgroup label="All Timezones">
                      {sortedTimezones
                        .filter((tz) => !tz.isFavorite)
                        .map((tz) => (
                          <option key={tz.timezone} value={tz.timezone}>
                            {tz.label}
                          </option>
                        ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Add to favorites button */}
              <div style={{ marginBottom: '12px' }}>
                <Button
                  onClick={() => addFavorite(toTimezone)}
                  disabled={favoriteTimezones.includes(toTimezone)}
                  style={{
                    opacity: favoriteTimezones.includes(toTimezone) ? 0.5 : 1,
                  }}
                >
                  <Star size={14} />
                  Add to Favorites
                </Button>
              </div>

              {/* Conversion result */}
              {timezoneResult && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    padding: '12px',
                    backgroundColor: 'var(--background)',
                    borderRadius: '6px',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        marginBottom: '4px',
                      }}
                    >
                      {timezoneResult.fromTz} ({timezoneResult.fromOffset})
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--foreground)', fontWeight: 500 }}>
                      {timezoneResult.from}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted-foreground)',
                        marginBottom: '4px',
                      }}
                    >
                      {timezoneResult.toTz} ({timezoneResult.toOffset})
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500 }}>
                      {timezoneResult.to}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Favorite Timezones Panel */}
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '12px',
              }}
            >
              <Clock
                size={12}
                style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}
              />
              Your Favorite Timezones
            </span>
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              {favoriteTimezones.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: 'var(--muted-foreground)',
                    fontSize: '13px',
                  }}
                >
                  No favorite timezones yet.
                  <br />
                  Add them from the converter below.
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={favoriteTimezones} strategy={verticalListSortingStrategy}>
                    <div>
                      {favoriteTimezones.map((tz) => {
                        const info = getTimezoneInfo(tz, results?.milliseconds);
                        return (
                          <SortableTimezoneCard
                            key={tz}
                            tz={tz}
                            info={info}
                            onRemove={removeFavorite}
                          />
                        );
                      })}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
