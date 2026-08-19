import { test, expect } from '@playwright/test';

test.describe('Cron Job Parser', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/cron');
    await expect(page.getByRole('heading', { name: 'Cron Job Parser' })).toBeVisible();
  });

  test('loads with default expression */15 * * * *', async ({ page }) => {
    const expressionInput = page.locator('input[type="text"]').first();
    await expect(expressionInput).toHaveValue('*/15 * * * *');
    await expect(page.getByText('Every 15 minutes')).toBeVisible();
  });

  test('preset buttons change expression', async ({ page }) => {
    const everyMinuteButton = page.getByRole('button', { name: 'Every Minute' });
    await everyMinuteButton.click();

    const expressionInput = page.locator('input[type="text"]').first();
    await expect(expressionInput).toHaveValue('* * * * *');
    await expect(page.getByText('Every minute', { exact: true })).toBeVisible();
  });

  test('field breakdown table shows 5 fields', async ({ page }) => {
    await expect(page.getByText('Field Breakdown')).toBeVisible();

    await expect(page.getByText('Minute', { exact: true })).toBeVisible();
    await expect(page.getByText('Hour', { exact: true })).toBeVisible();
    await expect(page.getByText('Day', { exact: true })).toBeVisible();
    await expect(page.getByText('Month', { exact: true })).toBeVisible();
    await expect(page.getByText('Weekday', { exact: true })).toBeVisible();
  });

  test('execution timeline shows current time', async ({ page }) => {
    await expect(page.getByText('Execution Timeline')).toBeVisible();
    await expect(page.getByText('Current')).toBeVisible();
    await expect(page.getByText('Next in')).toBeVisible();
  });

  test('description text appears for valid expression', async ({ page }) => {
    await expect(page.getByText('Every 15 minutes')).toBeVisible();

    const dailyButton = page.getByRole('button', { name: 'Daily', exact: true });
    await dailyButton.click();
    await expect(page.getByText('At 12:00 AM')).toBeVisible();
  });

  test('invalid expression shows error', async ({ page }) => {
    const expressionInput = page.locator('input[type="text"]').first();
    await expressionInput.fill('invalid');

    await expect(page.getByText('Invalid cron expression')).toBeVisible();
  });

  test('expression input can be edited', async ({ page }) => {
    const expressionInput = page.locator('input[type="text"]').first();
    await expressionInput.fill('0 0 * * 0');

    await expect(expressionInput).toHaveValue('0 0 * * 0');
    await expect(page.getByText('At 12:00 AM, only on Sunday')).toBeVisible();
  });

  test('execution timeline shows previous and next executions', async ({ page }) => {
    await expect(page.getByText('Previous')).toBeVisible();
    await expect(page.getByText('Next', { exact: true })).toBeVisible();

    const timelineTable = page.locator('div').filter({ hasText: 'Execution Timeline' }).nth(1);
    const timeCells = timelineTable.locator('td');
    await expect(timeCells.first()).toBeVisible();
  });

  test('refresh button resets to now', async ({ page }) => {
    const refreshButton = page.getByTitle('Reset to now');
    await expect(refreshButton).toBeVisible();

    await refreshButton.click();
    await expect(page.getByText('Current')).toBeVisible();
  });

  test('weekly preset updates field breakdown values', async ({ page }) => {
    const weeklyButton = page.getByRole('button', { name: 'Weekly', exact: true });
    await weeklyButton.click();

    const expressionInput = page.locator('input[type="text"]').first();
    await expect(expressionInput).toHaveValue('0 0 * * 0');

    const fieldBreakdown = page.locator('div').filter({ hasText: 'Field Breakdown' }).nth(1);
    await expect(fieldBreakdown.locator('text=0').first()).toBeVisible();
  });

  test('copy button copies expression to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyButton = page.locator('button[title="Copy to clipboard"]').first();
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('*/15 * * * *');
  });

  test('copy button copies human-readable description to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    const copyButton = page.locator('button[title="Copy to clipboard"]').nth(1);
    await copyButton.click();

    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toBe('Every 15 minutes');
  });
});
