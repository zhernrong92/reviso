export interface TextRegion {
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
  borderColor?: string;
  borderVisible?: boolean;
  backgroundColor?: string;
}

export interface Page {
  id: string;
  documentId: string;
  pageNumber: number;
  imageSrc: string;
  originalImageSrc: string;
  width: number;
  height: number;
  regions: TextRegion[];
}

export interface Document {
  id: string;
  name: string;
  pageCount: number;
  pages: Page[];
}
