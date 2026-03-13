# Component Design — Reviso as an Embeddable Component

## Goal
Reviso is a reusable, embeddable React component (`<Reviso />`) for reviewing, validating, and correcting OCR text on restored document images. It is published as `react-reviso` on npm.

## Core Design Decisions

### Preview-first UX
The component defaults to preview mode — users land in a QA/review view, not an editor. This reflects the primary use case: reviewing restoration quality and validating OCR corrections. Editing is available on demand.

### Uncontrolled by default
The component manages its own internal state (selected page, selected region, zoom, view mode, editor mode). The host app provides data in and receives callbacks out.

### Single document mode
The component accepts **one document at a time**. The host app is responsible for document selection. Multi-document navigation is removed from the component's responsibility.

### No file upload
Upload/import is the host app's responsibility. The host fetches or receives the document data however it wants, then passes it to `<Reviso />` as a prop.

### Theme integration
The component inherits the host app's MUI theme. If the host wraps in a `<ThemeProvider>`, Reviso uses those tokens. Optionally accepts a `theme` prop to override or extend.

---

## View Modes

### Preview Mode (default)
Two sub-layouts selectable via toolbar toggle:

**Side-by-side:**
- Left pane: original image with "Original" label
- Right pane: restored image (AfterImage with auto background colors) with "Restored" label
- Independent zoom/pan per pane (separate TransformWrappers)
- ValidationOverlay on restored pane (clickable checkmarks to mark regions validated)
- Show/hide validation icons via toolbar toggle

**Slider comparison:**
- Single overlay with ReactCompareSlider
- Horizontal (left/right) or vertical (top/bottom) orientation
- No validation checkmarks (too complex with slider interaction)
- Own TransformWrapper for zoom/pan

### Edit Mode
Entered via "Edit" button or Ctrl+E:
- DocumentViewer with full editing capabilities
- InlineEditor for text editing, RegionCreator for new regions
- Undo/redo, style controls, text visibility toggle
- Exit via "Preview" button (eye icon) or Ctrl+E or Escape (when nothing selected)

---

## Component API

### Props

```tsx
interface RevisoProps {
  /** The document to display and review */
  document: RevisoDocument;

  /** Enable/disable editing (default: true). When false, preview and validation only. */
  editable?: boolean;

  /** Show/hide the page thumbnail sidebar (default: true) */
  showSidebar?: boolean;

  /** Show/hide the inline toolbar (default: true) */
  showToolbar?: boolean;

  /** Feature toggles */
  features?: {
    comparison?: boolean;     // Comparison views (default: true)
    export?: boolean;         // Export dialog — JSON/PDF/PNG (default: true)
    regionCreation?: boolean; // Draw new regions in edit mode (default: true)
  };

  /** Default styles for newly created regions */
  defaultRegionStyles?: Partial<RegionDefaults>;

  /** MUI theme overrides (merged with host theme or built-in default) */
  theme?: ThemeOptions;

  /** Initial page to display (page ID). Defaults to first page. */
  initialPageId?: string;

  // --- Callbacks ---

  /** Fired on any region change. Returns only dirty (modified) pages. */
  onChange?: (dirtyPages: RevisoPage[]) => void;

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
```

### Data Types

```tsx
interface RevisoDocument {
  id: string;
  name: string;
  pages: RevisoPage[];
}

interface RevisoPage {
  id: string;
  pageNumber: number;
  imageSrc: string;            // Restored/corrected page image
  originalImageSrc: string;    // Original/damaged version (for comparison)
  width: number;
  height: number;
  regions: RevisoRegion[];
}

interface RevisoRegion {
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
  isValidated?: boolean;
}
```

### Usage Examples

```tsx
// QA review mode — preview and validate
<Reviso
  document={myDocument}
  editable={false}
  onChange={(dirtyPages) => saveValidationState(dirtyPages)}
/>

// Full editing with export callback
<Reviso
  document={myDocument}
  onChange={(dirtyPages) => saveToBackend(dirtyPages)}
  onExport={(format, data) => uploadToS3(format, data)}
/>

// Minimal viewer with custom theme
<Reviso
  document={myDocument}
  features={{ export: false, regionCreation: false }}
  theme={{ palette: { primary: { main: '#1976d2' } } }}
/>
```

---

## Layout

The component is a **self-contained rectangular container** that fills its parent.

### Preview Mode (Side-by-Side)
```
┌──────────────────────────────────────────────────────┐
│ ☰ [◀ ▶] Doc — Page 1/3  2/5  │ SbS│Slider│ ✓ │Edit│ Export │ ?
├────────┬────────────────────┬────────────────────────┤
│  p1    │    Original        │      Restored          │
│  p2    │                    │        ✓ ✓ ✓          │
│  p3    │                    │                        │
└────────┴────────────────────┴────────────────────────┘
```

### Edit Mode
```
┌──────────────────────────────────────────────────────┐
│ ☰ [◀ ▶] Doc — Page 1/3  2/5  │ New Region │ U R │ 👁 Preview │ Export │ ?
├────────┬─────────────────────────────────────────────┤
│  p1    │                                             │
│  p2    │              Document Viewer                │
│  p3    │            (zoom/pan + overlays)            │
└────────┴─────────────────────────────────────────────┘
```

---

## Key State

```typescript
// uiStore
ViewMode: 'preview' | 'edit'           // default: 'preview'
PreviewLayout: 'side-by-side' | 'slider' // default: 'side-by-side'
SliderOrientation: 'horizontal' | 'vertical' // default: 'horizontal'
showValidationIcons: boolean            // default: true
fitToViewTrigger: number                // incremented to trigger fit-to-view
EditorMode: 'select' | 'create'        // default: 'select'
```

---

## Distribution

Published as `react-reviso` on npm. ESM + CJS bundles with TypeScript declarations.

### Peer Dependencies
- `react`, `react-dom` (18+)
- `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`
- `framer-motion`

### Bundled Dependencies
- `zustand`, `immer`
- `react-zoom-pan-pinch`
- `react-compare-slider`
- `pdf-lib`
- `nanoid`

### File Structure
```
src/reviso/
  Reviso.tsx               ← main entry component
  index.ts                 ← public API exports
  types/                   ← RevisoDocument, RevisoPage, RevisoRegion, UI types
  stores/                  ← documentStore, uiStore, editHistoryStore
  components/
    layout/                ← InlineToolbar, PageThumbnails
    viewer/                ← DocumentViewer, PageImage, OverlayLayer, TextRegion
    editor/                ← InlineEditor, RegionCreator
    comparison/            ← PreviewSideBySide, ComparisonSlider, AfterImage, ValidationOverlay
    export/                ← ExportDialog
    common/                ← KeyboardHelpDialog, DebouncedColorPicker
  hooks/                   ← useEditorKeyboard, useNavigationKeyboard, useAutoBackgroundColors
  utils/                   ← export logic, coordinate transforms
```
