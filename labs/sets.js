/* Sets and functions lab (Mathematics 1, Week 1): numbers, set operations, counting with Venn diagrams, relations and
   functions, checked element by element with exact numbers.
   Topics are listed in labs.json; each one takes its values from the link (?A=1,2,3&B=2,3,4) and keeps them there.
   The link parameters of each topic are listed in the comment above it. The "Try" chips load the lectures' own
   examples (Maths 1 Week 1: lecture 1.2 natural numbers, 1.3 rationals, 1.4 reals, 1.5 sets, 1.6 subsets and set
   operations, 1.7 set examples, 1.8 Venn counting, 1.9 relations, 1.10 functions, 1.11 relation examples, 1.12
   function examples, 1.13 primes, 1.14 why √2 is irrational); a few telling cases are marked as made up here. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, T, h } = K;
  const S = K.sv;

  /* ================================================================== look */

  // the few styles only this lab needs, in the site's theme colours
  const CSS = [
    '.sl-try { min-height: 44px; line-height: 1.25; padding: 6px 12px; text-align: left; }',
    '.sl-set { font-family: var(--mono); font-size: .88em; overflow-wrap: anywhere; }',
    '.sl-group { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 14px; }',
    '.sl-group-h { font-size: 13px; font-weight: 800; color: var(--ink-2); }',
    '.sl-controls + .lk-out > * { min-width: 0; }',
    '@media (min-width: 861px) { .lk-controls.sl-controls { max-height: calc(100vh - 80px); overflow-y: auto; } }',
    '.sl-pic { width: 100%; height: auto; display: block; max-width: 560px; }',
    '.sl-pic text { font-family: var(--font); }',
    '.sl-pic .t { fill: var(--ink-2); font-size: 12px; }',
    '.sl-pic .ts { fill: var(--ink-3); font-size: 10.5px; }',
    '.sl-pic .tb { fill: var(--ink); font-size: 13px; font-weight: 700; }',
    '.sl-pic .tm { fill: var(--ink); font-size: 12px; font-family: var(--mono); }',
    '.sl-venn .tm { font-size: 13px; } .sl-venn3 .tm { font-size: 12px; }',
    '.sl-pic .tn { fill: var(--ink); font-size: 18px; font-weight: 750; }',
    '.sl-pic .thi { fill: var(--pick); }',
    '.sl-pic .tbad { fill: var(--bad); }',
    '.sl-pic .tgood { fill: var(--good); }',
    '.sl-pic .k0 { fill: var(--x); stroke: var(--x); } .sl-pic .k1 { fill: var(--y); stroke: var(--y); } .sl-pic .k2 { fill: var(--z); stroke: var(--z); }',
    '.sl-pic text.k0, .sl-pic text.k1, .sl-pic text.k2 { stroke: none; font-size: 15px; font-weight: 750; }',
    '.sl-pic .ring { fill: none !important; stroke-width: 2.2; }',
    '.sl-pic .box { fill: var(--bg-elev); stroke: var(--line-2); stroke-width: 1.4; }',
    '.sl-pic .box2 { fill: none; stroke: var(--line-2); stroke-width: 1.2; }',
    '.sl-pic .shade { fill: color-mix(in srgb, var(--pick) 30%, transparent); }',
    '.sl-pic .soft { fill: var(--accent-soft); stroke: var(--accent-line); stroke-width: 1.2; }',
    '.sl-pic .axis { stroke: var(--ink-3); stroke-width: 1.3; fill: none; }',
    '.sl-pic .gridl { stroke: var(--line); stroke-width: 1; }',
    '.sl-pic .guide { stroke: var(--line-2); stroke-width: 1; stroke-dasharray: 3 3; }',
    '.sl-pic .seg { stroke: var(--accent); stroke-width: 5; stroke-linecap: butt; }',
    '.sl-pic .seg.hi { stroke: var(--pick); }',
    '.sl-pic .dot { fill: var(--accent); stroke: var(--accent); stroke-width: 2; }',
    '.sl-pic .dot.open { fill: var(--bg-elev); }',
    '.sl-pic .dot.hi { fill: var(--pick); stroke: var(--pick); } .sl-pic .dot.hi.open { fill: var(--bg-elev); }',
    '.sl-pic .dot.bad { fill: var(--bad); stroke: var(--bad); } .sl-pic .dot.good { fill: var(--good); stroke: var(--good); }',
    '.sl-pic .tip { fill: var(--accent); } .sl-pic .tip.hi { fill: var(--pick); }',
    '.sl-pic .edge { stroke: var(--ink-3); stroke-width: 1.5; fill: none; }',
    '.sl-pic .edge.hi { stroke: var(--pick); stroke-width: 2.4; }',
    '.sl-pic .edge.bad { stroke: var(--bad); stroke-width: 2.4; }',
    '.sl-pic .edge.ok { stroke: var(--good); stroke-width: 2.4; }',
    '.sl-pic .edge.miss { stroke: var(--bad); stroke-width: 2; stroke-dasharray: 5 4; }',
    '.sl-pic .head { fill: var(--ink-3); } .sl-pic .head.hi { fill: var(--pick); } .sl-pic .head.bad, .sl-pic .head.miss { fill: var(--bad); } .sl-pic .head.ok { fill: var(--good); }',
    '.sl-pic .node { fill: var(--bg-elev); stroke: var(--ink-3); stroke-width: 1.4; }',
    '.sl-pic .node.hi { stroke: var(--pick); stroke-width: 2.4; fill: var(--pick-soft); }',
    '.sl-pic .node.bad { stroke: var(--bad); stroke-width: 2.4; fill: var(--bad-soft); }',
    '.sl-pic .node.miss { stroke: var(--bad); stroke-width: 2; stroke-dasharray: 4 3; }',
    '.sl-pic .curve { fill: none; stroke: var(--accent); stroke-width: 2.6; }',
    '.sl-pic .curve.out { stroke: var(--ink-4); stroke-width: 1.6; stroke-dasharray: 5 4; }',
    '.sl-pic .curve.two { stroke: var(--y); }',
    '.sl-pic .hline { stroke-width: 1.8; }',
    '.sl-pic .hline.bad { stroke: var(--bad); } .sl-pic .hline.good { stroke: var(--good); } .sl-pic .hline.miss { stroke: var(--bad); stroke-dasharray: 6 4; }',
    '.sl-pic .rangebar { stroke: var(--pick); stroke-width: 6; opacity: .75; }',
    '.sl-pic .codbar { stroke: var(--line-2); stroke-width: 10; }',
    '.sl-pic .dombar { stroke: var(--accent); stroke-width: 6; opacity: .75; }',
    '.sl-pic .sq { stroke: var(--bg-elev); stroke-width: 1.5; }',
    '.sl-pic .sq.s0 { fill: color-mix(in srgb, var(--x) 45%, var(--bg-elev)); } .sl-pic .sq.s1 { fill: color-mix(in srgb, var(--y) 45%, var(--bg-elev)); }',
    '.sl-pic .sq.s2 { fill: color-mix(in srgb, var(--z) 45%, var(--bg-elev)); } .sl-pic .sq.s3 { fill: color-mix(in srgb, var(--pick) 45%, var(--bg-elev)); }',
    '.sl-pic .ball { fill: color-mix(in srgb, var(--accent) 70%, var(--bg-elev)); }',
    '.sl-pic .ball.sq1 { fill: var(--pick); }',
    // relation tables
    '.sl-rel td, .sl-rel th { padding: 6px 7px; } .sl-rel td { min-width: 24px; font-size: 15px; }',
    '.sl-rel td.dg { background: var(--bg-sunk); }',
    '.sl-rel td.ok { background: var(--good-soft); color: var(--good); font-weight: 700; }',
    '.sl-rel td.bad { background: var(--bad-soft); color: var(--bad); font-weight: 700; }',
    '.sl-rel td.miss { outline: 2px dashed var(--bad); outline-offset: -4px; color: var(--bad); }',
    '.sl-rel td.hi { background: var(--pick-soft); color: var(--pick); font-weight: 700; }',
    // trial division and classes
    '.sl-trials { display: flex; flex-wrap: wrap; gap: 4px; max-height: 236px; overflow-y: auto; padding: 2px; }',
    '.sl-trial { display: inline-grid; min-width: 46px; padding: 3px 6px; border-radius: 8px; background: var(--bg-sunk); text-align: center; font-variant-numeric: tabular-nums; line-height: 1.2; }',
    '.sl-trial b { font-size: 14px; } .sl-trial small { font-size: 11px; color: var(--ink-3); }',
    '.sl-trial.yes { background: var(--pick-soft); outline: 1.5px solid var(--pick); } .sl-trial.yes small { color: var(--pick); font-weight: 700; }',
    '.sl-classes { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.sl-class { padding: 6px 10px; border-radius: 12px; border: 1.5px solid var(--line-2); background: var(--bg-sunk); }',
    '.sl-class b { display: block; font-size: 12px; color: var(--ink-3); }',
    '.sl-ok { color: var(--good); font-weight: 700; } .sl-no { color: var(--bad); font-weight: 700; }',
    '.lk-table.sl-wrap td, .lk-table.sl-wrap th { white-space: normal; text-align: left; vertical-align: top; }',
    '.lk-table.sl-wrap td:first-child, .lk-table.sl-wrap td:nth-child(2) { white-space: nowrap; }',
    '.sl-sets p { margin: .3em 0; }',
  ].join('\n');
  if (!document.getElementById('sets-lab-css')) document.head.append(h('style', { id: 'sets-lab-css', text: CSS }));

  /* ================================================================== small helpers */

  /** student text inside HTML: escaped, and never read as $maths$ */
  const esc = s => REV.esc(String(s)).replace(/\$/g, '&#36;');
  const pl = (k, one, many) => k + ' ' + (String(k) === '1' ? one : many || one + 's');
  const minus = s => String(s).replace(/-/g, '−');
  /** a fraction as plain text: 3/8, −2 */
  const fH = fr => minus(F(fr).str());
  /** how a fraction is written in the real-number views: as a decimal when the student typed decimals and it ends (3.5,
     not 7/2), else as a fraction; DISP.dec is switched on only while such a view is drawn */
  const DISP = { dec: false };
  const NT = fr => { fr = F(fr); return DISP.dec && !fr.isInt() && fr.exactDecimal(6) ? fr.dec(6) : T(fr); };
  const OK = '<span class="sl-ok">✓</span>', NO = '<span class="sl-no">✗</span>';
  const yes = b => (b ? OK : NO);
  let uid = 0;
  const wrap = svg => h('div', { class: 'lk-chart-wrap' }, svg);

  /** K.layout, with this lab's controls panel */
  const frame = el => { const f = K.layout(el); f.controls.classList.add('sl-controls'); return f; };
  /** rebuild the controls, keeping the keyboard focus on the same control */
  function refill(box, fill) {
    const all = () => [...box.querySelectorAll('button, input, select')];
    const i = all().indexOf(document.activeElement);
    box.innerHTML = '';
    fill();
    const el = i >= 0 ? all()[i] : null;
    if (el) el.focus({ preventScroll: true });
  }
  /** "Try" chips: each loads a lecture example or a telling case ([label, values, tooltip]) */
  const tries = (list, load) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }),
    h('div', { class: 'lk-presets' }, list.map(([label, patch, title]) => h('button', { type: 'button', class: 'lk-chip sl-try', text: label, title: title || null, onclick: () => load(typeof patch === 'function' ? patch() : patch) }))));
  /** the frame every topic shares: values from the link (fixed by fix), controls built by ui, output by draw */
  function topic(el, query, ctx, defaults, fix) {
    const t = { ui: () => {}, draw: () => {} };
    t.s = K.state(ctx, defaults, query, () => t.draw());
    fix(t.s.v);
    Object.assign(t, frame(el));
    /** new values that change the controls too (Try chips, a new mode): fix them, rebuild, redraw */
    t.load = patch => { t.s.set(patch, true); fix(t.s.v); refill(t.controls, t.ui); t.draw(); };
    t.start = (ui, draw) => {
      t.ui = ui;
      t.draw = () => {
        t.out.innerHTML = '';
        try { draw(); } catch (e) { console.error(e); t.out.append(K.note('This could not be worked out: ' + esc(e.message), 'warn')); }
      };
      refill(t.controls, ui); t.draw();
    };
    return t;
  }
  /** a text box whose keyboard shows numbers first */
  const numBox = o => { const f = K.text(o); const i = f.querySelector('input'); i.setAttribute('inputmode', o.mode || 'decimal'); return f; };
  /** a group of controls with a small heading */
  const group = (title, ...kids) => h('div', { class: 'sl-group' }, h('div', { class: 'sl-group-h', html: K.rich(title) }), ...kids);

  /* ------------------------------------------------------------------ whole numbers (BigInt) */
  const babs = a => (a < 0n ? -a : a);
  const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  function isqrt(n) { if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; }
  const isSq = n => n >= 0n && isqrt(n) ** 2n === n;
  function icbrt(n) { const neg = n < 0n; n = babs(n); let x = BigInt(Math.round(Math.cbrt(Number(n)))); while (x > 0n && x ** 3n > n) x--; while ((x + 1n) ** 3n <= n) x++; return neg ? -x : x; }
  /** the prime factors of n ≥ 1 as [[p, e], …], by trial division */
  function factor(n) {
    const out = [];
    for (let p = 2n; p * p <= n; p += p === 2n ? 1n : 2n) if (n % p === 0n) { let e = 0; while (n % p === 0n) { n /= p; e++; } out.push([p, e]); }
    if (n > 1n) out.push([n, 1]);
    return out;
  }
  const isPrime = n => { if (n < 2n) return false; for (let d = 2n; d * d <= n; d++) if (n % d === 0n) return false; return true; };
  /** 2 · 3² · 7 in TeX */
  const factT = fs => (fs.length ? fs.map(([p, e]) => p + (e > 1 ? '^{' + e + '}' : '')).join(' \\cdot ') : '1');
  /** 2 · 3 · 3 · 7 in TeX, every prime written out */
  const factLong = fs => fs.flatMap(([p, e]) => new Array(e).fill(String(p))).join(' \\cdot ') || '1';
  /** a whole number typed by the student, between lo and hi (BigInt); throws a message the page shows */
  function readWhole(v, lo, hi, what) {
    const s = String(v == null ? '' : v).trim().replace(/[\s,_]/g, '');
    if (!s) throw new Error('Type ' + what + '.');
    if (!/^\d+$/.test(s)) throw new Error(what[0].toUpperCase() + what.slice(1) + ' must be a whole number such as 126; “' + String(v).trim().slice(0, 20) + '” is not.');
    const n = BigInt(s);
    if (n < lo || n > hi) throw new Error(what[0].toUpperCase() + what.slice(1) + ' must be from ' + lo.toLocaleString('en') + ' to ' + hi.toLocaleString('en') + '.');
    return n;
  }
  const bigT = n => { const s = String(n); return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : s; };

  /* ================================================================== elements and sets typed as lists */

  const NUMRE = /^-?(?:\d+(?:\.\d+)?|\.\d+|\d+\/\d+)$/;
  /** one element typed by the student: a number (exact, so 1/2 and 0.5 are the same element) or a word */
  function elem(raw) {
    const t = String(raw).trim().replace(/\s+/g, ' ').replace(/[−–]/g, '-');
    if (NUMRE.test(t)) {
      let f;
      try { f = F.parse(t); } catch (e) { throw new Error('“' + t + '” is not a number: you cannot divide by 0.'); }
      return { key: 'n' + f.str(), label: fH(f), num: f, raw: t };
    }
    if (t.length > 24) throw new Error('“' + t.slice(0, 20) + '…” is too long for one element (24 letters at most).');
    if (/[{}()[\]]/.test(t)) throw new Error('“' + t + '”: brackets cannot be part of an element here. Separate the elements with commas.');
    return { key: 'w' + t, label: t, num: null };
  }
  /** "a, b, c" or "1..10" (or "{…}", "∅") → { items (no repeats, in order), dups } */
  function parseList(src, name, max = 60) {
    let s = String(src == null ? '' : src).trim();
    const m = /^\{([\s\S]*)\}$/.exec(s);
    if (m) s = m[1].trim();
    if (!s || s === '∅' || s === 'Ø') return { items: [], dups: [] };
    const items = [], dups = [], seen = new Set();
    for (const tok of s.split(/[,;\n]+/).map(x => x.trim()).filter(Boolean)) {
      const r = /^(-?\d+)\s*(?:\.\.|…)\s*(-?\d+)$/.exec(tok.replace(/[−–]/g, '-'));
      let list;
      if (r) {
        const lo = +r[1], hi = +r[2];
        if (hi < lo) throw new Error(name + ': “' + tok + '” should go up, like 1..10.');
        if (hi - lo + 1 > max) throw new Error(name + ': at most ' + max + ' elements, please.');
        list = []; for (let k = lo; k <= hi; k++) list.push(elem(String(k)));
      } else {
        try { list = [elem(tok)]; } catch (e) { throw new Error(name + ': ' + e.message); }
      }
      for (const e of list) { if (seen.has(e.key)) dups.push(e.raw && minus(e.raw) !== e.label ? minus(e.raw) + ' (= ' + e.label + ')' : e.label); else { seen.add(e.key); items.push(e); } }
      if (items.length > max) throw new Error(name + ': at most ' + max + ' elements, please.');
    }
    return { items, dups };
  }
  /** a set as HTML: {a, b, c} or ∅ */
  const setH = items => (items.length ? '<span class="sl-set">{' + items.map(i => esc(i.label)).join(', ') + '}</span>' : '$\\varnothing$');
  const has = (L, x) => L.some(i => i.key === x.key);
  const union = (X, Y) => X.concat(Y.filter(y => !has(X, y)));
  const inter = (X, Y) => X.filter(x => has(Y, x));
  const less = (X, Y) => X.filter(x => !has(Y, x));
  /** the elements in the order of the universe */
  const inOrder = (L, U) => U.filter(u => has(L, u)).concat(L.filter(x => !has(U, x)));
  const short = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  /* ================================================================== rules: conditions and formulas typed by the student
     x mod 2 = 0, x is prime, x ∈ ℤ, a ≤ b, a | b, a ≡ b (mod 5), |a − b| = 2, gcd(a, b) = 1, b = a + 1, x^2, 2x + 1, √x */

  /** an input with no value: division by 0, the square root of a negative number */
  class NoOut extends Error {}
  /** an irrational value such as √2: only its size is known */
  class Irr { constructor(x, tex) { this.x = x; this.tex = tex || ('\\approx ' + (+x.toFixed(4))); } }
  const OP1 = { '+': '+', '-': '-', '−': '-', '–': '-', '*': '*', '×': '*', '·': '*', '⋅': '*', '∙': '*', '/': '/', '÷': '/', '^': '^', '(': '(', ')': ')', '[': '(', ']': ')',
    ',': ',', '|': '|', '∣': '|', '∤': '∤', '=': '=', '<': '<', '>': '>', '≤': '<=', '≥': '>=', '≠': '!=', '≡': '≡', '∈': '∈', '∉': '∉', '√': '√', '∛': '∛', '²': '²', '³': '³',
    '!': '!', '¬': '!', '∧': '&&', '∨': '||', '&': '&&' };
  const OP2 = { '<=': '<=', '>=': '>=', '!=': '!=', '==': '=', '&&': '&&', '||': '||' };
  const FN1 = new Set(['sqrt', 'cbrt', 'abs', 'floor', 'prime', 'even', 'odd', 'square']), FN2 = new Set(['gcd', 'lcm']);
  const PRED = { prime: 'prime', even: 'even', odd: 'odd', square: 'square', composite: 'composite' };
  const CMP = { '=': '=', '!=': '!=', '<': '<', '<=': '<=', '>': '>', '>=': '>=' };
  function lex(src) {
    const s = String(src), out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i], rest = s.slice(i);
      if (/\s/.test(c)) { i++; continue; }
      let m = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(rest);
      if (m) { out.push({ k: 'num', v: m[0] }); i += m[0].length; continue; }
      m = /^[A-Za-z]+/.exec(rest);
      if (m) { out.push({ k: 'id', v: m[0], w: m[0].toLowerCase() }); i += m[0].length; continue; }
      if (OP2[rest.slice(0, 2)]) { out.push({ k: 'op', v: OP2[rest.slice(0, 2)] }); i += 2; continue; }
      if (c === '%') { out.push({ k: 'id', v: 'mod', w: 'mod' }); i++; continue; }
      if ('ℕℤℚℝ'.includes(c)) { out.push({ k: 'set', v: { 'ℕ': 'N', 'ℤ': 'Z', 'ℚ': 'Q', 'ℝ': 'R' }[c] }); i++; continue; }
      if (OP1[c]) { out.push({ k: 'op', v: OP1[c] }); i++; continue; }
      throw new Error('“' + c + '” is not understood in a rule');
    }
    return out;
  }
  /** a rule in the variables vars → a tree; throws a message the page shows */
  function parseRule(src, vars) {
    const tk = lex(src);
    if (!tk.length) throw new Error('the rule is empty');
    let i = 0, depth = 0;
    const op = v => tk[i] && tk[i].k === 'op' && tk[i].v === v;
    const word = w => tk[i] && tk[i].k === 'id' && tk[i].w === w;
    const near = () => (tk[i] ? ' before “' + tk[i].v + '”' : ' at the end');
    const need = (v, what) => { if (!op(v)) throw new Error('a ' + (what || '“' + v + '”') + ' is missing' + near()); i++; };
    const varRun = w => w.length > 1 && [...w].every(c => vars.includes(c));
    const startsAtom = () => {
      const t = tk[i];
      if (!t) return false;
      if (t.k === 'op' && t.v === '(' && tk[i + 1] && tk[i + 1].k === 'id' && tk[i + 1].w === 'mod') return false;   // "(mod 5)" after ≡ is not a factor
      return t.k === 'num' || (t.k === 'op' && ['(', '√', '∛'].includes(t.v)) || (t.k === 'id' && (vars.includes(t.w) || FN1.has(t.w) || FN2.has(t.w) || varRun(t.w)));
    };
    function orE() { let a = andE(); while (op('||') || word('or')) { i++; a = { t: 'or', a, b: andE() }; } return a; }
    function andE() { let a = notE(); while (op('&&') || word('and') || (depth === 0 && op(','))) { i++; a = { t: 'and', a, b: notE() }; } return a; }
    function notE() { if (op('!') || word('not')) { i++; return { t: 'not', a: notE() }; } return cmpE(); }
    function cmpE() {
      const a = sumE(false);
      if (word('is')) {
        i++;
        let not = false;
        if (word('not')) { i++; not = true; }
        if (word('a') || word('an')) i++;
        if (word('perfect')) i++;
        const w = tk[i] && tk[i].k === 'id' && PRED[tk[i].w];
        if (!w) throw new Error('after “is”, write prime, even, odd, composite or a perfect square');
        i++;
        return { t: 'is', a, what: w, not };
      }
      if (op('∈') || op('∉') || word('in')) {
        const not = op('∉');
        i++;
        const t = tk[i];
        const set = t && (t.k === 'set' ? t.v : t.k === 'id' && /^[nzqr]$/.test(t.w) ? t.w.toUpperCase() : null);
        if (!set) throw new Error('after ∈, write N, Z, Q or R (ℕ, ℤ, ℚ, ℝ)');
        i++;
        return { t: 'in', a, set, not };
      }
      if (op('≡')) {
        i++;
        const b = sumE(true);
        let m;
        if (op('(') && tk[i + 1] && tk[i + 1].k === 'id' && tk[i + 1].w === 'mod') { i += 2; m = sumE(false); need(')'); }
        else if (word('mod')) { i++; m = sumE(false); }
        else throw new Error('write the number after mod: a ≡ b (mod 5)');
        return { t: 'cong', a, b, m };
      }
      const terms = [a], ops = [];
      for (;;) {
        if (tk[i] && tk[i].k === 'op' && CMP[tk[i].v]) ops.push(CMP[tk[i].v]);
        else if (op('|') || word('divides')) ops.push('|');
        else if (op('∤')) ops.push('∤');
        else break;
        i++;
        terms.push(sumE(false));
      }
      if (!ops.length) return a;
      if (ops.length === 1) return { t: 'cmp', op: ops[0], a, b: terms[1] };
      return { t: 'chain', terms, ops };
    }
    function sumE(noMod) { let a = prodE(noMod); while (op('+') || op('-')) { const o = tk[i++].v; a = { t: 'bin', op: o, a, b: prodE(noMod) }; } return a; }
    function prodE(noMod) {
      let a = unaryE();
      for (;;) {
        if (op('*') || op('/')) { const o = tk[i++].v; a = { t: 'bin', op: o, a, b: unaryE() }; }
        else if (!noMod && word('mod')) { i++; a = { t: 'bin', op: 'mod', a, b: unaryE() }; }
        else if (startsAtom()) a = { t: 'bin', op: '*', imp: true, a, b: powE() };
        else return a;
      }
    }
    function unaryE() { if (op('-')) { i++; return { t: 'neg', a: unaryE() }; } if (op('+')) { i++; return unaryE(); } return powE(); }
    function powE() { const b = postE(); if (op('^')) { i++; return { t: 'bin', op: '^', a: b, b: unaryE() }; } return b; }
    function postE() { let a = primE(); while (op('²') || op('³')) { const e = tk[i++].v === '²' ? 2 : 3; a = { t: 'bin', op: '^', a, b: { t: 'num', v: F(e), raw: String(e) } }; } return a; }
    function primE() {
      const t = tk[i];
      if (!t) throw new Error('the rule stops too early');
      if (t.k === 'num') { i++; return { t: 'num', v: F.parse(t.v), raw: t.v }; }
      if (op('(')) { i++; const d = depth; depth = 0; const e = orE(); depth = d; need(')', 'closing bracket'); return e; }
      if (op('|')) { i++; const e = sumE(false); need('|', 'closing “|”'); return { t: 'fn', f: 'abs', args: [e] }; }
      if (op('√') || op('∛')) { const f = tk[i++].v === '√' ? 'sqrt' : 'cbrt'; return { t: 'fn', f, args: [postE()] }; }
      if (t.k === 'id') {
        if (FN1.has(t.w) || FN2.has(t.w)) {
          i++;
          need('(', '“(” after ' + t.w);
          depth++;
          const args = [orE()];
          while (op(',')) { i++; args.push(orE()); }
          depth--;
          need(')', 'closing bracket');
          const n = FN2.has(t.w) ? 2 : 1;
          if (args.length !== n) throw new Error(t.w + ' takes ' + pl(n, 'number'));
          return { t: 'fn', f: t.w, args };
        }
        if (vars.includes(t.w)) { i++; return { t: 'var', n: t.w }; }
        if (varRun(t.w)) { i++; return [...t.w].map(c => ({ t: 'var', n: c })).reduce((x, y) => ({ t: 'bin', op: '*', imp: true, a: x, b: y })); }
        throw new Error('“' + t.v + '” is not understood (the rule may use ' + vars.join(' and ') + ')');
      }
      throw new Error('“' + t.v + '” is out of place');
    }
    const ast = orE();
    if (i < tk.length) throw new Error('“' + tk[i].v + '” is out of place');
    return ast;
  }

  const isF = v => v instanceof K.Frac;
  const fl = v => (isF(v) ? v.num() : v.x);
  function numV(v) {
    if (isF(v) || v instanceof Irr) return v;
    throw new Error('a condition (true or false) cannot be used as a number');
  }
  function intV(v, what) {
    v = numV(v);
    if (!isF(v) || !v.isInt()) throw new Error(what + ' works with whole numbers only');
    return v.n;
  }
  const boolV = v => { if (typeof v === 'boolean') return v; throw new Error('the rule must be a condition (true or false), like x mod 2 = 0'); };
  /** a + b, … : exact when both are fractions, else an approximate irrational value */
  function arith(o, A, B) {
    A = numV(A); B = numV(B);
    if (isF(A) && isF(B)) {
      if (o === '+') return A.add(B);
      if (o === '-') return A.sub(B);
      if (o === '*') return A.mul(B);
      if (B.isZero()) throw new NoOut('division by 0');
      return A.div(B);
    }
    const a = fl(A), b = fl(B);
    if (o === '/' && b === 0) throw new NoOut('division by 0');
    return new Irr(o === '+' ? a + b : o === '-' ? a - b : o === '*' ? a * b : a / b);
  }
  function pred(what, v) {
    if (!isF(v) || !v.isInt()) return false;
    const n = v.n;
    if (what === 'prime') return isPrime(n);
    if (what === 'composite') return n > 1n && !isPrime(n);
    if (what === 'even') return n % 2n === 0n;
    if (what === 'odd') return n % 2n !== 0n;
    return isSq(n);
  }
  function cmpV(o, A, B) {
    if (o === '|' || o === '∤') { const a = intV(A, 'divides'), b = intV(B, 'divides'); const d = a === 0n ? b === 0n : b % a === 0n; return o === '|' ? d : !d; }
    A = numV(A); B = numV(B);
    let c;
    if (isF(A) && isF(B)) c = A.cmp(B);
    else { const d = fl(A) - fl(B); c = Math.abs(d) < 1e-9 ? 0 : d < 0 ? -1 : 1; }
    return o === '=' ? c === 0 : o === '!=' ? c !== 0 : o === '<' ? c < 0 : o === '<=' ? c <= 0 : o === '>' ? c > 0 : c >= 0;
  }
  /** the value of a rule for the values env ({ x: Frac }): a fraction, an Irr, true or false; NoOut when there is none */
  function evalRule(n, env) {
    switch (n.t) {
      case 'num': return n.v;
      case 'var': return env[n.n];
      case 'neg': { const v = numV(evalRule(n.a, env)); return isF(v) ? v.neg() : new Irr(-v.x); }
      case 'bin': {
        const A = evalRule(n.a, env), B = evalRule(n.b, env);
        if (n.op === 'mod') { const a = intV(A, 'mod'), m = intV(B, 'mod'); if (m === 0n) throw new NoOut('mod 0 is not defined'); const mm = babs(m); return F(((a % mm) + mm) % mm); }
        if (n.op === '^') {
          const e = numV(B), a = numV(A);
          if (!isF(e) || !e.isInt()) throw new Error('powers must be whole numbers here (use sqrt for square roots)');
          if (babs(e.n) > 64n) throw new Error('powers above 64 are too big here');
          if (!isF(a)) return new Irr(Math.pow(a.x, Number(e.n)));
          if (a.isZero() && e.n < 0n) throw new NoOut('division by 0');
          return a.pow(Number(e.n));
        }
        return arith(n.op, A, B);
      }
      case 'fn': {
        const vs = n.args.map(a => evalRule(a, env)), v = vs[0];
        if (n.f === 'sqrt') {
          const x = numV(v);
          if (fl(x) < 0) throw new NoOut('a negative number has no real square root');
          if (isF(x) && isSq(x.n) && isSq(x.d)) return F(isqrt(x.n), isqrt(x.d));
          return new Irr(Math.sqrt(fl(x)), isF(x) ? '\\sqrt{' + T(x) + '}' : null);
        }
        if (n.f === 'cbrt') {
          const x = numV(v);
          if (isF(x)) { const a = icbrt(x.n), b = icbrt(x.d); if (a ** 3n === x.n && b ** 3n === x.d) return F(a, b); return new Irr(Math.cbrt(x.num()), '\\sqrt[3]{' + T(x) + '}'); }
          return new Irr(Math.cbrt(x.x));
        }
        if (n.f === 'abs') { const x = numV(v); return isF(x) ? (x.cmp(0) < 0 ? x.neg() : x) : new Irr(Math.abs(x.x)); }
        if (n.f === 'floor') { const x = numV(v); if (!isF(x)) return F(Math.floor(x.x)); let q = x.n / x.d; if (x.n < 0n && q * x.d !== x.n) q -= 1n; return F(q); }
        if (n.f === 'gcd') return F(bgcd(intV(vs[0], 'gcd'), intV(vs[1], 'gcd')));
        if (n.f === 'lcm') { const a = intV(vs[0], 'lcm'), b = intV(vs[1], 'lcm'); return F(a === 0n || b === 0n ? 0n : babs(a * b) / bgcd(a, b)); }
        return pred(n.f, numV(v));
      }
      case 'cmp': return cmpV(n.op, evalRule(n.a, env), evalRule(n.b, env));
      case 'chain': {
        let prev = evalRule(n.terms[0], env), ok = true;
        n.ops.forEach((o, k) => { const nx = evalRule(n.terms[k + 1], env); if (!cmpV(o, prev, nx)) ok = false; prev = nx; });
        return ok;
      }
      case 'cong': {
        const a = intV(evalRule(n.a, env), '≡'), b = intV(evalRule(n.b, env), '≡'), m = intV(evalRule(n.m, env), 'mod');
        if (m === 0n) throw new Error('mod 0 is not defined: write a ≡ b (mod n) with n at least 1');
        return (a - b) % m === 0n;
      }
      case 'in': {
        const v = numV(evalRule(n.a, env));
        const r = !isF(v) ? n.set === 'R' : n.set === 'N' ? v.isInt() && v.n >= 0n : n.set === 'Z' ? v.isInt() : true;
        return n.not ? !r : r;
      }
      case 'is': { const r = pred(n.what, numV(evalRule(n.a, env))); return n.not ? !r : r; }
      case 'and': return boolV(evalRule(n.a, env)) && boolV(evalRule(n.b, env));
      case 'or': return boolV(evalRule(n.a, env)) || boolV(evalRule(n.b, env));
      case 'not': return !boolV(evalRule(n.a, env));
    }
    throw new Error('this rule could not be read');
  }
  /** is the rule a condition (true or false) rather than a number? */
  const isCond = n => ['cmp', 'chain', 'cong', 'in', 'is', 'and', 'or', 'not'].includes(n.t) || (n.t === 'fn' && PRED[n.f]);
  /** a rule written in TeX */
  const PREC = { or: 1, and: 2, not: 3, cmp: 4, chain: 4, cong: 4, in: 4, is: 4, neg: 7, num: 9, var: 9, fn: 9 };
  const prec = n => (n.t === 'bin' ? (n.op === '+' || n.op === '-' ? 5 : n.op === '^' ? 8 : n.op === '/' ? 9 : 6) : n.t === 'fn' && PRED[n.f] ? 4 : PREC[n.t]);
  const CMPT = { '=': '=', '!=': '\\ne', '<': '<', '<=': '\\le', '>': '>', '>=': '\\ge', '|': '\\mid', '∤': '\\nmid' };
  const SETT = { N: '\\N', Z: '\\Z', Q: '\\Q', R: '\\R' };
  const ISW = { prime: 'prime', even: 'even', odd: 'odd', square: 'a perfect square', composite: 'composite' };
  function texRule(n) {
    const w = (c, p) => (prec(c) < p ? '\\left(' + texRule(c) + '\\right)' : texRule(c));
    switch (n.t) {
      case 'num': return n.raw;
      case 'var': return n.n;
      case 'neg': return '-' + w(n.a, 7);
      case 'bin':
        if (n.op === '+') return w(n.a, 5) + ' + ' + (n.b.t === 'neg' ? '\\left(' + texRule(n.b) + '\\right)' : w(n.b, 5));
        if (n.op === '-') return w(n.a, 5) + ' - ' + (n.b.t === 'neg' ? '\\left(' + texRule(n.b) + '\\right)' : w(n.b, 6));
        if (n.op === '*') return n.imp && n.b.t !== 'num' ? w(n.a, 6) + w(n.b, 7) : w(n.a, 6) + ' \\cdot ' + w(n.b, 7);
        if (n.op === '/') return '\\frac{' + texRule(n.a) + '}{' + texRule(n.b) + '}';
        if (n.op === 'mod') return w(n.a, 6) + ' \\bmod ' + w(n.b, 7);
        return w(n.a, 9) + '^{' + texRule(n.b) + '}';
      case 'fn': {
        const a = n.args.map(texRule);
        if (n.f === 'sqrt') return '\\sqrt{' + a[0] + '}';
        if (n.f === 'cbrt') return '\\sqrt[3]{' + a[0] + '}';
        if (n.f === 'abs') return '\\left|' + a[0] + '\\right|';
        if (n.f === 'floor') return '\\lfloor ' + a[0] + ' \\rfloor';
        if (n.f === 'gcd') return '\\gcd(' + a.join(', ') + ')';
        if (n.f === 'lcm') return '\\operatorname{lcm}(' + a.join(', ') + ')';
        return w(n.args[0], 5) + '\\text{ is ' + ISW[n.f] + '}';
      }
      case 'cmp': return w(n.a, 5) + ' ' + CMPT[n.op] + ' ' + w(n.b, 5);
      case 'chain': return n.terms.map((x, k) => (k ? ' ' + CMPT[n.ops[k - 1]] + ' ' : '') + w(x, 5)).join('');
      case 'cong': return w(n.a, 5) + ' \\equiv ' + w(n.b, 5) + ' \\pmod{' + texRule(n.m) + '}';
      case 'in': return w(n.a, 5) + (n.not ? ' \\notin ' : ' \\in ') + SETT[n.set];
      case 'is': return w(n.a, 5) + '\\text{ is ' + (n.not ? 'not ' : '') + ISW[n.what] + '}';
      case 'and': return w(n.a, 2) + ' \\text{ and } ' + w(n.b, 3);
      case 'or': return w(n.a, 1) + ' \\text{ or } ' + w(n.b, 2);
      case 'not': return '\\text{not } ' + w(n.a, 4);
    }
    return '';
  }

  /* ================================================================== sets of real numbers: intervals
     a set is a list of disjoint pieces { lo, loC, hi, hiC } in increasing order; lo or hi null means −∞ or ∞ */

  const INF = /^\+?(?:∞|inf(?:inity)?|oo)$/i, NINF = /^-(?:∞|inf(?:inity)?|oo)$/i;
  function endOf(raw, side, whole) {
    const s = raw.trim().replace(/[−–]/g, '-');
    if (INF.test(s) || NINF.test(s)) {
      if (side === 'lo' ? INF.test(s) : side === 'hi' ? NINF.test(s) : false) throw new Error('in “' + whole + '”, ' + (side === 'lo' ? 'the left end cannot be +∞' : 'the right end cannot be −∞') + '.');
      return null;
    }
    try { return F.parse(s); } catch (e) { throw new Error('in “' + whole + '”, “' + s + '” is not a number (write 3, −1/2, 0.5 or inf).'); }
  }
  /** "[0, 1)", "(-inf, 2]", "R", "{0, 1}", "[0, 1] U (2, 3)" → a set of real numbers */
  function parseReals(src, name) {
    const s0 = String(src == null ? '' : src).trim();
    if (!s0) throw new Error(name + ': type an interval such as [0, 1) or R for all real numbers.');
    const parts = s0.split(/\s*(?:∪|\bU\b|\bu\b|\bor\b)\s*/).filter(p => p.trim());
    const pieces = [];
    for (const p0 of parts) {
      const p = p0.trim();
      if (/^(?:R|ℝ|reals?)$/i.test(p)) { pieces.push({ lo: null, loC: false, hi: null, hiC: false }); continue; }
      if (/^(?:∅|Ø|\{\s*\})$/.test(p)) continue;
      let m = /^\{([^{}]*)\}$/.exec(p);
      if (m) {
        for (const x of m[1].split(',').map(t => t.trim()).filter(Boolean)) {
          let v;
          try { v = endOf(x, 'pt', p); } catch (e) { throw new Error(name + ': ' + e.message); }
          if (!v) throw new Error(name + ': ∞ is not a number.');
          pieces.push({ lo: v, loC: true, hi: v, hiC: true });
        }
        continue;
      }
      m = /^([[(])([^,]+),([^,]+)([\])])$/.exec(p.replace(/\s+/g, ''));
      if (!m) throw new Error(name + ': “' + p + '” is not an interval. Write [a, b], (a, b), [a, b) or (a, b], with inf for ∞.');
      let lo, hi;
      try { lo = endOf(m[2], 'lo', p); hi = endOf(m[3], 'hi', p); } catch (e) { throw new Error(name + ': ' + e.message); }
      const loC = m[1] === '[', hiC = m[4] === ']';
      if ((lo === null && loC) || (hi === null && hiC)) throw new Error(name + ': ∞ is not a number, so an end at ∞ is always open: write (−∞, … or …, ∞).');
      if (lo && hi && lo.cmp(hi) > 0) throw new Error(name + ': in “' + p + '” the left end must be the smaller one.');
      if (lo && hi && lo.eq(hi) && !(loC && hiC)) throw new Error(name + ': “' + p + '” holds no numbers at all; [' + fH(lo) + ', ' + fH(lo) + '] is the single number ' + fH(lo) + '.');
      pieces.push({ lo, loC, hi, hiC });
    }
    return combine([pieces], a => a);
  }
  const holds = (set, x) => set.some(p => (p.lo === null || p.lo.cmp(x) < 0 || (p.loC && p.lo.eq(x))) && (p.hi === null || x.cmp(p.hi) < 0 || (p.hiC && p.hi.eq(x))));
  /** every endpoint of the sets, in increasing order, each once */
  function endpoints(sets) {
    const pts = [];
    sets.forEach(S0 => S0.forEach(p => [p.lo, p.hi].forEach(v => { if (v && !pts.some(q => q.eq(v))) pts.push(v); })));
    return pts.sort((a, b) => a.cmp(b));
  }
  /** the endpoints cut the line into pieces: open gaps (with a test number inside) and the endpoints themselves */
  function atoms(sets) {
    const pts = endpoints(sets), out = [];
    if (!pts.length) return [{ lo: null, hi: null, probe: F(0) }];
    out.push({ lo: null, hi: pts[0], probe: pts[0].sub(1) });
    pts.forEach((x, i) => { const nx = pts[i + 1] || null; out.push({ pt: x }); out.push({ lo: x, hi: nx, probe: nx ? x.add(nx).div(2) : x.add(1) }); });
    return out;
  }
  /** the set of numbers r with f(r ∈ set 1, r ∈ set 2, …) true: exact, piece by piece */
  function combine(sets, f) {
    const out = [];
    let cur = null;
    for (const a of atoms(sets)) {
      const x = a.pt || a.probe;
      if (!f(...sets.map(S0 => holds(S0, x)))) { if (cur) { out.push(cur); cur = null; } continue; }
      if (a.pt) { if (cur) { cur.hi = a.pt; cur.hiC = true; } else cur = { lo: a.pt, loC: true, hi: a.pt, hiC: true }; }
      else if (cur) { cur.hi = a.hi; cur.hiC = false; } else cur = { lo: a.lo, loC: false, hi: a.hi, hiC: false };
    }
    if (cur) out.push(cur);
    return out;
  }
  const sameReals = (A, B) => !combine([A, B], (a, b) => a !== b).length;
  /** an interval, or several, in TeX: [0, 1) ∪ {3} */
  function realsT(set) {
    if (!set.length) return '\\varnothing';
    if (set.length === 1 && set[0].lo === null && set[0].hi === null) return '\\R';
    const parts = [];
    let pts = [];
    const flush = () => { if (pts.length) { parts.push('\\{' + pts.map(T).join(', ') + '\\}'); pts = []; } };
    set.forEach(p => {
      if (p.lo && p.hi && p.lo.eq(p.hi)) { pts.push(p.lo); return; }
      flush();
      parts.push((p.loC ? '[' : '(') + (p.lo ? NT(p.lo) : '-\\infty') + ', ' + (p.hi ? NT(p.hi) : '\\infty') + (p.hiC ? ']' : ')'));
    });
    flush();
    return parts.join(' \\cup ');
  }
  /** the same set in set-builder notation: {r ∈ ℝ | 0 ≤ r < 1} */
  function builderT(set, v = 'r') {
    if (!set.length) return '\\varnothing';
    if (set.length === 1 && set[0].lo === null && set[0].hi === null) return '\\{' + v + ' \\mid ' + v + ' \\in \\R\\}';
    const cond = set.map(p => {
      if (p.lo && p.hi && p.lo.eq(p.hi)) return v + ' = ' + NT(p.lo);
      const l = p.lo ? NT(p.lo) + (p.loC ? ' \\le ' : ' < ') : '', r = p.hi ? (p.hiC ? ' \\le ' : ' < ') + NT(p.hi) : '';
      return l + v + r;
    });
    return '\\{' + v + ' \\in \\R \\mid ' + cond.join(' \\text{ or } ') + '\\}';
  }
  /** a piece of the line in TeX, for the step tables */
  const atomT = a => (a.pt ? '\\{' + NT(a.pt) + '\\}' : '(' + (a.lo ? NT(a.lo) : '-\\infty') + ', ' + (a.hi ? NT(a.hi) : '\\infty') + ')');

  /* ================================================================== pictures */

  /** number lines, one lane per set: rows [{ name, set, hi }]; filled dots are included ends, hollow dots are not */
  function numberLines(rows) {
    const pts = endpoints(rows.map(r => r.set)), vals = pts.map(p => p.num());
    let lo = vals.length ? Math.min(...vals) : -2, hi = vals.length ? Math.max(...vals) : 2;
    if (hi - lo < 1e-9) { lo -= 2; hi += 2; }
    const pad = Math.max(0.6, (hi - lo) * 0.16);
    lo -= pad; hi += pad;
    const W = 360, L = 60, R = 16, laneH = 38, top = 12, H = top + laneH * rows.length + 34;
    const X = v => L + (v - lo) / (hi - lo) * (W - L - R);
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sl-pic', role: 'img', 'aria-label': 'the sets on number lines' });
    pts.forEach(p => svg.append(S('line', { x1: X(p.num()), x2: X(p.num()), y1: top, y2: top + laneH * rows.length + 4, class: 'guide' })));
    rows.forEach((r, k) => {
      const y = top + laneH * k + laneH / 2, cls = r.hi ? ' hi' : '';
      svg.append(S('text', { x: 4, y: y + 4, class: r.hi ? 'tb thi' : 'tb' }, r.name));
      svg.append(S('line', { x1: L - 6, x2: W - R + 6, y1: y, y2: y, class: 'axis' }));
      r.set.forEach(p => {
        const x1 = p.lo ? X(p.lo.num()) : L - 6, x2 = p.hi ? X(p.hi.num()) : W - R + 6;
        if (p.lo && p.hi && p.lo.eq(p.hi)) { svg.append(S('circle', { cx: x1, cy: y, r: 5, class: 'dot' + cls })); return; }
        svg.append(S('line', { x1, x2, y1: y, y2: y, class: 'seg' + cls }));
        if (!p.lo) svg.append(S('path', { d: 'M' + (x1 - 4) + ' ' + y + ' l9 -6 v12 z', class: 'tip' + cls }));
        if (!p.hi) svg.append(S('path', { d: 'M' + (x2 + 4) + ' ' + y + ' l-9 -6 v12 z', class: 'tip' + cls }));
        if (p.lo) svg.append(S('circle', { cx: x1, cy: y, r: 5, class: 'dot' + cls + (p.loC ? '' : ' open') }));
        if (p.hi) svg.append(S('circle', { cx: x2, cy: y, r: 5, class: 'dot' + cls + (p.hiC ? '' : ' open') }));
      });
    });
    const yA = top + laneH * rows.length + 18;
    let lastX = -99, row = 0;
    pts.forEach(p => { const x = X(p.num()); row = x - lastX < 30 ? 1 - row : 0; lastX = x; svg.append(S('text', { x, y: yA + row * 12, 'text-anchor': 'middle', class: 't' }, DISP.dec && !p.isInt() && p.exactDecimal(6) ? minus(p.dec(6)) : fH(p))); });
    if (!pts.length) svg.append(S('text', { x: X(0), y: yA, 'text-anchor': 'middle', class: 't' }, '0'));
    return wrap(svg);
  }

  /** lay out text in lines of at most n characters (at most m lines) */
  function lines(labels, n, m) {
    const out = [];
    let cur = '';
    labels.forEach(s => { const t = cur ? cur + ', ' + s : s; if (t.length > n && cur) { out.push(cur + ','); cur = s; } else cur = t; });
    if (cur) out.push(cur);
    if (out.length > m) { const rest = labels.length - out.slice(0, m - 1).join(' ').split(',').filter(x => x.trim()).length; return out.slice(0, m - 1).concat(['… ' + rest + ' more']); }
    return out;
  }
  const VENN = {
    2: { W: 360, H: 248, c: [[138, 124, 86], [222, 124, 86]], name: [[60, 46], [300, 46]],
      at: { 1: [96, 124, 11, 6], 3: [180, 124, 7, 6], 2: [264, 124, 11, 6] }, out: [350, 236] },
    3: { W: 360, H: 330, c: [[138, 116, 76], [222, 116, 76], [180, 188, 76]], name: [[64, 42], [296, 42], [180, 290]],
      at: { 1: [104, 104, 8, 3], 2: [256, 104, 8, 3], 4: [180, 238, 12, 2], 3: [180, 92, 7, 2], 5: [136, 172, 6, 2], 6: [224, 172, 6, 2], 7: [180, 142, 6, 2] }, out: [350, 318] },
  };
  /** a Venn diagram of 2 or 3 sets inside a universe box; cell(mask) → { labels: [text] | null, count, shade } for the
     region of the elements in exactly the sets of mask (bit 1 = first set, 2 = second, 4 = third; 0 = outside all) */
  function venn(names, cell, opt = {}) {
    const k = names.length, G = VENN[k], id = 'sl' + (++uid);
    const svg = S('svg', { viewBox: '0 0 ' + G.W + ' ' + G.H, class: 'sl-pic sl-venn' + (k === 3 ? ' sl-venn3' : ''), role: 'img', 'aria-label': opt.label || 'Venn diagram' });
    const defs = S('defs');
    G.c.forEach(([cx, cy, r], i) => defs.append(S('clipPath', { id: id + 'c' + i }, S('circle', { cx, cy, r }))));
    svg.append(defs);
    svg.append(S('rect', { x: 2, y: 2, width: G.W - 4, height: G.H - 4, rx: 14, class: 'box' }));
    for (let m = 0; m < 1 << k; m++) {
      const c = cell(m);
      if (!c || !c.shade) continue;
      const mk = S('mask', { id: id + 'm' + m, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: G.W, height: G.H });
      let inner = S('rect', { x: 2, y: 2, width: G.W - 4, height: G.H - 4, fill: 'white' });
      for (let i = 0; i < k; i++) if (m & (1 << i)) inner = S('g', { 'clip-path': 'url(#' + id + 'c' + i + ')' }, inner);
      mk.append(S('rect', { x: 0, y: 0, width: G.W, height: G.H, fill: 'black' }), inner);
      for (let i = 0; i < k; i++) if (!(m & (1 << i))) { const [cx, cy, r] = G.c[i]; mk.append(S('circle', { cx, cy, r, fill: 'black' })); }
      defs.append(mk);
      svg.append(S('rect', { x: 2, y: 2, width: G.W - 4, height: G.H - 4, rx: 14, class: 'shade', mask: 'url(#' + id + 'm' + m + ')' }));
    }
    G.c.forEach(([cx, cy, r], i) => svg.append(S('circle', { cx, cy, r, class: 'ring k' + i })));
    names.forEach((nm, i) => svg.append(S('text', { x: G.name[i][0], y: G.name[i][1], 'text-anchor': 'middle', class: 'k' + i }, nm)));
    svg.append(S('text', { x: 12, y: 22, class: 'tb' }, opt.u || 'U'));
    for (let m = 1; m < 1 << k; m++) {
      const c = cell(m);
      if (!c) continue;
      const [x, y, n, mx] = G.at[m];
      if (c.labels) {
        const ls = c.labels.length ? lines(c.labels, n, mx) : ['–'];
        ls.forEach((s, j) => svg.append(S('text', { x, y: y + 4 + (j - (ls.length - 1) / 2) * 14, 'text-anchor': 'middle', class: c.labels.length ? 'tm' : 'ts' }, s)));
      } else svg.append(S('text', { x, y: y + 6, 'text-anchor': 'middle', class: 'tn' + (c.hi ? ' thi' : '') }, String(c.count)));
    }
    const c0 = cell(0);
    if (c0) {
      const [x, y] = G.out;
      if (c0.labels) {
        const ls = c0.labels.length ? lines(c0.labels, 44, 1) : ['outside: –'];
        svg.append(S('text', { x, y, 'text-anchor': 'end', class: c0.labels.length ? 'tm' : 'ts' }, c0.labels.length ? 'outside: ' + ls[0] : ls[0]));
      } else svg.append(S('text', { x, y: y - 2, 'text-anchor': 'end', class: 'tn' + (c0.hi ? ' thi' : '') }, (opt.outWord || 'outside') + ': ' + c0.count));
    }
    return wrap(svg);
  }

  /** arrowhead markers for one picture, one per colour */
  function markers(svg, id) {
    const defs = S('defs');
    ['', 'hi', 'bad', 'ok', 'miss'].forEach(c => defs.append(S('marker', { id: id + 'h' + c, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 4.6, markerHeight: 4.6, orient: 'auto-start-reverse', markerUnits: 'strokeWidth' }, S('path', { d: 'M0,0 L10,5 L0,10 z', class: 'head ' + c }))));
    svg.append(defs);
    return c => 'url(#' + id + 'h' + (c || '') + ')';
  }
  /** a function between small sets drawn as arrows: X on the left, Y on the right; arrows [{ i, j, cls }] (j = −1: an
     output outside Y, labelled out); xc(i), yc(j) give the classes of the elements */
  function mapPic(X, Y, arrows, opt = {}) {
    const n = Math.max(X.length, Y.length, 1), rowH = 32, top = 40, H = top + rowH * n + 16 + (arrows.some(a => a.j < 0) ? 10 : 0), W = 340, xl = 72, xr = 258;
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sl-pic', role: 'img', 'aria-label': 'arrow diagram of the function' });
    const head = markers(svg, 'sl' + (++uid));
    const yX = i => top + rowH * i + rowH / 2 + rowH * (n - X.length) / 2, yY = j => top + rowH * j + rowH / 2 + rowH * (n - Y.length) / 2;
    svg.append(S('rect', { x: xl - 50, y: top - 6, width: 100, height: rowH * n + 12, rx: 44, class: 'soft' }), S('rect', { x: xr - 50, y: top - 6, width: 100, height: rowH * n + 12, rx: 44, class: 'soft' }));
    svg.append(S('text', { x: xl, y: 24, 'text-anchor': 'middle', class: 'tb' }, opt.left || 'X'), S('text', { x: xr, y: 24, 'text-anchor': 'middle', class: 'tb' }, opt.right || 'Y'));
    arrows.forEach(a => {
      const y1 = yX(a.i);
      if (a.j < 0) {
        svg.append(S('line', { x1: xl + 30, y1, x2: W - 8, y2: y1, class: 'edge ' + (a.cls || ''), 'marker-end': head(a.cls) }));
        if (a.out) svg.append(S('text', { x: W - 8, y: y1 - 6, 'text-anchor': 'end', class: 'ts tbad' }, a.out));
        return;
      }
      svg.append(S('line', { x1: xl + 30, y1, x2: xr - 32, y2: yY(a.j), class: 'edge ' + (a.cls || ''), 'marker-end': head(a.cls) }));
    });
    const node = (label, x, y, cls) => {
      svg.append(S('rect', { x: x - 28, y: y - 11, width: 56, height: 22, rx: 11, class: 'node ' + (cls || '') }));
      svg.append(S('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'tm' }, short(label, 7)));
    };
    X.forEach((x, i) => node(x.label, xl, yX(i), opt.xc && opt.xc(i)));
    Y.forEach((y, j) => node(y.label, xr, yY(j), opt.yc && opt.yc(j)));
    return wrap(svg);
  }
  /** a relation on X drawn as arrows between points on a circle; has(i, j), mark(i, j) → '' | 'hi' | 'bad' | 'ok' | 'miss' */
  function relPic(X, has2, mark) {
    const n = X.length, W = 340, H = 300, cx = 170, cy = 150, R = n <= 3 ? 80 : 108, rN = 15;
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sl-pic', role: 'img', 'aria-label': 'the relation as arrows' });
    const head = markers(svg, 'sl' + (++uid));
    const P = i => { const a = -Math.PI / 2 + 2 * Math.PI * i / n; return [cx + R * Math.cos(a), cy + R * Math.sin(a), Math.cos(a), Math.sin(a)]; };
    const draw = (i, j, cls) => {
      const [x1, y1, ux, uy] = P(i);
      if (i === j) {
        const lx = x1 + ux * (rN + 9), ly = y1 + uy * (rN + 9);
        svg.append(S('circle', { cx: lx, cy: ly, r: 10, class: 'edge ' + cls }));
        return;
      }
      const [x2, y2] = P(j), dx = x2 - x1, dy = y2 - y1, d = Math.hypot(dx, dy), nx = -dy / d, ny = dx / d;
      const both = has2(j, i) || mark(j, i) === 'miss';
      const bend = both ? 16 : 0, mx = (x1 + x2) / 2 + nx * bend, my = (y1 + y2) / 2 + ny * bend;
      const sx = x1 + (mx - x1) / Math.hypot(mx - x1, my - y1) * rN, sy = y1 + (my - y1) / Math.hypot(mx - x1, my - y1) * rN;
      const ex = x2 + (mx - x2) / Math.hypot(mx - x2, my - y2) * (rN + 1), ey = y2 + (my - y2) / Math.hypot(mx - x2, my - y2) * (rN + 1);
      svg.append(S('path', { d: 'M' + sx.toFixed(1) + ' ' + sy.toFixed(1) + ' Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1), class: 'edge ' + cls, 'marker-end': head(cls) }));
    };
    const later = [];   // marked arrows are drawn last, on top
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const m = mark(i, j);
      if (!has2(i, j) && m !== 'miss') continue;
      if (m) later.push([i, j, m]); else draw(i, j, '');
    }
    later.forEach(([i, j, m]) => draw(i, j, m));
    X.forEach((x, i) => { const [px, py] = P(i); svg.append(S('circle', { cx: px, cy: py, r: rN, class: 'node' }), S('text', { x: px, y: py + 4, 'text-anchor': 'middle', class: 'tm' }, short(x.label, 4))); });
    return wrap(svg);
  }

  /** K.table whose cells may wrap (for tables with words in them) */
  const wtable = (head, rows, opt) => { const t = K.table(head, rows, opt); t.querySelector('table').classList.add('sl-wrap'); return t; };

  /* ================================================================== numbers */

  /** the repeating decimal I.N(R) as a fraction: (10^(k+m) − 10^k)·x = (the digits I N R) − (the digits I N) */
  function recurring(sign, I, N, R) {
    const k = N.length, m = R.length;
    if (k + m > 30) throw new Error('Keep it to at most 30 digits after the point.');
    const A = BigInt((I || '0') + N + R), B = BigInt((I || '0') + N);
    const top = A - B, bot = 10n ** BigInt(k + m) - 10n ** BigInt(k), v = F(top, bot);
    return { sign: !!sign, I: String(BigInt(I || '0')), N, R, k, m, A, B, top, bot, v: sign ? v.neg() : v };
  }
  /** a number typed by the student: { kind: 'rat', v, form, text, rec } | { kind: 'root', r, neg } | { kind: 'pi' | 'e', neg } */
  function readNumber(raw) {
    const s = String(raw == null ? '' : raw).trim().replace(/[−–]/g, '-').replace(/\s+/g, ' ');
    if (!s) throw new Error('Type a number, such as 19/5, −7, 0.375, 0.1(6), √2 or π.');
    let m = /^(-?) ?(?:π|pi)$/i.exec(s);
    if (m) return { kind: 'pi', neg: !!m[1] };
    m = /^(-?) ?e$/.exec(s);
    if (m) return { kind: 'e', neg: !!m[1] };
    m = /^(-?) ?(?:√|sqrt) ?\(? ?([^()]*?) ?\)?$/i.exec(s);
    if (m) {
      const inner = m[2].replace(/\s+/g, '');
      if (!inner) throw new Error('Write the number under the root: √2 or sqrt(2).');
      let r;
      try { r = F.parse(inner); } catch (e) { throw new Error('“' + inner + '” under the root is not a number.'); }
      if (r.cmp(0) < 0) throw new Error('√(' + fH(r) + ') is not a real number: a number times itself is never negative (minus times minus is plus). Square roots of negative numbers need the complex numbers, which this course does not use (lecture 1.4).');
      return { kind: 'root', r, neg: !!m[1] };
    }
    m = /^(-?)(\d+) (\d+)\/(\d+)$/.exec(s);
    if (m) {
      if (/^0+$/.test(m[4])) throw new Error('“' + s + '”: dividing by 0 is not defined.');
      const v = F(BigInt(m[2])).add(F(BigInt(m[3]), BigInt(m[4])));
      return { kind: 'rat', v: m[1] ? v.neg() : v, form: 'mixed', text: s, mix: [m[1], m[2], m[3], m[4]] };
    }
    m = /^(-?)(\d*)\.(\d*)\((\d+)\)$/.exec(s.replace(/\s+/g, ''));
    if (m) { const rec = recurring(m[1], m[2], m[3], m[4]); return { kind: 'rat', v: rec.v, form: 'rec', text: s, rec }; }
    if (/\.\.\.|…/.test(s)) throw new Error('“' + s + '”: write the repeating block in brackets, such as 0.(3) for 0.333… or 0.1(6) for 0.1666….');
    let v;
    try { v = F.parse(s); } catch (e) {
      if (/\/ ?-?0+$/.test(s)) throw new Error('“' + s + '”: dividing by 0 is not defined, so this is not a number at all.');
      throw new Error('“' + s.slice(0, 24) + '” is not understood. Write a whole number (−7), a fraction (19/5), a mixed number (3 4/5), a decimal (0.375), a repeating decimal (0.1(6)), √2, π or e.');
    }
    return { kind: 'rat', v, form: /\//.test(s) ? 'frac' : /%/.test(s) ? 'pct' : /\./.test(s) ? 'dec' : 'int', text: s.replace(/\s+/g, '') };
  }
  /** the number as the student typed it, in TeX */
  function typedT(N) {
    if (N.form === 'frac') { const m = /^(-?)(\d+)\/(\d+)$/.exec(N.text); return m ? m[1] + '\\frac{' + m[2] + '}{' + m[3] + '}' : T(N.v); }
    if (N.form === 'mixed') { const [sg, w, p, q] = N.mix; return sg + w + '\\tfrac{' + p + '}{' + q + '}'; }
    if (N.form === 'dec') return N.text;
    if (N.form === 'pct') return N.text.replace('%', '\\%');
    if (N.form === 'rec') { const r = N.rec; return (r.sign ? '-' : '') + r.I + '.' + r.N + '\\overline{' + r.R + '}'; }
    return T(N.v);
  }
  /** the steps that turn a repeating decimal into a fraction (lecture style: shift the point, subtract, divide, reduce) */
  function recSteps(R0) {
    const { I, N, R, k, m, A, B, top, bot } = R0, tens = e => '1' + '0'.repeat(e);
    const tail = N + R.repeat(Math.ceil((2 * m + 8) / m) + 2), wide = Math.max(4, 2 * m);
    const at = e => (I + tail.slice(0, e)).replace(/^0+(?=\d)/, '') + '.' + tail.slice(e, e + wide) + '\\ldots';
    const g = bgcd(top, bot), x = F(top, bot), st = [];
    st.push({ text: 'Call the number $x$' + (R0.sign ? ' (leave the minus sign aside for now)' : '') + '. The block ' + R + ' repeats for ever' + (k ? ', after ' + pl(k, 'digit') + ' that ' + (k === 1 ? 'does' : 'do') + ' not repeat' : '') + ':', tex: 'x = ' + at(0) });
    if (k) st.push({ text: 'Multiply by ' + tens(k) + ': the point moves ' + pl(k, 'place') + ' to the right, past the part that does not repeat.', tex: tens(k) + 'x = ' + at(k) });
    st.push({ text: 'Multiply by ' + tens(k + m) + ': the point moves past one whole block ' + R + ' as well.', tex: tens(k + m) + 'x = ' + at(k + m) });
    st.push({ text: 'Subtract. After the point both lines show ' + tail.slice(k, k + wide) + '…, so the endless tails cancel:', tex: tens(k + m) + 'x - ' + (k ? tens(k) : '') + 'x = ' + A + ' - ' + B + ' \\quad\\Rightarrow\\quad ' + bot + 'x = ' + top });
    st.push({ text: 'Divide by ' + bot + ':', tex: 'x = \\frac{' + top + '}{' + bot + '}' + (g > 1n ? '' : ' = ' + T(x)) });
    if (g > 1n) st.push({ text: 'Reduce: the greatest common divisor of ' + top + ' and ' + bot + ' is ' + g + ', so divide both by it (lecture 1.3):', tex: 'x = \\frac{' + top + ' \\div ' + g + '}{' + bot + ' \\div ' + g + '} = ' + T(x) });
    if (R0.sign) st.push({ text: 'Put the minus sign back:', tex: '-' + at(0) + ' = ' + T(R0.v) });
    return st;
  }
  /** the steps that turn a decimal that ends (0.375) into a fraction */
  function decSteps(text, v) {
    const m = /^(-?)(\d*)\.(\d+)$/.exec(text);
    if (!m) return [];
    const digits = m[3].length, whole = BigInt((m[2] || '0') + m[3]), den = 10n ** BigInt(digits), g = bgcd(whole, den), sg = m[1] ? '-' : '';
    const st = [{ text: text.replace('-', '−') + ' has ' + pl(digits, 'digit') + ' after the point, so it counts in steps of $\\frac{1}{' + den + '}$:', tex: text + ' = ' + sg + '\\frac{' + whole + '}{' + den + '}' }];
    if (g > 1n) st.push({ text: 'Reduce: the greatest common divisor of ' + whole + ' and ' + den + ' is ' + g + ':', tex: sg + '\\frac{' + whole + ' \\div ' + g + '}{' + den + ' \\div ' + g + '} = ' + T(v) });
    return st;
  }
  /** p/q (p ≥ 0, 1 ≤ q ≤ 100 000, whole) by long division: the remainders, until one is 0 or one comes back */
  function longDiv(p, q) {
    const ip = p / q, Q = Number(q), rows = [], seen = new Map();
    let r = Number(p % q);
    while (r !== 0 && !seen.has(r)) { seen.set(r, rows.length); const r10 = r * 10, d = Math.floor(r10 / Q); rows.push({ r, r10, d, nr: r10 % Q }); r = r10 % Q; }
    return { ip, rows, ends: r === 0, start: r === 0 ? -1 : seen.get(r), back: r };
  }
  /** the decimal from a long division, in TeX, with a bar over the block that repeats */
  function decT(L, neg) {
    const ds = L.rows.map(x => x.d).join(''), sg = neg ? '-' : '';
    if (!ds) return sg + L.ip;
    if (L.ends) return sg + L.ip + '.' + ds;
    const pre = ds.slice(0, L.start), rep = ds.slice(L.start);
    return sg + L.ip + '.' + pre + (rep.length > 40 ? rep.slice(0, 40) + '\\ldots' : '\\overline{' + rep + '}');
  }
  /** a whole number r = s² · m with m square-free, so that √r = s√m */
  function squarePart(r) { let s = 1n, m = 1n; for (const [p, e] of factor(r)) { s *= p ** BigInt(Math.floor(e / 2)); if (e % 2) m *= p; } return { s, m }; }
  /** a ≥ b ≥ 1 with a² + b² = r, or null */
  function twoSquares(r) { for (let b = 1; 2 * b * b <= r; b++) { const a2 = r - b * b, a = Math.round(Math.sqrt(a2)); if (a * a === a2) return [a, b]; } return null; }
  /** the lecture's proof that √m is irrational (m > 1 with no square factor), step by step */
  function proofSteps(m) {
    const p0 = factor(m)[0][0], c = m / p0, two = m === 2n, cq = c === 1n ? 'q^2' : c + 'q^2';
    return [
      { text: 'Suppose $\\sqrt{' + m + '}$ were rational. Then it is a fraction $\\frac{p}{q}$ of whole numbers, and we can take it in reduced form: $p$ and $q$ have no common factor (lecture 1.3).', tex: '\\sqrt{' + m + '} = \\frac{p}{q}, \\qquad \\gcd(p, q) = 1' },
      { text: 'Square both sides.', tex: m + ' = \\frac{p^2}{q^2}' },
      { text: 'Multiply both sides by $q^2$.', tex: m + 'q^2 = p^2' },
      two ? { text: 'So $p^2$ is 2 times something: $p^2$ is even. An odd number times an odd number is odd, so $p$ cannot be odd: $p$ is even, $p = 2a$ for some whole number $a$.', tex: 'p = 2a' }
        : { text: 'So $p^2$ is a multiple of the prime ' + p0 + '. The primes of $p^2$ are the primes of $p$, each twice (a number splits into primes in only one way, lecture 1.2), so ' + p0 + ' divides $p$ itself: $p = ' + p0 + 'a$ for some whole number $a$.', tex: 'p = ' + p0 + 'a' },
      { text: 'Put $p = ' + p0 + 'a$ into $' + m + 'q^2 = p^2$.', tex: m + 'q^2 = (' + p0 + 'a)^2 = ' + p0 * p0 + 'a^2' },
      { text: 'Divide both sides by ' + p0 + '.', tex: cq + ' = ' + p0 + 'a^2' },
      two ? { text: 'So $q^2$ is even too, and by the same argument $q$ is even: $q = 2b$.', tex: 'q = 2b' }
        : c === 1n ? { text: 'So $q^2$ is a multiple of ' + p0 + ', and as before ' + p0 + ' divides $q$: $q = ' + p0 + 'b$.', tex: 'q = ' + p0 + 'b' }
          : { text: 'So $' + cq + '$ is a multiple of ' + p0 + '. The number ' + c + ' is not (the prime ' + p0 + ' appears in ' + m + ' only once), so ' + p0 + ' divides $q^2$, and so it divides $q$: $q = ' + p0 + 'b$.', tex: 'q = ' + p0 + 'b' },
      { text: 'Now ' + p0 + ' divides both $p$ and $q$, so their greatest common divisor is at least ' + p0 + '. But we chose $\\gcd(p, q) = 1$. This contradiction shows the assumption was wrong: $\\sqrt{' + m + '}$ is not a fraction, it is irrational.', tex: '\\gcd(p, q) \\ge ' + p0 + ' \\ne 1' },
    ];
  }

  /** ℕ inside ℤ inside ℚ inside ℝ, the number x as a dot in the smallest set that holds it */
  function nestPic(where, label) {
    const W = 360, H = 216;
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sl-pic', role: 'img', 'aria-label': 'the natural numbers inside the integers inside the rationals inside the reals' });
    const B = [['R', 2, 2, 356, 212, 'ℝ real', '√2, π, e', 322], ['Q', 16, 30, 270, 172, 'ℚ rational', '1/2, 19/5', 251], ['Z', 30, 58, 186, 132, 'ℤ integers', '−1, −7', 182], ['N', 44, 86, 104, 92, 'ℕ natural', '0, 1, 2', 96]];
    B.forEach(([id, x, y, w, hh, name]) => svg.append(S('rect', { x, y, width: w, height: hh, rx: 16, class: id === where ? 'soft' : 'box' }), S('text', { x: x + 10, y: y + 18, class: 'tb' }, name)));
    B.forEach(([id, , , , , , ex, cx]) => {
      svg.append(S('text', { x: cx, y: id === 'N' ? 126 : id === 'Z' ? 118 : id === 'Q' ? 110 : 98, 'text-anchor': 'middle', class: 'ts' }, ex));
      if (id === where) svg.append(S('circle', { cx, cy: 150, r: 7, class: 'dot hi' }), S('text', { x: cx, y: 172, 'text-anchor': 'middle', class: 'tb thi' }, short(label, 9)));
    });
    return wrap(svg);
  }
  /** the factor pairs of n as rectangles of balls, like the lecture's 7 × 4 balls and 6 × 6 square (n ≤ 48) */
  function pairsPic(n, pairs) {
    const gap = Math.min(10, Math.max(5.5, 300 / n)), r = gap * 0.34, W = 340;
    let y = 4;
    const svg = S('svg', { class: 'sl-pic', role: 'img', 'aria-label': 'the factor pairs as rectangles of balls' });
    pairs.forEach(([d, e]) => {
      svg.append(S('text', { x: 4, y: y + 12, class: 'tb' }, d + ' × ' + e + (d === e ? ' (a square)' : '')));
      y += 20;
      for (let i = 0; i < d; i++) for (let j = 0; j < e; j++) svg.append(S('circle', { cx: 8 + j * gap, cy: y + i * gap, r, class: 'ball' + (d === e ? ' sq1' : '') }));
      y += d * gap + 6;
    });
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + y);
    return wrap(svg);
  }
  /** Euclid's algorithm as a rectangle a × b cut into squares: each division line cuts off q squares (null if too many) */
  function euclidPic(a, b) {
    let count = 0, x = a, y = b;
    while (y) { count += Math.floor(x / y); [x, y] = [y, x % y]; }
    if (count > 40 || a / b > 25) return null;
    const sc = Math.min(330 / a, 200 / b), W = a * sc + 8, H = b * sc + 8;
    const svg = S('svg', { viewBox: '0 0 ' + W.toFixed(1) + ' ' + H.toFixed(1), class: 'sl-pic', role: 'img', 'aria-label': 'Euclid’s algorithm as squares cut from a rectangle' });
    let X0 = 4, Y0 = 4, w = a, hh = b, k = 0;
    while (w > 0 && hh > 0) {
      const side = Math.min(w, hh), q = Math.floor(Math.max(w, hh) / side), px = side * sc;
      for (let i = 0; i < q; i++) {
        const sx = w >= hh ? X0 + i * px : X0, sy = w >= hh ? Y0 : Y0 + i * px;
        svg.append(S('rect', { x: sx, y: sy, width: px, height: px, class: 'sq s' + (k % 4) }));
        if (px >= 22) svg.append(S('text', { x: sx + px / 2, y: sy + px / 2 + 4, 'text-anchor': 'middle', class: px >= 34 ? 'tb' : 'ts' }, String(side)));
      }
      if (w >= hh) { X0 += q * px; w -= q * side; } else { Y0 += q * px; hh -= q * side; }
      k++;
    }
    return wrap(svg);
  }
  /** the remainders of a long division: the first ones in a row, the ones that repeat on a circle; arrows carry the digits */
  function chainPic(L, q) {
    const rs = L.rows.map(x => x.r), ds = L.rows.map(x => x.d);
    const tailN = L.ends ? rs.length : L.start, cyc = L.ends ? [] : rs.slice(L.start), c = cyc.length;
    if (!rs.length || q > 999 || tailN > 7 || c > 16) return null;
    const step = 66, rN = 17, R = c >= 2 ? Math.max(46, c * 60 / (2 * Math.PI)) : 0;
    const x0 = 40 + rN, W = x0 + tailN * step + (L.ends ? rN + 20 : c >= 2 ? 2 * R + rN + 24 : rN + 40), H = Math.max(120, 2 * R + 84), cy = H / 2 + (c === 1 ? 12 : 0);
    const svg = S('svg', { viewBox: '0 0 ' + W.toFixed(0) + ' ' + H.toFixed(0), class: 'sl-pic', role: 'img', 'aria-label': 'the remainders of the long division' });
    svg.style.maxWidth = Math.max(260, W) + 'px';
    const head = markers(svg, 'sl' + (++uid));
    const pos = [];
    for (let i = 0; i < tailN; i++) pos.push([x0 + i * step, cy]);
    const cx = x0 + tailN * step + R;
    if (c >= 2) for (let j = 0; j < c; j++) { const a = Math.PI - 2 * Math.PI * j / c; pos.push([cx + R * Math.cos(a), cy - R * Math.sin(a)]); }
    else if (c === 1) pos.push([x0 + tailN * step, cy]);
    const endP = L.ends ? [x0 + tailN * step, cy] : null;
    const edge = (A, B, d, outward) => {
      const dx = B[0] - A[0], dy = B[1] - A[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len;
      svg.append(S('line', { x1: A[0] + ux * rN, y1: A[1] + uy * rN, x2: B[0] - ux * (rN + 2), y2: B[1] - uy * (rN + 2), class: 'edge hi', 'marker-end': head('hi') }));
      let nx = -uy, ny = ux;
      if (outward) { const mx = (A[0] + B[0]) / 2 - cx, my = (A[1] + B[1]) / 2 - cy; if (nx * mx + ny * my < 0) { nx = -nx; ny = -ny; } } else if (ny > 0) { nx = -nx; ny = -ny; }
      svg.append(S('text', { x: (A[0] + B[0]) / 2 + nx * 11, y: (A[1] + B[1]) / 2 + ny * 11 + 4, 'text-anchor': 'middle', class: 'tb thi' }, String(d)));
    };
    for (let i = 0; i < rs.length; i++) {
      const last = i === rs.length - 1;
      if (!last) { edge(pos[i], pos[i + 1], ds[i], i >= tailN); continue; }
      if (L.ends) edge(pos[i], endP, ds[i], false);
      else if (c === 1) { const [px, py] = pos[i]; svg.append(S('circle', { cx: px, cy: py - rN - 12, r: 12, class: 'edge hi' }), S('text', { x: px + 22, y: py - rN - 14, class: 'tb thi' }, String(ds[i]))); }
      else edge(pos[i], pos[L.start], ds[i], true);
    }
    const node = ([x, y], txt, cls) => svg.append(S('circle', { cx: x, cy: y, r: rN, class: 'node ' + (cls || '') }), S('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'tm' }, txt));
    rs.forEach((r, i) => node(pos[i], String(r), i === L.start ? 'hi' : ''));
    if (endP) node(endP, '0', 'hi');
    svg.append(S('text', { x: pos[0][0] - rN - 4, y: pos[0][1] + 4, 'text-anchor': 'end', class: 'ts' }, 'start'));
    return wrap(svg);
  }
  /** √r on the number line; when r = a² + b², the right triangle whose long side is √r, swung down onto the line */
  function rootPic(r, ab) {
    const v = Math.sqrt(r), k = Math.floor(v), small = v <= 6;
    const lo = small ? 0 : k - 1, hi = small ? Math.max(2, Math.ceil(v) + 1) : k + 2;
    const W = 340, L = 18, R = 18, u = (W - L - R) / (hi - lo), tri = small && ab, up = tri ? ab[1] * u : 0, H = 64 + up, y0 = H - 36;
    const X = x => L + (x - lo) * u;
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H.toFixed(0), class: 'sl-pic', role: 'img', 'aria-label': 'the square root on the number line' });
    svg.append(S('line', { x1: 6, x2: W - 6, y1: y0, y2: y0, class: 'axis' }));
    for (let i = lo; i <= hi; i++) svg.append(S('line', { x1: X(i), x2: X(i), y1: y0 - 5, y2: y0 + 5, class: 'axis' }), S('text', { x: X(i), y: y0 + 20, 'text-anchor': 'middle', class: 't' }, String(i)));
    if (tri) {
      const [a, b] = ab;
      if (a === 1 && b === 1) svg.append(S('rect', { x: X(0), y: y0 - u, width: u, height: u, class: 'box2' }));
      svg.append(S('path', { d: 'M' + X(0) + ' ' + y0 + ' L' + X(a) + ' ' + y0 + ' L' + X(a) + ' ' + (y0 - b * u) + ' Z', class: 'soft' }));
      svg.append(S('line', { x1: X(0), y1: y0, x2: X(a), y2: y0 - b * u, class: 'edge hi' }));
      svg.append(S('path', { d: 'M' + X(a) + ' ' + (y0 - b * u) + ' A' + (v * u) + ' ' + (v * u) + ' 0 0 1 ' + X(v) + ' ' + y0, class: 'edge', 'stroke-dasharray': '4 4' }));
      svg.append(S('text', { x: (X(0) + X(a)) / 2, y: y0 - 6, 'text-anchor': 'middle', class: 'ts' }, String(a)), S('text', { x: X(a) + 6, y: y0 - b * u / 2 + 4, class: 'ts' }, String(b)));
    }
    svg.append(S('circle', { cx: X(v), cy: y0, r: 6, class: 'dot hi' }), S('text', { x: X(v) + 9, y: y0 - 10, 'text-anchor': 'start', class: 'tb thi' }, '√' + r + (k * k === r ? ' = ' + k : ' ≈ ' + v.toFixed(3))));
    return wrap(svg);
  }

  /* ================================================================== set operations */

  /** the operations: from membership in A, B (and C), is an element in the result? plan = the steps that build it */
  const SOPS = [
    { id: 'union', txt: 'A ∪ B (union)', tex: 'A \\cup B', n: 2, f: (a, b) => a || b, says: 'in $A$ or in $B$ (or in both)', plan: [['u', 'A', 'B']] },
    { id: 'inter', txt: 'A ∩ B (intersection)', tex: 'A \\cap B', n: 2, f: (a, b) => a && b, says: 'in both $A$ and $B$', plan: [['n', 'A', 'B']] },
    { id: 'AminusB', txt: 'A − B (difference)', tex: 'A - B', n: 2, f: (a, b) => a && !b, says: 'in $A$ but not in $B$', plan: [['-', 'A', 'B']] },
    { id: 'BminusA', txt: 'B − A', tex: 'B - A', n: 2, f: (a, b) => b && !a, says: 'in $B$ but not in $A$', plan: [['-', 'B', 'A']] },
    { id: 'sym', txt: 'A △ B (in exactly one)', tex: 'A \\mathbin{\\triangle} B', n: 2, f: (a, b) => a !== b, says: 'in exactly one of $A$ and $B$', plan: [['-', 'A', 'B'], ['-', 'B', 'A'], ['u', 'A - B', 'B - A']] },
    { id: 'compA', txt: 'Aᶜ (complement of A)', tex: 'A^c', n: 2, f: a => !a, says: 'in $U$ but not in $A$', plan: [['c', 'A']] },
    { id: 'compB', txt: 'Bᶜ (complement of B)', tex: 'B^c', n: 2, f: (a, b) => !b, says: 'in $U$ but not in $B$', plan: [['c', 'B']] },
    { id: 'notUnion', txt: '(A ∪ B)ᶜ (in neither)', tex: '(A \\cup B)^c', n: 2, f: (a, b) => !(a || b), says: 'in neither $A$ nor $B$', plan: [['u', 'A', 'B'], ['c', 'A \\cup B']] },
    { id: 'notInter', txt: '(A ∩ B)ᶜ (not in both)', tex: '(A \\cap B)^c', n: 2, f: (a, b) => !(a && b), says: 'not in both $A$ and $B$', plan: [['n', 'A', 'B'], ['c', 'A \\cap B']] },
    { id: 'union3', txt: 'A ∪ B ∪ C', tex: 'A \\cup B \\cup C', n: 3, f: (a, b, c) => a || b || c, says: 'in at least one of $A$, $B$, $C$', plan: [['u', 'A', 'B'], ['u', 'A \\cup B', 'C']] },
    { id: 'inter3', txt: 'A ∩ B ∩ C', tex: 'A \\cap B \\cap C', n: 3, f: (a, b, c) => a && b && c, says: 'in all three sets', plan: [['n', 'A', 'B'], ['n', 'A \\cap B', 'C']] },
    { id: 'AuB_nC', txt: '(A ∪ B) ∩ C', tex: '(A \\cup B) \\cap C', n: 3, f: (a, b, c) => (a || b) && c, says: 'in $C$, and in $A$ or $B$', plan: [['u', 'A', 'B'], ['n', 'A \\cup B', 'C']] },
    { id: 'An_BuC', txt: 'A ∩ (B ∪ C)', tex: 'A \\cap (B \\cup C)', n: 3, f: (a, b, c) => a && (b || c), says: 'in $A$, and in $B$ or $C$', plan: [['u', 'B', 'C'], ['n', 'A', 'B \\cup C']] },
    { id: 'Au_BnC', txt: 'A ∪ (B ∩ C)', tex: 'A \\cup (B \\cap C)', n: 3, f: (a, b, c) => a || (b && c), says: 'in $A$, or in both $B$ and $C$', plan: [['n', 'B', 'C'], ['u', 'A', 'B \\cap C']] },
    { id: 'AnB_uC', txt: '(A ∩ B) ∪ C', tex: '(A \\cap B) \\cup C', n: 3, f: (a, b, c) => (a && b) || c, says: 'in both $A$ and $B$, or in $C$', plan: [['n', 'A', 'B'], ['u', 'A \\cap B', 'C']] },
    { id: 'A_BuC', txt: 'A − (B ∪ C)', tex: 'A - (B \\cup C)', n: 3, f: (a, b, c) => a && !(b || c), says: 'in $A$ but in neither $B$ nor $C$', plan: [['u', 'B', 'C'], ['-', 'A', 'B \\cup C']] },
  ];
  const par = nm => (nm.length > 1 ? '(' + nm + ')' : nm);
  /** "{x | x mod 2 = 0}", "{x ∈ U | x is prime}", "{x | x ∈ ℤ, x mod 2 = 0}" → { v, rule }, or null for a list */
  function builder(src) {
    const m = /^\{\s*([a-z])\s*(?:(?:∈|in)\s*[^|:]*?)?\s*[|:]\s*([\s\S]+)\}$/i.exec(String(src).trim());
    return m ? { v: m[1].toLowerCase(), rule: m[2].trim() } : null;
  }
  /** the steps of an operation's plan on lists (env: name → list), each a sentence with the sets and a count */
  function planSteps(plan, env, U) {
    const st = [];
    let last = null;
    for (const [k, x, y] of plan) {
      const X = env[x], Y = env[y];
      let R, r, text, tex;
      if (k === 'u') {
        R = union(X, Y); r = par(x) + ' \\cup ' + par(y);
        const add = less(Y, X), both = inter(X, Y);
        text = '$' + r + '$: write down $' + x + '$ = ' + setH(X) + ', then add the elements of $' + y + '$ that are not there yet: ' + (add.length ? setH(add) : 'none') + '.' + (both.length ? ' The elements in both, ' + setH(both) + ', are written once: a set has no repeats.' : '');
        tex = '|' + r + '| = |' + x + '| + |' + y + '| - |' + par(x) + ' \\cap ' + par(y) + '| = ' + X.length + ' + ' + Y.length + ' - ' + both.length + ' = ' + R.length;
      } else if (k === 'n') {
        R = inter(X, Y); r = par(x) + ' \\cap ' + par(y);
        text = '$' + r + '$: go through $' + x + '$ and keep each element that is also in $' + y + '$: ' + (X.length ? (X.length <= 24 ? X.map(e => esc(e.label) + ' ' + (has(Y, e) ? '✓' : '✗')).join(', ') : 'of its ' + X.length + ' elements, ' + R.length + ' are in $' + y + '$') : '$' + x + '$ is empty') + '.';
        tex = '|' + r + '| = ' + R.length;
      } else if (k === '-') {
        R = less(X, Y); r = par(x) + ' - ' + par(y);
        const gone = inter(X, Y);
        text = '$' + r + '$: start from $' + x + '$ = ' + setH(X) + ' and remove every element that is also in $' + y + '$: ' + (gone.length ? setH(gone) : 'nothing to remove') + '.';
        tex = '|' + r + '| = |' + x + '| - |' + par(x) + ' \\cap ' + par(y) + '| = ' + X.length + ' - ' + gone.length + ' = ' + R.length;
      } else {
        R = less(U, X); r = par(x) + '^c';
        text = '$' + r + '$: everything in the universe $U$ that is not in $' + x + '$.';
        tex = '|' + r + '| = |U| - |' + x + '| = ' + U.length + ' - ' + X.length + ' = ' + R.length;
      }
      R = inOrder(R, U);
      env[k === 'c' ? x + '^c' : k === 'u' ? x + ' \\cup ' + y : k === 'n' ? x + ' \\cap ' + y : x + ' - ' + y] = R;
      st.push({ text: text + ' So $' + r + ' =$ ' + setH(R) + '.', tex });
      last = R;
    }
    return { st, R: last };
  }
  /** a number in a set of reals: an included end, the middle of a piece, or one step inside an endless piece */
  function pickIn(set) {
    const p = set[0];
    if (p.lo && p.loC) return p.lo;
    if (p.hi && p.hiC) return p.hi;
    if (p.lo && p.hi) return p.lo.add(p.hi).div(2);
    if (p.lo) return p.lo.add(1);
    if (p.hi) return p.hi.sub(1);
    return F(0);
  }

  /* ================================================================== counting with Venn diagrams */

  /** letters for the sets from their names (Physics → P), or A, B, C when two would clash */
  function letters(names) {
    const ls = names.map(nm => (String(nm).trim().match(/[A-Za-z]/) || [''])[0].toUpperCase());
    return ls.every(Boolean) && new Set(ls).size === ls.length && !ls.includes('U') ? ls : ['A', 'B', 'C'].slice(0, names.length);
  }
  const NOTE_NEG = 'These numbers cannot all be true: a region cannot hold a negative number of students. Check that “both” is not more than either subject, and that the class is at least as big as everyone inside the circles.';

  /* ================================================================== relations and functions on small sets */

  /** "(1, 2), (2, 3)" or "1 → 2, 2 → 3" → [[raw, raw]] */
  function parsePairs(src) {
    const s = String(src == null ? '' : src).trim(), out = [];
    if (!s || s === '∅' || s === '{}') return out;
    const re = /\(\s*([^,()]+?)\s*,\s*([^,()]+?)\s*\)/g;
    let m, any = false;
    while ((m = re.exec(s))) { any = true; out.push([m[1], m[2]]); }
    if (any) {
      const rest = s.replace(re, '').replace(/[\s,;{}]+/g, '');
      if (rest) throw new Error('“' + rest.slice(0, 20) + '” is not a pair; write pairs as (a, b).');
      return out;
    }
    for (const t0 of s.replace(/^\{|\}$/g, '').split(/[,;\n]+/).map(x => x.trim()).filter(Boolean)) {
      const p = t0.split(/\s*(?:->|→|↦|=>|>)\s*/);
      if (p.length !== 2 || !p[0] || !p[1]) throw new Error('“' + t0.slice(0, 20) + '” is not a pair; write (a, b) or a → b.');
      out.push([p[0], p[1]]);
    }
    return out;
  }

  /* ================================================================== functions on intervals of real numbers
     a few families whose values are exact at fractions; ranges and one-to-one tests are worked out exactly */

  const FAMS = [['line', 'a x + c (a straight line)'], ['square', 'a x² + c'], ['cube', 'a x³ + c'], ['cubic', 'x³ − 3x² + 5'], ['sqrt', 'a √x + c'], ['pm', '±√x (both square roots)']];
  /** a real value: exact (f, a fraction) or only approximate (an irrational value); x is its size, tex how to write it */
  const vx = fr => ({ f: fr, x: fr.num(), tex: NT(fr) });
  const vinf = sg => ({ inf: sg, x: sg * Infinity, tex: sg > 0 ? '\\infty' : '-\\infty' });
  const cmpX = (u, v) => {
    if (u.inf || v.inf) return Math.sign((u.inf || 0) - (v.inf || 0));
    if (u.f && v.f) return u.f.cmp(v.f);
    const d = u.x - v.x;
    return Math.abs(d) < 1e-12 * Math.max(1, Math.abs(u.x)) ? 0 : Math.sign(d);
  };
  const sqrtF = x => { if (x.cmp(0) < 0) return null; const a = isqrt(x.n), b = isqrt(x.d); return a * a === x.n && b * b === x.d ? F(a, b) : null; };
  const cbrtF = x => { const a = icbrt(x.n), b = icbrt(x.d); return a ** 3n === x.n && b ** 3n === x.d ? F(a, b) : null; };
  const coefT = a => (a.eq(1) ? '' : a.eq(-1) ? '-' : NT(a));
  const addT = c => (c.isZero() ? '' : c.cmp(0) > 0 ? ' + ' + NT(c) : ' - ' + NT(c.neg()));
  function famT(fam, a, c) {
    if (fam === 'cubic') return 'x^3 - 3x^2 + 5';
    if (fam === 'pm') return '\\pm\\sqrt{x}';
    if (a.isZero()) return T(c);
    return coefT(a) + { line: 'x', square: 'x^2', cube: 'x^3', sqrt: '\\sqrt{x}' }[fam] + addT(c);
  }
  /** f(x) for a fraction x: exact, or approximate for the √ of a non-square; null outside where f is defined */
  function famAt(fam, a, c, x) {
    if (fam === 'line') return vx(a.mul(x).add(c));
    if (fam === 'square') return vx(a.mul(x.pow(2)).add(c));
    if (fam === 'cube') return vx(a.mul(x.pow(3)).add(c));
    if (fam === 'cubic') return vx(x.pow(3).sub(x.pow(2).mul(3)).add(5));
    if (x.cmp(0) < 0) return null;
    const r = sqrtF(x);
    if (r || a.isZero()) return vx(a.mul(r || F(0)).add(c));
    return { f: null, x: a.num() * Math.sqrt(x.num()) + c.num(), tex: coefT(a) + '\\sqrt{' + NT(x) + '}' + addT(c) };
  }
  const famFl = (fam, a, c) => { const A = a.num(), C = c.num(); return { line: x => A * x + C, square: x => A * x * x + C, cube: x => A * x * x * x + C, cubic: x => x * x * x - 3 * x * x + 5, sqrt: x => (x < 0 ? NaN : A * Math.sqrt(x) + C), pm: x => (x < 0 ? NaN : Math.sqrt(x)) }[fam]; };
  /** where the graph turns round: a turning point inside the domain stops the function being one-to-one */
  const turns = (fam, a) => (fam === 'cubic' ? [F(0), F(2)] : fam === 'square' && !a.isZero() ? [F(0)] : []);
  /** where f goes as x → ∞ (sg = 1) or x → −∞ (sg = −1): +1 for ∞, −1 for −∞ */
  const limAt = (fam, a, sg) => (fam === 'cubic' ? sg : fam === 'square' || fam === 'sqrt' ? a.cmp(0) : a.cmp(0) * sg);
  const inside = (p, z) => (!p.lo || p.lo.cmp(z) < 0) && (!p.hi || z.cmp(p.hi) < 0);
  /** the range of f on the interval p: the smallest and largest of the values at the ends (or where f heads at ∞) and at
     the turning points inside; an end of the range is included when some point of p reaches it */
  function famRange(fam, a, c, p) {
    if (fam !== 'cubic' && a.isZero()) { const v = vx(c); return { lo: v, loC: true, hi: v, hiC: true, cands: [], constant: true }; }
    const cands = [
      p.lo ? { v: famAt(fam, a, c, p.lo), att: p.loC, at: p.lo, kind: 'end' } : { v: vinf(limAt(fam, a, -1)), att: false, kind: 'lim', sg: -1 },
      p.hi ? { v: famAt(fam, a, c, p.hi), att: p.hiC, at: p.hi, kind: 'end' } : { v: vinf(limAt(fam, a, 1)), att: false, kind: 'lim', sg: 1 },
    ];
    turns(fam, a).filter(z => inside(p, z)).forEach(z => cands.push({ v: famAt(fam, a, c, z), att: true, at: z, kind: 'turn' }));
    let lo = cands[0], hi = cands[0];
    cands.forEach(k => { if (cmpX(k.v, lo.v) < 0) lo = k; if (cmpX(k.v, hi.v) > 0) hi = k; });
    return { lo: lo.v, hi: hi.v, loC: !lo.v.inf && cands.some(k => k.att && cmpX(k.v, lo.v) === 0), hiC: !hi.v.inf && cands.some(k => k.att && cmpX(k.v, hi.v) === 0), cands };
  }
  /** an interval of reals as { lo, loC, hi, hiC } with real values (for codomains) */
  const ivOf = p => ({ lo: p.lo ? vx(p.lo) : vinf(-1), loC: !!p.loC, hi: p.hi ? vx(p.hi) : vinf(1), hiC: !!p.hiC });
  const inI = (I, y) => { const a = cmpX(I.lo, y), b = cmpX(y, I.hi); return (a < 0 || (a === 0 && I.loC)) && (b < 0 || (b === 0 && I.hiC)); };
  const subI = (r, Y) => { const a = cmpX(Y.lo, r.lo), b = cmpX(r.hi, Y.hi); return (a < 0 || (a === 0 && (Y.loC || !r.loC))) && (b < 0 || (b === 0 && (Y.hiC || !r.hiC))); };
  const ivT = I => (I.lo.inf === -1 && I.hi.inf === 1 ? '\\R' : cmpX(I.lo, I.hi) === 0 ? '\\{' + I.lo.tex + '\\}' : (I.loC ? '[' : '(') + I.lo.tex + ', ' + I.hi.tex + (I.hiC ? ']' : ')'));
  /** an x in the interval p whose value f(x) is outside Y, or null */
  function escapeWitness(fam, a, c, p, Y) {
    const xs = turns(fam, a).slice();
    if (p.lo && p.loC) xs.push(p.lo);
    if (p.hi && p.hiC) xs.push(p.hi);
    for (let k = 0; k <= 30; k++) xs.push(F(k), F(-k));
    for (let k = 1; k <= 6; k++) xs.push(F(2 * k - 1, 2), F(1 - 2 * k, 2));
    for (let k = 1; k <= 9; k++) { const e = F(1n, 10n ** BigInt(k)); if (p.lo) xs.push(p.lo.add(e)); if (p.hi) xs.push(p.hi.sub(e)); }
    for (let k = 2; k <= 12; k++) { const e = F(10n ** BigInt(k)); xs.push(e, e.neg()); }
    for (const x of xs) { if (!holds([p], x)) continue; const v = famAt(fam, a, c, x); if (v && !inI(Y, v)) return { x, v }; }
    return null;
  }
  /** a value in the codomain Y that the range r never reaches, or null */
  function missWitness(r, Y) {
    const cand = [], add = fr => cand.push(vx(fr));
    if (!r.lo.inf) { add(F(Math.ceil(r.lo.x) - 1)); add(F(Math.floor(r.lo.x) - 1)); if (r.lo.f) { if (!r.loC) cand.push(r.lo); add(r.lo.f.sub(1)); } }
    if (!r.hi.inf) { add(F(Math.floor(r.hi.x) + 1)); add(F(Math.ceil(r.hi.x) + 1)); if (r.hi.f) { if (!r.hiC) cand.push(r.hi); add(r.hi.f.add(1)); } }
    if (!Y.lo.inf && Y.loC) cand.push(Y.lo);
    if (!Y.hi.inf && Y.hiC) cand.push(Y.hi);
    if (!Y.lo.inf && r.lo.f) add(Y.lo.f.add(r.lo.f).div(2));
    if (!Y.hi.inf && r.hi.f) add(Y.hi.f.add(r.hi.f).div(2));
    return cand.find(y => inI(Y, y) && !inI(r, y)) || null;
  }
  /** a nice number inside the interval p (for examples and checks) */
  function niceIn(p, prefer) {
    for (const x of (prefer || []).concat([F(1), F(2), F(0), F(-1), F(3), F(4), F(-2), F(1, 2), F(9), F(1, 4)])) if (holds([p], x)) return x;
    return pickIn([p]);
  }
  /** two numbers with the same value: x and −x for a x² + c */
  function twinsSquare(p) {
    for (const k of [F(1), F(2), F(1, 2), F(3), F(1, 4), F(1, 10)]) if (holds([p], k) && holds([p], k.neg())) return k;
    const ends = [p.lo ? p.lo.neg() : null, p.hi].filter(Boolean);
    return ends.reduce((x, y) => (x.cmp(y) < 0 ? x : y)).div(2);
  }
  /** for a turning point z inside p: two numbers with (nearly) the same value, one on each side, found by halving */
  function twinsNumeric(fl, p, z) {
    const lo = p.lo ? p.lo.num() : -Infinity, hi = p.hi ? p.hi.num() : Infinity, eps = Math.min(z - lo, hi - z, 1) / 2;
    const xl = z - eps, xr = z + eps, fz = fl(z), yl = fl(xl), yr = fl(xr), useL = Math.abs(yl - fz) <= Math.abs(yr - fz), y = useL ? yl : yr;
    let u = useL ? z : xl, w = useL ? xr : z;
    const g = x => fl(x) - y, gu = g(u);
    for (let i = 0; i < 80; i++) { const mid = (u + w) / 2; if (Math.sign(g(mid)) === Math.sign(gu)) u = mid; else w = mid; }
    const other = (u + w) / 2;
    return useL ? { x1: xl, x2: other, y } : { x1: other, x2: xr, y };
  }
  const fmt = (x, k = 3) => minus(String(+x.toFixed(k)));
  const niceStep = span => { const raw = span / 6, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p; return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p; };
  /** the graph of a rule on its domain, with the range and codomain on the y-axis and horizontal (or vertical) test lines */
  function plotFn(o) {
    const W = 340, H = 300, L = 40, R = 12, Tp = 12, B = 30, [x0, x1] = o.view, p = o.D;
    const dl = p.lo ? p.lo.num() : -Infinity, dh = p.hi ? p.hi.num() : Infinity;
    const inD = x => (x > dl || (p.loC && x === dl)) && (x < dh || (p.hiC && x === dh));
    const N = 400, pts = [];
    for (let i = 0; i <= N; i++) { const x = x0 + (x1 - x0) * i / N; pts.push([x, o.fl(x)]); }
    [dl, dh].forEach(e => { if (Number.isFinite(e) && e > x0 && e < x1) pts.push([e, o.fl(e)]); });
    pts.sort((u, v) => u[0] - v[0]);
    let ys = pts.filter(([x, y]) => inD(x) && Number.isFinite(y)).map(([, y]) => y);
    if (o.pm) ys = ys.concat(ys.map(y => -y));
    (o.lines || []).forEach(l => ys.push(l.y));
    if (o.vline) ys.push(...o.vline.ys);
    if (o.rangeF) [o.rangeF.lo, o.rangeF.hi].forEach(y => { if (Number.isFinite(y)) ys.push(y); });
    ys.push(0);
    let y0 = Math.min(...ys), y1 = Math.max(...ys);
    if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
    const pad = (y1 - y0) * 0.08;
    y0 -= pad; y1 += pad;
    const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => Tp + (y1 - y) / (y1 - y0) * (H - Tp - B);
    const id = 'sl' + (++uid);
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'sl-pic', role: 'img', 'aria-label': 'the graph of the rule' });
    svg.append(S('defs', {}, S('clipPath', { id: id + 'clip' }, S('rect', { x: L, y: Tp, width: W - L - R, height: H - Tp - B }))));
    const sx = niceStep(x1 - x0), sy = niceStep(y1 - y0);
    for (let v = Math.ceil(x0 / sx) * sx; v <= x1 + 1e-9; v += sx) svg.append(S('line', { x1: X(v), x2: X(v), y1: Tp, y2: H - B, class: 'gridl' }), S('text', { x: X(v), y: H - B + 14, 'text-anchor': 'middle', class: 'ts' }, fmt(v, 4)));
    for (let v = Math.ceil(y0 / sy) * sy; v <= y1 + 1e-9; v += sy) svg.append(S('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'gridl' }), S('text', { x: L - 4, y: Y(v) + 4, 'text-anchor': 'end', class: 'ts' }, fmt(v, 4)));
    const ya = y0 <= 0 && y1 >= 0 ? Y(0) : H - B, xa = x0 <= 0 && x1 >= 0 ? X(0) : L;
    svg.append(S('line', { x1: L, x2: W - R, y1: ya, y2: ya, class: 'axis' }), S('line', { x1: xa, x2: xa, y1: Tp, y2: H - B, class: 'axis' }));
    svg.append(S('text', { x: W - R, y: ya - 5, 'text-anchor': 'end', class: 'ts' }, 'x'), S('text', { x: xa + 5, y: Tp + 10, class: 'ts' }, 'y'));
    const clampY = y => Math.max(y0, Math.min(y1, y)), clampX = x => Math.max(x0, Math.min(x1, x));
    if (o.cod) svg.append(S('line', { x1: xa, x2: xa, y1: Y(clampY(o.cod.lo)), y2: Y(clampY(o.cod.hi)), class: 'codbar' }));
    if (o.rangeF) {
      const r = o.rangeF;
      svg.append(S('line', { x1: xa, x2: xa, y1: Y(clampY(r.lo)), y2: Y(clampY(r.hi)), class: 'rangebar' }));
      [[r.lo, r.loC], [r.hi, r.hiC]].forEach(([y, cl]) => { if (Number.isFinite(y) && y >= y0 && y <= y1) svg.append(S('circle', { cx: xa, cy: Y(y), r: 4.5, class: 'dot hi' + (cl ? '' : ' open') })); });
    }
    svg.append(S('line', { x1: X(clampX(dl)), x2: X(clampX(dh)), y1: ya, y2: ya, class: 'dombar' }));
    [[dl, p.loC], [dh, p.hiC]].forEach(([x, cl]) => { if (Number.isFinite(x) && x >= x0 && x <= x1) svg.append(S('circle', { cx: X(x), cy: ya, r: 4.5, class: 'dot' + (cl ? '' : ' open') })); });
    const g = S('g', { 'clip-path': 'url(#' + id + 'clip)' });
    svg.append(g);
    /** the graph as paths: solid on the domain, dashed where the rule is defined but the domain leaves it out */
    const curve = (fy, cls) => {
      let d = '', state = null, prev = null;
      const flush = () => { if (state && d.includes('L')) g.append(S('path', { d, class: 'curve ' + cls + (state === 'out' ? ' out' : '') })); };
      pts.forEach(([x, yr]) => {
        const y = fy(yr);
        if (!Number.isFinite(y)) { flush(); d = ''; state = null; prev = null; return; }
        const st = inD(x) ? 'in' : 'out', P = X(x).toFixed(1) + ' ' + Y(y).toFixed(1);
        if (st !== state) {
          if (state === 'out') d += ' L' + P;
          flush();
          d = 'M' + (st === 'out' && prev ? prev + ' L' + P : P);
          state = st;
        } else d += ' L' + P;
        prev = P;
      });
      flush();
    };
    curve(y => y, '');
    if (o.pm) curve(y => -y, 'two');
    if (dl === dh && Number.isFinite(o.fl(dl))) g.append(S('circle', { cx: X(dl), cy: Y(o.fl(dl)), r: 5, class: 'dot' }));
    (o.lines || []).forEach(l => {
      g.append(S('line', { x1: L, x2: W - R, y1: Y(l.y), y2: Y(l.y), class: 'hline ' + l.cls }));
      (l.xs || []).forEach(x => g.append(S('circle', { cx: X(x), cy: Y(l.y), r: 5, class: 'dot ' + (l.cls === 'good' ? 'good' : 'bad') })));
      if (l.label) svg.append(S('text', { x: W - R - 2, y: Y(l.y) - 6, 'text-anchor': 'end', class: 'ts ' + (l.cls === 'good' ? 'tgood' : 'tbad') }, l.label));
    });
    if (o.vline) {
      const v = o.vline;
      g.append(S('line', { x1: X(v.x), x2: X(v.x), y1: Tp, y2: H - B, class: 'hline bad' }));
      v.ys.forEach(y => g.append(S('circle', { cx: X(v.x), cy: Y(y), r: 5, class: 'dot bad' })));
      svg.append(S('text', { x: X(v.x) + 6, y: Tp + 12, class: 'ts tbad' }, v.label));
    }
    return wrap(svg);
  }
  /** the steps that solve y = f(x) for x: the inverse f⁻¹(y), or null when there is no simple formula */
  function inverseOf(fam, a, c, p) {
    const yc = c.isZero() ? 'y' : 'y ' + (c.cmp(0) > 0 ? '- ' + NT(c) : '+ ' + NT(c.neg())), q = a.eq(1) ? yc : '\\frac{' + yc + '}{' + NT(a) + '}';
    const back = y => y.sub(c).div(a);
    if (fam === 'line') return { st: [{ text: 'Write $y = f(x)$ and solve for $x$:', tex: 'y = ' + famT(fam, a, c) }, ...(c.isZero() ? [] : [{ text: 'Take away ' + fH(c) + ':', tex: yc + ' = ' + coefT(a) + 'x' }]), ...(a.eq(1) ? [] : [{ text: 'Divide by ' + fH(a) + ':', tex: 'x = ' + q }])], inv: q, at: y => back(y) };
    if (fam === 'cube') return { st: [{ text: 'Write $y = f(x)$ and solve for $x$:', tex: 'y = ' + famT(fam, a, c) }, { text: 'Get $x^3$ alone:', tex: 'x^3 = ' + q }, { text: 'Take the cube root (every real number has exactly one):', tex: 'x = \\sqrt[3]{' + q + '}' }], inv: '\\sqrt[3]{' + q + '}', at: y => cbrtF(back(y)) };
    if (fam === 'square') {
      const neg = p.hi && p.hi.cmp(0) <= 0, sg = neg ? '-' : '';
      return { st: [{ text: 'Write $y = f(x)$ and solve for $x$:', tex: 'y = ' + famT(fam, a, c) }, { text: 'Get $x^2$ alone:', tex: 'x^2 = ' + q }, { text: 'Two numbers have this square, $\\pm\\sqrt{\\;}$; on this domain $x$ is ' + (neg ? 'never positive, so take the negative root' : 'never negative, so take the positive root') + ':', tex: 'x = ' + sg + '\\sqrt{' + q + '}' }], inv: sg + '\\sqrt{' + q + '}', at: y => { const r = sqrtF(back(y)); return r && (neg ? r.neg() : r); } };
    }
    if (fam === 'sqrt') return { st: [{ text: 'Write $y = f(x)$ and solve for $x$:', tex: 'y = ' + famT(fam, a, c) }, { text: 'Get $\\sqrt{x}$ alone:', tex: '\\sqrt{x} = ' + q }, { text: 'Square both sides:', tex: 'x = \\left(' + q + '\\right)^2' }], inv: '\\left(' + q + '\\right)^2', at: y => back(y).pow(2) };
    return null;
  }

  REV.lab('sets', {
    /* ---------------------------------------------------------------- numbers */
    // ?part=prime&n=126   part = prime | gcd | decimal | kind | root (what to work out); each part has its own value:
    //   n (prime) = a whole number from 0 to 1,000,000;   a, b (gcd) = whole numbers from 1 to 1,000,000,000;
    //   d (decimal) = a fraction p/q (q in lowest terms up to 100,000, or up to 10^12 when it has no primes but 2 and 5) or a
    //     decimal such as 0.375 or 0.1(6) (at most 30 digits after the point);
    //   x (kind) = any number: whole (−7), a fraction (19/5), a mixed number (3 4/5), a decimal (0.375), a repeating decimal
    //     with the repeating block in brackets (0.1(6) = 0.1666…), √n or sqrt(n) (n whole or a fraction), pi or π, e;
    //   r (root) = a whole number from 0 to 1,000,000, the number under √
    numbers(el, query, ctx) {
      const PARTS = [['prime', 'Is it prime? Its factors'], ['gcd', 'gcd and lcm by Euclid'], ['decimal', 'Fraction ⇄ decimal'], ['kind', 'Which sets is it in? ℕ, ℤ, ℚ, ℝ'], ['root', 'Why √2 is irrational']];
      const t = topic(el, query, ctx, { part: 'prime', x: '19/5', n: '126', a: '18', b: '60', d: '1/7', r: '2' }, v => { if (!PARTS.some(([k]) => k === v.part)) v.part = 'prime'; });
      const { s, controls, out } = t;
      const warn = e => out.append(K.note(esc(e.message), 'warn'));
      t.start(() => {
        const p = s.v.part;
        controls.append(
          K.p('The lectures build numbers in layers: the natural numbers $\\N = \\{0, 1, 2, \\dots\\}$, then the integers $\\Z$, the rationals $\\Q$ (fractions $\\frac{p}{q}$) and the reals $\\R$. Pick what to work out, then type a number.'),
          K.select({ label: 'Work out', options: PARTS, value: p, onChange: v => t.load({ part: v }) }));
        if (p === 'kind') controls.append(
          K.text({ label: 'Your number $x$', value: s.v.x, placeholder: '19/5, −7, 0.375, 0.1(6), √2, π', help: 'Whole, a fraction p/q, a decimal (a repeating block in brackets: 0.1(6) is 0.1666…), √n, π or e.', onChange: v => s.set({ x: v }) }),
          tries([['Maths 1 Week 1: 0 ∈ ℕ', { x: '0' }, 'Lecture 1.2: the natural numbers start at 0'], ['−7', { x: '-7' }, 'Lecture 1.2: −7 × 4 = −28; the integers add the negative numbers'],
            ['7 = 7/1', { x: '7/1' }, 'Lecture 1.4: an integer is a rational number, 7 = 7/1'], ['19/5 = 3 4/5', { x: '19/5' }, 'Lecture 1.3: 19 divided by 5 is 3 and four-fifths'],
            ['18/60', { x: '18/60' }, 'Lecture 1.3: in reduced form 18/60 is 3/10'], ['0.375', { x: '0.375' }], ['0.1(6)', { x: '0.1(6)' }, 'A repeating decimal: 0.1666…'],
            ['√2 ∉ ℚ', { x: '√2' }, 'Lectures 1.4 and 1.5: √2 is not a rational number'], ['√(9/16)', { x: '√(9/16)' }, 'Lecture 1.7: 9/16 = (3/4)² is a perfect square among the rationals'],
            ['π', { x: 'π' }, 'Lecture 1.4: π, circumference over diameter, is irrational'], ['e', { x: 'e' }, 'Lecture 1.4: e = 2.7182818… is irrational']], t.load));
        else if (p === 'prime') controls.append(
          numBox({ label: 'A whole number $n$ (0 to 1,000,000)', value: s.v.n, mode: 'numeric', onChange: v => s.set({ n: v }) }),
          tries([['Maths 1 Week 1: 12', { n: '12' }, 'Lecture 1.2: 12 = 1 × 12 = 2 × 6 = 3 × 4, and 12 = 2² × 3'], ['36, a square', { n: '36' }, 'Lecture 1.2: 36 = 6 × 6, so 36 has an odd number of factors'],
            ['126', { n: '126' }, 'Lecture 1.2: 126 = 2 × 3² × 7'], ['97', { n: '97' }, 'A prime'], ['91', { n: '91' }, 'Made up here: 91 looks prime, but 91 = 7 × 13'],
            ['1', { n: '1' }, 'Lecture 1.2: 1 is not a prime, it has only one factor'], ['1024', { n: '1024' }, 'Lecture 1.2: 32 divides 1024 because 32 × 32 = 1024'], ['999983', { n: '999983' }, 'The largest prime below a million: 998 divisions to try']], t.load));
        else if (p === 'gcd') controls.append(
          numBox({ label: 'First number $a$', value: s.v.a, mode: 'numeric', onChange: v => s.set({ a: v }) }),
          numBox({ label: 'Second number $b$', value: s.v.b, mode: 'numeric', onChange: v => s.set({ b: v }) }),
          tries([['Maths 1 Week 1: 18 and 60', { a: '18', b: '60' }, 'Lecture 1.3: gcd(18, 60) = 6, so 18/60 = 3/10'], ['5 and 4: 3/5 + 3/4', { a: '5', b: '4' }, 'Lecture 1.3: 20 is a common multiple of 5 and 4, so 3/5 + 3/4 = 12/20 + 15/20 = 27/20'],
            ['89 and 55', { a: '89', b: '55' }, 'Made up here: neighbouring Fibonacci numbers make Euclid’s algorithm take the most steps'], ['35 and 64', { a: '35', b: '64' }, 'Made up here: no common factor, gcd 1'], ['1071 and 462', { a: '1071', b: '462' }, 'Made up here: a longer run']], t.load));
        else if (p === 'decimal') controls.append(
          K.text({ label: 'A fraction, or a decimal', value: s.v.d, placeholder: '1/7, 3/8, 0.375, 0.1(6)', help: 'A fraction is turned into a decimal by long division; a decimal (repeating block in brackets) is turned into a fraction.', onChange: v => s.set({ d: v }) }),
          tries([['1/7 repeats', { d: '1/7' }], ['3/8 ends', { d: '3/8' }], ['Maths 1 Week 1: 19/5', { d: '19/5' }, 'Lecture 1.3: 19/5 = 3 4/5'], ['1/6', { d: '1/6' }], ['22/7, not π', { d: '22/7' }, 'Made up here: 22/7 is close to π but rational, so its decimals repeat; π’s never do'],
            ['0.1(6) to a fraction', { d: '0.1(6)' }], ['0.(9) = 1', { d: '0.(9)' }, 'Made up here: 0.999… and 1 are the same number'], ['0.375 to a fraction', { d: '0.375' }]], t.load));
        else controls.append(
          numBox({ label: 'The number under the root, $\\sqrt{r}$ (0 to 1,000,000)', value: s.v.r, mode: 'numeric', onChange: v => s.set({ r: v }) }),
          tries([['Maths 1 Week 1: √2', { r: '2' }, 'Lecture 1.14: Hippasus’s proof that √2 is irrational'], ['√3', { r: '3' }, 'Lecture 1.14: √3 is irrational too'], ['√4 = 2', { r: '4' }, 'Lecture 1.14: 4 is a perfect square'],
            ['√5', { r: '5' }, 'Lecture 1.14'], ['√6', { r: '6' }, 'Lecture 1.4: √6 is irrational'], ['√10', { r: '10' }, 'Lecture 1.4: √10 lies between 3 and 4'], ['√12 = 2√3', { r: '12' }, 'Made up here: take out the square factor 4 first'], ['√256 = 16', { r: '256' }, 'Lecture 1.4: 16² = 256']], t.load));
      }, draw);
      function draw() { ({ kind: drawKind, prime: drawPrime, gcd: drawGcd, decimal: drawDecimal, root: drawRoot })[s.v.part](); }

      /* which of ℕ, ℤ, ℚ, ℝ */
      function drawKind() {
        let N;
        try { N = readNumber(s.v.x); } catch (e) { warn(e); return; }
        const sg = N.neg ? '-' : '';
        let rat = null, xT;
        if (N.kind === 'rat') { rat = N.v; xT = typedT(N); }
        else if (N.kind === 'root') {
          const a = isqrt(N.r.n), b = isqrt(N.r.d);
          if (a * a === N.r.n && b * b === N.r.d) rat = N.neg ? F(a, b).neg() : F(a, b);
          xT = sg + '\\sqrt{' + T(N.r) + '}';
        } else xT = sg + (N.kind === 'pi' ? '\\pi' : 'e');
        const inQ = !!rat, inZ = inQ && rat.isInt(), inN = inZ && rat.n >= 0n, where = inN ? 'N' : inZ ? 'Z' : inQ ? 'Q' : 'R';
        const approx = rat ? rat.num() : N.kind === 'root' ? (N.neg ? -1 : 1) * Math.sqrt(N.r.num()) : (N.neg ? -1 : 1) * (N.kind === 'pi' ? Math.PI : Math.E);
        const fl0 = Math.floor(approx);
        const ins = [inN && '\\N', inZ && '\\Z', inQ && '\\Q', '\\R'].filter(Boolean), outs = [!inN && '\\N', !inZ && '\\Z', !inQ && '\\Q'].filter(Boolean);
        out.append(K.answer('Which of the sets is $x$ in?', 'x = ' + xT + (rat && T(rat) !== xT ? ' = ' + T(rat) : '') + ' \\in ' + ins.join(',\\ '),
          outs.length ? 'Not in $' + outs.join('$ or $') + '$.' : 'In all four: a natural number is also an integer, a rational and a real number.'));
        const between = 'it lies between ' + minus(fl0) + ' and ' + minus(fl0 + 1);
        const why = {
          N: inN ? 'A whole number that is not negative. The lecture counts 0 as a natural number: $\\N = \\{0, 1, 2, \\dots\\}$.' : inZ ? 'Negative: the natural numbers start at 0.' : 'Not a whole number: ' + between + '.',
          Z: inZ ? 'A whole number' + (rat.n < 0n ? '; the integers add the negative numbers to $\\N$' : '') + '.' : inQ ? 'Not a whole number: in lowest terms it is $' + T(rat) + '$, whose denominator is not 1.' : 'Not a whole number: ' + between + '.',
          Q: !inQ ? (N.kind === 'root' ? '$' + T(N.r) + '$ is not a perfect square' + (N.r.isInt() ? '' : ' of a fraction') + ', so its square root is irrational: no fraction $\\frac{p}{q}$ squares to it (lecture 1.14).'
            : N.kind === 'pi' ? 'π is irrational (lecture 1.4): no fraction equals it; its decimals 3.14159… never end and never repeat.' : 'e = 2.7182818… is irrational (lecture 1.4): its decimals never end and never repeat.')
            : N.kind === 'root' ? '$\\sqrt{' + T(N.r) + '} = ' + T(rat.cmp(0) < 0 ? rat.neg() : rat) + '$ because $' + T(rat.cmp(0) < 0 ? rat.neg() : rat) + ' \\times ' + T(rat.cmp(0) < 0 ? rat.neg() : rat) + ' = ' + T(N.r) + '$: a fraction.'
              : N.form === 'int' ? '$' + rat.n + ' = \\frac{' + rat.n + '}{1}$, a fraction of two integers (lecture 1.4: every integer is rational).'
                : N.form === 'dec' ? 'A decimal that ends is a fraction: $' + N.text + ' = ' + T(rat) + '$.'
                  : N.form === 'rec' ? 'A repeating decimal is a fraction: $x = ' + T(rat) + '$ (steps below).' : 'A fraction $\\frac{p}{q}$ of two integers with $q \\ne 0$.',
          R: inQ ? 'Every rational number is a point on the number line.' : 'It is a point on the number line' + (N.kind === 'root' && N.r.eq(2) ? ': the diagonal of a square with side 1 has length √2 (lecture 1.4)' : N.kind === 'pi' ? ': the circumference of a circle of diameter 1' : '') + '.',
        };
        out.append(K.card('Set by set', wtable(['set', 'in it?', 'why'], [['$\\N$', yes(inN), why.N], ['$\\Z$', yes(inZ), why.Z], ['$\\Q$', yes(inQ), why.Q], ['$\\R$', yes(true), why.R]])));
        out.append(K.card('The picture', K.p('Each set sits inside the next: $\\N \\subset \\Z \\subset \\Q \\subset \\R$ (lecture 1.5). The dot is $x$, in the smallest set that holds it.'),
          nestPic(where, minus(String(s.v.x).trim()))));
        const st = [];
        if (N.kind === 'rat') {
          if (N.form === 'frac') { const m = /^(-?)(\d+)\/(\d+)$/.exec(N.text), P = BigInt(m[2]), Q = BigInt(m[3]), g = bgcd(P, Q); if (g > 1n) st.push({ text: 'Reduced form (lecture 1.3): divide the top and the bottom by their greatest common divisor, ' + g + '.', tex: m[1] + '\\frac{' + P + '}{' + Q + '} = ' + m[1] + '\\frac{' + P + ' \\div ' + g + '}{' + Q + ' \\div ' + g + '} = ' + T(rat) }); }
          if (N.form === 'mixed') { const [sg2, w, a, b] = N.mix; st.push({ text: 'A mixed number is a whole number plus a fraction:', tex: sg2 + w + '\\tfrac{' + a + '}{' + b + '} = ' + sg2 + '\\left(' + w + ' + \\frac{' + a + '}{' + b + '}\\right) = ' + T(rat) }); }
          if (N.form === 'dec') st.push(...decSteps(N.text, rat));
          if (N.form === 'rec') st.push(...recSteps(N.rec));
          if (!rat.isInt()) {
            const a = rat.cmp(0) < 0 ? rat.neg() : rat, qq = a.n / a.d, rr = a.n % a.d;
            st.push({ text: 'Divide with a remainder (lecture 1.2): ' + a.d + ' goes into ' + a.n + ' ' + qq + ' times, remainder ' + rr + '.', tex: a.n + ' = ' + qq + ' \\times ' + a.d + ' + ' + rr });
            st.push({ text: 'So ' + (rat.cmp(0) < 0 ? 'the number without its minus sign is ' : '$x$ is ') + qq + ' and $\\frac{' + rr + '}{' + a.d + '}$ (lecture 1.3: 19/5 is "3 and four-fifths"); ' + between + ' on the number line.', tex: T(a) + ' = ' + qq + ' + \\frac{' + rr + '}{' + a.d + '}' + (qq ? ' = ' + qq + '\\tfrac{' + rr + '}{' + a.d + '}' : '') });
          } else st.push({ text: 'In lowest terms the denominator is 1, so $x$ is the whole number ' + minus(rat.n) + '.', tex: T(rat) + ' = \\frac{' + rat.n + '}{1}' });
        } else if (N.kind === 'root') {
          const r = N.r;
          if (rat) st.push({ text: 'Is $' + T(r) + '$ a perfect square? Yes:', tex: T(rat.cmp(0) < 0 ? rat.neg() : rat) + '^2 = ' + T(r) + ' \\quad\\Rightarrow\\quad \\sqrt{' + T(r) + '} = ' + T(rat.cmp(0) < 0 ? rat.neg() : rat) });
          else if (r.isInt()) {
            const k = isqrt(r.n);
            st.push({ text: 'Is ' + r.n + ' a perfect square? No: it lies strictly between two neighbouring squares, so its square root lies strictly between two whole numbers (lecture 1.4: √10 is between 3 and 4).', tex: k + '^2 = ' + k * k + ' < ' + r.n + ' < ' + (k + 1n) * (k + 1n) + ' = ' + (k + 1n) + '^2 \\quad\\Rightarrow\\quad ' + k + ' < \\sqrt{' + r.n + '} < ' + (k + 1n) });
            st.push({ text: 'A whole number that is not a perfect square has an irrational square root (lecture 1.14). The proof, step by step, is in "Why √2 is irrational".' });
          } else st.push({ text: 'In lowest terms $' + T(r) + '$ has top ' + r.n + ' and bottom ' + r.d + '. A fraction in lowest terms has a rational square root only when its top and bottom are both perfect squares (like $\\frac{9}{16} = \\left(\\frac34\\right)^2$, lecture 1.7); here they are not both squares.', tex: '\\sqrt{' + T(r) + '} \\approx ' + (+Math.sqrt(r.num()).toFixed(6)) });
        } else st.push({ text: (N.kind === 'pi' ? 'π = 3.14159265… is the ratio of a circle’s circumference to its diameter, the same for every circle (lecture 1.4).' : 'e = 2.7182818… is the number used for natural logarithms (lecture 1.4).') + ' Its decimals never end and never repeat, which is what irrational means: a repeating or ending decimal is always a fraction.', tex: (N.kind === 'pi' ? '\\pi \\approx 3.14159265' : 'e \\approx 2.71828183') });
        out.append(K.card('Step by step', K.steps(st),
          N.kind === 'root' && !rat && N.r.isInt() && N.r.n <= 1000000n ? h('div', { class: 'lk-row' }, K.button('Show the proof for $\\sqrt{' + N.r.n + '}$', () => t.load({ part: 'root', r: String(N.r.n) }))) : null));
        if (rat && rat.d <= 100000n) {
          const a = rat.cmp(0) < 0 ? rat.neg() : rat, L = longDiv(a.n, a.d), ds = L.rows.map(x => x.d).join('');
          let back = null;
          try { back = L.ends ? F(BigInt(String(L.ip) + ds), 10n ** BigInt(ds.length)) : recurring('', String(L.ip), ds.slice(0, L.start), ds.slice(L.start)).v; } catch (e) { back = null; }
          if (back) {
            const ok = back.eq(a);
            out.append(K.card('Check: there and back', K.p('Long division turns $x$ into a decimal' + (L.ends ? ' that ends' : ' that repeats') + '; turning that decimal back into a fraction must give $x$ again.'),
              K.steps([{ text: 'Fraction to decimal, then back:', tex: T(rat) + ' = ' + decT(L, rat.cmp(0) < 0) + ' = ' + T(rat.cmp(0) < 0 ? back.neg() : back) }]),
              K.note(ok ? 'The same number ✓' : 'They differ ✗', ok ? 'good' : 'warn')));
          }
        } else if (N.kind === 'root' && !rat) {
          const r = N.r, sc = 1000000n, lo = F(isqrt((r.n * sc * sc) / r.d), sc), hi2 = lo.add(F(1n, sc));
          const ok = lo.pow(2).cmp(r) < 0 && hi2.pow(2).cmp(r) > 0;
          out.append(K.card('Check: squeezed, never equal', K.p('Any decimal that you can write down is a fraction, so it can only come close to $\\sqrt{' + T(r) + '}$. Two neighbouring 6-decimal numbers squeeze it:'),
            K.steps([{ text: 'Square both, exactly:', tex: lo.dec(6) + '^2 = ' + lo.pow(2).dec(12) + ' < ' + T(r) + ' < ' + hi2.pow(2).dec(12) + ' = ' + hi2.dec(6) + '^2' }]),
            K.note(ok ? 'Neither square is exactly ' + fH(r) + ' ✓: the root lies strictly between them, and so on for ever.' : 'Check failed ✗', ok ? 'good' : 'warn')));
        }
      }

      /* is n prime? its factors, its prime factorisation */
      function drawPrime() {
        let n;
        try { n = readWhole(s.v.n, 0n, 1000000n, 'the number n'); } catch (e) { warn(e); return; }
        if (n < 2n) {
          out.append(K.answer('Is $n = ' + n + '$ prime?', n + '\\text{ is not prime}', n === 0n ? 'Every number divides 0 (0 = 0 × k), so 0 has endlessly many factors.' : '1 has only one factor, itself.'));
          out.append(K.card('Why', K.steps([{ text: 'A prime number has exactly two different factors: 1 and itself (lecture 1.2).' },
            n === 0n ? { text: '0 divided by any number $d \\ge 1$ leaves remainder 0, so every such $d$ is a factor of 0: far more than two.', tex: '0 = 0 \\times d' } : { text: 'The only way to make 1 is 1 × 1, so 1 has a single factor. That is one too few: 1 is not prime, and the smallest prime is 2.', tex: '1 = 1 \\times 1' }])));
          return;
        }
        const N = Number(n), k = Number(isqrt(n)), trials = [];
        for (let d = 2; d <= k; d++) trials.push([d, N % d]);
        const divs = trials.filter(([, r]) => r === 0).map(([d]) => d), prime = !divs.length;
        out.append(K.answer('Is $n = ' + bigT(n) + '$ prime?', prime ? bigT(n) + '\\text{ is prime}' : bigT(n) + ' = ' + divs[0] + ' \\times ' + bigT(N / divs[0]) + '\\text{, not prime}',
          prime ? (k >= 2 ? 'No number from 2 to ' + k + ' divides it, so its only factors are 1 and ' + n + '.' : 'There is no number from 2 to √' + n + ' to try, so its only factors are 1 and ' + n + '.') : divs[0] + ' divides ' + n + ', so it has a factor other than 1 and itself.'));
        const sq = Math.sqrt(N);
        out.append(K.card('Trial division up to $\\sqrt{n}$',
          K.steps([
            { text: 'A prime has exactly two factors, 1 and itself (lecture 1.2). So divide $n$ by the numbers from 2 up: a remainder of 0 means a factor, and then $n$ is not prime.' },
            { text: 'You only need to go up to $\\sqrt{n}$. Factors come in pairs $d \\times \\frac{n}{d} = n$, and the smaller one of a pair is at most $\\sqrt{n}$: if both were bigger than $\\sqrt{n}$, their product would be bigger than $n$.', tex: '\\sqrt{' + n + '} ' + (k * k === N ? '= ' : '\\approx ') + (k * k === N ? k : sq.toFixed(3)) + (k >= 2 ? ' \\quad\\Rightarrow\\quad d = 2, 3, \\dots, ' + k : ' < 2 \\quad\\Rightarrow\\quad \\text{nothing to try}') },
            { text: k >= 2 ? 'Each box below is one division: the number $d$ tried, and the remainder $n \\bmod d$. ' + (prime ? 'None of the ' + trials.length + ' remainders is 0, so ' + n + ' is prime.' : pl(divs.length, 'remainder is', 'remainders are') + ' 0 (coloured): ' + n + ' is not prime.') : 'With no number to try, ' + n + ' is prime.' },
          ]),
          trials.length ? h('div', { class: 'sl-trials' }, trials.map(([d, r]) => h('span', { class: 'sl-trial' + (r ? '' : ' yes'), title: n + ' mod ' + d + ' = ' + r, html: '<b>' + d + '</b><small>r ' + r + '</small>' }))) : null));
        const pairs = [[1, N]].concat(divs.map(d => [d, N / d])), square = k * k === N, count = 2 * pairs.length - (square ? 1 : 0);
        const facts = pairs.map(([d]) => d).concat(pairs.map(([, e]) => e).reverse()).filter((x, i, a) => a.indexOf(x) === i);
        out.append(K.card('Its factors, in pairs',
          K.p('Every remainder 0 above gives a pair $d \\times \\frac{n}{d}$, and 1 always pairs with $n$ (lecture 1.2): ' + pairs.map(([d, e]) => d + ' × ' + e).join(', ') + '.'),
          K.p('So ' + n + ' has ' + pl(count, 'factor') + ': ' + (facts.length <= 60 ? facts.join(', ') : facts.slice(0, 60).join(', ') + ', …') + '. ' + (square ? 'It is a perfect square, ' + k + ' × ' + k + ': ' + k + ' pairs with itself, so the number of factors is odd (lecture 1.2: 36 = 6 × 6).' : 'Each pair gives two different factors, so the number of factors is even.')),
          N <= 48 ? pairsPic(N, pairs) : null));
        const rows = [], st = [];
        let m = n, from = 2n, first = true;
        while (m > 1n) {
          let p = null, tried = 0n, why;
          for (let d = from; d * d <= m; d++) { if (m % d === 0n) { p = d; break; } tried++; }
          if (p) {
            why = tried === 0n ? p + ' divides ' + m + '.' : 'The smallest number from ' + from + ' up that divides ' + m + ' is ' + p + (tried <= 4n ? ' (' + Array.from({ length: Number(tried) }, (_, j) => m + ' mod ' + (from + BigInt(j)) + ' = ' + m % (from + BigInt(j))).join(', ') + ')' : '') + '.';
            if (first) why += ' The smallest divisor is always a prime: any factor of it would be a smaller divisor.';
          } else {
            p = m;
            why = tried ? 'No number from ' + from + ' to ' + isqrt(m) + ' divides ' + m + ', so ' + m + ' is prime.'
              : from === 2n ? m + ' is prime: there is no number from 2 to √' + m + ' to try.'
                : from + ' × ' + from + ' = ' + from * from + ' is more than ' + m + ', and the primes below ' + from + ' were divided out already, so ' + m + ' is prime.';
          }
          first = false;
          st.push({ text: why, tex: m + ' \\div ' + p + ' = ' + m / p });
          rows.push(['$' + p + '$', '$' + m + '$']);
          m /= p; from = p;
        }
        rows.push(['', '$1$']);
        const fs = factor(n), prod = fs.reduce((a, [p, e]) => a * p ** BigInt(e), 1n);
        st.push({ text: 'Stop at 1. The divisors used are the prime factors:', tex: n + ' = ' + factLong(fs) + (fs.some(([, e]) => e > 1) ? ' = ' + factT(fs) : '') });
        out.append(K.card('Prime factorisation by repeated division',
          K.p('Divide by the smallest number that goes in, again and again, until 1 is left (lecture 1.2: 126 = 2 × 3 × 3 × 7).'),
          K.table(['divide by', 'what is left'], rows), K.steps(st),
          K.note(prod === n ? 'Check: ' + factLong(fs).replace(/\\cdot/g, '×') + ' = ' + prod + ' ✓. Every number splits into primes in exactly one way (lecture 1.2).' : 'Check failed ✗', prod === n ? 'good' : 'warn')));
      }

      /* gcd by Euclid's algorithm, lcm */
      function drawGcd() {
        let a, b;
        try { a = readWhole(s.v.a, 1n, 1000000000n, 'the first number a'); b = readWhole(s.v.b, 1n, 1000000000n, 'the second number b'); } catch (e) { warn(e); return; }
        const big = a >= b ? a : b, small = a >= b ? b : a, lines = [];
        let x = big, y = small;
        while (y) { lines.push({ x, y, q: x / y, r: x % y }); [x, y] = [y, x % y]; }
        const g = x, l = a * b / g;
        out.append(K.answer('$\\gcd(' + a + ', ' + b + ')$ and $\\operatorname{lcm}(' + a + ', ' + b + ')$', '\\gcd(' + a + ', ' + b + ') = ' + bigT(g) + ', \\qquad \\operatorname{lcm}(' + a + ', ' + b + ') = ' + bigT(l),
          g === 1n ? 'No common factor except 1: ' + a + ' and ' + b + ' are coprime.' : null));
        const est = lines.map(({ x: X1, y: Y1, q, r }, i) => ({
          text: (i ? 'Divide ' : 'Divide the larger number by the smaller, ') + X1 + ' by ' + Y1 + ': it goes ' + pl(q, 'time') + ', remainder ' + r + '.' + (r ? ' So $\\gcd(' + X1 + ', ' + Y1 + ') = \\gcd(' + Y1 + ', ' + r + ')$.' : ' Remainder 0: ' + Y1 + ' divides ' + X1 + ', so the gcd is ' + Y1 + '.'),
          tex: X1 + ' = ' + q + ' \\times ' + Y1 + ' + ' + r,
        }));
        out.append(K.card('Euclid’s algorithm',
          K.p('A number that divides $a$ and $b$ also divides the remainder $a - qb$ (lecture 1.13: if a number divides a sum and one part of it, it divides the other part). So the gcd does not change when the pair is replaced by the smaller number and the remainder. Repeat until the remainder is 0.'),
          K.steps(est),
          euclidPic(Number(big), Number(small)) ? K.p('The same steps as squares: a ' + big + ' × ' + small + ' rectangle; each line cuts off as many squares as the quotient says, and the last, smallest square has side ' + g + ', the gcd.') : null,
          euclidPic(Number(big), Number(small))));
        const fa = factor(a), fb = factor(b), primes = [...new Set(fa.concat(fb).map(([p]) => p))].sort((u, v) => (u < v ? -1 : 1));
        const ex = (fs, p) => (fs.find(([q]) => q === p) || [p, 0])[1];
        const common = primes.map(p => [p, Math.min(ex(fa, p), ex(fb, p))]).filter(([, e]) => e > 0), every = primes.map(p => [p, Math.max(ex(fa, p), ex(fb, p))]);
        const g2 = common.reduce((v, [p, e]) => v * p ** BigInt(e), 1n), l2 = every.reduce((v, [p, e]) => v * p ** BigInt(e), 1n);
        out.append(K.card('Check with prime factorisations (the lecture’s way)',
          K.steps([
            { text: 'Split both numbers into primes (lecture 1.3 does this for 18 and 60).', tex: a + ' = ' + factLong(fa) + ', \\qquad ' + b + ' = ' + factLong(fb) },
            { text: 'The gcd takes the primes the two have in common, each as often as it appears in both (the smaller power).', tex: '\\gcd = ' + (common.length ? factT(common) + ' = ' + g2 : '1 \\text{ (no prime in common)}') },
            { text: 'The lcm takes every prime, each as often as it appears in either one (the larger power).', tex: '\\operatorname{lcm} = ' + factT(every.filter(([, e]) => e > 0)) + ' = ' + l2 },
          ]),
          K.note(g2 === g && l2 === l ? 'Both ways give gcd ' + g + ' and lcm ' + l + ' ✓' : 'They differ ✗', g2 === g && l2 === l ? 'good' : 'warn')));
        const lect = (a === 5n && b === 4n) || (a === 4n && b === 5n), na = lect ? 3n : 1n, nb = lect ? 3n : 1n, sumF = F(na, a).add(F(nb, b));
        out.append(K.card('The least common multiple',
          K.steps([
            { text: 'The product $a \\times b$ is a common multiple, but it counts the common part twice; divide it out once.', tex: '\\operatorname{lcm}(' + a + ', ' + b + ') = \\frac{' + a + ' \\times ' + b + '}{\\gcd(' + a + ', ' + b + ')} = \\frac{' + bigT(a * b) + '}{' + bigT(g) + '} = ' + bigT(l) },
            { text: 'Check that both divide it:', tex: bigT(l) + ' = ' + bigT(l / a) + ' \\times ' + a + ' = ' + bigT(l / b) + ' \\times ' + b },
            { text: 'Use it as the common denominator to add fractions (lecture 1.3' + (lect ? ' adds 3/5 and 3/4 over 20' : '') + '):', tex: '\\frac{' + na + '}{' + a + '} + \\frac{' + nb + '}{' + b + '} = \\frac{' + bigT(na * (l / a)) + '}{' + bigT(l) + '} + \\frac{' + bigT(nb * (l / b)) + '}{' + bigT(l) + '} = \\frac{' + bigT(na * (l / a) + nb * (l / b)) + '}{' + bigT(l) + '}' + (sumF.d !== l ? ' = ' + T(sumF) : '') },
          ]),
          K.note(g * l === a * b ? 'Check: gcd × lcm = ' + g + ' × ' + l + ' = ' + g * l + ' = ' + a + ' × ' + b + ' ✓' : 'Check failed ✗', g * l === a * b ? 'good' : 'warn')));
        out.append(K.card('Reduced form of $\\frac{' + a + '}{' + b + '}$',
          K.steps([{ text: g === 1n ? 'The gcd is 1, so the fraction is already in reduced form (lecture 1.3).' : 'Divide the top and the bottom by the gcd, ' + g + ' (lecture 1.3: 18/60 = 3/10):', tex: '\\frac{' + a + '}{' + b + '}' + (g === 1n ? '' : ' = \\frac{' + a + ' \\div ' + g + '}{' + b + ' \\div ' + g + '} = \\frac{' + a / g + '}{' + b / g + '}') }]),
          K.note('Check: $\\gcd(' + a / g + ', ' + b / g + ') = ' + bgcd(a / g, b / g) + '$ ' + (bgcd(a / g, b / g) === 1n ? '✓' : '✗'), bgcd(a / g, b / g) === 1n ? 'good' : 'warn')));
      }

      /* fraction to decimal by long division; decimal back to a fraction */
      function drawDecimal() {
        let N;
        try { N = readNumber(s.v.d); } catch (e) { warn(e); return; }
        if (N.kind !== 'rat') { out.append(K.note(N.kind === 'root' ? 'A square root that is not a fraction has decimals that never end and never repeat. Type a fraction or a decimal here, or look at "Which sets is it in?".' : 'π and e are irrational: their decimals never end and never repeat, so there is no fraction to find. Type a fraction or a decimal here.', 'warn')); return; }
        const v = N.v, neg = v.cmp(0) < 0, av = neg ? v.neg() : v, p = av.n, q = av.d;
        let q25 = q;
        while (q25 % 2n === 0n) q25 /= 2n;
        while (q25 % 5n === 0n) q25 /= 5n;
        if (q > (q25 === 1n ? 10n ** 12n : 100000n)) { out.append(K.note('In lowest terms this is $' + T(v) + '$; keep the denominator to at most ' + (q25 === 1n ? '10<sup>12</sup>' : '100,000') + ' here.', 'warn')); return; }
        const L = longDiv(p, q), fromDec = N.form === 'dec' || N.form === 'rec' || N.form === 'pct', ds = L.rows.map(x => x.d).join('');
        const rep = L.ends ? '' : ds.slice(L.start);
        out.append(K.answer(fromDec ? 'The decimal $' + typedT(N) + '$ as a fraction' : '$' + T(v) + '$ as a decimal', fromDec ? typedT(N) + ' = ' + T(v) : T(v) + ' = ' + decT(L, neg),
          fromDec ? (N.form === 'rec' ? 'A decimal whose digits repeat for ever is always a fraction.' : 'A decimal that ends is always a fraction.') : L.ends ? (ds.length ? 'The decimal ends after ' + pl(ds.length, 'digit') + '.' : 'A whole number: no digits after the point.') : 'The block of ' + pl(rep.length, 'digit') + (rep.length <= 40 ? ' ' + rep : '') + ' repeats for ever.'));
        if (N.form === 'rec') out.append(K.card('From the repeating decimal to a fraction', K.steps(recSteps(N.rec)), /^9+$/.test(N.rec.R) ? K.note('A block of 9s: ' + N.text + ' is the same number as ' + fH(v) + '. Decimals that end have a second name like this one.') : null));
        if (N.form === 'dec' || N.form === 'pct') out.append(K.card('From the decimal to a fraction', K.steps(N.form === 'dec' ? decSteps(N.text, v) : [{ text: 'Per cent means hundredths:', tex: N.text.replace('%', '\\%') + ' = ' + T(v) }])));
        const st = [{ text: 'Divide ' + p + ' by ' + q + ': it goes ' + pl(L.ip, 'time') + ' with remainder ' + p % q + '. That gives the part before the point' + (L.rows.length ? '; the remainder carries on.' : ', and remainder 0 means it stops there.'), tex: p + ' = ' + L.ip + ' \\times ' + q + ' + ' + p % q }];
        if (L.rows.length) st.push({ text: 'Each further step: put a 0 after the remainder (multiply it by 10) and divide by ' + q + '. The quotient is the next digit; the new remainder carries on. For the first step:', tex: '10 \\times ' + L.rows[0].r + ' = ' + L.rows[0].r10 + ' = ' + L.rows[0].d + ' \\times ' + q + ' + ' + L.rows[0].nr });
        st.push({ text: L.ends ? 'A remainder of 0 means nothing is left over: the decimal stops.' : 'The remainder ' + L.back + ' has come before (step ' + (L.start + 1) + '). From there the same remainders, and so the same digits, come round again for ever.' });
        const shown = L.rows.slice(0, 60);
        out.append(K.card('Long division, remainder by remainder', K.steps(st),
          L.rows.length ? K.table(['step', 'remainder', '× 10', 'digit', 'next'], shown.map((x, i) => ['$' + (i + 1) + '$', '$' + x.r + '$', '$' + x.r10 + '$', '$' + x.d + '$', '$' + x.nr + '$']), { compact: true, hi: new Set(L.ends ? [] : [L.start, L.rows.length - 1].filter(i => i < 60)) }) : null,
          L.rows.length ? K.p((L.rows.length > 60 ? '… and ' + (L.rows.length - 60) + ' more steps until a remainder comes back. ' : '') + '“next” is the remainder carried to the next step.') : null,
          chainPic(L, Number(q)) ? K.p('The remainders as a path: each circle is a remainder, each arrow one step, labelled with the digit it writes.' + (L.ends ? ' The path ends at 0.' : ' The path runs into a loop: that loop is the repeating block.')) : null,
          chainPic(L, Number(q))));
        const fq = factor(q), other = fq.filter(([pp]) => pp !== 2n && pp !== 5n), e2 = (fq.find(([pp]) => pp === 2n) || [2n, 0])[1], e5 = (fq.find(([pp]) => pp === 5n) || [5n, 0])[1], kk = Math.max(e2, e5);
        const tst = [{ text: 'In lowest terms the denominator is ' + q + '. Split it into primes:', tex: q + ' = ' + factT(fq) }];
        if (!other.length) {
          const mul = 2n ** BigInt(kk - e2) * 5n ** BigInt(kk - e5);
          tst.push({ text: 'Only 2s and 5s, and $10 = 2 \\times 5$. Multiply the top and the bottom by ' + mul + ' to make the denominator a power of 10:', tex: '\\frac{' + p + '}{' + q + '} = \\frac{' + p + ' \\times ' + mul + '}{' + q + ' \\times ' + mul + '} = \\frac{' + p * mul + '}{' + q * mul + '}' + (q > 1n ? ' = ' + decT(L, false) : '') });
          tst.push({ text: 'So the decimal ends after ' + pl(kk, 'digit') + '.' });
        } else {
          tst.push({ text: 'It has the prime factor' + (other.length > 1 ? 's ' : ' ') + other.map(([pp]) => pp).join(' and ') + '. A power of 10 has only 2s and 5s ($10^k = 2^k 5^k$), so ' + q + ' divides no power of 10 and the division can never come out exactly: the decimal never ends.' });
          tst.push({ text: 'Every remainder is one of $1, 2, \\dots, ' + (q - 1n) + '$, only ' + (q - 1n) + ' possibilities, so some remainder must come back within ' + (q - 1n) + ' steps, and then the digits repeat. Here a remainder comes back after ' + pl(L.rows.length, 'step') + '.' });
        }
        out.append(K.card('Does it end? Look at the denominator', K.steps(tst), K.note('A fraction in lowest terms has a decimal that ends exactly when its denominator has no prime factors other than 2 and 5.')));
        let back = null;
        try { back = L.ends ? F(BigInt(String(L.ip) + ds), 10n ** BigInt(ds.length)) : recurring('', String(L.ip), ds.slice(0, L.start), rep).v; } catch (e) { back = null; }
        if (back) {
          const ok = back.eq(av);
          out.append(K.card('Check: there and back', K.p(fromDec ? 'Long division of the fraction must give back the decimal you typed.' : 'Turning the decimal back into a fraction (shift the point, subtract the repeating tails) must give the fraction again.'),
            K.steps([{ text: fromDec ? 'The fraction, then its long division:' : 'The decimal, then back to a fraction:', tex: fromDec ? T(neg ? back.neg() : back) + ' = ' + (neg ? '-' : '') + decT(L, false) : (neg ? '-' : '') + decT(L, false) + ' = ' + T(neg ? back.neg() : back) }]),
            K.note(ok ? (N.form === 'rec' && /^9+$/.test(N.rec.R) ? 'The same number ✓ (long division writes it the short way, ' + fH(v) + ')' : 'The same number ✓') : 'They differ ✗', ok ? 'good' : 'warn')));
        }
      }

      /* is √r rational? the lecture's proof */
      function drawRoot() {
        let r;
        try { r = readWhole(s.v.r, 0n, 1000000n, 'the number under the root'); } catch (e) { warn(e); return; }
        const k = isqrt(r), R = Number(r);
        if (k * k === r) {
          out.append(K.answer('Is $\\sqrt{' + r + '}$ rational?', '\\sqrt{' + r + '} = ' + k + ' \\in \\N', r + ' is a perfect square, so its square root is a whole number, and so a rational number too.'));
          out.append(K.card('Step by step', K.steps([{ text: 'A perfect square is a number whose square root is a whole number (lecture 1.7): 0, 1, 4, 9, 16, 25, …', tex: k + ' \\times ' + k + ' = ' + r + ' \\quad\\Rightarrow\\quad \\sqrt{' + r + '} = ' + k }]), rootPic(R, null),
            K.note('Only perfect squares have whole-number (or rational) square roots; every other whole number has an irrational one (lecture 1.14). Try √2.')));
          return;
        }
        const { s: sq, m } = squarePart(r), v = Math.sqrt(R);
        out.append(K.answer('Is $\\sqrt{' + r + '}$ rational?', '\\sqrt{' + r + '}' + (sq > 1n ? ' = ' + sq + '\\sqrt{' + m + '}' : '') + ' \\notin \\Q', '$\\sqrt{' + r + '} \\approx ' + (+v.toFixed(8)) + '$ is irrational: a real number that is not a fraction.'));
        const ab = twoSquares(R);
        out.append(K.card('Where it is', K.steps([{ text: r + ' is not a perfect square: it lies strictly between the squares of ' + k + ' and ' + (k + 1n) + ', so its root lies strictly between ' + k + ' and ' + (k + 1n) + ' (lecture 1.4: √10 is between 3 and 4).', tex: k + '^2 = ' + k * k + ' < ' + r + ' < ' + (k + 1n) * (k + 1n) + ' = ' + (k + 1n) + '^2' }]),
          ab && v <= 6 ? K.p('It is a real length you can draw (lecture 1.4): a right triangle with sides ' + ab[0] + ' and ' + ab[1] + ' has long side $\\sqrt{' + ab[0] + '^2 + ' + ab[1] + '^2} = \\sqrt{' + r + '}$ (Pythagoras). Swing it down onto the number line:') : null,
          rootPic(R, ab)));
        if (sq > 1n) out.append(K.card('First take out the square factor', K.steps([
          { text: 'The largest square that divides ' + r + ' is ' + sq * sq + ':', tex: r + ' = ' + sq * sq + ' \\times ' + m + ' \\quad\\Rightarrow\\quad \\sqrt{' + r + '} = \\sqrt{' + sq * sq + '} \\times \\sqrt{' + m + '} = ' + sq + '\\sqrt{' + m + '}' },
          { text: 'If $\\sqrt{' + r + '}$ were a fraction $\\frac{p}{q}$, then $\\sqrt{' + m + '} = \\frac{p}{' + sq + 'q}$ would be a fraction too. So it is enough to show that $\\sqrt{' + m + '}$ is irrational.' }])));
        out.append(K.card('The proof that $\\sqrt{' + m + '}$ is irrational (lecture 1.14)', K.steps(proofSteps(m)),
          K.note('This is a proof by contradiction: to show something, assume the opposite and arrive at something impossible. The lecture tells how Hippasus, a follower of Pythagoras, proved it for √2 around 500 BCE.')));
        const sc = 1000000n, lo = F(isqrt(r * sc * sc), sc), hi2 = lo.add(F(1n, sc)), ok = lo.pow(2).cmp(r) < 0 && hi2.pow(2).cmp(r) > 0;
        out.append(K.card('Check: squeezed, never equal', K.p('Any decimal you can write down is a fraction, so it can only come close. Two neighbouring 6-decimal numbers squeeze $\\sqrt{' + r + '}$:'),
          K.steps([{ text: 'Square both, exactly:', tex: lo.dec(6) + '^2 = ' + lo.pow(2).dec(12) + ' < ' + r + ' < ' + hi2.pow(2).dec(12) + ' = ' + hi2.dec(6) + '^2' }]),
          K.note(ok ? 'Neither square is exactly ' + r + ' ✓, as the proof says: no fraction squares to ' + r + '.' : 'Check failed ✗', ok ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- operations */
    // ?U=a,b,c,d,e,f&A=a,b,c&B=c,d,e&C=&op=union   mode = list (sets of elements; the default) | interval (sets of reals).
    //   list: U = the universe; A, B and C (C optional, empty for two sets) = lists such as a, b, c or 1..10 (at most 60
    //     elements, words or numbers), or a rule over U such as {x | x mod 2 = 0}, {x ∈ U | x is prime} or {z | −6 ≤ z ≤ 6};
    //     op = union | inter | AminusB | BminusA | sym | compA | compB | notUnion | notInter, and with C: union3 | inter3 |
    //     AuB_nC | An_BuC | Au_BnC | AnB_uC | A_BuC;
    //   interval: A and B = intervals of real numbers such as [0, 1], (0, 1), [0, 1), (-inf, 2] or R, pieces joined with U;
    //     op = one of the two-set operations above (complements are taken in ℝ)
    operations(el, query, ctx) {
      const DEF = { list: { U: 'a, b, c, d, e, f', A: 'a, b, c', B: 'c, d, e', C: '', op: 'union' }, interval: { A: '[-1, 2)', B: '(0, 3]', op: 'union' } };
      const fix = v => {
        if (v.mode !== 'interval') v.mode = 'list';
        if (v.mode === 'interval') { if (v.A === DEF.list.A) v.A = DEF.interval.A; if (v.B === DEF.list.B) v.B = DEF.interval.B; }   // a link that leaves A or B out
        const o = SOPS.find(x => x.id === v.op);
        if (!o || (v.mode === 'interval' && o.n === 3)) v.op = 'union';
      };
      const t = topic(el, query, ctx, Object.assign({ mode: 'list' }, DEF.list), fix);
      const { s, controls, out } = t;
      const warn = e => out.append(K.note(esc(e.message), 'warn'));
      t.start(() => {
        const m = s.v.mode;
        controls.append(
          K.p(m === 'list' ? 'A set is a collection of elements, with no order and no repeats (lecture 1.5). Type two or three sets inside a universe $U$, pick an operation, and see it element by element.'
            : 'An interval is a set of real numbers between two ends (lecture 1.6): $[a, b]$ includes both ends, $(a, b)$ neither. Type two sets of reals and pick an operation; complements are taken in $\\R$.'),
          K.seg({ label: 'Sets of', options: [['list', 'Elements'], ['interval', 'Real numbers']], value: m, onChange: v => t.load(Object.assign({ mode: v }, DEF[v])) }));
        if (m === 'list') controls.append(
          K.text({ label: 'Universe $U$', value: s.v.U, placeholder: 'a, b, c, d, e, f   or   1..20', help: 'Everything we talk about: a complement is taken inside $U$ (lecture 1.6).', onChange: v => s.set({ U: v }) }),
          K.text({ label: 'Set $A$', value: s.v.A, placeholder: 'a, b, c', help: 'A list, a range such as 1..10, {} for the empty set, or a rule over $U$ such as {x | x mod 2 = 0} or {x | x is prime}.', onChange: v => s.set({ A: v }) }),
          K.text({ label: 'Set $B$', value: s.v.B, placeholder: 'c, d, e', onChange: v => s.set({ B: v }) }),
          K.text({ label: 'Set $C$ (optional)', value: s.v.C, placeholder: 'empty for two sets', onChange: v => s.set({ C: v }) }),
          K.select({ label: 'Operation', options: SOPS.map(o => [o.id, o.txt + (o.n === 3 ? ' (needs C)' : '')]), value: s.v.op, onChange: v => s.set({ op: v }) }),
          tries([['Maths 1 Week 1: {a, b, c} ∪ {c, d, e}', { U: 'a, b, c, d, e, f', A: 'a, b, c', B: 'c, d, e', C: '', op: 'union' }, 'Lecture 1.6: the union has 5 elements, not 6, because c is in both (the universe {a, …, f} is added here)'],
            ['{a, b, c, d} ∩ {a, d, e, f}', { U: 'a, b, c, d, e, f', A: 'a, b, c, d', B: 'a, d, e, f', C: '', op: 'inter' }, 'Lecture 1.6: the intersection is {a, d}'],
            ['A − B, then B − A', { U: 'a, b, c, d, e, f', A: 'a, b, c, d', B: 'a, d, e, f', C: '', op: 'AminusB' }, 'Lecture 1.6: {a, b, c, d} − {a, d, e, f} = {b, c}; the other way round it is {e, f}'],
            ['Primes and their complement', { U: '1..20', A: '{x | x is prime}', B: '{x | x is composite}', C: '', op: 'compA' }, 'Lecture 1.6: the complement of the primes, inside a universe (here 1 to 20); 1 is neither prime nor composite'],
            ['Factors of 24, primes below 15', { U: '1..24', A: '1, 2, 3, 4, 6, 8, 12, 24', B: '2, 3, 5, 7, 11, 13', C: '', op: 'inter' }, 'Lecture 1.5: the 8 factors of 24, and the primes below 15'],
            ['Kohli, Dhoni, Pujara', { U: 'Kohli, Dhoni, Pujara', A: 'Kohli, Pujara', B: 'Pujara, Kohli, Dhoni, Kohli', C: '', op: 'union' }, 'Lecture 1.5: {Kohli, Pujara} is a subset; order and repeats do not change a set'],
            ['Integers from −6 to 6', { U: '-9..9', A: '{z | -6 ≤ z ≤ 6}', B: '{x | x ∈ ℤ, x mod 2 = 0}', C: '', op: 'inter' }, 'Lectures 1.6 and 1.7: {z | z ∈ ℤ, −6 ≤ z ≤ 6} and the even integers (here inside −9 to 9)'],
            ['Power set of {a, b, c, d}', { U: 'a, b, c, d', A: 'a, b, c, d', B: 'b, d', C: '', op: 'inter' }, 'Lecture 1.5: 2⁴ = 16 subsets; the bits 0101 mean {b, d}'],
            ['{0, 1} × {2, 3}', { U: '0..3', A: '0, 1', B: '2, 3', C: '', op: 'union' }, 'Lecture 1.9: the Cartesian product has 4 pairs (below)'],
            ['{1, 4, 7} × {1, 16, 49}', { U: '1, 4, 7, 16, 49', A: '1, 4, 7', B: '1, 16, 49', C: '', op: 'inter' }, 'Lecture 1.11: 3 × 3 = 9 pairs (below)'],
            ['Three rules on 1 to 20', { U: '1..20', A: '{x | x mod 2 = 0}', B: '{x | x mod 3 = 0}', C: '{x | x is a perfect square}', op: 'AuB_nC' }, 'Made up here: even numbers, multiples of 3 and perfect squares']], t.load));
        else controls.append(
          K.text({ label: 'Set $A$', value: s.v.A, placeholder: '[0, 1)', help: 'Like [0, 1], (0, 1), [0, 1) or (0, 1]; inf for ∞; R for all of $\\R$; join pieces with U.', onChange: v => s.set({ A: v }) }),
          K.text({ label: 'Set $B$', value: s.v.B, placeholder: '(0, 3]', onChange: v => s.set({ B: v }) }),
          K.select({ label: 'Operation', options: SOPS.filter(o => o.n === 2).map(o => [o.id, o.txt.replace('complement of A', 'in ℝ').replace('complement of B', 'in ℝ')]), value: s.v.op, onChange: v => s.set({ op: v }) }),
          tries([['Maths 1 Week 1: [0, 1] − (0, 1)', { A: '[0, 1]', B: '(0, 1)', op: 'AminusB' }, 'Lecture 1.6: the closed interval keeps both ends, the open one neither; what is left is the two ends'],
            ['(0, 1] ∪ [0, 1)', { A: '(0, 1]', B: '[0, 1)', op: 'union' }, 'Lecture 1.6: the left-open and the right-open interval'],
            ['[−1, 2) and [3, 17)', { A: '[-1, 2)', B: '[3, 17)', op: 'union' }, 'Lecture 1.7 uses [−1, 2); lecture 1.9 the interval from 3 (closed) to 17 (open)'],
            ['Complement of [0, 1]', { A: '[0, 1]', B: '(0, 1)', op: 'compA' }, 'Everything outside [0, 1]: two pieces, open at 0 and 1'],
            ['[0, ∞) ∩ (−∞, 0]', { A: '[0, inf)', B: '(-inf, 0]', op: 'inter' }, 'Made up here: they share only the number 0']], t.load));
      }, draw);
      function draw() { if (s.v.mode === 'interval') { DISP.dec = /\./.test(s.v.A + s.v.B); try { drawReals(); } finally { DISP.dec = false; } } else drawList(); }

      function drawList() {
        const notes = [], rules = {}, hasC = String(s.v.C).trim() !== '';
        let U, A, B, C;
        try {
          const Ul = parseList(s.v.U, 'U');
          U = Ul.items;
          if (Ul.dups.length) notes.push('$U$: ' + Ul.dups.map(esc).join(', ') + ' typed again; a set has no repeats, so it counts once (lecture 1.5).');
          const read = (name, src) => {
            const b = builder(src);
            if (!b) { const r = parseList(src, name); if (r.dups.length) notes.push('$' + name + '$: ' + r.dups.map(esc).join(', ') + ' typed again; a set has no repeats, so it counts once (lecture 1.5).'); return r.items; }
            if (!U.length) throw new Error(name + ': a rule picks its elements out of the universe U, so type U first.');
            if (U.some(u => !u.num)) throw new Error(name + ': a rule needs a universe of numbers.');
            let ast;
            try { ast = parseRule(b.rule, [b.v]); } catch (e) { throw new Error(name + ': ' + e.message); }
            if (!isCond(ast)) throw new Error(name + ': after | write a condition (true or false), such as ' + b.v + ' mod 2 = 0.');
            rules[name] = { v: b.v, ast };
            return U.filter(u => { try { return boolV(evalRule(ast, { [b.v]: u.num })); } catch (e) { if (e instanceof NoOut) return false; throw new Error(name + ': ' + e.message); } });
          };
          A = read('A', s.v.A); B = read('B', s.v.B); C = hasC ? read('C', s.v.C) : [];
        } catch (e) { warn(e); return; }
        const noU = !U.length, all = union(union(A, B), C);
        if (noU) { U = all; notes.push('No universe typed, so $U = A \\cup B' + (hasC ? ' \\cup C' : '') + '$ here and nothing lies outside the sets. A complement needs a universe (lecture 1.6: “complement with respect to what?”).'); }
        else { const extra = less(all, U); if (extra.length) { U = U.concat(extra); notes.push('$U$ must hold every element of the sets; ' + setH(extra) + (extra.length === 1 ? ' was' : ' were') + ' added to $U$ here.'); } }
        let op = SOPS.find(o => o.id === s.v.op);
        if (op.n === 3 && !hasC) { notes.push('$' + op.tex + '$ needs a third set: type $C$. Until then this shows $A \\cup B$.'); op = SOPS[0]; }
        const mem = u => [has(A, u), has(B, u), has(C, u)], R = U.filter(u => op.f(...mem(u)));
        out.append(K.answer('$' + op.tex + '$: the elements ' + op.says, '|' + op.tex + '| = ' + R.length, '$' + op.tex + ' =$ ' + setH(R)));
        notes.forEach(n => out.append(K.note(n)));
        const line = (name, L) => K.p((rules[name] ? '$' + name + ' = \\{' + rules[name].v + ' \\in U \\mid ' + texRule(rules[name].ast) + '\\} =$ ' : '$' + name + ' =$ ') + setH(L) + ', $\\;|' + name + '| = ' + L.length + '$');
        const sets = h('div', { class: 'sl-sets' }, line('U', U), line('A', A), line('B', B), hasC ? line('C', C) : null);
        out.append(K.card('The sets', sets, Object.keys(rules).length ? K.p('A rule picks out the elements of $U$ that make it true: $U$ is the generator and the rule is the filter (lectures 1.6 and 1.7).') : null));
        const names = hasC ? ['A', 'B', 'C'] : ['A', 'B'], k = names.length;
        const region = m => U.filter(u => { const [a, b, c] = mem(u); return (a ? 1 : 0) + (b ? 2 : 0) + (c ? 4 : 0) === m; });
        out.append(K.card('Venn diagram', K.p('The shaded part is $' + op.tex + '$. Each element of $U$ is written in its own region; “outside” lists the elements of $U$ in none of the sets.'),
          venn(names, m => (m < 1 << k ? { labels: region(m).map(u => u.label), shade: op.f(!!(m & 1), !!(m & 2), !!(m & 4)) } : null), { label: 'Venn diagram of ' + op.txt })));
        const rows = U.map(u => { const [a, b, c] = mem(u), r = op.f(a, b, c); return [esc(u.label), a ? '✓' : '·', b ? '✓' : '·'].concat(hasC ? [c ? '✓' : '·'] : []).concat([r ? '<b>✓</b>' : '·']); });
        out.append(K.card('Element by element', K.p('For each element of $U$: is it in $A$? in $B$?' + (hasC ? ' in $C$?' : '') + ' It is in $' + op.tex + '$ when it is ' + op.says + '.'),
          K.table(['element', '$A$', '$B$'].concat(hasC ? ['$C$'] : []).concat(['$' + op.tex + '$']), rows, { hi: new Set(U.map((u, i) => (has(R, u) ? i : -1)).filter(i => i >= 0)) })));
        const env = { A: inOrder(A, U), B: inOrder(B, U), C: inOrder(C, U) }, P = planSteps(op.plan, env, U);
        const same = P.R.length === R.length && P.R.every(x => has(R, x));
        const extraSt = op.id === 'AminusB' || op.id === 'BminusA' ? [{ text: 'The order matters, as with subtracting numbers (lecture 1.6): ' + (op.id === 'AminusB' ? '$B - A =$ ' + setH(inOrder(less(B, A), U)) : '$A - B =$ ' + setH(inOrder(less(A, B), U))) + '.' }]
          : op.id === 'sym' ? [{ text: 'The same set is $(A \\cup B) - (A \\cap B)$: everything in $A$ or $B$, except what is in both.', tex: '|A \\mathbin{\\triangle} B| = |A| + |B| - 2|A \\cap B| = ' + A.length + ' + ' + B.length + ' - 2 \\times ' + inter(A, B).length + ' = ' + R.length }]
            : op.id === 'union3' ? [{ text: 'Check with the three-set count (inclusion–exclusion): add the sets, take away the overlaps of two, add back the middle.', tex: '|A \\cup B \\cup C| = ' + A.length + ' + ' + B.length + ' + ' + C.length + ' - ' + inter(A, B).length + ' - ' + inter(A, C).length + ' - ' + inter(B, C).length + ' + ' + inter(inter(A, B), C).length + ' = ' + (A.length + B.length + C.length - inter(A, B).length - inter(A, C).length - inter(B, C).length + inter(inter(A, B), C).length) }] : [];
        out.append(K.card('Step by step', K.steps(P.st.concat(extraSt)), K.note(same ? 'The steps and the element-by-element table give the same ' + pl(R.length, 'element') + ' ✓' : 'The steps and the table differ ✗', same ? 'good' : 'warn')));
        const sub = (X, Y) => X.find(x => !has(Y, x));
        const test = (nx, ny, X, Y) => {
          const w = sub(X, Y), back = sub(Y, X);
          return ['$' + nx + ' \\subseteq ' + ny + '$', yes(!w), w ? esc(w.label) + ' is in $' + nx + '$ but not in $' + ny + '$.' : !X.length ? '$' + nx + ' = \\varnothing$, and the empty set is a subset of every set (lecture 1.5).' : 'Every element of $' + nx + '$ is in $' + ny + '$' + (back ? '; ' + esc(back.label) + ' is in $' + ny + '$ only, so $' + nx + ' \\subsetneq ' + ny + '$, a proper subset.' : ', and the other way round too: $' + nx + ' = ' + ny + '$.')];
        };
        const srows = [test('A', 'B', A, B), test('B', 'A', B, A)];
        if (hasC) srows.push(test('A', 'C', A, C), test('C', 'A', C, A), test('B', 'C', B, C), test('C', 'B', C, B));
        out.append(K.card('Subsets', wtable(['test', 'true?', 'why'], srows), K.p('$X \\subseteq Y$ when every element of $X$ is in $Y$; two sets are equal exactly when each is a subset of the other (lecture 1.5).')));
        const cU = X => less(U, X), sameL = (X, Y) => X.length === Y.length && X.every(x => has(Y, x));
        const L1 = cU(union(A, B)), R1 = inter(cU(A), cU(B)), L2 = cU(inter(A, B)), R2 = inOrder(union(cU(A), cU(B)), U), ok1 = sameL(L1, R1), ok2 = sameL(L2, R2);
        out.append(K.card('De Morgan’s laws, on your sets', K.steps([
          { text: 'Outside “$A$ or $B$” is the same as “not in $A$ and not in $B$”. Left: $(A \\cup B)^c =$ ' + setH(L1) + '. Right: $A^c =$ ' + setH(cU(A)) + ' and $B^c =$ ' + setH(cU(B)) + ', whose intersection is ' + setH(R1) + '.', tex: '(A \\cup B)^c = A^c \\cap B^c' },
          { text: 'Outside “$A$ and $B$” is the same as “not in $A$, or not in $B$”. Left: $(A \\cap B)^c =$ ' + setH(L2) + '. Right: $A^c \\cup B^c =$ ' + setH(R2) + '.', tex: '(A \\cap B)^c = A^c \\cup B^c' }]),
          K.note(ok1 && ok2 ? 'Both laws hold on your sets ✓' : 'A law failed ✗', ok1 && ok2 ? 'good' : 'warn')));
        const n = A.length;
        if (n <= 4) {
          const prow = [];
          for (let mask = 0; mask < 1 << n; mask++) {
            const keep = A.map((_, i) => (mask >> (n - 1 - i)) & 1);
            prow.push(['<span class="sl-set">' + (n ? keep.join('') : '(none)') + '</span>', setH(A.filter((_, i) => keep[i])), String(keep.reduce((a, x) => a + x, 0))]);
          }
          const sizes = Array.from({ length: n + 1 }, (_, j) => K.C(n, j).tex());
          out.append(K.card('The power set of $A$', K.steps([
            { text: 'A subset keeps or leaves out each element of $A$: one bit per element (in the order ' + (n ? A.map(a => esc(a.label)).join(', ') : 'none') + '), 1 = keep, 0 = leave out (lecture 1.5: for {a, b, c, d}, 0101 keeps b and d).' },
            { text: 'Two choices for each of the ' + pl(n, 'element') + ', so the number of subsets doubles with each element:', tex: '|\\mathcal{P}(A)| = ' + (n ? new Array(n).fill('2').join(' \\times ') + ' = ' : '') + '2^{' + n + '} = ' + 2 ** n },
            { text: 'Sorted by size, from $\\varnothing$ to $A$ itself:', tex: sizes.join(' + ') + ' = ' + 2 ** n }]),
            K.table(['bits', 'subset', 'size'], prow, { hi: new Set([0, (1 << n) - 1]) }),
            n === 0 ? K.note('The power set of $\\varnothing$ is $\\{\\varnothing\\}$: one element, the empty set itself (lecture 1.5).') : null));
        } else out.append(K.card('The power set of $A$', K.steps([{ text: '$A$ has ' + n + ' elements; each is kept or left out, so there are $2^{' + n + '}$ subsets, too many to list here (the list is shown when $A$ has at most 4 elements).', tex: '|\\mathcal{P}(A)| = 2^{' + n + '} = ' + (2 ** n).toLocaleString('en').replace(/,/g, '\\,') }])));
        const prodN = A.length * B.length;
        const grid = prodN && prodN <= 100 ? h('div', { class: 'lk-tbl' }, h('table', { class: 'lk-grid' },
          h('thead', {}, h('tr', {}, h('th', { html: K.rich('$a \\in A$') }), B.map(b => h('th', { text: b.label })))),
          h('tbody', {}, A.map(a => h('tr', {}, h('th', { text: a.label }), B.map(b => h('td', { text: '(' + a.label + ', ' + b.label + ')' }))))))) : null;
        out.append(K.card('The Cartesian product $A \\times B$', K.steps([
          { text: 'All ordered pairs $(a, b)$ with $a$ from $A$ and $b$ from $B$ (lecture 1.9). Each of the ' + pl(A.length, 'element') + ' of $A$ pairs with each of the ' + pl(B.length, 'element') + ' of $B$:', tex: '|A \\times B| = |A| \\times |B| = ' + A.length + ' \\times ' + B.length + ' = ' + prodN }]),
          grid, prodN > 100 ? K.p('Too many pairs to list here.') : null,
          K.note('Order matters in a pair: $(a, b) \\ne (b, a)$ unless $a = b$, so $B \\times A$ holds the same pairs turned round, a different set (lecture 1.11).')));
      }

      function drawReals() {
        let A, B;
        try { A = parseReals(s.v.A, 'A'); B = parseReals(s.v.B, 'B'); } catch (e) { warn(e); return; }
        const op = SOPS.find(o => o.id === s.v.op && o.n === 2) || SOPS[0], f = (a, b) => op.f(a, b), R = combine([A, B], f);
        const says = op.says.replace('$U$', '$\\R$'), short2 = op.txt.split(' (')[0];
        out.append(K.answer('$' + op.tex + '$: the real numbers ' + says, op.tex + ' = ' + realsT(R), 'In set-builder notation: $' + op.tex + ' = ' + builderT(R) + '$'));
        out.append(K.card('On the number line', K.p('A filled dot is an end that is included, a hollow dot one that is not (lecture 1.6); an arrow means the piece goes on for ever.'),
          numberLines([{ name: 'A', set: A }, { name: 'B', set: B }, { name: short2, set: R, hi: true }])));
        out.append(K.card('In set-builder notation', K.p('An interval is a set comprehension over $\\R$: the generator is $\\R$, the filter is the inequality (lecture 1.6).'),
          K.p('$A = ' + realsT(A) + ' = ' + builderT(A) + '$'), K.p('$B = ' + realsT(B) + ' = ' + builderT(B) + '$')));
        const at = atoms([A, B]), pts = endpoints([A, B]);
        const rows = at.map(a => { const x = a.pt || a.probe, ia = holds(A, x), ib = holds(B, x), r = f(ia, ib); return ['$' + atomT(a) + '$', ia ? '✓' : '·', ib ? '✓' : '·', r ? '<b>✓</b>' : '·']; });
        out.append(K.card('Step by step', K.steps([
          { text: pts.length ? 'The ends ' + pts.map(p => '$' + NT(p) + '$').join(', ') + ' cut the number line into pieces: the ends themselves and the open gaps between them. Inside a gap nothing changes, so testing one number in it settles the whole gap.' : 'No ends at all: the whole line behaves the same way.' },
          { text: 'Test each piece: is it in $A$? in $B$? It is in $' + op.tex + '$ when it is ' + says + '.' },
          { text: 'Join the neighbouring pieces marked ✓ in the last column:', tex: op.tex + ' = ' + realsT(R) }]),
          K.table(['piece', '$A$', '$B$', '$' + op.tex + '$'], rows, { hi: new Set(rows.map((r, i) => (r[3] !== '·' ? i : -1)).filter(i => i >= 0)) })));
        const cA = combine([A], a => !a), cB = combine([B], b => !b);
        const L1 = combine([A, B], (a, b) => !(a || b)), R1 = combine([cA, cB], (a, b) => a && b), L2 = combine([A, B], (a, b) => !(a && b)), R2 = combine([cA, cB], (a, b) => a || b);
        const ok = sameReals(L1, R1) && sameReals(L2, R2);
        out.append(K.card('De Morgan’s laws in $\\R$', K.steps([
          { text: 'Complements in $\\R$:', tex: 'A^c = ' + realsT(cA) + ', \\quad B^c = ' + realsT(cB) },
          { text: 'First law, both sides:', tex: '(A \\cup B)^c = ' + realsT(L1) + ', \\quad A^c \\cap B^c = ' + realsT(R1) },
          { text: 'Second law, both sides:', tex: '(A \\cap B)^c = ' + realsT(L2) + ', \\quad A^c \\cup B^c = ' + realsT(R2) }]),
          K.note(ok ? 'Both laws hold ✓' : 'A law failed ✗', ok ? 'good' : 'warn')));
        const AnotB = combine([A, B], (a, b) => a && !b), BnotA = combine([A, B], (a, b) => b && !a);
        const subRow = (nx, ny, D) => ['$' + nx + ' \\subseteq ' + ny + '$', yes(!D.length), D.length ? '$' + NT(pickIn(D)) + '$ is in $' + nx + '$ but not in $' + ny + '$.' : 'Every number in $' + nx + '$ is in $' + ny + '$.'];
        out.append(K.card('Subsets', wtable(['test', 'true?', 'why'], [subRow('A', 'B', AnotB), subRow('B', 'A', BnotA)])));
      }
    },

    /* ---------------------------------------------------------------- counting */
    // ?sets=2&ask=n&a=30&b=25&ab=10&none=5&A=Physics&B=Biology   sets = 2 | 3 (subjects);
    //   ask = what to find: n (everyone in the class), none (in no subject), a, b, c (all who take that subject), ab, ac,
    //     bc (all who take both), abc (all three), and with two subjects aOnly, bOnly (the first but not the second, …);
    //   n, a, b, c, ab, ac, bc, abc, none = the counts you know, whole numbers from 0 to 100,000 (the one asked for is
    //     not used); A, B, C = the names of the subjects
    counting(el, query, ctx) {
      const D2 = { sets: 2, ask: 'n', n: 50, a: 30, b: 25, ab: 10, none: 5, A: 'Physics', B: 'Biology' };
      const D3 = { sets: 3, ask: 'none', n: 100, a: 45, b: 40, c: 35, ab: 15, ac: 10, bc: 12, abc: 5, none: 12, A: 'Maths', B: 'Physics', C: 'Chemistry' };
      const KEYS = ['n', 'a', 'b', 'c', 'ab', 'ac', 'bc', 'abc', 'none'];
      const fix = v => {
        v.sets = +v.sets === 3 ? 3 : 2;
        KEYS.forEach(k => { const x = Math.round(+v[k]); v[k] = Number.isFinite(x) ? Math.max(0, Math.min(100000, x)) : 0; });
        const ok = v.sets === 2 ? ['n', 'none', 'ab', 'a', 'b', 'aOnly', 'bOnly'] : ['n', 'none', 'a', 'b', 'c', 'ab', 'ac', 'bc', 'abc'];
        if (!ok.includes(v.ask)) v.ask = 'n';
        ['A', 'B', 'C'].forEach(k => { v[k] = String(v[k] || '').slice(0, 24); });
      };
      const t = topic(el, query, ctx, Object.assign({ c: 35, ac: 10, bc: 12, abc: 5, C: 'Chemistry' }, D2), fix);
      const { s, controls, out } = t;
      const nm = k => (String(s.v[k]).trim() || k);
      t.start(() => {
        const three = s.v.sets === 3, L = letters(three ? [nm('A'), nm('B'), nm('C')] : [nm('A'), nm('B')]), [P, Q, R3] = L;
        const askOpts = three ? [['n', 'Everyone in the class'], ['none', 'Taking none of the three'], ['a', 'Taking ' + nm('A')], ['b', 'Taking ' + nm('B')], ['c', 'Taking ' + nm('C')], ['ab', 'Taking ' + nm('A') + ' and ' + nm('B')], ['ac', 'Taking ' + nm('A') + ' and ' + nm('C')], ['bc', 'Taking ' + nm('B') + ' and ' + nm('C')], ['abc', 'Taking all three']]
          : [['n', 'Everyone in the class'], ['none', 'Taking neither'], ['ab', 'Taking both'], ['a', 'Taking ' + nm('A')], ['b', 'Taking ' + nm('B')], ['aOnly', nm('A') + ' but not ' + nm('B')], ['bOnly', nm('B') + ' but not ' + nm('A')]];
        const unk = s.v.ask === 'aOnly' ? 'a' : s.v.ask === 'bOnly' ? 'b' : s.v.ask;
        const lab = { n: 'Everyone in the class, $n$', none: 'Taking ' + (three ? 'none of them' : 'neither'), a: 'Taking ' + esc(nm('A')) + ', $|' + P + '|$', b: 'Taking ' + esc(nm('B')) + ', $|' + Q + '|$', c: 'Taking ' + esc(nm('C')) + ', $|' + R3 + '|$',
          ab: 'Taking both ' + esc(nm('A')) + ' and ' + esc(nm('B')) + ', $|' + P + ' \\cap ' + Q + '|$', ac: 'Taking ' + esc(nm('A')) + ' and ' + esc(nm('C')) + ', $|' + P + ' \\cap ' + R3 + '|$', bc: 'Taking ' + esc(nm('B')) + ' and ' + esc(nm('C')) + ', $|' + Q + ' \\cap ' + R3 + '|$', abc: 'Taking all three, $|' + P + ' \\cap ' + Q + ' \\cap ' + R3 + '|$' };
        const nameBox = k => { const f = K.text({ label: 'Name of subject ' + (k === 'A' ? 1 : k === 'B' ? 2 : 3), value: s.v[k], onChange: v => s.set({ [k]: v }) }); f.querySelector('input').addEventListener('change', () => t.load({})); return f; };
        controls.append(
          K.p('Venn diagrams are not just pictures: they count (lecture 1.8). Type what you know about a class, pick what to find, and every region of the diagram is worked out from your numbers.'),
          K.seg({ label: 'Subjects', options: [['2', 'Two'], ['3', 'Three']], value: String(s.v.sets), onChange: v => t.load(v === '3' ? D3 : D2) }),
          group('The subjects', nameBox('A'), nameBox('B'), three ? nameBox('C') : null),
          K.select({ label: 'Find', options: askOpts, value: s.v.ask, onChange: v => t.load({ ask: v }) }),
          group('What you know', ...(three ? KEYS : ['n', 'a', 'b', 'ab', 'none']).filter(k => k !== unk).map(k => K.int({ label: lab[k], value: s.v[k], min: 0, max: 100000, onChange: v => s.set({ [k]: v }) }))),
          tries(three ? [['Made up here: none of three', D3, 'Made up here: 100 students; how many take none of the three?'], ['Find all three', Object.assign({}, D3, { ask: 'abc' }), 'The same class: find the middle region from the total'], ['Find Physics', Object.assign({}, D3, { ask: 'b' }), 'The same class: find one subject']]
            : [['Maths 1 Week 1: how many in the class?', D2, 'Lecture 1.8: 30 physics, 25 biology, 10 both, 5 neither: the class has 50'],
              ['Biology but not physics', { sets: 2, ask: 'bOnly', n: 55, a: 32, ab: 11, none: 7, A: 'Physics', B: 'Biology' }, 'Lecture 1.8: a class of 55, 32 physics, 11 both, 7 neither: 7 + 21 + 11 + x = 55, so x = 16'],
              ['How many take both?', { sets: 2, ask: 'ab', n: 60, a: 35, b: 30, none: 10, A: 'Physics', B: 'Biology' }, 'Lecture 1.8: 60 students, 35 physics, 30 biology, 10 neither: 15 take both'],
              ['Impossible numbers', { sets: 2, ask: 'n', a: 10, b: 25, ab: 12, none: 5, A: 'Physics', B: 'Biology' }, 'Made up here: 12 cannot take both when only 10 take physics']], t.load));
      }, draw);
      function draw() { if (s.v.sets === 3) draw3(); else draw2(); }

      function draw2() {
        const v = s.v, ask = v.ask, unk = ask === 'aOnly' ? 'a' : ask === 'bOnly' ? 'b' : ask, [P, Q] = letters([nm('A'), nm('B')]), nA = esc(nm('A')), nB = esc(nm('B'));
        let { n, a, b, ab, none } = v, aO, bO, U;
        const st = [], PQ = P + ' \\cap ' + Q;
        const both = () => st.push({ text: 'Both: ' + ab + ' students take ' + nA + ' and ' + nB + '. They go in the overlap.', tex: '|' + PQ + '| = ' + ab });
        const onlyA = () => st.push({ text: nA + ' has ' + a + ' students in all, and ' + ab + ' of them are already in the overlap, so the rest take ' + nA + ' but not ' + nB + ':', tex: '|' + P + ' - ' + Q + '| = |' + P + '| - |' + PQ + '| = ' + a + ' - ' + ab + ' = ' + aO });
        const onlyB = () => st.push({ text: 'In the same way, ' + nB + ' but not ' + nA + ':', tex: '|' + Q + ' - ' + P + '| = |' + Q + '| - |' + PQ + '| = ' + b + ' - ' + ab + ' = ' + bO });
        const outside = () => st.push({ text: 'Outside both circles: ' + none + ' take neither (the complement of $' + P + ' \\cup ' + Q + '$).', tex: '|(' + P + ' \\cup ' + Q + ')^c| = ' + none });
        if (unk === 'n') { aO = a - ab; bO = b - ab; both(); onlyA(); onlyB(); outside(); n = aO + ab + bO + none; st.push({ text: 'The four regions do not overlap and cover the class, so add them:', tex: 'n = ' + aO + ' + ' + ab + ' + ' + bO + ' + ' + none + ' = ' + n }); }
        else if (unk === 'none') { aO = a - ab; bO = b - ab; both(); onlyA(); onlyB(); U = aO + ab + bO; st.push({ text: 'Inside the circles:', tex: '|' + P + ' \\cup ' + Q + '| = ' + aO + ' + ' + ab + ' + ' + bO + ' = ' + U }); none = n - U; st.push({ text: 'Everyone else takes neither:', tex: n + ' - ' + U + ' = ' + none }); }
        else if (unk === 'a' || unk === 'b') {
          const isA = unk === 'a';
          both();
          if (isA) { bO = b - ab; onlyB(); } else { aO = a - ab; onlyA(); }
          outside();
          const known = isA ? bO : aO, x = n - none - ab - known;
          if (isA) aO = x; else bO = x;
          st.push({ text: 'Call the unknown region $x$ (' + (isA ? nA + ' but not ' + nB : nB + ' but not ' + nA) + '). The four regions add up to the class (lecture 1.8: 7 + 21 + 11 + x = 55):', tex: none + ' + ' + known + ' + ' + ab + ' + x = ' + n + ' \\quad\\Rightarrow\\quad x = ' + n + ' - ' + none + ' - ' + known + ' - ' + ab + ' = ' + x });
          if (isA) { a = aO + ab; st.push({ text: 'All who take ' + nA + ': the region found plus the overlap.', tex: '|' + P + '| = ' + aO + ' + ' + ab + ' = ' + a }); }
          else { b = bO + ab; st.push({ text: 'All who take ' + nB + ': the region found plus the overlap.', tex: '|' + Q + '| = ' + bO + ' + ' + ab + ' = ' + b }); }
        } else {
          U = n - none;
          st.push({ text: 'Add the two subjects:', tex: '|' + P + '| + |' + Q + '| = ' + a + ' + ' + b + ' = ' + (a + b) });
          st.push({ text: 'But only the students outside the “neither” group take a subject at all:', tex: '|' + P + ' \\cup ' + Q + '| = n - ' + none + ' = ' + n + ' - ' + none + ' = ' + U });
          ab = a + b - U;
          st.push({ text: 'The students who take both were counted twice in ' + (a + b) + ', so the extra is exactly them (lecture 1.8):', tex: '|' + PQ + '| = |' + P + '| + |' + Q + '| - |' + P + ' \\cup ' + Q + '| = ' + (a + b) + ' - ' + U + ' = ' + ab });
          aO = a - ab; bO = b - ab; onlyA(); onlyB();
        }
        const union2 = aO + ab + bO, regions = [aO, bO, ab, none], bad = regions.some(x => x < 0);
        const val = { n, none, ab, a, b, aOnly: aO, bOnly: bO }[ask];
        const what = { n: 'Everyone in the class', none: 'Taking neither', ab: 'Taking both ' + nA + ' and ' + nB, a: 'Taking ' + nA, b: 'Taking ' + nB, aOnly: 'Taking ' + nA + ' but not ' + nB, bOnly: 'Taking ' + nB + ' but not ' + nA }[ask];
        const texOf = { n: 'n', none: '|(' + P + ' \\cup ' + Q + ')^c|', ab: '|' + PQ + '|', a: '|' + P + '|', b: '|' + Q + '|', aOnly: '|' + P + ' - ' + Q + '|', bOnly: '|' + Q + ' - ' + P + '|' }[ask];
        out.append(K.answer(what, texOf + ' = ' + val, bad ? null : (ask === 'a' || ask === 'b' ? 'Of them, ' + (ask === 'a' ? aO + ' take ' + nA + ' only' : bO + ' take ' + nB + ' only') + '.' : null)));
        if (bad) out.append(K.note(NOTE_NEG, 'warn'));
        const hiM = { n: [], none: [0], ab: [3], a: [1, 3], b: [2, 3], aOnly: [1], bOnly: [2] }[ask], cnt = [none, aO, bO, ab];
        out.append(K.card('The Venn diagram, filled in', K.p((ask === 'n' ? 'All the regions together make the class.' : 'Shaded: the students asked about.') + ' Each number counts one region; the regions do not overlap.'),
          venn([short(nm('A'), 12), short(nm('B'), 12)], m => ({ count: cnt[m], shade: hiM.includes(m), hi: hiM.includes(m) }), { u: 'Class: ' + n, outWord: 'neither', label: 'Venn diagram with the count in each region' })));
        out.append(K.card('Step by step', K.steps(st)));
        const sum = aO + ab + bO + none, f1 = a + b - ab;
        out.append(K.card('Check', K.steps([
          { text: 'The four regions add up to the class:', tex: aO + ' + ' + ab + ' + ' + bO + ' + ' + none + ' = ' + sum },
          { text: 'The formula for two sets gives the same number inside the circles:', tex: '|' + P + ' \\cup ' + Q + '| = |' + P + '| + |' + Q + '| - |' + PQ + '| = ' + a + ' + ' + b + ' - ' + ab + ' = ' + f1 }]),
          K.note(sum === n && f1 === union2 && !bad ? 'Everything agrees: ' + sum + ' = n, and ' + f1 + ' inside the circles ✓' : bad ? 'A region is negative ✗' : 'The counts do not agree ✗', sum === n && f1 === union2 && !bad ? 'good' : 'warn')));
      }

      function draw3() {
        const v = s.v, ask = v.ask, [P, Q, R3] = letters([nm('A'), nm('B'), nm('C')]), nA = esc(nm('A')), nB = esc(nm('B')), nC = esc(nm('C'));
        let { n, a, b, c, ab, ac, bc, abc, none } = v;
        const st = [], I = (...xs) => xs.join(' \\cap ');
        const uT = P + ' \\cup ' + Q + ' \\cup ' + R3;
        if (['ab', 'ac', 'bc', 'abc'].includes(ask)) {
          const U = n - none;
          st.push({ text: 'Everyone who takes at least one subject:', tex: '|' + uT + '| = n - ' + none + ' = ' + n + ' - ' + none + ' = ' + U });
          st.push({ text: 'Inclusion–exclusion: add the three subjects, take away the three overlaps of two (counted twice), and add back the middle (added three times, then taken away three times):', tex: '|' + uT + '| = |' + P + '| + |' + Q + '| + |' + R3 + '| - |' + I(P, Q) + '| - |' + I(P, R3) + '| - |' + I(Q, R3) + '| + |' + I(P, Q, R3) + '|' });
          const term = (k, val) => (ask === k ? 'x' : String(val));
          const rest = a + b + c - (ask === 'ab' ? 0 : ab) - (ask === 'ac' ? 0 : ac) - (ask === 'bc' ? 0 : bc) + (ask === 'abc' ? 0 : abc);
          const x = ask === 'abc' ? U - rest : rest - U;
          st.push({ text: 'Put in the numbers, with $x$ for the one asked about, and solve:', tex: U + ' = ' + a + ' + ' + b + ' + ' + c + ' - ' + term('ab', ab) + ' - ' + term('ac', ac) + ' - ' + term('bc', bc) + ' + ' + term('abc', abc) + ' \\quad\\Rightarrow\\quad x = ' + x });
          if (ask === 'abc') abc = x; else if (ask === 'ab') ab = x; else if (ask === 'ac') ac = x; else bc = x;
        }
        const abO = ab - abc, acO = ac - abc, bcO = bc - abc;
        st.push({ text: 'All three: ' + abc + ' students. They go in the middle.', tex: '|' + I(P, Q, R3) + '| = ' + abc });
        st.push({ text: 'Two subjects only: take the middle away from each overlap of two.', tex: '|' + I(P, Q) + '| - ' + abc + ' = ' + ab + ' - ' + abc + ' = ' + abO });
        st.push({ text: '', tex: '|' + I(P, R3) + '| - ' + abc + ' = ' + ac + ' - ' + abc + ' = ' + acO });
        st.push({ text: '', tex: '|' + I(Q, R3) + '| - ' + abc + ' = ' + bc + ' - ' + abc + ' = ' + bcO });
        const only = (k, total, x, y, nmT, L) => { const r = total - x - y - abc; st.push({ text: 'Only ' + nmT + ': take away the parts of its circle already filled.', tex: '|' + L + '\\text{ only}| = ' + total + ' - ' + x + ' - ' + y + ' - ' + abc + ' = ' + r }); return r; };
        let aO, bO, cO;
        const fillOthers = skip => { if (skip !== 'a') aO = only('a', a, abO, acO, nA, P); if (skip !== 'b') bO = only('b', b, abO, bcO, nB, Q); if (skip !== 'c') cO = only('c', c, acO, bcO, nC, R3); };
        if (['a', 'b', 'c'].includes(ask)) {
          fillOthers(ask);
          const U = n - none, others = (ask !== 'a' ? aO : 0) + (ask !== 'b' ? bO : 0) + (ask !== 'c' ? cO : 0) + abO + acO + bcO + abc;
          const x = U - others, L = { a: P, b: Q, c: R3 }[ask], nmT = { a: nA, b: nB, c: nC }[ask];
          st.push({ text: 'Everyone in the circles is $n$ minus the ' + none + ' outside; the region “only ' + nmT + '” is what remains after the six regions found:', tex: '|' + L + '\\text{ only}| = (' + n + ' - ' + none + ') - ' + others + ' = ' + x });
          if (ask === 'a') { aO = x; a = aO + abO + acO + abc; } else if (ask === 'b') { bO = x; b = bO + abO + bcO + abc; } else { cO = x; c = cO + acO + bcO + abc; }
          st.push({ text: 'All who take ' + nmT + ': the four regions of its circle.', tex: '|' + L + '| = ' + x + ' + ' + (ask === 'a' ? abO + ' + ' + acO : ask === 'b' ? abO + ' + ' + bcO : acO + ' + ' + bcO) + ' + ' + abc + ' = ' + (ask === 'a' ? a : ask === 'b' ? b : c) });
        } else fillOthers('');
        const union3 = aO + bO + cO + abO + acO + bcO + abc;
        if (ask === 'n' || ask === 'none' || !['a', 'b', 'c'].includes(ask)) {
          st.push({ text: 'Add the seven regions inside the circles:', tex: '|' + uT + '| = ' + [aO, bO, cO, abO, acO, bcO, abc].join(' + ') + ' = ' + union3 });
          if (ask === 'n') { n = union3 + none; st.push({ text: 'Add the ' + none + ' who take none:', tex: 'n = ' + union3 + ' + ' + none + ' = ' + n }); }
          else if (ask === 'none') { none = n - union3; st.push({ text: 'Everyone else takes none of the three:', tex: n + ' - ' + union3 + ' = ' + none }); }
        }
        const cnt = [none, aO, bO, abO, cO, acO, bcO, abc], bad = cnt.some(x => x < 0);
        const val = { n, none, a, b, c, ab, ac, bc, abc }[ask];
        const what = { n: 'Everyone in the class', none: 'Taking none of the three', a: 'Taking ' + nA, b: 'Taking ' + nB, c: 'Taking ' + nC, ab: 'Taking ' + nA + ' and ' + nB, ac: 'Taking ' + nA + ' and ' + nC, bc: 'Taking ' + nB + ' and ' + nC, abc: 'Taking all three' }[ask];
        const texOf = { n: 'n', none: '|(' + uT + ')^c|', a: '|' + P + '|', b: '|' + Q + '|', c: '|' + R3 + '|', ab: '|' + I(P, Q) + '|', ac: '|' + I(P, R3) + '|', bc: '|' + I(Q, R3) + '|', abc: '|' + I(P, Q, R3) + '|' }[ask];
        out.append(K.answer(what, texOf + ' = ' + val));
        if (bad) out.append(K.note(NOTE_NEG, 'warn'));
        const hiM = { n: [], none: [0], a: [1, 3, 5, 7], b: [2, 3, 6, 7], c: [4, 5, 6, 7], ab: [3, 7], ac: [5, 7], bc: [6, 7], abc: [7] }[ask];
        out.append(K.card('The Venn diagram, filled in', K.p((ask === 'n' ? 'All the regions together make the class.' : 'Shaded: the students asked about.') + ' Each number counts one region; the regions do not overlap.'),
          venn([short(nm('A'), 12), short(nm('B'), 12), short(nm('C'), 12)], m => ({ count: cnt[m], shade: hiM.includes(m), hi: hiM.includes(m) }), { u: 'Class: ' + n, outWord: 'none', label: 'Venn diagram of three subjects with the count in each region' })));
        out.append(K.card('Step by step', K.steps(st.filter(x => x.text || x.tex))));
        const sum = union3 + none, f3 = a + b + c - ab - ac - bc + abc;
        out.append(K.card('Check', K.steps([
          { text: 'The eight regions add up to the class:', tex: [aO, bO, cO, abO, acO, bcO, abc, none].join(' + ') + ' = ' + sum },
          { text: 'Inclusion–exclusion gives the same number inside the circles:', tex: a + ' + ' + b + ' + ' + c + ' - ' + ab + ' - ' + ac + ' - ' + bc + ' + ' + abc + ' = ' + f3 }]),
          K.note(sum === n && f3 === union3 && !bad ? 'Everything agrees: ' + sum + ' = n, and ' + f3 + ' inside the circles ✓' : bad ? 'A region is negative ✗' : 'The counts do not agree ✗', sum === n && f3 === union3 && !bad ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- relations */
    // ?X=0..9&by=rule&rule=a ≡ b (mod 5)&look=transitive   X = the set (1 to 12 elements, a list or a range such as 1..9);
    //   by = rule | pairs; rule = a condition in a and b, such as a ≤ b, a | b (a divides b), a ≡ b (mod 5),
    //   a mod 5 = b mod 5, |a − b| = 2, gcd(a, b) = 1, b = a + 1 or a = b (a rule needs numbers in X);
    //   R (by=pairs) = the pairs, such as (1, 2), (2, 3) or Chennai → Madurai (words allowed);
    //   look = reflexive | symmetric | antisymmetric | transitive: the property the pictures pick out
    relations(el, query, ctx) {
      const LOOKS = [['reflexive', 'Reflexive: (a, a) for every a'], ['symmetric', 'Symmetric: (a, b) brings (b, a)'], ['antisymmetric', 'Antisymmetric: never both ways'], ['transitive', 'Transitive: a → b → c brings a → c']];
      const fix = v => { if (v.by !== 'pairs') v.by = 'rule'; if (!LOOKS.some(([k]) => k === v.look)) v.look = 'transitive'; };
      const t = topic(el, query, ctx, { X: '0..9', by: 'rule', rule: 'a ≡ b (mod 5)', R: '(1, 2), (2, 3), (1, 3)', look: 'transitive' }, fix);
      const { s, controls, out } = t;
      const warn = e => out.append(K.note(esc(e.message), 'warn'));
      t.start(() => controls.append(
        K.p('A relation on a set $X$ is a set of pairs $(a, b)$ from $X \\times X$: the pairs where $a$ is related to $b$ (lecture 1.9). Give it by a rule or by its pairs; each property is then checked pair by pair.'),
        K.text({ label: 'The set $X$', value: s.v.X, placeholder: '0..9   or   1, 2, 3, 4', help: 'At most 12 elements.', onChange: v => s.set({ X: v }) }),
        K.seg({ label: 'Give the relation by', options: [['rule', 'A rule'], ['pairs', 'Its pairs']], value: s.v.by, onChange: v => t.load({ by: v }) }),
        s.v.by === 'rule' ? K.text({ label: '$a$ is related to $b$ when', value: s.v.rule, placeholder: 'a ≤ b,  a | b,  a ≡ b (mod 5)', help: 'Use a and b: a ≤ b, a | b (a divides b), a ≡ b (mod 5), |a − b| = 2, gcd(a, b) = 1, b = a + 1.', onChange: v => s.set({ rule: v }) })
          : K.text({ label: 'The pairs of $R$', value: s.v.R, placeholder: '(1, 2), (2, 3)   or   1 → 2, 2 → 3', onChange: v => s.set({ R: v }) }),
        K.select({ label: 'Show in the pictures', options: LOOKS, value: s.v.look, onChange: v => s.set({ look: v }) }),
        tries([['Maths 1 Week 1: same remainder mod 5', { X: '0..9', by: 'rule', rule: 'a ≡ b (mod 5)', look: 'transitive' }, 'Lecture 1.9: 7 and 22 both leave remainder 2 when divided by 5; this relation splits the integers into 5 classes (here X = {0, …, 9})'],
          ['a divides b', { X: '1, 2, 3, 4, 6, 9, 12, 18, 36', by: 'rule', rule: 'a | b', look: 'transitive' }, 'Lecture 1.9: every number divides itself; 2 | 6 and 6 | 36 give 2 | 36 (here X = the factors of 36)'],
          ['a < b', { X: '1, 3, 10, 28', by: 'rule', rule: 'a < b', look: 'antisymmetric' }, 'Lecture 1.9: 3 < 10 and 10 < 28 give 3 < 28; a < b rules out b < a'],
          ['|a − b| = 2', { X: '1..9', by: 'rule', rule: '|a - b| = 2', look: 'symmetric' }, 'Lecture 1.9: with (5, 7) comes (7, 5)'],
          ['gcd(a, b) = 1', { X: '1..6', by: 'rule', rule: 'gcd(a, b) = 1', look: 'symmetric' }, 'Lecture 1.9: pairs with no common divisor, as in reduced fractions'],
          ['b = a + 1', { X: '0..6', by: 'rule', rule: 'b = a + 1', look: 'transitive' }, 'Lecture 1.9: the pairs (0, 1), (1, 2), (2, 3), …'],
          ['a = b, the identity', { X: '0..4', by: 'rule', rule: 'a = b', look: 'reflexive' }, 'Lecture 1.9: the identity relation, only the pairs (a, a)'],
          ['Direct flights', { X: 'Chennai, Madurai, Salem, Bangalore, Delhi', by: 'pairs', R: 'Chennai → Madurai, Madurai → Salem, Salem → Chennai, Bangalore → Delhi, Delhi → Bangalore', look: 'symmetric' }, 'Lecture 1.11: no flight from a city to itself; Chennai → Madurai, but back only through Salem'],
          ['a ≤ b', { X: '1..5', by: 'rule', rule: 'a ≤ b', look: 'antisymmetric' }, 'Made up here: reflexive, antisymmetric and transitive']], t.load)), draw);
      function draw() {
        const notes = [];
        let X, Rm, ast = null;
        try {
          const L = parseList(s.v.X, 'X', 12);
          X = L.items;
          if (!X.length) throw new Error('Type at least one element in X.');
          if (L.dups.length) notes.push('$X$: ' + L.dups.map(esc).join(', ') + ' typed again; a set has no repeats.');
          Rm = X.map(() => X.map(() => false));
          if (s.v.by === 'rule') {
            if (X.some(x => !x.num)) throw new Error('A rule works on numbers. For words, give the pairs instead.');
            try { ast = parseRule(s.v.rule, ['a', 'b']); } catch (e) { throw new Error('Rule: ' + e.message); }
            if (!isCond(ast)) throw new Error('Rule: write a condition (true or false), such as a ≤ b.');
            X.forEach((x, i) => X.forEach((y, j) => { try { Rm[i][j] = boolV(evalRule(ast, { a: x.num, b: y.num })); } catch (e) { if (e instanceof NoOut) Rm[i][j] = false; else throw new Error('Rule: ' + e.message); } }));
          } else {
            const idx = new Map(X.map((x, i) => [x.key, i]));
            for (const [p, q] of parsePairs(s.v.R)) {
              const a = elem(p), b = elem(q), i = idx.get(a.key), j = idx.get(b.key);
              if (i === undefined || j === undefined) throw new Error('(' + a.label + ', ' + b.label + '): ' + (i === undefined ? a.label : b.label) + ' is not in X. A relation on X pairs elements of X only.');
              Rm[i][j] = true;
            }
          }
        } catch (e) { warn(e); return; }
        const n = X.length, R = (i, j) => Rm[i][j], lab = i => esc(X[i].label), pr = (i, j) => '(' + lab(i) + ', ' + lab(j) + ')', idx = X.map((_, i) => i);
        const pairs = [];
        idx.forEach(i => idx.forEach(j => { if (R(i, j)) pairs.push([i, j]); }));
        const miss = idx.filter(i => !R(i, i)), refl = !miss.length, irrefl = miss.length === n;
        const symBad = pairs.filter(([i, j]) => i !== j && !R(j, i)), antiBad = pairs.filter(([i, j]) => i < j && R(j, i));
        let chains = 0, okChain = null;
        const transBad = [];
        let okChain2 = null;
        pairs.forEach(([i, j]) => idx.forEach(k => { if (!R(j, k)) return; chains++; if (!R(i, k)) transBad.push([i, j, k]); else if (i !== j && j !== k) { if (!okChain2 && i !== k) okChain2 = [i, j, k]; if (!okChain) okChain = [i, j, k]; } }));
        okChain = okChain2 || okChain;
        const sym = !symBad.length, anti = !antiBad.length, trans = !transBad.length, equiv = refl && sym && trans;
        const hasP = [refl && 'reflexive', sym && 'symmetric', anti && 'antisymmetric', trans && 'transitive'].filter(Boolean), lacks = [!refl && 'reflexive', !sym && 'symmetric', !anti && 'antisymmetric', !trans && 'transitive'].filter(Boolean);
        out.append(K.answer('Which properties does $R$ have?', hasP.length ? hasP.map(w => '\\text{' + w + '}').join(',\\ ') : '\\text{none of the four}',
          (lacks.length ? 'Not ' + lacks.join(', not ') + '. ' : '') + (equiv ? 'Reflexive, symmetric and transitive: an <b>equivalence relation</b>.' : 'Not an equivalence relation.')));
        notes.forEach(x => out.append(K.note(x)));
        const look = s.v.look, chain = transBad[0] || okChain;
        const mark = (i, j) => {
          if (look === 'reflexive') return i === j ? (R(i, i) ? 'ok' : 'miss') : '';
          if (look === 'symmetric') return i === j ? '' : R(i, j) ? (R(j, i) ? 'ok' : 'bad') : R(j, i) ? 'miss' : '';
          if (look === 'antisymmetric') return i !== j && R(i, j) ? (R(j, i) ? 'bad' : 'ok') : '';
          if (!chain) return '';
          const [a, b, d] = chain;
          if ((i === a && j === b) || (i === b && j === d)) return 'hi';
          return i === a && j === d ? (transBad.length ? 'miss' : 'ok') : '';
        };
        const caption = { reflexive: 'Green: the pairs $(a, a)$ that are there; dashed red: the ones that are missing.', symmetric: 'Green: pairs whose mirror $(b, a)$ is there too; red: pairs whose mirror is missing (dashed).', antisymmetric: 'Red: two different elements related both ways; green: one way only.',
          transitive: transBad.length ? 'Purple: $' + '(a, b)$ and $(b, c)$ are in $R$; dashed red: the shortcut $(a, c)$ is missing.' : chain ? 'Purple: a chain $(a, b)$, $(b, c)$; green: its shortcut $(a, c)$ is there, as transitivity asks.' : 'No chain $a \\to b \\to c$ with three different elements to show.' }[look];
        const grid = h('div', { class: 'lk-tbl' }, h('table', { class: 'lk-grid sl-rel' },
          h('thead', {}, h('tr', {}, h('th', { html: '<small>a ↓ &nbsp;b →</small>' }), X.map(x => h('th', { text: x.label })))),
          h('tbody', {}, X.map((x, i) => h('tr', {}, h('th', { text: x.label }), X.map((y, j) => { const m = mark(i, j); return h('td', { class: ((i === j ? 'dg ' : '') + m).trim(), title: '(' + x.label + ', ' + y.label + ')' + (R(i, j) ? ' is in R' : ' is not in R'), text: R(i, j) ? '●' : m === 'miss' ? '○' : '' }); }))))));
        out.append(K.card('The relation',
          K.p((ast ? '$R = \\{(a, b) \\in X \\times X \\mid ' + texRule(ast) + '\\}$, ' : '') + '$|R| = ' + pairs.length + '$ of the $' + n + ' \\times ' + n + ' = ' + n * n + '$ pairs: ' + (pairs.length ? '<span class="sl-set">{' + pairs.map(([i, j]) => pr(i, j)).join(', ') + '}</span>' : '$\\varnothing$') + '.'),
          K.p('As a table: a dot in row $a$, column $b$ means $(a, b) \\in R$; the diagonal holds the pairs $(a, a)$. ' + caption), grid,
          n <= 10 ? K.p('As arrows, $a \\to b$ for each pair (a small loop for $(a, a)$), coloured the same way:') : null,
          n <= 10 ? relPic(X, R, mark) : null));
        const lim = (list, f) => list.slice(0, 3).map(f).join('; ') + (list.length > 3 ? '; and ' + (list.length - 3) + ' more' : '');
        out.append(K.card('Property by property', K.steps([
          { text: '<b>Reflexive</b>: every element is related to itself, $(a, a) \\in R$ for every $a \\in X$ (lecture 1.9). ' + (refl ? OK + ' All ' + pl(n, 'pair') + ' $(a, a)$ are in $R$: the diagonal is full.' : NO + ' Missing: ' + lim(miss, i => pr(i, i)) + '.') + (irrefl ? ' In fact no element is related to itself: $R$ is <b>irreflexive</b>, like the direct flights of lecture 1.11.' : '') },
          { text: '<b>Symmetric</b>: whenever $(a, b) \\in R$, also $(b, a) \\in R$. ' + (sym ? OK + ' Every pair has its mirror: the table is the same on both sides of the diagonal.' : NO + ' ' + lim(symBad, ([i, j]) => pr(i, j) + ' is in $R$ but ' + pr(j, i) + ' is not') + '.') },
          { text: '<b>Antisymmetric</b>: two different elements are never related both ways, so if $a \\ne b$ and $(a, b) \\in R$ then $(b, a) \\notin R$ (lecture 1.9: $a < b$ rules out $b < a$). Pairs $(a, a)$ are allowed. ' + (anti ? OK + ' No two different elements go both ways.' : NO + ' ' + lim(antiBad, ([i, j]) => pr(i, j) + ' and ' + pr(j, i) + ' are both in $R$') + '.') },
          { text: '<b>Transitive</b>: whenever $(a, b) \\in R$ and $(b, c) \\in R$, also $(a, c) \\in R$ (lecture 1.9: $2 \\mid 6$ and $6 \\mid 36$ give $2 \\mid 36$). ' + (trans ? OK + ' All ' + pl(chains, 'chain') + ' $a \\to b \\to c$ checked: each has its shortcut $(a, c)$.' : NO + ' ' + lim(transBad, ([i, j, k]) => pr(i, j) + ' and ' + pr(j, k) + ' are in $R$, but ' + pr(i, k) + ' is not') + '.') }])));
        if (equiv) {
          const cls = [], seen = new Set();
          idx.forEach(i => { if (seen.has(i)) return; const c = idx.filter(j => R(i, j)); c.forEach(j => seen.add(j)); cls.push(c); });
          const count = new Array(n).fill(0);
          cls.forEach(c => c.forEach(j => count[j]++));
          const okP = count.every(x => x === 1);
          out.append(K.card('Equivalence classes', K.p('An equivalence relation splits $X$ into classes. The class of $a$ is $[a] = \\{b \\in X \\mid (a, b) \\in R\\}$: the elements related to $a$ (lecture 1.9). Inside a class all elements are related to each other; across classes none are.'),
            h('div', { class: 'sl-classes' }, cls.map(c => h('span', { class: 'sl-class', html: '<b>[' + lab(c[0]) + ']</b>' + setH(c.map(j => X[j])) }))),
            K.steps([{ text: 'The ' + pl(cls.length, 'class', 'classes') + ' form a <b>partition</b> of $X$: they do not overlap, and together they hold every element once.', tex: cls.map(c => c.length).join(' + ') + ' = ' + n + ' = |X|' }]),
            K.note(okP ? 'Each element is in exactly one class ✓' : 'The classes overlap ✗', okP ? 'good' : 'warn')));
        } else out.append(K.card('Equivalence classes', K.p('An equivalence relation must be reflexive, symmetric and transitive (lecture 1.9). This one is not ' + lacks.filter(w => w !== 'antisymmetric').join(' and not ') + ', so it does not split $X$ into classes.')));
      }
    },

    /* ---------------------------------------------------------------- functions */
    // ?mode=finite&X=-3..3&Y=0..9&by=rule&rule=x^2   mode = finite (small sets; the default) | real (rules on intervals of ℝ).
    //   finite: X = the domain and Y = the codomain (lists of at most 12 elements, or ranges such as 0..9); by = rule | arrows;
    //     rule = a formula in x such as x^2, 2x + 1, x mod 3, sqrt(x), |x| (X must hold numbers);
    //     f (by=arrows) = the arrows, such as 1 → a, 2 → b or (1, a), (2, b) (an input may get two arrows, or none);
    //   real: fam = line | square | cube | cubic | sqrt | pm, for a x + c, a x² + c, a x³ + c, x³ − 3x² + 5, a√x + c, ±√x;
    //     a, c = the numbers in the rule (2, −1/2, 0.5); dom, cod = the domain and the codomain, one interval each, such as
    //     R, [0, inf) or (-2, 3]
    functions(el, query, ctx) {
      const ARROWS = { X: '1, 2, 3, 4', Y: 'a, b, c', f: '1 → a, 2 → b, 3 → c, 4 → c' }, RULE = { X: '-3..3', Y: '0..9', rule: 'x^2' };
      const fix = v => {
        if (v.mode !== 'real') v.mode = 'finite';
        if (v.by !== 'arrows') v.by = 'rule';
        if (v.by === 'arrows' && v.X === RULE.X && v.Y === RULE.Y && v.f === ARROWS.f) { v.X = ARROWS.X; v.Y = ARROWS.Y; }   // ?by=arrows alone
        if (!FAMS.some(([k]) => k === v.fam)) v.fam = 'square';
      };
      const t = topic(el, query, ctx, Object.assign({ mode: 'finite', by: 'rule', f: ARROWS.f, fam: 'square', a: '1', c: '0', dom: 'R', cod: 'R' }, RULE), fix);
      const { s, controls, out } = t;
      const warn = e => out.append(K.note(esc(e.message), 'warn'));
      t.start(() => {
        const m = s.v.mode, kids = [
          K.p('A function $f: X \\to Y$ turns each input in the domain $X$ into exactly one output in the codomain $Y$ (lecture 1.10). Is it one-to-one (different inputs, different outputs)? Onto (every element of $Y$ reached)?'),
          K.seg({ label: 'Work with', options: [['finite', 'Small sets'], ['real', 'Real numbers']], value: m, onChange: v => t.load({ mode: v }) })];
        if (m === 'finite') kids.push(
          K.text({ label: 'Domain $X$', value: s.v.X, placeholder: '-3..3   or   1, 2, 3', help: 'At most 12 elements.', onChange: v => s.set({ X: v }) }),
          K.text({ label: 'Codomain $Y$', value: s.v.Y, placeholder: '0..9   or   a, b, c', onChange: v => s.set({ Y: v }) }),
          K.seg({ label: 'Give $f$ by', options: [['rule', 'A rule'], ['arrows', 'Arrows']], value: s.v.by, onChange: v => t.load(Object.assign({ by: v }, v === 'arrows' ? ARROWS : RULE)) }),
          s.v.by === 'rule' ? K.text({ label: 'Rule: $f(x) =$', value: s.v.rule, placeholder: 'x^2,  2x + 1,  x mod 3,  sqrt(x)', onChange: v => s.set({ rule: v }) })
            : K.text({ label: 'Arrows', value: s.v.f, placeholder: '1 → a, 2 → b, 3 → c', help: 'Write x → y (or x -> y, or (x, y)). Give an input two arrows, or none, to see what goes wrong.', onChange: v => s.set({ f: v }) }),
          tries([['Maths 1 Week 1: x² on −3 to 3', { mode: 'finite', by: 'rule', X: '-3..3', Y: '0..9', rule: 'x^2' }, 'Lecture 1.10: 2² = (−2)², so the square function is not one-to-one; 2, 3, 5, … are never reached'],
            ['x² on {0, 1, 2, 3}', { mode: 'finite', by: 'rule', X: '0, 1, 2, 3', Y: '0, 1, 4, 9', rule: 'x^2' }, 'Made up here: on these sets x² is a bijection, with inverse √y'],
            ['2x + 1', { mode: 'finite', by: 'rule', X: '0..4', Y: '1, 3, 5, 7, 9', rule: '2x + 1' }, 'A line: one-to-one; here also onto'],
            ['x mod 3', { mode: 'finite', by: 'rule', X: '0..8', Y: '0, 1, 2', rule: 'x mod 3' }, 'Made up here: onto, but three inputs share each output'],
            ['√x on {0, 1, 4, 9}', { mode: 'finite', by: 'rule', X: '0, 1, 4, 9', Y: '0..3', rule: 'sqrt(x)' }, 'Lecture 1.10: by convention √x is the positive square root'],
            ['√x when x = −1', { mode: 'finite', by: 'rule', X: '-1, 0, 1, 4', Y: '0..2', rule: 'sqrt(x)' }, 'Lecture 1.10: a negative number has no real square root, so −1 gets no output'],
            ['An output outside Y', { mode: 'finite', by: 'rule', X: '0..3', Y: '0..5', rule: 'x^2' }, 'Made up here: 3² = 9 is not in Y'],
            ['Two arrows from one input', { mode: 'finite', by: 'arrows', X: '1, 2, 3, 4', Y: 'a, b, c', f: '1 → a, 1 → b, 2 → c, 3 → c' }, 'Made up here: 1 has two outputs and 4 has none'],
            ['Arrows: a bijection', { mode: 'finite', by: 'arrows', X: '1, 2, 3', Y: 'a, b, c', f: '1 → b, 2 → c, 3 → a' }, 'Made up here: each element of Y is hit exactly once']], t.load));
        else {
          const hasP = s.v.fam !== 'cubic' && s.v.fam !== 'pm';
          kids.push(K.select({ label: 'Rule $f(x)$', options: FAMS, value: s.v.fam, onChange: v => t.load({ fam: v }) }));
          if (hasP) kids.push(K.text({ label: 'The number $a$', value: s.v.a, placeholder: '1,  −2,  1/2,  3.5', onChange: v => s.set({ a: v }) }), K.text({ label: 'The number $c$', value: s.v.c, placeholder: '0,  1,  5.7', onChange: v => s.set({ c: v }) }));
          kids.push(K.text({ label: 'Domain', value: s.v.dom, placeholder: 'R,  [0, inf),  [-2, 3]', help: 'One interval: R for all real numbers, inf for ∞.', onChange: v => s.set({ dom: v }) }),
            K.text({ label: 'Codomain', value: s.v.cod, placeholder: 'R,  [0, inf)', onChange: v => s.set({ cod: v }) }),
            tries([['Maths 1 Week 1: x² on ℝ', { fam: 'square', a: '1', c: '0', dom: 'R', cod: 'R' }, 'Lecture 1.10: x² is neither one-to-one nor onto ℝ; its range is [0, ∞)'],
              ['x² on [0, ∞) to [0, ∞)', { fam: 'square', a: '1', c: '0', dom: '[0, inf)', cod: '[0, inf)' }, 'Made up here: cut down the domain and codomain to get a bijection, with inverse √y'],
              ['3.5x + 5.7', { fam: 'line', a: '3.5', c: '5.7', dom: 'R', cod: 'R' }, 'Lecture 1.10: a line is one-to-one and onto'],
              ['2x + 1', { fam: 'line', a: '2', c: '1', dom: 'R', cod: 'R' }],
              ['5x² + 3', { fam: 'square', a: '5', c: '3', dom: 'R', cod: 'R' }, 'Lecture 1.10: it only takes values 3 and above, so it is not onto ℝ'],
              ['x³', { fam: 'cube', a: '1', c: '0', dom: 'R', cod: 'R' }, 'A bijection of ℝ, with inverse ∛y'],
              ['x³ − 3x² + 5', { fam: 'cubic', dom: 'R', cod: 'R' }, 'Lecture 1.12: it turns at x = 0 and x = 2, so it is not one-to-one; its range is all of ℝ'],
              ['7√x', { fam: 'sqrt', a: '7', c: '0', dom: '[0, inf)', cod: 'R' }, 'Lecture 1.10: never negative, so not onto ℝ'],
              ['√x on ℝ', { fam: 'sqrt', a: '1', c: '0', dom: 'R', cod: 'R' }, 'Lecture 1.10: negative numbers have no real square root, so this is not a function on ℝ'],
              ['±√x', { fam: 'pm', dom: '[0, inf)', cod: 'R' }, 'Lecture 1.10: taking both square roots gives two outputs, so it is not a function']], t.load));
        }
        controls.append(...kids);
      }, draw);
      function draw() { if (s.v.mode === 'real') { DISP.dec = /\./.test([s.v.a, s.v.c, s.v.dom, s.v.cod].join(' ')); try { drawReal(); } finally { DISP.dec = false; } } else drawFinite(); }

      function drawFinite() {
        let X, Y, ast = null;
        const outs = [];
        try {
          X = parseList(s.v.X, 'X (the domain)', 12).items;
          Y = parseList(s.v.Y, 'Y (the codomain)', 12).items;
          if (!X.length) throw new Error('Type at least one element in the domain X.');
          X.forEach(() => outs.push([]));
          if (s.v.by === 'rule') {
            if (X.some(x => !x.num)) throw new Error('A rule works on numbers. For words, draw arrows instead.');
            try { ast = parseRule(s.v.rule, ['x']); } catch (e) { throw new Error('Rule: ' + e.message); }
            if (isCond(ast)) throw new Error('Rule: f(x) must be a number, such as x^2 + 1, not a condition.');
            X.forEach((x, i) => {
              let v;
              try { v = evalRule(ast, { x: x.num }); } catch (e) { if (e instanceof NoOut) { outs[i].why = e.message; return; } throw new Error('Rule: ' + e.message); }
              if (isF(v)) { const key = 'n' + v.str(); outs[i].push({ j: Y.findIndex(y => y.key === key), label: fH(v) }); }
              else outs[i].push({ j: -1, label: '≈ ' + fmt(v.x), irr: true });
            });
          } else {
            const idx = new Map(X.map((x, i) => [x.key, i])), idy = new Map(Y.map((y, j) => [y.key, j]));
            for (const [p, q] of parsePairs(s.v.f)) {
              const a = elem(p), b = elem(q), i = idx.get(a.key);
              if (i === undefined) throw new Error('The arrow ' + a.label + ' → ' + b.label + ' starts outside the domain: ' + a.label + ' is not in X.');
              const j = idy.has(b.key) ? idy.get(b.key) : -1;
              if (!outs[i].some(o => o.j === j && o.label === b.label)) outs[i].push({ j, label: b.label });
            }
          }
        } catch (e) { warn(e); return; }
        const idx = X.map((_, i) => i), none = idx.filter(i => !outs[i].length), multi = idx.filter(i => outs[i].length > 1), away = idx.filter(i => outs[i].length === 1 && outs[i][0].j < 0);
        const fT = ast ? 'f(x) = ' + texRule(ast) : 'f';
        if (none.length || multi.length || away.length) {
          out.append(K.answer('Is $' + fT + '$ a function from $X$ to $Y$?', '\\text{No, not a function from } X \\text{ to } Y', [none.length && 'An input has no output.', multi.length && 'An input has two outputs.', away.length && 'An output lies outside $Y$.'].filter(Boolean).join(' ')));
          const reasons = [];
          none.forEach(i => reasons.push({ text: NO + ' ' + esc(X[i].label) + ' has no output: ' + (outs[i].why ? esc(outs[i].why) + (/square root/.test(outs[i].why) ? ' (lecture 1.10: √x is only defined for x ≥ 0)' : '') : 'no arrow starts at it') + '.' }));
          multi.forEach(i => reasons.push({ text: NO + ' ' + esc(X[i].label) + ' has ' + outs[i].length + ' outputs, ' + outs[i].map(o => esc(o.label)).join(' and ') + '. A rule must leave no doubt about the output (lecture 1.10: taking both roots ±√x is not a function).' }));
          away.forEach(i => reasons.push({ text: NO + ' $f$ sends ' + esc(X[i].label) + ' to ' + esc(outs[i][0].label) + (outs[i][0].irr ? ' (an irrational number)' : '') + ', which is not in the codomain $Y$.' }));
          const arrows = [];
          idx.forEach(i => outs[i].forEach(o => arrows.push({ i, j: o.j, cls: multi.includes(i) || o.j < 0 ? 'bad' : '', out: o.j < 0 ? o.label + ' ∉ Y' : null })));
          out.append(K.card('Why not', K.steps([{ text: 'A function needs, for every input in the domain: an output, only one output, and an output inside the codomain (lecture 1.10).' }].concat(reasons)),
            mapPic(X, Y, arrows, { xc: i => (none.includes(i) ? 'miss' : multi.includes(i) || away.includes(i) ? 'bad' : '') })));
          return;
        }
        const o = outs.map(L => L[0].j), rng = Y.map((_, j) => j).filter(j => o.includes(j)), missed = Y.map((_, j) => j).filter(j => !o.includes(j));
        let twin = null;
        for (let i = 0; i < X.length && !twin; i++) for (let k = i + 1; k < X.length; k++) if (o[i] === o[k]) { twin = [i, k]; break; }
        const inj = !twin, onto = !missed.length, bij = inj && onto, nX = X.length, nY = Y.length;
        out.append(K.answer('$' + (ast ? fT : 'f') + '$, from $X$ to $Y$', bij ? '\\text{a bijection: one-to-one and onto}' : inj ? '\\text{one-to-one, not onto}' : onto ? '\\text{onto, not one-to-one}' : '\\text{neither one-to-one nor onto}', 'Range $= f(X) =$ ' + setH(rng.map(j => Y[j])) + '.'));
        const tw = twin ? o[twin[0]] : -1;
        out.append(K.card('Arrows from $X$ to $Y$', K.p('Each input sends one arrow to its output.' + (twin ? ' Red: two inputs share an output.' : '') + (missed.length ? ' Dashed: elements of $Y$ that no arrow reaches.' : '')),
          mapPic(X, Y, idx.map(i => ({ i, j: o[i], cls: twin && o[i] === tw ? 'bad' : bij ? 'ok' : '' })), { xc: i => (twin && o[i] === tw ? 'bad' : ''), yc: j => (missed.includes(j) ? 'miss' : j === tw ? 'bad' : '') })));
        out.append(K.card('Domain, codomain, range', K.steps([
          { text: 'Domain, the inputs: $X =$ ' + setH(X) + ' (' + pl(nX, 'element') + ').' },
          { text: 'Codomain, where outputs may land: $Y =$ ' + setH(Y) + ' (' + pl(nY, 'element') + ').' },
          { text: 'Range, the outputs actually taken: $f(X) = \\{f(x) \\mid x \\in X\\} =$ ' + setH(rng.map(j => Y[j])) + '. It is always part of the codomain (lecture 1.10).' }]),
          K.table(['$x$', '$f(x)$'], idx.map(i => [esc(X[i].label), esc(Y[o[i]].label)]))));
        out.append(K.card('One-to-one?', K.steps([
          { text: 'One-to-one (injective): different inputs always give different outputs, $x_1 \\ne x_2 \\Rightarrow f(x_1) \\ne f(x_2)$ (lecture 1.10).' },
          inj ? { text: OK + ' The ' + pl(nX, 'input') + ' give ' + pl(nX, 'different output') + ': no element of $Y$ gets two arrows.' }
            : { text: NO + ' ' + esc(X[twin[0]].label) + ' and ' + esc(X[twin[1]].label) + ' are different inputs with the same output, ' + esc(Y[tw].label) + (ast ? ' (lecture 1.10: 2² = (−2)²)' : '') + '.' + (nX > nY ? ' It could not be otherwise: ' + nX + ' inputs cannot have different outputs among only ' + nY + '.' : '') }])));
        out.append(K.card('Onto?', K.steps([
          { text: 'Onto (surjective): every element of $Y$ is the output of some input; the range is the whole codomain (lecture 1.10).' },
          onto ? { text: OK + ' Every element of $Y$ is reached: $f(X) = Y$.' }
            : { text: NO + ' ' + esc(Y[missed[0]].label) + ' is in $Y$ but no input reaches it' + (missed.length > 1 ? ' (nor ' + missed.slice(1, 4).map(j => esc(Y[j].label)).join(', ') + (missed.length > 4 ? ', …' : '') + ')' : '') + '.' + (nX < nY ? ' It could not be otherwise: ' + nX + ' inputs reach at most ' + nX + ' of the ' + nY + ' elements of $Y$.' : '') }])));
        if (bij) {
          const back = idx.every(i => o[i] >= 0) && new Set(o).size === nX;
          out.append(K.card('Bijection and inverse', K.p('A bijection pairs the elements of $X$ and $Y$ off one to one, so $|X| = |Y| = ' + nX + '$: like taking one marble from each of two sacks at a time until both are empty together (lecture 1.10). Turn every arrow round to get the inverse $f^{-1}: Y \\to X$:'),
            mapPic(Y, X, idx.map(i => ({ i: o[i], j: i, cls: 'ok' })), { left: 'Y', right: 'X' }),
            K.table(['$y$', '$f^{-1}(y)$'], Y.map((y, j) => [esc(y.label), esc(X[o.indexOf(j)].label)])),
            K.note(back ? 'Check: $f^{-1}(f(x)) = x$ for every $x$ in $X$ ✓' : 'Check failed ✗', back ? 'good' : 'warn')));
        } else out.append(K.card('Bijection and inverse', K.p('Not a bijection, so $f$ has no inverse: ' + [twin && '$f^{-1}$(' + esc(Y[tw].label) + ') would have to be both ' + esc(X[twin[0]].label) + ' and ' + esc(X[twin[1]].label), missed.length && '$f^{-1}$(' + esc(Y[missed[0]].label) + ') would have nothing to give back'].filter(Boolean).join('; ') + '.')));
      }

      function drawReal() {
        const fam = s.v.fam, hasP = fam !== 'cubic' && fam !== 'pm';
        let a = F(1), c = F(0), Dset, Yset;
        try {
          if (hasP) {
            try { a = F.parse(String(s.v.a).replace(/[−–]/g, '-')); } catch (e) { throw new Error('The number a: “' + String(s.v.a).slice(0, 12) + '” is not a number.'); }
            try { c = F.parse(String(s.v.c).replace(/[−–]/g, '-')); } catch (e) { throw new Error('The number c: “' + String(s.v.c).slice(0, 12) + '” is not a number.'); }
          }
          Dset = parseReals(s.v.dom, 'Domain');
          Yset = parseReals(s.v.cod, 'Codomain');
          if (Dset.length !== 1) throw new Error(Dset.length ? 'Domain: type one interval.' : 'Domain: it is empty.');
          if (Yset.length !== 1) throw new Error(Yset.length ? 'Codomain: type one interval.' : 'Codomain: it is empty.');
        } catch (e) { warn(e); return; }
        const p = Dset[0], Y = ivOf(Yset[0]), fl = famFl(fam, a, c), fT = famT(fam, a, c), dT = realsT(Dset), yT = realsT(Yset);
        const fx = 'f(x) = ' + fT, head = '$' + fx + '$ from $' + dT + '$ to $' + yT + '$';
        const SPAN = { line: 8, square: 6, cube: 4.4, cubic: 5, sqrt: 10, pm: 10 }[fam], MID = { cubic: 1, sqrt: 4, pm: 4 }[fam] || 0;
        const view = extra => {
          const lo = p.lo ? p.lo.num() : null, hi = p.hi ? p.hi.num() : null;
          let u, w;
          if (lo !== null && hi !== null) { const wd = Math.max(hi - lo, 0.5); u = lo - 0.25 * wd; w = hi + 0.25 * wd; }
          else if (lo !== null) { u = lo - 0.3 * SPAN; w = lo + SPAN; }
          else if (hi !== null) { u = hi - SPAN; w = hi + 0.3 * SPAN; }
          else { u = MID - SPAN / 2; w = MID + SPAN / 2; }
          extra.filter(Number.isFinite).forEach(z => { u = Math.min(u, z - 0.5); w = Math.max(w, z + 0.5); });
          return [u, w];
        };
        // not a function: inputs with no output, inputs with two outputs
        if (fam === 'sqrt' || fam === 'pm') {
          const neg = combine([Dset, [{ lo: null, loC: false, hi: F(0), hiC: false }]], (d, z) => d && z), pos = combine([Dset, [{ lo: F(0), loC: false, hi: null, hiC: false }]], (d, z) => d && z);
          const x0 = neg.length ? (holds(neg, F(-1)) ? F(-1) : pickIn(neg)) : null, x1 = fam === 'pm' && pos.length ? (holds(pos, F(4)) ? F(4) : holds(pos, F(1)) ? F(1) : pickIn(pos)) : null;
          if (x0 || x1) {
            const r1 = x1 && (sqrtF(x1) ? NT(sqrtF(x1)) : '\\sqrt{' + NT(x1) + '}');
            out.append(K.answer('Is ' + head + ' a function?', '\\text{No, not a function on } ' + dT, x0 ? 'The input ' + fH(x0) + ' has no output.' : 'The input ' + fH(x1) + ' has two outputs.'));
            const st = [{ text: 'A function needs exactly one output for every input in the domain (lecture 1.10).' }];
            if (x0) st.push({ text: NO + ' $x = ' + NT(x0) + '$ is in the domain, but no real number squared gives a negative number, so $\\sqrt{' + NT(x0) + '}$ does not exist: no output (lecture 1.10: √x is only defined for x ≥ 0).' });
            if (x1) st.push({ text: NO + ' $x = ' + NT(x1) + '$ has two square roots, $' + r1 + '$ and $-' + r1 + '$. Taking both gives two outputs for one input (lecture 1.10: by convention √x means the positive root).', tex: '(' + r1 + ')^2 = (-' + r1 + ')^2 = ' + NT(x1) });
            if (x1) st.push({ text: 'In the picture: the vertical line $x = ' + NT(x1) + '$ meets the graph twice. A graph is the graph of a function only when every vertical line through the domain meets it exactly once.' });
            out.append(K.card('Why not', K.steps(st), plotFn({ fl, pm: fam === 'pm', D: p, view: view([x0 && x0.num(), x1 && x1.num()]), cod: { lo: Y.lo.x, hi: Y.hi.x },
              vline: x1 ? { x: x1.num(), ys: [Math.sqrt(x1.num()), -Math.sqrt(x1.num())], label: 'x = ' + fH(x1) + ': two outputs' } : { x: x0.num(), ys: [], label: 'x = ' + fH(x0) + ': no output' } })));
            return;
          }
        }
        const r = famRange(fam, a, c, p), fits = subI(r, Y);
        const subT = x => { const P = x.cmp(0) < 0 || !x.isInt() ? '\\left(' + NT(x) + '\\right)' : NT(x), cf = a.eq(1) ? '' : a.eq(-1) ? '-' : NT(a) + ' \\cdot '; return fam === 'cubic' ? P + '^3 - 3 \\cdot ' + P + '^2 + 5' : fam === 'sqrt' ? cf + '\\sqrt{' + NT(x) + '}' + addT(c) : cf + P + (fam === 'square' ? '^2' : fam === 'cube' ? '^3' : '') + addT(c); };
        if (!fits) {
          const w = escapeWitness(fam, a, c, p, Y);
          out.append(K.answer('Is ' + head + ' a function?', '\\text{No: some outputs are not in the codomain}', w ? '$f(' + NT(w.x) + ') = ' + w.v.tex + '$ is not in $' + yT + '$.' : null));
          out.append(K.card('Why not', K.steps([{ text: 'The values of $f$ on the domain fill the range $' + ivT(r) + '$, and a function from the domain to $' + yT + '$ must send every input into $' + yT + '$ (lecture 1.10).' }].concat(w ? [{ text: NO + ' For example:', tex: 'f(' + NT(w.x) + ') = ' + subT(w.x) + ' = ' + w.v.tex + ' \\notin ' + yT }] : [])),
            plotFn({ fl, D: p, view: view(w ? [w.x.num()] : []), cod: { lo: Y.lo.x, hi: Y.hi.x }, rangeF: { lo: r.lo.x, hi: r.hi.x, loC: r.loC, hiC: r.hiC }, lines: w ? [{ y: w.v.x, cls: 'bad', xs: [w.x.num()], label: 'outside the codomain' }] : [] }),
            K.note('Make the codomain bigger (R takes everything) or the domain smaller.')));
          return;
        }
        const single = p.lo && p.hi && p.lo.eq(p.hi), inj = r.constant ? !!single : !turns(fam, a).some(z => inside(p, z)), onto = subI(Y, r), bij = inj && onto;
        out.append(K.answer(head, bij ? '\\text{a bijection: one-to-one and onto}' : inj ? '\\text{one-to-one, not onto}' : onto ? '\\text{onto, not one-to-one}' : '\\text{neither one-to-one nor onto}', 'Range $= ' + ivT(r) + '$.'));
        // witnesses for the pictures and the steps
        let twins = null;
        if (!inj) {
          if (r.constant) { const x1 = niceIn(p), x2 = [x1.add(1), x1.sub(1), x1.add(F(1, 2)), x1.sub(F(1, 2))].find(z => holds([p], z)) || pickIn(combine([Dset, [{ lo: x1, loC: false, hi: x1, hiC: false }]], d => d)); twins = { x1, x2, y: vx(c), exact: true }; }
          else if (fam === 'square') { const k = twinsSquare(p); twins = { x1: k.neg(), x2: k, y: famAt(fam, a, c, k), exact: true }; }
          else {
            const pair = [[F(-1), F(2)], [F(0), F(3)]].find(([u, w]) => holds([p], u) && holds([p], w));
            if (pair) twins = { x1: pair[0], x2: pair[1], y: famAt(fam, a, c, pair[0]), exact: true };
            else { const z = turns(fam, a).find(q => inside(p, q)), nt = twinsNumeric(fl, p, z.num()); twins = { x1: nt.x1, x2: nt.x2, y: nt.y, exact: false }; }
          }
        }
        const miss = onto ? null : missWitness(r, Y), sample = inj ? niceIn(p) : null, sy = sample ? famAt(fam, a, c, sample) : null;
        const lines = [];
        if (twins) lines.push({ y: twins.exact ? twins.y.x : twins.y, cls: 'bad', xs: twins.exact ? [twins.x1.num(), twins.x2.num()] : [twins.x1, twins.x2], label: 'hits twice' });
        else if (sy) lines.push({ y: sy.x, cls: 'good', xs: [sample.num()], label: 'hits once' });
        if (miss) lines.push({ y: miss.x, cls: 'miss', xs: [], label: 'never reached' });
        out.append(K.card('The graph', K.p('Solid: $f$ on the domain (blue bar on the $x$-axis); dashed: where the rule goes on outside it. On the $y$-axis the grey band is the codomain and the purple bar the range. A function is one-to-one when every horizontal line meets the graph at most once, and onto when every horizontal line at a height in the codomain meets it at least once.'),
          plotFn({ fl, D: p, view: view(twins ? [twins.exact ? twins.x1.num() : twins.x1, twins.exact ? twins.x2.num() : twins.x2] : sample ? [sample.num()] : []), cod: { lo: Y.lo.x, hi: Y.hi.x }, rangeF: { lo: r.lo.x, hi: r.hi.x, loC: r.loC, hiC: r.hiC }, lines })));
        const rs = [];
        if (r.constant) rs.push({ text: '$a = 0$, so $f$ is the constant ' + fH(c) + ': every input gives ' + fH(c) + '.', tex: 'f(D) = \\{' + NT(c) + '\\}' });
        else {
          r.cands.forEach(k => {
            if (k.kind === 'end') rs.push({ text: 'At the ' + (k.at === p.lo ? 'left' : 'right') + ' end of the domain' + (k.att ? ':' : ', which is not included, so this value is only approached:'), tex: 'f(' + NT(k.at) + ') = ' + subT(k.at) + ' = ' + k.v.tex });
            else if (k.kind === 'lim') rs.push({ text: 'As $x \\to ' + (k.sg > 0 ? '\\infty' : '-\\infty') + '$, $f(x) \\to ' + k.v.tex + '$: there is no end on that side.' });
            else rs.push({ text: 'The graph turns round at $x = ' + NT(k.at) + '$, inside the domain:', tex: 'f(' + NT(k.at) + ') = ' + subT(k.at) + ' = ' + k.v.tex });
          });
          rs.push({ text: 'Between these points $f$ only rises or only falls, so the range runs from the smallest of these values to the largest; an end is included when some input reaches it.', tex: 'f(D) = ' + ivT(r) });
        }
        out.append(K.card('Domain, codomain, range', K.steps([{ text: 'Domain: the inputs, $D = ' + dT + '$. Codomain: where outputs may land, $Y = ' + yT + '$ (lecture 1.10).' }].concat(rs))));
        const neg = p.hi && p.hi.cmp(0) <= 0;
        const why = { line: 'For two inputs $x_1 \\ne x_2$: $f(x_1) - f(x_2) = ' + NT(a) + '(x_1 - x_2) \\ne 0$, because $a \\ne 0$. Different inputs, different outputs.', cube: '$x^3$ always increases: $x_1 < x_2$ gives $x_1^3 < x_2^3$; multiplying by $a \\ne 0$ and adding $c$ keeps different values different.', sqrt: '$\\sqrt{x}$ always increases on $x \\ge 0$: $x_1 < x_2$ gives $\\sqrt{x_1} < \\sqrt{x_2}$.', square: 'On this domain $x$ is never ' + (neg ? 'positive' : 'negative') + ', and there $x^2$ only ' + (neg ? 'falls' : 'rises') + ' as $x$ grows, so no two inputs share an output.', cubic: 'The graph turns only at $x = 0$ and $x = 2$, and neither is inside the domain, so on it $f$ only rises or only falls.' }[fam];
        out.append(K.card('One-to-one?', K.steps([
          { text: 'One-to-one: $x_1 \\ne x_2 \\Rightarrow f(x_1) \\ne f(x_2)$ (lecture 1.10). On a graph: no horizontal line meets it twice.' },
          inj ? { text: OK + ' ' + (single ? 'The domain is a single number, so there are no two inputs to compare.' : why) }
            : twins.exact ? { text: NO + (r.constant ? ' A constant gives every input the same output.' : fam === 'square' ? ' The graph turns at $x = 0$, inside the domain, and $(-x)^2 = x^2$ (lecture 1.10):' : ' The graph turns round inside the domain (lecture 1.12: at $x = 0$ and $x = 2$), so a horizontal line can meet it twice:'), tex: 'f(' + NT(twins.x1) + ') = f(' + NT(twins.x2) + ') = ' + twins.y.tex }
              : { text: NO + ' The graph turns round inside the domain, so a horizontal line near the turning value meets it twice:', tex: 'f(' + fmt(twins.x1) + ') \\approx f(' + fmt(twins.x2) + ') \\approx ' + fmt(twins.y) }])));
        out.append(K.card('Onto?', K.steps([
          { text: 'Onto: every $y$ in the codomain is $f(x)$ for some input; the range is the whole codomain (lecture 1.10).', tex: 'f(D) = ' + ivT(r) + ', \\quad Y = ' + yT },
          onto ? { text: OK + ' The range is the whole codomain: every horizontal line at a height in $Y$ meets the graph.' }
            : { text: NO + ' ' + (miss ? '$y = ' + miss.tex + '$ is in the codomain but not in the range: no input gives it' : 'The range is smaller than the codomain') + (fam === 'square' && a.cmp(0) > 0 ? ' (lecture 1.10: $5x^2 + 3$ never goes below 3).' : '.') }])));
        if (bij) {
          const inv = r.constant ? null : inverseOf(fam, a, c, p);
          if (inv) {
            const x0 = fam === 'sqrt' ? niceIn(p, [F(4), F(1), F(9), F(0)]) : niceIn(p), y0 = famAt(fam, a, c, x0), back = y0.f ? inv.at(y0.f) : null, ok = !!back && back.eq(x0);
            out.append(K.card('Bijection and inverse', K.p('$f$ is one-to-one and onto, so every $y$ in $' + yT + '$ comes from exactly one $x$, and $f^{-1}$ sends it back (lecture 1.10).'),
              K.steps(inv.st.concat([{ text: 'So the inverse, from $' + yT + '$ back to $' + dT + '$, is', tex: 'f^{-1}(y) = ' + inv.inv }, { text: 'Check with $x = ' + NT(x0) + '$:', tex: 'f(' + NT(x0) + ') = ' + y0.tex + ', \\quad f^{-1}(' + y0.tex + ') = ' + (back ? NT(back) : '?') }])),
              K.note(ok ? 'Back to ' + fH(x0) + ' ✓' : 'Check failed ✗', ok ? 'good' : 'warn')));
          } else out.append(K.card('Bijection and inverse', K.p(r.constant ? 'The domain is a single number, so $f^{-1}$ simply sends ' + fH(c) + ' back to it.' : '$f$ is one-to-one and onto here, so it has an inverse; its graph is the mirror image of this graph in the line $y = x$. There is no short formula for it.')));
        } else out.append(K.card('Bijection and inverse', K.p('Not a bijection, so $f$ has no inverse' + (inj ? ' from $' + yT + '$: some values have no input to go back to. Cutting the codomain down to the range, $' + ivT(r) + '$, would make it one.' : onto ? ': some outputs come from two inputs. Cutting the domain down to where $f$ only rises (or only falls) would make it one-to-one.' : ': some outputs come from two inputs, and some values are never reached.'))));
      }
    },
  });
})();
