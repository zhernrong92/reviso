import { create } from 'zustand';
import type { Document } from '../types/document';

interface HistoryEntry {
  before: Document[];
  after: Document[];
}

interface EditHistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  pushEntry: (before: Document[], after: Document[]) => void;
  undo: () => Document[] | null;
  redo: () => Document[] | null;
  clear: () => void;
}

const MAX_HISTORY = 50;

const useEditHistoryStore = create<EditHistoryState>()((set, get) => ({
  past: [],
  future: [],

  pushEntry: (before, after) =>
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), { before, after }],
      future: [],
    })),

  undo: () => {
    const { past } = get();
    if (past.length === 0) return null;
    const entry = past[past.length - 1]!;
    set((state) => ({
      past: state.past.slice(0, -1),
      future: [entry, ...state.future],
    }));
    return entry.before;
  },

  redo: () => {
    const { future } = get();
    if (future.length === 0) return null;
    const entry = future[0]!;
    set((state) => ({
      past: [...state.past, entry],
      future: state.future.slice(1),
    }));
    return entry.after;
  },

  clear: () => set({ past: [], future: [] }),
}));

export { useEditHistoryStore };
