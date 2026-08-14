/* ===========================================================
   CV 简历网页 — 数据加载 / 持久化 / 迁移 / 导入导出
   =========================================================== */
const STORAGE_KEY = 'cv_data', AVATAR_PREFIX = '__cv_avatar_';
const DEFAULT_DATA = {
  profile: {
    name: '张三', title: '全栈开发工程师', phone: '138-0000-0000', email: 'example@qq.com',
    '所在地': '北京市', experience: '5年', '求职状态': '', gender: '男', birthDate: '1998-01-15', avatar: '', github: 'https://github.com/example'
  },
  sections: [
    { type: 'education', title: '教育背景', items: [{ school: '某大学', degree: '本科', major: '计算机科学与技术', period: '2015.09 - 2019.06' }] },
    { type: 'experience', title: '工作经历', items: [{ company: '某科技有限公司', position: '高级前端工程师', period: '2022.01 - 至今', highlights: ['负责前端架构设计与性能优化', '主导前端团队技术选型'] }] },
    { type: 'skills', title: '专业技能', items: [{ name: '前端开发', detail: 'Vue / React / TypeScript / CSS3' }, { name: '后端开发', detail: 'Node.js / Python / MySQL / Redis' }, { name: '工具链', detail: 'Git / Docker / CI/CD' }] },
    { type: 'summary', title: '自我评价', items: ['具备良好的编码习惯和团队协作能力，熟悉从前端到后端的全栈开发流程。'] }
  ]
};
let cvData = null;

function migrateToSections(d) { if (d.sections && Array.isArray(d.sections)) return; const ss = []; if (d.education) ss.push({ type: 'education', title: (d.sectionTitles && d.sectionTitles.education) || '教育背景', items: d.education }); if (d.experience) ss.push({ type: 'experience', title: (d.sectionTitles && d.sectionTitles.experience) || '工作经历', items: d.experience }); if (d.skills) ss.push({ type: 'skills', title: (d.sectionTitles && d.sectionTitles.skills) || '专业技能', items: d.skills }); if (d.projects) ss.push({ type: 'projects', title: (d.sectionTitles && d.sectionTitles.projects) || '项目经验', items: d.projects }); if (d.summary) ss.push({ type: 'summary', title: (d.sectionTitles && d.sectionTitles.summary) || '自我评价', items: Array.isArray(d.summary) ? d.summary : [d.summary] }); d.sections = ss; delete d.education; delete d.experience; delete d.skills; delete d.projects; delete d.summary; delete d.sectionTitles; }
// ponytail: 从 cfg.fields 读所有 a:true (数组字段) 列表, 统一走 arr() 拆.
// 加新数组字段只需在 fields 加 { a: true }, 不需要再改 normalize 列表.
function arrFieldsOf(cfg) { return (cfg && cfg.fields ? cfg.fields : []).filter(function (f) { return f.a; }).map(function (f) { return f.n; }); }

// ponytail: select 是/否 字段 (options: ['是', '否']) 老数据可能是 boolean, 转成 string.
function boolToYesNo(v) { if (v === true) return '是'; if (v === false) return '否'; return v; }

function normalizeSavedData() {
  migrateToSections(cvData);
  (cvData.sections || []).forEach(function (s) {
    if (!s.items) s.items = [];
    if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块';
    const cfg = SECTION_CONFIG[s.type] || {};
    const arrKeys = arrFieldsOf(cfg);
    (s.items || []).forEach(function (it) {
      // ponytail: 2026-08-13 删除 challenges 字段, 老数据迁移时直接 delete.
      delete it.challenges;
      arrKeys.forEach(function (k) { if (it[k] !== undefined) it[k] = arr(it[k]); });
      // ponytail: 2026-08-13 老字段 education.experience (在校经历, 与工作经历 section type 同名易混) 重命名为 honors.
      // normalize 时检测老字段, rename 到 honors, 渲染前清干净. 一次性兜底, 老数据三个月后自然消亡.
      if (s.type === 'education' && it.experience !== undefined) { it.honors = it.experience; delete it.experience; }
      // 遍历 fields, 是/否 select 字段走 boolean → string 转换. 老 checkbox 留 boolean 不会跑这条.
      (cfg.fields || []).forEach(function (f) {
        if (f.t === 'select' && Array.isArray(f.options) && f.options.length === 2 && f.options[0] === '是' && f.options[1] === '否') {
          if (it[f.n] !== undefined && typeof it[f.n] === 'boolean') it[f.n] = boolToYesNo(it[f.n]);
        }
      });
    });
  });
  if (cvData.profile) {
    if (cvData.profile.age && !cvData.profile.birthDate) delete cvData.profile.age;
    // ponytail: profile.expectCities 老数据可能是 string, 拆. expectSalary 已是 object 不动.
    if (cvData.profile.expectCities && typeof cvData.profile.expectCities === 'string') cvData.profile.expectCities = arr(cvData.profile.expectCities);
  }
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
function loadCvData() { return new Promise(function (rs) { const st = localStorage.getItem(STORAGE_KEY); if (st) { try { cvData = JSON.parse(st); normalizeSavedData(); rs(); return; } catch (e) {} } fetch('./data.json').then(function (r) { return r.json(); }).then(function (d) { cvData = d; normalizeSavedData(); rs(); }).catch(function () { cvData = JSON.parse(JSON.stringify(DEFAULT_DATA)); normalizeSavedData(); rs(); }); }); }
function exportJson() { const exportData = JSON.parse(JSON.stringify(cvData)); exportData.profile.avatar = ''; const b = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume-data.json'; a.click(); URL.revokeObjectURL(u); }
function exportMarkdown() { const md = buildMarkdown(cvData), b = new Blob([md], { type: 'text/markdown;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume.md'; a.click(); URL.revokeObjectURL(u); showToast('Markdown 已导出', 'success'); }

// ponytail: 导入前清空所有 data-render 元素的旧值, 让 renderCv 写入新值不被残留 textContent 盖过.
// INPUT/TEXTAREA/BUTTON/A 跳过 (表单有用户输入, button/a 有 copy/href 副作用).
function clearImportDom() {
  document.querySelectorAll('[data-render]').forEach(function (el) {
    if (el.classList && el.classList.contains('timeline-strip')) return;
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
      if (!document.getElementById('editorPanel').hidden) buildEditorForm();
      showToast('导入成功', 'success');
    } catch (err) {
      showToast('导入失败：' + err.message, 'error', 3600);
    }
  };
  r.readAsText(file);
}
