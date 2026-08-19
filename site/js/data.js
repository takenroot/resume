/* ===========================================================
   CV 简历网页 — 数据加载 / 持久化 / 导入导出
   =========================================================== */
const STORAGE_KEY = 'cv_data', AVATAR_PREFIX = '__cv_avatar_', BACKUP_KEY = 'cv_backup';
// ponytail: 数据版本戳 — 跟 site/fields.json 的 version 对齐人工维护. adapter 未来可按版本响亮报错, 而不是静默丢字段.
const SCHEMA_VERSION = '2026-08-19';
let cvData = null;

// ponytail: v1→v2 迁移 (契约 docs/SCHEMA_V2.md). load/import 时内存迁移, 下次 save 才落盘.
// period 解析失败时 startDate 保原文 (不丢数据, collectWarnings 提示). 幂等: 已是 v2 的键不碰.
const V1_DEGREE_TYPE = { '全日制': 'fulltime', '非全日制': 'parttime', '自考': 'selftaught' };
const V1_JOB_STATUS = { '随时到岗': 'available', '在职-看机会': 'open', '在职-暂不考虑': 'passive', '暂不找工作': 'unavailable' };
function migrateV1toV2(d) {
  if (!d || typeof d !== 'object') return;
  const p = d.profile;
  if (p && typeof p === 'object' && !Array.isArray(p)) {
    if (p.workYears === undefined && p.experience !== undefined) p.workYears = p.experience;
    delete p.experience;
    if (p.nativePlace === undefined && p.location !== undefined) p.nativePlace = p.location;
    delete p.location;
    delete p.timeline;
    if (V1_JOB_STATUS[p.jobStatus]) p.jobStatus = V1_JOB_STATUS[p.jobStatus];
    if (Array.isArray(p.expectJobs)) { if (p.expectJobs.length) p.expectJobs = p.expectJobs[0]; else delete p.expectJobs; }
  }
  (d.sections || []).forEach(function (s) {
    if (!s || !Array.isArray(s.items)) return;
    const isCert = s.type === 'certificate';
    s.items.forEach(function (it) {
      if (!it || typeof it !== 'object' || Array.isArray(it)) return;
      if (typeof it.period === 'string' && it.period.trim()) {
        if (isCert) { it.date = parseDateSingle(it.period) || it.period; }
        else { const dr = parseDateRange(it.period); if (dr) { it.startDate = dr.startDate; if (dr.endDate) it.endDate = dr.endDate; } else it.startDate = it.period; }
      }
      delete it.period;
      if (it.highlights === undefined) { if (it.achievements !== undefined) it.highlights = it.achievements; else if (it.honors !== undefined) it.highlights = it.honors; }
      delete it.achievements; delete it.honors;
      if (it.tags === undefined && it.skillTags !== undefined) it.tags = it.skillTags;
      delete it.skillTags;
      if (V1_DEGREE_TYPE[it.degreeType]) it.degreeType = V1_DEGREE_TYPE[it.degreeType];
    });
  });
}

// ponytail: 空值省略 (schema v2 ⑦) — 数据层只存有值键, ''/null/undefined/[] 递归删除.
// false/0 保留 (有意义值). 编辑器空输入框靠 defaultItem/真值判断, 不靠数据里的空串占位.
// 字符串顺手 trim — 纯空格串当空删 (防误触); 收集/加载/导入三路收尾都过这里, 单点全覆盖.
function stripEmpties(o) {
  if (!o || typeof o !== 'object') return;
  Object.keys(o).forEach(function (k) {
    const v = o[k];
    if (typeof v === 'string') { const t = v.trim(); if (!t) { delete o[k]; return; } if (t !== v) o[k] = t; return; }
    if (v === null || v === undefined || (Array.isArray(v) && !v.length)) { delete o[k]; return; }
    if (!Array.isArray(v) && typeof v === 'object') { stripEmpties(v); if (!Object.keys(v).length) delete o[k]; }
  });
}

// ponytail: 从 cfg.fields 读所有 a:true (数组字段), tok:true 的走 arrTok (顿号/逗号也拆), 其余只按行拆.
// 加新数组字段只需在 fields 加 { a: true }, 不需要再改 normalize 列表.
function arrFieldsOf(cfg) { return (cfg && cfg.fields ? cfg.fields : []).filter(function (f) { return f.a; }); }

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
    // ponytail: profile 校验也从声明表反查 — a:true 字段应为数组, select 值须命中选项码 (v2 存码), 复合字段应为对象.
    PROFILE_FIELDS.forEach(function (f) { const v = d.profile[f.n]; if (f.a && v !== undefined && !Array.isArray(v) && typeof v !== 'string') errs.push('profile.' + f.n + ' 应为数组'); else if (f.t === 'select' && f.options && f.options.length && typeof v === 'string' && v && f.options.indexOf(v) < 0) errs.push('profile.' + f.n + ' 值 "' + v + '" 不在选项里'); });
    Object.keys(PROFILE_COMPOSITES).forEach(function (k) {
      const v = d.profile[k]; if (v === undefined) return;
      if (typeof v !== 'object' || v === null || Array.isArray(v)) errs.push('profile.' + k + ' 应为对象');
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

// ponytail: warning 级校验 — 不拦截导入/加载, 只 toast 提示. 查 startDate/endDate/date 的 YYYY-MM 格式
// (v2 契约; 迁移解析失败的原文会在这里冒头, 不静默吞).
function collectWarnings(d) {
  const warns = [];
  if (d && !d.schemaVersion) warns.push('数据缺少 schemaVersion (当前 ' + SCHEMA_VERSION + '), 未来字段改名时无法按版本提示');
  ((d && d.sections) || []).forEach(function (s, i) {
    ((s && s.items) || []).forEach(function (it, j) {
      if (!it || typeof it !== 'object') return;
      ['startDate', 'endDate', 'date'].forEach(function (k) {
        const v = it[k];
        if (typeof v === 'string' && v.trim() && !DATE_ISO_RE.test(v.trim())) warns.push('sections[' + i + '].items[' + j + '].' + k + '「' + v + '」建议用 YYYY-MM 格式');
      });
    });
  });
  return warns;
}
function toastSchemaWarnings(d) { const w = collectWarnings(d); if (w.length) showToast(w.slice(0, 3).join('；') + (w.length > 3 ? '（共 ' + w.length + ' 处）' : ''), 'info', 6000); }

function normalizeSavedData() {
  migrateV1toV2(cvData); // ponytail: v1 老数据 (localStorage/导入文件) 在内存升级, 幂等.
  (cvData.sections || []).forEach(function (s) {
    if (!s.items) s.items = [];
    if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块';
    const cfg = SECTION_CONFIG[s.type] || {};
    const arrKeys = arrFieldsOf(cfg);
    (s.items || []).forEach(function (it) {
      arrKeys.forEach(function (f) { if (it[f.n] !== undefined) it[f.n] = (f.tok ? arrTok : arr)(it[f.n]); });
    });
  });
  normalizeYesNoFields(cvData);
  // ponytail: 空值省略收尾 — 归一(可能产出空数组)后统一清. s.title 空串也删 (渲染走 cfg.label 兜底).
  if (cvData.profile) stripEmpties(cvData.profile);
  (cvData.sections || []).forEach(function (s) {
    (s.items || []).forEach(function (it) { if (it && typeof it === 'object') stripEmpties(it); });
  });
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
  migrateV1toV2(b.data); // ponytail: v1 时代的备份先升级再校验 (同 importData 路径).
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
      migrateV1toV2(d); // ponytail: v1 导入文件先升级再校验 (expectJobs 数组/period 等老形状在这是合法的).
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
