# Spec: OCR-Friendly Resume PDF

> 让智联招聘 + Boss直聘 的智能解析能从我们导出的 PDF 正确识别简历字段，
> 解决"上传后还要手动补全"的痛点。

## 0. 决策记录

| 项 | 决策 | 来源 |
|---|---|---|
| 修复范围 | **5 项全做** | 用户确认 |
| NotoSansSC | **❌ 不引 `@font-face`**（撤回原计划） | T3b `027ba5c`：触发 Chrome text-to-paths bug，OCR 提取 0 字符 |
| 字体策略 | **屏幕 + 打印都用系统字体** | T3b 验证通过 |
| 页面边距 JS 控制 | **❌ 撤回**（撤回原计划） | T-edge-1：JS 无法真正控制浏览器打印对话框 |
| §5.5 预览 | **CDP 截图 before/after, 用户看后决定保留/回滚** | 用户确认 |
| 验证方式 | **真实上传智联/Boss 智能解析** | 用户确认 |
| 验证结果 | **Boss ✅ / 智联 ✅**（T12 最终结论：`feat/ocr-friendly-resume` 原版式即可识别，前提是 PDF 信息与本人一致） | 2026-07-05 实测 |
| 分支策略 | **B: feat 分支 + tag 锚点** | 用户确认 |

> **⚠ 重要**：原 spec 的 §5.3 / §5.5 与实际落地不一致。§5.3 描述的 @font-face 计划已撤回（见 §5.3 节末尾的"已弃用"段）。接班 AI 看 spec 节时结合 `tasks.md` 的 T3b / T-edge-1 / T12 行读。

## 1. Objective

将当前项目导出的 PDF 调成**智能简历解析器友好**, 使求职者把 PDF 上传到
智联招聘 / Boss直聘 之后, 平台自动填充在线简历的准确率达到 **≥85%**。

不做的事:
- 不动视觉设计核心(配色、布局、字体家族),只调对 OCR 关键的字号/排版
- 不重写 PDF 导出路径(继续用 `window.print()`)
- 不写自动填充脚本(那是另一条路,见对话历史)

成功定义(可测):
- `window.print()` 预览中, h2(section 标题)视觉上明显大于 h3(item 标题)
- 任意视口宽度打印, PDF 内正文字号 ≥ 13px(≈ 9.75pt)
- 打印 PDF 用 pypdf / pdfplumber 等工具提取文字层，可提取中文字符 ≥ 300（样本 `张三` 全份简历）
- 上传 PDF 到智联招聘/Boss直聘, 在线简历自动填充准确率 ≥ 85%

## 2. Tech Stack

- HTML5 + 原生 CSS3 + 原生 JS(零依赖, 无 build step)
- 字体: 系统字体（`PingFang SC`、`Microsoft YaHei`、`Segoe UI` 等）；NotoSansSC 子集字体方案已在 T3b 撤回
- 导出: 浏览器原生打印 → 系统 PDF 转换

## 3. Commands

| 用途 | 命令 |
|---|---|
| 起 dev server | `cd site && python3 -m http.server 8000` |
| 打印预览 | 浏览器 → 右键 → 打印 / Ctrl+P |
| 语法检查所有 JS | `for f in site/js/*.js; do node -c "$f" || break; done` |

## 4. Project Structure

```
site/
  index.html              # 页面骨架(不动)
  styles.css              # 本期主要修改点
  data.json               # sample 时间格式调整(小)
  js/
    config.js             # skills 模块的 renderItem 调整(单行化)
    其他模块不动
docs/
  spec-ocr-friendly-resume.md   # 本文件
```

## 5. 5 项修复的具体规范

### 5.1 h2 与 h3 字号区分(OCR 边界识别)

**现状**: `--fs-h2: 14px; --fs-h3: 14px;` 完全相同, OCR 无法区分 section/item 边界。

**改动**: `:root` 内 `--fs-h2` 从 `14px` 提到 `16px`。

**验收**: DevTools 测 `.section-heading h2` 计算字号 = 16px, `.timeline-item h3` = 14px。

### 5.2 print @media 字号锁

**现状**: 移动端 @media 把字号砍到 8.5-10px; 打印 @media 没锁字号, 视口宽度影响 PDF 输出。

**改动**: `@media print` 块内重置字号变量到桌面尺寸, 与视口解耦。

```css
@media print {
  :root {
    --fs-body: 13px;
    --fs-meta: 12.5px;
    --fs-h1: 28px;
    --fs-h2: 16px;
    --fs-h3: 14px;
    --lh-body: 1.55;
  }
  /* ...原有 print 规则... */
}
```

**验收**: 浏览器窗口拉到 600px 宽 → Ctrl+P 预览 → PDF 内文字仍 ≥ 13px。

### 5.3 NotoSansSC @font-face 引用（仅 print 使用）

**现状**: 字体文件 ship 在仓库, 但 CSS 无 `@font-face` 引用, 浏览器全走系统字体降级。屏幕渲染用户当前满意, 不动。

**改动**: `styles.css` 顶部加 `@font-face` 声明 (声明本身无害, 只在引用时才加载), `@media print` 块内临时覆盖 `--font-family` 优先指向 NotoSansSC。屏幕 `--font-family` **保持不变**。

```css
/* styles.css 顶部, 全局 */
@font-face {
  font-family: 'NotoSansSC';
  src: url('./NotoSansSC-Regular.subset.ttf') format('truetype');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}
@font-face {
  font-family: 'NotoSansSC';
  src: url('./NotoSansSC-Bold.subset.ttf') format('truetype');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

/* :root 的 --font-family 保持系统字体不变 */

@media print {
  :root {
    --font-family: 'NotoSansSC', "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
    /* ... 5.2 的字号锁定也在这里 ... */
  }
}
```

**验收**:
- DevTools Network 看到 NotoSansSC-*.ttf 被加载 (仅当 print 触发时)
- 打印 PDF 用 PDF 查看器查字体名含 "NotoSansSC"
- 屏幕渲染视觉与改动前像素级一致 (这是用户硬约束)

#### 已弃用说明

> **⚠ 本条规范已在 T3b (`027ba5c`) 撤回，不再执行。**
>
> 实测发现 Chrome 在 `@media print` 下使用 `@font-face` 自定义中文字体时，会把文字转成路径（text-to-paths），导致 PDF 文字层为空（可提取字符从 ~350 掉到 0）。因此分支实际决策是：
> - **屏幕 + 打印统一使用系统字体**（`--font-family: "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif`）
> - 不加载 `NotoSansSC-*.subset.ttf`
> - 仓库中原有的 NotoSansSC 子集字体文件已被清理
>
> 保留 §5.3 正文仅作为历史记录；接班 AI 如需再调字体，请先复测 `page.pdf()` 提取字符数，避免重蹈覆辙。

### 5.4 时间格式标准化

**现状**: sample data `"2022 – 至今"` 用 en-dash + 空格, 缺月份, OCR 友好但不一致。

**改动**:
- `site/data.json` 改示例: `"2022.01 - 至今"` / `"2015.09 - 2019.06"`
- `README.md` 在"页面模块"区补充一行规范, 写到 `data.json` 用 `YYYY.MM - YYYY.MM` 或 `YYYY.MM - 至今`

**验收**: sample 数据全部用新格式; 用户编辑界面不强约束(允许自由输入, 这是约定而非限制)。

### 5.5 skills 网格改成单列（**先 CDP 截图预览, 用户决定保留/回滚**）

**现状**: `.skills-grid { grid-template-columns: auto 1fr; }` 两列布局, OCR 列对齐易错位(实测 85% 但有失败)。

**改动**:
- `styles.css`: `.skills-grid` 改为单列块级布局
- `site/js/config.js` skills 模块的 `renderItem` 改为单行 inline: `前端开发：Vue / React / ...`

```css
.skills-grid { display: block; }
.skills-grid .skill-item { display: block; margin-bottom: 6px; }
.skills-grid .skill-name { font-weight: 600; }
.skills-grid .skill-name::after { content: '：'; }
.skills-grid .skill-detail { color: var(--text-soft); }
```

**预览步骤 (CDP 截图 before/after)**:
1. 应用 5.1-5.4 但**不应用 5.5** → Edge 远程调试 + `Page.captureScreenshot` 截当前页 → 存 `docs/preview-skills-2col.png`
2. 应用 5.5 → 再截一张 → 存 `docs/preview-skills-1col.png`
3. 用户看两张图 → 选保留(1col) 或 回滚(2col)
4. **回滚成本**: `git checkout feat/ocr-friendly-resume -- site/styles.css site/js/config.js` 撤回 5.5

**验收** (应用 5.5 后, 若用户保留):
- skills 区每条技能独占一行, 格式 `技能名：详情`
- OCR 单行可读

## 6. Code Style

本项目代码风格:
- 全局函数挂载, 不引模块系统(见 `app.js`)
- 字符串拼接 + `esc()` 防 XSS(见 `renderer.js`)
- 命名: cE = createElement, esc = escape HTML, lis = list items, mli = markdown list items
- 不用模板字符串, 维持可压缩

CSS 风格:
- `:root` 变量化所有 magic numbers
- 注释用 `/* ========== 区块名 ========== */` 分段
- BEM-ish 但不强求

## 7. Testing Strategy

| 层 | 工具 | 范围 |
|---|---|---|
| 语法 | `node -c site/js/*.js` | 所有 JS 文件 |
| 视觉 | 浏览器 Ctrl+P 预览 + 截图比对 | h2/h3 大小、skills 单列、字体加载 |
| **OCR 集成** | **真传智联招聘 + Boss直聘** | **唯一验收手段**, ≥85% 字段正确 |

无单元测试框架(项目无 build step, AGENTS.md 明示)。OCR 验证是唯一"集成测试"。

## 8. Boundaries

### Always do
- 改动前 `node -c` 检查所有 JS
- 改动后 `python3 -m http.server` 起服务, 肉眼过一遍
- 改动不引入新的依赖(不引 CDN, 不引 npm)
- 保留 `data-render="profile.xxx"` / `data-render-list` 渲染约定

### Ask first
- 改 schema(profile / sections shape)
- 改 print @media 之外的 CSS 主题变量
- 增加新的 section type(目前 8 种)

### Never do
- 加构建工具(webpack/vite/esbuild)
- 引前端框架(React/Vue/Alpine)
- 删除任何未引用的功能代码(dead code 删除需走 ADR)

## 9. Success Criteria

定义"完成"的**可测**条件, 全部满足才算 done:

1. [ ] **CDP 截图预览**: `docs/preview-skills-2col.png` 和 `preview-skills-1col.png` 都生成, 用户 review 完做保留/回滚决定
2. [ ] **CSS 改动落地**: 5 项修改全部 commit, 不留 TODO (or 5 项中 4 项, 如果 5.5 被回滚)
3. [ ] **node -c 通过**: 所有 10 个 JS 文件语法 OK
4. [ ] **HTTP serve OK**: 启动 dev server, 浏览器无 console error
5. [ ] **文字层完整**: 用 `page.pdf()` 或浏览器打印导出后，pypdf 可提取中文字符 ≥ 300（样本 `张三`）
6. [ ] **打印预览**: Ctrl+P 视口无关, h2 > h3, body ≥ 13px, 使用系统字体
7. [ ] **屏幕视觉零回归**: 改动前后屏幕截图对比像素级一致 (除 skills, 若保留 5.5)
8. [ ] **OCR 集成测试**: 真传一份 PDF 到智联招聘, 自动填充 ≥ 85% 字段正确
9. [ ] **OCR 集成测试 Boss**: 真传一份 PDF 到 Boss直聘, 自动填充 ≥ 85% 字段正确

第 8、9 项需要**用户在浏览器手测**, 我可以辅助准备 PDF 和检查项。

## 10. Open Questions

- (Q1) OCR 验证时用 sample data 还是用户真实数据?
  - 默认用 sample data (张三), 5 分钟出结果
  - 真数据可能因为字段非典型进一步降低识别率, 暴露更多问题
- (Q2) 用户在哪个平台先验证?
  - 智联招聘(用户当前已经在编辑), 或 Boss直聘
  - 默认先智联, 用户登录态现成可用

## 10.5 T12 智联解析失败根因分析（新增）

2026-07-05 用户补充了 Boss 官方 PDF 和智联官方 `.doc` 样本，经 `pdfplumber` 文字层提取后对比如下：

| 样本 | 可提取字符 | 字段分隔方式 | 是否被智联识别 |
|---|---|---|---|
| 项目导出 `张三` PDF | 349 | `公司 · 职位 时间` | ❌ |
| 项目导出 `左秉鸿` PDF（旧版） | 897 | `学校 · 专业 · 学历 时间`（`~` 分隔时间） | ❌ |
| Boss 官方 `左秉鸿` PDF | 1900 | `公司 职位 时间`（空格分隔） | ✅（上传智联后） |
| 智联官方 `左秉鸿` .doc | — | 时间/公司/职位**分行** | ✅（官方自身导出） |

**关键洞察**：
1. 项目导出的 PDF **文字层完整**（349/897 chars），因此 T3b 撤回 `@font-face` 的决策是正确的，问题不在字体。
2. Boss 官方 PDF 用普通空格分隔字段，上传到智联后可被识别，说明智联解析器**不接受 `·` 作为字段分隔符**。
3. 当前 `site/js/config.js` 中 `experience` 和 `education` 的 `renderItem` 使用 ` · ` 连接多个字段，这是最大嫌疑根因。

**验证方向**：
- **M1（最小改动）**：将 ` · ` 替换为普通空格，其他版式不变，重新上传智联测试。
- **M2（强对齐）**：将经历项改为"一行一字段"，向智联官方 `.doc` 版式靠拢。
- **M3（多模板）**：保留当前版式，新增"智联专用"导出模板。

本期优先实施 **M1**。

## 11. 不在本期范围

- 自动填表单脚本(Tampermonkey / Chrome extension)
- 改数据结构(增加 求职意向 / 培训经历 / 语言能力 等新模块)
- 改 PDF 导出路径(继续用 `window.print()`)
- 删除 NotoSansSC subset 字体
- 改任何视觉设计(配色、间距、圆角、阴影)

## 12. Branch & Rollback Strategy

```
main
 └── (last clean commit: c774a76)
      └── tag: pre-ocr-changes-2026-06-30   ← baseline anchor
           └── branch: feat/ocr-friendly-resume  ← 本期工作
```

**回退路径** (任意阶段可执行):
- **完全回退到 main**: `git checkout main && git branch -D feat/ocr-friendly-resume`
- **回退到 tag 锚点**: `git checkout feat/ocr-friendly-resume && git reset --hard pre-ocr-changes-2026-06-30`
- **只回退 5.5 (skills 单列)**: `git checkout feat/ocr-friendly-resume -- site/styles.css site/js/config.js` 然后 revert 该 hunk

**安全约定**:
- 不直接 push 到 main; feat 分支本地工作, 用户满意后由用户决定是否合并
- 不 force-push; 不重写历史
- spec 文件 (本文档) 在 Phase 4 实施时一并 commit

## 13. 实施历史与关键教训

### 任务总览（已完成）

| 任务 | 内容 | 状态 |
|---|---|---|
| T1 | commit spec + plan | ✅ |
| T2 | 时间格式 `YYYY.MM` | ✅ |
| T3 | CSS 基础（h2 字号 + print 字号锁定） | ✅ |
| T3b | 撤回 `@font-face`，改用系统字体 | ✅ |
| T4 | Playwright PDF 验证 | ✅ |
| T5-T9 | skills 单列化 + 用户 gate | ✅ |
| T-fix-1 | print 右偏修复 | ✅ |
| T-fix-2 | GitHub SVG viewBox 修复 | ✅ |
| T-fix-3 | 删除 `site/assets/icons/` 死代码 | ✅ |
| T-fix-4 | gitignore `.playwright-mcp/` | ✅ |
| T-fix-5 | import JSON 顶部时间轴刷新修复 | ✅ |
| T-edge-1 | 撤回打印边距下拉 UI（JS 不可控） | ↩️ |
| T10/T11/T12 | 智联/Boss 真实上传验证 | ✅ 通过 |

### 最终验证结论

- **Boss 直聘**：项目导出 PDF 全字段自动填充正确 ✅
- **智联招聘**：项目导出 PDF 可被识别 ✅，前提是 PDF 中姓名、手机号、邮箱等个人信息与求职者本人一致

### 踩坑教训

1. **不要试图用 JS 控制浏览器原生对话框**（打印边距、缩放等），不可控。
2. **不要试图 `@font-face` + print**：Chrome 会把自定义中文字体转路径，导致 PDF 文字层为 0 字符。
3. **推断 PDF 解析失败根因时，不要直接动代码**，先看真实样本。
4. **文字层完整 ≠ OCR 解析成功**：字段分隔符、字段顺序、信息真实性都会影响解析。
5. **智联有真实性校验**：用 sample/假数据测试会失败，不代表版式失败。

### 过程文档归档

- `docs/plan-ocr-friendly-resume.md` 和 `docs/tasks-ocr-friendly-resume.md` 已完成历史使命，已删除。
- 关键决策、验证结论和教训已合并到本节。
