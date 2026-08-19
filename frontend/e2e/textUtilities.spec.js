import { test, expect } from '@playwright/test';
import { fillEditor, readEditorText, expectEditorText } from './helpers/editor';

test.describe('Text Utilities', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/text-utilities');
    await expect(page.getByRole('heading', { name: 'Text Utilities' })).toBeVisible();
  });

  test('loads with empty input and zero stats', async ({ page }) => {
    await expectEditorText(page, 'text-utilities-input', '');
    await expect(page.locator('text=Chars').locator('..').locator('span').nth(1)).toHaveText('0');
    await expect(page.locator('text=Words').locator('..').locator('span').nth(1)).toHaveText('0');
    await expect(page.locator('text=Lines').locator('..').locator('span').nth(1)).toHaveText('0');
  });

  test('updates stats when text is entered', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'Hello world');

    await expect(page.locator('text=Chars').locator('..').locator('span').nth(1)).toHaveText('11');
    await expect(page.locator('text=Words').locator('..').locator('span').nth(1)).toHaveText('2');
    await expect(page.locator('text=Lines').locator('..').locator('span').nth(1)).toHaveText('1');
  });

  test('sorts lines in ascending order', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'zebra\napple\nbanana');

    await page.getByRole('button', { name: 'Asc', exact: true }).click();

    await expectEditorText(page, 'text-utilities-input', 'apple\nbanana\nzebra');
  });

  test('sorts lines in descending order', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'apple\nzebra\nbanana');

    await page.locator('button').filter({ hasText: 'Desc' }).click();

    await expectEditorText(page, 'text-utilities-input', 'zebra\nbanana\napple');
  });

  test('removes duplicate lines', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'apple\napple\nbanana\napple\ncherry');

    await page.locator('button').filter({ hasText: 'Dedupe' }).click();
    await page.waitForTimeout(300);

    const value = await readEditorText(page, 'text-utilities-input');
    expect(value).toContain('apple');
    expect(value).toContain('banana');
    expect(value).toContain('cherry');

    // Should have fewer lines than the original 5
    const lines = value.split('\n').filter((l) => l.trim() !== '');
    expect(lines.length).toBeLessThan(5);

    // No consecutive duplicates
    for (let i = 1; i < lines.length; i++) {
      expect(lines[i]).not.toBe(lines[i - 1]);
    }
  });

  test('trims whitespace from lines', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', '  apple  \n  banana  ');

    await page.getByRole('button', { name: 'Trim' }).click();
    await page.waitForTimeout(300);

    const value = await readEditorText(page, 'text-utilities-input');
    // Trim removes leading/trailing whitespace from lines
    expect(value).toContain('apple');
    expect(value).toContain('banana');
    // After trim, each line should not have leading/trailing spaces
    const lines = value.split('\n');
    for (const line of lines) {
      expect(line).toBe(line.trim());
    }
  });

  test('removes empty lines', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'apple\n\nbanana\n\n\ncherry');

    await page.locator('button').filter({ hasText: 'Rm Empty' }).click();
    await page.waitForTimeout(300);

    const value = await readEditorText(page, 'text-utilities-input');
    expect(value).not.toContain('\n\n');
  });

  test('converts to UPPERCASE', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'Hello World');

    await page.locator('button').filter({ hasText: 'UPPER' }).click();

    await expectEditorText(page, 'text-utilities-input', 'HELLO WORLD');
  });

  test('converts to lowercase', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'Hello World');

    await page.locator('button').filter({ hasText: 'lower' }).click();

    await expectEditorText(page, 'text-utilities-input', 'hello world');
  });

  test('converts to camelCase', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'hello world');

    await page.locator('button').filter({ hasText: 'camelCase' }).click();

    await expectEditorText(page, 'text-utilities-input', 'helloWorld');
  });

  test('converts to PascalCase', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'hello world');

    await page.locator('button').filter({ hasText: 'PascalCase' }).click();

    await expectEditorText(page, 'text-utilities-input', 'HelloWorld');
  });

  test('converts to snake_case', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'hello world');

    await page.getByRole('button', { name: 'snake_case' }).click();
    await page.waitForTimeout(300);

    const value = await readEditorText(page, 'text-utilities-input');
    expect(value).toContain('hello');
    expect(value).toContain('world');
    expect(value).toContain('_');
  });

  test('converts to kebab-case', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'hello world');

    await page.getByRole('button', { name: 'kebab-case' }).click();
    await page.waitForTimeout(300);

    const value = await readEditorText(page, 'text-utilities-input');
    expect(value).toContain('hello');
    expect(value).toContain('world');
    expect(value).toContain('-');
  });

  test('converts to Sentence case', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'hello world. second sentence.');

    await page.getByRole('button', { name: 'Sentence' }).click();
    await page.waitForTimeout(300);

    const value = await readEditorText(page, 'text-utilities-input');
    // Sentence case capitalizes the first letter
    expect(value).toMatch(/^Hello/);
  });

  test('escapes string literal', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'line1\nline2\t"quoted"');

    // Find the escape section and click Run
    const escapeSection = page.locator('div').filter({ hasText: 'Escape / Unescape' }).first();
    await escapeSection.locator('select').selectOption('String Literal');
    await escapeSection.locator('button').filter({ hasText: 'Escape' }).first().click();
    await escapeSection.locator('button').filter({ hasText: 'Run' }).click();

    // Result should appear in the escape result span
    await expect(escapeSection.locator('span').filter({ hasText: /line1/ })).toBeVisible();
  });

  test('unescapes string literal', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'line1\\nline2');

    const escapeSection = page.locator('div').filter({ hasText: 'Escape / Unescape' }).first();
    await escapeSection.locator('select').selectOption('String Literal');
    await escapeSection.locator('button').filter({ hasText: 'Unescape' }).first().click();
    await escapeSection.locator('button').filter({ hasText: 'Run' }).click();

    await expect(escapeSection.locator('span').filter({ hasText: /line1/ })).toBeVisible();
  });

  test('escape/unescape mode toggle works', async ({ page }) => {
    const escapeSection = page.locator('div').filter({ hasText: 'Escape / Unescape' }).first();
    const unescapeButton = escapeSection.locator('button').filter({ hasText: 'Unescape' }).first();
    const escapeButton = escapeSection.locator('button').filter({ hasText: 'Escape' }).first();

    await unescapeButton.click();
    await expect(unescapeButton).toHaveAttribute('style', /background-color: var\(--border\)/);

    await escapeButton.click();
    await expect(escapeButton).toHaveAttribute('style', /background-color: var\(--border\)/);
  });

  test('reset button clears everything', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'some text to reset');

    await page.locator('button').filter({ hasText: 'Reset' }).click();

    await expectEditorText(page, 'text-utilities-input', '');
    await expect(page.locator('text=Chars').locator('..').locator('span').nth(1)).toHaveText('0');
  });

  test('copy button copies input to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await fillEditor(page, 'text-utilities-input', 'copy this text');

    const copyButton = page.locator('button[title="Copy to clipboard"]').first();
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('copy this text');
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });

  test('counts multi-line text correctly', async ({ page }) => {
    await fillEditor(page, 'text-utilities-input', 'Line one.\nLine two.\nLine three.');

    await expect(page.locator('text=Lines').locator('..').locator('span').nth(1)).toHaveText('3');
    await expect(page.locator('text=Sentences').locator('..').locator('span').nth(1)).toHaveText(
      '3'
    );
  });
});
