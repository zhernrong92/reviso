import { PDFDocument, rgb } from 'pdf-lib';
import type { Document } from '../types/document';
import { fitFontSize } from './fitFontSize';
import { loadPdfFonts } from './pdfFonts';
import { shouldRenderVertical, computeVerticalFontSize, splitGlyphs, regionPadding } from './textLayout';

type FontKey = 'normal' | 'bold' | 'italic' | 'boldItalic';

export async function exportPdf(documents: Document[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontSet = await loadPdfFonts(pdfDoc);

  for (const doc of documents) {
    for (const page of doc.pages) {
      const pdfPage = pdfDoc.addPage([page.width, page.height]);

      // White background for synthetic reconstruct
      pdfPage.drawRectangle({
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
        color: rgb(1, 1, 1),
      });

      // Draw each region's text at its bounding box position
      for (const region of page.regions) {
        if (!region.currentText) continue;

        const w = region.x2 - region.x1;
        const h = region.y2 - region.y1;
        const color = { r: 0.1, g: 0.1, b: 0.1 };

        const isBold = region.fontWeight === 'bold';
        const isItalic = region.fontStyle === 'italic';
        let fontKey: FontKey = 'normal';
        if (isBold && isItalic) fontKey = 'boldItalic';
        else if (isBold) fontKey = 'bold';
        else if (isItalic) fontKey = 'italic';
        const padding = regionPadding(w);
        const vertical = shouldRenderVertical(region, w, h);

        if (vertical) {
          // Per-glyph font resolution lets mixed-script columns (e.g. Han + Hangul)
          // render each glyph in the correct script font instead of one font for all.
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
              color: rgb(color.r, color.g, color.b),
            });
            yCanvas += fontSize;
          }
        } else {
          const { font, text } = await fontSet.resolveFont(region.currentText, fontKey);
          if (!text) continue;
          const fontSize = fitFontSize(w - padding * 2, h, (fs) => font.widthOfTextAtSize(text, fs));

          // pdf-lib uses bottom-left origin; SVG uses top-left, so flip Y
          const textX = region.x1 + padding;
          const textY = page.height - (region.y1 + h * 0.75);

          pdfPage.drawText(text, {
            x: textX,
            y: textY,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
          });

          // Strikethrough
          if (region.textDecoration === 'line-through') {
            const textWidth = font.widthOfTextAtSize(text, fontSize);
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
  }

  return pdfDoc.save();
}
