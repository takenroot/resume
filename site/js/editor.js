/* ===========================================================
   CV 简历网页 — 编辑器（表单构建 + CRUD + 事件绑定）
   =========================================================== */
function buildEditorForm() {
  if (!cvData) return; const ec = document.getElementById('editorContent'); if (!ec) return;
  let hh = buildEditorPrefs() + '<div class="editor-section"><h3>个人信息</h3>' + buildProfileFields(cvData.profile) + '</div>';
  hh += '<div class="editor-section"><h3>顶部时间轴预览</h3><div class="tl-editor-preview">' + (autoTimeline() || '<span style="color:var(--text-soft)">（无足够时间数据）</span>') + '</div></div>';
  (cvData.sections || []).forEach(function (sec, idx) { hh += buildEditorSectionForm(sec, idx); });
  hh += '<div class="editor-add-section"><button type="button" class="editor-add-btn" id="addSectionBtn">+ 添加模块</button><div class="add-section-menu" id="addSectionMenu" hidden>' + Object.keys(SECTION_CONFIG).map(function (t) { return '<button type="button" class="dropdown-item" data-add-type="' + t + '">' + (SECTION_CONFIG[t] ? SECTION_CONFIG[t].label : t) + '</button>'; }).join('') + '</div></div>';
  ec.innerHTML = hh;
  const ab = document.getElementById('addSectionBtn'), am = document.getElementById('addSectionMenu');
  if (ab && am) { ab.addEventListener('click', function (e) { e.stopPropagation(); am.hidden = !am.hidden; }); am.querySelectorAll('[data-add-type]').forEach(function (b) { b.addEventListener('click', function () { collectFormData(); cvData.sections.push(getDefaultSection(b.dataset.addType)); buildEditorForm(); }); }); }
  bindPrefChangeEvents();
}

// ponytail: 单一来源 — headerLabel / placeholder / liveSync label 刷新都走这个.
// 用户改过 sec.title 就用用户的 (他们会自定义模块名), 没改回退到 type 默认 label.
function moduleLabel(sec) { return (sec && sec.title) || (SECTION_CONFIG[sec && sec.type] || {}).label || ''; }

function buildEditorSectionForm(sec, idx) {
  const cfg = SECTION_CONFIG[sec.type]; if (!cfg) return '';
  let hh = '<div class="editor-section editor-module" data-section-index="' + idx + '">';
  hh += '<div class="editor-module-header"><span class="module-type-label">' + esc(moduleLabel(sec)) + '</span><div class="module-actions">';
  hh += '<button type="button" class="module-action-btn collapse-btn" data-action="toggle-section-collapse" data-index="' + idx + '" title="折叠/展开"></button>';
  hh += '<button type="button" class="module-action-btn" data-action="move-section-up" data-index="' + idx + '" title="上移"' + (idx === 0 ? ' disabled' : '') + '>↑</button>';
  hh += '<button type="button" class="module-action-btn" data-action="move-section-down" data-index="' + idx + '" title="下移"' + (idx === (cvData.sections || []).length - 1 ? ' disabled' : '') + '>↓</button>';
  hh += '<button type="button" class="module-action-btn module-action-remove" data-action="remove-section" data-index="' + idx + '" title="删除模块">×</button>';
  hh += '</div></div>';
  hh += '<div class="editor-module-body">';
  hh += '<div class="editor-field"><label>模块标题</label><input type="text" name="sectionTitle.' + idx + '" value="' + esc(sec.title || '') + '" placeholder="' + (cfg.label || '') + '"></div>';
  if (cfg.contentField && cfg.editorContent) { hh += cfg.editorContent(cfg.contentField === 'items' ? (sec.items || []) : (sec.content || '')).replace(/\{idx\}/g, idx); }
  else if (cfg.fields && cfg.fields.length > 0) { (sec.items || []).forEach(function (item, iIdx) { hh += buildItemCard(idx, iIdx, cfg.fields, item); }); hh += '<button type="button" class="editor-add-btn" data-add-item="' + idx + '">+ 添加条目</button>'; }
  hh += '</div></div>';
  return hh;
}

// ponytail: 把 buildItemCard 里的 if/else if 链抽成 dispatch, 加新类型 (radio/date 等) 只改这里.
// 支持的 f.t: 'select' / 'checkbox' / 'textarea' / 默认 input. f.a=true 数组字段自动 join('\n' 或 ', ').
function renderItemFieldInput(f, v, name) {
  if (f.t === 'select') {
    const opts = (f.options || []).map(function (o) { return '<option value="' + esc(o) + '"' + (v === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
    return '<select name="' + name + '">' + opts + '</select>';
  }
  if (f.t === 'checkbox') return '<input type="checkbox" name="' + name + '" value="1"' + (v ? ' checked' : '') + '>';
  if (f.t === 'textarea') {
    const dv = f.a ? (Array.isArray(v) ? v.join('\n') : v) : v;
    return '<textarea name="' + name + '">' + esc(dv || '') + '</textarea>';
  }
  const dv = f.a ? (Array.isArray(v) ? v.join(f.n === 'tags' ? ', ' : '\n') : v) : v;
  return '<input name="' + name + '" value="' + esc(dv || '') + '">';
}

function buildItemCard(si, ii, fields, item) {
  let hh = '<div class="editor-item" data-section-index="' + si + '" data-item-index="' + ii + '">';
  hh += '<div class="editor-item-header"><span>#' + (ii + 1) + '</span><div class="item-header-actions">';
  hh += '<button type="button" class="item-action-btn" data-action="move-item-up" data-section-index="' + si + '" data-item-index="' + ii + '" title="上移"' + (ii === 0 ? ' disabled' : '') + '>↑</button>';
  hh += '<button type="button" class="item-action-btn" data-action="move-item-down" data-section-index="' + si + '" data-item-index="' + ii + '" title="下移">↓</button>';
  hh += '<button type="button" class="item-action-btn" data-action="copy-item" data-section-index="' + si + '" data-item-index="' + ii + '" title="复制">⧉</button>';
  hh += '<button type="button" class="editor-item-remove" data-section-index="' + si + '" data-item-index="' + ii + '" aria-label="移除">×</button></div></div>';
  hh += '<div class="editor-item-content">';
  fields.forEach(function (f) { hh += '<div class="editor-field"><label>' + f.l + '</label>' + renderItemFieldInput(f, item[f.n], 'item.' + si + '.' + ii + '.' + f.n) + '</div>'; });
  hh += '</div></div>';
  return hh;
}

function buildEditorPrefs() {
  const to = Object.entries(THEMES).map(function (kv) { return '<option value="' + kv[0] + '"' + (cvPrefs.theme === kv[0] ? ' selected' : '') + '>' + kv[1].name + '</option>'; }).join('');
  const so = Object.entries(FONT_SIZES).map(function (kv) { return '<option value="' + kv[0] + '"' + (cvPrefs.fontSize === kv[0] ? ' selected' : '') + '>' + kv[1].name + '</option>'; }).join('');
  const fo = Object.entries(FONT_FAMILIES).map(function (kv) { return '<option value="' + kv[0] + '"' + (cvPrefs.fontFamily === kv[0] ? ' selected' : '') + '>' + kv[1].name + '</option>'; }).join('');
  const TLF = { education: [{ v: 'school', l: '学校' }, { v: 'major', l: '专业' }, { v: 'degree', l: '学历' }], experience: [{ v: 'company', l: '公司' }, { v: 'position', l: '职位' }] };
  const ae = TLF.education.map(function (o) { return '<option value="' + o.v + '"' + (cvPrefs.timelineEduField === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('');
  const ax = TLF.experience.map(function (o) { return '<option value="' + o.v + '"' + (cvPrefs.timelineExpField === o.v ? ' selected' : '') + '>' + o.l + '</option>'; }).join('');
  return '<div class="editor-section editor-section-prefs"><h3>页面设置</h3><div class="prefs-row"><div class="editor-field"><label>主题配色</label><select id="prefTheme">' + to + '</select></div><div class="editor-field"><label>字号</label><select id="prefFontSize">' + so + '</select></div><div class="editor-field"><label>字体</label><select id="prefFontFamily">' + fo + '</select></div></div><div class="prefs-row" style="margin-top:12px"><div class="editor-field"><label>时间轴 · 教育取</label><select id="prefTlEdu">' + ae + '</select></div><div class="editor-field"><label>时间轴 · 工作取</label><select id="prefTlExp">' + ax + '</select></div><div class="editor-field"><label class="checkbox-label"><input type="checkbox" id="prefTimelineEnabled"> 显示顶部时间轴</label></div></div><p class="prefs-hint">打印页边距请在浏览器打印对话框里设置（建议选「无」或「最小」，本项目 @page 已固定 0mm）</p></div>';
}

function buildProfileFields(profile) {
  const name = profile && profile.name ? profile.name : '';
  const av = profile && profile.avatar ? profile.avatar : '';
  const localAvatar = av ? av : loadAvatar(name);
  const hasLocalAvatar = !!loadAvatar(name);
  const flds = [{ n: 'name', l: '姓名' }, { n: 'title', l: '岗位' }, { n: 'experience', l: '工作经验' }, { n: '求职状态', l: '求职状态', t: 'select', options: ['随时到岗', '在职-看机会', '在职-暂不考虑', '暂不找工作'] }, { n: '所在地', l: '所在地' }, { n: 'gender', l: '性别' }, { n: 'birthDate', l: '出生日期', t: 'date' }, { n: 'phone', l: '电话' }, { n: 'email', l: '邮箱' }, { n: 'github', l: 'GitHub' }, { n: 'wechat', l: '微信号' }, { n: 'expectIndustry', l: '期望行业' }, { n: 'timeline', l: '顶部时间线', p: '留空则自动从经历中提取' }];
  let hh = '<div class="editor-field editor-field-avatar"><label>头像</label><div class="avatar-upload"><div class="avatar-preview" id="avatarPreview" style="' + (localAvatar ? "background-image: url('" + esc(localAvatar) + "')" : '') + '"></div><div class="avatar-upload-inputs"><input type="file" id="avatarFileInput" accept="image/*">' + (hasLocalAvatar ? '<button type="button" class="editor-btn" id="clearAvatarBtn" style="font-size:12px;padding:4px 8px">清除头像</button>' : '') + '<input type="text" name="profile.avatar" value="' + esc(av) + '" placeholder="留空则使用浏览器本地头像"></div><p style="font-size:11px;color:var(--text-soft);margin:4px 0 0">选择图片后自动转为 base64 存入浏览器本地，导出 JSON/Markdown 时不含头像</p></div></div>';
  hh += flds.map(function (f) {
    let inputHtml;
    if (f.t === 'select') {
      const opts = (f.options || []).map(function (o) { return '<option value="' + esc(o) + '"' + ((profile && profile[f.n]) === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
      inputHtml = '<select name="profile.' + f.n + '">' + opts + '</select>';
    } else {
      inputHtml = '<input type="' + (f.t === 'date' ? 'date' : 'text') + '" name="profile.' + f.n + '" value="' + esc(profile && profile[f.n] ? profile[f.n] : '') + '"' + (f.p ? ' placeholder="' + f.p + '"' : '') + '>';
    }
    return '<div class="editor-field"><label>' + f.l + '</label>' + inputHtml + '</div>';
  }).join('');
  // ponytail: 期望薪资 (三框联动) + 期望城市 (多选 textarea), 跟扁平 profile 字段分开处理.
  const salary = (profile && profile.expectSalary) || {};
  hh += '<div class="editor-field"><label>期望薪资 (K/月)</label><div class="expect-salary-row">' +
    '<input type="number" name="profile.expectSalary.low" value="' + esc(salary.low || '') + '" placeholder="下限" min="0">' +
    '<span> - </span>' +
    '<input type="number" name="profile.expectSalary.high" value="' + esc(salary.high || '') + '" placeholder="上限" min="0">' +
    '<span> × </span>' +
    '<input type="number" name="profile.expectSalary.months" value="' + esc(salary.months || '') + '" placeholder="月数" min="0">' +
    '</div></div>';
  hh += '<div class="editor-field"><label>期望城市 (每行一条)</label><textarea name="profile.expectCities" placeholder="北京&#10;上海">' + esc((profile && Array.isArray(profile.expectCities) ? profile.expectCities.join('\n') : '') || '') + '</textarea></div>';
  return hh;
}

function collectFormData(opts) {
  const ec = document.getElementById('editorContent'); if (!ec) return;
  const nd = { profile: Object.assign({}, cvData.profile || {}), sections: cvData.sections ? cvData.sections.map(function (s) {
    // ponytail: Object.assign 是浅拷, sections[i].items 仍指向原数组. 若两份 sections 共用
    // 同一个 items 引用 (历史数据/外部导入异常), push 会越界加到所有共用方. 用 slice 拆掉
    // 数组级引用即可, 内部对象仍共享 — collectFormData 只在已有 item 上写字段, 不替换对象本身.
    const copy = Object.assign({}, s);
    if (Array.isArray(s.items)) copy.items = s.items.slice();
    return copy;
  }) : [] };
  ec.querySelectorAll('[name^="profile."]').forEach(function (el) {
    const parts = el.name.split('.'); parts.shift();
    // ponytail: number input 走 Number() 转 number 类型 (跟文档契约 { low: 7, high: 10, months: 12 } 一致),
    // 空字符串保留空字符串让 delete expectSalary 逻辑判断.
    const v = el.type === 'number' ? (el.value === '' ? '' : Number(el.value)) : el.value;
    if (parts.length === 1) { nd.profile[parts[0]] = v; return; }
    // 嵌套路径 (expectSalary.low / expectSalary.high / expectSalary.months).
    let cursor = nd.profile; for (let i = 0; i < parts.length - 1; i++) { if (!cursor[parts[i]] || typeof cursor[parts[i]] !== 'object') cursor[parts[i]] = {}; cursor = cursor[parts[i]]; }
    cursor[parts[parts.length - 1]] = v;
  });
  // ponytail: expectCities (textarea) 走 split('\n').filter(Boolean) 转 string[], checkbox profile 字段无.
  const ecTextarea = document.querySelector('textarea[name="profile.expectCities"]');
  if (ecTextarea) nd.profile.expectCities = ecTextarea.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  // ponytail: expectSalary 三个字段 (low/high/months) 任意一个非空就保留对象, 都空时 delete.
  // 用 === '' / === undefined 判断而非 !, 因为 number 0 是合法薪资 (0K 起步) 不能误删, '' 是 number input 清空后的 string.
  if (nd.profile.expectSalary && nd.profile.expectSalary.low === '' && nd.profile.expectSalary.high === '' && nd.profile.expectSalary.months === '') delete nd.profile.expectSalary;
  // ponytail: expectCities 老数据可能是 string, 走 arr() 拆.
  if (nd.profile.expectCities && typeof nd.profile.expectCities === 'string') nd.profile.expectCities = arr(nd.profile.expectCities);
  ec.querySelectorAll('[name^="sectionTitle."]').forEach(function (el) { const i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].title = el.value; });
  ec.querySelectorAll('[name^="sectionSummary."]').forEach(function (el) { const i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) {
    // ponytail: 默认占位 items: [""], 空 textarea 经过 filter(Boolean) 会变成 [], 让新建的空
    // summary 模块在首次 collectFormData 后被预览当成空模块隐藏掉. 若原 items 是 [""] 占位且
    // 用户没输入, 保留原 items; 否则按行切.
    const orig = cvData.sections[i] && cvData.sections[i].items;
    const isPlaceholder = orig && orig.length === 1 && orig[0] === '';
    if (el.value === '' && isPlaceholder) { /* keep nd.sections[i].items as-is (shallow copy of [""]) */ }
    else nd.sections[i].items = el.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
  } });
  ec.querySelectorAll('[name^="sectionText."]').forEach(function (el) { const i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].content = el.value; });
  ec.querySelectorAll('[name^="item."]').forEach(function (el) {
    const ps = el.name.split('.'), si = parseInt(ps[1], 10), ii = parseInt(ps[2], 10), fi = ps[3];
    if (!nd.sections[si]) return;
    if (!nd.sections[si].items) nd.sections[si].items = [];
    if (!nd.sections[si].items[ii]) nd.sections[si].items[ii] = {};
    // ponytail: checkbox 转 boolean — el.checked 才是真正状态, el.value 永远是 '1'.
    // 数组字段 (textarea + a:true) 走 arr() 统一拆分, 防止 collectFormData 把字符串塞给渲染层.
    const isCheckbox = el.type === 'checkbox';
    nd.sections[si].items[ii][fi] = isCheckbox ? !!el.checked : el.value;
  });
  (nd.sections || []).forEach(function (s) {
    if (s.type === 'text' || s.type === 'summary') return;
    const arrKeys = arrFieldsOf(SECTION_CONFIG[s.type]);
    (s.items || []).forEach(function (item) {
      delete item.challenges;
      arrKeys.forEach(function (k) { if (item[k] && typeof item[k] === 'string') item[k] = arr(item[k]); });
    });
  });
  cvData = nd; if (!(opts && opts.skipSave)) saveCvData();
}
let liveSyncTimer = null;
function liveSyncPreview() {
  if (liveSyncTimer) clearTimeout(liveSyncTimer);
  liveSyncTimer = setTimeout(function () {
    collectFormData({ skipSave: true });
    // ponytail: 同步更新编辑器里 module-type-label — 用户改了 sec.title 后 headerLabel 跟着变,
    // 避免视觉上 "label 跟 title 输入框内容不一致". 只改文字, 不重建 DOM, 保留 input focus.
    (cvData.sections || []).forEach(function (s, i) {
      const mod = document.querySelector('.editor-section.editor-module[data-section-index="' + i + '"]');
      if (mod) { const lb = mod.querySelector('.module-type-label'); if (lb) lb.textContent = moduleLabel(s); }
    });
    renderCv();
    syncResumeLayout();
    const focused = document.activeElement;
    if (focused && focused.matches && focused.matches('input, textarea, select')) scrollPreviewToSection(focused);
  }, 50);
}
function scrollPreviewToSection(input) { if (!input || !input.closest) return; const section = input.closest('.editor-section'); if (!section) return; if (section.classList.contains('editor-section-prefs')) return; let el = null; const itemMatch = (input.name || '').match(/^item\.(\d+)\.(\d+)\./); if (itemMatch) { const items = document.querySelectorAll('.resume-pages .resume-section[data-section-index="' + itemMatch[1] + '"] [data-render-list] > *'); el = items[parseInt(itemMatch[2], 10)] || null; } else { const dataIdx = section.dataset.sectionIndex; if (dataIdx !== undefined) el = document.querySelector('.resume-pages .resume-section[data-section-index="' + dataIdx + '"]'); else { const h3 = section.querySelector('h3'); if (h3 && h3.textContent.trim() === '个人信息') el = document.querySelector('.resume-pages .resume-header'); } } if (!el) return; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.remove('preview-highlight'); void el.offsetWidth; el.classList.add('preview-highlight'); }

function openEditor() { const ep = document.getElementById('editorPanel'), mb = document.getElementById('menuBtn'); if (!ep) return; ep.hidden = false; ep.classList.add('is-open'); if (mb) mb.textContent = '×'; buildEditorForm(); updateStageSize(); }
function closeEditor() { const ep = document.getElementById('editorPanel'), mb = document.getElementById('menuBtn'); if (!ep) return; ep.classList.remove('is-open'); ep.hidden = true; if (mb) mb.textContent = '☰'; renderCv(); syncResumeLayout(); updateStageSize(); }
function toggleEditor() { const ep = document.getElementById('editorPanel'); if (!ep) return; if (ep.classList.contains('is-open')) closeEditor(); else openEditor(); }
function closeAllDropdowns() { document.querySelectorAll('.dropdown.open').forEach(function (d) { d.classList.remove('open'); }); const m = document.getElementById('addSectionMenu'); if (m) m.hidden = true; }

function moveSection(idx, dir) { collectFormData(); const ni = idx + dir; if (ni < 0 || ni >= cvData.sections.length) return; const t = cvData.sections[idx]; cvData.sections[idx] = cvData.sections[ni]; cvData.sections[ni] = t; saveCvData(); buildEditorForm(); }
function removeSection(idx) { collectFormData(); if (!confirm('确定要删除此模块吗？')) return; cvData.sections.splice(idx, 1); saveCvData(); buildEditorForm(); }
function addItem(idx) { collectFormData(); const s = cvData.sections[idx]; if (!s) return; if (!s.items) s.items = []; s.items.push(getDefaultItem(s.type)); saveCvData(); buildEditorForm(); }
function removeItem(si, ii) { collectFormData(); const s = cvData.sections[si]; if (!s || !s.items) return; if (!confirm('确定要移除该项吗？')) return; s.items.splice(ii, 1); saveCvData(); buildEditorForm(); }
function moveItem(si, ii, dir) { collectFormData(); const items = (cvData.sections[si] || {}).items; if (!items) return; const ni = ii + dir; if (ni < 0 || ni >= items.length) return; const t = items[ii]; items[ii] = items[ni]; items[ni] = t; saveCvData(); buildEditorForm(); }
function copyItem(si, ii) { collectFormData(); const s = cvData.sections[si]; if (!s || !s.items) return; const clone = JSON.parse(JSON.stringify(s.items[ii])); s.items.splice(ii + 1, 0, clone); saveCvData(); buildEditorForm(); }

function getDefaultSection(type) { let cfg = SECTION_CONFIG[type]; if (!cfg) cfg = SECTION_CONFIG.experience; if (cfg.defaultSection) return cfg.defaultSection(); return { type: type, title: cfg.label, items: [JSON.parse(JSON.stringify(cfg.defaultItem))] }; }
function getDefaultItem(type) { const cfg = SECTION_CONFIG[type]; return cfg && cfg.defaultItem ? JSON.parse(JSON.stringify(cfg.defaultItem)) : {}; }

function bindEditorEvents() {
  document.getElementById('closeEditor') && document.getElementById('closeEditor').addEventListener('click', closeEditor);
  document.getElementById('menuBtn') && document.getElementById('menuBtn').addEventListener('click', toggleEditor);
  document.getElementById('saveData') && document.getElementById('saveData').addEventListener('click', function () { collectFormData(); closeEditor(); });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') { const ep = document.getElementById('editorPanel'); if (ep && ep.classList.contains('is-open')) closeEditor(); } });
  const editorPanelForSync = document.getElementById('editorPanel');
  if (editorPanelForSync) {
    editorPanelForSync.addEventListener('focusin', function (ev) { if (ev.target.matches && ev.target.matches('input, textarea, select')) scrollPreviewToSection(ev.target); });
    editorPanelForSync.addEventListener('input', liveSyncPreview);
  }
  document.addEventListener('click', function (ev) {
    const cb = ev.target.closest('[data-action="toggle-section-collapse"]'); if (cb) { const i = parseInt(cb.dataset.index, 10); const sec = document.querySelector('.editor-section.editor-module[data-section-index="' + i + '"]'); if (sec) sec.classList.toggle('is-collapsed'); return; }
    const ab = ev.target.closest('[data-action]'); if (ab) { const a = ab.dataset.action; if (a === 'move-section-up' || a === 'move-section-down' || a === 'remove-section') { const i = parseInt(ab.dataset.index, 10); if (a === 'move-section-up') { moveSection(i, -1); return; } if (a === 'move-section-down') { moveSection(i, 1); return; } if (a === 'remove-section') { removeSection(i); return; } } else { const si = parseInt(ab.dataset.sectionIndex, 10), ii = parseInt(ab.dataset.itemIndex, 10); if (a === 'move-item-up') { moveItem(si, ii, -1); return; } if (a === 'move-item-down') { moveItem(si, ii, 1); return; } if (a === 'copy-item') { copyItem(si, ii); return; } } }
    const ab2 = ev.target.closest('[data-action]'); if (ab2) { const a2 = ab2.dataset.action; if (a2 === 'import-json') { document.getElementById('fileImportInput').click(); return; } if (a2 === 'import-md') { document.getElementById('fileImportInput').click(); return; } if (a2 === 'export-json') { collectFormData(); exportJson(); return; } if (a2 === 'export-md') { collectFormData(); exportMarkdown(); return; } if (a2 === 'print') { exportPdf(); return; } if (a2 === 'export-pdf-image') { collectFormData(); exportPdfImage(); return; } }
    const aib = ev.target.closest('[data-add-item]'); if (aib) { addItem(parseInt(aib.dataset.addItem, 10)); return; }
    const rib = ev.target.closest('.editor-item-remove'); if (rib) { removeItem(parseInt(rib.dataset.sectionIndex, 10), parseInt(rib.dataset.itemIndex, 10)); return; }
    if (ev.target.closest('#addSectionBtn')) return;
    if (ev.target.closest('[data-add-type]')) return;
    if (ev.target.closest('[data-dropdown]')) { ev.stopPropagation(); const dd = ev.target.closest('[data-dropdown]'); const p = dd.closest('.dropdown'); const wo = p && p.classList.contains('open'); closeAllDropdowns(); if (p && !wo) p.classList.add('open'); return; }
    closeAllDropdowns();
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'avatarFileInput') {
      const f = ev.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = function (e) {
        const base64 = e.target.result;
        const name = (cvData && cvData.profile && cvData.profile.name) || 'default';
        saveAvatar(name, base64);
        const pv = document.getElementById('avatarPreview');
        if (pv) pv.style.backgroundImage = "url('" + base64 + "')";
        const ai = document.querySelector('input[name="profile.avatar"]');
        if (ai) ai.value = '';
        collectFormData();
        buildEditorForm();
      };
      r.readAsDataURL(f);
      return;
    }
    if (ev.target.id === 'fileImportInput') { if (ev.target.files[0]) importData(ev.target.files[0]); ev.target.value = ''; return; }
  });
  document.addEventListener('click', function (ev) {
    if (ev.target.closest('#clearAvatarBtn')) {
      const name = (cvData && cvData.profile && cvData.profile.name) || 'default';
      clearAvatar(name);
      const ai = document.querySelector('input[name="profile.avatar"]');
      if (ai) ai.value = '';
      collectFormData();
      buildEditorForm();
      return;
    }
  });
}
