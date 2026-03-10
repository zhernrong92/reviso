# @zhernrong92/reviso

An embeddable React component for visually verifying and correcting text regions on document images. Draw text regions, edit text inline, and export as JSON, PDF, or PNG.

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

## Installation

### 1. Configure registry

Add to your project's `.npmrc`:

```
@zhernrong92:registry=https://npm.pkg.github.com
```

### 2. Install

```bash
npm install @zhernrong92/reviso
```

### 3. Install peer dependencies

```bash
npm install react react-dom @mui/material @mui/icons-material @emotion/react @emotion/styled framer-motion
```

## Usage

```tsx
import { Reviso } from '@zhernrong92/reviso';
import type { RevisoDocument } from '@zhernrong92/reviso';

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
        },
      ],
    },
  ],
};

function App() {
  return (
    <Reviso
      document={document}
      onChange={(dirtyPages) => console.log('Dirty pages:', dirtyPages)}
      onPageChange={(pageId) => console.log('Page:', pageId)}
      onSelectionChange={(regionId) => console.log('Selection:', regionId)}
    />
  );
}
```

### Theming

Reviso automatically inherits the MUI theme from a parent `ThemeProvider`. You can also pass a `theme` prop for component-level overrides — these are deep-merged on top of the inherited theme.

#### Option 1: Inherit from host app theme

Wrap your app (or a parent component) with MUI's `ThemeProvider`. Reviso picks up the palette, typography, and other tokens automatically.

```tsx
import { ThemeProvider, createTheme } from '@mui/material/styles';

const appTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
  },
});

function App() {
  return (
    <ThemeProvider theme={appTheme}>
      <Reviso document={document} />
    </ThemeProvider>
  );
}
```

#### Option 2: Override via `theme` prop

Pass MUI `ThemeOptions` directly to the `theme` prop. These overrides are deep-merged on top of whatever theme Reviso inherits from the parent.

```tsx
<Reviso
  document={document}
  theme={{
    palette: {
      mode: 'dark',
      primary: { main: '#ce93d8' },
      background: { default: '#1a1a2e', paper: '#16213e' },
    },
    typography: {
      fontFamily: '"Fira Code", monospace',
    },
  }}
/>
```

#### Option 3: Combine both

Use a host theme for global styles and the `theme` prop for Reviso-specific tweaks.

```tsx
const appTheme = createTheme({
  palette: { mode: 'dark' },
  typography: { fontFamily: '"Inter", sans-serif' },
});

<ThemeProvider theme={appTheme}>
  <Reviso
    document={document}
    theme={{
      palette: {
        primary: { main: '#ff7043' },
      },
    }}
  />
</ThemeProvider>
```

In this example, Reviso uses the host's dark mode and Inter font, but overrides the primary color to deep orange.

## Props

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
| `onChange` | `(dirtyPages: RevisoPage[]) => void` | — | Fired on any change, returns only modified pages |
| `onRegionChange` | `(event) => void` | — | Granular per-region change event (`{ type, pageId, regionId, region? }`) |
| `onPageChange` | `(pageId: string) => void` | — | Fired on page navigation |
| `onSelectionChange` | `(regionId: string \| null) => void` | — | Fired on region select/deselect |
| `onExport` | `(format, data: Blob) => void` | — | Intercept export (replaces auto-download) |

### `defaultRegionStyles`

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

### `RevisoRegion`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | yes | Unique region identifier |
| `x` | `number` | yes | X position (pixels from left) |
| `y` | `number` | yes | Y position (pixels from top) |
| `width` | `number` | yes | Region width in pixels |
| `height` | `number` | yes | Region height in pixels |
| `text` | `string` | yes | Current text content |
| `originalText` | `string` | no | Original text (for diff tracking) |
| `fontColor` | `string` | no | Text color |
| `fontFamily` | `string` | no | Font family |
| `fontWeight` | `'normal' \| 'bold'` | no | Font weight |
| `fontStyle` | `'normal' \| 'italic'` | no | Font style |
| `textDecoration` | `'none' \| 'line-through'` | no | Text decoration |
| `borderColor` | `string` | no | Border color |
| `borderVisible` | `boolean` | no | Show/hide border |
| `backgroundColor` | `string` | no | Background fill |
| `textPosition` | `'inside' \| 'top' \| 'bottom' \| 'left' \| 'right'` | no | Text placement relative to region |
| `isValidated` | `boolean` | no | Validation tracking |

### When does `onChange` fire?

`onChange` fires once per discrete user action — it does **not** fire continuously during drag operations. It returns only dirty (modified) pages, not the full document. A page is considered dirty if any region was edited, created, or deleted. Dirty flags are reset after each `onChange` call, so the same changes are not re-emitted.

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

## Development

### Prerequisites

- **Node.js** >= 18
- **npm** >= 8

### Setup

```bash
git clone https://github.com/zhernrong92/reviso.git
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
| `npm run build:lib` | Build library for publishing |
| `npm run preview` | Preview production build |
| `npm run type-check` | TypeScript type checking |
| `npm run lint` | ESLint check |

### Publishing

```bash
npm login --registry=https://npm.pkg.github.com
npm run build:lib
npm publish
```

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| TypeScript 5 (strict) | Type safety |
| Vite 5 | Dev server + library bundler |
| MUI 6 | Component library, theming |
| Zustand 5 + Immer | State management |
| Framer Motion | Page transitions |
| react-zoom-pan-pinch | Document viewer zoom/pan |
| react-compare-slider | Before/after comparison |
| pdf-lib | PDF export generation |
| nanoid | Unique ID generation |
