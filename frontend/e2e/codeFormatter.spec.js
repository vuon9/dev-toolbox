import { test, expect } from '@playwright/test';
import {
  fillEditor,
  readEditorText,
  expectEditorContains,
  expectEditorNotEmpty,
  expectEditorText,
} from './helpers/editor';

test.describe('Code Formatter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/code-formatter');
    await expect(page.getByRole('heading', { name: 'Code Formatter' })).toBeVisible();
  });

  test('loads with JSON default and empty panes', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'JSON' }).first()).toBeVisible();
    await expectEditorText(page, 'code-formatter-input', '');
    await expectEditorText(page, 'code-formatter-output', '');
    await expect(page.locator('input[placeholder=".users[].name"]')).toBeVisible();
  });

  test('load sample fills input', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Sample' }).click();

    await expectEditorNotEmpty(page, 'code-formatter-input');
    await expectEditorContains(page, 'code-formatter-input', 'users');
  });

  test('format produces output', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Sample' }).click();

    await expectEditorNotEmpty(page, 'code-formatter-output');
  });

  test('minify toggle changes output', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Sample' }).click();

    await expectEditorNotEmpty(page, 'code-formatter-output');

    const formattedText = await readEditorText(page, 'code-formatter-output');
    expect(formattedText).toContain('\n');

    await page.getByRole('button', { name: 'Minify' }).click();
    await page.waitForTimeout(400);

    const minifiedText = await readEditorText(page, 'code-formatter-output');
    const formattedNewlines = (formattedText.match(/\n/g) || []).length;
    const minifiedNewlines = (minifiedText.match(/\n/g) || []).length;
    expect(minifiedNewlines).toBeLessThan(formattedNewlines);
  });

  test('language switch works', async ({ page }) => {
    const langButton = page
      .getByText('Language', { exact: true })
      .locator('..')
      .locator('button')
      .first();
    await langButton.click();
    await page.getByText('XML', { exact: true }).click();

    await page.getByRole('button', { name: 'Load Sample' }).click();

    await expectEditorContains(page, 'code-formatter-input', '<?xml');
  });

  test('invalid JSON shows error', async ({ page }) => {
    await fillEditor(page, 'code-formatter-input', '{ invalid json }');

    await expect(page.getByText(/invalid JSON/i)).toBeVisible({ timeout: 2000 });
  });

  test('filter bar appears for JSON and XML but not CSS', async ({ page }) => {
    await expect(page.locator('input[placeholder=".users[].name"]')).toBeVisible();

    const langButton = page
      .getByText('Language', { exact: true })
      .locator('..')
      .locator('button')
      .first();

    await langButton.click();
    await page.getByText('XML', { exact: true }).click();
    await expect(page.locator('input[placeholder="//book"]')).toBeVisible();

    await langButton.click();
    await page.getByText('CSS', { exact: true }).click();
    await expect(page.locator('input[placeholder=".users[].name"]')).not.toBeVisible();
    await expect(page.locator('input[placeholder="//book"]')).not.toBeVisible();
  });

  test('output has syntax highlighting', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Sample' }).click();

    await expect(page.getByTestId('code-formatter-output')).toBeVisible();
    await expect(page.getByTestId('code-formatter-output-content')).toHaveAttribute(
      'aria-label',
      'Output'
    );
  });

  test('output pane shows line numbers', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Sample' }).click();

    await expectEditorNotEmpty(page, 'code-formatter-output');
    await expect(
      page
        .getByTestId('code-formatter-output')
        .locator('.cm-gutters, .monaco-editor .margin-view-overlays')
        .first()
    ).toBeVisible();
  });

  test('filter input filters JSON output', async ({ page }) => {
    await page.getByRole('button', { name: 'Load Sample' }).click();

    const filterInput = page.locator('input[placeholder=".users[].name"]');
    await filterInput.fill('.users[].name');
    await page.waitForTimeout(500);

    const text = await readEditorText(page, 'code-formatter-output');
    expect(text).toContain('Alice');
    expect(text).toContain('Bob');
    expect(text).not.toContain('age');
    expect(text).not.toContain('count');
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });

  test('copy button copies input to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await fillEditor(page, 'code-formatter-input', 'copy this input');

    const copyButton = page.locator('button[title="Copy to clipboard"]').first();
    await copyButton.click();

    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe('copy this input');
  });
});
