# CV Schema 字段命名对照表

> 来源: 跨 CV 项目源码 + [cv-autofill 项目优化建议](CV_SCHEMA_FEEDBACK.md) + Boss直聘/猎聘/智联三平台真实表单
> 用途: 给"自动填充引擎"做字段映射时查这表,避免漏字段或张冠李戴

---

## 一、字段差异总览

> ⚠️ 标记的字段是**语义重叠**或**字段名不一致但实际上填的是同一个东西**的情况。自动填充时**同一个 CV 字段可能要拆到平台的多个输入框**,或者平台的多个输入框**对应同一个 CV 字段**。

### 1. 工作经历 (CV type=`experience`)

| CV 字段 | 类型 | 平台对应输入框 | 平台来源 | 备注 |
|---|---|---|---|---|
| `company` | string | 公司名称 | 全平台通用 | ✅ 直接对应 |
| `position` | string | 职位 | 全平台通用 | ✅ 直接对应 |
| `period` | string | 在职时间 / 起止时间 | 全平台通用 | ✅ 直接对应 |
| `summary` | string (textarea) | 工作内容 / 职责描述 / 工作简介 | Boss/猎聘/智联通用 | ✅ 名称略不同但语义一致 |
| `highlights` | string[] (textarea 每行一条) | ⚠️ **可拆两个用途**: (a) 工作内容补充(部分平台 summary 不够长时追加); (b) **工作业绩 / 业绩成果** | Boss "工作业绩" 独立框(1000 字) / 猎聘 "职责业绩" 合并框 | ⚠️ 优化文档建议新建 `achievements` 字段拆分; 现阶段 CV 用 `highlights` 同时承担两个角色 |
| _(暂无)_ | string | 工作业绩 / 业绩成果 | Boss/猎聘 | ⚠️ 优化文档 P0: 建议补 `achievements` 字段 |
| _(暂无)_ | string | 所属行业(下拉,如"互联网") | Boss直聘 | ❌ CV 暂缺 |
| _(暂无)_ | string | 部门(如"产品部") | Boss直聘 | ❌ CV 暂缺(选填) |
| _(暂无)_ | boolean | 是否实习 checkbox | 猎聘/智联 | ❌ CV 暂缺,误勾比不填更糟 |
| _(暂无)_ | string[] | 技能标签(每段经历可挂) | Boss直聘 | ❌ CV 暂缺 |

### 2. 教育经历 (CV type=`education`)

| CV 字段 | 类型 | 平台对应输入框 | 平台来源 | 备注 |
|---|---|---|---|---|
| `school` | string | 学校名称 | 全平台通用 | ✅ |
| `major` | string | 专业 | 全平台通用 | ✅ |
| `degree` | string | 学历(本科/硕士/...) | 全平台通用 | ✅ |
| `period` | string | 就读时间 | 全平台通用 | ✅ |
| `courses` | string (textarea) | 主修课程 | 各平台 | ✅ |
| `campus` | string (textarea 每行一条) | ⚠️ **校园经历 / 在校经历** (职务/荣誉/活动) | 猎聘/Boss | ⚠️ 平台字段比 CV 宽(可填"职务"、"荣誉"、"活动"),CV `campus` 现只支持文本列表 |
| _(暂无)_ | string | 学制类型(全日制/非全日制/自考/成考) | Boss直聘 | ❌ P1 必填选择器 |
| _(暂无)_ | string (textarea) | 在校经历(扩展) | 猎聘/Boss | ⚠️ 与 `campus` 重叠但平台字段更宽 |
| _(暂无)_ | string (textarea) | 毕设/论文描述 | Boss直聘 | ❌ CV 暂缺 |
| _(暂无)_ | boolean | 是否统招 checkbox | 猎聘 | ❌ CV 暂缺 |

### 3. 项目经验 (CV type=`projects`)

| CV 字段 | 类型 | 平台对应输入框 | 平台来源 | 备注 |
|---|---|---|---|---|
| `name` | string | 项目名称 | 全平台通用 | ✅ |
| `period` | string | 项目时间 | 全平台通用 | ✅ |
| `tags` | string[] (textarea, 逗号分隔) | ⚠️ **技术栈** / **技能标签** | 各平台 | ⚠️ CV 叫 `tags`,平台都叫"技术栈"或"技能标签" |
| `summary` | string (textarea) | 项目描述 / 项目介绍 | 各平台 | ✅ |
| `highlights` | string[] (textarea 每行一条) | 项目亮点 / 项目职责 | 各平台 | ✅ |
| ~~`challenges`~~ | ~~string[]~~ | ~~项目难点~~ | ~~(用户已要求删除)~~ | ✅ **2026-08-13 删除**,见 CHANGELOG |
| _(暂无)_ | string | 担任角色(如"全栈工程师") | Boss直聘 | ❌ CV 暂缺,常与 `name` 混着写 |
| _(暂无)_ | string | 项目链接(如 github.com/xxx) | Boss直聘 | ❌ CV 暂缺 |
| _(暂无)_ | string[] | 项目业绩 | Boss直聘 | ❌ 同工作经历 `achievements` 问题 |

### 4. 专业技能 (CV type=`skills`)

| CV 字段 | 类型 | 平台对应输入框 | 平台来源 | 备注 |
|---|---|---|---|---|
| `name` | string | 技能名称 / 技能类别 | 各平台 | ✅ |
| `detail` | string | 掌握程度 / 技能描述 | 各平台 | ✅ |

### 5. 自我评价 (CV type=`summary`)

| CV 字段 | 类型 | 平台对应输入框 | 平台来源 | 备注 |
|---|---|---|---|---|
| `items[]` | string[] (每行一条) | 自我评价 / 个人评价 / 自我介绍 | 各平台 | ✅ |

### 6. 个人信息 (CV `profile`)

| CV 字段 | 类型 | 平台对应输入框 | 平台来源 | 备注 |
|---|---|---|---|---|
| `name` | string | 姓名 | 全平台通用 | ✅ |
| `phone` | string | 手机号 / 联系电话 | 全平台通用 | ✅ |
| `email` | string | 邮箱 | 全平台通用 | ✅ |
| `所在地` | string | 现居地 / 居住地 / 所在城市 | 各平台 | ⚠️ CV 用中文 key,其余用英文 |
| `title` | string | 期望岗位 / 求职意向 | 各平台 | ✅ |
| `experience` | string | 工作年限(如"5年") | 各平台 | ✅ |
| `求职状态` | string (select) | 求职状态 | Boss/智联 | ✅ |
| `gender` | string | 性别 | 各平台(选填) | ⚠️ 编辑器保留字段但简历预览不再显示 |
| `birthDate` | string (YYYY-MM-DD) | 出生日期 / 生日 | Boss/猎聘 | ✅(自动算年龄) |
| `github` | string (URL) | GitHub / 个人主页 | 部分平台 | ✅ |
| `avatar` | string (data URL 或 URL) | 头像 | 全平台 | ⚠️ CV 存 base64 在 localStorage(非 JSON),导出 JSON 时清空 |
| `timeline` | string | (CV 自定义) | 顶部时间轴 | ❌ 平台无此字段,CV 自有 |
| _(暂无)_ | object `{low, high, months}` | 期望薪资(三框联动) | 猎聘/智联 | ❌ P1 必填 |
| _(暂无)_ | string[] | 期望城市(多选) | 猎聘 | ❌ CV 暂缺 |
| _(暂无)_ | string | 期望行业 | 猎聘 | ❌ CV 暂缺 |
| _(暂无)_ | string | 微信号 | 猎聘 | ❌ CV 暂缺 |

---

## 二、CV 项目尚未覆盖的平台字段(缺口清单)

按 [cv-autofill 反馈](CV_SCHEMA_FEEDBACK.md) 优先级排列:

### P0 (必填字段,缺失则自动填充留黄)
- **无**: CV 现有 `highlights` 已经能填 Boss/猎聘的工作业绩框(虽然语义混在一起)

### P1 (重要选择器/checkbox)
- `profile.expectSalary`: `{ low: number, high: number, months: number }`,单位 K
- `education[].degreeType`: "全日制" / "非全日制" / "自考" / "成考"
- `experience[].isIntern`: boolean

### P2 (锦上添花)
- `experience[].industry`、`department`、`skillTags`
- `education[].experience`(扩展 `campus`)、`thesis`、`isUnified`
- `projects[].role`、`link`、`achievements`(同工作)
- `profile.expectCities`、`expectIndustry`、`wechat`

---

## 三、自动填充映射建议(给 cv-autofill 引擎)

> 当前 CV schema 与平台表单字段的实际映射关系。下表假设 CV 不补新字段,只拿现有字段填。

| 平台输入框 | CV 数据来源 |
|---|---|
| Boss: 工作内容 | `summary` |
| Boss: 工作业绩 | `highlights` (join 换行) |
| 猎聘: 职责业绩 | `summary + highlights` (拼接) |
| 智联: 工作描述 | `summary` |
| Boss: 所属行业 | ⚠️ 留空 (CV 缺) |
| Boss: 部门 | ⚠️ 留空 (CV 缺) |
| 猎聘: 是否实习 | ⚠️ 留空 / 默认 false (CV 缺,误填风险高) |
| 猎聘: 微信号 | ⚠️ 留空 (CV 缺) |
| 猎聘/智联: 期望薪资 | ⚠️ 留空 (CV 缺,三框联动) |
| Boss: 项目角色 | ⚠️ 留空 (CV 缺,可从 `name` 推断但不严谨) |
| Boss: 项目链接 | ⚠️ 留空 (CV 缺) |

---

## 四、变更历史

- **2026-08-13**: 删除项目 `challenges` 字段;新增本文档,梳理字段差异
- 2026-08-13 之前: 优化文档里建议加的 `achievements` / `industry` 等字段**尚未在 CV 实现**
