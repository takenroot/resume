// validateSchema 自检 — 无框架, node test/validate-schema.mjs 直接跑.
// ponytail: 项目无构建无测试基建, 用 new Function 拼 config.js + data.js 源码拿函数, 只测纯校验逻辑.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = readFileSync(join(root, 'utils.js'), 'utf8') + '\n' + readFileSync(join(root, 'config.js'), 'utf8') + '\n' + readFileSync(join(root, 'data.js'), 'utf8');
const validateSchema = new Function(src + '; return validateSchema;')();
const collectWarnings = new Function(src + '; return collectWarnings;')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function has(errs, kw) { return errs.some(function (e) { return e.indexOf(kw) >= 0; }); }

assert(validateSchema(null).length > 0, 'null 拒收');
assert(validateSchema([]).length > 0, '数组顶层拒收');
assert(validateSchema({}).length >= 2, '缺 profile + sections 报两条');
assert(validateSchema({ profile: {}, sections: [] }).length === 0, '空壳合法');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'nope', items: [] }] }), '未知 type'), '未知 type 拒收');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'experience', items: 'x' }] }), 'items'), 'items 非数组拒收');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'experience', items: ['s'] }] }), '不是对象'), 'item 非对象拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'experience', items: [{ company: 'a', highlights: ['x'], tags: 'a,b' }] }] }).length === 0, '正常 item 通过 (a 字段接受 string)');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'experience', items: [{ highlights: 5 }] }] }), 'highlights'), 'a 字段数字拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'experience', items: [{ isIntern: true }] }] }).length === 0, 'select 是/否存 boolean 通过');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'education', items: [{ degreeType: '夜校' }] }] }), 'degreeType'), 'select 非法选项拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'education', items: [{ degreeType: 'fulltime' }] }] }).length === 0, 'degreeType 存码通过');
assert(has(validateSchema({ profile: { jobStatus: '随时到岗' }, sections: [] }), 'jobStatus'), 'jobStatus 中文值拒收 (存码)');
assert(validateSchema({ profile: { jobStatus: 'available' }, sections: [] }).length === 0, 'jobStatus 存码通过');
assert(validateSchema({ profile: {}, sections: [{ type: 'summary', items: ['a', 'b'] }] }).length === 0, 'summary 字符串数组通过');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'summary', items: [{}] }] }), '字符串'), 'summary 非字符串拒收');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'text', content: 5 }] }), 'content'), 'text content 非字符串拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'text', content: 'hi' }] }).length === 0, 'text content 字符串通过');

// profile 声明表反查: 复合字段形状 (expectJobs v2 是单对象, 去掉了 v1 的 wrap1 数组包装)
assert(has(validateSchema({ profile: { expectJobs: [{ title: 'x' }] }, sections: [] }), 'expectJobs'), 'expectJobs 数组拒收 (v2 单对象)');
assert(validateSchema({ profile: { expectJobs: { title: 'x', salary: { low: 7 }, cities: ['北京'] } }, sections: [] }).length === 0, '合法复合字段通过');

// collectWarnings: startDate/endDate/date 的 YYYY-MM 格式 warning (不拦截, 只提示)
const SHELL = { schemaVersion: '2026-08-19', profile: {}, sections: [] };
assert(collectWarnings(SHELL).length === 0, '空壳无 warning');
assert(has(collectWarnings({ profile: {}, sections: [] }), 'schemaVersion'), '缺 schemaVersion 出 warning');
assert(collectWarnings({ schemaVersion: 'x', profile: {}, sections: [{ type: 'experience', items: [{ startDate: '2022-01' }, { startDate: '2015-09', endDate: '2019-06' }] }] }).length === 0, '标准格式无 warning');
const w = collectWarnings({ schemaVersion: 'x', profile: {}, sections: [{ type: 'experience', items: [{ startDate: '2022年1月至今' }] }] });
assert(w.length === 1 && has(w, 'startDate'), '「2022年1月至今」出 warning (迁移解析失败的原文在这冒头)');
assert(collectWarnings({ schemaVersion: 'x', profile: {}, sections: [{ type: 'education', items: [{ startDate: '' }] }] }).length === 0, '空 startDate 不出 warning');
assert(collectWarnings({ schemaVersion: 'x', profile: {}, sections: [{ type: 'certificate', items: [{ date: '2020-06' }] }] }).length === 0, 'certificate.date 合法无 warning');
assert(has(collectWarnings({ schemaVersion: 'x', profile: {}, sections: [{ type: 'certificate', items: [{ date: '2020.06' }] }] }), 'date'), 'certificate.date 非 ISO 出 warning');

console.log('validateSchema self-check OK (27 assertions)');
