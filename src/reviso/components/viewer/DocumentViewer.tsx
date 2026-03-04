import { useCallback, useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { motion, AnimatePresence } from 'framer-motion';
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
  const editable = useUiStore((s) => s.editable);
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));

  useEditorKeyboard();

  const selectedRegion = activePage?.regions.find((r) => r.id === selectedRegionId);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);
  const [minScale, setMinScale] = useState(0.1);

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
        ref.centerView(fitScale);
      });
    },
    [pageWidth, pageHeight],
  );

  const handleInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      transformRef.current = ref;
      fitToView(ref);
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
      <AnimatePresence mode="wait">
        <motion.div
          key={activePageId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          style={{ width: '100%', height: '100%' }}
        >
          <TransformWrapper
            initialScale={minScale}
            minScale={minScale}
            maxScale={4}
            limitToBounds
            centerOnInit
            centerZoomedOut
            onInit={handleInit}
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
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};
