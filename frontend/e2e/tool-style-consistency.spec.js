import { test, expect } from '@playwright/test';

const TOOLS = [
  'code-encoder',
  'code-encrypter',
  'hash-generator',
  'code-converter',
  'text-utilities',
  'number-converter',
  'datetime-converter',
  'jwt',
  'barcode',
  'data-generator',
  'code-formatter',
  'color-converter',
  'url-inspector',
  'cron',
  'regexp',
  'diff',
];

const THEMES = [
  { mode: 'light', name: 'github-light' },
  { mode: 'dark', name: 'github-dark' },
];

async function setTheme(page, theme) {
  await page.evaluate(({ mode, name }) => {
    localStorage.setItem('dt-mode', mode);
    localStorage.setItem('dt-name', name);
  }, theme);
}

test.describe('Tool visual style consistency', () => {
  for (const theme of THEMES) {
    for (const slug of TOOLS) {
      test(`${slug} keeps tool text and borders consistent in ${theme.mode}`, async ({ page }) => {
        await page.goto(`/tool/${slug}`);
        await setTheme(page, theme);
        await page.goto(`/tool/${slug}`);
        await page.waitForLoadState('networkidle');

        const issues = await page.evaluate(() => {
          const isVisible = (element, style) => {
            const rect = element.getBoundingClientRect();
            return (
              rect.width > 0 &&
              rect.height > 0 &&
              style.visibility !== 'hidden' &&
              style.display !== 'none' &&
              style.opacity !== '0'
            );
          };

          const selector = 'main, [data-testid="tool-page"], [role="main"]';
          const root = document.querySelector(selector) ?? document.body;

          return Array.from(root.querySelectorAll('*')).flatMap((element) => {
            const style = getComputedStyle(element);
            if (!isVisible(element, style)) return [];

            const rect = element.getBoundingClientRect();
            const text = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
            const tag = element.tagName.toLowerCase();
            const classes = element.className?.toString?.() ?? '';
            const elementIssues = [];

            const fontSize = parseFloat(style.fontSize);
            const hasOwnText =
              text.length > 0 &&
              Array.from(element.children).every((child) => child.textContent?.trim() !== text);

            if (hasOwnText && fontSize > 0 && fontSize < 11) {
              elementIssues.push({
                kind: 'font-size',
                tag,
                classes,
                text: text.slice(0, 80),
                value: style.fontSize,
              });
            }

            const borderWidths = [
              style.borderTopWidth,
              style.borderRightWidth,
              style.borderBottomWidth,
              style.borderLeftWidth,
            ].map(parseFloat);

            if (rect.width > 8 && rect.height > 8 && borderWidths.some((width) => width > 2)) {
              elementIssues.push({
                kind: 'border-width',
                tag,
                classes,
                text: text.slice(0, 80),
                value: borderWidths.join('/'),
              });
            }

            return elementIssues;
          });
        });

        expect(issues).toEqual([]);
      });
    }
  }
});
