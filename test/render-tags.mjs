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

// experience: isIntern boolean true 出「实习」tag, string '否' 不出
h = SECTION_CONFIG.experience.renderItem({ company: 'C', position: 'P', period: 'p', isIntern: true }).innerHTML;
assert(h.indexOf('实习') >= 0, 'experience isIntern=true 出实习 tag');
h = SECTION_CONFIG.experience.renderItem({ company: 'C', position: 'P', period: 'p', isIntern: '否' }).innerHTML;
assert(h.indexOf('实习') < 0, 'experience isIntern=string 否 不出实习 tag');

// mdItem 同步出 marker
assert(SECTION_CONFIG.experience.mdItem({ period: 'p', company: 'C', position: 'P', isIntern: true }).indexOf('| 实习') >= 0, 'mdItem 实习 marker');
assert(SECTION_CONFIG.education.mdItem({ period: 'p', school: 'X', isUnified: true }).indexOf('| 统招') >= 0, 'mdItem 统招 marker');

console.log('render-tags self-check OK (6 assertions)');
