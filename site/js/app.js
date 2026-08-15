/* ===========================================================
   CV 简历网页 — 入口模块（复制 / 工具栏 / PDF导出 / 初始化）
   最后加载，依赖所有其他模块
   =========================================================== */

/* ---- 复制功能 ---- */
// ponytail: 现代浏览器 (Chromium/Firefox/Safari 2020+) 全支持 navigator.clipboard.writeText, 删了 execCommand textarea fallback.
function copyText(v) { return navigator.clipboard.writeText(v); }
function flashCopiedState(el) { const tn = el.querySelector('span'); if (!tn) return; const ol = el.dataset.originalLabel || tn.textContent.trim(); if (!el.dataset.originalLabel) el.dataset.originalLabel = ol; tn.textContent = '已复制'; setTimeout(function () { tn.textContent = ol; }, 1200); }
function bindCopyActions() { document.addEventListener('click', function (ev) { const el = ev.target.closest('.identity-action[data-copy]'); if (!el) return; ev.preventDefault(); const v = el.dataset.copy; if (!v) return; copyText(v).then(function () { flashCopiedState(el); }).catch(function (e) { console.error('Copy failed:', e); }); }); }

/* ---- 工具栏 ---- */
function bindToolbarActions() { document.addEventListener('click', function (ev) { const b = ev.target.closest('[data-action]'); if (!b) return; const a = b.dataset.action; if (a === 'zoom-in') updateScale(currentScale + STEP, true); else if (a === 'zoom-out') updateScale(currentScale - STEP, true); else if (a === 'reset') updateScale(DEFAULT_SCALE, true); }); }

/* ---- 导出 PDF（浏览器打印，文字可选中/可复制） ---- */
function exportPdf() {
  window.print();
}

/* ---- 导出 PNG（截图，文字不可搜索） ---- */
// ponytail: 每页一张 PNG (多页加 _p1/_p2 后缀), 不拼长图 — 长图高度上限 ~32k px 容易翻车.
// 多页连续 a.click() 下载, 浏览器首次会问「允许下载多个文件」.
function exportPng() {
  if (typeof html2canvas !== 'function') { showToast('截图库未加载，无法导出', 'error', 3000); return; }
  const pages = Array.from(document.querySelectorAll('#resumePages .resume-page'));
  if (!pages.length) { showToast('未检测到分页内容', 'info', 3000); return; }
  showToast('正在生成 PNG（' + pages.length + ' 页）…', 'info', 10000);
  const name = (cvData && cvData.profile && cvData.profile.name ? cvData.profile.name + '_' : '') + 'resume';
  let chain = Promise.resolve();
  pages.forEach(function (pg, i) {
    chain = chain.then(function () { return html2canvas(pg, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' }); }).then(function (canvas) {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = name + (pages.length > 1 ? '_p' + (i + 1) : '') + '.png';
      a.click();
    });
  });
  chain.then(function () { showToast('PNG 导出成功（' + pages.length + ' 张）', 'success', 2000); })
    .catch(function (err) { logError('export-png', err); showToast('PNG 导出失败：' + (err && err.message || err), 'error', 4000); });
}
/* ---- 错误队列 (telemetry) ---- */
// ponytail: 本地错误队列, localStorage 留最近 20 条. 不外发, 用户手动「复制错误」带走.
const ERROR_KEY = 'cv_errors';
function logError(kind, err) {
  try {
    const q = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]');
    q.push({ ts: new Date().toISOString(), kind: kind, msg: String(err && err.message || err), stack: String(err && err.stack || '').split('\n').slice(0, 5).join('\n') });
    while (q.length > 20) q.shift();
    localStorage.setItem(ERROR_KEY, JSON.stringify(q));
  } catch (e) {}
}
function copyErrorReport() {
  let q = [];
  try { q = JSON.parse(localStorage.getItem(ERROR_KEY) || '[]'); } catch (e) {}
  const report = 'UA: ' + navigator.userAgent + '\nURL: ' + location.href + '\nErrors (' + q.length + '):\n' + (q.length ? q.map(function (x) { return '[' + x.ts + '] ' + x.kind + ': ' + x.msg + (x.stack ? '\n' + x.stack : ''); }).join('\n---\n') : '(无记录)');
  copyText(report).then(function () { showToast('错误详情已复制', 'success'); }).catch(function () { showToast('复制失败', 'error'); });
}
window.addEventListener('error', function (ev) { logError('window', ev.error || ev.message); });
window.addEventListener('unhandledrejection', function (ev) { logError('promise', ev.reason); });

/* ---- 自动快照 ---- */
// ponytail: 每 5 分钟备份到 cv_backup (跟导入前备份同槽位), 数据没变就跳过.
function startAutoSnapshot() {
  setInterval(function () {
    if (!cvData) return;
    const b = loadBackup();
    if (b && JSON.stringify(b.data) === JSON.stringify(cvData)) return;
    backupCvData('auto');
  }, 5 * 60 * 1000);
}

function init() { loadPrefs(); applyPrefs(); const rd = document.getElementById('resumeDocument'); if (rd) { handleViewportChange(); window.addEventListener('resize', debounce(handleViewportChange, 100)); window.addEventListener('load', handleViewportChange); } const tb = document.querySelector('.floating-toolbar'); if (tb) updateScale(DEFAULT_SCALE); bindCopyActions(); bindToolbarActions(); bindEditorEvents(); if (new URLSearchParams(location.search).get('edit') === '1') openEditor(); }

/* ---- 启动 ---- */
loadCvData().then(function () { loadPrefs(); renderCv(); init(); startAutoSnapshot(); toastSchemaWarnings(cvData); });
