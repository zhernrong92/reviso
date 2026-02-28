import { create } from 'zustand';
import type { ViewMode, EditorMode, RegionDefaults } from '../types/ui';

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
  setActiveDocument: (id: string | null) => void;
  setActivePage: (id: string | null) => void;
  selectRegion: (id: string | null) => void;
  hoverRegion: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setEditorMode: (mode: EditorMode) => void;
  toggleSidebar: () => void;
  setRegionDefaults: (defaults: Partial<RegionDefaults>) => void;
  setHelpDialogOpen: (open: boolean) => void;
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
    borderColor: '#0bda90',
    borderVisible: true,
    backgroundColor: 'transparent',
  },
  helpDialogOpen: false,

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
}));

export { useUiStore };
