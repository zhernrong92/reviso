export type ViewMode = 'edit' | 'compare';
export type EditorMode = 'select' | 'create';

export interface RegionDefaults {
  fontColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'line-through';
  borderColor: string;
  borderVisible: boolean;
  backgroundColor: string;
}

export interface UiState {
  activeDocumentId: string | null;
  activePageId: string | null;
  selectedRegionId: string | null;
  hoveredRegionId: string | null;
  viewMode: ViewMode;
  editorMode: EditorMode;
  sidebarOpen: boolean;
  regionDefaults: RegionDefaults;
}
