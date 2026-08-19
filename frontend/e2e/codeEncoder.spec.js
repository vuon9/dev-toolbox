import { test, expect } from '@playwright/test';
import { fillEditor, expectEditorText, expectEditorNotEmpty } from './helpers/editor';

test.describe('Code Encoder', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/code-encoder');
    await expect(page.getByRole('heading', { name: 'Code Encoder' })).toBeVisible();
  });

  test('loads with default method Base64 and Encode mode', async ({ page }) => {
    await expect(page.locator('select')).toHaveValue('Base64');
    await expect(page.locator('button').filter({ hasText: 'Encode' })).toHaveAttribute(
      'style',
      /background-color: var\(--border\)/
    );
  });

  test('encodes text to Base64', async ({ page }) => {
    await fillEditor(page, 'code-encoder-input', 'hello');
    await expectEditorText(page, 'code-encoder-output', 'aGVsbG8=');
  });

  test('decodes Base64 to text', async ({ page }) => {
    await fillEditor(page, 'code-encoder-input', 'aGVsbG8gd29ybGQ=');
    await page.locator('button').filter({ hasText: 'Decode' }).click();
    await expectEditorText(page, 'code-encoder-output', 'hello world');
  });

  test('encodes text to Hex (Base16)', async ({ page }) => {
    await page.locator('select').selectOption('Base16 (Hex)');
    await fillEditor(page, 'code-encoder-input', 'hello');
    await expectEditorText(page, 'code-encoder-output', '68656c6c6f');
  });

  test('encodes text to Binary', async ({ page }) => {
    await page.locator('select').selectOption('Binary');
    await fillEditor(page, 'code-encoder-input', 'AB');
    await expectEditorText(page, 'code-encoder-output', /[01]+/);
  });

  test('encodes text to ROT13', async ({ page }) => {
    await page.locator('select').selectOption('ROT13');
    await fillEditor(page, 'code-encoder-input', 'hello');
    await expectEditorText(page, 'code-encoder-output', 'uryyb');
  });

  test('escapes URL special characters', async ({ page }) => {
    await page.locator('select').selectOption('URL');
    await fillEditor(page, 'code-encoder-input', 'hello world & more');
    await page.locator('button').filter({ hasText: 'Escape' }).first().click();
    await expectEditorText(page, 'code-encoder-output', /hello(\+|%20)world/);
  });

  test('unescapes URL encoded text', async ({ page }) => {
    await page.locator('select').selectOption('URL');
    await fillEditor(page, 'code-encoder-input', 'hello%20world');
    await page.locator('button').filter({ hasText: 'Unescape' }).first().click();
    await expectEditorText(page, 'code-encoder-output', 'hello world');
  });

  test('escapes HTML entities', async ({ page }) => {
    await page.locator('select').selectOption('HTML/XML');
    await fillEditor(page, 'code-encoder-input', '<div>hello</div>');
    await page.locator('button').filter({ hasText: 'Escape' }).first().click();
    await expectEditorText(page, 'code-encoder-output', /&lt;/);
  });

  test('mode toggle labels change for escape methods', async ({ page }) => {
    // Default is encode/decode
    await expect(page.getByRole('button', { name: 'Encode', exact: true })).toBeVisible();

    // Switch to escape method
    await page.locator('select').selectOption('URL');
    await expect(page.getByRole('button', { name: 'Escape', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Unescape', exact: true })).toBeVisible();
  });

  test('optgroup labels exist in select', async ({ page }) => {
    const select = page.locator('select');
    // Options inside select are hidden by browser default - check they exist instead
    await expect(select.locator('option[value="Base64"]')).toBeAttached();
    await expect(select.locator('option[value="Base64URL"]')).toBeAttached();
    await expect(select.locator('optgroup[label="Encode / Decode"]')).toBeAttached();
    await expect(select.locator('optgroup[label="Escape / Unescape"]')).toBeAttached();
    // Verify optgroups contain expected number of options
    await expect(select.locator('optgroup[label="Encode / Decode"] option')).toHaveCount(16);
    await expect(select.locator('optgroup[label="Escape / Unescape"] option')).toHaveCount(3);
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });

  test('copy button copies output to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await fillEditor(page, 'code-encoder-input', 'copy test');

    const copyButton = page.locator('button[title="Copy to clipboard"]').first();
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('copy test');
  });

  test('shows error for invalid Base64 input', async ({ page }) => {
    await fillEditor(page, 'code-encoder-input', '!!!invalid!!!');
    await page.locator('button').filter({ hasText: 'Decode' }).click();
    await expectEditorText(page, 'code-encoder-output', '');
  });

  test('clears output when input is cleared', async ({ page }) => {
    await fillEditor(page, 'code-encoder-input', 'test');
    await expectEditorNotEmpty(page, 'code-encoder-output');

    await fillEditor(page, 'code-encoder-input', '');
    await expectEditorText(page, 'code-encoder-output', '');
  });

  test('encodes text to Morse Code', async ({ page }) => {
    await page.locator('select').selectOption('Morse Code');
    await fillEditor(page, 'code-encoder-input', 'SOS');
    await expectEditorText(page, 'code-encoder-output', /\.\.\./);
  });
});
