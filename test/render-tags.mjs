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
let h = SECTION_CONFIG.education.renderItem({ school: 'X', period: '2020-2024', isUnified: true, overseasEdu: true, honors: [] }).innerHTML;
assert(h.indexOf('统招') >= 0 && h.indexOf('海外留学') >= 0, 'education boolean true 出统招+海外留学 tag');
h = SECTION_CONFIG.education.renderItem({ school: 'X', period: 'p', isUnified: '否', overseasEdu: false, honors: [] }).innerHTML;
assert(h.indexOf('统招') < 0 && h.indexOf('海外留学') < 0, 'education string 否 / boolean false 不出 tag');

// experience: isIntern boolean true → 职位后拼（实习）, string '否' 不出
h = SECTION_CONFIG.experience.renderItem({ company: 'C', position: 'P', period: 'p', isIntern: true }).innerHTML;
assert(h.indexOf('P（实习）') >= 0, 'experience isIntern=true 职位后拼（实习）');
h = SECTION_CONFIG.experience.renderItem({ company: 'C', position: 'P', period: 'p', isIntern: '否' }).innerHTML;
assert(h.indexOf('实习') < 0, 'experience isIntern=string 否 不出实习');

// mdItem 同步拼在职位后
assert(SECTION_CONFIG.experience.mdItem({ period: 'p', company: 'C', position: 'P', isIntern: true }).indexOf('P（实习）') >= 0, 'mdItem 职位后拼（实习）');
assert(SECTION_CONFIG.education.mdItem({ period: 'p', school: 'X', isUnified: true }).indexOf('| 统招') >= 0, 'mdItem 统招 marker');

// 公司为空 (其它经历常见) → 不出裸「·」/ 空段
h = SECTION_CONFIG.experience.renderItem({ company: '', position: '专升本备考', period: 'p' }).innerHTML;
assert(h.indexOf('·') < 0 && h.indexOf('专升本备考') >= 0, '空公司不出裸「·」');
assert(SECTION_CONFIG.experience.mdItem({ period: 'p', company: '', position: '专升本备考' }).indexOf('**p** | 专升本备考') === 0, 'mdItem 空公司不出空段');

// education 全日制+统招合并规则 (buildEduHead): 全日制+是 → (全日制统招), 不出独立统招 tag
h = SECTION_CONFIG.education.renderItem({ school: 'X', period: 'p', degree: '本科', degreeType: '全日制', isUnified: true, honors: [] }).innerHTML;
assert(h.indexOf('(全日制统招)') >= 0 && h.indexOf('item-meta-tag">统招') < 0, '全日制+统招 → 合并 (全日制统招), 无独立统招 tag');
// 非全日制不合并: (非全日制) + 统招 tag 都在
h = SECTION_CONFIG.education.renderItem({ school: 'X', period: 'p', degree: '本科', degreeType: '非全日制', isUnified: true, honors: [] }).innerHTML;
assert(h.indexOf('(非全日制)') >= 0 && h.indexOf('item-meta-tag">统招') >= 0, '非全日制不合并, (非全日制)+统招 tag');
// 全日制+否 → (全日制), 无统招
h = SECTION_CONFIG.education.renderItem({ school: 'X', period: 'p', degree: '本科', degreeType: '全日制', isUnified: '否', honors: [] }).innerHTML;
assert(h.indexOf('(全日制)') >= 0 && h.indexOf('统招') < 0, '全日制+否 → (全日制), 无统招');

// 显隐开关 (isEduShown 走 prefs; 这里 stub 全隐): 学制/统招都关 → 裸学位
globalThis.isEduShown = function () { return false; };
h = SECTION_CONFIG.education.renderItem({ school: 'X', period: 'p', degree: '本科', degreeType: '全日制', isUnified: true, honors: [] }).innerHTML;
assert(h.indexOf('全日制') < 0 && h.indexOf('统招') < 0 && h.indexOf('本科') >= 0, '学制+统招都关 → 裸学位');
// 只关学制: 统招回退成独立 tag (合并不了)
globalThis.isEduShown = function (k) { return k === 'isUnified'; };
h = SECTION_CONFIG.education.renderItem({ school: 'X', period: 'p', degree: '本科', degreeType: '全日制', isUnified: true, honors: [] }).innerHTML;
assert(h.indexOf('(全日制') < 0 && h.indexOf('item-meta-tag">统招') >= 0, '只关学制 → 统招独立 tag');
delete globalThis.isEduShown;

console.log('render-tags self-check OK (14 assertions)');
