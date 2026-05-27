# Phase 1 Text Handler Core — Tasks

## [x] Scaffold project & install deps
- [x] Create Vite + React + TS project
- [x] Install CodeMirror 6 + lang packages
- [x] Install MDXEditor
- [x] Install vanilla-jsoneditor
- [x] Install js-yaml + @iarna/toml
- [x] Install zustand + lucide-react + tailwind + vite-plugin-pwa

## [x] Core infrastructure
- [x] Define Handler interface and Registry
- [x] Implement format detection (extension → MIME → magic bytes)
- [x] Implement FilePicker (drag & drop + input button)
- [x] Implement FileTabs (multi-tab management)
- [x] Implement file read (ArrayBuffer from File object)
- [x] Implement file save (File System Access API + download fallback)
- [x] Set up zustand store for open files

## [x] Build handlers
- [x] Text/Code handler (CodeMirror 6, lazy language loading)
- [x] Markdown handler (MDXEditor WYSIWYG)
- [x] JSON handler (vanilla-jsoneditor tree + code mode)
- [x] YAML/TOML handler (parse → JSON → vanilla-jsoneditor)
- [x] Hex fallback handler

## [x] App integration
- [x] Wire up main App component
- [x] Connect all handlers to registry
- [x] Test full flow: drop file → detect → render
- [x] Test edit + save
- [x] PWA basic setup
