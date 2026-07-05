# Project Instructions

This file provides context for AI assistants working on this project.

## Project Type: CV Resume Web (Vanilla HTML/CSS/JS)

## Build / Test Commands

No build step — edit source files directly, reload browser.

- **Dev server:** `cd site && python3 -m http.server 8000` (or `bash start.sh`)

## Project Structure

| Path | Purpose |
|---|---|
| `site/` | Document root — deploy this directory |
| `site/index.html` | Resume page shell, CDN imports (html2canvas, jsPDF) |
| `site/styles.css` | All styles (layout, editor, toolbar, print @media) |
| `site/js/` | Modular JS — app.js (entry), editor.js, renderer.js, pagination.js, zoom.js, config.js, utils.js, markdown.js, data.js, prefs.js |
| `site/data.json` | Default resume data |

## PDF Export

Two modes available:
- **导出为图片（PDF）** — html2canvas + jsPDF (screenshot, text not searchable)
- **导出 PDF（浏览器打印）** — `window.print()` via `@media print` (text searchable)

## Important Notes

- 字体策略：屏幕 + 打印均使用系统字体（`PingFang SC`、`Microsoft YaHei`、`Segoe UI` 等），不再引入 `@font-face` 自定义字体；早期 NotoSansSC 子集字体方案已在 `027ba5c` 撤回（Chrome print 会把自定义中文字体转路径，导致 PDF 文字层丢失）
- `site/data.json` is initial seed only — after first browser edit, `localStorage` takes over
- `site/backup/` and `site/data.json` are gitignored — backups and user data stay local
