import { useCallback, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Typography, Button, Tooltip, ToggleButton, ToggleButtonGroup } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ViewSidebarOutlinedIcon from '@mui/icons-material/ViewSidebarOutlined';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditHistoryStore } from '../../stores/editHistoryStore';
import { ExportDialog } from '../export/ExportDialog';
import { DebouncedColorPicker } from '../common/DebouncedColorPicker';
import type { PreviewLayout, SliderOrientation } from '../../types/ui';

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
  const previewLayout = useUiStore((s) => s.previewLayout);
  const setPreviewLayout = useUiStore((s) => s.setPreviewLayout);
  const showValidationIcons = useUiStore((s) => s.showValidationIcons);
  const toggleValidationIcons = useUiStore((s) => s.toggleValidationIcons);
  const sliderOrientation = useUiStore((s) => s.sliderOrientation);
  const setSliderOrientation = useUiStore((s) => s.setSliderOrientation);
  const triggerFitToView = useUiStore((s) => s.triggerFitToView);
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

  const handleUndo = useCallback(() => {
    const snapshot = useEditHistoryStore.getState().undo();
    if (snapshot) restoreSnapshot(snapshot);
  }, [restoreSnapshot]);

  const handleRedo = useCallback(() => {
    const snapshot = useEditHistoryStore.getState().redo();
    if (snapshot) restoreSnapshot(snapshot);
  }, [restoreSnapshot]);

  const handlePreviewLayoutChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newLayout: PreviewLayout | null) => {
      if (newLayout) setPreviewLayout(newLayout);
    },
    [setPreviewLayout],
  );

  const handleSliderOrientationChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newOrientation: SliderOrientation | null) => {
      if (newOrientation) setSliderOrientation(newOrientation);
    },
    [setSliderOrientation],
  );

  const breadcrumb = activeDocument
    ? activePage
      ? `${activeDocument.name} — Page ${activePage.pageNumber} of ${activeDocument.pageCount}`
      : activeDocument.name
    : '';

  // Validation progress
  const total = activePage ? activePage.regions.length : 0;
  const validated = activePage ? activePage.regions.filter((r) => r.isValidated).length : 0;
  const hasUnvalidated = total > 0 && validated < total;

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
            disabled={!hasPrev}
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
            disabled={!hasNext}
            onClick={handleNextPage}
          >
            <ChevronRightIcon sx={{ fontSize: 18 }} />
          </IconButton>
        )}

        {/* Validation progress (both modes) */}
        {total > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
            <Box sx={{ width: 60, height: 4, bgcolor: 'grey.800', borderRadius: 2, overflow: 'hidden' }}>
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
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 10 }}>
              {validated}/{total}
            </Typography>
            {hasUnvalidated && viewMode === 'edit' && (
              <IconButton
                size="small"
                color="info"
                aria-label="jump to next unvalidated region"
                title="Next unvalidated region"
                onClick={() => {
                  if (!activePage) return;
                  const regions = activePage.regions;
                  const currentIdx = regions.findIndex((r) => r.id === selectedRegionId);
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
        )}

        <Box sx={{ flex: 1 }} />

        {/* ===== PREVIEW MODE CONTROLS ===== */}
        {viewMode === 'preview' && (
          <>
            {/* Preview layout toggle */}
            {activePage && (
              <ToggleButtonGroup
                value={previewLayout}
                exclusive
                onChange={handlePreviewLayoutChange}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <ToggleButton value="side-by-side" sx={{ px: 1, py: 0, textTransform: 'none', fontSize: 11, minHeight: 26 }}>
                  <ViewSidebarOutlinedIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Side by Side
                </ToggleButton>
                <ToggleButton value="slider" sx={{ px: 1, py: 0, textTransform: 'none', fontSize: 11, minHeight: 26 }}>
                  <CompareArrowsIcon sx={{ fontSize: 14, mr: 0.5 }} />
                  Slider
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            {/* Slider orientation toggle (only in slider mode) */}
            {activePage && previewLayout === 'slider' && (
              <ToggleButtonGroup
                value={sliderOrientation}
                exclusive
                onChange={handleSliderOrientationChange}
                size="small"
                sx={{ mr: 0.5 }}
              >
                <ToggleButton value="horizontal" sx={{ px: 0.75, py: 0, minHeight: 26 }} title="Horizontal slider">
                  <SwapHorizIcon sx={{ fontSize: 14 }} />
                </ToggleButton>
                <ToggleButton value="vertical" sx={{ px: 0.75, py: 0, minHeight: 26 }} title="Vertical slider">
                  <SwapVertIcon sx={{ fontSize: 14 }} />
                </ToggleButton>
              </ToggleButtonGroup>
            )}

            {/* Show/hide validation icons */}
            {activePage && previewLayout === 'side-by-side' && (
              <Tooltip title={showValidationIcons ? 'Hide validation icons' : 'Show validation icons'}>
                <IconButton
                  size="small"
                  color={showValidationIcons ? 'primary' : 'default'}
                  aria-label="toggle validation icons"
                  onClick={() => toggleValidationIcons()}
                  sx={{ mr: 0.5 }}
                >
                  <CheckCircleOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Edit button */}
            {editable && activePage && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<EditOutlinedIcon sx={{ fontSize: 14 }} />}
                onClick={() => setViewMode('edit')}
                sx={{ mr: 0.5, py: 0, fontSize: 11, minHeight: 26 }}
              >
                Edit
              </Button>
            )}
          </>
        )}

        {/* ===== EDIT MODE CONTROLS ===== */}
        {viewMode === 'edit' && (
          <>
            {activePage && editable && features.regionCreation && (
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

            {activePage && editable && features.regionCreation && editorMode === 'create' && (
              <div style={{ marginRight: 4, display: 'flex', alignItems: 'center', gap: 3 }}>
                <select
                  value={regionDefaults.fontFamily}
                  onChange={(e) => setRegionDefaults({ fontFamily: e.target.value })}
                  style={{
                    height: 22, fontSize: 10,
                    background: theme.palette.background.default, color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`, borderRadius: 2,
                    padding: '0 2px', cursor: 'pointer', outline: 'none', maxWidth: 72,
                  }}
                >
                  <option value="Inter">Inter</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times NR</option>
                  <option value="Courier New">Courier</option>
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
                <div style={{ width: 1, height: 16, background: theme.palette.divider }} />
                <div
                  onClick={() => setRegionDefaults({ borderVisible: !regionDefaults.borderVisible })}
                  style={{
                    width: 20, height: 20,
                    border: `2px solid ${regionDefaults.borderVisible ? (regionDefaults.borderColor ?? theme.palette.primary.main) : theme.palette.grey[600]}`,
                    borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, lineHeight: 1, cursor: 'pointer', userSelect: 'none',
                    opacity: regionDefaults.borderVisible ? 1 : 0.4,
                  }}
                  title={regionDefaults.borderVisible ? 'Hide border' : 'Show border'}
                >{regionDefaults.borderVisible ? '✓' : ''}</div>
                <DebouncedColorPicker value={regionDefaults.borderColor} onChange={(c) => setRegionDefaults({ borderColor: c })} style={{ width: 20, height: 20 }} />
                <div style={{ width: 1, height: 16, background: theme.palette.divider }} />
                <div
                  onClick={() => setRegionDefaults({ backgroundColor: regionDefaults.backgroundColor === 'transparent' ? '#333333' : 'transparent' })}
                  style={{
                    width: 20, height: 20, border: `2px solid ${theme.palette.text.secondary}`, borderRadius: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, lineHeight: 1,
                    cursor: 'pointer', userSelect: 'none',
                    backgroundColor: regionDefaults.backgroundColor && regionDefaults.backgroundColor !== 'transparent' ? regionDefaults.backgroundColor : 'transparent',
                  }}
                  title={regionDefaults.backgroundColor === 'transparent' ? 'Add background' : 'Clear background'}
                >{regionDefaults.backgroundColor && regionDefaults.backgroundColor !== 'transparent' ? '✓' : ''}</div>
                {regionDefaults.backgroundColor && regionDefaults.backgroundColor !== 'transparent' ? (
                  <DebouncedColorPicker value={regionDefaults.backgroundColor} onChange={(c) => setRegionDefaults({ backgroundColor: c })} style={{ width: 20, height: 20 }} />
                ) : (
                  <DebouncedColorPicker value="#000000" onChange={(c) => setRegionDefaults({ backgroundColor: c })} style={{ width: 20, height: 20, opacity: 0.4 }} />
                )}
                <div style={{ width: 1, height: 16, background: theme.palette.divider }} />
                <select
                  value={regionDefaults.textPosition}
                  onChange={(e) => setRegionDefaults({ textPosition: e.target.value as 'inside' | 'top' | 'bottom' | 'left' | 'right' })}
                  style={{
                    height: 22, fontSize: 10,
                    background: theme.palette.background.default, color: theme.palette.text.primary,
                    border: `1px solid ${theme.palette.divider}`, borderRadius: 2,
                    padding: '0 2px', cursor: 'pointer', outline: 'none', maxWidth: 60,
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

            {/* Back to preview button */}
            <Button
              variant="outlined"
              size="small"
              color="primary"
              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 14 }} />}
              onClick={() => setViewMode('preview')}
              sx={{ mr: 0.5, py: 0, fontSize: 11, minHeight: 26 }}
            >
              Preview
            </Button>
          </>
        )}

        {/* ===== SHARED CONTROLS ===== */}
        <Tooltip title="Fit to view">
          <IconButton
            size="small"
            color="inherit"
            aria-label="fit to view"
            onClick={() => triggerFitToView()}
            sx={{ mr: 0.5 }}
          >
            <FitScreenOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

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

        <IconButton
          size="small"
          onClick={() => useUiStore.getState().setHelpDialogOpen(true)}
          title="Keyboard shortcuts (?)"
          sx={{ ml: 0.5, p: 0.5 }}
        >
          <HelpOutlineIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />
    </>
  );
};
