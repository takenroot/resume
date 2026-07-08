/* ===========================================================
   CV 简历网页 — 数据加载 / 持久化 / 迁移 / 导入导出
   =========================================================== */
const STORAGE_KEY = 'cv_data', AVATAR_PREFIX = '__cv_avatar_', DEFAULT_JSON = './data.json';
let cvData = null;

function migrateToSections(d) { if (d.sections && Array.isArray(d.sections)) return; const ss = []; if (d.education) ss.push({ type: 'education', title: (d.sectionTitles && d.sectionTitles.education) || '教育背景', items: d.education }); if (d.experience) ss.push({ type: 'experience', title: (d.sectionTitles && d.sectionTitles.experience) || '工作经历', items: d.experience }); if (d.skills) ss.push({ type: 'skills', title: (d.sectionTitles && d.sectionTitles.skills) || '专业技能', items: d.skills }); if (d.projects) ss.push({ type: 'projects', title: (d.sectionTitles && d.sectionTitles.projects) || '项目经验', items: d.projects }); if (d.summary) ss.push({ type: 'summary', title: (d.sectionTitles && d.sectionTitles.summary) || '自我评价', items: Array.isArray(d.summary) ? d.summary : [d.summary] }); d.sections = ss; delete d.education; delete d.experience; delete d.skills; delete d.projects; delete d.summary; delete d.sectionTitles; }
function normalizeSavedData() { migrateToSections(cvData); (cvData.sections || []).forEach(function (s) { if (!s.items) s.items = []; if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块'; if (s.type === 'projects') (s.items || []).forEach(function (p) { if (p.tags && !Array.isArray(p.tags)) p.tags = String(p.tags).split(/[,\n]+/).map(function (t) { return t.trim(); }).filter(Boolean); }); }); }
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
function loadCvData() { return new Promise(function (rs) { const st = localStorage.getItem(STORAGE_KEY); if (st) { try { cvData = JSON.parse(st); normalizeSavedData(); rs(); return; } catch (e) {} } fetch(DEFAULT_JSON).then(function (r) { return r.json(); }).then(function (d) { cvData = d; normalizeSavedData(); rs(); }).catch(function () { cvData = {}; rs(); showToast('数据文件 data.json 加载失败，已使用空数据', 'error', 4000); }); }); }
function exportJson() { const exportData = JSON.parse(JSON.stringify(cvData)); exportData.profile.avatar = ''; const b = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume-data.json'; a.click(); URL.revokeObjectURL(u); }
function exportMarkdown() { const md = buildMarkdown(cvData), b = new Blob([md], { type: 'text/markdown;charset=utf-8' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = 'resume.md'; a.click(); URL.revokeObjectURL(u); showToast('Markdown 已导出', 'success'); }
function importData(file) { const r = new FileReader(); r.onload = function (e) { try { let d; if (file.name.toLowerCase().endsWith('.md')) d = parseMarkdown(e.target.result); else d = JSON.parse(e.target.result); if (!d.profile) throw new Error('缺少 profile 字段'); cvData = d; normalizeSavedData(); if (cvData.profile) cvData.profile.avatar = ''; saveCvData(); renderCv(); syncResumeLayout(); updateStageSize(); if (!document.getElementById('editorPanel').hidden) buildEditorForm(); showToast('导入成功', 'success'); } catch (err) { showToast('导入失败：' + err.message, 'error', 3600); } }; r.readAsText(file); }
