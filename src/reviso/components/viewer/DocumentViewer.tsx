import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { PageImage } from './PageImage';
import { OverlayLayer } from './OverlayLayer';
import { InlineEditor } from '../editor/InlineEditor';
import { RegionCreator } from '../editor/RegionCreator';
import { useEditorKeyboard } from '../../hooks/useEditorKeyboard';

export const DocumentViewer: React.FC = () => {
  const activePageId = useUiStore((s) => s.activePageId);
  const selectedRegionId = useUiStore((s) => s.selectedRegionId);
  const editorMode = useUiStore((s) => s.editorMode);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const fitToViewTrigger = useUiStore((s) => s.fitToViewTrigger);
  const editable = useUiStore((s) => s.editable);
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));

  useEditorKeyboard();

  const selectedRegion = activePage?.regions.find((r) => r.id === selectedRegionId);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [minScale, setMinScale] = useState(0.1);
  const [zoomScale, setZoomScale] = useState(1);

  const pageWidth = activePage?.width;
  const pageHeight = activePage?.height;

  const fitToView = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      if (!pageWidth || !pageHeight) return;
      const wrapper = ref.instance.wrapperComponent;
      if (!wrapper) return;
      const wrapperWidth = wrapper.clientWidth;
      const wrapperHeight = wrapper.clientHeight;
      const fitScale = Math.min(
        wrapperWidth / pageWidth,
        wrapperHeight / pageHeight,
      ) * 0.95;
      setMinScale(fitScale);
      requestAnimationFrame(() => {
        ref.centerView(fitScale, 0);
      });
    },
    [pageWidth, pageHeight],
  );

  const handleInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      transformRef.current = ref;
      fitToView(ref);
      setZoomScale(ref.state.scale);
    },
    [fitToView],
  );

  // Re-fit when sidebar toggles (container width changes)
  useEffect(() => {
    if (!transformRef.current) return;
    // Wait for the sidebar CSS transition to finish (200ms)
    const timer = setTimeout(() => {
      if (transformRef.current) fitToView(transformRef.current);
    }, 250);
    return () => clearTimeout(timer);
  }, [sidebarOpen, fitToView]);

  // Fit to view when triggered from toolbar
  useEffect(() => {
    if (!transformRef.current || fitToViewTrigger === 0) return;
    fitToView(transformRef.current);
  }, [fitToViewTrigger, fitToView]);

  // Pan view to center on the selected region when it changes
  useEffect(() => {
    if (!selectedRegion || !transformRef.current) return;
    const ref = transformRef.current;
    const wrapper = ref.instance.wrapperComponent;
    if (!wrapper) return;

    const scale = ref.state.scale;
    const wrapperWidth = wrapper.clientWidth;
    const wrapperHeight = wrapper.clientHeight;

    // Region center in content coordinates
    const regionCenterX = (selectedRegion.x1 + selectedRegion.x2) / 2;
    const regionCenterY = (selectedRegion.y1 + selectedRegion.y2) / 2;

    // Target position: place region center at wrapper center
    const targetX = wrapperWidth / 2 - regionCenterX * scale;
    const targetY = wrapperHeight / 2 - regionCenterY * scale;

    ref.setTransform(targetX, targetY, scale, 300, 'easeOut');
  }, [selectedRegionId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdvance = useCallback(
    (direction: 'next' | 'prev') => {
      if (!activePage || !selectedRegionId) return;
      const regions = activePage.regions;
      const currentIndex = regions.findIndex((r) => r.id === selectedRegionId);
      if (currentIndex === -1) return;

      const delta = direction === 'next' ? 1 : -1;
      const nextIndex = (currentIndex + delta + regions.length) % regions.length;
      const nextRegion = regions[nextIndex];
      if (nextRegion) {
        selectRegion(nextRegion.id);
      }
    },
    [activePage, selectedRegionId, selectRegion],
  );

  if (!activePage) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Select a document
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'hidden',
        position: 'relative',
        bgcolor: 'background.default',
      }}
      onClick={() => selectRegion(null)}
    >
      <div key={activePageId} style={{ width: '100%', height: '100%' }}>
          <TransformWrapper
            initialScale={minScale}
            minScale={minScale}
            maxScale={4}
            limitToBounds
            centerOnInit
            centerZoomedOut
            onInit={handleInit}
            onTransformed={(_ref, state) => setZoomScale(state.scale)}
            panning={{
              excluded: ['inline-editor', 'region-creator'],
              disabled: editorMode === 'create',
            }}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ position: 'relative' }}
            >
              <PageImage
                src={activePage.imageSrc}
                width={activePage.width}
                height={activePage.height}
              />
              <OverlayLayer
                regions={activePage.regions}
                width={activePage.width}
                height={activePage.height}
                pageId={activePageId!}
              />
              {editable && selectedRegion && activePageId && (
                <InlineEditor
                  key={selectedRegion.id}
                  region={selectedRegion}
                  pageId={activePageId}
                  imageWidth={activePage.width}
                  imageHeight={activePage.height}
                  onAdvance={handleAdvance}
                  zoomScale={zoomScale}
                />
              )}
              {editable && editorMode === 'create' && activePageId && (
                <RegionCreator
                  width={activePage.width}
                  height={activePage.height}
                  pageId={activePageId}
                />
              )}
            </TransformComponent>
          </TransformWrapper>
      </div>
    </Box>
  );
};
