import type { Page } from '../../types/document';
import { useFittedFontSizes } from '../../hooks/useFittedFontSizes';

interface AfterImageProps {
  page: Page;
  /** Auto-detected background colors per region */
  autoBackgroundColors: Map<string, string>;
}

export const AfterImage: React.FC<AfterImageProps> = ({ page, autoBackgroundColors }) => {
  const fontSizes = useFittedFontSizes(page);

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
          const fs = fontSizes[region.id] ?? Math.max(6, h * 0.65);
          const pos = region.textPosition ?? 'inside';
          const padding = Math.min(4, w * 0.1);
          const clipId = `after-clip-${region.id}`;

          const bgColor = (region.backgroundColor && region.backgroundColor !== 'transparent')
            ? region.backgroundColor
            : (autoBackgroundColors.get(region.id) ?? '#ffffff');

          const textAttrs = (() => {
            switch (pos) {
              case 'top':
                return { x: region.x1, y: region.y1 - 4, anchor: 'start' as const, useClip: false };
              case 'bottom':
                return { x: region.x1, y: region.y2 + fs + 4, anchor: 'start' as const, useClip: false };
              case 'left':
                return { x: region.x1 - 4, y: region.y1 + h * 0.75, anchor: 'end' as const, useClip: false };
              case 'right':
                return { x: region.x2 + 4, y: region.y1 + h * 0.75, anchor: 'start' as const, useClip: false };
              case 'inside':
              default:
                return { x: region.x1 + padding, y: region.y1 + h * 0.75, anchor: 'start' as const, useClip: true };
            }
          })();

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
                fill={bgColor}
                fillOpacity={1}
                stroke="none"
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
                  fill={region.fontColor ?? '#1a1a1a'}
                  fillOpacity={0.95}
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
