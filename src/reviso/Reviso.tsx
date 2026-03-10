import { useEffect, useMemo, useRef } from 'react';
import { Box } from '@mui/material';
import { ThemeProvider, createTheme, useTheme } from '@mui/material/styles';
import { InlineToolbar } from './components/layout/InlineToolbar';
import { PageThumbnails } from './components/layout/PageThumbnails';
import { DocumentViewer } from './components/viewer/DocumentViewer';
import { ComparisonSlider } from './components/comparison/ComparisonSlider';
import { KeyboardHelpDialog } from './components/common/KeyboardHelpDialog';
import { useDocumentStore } from './stores/documentStore';
import { useUiStore } from './stores/uiStore';
import { useEditHistoryStore } from './stores/editHistoryStore';
import { useNavigationKeyboard } from './hooks/useNavigationKeyboard';
import { toInternalDocument, toPublicPage } from './utils/typeMappers';
import type { RevisoProps } from './types/public';

export const Reviso: React.FC<RevisoProps> = ({
  document: revisoDocument,
  editable = true,
  showSidebar = true,
  showToolbar = true,
  features,
  defaultRegionStyles,
  theme: themeOverrides,
  initialPageId,
  onChange,
  onPageChange,
  onSelectionChange,
  onExport,
}) => {
  const hostTheme = useTheme();
  const mergedTheme = useMemo(
    () => (themeOverrides ? createTheme(hostTheme, themeOverrides) : hostTheme),
    [hostTheme, themeOverrides],
  );
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);
  const setActiveDocument = useUiStore((s) => s.setActiveDocument);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const viewMode = useUiStore((s) => s.viewMode);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
  const setEditable = useUiStore((s) => s.setEditable);
  const setFeatures = useUiStore((s) => s.setFeatures);
  const setRegionDefaults = useUiStore((s) => s.setRegionDefaults);
  const setOnExportCallback = useUiStore((s) => s.setOnExportCallback);

  useNavigationKeyboard();

  // Track original region counts per page for dirty detection (deletions)
  const originalRegionCountsRef = useRef<Map<string, number>>(new Map());

  // Load document into store on mount / when document prop changes
  const prevDocIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (revisoDocument.id === prevDocIdRef.current) return;
    prevDocIdRef.current = revisoDocument.id;

    const internalDoc = toInternalDocument(revisoDocument);
    loadDocuments([internalDoc]);
    setActiveDocument(internalDoc.id);

    // Snapshot original region counts for dirty detection
    const counts = new Map<string, number>();
    for (const page of internalDoc.pages) {
      counts.set(page.id, page.regions.length);
    }
    originalRegionCountsRef.current = counts;

    const targetPageId = initialPageId ?? internalDoc.pages[0]?.id;
    if (targetPageId) setActivePage(targetPageId);

    useEditHistoryStore.getState().clear();
  }, [revisoDocument, initialPageId, loadDocuments, setActiveDocument, setActivePage]);

  // Sync editable prop to store
  useEffect(() => {
    setEditable(editable);
    if (!editable) setEditorMode('select');
  }, [editable, setEditable, setEditorMode]);

  // Sync features prop to store
  useEffect(() => {
    if (features) setFeatures(features);
  }, [features, setFeatures]);

  // Sync defaultRegionStyles to store on mount
  const defaultsApplied = useRef(false);
  useEffect(() => {
    if (defaultRegionStyles && !defaultsApplied.current) {
      defaultsApplied.current = true;
      setRegionDefaults(defaultRegionStyles);
    }
  }, [defaultRegionStyles, setRegionDefaults]);

  // Sync onExport callback to store
  useEffect(() => {
    setOnExportCallback(onExport ?? null);
    return () => setOnExportCallback(null);
  }, [onExport, setOnExportCallback]);

  // Wire onChange callback to store — emit only dirty pages
  useEffect(() => {
    if (!onChange) return;
    return useDocumentStore.subscribe((state) => {
      const doc = state.documents[0];
      if (!doc) return;
      const originalCounts = originalRegionCountsRef.current;
      const dirtyPages = doc.pages.filter((page) => {
        // Page is dirty if region count changed (addition/deletion)
        if (page.regions.length !== (originalCounts.get(page.id) ?? 0)) return true;
        // Or if any region was edited or newly created
        return page.regions.some((r) => r.isEdited || r.isNew);
      });
      if (dirtyPages.length > 0) {
        onChange(dirtyPages.map(toPublicPage));
        // Reset dirty flags and update region counts so the same changes aren't re-emitted
        const dirtyPageIds = dirtyPages.map((p) => p.id);
        useDocumentStore.getState().clearDirtyFlags(dirtyPageIds);
        for (const page of dirtyPages) {
          originalCounts.set(page.id, page.regions.length);
        }
      }
    });
  }, [onChange]);

  // Wire onPageChange + onSelectionChange via single uiStore subscription
  useEffect(() => {
    if (!onPageChange && !onSelectionChange) return;
    let prevPageId = useUiStore.getState().activePageId;
    let prevRegionId = useUiStore.getState().selectedRegionId;
    return useUiStore.subscribe((state) => {
      if (onPageChange && state.activePageId !== prevPageId) {
        prevPageId = state.activePageId;
        if (state.activePageId) onPageChange(state.activePageId);
      }
      if (onSelectionChange && state.selectedRegionId !== prevRegionId) {
        prevRegionId = state.selectedRegionId;
        onSelectionChange(state.selectedRegionId);
      }
    });
  }, [onPageChange, onSelectionChange]);

  const showComparison = features?.comparison !== false;
  const showViewer = viewMode === 'edit' || !showComparison;

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        bgcolor: 'background.default',
        overflow: 'hidden',
      }}
    >
      {showToolbar && <InlineToolbar />}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {showSidebar && sidebarOpen && (
          <Box
            sx={{
              width: 280,
              minWidth: 280,
              bgcolor: 'background.paper',
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}
          >
            <PageThumbnails />
          </Box>
        )}
        {showViewer ? <DocumentViewer /> : <ComparisonSlider />}
      </Box>
      <KeyboardHelpDialog />
    </Box>
  );

  if (themeOverrides) {
    return <ThemeProvider theme={mergedTheme}>{content}</ThemeProvider>;
  }

  return content;
};
