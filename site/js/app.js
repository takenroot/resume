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

/* ---- 导出 PDF（浏览器打印，文字可选中/可复制） ---- */
function exportPdf() {
  window.print();
}

/* ---- 导出 PDF（截图嵌入，文字不可搜索） ---- */
function exportPdfImage() {
  // jspdf 在 UMD 下挂在 window.jspdf.jsPDF（v2+）或 window.jsPDF（v1）
  const JsPDF = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
  if (typeof JsPDF !== 'function' || typeof html2canvas !== 'function') {
    showToast('PDF 库未加载，无法导出', 'error', 3000);
    return;
  }
  const pages = Array.from(document.querySelectorAll('#resumePages .resume-page'));
  if (pages.length === 0) {
    showToast('未检测到分页内容，请改用打印导出', 'info', 3000);
    return;
  }

  showToast('正在生成图片版 PDF（' + pages.length + ' 页）…', 'info', 10000);

  // 临时禁用指针/文本选中，避免截图过程中用户点击/选中干扰
  const body = document.body;
  body.classList.add('pdf-exporting');

  // 截图前强制重排：等一帧让浏览器绘制稳定状态
  requestAnimationFrame(function () {
    captureSequential(pages, 0)
      .then(function (pdf) {
        const name = (cvData && cvData.profile && cvData.profile.name ? cvData.profile.name + '_' : '') + 'resume.pdf';
        pdf.save(name);
        showToast('图片 PDF 导出成功（文字不可搜索）', 'success', 2000);
      })
      .catch(function (err) {
        console.error('PDF export failed:', err);
        showToast('图片 PDF 导出失败：' + (err && err.message || err), 'error', 4000);
      })
      .then(function () { body.classList.remove('pdf-exporting'); });
  });
}

// 顺序截图：保证多页 PDF 的页序，避免 Promise.all 竞态导致乱序
function captureSequential(pages, idx) {
  return new Promise(function (resolve, reject) {
    if (idx >= pages.length) return resolve(null);
    const pdf = idx === 0 ? new (window.jspdf && window.jspdf.jsPDF || window.jsPDF)({ unit: 'mm', format: 'a4', orientation: 'portrait' }) : null;
    html2canvas(pages[idx], { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
      .then(function (canvas) {
        const imgData = canvas.toDataURL('image/png');
        const w = 210, h = 297; // A4 portrait mm
        if (idx === 0) {
          pdf.addImage(imgData, 'PNG', 0, 0, w, h);
        } else {
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, w, h);
        }
        captureSequential(pages, idx + 1)
          .then(function () { resolve(pdf); })
          .catch(reject);
      })
      .catch(reject);
  });
}
function init() { loadPrefs(); applyPrefs(); const rd = document.getElementById('resumeDocument'); if (rd) { handleViewportChange(); window.addEventListener('resize', debounce(handleViewportChange, 100)); window.addEventListener('load', handleViewportChange); } const tb = document.querySelector('.floating-toolbar'); if (tb) updateScale(DEFAULT_SCALE); bindCopyActions(); bindToolbarActions(); bindEditorEvents(); if (new URLSearchParams(location.search).get('edit') === '1') openEditor(); }

/* ---- 启动 ---- */
loadCvData().then(function () { loadPrefs(); renderCv(); init(); });
