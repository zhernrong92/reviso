# Reviso

An embeddable React component for visually verifying and correcting text regions on document images. Upload PDFs or images, draw text regions, edit text inline, and export as JSON, PDF, or PNG.

## Features

- **Embeddable Component** — drop `<Reviso />` into any React app with a single import
- **Document Viewer** — zoom/pan document pages with SVG text region overlays
- **Inline Editing** — click a region to edit text, Tab/Shift+Tab to navigate between regions
- **Region Management** — create, resize, move, delete text regions; customise font, color, border, background, text position
- **Region Validation** — per-region checkmark to track review progress; progress bar in toolbar shows validated/total count
- **Text Visibility Toggle** — show/hide all region text labels while keeping region boxes visible
- **Collapsible Style Toolbar** — region style controls (font, border, background, text position) collapsed behind a gear icon to reduce clutter
- **Comparison Mode** — before/after slider comparing original vs annotated pages
- **Export** — JSON (structured data), PDF (text at original positions), PNG (page image with overlays)
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z with full snapshot history
- **Theme Integration** — inherits host app's MUI theme, accepts theme overrides
- **Feature Toggles** — enable/disable editing, region creation, comparison, export via props
- **Keyboard Shortcuts** — press `?` to see all available shortcuts

## Using the Component

### 1. Copy the component

Copy the `src/reviso/` folder into your project.

### 2. Install peer dependencies

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled zustand immer framer-motion react-zoom-pan-pinch react-compare-slider jspdf pdf-lib nanoid
```

### 3. Import and use

```tsx
import { Reviso } from './reviso';
import type { RevisoDocument } from './reviso';

const document: RevisoDocument = {
  id: 'doc-1',
  name: 'My Document',
  pages: [
    {
      id: 'page-1',
      pageNumber: 1,
      imageSrc: '/path/to/page-image.png',
      originalImageSrc: '/path/to/original-image.png',
      width: 1200,
      height: 1600,
      regions: [
        {
          id: 'region-1',
          x: 100,
          y: 200,
          width: 300,
          height: 40,
          text: 'Corrected text',
          originalText: 'Original OCR text',
          // Optional styling
          fontColor: '#4dabf7',
          fontFamily: 'Inter',
          fontWeight: 'normal',        // 'normal' | 'bold'
          fontStyle: 'normal',         // 'normal' | 'italic'
          textDecoration: 'none',      // 'none' | 'line-through'
          borderColor: '#4caf50',
          borderVisible: true,
          backgroundColor: 'transparent',
          textPosition: 'inside',      // 'inside' | 'top' | 'bottom'
          isValidated: false,          // validation tracking
        },
      ],
    },
  ],
};

function App() {
  return (
    <Reviso
      document={document}
      onChange={(doc) => console.log('Document changed:', doc)}
      onPageChange={(pageId) => console.log('Page:', pageId)}
      onSelectionChange={(regionId) => console.log('Selection:', regionId)}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `document` | `RevisoDocument` | required | The document to display and edit |
| `editable` | `boolean` | `true` | Enable/disable editing |
| `showSidebar` | `boolean` | `true` | Show/hide page thumbnail sidebar |
| `showToolbar` | `boolean` | `true` | Show/hide the inline toolbar |
| `features` | `{ comparison?, export?, regionCreation? }` | all `true` | Feature toggles |
| `defaultRegionStyles` | `object` | — | Default styles for new regions (see below) |
| `theme` | `ThemeOptions` | — | MUI theme overrides |
| `initialPageId` | `string` | first page | Initial page to display |
| `onChange` | `(doc: RevisoDocument) => void` | — | Fired on any change |
| `onRegionChange` | `(event) => void` | — | Granular per-region change event (`{ type, pageId, regionId, region? }`) |
| `onPageChange` | `(pageId: string) => void` | — | Fired on page navigation |
| `onSelectionChange` | `(regionId: string \| null) => void` | — | Fired on region select/deselect |
| `onExport` | `(format, data: Blob) => void` | — | Intercept export (replaces auto-download) |

#### `defaultRegionStyles`

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `fontColor` | `string` | `'#4dabf7'` | Text color (blue) |
| `fontFamily` | `string` | `'Inter'` | Font family |
| `fontWeight` | `'normal' \| 'bold'` | `'normal'` | Font weight |
| `fontStyle` | `'normal' \| 'italic'` | `'normal'` | Font style |
| `textDecoration` | `'none' \| 'line-through'` | `'none'` | Text decoration |
| `borderColor` | `string` | `'#4caf50'` | Region border color (green) |
| `borderVisible` | `boolean` | `true` | Show/hide region border |
| `backgroundColor` | `string` | `'transparent'` | Region background fill |
| `textPosition` | `'inside' \| 'top' \| 'bottom'` | `'inside'` | Where text renders relative to the region box |

#### When does `onChange` fire?

`onChange` fires once per discrete user action — it does **not** fire continuously during drag operations.

| Action | When it fires |
|--------|---------------|
| Edit text | On commit (Enter, Tab, or blur — not on every keystroke) |
| Move region | On mouse release (not during drag) |
| Resize region | On mouse release (not during drag) |
| Create region | When the new region is added |
| Delete region | Immediately on delete |
| Change style | Immediately on each change (bold, italic, color, text position, etc.) |
| Toggle validation | Immediately when region checkmark is clicked |
| Undo / Redo | Immediately on restore |

## Development (Demo App)

### Prerequisites

- **Node.js** >= 18
- **npm** >= 8

### Setup

```bash
git clone <repo-url>
cd reviso
npm install
npm run dev
```

The dev server runs two demo routes:
- `/` — Legacy standalone demo with file upload, multi-document support
- `/reviso` — Embeddable component demo with a simulated host app layout

### Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Production build (type-check + bundle) |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint check |

## Project Structure

```
reviso/
├── public/                        # Static assets
│   ├── sample-doc.pdf             # Sample PDF for demos
│   └── sample-receipt.png         # Sample PNG for demos
├── src/
│   ├── reviso/                    # ← EMBEDDABLE COMPONENT (copy this folder)
│   │   ├── components/
│   │   │   ├── common/            # KeyboardHelpDialog, DebouncedColorPicker
│   │   │   ├── comparison/        # ComparisonSlider, AfterImage
│   │   │   ├── editor/            # InlineEditor, RegionCreator
│   │   │   ├── export/            # ExportDialog
│   │   │   ├── layout/            # InlineToolbar, PageThumbnails
│   │   │   └── viewer/            # DocumentViewer, PageImage, OverlayLayer
│   │   ├── hooks/                 # useNavigationKeyboard, useEditorKeyboard
│   │   ├── stores/                # Zustand stores (document, ui, editHistory)
│   │   ├── types/                 # TypeScript types (public API + internal)
│   │   ├── utils/                 # Export, type mappers, helpers
│   │   ├── theme/                 # MUI dark theme config
│   │   ├── Reviso.tsx             # Main component entry point
│   │   └── index.ts               # Barrel exports
│   ├── legacy/                    # Legacy demo files (not part of component)
│   │   ├── components/            # AppShell, TopBar, Sidebar, DocumentList
│   │   └── utils/                 # parsePdf, parseUploadedJson, dummyData
│   ├── App.tsx                    # Demo app with routing
│   ├── RevisoDemo.tsx             # Component demo page
│   └── main.tsx                   # Entry point
├── AGENTS.md                      # Development roadmap
├── CLAUDE.md                      # Claude Code configuration
└── agent_docs/                    # Technical documentation
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript 5 (strict) | Type safety |
| Vite 5 | Dev server + bundler |
| MUI 6 | Component library, theming |
| Zustand 5 + Immer | State management |
| Framer Motion | Page transitions |
| react-zoom-pan-pinch | Document viewer zoom/pan |
| react-compare-slider | Before/after comparison |
| pdf-lib | PDF export generation |
| nanoid | Unique ID generation |
