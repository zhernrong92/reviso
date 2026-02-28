# Product Requirements Document: Reviso MVP

## Executive Summary

**Product:** Reviso
**Version:** MVP (1.0)
**Document Status:** Draft
**Last Updated:** February 28, 2026

### Product Vision
Reviso is a frontend application that enables users to visually verify and correct OCR results from damaged document restoration — with minimal effort. It bridges the gap between automated text extraction and human-verified accuracy by providing an intuitive interface for reviewing, editing, and creating text regions over document images.

### Success Criteria
- Users can load a document and begin editing within seconds
- End-to-end task completion: review and export a corrected multi-page document
- Positive "it feels intuitive" feedback from 3-5 test users

---

## Problem Statement

### Problem Definition
Old documents with faded or damaged text require digitisation. A restoration/OCR service processes these documents and extracts positional text data (coordinates + text). However, the extracted text frequently contains errors — wrong characters, missing words, or entirely missed text regions. Currently, there is no streamlined way to visually review these results, correct errors, add missing regions, and export accurate digitised output.

### Impact Analysis
- **User Impact:** Data entry operators spend excessive time cross-referencing raw JSON output against document images. Without a visual editor, error correction is slow, error-prone, and frustrating.
- **Process Impact:** QA teams lack a way to efficiently validate restoration quality across batches of multi-page documents.
- **Downstream Impact:** Uncorrected OCR errors propagate into digitised archives, reducing the reliability of the entire restoration pipeline.

---

## Target Audience

### Primary Persona: Dana — Data Entry Operator
**Demographics:**
- Works in a document digitisation team
- Moderate technical proficiency (comfortable with desktop applications)
- Processes 20-50 document pages per day

**Jobs to Be Done:**
1. Quickly identify which text regions have OCR errors (functional)
2. Correct errors with minimal clicks and context switching (functional)
3. Feel confident that the corrected output is accurate (emotional)
4. Add missing text regions the OCR service failed to detect (functional)

**Current Pain Points:**
| Current Approach | Pain Points | Reviso's Advantage |
|-----------------|-------------|-------------------|
| Raw JSON review | No visual context, impossible to verify positioning | Visual overlay on actual document image |
| Manual side-by-side comparison | Tedious, high cognitive load | Before/after slider with gradual reveal |
| Editing JSON directly | Error-prone, no validation | Inline editing with visual feedback |

### Secondary Persona: Quinn — QA Reviewer
- Reviews batches of restored documents for quality
- Needs to quickly scan pages for obvious errors
- Cares about throughput — wants to navigate documents and pages rapidly
- May not edit directly, but flags issues

### Tertiary: Anyone Interested
- Stakeholders, project managers, or archivists who want to see restoration results presented clearly

---

## User Stories

### Epic 1: Document Viewing & Text Overlay

**US-1:** "As a data entry operator, I want to see the document image with detected text displayed in their correct positions so that I can visually verify OCR accuracy."
- AC: Document image renders at readable resolution
- AC: Text regions are displayed at the correct coordinates from the JSON data
- AC: Text regions are visually distinguishable from the document background

**US-2:** "As a QA reviewer, I want to quickly scan a page and identify which text regions might have errors so that I can prioritise my review."
- AC: Text regions have clear visual states (default, hover, selected, edited)
- AC: Hover reveals the detected text for quick scanning

### Epic 2: Inline Text Editing

**US-3:** "As a data entry operator, I want to click on a text region and edit the text inline so that I can correct OCR errors with minimal effort."
- AC: Single click to select, immediate edit capability
- AC: Edit input appears at the correct position regardless of zoom level
- AC: Enter confirms edit, Escape cancels
- AC: Edited regions are visually marked as modified

**US-4:** "As a data entry operator, I want to create a new text region where the OCR missed content so that the digitised document is complete."
- AC: User can draw/place a new region on the document
- AC: User can type text for the new region
- AC: New regions are visually distinct from OCR-detected regions

### Epic 3: Multi-Document & Multi-Page Navigation

**US-5:** "As a data entry operator, I want to navigate across multiple documents and pages seamlessly so that I can review a batch of restorations efficiently."
- AC: Document list is accessible without leaving the editor view
- AC: Page navigation is visible and requires minimal clicks
- AC: Current position (document X, page Y of Z) is always clear
- AC: Transitions between pages and documents are smooth

**US-6:** "As a QA reviewer, I want to use keyboard shortcuts to move between pages and text regions so that I can review quickly without relying on mouse clicks."
- AC: Tab navigates to the next text region
- AC: Arrow keys or Page Up/Down navigate between pages
- AC: Keyboard shortcuts are discoverable (tooltip or help overlay)

### Epic 4: Before/After Comparison

**US-7:** "As a QA reviewer, I want to compare the original damaged document with the restored version using a slider so that I can verify restoration quality."
- AC: Slider shows "before" (original) on one side and "after" (restored with corrected text) on the other
- AC: Gradual slider movement reveals the difference progressively
- AC: Slider works at any zoom level

### Epic 5: Export

**US-8:** "As a data entry operator, I want to export the corrected results so that the digitised documents are accurate and usable downstream."
- AC: JSON export preserves the original format with corrected text and any new regions
- AC: PDF/image export places text in correct positions matching coordinates
- AC: Export covers the entire document (all pages)

---

## Functional Requirements

### Core Features (MVP — P0)

#### 1. Document Image Viewer with Text Overlays
- **Description:** Render document page images with positional text data overlaid. The presentation approach is flexible — the goal is clear, intuitive display of where text was detected and what it says. Rendering approach (SVG overlays, positioned DOM elements, canvas, or hybrid) should be determined by what delivers the best UX.
- **User Value:** Visual context makes error detection instant vs. reading raw JSON
- **Acceptance Criteria:**
  - [ ] Document image renders clearly with zoom/pan support
  - [ ] Text regions display at correct coordinates from JSON data
  - [ ] Text regions have clear visual states: default, hover, selected, edited, new
  - [ ] Works with 100+ text regions per page without noticeable lag
- **Dependencies:** Dummy JSON data and sample document images
- **Estimated Effort:** L

#### 2. Inline Text Editing
- **Description:** Click a text region to select it and edit the text directly in place. Edits should feel immediate and require minimal interaction — no modals, no separate panels.
- **User Value:** Fastest path from "I see an error" to "I've fixed it"
- **Acceptance Criteria:**
  - [ ] Click to select a text region, then edit inline
  - [ ] Enter to confirm, Escape to cancel
  - [ ] Edited regions are visually marked (e.g., colour change, icon)
  - [ ] Tab to advance to the next region after confirming
- **Estimated Effort:** M

#### 3. Create New Text Regions
- **Description:** Allow users to add text regions where the OCR service missed content entirely.
- **User Value:** Ensures complete digitisation even when OCR fails to detect text
- **Acceptance Criteria:**
  - [ ] User can draw/place a new region on the document image
  - [ ] User can input text for the new region
  - [ ] New regions are visually distinct from OCR-detected regions
  - [ ] New regions are included in export
- **Estimated Effort:** M

#### 4. Multi-Document & Multi-Page Navigation
- **Description:** Sidebar or panel showing all loaded documents and their pages. Users can switch between documents and pages with minimal clicks and smooth transitions.
- **User Value:** Efficient batch review without losing context
- **Acceptance Criteria:**
  - [ ] Document list with page thumbnails or page count visible
  - [ ] Click to switch documents/pages with smooth transition
  - [ ] Current position clearly indicated (document name, page X of Y)
  - [ ] Keyboard shortcuts for page navigation (arrow keys or Page Up/Down)
- **Estimated Effort:** M

#### 5. Before/After Comparison Slider
- **Description:** A slider that reveals the original damaged document on one side and the restored/corrected version on the other, with gradual transition as the slider moves.
- **User Value:** Instant visual verification of restoration quality
- **Acceptance Criteria:**
  - [ ] Slider fully left shows original document image
  - [ ] Slider fully right shows restored version with corrected text overlaid
  - [ ] Gradual movement shows the transition progressively
  - [ ] Works at current zoom level
- **Estimated Effort:** M

#### 6. Export Corrected Results
- **Description:** Export the reviewed and corrected data in two formats: JSON (same structure as input, with corrections applied) and positioned PDF/image (text rendered at correct coordinates).
- **User Value:** Corrected output is immediately usable downstream
- **Acceptance Criteria:**
  - [ ] JSON export matches input schema with updated text and new regions
  - [ ] PDF/image export places text at correct positions
  - [ ] Export covers all pages in the document
  - [ ] Download triggers via a single button
- **Estimated Effort:** L

### Should Have (P1)
- **Keyboard navigation:** Tab between regions, Enter to confirm, Escape to cancel, arrow keys for page navigation
- **Visual feedback & animations:** Hover highlights, smooth page transitions, edit state indicators, unsaved change warnings
- **Zoom/pan:** Pinch-to-zoom or scroll-zoom with text overlays staying aligned and interactive

### Could Have (P2)
- **Undo/redo:** Revert edits with Ctrl+Z / Ctrl+Shift+Z
- **Find-and-replace:** Search across all text regions and batch-replace common OCR errors
- **Progress indicators:** Track how many pages/regions have been reviewed

### Out of Scope (Won't Have)
- **Backend integration:** No real OCR service — dummy data only
- **Authentication:** No login or user management
- **Collaborative editing:** Single user at a time
- **Mobile responsiveness:** Desktop-only for this PoC
- **Internationalisation:** English only

---

## Non-Functional Requirements

### Performance
- **Page render:** Document image + text overlays render in < 1 second
- **Edit latency:** Text edits apply instantly (< 50ms perceived)
- **Region count:** Handle 100+ text regions per page without jank
- **Page transitions:** Smooth animations at 60fps

### Security & Privacy
- No sensitivity for PoC — all dummy data
- No data leaves the browser (frontend-only)

### Usability
- **Accessibility:** Basic — sufficient colour contrast ratios, form labels, focus indicators
- **Browser Support:** Chrome, Firefox, Safari, Edge (latest versions)
- **Platform:** Desktop only
- **Design System:** MUI 6 dark theme, primary `#0bda90`

### Scalability
- Not a concern for PoC — optimise for developer experience and iteration speed

---

## UI/UX Requirements

### Design Principles
1. **Minimal clicks:** Every interaction should require the fewest possible clicks. Inline editing over modals. Auto-advance after confirming an edit.
2. **Visual clarity on dark theme:** Text overlays and interaction states must be clearly visible against both the dark UI chrome and the document image. Use `#0bda90` strategically — not everywhere.
3. **Smooth and responsive:** Transitions between pages, documents, and edit states should feel fluid. No jarring layout shifts.
4. **Always oriented:** The user should always know where they are — which document, which page, what's been edited.
5. **Keyboard-friendly:** Power users should be able to review and edit without touching the mouse.

### Information Architecture
```
├── App Shell (dark theme, top bar)
│   ├── Document Sidebar (left)
│   │   ├── Document List
│   │   │   └── Page Thumbnails per Document
│   │   └── Current Position Indicator
│   ├── Main Viewer (centre)
│   │   ├── Document Image + Text Overlays
│   │   ├── Zoom/Pan Controls
│   │   └── Before/After Comparison Slider
│   ├── Edit Panel / Inline Editor (contextual)
│   │   ├── Selected Region Text Input
│   │   └── Region Metadata (coordinates, status)
│   └── Top Bar
│       ├── Document Name / Breadcrumb
│       ├── Page Navigation (prev/next, page X of Y)
│       └── Export Button
```

### Key User Flows

#### Flow 1: Review and Edit a Document
```
User loads app → Sees document list in sidebar →
Clicks document → First page renders with text overlays →
Hovers over a region (highlights, shows text) →
Clicks region (selects it, shows editable text) →
Corrects text → Presses Enter (confirmed, marked as edited) →
Tab to next region OR navigate to next page →
Repeat until done → Clicks Export → Downloads corrected output
```

#### Flow 2: Add Missing Text Region
```
User notices missing text on the document image →
Clicks "Add Region" tool/button →
Draws or places a region on the image →
Types the correct text →
Confirms → Region appears with "new" visual state
```

#### Flow 3: Before/After Comparison
```
User wants to verify restoration quality →
Activates comparison mode →
Drags slider left (original damaged document) →
Drags slider right (restored with corrected text overlaid) →
Gradually reveals the difference
```

### Visual Feedback States
| State | Visual Treatment |
|-------|-----------------|
| Default region | Subtle border or highlight, readable but not distracting |
| Hover | Brighter highlight, tooltip or expanded text preview |
| Selected | Strong `#0bda90` accent, editable input visible |
| Edited | Distinct marker (e.g., small dot or colour shift) indicating modification |
| New (user-created) | Different accent colour or dashed border to distinguish from OCR regions |
| Error/conflict | Warning colour if applicable |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Tab` | Next text region |
| `Shift+Tab` | Previous text region |
| `Enter` | Confirm edit, advance to next |
| `Escape` | Cancel edit, deselect |
| `Arrow Left/Right` or `Page Up/Down` | Previous/next page |
| `Ctrl+Z` | Undo (if implemented) |
| `Ctrl+Shift+Z` | Redo (if implemented) |
| `?` | Show keyboard shortcuts help |

---

## Quality Standards

### Code Quality Requirements
- **Type Safety:** Strict TypeScript, no `any` types
- **Architecture:** Clean component separation — viewer, editor, navigation, and export as distinct modules
- **Error Handling:** Graceful fallbacks for missing images, malformed JSON data
- **State Management:** Zustand with clear store boundaries (document store, UI store, edit history store)

### Design Quality Requirements
- **Consistent theming:** MUI 6 theme tokens only — no raw hex values outside theme config
- **Contrast:** All interactive elements meet WCAG AA contrast ratios against dark background
- **Responsive to content:** Layout adapts to different document sizes and aspect ratios

### What This Project Will NOT Accept
- Placeholder content in the final PoC ("Lorem ipsum" text, broken images)
- Half-working features — every listed P0 feature works end-to-end or is cut
- Janky transitions — if animation is included, it must be smooth (60fps)
- Raw hex values scattered through components — use theme tokens

---

## Success Metrics

### North Star Metric
**Task completion rate:** A user can load a multi-page document, review and correct text, and export the result — end to end, without confusion or errors.

### PoC Success Criteria (Week 1-2)

| Category | Metric | Target | Measurement |
|----------|--------|--------|-------------|
| Activation | Time from app load to first edit | < 10 seconds | Manual testing |
| Task Completion | Can complete full review + export flow | Yes/No | End-to-end walkthrough |
| Usability | "Feels intuitive" feedback | Positive from 3-5 testers | Qualitative interviews |
| Performance | Page render with 100+ regions | < 1 second, no jank | Chrome DevTools profiling |
| Coverage | All P0 features functional | 6/6 | Feature checklist |

---

## Constraints & Assumptions

### Constraints
- **Budget:** Free/minimal — no paid services or libraries
- **Timeline:** 1-2 weeks
- **Resources:** Solo developer, side project
- **Technical:** React 18, TypeScript, Vite, MUI 6, Zustand — no deviations

### Assumptions
- Dummy data (JSON + sample images) is sufficient to prove the concept
- Documents are primarily receipts or single-column text documents (not complex layouts like newspapers)
- The JSON schema from the OCR service is stable: `{ pages: [{ regions: [{ x1, y1, x2, y2, text }] }] }`
- Desktop viewport is the primary use case — no need for mobile layouts
- Users have a modern browser with hardware acceleration enabled

### Open Questions
- What is the exact JSON schema from the restoration service? (Using assumed schema for PoC)
- Should edited regions snap to a grid, or allow freeform positioning?
- For the before/after slider — does "after" show the restored image, or the original image with corrected text overlaid on top?
- Will documents ever have complex multi-column layouts?

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Rendering performance with 100+ regions | Medium | High | Profile early; consider virtualisation or canvas fallback for dense pages |
| Zoom/pan breaks overlay alignment | Medium | High | Use relative/percentage positioning tied to image dimensions, not absolute pixels |
| Before/after slider complexity | Medium | Medium | Start with a proven library (react-compare-slider); custom build only if needed |
| Export pixel accuracy in PDF | Medium | High | Prototype export early; test with varying document sizes |
| Scope creep beyond 1-2 week timeline | High | Medium | Strict P0 focus; P1/P2 features only if time permits |
| Finding the right rendering approach | Medium | Medium | Timebox approach evaluation to day 1-2; commit to one and iterate |

---

## MVP Definition of Done

### Feature Complete
- [ ] All 6 P0 features implemented and functional
- [ ] All acceptance criteria met for each feature
- [ ] Dummy data loads and renders correctly

### Quality Assurance
- [ ] Tested on Chrome, Firefox, Safari, Edge (latest)
- [ ] 100+ regions per page renders without jank
- [ ] Keyboard navigation works for core flows
- [ ] No console errors or unhandled exceptions

### UX Validation
- [ ] 3-5 testers complete the full review-edit-export flow
- [ ] Positive qualitative feedback on intuitiveness
- [ ] Smooth transitions at 60fps

### Release Ready
- [ ] Code builds and runs via `npm run dev` (Vite)
- [ ] README with setup instructions and dummy data explanation
- [ ] Screenshot or short demo recording

---

## Next Steps

After this PRD is approved:
1. **Create Technical Design Document** (Part 3) — component architecture, state design, rendering approach
2. **Set up project** — Vite + React 18 + TypeScript + MUI 6 + Zustand scaffold
3. **Build Phase 1** — Core viewer with text overlays
4. **Build Phase 2** — Inline editing + region creation
5. **Build Phase 3** — Multi-document/page navigation
6. **Build Phase 4** — Before/after slider
7. **Build Phase 5** — Export
8. **Build Phase 6** — Polish (animations, keyboard shortcuts)
9. **Test with 3-5 users** — Collect feedback
10. **Iterate** — Address feedback

---

*PRD Version: 1.0*
*Created: February 28, 2026*
*Status: Draft — Ready for Technical Design*
*Owner: Developer*
