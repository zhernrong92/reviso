import { useRef, useEffect, useState, useCallback } from 'react';
import type { Page } from '../types/document';
import { shouldRenderVertical, computeVerticalFontSize, regionPadding, type Orientation } from '../utils/textLayout';

export interface FittedFont {
  fontSize: number;
  orientation: Orientation;
}

/**
 * Measure text width using an offscreen canvas and shrink font if needed.
 * Returns a map of regionId → fitted font size + orientation.
 *
 * Tall-narrow regions (h/w >= 1.5) with multi-char text fall back to
 * vertical stacking — one glyph per row — so multi-line CJK / vertical
 * sign text doesn't get squashed to 6px.
 */
export function useFittedFontSizes(page: Page): Record<string, FittedFont> {
  const [sizes, setSizes] = useState<Record<string, FittedFont>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const measure = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const result: Record<string, FittedFont> = {};
    for (const region of page.regions) {
      if (!region.currentText) continue;
      const w = region.x2 - region.x1;
      const h = region.y2 - region.y1;
      const padding = regionPadding(w);

      if (shouldRenderVertical(region, w, h)) {
        result[region.id] = {
          fontSize: computeVerticalFontSize(region.currentText, w, h, padding),
          orientation: 'vertical',
        };
        continue;
      }

      const maxFs = Math.max(6, h * 0.65);
      const fontStyle = region.fontStyle === 'italic' ? 'italic ' : '';
      const fontWeight = region.fontWeight === 'bold' ? 'bold ' : '';
      const fontFamily = region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif';
      ctx.font = `${fontStyle}${fontWeight}${maxFs}px ${fontFamily}`;
      const textWidth = ctx.measureText(region.currentText).width;
      const available = Math.max(1, w - padding * 2);
      result[region.id] = {
        fontSize: textWidth > available
          ? Math.max(6, maxFs * (available / textWidth))
          : maxFs,
        orientation: 'horizontal',
      };
    }
    setSizes(result);
  }, [page]);

  useEffect(() => { measure(); }, [measure]);

  return sizes;
}
