import { useCallback, useEffect, useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { AfterImage } from './AfterImage';
import { ValidationOverlay } from './ValidationOverlay';
import { PageImage } from '../viewer/PageImage';
import { useAutoBackgroundColors } from '../../hooks/useAutoBackgroundColors';

export const PreviewSideBySide: React.FC = () => {
  const activePageId = useUiStore((s) => s.activePageId);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const fitToViewTrigger = useUiStore((s) => s.fitToViewTrigger);
  const showValidationIcons = useUiStore((s) => s.showValidationIcons);
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));
  const autoBackgroundColors = useAutoBackgroundColors(activePage);

  const leftRef = useRef<ReactZoomPanPinchRef | null>(null);
  const rightRef = useRef<ReactZoomPanPinchRef | null>(null);

  const pageWidth = activePage?.width;
  const pageHeight = activePage?.height;

  const fitToView = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      if (!pageWidth || !pageHeight) return;
      const wrapper = ref.instance.wrapperComponent;
      if (!wrapper) return;
      const fitScale = Math.min(
        wrapper.clientWidth / pageWidth,
        wrapper.clientHeight / pageHeight,
      ) * 0.95;
      requestAnimationFrame(() => {
        ref.centerView(fitScale, 0);
      });
    },
    [pageWidth, pageHeight],
  );

  const handleLeftInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      leftRef.current = ref;
      fitToView(ref);
    },
    [fitToView],
  );

  const handleRightInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      rightRef.current = ref;
      fitToView(ref);
    },
    [fitToView],
  );

  // Re-fit when sidebar toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (leftRef.current) fitToView(leftRef.current);
      if (rightRef.current) fitToView(rightRef.current);
    }, 250);
    return () => clearTimeout(timer);
  }, [sidebarOpen, fitToView]);

  // Fit to view when triggered from toolbar
  useEffect(() => {
    if (fitToViewTrigger === 0) return;
    if (leftRef.current) fitToView(leftRef.current);
    if (rightRef.current) fitToView(rightRef.current);
  }, [fitToViewTrigger, fitToView]);

  if (!activePage) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>Select a document</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Original image (left) */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', bgcolor: 'background.default', borderRight: 1, borderColor: 'divider' }}>
        <Typography
          variant="caption"
          sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10, color: 'text.secondary', bgcolor: 'background.paper', px: 0.75, py: 0.25, borderRadius: 1, fontSize: 10 }}
        >
          Original
        </Typography>
        <div key={`orig-${activePageId}`} style={{ width: '100%', height: '100%' }}>
          <TransformWrapper
            initialScale={0.5}
            minScale={0.1}
            maxScale={4}
            limitToBounds
            centerOnInit
            centerZoomedOut
            onInit={handleLeftInit}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ position: 'relative' }}>
              <PageImage src={activePage.originalImageSrc} width={activePage.width} height={activePage.height} />
            </TransformComponent>
          </TransformWrapper>
        </div>
      </Box>

      {/* Restored image (right) */}
      <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', bgcolor: 'background.default' }}>
        <Typography
          variant="caption"
          sx={{ position: 'absolute', top: 8, left: 8, zIndex: 10, color: 'text.secondary', bgcolor: 'background.paper', px: 0.75, py: 0.25, borderRadius: 1, fontSize: 10 }}
        >
          Restored
        </Typography>
        <div key={`restored-${activePageId}`} style={{ width: '100%', height: '100%' }}>
          <TransformWrapper
            initialScale={0.5}
            minScale={0.1}
            maxScale={4}
            limitToBounds
            centerOnInit
            centerZoomedOut
            onInit={handleRightInit}
          >
            <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ position: 'relative' }}>
              <AfterImage page={activePage} autoBackgroundColors={autoBackgroundColors} />
              {showValidationIcons && activePageId && (
                <ValidationOverlay page={activePage} pageId={activePageId} />
              )}
            </TransformComponent>
          </TransformWrapper>
        </div>
      </Box>
    </Box>
  );
};
