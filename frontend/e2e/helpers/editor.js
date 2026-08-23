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
    // Monaco (EditContext-based): insertText commits atomically, unlike
    // per-key typing which autocomplete widgets can garble.
    if (!value) {
      await page.keyboard.press('Backspace');
      return;
    }
    await page.keyboard.insertText(value);
    // Let the EditContext composition fully commit before probing; an early
    // evaluate can truncate it to the first character.
    await page.waitForTimeout(1000);
    // EditContext commits long insertions progressively; poll the Monaco model
    // (the source of onChange/React state), not the rendered view.
    await expect
      .poll(() =>
        page.evaluate(
          (v) => (window.__monacoModels?.() ?? []).some((m) => m === v || m.endsWith(`\n${v}`)),
          value
        )
      )
      .toBe(true);
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
    return monacoLines.evaluateAll((lines) =>
      lines.map((line) => (line.textContent ?? '').replace(/\u00a0/g, ' ').trimEnd()).join('\n')
    );
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
