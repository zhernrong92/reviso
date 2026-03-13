export type ViewMode = 'preview' | 'edit';
export type PreviewLayout = 'side-by-side' | 'slider';
export type SliderOrientation = 'horizontal' | 'vertical';
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
  previewLayout: PreviewLayout;
  editorMode: EditorMode;
  sidebarOpen: boolean;
  showValidationIcons: boolean;
  regionDefaults: RegionDefaults;
}
