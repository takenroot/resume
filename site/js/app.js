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

/* ---- PDF 导出（打印 / 浏览器原生） ---- */
function exportPdf() {
  window.print();
}

/* ---- PDF 导出（可搜索/可复制版本）---- */
function exportPdfSearchable() {
  var rp = document.getElementById('resumePages');
  var pages = rp && rp.querySelectorAll('.resume-page');
  if (!pages || !pages.length) return;

  var origGap = rp.style.gap;
  rp.style.gap = '0';

  var name = (cvData && cvData.profile && cvData.profile.name ? cvData.profile.name : '简历') + '-可复制.pdf';
  var pageCount = pages.length;
  console.log('[exportPdfSearchable] pages:', pageCount, 'name:', name);

  /* 逐页捕获，避免全局截图导致的分页计算错误 */
  var canvasPromises = Array.from(pages).map(function (page) {
    return html2canvas(page, { scale: 2, useCORS: true, letterRendering: true });
  });

  Promise.all(canvasPromises).then(function (canvases) {
    var pageW = 210, pageH = 297, margin = 8;
    var availW = pageW - margin * 2;
    var availH = pageH - margin * 2;

    var doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    canvases.forEach(function (canvas, i) {
      if (i > 0) doc.addPage();

      var srcW = canvas.width;
      var srcH = canvas.height;
      var scaleW = availW / srcW;
      var scaleH = availH / srcH;
      var scale = Math.min(scaleW, scaleH);
      var imgW = srcW * scale;
      var imgH = srcH * scale;
      var imgX = margin + (availW - imgW) / 2;
      var imgY = margin + (availH - imgH) / 2;

      var imgData = canvas.toDataURL('image/jpeg', 0.98);
      doc.addImage(imgData, 'JPEG', imgX, imgY, imgW, imgH);
    });

    doc.save(name);
    rp.style.gap = origGap || '';
    console.log('[exportPdfSearchable] saved');
  }).catch(function (err) {
    console.error('[exportPdfSearchable] error:', err);
    rp.style.gap = origGap || '';
  });
}
function init() { loadPrefs(); applyPrefs(); const rd = document.getElementById('resumeDocument'); if (rd) { handleViewportChange(); window.addEventListener('resize', debounce(handleViewportChange, 100)); window.addEventListener('load', handleViewportChange); } const tb = document.querySelector('.floating-toolbar'); if (tb) updateScale(DEFAULT_SCALE); bindCopyActions(); bindToolbarActions(); bindEditorEvents(); if (new URLSearchParams(location.search).get('edit') === '1') openEditor(); }

/* ---- 启动 ---- */
loadCvData().then(function () { loadPrefs(); renderCv(); init(); });
