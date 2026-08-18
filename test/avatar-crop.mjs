// 头像裁剪换算自检 — prefs.js avatarCropVars 纯函数 (弹窗状态 → background 变量).
// node test/avatar-crop.mjs 直接跑. prefs.js 无 DOM 依赖的部分可以直接 new Function.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js', 'prefs.js'), 'utf8');
const avatarCropVars = new Function(src + '; return avatarCropVars;')();

function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }

// 1. 无裁剪 / 非法值 → null (applyPrefs 走 removeProperty 回落 cover)
assert(avatarCropVars(null) === null, 'crop=null → null');
assert(avatarCropVars({}) === null, '空对象 → null');
assert(avatarCropVars({ ox: 0, oy: 0, iw: 0, ih: 10, fw: 10, fh: 10 }) === null, 'iw=0 → null');

// 2. 图片与框同比例、刚好铺满、无偏移 → size 100%, 居中 50% 50%
let v = avatarCropVars({ ox: 0, oy: 0, iw: 260, ih: 364, fw: 260, fh: 364 });
assert(v.size === '100.00% auto', '铺满 → size 100%, got ' + v.size);
assert(v.pos === '50.00% 50.00%', '铺满 → pos 居中, got ' + v.pos);
assert(v.ratio === '1.4000', '5:7 比例, got ' + v.ratio);

// 3. 图 2 倍宽、左移半框 → size 200%, X=50 (水平居中); 顶对齐 oy=0 → Y=0
v = avatarCropVars({ ox: -130, oy: 0, iw: 520, ih: 728, fw: 260, fh: 364 });
assert(v.size === '200.00% auto', 'iw=2fw → size 200%, got ' + v.size);
assert(v.pos === '50.00% 0.00%', '水平居中 + 顶对齐, got ' + v.pos);

// 4. 框 1:1 (方形/圆形) → ratio 1
v = avatarCropVars({ ox: 0, oy: -50, iw: 260, ih: 520, fw: 260, fh: 260 });
assert(v.ratio === '1.0000', '1:1 框 → ratio 1, got ' + v.ratio);
// oy=-50, fh=260, ih=520: p = (50/260) / (2-1) * 100 ≈ 19.23
assert(v.pos === '50.00% 19.23%', '垂直偏移换算, got ' + v.pos);

console.log('avatar-crop self-check OK (8 assertions)');
