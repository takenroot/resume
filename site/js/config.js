/* ===========================================================
   CV 简历网页 — 模块配置表
   新增类型只需在 SECTION_CONFIG 加一项
   =========================================================== */
// ponytail: 抽出 experience 共享字段/渲染器/默认项, 让 experience 和 experience_other 都展它, 只换 label.
// 同字段同渲染逻辑, 单一数据源, 之后想加更多 alias (如 '其它教育') 加一行就行.
// 注意 defaultItem 引用是共享的 — getDefaultItem 走 JSON.parse(JSON.stringify(...)) 深拷, 每次调用都拿到新对象, 不会污染源.
const _EXP_SHARED = {
  fields: [
    { n: 'company', l: '公司' },
    { n: 'position', l: '职位' },
    { n: 'industry', l: '所属行业' },
    { n: 'department', l: '部门' },
    { n: 'period', l: '时间' },
    { n: 'summary', l: '工作描述', t: 'textarea' },
    { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true },
    { n: 'achievements', l: '工作业绩 (每行一条)', t: 'textarea', a: true },
    { n: 'skillTags', l: '技能标签 (逗号分隔)', t: 'textarea', a: true },
    { n: 'isIntern', l: '实习经历', t: 'checkbox' }
  ],
  renderItem: function (i) {
    const a = cE('article', 'timeline-item');
    let html = '<div class="item-head"><div><h3>' + esc(i.company) + ' · ' + esc(i.position) + '</h3>';
    if (i.industry || i.department) {
      html += '<div class="item-meta">';
      if (i.industry) html += '<span class="item-meta-tag">' + esc(i.industry) + '</span>';
      if (i.department) html += '<span class="item-meta-tag">' + esc(i.department) + '</span>';
      html += '</div>';
    }
    html += '</div><span class="item-time">' + esc(i.period) + '</span></div>';
    if (i.summary) html += '<p class="summary">' + esc(i.summary) + '</p>';
    if (i.highlights && i.highlights.length) html += '<div class="item-section"><h4 class="item-section-label">亮点</h4><ul class="item-section-list">' + lis(i.highlights) + '</ul></div>';
    if (i.achievements && i.achievements.length) html += '<div class="item-section"><h4 class="item-section-label">工作业绩</h4><ul class="item-section-list">' + lis(i.achievements) + '</ul></div>';
    if (i.skillTags && i.skillTags.length) html += '<div class="item-section"><h4 class="item-section-label">技能标签</h4><ul class="tag-list">' + i.skillTags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    a.innerHTML = html;
    return a;
  },
  mdItem: function (i) {
    let md = '**' + (i.period || '') + '** | ' + (i.company || '') + ' | ' + (i.position || '');
    if (i.industry) md += ' | ' + i.industry;
    if (i.department) md += ' | ' + i.department;
    md += '\n\n' + (i.summary || '');
    if (i.highlights && i.highlights.length) md += '\n\n### 亮点\n' + mli(i.highlights);
    if (i.achievements && i.achievements.length) md += '\n\n### 工作业绩\n' + mli(i.achievements);
    if (i.skillTags && i.skillTags.length) md += '\n\n### 技能标签\n' + i.skillTags.join('、');
    return md;
  },
  defaultItem: { company: '', position: '', period: '', summary: '', highlights: [], achievements: [], skillTags: [], industry: '', department: '', isIntern: false }
};
const SECTION_CONFIG = {
  experience: { label: '工作经历', ..._EXP_SHARED },
  experience_other: { label: '其它经历', ..._EXP_SHARED },
  education: { label: '教育背景', fields: [{ n: 'school', l: '学校' }, { n: 'major', l: '专业' }, { n: 'degree', l: '学历' }, { n: 'degreeType', l: '学制', t: 'select', options: ['全日制', '非全日制', '自考'] }, { n: 'isUnified', l: '是否统招', t: 'checkbox' }, { n: 'period', l: '时间' }, { n: 'courses', l: '主修课程' }, { n: 'campus', l: '校园经历 (每行一条)', t: 'textarea' }, { n: 'experience', l: '在校经历 (每行一条)', t: 'textarea', a: true }, { n: 'thesis', l: '毕设/论文', t: 'textarea' }],
    renderItem: function (i) { const a = cE('article', 'timeline-item'); let html = '<div class="item-head"><div><h3>' + esc(i.school) + (i.major ? ' · ' + esc(i.major) : '') + (i.degree ? ' · ' + esc(i.degree) + (i.degreeType ? ' (' + esc(i.degreeType) + ')' : '') : '') + (i.isUnified ? ' <span class="item-meta-tag">统招</span>' : '') + '</h3></div><span class="item-time">' + esc(i.period) + '</span></div>'; if (i.courses) html += '<div class="item-section"><h4 class="item-section-label">主修课程</h4><p class="item-section-content">' + esc(i.courses) + '</p></div>'; if (i.campus) { const lines = (i.campus || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (lines.length > 0) html += '<div class="item-section"><h4 class="item-section-label">校园经历</h4><ul class="item-section-list">' + lines.map(function (l) { return '<li>' + esc(l) + '</li>'; }).join('') + '</ul></div>'; } if (i.experience && i.experience.length) html += '<div class="item-section"><h4 class="item-section-label">在校经历</h4><ul class="item-section-list">' + lis(i.experience) + '</ul></div>'; if (i.thesis) html += '<div class="item-section"><h4 class="item-section-label">毕设/论文</h4><p class="item-section-content">' + esc(i.thesis) + '</p></div>'; a.innerHTML = html; return a; },
    mdItem: function (i) { let md = '**' + (i.period || '') + '** | ' + (i.school || '') + (i.major ? ' | ' + i.major : '') + (i.degree ? ' | ' + i.degree + (i.degreeType ? ' (' + i.degreeType + ')' : '') : '') + (i.isUnified ? ' | 统招' : ''); if (i.courses) md += '\n\n### 主修课程\n' + i.courses; if (i.campus) { const lines = (i.campus || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (lines.length > 0) md += '\n\n### 校园经历\n' + lines.map(function (l) { return '- ' + l; }).join('\n'); } if (i.experience && i.experience.length) md += '\n\n### 在校经历\n' + mli(i.experience); if (i.thesis) md += '\n\n### 毕设/论文\n' + i.thesis; return md; },
    defaultItem: { school: '', major: '', degree: '', degreeType: '', isUnified: false, period: '', courses: '', campus: '', experience: [], thesis: '' }
  },
  projects: { label: '项目经验', fields: [{ n: 'name', l: '项目名' }, { n: 'role', l: '担任角色' }, { n: 'period', l: '时间' }, { n: 'link', l: '项目链接' }, { n: 'tags', l: '技术栈 (逗号分隔)', t: 'textarea', a: true }, { n: 'summary', l: '项目描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }, { n: 'achievements', l: '项目业绩 (每行一条)', t: 'textarea', a: true }],
    renderItem: function (i) { const tags = arr(i.tags), th = tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); const a = cE('article', 'timeline-item'); let html = '<div class="item-head"><div><h3>' + esc(i.name) + (i.role ? ' <span class="item-meta-tag">' + esc(i.role) + '</span>' : '') + '</h3><ul class="tag-list item-subtitle">' + th + '</ul></div><span class="item-time">' + esc(i.period) + '</span></div>'; if (i.summary) html += '<p class="summary">' + esc(i.summary) + '</p>'; if (i.link) html += '<p class="project-link"><a href="' + esc(i.link.startsWith('http') ? i.link : 'https://' + i.link) + '" target="_blank" rel="noopener noreferrer">' + esc(i.link) + ' ↗</a></p>'; if (i.highlights && i.highlights.length) html += '<div class="item-section"><h4 class="item-section-label">亮点</h4><ul class="item-section-list">' + lis(i.highlights) + '</ul></div>'; if (i.achievements && i.achievements.length) html += '<div class="item-section"><h4 class="item-section-label">项目业绩</h4><ul class="item-section-list">' + lis(i.achievements) + '</ul></div>'; a.innerHTML = html; return a; },
    mdItem: function (i) { const tg = Array.isArray(i.tags) ? i.tags.join('、') : (i.tags || ''); let md = '**' + (i.period || '') + '** | ' + (i.name || '') + (i.role ? ' | ' + i.role : '') + (tg ? ' | ' + tg : ''); if (i.link) md += ' | ' + i.link; md += '\n' + (i.summary || ''); if (i.highlights && i.highlights.length) md += '\n\n### 亮点\n' + mli(i.highlights); if (i.achievements && i.achievements.length) md += '\n\n### 项目业绩\n' + mli(i.achievements); return md; },
    defaultItem: { name: '', role: '', period: '', link: '', tags: [], summary: '', highlights: [], achievements: [] }
  },
  skills: { label: '专业技能', fields: [{ n: 'name', l: '技能名' }, { n: 'detail', l: '详情', t: 'textarea' }], containerClass: 'skills-grid',
    renderItem: function (i) { const a = cE('article', 'skill-item'); a.innerHTML = '<span class="skill-name">' + esc(i.name) + '</span><span class="skill-detail">' + esc(i.detail) + '</span>'; return a; },
    mdPrefix: '| 类别 | 详情 |\n| --- | --- |', mdItem: function (i) { return '| **' + (i.name || '') + '** | ' + (i.detail || '') + ' |'; },
    defaultItem: { name: '', detail: '' }
  },
  summary: { label: '自我评价', fields: [], contentField: 'items', isArrayContent: true,
    renderContent: function (items) { if (!items || items.length === 0) return; const ul = cE('ul'); items.forEach(function (t) { const li = cE('li'); li.textContent = t; ul.appendChild(li); }); return ul; },
    mdBlock: function (items) { return (items || []).map(function (t) { return '- ' + t; }).join('\n'); },
    editorContent: function (items) { return '<div class="editor-field"><label>评价内容 (每行一条)</label><textarea name="sectionSummary.{idx}" rows="5">' + esc(items.join('\n')) + '</textarea></div>'; },
    defaultSection: function () { return { type: 'summary', title: SECTION_CONFIG.summary.label, items: [''] }; }
  },
  timeline: { label: '时间轴', fields: [{ n: 'period', l: '时间' }, { n: 'heading', l: '标题' }, { n: 'tag', l: '标签 (工作/教育/军旅等)' }, { n: 'summary', l: '描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    containerClass: 'timeline-wrapper',
    renderItem: function (i) { const a = cE('article', 'timeline-entry'); a.innerHTML = '<span class="timeline-period">' + esc(i.period) + '</span><div class="timeline-body"><div class="timeline-heading">' + esc(i.heading) + (i.tag ? ' <span class="timeline-tag">' + esc(i.tag) + '</span>' : '') + '</div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul></div>'; return a; },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.heading || '') + (i.tag ? ' **' + i.tag + '**' : '') + '\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: { period: '', heading: '', tag: '', summary: '', highlights: [] }
  },
  text: { label: '自由文本', fields: [], contentField: 'content',
    renderContent: function (c) { if (!c) return; const p = cE('p', 'summary'); p.textContent = c; return p; },
    mdBlock: function (c) { return c || ''; },
    editorContent: function (c) { return '<div class="editor-field"><label>内容</label><textarea name="sectionText.{idx}" rows="6">' + esc(c) + '</textarea></div>'; },
    defaultSection: function () { return { type: 'text', title: SECTION_CONFIG.text.label, content: '' }; }
  },
  certificate: { label: '证书', fields: [{ n: 'name', l: '证书名称' }, { n: 'issuer', l: '颁发机构' }, { n: 'period', l: '获得时间' }, { n: 'serial', l: '证书编号' }, { n: 'url', l: '验证链接' }],
    renderItem: function (i) {
      const a = cE('article', 'timeline-item');
      const serialHtml = i.serial ? '<span class="cert-serial">编号：' + esc(i.serial) + '</span>' : '';
      const urlHtml = i.url ? '<a href="' + esc(i.url) + '" target="_blank" rel="noopener" class="cert-url">验证链接 ↗</a>' : '';
      a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.name) + '</h3><p class="item-subtitle">' + esc(i.issuer) + '</p></div><span class="item-time">' + esc(i.period) + '</span></div>' + (serialHtml || urlHtml ? '<div class="cert-meta">' + serialHtml + urlHtml + '</div>' : '');
      return a;
    },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.name || '') + (i.issuer ? ' | ' + i.issuer : '') + (i.serial ? ' | 编号：' + i.serial : ''); },
    defaultItem: { name: '', issuer: '', period: '', serial: '', url: '' }
  }
};
const SECTION_TYPES = Object.keys(SECTION_CONFIG);
