# Proposal: Phase 2 — Image Viewer + CSV Table

## Problem

Phase 1 支持了文本/代码类文件，但日常工作中还经常需要查看和编辑图片、处理表格数据。

## Goal

为 OpenAny 增加图片查看/编辑能力和 CSV/TSV 表格化查看能力。

## Scope

- 图片：.jpg .jpeg .png .webp .gif .bmp（TUI.ImageEditor）
- SVG：.svg（渲染 + 源码双模式）
- 表格：.csv .tsv（PapaParse + TanStack Table）

## Non-goals

- PDF/DOCX/XLSX 文档预览（Phase 3）
- 音视频播放（Phase 4）
- 批量图片处理
