import { PDFDocument } from 'pdf-lib';
import type { Document } from '../types/document';

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

/**
 * Export original page images as a PDF (one page per image).
 */
export async function exportOriginalPdf(documents: Document[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const doc of documents) {
    for (const page of doc.pages) {
      const imageBytes = await loadImageAsArrayBuffer(page.imageSrc);
      const isPng = page.imageSrc.includes('.png') || page.imageSrc.includes('image/png');
      const embeddedImage = isPng
        ? await pdfDoc.embedPng(imageBytes)
        : await pdfDoc.embedJpg(imageBytes);

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
