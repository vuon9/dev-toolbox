import { test, expect } from '@playwright/test';
import {
  fillEditor,
  readEditorText,
  expectEditorText,
  expectEditorNotEmpty,
} from './helpers/editor';

test.describe('Hash Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/hash-generator');
    await expect(page.getByRole('heading', { name: 'Hash Generator' })).toBeVisible();
  });

  test('loads with default method MD5', async ({ page }) => {
    await expect(page.locator('select')).toHaveValue('MD5');
    await expect(page.getByTestId('hash-generator-input')).toBeVisible();
    await expect(page.getByTestId('hash-generator-output')).toBeVisible();
  });

  test('generates MD5 hash', async ({ page }) => {
    await fillEditor(page, 'hash-generator-input', 'hello');
    await expectEditorText(page, 'hash-generator-output', '5d41402abc4b2a76b9719d911017c592');
  });

  test('generates SHA-256 hash', async ({ page }) => {
    await page.locator('select').selectOption('SHA-256');
    await fillEditor(page, 'hash-generator-input', 'hello');
    await expectEditorText(page, 'hash-generator-output', /[a-f0-9]{64}/);
  });

  test('generates SHA-1 hash', async ({ page }) => {
    await page.locator('select').selectOption('SHA-1');
    await fillEditor(page, 'hash-generator-input', 'hello');
    await expectEditorText(page, 'hash-generator-output', /[a-f0-9]{40}/);
  });

  test('generates all hashes at once', async ({ page }) => {
    await page.locator('select').selectOption('All');
    await fillEditor(page, 'hash-generator-input', 'hello');

    // All hashes mode shows a multi-hash output panel instead of textarea
    await expect(page.locator('span').filter({ hasText: 'All Hashes' })).toBeVisible();
    // The output is JSON rendered in MultiHashOutput component - check page contains hash data
    await expect(page.locator('body')).toContainText('5d41402abc4b2a76b9719d911017c592');
  });

  test('shows HMAC key input when HMAC is selected', async ({ page }) => {
    await page.locator('select').selectOption('HMAC');

    const hmacInput = page.locator('input[placeholder="HMAC Key"]');
    await expect(hmacInput).toBeVisible();
  });

  test('generates HMAC with key', async ({ page }) => {
    await page.locator('select').selectOption('HMAC');
    const hmacInput = page.locator('input[placeholder="HMAC Key"]');

    await hmacInput.fill('secretkey');
    await fillEditor(page, 'hash-generator-input', 'hello');

    await expectEditorNotEmpty(page, 'hash-generator-output');
    const hash = await readEditorText(page, 'hash-generator-output');
    expect(hash.length).toBeGreaterThan(0);
  });

  test('generates CRC32 hash', async ({ page }) => {
    await page.locator('select').selectOption('CRC32');
    await fillEditor(page, 'hash-generator-input', 'hello');
    await expectEditorNotEmpty(page, 'hash-generator-output');
  });

  test('generates bcrypt hash', async ({ page }) => {
    await page.locator('select').selectOption('bcrypt');
    await fillEditor(page, 'hash-generator-input', 'password123');
    await expectEditorNotEmpty(page, 'hash-generator-output');
    const hash = await readEditorText(page, 'hash-generator-output');
    expect(hash).toContain('$');
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });

  test('copy button copies output to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await fillEditor(page, 'hash-generator-input', 'copy hash test');

    const copyButton = page.locator('button[title="Copy to clipboard"]').nth(1);
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText.length).toBeGreaterThan(0);
  });

  test('clears output when input is cleared', async ({ page }) => {
    await fillEditor(page, 'hash-generator-input', 'test');
    await expectEditorNotEmpty(page, 'hash-generator-output');

    await fillEditor(page, 'hash-generator-input', '');
    await expectEditorText(page, 'hash-generator-output', '');
  });

  test('different inputs produce different hashes', async ({ page }) => {
    await fillEditor(page, 'hash-generator-input', 'input1');
    await expectEditorNotEmpty(page, 'hash-generator-output');
    const hash1 = await readEditorText(page, 'hash-generator-output');

    // Wait for debounce to settle before second input
    await page.waitForTimeout(500);
    await fillEditor(page, 'hash-generator-input', 'something-completely-different');
    // Wait for output to actually change to a new value
    await expect
      .poll(async () => await readEditorText(page, 'hash-generator-output'))
      .not.toBe(hash1);
    const hash2 = await readEditorText(page, 'hash-generator-output');

    expect(hash1).not.toBe(hash2);
  });

  test('same input produces same hash', async ({ page }) => {
    await fillEditor(page, 'hash-generator-input', 'consistent');
    await expectEditorNotEmpty(page, 'hash-generator-output');
    const hash1 = await readEditorText(page, 'hash-generator-output');

    await fillEditor(page, 'hash-generator-input', '');
    await fillEditor(page, 'hash-generator-input', 'consistent');
    await expectEditorNotEmpty(page, 'hash-generator-output');
    const hash2 = await readEditorText(page, 'hash-generator-output');

    expect(hash1).toBe(hash2);
  });

  test('generates BLAKE3 hash', async ({ page }) => {
    await page.locator('select').selectOption('BLAKE3');
    await fillEditor(page, 'hash-generator-input', 'hello');
    await expectEditorNotEmpty(page, 'hash-generator-output');
    const hash = await readEditorText(page, 'hash-generator-output');
    expect(hash.length).toBeGreaterThanOrEqual(32);
  });
});
