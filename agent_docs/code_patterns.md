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
- All types in `src/types/` as named exports
- All component props as interfaces (not types)
- All Zustand store state as interfaces
- No `any` — use `unknown` with type guards when needed

```typescript
// ✅ CORRECT
interface TextRegionProps {
  region: TextRegion;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}

// ❌ WRONG
const TextRegion = (props: any) => { ... }
```

### Naming Conventions
| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `DocumentViewer.tsx` |
| Hooks | camelCase, `use` prefix | `useKeyboardNavigation.ts` |
| Stores | camelCase, `Store` suffix | `documentStore.ts` |
| Types/Interfaces | PascalCase | `TextRegion`, `DocumentState` |
| Utils | camelCase | `exportPdf.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_ZOOM_LEVEL` |
| CSS/Theme | camelCase (MUI sx) | `backgroundColor` |

## Component Patterns

### Component Structure
```typescript
// Standard component file structure
import { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import { motion } from 'framer-motion';

// Types (if not shared, can be local)
interface MyComponentProps {
  // ...
}

// Component
export const MyComponent: React.FC<MyComponentProps> = ({ prop1, prop2 }) => {
  // 1. Hooks (state, stores, refs)
  // 2. Derived state / computed values
  // 3. Callbacks / handlers
  // 4. Effects (if any)
  // 5. Render

  return (
    <Box sx={{ /* MUI theme tokens only */ }}>
      {/* content */}
    </Box>
  );
};
```

### Memoization
```typescript
// Memoize components that receive stable props but parent re-renders often
// TextRegion will re-render frequently as hover/selection changes on siblings
export const TextRegion = React.memo<TextRegionProps>(({ region, isSelected, isHovered, onSelect, onHover }) => {
  // Only re-renders when its own props change
  return (/* ... */);
});
```

### Event Handlers
```typescript
// Use useCallback for handlers passed to memoized children
const handleSelect = useCallback((id: string) => {
  uiStore.selectRegion(id);
}, []);

// Inline handlers are fine for non-memoized components
<Button onClick={() => setOpen(true)}>Open</Button>
```

## Styling Patterns

### MUI sx Prop (Primary)
```typescript
// ✅ CORRECT — use theme tokens
<Box sx={{
  bgcolor: 'background.paper',
  color: 'text.primary',
  borderColor: 'primary.main',
  borderRadius: 1,  // Uses theme.shape.borderRadius
  p: 2,             // Uses theme.spacing(2) = 16px
}}>

// ❌ WRONG — raw values
<Box sx={{
  backgroundColor: '#141414',
  color: '#e0e0e0',
  borderColor: '#0bda90',
  borderRadius: '8px',
  padding: '16px',
}}>
```

### Theme Access in Non-MUI Components
```typescript
import { useTheme } from '@mui/material/styles';

const MyComponent = () => {
  const theme = useTheme();
  // Use theme.palette.primary.main for SVG strokes, etc.
  return (
    <rect stroke={theme.palette.primary.main} />
  );
};
```

### Framer Motion + MUI
```typescript
// Wrap MUI components with motion
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

const MotionBox = motion.create(Box);

<MotionBox
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  sx={{ bgcolor: 'background.paper' }}
/>
```

## State Management Patterns

### Store Access
```typescript
// Use selectors to prevent unnecessary re-renders
const activeDocumentId = useUiStore((state) => state.activeDocumentId);
const documents = useDocumentStore((state) => state.documents);

// ❌ WRONG — subscribes to entire store
const store = useUiStore();
```

### Store Actions
```typescript
// Call actions directly, don't destructure the whole store
const selectRegion = useUiStore((state) => state.selectRegion);

// Or access outside React
useUiStore.getState().selectRegion(id);
```

### Cross-Store Communication
```typescript
// If an action in one store needs to affect another, call both from the component
const handleRegionDelete = () => {
  useDocumentStore.getState().deleteRegion(pageId, regionId);
  useUiStore.getState().selectRegion(null);  // Clear selection
};
```

## SVG Region Patterns

### Visual States
```typescript
// Region appearance based on state
const getRegionStyle = (
  isSelected: boolean,
  isHovered: boolean,
  isEdited: boolean,
  isNew: boolean,
  theme: Theme
) => {
  if (isSelected) return {
    fill: theme.palette.primary.main,
    fillOpacity: 0.15,
    stroke: theme.palette.primary.main,
    strokeOpacity: 1.0,
    strokeWidth: 2,
  };
  if (isHovered) return {
    fill: theme.palette.primary.main,
    fillOpacity: 0.1,
    stroke: theme.palette.primary.main,
    strokeOpacity: 0.6,
    strokeWidth: 1.5,
  };
  if (isNew) return {
    fill: '#ffa726',
    fillOpacity: 0.15,
    stroke: '#ffa726',
    strokeOpacity: 0.6,
    strokeWidth: 1,
  };
  if (isEdited) return {
    fill: theme.palette.primary.light,
    fillOpacity: 0.15,
    stroke: theme.palette.primary.light,
    strokeOpacity: 0.6,
    strokeWidth: 1,
  };
  // Default
  return {
    fill: 'transparent',
    fillOpacity: 0,
    stroke: theme.palette.primary.main,
    strokeOpacity: 0.3,
    strokeWidth: 1,
  };
};
```

### Coordinate Transforms
```typescript
// Image coordinates → screen coordinates (for InlineEditor positioning)
// The TransformComponent applies: transform: matrix(scale, 0, 0, scale, translateX, translateY)
// To get screen position of a region:

const imageToScreen = (
  imageX: number,
  imageY: number,
  transform: { scale: number; positionX: number; positionY: number }
): { screenX: number; screenY: number } => ({
  screenX: imageX * transform.scale + transform.positionX,
  screenY: imageY * transform.scale + transform.positionY,
});
```

## Keyboard Handling Pattern

```typescript
// Global handler at App level, with editing-mode awareness
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const isEditing = document.activeElement?.tagName === 'INPUT' ||
                      document.activeElement?.tagName === 'TEXTAREA';

    // During editing, only intercept Tab, Enter, Escape, Ctrl+shortcuts
    if (isEditing) {
      switch (e.key) {
        case 'Tab':
          e.preventDefault();
          // Move to next/prev region
          break;
        case 'Enter':
          // Confirm edit
          break;
        case 'Escape':
          // Cancel edit
          break;
      }
      return; // Don't intercept other keys during editing
    }

    // Not editing — full shortcut set available
    switch (e.key) {
      case 'ArrowRight':
      case 'PageDown':
        nextPage();
        break;
      case 'ArrowLeft':
      case 'PageUp':
        prevPage();
        break;
      case 'n':
        enterCreateMode();
        break;
      case '?':
        toggleHelp();
        break;
      // etc.
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [/* stable deps */]);
```

## File Upload Pattern

```typescript
// Accept JSON file + image files (zip or individual)
const handleFileUpload = async (files: FileList) => {
  const jsonFile = Array.from(files).find(f => f.name.endsWith('.json'));
  if (!jsonFile) return;

  const text = await jsonFile.text();
  const data: OcrOutput = JSON.parse(text);

  // Validate schema
  if (!data.documents || !Array.isArray(data.documents)) {
    throw new Error('Invalid JSON schema');
  }

  // Load into store
  useDocumentStore.getState().loadDocuments(data);
};
```

## Error Handling

```typescript
// Graceful fallbacks for missing data
const PageImage: React.FC<{ src: string }> = ({ src }) => {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <Box sx={{ /* placeholder styling */ }}>
        <Typography color="text.secondary">Image not available</Typography>
      </Box>
    );
  }

  return <img src={src} onError={() => setError(true)} alt="Document page" />;
};
```

## Import Order Convention
```typescript
// 1. React
import { useState, useCallback, useMemo } from 'react';

// 2. Third-party libraries
import { Box, Typography, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// 3. Local stores
import { useDocumentStore } from '../../stores/documentStore';
import { useUiStore } from '../../stores/uiStore';

// 4. Local components
import { TextRegion } from './TextRegion';

// 5. Local hooks/utils/types
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import type { Page, TextRegion as TextRegionType } from '../../types/document';
```
