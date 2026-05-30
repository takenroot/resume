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

function buildEditorSectionForm(sec, idx) {
  const cfg = SECTION_CONFIG[sec.type]; if (!cfg) return '';
  let hh = '<div class="editor-section editor-module" data-section-index="' + idx + '">';
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
  let hh = '<div class="editor-item" data-section-index="' + si + '" data-item-index="' + ii + '">';
  hh += '<div class="editor-item-header"><span>#' + (ii + 1) + '</span><div class="item-header-actions">';
  hh += '<button type="button" class="item-action-btn" data-action="move-item-up" data-section-index="' + si + '" data-item-index="' + ii + '" title="上移"' + (ii === 0 ? ' disabled' : '') + '>↑</button>';
  hh += '<button type="button" class="item-action-btn" data-action="move-item-down" data-section-index="' + si + '" data-item-index="' + ii + '" title="下移">↓</button>';
  hh += '<button type="button" class="item-action-btn" data-action="copy-item" data-section-index="' + si + '" data-item-index="' + ii + '" title="复制">⧉</button>';
  hh += '<button type="button" class="editor-item-remove" data-section-index="' + si + '" data-item-index="' + ii + '" aria-label="移除">×</button></div></div>';
  hh += '<div class="editor-item-content">';
  fields.forEach(function (f) { const v = item[f.n] || '', dv = f.a ? (Array.isArray(v) ? v.join(f.n === 'tags' ? ', ' : '\n') : v) : v; hh += '<div class="editor-field"><label>' + f.l + '</label>' + (f.t === 'textarea' ? '<textarea name="item.' + si + '.' + ii + '.' + f.n + '">' + esc(dv) + '</textarea>' : '<input name="item.' + si + '.' + ii + '.' + f.n + '" value="' + esc(dv) + '">') + '</div>'; });
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
  return '<div class="editor-section editor-section-prefs"><h3>页面设置</h3><div class="prefs-row"><div class="editor-field"><label>主题配色</label><select id="prefTheme">' + to + '</select></div><div class="editor-field"><label>字号</label><select id="prefFontSize">' + so + '</select></div><div class="editor-field"><label>字体</label><select id="prefFontFamily">' + fo + '</select></div></div><div class="prefs-row" style="margin-top:12px"><div class="editor-field"><label>时间轴 · 教育取</label><select id="prefTlEdu">' + ae + '</select></div><div class="editor-field"><label>时间轴 · 工作取</label><select id="prefTlExp">' + ax + '</select></div></div></div>';
}

function buildProfileFields(profile) {
  const av = profile && profile.avatar ? profile.avatar : '';
  const flds = [{ n: 'name', l: '姓名' }, { n: 'title', l: '岗位' }, { n: 'experience', l: '工作经验' }, { n: '所在地', l: '所在地' }, { n: 'gender', l: '性别' }, { n: 'age', l: '年龄' }, { n: 'phone', l: '电话' }, { n: 'email', l: '邮箱' }, { n: 'github', l: 'GitHub' }, { n: 'timeline', l: '顶部时间线', p: '留空则自动从经历中提取' }];
  let hh = '<div class="editor-field editor-field-avatar"><label>头像</label><div class="avatar-upload"><div class="avatar-preview" id="avatarPreview" style="' + (av ? "background-image: url('" + esc(av) + "')" : '') + '"></div><div class="avatar-upload-inputs"><input type="file" id="avatarFileInput" accept="image/*"><input type="text" name="profile.avatar" value="' + esc(av) + '" placeholder="图片路径，如 assets/avatar.png"></div><p style="font-size:11px;color:var(--text-soft);margin:4px 0 0">选择文件仅预览，请将图片手动保存到 site/assets/ 目录</p></div></div>';
  hh += flds.map(function (f) { return '<div class="editor-field"><label>' + f.l + '</label><input type="text" name="profile.' + f.n + '" value="' + esc(profile && profile[f.n] ? profile[f.n] : '') + '"' + (f.p ? ' placeholder="' + f.p + '"' : '') + '></div>'; }).join('');
  return hh;
}

function collectFormData() {
  const ec = document.getElementById('editorContent'); if (!ec) return;
  const nd = { profile: Object.assign({}, cvData.profile || {}), sections: cvData.sections ? cvData.sections.map(function (s) { return Object.assign({}, s); }) : [] };
  ec.querySelectorAll('[name^="profile."]').forEach(function (el) { nd.profile[el.name.split('.')[1]] = el.value; });
  ec.querySelectorAll('[name^="sectionTitle."]').forEach(function (el) { const i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].title = el.value; });
  ec.querySelectorAll('[name^="sectionSummary."]').forEach(function (el) { const i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].items = el.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); });
  ec.querySelectorAll('[name^="sectionText."]').forEach(function (el) { const i = parseInt(el.name.split('.')[1], 10); if (nd.sections[i]) nd.sections[i].content = el.value; });
  ec.querySelectorAll('[name^="item."]').forEach(function (el) { const ps = el.name.split('.'), si = parseInt(ps[1], 10), ii = parseInt(ps[2], 10), fi = ps[3]; if (!nd.sections[si]) return; if (!nd.sections[si].items) nd.sections[si].items = []; if (!nd.sections[si].items[ii]) nd.sections[si].items[ii] = {}; nd.sections[si].items[ii][fi] = el.value; });
  (nd.sections || []).forEach(function (s) { if (s.type === 'text' || s.type === 'summary') return; (s.items || []).forEach(function (item) { if (item.highlights && typeof item.highlights === 'string') item.highlights = item.highlights.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); if (item.tags && typeof item.tags === 'string') item.tags = item.tags.split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean); }); });
  cvData = nd; saveCvData();
}

function openEditor() { const ep = document.getElementById('editorPanel'), eo = document.getElementById('editorOverlay'); if (!ep || !eo) return; ep.hidden = false; eo.hidden = false; buildEditorForm(); }
function closeEditor() { const ep = document.getElementById('editorPanel'), eo = document.getElementById('editorOverlay'); if (!ep || !eo) return; ep.hidden = true; eo.hidden = true; renderCv(); syncResumeLayout(); updateStageSize(); }
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
  document.getElementById('editorOverlay') && document.getElementById('editorOverlay').addEventListener('click', closeEditor);
  document.getElementById('saveData') && document.getElementById('saveData').addEventListener('click', function () { collectFormData(); closeEditor(); });
  document.addEventListener('click', function (ev) {
    const ab = ev.target.closest('[data-action]'); if (ab) { const a = ab.dataset.action; if (a === 'move-section-up' || a === 'move-section-down' || a === 'remove-section') { const i = parseInt(ab.dataset.index, 10); if (a === 'move-section-up') { moveSection(i, -1); return; } if (a === 'move-section-down') { moveSection(i, 1); return; } if (a === 'remove-section') { removeSection(i); return; } } else { const si = parseInt(ab.dataset.sectionIndex, 10), ii = parseInt(ab.dataset.itemIndex, 10); if (a === 'move-item-up') { moveItem(si, ii, -1); return; } if (a === 'move-item-down') { moveItem(si, ii, 1); return; } if (a === 'copy-item') { copyItem(si, ii); return; } } }
    const ab2 = ev.target.closest('[data-action]'); if (ab2) { const a2 = ab2.dataset.action; if (a2 === 'import-json') { document.getElementById('fileImportInput').click(); return; } if (a2 === 'import-md') { document.getElementById('fileImportInput').click(); return; } if (a2 === 'export-json') { collectFormData(); exportJson(); return; } if (a2 === 'export-md') { collectFormData(); exportMarkdown(); return; } if (a2 === 'print') { exportPdf(); return; } if (a2 === 'export-pdf-searchable') { collectFormData(); exportPdfSearchable(); return; } }
    const aib = ev.target.closest('[data-add-item]'); if (aib) { addItem(parseInt(aib.dataset.addItem, 10)); return; }
    const rib = ev.target.closest('.editor-item-remove'); if (rib) { removeItem(parseInt(rib.dataset.sectionIndex, 10), parseInt(rib.dataset.itemIndex, 10)); return; }
    if (ev.target.closest('#addSectionBtn')) return;
    if (ev.target.closest('[data-add-type]')) return;
    if (ev.target.closest('[data-dropdown]')) { ev.stopPropagation(); const dd = ev.target.closest('[data-dropdown]'); const p = dd.closest('.dropdown'); const wo = p && p.classList.contains('open'); closeAllDropdowns(); if (p && !wo) p.classList.add('open'); return; }
    closeAllDropdowns();
  });
  document.addEventListener('change', function (ev) {
    if (ev.target.id === 'avatarFileInput') { const f = ev.target.files[0]; if (!f) return; const blobUrl = URL.createObjectURL(f); const pv = document.getElementById('avatarPreview'); if (pv) pv.style.backgroundImage = "url('" + blobUrl + "')"; const ai = document.querySelector('input[name="profile.avatar"]'); if (ai && !ai.value) ai.value = 'assets/avatar.png'; return; }
    if (ev.target.id === 'fileImportInput') { if (ev.target.files[0]) importData(ev.target.files[0]); ev.target.value = ''; return; }
  });
}
