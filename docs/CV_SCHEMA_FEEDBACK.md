# CV 项目 Schema 优化建议

> 来源:cv-autofill 项目在 Boss直聘/猎聘/智联三平台真实表单填充中积累的需求。
> 原则:以下都是"平台要求但 CV 数据缺失或粒度不够"的字段。全部建议为**可选字段**,不破坏现有 data.json 结构。

## 一、字段缺口清单(按平台实测)

### 1. experience[](工作经历)—— 缺口最多

| 建议字段 | 类型 | 平台来源 | 说明 |
|---|---|---|---|
| `achievements` | string[] | Boss直聘、猎聘 | **工作业绩**是独立输入框(Boss 1000 字、猎聘"职责业绩"),与工作内容分开。现在 highlights 只有一份,两个框只能填一个 |
| `industry` | string | Boss直聘 | "所属行业"下拉必填(如"互联网") |
| `department` | string | Boss直聘 | "部门"(如"产品部"),选填 |
| `isIntern` | boolean | 猎聘、智联 | "本段经历是实习经历" checkbox,现在无法判断该不该勾 |
| `skillTags` | string[] | Boss直聘 | 每段经历可挂技能标签(如 MySQL) |

现状字段保留:`company / position / period / summary / highlights`

建议扩展示例:

```json
{
  "company": "乾岳驭空低空飞行科技有限责任公司(内蒙古)",
  "position": "运维工程师",
  "period": "2025.08 - 至今",
  "industry": "互联网",
  "department": "技术部",
  "isIntern": false,
  "summary": "负责共享无人机机柜运维、大疆 SDK 二次开发及巡检系统搭建……",
  "highlights": ["原安卓广告屏应用会重复访问 oss 视频资源……"],
  "achievements": ["将服务器流量消耗降低 80%……"],
  "skillTags": ["Kotlin", "DJI SDK", "YOLO"]
}
```

> 填充映射建议:`summary + highlights` → 工作内容框;`achievements` → 工作业绩框。

### 2. education[](教育经历)

| 建议字段 | 类型 | 平台来源 | 说明 |
|---|---|---|---|
| `degreeType` | string | Boss直聘 | 学历是"本科 / 全日制"组合选择器,需要学制(全日制/非全日制/自考/成考) |
| `experience` | string | 猎聘、Boss | "在校经历"(职务/荣誉/主修课程)独立 textarea,现有 courses 字段太窄 |
| `thesis` | string | Boss直聘 | "毕设/论文描述"独立 textarea |
| `isUnified` | boolean | 猎聘 | "是否统招" checkbox |

建议扩展示例:

```json
{
  "school": "河套学院",
  "major": "物联网工程",
  "degree": "本科",
  "degreeType": "全日制",
  "period": "2023.09 - 2025.07",
  "isUnified": true,
  "experience": "担任校机器人社团技术负责人,获省级物联网竞赛二等奖……",
  "thesis": "基于 YOLOv8 的无人机巡检目标检测系统……"
}
```

### 3. projects[](项目经历)

| 建议字段 | 类型 | 平台来源 | 说明 |
|---|---|---|---|
| `role` | string | Boss直聘 | "担任角色"(如"全栈工程师"),与项目名分开 |
| `link` | string | Boss直聘 | 项目链接(如 github.com/xxx) |
| `achievements` | string[] | Boss直聘 | 项目业绩独立 textarea(同工作经历的双框问题) |

```json
{
  "name": "大疆无人机视频分析工具",
  "role": "全栈工程师",
  "link": "github.com/takenroot/dji-video-analysis",
  "period": "2026.04 - 2026.07",
  "summary": "面向 DJI 无人机视频的目标智能分析系统……",
  "highlights": ["独立完成全栈开发:后端基于 FastAPI + SQLAlchemy……"],
  "achievements": ["识别准确率达到 92%……"]
}
```

### 4. profile(基本信息)

| 建议字段 | 类型 | 平台来源 | 说明 |
|---|---|---|---|
| `expectSalary` | object | 猎聘、智联 | `{ "low": 7, "high": 10, "months": 12 }`(单位 K),求职期望薪资是三框联动 |
| `expectCities` | string[] | 猎聘 | 期望城市(多选,如鄂尔多斯/巴彦淖尔/西安) |
| `expectIndustry` | string | 猎聘 | 期望行业("全部行业"或具体) |
| `wechat` | string | 猎聘 | 微信号是独立字段(现在有邮箱电话但没有微信) |

```json
"profile": {
  "expectSalary": { "low": 7, "high": 10, "months": 12 },
  "expectCities": ["西安", "巴彦淖尔"],
  "expectIndustry": "全部行业",
  "wechat": "xxx"
}
```

## 二、机制层面建议

### 1. 构建时 schema 校验

cv-autofill 的 popup 里有一份 `validateCvJson`(`extension/popup/popup.js`),校验 profile.name / sections[].type / items 结构 —— 这就是 CV schema 的事实契约。建议 cv 项目构建 data.json 时跑同样的校验,结构错误在生成端就暴露,而不是等填充失败才发现。

### 2. 平台缺口反馈环

cv-autofill 填充时会把"标黄未匹配"的字段记录下来。建议定期导出这些记录,对照本清单补数据 —— **平台要什么、CV 缺什么,让真实填充数据说话**,而不是拍脑袋加字段。

### 3. 中英文简历并行

猎聘有"英文简历"tab。如果 cv 项目计划支持英文版 data.json,建议 sections 结构不变、仅内容翻译,填充引擎无需改动。

## 三、优先级建议

1. **P0**:`experience[].achievements`(双 textarea 是 Boss/猎聘的硬结构,当前必有一个框填不上)
2. **P1**:`expectSalary`、`education[].degreeType`(都是必填选择器,缺了就只能留黄)
3. **P1**:`experience[].isIntern`(checkbox 误判比不填更糟)
4. **P2**:industry / department / role / link / thesis / wechat(锦上添花)
5. **P2**:构建时校验、缺口反馈环(机制建设)
