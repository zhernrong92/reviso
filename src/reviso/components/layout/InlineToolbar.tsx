import { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Typography, Button, ToggleButton, ToggleButtonGroup } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditHistoryStore } from '../../stores/editHistoryStore';
import { ExportDialog } from '../export/ExportDialog';
import { DebouncedColorPicker } from '../common/DebouncedColorPicker';
import type { ViewMode } from '../../types/ui';

export const InlineToolbar: React.FC = () => {
  const theme = useTheme();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const activeDocumentId = useUiStore((s) => s.activeDocumentId);
  const activePageId = useUiStore((s) => s.activePageId);
  const setActivePage = useUiStore((s) => s.setActivePage);
  const editorMode = useUiStore((s) => s.editorMode);
  const setEditorMode = useUiStore((s) => s.setEditorMode);
  const viewMode = useUiStore((s) => s.viewMode);
  const setViewMode = useUiStore((s) => s.setViewMode);
  const selectedRegionId = useUiStore((s) => s.selectedRegionId);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const regionDefaults = useUiStore((s) => s.regionDefaults);
  const setRegionDefaults = useUiStore((s) => s.setRegionDefaults);
  const editable = useUiStore((s) => s.editable);
  const showRegionText = useUiStore((s) => s.showRegionText);
  const toggleRegionText = useUiStore((s) => s.toggleRegionText);
  const features = useUiStore((s) => s.features);
  const activeDocument = useDocumentStore((s) => s.getActiveDocument(activeDocumentId));
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));
  const restoreSnapshot = useDocumentStore((s) => s.restoreSnapshot);

  const past = useEditHistoryStore((s) => s.past);
  const future = useEditHistoryStore((s) => s.future);
  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  const [exportDialogOpen, setExportDialogOpen] = useState(false);

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

  const breadcrumb = activeDocument
    ? activePage
      ? `${activeDocument.name} — Page ${activePage.pageNumber} of ${activeDocument.pageCount}`
      : activeDocument.name
    : '';

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: 40,
          minHeight: 40,
          px: 1,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <IconButton
          size="small"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={() => toggleSidebar()}
          sx={{ mr: 0.5 }}
        >
          <MenuIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {activePage && (
          <IconButton
            size="small"
            color="inherit"
            aria-label="previous page"
            disabled={!hasPrev || viewMode === 'compare'}
            onClick={handlePrevPage}
          >
            <ChevronLeftIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        <Typography
          variant="caption"
          sx={{ color: 'text.secondary', mx: 0.5, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        {activePage && activePage.regions.length > 0 && (() => {
          const total = activePage.regions.length;
          const validated = activePage.regions.filter((r) => r.isValidated).length;
          const hasUnvalidated = validated < total;
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
              <Box
                sx={{
                  width: 60,
                  height: 4,
                  bgcolor: 'grey.800',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    width: `${(validated / total) * 100}%`,
                    height: '100%',
                    bgcolor: validated === total ? 'success.main' : 'info.main',
                    borderRadius: 2,
                    transition: 'width 0.2s ease',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary', fontSize: 10 }}
              >
                {validated}/{total}
              </Typography>
              {hasUnvalidated && (
                <IconButton
                  size="small"
                  color="info"
                  aria-label="jump to next unvalidated region"
                  title="Next unvalidated region"
                  onClick={() => {
                    const regions = activePage!.regions;
                    const currentIdx = regions.findIndex((r) => r.id === selectedRegionId);
                    // Search forward from current position, wrapping around
                    for (let i = 1; i <= regions.length; i++) {
                      const idx = (currentIdx + i) % regions.length;
                      const r = regions[idx];
                      if (r && !r.isValidated) {
                        selectRegion(r.id);
                        return;
                      }
                    }
                  }}
                  sx={{ p: 0.25 }}
                >
                  <ChevronRightIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          );
        })()}

        <Box sx={{ flex: 1 }} />

        {activePage && viewMode === 'edit' && editable && features.regionCreation && (
          <Button
            variant={editorMode === 'create' ? 'contained' : 'outlined'}
            size="small"
            startIcon={<AddBoxOutlinedIcon sx={{ fontSize: 14 }} />}
            onClick={handleToggleCreateMode}
            sx={{ mr: 0.5, py: 0, fontSize: 11, minHeight: 26 }}
          >
            New Region
          </Button>
        )}

        {activePage && viewMode === 'edit' && editable && features.regionCreation && editorMode === 'create' && (
          <div
            style={{
              marginRight: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <select
              value={regionDefaults.fontFamily}
              onChange={(e) => setRegionDefaults({ fontFamily: e.target.value })}
              style={{
                height: 22,
                fontSize: 10,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                padding: '0 2px',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: 80,
              }}
            >
              <option value="Inter">Inter</option>
              <option value="Roboto">Roboto</option>
              <option value="Arial">Arial</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
            </select>
            <div
              onClick={() => setRegionDefaults({ fontWeight: regionDefaults.fontWeight === 'bold' ? 'normal' : 'bold' })}
              style={{
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, borderRadius: 2, cursor: 'pointer', userSelect: 'none',
                background: regionDefaults.fontWeight === 'bold' ? theme.palette.primary.main : 'transparent',
                color: regionDefaults.fontWeight === 'bold' ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              }}
              title="Bold"
            >B</div>
            <div
              onClick={() => setRegionDefaults({ fontStyle: regionDefaults.fontStyle === 'italic' ? 'normal' : 'italic' })}
              style={{
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontStyle: 'italic', borderRadius: 2, cursor: 'pointer', userSelect: 'none',
                background: regionDefaults.fontStyle === 'italic' ? theme.palette.primary.main : 'transparent',
                color: regionDefaults.fontStyle === 'italic' ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              }}
              title="Italic"
            >I</div>
            <div
              onClick={() => setRegionDefaults({ textDecoration: regionDefaults.textDecoration === 'line-through' ? 'none' : 'line-through' })}
              style={{
                width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, textDecoration: 'line-through', borderRadius: 2, cursor: 'pointer', userSelect: 'none',
                background: regionDefaults.textDecoration === 'line-through' ? theme.palette.primary.main : 'transparent',
                color: regionDefaults.textDecoration === 'line-through' ? theme.palette.primary.contrastText : theme.palette.text.secondary,
              }}
              title="Strikethrough"
            >S</div>
            <DebouncedColorPicker value={regionDefaults.fontColor} onChange={(c) => setRegionDefaults({ fontColor: c })} style={{ width: 20, height: 20 }} />

            <div style={{ width: 1, height: 16, background: theme.palette.divider, margin: '0 2px' }} />

            <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>Border</span>
            <DebouncedColorPicker value={regionDefaults.borderColor} onChange={(c) => setRegionDefaults({ borderColor: c })} style={{ width: 20, height: 20 }} />
            <div
              onClick={() => setRegionDefaults({ borderVisible: !regionDefaults.borderVisible })}
              style={{
                width: 14, height: 14, border: `2px solid ${theme.palette.text.secondary}`, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, lineHeight: 1,
                cursor: 'pointer', userSelect: 'none',
              }}
              title={regionDefaults.borderVisible ? 'Hide border' : 'Show border'}
            >{regionDefaults.borderVisible ? '✓' : ''}</div>

            <div style={{ width: 1, height: 16, background: theme.palette.divider, margin: '0 2px' }} />

            <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>BG</span>
            {regionDefaults.backgroundColor && regionDefaults.backgroundColor !== 'transparent' ? (
              <DebouncedColorPicker value={regionDefaults.backgroundColor} onChange={(c) => setRegionDefaults({ backgroundColor: c })} style={{ width: 20, height: 20 }} />
            ) : (
              <DebouncedColorPicker value="#000000" onChange={(c) => setRegionDefaults({ backgroundColor: c })} style={{ width: 20, height: 20, opacity: 0.4 }} />
            )}
            <div
              onClick={() => setRegionDefaults({ backgroundColor: regionDefaults.backgroundColor === 'transparent' ? '#333333' : 'transparent' })}
              style={{
                width: 14, height: 14, border: `2px solid ${theme.palette.text.secondary}`, borderRadius: 2,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, lineHeight: 1,
                cursor: 'pointer', userSelect: 'none',
                backgroundColor: regionDefaults.backgroundColor && regionDefaults.backgroundColor !== 'transparent' ? regionDefaults.backgroundColor : 'transparent',
              }}
              title={regionDefaults.backgroundColor === 'transparent' ? 'Add background' : 'Clear background'}
            >{regionDefaults.backgroundColor && regionDefaults.backgroundColor !== 'transparent' ? '✓' : ''}</div>

            <div style={{ width: 1, height: 16, background: theme.palette.divider, margin: '0 2px' }} />

            <span style={{ fontSize: 10, color: theme.palette.text.secondary }}>Text</span>
            <select
              value={regionDefaults.textPosition}
              onChange={(e) => setRegionDefaults({ textPosition: e.target.value as 'inside' | 'top' | 'bottom' | 'left' | 'right' })}
              style={{
                height: 22,
                fontSize: 10,
                background: theme.palette.background.default,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                padding: '0 2px',
                cursor: 'pointer',
                outline: 'none',
                maxWidth: 64,
              }}
            >
              <option value="inside">Inside</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        )}

        {editable && (
          <>
            <IconButton size="small" color="inherit" aria-label="undo" disabled={!canUndo} onClick={handleUndo}>
              <UndoIcon sx={{ fontSize: 16 }} />
            </IconButton>
            <IconButton size="small" color="inherit" aria-label="redo" disabled={!canRedo} onClick={handleRedo} sx={{ mr: 0.5 }}>
              <RedoIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </>
        )}

        {activePage && (
          <IconButton
            size="small"
            color={showRegionText ? 'primary' : 'default'}
            aria-label="toggle region text"
            onClick={() => toggleRegionText()}
            title={showRegionText ? 'Hide region text' : 'Show region text'}
            sx={{ mr: 0.5 }}
          >
            <TextFieldsIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )}

        {activePage && features.comparison && (
          <ToggleButtonGroup value={viewMode} exclusive onChange={handleViewModeChange} size="small" sx={{ mr: 0.5 }}>
            <ToggleButton value="edit" sx={{ px: 1, py: 0, textTransform: 'none', fontSize: 11, minHeight: 26 }}>
              <EditOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
              Edit
            </ToggleButton>
            <ToggleButton value="compare" sx={{ px: 1, py: 0, textTransform: 'none', fontSize: 11, minHeight: 26 }}>
              <CompareArrowsIcon sx={{ fontSize: 14, mr: 0.5 }} />
              Compare
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        {features.export && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileDownloadOutlinedIcon sx={{ fontSize: 14 }} />}
            disabled={!activePage}
            onClick={() => setExportDialogOpen(true)}
            sx={{ py: 0, fontSize: 11, minHeight: 26 }}
          >
            Export
          </Button>
        )}
      </Box>

      <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />
    </>
  );
};
