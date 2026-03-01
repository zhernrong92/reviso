import React, { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import type { TextRegion as TextRegionType } from '../../types/document';

interface TextRegionProps {
  region: TextRegionType;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const TextRegion = React.memo<TextRegionProps>(
  ({ region, isSelected, isHovered, onSelect, onHover }) => {
    const theme = useTheme();

    const getStyle = () => {
      if (isSelected) {
        return {
          fill: theme.palette.primary.main,
          fillOpacity: 0.15,
          stroke: theme.palette.primary.main,
          strokeOpacity: 1.0,
          strokeWidth: 2,
        };
      }
      if (isHovered) {
        return {
          fill: theme.palette.primary.main,
          fillOpacity: 0.1,
          stroke: theme.palette.primary.main,
          strokeOpacity: 0.6,
          strokeWidth: 1.5,
        };
      }
      if (region.isEdited) {
        const hasBg = region.backgroundColor && region.backgroundColor !== 'transparent';
        return {
          fill: hasBg ? region.backgroundColor : 'transparent',
          fillOpacity: hasBg ? 1 : 0,
          stroke: theme.palette.primary.light,
          strokeOpacity: 0.6,
          strokeWidth: 1,
        };
      }
      {
        const hasBg = region.backgroundColor && region.backgroundColor !== 'transparent';
        return {
          fill: hasBg ? region.backgroundColor : 'transparent',
          fillOpacity: hasBg ? 1 : 0,
          stroke: theme.palette.primary.main,
          strokeOpacity: 0.3,
          strokeWidth: 1,
        };
      }
    };

    const baseStyle = getStyle();
    const borderHidden = region.borderVisible === false;
    const style = {
      ...baseStyle,
      stroke: region.borderColor ?? baseStyle.stroke,
      strokeOpacity: borderHidden ? 0 : baseStyle.strokeOpacity,
      strokeWidth: borderHidden ? 0 : baseStyle.strokeWidth,
    };
    const textColor = region.fontColor ?? theme.palette.text.primary;

    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onSelect(region.id);
      },
      [onSelect, region.id],
    );

    const handleMouseEnter = useCallback(() => {
      onHover(region.id);
    }, [onHover, region.id]);

    const handleMouseLeave = useCallback(() => {
      onHover(null);
    }, [onHover]);

    const w = region.x2 - region.x1;
    const h = region.y2 - region.y1;
    const fontSize = h * 0.65;

    const clipId = `clip-${region.id}`;

    return (
      <g>
        <clipPath id={clipId}>
          <rect x={region.x1} y={region.y1} width={w} height={h} />
        </clipPath>
        <rect
          x={region.x1}
          y={region.y1}
          width={w}
          height={h}
          fill={style.fill}
          fillOpacity={style.fillOpacity}
          stroke={style.stroke}
          strokeOpacity={style.strokeOpacity}
          strokeWidth={style.strokeWidth}
          style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
        {!isSelected && region.currentText && (
          <text
            x={region.x1 + 4}
            y={region.y1 + h * 0.75}
            fontSize={fontSize}
            fontFamily={region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif'}
            fontWeight={region.fontWeight ?? 'normal'}
            fontStyle={region.fontStyle ?? 'normal'}
            textDecoration={region.textDecoration ?? 'none'}
            fill={textColor}
            fillOpacity={0.9}
            clipPath={`url(#${clipId})`}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {region.currentText}
          </text>
        )}
      </g>
    );
  },
);
