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

function extractStartDate(period) {
  if (!period) return null;
  const m = period.match(/(\d{4}(?:\.\d{1,2})?)/);
  return m ? m[1] : null;
}

function getTimelineLabel(type, item) {
  if (type === 'education') return item[cvPrefs.timelineEduField] || '';
  if (type === 'experience') return item[cvPrefs.timelineExpField] || '';
  return '';
}

function autoTimeline() {
  const nodes = [];
  const st = { education:1, experience:1 };
  (cvData.sections || []).forEach(function(s) {
    if (!st[s.type]) return;
    (s.items || []).forEach(function(item) {
      const sd = extractStartDate(item.period);
      if (!sd) return;
      const lb = getTimelineLabel(s.type, item);
      if (!lb) return;
      nodes.push({ d: sd, l: lb });
    });
  });
  if (nodes.length === 0) return '';
  nodes.sort(function(a, b) { return a.d.localeCompare(b.d); });
  const segs = nodes.map(function(n) {
    return '<span class="tl-seg"><em class="tl-year">' + esc(n.d.substring(0,4)) + '</em><span class="tl-item">' + esc(n.l) + '</span></span>';
  });
  return segs.join('<span class="tl-arrow"> → </span>');
}

function renderCv() {
  if (!cvData) return; const d = cvData;
  document.querySelectorAll('[data-render]').forEach(function (el) {
    if (el.classList.contains('timeline-strip')) return;
    const key = el.dataset.render, ps = key.split('.'); let v = d[ps[0]];
    for (let i = 1; v != null && i < ps.length; i++) v = v[ps[i]];
    if (el.tagName === 'A') { if (v) el.href = (v.startsWith('http') ? '' : 'https://') + v; }
    else if (el.tagName === 'BUTTON') { if (v) el.dataset.copy = v; }
    else if (el.classList.contains('resume-avatar')) { if (v) el.style.setProperty('--avatar-image', "url('" + v + "')"); }
    else { if (v && !(el.children.length > 0 && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA')) el.textContent = v; }
  });
  if (d.profile && d.profile.title) document.title = d.profile.name + ' - ' + d.profile.title;
  const rs = document.getElementById('resumeSource'); if (!rs) return;
  const hd = rs.querySelector('.resume-header'); rs.replaceChildren(); if (hd) rs.appendChild(hd);
  (d.sections || []).forEach(function (sec, i) { const dom = createSectionDOM(i); const h2 = dom.querySelector('h2'); if (h2) h2.textContent = sec.title || (SECTION_CONFIG[sec.type] || {}).label || ''; rs.appendChild(dom); const le = dom.querySelector('[data-render-list]'); if (le) renderSectionContent(le, i); });
  const ts = document.querySelector('.timeline-strip');
  if (ts) {
    if (d.profile && d.profile.timeline) {
      ts.textContent = d.profile.timeline;
      ts.classList.remove('auto');
    } else {
      ts.innerHTML = autoTimeline();
      ts.classList.add('auto');
    }
  }
}
