# Proposal: Phase 1 — Text Handler Core

## Problem

日常工作和创作中，打开和编辑文本/代码/配置文件需要在多个工具间切换：
- 写 Markdown 开专门的编辑器
- 改 JSON/YAML 找对应的 IDE
- 看日志用记事本
- 每种格式一个工具，切换麻烦

## Goal

构建一个浏览器网页应用的核心文本处理能力，让用户拖入/打开任意文本类文件即可自动识别格式并渲染编辑器。

## Scope

Phase 1 覆盖以下格式：
- 纯文本 (.txt, .log)
- 代码 (.py, .js, .ts, .jsx, .tsx, .html, .css)
- 配置 (.json, .yaml, .yml, .toml, .env, .gitignore)
- Markdown (.md)
- 未知格式的 Hex 兜底

## Non-goals

- 图片/媒体/PDF/Office 等非文本格式（Phase 2-3）
- 远程文件系统 / 云存储集成
- 协作编辑
- AI 辅助编辑
