import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider } from '../../context/ThemeContext';
import ToolEditorPane from './ToolEditorPane';

/**
 * CodeEditor/HighlightedCode use useTheme() unconditionally, and ThemeProvider
 * reads window.matchMedia at mount. jsdom implements neither, so stub the
 * media query API before rendering the branches that mount an editor.
 */
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('ToolEditorPane', () => {
  it('renders editable CodeEditor when not readOnly', () => {
    renderWithTheme(
      <ToolEditorPane label="Input" value="x" ariaLabel="Input" dataTestId="t-input" />
    );
    expect(screen.getByText('Input')).toBeInTheDocument();
    expect(screen.getByLabelText('Input')).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Copy' })).not.toBeDisabled();
  });

  it('renders HighlightedCode when readOnly and highlightOn', async () => {
    renderWithTheme(
      <ToolEditorPane
        label="Output"
        value="hi"
        readOnly
        highlightOn
        language="json"
        ariaLabel="Output"
        dataTestId="t-out"
      />
    );
    const content = await screen.findByTestId('t-out-content');
    expect(content).toHaveAttribute('aria-readonly', 'true');
    expect(content).toHaveTextContent('hi');
  });

  it('renders a plain textarea when readOnly and not highlightOn', () => {
    render(
      <ToolEditorPane label="Output" value="hi" readOnly ariaLabel="Output" dataTestId="t-out" />
    );
    expect(screen.getByLabelText('Output')).toHaveAttribute('readonly');
  });

  it('shows the indicator badge when provided', () => {
    render(
      <ToolEditorPane
        label="Output"
        value="x"
        readOnly
        indicator="Result"
        indicatorColor="blue"
        ariaLabel="Output"
      />
    );
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  it('enables copy and writes to clipboard when value present', async () => {
    const writeText = vi.fn();
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ToolEditorPane label="Output" value="secret" readOnly ariaLabel="Output" />);
    const btn = screen.getByRole('button', { name: 'Copy' });
    expect(btn).not.toBeDisabled();
    await act(async () => {
      btn.click();
    });
    expect(writeText).toHaveBeenCalledWith('secret');
  });
});
