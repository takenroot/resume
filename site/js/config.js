/* ===========================================================
   CV 简历网页 — 模块配置表
   新增类型只需在 SECTION_CONFIG 加一项
   =========================================================== */
const SECTION_CONFIG = {
  experience: { label: '工作经历', fields: [{ n: 'company', l: '公司' }, { n: 'position', l: '职位' }, { n: 'period', l: '时间' }, { n: 'summary', l: '工作描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    renderItem: function (i) { const a = cE('article', 'timeline-item'); a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.company) + ' · ' + esc(i.position) + '</h3></div><span class="item-time">' + esc(i.period) + '</span></div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul>'; return a; },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.company || '') + ' | ' + (i.position || '') + '\n\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: { company: '', position: '', period: '', summary: '', highlights: [] }
  },
  education: { label: '教育背景', fields: [{ n: 'school', l: '学校' }, { n: 'major', l: '专业' }, { n: 'degree', l: '学历' }, { n: 'period', l: '时间' }, { n: 'courses', l: '主修课程' }],
    renderItem: function (i) { const a = cE('article', 'timeline-item'); a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.school) + (i.major ? ' · ' + esc(i.major) : '') + (i.degree ? ' · ' + esc(i.degree) : '') + '</h3><p class="item-subtitle">' + esc(i.courses) + '</p></div><span class="item-time">' + esc(i.period) + '</span></div>'; return a; },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.school || '') + (i.major ? ' | ' + i.major : '') + (i.degree ? ' | ' + i.degree : '') + '\n' + (i.courses ? '- 主修课程：' + i.courses : ''); },
    defaultItem: { school: '', major: '', degree: '', period: '', courses: '' }
  },
  projects: { label: '项目经验', fields: [{ n: 'name', l: '项目名' }, { n: 'period', l: '时间' }, { n: 'tags', l: '技术栈 (逗号分隔)', t: 'textarea', a: true }, { n: 'summary', l: '项目描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    renderItem: function (i) { const tags = arr(i.tags), th = tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); const a = cE('article', 'timeline-item'); a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.name) + '</h3><ul class="tag-list item-subtitle">' + th + '</ul></div></div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul>'; return a; },
    mdItem: function (i) { const tg = Array.isArray(i.tags) ? i.tags.join('、') : (i.tags || ''); return '**' + (i.period || '') + '** | ' + (i.name || '') + (tg ? ' | ' + tg : '') + '\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: { name: '', period: '', tags: [], summary: '', highlights: [] }
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
  }
};
const SECTION_TYPES = Object.keys(SECTION_CONFIG);
