import { test, expect } from '@playwright/test';

test.describe('RegExp Tester', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/regexp');
    await expect(page.getByRole('heading', { name: 'RegExp Tester' })).toBeVisible();
  });

  test('loads with default pattern, text and flags', async ({ page }) => {
    const patternInput = page.locator('input[spellcheck="false"]');
    await expect(patternInput).toHaveValue('(\\w+)\\s(\\w+)');

    const testString = page.locator('textarea');
    await expect(testString).toHaveValue('John Doe, Jane Smith, Alan Turing');

    // Flags dropdown should show default "g"
    await expect(page.locator('button').filter({ hasText: /^g$/ })).toBeVisible();
  });

  test('pattern input exists with slash delimiters', async ({ page }) => {
    const patternContainer = page.locator('input[spellcheck="false"]').locator('..');
    await expect(patternContainer.locator('span').filter({ hasText: '/' }).first()).toBeVisible();
    await expect(patternContainer.locator('span').filter({ hasText: '/' }).last()).toBeVisible();
  });

  test('flags dropdown opens and shows toggleable flags', async ({ page }) => {
    const flagsButton = page.locator('button').filter({ hasText: /^g$/ });
    await flagsButton.click();

    const dropdown = page.locator('div').filter({ hasText: 'Global' }).first().locator('..');
    await expect(dropdown.getByText('Global', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Case Insensitive', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Multiline', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Dot All', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Unicode', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Indices', { exact: true })).toBeVisible();
    await expect(dropdown.getByText('Sticky', { exact: true })).toBeVisible();
  });

  test('test string shows live highlighting for matches', async ({ page }) => {
    const testString = page.locator('textarea');
    await testString.fill('Hello World');

    // The highlighted backdrop should contain styled match spans
    const backdrop = page
      .locator('div')
      .filter({ hasText: 'Hello World' })
      .locator('[style*="background-color"]')
      .first();
    await expect(backdrop).toBeVisible();
  });

  test('match result cards appear with positions', async ({ page }) => {
    // Default pattern and text produce 3 matches
    await expect(page.getByText('Match 1')).toBeVisible();
    await expect(page.getByText('Match 2')).toBeVisible();
    await expect(page.getByText('Match 3')).toBeVisible();
  });

  test('group captures are shown with colored labels', async ({ page }) => {
    await expect(page.getByText('Group 1').first()).toBeVisible();
    await expect(page.getByText('Group 2').first()).toBeVisible();

    // Group rows should have colored underlined labels
    const group1 = page.getByText('Group 1').first();
    await expect(group1).toHaveCSS('border-bottom', /solid/);
  });

  test('invalid regex shows red error message', async ({ page }) => {
    const patternInput = page.locator('input[spellcheck="false"]');
    await patternInput.fill('(');

    const errorMessage = page.getByText(/Invalid regular expression/).first();
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText('SyntaxError');
  });

  test('quick reference panel toggles open and closed', async ({ page }) => {
    const quickRefButton = page.getByRole('button', { name: 'Quick Reference' });
    await quickRefButton.click();

    // Panel should expand and show category buttons
    await expect(page.getByRole('button', { name: 'Common' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Anchors' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Quantifiers' })).toBeVisible();

    // Close it
    await quickRefButton.click();
    await expect(page.getByRole('button', { name: 'Common' })).not.toBeVisible();
  });

  test('copy all button exists in result pane', async ({ page }) => {
    const copyAllButton = page.getByRole('button', { name: 'Copy All' });
    await expect(copyAllButton).toBeVisible();
  });

  test('changing pattern updates results live', async ({ page }) => {
    const patternInput = page.locator('input[spellcheck="false"]');
    await patternInput.fill('Jane');

    await expect(page.getByText('Match 1')).toBeVisible();
    await expect(page.locator('text=Match 2')).not.toBeVisible();
  });

  test('layout toggle switches between horizontal and vertical', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });
});
