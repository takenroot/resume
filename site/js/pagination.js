/* ===========================================================
   CV 简历网页 — A4 自动分页引擎
   =========================================================== */
// ponytail: 断点跟 CSS @media (max-width: 767px/1024px) 同步, JS 走 window.matchMedia 复用 CSS 媒体查询, 避免双源漂移.
const PAGINATION_OVERFLOW_TOLERANCE = 0;

function createPage(pn) { const rp = document.getElementById('resumePages'), p = cE('section', 'resume-page'); if (pn > 1) { p.classList.add('resume-page--continuation'); const b = cE('header', 'resume-page-banner'); b.setAttribute('aria-label', '分页信息'); b.innerHTML = '<span></span>'; p.appendChild(b); } const c = cE('div', 'resume-page-content'); p.appendChild(c); rp.appendChild(p); return { page: p, content: c, sections: new Map() }; }
function cloneSectionShell(ss) { const s = ss.cloneNode(false); const hd = Array.from(ss.children).find(function (c) { return c.classList && c.classList.contains('section-heading'); }); if (hd) s.appendChild(hd.cloneNode(true)); const rl = ss.querySelector('[data-render-list]'); if (rl) s.appendChild(rl.cloneNode(false)); return s; }
function ensureItemContainer(ps, ss, si) { if (ps.sections.has(si)) return ps.sections.get(si); const s = cloneSectionShell(ss); ps.content.appendChild(s); const ct = s.querySelector('[data-render-list]') || s; ps.sections.set(si, ct); return ct; }
function isOverflowing(ps) { return ps.content.scrollHeight > ps.content.clientHeight + PAGINATION_OVERFLOW_TOLERANCE; }
function updatePageBanners() { const rp = document.getElementById('resumePages'); if (!rp) return; const pages = Array.from(rp.children), total = pages.length; pages.forEach(function (p, i) { if (i === 0) return; const l = p.querySelector('.resume-page-banner span'); if (l) l.textContent = '第 ' + (i + 1) + ' 页 / 共 ' + total + ' 页'; }); }

// ponytail: M3 bullet 级分页 — 条目塞不进当前页时, 先在业绩列表边界剖开: 条目头 + 前 N 条 bullet
// 留本页, 剩余 bullet 带「(续)」标记续到下页 (顺序不变, 刀口从条目变细到 bullet).
// 防孤行: 条目头 + 至少 1 条 bullet 放得下才剖, 否则整件搬走. 可剖列表 = ul.item-section-list
// (业绩/荣誉/校园/亮点), 标签行 (.tag-list) / 简介 / 时间行不剖.
function flatLis(root) { const out = []; Array.from(root.querySelectorAll('ul.item-section-list')).forEach(function (ul) { Array.from(ul.children).forEach(function (li) { out.push({ ul: ul, li: li }); }); }); return out; }
function dropEmptyListSections(root) { Array.from(root.querySelectorAll('ul.item-section-list')).forEach(function (ul) { if (ul.children.length) return; const sec = ul.closest('.item-section'); if (sec) sec.remove(); else ul.remove(); }); }

function paginateResume() { const rs = document.getElementById('resumeSource'), rp = document.getElementById('resumePages'); if (!rs || !rp) return; rp.replaceChildren(); const hd = rs.querySelector('.resume-header'); if (!hd) return; const pss = []; let cp = createPage(1); pss.push(cp); cp.content.appendChild(hd.cloneNode(true)); const secs = Array.from(rs.children).filter(function (c) { return c.classList && c.classList.contains('resume-section'); }); secs.forEach(function (ss, si) { const rl = ss.querySelector('[data-render-list]'); const items = rl ? Array.from(rl.children) : []; if (items.length === 0) return; items.forEach(function (is) {
  let piece = is.cloneNode(true);
  while (piece) {
    const ct = ensureItemContainer(cp, ss, si);
    ct.appendChild(piece);
    if (!isOverflowing(cp)) break;
    const full = piece.cloneNode(true); // 剖分续件的取材 (shrink 会改 piece, 先留全量)
    const aLis = flatLis(piece), removed = [];
    // 从尾部逐条下移, 直到刚好不溢出 (留下能放下的最长前缀) 或只剩 1 条
    while (aLis.length - removed.length > 1 && isOverflowing(cp)) { const e = aLis[aLis.length - 1 - removed.length]; e.ul.removeChild(e.li); removed.unshift(e); }
    if (isOverflowing(cp)) {
      removed.forEach(function (e) { e.ul.appendChild(e.li); }); // 还原
      let itemCount = 0; cp.sections.forEach(function (c) { itemCount += c.children.length; });
      if (itemCount <= 1) break; // 独占一页都塞不下 (单条超页) → 硬放接受溢出, 对齐旧逻辑
      ct.removeChild(piece);
      if (!ct.children.length) { const sec = ct.closest('.resume-section'); if (sec) sec.remove(); cp.sections.delete(si); }
      cp = createPage(pss.length + 1); pss.push(cp);
      continue;
    }
    // 剖分成功: 续件 = 全量克隆去掉留本页的前缀
    const keep = aLis.length - removed.length, cont = full, cLis = flatLis(cont);
    for (let j = 0; j < keep; j++) cLis[j].ul.removeChild(cLis[j].li);
    dropEmptyListSections(piece); dropEmptyListSections(cont);
    const h3 = cont.querySelector('.item-head h3');
    if (h3) { const old = h3.querySelector('.item-cont-tag'); if (old) old.remove(); const t = cE('span', 'item-cont-tag'); t.textContent = '（续）'; h3.appendChild(t); }
    // ponytail: 续件瘦身 — 标签云/简介/链接是上页已读信息, 续页只留 标题(续) + 时间 + 剩余 bullet.
    Array.from(cont.querySelectorAll('.summary, .project-link, .item-subtitle.tag-list')).forEach(function (n) { n.remove(); });
    cp = createPage(pss.length + 1); pss.push(cp);
    piece = cont; // 续件下轮在新页重放, 自身仍超长会再剖/硬放
  }
}); });
  // ponytail: 胶囊装箱在可见克隆上重测 — source 此时 display:none 量不到宽度, reflow 里的 renderIdentityLine 调用对桌面端无效.
  if (typeof reflowPillRows === 'function') Array.from(rp.querySelectorAll('.identity-line')).forEach(reflowPillRows);
  updatePageBanners(); }
function syncResumeLayout() { const rd = document.getElementById('resumeDocument'); if (!rd) return; currentLayoutMode = getLayoutMode(); rd.dataset.layoutMode = currentLayoutMode; if (currentLayoutMode === 'mobile') { const rp = document.getElementById('resumePages'); if (rp) rp.replaceChildren(); rd.dataset.jsReady = 'true'; if (typeof reflowPillRows === 'function') reflowPillRows(document.querySelector('.resume-source .identity-line')); return; } rd.dataset.jsReady = 'true'; paginateResume(); }
function handleViewportChange() { syncResumeLayout(); updateStageSize(); }
