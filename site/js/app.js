/* ===========================================================
   CV 简历网页 — 入口模块（复制 / 工具栏 / PDF导出 / 初始化）
   最后加载，依赖所有其他模块
   =========================================================== */

/* ---- 复制功能 ---- */
function copyText(v) { if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(v); return new Promise(function (rs) { const ta = document.createElement('textarea'); ta.value = v; ta.setAttribute('readonly', ''); ta.style.position = 'absolute'; ta.style.left = '-9999px'; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); rs(); }); }
function flashCopiedState(el) { const tn = el.querySelector('span'); if (!tn) return; const ol = el.dataset.originalLabel || tn.textContent.trim(); if (!el.dataset.originalLabel) el.dataset.originalLabel = ol; tn.textContent = '已复制'; setTimeout(function () { tn.textContent = ol; }, 1200); }
function bindCopyActions() { document.addEventListener('click', function (ev) { const el = ev.target.closest('.identity-action[data-copy]'); if (!el) return; ev.preventDefault(); const v = el.dataset.copy; if (!v) return; copyText(v).then(function () { flashCopiedState(el); }).catch(function (e) { console.error('Copy failed:', e); }); }); }

/* ---- 工具栏 ---- */
function bindToolbarActions() { document.addEventListener('click', function (ev) { const b = ev.target.closest('[data-action]'); if (!b) return; const a = b.dataset.action; if (a === 'zoom-in') updateScale(currentScale + STEP, true); else if (a === 'zoom-out') updateScale(currentScale - STEP, true); else if (a === 'reset') updateScale(DEFAULT_SCALE, true); else if (a === 'edit') openEditor(); }); }

/* ---- 导出 PDF（浏览器打印，文字可选中） ---- */
function exportPdf() {
  window.print();
}

/* ---- 导出 PDF（截图嵌入，文字不可选中） ---- */
function exportPdfSearchable() {
  exportPdf();
}
function init() { loadPrefs(); applyPrefs(); const rd = document.getElementById('resumeDocument'); if (rd) { handleViewportChange(); window.addEventListener('resize', debounce(handleViewportChange, 100)); window.addEventListener('load', handleViewportChange); } const tb = document.querySelector('.floating-toolbar'); if (tb) updateScale(DEFAULT_SCALE); bindCopyActions(); bindToolbarActions(); bindEditorEvents(); if (new URLSearchParams(location.search).get('edit') === '1') openEditor(); }

/* ---- 启动 ---- */
loadCvData().then(function () { loadPrefs(); renderCv(); init(); });
