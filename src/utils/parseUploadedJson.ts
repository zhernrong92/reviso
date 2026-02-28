import type { Document, Page, TextRegion } from '../types/document';

function assertString(val: unknown, field: string): asserts val is string {
  if (typeof val !== 'string') throw new Error(`"${field}" must be a string`);
}

function assertNumber(val: unknown, field: string): asserts val is number {
  if (typeof val !== 'number' || Number.isNaN(val)) throw new Error(`"${field}" must be a number`);
}

function parseRegion(raw: Record<string, unknown>, index: number): TextRegion {
  const prefix = `regions[${index}]`;
  assertString(raw['id'], `${prefix}.id`);
  assertNumber(raw['x1'], `${prefix}.x1`);
  assertNumber(raw['y1'], `${prefix}.y1`);
  assertNumber(raw['x2'], `${prefix}.x2`);
  assertNumber(raw['y2'], `${prefix}.y2`);
  assertString(raw['originalText'], `${prefix}.originalText`);
  assertString(raw['currentText'], `${prefix}.currentText`);

  return {
    id: raw['id'] as string,
    x1: raw['x1'] as number,
    y1: raw['y1'] as number,
    x2: raw['x2'] as number,
    y2: raw['y2'] as number,
    originalText: raw['originalText'] as string,
    currentText: raw['currentText'] as string,
    isEdited: typeof raw['isEdited'] === 'boolean' ? raw['isEdited'] : false,
    isNew: typeof raw['isNew'] === 'boolean' ? raw['isNew'] : false,
    confidence: typeof raw['confidence'] === 'number' ? raw['confidence'] : 1,
    ...(typeof raw['fontColor'] === 'string' ? { fontColor: raw['fontColor'] } : {}),
    ...(typeof raw['borderColor'] === 'string' ? { borderColor: raw['borderColor'] } : {}),
    ...(typeof raw['borderVisible'] === 'boolean' ? { borderVisible: raw['borderVisible'] } : {}),
    ...(typeof raw['backgroundColor'] === 'string' ? { backgroundColor: raw['backgroundColor'] } : {}),
  };
}

function generateSimpleSvg(label: string, width: number, height: number, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="${width}" height="${height}" fill="${bg}"/>
    <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#888">${label}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function parsePage(raw: Record<string, unknown>, docIndex: number, pageIndex: number): Page {
  const prefix = `documents[${docIndex}].pages[${pageIndex}]`;

  assertString(raw['id'], `${prefix}.id`);
  assertNumber(raw['pageNumber'], `${prefix}.pageNumber`);
  assertNumber(raw['width'], `${prefix}.width`);
  assertNumber(raw['height'], `${prefix}.height`);

  if (!Array.isArray(raw['regions'])) {
    throw new Error(`${prefix}.regions must be an array`);
  }

  const regions = (raw['regions'] as Record<string, unknown>[]).map((r, i) => {
    if (typeof r !== 'object' || r === null) {
      throw new Error(`${prefix}.regions[${i}] must be an object`);
    }
    return parseRegion(r, i);
  });

  const width = raw['width'] as number;
  const height = raw['height'] as number;
  const pageNum = raw['pageNumber'] as number;
  const docId = typeof raw['documentId'] === 'string' ? raw['documentId'] : '';

  const imageSrc =
    typeof raw['imageSrc'] === 'string'
      ? raw['imageSrc']
      : generateSimpleSvg(`Page ${pageNum}`, width, height, '#1a1a1a');

  const originalImageSrc =
    typeof raw['originalImageSrc'] === 'string'
      ? raw['originalImageSrc']
      : generateSimpleSvg(`Page ${pageNum} (original)`, width, height, '#1a1510');

  return {
    id: raw['id'] as string,
    documentId: docId,
    pageNumber: pageNum,
    imageSrc,
    originalImageSrc,
    width,
    height,
    regions,
  };
}

export function parseUploadedJson(jsonString: string): Document[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON: could not parse the file');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected a JSON array of documents');
  }

  if (parsed.length === 0) {
    throw new Error('The document array is empty');
  }

  return (parsed as Record<string, unknown>[]).map((raw, docIndex) => {
    if (typeof raw !== 'object' || raw === null) {
      throw new Error(`documents[${docIndex}] must be an object`);
    }

    assertString(raw['id'], `documents[${docIndex}].id`);
    assertString(raw['name'], `documents[${docIndex}].name`);

    if (!Array.isArray(raw['pages'])) {
      throw new Error(`documents[${docIndex}].pages must be an array`);
    }

    const pages = (raw['pages'] as Record<string, unknown>[]).map((p, pi) => {
      if (typeof p !== 'object' || p === null) {
        throw new Error(`documents[${docIndex}].pages[${pi}] must be an object`);
      }
      const page = parsePage(p, docIndex, pi);
      // Backfill documentId if missing
      if (!page.documentId) {
        return { ...page, documentId: raw['id'] as string };
      }
      return page;
    });

    return {
      id: raw['id'] as string,
      name: raw['name'] as string,
      pageCount: pages.length,
      pages,
    };
  });
}
