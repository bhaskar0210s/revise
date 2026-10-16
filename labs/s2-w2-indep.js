/* Playground lab (s2-w2-indep) — Independence lab, Statistics II, Week 2, lectures L2.1–L2.2 (and L2.10).
   Three tabs; every value is the learner's own and every panel redraws at once.
   1 · Two variables   a joint table → marginals (sums shown), product table (products shown), cell-by-cell ✓/✗,
                       verdict + first counterexample, zero-cell shortcut (the L1.4 IPL model: f(12, 2) = 0),
                       f_{Y|X=t} against f_Y with its CDF, mosaic, "make it independent with these marginals",
                       PMF/CDF of both marginals, and (L2.10) the table of U = g(X), V = h(Y) for typed g and h
                       with the same product test.
   2 · Many variables  a joint PMF of three variables typed as tuples → every pair, then the full product,
                       tuple by tuple (including the tuples that are missing, probability 0).
   3 · i.i.d.          one PMF and n → all / none / exactly k / at least one draw in A (formula, then numbers),
                       the count N ~ Binomial(n, P(A)) with PMF/CDF, "two values both appear", a simulation,
                       and the memoryless property of the geometric with the learner's p, m, n.
   Exact arithmetic: Lab.F for the tables; BigInt fractions for the powers in tab 3 (exact for any n). */
(function () {
  'use strict';
  const { h, F, P, W } = Lab;
  const K = Lab.play;
  const STORE = 'lab:s2-indep';

  /* ================================================================ helpers */
  const tex = (s, display) => Lab.tex(s, display);
  const tn = n => String(n).replace(/(\d+)$/, '_{$1}');
  const pt = f => K.pTex(f);
  /** compact fraction for small print: 5/8 */
  const sl = f => (f instanceof Lab.Frac && !f.approx ? f.toString() : pt(f));
  const lcm = (a, b) => (a / Lab.math.gcd(a, b)) * b;
  /** TeX for a value label: numbers stay numbers, any other label is shown as plain text. */
  function vt(v) {
    if (typeof v === 'number') return Lab.fmtDec(v, 4);
    const s = String(v).replace(/[\\{}#$%&_^~]/g, '').trim();
    return '\\text{' + (s || '?') + '}';
  }
  const vplain = v => (typeof v === 'number' ? Lab.fmtVal(v) : String(v));
  /** a value as a chart label (W.bars / K.pmfChart put it inside TeX) */
  const vlab = v => (typeof v === 'number' ? v : vt(v));
  const mark = ok => (ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>');
  function div(cls, html) { const d = h('div', { class: cls }); if (html != null) d.innerHTML = html; return d; }
  function callout(kind, title, html) {
    const icon = { key: 'key', warn: 'alert', good: 'check', note: 'info' }[kind] || 'info';
    const box = h('div', { class: 'callout ' + kind }, h('div', { class: 'c-title', html: Lab.icon(icon) + '<span>' + title + '</span>' }), h('div', { class: 'c-body' }));
    box.lastChild.innerHTML = html;
    return box;
  }
  /** Lines of display maths / HTML, each scrolling sideways on its own when too long. */
  function lines(list, cls) {
    const box = div('t3-lines' + (cls ? ' ' + cls : ''));
    list.forEach(l => box.appendChild(div('t3-line', typeof l === 'string' ? tex(l) : l.html)));
    return box;
  }
  /** Sum of fractions as TeX: every term when there are few, grouped when there are many (5×1/20 + 5×0). */
  function sumTex(terms) {
    if (!terms.length) return '0';
    if (terms.length <= 10) return terms.map(pt).join('+');
    const groups = [];
    terms.forEach(t => { const g = groups.find(x => x.v.eq(t)); if (g) g.c++; else groups.push({ v: t, c: 1 }); });
    if (groups.length <= 4) return groups.map(g => (g.c === 1 ? pt(g.v) : g.c + '\\times ' + pt(g.v))).join('+');
    return terms.slice(0, 4).map(pt).join('+') + '+\\dots+' + pt(terms[terms.length - 1]);
  }
  /** a ≠ b, written over a common denominator when that shows the gap (1/2 vs 15/32 → 16/32 ≠ 15/32). */
  function neqTex(a, b) {
    if (a.approx || b.approx || a.isZero() || b.isZero() || a.d === b.d) return pt(a) + '\\ne ' + pt(b);
    const L = lcm(a.d, b.d);
    if (!Number.isSafeInteger(L) || L > 1e6) return pt(a) + '\\ne ' + pt(b);
    const fa = '\\frac{' + a.n * (L / a.d) + '}{' + L + '}', fb = '\\frac{' + b.n * (L / b.d) + '}{' + L + '}';
    return pt(a) + (a.d === L ? '' : '=' + fa) + '\\ne ' + (b.d === L ? '' : fb + '=') + pt(b);
  }
  const resetRow = fn => h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', fn, 'btn ghost sm'));
  /** Show the chosen preset (and its source) in a K.presets menu without firing it. */
  function showPreset(menu, items, id) {
    const k = items.findIndex(it => it.id === id);
    menu.select.value = k >= 0 ? String(k) : '';
    const hint = menu.querySelector('.pl-hint');
    if (hint) Lab.setHTML(hint, k >= 0 && items[k].source ? 'From: ' + items[k].source : '');
  }

  /**
   * A table drawn the lecture's way: X values across the top, Y values down the side.
   * o: xs, ys, cell(i, j) → {html, cls, title}, optional foot(i) / side(j) margins with footHead / sideHead / total.
   */
  function gridTable(o) {
    const t = h('table', { class: 'tbl t3-grid' + (o.cls ? ' ' + o.cls : '') });
    const hr = h('tr', {}, h('th', { class: 't3-corner', html: tex((o.yName || 'Y') + '\\backslash ' + (o.xName || 'X')) }));
    o.xs.forEach(x => hr.appendChild(h('th', { class: 't3-xh ' + (o.xCls || 'vx'), html: tex(vt(x)) })));
    if (o.side) hr.appendChild(h('th', { class: 't3-mh', html: o.sideHead }));
    t.appendChild(h('thead', {}, hr));
    const tb = h('tbody');
    o.ys.forEach((y, j) => {
      const tr = h('tr', {}, h('th', { class: 't3-yh ' + (o.yCls || 'vy'), html: tex(vt(y)) }));
      o.xs.forEach((_, i) => { const c = o.cell(i, j) || {}; tr.appendChild(h('td', { class: 't3-c' + (c.cls ? ' ' + c.cls : ''), html: c.html, title: c.title || null })); });
      if (o.side) tr.appendChild(h('td', { class: 't3-m', html: o.side(j) }));
      tb.appendChild(tr);
    });
    if (o.foot) {
      const tr = h('tr', { class: 't3-foot' }, h('th', { class: 't3-mh', html: o.footHead }));
      o.xs.forEach((_, i) => tr.appendChild(h('td', { class: 't3-m', html: o.foot(i) })));
      if (o.side) tr.appendChild(h('td', { class: 't3-m t3-tot', html: o.total || '' }));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap t3-wrap' }, t);
  }
  /** Sorted numeric distribution for K.cdfChart, or null when a label is not a number. */
  function cdfDist(vals, ps) {
    if (!vals.every(v => typeof v === 'number')) return null;
    const pairs = vals.map((v, k) => ({ v, p: ps[k] })).sort((a, b) => a.v - b.v);
    return { vals: pairs.map(x => x.v), p: pairs.map(x => x.p) };
  }

  /* --------------------------------------------- exact big fractions (BigInt) for powers */
  const bgcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { const t = a % b; a = b; b = t; } return a || 1n; };
  function Q(n, d) {
    let N = BigInt(n), D = d == null ? 1n : BigInt(d);
    if (D === 0n) throw new Error('Division by zero');
    if (D < 0n) { N = -N; D = -D; }
    const g = bgcd(N, D);
    return { n: N / g, d: D / g };
  }
  /** exact arithmetic (BigInt fractions) */
  const QX = {
    exact: true,
    zero: () => Q(0), one: () => Q(1), int: c => Q(c),
    add: (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d),
    sub: (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d),
    mul: (a, b) => Q(a.n * b.n, a.d * b.d),
    div: (a, b) => Q(a.n * b.d, a.d * b.n),
    pow(a, k) { let r = Q(1), b = a; while (k > 0) { if (k & 1) r = QX.mul(r, b); k >>= 1; if (k) b = QX.mul(b, b); } return r; },
    eq: (a, b) => a.n === b.n && a.d === b.d,
    isZero: a => a.n === 0n,
    choose(n, k) { if (k < 0 || k > n) return 0n; k = Math.min(k, n - k); let r = 1n; for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i); return r; },
    num(a) {
      if (a.n === 0n) return 0;
      const x = Number(a.n), y = Number(a.d);
      if (Number.isFinite(x) && Number.isFinite(y)) return x / y;
      const len = Math.max((a.n < 0n ? -a.n : a.n).toString().length, a.d.toString().length);
      const s = 10n ** BigInt(Math.max(0, len - 290));
      const y2 = Number(a.d / s);
      return y2 ? Number(a.n / s) / y2 : 0;
    },
    fromFrac(f) { if (f instanceof Lab.Frac) return f.approx ? null : Q(f.n, f.d); if (typeof f === 'number' && Number.isInteger(f)) return Q(f); return null; },
  };
  /** float arithmetic (for Poisson or inexact inputs) */
  const MF = {
    exact: false,
    zero: () => 0, one: () => 1, int: c => Number(c),
    add: (a, b) => a + b, sub: (a, b) => a - b, mul: (a, b) => a * b, div: (a, b) => a / b,
    pow: (a, k) => Math.pow(a, k), eq: (a, b) => Math.abs(a - b) < 1e-12, isZero: a => a === 0,
    choose: (n, k) => Lab.math.choose(n, k), num: a => a,
  };
  const grp = s => (s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '{,}') : s);
  /** exact TeX of a big fraction, or null when it has more than `max` digits */
  function qTex(a, max = 14) {
    const ns = (a.n < 0n ? -a.n : a.n).toString(), ds = a.d.toString();
    if (ns.length > max || ds.length > max) return null;
    const sg = a.n < 0n ? '-' : '';
    return a.d === 1n ? sg + grp(ns) : sg + '\\frac{' + grp(ns) + '}{' + grp(ds) + '}';
  }
  function decTex(v) {
    if (v === 0) return '0';
    if (!Number.isFinite(v)) return '\\text{too large}';
    if (Math.abs(v) >= 0.001) return Lab.fmtDec(v, 4);
    const [m, e] = v.toExponential(2).split('e');
    return m + '\\times 10^{' + Number(e) + '}';
  }
  /** the fraction has an exact decimal with at most 4 places (1/8 = 0.125), as K.pTexApprox decides "=" or "≈" */
  const exact4 = a => (a.n * 10000n) % a.d === 0n;
  const fexact4 = v => Number.isInteger(v) || Math.abs(v * 1e4 - Math.round(v * 1e4)) < 1e-9;
  /** "= exact = decimal" when the decimal is exact, "= exact ≈ decimal" when it is rounded, "≈ decimal" when the fraction is too long */
  function resTex(M, a) {
    const v = M.num(a);
    if (!M.exact) return fexact4(v) ? '=' + Lab.fmtDec(v, 4) : '\\approx ' + decTex(v);
    const t = qTex(a);
    if (a.d === 1n) return '=' + (t != null ? t : decTex(v));
    const dec = exact4(a) ? '=' + Lab.fmtDec(v, 4) : '\\approx ' + decTex(v);
    return t != null ? '=' + t + dec : dec;
  }
  /** the value as short TeX: an exact fraction when it is short, else a decimal */
  function numTex(M, a, max = 9) {
    if (M.exact) { const t = qTex(a, max); if (t != null) return t; }
    return decTex(M.num(a));
  }
  const nm = (M, a) => numTex(M, a);
  /** is the value shown exactly by numTex (a short fraction, or a decimal that is exact)? */
  const shown = (M, a) => (M.exact ? qTex(a, 9) != null || exact4(a) : fexact4(a));
  /** "=" when every value that follows is shown exactly, "≈" as soon as one of them is rounded */
  const rel = (M, ...vals) => (vals.every(a => shown(M, a)) ? '=' : '\\approx ');
  /** "= value" or "≈ value" */
  const eqn = (M, a) => rel(M, a) + numTex(M, a);
  /** the decimal alone, with ≈ when it is rounded */
  const decRel = (M, a) => { const v = M.num(a); return (M.exact ? exact4(a) : fexact4(v)) ? Lab.fmtDec(v, 4) : '\\approx ' + decTex(v); };
  /** a relative frequency count/runs with its decimal ("=" only when the decimal is exact) */
  const freqTex = (c, r) => '\\frac{' + c + '}{' + r + '}' + ((c * 10000) % r === 0 ? '=' : '\\approx ') + Lab.fmtDec(c / r, 4);
  /** C(n,k) worked out: = (n·(n−1)·…)/(k·…·1) = value, the short side of the cancellation */
  function binomTail(n, k) {
    const kk = Math.min(k, n - k), c = grp(String(QX.choose(n, k)));
    if (kk === 0) return '=1';
    if (kk > 5) return '=' + c;
    const top = [], bot = [];
    for (let i = 0; i < kk; i++) { top.push(n - i); bot.push(kk - i); }
    return '=\\frac{' + top.join('\\cdot ') + '}{' + bot.join('\\cdot ') + '}=' + c;
  }
  const par = t => (/^-?\d+$/.test(t) ? t : '\\left(' + t + '\\right)');
  /** Q → Lab.Frac when both parts are safe integers, else null */
  function toFrac(a) {
    const x = Number(a.n), y = Number(a.d);
    return Number.isSafeInteger(x) && Number.isSafeInteger(y) ? new Lab.Frac(x, y) : null;
  }

  /* ======================================================= 1 · TWO VARIABLES */
  const HALF = F(1, 2);
  const PARAMS = {
    x: {
      sym: 'x', start: '1/8', solve: F(1, 4), xs: [0, 1], ys: [0, 1], den: 48,
      rows: v => [[v, HALF.sub(v)], [HALF.sub(v), v]],
      tmpl: [['x', '\\tfrac12-x'], ['\\tfrac12-x', 'x']],
      why: () => 'Every row and every column adds to ' + tex('x+(\\tfrac12-x)=\\tfrac12') + ' whatever ' + tex('x') + ' is, so ' + tex('f_X(0)=f_X(1)=f_Y(0)=f_Y(1)=\\tfrac12') + '. Independence needs every cell to be ' + tex('\\tfrac12\\times\\tfrac12=\\tfrac14') + '. The cells holding ' + tex('x') + ' force ' + tex('x=\\tfrac14') + ', and then ' + tex('\\tfrac12-x=\\tfrac12-\\tfrac14=\\tfrac14') + ' too. Every other ' + tex('x') + ' has the same marginals but a dependent table.',
    },
    a: {
      sym: 'a', start: '1/12', solve: F(1, 6), xs: [0, 1], ys: [0, 1], den: 48,
      rows: v => [[F(1, 6), F(1, 3)], [v, HALF.sub(v)]],
      tmpl: [['\\tfrac16', '\\tfrac13'], ['a', '\\tfrac12-a']],
      why: () => 'Row ' + tex('Y=0') + ' gives ' + tex('f_Y(0)=\\tfrac16+\\tfrac13=\\tfrac12') + ', row ' + tex('Y=1') + ' gives ' + tex('f_Y(1)=a+(\\tfrac12-a)=\\tfrac12') + ', and column ' + tex('X=0') + ' gives ' + tex('f_X(0)=\\tfrac16+a') + '. Cell ' + tex('(0,0)') + ' needs ' + tex('\\tfrac16=f_X(0)\\,f_Y(0)=f_X(0)\\times\\tfrac12') + ', so ' + tex('f_X(0)=\\tfrac13') + ' and ' + tex('a=\\tfrac13-\\tfrac16=\\tfrac16') + '. At ' + tex('a=\\tfrac16') + ' all four cells pass.',
    },
  };
  function unitsMod4() {
    const J = P.joint(P.numbers(0, 99, 2), v => v % 10, v => v % 4);
    return { xs: J.xs, ys: J.ys, rows: J.ys.map((_, j) => J.xs.map((_, i) => J.p[i][j].toString())) };
  }
  /** L1.4 IPL over (≈ 21–32 min): wickets Y = 0, 1, 2 with 13/16, 1/8, 1/16; runs X | Y uniform on 7 values; in 112ths */
  function iplTable() {
    const xs = Lab.range(0, 12), ys = [0, 1, 2];
    const span = [[6, 12, '13/112'], [2, 8, '2/112'], [0, 6, '1/112']];
    return { xs, ys, rows: span.map(([a, b, v]) => xs.map(x => (x >= a && x <= b ? v : '0'))) };
  }
  /** two fair dice: every cell 1/36 */
  function diceTable() { const v = Lab.range(1, 6); return { xs: v, ys: v, rows: v.map(() => v.map(() => '1/36')) }; }
  /** the tag in an answer box: lecture example, this site's lesson, or an example of a lecture rule */
  const tagFor = pre => (pre.tag || (pre.lesson ? 'Lesson example' : 'Lecture example')) + ' · ';
  const NINTH = ['1/9', '1/9', '1/9'];
  const TWO = [
    { id: 't1', label: 'L2.1 table 1 — four quarters', source: 'L2.1 slides, table 1 (lecture ≈ 4:00): every cell 1/4, like two fair coin tosses.', xs: [0, 1], ys: [0, 1], rows: [['1/4', '1/4'], ['1/4', '1/4']] },
    { id: 't2', label: 'L2.1 table 2 — 1/2, 1/8, 1/4, 1/8', source: 'L2.1 slides, table 2 (≈ 5:48): f(0,0) = 1/2, f(0,1) = 1/8, f(1,0) = 1/4, f(1,1) = 1/8.', xs: [0, 1], ys: [0, 1], rows: [['1/2', '1/4'], ['1/8', '1/8']] },
    { id: 't3', label: 'L2.1 table 3 — a free number x (move it)', source: 'L2.1 slides, table 3 (≈ 7:00): cells x, 1/2 − x in the top row and 1/2 − x, x in the bottom row. Move x in step 2.', param: 'x' },
    { id: 't4', label: 'L2.1 table 4 — uniform 3×3, 1/9 each', source: 'L2.1 slides, table 4 (≈ 7:00): all nine cells 1/9.', xs: [0, 1, 2], ys: [0, 1, 2], rows: [NINTH, NINTH, NINTH] },
    { id: 't5', label: 'L2.1 table 5 — “messy” but independent', source: 'L2.1 slides, table 5 (≈ 8:00): rows 1/6, 1/12, 1/12 · 1/4, 1/8, 1/8 · 1/12, 1/24, 1/24.', xs: [0, 1, 2], ys: [0, 1, 2], rows: [['1/6', '1/12', '1/12'], ['1/4', '1/8', '1/8'], ['1/12', '1/24', '1/24']] },
    { id: 't6', label: 'L2.1 table 6 — a zero cell', source: 'L2.1 slides, table 6 (≈ 9:48): f(0,0) = 0 and every other cell 1/8.', xs: [0, 1, 2], ys: [0, 1, 2], rows: [['0', '1/8', '1/8'], ['1/8', '1/8', '1/8'], ['1/8', '1/8', '1/8']] },
    { id: 't7', label: 'L2.1 table 7 — “dangerously close”', source: 'L2.1 slides, table 7 (≈ 9:48), as corrected in the L2.1 lesson: table 5 with f(2,0) raised from 1/12 to 1/8 and f(0,2) lowered from 1/12 to 1/24.', xs: [0, 1, 2], ys: [0, 1, 2], rows: [['1/6', '1/12', '1/8'], ['1/4', '1/8', '1/8'], ['1/24', '1/24', '1/24']] },
    { id: 'ud', label: 'Units digit vs remainder mod 4 (00–99)', source: 'L1.1 example, tested in L2.1 (≈ 13:00): a number 00–99 chosen uniformly; X = units digit, Y = remainder mod 4. Each cell = (how many of the 100 numbers) / 100.', make: unitsMod4 },
    { id: 'pa', label: 'Practice — find a: the L2.1 lesson, “Your turn” (not a lecture slide)', lesson: true, source: 'The L2.1 lesson, “Your turn” card (practice, not from the slides): f(0,0) = 1/6, f(1,0) = 1/3, f(0,1) = a, f(1,1) = 1/2 − a.', param: 'a' },
    { id: 'ipl', label: 'L1.4 IPL model: runs X vs wickets Y (the L2.1 question)', tag: 'Lecture model (L1.4)', source: 'L1.4 (≈ 21–32 min): wickets Y with f_Y = 13/16, 1/8, 1/16; given Y = 0, 1, 2 the runs X are uniform on {6, …, 12}, {2, …, 8}, {0, …, 6}, so a cell is f_Y(y) × 1/7: 13/112, 2/112 or 1/112. L2.1 (≈ 15–17 min) asks if runs and wickets are independent (“mostly it looks like no”) and leaves it to data; in this model the zero cell f(12, 2) = 0 settles it.', make: iplTable, focus: [12, 2], focusWhy: '12 runs and 2 wickets in one over cannot happen in this model (with 2 wickets the runs stop at 6)' },
    { id: 'gh', label: 'Two dice: g(X) = X mod 2 and h(Y) = 1 if Y ≥ 5 (L2.10 rule; example chosen here)', tag: 'Example of the L2.10 rule', source: 'L2.10 (≈ 31 min): “if X and Y are independent … the functions will also be independent for any two functions g and h”. The lecture states it with letters; the dice and these g, h are ours. Two fair dice (every cell 1/36), U = X mod 2 and V = 1 if Y ≥ 5 (typed floor(y/5)): the cells are 1/3, 1/3, 1/6, 1/6 = (1/2)(2/3), (1/2)(1/3).', make: diceTable, fn: { g: 'mod(x, 2)', h: 'floor(y/5)' } },
  ];
  function presetTable(it, pv) {
    if (it.param) { const def = PARAMS[it.param]; return { xs: def.xs, ys: def.ys, rows: def.rows(F(pv || def.start)) }; }
    return it.make ? it.make() : it;
  }
  function sameTable(dta, g) {
    if (dta.xs.length !== g.xs.length || dta.ys.length !== g.ys.length) return false;
    if (!dta.xs.every((x, i) => String(x) === String(g.xs[i])) || !dta.ys.every((y, j) => String(y) === String(g.ys[j]))) return false;
    return dta.rows.every((r, j) => r.every((c, i) => g.cells[j][i] != null && F(c).eq(g.cells[j][i])));
  }
  function analyse2(J) {
    const nx = J.xs.length, ny = J.ys.length;
    const mx = P.margX(J).p, my = P.margY(J).p;
    const prod = J.xs.map((_, i) => J.ys.map((_, j) => mx[i].mul(my[j])));
    const eq = J.xs.map((_, i) => J.ys.map((_, j) => J.p[i][j].eq(prod[i][j])));
    const bad = [], zeros = [], zeroTriv = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      if (!eq[i][j]) bad.push([i, j]);
      if (J.p[i][j].isZero()) (mx[i].isZero() || my[j].isZero() ? zeroTriv : zeros).push([i, j]);
    }
    return { J, nx, ny, N: nx * ny, mx, my, prod, eq, bad, zeros, zeroTriv, indep: !bad.length };
  }
  /** "f_X(0) = f_XY(0,0) + f_XY(0,1) = 1/2 + 1/8 = 5/8" */
  function margLine(f, v, terms, total, sigma) {
    const sym = terms.length <= 4 ? terms.map(t => t.sym).join('+') : sigma;
    return f + '(' + vt(v) + ')=' + sym + (terms.length > 1 ? '=' + sumTex(terms.map(t => t.p)) : '') + '=' + pt(total);
  }
  /** Probability box with a slider in steps of 1/den between lo and hi (fractions welcome). */
  function fracField({ label, value, lo, hi, den, onChange }) {
    const kmin = Math.ceil(Number(lo) * den), kmax = Math.floor(Number(hi) * den);
    const input = h('input', { class: 'field mono pl-num pl-prob', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': 'value' });
    const range = h('input', { class: 'slider pl-range', type: 'range', min: kmin, max: kmax, step: 1, value: Math.round(Number(F(value)) * den), 'aria-label': 'slider' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = div('pl-hint');
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), msg);
    const paint = k => { range.value = k; range.style.setProperty('--pct', ((k - kmin) / (kmax - kmin)) * 100 + '%'); };
    input.addEventListener('input', () => {
      const f = K.parseNum(input.value);
      if (f == null || f.cmp(lo) < 0 || f.cmp(hi) > 0) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Type a number from ' + lo + ' to ' + hi + ', for example 1/8 or 0.2.</span>'); return; }
      input.classList.remove('bad'); msg.innerHTML = ''; paint(Math.round(Number(f) * den)); onChange(f);
    });
    range.addEventListener('input', () => { const f = F(+range.value, den); input.value = f.toString(); input.classList.remove('bad'); msg.innerHTML = ''; paint(+range.value); onChange(f); });
    paint(Math.round(Number(F(value)) * den));
    return wrap;
  }

  function tabTwo(ctx) {
    const { side, main, st, save } = ctx;
    const S = st.two;
    const pan = {};
    let mo = null, lastD = null, flash = '', paramRead = null;
    let fnG = null, fnH = null;   // the last valid g(x) and h(y) (K.exprField gives a function of [value])

    /* ---- controls */
    side.appendChild(K.group('1 · Your joint table'));
    const grid = K.gridEditor({ label: 'Joint PMF ' + tex('f_{XY}(t_1,t_2)') + ': values of ' + tex('X') + ' across (blue), values of ' + tex('Y') + ' down (orange)', xs: S.xs, ys: S.ys, cells: S.rows, onChange: onGrid });
    side.appendChild(grid);
    side.appendChild(K.note('Type 1/8, 0.125 or 12.5%. The blue and orange labels are editable too.'));
    side.appendChild(h('div', { class: 'pl-chips' }, Lab.button('Make it independent (same marginals)', makeIndep, 'btn xs soft')));
    const menu = K.presets({ items: TWO, onPick: pickPreset });
    side.appendChild(menu);
    if (S.src) showPreset(menu, TWO, S.src);
    const paramBox = div('t3-param');
    side.appendChild(paramBox);
    // L2.10: functions of independent random variables stay independent
    side.appendChild(K.group('Functions g(X) and h(Y) — L2.10'));
    const fnToggle = K.toggle({ label: 'Also test ' + tex('U=g(X)') + ' and ' + tex('V=h(Y)'), value: S.fnOn, onChange: v => { S.fnOn = v; fnBox.hidden = !v; save(); if (lastD) drawFn(lastD); } });
    side.appendChild(fnToggle);
    const fnBox = div('t3-fnbox');
    fnBox.hidden = !S.fnOn;
    const gField = K.exprField({ label: tex('g(x)=') + ' (any function of ' + tex('x') + ')', value: S.g, vars: ['x'], onChange: (fn, src) => { if (fn) { fnG = fn; S.g = src; } afterFn(); } });
    const hField = K.exprField({ label: tex('h(y)=') + ' (any function of ' + tex('y') + ')', value: S.h, vars: ['y'], onChange: (fn, src) => { if (fn) { fnH = fn; S.h = src; } afterFn(); } });
    fnBox.append(gField, hField, K.note('The box has no ' + tex('\\ge') + ' sign. For “1 if ' + tex('y\\ge 5') + ', else 0” type <span class="t3-src">floor(y/5)</span> (right for whole numbers 0 to 9) or <span class="t3-src">max(sign(y-4), 0)</span> (any whole number). <span class="t3-src">mod(x, 2)</span> is the remainder after dividing by 2.'));
    side.appendChild(fnBox);
    side.appendChild(resetRow(() => ctx.restart('two')));

    /* ---- panels */
    const status = div('t3-status');
    status.hidden = true;
    pan.answer = K.answer();
    pan.joint = K.panel('Your joint table and its marginals', 'Add down a column for ' + tex('f_X(t_1)') + ' (bottom row); add along a row for ' + tex('f_Y(t_2)') + ' (right column).');
    pan.prod = K.panel('If independent: the product table ' + tex('f_X(t_1)\\,f_Y(t_2)'), 'Each cell is its column total times its row total, worked out below. It is the only table with your marginals in which ' + tex('X') + ' and ' + tex('Y') + ' are independent.');
    pan.cmp = K.panel('Side by side, cell by cell', 'In each cell: your ' + tex('f_{XY}(t_1,t_2)') + ' on the left, the product ' + tex('f_X(t_1)\\,f_Y(t_2)') + ' on the right. ✓ equal, ✗ different.');
    pan.cond = K.panel('Conditional of ' + tex('Y') + ' given ' + tex('X=t') + ', against ' + tex('f_Y'), tex('f_{Y\\mid X=t}(t_2)=f_{XY}(t,t_2)\\div f_X(t)') + '. Independent ⇔ it equals ' + tex('f_Y(t_2)') + ' for every ' + tex('t') + ' with ' + tex('f_X(t)>0') + ' (L2.1: conditional = marginal).');
    pan.mosaic = K.panel('The mosaic picture', 'Column widths are ' + tex('f_X(t)') + '; inside a column the pieces are ' + tex('f_{Y\\mid X=t}') + '. Independent ⇔ the horizontal cuts line up across all columns.');
    pan.marg = K.panel('PMF and CDF of each marginal');
    pan.steps = K.panel('How it is computed, with your numbers');
    pan.fn = K.panel('Functions of ' + tex('X') + ' and ' + tex('Y') + ': is ' + tex('U=g(X)') + ' independent of ' + tex('V=h(Y)') + '?', 'L2.10 (≈ 31 min): if ' + tex('X') + ' and ' + tex('Y') + ' are independent, then ' + tex('g(X)') + ' and ' + tex('h(Y)') + ' are independent for any ' + tex('g') + ' and ' + tex('h') + '. Here the table of ' + tex('(U,V)') + ' is built from yours, and the same cell-by-cell test runs on it.');
    pan.fn.classList.add('t3-fnpanel');
    pan.fn.hidden = !S.fnOn;
    const fnStatus = div('t3-status');
    fnStatus.hidden = true;
    const fnBody = div('t3-fnbody');
    pan.fn.body.append(fnStatus, fnBody);
    main.append(status, pan.answer, pan.joint, pan.prod, pan.cmp, pan.cond, pan.mosaic, pan.marg, pan.steps, pan.fn);
    buildParam();

    /* ---- input handling */
    function onGrid(g) {
      if (!g.ok) {
        status.hidden = false;
        Lab.setHTML(status, '<b>Not a joint PMF yet</b> — ' + (g.total ? 'its cells add up to ' + tex(pt(g.total)) + ', not 1 (press “Rescale to total 1” or edit a cell)' : 'a red box is not a number ≥ 0, or two labels are the same') + '. Everything below still shows your last valid table.');
        return;
      }
      status.hidden = true;
      if (S.param && !sameTable(presetTable({ param: S.param }, S.pv), g)) { S.param = null; buildParam(); }
      if (S.src && !sameTable(presetTable(TWO.find(p => p.id === S.src) || {}, S.pv), g)) { S.src = null; showPreset(menu, TWO, null); }
      S.xs = g.xs.slice(); S.ys = g.ys.slice(); S.rows = g.cells.map(r => r.map(f => f.toString()));
      save();
      draw(K.gridToJoint(g));
    }
    function pickPreset(it) {
      S.src = it.id;
      if (it.param) { S.param = it.param; S.pv = PARAMS[it.param].start; buildParam(); applyParam(); return; }
      S.param = null; buildParam();
      const d = presetTable(it);
      if (it.fn) {
        // the L2.10 example: switch the functions on and type the preset's g and h
        S.fnOn = true; fnToggle.querySelector('input').checked = true; fnBox.hidden = false;
        S.g = it.fn.g; S.h = it.fn.h;
        gField.set(it.fn.g); hField.set(it.fn.h);
      }
      grid.set(d.xs, d.ys, d.rows);
    }
    /** a new g or h: keep the preset tag only while its own g and h are typed, then redraw the functions panel */
    function afterFn() {
      const pre = S.src && TWO.find(p => p.id === S.src);
      if (pre && pre.fn && (S.g !== pre.fn.g || S.h !== pre.fn.h)) { S.src = null; showPreset(menu, TWO, null); if (lastD) drawAnswer(lastD); }
      save();
      if (lastD) drawFn(lastD);
    }
    function applyParam() {
      const def = PARAMS[S.param];
      grid.set(def.xs, def.ys, def.rows(F(S.pv)).map(r => r.map(f => f.toString())));
    }
    function buildParam() {
      Lab.clear(paramBox);
      paramRead = null;
      if (!S.param) return;
      const def = PARAMS[S.param];
      paramBox.appendChild(K.group('2 · Move the free number ' + def.sym));
      const t = h('table', { class: 'tbl t3-grid t3-tmpl' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 't3-corner', html: tex('Y\\backslash X') }), def.xs.map(x => h('th', { class: 'vx', html: tex(vt(x)) })))));
      t.appendChild(h('tbody', {}, def.ys.map((y, j) => h('tr', {}, h('th', { class: 'vy', html: tex(vt(y)) }), def.xs.map((_, i) => h('td', { html: tex(def.tmpl[j][i]) }))))));
      paramBox.appendChild(h('div', { class: 'tbl-wrap' }, t));
      paramBox.appendChild(fracField({ label: 'Your ' + tex(def.sym) + ' (from 0 to ' + tex('\\tfrac12') + '; the slider moves in steps of ' + tex('\\tfrac1{' + def.den + '}') + ')', value: S.pv, lo: F(0), hi: HALF, den: def.den, onChange: f => { S.pv = f.toString(); applyParam(); } }));
      paramRead = div('ws-readout t3-pread');
      paramBox.appendChild(paramRead);
      const det = h('details', { class: 't3-details' }, h('summary', { text: 'Stuck? Show the independent value and why' }), div('small', def.why()),
        h('div', { class: 'pl-chips' }, Lab.button('Set ' + def.sym + ' = ' + def.solve.toString(), () => { S.pv = def.solve.toString(); buildParam(); applyParam(); }, 'btn xs')));
      paramBox.appendChild(det);
      paintParam();
    }
    function paintParam() {
      if (!S.param || !paramRead || !lastD) return;
      const def = PARAMS[S.param], v = F(S.pv), d = lastD, J = d.J;
      let html = tex(def.sym + '=' + pt(v)) + ': ';
      if (d.indep) html += '<b class="cgood">independent</b> — every cell equals its column total × its row total.';
      else {
        const [i, j] = d.bad[0], x = vt(J.xs[i]), y = vt(J.ys[j]);
        html += '<b class="cbad">dependent</b> — cell ' + tex('(' + x + ',' + y + ')') + ' holds ' + tex(pt(J.p[i][j])) + ', but ' + tex('f_X(' + x + ')\\,f_Y(' + y + ')=' + pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j])) + '.';
      }
      html += '<div class="xs muted">Marginals now: ' + tex('f_X=(' + d.mx.map(pt).join(',\\ ') + ')') + ' and ' + tex('f_Y=(' + d.my.map(pt).join(',\\ ') + ')') + '.</div>';
      paramRead.innerHTML = html;
    }
    function makeIndep() {
      if (!lastD) return;
      const d = lastD, J = d.J;
      S.param = null; buildParam();
      S.src = null; showPreset(menu, TWO, null);
      flash = 'Done: every cell now holds ' + tex('f_X(t_1)\\times f_Y(t_2)') + ' from your old marginals. The marginals did not change, because each column still adds up to ' + tex('\\sum_{t_2}f_X(t_1)\\,f_Y(t_2)=f_X(t_1)\\times 1') + '.';
      grid.set(J.xs, J.ys, J.ys.map((_, j) => J.xs.map((_, i) => d.prod[i][j].toString())));
    }

    /* ---- drawing */
    function draw(J) {
      const d = analyse2(J);
      lastD = d;
      drawAnswer(d); drawJoint(d); drawProd(d); drawCompare(d); drawCond(d); drawMosaic(d); drawMarg(d); drawSteps(d); drawFn(d);
      paintParam();
    }
    function cellName(d, i, j) { return '(' + vt(d.J.xs[i]) + ',' + vt(d.J.ys[j]) + ')'; }
    const pre0 = () => (S.src && TWO.find(p => p.id === S.src)) || {};
    /** the cell a lecture preset points at (the IPL zero cell), when it fails; else null */
    function presetFocus(d) {
      const pre = S.src && TWO.find(p => p.id === S.src);
      if (!pre || !pre.focus) return null;
      const i = d.J.xs.findIndex(x => x === pre.focus[0]), j = d.J.ys.findIndex(y => y === pre.focus[1]);
      return i >= 0 && j >= 0 && !d.eq[i][j] ? [i, j] : null;
    }
    function drawAnswer(d) {
      const J = d.J, pre = S.src && TWO.find(p => p.id === S.src);
      const ev = (pre ? '<span class="t3-tag">' + tagFor(pre) + Lab.esc(pre.label) + '</span> ' : '') +
        'Your table: ' + tex('|T_X|=' + d.nx) + ' values of ' + tex('X') + ' and ' + tex('|T_Y|=' + d.ny) + ' values of ' + tex('Y') + ', so ' + tex(d.nx + '\\times ' + d.ny + '=' + d.N) + ' cells to test. ' +
        (d.indep ? '<b class="cgood">Independent.</b>' : '<b class="cbad">Dependent.</b>');
      let big, sub;
      if (d.indep) {
        big = '\\begin{aligned}f_{XY}(t_1,t_2)&=f_X(t_1)\\,f_Y(t_2)\\\\&\\text{in all ' + d.N + ' cells}\\end{aligned}';
        sub = 'Every cell equals (its column total) × (its row total). To prove independence all ' + d.N + ' cells had to pass, and they do.';
      } else {
        const focus = presetFocus(d);
        const [i, j] = focus || d.bad[0], x = vt(J.xs[i]), y = vt(J.ys[j]);
        big = '\\begin{aligned}f_{XY}(' + x + ',' + y + ')&=' + pt(J.p[i][j]) + '\\\\&\\ne ' + pt(d.prod[i][j]) + '=f_X(' + x + ')\\,f_Y(' + y + ')\\end{aligned}';
        sub = (focus
          ? 'The lecture’s impossible pair ' + tex('(t_1,t_2)=' + cellName(d, i, j)) + ': ' + pre.focusWhy + ', so the cell is ' + tex(pt(J.p[i][j])) + '. Yet ' + tex('f_X(' + x + ')=' + pt(d.mx[i]) + '>0') + ' and ' + tex('f_Y(' + y + ')=' + pt(d.my[j]) + '>0') + ', and ' + tex(pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j]) + '\\ne 0') + ' — the zero-cell test of L2.1.'
          : 'First failing cell, reading the rows from the top, each left to right: ' + tex('(t_1,t_2)=' + cellName(d, i, j)) + '. Your table holds ' + tex(pt(J.p[i][j])) + ' there, but its column total times its row total is ' + tex(pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j])) + '.') +
          ' ' + d.bad.length + ' of the ' + d.N + ' cells fail; one is already enough to prove dependence.';
      }
      K.setAnswer(pan.answer, { ev, big, sub });
    }
    function drawJoint(d) {
      const b = pan.joint.body, J = d.J;
      Lab.clear(b);
      b.appendChild(gridTable({
        xs: J.xs, ys: J.ys,
        cell: (i, j) => ({ html: tex(pt(J.p[i][j])), cls: J.p[i][j].isZero() ? 'zero' : '' }),
        footHead: tex('f_X(t_1)'), foot: i => tex(pt(d.mx[i])), sideHead: tex('f_Y(t_2)'), side: j => tex(pt(d.my[j])), total: tex('1'),
      }));
      const cell = (x, y) => 'f_{XY}(' + vt(x) + ',' + vt(y) + ')';
      const colL = J.xs.map((x, i) => margLine('f_X', x, J.ys.map((y, j) => ({ sym: cell(x, y), p: J.p[i][j] })), d.mx[i], '\\sum_{t_2}f_{XY}(' + vt(x) + ',t_2)'));
      const rowL = J.ys.map((y, j) => margLine('f_Y', y, J.xs.map((x, i) => ({ sym: cell(x, y), p: J.p[i][j] })), d.my[j], '\\sum_{t_1}f_{XY}(t_1,' + vt(y) + ')'));
      b.append(div('ws-title t3-gap', 'Columns → ' + tex('f_X') + ': keep ' + tex('t_1') + ', add over ' + tex('t_2')), lines(colL),
        div('ws-title t3-gap', 'Rows → ' + tex('f_Y') + ': keep ' + tex('t_2') + ', add over ' + tex('t_1')), lines(rowL));
      if (S.src === 'ud') {
        const nums = (a, c) => Lab.range(0, 99).filter(v => v % 10 === a && v % 4 === c).map(v => String(v).padStart(2, '0'));
        const n00 = nums(0, 0), n10 = nums(1, 0);
        b.appendChild(div('small t3-gap', '<b>Where the cells come from.</b> The 100 numbers 00–99 are equally likely, so a cell is (how many numbers have that units digit and that remainder mod 4) ÷ 100. Cell ' + tex('(0,0)') + ': ' + n00.join(', ') + ' — ' + n00.length + ' numbers, ' + tex('\\frac{' + n00.length + '}{100}=' + pt(F(n00.length, 100))) + '. Cell ' + tex('(1,0)') + ': ' + (n10.length ? n10.join(', ') : 'none — a number ending in 1 is odd, so it is never a multiple of 4') + ', ' + tex('\\frac{' + n10.length + '}{100}=' + pt(F(n10.length, 100))) + '.'));
      }
      if (S.src === 'ipl') {
        b.appendChild(div('small t3-gap', '<b>Where the cells come from (L1.4 ≈ 21–32 min).</b> Wickets first, then runs: ' + tex('f_{XY}(x,y)=f_Y(y)\\,f_{X\\mid Y=y}(x)') + ', and each ' + tex('X\\mid Y=y') + ' is uniform on 7 values, ' + tex('\\tfrac17') + ' each:' +
          '<div class="t3-line">' + tex('y=0:\\ \\tfrac{13}{16}\\cdot\\tfrac17=\\tfrac{13}{112}') + ' for ' + tex('x=6,\\dots,12') + '</div>' +
          '<div class="t3-line">' + tex('y=1:\\ \\tfrac18\\cdot\\tfrac17=\\tfrac{1}{56}=\\tfrac{2}{112}') + ' for ' + tex('x=2,\\dots,8') + '</div>' +
          '<div class="t3-line">' + tex('y=2:\\ \\tfrac1{16}\\cdot\\tfrac17=\\tfrac{1}{112}') + ' for ' + tex('x=0,\\dots,6') + '</div>' +
          'Every other cell is 0. The lecture checks two cells: ' + tex('f_{XY}(6,1)=\\tfrac1{56}') + ' and ' + tex('f_{XY}(8,2)=0') + ' (≈ 23 min), and gets ' + tex('f_X') + ' = 1, 1, 3, 3, 3, 3, 16, 15, 15, 13, 13, 13, 13 out of 112 (the bottom row above, where 16/112 shows as 1/7).'));
      }
      b.appendChild(div('small muted', 'Check: ' + tex('\\sum_{t_1}f_X(t_1)=' + sumTex(d.mx) + '=1') + ' and ' + tex('\\sum_{t_2}f_Y(t_2)=' + sumTex(d.my) + '=1') + '.'));
    }
    function drawProd(d) {
      const b = pan.prod.body, J = d.J;
      Lab.clear(b);
      b.appendChild(gridTable({
        xs: J.xs, ys: J.ys, cls: 't3-prodtab',
        cell: (i, j) => ({ html: '<span class="t3-fx">' + tex(sl(d.mx[i]) + '\\times ' + sl(d.my[j])) + '</span><span class="t3-eqv">' + tex('=' + pt(d.prod[i][j])) + '</span>' }),
        footHead: tex('f_X(t_1)'), foot: i => tex(pt(d.mx[i])), sideHead: tex('f_Y(t_2)'), side: j => tex(pt(d.my[j])), total: tex('1'),
      }));
      b.appendChild(div('small muted', 'Top line of a cell: ' + tex('f_X(t_1)\\times f_Y(t_2)') + ', the numbers from its column foot and its row end. Bottom line: the product.'));
    }
    function drawCompare(d) {
      const b = pan.cmp.body, J = d.J, focus = presetFocus(d), first = focus || d.bad[0];
      Lab.clear(b);
      b.appendChild(gridTable({
        xs: J.xs, ys: J.ys, cls: 't3-cmp',
        cell: (i, j) => {
          const ok = d.eq[i][j], isFirst = first && first[0] === i && first[1] === j;
          return {
            cls: (ok ? 'ok' : 'bad') + (isFirst ? ' first' : ''),
            title: 'f_XY = ' + Lab.fmt(J.p[i][j]) + ',  f_X·f_Y = ' + Lab.fmt(d.mx[i]) + ' × ' + Lab.fmt(d.my[j]) + ' = ' + Lab.fmt(d.prod[i][j]),
            html: '<span class="t3-pair">' + tex(pt(J.p[i][j]) + (ok ? '=' : '\\ne ') + pt(d.prod[i][j])) + '</span><span class="t3-mk">' + (ok ? '✓' : '✗') + '</span>',
          };
        },
      }));
      const pass = d.N - d.bad.length;
      b.appendChild(div('t3-verdict', (d.indep ? '<b class="cgood">Independent.</b> ' : '<b class="cbad">Dependent.</b> ') + pass + ' of ' + d.N + ' cells pass and ' + d.bad.length + ' fail. ' + (d.indep ? 'Independence needs every cell to pass — and every cell does.' : 'Dependence needs only one failing cell.')));
      if (!d.indep) {
        const [i, j] = first, x = vt(J.xs[i]), y = vt(J.ys[j]);
        b.appendChild(callout('warn', focus ? 'The lecture’s counterexample' : 'First counterexample', (focus ? 'The cell to look at is ' + tex('(t_1,t_2)=' + cellName(d, i, j)) + ' (outlined in violet): ' + pre0().focusWhy + '.' : 'Reading the rows from the top, each left to right, the first failing cell is ' + tex('(t_1,t_2)=' + cellName(d, i, j)) + ' (outlined in violet).') +
          '<div class="t3-line">' + tex('f_{XY}(' + x + ',' + y + ')=' + pt(J.p[i][j])) + ' — from your table</div>' +
          '<div class="t3-line">' + tex('f_X(' + x + ')\\,f_Y(' + y + ')=' + pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j])) + ' — column total × row total</div>' +
          '<div class="t3-line">' + tex(neqTex(J.p[i][j], d.prod[i][j])) + ', so ' + tex('X') + ' and ' + tex('Y') + ' are dependent.</div>'));
      }
      if (d.zeros.length) {
        const zf = focus && d.zeros.find(([a, c]) => a === focus[0] && c === focus[1]);
        const [i, j] = zf || d.zeros[0], x = vt(J.xs[i]), y = vt(J.ys[j]);
        b.appendChild(callout('key', 'Zero-cell shortcut — it applies here', tex('f_{XY}(' + x + ',' + y + ')=0') + ', yet ' + tex('f_X(' + x + ')=' + pt(d.mx[i]) + '>0') + ' and ' + tex('f_Y(' + y + ')=' + pt(d.my[j]) + '>0') + '. A product of two positive numbers is never 0: ' + tex(pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j]) + '\\ne 0') + '. So ' + tex('X') + ' and ' + tex('Y') + ' are dependent — no other cell needs checking. In words: ' + tex('X=' + x) + ' can happen and ' + tex('Y=' + y) + ' can happen, but never together.' +
          (d.zeros.length > 1 ? ' Your table has ' + d.zeros.length + ' such zero cells; each one alone proves dependence.' : '')));
      } else if (d.zeroTriv.length) {
        const [i, j] = d.zeroTriv[0];
        b.appendChild(callout('note', 'Zero cell, but no shortcut', 'Cell ' + tex(cellName(d, i, j)) + ' is 0, but it sits in a column or row whose total is 0 (' + tex('f_X=' + pt(d.mx[i])) + ', ' + tex('f_Y=' + pt(d.my[j])) + '), so the product is 0 too and the cell passes. The zero-cell shortcut needs both totals above 0.'));
      }
      if (flash) { b.appendChild(div('ws-readout t3-flash', flash)); flash = ''; }
      b.appendChild(h('div', { class: 'btn-row' }, Lab.button('Make it independent with these marginals', makeIndep, 'btn primary sm')));
    }
    function drawCond(d) {
      const b = pan.cond.body, J = d.J;
      Lab.clear(b);
      if (!(S.condI >= 0 && S.condI < d.nx)) S.condI = 0;
      const seg = Lab.seg(J.xs.map((x, i) => ({ label: 'X = ' + Lab.esc(vplain(x)), value: i })), S.condI, v => { S.condI = v; save(); drawCond(d); });
      b.appendChild(h('div', { class: 't3-segrow' }, h('span', { class: 'small muted', text: 'Condition on' }), seg));
      const i = S.condI, x = vt(J.xs[i]), px = d.mx[i];
      if (px.isZero()) {
        b.appendChild(div('ws-readout', tex('f_X(' + x + ')=0') + ': ' + tex('X=' + x) + ' never happens, so ' + tex('f_{Y\\mid X=' + x + '}') + ' is not defined (it would divide by 0). Pick another value. In the product rule this column passes automatically: every cell is ' + tex('0=0\\times f_Y(t_2)') + '.'));
      } else {
        const cond = J.ys.map((_, j) => J.p[i][j].div(px));
        const ok = cond.map((c, j) => c.eq(d.my[j]));
        const t = h('table', { class: 'tbl t3-ctab' });
        t.appendChild(h('thead', {}, h('tr', {}, h('th', { html: tex('t_2') }), h('th', { html: tex('f_{Y\\mid X=' + x + '}(t_2)=\\dfrac{f_{XY}(' + x + ',t_2)}{f_X(' + x + ')}') }), h('th', { html: tex('f_Y(t_2)') }), h('th', { text: 'same?' }))));
        t.appendChild(h('tbody', {}, J.ys.map((y, j) => h('tr', { class: ok[j] ? '' : 't3-badrow' },
          h('td', { class: 'vy', html: tex(vt(y)) }),
          h('td', { html: tex(pt(J.p[i][j]) + '\\div ' + pt(px) + '=' + pt(cond[j])) }),
          h('td', { html: tex(pt(d.my[j])) }),
          h('td', { html: mark(ok[j]) })))));
        b.appendChild(h('div', { class: 'tbl-wrap' }, t));
        const chart = div('t3-chart');
        b.appendChild(chart);
        W.bars({ dist: { vals: J.ys.map(vlab), p: cond }, compare: { vals: J.ys.map(vlab), p: d.my }, tone: 'y', height: 150, xName: 'Y \\text{ given } X=' + x }).mount(chart);
        b.appendChild(div('small muted', 'Bars: ' + tex('f_{Y\\mid X=' + x + '}') + '. Dashed outlines: ' + tex('f_Y') + '. They match bar for bar exactly when learning ' + tex('X=' + x) + ' changes nothing about ' + tex('Y') + '.'));
        // its CDF: the same bars added from the left (Rule 2: PMF and CDF for every random variable)
        const dc = cdfDist(J.ys, cond);
        if (dc) {
          b.appendChild(div('ws-title t3-gap', 'CDF of ' + tex('Y') + ' given ' + tex('X=' + x) + ': ' + tex('P(Y\\le s\\mid X=' + x + ')') + ', the bars above added from the left'));
          const cc = K.cdfChart(dc, { xName: 'Y', given: 'X=' + x });
          const cl = cc.querySelector('.pl-label');
          if (cl) Lab.setHTML(cl, 'Move the cutoff ' + tex('s') + ' (any number)');
          b.appendChild(cc);
          b.appendChild(div('small muted', 'Independent ⇔ for every ' + tex('t') + ' with ' + tex('f_X(t)>0') + ' this staircase is the CDF of ' + tex('Y') + ' (panel “PMF and CDF of each marginal”, CDF of Y).'));
        } else b.appendChild(div('small muted', 'A CDF adds up the values up to a cutoff, so it needs numbers as the labels of ' + tex('Y') + '. Some of your labels are text, so this CDF is skipped.'));
        const same = ok.every(Boolean);
        b.appendChild(div('t3-verdict', same ? '<b class="cgood">Same as ' + tex('f_Y') + '</b> for ' + tex('t=' + x) + '.' : '<b class="cbad">Different from ' + tex('f_Y') + '</b> for ' + tex('t=' + x) + ': knowing ' + tex('X=' + x) + ' changes the chances for ' + tex('Y') + '.'));
      }
      // every t at once
      const t2 = h('table', { class: 'tbl t3-grid t3-allt' });
      t2.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 't3-corner', html: tex('t\\backslash t_2') }), J.ys.map(y => h('th', { class: 'vy', html: tex(vt(y)) })), h('th', { class: 't3-mh', html: 'equals ' + tex('f_Y') + '?' }))));
      const tb = h('tbody');
      const rowsOk = [];
      J.xs.forEach((xv, ii) => {
        const tr = h('tr', { class: ii === S.condI ? 't3-cur' : '' }, h('th', { class: 'vx', html: tex(vt(xv)) }));
        if (d.mx[ii].isZero()) { tr.appendChild(h('td', { class: 't3-c zero', colspan: J.ys.length, html: 'not defined: ' + tex('f_X(' + vt(xv) + ')=0') })); tr.appendChild(h('td', { class: 't3-m', text: '—' })); rowsOk.push(null); }
        else {
          let all = true;
          J.ys.forEach((_, j) => { const c = J.p[ii][j].div(d.mx[ii]), ok = c.eq(d.my[j]); all = all && ok; tr.appendChild(h('td', { class: 't3-c ' + (ok ? 'ok' : 'bad'), html: tex(pt(c)) + ' ' + mark(ok) })); });
          tr.appendChild(h('td', { class: 't3-m', html: mark(all) }));
          rowsOk.push(all);
        }
        tb.appendChild(tr);
      });
      tb.appendChild(h('tr', { class: 't3-foot' }, h('th', { class: 't3-mh', html: tex('f_Y(t_2)') }), J.ys.map((_, j) => h('td', { class: 't3-m', html: tex(pt(d.my[j])) })), h('td', { class: 't3-m' })));
      t2.appendChild(tb);
      b.appendChild(div('ws-title t3-gap', 'Every ' + tex('t') + ' at once: row ' + tex('t') + ' is ' + tex('f_{Y\\mid X=t}') + '; the bottom row is ' + tex('f_Y') + '.'));
      b.appendChild(h('div', { class: 'tbl-wrap t3-wrap' }, t2));
      const failT = J.xs.filter((_, ii) => rowsOk[ii] === false);
      b.appendChild(div('t3-verdict', failT.length
        ? 'The conditional differs from ' + tex('f_Y') + ' for ' + tex('t\\in\\{' + failT.map(vt).join(',') + '\\}') + ' ⇒ <b class="cbad">dependent</b> — the same verdict as the cell-by-cell test.'
        : 'For every ' + tex('t') + ' with ' + tex('f_X(t)>0') + ', ' + tex('f_{Y\\mid X=t}=f_Y') + ' ⇒ <b class="cgood">independent</b> — the same verdict as the cell-by-cell test.'));
    }
    function drawMosaic(d) {
      if (!mo) {
        const host = div('t3-mosaic');
        pan.mosaic.body.appendChild(host);
        mo = W.mosaic({ J: d.J, x: { name: 'X' }, y: { name: 'Y' } });
        mo.mount(host);
      } else mo.setJ(d.J);
    }
    function drawMarg(d) {
      const b = pan.marg.body, J = d.J;
      Lab.clear(b);
      b.appendChild(h('div', { class: 't3-cols2' },
        h('div', {}, div('ws-title', 'PMF of ' + tex('X') + ': ' + tex('f_X(t_1)') + ', the bottom row of your table'), K.pmfChart(J.xs.map((x, i) => ({ x: vlab(x), p: d.mx[i] })), { xName: 'X', tone: 'x', height: 160 })),
        h('div', {}, div('ws-title', 'PMF of ' + tex('Y') + ': ' + tex('f_Y(t_2)') + ', the right column of your table'), K.pmfChart(J.ys.map((y, j) => ({ x: vlab(y), p: d.my[j] })), { xName: 'Y', tone: 'y', height: 160 }))));
      const dx = cdfDist(J.xs, d.mx), dy = cdfDist(J.ys, d.my);
      if (!dx || !dy) { b.appendChild(div('small muted', 'A CDF adds up all values ' + tex('\\le t') + ', so it needs numbers as labels. Some of your labels are not numbers, so the CDF is skipped.')); return; }
      if (S.cdf !== 'y') S.cdf = 'x';
      const host = div('t3-cdf');
      const seg = Lab.seg([{ label: 'CDF of X', value: 'x' }, { label: 'CDF of Y', value: 'y' }], S.cdf, v => { S.cdf = v; save(); paint(); });
      b.append(h('div', { class: 't3-segrow t3-gap' }, h('span', { class: 'small muted', text: 'Show' }), seg), host);
      function paint() { Lab.clear(host); host.appendChild(S.cdf === 'x' ? K.cdfChart(dx, { xName: 'X' }) : K.cdfChart(dy, { xName: 'Y' })); }
      paint();
    }
    function drawSteps(d) {
      const b = pan.steps.body, J = d.J;
      Lab.clear(b);
      const all = [];
      J.ys.forEach((_, j) => J.xs.forEach((_, i) => all.push(J.p[i][j])));
      const cell = (x, y) => 'f_{XY}(' + vt(x) + ',' + vt(y) + ')';
      const colL = J.xs.map((x, i) => margLine('f_X', x, J.ys.map((y, j) => ({ sym: cell(x, y), p: J.p[i][j] })), d.mx[i], '\\sum_{t_2}f_{XY}(' + vt(x) + ',t_2)'));
      const rowL = J.ys.map((y, j) => margLine('f_Y', y, J.xs.map((x, i) => ({ sym: cell(x, y), p: J.p[i][j] })), d.my[j], '\\sum_{t_1}f_{XY}(t_1,' + vt(y) + ')'));
      const steps = [];
      steps.push({ html: 'Your table has ' + tex('|T_X|=' + d.nx) + ' columns, ' + tex('T_X=\\{' + J.xs.map(vt).join(',') + '\\}') + ', and ' + tex('|T_Y|=' + d.ny) + ' rows, ' + tex('T_Y=\\{' + J.ys.map(vt).join(',') + '\\}') + ': ' + tex(d.nx + '\\times ' + d.ny + '=' + d.N) + ' cells. Every cell is ≥ 0 and together they add up to 1, so it is a joint PMF:', math: '\\sum_{t_1,t_2}f_{XY}(t_1,t_2)=' + sumTex(all) + '=1' });
      steps.push({ html: 'Marginal of ' + tex('X') + ': add each column.', math: 'f_X(t_1)=\\sum_{t_2\\in T_Y}f_{XY}(t_1,t_2)', block: lines(colL) });
      steps.push({ html: 'Marginal of ' + tex('Y') + ': add each row.', math: 'f_Y(t_2)=\\sum_{t_1\\in T_X}f_{XY}(t_1,t_2)', block: lines(rowL) });
      steps.push({ html: 'The test from L2.1: ' + tex('X') + ' and ' + tex('Y') + ' are independent if and only if, for every one of the ' + d.N + ' cells,', math: 'f_{XY}(t_1,t_2)=f_X(t_1)\\,f_Y(t_2)' });
      const L = [];
      let count = 0;
      J.ys.forEach((y, j) => J.xs.forEach((x, i) => {
        if (count++ >= 12) return;
        const ok = d.eq[i][j];
        L.push({ html: tex(cellName(d, i, j) + ':\\ \\ ' + pt(J.p[i][j]) + (ok ? '=' : '\\ne ') + pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j])) + ' ' + mark(ok) });
      }));
      if (d.N > 12) L.push({ html: '<span class="muted">… and ' + (d.N - 12) + ' more cells, all in the side-by-side table above.</span>' });
      steps.push({ html: 'Cell by cell, top row first (your value, then column total × row total):', block: lines(L) });
      if (d.indep) steps.push({ html: 'All ' + d.N + ' cells pass, so ' + tex('X') + ' and ' + tex('Y') + ' are <b>independent</b>. Then also ' + tex('f_{Y\\mid X=t}=f_Y') + ' for every ' + tex('t') + ' with ' + tex('f_X(t)>0') + ': conditional = marginal.' });
      else {
        const focus = presetFocus(d);
        const [i, j] = focus || d.bad[0];
        const x = vt(J.xs[i]), y = vt(J.ys[j]);
        steps.push({ html: (focus ? 'The lecture’s cell ' : 'The first failing cell is ') + tex(cellName(d, i, j)) + ':', math: 'f_{XY}(' + x + ',' + y + ')=' + neqTex(J.p[i][j], d.prod[i][j]) + '=f_X(' + x + ')\\,f_Y(' + y + ')', note: 'So ' + tex('X') + ' and ' + tex('Y') + ' are <b>dependent</b>. ' + d.bad.length + ' of ' + d.N + ' cells fail; to prove dependence one is enough.' });
      }
      if (d.zeros.length) {
        const focus = presetFocus(d), zf = focus && d.zeros.find(([a, c]) => a === focus[0] && c === focus[1]);
        const [i, j] = zf || d.zeros[0];
        steps.push({ html: 'Shortcut you could have used at once: cell ' + tex(cellName(d, i, j)) + ' is 0 while its column total ' + tex(pt(d.mx[i])) + ' and row total ' + tex(pt(d.my[j])) + ' are both above 0, and ' + tex(pt(d.mx[i]) + '\\times ' + pt(d.my[j]) + '=' + pt(d.prod[i][j]) + '\\ne 0') + '.' });
      }
      b.appendChild(K.steps(steps));
    }

    /* ---- L2.10: U = g(X), V = h(Y) — the table of (U, V) and the same product test */
    function drawFn(d) {
      pan.fn.hidden = !S.fnOn;
      if (!S.fnOn) { Lab.clear(fnBody); fnStatus.hidden = true; return; }   // nothing stale stays behind a hidden panel
      const J = d.J;
      // a problem keeps the last good picture and says what is wrong above it
      const fail = html => { fnStatus.hidden = false; Lab.setHTML(fnStatus, html + (fnBody.childNodes.length ? ' Below is still the last table it could build.' : '')); };
      if (!J.xs.every(v => typeof v === 'number') || !J.ys.every(v => typeof v === 'number')) return fail('<b>g and h need numbers</b> as the values of ' + tex('X') + ' and ' + tex('Y') + '; some labels of your table are text.');
      if (!fnG || !fnH) return fail('<b>Type a valid ' + tex('g(x)') + ' and ' + tex('h(y)') + '</b> in the controls.');
      let gx, hy;
      try {
        const apply = (fn, v, nm) => {
          let r;
          try { r = fn([v]); } catch (err) { throw new Error(nm + '(' + vplain(v) + ') cannot be worked out (' + String(err.message || err).toLowerCase() + ')'); }
          if (!Number.isFinite(r)) throw new Error(nm + '(' + vplain(v) + ') is not a number');
          return +r.toPrecision(12);
        };
        gx = J.xs.map(x => apply(fnG, x, 'g'));
        hy = J.ys.map(y => apply(fnH, y, 'h'));
      } catch (e) { return fail('<b class="cbad">' + Lab.esc(e.message) + '.</b>'); }
      fnStatus.hidden = true;
      const us = [...new Set(gx)].sort((a, b) => a - b), vs = [...new Set(hy)].sort((a, b) => a - b);
      const pre = us.map(u => J.xs.map((_, i) => i).filter(i => gx[i] === u));    // the x's with g(x) = u
      const prv = vs.map(v => J.ys.map((_, j) => j).filter(j => hy[j] === v));    // the y's with h(y) = v
      const terms = (a, c) => pre[a].flatMap(i => prv[c].map(j => ({ sym: 'f_{XY}(' + vt(J.xs[i]) + ',' + vt(J.ys[j]) + ')', p: J.p[i][j] })));
      const G = { xs: us, ys: vs, p: us.map((_, a) => vs.map((_, c) => F.sum(terms(a, c).map(t => t.p)))) };
      const e = analyse2(G);
      const uv = (a, c) => '(' + vt(us[a]) + ',' + vt(vs[c]) + ')';
      const src = s => '<span class="t3-src">' + Lab.esc(s) + '</span>';
      Lab.clear(fnBody);

      // 1. the answer for U and V
      const ans = h('div', { class: 'pl-answer small-answer' });
      let big;
      if (e.indep) big = '\\begin{aligned}f_{UV}(u,v)&=f_U(u)\\,f_V(v)\\\\&\\text{in all ' + e.N + ' cells}\\end{aligned}';
      else { const [a, c] = e.bad[0]; big = '\\begin{aligned}f_{UV}' + uv(a, c) + '&=' + pt(G.p[a][c]) + '\\\\&\\ne ' + pt(e.prod[a][c]) + '=f_U(' + vt(us[a]) + ')\\,f_V(' + vt(vs[c]) + ')\\end{aligned}'; }
      const why = d.indep
        ? (e.indep ? '<b class="cgood">As L2.10 says:</b> your ' + tex('X') + ' and ' + tex('Y') + ' are independent, so ' + tex('g(X)') + ' and ' + tex('h(Y)') + ' are too, whatever ' + tex('g') + ' and ' + tex('h') + ' are — “taking functions will not suddenly introduce dependence”.' : 'Your ' + tex('X') + ' and ' + tex('Y') + ' are independent, so this cannot happen; check the numbers.')
        : (e.indep ? 'Your ' + tex('X') + ' and ' + tex('Y') + ' are dependent, yet these ' + tex('U') + ' and ' + tex('V') + ' come out independent: a function can throw away the part that ties them (a constant ' + tex('h') + ' always does). The rule goes one way only: ' + tex('X\\perp Y\\Rightarrow g(X)\\perp h(Y)') + '.' : 'Your ' + tex('X') + ' and ' + tex('Y') + ' are dependent, and so are ' + tex('U') + ' and ' + tex('V') + ': here the dependence survives the functions. L2.10’s rule only promises independence when ' + tex('X') + ' and ' + tex('Y') + ' are independent.');
      K.setAnswer(ans, { ev: 'Your functions: ' + tex('g(x)') + ' = ' + src(S.g) + ' and ' + tex('h(y)') + ' = ' + src(S.h) + '. ' + tex('U=g(X)') + ' takes ' + tex('\\{' + us.map(vt).join(',') + '\\}') + ' and ' + tex('V=h(Y)') + ' takes ' + tex('\\{' + vs.map(vt).join(',') + '\\}') + ': ' + tex(us.length + '\\times ' + vs.length + '=' + e.N) + ' cells to test. ' + (e.indep ? '<b class="cgood">U and V are independent.</b>' : '<b class="cbad">U and V are dependent.</b>'), big, sub: why });
      fnBody.appendChild(ans);

      // 2. where each value goes
      const mapT = (vals, outs, xn, gn, cls) => h('div', { class: 'tbl-wrap t3-wrap' }, h('table', { class: 'tbl t3-grid t3-map' }, h('tbody', {},
        h('tr', {}, h('th', { class: 't3-mh', html: tex(xn) }), vals.map(v => h('th', { class: cls, html: tex(vt(v)) }))),
        h('tr', {}, h('th', { class: 't3-mh', html: tex(gn) }), outs.map(v => h('td', { html: tex(vt(v)) }))))));
      fnBody.append(div('ws-title', 'Where each value goes'), mapT(J.xs, gx, 'x', 'u=g(x)', 'vx'), mapT(J.ys, hy, 'y', 'v=h(y)', 'vy'));

      // 3. the table of (U, V), and the test cell by cell
      fnBody.appendChild(div('ws-title t3-gap', 'The joint table of ' + tex('(U,V)') + ': a cell adds every cell of your table whose ' + tex('x') + ' goes to ' + tex('u') + ' and whose ' + tex('y') + ' goes to ' + tex('v')));
      fnBody.appendChild(gridTable({
        xs: us, ys: vs, xName: 'U', yName: 'V',
        cell: (a, c) => ({ html: tex(pt(G.p[a][c])), cls: G.p[a][c].isZero() ? 'zero' : '', title: 'x in {' + pre[a].map(i => vplain(J.xs[i])).join(', ') + '}, y in {' + prv[c].map(j => vplain(J.ys[j])).join(', ') + '}' }),
        footHead: tex('f_U(u)'), foot: a => tex(pt(e.mx[a])), sideHead: tex('f_V(v)'), side: c => tex(pt(e.my[c])), total: tex('1'),
      }));
      fnBody.appendChild(div('ws-title t3-gap', 'Side by side: ' + tex('f_{UV}(u,v)') + ' against ' + tex('f_U(u)\\,f_V(v)')));
      const firstU = e.bad[0];
      fnBody.appendChild(gridTable({
        xs: us, ys: vs, xName: 'U', yName: 'V', cls: 't3-cmp',
        cell: (a, c) => {
          const ok = e.eq[a][c];
          return { cls: (ok ? 'ok' : 'bad') + (firstU && firstU[0] === a && firstU[1] === c ? ' first' : ''), html: '<span class="t3-pair">' + tex(pt(G.p[a][c]) + (ok ? '=' : '\\ne ') + pt(e.prod[a][c])) + '</span><span class="t3-mk">' + (ok ? '✓' : '✗') + '</span>' };
        },
      }));
      fnBody.appendChild(div('t3-verdict', (e.indep ? '<b class="cgood">U and V are independent:</b> all ' + e.N + ' cells pass.' : '<b class="cbad">U and V are dependent:</b> ' + e.bad.length + ' of ' + e.N + ' cells fail.') + ' (For ' + tex('X') + ' and ' + tex('Y') + ' themselves: ' + (d.indep ? 'independent' : 'dependent') + '.)'));

      // 4. PMF and CDF of U and V
      fnBody.appendChild(h('div', { class: 't3-cols2 t3-gap' },
        h('div', {}, div('ws-title', 'PMF of ' + tex('U=g(X)')), K.pmfChart(us.map((u, a) => ({ x: u, p: e.mx[a] })), { xName: 'U', tone: 'x', height: 140 })),
        h('div', {}, div('ws-title', 'PMF of ' + tex('V=h(Y)')), K.pmfChart(vs.map((v, c) => ({ x: v, p: e.my[c] })), { xName: 'V', tone: 'y', height: 140 }))));
      if (S.fnCdf !== 'v') S.fnCdf = 'u';
      const cdfHost = div('t3-cdf');
      const paintCdf = () => { Lab.clear(cdfHost); cdfHost.appendChild(S.fnCdf === 'u' ? K.cdfChart({ vals: us, p: e.mx }, { xName: 'U' }) : K.cdfChart({ vals: vs, p: e.my }, { xName: 'V' })); };
      const seg = Lab.seg([{ label: 'CDF of U', value: 'u' }, { label: 'CDF of V', value: 'v' }], S.fnCdf, v => { S.fnCdf = v; save(); paintCdf(); });
      fnBody.append(h('div', { class: 't3-segrow t3-gap' }, h('span', { class: 'small muted', text: 'Show' }), seg), cdfHost);
      paintCdf();

      // 5. the steps, with the learner's numbers
      const groupL = (vals, outs, ks, nm, vn) => ks.map(k => nm + '=' + vt(k) + ':\\ \\ ' + vn + '\\in\\{' + vals.filter((_, i) => outs[i] === k).map(vt).join(',') + '\\}');
      const cellsL = [];
      us.forEach((_, a) => vs.forEach((_, c) => {
        if (cellsL.length >= 8) return;
        const T = terms(a, c);
        cellsL.push('f_{UV}' + uv(a, c) + '=' + (T.length && T.length <= 3 ? T.map(t => t.sym).join('+') + '=' : '') + sumTex(T.map(t => t.p)) + (T.length > 1 ? '=' + pt(G.p[a][c]) : ''));
      }));
      if (e.N > 8) cellsL.push('\\dots\\ \\text{(' + (e.N - 8) + ' more cells, all in the table above)}');
      const margL = us.map((u, a) => 'f_U(' + vt(u) + ')=\\sum_{x:\\,g(x)=' + vt(u) + '}f_X(x)=' + sumTex(pre[a].map(i => d.mx[i])) + (pre[a].length > 1 ? '=' + pt(e.mx[a]) : ''))
        .concat(vs.map((v, c) => 'f_V(' + vt(v) + ')=\\sum_{y:\\,h(y)=' + vt(v) + '}f_Y(y)=' + sumTex(prv[c].map(j => d.my[j])) + (prv[c].length > 1 ? '=' + pt(e.my[c]) : '')));
      const testL = [];
      us.forEach((_, a) => vs.forEach((_, c) => { if (testL.length < 8) testL.push({ html: tex(uv(a, c) + ':\\ \\ ' + pt(G.p[a][c]) + (e.eq[a][c] ? '=' : '\\ne ') + pt(e.mx[a]) + '\\times ' + pt(e.my[c]) + '=' + pt(e.prod[a][c])) + ' ' + mark(e.eq[a][c]) }); }));
      fnBody.appendChild(div('ws-title t3-gap', 'How it is computed, with your numbers'));
      fnBody.appendChild(K.steps([
        { html: 'Apply ' + tex('g') + ' to every value of ' + tex('X') + ' and ' + tex('h') + ' to every value of ' + tex('Y') + ' (the two small tables above), and group the values that land together:', block: lines(groupL(J.xs, gx, us, 'U', 'x').concat(groupL(J.ys, hy, vs, 'V', 'y')), 't3-small') },
        { html: 'Each cell of the new table adds the cells of your table that land on it — the table method of L2.10 (≈ 6–9 min: add the joint PMF over all the points that give the value):', math: 'f_{UV}(u,v)=\\sum_{x:\\,g(x)=u}\\ \\sum_{y:\\,h(y)=v}f_{XY}(x,y)', block: lines(cellsL, 't3-small') },
        { html: 'The marginals of ' + tex('U') + ' and ' + tex('V') + ' (the same as adding the bottom row and the right column):', block: lines(margL, 't3-small') },
        { html: 'The product test of L2.1, cell by cell:', block: lines(testL.concat(e.N > 8 ? [{ html: '<span class="muted">… and ' + (e.N - 8) + ' more cells, all in the side-by-side table above.</span>' }] : []), 't3-small') },
        { html: (e.indep ? 'All ' + e.N + ' cells pass: ' + tex('U') + ' and ' + tex('V') + ' are <b>independent</b>.' : 'A cell fails: ' + tex('U') + ' and ' + tex('V') + ' are <b>dependent</b>.') + ' ' + why },
      ]));
      fnBody.appendChild(div('small muted t3-gap', 'Contrast: in the example “Units digit vs remainder mod 4 (00–99)”, ' + tex('X') + ' and ' + tex('Y') + ' are two functions of the <b>same</b> number ' + tex('N') + '. Nothing makes them independent, and they are not. L2.10’s rule starts from independent ' + tex('X') + ' and ' + tex('Y') + ' (or from functions of disjoint groups of mutually independent variables).'));
    }
  }

  /* ====================================================== 2 · MANY VARIABLES */
  const bit = k => v => +(v[k] === 'H');
  const MANY = [
    { id: 'parity', label: 'L2.2 — even parity: pairwise, not mutual', names: 'X1, X2, X3', source: 'L2.2 slides (≈ 5:42): two fair coins X1, X2 and the check bit X3 = 1 when they differ; four tuples, 1/4 each. The slide prints the last row as 1 1 1; the professor corrects it to 1 1 0.', rows: () => P.rows(P.coins(2), [bit(0), bit(1), v => +(v[0] !== v[1])]) },
    { id: 'coin3', label: 'L2.2 — a fair coin tossed three times', names: 'X1, X2, X3', source: 'L2.2 slides (≈ 2:18): X_i = 1 if toss i is heads; each of the 8 tuples has probability 1/8.', rows: () => P.rows(P.coins(3), [bit(0), bit(1), bit(2)]) },
    { id: 'digits', label: 'L2.2 — 3-digit number: hundreds digit, mod 2, units digit', names: 'X, Y, Z', source: 'L2.2 slides (≈ 3:12): a number 000–999 chosen uniformly; X = hundreds digit, Y = the number mod 2, Z = units digit. 100 tuples, 10 numbers each, so 10/1000 = 1/100 each.', rows: () => P.rows(P.numbers(0, 999, 3), [v => Math.floor(v / 100), v => v % 2, v => v % 10]) },
    { id: 'bern', label: 'i.i.d. Bernoulli(1/3), three tosses (independent, not uniform) — the L2.2 lesson (not a lecture slide)', lesson: true, names: 'X1, X2, X3', source: 'The L2.2 lesson (its coin can have P(H) = 1/3), built on the L2.2 definition of i.i.d. (≈ 8:18); the lecture’s own example is a fair coin. X_i = 1 if toss i is heads, so a tuple with h ones has probability (1/3)^h (2/3)^(3−h).', rows: () => P.rows(P.coins(3, F(1, 3)), [bit(0), bit(1), bit(2)]) },
  ];
  const rowsText = rows => rows.map(r => r.t.join(' ') + '   ' + F(r.p).toString()).join('\n');
  function parseNames(s) {
    const toks = String(s).split(/[\s,;]+/).filter(Boolean);
    const ok = toks.length === 3 && toks.every(t => /^[A-Za-z][A-Za-z0-9]{0,3}$/.test(t)) && new Set(toks).size === 3;
    return { names: ok ? toks : ['X1', 'X2', 'X3'], ok };
  }
  function parseTuples(text) {
    const rows = [], errs = [];
    String(text).split('\n').forEach((line, li) => {
      const s = line.replace(/#.*$/, '').trim();
      if (!s) return;
      const toks = s.split(/[\s,;:()=]+/).filter(Boolean);
      if (toks.length !== 4) { errs.push('Line ' + (li + 1) + ': needs 3 values and a probability (found ' + toks.length + ' entries).'); return; }
      const vals = toks.slice(0, 3).map(K.parseNum), p = K.parseNum(toks[3]);
      if (vals.some(v => v == null)) { errs.push('Line ' + (li + 1) + ': the three values must be numbers.'); return; }
      if (p == null || Number(p) < 0) { errs.push('Line ' + (li + 1) + ': the probability must be a number ≥ 0, like 1/8 or 0.125.'); return; }
      rows.push({ t: vals.map(Number), p, line: li + 1 });
    });
    const seen = new Map();
    rows.forEach(r => { const key = r.t.join('|'); if (seen.has(key)) errs.push('The tuple (' + r.t.join(', ') + ') is on lines ' + seen.get(key) + ' and ' + r.line + '. Merge them into one line.'); else seen.set(key, r.line); });
    if (!rows.length && !errs.length) errs.push('Type at least one tuple.');
    const total = errs.length ? null : F.sum(rows.map(r => r.p));
    return { rows, errs, total, ok: !errs.length && total.eq(1) };
  }
  function analyse3(rows, names) {
    const T = [0, 1, 2].map(a => [...new Set(rows.map(r => r.t[a]))].sort((x, y) => x - y));
    const key = t => t.join('|');
    const jm = new Map(rows.map(r => [key(r.t), r]));
    const jp = t => (jm.has(key(t)) ? jm.get(key(t)).p : F(0));
    const marg = T.map((vals, a) => vals.map(v => { const from = rows.filter(r => r.t[a] === v); return { v, from, p: F.sum(from.map(r => r.p)) }; }));
    const fm = (a, v) => marg[a][T[a].indexOf(v)].p;
    const pairs = [[0, 1], [0, 2], [1, 2]].map(([a, b]) => {
      const c = 3 - a - b;
      const cells = [];
      T[b].forEach(v => T[a].forEach(u => {
        const terms = T[c].map(w => { const t = [0, 0, 0]; t[a] = u; t[b] = v; t[c] = w; return { t, p: jp(t) }; });
        const p = F.sum(terms.map(x => x.p));
        const prod = fm(a, u).mul(fm(b, v));
        cells.push({ u, v, terms, p, prod, ok: p.eq(prod) });
      }));
      const bad = cells.filter(x => !x.ok);
      return { a, b, c, cells, bad, indep: !bad.length };
    });
    const combos = [];
    const total = T[0].length * T[1].length * T[2].length;
    if (total <= 20000) T[0].forEach(x => T[1].forEach(y => T[2].forEach(z => {
      const t = [x, y, z], listed = jm.has(key(t));
      const p = jp(t), fs = [fm(0, x), fm(1, y), fm(2, z)], prod = fs[0].mul(fs[1]).mul(fs[2]);
      combos.push({ t, p, listed, fs, prod, ok: p.eq(prod) });
    })));
    const badC = combos.filter(c => !c.ok);
    return { rows, names, T, marg, pairs, combos, total, badC, pairwise: pairs.every(p => p.indep), mutual: total <= 20000 && !badC.length };
  }

  function tabMany(ctx) {
    const { side, main, st, save } = ctx;
    const S = st.many;
    const pan = {};
    let names = parseNames(S.names).names, last = null;

    /* ---- controls */
    side.appendChild(K.group('1 · Your three random variables'));
    const nameF = K.textField({ label: 'Their names (three, separated by commas)', value: S.names, onChange: v => { S.names = v; const r = parseNames(v); names = r.names; nameF.hint(r.ok ? '' : '<span class="cbad">Use three different short names like X1, X2, X3 — showing X1, X2, X3 for now.</span>'); run(); } });
    side.appendChild(nameF);
    side.appendChild(K.group('2 · Their joint PMF, one tuple per line'));
    const ta = h('textarea', { class: 'field mono pl-area t3-tuples', rows: 9, spellcheck: 'false', 'aria-label': 'joint PMF, one tuple per line' });
    ta.value = S.text;
    const taLab = h('label', { class: 'pl-label' });
    const msg = div('pl-hint');
    side.appendChild(h('div', { class: 'pl-field' }, taLab, ta, msg));
    ta.addEventListener('input', Lab.debounce(() => run(), 220));
    side.appendChild(h('div', { class: 'pl-chips' },
      Lab.button('Rescale to total 1', rescale, 'btn xs'),
      Lab.button('Make all equal', () => rewrite(r => r.rows.map(x => ({ t: x.t, p: F(1, r.rows.length) }))), 'btn xs'),
      Lab.button('Make it independent (same marginals)', makeIndep, 'btn xs soft')));
    const tools = div('pl-hint');
    side.appendChild(tools);
    const menu = K.presets({ items: MANY, onPick: it => { S.src = it.id; S.names = it.names; nameF.input.value = it.names; names = parseNames(it.names).names; nameF.hint(''); ta.value = rowsText(it.rows()); run(); } });
    side.appendChild(menu);
    if (S.src) showPreset(menu, MANY, S.src);
    side.appendChild(resetRow(() => ctx.restart('many')));

    /* ---- panels */
    const status = div('t3-status');
    status.hidden = true;
    pan.answer = K.answer();
    pan.list = K.panel('Your joint PMF, tuple by tuple');
    pan.marg = K.panel('Marginals: keep one variable, add over the other two');
    pan.pairs = K.panel('Every pair: pairwise independence', 'For a pair, add over the third variable to get its two-variable joint table, then test every cell against the product of the two marginals (exactly as in tab 1).');
    pan.mutual = K.panel('All three at once: mutual independence, tuple by tuple', 'Every combination of values, including the ones missing from your list (they have probability 0).');
    pan.steps = K.panel('How it is computed, with your numbers');
    main.append(status, pan.answer, pan.list, pan.marg, pan.pairs, pan.mutual, pan.steps);
    run();

    function nt(k) { return tn(names[k]); }
    function jname() { return 'f_{' + names.map(tn).join('') + '}'; }
    function tup(t) { return '(' + t.map(vt).join(',') + ')'; }
    function run() {
      Lab.setHTML(taLab, 'Each line: ' + tex(nt(0)) + ' ' + tex(nt(1)) + ' ' + tex(nt(2)) + ' then the probability');
      const r = parseTuples(ta.value);
      ta.classList.toggle('bad', !!r.errs.length || !r.ok);
      if (r.errs.length) {
        msg.innerHTML = '<span class="cbad">' + r.errs.slice(0, 3).map(Lab.esc).join('<br>') + '</span>';
        status.hidden = false; Lab.setHTML(status, '<b>Not a joint PMF yet</b> — fix the lines in red. Everything below still shows your last valid table.');
        return;
      }
      Lab.setHTML(msg, r.rows.length + ' tuples · total ' + tex('=' + sumTex(r.rows.map(x => x.p)) + '=' + pt(r.total)) + (r.total.eq(1) ? ' <span class="cgood">✓</span>' : ' <span class="cbad">— a joint PMF must total 1. Press “Rescale to total 1” or edit.</span>') + '<br>Example line: <code>0 1 1 1/4</code>. Tuples you leave out have probability 0.');
      if (!r.ok) { status.hidden = false; Lab.setHTML(status, '<b>Not a joint PMF yet</b> — the probabilities add up to ' + tex(pt(r.total)) + ', not 1. Everything below still shows your last valid table.'); return; }
      status.hidden = true;
      if (S.src) {
        const it = MANY.find(p => p.id === S.src);
        const want = it ? it.rows() : [];
        const same = want.length === r.rows.length && want.every(w => r.rows.some(x => x.t.join('|') === w.t.join('|') && F(w.p).eq(x.p))) && it.names === S.names;
        if (!same) { S.src = null; showPreset(menu, MANY, null); }
      }
      S.text = ta.value;
      save();
      draw(analyse3(r.rows, names));
    }
    function rewrite(fn) {
      const r = parseTuples(ta.value);
      if (r.errs.length) { tools.innerHTML = '<span class="cbad">Fix the red lines first.</span>'; return; }
      tools.innerHTML = '';
      ta.value = rowsText(fn(r));
      run();
    }
    function rescale() {
      const r = parseTuples(ta.value);
      if (r.errs.length || r.total.isZero()) { tools.innerHTML = '<span class="cbad">' + (r.errs.length ? 'Fix the red lines first.' : 'All probabilities are 0 — nothing to rescale.') + '</span>'; return; }
      rewrite(() => r.rows.map(x => ({ t: x.t, p: x.p.div(r.total) })));
    }
    function makeIndep() {
      if (!last) return;
      if (last.total > 400) { tools.innerHTML = '<span class="cbad">That would be ' + last.total + ' tuples — too many to write out here.</span>'; return; }
      const A = last;
      const rows = [];
      A.T[0].forEach(x => A.T[1].forEach(y => A.T[2].forEach(z => {
        const p = A.marg[0][A.T[0].indexOf(x)].p.mul(A.marg[1][A.T[1].indexOf(y)].p).mul(A.marg[2][A.T[2].indexOf(z)].p);
        if (!p.isZero()) rows.push({ t: [x, y, z], p });
      })));
      S.src = null; showPreset(menu, MANY, null);
      tools.innerHTML = 'Done: every tuple now has probability ' + tex(jname() + '=' + 'f_{' + nt(0) + '}\\,f_{' + nt(1) + '}\\,f_{' + nt(2) + '}') + ', using your old marginals (which do not change).';
      Lab.renderMath(tools);
      ta.value = rowsText(rows);
      run();
    }

    function draw(A) {
      last = A;
      drawAnswer(A); drawList(A); drawMarg(A); drawPairs(A); drawMutual(A); drawSteps(A);
    }
    function verdictWords(A) {
      if (A.mutual) return '<b class="cgood">Mutually independent</b> — so every pair is independent too.';
      if (A.pairwise) return '<b class="cbad">Independent in pairs, not mutually.</b>';
      return '<b class="cbad">Not independent</b> — even a pair fails.';
    }
    function pairName(pr) { return '(' + nt(pr.a) + ',' + nt(pr.b) + ')'; }
    function drawAnswer(A) {
      const pre = S.src && MANY.find(p => p.id === S.src);
      const ev = (pre ? '<span class="t3-tag">' + tagFor(pre) + Lab.esc(pre.label) + '</span> ' : '') +
        'You listed ' + A.rows.length + ' tuples. The ranges give ' + tex('|T_{' + nt(0) + '}|\\cdot|T_{' + nt(1) + '}|\\cdot|T_{' + nt(2) + '}|=' + A.T.map(x => x.length).join('\\times ') + '=' + A.total) + ' combinations to test. ' + verdictWords(A);
      let big;
      if (A.mutual) big = '\\begin{aligned}' + jname() + '(t_1,t_2,t_3)&=f_{' + nt(0) + '}(t_1)\\,f_{' + nt(1) + '}(t_2)\\,f_{' + nt(2) + '}(t_3)\\\\&\\text{for all ' + A.total + ' combinations}\\end{aligned}';
      else if (A.badC.length) { const c = A.badC[0]; big = '\\begin{aligned}' + jname() + tup(c.t) + '&=' + pt(c.p) + '\\\\&\\ne ' + pt(c.prod) + '=f_{' + nt(0) + '}(' + vt(c.t[0]) + ')\\,f_{' + nt(1) + '}(' + vt(c.t[1]) + ')\\,f_{' + nt(2) + '}(' + vt(c.t[2]) + ')\\end{aligned}'; }
      else big = '\\text{too many combinations to test here}';
      const sub = 'Pairs: ' + A.pairs.map(pr => tex(pairName(pr)) + ' ' + mark(pr.indep)).join(' · ') + '. ' +
        (A.pairwise && !A.mutual ? 'Every pair passes, yet the full product fails: pairwise independence does <b>not</b> give mutual independence (L2.2).' : !A.pairwise ? 'One dependent pair already rules out independence of all three: any subset of independent variables would have to be independent.' : 'The full product holds, and with it every pair.');
      K.setAnswer(pan.answer, { ev, big, sub });
    }
    function drawList(A) {
      const b = pan.list.body;
      Lab.clear(b);
      const t = h('table', { class: 'tbl t3-tup' });
      t.appendChild(h('thead', {}, h('tr', {}, [0, 1, 2].map(k => h('th', { class: 't3-v' + k, html: tex(nt(k)) })), h('th', { html: tex(jname()) }))));
      t.appendChild(h('tbody', {}, A.rows.map(r => h('tr', {}, r.t.map(v => h('td', { html: tex(vt(v)) })), h('td', { html: tex(pt(r.p)) })))));
      b.appendChild(h('div', { class: 'tbl-wrap t3-scroll' }, t));
      b.appendChild(div('small', 'Ranges: ' + [0, 1, 2].map(k => tex('T_{' + nt(k) + '}=\\{' + A.T[k].map(vt).join(',') + '\\}')).join(', ') + '. All combinations: ' + tex(A.T.map(x => x.length).join('\\times ') + '=' + A.total) + '. You listed ' + A.rows.length + (A.total > A.rows.length ? '; the other ' + tex(A.total + '-' + A.rows.length + '=' + (A.total - A.rows.length)) + ' have probability 0 — and the test must include them too.' : '.')));
    }
    function drawMarg(A) {
      const b = pan.marg.body;
      Lab.clear(b);
      const cols = div('t3-cols3'), sums = [];
      [0, 1, 2].forEach(k => {
        const others = [0, 1, 2].filter(x => x !== k).map(x => 't_' + (x + 1));
        const L = A.marg[k].map(m => {
          const args = [0, 1, 2].map(x => (x === k ? vt(m.v) : 't_' + (x + 1))).join(',');
          return 'f_{' + nt(k) + '}(' + vt(m.v) + ')=\\sum_{' + others.join(',') + '}' + jname() + '(' + args + ')=' + (m.from.length > 1 ? sumTex(m.from.map(r => r.p)) + '=' : '') + pt(m.p);
        });
        cols.appendChild(h('div', {}, div('ws-title', 'PMF of ' + tex(nt(k))), K.pmfChart(A.marg[k].map(m => ({ x: m.v, p: m.p })), { xName: nt(k), tone: ['x', 'y', 'z'][k], height: 130 })));
        sums.push(div('ws-title t3-gap', 'Marginal of ' + tex(nt(k)) + ': keep ' + tex('t_' + (k + 1)) + ', add over ' + tex(others.join(','))), lines(L, 't3-small'));
      });
      b.appendChild(cols);
      b.append(...sums);
      b.appendChild(div('small muted', 'Each sum adds the listed tuples with that value (the missing tuples add 0).'));
      if (!(S.cdf >= 0 && S.cdf <= 2)) S.cdf = 0;
      const host = div('t3-cdf');
      const seg = Lab.seg([0, 1, 2].map(k => ({ label: 'CDF of ' + Lab.esc(names[k]), value: k })), S.cdf, v => { S.cdf = v; save(); paint(); });
      b.append(h('div', { class: 't3-segrow t3-gap' }, h('span', { class: 'small muted', text: 'Show' }), seg), host);
      function paint() { Lab.clear(host); const k = S.cdf; host.appendChild(K.cdfChart({ vals: A.T[k], p: A.marg[k].map(m => m.p) }, { xName: nt(k) })); }
      paint();
    }
    function drawPairs(A) {
      const b = pan.pairs.body;
      Lab.clear(b);
      A.pairs.forEach(pr => {
        const box = div('t3-pairbox');
        const first = pr.bad[0];
        box.appendChild(div('ws-title', 'Pair ' + tex(pairName(pr)) + ': add over ' + tex(nt(pr.c)) + '. ' + (pr.indep ? '<b class="cgood">Independent</b> — all ' + pr.cells.length + ' cells pass.' : '<b class="cbad">Dependent</b> — ' + pr.bad.length + ' of ' + pr.cells.length + ' cells fail.')));
        const ma = A.marg[pr.a], mb = A.marg[pr.b];
        box.appendChild(gridTable({
          xs: A.T[pr.a], ys: A.T[pr.b], xName: nt(pr.a), yName: nt(pr.b), xCls: 't3-v' + pr.a, yCls: 't3-v' + pr.b, cls: 't3-cmp',
          cell: (i, j) => {
            const c = pr.cells[j * A.T[pr.a].length + i];
            const isFirst = first === c;
            return {
              cls: (c.ok ? 'ok' : 'bad') + (isFirst ? ' first' : ''),
              title: 'sum over ' + names[pr.c] + ': ' + c.terms.map(x => Lab.fmt(x.p)).join(' + ') + ' = ' + Lab.fmt(c.p) + ';  product ' + Lab.fmt(ma[i].p) + ' × ' + Lab.fmt(mb[j].p) + ' = ' + Lab.fmt(c.prod),
              html: '<span class="t3-pair">' + tex(pt(c.p) + (c.ok ? '=' : '\\ne ') + pt(c.prod)) + '</span><span class="t3-mk">' + (c.ok ? '✓' : '✗') + '</span>',
            };
          },
          footHead: tex('f_{' + nt(pr.a) + '}'), foot: i => tex(pt(ma[i].p)), sideHead: tex('f_{' + nt(pr.b) + '}'), side: j => tex(pt(mb[j].p)), total: tex('1'),
        }));
        const fp = 'f_{' + nt(pr.a) + nt(pr.b) + '}';
        const show = pr.cells.length <= 9 ? pr.cells : first ? [first] : [];
        const L = show.map(c => {
          const args = t => t.map(vt).join(',');
          return fp + '(' + vt(c.u) + ',' + vt(c.v) + ')=' + (c.terms.length <= 4 ? c.terms.map(x => jname() + '(' + args(x.t) + ')').join('+') + '=' : '') + sumTex(c.terms.map(x => x.p)) + '=' + pt(c.p) + (c.ok ? '=' : '\\ne ') + pt(ma[A.T[pr.a].indexOf(c.u)].p) + '\\times ' + pt(mb[A.T[pr.b].indexOf(c.v)].p);
        });
        if (L.length) box.appendChild(div('small muted t3-gap', pr.cells.length <= 9 ? 'Each cell, summed over ' + tex(nt(pr.c)) + ' and compared with the product:' : 'The first failing cell, summed over ' + tex(nt(pr.c)) + ' (point at any cell for its sum):'));
        if (L.length) box.appendChild(lines(L, 't3-small'));
        else box.appendChild(div('small muted', 'Point at any cell to see its sum over ' + tex(nt(pr.c)) + ' and its product.'));
        b.appendChild(box);
      });
    }
    function drawMutual(A) {
      const b = pan.mutual.body;
      Lab.clear(b);
      if (A.total > 20000) { b.appendChild(div('ws-readout', 'There are ' + A.total + ' combinations — too many to test here. Use fewer values.')); return; }
      const LIMIT = 300;
      const t = h('table', { class: 'tbl t3-tup t3-mut' });
      t.appendChild(h('thead', {}, h('tr', {}, [0, 1, 2].map(k => h('th', { class: 't3-v' + k, html: tex(nt(k)) })), h('th', { html: tex(jname()) }), h('th', { html: tex('f_{' + nt(0) + '}\\,f_{' + nt(1) + '}\\,f_{' + nt(2) + '}') }), h('th', { text: '' }))));
      const tb = h('tbody');
      const firstBad = A.badC[0];
      A.combos.slice(0, LIMIT).forEach(c => tb.appendChild(h('tr', { class: (c.ok ? '' : 't3-badrow') + (c === firstBad ? ' t3-first' : '') + (c.listed ? '' : ' t3-unlisted') },
        c.t.map(v => h('td', { html: tex(vt(v)) })),
        h('td', { html: tex(pt(c.p)) + (c.listed ? '' : ' <span class="xs muted">not listed</span>') }),
        h('td', { html: tex(c.fs.map(pt).join('\\cdot ') + '=' + pt(c.prod)) }),
        h('td', { html: mark(c.ok) }))));
      t.appendChild(tb);
      b.appendChild(h('div', { class: 'tbl-wrap t3-scroll' }, t));
      if (A.combos.length > LIMIT) b.appendChild(div('small muted', 'Showing the first ' + LIMIT + ' of ' + A.combos.length + ' combinations; all of them are tested (' + A.badC.length + ' fail).'));
      b.appendChild(div('t3-verdict', (A.mutual ? '<b class="cgood">All ' + A.total + ' combinations pass.</b>' : '<b class="cbad">' + A.badC.length + ' of ' + A.total + ' combinations fail.</b>') + ' ' + verdictWords(A)));
      if (firstBad) {
        const c = firstBad;
        b.appendChild(callout('warn', 'First failing tuple', 'In the order above (first value, then second, then third), the first failing combination is ' + tex(tup(c.t)) + (c.listed ? '' : ', which is <b>not in your list</b>') + ':' +
          '<div class="t3-line">' + tex(jname() + tup(c.t) + '=' + pt(c.p)) + (c.listed ? ' — from your list' : ' — missing tuples have probability 0') + '</div>' +
          '<div class="t3-line">' + tex('f_{' + nt(0) + '}(' + vt(c.t[0]) + ')\\,f_{' + nt(1) + '}(' + vt(c.t[1]) + ')\\,f_{' + nt(2) + '}(' + vt(c.t[2]) + ')=' + c.fs.map(pt).join('\\times ') + '=' + pt(c.prod)) + ' — the three marginals</div>' +
          '<div class="t3-line">' + tex(neqTex(c.p, c.prod)) + ', so ' + tex(nt(0) + ',' + nt(1) + ',' + nt(2)) + ' are not mutually independent.</div>' + missingLine(c)));
      }
    }
    /** When the first failure is a listed tuple, also show a missing one (probability 0) that fails, as the lecture does. */
    function missingLine(c) {
      if (!c.listed) return '';
      const u = last.badC.find(x => !x.listed);
      if (!u) return '';
      return '<div class="t3-line t3-gap">Missing tuples count too: ' + tex(tup(u.t)) + ' is not in your list, so ' + tex(jname() + tup(u.t) + '=0') + ', yet ' + tex(u.fs.map(pt).join('\\times ') + '=' + pt(u.prod) + '\\ne 0') + '. Each value can happen on its own, but never all three together.</div>';
    }
    function drawSteps(A) {
      const b = pan.steps.body;
      Lab.clear(b);
      const steps = [];
      steps.push({ html: 'The ranges: ' + [0, 1, 2].map(k => tex('T_{' + nt(k) + '}=\\{' + A.T[k].map(vt).join(',') + '\\}')).join(', ') + '. You listed ' + A.rows.length + ' tuples whose probabilities add up to 1:', math: '\\sum ' + jname() + '=' + sumTex(A.rows.map(r => r.p)) + '=1' });
      steps.push({ html: 'Marginals (keep one variable, add over the other two):', block: lines([0, 1, 2].map(k => 'f_{' + nt(k) + '}:\\ ' + A.marg[k].map(m => vt(m.v) + '\\mapsto ' + pt(m.p)).join(',\\ '))) });
      A.pairs.forEach(pr => {
        const first = pr.bad[0];
        steps.push({
          html: 'Pair ' + tex(pairName(pr)) + ': its joint is ' + tex('f_{' + nt(pr.a) + nt(pr.b) + '}(u,v)=\\sum_{w}' + jname() + '(\\dots)') + ', summed over ' + tex(nt(pr.c)) + '; test all ' + pr.cells.length + ' cells. ' + (pr.indep ? 'All pass: ' + tex(nt(pr.a)) + ' and ' + tex(nt(pr.b)) + ' are independent.' : 'First failing cell ' + tex('(' + vt(first.u) + ',' + vt(first.v) + ')') + ':'),
          math: pr.indep ? null : neqTex(first.p, first.prod) + '=' + pt(A.marg[pr.a][A.T[pr.a].indexOf(first.u)].p) + '\\times ' + pt(A.marg[pr.b][A.T[pr.b].indexOf(first.v)].p),
        });
      });
      steps.push({ html: 'Mutual independence (L2.2) needs, for <b>every</b> one of the ' + A.total + ' combinations,', math: jname() + '(t_1,t_2,t_3)=f_{' + nt(0) + '}(t_1)\\,f_{' + nt(1) + '}(t_2)\\,f_{' + nt(2) + '}(t_3)' });
      if (A.mutual) steps.push({ html: 'All ' + A.total + ' pass. ' + verdictWords(A) });
      else if (A.badC.length) {
        const c = A.badC[0];
        steps.push({ html: 'The first failing combination is ' + tex(tup(c.t)) + (c.listed ? '' : ' (not listed, so its probability is 0)') + ':', math: neqTex(c.p, c.prod) + '=' + c.fs.map(pt).join('\\times '), note: verdictWords(A) + ' ' + A.badC.length + ' of ' + A.total + ' combinations fail; one is enough.' });
      }
      if (A.pairwise && !A.mutual) steps.push({ html: 'Why this can happen: knowing two of the variables can pin down the third (here, any two decide the third), even though each pair on its own looks like two independent variables.' });
      b.appendChild(K.steps(steps));
    }
  }

  /* ========================================================= 3 · I.I.D. CALCULATOR */
  const FIVE = { vals: [0, 1, 2, 3, 4], probs: ['1/2', '1/4', '1/8', '1/16', '1/16'] };
  const FIVE_SRC = 'L2.2 slides (≈ 15:00): X takes 0, 1, 2, 3, 4 with probabilities 1/2, 1/4, 1/8, 1/16, 1/16. The lecture keeps n general; n = 4 here — change it.';
  const IID = [
    { id: 'five4', label: 'L2.2 — 5-valued PMF: “4 is missing”, “4 exactly once”', source: FIVE_SRC + ' A = {4}: no draw in A = (15/16)^n, exactly one = n·(1/16)(15/16)^(n−1).', fam: 'custom', custom: FIVE, n: 4, mode: 'pick', A: [4], k: 1, a: 3, b: 4 },
    { id: 'five012', label: 'L2.2 — 5-valued PMF: “neither 3 nor 4 appears”', source: FIVE_SRC + ' (≈ 21:00) Every draw must be 0, 1 or 2, probability 14/16 each: all n draws in A = {0, 1, 2} = (14/16)^n.', fam: 'custom', custom: FIVE, n: 4, mode: 'pick', A: [0, 1, 2], k: 4, a: 3, b: 4 },
    { id: 'five34', label: 'L2.2 — 5-valued PMF: “3 and 4 both appear”', source: FIVE_SRC + ' (≈ 18:36) 1 − 2(15/16)^n + (14/16)^n by complements and inclusion–exclusion: see the panel “Two values both appear”.', fam: 'custom', custom: FIVE, n: 4, mode: 'pick', A: [3, 4], k: 0, a: 3, b: 4 },
    { id: 'geoj', label: 'L2.2 — i.i.d. Geometric: all n draws exceed j', source: 'L2.2 slides (≈ 11:36): P(X1 > j, …, Xn > j) = ((1 − p)^j)^n = (1 − p)^(jn). Here p = 1/2, j = c = 2, n = 3, the check in the L2.2 lesson: 1/64.', fam: 'geometric', q: { p: '1/2', 'shown up to k': 10 }, n: 3, mode: 'gt', c: 2, k: 3, a: 1, b: 2 },
    { id: 'die6', label: 'Fair die, A = {6}, n = 4 — the L2.2 lesson, “Your turn” (not a lecture slide)', lesson: true, source: 'The L2.2 lesson, “Your turn: dice” (practice, not in the lecture): no six in 4 rolls = (5/6)^4 = 625/1296.', fam: 'uniform', q: { a: 1, b: 6 }, n: 4, mode: 'pick', A: [6], k: 1, a: 5, b: 6 },
  ];
  const GEO = [
    { id: 'lesson', label: 'L2.2 — the boxed result: p = 1/2, m = 2, n = 3', source: 'L2.2 slides (≈ 23:36): P(X > m + n | X > m) = P(X > n); with p = 1/2, m = 2, n = 3 both sides are (1/2)^3 = 1/8.', p: '1/2', m: 2, n: 3 },
    { id: 'm1000', label: 'L2.2 — after 1000 tails, more than 100 more?', source: 'L2.2 lecture (≈ 25:00): “after 1000 tails, the chance of waiting more than another 100 tosses equals the chance of waiting more than 100 from the start”. p = 1/2 here.', p: '1/2', m: 1000, n: 100 },
    { id: 'die', label: 'Die: P(X > 5 | X > 2) — the L2.2 lesson, “Your turn” (not a lecture slide)', lesson: true, source: 'The L2.2 lesson, “Your turn: dice” (practice, not in the lecture): roll until the first six, p = 1/6, m = 2, n = 3 → (5/6)^3 = 125/216.', p: '1/6', m: 2, n: 3 },
  ];
  function geomDraw(p) { if (p >= 1) return 1; return Math.max(1, Math.ceil(Math.log(1 - Math.random()) / Math.log(1 - p))); }
  function poisDraw(lam) { const L = Math.exp(-lam); let k = 0, prod = Math.random(); while (prod > L) { k++; prod *= Math.random(); } return k; }

  function tabIID(ctx) {
    const { side, main, st, save } = ctx;
    const S = st.iid, G = S.geo;
    const pan = {};
    let cur = null, ev = null, sim = null, gsim = null, gsimEl = null;

    /* ---- controls */
    side.appendChild(K.group('1 · One draw X'));
    const dpHost = div('t3-dp');
    side.appendChild(dpHost);
    const menu = K.presets({ items: IID, onPick: loadIID });
    side.appendChild(menu);
    if (S.src) showPreset(menu, IID, S.src);
    side.appendChild(K.group('2 · The sample'));
    const nCtl = K.numField({ label: 'Number of i.i.d. draws ' + tex('n'), min: 1, max: 40, value: S.n, onChange: v => { S.n = v; S.k = kCtl.setRange(0, v); changed(); } });
    side.appendChild(nCtl);
    side.appendChild(K.group('3 · Your event A for one draw'));
    const modeCtl = K.selectField({ label: tex('A') + ' is', options: [{ value: 'pick', label: 'the values I tick below' }, { value: 'le', label: 'X ≤ c  (c or less)' }, { value: 'gt', label: 'X > c  (more than c)' }], value: S.mode, onChange: v => { S.mode = v; syncA(); changed(); } });
    const chips = div('t3-chips');
    const chipBox = h('div', { class: 'pl-field' }, div('pl-label', 'Values in ' + tex('A') + ' — tap to add or remove'), chips);
    const cCtl = K.numField({ label: tex('c'), min: 0, max: 10, value: S.c, onChange: v => { S.c = v; changed(); } });
    const kCtl = K.numField({ label: 'For “exactly k”: ' + tex('k') + ' of the ' + tex('n') + ' draws in ' + tex('A'), min: 0, max: S.n, value: Math.min(S.k, S.n), onChange: v => { S.k = v; changed(); } });
    side.append(modeCtl, chipBox, cCtl, kCtl);
    side.appendChild(K.group('4 · Two values both appear'));
    const aCtl = K.selectField({ label: 'Value ' + tex('a'), options: [], value: '', onChange: v => { S.a = Number(v); changed(); } });
    const bCtl = K.selectField({ label: 'Value ' + tex('b'), options: [], value: '', onChange: v => { S.b = Number(v); changed(); } });
    side.append(h('div', { class: 't3-ab' }, aCtl, bCtl));
    side.appendChild(K.group('5 · Memoryless check (Geometric)'));
    const gp = K.probField({ label: 'Chance of a head on each toss ' + tex('p'), value: G.p, onChange: () => { G.p = gp.querySelector('input').value; G.src = null; showPreset(gmenu, GEO, null); save(); drawMemo(); } });
    const gm = K.numField({ label: 'Tosses already done without a head: ' + tex('m'), min: 0, max: Math.max(50, G.m), value: G.m, onChange: v => { G.m = v; G.src = null; showPreset(gmenu, GEO, null); save(); drawMemo(); } });
    const gn = K.numField({ label: 'Further tosses: ' + tex('n') + ' (its own ' + tex('n') + ', not the sample size)', min: 0, max: Math.max(50, G.n), value: G.n, onChange: v => { G.n = v; G.src = null; showPreset(gmenu, GEO, null); save(); drawMemo(); } });
    const gmenu = K.presets({ label: 'Lecture examples (memoryless)', items: GEO, onPick: loadGeo });
    side.append(gp, gm, gn, gmenu);
    if (G.src) showPreset(gmenu, GEO, G.src);
    side.appendChild(resetRow(() => ctx.restart('iid')));

    /* ---- panels */
    const status = div('t3-status');
    status.hidden = true;
    pan.answer = K.answer();
    pan.one = K.panel('One draw: the PMF and CDF of ' + tex('X'), 'Violet bars are the values in your ' + tex('A') + '; together they make ' + tex('P(X\\in A)') + '.');
    pan.calc = K.panel('The four answers, formula first, then your numbers');
    pan.count = K.panel('The count ' + tex('N') + ' of draws that land in ' + tex('A'), tex('N\\sim\\text{Binomial}(n,P(X\\in A))') + ': each draw is a yes/no trial with the same chance, and the draws are independent.');
    pan.both = K.panel('Two values both appear (L2.2, part (c))');
    pan.sim = K.panel('Simulation: draw the sample for real', 'Each run draws ' + tex('n') + ' independent values from your PMF. The fractions settle near the exact answers.');
    pan.memo = K.panel('Memoryless: ' + tex('P(X>m+n\\mid X>m)=P(X>n)'), tex('X\\sim\\text{Geometric}(p)') + ' on ' + tex('\\{1,2,3,\\dots\\}') + ': the toss on which the first head comes. ' + tex('P(X=k)=(1-p)^{k-1}p') + '.');
    main.append(status, pan.answer, pan.one, pan.calc, pan.count, pan.both, pan.sim, pan.memo);
    buildSim(); buildGSim();
    syncA();
    makePicker();
    drawMemo();

    function changed() { save(); if (cur) draw(); }
    function makePicker() {
      Lab.clear(dpHost);
      const params = {};
      if (S.fam !== 'custom') params[S.fam] = Object.assign({}, S.q);
      dpHost.appendChild(K.distPicker({ label: 'Distribution of each draw ' + tex('X'), families: ['custom', 'bernoulli', 'uniform', 'binomial', 'geometric', 'poisson'], value: S.fam, params, custom: S.custom, onChange: onDist }));
    }
    function loadIID(it) {
      S.src = it.id; S.fam = it.fam;
      if (it.custom) S.custom = { vals: it.custom.vals.slice(), probs: it.custom.probs.slice() };
      if (it.q) S.q = Object.assign({}, it.q);
      S.n = it.n; S.mode = it.mode; S.k = it.k;
      if (it.A) S.A = it.A.slice();
      if (it.c != null) S.c = it.c;
      S.a = it.a; S.b = it.b;
      nCtl.set(S.n); kCtl.setRange(0, S.n); kCtl.set(S.k); modeCtl.select.value = S.mode; cCtl.set(S.c);
      syncA();
      makePicker();
    }
    function loadGeo(it) {
      G.src = it.id; G.p = it.p; G.m = it.m; G.n = it.n;
      gp.set(it.p);
      gm.setRange(0, Math.max(50, it.m)); gm.set(it.m);
      gn.setRange(0, Math.max(50, it.n)); gn.set(it.n);
      save(); drawMemo();
    }
    function sameDist(it, fam, res) {
      if (!it || it.fam !== fam) return false;
      if (fam === 'custom') return it.custom.vals.length === res.dist.vals.length && it.custom.vals.every((v, k) => v === res.dist.vals[k] && F(it.custom.probs[k]).eq(res.dist.p[k]));
      return Object.keys(it.q).every(key => res.q && String(it.q[key]) === String(res.q[key]));
    }
    function onDist(res) {
      if (!res) return;
      if (!res.ok) { status.hidden = false; Lab.setHTML(status, '<b>Your PMF is not valid yet</b> — fix it in step 1 (the probabilities must be ≥ 0 and add up to 1). Everything below still shows your last valid PMF.'); return; }
      status.hidden = true;
      const fam = res.fam || 'custom';
      S.fam = fam;
      if (fam === 'custom') S.custom = { vals: res.dist.vals.slice(), probs: res.dist.p.map(f => String(f)) };
      else S.q = Object.fromEntries(Object.entries(res.q || {}).map(([k, v]) => [k, v instanceof Lab.Frac ? v.toString() : v]));
      if (S.src && !sameDist(IID.find(p => p.id === S.src), fam, res)) { S.src = null; showPreset(menu, IID, null); }
      cur = model(res);
      syncValues();
      save();
      draw();
    }
    function model(res) {
      const fam = res.fam || 'custom', q = res.q || {};
      const vals = res.dist.vals.slice();
      let pQ = null;
      try {
        const qp = q.p != null ? QX.fromFrac(F(q.p)) : null;
        if (fam === 'custom') pQ = res.dist.p.map(f => QX.fromFrac(F(f)));
        else if (fam === 'bernoulli') pQ = qp && [QX.sub(Q(1), qp), qp];
        else if (fam === 'uniform') pQ = vals.map(() => Q(1, vals.length));
        else if (fam === 'binomial') pQ = qp && vals.map(k => QX.mul(Q(QX.choose(q.n, k)), QX.mul(QX.pow(qp, k), QX.pow(QX.sub(Q(1), qp), q.n - k))));
        else if (fam === 'geometric') pQ = qp && vals.map(k => QX.mul(QX.pow(QX.sub(Q(1), qp), k - 1), qp));
      } catch (e) { pQ = null; }
      if (pQ && pQ.some(x => !x)) pQ = null;
      const M = pQ ? QX : MF;
      const p = pQ || res.dist.p.map(Number);
      const short = k => (pQ ? (qTex(pQ[k], 5) ? pQ[k].n + '/' + pQ[k].d : Lab.fmtDec(QX.num(pQ[k]), 4)) : Lab.fmtDec(p[k], 4));
      const law = fam === 'custom'
        ? (vals.length <= 6 ? '\\Big\\{' + vals.map((v, k) => '\\overset{' + short(k) + '}{' + vt(v) + '}').join(',\\ ') + '\\Big\\}' : '\\text{your PMF}')
        : res.tex;
      return { fam, q, vals, p, M, pf: p.map(M.num), dist: res.dist, truncated: !!res.truncated, law };
    }
    function inA(x) { return S.mode === 'pick' ? S.A.some(a => a === x) : S.mode === 'le' ? x <= S.c : x > S.c; }
    function Atex() {
      if (S.mode === 'le') return '\\{x:\\ x\\le ' + S.c + '\\}';
      if (S.mode === 'gt') return '\\{x:\\ x>' + S.c + '\\}';
      const A = S.A.slice().sort((a, b) => a - b);
      return A.length ? '\\{' + A.map(vt).join(',') + '\\}' : '\\varnothing';
    }
    function syncA() {
      chipBox.hidden = S.mode !== 'pick';
      cCtl.hidden = S.mode === 'pick';
    }
    function syncValues() {
      const vals = cur.vals;
      S.A = S.A.filter(a => vals.includes(a));
      Lab.clear(chips);
      vals.forEach(v => {
        const on = S.A.includes(v);
        const btn = h('button', { type: 'button', class: 't3-chip' + (on ? ' on' : ''), 'aria-pressed': String(on), text: vplain(v) });
        btn.addEventListener('click', () => { S.A = S.A.includes(v) ? S.A.filter(a => a !== v) : S.A.concat(v); syncValues(); changed(); });
        chips.appendChild(btn);
      });
      S.c = cCtl.setRange(vals[0] - 1, vals[vals.length - 1]);
      cCtl.hint('Any ' + tex('c') + ' from ' + tex(String(vals[0] - 1)) + ' to ' + tex(String(vals[vals.length - 1])) + ' gives a different set (smaller or larger c adds nothing new).');
      if (!vals.includes(S.a)) S.a = vals[0];
      if (!vals.includes(S.b) || S.b === S.a) S.b = vals.find(v => v !== S.a);
      [[aCtl, S.a], [bCtl, S.b]].forEach(([c, val]) => { Lab.clear(c.select); vals.forEach(v => c.select.appendChild(h('option', { value: String(v), text: vplain(v) }))); c.select.value = String(val); });
    }

    function eventA() {
      const m = cur, M = m.M, idx = m.vals.map((_, i) => i);
      let pA, le = null, pLe = null;
      if (S.mode === 'gt') {
        le = idx.filter(i => m.vals[i] <= S.c);
        pLe = le.reduce((s, i) => M.add(s, m.p[i]), M.zero());
        pA = M.sub(M.one(), pLe);
      } else pA = idx.filter(i => inA(m.vals[i])).reduce((s, i) => M.add(s, m.p[i]), M.zero());
      const qA = M.sub(M.one(), pA), n = S.n, k = Math.min(S.k, n);
      const C = M.choose(n, k), pk = M.pow(pA, k), qk = M.pow(qA, n - k);
      const count = Lab.range(0, n).map(j => M.mul(M.int(M.choose(n, j)), M.mul(M.pow(pA, j), M.pow(qA, n - j))));
      return { M, idx: idx.filter(i => inA(m.vals[i])), le, pLe, pA, qA, n, k, C, pk, qk, all: M.pow(pA, n), none: M.pow(qA, n), ex: M.mul(M.int(C), M.mul(pk, qk)), atl: M.sub(M.one(), M.pow(qA, n)), count };
    }
    function draw() {
      ev = eventA();
      drawAnswer(); drawOne(); drawCalc(); drawCount(); drawBoth(); resetSim();
    }
    function drawAnswer() {
      const e = ev, M = e.M, n = e.n;
      const pre = S.src && IID.find(p => p.id === S.src);
      const evHtml = (pre ? '<span class="t3-tag">' + tagFor(pre) + Lab.esc(pre.label) + '</span> ' : '') +
        'Each of the ' + tex('n=' + n) + ' draws ' + tex('X_1,\\dots,X_{' + n + '}') + ' is an independent copy of ' + tex('X\\sim ' + cur.law) + '. Your set ' + tex('A=' + Atex()) + '; one draw lands in it with probability ' + tex('P(X\\in A)' + eqn(M, e.pA)) + '.';
      K.setAnswer(pan.answer, { ev: evHtml, big: '\\begin{aligned}N&=\\#\\{i\\le ' + n + ':\\ X_i\\in A\\}\\\\&\\sim\\text{Binomial}\\big(' + n + ',\\ ' + nm(M, e.pA) + '\\big)\\end{aligned}', sub: tex('N') + ' counts the draws that land in ' + tex('A') + '. The four answers are statements about ' + tex('N') + ':' });
      const tiles = div('t3-tiles');
      [
        ['All ' + n + ' draws in A', 'P(N=' + n + ')=P^{' + n + '}', e.all],
        ['No draw in A', 'P(N=0)=(1-P)^{' + n + '}', e.none],
        ['Exactly ' + e.k + ' in A', 'P(N=' + e.k + ')=\\tbinom{' + n + '}{' + e.k + '}P^{' + e.k + '}(1-P)^{' + (n - e.k) + '}', e.ex],
        ['At least one in A', 'P(N\\ge 1)=1-(1-P)^{' + n + '}', e.atl],
      ].forEach(([t, f, v]) => tiles.appendChild(h('div', { class: 't3-tile' }, div('t3-tile-h', Lab.esc(t)), div('t3-tile-f', tex(f)), div('t3-tile-v', tex(resTex(M, v).replace(/^=/, ''))))));
      pan.answer.appendChild(tiles);
      pan.answer.appendChild(div('pl-ans-sub t3-gap', 'In the tiles, ' + tex('P') + ' is short for ' + tex('P(X\\in A)' + eqn(M, e.pA)) + '. Change ' + tex('k') + ' in step 3.'));
    }
    function pAlines() {
      const m = cur, e = ev, M = e.M;
      const term = i => 'P(X=' + vt(m.vals[i]) + ')';
      if (S.mode === 'gt') {
        const L = e.le;
        if (!L.length) return 'P(X\\in A)=P(X>' + S.c + ')=1-P(X\\le ' + S.c + ')=1-0=1';
        const sym = L.length <= 6 ? L.map(term).join('+') : '\\sum_{x\\le ' + S.c + '}P(X=x)';
        const nums = L.length === 1 ? '' : rel(M, ...L.map(i => m.p[i])) + '1-(' + (L.length <= 8 ? L.map(i => nm(M, m.p[i])).join('+') : '\\dots') + ')';
        return 'P(X\\in A)=P(X>' + S.c + ')=1-P(X\\le ' + S.c + ')=1-' + (L.length === 1 ? sym : '(' + sym + ')') + nums + rel(M, e.pLe) + '1-' + nm(M, e.pLe) + eqn(M, e.pA);
      }
      const I = e.idx;
      if (!I.length) return 'P(X\\in A)=0\\quad(A\\text{ is empty})';
      const sym = I.length <= 6 ? I.map(term).join('+') : '\\sum_{x\\in A}P(X=x)';
      return 'P(X\\in A)=' + sym + (I.length > 1 ? rel(M, ...I.map(i => m.p[i])) + (I.length <= 8 ? I.map(i => nm(M, m.p[i])).join('+') : '\\dots') : '') + eqn(M, e.pA);
    }
    function drawOne() {
      const b = pan.one.body, m = cur, e = ev, M = e.M;
      Lab.clear(b);
      const label = k => (M.exact && qTex(m.p[k], 5) ? qTex(m.p[k], 5) : decTex(m.pf[k]));
      b.appendChild(K.pmfChart(m.vals.map((v, k) => ({ x: v, p: m.pf[k], label: label(k), hot: inA(v) })), { xName: 'X', tone: 'x', height: 170 }));
      b.appendChild(div('t3-line', tex(pAlines()) + (S.mode === 'gt' && m.fam === 'geometric' ? '<div class="small muted">Geometric tail check: ' + tex('P(X>' + S.c + ')=(1-p)^{' + S.c + '}' + rel(M, M.sub(M.one(), QXorF(M, m.q.p))) + par(nm(M, M.sub(M.one(), QXorF(M, m.q.p)))) + '^{' + S.c + '}' + eqn(M, M.pow(M.sub(M.one(), QXorF(M, m.q.p)), Math.max(0, S.c)))) + ' (the first ' + S.c + ' tosses are all tails).</div>' : '')));
      if (m.truncated) b.appendChild(div('small muted', 'The chart stops at ' + tex('k=' + m.vals[m.vals.length - 1]) + '; the rest of the probability lies further right. ' + (S.mode === 'gt' ? 'That is why ' + tex('P(X>c)') + ' is computed as ' + tex('1-P(X\\le c)') + '.' : '')));
      b.appendChild(K.cdfChart(m.dist, { xName: 'X', truncated: m.truncated, t: S.mode === 'pick' ? undefined : S.c }));
    }
    function QXorF(M, p) { return M.exact ? QX.fromFrac(F(p)) : Number(p); }
    function drawCalc() {
      const b = pan.calc.body, e = ev, M = e.M, n = e.n, k = e.k;
      Lab.clear(b);
      const P1 = nm(M, e.pA), Q1 = nm(M, e.qA);
      const steps = [
        { html: 'Chance that one draw lands in ' + tex('A=' + Atex()) + ': add the probabilities of the values in ' + tex('A') + '.', math: pAlines() },
        { html: 'Chance that one draw misses ' + tex('A') + ':', math: 'P(X\\notin A)=1-P(X\\in A)' + rel(M, e.pA) + '1-' + P1 + eqn(M, e.qA) },
        { html: '<b>All ' + n + ' draws in ' + tex('A') + '.</b> Independent: “and” becomes a product. Identically distributed: every factor is the same ' + tex('P(X\\in A)') + '.', math: 'P(X_1\\in A,\\dots,X_{' + n + '}\\in A)=P(X\\in A)^{n}' + rel(M, e.pA) + par(P1) + '^{' + n + '}' + resTex(M, e.all) },
        { html: '<b>No draw in ' + tex('A') + '.</b> Every draw misses ' + tex('A') + ':', math: 'P(X_1\\notin A,\\dots,X_{' + n + '}\\notin A)=\\big(1-P(X\\in A)\\big)^{n}' + rel(M, e.qA) + par(Q1) + '^{' + n + '}' + resTex(M, e.none) },
        { html: '<b>Exactly ' + tex('k=' + k) + ' draws in ' + tex('A') + '.</b> Choose which ' + k + ' of the ' + n + ' draws are the ones in ' + tex('A') + ' — ' + tex('\\binom{' + n + '}{' + k + '}=' + grp(String(e.C))) + ' disjoint ways — and each way has probability ' + tex('P(X\\in A)^{k}\\,(1-P(X\\in A))^{n-k}') + ':', math: '\\begin{aligned}\\binom{n}{k}P(X\\in A)^{k}\\big(1-P(X\\in A)\\big)^{n-k}&' + rel(M, e.pA, e.qA) + '\\binom{' + n + '}{' + k + '}' + par(P1) + '^{' + k + '}' + par(Q1) + '^{' + (n - k) + '}\\\\&' + rel(M, e.pk, e.qk) + grp(String(e.C)) + '\\cdot ' + nm(M, e.pk) + '\\cdot ' + nm(M, e.qk) + resTex(M, e.ex) + '\\end{aligned}', note: tex('\\binom{' + n + '}{' + k + '}=\\frac{' + n + '!}{' + k + '!\\,(' + n + '-' + k + ')!}' + binomTail(n, k)) + '. With ' + tex('k=1') + ' this is the lecture’s “exactly once”: ' + tex('n\\,P(X\\in A)\\,(1-P(X\\in A))^{n-1}') + '.' },
        { html: '<b>At least one draw in ' + tex('A') + '.</b> It is the opposite of “no draw in A”:', math: 'P(\\text{at least one})=1-P(\\text{none})' + rel(M, e.none) + '1-' + nm(M, e.none) + resTex(M, e.atl) },
      ];
      if (!M.exact) steps.push({ html: 'Your PMF has decimal probabilities (Poisson or a long decimal), so these numbers are rounded decimals rather than exact fractions.' });
      b.appendChild(K.steps(steps));
    }
    function drawCount() {
      const b = pan.count.body, e = ev, M = e.M, n = e.n;
      Lab.clear(b);
      const lab = a => (M.exact && qTex(a, 5) ? qTex(a, 5) : decTex(M.num(a)));
      b.appendChild(K.pmfChart(e.count.map((a, j) => ({ x: j, p: M.num(a), label: lab(a), hot: j === e.k })), { xName: 'N', tone: 'z', height: 170 }));
      b.appendChild(lines([
        { html: tex('P(N=j)' + rel(M, e.pA, e.qA) + '\\binom{' + n + '}{j}' + par(nm(M, e.pA)) + '^{j}' + par(nm(M, e.qA)) + '^{' + n + '-j}') + ' for ' + tex('j=0,1,\\dots,' + n) + '. The violet bar is your ' + tex('k=' + e.k) + '.' },
        { html: 'No draw in ' + tex('A') + ' is ' + tex('N=0') + ' (the first bar); all in ' + tex('A') + ' is ' + tex('N=' + n) + ' (the last bar); at least one is every bar except the first: ' + tex('1-P(N=0)') + '.' },
      ], 't3-small'));
      const fr = e.count.map(a => (M.exact ? toFrac(a) : null));
      const dist = fr.every(Boolean) ? { vals: Lab.range(0, n), p: fr } : { vals: Lab.range(0, n), p: e.count.map(a => M.num(a)), float: true };
      b.appendChild(K.cdfChart(dist, { xName: 'N', t: e.k, step: 1 }));
    }
    function drawBoth() {
      const b = pan.both.body, m = cur, M = m.M, n = S.n;
      Lab.clear(b);
      const ia = m.vals.indexOf(S.a), ib = m.vals.indexOf(S.b);
      if (m.vals.length < 2 || ia < 0 || ib < 0 || ia === ib) { b.appendChild(div('small muted', 'Pick two different values ' + tex('a') + ' and ' + tex('b') + ' in step 4.')); return; }
      const a = vt(S.a), bb = vt(S.b), pa = m.p[ia], pb = m.p[ib];
      const ca = M.sub(M.one(), pa), cb = M.sub(M.one(), pb), cab = M.sub(ca, pb);
      const PA = M.pow(ca, n), PB = M.pow(cb, n), PAB = M.pow(cab, n);
      const both = M.add(M.sub(M.sub(M.one(), PA), PB), PAB);
      const box = h('div', { class: 'pl-answer small-answer' });
      K.setAnswer(box, { ev: 'Chance that ' + tex(a) + ' and ' + tex(bb) + ' each appear at least once among the ' + tex('n=' + n) + ' draws:', big: '\\begin{aligned}P(\\text{both appear})&' + rel(M, ca, cb, cab) + '1-' + par(nm(M, ca)) + '^{' + n + '}-' + par(nm(M, cb)) + '^{' + n + '}+' + par(nm(M, cab)) + '^{' + n + '}\\\\&' + resTex(M, both) + '\\end{aligned}' });
      b.appendChild(box);
      const steps = [
        { html: 'Let ' + tex('E_a') + ' = “' + tex(a) + ' appears at least once” and ' + tex('E_b') + ' = “' + tex(bb) + ' appears at least once”. “At least once” has many cases, so work with the complements.' },
        { html: tex('E_a^c') + ': every draw avoids ' + tex(a) + ', each with probability ' + tex('1-P(X=' + a + ')' + rel(M, pa) + '1-' + nm(M, pa) + eqn(M, ca)) + ':', math: 'P(E_a^c)' + rel(M, ca) + par(nm(M, ca)) + '^{' + n + '}' + resTex(M, PA) },
        { html: tex('E_b^c') + ': every draw avoids ' + tex(bb) + ', each with probability ' + tex('1-P(X=' + bb + ')' + rel(M, pb) + '1-' + nm(M, pb) + eqn(M, cb)) + ':', math: 'P(E_b^c)' + rel(M, cb) + par(nm(M, cb)) + '^{' + n + '}' + resTex(M, PB) },
        { html: tex('E_a^c\\cap E_b^c') + ': every draw avoids both, each with probability ' + tex('1-P(X=' + a + ')-P(X=' + bb + ')' + rel(M, pa, pb) + '1-' + nm(M, pa) + '-' + nm(M, pb) + eqn(M, cab)) + ' (one draw must miss both at once — not ' + tex(par(nm(M, ca)) + '^{2n}') + '):', math: 'P(E_a^c\\cap E_b^c)' + rel(M, cab) + par(nm(M, cab)) + '^{' + n + '}' + resTex(M, PAB) },
        { html: 'De Morgan: “both appear” is the opposite of “' + tex(a) + ' is missing or ' + tex(bb) + ' is missing”. Inclusion–exclusion counts the overlap once:', math: 'P(E_a\\cap E_b)=1-P(E_a^c\\cup E_b^c)=1-\\big[P(E_a^c)+P(E_b^c)-P(E_a^c\\cap E_b^c)\\big]' },
        { html: 'With your numbers:', math: 'P(E_a\\cap E_b)' + rel(M, PA, PB, PAB) + '1-' + nm(M, PA) + '-' + nm(M, PB) + '+' + nm(M, PAB) + resTex(M, both), note: 'Sanity check: with ' + tex('n=1') + ' this is ' + tex('1-(1-P(X=a))-(1-P(X=b))+(1-P(X=a)-P(X=b))=0') + ' — one draw cannot show two values.' },
      ];
      b.appendChild(K.steps(steps));
    }

    /* ---- simulation (i.i.d.) */
    function buildSim() {
      const btns = h('div', { class: 'btn-row' },
        Lab.button('Run 1×', () => runSim(1), 'btn sm'),
        Lab.button('Run 100×', () => runSim(100), 'btn sm'),
        Lab.button('Run 1,000×', () => runSim(1000), 'btn primary sm'),
        Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => resetSim(), 'btn ghost sm'));
      pan.sim.body.append(btns, div('t3-simlast'), div('t3-simtab'));
    }
    function sampler() {
      const m = cur;
      if (m.fam === 'geometric') { const p = Number(m.q.p); return () => geomDraw(p); }
      if (m.fam === 'poisson') { const lam = Number(m.q['λ']); return () => poisDraw(lam); }
      const w = m.pf;
      return () => m.vals[Lab.rand.weighted(w)];
    }
    function resetSim() { sim = { runs: 0, all: 0, none: 0, ex: 0, atl: 0, both: 0, last: null }; paintSim(); }
    function runSim(times) {
      if (!cur) return;
      const draw1 = sampler(), n = S.n, k = Math.min(S.k, n);
      for (let r = 0; r < times; r++) {
        const s = [];
        for (let i = 0; i < n; i++) s.push(draw1());
        const c = s.filter(inA).length;
        sim.runs++;
        if (c === n) sim.all++;
        if (c === 0) sim.none++;
        if (c === k) sim.ex++;
        if (c >= 1) sim.atl++;
        if (s.includes(S.a) && s.includes(S.b) && S.a !== S.b) sim.both++;
        sim.last = s;
      }
      paintSim();
    }
    function paintSim() {
      const [last, tab] = [pan.sim.body.querySelector('.t3-simlast'), pan.sim.body.querySelector('.t3-simtab')];
      if (!last || !ev) return;
      Lab.clear(last);
      if (sim.last) {
        const c = sim.last.filter(inA).length;
        last.appendChild(div('small muted', 'Last run (violet = in ' + tex('A') + '): ' + c + ' of ' + sim.last.length + ' draws in ' + tex('A') + '.'));
        Lab.renderMath(last);
        const row = div('t3-draws');
        sim.last.forEach(v => row.appendChild(h('span', { class: 't3-draw' + (inA(v) ? ' in' : ''), text: vplain(v) })));
        last.appendChild(row);
      } else last.appendChild(div('small muted', 'No runs yet. Press a button.'));
      Lab.clear(tab);
      const e = ev, M = e.M, R = sim.runs;
      const ia = cur.vals.indexOf(S.a), ib = cur.vals.indexOf(S.b);
      let bothP = null;
      if (ia >= 0 && ib >= 0 && ia !== ib) { const ca = M.sub(M.one(), cur.p[ia]), cb = M.sub(M.one(), cur.p[ib]); bothP = M.add(M.sub(M.sub(M.one(), M.pow(ca, S.n)), M.pow(cb, S.n)), M.pow(M.sub(ca, cur.p[ib]), S.n)); }
      const rowsT = [['All ' + S.n + ' draws in A', e.all, sim.all], ['No draw in A', e.none, sim.none], ['Exactly ' + e.k + ' in A', e.ex, sim.ex], ['At least one in A', e.atl, sim.atl]];
      if (bothP != null) rowsT.push([vplain(S.a) + ' and ' + vplain(S.b) + ' both appear', bothP, sim.both]);
      const t = h('table', { class: 'tbl t3-simt' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Event' }), h('th', { text: 'Exact value' }), h('th', { text: 'In your runs' }))));
      t.appendChild(h('tbody', {}, rowsT.map(([name, exact, cnt]) => h('tr', {}, h('td', { class: 'l', text: name }), h('td', { html: tex(decRel(M, exact)) }), h('td', { html: R ? tex(freqTex(cnt, R)) : '—' })))));
      tab.appendChild(h('div', { class: 'tbl-wrap' }, t));
      tab.appendChild(div('xs muted', R ? R.toLocaleString('en-US') + ' runs of ' + S.n + ' draws each. A fraction ' + tex('\\text{count}/\\text{runs}') + ' is a relative frequency; it gets closer to the exact value as the runs pile up.' : 'Exact values to 4 decimal places (≈ marks a rounded one).'));
      Lab.renderMath(tab);
    }

    /* ---- memoryless */
    function drawMemo() {
      const b = pan.memo.body;
      Lab.clear(b);
      const pF = K.parseProb(G.p);
      if (!pF || Number(pF) <= 0) { b.appendChild(div('ws-readout', '<span class="cbad">p must be more than 0</span> — with ' + tex('p=0') + ' a head never comes, so ' + tex('X') + ' is not defined.')); b.appendChild(gsimEl); return; }
      const M = pF.approx ? MF : QX;
      const p = M.exact ? Q(pF.n, pF.d) : Number(pF);
      const q = M.sub(M.one(), p), m = G.m, n = G.n;
      const tm = M.pow(q, m), tmn = M.pow(q, m + n), tnn = M.pow(q, n);
      const qT = nm(M, q), pre = G.src && GEO.find(x => x.id === G.src);
      const head = h('div', { class: 'pl-answer small-answer' });
      if (M.isZero(tm)) {
        K.setAnswer(head, { ev: (pre ? '<span class="t3-tag">' + Lab.esc(pre.label) + '</span> ' : '') + 'With ' + tex('p=1') + ' the first toss is always a head, so ' + tex('P(X>' + m + ')=0') + ': the condition ' + tex('X>' + m) + ' never happens and the conditional probability is not defined. Make ' + tex('p') + ' smaller or ' + tex('m=0') + '.' });
        b.appendChild(head); b.appendChild(gsimEl); return;
      }
      const ratio = M.div(tmn, tm);
      K.setAnswer(head, {
        ev: (pre ? '<span class="t3-tag">' + tagFor(pre) + Lab.esc(pre.label) + '</span> ' : '') + 'You chose ' + tex('p' + eqn(M, p)) + ' (so ' + tex('1-p' + eqn(M, q)) + '), ' + tex('m=' + m) + ' tosses already without a head, and ' + tex('n=' + n) + ' further tosses.',
        big: '\\begin{aligned}P(X>' + (m + n) + '\\mid X>' + m + ')&' + rel(M, q) + par(qT) + '^{' + n + '}' + resTex(M, ratio) + '\\\\&=P(X>' + n + ')\\end{aligned}',
        sub: M.eq(ratio, tnn) ? '<b class="cgood">Equal</b>: after ' + m + ' failed tosses, the chance of needing more than ' + n + ' more is the same as needing more than ' + n + ' from the start.' : 'The two sides differ only by rounding.',
      });
      b.appendChild(head);
      const steps = [
        { html: 'Tail of the geometric: ' + tex('X>k') + ' means the first ' + tex('k') + ' tosses are all tails, each with probability ' + tex('1-p' + rel(M, p) + '1-' + nm(M, p) + eqn(M, q)) + ':', math: 'P(X>k)=(1-p)^{k}' },
        { html: 'With your numbers:', block: lines([
          'P(X>m)=P(X>' + m + ')' + rel(M, q) + par(qT) + '^{' + m + '}' + resTex(M, tm),
          'P(X>m+n)=P(X>' + (m + n) + ')' + rel(M, q) + par(qT) + '^{' + (m + n) + '}' + resTex(M, tmn),
          'P(X>n)=P(X>' + n + ')' + rel(M, q) + par(qT) + '^{' + n + '}' + resTex(M, tnn),
        ]) },
        { html: 'Conditional probability is ' + tex('P(E\\mid B)=P(E\\cap B)/P(B)') + '. If ' + tex('X>m+n') + ' then certainly ' + tex('X>m') + ', so the intersection is just ' + tex('\\{X>m+n\\}') + ':', math: 'P(X>m+n\\mid X>m)=\\frac{P(X>m+n)}{P(X>m)}=\\frac{(1-p)^{m+n}}{(1-p)^{m}}=(1-p)^{n}' },
        { html: 'With your numbers:', math: '\\frac{' + par(qT) + '^{' + (m + n) + '}}{' + par(qT) + '^{' + m + '}}=' + par(qT) + '^{' + (m + n) + '-' + m + '}=' + par(qT) + '^{' + n + '}' + resTex(M, ratio) },
        { html: 'That is exactly ' + tex('P(X>' + n + ')') + ' from step 2 ' + mark(M.eq(ratio, tnn)) + '. The ' + m + ' failed tosses are forgotten — the memoryless property.' },
      ];
      b.appendChild(K.steps(steps));
      if (m <= 30) {
        const KB = 10, pf = M.num(p), qf = 1 - pf;
        const base = Lab.range(1, m + KB).map(k => Math.pow(qf, k - 1) * pf);
        const orig = Lab.range(1, KB).map(k => Math.pow(qf, k - 1) * pf);
        const pair = div('t3-cols2 t3-memo');
        const L = div(''), R = div('');
        pair.append(h('div', {}, div('ws-title', 'PMF of ' + tex('X') + '; the part ' + tex('X>' + m) + ' in violet'), L), h('div', {}, div('ws-title', 'Given ' + tex('X>' + m) + ': PMF of the extra wait ' + tex('X-' + m)), R));
        b.appendChild(pair);
        const top = Math.max(...base, ...orig) * 1.12;
        const bl = W.bars({ dist: { vals: Lab.range(1, m + KB), p: base }, tone: 'x', height: 130, max: top, xName: 'X', valueLabels: false, minSlot: 22 });
        const br = W.bars({ dist: { vals: Lab.range(1, KB), p: orig }, tone: 'z', height: 130, max: top, xName: 'X-' + m, valueLabels: false, compare: { vals: Lab.range(1, KB), p: orig }, minSlot: 22 });
        bl.mount(L); br.mount(R);
        bl.highlight(Lab.range(0, m - 1), 'dim');
        bl.highlight(Lab.range(m, m + KB - 1), 'pick');
        b.appendChild(div('small muted', 'Right chart: the violet bars of the left chart divided by ' + tex('P(X>' + m + ')') + ' and moved back by ' + m + ': bar ' + tex('j') + ' is ' + tex('\\frac{(1-p)^{' + m + '+j-1}p}{(1-p)^{' + m + '}}=(1-p)^{j-1}p') + '. The dashed outlines are the original PMF — they match exactly.'));
      } else b.appendChild(div('small muted', 'With ' + tex('m=' + m) + ' there are too many bars to draw; the formula above holds for every ' + tex('m') + '.'));
      b.appendChild(gsimEl);
      resetGSim();
    }
    function buildGSim() {
      gsimEl = div('t3-gsim');
      gsimEl.append(div('ws-title', 'Simulate it: toss until the first head, many times'), h('div', { class: 'btn-row' },
        Lab.button('Run 1,000×', () => runGSim(1000), 'btn sm'),
        Lab.button('Run 10,000×', () => runGSim(10000), 'btn primary sm'),
        Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => resetGSim(), 'btn ghost sm')), div('ws-readout t3-gread'));
    }
    function resetGSim() { gsim = { runs: 0, gm: 0, gmn: 0, gn: 0 }; paintGSim(); }
    function runGSim(times) {
      const pF = K.parseProb(G.p);
      if (!pF || Number(pF) <= 0) return;
      const p = Number(pF);
      for (let r = 0; r < times; r++) {
        const x = geomDraw(p);
        gsim.runs++;
        if (x > G.m) { gsim.gm++; if (x > G.m + G.n) gsim.gmn++; }
        if (x > G.n) gsim.gn++;
      }
      paintGSim();
    }
    function paintGSim() {
      const out = gsimEl && gsimEl.querySelector('.t3-gread');
      if (!out) return;
      const pF = K.parseProb(G.p);
      if (!pF || Number(pF) <= 0) { out.innerHTML = '<span class="muted">Set p above 0 first.</span>'; return; }
      const M = pF.approx ? MF : QX, q = M.sub(M.one(), M.exact ? Q(pF.n, pF.d) : Number(pF));
      const pm = Math.pow(1 - Number(pF), G.m);
      if (!gsim.runs) { out.innerHTML = '<span class="muted">No runs yet.</span>' + (pm < 1e-3 ? ' ' + tex('P(X>' + G.m + ')' + resTex(M, M.pow(q, G.m))) + ' is so small that almost no run gets past ' + tex('m=' + G.m) + ' tosses — try a smaller ' + tex('m') + '.' : ''); return; }
      const R = gsim.runs;
      out.innerHTML = 'Runs: <b>' + R.toLocaleString('en-US') + '</b>. ' + tex('X>' + G.m) + ' happened <b>' + gsim.gm.toLocaleString('en-US') + '</b> times' +
        (gsim.gm ? '; of those, ' + tex('X>' + (G.m + G.n)) + ' happened <b>' + gsim.gmn.toLocaleString('en-US') + '</b> times: ' + tex(freqTex(gsim.gmn, gsim.gm)) : ' (too rare to estimate the conditional chance)') +
        '.<br>Over all runs, ' + tex('X>' + G.n) + ' happened ' + tex(freqTex(gsim.gn, R)) + '. Exact: ' + tex('P(X>' + G.n + ')' + resTex(M, M.pow(q, G.n))) + '.';
    }
  }

  /* ================================================================ the lab */
  function defaults() {
    const parity = MANY[0].rows();
    return {
      tab: 'two',
      two: { xs: [0, 1], ys: [0, 1], rows: [['1/2', '1/4'], ['1/8', '1/8']], param: null, pv: '1/8', src: 't2', condI: 0, cdf: 'x', fnOn: false, g: 'mod(x, 2)', h: 'floor(y/5)', fnCdf: 'u' },
      many: { names: 'X1, X2, X3', text: rowsText(parity), src: 'parity', cdf: 0 },
      iid: { fam: 'custom', q: {}, custom: { vals: FIVE.vals.slice(), probs: FIVE.probs.slice() }, n: 4, mode: 'pick', A: [4], c: 2, k: 1, a: 3, b: 4, src: 'five4', geo: { p: '1/2', m: 2, n: 3, src: 'lesson' } },
    };
  }
  function loadState() {
    const def = defaults();
    const got = Lab.store.get(STORE, null) || {};
    const st = { tab: ['two', 'many', 'iid'].includes(got.tab) ? got.tab : def.tab };
    st.two = Object.assign(def.two, got.two || {});
    const t = st.two;
    if (!Array.isArray(t.xs) || !Array.isArray(t.ys) || !Array.isArray(t.rows) || t.rows.length !== t.ys.length || t.rows.some(r => !Array.isArray(r) || r.length !== t.xs.length)) st.two = defaults().two;
    st.many = Object.assign(def.many, got.many || {});
    if (typeof st.many.text !== 'string') st.many = defaults().many;
    st.iid = Object.assign(def.iid, got.iid || {});
    st.iid.geo = Object.assign(defaults().iid.geo, (got.iid && got.iid.geo) || {});
    if (!Array.isArray(st.iid.A) || !st.iid.custom || !Array.isArray(st.iid.custom.vals)) st.iid = defaults().iid;
    return st;
  }

  const TABS = [
    { value: 'two', label: '1 · Two variables', cap: 'Type a joint table of ' + 'X and Y. Every cell is tested against (its column total) × (its row total) — lecture L2.1. Switch on g(X) and h(Y) to test functions of them — L2.10.', build: tabTwo },
    { value: 'many', label: '2 · Many variables', cap: 'Type a joint PMF of three variables as tuples. Every pair is tested, then the full product — pairwise vs mutual independence, lecture L2.2.', build: tabMany },
    { value: 'iid', label: '3 · i.i.d. calculator', cap: 'One PMF and n independent draws: all, none, exactly k or at least one draw in a set A; and the memoryless geometric — lecture L2.2.', build: tabIID },
  ];
  function render(host) {
    const st = loadState();
    const save = () => Lab.store.set(STORE, st);
    const bar = div('t3-tabs'), cap = div('t3-tabcap'), body = div('t3-body');
    host.append(bar, cap, body);
    bar.appendChild(Lab.seg(TABS.map(t => ({ label: t.label, value: t.value })), st.tab, v => { st.tab = v; save(); show(); }));
    function restart(part) { st[part] = defaults()[part]; save(); show(); }
    function show() {
      const t = TABS.find(x => x.value === st.tab) || TABS[0];
      cap.textContent = t.cap;
      body.className = 't3-body';
      const { side, main } = K.layout(body, 't3-' + t.value);
      body.classList.add('t3-lab');
      t.build({ side, main, st, save, restart });
    }
    show();
  }

  Lab.lab({
    id: 'lab-s2-indep', course: 's2', week: 2, order: 1,
    title: 'Independence lab', sub: 'Week 2 · L2.1–L2.2',
    topics: ['product rule', 'marginals', 'zero cell', 'conditional = marginal', 'mosaic', 'g(X) and h(Y)', 'pairwise vs mutual', 'i.i.d.', 'memoryless'],
    desc: 'Type a joint table and test every cell against (column total) × (row total), also for functions g(X) and h(Y); type tuples of three variables and test every pair and the full product; give one PMF and n for i.i.d. answers, and check that the geometric is memoryless.',
    render,
  });
})();
