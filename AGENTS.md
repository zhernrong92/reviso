# AGENTS.md — Master Plan for Reviso

## Project Overview
**App:** Reviso — Document Annotation Viewer/Editor (embeddable component)
**Goal:** Reusable React component for visually verifying and correcting text regions on document images
**Stack:** React 18 + TypeScript + Vite + MUI 6 + Zustand + Framer Motion
**Scope:** Frontend-only, embeddable component — no backend, no auth, no file upload
**Current Phase:** Phase 8 — Component Refactor

## How I Should Think
1. **Understand Intent First:** Before answering, identify what the user actually needs
2. **Ask If Unsure:** If critical information is missing, ask before proceeding
3. **Plan Before Coding:** Propose a brief plan and wait for approval before implementing
4. **Verify After Changes:** Run the dev server and visually verify after each change
5. **Explain Trade-offs:** When recommending something, mention alternatives
6. **UX is King:** Every implementation decision should optimise for minimal clicks, smooth transitions, and visual clarity on dark theme

## Plan → Execute → Verify
1. **Plan:** Outline the approach for the current task. If it touches multiple files, list them.
2. **Execute:** Implement one feature/component at a time. Keep changes small and testable.
3. **Verify:** Run `npm run dev`, check the browser, confirm no console errors. Fix before moving on.

## Context Files
Refer to these for details (load only when needed):
- `agent_docs/tech_stack.md` — Tech stack, libraries, versions, and setup
- `agent_docs/code_patterns.md` — Code style, component patterns, state management patterns
- `agent_docs/project_brief.md` — Persistent project rules and conventions
- `agent_docs/product_requirements.md` — Full PRD (features, user stories, success metrics)
- `agent_docs/testing.md` — Verification strategy and commands
- `agent_docs/component_design.md` — Embeddable component API design, layout, bundle strategy, migration plan

## Current State (Update This!)
**Last Updated:** March 10, 2026
**Working On:** Done — all phases complete
**Recently Completed:** Phase 10 — Library packaging, GitHub Packages publishing (v0.1.2), theming docs, bug fixes
**Blocked By:** None
**Design Doc:** `agent_docs/component_design.md` — full component API, layout, bundle strategy

## Roadmap

### Phase 1: Foundation (Day 1-2) ✓
- [x] Vite + React 18 + TypeScript project scaffold
- [x] MUI 6 dark theme configuration (primary: `#0bda90`)
- [x] Zustand stores (documentStore, uiStore) with TypeScript types
- [x] Dummy data creation (2 documents, 2-3 pages each, ~20 regions per page with intentional OCR errors)
- [x] AppShell layout (sidebar + main viewer + top bar)
- [x] Dummy page images (placeholder or generated)

### Phase 2: Core Viewer (Day 3-4) ✓
- [x] PageImage component (render document image)
- [x] OverlayLayer + TextRegion (SVG overlay with regions)
- [x] react-zoom-pan-pinch integration (zoom/pan with overlay sync)
- [x] Region visual states (default, hover, selected)
- [x] Sidebar with document list and page thumbnails
- [x] Page navigation (click sidebar + top bar prev/next)

### Phase 3: Inline Editing (Day 5-6) ✓
- [x] InlineEditor component (positioned HTML input over selected region)
- [x] Click to select → edit workflow
- [x] Enter to confirm, Escape to cancel
- [x] Tab/Shift+Tab to advance forward/backward through regions
- [x] Visual "edited" state on modified regions (green highlight)
- [x] Visual "new" state on created regions (orange highlight)
- [x] RegionCreator (draw new region on document + type text)
- [x] Region resize (corner drag handles)
- [x] Region move (drag bar along top edge)
- [x] Region delete (× button + Delete/Backspace key)
- [x] Per-region style properties (fontColor, borderColor, borderVisible)
- [x] Default style settings for new regions (TopBar controls in create mode)
- [x] SVG text rendering inside regions (visible without selecting)
- [x] Panning limits (limitToBounds + centerZoomedOut)
- [x] Global keyboard shortcuts (Escape deselect, n toggle create mode)
- [x] useEditorKeyboard hook

### Phase 4: Multi-Document Navigation (Day 7) ✓
- [x] Document switching in sidebar with smooth transitions
- [x] Framer Motion page/document transition animations
- [x] Breadcrumb in top bar (Document > Page X of Y)
- [x] Keyboard shortcuts for navigation (arrows, Page Up/Down)

### Phase 5: Comparison Slider (Day 8-9) ✓
- [x] react-compare-slider integration
- [x] BeforeView (original damaged image with generated damage effects)
- [x] AfterView (image + corrected text overlay)
- [x] View mode toggle (Edit ↔ Compare) in top bar
- [x] Ctrl+E keyboard shortcut for toggle

### Phase 6: Export (Day 9-10) ✓
- [x] JSON export (corrected data in original schema format)
- [x] PDF export with pdf-lib (text at correct bounding box positions)
- [x] PNG image export (page image + region overlays rendered to canvas)
- [x] Export dialog with format selection (JSON / PDF / PNG)
- [x] Download trigger (single button)

### Phase 7: Polish (Day 11-14) ✓
- [x] Keyboard shortcut help overlay (triggered by `?`)
- [ ] ~~Progress indicator~~ (removed)
- [x] Undo/redo (snapshot-based editHistoryStore, Ctrl+Z / Ctrl+Shift+Z, TopBar buttons)
- [x] File upload — JSON + PDF (pdfjs-dist renders pages to canvas data URLs)
- [x] Sample PDF + PNG as default startup documents (loaded from `public/`)
- [x] Sample JSON files in `sample/` folder for manual upload testing
- [x] Region background color (per-region + global default, transparent toggle)
- [x] Debounced color pickers (DebouncedColorPicker component — commits on blur)
- [x] Comparison view fixes (locked page nav in compare mode, added TransformWrapper for zoom/pan)
- [ ] Smooth Framer Motion transitions everywhere
- [ ] Find-and-replace across regions
- [ ] Final cross-browser testing (Chrome, Firefox, Safari, Edge)

### Phase 8: Component Refactor ✓
See `agent_docs/component_design.md` for full design details.

- [x] Define public API types (RevisoDocument/Page/Region/Props) + type mappers
- [x] Restructure code into `src/reviso/` folder (copy-paste ready)
- [x] Split Sidebar into DocumentList (app-level) + PageThumbnails (component-level)
- [x] Create `<Reviso />` wrapper component with RevisoProps interface
- [x] Convert TopBar → InlineToolbar (compact, lives inside component boundary)
- [x] Wire Reviso props → internal stores (document, callbacks, editable, features, defaultRegionStyles, onExport)
- [x] Accept single document instead of multi-document array
- [x] Remove file upload (host app responsibility)
- [x] Accept host MUI theme via ThemeProvider passthrough
- [x] Make features toggleable via props (editable, showSidebar, showToolbar, comparison, export, regionCreation)
- [x] Move legacy-only files (TopBar, AppShell, Sidebar, DocumentList, parsePdf, parseUploadedJson, dummyData) to `src/legacy/`
- [x] Fit-to-view on page navigation and sidebar toggle
- [x] Demo page at `/reviso` with dummy host app layout

### Phase 9: Region UX Improvements & Validation System ✓
- [x] Default style changes (blue text, green border, no background)
- [x] Toggle all region text visibility (show/hide text labels, keep boxes)
- [x] InlineEditor input follows textPosition (top/bottom positioning)
- [x] Collapse inline style toolbar (gear icon, expand on click)
- [x] Reposition action buttons (confirm/cancel top-left, delete top-right)
- [x] Region validation system (per-region checkmark + progress indicator)
- [x] onChange returns only dirty pages instead of full document
- [x] Resize handles and toolbar stay constant size regardless of zoom level
- [x] Fix zoom viewport shift on region select (preventScroll)
- [x] Pan-to-region navigation (view follows when jumping to next region)

### Phase 10: Library Packaging & Publishing ✓
**Package:** `@zhernrong92/reviso` on GitHub Packages (public)

- [x] Create library entry point (`src/reviso/index.ts`) with public API exports
- [x] Configure Vite library mode (`build.lib`) — ESM + CJS output
- [x] Generate TypeScript declarations (`vite-plugin-dts`)
- [x] Configure `package.json` for publishing (name, version, main, module, types, exports, files, peerDependencies)
- [x] Externalize peer dependencies (react, react-dom, @mui/material, framer-motion, zustand)
- [x] Add `.npmrc` for GitHub Packages registry
- [x] Add `npm run build:lib` script
- [x] Test local install in a separate project (`npm pack` → `npm install`)
- [x] Publish to GitHub Packages (v0.1.2)
- [x] Add consumer usage docs to README (install, setup, minimal example, theming)
- [x] Widen MUI peer dependencies to support v6 and v7
- [x] Default `isValidated: false` on new regions
- [x] Add keyboard shortcuts help button in toolbar
- [x] Reset dirty flags after `onChange` fires to prevent re-emitting

## Engineering Constraints

### Type Safety (No Compromises)
- The `any` type is FORBIDDEN — use `unknown` with type guards
- All function parameters and return types must be explicitly typed
- All component props must have TypeScript interfaces
- Use strict TypeScript config (`"strict": true`)

### Architectural Rules
- Components in `src/components/` organised by feature area (layout, viewer, editor, comparison, export, common)
- Hooks in `src/hooks/` — extract reusable logic from components
- Stores in `src/stores/` — three separate Zustand stores (document, ui, editHistory)
- Types in `src/types/` — shared type definitions
- Utils in `src/utils/` — pure functions (coordinate transforms, export logic)
- Theme in `src/theme/` — MUI 6 theme configuration only

### Library Governance
- Check existing `package.json` before adding any new dependency
- Prefer native browser APIs over libraries (e.g., `fetch` over axios)
- Total production dependencies should stay ≤ 15
- No deprecated patterns or libraries

### Style Rules
- Use MUI theme tokens exclusively — no raw hex values in components
- Use `sx` prop or `styled()` for MUI component styling
- Framer Motion for complex transitions, MUI built-in transitions for simple show/hide
- All interactive elements must have visible focus indicators

### The "No Apologies" Rule
- Do NOT apologise for errors — fix them immediately
- Do NOT generate filler text before solutions
- If context is missing, ask ONE specific clarifying question

## What NOT To Do
- Do NOT delete files without explicit confirmation
- Do NOT add features not in the current phase
- Do NOT skip visual verification after UI changes
- Do NOT use `any` type — ever
- Do NOT put raw hex colours in components (use theme tokens)
- Do NOT add backend logic — this is frontend-only
- Do NOT optimise prematurely — 50 regions per page is our target, not 5000
- Do NOT add authentication or user management
- Do NOT make it mobile responsive — desktop only for this PoC
