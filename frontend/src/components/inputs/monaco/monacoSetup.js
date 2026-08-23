let monacoPromise = null;

export function getMonaco() {
  if (!monacoPromise) {
    monacoPromise = Promise.all([
      import('monaco-editor/editor/editor.api.js'),
      import('monaco-editor/editor/editor.worker.js?worker'),
      import('monaco-editor/language/json/json.worker.js?worker'),
      import('monaco-editor/language/css/css.worker.js?worker'),
      import('monaco-editor/language/html/html.worker.js?worker'),
    ]).then(([monaco, editorWorker, jsonWorker, cssWorker, htmlWorker]) => {
      globalThis.MonacoEnvironment = {
        getWorker(_workerId, label) {
          if (label === 'json') return new jsonWorker.default();
          if (label === 'css' || label === 'scss' || label === 'less')
            return new cssWorker.default();
          if (label === 'html' || label === 'handlebars' || label === 'razor')
            return new htmlWorker.default();
          return new editorWorker.default();
        },
      };
      // Expose a minimal, read-only snapshot for tests/e2e without leaking
      // the full editor API to page scripts.
      if (typeof globalThis !== 'undefined') {
        globalThis.__monacoModels = () => monaco.editor.getModels().map((m) => m.getValue());
      }
      return monaco;
    });
  }
  return monacoPromise;
}

const MONACO_TOKEN_BY_SCOPE = {
  keyword: 'keyword',
  string: 'string',
  number: 'number',
  comment: 'comment',
  type: 'type',
  function: 'identifier',
  variable: 'identifier',
  operator: 'operator',
  punctuation: 'delimiter',
  tag: 'tag',
  attribute: 'attribute.name',
  property: 'attribute.name',
  constant: 'constant',
  bool: 'constant.language',
  null: 'constant.language',
  class: 'type.identifier',
};

let colorCtx = null;
function getColorCtx() {
  if (colorCtx !== null) return colorCtx;
  try {
    colorCtx = document.createElement('canvas').getContext('2d');
  } catch {
    colorCtx = false;
  }
  return colorCtx;
}

export function normalizeColor(value) {
  if (!value || typeof value !== 'string') return null;
  let c = value.trim();
  const varMatch = c.match(/^var\(\s*(--[^)]+?)\s*\)$/);
  if (varMatch) {
    try {
      c = getComputedStyle(document.documentElement).getPropertyValue(varMatch[1]).trim();
    } catch {
      return null;
    }
    if (!c || c.startsWith('var(')) return null;
  }
  if (/^#[0-9a-f]{3,8}$/i.test(c)) {
    const hex = c.slice(1);
    // Valid CSS hex lengths only: #RGB(3) #RGBA(4) #RRGGBB(6) #RRGGBBAA(8)
    if (hex.length === 3 || hex.length === 4) {
      return '#' + [...hex].map((ch) => ch + ch).join('');
    }
    if (hex.length === 6 || hex.length === 8) {
      return '#' + hex;
    }
    return null;
  }
  const ctx = getColorCtx();
  if (!ctx) return null;
  try {
    ctx.fillStyle = '#000000';
    ctx.fillStyle = c;
  } catch {
    return null;
  }
  const computed = ctx.fillStyle;
  if (computed.startsWith('#')) return normalizeColor(computed);
  const m = computed.match(/^rgba?\(([^)]+)\)$/i);
  if (!m) return null;
  const parts = m[1]
    .split(/[,\s/]+/)
    .filter(Boolean)
    .map(Number);
  if (parts.length < 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [r, g, b] = parts;
  const hex =
    '#' +
    [r, g, b].map((n) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('');
  if (parts.length > 3 && parts[3] < 1) {
    return (
      hex +
      Math.round(parts[3] * 255)
        .toString(16)
        .padStart(2, '0')
    );
  }
  return hex;
}

export function applyDevtoolboxTheme(monaco, { actualType, colors, tokenColors }) {
  const rules = (tokenColors || [])
    .map(({ scope, color }) => {
      const fg = normalizeColor(color);
      return fg ? { token: MONACO_TOKEN_BY_SCOPE[scope] || scope, foreground: fg.slice(1) } : null;
    })
    .filter(Boolean);

  const pick = (...candidates) => {
    for (const c of candidates) {
      const normalized = normalizeColor(c);
      if (normalized) return normalized;
    }
    return actualType === 'dark' ? '#1f2428' : '#ffffff';
  };

  try {
    monaco.editor.defineTheme('devtoolbox', {
      base: actualType === 'dark' ? 'vs-dark' : 'vs',
      inherit: true,
      rules,
      colors: {
        'editor.background': pick(colors?.background),
        'editor.foreground': pick(colors?.foreground),
        'editorLineNumber.foreground': pick(colors?.['muted-foreground']),
        'editorLineNumber.activeForeground': pick(colors?.foreground),
        'editor.selectionBackground': pick(colors?.accent),
        'editor.inactiveSelectionBackground': pick(colors?.accent),
        'editor.lineHighlightBackground': pick(colors?.muted),
        'editorCursor.foreground': pick(colors?.foreground),
        'editorWidget.background': pick(colors?.popover),
        'editorGutter.background': pick(colors?.card),
      },
    });
    monaco.editor.setTheme('devtoolbox');
  } catch {
    // theme registration must never break the editor tree
  }
}
