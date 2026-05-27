# Design: Phase 2 — Image Viewer + CSV Table

## Image Handler (TUI.ImageEditor)

- Uses NHN's Toast UI Image Editor
- Provides: crop, rotate, flip, filter (15+), drawing, text, shape, icon
- Format conversion on export: PNG / JPG / WebP
- Built-in dark theme support
- React wrapper: `@toast-ui/react-image-editor`

## SVG Handler (Dual Mode)

- Mode A: Rendered preview (inline SVG via `<img>` or `<object>`)
- Mode B: Source code edit (CodeMirror 6 - already installed)
- Toggle switch to switch between modes

## CSV/TSV Handler (PapaParse + TanStack Table)

- Parse: `papaparse` with auto-detection of delimiter
- Render: `@tanstack/react-table` (headless, flexible)
- Features: sticky header, column sort, text filter, row highlight
- Export: CSV / JSON / Markdown Table
- Edit: inline cell editing

## Format Conversion

| From | To | Method |
|------|:--:|:------|
| PNG/JPG/WebP | PNG/JPG/WebP | TUI.ImageEditor export |
| CSV | JSON | papaparse → JSON |
| CSV | Markdown Table | Custom formatter |
| JSON | CSV | Custom formatter |
