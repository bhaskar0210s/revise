/* Playground lab (s2-w3-cov) — Covariance and correlation lab, Statistics II, Week 3, lectures L3.5–L3.6.
   The pair (X, Y) comes from a typed joint table of any size (K.gridEditor, read the way labs/s2-w1-joint.js does),
   from two independent distributions (two K.distPicker), or from Y = aX + b with a distribution of X.
   Panels: the answer; the table with its marginals; a scatter picture (dot area = probability, dashed lines at E[X]
   and E[Y], each dot coloured by the sign of (x − E[X])(y − E[Y])); E[X] and E[Y]; E[XY] cell by cell; Cov(X, Y)
   two ways; Var, SD and ρ(X, Y) with the bound −SD(X)SD(Y) ≤ Cov ≤ SD(X)SD(Y); the properties with the learner's
   a, b, c, d; independence ⇒ Cov = 0 (not the reverse); ρ = ±1 exactly when Y = aX + b.
   Exact fractions (Lab.F) throughout; a value becomes a decimal only when its fraction would overflow. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const Frac = Lab.Frac;
  const K = Lab.play;
  const KEY = 'lab:s2-cov';
  const V4 = 'tZs2xS6XfYg', V5 = 'UoZc81wNK4I', V6 = 'BtZXJohBrno';
  const tex = (s, d) => Lab.tex(s, d);
  const esc = Lab.esc;
  /** a link into a lecture at mm:ss */
  const at = (id, mm, ss) => Lab.vlink(id, mm + (ss || 0) / 60);
  const COV = '\\operatorname{Cov}', VAR = '\\operatorname{Var}', SD = '\\operatorname{SD}';
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ================================================================ exact arithmetic (Frac, or a float on overflow) */
  const isEx = v => v instanceof Frac && !v.approx;
  const fix = (r, a, b, op) => (r.approx ? op(Number(a), Number(b)) : r);
  const add = (a, b) => (isEx(a) && isEx(b) ? fix(a.add(b), a, b, (x, y) => x + y) : Number(a) + Number(b));
  const sub = (a, b) => (isEx(a) && isEx(b) ? fix(a.sub(b), a, b, (x, y) => x - y) : Number(a) - Number(b));
  const mul = (a, b) => (isEx(a) && isEx(b) ? fix(a.mul(b), a, b, (x, y) => x * y) : Number(a) * Number(b));
  const div = (a, b) => (isEx(a) && isEx(b) ? fix(a.div(b), a, b, (x, y) => x / y) : Number(a) / Number(b));
  const sum = list => list.reduce((s, v) => add(s, v), F(0));
  const isZero = v => (isEx(v) ? v.isZero() : Math.abs(Number(v)) < 1e-12);
  const sgn = v => (isZero(v) ? 0 : Number(v) > 0 ? 1 : -1);
  const same = (a, b) => (isEx(a) && isEx(b) ? a.eq(b) : Math.abs(Number(a) - Number(b)) <= 1e-9 * Math.max(1, Math.abs(Number(a)), Math.abs(Number(b))));
  const neg = v => (isEx(v) ? v.neg() : -Number(v));
  const abs = v => (sgn(v) < 0 ? neg(v) : v);
  function exactOf(x) { try { const f = Frac.of(x); return f.approx ? x : f; } catch (e) { return x; } }
  /** a value from the learner's input: an exact fraction when it is one, else a float */
  const toV = f => (f instanceof Frac ? (f.approx ? Number(f) : f) : Number.isInteger(f) ? F(f) : exactOf(f));
  function isqrt(n) { if (n < 0 || !Number.isSafeInteger(n)) return null; const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; }
  /** the exact square root of a fraction that is a perfect square, else null */
  function sqrtEx(v) { if (!isEx(v) || v.n < 0) return null; const a = isqrt(v.n), b = isqrt(v.d); return a != null && b != null ? new Frac(a, b) : null; }
  const sqrtV = v => { const s = sqrtEx(v); return s != null ? s : Math.sqrt(Math.max(0, Number(v))); };

  /* ================================================================ numbers as TeX */
  function fl(x) {
    x = Number(x);
    if (!Number.isFinite(x)) return '\\text{?}';
    if (Math.abs(x) < 5e-13) return '0';
    if (Math.abs(x) >= 1e-4) return Lab.fmtDec(x, 4);
    const [m, e] = x.toExponential(2).split('e');
    return m + '\\times 10^{' + Number(e) + '}';
  }
  /** a number: an exact fraction (small, or \frac when big) or a decimal */
  const nt = (v, big) => (isEx(v) ? (big ? v.tex() : v.tex().replace('\\frac', '\\tfrac')) : fl(v));
  /** in parentheses when negative */
  const np = v => (sgn(v) < 0 ? '(' + nt(v) + ')' : nt(v));
  /** in parentheses always, as the lecture writes (−1)(1)·2/15 */
  const nb = v => '(' + nt(v) + ')';
  const dec4 = v => Math.abs(Number(v) * 1e4 - Math.round(Number(v) * 1e4)) < 1e-9;
  /** "= value" with its decimal next to it: "= 1/8 = 0.125", "= −2/15 ≈ −0.1333"; a float: "≈ 0.1234" */
  function eqv(v, big) {
    if (!isEx(v)) return '\\approx ' + fl(v);
    if (v.d === 1) return '=' + v.n;
    return '=' + nt(v, big) + (dec4(v) ? '=' : '\\approx ') + fl(v);
  }
  /** "= value" without the decimal */
  const eqx = v => (isEx(v) ? '=' + nt(v) : '\\approx ' + fl(v));
  /** a + b − c (negative terms subtract); long lists keep both ends */
  function sumTex(terms, max = 14) {
    if (!terms.length) return '0';
    const part = (t, k) => { const s = nt(t); return k === 0 || s.startsWith('-') ? s : '+' + s; };
    if (terms.length <= max) return terms.map(part).join('');
    return terms.slice(0, max - 4).map(part).join('') + '+\\dots' + terms.slice(-2).map((t, k) => part(t, k + 1)).join('') + '\\ {\\scriptstyle(' + terms.length + '\\text{ terms})}';
  }
  /** TeX strings joined with +, long lists keep both ends */
  function joinT(list, max = 12) {
    if (list.length <= max) return list.join('+');
    return list.slice(0, max - 4).join('+') + '+\\dots+' + list.slice(-2).join('+');
  }
  /** lhs = a₁·b₁ + a₂·b₂ + … = values = total */
  function prodChain(lhs, pairs, total, sq) {
    const prods = pairs.map(([a, b]) => (sq ? mul(mul(a, a), b) : mul(a, b)));
    return lhs + '=' + joinT(pairs.map(([a, b]) => np(a) + (sq ? '^2' : '') + '\\cdot ' + nt(b))) + (pairs.length > 1 ? '=' + sumTex(prods) : '') + eqv(total);
  }
  /** name = sym, then the terms on a second row: = t1 + t2 + … = total */
  const chain2 = (name, sym, terms, total) => (terms.length > 1 ? '\\begin{aligned}' + name + '&=' + sym + '\\\\&=' + sumTex(terms) + eqv(total) + '\\end{aligned}' : name + '=' + sym + eqv(total));
  /** several display formulas, each sliding sideways on its own */
  const lines = list => Lab.block(el => list.filter(Boolean).forEach(src => el.appendChild(h('div', { class: 's-math', html: Lab.tex(src, true) }))));
  /** a·v + b as TeX (2X+1, -X, \tfrac12 x-3) */
  function linTex(a, v, b) {
    let s = isZero(a) ? '' : same(a, F(1)) ? v : same(a, F(-1)) ? '-' + v : nt(a) + v;
    if (!isZero(b)) s += s ? (sgn(b) < 0 ? '-' + nt(abs(b)) : '+' + nt(b)) : nt(b);
    return s || '0';
  }
  /** {v1, v2, …} for inline text, wrapping on phones */
  function setTex(vals) {
    const parts = vals.map(v => nt(v));
    const cut = parts.length > 12 ? parts.slice(0, 8).concat(['\\dots'], parts.slice(-2)) : parts;
    return '\\{' + cut.join(',\\allowbreak\\ ') + '\\}';
  }
  /** plain text (SVG labels, tooltips) */
  const txt = v => (isEx(v) ? v.toString() : Lab.fmtDec(Number(v), 4)).replace(/^-/, '−');
  const nw = s => '<span class="cv-nw">' + tex(s) + '</span>';
  const mark = ok => (ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>');

  /* ================================================================ lecture examples */
  const T15 = { xs: ['-1', '0', '1'], ys: ['-1', '0', '1'], cells: [['1/15', '2/15', '2/15'], ['2/15', '1/15', '2/15'], ['2/15', '2/15', '1/15']] };
  const QUART = { xs: ['0', '1'], ys: ['0', '1'], cells: [['1/4', '1/4'], ['1/4', '1/4']] };
  const SWAP = { xs: ['0', '1'], ys: ['0', '1'], cells: [['0', '1/2'], ['1/2', '0']] };
  const DEP = { xs: ['-1', '0', '1'], ys: ['0', '1'], cells: [['1/8', '1/4', '1/8'], ['1/4', '0', '1/4']] };
  const BIT = ['0', '1'];
  const UNI = (a, b) => ({ fam: 'uniform', params: { uniform: { a, b } }, custom: null });
  /** the L3.6 table: row y₁ holds ¼ − x, ¼ + x; row y₂ holds ¼ + x, ¼ − x (labels kept) */
  function paramGrid(xs, g) {
    const x = K.parseNum(xs) || F(1, 8);
    const lo = F(1, 4).sub(x), hi = F(1, 4).add(x);
    const dec = /[.%]/.test(String(xs));
    const s = f => (dec && dec4(f) ? Lab.fmtDec(Number(f), 6) : f.toString());
    return { xs: (g && g.xs ? g.xs : BIT).slice(0, 2), ys: (g && g.ys ? g.ys : BIT).slice(0, 2), cells: [[s(lo), s(hi)], [s(hi), s(lo)]] };
  }
  const PRESETS = [
    { id: 't15', label: 'L3.5 · Computing covariance: the fifteenths table', st: { src: 'table', grid: T15, param: null },
      source: 'L3.5 at ' + at(V5, 8, 40) + ', “Example: computing covariance”. The slide first has ' + tex('\\tfrac1{15}') + ' in the cell ' + tex('X=1,\\ Y=0') + ' (the cells would add up to ' + tex('\\tfrac{14}{15}') + '); the professor corrects it to ' + tex('\\tfrac2{15}') + ' at ' + at(V5, 9, 30) + '. Both marginals are ' + tex('(\\tfrac13,\\tfrac13,\\tfrac13)') + ', so ' + tex('E[X]=E[Y]=0') + ' and ' + tex(COV + '(X,Y)=E[XY]=-\\tfrac2{15}') + ' (' + at(V5, 11, 0) + ').' },
    { id: 'quart', label: 'L3.5 · Motivation, table 1: every cell 1/4', st: { src: 'table', grid: QUART, param: null },
      source: 'L3.5 at ' + at(V5, 1, 20) + ', “Motivation”, the left table. The slide shows ' + tex('\\tfrac12') + ' in every cell; the professor corrects it to ' + tex('\\tfrac14') + ' at ' + at(V5, 1, 50) + '. Both marginals are ' + tex('(\\tfrac12,\\tfrac12)') + ' (' + at(V5, 2, 0) + ') and X, Y are independent (' + at(V5, 3, 20) + '). The lecture computes no covariance for it; this lab does.' },
    { id: 'swap', label: 'L3.5 · Motivation, table 2: X decides Y', st: { src: 'table', grid: SWAP, param: null },
      source: 'L3.5 at ' + at(V5, 1, 20) + ', “Motivation”, the right table: the same marginals as table 1 (' + at(V5, 2, 0) + '), but “if X is 1 then Y is 0, if X is 0 then Y is 1” (' + at(V5, 3, 20) + '). Covariance is the one number meant to tell such tables apart (' + at(V5, 4, 0) + '). Here ' + tex('Y=1-X') + ', so ' + tex('\\rho(X,Y)=-1') + ' — the L3.6 rule at ' + at(V6, 3, 30) + '.' },
    { id: 'dep', label: 'L3.5 · Uncorrelated but dependent', st: { src: 'table', grid: DEP, param: null },
      source: 'L3.5 at ' + at(V5, 16, 40) + ', “Covariance and independence”. ' + tex('f_{XY}(0,1)=0\\ne f_X(0)\\,f_Y(1)=\\tfrac14\\cdot\\tfrac12') + ', so X and Y are dependent (' + at(V5, 17, 40) + '); yet ' + tex('E[X]=0') + ', ' + tex('E[Y]=\\tfrac12') + ', ' + tex('E[XY]=0') + ', so ' + tex(COV + '(X,Y)=0') + ' (' + at(V5, 18, 30) + ').' },
    { id: 'px', label: 'L3.6 · Problem: cells 1/4 − x, 1/4 + x (you set x)', st: { src: 'table', grid: { xs: BIT, ys: BIT }, param: { x: '1/8' } },
      source: 'L3.6 at ' + at(V6, 4, 30) + ', “Problem”, with ' + tex('-\\tfrac14\\le x\\le\\tfrac14') + '. The lecture finds ' + tex('E[XY]=\\tfrac14-x') + ' and ' + tex(COV + '(X,Y)=-x') + ' (' + at(V6, 5, 30) + '), ' + tex(VAR + '(X)=' + VAR + '(Y)=\\tfrac14') + ' (' + at(V6, 6, 0) + '), ' + tex('\\rho(X,Y)=-4x') + ' (' + at(V6, 6, 30) + '). It starts here at ' + tex('x=\\tfrac18') + '; move x on the left.' },
    { id: 'pxp', label: 'L3.6 · Same problem, x = −1/4: ρ = 1', st: { src: 'table', grid: { xs: BIT, ys: BIT }, param: { x: '-1/4' } },
      source: 'L3.6 at ' + at(V6, 6, 30) + ': “as x varies between −1/4 and 1/4, ρ will vary between 1 and −1”. At ' + tex('x=-\\tfrac14') + ' the cells are ' + tex('\\tfrac12,\\ 0,\\ 0,\\ \\tfrac12') + ': ' + tex('Y=X') + ' and ' + tex('\\rho=-4x=1') + '.' },
    { id: 'pxm', label: 'L3.6 · Same problem, x = 1/4: ρ = −1', st: { src: 'table', grid: { xs: BIT, ys: BIT }, param: { x: '1/4' } },
      source: 'L3.6 at ' + at(V6, 6, 30) + ': at ' + tex('x=\\tfrac14') + ' the cells are ' + tex('0,\\ \\tfrac12,\\ \\tfrac12,\\ 0') + ' — the L3.5 motivation table 2 — so ' + tex('Y=1-X') + ' and ' + tex('\\rho=-4x=-1') + '.' },
    { id: 'shift', label: 'L3.6 · Moved: X in {c, c + 1}, Y in {d, d + 1}', st: { src: 'table', grid: { xs: ['2', '3'], ys: ['4', '5'] }, param: { x: '1/8' } },
      source: 'L3.6 at ' + at(V6, 7, 30) + ': the same cells with ' + tex('X\\in\\{c,\\ c+1\\}') + ', ' + tex('Y\\in\\{d,\\ d+1\\}') + '. The lecture gets ' + tex('E[X]=c+\\tfrac12') + ', ' + tex('E[Y]=d+\\tfrac12') + ' (' + at(V6, 8, 0) + '), ' + tex('E[XY]=cd+\\tfrac c2+\\tfrac d2+\\tfrac14-x') + ' (' + at(V6, 10, 0) + '), and again ' + tex(COV + '(X,Y)=-x') + ', ' + tex('\\rho=-4x') + ' (' + at(V6, 10, 30) + '). It keeps c and d as letters; here ' + tex('c=2,\\ d=4') + ' — type others in the label boxes of the table.' },
    { id: 'dice', label: 'L3.4 · Two fair dice, independent: Var(X + Y)', st: { src: 'indep', dx: UNI(1, 6), dy: UNI(1, 6) },
      source: 'L3.4 at ' + at(V4, 23, 0) + ', “Example: sum of two dice (independent)”: ' + tex(VAR + '(X+Y)=' + VAR + '(X)+' + VAR + '(Y)=2\\cdot\\tfrac{35}{12}=\\tfrac{35}6') + ' (the on-screen correction at ' + at(V4, 23, 40) + '). Independent, so ' + tex(COV + '(X,Y)=0') + ' (L3.5 at ' + at(V5, 15, 30) + ') and the ' + tex('2\\,' + COV + '(X,Y)') + ' term in the Properties panel is 0.' },
    { id: 'line', label: 'L3.6 · ρ = ±1 exactly when Y = aX + b (Y = 1 − X)', st: { src: 'line', dl: { fam: 'bernoulli', params: { bernoulli: { p: '1/2' } }, custom: null }, la: '-1', lb: '1' },
      source: 'L3.6 at ' + at(V6, 3, 30) + ': ' + tex('\\rho(X,Y)=\\pm1') + ' exactly when ' + tex('Y=aX+b') + ' with ' + tex('a\\ne 0') + ' (with probability 1). The slide has no numbers; this starts from the L3.5 motivation table 2: ' + tex('X\\sim\\text{Bernoulli}(\\tfrac12)') + ' and ' + tex('Y=1-X') + '. Change the distribution of X, a and b.' },
  ];
  const DEF = () => ({
    src: 'table', grid: clone(T15), param: null,
    dx: UNI(1, 6), dy: UNI(1, 6), dl: UNI(1, 6), la: '-2', lb: '7',
    k: { a: '2', b: '1', c: '3', d: '-1' },
    loaded: 't15',
  });
  const FAMS = ['uniform', 'bernoulli', 'binomial', 'custom'];
  const RANGES = { uniform: { a: [-10, 10], b: [-10, 10] }, binomial: { n: [1, 12] } };
  const MAXCELLS = 900, GRIDCELLS = 64;

  /* ================================================================ a number box that takes 1/8, −0.25, 3 */
  function fracField({ label, value, min, max, step, lim, onChange }) {
    const input = h('input', { class: 'field mono pl-num cv-frac', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off' });
    const range = h('input', { class: 'slider pl-range', type: 'range', min, max, step, value: Number(K.parseNum(value) || 0), 'aria-label': 'slider' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), msg);
    const paint = v => { const c = Math.min(max, Math.max(min, v)); range.value = c; range.style.setProperty('--pct', ((c - min) / (max - min)) * 100 + '%'); };
    const show = f => Lab.setHTML(msg, isEx(f) && f.d !== 1 ? tex('=' + fl(f) + (dec4(f) ? '' : '\\dots')) : '');
    function read(s) {
      const f = K.parseNum(s);
      if (f == null || !Number.isFinite(Number(f))) return { err: 'Type a number such as 1/8, -0.25 or 3.' };
      if (lim && (Number(f) < lim[0] - 1e-12 || Number(f) > lim[1] + 1e-12)) return { err: 'Keep it from ' + lim[2] + ' to ' + lim[3] + ' (else a cell is negative).' };
      return { f };
    }
    input.addEventListener('input', Lab.debounce(() => {
      const r = read(input.value);
      if (r.err) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">' + r.err + '</span>'); return; }
      input.classList.remove('bad'); paint(Number(r.f)); show(r.f); onChange(r.f, input.value.trim());
    }, 220));
    range.addEventListener('input', () => {
      const s = String(+(+range.value).toPrecision(12));
      input.value = s; input.classList.remove('bad');
      const f = K.parseNum(s);
      paint(Number(f)); show(f); onChange(f, s);
    });
    paint(Number(K.parseNum(value) || 0));
    const f0 = K.parseNum(value); if (f0 != null) show(f0);
    wrap.set = s => { input.value = String(s); input.classList.remove('bad'); const f = K.parseNum(s); if (f != null) { paint(Number(f)); show(f); } };
    wrap.input = input;
    return wrap;
  }

  /* ================================================================ the model */
  const order = arr => arr.map((_, k) => k).sort((a, b) => Number(arr[a]) - Number(arr[b]));
  function parseTable(g) {
    const xv = g.xs.map(s => K.parseNum(s)), yv = g.ys.map(s => K.parseNum(s));
    if (xv.some(v => v == null) || yv.some(v => v == null)) throw new Error('every value of ' + tex('X') + ' (top row) and of ' + tex('Y') + ' (left column) must be a number — a random variable outputs numbers.');
    const xn = xv.map(toV), yn = yv.map(toV);
    if (new Set(xn.map(Number)).size !== xn.length || new Set(yn.map(Number)).size !== yn.length) throw new Error('two columns (or two rows) have the same value. Each value may appear only once.');
    const bad = [];
    const cells = g.cells.map((r, j) => r.map((s, i) => {
      const f = K.parseNum(s);
      const where = 'the cell ' + tex('(' + nt(xn[i]) + ',' + nt(yn[j]) + ')');
      if (f == null) { bad.push(where + ' (“' + esc(s) + '”) is not a number'); return null; }
      if (Number(f) < 0) { bad.push(where + ' is negative'); return null; }
      if (Number(f) > 1) { bad.push(where + ' is bigger than 1'); return null; }
      return toV(f);
    }));
    if (bad.length) throw new Error(bad.slice(0, 3).join('; ') + (bad.length > 3 ? '; and ' + (bad.length - 3) + ' more' : '') + ' — a probability is a number from 0 to 1.');
    const total = sum(cells.flat());
    if (!same(total, F(1))) throw new Error('the cells add up to ' + tex(nt(total) + (isEx(total) && total.d !== 1 ? '\\approx ' + fl(total) : '')) + ', not 1. Press “Rescale to total 1” under the table, or edit a cell.');
    if (xn.length * yn.length > MAXCELLS) throw new Error('that is ' + xn.length * yn.length + ' cells; at most ' + MAXCELLS + ' here.');
    const ox = order(xn), oy = order(yn);
    return { xs: ox.map(i => xn[i]), ys: oy.map(j => yn[j]), p: ox.map(i => oy.map(j => cells[j][i])) };
  }
  function distVals(d) { return { vals: d.vals.map(toV), p: d.p.map(toV) }; }
  function fromDists(dx, dy) {
    const X = distVals(dx), Y = distVals(dy);
    if (X.vals.length * Y.vals.length > MAXCELLS) throw new Error('that is ' + X.vals.length * Y.vals.length + ' cells; at most ' + MAXCELLS + ' here. Use fewer values.');
    return { xs: X.vals, ys: Y.vals, p: X.vals.map((_, i) => Y.vals.map((_, j) => mul(X.p[i], Y.p[j]))), mx: X.p, my: Y.p };
  }
  function fromLine(dl, a, b) {
    const X = distVals(dl);
    const yv = X.vals.map(x => add(mul(a, x), b));
    const ys = [];
    order(yv).forEach(k => { if (!ys.some(y => same(y, yv[k]))) ys.push(yv[k]); });
    return { xs: X.vals, ys, p: X.vals.map((_, i) => ys.map(y => (same(y, yv[i]) ? X.p[i] : F(0)))) };
  }
  function build(J) {
    const nx = J.xs.length, ny = J.ys.length;
    const fx = J.xs.map((_, i) => sum(J.p[i]));
    const fy = J.ys.map((_, j) => sum(J.p.map(col => col[j])));
    const EX = sum(J.xs.map((x, i) => mul(x, fx[i]))), EY = sum(J.ys.map((y, j) => mul(y, fy[j])));
    const EX2 = sum(J.xs.map((x, i) => mul(mul(x, x), fx[i]))), EY2 = sum(J.ys.map((y, j) => mul(mul(y, y), fy[j])));
    const dX = J.xs.map(x => sub(x, EX)), dY = J.ys.map(y => sub(y, EY));
    const cells = [];
    J.xs.forEach((x, i) => J.ys.forEach((y, j) => {
      const p = J.p[i][j], xy = mul(x, y), dd = mul(dX[i], dY[j]);
      cells.push({ k: cells.length, i, j, x, y, p, pos: Number(p) > 0, xy, xyp: mul(xy, p), dd, ddp: mul(dd, p), sign: sgn(dd), prod: mul(fx[i], fy[j]) });
    }));
    const cellAt = (i, j) => cells[i * ny + j];
    const EXY = sum(cells.map(c => c.xyp));
    const cov = sub(EXY, mul(EX, EY));
    const cov2 = sum(cells.map(c => c.ddp));
    let varX = sub(EX2, mul(EX, EX)), varY = sub(EY2, mul(EY, EY));
    if (!isEx(varX) && Math.abs(varX) < 1e-12) varX = 0;
    if (!isEx(varY) && Math.abs(varY) < 1e-12) varY = 0;
    const sdX = sqrtV(varX), sdY = sqrtV(varY);
    const defined = !isZero(varX) && !isZero(varY);
    const vv = mul(varX, varY);
    const sdXY = defined ? sqrtV(vv) : null;
    const rho = defined ? div(cov, sdXY) : null;
    const rho2 = defined ? div(mul(cov, cov), vv) : null;
    const bad = cells.filter(c => !same(c.p, c.prod));
    // S = X + Y, grouped from the cells with positive probability
    const smap = new Map();
    cells.filter(c => c.pos).forEach(c => {
      const s = add(c.x, c.y);
      const key = isEx(s) ? s.toString() : String(+Number(s).toPrecision(12));
      let g = smap.get(key);
      if (!g) { g = { s, p: F(0), cells: [] }; smap.set(key, g); }
      g.p = add(g.p, c.p); g.cells.push(c);
    });
    const S = [...smap.values()].sort((a, b) => Number(a.s) - Number(b.s));
    const ES = sum(S.map(g => mul(g.s, g.p))), ES2 = sum(S.map(g => mul(mul(g.s, g.s), g.p)));
    const varS = sub(ES2, mul(ES, ES));
    let line = null;
    if (defined && same(rho2, F(1))) {
      const slope = div(cov, varX), icpt = sub(EY, mul(slope, EX));
      line = { slope, icpt, ok: cells.filter(c => c.pos).every(c => same(c.y, add(mul(slope, c.x), icpt))) };
    }
    return Object.assign({}, J, { nx, ny, fx, fy, EX, EY, EX2, EY2, dX, dY, cells, cellAt, EXY, cov, cov2, varX, varY, sdX, sdY, defined, vv, sdXY, rho, rho2, bad, S, ES, ES2, varS, line });
  }

  /* ================================================================ a table drawn the lecture's way: X across, Y down */
  function gridTable(o) {
    const m = o.m;
    const t = h('table', { class: 'tbl cv-grid' + (o.cls ? ' ' + o.cls : '') });
    const hr = h('tr', {}, h('th', { class: 'cv-corner', html: tex(o.corner || 'y\\,\\backslash\\,x') }));
    m.xs.forEach((x, i) => hr.appendChild(h('th', { class: 'cv-xh', html: o.xh ? o.xh(i) : tex(nt(x)) })));
    if (o.side) hr.appendChild(h('th', { class: 'cv-mh', html: o.sideHead || '' }));
    t.appendChild(h('thead', {}, hr));
    const tb = h('tbody');
    m.ys.forEach((y, j) => {
      const tr = h('tr', {}, h('th', { class: 'cv-yh', html: o.yh ? o.yh(j) : tex(nt(y)) }));
      m.xs.forEach((_, i) => { const c = o.cell(m.cellAt(i, j)) || {}; tr.appendChild(h('td', { class: 'cv-c' + (c.cls ? ' ' + c.cls : ''), html: c.html || '' })); });
      if (o.side) tr.appendChild(h('td', { class: 'cv-m', html: o.side(j) }));
      tb.appendChild(tr);
    });
    if (o.foot) {
      const tr = h('tr', { class: 'cv-foot' }, h('th', { class: 'cv-mh', html: o.footHead || '' }));
      m.xs.forEach((_, i) => tr.appendChild(h('td', { class: 'cv-m', html: o.foot(i) })));
      if (o.side) tr.appendChild(h('td', { class: 'cv-m cv-tot', html: o.total || '' }));
      tb.appendChild(tr);
    }
    t.appendChild(tb);
    return h('div', { class: 'cv-wide' }, t);
  }
  const blockOf = el => Lab.block(host => host.appendChild(el));

  /* ================================================================ the lab */
  function covLab(host) {
    const saved = Lab.store.get(KEY, null) || {};
    const st = Object.assign(DEF(), saved);
    ['dx', 'dy', 'dl'].forEach(k => (st[k] = Object.assign(DEF()[k], saved[k] || {})));
    st.k = Object.assign(DEF().k, saved.k || {});
    if (!st.grid || !Array.isArray(st.grid.xs) || !Array.isArray(st.grid.ys) || !Array.isArray(st.grid.cells)) st.grid = clone(T15);
    if (!['table', 'indep', 'line'].includes(st.src)) st.src = 'table';
    if (st.param && st.param.x != null) st.grid = paramGrid(st.param.x, st.grid);
    const save = () => Lab.store.set(KEY, st);
    let model = null, batch = false, xIn = null, yIn = null, lIn = null, sel = -1;
    const ctl = {}, P = {};

    /* ---------------- controls */
    const { side, main } = K.layout(host, 'cv-lab');
    side.appendChild(K.group('Lecture examples'));
    ctl.pre = K.presets({ items: PRESETS, onPick: it => loadPreset(it) });
    side.appendChild(ctl.pre);
    side.appendChild(K.group('1 · Your pair (X, Y)'));
    ctl.src = Lab.seg([{ label: 'Type a table', value: 'table' }, { label: 'Independent', value: 'indep' }, { label: 'Y = aX + b', value: 'line' }], st.src, v => { if (v === st.src) return; setSrc(v); touched(); update(); });
    ctl.src.classList.add('cv-seg');
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Where does the joint PMF come from?' }), ctl.src));
    ctl.tableBox = h('div', { class: 'cv-box' });
    ctl.paramBox = h('div', { class: 'cv-param' });
    ctl.x = fracField({ label: 'The lecture’s ' + tex('x') + ': row 1 holds ' + tex('\\tfrac14-x,\\ \\tfrac14+x') + ', row 2 holds ' + tex('\\tfrac14+x,\\ \\tfrac14-x'), value: (st.param && st.param.x) || '1/8', min: -0.25, max: 0.25, step: 0.0125, lim: [-0.25, 0.25, '−1/4', '1/4'], onChange: (f, s) => onParam(s) });
    ctl.paramBox.appendChild(ctl.x);
    ctl.grid = K.gridEditor({ label: 'Your table: values of ' + tex('X') + ' across the top, of ' + tex('Y') + ' down the side. Cells as 1/8, 0.125 or 12.5%.', xs: st.grid.xs, ys: st.grid.ys, cells: st.grid.cells, onChange: () => onGrid() });
    ctl.tableBox.append(ctl.paramBox, ctl.grid);
    ctl.indepBox = h('div', { class: 'cv-box' });
    const mkPick = (lab, d, which, xName) => K.distPicker({ label: lab, families: FAMS, ranges: RANGES, value: d.fam, params: clone(d.params || {}), custom: d.custom || undefined, xName, onChange: r => onPick(which, r) });
    ctl.pickX = mkPick('Distribution of ' + tex('X'), st.dx, 'x', 'X');
    ctl.pickY = mkPick('Distribution of ' + tex('Y'), st.dy, 'y', 'Y');
    ctl.indepBox.append(ctl.pickX, ctl.pickY, K.note('Independent: every cell is ' + tex('f_{XY}(x,y)=f_X(x)\\,f_Y(y)') + '.'));
    ctl.lineBox = h('div', { class: 'cv-box' });
    ctl.pickL = mkPick('Distribution of ' + tex('X'), st.dl, 'l', 'X');
    ctl.la = fracField({ label: 'Slope ' + tex('a') + ' in ' + tex('Y=aX+b'), value: st.la, min: -5, max: 5, step: 0.5, onChange: (f, s) => { st.la = s; touched(); update(); } });
    ctl.lb = fracField({ label: 'Intercept ' + tex('b'), value: st.lb, min: -10, max: 10, step: 0.5, onChange: (f, s) => { st.lb = s; touched(); update(); } });
    ctl.lineBox.append(ctl.pickL, h('div', { class: 'cv-two' }, ctl.la, ctl.lb), K.note('Each value ' + tex('x') + ' gives one ' + tex('y=ax+b') + ', so every column of the table has one non-zero cell.'));
    side.append(ctl.tableBox, ctl.indepBox, ctl.lineBox);
    side.appendChild(K.group('2 · Your constants a, b, c, d'));
    side.appendChild(K.note('For the Properties panel: ' + tex('U=aX+b') + ' and ' + tex('V=cY+d') + '.'));
    const four = h('div', { class: 'cv-four' });
    ['a', 'b', 'c', 'd'].forEach(k => {
      ctl['k' + k] = fracField({ label: tex(k), value: st.k[k], min: -5, max: 5, step: 0.5, onChange: (f, s) => { st.k[k] = s; save(); if (model) { drawProps(model); dump(model); } } });
      four.appendChild(ctl['k' + k]);
    });
    side.appendChild(four);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, {}); covLab(host); }, 'btn ghost sm')));

    /* ---------------- panels */
    ctl.msg = h('div', { class: 'cv-msg', hidden: true });
    P.ans = K.answer();
    P.table = K.panel('Your joint PMF and its marginals');
    P.scatter = K.panel('The picture: each point ' + tex('(x,y)') + ', its area the probability');
    P.means = K.panel(tex('E[X]') + ' and ' + tex('E[Y]') + ' from the marginals');
    P.exy = K.panel(tex('E[XY]') + ': every cell’s ' + tex('x\\cdot y\\cdot f_{XY}(x,y)'));
    P.cov = K.panel(tex(COV + '(X,Y)') + ', two ways');
    P.var = K.panel(tex(VAR) + ', ' + tex(SD) + ' and the correlation coefficient ' + tex('\\rho(X,Y)'));
    P.props = K.panel('Properties, with your numbers');
    P.indep = K.panel('Independent ⇒ uncorrelated, but not the other way');
    P.line = K.panel(tex('\\rho=\\pm1') + ' exactly when ' + tex('Y=aX+b'));
    main.append(ctl.msg, P.ans, P.table, P.scatter, P.means, P.exy, P.cov, P.var, P.props, P.indep, P.line);
    Lab.setHTML(P.ans, '<div class="pl-ans-ev muted">Reading your values…</div>');
    host.__cov = { get model() { return model; }, get st() { return st; }, redraw: () => { if (model) drawAll(model); } };

    /* ---------------- input handlers */
    function setSrc(v) {
      st.src = v;
      ctl.src.set(v);
      ctl.tableBox.hidden = v !== 'table';
      ctl.indepBox.hidden = v !== 'indep';
      ctl.lineBox.hidden = v !== 'line';
      ctl.paramBox.hidden = !st.param;
    }
    function showPreset(id) {
      const k = PRESETS.findIndex(p => p.id === id);
      st.loaded = k >= 0 ? id : null;
      ctl.pre.select.value = k >= 0 ? String(k) : '';
      const hint = ctl.pre.querySelector('.pl-hint');
      if (hint) Lab.setHTML(hint, k >= 0 ? 'From: ' + PRESETS[k].source : '');
    }
    function touched() { if (!batch && st.loaded) showPreset(null); }
    function readGrid() {
      const ed = ctl.grid;
      const xs = Lab.$$('.ge-x', ed).map(i => i.value), ys = Lab.$$('.ge-y', ed).map(i => i.value);
      const cs = Lab.$$('.ge-c', ed).map(i => i.value);
      return { xs, ys, cells: ys.map((_, j) => xs.map((_, i) => cs[j * xs.length + i])) };
    }
    function onGrid() {
      if (batch) return;
      const g = readGrid();
      if (JSON.stringify(g) === JSON.stringify(st.grid)) return;
      const cellsChanged = JSON.stringify(g.cells) !== JSON.stringify(st.grid.cells);
      st.grid = g;
      if (cellsChanged && st.param) { st.param = null; ctl.paramBox.hidden = true; }
      touched();
      update();
    }
    function onParam(s) {
      if (!st.param) return;
      st.param.x = s;
      const g = paramGrid(s, st.grid);
      batch = true;
      try { ctl.grid.set(g.xs, g.ys, g.cells); } finally { batch = false; }
      st.grid = g;
      if (st.loaded === 'pxp' || st.loaded === 'pxm') showPreset('px');
      update();
    }
    function serialQ(q) { const o = {}; Object.keys(q || {}).forEach(k => (o[k] = q[k] instanceof Frac ? q[k].toString() : q[k])); return o; }
    function onPick(which, r) {
      const fam = r.fam || 'custom';
      const d = which === 'x' ? st.dx : which === 'y' ? st.dy : st.dl;
      const before = JSON.stringify(d);
      if (r.ok) {
        d.fam = fam;
        if (fam === 'custom') d.custom = { vals: r.dist.vals.slice(), probs: r.dist.p.map(String) };
        else { d.params = d.params || {}; d.params[fam] = serialQ(r.q); }
      }
      if (which === 'x') xIn = r; else if (which === 'y') yIn = r; else lIn = r;
      if (batch) return;
      if ((which === 'l' ? 'line' : 'indep') !== st.src) { save(); return; }
      if (JSON.stringify(d) !== before || !r.ok) touched();
      update();
    }
    function loadPreset(it) {
      const d = clone(it.st);
      batch = true;
      try {
        if (d.src === 'table') {
          st.param = d.param || null;
          const g = st.param ? paramGrid(st.param.x, d.grid) : d.grid;
          st.grid = g;
          ctl.grid.set(g.xs, g.ys, g.cells);
          if (st.param) ctl.x.set(st.param.x);
        } else if (d.src === 'indep') {
          st.dx = d.dx; st.dy = d.dy;
          ctl.pickX.setFamily(d.dx.fam, Object.assign({}, d.dx.params[d.dx.fam]));
          ctl.pickY.setFamily(d.dy.fam, Object.assign({}, d.dy.params[d.dy.fam]));
        } else {
          st.dl = d.dl; st.la = d.la; st.lb = d.lb;
          ctl.pickL.setFamily(d.dl.fam, Object.assign({}, d.dl.params[d.dl.fam]));
          ctl.la.set(d.la); ctl.lb.set(d.lb);
        }
        setSrc(d.src);
      } finally { batch = false; }
      showPreset(it.id);
      update();
    }

    /* ---------------- update */
    function jointFromInputs() {
      if (st.src === 'table') return Object.assign(parseTable(st.grid), { src: 'table' });
      if (st.src === 'indep') {
        if (!xIn || !yIn) return null;
        if (!xIn.ok || !yIn.ok) throw new Error('your PMF of ' + tex(!xIn.ok ? 'X' : 'Y') + ' is not valid yet (its probabilities must add up to 1).');
        return Object.assign(fromDists(xIn.dist, yIn.dist), { src: 'indep', dX: xIn, dY: yIn });
      }
      if (!lIn) return null;
      if (!lIn.ok) throw new Error('your PMF of ' + tex('X') + ' is not valid yet (its probabilities must add up to 1).');
      const a = K.parseNum(st.la), b = K.parseNum(st.lb);
      if (a == null || b == null) throw new Error('type numbers for ' + tex('a') + ' and ' + tex('b') + '.');
      return Object.assign(fromLine(lIn.dist, toV(a), toV(b)), { src: 'line', dX: lIn, a: toV(a), b: toV(b) });
    }
    function problem(html) {
      ctl.msg.hidden = false;
      Lab.setHTML(ctl.msg, '<b>Not drawn yet:</b> ' + html + (model ? ' <span class="muted">The panels below still show your last valid pair.</span>' : ''));
      host.classList.toggle('cv-stale', !!model);
      save();
    }
    function update() {
      let J;
      try { J = jointFromInputs(); } catch (e) { problem(e.message); return; }
      if (!J) return;
      model = build(J);
      ctl.msg.hidden = true;
      host.classList.remove('cv-stale');
      save();
      sel = -1;
      drawAll(model);
    }
    function drawAll(m) {
      drawAnswer(m); drawTable(m); drawScatter(m); drawMeans(m); drawExy(m); drawCov(m); drawVar(m); drawProps(m); drawIndep(m); drawLine(m);
      dump(m);
    }
    /** exact strings of the results, for checking */
    function dump(m) {
      const s = v => (v == null ? null : isEx(v) ? v.toString() : String(Number(v)));
      const k = consts();
      P.ans.dataset.vals = JSON.stringify({ xs: m.xs.map(s), ys: m.ys.map(s), p: m.p.map(col => col.map(s)), EX: s(m.EX), EY: s(m.EY), EXY: s(m.EXY), cov: s(m.cov), cov2: s(m.cov2), varX: s(m.varX), varY: s(m.varY), rho: s(m.rho), rho2: s(m.rho2), varS: s(m.varS), indep: !m.bad.length, k: k ? { a: s(k.a), b: s(k.b), c: s(k.c), d: s(k.d) } : null });
    }

    /* ---------------- words */
    const pickTex = r => (!r.fam || r.fam === 'custom' ? '\\text{your PMF}' : r.tex);
    function srcWords(m) {
      const base = tex('X') + ' takes ' + m.nx + ' value' + (m.nx > 1 ? 's ' : ' ') + tex(setTex(m.xs)) + ', ' + tex('Y') + ' takes ' + m.ny + ' value' + (m.ny > 1 ? 's ' : ' ') + tex(setTex(m.ys));
      if (m.src === 'table') return 'Your table: ' + base + ' — ' + m.nx + ' × ' + m.ny + ' = ' + m.nx * m.ny + ' cells';
      if (m.src === 'indep') return tex('X\\sim ' + pickTex(m.dX)) + ' and ' + tex('Y\\sim ' + pickTex(m.dY)) + ', <b>independent</b>, so each cell is ' + tex('f_X(x)\\,f_Y(y)') + '. ' + base;
      return tex('X\\sim ' + pickTex(m.dX)) + ' and ' + tex('Y=' + linTex(m.a, 'X', m.b)) + '. ' + base;
    }
    const sdxyTex = m => (isEx(m.sdXY) ? nt(m.sdXY) : '\\sqrt{' + np(m.varX) + '\\cdot ' + np(m.varY) + '}');
    function signWords(m) {
      const s = sgn(m.cov);
      if (s > 0) return tex(COV + '(X,Y)>0') + ': when ' + tex('X') + ' is above its mean, ' + tex('Y') + ' tends to be above its mean too (L3.5 at ' + at(V5, 5, 30) + ').';
      if (s < 0) return tex(COV + '(X,Y)\\lt 0') + ': when ' + tex('X') + ' is above its mean, ' + tex('Y') + ' tends to be below its mean (L3.5 at ' + at(V5, 6, 0) + ').';
      return tex(COV + '(X,Y)=0') + ': ' + tex('X') + ' and ' + tex('Y') + ' are <b>uncorrelated</b> (L3.5 at ' + at(V5, 6, 50) + ').';
    }
    const cellName = c => 'f_{XY}(' + nt(c.x) + ',' + nt(c.y) + ')';

    /* ---------------- answer */
    function drawAnswer(m) {
      const it = PRESETS.find(p => p.id === st.loaded);
      const ev = (it ? 'Lecture example: <b>' + esc(it.label) + '</b>. ' : '') + srcWords(m) + '.';
      const rows = [
        ['E[X]', eqx(m.EX) + ',\\quad E[Y]' + eqx(m.EY)],
        ['E[XY]', eqx(m.EXY)],
        [COV + '(X,Y)', '=E[XY]-E[X]\\,E[Y]'],
        ['', '=' + nt(m.EXY) + '-' + np(m.EX) + '\\cdot ' + np(m.EY)],
        ['', eqv(m.cov)],
      ];
      if (m.defined) {
        rows.push(['\\rho(X,Y)', '=\\dfrac{' + COV + '(X,Y)}{' + SD + '(X)\\,' + SD + '(Y)}']);
        rows.push(['', '=\\dfrac{' + nt(m.cov) + '}{' + sdxyTex(m) + '}']);
        rows.push(['', eqv(m.rho)]);
      } else rows.push(['\\rho(X,Y)', '\\ \\text{is not defined: }' + SD + '(' + (isZero(m.varX) ? 'X' : 'Y') + ')=0']);
      let subt = signWords(m) + ' ';
      if (m.bad.length) subt += 'They are <b>dependent</b>: ' + tex(cellName(m.bad[0]) + '=' + nt(m.bad[0].p) + '\\ne f_X(' + nt(m.bad[0].x) + ')\\,f_Y(' + nt(m.bad[0].y) + ')=' + nt(m.bad[0].prod)) + '.';
      else subt += 'They are <b>independent</b>: every cell is ' + tex('f_X(x)\\,f_Y(y)') + '.';
      if (m.line) subt += ' ' + tex('|\\rho|=1') + ': every point with positive probability lies on the line ' + tex('y=' + linTex(m.line.slope, 'x', m.line.icpt)) + '.';
      K.setAnswer(P.ans, { ev, big: '\\begin{aligned}' + rows.map(([l, r]) => l + '&' + r).join('\\\\') + '\\end{aligned}', sub: subt });
    }

    /* ---------------- the table */
    function drawTable(m) {
      const body = P.table.body;
      Lab.clear(body);
      const showProd = m.src === 'indep' && m.nx * m.ny <= 36;
      P.table.sub(tex('X') + ' across, ' + tex('Y') + ' down, as in the lecture. Each cell is ' + tex('f_{XY}(x,y)=P(X=x,\\ Y=y)') + (m.src === 'table' ? ', the number you typed.' : m.src === 'indep' ? ' = ' + tex('f_X(x)\\,f_Y(y)') + ' (independent).' : ': ' + tex('f_X(x)') + ' in the cell ' + tex('(x,\\ ' + linTex(m.a, 'x', m.b) + ')') + ', 0 elsewhere.') + ' Bottom row ' + tex('f_X') + ': each column added; right column ' + tex('f_Y') + ': each row added (the sums are written out in the panel ' + tex('E[X]') + ' and ' + tex('E[Y]') + ').');
      body.appendChild(gridTable({
        m, corner: 'y\\,\\backslash\\,x',
        cell: c => ({ html: tex(showProd ? nt(m.fx[c.i]) + '\\cdot ' + nt(m.fy[c.j]) + '=' + nt(c.p) : nt(c.p)), cls: c.pos ? '' : 'zero' }),
        foot: i => tex(nt(m.fx[i])), footHead: tex('f_X(x)'),
        side: j => tex(nt(m.fy[j])), sideHead: tex('f_Y(y)'), total: tex('1'),
      }));
    }

    /* ---------------- the scatter picture */
    function drawScatter(m) {
      const body = P.scatter.body;
      Lab.clear(body);
      P.scatter.sub('One dot for each cell with positive probability, its <b>area</b> proportional to ' + tex('f_{XY}(x,y)') + ' (a scatter plot of the PMF, as in L3.6 at ' + at(V6, 11, 0) + '). Dashed lines: ' + tex('x=E[X]') + ' (blue) and ' + tex('y=E[Y]') + ' (orange). <b>Green</b>: ' + tex('(x-E[X])(y-E[Y])>0') + ' — both above or both below their means; <b>red</b>: ' + tex('\\lt 0') + '; grey: on a dashed line (0). Tap a dot.');
      const stage = h('div', { class: 'cv-stage' });
      body.appendChild(stage);
      const avail = Math.max(260, Math.min(600, stage.clientWidth || 560));
      const xs = m.xs.map(Number), ys = m.ys.map(Number);
      const gap = arr => { let g = Infinity; for (let k = 1; k < arr.length; k++) g = Math.min(g, arr[k] - arr[k - 1]); return Number.isFinite(g) && g > 0 ? g : 1; };
      const gx = gap(xs), gy = gap(ys);
      const x0 = xs[0] - 0.7 * gx, x1 = xs[xs.length - 1] + 0.7 * gx, y0 = ys[0] - 0.7 * gy, y1 = ys[ys.length - 1] + 0.7 * gy;
      const ml = 42, mr = 14, mt = 30, mb = 30;
      const pw = avail - ml - mr, ph = Math.round(Math.max(180, Math.min(360, pw * 0.72)));
      const W = ml + pw + mr, H = mt + ph + mb;
      const X = v => ml + ((v - x0) / (x1 - x0)) * pw, Y = v => mt + ((y1 - v) / (y1 - y0)) * ph;
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, class: 'cv-svg', role: 'img', 'aria-label': 'scatter picture of the joint PMF with the means marked' });
      const mx = X(Number(m.EX)), my = Y(Number(m.EY));
      const R = (x, y, w, hh, cls) => s.appendChild(svg('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), class: cls }));
      R(mx, mt, ml + pw - mx, my - mt, 'cv-q pos'); R(ml, my, mx - ml, mt + ph - my, 'cv-q pos');
      R(ml, mt, mx - ml, my - mt, 'cv-q neg'); R(mx, my, ml + pw - mx, mt + ph - my, 'cv-q neg');
      s.appendChild(svg('rect', { x: ml, y: mt, width: pw, height: ph, class: 'cv-frame' }));
      const every = n => Math.max(1, Math.ceil(n / 12));
      m.xs.forEach((x, i) => {
        s.appendChild(svg('line', { x1: X(xs[i]), x2: X(xs[i]), y1: mt, y2: mt + ph, class: 'cv-gl' }));
        if (i % every(m.nx) === 0 || i === m.nx - 1) s.appendChild(svg('text', { x: X(xs[i]), y: mt + ph + 18, 'text-anchor': 'middle', class: 'cv-tick x' }, txt(x)));
      });
      m.ys.forEach((y, j) => {
        s.appendChild(svg('line', { x1: ml, x2: ml + pw, y1: Y(ys[j]), y2: Y(ys[j]), class: 'cv-gl' }));
        if (j % every(m.ny) === 0 || j === m.ny - 1) s.appendChild(svg('text', { x: ml - 7, y: Y(ys[j]) + 4, 'text-anchor': 'end', class: 'cv-tick y' }, txt(y)));
      });
      const q = (x, y, sign) => s.appendChild(svg('text', { x, y, 'text-anchor': 'middle', class: 'cv-qs ' + (sign > 0 ? 'pos' : 'neg') }, sign > 0 ? '+' : '−'));
      if (ml + pw - mx > 22 && my - mt > 22) q(ml + pw - 10, mt + 16, 1);
      if (mx - ml > 22 && mt + ph - my > 22) q(ml + 10, mt + ph - 6, 1);
      if (mx - ml > 22 && my - mt > 22) q(ml + 10, mt + 16, -1);
      if (ml + pw - mx > 22 && mt + ph - my > 22) q(ml + pw - 10, mt + ph - 6, -1);
      s.appendChild(svg('line', { x1: mx, x2: mx, y1: mt - 4, y2: mt + ph, class: 'cv-mean x' }));
      s.appendChild(svg('line', { x1: ml, x2: ml + pw + 4, y1: my, y2: my, class: 'cv-mean y' }));
      const lx = Math.min(Math.max(mx, ml + 60), ml + pw - 60);
      s.appendChild(svg('text', { x: lx, y: mt - 10, 'text-anchor': 'middle', class: 'cv-mlab x' }, 'E[X] = ' + txt(m.EX)));
      s.appendChild(svg('text', { x: ml + pw - 4, y: my < mt + 18 ? my + 15 : my - 6, 'text-anchor': 'end', class: 'cv-mlab y' }, 'E[Y] = ' + txt(m.EY)));
      if (m.line && m.line.ok) {
        const yAt = x => Number(m.line.slope) * x + Number(m.line.icpt);
        // clip the line y = slope·x + icpt to the plot rectangle
        let a = x0, b = x1;
        const sl = Number(m.line.slope);
        if (sl !== 0) { const xa = (y0 - Number(m.line.icpt)) / sl, xb = (y1 - Number(m.line.icpt)) / sl; a = Math.max(x0, Math.min(xa, xb)); b = Math.min(x1, Math.max(xa, xb)); }
        if (b > a) s.appendChild(svg('line', { x1: X(a), y1: Y(yAt(a)), x2: X(b), y2: Y(yAt(b)), class: 'cv-line' }));
      }
      const pos = m.cells.filter(c => c.pos);
      const pmax = Math.max(...pos.map(c => Number(c.p)), 1e-300);
      const cellPx = Math.min((gx / (x1 - x0)) * pw, (gy / (y1 - y0)) * ph);
      const rmax = Math.max(4, Math.min(26, 0.46 * cellPx));
      const dots = [];
      m.cells.forEach(c => {
        const cx = X(Number(c.x)), cy = Y(Number(c.y));
        if (!c.pos) { if (m.cells.length <= 400) s.appendChild(svg('circle', { cx, cy, r: 2.2, class: 'cv-pt0' })); return; }
        const r = Math.max(2.6, rmax * Math.sqrt(Number(c.p) / pmax));
        const g = svg('g', { class: 'cv-pt ' + (c.sign > 0 ? 'pos' : c.sign < 0 ? 'neg' : 'zero') + (sel === c.k ? ' sel' : ''), tabindex: '0', role: 'button', 'aria-label': 'point (' + txt(c.x) + ', ' + txt(c.y) + ')' });
        g.appendChild(svg('circle', { cx, cy, r: Math.max(r, 12), class: 'hit' }));
        g.appendChild(svg('circle', { cx, cy, r, class: 'dot' }));
        g.appendChild(svg('title', {}, '(' + txt(c.x) + ', ' + txt(c.y) + '): f = ' + txt(c.p)));
        const pickIt = () => { sel = c.k; dots.forEach(d => d.classList.toggle('sel', d === g)); readout(c); };
        g.addEventListener('click', pickIt);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pickIt(); } });
        s.appendChild(g);
        dots.push(g);
      });
      stage.appendChild(s);
      const legend = h('div', { class: 'cv-legend' });
      Lab.setHTML(legend, '<span><i class="pos"></i>adds to Cov</span><span><i class="neg"></i>subtracts</span><span><i class="zero"></i>adds 0</span><span><i class="mx"></i>' + tex('x=E[X]') + '</span><span><i class="my"></i>' + tex('y=E[Y]') + '</span>' + (m.line && m.line.ok ? '<span><i class="ln"></i>the line ' + tex('y=' + linTex(m.line.slope, 'x', m.line.icpt)) + '</span>' : '') + (pos.length < m.cells.length && m.cells.length <= 400 ? '<span><i class="z0"></i>a cell with probability 0</span>' : ''));
      const read = h('div', { class: 'ws-readout cv-read' });
      body.append(legend, read);
      P.scatter.read = read;
      if (sel >= 0 && m.cells[sel]) readout(m.cells[sel]); else readout(null);
      function readout(c) {
        if (!c) {
          const gp = pos.filter(d => d.sign > 0), gn = pos.filter(d => d.sign < 0);
          const A = sum(gp.map(d => d.ddp)), B = sum(gn.map(d => d.ddp));
          Lab.setHTML(read, 'The ' + gp.length + ' green dot' + (gp.length === 1 ? '' : 's') + ' add ' + tex(gp.length > 1 ? sumTex(gp.map(d => d.ddp), 8) + eqx(A) : nt(A)) + '; the ' + gn.length + ' red dot' + (gn.length === 1 ? '' : 's') + ' add ' + tex(gn.length > 1 ? sumTex(gn.map(d => d.ddp), 8) + eqx(B) : nt(B)) + '. Together: ' + tex(COV + '(X,Y)=' + nt(A) + (sgn(B) < 0 ? nt(B) : '+' + nt(B)) + eqv(add(A, B))) + '. Tap a dot for its share.');
          return;
        }
        const side1 = c.sign === 0 ? 'on a dashed line' : (sgn(m.dX[c.i]) >= 0 ? 'right of' : 'left of') + ' the blue line and ' + (sgn(m.dY[c.j]) >= 0 ? 'above' : 'below') + ' the orange line';
        Lab.setHTML(read, tex('(x,y)=(' + nt(c.x) + ',' + nt(c.y) + ')') + ', ' + tex(cellName(c) + '=' + nt(c.p)) + '. ' +
          tex('x-E[X]=' + nt(c.x) + '-' + np(m.EX) + '=' + nt(m.dX[c.i])) + ', ' + tex('y-E[Y]=' + nt(c.y) + '-' + np(m.EY) + '=' + nt(m.dY[c.j])) + ' (' + side1 + ').' +
          '<div>Its share of the covariance: ' + tex(nb(m.dX[c.i]) + nb(m.dY[c.j]) + '\\cdot ' + nt(c.p) + eqx(c.ddp)) + (c.sign > 0 ? ' — it pushes Cov up.' : c.sign < 0 ? ' — it pulls Cov down.' : ' — nothing.') + '</div>');
      }
    }

    /* ---------------- E[X], E[Y] */
    function drawMeans(m) {
      const body = P.means.body;
      Lab.clear(body);
      P.means.sub('From L3.1: ' + tex('E[X]=\\sum_x x\\,f_X(x)') + '. The marginals come from the table: add down a column for ' + tex('f_X') + ', along a row for ' + tex('f_Y') + ' (L1.2).');
      const steps = [];
      [true, false].forEach(isX => {
        const V = isX ? 'X' : 'Y', v = isX ? 'x' : 'y';
        const vals = isX ? m.xs : m.ys, f = isX ? m.fx : m.fy, E = isX ? m.EX : m.EY;
        const other = isX ? m.ys : m.xs;
        const rows = vals.map((val, k) => {
          const parts = other.map((_, q) => (isX ? m.cellAt(k, q) : m.cellAt(q, k)).p);
          return [nw(nt(val)), nw('f_' + V + '(' + nt(val) + ')=' + (parts.length > 1 ? sumTex(parts) : '') + (parts.length > 1 ? eqx(f[k]) : nt(f[k])))];
        });
        steps.push({ html: '<b>Marginal of ' + tex(V) + '</b>: add ' + (isX ? 'down each column' : 'along each row') + ' of the table.', block: Lab.table([tex(v), tex('f_' + V + '(' + v + ')') + ', the ' + (isX ? 'column' : 'row') + ' added'], rows) });
        steps.push({ html: 'Then ' + tex('E[' + V + ']') + ': each value times its probability, added.', math: prodChain('E[' + V + ']=\\sum_' + v + ' ' + v + '\\,f_' + V + '(' + v + ')', vals.map((val, k) => [val, f[k]]), E) });
      });
      body.appendChild(K.steps(steps));
    }

    /* ---------------- E[XY] */
    /** the "row method" for a big table: for each y, y · Σ_x g(x) f(x, y) */
    function rowMethod(m, gx, gy, gxName, gyName) {
      const rows = m.ys.map((y, j) => {
        const terms = m.xs.map((x, i) => mul(gx(i), m.cellAt(i, j).p)).filter(t => !isZero(t));
        const inner = sum(terms);
        return { y, j, terms, inner, val: mul(gy(j), inner) };
      });
      const tbl = Lab.table([tex('y'), tex('\\sum_x ' + gxName + '\\,f_{XY}(x,y)'), tex(gyName + '\\cdot') + ' that'], rows.map(r => [nw(nt(r.y)), nw((r.terms.length > 1 ? sumTex(r.terms, 8) : '') + (r.terms.length > 1 ? eqx(r.inner) : nt(r.inner))), nw(np(gy(r.j)) + '\\cdot ' + np(r.inner) + eqx(r.val))]));
      return { rows, tbl };
    }
    function drawExy(m) {
      const body = P.exy.body;
      Lab.clear(body);
      P.exy.sub('From L3.2: ' + tex('E[XY]=\\sum_{x,y}x\\,y\\,f_{XY}(x,y)') + ' — every cell of the table, not the marginals. The lecture: “0 times anything is 0”, so only cells with ' + tex('x\\ne 0') + ', ' + tex('y\\ne 0') + ' and ' + tex('f\\ne 0') + ' matter (L3.5 at ' + at(V5, 10, 30) + ').');
      const steps = [];
      const nz = m.cells.filter(c => !isZero(c.xyp));
      if (m.nx * m.ny <= GRIDCELLS) {
        steps.push({ html: 'Each cell: ' + tex('(x)(y)\\cdot f_{XY}(x,y)') + '. Green: positive, red: negative, grey: 0 (' + tex('x=0') + ', ' + tex('y=0') + ' or ' + tex('f=0') + ').',
          block: blockOf(gridTable({ m, cell: c => ({ html: tex(nb(c.x) + nb(c.y) + '\\cdot ' + nt(c.p) + '=' + nt(c.xyp)), cls: isZero(c.xyp) ? 'zero' : sgn(c.xyp) > 0 ? 'pos' : 'neg' }) })) });
        steps.push({ html: 'Add the cells: ' + (m.cells.length - nz.length) + ' of the ' + m.cells.length + ' are 0 and are left out' + (nz.length ? ', ' + nz.length + ' remain' : '') + ':', math: chain2('E[XY]', '\\sum_{x,y}x\\,y\\,f_{XY}(x,y)', nz.map(c => c.xyp), m.EXY) });
      } else {
        const r = rowMethod(m, i => m.xs[i], j => m.ys[j], 'x', 'y');
        steps.push({ html: 'Your table has ' + m.cells.length + ' cells, too many to draw one by one, so add row by row: in each row ' + tex('y') + ', first ' + tex('\\sum_x x\\,f_{XY}(x,y)') + ', then times ' + tex('y') + ':', block: r.tbl });
        steps.push({ html: 'Add the rows:', math: chain2('E[XY]', '\\sum_y y\\sum_x x\\,f_{XY}(x,y)', r.rows.map(q => q.val).filter(v => !isZero(v)), m.EXY) });
      }
      if (m.src === 'indep') steps.push({ html: 'Independent, so also ' + tex('E[XY]=E[X]\\,E[Y]') + ' (L3.4 at ' + at(V4, 17, 0) + '): ' + tex(np(m.EX) + '\\cdot ' + np(m.EY) + eqx(mul(m.EX, m.EY))) + ' ' + mark(same(mul(m.EX, m.EY), m.EXY)) });
      body.appendChild(K.steps(steps));
    }

    /* ---------------- Cov two ways */
    function drawCov(m) {
      const body = P.cov.body;
      Lab.clear(body);
      P.cov.sub('Definition (L3.5 at ' + at(V5, 4, 30) + '): ' + tex(COV + '(X,Y)=E\\big[(X-E[X])(Y-E[Y])\\big]') + '. The short form (' + at(V5, 13, 30) + '): ' + tex(COV + '(X,Y)=E[XY]-E[X]\\,E[Y]') + '. Both give the same number.');
      const steps = [];
      steps.push({ html: '<b>Way 1, the short form</b>, with ' + tex('E[X]') + ', ' + tex('E[Y]') + ' and ' + tex('E[XY]') + ' from the panels above:',
        math: COV + '(X,Y)=E[XY]-E[X]\\,E[Y]=' + nt(m.EXY) + '-' + np(m.EX) + '\\cdot ' + np(m.EY) + '=' + nt(m.EXY) + '-' + np(mul(m.EX, m.EY)) + eqv(m.cov) });
      const nz = m.cells.filter(c => !isZero(c.ddp));
      const devX = i => tex(nt(m.xs[i])) + '<div class="cv-dev">' + tex(nt(m.xs[i]) + '-' + np(m.EX) + '=' + nt(m.dX[i])) + '</div>';
      const devY = j => tex(nt(m.ys[j])) + '<div class="cv-dev">' + tex(nt(m.ys[j]) + '-' + np(m.EY) + '=' + nt(m.dY[j])) + '</div>';
      if (m.nx * m.ny <= GRIDCELLS) {
        steps.push({ html: '<b>Way 2, the definition.</b> The headers show each value minus its mean (' + tex('x-E[X]') + ' across, ' + tex('y-E[Y]') + ' down). Each cell: ' + tex('(x-E[X])(y-E[Y])\\cdot f_{XY}(x,y)') + '; the colours match the picture.',
          block: blockOf(gridTable({ m, corner: 'y\\,\\backslash\\,x', xh: devX, yh: devY, cell: c => ({ html: tex(nb(m.dX[c.i]) + nb(m.dY[c.j]) + '\\cdot ' + nt(c.p) + '=' + nt(c.ddp)), cls: isZero(c.ddp) ? 'zero' : sgn(c.ddp) > 0 ? 'pos' : 'neg' }) })) });
        steps.push({ html: 'Add the cells (' + (m.cells.length - nz.length) + ' of them are 0):', math: chain2(COV + '(X,Y)', '\\sum_{x,y}(x-E[X])(y-E[Y])\\,f_{XY}(x,y)', nz.map(c => c.ddp), m.cov2) });
      } else {
        const r = rowMethod(m, i => m.dX[i], j => m.dY[j], '(x-E[X])', '(y-E[Y])');
        steps.push({ html: '<b>Way 2, the definition</b>, row by row (' + m.cells.length + ' cells): in each row ' + tex('y') + ', ' + tex('\\sum_x (x-E[X])\\,f_{XY}(x,y)') + ', then times ' + tex('y-E[Y]') + ':', block: r.tbl });
        steps.push({ html: 'Add the rows:', math: chain2(COV + '(X,Y)', '\\sum_y (y-E[Y])\\sum_x (x-E[X])\\,f_{XY}(x,y)', r.rows.map(q => q.val).filter(v => !isZero(v)), m.cov2) });
      }
      steps.push({ html: 'The two ways agree: ' + tex(nt(m.cov) + (same(m.cov, m.cov2) ? '=' : '\\ne ') + nt(m.cov2)) + ' ' + mark(same(m.cov, m.cov2)) + '. Why (' + at(V5, 14, 0) + '): multiply out ' + tex('(X-E[X])(Y-E[Y])') + ' and use linearity; ' + tex('E[X]') + ' and ' + tex('E[Y]') + ' are constants.' });
      steps.push({ html: signWords(m) });
      body.appendChild(K.steps(steps));
    }

    /* ---------------- Var, SD, rho */
    function sdLine(V, v, sd) {
      const s = sqrtEx(v);
      return SD + '(' + V + ')=\\sqrt{' + VAR + '(' + V + ')}=\\sqrt{' + nt(v) + '}' + (s != null ? eqv(s) : '\\approx ' + fl(sd));
    }
    function meter(rho) {
      const W = 320, H = 46, l = 16, r = W - 16, X = v => l + ((v + 1) / 2) * (r - l);
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'cv-meter', role: 'img', 'aria-label': 'where rho lies between -1 and 1' });
      s.appendChild(svg('line', { x1: l, x2: r, y1: 18, y2: 18, class: 'cv-mbar' }));
      [-1, -0.5, 0, 0.5, 1].forEach(v => { s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: 12, y2: 24, class: 'cv-mtick' })); s.appendChild(svg('text', { x: X(v), y: 40, 'text-anchor': 'middle', class: 'cv-tick' }, v === 0 ? '0' : String(v).replace('-', '−'))); });
      const v = Math.max(-1, Math.min(1, Number(rho)));
      s.appendChild(svg('circle', { cx: X(v), cy: 18, r: 7, class: 'cv-mdot ' + (v > 1e-12 ? 'pos' : v < -1e-12 ? 'neg' : 'zero') }));
      return s;
    }
    function drawVar(m) {
      const body = P.var.body;
      Lab.clear(body);
      P.var.sub('From L3.4: ' + tex(VAR + '(X)=E[X^2]-(E[X])^2') + ' and ' + tex(SD + '(X)=\\sqrt{' + VAR + '(X)}') + '. From L3.6 at ' + at(V6, 1, 0) + ': ' + tex('\\rho(X,Y)=\\dfrac{' + COV + '(X,Y)}{' + SD + '(X)\\,' + SD + '(Y)}') + ', a number with no units between −1 and 1.');
      const steps = [];
      [true, false].forEach(isX => {
        const V = isX ? 'X' : 'Y', v = isX ? 'x' : 'y';
        const vals = isX ? m.xs : m.ys, f = isX ? m.fx : m.fy;
        const E = isX ? m.EX : m.EY, E2 = isX ? m.EX2 : m.EY2, vr = isX ? m.varX : m.varY, sd = isX ? m.sdX : m.sdY;
        steps.push({ html: tex('E[' + V + '^2]') + ': each value squared times its probability, added.', math: prodChain('E[' + V + '^2]=\\sum_' + v + ' ' + v + '^2 f_' + V + '(' + v + ')', vals.map((val, k) => [val, f[k]]), E2, true) });
        steps.push({ html: tex(VAR + '(' + V + ')') + ' and ' + tex(SD + '(' + V + ')') + ':', math: VAR + '(' + V + ')=E[' + V + '^2]-(E[' + V + '])^2=' + nt(E2) + '-' + np(E) + '^2=' + nt(E2) + '-' + np(mul(E, E)) + eqv(vr), block: Lab.block(el => el.appendChild(h('div', { class: 's-math', html: tex(sdLine(V, vr, sd), true) }))) });
      });
      if (!m.defined) {
        steps.push({ html: '<span class="cbad">' + tex(SD + '(' + (isZero(m.varX) ? 'X' : 'Y') + ')=0') + '</span>: that variable is a constant (one value with probability 1), so ' + tex('\\rho(X,Y)') + ' would divide by 0 and is <b>not defined</b>. (Its covariance with anything is 0.)' });
        body.appendChild(K.steps(steps));
        return;
      }
      const ex = isEx(m.sdXY);
      steps.push({ html: 'The correlation coefficient (L3.6 at ' + at(V6, 1, 0) + '). ' + (ex ? tex(SD + '(X)\\,' + SD + '(Y)=\\sqrt{' + VAR + '(X)\\,' + VAR + '(Y)}=\\sqrt{' + np(m.varX) + '\\cdot ' + np(m.varY) + '}=' + nt(m.sdXY)) + ' is exact here:' : tex(SD + '(X)\\,' + SD + '(Y)=\\sqrt{' + np(m.varX) + '\\cdot ' + np(m.varY) + '}=\\sqrt{' + nt(m.vv) + '}\\approx ' + fl(m.sdXY)) + ':'),
        math: '\\rho(X,Y)=\\dfrac{' + COV + '(X,Y)}{' + SD + '(X)\\,' + SD + '(Y)}=\\dfrac{' + nt(m.cov, true) + '}{' + (ex ? nt(m.sdXY, true) : fl(m.sdXY)) + '}' + eqv(m.rho, true) });
      if (!ex) steps.push({ html: 'Exactly, without square roots: ' + tex('\\rho^2') + ' is a fraction.', math: '\\rho(X,Y)^2=\\dfrac{' + COV + '(X,Y)^2}{' + VAR + '(X)\\,' + VAR + '(Y)}=\\dfrac{' + np(m.cov) + '^2}{' + np(m.varX) + '\\cdot ' + np(m.varY) + '}' + eqv(m.rho2, true) });
      steps.push({ html: 'The bound (L3.6 at ' + at(V6, 1, 30) + '): ' + tex('-' + SD + '(X)\\,' + SD + '(Y)\\le ' + COV + '(X,Y)\\le ' + SD + '(X)\\,' + SD + '(Y)') + '. With your numbers:',
        math: '-' + (ex ? nt(m.sdXY) : fl(m.sdXY)) + '\\le ' + nt(m.cov) + '\\le ' + (ex ? nt(m.sdXY) : fl(m.sdXY)) + '\\quad ' + (Math.abs(Number(m.cov)) <= Number(m.sdXY) + 1e-12 ? '\\checkmark' : '') ,
        note: 'Dividing by ' + tex(SD + '(X)\\,' + SD + '(Y)>0') + ' gives ' + tex('-1\\le\\rho(X,Y)\\le 1') + ' (' + at(V6, 2, 30) + ').' });
      const r = Number(m.rho), ar = Math.abs(r);
      const words = m.line ? tex('|\\rho|=1') + ': the strongest possible trend — the points lie on one line (L3.6 at ' + at(V6, 3, 30) + ').'
        : isZero(m.cov) ? tex('\\rho=0') + ': uncorrelated, “no observable trend” (L3.6 at ' + at(V6, 3, 0) + ').'
        : tex('\\rho') + ' is ' + (r > 0 ? 'positive' : 'negative') + ' and ' + (ar < 0.5 ? 'closer to 0 than to ' + (r > 0 ? '1' : '−1') : ar > 0.5 ? 'closer to ' + (r > 0 ? '1' : '−1') + ' than to 0' : 'halfway between 0 and ' + (r > 0 ? '1' : '−1')) + ': as ' + tex('X') + ' goes up, ' + tex('Y') + ' tends to go ' + (r > 0 ? 'up' : 'down') + ' (L3.6 at ' + at(V6, 2, 50) + ').';
      steps.push({ html: 'Where ' + tex('\\rho(X,Y)' + (isEx(m.rho) ? '=' + nt(m.rho) : '\\approx ' + fl(m.rho))) + ' sits between −1 and 1. ' + words, block: Lab.block(el => el.appendChild(h('div', { class: 'cv-meterbox' }, meter(m.rho)))) });
      body.appendChild(K.steps(steps));
    }

    /* ---------------- properties */
    function consts() {
      const k = {};
      for (const n of ['a', 'b', 'c', 'd']) { const f = K.parseNum(st.k[n]); if (f == null) return null; k[n] = toV(f); }
      return k;
    }
    function drawProps(m) {
      const body = P.props.body;
      Lab.clear(body);
      P.props.sub('The properties from L3.5 at ' + at(V5, 13, 0) + ' and L3.4, each checked with your table and your constants ' + tex('a,b,c,d') + ' (left, step 2).');
      const k = consts();
      const steps = [];
      // 1. Cov(X, X) = Var(X)
      steps.push({ html: '<b>' + tex(COV + '(X,X)=' + VAR + '(X)') + '</b> (L3.5 at ' + at(V5, 13, 0) + '): put ' + tex('Y=X') + ' in the short form.',
        math: COV + '(X,X)=E[X\\cdot X]-E[X]\\,E[X]=E[X^2]-(E[X])^2=' + nt(m.EX2) + '-' + np(mul(m.EX, m.EX)) + eqx(m.varX) + '=' + VAR + '(X)\\ \\checkmark' });
      // 2. symmetric
      steps.push({ html: '<b>Symmetric</b> (' + at(V5, 14, 20) + '): ' + tex('YX=XY') + ', so ' + tex(COV + '(Y,X)=E[YX]-E[Y]\\,E[X]=' + nt(m.EXY) + '-' + np(m.EY) + '\\cdot ' + np(m.EX) + eqx(m.cov) + '=' + COV + '(X,Y)') + ' ' + mark(true) });
      if (!k) {
        steps.push({ html: '<span class="cbad">Type numbers for ' + tex('a,b,c,d') + ' on the left (step 2) to see the next properties.</span>' });
      } else {
        const { a, b, c, d } = k;
        const U = linTex(a, 'X', b), Vv = linTex(c, 'Y', d);
        const EU = add(mul(a, m.EX), b), EV = add(mul(c, m.EY), d);
        const uv = m.cells.filter(q => q.pos).map(q => ({ q, u: add(mul(a, q.x), b), v: add(mul(c, q.y), d) }));
        uv.forEach(t => (t.t = mul(mul(t.u, t.v), t.q.p)));
        const EUV = sum(uv.map(t => t.t));
        const covUV = sub(EUV, mul(EU, EV));
        const acCov = mul(mul(a, c), m.cov);
        const nzT = uv.filter(t => !isZero(t.t));
        const list = nzT.length <= 10 ? nzT.map(t => nb(t.u) + nb(t.v) + '\\cdot ' + nt(t.q.p)).join('+') : null;
        steps.push({ html: '<b>' + tex(COV + '(aX+b,\\ cY+d)=ac\\,' + COV + '(X,Y)') + '</b>. Linearity (L3.5 at ' + at(V5, 14, 30) + ') pulls out ' + tex('a') + ' and ' + tex('c') + '; adding a constant moves the table without changing Cov (L3.6 at ' + at(V6, 10, 30) + '). Your ' + tex('U=' + U) + ', ' + tex('V=' + Vv) + '. Directly from the cells, with ' + tex('u=' + linTex(a, 'x', b)) + ', ' + tex('v=' + linTex(c, 'y', d)) + ':',
          math: 'E[U]=a\\,E[X]+b=' + np(a) + '\\cdot ' + np(m.EX) + '+' + np(b) + eqx(EU),
          block: lines(['E[V]=c\\,E[Y]+d=' + np(c) + '\\cdot ' + np(m.EY) + '+' + np(d) + eqx(EV),
            'E[UV]=\\sum_{x,y}u\\,v\\,f_{XY}(x,y)' + (list ? '=' + list : '\\quad(' + nzT.length + '\\text{ cells that are not }0)'),
            (nzT.length > 1 ? '=' + sumTex(nzT.map(t => t.t)) : '') + eqx(EUV),
            COV + '(U,V)=E[UV]-E[U]\\,E[V]=' + nt(EUV) + '-' + np(EU) + '\\cdot ' + np(EV) + eqv(covUV)]),
          note: 'And ' + tex('ac\\,' + COV + '(X,Y)=' + np(a) + '\\cdot ' + np(c) + '\\cdot ' + np(m.cov) + eqx(acCov)) + ' — the same number ' + mark(same(covUV, acCov)) + '. The shifts ' + tex('b') + ' and ' + tex('d') + ' play no part.' });
        // rho of the scaled pair
        if (m.defined) {
          const ac = mul(a, c);
          if (isZero(a) || isZero(c)) steps.push({ html: '<b>' + tex('\\rho') + ' after scaling</b>: with ' + tex((isZero(a) ? 'a' : 'c') + '=0') + ', ' + tex(isZero(a) ? 'U' : 'V') + ' is a constant, ' + tex(SD + '=0') + ', so ' + tex('\\rho(U,V)') + ' is not defined.' });
          else {
            const rUV = sgn(ac) > 0 ? m.rho : neg(m.rho);
            steps.push({ html: '<b>' + tex('\\rho') + ' is unchanged by positive scaling.</b> ' + tex(SD + '(aX+b)=|a|\\,' + SD + '(X)') + ' (L3.4 at ' + at(V4, 12, 30) + '), so',
              math: '\\rho(U,V)=\\dfrac{ac\\,' + COV + '(X,Y)}{|a|\\,' + SD + '(X)\\cdot|c|\\,' + SD + '(Y)}=\\dfrac{' + nt(ac) + '}{' + nt(abs(ac)) + '}\\,\\rho(X,Y)=' + (sgn(ac) > 0 ? '' : '-') + '\\rho(X,Y)' + (isEx(rUV) ? eqx(rUV) : '\\approx ' + fl(rUV)),
              note: sgn(ac) > 0 ? 'Your ' + tex('ac=' + nt(ac) + '>0') + ': the same ' + tex('\\rho') + ' — changing units or moving the table does not change the correlation.' : 'Your ' + tex('ac=' + nt(ac) + '\\lt 0') + ': one of the two is flipped, so ' + tex('\\rho') + ' changes sign but keeps its size ' + tex('|\\rho|') + '.' });
          }
        }
      }
      // Var(X + Y)
      const S = m.S;
      const rowsS = S.slice(0, 30).map(g => [nw(nt(g.s)), nw(g.cells.length <= 4 ? g.cells.map(c => '(' + nt(c.x) + ',' + nt(c.y) + ')').join(',\\ ') : g.cells.length + '\\text{ cells}'), nw((g.cells.length > 1 ? sumTex(g.cells.map(c => c.p), 8) : '') + (g.cells.length > 1 ? eqx(g.p) : nt(g.p)))]);
      const viaF = add(add(m.varX, m.varY), mul(F(2), m.cov));
      steps.push({ html: '<b>' + tex(VAR + '(X+Y)=' + VAR + '(X)+' + VAR + '(Y)+2\\,' + COV + '(X,Y)') + '</b>. L3.4 (' + at(V4, 17, 0) + ') gives it for independent ' + tex('X,Y') + ' without the last term; that term is what the cross terms of its proof leave (' + at(V4, 22, 0) + '). First the PMF of ' + tex('S=X+Y') + ' straight from your table (cells with the same ' + tex('x+y') + ' added):',
        block: Lab.table([tex('s'), 'cells with ' + tex('x+y=s'), tex('P(S=s)')], rowsS),
        note: S.length > 30 ? 'Only the first 30 of the ' + S.length + ' values of S are listed.' : null });
      steps.push({ html: 'Its variance directly, then by the formula:',
        math: prodChain('E[S]=\\sum_s s\\,P(S=s)', S.map(g => [g.s, g.p]), m.ES),
        block: lines([prodChain('E[S^2]=\\sum_s s^2P(S=s)', S.map(g => [g.s, g.p]), m.ES2, true),
          VAR + '(X+Y)=E[S^2]-(E[S])^2=' + nt(m.ES2) + '-' + np(m.ES) + '^2=' + nt(m.ES2) + '-' + np(mul(m.ES, m.ES)) + eqv(m.varS),
          VAR + '(X)+' + VAR + '(Y)+2\\,' + COV + '(X,Y)=' + nt(m.varX) + '+' + nt(m.varY) + '+2\\cdot ' + np(m.cov) + eqv(viaF)]),
        note: 'The two agree ' + mark(same(m.varS, viaF)) + '. ' + (isZero(m.cov) ? 'Here ' + tex(COV + '=0') + ', so ' + tex(VAR + '(X+Y)=' + VAR + '(X)+' + VAR + '(Y)') + '.' : 'Here ' + tex(COV + '\\ne 0') + ', so ' + tex(VAR + '(X)+' + VAR + '(Y)=' + nt(add(m.varX, m.varY))) + ' alone would be wrong by ' + tex('2\\,' + COV + '=' + nt(mul(F(2), m.cov))) + '.') });
      body.appendChild(K.steps(steps));
    }

    /* ---------------- independence */
    function drawIndep(m) {
      const body = P.indep.body;
      Lab.clear(body);
      P.indep.sub('L3.5 at ' + at(V5, 15, 30) + ': if ' + tex('X') + ' and ' + tex('Y') + ' are independent, ' + tex(COV + '(X,Y)=0') + '. The converse fails: uncorrelated variables can be dependent (' + at(V5, 16, 30) + ').');
      const steps = [];
      if (m.nx * m.ny <= GRIDCELLS) {
        steps.push({ html: 'Independent means every cell is the product of its margins: ' + tex('f_{XY}(x,y)=f_X(x)\\,f_Y(y)') + ' (L2.1). Each cell: ' + tex('f_X(x)\\,f_Y(y)') + ', then ✓ when it equals the cell.',
          block: blockOf(gridTable({ m, cell: c => ({ html: tex(nt(m.fx[c.i]) + '\\cdot ' + nt(m.fy[c.j]) + '=' + nt(c.prod)) + ' ' + (same(c.p, c.prod) ? '<span class="cgood">✓</span>' : '<span class="cbad">≠ ' + tex(nt(c.p)) + '</span>'), cls: same(c.p, c.prod) ? '' : 'neg' }) })) });
      } else steps.push({ html: 'Independent means every cell is ' + tex('f_X(x)\\,f_Y(y)') + ' (L2.1). Your ' + m.cells.length + ' cells: ' + (m.bad.length ? m.bad.length + ' fail.' : 'all pass.') });
      if (!m.bad.length) {
        steps.push({ html: '<b>Independent</b> ' + mark(true) + '. Then ' + tex('E[XY]=E[X]\\,E[Y]') + ' (L3.4 at ' + at(V4, 17, 0) + '), so the covariance must be 0:', math: COV + '(X,Y)=E[XY]-E[X]\\,E[Y]=' + nt(m.EXY) + '-' + np(m.EX) + '\\cdot ' + np(m.EY) + eqx(m.cov) + '\\ \\checkmark' });
      } else {
        const b0 = m.bad[0];
        steps.push({ html: '<b>Dependent</b>: ' + m.bad.length + ' of the ' + m.cells.length + ' cells fail, for example ' + tex(cellName(b0) + '=' + nt(b0.p) + '\\ne ' + nt(m.fx[b0.i]) + '\\cdot ' + nt(m.fy[b0.j]) + '=' + nt(b0.prod)) + '.' });
        if (isZero(m.cov)) steps.push({ html: '<b>Uncorrelated but dependent</b>: ' + tex(COV + '(X,Y)=0') + ' and yet ' + tex('X') + ', ' + tex('Y') + ' are not independent — exactly the L3.5 example (' + at(V5, 16, 40) + '). ' + tex(COV + '=0') + ' only says ' + tex('E[XY]=E[X]\\,E[Y]') + ', one equation; independence needs every cell to factor.' });
        else steps.push({ html: 'Dependent, and ' + tex(COV + '(X,Y)=' + nt(m.cov) + '\\ne 0') + '. (A non-zero covariance always means dependent: independence would force ' + tex(COV + '=0') + '.)' });
      }
      if (m.nx === 2 && m.ny === 2) {
        const c22 = m.cellAt(1, 1);
        const gapX = sub(m.xs[1], m.xs[0]), gapY = sub(m.ys[1], m.ys[0]), dlt = sub(c22.p, c22.prod);
        const val = mul(mul(gapX, gapY), dlt);
        steps.push({ html: '<b>Two values each</b> (the lecture’s remark at ' + at(V5, 19, 0) + '): then uncorrelated forces independent. For a 2 × 2 table, ' + tex(COV + '(X,Y)=(x_2-x_1)(y_2-y_1)\\big(f_{XY}(x_2,y_2)-f_X(x_2)f_Y(y_2)\\big)') + ':',
          math: '(' + nt(m.xs[1]) + '-' + np(m.xs[0]) + ')(' + nt(m.ys[1]) + '-' + np(m.ys[0]) + ')\\big(' + nt(c22.p) + '-' + np(c22.prod) + '\\big)=' + np(gapX) + '\\cdot ' + np(gapY) + '\\cdot ' + np(dlt) + eqx(val) + (same(val, m.cov) ? '=' + COV + '(X,Y)\\ \\checkmark' : ''),
          note: 'So ' + tex(COV + '=0') + ' makes ' + tex('f_{XY}(x_2,y_2)=f_X(x_2)f_Y(y_2)') + ', and with fixed margins the other three cells then factor too. With three values for ' + tex('X') + ' this breaks — try the “uncorrelated but dependent” example.' });
      }
      body.appendChild(K.steps(steps));
    }

    /* ---------------- rho = ±1 */
    function drawLine(m) {
      const body = P.line.body;
      Lab.clear(body);
      P.line.sub('L3.6 at ' + at(V6, 3, 30) + ': ' + tex('\\rho(X,Y)=1') + ' or ' + tex('-1') + ' exactly when ' + tex('Y=aX+b') + ' with probability 1 for some ' + tex('a\\ne 0') + ' — ' + tex('Y') + ' is a linear function of ' + tex('X') + '.');
      const steps = [];
      if (!m.defined) {
        steps.push({ html: tex('\\rho') + ' is not defined here (' + tex(SD + '(' + (isZero(m.varX) ? 'X' : 'Y') + ')=0') + '). ' + (m.src === 'line' && isZero(m.a) ? 'With ' + tex('a=0') + ', ' + tex('Y=' + nt(m.b)) + ' is a constant, a flat line — the rule needs ' + tex('a\\ne 0') + '.' : '') });
        body.appendChild(K.steps(steps));
        return;
      }
      if (m.src === 'line') {
        const a = m.a;
        steps.push({ html: 'Your ' + tex('Y=' + linTex(a, 'X', m.b)) + '. By the properties: ' + tex(COV + '(X,aX+b)=a\\,' + VAR + '(X)') + ' and ' + tex(SD + '(aX+b)=|a|\\,' + SD + '(X)') + ', so',
          math: '\\rho(X,Y)=\\dfrac{a\\,' + VAR + '(X)}{' + SD + '(X)\\cdot |a|\\,' + SD + '(X)}=\\dfrac{a}{|a|}=\\dfrac{' + nt(a) + '}{' + nt(abs(a)) + '}=' + (sgn(a) > 0 ? '1' : '-1'),
          note: 'Check with the numbers above: ' + tex(COV + '(X,Y)=' + nt(m.cov)) + ' and ' + tex('a\\,' + VAR + '(X)=' + np(a) + '\\cdot ' + np(m.varX) + eqx(mul(a, m.varX))) + ' ' + mark(same(m.cov, mul(a, m.varX))) + '.' });
      }
      if (m.line) {
        const L = m.line;
        const pts = m.cells.filter(c => c.pos);
        steps.push({ html: tex('\\rho(X,Y)' + eqx(m.rho)) + ', so the points with positive probability must lie on one line. Its slope and intercept from your numbers:',
          math: 'a=\\dfrac{' + COV + '(X,Y)}{' + VAR + '(X)}=\\dfrac{' + nt(m.cov) + '}{' + nt(m.varX) + '}' + eqx(L.slope) + ',\\quad b=E[Y]-a\\,E[X]=' + nt(m.EY) + '-' + np(L.slope) + '\\cdot ' + np(m.EX) + eqx(L.icpt) });
        steps.push({ html: 'Every point with positive probability: is ' + tex('y=' + linTex(L.slope, 'x', L.icpt)) + '? ' + mark(L.ok),
          block: Lab.table([tex('(x,y)'), tex(linTex(L.slope, 'x', L.icpt)), ''], pts.slice(0, 24).map(c => [nw('(' + nt(c.x) + ',' + nt(c.y) + ')'), nw(linTex(L.slope, nb(c.x), L.icpt) + eqx(add(mul(L.slope, c.x), L.icpt))), mark(same(c.y, add(mul(L.slope, c.x), L.icpt)))])) });
      } else {
        steps.push({ html: tex('|\\rho(X,Y)|\\lt 1') + ' here: ' + tex('\\rho^2=\\dfrac{' + COV + '(X,Y)^2}{' + VAR + '(X)\\,' + VAR + '(Y)}=\\dfrac{' + np(m.cov) + '^2}{' + np(m.varX) + '\\cdot ' + np(m.varY) + '}' + eqx(m.rho2) + '\\lt 1') + '. So the points with positive probability do <b>not</b> all lie on one line: knowing ' + tex('X') + ' does not fix ' + tex('Y') + ' through a line.' });
        steps.push({ html: 'See ' + tex('\\rho=\\pm1') + ': choose <b>Y = aX + b</b> on the left, or the L3.6 examples with ' + tex('x=\\pm\\tfrac14') + ', or the L3.5 motivation table 2.' });
      }
      body.appendChild(K.steps(steps));
    }

    setSrc(st.src);
    showPreset(st.loaded);
    update();
  }

  Lab.lab({
    id: 'lab-s2-cov', course: 's2', week: 3, order: 3,
    title: 'Covariance and correlation lab', sub: 'Week 3 · L3.5–L3.6',
    topics: ['covariance', 'E[XY]', 'correlation coefficient', 'scatter picture', 'Var(X + Y)', 'uncorrelated vs independent', 'ρ = ±1'],
    desc: 'Type a joint table of any size, pick two independent distributions, or set Y = aX + b. See E[X], E[Y], E[XY] cell by cell, Cov(X, Y) two ways, Var, SD and ρ, a picture of the means and the sign of every cell, and each property with your own numbers.',
    render: host => covLab(host),
  });
})();
