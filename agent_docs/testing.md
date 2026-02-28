# Testing & Verification Strategy

## Approach: Minimal Testing for PoC

This is a 1-2 week PoC. Testing is lightweight — primarily manual verification with optional unit tests for critical pure functions.

## Primary: Visual Verification

After every UI change:
1. Run `npm run dev`
2. Open browser at `http://localhost:5173`
3. Check the following:
   - Component renders correctly
   - Dark theme applied (no white flashes, no raw colours)
   - Interactive elements respond to click/hover
   - No console errors or warnings
   - No layout shifts or visual glitches

### Visual Verification Checklist (Per Feature)

#### Phase 1 — Foundation
- [ ] App loads without errors
- [ ] Dark theme applied globally
- [ ] `#0bda90` primary colour visible
- [ ] Sidebar + main area layout renders
- [ ] Dummy data loads

#### Phase 2 — Core Viewer
- [ ] Document image renders at correct size
- [ ] SVG overlay regions appear at correct positions
- [ ] Hover state highlights region
- [ ] Click selects region
- [ ] Zoom/pan works, overlays stay aligned
- [ ] Sidebar shows document list and page thumbnails
- [ ] Page switching works

#### Phase 3 — Inline Editing
- [ ] Click region → inline editor appears at correct position
- [ ] Type text → text updates live
- [ ] Enter → confirms edit, region marked as "edited"
- [ ] Escape → cancels edit, text reverts
- [ ] Tab → moves to next region
- [ ] New region creation: draw → type → confirm
- [ ] New regions visually distinct (orange)

#### Phase 4 — Navigation
- [ ] Document switching in sidebar is smooth
- [ ] Page transitions animate
- [ ] Breadcrumb shows correct position
- [ ] Keyboard shortcuts work (arrows for pages)

#### Phase 5 — Comparison Slider
- [ ] Slider renders with before/after views
- [ ] Dragging slider reveals before/after gradually
- [ ] View mode toggle works (Edit ↔ Compare)

#### Phase 6 — Export
- [ ] JSON export downloads valid JSON
- [ ] JSON contains corrected text and new regions
- [ ] PDF export downloads valid PDF
- [ ] PDF text positioned correctly (spot check)

## Secondary: Type Checking

Run after any TypeScript changes:
```bash
npm run type-check    # tsc --noEmit
```

Must pass with zero errors. No `any` types allowed.

## Optional: Unit Tests (If Time Permits)

Priority functions to test (pure, error-prone):

### 1. Coordinate transforms (`src/utils/coordinates.ts`)
```typescript
// Test: imageToScreen and screenToImage conversions
// Test: PDF Y-axis flip (imageHeight - y2)
// Test: Edge cases (zero coordinates, regions at image boundaries)
```

### 2. Export logic (`src/utils/exportJson.ts`)
```typescript
// Test: JSON export matches input schema
// Test: Corrected text appears in output
// Test: New regions included
// Test: Original text preserved for unedited regions
```

### 3. PDF export (`src/utils/exportPdf.ts`)
```typescript
// Test: PDF page dimensions match image dimensions
// Test: Text coordinates correctly flipped for PDF
// Test: Font size estimation reasonable for region height
```

### Test Setup (If Adding Tests)
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
});
```

```bash
npm test              # Run tests
npm run test:watch    # Watch mode
```

## Cross-Browser Testing (Before PoC Completion)

Test on latest versions of:
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

Check for:
- SVG rendering consistency
- CSS transform behaviour (zoom/pan)
- Event handling (click, hover, keyboard)
- PDF download behaviour
- File picker API support

## Linting

```bash
npm run lint          # ESLint
```

ESLint should be configured with:
- `@typescript-eslint/recommended`
- React hooks rules
- No `any` rule enforced

## Pre-Commit (Optional)

If setting up pre-commit hooks:
```bash
npm install -D husky lint-staged
npx husky init
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"]
  }
}
```

## What NOT to Test

- MUI component internals (they're already tested)
- Zustand store middleware (well-tested library)
- Third-party library behaviour (react-zoom-pan-pinch, react-compare-slider)
- Visual design (use manual verification instead)

## Failure Protocol

If verification fails:
1. **Do NOT move to next feature**
2. Identify the failing check
3. Fix the issue
4. Re-verify
5. Only then proceed
