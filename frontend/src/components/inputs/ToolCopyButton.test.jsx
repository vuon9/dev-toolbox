import { it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ToolCopyButton from './ToolCopyButton';

it('ToolCopyButton exposes title="Copy to clipboard"', () => {
  render(<ToolCopyButton text="x" />);
  expect(screen.getByRole('button', { name: 'Copy' })).toHaveAttribute(
    'title',
    'Copy to clipboard'
  );
});
