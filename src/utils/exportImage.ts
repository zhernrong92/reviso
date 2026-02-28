import type { Document } from '../types/document';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load page image'));
    img.src = src;
  });
}

async function renderPage(
  page: Document['pages'][number],
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = page.width;
  canvas.height = page.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw the page background image
  const img = await loadImage(page.imageSrc);
  ctx.drawImage(img, 0, 0, page.width, page.height);

  // Draw each region
  for (const region of page.regions) {
    const w = region.x2 - region.x1;
    const h = region.y2 - region.y1;

    // Background fill
    if (region.backgroundColor && region.backgroundColor !== 'transparent') {
      ctx.fillStyle = region.backgroundColor;
      ctx.fillRect(region.x1, region.y1, w, h);
    }

    // Border
    if (region.borderVisible !== false) {
      ctx.strokeStyle = region.borderColor ?? '#0bda90';
      ctx.globalAlpha = 0.3;
      ctx.lineWidth = 1;
      ctx.strokeRect(region.x1, region.y1, w, h);
      ctx.globalAlpha = 1;
    }

    // Text
    if (region.currentText) {
      const fontSize = h * 0.65;
      ctx.font = `${fontSize}px Inter, Roboto, Helvetica, Arial, sans-serif`;
      ctx.fillStyle = region.fontColor ?? '#e0e0e0';
      ctx.globalAlpha = 0.9;
      ctx.fillText(region.currentText, region.x1 + 4, region.y1 + h * 0.75);
      ctx.globalAlpha = 1;
    }
  }

  return canvas;
}

export async function exportImage(
  documents: Document[],
): Promise<{ filename: string; blob: Blob }[]> {
  const results: { filename: string; blob: Blob }[] = [];

  for (const doc of documents) {
    const baseName = doc.name.replace(/\s+/g, '_').toLowerCase();

    for (const page of doc.pages) {
      const canvas = await renderPage(page);
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create image blob'))),
          'image/png',
        );
      });

      const suffix = doc.pages.length > 1 ? `_page${page.pageNumber}` : '';
      results.push({ filename: `${baseName}${suffix}.png`, blob });
    }
  }

  return results;
}
