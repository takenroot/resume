# CV 静态简历网页

一个使用原生 `HTML/CSS/JS` 实现的静态简历网页项目，采用 **A4 纸张视觉布局**，支持**在线编辑、数据驱动渲染、自动分页、PDF 导出**。

## 项目特点

- **数据驱动渲染** — 简历内容由 `data.json` 管理，修改数据即可更新页面
- **内置编辑器** — 页面内直接编辑简历所有模块，所见即所得
- **多种导入/导出** — 支持 **JSON** 和 **Markdown** 格式的导入与导出
- **自动分页** — 内容超出单页时自动拆分，条目内可按业绩条目（bullet）断页，跨页条目带「(续)」标记，多页显示页码
- **PDF/PNG 导出** — PNG 截图导出（图片，文字不可搜索）+ 浏览器打印 PDF（文字可搜索/可复制）
- **招聘平台智能解析友好** — 系统字体 + 打印字号锁定 + OCR 友好排版；已验证支持 **Boss 直聘** 和 **智联招聘** 智能解析（需 PDF 中的姓名、联系方式等个人信息与本人一致）
- **本地存储** — 编辑内容自动保存到浏览器 `localStorage`
- **数据安全** — 导入/重置前自动备份 + 每 5 分钟快照到 `cv_backup` 槽位，编辑器底部「恢复备份」一键找回；导入前走 schema 校验拦截坏数据
- **编辑器实时联动** — 任意表单改动触发 50ms debounce 重渲染预览，不需要点保存
- **头部版式自定义** — 个人信息 ⚙ 弹窗：版式预设（分层胶囊 / 纯文本居中）+ 字段显隐 + 细节开关（姓名对齐/胶囊密度/分隔线/图标）；头部两层 = 必备行（icon+值：职位/电话/意向城市/经验）+ 胶囊层（其余可选字段，自动装箱排版：长胶囊独占行、长短搭配凑行）。样式全存 `cv_prefs` (localStorage)，不进简历数据、不影响导出
- **头像上传** — 上传后自动转为 base64 存入浏览器 localStorage，按姓名绑定；导出 JSON/Markdown 时不含头像，减轻文件体积。点编辑器里的头像预览可打开裁剪弹窗：形状（圆角/圆形/直角，按形状分档阴影）+ 拖拽调位置、滑块缩放、选框高（证件照 5:7 / 方形 1:1 快捷比例，1:1 形状自动锁方框），裁剪参数存 `cv_prefs` 不进数据
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
│   │   ├── prefs.js                # 页面偏好 (theme / fontSize / fontFamily / 头部样式开关)
│   │   ├── renderer.js             # 渲染引擎
│   │   ├── utils.js                # 工具函数
│   │   └── zoom.js                 # 缩放控制
│   ├── fields.json                 # 字段全集 (vendor 自 cv-autofill, 只读, 整体替换升级)
│   └── assets/                     # 用户上传的资源文件（头像现优先存浏览器 localStorage）
├── docs/
│   ├── SCHEMA_NAMING.md            # CV 字段 ↔ 平台输入框 命名对照表
│   └── REFACTOR_PLAN.md            # 重构路线图 (已执行部分标 ✅)
├── template/                       # 简历版式研究 (5 种版式 + 头部变体, 选型见 README)
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

`start.sh` 默认从 **8765** 端口起探测，自动避开主流软件常用端口（web 开发 3000/5000/5173/8000/8080、数据库 3306/5432/6379/27017、消息队列 5672/15672/9092、监控 9090/9100、容器 2375/2376、Windows Hyper-V 保留区间 8000-8099 等）。被占用则顺延 200 个端口。也可通过 `PORT=xxxx ./start.sh` 显式指定。所有响应带 `Cache-Control: no-store`（UI 迭代禁浏览器缓存，改完刷新即生效）。

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

> **时间字段约定**：数据存 `startDate` / `endDate`（`YYYY-MM` 月精度，endDate 省略=至今），证书用单个 `date`。渲染仍显示 `2022.01 - 至今` 格式，便于招聘平台（智联、Boss直聘）智能解析。详见 [docs/SCHEMA_V2.md](docs/SCHEMA_V2.md)。

## 字段详细说明

### profile (个人信息)

| 字段 | 类型 | UI |
|------|------|----|
| `name` | string | text |
| `title` | string | text |
| `workYears` | string | text (工作年限如 "5年") |
| `jobStatus` | string (码: available/open/passive/unavailable) | select 4 选项 (求职状态, 显示中文) |
| `nativePlace` | string | text (籍贯) |
| `gender` | string | text (表单保留, 预览不渲染) |
| `birthDate` | string (YYYY-MM-DD) | date |
| `phone` / `email` / `github` | string | text/email/url |
| `wechat` | string | text |
| `expectIndustry` | string | text |
| `avatar` | base64 | file (存 localStorage, 导出 JSON 不含) |
| `expectJobs` | `{title, jobType, salary:{low,high}, cities[]}` 单对象 | 复合表单: 职位名 + 工作性质 select + 薪资两框 + 城市 textarea (填写后薪资/城市渲染在头部标签行) |
| `firstWorkDate` | string (YYYY-MM-DD) | date (首次参加工作时间, 预览不渲染) |
| `currentSalary` | `{salary, months, secret}` | 隐藏字段, 见下方说明 |

### 其它 section item 字段

- **experience / experience_other**: company, position, industry, department, startDate, endDate, summary, highlights, tags, isIntern
- **education**: school, major, degree, degreeType (码: fulltime/parttime/selftaught), isUnified, overseasEdu, startDate, endDate, courses, campus, highlights, thesis
- **projects**: name, role, startDate, endDate, link, tags, summary, highlights

### 隐藏字段 (UI 不渲染, 数据存)

- `profile.currentSalary` — 当前薪资 (敏感, 永久隐藏, 只能手写 JSON 才能填)

> 注意: `expectJobs` 的薪资/城市、`expectIndustry`、`wechat` 填写后**会**渲染在简历头部 (意向城市在必备行, 其余在胶囊层), 不是隐藏字段。2026-08-19 schema v2: `experience→workYears`、`location→nativePlace`、expectJobs 去数组包装、枚举存码、period 拆 startDate/endDate，老数据 load/import 时自动迁移 (见 docs/SCHEMA_V2.md)。空值一律省略（`""`/`[]` 不落数据）。

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

CV 项目与 [cv-autofill](https://github.com/takenroot/cv-autofill) 项目协作。仲裁规则: 字段存不存在 / 英文 key 叫什么 → 以 [site/fields.json](site/fields.json) 为准 (vendor 自 cv-autofill, 只读, 只能整体替换升级); 中文 label / 渲不渲染 → CV 自己定。分歧由 `node test/fields-sync.mjs` 当场抓住。详见:

- [docs/SCHEMA_NAMING.md](docs/SCHEMA_NAMING.md) — CV 字段 ↔ 平台输入框 命名对照表 + 自动填充映射建议

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