import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useDocumentStore } from '../stores/documentStore';
import { useEditHistoryStore } from '../stores/editHistoryStore';

export function useNavigationKeyboard() {
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activePageId = useUiStore((s) => s.activePageId);
  const setActiveDocument = useUiStore((s) => s.setActiveDocument);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
  const setHelpDialogOpen = useUiStore((s) => s.setHelpDialogOpen);

  const documents = useDocumentStore((s) => s.documents);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));
  const restoreSnapshot = useDocumentStore((s) => s.restoreSnapshot);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      // ? — open keyboard help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setHelpDialogOpen(true);
        return;
      }

      // Ctrl+Z — undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        const snapshot = useEditHistoryStore.getState().undo();
        if (snapshot) restoreSnapshot(snapshot);
        return;
      }

      // Ctrl+Shift+Z — redo
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        const snapshot = useEditHistoryStore.getState().redo();
        if (snapshot) restoreSnapshot(snapshot);
        return;
      }

      if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        const newMode = viewMode === 'edit' ? 'compare' : 'edit';
        setViewMode(newMode);
        if (newMode === 'compare') {
          selectRegion(null);
          setEditorMode('select');
        }
        return;
      }

      if (e.ctrlKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
        e.preventDefault();
        if (!activeDocumentId || documents.length < 2) return;
        const currentIdx = documents.findIndex((d) => d.id === activeDocumentId);
        if (currentIdx === -1) return;

        const delta = e.key === 'ArrowUp' ? -1 : 1;
        const nextIdx = currentIdx + delta;
        if (nextIdx < 0 || nextIdx >= documents.length) return;

        const nextDoc = documents[nextIdx];
        if (!nextDoc) return;
        setActiveDocument(nextDoc.id);
        const firstPage = nextDoc.pages[0];
        if (firstPage) setActivePage(firstPage.id);
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'PageUp' || e.key === 'PageDown') {
        if (!activeDocument || !activePageId || viewMode === 'compare') return;
        e.preventDefault();
        const pages = activeDocument.pages;
        const currentIdx = pages.findIndex((p) => p.id === activePageId);
        if (currentIdx === -1) return;

        const delta = (e.key === 'ArrowLeft' || e.key === 'PageUp') ? -1 : 1;
        const nextIdx = currentIdx + delta;
        if (nextIdx < 0 || nextIdx >= pages.length) return;

        const nextPage = pages[nextIdx];
        if (!nextPage) return;
        setActivePage(nextPage.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDocumentId, activePageId, documents, activeDocument, setActiveDocument, setActivePage, viewMode, setViewMode, selectRegion, setEditorMode, setHelpDialogOpen, restoreSnapshot]);
}
