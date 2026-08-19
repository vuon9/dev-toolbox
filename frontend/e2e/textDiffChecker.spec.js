import { test, expect } from '@playwright/test';
import { editor, fillEditor, expectEditorText } from './helpers/editor';

test.describe('Text Diff Checker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/diff');
    await expect(page.getByRole('heading', { name: 'Text Diff' })).toBeVisible();
  });

  test('loads in edit mode with two empty editors', async ({ page }) => {
    await expect(editor(page, 'text-diff-original')).toBeVisible();
    await expect(editor(page, 'text-diff-modified')).toBeVisible();
    await expectEditorText(page, 'text-diff-original', '');
    await expectEditorText(page, 'text-diff-modified', '');

    // Labels should be visible
    await expect(page.getByText('Original Text', { exact: true })).toBeVisible();
    await expect(page.getByText('Modified Text', { exact: true })).toBeVisible();
  });

  test('entering text in both panes preserves values', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'Line one\nLine two');
    await fillEditor(page, 'text-diff-modified', 'Line one\nLine three');

    await expectEditorText(page, 'text-diff-original', 'Line one\nLine two');
    await expectEditorText(page, 'text-diff-modified', 'Line one\nLine three');
  });

  test('switching to diff mode shows differences', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'apple\nbanana');
    await fillEditor(page, 'text-diff-modified', 'apple\ncherry');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();

    // Diff view should render
    await expect(page.getByText('Original', { exact: true })).toBeVisible();
    await expect(page.getByText('Modified', { exact: true })).toBeVisible();
  });

  test('split view shows two panes', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'A\nB');
    await fillEditor(page, 'text-diff-modified', 'A\nC');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();

    // Default view is split
    await expect(page.getByText('Original', { exact: true })).toBeVisible();
    await expect(page.getByText('Modified', { exact: true })).toBeVisible();
  });

  test('unified view shows single pane with prefixes', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'A\nB');
    await fillEditor(page, 'text-diff-modified', 'A\nC');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();
    await page.getByRole('button', { name: 'Unified', exact: true }).click();

    // Unified pane should show + and - prefixes
    await expect(page.getByText('-B').first()).toBeVisible();
    await expect(page.getByText('+C').first()).toBeVisible();
  });

  test('added lines are green in diff view', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'apple');
    await fillEditor(page, 'text-diff-modified', 'apple\nbanana');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();

    // Target the diff line by its unique added-line background color
    const addedLine = page
      .locator('div[style*="background-color: rgba(34, 197, 94, 0.15)"]')
      .filter({ hasText: 'banana' })
      .first();
    await expect(addedLine).toBeVisible();
  });

  test('removed lines are red in diff view', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'apple\nbanana');
    await fillEditor(page, 'text-diff-modified', 'apple');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();

    // Target the diff line by its unique removed-line background color
    const removedLine = page
      .locator('div[style*="background-color: rgba(239, 68, 68, 0.15)"]')
      .filter({ hasText: 'banana' })
      .first();
    await expect(removedLine).toBeVisible();
  });

  test('reset button clears both texts', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'some original text');
    await fillEditor(page, 'text-diff-modified', 'some modified text');

    await page.getByRole('button', { name: 'Reset' }).click();

    await expectEditorText(page, 'text-diff-original', '');
    await expectEditorText(page, 'text-diff-modified', '');
  });

  test('diff mode toggle changes granularity', async ({ page }) => {
    await fillEditor(page, 'text-diff-original', 'The quick brown fox');
    await fillEditor(page, 'text-diff-modified', 'The slow brown fox');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();

    // Default is Lines; switch to Words
    await page.getByRole('button', { name: 'Words', exact: true }).click();

    // In word-level diff, the changed word should appear as a removed line
    const diffContainer = page
      .locator('div[style*="background-color: rgba(239, 68, 68, 0.15)"]')
      .filter({ hasText: 'quick' })
      .first();
    await expect(diffContainer).toBeVisible();

    // Switch to Chars
    await page.getByRole('button', { name: 'Chars', exact: true }).click();
    // Verify diff view is still rendering
    await expect(page.getByText('Original', { exact: true })).toBeVisible();
    await expect(page.getByText('Modified', { exact: true })).toBeVisible();
  });

  test('toggles input layout orientation', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });

  test('copy button copies input to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await fillEditor(page, 'text-diff-original', 'copy this original');

    const copyButton = page.locator('button[title="Copy to clipboard"]').first();
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('copy this original');
  });

  test('copy button copies diff result to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    await fillEditor(page, 'text-diff-original', 'A\nB');
    await fillEditor(page, 'text-diff-modified', 'A\nC');

    await page.getByRole('button', { name: 'Diff', exact: true }).click();

    // In diff mode only the diff-result copy button remains
    const copyButton = page.locator('button[title="Copy to clipboard"]');
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe(' A\n-B\n+C');
  });
});
