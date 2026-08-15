# CV 简历网页 — 重构路线图

> 汇总三组问题：**过度设计**（不该存在）、**设计缺位**（该有未有）、**死代码/不一致**（细节清理）。
> 优先级 P0 → P4。P0 必须解决；P1 用户感知强；P2 体验增强；P3 架构补全；P4 一致性细节。
> "范围"列给出预估影响行数 / 文件数 / 依赖数。

## 总览

| 优先级    | 类别     | 问题                                                                                                                                                              | 建议                                                                                                                                           | 范围                                | 风险                  | 状态                                                    |
| ------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | ------------------- | ----------------------------------------------------- |
| **P0** | 过度设计   | 顶部时间轴整条链默认关却全保留（renderer/prefs/zoom/CSS/HTML 跨文件）                                                                                                               | 删除 `autoTimeline` + `extractStartDate` + `getTimelineLabel` + 2 个 timeline pref + `.timeline-strip` CSS + `tl-*` 类 + HTML 节点 + 编辑器预览块 + 事件监听 | ~150 行 / 5 文件 / 0 依赖              | 低（README 已承认此功能被砍）  | 砍了                                                    |
| **P0** | ⛔ 决策 1 | 隐藏字段 UI（`expectSalary` / `expectCities` / `expectIndustry` / `wechat` / `timeline` 编辑器 + 渲染）+ `renderHeaderExtra` + `.header-extra` —— 数据存但预览永不渲染；**与新增字段决策冲突** | 见下方决策 1                                                                                                                                      | ~80 行（删 UI）/ 或 +30 行（renderer 渲染） | 中                   | ✅ 已批注"先都要"; 2026-08-15 又精简: expectSalary/expectCities 删独立字段并入 expectJobs[0], 头部标签从其派生 |
| **P0** | 过度设计   | html2canvas + jspdf 两枚 CDN（截图嵌图 PDF）—— 与 `window.print()` 重复功能                                                                                                  | 删 `exportPdfImage` + `captureSequential` + 两个 `<script src=cdn>` 标签 + 编辑器菜单项                                                                 | ~50 行 / 2 文件 / **-2 deps**        | 中（部分用户依赖截图 PDF）     | ✅ 完成 (C 阶段: 截图改导出 PNG, PDF 只走打印, 删 jsPDF CDN)   |
| **P0** | 死代码    | `docs/个人简历袁文娇(1).doc` + `docs/resume-data (1).json` + `docs/resume-data.json` —— 个人数据 + Word 文件                                                                 | 挪出仓库（移到仓库外目录）                                                                                                                                | 3 文件 / 0 行                        | 低（全部 untracked）     | 删除，我有备份                                               |
| **P0** | 死代码    | `DEFAULT_DATA` (data.js:5-16) 跟 `site/data.json` 字面同种子 —— 双兜底                                                                                                   | 删一份；建议留 `data.json`（用户能直接编辑），删 `DEFAULT_DATA`                                                                                                | ~12 行 / 1 文件                      | 低                   | 可以                                                    |
| **P0** | 死代码    | `migrateToSections` 老 schema 迁移（5 天前重构留下）                                                                                                                       | 删                                                                                                                                            | ~10 行 / 1 文件                      | 低（CHANGELOG 已记录此重构） | 可以                                                    |
| **P0** | 死代码    | `normalizeSavedData` 一次性 rename（`challenges` 删除 / `experience→honors` 重命名 / `age` 删除 / boolean→是/否转 string）                                                     | 删，假设无遗留数据                                                                                                                                    | ~25 行 / 1 文件                      | 中（需用户确认无遗留）         | 年龄不删；最好是前端下拉选是/否（这样ui好看一些，也更一致），代码里boolean，这样你就不用纠结了。 |
| **P0** | 死代码    | `SECTION_TYPES` 常量零引用                                                                                                                                           | 删                                                                                                                                            | 1 行                               | 零                   | 可以                                                    |
| **P0** | 死代码    | `prefs.js:11-12` 顶层 static-bind —— 脚本加载时 DOM 未就绪，监听全部 miss                                                                                                      | 删那两行；监听逻辑已在 `bindPrefChangeEvents` 重建表单时挂                                                                                                    | 2 行                               | 低                   | 可以                                                    |
| **P0** | 死代码    | `import-json` / `import-md` 分支各一行重复代码                                                                                                                           | 合并一个 data-action 分支                                                                                                                          | 4 行                               | 零                   | 可以                                                    |
| **P0** | 死代码    | `editor.js` 同一 click handler 内 `const ab` / `const ab2` 重复 `closest('[data-action]')`                                                                           | 合并成一个                                                                                                                                        | 5 行                               | 低                   | 可以                                                    |
| **P0** | 死代码    | `language.listeningSpeaking` 字段声明但 renderItem/mdItem 全不读                                                                                                        | 删字段定义                                                                                                                                        | 1 行                               | 零                   | 可以                                                    |
| **P0** | 一致性    | `MOBILE_BREAKPOINT` 常量（zoom.js）跟 CSS `@media (max-width: 767px)` 重复定义 —— 双源必漂                                                                                   | 二选一：常量驱动 CSS 变量，或 CSS 单一字面量                                                                                                                  | 4 行                               | 低                   | 可以，你决定留一个就行                                           |
| **P1** | 设计缺位   | 编辑器**无 undo/redo** —— 所有操作直接覆盖 cvData + localStorage，无历史栈                                                                                                       | 加最近 N 步快照栈（无需 Command pattern）                                                                                                               | ~60 行 / 2 文件                      | 中（数据结构设计）           | → issue #1                                                   |
| **P1** | 设计缺位   | **数据 schema 无运行时校验** —— 导入坏 JSON 让 normalize 抛错，用户看到红字无 UI                                                                                                      | 加 `validateSchema(d)` 走 SECTION_CONFIG 反查，错误 toast 反馈                                                                                        | ~40 行 / 2 文件                      | 中（校验逻辑要覆盖 8 种 type） | ✅ 完成 (E 阶段)                                            |
| **P1** | 设计缺位   | **导入覆盖无确认** —— `importData` 直接覆盖 cvData + localStorage，旧数据瞬间消失                                                                                                  | 加确认对话框 + 旧版本备份到 `_backup` 槽位                                                                                                                 | ~20 行 / 2 文件                      | 低                   | ✅ 完成 (E 阶段, 槽位名 `cv_backup`)                         |
| **P1** | 设计缺位   | **没有空模板选项** —— 首次打开看到张三示例，手动全删才能开始                                                                                                                              | 加"清空开始 / 加载示例"二选一对话框                                                                                                                         | ~30 行 / 1 文件                      | 低                   | → issue #2 (用户批注: 重置默认按钮当时想到是这个作用，可能还需要再设计)                              |
| **P1** | 设计缺位   | **导入后不滚动到顶** —— `importData` 不 `scrollTo(0,0)`                                                                                                                  | 加一行                                                                                                                                          | 1 行                               | 零                   | ✅ 完成 (A 阶段)                                             |
| **P1** | 过度设计   | `start.sh` 40 个端口黑名单 —— 单一用户本地启动，黑名单无增益                                                                                                                         | 删 BLACKLIST + pick_port 简化，start=8765 bind 失败 +1 重试                                                                                          | ~30 行 / 1 文件                      | 低                   | 不动                                                    |
| **P1** | 过度设计   | `copyText` 的 `document.execCommand('copy')` fallback —— 现代浏览器全支持 `navigator.clipboard.writeText`                                                                | 删 textarea 兜底，留单行 + try/catch                                                                                                                | ~10 行 / 1 文件                      | 低（极老浏览器不支持）         | 可以                                                    |
| **P1** | 过度设计   | `prefs.js` THEMES / FONT_SIZES / FONT_FAMILIES 字典（4+3+3=10 选项）—— 单一用户本地简历，预设默认够用                                                                                | 删选择器 UI，留字面量默认（theme/fontSize/fontFamily 直接写死或用最常用项）                                                                                         | ~50 行 / 2 文件                      | 中（用户可能已切换偏好）        | → issue #3                                                   |
| **P1** | 一致性    | `@media (max-width: 1280px)` 只改 page-shell padding 一条                                                                                                           | 删，跟 1024 那档合并                                                                                                                                | 5 行                               | 零                   | 可以                                                    |
| **P1** | 一致性    | `education.campus` 跟 `education.honors` "每行一条"走两套实现（前者 `.map('- ' + l)` 后者 `mli(...)`）                                                                          | 统一走 `mli`                                                                                                                                    | 5 行                               | 零                   | 可以                                                    |
| **P1** | 一致性    | `isUnified` 默认 `'否'` —— 主流本科生是统招，每次添加都改                                                                                                                         | 改默认 `'是'`                                                                                                                                    | 1 行                               | 低                   | 可以                                                    |
| **P2** | 设计缺位   | **没有键盘快捷键** —— 模块移/添/保存全靠鼠标                                                                                                                                     | 加 `Cmd+Z/Y` `Cmd+↑/↓` `Cmd+S`                                                                                                                | ~40 行 / 2 文件                      | 中（要处理焦点冲突）          | → issue #7 (用户批注: 可以但是优先级靠后)                                             |
| **P2** | 设计缺位   | **没有 dark mode** —— `THEMES` 全是浅色，OS dark mode 用户期望落空                                                                                                           | 加 `dark` theme 走 `@media (prefers-color-scheme)`                                                                                             | ~30 行 / 2 文件                      | 低                   | → issue #4                                                   |
| **P2** | 设计缺位   | **搜索/定位缺失** —— 内容多了（5+ 段经历）找不到特定条目                                                                                                                              | 编辑器顶部加搜索框，结果高亮                                                                                                                               | ~40 行 / 1 文件                      | 中                   | → issue #5                                                   |
| **P2** | 设计缺位   | **打印页边距设计被甩给浏览器** —— `@page { margin: 0 }` 锁死 + 让用户在浏览器对话框改                                                                                                     | 加 `printMargin` pref（none/small/normal）跟 prefs.js 集成                                                                                         | ~30 行 / 2 文件                      | 低                   | → issue #6 (用户批注: ai 没有好的解决方法，js 不能改浏览器设置，待定)            |
| **P2** | 设计缺位   | **avatar 选同一文件不触发 change** —— 换头像须切别的再切回来                                                                                                                       | 上传后清空 `input.value = ''`                                                                                                                     | 1 行                               | 零                   | ✅ 完成 (F 阶段)                                             |
| **P3** | 设计缺位   | **无版本/快照** —— localStorage 单 key 一覆盖，误操作/清缓存 = 数据没了（`site/backup/` 目录存在但代码无写入机制）                                                                                | 加自动每 5 分钟导出到 backup 槽位 + 手动"恢复上次备份"按钮                                                                                                        | ~50 行 / 2 文件                      | 中                   | ✅ 完成 (E 阶段, localStorage `cv_backup` 单槽位)            |
| **P3** | 设计缺位   | **跨项目协作无运行时校验** —— README 称字段命名以 CV 为 canonical 源，但仓库无 schema.json 副本                                                                                           | 把 cv-autofill/schema/cv-superset.schema.json 软链或拷贝到 `docs/cv-schema.json`                                                                    | 1 文件                              | 零                   | ✅ 完成 (E 阶段, 拷贝)                                       |
| **P3** | 设计缺位   | **无 telemetry/error reporting** —— `console.error` 仅本地打印                                                                                                        | 加"复制错误详情"按钮 + 本地错误队列                                                                                                                         | ~30 行 / 2 文件                      | 低                   | ✅ 完成 (E 阶段, localStorage `cv_errors` 队列)              |
| **P3** | 文档化    | **多语言缺失未声明** —— UI 全硬编码中文，README 没说"仅支持中文 UI"                                                                                                                   | README 顶部加一行说明                                                                                                                               | 1 行                               | 零                   | → issue #8                                                   |
| **P3** | 文档化    | **`SECTION_CONFIG` 写死 8 种 type 不支持自定义 section**                                                                                                                 | README 模块表加"自定义需改源码"注                                                                                                                        | 3 行                               | 零                   | 可以                                                    |
| **P3** | 文档化    | **`data.json` vs localStorage 优先级与 `.gitignore` 自相矛盾** —— README 说 data.json 是种子，gitignore 排除                                                                   | 二选一：要么从 .gitignore 移除，要么 README 改"data.json 仅首次无 localStorage 时用"                                                                            | 2 处                               | 低                   | README 改"data.json 仅首次无 localStorage 时用"              |
| **P3** | 文档化    | **Markdown "标准格式"过度宣传** —— 实际只支持项目自定义 pipe 格式                                                                                                                   | README 改名"自定义 Markdown 方言"，附 sample                                                                                                          | 5 行                               | 零                   | → issue #9                                                   |
| **P4** | 一致性    | `buildEditorPrefs` 跟时间轴 pref 绑死（`prefTlEdu` / `prefTlExp`）                                                                                                      | 跟 P0 时间轴一起删                                                                                                                                  | 0 行（依赖 P0）                        | 零                   | 可以                                                    |
| **P4** | 一致性    | `THEMES` 字典 `default: { vars: {} }` 空对象 —— 永远 true 的死分支                                                                                                         | 删 default key，或在 applyPrefs 里加 `if (vars)`                                                                                                   | 3 行                               | 零                   | 你决定                                                   |

## 新增字段（来自 cv-autofill 评分 ≥3）

> 用户已确认字段集合，按 cv-autofill `docs/CV_SCHEMA_FEEDBACK.md` 评分。
> CV schema 多数已定义（见 config.js），主要是 renderer 不渲染 + 少量 schema 未加。
> 这些条目**必须在决策 1 后**才能定优先级。

| 优先级    | 字段                             | CV 现状                   | 需要做的                                                                                    | 范围           | 风险           | 状态  |
| ------ | ------------------------------ | ----------------------- | --------------------------------------------------------------------------------------- | ------------ | ------------ | --- |
| **P1** | `experience[].achievements`    | schema 有,renderer 不渲染   | renderer 加 `<h4>工作业绩</h4><ul>` 块（已有 `lis()` helper）                                     | ~15 行 / 1 文件 | 低            | ✅ 完成 (renderer 已渲染, D 阶段确认)  |
| **P1** | `experience[].isIntern`        | schema 有,renderer 不渲染   | renderer 加 tag 显示"实习"（类比现有 `industry/department` tag）                                   | ~5 行 / 1 文件  | 零            | ✅ 完成 (D 阶段)  |
| **P1** | `experience[].industry`        | schema 有,renderer 不渲染   | renderer tag 渲染（已有逻辑,确认无误）                                                              | ~3 行 / 1 文件  | 零            | ✅ 完成 (renderer 已渲染, D 阶段确认)  |
| **P1** | `experience[].department`      | schema 有,renderer 不渲染   | 同上                                                                                      | ~3 行 / 1 文件  | 零            | ✅ 完成 (renderer 已渲染, D 阶段确认)  |
| **P1** | `experience[].skillTags`       | schema 有,renderer 不渲染   | renderer 加 `<ul class="tag-list">` 块（已有逻辑）                                              | ~3 行 / 1 文件  | 零            | ✅ 完成 (renderer 已渲染, D 阶段确认)  |
| **P2** | `profile.expectJobs` 单条目       | schema 无                | schema 加 `profile.expectJobs = [{title, jobType, salary:{low,high}, cities[]}]`，编辑器复合表单 | ~40 行 / 2 文件 | 中（schema 设计） | ✅ 完成 (D 阶段)  |
| **P2** | `profile.firstWorkDate`        | schema 无                | schema 加 date 字段，编辑器单 input                                                             | ~5 行 / 1 文件  | 低            | ✅ 完成 (D 阶段)  |
| **P2** | `education[].overseasEdu`      | schema 无                | schema 加 boolean 字段，编辑器 select 是/否                                                      | ~3 行 / 1 文件  | 低            | ✅ 完成 (D 阶段)  |
| **P2** | `language.readingWriting` 字段补漏 | schema 有但 renderer 注释漏读 | renderer 已有 `i.readingWriting` 处理，确认无误                                                  | 0 行          | 零            | ✅ 完成 (renderer 已渲染, D 阶段确认)  |

## 决策区（必须先批，再动其他）

### 决策 1：隐藏字段怎么办？

> **冲突**：重构表 P0 #2 + P0 #4 是"删 expectSalary/expectCities/expectIndustry/wechat/timeline 编辑器 + 删 renderHeaderExtra"。
> 但你这份简历要往招聘平台填，**必须**有这些字段（`expectSalary` = 猎聘+智联 必填三框）。
> CV schema 已经有这些字段定义，编辑器也已经能填，问题只是 **renderer 不渲染**。

| 选项                       | 改什么                                                                                                                                                           | 净行数                      | 备注                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | -------------------------------------- |
| **A. 撤回 P0 #2 + #4**（推荐） | 保留 expectSalary/expectCities/expectIndustry/wechat/timeline 编辑器；`renderHeaderExtra` 改 test-only → 生产路径；renderer 真正渲染 header-extra（CSS 已有 `.header-extra-tag`） | +30 行 / -50 行 = 净减 ~20 行 | 用户填的字段能在预览看到效果；cv-autofill 读 JSON 不受影响 |
| **B. 跟随 P0 #2 + #4**     | 删编辑器 UI + 删 renderHeaderExtra，字段只能手写 data.json，renderer 永不展示                                                                                                  | 净减 ~110 行                | 纯 schema 用途，预览永远不展示这些字段——也是合理设计但用户感知差  |
| C. 部分撤回                  | 只保留 expectSalary（必填），删 expectCities/expectIndustry/wechat/timeline（猎聘独有）                                                                                      | 净减 ~60 行                 | 中庸                                     |

### 决策 2：新增哪些字段进 CV schema？

> 按 cv-autofill `docs/CV_SCHEMA_FEEDBACK.md` 三、字段评分筛选（5/4 分必加，3 分可加，≤2 暂不加）。

| 选项                     | 包含字段                                                                                                                                         | 改动文件                    | 净行数    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------- | ------ |
| **D. 必加（5+4 分）**（推荐）   | `experience[].achievements`(5) + `expectSalary` renderer 渲染(5) + `experience[].isIntern`(4) + `industry/department/skillTags` renderer 渲染(3) | renderer.js + 文档更新      | +30 行  |
| **E. D + 应加（4 分）**     | D + `expectJobs` 单条目 schema                                                                                                                  | + config.js + editor.js | +70 行  |
| **F. D + E + 可加（3 分）** | D + E + `firstWorkDate` + `overseasEdu`                                                                                                      | + editor.js             | +80 行  |
| **G. 暂不加**             | 仅完成 D renderer 渲染部分，schema 不扩                                                                                                                | 仅 renderer.js           | +30 行  |
| **H. 全加（含 ≤2）**        | 包含 `currentSalary` / `training` / `politicalStatus` 等                                                                                        | 全栈                      | +200 行 |

> **注意**：`politicalStatus` / `training` / `currentSalary` 在 cv-autofill 评分 ≤2（独享平台 + 适用面窄），默认不进。

## 行数预估（决策 1A + 决策 2D 后的最终账）

- **P0 净减**：~340 行 + 3 文件挪出 + 2 CDN dep
  - 含：删 expectSalary 等编辑器输入（-80）撤回 + renderHeaderExtra 改生产（+30）→ P0 #2+#4 净减 ~50 行
  - 其他 P0 不变：~290 行
- **P1 净增/减混合**：死代码删 ~80 行 + 缺位功能 ~150 行 + 新增字段 renderer 渲染 ~30 行 = 净增 ~100 行
- **P2 净增**：~180 行（不含 expectJobs）
- **P3 净增**：~80 行 + 1 schema 副本
- **P4 净减**：~3 行

**P0 一轮可砍 ~340 行 / 3 文件 / 2 deps**，项目瘦身明显；P1 增量主要是 renderer 把已有 schema 暴露给用户，~30 行净增。

## 决策联动检查

| 决策       | 联动                                                                        | 影响            |
| -------- | ------------------------------------------------------------------------- | ------------- |
| 1A       | 新增字段表 P1 `expectSalary renderer 渲染` 自动生效（决策 1 已经在 P0 改 renderHeaderExtra） | ✅ 一致          |
| 1B       | 新增字段表所有 renderer 渲染条目作废（renderer 不暴露任何隐藏字段）                               | ❌ 冲突，需删 P1 条目 |
| 1C       | 新增字段 `expectCities` 不再渲染                                                  | ⚠️ 部分冲突       |
| 2D/2E/2F | 都依赖决策 1A 才能完整生效（renderer 渲染才有意义）                                          | ✅ 一致          |
| 2G       | 不依赖决策 1，但用户填了 renderer 渲染的字段才有用                                           | ⚠️ 半依赖        |

## 批注区

_在决策区表格的"备注"列写"已批注: <选项字母 + 你的指示>"。也可直接在这里按 ID 列编号批注。_

例如：

- 决策 1: 那就先都要，之后再看效果决定去留 ✅ 已执行 (1A); 2026-08-15 追加精简: expectSalary/expectCities 并入 expectJobs
- 决策 2: 新增字段的那个表我批注了，按那个来吧 ✅ 已执行 (D+E+F 全落地, 见新增字段表状态列)
- 其它的我都在表格里批注了
- 表格里没有批注的先做成issue
