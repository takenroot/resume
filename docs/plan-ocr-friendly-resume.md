# Plan: OCR-Friendly Resume PDF

> 配套 spec: [spec-ocr-friendly-resume.md](./spec-ocr-friendly-resume.md)
> 分支: `feat/ocr-friendly-resume`
> Tag 锚点: `pre-ocr-changes-2026-06-30` (指向 main 的 c774a76)

## 1. 目标

让 `site/styles.css` + `site/data.json` + `site/js/config.js` 三处微改动后,
`window.print()` 导出的 PDF 满足智联招聘 + Boss直聘智能解析 ≥85% 字段正确。
**屏幕视觉零回归** (除用户主动 review 后保留的 §5.5 skills 单列)。

## 2. 组件 / 改动清单

| ID | 文件 | 改动性质 | 依赖 |
|---|---|---|---|
| §5.1 | site/styles.css | CSS: `--fs-h2: 14px → 16px` | 无 |
| §5.2 | site/styles.css | CSS: `@media print` 内字号变量重置 | 无 |
| §5.3 | site/styles.css | CSS: 顶部 `@font-face` × 2 + print 内 `--font-family` 覆盖 | 无 |
| §5.4 | site/data.json | 数据: 时间格式 `2022 – 至今` → `2022.01 - 至今` | 无 |
| §5.4 | README.md | 文档: 加一行时间格式规范 | §5.4 data 改完 |
| §5.5 | site/styles.css | CSS: `.skills-grid` 删 grid, 改 block | §5.1-§5.4 已落地 |
| §5.5 | site/js/config.js | JS: `skills.renderItem` 加 `::after` 不需要, 直接字符串改 | §5.5 CSS |

## 3. 实现顺序 (commit 切分)

> 切分原则: 每个 commit 都是可回滚单元。§5.5 单独一个 commit, 因为它有视觉风险。

### Commit 1: `chore: add OCR-friendly spec + plan`
- 内容: `docs/spec-ocr-friendly-resume.md` + `docs/plan-ocr-friendly-resume.md`
- 验证: `git log --stat` 看两个 doc 落库

### Commit 2: `style(css): OCR-friendly 基础 (h2 字号 + print 锁定)`
- 内容: §5.1 + §5.2 + §5.3 一次性进 site/styles.css
- 验证:
  - `node -c site/js/*.js` (无 JS 改动但 sanity check)
  - `cd site && python3 -m http.server 8000` 启动
  - 浏览器打开 → 屏幕视觉与改动前对比 (用 Ctrl+Shift+R 强制刷新绕过 cache)
  - Ctrl+P 预览 → 视口拉到 600px 仍 ≥ 13px
- 风险: NotoSansSC 引入 print 后可能微调间距, 屏幕 print-to-PDF 测试 1 分钟可发现

### Commit 3: `style(css): skills 单列 (5.5 - 截图 review 后才走)`
- 内容: §5.5 (CSS + JS)
- 验证:
  - CDP 截图 `docs/preview-skills-2col.png` (从 main HEAD)
  - 应用改动 → 截图 `docs/preview-skills-1col.png`
  - 用户 review → 拍板
- 风险: 视觉改变, 已被 §5.5 预览流程保护

### Commit 4: `docs: 时间格式规范`
- 内容: §5.4 (data.json + README.md)
- 验证: `git diff` 看 time 字段全部用 `YYYY.MM - YYYY.MM` 格式

## 4. 关键风险与缓解

| 风险 | 概率 | 影响 | 缓解 |
|---|---|---|---|
| NotoSansSC 引入 print 后 PDF 实际间距与预期不一致 | 中 | 中 | Commit 2 落地后立刻打印一份 PDF 看 (用 Edge 远程调试截屏) |
| 用户看完 §5.5 截图后拒绝单列 | 中 | 低 | 整 Commit 3 revert 即可, 不影响 Commit 2/4 |
| 智联招聘智能解析实际 < 85% | 中 | 高 | 兜底: 用户手填剩余字段, 这条已经在 spec 11 范围之外 |
| 字体文件 (350KB) 加载慢 | 低 | 低 | `font-display: swap` 已设置, 不阻塞渲染 |

## 5. 验证检查点 (在 commit 之间)

```
[ ] Commit 1 后: git log 确认 spec+plan 落库
[ ] Commit 2 后: 浏览器截图 vs 改动前 (屏幕), PDF 截图 (打印)
[ ] Commit 3 前: 拿到 2 张 skills 截图, 用户拍板
[ ] Commit 3 后: 再次视觉确认
[ ] Commit 4 后: data.json + README 一致性
[ ] OCR 真传智联: ≥ 85% 字段正确
[ ] OCR 真传 Boss: ≥ 85% 字段正确
```

## 6. 不在 Plan 范围

- 任何数据 schema 改动
- 任何视觉设计 (配色/圆角/间距)
- 任何新依赖
- PDF 导出路径替换
- 自动填表单脚本 (spec 11 范围之外)

## 7. 时间预算

- Commit 1: 5 分钟 (commit 已写好, 等执行)
- Commit 2: 30 分钟 (写 CSS + 启动 server + 截图对比)
- Commit 3: 30 分钟 (含 CDP 截图前后 + 用户 review 决策)
- Commit 4: 10 分钟
- OCR 真传: 30 分钟 (你 + 我各占一半)

总: ~2 小时, 分多次会话进行。
