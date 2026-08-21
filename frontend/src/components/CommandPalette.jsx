import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Moon,
  Monitor,
  Type,
  Binary,
  ShieldCheck,
  QrCode,
  Wrench,
  Palette,
  Clock,
  Regex,
  FileDiff,
  LayoutGrid,
  ArrowLeftRight,
  Fingerprint,
  CaseSensitive,
  Hash,
  Key,
  Code2,
  Timer,
  FileCode,
} from 'lucide-react';
import { Events } from '@wailsio/runtime';
import { useTheme } from '../context/ThemeContext';
import './CommandPalette.css';

// Icon mapping matching the sidebar
const TOOL_ICONS = {
  'code-encoder': FileCode,
  'code-encrypter': ShieldCheck,
  'hash-generator': Fingerprint,
  'code-converter': ArrowLeftRight,
  'text-utilities': CaseSensitive,
  'number-converter': Hash,
  'datetime-converter': Clock,
  jwt: Key,
  barcode: QrCode,
  'data-generator': LayoutGrid,
  'code-formatter': Code2,
  'color-converter': Palette,
  cron: Timer,
  regexp: Regex,
  diff: FileDiff,
};

// Helper to get icon for a command
const getIconForCommand = (command) => {
  // System commands have explicit icons
  if (command.icon) return command.icon;

  // Extract tool ID from path
  const pathMatch = command.path?.match(/\/tool\/([^/?]+)/);
  if (pathMatch) {
    const toolId = pathMatch[1];
    return TOOL_ICONS[toolId] || Wrench;
  }

  return Wrench;
};

// Command definitions with tool presets matching the main app
const COMMANDS = [
  // Code Formatter presets
  {
    id: 'formatter-json',
    label: 'Code Formatter > JSON',
    path: '/tool/code-formatter?format=json',
  },
  {
    id: 'formatter-xml',
    label: 'Code Formatter > XML',
    path: '/tool/code-formatter?format=xml',
  },
  {
    id: 'formatter-html',
    label: 'Code Formatter > HTML',
    path: '/tool/code-formatter?format=html',
  },
  {
    id: 'formatter-css',
    label: 'Code Formatter > CSS',
    path: '/tool/code-formatter?format=css',
  },

  // Code Encoder presets
  {
    id: 'encoder-base64',
    label: 'Code Encoder > Base64',
    path: '/tool/code-encoder',
  },
  {
    id: 'encoder-url',
    label: 'Code Encoder > URL Encode',
    path: '/tool/code-encoder',
  },
  {
    id: 'encoder-hex',
    label: 'Code Encoder > Hex',
    path: '/tool/code-encoder',
  },
  {
    id: 'encoder-html',
    label: 'Code Encoder > HTML Entities',
    path: '/tool/code-encoder',
  },

  // Hash Generator presets
  {
    id: 'hash-md5',
    label: 'Hash Generator > MD5',
    path: '/tool/hash-generator',
  },
  {
    id: 'hash-sha256',
    label: 'Hash Generator > SHA-256',
    path: '/tool/hash-generator',
  },
  {
    id: 'hash-all',
    label: 'Hash Generator > All Hashes',
    path: '/tool/hash-generator',
  },

  // Code Converter presets
  {
    id: 'converter-json-yaml',
    label: 'Code Converter > JSON ↔ YAML',
    path: '/tool/code-converter',
  },
  {
    id: 'converter-json-xml',
    label: 'Code Converter > JSON ↔ XML',
    path: '/tool/code-converter',
  },
  {
    id: 'converter-markdown-html',
    label: 'Code Converter > Markdown ↔ HTML',
    path: '/tool/code-converter',
  },
  {
    id: 'converter-csv-tsv',
    label: 'Code Converter > CSV ↔ TSV',
    path: '/tool/code-converter',
  },
  {
    id: 'converter-case-swap',
    label: 'Code Converter > Case Swap',
    path: '/tool/code-converter',
  },

  // Direct navigation
  { id: 'jwt', label: 'JWT Debugger', path: '/tool/jwt' },
  { id: 'barcode', label: 'Barcode Generator', path: '/tool/barcode' },
  { id: 'regexp', label: 'RegExp Tester', path: '/tool/regexp' },
  { id: 'cron', label: 'Cron Job Parser', path: '/tool/cron' },
  { id: 'diff', label: 'Text Diff Checker', path: '/tool/diff' },
  { id: 'number', label: 'Number Converter', path: '/tool/number-converter' },
  { id: 'color', label: 'Color Converter', path: '/tool/color-converter' },
  {
    id: 'datetime',
    label: 'DateTime Converter',
    path: '/tool/datetime-converter',
  },
  { id: 'encoder', label: 'Code Encoder', path: '/tool/code-encoder' },
  { id: 'encrypter', label: 'Code Encrypter', path: '/tool/code-encrypter' },
  { id: 'hash', label: 'Hash Generator', path: '/tool/hash-generator' },
  { id: 'converter', label: 'Code Converter', path: '/tool/code-converter' },
  { id: 'textutils', label: 'Text Utilities', path: '/tool/text-utilities' },

  // Data Generator
  {
    id: 'data-user',
    label: 'Data Generator > User',
    path: '/tool/data-generator?preset=User',
  },
  {
    id: 'data-address',
    label: 'Data Generator > Address',
    path: '/tool/data-generator?preset=Address',
  },

  // System commands
  {
    id: 'theme-toggle',
    label: 'Toggle Dark Mode',
    action: 'toggle-theme',
    icon: Moon,
  },
  {
    id: 'window-toggle',
    label: 'Show/Hide Main Window',
    action: 'toggle-window',
    icon: Monitor,
  },
];

export function CommandPalette() {
  const { themeMode, setThemeMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [commands, setCommands] = useState(COMMANDS);
  const [recentCommands, setRecentCommands] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('commandPaletteRecent')) || [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Calculate fuzzy match score
  const fuzzyScore = (target, query) => {
    if (!query) return 0;
    const targetLower = target.toLowerCase();
    const queryLower = query.toLowerCase();
    if (targetLower === queryLower) return -1000;
    if (targetLower.startsWith(queryLower)) return -100;
    const words = targetLower.split(/[\s>]/);
    if (words.some((w) => w.startsWith(queryLower))) return -50;
    if (targetLower.includes(queryLower)) return -10;
    return 1000;
  };

  // Filter and sort commands
  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show recent commands first, then all commands
      const recentIds = new Set(recentCommands);
      const recent = COMMANDS.filter((c) => recentIds.has(c.id)).sort(
        (a, b) => recentCommands.indexOf(a.id) - recentCommands.indexOf(b.id)
      );
      const others = COMMANDS.filter((c) => !recentIds.has(c.id));
      setCommands([...recent.slice(0, 5), ...others]);
      setSelectedIndex(0);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = COMMANDS.filter((cmd) => cmd.label.toLowerCase().includes(query)).sort(
      (a, b) => fuzzyScore(a.label, query) - fuzzyScore(b.label, query)
    );

    setCommands(filtered);
    setSelectedIndex(0);
  }, [searchQuery, recentCommands]);

  // Listen for command palette opened event
  useEffect(() => {
    const unsubscribe = window.runtime?.EventsOn?.('spotlight:opened', () => {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Resize the spotlight window to fit the visible results (Spotlight-like
  // dynamic height). The backend listens for spotlight:resize and resizes
  // the NSPanel while keeping it centered.
  useEffect(() => {
    const itemCount = commands.length;
    const shown = Math.min(itemCount, 12);
    const height = Math.max(100, Math.min(600, 49 + shown * 37 + 2));
    try {
      Events.Emit('spotlight:resize', height);
    } catch (err) {
      console.error('Failed to emit spotlight:resize', err);
    }
  }, [commands.length]);

  // Save recent command
  const saveRecentCommand = useCallback((commandId) => {
    setRecentCommands((prev) => {
      const updated = [commandId, ...prev.filter((id) => id !== commandId)].slice(0, 10);
      localStorage.setItem('commandPaletteRecent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Execute command
  const executeCommand = useCallback(
    (command) => {
      saveRecentCommand(command.id);

      if (command.action) {
        switch (command.action) {
          case 'toggle-theme':
            try {
              const next = themeMode === 'github-dark' ? 'github-light' : 'github-dark';
              setThemeMode(next);
            } catch (e) {}
            break;
          case 'toggle-window':
            try {
              Events.Emit('window:toggle');
            } catch (e) {}
            break;
          default:
            break;
        }
      } else if (command.path) {
        console.log('[CommandPalette] Selected path command:', command.id, command.path);
        const path = command.path;
        try {
          Events.Emit('spotlight:command-selected', path);
          console.log('[CommandPalette] Emitted spotlight:command-selected with path:', path);
        } catch (err) {
          console.error('[CommandPalette] Failed to emit event:', err);
        }
      }
    },
    [saveRecentCommand]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % commands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + commands.length) % commands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (commands[selectedIndex]) {
          executeCommand(commands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        console.log('[CommandPalette] Escape pressed, closing...');
        try {
          Events.Emit('spotlight:close');
        } catch (err) {
          console.error('Failed to emit spotlight:close', err);
        }
      }
    },
    [commands, selectedIndex, executeCommand]
  );

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.children[selectedIndex];
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  return (
    <div className="command-palette-container">
      <div className="command-palette-search-box">
        <Search size={20} className="command-palette-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="command-palette-input"
          placeholder="Search tools..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
        />
        {searchQuery && (
          <button
            className="command-palette-clear-btn"
            onClick={() => {
              setSearchQuery('');
              inputRef.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="command-palette-results">
        {commands.length === 0 ? (
          <div className="command-palette-empty">No commands found matching "{searchQuery}"</div>
        ) : (
          <div ref={listRef} className="command-palette-list">
            {commands.map((command, index) => {
              const Icon = getIconForCommand(command);
              const isSelected = index === selectedIndex;
              const isRecent = recentCommands.includes(command.id);

              return (
                <div
                  key={command.id}
                  className={`command-palette-item ${isSelected ? 'selected' : ''} ${isRecent ? 'recent' : ''}`}
                  onClick={() => executeCommand(command)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="command-palette-item-content">
                    {Icon && <Icon size={16} className="command-palette-item-icon" />}
                    <span className="command-palette-item-label">{command.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
