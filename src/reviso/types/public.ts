import type { ThemeOptions } from '@mui/material/styles';

// --- Public data types (external API contract) ---

export interface RevisoRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  originalText?: string;
  fontColor?: string;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'line-through';
  borderColor?: string;
  borderVisible?: boolean;
  backgroundColor?: string;
  textPosition?: 'inside' | 'top' | 'bottom' | 'left' | 'right';
}

export interface RevisoPage {
  id: string;
  pageNumber: number;
  imageSrc: string;
  originalImageSrc: string;
  width: number;
  height: number;
  regions: RevisoRegion[];
}

export interface RevisoDocument {
  id: string;
  name: string;
  pages: RevisoPage[];
}

// --- Component props ---

export interface RevisoProps {
  /** The document to display and edit */
  document: RevisoDocument;

  /** Enable/disable editing (default: true). When false, read-only viewer. */
  editable?: boolean;

  /** Show/hide the page thumbnail sidebar (default: true) */
  showSidebar?: boolean;

  /** Show/hide the inline toolbar (default: true) */
  showToolbar?: boolean;

  /** Feature toggles */
  features?: {
    comparison?: boolean;
    export?: boolean;
    regionCreation?: boolean;
  };

  /** Default styles for newly created regions */
  defaultRegionStyles?: {
    fontColor?: string;
    fontFamily?: string;
    fontWeight?: 'normal' | 'bold';
    fontStyle?: 'normal' | 'italic';
    textDecoration?: 'none' | 'line-through';
    borderColor?: string;
    borderVisible?: boolean;
    backgroundColor?: string;
    textPosition?: 'inside' | 'top' | 'bottom' | 'left' | 'right';
  };

  /** MUI theme overrides */
  theme?: ThemeOptions;

  /** Initial page to display (page ID). Defaults to first page. */
  initialPageId?: string;

  /** Fired on any region change. Returns the full updated document. */
  onChange?: (document: RevisoDocument) => void;

  /** Granular per-region change event */
  onRegionChange?: (event: {
    type: 'update' | 'create' | 'delete';
    pageId: string;
    regionId: string;
    region?: RevisoRegion;
  }) => void;

  /** Fired when user navigates to a different page */
  onPageChange?: (pageId: string) => void;

  /** Fired when user selects/deselects a region */
  onSelectionChange?: (regionId: string | null) => void;

  /** Intercept export instead of auto-downloading */
  onExport?: (format: 'json' | 'pdf' | 'png', data: Blob) => void;
}
