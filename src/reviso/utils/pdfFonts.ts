import type { PDFDocument, PDFFont } from 'pdf-lib';
import { StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { sanitizeForWinAnsi } from './sanitizeText';

type FontKey = 'normal' | 'bold' | 'italic' | 'boldItalic';

export interface PdfFontSet {
  fonts: Record<FontKey, PDFFont>;
  /** Whether custom Unicode fonts were loaded (false = StandardFonts fallback) */
  isUnicode: boolean;
}

// Noto Sans SC — covers Latin + CJK.
// Fonts are shipped in the package's dist/assets/ directory and resolved
// relative to this module at runtime, OR loaded from CDN as fallback.
const FONT_FILES = {
  regular: 'NotoSansSC-Regular.ttf',
  bold: 'NotoSansSC-Bold.ttf',
};

const CDN_BASE = 'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@latest';
const CDN_URLS = {
  regular: `${CDN_BASE}/chinese-simplified-400-normal.ttf`,
  bold: `${CDN_BASE}/chinese-simplified-700-normal.ttf`,
};

// Module-level cache for downloaded font bytes
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
 * @example setFontBasePath('/assets/fonts/')
 * @example setFontBasePath('https://cdn.example.com/fonts/')
 */
export function setFontBasePath(basePath: string): void {
  customFontBasePath = basePath.endsWith('/') ? basePath : basePath + '/';
}

function getFontUrl(key: 'regular' | 'bold'): string {
  if (customFontBasePath) {
    return `${customFontBasePath}${FONT_FILES[key]}`;
  }
  // Default: try to resolve relative to where this module lives (works when
  // fonts are co-located in dist/assets/), falling through to CDN below.
  return CDN_URLS[key];
}

async function fetchFontBytes(key: string, url: string): Promise<ArrayBuffer> {
  const cached = fontBytesCache.get(key);
  if (cached) return cached;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch font: ${response.status}`);
  const buffer = await response.arrayBuffer();
  fontBytesCache.set(key, buffer);
  return buffer;
}

/**
 * Load fonts for PDF export. Loads Noto Sans SC for full Unicode + CJK support.
 * Falls back to StandardFonts (WinAnsi only) if loading fails.
 *
 * Font resolution order:
 * 1. Custom base path (if set via setFontBasePath)
 * 2. CDN (cdn.jsdelivr.net)
 * 3. StandardFonts fallback (WinAnsi only)
 */
export async function loadPdfFonts(pdfDoc: PDFDocument): Promise<PdfFontSet> {
  try {
    pdfDoc.registerFontkit(fontkit);

    const [regularBytes, boldBytes] = await Promise.all([
      fetchFontBytes('regular', getFontUrl('regular')),
      fetchFontBytes('bold', getFontUrl('bold')),
    ]);

    const regularFont = await pdfDoc.embedFont(regularBytes);
    const boldFont = await pdfDoc.embedFont(boldBytes);

    // CJK fonts don't have italic variants — map italic to regular, boldItalic to bold
    const fonts: Record<FontKey, PDFFont> = {
      normal: regularFont,
      bold: boldFont,
      italic: regularFont,
      boldItalic: boldFont,
    };

    return { fonts, isUnicode: true };
  } catch {
    // Fallback to StandardFonts (WinAnsi only)
    const fonts: Record<FontKey, PDFFont> = {
      normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    };

    return { fonts, isUnicode: false };
  }
}

/**
 * Prepare text for PDF rendering. If using StandardFonts (not Unicode),
 * sanitize to WinAnsi-safe characters.
 */
export function preparePdfText(text: string, isUnicode: boolean): string {
  return isUnicode ? text : sanitizeForWinAnsi(text);
}
