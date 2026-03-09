# Component Design — Reviso as an Embeddable Component

## Goal
Refactor Reviso from a standalone app into a reusable, embeddable React component (`<Reviso />`) that can be dropped into any codebase.

## Core Design Decisions

### Uncontrolled by default
The component manages its own internal state (selected page, selected region, zoom, editor mode). The host app provides data in and receives callbacks out. This keeps integration simple — no need to wire up a store.

### Single document mode
The component accepts **one document at a time**. The host app is responsible for document selection (e.g., a list page where the user clicks a document, then navigates to a detail page with `<Reviso />`). Multi-document navigation is removed from the component's responsibility.

### No file upload
Upload/import is the host app's responsibility. The host fetches or receives the document data however it wants, then passes it to `<Reviso />` as a prop.

### Theme integration
The component should inherit the host app's MUI theme. If the host wraps in a `<ThemeProvider>`, Reviso uses those tokens. Optionally, Reviso can accept a `theme` prop to override or extend. Falls back to a built-in dark theme if no host theme is detected.

---

## Component API

### Props

```tsx
interface RevisoProps {
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
    comparison?: boolean;   // Before/after comparison slider (default: true)
    export?: boolean;       // Export dialog — JSON/PDF/PNG (default: true)
    regionCreation?: boolean; // Draw new regions (default: true)
  };

  /** Default styles for newly created regions */
  defaultRegionStyles?: {
    fontColor?: string;
    borderColor?: string;
    backgroundColor?: string;
    borderVisible?: boolean;
  };

  /** MUI theme overrides (merged with host theme or built-in default) */
  theme?: ThemeOptions;

  /** Initial page to display (page ID). Defaults to first page. */
  initialPageId?: string;

  // --- Callbacks ---

  /** Fired on any region change (edit, move, resize, create, delete).
   *  Returns only dirty (modified) pages. */
  onChange?: (dirtyPages: RevisoPage[]) => void;

  /** Granular per-region change event */
  onRegionChange?: (event: {
    type: 'update' | 'create' | 'delete';
    pageId: string;
    regionId: string;
    region?: RevisoRegion; // undefined for delete
  }) => void;

  /** Fired when user navigates to a different page */
  onPageChange?: (pageId: string) => void;

  /** Fired when user selects/deselects a region */
  onSelectionChange?: (regionId: string | null) => void;

  /** Intercept export instead of auto-downloading.
   *  If provided, the component calls this instead of triggering a download. */
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
  imageSrc: string;            // URL or data URI for the page image
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
  originalText?: string;       // For tracking edits / comparison
  fontColor?: string;
  borderColor?: string;
  backgroundColor?: string;
  borderVisible?: boolean;
}
```

### Usage Example

```tsx
// Minimal — just display and edit a document
<Reviso
  document={myDocument}
  onChange={(dirtyPages) => saveToBackend(dirtyPages)}
/>

// Full — customised with feature toggles and callbacks
<Reviso
  document={myDocument}
  editable
  showSidebar={false}
  features={{ comparison: true, export: true, regionCreation: false }}
  theme={{ palette: { primary: { main: '#1976d2' } } }}
  onChange={(dirtyPages) => saveToBackend(dirtyPages)}
  onExport={(format, data) => uploadToS3(format, data)}
  onPageChange={(pageId) => trackAnalytics('page_view', pageId)}
/>

// Read-only viewer
<Reviso
  document={myDocument}
  editable={false}
  features={{ comparison: true, export: false }}
/>
```

---

## Layout

The component is a **self-contained rectangular container** that fills its parent. No assumptions about being full-screen. The host app controls placement and sizing.

```
┌──────────────────────────────────────────┐
│ [◀ ▶] Page 1/3 │ Edit │ Compare │ Export │  ← inline toolbar (optional)
├────────┬─────────────────────────────────┤
│  p1    │                                 │
│  p2    │         Viewer / Editor         │
│  p3    │                                 │
│        │                                 │
└────────┴─────────────────────────────────┘
```

- **Inline toolbar** replaces the current TopBar. Lives inside the component boundary, not at the page top level.
- **Page sidebar** shows page thumbnails for the single document (no document list). Toggleable via `showSidebar` prop.
- **No top-level AppShell** — the component doesn't render a shell, just its own content area.

---

## Distribution Strategy

**Copy-paste component** — not a published library. The `<Reviso />` component code (folder) is copied directly into the host project's codebase. This allows easy modification without versioning overhead.

### Dependencies the host project must have
The host project needs these in its `package.json`:
- `react`, `react-dom` (18+)
- `@mui/material`, `@emotion/react`, `@emotion/styled`
- `framer-motion`
- `zustand`
- `react-zoom-pan-pinch`
- `react-compare-slider` (if comparison feature is used)
- `pdf-lib` (if PDF export feature is used)

### Removals from PoC
- **pdfjs-dist** — removed entirely (no upload feature)
- **Sample data / public assets** — not copied, host provides real data

### File structure when copied
```
src/components/reviso/     ← drop this folder into host project
  Reviso.tsx               ← main entry component
  types.ts                 ← RevisoDocument, RevisoPage, RevisoRegion
  stores/                  ← internal Zustand stores
  components/              ← viewer, editor, comparison, export, toolbar
  hooks/                   ← internal hooks
  utils/                   ← coordinate transforms, export logic
```

---

## Migration Path (PoC → Component)

### Phase 8: Component Refactor
1. Remove standalone app shell (AppShell, top-level routing, sample data loading)
2. Remove file upload feature (drop pdfjs-dist dependency)
3. Convert TopBar → inline toolbar
4. Convert Sidebar → single-document page thumbnails only (no document list)
5. Create `<Reviso />` wrapper component with props interface
6. Internalise stores — scoped to component instance (no global singletons)
7. Wire up onChange/callback props to store subscriptions
8. Accept host MUI theme via context, with built-in fallback
