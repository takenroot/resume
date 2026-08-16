// 头部必备行 + 胶囊层渲染自检 — node test/header-visibility.mjs 直接跑.
// 覆盖: 必备行顺序/icon/空字段跳过/显隐, 胶囊层可选字段 + 期望标签, expectJobs 整块开关.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

function elStub() {
  const cls = {};
  return {
    children: [], style: {}, dataset: {}, className: '', textContent: '', innerHTML: '',
    classList: { toggle: function (c, on) { cls[c] = !!on; }, contains: function (c) { return !!cls[c]; } },
    replaceChildren: function () { this.children = []; },
    appendChild: function (n) { this.children.push(n); },
    setAttribute: function () {}
  };
}
const els = { identityEssential: elStub(), identityLine: elStub() };
globalThis.document = {
  getElementById: function (id) { return els[id] || null; },
  createElement: function () { return elStub(); },
  createTextNode: function (t) { return { __text: t }; }
};
globalThis.localStorage = { getItem: function () { return null; }, setItem: function () {} };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'prefs.js', 'renderer.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const api = new Function(src + '; loadPrefs(); return { renderIdentityEssential: renderIdentityEssential, renderIdentityLine: renderIdentityLine, packPillRows: packPillRows, setHidden: function (a) { cvPrefs.profileHidden = a; }, setLayout: function (v) { cvPrefs.essentialLayout = v; }, getPrefs: function () { return cvPrefs; } };')();

function itemText(c) { return c.children.map(function (n) { return n.__text || ''; }).join(''); }
function essTexts() { return els.identityEssential.children.map(itemText); }
function pillTexts() { return els.identityLine.children.map(function (c) { return c.textContent || c.innerHTML; }); }
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

const FULL = { title: '全栈工程师', experience: '5年', phone: '138', email: 'a@b.com', location: '北京', jobStatus: '随时到岗', github: 'github.com/x', wechat: 'wx1',
  expectJobs: [{ title: '全栈开发', jobType: '全职', salary: { low: 15, high: 20 }, cities: ['北京', '上海'] }], expectIndustry: '互联网' };

// 1. 必备行: 职位/电话/意向城市/经验, 顺序固定, 带 icon (邮箱长值在胶囊层)
api.setHidden([]);
api.renderIdentityEssential(FULL);
const e = essTexts();
assert(e.join('|') === '全栈工程师|138|北京/上海|5年', '必备行四字段顺序');
assert(els.identityEssential.children.every(function (c) { return c.innerHTML.indexOf('<svg') === 0; }), '每项带 icon-svg');
assert(els.identityEssential.children[1].dataset.copy === '138', '电话保留 data-copy');
assert(els.identityEssential.children[1].className === 'identity-item identity-action', '电话带 identity-action 复制钩子');

// 2. 空字段跳过 (没有不显示)
api.renderIdentityEssential({ phone: '138' });
assert(essTexts().join('') === '138', '必备行空字段跳过');

// 3. 显隐: title 勾掉不显示; 意向城市跟 expectJobs 开关走
api.setHidden(['title', 'expectJobs']);
api.renderIdentityEssential(FULL);
assert(essTexts().join('|') === '138|5年', 'title 隐藏 + 意向城市随 expectJobs 关');

// 4. 胶囊层: 籍贯/求职状态/github/微信/邮箱 + 期望职位/薪资/行业 (期望城市已上必备行, 不重复)
api.setHidden([]);
api.renderIdentityLine(FULL);
const t = pillTexts();
assert(t.length === 8, '8 个胶囊, 实际 ' + t.length);
assert(t[0].indexOf('<em>籍贯</em>') === 0 && t[0].indexOf('北京') >= 0, '籍贯带标题');
assert(t[1].indexOf('<em>求职状态</em>') === 0 && t[1].indexOf('随时到岗') >= 0, '求职状态带标题');
assert(t[3].indexOf('<em>微信</em>') === 0 && t[3].indexOf('wx1') >= 0, '微信带标题');
assert(t[4].indexOf('<em>邮箱</em><span>a@b.com</span>') === 0, '邮箱带标题 + span 值 (复制反馈需要)');
assert(els.identityLine.children[4].dataset.copy === 'a@b.com', '邮箱保留 data-copy');
assert(els.identityLine.children[2].href === 'https://github.com/x', 'github 补 https://');
assert(t[5].indexOf('期望职位') >= 0 && t[6].indexOf('15-20K') >= 0 && t[7].indexOf('期望行业') >= 0, '期望标签胶囊');
assert(t.join('').indexOf('期望城市') < 0, '期望城市不进胶囊层');

// 5. 全空 → 整层隐藏
api.renderIdentityLine({});
assert(els.identityLine.style.display === 'none', '胶囊层全空 display:none');

// 6. expectJobs 整块关: 期望职位/薪资没, expectIndustry 独立
api.setHidden(['expectJobs']);
api.renderIdentityLine(FULL);
const j = pillTexts().join('');
assert(j.indexOf('期望职位') < 0 && j.indexOf('期望薪资') < 0, 'expectJobs 整块关');
assert(j.indexOf('期望行业') >= 0, 'expectIndustry 独立');

// 7. 必备行布局开关: 默认 flow 无 grid 类, grid 时加 layout-grid
api.setLayout('flow');
api.renderIdentityEssential(FULL);
assert(!els.identityEssential.classList.contains('layout-grid'), 'flow 默认无 layout-grid');
api.setLayout('grid');
api.renderIdentityEssential(FULL);
assert(els.identityEssential.classList.contains('layout-grid'), 'grid 加 layout-grid');

// 8. 头部样式开关默认值归一 (applyPrefs 的 CSS 变量输入)
const sp = api.getPrefs();
assert(sp.nameAlign === 'left' && sp.avatarShape === 'rounded' && sp.pillDensity === 'compact', '样式开关默认: 左对齐/圆角/紧凑');
assert(sp.headerRule === false && sp.essentialIcons === true, '样式开关默认: 无分隔线/有图标');

// 9. 胶囊装箱 (packPillRows): ≥0.8W 独占, 其余降序 FFD, 栈底豁免
const pack = function (ws, W) { return JSON.stringify(api.packPillRows(ws, W, 8)); };
assert(pack([340, 200, 180, 100, 90], 400) === '[[0],[1,2],[3,4]]', '装箱: 340 独占, 200+180 凑行 (97%), 100+90 栈底');
assert(pack([100, 100, 100], 400) === '[[0,1,2]]', '装箱: 全短一行');
assert(pack([320], 400) === '[[0]]', '装箱: 恰好 0.8W 独占');
assert(pack([280, 280, 280], 400) === '[[0],[1],[2]]', '装箱: 三个 0.7W 尴尬尺寸各自成行 (已知边缘, 放行)');

console.log('header-visibility self-check OK (26 assertions)');
