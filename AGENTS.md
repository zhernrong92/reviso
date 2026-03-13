# AGENTS.md — Master Plan for Reviso

## Project Overview
**App:** Reviso — Document Restoration QA & Review Tool (embeddable component)
**Goal:** Reusable React component for reviewing, validating, and correcting OCR text on restored document images
**Stack:** React 18 + TypeScript + Vite + MUI 6 + Zustand + Framer Motion
**Scope:** Frontend-only, embeddable component — no backend, no auth, no file upload
**Current Phase:** Phase 12 — Preview-First UX Redesign (complete)

## Product Vision

Reviso is a preview-first document restoration review tool. Users land in a QA/review mode where they can compare original vs restored documents, validate OCR corrections region-by-region, and only enter edit mode when corrections are needed. The workflow is: **Preview → Validate → Edit (if needed) → Export**.

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
- `agent_docs/testing.md` — Verification strategy and commands
- `agent_docs/component_design.md` — Embeddable component API design, layout, bundle strategy

## Current State (Update This!)
**Last Updated:** March 13, 2026
**Working On:** Polish & bug fixes
**Recently Completed:** Phase 12 — Preview-first UX, side-by-side comparison, slider comparison (horizontal + vertical), validation overlay, fit-to-view
**Blocked By:** None
**Design Doc:** `agent_docs/component_design.md` — full component API, layout, bundle strategy

## Architecture Overview

### View Modes
- **Preview mode** (default) — restored-document view for QA and validation
  - **Side-by-side**: original image (left) + restored image (right), independent zoom/pan, validation checkmarks on restored side
  - **Slider comparison**: single overlay with drag slider (original vs restored), horizontal or vertical orientation, no validation checkmarks
- **Edit mode** — full editing (select, edit text, create/resize/delete regions, undo/redo)
  - Entered explicitly via "Edit" button or Ctrl+E
  - Preview hidden while editing
  - Exit via "Preview" button (eye icon) or Ctrl+E

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `Reviso` | `src/reviso/Reviso.tsx` | Main entry point, routes between view modes |
| `PreviewSideBySide` | `src/reviso/components/comparison/` | Original vs restored dual-pane view |
| `ComparisonSlider` | `src/reviso/components/comparison/` | Slider comparison (horizontal/vertical) |
| `AfterImage` | `src/reviso/components/comparison/` | Restored document render with auto background colors |
| `ValidationOverlay` | `src/reviso/components/comparison/` | Clickable validation checkmarks on regions |
| `DocumentViewer` | `src/reviso/components/viewer/` | Edit mode viewer with zoom/pan |
| `InlineToolbar` | `src/reviso/components/layout/` | Mode-specific toolbar (preview controls vs edit controls) |
| `InlineEditor` | `src/reviso/components/editor/` | Text editing with style controls |
| `RegionCreator` | `src/reviso/components/editor/` | Draw new regions on document |

### Stores
| Store | Purpose |
|-------|---------|
| `documentStore` | Document data, regions, validation state (immer for nested updates) |
| `uiStore` | View mode, preview layout, slider orientation, selection, editor mode, feature flags |
| `editHistoryStore` | Undo/redo snapshot stack |

## Roadmap

### Phase 1: Foundation ✓
- [x] Vite + React 18 + TypeScript project scaffold
- [x] MUI 6 dark theme configuration
- [x] Zustand stores (documentStore, uiStore) with TypeScript types
- [x] Dummy data creation
- [x] AppShell layout (sidebar + main viewer + top bar)

### Phase 2: Core Viewer ✓
- [x] PageImage component, OverlayLayer + TextRegion (SVG overlay)
- [x] react-zoom-pan-pinch integration (zoom/pan with overlay sync)
- [x] Region visual states (default, hover, selected)
- [x] Sidebar with document list and page thumbnails
- [x] Page navigation

### Phase 3: Inline Editing ✓
- [x] InlineEditor component, click to select → edit workflow
- [x] Tab/Shift+Tab navigation, Enter/Escape handling
- [x] Visual states for edited (green) and new (orange) regions
- [x] RegionCreator, region resize/move/delete
- [x] Per-region style properties, default style settings
- [x] SVG text rendering, panning limits, keyboard shortcuts

### Phase 4: Multi-Document Navigation ✓
- [x] Document switching, Framer Motion transitions, breadcrumb, keyboard nav

### Phase 5: Comparison Slider ✓
- [x] react-compare-slider integration with before/after views
- [x] View mode toggle, Ctrl+E shortcut

### Phase 6: Export ✓
- [x] JSON, PDF (pdf-lib), PNG (canvas) export with dialog

### Phase 7: Polish ✓
- [x] Keyboard help overlay, undo/redo, file upload (legacy)
- [x] Region background color, debounced color pickers
- [x] Sample documents

### Phase 8: Component Refactor ✓
- [x] Public API types, `<Reviso />` wrapper, InlineToolbar
- [x] Single document mode, feature toggles, theme passthrough
- [x] Legacy files moved to `src/legacy/`

### Phase 9: Region UX Improvements & Validation System ✓
- [x] Region validation system (per-region checkmark + progress indicator)
- [x] onChange returns only dirty pages, resize handles scale with zoom
- [x] Pan-to-region navigation, text visibility toggle

### Phase 10: Library Packaging & Publishing ✓
- [x] Vite library mode (ESM + CJS), TypeScript declarations
- [x] Published as `react-reviso` on npm
- [x] Consumer docs in README

### Phase 11: Preview Mode & Auto Background Detection ✓
- [x] Auto background color detection (dominant color bucketing)
- [x] AfterImage component for restored preview rendering
- [x] Preview PNG export with auto backgrounds

### Phase 12: Preview-First UX Redesign ✓
- [x] Preview mode as default view (side-by-side + slider sub-views)
- [x] Side-by-side: original (left) vs restored (right) with independent zoom/pan
- [x] Slider comparison: horizontal and vertical orientation
- [x] ValidationOverlay with clickable checkmarks in side-by-side mode
- [x] Validation progress bar in toolbar (both modes)
- [x] Edit mode entered via button, exited via "Preview" button (eye icon) or Ctrl+E
- [x] Fit-to-view button in toolbar (all modes)
- [x] Mode-specific toolbar controls
- [x] Keyboard shortcuts updated (Ctrl+E toggle, Escape exits edit mode)

## Engineering Constraints

### Type Safety (No Compromises)
- The `any` type is FORBIDDEN — use `unknown` with type guards
- All function parameters and return types must be explicitly typed
- All component props must have TypeScript interfaces
- Use strict TypeScript config (`"strict": true`)

### Architectural Rules
- Components in `src/reviso/components/` organised by feature area (layout, viewer, editor, comparison, export, common)
- Hooks in `src/reviso/hooks/` — extract reusable logic from components
- Stores in `src/reviso/stores/` — three separate Zustand stores (document, ui, editHistory)
- Types in `src/reviso/types/` — shared type definitions
- Utils in `src/reviso/utils/` — pure functions (coordinate transforms, export logic)

### Library Governance
- Check existing `package.json` before adding any new dependency
- Prefer native browser APIs over libraries
- Total production dependencies should stay ≤ 15
- No deprecated patterns or libraries

### Style Rules
- Use MUI theme tokens exclusively — no raw hex values in components
- Use `sx` prop or `styled()` for MUI component styling
- Framer Motion for complex transitions, MUI built-in transitions for simple show/hide

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
