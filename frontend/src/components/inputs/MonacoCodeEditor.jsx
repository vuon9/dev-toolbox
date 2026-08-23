import React, { useEffect, useRef, useState } from 'react';
import { getMonaco } from './monaco/monacoSetup';
import { useMonacoDevtoolboxTheme } from './monaco/useMonacoTheme';
import { MONACO_LANGUAGE_IDS } from './monaco/languages';

const BASE_OPTIONS = {
  minimap: { enabled: false },
  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
  fontSize: 14,
  lineHeight: 21,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  glyphMargin: false,
  folding: false,
  tabSize: 2,
  smoothScrolling: true,
  padding: { top: 8, bottom: 8 },
  overviewRulerLanes: 0,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
};

export default function MonacoCodeEditor({
  value = '',
  onChange,
  language,
  readOnly = false,
  placeholder,
  label,
  dataTestId,
  ariaLabel,
  showLineNumbers = false,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const valueRef = useRef(value);

  useMonacoDevtoolboxTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
    valueRef.current = value;
  });

  // Create the editor once
  useEffect(() => {
    let cancelled = false;
    getMonaco().then((monaco) => {
      if (cancelled || !containerRef.current || editorRef.current) return;
      const editor = monaco.editor.create(containerRef.current, {
        ...BASE_OPTIONS,
        value: valueRef.current ?? '',
        language: MONACO_LANGUAGE_IDS[language?.toLowerCase()] || 'plaintext',
        theme: 'devtoolbox',
        readOnly,
        domReadOnly: readOnly,
        lineNumbers: showLineNumbers ? 'on' : 'off',
        contextmenu: !readOnly,
        ariaLabel: ariaLabel || label || placeholder || 'Code editor',
        ...(placeholder ? { placeholder } : {}),
      });
      editor.onDidChangeModelContent(() => {
        const next = editor.getValue();
        if (next !== valueRef.current) onChangeRef.current?.(next);
      });
      editorRef.current = editor;
      setReady(true);
    });
    return () => {
      cancelled = true;
      const editor = editorRef.current;
      if (editor) {
        const model = editor.getModel();
        editor.dispose();
        if (model && !model.isDisposed()) model.dispose();
        editorRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external value -> model (skip programmatic echo)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || value === undefined) return;
    if (editor.getValue() !== value) {
      editor.getModel().setValue(value);
    }
  }, [value, ready]);

  // Sync options
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateOptions({
      readOnly,
      domReadOnly: readOnly,
      lineNumbers: showLineNumbers ? 'on' : 'off',
      contextmenu: !readOnly,
      ...(placeholder ? { placeholder } : {}),
      ...(ariaLabel || label ? { ariaLabel: ariaLabel || label } : {}),
    });
  }, [readOnly, showLineNumbers, placeholder, ariaLabel, label, ready]);

  // Sync language
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const id = MONACO_LANGUAGE_IDS[language?.toLowerCase()] || 'plaintext';
    if (editor.getModel()?.getLanguageId() !== id) {
      getMonaco().then((monaco) => monaco.editor.setModelLanguage(editor.getModel(), id));
    }
  }, [language, ready]);

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '120px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
      data-testid={dataTestId}
    >
      {label && (
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'var(--muted-foreground)',
            padding: '8px 12px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            flexShrink: 0,
          }}
        >
          {label}
        </div>
      )}
      <div
        ref={containerRef}
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        aria-label={ariaLabel || label || placeholder || 'Code editor'}
        style={{ flex: 1, position: 'relative', minHeight: 0 }}
      />
      {!ready && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'flex-start',
            padding: '12px',
            color: 'var(--muted-foreground)',
            fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
            fontSize: '14px',
            pointerEvents: 'none',
          }}
        >
          {placeholder || 'Loading editor...'}
        </div>
      )}
    </div>
  );
}
