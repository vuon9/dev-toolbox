import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { EditorView } from '@codemirror/view';
import { SCOPE_TO_TAG } from '../theme/scope-mapping';
import {
  THEME_TOKENS,
  getThemeByKey,
  resolveActualType,
  allThemes,
  BUILT_IN_THEME_KEYS,
  loadUserThemes,
} from '../theme';

const DEFAULT_MODE = 'system';
const DEFAULT_NAME = 'github-dark';

function migrateLegacyKey() {
  const old = localStorage.getItem('themeMode');
  if (old && !localStorage.getItem('dt-mode')) {
    if (old === 'system') {
      localStorage.setItem('dt-mode', 'system');
      localStorage.setItem('dt-name', 'github-dark');
    } else if (old === 'github-dark') {
      localStorage.setItem('dt-mode', 'dark');
      localStorage.setItem('dt-name', 'github-dark');
    } else if (old === 'github-light') {
      localStorage.setItem('dt-mode', 'light');
      localStorage.setItem('dt-name', 'github-light');
    } else {
      localStorage.setItem('dt-mode', 'system');
      localStorage.setItem('dt-name', old);
    }
    localStorage.removeItem('themeMode');
  }
}

function readMode() {
  migrateLegacyKey();
  return localStorage.getItem('dt-mode') || DEFAULT_MODE;
}

function readName() {
  migrateLegacyKey();
  return localStorage.getItem('dt-name') || DEFAULT_NAME;
}

const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

function buildHighlightStyle(tokenColors) {
  if (!tokenColors?.length) return null;
  return HighlightStyle.define(
    tokenColors.map((tc) => ({
      tag: SCOPE_TO_TAG[tc.scope] || tc.scope,
      color: tc.color,
    }))
  );
}

function resolvePalette(theme, actualType) {
  if (theme.colors?.dark && theme.colors?.light) {
    return {
      colors: theme.colors[actualType],
      tokenColors: theme.tokenColors?.[actualType] || theme.tokenColors,
    };
  }
  return { colors: theme.colors, tokenColors: theme.tokenColors };
}

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(readMode);
  const [themeName, setThemeNameState] = useState(readName);

  const setThemeMode = useCallback((mode) => {
    localStorage.setItem('dt-mode', mode);
    setThemeModeState(mode);
  }, []);

  const setThemeName = useCallback((name) => {
    localStorage.setItem('dt-name', name);
    setThemeNameState(name);
  }, []);

  const [systemPrefersDark, setSystemPrefersDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemPrefersDark(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Load user themes from ~/.config/devtoolbox/themes/
  useEffect(() => {
    loadUserThemes();
  }, []);

  const actualType = useMemo(
    () => resolveActualType(themeMode, systemPrefersDark),
    [themeMode, systemPrefersDark]
  );

  const theme = useMemo(() => getThemeByKey(themeName) || getThemeByKey(DEFAULT_NAME), [themeName]);

  const palette = useMemo(() => resolvePalette(theme, actualType), [theme, actualType]);

  useEffect(() => {
    const root = document.documentElement;

    if (theme.isBuiltIn) {
      THEME_TOKENS.forEach((token) => root.style.removeProperty(`--${token}`));
      if (actualType === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    } else {
      root.classList.remove('dark');
      for (const [token, value] of Object.entries(palette.colors)) {
        root.style.setProperty(`--${token}`, value);
      }
    }
  }, [theme, actualType, palette]);

  const highlightStyle = useMemo(
    () => buildHighlightStyle(palette.tokenColors),
    [palette.tokenColors]
  );

  const editorExtensions = useMemo(() => {
    if (!highlightStyle) return [];
    return [
      EditorView.theme({
        '&': { backgroundColor: 'var(--background)', color: 'var(--foreground)' },
        '.cm-content': {
          caretColor: 'var(--foreground)',
          fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
        },
        '.cm-gutters': {
          backgroundColor: 'var(--card)',
          borderRight: '1px solid var(--border)',
          color: 'var(--muted-foreground)',
        },
        '.cm-activeLineGutter': { backgroundColor: 'var(--muted)' },
        '&.cm-focused .cm-cursor': { borderLeftColor: 'var(--foreground)' },
        '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
          backgroundColor: 'var(--accent)',
        },
      }),
      syntaxHighlighting(highlightStyle),
    ];
  }, [highlightStyle]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      themeName,
      setThemeName,
      theme,
      actualType,
      palette,
      editorExtensions,
      allThemes,
    }),
    [themeMode, setThemeMode, themeName, setThemeName, theme, actualType, palette, editorExtensions]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
