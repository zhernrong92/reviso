import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Document, TextRegion } from '../types/document';
import { useEditHistoryStore } from './editHistoryStore';

interface DocumentState {
  documents: Document[];
  loadDocuments: (documents: Document[]) => void;
  updateRegionText: (pageId: string, regionId: string, text: string) => void;
  addRegion: (pageId: string, region: TextRegion) => void;
  deleteRegion: (pageId: string, regionId: string) => void;
  updateRegionBounds: (pageId: string, regionId: string, x1: number, y1: number, x2: number, y2: number) => void;
  updateRegionStyle: (pageId: string, regionId: string, style: { fontColor?: string; fontFamily?: string; fontWeight?: 'normal' | 'bold'; fontStyle?: 'normal' | 'italic'; textDecoration?: 'none' | 'line-through'; borderColor?: string; borderVisible?: boolean; backgroundColor?: string; textPosition?: 'inside' | 'top' | 'bottom' | 'left' | 'right' }) => void;
  restoreSnapshot: (snapshot: Document[]) => void;
  getActiveDocument: (id: string | null) => Document | undefined;
  getActivePage: (id: string | null) => Document['pages'][number] | undefined;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj)) as T;
}

const useDocumentStore = create<DocumentState>()(
  immer((set, get) => ({
    documents: [],

    loadDocuments: (documents) =>
      set((state) => {
        state.documents = documents;
      }),

    updateRegionText: (pageId, regionId, text) => {
      const before = deepClone(get().documents);
      set((state) => {
        for (const doc of state.documents) {
          const page = doc.pages.find((p) => p.id === pageId);
          if (page) {
            const region = page.regions.find((r) => r.id === regionId);
            if (region) {
              region.currentText = text;
              region.isEdited = text !== region.originalText;
            }
            break;
          }
        }
      });
      const after = deepClone(get().documents);
      useEditHistoryStore.getState().pushEntry(before, after);
    },

    addRegion: (pageId, region) => {
      const before = deepClone(get().documents);
      set((state) => {
        for (const doc of state.documents) {
          const page = doc.pages.find((p) => p.id === pageId);
          if (page) {
            page.regions.push(region);
            break;
          }
        }
      });
      const after = deepClone(get().documents);
      useEditHistoryStore.getState().pushEntry(before, after);
    },

    deleteRegion: (pageId, regionId) => {
      const before = deepClone(get().documents);
      set((state) => {
        for (const doc of state.documents) {
          const page = doc.pages.find((p) => p.id === pageId);
          if (page) {
            const idx = page.regions.findIndex((r) => r.id === regionId);
            if (idx !== -1) page.regions.splice(idx, 1);
            break;
          }
        }
      });
      const after = deepClone(get().documents);
      useEditHistoryStore.getState().pushEntry(before, after);
    },

    updateRegionBounds: (pageId, regionId, x1, y1, x2, y2) => {
      const before = deepClone(get().documents);
      set((state) => {
        for (const doc of state.documents) {
          const page = doc.pages.find((p) => p.id === pageId);
          if (page) {
            const region = page.regions.find((r) => r.id === regionId);
            if (region) {
              region.x1 = x1;
              region.y1 = y1;
              region.x2 = x2;
              region.y2 = y2;
            }
            break;
          }
        }
      });
      const after = deepClone(get().documents);
      useEditHistoryStore.getState().pushEntry(before, after);
    },

    updateRegionStyle: (pageId, regionId, style) => {
      const before = deepClone(get().documents);
      set((state) => {
        for (const doc of state.documents) {
          const page = doc.pages.find((p) => p.id === pageId);
          if (page) {
            const region = page.regions.find((r) => r.id === regionId);
            if (region) {
              if (style.fontColor !== undefined) region.fontColor = style.fontColor;
              if (style.fontFamily !== undefined) region.fontFamily = style.fontFamily;
              if (style.fontWeight !== undefined) region.fontWeight = style.fontWeight;
              if (style.fontStyle !== undefined) region.fontStyle = style.fontStyle;
              if (style.textDecoration !== undefined) region.textDecoration = style.textDecoration;
              if (style.borderColor !== undefined) region.borderColor = style.borderColor;
              if (style.borderVisible !== undefined) region.borderVisible = style.borderVisible;
              if (style.backgroundColor !== undefined) region.backgroundColor = style.backgroundColor;
              if (style.textPosition !== undefined) region.textPosition = style.textPosition;
            }
            break;
          }
        }
      });
      const after = deepClone(get().documents);
      useEditHistoryStore.getState().pushEntry(before, after);
    },

    restoreSnapshot: (snapshot) =>
      set((state) => {
        state.documents = snapshot;
      }),

    getActiveDocument: (id) => {
      if (!id) return undefined;
      return get().documents.find((d) => d.id === id);
    },

    getActivePage: (id) => {
      if (!id) return undefined;
      for (const doc of get().documents) {
        const page = doc.pages.find((p) => p.id === id);
        if (page) return page;
      }
      return undefined;
    },
  }))
);

export { useDocumentStore };
