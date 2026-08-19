import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Regex, Copy, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';

// Escape HTML special characters
const escapeHtml = (text) => {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

// Group colors for highlighting
const GROUP_COLORS = [
  { bg: 'rgba(34, 197, 94, 0.5)', text: '#22c55e' }, // Green (full match)
  { bg: 'rgba(59, 130, 246, 0.5)', text: '#3b82f6' }, // Blue
  { bg: 'rgba(234, 179, 8, 0.5)', text: '#eab308' }, // Yellow
  { bg: 'rgba(239, 68, 68, 0.5)', text: '#ef4444' }, // Red
  { bg: 'rgba(168, 85, 247, 0.5)', text: '#a855f7' }, // Purple
  { bg: 'rgba(20, 184, 166, 0.5)', text: '#14b8a6' }, // Teal
  { bg: 'rgba(236, 72, 153, 0.5)', text: '#ec4899' }, // Pink
  { bg: 'rgba(249, 115, 22, 0.5)', text: '#f97316' }, // Orange
];

// Highlight regex pattern with group colors (tracks actual capturing group numbers)
const highlightRegexPattern = (pattern) => {
  if (!pattern) return '';

  let result = '';
  let capturingGroupNum = 0; // Only counts capturing groups (match[1], match[2], etc.)
  let groupStack = []; // Stack of { isCapturing: bool, groupNum: int }
  let i = 0;
  let escaped = false;
  let charClass = false;

  while (i < pattern.length) {
    const char = pattern[i];

    // Handle escape sequences
    if (escaped) {
      result += escapeHtml('\\' + char);
      escaped = false;
      i++;
      continue;
    }

    if (char === '\\' && !charClass) {
      escaped = true;
      i++;
      continue;
    }

    // Handle character class
    if (char === '[' && !charClass) {
      charClass = true;
      result += escapeHtml(char);
      i++;
      continue;
    }

    if (char === ']' && charClass) {
      charClass = false;
      result += escapeHtml(char);
      i++;
      continue;
    }

    if (charClass) {
      result += escapeHtml(char);
      i++;
      continue;
    }

    // Handle groups
    if (char === '(') {
      let isCapturing = true;
      let groupPrefix = '';

      // Check for non-capturing, lookaheads, etc.
      if (pattern[i + 1] === '?') {
        isCapturing = false;
        groupPrefix = '?';
        i += 2;
        if (pattern[i] === ':' || pattern[i] === '=' || pattern[i] === '!' || pattern[i] === '<') {
          if (pattern[i] === '<') {
            groupPrefix += pattern[i];
            i++;
            if (pattern[i] === '=' || pattern[i] === '!') {
              groupPrefix += pattern[i];
              i++;
            }
          } else {
            groupPrefix += pattern[i];
            i++;
          }
        }
      } else {
        i++;
      }

      // For capturing groups, use the next group number
      const groupNum = isCapturing ? ++capturingGroupNum : 0;
      const colorIndex = groupNum % GROUP_COLORS.length;
      const color = GROUP_COLORS[colorIndex];

      groupStack.push({ isCapturing, groupNum });

      result += `<span style="background-color: ${color.bg}; color: var(--foreground); border-radius: 2px; font-weight: 600;">(${groupPrefix}`;
      continue;
    }

    if (char === ')') {
      const groupInfo = groupStack.pop() || { isCapturing: false, groupNum: 0 };
      const colorIndex = groupInfo.groupNum % GROUP_COLORS.length;
      const color = GROUP_COLORS[colorIndex];
      result += `)</span>`;
      i++;
      continue;
    }

    // Handle quantifiers
    if (char === '*' || char === '+' || char === '?') {
      result += `<span style="color: #a78bfa; font-weight: 600;">${escapeHtml(char)}</span>`;
      i++;
      continue;
    }

    if (char === '{') {
      let quantifier = '{';
      i++;
      while (i < pattern.length && pattern[i] !== '}') {
        quantifier += pattern[i];
        i++;
      }
      if (pattern[i] === '}') {
        quantifier += '}';
        i++;
      }
      result += `<span style="color: #a78bfa; font-weight: 600;">${escapeHtml(quantifier)}</span>`;
      continue;
    }

    // Handle anchors and boundaries
    if (char === '^' || char === '$') {
      result += `<span style="color: #f472b6; font-weight: 600;">${escapeHtml(char)}</span>`;
      i++;
      continue;
    }

    // Handle alternation
    if (char === '|') {
      result += `<span style="color: #fbbf24; font-weight: 600;">|</span>`;
      i++;
      continue;
    }

    // Handle dot
    if (char === '.') {
      result += `<span style="color: #38bdf8; font-weight: 600;">.</span>`;
      i++;
      continue;
    }

    // Regular character
    result += escapeHtml(char);
    i++;
  }

  return result;
};

// Generate highlighted HTML with match data
const generateHighlightedHtml = (text, regex, flags) => {
  if (!regex || !text) return escapeHtml(text);

  try {
    const re = new RegExp(regex, flags.includes('g') ? flags : flags + 'g');
    let result = '';
    let lastIndex = 0;
    let match;
    let matchCount = 0;

    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        result += escapeHtml(text.slice(lastIndex, match.index));
      }

      matchCount++;
      const matchIndex = match.index;
      const fullMatchText = match[0];

      let tooltipData = `Match #${matchCount} at index ${matchIndex}`;
      if (match.length > 1) {
        const groups = match
          .slice(1)
          .map((g, i) => `${i + 1}: "${g || ''}"`)
          .join('\n');
        tooltipData += `\nGroups:\n${groups}`;
      }

      if (match.length > 1) {
        const groupPositions = [];
        let currentPos = 0;

        for (let i = 1; i < match.length; i++) {
          const groupText = match[i];
          if (groupText !== undefined) {
            const groupIndex = fullMatchText.indexOf(groupText, currentPos);
            if (groupIndex !== -1) {
              groupPositions.push({
                index: groupIndex,
                text: groupText,
                groupNum: i,
              });
              currentPos = groupIndex + groupText.length;
            }
          }
        }

        groupPositions.sort((a, b) => a.index - b.index);

        let matchResult = '';
        let matchPos = 0;
        const fullMatchColor = GROUP_COLORS[0];

        groupPositions.forEach((group) => {
          if (group.index > matchPos) {
            const beforeText = escapeHtml(fullMatchText.slice(matchPos, group.index));
            matchResult += `<span style="background-color: ${fullMatchColor.bg}; color: var(--foreground); border-radius: 2px;">${beforeText}</span>`;
          }

          const groupColor = GROUP_COLORS[group.groupNum % GROUP_COLORS.length] || GROUP_COLORS[1];
          matchResult += `<mark style="background-color: ${groupColor.bg}; color: var(--foreground); border-radius: 2px; font-weight: 600;" title="${tooltipData}">${escapeHtml(group.text)}</mark>`;

          matchPos = group.index + group.text.length;
        });

        if (matchPos < fullMatchText.length) {
          const afterText = escapeHtml(fullMatchText.slice(matchPos));
          matchResult += `<span style="background-color: ${fullMatchColor.bg}; color: var(--foreground); border-radius: 2px;">${afterText}</span>`;
        }

        result += matchResult;
      } else {
        const fullMatchColor = GROUP_COLORS[0];
        result += `<mark style="background-color: ${fullMatchColor.bg}; color: var(--foreground); border-radius: 2px; font-weight: 600;" title="${tooltipData}">${escapeHtml(fullMatchText)}</mark>`;
      }

      lastIndex = re.lastIndex;

      if (match.index === re.lastIndex) {
        re.lastIndex++;
      }
    }

    if (lastIndex < text.length) {
      result += escapeHtml(text.slice(lastIndex));
    }

    return result;
  } catch (e) {
    return escapeHtml(text);
  }
};

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

// Live Highlighted Editor Component
function LiveHighlightedEditor({ text, setText, regex, flags, label, indicator, indicatorColor }) {
  const textareaRef = useRef(null);
  const backdropRef = useRef(null);
  const [highlightedHtml, setHighlightedHtml] = useState('');

  useEffect(() => {
    const html = generateHighlightedHtml(text, regex, flags);
    setHighlightedHtml(html);
  }, [text, regex, flags]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleCopy = () => {
    if (text) {
      navigator.clipboard.writeText(text);
    }
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
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor:
                  indicatorColor === 'green'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : indicatorColor === 'blue'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(113, 113, 122, 0.15)',
                color:
                  indicatorColor === 'green'
                    ? 'var(--success)'
                    : indicatorColor === 'blue'
                      ? 'var(--primary)'
                      : 'var(--muted-foreground)',
              }}
            >
              {indicator}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          disabled={!text}
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
            color: text ? 'var(--muted-foreground)' : 'var(--border)',
            cursor: text ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            if (text) {
              e.currentTarget.style.backgroundColor = 'var(--border)';
              e.currentTarget.style.color = 'var(--foreground)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = text ? 'var(--muted-foreground)' : 'var(--border)';
          }}
        >
          <Copy style={{ width: '16px', height: '16px' }} />
        </button>
      </div>

      <div style={{ position: 'relative', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Backdrop - shows highlighted text */}
        <div
          ref={backdropRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'auto',
            padding: '12px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '14px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--foreground)',
            pointerEvents: 'none',
          }}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />

        {/* Textarea - for user input */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onScroll={handleScroll}
          placeholder="Enter text to match against..."
          spellCheck={false}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100%',
            height: '100%',
            padding: '12px',
            background: 'transparent',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '14px',
            lineHeight: 1.6,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'transparent',
            caretColor: 'var(--foreground)',
            resize: 'none',
            outline: 'none',
            zIndex: 1,
          }}
        />
      </div>
    </div>
  );
}

function MatchRow({ label, position, value, color, underline, isLast }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '80px 80px 1fr',
        gap: '12px',
        padding: '6px 0',
        alignItems: 'center',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ justifySelf: 'start', display: 'inline-block' }}>
        <span
          style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 500,
            color: color,
            whiteSpace: 'nowrap',
            borderBottom: underline ? `2px solid ${color}` : 'none',
            paddingBottom: underline ? '2px' : '0',
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: '12px',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          color: 'var(--muted-foreground)',
        }}
      >
        {position}
      </span>
      <span
        style={{
          fontSize: '12px',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          color: 'var(--foreground)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={value}
      >
        {value}
      </span>
    </div>
  );
}

// Regex Quick Reference Data
const REFERENCE_CATEGORIES = {
  common: {
    label: 'Common',
    icon: '★',
    tokens: [
      { token: '.', desc: 'Any single character' },
      { token: '\\d', desc: 'Digit (0-9)' },
      { token: '\\D', desc: 'Non-digit' },
      { token: '\\w', desc: 'Word character (a-z, A-Z, 0-9, _)' },
      { token: '\\W', desc: 'Non-word character' },
      { token: '\\s', desc: 'Whitespace' },
      { token: '\\S', desc: 'Non-whitespace' },
    ],
  },
  anchors: {
    label: 'Anchors',
    icon: '⚓',
    tokens: [
      { token: '^', desc: 'Start of string or line' },
      { token: '$', desc: 'End of string or line' },
      { token: '\\b', desc: 'Word boundary' },
      { token: '\\B', desc: 'Non-word boundary' },
    ],
  },
  quantifiers: {
    label: 'Quantifiers',
    icon: '{}',
    tokens: [
      { token: '*', desc: 'Zero or more (greedy)' },
      { token: '*?', desc: 'Zero or more (lazy)' },
      { token: '+', desc: 'One or more (greedy)' },
      { token: '+?', desc: 'One or more (lazy)' },
      { token: '?', desc: 'Zero or one (greedy)' },
      { token: '??', desc: 'Zero or one (lazy)' },
      { token: '{n}', desc: 'Exactly n times' },
      { token: '{n,}', desc: 'n or more times' },
      { token: '{n,m}', desc: 'Between n and m times' },
    ],
  },
  groups: {
    label: 'Groups',
    icon: '()',
    tokens: [
      { token: '(...)', desc: 'Capturing group' },
      { token: '(?:...)', desc: 'Non-capturing group' },
      { token: '(?=...)', desc: 'Positive lookahead' },
      { token: '(?!...)', desc: 'Negative lookahead' },
      { token: '(?<=...)', desc: 'Positive lookbehind' },
      { token: '(?<!...)', desc: 'Negative lookbehind' },
      { token: '(?<name>...)', desc: 'Named group' },
    ],
  },
  classes: {
    label: 'Character Classes',
    icon: '[]',
    tokens: [
      { token: '[abc]', desc: 'Any character: a, b, or c' },
      { token: '[^abc]', desc: 'Any character except: a, b, c' },
      { token: '[a-z]', desc: 'Character in range: a-z' },
      { token: '[^a-z]', desc: 'Character NOT in range: a-z' },
      { token: '[a-zA-Z]', desc: 'Character in range: a-z or A-Z' },
    ],
  },
  flags: {
    label: 'Flags',
    icon: '⚑',
    tokens: [
      { token: 'g', desc: 'Global - find all matches' },
      { token: 'i', desc: 'Ignore case' },
      { token: 'm', desc: 'Multiline mode' },
      { token: 's', desc: 'Dot matches newlines' },
      { token: 'u', desc: 'Unicode support' },
      { token: 'y', desc: 'Sticky mode' },
      { token: 'd', desc: 'Indices for captures' },
    ],
  },
};

function QuickReferencePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('common');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = searchQuery
    ? Object.values(REFERENCE_CATEGORIES).flatMap((cat) =>
        cat.tokens
          .filter(
            (t) =>
              t.token.toLowerCase().includes(searchQuery.toLowerCase()) ||
              t.desc.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((t) => ({ ...t, category: cat.label }))
      )
    : REFERENCE_CATEGORIES[activeCategory].tokens.map((t) => ({
        ...t,
        category: REFERENCE_CATEGORIES[activeCategory].label,
      }));

  return (
    <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%',
          padding: '8px 0',
          backgroundColor: 'transparent',
          border: 'none',
          color: 'var(--primary)',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            transform: isOpen ? 'rotate(90deg)' : 'none',
            transition: 'transform 0.15s ease',
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
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
        Quick Reference
      </button>

      {isOpen && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            gap: '16px',
            padding: '12px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            marginTop: '8px',
          }}
        >
          {/* Left sidebar - Categories */}
          <div style={{ borderRight: '1px solid var(--border)', paddingRight: '8px' }}>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontSize: '12px',
                backgroundColor: 'var(--border)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                color: 'var(--foreground)',
                marginBottom: '8px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {Object.entries(REFERENCE_CATEGORIES).map(([key, cat]) => (
                <button
                  key={key}
                  onClick={() => {
                    setActiveCategory(key);
                    setSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    fontSize: '12px',
                    textAlign: 'left',
                    backgroundColor:
                      activeCategory === key && !searchQuery ? 'var(--border)' : 'transparent',
                    border: 'none',
                    borderRadius: '4px',
                    color:
                      activeCategory === key && !searchQuery
                        ? 'var(--primary)'
                        : 'var(--muted-foreground)',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '11px' }}>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right side - Token list */}
          <div>
            {searchQuery && (
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted-foreground)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Search results
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {filteredTokens.length > 0 ? (
                filteredTokens.map((token, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: searchQuery ? '100px 80px 1fr' : '80px 1fr',
                      gap: '12px',
                      padding: '6px 8px',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--border)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {searchQuery && (
                      <span style={{ fontSize: '11px', color: 'var(--primary)' }}>
                        {token.category}
                      </span>
                    )}
                    <span
                      style={{
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '13px',
                        color: 'var(--success)',
                        fontWeight: 600,
                      }}
                    >
                      {token.token}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--muted-foreground)' }}>
                      {token.desc}
                    </span>
                  </div>
                ))
              ) : (
                <div
                  style={{
                    padding: '12px',
                    fontSize: '13px',
                    color: 'var(--muted-foreground)',
                    textAlign: 'center',
                  }}
                >
                  No matching tokens found
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match, index, isLastMatch }) {
  const fullMatchColor = GROUP_COLORS[0];
  const startIndex = match.index;
  const endIndex = startIndex + match[0].length;

  // Build rows: Match row + Group rows
  const rows = [];

  // Group rows - track positions to avoid duplicates
  const groupRows = [];
  if (match.length > 1) {
    const groupPositions = [];
    let currentPos = 0;

    for (let i = 1; i < match.length; i++) {
      const groupText = match[i];
      if (groupText !== undefined) {
        const groupIndex = match[0].indexOf(groupText, currentPos);
        if (groupIndex !== -1) {
          groupPositions.push({
            groupNum: i,
            start: groupIndex,
            end: groupIndex + groupText.length,
            text: groupText,
          });
          currentPos = groupIndex + groupText.length;
        }
      }
    }

    // Sort by start position
    groupPositions.sort((a, b) => a.start - b.start);

    groupPositions.forEach((group, idx) => {
      const groupColor = GROUP_COLORS[group.groupNum % GROUP_COLORS.length] || GROUP_COLORS[1];
      const position = `${startIndex + group.start}-${startIndex + group.end}`;
      const isLastGroup = idx === groupPositions.length - 1;

      groupRows.push(
        <MatchRow
          key={`group-${group.groupNum}`}
          label={`Group ${group.groupNum}`}
          position={position}
          value={group.text || 'null'}
          color={groupColor.text}
          underline={true}
          isLast={isLastGroup}
        />
      );
    });
  }

  // Match row - isLast only if no groups
  const isMatchRowLast = groupRows.length === 0;

  rows.push(
    <MatchRow
      key="match"
      label={`Match ${index + 1}`}
      position={`${startIndex}-${endIndex}`}
      value={match[0]}
      color={fullMatchColor.text}
      underline={true}
      isLast={isMatchRowLast}
    />
  );

  // Add group rows
  rows.push(...groupRows);

  return (
    <div
      style={{
        paddingBottom: isLastMatch ? '0' : '8px',
        marginBottom: isLastMatch ? '0' : '8px',
        borderBottom: isLastMatch ? 'none' : '1px solid var(--border)',
      }}
    >
      {rows}
    </div>
  );
}

function ResultPane({ label, matches, error, indicator, indicatorColor }) {
  const handleCopyAll = () => {
    const text = matches.map((m) => m[0]).join('\n');
    if (text) {
      navigator.clipboard.writeText(text);
    }
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
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                backgroundColor:
                  indicatorColor === 'green'
                    ? 'rgba(34, 197, 94, 0.15)'
                    : indicatorColor === 'blue'
                      ? 'rgba(59, 130, 246, 0.15)'
                      : 'rgba(113, 113, 122, 0.15)',
                color:
                  indicatorColor === 'green'
                    ? 'var(--success)'
                    : indicatorColor === 'blue'
                      ? 'var(--primary)'
                      : 'var(--muted-foreground)',
              }}
            >
              {indicator}
            </span>
          )}
        </div>
        <Button variant="secondary" onClick={handleCopyAll} disabled={matches.length === 0}>
          <Copy style={{ width: '14px', height: '14px' }} />
          Copy All
        </Button>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
        }}
      >
        {matches.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {matches.map((match, i) => (
              <MatchCard key={i} match={match} index={i} isLastMatch={i === matches.length - 1} />
            ))}
          </div>
        ) : !error ? (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              color: 'var(--muted-foreground)',
            }}
          >
            <Regex style={{ width: '48px', height: '48px', opacity: 0.3 }} />
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              No matches found
            </div>
          </div>
        ) : null}
      </div>
      <QuickReferencePanel />
    </div>
  );
}

function FlagsDropdown({ flags, setFlags }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const flagOptions = [
    { flag: 'g', name: 'Global', description: 'Find all matches, not just the first' },
    { flag: 'i', name: 'Case Insensitive', description: 'Match both uppercase and lowercase' },
    { flag: 'm', name: 'Multiline', description: '^ and $ match line boundaries' },
    { flag: 's', name: 'Dot All', description: '. matches newlines (dotall mode)' },
    { flag: 'u', name: 'Unicode', description: 'Enable full Unicode support' },
    { flag: 'd', name: 'Indices', description: 'Return match start/end indices' },
    { flag: 'y', name: 'Sticky', description: 'Match only from lastIndex position' },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleFlag = (flag) => {
    if (flags.includes(flag)) {
      setFlags(flags.replace(flag, ''));
    } else {
      setFlags(flags + flag);
    }
  };

  const displayFlags = flags.split('').sort().join('') || '—';

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          height: '40px',
          minWidth: '80px',
          padding: '0 12px',
          backgroundColor: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
      >
        <span
          style={{
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '14px',
            fontWeight: 600,
            color: flags ? 'var(--primary)' : 'var(--muted-foreground)',
          }}
        >
          {displayFlags}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{
            color: 'var(--muted-foreground)',
            transition: 'transform 0.15s ease',
            transform: isOpen ? 'rotate(180deg)' : 'none',
          }}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: '240px',
            backgroundColor: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            zIndex: 50,
            overflow: 'hidden',
          }}
        >
          {flagOptions.map((option, index) => {
            const isActive = flags.includes(option.flag);
            return (
              <button
                key={option.flag}
                onClick={() => toggleFlag(option.flag)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderTop: index > 0 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--border)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '24px',
                        height: '24px',
                        borderRadius: '4px',
                        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                        fontSize: '14px',
                        fontWeight: 600,
                        backgroundColor: isActive ? 'var(--primary)' : 'var(--border)',
                        color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {option.flag}
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--foreground)', fontSize: '14px' }}>
                      {option.name}
                    </span>
                  </div>
                  <span
                    style={{
                      color: 'var(--muted-foreground)',
                      fontSize: '12px',
                      lineHeight: 1.4,
                      marginLeft: '32px',
                    }}
                  >
                    {option.description}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                  {isActive && (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--success)"
                      strokeWidth="3"
                    >
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function RegExpTester() {
  const [regex, setRegex] = useState('(\\w+)\\s(\\w+)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('John Doe, Jane Smith, Alan Turing');
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState('');

  const testRegex = (r = regex, f = flags, t = text) => {
    if (!r) {
      setMatches([]);
      setError('');
      return;
    }
    try {
      const re = new RegExp(r, f);
      let m;

      // matchAll requires 'g' flag, so handle non-global separately
      if (f.includes('g')) {
        m = Array.from(t.matchAll(re));
      } else {
        // For non-global, just find the first match
        const firstMatch = re.exec(t);
        m = firstMatch ? [firstMatch] : [];
      }

      setMatches(m);
      setError('');
    } catch (e) {
      setError(e.toString());
      setMatches([]);
    }
  };

  useEffect(() => {
    testRegex();
  }, [regex, flags, text]);

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
        title="RegExp Tester"
        description="Write and debug regular expressions with real-time feedback. Visualize matches, groups, and capture properties instantly."
      />
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: '16px' }} />

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          marginBottom: '16px',
        }}
      >
        <div style={{ flex: 1 }}>
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
            Pattern
          </label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--primary)',
                fontWeight: 600,
                opacity: 0.5,
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                zIndex: 2,
              }}
            >
              /
            </span>
            {/* Highlighted backdrop */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                padding: '0 24px 0 28px',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '40px',
                backgroundColor: 'var(--card)',
                border: error ? '1px solid var(--destructive)' : '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--foreground)',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}
              dangerouslySetInnerHTML={{ __html: highlightRegexPattern(regex) || '<br>' }}
            />
            {/* Transparent input */}
            <input
              value={regex}
              onChange={(e) => setRegex(e.target.value)}
              placeholder="[a-z]+"
              spellCheck={false}
              style={{
                position: 'relative',
                width: '100%',
                height: '40px',
                padding: '0 24px 0 28px',
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                fontSize: '14px',
                fontWeight: 500,
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: '6px',
                color: 'transparent',
                caretColor: 'var(--foreground)',
                outline: 'none',
                zIndex: 1,
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--primary)',
                fontWeight: 600,
                opacity: 0.5,
                fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
                zIndex: 2,
              }}
            >
              /
            </span>
          </div>
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
            Flags
          </label>
          <FlagsDropdown flags={flags} setFlags={setFlags} />
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: 'var(--destructive)',
            fontSize: '13px',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
          }}
        >
          {error}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            flex: 1,
            minHeight: 0,
          }}
        >
          <LiveHighlightedEditor
            label="Test String"
            text={text}
            setText={setText}
            regex={regex}
            flags={flags}
            indicator="Source"
            indicatorColor="green"
          />

          <ResultPane
            label="Result"
            matches={matches}
            error={error}
            indicator={`${matches.length} matches`}
            indicatorColor="blue"
          />
        </div>
      </div>
    </div>
  );
}
