# OpenAny

> 通用文件瑞士军刀 — 在浏览器中打开、预览、编辑常见文件格式

纯前端 PWA 应用，集成现有优秀开源项目，不重复造轮子。

## 支持的格式

| 类别 | 格式 | 策略 | 所用项目 |
|:----:|:----:|:----:|:---------|
| 文本/代码 | .txt .py .js .ts .html .css | 源码编辑 | **CodeMirror 6** |
| Markdown | .md .mdx | 所见即所得 | **MDXEditor** |
| JSON | .json | 树形+代码双模式 | **vanilla-jsoneditor** |
| YAML/TOML | .yaml .yml .toml | 转 JSON 后编辑 | **js-yaml + jsoneditor** |
| 未知格式 | — | Hex 兜底 | 自实现 |

## 快速开始

```bash
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
npm run preview # 预览构建产物
```

## 技术栈

- **框架**: Vite 8 + React 19 + TypeScript 5
- **样式**: Tailwind CSS 4
- **状态**: Zustand
- **离线**: PWA (vite-plugin-pwa + workbox)
- **代码分割**: 各编辑器按需加载

## 架构

```
                    OpenAny Architecture
┌─────────────────────────────────────────────────────┐
│                    App Shell                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │FilePicker│  │FileTabs  │  │ Toolbar  │          │
│  └──────────┘  └──────────┘  └──────────┘          │
├─────────────────────────────────────────────────────┤
│  HandlerRegistry → FormatDetect → Handler Render    │
├─────────────────────────────────────────────────────┤
│  TextEditor  JSONEditor  MDEditor  YAMLEditor  Hex  │
│  (CodeMirror) (jsoneditor) (MDXEditor) (bridge)     │
└─────────────────────────────────────────────────────┘
```

## 开源协议

MIT
