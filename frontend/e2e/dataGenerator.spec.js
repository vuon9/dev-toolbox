import { test, expect } from '@playwright/test';
import {
  readEditorText,
  expectEditorNotEmpty,
  expectEditorContains,
  expectEditorText,
} from './helpers/editor';

test.describe('Data Generator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/data-generator');
    await expect(page.getByRole('heading', { name: 'Data Generator' })).toBeVisible();
  });

  test('loads with default schema and empty output', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'JSON' })).toBeVisible();
    await expect(page.locator('input[type="number"]').first()).toHaveValue('10');
    await expect(page.locator('input[placeholder="Field name"]')).toHaveCount(5);
    await expect(page.locator('input[placeholder="Field name"]').first()).toHaveValue('id');

    await expectEditorText(page, 'data-generator-output', '');
    await expect(
      page.getByRole('button', { name: 'Copy to Clipboard', exact: true })
    ).not.toBeAttached();
  });

  test('generate button produces output', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate' }).click();

    await expectEditorNotEmpty(page, 'data-generator-output');
    await expectEditorText(
      page,
      'data-generator-output',
      /^(?!Generated data will appear here\.\.\.)/
    );
  });

  test('output is valid JSON when format is JSON', async ({ page }) => {
    await page.getByRole('button', { name: 'Generate' }).click();

    await expectEditorNotEmpty(page, 'data-generator-output');

    const text = await readEditorText(page, 'data-generator-output');
    const parsed = JSON.parse(text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(10);
  });

  test('successful generate clears a previous error', async ({ page }) => {
    const fieldName = page.locator('input[placeholder="Field name"]').first();
    const outputPane = page.getByTestId('data-generator-output-pane');

    // Trigger an error: a field name containing "{{" makes the built template
    // invalid for the Go template engine.
    await fieldName.fill('{{bad');
    await page.getByRole('button', { name: 'Generate' }).click();

    await expectEditorContains(page, 'data-generator-output', /Error/i);
    await expect(outputPane).toHaveCSS('border-top-width', '1px');

    // A subsequent successful generate must clear the error state entirely.
    await fieldName.fill('id');
    await page.getByRole('button', { name: 'Generate' }).click();

    await expectEditorNotEmpty(page, 'data-generator-output');
    const text = await readEditorText(page, 'data-generator-output');
    expect(text).not.toMatch(/^Error/);
    expect(JSON.parse(text).length).toBe(10);
    await expect(outputPane).toHaveCSS('border-top-width', '0px');
  });

  test('format selection changes output format', async ({ page }) => {
    await page.getByRole('button', { name: 'JSON' }).click();
    await page.getByText('CSV', { exact: true }).click();

    await page.getByRole('button', { name: 'Generate' }).click();

    await expectEditorNotEmpty(page, 'data-generator-output');

    const text = await readEditorText(page, 'data-generator-output');
    expect(text).toContain(',');
    expect(text).not.toContain('[');
  });

  test('add field increases schema count', async ({ page }) => {
    await expect(page.locator('input[placeholder="Field name"]')).toHaveCount(5);

    await page.getByRole('button', { name: 'Add Field' }).click();
    await expect(page.locator('input[placeholder="Field name"]')).toHaveCount(6);
  });

  test('remove field decreases schema count', async ({ page }) => {
    await expect(page.locator('input[placeholder="Field name"]')).toHaveCount(5);

    const firstField = page.locator('input[placeholder="Field name"]').first();
    const removeButton = firstField.locator('..').locator('button').last();
    await removeButton.click();

    await expect(page.locator('input[placeholder="Field name"]')).toHaveCount(4);
  });

  test('copy button copies output to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.getByRole('button', { name: 'Generate' }).click();
    await expectEditorNotEmpty(page, 'data-generator-output');

    const copyButton = page.getByRole('button', { name: 'Copy to Clipboard', exact: true });
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    const outputText = await readEditorText(page, 'data-generator-output');
    expect(clipboardText).toBe(outputText);
  });

  test('help modal opens and closes', async ({ page }) => {
    await page.getByRole('button', { name: 'Help' }).click();
    await expect(page.getByRole('heading', { name: 'Documentation & Help' })).toBeVisible();

    await page
      .getByRole('heading', { name: 'Documentation & Help' })
      .locator('..')
      .locator('button')
      .click();
    await expect(page.getByRole('heading', { name: 'Documentation & Help' })).not.toBeVisible();
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });
});
