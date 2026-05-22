/* ===========================================================
   CV 简历网页 — 主脚本
   模块配置表在顶部 SECTION_CONFIG，新增类型只需加一项
   =========================================================== */

var STORAGE_KEY = 'cv_data', DEFAULT_JSON = './data.json';
var MIN_SCALE = 1, MAX_SCALE = 1.3, STEP = 0.1, DEFAULT_SCALE = 1;
var MOBILE_BREAKPOINT = 767, TABLET_BREAKPOINT = 1024, PAGINATION_OVERFLOW_TOLERANCE = 0;
var currentScale = DEFAULT_SCALE, currentLayoutMode = 'desktop', cvData = null;

/* ===========================================================
   内核：模块配置表
   - label: 编辑器/页面默认标题
   - fields: 条目字段 [{ n: 字段名, l: 标签, t: textarea|undefined, a: isArray }]
   - renderItem(item): 返回 DOM 元素
   - mdItem(item): 返回 MD 行字符串
   - containerClass: 列表容器的额外 CSS class
   - contentField / renderContent / mdBlock / editorContent: 非 items 类型使用
   - defaultItem / defaultSection: 新建默认值
   =========================================================== */
var SECTION_CONFIG = {
  experience: { label: '工作经历', fields: [{ n: 'company', l: '公司' }, { n: 'position', l: '职位' }, { n: 'period', l: '时间' }, { n: 'summary', l: '工作描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    renderItem: function (i) { var a = cE('article', 'timeline-item'); a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.company) + ' · ' + esc(i.position) + '</h3></div><span class="item-time">' + esc(i.period) + '</span></div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul>'; return a; },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.company || '') + ' | ' + (i.position || '') + '\n\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: { company: '', position: '', period: '', summary: '', highlights: [] }
  },
  education: { label: '教育背景', fields: [{ n: 'school', l: '学校' }, { n: 'major', l: '专业' }, { n: 'degree', l: '学历' }, { n: 'period', l: '时间' }, { n: 'courses', l: '主修课程' }],
    renderItem: function (i) { var a = cE('article', 'timeline-item'); a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.school) + (i.major ? ' · ' + esc(i.major) : '') + (i.degree ? ' · ' + esc(i.degree) : '') + '</h3><p class="item-subtitle">' + esc(i.courses) + '</p></div><span class="item-time">' + esc(i.period) + '</span></div>'; return a; },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.school || '') + (i.major ? ' | ' + i.major : '') + (i.degree ? ' | ' + i.degree : '') + '\n' + (i.courses ? '- 主修课程：' + i.courses : ''); },
    defaultItem: { school: '', major: '', degree: '', period: '', courses: '' }
  },
  projects: { label: '项目经验', fields: [{ n: 'name', l: '项目名' }, { n: 'period', l: '时间' }, { n: 'tags', l: '技术栈 (逗号分隔)', t: 'textarea', a: true }, { n: 'summary', l: '项目描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    renderItem: function (i) { var tags = arr(i.tags), th = tags.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join(''); var a = cE('article', 'timeline-item'); a.innerHTML = '<div class="item-head"><div><h3>' + esc(i.name) + '</h3><ul class="tag-list item-subtitle">' + th + '</ul></div></div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul>'; return a; },
    mdItem: function (i) { var tg = Array.isArray(i.tags) ? i.tags.join('、') : (i.tags || ''); return '**' + (i.period || '') + '** | ' + (i.name || '') + (tg ? ' | ' + tg : '') + '\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: { name: '', period: '', tags: [], summary: '', highlights: [] }
  },
  skills: { label: '专业技能', fields: [{ n: 'name', l: '技能名' }, { n: 'detail', l: '详情', t: 'textarea' }], containerClass: 'skills-grid',
    renderItem: function (i) { var a = cE('article', 'skill-item'); a.innerHTML = '<span class="skill-name">' + esc(i.name) + '</span><span class="skill-detail">' + esc(i.detail) + '</span>'; return a; },
    mdPrefix: '| 类别 | 详情 |\n| --- | --- |', mdItem: function (i) { return '| **' + (i.name || '') + '** | ' + (i.detail || '') + ' |'; },
    defaultItem: { name: '', detail: '' }
  },
  summary: { label: '自我评价', fields: [], contentField: 'items', isArrayContent: true,
    renderContent: function (items) { if (!items || items.length === 0) return; var ul = cE('ul'); items.forEach(function (t) { var li = cE('li'); li.textContent = t; ul.appendChild(li); }); return ul; },
    mdBlock: function (items) { return (items || []).map(function (t) { return '- ' + t; }).join('\n'); },
    editorContent: function (items) { return '<div class="editor-field"><label>评价内容 (每行一条)</label><textarea name="sectionSummary.{idx}" rows="5">' + esc(items.join('\n')) + '</textarea></div>'; },
    defaultSection: function () { return { type: 'summary', title: SECTION_CONFIG.summary.label, items: [''] }; }
  },
  timeline: { label: '时间轴', fields: [{ n: 'period', l: '时间' }, { n: 'heading', l: '标题' }, { n: 'tag', l: '标签 (工作/教育/军旅等)' }, { n: 'summary', l: '描述', t: 'textarea' }, { n: 'highlights', l: '亮点 (每行一条)', t: 'textarea', a: true }],
    containerClass: 'timeline-wrapper',
    renderItem: function (i) { var a = cE('article', 'timeline-entry'); a.innerHTML = '<span class="timeline-period">' + esc(i.period) + '</span><div class="timeline-body"><div class="timeline-heading">' + esc(i.heading) + (i.tag ? ' <span class="timeline-tag">' + esc(i.tag) + '</span>' : '') + '</div>' + (i.summary ? '<p class="summary">' + esc(i.summary) + '</p>' : '') + '<ul>' + lis(i.highlights) + '</ul></div>'; return a; },
    mdItem: function (i) { return '**' + (i.period || '') + '** | ' + (i.heading || '') + (i.tag ? ' **' + i.tag + '**' : '') + '\n' + (i.summary || '') + '\n' + mli(i.highlights); },
    defaultItem: { period: '', heading: '', tag: '', summary: '', highlights: [] }
  },
  text: { label: '自由文本', fields: [], contentField: 'content',
    renderContent: function (c) { if (!c) return; var p = cE('p', 'summary'); p.textContent = c; return p; },
    mdBlock: function (c) { return c || ''; },
    editorContent: function (c) { return '<div class="editor-field"><label>内容</label><textarea name="sectionText.{idx}" rows="6">' + esc(c) + '</textarea></div>'; },
    defaultSection: function () { return { type: 'text', title: SECTION_CONFIG.text.label, content: '' }; }
  }
};
var SECTION_TYPES = Object.keys(SECTION_CONFIG);

/* 通用工具 */
function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : ''; }
function cE(t, c) { var e = document.createElement(t); if (c) e.className = c; return e; }
function lis(arr) { return (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
function mli(arr) { return (arr || []).map(function (x) { return '- ' + x; }).join('\n'); }
function arr(v) { return Array.isArray(v) ? v : (v ? String(v).split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean) : []); }

/* ===========================================================
   1. Toast 通知
   =========================================================== */
function showToast(m, t, d) { t = t || 'info'; d = d || 2400; var c = document.getElementById('toastContainer'); if (!c) { alert(m); return; } var o = cE('div', 'toast toast--' + t); o.textContent = m; c.appendChild(o); var r = function () { if (o && o.parentNode) { o.classList.add('toast--out'); setTimeout(function () { if (o && o.parentNode) o.remove(); }, 220); } }; setTimeout(r, d); }

/* ===========================================================
   2. 缩放控制
   =========================================================== */
function clampScale(v) { return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(v.toFixed(2)))); }
function getLayoutMode() { return window.innerWidth <= MOBILE_BREAKPOINT ? 'mobile' : window.innerWidth <= TABLET_BREAKPOINT ? 'tablet' : 'desktop'; }
function getShellContentWidth() { var s = document.querySelector('.page-shell'); if (!s) return window.innerWidth; var st = window.getComputedStyle(s); return s.clientWidth - (parseFloat(st.paddingLeft) || 0) - (parseFloat(st.paddingRight) || 0); }
function getRenderRoot() { var rd = document.getElementById('resumeDocument'), rp = document.getElementById('resumePages'); if (!rd) return null; if (currentLayoutMode !== 'mobile' && rp && rp.childElementCount > 0) return rp; return document.getElementById('resumeSource') || rd; }
function getAutoScale(lm) { lm = lm || currentLayoutMode; var rr = getRenderRoot(); if (!rr) return 1; return lm === 'tablet' ? Math.min(1, getShellContentWidth() / rr.offsetWidth) : 1; }
function getEffectiveScale(lm) { lm = lm || currentLayoutMode; return lm === 'mobile' ? 1 : Number((currentScale * getAutoScale(lm)).toFixed(4)); }
function updateStageSize() { var root = document.documentElement, rr = getRenderRoot(); if (!rr) return; var es = getEffectiveScale(); root.style.setProperty('--effective-scale', es); if (currentLayoutMode === 'mobile') { root.style.setProperty('--stage-width', '100%'); root.style.setProperty('--stage-height', 'auto'); return; } root.style.setProperty('--stage-width', Math.ceil(rr.offsetWidth * es) + 'px'); root.style.setProperty('--stage-height', Math.ceil(rr.offsetHeight * es) + 'px'); }
function getPageMetrics() { var rr = getRenderRoot(); if (!rr) return null; var r = rr.getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY }; }
function getViewportAnchor(sc) { var m = getPageMetrics(); if (!m) return null; return { offsetX: scrollX + innerWidth / 2 - m.left, offsetY: scrollY - m.top, scale: sc }; }
function updateToolbarState() { var zi = document.querySelector('[data-action="zoom-in"]'), zo = document.querySelector('[data-action="zoom-out"]'), re = document.querySelector('[data-action="reset"]'); if (zi) zi.disabled = currentScale >= MAX_SCALE; if (zo) zo.disabled = currentScale <= MIN_SCALE; if (re) { re.disabled = currentScale === DEFAULT_SCALE; re.textContent = Math.round(currentScale * 100) + '%'; } }
function updateScale(ns, pc) { var pvs = getEffectiveScale(), an = pc ? getViewportAnchor(pvs) : null; currentScale = clampScale(ns); updateStageSize(); updateToolbarState(); if (an) requestAnimationFrame(function () { var m = getPageMetrics(); if (!m) return; var ne = getEffectiveScale(), sr = ne / an.scale; scrollTo({ left: Math.max(0, m.left + an.offsetX * sr - innerWidth / 2), top: Math.max(0, m.top + an.offsetY * sr), behavior: 'auto' }); }); }

/* ===========================================================
   3. 自动分页
   =========================================================== */
function createPage(pn) { var rp = document.getElementById('resumePages'), p = cE('section', 'resume-page'); if (pn > 1) { p.classList.add('resume-page--continuation'); var b = cE('header', 'resume-page-banner'); b.setAttribute('aria-label', '分页信息'); b.innerHTML = '<span></span>'; p.appendChild(b); } var c = cE('div', 'resume-page-content'); p.appendChild(c); rp.appendChild(p); return { page: p, content: c, sections: new Map() }; }
function cloneSectionShell(ss) { var s = ss.cloneNode(false); var hd = Array.from(ss.children).find(function (c) { return c.classList && c.classList.contains('section-heading'); }); if (hd) s.appendChild(hd.cloneNode(true)); var rl = ss.querySelector('[data-render-list]'); if (rl) s.appendChild(rl.cloneNode(false)); return s; }
function ensureItemContainer(ps, ss, si) { if (ps.sections.has(si)) return ps.sections.get(si); var s = cloneSectionShell(ss); ps.content.appendChild(s); var ct = s.querySelector('[data-render-list]') || s; ps.sections.set(si, ct); return ct; }
function isOverflowing(ps) { return ps.content.scrollHeight > ps.content.clientHeight + PAGINATION_OVERFLOW_TOLERANCE; }
function updatePageBanners() { var rp = document.getElementById('resumePages'); if (!rp) return; var pages = Array.from(rp.children), total = pages.length; pages.forEach(function (p, i) { if (i === 0) return; var l = p.querySelector('.resume-page-banner span'); if (l) l.textContent = '第 ' + (i + 1) + ' 页 / 共 ' + total + ' 页'; }); }
function paginateResume() { var rs = document.getElementById('resumeSource'), rp = document.getElementById('resumePages'); if (!rs || !rp) return; rp.replaceChildren(); var hd = rs.querySelector('.resume-header'); if (!hd) return; var pss = [], cp = createPage(1); pss.push(cp); cp.content.appendChild(hd.cloneNode(true)); var secs = Array.from(rs.children).filter(function (c) { return c.classList && c.classList.contains('resume-section'); }); secs.forEach(function (ss, si) { var rl = ss.querySelector('[data-render-list]'), items = rl ? Array.from(rl.children) : []; if (items.length === 0) return; items.forEach(function (is) { var ct = ensureItemContainer(cp, ss, si), ic = is.cloneNode(true); ct.appendChild(ic); if (isOverflowing(cp)) { ct.removeChild(ic); if (ct.children.length === 0) { var sec = ct.closest('.resume-section'); if (sec) sec.remove(); cp.sections.delete(si); } cp = createPage(pss.length + 1); pss.push(cp); ct = ensureItemContainer(cp, ss, si); ct.appendChild(ic); } }); }); updatePageBanners(); }
function syncResumeLayout() { var rd = document.getElementById('resumeDocument'); if (!rd) return; currentLayoutMode = getLayoutMode(); rd.dataset.layoutMode = currentLayoutMode; if (currentLayoutMode === 'mobile') { var rp = document.getElementById('resumePages'); if (rp) rp.replaceChildren(); rd.dataset.jsReady = 'true'; return; } rd.dataset.jsReady = 'true'; paginateResume(); }
function handleViewportChange() { syncResumeLayout(); updateStageSize(); }

/* ===========================================================
   4. 复制功能
   =========================================================== */
function copyText(v) { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(v); return new Promise(function (rs) { var ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); rs(); }); }
function flashCopiedState(el) { var tn = el.querySelector('span'); if (!tn) return; var ol = el.dataset.originalLabel || tn.textContent.trim(); if (!el.dataset.originalLabel) el.dataset.originalLabel = ol; tn.textContent = '已复制'; setTimeout(function () { tn.textContent = ol; }, 1200); }
function bindCopyActions() { document.addEventListener('click', function (ev) { var el = ev.target.closest('.identity-action[data-copy]'); if (!el) return; ev.preventDefault(); var v = el.dataset.copy; if (!v) return; copyText(v).then(function () { flashCopiedState(el); }).catch(function (e) { console.error('Copy failed:', e); }); }); }

/* ===========================================================
   5. 工具栏
   =========================================================== */
function bindToolbarActions() { document.addEventListener('click', function (ev) { var b = ev.target.closest('[data-action]'); if (!b) return; var a = b.dataset.action; if (a === 'zoom-in') updateScale(currentScale + STEP, true); else if (a === 'zoom-out') updateScale(currentScale - STEP, true); else if (a === 'reset') updateScale(DEFAULT_SCALE, true); else if (a === 'edit') openEditor(); }); }

/* ===========================================================
   6. 数据加载 / 迁移 / 导入导出
   =========================================================== */
function migrateToSections(d) { if (d.sections && Array.isArray(d.sections)) return; var ss = []; if (d.education) ss.push({ type: 'education', title: (d.sectionTitles && d.sectionTitles.education) || '教育背景', items: d.education }); if (d.experience) ss.push({ type: 'experience', title: (d.sectionTitles && d.sectionTitles.experience) || '工作经历', items: d.experience }); if (d.skills) ss.push({ type: 'skills', title: (d.sectionTitles && d.sectionTitles.skills) || '专业技能', items: d.skills }); if (d.projects) ss.push({ type: 'projects', title: (d.sectionTitles && d.sectionTitles.projects) || '项目经验', items: d.projects }); if (d.summary) ss.push({ type: 'summary', title: (d.sectionTitles && d.sectionTitles.summary) || '自我评价', items: Array.isArray(d.summary) ? d.summary : [d.summary] }); d.sections = ss; delete d.education; delete d.experience; delete d.skills; delete d.projects; delete d.summary; delete d.sectionTitles; }
function normalizeSavedData() { migrateToSections(cvData); (cvData.sections || []).forEach(function (s) { if (!s.items) s.items = []; if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块'; if (s.type === 'projects') (s.items || []).forEach(function (p) { if (p.tags && !Array.isArray(p.tags)) p.tags = String(p.tags).split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean); }); }); }
function saveCvData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData)); }
function resetCvData() { localStorage.removeItem(STORAGE_KEY); location.reload(); }
function loadCvData() { return new Promise(function (rs) { var st = localStorage.getItem(STORAGE_KEY); if (st) { try { cvData = JSON.parse(st); normalizeSavedData(); rs(); return; } catch (e) {} } fetch(DEFAULT_JSON).then(function (r) { return r.json(); }).then(function (d) { cvData = d; normalizeSavedData(); rs(); }).catch(function () { cvData = {}; rs(); }); }); }
function exportJson() { var b = new Blob([JSON.stringify(cvData, null, 2)], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume-data.json'; a.click(); URL.revokeObjectURL(u); }
function exportMarkdown() { var md = buildMarkdown(cvData), b = new Blob([md], { type: 'text/markdown;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume.md'; a.click(); URL.revokeObjectURL(u); showToast('Markdown 已导出', 'success'); }
function importData(file) { var r = new FileReader(); r.onload = function (e) { try { var d; if (file.name.toLowerCase().endsWith('.md')) d = parseMarkdown(e.target.result); else d = JSON.parse(e.target.result); if (!d.profile) throw new Error('缺少 profile 字段'); cvData = d; normalizeSavedData(); saveCvData(); renderCv(); syncResumeLayout(); updateStageSize(); if (!document.getElementById('editorPanel').hidden) buildEditorForm(); showToast('导入成功', 'success'); } catch (err) { showToast('导入失败：' + err.message, 'error', 3600); } }; r.readAsText(file); }

/* ===========================================================
   7. Markdown 导入解析
   =========================================================== */
var FIELD_ALIAS = { '姓名': 'name', '岗位': 'title', '性别': 'gender', '年龄': 'age', '电话': 'phone', '邮箱': 'email', '头像': 'avatar', '头像url': 'avatar', '学校': 'school', '专业': 'major', '时间': 'period', '主修课程': 'courses', '公司': 'company', '职位': 'position', '简介': 'summary', '工作描述': 'summary', '技能名': 'name', '详情': 'detail', '项目名': 'name', '项目描述': 'summary', '技术栈': '__tags__', '亮点': '__highlights__', '标题': 'heading', '标签': 'tag' };
function parseMarkdown(md) {
  var d = { profile: {}, sections: [] }; md = md.replace(/^### /gm, '## ');
  var SM = { '个人信息': 'profile', '教育背景': 'education', '工作经历': 'experience', '部队经历': 'experience', '专业技能': 'skills', '项目经验': 'projects', '自我评价': 'summary', '时间轴': 'timeline' };
  var bl = md.split(/(?=^##\s)/m);
  for (var i = 0; i < bl.length; i++) {
    var lns = bl[i].split('\n'), hd = lns[0].replace(/^##\s*/, '').trim(), ct = lns.slice(1).join('\n').trim();
    if (!hd || !ct) continue; var tp = SM[hd]; if (!tp) continue;
    if (tp === 'profile') { var re = /\*\*(.+?)\*\*[：:]\s*([^*\n]+)/g, m; while ((m = re.exec(ct)) !== null) d.profile[m[1].trim()] = m[2].trim(); }
    else if (tp === 'summary') { var its = ct.split('\n').map(function (l) { return l.trim().replace(/^[*-]\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1').trim(); }).filter(Boolean); if (its.length > 0) d.sections.push({ type: 'summary', title: hd, items: its }); }
    else if (tp === 'skills') { var rs = ct.split('\n').filter(function (l) { return l.startsWith('|') && l.endsWith('|'); }), ss = []; rs.forEach(function (r) { var cs = r.split('|').filter(function (c) { return c.trim(); }).map(function (c) { return c.replace(/\*\*/g, '').trim(); }); if (cs.length >= 2 && !cs[0].includes('---') && cs[0] !== '类别') ss.push({ name: cs[0], detail: cs.slice(1).join(' ') }); }); if (ss.length > 0) d.sections.push({ type: 'skills', title: hd, items: ss }); }
    else { parsePipeItems(ct, tp, hd, d); }
  }
  if (!d.profile || Object.keys(d.profile).length === 0) d.profile = { name: '未命名' };
  return d;
}
function parsePipeItems(ct, tp, hd, d) { var its = [], lns = ct.split('\n').map(function (l) { return l.trim(); }).filter(Boolean), cur = null; for (var j = 0; j < lns.length; j++) { var ln = lns[j]; if (/^[*\-_]\s[*\-_]\s[*\-_]/.test(ln) || /^-{3,}$/.test(ln)) { if (cur) its.push(cur); cur = null; continue; } var pm = ln.match(/^\*\*(.+?)\*\*\s*\|\s*(.+?)(?:\s*\|\s*(.+?))?(?:\s*\|\s*(.*))?$/); if (pm) { if (cur) its.push(cur); cur = {}; var ps = [pm[1], pm[2], pm[3] || '', pm[4] || '']; if (tp === 'education') { cur.period = ps[0].trim(); cur.school = ps[1].trim(); cur.major = ps[2].trim(); var l = ps[3].trim(); if (l) cur.courses = l.replace(/.*?主修课程[：:]\s*/, '').trim(); } else if (tp === 'experience' || tp === 'timeline') { cur.period = ps[0].trim(); if (tp === 'experience') { cur.company = ps[1].trim(); cur.position = ps.slice(2).filter(Boolean).join(' | ').trim(); } else { cur.heading = ps[1].trim(); var tg = ps[2] ? ps[2].trim() : ''; if (tg) cur.tag = tg; } } else if (tp === 'projects') { cur.period = ps[0].trim(); cur.name = ps[1].trim(); var rl = ps.slice(2).filter(Boolean).join('，').trim(); if (rl) cur.summary = rl; } continue; } if ((ln.startsWith('* ') || ln.startsWith('- ')) && cur) { var t = ln.replace(/^[*-]\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1').trim(); if (t) { if (!cur.highlights) cur.highlights = []; cur.highlights.push(t); } } } if (cur) its.push(cur); if (its.length > 0) d.sections.push({ type: tp, title: hd, items: its }); }

/* ===========================================================
   8. 简历渲染 — 配置表驱动
   =========================================================== */
function createSectionDOM(idx) {
  var s = cE('section', 'resume-section'); s.setAttribute('data-section-index', idx);
  var cls = (cvData.sections[idx] && SECTION_CONFIG[cvData.sections[idx].type] ? SECTION_CONFIG[cvData.sections[idx].type].containerClass : '') || '';
  s.innerHTML = '<div class="section-heading"><h2></h2></div><div data-render-list="' + idx + '" class="' + cls + '"></div>';
  return s;
}

function renderSectionContent(listEl, idx) {
  var sec = cvData.sections[idx], cfg = SECTION_CONFIG[sec.type]; if (!cfg) return;
  listEl.replaceChildren();
  if (cfg.contentField) { var el = cfg.renderContent(cfg.contentField === 'items' ? sec.items : sec.content); if (el) listEl.appendChild(el); return; }
  (sec.items || []).forEach(function (item) { listEl.appendChild(cfg.renderItem(item)); });
}

function extractStartDate(period) {
  if (!period) return null;
  var m = period.match(/(\d{4}(?:\.\d{1,2})?)/);
  return m ? m[1] : null;
}

function getTimelineLabel(type, item) {
  if (type === 'education') return item[cvPrefs.timelineEduField] || '';
  if (type === 'experience') return item[cvPrefs.timelineExpField] || '';
  return '';
}

function autoTimeline() {
  var nodes = [];
  var st = { education:1, experience:1 };
  (cvData.sections || []).forEach(function(s) {
    if (!st[s.type]) return;
    (s.items || []).forEach(function(item) {
      var sd = extractStartDate(item.period);
      if (!sd) return;
      var lb = getTimelineLabel(s.type, item);
      if (!lb) return;
      nodes.push({ d: sd, l: lb });
    });
  });
  if (nodes.length === 0) return '';
  nodes.sort(function(a, b) { return a.d.localeCompare(b.d); });
  var segs = nodes.map(function(n) {
    return '<span class="tl-seg"><em class="tl-year">' + esc(n.d.substring(0,4)) + '</em><span class="tl-item">' + esc(n.l) + '</span></span>';
  });
  return segs.join('<span class="tl-arrow"> → </span>');
}

function renderCv() {
  if (!cvData) return; var d = cvData;
  document.querySelectorAll('[data-render]').forEach(function (el) {
    var key = el.dataset.render, ps = key.split('.'), v = d[ps[0]];
    for (var i = 1; v != null && i < ps.length; i++) v = v[ps[i]];
    if (el.tagName === 'A') { if (v) el.href = (v.startsWith('http') ? '' : 'https://') + v; }
    else if (el.tagName === 'BUTTON') { if (v) el.dataset.copy = v; }
    else if (el.classList.contains('resume-avatar')) { if (v) el.style.setProperty('--avatar-image', "url('" + v + "')"); }
    else { if (v && !(el.children.length > 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) el.textContent = v; }
  });
  if (d.profile && d.profile.title) document.title = d.profile.name + ' - ' + d.profile.title;
  var rs = document.getElementById('resumeSource'); if (!rs) return;
  var hd = rs.querySelector('.resume-header'); rs.replaceChildren(); if (hd) rs.appendChild(hd);
  (d.sections || []).forEach(function (sec, i) { var dom = createSectionDOM(i); var h2 = dom.querySelector('h2'); if (h2) h2.textContent = sec.title || (SECTION_CONFIG[sec.type] || {}).label || ''; rs.appendChild(dom); var le = dom.querySelector('[data-render-list]'); if (le) renderSectionContent(le, i); });
  var ts = document.querySelector('.timeline-strip'); if (ts && !(d.profile && d.profile.timeline)) { ts.innerHTML = autoTimeline(); ts.classList.add('auto'); }
}

/* ===========================================================
   9. Markdown 导出 — 配置表驱动
   =========================================================== */
function buildMarkdown(d) {
  var lns = [], p = d.profile || {};
  lns.push('## 个人信息', ''); if (p.name) lns.push('- **姓名**：' + p.name); if (p.title) lns.push('- **岗位**：' + p.title); if (p.experience) lns.push('- **工作经验**：' + p.experience); if (p.所在地) lns.push('- **所在地**：' + p.所在地); if (p.gender || p.age) lns.push('- **基本信息**：' + (p.gender || '') + (p.gender && p.age ? ' / ' : '') + (p.age || '')); if (p.phone) lns.push('- **电话**：' + p.phone); if (p.email) lns.push('- **邮箱**：' + p.email); if (p.github) lns.push('- **GitHub**：' + p.github);
  (d.sections || []).forEach(function (s) { var cfg = SECTION_CONFIG[s.type]; if (!cfg) return; lns.push('', '## ' + (s.title || cfg.label || ''), ''); if (cfg.mdPrefix) lns.push(cfg.mdPrefix); if (cfg.contentField) { lns.push(cfg.mdBlock(cfg.contentField === 'items' ? s.items : s.content)); } else { (s.items || []).forEach(function (i) { lns.push(cfg.mdItem(i)); lns.push('', '*   *   *', ''); }); } });
  return lns.join('\n');
}

/* ===========================================================
   10. 偏好设置
   =========================================================== */
var PREFS_KEY = 'cv_prefs', THEMES = { default: { name: '默认', vars: {} }, academic: { name: '学术', vars: { '--accent': '#8b0000', '--canvas-bg': '#f5f5f0', '--paper-bg': '#fffff8' } }, modern: { name: '现代', vars: { '--accent': '#0ea5e9', '--canvas-bg': '#f0f9ff', '--text-soft': '#475569' } }, simple: { name: '简约', vars: { '--accent': '#6b7280', '--canvas-bg': '#f9fafb', '--line-soft': '#d1d5db' } } }, FONT_SIZES = { small: { name: '小', vars: { '--fs-body': '11.5px', '--fs-meta': '11px', '--fs-h1': '27px', '--fs-h2': '13px', '--fs-h3': '13px' } }, medium: { name: '中', vars: { '--fs-body': '12.5px', '--fs-meta': '12px', '--fs-h1': '30px', '--fs-h2': '14px', '--fs-h3': '14px' } }, large: { name: '大', vars: { '--fs-body': '13.5px', '--fs-meta': '13px', '--fs-h1': '33px', '--fs-h2': '15px', '--fs-h3': '15px' } } }, FONT_FAMILIES = { default: { name: '默认', value: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' }, yahei: { name: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' }, serif: { name: '衬线体', value: 'Georgia, "SimSun", serif' } }, cvPrefs = null;
function loadPrefs() { var st = localStorage.getItem(PREFS_KEY); if (st) { try { cvPrefs = JSON.parse(st); } catch (e) { cvPrefs = null; } } if (!cvPrefs) cvPrefs = { fontFamily: 'default', fontSize: 'medium', theme: 'default' }; if (!FONT_FAMILIES[cvPrefs.fontFamily]) cvPrefs.fontFamily = 'default'; if (!cvPrefs.timelineEduField) cvPrefs.timelineEduField = 'degree'; if (!cvPrefs.timelineExpField) cvPrefs.timelineExpField = 'position'; }
function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(cvPrefs)); }
function applyPrefs() { var r = document.documentElement, th = THEMES[cvPrefs.theme] || THEMES.default, fs = FONT_SIZES[cvPrefs.fontSize] || FONT_SIZES.medium, ff = FONT_FAMILIES[cvPrefs.fontFamily] || FONT_FAMILIES.default; Object.entries(th.vars).forEach(function (kv) { r.style.setProperty(kv[0], kv[1]); }); Object.entries(fs.vars).forEach(function (kv) { r.style.setProperty(kv[0], kv[1]); }); r.style.setProperty('--font-family', ff.value); }

/* ===========================================================
   11. 编辑器 — 配置表驱动
   =========================================================== */
function buildEditorForm() {
  if (!cvData) return; var ec = document.getElementById('editorContent'); if (!ec) return;
  var hh = buildEditorPrefs() + '<div class="editor-section"><h3>个人信息</h3>' + buildProfileFields(cvData.profile) + '</div>';
  hh += '<div class="editor-section"><h3>顶部时间轴预览</h3><div class="tl-editor-preview">' + (autoTimeline() || '<span style="color:var(--text-soft)">（无足够时间数据）</span>') + '</div></div>';
  (cvData.sections || []).forEach(function (sec, idx) { hh += buildEditorSectionForm(sec, idx); });
  hh += '<div class="editor-add-section"><button type="button" class="editor-add-btn" id="addSectionBtn">+ 添加模块</button><div class="add-section-menu" id="addSectionMenu" hidden>' + Object.keys(SECTION_CONFIG).map(function (t) { return '<button type="button" class="dropdown-item" data-add-type="' + t + '">' + (SECTION_CONFIG[t] ? SECTION_CONFIG[t].label : t) + '</button>'; }).join('') + '</div></div>';
  ec.innerHTML = hh;
  var ab = document.getElementById('addSectionBtn'), am = document.getElementById('addSectionMenu');
  if (ab && am) { ab.addEventListener('click', function (e) { e.stopPropagation(); am.hidden = !am.hidden; }); am.querySelectorAll('[data-add-type]').forEach(function (b) { b.addEventListener('click', function () { collectFormData(); cvData.sections.push(getDefaultSection(b.dataset.addType)); buildEditorForm(); }); }); }
  bindPrefChangeEvents();
}

function buildEditorSectionForm(sec, idx) {
  var cfg = SECTION_CONFIG[sec.type]; if (!cfg) return '';
  var hh = '<div class="editor-section editor-module" data-section-index="' + idx + '">';
  hh += '<div class="editor-module-header"><span class="module-type-label">' + (cfg.label || '') + '</span><div class="module-actions">';
  hh += '<button type="button" class="module-action-btn" data-action="move-section-up" data-index="' + idx + '" title="上移"' + (idx === 0 ? ' disabled' : '') + '>↑</button>';
  hh += '<button type="button" class="module-action-btn" data-action="move-section-down" data-index="' + idx + '" title="下移"' + (idx === (cvData.sections || []).length - 1 ? ' disabled' : '') + '>↓</button>';
  hh += '<button type="button" class="module-action-btn module-action-remove" data-action="remove-section" data-index="' + idx + '" title="删除模块">×</button>';
  hh += '</div></div>';
  hh += '<div class="editor-field"><label>模块标题</label><input type="text" name="sectionTitle.' + idx + '" value="' + esc(sec.title || '') + '" placeholder="' + (cfg.label || '') + '"></div>';
  if (cfg.contentField && cfg.editorContent) { hh += cfg.editorContent(cfg.contentField === 'items' ? (sec.items || []) : (sec.content || '')).replace(/\{idx\}/g, idx); }
  else if (cfg.fields && cfg.fields.length > 0) { (sec.items || []).forEach(function (item, iIdx) { hh += buildItemCard(idx, iIdx, cfg.fields, item); }); hh += '<button type="button" class="editor-add-btn" data-add-item="' + idx + '">+ 添加条目</button>'; }
  hh += '</div>';
  return hh;
}

function buildItemCard(si, ii, fields, item) {
  var hh = '<div class="editor-item" data-section-index="' + si + '" data-item-index="' + ii + '">';
  hh += '<div class="editor-item-header"><span>#' + (ii + 1) + '</span><div class="item-header-actions">';
  hh += '<button type="button" class="item-action-btn" data-action="move-item-up" data-section-index="' + si + '" data-item-index="' + ii + '" title="上移"' + (ii === 0 ? ' disabled' : '') + '>↑</button>';
  hh += '<button type="button" class="item-action-btn" data-action="move-item-down" data-section-index="' + si + '" data-item-index="' + ii + '" title="下移">↓</button>';
  hh += '<button type="button" class="item-action-btn" data-action="copy-item" data-section-index="' + si + '" data-item-index="' + ii + '" title="复制">⧉</button>';
  hh += '<button type="button" class="editor-item-remove" data-section-index="' + si + '" data-item-index="' + ii + '" aria-label="移除">×</button></div></div>';
  hh += '<div class="editor-item-content">';
  fields.forEach(function (f) { var v = item[f.n] || '', dv = f.a ? (Array.isArray(v) ? v.join(f.n === 'tags' ? ', ' : '\n') : v) : v; hh += '<div class="editor-field"><label>' + f.l + '</label>' + (f.t === 'textarea' ? '<textarea name="item.' + si + '.' + ii + '.' + f.n + '">' + esc(dv) + '</textarea>' : '<input name="item.' + si + '.' + ii + '.' + f.n + '" value="' + esc(dv) + '">') + '</div>'; });
  hh += '</div></div>';
  return hh;
}

function buildEditorPrefs() {
  var to = Object.entries(THEMES).map(function (kv) { return '<option value="' + kv[0] + '"' + (cvPrefs.theme === kv[0] ? ' selected' : '') + '>' + kv[1].name + '</option>'; }).join('');
  var so = Object.entries(FONT_SIZES).map(function (kv) { return '<option value="' + kv[0] + '"' + (cvPrefs.fontSize === kv[0] ? ' selected' : '') + '>' + kv[1].name + '</option>'; }).join('');
  var fo = Object.entries(FONT_FAMILIES).map(function (kv) { return '<option value="' + kv[0] + '"' + (cvPrefs.fontFamily === kv[0] ? ' selected' : '') + '>' + kv[1].name + '</option>'; }).join('');
  var TLF = { education: [{ v: 'school', l: '\u5b66\u6821' }, { v: 'major', l: '\u4e13\u4e1a' }, { v: 'degree', l: '\u5b66\u5386' }], experience: [{ v: 'company', l: '\u516c\u53f8' }, { v: 'position', l: '\u804c\u4f4d' }] };
  var ae = TLF.education.map(function (o) { return '<option value="' + o.v + '"' + (cvPrefs.timelineEduField === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('');
  var ax = TLF.experience.map(function (o) { return '<option value="' + o.v + '"' + (cvPrefs.timelineExpField === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('');
  return '<div class="editor-section editor-section-prefs"><h3>\u9875\u9762\u8bbe\u7f6e</h3><div class="prefs-row"><div class="editor-field"><label>\u4e3b\u9898\u914d\u8272</label><select id="prefTheme">' + to + '</select></div><div class="editor-field"><label>\u5b57\u53f7</label><select id="prefFontSize">' + so + '</select></div><div class="editor-field"><label>\u5b57\u4f53</label><select id="prefFontFamily">' + fo + '</select></div></div><div class="prefs-row" style="margin-top:12px"><div class="editor-field"><label>\u65f6\u95f4\u8f74 \u00b7 \u6559\u80b2\u53d6</label><select id="prefTlEdu">' + ae + '</select></div><div class="editor-field"><label>\u65f6\u95f4\u8f74 \u00b7 \u5de5\u4f5c\u53d6</label><select id="prefTlExp">' + ax + '</select></div></div></div>';
}

function buildProfileFields(profile) {
  var av = profile && profile.avatar ? profile.avatar : '';
  var flds = [{ n: 'name', l: '姓名' }, { n: 'title', l: '岗位' }, { n: 'experience', l: '工作经验' }, { n: '所在地', l: '所在地' }, { n: 'gender', l: '性别' }, { n: 'age', l: '年龄' }, { n: 'phone', l: '电话' }, { n: 'email', l: '邮箱' }, { n: 'github', l: 'GitHub' }, { n: 'timeline', l: '顶部时间线', p: '留空则自动从经历中提取' }];
  var hh = '<div class="editor-field editor-field-avatar"><label>头像</label><div class="avatar-upload"><div class="avatar-preview" id="avatarPreview" style="' + (av ? "background-image: url('" + esc(av) + "')" : '') + '"></div><div class="avatar-upload-inputs"><input type="file" id="avatarFileInput" accept="image/*"><input type="text" name="profile.avatar" value="' + esc(av) + '" placeholder="图片路径，如 assets/avatar.png"></div><p style="font-size:11px;color:var(--text-soft);margin:4px 0 0">选择文件仅预览，请将图片手动保存到 site/assets/ 目录</p></div></div>';
  hh += flds.map(function (f) { return '<div class="editor-field"><label>' + f.l + '</label><input type="text" name="profile.' + f.n + '" value="' + esc(profile && profile[f.n] ? profile[f.n] : '') + '"' + (f.p ? ' placeholder="' + f.p + '"' : '') + '></div>'; }).join('');
  return hh;
}

/* ===========================================================
   12. 编辑器事件与生命周期
   =========================================================== */
function collectFormData() {
  var ec = document.getElementById('editorContent'); if (!ec) return;
  var nd = { profile: Object.assign({}, cvData.profile || {}), sections: cvData.sections ? cvData.sections.map(function (s) { return Object.assign({}, s); }) : [] };
  ec.querySelectorAll('[name^="profile."]').forEach(function (el) { nd.profile[el.name.split('.')[1]] = el.value; });
  ec.querySelectorAll('[name^="sectionTitle."]').forEach(function (el) { var i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].title = el.value; });
  ec.querySelectorAll('[name^="sectionSummary."]').forEach(function (el) { var i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].items = el.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); });
  ec.querySelectorAll('[name^="sectionText."]').forEach(function (el) { var i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].content = el.value; });
  ec.querySelectorAll('[name^="item."]').forEach(function (el) { var ps = el.name.split('.'), si = parseInt(ps[1], 10), ii = parseInt(ps[2], 10), fi = ps[3]; if (!nd.sections[si]) return; if (!nd.sections[si].items) nd.sections[si].items = []; if (!nd.sections[si].items[ii]) nd.sections[si].items[ii] = {}; nd.sections[si].items[ii][fi] = el.value; });
  (nd.sections || []).forEach(function (s) { if (s.type === 'text' || s.type === 'summary') return; (s.items || []).forEach(function (item) { if (item.highlights && typeof item.highlights === 'string') item.highlights = item.highlights.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (item.tags && typeof item.tags === 'string') item.tags = item.tags.split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean); }); });
  cvData = nd; saveCvData();
}

function openEditor() { var ep = document.getElementById('editorPanel'), eo = document.getElementById('editorOverlay'); if (!ep || !eo) return; ep.hidden = false; eo.hidden = false; buildEditorForm(); }
function closeEditor() { var ep = document.getElementById('editorPanel'), eo = document.getElementById('editorOverlay'); if (!ep || !eo) return; ep.hidden = true; eo.hidden = true; renderCv(); syncResumeLayout(); updateStageSize(); }
function closeAllDropdowns() { document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); }); var m = document.getElementById('addSectionMenu'); if (m) m.hidden = true; }

function moveSection(idx, dir) { collectFormData(); var ni = idx + dir; if (ni < 0 || ni >= cvData.sections.length) return; var t = cvData.sections[idx]; cvData.sections[idx] = cvData.sections[ni]; cvData.sections[ni] = t; saveCvData(); buildEditorForm(); }
function removeSection(idx) { collectFormData(); if (!confirm('确定要删除此模块吗？')) return; cvData.sections.splice(idx, 1); saveCvData(); buildEditorForm(); }
function addItem(idx) { collectFormData(); var s = cvData.sections[idx]; if (!s) return; if (!s.items) s.items = []; s.items.push(getDefaultItem(s.type)); saveCvData(); buildEditorForm(); }
function removeItem(si, ii) { collectFormData(); var s = cvData.sections[si]; if (!s || !s.items) return; if (!confirm('确定要移除该项吗？')) return; s.items.splice(ii, 1); saveCvData(); buildEditorForm(); }
function moveItem(si, ii, dir) { collectFormData(); var items = (cvData.sections[si] || {}).items; if (!items) return; var ni = ii + dir; if (ni < 0 || ni >= items.length) return; var t = items[ii]; items[ii] = items[ni]; items[ni] = t; saveCvData(); buildEditorForm(); }
function copyItem(si, ii) { collectFormData(); var s = cvData.sections[si]; if (!s || !s.items) return; var clone = JSON.parse(JSON.stringify(s.items[ii])); s.items.splice(ii + 1, 0, clone); saveCvData(); buildEditorForm(); }

function getDefaultSection(type) { var cfg = SECTION_CONFIG[type]; if (!cfg) cfg = SECTION_CONFIG.experience; if (cfg.defaultSection) return cfg.defaultSection(); return { type: type, title: cfg.label, items: [JSON.parse(JSON.stringify(cfg.defaultItem))] }; }
function getDefaultItem(type) { var cfg = SECTION_CONFIG[type]; return cfg && cfg.defaultItem ? JSON.parse(JSON.stringify(cfg.defaultItem)) : {}; }

function bindEditorEvents() {
  document.getElementById('closeEditor') && document.getElementById('closeEditor').addEventListener('click', closeEditor);
  document.getElementById('editorOverlay') && document.getElementById('editorOverlay').addEventListener('click', closeEditor);
  document.getElementById('saveData') && document.getElementById('saveData').addEventListener('click', function () { collectFormData(); closeEditor(); });
  document.addEventListener('click', function (ev) {
    var ab = ev.target.closest('[data-action]'); if (ab) { var a = ab.dataset.action; if (a === 'move-section-up' || a === 'move-section-down' || a === 'remove-section') { var i = parseInt(ab.dataset.index, 10); if (a === 'move-section-up') { moveSection(i, -1); return; } if (a === 'move-section-down') { moveSection(i, 1); return; } if (a === 'remove-section') { removeSection(i); return; } } else { var si = parseInt(ab.dataset.sectionIndex, 10), ii = parseInt(ab.dataset.itemIndex, 10); if (a === 'move-item-up') { moveItem(si, ii, -1); return; } if (a === 'move-item-down') { moveItem(si, ii, 1); return; } if (a === 'copy-item') { copyItem(si, ii); return; } } }
    var ab2 = ev.target.closest('[data-action]'); if (ab2) { var a2 = ab2.dataset.action; if (a2 === 'import-json') { document.getElementById('fileImportInput').click(); return; } if (a2 === 'import-md') { document.getElementById('fileImportInput').click(); return; } if (a2 === 'export-json') { collectFormData(); exportJson(); return; } if (a2 === 'export-md') { collectFormData(); exportMarkdown(); return; } if (a2 === 'print') { exportPdf(); return; } }
function exportPdf() { var el = document.getElementById('resumeDocument'); if (!el || typeof html2pdf === 'undefined') return; var pages = document.querySelectorAll('.resume-page'); for (var i = 0; i < pages.length; i++) { pages[i].classList.add('html2pdf__page-break'); } var name = (cvData && cvData.profile && cvData.profile.name ? cvData.profile.name : '简历') + '.pdf'; html2pdf().set({ margin: 0, filename: name, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, letterRendering: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: 'css' } }).from(el).save().then(function () { for (var j = 0; j < pages.length; j++) { pages[j].classList.remove('html2pdf__page-break'); } }); }
    var aib = ev.target.closest('[data-add-item]'); if (aib) { addItem(parseInt(aib.dataset.addItem, 10)); return; }
    var rib = ev.target.closest('.editor-item-remove'); if (rib) { removeItem(parseInt(rib.dataset.sectionIndex, 10), parseInt(rib.dataset.itemIndex, 10)); return; }
    if (ev.target.closest('#addSectionBtn')) return;
    if (ev.target.closest('[data-add-type]')) return;
    if (ev.target.closest('[data-dropdown]')) { ev.stopPropagation(); var dd = ev.target.closest('[data-dropdown]'); var p = dd.closest('.dropdown'); var wo = p && p.classList.contains('open'); closeAllDropdowns(); if (p && !wo) p.classList.add('open'); return; }
    closeAllDropdowns();
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'avatarFileInput') { var f = ev.target.files[0]; if (!f) return; var blobUrl = URL.createObjectURL(f); var pv = document.getElementById('avatarPreview'); if (pv) pv.style.backgroundImage = "url('" + blobUrl + "')"; var ai = document.querySelector('input[name="profile.avatar"]'); if (ai && !ai.value) ai.value = 'assets/avatar.png'; return; }
    if (ev.target.id === 'fileImportInput') { if (ev.target.files[0]) importData(ev.target.files[0]); ev.target.value = ''; return; }
  });
}

function bindPrefChangeEvents() { var ts = document.getElementById('prefTheme'), ss = document.getElementById('prefFontSize'), fs = document.getElementById('prefFontFamily'); if (ts) { ts.removeEventListener('change', onPrefThemeChange); ts.addEventListener('change', onPrefThemeChange); } if (ss) { ss.removeEventListener('change', onPrefSizeChange); ss.addEventListener('change', onPrefSizeChange); } if (fs) { fs.removeEventListener('change', onPrefFontChange); fs.addEventListener('change', onPrefFontChange); } }
var te = document.getElementById('prefTlEdu'), tx = document.getElementById('prefTlExp'); if (te) { te.removeEventListener('change', onPrefTlEdu); te.addEventListener('change', onPrefTlEdu); } if (tx) { tx.removeEventListener('change', onPrefTlExp); tx.addEventListener('change', onPrefTlExp); }
function onPrefThemeChange() { cvPrefs.theme = this.value; savePrefs(); applyPrefs(); }
function onPrefSizeChange() { cvPrefs.fontSize = this.value; savePrefs(); applyPrefs(); }
function onPrefFontChange() { cvPrefs.fontFamily = this.value; savePrefs(); applyPrefs(); }
function onPrefTlEdu() { cvPrefs.timelineEduField = this.value; savePrefs(); }
function onPrefTlExp() { cvPrefs.timelineExpField = this.value; savePrefs(); }

/* ===========================================================
   13. 初始化
   =========================================================== */
function init() { loadPrefs(); applyPrefs(); var rd = document.getElementById('resumeDocument'); if (rd) { handleViewportChange(); window.addEventListener('resize', handleViewportChange); window.addEventListener('load', handleViewportChange); } var tb = document.querySelector('.floating-toolbar'); if (tb) updateScale(DEFAULT_SCALE); bindCopyActions(); bindToolbarActions(); bindEditorEvents(); if (new URLSearchParams(location.search).get('edit') === '1') openEditor(); }
loadCvData().then(function () { loadPrefs(); renderCv(); init(); });