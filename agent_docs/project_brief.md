# Project Brief (Persistent)

## Product Vision
Reviso is a preview-first document restoration QA tool. It helps users visually review OCR corrections on restored documents, validate region-by-region accuracy, compare original vs restored versions, and make corrections when needed. The core workflow is **Preview → Validate → Edit → Export**.

## Target Users
- **Primary:** QA teams reviewing document restoration quality
- **Secondary:** Data entry operators correcting OCR output
- **Tertiary:** Anyone reviewing digitised document results

## Core UX Principles
1. **Preview-first** — users land in review mode, not edit mode. Editing is explicit and intentional.
2. **Minimal clicks** — inline editing, no modals, auto-advance after confirming edits
3. **Visual clarity on dark theme** — text overlays clearly visible against both UI chrome and document images
4. **Smooth and responsive** — all transitions at 60fps, no jarring layout shifts
5. **Always oriented** — user always knows which document, which page, what's been validated
6. **Keyboard-friendly** — power users can review and edit without touching the mouse

## View Modes

### Preview Mode (default)
The landing view for QA review. Two sub-layouts:
- **Side-by-side** — original image (left) vs restored image (right), independent zoom/pan, validation checkmarks on restored side
- **Slider comparison** — draggable comparison slider (horizontal or vertical), no validation checkmarks

### Edit Mode (on demand)
Full editing entered via "Edit" button or Ctrl+E:
- Select, edit text, create/resize/delete regions
- Undo/redo, style controls, text visibility toggle
- Return to preview via "Preview" button (eye icon) or Ctrl+E

## Coding Conventions

### Architecture
- Self-contained embeddable component under `src/reviso/`
- Three separate Zustand stores: documentStore (data), uiStore (UI state), editHistoryStore (undo/redo)
- SVG overlay for text regions on document images
- HTML input for inline text editing
- Auto background color detection for restored preview rendering

### Quality Gates
- TypeScript strict mode, zero `any` types
- MUI theme tokens only, no raw colours in components
- Visual verification after every UI change
- No console errors or unhandled exceptions

### Key Commands
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
npm run build:lib    # Build library for publishing (ESM + CJS)
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm run preview      # Preview production build
```

### Commit Convention (Lightweight)
```
feat: description     # New feature
fix: description      # Bug fix
refactor: description # Code restructuring
style: description    # Visual/styling changes
docs: description     # Documentation
```

## Design Tokens

### Primary Palette
| Token | Value | Usage |
|-------|-------|-------|
| `primary.main` | `#0bda90` | Selected regions, primary actions |
| `primary.light` | `#4de8ab` | Edited region indicator |
| `primary.dark` | `#08a86e` | Hover on primary buttons |
| `background.default` | `#0a0a0a` | App background |
| `background.paper` | `#141414` | Sidebar, cards, panels |

### Region Visual States
| State | Stroke | Fill Opacity | Colour Source |
|-------|--------|-------------|---------------|
| Default | 0.3 opacity | transparent | `primary.main` |
| Hover | 0.6 opacity | 0.1 | `primary.main` |
| Selected | 1.0 opacity | 0.15 | `primary.main` |
| Edited | 0.6 opacity | 0.15 | `primary.light` |
| New (user-created) | 0.6 opacity | 0.15 | `#ffa726` (orange) |

### Keyboard Shortcuts
| Shortcut | Action | Active When |
|----------|--------|-------------|
| `Ctrl+E` | Toggle Preview / Edit mode | Always |
| `Escape` | Exit edit mode / deselect | Edit mode |
| `Tab` / `Shift+Tab` | Next / Previous region | Edit mode |
| `Enter` | Confirm edit | Editing |
| `ArrowRight` / `PageDown` | Next page | Not editing |
| `ArrowLeft` / `PageUp` | Previous page | Not editing |
| `N` | Toggle create mode | Edit mode |
| `Delete` | Delete selected region | Region selected |
| `?` | Show shortcut help | Always |

## Constraints
- **Frontend only** — no backend, no API calls, no server
- **Desktop only** — no mobile responsive layout
- **No auth** — no login, no users
- **Published as `react-reviso`** on npm — embeddable component, not standalone app
- **Budget: $0** — all free/open-source tools

## Update Cadence
Update this brief and `AGENTS.md` whenever:
- A phase is completed
- A new convention is established
- A technical decision changes
- New commands are added to the project
