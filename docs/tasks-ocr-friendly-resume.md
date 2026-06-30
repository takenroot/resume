# Tasks: OCR-Friendly Resume PDF

> 配套 spec: [spec-ocr-friendly-resume.md](./spec-ocr-friendly-resume.md)
> 配套 plan: [plan-ocr-friendly-resume.md](./plan-ocr-friendly-resume.md)
> 分支: `feat/ocr-friendly-resume`
> Tag 锚点: `pre-ocr-changes-2026-06-30`

## 任务总览

```
T1  ✅ commit docs
T2  → §5.4 data.json + README           (无依赖, 简单数据改)
T3  → §5.1-§5.3 styles.css              (无依赖, 一次性 CSS 改)
T4  → 验证 T3 (屏幕/print/字体)         (依赖 T3)
T5  → §5.5 before 截图 (CDP, 2col)     (依赖 T4)
T6  → §5.5 styles.css + config.js       (依赖 T5)
T7  → §5.5 after 截图 (CDP, 1col)      (依赖 T6)
T8  → 用户 gate: 保留/回滚 §5.5         (依赖 T7)
T9  → §5.5 commit 或 revert             (依赖 T8)
T10 → OCR 智联真传 (≥85%)               (依赖 T2-T9 全部)
T11 → OCR Boss 真传 (≥85%)              (依赖 T10)
```

## T1 ✅ Commit docs

- [x] **Task**: `chore: add OCR-friendly spec and plan`
  - Acceptance: `docs/spec-ocr-friendly-resume.md` + `docs/plan-ocr-friendly-resume.md` 落库
  - Verify: `git log --stat` 看两个文件 commit
  - Files: docs/spec-ocr-friendly-resume.md, docs/plan-ocr-friendly-resume.md
  - **Status**: cfd2e33 已 commit

## T2 §5.4 时间格式

- [ ] **Task**: 改 sample data + README 文档
  - Acceptance:
    - `site/data.json` 中所有 time 字段改用 `YYYY.MM - YYYY.MM` 或 `YYYY.MM - 至今`
    - `README.md` 在"页面模块"区加一行规范说明
  - Verify: `git diff site/data.json README.md` 看 time 字段全部用新格式
  - Files: site/data.json, README.md
  - Commit: `docs: 时间格式规范 (YYYY.MM - YYYY.MM)`

## T3 §5.1-§5.3 CSS 基础

- [ ] **Task**: styles.css 一次性加 h2 字号 / print 字号锁 / @font-face
  - Acceptance:
    - `:root` 内 `--fs-h2: 14px → 16px`
    - `@media print` 块内重置 `--fs-body: 13px; --fs-meta: 12.5px; --fs-h1: 28px; --fs-h2: 16px; --fs-h3: 14px; --lh-body: 1.55;`
    - `@media print` 内 `--font-family` 临时覆盖: `'NotoSansSC', "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;`
    - 顶部加两个 `@font-face` 声明 (Regular 400 / Bold 700)
  - Verify: `node -c site/js/*.js` 全通过; HTTP serve OK
  - Files: site/styles.css
  - Commit: `style(css): OCR-friendly 基础 (h2 字号 + print 锁定)`

## T4 验证 T3

- [ ] **Task**: 视觉 + 打印验证
  - Acceptance:
    - DevTools Computed: `.section-heading h2` = 16px, `.timeline-item h3` = 14px
    - 浏览器窗口拉到 600px 宽 → Ctrl+P 预览 → 文字 ≥ 13px
    - DevTools Network: `NotoSansSC-*.ttf` 在 print 模式被请求
    - 屏幕视觉: 配色/间距不变 (h2 微变 14→16px 是预期)
  - Verify: 截图/Network 面板
  - Files: (验证无文件改动)
  - **失败回退**: `git reset --hard HEAD~1` (回滚 T3 的 commit)

## T5 §5.5 before 截图 (2col)

- [ ] **Task**: 用 CDP 截当前页面 skills 区域 (2col 状态)
  - Acceptance:
    - `docs/preview-skills-2col.png` 存在
    - 图片清晰显示 skills 区是 2 列布局
  - Verify: 文件存在, 文件大小 > 10KB (说明不是空)
  - Files: docs/preview-skills-2col.png (新增)
  - **无 commit** (preview 文件不进版本控制, 加 .gitignore 或者 commit 时跳过)

## T6 §5.5 skills 单列实现

- [ ] **Task**: styles.css + config.js 改 skills 渲染
  - Acceptance:
    - `.skills-grid` 改 `display: block`
    - `.skills-grid .skill-item` 改 `display: block; margin-bottom: 6px`
    - `.skill-name` 加 `::after { content: '：'; }`
    - `.skill-detail` 用 `--text-soft` 颜色
  - Verify: `node -c site/js/*.js`; 浏览器手工检查
  - Files: site/styles.css, site/js/config.js

## T7 §5.5 after 截图 (1col)

- [ ] **Task**: 用 CDP 截 §5.5 应用后页面
  - Acceptance:
    - `docs/preview-skills-1col.png` 存在
    - 视觉与 §5.5 描述一致 (单行 `技能名：详情`)
  - Verify: 文件存在 + 视觉对比
  - Files: docs/preview-skills-1col.png (新增)
  - **无 commit** (preview)

## T8 用户 gate

- [ ] **Task**: 用户 review 2 张截图
  - Acceptance: 用户回答 "保留 1col" 或 "回滚到 2col"
  - Verify: 用户回复
  - Files: (无)
  - **如果保留**: 进 T9-commit; **如果回滚**: 进 T9-revert

## T9 §5.5 commit 或 revert

- [ ] **Task 9a (保留)**: commit §5.5
  - Acceptance: 截图两张 commit 进 docs/ (或 gitignore 跳过), CSS+JS 改动 commit
  - Commit: `style(css): skills 单列布局 (5.5)`

- [ ] **Task 9b (回滚)**: revert T6 改动
  - Acceptance: styles.css + config.js 回到 T3 后的状态
  - Verify: `git diff main feat/ocr-friendly-resume -- site/styles.css site/js/config.js` 不含 §5.5 改动
  - 无 commit (回滚后无改动)

## T10 OCR 智联真传

- [ ] **Task**: 把 sample data 导出的 PDF 上传智联招聘, 看智能解析结果
  - Acceptance: 智联智能填充在线简历的字段正确率 ≥ 85%
  - Verify: 用户操作智联, 数 30 个字段里多少正确
  - Files: (无代码改动; 用户行为)
  - **失败回退**: 不动代码, 用户手填剩余字段 (这是 spec 11 范围之外的兜底)

## T11 OCR Boss 真传

- [ ] **Task**: 把同一份 PDF 上传 Boss直聘, 看智能解析结果
  - Acceptance: Boss 智能填充字段正确率 ≥ 85%
  - Verify: 同 T10
  - Files: (无代码改动; 用户行为)

## 跟踪

- 当前 commit: `cfd2e33 chore: add OCR-friendly spec and plan`
- 下一步: T2 (§5.4)
- 整体进度: 1/11 tasks done
