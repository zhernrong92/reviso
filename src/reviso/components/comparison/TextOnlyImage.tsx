import type { Page } from '../../types/document';
import { useFittedFontSizes } from '../../hooks/useFittedFontSizes';
import { splitGlyphs, regionPadding } from '../../utils/textLayout';

interface TextOnlyImageProps {
  page: Page;
}

export const TextOnlyImage: React.FC<TextOnlyImageProps> = ({ page }) => {
  const fontSizes = useFittedFontSizes(page);

  return (
    <div style={{ position: 'relative', width: page.width, height: page.height }}>
      <svg
        width={page.width}
        height={page.height}
        viewBox={`0 0 ${page.width} ${page.height}`}
        style={{ display: 'block' }}
      >
        {/* White background for synthetic reconstruct */}
        <rect x={0} y={0} width={page.width} height={page.height} fill="#ffffff" />

        {page.regions.map((region) => {
          if (!region.currentText) return null;

          const w = region.x2 - region.x1;
          const h = region.y2 - region.y1;
          const fitted = fontSizes[region.id];
          const fs = fitted?.fontSize ?? Math.max(6, h * 0.65);
          const orientation = fitted?.orientation ?? 'horizontal';
          const padding = regionPadding(w);
          const clipId = `text-only-clip-${region.id}`;

          const isVertical = orientation === 'vertical';
          const pos = isVertical ? 'inside' : (region.textPosition ?? 'inside');

          const textAttrs = (() => {
            if (isVertical) {
              return {
                x: region.x1 + w / 2,
                y: region.y1 + padding + fs * 0.85,
                anchor: 'middle' as const,
                useClip: true,
              };
            }
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
              <text
                x={textAttrs.x}
                y={textAttrs.y}
                textAnchor={textAttrs.anchor}
                fontSize={fs}
                fontFamily={region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif'}
                fontWeight={region.fontWeight ?? 'normal'}
                fontStyle={region.fontStyle ?? 'normal'}
                textDecoration={region.textDecoration ?? 'none'}
                fill="#1a1a1a"
                fillOpacity={0.95}
                clipPath={textAttrs.useClip ? `url(#${clipId})` : undefined}
              >
                {isVertical
                  ? splitGlyphs(region.currentText).map((g, i) => (
                    <tspan key={i} x={textAttrs.x} dy={i === 0 ? 0 : fs}>{g}</tspan>
                  ))
                  : region.currentText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
