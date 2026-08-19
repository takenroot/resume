// migrateV1toV2 + 空值省略自检 — schema v2 重构的核心回归 (契约 docs/SCHEMA_V2.md).
// node test/migrate-v2.mjs 直接跑. 走 normalizeSavedData 全链路 (migrate → 数组归一 → boolean 归一 → stripEmpties).
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'config.js', 'data.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const api = new Function(src + '; return { normalize: function (d) { cvData = d; normalizeSavedData(); return cvData; }, collectWarnings: collectWarnings };')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

// v1 全特征 fixture: period 自由文本/中文枚举/wrap1/空串占位/僵尸字段
const v1 = {
  schemaVersion: '2026-08-15',
  profile: {
    name: '张三', experience: '5年', location: '北京', timeline: '预留', jobStatus: '在职-看机会',
    expectJobs: [{ title: '前端', salary: { low: 0, high: 20 }, cities: [] }],
    github: ''
  },
  sections: [
    { type: 'experience', title: '工作经历', items: [
      { company: 'A公司', period: '2022.01 - 至今', achievements: ['做了x'], skillTags: ['Vue'], industry: '', isIntern: false },
      { company: 'B公司', period: '2019/3-2021/12', summary: '' }
    ] },
    { type: 'education', title: '教育背景', items: [
      { school: 'X大学', period: '2015.09 - 2019.06', degreeType: '全日制', honors: ['奖学金'], courses: '数据结构、操作系统' },
      { school: 'Y中学', period: '2020年疫情期间' }
    ] },
    { type: 'certificate', title: '证书', items: [{ name: 'CET-6', period: '2020.06' }] },
    { type: 'projects', title: '项目经验', items: [{ name: 'P', period: '2021.01 - 2021.06', achievements: '指标+50%、超额完成\n第二条含、顿号' }] }
  ]
};

const d = api.normalize(JSON.parse(JSON.stringify(v1)));

// profile 层
assert(d.profile.workYears === '5年' && !('experience' in d.profile), 'experience → workYears');
assert(d.profile.nativePlace === '北京' && !('location' in d.profile), 'location → nativePlace');
assert(!('timeline' in d.profile), 'timeline 僵尸字段删除');
assert(d.profile.jobStatus === 'open', 'jobStatus 中文 → 码 (在职-看机会 → open)');
const ej = d.profile.expectJobs;
assert(ej && !Array.isArray(ej) && ej.title === '前端', 'expectJobs wrap1 去数组');
assert(ej.salary.low === 0, 'salary.low 0 保留 (0 是有意义值)');
assert(!('cities' in ej), '空数组 cities 省略');
assert(!('github' in d.profile), '空串 github 省略');

// experience item 层
const e0 = d.sections[0].items[0];
assert(e0.startDate === '2022-01' && !('endDate' in e0) && !('period' in e0), 'period → startDate, 至今 = endDate 省略');
assert(e0.highlights && e0.highlights[0] === '做了x' && !('achievements' in e0), 'achievements → highlights');
assert(e0.tags && e0.tags[0] === 'Vue' && !('skillTags' in e0), 'skillTags → tags');
assert(!('industry' in e0), '空串 industry 省略');
assert(e0.isIntern === false, 'isIntern false 保留 (false 是有意义值)');
const e1 = d.sections[0].items[1];
assert(e1.startDate === '2019-03' && e1.endDate === '2021-12', 'period 变体 (斜杠/单位月份/无空格) 解析');
assert(!('summary' in e1), '空串 summary 省略');

// education
const ed = d.sections[1].items[0];
assert(ed.startDate === '2015-09' && ed.endDate === '2019-06', 'education period 拆分');
assert(ed.degreeType === 'fulltime', 'degreeType 中文 → 码');
assert(ed.highlights && ed.highlights[0] === '奖学金' && !('honors' in ed), 'honors → highlights');
assert(Array.isArray(ed.courses) && ed.courses.length === 2 && ed.courses[1] === '操作系统', 'courses 字符串 → 数组 (顿号分隔)');

// 解析失败: startDate 保原文 + warning 冒头 (不丢数据)
const ed2 = d.sections[1].items[1];
assert(ed2.startDate === '2020年疫情期间' && !('period' in ed2), '无法解析的 period 原文进 startDate');
assert(api.collectWarnings(d).some(function (w) { return w.indexOf('2020年疫情期间') >= 0; }), '解析失败出 warning');

// certificate / projects
assert(d.sections[2].items[0].date === '2020-06' && !('period' in d.sections[2].items[0]), 'certificate period → date');
assert(d.sections[3].items[0].highlights.length === 2 && d.sections[3].items[0].highlights[0] === '指标+50%、超额完成', 'projects achievements → highlights; 字符串只按行拆, 顿号保留');

// 幂等: 再跑一次结果不变
const again = JSON.stringify(api.normalize(JSON.parse(JSON.stringify(d))));
assert(again === JSON.stringify(d), '迁移幂等 (v2 数据二次归一不变)');

// v2 数据无 v1 键 → 纯 no-op (不动 startDate/endDate)
const v2 = { profile: { jobStatus: 'available' }, sections: [{ type: 'experience', title: 'x', items: [{ startDate: '2022-01', endDate: '2023-05' }] }] };
const v2out = api.normalize(v2);
assert(v2out.sections[0].items[0].startDate === '2022-01' && v2out.sections[0].items[0].endDate === '2023-05' && v2out.profile.jobStatus === 'available', 'v2 数据原样通过');

console.log('migrate-v2 self-check OK (21 assertions)');
