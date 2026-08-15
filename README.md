# CV 静态简历网页

一个使用原生 `HTML/CSS/JS` 实现的静态简历网页项目，采用 **A4 纸张视觉布局**，支持**在线编辑、数据驱动渲染、自动分页、PDF 导出**。

## 项目特点

- **数据驱动渲染** — 简历内容由 `data.json` 管理，修改数据即可更新页面
- **内置编辑器** — 页面内直接编辑简历所有模块，所见即所得
- **多种导入/导出** — 支持 **JSON** 和 **Markdown** 格式的导入与导出
- **自动分页** — 内容超出单页时自动拆分，多页显示页码
- **PDF/PNG 导出** — PNG 截图导出（图片，文字不可搜索）+ 浏览器打印 PDF（文字可搜索/可复制）
- **招聘平台智能解析友好** — 系统字体 + 打印字号锁定 + OCR 友好排版；已验证支持 **Boss 直聘** 和 **智联招聘** 智能解析（需 PDF 中的姓名、联系方式等个人信息与本人一致）
- **本地存储** — 编辑内容自动保存到浏览器 `localStorage`
- **数据安全** — 导入/重置前自动备份 + 每 5 分钟快照到 `cv_backup` 槽位，编辑器底部「恢复备份」一键找回；导入前走 schema 校验拦截坏数据
- **编辑器实时联动** — 任意表单改动触发 50ms debounce 重渲染预览，不需要点保存
- **头像上传** — 上传后自动转为 base64 存入浏览器 localStorage，按姓名绑定；导出 JSON/Markdown 时不含头像，减轻文件体积
- **缩放控制** — 右下角悬浮工具栏，范围 100%–130%，步进 10%
- **响应式布局** — 适配桌面端、平板、手机三档断点
- **自定义滚动条** — 减少视觉干扰
- **纯静态，零依赖后端** — 可直接部署到任意静态托管平台

## 目录结构

```text
cv/
├── site/
│   ├── index.html                  # 简历页面
│   ├── styles.css                  # 布局 / 样式 / 工具栏 / 编辑器 / 打印样式
│   ├── data.json                   # 简历初始数据（JSON）
│   ├── js/                          # 模块化 JS（渲染、编辑器、工具栏、PDF 导出等）
│   │   ├── app.js                   # 入口模块
│   │   ├── config.js               # 模块配置表 (SECTION_CONFIG / fields / renderItem)
│   │   ├── data.js                 # 默认数据 + localStorage 管理 + 导入导出
│   │   ├── editor.js               # 编辑器 (buildEditorForm / collectFormData)
│   │   ├── markdown.js             # Markdown 导入/导出
│   │   ├── pagination.js           # 自动分页布局
│   │   ├── prefs.js                # 页面偏好 (theme / fontSize / fontFamily)
│   │   ├── renderer.js             # 渲染引擎
│   │   ├── utils.js                # 工具函数
│   │   └── zoom.js                 # 缩放控制
│   └── assets/                     # 用户上传的资源文件（头像现优先存浏览器 localStorage）
├── docs/
│   ├── SCHEMA_NAMING.md            # CV 字段 ↔ 平台输入框 命名对照表
│   ├── cv-schema.json              # cv-autofill 超集 schema 副本
│   └── REFACTOR_PLAN.md            # 重构路线图 (已执行部分标 ✅)
├── test/                           # 无框架 node 自检 (*.mjs, 直接 node 跑)
├── start.sh / start.bat            # 本地启动脚本 (自动探测可用端口)
└── README.md
```

## 快速开始

### 方式一：直接打开

在浏览器中直接打开 `site/index.html` 即可预览（`DEFAULT_DATA` 兜底）。

### 方式二：本地服务器（推荐）

```bash
cd site
python -m http.server 8000
```

然后访问 `http://localhost:8000`。

### 方式三：启动脚本（自动探测端口）

- Windows: 双击 `start.bat`
- Linux/macOS: 运行 `bash start.sh`

`start.sh` 默认从 **8765** 端口起探测，自动避开主流软件常用端口（web 开发 3000/5000/5173/8000/8080、数据库 3306/5432/6379/27017、消息队列 5672/15672/9092、监控 9090/9100、容器 2375/2376、Windows Hyper-V 保留区间 8000-8099 等）。被占用则顺延 200 个端口。也可通过 `PORT=xxxx ./start.sh` 显式指定。

## PDF / PNG 导出

提供两种视觉导出模式（图片就是图片，PDF 就是 PDF）：

| 模式 | 说明 |
|------|------|
| **导出 PNG（图片）** | html2canvas 截图，每页一张 PNG（多页自动加 `_p1`/`_p2` 后缀），样式保真但文字不可搜索 |
| **导出 PDF（浏览器打印）** | `window.print()` 调用浏览器原生打印，文字可搜索/可复制，推荐先在打印设置中选择"无边距"；此模式上传 Boss 直聘 / 智联招聘可被智能解析 |

## 页面模块

可通过编辑器灵活配置以下模块类型：

| 模块 | type | 说明 |
|------|------|------|
| 个人信息 | (profile)| 姓名、岗位、求职状态、联系方式、头像、GitHub、微信号、期望薪资/城市/行业/职位、首次参加工作时间 |
| 工作经历 | experience | 公司、职位、时间、所属行业、部门、工作描述、工作业绩、技能标签、是否实习 |
| 其它经历 | experience_other | 工作经历的 alias（同 schema 不同 label），用于部队/兼职/项目承包等 |
| 教育背景 | education | 学校、专业、学历、学制、是否统招、海外留学经历、时间、主修课程、校园经历、荣誉奖项、毕设/论文 |
| 项目经验 | projects | 项目名、担任角色、时间、链接、技术栈、项目描述、项目业绩 |
|专业技能 | skills | 技能名 + 详情（单列布局，便于 OCR/智能解析） |
| 语言能力 | language | 语种（9 选项 select）、熟练程度、等级（CET-6）、听说、读写（智联拆分） |
| 自我评价 | summary | 自由文本条目 |
| 时间轴 | timeline | 时间、标题、标签、描述、亮点 |
| 自由文本 | text | 纯文本段落 |
| 证书 | certificate | 证书名称、颁发机构、获得时间、编号、验证链接 |

> **时间字段约定**：建议使用 `YYYY.MM - YYYY.MM` 或 `YYYY.MM - 至今` 格式（如 `2022.01 - 至今`、`2015.09 - 2019.06`）。这种统一格式便于招聘平台（智联、Boss直聘）智能解析时正确识别。

## 字段详细说明

### profile (个人信息)

| 字段 | 类型 | UI |
|------|------|----|
| `name` | string | text |
| `title` | string | text |
| `experience` | string | text (工作年限如 "5年") |
| `jobStatus` | string | select 4 选项 (求职状态) |
| `location` | string | text (所在地) |
| `gender` | string | text (表单保留, 预览不渲染) |
| `birthDate` | string (YYYY-MM-DD) | date |
| `phone` / `email` / `github` | string | text/email/url |
| `wechat` | string | text |
| `expectIndustry` | string | text |
| `timeline` | string | text (预留字段, 预览不渲染) |
| `avatar` | base64 | file (存 localStorage, 导出 JSON 不含) |
| `expectJobs` | `[{title, jobType, salary:{low,high}, cities[]}]` 单条目 | 复合表单: 职位名 + 工作性质 select + 薪资两框 + 城市 textarea (填写后薪资/城市渲染在头部标签行) |
| `firstWorkDate` | string (YYYY-MM-DD) | date (首次参加工作时间, 预览不渲染) |
| `currentSalary` | `{salary, months, secret}` | 隐藏字段, 见下方说明 |

### 其它 section item 字段

- **experience / experience_other**: company, position, industry, department, period, summary, achievements, skillTags, isIntern
- **education**: school, major, degree, degreeType, isUnified, overseasEdu, period, courses, campus, honors, thesis
- **projects**: name, role, period, link, tags, summary, achievements

### 隐藏字段 (UI 不渲染, 数据存)

- `profile.currentSalary` — 当前薪资 (敏感, 永久隐藏, 只能手写 JSON 才能填)
- `profile.timeline` — 预留字段, 编辑器可填但预览不渲染

> 注意: `expectJobs[0]` 的薪资/城市、`expectIndustry`、`wechat` 填写后**会**渲染在简历头部 (`header-extra` 标签行), 不是隐藏字段。2026-08 起 `expectSalary` / `expectCities` 独立字段已删除, 头部展示从 `expectJobs[0]` 派生 (项目开发期不做老数据迁移, 老 localStorage 请「重置默认」重填)。

### 模块类型选择策略

- `工作经历` vs `其它经历`: 同 schema 不同 label。其它经历用于与工作经历性质不同但字段相同的经历 (部队经历、临时兼职、项目承包等)。
- `其它经历` 与 `工作经历` 渲染完全一致，仅模块标题不同，便于 HR/平台区分经历性质。

## 编辑简历

### 在线编辑器

点击右上角 **☰** 按钮打开编辑器面板，支持：

- 编辑个人信息（姓名、岗位、电话、邮箱、GitHub、头像等），头像上传后存入浏览器本地，新头像自动覆盖旧头像
- 增删改查各模块内容（教育背景、工作经历、项目经验、专业技能等）
- 新增/删除/排序/折叠模块
  - 每个模块右上角有 `▾` / `↑` / `↓` / `×` 按钮：折叠 / 上移 / 下移 / 删除
  - 每个条目（如一段工作经历）右上角也有 `↑` / `↓` / `⧉` / `×` 按钮：上移 / 下移 / 复制 / 删除
- 调整页面偏好（主题配色、字号、字体）
- **实时联动**: 任意表单改动 → 50ms debounce → 重渲染预览, 不需要点保存
- **聚焦联动**: 表单 input 获得焦点时, 简历预览自动滚动并高亮对应字段

### 导入/导出数据

- **JSON** — 标准 JSON 格式简历数据
- **Markdown** — 解析结构化 Markdown 为简历数据

### URL 参数快速进入编辑

在 URL 后附加 `?edit=1` 打开页面时自动进入编辑模式。

## 跨项目数据交换

CV 项目与 [cv-autofill](https://github.com/takenroot/cv-autofill) 项目协作。字段命名以 CV 项目为 canonical 源。详见:

- [docs/SCHEMA_NAMING.md](docs/SCHEMA_NAMING.md) — CV 字段 ↔ 平台输入框 命名对照表 + 自动填充映射建议
- [docs/cv-schema.json](docs/cv-schema.json) — cv-autofill 超集 schema 的仓库内副本 (三平台字段并集, 含 x-platforms / x-tier / x-status 标注)

## 自定义样式

在 `site/styles.css` 的 `:root` 中可以修改：

- `--accent` — 强调色
- `--shadow` — 页面阴影
- `--radius` — 圆角大小
- `--font-family` — 字体组合
- 各 `--fs-*` 变量 — 字号层级
- 各 `--space-*` 变量 — 间距控制

## 部署

纯静态项目，可直接部署到：

- **GitHub Pages**
- **Vercel**
- **Netlify**
- **任意 Nginx / Caddy / Apache 静态目录**

部署时确保上传 `site/` 目录全部文件。头像默认保存在浏览器 localStorage 中，换浏览器/设备需重新上传；如需预置头像，可放 `site/assets/` 目录并在 `data.json` 中填写路径。项目已改用系统字体，无需额外上传字体文件。

## 技术支持

- 所有数据存储在浏览器 `localStorage` 中，刷新不丢失
- `data.json` 作为初始数据源；编辑后数据优先从 `localStorage` 读取
- 无 JavaScript 时仍可阅读基础简历内容（降级显示）
- 兼容 Chromium 系浏览器，基础适配移动端