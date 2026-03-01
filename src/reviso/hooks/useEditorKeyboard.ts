import { useEffect } from 'react';
import { useUiStore } from '../stores/uiStore';
import { useDocumentStore } from '../stores/documentStore';

export function useEditorKeyboard() {
  const selectedRegionId = useUiStore((s) => s.selectedRegionId);
  const activePageId = useUiStore((s) => s.activePageId);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const editorMode = useUiStore((s) => s.editorMode);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
  const deleteRegion = useDocumentStore((s) => s.deleteRegion);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'Escape') {
        selectRegion(null);
        if (editorMode === 'create') {
          setEditorMode('select');
        }
      } else if (e.key === 'n') {
        setEditorMode(editorMode === 'create' ? 'select' : 'create');
      } else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRegionId && activePageId) {
        e.preventDefault();
        deleteRegion(activePageId, selectedRegionId);
        selectRegion(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectRegion, editorMode, setEditorMode, selectedRegionId, activePageId, deleteRegion]);
}
