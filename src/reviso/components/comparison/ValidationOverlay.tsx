import { useTheme } from '@mui/material/styles';
import { useDocumentStore } from '../../stores/documentStore';
import type { Page } from '../../types/document';

interface ValidationOverlayProps {
  page: Page;
  pageId: string;
}

export const ValidationOverlay: React.FC<ValidationOverlayProps> = ({ page, pageId }) => {
  const theme = useTheme();
  const toggleRegionValidation = useDocumentStore((s) => s.toggleRegionValidation);

  return (
    <svg
      width={page.width}
      height={page.height}
      viewBox={`0 0 ${page.width} ${page.height}`}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      {page.regions.map((region) => {
        const size = 20;
        const cx = region.x2 - size / 2 - 2;
        const cy = region.y1 + size / 2 + 2;

        return (
          <g
            key={region.id}
            onClick={(e) => {
              e.stopPropagation();
              toggleRegionValidation(pageId, region.id);
            }}
            style={{ cursor: 'pointer' }}
          >
            <title>{region.isValidated ? 'Mark as not validated' : 'Mark as validated'}</title>
            <circle
              cx={cx}
              cy={cy}
              r={size / 2}
              fill={region.isValidated ? theme.palette.success.main : theme.palette.grey[700]}
              fillOpacity={region.isValidated ? 0.9 : 0.5}
              stroke={region.isValidated ? theme.palette.success.dark : theme.palette.grey[500]}
              strokeWidth={1}
            />
            {region.isValidated && (
              <path
                d={`M${cx - 4},${cy} L${cx - 1},${cy + 3} L${cx + 5},${cy - 3}`}
                fill="none"
                stroke="#fff"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
};
