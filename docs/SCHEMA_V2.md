# Schema v2 契约（2026-08-19）

v1 → v2 的字段级对照表。迁移实现在 `site/js/data.js` 的 `migrateV1toV2`，测试在 `test/migrate-v2.mjs`。词汇向 JSON Resume 对齐（startDate/endDate/highlights/tags），顶层结构保持 `profile + sections` 不变。

## profile 层

| v1 | v2 | 说明 |
|---|---|---|
| `experience` | `workYears` | 消除与 `sections[].type:"experience"` 撞名 |
| `location`（标签实为籍贯） | `nativePlace` | 名实合一。cv 不新增"所在地"字段（YAGNI） |
| `timeline` | 删除 | 预留僵尸字段，从不渲染 |
| `expectJobs: [{...}]`（wrap1 单元素数组） | `expectJobs: {...}`（单对象） | shape 不变，只去数组包装 |
| `jobStatus` 中文值 | 存码：`available`（随时到岗）/`open`（在职-看机会）/`passive`（在职-暂不考虑）/`unavailable`（暂不找工作） | 展示走 `CODE_LABELS`（config.js） |

## section item 层

| v1 | v2 | 涉及 section |
|---|---|---|
| `period: "2022.01 - 至今"` | `startDate: "2022-01"` + `endDate: "YYYY-MM"\|省略`（省略=至今；月精度 ISO） | experience, experience_other, education, projects, timeline |
| `certificate.period` | `certificate.date: "YYYY-MM"`（单点） | certificate |
| `achievements[]` | `highlights[]` | experience, experience_other, projects |
| `honors[]` | `highlights[]` | education |
| `skillTags[]` | `tags[]` | experience, experience_other |
| `courses` / `campus`（字符串） | 数组（`a:true`） | education |
| `degreeType` 中文值 | 存码：`fulltime`（全日制）/`parttime`（非全日制）/`selftaught`（自考） | education |
| `isIntern/isUnified/overseasEdu` | 已是 boolean，不变 | — |
| language 的 select 值 | **保留中文**（刻意例外：选项本身就是平台词汇表，编码无消费方） | language |

## 空值省略

数据层只存有值的键：`""` / `[]` / null / undefined 在归一与收集时被删除（缺省即省略）。`false` / `0` 是有意义值，保留。`defaultItem` 里的空串只服务编辑器输入框，不落数据。

## 刻意的决定

- **头字段不统一**：company/school/name 保持分 section 词汇（承载平台填充语义）。统一的是 dates + summary + highlights + tags 半截。
- **渲染格式不变**：日期显示仍为 `2022.01 - 至今`（`fmtDateRange`，utils.js）；Markdown 导出对人不变。
- **迁移时机**：load/import 时内存迁移，下次 save 落盘；period 解析失败时 startDate 存原文（不丢数据，warning 提示）。
