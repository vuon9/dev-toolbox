import React, { Suspense } from 'react';
import { ToolCopyButton } from './ToolCopyButton';
import CodeEditor from './CodeEditor';
import HighlightedCode from './HighlightedCode';
import { cn } from '../../utils/cn';

const MonacoCodeEditor = React.lazy(() => import('./MonacoCodeEditor'));
const MonacoHighlightedCode = React.lazy(() => import('./MonacoHighlightedCode'));

const INDICATOR_COLORS = {
  green: { bg: 'rgba(34, 197, 94, 0.15)', fg: '#22c55e' },
  blue: { bg: 'rgba(59, 130, 246, 0.15)', fg: '#3b82f6' },
};

export function ToolEditorPane({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
  indicator,
  indicatorColor = 'blue',
  error = false,
  highlightOn = false,
  showLineNumbers = false,
  language = 'plaintext',
  dataTestId,
  ariaLabel,
  className,
  impl = 'codemirror',
}) {
  return (
    <div className={cn('flex flex-col flex-1 min-h-0', className)}>
      <div className="flex justify-between items-center min-h-[30px] mb-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
          {indicator && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider"
              style={{
                backgroundColor: (INDICATOR_COLORS[indicatorColor] || INDICATOR_COLORS.blue).bg,
                color: (INDICATOR_COLORS[indicatorColor] || INDICATOR_COLORS.blue).fg,
              }}
            >
              {indicator}
            </span>
          )}
        </div>
        <ToolCopyButton text={value} />
      </div>
      <div
        className="flex-1 relative flex flex-col"
        data-testid={dataTestId ? `${dataTestId}-pane` : undefined}
        style={{ border: error ? '1px solid #ef4444' : undefined }}
      >
        {readOnly ? (
          highlightOn ? (
            impl === 'monaco' ? (
              <Suspense
                fallback={
                  <HighlightedCode
                    code={value}
                    language={language}
                    copyable={false}
                    showLineNumbers={showLineNumbers}
                    dataTestId={dataTestId}
                    ariaLabel={ariaLabel || label}
                  />
                }
              >
                <MonacoHighlightedCode
                  code={value}
                  language={language}
                  copyable={false}
                  showLineNumbers={showLineNumbers}
                  dataTestId={dataTestId}
                  ariaLabel={ariaLabel || label}
                  error={error}
                />
              </Suspense>
            ) : (
              <HighlightedCode
                code={value}
                language={language}
                copyable={false}
                showLineNumbers={showLineNumbers}
                dataTestId={dataTestId}
                ariaLabel={ariaLabel || label}
              />
            )
          ) : (
            <textarea
              data-testid={dataTestId ? `${dataTestId}-content` : undefined}
              aria-label={ariaLabel || label}
              value={value}
              readOnly
              placeholder={placeholder}
              className="flex-1 w-full p-3 rounded-md bg-background border border-input font-mono text-sm resize-none outline-none"
              style={{ borderColor: error ? '#ef4444' : undefined }}
            />
          )
        ) : impl === 'monaco' ? (
          <Suspense
            fallback={
              <CodeEditor
                value={value}
                onChange={(val) => onChange?.(val)}
                language={language}
                highlight={highlightOn}
                placeholder={placeholder}
                dataTestId={dataTestId}
                ariaLabel={ariaLabel || label}
              />
            }
          >
            <MonacoCodeEditor
              value={value}
              onChange={(val) => onChange?.(val)}
              language={language}
              readOnly={false}
              showLineNumbers={showLineNumbers}
              placeholder={placeholder}
              dataTestId={dataTestId}
              ariaLabel={ariaLabel || label}
            />{' '}
          </Suspense>
        ) : (
          <CodeEditor
            value={value}
            onChange={(val) => onChange?.(val)}
            language={language}
            highlight={highlightOn}
            placeholder={placeholder}
            dataTestId={dataTestId}
            ariaLabel={ariaLabel || label}
          />
        )}
      </div>
    </div>
  );
}

export default ToolEditorPane;
