import { useTheme } from '@mui/material/styles';
import type { Page } from '../../types/document';

interface AfterImageProps {
  page: Page;
}

export const AfterImage: React.FC<AfterImageProps> = ({ page }) => {
  const theme = useTheme();

  const fontSize = (h: number) => h * 0.65;

  return (
    <div style={{ position: 'relative', width: page.width, height: page.height }}>
      <img
        src={page.imageSrc}
        alt={`Page ${page.pageNumber} restored`}
        width={page.width}
        height={page.height}
        style={{ display: 'block' }}
      />
      <svg
        width={page.width}
        height={page.height}
        viewBox={`0 0 ${page.width} ${page.height}`}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      >
        {page.regions.map((region) => {
          const w = region.x2 - region.x1;
          const h = region.y2 - region.y1;
          const textColor = region.fontColor ?? theme.palette.text.primary;
          const borderColor = region.borderColor ?? theme.palette.primary.main;
          const borderHidden = region.borderVisible === false;

          const hasBg = region.backgroundColor && region.backgroundColor !== 'transparent';
          const pos = region.textPosition ?? 'inside';
          const fs = fontSize(h);
          const clipId = `after-clip-${region.id}`;

          const getTextAttrs = () => {
            switch (pos) {
              case 'top':
                return { x: region.x1, y: region.y1 - 4, anchor: 'start' as const, useClip: false };
              case 'bottom':
                return { x: region.x1, y: region.y2 + fs + 4, anchor: 'start' as const, useClip: false };
              case 'inside':
              default:
                return { x: region.x1 + 4, y: region.y1 + h * 0.75, anchor: 'start' as const, useClip: true };
            }
          };

          const textAttrs = getTextAttrs();

          return (
            <g key={region.id}>
              {textAttrs.useClip && (
                <clipPath id={clipId}>
                  <rect x={region.x1} y={region.y1} width={w} height={h} />
                </clipPath>
              )}
              <rect
                x={region.x1}
                y={region.y1}
                width={w}
                height={h}
                fill={hasBg ? region.backgroundColor : 'transparent'}
                fillOpacity={hasBg ? 1 : 0}
                stroke={borderHidden ? 'none' : borderColor}
                strokeOpacity={borderHidden ? 0 : 0.3}
                strokeWidth={borderHidden ? 0 : 1}
              />
              {region.currentText && (
                <text
                  x={textAttrs.x}
                  y={textAttrs.y}
                  textAnchor={textAttrs.anchor}
                  fontSize={fs}
                  fontFamily={region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif'}
                  fontWeight={region.fontWeight ?? 'normal'}
                  fontStyle={region.fontStyle ?? 'normal'}
                  textDecoration={region.textDecoration ?? 'none'}
                  fill={textColor}
                  fillOpacity={0.9}
                  clipPath={textAttrs.useClip ? `url(#${clipId})` : undefined}
                >
                  {region.currentText}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
