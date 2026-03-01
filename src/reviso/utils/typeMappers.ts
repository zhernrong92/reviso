import type { Document, Page, TextRegion } from '../types/document';
import type { RevisoDocument, RevisoPage, RevisoRegion } from '../types/public';

// --- Public → Internal ---

export function toInternalRegion(region: RevisoRegion): TextRegion {
  return {
    id: region.id,
    x1: region.x,
    y1: region.y,
    x2: region.x + region.width,
    y2: region.y + region.height,
    originalText: region.originalText ?? region.text,
    currentText: region.text,
    isEdited: region.originalText !== undefined && region.originalText !== region.text,
    isNew: false,
    confidence: 1.0,
    fontColor: region.fontColor,
    fontFamily: region.fontFamily,
    fontWeight: region.fontWeight,
    fontStyle: region.fontStyle,
    textDecoration: region.textDecoration,
    borderColor: region.borderColor,
    borderVisible: region.borderVisible,
    backgroundColor: region.backgroundColor,
  };
}

export function toInternalPage(page: RevisoPage, documentId: string): Page {
  return {
    id: page.id,
    documentId,
    pageNumber: page.pageNumber,
    imageSrc: page.imageSrc,
    originalImageSrc: page.originalImageSrc,
    width: page.width,
    height: page.height,
    regions: page.regions.map(toInternalRegion),
  };
}

export function toInternalDocument(doc: RevisoDocument): Document {
  return {
    id: doc.id,
    name: doc.name,
    pageCount: doc.pages.length,
    pages: doc.pages.map((p) => toInternalPage(p, doc.id)),
  };
}

// --- Internal → Public ---

export function toPublicRegion(region: TextRegion): RevisoRegion {
  return {
    id: region.id,
    x: region.x1,
    y: region.y1,
    width: region.x2 - region.x1,
    height: region.y2 - region.y1,
    text: region.currentText,
    originalText: region.originalText,
    fontColor: region.fontColor,
    fontFamily: region.fontFamily,
    fontWeight: region.fontWeight,
    fontStyle: region.fontStyle,
    textDecoration: region.textDecoration,
    borderColor: region.borderColor,
    borderVisible: region.borderVisible,
    backgroundColor: region.backgroundColor,
  };
}

export function toPublicPage(page: Page): RevisoPage {
  return {
    id: page.id,
    pageNumber: page.pageNumber,
    imageSrc: page.imageSrc,
    originalImageSrc: page.originalImageSrc,
    width: page.width,
    height: page.height,
    regions: page.regions.map(toPublicRegion),
  };
}

export function toPublicDocument(doc: Document): RevisoDocument {
  return {
    id: doc.id,
    name: doc.name,
    pages: doc.pages.map(toPublicPage),
  };
}
