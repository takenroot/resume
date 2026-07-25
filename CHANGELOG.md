# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Editor "个人信息" 模块: "年龄" 字段改用 "出生日期" (HTML5 原生日期选择器 `<input type="date">`, YYYY-MM-DD); 简历预览按今日日期自动算出年龄 ("X岁")
- Editor now shows a "清除头像" (Clear Avatar) button when a local avatar exists.
- Resume automatically loads the local avatar for the current profile name on render.

### Changed

- 编辑器 UI 重构: 桌面端 (≥769px) 改为左右分屏布局 — 编辑器固定 44vw (无 max-width 上限, 与 page-shell padding-right 严格一致避免覆盖), 编辑器从右滑入同时简历让出右半部分, 两边同时可见互不遮挡. 移动端 (<768px) 保持侧边栏滑入行为不变. 触发按钮改为右上角 ☰, 切换时图标 ☰ ↔ ×, 支持 Esc 关闭. 移除原 modal 半透明背景叠层.

### Changed

- Avatar storage moved from `data.json` to browser `localStorage`, keyed by profile name. New uploads overwrite the old one; no history is kept.
- JSON/Markdown export no longer includes avatar data, significantly reducing export file size.

### Removed

- `docs/spec-ocr-friendly-resume.md` 已完成, 全文删除. Spec 内 "实施历史与关键教训" 已通过 commit 历史 + CHANGELOG 体现, 不再单独归档

## [1.1.0] - 2026-07-05

### Added

- OCR-friendly resume PDF export: system fonts + print font-size lock, verified compatible with Boss 直聘 and 智联招聘 smart parsing.
- Editor support for reordering sections and items, copying items, and removing modules.
- New section types: timeline, certificate, and free text.

### Changed

- Skills layout changed from two-column grid to single column for better OCR/parser readability.
- Date format standardized to `YYYY.MM - YYYY.MM` or `YYYY.MM - 至今`.
- README updated to reflect current project structure, font policy, and editor capabilities.

### Removed

- Removed NotoSansSC `@font-face` custom fonts and `subset_font.py` script (Chrome printed them as paths, breaking PDF text layer).
- Removed unused `site/assets/icons/` dead code.
- Abandoned JS-controlled print margin dropdown (browser print dialog cannot be controlled programmatically).

### Fixed

- Print right-shift issue caused by responsive padding cascade.
- GitHub SVG `viewBox` mismatch (1024 → 24).
- Top timeline not refreshing after importing JSON.

### Technical Details

- Key insight: 智联招聘 requires the personal information in the PDF (name, phone, email) to match the real person before its smart parser will recognize the resume.

## [1.0.0] - 2026-06-30

### Added

- Initial release: static resume website with data-driven rendering, inline editor, JSON/Markdown import & export, auto pagination, and PDF export via `window.print()` and html2canvas + jsPDF.
