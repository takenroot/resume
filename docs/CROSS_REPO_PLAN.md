# CV 字段治理方案 — 消歧义设计 (待批准)

> 前提: **假设 cv-autofill 是完美的** — 它会从真实平台表单采集字段、评分、经用户决策, 产出权威的 `fields.json` (字段全集 + 平台映射 + 版本戳)。本方案只回答: CV 项目自己怎么做, 字段方面才永不会产生歧义。
> 核心洞察: 歧义的产生条件是"两处各自维护同一事实"。本设计让 CV 侧只有 config.js 一处可写字段, fields.json 只读, 分歧由测试当场抓住。

## 仲裁规则 (方案的灵魂, 一句话)

> 字段**存不存在**、**英文 key 叫什么** → 查 fields.json;
> **中文 label、渲不渲染、编辑器怎么摆** → CV 自己定 (UI 层, 不构成歧义)。

## 步骤 (1→2→3 独立可回滚, 每步单独 commit)

### 步骤 1: vendor `site/fields.json` — 唯一上游接口

- 从 cv-autofill `schema/cv-superset.schema.json` 手工转换出初版 `fields.json`:
  ```json
  {
    "version": "2026-08-15",
    "fields": {
      "profile.name": { "platforms": ["boss", "liepin", "zhaopin"], "status": "current" },
      "experience.achievements": { "platforms": ["boss", "liepin"], "status": "current" },
      ...
    }
  }
  ```
- key 用点路径 (`section.field`, profile 字段 `profile.xxx`), status 三态: `current` (CV 已实现) / `proposed` (上游有, CV 未吸收) / `cvOwn` 不写进 fields.json (见步骤 2 白名单)
- **规则: 此文件只能整体替换升级, 从不手改单字段**。上游变了 = 这个文件整个 diff, review 一目了然
- 范围: 1 新文件; 风险: 零

### 步骤 2: `test/fields-sync.mjs` — 对账测试 (核心)

收集 `SECTION_CONFIG` + `PROFILE_FIELDS` + `PROFILE_COMPOSITES` 所有 key, 断言三条:

1. **CV 字段 ⊆ 上游**: 每个 key 必须存在于 fields.json, 找不到 = 歧义, 测试红
2. **例外显式声明**: CV 自有字段 (`timeline` 预留 / `text` / `summary` 模块 / `avatar` 本地策略 / `currentSalary` 敏感字段等) 写死在测试文件的 `CV_OWN` 数组里 — "这个字段不在上游"是写在代码里的决定, 不是没说清楚的漏洞
3. **命名规则机检**: 所有 key 过 `/^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/` — 中文 key 物理上无法回归 (2026-08 ③ 英文化工作从此有测试守着)

信息性输出 (不 fail): fields.json 里 `status: "proposed"` 的字段列表 — "要不要吸收新字段"的决策入口, 从翻 markdown 变成看测试输出。

- 范围: 1 新测试文件 (~60 行, 复用现有 new Function 无框架模式); 风险: 零

### 步骤 3: 文档落锤

- `docs/SCHEMA_NAMING.md` 头部写仲裁规则 + fields.json 是字段事实源
- README 数据格式/跨项目章节指向 fields.json
- `docs/cv-schema.json` 副本删除 (本方案步骤 1 的 fields.json 取代它 — 原 CROSS_REPO_PLAN 步骤 2 自然消亡)
- AGENTS.md 测试命令列表加 `fields-sync.mjs`
- 范围: 3 文件文档改动 + 删 1 文件; 风险: 零

### 步骤 4 (推荐, 可不做): CV 数据版本戳

- `site/data.json` 顶层加 `"schemaVersion": "2026-08-15"`, 导出自带
- `validateSchema()` 加 warning 级检查: 无 schemaVersion → toast 提示不拦截
- 作用: adapter 未来可按版本响亮报错 (CV 破格式改名时), 而不是静默丢字段
- 范围: ~5 行; 风险: 零 (纯新增)

## 明确不做

- ❌ CV 仓库不跑任何同步脚本 — fields.json 升级是"人工拷贝 + 跑测试"两个动作, 脚本本身是新噪音源
- ❌ CV 不读 cv-autofill 的运行时/内部结构 — 唯一接口是那个 JSON 文件
- ❌ 不改 adapter (它在 cv-autofill 仓库, 本方案管不着也不需管)
- ❌ 不给 CV 加构建步骤 — fields.json 是数据, 测试直接读文件

## 完成标准

- `node test/fields-sync.mjs` 绿, 且故意改错一个 key 能变红 (自证有效)
- 现有 4 个 `test/*.mjs` 全绿 + `node --check site/js/*.js`
- fields.json 里 `current` 字段与 config.js 完全对齐 (测试保证)

## 回滚

每步独立 commit; 删掉 fields.json + fields-sync.mjs 即回到现状, 无代码路径依赖它们。

## 与旧 CROSS_REPO_PLAN 的关系

旧 plan 的步骤 1 (冻结 cv-autofill e2e fixture) 属于 cv-autofill 仓库内部加固, 不在本方案范围, 可另行执行; 步骤 2 (杀 schema 副本) 并入本方案步骤 3; 步骤 3 (版本戳) 即本方案步骤 4。
