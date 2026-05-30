/* ===========================================================
   CV 简历网页 — 通用工具函数
   =========================================================== */
function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : ''; }
function cE(t, c) { const e = document.createElement(t); if (c) e.className = c; return e; }
function lis(arr) { return (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
function mli(arr) { return (arr || []).map(function (x) { return '- ' + x; }).join('\n'); }
function arr(v) { return Array.isArray(v) ? v : (v ? String(v).split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean) : []); }
function debounce(fn, ms) { let timer; return function () { const ctx = this, args = arguments; clearTimeout(timer); timer = setTimeout(function () { fn.apply(ctx, args); }, ms); }; }
function showToast(m, t, d) { t = t || 'info'; d = d || 2400; const c = document.getElementById('toastContainer'); if (!c) { alert(m); return; } const o = cE('div', 'toast toast--' + t); o.textContent = m; c.appendChild(o); const r = function () { if (o && o.parentNode) { o.classList.add('toast--out'); setTimeout(function () { if (o && o.parentNode) o.remove(); }, 220); } }; setTimeout(r, d); }
