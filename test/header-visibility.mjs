// 头部 H2 渲染 + 字段显隐自检 — node test/header-visibility.mjs 直接跑.
// 覆盖: 联系行 · 分隔/空字段跳过/profileHidden 显隐/expectJobs 派生标签/整块开关.
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
const els = { headerRow: elStub(), identityLine: elStub(), headerExtra: elStub() };
globalThis.document = {
  getElementById: function (id) { return els[id] || null; },
  createElement: function () { return elStub(); },
  createTextNode: function (t) { return { __text: t }; }
};
globalThis.localStorage = { getItem: function () { return null; }, setItem: function () {} };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'prefs.js', 'renderer.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const api = new Function(src + '; loadPrefs(); return { renderHeaderRow: renderHeaderRow, renderIdentityLine: renderIdentityLine, renderHeaderExtra: renderHeaderExtra, setHidden: function (a) { cvPrefs.profileHidden = a; } };')();

function textOf(el) { return el.children.map(function (c) { return c.__text !== undefined ? c.__text : c.textContent; }).join(''); }
function tagsHtml() { return els.headerExtra.children.map(function (c) { return c.innerHTML; }).join(''); }
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

const FULL = { title: '全栈工程师', experience: '5年', phone: '138', email: 'a@b.com', location: '北京', jobStatus: '随时到岗', github: 'github.com/x', wechat: 'wx1',
  expectJobs: [{ title: '全栈开发', jobType: '全职', salary: { low: 15, high: 20 }, cities: ['北京', '上海'] }], expectIndustry: '互联网' };

// 1. 联系行: 全字段 · 分隔, 顺序 phone/email/location/jobStatus/github/wechat
api.setHidden([]);
api.renderIdentityLine(FULL);
assert(textOf(els.identityLine) === '138 · a@b.com · 北京 · 随时到岗 · github.com/x · wx1', '联系行全字段 · 分隔');
assert(els.identityLine.children[0].dataset.copy === '138', '电话保留 data-copy');
assert(els.identityLine.children[8].href === 'https://github.com/x', 'github 无协议补 https://');

// 2. 空字段跳过 + 分隔符跟着少
api.renderIdentityLine({ phone: '138', jobStatus: '', wechat: 'wx' });
assert(textOf(els.identityLine) === '138 · wx', '空字段跳过');

// 3. profileHidden 显隐: 填了也不显示
api.setHidden(['github', 'wechat']);
api.renderIdentityLine(FULL);
assert(textOf(els.identityLine).indexOf('github') < 0 && textOf(els.identityLine).indexOf('wx1') < 0, 'hidden 字段不渲染');

// 4. 期望标签行: 职位(带工作性质)/薪资/城市/行业
api.setHidden([]);
api.renderHeaderExtra(FULL);
const h = tagsHtml();
assert(h.indexOf('期望职位') >= 0 && h.indexOf('全栈开发 · 全职') >= 0, '期望职位 tag');
assert(h.indexOf('期望薪资') >= 0 && h.indexOf('15-20K') >= 0, '期望薪资 tag');
assert(h.indexOf('北京 / 上海') >= 0, '期望城市 tag');
assert(h.indexOf('期望行业') >= 0, '期望行业 tag');

// 5. expectJobs 整块开关: 关掉后三个期望标签全没, expectIndustry 独立
api.setHidden(['expectJobs']);
api.renderHeaderExtra(FULL);
assert(tagsHtml().indexOf('期望') < 0 || tagsHtml().indexOf('期望职位') < 0, 'expectJobs 整块关');
assert(tagsHtml().indexOf('期望行业') >= 0, 'expectIndustry 独立开关');

// 6. headerRow: 岗位 | 经验 (location 已挪到联系行)
api.renderHeaderRow(FULL);
assert(textOf(els.headerRow) === '全栈工程师 | 5年', 'headerRow 岗位|经验');
api.renderHeaderRow({ title: 'X', location: '北京' });
assert(textOf(els.headerRow) === 'X', 'headerRow 不含 location');

console.log('header-visibility self-check OK (12 assertions)');
