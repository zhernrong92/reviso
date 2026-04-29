import { useRef, useEffect, useState, useCallback } from 'react';
import type { Page } from '../types/document';

/**
 * Measure text width using an offscreen canvas and shrink font if needed.
 * Returns a map of regionId → fitted font size.
 */
export function useFittedFontSizes(page: Page): Record<string, number> {
  const [sizes, setSizes] = useState<Record<string, number>>({});
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const measure = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const result: Record<string, number> = {};
    for (const region of page.regions) {
      if (!region.currentText) continue;
      const w = region.x2 - region.x1;
      const h = region.y2 - region.y1;
      const maxFs = Math.max(6, h * 0.65);
      const padding = Math.min(4, w * 0.1);
      const fontStyle = region.fontStyle === 'italic' ? 'italic ' : '';
      const fontWeight = region.fontWeight === 'bold' ? 'bold ' : '';
      const fontFamily = region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif';
      ctx.font = `${fontStyle}${fontWeight}${maxFs}px ${fontFamily}`;
      const textWidth = ctx.measureText(region.currentText).width;
      const available = Math.max(1, w - padding * 2);
      result[region.id] = textWidth > available
        ? Math.max(6, maxFs * (available / textWidth))
        : maxFs;
    }
    setSizes(result);
  }, [page]);

  useEffect(() => { measure(); }, [measure]);

  return sizes;
}
