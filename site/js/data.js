/* ===========================================================
   CV 简历网页 — 数据加载 / 持久化 / 导入导出
   =========================================================== */
const STORAGE_KEY = 'cv_data', AVATAR_PREFIX = '__cv_avatar_', BACKUP_KEY = 'cv_backup';
// ponytail: 数据版本戳 — 跟 site/fields.json 的 version 对齐人工维护. adapter 未来可按版本响亮报错, 而不是静默丢字段.
const SCHEMA_VERSION = '2026-08-15';
let cvData = null;

// ponytail: 从 cfg.fields 读所有 a:true (数组字段) 列表, 统一走 arr() 拆.
// 加新数组字段只需在 fields 加 { a: true }, 不需要再改 normalize 列表.
function arrFieldsOf(cfg) { return (cfg && cfg.fields ? cfg.fields : []).filter(function (f) { return f.a; }).map(function (f) { return f.n; }); }

// ponytail: select 是/否 字段统一在代码里存 boolean. 表单 select 提交的是 string '是'/'否', 收集时归一为 boolean (不是老数据兼容).
function yesNoToBool(v) { if (typeof v === 'boolean') return v; if (v === '是') return true; if (v === '否') return false; return v; }

function normalizeYesNoFields(d) {
  (d.sections || []).forEach(function (s) {
    if (!SECTION_CONFIG[s.type]) return;
    (s.items || []).forEach(function (it) {
      (SECTION_CONFIG[s.type].fields || []).forEach(function (f) {
        if (f.t === 'select' && Array.isArray(f.options) && f.options.length === 2 && f.options[0] === '是' && f.options[1] === '否') {
          if (it[f.n] !== undefined) it[f.n] = yesNoToBool(it[f.n]);
        }
      });
    });
  });
}

// ponytail: 导入/恢复前校验, 走 SECTION_CONFIG 反查字段类型. 只查结构性错误
// (坏 JSON / 未知 type / 字段类型错), 不查业务合法性 (日期格式等). 返回错误数组, 空 = 通过.
function validateSchema(d) {
  const errs = [];
  if (!d || typeof d !== 'object' || Array.isArray(d)) return ['数据不是对象'];
  if (!d.profile || typeof d.profile !== 'object' || Array.isArray(d.profile)) errs.push('缺少 profile 对象');
  else {
    // ponytail: profile 校验也从声明表反查 — a:true 字段应为数组, 复合字段按 wrap1 应为数组/对象.
    PROFILE_FIELDS.forEach(function (f) { const v = d.profile[f.n]; if (f.a && v !== undefined && !Array.isArray(v) && typeof v !== 'string') errs.push('profile.' + f.n + ' 应为数组'); });
    Object.keys(PROFILE_COMPOSITES).forEach(function (k) {
      const v = d.profile[k]; if (v === undefined) return;
      const bad = PROFILE_COMPOSITES[k].wrap1 ? !Array.isArray(v) : (typeof v !== 'object' || v === null || Array.isArray(v));
      if (bad) errs.push('profile.' + k + (PROFILE_COMPOSITES[k].wrap1 ? ' 应为数组' : ' 应为对象'));
    });
  }
  if (!Array.isArray(d.sections)) { errs.push('缺少 sections 数组'); return errs; }
  d.sections.forEach(function (s, i) {
    const w = 'sections[' + i + ']';
    if (!s || typeof s !== 'object' || Array.isArray(s)) { errs.push(w + ' 不是对象'); return; }
    const cfg = SECTION_CONFIG[s.type];
    if (!cfg) { errs.push(w + ' 未知 type: ' + s.type); return; }
    if (cfg.contentField === 'content') { if (s.content !== undefined && typeof s.content !== 'string') errs.push(w + '.content 应为字符串'); return; }
    if (!Array.isArray(s.items)) { errs.push(w + '.items 应为数组'); return; }
    s.items.forEach(function (it, j) {
      const w2 = w + '.items[' + j + ']';
      if (cfg.contentField === 'items') { if (typeof it !== 'string') errs.push(w2 + ' 应为字符串'); return; }
      if (!it || typeof it !== 'object' || Array.isArray(it)) { errs.push(w2 + ' 不是对象'); return; }
      (cfg.fields || []).forEach(function (f) {
        const v = it[f.n];
        if (v === undefined || v === null || v === '') return;
        if (f.a && !Array.isArray(v) && typeof v !== 'string') errs.push(w2 + '.' + f.n + ' 应为数组或字符串');
        else if (!f.a && f.t !== 'textarea' && typeof v === 'object') errs.push(w2 + '.' + f.n + ' 应为标量');
        // ponytail: select 是/否字段存 boolean, 只对 string 值查 options.
        else if (f.t === 'select' && f.options && f.options.length && typeof v === 'string' && f.options.indexOf(v) < 0) errs.push(w2 + '.' + f.n + ' 值 "' + v + '" 不在选项里');
      });
    });
  });
  return errs;
}

// ponytail: warning 级校验 — 不拦截导入/加载, 只 toast 提示. 目前只查 period 时间格式
// (README 约定 YYYY.MM - YYYY.MM / 至今, 招聘平台智能解析依赖此格式).
const PERIOD_RE = /^\d{4}\.\d{2}\s*-\s*(\d{4}\.\d{2}|至今)$/;
function collectWarnings(d) {
  const warns = [];
  if (d && !d.schemaVersion) warns.push('数据缺少 schemaVersion (当前 ' + SCHEMA_VERSION + '), 未来字段改名时无法按版本提示');
  ((d && d.sections) || []).forEach(function (s, i) {
    ((s && s.items) || []).forEach(function (it, j) {
      if (it && typeof it === 'object' && typeof it.period === 'string' && it.period.trim() && !PERIOD_RE.test(it.period.trim())) warns.push('sections[' + i + '].items[' + j + '].period「' + it.period + '」建议用 YYYY.MM - YYYY.MM 格式');
    });
  });
  return warns;
}
function toastSchemaWarnings(d) { const w = collectWarnings(d); if (w.length) showToast(w.slice(0, 3).join('；') + (w.length > 3 ? '（共 ' + w.length + ' 处）' : ''), 'info', 6000); }

function normalizeSavedData() {
  (cvData.sections || []).forEach(function (s) {
    if (!s.items) s.items = [];
    if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块';
    const cfg = SECTION_CONFIG[s.type] || {};
    const arrKeys = arrFieldsOf(cfg);
    (s.items || []).forEach(function (it) {
      arrKeys.forEach(function (k) { if (it[k] !== undefined) it[k] = arr(it[k]); });
    });
  });
  // ponytail: 2026-08 起不做老数据迁移 (项目开发期, 老 localStorage 直接重置默认重来). profile 无需归一.
  normalizeYesNoFields(cvData);
}
function avatarKey(name) { return AVATAR_PREFIX + (name || 'default'); }
function saveAvatar(name, base64) { try { localStorage.setItem(avatarKey(name), base64); } catch (e) { showToast('头像保存失败，可能超出浏览器存储上限', 'error', 3600); } }
function loadAvatar(name) { try { return localStorage.getItem(avatarKey(name)); } catch (e) { return null; } }
function clearAvatar(name) { try { localStorage.removeItem(avatarKey(name)); } catch (e) {} }
function resolveAvatarUrl() {
  if (!cvData || !cvData.profile) return '';
  const p = cvData.profile, v = p.avatar || '';
  if (v && !v.startsWith('data:')) return v;
  const local = loadAvatar(p.name);
  return local || '';
}
function saveCvData() { cvData.schemaVersion = SCHEMA_VERSION; localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData)); }
// ponytail: 单备份槽位 — 导入前备份 + 每 5 分钟自动快照共用. reason 记来源便于排查.
function backupCvData(reason) { if (!cvData) return; try { localStorage.setItem(BACKUP_KEY, JSON.stringify({ ts: new Date().toISOString(), reason: reason || 'auto', data: cvData })); } catch (e) {} }
function loadBackup() { try { const s = localStorage.getItem(BACKUP_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; } }
function restoreBackup() {
  const b = loadBackup();
  if (!b || !b.data) { showToast('没有可用备份', 'info'); return; }
  const errs = validateSchema(b.data);
  if (errs.length) { showToast('备份数据损坏：' + errs[0], 'error', 4000); return; }
  if (!confirm('恢复到 ' + b.ts.slice(0, 19).replace('T', ' ') + ' 的备份（' + (b.reason || 'auto') + '）？当前数据会先备份。')) return;
  backupCvData('pre-restore');
  applyImportedData(b.data);
  showToast('已恢复备份', 'success');
}
function resetCvData() { localStorage.removeItem(STORAGE_KEY); location.reload(); }
function loadCvData() { return new Promise(function (rs) { const st = localStorage.getItem(STORAGE_KEY); if (st) { try { cvData = JSON.parse(st); normalizeSavedData(); rs(); return; } catch (e) {} } fetch('./data.json').then(function (r) { return r.json(); }).then(function (d) { cvData = d; normalizeSavedData(); rs(); }).catch(function () { cvData = { profile: {}, sections: [] }; normalizeSavedData(); rs(); }); }); }
function exportJson() { const exportData = JSON.parse(JSON.stringify(cvData)); exportData.profile.avatar = ''; const b = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume-data.json'; a.click(); URL.revokeObjectURL(u); }
function exportMarkdown() { const md = buildMarkdown(cvData), b = new Blob([md], { type: 'text/markdown;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume.md'; a.click(); URL.revokeObjectURL(u); showToast('Markdown 已导出', 'success'); }

// ponytail: 导入前清空所有 data-render 元素的旧值, 让 renderCv 写入新值不被残留 textContent 盖过.
// INPUT/TEXTAREA/BUTTON/A 跳过 (表单有用户输入, button/a 有 copy/href 副作用).
function clearImportDom() {
  document.querySelectorAll('[data-render]').forEach(function (el) {
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'BUTTON' || el.tagName === 'A') return;
    el.textContent = '';
    el.classList.remove('is-empty');
  });
  const rs = document.getElementById('resumeSource');
  if (rs) {
    const hd = rs.querySelector('.resume-header');
    rs.replaceChildren();
    if (hd) rs.appendChild(hd);
  }
  const hr = document.getElementById('headerRow'); if (hr) hr.replaceChildren();
}

// ponytail: 导入/恢复备份共用的应用路径 — 归一 → 清 DOM → 存 → 渲染 → 滚顶 → 重建编辑器.
function applyImportedData(d) {
  cvData = d;
  normalizeSavedData();
  clearImportDom();
  saveCvData();
  renderCv();
  syncResumeLayout();
  updateStageSize();
  window.scrollTo(0, 0);
  if (!document.getElementById('editorPanel').hidden) buildEditorForm();
  toastSchemaWarnings(d);
}

function importData(file) {
  const r = new FileReader();
  r.onload = function (e) {
    try {
      let d;
      if (file.name.toLowerCase().endsWith('.md')) d = parseMarkdown(e.target.result);
      else d = JSON.parse(e.target.result);
      const errs = validateSchema(d);
      if (errs.length) { showToast('导入失败：' + errs.slice(0, 3).join('；') + (errs.length > 3 ? '（共 ' + errs.length + ' 处）' : ''), 'error', 6000); return; }
      if (!confirm('导入将覆盖当前简历（当前数据会自动备份，可在编辑器底部「恢复备份」找回）。继续？')) return;
      backupCvData('import');
      // ponytail: 外部文件的 avatar 可能是别人简历的 base64, 清掉防泄露; 头像走本地 AVATAR_PREFIX 槽位.
      if (d.profile) d.profile.avatar = '';
      resetAvatarCrop(); // ponytail: 导入后头像是别人的, 旧裁剪无意义.
      applyImportedData(d);
      showToast('导入成功', 'success');
    } catch (err) {
      logError('import', err);
      showToast('导入失败：' + err.message, 'error', 3600);
    }
  };
  r.readAsText(file);
}
