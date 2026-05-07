import type { TextRegion } from '../types/document';

const VERTICAL_ASPECT_THRESHOLD = 1.5;

export type Orientation = 'horizontal' | 'vertical';

/**
 * Padding inside a region for text rendering. Shared by every renderer
 * (SVG preview, canvas exporters, PDF exporter) so on-screen and exported
 * output stay aligned. Width-aware so narrow CJK columns don't lose all
 * their interior to a fixed 4px pad.
 */
export function regionPadding(w: number): number {
  return Math.min(4, w * 0.1);
}

export function shouldRenderVertical(region: TextRegion, w: number, h: number): boolean {
  const orientation = region.textOrientation ?? 'auto';
  if (orientation === 'horizontal') return false;
  if (orientation === 'vertical') return (region.currentText?.length ?? 0) > 0;
  // auto
  if (!region.currentText || region.currentText.length < 2) return false;
  if (w <= 0) return false;
  return h / w >= VERTICAL_ASPECT_THRESHOLD;
}

/**
 * Font size for stacked vertical text: each glyph occupies its own row.
 * Returns the per-glyph cell height (also used as fontSize).
 */
export function computeVerticalFontSize(
  text: string,
  w: number,
  h: number,
  padding: number,
  minSize: number = 6,
): number {
  const charCount = Math.max(1, [...text].length);
  const availW = Math.max(1, w - padding * 2);
  const availH = Math.max(1, h - padding * 2);
  const widthCap = availW;
  const heightCap = availH / charCount;
  return Math.max(minSize, Math.min(widthCap, heightCap) * 0.9);
}

/**
 * Split text into an array of grapheme-ish chunks (code points). Sufficient
 * for stacking CJK / Latin / mixed scripts; combining marks may split awkwardly
 * but that's acceptable for the OCR-restoration use case.
 */
export function splitGlyphs(text: string): string[] {
  return [...text];
}
