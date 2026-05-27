# Design: Phase 1 — Text Handler Core

## Architecture

```
User drops/opens file
    ↓
FilePicker (Drag & Drop + File System Access API)
    ↓
FormatDetect (extension → MIME → magic bytes sniff)
    ↓
HandlerRegistry → find best handler
    ↓
Handler renders Viewer/Editor
    ↓
FileTabs (multi-file tabs)

State: zustand store (open files, active tab, handlers)
```

## Format Detection Strategy

1. Extension match (fastest)
2. MIME type match (from File API)
3. Magic bytes sniff (first 4 bytes of buffer)
4. Fallback: hex handler

## Handler Architecture

```typescript
interface FileHandler {
  id: string;
  name: string;
  extensions: string[];
  mimeTypes: string[];
  detect?: (buffer: ArrayBuffer) => boolean;
  canEdit: boolean;
  Viewer: React.ComponentType<ViewerProps>;
  Editor?: React.ComponentType<EditorProps>;
}
```

Handlers are lazily loaded via dynamic imports:
```typescript
const handlerModules = {
  text: () => import('./handlers/text'),
  markdown: () => import('./handlers/markdown'),
  json: () => import('./handlers/json'),
  hex: () => import('./handlers/hex'),
} as const;
```

## Editor Selection

| Handler | Library | License | Reason |
|---------|---------|---------|--------|
| Text/Code | CodeMirror 6 | MIT | Modular, tree-shakable, multi-instance safe, mobile-friendly |
| Markdown | MDXEditor | MIT | React-native WYSIWYG, outputs MD text |
| JSON | vanilla-jsoneditor | Apache 2.0 | Tree + code dual mode |
| YAML/TOML | js-yaml → jsoneditor | MIT | Parse to JSON, reuse jsoneditor |
| Hex | Custom | — | Simple hex dump view |

## Data Flow

```
File Open → readAsArrayBuffer → detectFormat → resolveHandler
    → render Viewer (or Editor if editable)
    → on save: File System Access API createWritable
    → close: cleanup + remove from store
```

## Key Decisions

1. **CodeMirror over Monaco** — 300KB vs 5MB, tree-shaking, multi-instance
2. **MDXEditor for Markdown** — WYSIWYG + MD output, React native
3. **vanilla-jsoneditor for JSON** — Tree + code mode, edit-friendly
4. **YAML/TOML → JSON bridge** — No native YAML editor, parse then reuse
5. **zustand over Redux** — Minimal boilerplate, TypeScript native
6. **File System Access API** — Native save, falls back to download
