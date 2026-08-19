import React from 'react';
import { ToolSplitPane } from '../ToolUI';
import ToolLayoutToggle from './ToolLayoutToggle';
import ToolVerticalSplit from './ToolVerticalSplit';
import useLayoutToggle from '../../hooks/useLayoutToggle';

/**
 * Main layout component with toggleable direction
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child panes (2 or more)
 * @param {string} [props.toolKey] - Unique key for the tool (required for persistence)
 * @param {'horizontal'|'vertical'} [props.direction='horizontal'] - Initial direction
 * @param {boolean} [props.showToggle=true] - Show layout toggle button
 * @param {boolean} [props.persist=false] - Remember layout preference in localStorage
 * @param {'top-right'|'controls'|'floating'} [props.togglePosition='top-right'] - Toggle button position
 * @param {string} [props.gap] - Spacing between panes (defaults based on direction)
 * @param {boolean} [props.equalHeight=true] - Whether panes should have equal height
 * @param {Object} [props.style={}] - Additional container styles
 */
export default function ToolLayout({
  children,
  toolKey = 'unnamed-tool',
  direction = 'horizontal',
  onToggle,
  showToggle = true,
  persist = false,
  togglePosition = 'top-right',
  gap,
  equalHeight = true,
  style = {},
}) {
  // Controlled vs uncontrolled mode
  const isControlled = onToggle !== undefined;

  let layout;
  if (!isControlled) {
    // Uncontrolled: use internal hook
    layout = useLayoutToggle({
      toolKey,
      defaultDirection: direction,
      showToggle,
      persist,
    });
  } else {
    // Controlled: derive from props
    const isHorizontal = direction === 'horizontal';
    const isVertical = direction === 'vertical';
    layout = {
      direction,
      isHorizontal,
      isVertical,
      toggleDirection: onToggle,
      showToggle,
    };
  }

  // Validate children count
  const childArray = React.Children.toArray(children);
  if (childArray.length < 2) {
    console.warn('ToolLayout expects at least 2 children');
  }

  // Determine gap based on direction if not specified
  const effectiveGap = gap || (layout.isHorizontal ? '1rem' : '0.75rem');

  // Render appropriate split component
  const SplitComponent = layout.isHorizontal ? ToolSplitPane : ToolVerticalSplit;

  return (
    <div
      className="tool-layout"
      data-layout-direction={layout.direction}
      style={{
        position: 'relative',
        flex: 1,
        minHeight: 0,
        ...style,
      }}
    >
      {/* Layout toggle button */}
      {layout.showToggle && (
        <ToolLayoutToggle
          direction={layout.direction}
          onToggle={layout.toggleDirection}
          position={togglePosition}
        />
      )}

      {/* Split layout with children */}
      <SplitComponent gap={effectiveGap} equalHeight={equalHeight}>
        {children}
      </SplitComponent>
    </div>
  );
}
