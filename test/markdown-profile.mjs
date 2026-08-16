// Markdown 个人信息别名自检 — FIELD_ALIAS 曾定义未用, 中文 label 直存 key 导致导入不渲染.
// node test/markdown-profile.mjs 直接跑.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = readFileSync(join(root, 'markdown.js'), 'utf8');
const parseMarkdown = new Function(src + '; return parseMarkdown;')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

const d = parseMarkdown('## 个人信息\n- **姓名**：李四\n- **岗位**：前端工程师\n- **籍贯**：北京\n- **求职状态**：随时到岗\n- **电话**：13800000000');
assert(d.profile.name === '李四', '中文 label 姓名 → name');
assert(d.profile.location === '北京', '籍贯 → location');
assert(d.profile.jobStatus === '随时到岗', '求职状态 → jobStatus');
assert(d.profile.title === '前端工程师' && d.profile.phone === '13800000000', 'title/phone 别名');
assert(!('姓名' in d.profile) && !('籍贯' in d.profile), '中文 key 不残留');

console.log('markdown-profile self-check OK (5 assertions)');
