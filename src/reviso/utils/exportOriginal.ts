import { PDFDocument } from 'pdf-lib';
import type { Document } from '../types/document';
import { imageToPngBytes } from './imageToBytes';

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
        .then((blob) => {
          img.src = URL.createObjectURL(blob);
        })
        .catch(reject);
    }
  });
}

/**
 * Export original page images as a PDF (one page per image).
 */
export async function exportOriginalPdf(documents: Document[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const doc of documents) {
    for (const page of doc.pages) {
      const imageBytes = await imageToPngBytes(page.imageSrc, page.width, page.height);
      const embeddedImage = await pdfDoc.embedPng(imageBytes);

      const pdfPage = pdfDoc.addPage([page.width, page.height]);
      pdfPage.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: page.width,
        height: page.height,
      });
    }
  }

  return pdfDoc.save();
}

/**
 * Export original page images as PNG files.
 */
export async function exportOriginalPng(
  documents: Document[],
): Promise<{ filename: string; blob: Blob }[]> {
  const results: { filename: string; blob: Blob }[] = [];

  for (const doc of documents) {
    const baseName = doc.name.replace(/\s+/g, '_').toLowerCase();

    for (const page of doc.pages) {
      const img = await loadImage(page.imageSrc);
      const canvas = document.createElement('canvas');
      canvas.width = page.width;
      canvas.height = page.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      ctx.drawImage(img, 0, 0, page.width, page.height);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Failed to create image blob'))),
          'image/png',
        );
      });

      const suffix = doc.pages.length > 1 ? `_page${page.pageNumber}` : '';
      results.push({ filename: `${baseName}${suffix}_original.png`, blob });
    }
  }

  return results;
}
