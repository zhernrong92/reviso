import { useEffect, useRef, useState } from 'react';
import type { Page } from '../types/document';
import { detectRegionBackgrounds } from '../utils/detectRegionBackground';

/**
 * Detects background colors for all regions on a page by sampling the source image.
 * Returns a Map<regionId, hexColor>. Recomputes when page or region bounds change.
 */
export function useAutoBackgroundColors(page: Page | undefined): Map<string, string> {
  const [colors, setColors] = useState<Map<string, string>>(new Map());
  const prevKeyRef = useRef<string>('');

  useEffect(() => {
    if (!page) {
      setColors(new Map());
      return;
    }

    // Build a cache key from page id + region bounds (not text, which changes often)
    const boundsKey = page.regions
      .map((r) => `${r.id}:${Math.round(r.x1)},${Math.round(r.y1)},${Math.round(r.x2)},${Math.round(r.y2)}`)
      .join('|');
    const cacheKey = `${page.id}:${boundsKey}`;

    if (cacheKey === prevKeyRef.current) return;
    prevKeyRef.current = cacheKey;

    let cancelled = false;
    detectRegionBackgrounds(page.imageSrc, page.regions)
      .then((result) => {
        if (!cancelled) setColors(result);
      })
      .catch((err: unknown) => {
        console.warn('[reviso] Background color detection failed:', err);
      });

    return () => { cancelled = true; };
  }, [page]);

  return colors;
}
