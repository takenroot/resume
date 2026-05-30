/* ===========================================================
   CV 简历网页 — Markdown 导入解析 / 导出构建
   =========================================================== */
const FIELD_ALIAS = { '姓名': 'name', '岗位': 'title', '性别': 'gender', '年龄': 'age', '电话': 'phone', '邮箱': 'email', '头像': 'avatar', '头像url': 'avatar', '学校': 'school', '专业': 'major', '时间': 'period', '主修课程': 'courses', '公司': 'company', '职位': 'position', '简介': 'summary', '工作描述': 'summary', '技能名': 'name', '详情': 'detail', '项目名': 'name', '项目描述': 'summary', '技术栈': '__tags__', '亮点': '__highlights__', '标题': 'heading', '标签': 'tag' };

function parseMarkdown(md) {
  const d = { profile: {}, sections: [] }; md = md.replace(/^### /gm, '## ');
  const SM = { '个人信息': 'profile', '教育背景': 'education', '工作经历': 'experience', '部队经历': 'experience', '专业技能': 'skills', '项目经验': 'projects', '自我评价': 'summary', '时间轴': 'timeline' };
  const bl = md.split(/(?=^##\s)/m);
  for (let i = 0; i < bl.length; i++) {
    const lns = bl[i].split('\n'), hd = lns[0].replace(/^##\s*/, '').trim(), ct = lns.slice(1).join('\n').trim();
    if (!hd || !ct) continue; const tp = SM[hd]; if (!tp) continue;
    if (tp === 'profile') { const re = /\*\*(.+?)\*\*[：:]\s*([^*\n]+)/g; let m; while ((m = re.exec(ct)) !== null) d.profile[m[1].trim()] = m[2].trim(); }
    else if (tp === 'summary') { const its = ct.split('\n').map(function (l) { return l.trim().replace(/^[*-]\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1').trim(); }).filter(Boolean); if (its.length > 0) d.sections.push({ type: 'summary', title: hd, items: its }); }
    else if (tp === 'skills') { const rs = ct.split('\n').filter(function (l) { return l.startsWith('|') && l.endsWith('|'); }), ss = []; rs.forEach(function (r) { const cs = r.split('|').filter(function (c) { return c.trim(); }).map(function (c) { return c.replace(/\*\*/g, '').trim(); }); if (cs.length >= 2 && !cs[0].includes('---') && cs[0] !== '类别') ss.push({ name: cs[0], detail: cs.slice(1).join(' ') }); }); if (ss.length > 0) d.sections.push({ type: 'skills', title: hd, items: ss }); }
    else { parsePipeItems(ct, tp, hd, d); }
  }
  if (!d.profile || Object.keys(d.profile).length === 0) d.profile = { name: '未命名' };
  return d;
}
function parsePipeItems(ct, tp, hd, d) { const its = []; const lns = ct.split('\n').map(function (l) { return l.trim(); }).filter(Boolean); let cur = null; for (let j = 0; j < lns.length; j++) { const ln = lns[j]; if (/^[*\-_]\s[*\-_]\s[*\-_]/.test(ln) || /^-{3,}$/.test(ln)) { if (cur) its.push(cur); cur = null; continue; } const pm = ln.match(/^\*\*(.+?)\*\*\s*\|\s*(.+?)(?:\s*\|\s*(.+?))?(?:\s*\|\s*(.*))?$/); if (pm) { if (cur) its.push(cur); cur = {}; const ps = [pm[1], pm[2], pm[3] || '', pm[4] || '']; if (tp === 'education') { cur.period = ps[0].trim(); cur.school = ps[1].trim(); cur.major = ps[2].trim(); const l = ps[3].trim(); if (l) cur.courses = l.replace(/.*?主修课程[：:]\s*/, '').trim(); } else if (tp === 'experience' || tp === 'timeline') { cur.period = ps[0].trim(); if (tp === 'experience') { cur.company = ps[1].trim(); cur.position = ps.slice(2).filter(Boolean).join(' | ').trim(); } else { cur.heading = ps[1].trim(); const tg = ps[2] ? ps[2].trim() : ''; if (tg) cur.tag = tg; } } else if (tp === 'projects') { cur.period = ps[0].trim(); cur.name = ps[1].trim(); const rl = ps.slice(2).filter(Boolean).join('，').trim(); if (rl) cur.summary = rl; } continue; } if ((ln.startsWith('* ') || ln.startsWith('- ')) && cur) { const t = ln.replace(/^[*-]\s*/, '').replace(/\*\*(.+?)\*\*/g, '$1').trim(); if (t) { if (!cur.highlights) cur.highlights = []; cur.highlights.push(t); } } } if (cur) its.push(cur); if (its.length > 0) d.sections.push({ type: tp, title: hd, items: its }); }

function buildMarkdown(d) {
  const lns = []; const p = d.profile || {};
  lns.push('## 个人信息', ''); if (p.name) lns.push('- **姓名**：' + p.name); if (p.title) lns.push('- **岗位**：' + p.title); if (p.experience) lns.push('- **工作经验**：' + p.experience); if (p.所在地) lns.push('- **所在地**：' + p.所在地); if (p.gender || p.age) lns.push('- **基本信息**：' + (p.gender || '') + (p.gender && p.age ? ' / ' : '') + (p.age || '')); if (p.phone) lns.push('- **电话**：' + p.phone); if (p.email) lns.push('- **邮箱**：' + p.email); if (p.github) lns.push('- **GitHub**：' + p.github);
  (d.sections || []).forEach(function (s) { const cfg = SECTION_CONFIG[s.type]; if (!cfg) return; lns.push('', '## ' + (s.title || cfg.label || ''), ''); if (cfg.mdPrefix) lns.push(cfg.mdPrefix); if (cfg.contentField) { lns.push(cfg.mdBlock(cfg.contentField === 'items' ? s.items : s.content)); } else { (s.items || []).forEach(function (i) { lns.push(cfg.mdItem(i)); lns.push('', '*   *   *', ''); }); } });
  return lns.join('\n');
}
