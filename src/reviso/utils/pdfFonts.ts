import 'regenerator-runtime/runtime';
import type { PDFDocument, PDFFont } from 'pdf-lib';
import { StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { sanitizeForWinAnsi } from './sanitizeText';
import { detectScript } from './detectScript';
import type { ScriptKey } from './detectScript';

type FontKey = 'normal' | 'bold' | 'italic' | 'boldItalic';
type WeightKey = 'regular' | 'bold';

export interface ResolvedFont {
  font: PDFFont;
  /** Text prepared for this font — sanitized to WinAnsi if using StandardFonts fallback. */
  text: string;
}

export interface PdfFontSet {
  /** Resolve the correct font for the given text and style. Lazily loads on first use per script. */
  resolveFont: (text: string, fontKey: FontKey) => Promise<ResolvedFont>;
}

// Font file names per script (shipped in dist/assets/)
// Korean requires NotoSansKR (NotoSansSC does not contain Hangul).
// Drop NotoSansKR-Regular.ttf / NotoSansKR-Bold.ttf into the same fonts
// directory to enable Korean PDF export. Without them, Hangul falls
// back to StandardFonts (Helvetica) which strips it via WinAnsi.
const SCRIPT_FONTS: Partial<Record<ScriptKey, Record<WeightKey, string>>> = {
  latin: { regular: 'NotoSans-Regular.ttf', bold: 'NotoSans-Bold.ttf' },
  cjk: { regular: 'NotoSansSC-Regular.ttf', bold: 'NotoSansSC-Bold.ttf' },
  korean: { regular: 'NotoSansKR-Regular.ttf', bold: 'NotoSansKR-Bold.ttf' },
  tamil: { regular: 'NotoSansTamil-Regular.ttf', bold: 'NotoSansTamil-Bold.ttf' },
  khmer: { regular: 'NotoSansKhmer-Regular.ttf', bold: 'NotoSansKhmer-Bold.ttf' },
  thai: { regular: 'NotoSansThai-Regular.ttf', bold: 'NotoSansThai-Bold.ttf' },
};

// Module-level cache for downloaded font bytes (persists across exports)
const fontBytesCache = new Map<string, ArrayBuffer>();

/**
 * Custom base path for font assets. Consumers can set this if their fonts
 * are served from a different location (e.g. a CDN or custom public path).
 */
let customFontBasePath: string | null = null;

// Default local path where bundled fonts are typically served from
const DEFAULT_LOCAL_PATH = '/assets/';

/**
 * Override the base path used to resolve bundled font files.
 * Call this before any PDF export if fonts are hosted at a custom location.
 *
 * By default, fonts are loaded from `/assets/`. Consumers must copy the font
 * files from `node_modules/react-reviso/dist/assets/` to their public directory.
 *
 * Call this function to point to a different location.
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

function getFontUrl(script: ScriptKey, weight: WeightKey): string | null {
  const fonts = SCRIPT_FONTS[script];
  if (!fonts) return null;
  const basePath = customFontBasePath ?? DEFAULT_LOCAL_PATH;
  return `${basePath}${fonts[weight]}`;
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
 * 1. Local path (custom via setFontBasePath, or default /assets/)
 * 2. StandardFonts fallback (WinAnsi only — Latin characters only)
 */
export async function loadPdfFonts(pdfDoc: PDFDocument): Promise<PdfFontSet> {
  // Per-document cache: script+weight → embedded PDFFont
  const embeddedFonts = new Map<string, PDFFont>();
  // Track scripts that failed all font sources → use StandardFonts for those only
  const failedScripts = new Set<string>();
  let fontkitRegistered = false;

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

  async function resolveFont(text: string, fontKey: FontKey): Promise<ResolvedFont> {
    const script = detectScript(text);
    const weight = toWeightKey(fontKey);
    const cacheKey = `${script}-${weight}`;

    // Check if this script already failed → StandardFonts
    if (failedScripts.has(script)) {
      return { font: await getStandardFont(fontKey), text: sanitizeForWinAnsi(text) };
    }

    const cached = embeddedFonts.get(cacheKey);
    if (cached) return { font: cached, text };

    try {
      if (!fontkitRegistered) {
        pdfDoc.registerFontkit(fontkit);
        fontkitRegistered = true;
      }

      const url = getFontUrl(script, weight);
      if (!url) throw new Error(`No font available for script: ${script}`);
      const bytes = await fetchFontBytes(`${script}-${weight}`, url);
      const font = await pdfDoc.embedFont(bytes);
      embeddedFonts.set(cacheKey, font);
      return { font, text };
    } catch (err) {
      console.warn(`[react-reviso] Failed to load ${script} font:`, err);

      // If the specific script font fails, try CJK (covers Latin + CJK)
      if (script !== 'cjk' && script !== 'latin') {
        try {
          const fallbackUrl = getFontUrl('cjk', weight);
          if (!fallbackUrl) throw new Error('No CJK font available');
          const fallbackBytes = await fetchFontBytes(`cjk-${weight}`, fallbackUrl);
          const fallbackFont = await pdfDoc.embedFont(fallbackBytes);
          embeddedFonts.set(cacheKey, fallbackFont);
          return { font: fallbackFont, text };
        } catch {
          // Fall through to StandardFonts
        }
      }

      // Final fallback for this script only — sanitize text for WinAnsi encoding
      console.warn(`[react-reviso] Falling back to StandardFonts for script: ${script}`);
      failedScripts.add(script);
      return { font: await getStandardFont(fontKey), text: sanitizeForWinAnsi(text) };
    }
  }

  return { resolveFont };
}
