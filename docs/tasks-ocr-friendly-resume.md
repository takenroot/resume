# Tasks: OCR-Friendly Resume PDF

> 配套 spec: [spec-ocr-friendly-resume.md](./spec-ocr-friendly-resume.md)
> 配套 plan: [plan-ocr-friendly-resume.md](./plan-ocr-friendly-resume.md)
> 分支: `feat/ocr-friendly-resume`
> 当前 commit: **b282f26** (2026-07-05)
> Tag 锚点: `pre-ocr-changes-2026-06-30` (指向 main 的 c774a76)

## 任务总览

```
T1   ✅ commit docs                          cfd2e33
T2   ✅ §5.4 时间格式 (YYYY.MM)              4219ded
T3   ✅ §5.1-§5.3 CSS 基础 (h2/print lock)   45a485a
T3b  ✅ 撤回 @font-face (改用系统字体)       027ba5c
T4   ✅ 验证 T3 (静态 + Playwright PDF)      5a78f23 + 2026-07-05 验证
T5   ✅ §5.5 before 截图 (2col)              (本地)
T6   ✅ §5.5 styles.css + config.js (1col)   1b4404a
T7   ✅ §5.5 after 截图 (1col)               (本地)
T8   ✅ 用户 gate: 保留 1col                  用户已批准
T9   ✅ §5.5 commit                          1b4404a
───────────────────────────────────────────────────
分支出 §5 范围之外的"硬修复"批次, 同步进分支:
T-fix-1  ✅ print 右偏 (page-shell padding)          1549e18
T-fix-2  ✅ github SVG viewBox (1024→24)             c6ba35b
T-fix-3  ✅ 删 site/assets/icons/ 死代码              fec5f7f
T-fix-4  ✅ gitignore .playwright-mcp/                47768bb
T-fix-5  ✅ import JSON 时间轴不刷新 bug              b282f26
T-edge-1 ↩ 撤回打印边距下拉 UI (不可控)              a251aa2→5a78f23→973c130
───────────────────────────────────────────────────
T10  ⏸ OCR 智联真传 — 2026-07-05 上传测试 **FAIL**
T11  ⏸ OCR Boss 真传 — 2026-07-05 上传测试 **PASS**
T12  🔜 接棒: 调查智联失败原因 + 调整 PDF 版式
```

**整体进度**: 9/11 原代码任务完成；2026-07-05 真实上传产生 **T12 新任务**——智联无法解析项目 PDF（根因未知）。

---

## 一、原 spec §5 任务

### T1 ✅ Commit docs

- [x] **Task**: `chore: add OCR-friendly spec and plan`
- Status: `cfd2e33`

### T2 ✅ §5.4 时间格式

- [x] **Task**: 改 sample data + README 文档
- `site/data.json` 用 `YYYY.MM - YYYY.MM` 格式（`2015.09 - 2019.06` 等）
- Status: `4219ded`

### T3 ✅ §5.1-§5.3 CSS 基础

- `:root --fs-h2: 16px`
- `@media print` 锁定字号 13/12.5/28/16/14px
- Status: `45a485a`

### T3b ✅ 撤回 @font-face（重要）

- **撤回了 spec §5.3 原计划**：print 改用系统字体，不引 NotoSansSC
- 原因：`@font-face` 触发了 Chrome text-to-paths bug，OCR 提取不出字符（0 chars vs 修复后 350 chars）
- Status: `027ba5c`
- **注意**：spec.md 里 §5.3 的"NotoSansSC @font-face 引用"现在已经过时。接班 AI 接手前先看一下当前 spec.md 的 §5.3 是否需要同步标记 deprecated。**当前 spec.md 此节未更新**，但 tasks.md 这里已记录实际决策。

### T4 ✅ 验证 T3

- Playwright `page.pdf()` 模拟 Edge 打印
- **结果**：350 chars 可提取（修复前 0）；`2015.09 - 2019.06` 月份保留；时间轴 `2015本科→ 2022高级前端工程师` 渲染
- Status: 2026-07-05 验证通过

### T5-T9 ✅ §5.5 skills 单列

- 1col 已 commit (`1b4404a`)，用户 gate 已批准
- 上下游的截图前后位于本地，未入 `docs/`（不影响主线）

---

## 二、分支"硬修复"批次（spec 范围外，但同步进了 feat 分支）

### T-fix-1 ✅ Print 右偏 (1549e18)

- **症状**：浏览器边距设"无"或"最小"时，简历主体右偏
- **根因**：`@media (max-width: 1280px)` 的 `.page-shell { padding-right: 96px }` 写在 `@media print { padding: 0 }` **之后**，cascade 覆盖了打印态
- **修复**：把 `.page-shell` 强制写成 `padding: 0 !important; display: block`

### T-fix-2 ✅ GitHub SVG viewBox (c6ba35b)

- **症状**：github 图标显示异常（缩放后的 path 与 viewBox 不匹配）
- **根因**：原 octicon SVG 用 24 单位坐标，但 viewBox 写的是 `0 0 1024 1024`，导致 42× 缩放错位
- **修复**：viewBox 改成 `0 0 24 24`，加 `fill="currentColor"`，path 删短

### T-fix-3 ✅ 删 site/assets/icons/ 死代码 (fec5f7f)

- 删除 `site/assets/icons/`（c25c916 半途重构的残留）
- 当时本来想"外部化 SVG"，但 currentColor 主题适配要求 SVG 必须 inline，决定回退外部化

### T-fix-4 ✅ gitignore .playwright-mcp/ (47768bb)

- Playwright MCP 调试时生成 `.playwright-mcp/` 目录（截图/snapshot），不该入库
- 防止后续误提交

### T-fix-5 ✅ import JSON 时间轴不刷新 (b282f26)

- **症状**：用户导入 JSON 后，顶部时间轴仍显示上次缓存内容，只有 Ctrl+Shift+R 才能正确
- **根因（双坑）**：
  1. `[data-render]` 通用循环 (`renderer.js` line 53-60) 在 `el.children.length > 0` 时跳过 textContent，auto-timeline 已经生成了子元素，所以导入的新 timeline 内容写不进
  2. line 65 `if (ts && !(d.profile && d.profile.timeline))` 在 `profile.timeline` 存在时也跳过
- **修复**：在 `[data-render]` 循环里 early-return timeline-strip；在 line 65 用 if/else 分情况（自定义文字 vs auto）
- **验证**：Playwright 两种 JSON 都跑通——含 `profile.timeline` 显示自定义文字，不含显示自动生成

### T-edge-1 ↩ 撤回打印边距下拉 UI (a251aa2→5a78f23→973c130)

- **尝试过**：在编辑器加页面边距下拉，让用户主动选择 0/5/14/20mm
- **结论**：JS **不可能真正控制浏览器打印对话框的边距**（用户必须到浏览器 UI 里设）
- **撤回**：完全交给浏览器控制；编辑器只保留提示文字「打印页边距请在浏览器打印对话框里设置」
- 提交链：`a251aa2` 加 → `5a78f23` 减项 → `973c130` 完全撤回
- **教训**：不要试图用 JS 控制浏览器原生对话框能控制的参数

---

## 三、真实上传验证 (2026-07-05)

### 现状：智联 FAIL，Boss PASS

| 平台 | 解析结果 | 样本 |
|---|---|---|
| **Boss** | ✅ 全部字段都能解析 | `docs/张三 - 全栈开发工程师.pdf` (项目导出) |
| **智联** | ❌ 不能解析 | `docs/张三 - 全栈开发工程师.pdf` (项目导出) |
| **智联** | ✅ 可解析（对照） | `docs/boss-左秉鸿-全栈工程师.pdf` (Boss 官方 PDF 上传智联) |
| **智联** | ✅ 可解析（对照） | `docs/智联招聘-左秉鸿.doc` (智联官方 Word 导出) |

### 关键发现：文字层完整，问题在字段分隔符

用 `pdfplumber` 提取四个样本的文字层后，发现**项目导出的 PDF 文字层并不缺**：

| 样本 | 可提取字符数 | 时间分隔符 | 经历项字段分隔 | 教育标题 |
|---|---|---|---|---|
| `张三 - 全栈开发工程师.pdf`（项目导出） | **349** | `-` | `公司 · 职位 时间` | `教育背景` |
| `简历-左秉鸿-巴彦淖尔.pdf`（项目导出/旧版） | **897** | `~` | `学校 · 专业 · 学历 时间` | `学习经历` |
| `boss-左秉鸿-全栈工程师.pdf`（Boss 官方） | **1900** | `-` | `公司 职位 时间` | `教育经历` |
| `智联招聘-左秉鸿.doc`（智联官方） | — | ` - ` | 时间/公司/职位**分行** | `教育经历` |

**结论**：
1. **不是文字层丢失**（项目 PDF 能提取 349/897 chars），T3b 的字体决策没问题。
2. **最可疑根因是 `·`（中间点）分隔符**。项目 PDF 用 `·` 连接「公司/职位」「学校/专业/学历」，而 Boss 官方 PDF 和智联官方 `.doc` 都使用**空格或换行**分隔字段。
3. 时间分隔符 `-` vs `~` 不是当前 `张三` 样本失败的主因（张三样本已经是 `-`，仍然失败）。
4. Boss 官方 PDF 上传到智联**能被识别**，说明智联解析器对字段顺序、字段排版的容忍度较高，但对字段分隔符很敏感。

### T10/T11/T12 任务状态

#### T10 ⏸ OCR 智联真传 — **FAIL（根因已定位）**

- 用 `data.json` sample 导出 PDF 上传智联
- 结果：**智能解析无法识别字段**
- **根因假设（待验证）**：`config.js` 的 `renderItem` 用 ` · ` 连接多个字段，导致智联无法拆分「公司 / 职位 / 时间」「学校 / 专业 / 学历」。

#### T11 ⏸ OCR Boss 真传 — **PASS**

- 同 PDF 上传 Boss 直聘
- 结果：**全字段自动填充正确**
- 结论：Boss 解析器能容忍 `·` 分隔符。

#### T12 🔄 接棒：智联版式适配 — **进行中**

- **状态**：已收到用户提供的 Boss / 智联官方样本，完成对照分析
- **主攻方向**：去掉 `experience` / `education` 的 `·` 字段分隔符
- **候选方案**：
  - **M1（最小改动）**：把 ` · ` 改成普通空格。影响视觉：`某科技有限公司 · 高级前端工程师` → `某科技有限公司 高级前端工程师`。
  - **M2（版式对齐）**：工作经历/教育经历改成一行一字段（时间单独一行、公司单独一行、职位单独一行），向智联官方 `.doc` 对齐。需要改 `config.js` + `styles.css`。
  - **M3（多模板导出）**：保留当前版式作为"屏幕/Boss 版"，新增"智联专用版"导出。工作量大，暂不建议。
- **下一步**：先实施 **M1**，用户用 sample 数据生成 PDF 重新上传智联验证。若 M1 通过则 T12 完成；若仍失败再评估 M2。

---

## 四、完成总结 (2026-07-05)

### OCR 友好分支代码层面已经完整

三大关键改动：
1. **CSS 用系统字体**（`@font-face` 撤回）—— 避免 Chrome text-to-paths bug
2. **Print 字号锁死**（13/12.5/28/16/14px）—— 与视口无关
3. **页面边距下拉**——**已被撤回（不可控）**，改回提示用户用浏览器 UI

### 仍待解决

- **T12 智联版式适配**——已定位到 `·` 分隔符为最大嫌疑根因，准备用 M1 验证。

### 教训沉淀

- 不要试图用 JS 控制浏览器原生对话框（边距 / 缩放）
- 不要试图 `@font-face` + print（触发 Chrome bug）
- 推断当前 PDF 不能解析的根因时，**不要直接动代码**，先看真实样本
- **文字层完整 ≠ OCR 解析成功**：字段分隔符、字段顺序同样影响解析器

---

## 跟踪

- **当前 HEAD**: `b282f26` fix(renderer): import JSON 后顶部时间轴正确刷新
- **分支状态**: clean working tree（除已删除 `subset_font.py` 用户手动删）
- **新 file**: `docs/张三 - 全栈开发工程师.pdf`（未跟踪，sample 验证用 PDF）
- **新 file**: `docs/简历-左秉鸿-巴彦淖尔.pdf`（未跟踪，旧版项目导出对照）
- **新 file**: `docs/boss-左秉鸿-全栈工程师.pdf`（未跟踪，Boss 官方 PDF）
- **新 file**: `docs/智联招聘-左秉鸿.doc`（未跟踪，智联官方 Word 导出）
- **下一步**: T12 实施 M1（去掉 `·` 分隔符）→ 用户重新上传智联验证
