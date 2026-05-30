# REASONIX.md — CV 静态简历网页

## Stack

- **Language:** Vanilla HTML5 / CSS3 / ES6+ (no framework, no bundler)
- **Rendering:** Data-driven — JS reads `site/data.json`, then prefers `localStorage`
- **Font subset:** Python script (`subset_font.py`) — Noto Sans SC subset via fontTools

## Layout

| Path | Purpose |
|---|---|
| `site/` | Document root — deploy this directory |
| `site/index.html` | Resume page shell, CDN imports (html2canvas, jsPDF) |
| `site/styles.css` | All styles (layout, editor, toolbar, print @media) |
| `site/js/` | Modular JS — app.js (入口), editor.js, render.js, layout.js, zoom.js, export.js |
| `site/data.json` | Default resume data (JSON) |
| `site/assets/icons/` | SVG icons (phone, email, github, person) |
| `example/` | Sample data |
| `docs/` | `requirement.md` — project requirements |

## PDF Export

Two modes:

| Button | Mechanism | Text searchable? |
|--------|-----------|-----------------|
| 导出为图片（PDF） | html2canvas screenshot + jsPDF page assembly | No (image embedding) |
| 导出 PDF（浏览器打印） | `window.print()` + `@media print` CSS | Yes (native browser print) |

## Conventions

- **Pure global scope** — all JS files use global variables/functions in `<script>` tags
- **No build step** — edit source files directly, reload browser
- **CSS custom properties** — `:root` variables in `styles.css`
- **`data-render` attributes** — HTML elements carry `data-render="profile.name"` etc.; JS resolves them against the JSON data tree
- **Editor config** — new section types only need an entry in `SECTION_CONFIG` (`render.js`)

## Watch out for

- **`site/backup/` is gitignored** — auto-generated backups are excluded
- **Font files are subsets** — `NotoSansSC-*.subset.ttf` only cover chars present in the current data. If you add new Chinese text, re-run `subset_font.py`
- **`site/data.json` is initial seed only** — after first edit, `localStorage` takes over. To reset: clear localStorage or click "重置默认" in the editor