import { useCallback, useRef, useState } from 'react';
import { AppBar, Toolbar, IconButton, Typography, Button, Box, Checkbox, ToggleButton, ToggleButtonGroup, Snackbar, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditHistoryStore } from '../../stores/editHistoryStore';
import { ExportDialog } from '../export/ExportDialog';
import { parseUploadedJson } from '../../utils/parseUploadedJson';
import { parsePdf } from '../../utils/parsePdf';
import { DebouncedColorPicker } from '../common/DebouncedColorPicker';
import type { ViewMode } from '../../types/ui';

export const TopBar: React.FC = () => {
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activePageId = useUiStore((s) => s.activePageId);
  const setActiveDocument = useUiStore((s) => s.setActiveDocument);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const editorMode = useUiStore((s) => s.editorMode);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const regionDefaults = useUiStore((s) => s.regionDefaults);
  const setRegionDefaults = useUiStore((s) => s.setRegionDefaults);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));
  const loadDocuments = useDocumentStore((s) => s.loadDocuments);
  const restoreSnapshot = useDocumentStore((s) => s.restoreSnapshot);

  const past = useEditHistoryStore((s) => s.past);
  const future = useEditHistoryStore((s) => s.future);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = useCallback(() => {
    toggleSidebar();
  }, [toggleSidebar]);

  const handleToggleCreateMode = useCallback(() => {
    setEditorMode(editorMode === 'create' ? 'select' : 'create');
  }, [editorMode, setEditorMode]);

  const currentPageIndex = activeDocument && activePage
    ? activeDocument.pages.findIndex((p) => p.id === activePage.id)
    : -1;

  const hasPrev = currentPageIndex > 0;
  const hasNext = activeDocument ? currentPageIndex < activeDocument.pages.length - 1 : false;

  const handlePrevPage = useCallback(() => {
    if (activeDocument && currentPageIndex > 0) {
      const prevPage = activeDocument.pages[currentPageIndex - 1];
      if (prevPage) setActivePage(prevPage.id);
    }
  }, [activeDocument, currentPageIndex, setActivePage]);

  const handleNextPage = useCallback(() => {
    if (activeDocument && currentPageIndex < activeDocument.pages.length - 1) {
      const nextPage = activeDocument.pages[currentPageIndex + 1];
      if (nextPage) setActivePage(nextPage.id);
    }
  }, [activeDocument, currentPageIndex, setActivePage]);

  const handleViewModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: ViewMode | null) => {
      if (!newMode) return;
      setViewMode(newMode);
      if (newMode === 'compare') {
        selectRegion(null);
        setEditorMode('select');
      }
    },
    [setViewMode, selectRegion, setEditorMode],
  );

  const handleUndo = useCallback(() => {
    const snapshot = useEditHistoryStore.getState().undo();
    if (snapshot) restoreSnapshot(snapshot);
  }, [restoreSnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = useEditHistoryStore.getState().redo();
    if (snapshot) restoreSnapshot(snapshot);
  }, [restoreSnapshot]);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const loadParsedDocs = useCallback(
    (docs: import('../../types/document').Document[]) => {
      loadDocuments(docs);
      useEditHistoryStore.getState().clear();
      const firstDoc = docs[0];
      if (firstDoc) {
        setActiveDocument(firstDoc.id);
        const firstPage = firstDoc.pages[0];
        if (firstPage) setActivePage(firstPage.id);
      }
    },
    [loadDocuments, setActiveDocument, setActivePage],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset input so same file can be re-selected
      e.target.value = '';

      if (file.name.toLowerCase().endsWith('.pdf')) {
        parsePdf(file)
          .then(loadParsedDocs)
          .catch((err: unknown) => {
            setUploadError(err instanceof Error ? err.message : 'Failed to parse PDF');
          });
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const docs = parseUploadedJson(reader.result as string);
          loadParsedDocs(docs);
        } catch (err) {
          setUploadError(err instanceof Error ? err.message : 'Failed to parse file');
        }
      };
      reader.onerror = () => setUploadError('Failed to read file');
      reader.readAsText(file);
    },
    [loadParsedDocs],
  );

  const breadcrumb = activeDocument
    ? activePage
      ? `${activeDocument.name} > Page ${activePage.pageNumber} of ${activeDocument.pageCount}`
      : activeDocument.name
    : 'No document selected';

  return (
    <AppBar
      position="static"
      elevation={0}
      sx={{
        bgcolor: 'background.paper',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 48, height: 48 }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={handleToggle}
          sx={{ mr: 1 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 700, color: 'primary.main', mr: 2 }}
        >
          Reviso
        </Typography>

        <IconButton
          size="small"
          color="inherit"
          aria-label="upload file"
          onClick={handleUploadClick}
          sx={{ mr: 1 }}
        >
          <UploadFileOutlinedIcon fontSize="small" />
        </IconButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,.pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {activePage && (
          <IconButton
            size="small"
            color="inherit"
            aria-label="previous page"
            disabled={!hasPrev || viewMode === 'compare'}
            onClick={handlePrevPage}
            sx={{ mr: 0.5 }}
          >
            <ChevronLeftIcon fontSize="small" />
          </IconButton>
        )}

        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', flex: 1 }}
        >
          {breadcrumb}
        </Typography>

        {activePage && (
          <IconButton
            size="small"
            color="inherit"
            aria-label="next page"
            disabled={!hasNext || viewMode === 'compare'}
            onClick={handleNextPage}
            sx={{ ml: 0.5 }}
          >
            <ChevronRightIcon fontSize="small" />
          </IconButton>
        )}

        {activePage && viewMode === 'edit' && (
          <Button
            variant={editorMode === 'create' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<AddBoxOutlinedIcon />}
            onClick={handleToggleCreateMode}
            sx={{ ml: 1 }}
          >
            New Region
          </Button>
        )}

        {activePage && viewMode === 'edit' && editorMode === 'create' && (
          <Box sx={{ ml: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Font
              </Typography>
              <DebouncedColorPicker
                value={regionDefaults.fontColor}
                onChange={(c) => setRegionDefaults({ fontColor: c })}
                style={{ width: 22, height: 22 }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Border
              </Typography>
              <DebouncedColorPicker
                value={regionDefaults.borderColor}
                onChange={(c) => setRegionDefaults({ borderColor: c })}
                style={{ width: 22, height: 22 }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                BG
              </Typography>
              {regionDefaults.backgroundColor === 'transparent' ? (
                <DebouncedColorPicker
                  value="#000000"
                  onChange={(c) => setRegionDefaults({ backgroundColor: c })}
                  style={{ width: 22, height: 22, opacity: 0.4 }}
                />
              ) : (
                <DebouncedColorPicker
                  value={regionDefaults.backgroundColor}
                  onChange={(c) => setRegionDefaults({ backgroundColor: c })}
                  style={{ width: 22, height: 22 }}
                />
              )}
              <Typography
                variant="caption"
                sx={{
                  color: regionDefaults.backgroundColor === 'transparent' ? 'text.disabled' : 'primary.main',
                  cursor: 'pointer',
                  userSelect: 'none',
                  fontSize: 10,
                }}
                onClick={() =>
                  setRegionDefaults({
                    backgroundColor:
                      regionDefaults.backgroundColor === 'transparent' ? '#333333' : 'transparent',
                  })
                }
              >
                {regionDefaults.backgroundColor === 'transparent' ? 'none' : 'clear'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Checkbox
                size="small"
                checked={regionDefaults.borderVisible}
                onChange={(e) => setRegionDefaults({ borderVisible: e.target.checked })}
                sx={{ p: 0.25 }}
              />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Visible
              </Typography>
            </Box>
          </Box>
        )}

        <IconButton
          size="small"
          color="inherit"
          aria-label="undo"
          disabled={!canUndo}
          onClick={handleUndo}
          sx={{ ml: 1 }}
        >
          <UndoIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          color="inherit"
          aria-label="redo"
          disabled={!canRedo}
          onClick={handleRedo}
          sx={{ ml: 0.5 }}
        >
          <RedoIcon fontSize="small" />
        </IconButton>

        {activePage && (
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{ ml: 1.5 }}
          >
            <ToggleButton value="edit" sx={{ px: 1.5, py: 0.25, textTransform: 'none' }}>
              <EditOutlinedIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Edit
            </ToggleButton>
            <ToggleButton value="compare" sx={{ px: 1.5, py: 0.25, textTransform: 'none' }}>
              <CompareArrowsIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Compare
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownloadOutlinedIcon />}
          disabled={!activePage}
          onClick={() => setExportDialogOpen(true)}
          sx={{ ml: 1 }}
        >
          Export
        </Button>
      </Toolbar>

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
      />

      <Snackbar
        open={uploadError !== null}
        autoHideDuration={5000}
        onClose={() => setUploadError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setUploadError(null)} variant="filled">
          {uploadError}
        </Alert>
      </Snackbar>
    </AppBar>
  );
};
