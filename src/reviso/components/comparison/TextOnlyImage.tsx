import type { Page } from '../../types/document';
import { useFittedFontSizes } from '../../hooks/useFittedFontSizes';

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
          const fs = fontSizes[region.id] ?? Math.max(6, h * 0.65);
          const clipId = `text-only-clip-${region.id}`;

          return (
            <g key={region.id}>
              <clipPath id={clipId}>
                <rect x={region.x1} y={region.y1} width={w} height={h} />
              </clipPath>
              <text
                x={region.x1 + 4}
                y={region.y1 + h * 0.75}
                textAnchor="start"
                fontSize={fs}
                fontFamily={region.fontFamily ?? 'Inter, Roboto, Helvetica, Arial, sans-serif'}
                fontWeight={region.fontWeight ?? 'normal'}
                fontStyle={region.fontStyle ?? 'normal'}
                textDecoration={region.textDecoration ?? 'none'}
                fill="#1a1a1a"
                fillOpacity={0.95}
                clipPath={`url(#${clipId})`}
              >
                {region.currentText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
