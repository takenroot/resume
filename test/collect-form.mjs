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

const api = new Function(src + '; return { collectFormData: collectFormData, renderItemFieldInput: renderItemFieldInput, get: function () { return cvData; }, set: function (d) { cvData = d; } };')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function run(cv, ins) { api.set(cv); inputs = ins; api.collectFormData({ skipSave: true }); return api.get(); }

// 1. 扁平白名单: 声明过的进, 未声明的不进
let d = run({ profile: {}, sections: [] }, [{ name: 'profile.name', value: '李四' }, { name: 'profile.hacker', value: 'x' }]);
assert(d.profile.name === '李四' && !('hacker' in d.profile), '白名单: 声明字段进, 杂散字段被挡');

// 2. a:true lines 数组 (timeline 字段顶着用, expectCities 已删)
d = run({ profile: {}, sections: [] }, [{ name: 'profile.expectCities', value: '北京\n\n上海' }]);
assert(!('expectCities' in d.profile), 'expectCities 已删, 白名单外不进数据');

// 3. 复合 expectJobs 空叶子不落盘 (v2 单对象, 无 wrap1)
d = run({ profile: {}, sections: [] }, [{ name: 'expectJobs.title', value: '' }, { name: 'expectJobs.jobType', value: '' }, { name: 'expectJobs.cities', value: '' }, { name: 'expectJobs.salaryLow', value: '7' }, { name: 'expectJobs.salaryHigh', value: '10' }]);
assert(d.profile.expectJobs && d.profile.expectJobs.salary.low === 7 && !('title' in d.profile.expectJobs), 'expectJobs 部分填写, 空叶子省略');

// 4. 复合全空 → delete (即使老数据有值)
d = run({ profile: { expectJobs: { title: '前端' } }, sections: [] }, [{ name: 'expectJobs.title', value: '' }, { name: 'expectJobs.jobType', value: '' }, { name: 'expectJobs.cities', value: '' }, { name: 'expectJobs.salaryLow', value: '' }, { name: 'expectJobs.salaryHigh', value: '' }]);
assert(!('expectJobs' in d.profile), 'expectJobs 全空删除老值');

// 5. expectJobs 单对象 + 嵌套目标路径 salary.low
d = run({ profile: {}, sections: [] }, [{ name: 'expectJobs.title', value: '前端' }, { name: 'expectJobs.jobType', value: '' }, { name: 'expectJobs.cities', value: '' }, { name: 'expectJobs.salaryLow', value: '5' }, { name: 'expectJobs.salaryHigh', value: '' }]);
assert(d.profile.expectJobs && !Array.isArray(d.profile.expectJobs) && d.profile.expectJobs.title === '前端' && d.profile.expectJobs.salary.low === 5 && !('jobType' in d.profile.expectJobs), 'expectJobs 单对象 + salary 嵌套');

// 6. number 0 是合法值不当空
d = run({ profile: {}, sections: [] }, [{ name: 'expectJobs.salaryLow', value: '0' }]);
assert(d.profile.expectJobs && d.profile.expectJobs.salary.low === 0, 'number 0 保留');

// 6b. 空值省略 — 编辑器清空的字段从数据里消失 (v2 ⑦)
d = run({ profile: { name: '张三' }, sections: [{ type: 'experience', title: '工作经历', items: [{ company: '某公司', industry: '互联网', highlights: ['a'] }] }] }, [{ name: 'profile.name', value: '' }, { name: 'item.0.0.company', value: '' }, { name: 'item.0.0.industry', value: '' }, { name: 'item.0.0.highlights', value: '' }]);
assert(!('name' in d.profile) && !('company' in d.sections[0].items[0]) && !('highlights' in d.sections[0].items[0]), '清空字段 → 键省略 (空串/空数组不落数据)');

// 7. item 路径编码不变 + 是/否 select 归一 boolean
d = run({ profile: {}, sections: [{ type: 'experience', title: '工作经历', items: [{}] }] }, [{ name: 'item.0.0.company', value: '某公司' }, { name: 'item.0.0.isIntern', value: '是' }]);
assert(d.sections[0].items[0].company === '某公司' && d.sections[0].items[0].isIntern === true, 'item 收集 + isIntern boolean 化');

// 8. 未被触碰的 profile 字段 (隐藏字段如 currentSalary) 经 Object.assign 存活
d = run({ profile: { currentSalary: { salary: 10 } }, sections: [] }, [{ name: 'profile.name', value: 'x' }]);
assert(d.profile.currentSalary && d.profile.currentSalary.salary === 10, '隐藏字段不被收集碰');

// 9. select 值未设置 → 补空占位 option (否则浏览器默认第一项, 保存即污染数据)
const selHtml = api.renderItemFieldInput({ n: 'isIntern', t: 'select', options: ['是', '否'] }, undefined, 'item.0.0.isIntern');
assert(selHtml.indexOf('<option value="" selected>—</option><option value="是"') >= 0, '未设置的 select 补空占位 option');
const selSet = api.renderItemFieldInput({ n: 'degreeType', t: 'select', options: ['fulltime', 'parttime'] }, 'parttime', 'x');
assert(selSet.indexOf('value=""') < 0 && selSet.indexOf('value="parttime" selected') >= 0 && selSet.indexOf('>非全日制<') >= 0, '已设置的 select 无占位 + 码值选中 + 中文 label');

// 10. 数组字段拆法分家 — highlights 散文只按行拆 (文中顿号/逗号保留), tags token 按逗号/顿号拆
d = run({ profile: {}, sections: [{ type: 'projects', title: '项目经验', items: [{}] }] }, [{ name: 'item.0.0.highlights', value: '解决印章遮挡、拍照偏移导致的版面漂移\n第二条, 带逗号' }, { name: 'item.0.0.tags', value: 'Java、Vue, React\nRedis' }]);
assert(d.sections[0].items[0].highlights.length === 2 && d.sections[0].items[0].highlights[0] === '解决印章遮挡、拍照偏移导致的版面漂移' && d.sections[0].items[0].highlights[1] === '第二条, 带逗号', 'highlights 只按行拆, 顿号逗号保留');
assert(d.sections[0].items[0].tags.join('|') === 'Java|Vue|React|Redis', 'tags 按逗号/顿号/换行拆');

// 11. 空格清洗 — 首尾空格 trim, 纯空格串当空删 (防误触)
d = run({ profile: {}, sections: [] }, [{ name: 'profile.name', value: '  张三  ' }, { name: 'profile.wechat', value: '   ' }]);
assert(d.profile.name === '张三' && !('wechat' in d.profile), '字符串 trim + 纯空格串删除');

console.log('collect-form self-check OK (12 scenarios)');
