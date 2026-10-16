/* Maths II lab, Week 2 (L2.1–L2.3): 'lab-m2-cramer'.
   Input: a 2×2 or 3×3 matrix A and a column b. Output: every minor and cofactor (deleted row and column greyed out),
   the cofactor matrix, adj(A) = Cᵀ, det(A) expanded along any row or column, A⁻¹ = adj(A)/det(A) with the check
   A·A⁻¹ = I, Cramer's rule with each A_{x_i}, the same x from x = A⁻¹b and, when det(A) = 0, why both methods fail
   and what row reduction says about Ax = b. All arithmetic is exact (Lab.F). */
(function () {
  'use strict';
  const { h, F } = Lab;
  const K = Lab.play;
  const esc = Lab.esc;
  const KEY = 'lab:m2-cramer';

  /* ================================================================ TeX helpers */
  const memo = new Map();
  /** Inline TeX → HTML, cached: matrices repeat the same entries many times. */
  const tx = s => {
    let r = memo.get(s);
    if (r === undefined) { if (memo.size > 5000) memo.clear(); r = Lab.tex(s); memo.set(s, r); }
    return r;
  };
  /** A number as compact TeX: 5, -3, \tfrac{7}{3}, -\tfrac{1}{2}. */
  const T = f => (f.d === 1 ? String(f.n) : (f.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.n) + '}{' + f.d + '}');
  /** The same, in brackets when negative (inside a product or after a minus sign). */
  const par = f => (f.n < 0 ? '(' + T(f) + ')' : T(f));
  /** "a·b" as one group, so a long line breaks between products, never inside one. */
  const pr = (a, b) => '{' + par(a) + '\\cdot ' + par(b) + '}';
  /** "a·b + c·d + …" for pairs [a, b]. */
  const prods = pairs => pairs.map(([a, b], k) => (k ? '+' : '') + pr(a, b)).join('');
  /** A matrix entry: whole numbers as they are, fractions at full size. */
  const cellT = f => (f.d === 1 ? String(f.n) : (f.n < 0 ? '-' : '') + '\\dfrac{' + Math.abs(f.n) + '}{' + f.d + '}');
  /** "u + v − w": values added, with their signs folded in. */
  const sum = vals => vals.map((v, k) => (k === 0 ? T(v) : v.n < 0 ? '-' + T(v.neg()) : '+' + T(v))).join('');
  /** "≈ 0.3243" (or "= 0.25" when the decimal ends) after a fraction; empty for a whole number. */
  const dec = f => (f.d === 1 ? '' : (K.exactDecimal(f) ? '=' : '\\approx ') + Lab.fmtDec(Number(f), 4));
  const vecTex = v => '\\begin{bmatrix}' + v.map(T).join('\\\\') + '\\end{bmatrix}';
  const matTex = M => (M.some(r => r.some(v => v.d !== 1)) ? '\\def\\arraystretch{1.5}' : '') + '\\begin{bmatrix}' + M.map(r => r.map(T).join('&')).join('\\\\') + '\\end{bmatrix}';
  /** A row of values in brackets: (a, b, c). */
  const tupTex = v => '\\left(' + v.map(T).join(',\\ ') + '\\right)';
  /** Two-digit index "12" for row 1, column 2 (0-based in). */
  const ij = (i, j) => String(i + 1) + String(j + 1);
  const ok = '<span class="mc-ok">✓</span>';
  /** "x₁ ≈ −0.3243, x₂ = 2, …": each value kept on one line. */
  const decimals = x => x.map((v, k) => '<span class="mc-nw">' + tx('x_' + (k + 1) + (v.d === 1 ? '=' + T(v) : dec(v))) + (k < x.length - 1 ? ',' : '') + '</span>').join(' ');

  /* ================================================================ sources */
  const VID = { L21: 'uO3mocPU9Q4', L22: 'sOFHgNXXRFM', L23: '0txe9Mu5OdM' };
  /** Link into a lecture video at a minute mark, e.g. at('L22', 2.5) → "2:30". */
  const at = (k, min) => Lab.vlink(VID[k], min);
  /** Link to an activity question set page of the question bank. */
  const aq = (id, text) => text;
  const noB = (v, plain) => ' The ' + (v ? 'question' : 'lecture') + ' gives no ' + tx('b') + '; here ' + tx('b') + ' is the first column of ' + tx('I') + (plain ? '.' : ', so ' + tx('x') + ' is the first column of ' + tx('A^{-1}') + '.');
  const PRESETS = [
    { label: 'L2.2 · 2×2: 4x₁ − 3x₂ = 11, 6x₁ + 5x₂ = 7', A: [['4', '-3'], ['6', '5']], b: ['11', '7'],
      source: 'L2.2 at ' + at('L22', 0.5) + ' (solved by elimination) and ' + at('L22', 2.5) + ' (Cramer’s rule): ' + tx('\\det(A)=38') + ', ' + tx('\\det(A_{x_1})=76') + ', ' + tx('\\det(A_{x_2})=-38') + ', so ' + tx('x_1=2') + ', ' + tx('x_2=-1') + '.' },
    { label: 'L2.2 · 3×3: A = (1 0 3 / 0 2 5 / 4 3 1), b = (0, 2, 1)', A: [['1', '0', '3'], ['0', '2', '5'], ['4', '3', '1']], b: ['0', '2', '1'],
      source: 'L2.2 at ' + at('L22', 11.5) + ': ' + tx('\\det(A)=-37') + '; ' + tx('\\det(A_{x_1})=12') + ', ' + tx('\\det(A_{x_2})=-27') + ', ' + tx('\\det(A_{x_3})=-4') + ', so ' + tx('x_1=-\\tfrac{12}{37}') + ', ' + tx('x_2=\\tfrac{27}{37}') + ', ' + tx('x_3=\\tfrac{4}{37}') + '.' },
    { label: 'L2.3 · the inverse of (4 7 / 2 6)', A: [['4', '7'], ['2', '6']], b: ['1', '0'],
      source: 'L2.3 at ' + at('L23', 2) + ': the inverse is ' + tx('\\begin{bmatrix}0.6&-0.7\\\\-0.2&0.4\\end{bmatrix}') + '.' + noB() },
    { label: 'L2.3 · the inverse of (0.6 −0.7 / −0.2 0.4)', A: [['0.6', '-0.7'], ['-0.2', '0.4']], b: ['1', '0'],
      source: 'L2.3 at ' + at('L23', 2.5) + ': “the first matrix is the inverse of the second matrix”, so the inverse of this one is ' + tx('\\begin{bmatrix}4&7\\\\2&6\\end{bmatrix}') + '. The decimals become exact fractions (0.6 = 3/5).' + noB() },
    { label: 'L2.3 · the adjugate of (1 2 3 / 0 2 8 / 5 6 0)', A: [['1', '2', '3'], ['0', '2', '8'], ['5', '6', '0']], b: ['1', '0', '0'],
      source: 'L2.3 at ' + at('L23', 12) + ' to ' + at('L23', 17.5) + ': ' + tx('\\det(A)=2') + ', the minors, the cofactor matrix, ' + tx('\\operatorname{adj}(A)=C^{T}') + ' and the check ' + tx('A\\cdot\\tfrac12\\operatorname{adj}(A)=I') + '.' + noB() },
    { label: 'L2.3 · prices system: x = A⁻¹b', A: [['8', '8', '4'], ['12', '5', '7'], ['3', '2', '5']], b: ['1960', '2215', '1135'],
      source: 'L2.3 at ' + at('L23', 24.5) + ' to ' + at('L23', 27) + ': ' + tx('8x_1+8x_2+4x_3=1960') + ', ' + tx('12x_1+5x_2+7x_3=2215') + ', ' + tx('3x_1+2x_2+5x_3=1135') + '. The lecture finds ' + tx('\\det(A)=-188') + ' and ' + tx('x=A^{-1}b=(45,\\ 125,\\ 150)') + '.' },
    { label: 'L2.3 · homogeneous Ax = 0 with det(A) = 0', A: [['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']], b: ['0', '0', '0'],
      source: 'L2.3 at ' + at('L23', 27.5) + ': ' + tx('Ax=0') + ' has only the solution ' + tx('x=0') + ' when ' + tx('\\det(A)\\ne 0') + ', and infinitely many when ' + tx('\\det(A)=0') + '. The lecture gives no numbers for it; this uses the matrix with rows 1 2 3, 4 5 6, 7 8 9, whose determinant is 0, with ' + tx('b=0') + '.' },
                              ];
  const START = 1;
  const DEF = () => ({ n: PRESETS[START].A.length, A: PRESETS[START].A.map(r => r.slice()), b: PRESETS[START].b.slice(), loaded: PRESETS[START].label });

  /* ================================================================ exact arithmetic */
  // Lab.Frac marks a result whose numerator or denominator left the safe-integer range as approximate.
  // Every operation below is checked, so such a result is reported instead of being shown as exact.
  const chk = f => { if (f.approx) throw new RangeError('too big for exact fractions'); return f; };
  const add = (a, b) => chk(a.add(b));
  const subt = (a, b) => chk(a.sub(b));
  const mul = (a, b) => chk(a.mul(b));
  const div = (a, b) => chk(a.div(b));
  const neg = a => a.neg();
  const zero = () => F(0);
  const sumF = list => list.reduce(add, zero());
  const range = n => Array.from({ length: n }, (_, k) => k);
  /** What is left of M after deleting row i and column j. */
  const cut = (M, i, j) => M.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
  /** Determinant by expansion along the first row (the definition in L2.1). */
  function det(M) {
    if (M.length === 1) return M[0][0];
    if (M.length === 2) return subt(mul(M[0][0], M[1][1]), mul(M[0][1], M[1][0]));
    return sumF(M[0].map((a, j) => { const m = det(cut(M, 0, j)); return mul(a, j % 2 ? neg(m) : m); }));
  }
  const transpose = M => M[0].map((_, j) => M.map(r => r[j]));
  const matMul = (X, Y) => X.map(r => Y[0].map((_, k) => sumF(r.map((v, j) => mul(v, Y[j][k])))));
  const matVec = (X, v) => X.map(r => sumF(r.map((a, j) => mul(a, v[j]))));
  /** A with column i replaced by the column b. */
  const withCol = (A, i, b) => A.map((r, k) => r.map((v, j) => (j === i ? b[k] : v)));
  const isId = M => M.every((r, i) => r.every((v, j) => v.eq(i === j ? 1 : 0)));
  const isZeroM = M => M.every(r => r.every(v => v.isZero()));
  const col = v => v.map(x => [x]);

  /** Reduced row echelon form of [A | b], with every row operation and the matrix after it. */
  function rref(A, b) {
    const n = A.length;
    const R = A.map((r, i) => r.concat([b[i]]));
    const ops = [], piv = [];
    const snap = () => R.map(r => r.slice());
    const coef = m => (m.eq(1) ? '' : m.eq(-1) ? '-' : T(m));
    let r = 0;
    for (let c = 0; c < n && r < n; c++) {
      const p = range(n).find(i => i >= r && !R[i][c].isZero());
      if (p === undefined) continue;
      if (p !== r) { const t = R[p]; R[p] = R[r]; R[r] = t; ops.push({ op: 'R_' + (r + 1) + '\\leftrightarrow R_' + (p + 1), M: snap() }); }
      const pv = R[r][c];
      if (!pv.eq(1)) { const m = div(F(1), pv); R[r] = R[r].map(v => mul(v, m)); ops.push({ op: 'R_' + (r + 1) + '\\to ' + coef(m) + 'R_' + (r + 1), M: snap() }); }
      for (let i = 0; i < n; i++) {
        if (i === r || R[i][c].isZero()) continue;
        const f = R[i][c];
        R[i] = R[i].map((v, k) => subt(v, mul(f, R[r][k])));
        ops.push({ op: 'R_' + (i + 1) + '\\to R_' + (i + 1) + (f.n > 0 ? '-' : '+') + coef(f.n > 0 ? f : neg(f)) + 'R_' + (r + 1), M: snap() });
      }
      piv.push(c);
      r++;
    }
    return { R, ops, piv };
  }
  /** What Ax = b does when det(A) = 0: no solution, or x = p + t·v₁ (+ s·v₂ …). */
  function singular(A, b) {
    const n = A.length, red = rref(A, b), R = red.R;
    const out = Object.assign({}, red);
    out.bad = R.findIndex(row => row.slice(0, n).every(v => v.isZero()) && !row[n].isZero());
    if (out.bad >= 0) { out.kind = 'none'; return out; }
    out.kind = red.piv.length === n ? 'one' : 'many';
    out.free = range(n).filter(c => !red.piv.includes(c));
    out.p = range(n).map(() => zero());
    red.piv.forEach((c, k) => { out.p[c] = R[k][n]; });
    out.vs = out.free.map(f => {
      const v = range(n).map(() => zero());
      v[f] = F(1);
      red.piv.forEach((c, k) => { v[c] = neg(R[k][f]); });
      return v;
    });
    out.Ap = matVec(A, out.p);
    out.Av = out.vs.map(v => matVec(A, v));
    return out;
  }
  /** Everything the panels show, from exact A and b. */
  function compute(A, b) {
    const n = A.length;
    const M = A.map((row, i) => row.map((_, j) => det(cut(A, i, j))));
    const C = M.map((row, i) => row.map((m, j) => ((i + j) % 2 ? neg(m) : m)));
    const adj = transpose(C);
    const d = det(A);
    const r = { n, A, b, M, C, adj, d };
    r.Ax = range(n).map(i => withCol(A, i, b));
    r.dx = r.Ax.map(det);
    r.Aadj = matMul(A, adj);
    if (!d.isZero()) {
      r.inv = adj.map(row => row.map(v => div(v, d)));
      r.AI = matMul(A, r.inv);
      r.IA = matMul(r.inv, A);
      r.x = r.dx.map(v => div(v, d));
      r.xi = matVec(r.inv, b);
      r.Axb = matVec(A, r.x);
    } else r.sing = singular(A, b);
    return r;
  }

  /* ================================================================ drawing helpers */
  /** A matrix drawn with HTML brackets. M holds Fracs or TeX strings; o.cell(i, j) adds classes to a cell. */
  function mat(M, o) {
    o = o || {};
    const g = h('div', { class: 'mc-mat' + (o.cls ? ' ' + o.cls : '') });
    g.style.setProperty('--cols', M[0].length);
    M.forEach((row, i) => row.forEach((v, j) => {
      const c = h('span', { class: 'mc-c' + (o.cell ? ' ' + (o.cell(i, j) || '') : '') });
      c.innerHTML = tx(typeof v === 'string' ? v : cellT(v));
      g.appendChild(c);
    }));
    return g;
  }
  /** A line of TeX pieces and matrices that wraps on a narrow screen. */
  function eq() {
    const row = h('div', { class: 'mc-eq' });
    [...arguments].forEach(p => row.appendChild(typeof p === 'string' ? h('span', { class: 'mc-t', html: tx(p) }) : p));
    return row;
  }
  /** Lines of inline TeX (each may also carry trailing HTML). */
  function lines(list, cls) {
    const box = h('div', { class: cls || 'mc-list' });
    list.forEach(l => box.appendChild(h('div', { html: Array.isArray(l) ? tx(l[0]) + l[1] : tx(l) })));
    return box;
  }
  /** A closed "show more" box. */
  function more(label, content) {
    const d = h('details', { class: 'mc-more' }, h('summary', { html: label }));
    d.appendChild(content);
    return d;
  }
  /** Entry (i, k) of X·Y as a row-times-column sum, one line per entry. */
  function dotList(X, Y, Z) {
    const out = [];
    Z.forEach((row, i) => row.forEach((z, k) => {
      const pairs = X[i].map((v, j) => [v, Y[j][k]]);
      out.push('(' + (i + 1) + ',' + (k + 1) + '):\\ ' + prods(pairs) + '=' + sum(pairs.map(([a, c]) => mul(a, c))) + '=' + T(z));
    }));
    return lines(out);
  }
  const setTitle = (panel, html) => Lab.setHTML(panel.querySelector('.pl-panel-head h3'), html);
  /** Colour classes for rows (or columns) 1, 2, 3. */
  const tone = k => 't' + (k + 1);

  /* ================================================================ styles */
  const CSS = `
.mc-lab .mc-dyn { display: grid; gap: 12px; min-width: 0; }
.mc-lab .pl-controls select.field { height: 46px; font-size: 16px; }
.mc-lab .pl-controls .seg button { min-height: 44px; font-size: 15px; }
.mc-lab .pl-reset .btn { height: 44px; font-size: 15px; }
.mc-lab .mc-in { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)) 3px minmax(0, 1fr); gap: 6px; align-items: center; }
.mc-lab .mc-in-h { font-size: 13px; font-weight: 650; color: var(--ink-3); text-align: center; line-height: 1.2; }
.mc-lab .mc-in .field { width: 100%; height: 46px; padding: 0 4px; font-family: var(--font-mono); font-size: 16px; text-align: center; }
.mc-lab .mc-in .mc-ib { background: var(--pick-soft); border-color: var(--pick-line); }
.mc-lab .mc-bar { align-self: stretch; border-radius: 2px; background: var(--line-2); }
.mc-lab .mc-tools { display: flex; flex-wrap: wrap; gap: 8px; }
.mc-lab .mc-tools .btn { height: 44px; padding: 0 14px; font-size: 14.5px; }
.mc-lab .mc-mat { position: relative; display: inline-grid; grid-template-columns: repeat(var(--cols), auto); align-items: center; justify-items: stretch; padding: 3px 9px; vertical-align: middle; font-size: 16px; line-height: 1.3; }
.mc-lab .mc-mat::before, .mc-lab .mc-mat::after { content: ""; position: absolute; top: 0; bottom: 0; width: 6px; border: 1.6px solid var(--ink-3); pointer-events: none; }
.mc-lab .mc-mat::before { left: 0; border-right: 0; }
.mc-lab .mc-mat::after { right: 0; border-left: 0; }
.mc-lab .mc-c { min-width: 2.1em; padding: 4px 6px; text-align: center; white-space: nowrap; }
.mc-lab .mc-c .katex { font-size: 1.06em; }
.mc-lab .mc-mat.sm { font-size: 14px; padding: 2px 7px; }
.mc-lab .mc-mat.sm .mc-c { min-width: 1.75em; padding: 2px 4px; }
.mc-lab .mc-c.del { color: var(--ink-4); }
.mc-lab .mc-c.drow { background: linear-gradient(var(--ink-4), var(--ink-4)) center / 100% 1.5px no-repeat; }
.mc-lab .mc-c.dcol { background: linear-gradient(var(--ink-4), var(--ink-4)) center / 1.5px 100% no-repeat; }
.mc-lab .mc-c.drow.dcol { background: linear-gradient(var(--ink-4), var(--ink-4)) center / 100% 1.5px no-repeat, linear-gradient(var(--ink-4), var(--ink-4)) center / 1.5px 100% no-repeat; }
.mc-lab .mc-c.keep { font-weight: 700; color: var(--accent-ink); background: var(--accent-soft); }
.mc-lab .mc-c.bcol { font-weight: 700; color: var(--pick); background: var(--pick-soft); }
.mc-lab .mc-c.t1 { color: var(--x); background: var(--x-soft); }
.mc-lab .mc-c.t2 { color: var(--y); background: var(--y-soft); }
.mc-lab .mc-c.t3 { color: var(--z); background: var(--z-soft); }
.mc-lab .mc-c.good { color: var(--good); font-weight: 700; }
.mc-lab .mc-c.warn { color: var(--bad); font-weight: 700; }
.mc-lab .mc-c.augl { box-shadow: inset 1.6px 0 0 var(--ink-3); }
.mc-lab .mc-eq { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; min-width: 0; }
.mc-lab .mc-t { white-space: nowrap; }
.mc-lab .mc-t .katex { font-size: 1.12em; }
.mc-lab .mc-cq { container-type: inline-size; }
.mc-lab .mc-cards { display: grid; grid-template-columns: repeat(var(--n), minmax(0, 1fr)); gap: 10px; }
@container (max-width: 640px) { .mc-lab .mc-cards { grid-template-columns: minmax(0, 1fr); } }
.mc-lab .mc-card { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 12px; border-radius: 14px; border: 1px solid var(--line); background: var(--bg-sunk); min-width: 0; }
.mc-lab .mc-card-h { flex: 1 1 100%; font-size: 13.5px; font-weight: 650; color: var(--ink-2); }
.mc-lab .mc-card .mc-lines { flex: 1 1 150px; min-width: 0; display: grid; gap: 2px; font-size: 15px; line-height: 1.5; }
.mc-lab .mc-card.wide .mc-lines { flex-basis: 100%; }
.mc-lab .mc-sys .katex-display { margin: 2px 0; text-align: left; }
.mc-lab .mc-sys .katex-display > .katex { text-align: left; }
.mc-lab .mc-list { display: grid; gap: 4px; font-size: 15.5px; line-height: 1.5; min-width: 0; }
.mc-lab .mc-list > div, .mc-lab .mc-lines > div { min-width: 0; }
.mc-lab .mc-nw { white-space: nowrap; }
.mc-lab .mc-ok { color: var(--good); font-weight: 700; margin-left: 4px; }
.mc-lab .mc-no { color: var(--bad); font-weight: 700; }
.mc-lab details.mc-more > summary { cursor: pointer; font-size: 14.5px; font-weight: 600; color: var(--accent-ink); min-height: 44px; display: flex; align-items: center; }
.mc-lab details.mc-more[open] > summary { margin-bottom: 6px; }
.mc-lab .mc-ops { display: grid; gap: 10px; }
.mc-lab .mc-stale .pl-panel { opacity: .5; }
.mc-lab .mc-ans .pl-ans-big .katex-display > .katex { font-size: 1.3em; }
@media (max-width: 560px) {
  .mc-lab .mc-ans .pl-ans-big .katex-display > .katex { font-size: 1.12em; }
  .mc-lab .mc-mat { font-size: 15px; padding: 3px 8px; }
  .mc-lab .mc-c { min-width: 1.9em; padding: 3px 4px; }
  .mc-lab .mc-card .mc-lines { font-size: 14px; }
  .mc-lab .mc-card { padding: 10px; gap: 8px 10px; }
}
`;
  function injectStyle() {
    if (document.getElementById('mc-style')) return;
    const s = document.createElement('style');
    s.id = 'mc-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ================================================================ the lab */
  function cramerLab() {
    let st = load();
    let root, good = null;
    const ctl = {}, P = {};
    const save = () => Lab.store.set(KEY, st);
    function load() {
      const s = Object.assign(DEF(), Lab.store.get(KEY, {}));
      const shapeOk = (s.n === 2 || s.n === 3) && Array.isArray(s.A) && s.A.length === s.n && s.A.every(r => Array.isArray(r) && r.length === s.n) && Array.isArray(s.b) && s.b.length === s.n;
      return shapeOk ? s : DEF();
    }

    /* ---------------------------------------------------------- input */
    /** One typed entry → exact Frac, or the reason it cannot be used. */
    function readNum(s) {
      const t = String(s == null ? '' : s).trim();
      if (!t) return { err: 'is empty' };
      const f = K.parseNum(t);
      if (f == null) return { err: 'is not a number' };
      if (!(f instanceof Lab.Frac) || f.approx) return { err: 'is not exact (use a whole number, a decimal or a fraction)' };
      return { f };
    }
    function parseAll() {
      const n = st.n, bad = [];
      const A = range(n).map(i => range(n).map(j => { const r = readNum(st.A[i][j]); if (r.err) bad.push({ i, j, raw: st.A[i][j], err: r.err }); return r.f; }));
      const b = range(n).map(i => { const r = readNum(st.b[i]); if (r.err) bad.push({ i, j: -1, raw: st.b[i], err: r.err }); return r.f; });
      return { ok: !bad.length, A, b, bad };
    }

    /* ---------------------------------------------------------- controls */
    function touched() {
      if (!st.loaded) return;
      st.loaded = null;
      ctl.pre.select.value = '';
      Lab.setHTML(ctl.pre.lastChild, '');
    }
    function loadPreset(it) {
      st.n = it.A.length;
      st.A = it.A.map(r => r.slice());
      st.b = it.b.slice();
      st.loaded = it.label;
      buildSide();
      draw();
    }
    function setSize(n) {
      if (n === st.n) return;
      const A = range(n).map(i => range(n).map(j => (st.A[i] && st.A[i][j] != null ? st.A[i][j] : i === j ? '1' : '0')));
      st.b = range(n).map(i => (st.b[i] != null ? st.b[i] : '0'));
      st.A = A;
      st.n = n;
      touched();
      buildSide();
      draw();
    }
    function randomize() {
      const n = st.n, ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
      let A;
      for (let k = 0; k < 60; k++) {
        A = range(n).map(() => range(n).map(() => ri(-5, 5)));
        if (!det(A.map(r => r.map(v => F(v)))).isZero()) break;
      }
      st.A = A.map(r => r.map(String));
      st.b = range(n).map(() => String(ri(-9, 9)));
      touched();
      buildSide();
      draw();
      Lab.setHTML(ctl.toolMsg, 'New random whole numbers from −5 to 5 in ' + tx('A') + ' (with ' + tx('\\det(A)\\ne 0') + ') and from −9 to 9 in ' + tx('b') + '.');
    }
    function makeSingular() {
      const p = parseAll();
      if (!p.ok) { Lab.setHTML(ctl.toolMsg, '<span class="cbad">Fix the red boxes first.</span>'); return; }
      const n = st.n;
      if (n === 3) st.A[2] = range(3).map(j => add(p.A[0][j], p.A[1][j]).toString());
      else st.A[1] = range(2).map(j => mul(F(2), p.A[0][j]).toString());
      touched();
      buildSide();
      draw();
      Lab.setHTML(ctl.toolMsg, (n === 3 ? 'Row 3 of ' + tx('A') + ' is now row 1 + row 2' : 'Row 2 of ' + tx('A') + ' is now 2 × row 1') + ', so ' + tx('\\det(A)=0') + ': a row that is a combination of the other rows makes the determinant 0 (L2.1 at ' + at('L21', 26) + ').');
    }
    function zeroB() {
      st.b = st.b.map(() => '0');
      touched();
      buildSide();
      draw();
      Lab.setHTML(ctl.toolMsg, tx('b=0') + ' makes the system homogeneous (L2.3 at ' + at('L23', 27.5) + ').');
    }
    function cellInput(i, j) {
      const isB = j < 0;
      const inp = h('input', {
        class: 'field' + (isB ? ' mc-ib' : ''), type: 'text', value: isB ? st.b[i] : st.A[i][j], autocomplete: 'off', autocorrect: 'off', autocapitalize: 'off', spellcheck: 'false', enterkeyhint: 'next',
        'aria-label': isB ? 'b, entry ' + (i + 1) : 'A, row ' + (i + 1) + ', column ' + (j + 1),
      });
      inp.addEventListener('input', () => { if (isB) st.b[i] = inp.value; else st.A[i][j] = inp.value; touched(); Lab.setHTML(ctl.toolMsg, ''); drawSoon(); });
      ctl.cells.push({ inp, i, j });
      return inp;
    }
    function buildGrid() {
      const n = st.n;
      ctl.cells = [];
      const g = h('div', { class: 'mc-in', role: 'group', 'aria-label': 'matrix A and column b' });
      g.style.setProperty('--n', n);
      const head = h('div', { class: 'mc-in-h', html: 'matrix ' + tx('A') });
      head.style.gridColumn = '1 / span ' + n;
      g.append(head, h('div'), h('div', { class: 'mc-in-h', html: 'column ' + tx('b') }));
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) g.appendChild(cellInput(i, j));
        g.appendChild(h('div', { class: 'mc-bar' }));
        g.appendChild(cellInput(i, -1));
      }
      return g;
    }
    function buildSide() {
      const box = ctl.dyn;
      Lab.clear(box);
      box.appendChild(K.group('1 · Size'));
      const seg = Lab.seg([{ label: '2 × 2', value: 2 }, { label: '3 × 3', value: 3 }], st.n, v => setSize(Number(v)));
      box.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Equations and unknowns' }), seg));
      box.appendChild(K.group('2 · Your A and b'));
      const lab = h('label', { class: 'pl-label' });
      Lab.setHTML(lab, 'Row ' + tx('i') + ' is equation ' + tx('i') + ': its coefficients in ' + tx('A') + ', its right-hand side in ' + tx('b') + '.');
      ctl.msg = h('div', { class: 'pl-hint' });
      box.appendChild(h('div', { class: 'pl-field' }, lab, buildGrid(), ctl.msg));
      ctl.tools = h('div', { class: 'mc-tools' },
        Lab.button('Random', randomize, 'btn sm'),
        Lab.button(tx('b=0'), zeroB, 'btn sm'),
        Lab.button('Make ' + tx('\\det(A)=0'), makeSingular, 'btn sm'));
      ctl.toolMsg = h('div', { class: 'pl-hint' });
      box.append(ctl.tools, ctl.toolMsg);
    }

    /* ---------------------------------------------------------- draw */
    const drawSoon = Lab.debounce(() => draw(), 160);
    function draw() {
      save();
      const p = parseAll();
      ctl.cells.forEach(c => c.inp.classList.toggle('bad', p.bad.some(x => x.i === c.i && x.j === c.j)));
      let r = null, err = '';
      if (!p.ok) {
        err = p.bad.slice(0, 3).map(x => (x.j < 0 ? tx('b_' + (x.i + 1)) : tx('a_{' + ij(x.i, x.j) + '}')) + ' ' + esc(x.err)).join('; ') + (p.bad.length > 3 ? '; and ' + (p.bad.length - 3) + ' more' : '') + '.';
      } else {
        try { r = compute(p.A, p.b); } catch (e) {
          if (!(e instanceof RangeError)) throw e;
          err = 'These numbers make fractions too large to keep exact. Use smaller numbers.';
        }
      }
      Lab.setHTML(ctl.msg, err ? '<span class="cbad">' + err + '</span>' : 'Type whole numbers, decimals (0.6) or fractions (7/3). Every result below is an exact fraction.');
      root.querySelector('.pl-main').classList.toggle('mc-stale', !r && !!good);
      if (r) good = r;
      if (!good) {
        K.setAnswer(P.answer, { ev: '<span class="cbad">' + err + '</span>' });
        PANELS.forEach(k => { Lab.clear(P[k].body); P[k].body.appendChild(K.note('This fills in as soon as every box holds a number.', 'small muted')); });
        P.sing.hidden = true;
        return;
      }
      drawAnswer(good, r ? '' : err);
      if (!r) return;
      drawSystem(r);
      drawMinors(r);
      drawDet(r);
      drawSingular(r);
      drawAdj(r);
      drawInverse(r);
      drawCramer(r);
      drawBack(r);
    }
    const PANELS = ['sys', 'minor', 'det', 'adj', 'inv', 'cram', 'back'];

    function drawAnswer(r, err) {
      const n = r.n;
      const ev = (err ? '<span class="cbad">' + err + ' The panels show your last valid ' + tx('A') + ' and ' + tx('b') + '.</span><br>' : '') +
        (st.loaded ? 'Example: <b>' + esc(st.loaded) + '</b>. ' : '') +
        tx('A') + ' is ' + n + '×' + n + ' and ' + tx('b') + ' has ' + n + ' entries: ' + n + ' equations in ' + n + ' unknowns.';
      if (!r.d.isZero()) {
        const intAdj = r.d.d === 1 && r.adj.every(row => row.every(v => v.d === 1)) && Math.abs(r.d.n) !== 1;
        const invTex = intAdj ? T(div(F(1), r.d)) + matTex(r.adj) : matTex(r.inv);
        const big = '\\begin{aligned}\\det(A)&=' + T(r.d) + '\\ne 0\\\\x&=' + tupTex(r.x) + '\\\\A^{-1}&=' + invTex + '\\end{aligned}';
        const decs = r.x.some(v => v.d !== 1) ? ' As decimals: ' + decimals(r.x) + '.' : '';
        K.setAnswer(P.answer, { ev, big, sub: tx('\\det(A)\\ne 0') + ', so ' + tx('A') + ' is invertible and the system has exactly one solution. Cramer’s rule and ' + tx('x=A^{-1}b') + ' both give this ' + tx('x') + ', and ' + tx('A\\cdot x=b') + ' checks out (below).' + decs });
        return;
      }
      const s = r.sing;
      let line;
      if (s.kind === 'none') line = 'Ax=b&\\ \\text{has no solution}';
      else {
        const parts = [];
        if (!s.p.every(v => v.isZero())) parts.push(vecTex(s.p));
        s.vs.forEach((v, k) => parts.push((parts.length ? '+' : '') + PAR[k] + vecTex(v)));
        line = 'x&=' + parts.join('');
      }
      const big = '\\begin{aligned}\\det(A)&=0\\\\A^{-1}&\\ \\text{does not exist}\\\\' + line + '\\end{aligned}';
      const sub = 'Both ' + tx('A^{-1}=\\tfrac{1}{\\det(A)}\\operatorname{adj}(A)') + ' and Cramer’s rule divide by ' + tx('\\det(A)=0') + ', so neither gives ' + tx('x') + '. Row reduction decides: ' +
        (s.kind === 'none' ? 'there is <b>no solution</b>.' : 'there are <b>infinitely many solutions</b>, one for each value of ' + s.vs.map((_, k) => tx(PAR[k])).join(' and ') + '.') + ' The panel “When ' + tx('\\det(A)=0') + '” explains why.';
      K.setAnswer(P.answer, { ev, big, sub });
    }
    const PAR = ['t', 's', 'u'];

    function eqTex(row, rhs) {
      let s = '';
      row.forEach((a, j) => {
        if (a.isZero()) return;
        const abs = a.n < 0 ? neg(a) : a;
        s += (a.n < 0 ? '-' : s ? '+' : '') + (abs.eq(1) ? '' : T(abs)) + 'x_' + (j + 1);
      });
      return (s || '0') + '&=' + T(rhs);
    }
    function drawSystem(r) {
      const n = r.n, body = P.sys.body;
      Lab.clear(body);
      setTitle(P.sys, 'Your system ' + tx('Ax=b'));
      P.sys.sub('Row ' + tx('i') + ' of ' + tx('A') + ' holds the coefficients of equation ' + tx('i') + ', and ' + tx('b') + ' (violet) the right-hand sides (L2.2 at ' + at('L22', 0.5) + ').');
      body.appendChild(h('div', { class: 'mc-sys', html: Lab.tex('\\begin{aligned}' + r.A.map((row, i) => eqTex(row, r.b[i])).join('\\\\') + '\\end{aligned}', true) }));
      body.appendChild(eq('A\\,x=b:', mat(r.A), mat(range(n).map(k => ['x_' + (k + 1)])), '=', mat(col(r.b), { cell: () => 'bcol' })));
      const typed = [];
      range(n).forEach(i => range(n + 1).forEach(j => {
        const raw = String(j < n ? st.A[i][j] : st.b[i]).trim(), f = j < n ? r.A[i][j] : r.b[i];
        if (raw !== f.toString() && typed.length < 6) typed.push(esc(raw) + ' = ' + tx(T(f)));
      }));
      if (typed.length) body.appendChild(K.note('You typed ' + typed.join(', ') + '. Every number below is the exact fraction.', 'small muted'));
    }

    function drawMinors(r) {
      const n = r.n, body = P.minor.body;
      Lab.clear(body);
      setTitle(P.minor, 'Every minor ' + tx('M_{ij}') + ' and cofactor ' + tx('C_{ij}'));
      P.minor.sub('L2.1 at ' + at('L21', 1) + ': the minor ' + tx('M_{ij}') + ' is the determinant of what is left after deleting row ' + tx('i') + ' and column ' + tx('j') + ' (crossed out in grey). The cofactor is ' + tx('C_{ij}=(-1)^{i+j}M_{ij}') + ': the sign follows the pattern below.');
      const signs = range(n).map(i => range(n).map(j => ((i + j) % 2 ? '-' : '+')));
      body.appendChild(eq('(-1)^{i+j}:', mat(signs, { cls: 'sm' }), '\\text{plus where } i+j \\text{ is even}'));
      const wrap = h('div', { class: 'mc-cq' });
      const grid = h('div', { class: 'mc-cards' });
      grid.style.setProperty('--n', n);
      range(n).forEach(i => range(n).forEach(j => grid.appendChild(minorCard(r, i, j))));
      wrap.appendChild(grid);
      body.appendChild(wrap);
      body.appendChild(eq('\\text{The cofactor matrix: }C=', mat(r.C)));
    }
    function minorCard(r, i, j) {
      const n = r.n, m = r.M[i][j], c = r.C[i][j], k = ij(i, j);
      const card = h('div', { class: 'mc-card' });
      card.appendChild(h('div', { class: 'mc-card-h', html: 'Delete row ' + (i + 1) + ' and column ' + (j + 1) + ' (entry ' + tx('a_{' + k + '}=' + T(r.A[i][j])) + ')' }));
      card.appendChild(mat(r.A, { cls: 'sm', cell: (p, q) => (p === i || q === j ? 'del' + (p === i ? ' drow' : '') + (q === j ? ' dcol' : '') : 'keep') }));
      const out = [];
      if (n === 2) out.push('M_{' + k + '}=' + T(m) + '\\ \\text{(the entry left)}');
      else {
        const [[a, b], [cc, d]] = cut(r.A, i, j);
        out.push('M_{' + k + '}=' + pr(a, d) + '-' + pr(b, cc));
        out.push('=' + T(mul(a, d)) + '-' + par(mul(b, cc)) + '=' + T(m));
      }
      out.push('C_{' + k + '}=(-1)^{' + (i + 1) + '+' + (j + 1) + '}\\cdot ' + par(m) + '=' + T(c));
      card.appendChild(lines(out, 'mc-lines'));
      return card;
    }

    /** The expansion of det(A) along row k (kind 'row') or column k ('col'). */
    function expansion(r, kind, k) {
      const idx = range(r.n);
      const at2 = t => (kind === 'row' ? [k, t] : [t, k]);
      const pairs = idx.map(t => { const [i, j] = at2(t); return [r.A[i][j], r.C[i][j]]; });
      const symb = idx.map(t => { const [i, j] = at2(t); return 'a_{' + ij(i, j) + '}C_{' + ij(i, j) + '}'; }).join('+');
      const vals = pairs.map(([a, c]) => mul(a, c));
      return { pairs, symb, vals, total: sumF(vals) };
    }
    function drawDet(r) {
      const n = r.n, body = P.det.body;
      Lab.clear(body);
      setTitle(P.det, tx('\\det(A)') + ' by cofactor expansion');
      P.det.sub('L2.1 at ' + at('L21', 2) + ': multiply each entry of row 1 by its cofactor and add. At ' + at('L21', 3) + ': any row or any column gives the same number.');
      const e = expansion(r, 'row', 0);
      const steps = [{
        html: 'Along row 1, with the cofactors from the cards above:',
        math: '\\begin{aligned}\\det(A)&=' + e.symb + '\\\\&=' + prods(e.pairs) + '\\\\&=' + sum(e.vals) + '=' + T(e.total) + '\\end{aligned}',
        note: n === 2 ? 'For a 2×2 matrix this is ' + tx('a_{11}a_{22}-a_{12}a_{21}') + ', because ' + tx('C_{11}=a_{22}') + ' and ' + tx('C_{12}=-a_{21}') + '.' : null,
      }];
      const all = [];
      ['row', 'col'].forEach(kind => range(n).forEach(k => {
        const x = expansion(r, kind, k);
        all.push(['\\text{' + (kind === 'row' ? 'row ' : 'column ') + (k + 1) + ':}\\ ' + prods(x.pairs) + '=' + sum(x.vals) + '=' + T(x.total), x.total.eq(r.d) ? ok : '']);
      }));
      steps.push({ html: 'Every row and every column gives the same value:', block: lines(all) });
      steps.push({ html: r.d.isZero()
        ? tx('\\det(A)=0') + ': ' + tx('A') + ' is <b>singular</b>. The next panel shows what that means for ' + tx('A^{-1}') + ', Cramer’s rule and ' + tx('Ax=b') + '.'
        : tx('\\det(A)=' + T(r.d) + '\\ne 0') + ': ' + tx('A') + ' is invertible (L2.3 at ' + at('L23', 18) + '). Press <b>Make det(A) = 0</b> to see what changes when the determinant is 0.' });
      body.appendChild(K.steps(steps));
    }

    function drawAdj(r) {
      const n = r.n, body = P.adj.body;
      Lab.clear(body);
      setTitle(P.adj, 'The adjugate ' + tx('\\operatorname{adj}(A)=C^{T}'));
      P.adj.sub('L2.3 at ' + at('L23', 11) + ': put the cofactors in a matrix ' + tx('C') + ', then transpose it. Some questions call it the adjoint.');
      const steps = [
        { html: 'The cofactor matrix, each row in its own colour:', block: eq('C=', mat(r.C, { cell: i => tone(i) })) },
        { html: 'Transpose: row ' + tx('i') + ' of ' + tx('C') + ' becomes column ' + tx('i') + ' of ' + tx('\\operatorname{adj}(A)') + ' (same colour):', block: eq('\\operatorname{adj}(A)=C^{T}=', mat(r.adj, { cell: (i, j) => tone(j) })) },
      ];
      if (n === 2) steps.push({ html: 'For a 2×2 matrix this is the rule of L2.3 at ' + at('L23', 9.5) + ': swap the two diagonal entries and change the sign of the other two.', math: '\\begin{aligned}&\\operatorname{adj}\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}=\\begin{bmatrix}d&-b\\\\-c&a\\end{bmatrix}\\\\&\\operatorname{adj}' + matTex(r.A) + '=' + matTex(r.adj) + '\\end{aligned}' });
      body.appendChild(K.steps(steps));
    }

    function drawInverse(r) {
      const n = r.n, body = P.inv.body;
      Lab.clear(body);
      setTitle(P.inv, 'The inverse ' + tx('A^{-1}=\\operatorname{adj}(A)/\\det(A)'));
      P.inv.sub('L2.3 at ' + at('L23', 18) + ': when ' + tx('\\det(A)\\ne 0') + ', the inverse exists and is ' + tx('\\operatorname{adj}(A)') + ' divided by ' + tx('\\det(A)') + '.');
      if (r.d.isZero()) {
        body.appendChild(K.note('<b>No inverse:</b> ' + tx('\\det(A)=0') + ', and dividing by 0 is impossible. The panel “When ' + tx('\\det(A)=0') + '” shows why no inverse can exist.', 'small'));
        return;
      }
      const lead = r.d.d === 1 ? '\\dfrac{1}{' + T(r.d) + '}' : T(div(F(1), r.d)) + '\\,';
      const hit = (M) => (i, j) => (M[i][j].eq(i === j ? 1 : 0) ? 'good' : 'warn');
      const steps = [
        { html: tx('\\det(A)=' + T(r.d) + '\\ne 0') + ', so divide every entry of ' + tx('\\operatorname{adj}(A)') + ' by ' + tx(T(r.d)) + ':',
          block: [eq('A^{-1}=' + lead, mat(r.adj), '=', mat(r.inv)), more('Show the ' + n * n + ' divisions', lines(r.adj.flatMap((row, i) => row.map((v, j) => '(' + (i + 1) + ',' + (j + 1) + '):\\ ' + T(v) + '\\div ' + par(r.d) + '=' + T(r.inv[i][j])))))] },
        { html: 'Check ' + tx('A\\cdot A^{-1}=I') + ' (L2.3 at ' + at('L23', 16) + '): entry ' + tx('(i,k)') + ' is row ' + tx('i') + ' of ' + tx('A') + ' times column ' + tx('k') + ' of ' + tx('A^{-1}') + '.',
          block: [eq(mat(r.A), '\\cdot', mat(r.inv), '=', mat(r.AI, { cell: hit(r.AI) }), isId(r.AI) ? '=I\\ \\checkmark' : '\\ne I'), dotList(r.A, r.inv, r.AI)] },
        { html: 'An inverse works on both sides, so ' + tx('A^{-1}\\cdot A=I') + ' too (L2.3 at ' + at('L23', 1.5) + '):',
          block: [eq(mat(r.inv), '\\cdot', mat(r.A), '=', mat(r.IA, { cell: hit(r.IA) }), isId(r.IA) ? '=I\\ \\checkmark' : '\\ne I'), more('Show the ' + n * n + ' row-times-column sums', dotList(r.inv, r.A, r.IA))] },
      ];
      body.appendChild(K.steps(steps));
    }

    function cramerCard(r, i) {
      const n = r.n, Ai = r.Ax[i], di = r.dx[i], name = '\\det(A_{x_' + (i + 1) + '})';
      const card = h('div', { class: 'mc-card wide' });
      card.appendChild(h('div', { class: 'mc-card-h', html: tx('A_{x_' + (i + 1) + '}') + ': column ' + (i + 1) + ' replaced by ' + tx('b') }));
      card.appendChild(mat(Ai, { cls: 'sm', cell: (p, q) => (q === i ? 'bcol' : '') }));
      const out = [];
      if (n === 2) {
        const [[a, b], [c, d]] = Ai;
        out.push(name + '=' + pr(a, d) + '-' + pr(b, c));
        out.push('=' + T(mul(a, d)) + '-' + par(mul(b, c)) + '=' + T(di));
      } else {
        const pairs = range(n).map(k => [r.b[k], r.C[k][i]]);
        out.push(name + '=' + range(n).map(k => 'b_' + (k + 1) + 'C_{' + ij(k, i) + '}').join('+'));
        out.push('=' + prods(pairs));
        out.push('=' + sum(pairs.map(([u, v]) => mul(u, v))) + '=' + T(di));
      }
      if (!r.d.isZero()) out.push('x_' + (i + 1) + '=\\dfrac{' + T(di) + '}{' + T(r.d) + '}=' + T(r.x[i]));
      else out.push(['x_' + (i + 1) + '=\\dfrac{' + T(di) + '}{0}', ' <span class="mc-no">not defined</span>']);
      card.appendChild(lines(out, 'mc-lines'));
      return card;
    }
    function drawCramer(r) {
      const n = r.n, body = P.cram.body;
      Lab.clear(body);
      setTitle(P.cram, 'Cramer’s rule: ' + tx('x_i=\\det(A_{x_i})/\\det(A)'));
      P.cram.sub('L2.2 at ' + at('L22', 6) + ': ' + tx('A_{x_i}') + ' is ' + tx('A') + ' with column ' + tx('i') + ' replaced by ' + tx('b') + ' (violet). The rule needs ' + tx('n') + ' equations in ' + tx('n') + ' unknowns and ' + tx('\\det(A)\\ne 0') + ', because it divides by ' + tx('\\det(A)') + '.');
      const wrap = h('div', { class: 'mc-cq' });
      const grid = h('div', { class: 'mc-cards' });
      grid.style.setProperty('--n', n);
      range(n).forEach(i => grid.appendChild(cramerCard(r, i)));
      wrap.appendChild(grid);
      const how = n === 2
        ? 'Each ' + tx('\\det(A_{x_i})') + ' is a 2×2 determinant, ' + tx('a_{11}a_{22}-a_{12}a_{21}') + ' (L2.2 at ' + at('L22', 8) + ').'
        : 'Each ' + tx('\\det(A_{x_i})') + ' is expanded along column ' + tx('i') + ', the ' + tx('b') + ' column: any column works (L2.1 at ' + at('L21', 4.5) + '). Deleting that column deletes ' + tx('b') + ', so its minors are the minors of ' + tx('A') + ', and the cofactors ' + tx('C_{1i},C_{2i},C_{3i}') + ' come from the cards above.';
      const steps = [
        { html: r.d.isZero()
          ? tx('\\det(A)=0') + ': the rule cannot be used, because every ' + tx('x_i') + ' would divide by 0. The determinants of ' + tx('A_{x_i}') + ' are still worked out: the panel “When ' + tx('\\det(A)=0') + '” uses them.'
          : tx('\\det(A)=' + T(r.d) + '\\ne 0') + ', so the rule applies.' },
        { html: how, block: wrap },
      ];
      if (!r.d.isZero()) steps.push({ html: 'So the solution is', block: [eq('x=', mat(col(r.x))), r.x.some(v => v.d !== 1) ? K.note('As decimals: ' + decimals(r.x) + '.', 'small muted') : null] });
      body.appendChild(K.steps(steps));
    }

    function drawBack(r) {
      const n = r.n, body = P.back.body;
      Lab.clear(body);
      setTitle(P.back, 'The same ' + tx('x') + ' from ' + tx('x=A^{-1}b'));
      P.back.sub('L2.3 at ' + at('L23', 23) + ': multiply ' + tx('Ax=b') + ' on the left by ' + tx('A^{-1}') + '. Since ' + tx('A^{-1}A=I') + ' and ' + tx('Ix=x') + ', this gives <span class="mc-nw">' + tx('x=A^{-1}b') + '.</span>');
      if (r.d.isZero()) {
        body.appendChild(K.note('<b>Not available:</b> ' + tx('A^{-1}') + ' does not exist when ' + tx('\\det(A)=0') + '.', 'small'));
        return;
      }
      const rows = range(n).map(k => {
        const pairs = r.inv[k].map((v, j) => [v, r.b[j]]);
        return ['x_' + (k + 1) + '=' + prods(pairs) + '=' + sum(pairs.map(([a, c]) => mul(a, c))) + '=' + T(r.xi[k]), r.xi[k].eq(r.x[k]) ? ok + ' <span class="small muted">same as Cramer</span>' : ' <span class="mc-no">differs</span>'];
      });
      const checks = range(n).map(k => {
        const pairs = r.A[k].map((v, j) => [v, r.x[j]]);
        return ['\\text{eq. ' + (k + 1) + ':}\\ ' + prods(pairs) + '=' + sum(pairs.map(([a, c]) => mul(a, c))) + '=' + T(r.Axb[k]), r.Axb[k].eq(r.b[k]) ? ' ' + tx('=b_' + (k + 1)) + ok : ' <span class="mc-no">≠ ' + tx('b_' + (k + 1)) + '</span>'];
      });
      const steps = [
        { html: 'Multiply ' + tx('A^{-1}') + ' (from the inverse panel) by the column ' + tx('b') + ':', block: eq('x=A^{-1}b=', mat(r.inv), mat(col(r.b), { cell: () => 'bcol' }), '=', mat(col(r.xi))) },
        { html: 'Row ' + tx('k') + ' of ' + tx('A^{-1}') + ' times ' + tx('b') + ' gives ' + tx('x_k') + ':', block: lines(rows) },
        { html: 'Why the two methods always agree: row ' + tx('i') + ' of ' + tx('\\operatorname{adj}(A)') + ' is column ' + tx('i') + ' of ' + tx('C') + ', so',
          math: '\\begin{aligned}x_i&=(A^{-1}b)_i\\\\&=\\tfrac{1}{\\det(A)}\\textstyle\\sum_k C_{ki}\\,b_k\\\\&=\\dfrac{\\det(A_{x_i})}{\\det(A)}\\end{aligned}',
          note: 'The sum ' + tx(range(n).map(k => 'C_{' + (k + 1) + 'i}b_' + (k + 1)).join('+')) + ' is ' + tx('\\det(A_{x_i})') + ' expanded along its ' + tx('b') + ' column: the same sum as in Cramer’s rule.' },
        { html: 'Check: put ' + tx('x') + ' back into the equations, ' + tx('A\\cdot x=b') + ':', block: lines(checks) },
      ];
      body.appendChild(K.steps(steps));
    }

    function drawSingular(r) {
      P.sing.hidden = !r.d.isZero();
      if (!r.d.isZero()) return;
      const n = r.n, s = r.sing, body = P.sing.body;
      Lab.clear(body);
      setTitle(P.sing, 'When ' + tx('\\det(A)=0') + ': no inverse and no Cramer');
      P.sing.sub(tx('A') + ' is singular. Both methods divide by ' + tx('\\det(A)') + ', so both fail. Here is why, and what ' + tx('Ax=b') + ' does instead.');
      const adjZero = isZeroM(r.adj);
      const kCol = range(n).find(j => r.adj.some(row => !row[j].isZero()));
      const cols = range(n).map(j => 'x_' + (j + 1) + 'a_' + (j + 1)).join('+');
      const nz = range(n).filter(i => !r.dx[i].isZero());
      const steps = [
        { html: '<b>No inverse.</b> If ' + tx('A^{-1}') + ' existed, then ' + tx('\\det(A)\\cdot\\det(A^{-1})=\\det(AA^{-1})=\\det(I)=1') + ' (L2.3 at ' + at('L23', 5.5) + '). With ' + tx('\\det(A)=0') + ' the left side is 0, not 1. So ' + tx('A^{-1}') + ' does not exist, and ' + tx('x=A^{-1}b') + ' cannot be used.' },
        { html: '<b>' + tx('\\operatorname{adj}(A)') + ' still exists</b>, but it cannot be divided by ' + tx('\\det(A)=0') + '. The rule behind the inverse (L2.3 at ' + at('L23', 18.5) + ') is ' + tx('A\\cdot\\operatorname{adj}(A)=\\det(A)\\,I') + ', and here that is the zero matrix:',
          block: [eq(mat(r.A), '\\cdot', mat(r.adj), '=', mat(r.Aadj), '=0\\cdot I'), more('Show the ' + n * n + ' row-times-column sums', dotList(r.A, r.adj, r.Aadj)),
            K.note(adjZero ? 'Here ' + tx('\\operatorname{adj}(A)') + ' is the zero matrix itself: every minor is 0.' : 'So every column of ' + tx('\\operatorname{adj}(A)') + ' solves ' + tx('Ax=0') + '. Column ' + (kCol + 1) + ', ' + tx(vecTex(r.adj.map(row => row[kCol]))) + ', is a solution other than ' + tx('x=0') + '.', '')] },
        { html: '<b>Cramer’s rule</b> would compute ' + tx('x_i=\\det(A_{x_i})/0') + ', which is not defined. It still tells us something. If ' + tx('x') + ' solves ' + tx('Ax=b') + ', then ' + tx('b=' + cols) + ', where ' + tx('a_j') + ' is column ' + tx('j') + ' of ' + tx('A') + '. In ' + tx('A_{x_i}') + ', subtract ' + tx('x_ja_j') + ' from the ' + tx('b') + ' column for every ' + tx('j\\ne i') + ': the determinant does not change (L2.1 at ' + at('L21', 20.5) + '), and the column left is ' + tx('x_ia_i') + ', so ' + tx('\\det(A_{x_i})=x_i\\det(A)') + ' (L2.1 at ' + at('L21', 21) + '). With ' + tx('\\det(A)=0') + ', a solution can exist only if every ' + tx('\\det(A_{x_i})') + ' is 0. Yours, from the Cramer panel:',
          block: [lines(range(n).map(i => ['\\det(A_{x_' + (i + 1) + '})=' + T(r.dx[i]), r.dx[i].isZero() ? '' : ' <span class="mc-no">≠ 0</span>'])),
            K.note(nz.length ? 'So ' + tx('\\det(A_{x_' + (nz[0] + 1) + '})=' + T(r.dx[nz[0]]) + '\\ne 0') + ' rules out every solution: <b>no solution</b>.' : 'All are 0, so Cramer’s rule cannot decide (' + aq('m2-46', 'AQ2.2') + ', question 1): there may be no solution or infinitely many.', '')] },
      ];
      const aug = M => mat(M, { cell: (i, j) => (j === n ? 'augl' : '') });
      const opsBox = h('div', { class: 'mc-ops' });
      s.ops.forEach(o => opsBox.appendChild(eq(o.op + ':', aug(o.M))));
      steps.push({ html: '<b>Row reduction decides</b> (L2.5 and L2.6): reduce ' + tx('[A\\mid b]') + ' to reduced row echelon form.',
        block: [eq('[A\\mid b]=', aug(r.A.map((row, i) => row.concat([r.b[i]]))), '\\longrightarrow', aug(s.R)), s.ops.length ? more('Show the ' + s.ops.length + ' row operation' + (s.ops.length > 1 ? 's' : ''), opsBox) : null] });
      if (s.kind === 'none') {
        const c = s.R[s.bad][n];
        steps.push({ html: 'Row ' + (s.bad + 1) + ' now reads ' + tx(range(n).map(j => '0x_' + (j + 1)).join('+') + '=' + T(c)) + ', which is impossible: <b>no solution</b>.' });
      } else {
        const freeTex = s.free.map((f, k) => tx('x_' + (f + 1) + '=' + PAR[k])).join(', ');
        const parts = [];
        if (!s.p.every(v => v.isZero())) parts.push(mat(col(s.p)));
        s.vs.forEach((v, k) => { parts.push((parts.length ? '+\\,' : '') + PAR[k]); parts.push(mat(col(v))); });
        const pZero = s.p.every(v => v.isZero());
        const checks = pZero ? [] : [['A\\,p=' + vecTex(s.Ap), s.Ap.every((v, k) => v.eq(r.b[k])) ? ' ' + tx('=b') + ok : '']];
        s.vs.forEach((v, k) => checks.push(['A\\,v_' + (k + 1) + '=' + vecTex(s.Av[k]), s.Av[k].every(x => x.isZero()) ? ' ' + tx('=0') + ok : '']));
        steps.push({ html: 'No row reads ' + tx('0=c') + ' with ' + tx('c\\ne 0') + ', and only ' + s.piv.length + ' of the ' + n + ' unknowns get a pivot, so ' + freeTex + (s.free.length > 1 ? ' are free' : ' is free') + ' (any number): <b>infinitely many solutions</b>.' + (r.b.every(v => v.isZero()) ? ' This is the homogeneous case of L2.3 at ' + at('L23', 28) + ': with ' + tx('\\det(A)=0') + ', ' + tx('Ax=0') + ' has infinitely many solutions.' : ''),
          block: [eq.apply(null, ['x='].concat(parts)), K.note('Check' + (pZero ? '' : ', with ' + tx('p') + ' the column without a letter') + ': ' + s.vs.map((_, k) => tx('v_' + (k + 1))).join(', ') + (s.vs.length > 1 ? ' are the columns' : ' is the column') + ' multiplied by ' + s.vs.map((_, k) => tx(PAR[k])).join(', ') + '.', 'small muted'), lines(checks)] });
      }
      body.appendChild(K.steps(steps));
    }

    /* ---------------------------------------------------------- mount */
    function reset() {
      Lab.store.set(KEY, {});
      st = DEF();
      buildSide();
      draw();
      showSource();
    }
    function showSource() {
      const k = PRESETS.findIndex(p => p.label === st.loaded);
      ctl.pre.select.value = k >= 0 ? String(k) : '';
      Lab.setHTML(ctl.pre.lastChild, k >= 0 ? 'From: ' + PRESETS[k].source : '');
    }
    function mount(el) {
      injectStyle();
      root = el;
      const { side, main } = K.layout(root, 'mc-lab');
      side.appendChild(K.group('Examples'));
      ctl.pre = K.presets({ label: 'From the lectures', items: PRESETS, onPick: loadPreset });
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 'mc-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', reset, 'btn ghost sm')));
      P.answer = K.answer();
      P.answer.classList.add('mc-ans');
      P.sys = K.panel('Your system');
      P.minor = K.panel('Minors and cofactors');
      P.det = K.panel('Determinant');
      P.sing = K.panel('When det(A) = 0');
      P.adj = K.panel('Adjugate');
      P.inv = K.panel('Inverse');
      P.cram = K.panel('Cramer’s rule');
      P.back = K.panel('x from the inverse');
      main.append(P.answer, P.sys, P.minor, P.det, P.sing, P.adj, P.inv, P.cram, P.back);
      root.__mc = { get st() { return st; }, get r() { return good; } };
      buildSide();
      draw();
      showSource();
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-m2-cramer', course: 'm2', week: 2, order: 3,
    title: "Cramer's rule and inverse lab", sub: 'Cofactors, adjugate, inverse, Cramer',
    topics: ['minors', 'cofactors', 'cofactor expansion', 'adjugate', 'inverse', 'A·A⁻¹ = I', 'Cramer’s rule', 'x = A⁻¹b', 'det(A) = 0'],
    desc: 'Type your own 2×2 or 3×3 matrix A and column b. See every minor and cofactor, adj(A), det(A), A⁻¹ with the check A·A⁻¹ = I, Cramer’s rule column by column and x = A⁻¹b, all in exact fractions. When det(A) = 0, see why both methods fail and what the system does instead.',
    render: el => cramerLab().mount(el),
  });
})();
