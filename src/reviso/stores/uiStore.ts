import { create } from 'zustand';
import type { ViewMode, EditorMode, RegionDefaults, FeatureFlags } from '../types/ui';

interface UiStoreState {
  activeDocumentId: string | null;
  activePageId: string | null;
  selectedRegionId: string | null;
  hoveredRegionId: string | null;
  viewMode: ViewMode;
  editorMode: EditorMode;
  sidebarOpen: boolean;
  regionDefaults: RegionDefaults;
  helpDialogOpen: boolean;
  editable: boolean;
  features: FeatureFlags;
  onExportCallback: ((format: 'json' | 'pdf' | 'png', data: Blob) => void) | null;
  setActiveDocument: (id: string | null) => void;
  setActivePage: (id: string | null) => void;
  selectRegion: (id: string | null) => void;
  hoverRegion: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setEditorMode: (mode: EditorMode) => void;
  toggleSidebar: () => void;
  setRegionDefaults: (defaults: Partial<RegionDefaults>) => void;
  setHelpDialogOpen: (open: boolean) => void;
  setEditable: (editable: boolean) => void;
  setFeatures: (features: Partial<FeatureFlags>) => void;
  setOnExportCallback: (cb: ((format: 'json' | 'pdf' | 'png', data: Blob) => void) | null) => void;
}

const useUiStore = create<UiStoreState>()((set) => ({
  activeDocumentId: null,
  activePageId: null,
  selectedRegionId: null,
  hoveredRegionId: null,
  viewMode: 'edit',
  editorMode: 'select',
  sidebarOpen: true,
  regionDefaults: {
    fontColor: '#e0e0e0',
    fontFamily: 'Inter',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    borderColor: '#0bda90',
    borderVisible: true,
    backgroundColor: 'transparent',
  },
  helpDialogOpen: false,
  editable: true,
  features: { comparison: true, export: true, regionCreation: true },
  onExportCallback: null,

  setActiveDocument: (id) => set({ activeDocumentId: id, selectedRegionId: null }),
  setActivePage: (id) => set({ activePageId: id, selectedRegionId: null }),
  selectRegion: (id) => set({ selectedRegionId: id }),
  hoverRegion: (id) => set({ hoveredRegionId: id }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setRegionDefaults: (defaults) =>
    set((state) => ({ regionDefaults: { ...state.regionDefaults, ...defaults } })),
  setHelpDialogOpen: (open) => set({ helpDialogOpen: open }),
  setEditable: (editable) => set({ editable }),
  setFeatures: (features) =>
    set((state) => ({ features: { ...state.features, ...features } })),
  setOnExportCallback: (cb) => set({ onExportCallback: cb }),
}));

export { useUiStore };
