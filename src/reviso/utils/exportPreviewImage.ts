import type { Page } from '../types/document';
import { detectRegionBackgrounds } from './detectRegionBackground';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load page image'));
    if (src.startsWith('data:') || src.startsWith('blob:')) {
      img.src = src;
    } else {
      fetch(src)
        .then((res) => {
          if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
          return res.blob();
        })
        .then((blob) => { img.src = URL.createObjectURL(blob); })
        .catch(reject);
    }
  });
}

/**
 * Render a page in "preview" style: opaque region backgrounds covering original text,
 * annotated text rendered inside each region.
 */
export async function renderPreviewPage(
  page: Page,
  autoBackgroundColors?: Map<string, string>,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw the base image
  const img = await loadImage(page.imageSrc);
  ctx.drawImage(img, 0, 0, page.width, page.height);

  // Auto-detect background colors if not provided
  const bgColors = autoBackgroundColors ?? await detectRegionBackgrounds(page.imageSrc, page.regions);

  // Draw each region in preview style
  for (const region of page.regions) {
    const w = region.x2 - region.x1;
    const h = region.y2 - region.y1;

    // Opaque background fill
    const bgColor = (region.backgroundColor && region.backgroundColor !== 'transparent')
      ? region.backgroundColor
      : (bgColors.get(region.id) ?? 'red');

    ctx.fillStyle = bgColor;
    ctx.fillRect(region.x1, region.y1, w, h);

    // Text always inside
    if (region.currentText) {
      const fontSize = h * 0.65;
      const fontStyle = region.fontStyle === 'italic' ? 'italic ' : '';
      const fontWeight = region.fontWeight === 'bold' ? 'bold ' : '';
      const fontFamily = region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif';
      ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
      ctx.fillStyle = region.fontColor ?? '#1a1a1a';
      ctx.globalAlpha = 0.95;

      // Clip to region bounds
      ctx.save();
      ctx.beginPath();
      ctx.rect(region.x1, region.y1, w, h);
      ctx.clip();

      ctx.fillText(region.currentText, region.x1 + 4, region.y1 + h * 0.75);

      // Strikethrough
      if (region.textDecoration === 'line-through') {
        const textWidth = ctx.measureText(region.currentText).width;
        const strikeY = region.y1 + h * 0.75 - fontSize * 0.3;
        ctx.strokeStyle = region.fontColor ?? '#1a1a1a';
        ctx.lineWidth = Math.max(1, fontSize * 0.06);
        ctx.beginPath();
        ctx.moveTo(region.x1 + 4, strikeY);
        ctx.lineTo(region.x1 + 4 + textWidth, strikeY);
        ctx.stroke();
      }

      ctx.restore();
      ctx.globalAlpha = 1;
    }
  }

  return canvas;
}

/**
 * Export a page as a preview PNG blob.
 */
export async function exportPreviewPageAsBlob(
  page: Page,
  autoBackgroundColors?: Map<string, string>,
): Promise<Blob> {
  const canvas = await renderPreviewPage(page, autoBackgroundColors);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Failed to create preview image blob'))),
      'image/png',
    );
  });
}
