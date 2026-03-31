import type { Document } from '../types/document';

/**
 * Export pages as PNG images using "Synthetic Reconstruct" style:
 * white background with corrected text rendered at original positions.
 */
export async function exportSyntheticImage(
  documents: Document[],
): Promise<{ filename: string; blob: Blob }[]> {
  const results: { filename: string; blob: Blob }[] = [];

  for (const doc of documents) {
    const baseName = doc.name.replace(/\s+/g, '_').toLowerCase();

    for (const page of doc.pages) {
      const canvas = document.createElement('canvas');
      canvas.width = page.width;
      canvas.height = page.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');

      // White background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, page.width, page.height);

      // Draw each region's text at its bounding box position
      for (const region of page.regions) {
        if (!region.currentText) continue;

        const w = region.x2 - region.x1;
        const h = region.y2 - region.y1;
        const fontSize = Math.max(8, h * 0.65);
        const fontStyle = region.fontStyle === 'italic' ? 'italic ' : '';
        const fontWeight = region.fontWeight === 'bold' ? 'bold ' : '';
        const fontFamily = region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif';

        ctx.font = `${fontStyle}${fontWeight}${fontSize}px ${fontFamily}`;
        ctx.fillStyle = region.fontColor ?? '#1a1a1a';

        // Clip to region bounds
        ctx.save();
        ctx.beginPath();
        ctx.rect(region.x1, region.y1, w, h);
        ctx.clip();

        const textX = region.x1 + 4;
        const textY = region.y1 + h * 0.75;
        ctx.fillText(region.currentText, textX, textY);

        // Strikethrough
        if (region.textDecoration === 'line-through') {
          const textWidth = ctx.measureText(region.currentText).width;
          const strikeY = textY - fontSize * 0.3;
          ctx.strokeStyle = region.fontColor ?? '#1a1a1a';
          ctx.lineWidth = Math.max(1, fontSize * 0.06);
          ctx.beginPath();
          ctx.moveTo(textX, strikeY);
          ctx.lineTo(textX + textWidth, strikeY);
          ctx.stroke();
        }

        ctx.restore();
      }

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create image blob'))),
          'image/png',
        );
      });

      const suffix = doc.pages.length > 1 ? `_page${page.pageNumber}` : '';
      results.push({ filename: `${baseName}${suffix}_synthetic.png`, blob });
    }
  }

  return results;
}
