# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Editor "个人信息" 模块: "年龄" 字段改用 "出生日期" (HTML5 原生日期选择器 `<input type="date">`, YYYY-MM-DD); 简历预览按今日日期自动算出年龄 ("X岁")
- Editor now shows a "清除头像" (Clear Avatar) button when a local avatar exists.
- Resume automatically loads the local avatar for the current profile name on render.
- 编辑器实时联动: 任意表单项改动触发 `input` 事件 → debounce 50ms → `collectFormData({ skipSave: true })` (内存更新, **不写 localStorage**) + `renderCv()` + `syncResumeLayout()`. 预览页跟随实时刷新, 不需要点保存.
- 编辑器聚焦联动定位 (按 item): 表单 input 获得焦点时, JS 找最近的 `.editor-section` 容器, 按 `input.name` 解析: `profile.*` → 跳 `.resume-header`; `sectionTitle.I` / `sectionSummary.I` / `sectionText.I` → 跳该 section 标题; **`item.S.I.F` → 跳到该 section 的第 I 个 item** (article/li/p, 通过 `querySelectorAll` 按 DOM 顺序取索引, 跨分页也成立). `scrollIntoView({ behavior: 'smooth', block: 'center' })` + 加 `.preview-highlight` 类触发 1.5s 蓝色淡出动画, 高亮落在具体 item 上. 实时同步重渲后重新定位并高亮当前聚焦字段所属 item.
- 教育背景模块条目新增 `校园经历` 字段 (textarea 多行, 类似自我评价的输入方式): 在 `school/major/degree/period/courses` 之后, 渲染为 `<p class="summary">` (多行用 `<br>` 分隔), Markdown 导出保持缩进的多行列表项. 老 data 自动兼容 (campus 缺省视为空).
- 教育背景条目渲染重构: 主修课程 + 校园经历 都从 item-head 里移出, 各自一个 `.item-section` 容器, 上面有 `.item-section-label` 小标题 (`<h4>`, 灰小粗体), 校园经历按行 split 成 `<ul class="item-section-list">` (有项目符号, 与自我评价对齐), Markdown 导出用 `### 主修课程` / `### 校园经历` 三级标题 + `-` 列表项.
- 示例数据内嵌: `site/js/data.js` 顶部新增 `DEFAULT_DATA` 常量 (原 data.json 内容), `loadCvData` 在 localStorage 为空 + `fetch('./data.json')` 失败时, 改用 `DEFAULT_DATA` 作为示例 demo (不弹错). 这样 `file://` 协议直接打开也能看到示例简历, 不再受 CORS 阻挡. 用户自己的 data.json (HTTP 部署时) 仍走 fetch 优先.
- 修复图片 PDF 导出 (多页简历): 旧 `captureSequential` 用递归实现, 每层递归重新声明 `const pdf = ... null`, 导致 idx>0 时 `pdf.addPage()` 在 null 上调用, 多页简历直接报错 `Cannot read properties of null (reading 'addPage')`. 改为 async/await 顺序执行, 单例 pdf 实例贯穿全流程, 修后多页简历可正常导出.
- 项目经验条目新增 `难点` 字段 (与亮点完全一致机制: textarea 多行, 每行一条): 加在 highlights 之后, 渲染为独立的 `<ul>` bullet 列表 (有内容才渲染), Markdown 导出追加一段 `- ` 列表项. 让项目经历更真实不干巴 (开发者遇到的困难). 老条目自动兼容 (challenges 缺省视为空数组).
- 亮点 + 难点列表加 subheading: 跟教育背景的"主修课程/校园经历"对齐, 都用 `.item-section` 容器 + `<h4 class="item-section-label">` 小标题 (灰小粗体) + `<ul class="item-section-list">` 项目符号. Markdown 导出用 `### 亮点` / `### 难点` 三级标题. 视觉上不再是同一组 bullet, 两个 list 各自带标头.
- 修复跨项目 JSON 导入崩溃: 旧 `normalizeSavedData` 只对 projects.tags 做数组化, 其他字段 (highlights / challenges) 如果来源 JSON 是字符串/object, 直接传到渲染层 `lis()` 的 `(arr || []).map` 报 `(arr || []).map is not a function`. 改为统一对所有 section 条目的 highlights / challenges / tags 走 `arr()` helper (utils.js, 已支持 string→array 拆分), undefined 跳过不创建空数组.
- 修复 live sync 后渲染崩溃 (同上根因): `collectFormData` 把表单 textarea 的字符串值写回 `cvData.items[i].field` 时只 normalize 了 highlights+tags, 没管 challenges. 编辑后页面没更新是因为 renderCv 在 `lis()` 抛错中断. 改为统一对三个数组字段走 `arr()` helper. import 后做表单编辑, 数据形状现在始终是数组.
- 顶部时间轴自动隐藏: 之前 `.timeline-strip` 始终在 DOM 里 (没内容时仍占 padding 留空条). 改为渲染后若 `profile.timeline` 为空 + 无任何教育/工作经历的 period 可抽, 自动 `display: none`. 用户填了自定义 timeline 文字 或 加了带 period 的经历, 才显示. 想完全关掉时间轴, 清空对应字段即可.
- 顶部时间轴显式开关: 编辑器"页面设置"区加 checkbox "显示顶部时间轴" (默认勾选), 状态存到 `cvPrefs.timelineEnabled` (localStorage). 关闭后强制 `display: none`, 不受内容影响. 不依赖 auto-hide 边角条件, 关掉就是关掉. 与 auto-hide 配合: 关掉 → 全隐藏; 勾上 → 自动按内容判定.
- 编辑器模块加折叠按钮: 每个 section 头部多一个 ▾ 按钮 (在 ↑↓× 前面), 点击切换 `.is-collapsed` class. 折叠后 `.editor-module-body { display: none }`, 整个模块正文 (标题输入框 + 条目) 收起, 只剩模块名 + 折叠按钮 + 排序/删除按钮, 操作多个模块之间位置时清爽. chevron 旋转 -90° 视觉上从 ▾ 变 ▸. 不持久化 (关掉编辑器再开会重置, 但这是局部 UI 状态, 不影响简历数据).
- 项目经历渲染补上 period 显示: 之前 experience 和 education 都有 `<span class="item-time">` 显示日期, projects 漏了 (只显示名字 + tags + summary + 亮点/难点). 加 span 后项目日期也右对齐显示.
- `.item-time` 加 `white-space: nowrap` + `flex-shrink: 0`: 日期字符串 (含中文) 在窄容器里会从中间断开 (如 `2025年12月-2026年6\n月`), 因为没强制不换行. 加 nowrap 后日期完整在一行; flex-shrink:0 保证 flex 不压缩日期. 项目 tags 多 (内层 div 宽) 时仍完整显示.
- 个人信息加 `求职状态` 字段 (select, 选项: 随时到岗 / 在职-看机会 / 在职-暂不考虑 / 暂不找工作): 编辑器字段加在 经验 和 所在地 之间, 简历顶部 badge 样式 (蓝填充 + 边框 + 圆角). 空值时 `:empty` 选择器自动隐藏 badge. 个人信息同时删除 `年龄` 字段 (renderer.js 移除 profile.age 特殊处理 computeAge, index.html 移除 / age 那段 span).

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
