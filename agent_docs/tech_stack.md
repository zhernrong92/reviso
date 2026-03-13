# Tech Stack & Tools

## Core Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | React | 18.x | UI framework |
| Language | TypeScript | 5.x | Strict mode, no `any` |
| Build Tool | Vite | 5.x | Dev server + library bundler |
| UI Library | MUI 6 | 6.x | Component library, dark theme |
| State | Zustand | 5.x | State management (3 stores) |
| Middleware | Immer | 11.x | Immutable updates for nested state |
| Animations | Framer Motion | 12.x | Page transitions, layout animations |
| Zoom/Pan | react-zoom-pan-pinch | 3.x | Document viewer zoom/pan |
| Comparison | react-compare-slider | 3.x | Before/after slider (horizontal + vertical) |
| PDF Export | pdf-lib | 1.x | Positional text PDF generation |
| IDs | nanoid | 5.x | Unique ID generation for regions |

## Project Structure

```
reviso/
├── public/
│   ├── sample-doc.pdf              # Default sample PDF (loaded on startup)
│   └── sample-receipt.png          # Default sample PNG (loaded on startup)
├── sample/                         # Extra sample files for upload testing
├── src/
│   ├── reviso/                     # ← EMBEDDABLE COMPONENT (published as react-reviso)
│   │   ├── Reviso.tsx              # Main entry — routes between preview/edit modes
│   │   ├── index.ts                # Public API exports
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── DebouncedColorPicker.tsx
│   │   │   │   └── KeyboardHelpDialog.tsx
│   │   │   ├── comparison/
│   │   │   │   ├── AfterImage.tsx          # Restored page with auto background colors
│   │   │   │   ├── ComparisonSlider.tsx    # Slider comparison (horizontal/vertical)
│   │   │   │   ├── PreviewSideBySide.tsx   # Original vs restored dual-pane
│   │   │   │   └── ValidationOverlay.tsx   # Clickable validation checkmarks
│   │   │   ├── editor/
│   │   │   │   ├── InlineEditor.tsx        # Text input, resize, move, delete, style
│   │   │   │   └── RegionCreator.tsx       # Draw new regions on document
│   │   │   ├── export/
│   │   │   │   └── ExportDialog.tsx
│   │   │   ├── layout/
│   │   │   │   ├── InlineToolbar.tsx       # Mode-specific toolbar
│   │   │   │   └── PageThumbnails.tsx      # Page sidebar
│   │   │   └── viewer/
│   │   │       ├── DocumentViewer.tsx      # Edit mode viewer (zoom/pan)
│   │   │       ├── OverlayLayer.tsx        # SVG overlay container
│   │   │       ├── PageImage.tsx           # Document page image
│   │   │       └── TextRegion.tsx          # Single region (SVG rect + text)
│   │   ├── hooks/
│   │   │   ├── useAutoBackgroundColors.ts  # Dominant color detection for preview
│   │   │   ├── useEditorKeyboard.ts        # Delete, Tab, Escape, N shortcuts
│   │   │   └── useNavigationKeyboard.ts    # Arrows, Ctrl+E, Ctrl+Z, ?, etc.
│   │   ├── stores/
│   │   │   ├── documentStore.ts            # Documents, pages, regions (immer)
│   │   │   ├── editHistoryStore.ts         # Undo/redo snapshot stack
│   │   │   └── uiStore.ts                  # View mode, layout, selection, features
│   │   ├── types/
│   │   │   ├── document.ts                 # Document, Page, TextRegion (internal)
│   │   │   ├── index.ts                    # Re-exports
│   │   │   ├── public.ts                   # RevisoDocument, RevisoPage, RevisoRegion, RevisoProps
│   │   │   └── ui.ts                       # ViewMode, PreviewLayout, SliderOrientation, etc.
│   │   └── utils/
│   │       ├── downloadFile.ts
│   │       ├── exportImage.ts              # PNG export (canvas rendering)
│   │       ├── exportJson.ts
│   │       ├── exportPdf.ts                # PDF export (pdf-lib)
│   │       └── typeMappers.ts              # Public ↔ internal type conversion
│   ├── legacy/                     # Legacy standalone app (demo only)
│   │   ├── components/
│   │   │   ├── AppShell.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── DocumentList.tsx
│   │   └── utils/
│   │       ├── dummyData.ts
│   │       ├── parsePdf.ts
│   │       └── parseUploadedJson.ts
│   ├── theme/
│   │   └── theme.ts                # MUI 6 dark theme
│   ├── App.tsx                     # Root — loads sample documents, legacy routes
│   └── main.tsx                    # Entry point
├── AGENTS.md                       # Development roadmap
├── CLAUDE.md                       # Claude Code instructions
├── README.md                       # Consumer documentation
└── agent_docs/                     # Detailed docs for AI agents
```

## Key State (uiStore)

```typescript
// View modes and layout
ViewMode: 'preview' | 'edit'               // default: 'preview'
PreviewLayout: 'side-by-side' | 'slider'   // default: 'side-by-side'
SliderOrientation: 'horizontal' | 'vertical' // default: 'horizontal'
EditorMode: 'select' | 'create'            // default: 'select'

// UI state
showValidationIcons: boolean               // default: true
fitToViewTrigger: number                   // incremented to trigger fit-to-view
showRegionText: boolean                    // default: true
sidebarOpen: boolean                       // default: true

// Feature flags
features: { comparison, export, regionCreation }  // all default: true
```

## Zustand Store Patterns

### documentStore (with immer)
```typescript
// Immer for nested state updates (documents → pages → regions)
// Snapshot-based dirty detection for onChange
// Dirty flags reset after onChange fires
```

### editHistoryStore (snapshot-based undo/redo)
```typescript
// Stores full document snapshots
// Max 50 history entries
// undo() / redo() return snapshot for documentStore.restoreSnapshot()
```

### uiStore (no immer — flat state)
```typescript
// setViewMode always deselects region and resets editor mode
// fitToViewTrigger pattern: increment from toolbar, watch via useEffect in viewers
```

## Key Library Notes

### react-zoom-pan-pinch
- Used in DocumentViewer, PreviewSideBySide (2 instances), ComparisonSlider
- `limitToBounds` + `centerZoomedOut` for contained viewing
- `panning.excluded` class names exempt editor elements from pan capture
- Fit-to-view via `ref.centerView(fitScale, 0)`

### react-compare-slider
- `portrait` prop enables vertical (top-down) slider orientation
- `ReactCompareSliderHandle` accepts `portrait` prop for correct handle rendering
- Wrapped in TransformWrapper for zoom/pan in comparison mode

### Auto Background Colors
- `useAutoBackgroundColors` hook detects dominant background color per region
- Uses image sampling + color bucketing algorithm
- Applied in AfterImage for realistic restored document preview
- Edit mode always uses transparent backgrounds

### Export
- **JSON:** Structured document data with corrected text
- **PDF:** pdf-lib with text at original bounding box positions (Y-axis flipped)
- **PNG:** Canvas rendering of restored page (AfterImage rendered to offscreen canvas)
