import React, { useCallback } from 'react';
import { useTheme } from '@mui/material/styles';
import type { TextRegion as TextRegionType } from '../../types/document';
import { useDocumentStore } from '../../stores/documentStore';

interface TextRegionProps {
  region: TextRegionType;
  pageId: string;
  isSelected: boolean;
  isHovered: boolean;
  showText: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

export const TextRegion = React.memo<TextRegionProps>(
  ({ region, pageId, isSelected, isHovered, showText, onSelect, onHover }) => {
    const theme = useTheme();
    const toggleRegionValidation = useDocumentStore((s) => s.toggleRegionValidation);

    const handleToggleValidation = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        toggleRegionValidation(pageId, region.id);
      },
      [toggleRegionValidation, pageId, region.id],
    );

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
      // In edit mode, always transparent background
      return {
        fill: 'transparent',
        fillOpacity: 0,
        stroke: region.isEdited ? theme.palette.primary.light : theme.palette.primary.main,
        strokeOpacity: region.isEdited ? 0.6 : 0.3,
        strokeWidth: 1,
      };
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

    const w = region.x2 - region.x1;
    const h = region.y2 - region.y1;
    const fontSize = h * 0.65;
    const pos = region.textPosition ?? 'inside';

    const clipId = `clip-${region.id}`;

    const getTextAttrs = () => {
      switch (pos) {
        case 'top':
          return { x: region.x1, y: region.y1 - 4, anchor: 'start' as const, useClip: false };
        case 'bottom':
          return { x: region.x1, y: region.y2 + fontSize + 4, anchor: 'start' as const, useClip: false };
        case 'left':
          return { x: region.x1 - 4, y: region.y1 + h * 0.75, anchor: 'end' as const, useClip: false };
        case 'right':
          return { x: region.x2 + 4, y: region.y1 + h * 0.75, anchor: 'start' as const, useClip: false };
        case 'inside':
        default:
          return { x: region.x1 + 4, y: region.y1 + h * 0.75, anchor: 'start' as const, useClip: true };
      }
    };

    const textAttrs = getTextAttrs();

    return (
      <g>
        {textAttrs.useClip && !isSelected && (
          <clipPath id={clipId}>
            <rect x={region.x1} y={region.y1} width={w} height={h} />
          </clipPath>
        )}
        {!isSelected && (
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
        )}
        {!isSelected && showText && region.currentText && (
          <text
            x={textAttrs.x}
            y={textAttrs.y}
            textAnchor={textAttrs.anchor}
            fontSize={fontSize}
            fontFamily={region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif'}
            fontWeight={region.fontWeight ?? 'normal'}
            fontStyle={region.fontStyle ?? 'normal'}
            textDecoration={region.textDecoration ?? 'none'}
            fill={textColor}
            fillOpacity={0.9}
            clipPath={textAttrs.useClip ? `url(#${clipId})` : undefined}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {region.currentText}
          </text>
        )}
        {/* Validation badge — visible when not editing */}
        {!isSelected && (() => {
          const badgeCx = region.x1 - 2;
          const badgeCy = pos === 'top'
            ? region.y1 - fontSize - 2
            : pos === 'bottom'
              ? region.y2 + 2
              : region.y1 - 2;
          return (
            <g onClick={handleToggleValidation} style={{ cursor: 'pointer' }}>
              <title>{region.isValidated ? 'Mark as not validated' : 'Mark as validated'}</title>
              <circle
                cx={badgeCx}
                cy={badgeCy}
                r={6}
                fill={region.isValidated ? theme.palette.success.main : theme.palette.grey[700]}
                fillOpacity={region.isValidated ? 0.9 : 0.5}
                stroke={region.isValidated ? theme.palette.success.dark : theme.palette.grey[500]}
                strokeWidth={1}
              />
              {region.isValidated && (
                <path
                  d={`M${badgeCx - 3} ${badgeCy} l2 2 4-4`}
                  fill="none"
                  stroke={theme.palette.success.contrastText}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </g>
          );
        })()}
      </g>
    );
  },
);
