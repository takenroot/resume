# Tasks: OCR-Friendly Resume PDF

> 配套 spec: [spec-ocr-friendly-resume.md](./spec-ocr-friendly-resume.md)
> 配套 plan: [plan-ocr-friendly-resume.md](./plan-ocr-friendly-resume.md)
> 分支: `feat/ocr-friendly-resume`
> Tag 锚点: `pre-ocr-changes-2026-06-30`

## 任务总览

```
T1  ✅ commit docs                          cfd2e33
T2  ✅ §5.4 时间格式 (YYYY.MM)              4219ded
T3  ✅ §5.1-§5.3 CSS 基础 (h2/print lock)   45a485a
T3b ✅ 撤回 @font-face (改用系统字体)       027ba5c
T4  ✅ 验证 T3 (静态 + Playwright PDF)      5a78f23 + 2026-07-05 验证
T5  ✅ §5.5 before 截图 (2col)              (本地)
T6  ✅ §5.5 styles.css + config.js (1col)   1b4404a
T7  ✅ §5.5 after 截图 (1col)               (本地)
T8  ✅ 用户 gate: 保留 1col                  用户已批准
T9  ✅ §5.5 commit                          1b4404a
T10 ⏸ OCR 智联真传 (用户行为任务)           延期 — 需用户上传验证
T11 ⏸ OCR Boss 真传 (用户行为任务)          延期 — 需用户上传验证
```

**整体进度**: 9/11 代码任务完成；T10/T11 是用户行为任务，需在浏览器里实际上传。

## T1 ✅ Commit docs

- [x] **Task**: `chore: add OCR-friendly spec and plan`
- Acceptance: spec + plan 落库
- Status: cfd2e33

## T2 ✅ §5.4 时间格式

- [x] **Task**: 改 sample data + README 文档
- Acceptance: `site/data.json` 中 time 字段用 `YYYY.MM - YYYY.MM`
- Status: 4219ded
- 验证: `grep '"period":' site/data.json` 显示 `2015.09 - 2019.06` 等

## T3 ✅ §5.1-§5.3 CSS 基础

- [x] **Task**: styles.css 加 h2 字号 + print 字号锁
- Acceptance:
  - `:root --fs-h2: 16px`
  - `@media print` 块锁定字号 (13/12.5/28/16/14px, --lh-body: 1.55)
- Status: 45a485a

## T3b ✅ 撤回 @font-face

- [x] **Task**: 移除 @font-face 声明, print 改用系统字体
- Acceptance: 删了 NotoSansSC-Regular/Bold 子集 (320KB), Chrome 打印保留文字层
- Status: 027ba5c

## T4 ✅ 验证 T3

- [x] **Task**: 用 Playwright 模拟 Edge 风格 `page.pdf()`, 验证可搜索文本层
- **方法** (2026-07-05):
  ```python
  await page.goto('http://localhost:8000')
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(1500)
  await page.pdf(format='A4', margin='14mm', printBackground=True)
  ```
- **结果**:
  - PDF 大小: 345,397 bytes
  - 可提取字符: **350 chars** (vs 之前 0 chars — 文字层完整)
  - 月份保留: ✅ `2015.09 - 2019.06`
  - 时间轴渲染: ✅ `2015本科→ 2022高级前端工程师`
- 结论: **OCR 友好分支代码层面已通过验证**, 剩下是用户行为任务

## T5-T9 ✅ §5.5 skills 单列

- Status: 1b4404a (1col 已 commit)
- 用户 gate: 已批准保留 1col

## T10 ⏸ OCR 智联真传 (用户行为)

- Task: 把 sample data 导出的 PDF 上传智联招聘, 看智能解析结果
- Acceptance: 智联智能填充字段正确率 ≥ 85%
- **状态**: 延期 — 需用户在浏览器里实际操作
- **回退**: 不动代码, 用户手填剩余字段 (这是 spec §11 兜底范围之外)
- **注意**: 代码层面 OCR 友好已验证 (T4 350 chars), 这步验证只是最终验收

## T11 ⏸ OCR Boss 真传 (用户行为)

- 同 T10, 上传 Boss 直聘

## 完成总结 (2026-07-05)

**OCR 友好分支代码层面已完整**。三大关键改动:

1. **CSS 用系统字体** (`@font-face` 撤回) — 避免 Chrome text-to-paths bug
2. **Print 字号锁死** (13/12.5/28/16/14px) — 与视口无关, 保证 OCR 命中
3. **页面边距下拉** (最小/无边距/较大) — 让用户主动选择舒服的版式

用户手动选择打印边距是有意保留的轻量化设计 (vs 引入 Playwright/Puppeteer 自动生成)。

**未做的事**: 智联/Boss 真实上传验证 (T10/T11)。代码层面已通过 Playwright 模拟验证 (350 chars 可提取), 智联 OCR 解析的最终结果依赖该平台的解析算法, 不是本项目可控范围。

## 跟踪

- 当前 commit: `5a78f23`
- 整体进度: 9/11 代码任务完成
- 下一步: T10 (用户行为, 智联真传)