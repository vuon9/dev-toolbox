import { test, expect } from '@playwright/test';
import { expectEditorContains, expectEditorNotEmpty } from './helpers/editor';

test.describe('JWT Debugger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tool/jwt');
  });

  test('should load with decode mode active', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'JWT Debugger' })).toBeVisible();
    await expect(page.getByText('Inspect, decode, and encode JSON Web Tokens')).toBeVisible();
    // Decode mode shows Encoded Token textarea
    await expect(page.getByText('Encoded Token', { exact: true })).toBeVisible();
  });

  test('should fill sample data in decode mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Sample' }).click();
    await expectEditorNotEmpty(page, 'jwt-decode-token');
    await expectEditorContains(page, 'jwt-decode-token', 'eyJ');
  });

  test('should decode sample JWT and show header + payload', async ({ page }) => {
    await page.getByRole('button', { name: 'Sample' }).click();
    await expectEditorNotEmpty(page, 'jwt-decode-header');
    await expectEditorNotEmpty(page, 'jwt-decode-payload');
    await expectEditorContains(page, 'jwt-decode-header', 'alg');
    await expectEditorContains(page, 'jwt-decode-payload', 'sub');
  });

  test('should switch to encode mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Encode' }).click();
    await expect(page.getByText('Header (JSON)', { exact: true })).toBeVisible();
    await expect(page.getByText('Payload (JSON)', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign & Encode' })).toBeVisible();
  });

  test('should fill sample data in encode mode', async ({ page }) => {
    await page.getByRole('button', { name: 'Encode' }).click();
    await page.getByRole('button', { name: 'Sample' }).click();
    await expectEditorContains(page, 'jwt-encode-header', 'alg');
    await expectEditorContains(page, 'jwt-encode-payload', 'sub');
  });

  test('should encode and generate a JWT token', async ({ page }) => {
    await page.getByRole('button', { name: 'Encode' }).click();
    await page.getByRole('button', { name: 'Sample' }).click();
    await page.getByRole('button', { name: 'Sign & Encode' }).click();
    await expectEditorNotEmpty(page, 'jwt-encode-token');
    await expectEditorContains(page, 'jwt-encode-token', 'eyJ');
  });

  test('should change algorithm selection', async ({ page }) => {
    await page.getByRole('button', { name: 'Encode' }).click();
    await page.getByRole('button', { name: 'Sample' }).click();
    // Algorithm dropdown shows HS256 by default
    await expect(page.getByRole('button', { name: 'HS256', exact: true })).toBeVisible();
    // Open dropdown and select HS512
    await page.getByRole('button', { name: 'HS256', exact: true }).click();
    await page.getByText('HS512', { exact: true }).click();
    await expect(page.getByRole('button', { name: 'HS512', exact: true })).toBeVisible();
  });

  test('should toggle secret visibility', async ({ page }) => {
    await page.getByRole('button', { name: 'Encode' }).click();
    await page.getByRole('button', { name: 'Sample' }).click();
    // Target the specific secret input container to avoid ambiguity
    const secretInput = page.locator('input[type="password"]').first();
    await expect(secretInput).toBeVisible();
    // The eye button is the sibling button inside the same flex container as the password input
    const eyeButton = secretInput.locator('xpath=../button');
    await eyeButton.click();
    await expect(
      page.locator('input[type="text"]').filter({ hasValue: 'your-256-bit-secret' })
    ).toBeVisible();
  });

  test('should show invalid signature when secret is wrong', async ({ page }) => {
    await page.getByRole('button', { name: 'Sample' }).click();
    // Enter wrong secret
    const secretInput = page.locator('input[type="password"]').first();
    await secretInput.fill('wrong-secret');
    // Wait for verification
    await expect(page.getByText('Invalid Signature / Format')).toBeVisible({ timeout: 5000 });
  });

  test('should show signature verified with correct secret', async ({ page }) => {
    await page.getByRole('button', { name: 'Sample' }).click();
    // Wait for verification
    await expect(page.getByText('Signature Verified')).toBeVisible({ timeout: 5000 });
  });

  test('should toggle layout orientation', async ({ page }) => {
    const split = page.locator('[data-layout-direction]');
    await expect(split).toHaveAttribute('data-layout-direction', 'horizontal');
    await page.getByTitle('Switch to vertical layout').click();
    await expect(split).toHaveAttribute('data-layout-direction', 'vertical');
  });
});
