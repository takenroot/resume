/* ===========================================================
   CV 简历网页 — 数据驱动渲染引擎
   =========================================================== */
function createSectionDOM(idx) {
  const s = cE('section', 'resume-section'); s.setAttribute('data-section-index', idx);
  const cls = (cvData.sections[idx] && SECTION_CONFIG[cvData.sections[idx].type] ? SECTION_CONFIG[cvData.sections[idx].type].containerClass : '') || '';
  s.innerHTML = '<div class="section-heading"><h2></h2></div><div data-render-list="' + idx + '" class="' + cls + '"></div>';
  return s;
}

function renderSectionContent(listEl, idx) {
  const sec = cvData.sections[idx], cfg = SECTION_CONFIG[sec.type]; if (!cfg) return;
  listEl.replaceChildren();
  if (cfg.contentField) { const el = cfg.renderContent(cfg.contentField === 'items' ? sec.items : sec.content); if (el) listEl.appendChild(el); return; }
  (sec.items || []).forEach(function (item) { listEl.appendChild(cfg.renderItem(item)); });
}

// ponytail: 必备行 icon — 统一 24 viewBox Material 风格路径, 只存 path 串, 使用时拼 svg.
const IDENTITY_ICONS = {
  title: 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z',
  phone: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z',
  email: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  cities: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
  experience: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.2 14.2L11 13V7h1.5v5.2l4.5 2.7-.8 1.3z'
};
function iconSvg(path) { return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="icon-svg"><path d="' + path + '"/></svg>'; }

// ponytail: 必备行 — icon + 值, 浓缩一行 (职位/电话/意向城市/经验), 空字段不显示.
// 电话保留点击复制 (identity-action 是 app.js 复制委托的钩子类). 意向城市取 expectJobs[0].cities, 显隐跟 expectJobs 开关走.
// 邮箱值长易挤破行, 放胶囊层 (renderIdentityLine).
function renderIdentityEssential(p) {
  const el = document.getElementById('identityEssential'); if (!el) return;
  el.replaceChildren();
  // ponytail: 必备行布局开关 — flow 自动换行 (默认) / grid 表格对齐, 存 prefs.essentialLayout.
  el.classList.toggle('layout-grid', typeof cvPrefs === 'object' && cvPrefs && cvPrefs.essentialLayout === 'grid');
  const ej = (Array.isArray(p.expectJobs) && p.expectJobs[0]) || {};
  const cities = Array.isArray(ej.cities) && ej.cities.length ? ej.cities.join('/') : '';
  const items = [['title', p.title], ['phone', p.phone, 'copy'], ['cities', cities, null, 'expectJobs'], ['experience', p.experience]];
  let count = 0;
  items.forEach(function (it) {
    const iconKey = it[0], v = it[1], visKey = it[3] || iconKey;
    if (!v || !String(v).trim() || !isProfileShown(visKey)) return;
    let node;
    if (it[2] === 'copy') { node = document.createElement('button'); node.type = 'button'; node.dataset.copy = v; node.setAttribute('aria-label', '复制' + v); }
    else node = document.createElement('span');
    node.className = it[2] === 'copy' ? 'identity-item identity-action' : 'identity-item';
    node.innerHTML = iconSvg(IDENTITY_ICONS[iconKey]);
    node.appendChild(document.createTextNode(v));
    el.appendChild(node);
    count++;
  });
  el.style.display = count ? '' : 'none';
}

// ponytail: 胶囊行均衡装箱 — 纯函数, 可单测. 视觉优先于语义顺序 (用户已确认): 按宽度降序 FFD 装箱.
// 规则: ≥0.8W 独占行; 其余塞进第一个还装得下的行 (含 gap); 都装不下开新行.
// 已知边缘: 全是 ~0.7W 的尴尬尺寸时会出现 <80% 的中间行, 放行不 DP.
function packPillRows(widths, W, gap) {
  const order = widths.map(function (w, i) { return [w, i]; }).sort(function (a, b) { return b[0] - a[0]; });
  const rows = []; // { idxs, w, solo }
  order.forEach(function (wi) {
    const w = wi[0], i = wi[1];
    if (w >= 0.8 * W) { rows.push({ idxs: [i], w: w, solo: true }); return; }
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (row.solo) continue;
      if (row.w + gap + w <= W) { row.idxs.push(i); row.w += gap + w; return; }
    }
    rows.push({ idxs: [i], w: w, solo: false });
  });
  return rows.map(function (r) { return r.idxs; });
}

// ponytail: 渲染后测宽重排 — 两遍布局; W 取同 header 里必备行宽 (分页克隆里也有), 量不到 (隐藏/测试桩) 直接跳过.
// 调用点: renderIdentityLine 末尾 (source 可见时, 移动端) + paginateResume 末尾 (桌面分页克隆).
function reflowPillRows(el) {
  if (!el) return;
  const pills = Array.prototype.slice.call(el.children);
  if (pills.length < 2) return;
  const hd = el.parentElement;
  const ess = hd && hd.querySelector ? hd.querySelector('.identity-essential') : null;
  const W = (ess && ess.offsetWidth) || el.offsetWidth;
  if (!W) return;
  const gap = parseFloat(getComputedStyle(el).columnGap) || 8;
  const rows = packPillRows(pills.map(function (n) { return n.offsetWidth; }), W, gap);
  rows.forEach(function (row, ri) {
    if (ri > 0) { const br = document.createElement('span'); br.className = 'pill-row-break'; el.appendChild(br); }
    row.forEach(function (pi) { el.appendChild(pills[pi]); }); // appendChild 已有节点 = 移动, DOM 顺序即行顺序
  });
}

// ponytail: 胶囊层 — 必备行之外的可选字段 (籍贯/求职状态/GitHub/微信/邮箱) + 期望标签 (expectJobs[0] 派生).
// GitHub 跳转, 邮箱点击复制 (identity-action + span 值, flashCopiedState 需要 span 子节点). 邮箱长值在这层不怕换行.
// expectJobs 关掉 = 期望职位/薪资全关 (意向城市在必备行, 同一开关). 空字段不渲染.
function renderIdentityLine(p) {
  const el = document.getElementById('identityLine'); if (!el) return;
  el.replaceChildren();
  let count = 0;
  const addPill = function (node) { el.appendChild(node); count++; };
  const items = [['location', '籍贯'], ['jobStatus', '求职状态'], ['github', 'GitHub', 'link'], ['wechat', '微信'], ['email', '邮箱', 'copy']];
  items.forEach(function (it) {
    const k = it[0], v = p[k];
    if (!v || !String(v).trim() || !isProfileShown(k)) return;
    let node;
    if (it[2] === 'link') { node = document.createElement('a'); node.href = (String(v).startsWith('http') ? '' : 'https://') + v; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    else if (it[2] === 'copy') { node = document.createElement('button'); node.type = 'button'; node.dataset.copy = v; node.setAttribute('aria-label', '复制' + v); }
    else node = document.createElement('span');
    node.className = it[2] === 'copy' ? 'identity-pill identity-action' : 'identity-pill';
    node.innerHTML = '<em>' + it[1] + '</em>' + (it[2] === 'copy' ? '<span>' + esc(String(v)) + '</span>' : esc(String(v)));
    addPill(node);
  });
  const ej = (Array.isArray(p.expectJobs) && p.expectJobs[0]) || {};
  const sal = ej.salary || {};
  const tags = [];
  if (isProfileShown('expectJobs')) {
    if (ej.title && String(ej.title).trim()) tags.push({ k: '期望职位', v: ej.title + (ej.jobType ? ' · ' + ej.jobType : '') });
    if (sal.low || sal.high) tags.push({ k: '期望薪资', v: (sal.low || '?') + '-' + (sal.high || '?') + 'K' });
  }
  if (isProfileShown('expectIndustry') && p.expectIndustry && String(p.expectIndustry).trim()) tags.push({ k: '期望行业', v: p.expectIndustry });
  tags.forEach(function (t) {
    const tag = document.createElement('span');
    tag.className = 'identity-pill';
    tag.innerHTML = '<em>' + esc(t.k) + '</em>' + esc(t.v);
    addPill(tag);
  });
  el.style.display = count ? '' : 'none';
  reflowPillRows(el);
}

function renderCv() {
  if (!cvData) return; const d = cvData;
  document.querySelectorAll('[data-render]').forEach(function (el) {
    const key = el.dataset.render, ps = key.split('.');
    let v = d[ps[0]];
    for (let i = 1; v != null && i < ps.length; i++) v = v[ps[i]];
    if (el.tagName === 'A') { if (v) el.href = (v.startsWith('http') ? '' : 'https://') + v; }
    else if (el.tagName === 'BUTTON') { if (v) el.dataset.copy = v; }
    else if (el.classList.contains('resume-avatar')) {
      let url = v;
      if (!url && d.profile && d.profile.name) { const local = loadAvatar(d.profile.name); if (local) url = local; }
      if (url) el.style.setProperty('--avatar-image', "url('" + url + "')");
      // ponytail: 头像显隐 = prefs 开关 && 有图. 无图时收起整个头像列, 不留空占位框.
      document.body.classList.toggle('no-avatar', !url || (typeof cvPrefs === 'object' && cvPrefs && cvPrefs.showAvatar === false));
    }
    else { if (v && !(el.children.length > 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) { el.textContent = v; el.classList.remove('is-empty'); } else if (!v) { el.classList.add('is-empty'); } }
  });
  renderIdentityEssential(d.profile || {});
  renderIdentityLine(d.profile || {});
  if (d.profile && d.profile.title) document.title = d.profile.name + ' - ' + d.profile.title;
  const rs = document.getElementById('resumeSource'); if (!rs) return;
  const hd = rs.querySelector('.resume-header'); rs.replaceChildren(); if (hd) rs.appendChild(hd);
  (d.sections || []).forEach(function (sec, i) { const dom = createSectionDOM(i); const h2 = dom.querySelector('h2'); if (h2) h2.textContent = sec.title || (SECTION_CONFIG[sec.type] || {}).label || ''; rs.appendChild(dom); const le = dom.querySelector('[data-render-list]'); if (le) renderSectionContent(le, i); });
}
