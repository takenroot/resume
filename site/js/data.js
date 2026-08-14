/* ===========================================================
   CV 简历网页 — 数据加载 / 持久化 / 导入导出
   =========================================================== */
const STORAGE_KEY = 'cv_data', AVATAR_PREFIX = '__cv_avatar_', BACKUP_KEY = 'cv_backup';
let cvData = null;

// ponytail: 从 cfg.fields 读所有 a:true (数组字段) 列表, 统一走 arr() 拆.
// 加新数组字段只需在 fields 加 { a: true }, 不需要再改 normalize 列表.
function arrFieldsOf(cfg) { return (cfg && cfg.fields ? cfg.fields : []).filter(function (f) { return f.a; }).map(function (f) { return f.n; }); }

// ponytail: select 是/否 字段统一在代码里存 boolean. 老数据可能存 string '是'/'否' 或 boolean, 都归一为 boolean.
function yesNoToBool(v) { if (typeof v === 'boolean') return v; if (v === '是' || v === 'yes' || v === 'true') return true; if (v === '否' || v === 'no' || v === 'false') return false; return v; }

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

function normalizeSavedData() {
  (cvData.sections || []).forEach(function (s) {
    if (!s.items) s.items = [];
    if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块';
    const cfg = SECTION_CONFIG[s.type] || {};
    const arrKeys = arrFieldsOf(cfg);
    (s.items || []).forEach(function (it) {
      delete it.challenges;
      arrKeys.forEach(function (k) { if (it[k] !== undefined) it[k] = arr(it[k]); });
    });
  });
  if (cvData.profile) {
    // ponytail: profile.expectCities 老数据可能是 string, 拆. expectSalary 已是 object 不动. age 字段独立保留 (不通过 birthDate 派生).
    if (cvData.profile.expectCities && typeof cvData.profile.expectCities === 'string') cvData.profile.expectCities = arr(cvData.profile.expectCities);
  }
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
function saveCvData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(cvData)); }
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
      applyImportedData(d);
      showToast('导入成功', 'success');
    } catch (err) {
      logError('import', err);
      showToast('导入失败：' + err.message, 'error', 3600);
    }
  };
  r.readAsText(file);
}
