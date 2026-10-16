/* Maths II lab — Week 3 (L3.3–L3.5): linear dependence and independence.
   'lab-m2-dependence': k vectors in ℝⁿ (n ≤ 4, k ≤ 5) are typed into boxes. They become the columns of a matrix V, and
   V is row-reduced step by step with exact fractions (the algorithm of L2.5). The reduced matrix decides whether
   V x = 0 has only the zero solution (independent) or other solutions too (dependent). A non-zero combination that
   gives 0 is checked coordinate by coordinate, det V is computed when k = n, vectors in ℝ² are drawn as arrows, and
   the rules "more than n vectors in ℝⁿ are dependent" and "a subset of an independent set is independent" are
   applied to the typed set and to every one of its subsets. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const K = Lab.play;
  const tx = s => Lab.tex(s);
  /** Inline TeX that never breaks across lines (short formulas inside a sentence). */
  const nb = s => '<span class="mdep-pc">' + Lab.tex(s) + '</span>';
  const esc = Lab.esc;

  const KEY = 'lab:m2-dependence';
  const MAXN = 4, MAXK = 5;

  /* ================================================================ exact numbers and TeX */
  const ZERO = F(0), ONE = F(1);
  const isZ = f => f.n === 0;
  const isNeg = f => f.n < 0;
  const absF = f => (f.n < 0 ? f.neg() : f);
  /** TeX for a fraction: 3, -2, \tfrac{5}{3}, -\tfrac{1}{2}. */
  const fx = f => (f.d === 1 ? String(f.n) : (f.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.n) + '}{' + f.d + '}');
  /** The same in brackets when negative, for products such as 3\cdot(-2). */
  const fp = f => (isNeg(f) ? '(' + fx(f) + ')' : fx(f));
  const lcm = (a, b) => (a / Lab.math.gcd(a, b)) * b;
  /** The smallest positive whole number that clears every denominator in the list. */
  const lcd = list => list.reduce((L, f) => lcm(L, f.d), 1);
  /** (a, b, c) */
  const tup = fs => '(' + fs.map(fx).join(',\\ ') + ')';
  /** One term c·name of a sum: no '+' on the first term, 1 and −1 written as the sign only. */
  function term(c, name, first) {
    const a = absF(c);
    const body = (a.eq(1) ? '' : fx(a)) + name;
    return isNeg(c) ? '-' + body : (first ? '' : '+') + body;
  }
  /** c_1 name_1 + c_2 name_2 + …, zero coefficients left out; '0' when all are 0. */
  function lin(cs, names) {
    let s = '';
    cs.forEach((c, j) => { if (!isZ(c)) s += term(c, names[j], !s); });
    return s || '0';
  }
  /** The same sum cut into rows of at most `per` terms; later rows start with their own sign. */
  function linRows(cs, names, per) {
    const rows = [];
    let cur = '', count = 0;
    cs.forEach((c, j) => {
      if (isZ(c)) return;
      if (count === per) { rows.push(cur); cur = ''; count = 0; }
      cur += term(c, names[j], !rows.length && !cur);
      count++;
    });
    rows.push(cur || '0');
    return rows;
  }
  const ordinal = i => ['1st', '2nd', '3rd', '4th', '5th'][i];
  const plural = (k, one, many) => k + ' ' + (k === 1 ? one : many || one + 's');

  /* colours: fixed hex values in TeX, mapped to the theme colours by the CSS below */
  const COL = ['#2563eb', '#e0631a', '#0d9488', '#8b5cf6', '#db2777'];
  const HL = '#4655d4';
  const paint = (c, s) => '\\textcolor{' + c + '}{' + s + '}';
  const vn = j => 'v_' + (j + 1);
  const vc = j => paint(COL[j], vn(j));
  const xn = j => 'x_' + (j + 1);
  const Rn = i => 'R_' + (i + 1);
  /** Column vector [a; b; c], optionally in one colour. */
  const colVec = (v, c) => '\\begin{bmatrix}' + v.map(f => (c ? paint(c, fx(f)) : fx(f))).join('\\\\') + '\\end{bmatrix}';
  /**
   * A matrix in TeX. o.cols: colour each column like its vector; o.rows: Set of rows to highlight;
   * o.lead: Set of 'i,j' leading 1s (bold); o.aug: add the zero column of V x = 0.
   */
  function mat(M, o = {}) {
    const k = M[0].length;
    const body = M.map((r, i) => r.map((f, j) => {
      const s = fx(f);
      if (o.lead && o.lead.has(i + ',' + j)) return paint(HL, '\\mathbf{' + s + '}');
      if (o.rows && o.rows.has(i)) return paint(HL, s);
      if (o.cols) return paint(COL[j], s);
      return s;
    }).concat(o.aug ? ['0'] : []).join('&')).join('\\\\');
    return o.aug ? '\\left[\\begin{array}{' + 'c'.repeat(k) + '|c}' + body + '\\end{array}\\right]' : '\\begin{bmatrix}' + body + '\\end{bmatrix}';
  }

  /* ================================================================ row reduction (L2.5) */
  /** Type 3 on each listed row i whose entry in column c is not 0: R_i − m·R_r with m = that entry. */
  function clearCol(M, r, c, rows) {
    const ops = [];
    rows.forEach(i => {
      if (i === r || isZ(M[i][c])) return;
      const m = M[i][c], old = M[i].slice(), prow = M[r].slice();
      M[i] = M[i].map((x, j) => x.sub(m.mul(prow[j])));
      ops.push({ i, p: r, m, old, prow, neu: M[i].slice() });
    });
    return ops;
  }
  /**
   * Reduced row echelon form by the L2.5 algorithm: find the leftmost column with a non-zero entry at or below the
   * current row; swap that entry to the top if needed (type 1); multiply to make it 1 (type 2); clear below it
   * (type 3); repeat on the rows below. Then clear above each leading 1, starting from the rightmost (type 3).
   * Returns {R, piv: [{row, col}], steps, swaps, scales, big}; quick skips the step records.
   */
  function reduce(M0, quick) {
    const n = M0.length, k = M0[0].length;
    const M = M0.map(r => r.slice());
    const steps = [], piv = [], scales = [];
    let swaps = 0, big = false, r = 0;
    const snap = () => M.map(row => row.slice());
    const tooBig = () => M.some(row => row.some(f => f.approx || Math.abs(f.n) > 1e12 || f.d > 1e12));
    for (let c = 0; c < k && r < n; c++) {
      let p = -1;
      for (let i = r; i < n; i++) if (!isZ(M[i][c])) { p = i; break; }
      if (p < 0) { if (!quick) steps.push({ kind: 'skip', col: c, row: r }); continue; }
      if (p !== r) {
        const t = M[r]; M[r] = M[p]; M[p] = t; swaps++;
        if (!quick) steps.push({ kind: 'swap', col: c, row: r, a: r, b: p, after: snap(), rows: [r, p] });
      }
      const a = M[r][c];
      // ready: the entry was already a 1 in place, so this column needed no swap and no division
      const ready = p === r && a.eq(1);
      if (!a.eq(1)) {
        const f = ONE.div(a), old = M[r].slice();
        M[r] = M[r].map(x => x.mul(f));
        scales.push(a);
        if (!quick) steps.push({ kind: 'scale', col: c, row: r, a, f, old, neu: M[r].slice(), after: snap(), rows: [r] });
      }
      const ops = clearCol(M, r, c, Lab.range(r + 1, n - 1));
      if (ops.length && !quick) steps.push({ kind: 'down', col: c, row: r, ops, ready, after: snap(), rows: ops.map(o => o.i) });
      else if (ready && !quick) steps.push({ kind: 'ready', col: c, row: r, last: r === n - 1 });
      piv.push({ row: r, col: c });
      r++;
      if (tooBig()) { big = true; break; }
    }
    if (!big) {
      for (let q = piv.length - 1; q >= 0; q--) {
        const { row, col } = piv[q];
        const ops = clearCol(M, row, col, Lab.range(0, row - 1));
        if (ops.length && !quick) steps.push({ kind: 'up', col, row, ops, after: snap(), rows: ops.map(o => o.i) });
        if (tooBig()) { big = true; break; }
      }
    }
    return { R: M, piv, steps, swaps, scales, big };
  }

  /** det of a 3×3 matrix with the six products in the order of L3.5 (about 15:30 and 26:00). */
  function det3(M) {
    const [a, b, c] = M;
    const t = [[a[0], b[1], c[2]], [a[1], b[2], c[0]], [a[2], b[0], c[1]], [a[2], b[1], c[0]], [a[0], b[2], c[1]], [a[1], b[0], c[2]]];
    const p = t.map(([x, y, z]) => x.mul(y).mul(z));
    return { t, p, v: p[0].add(p[1]).add(p[2]).sub(p[3]).sub(p[4]).sub(p[5]) };
  }
  function detInfo(V, red) {
    const n = V.length;
    if (n === 1) return { v: V[0][0] };
    if (n === 2) return { v: V[0][0].mul(V[1][1]).sub(V[0][1].mul(V[1][0])) };
    if (n === 3) { const d = det3(V); return { v: d.v, d }; }
    // 4×4: undo the row operations; R = I has det 1, a swap flips the sign, multiplying a row by 1/a divides det by a
    const full = red.piv.length === 4;
    let v = ZERO;
    if (full) { v = red.scales.reduce((s, a) => s.mul(a), ONE); if (red.swaps % 2) v = v.neg(); }
    return { v, full };
  }

  /** Every non-empty subset of the vectors: rank, verdict, a whole-number combination when dependent. */
  function subsetsOf(cols) {
    const k = cols.length, n = cols[0].length, out = [];
    for (let mask = 1; mask < (1 << k); mask++) {
      const idx = Lab.range(0, k - 1).filter(j => mask & (1 << j));
      const red = reduce(Lab.range(0, n - 1).map(i => idx.map(j => cols[j][i])), true);
      const s = { mask, idx, rank: red.piv.length, dep: red.piv.length < idx.length };
      if (s.dep && !red.big) {
        const pc = red.piv.map(p => p.col);
        const f = Lab.range(0, idx.length - 1).find(j => !pc.includes(j));
        const u = idx.map(() => ZERO);
        u[f] = ONE;
        red.piv.forEach(p => { u[p.col] = red.R[p.row][f].neg(); });
        const L = F(lcd(u));
        s.x = u.map(v => v.mul(L));
      }
      out.push(s);
    }
    // smallest dependent subsets: dependent, while every smaller subset inside them is independent
    out.forEach(s => { s.minimal = s.dep && out.every(t => t === s || !t.dep || (t.mask & s.mask) !== t.mask); });
    return out;
  }

  /** Everything the panels show, from the matrix V (n×k) whose columns are the vectors. */
  function analyse(V) {
    const n = V.length, k = V[0].length;
    const red = reduce(V);
    if (red.big) return { big: true, n, k };
    const pc = red.piv.map(p => p.col);
    const free = Lab.range(0, k - 1).filter(j => !pc.includes(j));
    // one solution per independent variable: that variable 1, the other independent ones 0
    const basis = free.map(f => {
      const u = Array.from({ length: k }, () => ZERO);
      u[f] = ONE;
      red.piv.forEach(p => { u[p.col] = red.R[p.row][f].neg(); });
      return u;
    });
    const cols = Lab.range(0, k - 1).map(j => V.map(row => row[j]));
    const res = { n, k, V, red, pc, free, basis, cols, rank: pc.length, dep: free.length > 0 };
    res.zero = cols.map(v => v.every(isZ));
    res.lead = new Set(red.piv.map(p => p.row + ',' + p.col));
    if (n === k) res.det = detInfo(V, red);
    res.subsets = subsetsOf(cols);
    return res;
  }
  /** x = Σ c_q · basis_q, and V x coordinate by coordinate. */
  function combine(res, cs) {
    const x = Array.from({ length: res.k }, () => ZERO);
    res.basis.forEach((u, q) => u.forEach((v, j) => { x[j] = x[j].add(v.mul(cs[q])); }));
    const sums = res.V.map(row => row.reduce((s, a, j) => s.add(a.mul(x[j])), ZERO));
    return { x, sums, zero: x.every(isZ) };
  }
  /** The value that clears the fractions of the first solution (the lecture's c = 4 in L3.5), the others 0. */
  const defaultCs = res => res.basis.map((u, q) => (q ? ZERO : F(lcd(u))));

  /* ================================================================ lecture examples */
  const YT = { 'L3.3': '1Krnnc6wKyk', 'L3.4': 'Uf5nqIJv1Fk', 'L3.5': '9Adm4c2alAY' };
  /** "L3.5 at 11:30" with the time as the site's lecture link (Lab.vlink opens the video at that moment). */
  const at = (code, mm, ss = 0) => code + ' at ' + Lab.vlink(YT[code], mm + ss / 60);
  const AQ = { 'AQ3.3': 'm2-75', 'AQ3.4': 'm2-77', 'AQ3.5': 'm2-79' };
  const aq = (code, q) => '' + code + ', Question ' + q + '';
  /** '1,2; 2,1' → [['1','2'], ['2','1']] */
  const vv = s => s.split(';').map(t => t.split(',').map(x => x.trim()));
  /** Fractions to strings, for presets whose vectors are computed from a parameter. */
  const sv = fs => fs.map(f => f.toString());
  const PRESETS = [
    { id: 'l33a', g: 'Lecture L3.3', label: 'L3.3 · (1, 2), (2, 1), (4, 5) in ℝ²', v: vv('1,2; 2,1; 4,5'),
      src: at('L3.3', 4, 30) + ': ' + tx('2(1,2)+(2,1)=(4,5)') + ' by the parallelogram law; at 7:00 it is rewritten as ' + tx('2(1,2)+1(2,1)-1(4,5)=(0,0)') + ' — coefficients 2, 1, −1, not all 0, so the three vectors are dependent.' },
    { id: 'l33b', g: 'Lecture L3.3', label: 'L3.3 · (2, 1), (−2, 3), (2, 9) in ℝ²', v: vv('2,1; -2,3; 2,9'),
      src: at('L3.3', 8) + ': ' + tx('3(2,1)+2(-2,3)=(2,9)') + '; at 10:00 ' + tx('3(2,1)+2(-2,3)-(2,9)=(0,0)') + ' with coefficients 3, 2, −1 — dependent.' },
    { id: 'l33c', g: 'Lecture L3.3', label: 'L3.3 · (0, 2, 1), (2, 2, 0), (3, 7, 2) in ℝ³', v: vv('0,2,1; 2,2,0; 3,7,2'),
      src: at('L3.3', 11) + ': ' + tx('2(0,2,1)+\\tfrac32(2,2,0)=(3,7,2)') + ', so 0 is a combination with non-zero coefficients; the three vectors lie on the plane ' + tx('2x-2y+4z=0') + ' (14:00) — dependent.' },
    { id: 'l33d', g: 'Lecture L3.3', label: 'L3.3 · (0, 2, 1), (2, 2, 0), (1, 2, 0): off the plane', v: vv('0,2,1; 2,2,0; 1,2,0'),
      src: at('L3.3', 15) + ': ' + tx('(1,2,0)') + ' is not on that plane (' + tx('2\\cdot1-2\\cdot2+4\\cdot0\\ne0') + '), and ' + tx('a(0,2,1)+b(2,2,0)+c(1,2,0)=(0,0,0)') + ' forces ' + tx('a=b=c=0') + ' (17:30). L3.4 names such a set independent.' },
    { id: 'l33e', g: 'Lecture L3.3', label: 'L3.3 · (2, 3, 7) and (5/3, 5/2, 35/6)', v: vv('2,3,7; 5/3,5/2,35/6'),
      src: at('L3.3', 20, 30) + ': ' + tx('5(2,3,7)-6(\\tfrac53,\\tfrac52,\\tfrac{35}6)=(0,0,0)') + ', so the two are dependent: one is a multiple of the other, and they lie on one line.' },
    { id: 'l33f', g: 'Lecture L3.3', label: 'L3.3 · (2, 1, 2), (3, 0, 1), (10, −4, −2)', v: vv('2,1,2; 3,0,1; 10,-4,-2'),
      src: at('L3.3', 22) + ': ' + tx('2(2,1,2)-3(3,0,1)+\\tfrac12(10,-4,-2)=(0,0,0)') + ', checked coordinate by coordinate at 22:30 — dependent.' },
    { id: 'l33g', g: 'Lecture L3.3', label: 'L3.3 · the same three plus (2, 3, 7)', v: vv('2,1,2; 3,0,1; 10,-4,-2; 2,3,7'),
      src: at('L3.3', 23, 30) + ': appending ' + tx('(2,3,7)') + ' keeps the set dependent — the same equation works with coefficient 0 for the new vector. The rule at 24:30: every superset of a dependent set is dependent.' },
    { id: 'l34a', g: 'Lecture L3.4', label: 'L3.4 · (−1, 3) and (2, 0) in ℝ²', v: vv('-1,3; 2,0'),
      src: at('L3.4', 5) + ': ' + tx('a(-1,3)+b(2,0)=(0,0)') + ' gives ' + tx('-a+2b=0') + ' and ' + tx('3a=0') + ', so ' + tx('a=b=0') + ' — independent.' },
    { id: 'l34b', g: 'Lecture L3.4', label: 'L3.4 · (1, 1, 2), (1, 2, 0), (0, 2, 1) in ℝ³', v: vv('1,1,2; 1,2,0; 0,2,1'),
      src: at('L3.4', 17) + ': the system ' + tx('a+b=0,\\ a+2b+2c=0,\\ 2a+c=0') + ' has only ' + tx('a=b=c=0') + ' (18:30) — independent.' },
    { id: 'l35a', g: 'Lecture L3.5', label: 'L3.5 · (5, 2) and (1, 3): a 2 × 2 determinant', v: vv('5,2; 1,3'),
      src: at('L3.5', 6, 30) + ': ' + tx('5x_1+x_2=0,\\ 2x_1+3x_2=0') + '; the determinant is ' + tx('5\\cdot3-2\\cdot1=13\\ne0') + ' (7:30) — independent.' },
    { id: 'l35b', g: 'Lecture L3.5', label: 'L3.5 · (1, 2, 0) and (3, 3, 5) in ℝ³', v: vv('1,2,0; 3,3,5'),
      src: at('L3.5', 8) + ': a 3 × 2 matrix. The two are not multiples of each other, and ' + tx('5x_2=0') + ' with ' + tx('x_1+3x_2=0') + ' gives ' + tx('x_1=x_2=0') + ' (10:30) — independent.' },
    { id: 'l35c', g: 'Lecture L3.5', label: 'L3.5 · (1, 2), (1, 3), (3, 4) in ℝ²', v: vv('1,2; 1,3; 3,4'),
      src: at('L3.5', 11, 30) + ': Gaussian elimination on the augmented matrix gives ' + tx('x_1=-5c,\\ x_2=2c,\\ x_3=c') + ' (12:30) — dependent.' },
    { id: 'l35d', g: 'Lecture L3.5', label: 'L3.5 · (1, 2, 0), (0, 2, 4), (3, 0, 0): det = 24', v: vv('1,2,0; 0,2,4; 3,0,0'),
      src: at('L3.5', 13, 30) + ': ' + tx('\\det V=24\\ne0') + ' (15:30) — independent.' },
    { id: 'l35e', g: 'Lecture L3.5', label: 'L3.5 · the same three plus (1, 2, 3)', v: vv('1,2,0; 0,2,4; 3,0,0; 1,2,3'),
      src: at('L3.5', 19) + ': row reduction gives ' + tx('x_1=-\\tfrac c4,\\ x_2=-\\tfrac{3c}4,\\ x_3=-\\tfrac c4,\\ x_4=c') + ' (21:00), and ' + tx('c=4') + ' gives ' + tx('-(1,2,0)-3(0,2,4)-(3,0,0)+4(1,2,3)=0') + ' (22:00).' },
    { id: 'l35f', g: 'Lecture L3.5', label: 'L3.5 · (1, 4, 2), (0, 4, 3), (1, 1, 0): det = 1', v: vv('1,4,2; 0,4,3; 1,1,0'),
      src: at('L3.5', 25) + ': the j-th vector goes into the j-th column of ' + tx('V') + ', and ' + tx('\\det V=1') + ' (26:30) — independent.' },
                                                  ];
  const presetById = id => PRESETS.find(p => p.id === id);
  /** True on a site that lists only the lecture's examples; the kit then leaves course questions out of the menu. */
  const lectureOnly = () => !!(Lab.course && Lab.course.lectureOnly);
  /** Whether the menu lists this example: course questions ("AQ3.3 Q2 · …") are left out on a lecture-only site. */
  const shown = p => !(lectureOnly() && /^(AQ|TQ|PA|GA|PPA|GrPA)\s?\d/.test(p.label));
  const START = 'l35c';

  /* ================================================================ styles (scoped to .mdep) */
  const CSS = `
.mdep { --mdep-c5: #db2777; }
:root[data-theme="dark"] .mdep { --mdep-c5: #f472b6; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .mdep { --mdep-c5: #f472b6; } }
.mdep .mdep-c1 { color: var(--x); } .mdep .mdep-c2 { color: var(--y); } .mdep .mdep-c3 { color: var(--z); }
.mdep .mdep-c4 { color: var(--pick); } .mdep .mdep-c5 { color: var(--mdep-c5); }
.mdep .katex [style*="color:#2563eb"] { color: var(--x) !important; }
.mdep .katex [style*="color:#e0631a"] { color: var(--y) !important; }
.mdep .katex [style*="color:#0d9488"] { color: var(--z) !important; }
.mdep .katex [style*="color:#8b5cf6"] { color: var(--pick) !important; }
.mdep .katex [style*="color:#db2777"] { color: var(--mdep-c5) !important; }
.mdep .katex [style*="color:#4655d4"] { color: var(--accent) !important; }
.mdep .pl-controls .seg.mdep-seg { display: grid; width: 100%; }
.mdep .pl-controls .seg.mdep-seg button { min-height: 44px; font-size: 16px; padding: 6px 2px; }
.mdep .mdep-dyn { display: grid; gap: 12px; min-width: 0; }
.mdep .mdep-vrows { display: grid; gap: 8px; }
.mdep .mdep-vrow { display: grid; grid-template-columns: 38px repeat(var(--n, 2), minmax(0, 1fr)); gap: 6px; align-items: center; }
.mdep .mdep-vlab { font-size: 17px; text-align: center; }
.mdep input.mdep-in { height: 44px; width: 100%; min-width: 0; padding: 0 4px; font-size: 16px; text-align: center; }
.mdep .mdep-tools { display: flex; flex-wrap: wrap; gap: 8px; }
.mdep .mdep-tools .btn, .mdep .mdep-chip, .mdep .mdep-pick .btn { min-height: 44px; height: auto; white-space: normal; line-height: 1.25; }
.mdep .mdep-tools .btn { padding: 6px 14px; font-size: 14.5px; }
.mdep .pl-select { height: 44px; font-size: 16px; }
.mdep .pl-reset .btn { min-height: 44px; }
.mdep .mdep-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; }
.mdep .mdep-pc { white-space: nowrap; }
.mdep .mdep-checks { gap: 0 28px; align-items: flex-start; }
.mdep .mdep-checks .katex-display { margin: 6px 0; }
.mdep .mdep-arith { margin-top: 6px; font-size: 15px; color: var(--ink-2); line-height: 1.75; }
.mdep .mdep-arith + .mdep-arith { margin-top: 2px; }
.mdep .s-math, .mdep .pl-ans-big, .mdep .mdep-math { overflow-x: auto; overflow-y: hidden; max-width: 100%; }
.mdep .mdep-pic { display: flex; flex-wrap: wrap; gap: 14px 24px; align-items: flex-start; }
.mdep .mdep-plane { flex: 1 1 300px; max-width: 560px; min-width: 0; }
.mdep .mdep-pic-side { flex: 1 1 240px; min-width: 0; }
.mdep .mdep-plane svg { display: block; width: 100%; height: auto; background: var(--bg-sunk); border: 1px solid var(--line); border-radius: 14px; }
.mdep .mdep-plane .ghost { fill: none; stroke: var(--ink-4); stroke-width: 1.4; stroke-dasharray: 2 5; }
.mdep .mdep-plane .grid { stroke: var(--line-2); stroke-width: 1; }
.mdep .mdep-plane .axis { stroke: var(--ink-4); stroke-width: 1.5; }
.mdep .mdep-plane .tick { font: 500 11.5px var(--font-sans); fill: var(--ink-3); paint-order: stroke; stroke: var(--bg-sunk); stroke-width: 3px; stroke-linejoin: round; }
.mdep .mdep-plane .vl { font: italic 600 16px var(--font-serif); paint-order: stroke; stroke: var(--bg-sunk); stroke-width: 4px; stroke-linejoin: round; }
.mdep .mdep-plane .cl { font: 600 13px var(--font-sans); paint-order: stroke; stroke: var(--bg-sunk); stroke-width: 4px; stroke-linejoin: round; }
.mdep .mdep-plane .span-line { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 8 6; opacity: .75; }
.mdep .mdep-plane .para { fill: var(--accent-soft); stroke: var(--accent-line); stroke-width: 1.2; }
.mdep .mdep-plane .path line { stroke-dasharray: 7 5; }
.mdep .mdep-plane .s1 { stroke: var(--x); fill: var(--x); } .mdep .mdep-plane .s2 { stroke: var(--y); fill: var(--y); }
.mdep .mdep-plane .s3 { stroke: var(--z); fill: var(--z); } .mdep .mdep-plane .s4 { stroke: var(--pick); fill: var(--pick); }
.mdep .mdep-plane .s5 { stroke: var(--mdep-c5); fill: var(--mdep-c5); }
.mdep .mdep-plane text.s1, .mdep .mdep-plane text.s2, .mdep .mdep-plane text.s3, .mdep .mdep-plane text.s4, .mdep .mdep-plane text.s5 { stroke: var(--bg-sunk); }
.mdep .mdep-legend { display: flex; flex-wrap: wrap; gap: 4px 16px; font-size: 15.5px; }
.mdep .mdep-read { margin-top: 10px; font-size: 15.5px; line-height: 1.6; color: var(--ink-2); }
.mdep .mdep-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mdep .mdep-sz { font-size: 13px; font-weight: 650; letter-spacing: .04em; text-transform: uppercase; color: var(--ink-3); margin: 10px 0 6px; }
.mdep .mdep-chip { padding: 4px 13px; border-radius: 999px; border: 1.5px solid var(--line-2); background: var(--bg-elev); cursor: pointer; font-size: 15px; color: var(--ink); }
.mdep .mdep-chip.ind { border-color: var(--good-line); background: var(--good-soft); }
.mdep .mdep-chip.dep { border-color: var(--bad-line); background: var(--bad-soft); }
.mdep .mdep-chip.min { border-color: var(--bad); border-width: 2.5px; }
.mdep .mdep-chip.on { box-shadow: 0 0 0 3px var(--accent-line); }
.mdep .mdep-box { padding: 12px 14px; border-radius: 12px; background: var(--bg-sunk); border: 1px solid var(--line); font-size: 15.5px; line-height: 1.6; }
.mdep .mdep-cbox { display: flex; flex-wrap: wrap; gap: 10px 16px; align-items: flex-end; }
.mdep .mdep-cfield { display: grid; gap: 4px; }
.mdep .mdep-cfield .pl-label { font-size: 14px; }
.mdep .mdep-cfield input { width: 112px; height: 44px; font-size: 16px; text-align: center; }
.mdep .mdep-rule { padding: 12px 14px; border-radius: 12px; border: 1px solid var(--line); background: var(--bg-sunk); }
.mdep .mdep-rule + .mdep-rule { margin-top: 10px; }
.mdep .mdep-rule h4 { margin: 0 0 4px; font-size: 16px; }
.mdep .mdep-rule p { margin: 4px 0 0; font-size: 15.5px; line-height: 1.6; color: var(--ink-2); }
.mdep.mdep-stale .pl-main > .pl-panel { opacity: .55; }
@media (max-width: 560px) {
  .mdep .pl-ans-big .katex-display > .katex { font-size: 1.15em; }
  .mdep .mdep-chip { font-size: 14.5px; padding: 4px 11px; }
}
`;
  function injectStyle() {
    if (document.getElementById('mdep-style')) return;
    document.head.appendChild(h('style', { id: 'mdep-style', text: CSS }));
  }

  /* ================================================================ the lab */
  function blank() { return Lab.range(1, MAXK).map(() => Lab.range(1, MAXN).map(() => '0')); }
  function fromPreset(p, vals) {
    const out = vals || blank();
    p.v.forEach((v, i) => v.forEach((s, j) => { out[i][j] = s; }));
    return out;
  }
  const DEF = () => {
    const p = presetById(START);
    return { n: p.v[0].length, k: p.v.length, vals: fromPreset(p), loaded: START, param: null, arith: true, sub: 0 };
  };

  function dependenceLab() {
    const st = Object.assign(DEF(), Lab.store.get(KEY, {}));
    // keep stored data in shape: n, k in range and a full 5×4 grid of strings
    st.n = Math.min(MAXN, Math.max(1, +st.n || 2));
    st.k = Math.min(MAXK, Math.max(1, +st.k || 3));
    if (!Array.isArray(st.vals) || st.vals.length !== MAXK || st.vals.some(r => !Array.isArray(r) || r.length !== MAXN)) st.vals = DEF().vals;
    st.vals = st.vals.map(r => r.map(s => String(s == null ? '' : s)));
    if (st.loaded && !(presetById(st.loaded) && shown(presetById(st.loaded)))) st.loaded = null;
    if (st.param && !(presetById(st.param.id) && shown(presetById(st.param.id)) && presetById(st.param.id).param)) st.param = null;
    let root, ctl = {}, P = {}, good = null, cState = { sig: '', strs: [] };
    const save = () => Lab.store.set(KEY, st);

    /* ----------------------------------------------------------- reading the inputs */
    function readCell(s) {
      const t = String(s).trim().replace(/−/g, '-');
      if (!t) return { err: 'empty' };
      const f = K.parseNum(t);
      if (f == null) return { err: 'not a number' };
      if (f.approx) return { err: 'not exact' };
      if (Math.abs(f.n) > 1e6 || f.d > 1e4) return { err: 'too big' };
      return { f };
    }
    function readAll() {
      const bad = [];
      const V = Lab.range(0, st.n - 1).map(i => Lab.range(0, st.k - 1).map(j => {
        const r = readCell(st.vals[j][i]);
        if (r.err) { bad.push({ j, i, err: r.err }); return ZERO; }
        return r.f;
      }));
      let msg = '';
      if (bad.length) {
        const kinds = new Set(bad.map(b => b.err));
        msg = 'Fix the red box' + (bad.length > 1 ? 'es' : '') + ': ' +
          (kinds.has('empty') ? 'every box needs a number (type 0 for zero). ' : '') +
          (kinds.has('not a number') ? 'use numbers such as 2, −1.5 or 3/4. ' : '') +
          (kinds.has('not exact') ? 'exact numbers only (√2 and π cannot be row-reduced exactly here). ' : '') +
          (kinds.has('too big') ? 'keep numbers below a million and denominators below 10,000. ' : '');
      }
      return { ok: !bad.length, V, bad, msg: msg.trim() };
    }

    /* ----------------------------------------------------------- controls */
    function touched() {
      if (st.loaded) { st.loaded = null; if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); } }
      if (st.param) { st.param = null; buildParam(); }
    }
    function loadPreset(p) {
      st.vals = fromPreset(p, blank());
      st.n = p.v[0].length;
      st.k = p.v.length;
      st.loaded = p.id;
      st.sub = 0;
      st.param = p.param ? { id: p.id, value: p.param.value } : null;
      if (st.param) applyParam();
      buildSide();
      draw();
      Lab.setHTML(ctl.pre.lastChild, 'From: ' + p.src);
    }
    function applyParam() {
      const p = presetById(st.param.id);
      const val = F(String(st.param.value));
      fromPreset({ v: p.param.make(val) }, st.vals);
    }
    function buildParam() {
      if (!ctl.paramBox) return;
      Lab.clear(ctl.paramBox);
      ctl.paramBox.hidden = !st.param;
      if (!st.param) return;
      const p = presetById(st.param.id).param;
      ctl.paramBox.appendChild(K.numField({
        label: 'The value of ' + tx(p.name) + ' in this question', min: p.min, max: p.max, step: p.step, value: st.param.value,
        onChange: v => { st.param.value = v; applyParam(); fillInputs(); draw(); },
      }));
    }
    function presetMenu() {
      const pre = K.presets({ label: lectureOnly() ? 'Lecture examples' : 'Lecture examples', items: PRESETS, onPick: loadPreset });
      // group the menu by lecture: move each option into an optgroup (the option values stay the preset indices).
      // An example the kit leaves out has no option, and a group is created only when it gets one.
      const sel = pre.select, groups = {};
      PRESETS.forEach((p, k) => {
        const o = sel.querySelector('option[value="' + k + '"]');
        if (!o) return;
        if (!groups[p.g]) { groups[p.g] = h('optgroup', { label: p.g }); sel.appendChild(groups[p.g]); }
        groups[p.g].appendChild(o);
      });
      return pre;
    }
    function buildSide() {
      const box = ctl.dyn;
      Lab.clear(box);
      ctl.paramBox = h('div', { class: 'pl-field' });
      box.appendChild(ctl.paramBox);
      buildParam();
      box.appendChild(K.group('1 · Your vectors'));
      const segN = Lab.seg([1, 2, 3, 4].map(n => ({ label: tx('\\mathbb{R}^{' + n + '}'), value: n })), st.n, v => { if (v === st.n) return; st.n = v; touched(); buildSide(); draw(); });
      segN.classList.add('mdep-seg');
      segN.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      const segK = Lab.seg([1, 2, 3, 4, 5].map(k => ({ label: String(k), value: k })), st.k, v => { if (v === st.k) return; st.k = v; st.sub = 0; touched(); buildSide(); draw(); });
      segK.classList.add('mdep-seg');
      segK.style.gridTemplateColumns = 'repeat(5, minmax(0, 1fr))';
      const labN = h('label', { class: 'pl-label' }); Lab.setHTML(labN, 'Each vector has ' + tx('n') + ' entries: it lives in ' + tx('\\mathbb{R}^n'));
      const labK = h('label', { class: 'pl-label' }); Lab.setHTML(labK, 'How many vectors: ' + tx('k'));
      box.append(h('div', { class: 'pl-field' }, labN, segN), h('div', { class: 'pl-field' }, labK, segK));
      const labV = h('label', { class: 'pl-label' });
      Lab.setHTML(labV, 'Type the entries: whole numbers, decimals or fractions such as ' + tx('-3') + ', ' + tx('0.5') + ', ' + tx('5/3'));
      ctl.rows = h('div', { class: 'mdep-vrows' });
      ctl.rows.style.setProperty('--n', st.n);
      ctl.ins = [];
      for (let j = 0; j < st.k; j++) {
        const row = h('div', { class: 'mdep-vrow' }, h('span', { class: 'mdep-vlab mdep-c' + (j + 1), html: tx(vn(j)) }));
        const ins = [];
        for (let i = 0; i < st.n; i++) {
          const inp = h('input', { class: 'field mono mdep-in', type: 'text', value: st.vals[j][i], spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', enterkeyhint: 'next', 'aria-label': 'v' + (j + 1) + ', entry ' + (i + 1) });
          inp.addEventListener('input', () => { st.vals[j][i] = inp.value; touched(); drawSoon(); });
          inp.addEventListener('focus', () => inp.select());
          ins.push(inp);
          row.appendChild(inp);
        }
        ctl.ins.push(ins);
        ctl.rows.appendChild(row);
      }
      ctl.msg = h('div', { class: 'pl-hint' });
      const tools = h('div', { class: 'mdep-tools' });
      tools.appendChild(Lab.button(Lab.icon('dice') + '<span>Random whole numbers</span>', randomVectors, 'btn sm'));
      // one span, so the button's gap does not open around the formula
      if (st.k > 1) tools.appendChild(Lab.button('<span>Make ' + tx(vn(st.k - 1)) + ' a combination of the others</span>', makeCombination, 'btn sm'));
      box.append(h('div', { class: 'pl-field' }, labV, ctl.rows, ctl.msg), tools);
      box.appendChild(K.group('2 · What to show'));
      box.appendChild(K.toggle({ label: 'The arithmetic of every row operation', value: st.arith, onChange: v => { st.arith = v; save(); if (good) drawSteps(good); } }));
    }
    function fillInputs() {
      (ctl.ins || []).forEach((ins, j) => ins.forEach((inp, i) => { inp.value = st.vals[j][i]; }));
    }
    function randomVectors() {
      const rnd = () => String(Math.floor(Math.random() * 9) - 4);
      for (let j = 0; j < st.k; j++) {
        let row;
        do { row = Lab.range(1, st.n).map(rnd); } while (row.every(s => s === '0'));
        row.forEach((s, i) => { st.vals[j][i] = s; });
      }
      touched(); fillInputs(); draw();
    }
    function makeCombination() {
      const d = readAll();
      if (!d.ok) { Lab.setHTML(ctl.msg, '<span class="cbad">' + esc(d.msg) + '</span>'); return; }
      const last = st.k - 1;
      const pick = [-2, -1, 1, 2];
      const cs = Lab.range(0, last - 1).map(() => F(pick[Math.floor(Math.random() * 4)]));
      for (let i = 0; i < st.n; i++) st.vals[last][i] = cs.reduce((s, c, j) => s.add(c.mul(d.V[i][j])), ZERO).toString();
      touched(); fillInputs(); draw();
      Lab.setHTML(ctl.msg, 'Now ' + tx(vn(last) + '=' + lin(cs, Lab.range(0, last - 1).map(vn))) + ', so the set is dependent.');
    }

    /* ----------------------------------------------------------- draw */
    const drawSoon = Lab.debounce(() => draw(), 220);
    function draw() {
      save();
      const d = readAll();
      ctl.ins.forEach((ins, j) => ins.forEach((inp, i) => inp.classList.toggle('bad', d.bad.some(b => b.j === j && b.i === i))));
      let overflow = false;
      if (d.ok) {
        const res = analyse(d.V);
        if (res.big) overflow = true; else good = res;
      }
      const okNow = d.ok && !overflow;
      Lab.setHTML(ctl.msg, !d.ok ? '<span class="cbad">' + esc(d.msg) + '</span>' : overflow ? '<span class="cbad">These numbers grow too large for exact fractions. Use smaller entries.</span>' : '');
      root.classList.toggle('mdep-stale', !okNow && !!good);
      if (!good) {
        K.setAnswer(P.answer, { ev: '<span class="cbad">' + esc(d.msg || 'These numbers grow too large for exact fractions.') + '</span>' });
        [P.pic, P.setup, P.steps, P.read, P.combo, P.det, P.rules].forEach(p => { Lab.clear(p.body); p.body.appendChild(K.note('Fix the vectors on the left; this panel fills in as soon as every box holds a number.', 'small muted')); });
        P.pic.hidden = true;
        return;
      }
      const g = good;
      syncCs(g);
      drawAnswer(g, okNow ? '' : (d.ok ? 'These numbers grow too large for exact fractions.' : d.msg));
      drawPicture(g);
      drawSetup(g);
      drawSteps(g);
      drawRead(g);
      drawCombo(g);
      drawDet(g);
      drawRules(g);
    }
    const setTitle = (panel, html) => Lab.setHTML(panel.querySelector('.pl-panel-head h3'), html);
    const names = g => Lab.range(0, g.k - 1).map(vc);
    const setTex = idx => '\\{' + idx.map(vn).join(',') + '\\}';
    const Rn2 = n => tx('\\mathbb{R}^{' + n + '}');

    /* the c values typed in the combination panel (one per independent variable), reset whenever V or the independent
       variables change */
    function syncCs(g) {
      const sig = g.V.map(r => r.map(String).join(',')).join(';') + '|' + g.free.join(',');
      if (sig === cState.sig) return;
      cState = { sig, strs: defaultCs(g).map(String), rebuild: true };
    }
    function currentCs(g) {
      const cs = cState.strs.map(s => readCell(s).f || null);
      return cs.every(Boolean) ? cs : null;
    }
    function currentCombo(g) {
      const cs = currentCs(g) || defaultCs(g);
      return Object.assign(combine(g, cs), { cs });
    }
    const cName = (g, q) => (g.free.length === 1 ? 'c' : 'c_' + (q + 1));

    function drawAnswer(g, problem) {
      const { n, k } = g;
      const p = st.loaded && presetById(st.loaded);
      const list = g.cols.map((v, j) => '<span class="mdep-pc">' + tx(vc(j) + '=' + tup(v)) + '</span>').join(', ');
      const ev = (p ? 'Example: <b>' + esc(p.label) + '</b>. ' : '') +
        'Your ' + tx('k=' + k) + ' vector' + (k > 1 ? 's' : '') + ' in ' + Rn2(n) + ' (' + tx('n=' + n) + ' entries each): ' + list + '.' +
        (problem ? ' <span class="cbad">' + esc(problem) + ' Below: your last complete set.</span>' : '');
      const sizeTex = n + '\\times ' + k;
      let big, sub;
      if (g.dep) {
        const cb = currentCombo(g);
        // three terms per line, so a long combination stays inside a phone screen; the braces keep a leading
        // minus unary (right after an alignment point TeX would space it as a binary minus)
        big = '\\begin{aligned}&\\text{linearly dependent}\\\\&' + (cb.zero ? '\\text{(pick some } c\\ne0)' : linRows(cb.x, names(g), 3).map(r => '{' + r + '}').join('\\\\&\\quad ') + '=0') + '\\end{aligned}';
        sub = 'Row reduction of the ' + tx(sizeTex) + ' matrix ' + tx('V') + ' gives ' + plural(g.rank, 'leading 1') + ' for ' + plural(k, 'column') + ', so ' +
          g.free.map(j => tx(xn(j))).join(', ') + (g.free.length === 1 ? ' is an independent variable' : ' are independent variables') + ': ' + tx('Vx=0') + ' has solutions other than ' + tx('x=0') + '.';
      } else {
        big = '\\begin{aligned}&\\text{linearly independent}\\\\&' + (k === 1 ? 'x_1v_1=0\\Rightarrow x_1=0' : k === 2 ? 'x_1v_1+x_2v_2=0\\Rightarrow x_1=x_2=0' : 'x_1v_1+\\dots+x_{' + k + '}v_{' + k + '}=0\\Rightarrow x=0') + '\\end{aligned}';
        sub = 'Row reduction of the ' + tx(sizeTex) + ' matrix ' + tx('V') + ' puts a leading 1 in every one of its ' + plural(k, 'column') + ', so ' + tx('Vx=0') + ' has only the solution ' + tx('x=0') + '.';
      }
      if (k > n) sub += ' Also, ' + plural(k, 'vector') + ' in ' + Rn2(n) + ' are always dependent: ' + nb(k + '>' + n) + '.';
      if (g.det) sub += ' The determinant test agrees: ' + nb('\\det V=' + fx(g.det.v) + (isZ(g.det.v) ? '' : '\\ne0')) + '.';
      const z = g.zero.map((b, j) => (b ? j : -1)).filter(j => j >= 0);
      if (z.length) sub += ' The set contains the zero vector ' + z.map(j => tx(vn(j))).join(', ') + ', which alone makes it dependent.';
      K.setAnswer(P.answer, { ev, big, sub });
    }

    /* ------------------------------------------------ picture (ℝ² only) */
    /** An SVG label such as 5v₁: coefficient text, then v with a lowered index. */
    const vLabel = (attrs, coef, j) => svg('text', attrs, coef + 'v', svg('tspan', { dy: '0.3em', 'font-size': '72%' }, String(j + 1)));
    function drawPicture(g) {
      P.pic.hidden = g.n !== 2;
      if (g.n !== 2) return;
      const body = P.pic.body;
      Lab.clear(body);
      const pts = g.cols.map(v => [Number(v[0]), Number(v[1])]);
      const nonzero = pts.map((p, j) => (g.zero[j] ? -1 : j)).filter(j => j >= 0);
      // dependent: the last vector with a non-zero coefficient is reached from 0 by the others, head to tail
      const cb = g.dep ? currentCombo(g) : null;
      const path = [];
      let jb = -1;
      if (cb && !cb.zero) {
        jb = Lab.range(0, g.k - 1).filter(j => !isZ(cb.x[j])).pop();
        let a = [0, 0];
        Lab.range(0, g.k - 1).forEach(j => {
          if (j === jb || isZ(cb.x[j]) || g.zero[j]) return;
          const t = cb.x[j].div(cb.x[jb]).neg();
          const b = [a[0] + Number(t) * pts[j][0], a[1] + Number(t) * pts[j][1]];
          path.push({ j, t, a, b });
          a = b;
        });
      }
      const para = g.k === 2 && !g.dep ? [[0, 0], pts[0], [pts[0][0] + pts[1][0], pts[0][1] + pts[1][1]], pts[1]] : null;
      // with two moves, the other two sides of their parallelogram (dotted)
      const ghost = path.length === 2 ? [[0, 0], [path[1].b[0] - path[1].a[0], path[1].b[1] - path[1].a[1]], path[1].b] : null;
      const all = [[0, 0]].concat(pts, path.map(sg => sg.b), para || [], ghost || []);
      let x0 = Math.min(...all.map(p => p[0])), x1 = Math.max(...all.map(p => p[0]));
      let y0 = Math.min(...all.map(p => p[1])), y1 = Math.max(...all.map(p => p[1]));
      const span = Math.max(x1 - x0, y1 - y0, 1);
      const pad = span * 0.1 + 0.4;
      x0 -= pad; x1 += pad; y0 -= pad; y1 += pad;
      const wrap = h('div', { class: 'mdep-pic' });
      const plane = h('div', { class: 'mdep-plane' });
      const side = h('div', { class: 'mdep-pic-side' });
      wrap.append(plane, side);
      body.appendChild(wrap);
      // equal units on both axes, so angles and "on one line" look right; sized from the space it gets
      const W = Math.round(Math.max(260, Math.min(plane.clientWidth || 320, 560)));
      const m = 6, maxH = Math.round(W * 0.92), minH = Math.round(W * 0.62);
      let s = (W - 2 * m) / (x1 - x0);
      let H = (y1 - y0) * s + 2 * m;
      if (H > maxH) {
        H = maxH; s = (H - 2 * m) / (y1 - y0);
        const cx = (x0 + x1) / 2, half = (W - 2 * m) / s / 2; x0 = cx - half; x1 = cx + half;
      } else if (H < minH) {
        H = minH;
        const cy = (y0 + y1) / 2, half = (H - 2 * m) / s / 2; y0 = cy - half; y1 = cy + half;
      }
      const X = v => m + (v - x0) * s, Y = v => H - m - (v - y0) * s;
      const el = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', 'aria-label': 'The vectors drawn as arrows from the origin' });
      // grid: a round step that gives about 8 lines across
      const raw = (x1 - x0) / 8, mag = Math.pow(10, Math.floor(Math.log10(raw))), nr = raw / mag;
      const step = (nr < 1.5 ? 1 : nr < 3.5 ? 2 : nr < 7.5 ? 5 : 10) * mag;
      const every = step * s < 30 ? 2 : 1;
      const fmtT = v => String(+v.toPrecision(10)).replace('-', '−');
      // tick labels are drawn after the shapes, so the shaded parallelogram never hides them
      const ticks = [];
      for (let q = Math.ceil(x0 / step); q * step <= x1; q++) {
        el.appendChild(svg('line', { x1: X(q * step), x2: X(q * step), y1: 0, y2: H, class: 'grid' }));
        if (q && q % every === 0) ticks.push(svg('text', { x: X(q * step), y: Math.min(H - 6, Math.max(14, Y(0) + 15)), 'text-anchor': 'middle', class: 'tick' }, fmtT(q * step)));
      }
      for (let q = Math.ceil(y0 / step); q * step <= y1; q++) {
        el.appendChild(svg('line', { x1: 0, x2: W, y1: Y(q * step), y2: Y(q * step), class: 'grid' }));
        if (q && q % every === 0) ticks.push(svg('text', { x: Math.min(W - 6, Math.max(6, X(0) - 6)), y: Y(q * step) + 4, 'text-anchor': X(0) - 6 < 20 ? 'start' : 'end', class: 'tick' }, fmtT(q * step)));
      }
      el.appendChild(svg('line', { x1: 0, x2: W, y1: Y(0), y2: Y(0), class: 'axis' }));
      el.appendChild(svg('line', { x1: X(0), x2: X(0), y1: 0, y2: H, class: 'axis' }));
      // the one line through 0 that holds every vector (rank 1)
      if (g.rank === 1) {
        const d = pts[nonzero[0]], L = 50 * span / Math.hypot(d[0], d[1]);
        el.appendChild(svg('line', { x1: X(-L * d[0]), y1: Y(-L * d[1]), x2: X(L * d[0]), y2: Y(L * d[1]), class: 'span-line' }));
      }
      if (para) el.appendChild(svg('polygon', { points: para.map(p => X(p[0]) + ',' + Y(p[1])).join(' '), class: 'para' }));
      if (ghost) el.appendChild(svg('polyline', { points: ghost.map(p => X(p[0]) + ',' + Y(p[1])).join(' '), class: 'ghost' }));
      ticks.forEach(t => el.appendChild(t));
      const arrow = (a, b, cls, w) => {
        const ax = X(a[0]), ay = Y(a[1]), bx = X(b[0]), by = Y(b[1]);
        const L = Math.hypot(bx - ax, by - ay);
        const grp = svg('g', { class: cls });
        if (L < 1) return grp;
        const ux = (bx - ax) / L, uy = (by - ay) / L, hl = Math.min(13, L * 0.45), hw = hl * 0.5;
        const ex = bx - ux * hl, ey = by - uy * hl;
        grp.appendChild(svg('line', { x1: ax, y1: ay, x2: ex, y2: ey, 'stroke-width': w, 'stroke-linecap': 'round' }));
        grp.appendChild(svg('path', { d: 'M' + bx + ',' + by + 'L' + (ex - uy * hw) + ',' + (ey + ux * hw) + 'L' + (ex + uy * hw) + ',' + (ey - ux * hw) + 'Z', 'stroke-width': 1 }));
        return grp;
      };
      path.forEach(sg => {
        el.appendChild(arrow(sg.a, sg.b, 'path s' + (sg.j + 1), 2.4));
        // the first move starts at 0 along its own solid arrow, so its label sits between that arrow's tip and the
        // end of the move; later moves are labelled at their middle
        const at0 = sg.a[0] === 0 && sg.a[1] === 0, tt = Math.abs(Number(sg.t));
        const f = at0 && tt > 1 ? (1 + tt) / (2 * tt) : 0.5;
        const mx = X(sg.a[0]) + f * (X(sg.b[0]) - X(sg.a[0])), my = Y(sg.a[1]) + f * (Y(sg.b[1]) - Y(sg.a[1]));
        const dx = X(sg.b[0]) - X(sg.a[0]), dy = Y(sg.b[1]) - Y(sg.a[1]), L = Math.hypot(dx, dy) || 1;
        const coef = (isNeg(sg.t) ? '−' : '') + (absF(sg.t).eq(1) ? '' : absF(sg.t).toString());
        el.appendChild(vLabel({ x: mx + (dy / L) * 15, y: my - (dx / L) * 15 + 4, 'text-anchor': 'middle', class: 'cl s' + (sg.j + 1) }, coef, sg.j));
      });
      const ang = pts.map(p => Math.atan2(p[1], p[0]));
      pts.forEach((p, j) => {
        if (g.zero[j]) {
          // zero vectors: a dot at the origin; their labels go in the top-left corner, clear of the axis numbers
          const above = g.zero.slice(0, j).filter(Boolean).length;
          el.appendChild(svg('circle', { cx: X(0), cy: Y(0), r: 6, class: 's' + (j + 1) }));
          el.appendChild(svg('text', { x: 12, y: 24 + 22 * above, class: 'vl s' + (j + 1) }, 'v', svg('tspan', { dy: '0.3em', 'font-size': '72%' }, String(j + 1)), svg('tspan', { dy: '-0.3em' }, ' = 0 (the dot at the origin)')));
          return;
        }
        el.appendChild(arrow([0, 0], p, 's' + (j + 1), 3.2));
        // label beyond the tip; when another arrow points almost the same way, push it to the far side
        const a = ang[j];
        let near = Infinity, side = 1;
        nonzero.forEach(o => {
          if (o === j) return;
          const d = Math.atan2(Math.sin(ang[o] - a), Math.cos(ang[o] - a));
          if (Math.abs(d) < near) { near = Math.abs(d); side = d > 0 ? -1 : 1; }
        });
        const push = near < 0.6 ? 11 * side : 0;
        // along the arrow on screen: (cos a, −sin a); its counterclockwise normal: (−sin a, −cos a)
        el.appendChild(vLabel({ x: X(p[0]) + Math.cos(a) * 16 - Math.sin(a) * push, y: Y(p[1]) - Math.sin(a) * 16 - Math.cos(a) * push + 5, 'text-anchor': 'middle', class: 'vl s' + (j + 1) }, '', j));
      });
      plane.appendChild(el);
      side.appendChild(h('div', { class: 'mdep-legend', html: g.cols.map((v, j) => nb(vc(j) + '=' + tup(v))).join('') }));
      side.appendChild(h('div', { class: 'mdep-read', html: pictureText(g, path, jb, cb) }));
    }
    function pictureText(g, path, jb, cb) {
      const { k } = g;
      const zs = g.zero.map((b, j) => (b ? j : -1)).filter(j => j >= 0);
      if (g.rank === 0) return 'Every vector is the zero vector, a single dot at ' + nb('(0,0)') + ': ' + nb('1\\cdot ' + vn(0) + '=0') + ' already has a non-zero coefficient, so the set is <b>dependent</b> (L3.4, about 7:00).';
      const nz = g.zero.map((b, j) => (b ? -1 : j)).filter(j => j >= 0);
      const lineEq = () => {
        const d = g.cols[nz[0]];
        if (isZ(d[0])) return nb('x=0') + ' (the vertical axis)';
        const slope = d[1].div(d[0]);
        return nb('y=' + (isZ(slope) ? '0' : (slope.eq(1) ? '' : slope.eq(-1) ? '-' : fx(slope)) + 'x'));
      };
      let t = '';
      if (k === 1) return nb(vn(0)) + ' is one arrow, not the zero vector: ' + nb('x_1v_1=0') + ' forces ' + nb('x_1=0') + ', so ' + nb('\\{v_1\\}') + ' is <b>independent</b>.';
      if (g.rank === 1) {
        t = 'Every arrow lies on <b>one line</b> through ' + nb('(0,0)') + ', the dashed line ' + lineEq() + ': each vector is a multiple of ' + nb(vn(nz[0])) + ', so the set is <b>dependent</b>. ';
        if (k === 2 && g.det) t += 'The parallelogram on ' + nb('v_1') + ' and ' + nb('v_2') + ' is flat: its area is ' + nb('|\\det V|=0') + '. ';
      } else if (k === 2) {
        const a = g.cols[0], b = g.cols[1];
        t = 'The two arrows are <b>not on one line</b>: neither is a multiple of the other, so they are <b>independent</b> (L3.4, about 12:00). They span the shaded parallelogram, of area ' +
          nb('|\\det V|=|' + fp(a[0]) + '\\cdot ' + fp(b[1]) + '-' + fp(b[0]) + '\\cdot ' + fp(a[1]) + '|=' + fx(absF(g.det.v))) + ', not 0. ';
      } else {
        t = 'The arrows are not all on one line, but ' + plural(k, 'arrow') + ' in the plane are always <b>dependent</b>: ' + nb(k + '>2') + ' (L3.5, about 16:30). ';
      }
      if (zs.length) t += zs.map(j => nb(vn(j) + '=0')).join(', ') + ' is the dot at ' + nb('(0,0)') + '. ';
      if (path.length) {
        t += 'Dashed: ' + nb(vc(jb) + '=' + lin(path.map(sg => sg.t), path.map(sg => vc(sg.j)))) + '. Go ' + path.map(sg => nb(term(sg.t, vn(sg.j), true))).join(', then ') +
          ', head to tail from ' + nb('(0,0)') + ', and you land on the tip of ' + nb(vn(jb)) + (path.length === 2 ? ' (the parallelogram law, as in L3.3 at 4:30)' : '') + '. Moving ' + nb(vn(jb)) + ' to the other side gives ' + nb(lin(cb.x, names(g)) + '=0') + '.';
      }
      return t;
    }

    /* ------------------------------------------------ the columns of V and the system Vx = 0 */
    function drawSetup(g) {
      const { n, k, V } = g;
      const body = P.setup.body;
      Lab.clear(body);
      P.setup.sub('L3.5 (about 1:30–6:00): to test ' + tx('v_1,\\dots,v_k') + ', take unknown coefficients ' + tx('x_1,\\dots,x_k') + ', set the combination equal to 0 and solve. The ' + tx('j') + '-th vector goes into the ' + tx('j') + '-th column of a matrix ' + tx('V') + '.');
      const flow = pieces => '<div class="mdep-flow">' + pieces.map(p => nb('\\displaystyle ' + p)).join('') + '</div>';
      // the sign ends each piece, so a narrow screen wraps after "+" or "="
      const terms = g.cols.map((v, j) => xn(j) + colVec(v, COL[j]) + (j < k - 1 ? '+' : '='));
      const eqs = V.map(row => lin(row, Lab.range(0, k - 1).map(xn)) + '&=0');
      const xs = Lab.range(0, k - 1).map(xn);
      body.appendChild(K.steps([
        { html: 'The combination with unknown coefficients, set equal to the zero vector of ' + Rn2(n) + ':' + flow(terms.concat([colVec(Array(n).fill(ZERO))])) },
        { html: 'Equate each coordinate: one equation per coordinate (' + tx('n=' + n) + ' equations) and one unknown per vector (' + tx('k=' + k) + ' unknowns). It is a <b>homogeneous</b> system: every right-hand side is 0.', math: '\\begin{aligned}' + eqs.join('\\\\') + '\\end{aligned}' },
        { html: 'The same system as one matrix equation ' + tx('Vx=0') + ', with the unknowns ' + tx('x=(' + xs.join(',') + ')') + ' written as a column. Column ' + tx('j') + ' of ' + tx('V') + ' is ' + tx('v_j') + ' (same colours), so ' + tx('V') + ' is ' + tx(n + '\\times ' + k) + ': ' + plural(n, 'row') + ' for the coordinates, ' + plural(k, 'column') + ' for the vectors.',
          math: 'V=' + mat(V, { cols: true }) },
        { html: 'Its augmented matrix ' + tx('[V\\mid 0]') + ' has a last column of zeros. A row operation keeps it 0 (' + nb('0-m\\cdot 0=0') + '), so the next panel reduces ' + tx('V') + ' alone.', math: '[V\\mid 0]=' + mat(V, { aug: true }) },
        { html: 'The question (L3.4, L3.5): is ' + tx('x=0') + ' the <b>only</b> solution? It always is one, because every right-hand side is 0. Only ' + tx('x=0') + ' → independent. Some ' + tx('x\\ne0') + ' → dependent.' },
      ]));
    }

    /* ------------------------------------------------ row reduction, step by step */
    const opTex = o => Rn(o.i) + (isNeg(o.m) ? '+' : '-') + (absF(o.m).eq(1) ? '' : fx(absF(o.m))) + Rn(o.p);
    const scaleTex = s => (s.f.eq(-1) ? '-' : fx(s.f)) + Rn(s.row);
    function arithOp(o) {
      const mm = absF(o.m), sign = isNeg(o.m) ? '+' : '-';
      const parts = o.old.map((a, j) => fx(a) + sign + (mm.eq(1) ? '' : fx(mm) + '\\cdot ') + fp(o.prow[j]) + '=' + fx(o.neu[j]));
      return '<div class="mdep-arith">New ' + nb(Rn(o.i) + '=' + opTex(o)) + ': ' + parts.map(nb).join(', ') + '</div>';
    }
    function arithScale(s) {
      const parts = s.old.map((a, j) => fp(s.f) + '\\cdot ' + fp(a) + '=' + fx(s.neu[j]));
      return '<div class="mdep-arith">New ' + nb(Rn(s.row) + '=' + scaleTex(s)) + ': ' + parts.map(nb).join(', ') + '</div>';
    }
    function stepItem(s) {
      const c = 'column ' + (s.col + 1);
      const rows = new Set(s.rows || []);
      if (s.kind === 'skip') return { html: '<b>Column ' + (s.col + 1) + ':</b> every entry from row ' + (s.row + 1) + ' down is 0, so this column gets no leading 1. Move one column right.' };
      if (s.kind === 'ready') return { html: '<b>Column ' + (s.col + 1) + ':</b> the entry in row ' + (s.row + 1) + ' is already 1, so it is the leading 1 of row ' + (s.row + 1) + ' (no swap, no division)' + (s.last ? '.' : ', and every entry below it is already 0.') };
      if (s.kind === 'swap') return { html: '<b>Type 1 — swap rows.</b> The leftmost column with a non-zero entry from row ' + (s.row + 1) + ' down is ' + c + ', but its entry in row ' + (s.a + 1) + ' is 0. Row ' + (s.b + 1) + ' has ' + nb(fx(s.after[s.a][s.col])) + ' there, so ' + nb(Rn(s.a) + '\\leftrightarrow ' + Rn(s.b)) + ':', math: mat(s.after, { rows }) };
      if (s.kind === 'scale') return { html: '<b>Type 2 — make the leading entry 1.</b> In ' + c + ', row ' + (s.row + 1) + ' starts with ' + nb(fx(s.a)) + ', so multiply row ' + (s.row + 1) + ' by ' + nb('\\frac{1}{' + fx(s.a) + '}=' + fx(s.f)) + ': ' + nb(scaleTex(s)) + '.' + (st.arith ? arithScale(s) : ''), math: mat(s.after, { rows }) };
      const down = s.kind === 'down';
      return {
        html: '<b>Type 3 — clear ' + (down ? 'below' : 'above') + ' the leading 1</b> of row ' + (s.row + 1) + ' (' + c +
          (down ? (s.ready ? '; that entry is already 1, so no swap or division was needed' : '') : '; this back phase goes from the rightmost leading 1 to the left') +
          '). From each row ' + (down ? 'below' : 'above') + ' with a non-zero entry in ' + c + ', subtract that entry times row ' + (s.row + 1) + ': ' +
          s.ops.map(o => nb(opTex(o))).join(', ') + '.' + (st.arith ? s.ops.map(arithOp).join('') : ''),
        math: mat(s.after, { rows }),
      };
    }
    function drawSteps(g) {
      const body = P.steps.body;
      Lab.clear(body);
      P.steps.sub('The algorithm of L2.5: take the leftmost column with a non-zero entry, bring a non-zero entry to the top (type 1), divide to make it 1 (type 2), clear the entries below it (type 3); repeat on the rows below. Then clear above each leading 1, rightmost first. ' + nb('R_2-3R_1') + ' means: row 2 becomes row 2 minus 3 times row 1 (the row named first is the one that changes). Changed rows are coloured.');
      const red = g.red;
      const list = [{ html: 'Start: ' + tx('V') + ' is ' + tx(g.n + '\\times ' + g.k) + '.', math: 'V=' + mat(g.V) }];
      if (!red.steps.length) list.push({ html: g.rank === 0 ? 'Every entry is 0: there is no non-zero column, so no leading 1 at all. ' + tx('V') + ' is already reduced.' : tx('V') + ' is already in reduced row echelon form: nothing to do.' });
      red.steps.forEach(s => list.push(stepItem(s)));
      list.push({ html: '<b>Done.</b> This is the reduced row echelon form ' + tx('R') + ': each non-zero row starts with a leading 1 (bold), each leading 1 is the only non-zero entry of its column, it sits to the right of the leading 1 above it, and zero rows are at the bottom.', math: 'R=' + mat(red.R, { lead: g.lead }) });
      body.appendChild(K.steps(list));
    }

    /* ------------------------------------------------ reading R */
    function drawRead(g) {
      const body = P.read.body;
      Lab.clear(body);
      const { k, n } = g, R = g.red.R, piv = g.red.piv;
      const xs = Lab.range(0, k - 1).map(xn);
      setTitle(P.read, 'Read the answer from ' + tx('R'));
      P.read.sub('L2.4 and L2.6: a column with a leading 1 gives a <b>dependent variable</b>; a column without one gives an <b>independent variable</b>, which can take any value. (These are names for unknowns; they are not the same as dependent or independent vectors.)');
      const zeroRows = n - piv.length;
      const list = [{ html: 'Put the zero column back: ' + tx('[R\\mid 0]') + ' has the same solutions as ' + tx('Vx=0') + ', because row operations do not change the solutions.', math: '[R\\mid 0]=' + mat(R, { lead: g.lead, aug: true }) }];
      const pcs = g.pc.map(j => tx(xn(j))), fcs = g.free.map(j => tx(xn(j)));
      list.push({ html: (g.pc.length ? 'Leading 1s in column' + (g.pc.length > 1 ? 's ' : ' ') + g.pc.map(j => j + 1).join(', ') + ': ' + pcs.join(', ') + (g.pc.length > 1 ? ' are dependent variables. ' : ' is a dependent variable. ') : 'No leading 1 at all. ') +
        (g.free.length ? 'No leading 1 in column' + (g.free.length > 1 ? 's ' : ' ') + g.free.map(j => j + 1).join(', ') + ': ' + fcs.join(', ') + (g.free.length > 1 ? ' are independent variables.' : ' is an independent variable.') : 'Every column has a leading 1: no independent variables.') +
        ' Count: ' + nb('k=' + k) + ' unknowns, ' + nb('r=' + g.rank) + ' leading 1' + (g.rank === 1 ? '' : 's') + ', so ' + nb('k-r=' + k + '-' + g.rank + '=' + (k - g.rank)) + ' independent variable' + (k - g.rank === 1 ? '' : 's') + '.' });
      if (piv.length) {
        const eqs = piv.map(p => lin(R[p.row], xs) + '&=0');
        list.push({ html: 'Each non-zero row of ' + tx('R') + ' is one equation' + (zeroRows ? ' (the ' + plural(zeroRows, 'zero row') + ' say' + (zeroRows === 1 ? 's' : '') + ' ' + tx('0=0') + ': no condition)' : '') + ':', math: '\\begin{aligned}' + eqs.join('\\\\') + '\\end{aligned}' });
      }
      if (g.free.length) {
        const cn = q => cName(g, q);
        const freeSet = g.free.map((f, q) => xn(f) + '=' + cn(q));
        const depSet = piv.map(p => xn(p.col) + '=' + lin(g.free.map(f => R[p.row][f].neg()), g.free.map((f, q) => cn(q))));
        const vec = g.basis.map((u, q) => cn(q) + '\\,' + tup(u)).join('\\\\&\\quad+');
        list.push({ html: 'Give the independent variable' + (g.free.length > 1 ? 's any values ' : ' any value ') + tx(freeSet.join(',\\ ')) + ', then each equation gives its dependent variable:', math: depSet.length ? '\\begin{aligned}' + depSet.map(e => e.replace('=', '&=')).join('\\\\') + '\\end{aligned}' : null });
        const cb = currentCombo(g);
        list.push({ html: 'So every solution is, for any ' + (g.free.length === 1 ? nb('c\\in\\mathbb{R}') : nb(g.free.map((f, q) => cn(q)).join(',') + '\\in\\mathbb{R}')) + ':', math: '\\begin{aligned}x&=(' + xs.join(',') + ')\\\\&=' + vec + '\\end{aligned}' });
        list.push({ html: '<b>Infinitely many solutions</b>, one for each value of ' + (g.free.length === 1 ? tx('c') : 'the ' + tx('c') + '’s') + '. ' +
          (cb.zero ? '' : 'With ' + nb(cb.cs.map((c, q) => cn(q) + '=' + fx(c)).join(',\\ ')) + ' (next panel) it is ' + nb('x=' + tup(cb.x) + '\\ne 0') + '. ') +
          'A non-zero solution exists, so ' + tx(setTex(Lab.range(0, k - 1))) + ' is <b>linearly dependent</b>.' });
      } else {
        list.push({ html: 'With no independent variable, the equations read ' + tx(xs.map(x => x + '=0').join(',\\ ')) + '. The <b>only</b> solution is ' + tx('x=0') + ', so ' + tx(setTex(Lab.range(0, k - 1))) + ' is <b>linearly independent</b>.' });
      }
      body.appendChild(K.steps(list));
    }

    /* ------------------------------------------------ a combination that gives 0 */
    function drawCombo(g) {
      const body = P.combo.body;
      const nm = names(g);
      if (!g.dep) {
        setTitle(P.combo, 'Only the zero combination gives 0');
        P.combo.sub('L3.4 (about 3:00): independent means ' + tx('x_1v_1+\\dots+x_kv_k=0') + ' only when every ' + tx('x_j=0') + '.');
        Lab.clear(body);
        cState.rebuild = true;
        body.appendChild(K.steps([
          { html: 'The only solution of ' + tx('Vx=0') + ' is ' + tx('x=0') + ', so the only combination that gives the zero vector is the trivial one:', math: g.cols.map((v, j) => '0' + nm[j]).join('+') + '=0' },
          { html: g.k === 1 ? 'One vector that is not 0 is always independent.' : g.k === 2 ? 'For two vectors this says: neither is a multiple of the other (L3.4, about 12:00).' : 'So no vector is a combination of the others (L3.4, about 16:30): if one were, moving it to the other side would give a combination with coefficient 1, not 0.' },
        ]));
        return;
      }
      setTitle(P.combo, 'A combination that gives 0, checked');
      P.combo.sub('Dependent means some ' + nb('x\\ne0') + ' solves ' + nb('Vx=0') + ' (L3.3, about 18:30). ' + (g.free.length === 1 ? 'Pick any value of ' + tx('c') + ' except 0' : 'Pick values of ' + g.free.map((f, q) => tx(cName(g, q))).join(', ') + ', not all 0') +
        '. The start is the smallest whole number that clears the fractions, as L3.5 picks ' + nb('c=4') + ' at 22:00.');
      if (cState.rebuild || !P.combo.contains(ctl.cbox || null)) {
        cState.rebuild = false;
        Lab.clear(body);
        ctl.cbox = h('div', { class: 'mdep-cbox' });
        ctl.cins = g.free.map((f, q) => {
          const inp = h('input', { class: 'field mono', type: 'text', value: cState.strs[q], spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'value of ' + cName(g, q) });
          inp.addEventListener('input', () => { cState.strs[q] = inp.value; comboSoon(); });
          const lab = h('label', { class: 'pl-label' });
          Lab.setHTML(lab, tx(cName(g, q)) + ' (sets ' + tx(xn(f)) + ')');
          ctl.cbox.appendChild(h('div', { class: 'mdep-cfield' }, lab, inp));
          return inp;
        });
        ctl.cmsg = h('div', { class: 'pl-hint' });
        ctl.cout = h('div');
        body.append(ctl.cbox, ctl.cmsg, ctl.cout);
      }
      fillCombo(g);
    }
    const comboSoon = Lab.debounce(() => { if (!good) return; fillCombo(good); drawAnswer(good, ''); drawPicture(good); drawRead(good); }, 220);
    function fillCombo(g) {
      const nm = names(g);
      const cs = currentCs(g);
      const bad = cState.strs.map(s => !readCell(s).f);
      (ctl.cins || []).forEach((inp, q) => inp.classList.toggle('bad', bad[q]));
      Lab.clear(ctl.cout);
      if (!cs) { Lab.setHTML(ctl.cmsg, '<span class="cbad">Type a number in each box, such as 1, −2 or 1/2.</span>'); return; }
      const cb = combine(g, cs);
      if (cb.zero) { Lab.setHTML(ctl.cmsg, '<span class="cbad">With every ' + tx('c') + ' equal to 0 you get ' + tx('x=0') + ': the trivial combination, which always gives 0 and proves nothing. Make some ' + tx('c') + ' non-zero.</span>'); return; }
      Lab.setHTML(ctl.cmsg, '');
      const R = g.red.R, cn = q => cName(g, q);
      const lines = Lab.range(0, g.k - 1).map(j => {
        const fq = g.free.indexOf(j);
        if (fq >= 0) return xn(j) + '&=' + cn(fq) + '=' + fx(cb.x[j]);
        const p = g.red.piv.find(pp => pp.col === j);
        const coef = g.free.map(f => R[p.row][f].neg());
        const sym = lin(coef, g.free.map((f, q) => cn(q)));
        const nums = coef.map((a, q) => fp(a) + '\\cdot ' + fp(cs[q])).join('+');
        return xn(j) + '&=' + sym + (sym === '0' ? '' : (g.free.length > 1 ? '\\\\&=' : '=') + nums + '=' + fx(cb.x[j]));
      });
      // one short block per coordinate, three products per line, so a phone screen never scrolls sideways
      const used = Lab.range(0, g.k - 1).filter(j => !isZ(cb.x[j]));
      const checks = g.V.map((row, i) => {
        const prods = used.map(j => fp(cb.x[j]) + '\\cdot ' + fp(row[j]));
        const lines = [];
        for (let q = 0; q < prods.length; q += 3) lines.push((q ? '&\\quad+' : '&') + prods.slice(q, q + 3).join('+'));
        const vals = used.map(j => cb.x[j].mul(row[j]));
        lines.push('&=' + vals.map((v, q) => (q && !isNeg(v) ? '+' : '') + fx(v)).join('') + '=' + fx(cb.sums[i]) + (isZ(cb.sums[i]) ? '\\ \\checkmark' : ''));
        return '<span class="mdep-pc">' + Lab.tex('\\begin{aligned}&\\text{' + ordinal(i) + ' coordinate:}\\\\' + lines.join('\\\\') + '\\end{aligned}', true) + '</span>';
      });
      const jb = Lab.range(0, g.k - 1).filter(j => !isZ(cb.x[j])).pop();
      const others = Lab.range(0, g.k - 1).filter(j => j !== jb);
      const solved = linRows(others.map(j => cb.x[j].div(cb.x[jb]).neg()), others.map(j => nm[j]), 3);
      const list = [
        { html: 'Each unknown with your ' + (g.free.length === 1 ? tx('c') : tx('c') + '’s') + ':', math: '\\begin{aligned}' + lines.join('\\\\') + '\\end{aligned}' },
        { html: 'The combination:', math: '\\begin{aligned}&' + linRows(cb.x, nm, 3).map(r => '{' + r + '}').join('\\\\&\\quad ') + '=0\\end{aligned}' },
        { html: 'Check it coordinate by coordinate (L3.3 checks this way at 22:30): multiply each coefficient by the ' + (g.n === 1 ? '' : 'matching ') + 'entry of its vector and add' + (cb.x.some(isZ) ? '; vectors with coefficient 0 add nothing and are left out' : '') + '.' +
          '<div class="mdep-flow mdep-checks">' + checks.join('') + '</div>' },
        { html: 'Every coordinate is 0, so the combination is the zero vector, with coefficients that are not all 0: the set is <b>dependent</b>.' },
        { html: 'So one vector is a combination of the others (L3.4, about 14:00): divide by the coefficient ' + tx(fx(cb.x[jb])) + ' of ' + tx(vn(jb)) + ' and move the rest across:', math: '\\begin{aligned}' + nm[jb] + '&=' + solved.join('\\\\&\\quad ') + '\\end{aligned}' },
      ];
      ctl.cout.appendChild(K.steps(list));
    }

    /* ------------------------------------------------ determinant test */
    function drawDet(g) {
      const body = P.det.body;
      Lab.clear(body);
      const { n, k } = g;
      if (!g.det) {
        setTitle(P.det, 'Determinant test: needs ' + nb('k=n'));
        P.det.sub('L3.5 (about 23:00): for ' + tx('n') + ' vectors in ' + tx('\\mathbb{R}^n') + ', ' + tx('V') + ' is square and ' + tx('\\det V') + ' decides.');
        body.appendChild(K.note(tx('V') + ' is ' + tx(n + '\\times ' + k) + ' (' + plural(k, 'vector') + ' in ' + Rn2(n) + '), not square, so it has no determinant. ' +
          (k > n ? 'Here the rule “more than ' + tx('n') + ' vectors” decides at once: ' + nb(k + '>' + n) + ', dependent.' : 'Here the row reduction decides.') + ' Choose ' + tx('k=' + n) + ' to see the test.', 'mdep-box'));
        return;
      }
      setTitle(P.det, 'Determinant test: ' + nb('k=n=' + n));
      P.det.sub('L3.5 (about 23:00–25:00): ' + tx('V') + ' is square, and ' + tx('Vx=0') + ' has only ' + tx('x=0') + ' exactly when ' + tx('V') + ' is invertible, that is ' + tx('\\det V\\ne0') + '. So ' + tx('\\det V\\ne0') + ' → independent, ' + tx('\\det V=0') + ' → dependent.');
      const V = g.V, d = g.det;
      const list = [];
      const e = (i, j) => 'v_{' + (i + 1) + (j + 1) + '}';
      if (n === 1) list.push({ html: 'A ' + tx('1\\times 1') + ' matrix is one number, and its determinant is that number:', math: '\\det V=' + fx(d.v) });
      if (n === 2) list.push({ html: 'For ' + tx('V=\\begin{bmatrix}a&b\\\\c&d\\end{bmatrix}') + ', ' + tx('\\det V=ad-bc') + ' (L3.5 at 7:30: “5 times 3 minus 2 times 1”):', math: '\\det V=' + fp(V[0][0]) + '\\cdot ' + fp(V[1][1]) + '-' + fp(V[0][1]) + '\\cdot ' + fp(V[1][0]) + '=' + fx(V[0][0].mul(V[1][1])) + '-' + fp(V[0][1].mul(V[1][0])) + '=' + fx(d.v) });
      if (n === 3) {
        const t = d.d.t, p = d.d.p;
        const sym = ['11', '22', '33', '12', '23', '31', '13', '21', '32', '13', '22', '31', '11', '23', '32', '12', '21', '33'];
        const S = q => 'v_{' + sym[3 * q] + '}v_{' + sym[3 * q + 1] + '}v_{' + sym[3 * q + 2] + '}';
        const N = q => t[q].map(fp).join('\\cdot ');
        list.push({ html: 'Three products down to the right, minus three products down to the left, in the order L3.5 uses (about 15:30 and 26:00). ' + tx(e(0, 1)) + ' is the entry in row 1, column 2:', math: '\\begin{aligned}\\det V&=' + S(0) + '+' + S(1) + '+' + S(2) + '\\\\&\\quad-' + S(3) + '-' + S(4) + '-' + S(5) + '\\end{aligned}' });
        list.push({ html: 'With your entries:', math: '\\begin{aligned}\\det V&=' + N(0) + '+' + N(1) + '+' + N(2) + '\\\\&\\quad-' + N(3) + '-' + N(4) + '-' + N(5) + '\\\\&=' + fp(p[0]) + '+' + fp(p[1]) + '+' + fp(p[2]) + '-' + fp(p[3]) + '-' + fp(p[4]) + '-' + fp(p[5]) + '\\\\&=' + fx(d.v) + '\\end{aligned}' });
      }
      if (n === 4) {
        const sc = g.red.scales, sw = g.red.swaps;
        if (d.full) {
          list.push({ html: 'For a ' + tx('4\\times 4') + ' matrix, reuse the row reduction (L2.5, row reduction and the determinant): a swap (type 1) flips the sign of the determinant, multiplying a row by ' + tx('\\tfrac1a') + ' (type 2) divides it by ' + tx('a') + ', and type 3 leaves it unchanged. The reduction ends at ' + tx('R=I') + ' with ' + tx('\\det I=1') + '.' });
          list.push({ html: 'Undo the steps: your reduction made ' + plural(sw, 'swap') + ' and divided by ' + (sc.length ? tx(sc.map(fx).join(',\\ ')) : 'nothing') + ':', math: '\\det V=(-1)^{' + sw + '}' + (sc.length ? '\\cdot ' + sc.map(fp).join('\\cdot ') : '') + '=' + fx(d.v) });
        } else {
          list.push({ html: 'For a ' + tx('4\\times 4') + ' matrix, reuse the row reduction (L2.5): each row operation multiplies the determinant by a non-zero number (−1 for a swap, ' + tx('\\tfrac1a') + ' for type 2, 1 for type 3). The reduction ends with a zero row, and a matrix with a zero row has determinant 0, so ' + tx('\\det V=0') + ' too.' });
        }
      }
      list.push({ html: isZ(d.v) ? tx('\\det V=0') + ': ' + tx('V') + ' is not invertible, so ' + tx('Vx=0') + ' has solutions other than 0 → <b>dependent</b>. The row reduction agrees: only ' + plural(g.rank, 'leading 1') + ' for ' + plural(k, 'column') + '.'
        : nb('\\det V=' + fx(d.v) + '\\ne0') + ': ' + tx('V') + ' is invertible, so ' + tx('Vx=0') + ' has only ' + tx('x=0') + ' → <b>independent</b>. The row reduction agrees: a leading 1 in all ' + k + ' columns.' });
      list.push({ html: 'Writing the vectors as rows instead gives ' + tx('V^T') + ', and ' + tx('\\det V^T=\\det V') + ', so the test gives the same answer either way.' });
      body.appendChild(K.steps(list));
    }

    /* ------------------------------------------------ the two rules, and every subset */
    function drawRules(g) {
      const body = P.rules.body;
      Lab.clear(body);
      const { n, k } = g;
      P.rules.sub('Two facts from the lectures that decide many questions without row reduction, applied to your set and to every one of its subsets.');
      const r1 = h('div', { class: 'mdep-rule' });
      Lab.setHTML(r1, '<h4>Rule 1 — more vectors than the dimension: dependent</h4>' +
        '<p>L3.5 (about 16:30–19:00): any ' + tx('k>n') + ' vectors in ' + tx('\\mathbb{R}^n') + ' are dependent. Why: ' + tx('Vx=0') + ' has ' + tx('n') + ' equations and ' + tx('k') + ' unknowns. Each leading 1 needs its own row, so there are at most ' + tx('n') + ' leading 1s, and at least ' + tx('k-n') + ' columns have none: an independent variable, so a non-zero solution.</p>' +
        '<p><b>Your set:</b> ' + (k > n ? nb('k=' + k + '>' + n + '=n') + ', so it is <b>dependent</b> before any computing. At least ' + nb(k + '-' + n + '=' + (k - n)) + ' independent variable' + (k - n === 1 ? '' : 's') + ' must appear, and the row reduction found ' + (k - g.rank) + '.'
          : nb('k=' + k + '\\le ' + n + '=n') + ', so this rule does not decide; the row reduction does (it found ' + plural(g.rank, 'leading 1') + ' for ' + plural(k, 'column') + ').') + '</p>');
      body.appendChild(r1);
      const r2 = h('div', { class: 'mdep-rule' });
      const all = g.subsets, fullDep = g.dep;
      const mins = all.filter(s => s.minimal);
      Lab.setHTML(r2, '<h4>Rule 2 — a subset of an independent set is independent</h4>' +
        '<p>L3.3 (about 24:00–24:30): if a set is dependent, so is every bigger set that contains it — reuse its combination and give each new vector the coefficient 0. Turned around: every subset of an independent set is independent. (A subset of a dependent set can go either way.)</p>' +
        '<p><b>Your set:</b> ' + (fullDep
          ? 'dependent. Its smallest dependent subsets (thick red border): ' + mins.map(s => tx(setTex(s.idx))).join(', ') + '. Every subset that contains one of them is dependent (red); the others are independent (green).'
          : 'independent, so all ' + nb('2^{' + k + '}-1=' + ((1 << k) - 1)) + ' non-empty subsets are independent — every chip is green.') + ' Tap a subset to see why.</p>');
      const sizes = Lab.range(1, k);
      sizes.forEach(z => {
        const group = all.filter(s => s.idx.length === z);
        r2.appendChild(h('div', { class: 'mdep-sz', text: z + (z === 1 ? ' vector' : ' vectors') + ' · ' + group.filter(s => s.dep).length + ' dependent, ' + group.filter(s => !s.dep).length + ' independent' }));
        const chips = h('div', { class: 'mdep-chips' });
        group.forEach(s => {
          const b = h('button', { type: 'button', class: 'mdep-chip ' + (s.dep ? 'dep' : 'ind') + (s.minimal ? ' min' : '') + (st.sub === s.mask ? ' on' : ''), html: tx(setTex(s.idx)), 'aria-label': 'subset ' + s.idx.map(j => 'v' + (j + 1)).join(', ') + (s.dep ? ', dependent' : ', independent') });
          b.addEventListener('click', () => { st.sub = s.mask; save(); Lab.$$('.mdep-chip', r2).forEach(c => c.classList.remove('on')); b.classList.add('on'); subsetRead(g, s); });
          chips.appendChild(b);
        });
        r2.appendChild(chips);
      });
      ctl.subRead = h('div', { class: 'mdep-box', style: { marginTop: '12px' } });
      r2.appendChild(ctl.subRead);
      body.appendChild(r2);
      const pick = all.find(s => s.mask === st.sub);
      if (pick) subsetRead(g, pick); else Lab.setHTML(ctl.subRead, '<span class="muted">Tap a subset above: its verdict, the reason and, when it is dependent, a combination that gives 0.</span>');
      // the two special cases of L3.4, applied to the typed vectors
      const r3 = h('div', { class: 'mdep-rule' });
      const zs = g.zero.map((b, j) => (b ? j : -1)).filter(j => j >= 0);
      const pairs = [];
      for (let a = 0; a < k; a++) for (let b = a + 1; b < k; b++) if (!g.zero[a] && !g.zero[b]) pairs.push([a, b]);
      const multiple = (a, b) => {
        // b is the multiple t·a when every entry of b is t times the matching entry of a; t comes from the first
        // non-zero entry of a
        const i = g.cols[a].findIndex(f => !isZ(f));
        const t = g.cols[b][i].div(g.cols[a][i]);
        return g.cols[b].every((f, q) => f.eq(t.mul(g.cols[a][q]))) ? t : null;
      };
      const depPairs = pairs.map(([a, b]) => ({ a, b, t: multiple(a, b) })).filter(p => p.t);
      Lab.setHTML(r3, '<h4>Two special cases (L3.4)</h4>' +
        '<p><b>The zero vector</b> (about 7:00): a set that contains 0 is dependent, because ' + nb('1\\cdot 0=0') + ' has the non-zero coefficient 1. ' +
        (zs.length ? 'Yours: ' + zs.map(j => tx(vn(j) + '=0')).join(', ') + ', so every subset containing ' + (zs.length > 1 ? 'one of them' : 'it') + ' is dependent.' : 'None of your vectors is the zero vector.') + '</p>' +
        '<p><b>Two non-zero vectors</b> (about 8:30–12:30) are dependent exactly when one is a multiple of the other. ' +
        (pairs.length ? (depPairs.length ? 'Yours: ' + depPairs.map(p => nb(vn(p.b) + '=' + (p.t.eq(1) ? '' : p.t.eq(-1) ? '-' : fx(p.t)) + vn(p.a))).join(', ') + ' — dependent pair' + (depPairs.length > 1 ? 's' : '') + '. ' : '') +
          (pairs.length - depPairs.length ? (depPairs.length ? 'The other ' : 'All ') + plural(pairs.length - depPairs.length, 'pair') + ' of non-zero vectors ' + (pairs.length - depPairs.length === 1 ? 'is' : 'are') + ' not multiples, so independent.' : '')
          : 'You have fewer than two non-zero vectors.') + '</p>');
      body.appendChild(r3);
    }
    function subsetRead(g, s) {
      const z = s.idx.length;
      const nm = s.idx.map(vc);
      const why = [];
      if (s.dep) {
        if (z > g.n) why.push(nb(z + '>' + g.n) + ' vectors in ' + Rn2(g.n) + ' (Rule 1)');
        if (s.idx.some(j => g.zero[j])) why.push('it contains the zero vector');
      }
      Lab.setHTML(ctl.subRead, tx(setTex(s.idx)) + ': the ' + tx(g.n + '\\times ' + z) + ' matrix of these columns reduces to ' + plural(s.rank, 'leading 1') + ' for ' + plural(z, 'column') + ', so it is ' +
        (s.dep ? '<b class="cbad">dependent</b>' + (why.length ? ' (' + why.join('; ') + ')' : '') + '. A combination that gives 0: ' + nb(lin(s.x, nm) + '=0') + '.'
          : '<b class="cgood">independent</b>: only the zero combination gives 0.'));
    }

    /* -------------------------------------------------------------- mount */
    function mount(el) {
      injectStyle();
      root = el;
      const { side, main } = K.layout(root, 'mdep');
      side.appendChild(K.group('Lecture examples'));
      ctl.pre = presetMenu();
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 'mdep-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
        Lab.store.set(KEY, {});
        Object.keys(st).forEach(k => delete st[k]);
        Object.assign(st, DEF());
        const k0 = PRESETS.findIndex(p => p.id === START);
        ctl.pre.select.value = String(k0);
        Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[k0].src);
        buildSide(); draw();
      }, 'btn ghost sm')));
      P.answer = K.answer();
      P.pic = K.panel('Picture in ℝ²: on one line or not?');
      P.setup = K.panel('Your vectors become the columns of V');
      P.steps = K.panel('Row-reduce V, step by step');
      P.read = K.panel('Read the answer from R');
      P.combo = K.panel('A combination that gives 0');
      P.det = K.panel('Determinant test');
      P.rules = K.panel('Two rules that save work');
      setTitle(P.pic, 'Picture in ' + tx('\\mathbb{R}^2') + ': on one line or not?');
      P.pic.sub('Each vector is an arrow from ' + tx('(0,0)') + '. Two vectors are dependent exactly when they lie on one line through 0 — one is a multiple of the other (L3.3 about 21:30, L3.4 about 12:00).');
      setTitle(P.setup, 'Your vectors become the columns of ' + tx('V'));
      setTitle(P.steps, 'Row-reduce ' + tx('V') + ', step by step');
      main.append(P.answer, P.pic, P.setup, P.steps, P.read, P.combo, P.det, P.rules);
      root.__mdep = { get st() { return st; }, get res() { return good; }, combo: () => (good && good.dep ? currentCombo(good) : null) };
      buildSide();
      draw();
      if (st.loaded) {
        const k = PRESETS.findIndex(p => p.id === st.loaded);
        if (k >= 0 && shown(PRESETS[k])) { ctl.pre.select.value = String(k); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[k].src); }
      }
      // the picture is sized from the panel width: redraw it when the width changes
      let lastW = P.pic.body.clientWidth;
      window.addEventListener('resize', Lab.debounce(() => {
        if (!root.isConnected || !good) return;
        const w = P.pic.body.clientWidth;
        if (w && w !== lastW) { lastW = w; drawPicture(good); }
      }, 200));
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-m2-dependence', course: 'm2', week: 3, order: 5,
    title: 'Linear dependence lab', sub: 'Dependent or independent?',
    topics: ['linear combination', 'dependent', 'independent', 'Vx = 0', 'row reduction', 'exact fractions', 'determinant test', 'ℝ² arrows', 'k > n rule', 'subsets'],
    desc: 'Type up to five vectors in ℝ¹ to ℝ⁴. They become the columns of V, which is row-reduced step by step with exact fractions. See the verdict, a non-zero combination that gives 0 (checked), the determinant test when k = n, arrows for vectors in ℝ², and the two rules applied to every subset.',
    render: el => dependenceLab().mount(el),
  });
})();
