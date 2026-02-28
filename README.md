# Reviso

A lightweight PDF and image annotation tool — upload any document, draw text regions, and export your annotations as JSON, PDF, or PNG.

## Features

- **Document Viewer** — zoom/pan document pages with SVG text region overlays
- **Inline Editing** — click a region to edit text, Tab/Shift+Tab to navigate between regions
- **Region Management** — create, resize, move, delete text regions; customise font color, border, background
- **Comparison Mode** — before/after slider comparing original vs annotated pages with zoom/pan
- **PDF Upload** — upload PDF files; pages are rendered via pdf.js and displayed as images
- **JSON Upload** — upload structured JSON with document/page/region data
- **Export** — JSON (structured data), PDF (text at original positions), PNG (page image with overlays)
- **Undo/Redo** — Ctrl+Z / Ctrl+Shift+Z with full snapshot history
- **Keyboard Shortcuts** — press `?` to see all available shortcuts

## Prerequisites

- **Node.js** >= 18
- **npm** >= 8

## Setup

```bash
git clone <repo-url>
cd reviso
npm install
```

## Development

```bash
npm run dev
```

Opens the app at `http://localhost:5173`. A sample PDF and PNG are loaded as default documents on startup.

## Commands

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
├── public/                     # Static assets served as-is
│   ├── sample-doc.pdf          # Default sample PDF
│   └── sample-receipt.png      # Default sample PNG
├── sample/                     # Sample files for manual upload testing
│   ├── sample-upload.json
│   └── sample-pdf-regions.json
├── src/
│   ├── components/
│   │   ├── common/             # Shared components (KeyboardHelpDialog, DebouncedColorPicker)
│   │   ├── comparison/         # ComparisonSlider, AfterImage
│   │   ├── editor/             # InlineEditor, RegionCreator
│   │   ├── export/             # ExportDialog
│   │   ├── layout/             # AppShell, TopBar, Sidebar
│   │   └── viewer/             # DocumentViewer, PageImage, OverlayLayer, TextRegion
│   ├── hooks/                  # useNavigationKeyboard, useEditorKeyboard
│   ├── stores/                 # Zustand stores (documentStore, uiStore, editHistoryStore)
│   ├── types/                  # TypeScript type definitions
│   ├── utils/                  # Export, parsing, and helper utilities
│   ├── theme/                  # MUI dark theme configuration
│   ├── App.tsx                 # Root component — loads default documents
│   └── main.tsx                # Entry point
├── AGENTS.md                   # Development roadmap and agent instructions
├── CLAUDE.md                   # Claude Code configuration
└── agent_docs/                 # Detailed technical documentation
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript 5 (strict) | Type safety |
| Vite 5 | Dev server + bundler |
| MUI 6 | Component library, dark theme |
| Zustand 5 + Immer | State management |
| Framer Motion | Page/document transitions |
| react-zoom-pan-pinch | Document viewer zoom/pan |
| react-compare-slider | Before/after comparison |
| pdfjs-dist | PDF rendering in browser |
| pdf-lib | PDF export generation |
| nanoid | Unique ID generation |
