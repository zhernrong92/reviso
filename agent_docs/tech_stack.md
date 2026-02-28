# Tech Stack & Tools

## Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.x | UI framework |
| Language | TypeScript | 5.x | Strict mode, no `any` |
| Build Tool | Vite | 5.x | Dev server + bundler |
| UI Library | MUI 6 | 6.x | Component library, dark theme |
| State | Zustand | 5.x | State management (3 stores) |
| Middleware | Immer | 11.x | Immutable updates for nested state |
| Animations | Framer Motion | 12.x | Page transitions, layout animations |
| Zoom/Pan | react-zoom-pan-pinch | 3.x | Document viewer zoom/pan |
| Comparison | react-compare-slider | 3.x | Before/after slider |
| PDF Import | pdfjs-dist | 5.x | Render PDF pages to canvas in browser |
| PDF Export | pdf-lib | 1.x | Positional text PDF generation |
| IDs | nanoid | 5.x | Unique ID generation for regions |

## Project Initialisation

```bash
npm create vite@latest reviso -- --template react-ts
cd reviso
npm install

# Core dependencies
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install zustand immer
npm install framer-motion
npm install react-zoom-pan-pinch react-compare-slider
npm install pdf-lib pdfjs-dist nanoid

# Dev dependencies (should already be present from Vite template)
# typescript, vite, @vitejs/plugin-react, @types/react, @types/react-dom
```

## Project Structure

```
reviso/
├── public/
│   ├── sample-doc.pdf              # Default sample PDF (loaded on startup)
│   └── sample-receipt.png          # Default sample PNG (loaded on startup)
├── sample/                         # Extra sample files for upload testing
│   ├── sample-upload.json
│   ├── sample-pdf-regions.json
│   ├── file-example_PDF_1MB.pdf
│   └── sample receipt.png
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── DebouncedColorPicker.tsx  # Color picker with blur-commit (no lag)
│   │   │   └── KeyboardHelpDialog.tsx    # Shortcut help overlay (? key)
│   │   ├── comparison/
│   │   │   ├── AfterImage.tsx            # Restored page with region overlays
│   │   │   └── ComparisonSlider.tsx      # Before/after with zoom/pan
│   │   ├── editor/
│   │   │   ├── InlineEditor.tsx          # Text input, resize, move, delete, style toolbar
│   │   │   └── RegionCreator.tsx         # Draw new regions on document
│   │   ├── export/
│   │   │   └── ExportDialog.tsx          # Export options (JSON / PDF / PNG)
│   │   ├── layout/
│   │   │   ├── AppShell.tsx              # Top-level layout (sidebar + main)
│   │   │   ├── TopBar.tsx                # Breadcrumb, nav, undo/redo, upload, export
│   │   │   └── Sidebar.tsx              # Document list + page thumbnails
│   │   └── viewer/
│   │       ├── DocumentViewer.tsx        # Main viewer (zoom/pan wrapper)
│   │       ├── OverlayLayer.tsx          # SVG overlay container
│   │       ├── PageImage.tsx             # Document page image
│   │       └── TextRegion.tsx            # Single region (SVG rect + text)
│   ├── hooks/
│   │   ├── useEditorKeyboard.ts          # Delete, Tab, Escape, N shortcuts
│   │   └── useNavigationKeyboard.ts      # Arrows, Ctrl+E, Ctrl+Z, ?, etc.
│   ├── stores/
│   │   ├── documentStore.ts              # Documents, pages, regions (immer)
│   │   ├── editHistoryStore.ts           # Undo/redo snapshot stack
│   │   └── uiStore.ts                    # UI state (selection, mode, sidebar)
│   ├── types/
│   │   ├── document.ts                   # Document, Page, TextRegion
│   │   └── ui.ts                         # ViewMode, EditorMode, RegionDefaults
│   ├── utils/
│   │   ├── downloadFile.ts               # Blob download helper
│   │   ├── dummyData.ts                  # Generated dummy data (legacy)
│   │   ├── exportImage.ts                # PNG export (canvas rendering)
│   │   ├── exportJson.ts                 # JSON export
│   │   ├── exportPdf.ts                  # PDF export (pdf-lib)
│   │   ├── parsePdf.ts                   # PDF import (pdfjs-dist)
│   │   └── parseUploadedJson.ts          # JSON upload validation/parsing
│   ├── theme/
│   │   └── theme.ts                      # MUI 6 dark theme (#0bda90)
│   ├── App.tsx                           # Root — loads default sample documents
│   └── main.tsx                          # Entry point
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── AGENTS.md                             # Development roadmap
├── CLAUDE.md                             # Claude Code instructions
├── README.md                             # Setup and run guide
└── agent_docs/                           # Detailed docs for AI agents
```

## MUI 6 Dark Theme Configuration

```typescript
// src/theme/theme.ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0bda90',
      light: '#4de8ab',
      dark: '#08a86e',
      contrastText: '#000000',
    },
    background: {
      default: '#0a0a0a',
      paper: '#141414',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { textTransform: 'none' },
      },
    },
  },
});

export default theme;
```

## Zustand Store Patterns

### documentStore (with immer + history)
```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

// Use immer for nested state updates (documents → pages → regions)
// Each mutation captures before/after snapshots for undo/redo
const useDocumentStore = create<DocumentState>()(
  immer((set, get) => ({
    documents: [],
    updateRegionText: (pageId, regionId, text) => {
      const before = deepClone(get().documents);
      set((state) => {
        // immer allows direct mutation syntax
        const page = findPage(state.documents, pageId);
        if (page) {
          const region = page.regions.find((r) => r.id === regionId);
          if (region) {
            region.currentText = text;
            region.isEdited = text !== region.originalText;
          }
        }
      });
      const after = deepClone(get().documents);
      useEditHistoryStore.getState().pushEntry(before, after);
    },
  }))
);
```

### editHistoryStore (snapshot-based undo/redo)
```typescript
// Stores { before, after } snapshots for each mutation
// undo() restores `before`, redo() restores `after`
// Max 50 history entries
```

### uiStore (no immer needed — flat state)
```typescript
import { create } from 'zustand';

const useUiStore = create<UiState>()((set) => ({
  activeDocumentId: null,
  activePageId: null,
  selectedRegionId: null,
  viewMode: 'edit',
  helpDialogOpen: false,
  // ... flat state, no immer needed
}));
```

## SVG Overlay Pattern

```typescript
// SVG sized to match image, positioned absolutely on top
<svg
  width={imageWidth}
  height={imageHeight}
  viewBox={`0 0 ${imageWidth} ${imageHeight}`}
  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
>
  {regions.map((region) => (
    <g key={region.id} style={{ pointerEvents: 'all' }}>
      <rect
        x={region.x1} y={region.y1}
        width={region.x2 - region.x1}
        height={region.y2 - region.y1}
        fill={region.backgroundColor ?? 'transparent'}
        stroke={region.borderColor ?? theme.palette.primary.main}
        strokeOpacity={0.3}
      />
    </g>
  ))}
</svg>
```

## Zoom/Pan Pattern

```typescript
// Both image and SVG inside the same TransformComponent
// Used in DocumentViewer (edit mode) and ComparisonSlider (compare mode)
<TransformWrapper initialScale={1} minScale={0.3} maxScale={4}
  limitToBounds centerOnInit centerZoomedOut>
  <TransformComponent>
    <div style={{ position: 'relative' }}>
      <PageImage src={page.imageSrc} />
      <OverlayLayer regions={page.regions} />
    </div>
  </TransformComponent>
</TransformWrapper>
```

## Export Patterns

### JSON Export
```typescript
// Serialises Document[] to clean JSON string
```

### PDF Export (pdf-lib)
```typescript
import { PDFDocument, StandardFonts } from 'pdf-lib';

// Key: PDF Y-axis is bottom-up, our JSON is top-down
// Convert: pdfY = imageHeight - region.y1 - h * 0.75
page.drawText(region.currentText, {
  x: region.x1 + 4,
  y: pdfY,
  size: fontSize,
  font,
});
```

### PNG Image Export (canvas)
```typescript
// Renders page image + region overlays to an offscreen canvas
// Draws: background image → region fills → borders → text
// Exports as PNG blob via canvas.toBlob()
```

## PDF Import (pdfjs-dist)

```typescript
import * as pdfjs from 'pdfjs-dist';

// Configure worker for off-main-thread rendering
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

// Each page rendered to canvas at 2x scale → data URL → imageSrc
```

## Key Library Notes

### pdfjs-dist
- Renders PDF pages to `<canvas>` in the browser
- Worker runs in separate thread for non-blocking rendering
- Canvas converted to PNG data URL for use as page `imageSrc`

### react-zoom-pan-pinch
- Wraps content in CSS transform — children zoom together automatically
- `limitToBounds` prevents panning outside document bounds
- `panning.excluded` class names exempt elements from pan capture

### react-compare-slider
- Accepts any React children (not just images)
- "After" side renders live SVG overlay with corrected text
- Wrapped in TransformWrapper for zoom/pan in compare mode

### Framer Motion
- `AnimatePresence` for page transition mount/unmount animations
- `motion.div` with `initial`/`animate`/`exit` for transitions

### pdf-lib
- Pure JavaScript, works in browser
- `drawText()` with precise x/y positioning
- PDF coordinate origin is bottom-left (flip Y axis)
