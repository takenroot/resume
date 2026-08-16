# Project Instructions

This file provides context for AI assistants working on this project.

## Project Type: CV Resume Web (Vanilla HTML/CSS/JS)

## Build / Test Commands

No build step — edit source files directly, reload browser.

- **Dev server:** `cd site && python3 -m http.server 8000` (or `bash start.sh`)
- **Self-checks:** `node test/validate-schema.mjs` / `collect-form.mjs` / `render-tags.mjs` / `markdown-profile.mjs` / `fields-sync.mjs` / `header-visibility.mjs` (frameworkless, 直接跑; 改 config/data/editor/markdown 后必跑; 改字段后必跑 fields-sync; 改头部渲染/装箱后必跑 header-visibility)
- **Syntax:** `node --check site/js/*.js`

## Project Structure

| Path | Purpose |
|---|---|
| `site/` | Document root — deploy this directory |
| `site/index.html` | Resume page shell, CDN imports (html2canvas) |
| `site/styles.css` | All styles (layout, editor, toolbar, print @media) |
| `site/js/` | Modular JS — app.js (entry), editor.js, renderer.js, pagination.js, zoom.js, config.js, utils.js, markdown.js, data.js, prefs.js |
| `site/data.json` | Default resume data (tracked seed file, 不是个人数据) |
| `site/fields.json` | 字段全集, vendor 自 cv-autofill — 只读, 只能整体替换升级, 分歧由 test/fields-sync.mjs 抓住 |
| `test/` | Frameworkless node self-checks (*.mjs) |

## PDF / PNG Export

Two modes available:
- **导出 PNG（图片）** — html2canvas screenshot, one PNG per page (text not searchable)
- **导出 PDF（浏览器打印）** — `window.print()` via `@media print` (text searchable)

## Important Notes

- 字体策略：屏幕 + 打印均使用系统字体（`PingFang SC`、`Microsoft YaHei`、`Segoe UI` 等），不再引入 `@font-face` 自定义字体；早期 NotoSansSC 子集字体方案已在 `027ba5c` 撤回（Chrome print 会把自定义中文字体转路径，导致 PDF 文字层丢失）
- 头部两层约定：必备行 `.identity-essential` (icon+值： 职位/电话/意向城市/经验) + 胶囊层 `.identity-line` (其余可选字段 + 期望标签, `packPillRows` 装箱排版, 在可见克隆上 `reflowPillRows` 重测); 头部样式开关 (版式预设/显隐/对齐/头像形状/胶囊密度/分隔线/纯文本) 全存 `cv_prefs` localStorage, 永不进 cvData/导出
- `site/data.json` is initial seed only — after first browser edit, `localStorage` takes over
- `site/backup/` is gitignored; 个人数据文件一律不进仓库
