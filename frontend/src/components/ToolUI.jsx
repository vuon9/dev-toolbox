import React from 'react';
import { ToolTextArea } from './inputs/ToolTextArea';
import { ToolCopyButton } from './inputs';

// Re-export new layout components
export { ToolLayout, ToolLayoutToggle, ToolVerticalSplit } from './layout';
export { LAYOUT_DIRECTIONS, TOGGLE_POSITIONS } from './layout/constants';
export {
  ToolCopyButton,
  ToolInput,
  ToolInputGroup,
  ToolTabBar,
  CodeEditor,
  HighlightedCode,
  EditorToggle,
} from './inputs';

export { ToolTextArea };

export function ToolHeader({ title, description }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
  );
}

export function ToolControls({ children, className = '' }) {
  return <div className={`flex items-center gap-4 mb-6 ${className}`}>{children}</div>;
}

export function ToolPane({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  onCopy,
  className,
  ...props
}) {
  return (
    <div className={`flex flex-col h-full min-h-[50vh] ${className}`}>
      <div className="flex justify-between items-center min-h-[30px] mb-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>
        <ToolCopyButton text={value} onCopy={onCopy} />
      </div>
      <div className="flex-1 relative flex flex-col">
        <ToolTextArea
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          placeholder={placeholder}
          className="flex-1 h-full"
          {...props}
        />
      </div>
    </div>
  );
}

export function ToolSplitPane({ children, columnCount = 2, className = '' }) {
  const gridCols = columnCount === 1 ? 'grid-cols-1' : `grid-cols-${columnCount}`;
  return (
    <div className={`grid ${gridCols} gap-4 flex-1 min-h-0 overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
