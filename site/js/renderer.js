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

// ponytail: 头部信息层 — 全部字段统一胶囊, flex-wrap 自动换行, 一层排完.
// 电话/邮箱保留点击复制, GitHub 保留跳转. 期望标签 (expectJobs[0] 派生) 带 <em> 标签名.
// 字段显隐走 prefs.profileHidden (isProfileShown), 空字段不渲染; expectJobs 关掉 = 三个期望标签全关.
function renderIdentityLine(p) {
  const el = document.getElementById('identityLine'); if (!el) return;
  el.replaceChildren();
  let count = 0;
  const addPill = function (node) { el.appendChild(node); count++; };
  const items = [['title'], ['experience'], ['phone', 'copy', '复制手机号'], ['email', 'copy', '复制邮箱'], ['location'], ['jobStatus'], ['github', 'link'], ['wechat']];
  items.forEach(function (it) {
    const k = it[0], v = p[k];
    if (!v || !String(v).trim() || !isProfileShown(k)) return;
    let node;
    if (it[1] === 'copy') { node = document.createElement('button'); node.type = 'button'; node.dataset.copy = v; node.setAttribute('aria-label', it[2]); }
    else if (it[1] === 'link') { node = document.createElement('a'); node.href = (String(v).startsWith('http') ? '' : 'https://') + v; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    else node = document.createElement('span');
    node.className = 'identity-pill';
    node.textContent = v;
    addPill(node);
  });
  const ej = (Array.isArray(p.expectJobs) && p.expectJobs[0]) || {};
  const sal = ej.salary || {};
  const tags = [];
  if (isProfileShown('expectJobs')) {
    if (ej.title && String(ej.title).trim()) tags.push({ k: '期望职位', v: ej.title + (ej.jobType ? ' · ' + ej.jobType : '') });
    if (sal.low || sal.high) tags.push({ k: '期望薪资', v: (sal.low || '?') + '-' + (sal.high || '?') + 'K' });
    if (Array.isArray(ej.cities) && ej.cities.length) tags.push({ k: '期望城市', v: ej.cities.join(' / ') });
  }
  if (isProfileShown('expectIndustry') && p.expectIndustry && String(p.expectIndustry).trim()) tags.push({ k: '期望行业', v: p.expectIndustry });
  tags.forEach(function (t) {
    const tag = document.createElement('span');
    tag.className = 'identity-pill';
    tag.innerHTML = '<em>' + esc(t.k) + '</em>' + esc(t.v);
    addPill(tag);
  });
  el.style.display = count ? '' : 'none';
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
  renderIdentityLine(d.profile || {});
  if (d.profile && d.profile.title) document.title = d.profile.name + ' - ' + d.profile.title;
  const rs = document.getElementById('resumeSource'); if (!rs) return;
  const hd = rs.querySelector('.resume-header'); rs.replaceChildren(); if (hd) rs.appendChild(hd);
  (d.sections || []).forEach(function (sec, i) { const dom = createSectionDOM(i); const h2 = dom.querySelector('h2'); if (h2) h2.textContent = sec.title || (SECTION_CONFIG[sec.type] || {}).label || ''; rs.appendChild(dom); const le = dom.querySelector('[data-render-list]'); if (le) renderSectionContent(le, i); });
}
