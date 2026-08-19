/* ===========================================================
   CV 简历网页 — 模块配置表
   新增类型只需在 SECTION_CONFIG 加一项
   =========================================================== */
// ponytail: 抽出 experience 共享字段/渲染器/默认项, 让 experience 和 experience_other 都展它, 只换 label.
// 同字段同渲染逻辑, 单一数据源, 之后想加更多 alias (如 '其它教育') 加一行就行.
// 注意 defaultItem 引用是共享的 — getDefaultItem 走 JSON.parse(JSON.stringify(...)) 深拷, 每次调用都拿到新对象, 不会污染源.

// ponytail: education item-head 拼接抽到顶层, 跟 _EXP_SHARED 对称. isUnified 走 item-meta-tag 旁挂不进 h3,
// 避免 h3 串太长 ("河套学院 · 物联网工程 · 本科 (全日制) 统招" 拥挤).
// ponytail: 显隐走 prefs.eduHidden (视图层), degreeType/isUnified 可单独关, 数据与导出不动.
// 合并规则: 全日制 + 统招 → (全日制统招), 不再出独立统招标签; 非全/自考不合并 (必须显眼).
function buildEduHead(i) {
  const shown = typeof isEduShown === 'function' ? isEduShown : function () { return true; };
  const uni = isYes(i.isUnified), typeOn = shown('degreeType'), uniOn = shown('isUnified');
  const merged = !!(i.degree && i.degreeType === 'fulltime' && uni && typeOn && uniOn);
  let degree = i.degree ? esc(i.degree) : null;
  if (degree && i.degreeType && typeOn) degree += ' (' + esc(codeLabel('degreeType', i.degreeType)) + (merged ? '统招' : '') + ')';
  const headParts = [esc(i.school || ''), i.major ? esc(i.major) : null, degree].filter(Boolean);
  let html = '<div class="item-head"><div><h3>' + headParts.join(' · ') + '</h3>';
  const tags = []; if (uni && uniOn && !merged) tags.push('统招'); if (isYes(i.overseasEdu)) tags.push('海外留学');
  if (tags.length) html += '<div class="item-meta">' + tags.map(function (t) { return '<span class="item-meta-tag">' + t + '</span>'; }).join('') + '</div>';
  html += '</div><span class="item-time">' + esc(fmtDateRange(i.startDate, i.endDate)) + '</span></div>';
  return html;
}

const _EXP_SHARED = {
  fields: [
    { n: 'company', l: '公司' },
    { n: 'position', l: '职位' },
    { n: 'industry', l: '所属行业' },
    { n: 'department', l: '部门' },
    { n: 'startDate', l: '开始时间', p: '2022-01' },
    { n: 'endDate', l: '结束时间', p: '留空=至今' },
    { n: 'summary', l: '工作描述', t: 'textarea' },
    { n: 'highlights', l: '工作业绩 (每行一条)', t: 'textarea', a: true },
    { n: 'tags', l: '技能标签 (逗号分隔)', a: true, tok: true },
    { n: 'isIntern', l: '是否实习', t: 'select', options: ['是', '否'] }
  ],
  renderItem: function (i) {
    const a = cE('article', 'timeline-item');
    // ponytail: 公司/职位可空 (其它经历常见), 空段不拼, 不出裸「·」.
    const pos = esc(i.position) + (isYes(i.isIntern) ? '（实习）' : '');
    let html = '<div class="item-head"><div><h3>' + [i.company ? esc(i.company) : '', pos].filter(Boolean).join(' · ') + '</h3>';
    const tags = []; if (i.industry) tags.push(i.industry); if (i.department) tags.push(i.department);
    if (tags.length) html += '<div class="item-meta">' + tags.map(function (t) { return '<span class="item-meta-tag">' + esc(t) + '</span>'; }).join('') + '</div>';
    html += '</div><span class="item-time">' + esc(fmtDateRange(i.startDate, i.endDate)) + '</span></div>';
    if (i.summary) html += '<p class="summary">' + esc(i.summary) + '</p>';
    if (i.highlights && i.highlights.length) html += '<div class="item-section"><h4 class="item-section-label">工作业绩</h4><ul class="item-section-list">' + lis(i.highlights) + '</ul></div>';
    if (i.tags && i.tags.length) html += '<div class="item-section"><h4 class="item-section-label">技能标签</h4><ul class="tag-list">' + i.tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    a.innerHTML = html;
    return a;
  },
  mdItem: function (i) {
    const pos = (i.position || '') + (isYes(i.isIntern) ? '（实习）' : '');
    let md = '**' + fmtDateRange(i.startDate, i.endDate) + '** | ' + [i.company, pos].filter(Boolean).join(' | ');
    if (i.industry) md += ' | ' + i.industry;
    if (i.department) md += ' | ' + i.department;
    md += '\n\n' + (i.summary || '');
    if (i.highlights && i.highlights.length) md += '\n\n### 工作业绩\n' + mli(i.highlights);
    if (i.tags && i.tags.length) md += '\n\n### 技能标签\n' + i.tags.join('、');
    return md;
  },
  defaultItem: { isIntern: false }
};
// ponytail: 枚举存码 (schema v2) — 数据层存码, 展示层中文, 单一映射表. editor select 和 renderer 共用.
// language 的 select (语种/熟练程度) 刻意保留中文值 — 选项本身就是平台词汇表, 编码只增间接层无消费方.
const CODE_LABELS = {
  degreeType: { fulltime: '全日制', parttime: '非全日制', selftaught: '自考' },
  jobStatus: { available: '随时到岗', open: '在职-看机会', passive: '在职-暂不考虑', unavailable: '暂不找工作' }
};
function codeLabel(field, code) { return (CODE_LABELS[field] || {})[code] || code || ''; }

// ponytail: profile 字段单一数据源 — buildProfileFields 渲染 / collectFormData 收集 / validateSchema 校验三方共用.
// f.a=true: lines-array (textarea 每行一条 → string[]). 未在此声明的 profile.* 输入一律不进数据 (白名单).
const PROFILE_FIELDS = [
  { n: 'avatar', custom: true },
  { n: 'name', l: '姓名' }, { n: 'title', l: '岗位' }, { n: 'workYears', l: '工作经验' },
  { n: 'firstWorkDate', l: '首次参加工作时间', t: 'date' },
  { n: 'jobStatus', l: '求职状态', t: 'select', options: ['available', 'open', 'passive', 'unavailable'] },
  { n: 'nativePlace', l: '籍贯' }, { n: 'gender', l: '性别' }, { n: 'birthDate', l: '出生日期', t: 'date' },
  { n: 'phone', l: '电话' }, { n: 'email', l: '邮箱' }, { n: 'github', l: 'GitHub' }, { n: 'wechat', l: '微信号' },
  { n: 'expectIndustry', l: '期望行业' }
];

// ponytail: 复合字段声明表 — input name 用 "复合名.后缀" (不带 profile. 前缀, 通用循环不碰).
// 每条 [input 后缀, 类型?, 目标路径?]: 类型 'n'=number / 'lines'=每行一条数组; 目标路径默认=后缀, 可写 'salary.low' 嵌套.
// 全空收集返回 undefined (调用端 delete). expectJobs 是单对象 (v2 去掉了 v1 的 wrap1 数组包装). 加新复合字段 = 这里加一行.
const PROFILE_COMPOSITES = {
  expectJobs: { fields: [['title'], ['jobType'], ['cities', 'lines'], ['salaryLow', 'n', 'salary.low'], ['salaryHigh', 'n', 'salary.high']] }
};

const SECTION_CONFIG = {
  experience: { label: '工作经历', ..._EXP_SHARED },
  experience_other: { label: '其它经历', ..._EXP_SHARED },
  education: { label: '教育背景', fields: [{ n: 'school', l: '学校' }, { n: 'major', l: '专业' }, { n: 'degree', l: '学历' }, { n: 'degreeType', l: '学制', t: 'select', options: ['fulltime', 'parttime', 'selftaught'] }, { n: 'isUnified', l: '是否统招', t: 'select', options: ['是', '否'] }, { n: 'overseasEdu', l: '海外留学经历', t: 'select', options: ['是', '否'] }, { n: 'startDate', l: '开始时间', p: '2022-01' }, { n: 'endDate', l: '结束时间', p: '留空=至今' }, { n: 'courses', l: '主修课程 (每行一条)', t: 'textarea', a: true, tok: true }, { n: 'campus', l: '校园经历 (每行一条)', t: 'textarea', a: true }, { n: 'highlights', l: '荣誉奖项 (每行一条)', t: 'textarea', a: true }, { n: 'thesis', l: '毕设/论文', t: 'textarea' }],
    // ponytail: head 拼接抽到 buildEduHead (string), isUnified 走 item-meta 旁挂不进 h3, 避免 h3 串太长.
    renderItem: function (i) {
      const a = cE('article', 'timeline-item');
      let html = buildEduHead(i);
      if (i.courses && i.courses.length) html += '<div class="item-section"><h4 class="item-section-label">主修课程</h4><p class="item-section-content">' + esc(i.courses.join('、')) + '</p></div>';
      if (i.campus && i.campus.length) html += '<div class="item-section"><h4 class="item-section-label">校园经历</h4><ul class="item-section-list">' + lis(i.campus) + '</ul></div>';
      if (i.highlights && i.highlights.length) html += '<div class="item-section"><h4 class="item-section-label">荣誉奖项</h4><ul class="item-section-list">' + lis(i.highlights) + '</ul></div>';
      if (i.thesis) html += '<div class="item-section"><h4 class="item-section-label">毕设/论文</h4><p class="item-section-content">' + esc(i.thesis) + '</p></div>';
      a.innerHTML = html;
      return a;
    },
    mdItem: function (i) {
      // ponytail: 跟 renderItem 顺序对齐. school / major / degree(+Type) / 统招 用 | 隔.
      let md = '**' + fmtDateRange(i.startDate, i.endDate) + '** | ' + (i.school || '');
      if (i.major) md += ' | ' + i.major;
      if (i.degree) md += ' | ' + i.degree + (i.degreeType ? ' (' + codeLabel('degreeType', i.degreeType) + ')' : '');
      if (isYes(i.isUnified)) md += ' | 统招';
      if (isYes(i.overseasEdu)) md += ' | 海外留学';
      if (i.courses && i.courses.length) md += '\n\n### 主修课程\n' + i.courses.join('、');
      if (i.campus && i.campus.length) md += '\n\n### 校园经历\n' + mli(i.campus);
      if (i.highlights && i.highlights.length) md += '\n\n### 荣誉奖项\n' + mli(i.highlights);
      if (i.thesis) md += '\n\n### 毕设/论文\n' + i.thesis;
      return md;
    },
    defaultItem: { isUnified: true, overseasEdu: false }
  },
  projects: { label: '项目经验', fields: [{ n: 'name', l: '项目名' }, { n: 'role', l: '担任角色' }, { n: 'startDate', l: '开始时间', p: '2022-01' }, { n: 'endDate', l: '结束时间', p: '留空=至今' }, { n: 'link', l: '项目链接' }, { n: 'tags', l: '技术栈 (逗号分隔)', a: true, tok: true }, { n: 'summary', l: '项目描述', t: 'textarea' }, { n: 'highlights', l: '项目业绩 (每行一条)', t: 'textarea', a: true }],
    renderItem: function (i) { const tags = arr(i.tags), th = tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); const a = cE('article', 'timeline-item'); let html = '<div class="item-head"><div><h3>' + esc(i.name) + (i.role ? ' · ' + esc(i.role) : '') + '</h3><ul class="tag-list item-subtitle">' + th + '</ul></div><span class="item-time">' + esc(fmtDateRange(i.startDate, i.endDate)) + '</span></div>'; if (i.summary) html += '<p class="summary">' + esc(i.summary) + '</p>';
      // ponytail: 验证 i.link 是 http(s) 协议, 防 javascript:/data: 等 XSS. esc() 不防 URL 协议层攻击.
      if (i.link) {
        let safeHref = null; try { const u = new URL(i.link.startsWith('http') ? i.link : 'https://' + i.link); if (/^https?:$/.test(u.protocol)) safeHref = u.href; } catch (e) {}
        if (safeHref) html += '<p class="project-link"><a href="' + esc(safeHref) + '" target="_blank" rel="noopener noreferrer">' + esc(i.link) + ' ↗</a></p>';
      }
      if (i.highlights && i.highlights.length) html += '<div class="item-section"><h4 class="item-section-label">项目业绩</h4><ul class="item-section-list">' + lis(i.highlights) + '</ul></div>'; a.innerHTML = html; return a; },
    mdItem: function (i) { const tg = Array.isArray(i.tags) ? i.tags.join('、') : (i.tags || ''); let md = '**' + fmtDateRange(i.startDate, i.endDate) + '** | ' + (i.name || '') + (i.role ? ' | ' + i.role : '') + (tg ? ' | ' + tg : ''); if (i.link) md += ' | ' + i.link; md += '\n' + (i.summary || ''); if (i.highlights && i.highlights.length) md += '\n\n### 项目业绩\n' + mli(i.highlights); return md; },
    defaultItem: {}
  },
  skills: { label: '专业技能', fields: [{ n: 'name', l: '技能名' }, { n: 'detail', l: '详情', t: 'textarea' }], containerClass: 'skills-grid',
    renderItem: function (i) { const a = cE('article', 'skill-item'); a.innerHTML = '<span class="skill-name">' + esc(i.name) + '</span><span class="skill-detail">' + esc(i.detail) + '</span>'; return a; },
    mdPrefix: '| 类别 | 详情 |\n| --- | --- |', mdItem: function (i) { return '| **' + (i.name || '') + '** | ' + (i.detail || '') + ' |'; },
    defaultItem: { name: '', detail: '' }
  },
  // ponytail: language 字段数据来源见 cv-autofill/schema/cv-superset.schema.json languageItem. 命名分歧:猎聘=语言+熟练程度+等级, 智联=语种+听说+读写. CV 超集取并集, 用户按需填.
  language: { label: '语言能力', fields: [{ n: 'name', l: '语种', t: 'select', options: ['英语', '汉语', '日语', '法语', '德语', '俄语', '韩语', '西班牙语', '其他'] }, { n: 'proficiency', l: '熟练程度', t: 'select', options: ['一般', '良好', '熟练', '精通'] }, { n: 'level', l: '等级 (如 CET-6)' }, { n: 'readingWriting', l: '读写 (智联拆分)', t: 'select', options: ['一般', '良好', '熟练', '精通'] }],
    renderItem: function (i) {
      const a = cE('article', 'timeline-item');
      const tags = [i.proficiency && '听/说: ' + esc(i.proficiency), i.readingWriting && '读/写: ' + esc(i.readingWriting)].filter(Boolean);
      let html = '<div class="item-head"><div><h3>' + esc(i.name || '') + (i.level ? ' <span class="item-meta-tag">' + esc(i.level) + '</span>' : '') + '</h3>';
      if (tags.length) html += '<div class="item-meta">' + tags.map(function (t) { return '<span class="item-meta-tag">' + t + '</span>'; }).join('') + '</div>';
      html += '</div></div>';
      a.innerHTML = html;
      return a;
    },
    mdItem: function (i) {
      let md = '**' + (i.name || '') + '**';
      if (i.level) md += ' | ' + i.level;
      if (i.proficiency) md += ' | 听说: ' + i.proficiency;
      if (i.readingWriting) md += ' | 读写: ' + i.readingWriting;
      return md;
    },
    defaultItem: { name: '', proficiency: '', level: '', readingWriting: '' }
  },
  summary: { label: '自我评价', fields: [], contentField: 'items', isArrayContent: true,
    renderContent: function (items) { if (!items || items.length === 0) return; const ul = cE('ul'); items.forEach(function (t) { const li = cE('li'); li.textContent = t; ul.appendChild(li); }); return ul; },
    mdBlock: function (items) { return (items || []).map(function (t) { return '- ' + t; }).join('\n'); },
    editorContent: function (items) { return '<div class="editor-field"><label>评价内容 (每行一条)</label><textarea name="sectionSummary.{idx}" rows="5">' + esc(items.join('\n')) + '</textarea></div>'; },
    defaultSection: function () { return { type: 'summary', title: SECTION_CONFIG.summary.label, items: [''] }; }
  },
  timeline: { label: '时间轴', fields: [{ n: 'startDate', l: '开始时间', p: '2022-01' }, { n: 'endDate', l: '结束时间', p: '留空=至今' }, { n: 'heading', l: '标题' }, { n: 'tag', l: '标签 (工作/教育/军旅等)' }, { n: 'summary', l: '描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    containerClass: 'timeline-wrapper',
    renderItem: function (i) { const a = cE('article', 'timeline-entry'); a.innerHTML = '<span class="timeline-period">' + esc(fmtDateRange(i.startDate, i.endDate)) + '</span><div class="timeline-body"><div class="timeline-heading">' + esc(i.heading) + (i.tag ? ' <span class="timeline-tag">' + esc(i.tag) + '</span>' : '') + '</div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul></div>'; return a; },
    mdItem: function (i) { return '**' + fmtDateRange(i.startDate, i.endDate) + '** | ' + (i.heading || '') + (i.tag ? ' **' + i.tag + '**' : '') + '\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: {}
  },
  text: { label: '自由文本', fields: [], contentField: 'content',
    renderContent: function (c) { if (!c) return; const p = cE('p', 'summary'); p.textContent = c; return p; },
    mdBlock: function (c) { return c || ''; },
    editorContent: function (c) { return '<div class="editor-field"><label>内容</label><textarea name="sectionText.{idx}" rows="6">' + esc(c) + '</textarea></div>'; },
    defaultSection: function () { return { type: 'text', title: SECTION_CONFIG.text.label, content: '' }; }
  },
  certificate: { label: '证书', fields: [{ n: 'name', l: '证书名称' }, { n: 'issuer', l: '颁发机构' }, { n: 'date', l: '获得时间', p: '2022-01' }, { n: 'serial', l: '证书编号' }, { n: 'url', l: '验证链接' }],
    renderItem: function (i) {
      const a = cE('article', 'timeline-item');
      const serialHtml = i.serial ? '<span class="cert-serial">编号：' + esc(i.serial) + '</span>' : '';
      const urlHtml = i.url ? '<a href="' + esc(i.url) + '" target="_blank" rel="noopener" class="cert-url">验证链接 ↗</a>' : '';
      a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.name) + '</h3><p class="item-subtitle">' + esc(i.issuer) + '</p></div><span class="item-time">' + esc(fmtDate(i.date)) + '</span></div>' + (serialHtml || urlHtml ? '<div class="cert-meta">' + serialHtml + urlHtml + '</div>' : '');
      return a;
    },
    mdItem: function (i) { return '**' + fmtDate(i.date) + '** | ' + (i.name || '') + (i.issuer ? ' | ' + i.issuer : '') + (i.serial ? ' | 编号：' + i.serial : ''); },
    defaultItem: {}
  }
};
