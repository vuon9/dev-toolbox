import { useEffect, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { applyDevtoolboxTheme, getMonaco } from './monacoSetup';

export function useMonacoDevtoolboxTheme() {
  const { palette, actualType } = useTheme();
  const themeRef = useRef({ palette, actualType });
  themeRef.current = { palette, actualType };

  // Apply as soon as monaco is available (uses latest theme via ref)
  useEffect(() => {
    let cancelled = false;
    getMonaco().then((monaco) => {
      if (cancelled) return;
      applyDevtoolboxTheme(monaco, themeRef.current);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Re-apply whenever the theme changes
  useEffect(() => {
    getMonaco().then((monaco) => {
      applyDevtoolboxTheme(monaco, {
        actualType,
        colors: palette.colors,
        tokenColors: palette.tokenColors,
      });
    });
  }, [actualType, palette]);
}
