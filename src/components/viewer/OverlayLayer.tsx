import { useCallback } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { TextRegion } from './TextRegion';
import type { TextRegion as TextRegionType } from '../../types/document';

interface OverlayLayerProps {
  regions: TextRegionType[];
  width: number;
  height: number;
}

export const OverlayLayer: React.FC<OverlayLayerProps> = ({ regions, width, height }) => {
  const selectedRegionId = useUiStore((s) => s.selectedRegionId);
  const hoveredRegionId = useUiStore((s) => s.hoveredRegionId);
  const selectRegion = useUiStore((s) => s.selectRegion);
  const hoverRegion = useUiStore((s) => s.hoverRegion);

  const handleSelect = useCallback(
    (id: string) => {
      selectRegion(id);
    },
    [selectRegion],
  );

  const handleHover = useCallback(
    (id: string | null) => {
      hoverRegion(id);
    },
    [hoverRegion],
  );

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'auto',
      }}
    >
      {regions.map((region) => (
        <TextRegion
          key={region.id}
          region={region}
          isSelected={region.id === selectedRegionId}
          isHovered={region.id === hoveredRegionId}
          onSelect={handleSelect}
          onHover={handleHover}
        />
      ))}
    </svg>
  );
};
