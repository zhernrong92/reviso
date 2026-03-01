import * as pdfjs from 'pdfjs-dist';
import type { Document } from '../../reviso/types/document';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

const RENDER_SCALE = 2;

export async function parsePdf(file: File): Promise<Document[]> {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;

  const docId = `pdf-${Date.now()}`;
  const docName = file.name.replace(/\.pdf$/i, '');
  const pages = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: RENDER_SCALE });

    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error(`Failed to get canvas context for page ${i}`);

    await page.render({ canvasContext: ctx, canvas, viewport }).promise;

    const dataUrl = canvas.toDataURL('image/png');

    pages.push({
      id: `${docId}-page${i}`,
      documentId: docId,
      pageNumber: i,
      imageSrc: dataUrl,
      originalImageSrc: dataUrl,
      width: viewport.width,
      height: viewport.height,
      regions: [],
    });
  }

  return [
    {
      id: docId,
      name: docName,
      pageCount: pages.length,
      pages,
    },
  ];
}
