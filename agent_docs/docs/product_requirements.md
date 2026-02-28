# Product Requirements

## Problem Statement
Old documents with faded or damaged text require digitisation. A restoration/OCR service processes these documents and extracts positional text data (coordinates + text). However, the extracted text frequently contains errors. Users need an intuitive way to visually review results, correct errors, add missing text regions, and export accurate digitised output.

## User Stories

### Epic 1: Document Viewing & Text Overlay
**US-1:** "As a data entry operator, I want to see the document image with detected text displayed in their correct positions so that I can visually verify OCR accuracy."
- AC: Document image renders at readable resolution
- AC: Text regions display at correct coordinates from JSON data
- AC: Text regions are visually distinguishable from the document background

**US-2:** "As a QA reviewer, I want to quickly scan a page and identify which text regions might have errors so that I can prioritise my review."
- AC: Text regions have clear visual states (default, hover, selected, edited)
- AC: Hover reveals the detected text for quick scanning

### Epic 2: Inline Text Editing
**US-3:** "As a data entry operator, I want to click on a text region and edit the text inline so that I can correct OCR errors with minimal effort."
- AC: Single click to select, immediate edit capability
- AC: Edit input appears at correct position regardless of zoom level
- AC: Enter confirms edit, Escape cancels
- AC: Edited regions are visually marked as modified

**US-4:** "As a data entry operator, I want to create a new text region where the OCR missed content so that the digitised document is complete."
- AC: User can draw/place a new region on the document
- AC: User can type text for the new region
- AC: New regions are visually distinct from OCR-detected regions

### Epic 3: Multi-Document & Multi-Page Navigation
**US-5:** "As a data entry operator, I want to navigate across multiple documents and pages seamlessly so that I can review a batch of restorations efficiently."
- AC: Document list accessible without leaving editor view
- AC: Page navigation visible and requires minimal clicks
- AC: Current position always clear (document X, page Y of Z)
- AC: Transitions are smooth

**US-6:** "As a QA reviewer, I want to use keyboard shortcuts to move between pages and text regions so that I can review quickly without relying on mouse clicks."
- AC: Tab navigates to next text region
- AC: Arrow keys or Page Up/Down navigate between pages
- AC: Shortcuts are discoverable (help overlay)

### Epic 4: Before/After Comparison
**US-7:** "As a QA reviewer, I want to compare the original damaged document with the restored version using a slider so that I can verify restoration quality."
- AC: Slider fully left shows original document image
- AC: Slider fully right shows restored version with corrected text overlaid
- AC: Gradual movement reveals difference progressively
- AC: Works at any zoom level

### Epic 5: Export
**US-8:** "As a data entry operator, I want to export the corrected results so that the digitised documents are accurate and usable downstream."
- AC: JSON export matches input schema with corrected text and new regions
- AC: PDF/image export places text at correct positions
- AC: Export covers all pages
- AC: Download via single button

## MVP Features (P0 — Must Have)

1. **Document Image Viewer with Text Overlays** — Render page images with positional text data overlaid. Presentation approach is flexible (SVG, DOM, hybrid) — optimise for UX. Must handle ~50 regions per page without lag.

2. **Inline Text Editing** — Click to select a region, edit text in place. Enter to confirm, Escape to cancel, Tab to advance. No modals.

3. **Create New Text Regions** — Draw/place new regions where OCR missed content. New regions visually distinct from OCR regions. Included in export.

4. **Multi-Document & Multi-Page Navigation** — Sidebar with document list and page thumbnails. Smooth transitions. Clear position indicator. Keyboard shortcuts.

5. **Before/After Comparison Slider** — Gradual reveal slider. "Before" = original damaged image. "After" = restored with corrected text overlay.

6. **Export Corrected Results** — JSON (same schema as input, with corrections). PDF (text at correct positions). Single-button download.

## Should Have (P1)
- Keyboard navigation (Tab between regions, arrows for pages)
- Visual feedback (hover highlights, edited state indicators)
- Smooth Framer Motion transitions between pages and documents

## Could Have (P2)
- Undo/redo
- Find-and-replace across regions
- Progress indicators (X of Y pages reviewed)

## Out of Scope
- Backend integration / real OCR service
- Authentication / user management
- Collaborative editing
- Mobile responsiveness
- Internationalisation
- AI-assisted corrections (deferred to post-PoC)

## Success Metrics

| Category | Metric | Target |
|----------|--------|--------|
| Activation | Time from app load to first edit | < 10 seconds |
| Task Completion | Full review + export flow works end-to-end | Yes |
| Usability | "Feels intuitive" feedback | Positive from 3-5 testers |
| Performance | Page render with 50+ regions | < 1 second, no jank |
| Coverage | All P0 features functional | 6/6 |

## Data Shape

The OCR service returns JSON:
```json
{
  "documents": [
    {
      "name": "Receipt-2024-001",
      "pages": [
        {
          "image": "doc1/page1.jpg",
          "width": 1200,
          "height": 1600,
          "regions": [
            { "x1": 100, "y1": 50, "x2": 400, "y2": 90, "text": "GROCERY STORE" }
          ]
        }
      ]
    }
  ]
}
```

Data loading: Bundled dummy data by default + file picker upload option.

## Design Constraints
- Dark theme, MUI 6, primary `#0bda90`
- Desktop only, major browsers (Chrome, Firefox, Safari, Edge)
- Basic accessibility (contrast, labels, focus indicators)
- No raw hex colours in components — theme tokens only
