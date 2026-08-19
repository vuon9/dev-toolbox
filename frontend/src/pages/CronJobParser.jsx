import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import cronstrue from 'cronstrue';

const CRON_FIELDS = {
  minute: {
    label: 'Minute',
    min: 0,
    max: 59,
    validRange: '0-59',
    examples: '*  */5  0,15,30  0-30',
    presets: [
      { label: 'Every minute', value: '*' },
      { label: 'Every 5 min', value: '*/5' },
      { label: 'Every 15 min', value: '*/15' },
      { label: 'Every 30 min', value: '*/30' },
      { label: 'At :00', value: '0' },
      { label: 'At :30', value: '30' },
    ],
  },
  hour: {
    label: 'Hour',
    min: 0,
    max: 23,
    validRange: '0-23',
    examples: '*  */2  0,12,18  9-17',
    presets: [
      { label: 'Every hour', value: '*' },
      { label: 'Every 2 hours', value: '*/2' },
      { label: 'Every 6 hours', value: '*/6' },
      { label: 'At midnight', value: '0' },
      { label: 'At noon', value: '12' },
    ],
  },
  day: {
    label: 'Day',
    min: 1,
    max: 31,
    validRange: '1-31',
    examples: '*  */5  1,15  1-15  L',
    presets: [
      { label: 'Every day', value: '*' },
      { label: '1st', value: '1' },
      { label: '15th', value: '15' },
      { label: 'Last day', value: 'L' },
    ],
  },
  month: {
    label: 'Month',
    min: 1,
    max: 12,
    validRange: '1-12',
    examples: '*  */3  1,4,7,10  1-6',
    presets: [
      { label: 'Every month', value: '*' },
      { label: 'Jan-Mar', value: '1-3' },
      { label: 'Apr-Jun', value: '4-6' },
    ],
  },
  weekday: {
    label: 'Weekday',
    min: 0,
    max: 7,
    validRange: '0-7 (0=Sun)',
    examples: '*  1-5  0,6  1,3,5',
    presets: [
      { label: 'Every day', value: '*' },
      { label: 'Mon-Fri', value: '1-5' },
      { label: 'Weekends', value: '0,6' },
      { label: 'Mon', value: '1' },
    ],
  },
};

const EXPRESSION_PRESETS = [
  { name: 'Every Minute', expr: '* * * * *', desc: 'Run every minute' },
  { name: 'Every 5 Min', expr: '*/5 * * * *', desc: 'Run every 5 minutes' },
  { name: 'Every 15 Min', expr: '*/15 * * * *', desc: 'Run every 15 minutes' },
  { name: 'Every 30 Min', expr: '*/30 * * * *', desc: 'Run every 30 minutes' },
  { name: 'Hourly', expr: '0 * * * *', desc: 'Run at the start of every hour' },
  { name: 'Daily', expr: '0 0 * * *', desc: 'Run once a day at midnight' },
  { name: 'Daily 6am', expr: '0 6 * * *', desc: 'Run every day at 6am' },
  { name: 'Daily 9am', expr: '0 9 * * *', desc: 'Run every day at 9am' },
  { name: 'Daily 6pm', expr: '0 18 * * *', desc: 'Run every day at 6pm' },
  { name: 'Twice Daily', expr: '0 */12 * * *', desc: 'Run every 12 hours' },
  { name: 'Weekdays', expr: '0 9 * * 1-5', desc: 'Run at 9am on weekdays' },
  { name: 'Weekly', expr: '0 0 * * 0', desc: 'Run once a week on Sunday' },
  { name: 'Weekly Mon', expr: '0 0 * * 1', desc: 'Run once a week on Monday' },
  { name: 'Bi-Weekly', expr: '0 0 */14 * *', desc: 'Run every 14 days' },
  { name: 'Monthly', expr: '0 0 1 * *', desc: 'Run on the 1st of each month' },
  { name: 'Monthly 15th', expr: '0 0 15 * *', desc: 'Run on the 15th of each month' },
  { name: 'Monthly Last', expr: '0 0 L * *', desc: 'Run on the last day of each month' },
  { name: 'Quarterly', expr: '0 0 1 */3 *', desc: 'Run every quarter' },
  { name: 'Yearly', expr: '0 0 1 1 *', desc: 'Run once a year on Jan 1st' },
];

function parseCronExpression(expr) {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  return {
    minute: parts[0] || '*',
    hour: parts[1] || '*',
    day: parts[2] || '*',
    month: parts[3] || '*',
    weekday: parts[4] || '*',
  };
}

function buildExpression(fields) {
  return `${fields.minute} ${fields.hour} ${fields.day} ${fields.month} ${fields.weekday}`;
}

function findPreviousExecution(expr, beforeDate) {
  try {
    const [minute, hour, day, month, weekday] = expr.split(/\s+/);
    let current = new Date(beforeDate);
    let attempts = 0;
    const maxAttempts = 365 * 24 * 60;
    while (attempts < maxAttempts) {
      current = new Date(current.getTime() - 60000);
      attempts++;
      const matchesMinute = matchCronField(minute, current.getMinutes());
      const matchesHour = matchCronField(hour, current.getHours());
      const matchesDay = matchCronField(day, current.getDate());
      const matchesMonth = matchCronField(month, current.getMonth() + 1);
      const matchesWeekday = matchCronField(weekday, current.getDay());
      if (matchesMinute && matchesHour && matchesDay && matchesMonth && matchesWeekday) {
        return new Date(current);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function findNextExecution(expr, afterDate) {
  try {
    const [minute, hour, day, month, weekday] = expr.split(/\s+/);
    let current = new Date(afterDate);
    let attempts = 0;
    const maxAttempts = 365 * 24 * 60;
    while (attempts < maxAttempts) {
      current = new Date(current.getTime() + 60000);
      attempts++;
      const matchesMinute = matchCronField(minute, current.getMinutes());
      const matchesHour = matchCronField(hour, current.getHours());
      const matchesDay = matchCronField(day, current.getDate());
      const matchesMonth = matchCronField(month, current.getMonth() + 1);
      const matchesWeekday = matchCronField(weekday, current.getDay());
      if (matchesMinute && matchesHour && matchesDay && matchesMonth && matchesWeekday) {
        return new Date(current);
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

function matchCronField(pattern, value) {
  if (pattern === '*') return true;
  if (pattern === 'L' && value >= 28) return true;
  if (pattern.includes('/')) {
    const [range, step] = pattern.split('/');
    const stepNum = parseInt(step);
    if (range === '*') return value % stepNum === 0;
  }
  if (pattern.includes('-')) {
    const [start, end] = pattern.split('-').map(Number);
    return value >= start && value <= end;
  }
  if (pattern.includes(',')) {
    const values = pattern.split(',').map(Number);
    return values.includes(value);
  }
  return parseInt(pattern) === value;
}

function getFieldDescription(value, label) {
  if (value === '*') return 'Any ' + label.toLowerCase();
  if (value.includes('/')) {
    const step = value.split('/')[1];
    return `Every ${step}`;
  }
  if (value.includes('-')) {
    const [start, end] = value.split('-');
    return `${start}-${end}`;
  }
  if (value.includes(',')) {
    return value.split(',').join(', ');
  }
  if (value === 'L') return 'Last day';
  return `At ${value}`;
}

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

export default function CronJobParser() {
  const [expression, setExpression] = useState('*/15 * * * *');
  const [fields, setFields] = useState(() => parseCronExpression('*/15 * * * *'));
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('Every 15 Min');

  const [now, setNow] = useState(new Date());
  const [prevExecutions, setPrevExecutions] = useState([]);
  const [nextExecutions, setNextExecutions] = useState([]);

  const fieldColors = {
    minute: '#22c55e',
    hour: '#3b82f6',
    day: '#eab308',
    month: '#ef4444',
    weekday: '#a855f7',
  };

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const nextFromNow = useMemo(() => {
    if (error) return null;
    return findNextExecution(expression, now);
  }, [expression, now, error]);

  const formatCountdown = (targetDate) => {
    if (!targetDate) return '—';
    const diff = targetDate - now;
    if (diff <= 0) return 'now';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  useEffect(() => {
    try {
      const desc = cronstrue.toString(expression);
      setDescription(desc);
      setError('');
      let prev1 = findPreviousExecution(expression, now);
      let prev2 = prev1 ? findPreviousExecution(expression, prev1) : null;
      let next1 = findNextExecution(expression, now);
      let next2 = next1 ? findNextExecution(expression, next1) : null;
      setPrevExecutions([prev2, prev1].filter(Boolean));
      setNextExecutions([next1, next2].filter(Boolean));
    } catch (e) {
      setError('Invalid cron expression');
      setDescription('');
      setPrevExecutions([]);
      setNextExecutions([]);
    }
  }, [expression, now]);

  const formatDate = (date) => {
    if (!date) return '—';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleExpressionChange = (newExpr) => {
    setExpression(newExpr);
    const newFields = parseCronExpression(newExpr);
    if (newFields) {
      setFields(newFields);
      setSelectedPreset('');
    }
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
        title="Cron Job Parser"
        description="Build and validate cron expressions with an interactive visual builder."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

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
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Quick Presets
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {EXPRESSION_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  size="sm"
                  active={selectedPreset === preset.name}
                  onClick={() => {
                    const newFields = parseCronExpression(preset.expr);
                    if (newFields) {
                      setFields(newFields);
                      setExpression(preset.expr);
                      setSelectedPreset(preset.name);
                    }
                  }}
                  title={preset.desc}
                >
                  {preset.name}
                </Button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Expression
            </div>
            <input
              type="text"
              value={expression}
              onChange={(e) => handleExpressionChange(e.target.value)}
              spellCheck={false}
              style={{
                width: '100%',
                padding: '10px 12px',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 500,
                backgroundColor: 'var(--card)',
                border: error ? '1px solid var(--destructive)' : '1px solid var(--border)',
                borderRadius: '8px',
                color: 'var(--foreground)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            <div
              style={{
                marginTop: '6px',
                fontSize: '12px',
                color: error ? 'var(--destructive)' : 'var(--muted-foreground)',
              }}
            >
              {error || description}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '8px',
              }}
            >
              Field Breakdown
            </div>
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Field
                    </th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Value
                    </th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Description
                    </th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Valid Range & Examples
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {['minute', 'hour', 'day', 'month', 'weekday'].map((fieldName, index) => {
                    const config = CRON_FIELDS[fieldName];
                    const value = fields[fieldName];
                    const color = fieldColors[fieldName];
                    return (
                      <tr
                        key={fieldName}
                        style={{ borderBottom: index < 4 ? '1px solid var(--border)' : 'none' }}
                      >
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: 500,
                              color,
                              borderBottom: `2px solid ${color}`,
                              paddingBottom: '2px',
                            }}
                          >
                            {config.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <span
                            style={{
                              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                              fontSize: '13px',
                              fontWeight: 500,
                              color: 'var(--primary)',
                            }}
                          >
                            {value}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>
                            {getFieldDescription(value, config.label)}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', verticalAlign: 'middle' }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                              fontWeight: 500,
                              color: 'var(--muted-foreground)',
                            }}
                          >
                            {config.validRange}
                          </div>
                          <div
                            style={{ fontSize: '11px', color: 'var(--border)', marginTop: '4px' }}
                          >
                            e.g. {config.examples}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--muted-foreground)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '12px',
              }}
            >
              Execution Timeline
            </div>
            <div
              style={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                overflow: 'hidden',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        width: '28px',
                      }}
                    ></th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Label
                    </th>
                    <th
                      style={{
                        padding: '8px 12px',
                        textAlign: 'left',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: 'var(--muted-foreground)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <button
                        onClick={() =>
                          prevExecutions[0] &&
                          handleExpressionChange(
                            buildExpression(parseCronExpression(expression) || {})
                          )
                        }
                        disabled={prevExecutions.length === 0}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color:
                            prevExecutions.length > 0 ? 'var(--muted-foreground)' : 'var(--border)',
                          cursor: prevExecutions.length > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <ChevronLeft style={{ width: '16px', height: '16px' }} />
                      </button>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontSize: '11px',
                          fontWeight: 500,
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        Previous
                      </div>
                      {prevExecutions[1] && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            marginTop: '4px',
                          }}
                        >
                          2 ago
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                          fontWeight: 500,
                          color: 'var(--muted-foreground)',
                        }}
                      >
                        {prevExecutions[0] ? formatDate(prevExecutions[0]) : '—'}
                      </div>
                      {prevExecutions[1] && (
                        <div
                          style={{
                            fontSize: '11px',
                            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                            color: 'var(--muted-foreground)',
                            marginTop: '4px',
                          }}
                        >
                          {formatDate(prevExecutions[1])}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr
                    style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      borderBottom: '1px solid rgba(59, 130, 246, 0.2)',
                    }}
                  >
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <button
                        onClick={() => setNow(new Date())}
                        title="Reset to now"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'var(--primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <RefreshCw style={{ width: '14px', height: '14px' }} />
                      </button>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--primary)' }}>
                        Current
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--success)', marginTop: '4px' }}>
                        Next in
                      </div>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                          fontWeight: 500,
                          color: 'var(--primary)',
                        }}
                      >
                        {formatDate(now)}
                      </div>
                      <div
                        style={{
                          fontSize: '11px',
                          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                          fontWeight: 500,
                          color: 'var(--success)',
                          marginTop: '4px',
                        }}
                      >
                        {formatCountdown(nextFromNow)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <button
                        onClick={() =>
                          nextExecutions[0] &&
                          handleExpressionChange(
                            buildExpression(parseCronExpression(expression) || {})
                          )
                        }
                        disabled={nextExecutions.length === 0}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          padding: '6px',
                          backgroundColor: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          color: nextExecutions.length > 0 ? 'var(--success)' : 'var(--border)',
                          cursor: nextExecutions.length > 0 ? 'pointer' : 'not-allowed',
                        }}
                      >
                        <ChevronRight style={{ width: '16px', height: '16px' }} />
                      </button>
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--success)' }}>
                        Next
                      </div>
                      {nextExecutions[1] && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--muted-foreground)',
                            marginTop: '4px',
                          }}
                        >
                          2 later
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                      <div
                        style={{
                          fontSize: '12px',
                          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                          fontWeight: 500,
                          color: 'var(--foreground)',
                        }}
                      >
                        {nextExecutions[0] ? formatDate(nextExecutions[0]) : '—'}
                      </div>
                      {nextExecutions[1] && (
                        <div
                          style={{
                            fontSize: '11px',
                            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                            color: 'var(--muted-foreground)',
                            marginTop: '4px',
                          }}
                        >
                          {formatDate(nextExecutions[1])}
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
