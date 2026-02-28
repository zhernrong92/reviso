import type { Document } from '../types/document';

interface ExportRegion {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  originalText: string;
  currentText: string;
  isEdited: boolean;
  isNew: boolean;
  confidence: number;
}

interface ExportPage {
  id: string;
  documentId: string;
  pageNumber: number;
  width: number;
  height: number;
  regions: ExportRegion[];
}

interface ExportDocument {
  id: string;
  name: string;
  pageCount: number;
  pages: ExportPage[];
}

export function exportJson(documents: Document[]): string {
  const exportData: ExportDocument[] = documents.map((doc) => ({
    id: doc.id,
    name: doc.name,
    pageCount: doc.pageCount,
    pages: doc.pages.map((page) => ({
      id: page.id,
      documentId: page.documentId,
      pageNumber: page.pageNumber,
      width: page.width,
      height: page.height,
      regions: page.regions.map((region) => ({
        id: region.id,
        x1: region.x1,
        y1: region.y1,
        x2: region.x2,
        y2: region.y2,
        originalText: region.originalText,
        currentText: region.currentText,
        isEdited: region.isEdited,
        isNew: region.isNew,
        confidence: region.confidence,
      })),
    })),
  }));

  return JSON.stringify(exportData, null, 2);
}
