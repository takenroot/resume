// 头部胶囊层渲染 + 字段显隐自检 — node test/header-visibility.mjs 直接跑.
// 覆盖: 胶囊顺序/空字段跳过/profileHidden 显隐/expectJobs 派生标签/整块开关.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

function elStub() {
  return {
    children: [], style: {}, dataset: {}, className: '', textContent: '', innerHTML: '',
    replaceChildren: function () { this.children = []; },
    appendChild: function (n) { this.children.push(n); },
    setAttribute: function () {}
  };
}
const els = { identityLine: elStub() };
globalThis.document = {
  getElementById: function (id) { return els[id] || null; },
  createElement: function () { return elStub(); },
  createTextNode: function (t) { return { __text: t }; }
};
globalThis.localStorage = { getItem: function () { return null; }, setItem: function () {} };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'prefs.js', 'renderer.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const api = new Function(src + '; loadPrefs(); return { renderIdentityLine: renderIdentityLine, setHidden: function (a) { cvPrefs.profileHidden = a; } };')();

function texts() { return els.identityLine.children.map(function (c) { return c.textContent || c.innerHTML; }); }
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

const FULL = { title: '全栈工程师', experience: '5年', phone: '138', email: 'a@b.com', location: '北京', jobStatus: '随时到岗', github: 'github.com/x', wechat: 'wx1',
  expectJobs: [{ title: '全栈开发', jobType: '全职', salary: { low: 15, high: 20 }, cities: ['北京', '上海'] }], expectIndustry: '互联网' };

// 1. 胶囊顺序: 岗位/经验在最前, 联系方式居中, 期望标签垫底
api.setHidden([]);
api.renderIdentityLine(FULL);
const t = texts();
assert(t.length === 12, '12 个胶囊 (8 字段 + 4 期望), 实际 ' + t.length);
assert(t[0] === '全栈工程师' && t[1] === '5年', '岗位/经验排最前');
assert(t[2] === '138' && t[3] === 'a@b.com', '电话/邮箱随后');
assert(els.identityLine.children[2].dataset.copy === '138', '电话保留 data-copy');
assert(els.identityLine.children[6].href === 'https://github.com/x', 'github 无协议补 https://');
assert(t[8].indexOf('期望职位') >= 0 && t[8].indexOf('全栈开发 · 全职') >= 0, '期望职位胶囊带 em 标签');
assert(t[9].indexOf('15-20K') >= 0 && t[10].indexOf('北京 / 上海') >= 0 && t[11].indexOf('期望行业') >= 0, '期望薪资/城市/行业胶囊');
assert(els.identityLine.children.every(function (c) { return c.className === 'identity-pill'; }), '全部 identity-pill 类');

// 2. 空字段跳过
api.renderIdentityLine({ phone: '138', jobStatus: '', wechat: 'wx' });
assert(texts().join(',') === '138,wx', '空字段跳过');
assert(els.identityLine.style.display === '', '有内容时显示');

// 3. 全空 → 整层隐藏
api.renderIdentityLine({});
assert(els.identityLine.style.display === 'none', '全空整层 display:none');

// 4. profileHidden 显隐: 填了也不显示
api.setHidden(['github', 'wechat']);
api.renderIdentityLine(FULL);
assert(texts().join('').indexOf('github') < 0 && texts().join('').indexOf('wx1') < 0, 'hidden 字段不渲染');

// 5. expectJobs 整块开关: 关掉后三个期望标签全没, expectIndustry 独立
api.setHidden(['expectJobs']);
api.renderIdentityLine(FULL);
const j = texts().join('');
assert(j.indexOf('期望职位') < 0 && j.indexOf('期望薪资') < 0 && j.indexOf('期望城市') < 0, 'expectJobs 整块关');
assert(j.indexOf('期望行业') >= 0, 'expectIndustry 独立开关');

console.log('header-visibility self-check OK (14 assertions)');
