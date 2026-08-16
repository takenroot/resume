// 头部必备行 + 胶囊层渲染自检 — node test/header-visibility.mjs 直接跑.
// 覆盖: 必备行顺序/icon/空字段跳过/显隐, 胶囊层可选字段 + 期望标签, expectJobs 整块开关.
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
const els = { identityEssential: elStub(), identityLine: elStub() };
globalThis.document = {
  getElementById: function (id) { return els[id] || null; },
  createElement: function () { return elStub(); },
  createTextNode: function (t) { return { __text: t }; }
};
globalThis.localStorage = { getItem: function () { return null; }, setItem: function () {} };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'prefs.js', 'renderer.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const api = new Function(src + '; loadPrefs(); return { renderIdentityEssential: renderIdentityEssential, renderIdentityLine: renderIdentityLine, setHidden: function (a) { cvPrefs.profileHidden = a; } };')();

function itemText(c) { return c.children.map(function (n) { return n.__text || ''; }).join(''); }
function essTexts() { return els.identityEssential.children.map(itemText); }
function pillTexts() { return els.identityLine.children.map(function (c) { return c.textContent || c.innerHTML; }); }
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

const FULL = { title: '全栈工程师', experience: '5年', phone: '138', email: 'a@b.com', location: '北京', jobStatus: '随时到岗', github: 'github.com/x', wechat: 'wx1',
  expectJobs: [{ title: '全栈开发', jobType: '全职', salary: { low: 15, high: 20 }, cities: ['北京', '上海'] }], expectIndustry: '互联网' };

// 1. 必备行: 职位/电话/邮箱/意向城市/经验, 顺序固定, 带 icon
api.setHidden([]);
api.renderIdentityEssential(FULL);
const e = essTexts();
assert(e.join('|') === '全栈工程师|138|a@b.com|北京/上海|5年', '必备行五字段顺序');
assert(els.identityEssential.children.every(function (c) { return c.innerHTML.indexOf('<svg') === 0; }), '每项带 icon-svg');
assert(els.identityEssential.children[1].dataset.copy === '138', '电话保留 data-copy');

// 2. 空字段跳过 (没有不显示)
api.renderIdentityEssential({ phone: '138' });
assert(essTexts().join('') === '138', '必备行空字段跳过');

// 3. 显隐: title 勾掉不显示; 意向城市跟 expectJobs 开关走
api.setHidden(['title', 'expectJobs']);
api.renderIdentityEssential(FULL);
assert(essTexts().join('|') === '138|a@b.com|5年', 'title 隐藏 + 意向城市随 expectJobs 关');

// 4. 胶囊层: 现居地/求职状态/github/微信 + 期望职位/薪资/行业 (期望城市已上必备行, 不重复)
api.setHidden([]);
api.renderIdentityLine(FULL);
const t = pillTexts();
assert(t.length === 7, '7 个胶囊, 实际 ' + t.length);
assert(t[0] === '北京' && t[1] === '随时到岗' && t[3] === 'wx1', '可选字段胶囊');
assert(els.identityLine.children[2].href === 'https://github.com/x', 'github 补 https://');
assert(t[4].indexOf('期望职位') >= 0 && t[5].indexOf('15-20K') >= 0 && t[6].indexOf('期望行业') >= 0, '期望标签胶囊');
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

console.log('header-visibility self-check OK (14 assertions)');
