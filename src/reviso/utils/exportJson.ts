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
  fontColor?: string;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'line-through';
  borderColor?: string;
  borderVisible?: boolean;
  backgroundColor?: string;
  textPosition?: 'inside' | 'top' | 'bottom' | 'left' | 'right';
  isValidated?: boolean;
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
        ...(region.fontColor !== undefined && { fontColor: region.fontColor }),
        ...(region.fontFamily !== undefined && { fontFamily: region.fontFamily }),
        ...(region.fontWeight !== undefined && { fontWeight: region.fontWeight }),
        ...(region.fontStyle !== undefined && { fontStyle: region.fontStyle }),
        ...(region.textDecoration !== undefined && { textDecoration: region.textDecoration }),
        ...(region.borderColor !== undefined && { borderColor: region.borderColor }),
        ...(region.borderVisible !== undefined && { borderVisible: region.borderVisible }),
        ...(region.backgroundColor !== undefined && { backgroundColor: region.backgroundColor }),
        ...(region.textPosition !== undefined && { textPosition: region.textPosition }),
        ...(region.isValidated !== undefined && { isValidated: region.isValidated }),
      })),
    })),
  }));

  return JSON.stringify(exportData, null, 2);
}
