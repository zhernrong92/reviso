# Testing & Verification Strategy

## Approach: Visual Verification + Type Checking

This is a PoC. Testing is primarily manual verification with strict type checking.

## Primary: Visual Verification

After every UI change:
1. Run `npm run dev`
2. Open browser at `http://localhost:5173`
3. Check the following:
   - Component renders correctly in both preview and edit modes
   - Dark theme applied (no white flashes, no raw colours)
   - Interactive elements respond to click/hover
   - No console errors or warnings
   - No layout shifts or visual glitches

### Verification Checklist

#### Preview Mode
- [ ] Default view is preview (not edit)
- [ ] Side-by-side: original (left) and restored (right) render correctly
- [ ] Independent zoom/pan works on each pane
- [ ] Validation checkmarks appear and are clickable
- [ ] Validation progress bar updates correctly
- [ ] Toggle validation icons hides/shows checkmarks
- [ ] Slider comparison: horizontal slider works
- [ ] Slider comparison: vertical slider works (toggle in toolbar)
- [ ] Slider handle renders correctly for both orientations
- [ ] Fit-to-view button resets zoom in all panes

#### Edit Mode
- [ ] "Edit" button enters edit mode
- [ ] "Preview" button (eye icon) exits edit mode
- [ ] Ctrl+E toggles between modes
- [ ] Escape exits edit mode (when nothing selected)
- [ ] Full editing works: select, edit text, Tab/Shift+Tab nav
- [ ] Region creation: draw, type, confirm
- [ ] Region resize/move/delete
- [ ] Undo/redo works
- [ ] Style controls work (font, border, background)
- [ ] Text visibility toggle works

#### Shared
- [ ] Page navigation works in all modes
- [ ] Sidebar page thumbnails work
- [ ] Export dialog opens, exports JSON/PDF/PNG
- [ ] Keyboard shortcuts help dialog (`?`)
- [ ] Fit-to-view button works in all modes

## Secondary: Type Checking

Run after any TypeScript changes:
```bash
npm run type-check    # tsc --noEmit
```

Must pass with zero errors. No `any` types allowed.

## Linting

```bash
npm run lint          # ESLint
```

## What NOT to Test

- MUI component internals
- Zustand/Immer middleware internals
- Third-party library behaviour (react-zoom-pan-pinch, react-compare-slider)
- Visual design details (use manual verification)

## Failure Protocol

If verification fails:
1. **Do NOT move to next feature**
2. Identify the failing check
3. Fix the issue
4. Re-verify
5. Only then proceed
