# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- 个人信息 ⚙ 样式弹窗 (`openStyleModal` 通用弹窗, 各模块可复用): 头部字段显隐开关迁入弹窗 + 5 个样式开关 (姓名对齐 / 头像形状圆角-圆形-直角 / 胶囊密度 / 头部分隔线 / 必备行图标显隐) + 必备行布局开关, 全走 CSS 变量不重渲染, 状态存 `cv_prefs` (localStorage) 不进数据/导出.
- 头部版式预设: 分层胶囊 / 纯文本居中 (无头像, 字段 "|" 分隔, 期望类单独一行). 预设 = 开关组合一键套餐, 派生不存储 — 细节开关改任何一项即脱离预设 (自定义), 零状态同步.
- 胶囊层装箱排版 (`packPillRows` 纯函数 + `reflowPillRows` 两遍布局): ≥80% 必备行内容宽的长胶囊独占行, 其余长短双指针搭配凑行, 行按填充宽降序 (第一行铺满); W 测必备行内容宽 (maxRight−minLeft, 兼容居中), 缩放下 rect 坐标归一; 桌面端在分页克隆上重测 (source display:none 量不到), 幂等可重复装箱.
- 自检 `test/header-visibility.mjs` (33 assertions): 必备行/胶囊层渲染 + 显隐开关 + 装箱算法 + 纯文本模式.

### Changed

- 头部改为两层结构: 必备行 (icon+值, 职位/电话/意向城市/经验) + 胶囊层 (籍贯/求职状态/GitHub/微信/邮箱 + 期望职位/薪资/行业标签). 邮箱从必备行挪到胶囊层 (长值不再挤 icon 行), 意向城市从 expectJobs[0].cities 派生. `所在地` 更名 `籍贯`.
- 头像改一寸照比例 5:7 (25×35mm).
- 胶囊层内聚外松: 与必备行拉开 14px, 行距独立 `--pill-rgap` (紧凑 4px / 宽松 8px, 列距 `--pill-gap` 供装箱算法读取).

### Fixed

- 修复制委托断链: `.identity-action[data-copy]` 选择器在头部重构后从未匹配, 电话/邮箱复制点击无反应 — 复制节点补 `identity-action` 钩子类, 邮箱值包 `<span>` 供 `flashCopiedState` 闪现「已复制」.
- 修圆形头像变椭圆: 5:7 盒子上 `border-radius:50%` 是椭圆, 圆形时高度压成宽度 (`--avatar-height = --avatar-width`).
- 修样式弹窗布局: `.editor-field` 表单规则 (label block / input 100%) 权重压过 `.vis-toggle`, radio 被压成独占行、文字挤到下方 — 开关规则提权重 + 弹窗内容分三组 (版式预设/头部显示/细节样式).
- 修胶囊装箱两处: 桌面端装箱从没跑过 (renderIdentityLine 在 display:none source 上量不到宽, 挪到 paginateResume 末尾对可见克隆重测); 行序按填充宽降序 (塞不进搭档的长胶囊不抢第一行).
- 修装箱 W 居中虚宽: 原算法 = 最右 child.right − 容器左缘, nameAlign=center 时把左侧空白算进宽度 — 改测 maxRight − minLeft.

### Added

- `experience[].isIntern` 渲染: item-meta 加「实习」tag (跟 industry/department 同行), mdItem 加 `| 实习` marker.
- `education[].overseasEdu` 新字段: select 是/否 (存 boolean), 渲染「海外留学」tag, mdItem 加 marker.
- `profile.firstWorkDate` 新字段: 编辑器 date input (首次参加工作时间, 招聘平台字段), 预览不渲染.
- `profile.expectJobs` 单条目新 schema: `[{title, jobType, salary:{low,high}, cities[]}]`, 编辑器拍平成一行复合表单 (职位名/工作性质/薪资下限-上限) + 城市 textarea, collectFormData 独立收集重组 (全空 delete).
- 数据 schema 运行时校验: 新增 `validateSchema(d)` 走 `SECTION_CONFIG` 反查字段类型 (未知 type / items 非数组 / `a:true` 字段类型错 / select 非法选项), 导入前拦截, 错误 toast 列出前 3 条. 自检脚本 `test/validate-schema.mjs` (13 assertions, node 直接跑).
- period 时间格式 warning 级校验: `collectWarnings()` 查 `period` 不符合 `YYYY.MM - YYYY.MM / 至今` 约定 (README 格式, 招聘平台智能解析依赖), 不拦截导入, 加载/导入后 toast 提示最多 3 条.
- 导入覆盖确认 + 自动备份: `importData` 导入前弹 confirm, 当前数据备份到 localStorage `cv_backup` 槽位 (`{ts, reason, data}`).
- 每 5 分钟自动快照到 `cv_backup` (数据没变跳过), 编辑器底部加「恢复备份」按钮 (恢复前当前数据会先备份为 `pre-restore`).
- 本地错误队列 (telemetry): `window.onerror` / `unhandledrejection` / 导入异常写 localStorage `cv_errors` (留最近 20 条, 不外发), 编辑器底部加「复制错误」按钮一键拷走 UA + URL + 错误栈.
- 「重置默认」按钮接上 handler (原来是死按钮, 无 JS 绑定): 点击 confirm 后备份当前数据再 `resetCvData()`.
- `docs/cv-schema.json`: cv-autofill `schema/cv-superset.schema.json` 的副本, README 所称 "CV 为 canonical 源" 现在有仓库内凭证.
- `template/` 简历版式研究: 5 种版式 (单栏/双栏侧栏/上下分栏/网格卡片/时间轴) + 4 种头部变体, 每份含结构图/字段容量/平台解析兼容性/代表模板/CV 适配要点, 选型表见 `template/README.md` (结论: 求稳走单栏+H2 无头像三层收束).
- 字段治理 (CROSS_REPO_PLAN 四步全落地): vendor `site/fields.json` (cv-autofill 生成的字段全集只读副本, 只能整体替换升级); 对账测试 `test/fields-sync.mjs` (config key ⊆ fields.json + `CV_OWN` 显式白名单 + camelCase 命名机检, 信息性输出上游有而 config 未用的字段清单); 仲裁规则写进 SCHEMA_NAMING/README (字段存不存在与英文 key → fields.json; 中文 label 与渲染 → CV 自己定); 数据版本戳 `schemaVersion` (saveCvData 落盘盖章, 导出/备份自带, 缺失时 warning 提示不拦截).

### Fixed

- 修 Markdown 个人信息导入不渲染: `FIELD_ALIAS` 定义了但 `parseMarkdown` 从没用过 (死代码), 中文 label (`姓名`/`所在地` 等) 直接存成 profile key → 渲染层按英文 key 读全 miss. parse 现在过 alias 映射. 回归自检 `test/markdown-profile.mjs` (5 assertions).
- 修 data.json 种子数据残留已删字段: experience item 还写着 `highlights` (schema 早已改名 `achievements`).
- 修 avatar 选同一文件不触发 change: 头像 input 选完即清 `value`, 换头像不用再切别的文件.
- 修 B 阶段 boolean 化引入的两处失配: `buildEduHead` / education `mdItem` 判 `isUnified === '是'` 但存储已是 boolean → 「统招」tag 永不渲染; 编辑器是/否 select 跟 boolean 值比较永不命中 → 「否」条目重建表单后视觉回退显示「是」. 新增 `isYes()` helper 统一渲染层判断, `renderItemFieldInput` select 比较前把 boolean 映射回 '是'/'否'. 回归自检 `test/render-tags.mjs` (6 assertions).

### Removed

- 删 `docs/CROSS_REPO_PLAN.md`: 四步全部落地, 内容已蒸馏进上方「字段治理」条目, 按"需求文档做完即删"规则移除.
- 删 `docs/cv-schema.json` (cv-autofill 超集 schema 副本): 被 `site/fields.json` 取代 (生成物, 带 version 戳, 有对账测试守着), schema 副本无测试无更新机制, 纯噪音源.
- 删 `docs/CV_SCHEMA_FEEDBACK.md` (cv-autofill 需求文档): 全部 P0/P1/P2 建议已落地 (achievements/isIntern/industry/department/skillTags/degreeType/isUnified/overseasEdu/thesis/role/link/expectJobs/firstWorkDate/wechat/expectIndustry + validateSchema 构建时校验), 需求状态由本文件记录, 原文档删除减少噪音源. 平台字段映射的活文档 = `docs/SCHEMA_NAMING.md` (已全表刷新).
- 删 `profile.expectSalary` / `profile.expectCities` 独立字段 (跟 `expectJobs[0].salary/cities` 重复, 编辑器要填两遍): 编辑器输入块删除, 头部标签行改从 `expectJobs[0]` 派生. cv-autofill superset schema 同步标 `x-status: merged`.
- 删顶部时间轴整条链 (`autoTimeline` / `extractStartDate` / `getTimelineLabel` / `timeline-strip` / `.tl-*` CSS / 3 个 timeline pref (`timelineEnabled` / `timelineEduField` / `timelineExpField`) / 编辑器预览块 / HTML `<div class="timeline-strip">` 节点). README 时间轴说明同步移除.
- 删 `DEFAULT_DATA` 兜底 (data.json 单源); fetch + normalize 失败时回落到空 schema `{ profile: {}, sections: [] }`.
- 删 `migrateToSections` 老 schema 迁移 (5 天前重构留下的 transform).
- 删 `normalizeSavedData` 里一次性 rename (`challenges` 字段 / `education.experience→honors` 改名) — 不再保留老数据兼容路径, 老字段直接 delete.
- 删 `language.listeningSpeaking` 字段 (schema 声明但 renderItem/mdItem 全不读).
- 删 `THEMES.default` 空 vars 死分支; 启动 fallback 到首个主题.
- 删 `MOBILE_BREAKPOINT` / `TABLET_BREAKPOINT` JS 常量 (双源); `getLayoutMode` 改用 `window.matchMedia` 复用 CSS 媒体查询.
- 删 `copyText` 的 `document.execCommand('copy')` textarea fallback (现代浏览器全支持 `navigator.clipboard.writeText`).
- 删 `docs/个人简历袁文娇(1).doc` + `docs/resume-data*.json` 个人数据文件挪出仓库.
- 删 `SECTION_TYPES` 死常量 + `prefs.js` 顶层 static-bind (DOM 未就绪就挂监听, 全 miss).
- 删 `.pdf-exporting` body class 切换 (CSS 里无定义, 纯死代码) 随截图 PDF 一起清掉.

### Changed

- **profile 中文字段全量英文化** (跟 cv-autofill 定规则: schema key 只用英文 camelCase, 中文留给 UI label): `所在地`→`location`, `求职状态`→`jobStatus`. README / SCHEMA_NAMING.md 对照表同步.
- **全面停止老数据迁移** (项目开发期无正式版本, 老 localStorage 一律「重置默认」重填): 删 所在地/求职状态 rename 块、expectSalary/expectCities→expectJobs 迁移、`delete challenges` 两处、education.experience→honors rename、expectJobs.cities string 拆行; `isYes()` 去掉 `'是'` 字符串分支只认 boolean; `yesNoToBool` 去掉 yes/true/no/false 英文分支 (保留 '是'/'否' — 那是表单 select 的当前提交格式, 不是兼容). cv-autofill adapter 双读逻辑也失去存在意义.
- **collectFormData 声明式白名单重构**: 新增 `PROFILE_FIELDS` / `PROFILE_COMPOSITES` 声明表 (config.js), profile 渲染 (`buildProfileFields`) / 收集 (`collectFormData`) / 校验 (`validateSchema`) 三处共用同一份声明 — 未声明的 `profile.*` input 物理上进不了数据; 复合字段 input 命名去掉 `profile.` 前缀 (`expectSalary.low` 等), 通用循环不再碰, 新增 `collectComposite()` 通用收集器 (空叶子跳过, 全空返回 undefined 删 key). 删老的路径游走 / expectCities 专查 / expectSalary delete / expectJobs 特判四段特设代码. 自检 `test/collect-form.mjs` (8 scenarios).
- 导出菜单重设计 (图片就是图片, PDF 就是 PDF): 砍「截图嵌 PDF」(`exportPdfImage` + `captureSequential` + jsPDF CDN, -1 依赖), 截图导出改 `exportPng()` 每页一张 PNG (多页 `_p1`/`_p2` 后缀, 不拼长图); PDF 只走浏览器打印. 导出 dropdown 收编全部 4 项 (JSON / Markdown / PNG / PDF 打印), 编辑器底部独立「导出 PDF」按钮撤掉.
- `education.isUnified` 默认从 `'否'` 改为 `'是'` (主流本科生是统招, 每次添加都改的体验问题).
- select 是/否字段统一在代码里存 boolean: 老 boolean→string `'是'/'否'` 反向成 string→boolean (`yesNoToBool`). `collectFormData` 末尾调 `normalizeYesNoFields(cvData)` 跟 `loadCvData` 走同一份归一化逻辑.
- `education.campus` / `education.honors` "每行一条"渲染/导出统一走 `lis()` / `mli()` helper (前者原 inline `.map('<li>')`, 后者 `mli(...)`).
- editor.js click handler 合并: `import-json` / `import-md` 重复分支合一 (`importData` 按文件扩展名分支解析); 重复 `closest('[data-action]')` 合并成单次 query.
- `importData` 末尾加 `window.scrollTo(0, 0)` (导入后滚动到顶, 之前停在原滚动位置看不到新内容). 导入/恢复共用 `applyImportedData()` 应用路径 (归一 → 清 DOM → 存 → 渲染 → 滚顶 → 重建编辑器).

## [1.2.0] - 2026-08-14

> 11 个 commit 自 1.1.0 累积。**核心**: 全字段 schema 升级 (P0/P1/P2 招聘平台字段) + 编辑器 bug 修复 + 文档化 + 时间轴默认关闭。

### Added

#### 编辑器增强

- 编辑器实时联动: 任意表单项改动触发 `input` 事件 → debounce 50ms → `collectFormData({ skipSave: true })` (内存更新, **不写 localStorage**) + `renderCv()` + `syncResumeLayout()`. 预览页跟随实时刷新, 不需要点保存.
- 编辑器聚焦联动定位 (按 item): 表单 input 获得焦点时, JS 找最近的 `.editor-section` 容器, 按 `input.name` 解析: `profile.*` → 跳 `.resume-header`; `sectionTitle.I` / `sectionSummary.I` / `sectionText.I` → 跳该 section 标题; **`item.S.I.F` → 跳到该 section 的第 I 个 item** (article/li/p, 通过 `querySelectorAll` 按 DOM 顺序取索引, 跨分页也成立). `scrollIntoView({ behavior: 'smooth', block: 'center' })` + 加 `.preview-highlight` 类触发 1.5s 蓝色淡出动画, 高亮落在具体 item 上. 实时同步重渲后重新定位并高亮当前聚焦字段所属 item.
- 编辑器模块加折叠按钮: 每个 section 头部多一个 ▾ 按钮 (在 ↑↓× 前面), 点击切换 `.is-collapsed` class. 折叠后 `.editor-module-body { display: none }`, 整个模块正文 (标题输入框 + 条目) 收起, 只剩模块名 + 折叠按钮 + 排序/删除按钮. chevron 旋转 -90° 视觉上从 ▾ 变 ▸. 不持久化.
- 编辑器新增 `select` / `checkbox` 字段类型支持: buildItemCard 原本只识别 textarea / 默认 input, 扩展后支持 `f.t === 'select'` (走 f.options) / `f.t === 'checkbox'` (走 el.checked 转 boolean). profile 级字段里 `求职状态` select 路径保留不动 (它已经走独立 buildProfileFields).
- Editor "个人信息" 模块: "年龄" 字段改用 "出生日期" (HTML5 原生日期选择器 `<input type="date">`, YYYY-MM-DD); 简历预览按今日日期自动算出年龄 ("X岁").
- normalizeSavedData 同步扩展: 老数据 string-shape achievements/skillTags/experience 字段加载时自动 arr() 拆, 老 expectCities string 同处理. 老数据 (achievements='业绩1\n业绩2') 渲染出 `<li>业绩1</li>` 通过.
- 修 XSS: `projects.link` 用 `new URL()` 验证协议是 http(s), 否则拒绝渲染 `<a>` 标签. 修前 `esc()` 不防 URL 协议层攻击, 用户输入 `javascript:alert(1)` / `data:text/html,...` 会被 click 触发.
- 修 type 契约: `profile.expectSalary.{low,high,months}` 从 string 改 number 存储 (符合文档定义 `{ low: 7, high: 10, months: 12 }`). collectFormData 给 number input 走 `Number()` 转换, 空字符串保留让 delete 逻辑判定.
- 修 number 0 误删: expectSalary 三个字段 delete 判断从 `!x` 改 `x === ''`, number 0 (合法薪资) 不会被误判空值删除.
- 抽 `renderItemFieldInput(f, v, name)` helper: buildItemCard 原本 4 个 if/else if 链 (select/checkbox/textarea/input) 抽到顶层, 加新类型只改一处. dispatch 风格而非 dispatcher map (YAGNI, 4 类型够直读).
- 抽 `arrFieldsOf(cfg)` helper: collectFormData 末尾的数组 normalize 列表和 normalizeSavedData 都从硬编码 `['highlights', 'achievements', 'tags', 'skillTags', 'experience']` 改成从 `cfg.fields.filter(f.a).map(f.n)` 动态读. 加新数组字段只需在 fields 加 `{ a: true }`, 不需要再维护两处 normalize 列表.
- 删 `projects.highlights` 字段: 用户确认跟项目业绩是同义重复, 编辑器不放, 渲染和 Markdown 导出也不生成对应 block. 老 data 没 highlights 直接跳过, 留 defaults 空数组兜底.
- 所有 checkbox 改 select 是/否: `education.isUnified` / `experience.isIntern` UI 布局在分屏编辑器里 checkbox 难看 (`.checkbox-label` 没生效, 复选框 + label 拼一起不规整). 改 `t: 'select', options: ['是', '否']`, defaultItem 是 `'否'`. 老数据 boolean (true/false) normalize 时自动转 '是'/'否'. collectFormData 移除 `isCheckbox ? !!el.checked : el.value` 分支, 统一走 `el.value` (select 值就是 string).
- 抽 `renderProfileFieldInput(f, profile)` helper: buildProfileFields 里 12 个 profile 字段的 input 拼接抽到顶层, 跟 renderItemFieldInput 对称. 支持 'select' / 'date' / 默认 text. 加新 profile 字段不需要再改 buildProfileFields 主体.
- expectSalary placeholder 提示单位: "下限 K" / "上限 K" / "月数" (单位 K/月在 label 里, placeholder 跟单位对齐).
- 抽 `buildEduHead(i)` helper: education item-head 原本 5 个 if 链展开 (school · major · degree · (degreeType) · 统招) 抽到顶层. isUnified 不再挤进 h3, 改走 .item-meta 旁挂 .item-meta-tag 视觉跟 experience.industry/department 对齐. mdItem 同步简化 (主字段走 `if (xxx) md += ' | xxx'`, 跟 if-chain 拆开).
- 抽 `clearImportDom()` helper: importData 里 15 行 DOM 清空逻辑抽到顶层, 跟 `importData` 主体分离, importData 缩到 24 行, 流水线感更强 (parse → validate → clear → save → render → rebuild).
- 重命名 `education.experience` (在校经历) → `education.honors` (荣誉奖项): 跟 superset 字段名对齐, 消除"工作经历 section type"和"教育 item 字段"都叫 experience 的歧义. normalizeSavedData + collectFormData 双重兜底 (rename + delete), 老数据下次打开编辑器就自动迁移. 渲染层 label 从 "在校经历" 改成 "荣誉奖项" (语义更准). 老字段 `campus` 保留不变 (校园经历含义已涵盖).
- 删 `experience.highlights` 字段: 跟 projects.highlights 一致处理 (commit 56be0c2). 用户明确"亮点改成工作业绩", 不留 `highlights` 字段兼容 (老数据由用户手动迁移到 achievements — 见 docs/resume-data.json 已合并 6 个 item, total 19 条 achievements). `_EXP_SHARED.fields / defaultItem / renderItem / mdItem` 全部移除 highlights 引用. normalizeSavedData / collectFormData 不再 rename 兜底 (避免技术债).
- 加 `language` section (语言能力): SECTION_CONFIG 新增完整实现 (fields + renderItem + mdItem + defaultItem). 5 字段: name (语种 select 9 选项) / proficiency (熟练程度) / level (等级如 CET-6) / listeningSpeaking (听说, 智联拆分) / readingWriting (读写, 智联拆分). 渲染时 level 跟 name 同行, proficiency/readingWriting 走 .item-meta-tag 旁挂. 命名分歧注释里说明 (猎聘=语言+熟练程度+等级, 智联=语种+听说+读写, 超集取并集). 跟 [cv-autofill schema](cv-autofill/schema/cv-superset.schema.json) languageItem 对齐.
- profile.currentSalary 加数据结构但隐藏字段: 用户要求存数据 (cv-autofill 引擎读得到) 但 UI 不显示 (薪资敏感). 实现: 不在 editor flds / renderer template / markdown 导出出现, 用户手写 JSON 才能填. 代码注释明确这是 "hidden field" 设计, 等需要时再加 input.
- 顶部时间轴默认关闭 + 配置开关: 当前市场不认可简历里带顶部时间轴 strip (这种设计在 LinkedIn / Boss 等平台上不常见). 默认 cvPrefs.timelineEnabled = false, 顶部时间轴 strip 自动隐藏. 编辑器 "顶部时间轴预览" 小窗同步受开关控制 (关掉时不显示). 用户主动勾选 "显示顶部时间轴" checkbox 还能开 — 计算逻辑 (autoTimeline / getTimelineLabel) 全部保留, pref 字段选择 (prefTlEdu / prefTlExp) 也保留. onPrefTimelineEnabled 在编辑器打开时同时调 buildEditorForm 让预览块立即出现/消失. 3 处一致 (renderer.js / editor.js / prefs.js).

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