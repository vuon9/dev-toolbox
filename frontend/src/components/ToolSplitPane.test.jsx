import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ToolSplitPane } from './ToolUI';

describe('ToolSplitPane', () => {
  it('renders a 2-column grid by default (horizontal split)', () => {
    const { container } = render(
      <ToolSplitPane>
        <div>pane a</div>
        <div>pane b</div>
      </ToolSplitPane>
    );
    const el = container.firstChild;
    expect(el).not.toBeNull();
    expect(el.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('renders a 2-column grid when columnCount={2} is explicit', () => {
    const { container } = render(
      <ToolSplitPane columnCount={2}>
        <div>pane a</div>
        <div>pane b</div>
      </ToolSplitPane>
    );
    const el = container.firstChild;
    expect(el.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('renders a single column when columnCount={1}', () => {
    const { container } = render(
      <ToolSplitPane columnCount={1}>
        <div>pane a</div>
      </ToolSplitPane>
    );
    const el = container.firstChild;
    expect(el.style.gridTemplateColumns).toBe('1fr');
  });
});
