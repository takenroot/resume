# Spec: OCR-Friendly Resume PDF

> 让智联招聘 + Boss直聘 的智能解析能从我们导出的 PDF 正确识别简历字段，
> 解决"上传后还要手动补全"的痛点。

## 0. 决策记录

| 项 | 决策 | 来源 |
|---|---|---|
| 修复范围 | **5 项全做** | 用户确认 |
| NotoSansSC | **加 `@font-face`, 仅 `@media print` 引用** | 用户确认 |
| 字体策略 | **屏幕保留系统字体, 打印切到 NotoSansSC** | 用户原话"对当前视觉满意" |
| §5.5 预览 | **CDP 截图 before/after, 用户看后决定保留/回滚** | 用户确认 |
| 验证方式 | **真实上传智联/Boss 智能解析, ≥85% 字段正确** | 用户确认 |
| 分支策略 | **B: feat 分支 + tag 锚点** | 用户确认 |

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
- 浏览器 DevTools 看到 PDF 内字体名含 "NotoSansSC", 不是系统字体降级
- 上传 PDF 到智联招聘/Boss直聘, 在线简历自动填充准确率 ≥ 85%

## 2. Tech Stack

- HTML5 + 原生 CSS3 + 原生 JS(零依赖, 无 build step)
- 字体: NotoSansSC-Regular.subset.ttf / NotoSansSC-Bold.subset.ttf(已 ship)
- 导出: 浏览器原生打印 → 系统 PDF 转换

## 3. Commands

| 用途 | 命令 |
|---|---|
| 起 dev server | `cd site && python3 -m http.server 8000` |
| 重子集化字体 | `python3 subset_font.py`(新增中文字符后) |
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
5. [ ] **字体加载**: DevTools Network 看到 NotoSansSC-*.ttf 200 (print 模式下)
6. [ ] **打印预览**: Ctrl+P 视口无关, h2 > h3, body ≥ 13px, 字体 = NotoSansSC
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