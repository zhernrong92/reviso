import { PDFDocument, rgb } from 'pdf-lib';
import type { Document } from '../types/document';
import { detectRegionBackgrounds } from './detectRegionBackground';
import { fitFontSize } from './fitFontSize';
import { loadPdfFonts } from './pdfFonts';
import { imageToPngBytes } from './imageToBytes';
import { shouldRenderVertical, computeVerticalFontSize, splitGlyphs, regionPadding } from './textLayout';

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

/**
 * Export pages as PDF with the original image as background and corrected text
 * overlaid on top (Overlay style).
 */
export async function exportOverlayPdf(documents: Document[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontSet = await loadPdfFonts(pdfDoc);

  for (const doc of documents) {
    for (const page of doc.pages) {
      const pdfPage = pdfDoc.addPage([page.width, page.height]);

      // Embed and draw the original page image as background
      const imageBytes = await imageToPngBytes(page.imageSrc, page.width, page.height);
      const embeddedImage = await pdfDoc.embedPng(imageBytes);

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
        const padding = regionPadding(w);
        const vertical = shouldRenderVertical(region, w, h);

        if (vertical) {
          // Per-glyph font resolution: mixed-script columns (e.g. Han + Hangul)
          // each glyph picks its own script font.
          const glyphs = splitGlyphs(region.currentText);
          const fontSize = computeVerticalFontSize(region.currentText, w, h, padding);
          const cx = region.x1 + w / 2;
          let yCanvas = region.y1 + padding + fontSize * 0.85;
          for (const g of glyphs) {
            const { font: gFont, text: gText } = await fontSet.resolveFont(g, fontKey);
            if (!gText) {
              yCanvas += fontSize;
              continue;
            }
            const gw = gFont.widthOfTextAtSize(gText, fontSize);
            pdfPage.drawText(gText, {
              x: cx - gw / 2,
              y: page.height - yCanvas,
              size: fontSize,
              font: gFont,
              color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
            });
            yCanvas += fontSize;
          }
          continue;
        }

        const { font, text } = await fontSet.resolveFont(region.currentText, fontKey);
        if (!text) continue;

        {
          const fontSize = fitFontSize(w - padding * 2, h, (fs) => font.widthOfTextAtSize(text, fs));

          // pdf-lib uses bottom-left origin; flip Y
          const textX = region.x1 + padding;
          const textY = page.height - (region.y1 + h * 0.75);

          pdfPage.drawText(text, {
            x: textX,
            y: textY,
            size: fontSize,
            font,
            color: rgb(fontRgb.r, fontRgb.g, fontRgb.b),
          });

          // Strikethrough
          if (region.textDecoration === 'line-through') {
            const textWidth = font.widthOfTextAtSize(text, fontSize);
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
  }

  return pdfDoc.save();
}
