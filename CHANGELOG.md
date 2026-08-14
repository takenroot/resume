# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-08-14

> 11 个 commit 自 1.1.0 累积。**核心**: 全字段 schema 升级 (P0/P1/P2 招聘平台字段) + 编辑器 bug 修复 + 文档化 + 时间轴默认关闭。

### Added

#### 编辑器增强

- 编辑器实时联动: 任意表单项改动触发 `input` 事件 → debounce 50ms → `collectFormData({ skipSave: true })` (内存更新, **不写 localStorage**) + `renderCv()` + `syncResumeLayout()`. 预览页跟随实时刷新, 不需要点保存.
- 编辑器聚焦联动定位 (按 item): 表单 input 获得焦点时, JS 找最近的 `.editor-section` 容器, 按 `input.name` 解析: `profile.*` → 跳 `.resume-header`; `sectionTitle.I` / `sectionSummary.I` / `sectionText.I` → 跳该 section 标题; **`item.S.I.F` → 跳到该 section 的第 I 个 item** (article/li/p, 通过 `querySelectorAll` 按 DOM 顺序取索引, 跨分页也成立). `scrollIntoView({ behavior: 'smooth', block: 'center' })` + 加 `.preview-highlight` 类触发 1.5s 蓝色淡出动画, 高亮落在具体 item 上. 实时同步重渲后重新定位并高亮当前聚焦字段所属 item.
- 编辑器模块加折叠按钮: 每个 section 头部多一个 ▾ 按钮 (在 ↑↓× 前面), 点击切换 `.is-collapsed` class. 折叠后 `.editor-module-body { display: none }`, 整个模块正文 (标题输入框 + 条目) 收起, 只剩模块名 + 折叠按钮 + 排序/删除按钮. chevron 旋转 -90° 视觉上从 ▾ 变 ▸. 不持久化.
- 编辑器新增 `select` / `checkbox` 字段类型支持: buildItemCard 原本只识别 textarea / 默认 input, 扩展后支持 `f.t === 'select'` (走 f.options) / `f.t === 'checkbox'` (走 el.checked 转 boolean). profile 级字段里 `求职状态` select 路径保留不动 (它已经走独立 buildProfileFields).
- Editor "个人信息" 模块: "年龄" 字段改用 "出生日期" (HTML5 原生日期选择器 `<input type="date">`, YYYY-MM-DD); 简历预览按今日日期自动算出年龄 ("X岁").
- Editor now shows a "清除头像" (Clear Avatar) button when a local avatar exists.
- Resume automatically loads the local avatar for the current profile name on render.

#### 渲染层增强

- 项目经历渲染补上 period 显示: 之前 experience 和 education 都有 `<span class="item-time">` 显示日期, projects 漏了. 加 span 后项目日期也右对齐显示.
- `.item-time` 加 `white-space: nowrap` + `flex-shrink: 0`: 日期字符串 (含中文) 在窄容器里会从中间断开 (如 `2025年12月-2026年6\n月`), 因为没强制不换行. 加 nowrap 后日期完整在一行; flex-shrink:0 保证 flex 不压缩日期.
- 教育背景条目渲染重构: 主修课程 + 校园经历 都从 item-head 里移出, 各自一个 `.item-section` 容器, 上面有 `.item-section-label` 小标题 (`<h4>`, 灰小粗体), 校园经历按行 split 成 `<ul class="item-section-list">` (有项目符号, 与自我评价对齐), Markdown 导出用 `### 主修课程` / `### 校园经历` 三级标题 + `-` 列表项.
- 亮点 + 难点列表加 subheading: 跟教育背景的"主修课程/校园经历"对齐, 都用 `.item-section` 容器 + `<h4 class="item-section-label">` 小标题 (灰小粗体) + `<ul class="item-section-list">` 项目符号. Markdown 导出用 `### 亮点` / `### 难点` 三级标题.

#### 字段扩展 (招聘平台字段反馈 P0/P1/P2)

> 完整设计来自 [docs/CV_SCHEMA_FEEDBACK.md](docs/CV_SCHEMA_FEEDBACK.md) + [docs/SCHEMA_NAMING.md](docs/SCHEMA_NAMING.md). 跟 cv-autofill superset schema 对齐.

- **P0 experience.achievements** (string[]): 工作业绩独立于工作内容, 解决 Boss/猎聘双 textarea 硬结构.
- **P1 profile.expectSalary** ({low, high, months}): 三框联动数字输入 (K/月). number 类型存储.
- **P1 profile.expectCities** (string[]): 期望城市多选.
- **P1 profile.expectIndustry / wechat**: 期望行业 + 微信号.
- **P1 education.degreeType** (select 3 选项): 全日制 / 非全日制 / 自考. 渲染时跟 degree 拼成 `本科 (全日制)`.
- **P1 experience.isIntern** (select 是/否): 实习 checkbox UI 难看, 改 select options ['是','否'].
- **P2 education.experience** (string[]): 在校经历. **注意**: 同 session 后续 commit 重命名为 `honors` (语义更准, 消歧义).
- **P2 education.thesis** (textarea): 毕设/论文描述.
- **P2 education.campus** (textarea 多行): 校园经历 (职务/活动).
- **P2 experience.industry / department / skillTags** (string / string / string[]): 行业 / 部门 / 每段经历技能标签.
- **P2 projects.role / link / achievements**: 担任角色 (meta-tag badge) / 项目链接 (`.project-link` 区块带 target=_blank, 走 new URL() XSS 防护) / 项目业绩.

#### 新模块类型

- 新增模块类型 `其它经历` (SECTION_CONFIG.experience_other): 与 `工作经历` (experience) 共享同一份 fields / renderItem / mdItem / defaultItem, 只换 label. 把经验模块的共享配置抽到顶层 const `_EXP_SHARED`, 两个 SECTION_CONFIG 条目用 `..._EXP_SHARED` 展开, 单一数据源.
- 加 `language` section (语言能力): 5 字段 (name 语种 / proficiency 熟练程度 / level 等级 / listeningSpeaking 听说 / readingWriting 读写). 跟 cv-superset.languageItem 对齐.

#### 隐藏字段 (UI 不渲染, 数据存)

- `profile.expectSalary` / `expectCities` / `currentSalary` 加数据结构但默认隐藏 UI (薪资敏感). 用户主动在编辑器填或手写 JSON 才有. 代码注释明确这是 "hidden field" 设计.

#### 文档

- 复制 [cv-autofill/docs/CV_SCHEMA_FEEDBACK.md](docs/CV_SCHEMA_FEEDBACK.md) 到本项目 docs, 配套新增 [docs/SCHEMA_NAMING.md](docs/SCHEMA_NAMING.md) 字段命名对照表.
- README 大幅更新: 模块清单补到 11 个 / 字段详细说明 / 隐藏字段机制 / start.sh 端口探测说明.

### Changed

- 个人信息加 `求职状态` 字段 (select, 选项: 随时到岗 / 在职-看机会 / 在职-暂不考虑 / 暂不找工作): 编辑器字段加在 经验 和 所在地 之间.
- `求职状态` 重排到 identity-meta (替换原来的性别显示位): 用公文包 SVG icon + 纯文字, 无 badge 样式. 头部姓名下方一横条 title/experience/所在地 之间用 ` | ` 字面分隔. 删了 .profile-status / .profile-status:empty CSS 规则. 性别 (profile.gender) 不再渲染 (data 字段保留在 form, 不强制删).
- 头部姓名下方"如果不填就不显示 |" 的规则: renderer.js 里 `renderHeaderRow()` 动态构建这条横条: 遍历 `[title, experience, 所在地]` 三个字段, 过滤出非空项, 只在非空项之间插 " | " (最后一个非空项后面不插). 旧 CSS ::before + :has() 方案已撤掉, 逻辑收敛在一处更直观.
- 顶部时间轴显式开关: 编辑器"页面设置"区加 checkbox "显示顶部时间轴", 状态存到 `cvPrefs.timelineEnabled` (localStorage). 默认 false (市场不认可,主流招聘平台都没这设计). 计算逻辑 (autoTimeline / getTimelineLabel) 全部保留. 3 处一致 (renderer.js / editor.js / prefs.js).

### Deprecated

- `projects.highlights` 字段已删除,统一由 `achievements` 承担.
- `experience.highlights` 字段已删除,统一由 `achievements` 承担.
- `education.experience` 字段已重命名为 `education.honors`. 老数据下次打开编辑器自动迁移.

### Removed

- `projects.highlights` 字段: 用户确认跟项目业绩是同义重复.
- `experience.highlights` 字段: 同上.
- `profile.age` 字段: 被 `birthDate` 替代 (HTML5 原生日期选择器).
- `docs/spec-ocr-friendly-resume.md` 已完成, 全文删除. Spec 内 "实施历史与关键教训" 已通过 commit 历史 + CHANGELOG 体现.

### Fixed

- 修复导入 JSON 后姓名/个人信息不更新: renderCv 的 data-render 分支在 `v` 为空且元素已有 children 时只 add `is-empty` 类不清 textContent. 改为导入前显式清空所有 data-render 元素的 textContent + 整块 replaceChildren resumeSource + 清空 headerRow.
- 修复编辑器模块标签 (module-type-label) 跟用户改的标题 (sectionTitle 输入框) 视觉错位: buildEditorSectionForm 里 `module-type-label` 改用 `(sec.title || cfg.label)`. liveSyncPreview 跑 collectFormData 后再同步刷一遍 label 文字.
- 修复 editorPanel hidden 状态错位: index.html 初始 `hidden` 属性覆盖 CSS `display: flex`. 去掉初始 hidden, openEditor / closeEditor 显式设 `ep.hidden = false / true`.
- 修复 collectFormData 浅拷贝引发的跨模块越界: `cvData.sections.map(s => Object.assign({}, s))` 浅拷只复制外层, `s.items` 沿用同一引用. push 会越界. 改为对 `s.items` 显式 `slice()`.
- 修复 summary 模块占位项首次 collectFormData 后被清空: 默认占位 `[""]` 被 `filter(Boolean)` 变成 `[]`. 改为占位且未输入时保留 `[""]`.
- 修复图片 PDF 导出 (多页简历): 旧 `captureSequential` 递归每层重新声明 `pdf = null`, 多页简历直接报错 `addPage()` on null. 改为 async/await 顺序执行.
- 修复跨项目 JSON 导入崩溃: `normalizeSavedData` 只对 projects.tags 做数组化, 其他字段 (highlights / challenges) 字符串/object 传到 `lis()` 报 `map is not a function`. 改为统一走 `arr()` helper.
- 修复 live sync 后渲染崩溃 (同上根因): collectFormData 把表单 textarea 字符串值写回 cvData.items, 没 normalize challenges. 改为统一对三个数组字段走 `arr()` helper.
- 修 XSS: `projects.link` 用 `new URL()` 验证协议是 http(s), 否则拒绝渲染 `<a>`. 修前 `esc()` 不防 URL 协议层攻击 (用户输入 `javascript:alert(1)` / `data:text/html,...` 会被 click 触发).
- 修 type 契约: `profile.expectSalary.{low,high,months}` 从 string 改 number 存储. collectFormData 给 number input 走 `Number()` 转换.
- 修 number 0 误删: expectSalary delete 判断从 `!x` 改 `x === ''`, number 0 (合法薪资) 不会被误删.
- 所有 checkbox 改 select 是/否: `education.isUnified` / `experience.isIntern` UI 布局在分屏编辑器里 checkbox 难看. 老数据 boolean normalize 时自动转 '是'/'否'.
- 重命名 `education.experience` → `education.honors` (荣誉奖项): 跟 superset 字段名对齐, 消除跟"工作经历 section type"同名歧义.

### Refactored

- 抽 `moduleLabel(sec)` helper: buildEditorSectionForm 跟 liveSyncPreview 各写一遍 `sec.title || ...label...` 表达式, 抽到顶层单一函数.
- 抽 `renderItemFieldInput(f, v, name)` helper: buildItemCard 原本 4 个 if/else if 链 (select/checkbox/textarea/input) 抽到顶层, 加新类型只改一处.
- 抽 `renderProfileFieldInput(f, profile)` helper: buildProfileFields 里 12 个 profile 字段的 input 拼接抽到顶层, 跟 renderItemFieldInput 对称.
- 抽 `buildEduHead(i)` helper: education item-head 原本 5 个 if 链展开 (school · major · degree · (degreeType) · 统招) 抽到顶层. mdItem 同步简化.
- 抽 `clearImportDom()` helper: importData 里 15 行 DOM 清空逻辑抽到顶层, importData 缩到 24 行.
- 抽 `arrFieldsOf(cfg)` helper: collectFormData 末尾的数组 normalize 列表和 normalizeSavedData 都从硬编码改成从 `cfg.fields.filter(f.a)` 动态读.
- expectSalary placeholder 提示单位: "下限 K" / "上限 K" / "月数" (跟 label 里 "K/月" 单位对齐).
- 删 normalizeSavedData / collectFormData 里的 highlights rename 兜底 (用户明确"不留技术债"), 老数据由用户手动迁移.

### Verification

- Playwright 黑盒测试 30+ 场景全过: 导入 / 导出 / 编辑器 / 字段渲染 / 老数据兼容 / 排序 / 折叠 / 实时联动 / 字段显隐。

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