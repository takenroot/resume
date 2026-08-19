/* ===========================================================
   CV 简历网页 — 偏好设置（主题 / 字号 / 字体）
   =========================================================== */
const PREFS_KEY = 'cv_prefs', THEMES = { academic: { name: '学术', vars: { '--accent': '#8b0000', '--canvas-bg': '#f5f5f0', '--paper-bg': '#fffff8' } }, modern: { name: '现代', vars: { '--accent': '#0ea5e9', '--canvas-bg': '#f0f9ff', '--text-soft': '#475569' } }, simple: { name: '简约', vars: { '--accent': '#6b7280', '--canvas-bg': '#f9fafb', '--line-soft': '#d1d5db' } } }, FONT_SIZES = { small: { name: '小', vars: { '--fs-body': '11.5px', '--fs-meta': '11px', '--fs-h1': '27px', '--fs-h2': '14px', '--fs-h3': '13px' } }, medium: { name: '中', vars: { '--fs-body': '12.5px', '--fs-meta': '12px', '--fs-h1': '30px', '--fs-h2': '16px', '--fs-h3': '14px' } }, large: { name: '大', vars: { '--fs-body': '13.5px', '--fs-meta': '13px', '--fs-h1': '33px', '--fs-h2': '18px', '--fs-h3': '15px' } } }, FONT_FAMILIES = { default: { name: '默认', value: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' }, yahei: { name: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' }, serif: { name: '衬线体', value: 'Georgia, "SimSun", serif' } };
let cvPrefs = null;

// ponytail: THEMES 删 default key 后, 用户初始 prefs 没有 theme 字段. fallback 到 themes 第一个键. 应用时也用 fallback 链 (THEMES[k] || THEMES[first]).
const FIRST_THEME = Object.keys(THEMES)[0];
// ponytail: 主题变量钥匙串 — applyPrefs 切主题前先清掉别的主题设过、当前主题没有的变量
// (学术的 --paper-bg 不覆盖就永远残留在 :root 内联样式上, 切回现代纸还是黄的).
const THEME_VAR_KEYS = []; Object.keys(THEMES).forEach(function (k) { Object.keys(THEMES[k].vars).forEach(function (v) { if (THEME_VAR_KEYS.indexOf(v) < 0) THEME_VAR_KEYS.push(v); }); });

function loadPrefs() { const st = localStorage.getItem(PREFS_KEY); if (st) { try { cvPrefs = JSON.parse(st); } catch (e) { cvPrefs = null; } } if (!cvPrefs) cvPrefs = { fontFamily: 'default', fontSize: 'medium', theme: FIRST_THEME }; if (!cvPrefs.theme || !THEMES[cvPrefs.theme]) cvPrefs.theme = FIRST_THEME; if (!FONT_FAMILIES[cvPrefs.fontFamily]) cvPrefs.fontFamily = 'default'; if (!Array.isArray(cvPrefs.profileHidden)) cvPrefs.profileHidden = []; cvPrefs.profileHidden = cvPrefs.profileHidden.map(function (k) { return k === 'experience' ? 'workYears' : k === 'location' ? 'nativePlace' : k; }); /* ponytail: v1 显隐键随数据改名 (schema v2). */ if (!Array.isArray(cvPrefs.eduHidden)) cvPrefs.eduHidden = []; if (typeof cvPrefs.showAvatar !== 'boolean') cvPrefs.showAvatar = true; if (cvPrefs.essentialLayout !== 'grid') cvPrefs.essentialLayout = 'flow'; if (cvPrefs.nameAlign !== 'center') cvPrefs.nameAlign = 'left'; if (['rounded', 'circle', 'square', 'squareBox'].indexOf(cvPrefs.avatarShape) < 0) cvPrefs.avatarShape = 'rounded'; if (cvPrefs.pillDensity !== 'loose') cvPrefs.pillDensity = 'compact'; if (typeof cvPrefs.headerRule !== 'boolean') cvPrefs.headerRule = false; if (typeof cvPrefs.essentialIcons !== 'boolean') cvPrefs.essentialIcons = true; if (typeof cvPrefs.plainText !== 'boolean') cvPrefs.plainText = false; const ac = cvPrefs.avatarCrop; if (ac !== null && ac !== undefined && !(typeof ac === 'object' && ac.iw > 0 && ac.ih > 0 && ac.fw > 0 && ac.fh > 0)) cvPrefs.avatarCrop = null; if (cvPrefs.avatarCrop && cvPrefs.avatarCrop.fh > cvPrefs.avatarCrop.fw * 2) cvPrefs.avatarCrop = null; } // ponytail: 比例超 2:1 的旧裁剪直接丢弃 — 移动端绝对定位头像会溢出头部, 回落 cover 安全.

// ponytail: 1:1 形状谓词单源 — applyPrefs 与裁剪弹窗 (editor.js openAvatarCrop) 共用, 加形状只改这里.
function avatarShapeIsSquare() { return cvPrefs.avatarShape === 'circle' || cvPrefs.avatarShape === 'squareBox'; }

// ponytail: 头像裁剪 — 弹窗原始状态 {ox,oy,iw,ih,fw,fh} (偏移/图片显示宽高/选择框宽高, px) 原样存,
// 这里换算成 background 变量: S = 图宽占盒宽 %, pos% 对齐公式 p% → 偏移 = -p% × (图−盒).
// squareBox=true 时盒子被压成 1:1, Y% 必须按方盒高 (=fw) 算, 否则纵向偏移错位.
function avatarCropVars(crop, squareBox) {
  if (!crop || !(crop.iw > 0) || !(crop.ih > 0) || !(crop.fw > 0) || !(crop.fh > 0)) return null;
  const s = crop.iw / crop.fw, bh = squareBox ? crop.fw : crop.fh;
  function pct(o, f, img) { const r = img / f; return r <= 1 ? 50 : Math.min(100, Math.max(0, (-o / f) / (r - 1) * 100)); }
  return { size: (s * 100).toFixed(2) + '% auto', pos: pct(crop.ox, crop.fw, crop.iw).toFixed(2) + '% ' + pct(crop.oy, bh, crop.ih).toFixed(2) + '%', ratio: (squareBox ? 1 : crop.fh / crop.fw).toFixed(4) };
}
// ponytail: 换图清裁剪单入口 — 上传/清除头像/手改 URL/改名换本地头像/导入, 五处都走这里.
function resetAvatarCrop() { if (!cvPrefs.avatarCrop) return; cvPrefs.avatarCrop = null; savePrefs(); applyPrefs(); }
function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(cvPrefs)); }
function applyPrefs() { const r = document.documentElement, th = THEMES[cvPrefs.theme] || THEMES[FIRST_THEME], fs = FONT_SIZES[cvPrefs.fontSize] || FONT_SIZES.medium, ff = FONT_FAMILIES[cvPrefs.fontFamily] || FONT_FAMILIES.default; THEME_VAR_KEYS.forEach(function (k) { r.style.removeProperty(k); }); Object.entries(th.vars).forEach(function (kv) { r.style.setProperty(kv[0], kv[1]); }); Object.entries(fs.vars).forEach(function (kv) { r.style.setProperty(kv[0], kv[1]); }); r.style.setProperty('--font-family', ff.value);
  // ponytail: 头部样式开关 — 全走 CSS 变量/类, 不重渲染 DOM. 值在 loadPrefs 已归一.
  r.style.setProperty('--name-align', cvPrefs.nameAlign);
  r.style.setProperty('--lines-justify', cvPrefs.nameAlign === 'center' ? 'center' : '');
  const circle = cvPrefs.avatarShape === 'circle';
  // ponytail: squareBox(正方形) 与 circle 共用 1:1 盒子规则, 只 radius 不同; 直角/正方形都是 0.
  r.style.setProperty('--avatar-radius', circle ? '50%' : cvPrefs.avatarShape === 'rounded' ? '4px' : '0');
  // ponytail: 按形状分档阴影 — 圆形最软 (大而柔), 圆角居中, 直角/正方形最贴 (锐利); 打印/移动端样式表直接关.
  r.style.setProperty('--avatar-shadow', circle ? '0 2px 10px rgba(15, 23, 42, 0.22)' : cvPrefs.avatarShape === 'rounded' ? '0 1px 6px rgba(15, 23, 42, 0.18)' : '0 1px 3px rgba(15, 23, 42, 0.16)');
  // ponytail: 正圆/正方形必须正方形盒子 — 头像默认 5:7 (一寸照), 50% radius 在非方形上是椭圆.
  // 盒子比例走 --avatar-ratio (styles.css :root 的 --avatar-height 引用它), 方形盒下 avatarCropVars 已按方盒重算 pos.
  const sq = avatarShapeIsSquare();
  const acv = avatarCropVars(cvPrefs.avatarCrop, sq);
  r.style.setProperty('--avatar-ratio', acv ? acv.ratio : sq ? '1' : '1.4');
  if (acv) { r.style.setProperty('--avatar-pos', acv.pos); r.style.setProperty('--avatar-size', acv.size); }
  else { r.style.removeProperty('--avatar-pos'); r.style.removeProperty('--avatar-size'); }
  const loose = cvPrefs.pillDensity === 'loose';
  r.style.setProperty('--pill-gap', loose ? '12px' : '8px');
  r.style.setProperty('--pill-rgap', loose ? '8px' : '4px');
  r.style.setProperty('--pill-pad', loose ? '4px 14px' : '2px 10px');
  r.style.setProperty('--header-rule', cvPrefs.headerRule ? '1px solid var(--line-soft)' : '0');
  document.body.classList.toggle('no-icons', cvPrefs.essentialIcons === false); }

// ponytail: 头部字段显隐 — 存 prefs.profileHidden (视图层偏好, 不进数据/不影响导出与平台填充).
// 默认「填了就显示」: 空字段渲染层本来就跳过, 开关只管「填了但不想展示」.
function isProfileShown(k) { return !cvPrefs || cvPrefs.profileHidden.indexOf(k) < 0; }

// ponytail: 教育字段显隐 — 同 profileHidden, 存 prefs.eduHidden (degreeType/isUnified), 视图层不碰数据.
function isEduShown(k) { return !cvPrefs || !Array.isArray(cvPrefs.eduHidden) || cvPrefs.eduHidden.indexOf(k) < 0; }

function bindPrefChangeEvents() { const ts = document.getElementById('prefTheme'), ss = document.getElementById('prefFontSize'), fs = document.getElementById('prefFontFamily'); if (ts) { ts.removeEventListener('change', onPrefThemeChange); ts.addEventListener('change', onPrefThemeChange); } if (ss) { ss.removeEventListener('change', onPrefSizeChange); ss.addEventListener('change', onPrefSizeChange); } if (fs) { fs.removeEventListener('change', onPrefFontChange); fs.addEventListener('change', onPrefFontChange); } }
function onPrefThemeChange() { cvPrefs.theme = this.value; savePrefs(); applyPrefs(); }
function onPrefSizeChange() { cvPrefs.fontSize = this.value; savePrefs(); applyPrefs(); }
function onPrefFontChange() { cvPrefs.fontFamily = this.value; savePrefs(); applyPrefs(); }