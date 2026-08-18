// M3 bullet 级分页自检 — pagination.js 首个测试 (此前分页零覆盖).
// 高度模型: 节点高 = 自身 _h + 子节点和, 页容量 CAP 由 stub 的 clientHeight 给. 线性加和足够测决策逻辑.
// node test/paginate-split.mjs 直接跑.
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const CAP = 100, HEADER_H = 30, SECH_H = 10, H3_H = 10, H4_H = 5, LI_H = 10;

/* ---------- 最小 DOM stub: 只实现 pagination.js 触到的面 ---------- */
function matchSimple(n, sel) {
  if (sel[0] === '[') return n.attrs[sel.slice(1, -1)] !== undefined;
  const parts = sel.split('.'), tag = parts[0], classes = parts.slice(1);
  if (tag && n.tagName !== tag.toUpperCase()) return false;
  return classes.every(function (c) { return n.classList.contains(c); });
}
function descendants(n) { const out = []; n.children.forEach(function (c) { out.push(c); descendants(c).forEach(function (x) { out.push(x); }); }); return out; }
function qsa(root, sel) {
  if (sel.indexOf(',') >= 0) { const out = []; sel.split(',').forEach(function (s) { qsa(root, s.trim()).forEach(function (n) { if (out.indexOf(n) < 0) out.push(n); }); }); return out; }
  let cur = [root];
  sel.split(/\s+/).forEach(function (s) {
    const next = [];
    cur.forEach(function (n) { descendants(n).forEach(function (d) { if (matchSimple(d, s)) next.push(d); }); });
    cur = next;
  });
  return cur;
}
function makeEl(tag) {
  const el = {
    tagName: tag.toUpperCase(), className: '', attrs: {}, children: [], parentNode: null, textContent: '', _h: 0,
    get classList() { const self = this; return {
      contains: function (c) { return self.className.split(/\s+/).indexOf(c) >= 0; },
      add: function (c) { if (!this.contains(c)) self.className = (self.className ? self.className + ' ' : '') + c; }
    }; },
    setAttribute: function (k, v) { this.attrs[k] = v; },
    appendChild: function (c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; },
    removeChild: function (c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; },
    remove: function () { if (this.parentNode) this.parentNode.removeChild(this); },
    replaceChildren: function () { this.children.forEach(function (c) { c.parentNode = null; }); this.children = []; },
    cloneNode: function (deep) {
      const c = makeEl(this.tagName);
      c.className = this.className; c.attrs = Object.assign({}, this.attrs); c._h = this._h; c.textContent = this.textContent;
      if (deep) this.children.forEach(function (ch) { c.appendChild(ch.cloneNode(true)); });
      return c;
    },
    querySelector: function (s) { return qsa(this, s)[0] || null; },
    querySelectorAll: function (s) { return qsa(this, s); },
    closest: function (s) { let n = this; while (n) { if (matchSimple(n, s)) return n; n = n.parentNode; } return null; },
    get scrollHeight() { return this._h + this.children.reduce(function (a, c) { return a + c.scrollHeight; }, 0); },
    get clientHeight() { return this.classList.contains('resume-page-content') ? CAP : this.scrollHeight; },
    set innerHTML(v) { this.replaceChildren(); if (v && v.indexOf('<span') >= 0) this.appendChild(makeEl('span')); },
    get innerHTML() { return ''; }
  };
  return el;
}

const rs = makeEl('div'), rp = makeEl('div');
globalThis.document = { createElement: makeEl, getElementById: function (id) { return id === 'resumeSource' ? rs : id === 'resumePages' ? rp : null; } };

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'js');
const src = ['utils.js', 'pagination.js'].map(function (f) { return readFileSync(join(root, f), 'utf8'); }).join('\n');
const paginateResume = new Function(src + '; return paginateResume;')();

/* ---------- 造数据 ---------- */
function item(name, liCounts) { // liCounts: 数组, 每个元素 = 一个 item-section-list 的 li 数
  const a = makeEl('article'); a.className = 'timeline-item';
  const head = makeEl('div'); head.className = 'item-head';
  const hw = makeEl('div'), h3 = makeEl('h3'); h3._h = H3_H; h3.textContent = name;
  hw.appendChild(h3); head.appendChild(hw); a.appendChild(head);
  liCounts.forEach(function (n) {
    if (n <= 0) return;
    const sec = makeEl('div'); sec.className = 'item-section';
    const h4 = makeEl('h4'); h4._h = H4_H; sec.appendChild(h4);
    const ul = makeEl('ul'); ul.className = 'item-section-list';
    for (let i = 0; i < n; i++) { const li = makeEl('li'); li._h = LI_H; ul.appendChild(li); }
    sec.appendChild(ul); a.appendChild(sec);
  });
  return a;
}
function section(liCountsPerItem) {
  const s = makeEl('section'); s.className = 'resume-section';
  const hd = makeEl('div'); hd.className = 'section-heading'; hd._h = SECH_H;
  hd.appendChild(makeEl('h2')); s.appendChild(hd);
  const rl = makeEl('div'); rl.setAttribute('data-render-list', 'x'); s.appendChild(rl);
  liCountsPerItem.forEach(function (lc, i) { rl.appendChild(item('it' + i, lc)); });
  return s;
}
function reset(sections) {
  rs.replaceChildren(); rp.replaceChildren();
  const hd = makeEl('div'); hd.className = 'resume-header'; hd._h = HEADER_H;
  rs.appendChild(hd);
  sections.forEach(function (s) { rs.appendChild(s); });
}
function assert(cond, msg) { if (!cond) { console.error('FAIL: ' + msg); process.exit(1); } }
function liCountsOf(page) { return qsa(page, 'article').map(function (a) { return qsa(a, 'ul.item-section-list').reduce(function (n, ul) { return n + ul.children.length; }, 0); }); }
function contTagsOf(page) { return qsa(page, '.item-cont-tag').length; }

/* 1. 基本剖分: 6 条 bullet 的条目 4+2 切两页, 续件带（续）标记, 标题跨页重复, bullet 守恒, 续件瘦身 */
reset([section([[6]])]);
(function () { // 给条目挂上简介和标签云 (各 5px), 验证续件把它们剥掉
  const a = rs.children[1].querySelector('article');
  const sm = makeEl('p'); sm.className = 'summary'; sm._h = 5; a.appendChild(sm);
  const tl = makeEl('ul'); tl.className = 'tag-list item-subtitle'; tl._h = 5; a.appendChild(tl);
})();
paginateResume();
assert(rp.children.length === 2, 'S1 页数=2, 实际 ' + rp.children.length);
assert(liCountsOf(rp.children[0]).join() === '3', 'S1 P1 留 3 条, 实际 ' + liCountsOf(rp.children[0]));
assert(liCountsOf(rp.children[1]).join() === '3', 'S1 P2 续 3 条');
assert(contTagsOf(rp.children[0]) === 0 && contTagsOf(rp.children[1]) === 1, 'S1 续件带且仅 P2 带（续）');
assert(rp.children[1].querySelectorAll('.section-heading').length === 1, 'S1 P2 重复模块标题');
assert(qsa(rp.children[1], '.summary').length === 0 && qsa(rp.children[1], '.tag-list').length === 0, 'S1 续件剥掉简介+标签云');
assert(qsa(rp.children[0], '.summary').length === 1 && qsa(rp.children[0], '.tag-list').length === 1, 'S1 本页保留简介+标签云');

/* 2. 无列表条目 (纯 summary) 溢出 → 整件搬走, 不剖, 不带标记 */
reset([section([[0]]), section([[0]])]);
rs.children[2].querySelector('article').appendChild((function () { const p = makeEl('p'); p._h = 45; return p; })()); // 第二条 section 的条目加高 summary, 不可剖
paginateResume();
assert(rp.children.length === 2, 'S2 页数=2, 实际 ' + rp.children.length);
assert(liCountsOf(rp.children[0]).join() === '0' && qsa(rp.children[0], 'article').length === 1, 'S2 P1 只留第一条');
assert(qsa(rp.children[1], 'article').length === 1 && contTagsOf(rp.children[1]) === 0, 'S2 整搬不带（续）');

/* 3. 防孤行: 本页剩余空间连「头+1 条」都放不下 → 整件搬走, 前页条目保持完整 */
reset([section([[4], [3]])]);
paginateResume(); // 95 满后, 第二件头+1=25 塞不下 → 整件去 P2
assert(rp.children.length === 2, 'S3 页数=2, 实际 ' + rp.children.length);
assert(liCountsOf(rp.children[0]).join() === '4', 'S3 P1 第一件完整 4 条, 实际 ' + liCountsOf(rp.children[0]));
assert(liCountsOf(rp.children[1]).join() === '3' && contTagsOf(rp.children[1]) === 0, 'S3 P2 整件 3 条无标记');

/* 4. 巨型条目跨三页剖两次 (4/7/1), 二次续件标记不叠加 */
reset([section([[12]])]);
paginateResume();
assert(rp.children.length === 3, 'S4 页数=3, 实际 ' + rp.children.length);
assert(liCountsOf(rp.children[0]).join() + ',' + liCountsOf(rp.children[1]).join() + ',' + liCountsOf(rp.children[2]).join() === '4,7,1', 'S4 切分 4/7/1, 实际 ' + rp.children.map(liCountsOf).join('|'));
assert(qsa(rp.children[2], 'h3')[0].querySelectorAll('.item-cont-tag').length === 1, 'S4 二次续件（续）不叠加');

/* 5. 单条超页且不可剖 → 硬放接受溢出, 不死循环 (测试能跑完即证明) */
reset([section([[0]])]);
rs.children[1].querySelector('article').appendChild((function () { const p = makeEl('p'); p._h = 200; return p; })());
paginateResume();
assert(rp.children.length === 1, 'S5 超页单条硬放, 页数=1, 实际 ' + rp.children.length);

/* 6. 多列表条目跨列表切: [2,3] 切成 前表2+后表2 | 后表1, 续件里空掉的前表整块移除 */
reset([section([[2, 3]])]);
paginateResume();
assert(rp.children.length === 2, 'S6 页数=2, 实际 ' + rp.children.length);
assert(liCountsOf(rp.children[0]).join() === '4' && liCountsOf(rp.children[1]).join() === '1', 'S6 切分 4|1, 实际 ' + rp.children.map(liCountsOf).join('|'));
assert(qsa(rp.children[1], 'article')[0].querySelectorAll('.item-section').length === 1, 'S6 续件空列表 section 已移除');

console.log('paginate-split self-check OK (6 scenarios)');
