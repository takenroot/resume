# CV Schema 字段命名对照表

> 用途: 给"自动填充引擎"(cv-autofill) 做字段映射时查这表, 避免漏字段或张冠李戴
> 命名规则 (2026-08 确立): schema key 一律英文 camelCase, 中文只属于平台 label / UI 展示层
> 字段机器可读版见 [cv-schema.json](cv-schema.json) (cv-autofill 超集 schema 副本, 含 x-platforms / x-tier / x-status)

---

## 一、字段 ↔ 平台对照

> ⚠️ 标记 = 语义重叠或一名多框: 同一个 CV 字段可能要拆到平台多个输入框, 或平台多个框对应同一个 CV 字段。

### 1. 工作经历 (CV type=`experience`, `experience_other` 同 schema)

| CV 字段 | 类型 | 平台对应输入框 | 备注 |
|---|---|---|---|
| `company` | string | 公司名称 | 全平台 |
| `position` | string | 职位 | 全平台 |
| `period` | string | 在职时间 / 起止时间 | 字符串 `YYYY.MM - YYYY.MM/至今`, 引擎 splitPeriod 拆双框 |
| `summary` | string | 工作内容 / 职责描述 / 工作简介 | 全平台, 名称略不同语义一致 |
| `achievements` | string[] | 工作业绩 / 业绩成果 (Boss 独立框 1000 字 / 猎聘"职责业绩"合并框) | ⚠️ 原 `highlights` 2026-08 改名; 猎聘合并框用 `summary + achievements` 拼接 |
| `industry` | string | 所属行业 (下拉) | Boss |
| `department` | string | 部门 | Boss, 选填 |
| `isIntern` | boolean | 本段经历是实习经历 checkbox | 猎聘/智联; 误勾比不填更糟, 不确定就留 false |
| `skillTags` | string[] | 技能标签 (每段经历可挂) | Boss |

### 2. 教育经历 (CV type=`education`)

| CV 字段 | 类型 | 平台对应输入框 | 备注 |
|---|---|---|---|
| `school` | string | 学校名称 | 全平台 |
| `major` | string | 专业 | 全平台 |
| `degree` | string | 学历 (本科/硕士/...) | 全平台 |
| `degreeType` | string | 学制类型 (全日制/非全日制/自考) | Boss, 跟 degree 是组合选择器 |
| `isUnified` | boolean | 是否统招 checkbox | 猎聘; 存 boolean |
| `overseasEdu` | boolean | 海外留学经历 | 存 boolean |
| `period` | string | 就读时间 | 全平台 |
| `courses` | string | 主修课程 | 各平台 |
| `campus` | string[] | 校园经历 / 在校经历 (职务/荣誉/活动) | ⚠️ 平台口径比 CV 宽, CV 只存文本列表 |
| `honors` | string[] | 荣誉奖项 | 原 `experience` 字段 2026-08 改名 (消除跟 section type 撞名) |
| `thesis` | string | 毕设/论文描述 | Boss |

### 3. 项目经验 (CV type=`projects`)

| CV 字段 | 类型 | 平台对应输入框 | 备注 |
|---|---|---|---|
| `name` | string | 项目名称 | 全平台 |
| `role` | string | 担任角色 | Boss |
| `period` | string | 项目时间 | 全平台 |
| `link` | string | 项目链接 | Boss |
| `tags` | string[] | ⚠️ 技术栈 / 技能标签 (平台从不叫 tags) | 各平台 |
| `summary` | string | 项目描述 / 项目介绍 | 各平台 |
| `achievements` | string[] | 项目亮点 / 项目职责 / 项目业绩 | 原 `highlights` 2026-08 改名 |

### 4. 专业技能 (CV type=`skills`)

| CV 字段 | 类型 | 平台对应输入框 | 备注 |
|---|---|---|---|
| `name` | string | 技能名称 / 技能类别 | 各平台 |
| `detail` | string | 掌握程度 / 技能描述 | 各平台 |

### 5. 语言能力 (CV type=`language`)

| CV 字段 | 类型 | 平台对应输入框 | 备注 |
|---|---|---|---|
| `name` | string (select 9 语种) | 语种 | 各平台 |
| `proficiency` | string (select) | 熟练程度 | 各平台 |
| `level` | string | 等级 (如 CET-6) | 各平台 |
| `readingWriting` | string (select) | 读写 | ⚠️ 智联把听说/读写拆两框, CV 只存读写 |

### 6. 自我评价 (CV type=`summary`) / 证书 (CV type=`certificate`)

- `summary.items[]` (string[]) ↔ 自我评价 / 个人评价 / 自我介绍, 各平台
- `certificate`: `name` / `issuer` / `period` / `serial` / `url` ↔ 证书名 / 颁发机构 / 获得时间 / 编号 / 验证链接

### 7. 个人信息 (CV `profile`)

| CV 字段 | 类型 | 平台对应输入框 | 备注 |
|---|---|---|---|
| `name` | string | 姓名 | 全平台 |
| `phone` | string | 手机号 / 联系电话 | 全平台 |
| `email` | string | 邮箱 | 全平台 |
| `location` | string | 现居地 / 居住地 / 所在城市 | 各平台; 2026-08 英文化 (原中文 key「所在地」) |
| `title` | string | 期望岗位 / 求职意向 | 各平台 |
| `experience` | string | 工作年限 (如 "5年") | 各平台 |
| `jobStatus` | string (select) | 求职状态 | Boss/智联; 2026-08 英文化 (原中文 key「求职状态」) |
| `gender` | string | 性别 | 各平台选填; CV 预览不渲染 |
| `birthDate` | string (YYYY-MM-DD) | 出生日期 / 生日 | Boss/猎聘; 平台要年龄时自动算 |
| `firstWorkDate` | string (YYYY-MM-DD) | 首次参加工作时间 | 智联; CV 预览不渲染 |
| `github` | string (URL) | GitHub / 个人主页 | 部分平台 |
| `wechat` | string | 微信号 | 猎聘 |
| `expectIndustry` | string | 期望行业 | 猎聘 |
| `expectJobs` | `[{title, jobType, salary:{low,high}, cities[]}]` 单条目 | 期望职位 / 工作性质 / 期望薪资 / 期望城市 | ⚠️ 三平台都是这套复合结构; 2026-08 起 CV 唯一事实源 (原 `expectSalary`/`expectCities` 独立字段已删除并入, `months` 月数无去向) |
| `avatar` | string | 头像 | 全平台; CV 存 base64 在 localStorage (非 JSON), 导出清空, 引擎永不自动上传 |
| `timeline` | string | — | CV 自有预留字段, 预览不渲染, 平台无 |
| `currentSalary` | `{salary, months, secret}` | 当前薪资 (敏感) | 永久隐藏字段, 只能手写 JSON 填 |

---

## 二、有意不加的字段

按 cv-autofill 评分 ≤2 (独享平台 + 适用面窄), 默认不进 CV schema:

- `politicalStatus` (政治面貌) — 仅国企场景
- `training` (培训经历) — 平台支持但 HR 权重低
- 自定义字段 — CV 定位"展示层小而美", 溢出需求走 `text` / `timeline` 模块兜底

---

## 三、变更历史

- **2026-08-15**: 全表刷新到现役状态 — `highlights`→`achievements` (experience/projects), `所在地`→`location`, `求职状态`→`jobStatus`, `expectSalary`/`expectCities` 并入 `expectJobs`, 补 isIntern/industry/department/skillTags/degreeType/isUnified/overseasEdu/thesis/role/link/wechat/expectIndustry/firstWorkDate 等已落地字段; 删"缺口清单" (原 CV_SCHEMA_FEEDBACK.md 建议全部落地, 文档已删除归档进 CHANGELOG)
- **2026-08-13**: 删除 projects `challenges` 字段; 新建本文档
