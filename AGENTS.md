# Project Instructions

This file provides context for AI assistants working on this project.

## Project Type: CV Resume Web (Vanilla HTML/CSS/JS)

## Build / Test Commands

No build step — edit source files directly, reload browser.

- **Dev server:** `cd site && python3 -m http.server 8000` (or `bash start.sh`)
- **Font subset:** `python subset_font.py` (requires fontTools)

## Project Structure

| Path | Purpose |
|---|---|
| `site/` | Document root — deploy this directory |
| `site/index.html` | Resume page shell, CDN imports (html2canvas, jsPDF) |
| `site/styles.css` | All styles (layout, editor, toolbar, print @media) |
| `site/js/` | Modular JS — app.js (entry), editor.js, render.js, layout.js, zoom.js, export.js |
| `site/data.json` | Default resume data |
| `example/` | Sample data |
| `docs/` | Requirements |

## PDF Export

Two modes available:
- **导出为图片（PDF）** — html2canvas + jsPDF (screenshot, text not searchable)
- **导出 PDF（浏览器打印）** — `window.print()` via `@media print` (text searchable)

## Important Notes

- Font files (`NotoSansSC-*.subset.ttf`) are subsets — re-run `subset_font.py` after adding new Chinese text
- `site/data.json` is initial seed only — after first browser edit, `localStorage` takes over
- `site/backup/` and `site/data.json` are gitignored — backups and user data stay local