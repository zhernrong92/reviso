import { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { AfterImage } from './AfterImage';

export const ComparisonSlider: React.FC = () => {
  const activePageId = useUiStore((s) => s.activePageId);
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));

  const handleInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      if (!activePage) return;
      const wrapper = ref.instance.wrapperComponent;
      if (!wrapper) return;
      const wrapperWidth = wrapper.clientWidth;
      const wrapperHeight = wrapper.clientHeight;
      const fitScale = Math.min(
        wrapperWidth / activePage.width,
        wrapperHeight / activePage.height,
      ) * 0.95;
      requestAnimationFrame(() => {
        ref.centerView(fitScale);
      });
    },
    [activePage],
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
            initialScale={0.5}
            minScale={0.5}
            maxScale={4}
            limitToBounds
            centerOnInit
            centerZoomedOut
            onInit={handleInit}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%' }}
              contentStyle={{ position: 'relative' }}
            >
              <ReactCompareSlider
                itemOne={
                  <ReactCompareSliderImage
                    src={activePage.originalImageSrc}
                    alt={`Page ${activePage.pageNumber} original`}
                    style={{ width: activePage.width, height: activePage.height, display: 'block' }}
                  />
                }
                itemTwo={<AfterImage page={activePage} />}
                style={{ width: activePage.width, height: activePage.height }}
              />
            </TransformComponent>
          </TransformWrapper>
        </motion.div>
      </AnimatePresence>
    </Box>
  );
};
