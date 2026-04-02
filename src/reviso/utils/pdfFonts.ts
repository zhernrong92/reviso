import 'regenerator-runtime/runtime';
import type { PDFDocument, PDFFont } from 'pdf-lib';
import { StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { sanitizeForWinAnsi } from './sanitizeText';
import { detectScript } from './detectScript';
import type { ScriptKey } from './detectScript';

type FontKey = 'normal' | 'bold' | 'italic' | 'boldItalic';
type WeightKey = 'regular' | 'bold';

export interface PdfFontSet {
  /** Resolve the correct font for the given text and style. Lazily loads on first use per script. */
  getFont: (text: string, fontKey: FontKey) => Promise<PDFFont>;
  /** Prepare text for PDF rendering — sanitizes to WinAnsi if in StandardFonts fallback mode. */
  prepareText: (text: string) => string;
}

// Font file names per script (shipped in dist/assets/)
const SCRIPT_FONTS: Record<ScriptKey, Record<WeightKey, string>> = {
  latin: { regular: 'NotoSans-Regular.ttf', bold: 'NotoSans-Bold.ttf' },
  cjk: { regular: 'NotoSansSC-Regular.ttf', bold: 'NotoSansSC-Bold.ttf' },
  tamil: { regular: 'NotoSansTamil-Regular.ttf', bold: 'NotoSansTamil-Bold.ttf' },
  khmer: { regular: 'NotoSansKhmer-Regular.ttf', bold: 'NotoSansKhmer-Bold.ttf' },
  thai: { regular: 'NotoSansThai-Regular.ttf', bold: 'NotoSansThai-Bold.ttf' },
};

// CDN fallback URLs per script (fontsource via jsdelivr)
const CDN_BASE: Record<ScriptKey, string> = {
  latin: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans@latest',
  cjk: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest',
  tamil: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-tamil@latest',
  khmer: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-khmer@latest',
  thai: 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-thai@latest',
};

const CDN_PATHS: Record<ScriptKey, Record<WeightKey, string>> = {
  latin: { regular: 'latin-400-normal.ttf', bold: 'latin-700-normal.ttf' },
  cjk: { regular: 'chinese-simplified-400-normal.ttf', bold: 'chinese-simplified-700-normal.ttf' },
  tamil: { regular: 'tamil-400-normal.ttf', bold: 'tamil-700-normal.ttf' },
  khmer: { regular: 'khmer-400-normal.ttf', bold: 'khmer-700-normal.ttf' },
  thai: { regular: 'thai-400-normal.ttf', bold: 'thai-700-normal.ttf' },
};

// Module-level cache for downloaded font bytes (persists across exports)
const fontBytesCache = new Map<string, ArrayBuffer>();

/**
 * Custom base path for font assets. Consumers can set this if their fonts
 * are served from a different location (e.g. a CDN or custom public path).
 */
let customFontBasePath: string | null = null;

/**
 * Override the base path used to resolve bundled font files.
 * Call this before any PDF export if fonts are hosted at a custom location.
 *
 * All Noto Sans font files must be available at this path:
 * - NotoSans-Regular.ttf, NotoSans-Bold.ttf (Latin)
 * - NotoSansSC-Regular.ttf, NotoSansSC-Bold.ttf (CJK)
 * - NotoSansTamil-Regular.ttf, NotoSansTamil-Bold.ttf (Tamil)
 * - NotoSansKhmer-Regular.ttf, NotoSansKhmer-Bold.ttf (Khmer)
 * - NotoSansThai-Regular.ttf, NotoSansThai-Bold.ttf (Thai)
 *
 * @example setFontBasePath('/assets/fonts/')
 * @example setFontBasePath('https://cdn.example.com/fonts/')
 */
export function setFontBasePath(basePath: string): void {
  customFontBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
}

function getFontUrl(script: ScriptKey, weight: WeightKey): string {
  if (customFontBasePath) {
    return `${customFontBasePath}${SCRIPT_FONTS[script][weight]}`;
  }
  return `${CDN_BASE[script]}/${CDN_PATHS[script][weight]}`;
}

async function fetchFontBytes(cacheKey: string, url: string): Promise<ArrayBuffer> {
  const cached = fontBytesCache.get(cacheKey);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${response.status} ${url}`);
  const buffer = await response.arrayBuffer();
  fontBytesCache.set(cacheKey, buffer);
  return buffer;
}

function toWeightKey(fontKey: FontKey): WeightKey {
  return fontKey === 'bold' || fontKey === 'boldItalic' ? 'bold' : 'regular';
}

/**
 * Load fonts for PDF export. Returns a PdfFontSet with a lazy `getFont` resolver
 * that detects the script of each text string and loads the appropriate Noto Sans variant.
 *
 * Font resolution order per script:
 * 1. Custom base path (if set via setFontBasePath)
 * 2. CDN (cdn.jsdelivr.net/fontsource)
 * 3. StandardFonts fallback (WinAnsi only — Latin characters only)
 */
export async function loadPdfFonts(pdfDoc: PDFDocument): Promise<PdfFontSet> {
  // Per-document cache: script+weight → embedded PDFFont
  const embeddedFonts = new Map<string, PDFFont>();
  let fontkitRegistered = false;
  let fallbackMode = false;

  // Pre-build StandardFonts fallback (always available)
  const standardFonts: Record<FontKey, PDFFont | null> = {
    normal: null,
    bold: null,
    italic: null,
    boldItalic: null,
  };

  async function getStandardFont(fontKey: FontKey): Promise<PDFFont> {
    if (!standardFonts[fontKey]) {
      const mapping: Record<FontKey, string> = {
        normal: StandardFonts.Helvetica,
        bold: StandardFonts.HelveticaBold,
        italic: StandardFonts.HelveticaOblique,
        boldItalic: StandardFonts.HelveticaBoldOblique,
      };
      standardFonts[fontKey] = await pdfDoc.embedFont(mapping[fontKey]);
    }
    return standardFonts[fontKey];
  }

  async function getFont(text: string, fontKey: FontKey): Promise<PDFFont> {
    if (fallbackMode) {
      return getStandardFont(fontKey);
    }

    const script = detectScript(text);
    const weight = toWeightKey(fontKey);
    const cacheKey = `${script}-${weight}`;

    const cached = embeddedFonts.get(cacheKey);
    if (cached) return cached;

    try {
      if (!fontkitRegistered) {
        pdfDoc.registerFontkit(fontkit);
        fontkitRegistered = true;
      }

      const url = getFontUrl(script, weight);
      const bytes = await fetchFontBytes(`${script}-${weight}`, url);
      const font = await pdfDoc.embedFont(bytes);
      embeddedFonts.set(cacheKey, font);
      return font;
    } catch {
      // If the specific script font fails, try CJK (covers Latin + CJK)
      if (script !== 'cjk' && script !== 'latin') {
        try {
          const fallbackUrl = getFontUrl('cjk', weight);
          const fallbackBytes = await fetchFontBytes(`cjk-${weight}`, fallbackUrl);
          const fallbackFont = await pdfDoc.embedFont(fallbackBytes);
          embeddedFonts.set(cacheKey, fallbackFont);
          return fallbackFont;
        } catch {
          // Fall through to StandardFonts
        }
      }

      // Final fallback: StandardFonts
      fallbackMode = true;
      return getStandardFont(fontKey);
    }
  }

  function prepareText(text: string): string {
    return fallbackMode ? sanitizeForWinAnsi(text) : text;
  }

  return { getFont, prepareText };
}
