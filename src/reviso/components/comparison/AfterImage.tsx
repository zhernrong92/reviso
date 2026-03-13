import type { Page } from '../../types/document';

interface AfterImageProps {
  page: Page;
  /** Auto-detected background colors per region */
  autoBackgroundColors: Map<string, string>;
}

export const AfterImage: React.FC<AfterImageProps> = ({ page, autoBackgroundColors }) => {
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
          const fs = fontSize(h);
          const clipId = `after-clip-${region.id}`;

          // Preview rendering: opaque background, text always inside
          const bgColor = (region.backgroundColor && region.backgroundColor !== 'transparent')
            ? region.backgroundColor
            : (autoBackgroundColors.get(region.id) ?? '#ffffff');

          return (
            <g key={region.id}>
              <clipPath id={clipId}>
                <rect x={region.x1} y={region.y1} width={w} height={h} />
              </clipPath>
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
                  x={region.x1 + 4}
                  y={region.y1 + h * 0.75}
                  textAnchor="start"
                  fontSize={fs}
                  fontFamily={region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif'}
                  fontWeight={region.fontWeight ?? 'normal'}
                  fontStyle={region.fontStyle ?? 'normal'}
                  textDecoration={region.textDecoration ?? 'none'}
                  fill={region.fontColor ?? '#1a1a1a'}
                  fillOpacity={0.95}
                  clipPath={`url(#${clipId})`}
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
