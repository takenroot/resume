// validateSchema 自检 — 无框架, node test/validate-schema.mjs 直接跑.
// ponytail: 项目无构建无测试基建, 用 new Function 拼 config.js + data.js 源码拿函数, 只测纯校验逻辑.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = readFileSync(join(root, 'config.js'), 'utf8') + '\n' + readFileSync(join(root, 'data.js'), 'utf8');
const validateSchema = new Function(src + '; return validateSchema;')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function has(errs, kw) { return errs.some(function (e) { return e.indexOf(kw) >= 0; }); }

assert(validateSchema(null).length > 0, 'null 拒收');
assert(validateSchema([]).length > 0, '数组顶层拒收');
assert(validateSchema({}).length >= 2, '缺 profile + sections 报两条');
assert(validateSchema({ profile: {}, sections: [] }).length === 0, '空壳合法');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'nope', items: [] }] }), '未知 type'), '未知 type 拒收');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'experience', items: 'x' }] }), 'items'), 'items 非数组拒收');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'experience', items: ['s'] }] }), '不是对象'), 'item 非对象拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'experience', items: [{ company: 'a', achievements: ['x'], skillTags: 'a,b' }] }] }).length === 0, '正常 item 通过 (a 字段接受 string)');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'experience', items: [{ achievements: 5 }] }] }), 'achievements'), 'a 字段数字拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'experience', items: [{ isIntern: true }] }] }).length === 0, 'select 是/否存 boolean 通过');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'education', items: [{ degreeType: '夜校' }] }] }), 'degreeType'), 'select 非法选项拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'summary', items: ['a', 'b'] }] }).length === 0, 'summary 字符串数组通过');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'summary', items: [{}] }] }), '字符串'), 'summary 非字符串拒收');
assert(has(validateSchema({ profile: {}, sections: [{ type: 'text', content: 5 }] }), 'content'), 'text content 非字符串拒收');
assert(validateSchema({ profile: {}, sections: [{ type: 'text', content: 'hi' }] }).length === 0, 'text content 字符串通过');

console.log('validateSchema self-check OK (13 assertions)');
