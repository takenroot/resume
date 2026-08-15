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
  // 非空字段按顺序排列: 岗位 / 经验 / 所在地, 最后一个非空字段后面不追加 " | "
  const fields = ['title', 'experience', 'location'];
  const nonEmpty = fields.filter(function (k) { return p[k] && String(p[k]).trim(); });
  row.replaceChildren();
  nonEmpty.forEach(function (k, i) {
    const span = document.createElement('span'); span.className = 'hdr-item'; span.textContent = p[k];
    row.appendChild(span);
    if (i < nonEmpty.length - 1) row.appendChild(document.createTextNode(' | '));
  });
}

// ponytail: test/render-all-fields 分支. 把 profile 隐藏字段 (期望职位/薪资/城市/行业/微信) 都展示出来, 看布局.
// 期望薪资/城市从 expectJobs[0] 派生 (2026-08 起唯一事实源), expectIndustry/wechat = string.
// 字段为空时不输出对应 tag (整块 .header-extra 没内容则 hide).
function renderHeaderExtra(p) {
  const el = document.getElementById('headerExtra'); if (!el) return;
  el.replaceChildren();
  const tags = [];
  const ej = (Array.isArray(p.expectJobs) && p.expectJobs[0]) || {};
  const sal = ej.salary || {};
  if (sal.low || sal.high) {
    tags.push({ k: '期望薪资', v: (sal.low || '?') + '-' + (sal.high || '?') + 'K' });
  }
  if (Array.isArray(ej.cities) && ej.cities.length) {
    tags.push({ k: '期望城市', v: ej.cities.join(' / ') });
  }
  if (p.expectIndustry && String(p.expectIndustry).trim()) {
    tags.push({ k: '期望行业', v: p.expectIndustry });
  }
  if (p.wechat && String(p.wechat).trim()) {
    tags.push({ k: '微信', v: p.wechat });
  }
  if (!tags.length) { el.style.display = 'none'; return; }
  el.style.display = '';
  tags.forEach(function (t) {
    const tag = document.createElement('span');
    tag.className = 'header-extra-tag';
    tag.innerHTML = '<em>' + esc(t.k) + '</em>' + esc(t.v);
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
    }
    else { if (v && !(el.children.length > 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) { el.textContent = v; el.classList.remove('is-empty'); } else if (!v) { el.classList.add('is-empty'); } }
  });
  renderHeaderRow(d.profile || {});
  renderHeaderExtra(d.profile || {});
  if (d.profile && d.profile.title) document.title = d.profile.name + ' - ' + d.profile.title;
  const rs = document.getElementById('resumeSource'); if (!rs) return;
  const hd = rs.querySelector('.resume-header'); rs.replaceChildren(); if (hd) rs.appendChild(hd);
  (d.sections || []).forEach(function (sec, i) { const dom = createSectionDOM(i); const h2 = dom.querySelector('h2'); if (h2) h2.textContent = sec.title || (SECTION_CONFIG[sec.type] || {}).label || ''; rs.appendChild(dom); const le = dom.querySelector('[data-render-list]'); if (le) renderSectionContent(le, i); });
}
