/* ===========================================================
   CV 简历网页 — 偏好设置（主题 / 字号 / 字体）
   =========================================================== */
const PREFS_KEY = 'cv_prefs', THEMES = { academic: { name: '学术', vars: { '--accent': '#8b0000', '--canvas-bg': '#f5f5f0', '--paper-bg': '#fffff8' } }, modern: { name: '现代', vars: { '--accent': '#0ea5e9', '--canvas-bg': '#f0f9ff', '--text-soft': '#475569' } }, simple: { name: '简约', vars: { '--accent': '#6b7280', '--canvas-bg': '#f9fafb', '--line-soft': '#d1d5db' } } }, FONT_SIZES = { small: { name: '小', vars: { '--fs-body': '11.5px', '--fs-meta': '11px', '--fs-h1': '27px', '--fs-h2': '14px', '--fs-h3': '13px' } }, medium: { name: '中', vars: { '--fs-body': '12.5px', '--fs-meta': '12px', '--fs-h1': '30px', '--fs-h2': '16px', '--fs-h3': '14px' } }, large: { name: '大', vars: { '--fs-body': '13.5px', '--fs-meta': '13px', '--fs-h1': '33px', '--fs-h2': '18px', '--fs-h3': '15px' } } }, FONT_FAMILIES = { default: { name: '默认', value: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif' }, yahei: { name: '微软雅黑', value: '"Microsoft YaHei", "PingFang SC", sans-serif' }, serif: { name: '衬线体', value: 'Georgia, "SimSun", serif' } };
let cvPrefs = null;

// ponytail: THEMES 删 default key 后, 用户初始 prefs 没有 theme 字段. fallback 到 themes 第一个键. 应用时也用 fallback 链 (THEMES[k] || THEMES[first]).
const FIRST_THEME = Object.keys(THEMES)[0];

function loadPrefs() { const st = localStorage.getItem(PREFS_KEY); if (st) { try { cvPrefs = JSON.parse(st); } catch (e) { cvPrefs = null; } } if (!cvPrefs) cvPrefs = { fontFamily: 'default', fontSize: 'medium', theme: FIRST_THEME }; if (!cvPrefs.theme || !THEMES[cvPrefs.theme]) cvPrefs.theme = FIRST_THEME; if (!FONT_FAMILIES[cvPrefs.fontFamily]) cvPrefs.fontFamily = 'default'; if (!Array.isArray(cvPrefs.profileHidden)) cvPrefs.profileHidden = []; if (typeof cvPrefs.showAvatar !== 'boolean') cvPrefs.showAvatar = true; if (cvPrefs.essentialLayout !== 'grid') cvPrefs.essentialLayout = 'flow'; if (cvPrefs.nameAlign !== 'center') cvPrefs.nameAlign = 'left'; if (['rounded', 'circle', 'square'].indexOf(cvPrefs.avatarShape) < 0) cvPrefs.avatarShape = 'rounded'; if (cvPrefs.pillDensity !== 'loose') cvPrefs.pillDensity = 'compact'; if (typeof cvPrefs.headerRule !== 'boolean') cvPrefs.headerRule = false; if (typeof cvPrefs.essentialIcons !== 'boolean') cvPrefs.essentialIcons = true; }
function savePrefs() { localStorage.setItem(PREFS_KEY, JSON.stringify(cvPrefs)); }
function applyPrefs() { const r = document.documentElement, th = THEMES[cvPrefs.theme] || THEMES[FIRST_THEME], fs = FONT_SIZES[cvPrefs.fontSize] || FONT_SIZES.medium, ff = FONT_FAMILIES[cvPrefs.fontFamily] || FONT_FAMILIES.default; Object.entries(th.vars).forEach(function (kv) { r.style.setProperty(kv[0], kv[1]); }); Object.entries(fs.vars).forEach(function (kv) { r.style.setProperty(kv[0], kv[1]); }); r.style.setProperty('--font-family', ff.value);
  // ponytail: 头部样式开关 — 全走 CSS 变量/类, 不重渲染 DOM. 值在 loadPrefs 已归一.
  r.style.setProperty('--name-align', cvPrefs.nameAlign);
  r.style.setProperty('--avatar-radius', { rounded: '4px', circle: '50%', square: '0' }[cvPrefs.avatarShape]);
  const loose = cvPrefs.pillDensity === 'loose';
  r.style.setProperty('--pill-gap', loose ? '12px' : '8px');
  r.style.setProperty('--pill-pad', loose ? '4px 14px' : '2px 10px');
  r.style.setProperty('--header-rule', cvPrefs.headerRule ? '1px solid var(--line-soft)' : '0');
  document.body.classList.toggle('no-icons', cvPrefs.essentialIcons === false); }

// ponytail: 头部字段显隐 — 存 prefs.profileHidden (视图层偏好, 不进数据/不影响导出与平台填充).
// 默认「填了就显示」: 空字段渲染层本来就跳过, 开关只管「填了但不想展示」.
function isProfileShown(k) { return !cvPrefs || cvPrefs.profileHidden.indexOf(k) < 0; }

function bindPrefChangeEvents() { const ts = document.getElementById('prefTheme'), ss = document.getElementById('prefFontSize'), fs = document.getElementById('prefFontFamily'); if (ts) { ts.removeEventListener('change', onPrefThemeChange); ts.addEventListener('change', onPrefThemeChange); } if (ss) { ss.removeEventListener('change', onPrefSizeChange); ss.addEventListener('change', onPrefSizeChange); } if (fs) { fs.removeEventListener('change', onPrefFontChange); fs.addEventListener('change', onPrefFontChange); } }
function onPrefThemeChange() { cvPrefs.theme = this.value; savePrefs(); applyPrefs(); }
function onPrefSizeChange() { cvPrefs.fontSize = this.value; savePrefs(); applyPrefs(); }
function onPrefFontChange() { cvPrefs.fontFamily = this.value; savePrefs(); applyPrefs(); }