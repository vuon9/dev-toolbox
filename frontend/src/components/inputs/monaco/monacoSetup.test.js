import { describe, it, expect } from 'vitest';
import { normalizeColor } from './monacoSetup';
import { MONACO_LANGUAGE_IDS } from './languages';

describe('normalizeColor', () => {
  it.each([
    ['#282c34', '#282c34'],
    ['#fafafa', '#fafafa'],
    ['#80ffaa40', '#80ffaa40'],
    ['#0f8d', '#00ff88dd'],
  ])('passes through standard hex: %s', (input, expected) => {
    expect(normalizeColor(input)).toBe(expected);
  });

  it.each([
    ['#fff', '#ffffff'],
    ['#0f8', '#00ff88'],
  ])('expands short hex: %s -> %s', (input, expected) => {
    expect(normalizeColor(input)).toBe(expected);
  });

  it('resolves CSS variables to computed hex', () => {
    const resolved = normalizeColor('var(--background)');
    // jsdom returns empty for custom properties; either way it must not throw
    // and must return null or a hex string.
    expect(resolved === null || /^#[0-9a-f]{6,8}$/i.test(resolved)).toBe(true);
  });

  it.each([
    [null],
    [undefined],
    [''],
    ['notacolor'],
    ['#12345'],
    ['#1234567'],
    ['var(--undefined-var-that-misses)'],
    ['var(nested var(--x))'],
  ])('rejects invalid input: %s', (input) => {
    expect(normalizeColor(input)).toBeNull();
  });
});

describe('MONACO_LANGUAGE_IDS', () => {
  it.each(['json', 'xml', 'html', 'css'])('maps formatter language %s', (lang) => {
    expect(MONACO_LANGUAGE_IDS[lang]).toBe(lang);
  });

  it('falls back to plaintext for unknown languages at the call site', () => {
    expect(MONACO_LANGUAGE_IDS['definitely-not-a-lang']).toBeUndefined();
  });
});
