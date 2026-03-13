import { useCallback } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { AfterImage } from './AfterImage';
import { useAutoBackgroundColors } from '../../hooks/useAutoBackgroundColors';

const SliderHandle: React.FC = () => (
  <Tooltip title="Slide to compare" placement="top" arrow>
    <div style={{ display: 'flex', height: '100%' }}>
      <ReactCompareSliderHandle />
    </div>
  </Tooltip>
);

export const ComparisonSlider: React.FC = () => {
  const activePageId = useUiStore((s) => s.activePageId);
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));
  const autoBackgroundColors = useAutoBackgroundColors(activePage);

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
        ref.centerView(fitScale, 0);
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
      <div key={activePageId} style={{ width: '100%', height: '100%' }}>
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
                itemOne={<AfterImage page={activePage} autoBackgroundColors={autoBackgroundColors} />}
                itemTwo={
                  <ReactCompareSliderImage
                    src={activePage.originalImageSrc}
                    alt={`Page ${activePage.pageNumber} original`}
                    style={{ width: activePage.width, height: activePage.height, display: 'block' }}
                  />
                }
                handle={<SliderHandle />}
                position={100}
                style={{ width: activePage.width, height: activePage.height }}
              />
            </TransformComponent>
          </TransformWrapper>
      </div>
    </Box>
  );
};
