/* ===========================================================
   CV 简历网页 — 通用工具函数
   =========================================================== */
function esc(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;') : ''; }
function cE(t, c) { const e = document.createElement(t); if (c) e.className = c; return e; }
function lis(arr) { return (arr || []).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join(''); }
function mli(arr) { return (arr || []).map(function (x) { return '- ' + x; }).join('\n'); }
// ponytail: 两种数组字段拆法 — 散文列表 (highlights/campus) 只按换行拆, 文本里可能带顿号逗号;
// token 列表 (tags/courses/cities, 字段声明 tok:true) 按逗号/顿号/换行拆, md 导出的「、」join 往返靠它拆回.
function arr(v) { return Array.isArray(v) ? v : (v ? String(v).split(/\n+/).map(function (t) { return t.trim(); }).filter(Boolean) : []); }
function arrTok(v) { return Array.isArray(v) ? v : (v ? String(v).split(/[,、\n]+/).map(function (t) { return t.trim(); }).filter(Boolean) : []); }
// ponytail: select 是/否字段存 boolean, 渲染层判「是」统一走这里 (2026-08 起不兼容老 string 数据).
function isYes(v) { return v === true; }
// ponytail: 日期区间 (schema v2) — 数据存 startDate/endDate「YYYY-MM」(end 省略=至今), 显示仍「2022.01 - 至今」.
// parseDateRange 兼容 v1 period 文本 (./- 分隔, 1 位月份), 迁移和 markdown 导入共用; 解析失败返回 null (调用方保原文).
const DATERANGE_RE = /^\s*(\d{4})[.\-/](\d{1,2})\s*-\s*(?:(\d{4})[.\-/](\d{1,2})|至今)\s*$/, DATE_SINGLE_RE = /^\s*(\d{4})[.\-/](\d{1,2})\s*$/, DATE_ISO_RE = /^\d{4}-\d{2}$/;
function _ym(y, m) { return y + '-' + ('0' + m).slice(-2); }
function parseDateRange(s) { const m = typeof s === 'string' && s.match(DATERANGE_RE); if (!m) return null; return { startDate: _ym(m[1], m[2]), endDate: m[3] ? _ym(m[3], m[4]) : null }; }
function parseDateSingle(s) { const m = typeof s === 'string' && s.match(DATE_SINGLE_RE); return m ? _ym(m[1], m[2]) : null; }
// ponytail: 非 ISO 值 (迁移解析失败的原文) 原样透出显示, 不吞数据.
function fmtDate(d) { return typeof d === 'string' && DATE_ISO_RE.test(d) ? d.replace('-', '.') : (d || ''); }
function fmtDateRange(start, end) { if (!start && !end) return ''; return fmtDate(start) + ' - ' + (end ? fmtDate(end) : '至今'); }
function debounce(fn, ms) { let timer; return function () { const ctx = this, args = arguments; clearTimeout(timer); timer = setTimeout(function () { fn.apply(ctx, args); }, ms); }; }
function computeAge(birthDate) { if (!birthDate) return ''; const d = new Date(birthDate); if (isNaN(d.getTime())) return ''; const today = new Date(); let age = today.getFullYear() - d.getFullYear(); const m = today.getMonth() - d.getMonth(); if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--; return age + '岁'; }
function showToast(m, t, d) { t = t || 'info'; d = d || 2400; const c = document.getElementById('toastContainer'); if (!c) { alert(m); return; } const o = cE('div', 'toast toast--' + t); o.textContent = m; c.appendChild(o); const r = function () { if (o && o.parentNode) { o.classList.add('toast--out'); setTimeout(function () { if (o && o.parentNode) o.remove(); }, 220); } }; setTimeout(r, d); }
