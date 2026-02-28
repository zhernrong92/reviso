# Project Brief (Persistent)

## Product Vision
Reviso helps users visually verify and correct OCR results from damaged document restoration with minimal effort. It's a frontend-only PoC proving that a well-designed viewer/editor can make OCR correction fast and intuitive.

## Target Users
- **Primary:** Data entry operators correcting OCR output
- **Secondary:** QA teams reviewing restoration quality
- **Tertiary:** Anyone reviewing digitised document results

## Core UX Principles
1. **Minimal clicks** — inline editing, no modals, auto-advance after confirming edits
2. **Visual clarity on dark theme** — text overlays clearly visible against both UI chrome and document images
3. **Smooth and responsive** — all transitions at 60fps, no jarring layout shifts
4. **Always oriented** — user always knows which document, which page, what's been edited
5. **Keyboard-friendly** — power users can review and edit without touching the mouse

## Coding Conventions

### Architecture
- Layer-based organisation: components, hooks, stores, types, utils, theme
- Three separate Zustand stores: documentStore (data), uiStore (UI state), editHistoryStore (undo/redo)
- SVG overlay for text regions on document images
- HTML input for inline text editing (not SVG foreignObject)

### Quality Gates
- TypeScript strict mode, zero `any` types
- MUI theme tokens only, no raw colours in components
- Visual verification after every UI change
- No console errors or unhandled exceptions
- Cross-browser check before completion (Chrome, Firefox, Safari, Edge)

### Key Commands
```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
npm run build        # Production build
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
| `Tab` | Next region | Always |
| `Shift+Tab` | Previous region | Always |
| `Enter` | Confirm edit | Editing |
| `Escape` | Cancel edit / deselect | Editing / Selected |
| `ArrowRight` / `PageDown` | Next page | Not editing |
| `ArrowLeft` / `PageUp` | Previous page | Not editing |
| `n` | New region mode | Not editing |
| `Delete` | Delete selected region | Region selected |
| `Ctrl+E` | Toggle Edit ↔ Compare | Always |
| `Ctrl+S` | Export JSON | Always |
| `?` | Show shortcut help | Always |

## Constraints
- **Frontend only** — no backend, no API calls, no server
- **Dummy data** — bundled JSON + images, plus optional file upload
- **Desktop only** — no mobile responsive layout
- **No auth** — no login, no users
- **1-2 week timeline** — strict phase boundaries, Phase 7 is "if time permits"
- **Budget: $0** — all free/open-source tools

## Update Cadence
Update this brief and `AGENTS.md` whenever:
- A phase is completed
- A new convention is established
- A technical decision changes
- New commands are added to the project
