# Phase 2 Image + CSV — Tasks

## [x] Install dependencies
- [x] `npm install tui-image-editor @toast-ui/react-image-editor`
- [x] `npm install papaparse @tanstack/react-table`
- [x] Verify TUI.ImageEditor import works

## [x] Image handler (TUI.ImageEditor)
- [x] Create `src/handlers/image.tsx`
- [x] Integrate TUI.ImageEditor with dark theme
- [x] Support: view, crop, rotate, flip, filters
- [x] Format conversion export
- [x] Register in App.tsx

## [x] SVG handler (dual mode)
- [x] Create `src/handlers/svg.tsx`
- [x] Rendered preview mode (inline SVG)
- [x] Source code mode (CodeMirror)
- [x] Mode toggle

## [x] CSV/TSV handler
- [x] Create `src/handlers/csv.tsx`
- [x] Parse with papaparse
- [x] Table render with TanStack Table
- [x] Column sort + text filter
- [x] Inline cell editing
- [x] Export: CSV / JSON / Markdown Table

## [x] App integration
- [x] Register all 3 new handlers in App.tsx
- [x] Verify image file opens correctly
- [x] Verify CSV file opens correctly
- [x] Build passes
