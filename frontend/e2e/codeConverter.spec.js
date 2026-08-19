import { test, expect } from '@playwright/test';
import {
  fillEditor,
  readEditorText,
  expectEditorText,
  expectEditorContains,
  expectEditorNotEmpty,
} from './helpers/editor';

test.describe('Code Converter', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/code-converter');
    await expect(page.getByRole('heading', { name: 'Code Converter' })).toBeVisible();
  });

  test('loads with default method JSON ↔ YAML', async ({ page }) => {
    const select = page.locator('select');
    await expect(select).toHaveValue('JSON ↔ YAML');
    await expect(page.getByTestId('code-converter-input')).toBeVisible();
    await expect(page.getByTestId('code-converter-output')).toBeVisible();
  });

  test('converts JSON to YAML', async ({ page }) => {
    await fillEditor(page, 'code-converter-input', '{"name": "test", "value": 42}');
    await expectEditorContains(page, 'code-converter-output', /name:\s*test/);
    await expectEditorContains(page, 'code-converter-output', /value:\s*42/);
  });

  test('converts YAML to JSON', async ({ page }) => {
    await fillEditor(page, 'code-converter-input', 'name: hello\nitems:\n  - a\n  - b');
    await expectEditorContains(page, 'code-converter-output', /"name":\s*"hello"/);
  });

  test('converts JSON to XML', async ({ page }) => {
    await page.locator('select').selectOption('JSON ↔ XML');
    await fillEditor(page, 'code-converter-input', '{"hello": "world"}');
    await expectEditorContains(page, 'code-converter-output', /<hello>/);
    await expectEditorContains(page, 'code-converter-output', /world/);
  });

  test('converts XML to JSON', async ({ page }) => {
    await page.locator('select').selectOption('JSON ↔ XML');
    await fillEditor(page, 'code-converter-input', '<root><name>test</name></root>');
    await expectEditorContains(page, 'code-converter-output', /"name"/);
  });

  test('case swapping', async ({ page }) => {
    await page.locator('select').selectOption('Case Swapping');
    await fillEditor(page, 'code-converter-input', 'Hello World');
    await expectEditorText(page, 'code-converter-output', 'hELLO wORLD');
  });

  test('converts CSV to JSON', async ({ page }) => {
    await page.locator('select').selectOption('JSON ↔ CSV / TSV');
    await fillEditor(page, 'code-converter-input', 'name,age\nAlice,30\nBob,25');
    await expectEditorContains(page, 'code-converter-output', /"name":\s*"Alice"/);
    await expectEditorContains(page, 'code-converter-output', /"age":\s*"30"/);
  });

  test('converts CSV to TSV', async ({ page }) => {
    await page.locator('select').selectOption('CSV ↔ TSV');
    await fillEditor(page, 'code-converter-input', 'name,age\nAlice,30');
    await expectEditorContains(page, 'code-converter-output', /name\tage/);
  });

  test('converts Key-Value to Query String', async ({ page }) => {
    await page.locator('select').selectOption('Key-Value ↔ Query String');
    await fillEditor(page, 'code-converter-input', 'foo=bar\nbaz=qux');
    await expectEditorNotEmpty(page, 'code-converter-output');
    const value = await readEditorText(page, 'code-converter-output');
    expect(value).toContain('baz=qux');
    expect(value).toContain('foo=bar');
  });

  test('converts Properties to JSON', async ({ page }) => {
    await page.locator('select').selectOption('Properties ↔ JSON');
    await fillEditor(page, 'code-converter-input', 'app.name=MyApp\napp.version=1.0');
    await expectEditorContains(page, 'code-converter-output', /"app.name":\s*"MyApp"/);
  });

  test('converts INI to JSON', async ({ page }) => {
    await page.locator('select').selectOption('INI ↔ JSON');
    await fillEditor(page, 'code-converter-input', '[section]\nkey=value');
    await expectEditorContains(page, 'code-converter-output', /"section"/);
    await expectEditorContains(page, 'code-converter-output', /"key":\s*"value"/);
  });

  test('converts curl to fetch', async ({ page }) => {
    await page.locator('select').selectOption('CURL ↔ Fetch');
    await fillEditor(
      page,
      'code-converter-input',
      'curl -X POST https://api.example.com/data -H \'Content-Type: application/json\' -d \'{"key":"value"}\''
    );
    await expectEditorContains(page, 'code-converter-output', /fetch\(/);
    await expectEditorContains(page, 'code-converter-output', /method:\s*'POST'/);
  });

  test('converts cron expression to text', async ({ page }) => {
    await page.locator('select').selectOption('Cron ↔ Text');
    await fillEditor(page, 'code-converter-input', '0 9 * * 1');
    await expectEditorContains(page, 'code-converter-output', /Monday/);
  });

  test('shows error for invalid JSON with YAML method', async ({ page }) => {
    await fillEditor(page, 'code-converter-input', 'not valid json');
    // Error should appear in the output pane (border turns red)
    await expectEditorText(page, 'code-converter-output', '');
  });

  test('clears output when input is cleared', async ({ page }) => {
    await fillEditor(page, 'code-converter-input', '{"test": true}');
    await expectEditorNotEmpty(page, 'code-converter-output');

    await fillEditor(page, 'code-converter-input', '');
    await expectEditorText(page, 'code-converter-output', '');
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });

  test('copy button copies output to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await fillEditor(page, 'code-converter-input', '{"copied": true}');

    const copyButton = page.locator('button[title="Copy to clipboard"]').first();
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('copied');
  });
});
