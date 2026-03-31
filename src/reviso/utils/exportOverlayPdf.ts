import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { Document } from '../types/document';
import { detectRegionBackgrounds } from './detectRegionBackground';
import { fitFontSize } from './fitFontSize';

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

function loadImageAsArrayBuffer(src: string): Promise<ArrayBuffer> {
  if (src.startsWith('data:')) {
    const base64 = src.split(',')[1];
    if (!base64) throw new Error('Invalid data URL');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return Promise.resolve(bytes.buffer as ArrayBuffer);
  }

  return fetch(src).then((res) => {
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    return res.arrayBuffer();
  });
}

type FontKey = 'normal' | 'bold' | 'italic' | 'boldItalic';

/**
 * Export pages as PDF with the original image as background and corrected text
 * overlaid on top (Overlay style).
 */
export async function exportOverlayPdf(documents: Document[]): Promise<Uint8Array> {
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

      // Embed and draw the original page image as background
      const imageBytes = await loadImageAsArrayBuffer(page.imageSrc);
      const isPng = page.imageSrc.includes('.png') || page.imageSrc.includes('image/png');
      const embeddedImage = isPng
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);

      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
      });

      // Detect background colors for opaque fills
      const bgColors = await detectRegionBackgrounds(page.imageSrc, page.regions);

      // Draw each region with opaque background fill + corrected text
      for (const region of page.regions) {
        const w = region.x2 - region.x1;
        const h = region.y2 - region.y1;

        // Opaque background fill to cover original text
        const bgHex = (region.backgroundColor && region.backgroundColor !== 'transparent')
          ? region.backgroundColor
          : (bgColors.get(region.id) ?? '#ffffff');
        const bgRgb = hexToRgb(bgHex);

        pdfPage.drawRectangle({
          x: region.x1,
          y: page.height - region.y2,
          width: w,
          height: h,
          color: rgb(bgRgb.r, bgRgb.g, bgRgb.b),
        });

        if (!region.currentText) continue;

        const fontColorHex = region.fontColor ?? '#1a1a1a';
        const fontRgb = hexToRgb(fontColorHex);

        const isBold = region.fontWeight === 'bold';
        const isItalic = region.fontStyle === 'italic';
        let fontKey: FontKey = 'normal';
        if (isBold && isItalic) fontKey = 'boldItalic';
        else if (isBold) fontKey = 'bold';
        else if (isItalic) fontKey = 'italic';
        const font = fonts[fontKey];

        const padding = 4;
        const fontSize = fitFontSize(w - padding * 2, h, (fs) => font.widthOfTextAtSize(region.currentText, fs));

        // pdf-lib uses bottom-left origin; flip Y
        const textX = region.x1 + padding;
        const textY = page.height - (region.y1 + h * 0.75);

        pdfPage.drawText(region.currentText, {
          x: textX,
          y: textY,
          size: fontSize,
          font,
          color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
        });

        // Strikethrough
        if (region.textDecoration === 'line-through') {
          const textWidth = font.widthOfTextAtSize(region.currentText, fontSize);
          const lineY = textY + fontSize * 0.3;
          pdfPage.drawLine({
            start: { x: textX, y: lineY },
            end: { x: textX + textWidth, y: lineY },
            thickness: Math.max(1, fontSize * 0.06),
            color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
          });
        }
      }
    }
  }

  return pdfDoc.save();
}
