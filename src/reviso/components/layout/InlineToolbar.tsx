import { useCallback, useState } from 'react';
import { Box, IconButton, Typography, Button, Tooltip, Divider, Select, MenuItem, ToggleButton, ToggleButtonGroup, Menu, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { SelectChangeEvent } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import AddBoxOutlinedIcon from '@mui/icons-material/AddBoxOutlined';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import SwapVertIcon from '@mui/icons-material/SwapVert';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { useEditHistoryStore } from '../../stores/editHistoryStore';
import { ExportDialog } from '../export/ExportDialog';
import { RegionDefaultsDialog } from '../editor/RegionDefaultsDialog';
import type { PreviewLayout, SliderOrientation, ComparisonSource } from '../../types/ui';

const ToolbarDivider = () => (
  <Divider orientation="vertical" flexItem sx={{ mx: 0.75, my: 0.75 }} />
);

const selectSx = {
  fontSize: 11,
  minHeight: 0,
  '& .MuiSelect-select': { py: 0.25, pr: '20px !important', pl: 0.5 },
  '& .MuiSvgIcon-root': { fontSize: 16 },
} as const;

export const InlineToolbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
  const sliderOrientation = useUiStore((s) => s.sliderOrientation);
  const setSliderOrientation = useUiStore((s) => s.setSliderOrientation);
  const comparisonSource = useUiStore((s) => s.comparisonSource);
  const setComparisonSource = useUiStore((s) => s.setComparisonSource);
  const triggerFitToView = useUiStore((s) => s.triggerFitToView);
  const selectedRegionId = useUiStore((s) => s.selectedRegionId);
  const selectRegion = useUiStore((s) => s.selectRegion);
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
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [overflowAnchor, setOverflowAnchor] = useState<null | HTMLElement>(null);
  const overflowOpen = Boolean(overflowAnchor);
  const handleOverflowOpen = (e: React.MouseEvent<HTMLElement>) => setOverflowAnchor(e.currentTarget);
  const handleOverflowClose = () => setOverflowAnchor(null);

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

  const handleSliderOrientationChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newOrientation: SliderOrientation | null) => {
      if (newOrientation) setSliderOrientation(newOrientation);
    },
    [setSliderOrientation],
  );

  const breadcrumb = activeDocument
    ? activePage
      ? isMobile
        ? `${activePage.pageNumber} / ${activeDocument.pageCount}`
        : `${activeDocument.name} — Page ${activePage.pageNumber} of ${activeDocument.pageCount}`
      : isMobile ? '' : activeDocument.name
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
        {/* ===== GROUP 1: Navigation ===== */}
        <IconButton
          size="small"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={() => toggleSidebar()}
        >
          <MenuIcon sx={{ fontSize: 18 }} />
        </IconButton>

        {activePage && (
          <>
            <ToolbarDivider />
            <IconButton
              size="small"
              color="inherit"
              aria-label="previous page"
              disabled={!hasPrev}
              onClick={handlePrevPage}
            >
              <ChevronLeftIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </>
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

        {/* ===== GROUP 2: Validation Progress ===== */}
        {total > 0 && (
          <>
            <ToolbarDivider />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Tooltip title={`${validated} of ${total} regions validated`}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'default' }}>
                  <CheckCircleOutlineIcon
                    sx={{
                      fontSize: 14,
                      color: validated === total ? 'success.main' : 'text.secondary',
                      transition: 'color 0.2s ease',
                    }}
                  />
                  <Box sx={{ width: isMobile ? 32 : 60, height: 4, bgcolor: 'grey.800', borderRadius: 2, overflow: 'hidden' }}>
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
                </Box>
              </Tooltip>
              {hasUnvalidated && (
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
                        setViewMode('edit');
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
          </>
        )}

        <Box sx={{ flex: 1 }} />

        {/* ===== GROUP 3: Preview Mode Controls (desktop only inline) ===== */}
        {!isMobile && viewMode === 'preview' && activePage && (
          <>
            {/* Compare mode select + slider orientation */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                Compare:
              </Typography>
              <Select
                value={previewLayout}
                onChange={(e: SelectChangeEvent) => setPreviewLayout(e.target.value as PreviewLayout)}
                variant="standard"
                size="small"
                disableUnderline
                sx={selectSx}
              >
                <MenuItem value="side-by-side" sx={{ fontSize: 12 }}>Side by Side</MenuItem>
                <MenuItem value="slider" sx={{ fontSize: 12 }}>Slider</MenuItem>
              </Select>
              {previewLayout === 'slider' && (
                <ToggleButtonGroup
                  value={sliderOrientation}
                  exclusive
                  onChange={handleSliderOrientationChange}
                  size="small"
                >
                  <ToggleButton value="horizontal" sx={{ px: 0.75, py: 0, minHeight: 26 }} title="Horizontal slider">
                    <SwapHorizIcon sx={{ fontSize: 14 }} />
                  </ToggleButton>
                  <ToggleButton value="vertical" sx={{ px: 0.75, py: 0, minHeight: 26 }} title="Vertical slider">
                    <SwapVertIcon sx={{ fontSize: 14 }} />
                  </ToggleButton>
                </ToggleButtonGroup>
              )}
            </Box>

            {/* Source mode select */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                Source:
              </Typography>
              <Select
                value={comparisonSource}
                onChange={(e: SelectChangeEvent) => setComparisonSource(e.target.value as ComparisonSource)}
                variant="standard"
                size="small"
                disableUnderline
                sx={selectSx}
              >
                <MenuItem value="restored" sx={{ fontSize: 12 }}>Overlay</MenuItem>
                <MenuItem value="text-only" sx={{ fontSize: 12 }}>Synthetic Reconstruct</MenuItem>
              </Select>
            </Box>

            <ToolbarDivider />

            {editable && (
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

        {/* ===== GROUP 3: Edit Mode Controls (desktop only inline) ===== */}
        {!isMobile && viewMode === 'edit' && (
          <>
            {activePage && editable && features.regionCreation && (
              <Button
                variant={editorMode === 'create' ? 'contained' : 'outlined'}
                size="small"
                startIcon={
                  editorMode === 'create'
                    ? <CloseIcon sx={{ fontSize: 14 }} />
                    : <AddBoxOutlinedIcon sx={{ fontSize: 14 }} />
                }
                onClick={handleToggleCreateMode}
                sx={{ mr: 0.5, py: 0, fontSize: 11, minHeight: 26 }}
              >
                {editorMode === 'create' ? 'Cancel' : 'New Region'}
              </Button>
            )}

            {editable && (
              <>
                <ToolbarDivider />
                <IconButton size="small" color="inherit" aria-label="undo" disabled={!canUndo} onClick={handleUndo}>
                  <UndoIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton size="small" color="inherit" aria-label="redo" disabled={!canRedo} onClick={handleRedo}>
                  <RedoIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </>
            )}

            {activePage && (
              <Tooltip title={showRegionText ? 'Hide region text' : 'Show region text'}>
                <IconButton
                  size="small"
                  color={showRegionText ? 'primary' : 'default'}
                  aria-label="toggle region text"
                  onClick={() => toggleRegionText()}
                >
                  <TextFieldsIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </Tooltip>
            )}

            <ToolbarDivider />

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

        {/* ===== Mobile: Edit / Preview toggle button (always visible) ===== */}
        {isMobile && activePage && editable && (
          <>
            <ToolbarDivider />
            {viewMode === 'preview' ? (
              <IconButton
                size="small"
                color="inherit"
                aria-label="edit"
                onClick={() => setViewMode('edit')}
              >
                <EditOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            ) : (
              <IconButton
                size="small"
                color="primary"
                aria-label="preview"
                onClick={() => setViewMode('preview')}
              >
                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </>
        )}

        {/* ===== GROUP 4: Shared Utilities ===== */}
        <ToolbarDivider />

        <Tooltip title="Fit to view">
          <IconButton
            size="small"
            color="inherit"
            aria-label="fit to view"
            onClick={() => triggerFitToView()}
          >
            <FitScreenOutlinedIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Tooltip>

        {!isMobile && features.export && (
          <Tooltip title="Export">
            <IconButton
              size="small"
              color="inherit"
              disabled={!activePage}
              aria-label="export"
              onClick={() => setExportDialogOpen(true)}
            >
              <FileDownloadOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {!isMobile && viewMode === 'edit' && editable && (
          <Tooltip title="Region default settings">
            <IconButton
              size="small"
              onClick={() => setSettingsDialogOpen(true)}
              sx={{ p: 0.5 }}
            >
              <SettingsOutlinedIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {!isMobile && (
          <Tooltip title="Keyboard shortcuts (?)">
            <IconButton
              size="small"
              onClick={() => useUiStore.getState().setHelpDialogOpen(true)}
              sx={{ p: 0.5 }}
            >
              <HelpOutlineIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
        )}

        {/* ===== Mobile: Overflow menu ===== */}
        {isMobile && (
          <>
            <IconButton
              size="small"
              color="inherit"
              aria-label="more options"
              onClick={handleOverflowOpen}
            >
              <MoreVertIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <Menu
              anchorEl={overflowAnchor}
              open={overflowOpen}
              onClose={handleOverflowClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              {/* Compare layout — preview mode only */}
              {viewMode === 'preview' && activePage && [
                <MenuItem key="side-by-side" selected={previewLayout === 'side-by-side'} onClick={() => { setPreviewLayout('side-by-side'); handleOverflowClose(); }}>
                  Side by Side
                </MenuItem>,
                <MenuItem key="slider" selected={previewLayout === 'slider'} onClick={() => { setPreviewLayout('slider'); handleOverflowClose(); }}>
                  Slider
                </MenuItem>,
                <Divider key="div-compare" />,
                <MenuItem key="overlay" selected={comparisonSource === 'restored'} onClick={() => { setComparisonSource('restored'); handleOverflowClose(); }}>
                  Source: Overlay
                </MenuItem>,
                <MenuItem key="text-only" selected={comparisonSource === 'text-only'} onClick={() => { setComparisonSource('text-only'); handleOverflowClose(); }}>
                  Source: Synthetic Reconstruct
                </MenuItem>,
                ...(previewLayout === 'slider' ? [
                  <Divider key="div-orient" />,
                  <MenuItem key="horiz" selected={sliderOrientation === 'horizontal'} onClick={() => { setSliderOrientation('horizontal'); handleOverflowClose(); }}>
                    Horizontal Slider
                  </MenuItem>,
                  <MenuItem key="vert" selected={sliderOrientation === 'vertical'} onClick={() => { setSliderOrientation('vertical'); handleOverflowClose(); }}>
                    Vertical Slider
                  </MenuItem>,
                ] : []),
                <Divider key="div-edit" />,
              ]}

              {/* New Region intentionally excluded from mobile menu — draw-to-create is mouse-only */}
              {viewMode === 'edit' && editable && [
                <MenuItem key="undo" disabled={!canUndo} onClick={() => { handleUndo(); handleOverflowClose(); }}>
                  Undo
                </MenuItem>,
                <MenuItem key="redo" disabled={!canRedo} onClick={() => { handleRedo(); handleOverflowClose(); }}>
                  Redo
                </MenuItem>,
              ]}
              {viewMode === 'edit' && activePage && (
                <MenuItem onClick={() => { toggleRegionText(); handleOverflowClose(); }}>
                  {showRegionText ? 'Hide Region Text' : 'Show Region Text'}
                </MenuItem>
              )}
              {viewMode === 'edit' && editable && (
                <MenuItem onClick={() => { setSettingsDialogOpen(true); handleOverflowClose(); }}>
                  Region Defaults
                </MenuItem>
              )}

              {/* Shared utilities */}
              {features.export && (
                <MenuItem disabled={!activePage} onClick={() => { setExportDialogOpen(true); handleOverflowClose(); }}>
                  Export
                </MenuItem>
              )}
            </Menu>
          </>
        )}
      </Box>

      <ExportDialog open={exportDialogOpen} onClose={() => setExportDialogOpen(false)} />
      <RegionDefaultsDialog open={settingsDialogOpen} onClose={() => setSettingsDialogOpen(false)} />
    </>
  );
};
