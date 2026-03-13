import { useCallback, useEffect, useRef } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';
import { ReactCompareSlider, ReactCompareSliderImage, ReactCompareSliderHandle } from 'react-compare-slider';
import { useUiStore } from '../../stores/uiStore';
import { useDocumentStore } from '../../stores/documentStore';
import { AfterImage } from './AfterImage';
import { useAutoBackgroundColors } from '../../hooks/useAutoBackgroundColors';

interface SliderHandleProps {
  portrait?: boolean;
}

const SliderHandle: React.FC<SliderHandleProps> = ({ portrait }) => (
  <Tooltip title="Slide to compare" placement={portrait ? 'right' : 'top'} arrow>
    <div style={{ display: 'flex', height: '100%' }}>
      <ReactCompareSliderHandle portrait={portrait} />
    </div>
  </Tooltip>
);

export const ComparisonSlider: React.FC = () => {
  const activePageId = useUiStore((s) => s.activePageId);
  const sliderOrientation = useUiStore((s) => s.sliderOrientation);
  const fitToViewTrigger = useUiStore((s) => s.fitToViewTrigger);
  const activePage = useDocumentStore((s) => s.getActivePage(activePageId));
  const autoBackgroundColors = useAutoBackgroundColors(activePage);
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

  const fitToView = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      if (!activePage) return;
      const wrapper = ref.instance.wrapperComponent;
      if (!wrapper) return;
      const fitScale = Math.min(
        wrapper.clientWidth / activePage.width,
        wrapper.clientHeight / activePage.height,
      ) * 0.95;
      requestAnimationFrame(() => {
        ref.centerView(fitScale, 0);
      });
    },
    [activePage],
  );

  const handleInit = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      transformRef.current = ref;
      fitToView(ref);
    },
    [fitToView],
  );

  // Fit to view when triggered from toolbar
  useEffect(() => {
    if (!transformRef.current || fitToViewTrigger === 0) return;
    fitToView(transformRef.current);
  }, [fitToViewTrigger, fitToView]);

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
      <div key={`${activePageId}-${sliderOrientation}`} style={{ width: '100%', height: '100%' }}>
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
                handle={<SliderHandle portrait={sliderOrientation === 'vertical'} />}
                portrait={sliderOrientation === 'vertical'}
                position={100}
                style={{ width: activePage.width, height: activePage.height }}
              />
            </TransformComponent>
          </TransformWrapper>
      </div>
    </Box>
  );
};
