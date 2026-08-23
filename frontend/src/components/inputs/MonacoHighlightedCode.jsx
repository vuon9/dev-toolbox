import React, { useEffect, useRef, useState } from 'react';
import { getMonaco } from './monaco/monacoSetup';
import { useMonacoDevtoolboxTheme } from './monaco/useMonacoTheme';
import { MONACO_LANGUAGE_IDS } from './monaco/languages';
import ToolCopyButton from './ToolCopyButton';

const READ_ONLY_OPTIONS = {
  readOnly: true,
  domReadOnly: true,
  minimap: { enabled: false },
  fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
  fontSize: 14,
  lineHeight: 21,
  scrollBeyondLastLine: false,
  automaticLayout: true,
  renderLineHighlight: 'none',
  glyphMargin: false,
  folding: false,
  contextmenu: false,
  overviewRulerLanes: 0,
  scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
  padding: { top: 8, bottom: 8 },
};

export default function MonacoHighlightedCode({
  code = '',
  language,
  copyable = true,
  showLineNumbers = false,
  className = '',
  label,
  dataTestId,
  ariaLabel,
}) {
  const containerRef = useRef(null);
  const editorRef = useRef(null);
  const codeRef = useRef(code);

  useMonacoDevtoolboxTheme();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    codeRef.current = code;
  });

  // Create the editor once
  useEffect(() => {
    let cancelled = false;
    getMonaco().then((monaco) => {
      if (cancelled || !containerRef.current || editorRef.current) return;
      const editor = monaco.editor.create(containerRef.current, {
        ...READ_ONLY_OPTIONS,
        value: codeRef.current ?? '',
        language: MONACO_LANGUAGE_IDS[language?.toLowerCase()] || 'plaintext',
        theme: 'devtoolbox',
        lineNumbers: showLineNumbers ? 'on' : 'off',
        ariaLabel: ariaLabel || label || 'Read-only code output',
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

  // Sync code -> model
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    if (editor.getValue() !== code) {
      editor.getModel().setValue(code);
    }
  }, [code, ready]);

  // Sync options
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.updateOptions({
      lineNumbers: showLineNumbers ? 'on' : 'off',
      ...(ariaLabel || label ? { ariaLabel: ariaLabel || label } : {}),
    });
  }, [showLineNumbers, ariaLabel, label, ready]);

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
      data-testid={dataTestId}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: '60px',
        border: '1px solid var(--border)',
        backgroundColor: 'var(--background)',
        position: 'relative',
      }}
    >
      {(label || copyable) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '0.5rem 1rem',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--card)',
            minHeight: '40px',
          }}
        >
          {label && (
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 400,
                textTransform: 'uppercase',
                letterSpacing: '0.32px',
                color: 'var(--muted-foreground)',
              }}
            >
              {label}
            </span>
          )}
          {copyable && <ToolCopyButton text={code} size="sm" />}
        </div>
      )}
      <div
        ref={containerRef}
        data-testid={dataTestId ? `${dataTestId}-content` : undefined}
        aria-label={ariaLabel || label || 'Read-only code output'}
        style={{ flex: 1, position: 'relative', minHeight: 0 }}
      />
    </div>
  );
}
