# Code Patterns & Conventions

## TypeScript Conventions

### Strict Mode
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Type Definitions
- All types in `src/reviso/types/` as named exports
- All component props as interfaces (not types)
- All Zustand store state as interfaces
- No `any` — use `unknown` with type guards when needed

### Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `DocumentViewer.tsx` |
| Hooks | camelCase, `use` prefix | `useEditorKeyboard.ts` |
| Stores | camelCase, `Store` suffix | `documentStore.ts` |
| Types/Interfaces | PascalCase | `TextRegion`, `ViewMode` |
| Utils | camelCase | `exportPdf.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_ZOOM_LEVEL` |

## Component Patterns

### Component Structure
```typescript
import { useState, useCallback } from 'react';
import { Box } from '@mui/material';

interface MyComponentProps {
  // ...
}

export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks (state, stores, refs)
  // 2. Derived state / computed values
  // 3. Callbacks / handlers
  // 4. Effects (if any)
  // 5. Render
  return <Box sx={{ /* MUI theme tokens only */ }}>{/* content */}</Box>;
};
```

### Store Access — Use Selectors
```typescript
// ✅ Select specific values
const viewMode = useUiStore((s) => s.viewMode);
const activePage = useDocumentStore((s) => s.getActivePage(activePageId));

// ❌ Don't subscribe to entire store
const store = useUiStore();
```

## Styling Patterns

### MUI sx Prop (Primary)
```typescript
// ✅ Use theme tokens
<Box sx={{ bgcolor: 'background.paper', color: 'text.primary', borderColor: 'primary.main', p: 2 }}>

// ❌ No raw values
<Box sx={{ backgroundColor: '#141414', color: '#e0e0e0' }}>
```

### Theme Access in Non-MUI Components
```typescript
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  return <rect stroke={theme.palette.primary.main} />;
};
```

## State Management Patterns

### Store-Based Trigger Pattern
Used for cross-component actions like fit-to-view:
```typescript
// Store: increment a trigger counter
triggerFitToView: () => set((state) => ({ fitToViewTrigger: state.fitToViewTrigger + 1 }))

// Toolbar: call the action
<IconButton onClick={() => triggerFitToView()}>

// Viewer: watch with useEffect
useEffect(() => {
  if (!ref.current || fitToViewTrigger === 0) return;
  fitToView(ref.current);
}, [fitToViewTrigger, fitToView]);
```

### Cross-Store Communication
```typescript
// Call both stores from the component, not cross-store
const handleRegionDelete = () => {
  useDocumentStore.getState().deleteRegion(pageId, regionId);
  useUiStore.getState().selectRegion(null);
};
```

## View Mode Routing Pattern

The main `Reviso.tsx` component routes between views based on store state:
```typescript
const renderMainContent = () => {
  if (viewMode === 'edit') return <DocumentViewer />;
  if (previewLayout === 'slider') return <ComparisonSlider />;
  return <PreviewSideBySide />;
};
```

The `InlineToolbar` renders mode-specific controls:
- Preview mode: layout toggle, slider orientation, validation icons toggle, Edit button
- Edit mode: New Region, style controls, undo/redo, text toggle, Preview button

## TransformWrapper Pattern

Used in DocumentViewer, PreviewSideBySide (2 instances), ComparisonSlider:
```typescript
const transformRef = useRef<ReactZoomPanPinchRef | null>(null);

const fitToView = useCallback((ref: ReactZoomPanPinchRef) => {
  const wrapper = ref.instance.wrapperComponent;
  if (!wrapper || !pageWidth || !pageHeight) return;
  const fitScale = Math.min(wrapper.clientWidth / pageWidth, wrapper.clientHeight / pageHeight) * 0.95;
  requestAnimationFrame(() => ref.centerView(fitScale, 0));
}, [pageWidth, pageHeight]);

const handleInit = useCallback((ref: ReactZoomPanPinchRef) => {
  transformRef.current = ref;
  fitToView(ref);
}, [fitToView]);

// Re-fit on sidebar toggle (wait for CSS transition)
useEffect(() => {
  const timer = setTimeout(() => {
    if (transformRef.current) fitToView(transformRef.current);
  }, 250);
  return () => clearTimeout(timer);
}, [sidebarOpen, fitToView]);
```

## SVG Overlay Pattern

```typescript
<svg
  width={imageWidth}
  height={imageHeight}
  viewBox={`0 0 ${imageWidth} ${imageHeight}`}
  style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
>
  {regions.map((region) => (
    <g key={region.id} style={{ pointerEvents: 'all' }}>
      <rect x={region.x1} y={region.y1}
        width={region.x2 - region.x1} height={region.y2 - region.y1}
        fill={region.backgroundColor ?? 'transparent'}
        stroke={region.borderColor ?? theme.palette.primary.main}
      />
    </g>
  ))}
</svg>
```

## Keyboard Handling Pattern

Two hooks split by context:
- `useEditorKeyboard` — edit mode shortcuts (Delete, Tab, Escape, N)
- `useNavigationKeyboard` — global shortcuts (Ctrl+E, arrows, Ctrl+Z, ?)

Both check `document.activeElement` to avoid capturing keystrokes during text editing.

## Import Order Convention
```typescript
// 1. React
import { useState, useCallback } from 'react';
// 2. Third-party libraries
import { Box, Typography } from '@mui/material';
// 3. Local stores
import { useUiStore } from '../../stores/uiStore';
// 4. Local components
import { TextRegion } from './TextRegion';
// 5. Local hooks/utils/types
import type { Page } from '../../types/document';
```
