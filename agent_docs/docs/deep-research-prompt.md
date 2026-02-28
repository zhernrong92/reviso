# Deep Research Request: Document Restoration Viewer/Editor

## Context

I need comprehensive technical research for building a **PoC frontend application** that allows users to view and edit OCR/document restoration results. The app displays bounding boxes over document images with associated text, and enables inline correction of OCR errors.

**Technical Context:**

- **Stack:** React 18, TypeScript, Vite, MUI 6, Zustand
- **Theme:** Dark theme, primary color `#0bda90`
- **Scope:** Frontend-only PoC with dummy data (no backend, no auth, no mobile)
- **Business Context:** Side project / proof of concept

**Data Shape:**
The backend service returns a JSON file containing a list of objects per document page. Each object has:
- Bounding box coordinates: `(x1, y1, x2, y2)`
- Corresponding OCR text

Users may upload multiple documents, and each document may have multiple pages.

---

## Research Objectives

### 1. Market & Competitor Analysis (Comprehensive)

- **Existing document viewer/editor tools:** What open-source and commercial tools exist for viewing documents with bounding box overlays and inline text editing? (e.g., Label Studio, Prodigy, PDF.js-based editors, custom OCR correction UIs)
- **UX patterns in document editors:** How do tools like Figma, Google Docs, Adobe Acrobat, and annotation tools handle multi-page navigation, inline editing, and visual feedback?
- **Before/after comparison UIs:** What slider/comparison patterns exist in production apps? (e.g., image diff tools, photo editors, code diff viewers) What libraries implement these well in React?
- **Multi-document workflows:** How do existing tools handle switching between multiple documents and pages? What navigation patterns work best (tabs, sidebar thumbnails, breadcrumbs, tree views)?

### 2. Technical Architecture (Comprehensive)

#### Core Rendering Questions:
- **Canvas vs DOM for bounding box overlays:** What are the trade-offs for rendering bounding boxes over document images? Consider: performance with hundreds of boxes, click/hover interaction, text editing UX, zoom/pan behavior, accessibility
- **Image rendering at scale:** Best approach for rendering high-resolution document images with zoom/pan? Options: native `<img>` + CSS transforms, `<canvas>`, libraries like OpenSeadragon, react-zoom-pan-pinch, Konva.js
- **Bounding box interaction layer:** How to implement clickable, hoverable, editable bounding boxes that stay in sync with the underlying image at different zoom levels?

#### State Management:
- **Zustand store design:** How should the store be structured for: multiple documents → multiple pages → multiple bounding boxes with text? Consider normalized vs nested state
- **Edit history for undo/redo:** Best patterns for implementing undo/redo with Zustand (zustand-middleware, immer patches, command pattern)
- **Dirty state tracking:** How to track which bounding boxes have been edited for visual diff and export

#### Component Architecture:
- **Recommended component tree:** What's the ideal breakdown? Consider: DocumentList, PageNavigator, ImageViewer, BoundingBoxOverlay, TextEditor, ComparisonSlider, ExportPanel
- **Multi-document/multi-page navigation:** Best UX patterns for seamless switching. Should pages lazy-load? Virtualization for large documents?

### 3. Implementation Options (Comprehensive)

#### Before/After Slider:
- **React slider comparison libraries:** Evaluate react-compare-slider, react-image-comparison-slider, or custom implementation
- **Gradual reveal mechanism:** The slider should show "before" (original damaged document) on one side and "after" (restored with corrected text overlaid) on the other, with gradual transition as the slider moves
- **Technical approach:** CSS clip-path, canvas compositing, or overlapping divs with dynamic width?

#### Inline Text Editing:
- **Click-to-edit on bounding boxes:** Best UX pattern — click box to select, double-click to edit? Or single-click to edit directly?
- **Edit input positioning:** How to position an input/textarea exactly over a bounding box at any zoom level?
- **Keyboard navigation:** Tab through bounding boxes, Enter to confirm, Escape to cancel, arrow keys to navigate between boxes
- **Batch editing considerations:** Any patterns for find-and-replace across all bounding boxes?

#### Export/Download:
- **Reconstructing document with correct text positioning:** How to export the edited results as a formatted document (PDF or image) where text appears in the correct positions matching the bounding boxes?
- **Libraries:** jsPDF, pdf-lib, html2canvas, dom-to-image — which is best for positional text rendering?
- **JSON export:** Exporting the corrected JSON in the same format as input

#### UX Requirements:
- **Smooth transitions/animations:** Page transitions, document switching, edit state changes — what animation libraries work well with MUI 6? (Framer Motion, React Spring, MUI built-in transitions)
- **Visual feedback:** Hover highlights on bounding boxes, edit-state indicators, unsaved change warnings, progress indicators for multi-page review
- **Minimal clicks philosophy:** What interaction patterns minimize clicks? Inline editing without modals, keyboard shortcuts, auto-advance to next box after edit
- **Dark theme considerations:** Bounding box colors that work well on dark backgrounds with `#0bda90` as primary. Contrast ratios for text overlays on document images

### 4. Specific Technical Questions

1. **What's the best approach for rendering bounding boxes over document images in React?** Compare: SVG overlay, absolute-positioned divs, canvas layer, or hybrid approach. Consider MUI 6 integration, dark theme, and performance with 100+ boxes per page.

2. **How should multi-page document navigation be structured for editing workflows?** Evaluate: sidebar thumbnail strip, bottom filmstrip, tab-based navigation, keyboard-only navigation. Consider UX for reviewing and editing all pages sequentially.

3. **What's the optimal Zustand store shape for nested document → page → bounding box data with undo/redo support?**

4. **Which React libraries best support a before/after image comparison slider with gradual reveal?**

5. **How to export a document where edited text is positioned correctly according to bounding box coordinates?** What's the most reliable approach for pixel-accurate text placement in generated PDFs or images?

6. **What are the best keyboard shortcut patterns for document annotation/correction tools?** Reference existing tools and established conventions.

7. **How to handle zoom/pan on document images while keeping bounding box overlays perfectly aligned and interactive?**

---

## Sources Priority

1. **Technical documentation** (React, MUI 6, Zustand, canvas/SVG APIs, export libraries)
2. **GitHub repositories** (open-source document viewers, annotation tools, comparison sliders)
3. **User forums/Reddit** (real-world experiences with similar implementations)
4. **Competitor analysis** (Label Studio, Prodigy, PDF.js viewers, commercial OCR editors)
5. **Industry reports / Case studies** (if relevant)
6. **Academic papers** (only if directly applicable to rendering or UX patterns)

---

## Required Deliverables

### 1. Competitor & Market Table
| Tool | Bounding Box Support | Inline Editing | Multi-page | Export | Open Source | Notes |
|------|---------------------|----------------|------------|--------|-------------|-------|

### 2. Architecture Recommendation
- Recommended component tree with responsibilities
- State management design (Zustand store shape)
- Rendering approach decision (canvas vs DOM vs hybrid) with justification
- Data flow diagram (text description or Mermaid.js)

### 3. Technology Evaluation Matrix
| Concern | Option A | Option B | Option C | Recommendation |
|---------|----------|----------|----------|----------------|
| Bounding box rendering | SVG overlay | Positioned divs | Canvas | ? |
| Image zoom/pan | CSS transforms | react-zoom-pan-pinch | Konva.js | ? |
| Before/after slider | react-compare-slider | Custom CSS clip-path | Canvas composite | ? |
| Export | jsPDF | pdf-lib | html2canvas | ? |
| Animations | Framer Motion | React Spring | MUI transitions | ? |
| Undo/redo | zustand middleware | immer patches | Command pattern | ? |

### 4. UX Specification
- Recommended interaction patterns for editing workflow
- Keyboard shortcut map
- Navigation flow for multi-document, multi-page review
- Visual feedback specifications (hover, selected, edited, error states)
- Animation specifications for transitions

### 5. Implementation Roadmap
- Phase 1: Core viewer (image + bounding boxes)
- Phase 2: Inline editing + state management
- Phase 3: Multi-document/page navigation
- Phase 4: Before/after comparison slider
- Phase 5: Export functionality
- Phase 6: Polish (animations, keyboard shortcuts, undo/redo)

### 6. Risk Assessment
- Technical risks and mitigation strategies
- Performance concerns (large documents, many bounding boxes)
- Browser compatibility issues
- Known limitations of recommended libraries

---

## Output Format

- Provide detailed technical findings with code snippets where helpful
- Include architecture diagrams (describe in text or Mermaid.js)
- **Cite sources with URLs and access dates** for each major finding
- Use tables for comparisons
- **Explicitly note where sources disagree** or data is uncertain
- Include pros/cons for each major recommendation
- Assume developer-level knowledge (React, TypeScript, state management)
- Keep recommendations actionable — this is a PoC, so prefer pragmatic over perfect
