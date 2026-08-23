import { useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { applyDevtoolboxTheme, getMonaco } from './monacoSetup';

let monacoRef = null;

export function useMonacoDevtoolboxTheme() {
  const { palette, actualType } = useTheme();

  useEffect(() => {
    getMonaco().then((monaco) => {
      monacoRef = monaco;
      applyDevtoolboxTheme(monaco, {
        actualType,
        colors: palette.colors,
        tokenColors: palette.tokenColors,
      });
    });
  }, []);

  useEffect(() => {
    if (monacoRef) {
      applyDevtoolboxTheme(monacoRef, {
        actualType,
        colors: palette.colors,
        tokenColors: palette.tokenColors,
      });
    }
  }, [actualType, palette]);
}
