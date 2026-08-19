// 渲染 tag 自检 — boolean 是/否字段的渲染/导出回归 (B 阶段 boolean 化引入过 === '是' 失配 bug).
// node test/render-tags.mjs 直接跑. document stub 只够 config.js renderItem 用 (innerHTML 拼接).
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

globalThis.document = { createElement: function () { return { className: '', innerHTML: '', textContent: '' }; } };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'config.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const SECTION_CONFIG = new Function(src + '; return SECTION_CONFIG;')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

// education: boolean true 出 tag, string '否' / boolean false 不出
let h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', endDate: '2024-06', isUnified: true, overseasEdu: true }).innerHTML;
assert(h.indexOf('统招') >= 0 && h.indexOf('海外留学') >= 0, 'education boolean true 出统招+海外留学 tag');
assert(h.indexOf('2020.09 - 2024.06') >= 0, 'education 日期渲染 fmtDateRange');
h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', isUnified: '否', overseasEdu: false }).innerHTML;
assert(h.indexOf('统招') < 0 && h.indexOf('海外留学') < 0, 'education string 否 / boolean false 不出 tag');
assert(h.indexOf('2020.09 - 至今') >= 0, 'endDate 省略 = 至今');

// experience: isIntern boolean true → 职位后拼（实习）, string '否' 不出
h = SECTION_CONFIG.experience.renderItem({ company: 'C', position: 'P', startDate: '2022-01', isIntern: true }).innerHTML;
assert(h.indexOf('P（实习）') >= 0, 'experience isIntern=true 职位后拼（实习）');
h = SECTION_CONFIG.experience.renderItem({ company: 'C', position: 'P', startDate: '2022-01', isIntern: '否' }).innerHTML;
assert(h.indexOf('实习') < 0, 'experience isIntern=string 否 不出实习');

// mdItem 同步拼在职位后
assert(SECTION_CONFIG.experience.mdItem({ startDate: '2022-01', company: 'C', position: 'P', isIntern: true }).indexOf('P（实习）') >= 0, 'mdItem 职位后拼（实习）');
assert(SECTION_CONFIG.education.mdItem({ startDate: '2020-09', school: 'X', isUnified: true }).indexOf('| 统招') >= 0, 'mdItem 统招 marker');

// 公司为空 (其它经历常见) → 不出裸「·」/ 空段
h = SECTION_CONFIG.experience.renderItem({ company: '', position: '专升本备考', startDate: '2022-01' }).innerHTML;
assert(h.indexOf('·') < 0 && h.indexOf('专升本备考') >= 0, '空公司不出裸「·」');
assert(SECTION_CONFIG.experience.mdItem({ startDate: '2022-01', company: '', position: '专升本备考' }).indexOf('**2022.01 - 至今** | 专升本备考') === 0, 'mdItem 空公司不出空段');

// education 全日制+统招合并规则 (buildEduHead): fulltime+是 → (全日制统招), 不出独立统招 tag
h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', degree: '本科', degreeType: 'fulltime', isUnified: true }).innerHTML;
assert(h.indexOf('(全日制统招)') >= 0 && h.indexOf('item-meta-tag">统招') < 0, 'fulltime+统招 → 合并 (全日制统招), 无独立统招 tag');
// 非全日制不合并: (非全日制) + 统招 tag 都在
h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', degree: '本科', degreeType: 'parttime', isUnified: true }).innerHTML;
assert(h.indexOf('(非全日制)') >= 0 && h.indexOf('item-meta-tag">统招') >= 0, 'parttime 不合并, (非全日制)+统招 tag');
// fulltime+否 → (全日制), 无统招
h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', degree: '本科', degreeType: 'fulltime', isUnified: '否' }).innerHTML;
assert(h.indexOf('(全日制)') >= 0 && h.indexOf('统招') < 0, 'fulltime+否 → (全日制), 无统招');

// 显隐开关 (isEduShown 走 prefs; 这里 stub 全隐): 学制/统招都关 → 裸学位
globalThis.isEduShown = function () { return false; };
h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', degree: '本科', degreeType: 'fulltime', isUnified: true }).innerHTML;
assert(h.indexOf('全日制') < 0 && h.indexOf('统招') < 0 && h.indexOf('本科') >= 0, '学制+统招都关 → 裸学位');
// 只关学制: 统招回退成独立 tag (合并不了)
globalThis.isEduShown = function (k) { return k === 'isUnified'; };
h = SECTION_CONFIG.education.renderItem({ school: 'X', startDate: '2020-09', degree: '本科', degreeType: 'fulltime', isUnified: true }).innerHTML;
assert(h.indexOf('(全日制') < 0 && h.indexOf('item-meta-tag">统招') >= 0, '只关学制 → 统招独立 tag');
delete globalThis.isEduShown;

// certificate: date 单点渲染 (v2 period→date)
h = SECTION_CONFIG.certificate.renderItem({ name: 'CET-6', issuer: '教育部', date: '2020-06' }).innerHTML;
assert(h.indexOf('2020.06') >= 0, 'certificate date 渲染 fmtDate');
assert(SECTION_CONFIG.certificate.mdItem({ name: 'CET-6', date: '2020-06' }).indexOf('**2020.06**') === 0, 'certificate mdItem date');

console.log('render-tags self-check OK (18 assertions)');
