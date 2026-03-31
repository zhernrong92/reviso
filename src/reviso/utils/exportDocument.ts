import type { RevisoDocument } from '../types/public';
import { toInternalDocument } from './typeMappers';
import { exportJson } from './exportJson';
import { exportPdf } from './exportPdf';
import { exportOverlayPdf } from './exportOverlayPdf';
import { exportOriginalPdf } from './exportOriginal';
import { exportOriginalPng } from './exportOriginal';
import { exportSyntheticImage } from './exportSyntheticImage';
import { exportPreviewPageAsBlob } from './exportPreviewImage';
import { createZipBlob, blobToUint8Array } from './zipFiles';

export type ExportType = 'synthetic' | 'overlay' | 'original' | 'json';
export type ExportFormat = 'pdf' | 'png';

export interface ExportOptions {
  /** The document(s) to export */
  documents: RevisoDocument[];
  /** Export type */
  type: ExportType;
  /** File format — ignored for 'json' type (always JSON) */
  format?: ExportFormat;
}

export interface ExportResult {
  /** The exported data as a Blob */
  blob: Blob;
  /** Suggested filename */
  filename: string;
  /** MIME type of the blob */
  mimeType: string;
}

/**
 * Headless export function that can be used outside the Reviso component.
 * Accepts public RevisoDocument types and returns a downloadable blob.
 */
export async function exportDocument(options: ExportOptions): Promise<ExportResult> {
  const { documents, type, format = 'pdf' } = options;
  const internalDocs = documents.map(toInternalDocument);
  const baseName = (documents[0]?.name ?? 'export').replace(/\s+/g, '_').toLowerCase();

  if (type === 'json') {
    const json = exportJson(internalDocs);
    return {
      blob: new Blob([json], { type: 'application/json' }),
      filename: `${baseName}.json`,
      mimeType: 'application/json',
    };
  }

  if (type === 'synthetic') {
    if (format === 'pdf') {
      const pdfBytes = await exportPdf(internalDocs);
      return {
        blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        filename: `${baseName}_synthetic.pdf`,
        mimeType: 'application/pdf',
      };
    }
    const images = await exportSyntheticImage(internalDocs);
    return bundlePngs(images, `${baseName}_synthetic`);
  }

  if (type === 'original') {
    if (format === 'pdf') {
      const pdfBytes = await exportOriginalPdf(internalDocs);
      return {
        blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
        filename: `${baseName}_original.pdf`,
        mimeType: 'application/pdf',
      };
    }
    const images = await exportOriginalPng(internalDocs);
    return bundlePngs(images, `${baseName}_original`);
  }

  // overlay
  if (format === 'pdf') {
    const pdfBytes = await exportOverlayPdf(internalDocs);
    return {
      blob: new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' }),
      filename: `${baseName}_overlay.pdf`,
      mimeType: 'application/pdf',
    };
  }
  const images: { filename: string; blob: Blob }[] = [];
  for (const doc of internalDocs) {
    const docBase = doc.name.replace(/\s+/g, '_').toLowerCase();
    for (const page of doc.pages) {
      const blob = await exportPreviewPageAsBlob(page);
      const suffix = doc.pages.length > 1 ? `_page${page.pageNumber}` : '';
      images.push({ filename: `${docBase}${suffix}_overlay.png`, blob });
    }
  }
  return bundlePngs(images, `${baseName}_overlay`);
}

/**
 * Bundle PNG images: single file if one image, zipped if multiple.
 */
async function bundlePngs(
  images: { filename: string; blob: Blob }[],
  zipBaseName: string,
): Promise<ExportResult> {
  if (images.length === 1 && images[0]) {
    return {
      blob: images[0].blob,
      filename: images[0].filename,
      mimeType: 'image/png',
    };
  }
  const entries = await Promise.all(
    images.map(async ({ filename, blob }) => ({
      filename,
      data: await blobToUint8Array(blob),
    })),
  );
  const zipBlob = createZipBlob(entries);
  return {
    blob: zipBlob,
    filename: `${zipBaseName}.zip`,
    mimeType: 'application/zip',
  };
}
