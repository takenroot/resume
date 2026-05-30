/* ===========================================================
   CV 简历网页 — 缩放控制
   =========================================================== */
const MIN_SCALE = 1, MAX_SCALE = 1.3, STEP = 0.1, DEFAULT_SCALE = 1;
let currentScale = DEFAULT_SCALE, currentLayoutMode = 'desktop';

function clampScale(v) { return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Number(v.toFixed(2)))); }
function getLayoutMode() { return window.innerWidth <= MOBILE_BREAKPOINT ? 'mobile' : window.innerWidth <= TABLET_BREAKPOINT ? 'tablet' : 'desktop'; }
function getShellContentWidth() { const s = document.querySelector('.page-shell'); if (!s) return window.innerWidth; const st = window.getComputedStyle(s); return s.clientWidth - (parseFloat(st.paddingLeft) || 0) - (parseFloat(st.paddingRight) || 0); }
function getRenderRoot() { const rd = document.getElementById('resumeDocument'), rp = document.getElementById('resumePages'); if (!rd) return null; if (currentLayoutMode !== 'mobile' && rp && rp.childElementCount > 0) return rp; return document.getElementById('resumeSource') || rd; }
function getAutoScale(lm) { lm = lm || currentLayoutMode; const rr = getRenderRoot(); if (!rr) return 1; return lm === 'tablet' ? Math.min(1, getShellContentWidth() / rr.offsetWidth) : 1; }
function getEffectiveScale(lm) { lm = lm || currentLayoutMode; return lm === 'mobile' ? 1 : Number((currentScale * getAutoScale(lm)).toFixed(4)); }
function updateStageSize() { const root = document.documentElement, rr = getRenderRoot(); if (!rr) return; const es = getEffectiveScale(); root.style.setProperty('--effective-scale', es); if (currentLayoutMode === 'mobile') { root.style.setProperty('--stage-width', '100%'); root.style.setProperty('--stage-height', 'auto'); return; } root.style.setProperty('--stage-width', Math.ceil(rr.offsetWidth * es) + 'px'); root.style.setProperty('--stage-height', Math.ceil(rr.offsetHeight * es) + 'px'); }
function getPageMetrics() { const rr = getRenderRoot(); if (!rr) return null; const r = rr.getBoundingClientRect(); return { left: r.left + scrollX, top: r.top + scrollY }; }
function getViewportAnchor(sc) { const m = getPageMetrics(); if (!m) return null; return { offsetX: scrollX + innerWidth / 2 - m.left, offsetY: scrollY - m.top, scale: sc }; }
function updateToolbarState() { const zi = document.querySelector('[data-action="zoom-in"]'), zo = document.querySelector('[data-action="zoom-out"]'), re = document.querySelector('[data-action="reset"]'); if (zi) zi.disabled = currentScale >= MAX_SCALE; if (zo) zo.disabled = currentScale <= MIN_SCALE; if (re) { re.disabled = currentScale === DEFAULT_SCALE; re.textContent = Math.round(currentScale * 100) + '%'; } }
function updateScale(ns, pc) { const pvs = getEffectiveScale(), an = pc ? getViewportAnchor(pvs) : null; currentScale = clampScale(ns); updateStageSize(); updateToolbarState(); if (an) requestAnimationFrame(function () { const m = getPageMetrics(); if (!m) return; const ne = getEffectiveScale(), sr = ne / an.scale; scrollTo({ left: Math.max(0, m.left + an.offsetX * sr - innerWidth / 2), top: Math.max(0, m.top + an.offsetY * sr), behavior: 'auto' }); }); }
