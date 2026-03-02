export type ViewMode = 'edit' | 'compare';
export type EditorMode = 'select' | 'create';

export interface FeatureFlags {
  comparison: boolean;
  export: boolean;
  regionCreation: boolean;
}

export interface RegionDefaults {
  fontColor: string;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'line-through';
  borderColor: string;
  borderVisible: boolean;
  backgroundColor: string;
  textPosition: 'inside' | 'top' | 'bottom' | 'left' | 'right';
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
