import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Document } from '../types/document';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result?.[1] || !result[2] || !result[3]) {
    return { r: 0.88, g: 0.88, b: 0.88 };
  }
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}

export async function exportPdf(documents: Document[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const doc of documents) {
    for (const page of doc.pages) {
      const pdfPage = pdfDoc.addPage([page.width, page.height]);

      // Draw light background
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
        color: rgb(0.12, 0.12, 0.12),
      });

      // Draw each region's text at its bounding box position
      for (const region of page.regions) {
        if (!region.currentText) continue;

        const h = region.y2 - region.y1;
        const fontSize = Math.max(8, h * 0.65);
        const color = region.fontColor
          ? hexToRgb(region.fontColor)
          : { r: 0.88, g: 0.88, b: 0.88 };

        // pdf-lib uses bottom-left origin; SVG uses top-left
        const pdfY = page.height - region.y1 - h * 0.75;

        pdfPage.drawText(region.currentText, {
          x: region.x1 + 4,
          y: pdfY,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
        });
      }
    }
  }

  return pdfDoc.save();
}
