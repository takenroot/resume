/* ===========================================================
   CV 简历网页 — 编辑器（表单构建 + CRUD + 事件绑定）
   =========================================================== */
function buildEditorForm() {
  if (!cvData) return; const ec = document.getElementById('editorContent'); if (!ec) return;
  let hh = buildEditorPrefs() + '<div class="editor-section"><h3>个人信息 <button type="button" class="module-style-btn" data-style-modal="profile" aria-label="个人信息样式配置" title="样式配置">⚙</button></h3>' + buildProfileFields(cvData.profile) + '</div>';
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
// 支持的 f.t: 'select' / 'textarea' / 默认 input. f.a=true 数组字段自动 join('\n' 或 ', ').
// 是/否字段全部用 select (options: ['是', '否']) 替代 checkbox — UI 布局统一, value 是 string.
function renderItemFieldInput(f, v, name) {
  if (f.t === 'select') {
    // ponytail: 是/否字段归一后存 boolean, 比较前映射回 '是'/'否', 否则 false 时浏览器回退显示第一项 (是) 误导用户.
    const sv = typeof v === 'boolean' ? (v ? '是' : '否') : v;
    const opts = (f.options || []).map(function (o) { return '<option value="' + esc(o) + '"' + (sv === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
    return '<select name="' + name + '">' + opts + '</select>';
  }
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
  return '<div class="editor-section editor-section-prefs"><h3>页面设置</h3><div class="prefs-row"><div class="editor-field"><label>主题配色</label><select id="prefTheme">' + to + '</select></div><div class="editor-field"><label>字号</label><select id="prefFontSize">' + so + '</select></div><div class="editor-field"><label>字体</label><select id="prefFontFamily">' + fo + '</select></div></div><p class="prefs-hint">打印页边距请在浏览器打印对话框里设置（建议选「无」或「最小」，本项目 @page 已固定 0mm）</p></div>';
}

// ponytail: 头部显示开关 — 可切的是「头部会渲染的字段」全集 (含 expectJobs 派生块和头像).
// 状态存 prefs.profileHidden (视图层), 不进 profile 数据, 不影响导出/平台填充.
// ponytail: 通用样式配置弹窗 — open 时现取 cvPrefs 渲染 body (checkbox 状态总是最新),
// 里面的开关仍走 document 级 change 委托 (data-vis / data-vis-avatar / data-vis-layout), 挪位置不影响逻辑.
function openStyleModal(title, bodyHtml) {
  const m = document.getElementById('styleModal'); if (!m) return;
  document.getElementById('styleModalTitle').textContent = title;
  document.getElementById('styleModalBody').innerHTML = bodyHtml;
  m.hidden = false;
}
function closeStyleModal() { const m = document.getElementById('styleModal'); if (m) m.hidden = true; }

const HEADER_TOGGLES = [['title', '岗位'], ['experience', '工作经验'], ['phone', '电话'], ['email', '邮箱'], ['location', '籍贯'], ['jobStatus', '求职状态'], ['github', 'GitHub'], ['wechat', '微信'], ['expectJobs', '期望职位/薪资/城市'], ['expectIndustry', '期望行业']];

// ponytail: 版式预设 — 只是 ⚙ 开关组合的一键套餐, 派生不存储: 当前开关值全匹配才点亮,
// 改任何细节后两个预设都不亮 (= 自定义), 零状态同步问题.
const HEADER_PRESETS = [
  ['modern', '分层胶囊', { showAvatar: true, nameAlign: 'left', essentialIcons: true, plainText: false }],
  ['plain', '纯文本居中', { showAvatar: false, nameAlign: 'center', essentialIcons: false, plainText: true }]
];

// ponytail: 样式 radio 行 — label + 两/三选, name 带 pref. 前缀 (不匹配 collectFormData 白名单, 物理安全).
function styleRadioRow(label, pref, opts) {
  return '<div class="vis-toggles"><span class="vis-hint">' + label + '</span>' +
    opts.map(function (o) { return '<label class="vis-toggle"><input type="radio" name="pref.' + pref + '" data-vis-pref="' + pref + '" value="' + o[0] + '"' + (cvPrefs[pref] === o[0] ? ' checked' : '') + '>' + o[1] + '</label>'; }).join('') + '</div>';
}

function buildVisToggles() {
  return '<div class="editor-field"><label>版式预设</label><div class="vis-toggles">' +
    HEADER_PRESETS.map(function (pr) {
      const on = Object.keys(pr[2]).every(function (k) { return cvPrefs[k] === pr[2][k]; });
      return '<label class="vis-toggle"><input type="radio" name="headerPreset" data-vis-preset="' + pr[0] + '"' + (on ? ' checked' : '') + '>' + pr[1] + '</label>';
    }).join('') +
    '</div><p class="vis-hint">预设只是初始值, 下面的细节开关都可再调</p></div>' +
    '<div class="editor-field"><label>头部显示</label><div class="vis-toggles">' +
    HEADER_TOGGLES.map(function (t) { return '<label class="vis-toggle"><input type="checkbox" data-vis="' + t[0] + '"' + (isProfileShown(t[0]) ? ' checked' : '') + '>' + t[1] + '</label>'; }).join('') +
    '<label class="vis-toggle"><input type="checkbox" data-vis-avatar' + (cvPrefs.showAvatar !== false ? ' checked' : '') + '>头像</label>' +
    '</div><p class="vis-hint">只控制预览显示, 不影响数据与导出; 空字段本来就不显示</p></div>' +
    '<div class="editor-field"><label>细节样式</label>' +
    '<div class="vis-toggles"><span class="vis-hint">必备行布局</span>' +
    '<label class="vis-toggle"><input type="radio" name="essentialLayout" data-vis-layout="flow"' + (cvPrefs.essentialLayout !== 'grid' ? ' checked' : '') + '>自动换行</label>' +
    '<label class="vis-toggle"><input type="radio" name="essentialLayout" data-vis-layout="grid"' + (cvPrefs.essentialLayout === 'grid' ? ' checked' : '') + '>表格对齐</label>' +
    '</div>' +
    styleRadioRow('姓名对齐', 'nameAlign', [['left', '左对齐'], ['center', '居中']]) +
    styleRadioRow('头像形状', 'avatarShape', [['rounded', '圆角'], ['circle', '圆形'], ['square', '直角']]) +
    styleRadioRow('胶囊密度', 'pillDensity', [['compact', '紧凑'], ['loose', '宽松']]) +
    '<div class="vis-toggles"><span class="vis-hint">其它</span>' +
    '<label class="vis-toggle"><input type="checkbox" data-vis-plain' + (cvPrefs.plainText === true ? ' checked' : '') + '>纯文本 (| 分隔)</label>' +
    '<label class="vis-toggle"><input type="checkbox" data-vis-icons' + (cvPrefs.essentialIcons !== false ? ' checked' : '') + '>必备行图标</label>' +
    '<label class="vis-toggle"><input type="checkbox" data-vis-rule' + (cvPrefs.headerRule === true ? ' checked' : '') + '>头部分隔线</label>' +
    '</div></div>';
}

function buildProfileFields(profile) {
  const name = profile && profile.name ? profile.name : '';
  const av = profile && profile.avatar ? profile.avatar : '';
  const localAvatar = av ? av : loadAvatar(name);
  const hasLocalAvatar = !!loadAvatar(name);
  // ponytail: 隐藏字段 (currentSalary 等) 不在 PROFILE_FIELDS 里出现, 用户手写 JSON 才能填. cv-autofill 引擎读 schema.json 知道存在.
  // ponytail: 头部显示开关组已挪进 ⚙ 样式弹窗 (openStyleModal + buildVisToggles), 编辑区只留数据字段.
  let hh = '';
  hh += '<div class="editor-field editor-field-avatar"><label>头像</label><div class="avatar-upload"><div class="avatar-preview" id="avatarPreview" style="' + (localAvatar ? "background-image: url('" + esc(localAvatar) + "')" : '') + '"></div><div class="avatar-upload-inputs"><input type="file" id="avatarFileInput" accept="image/*">' + (hasLocalAvatar ? '<button type="button" class="editor-btn" id="clearAvatarBtn" style="font-size:12px;padding:4px 8px">清除头像</button>' : '') + '<input type="text" name="profile.avatar" value="' + esc(av) + '" placeholder="留空则使用浏览器本地头像"></div><p style="font-size:11px;color:var(--text-soft);margin:4px 0 0">选择图片后自动转为 base64 存入浏览器本地，导出 JSON/Markdown 时不含头像</p></div></div>';
  hh += PROFILE_FIELDS.filter(function (f) { return !f.custom; }).map(function (f) { return '<div class="editor-field"><label>' + f.l + '</label>' + renderProfileFieldInput(f, profile) + '</div>'; }).join('');
  // ponytail: expectJobs 单条目 (猎聘/智联期望职位), schema 是单元素数组 [{title, jobType, salary:{low,high}, cities[]}], 编辑器拍平.
  // 2026-08: expectSalary/expectCities 独立字段已删, 头部展示从 expectJobs[0] 派生 (renderer.js renderHeaderExtra).
  const ej = (profile && Array.isArray(profile.expectJobs) && profile.expectJobs[0]) || {};
  const ejs = ej.salary || {};
  hh += '<div class="editor-field"><label>期望职位</label><div class="expect-salary-row">' +
    '<input type="text" name="expectJobs.title" value="' + esc(ej.title || '') + '" placeholder="职位名">' +
    '<select name="expectJobs.jobType">' + ['', '全职', '兼职', '实习'].map(function (o) { return '<option value="' + o + '"' + ((ej.jobType || '') === o ? ' selected' : '') + '>' + (o || '工作性质') + '</option>'; }).join('') + '</select>' +
    '<input type="number" name="expectJobs.salaryLow" value="' + esc(ejs.low !== undefined ? ejs.low : '') + '" placeholder="薪资下限 K" min="0">' +
    '<span> - </span>' +
    '<input type="number" name="expectJobs.salaryHigh" value="' + esc(ejs.high !== undefined ? ejs.high : '') + '" placeholder="上限 K" min="0">' +
    '</div></div>';
  hh += '<div class="editor-field"><label>期望城市 (每行一条)</label><textarea name="expectJobs.cities">' + esc((Array.isArray(ej.cities) ? ej.cities.join('\n') : '') || '') + '</textarea></div>';
  return hh;
}

// ponytail: profile 字段的 input 拼接抽到顶层, 跟 renderItemFieldInput 对称.
// 支持的 f.t: 'select' / 'date' / 'textarea' (f.a 数组 join('\n')) / 默认 text. value 走 esc, 走 profile[f.n] 读现值.
function renderProfileFieldInput(f, profile) {
  const v = profile && profile[f.n];
  if (f.t === 'select') {
    const opts = (f.options || []).map(function (o) { return '<option value="' + esc(o) + '"' + (v === o ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('');
    return '<select name="profile.' + f.n + '">' + opts + '</select>';
  }
  if (f.t === 'textarea') {
    const dv = f.a && Array.isArray(v) ? v.join('\n') : v;
    return '<textarea name="profile.' + f.n + '"' + (f.p ? ' placeholder="' + f.p + '"' : '') + '>' + esc(dv || '') + '</textarea>';
  }
  return '<input type="' + (f.t === 'date' ? 'date' : 'text') + '" name="profile.' + f.n + '" value="' + esc(v || '') + '"' + (f.p ? ' placeholder="' + f.p + '"' : '') + '>';
}

// ponytail: 复合字段通用收集器 — 按 PROFILE_COMPOSITES 声明读 input (名字 = "复合名.后缀"),
// 类型 n=number / lines=每行一条数组, 可选目标路径 ('salary.low'). 空值叶子不落盘 (''/空数组直接跳过),
// 全空返回 undefined (调用端 delete). number 0 是合法薪资, 不当空值.
function collectComposite(name, spec, root) {
  const out = {}; let any = false;
  spec.fields.forEach(function (fd) {
    const el = root.querySelector('[name="' + name + '.' + fd[0] + '"]'); if (!el) return;
    let v = el.value;
    if (fd[1] === 'n') { if (v === '') return; v = Number(v); }
    else if (fd[1] === 'lines') { v = arr(v); if (v.length === 0) return; }
    if (v === '' || v === undefined) return;
    const path = (fd[2] || fd[0]).split('.');
    let cur = out; for (let i = 0; i < path.length - 1; i++) { cur[path[i]] = cur[path[i]] || {}; cur = cur[path[i]]; }
    cur[path[path.length - 1]] = v;
    any = true;
  });
  if (!any) return undefined;
  return spec.wrap1 ? [out] : out;
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
  const pSpecs = {}; PROFILE_FIELDS.forEach(function (f) { pSpecs[f.n] = f; });
  ec.querySelectorAll('[name^="profile."]').forEach(function (el) {
    const key = el.name.slice('profile.'.length);
    const spec = pSpecs[key];
    // ponytail: 白名单 — 未声明的 profile.* 输入不进数据. 复合字段 input 用 "复合名.后缀" (不带 profile. 前缀), 物理隔开.
    if (!spec) return;
    nd.profile[key] = spec.a ? arr(el.value) : el.value;
  });
  Object.keys(PROFILE_COMPOSITES).forEach(function (cn) {
    const out = collectComposite(cn, PROFILE_COMPOSITES[cn], ec);
    if (out === undefined) delete nd.profile[cn]; else nd.profile[cn] = out;
  });
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
    // ponytail: 统一走 el.value (input/textarea/select/select 是-否). checkbox 全部改 select 是/否 后不再有 el.type 区分.
    nd.sections[si].items[ii][fi] = el.value;
  });
  (nd.sections || []).forEach(function (s) {
    const cfg = SECTION_CONFIG[s.type];
    // ponytail: contentField 模块 (summary/text) 无 item 对象, 跳过数组字段归一.
    if (!cfg || cfg.contentField) return;
    const arrKeys = arrFieldsOf(cfg);
    (s.items || []).forEach(function (item) {
      arrKeys.forEach(function (k) { if (item[k] && typeof item[k] === 'string') item[k] = arr(item[k]); });
    });
  });
  cvData = nd;
  // ponytail: 统一归一 select 是/否 → boolean, 跟 loadCvData 一致, 避免老 string / 新 boolean 混在 localStorage.
  normalizeYesNoFields(cvData);
  if (!(opts && opts.skipSave)) saveCvData();
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
    const ab = ev.target.closest('[data-action]'); if (ab) { const a = ab.dataset.action;
      // ponytail: import-json / import-md 都触发同一个隐藏的 file input, 走 importData 根据扩展名分支解析.
      if (a === 'import-json' || a === 'import-md') { document.getElementById('fileImportInput').click(); return; }
      if (a === 'move-section-up' || a === 'move-section-down' || a === 'remove-section') { const i = parseInt(ab.dataset.index, 10); if (a === 'move-section-up') { moveSection(i, -1); return; } if (a === 'move-section-down') { moveSection(i, 1); return; } if (a === 'remove-section') { removeSection(i); return; } }
      else if (a === 'move-item-up' || a === 'move-item-down' || a === 'copy-item') { const si = parseInt(ab.dataset.sectionIndex, 10), ii = parseInt(ab.dataset.itemIndex, 10); if (a === 'move-item-up') { moveItem(si, ii, -1); return; } if (a === 'move-item-down') { moveItem(si, ii, 1); return; } if (a === 'copy-item') { copyItem(si, ii); return; } }
      else if (a === 'export-json') { collectFormData(); exportJson(); return; }
      else if (a === 'export-md') { collectFormData(); exportMarkdown(); return; }
      else if (a === 'print') { exportPdf(); return; }
      else if (a === 'export-png') { exportPng(); return; }
      else if (a === 'restore-backup') { restoreBackup(); return; }
      else if (a === 'copy-errors') { copyErrorReport(); return; }
      else if (a === 'reset-data') { if (confirm('重置将清空当前简历并恢复初始数据（当前数据会自动备份）。继续？')) { backupCvData('pre-reset'); resetCvData(); } return; }
    }
    const aib = ev.target.closest('[data-add-item]'); if (aib) { addItem(parseInt(aib.dataset.addItem, 10)); return; }
    const rib = ev.target.closest('.editor-item-remove'); if (rib) { removeItem(parseInt(rib.dataset.sectionIndex, 10), parseInt(rib.dataset.itemIndex, 10)); return; }
    if (ev.target.closest('#addSectionBtn')) return;
    if (ev.target.closest('[data-add-type]')) return;
    if (ev.target.closest('[data-dropdown]')) { ev.stopPropagation(); const dd = ev.target.closest('[data-dropdown]'); const p = dd.closest('.dropdown'); const wo = p && p.classList.contains('open'); closeAllDropdowns(); if (p && !wo) p.classList.add('open'); return; }
    const smb = ev.target.closest('[data-style-modal]'); if (smb) { openStyleModal('个人信息样式', buildVisToggles()); return; }
    if (ev.target.closest('[data-modal-close]')) { closeStyleModal(); return; }
    closeAllDropdowns();
  });
  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') closeStyleModal();
  });
  document.addEventListener('change', function (ev) {
    // ponytail: 头部显示开关 — checkbox 无 name, collectFormData 的白名单 ([name^=...]) 物理碰不到它.
    if (ev.target.dataset && ev.target.dataset.vis) {
      const k = ev.target.dataset.vis, i = cvPrefs.profileHidden.indexOf(k);
      if (ev.target.checked && i >= 0) cvPrefs.profileHidden.splice(i, 1);
      if (!ev.target.checked && i < 0) cvPrefs.profileHidden.push(k);
      savePrefs(); renderCv(); syncResumeLayout();
      return;
    }
    if (ev.target.hasAttribute && ev.target.hasAttribute('data-vis-avatar')) {
      // ponytail: 头像显隐的实际判定在 renderCv (开关 && 有图), 这里重渲染即可.
      cvPrefs.showAvatar = ev.target.checked; savePrefs(); renderCv();
      return;
    }
    if (ev.target.dataset && ev.target.dataset.visLayout) {
      cvPrefs.essentialLayout = ev.target.dataset.visLayout; savePrefs(); renderCv(); syncResumeLayout();
      return;
    }
    // ponytail: 版式预设 — 批量赋 prefs 后重渲染弹窗 body, 让所有开关状态跟预设同步.
    if (ev.target.dataset && ev.target.dataset.visPreset) {
      const pr = HEADER_PRESETS.find(function (x) { return x[0] === ev.target.dataset.visPreset; });
      if (!pr) return;
      Object.assign(cvPrefs, pr[2]); savePrefs(); applyPrefs(); renderCv(); syncResumeLayout();
      const mb = document.getElementById('styleModalBody'); if (mb) mb.innerHTML = buildVisToggles();
      return;
    }
    if (ev.target.hasAttribute && ev.target.hasAttribute('data-vis-plain')) {
      cvPrefs.plainText = ev.target.checked; savePrefs(); renderCv(); syncResumeLayout();
      return;
    }
    // ponytail: 头部样式 radio — 纯 CSS 变量, applyPrefs 即生效, 不重渲染.
    if (ev.target.dataset && ev.target.dataset.visPref) {
      cvPrefs[ev.target.dataset.visPref] = ev.target.value; savePrefs(); applyPrefs();
      return;
    }
    if (ev.target.hasAttribute && ev.target.hasAttribute('data-vis-icons')) {
      cvPrefs.essentialIcons = ev.target.checked; savePrefs(); applyPrefs();
      return;
    }
    if (ev.target.hasAttribute && ev.target.hasAttribute('data-vis-rule')) {
      cvPrefs.headerRule = ev.target.checked; savePrefs(); applyPrefs();
      return;
    }
    if (ev.target.id === 'avatarFileInput') {
      const f = ev.target.files[0];
      // ponytail: 选完即清空 input.value, 否则选同一文件不触发 change (换头像须切别的再切回来).
      ev.target.value = '';
      if (!f) return;
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
