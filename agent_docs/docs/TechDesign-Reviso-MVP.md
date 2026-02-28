# Technical Design Document: Reviso MVP

## Executive Summary

**System:** Reviso — Document Restoration Viewer/Editor
**Version:** MVP 1.0
**Document Status:** Draft
**Last Updated:** February 28, 2026
**Architecture Pattern:** Pure SPA (Single Page Application)
**Estimated Effort:** 1-2 weeks (solo developer)

### Technical Vision
A lightweight, frontend-only PoC that proves the concept of visual OCR correction. No backend, no auth, no deployment — just a fast, well-crafted React app that loads document data (bundled or uploaded), renders text overlays on document images, and enables inline editing with export capabilities.

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Browser (SPA)                       │
│                                                          │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ Document  │  │  Main Viewer │  │   Export Engine    │  │
│  │ Sidebar   │  │              │  │                   │  │
│  │           │  │  ┌────────┐  │  │  JSON / PDF       │  │
│  │ Doc List  │  │  │ Image  │  │  │  generation       │  │
│  │ Page      │  │  │ Layer  │  │  │                   │  │
│  │ Thumbs    │  │  ├────────┤  │  └───────────────────┘  │
│  │           │  │  │Overlay │  │                         │
│  │           │  │  │ Layer  │  │  ┌───────────────────┐  │
│  │           │  │  │(SVG)   │  │  │  Comparison       │  │
│  │           │  │  ├────────┤  │  │  Slider           │  │
│  │           │  │  │ Edit   │  │  │  (Before/After)   │  │
│  │           │  │  │ Layer  │  │  │                   │  │
│  └──────────┘  │  └────────┘  │  └───────────────────┘  │
│                └──────────────┘                          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │              Zustand Stores                       │    │
│  │  documentStore │ uiStore │ editHistoryStore       │    │
│  └──────────────────────────────────────────────────┘    │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │          Data Layer (JSON files)                  │    │
│  │  Bundled dummy data  │  File picker uploads       │    │
│  └──────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Framework | React | 18.x | Specified in PRD, mature ecosystem |
| Language | TypeScript | 5.x | Strict mode, no `any` types |
| Build Tool | Vite | 5.x | Fast HMR, simple config, specified in PRD |
| UI Library | MUI 6 | 6.x | Specified in PRD, comprehensive dark theme support |
| State | Zustand | 4.x | Specified in PRD, lightweight, good middleware ecosystem |
| Overlay Rendering | SVG (DOM-based) | — | See decision rationale below |
| Animations | Framer Motion | 11.x | Recommended — see decision rationale below |
| Export (PDF) | pdf-lib | 1.x | Recommended — see decision rationale below |
| Export (Image) | html2canvas | 1.x | Fallback for image-based export |
| Comparison Slider | react-compare-slider | 3.x | Recommended — see decision rationale below |
| Zoom/Pan | react-zoom-pan-pinch | 3.x | Recommended — see decision rationale below |
| AI Coding Assistant | Claude Code (CLI) | Latest | Primary development tool |

---

## Key Technical Decisions

### Decision 1: Overlay Rendering — SVG (Recommended)

| Approach | Pros | Cons | Best For |
|----------|------|------|----------|
| **SVG overlay** ✅ | Native DOM events (click, hover), CSS styling, accessible, scales perfectly with zoom, easy MUI theme integration | Slower with 500+ elements (not our case) | Interactive overlays with <200 regions |
| Absolute-positioned divs | Simplest to implement, native form inputs | Z-index complexity, hard to scale coordinates on zoom | Very simple cases |
| Canvas | Best performance for 1000+ elements | No native DOM events (must implement hit testing), harder text editing, poor accessibility | High-density visualisations |
| Hybrid (SVG + Canvas) | Performance + interactivity | Complexity, two rendering systems to maintain | Large-scale annotation tools |

**Recommendation: SVG overlay**
- With ~50 regions per page, SVG handles this easily
- Native click/hover events simplify interaction logic
- SVG elements scale naturally with CSS transforms (zoom/pan)
- Easy to style with MUI theme tokens (`#0bda90` for selection, etc.)
- Accessible — screen readers can interact with SVG elements
- If performance ever becomes an issue (future large documents), migrating the rendering layer to canvas is a contained refactor

### Decision 2: Animation Library — Framer Motion (Recommended)

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **Framer Motion** ✅ | Declarative API, `AnimatePresence` for mount/unmount, layout animations, gesture support, excellent React integration | Bundle size (~32KB gzipped) | Complex UI transitions, page changes |
| React Spring | Physics-based, natural feel | Steeper API, less intuitive for layout animations | Specific spring-feel interactions |
| MUI built-in transitions | Zero extra bundle, already available | Limited to Fade/Slide/Grow/Collapse, no layout animations | Simple show/hide |

**Recommendation: Framer Motion**
- `AnimatePresence` handles page/document transition animations cleanly
- Layout animations for smooth bounding box selection/deselection
- Works alongside MUI — use MUI transitions for simple tooltips/menus, Framer Motion for the core viewer transitions
- The bundle size cost is justified by the UX quality it enables

### Decision 3: Export Library — pdf-lib (Recommended)

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **pdf-lib** ✅ | Pure JS (no native deps), precise text positioning with x/y coords, font embedding, works in browser | No HTML-to-PDF (must place elements manually) | Pixel-accurate positional text |
| jsPDF | Popular, HTML plugin available | Less precise positioning, font handling quirks | Simple PDF generation |
| html2canvas | Captures DOM as-is | Rasterised (not searchable text), quality varies, slow | Screenshot-style export |

**Recommendation: pdf-lib for primary export, html2canvas as fallback**
- pdf-lib maps directly to our data model — each region has `(x1, y1, x2, y2)` and `text`, which translates directly to `page.drawText(text, { x, y })` calls
- Produces real text (searchable, selectable) in the PDF
- html2canvas as a secondary option for "visual snapshot" export if needed

### Decision 4: Comparison Slider — react-compare-slider (Recommended)

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **react-compare-slider** ✅ | Active maintenance, keyboard accessible, responsive, customisable handle, supports any React children (not just images) | Limited to two-item comparison | Image/component comparison |
| react-image-comparison-slider | Simple API | Image-only (no React children), less maintained | Basic image diff |
| Custom CSS clip-path | Full control, zero dependencies | Must implement keyboard/touch/accessibility ourselves | Unique requirements |

**Recommendation: react-compare-slider**
- Accepts React children, so the "after" side can be the document image with corrected text overlaid (rendered live, not a static image)
- Keyboard accessible out of the box
- Gradual reveal works as specified in PRD
- If customisation hits a wall, the CSS clip-path approach is a viable fallback

### Decision 5: Zoom/Pan — react-zoom-pan-pinch (Recommended)

| Library | Pros | Cons | Best For |
|---------|------|------|----------|
| **react-zoom-pan-pinch** ✅ | Lightweight, wraps any content, CSS transform-based (SVG overlays stay aligned), touch support | Limited to transform-based zoom | Zooming a container with child elements |
| OpenSeadragon | Tile-based deep zoom, handles huge images | Overkill for our scale, complex integration with React | Gigapixel images |
| Konva.js | Full canvas toolkit, built-in zoom/pan | Canvas-based (conflicts with SVG overlay decision) | Canvas-first apps |

**Recommendation: react-zoom-pan-pinch**
- Wraps the image + SVG overlay container together, so both zoom in sync automatically
- CSS transform-based means SVG elements maintain their DOM event handling at any zoom level
- Lightweight, simple API, no conflict with our SVG overlay approach

---

## Component Design

### Project Structure

```
reviso/
├── public/
│   └── dummy/                    # Bundled dummy data
│       ├── documents.json        # Document manifest
│       ├── doc1/
│       │   ├── page1.jpg
│       │   ├── page2.jpg
│       │   └── regions.json      # Text regions per page
│       └── doc2/
│           ├── page1.jpg
│           └── regions.json
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx      # Top-level layout (sidebar + main)
│   │   │   ├── TopBar.tsx        # Breadcrumb, page nav, export button
│   │   │   └── Sidebar.tsx       # Document list + page thumbnails
│   │   ├── viewer/
│   │   │   ├── DocumentViewer.tsx # Main viewer container (zoom/pan wrapper)
│   │   │   ├── PageImage.tsx     # Document page image renderer
│   │   │   ├── OverlayLayer.tsx  # SVG overlay container for all regions
│   │   │   ├── TextRegion.tsx    # Single region (rect + text display)
│   │   │   └── RegionCreator.tsx # Draw/place new regions
│   │   ├── editor/
│   │   │   ├── InlineEditor.tsx  # Text input positioned over a region
│   │   │   └── EditorToolbar.tsx # Edit mode controls (save, cancel, delete)
│   │   ├── comparison/
│   │   │   ├── ComparisonSlider.tsx  # Before/after wrapper
│   │   │   ├── BeforeView.tsx        # Original damaged document
│   │   │   └── AfterView.tsx         # Restored with corrected text
│   │   ├── export/
│   │   │   ├── ExportDialog.tsx      # Export options (JSON, PDF)
│   │   │   └── PdfExporter.tsx       # pdf-lib generation logic
│   │   └── common/
│   │       ├── KeyboardShortcuts.tsx  # Global shortcut handler
│   │       └── ShortcutHelp.tsx      # Shortcut help overlay
│   ├── hooks/
│   │   ├── useKeyboardNavigation.ts  # Tab/arrow/enter/escape handling
│   │   ├── useRegionInteraction.ts   # Click, hover, select logic
│   │   ├── useZoomSync.ts           # Zoom level coordination
│   │   └── useFileUpload.ts         # File picker + JSON parsing
│   ├── stores/
│   │   ├── documentStore.ts     # Documents, pages, regions data
│   │   ├── uiStore.ts           # UI state (selected doc/page, mode, sidebar)
│   │   └── editHistoryStore.ts  # Undo/redo stack (P2)
│   ├── types/
│   │   ├── document.ts          # Document, Page, Region types
│   │   ├── editor.ts            # Edit state types
│   │   └── ui.ts                # UI state types
│   ├── utils/
│   │   ├── coordinates.ts       # Coordinate transforms (image ↔ screen)
│   │   ├── exportPdf.ts         # PDF generation logic
│   │   ├── exportJson.ts        # JSON export logic
│   │   └── dummyData.ts         # Dummy data loader
│   ├── theme/
│   │   └── theme.ts             # MUI 6 dark theme config (#0bda90)
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### Component Tree

```
<App>
  <ThemeProvider theme={darkTheme}>
    <AppShell>
      ├── <Sidebar>
      │   ├── <DocumentList>
      │   │   └── <DocumentItem> (per document)
      │   │       └── <PageThumbnail> (per page)
      │   └── <FileUploadButton>
      │
      ├── <TopBar>
      │   ├── <Breadcrumb> (Document > Page X of Y)
      │   ├── <PageNavigator> (prev/next arrows, page indicator)
      │   ├── <ViewModeToggle> (Edit | Compare)
      │   └── <ExportButton>
      │
      └── <MainContent>
          ├── [Edit Mode]
          │   <DocumentViewer>
          │     <TransformWrapper> (react-zoom-pan-pinch)
          │       <TransformComponent>
          │         <PageImage src={currentPage.image} />
          │         <OverlayLayer>
          │           <TextRegion /> (per region — SVG rect + text)
          │           <RegionCreator /> (when adding new)
          │         </OverlayLayer>
          │         <InlineEditor /> (when editing a region)
          │       </TransformComponent>
          │     </TransformWrapper>
          │
          ├── [Compare Mode]
          │   <ComparisonSlider>
          │     <BeforeView> (original damaged image)
          │     <AfterView> (image + corrected text overlay)
          │   </ComparisonSlider>
          │
          └── <KeyboardShortcuts /> (global listener)
    </AppShell>
    <ExportDialog /> (modal, triggered by export button)
    <ShortcutHelp /> (modal, triggered by ?)
  </ThemeProvider>
</App>
```

---

## Data Model

### TypeScript Types

```typescript
// types/document.ts

interface Document {
  id: string;
  name: string;
  pages: Page[];
  createdAt: string;
}

interface Page {
  id: string;
  documentId: string;
  pageNumber: number;
  imageSrc: string;           // URL or data URI for the page image
  imageWidth: number;         // Original image width in pixels
  imageHeight: number;        // Original image height in pixels
  regions: TextRegion[];
}

interface TextRegion {
  id: string;
  pageId: string;
  x1: number;                 // Bounding box coordinates (image pixels)
  y1: number;
  x2: number;
  y2: number;
  originalText: string;       // Text from OCR service (immutable)
  currentText: string;        // Current text (editable)
  isEdited: boolean;          // Has been modified
  isNew: boolean;             // Created by user (not from OCR)
  confidence?: number;        // OCR confidence score (future use)
}

// The JSON schema matching the OCR service output
interface OcrOutput {
  documents: Array<{
    name: string;
    pages: Array<{
      image: string;          // Filename or path
      width: number;
      height: number;
      regions: Array<{
        x1: number;
        y1: number;
        x2: number;
        y2: number;
        text: string;
      }>;
    }>;
  }>;
}
```

### Dummy Data Shape

```json
{
  "documents": [
    {
      "name": "Receipt-2024-001",
      "pages": [
        {
          "image": "doc1/page1.jpg",
          "width": 1200,
          "height": 1600,
          "regions": [
            { "x1": 100, "y1": 50, "x2": 400, "y2": 90, "text": "GROCERY STORE" },
            { "x1": 100, "y1": 100, "x2": 350, "y2": 130, "text": "123 Main St" },
            { "x1": 100, "y1": 200, "x2": 300, "y2": 230, "text": "Appl3s x2" },
            { "x1": 300, "y1": 200, "x2": 400, "y2": 230, "text": "$3.99" }
          ]
        }
      ]
    }
  ]
}
```

Note: The dummy data should include intentional OCR errors (e.g., `Appl3s` instead of `Apples`, `0range` instead of `Orange`) to demonstrate the editing workflow.

---

## State Management

### Zustand Store Design

Three separate stores with clear responsibilities:

#### documentStore — Data layer

```typescript
// stores/documentStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface DocumentState {
  documents: Document[];
  
  // Actions
  loadDocuments: (data: OcrOutput) => void;
  updateRegionText: (pageId: string, regionId: string, text: string) => void;
  addRegion: (pageId: string, region: Omit<TextRegion, 'id'>) => void;
  deleteRegion: (pageId: string, regionId: string) => void;
  resetRegion: (pageId: string, regionId: string) => void;  // Revert to original
  
  // Selectors
  getDocument: (docId: string) => Document | undefined;
  getPage: (pageId: string) => Page | undefined;
  getEditedRegions: () => TextRegion[];
  getExportData: () => OcrOutput;  // Corrected JSON in original format
}
```

#### uiStore — UI state

```typescript
// stores/uiStore.ts
interface UiState {
  // Navigation
  activeDocumentId: string | null;
  activePageId: string | null;
  
  // Selection
  selectedRegionId: string | null;
  hoveredRegionId: string | null;
  
  // Mode
  viewMode: 'edit' | 'compare';
  isCreatingRegion: boolean;
  
  // Sidebar
  sidebarOpen: boolean;
  
  // Actions
  setActiveDocument: (docId: string) => void;
  setActivePage: (pageId: string) => void;
  selectRegion: (regionId: string | null) => void;
  hoverRegion: (regionId: string | null) => void;
  setViewMode: (mode: 'edit' | 'compare') => void;
  toggleSidebar: () => void;
  
  // Navigation helpers
  nextPage: () => void;
  prevPage: () => void;
  nextRegion: () => void;
  prevRegion: () => void;
}
```

#### editHistoryStore — Undo/redo (P2, but designed now)

```typescript
// stores/editHistoryStore.ts
interface EditAction {
  type: 'UPDATE_TEXT' | 'ADD_REGION' | 'DELETE_REGION';
  pageId: string;
  regionId: string;
  previousValue: Partial<TextRegion>;
  newValue: Partial<TextRegion>;
  timestamp: number;
}

interface EditHistoryState {
  past: EditAction[];
  future: EditAction[];
  
  pushAction: (action: EditAction) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}
```

**Why three stores instead of one:**
- Separation of concerns — data changes don't re-render UI-only components
- `uiStore` changes frequently (hover, selection) but shouldn't trigger data recalculations
- `editHistoryStore` can be added later without refactoring the other stores
- Each store is independently testable

**Why immer middleware on documentStore:**
- Nested data (documents → pages → regions) is painful to update immutably by hand
- immer allows `state.documents[i].pages[j].regions[k].currentText = newText` syntax
- Only on documentStore — uiStore is flat enough to not need it

---

## Core Implementation Details

### 1. SVG Overlay Rendering

The overlay layer renders as an SVG element sized to match the document image, positioned absolutely on top of it. All coordinates map directly from the JSON data to SVG space.

```typescript
// Conceptual structure of OverlayLayer.tsx
<svg
  width={imageWidth}
  height={imageHeight}
  viewBox={`0 0 ${imageWidth} ${imageHeight}`}
  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
>
  {regions.map(region => (
    <TextRegion
      key={region.id}
      region={region}
      isSelected={region.id === selectedRegionId}
      isHovered={region.id === hoveredRegionId}
      onSelect={() => selectRegion(region.id)}
      onHover={() => hoverRegion(region.id)}
      style={{ pointerEvents: 'all' }}  // Re-enable events on interactive elements
    />
  ))}
</svg>
```

**Key implementation notes:**
- The SVG `viewBox` matches the original image dimensions, so region coordinates map 1:1
- `react-zoom-pan-pinch` wraps both the image and SVG together — they zoom in sync automatically
- `pointerEvents: 'none'` on the SVG root prevents it from blocking image interaction, but `'all'` on individual regions makes them clickable
- Region visual states are controlled via SVG fill/stroke/opacity tied to MUI theme tokens

### 2. Inline Text Editing

When a region is selected for editing, an HTML input is positioned over the SVG region using absolute positioning calculated from the region's coordinates and the current zoom/pan transform.

```typescript
// Conceptual approach for InlineEditor.tsx
// Positioned outside the SVG (HTML input for native text editing UX)
// Coordinates calculated by:
//   1. Region coords (x1, y1, x2, y2) in image space
//   2. Transformed through current zoom/pan matrix
//   3. Positioned absolutely in the viewer container

<input
  type="text"
  value={currentText}
  onChange={handleChange}
  onKeyDown={handleKeyDown}  // Enter to confirm, Escape to cancel, Tab to next
  style={{
    position: 'absolute',
    left: transformedX1,
    top: transformedY1,
    width: transformedWidth,
    height: transformedHeight,
  }}
  autoFocus
/>
```

**Why HTML input over SVG `<foreignObject>`:**
- Native text input behaviour (selection, cursor, clipboard)
- Better IME support for international text
- Consistent styling with MUI text field
- `<foreignObject>` has cross-browser quirks

### 3. Region Creation

Users can create new text regions by clicking a "Add Region" tool and then drawing on the document image.

```
User flow:
1. Click "Add Region" button → enters creation mode
2. Click and drag on document image → draws a rectangle
3. Release → rectangle finalised, inline editor opens immediately
4. Type text → Enter to confirm
5. New region saved with isNew: true
```

**Implementation approach:**
- In creation mode, mouse events on the image/SVG layer are intercepted
- `mousedown` records start point, `mousemove` draws preview rect, `mouseup` finalises
- Coordinates are calculated in image space (inverse of current zoom/pan transform)
- On confirm, dispatches `addRegion` to documentStore

### 4. Zoom/Pan with Overlay Sync

```typescript
// DocumentViewer.tsx structure
<TransformWrapper
  initialScale={1}
  minScale={0.5}
  maxScale={4}
  limitToBounds={false}
>
  <TransformComponent>
    {/* Both image and SVG overlay are children of the same transform container */}
    <div style={{ position: 'relative' }}>
      <PageImage src={currentPage.imageSrc} />
      <OverlayLayer regions={currentPage.regions} />
    </div>
  </TransformComponent>
</TransformWrapper>
```

**Why this works:**
- `TransformComponent` applies CSS `transform: matrix(...)` to its child container
- Both the image and SVG overlay are inside the same transformed container
- They zoom and pan together automatically — no manual sync needed
- SVG click events still work because CSS transforms don't break DOM events

**For the InlineEditor (positioned outside the transform):**
- Use `useTransformContext()` from react-zoom-pan-pinch to get current transform state
- Calculate screen position from image coordinates × current transform matrix
- Reposition on zoom/pan changes

### 5. Before/After Comparison Slider

```typescript
// ComparisonSlider.tsx
import { ReactCompareSlider } from 'react-compare-slider';

<ReactCompareSlider
  itemOne={<BeforeView imageSrc={originalImage} />}
  itemTwo={<AfterView imageSrc={restoredImage} regions={correctedRegions} />}
  position={50}  // Start at middle
  portrait={false}  // Horizontal slider
/>
```

**"Before" side:** The original damaged document image (no overlays)

**"After" side:** The document image with corrected text rendered on top. Two approaches:

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| SVG overlay on image | Live, always matches current edits | Regions visible as overlays | ✅ Use this for PoC |
| Pre-rendered canvas/image | Clean final look | Must re-render on every edit | Future enhancement |

For the PoC, the "after" view reuses the same SVG overlay approach as the edit view, but with regions rendered as filled text (not editable rectangles).

### 6. Export Implementation

#### JSON Export
Straightforward — transform the documentStore data back to the input schema format:

```typescript
// utils/exportJson.ts
function exportToJson(documents: Document[]): OcrOutput {
  return {
    documents: documents.map(doc => ({
      name: doc.name,
      pages: doc.pages.map(page => ({
        image: page.imageSrc,
        width: page.imageWidth,
        height: page.imageHeight,
        regions: page.regions.map(region => ({
          x1: region.x1,
          y1: region.y1,
          x2: region.x2,
          y2: region.y2,
          text: region.currentText,  // Use corrected text
        })),
      })),
    })),
  };
}
```

#### PDF Export (pdf-lib)

```typescript
// utils/exportPdf.ts — conceptual approach
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

async function exportToPdf(pages: Page[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  for (const page of pages) {
    // Create PDF page matching image dimensions
    const pdfPage = pdfDoc.addPage([page.imageWidth, page.imageHeight]);
    
    // Embed and draw the document image
    const imageBytes = await fetch(page.imageSrc).then(r => r.arrayBuffer());
    const image = await pdfDoc.embedJpg(imageBytes); // or embedPng
    pdfPage.drawImage(image, {
      x: 0, y: 0,
      width: page.imageWidth,
      height: page.imageHeight,
    });
    
    // Draw each text region at its coordinates
    for (const region of page.regions) {
      const fontSize = estimateFontSize(region);  // Based on region height
      pdfPage.drawText(region.currentText, {
        x: region.x1,
        y: page.imageHeight - region.y2,  // PDF Y-axis is bottom-up
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });
    }
  }
  
  return pdfDoc.save();
}
```

**Note on PDF coordinate system:** PDF uses bottom-left origin, while our JSON uses top-left origin. The conversion is: `pdfY = imageHeight - jsonY2`.

---

## Theme Configuration

```typescript
// theme/theme.ts
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
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});
```

### Region Visual States (Theme Tokens)

| State | Fill | Stroke | Opacity | Notes |
|-------|------|--------|---------|-------|
| Default | transparent | `#0bda90` (primary) | 0.3 stroke | Subtle, non-distracting |
| Hover | `#0bda90` | `#0bda90` | 0.1 fill, 0.6 stroke | Brighter, text preview tooltip |
| Selected | `#0bda90` | `#0bda90` | 0.15 fill, 1.0 stroke | Strong accent, editor visible |
| Edited | `#4de8ab` (primary.light) | `#4de8ab` | 0.15 fill, 0.6 stroke | Slightly different hue to indicate change |
| New (user-created) | `#ffa726` (orange) | `#ffa726` | 0.15 fill, 0.6 stroke | Distinct colour — not from OCR |
| Error | `#ef5350` (red) | `#ef5350` | 0.15 fill, 0.6 stroke | Future use — validation errors |

---

## Keyboard Shortcuts Implementation

```typescript
// hooks/useKeyboardNavigation.ts
// Global keyboard handler, registered once at App level

const SHORTCUTS = {
  'Tab':           'selectNextRegion',
  'Shift+Tab':     'selectPrevRegion',
  'Enter':         'confirmEdit',
  'Escape':        'cancelEdit / deselect',
  'ArrowRight':    'nextPage',      // When no region is being edited
  'ArrowLeft':     'prevPage',      // When no region is being edited
  'PageDown':      'nextPage',
  'PageUp':        'prevPage',
  'Shift+?':       'toggleShortcutHelp',
  'n':             'enterCreateRegionMode',
  'Delete':        'deleteSelectedRegion',
  'Ctrl+z':        'undo',          // P2
  'Ctrl+Shift+z':  'redo',          // P2
  'Ctrl+e':        'toggleCompareMode',
  'Ctrl+s':        'exportJson',
};
```

**Conflict avoidance:** When the inline editor input is focused, arrow keys and letter keys are NOT intercepted (they control the text cursor). Only Tab, Enter, Escape, and Ctrl+ shortcuts are active during editing.

---

## Performance Considerations

### Targets
| Metric | Target | Measurement |
|--------|--------|-------------|
| Initial load | < 2 seconds | Lighthouse |
| Page switch | < 200ms perceived | Chrome DevTools |
| Region render (50 regions) | < 50ms | React Profiler |
| Zoom/pan | 60fps | Chrome FPS counter |
| Export (5-page PDF) | < 3 seconds | Manual timing |

### Optimisations

1. **Lazy load page images:** Only load images for the current page + adjacent pages (prefetch next/prev)
2. **Memoize region components:** `React.memo` on `TextRegion` — only re-render when the region's own data or selection state changes
3. **Debounce hover state:** Debounce `hoverRegion` calls by ~16ms to avoid excessive re-renders during fast mouse movement
4. **Virtualise sidebar thumbnails:** If document list grows long, virtualise with a lightweight library (not needed for PoC scale but note for future)
5. **Optimise SVG rendering:** Use `will-change: transform` on the SVG container for GPU-accelerated zoom/pan

---

## Development Workflow

### AI Coding Assistant: Claude Code (CLI)

#### Recommended Workflow

```
1. Plan: Describe the feature/component to Claude Code
2. Generate: Let it scaffold the component
3. Review: Check the output, adjust types and logic
4. Test: Run the app, verify visually
5. Commit: Simple commit to main
```

#### Effective Prompts for Reviso

**Component generation:**
```
Create a React TypeScript component for [component name].
Stack: React 18, MUI 6, Zustand, Framer Motion.
Theme: Dark theme, primary #0bda90.
Requirements:
- [Requirement from this doc]
- [Requirement from this doc]
Follow the project structure in src/components/[category]/.
```

**State management:**
```
Create a Zustand store for [store name] using immer middleware.
Types are defined in src/types/[type file].
Actions needed: [list actions]
The store should [specific behavior].
```

### Git Strategy

Simple commits to main:
```bash
git add .
git commit -m "feat: [description]"
```

**Commit message convention (lightweight):**
- `feat: ` — new feature
- `fix: ` — bug fix
- `refactor: ` — code restructuring
- `style: ` — visual/styling changes

### Testing Strategy (Minimal for PoC)

- **Manual testing** as primary approach
- **Console checks** — no unhandled errors or warnings
- **Browser testing** — verify on Chrome, Firefox, Safari, Edge before considering PoC complete
- **If time permits:** Add a few unit tests for coordinate transform utilities and export logic (these are the most error-prone pure functions)

---

## Implementation Roadmap

### Phase 1: Foundation (Day 1-2)
- [ ] Vite + React 18 + TypeScript project scaffold
- [ ] MUI 6 dark theme configuration (#0bda90)
- [ ] Zustand stores (documentStore, uiStore) with types
- [ ] Dummy data creation (2 documents, 2-3 pages each, ~20 regions per page with intentional OCR errors)
- [ ] AppShell layout (sidebar + main viewer + top bar)

### Phase 2: Core Viewer (Day 3-4)
- [ ] PageImage component (render document image)
- [ ] OverlayLayer + TextRegion (SVG overlay with regions)
- [ ] react-zoom-pan-pinch integration (zoom/pan with overlay sync)
- [ ] Region visual states (default, hover, selected)
- [ ] Sidebar with document list and page thumbnails
- [ ] Page navigation (click sidebar + top bar prev/next)

### Phase 3: Inline Editing (Day 5-6)
- [ ] InlineEditor component (positioned input over region)
- [ ] Click to select → edit workflow
- [ ] Enter to confirm, Escape to cancel
- [ ] Tab to advance to next region
- [ ] Visual "edited" state on modified regions
- [ ] Region creation (draw new region + type text)

### Phase 4: Multi-Document Navigation (Day 7)
- [ ] Document switching in sidebar
- [ ] Framer Motion page/document transitions
- [ ] Breadcrumb in top bar
- [ ] Keyboard shortcuts for navigation (arrows, Page Up/Down)

### Phase 5: Comparison Slider (Day 8-9)
- [ ] react-compare-slider integration
- [ ] BeforeView (original image)
- [ ] AfterView (image + corrected text overlay)
- [ ] View mode toggle (Edit ↔ Compare)

### Phase 6: Export (Day 9-10)
- [ ] JSON export (corrected data in original schema)
- [ ] PDF export with pdf-lib (text at correct positions)
- [ ] Export dialog with format selection
- [ ] Download trigger

### Phase 7: Polish (Day 11-14, if time permits)
- [ ] Smooth transitions everywhere (Framer Motion)
- [ ] Keyboard shortcut help overlay (?)
- [ ] File upload option (load custom JSON + images)
- [ ] Undo/redo (editHistoryStore)
- [ ] Find-and-replace across regions
- [ ] Progress indicator (X of Y pages reviewed)
- [ ] Final browser testing (Chrome, Firefox, Safari, Edge)

---

## Dependencies (package.json)

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "@mui/material": "^6.0.0",
    "@mui/icons-material": "^6.0.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "zustand": "^4.5.0",
    "immer": "^10.0.0",
    "framer-motion": "^11.0.0",
    "react-zoom-pan-pinch": "^3.4.0",
    "react-compare-slider": "^3.1.0",
    "pdf-lib": "^1.17.0",
    "nanoid": "^5.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.4.0",
    "@vitejs/plugin-react": "^4.3.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0"
  }
}
```

**Total production dependencies:** 11 packages (lean for a React app)
**Bundle size estimate:** ~250-300KB gzipped (React + MUI + Framer Motion dominate)

---

## Cost Analysis (Surface)

| Item | Cost | Notes |
|------|------|-------|
| Development tools | $0 | VS Code + Claude Code (with existing subscription) |
| Libraries | $0 | All open-source, MIT/Apache licensed |
| Hosting | $0 | Local only |
| Total | **$0** | Fully free PoC |

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| SVG performance with 50 regions | Low | Medium | Profile early; `React.memo` on regions; canvas fallback documented |
| Inline editor positioning breaks on zoom | Medium | High | Calculate position from transform matrix; test at multiple zoom levels on day 3-4 |
| PDF export text misalignment | Medium | High | Prototype export on day 1-2 with a simple test; verify coordinate transform (PDF Y-axis flip) |
| react-compare-slider limitations | Low | Medium | Custom CSS clip-path fallback is straightforward |
| Scope creep past 2 weeks | High | Medium | Strict phase boundaries; Phase 7 is "if time permits" only |
| MUI 6 + Framer Motion conflicts | Low | Low | Use MUI transitions for simple cases, Framer for complex; keep separate |

---

## Future Enhancements (Post-PoC)

### AI-Assisted Corrections (Deferred)
All four AI features from requirements gathering, to be added post-PoC:

1. **Auto-suggest corrections for OCR errors**
   - Approach: Local model (Ollama) or browser-based (Transformers.js)
   - Constraint: Must work offline
   
2. **Auto-detect likely errors (confidence scoring)**
   - Approach: Heuristic scoring + optional ML model
   - Display: Colour-coded confidence on each region
   
3. **Batch correct common OCR mistakes**
   - Approach: Rule-based patterns (0↔O, 1↔l, rn↔m) + learned patterns
   - UI: "Auto-fix common errors" button with preview

4. **AI reads image and suggests missing regions**
   - Approach: Local OCR model or vision model
   - UI: "Suggest missing regions" with accept/reject flow

### Other Future Features
- Mobile responsive layout
- Backend integration (real OCR service)
- Collaborative editing (WebSocket-based)
- Document versioning
- Batch document processing
- Custom export templates

---

*Technical Design for: Reviso MVP*
*Approach: Pure SPA, React 18 + TypeScript + Vite + MUI 6 + Zustand*
*Estimated Time: 1-2 weeks*
*Estimated Cost: $0/month*
*Version: 1.0*
*Last Updated: February 28, 2026*
