import { expect } from '@playwright/test';

export const editor = (page, testId) => page.getByTestId(testId);
export const editorContent = (page, testId) => page.getByTestId(`${testId}-content`);

async function editableTag(locator) {
  return locator.evaluate((el) => el.tagName.toLowerCase());
}

export async function fillEditor(page, testId, value) {
  const content = editorContent(page, testId);
  await expect(content).toBeVisible();

  const tag = await editableTag(content);
  if (tag === 'textarea' || tag === 'input') {
    await content.fill(value);
    return;
  }

  // Wait for the editor surface to mount (Monaco initializes async).
  await expect
    .poll(() => content.locator('.view-lines, .cm-editor').count(), { timeout: 15000 })
    .toBeGreaterThan(0);

  await content.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');

  const monacoLines = content.locator('.view-line');
  if ((await monacoLines.count()) > 0) {
    // Monaco (EditContext-based): use model.setValue() directly instead of
    // insertText to avoid auto-indent reformatting multiline content. Map the
    // pane's content element to its Monaco model via the exposed helper.
    if (!value) {
      await page.evaluate((id) => window.__monacoSetValue?.(id, ''), `${testId}-content`);
      await page.waitForTimeout(300);
      return;
    }
    const contentId = `${testId}-content`;
    await expect
      .poll(
        async () =>
          await page.evaluate(
            ([id, v]) => window.__monacoSetValue?.(id, v) ?? false,
            [contentId, value]
          ),
        { timeout: 5000 }
      )
      .toBe(true);
    // Let React state sync after the model change
    await page.waitForTimeout(300);
    return;
  }

  await page.keyboard.press('Backspace');
  if (value) {
    await page.keyboard.type(value);
  }
}

export async function readEditorText(page, testId) {
  const content = editorContent(page, testId);
  await expect(content).toBeVisible();

  const tag = await editableTag(content);
  if (tag === 'textarea' || tag === 'input') {
    return content.inputValue();
  }

  const monacoLines = content.locator('.view-line');
  if ((await monacoLines.count()) > 0) {
    // Read straight from the Monaco model (mapped by content element) so tabs
    // and exact whitespace survive; Monaco renders tabs as spaces in the DOM.
    const modelValue = await page.evaluate(
      (id) => window.__monacoGetValue?.(id) ?? null,
      `${testId}-content`
    );
    if (modelValue != null) return modelValue;
  }

  return content
    .locator('.cm-line')
    .evaluateAll((lines) => lines.map((line) => line.textContent ?? '').join('\n'));
}

export async function expectEditorText(page, testId, expected) {
  if (expected instanceof RegExp) {
    await expect.poll(() => readEditorText(page, testId)).toMatch(expected);
    return;
  }

  await expect.poll(() => readEditorText(page, testId)).toBe(expected);
}

export async function expectEditorContains(page, testId, expected) {
  if (expected instanceof RegExp) {
    await expect.poll(() => readEditorText(page, testId)).toMatch(expected);
    return;
  }

  await expect.poll(() => readEditorText(page, testId)).toContain(expected);
}

export async function expectEditorNotEmpty(page, testId) {
  await expect.poll(async () => (await readEditorText(page, testId)).trim()).not.toBe('');
}
