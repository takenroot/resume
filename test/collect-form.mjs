// collectFormData 声明式收集自检 — node test/collect-form.mjs 直接跑.
// ponytail: DOM stub 只实现 collectFormData 用到的最小面 (getElementById / querySelectorAll('[name^=]') / querySelector('[name=]')).
// 元素只需 { name, value } — 重构后收集只读 el.value, 类型信息全在 PROFILE_FIELDS / PROFILE_COMPOSITES 声明里.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'config.js', 'data.js', 'editor.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');

let inputs = [];
const ecStub = {
  querySelectorAll: function (sel) {
    const m = sel.match(/^\[name\^="(.+)"\]$/);
    return m ? inputs.filter(function (el) { return el.name.indexOf(m[1]) === 0; }) : [];
  },
  querySelector: function (sel) {
    const m = sel.match(/^\[name="(.+)"\]$/);
    return m ? (inputs.find(function (el) { return el.name === m[1]; }) || null) : null;
  }
};
globalThis.document = { getElementById: function (id) { return id === 'editorContent' ? ecStub : null; } };
globalThis.localStorage = { setItem: function () {}, getItem: function () { return null; }, removeItem: function () {} };
globalThis.showToast = function () {};

const api = new Function(src + '; return { collectFormData: collectFormData, get: function () { return cvData; }, set: function (d) { cvData = d; } };')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function run(cv, ins) { api.set(cv); inputs = ins; api.collectFormData({ skipSave: true }); return api.get(); }

// 1. 扁平白名单: 声明过的进, 未声明的不进
let d = run({ profile: {}, sections: [] }, [{ name: 'profile.name', value: '李四' }, { name: 'profile.hacker', value: 'x' }]);
assert(d.profile.name === '李四' && !('hacker' in d.profile), '白名单: 声明字段进, 杂散字段被挡');

// 2. a:true lines 数组 (timeline 字段顶着用, expectCities 已删)
d = run({ profile: {}, sections: [] }, [{ name: 'profile.expectCities', value: '北京\n\n上海' }]);
assert(!('expectCities' in d.profile), 'expectCities 已删, 白名单外不进数据');

// 3. 复合 expectJobs 空叶子不落盘
d = run({ profile: {}, sections: [] }, [{ name: 'expectJobs.title', value: '' }, { name: 'expectJobs.jobType', value: '' }, { name: 'expectJobs.cities', value: '' }, { name: 'expectJobs.salaryLow', value: '7' }, { name: 'expectJobs.salaryHigh', value: '10' }]);
assert(d.profile.expectJobs && d.profile.expectJobs[0].salary.low === 7 && !('title' in d.profile.expectJobs[0]), 'expectJobs 部分填写, 空叶子省略');

// 4. 复合全空 → delete (即使老数据有值)
d = run({ profile: { expectJobs: [{ title: '前端' }] }, sections: [] }, [{ name: 'expectJobs.title', value: '' }, { name: 'expectJobs.jobType', value: '' }, { name: 'expectJobs.cities', value: '' }, { name: 'expectJobs.salaryLow', value: '' }, { name: 'expectJobs.salaryHigh', value: '' }]);
assert(!('expectJobs' in d.profile), 'expectJobs 全空删除老值');

// 5. expectJobs wrap1 + 嵌套目标路径 salary.low
d = run({ profile: {}, sections: [] }, [{ name: 'expectJobs.title', value: '前端' }, { name: 'expectJobs.jobType', value: '' }, { name: 'expectJobs.cities', value: '' }, { name: 'expectJobs.salaryLow', value: '5' }, { name: 'expectJobs.salaryHigh', value: '' }]);
assert(Array.isArray(d.profile.expectJobs) && d.profile.expectJobs[0].title === '前端' && d.profile.expectJobs[0].salary.low === 5 && !('jobType' in d.profile.expectJobs[0]), 'expectJobs 包单元素数组 + salary 嵌套');

// 6. number 0 是合法值不当空
d = run({ profile: {}, sections: [] }, [{ name: 'expectJobs.salaryLow', value: '0' }]);
assert(d.profile.expectJobs && d.profile.expectJobs[0].salary.low === 0, 'number 0 保留');

// 7. item 路径编码不变 + 是/否 select 归一 boolean
d = run({ profile: {}, sections: [{ type: 'experience', title: '工作经历', items: [{}] }] }, [{ name: 'item.0.0.company', value: '某公司' }, { name: 'item.0.0.isIntern', value: '是' }]);
assert(d.sections[0].items[0].company === '某公司' && d.sections[0].items[0].isIntern === true, 'item 收集 + isIntern boolean 化');

// 8. 未被触碰的 profile 字段 (隐藏字段如 currentSalary) 经 Object.assign 存活
d = run({ profile: { currentSalary: { salary: 10 } }, sections: [] }, [{ name: 'profile.name', value: 'x' }]);
assert(d.profile.currentSalary && d.profile.currentSalary.salary === 10, '隐藏字段不被收集碰');

console.log('collect-form self-check OK (8 scenarios)');
