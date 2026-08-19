import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ToolLayout } from './index';

describe('ToolLayout', () => {
  it('exposes data-layout-direction on the split container', () => {
    const { container } = render(
      <ToolLayout toolKey="x"><div>a</div><div>b</div></ToolLayout>
    );
    const el = container.querySelector('[data-layout-direction]');
    expect(el).not.toBeNull();
    expect(el.getAttribute('data-layout-direction')).toBe('horizontal');
  });
});
