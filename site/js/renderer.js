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

function renderHeaderRow(p) {
  const row = document.getElementById('headerRow'); if (!row) return;
  // 非空字段按顺序排列: 岗位 / 经验, 最后一个非空字段后面不追加 " | "
  const fields = ['title', 'experience'];
  const nonEmpty = fields.filter(function (k) { return p[k] && String(p[k]).trim() && isProfileShown(k); });
  row.replaceChildren();
  nonEmpty.forEach(function (k, i) {
    const span = document.createElement('span'); span.className = 'hdr-item'; span.textContent = p[k];
    row.appendChild(span);
    if (i < nonEmpty.length - 1) row.appendChild(document.createTextNode(' | '));
  });
}

// ponytail: H2 头部第 2 层 — 联系信息一行, · 分隔, 无 icon (字段密度高时 icon 是噪点).
// 电话/邮箱保留点击复制, GitHub 保留跳转. 字段显隐走 prefs.profileHidden (isProfileShown), 空字段不渲染.
function renderIdentityLine(p) {
  const el = document.getElementById('identityLine'); if (!el) return;
  el.replaceChildren();
  const items = [['phone', 'copy', '复制手机号'], ['email', 'copy', '复制邮箱'], ['location'], ['jobStatus'], ['github', 'link'], ['wechat']];
  let count = 0;
  items.forEach(function (it) {
    const k = it[0], v = p[k];
    if (!v || !String(v).trim() || !isProfileShown(k)) return;
    if (count > 0) el.appendChild(document.createTextNode(' · '));
    count++;
    let node;
    if (it[1] === 'copy') { node = document.createElement('button'); node.type = 'button'; node.dataset.copy = v; node.setAttribute('aria-label', it[2]); }
    else if (it[1] === 'link') { node = document.createElement('a'); node.href = (String(v).startsWith('http') ? '' : 'https://') + v; node.target = '_blank'; node.rel = 'noopener noreferrer'; }
    else node = document.createElement('span');
    node.className = 'identity-action';
    node.textContent = v;
    el.appendChild(node);
  });
  el.style.display = count ? '' : 'none';
}

// ponytail: H2 头部第 3 层 — 期望标签行. 期望职位/薪资/城市从 expectJobs[0] 派生 (2026-08 起唯一事实源).
// 整块显隐开关: expectJobs 关掉 = 三个期望标签全关. 字段为空时不输出对应 tag (整块没内容则 hide).
function renderHeaderExtra(p) {
  const el = document.getElementById('headerExtra'); if (!el) return;
  el.replaceChildren();
  const tags = [];
  const ej = (Array.isArray(p.expectJobs) && p.expectJobs[0]) || {};
  const sal = ej.salary || {};
  if (isProfileShown('expectJobs')) {
    if (ej.title && String(ej.title).trim()) {
      tags.push({ k: '期望职位', v: ej.title + (ej.jobType ? ' · ' + ej.jobType : '') });
    }
    if (sal.low || sal.high) {
      tags.push({ k: '期望薪资', v: (sal.low || '?') + '-' + (sal.high || '?') + 'K' });
    }
    if (Array.isArray(ej.cities) && ej.cities.length) {
      tags.push({ k: '期望城市', v: ej.cities.join(' / ') });
    }
  }
  if (isProfileShown('expectIndustry') && p.expectIndustry && String(p.expectIndustry).trim()) {
    tags.push({ k: '期望行业', v: p.expectIndustry });
  }
  if (!tags.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  tags.forEach(function (t, i) {
    if (i > 0) el.appendChild(document.createTextNode(' · '));
    const tag = document.createElement('span');
    tag.className = 'header-extra-tag';
    tag.innerHTML = '<em>' + esc(t.k) + '</em> ' + esc(t.v);
    el.appendChild(tag);
  });
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
  renderHeaderRow(d.profile || {});
  renderIdentityLine(d.profile || {});
  renderHeaderExtra(d.profile || {});
  if (d.profile && d.profile.title) document.title = d.profile.name + ' - ' + d.profile.title;
  const rs = document.getElementById('resumeSource'); if (!rs) return;
  const hd = rs.querySelector('.resume-header'); rs.replaceChildren(); if (hd) rs.appendChild(hd);
  (d.sections || []).forEach(function (sec, i) { const dom = createSectionDOM(i); const h2 = dom.querySelector('h2'); if (h2) h2.textContent = sec.title || (SECTION_CONFIG[sec.type] || {}).label || ''; rs.appendChild(dom); const le = dom.querySelector('[data-render-list]'); if (le) renderSectionContent(le, i); });
}
