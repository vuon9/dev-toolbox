import React, { useState, useEffect, useMemo } from 'react';
import { Pipette, Copy, Check, History, Trash2, Sliders, Zap, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import CopyableHex from '../../components/CopyableHex';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import {
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToCmyk,
  cmykToRgb,
  rgbToHsb,
  hsbToRgb,
  validateHex,
} from '../../services/colorService';
import { getShades, getTints, getTones } from '../../services/colorHarmonyService';

const PALETTE_TYPES = ['shades', 'tints', 'tones'];
const PALETTE_LABELS = { shades: 'Shades', tints: 'Tints', tones: 'Tones' };
const CODE_FORMATS = ['css', 'tailwind', 'swift', 'android', 'react', 'json', 'raw'];

// Color Swatch Component
const ColorSwatch = ({ color, onClick, size = 40, showHex = true }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      cursor: onClick ? 'pointer' : 'default',
    }}
  >
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '6px',
        border: '1px solid var(--border)',
      }}
    />
    {showHex && <CopyableHex hex={color} showColorPreview={false} style={{ fontSize: '11px' }} />}
  </div>
);

export default function ColorConverter() {
  const [currentColor, setCurrentColor] = useState('#3B82F6');
  const [recentColors, setRecentColors] = useLocalStorage('color-recent', []);
  const [activePalette, setActivePalette] = useLocalStorage('color-active-palette', 'tints');
  const [activeCodeFormat, setActiveCodeFormat] = useLocalStorage(
    'color-active-code-format',
    'css'
  );
  const [copiedFormat, setCopiedFormat] = useState(null);
  const [copiedPaletteColor, setCopiedPaletteColor] = useState(null);
  const [hexInput, setHexInput] = useState('#3B82F6');
  const [rgbInput, setRgbInput] = useState({ r: 59, g: 130, b: 246 });
  const [hslInput, setHslInput] = useState({ h: 217, s: 91, l: 60 });
  const [cmykInput, setCmykInput] = useState({ c: 76, m: 47, y: 0, k: 4 });
  const [hsbInput, setHsbInput] = useState({ h: 217, s: 76, b: 96 });

  // Sync inputs when currentColor changes
  useEffect(() => {
    if (validateHex(currentColor)) {
      setHexInput(currentColor);
      const rgb = hexToRgb(currentColor);
      if (rgb) {
        setRgbInput(rgb);
        setHslInput(rgbToHsl(rgb.r, rgb.g, rgb.b));
        setCmykInput(rgbToCmyk(rgb.r, rgb.g, rgb.b));
        setHsbInput(rgbToHsb(rgb.r, rgb.g, rgb.b));
      }
    }
  }, [currentColor]);

  // Update recent colors when color changes
  useEffect(() => {
    if (validateHex(currentColor)) {
      setRecentColors((prev) => {
        const filtered = prev.filter((c) => c.toLowerCase() !== currentColor.toLowerCase());
        return [currentColor, ...filtered].slice(0, 12);
      });
    }
  }, [currentColor]);

  // Helper: Handle hex change
  const handleHexChange = (value) => {
    setHexInput(value);
    if (validateHex(value)) {
      const normalized = value.startsWith('#') ? value : `#${value}`;
      setCurrentColor(normalized.toLowerCase());
    }
  };

  // Helper: Handle RGB change
  const handleRgbChange = (newRgb) => {
    setRgbInput(newRgb);
    const { r, g, b } = newRgb;
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      const hex = rgbToHex(r, g, b);
      setCurrentColor(hex);
    }
  };

  // Helper: Handle HSL change
  const handleHslChange = (newHsl) => {
    setHslInput(newHsl);
    const { h, s, l } = newHsl;
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && l >= 0 && l <= 100) {
      const rgb = hslToRgb(h, s, l);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setCurrentColor(hex);
    }
  };

  // Helper: Handle CMYK change
  const handleCmykChange = (newCmyk) => {
    setCmykInput(newCmyk);
    const { c, m, y, k } = newCmyk;
    if (c >= 0 && c <= 100 && m >= 0 && m <= 100 && y >= 0 && y <= 100 && k >= 0 && k <= 100) {
      const rgb = cmykToRgb(c, m, y, k);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setCurrentColor(hex);
    }
  };

  // Helper: Handle HSB change
  const handleHsbChange = (newHsb) => {
    setHsbInput(newHsb);
    const { h, s, b } = newHsb;
    if (h >= 0 && h <= 360 && s >= 0 && s <= 100 && b >= 0 && b <= 100) {
      const rgb = hsbToRgb(h, s, b);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      setCurrentColor(hex);
    }
  };

  // Helper: Eyedropper
  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result.sRGBHex) {
          setCurrentColor(result.sRGBHex.toLowerCase());
        }
      } catch (e) {
        // User cancelled
      }
    }
  };

  // Helper: Clear recent
  const clearRecent = () => {
    setRecentColors([]);
  };

  // Helper: Remove from recent
  const removeFromRecent = (color) => {
    setRecentColors((prev) => prev.filter((c) => c.toLowerCase() !== color.toLowerCase()));
  };

  // Helper: Copy to clipboard
  const copyToClipboard = async (text, format) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedFormat(format);
      setTimeout(() => setCopiedFormat(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Helper: Copy palette color
  const copyPaletteColor = async (color) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedPaletteColor(color);
      setTimeout(() => setCopiedPaletteColor(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Generate random color
  const generateRandomColor = () => {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    const hex = rgbToHex(r, g, b);
    setCurrentColor(hex);
  };

  // Get palette colors
  const paletteColors = useMemo(() => {
    if (!validateHex(currentColor)) return [];
    switch (activePalette) {
      case 'shades':
        return getShades(currentColor, 5);
      case 'tints':
        return getTints(currentColor, 5);
      case 'tones':
        return getTones(currentColor, 5);
      default:
        return [];
    }
  }, [currentColor, activePalette]);

  // Get palette percentages
  const palettePercentages = useMemo(() => {
    return ['10%', '30%', '50%', '70%', '90%'];
  }, []);

  // Generate code output
  const generateCodeOutput = useMemo(() => {
    const rgb = hexToRgb(currentColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const cmyk = rgbToCmyk(rgb.r, rgb.g, rgb.b);
    const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);

    switch (activeCodeFormat) {
      case 'css':
        return `/* CSS Color Values */
:root {
  --color-primary: ${currentColor};
  --color-rgb: rgb(${rgb.r}, ${rgb.g}, ${rgb.b});
  --color-hsl: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%);
}`;
      case 'tailwind':
        return `// tailwind.config.js
colors: {
  primary: '${currentColor}',
  primaryRgb: '${rgb.r} ${rgb.g} ${rgb.b}',
  primaryHsl: '${hsl.h} ${hsl.s}% ${hsl.l}%',
}`;
      case 'swift':
        return `// Swift UIColor
let color = UIColor(
  red: ${(rgb.r / 255).toFixed(3)},
  green: ${(rgb.g / 255).toFixed(3)},
  blue: ${(rgb.b / 255).toFixed(3)},
  alpha: 1.0
)
// Hex: ${currentColor}`;
      case 'android':
        return `<!-- Android Colors -->
<color name="primary">${currentColor}</color>
<!-- ARGB -->
<integer name="primary_argb">0xFF${currentColor.replace('#', '').toUpperCase()}</int>`;
      case 'react':
        return `// React Native StyleSheet
const styles = StyleSheet.create({
  container: {
    backgroundColor: '${currentColor}',
    // or
    backgroundColor: 'rgb(${rgb.r}, ${rgb.g}, ${rgb.b})',
    // or
    backgroundColor: 'hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)',
  },
});`;
      case 'json':
        return JSON.stringify(
          {
            hex: currentColor,
            rgb,
            hsl,
            cmyk,
            hsb,
          },
          null,
          2
        );
      case 'raw':
        return `HEX: ${currentColor}
RGB: ${rgb.r}, ${rgb.g}, ${rgb.b}
HSL: ${hsl.h}, ${hsl.s}%, ${hsl.l}%
CMYK: ${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%
HSB: ${hsb.h}, ${hsb.s}%, ${hsb.b}%`;
      default:
        return '';
    }
  }, [currentColor, activeCodeFormat]);

  // Number input style - compact
  const numberInputStyle = {
    width: '56px',
    height: '28px',
    padding: '0 6px',
    fontSize: '12px',
    backgroundColor: 'var(--background)',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    color: 'var(--foreground)',
    textAlign: 'center',
    outline: 'none',
    fontFamily: 'monospace',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* Sticky Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'var(--background)',
          padding: '24px 24px 2px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 600,
              letterSpacing: '-0.025em',
              color: 'var(--foreground)',
            }}
          >
            Color Converter
          </h2>
          <p style={{ color: 'var(--muted-foreground)', marginTop: '2px', marginBottom: 0 }}>
            Convert between Hex, RGB, HSL, CMYK, and HSB. Generate palettes and export code.
          </p>
        </div>
        <div
          style={{
            marginTop: '16px',
            marginLeft: '4px',
            marginRight: '4px',
            borderTop: '1px solid var(--border)',
          }}
        />
      </div>

      {/* Scrollable Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 24px 24px' }}>
        {/* Color Picker Bar with Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '16px',
            marginBottom: '24px',
          }}
        >
          <input
            type="color"
            value={currentColor}
            onChange={(e) => setCurrentColor(e.target.value)}
            style={{
              width: '44px',
              height: '36px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              background: 'none',
            }}
          />
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'var(--card)',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onClick={() => copyToClipboard(currentColor.toUpperCase(), 'header')}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--border)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--card)')}
          >
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '16px',
                fontWeight: 600,
                color: 'var(--foreground)',
              }}
            >
              {currentColor.toUpperCase()}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontSize: '12px',
                color: copiedFormat === 'header' ? 'var(--success)' : 'var(--muted-foreground)',
              }}
            >
              {copiedFormat === 'header' ? 'Copied!' : 'Click to copy'}
            </span>
          </div>
          <Button onClick={handleEyedropper} variant="secondary">
            <Pipette style={{ width: '14px', height: '14px' }} />
            Pick
          </Button>
          <Button onClick={generateRandomColor} variant="secondary">
            <Sparkles style={{ width: '14px', height: '14px' }} />
            Random
          </Button>
        </div>
        {/* Main Grid: Two Columns with Stacked Sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Left Column - Stacked: Color Formats (top) | Recent Colors (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Color Formats - Top */}
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '16px',
                }}
              >
                Color Formats
              </span>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '8px',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--muted-foreground)',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                          width: '50px',
                        }}
                      >
                        Format
                      </th>
                      <th
                        style={{
                          textAlign: 'left',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--muted-foreground)',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        Value
                      </th>
                      <th
                        style={{
                          textAlign: 'center',
                          padding: '6px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--muted-foreground)',
                          textTransform: 'uppercase',
                          borderBottom: '1px solid var(--border)',
                          width: '40px',
                        }}
                      >
                        Copy
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* HEX Row */}
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          HEX
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <input
                          type="text"
                          value={hexInput}
                          onChange={(e) => handleHexChange(e.target.value)}
                          style={{
                            width: '100%',
                            height: '28px',
                            padding: '0 8px',
                            fontSize: '12px',
                            backgroundColor: 'var(--background)',
                            border: '1px solid var(--border)',
                            borderRadius: '4px',
                            color: 'var(--foreground)',
                            fontFamily: 'monospace',
                            outline: 'none',
                          }}
                        />
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() => copyToClipboard(hexInput, 'hex')}
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color:
                              copiedFormat === 'hex' ? 'var(--success)' : 'var(--muted-foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedFormat === 'hex' ? (
                            <Check style={{ width: '14px', height: '14px' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* RGB Row */}
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          RGB
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={rgbInput.r}
                            onChange={(e) =>
                              handleRgbChange({ ...rgbInput, r: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={rgbInput.g}
                            onChange={(e) =>
                              handleRgbChange({ ...rgbInput, g: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="255"
                            value={rgbInput.b}
                            onChange={(e) =>
                              handleRgbChange({ ...rgbInput, b: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `rgb(${rgbInput.r}, ${rgbInput.g}, ${rgbInput.b})`,
                              'rgb'
                            )
                          }
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color:
                              copiedFormat === 'rgb' ? 'var(--success)' : 'var(--muted-foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedFormat === 'rgb' ? (
                            <Check style={{ width: '14px', height: '14px' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* HSL Row */}
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          HSL
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={hslInput.h}
                            onChange={(e) =>
                              handleHslChange({ ...hslInput, h: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={hslInput.s}
                            onChange={(e) =>
                              handleHslChange({ ...hslInput, s: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={hslInput.l}
                            onChange={(e) =>
                              handleHslChange({ ...hslInput, l: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `hsl(${hslInput.h}, ${hslInput.s}%, ${hslInput.l}%)`,
                              'hsl'
                            )
                          }
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color:
                              copiedFormat === 'hsl' ? 'var(--success)' : 'var(--muted-foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedFormat === 'hsl' ? (
                            <Check style={{ width: '14px', height: '14px' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* CMYK Row */}
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          CMYK
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cmykInput.c}
                            onChange={(e) =>
                              handleCmykChange({ ...cmykInput, c: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cmykInput.m}
                            onChange={(e) =>
                              handleCmykChange({ ...cmykInput, m: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cmykInput.y}
                            onChange={(e) =>
                              handleCmykChange({ ...cmykInput, y: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={cmykInput.k}
                            onChange={(e) =>
                              handleCmykChange({ ...cmykInput, k: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `cmyk(${cmykInput.c}%, ${cmykInput.m}%, ${cmykInput.y}%, ${cmykInput.k}%)`,
                              'cmyk'
                            )
                          }
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color:
                              copiedFormat === 'cmyk'
                                ? 'var(--success)'
                                : 'var(--muted-foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedFormat === 'cmyk' ? (
                            <Check style={{ width: '14px', height: '14px' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* HSB Row */}
                    <tr>
                      <td style={{ padding: '8px' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'var(--muted-foreground)',
                          }}
                        >
                          HSB
                        </span>
                      </td>
                      <td style={{ padding: '8px' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input
                            type="number"
                            min="0"
                            max="360"
                            value={hsbInput.h}
                            onChange={(e) =>
                              handleHsbChange({ ...hsbInput, h: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={hsbInput.s}
                            onChange={(e) =>
                              handleHsbChange({ ...hsbInput, s: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={hsbInput.b}
                            onChange={(e) =>
                              handleHsbChange({ ...hsbInput, b: parseInt(e.target.value) || 0 })
                            }
                            style={numberInputStyle}
                          />
                        </div>
                      </td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `hsb(${hsbInput.h}, ${hsbInput.s}%, ${hsbInput.b}%)`,
                              'hsb'
                            )
                          }
                          style={{
                            padding: '4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color:
                              copiedFormat === 'hsb' ? 'var(--success)' : 'var(--muted-foreground)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {copiedFormat === 'hsb' ? (
                            <Check style={{ width: '14px', height: '14px' }} />
                          ) : (
                            <Copy style={{ width: '14px', height: '14px' }} />
                          )}
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Colors - Bottom */}
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: 'var(--muted-foreground)',
                    textTransform: 'uppercase',
                  }}
                >
                  Recent Colors ({recentColors.length})
                </span>
                {recentColors.length > 0 && (
                  <Button onClick={clearRecent} variant="danger">
                    <Trash2 style={{ width: '14px', height: '14px' }} />
                    Clear
                  </Button>
                )}
              </div>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  minHeight: '120px',
                }}
              >
                {recentColors.length === 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '88px',
                      color: 'var(--muted-foreground)',
                      fontSize: '13px',
                    }}
                  >
                    No recent colors
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {recentColors.map((color, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <ColorSwatch
                          color={color}
                          onClick={() => setCurrentColor(color)}
                          size={60}
                        />
                        <button
                          onClick={() => removeFromRecent(color)}
                          style={{
                            position: 'absolute',
                            top: '-4px',
                            right: '-4px',
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--border)',
                            border: '1px solid var(--border)',
                            color: 'var(--muted-foreground)',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: 0,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = 1;
                          }}
                        >
                          ×
                        </button>
                        <style>{`
                        div:hover button { opacity: 1 !important; }
                      `}</style>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Stacked: Code Export (top) | Palette Variations (bottom) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Code Export - Top */}
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '16px',
                }}
              >
                Code Export
              </span>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                {/* Tabs */}
                <div
                  style={{ display: 'flex', gap: '4px', marginBottom: '16px', flexWrap: 'wrap' }}
                >
                  {CODE_FORMATS.map((format) => (
                    <Button
                      key={format}
                      active={activeCodeFormat === format}
                      onClick={() => setActiveCodeFormat(format)}
                    >
                      {format.charAt(0).toUpperCase() + format.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Code Block */}
                <div style={{ position: 'relative' }}>
                  <pre
                    style={{
                      backgroundColor: 'var(--background)',
                      border: '1px solid var(--border)',
                      borderRadius: '6px',
                      padding: '16px',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      color: 'var(--muted-foreground)',
                      overflow: 'auto',
                      maxHeight: '200px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    <code style={{ color: 'var(--foreground)' }}>{generateCodeOutput}</code>
                  </pre>
                  <button
                    onClick={() => copyToClipboard(generateCodeOutput, 'code')}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      padding: '6px',
                      backgroundColor: 'var(--border)',
                      border: '1px solid var(--border)',
                      borderRadius: '4px',
                      color: copiedFormat === 'code' ? 'var(--success)' : 'var(--muted-foreground)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {copiedFormat === 'code' ? (
                      <Check style={{ width: '14px', height: '14px' }} />
                    ) : (
                      <Copy style={{ width: '14px', height: '14px' }} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Palette Variations - Bottom */}
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--muted-foreground)',
                  textTransform: 'uppercase',
                  display: 'block',
                  marginBottom: '16px',
                }}
              >
                Palette Variations
              </span>
              <div
                style={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                }}
              >
                {/* Tabs */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {PALETTE_TYPES.map((type) => (
                    <Button
                      key={type}
                      active={activePalette === type}
                      onClick={() => setActivePalette(type)}
                    >
                      {PALETTE_LABELS[type]}
                    </Button>
                  ))}
                </div>

                {/* Palette List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {paletteColors.map((color, i) => (
                    <div
                      key={i}
                      onClick={() => setCurrentColor(color)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--background)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--border)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--background)';
                      }}
                    >
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '4px',
                          backgroundColor: color,
                          border: '1px solid var(--border)',
                        }}
                      />
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '13px',
                          color: 'var(--foreground)',
                          flex: 1,
                        }}
                      >
                        {color.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        {palettePercentages[i]}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyPaletteColor(color);
                        }}
                        style={{
                          padding: '4px',
                          backgroundColor: 'transparent',
                          border: 'none',
                          color:
                            copiedPaletteColor === color
                              ? 'var(--success)'
                              : 'var(--muted-foreground)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {copiedPaletteColor === color ? (
                          <Check style={{ width: '14px', height: '14px' }} />
                        ) : (
                          <Copy style={{ width: '14px', height: '14px' }} />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
