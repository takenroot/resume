/* ===========================================================
   CV 简历网页 — 数据加载 / 持久化 / 导入导出
   =========================================================== */
const STORAGE_KEY = 'cv_data', AVATAR_PREFIX = '__cv_avatar_';
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

function importData(file) {
  const r = new FileReader();
  r.onload = function (e) {
    try {
      let d;
      if (file.name.toLowerCase().endsWith('.md')) d = parseMarkdown(e.target.result);
      else d = JSON.parse(e.target.result);
      if (!d.profile) throw new Error('缺少 profile 字段');
      cvData = d;
      normalizeSavedData();
      if (cvData.profile) cvData.profile.avatar = '';
      clearImportDom();
      saveCvData();
      renderCv();
      syncResumeLayout();
      updateStageSize();
      window.scrollTo(0, 0);
      if (!document.getElementById('editorPanel').hidden) buildEditorForm();
      showToast('导入成功', 'success');
    } catch (err) {
      showToast('导入失败：' + err.message, 'error', 3600);
    }
  };
  r.readAsText(file);
}
