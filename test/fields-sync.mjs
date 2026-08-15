// fields-sync 对账测试 — config.js 字段 key 必须 ⊆ site/fields.json (或显式 CV_OWN). node test/fields-sync.mjs 直接跑.
// ponytail: 仲裁规则 = 字段存不存在/英文 key 叫什么 → fields.json (vendor 自 cv-autofill); 中文 label/渲染 → CV 自己定.
// 此测试是分歧的抓住点: 两边任一改了字段, 这里当场红.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = readFileSync(join(root, 'site', 'js', 'config.js'), 'utf8');
const cfg = new Function(src + '; return { SECTION_CONFIG: SECTION_CONFIG, PROFILE_FIELDS: PROFILE_FIELDS, PROFILE_COMPOSITES: PROFILE_COMPOSITES };')();
const fj = JSON.parse(readFileSync(join(root, 'site', 'fields.json'), 'utf8'));

// ponytail: CV 自有字段白名单 — "这个字段不在上游 fields.json" 是写在这里的决定, 不是没说清楚的漏洞.
// 上游生成器规则: platforms 为空 / merged 的字段不输出, 故 CV 独有字段必然落在本表.
const CV_OWN = [
  'profile.timeline',      // 预留字段, 招聘平台无此概念
  'timeline.period', 'timeline.heading', 'timeline.tag', 'timeline.summary', 'timeline.highlights', // 时间轴是 CV 自有 section
  'education.honors',      // 荣誉奖项: 平台口径并入 campus (职务/荣誉/活动), CV 单列
  'certificate.serial', 'certificate.url' // 证书编号/验证链接: 上游未采集
];

const NAME_RE = /^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)*$/;
let fails = 0, checks = 0;
function check(cond, msg) { checks++; if (!cond) { fails++; console.error('FAIL: ' + msg); } }

// 1. 收集 config.js 全部字段 key (profile 普通字段 + 复合字段 + section item 字段)
const keys = new Set();
cfg.PROFILE_FIELDS.forEach(function (f) { keys.add('profile.' + f.n); });
Object.keys(cfg.PROFILE_COMPOSITES).forEach(function (k) { keys.add('profile.' + k); });
Object.keys(cfg.SECTION_CONFIG).forEach(function (t) {
  // ponytail: experience_other 是 experience 的同 schema alias, 对账按 experience 查.
  const sec = t === 'experience_other' ? 'experience' : t;
  (cfg.SECTION_CONFIG[t].fields || []).forEach(function (f) { keys.add(sec + '.' + f.n); });
});

// 断言 1: CV 字段 ⊆ fields.json, 找不到且不在 CV_OWN = 歧义
keys.forEach(function (k) {
  check(fj.fields[k] || CV_OWN.indexOf(k) >= 0, '字段 ' + k + ' 不在 fields.json 也不在 CV_OWN — 上游新增或改名后此处必须同步');
});
// 断言 2: CV_OWN 不在 fields.json (在了就说明上游已收录, 白名单该删)
CV_OWN.forEach(function (k) { check(!fj.fields[k], 'CV_OWN.' + k + ' 已被 fields.json 收录, 从白名单删除'); });
// 断言 3: CV_OWN 必须被 config 用到 (config 删了字段, 白名单同步删, 防残留)
CV_OWN.forEach(function (k) { check(keys.has(k), 'CV_OWN.' + k + ' 在 config.js 已不存在, 从白名单删除'); });
// 断言 4: 命名机检 — 中文 key 物理上无法回归
keys.forEach(function (k) { check(NAME_RE.test(k), 'config key ' + k + ' 违反 camelCase 点路径规则'); });
Object.keys(fj.fields).forEach(function (k) { check(NAME_RE.test(k), 'fields.json key ' + k + ' 违反 camelCase 点路径规则'); });
check(typeof fj.version === 'string' && fj.version.length > 0, 'fields.json 缺 version 戳');

if (fails) { console.error(fails + '/' + checks + ' FAILED'); process.exit(1); }

// 信息性输出: 上游有、CV 未吸收的字段 — "要不要吸收新字段"的决策入口
const proposed = Object.keys(fj.fields).filter(function (k) { return fj.fields[k].status === 'proposed' && !keys.has(k); });
console.log('fields-sync OK (' + checks + ' checks, ' + keys.size + ' config keys, fields.json v' + fj.version + ')');
if (proposed.length) console.log('info: 上游 proposed 未吸收 ' + proposed.length + ' 个: ' + proposed.join(', '));
