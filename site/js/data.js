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
function normalizeSavedData() { migrateToSections(cvData); (cvData.sections || []).forEach(function (s) { if (!s.items) s.items = []; if (!s.title) s.title = (SECTION_CONFIG[s.type] || {}).label || '模块'; (s.items || []).forEach(function (it) { ['highlights', 'challenges', 'tags'].forEach(function (k) { if (it[k] !== undefined) it[k] = arr(it[k]); }); }); }); if (cvData.profile && cvData.profile.age && !cvData.profile.birthDate) delete cvData.profile.age; }
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
function importData(file) { const r = new FileReader(); r.onload = function (e) { try { let d; if (file.name.toLowerCase().endsWith('.md')) d = parseMarkdown(e.target.result); else d = JSON.parse(e.target.result); if (!d.profile) throw new Error('缺少 profile 字段'); cvData = d; normalizeSavedData(); if (cvData.profile) cvData.profile.avatar = ''; saveCvData(); renderCv(); syncResumeLayout(); updateStageSize(); if (!document.getElementById('editorPanel').hidden) buildEditorForm(); showToast('导入成功', 'success'); } catch (err) { showToast('导入失败：' + err.message, 'error', 3600); } }; r.readAsText(file); }
