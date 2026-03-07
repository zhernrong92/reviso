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

type FontKey = 'normal' | 'bold' | 'italic' | 'boldItalic';

export async function exportPdf(documents: Document[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    normal: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
    italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  };

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

        const isBold = region.fontWeight === 'bold';
        const isItalic = region.fontStyle === 'italic';
        let fontKey: FontKey = 'normal';
        if (isBold && isItalic) fontKey = 'boldItalic';
        else if (isBold) fontKey = 'bold';
        else if (isItalic) fontKey = 'italic';
        const font = fonts[fontKey];

        // Compute text position matching the SVG overlay logic
        // pdf-lib uses bottom-left origin; SVG uses top-left, so flip Y
        const pos = region.textPosition ?? 'inside';
        let textX: number;
        let textY: number;
        switch (pos) {
          case 'top':
            textX = region.x1;
            textY = page.height - (region.y1 - 4);
            break;
          case 'bottom':
            textX = region.x1;
            textY = page.height - (region.y2 + fontSize + 4);
            break;
          case 'left':
            textX = region.x1 - 4 - font.widthOfTextAtSize(region.currentText, fontSize);
            textY = page.height - (region.y1 + h * 0.75);
            break;
          case 'right':
            textX = region.x2 + 4;
            textY = page.height - (region.y1 + h * 0.75);
            break;
          case 'inside':
          default:
            textX = region.x1 + 4;
            textY = page.height - (region.y1 + h * 0.75);
            break;
        }

        pdfPage.drawText(region.currentText, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(color.r, color.g, color.b),
        });

        // Strikethrough
        if (region.textDecoration === 'line-through') {
          const textWidth = font.widthOfTextAtSize(region.currentText, fontSize);
          const lineY = textY + fontSize * 0.3;
          pdfPage.drawLine({
            start: { x: textX, y: lineY },
            end: { x: textX + textWidth, y: lineY },
            thickness: Math.max(1, fontSize * 0.06),
            color: rgb(color.r, color.g, color.b),
          });
        }
      }
    }
  }

  return pdfDoc.save();
}
