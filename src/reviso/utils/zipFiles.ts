import { zipSync } from 'fflate';

interface ZipEntry {
  filename: string;
  data: Uint8Array;
}

/**
 * Create a ZIP blob from a list of named files.
 */
export function createZipBlob(entries: ZipEntry[]): Blob {
  const files: Record<string, Uint8Array> = {};
  for (const entry of entries) {
    files[entry.filename] = entry.data;
  }
  const zipped = zipSync(files);
  return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}

/**
 * Convert a Blob to Uint8Array.
 */
export async function blobToUint8Array(blob: Blob): Promise<Uint8Array> {
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
