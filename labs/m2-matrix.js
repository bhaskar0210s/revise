/* Maths Lab — Mathematics II · Weeks 1–2 playground lab (lectures L1.2, L1.4, L1.5 and L2.1).
   'lab-m2-matrix': the learner's own matrices A and B (each up to 4 × 4) and a scalar c. It shows A + B, cA and AB
   entry by entry (AB as a row times a column), the transpose, det A expanded along the row or column the learner
   picks (minors with the deleted row and column struck out, the signs, every term), and what each row or column
   operation does to det A, checked on the learner's own matrix. Arithmetic is exact (Lab.F fractions); a result too
   large for exact arithmetic is flagged. */
(function () {
  'use strict';
  const { h, F } = Lab;
  const K = Lab.play;
  const esc = Lab.esc;
  const tex = s => Lab.tex(s);
  const KEY = 'lab:m2-matrix';
  const MAX = 4;
  const HL = '#4655d4';
  const hl = s => '\\textcolor{' + HL + '}{' + s + '}';

  /* ================================================================ styles (one <style>, added once) */
  const CSS = `
.mxl .mx-dyn { display: grid; gap: 12px; }
.mxl .mx-ed { gap: 8px; }
.mxl .mx-size { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.mxl .mx-size-f { display: grid; gap: 4px; min-width: 0; }
.mxl .mx-size .seg { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); width: 100%; }
.mxl .mx-size .seg button { padding: 6px 0; font-size: 15px; font-weight: 650; min-height: 38px; }
.mxl .mx-grid { display: grid; gap: 6px; }
.mxl .mx-in { width: 100%; min-width: 0; height: 44px; padding: 0 4px; text-align: center; font-size: 16px; }
.mxl .mx-k { width: 110px; height: 44px; padding: 0 8px; text-align: center; font-size: 16px; }
.mxl .mxv { display: inline-flex; flex-direction: column; align-items: center; gap: 4px; flex: none; }
.mxl .mxv-name { font-size: 15px; color: var(--ink-2); min-height: 22px; }
.mxl .mxv-foot { font-size: 12.5px; color: var(--ink-3); }
.mxl .mxv-br { position: relative; padding: 3px 10px; }
.mxl .mxv-br::before, .mxl .mxv-br::after { content: ""; position: absolute; top: 0; bottom: 0; width: 6px; border: 2px solid var(--ink-3); }
.mxl .mxv-br::before { left: 0; border-right: 0; border-radius: 4px 0 0 4px; }
.mxl .mxv-br::after { right: 0; border-left: 0; border-radius: 0 4px 4px 0; }
.mxl .mxv-grid { display: grid; gap: 2px 4px; }
.mxl .mxv-c { min-width: 34px; min-height: 34px; padding: 2px 6px; display: flex; align-items: center; justify-content: center; border-radius: 8px; border: 0; background: none; color: var(--ink); font: 15px/1.2 var(--font-sans); white-space: nowrap; }
.mxl button.mxv-c { cursor: pointer; -webkit-tap-highlight-color: transparent; }
@media (hover: hover) { .mxl button.mxv-c:hover { background: var(--bg-sunk-2); } }
.mxl .mxv-c.lit { background: var(--accent-soft); color: var(--accent-ink); }
.mxl .mxv-c.hot, .mxl button.mxv-c.hot:hover { background: var(--accent); color: var(--bg-elev); }
.mxl .mxv-c.dim { color: var(--ink-4); background: var(--bg-sunk-2); }
.mxl .mxv-c.key { position: relative; z-index: 1; box-shadow: inset 0 0 0 2px var(--accent); color: var(--accent-ink); font-weight: 700; background: var(--bg-elev); }
.mxl .mxv-c.chg { background: var(--pick-soft); }
.mxl .mxv-sr { height: 2px; align-self: center; background: var(--ink-3); opacity: .6; pointer-events: none; border-radius: 2px; }
.mxl .mxv-sc { width: 2px; justify-self: center; background: var(--ink-3); opacity: .6; pointer-events: none; border-radius: 2px; }
.mxl .mx-eq { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 12px; }
.mxl .mx-sym { font-size: 20px; color: var(--ink-3); line-height: 1; }
.mxl .mx-scroll { overflow-x: auto; overflow-y: hidden; max-width: 100%; padding-bottom: 2px; }
.mxl .mx-falk { display: inline-grid; gap: 2px 3px; }
.mxl .mx-brk { border: 2px solid var(--ink-3); width: 6px; }
.mxl .mx-brk.l { border-right: 0; justify-self: end; border-radius: 4px 0 0 4px; }
.mxl .mx-brk.r { border-left: 0; justify-self: start; border-radius: 0 4px 4px 0; }
.mxl .mx-falk-tag { font-size: 15px; color: var(--ink-2); align-self: end; justify-self: center; padding: 6px 0 2px; }
.mxl .mx-falk-tag.b { align-self: center; justify-self: end; padding: 0 10px 0 0; }
.mxl .mx-read { padding: 8px 12px; border-radius: 12px; background: var(--bg-sunk); border: 1px solid var(--line); overflow-x: auto; overflow-y: hidden; }
.mxl .mx-math { overflow-x: auto; overflow-y: hidden; }
.mxl .mx-math.wrap { line-height: 2.3; padding: 4px 0; font-size: 1.05em; }
.mxl .mx-read.wrap { padding: 6px 12px; }
.mxl .mxv.sm .mxv-c { min-width: 28px; min-height: 28px; padding: 1px 4px; font-size: 14px; }
.mxl .mx-read .katex-display, .mxl .mx-math .katex-display { margin: 6px 0; text-align: left; }
.mxl .mx-read .katex-display > .katex, .mxl .mx-math .katex-display > .katex { text-align: left; }
.mxl .mx-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.mxl .mx-row .btn { min-height: 44px; }
.mxl .mx-lines { display: grid; grid-template-columns: minmax(0, 1fr); border-top: 1px solid var(--line); }
.mxl .mx-line { display: flex; align-items: center; min-width: 0; min-height: 44px; padding: 6px 8px; border-bottom: 1px solid var(--line); color: var(--ink); overflow-x: auto; overflow-y: hidden; cursor: pointer; white-space: nowrap; }
.mxl .mx-line:focus-visible, .mxl .mx-res:focus-visible { outline: 2.5px solid var(--accent); outline-offset: -2px; }
.mxl .mx-line.on { background: var(--accent-soft); }
.mxl .mx-terms { display: grid; gap: 12px; }
.mxl .mx-term { border: 1px solid var(--line); border-radius: 14px; padding: 12px 12px 6px; background: var(--bg-sunk); min-width: 0; }
.mxl .mx-term-h { font-weight: 650; font-size: 15.5px; margin-bottom: 8px; line-height: 1.5; }
.mxl .mx-term-pics { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-bottom: 4px; }
.mxl .mx-term.zero { padding-bottom: 12px; }
.mxl .mx-pick { display: grid; gap: 8px; }
.mxl .mx-pick-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.mxl .mx-pick-lab { min-width: 72px; font-size: 14.5px; font-weight: 600; color: var(--ink-2); }
.mxl .mx-chip { min-width: 44px; height: 44px; padding: 0 12px; border-radius: 12px; border: 1px solid var(--line-2); background: var(--bg-elev); color: var(--ink-2); font: 650 16px var(--font-sans); cursor: pointer; }
.mxl .mx-chip.on { background: var(--accent); border-color: var(--accent); color: var(--bg-elev); }
.mxl .mx-chip:disabled { opacity: .35; cursor: default; }
.mxl .mx-chip.wide { font-size: 15px; font-weight: 600; }
.mxl .mx-strip { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.mxl .mx-res { flex: 0 1 auto; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; min-width: 120px; max-width: 100%; padding: 8px 12px; border-radius: 12px; border: 1px solid var(--accent-line); background: var(--bg-elev); color: var(--ink); cursor: pointer; }
.mxl .mx-res-m { display: block; max-width: 100%; overflow-x: auto; overflow-y: hidden; }
.mxl .mx-res-t { font-size: 13px; font-weight: 700; color: var(--ink-3); }
.mxl .mx-res-no { font-size: 13.5px; color: var(--ink-3); line-height: 1.4; }
.mxl .mx-note { padding: 10px 12px; border-radius: 12px; background: var(--bg-sunk); border: 1px solid var(--line); font-size: 15px; line-height: 1.55; }
.mxl .mx-note.good { background: var(--good-soft); border-color: var(--good-line); }
.mxl .mx-note.warn { background: var(--bad-soft); border-color: var(--bad-line); }
.mxl .mx-notes { display: grid; gap: 8px; }
.mxl .mx-more { border: 1px solid var(--line); border-radius: 12px; padding: 0 12px; background: var(--bg-elev); }
.mxl .mx-more > summary { min-height: 44px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-weight: 600; font-size: 15px; color: var(--accent-ink); list-style: none; }
.mxl .mx-more > summary > span { min-width: 0; }
.mxl .mx-more > summary::-webkit-details-marker { display: none; }
.mxl .mx-more > summary::before { content: "▸"; display: inline-block; transition: transform .15s; }
.mxl .mx-more[open] > summary::before { transform: rotate(90deg); }
.mxl .mx-more[open] { padding-bottom: 10px; }
.mxl .mx-work { display: grid; gap: 4px; }
.mxl .mx-opctl { display: grid; gap: 12px; }
.mxl .mx-opctl .seg { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); width: 100%; }
.mxl .mx-opctl .seg button { white-space: normal; line-height: 1.25; padding: 8px 6px; min-height: 44px; font-size: 14px; }
.mxl .mx-f { display: grid; gap: 6px; }
.mxl .mx-f > .pl-label { font-size: 14px; }
.mxl .pl-panel { scroll-margin-top: 80px; }
:root[data-theme="dark"] .mxl .katex [style*="4655d4"] { color: var(--accent) !important; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .mxl .katex [style*="4655d4"] { color: var(--accent) !important; } }
@media (max-width: 560px) {
  .mxl .mxv-c { min-width: 30px; min-height: 32px; padding: 2px 4px; font-size: 14.5px; }
  .mxl .mx-line { white-space: normal; overflow: visible; line-height: 2; padding: 8px; }
  .mxl .mx-term { padding: 10px 10px 4px; }
  .mxl .mx-sym { font-size: 18px; }
}
@media (pointer: coarse) { .mxl button.mxv-c { min-height: 40px; min-width: 36px; } }
`;
  function addStyle() {
    if (document.getElementById('mx-lab-style')) return;
    const s = document.createElement('style');
    s.id = 'mx-lab-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ================================================================ sources */
  const VIDEO = { 'L1.2': 'rnIDlZnrCc0', 'L1.4': 'A3fxp49I4U8', 'L1.5': 'wejxX0YYYg4', 'L2.1': 'uO3mocPU9Q4' };
  /** A link to a lecture video at a given time, e.g. lec('L1.4', '9:00'). */
  function lec(code, at) {
    const [m, s] = at.split(':').map(Number);
    return '<a href="https://www.youtube.com/watch?v=' + VIDEO[code] + '&amp;t=' + (m * 60 + s) + 's" target="_blank" rel="noopener">' + code + ', ' + at + '</a>';
  }
  const SETS = { 'AQ1.2': 'm2-23', 'AQ1.4': 'm2-27', 'AQ1.5': 'm2-29', 'AQ2.1': 'm2-44' };
  /** A link to an activity question set, e.g. aq('AQ1.4', 2). */
  const aq = (code, q) => '' + code + ', question ' + q + '';

  /* ================================================================ exact numbers */
  let DEC = false;      // write non-whole numbers as decimals when the decimal ends (else as fractions)
  let INEXACT = false;  // set when a shown number grew beyond exact arithmetic
  // Lab.F works with safe integers; an operation that leaves them returns a rounded value marked approx.
  // These wrappers keep that mark on every later result.
  const keep = (r, xs) => { if (xs.some(x => x.approx)) r.approx = true; return r; };
  const add = (a, b) => keep(a.add(b), [a, b]);
  const sub = (a, b) => keep(a.sub(b), [a, b]);
  const mul = (a, b) => keep(a.mul(b), [a, b]);
  const neg = a => keep(a.neg(), [a]);
  const sum = xs => xs.reduce((s, x) => add(s, x), F(0));
  const isNeg = f => Number(f) < 0;
  const pow = (f, k) => { let r = F(1); for (let i = 0; i < k; i++) r = mul(r, f); return r; };

  /** The exact decimal of a fraction whose denominator is 2^a·5^b (at most 6 places), else null. */
  function decOf(f) {
    if (f.d === 1) return String(f.n);
    let d = f.d, a = 0, b = 0;
    while (d % 2 === 0) { d /= 2; a++; }
    while (d % 5 === 0) { d /= 5; b++; }
    const k = Math.max(a, b);
    if (d !== 1 || k > 6) return null;
    const m = Math.abs(f.n) * (Math.pow(10, k) / f.d);
    if (!Number.isSafeInteger(m)) return null;
    const s = String(m).padStart(k + 1, '0');
    return (f.n < 0 ? '-' : '') + s.slice(0, s.length - k) + '.' + s.slice(s.length - k);
  }
  /** TeX for one number: whole numbers as they are, others as a fraction (or a decimal in decimal mode). */
  function nt(f) {
    if (f.approx) {
      INEXACT = true;
      const [m, e] = Number(f).toExponential(5).split('e');
      return m.replace(/\.?0+$/, '') + '\\times 10^{' + Number(e) + '}';
    }
    if (f.d === 1) return Math.abs(f.n) >= 1e4 ? K.intTex(f.n) : String(f.n);
    if (DEC) { const s = decOf(f); if (s != null) return s; }
    return (f.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.n) + '}{' + f.d + '}';
  }
  /** A number used as a factor: negative numbers in brackets. */
  const pt = f => (isNeg(f) ? '(' + nt(f) + ')' : nt(f));
  /** A number raised to a power, in brackets when it is negative or a fraction. */
  const powT = (f, k) => (isNeg(f) || (f.d !== 1 && !(DEC && decOf(f) != null)) ? '\\left(' + nt(f) + '\\right)' : nt(f)) + '^{' + k + '}';
  /** The text to put back in an input box. */
  const plain = f => (f.d === 1 ? String(f.n) : DEC && decOf(f) != null ? decOf(f) : f.n + '/' + f.d);
  /** "a + b − c" from a list of values. */
  function sumTex(vals) {
    return vals.map((v, k) => { const m = isNeg(v), b = nt(m ? neg(v) : v); return (k ? (m ? '-' : '+') : (m ? '-' : '')) + b; }).join('');
  }
  /** Read one typed entry: {f} or {err}. Accepts 3, -2, 3/4, 0.5, 1/2*3. */
  function parseEntry(s) {
    const t = String(s == null ? '' : s).trim().replace(/−/g, '-');
    if (!t) return { err: 'empty' };
    const f = K.parseNum(t);
    if (f == null) return { err: 'nan' };
    if (f.approx) return { err: 'inexact' };
    if (Math.abs(f.n) > 1e9 || f.d > 1e6) return { err: 'big' };
    return { f };
  }
  const WHY = { empty: 'is empty', nan: 'is not a number', inexact: 'is not an exact number', big: 'is too big (keep entries below a billion)' };

  /* ================================================================ matrices */
  const tr = M => M[0].map((_, j) => M.map(r => r[j]));
  const isSq = M => M.length === M[0].length;
  const sameSize = (A, B) => A.length === B.length && A[0].length === B[0].length;
  const minorOf = (M, i, j) => M.filter((_, r) => r !== i).map(r => r.filter((_, c) => c !== j));
  const matAdd = (A, B) => A.map((r, i) => r.map((v, j) => add(v, B[i][j])));
  const matScale = (c, A) => A.map(r => r.map(v => mul(c, v)));
  const matMul = (A, B) => A.map(r => B[0].map((_, j) => sum(r.map((v, k) => mul(v, B[k][j])))));
  /** det by expansion along the first row (n ≤ 4). */
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return sub(mul(M[0][0], M[1][1]), mul(M[0][1], M[1][0]));
    let s = F(0);
    for (let j = 0; j < n; j++) {
      if (M[0][j].isZero()) continue;
      const t = mul(M[0][j], det(minorOf(M, 0, j)));
      s = j % 2 ? sub(s, t) : add(s, t);
    }
    return s;
  }
  /** The entries of a row or column: L = {kind: 'row' | 'col', idx}. */
  const lineOf = (M, L) => (L.kind === 'row' ? M[L.idx] : M.map(r => r[L.idx]));
  const lineName = L => (L.kind === 'row' ? 'row ' : 'column ') + (L.idx + 1);
  const zerosIn = (M, L) => lineOf(M, L).filter(v => v.isZero()).length;
  const allLines = n => ['row', 'col'].flatMap(kind => Array.from({ length: n }, (_, idx) => ({ kind, idx })));
  /** The row or column with the most zeros (the first one on a tie). */
  function bestLine(M) {
    let best = { kind: 'row', idx: 0 }, z = -1;
    allLines(M.length).forEach(L => { const k = zerosIn(M, L); if (k > z) { z = k; best = L; } });
    return best;
  }
  /** det M expanded along L: each term with its position, sign, entry, minor, cofactor and value. */
  function expand(M, L) {
    const n = M.length, terms = [];
    for (let k = 0; k < n; k++) {
      const i = L.kind === 'row' ? L.idx : k, j = L.kind === 'row' ? k : L.idx;
      const a = M[i][j], sign = (i + j) % 2 ? -1 : 1, minor = minorOf(M, i, j), m = det(minor), cof = sign < 0 ? neg(m) : m;
      terms.push({ i, j, a, sign, minor, m, cof, val: mul(a, cof) });
    }
    return { terms, val: sum(terms.map(t => t.val)) };
  }
  /** A row or column operation: op = {kind: 'swap' | 'scale' | 'add', on: 'row' | 'col', i, j}; k is a Frac. */
  function applyOp(A, op, k) {
    const X = op.on === 'row' ? A.map(r => r.slice()) : tr(A);
    if (op.kind === 'swap') { const t = X[op.i]; X[op.i] = X[op.j]; X[op.j] = t; }
    else if (op.kind === 'scale') X[op.i] = X[op.i].map(v => mul(k, v));
    else X[op.i] = X[op.i].map((v, c) => add(v, mul(k, X[op.j][c])));
    return op.on === 'row' ? X : tr(X);
  }

  /* ================================================================ TeX pieces */
  const bm = (M, cell) => '\\begin{bmatrix}' + M.map((r, i) => r.map((v, j) => (cell ? cell(v, i, j) : nt(v))).join('&')).join('\\\\') + '\\end{bmatrix}';
  const szT = M => M.length + '\\times ' + M[0].length;
  const sz = M => tex(szT(M));
  const ij = (i, j) => String(i + 1) + String(j + 1);
  /** "lhs = r1 = r2 = …" on one line (it wraps after an "=" on a narrow screen), or one "=" per line. Repeats are dropped. */
  function chain(lhs, rhs, lines) {
    const parts = rhs.filter((r, k) => r !== '' && (k === 0 || r !== rhs[k - 1]));
    // braces keep each side whole, so a line can only break after an "="
    if (!lines || parts.length < 2) return lhs + '=' + parts.map(x => '{' + x + '}').join('=');
    return '\\begin{aligned}' + lhs + '&=' + parts.join('\\\\&=') + '\\end{aligned}';
  }
  /** det of a 1 × 1, 2 × 2 or 3 × 3 matrix with every product written out: {rhs: [TeX after each "="], val}. */
  function detWork(S) {
    const n = S.length;
    if (n === 1) return { rhs: [nt(S[0][0])], val: S[0][0] };
    if (n === 2) {
      const p = mul(S[0][0], S[1][1]), q = mul(S[0][1], S[1][0]), v = sub(p, q);
      return { rhs: [pt(S[0][0]) + '\\cdot ' + pt(S[1][1]) + '-' + pt(S[0][1]) + '\\cdot ' + pt(S[1][0]), nt(p) + '-' + pt(q), nt(v)], val: v };
    }
    // a 3 × 3: along its first row (the definition in L1.4)
    const parts = [0, 1, 2].map(j => {
      const m = minorOf(S, 0, j), p = mul(m[0][0], m[1][1]), q = mul(m[0][1], m[1][0]);
      return { a: S[0][j], m, p, q, d: sub(p, q) };
    });
    const sg = j => (j === 1 ? '-' : j === 2 ? '+' : '');
    const vals = parts.map((x, j) => (j === 1 ? neg(mul(x.a, x.d)) : mul(x.a, x.d)));
    const v = sum(vals);
    return {
      rhs: [
        parts.map((x, j) => sg(j) + pt(x.a) + '\\cdot(' + pt(x.m[0][0]) + '\\cdot ' + pt(x.m[1][1]) + '-' + pt(x.m[0][1]) + '\\cdot ' + pt(x.m[1][0]) + ')').join(''),
        parts.map((x, j) => sg(j) + pt(x.a) + '\\cdot(' + nt(x.p) + '-' + pt(x.q) + ')').join(''),
        parts.map((x, j) => sg(j) + pt(x.a) + '\\cdot ' + pt(x.d)).join(''),
        sumTex(vals),
        nt(v),
      ],
      val: v,
    };
  }

  /* ================================================================ pictures */
  /** A formula as a block: an aligned array in display mode, anything else inline so it can wrap after "=". */
  function mathEl(src, cls) {
    const disp = src.startsWith('\\begin{aligned}');
    return h('div', { class: 'mx-math' + (disp ? '' : ' wrap') + (cls ? ' ' + cls : ''), html: Lab.tex(disp ? src : '\\displaystyle ' + src, disp) });
  }
  const readEl = src => mathEl(src, 'mx-read');
  /** K.steps, with each formula turned into a block that can wrap on a phone. */
  function stepList(list) {
    return K.steps(list.filter(Boolean).map(x => {
      if (!x.math) return x;
      const box = h('div', { class: 'mx-work' }, mathEl(x.math));
      if (x.block) box.appendChild(x.block);
      return { html: x.html, note: x.note, block: box };
    }));
  }
  const sym = s => h('span', { class: 'mx-sym', html: tex(s) });
  const note = (html, cls) => { const d = h('div', { class: 'mx-note' + (cls ? ' ' + cls : '') }); Lab.setHTML(d, html); return d; };
  const eqRow = items => h('div', { class: 'mx-scroll' }, h('div', { class: 'mx-eq' }, items));
  /** A div that acts as a button (Enter and Space too), so its content may scroll sideways. */
  function tapBox(cls, kids, onTap, label) {
    const el = h('div', { class: cls, role: 'button', tabindex: '0' }, kids);
    if (label) el.setAttribute('aria-label', label);
    el.addEventListener('click', onTap);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onTap(); } });
    return el;
  }
  function more(title, nodes) {
    // one span inside the summary, so its words can wrap (summary is a flex row)
    const d = h('details', { class: 'mx-more' }, h('summary', {}, h('span', { html: title })));
    nodes.forEach(n => d.appendChild(n));
    return d;
  }
  /**
   * A matrix drawn as a bracketed grid. o: {name (TeX), foot (html), cls(i, j) → class, tap(i, j), cell(i, j) → TeX,
   * strike: [i, j] (a line through that row and that column), label (for screen readers)}.
   */
  function mxView(M, o = {}) {
    const r = M.length, c = M[0].length;
    const box = h('div', { class: 'mxv' + (o.small ? ' sm' : '') });
    if (o.name != null) box.appendChild(h('div', { class: 'mxv-name', html: tex(o.name) }));
    const g = h('div', { class: 'mxv-grid' });
    g.style.gridTemplateColumns = 'repeat(' + c + ', auto)';
    g.style.gridTemplateRows = 'repeat(' + r + ', auto)';
    for (let i = 0; i < r; i++) {
      for (let j = 0; j < c; j++) {
        const cls = 'mxv-c' + (o.cls ? ' ' + (o.cls(i, j) || '') : '');
        const html = tex(o.cell ? o.cell(i, j) : nt(M[i][j]));
        const el = o.tap ? h('button', { type: 'button', class: cls, html, 'aria-label': (o.label || 'entry') + ' ' + (i + 1) + ', ' + (j + 1) }) : h('div', { class: cls, html });
        el.style.gridRow = String(i + 1);
        el.style.gridColumn = String(j + 1);
        if (o.tap) el.addEventListener('click', () => o.tap(i, j));
        g.appendChild(el);
      }
    }
    if (o.strike) {
      const a = h('i', { class: 'mxv-sr' }), b = h('i', { class: 'mxv-sc' });
      a.style.gridRow = String(o.strike[0] + 1); a.style.gridColumn = '1 / -1';
      b.style.gridColumn = String(o.strike[1] + 1); b.style.gridRow = '1 / -1';
      g.append(a, b);
    }
    box.appendChild(h('div', { class: 'mxv-br' }, g));
    if (o.foot) box.appendChild(h('div', { class: 'mxv-foot', html: o.foot }));
    return box;
  }
  /**
   * A and B laid out for multiplication: B on top, A on the left, AB where a row of A meets a column of B.
   * sel = [i, j] lights row i of A, column j of B and entry (i, j) of AB.
   */
  function falk(A, B, P, sel, onTap) {
    const m = A.length, n = A[0].length, p = B[0].length, [si, sj] = sel;
    const g = h('div', { class: 'mx-falk' });
    // columns: bracket, A (n), bracket, gap, bracket, B and AB (p), bracket; rows: B (n), names, A and AB (m)
    g.style.gridTemplateColumns = '8px repeat(' + n + ', auto) 8px 14px 8px repeat(' + p + ', auto) 8px';
    g.style.gridTemplateRows = 'repeat(' + n + ', auto) auto repeat(' + m + ', auto)';
    const colA = k => 2 + k, colR = j => n + 5 + j, rowB = k => 1 + k, rowA = i => n + 2 + i;
    const put = (el, r, c) => { el.style.gridRow = String(r); el.style.gridColumn = String(c); g.appendChild(el); return el; };
    const cell = (v, cls) => h('div', { class: 'mxv-c' + (cls ? ' ' + cls : ''), html: tex(nt(v)) });
    B.forEach((row, k) => row.forEach((v, j) => put(cell(v, j === sj ? 'lit' : ''), rowB(k), colR(j))));
    A.forEach((row, i) => row.forEach((v, k) => put(cell(v, i === si ? 'lit' : ''), rowA(i), colA(k))));
    P.forEach((row, i) => row.forEach((v, j) => {
      const b = h('button', { type: 'button', class: 'mxv-c' + (i === si && j === sj ? ' hot' : ''), html: tex(nt(v)), 'aria-label': 'entry ' + (i + 1) + ', ' + (j + 1) + ' of AB' });
      b.addEventListener('click', () => onTap(i, j));
      put(b, rowA(i), colR(j));
    }));
    const brk = (side, r0, r1, c) => { const e = h('i', { class: 'mx-brk ' + side }); e.style.gridRow = r0 + ' / ' + (r1 + 1); e.style.gridColumn = String(c); g.appendChild(e); };
    brk('l', rowA(0), rowA(m - 1), 1); brk('r', rowA(0), rowA(m - 1), n + 2);
    brk('l', rowB(0), rowB(n - 1), n + 4); brk('r', rowB(0), rowB(n - 1), n + p + 5);
    brk('l', rowA(0), rowA(m - 1), n + 4); brk('r', rowA(0), rowA(m - 1), n + p + 5);
    const tag = (s, r, c0, c1, cls) => { const e = h('div', { class: 'mx-falk-tag' + (cls ? ' ' + cls : ''), html: tex(s) }); e.style.gridRow = String(r); e.style.gridColumn = c0 + ' / ' + (c1 + 1); g.appendChild(e); };
    tag('B', '1 / ' + (n + 1), 1, n + 3, 'b');
    tag('A', n + 1, 1, n + 2);
    tag('AB', n + 1, n + 4, n + p + 5);
    return g;
  }
  /** The signs (−1)^(i+j) as a checkerboard, with the chosen row or column lit. */
  function signChart(n, L) {
    const M = Array.from({ length: n }, () => Array.from({ length: n }, () => F(0)));
    return mxView(M, {
      name: '(-1)^{i+j}',
      cell: (i, j) => ((i + j) % 2 ? '-' : '+'),
      cls: (i, j) => ((L.kind === 'row' ? i === L.idx : j === L.idx) ? 'lit' : ''),
    });
  }

  /* ================================================================ lecture examples */
  const M = s => s.split(';').map(r => r.trim().split(/\s+/));
  const ID = n => Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => (i === j ? '1' : '0')));
  const L14 = '2 4 1; 3 8 7; 5 6 9';
  function presets() {
    const t = s => tex(s);
    return [
      { group: 'Lecture L1.2 · Matrices', label: 'L1.2 · A 2 × 2 times a 2 × 3',
        source: lec('L1.2', '15:30') + ': ' + t('AB=\\begin{bmatrix}7&10&13\\\\15&22&29\\end{bmatrix}') + '. The lecture works out ' + t('7=1\\cdot1+2\\cdot3') + ', ' + t('22=3\\cdot2+4\\cdot4') + ' and ' + t('13=1\\cdot3+2\\cdot5') + ', and leaves 10, 15 and 29 to you: tap them in the AB panel.',
        st: { A: M('1 2; 3 4'), B: M('1 2 3; 3 4 5'), sel: { prod: [0, 2] } } },
      { label: 'L1.2 · A 2 × 2 times a column',
        source: lec('L1.2', '18:30') + ': ' + t('17=1\\cdot5+2\\cdot6') + ' and ' + t('39=3\\cdot5+4\\cdot6') + '. Then press <b>Swap A and B</b>: a 2 × 1 times a 2 × 2 is not defined (' + lec('L1.2', '28:00') + ').',
        st: { A: M('1 2; 3 4'), B: M('5; 6'), sel: { prod: [1, 0] } } },
      { label: 'L1.2 · A row times a 3 × 2, with decimals',
        source: lec('L1.2', '22:00') + ': ' + t('1\\cdot2+2\\cdot5+3\\cdot\\tfrac12=13.5') + ' and ' + t('1\\cdot0.8+2\\cdot0.7+3\\cdot(-2)=-3.8') + '. A 1 × 3 times a 3 × 2 is 1 × 2.',
        st: { A: M('1 2 3'), B: M('2 0.8; 5 0.7; 0.5 -2'), fmt: 'dec', sel: { prod: [0, 1] } } },
      { label: 'L1.2 · Adding two 1 × 3 matrices',
        source: lec('L1.2', '13:00') + ': ' + t('\\tfrac12+2=\\tfrac52') + ', ' + t('-\\tfrac34-3=-\\tfrac{15}{4}') + ' and ' + t('3-1=2') + '.',
        st: { A: M('1/2 -3/4 3'), B: M('2 -3 -1'), sel: { sum: [0, 1] } } },
      { label: 'L1.2 · 3 times a 2 × 3 matrix, and B = I',
        source: lec('L1.2', '14:00') + ': ' + t('3\\begin{bmatrix}1&2&3\\\\4&5&6\\end{bmatrix}=\\begin{bmatrix}3&6&9\\\\12&15&18\\end{bmatrix}') + '. B is the 3 × 3 identity, so AB = A: the identity acts like 1 (' + lec('L1.2', '26:00') + ').',
        st: { A: M('1 2 3; 4 5 6'), B: ID(3), c: '3' } },
      { label: 'L1.2 · The scalar matrix −3I times a 3 × 2',
        source: lec('L1.2', '24:00') + ': a scalar matrix ' + t('cI') + ' times a matrix multiplies every entry by ' + t('c') + '. The lecture keeps ' + t('c') + ' as a letter; here ' + t('c=-3') + ', its scalar matrix of ' + lec('L1.2', '7:30') + '. Every entry of AB is −3 times the entry of B.',
        st: { A: M('-3 0 0; 0 -3 0; 0 0 -3'), B: M('1 2; 3 4; 5 6'), sel: { prod: [0, 1] } } },

      { group: 'Lecture L1.4 · Determinants, part 1', label: 'L1.4 · det of a 2 × 2: 2',
        source: lec('L1.4', '3:00') + ': ' + t('2\\cdot10-3\\cdot6=20-18=2') + '. B is the identity.',
        st: { A: M('2 3; 6 10'), B: ID(2) } },
      { label: 'L1.4 · A 2 × 2 with fractions: −13/7',
        source: lec('L1.4', '3:30') + ': ' + t('5\\cdot\\tfrac37-\\tfrac23\\cdot6=\\tfrac{15}{7}-4=-\\tfrac{13}{7}') + '.',
        st: { A: M('5 2/3; 6 3/7'), B: ID(2) } },
      { label: 'L1.4 · A 3 × 3 along row 1: 70',
        source: lec('L1.4', '9:00') + ': ' + t('2\\cdot(72-42)-4\\cdot(27-35)+1\\cdot(18-40)=70') + '. B is the identity.',
        st: { A: M(L14), B: ID(3) } },
      { label: 'L1.4 · The identity I₃: 1',
        source: lec('L1.4', '12:00') + ': only the first term is not 0, ' + t('1\\cdot\\det I_2=1') + '. B is the 3 × 3 example, so AB = B.',
        st: { A: ID(3), B: M(L14) } },
      { label: 'L1.4 · Swap the two rows: det changes sign',
        source: lec('L1.4', '20:00') + ' shows it with letters: ' + t('\\det\\begin{bmatrix}c&d\\\\a&b\\end{bmatrix}=cb-da=-(ad-bc)') + '. Here on the first 2 × 2 example; see the last panel.',
        st: { A: M('2 3; 6 10'), B: ID(2), op: { kind: 'swap', on: 'row', i: 0, j: 1, k: '2' } } },
      { label: 'L1.4 · Add t × row 2 to row 1: det stays',
        source: lec('L1.4', '22:30') + ' with letters: ' + t('(a+tc)d-(b+td)c=ad-bc') + '. Here ' + t('t=2') + '; see the last panel.',
        st: { A: M('2 3; 6 10'), B: ID(2), op: { kind: 'add', on: 'row', i: 0, j: 1, k: '2' } } },
      { label: 'L1.4 · Add t × column 2 to column 1: det stays',
        source: lec('L1.4', '24:30') + ' with letters: ' + t('(a+tb)d-b(c+td)=ad-bc') + '. Here ' + t('t=2') + '; see the last panel.',
        st: { A: M('2 3; 6 10'), B: ID(2), op: { kind: 'add', on: 'col', i: 0, j: 1, k: '2' } } },
      { label: 'L1.4 · Multiply a row by t: det times t',
        source: lec('L1.4', '27:30') + ' with letters: ' + t('\\det\\begin{bmatrix}ta&tb\\\\c&d\\end{bmatrix}=t(ad-bc)') + '. Here ' + t('t=3') + ' on row 1; see the last panel.',
        st: { A: M('2 3; 6 10'), B: ID(2), op: { kind: 'scale', on: 'row', i: 0, j: 1, k: '3' } } },

      { group: 'Lecture L1.5 · Determinants, part 2', label: 'L1.5 · Upper triangular: 2 · 8 · 9 = 144',
        source: lec('L1.5', '2:30') + ': ' + t('2\\cdot72-4\\cdot0+3\\cdot0=144=2\\cdot8\\cdot9') + ', the product of the diagonal. Try column 1: only one term is left.',
        st: { A: M('2 4 3; 0 8 7; 0 0 9'), B: ID(3) } },
      { label: 'L1.5 · Transpose: det Aᵀ = det A, with B = Aᵀ',
        source: lec('L1.5', '6:00') + ': ' + t('(A^T)_{ij}=a_{ji}') + ', and ' + t('\\det A^T=\\det A') + ' (' + lec('L1.5', '9:00') + '). B is ' + t('A^T') + ', so ' + t('\\det(AB)=(\\det A)^2') + ' (' + lec('L2.1', '15:30') + ').',
        st: { A: M(L14), B: M('2 3 5; 4 8 6; 1 7 9'), sel: { tr: [0, 1] } } },

      { group: 'Lecture L2.1 · Determinants, part 3', label: 'L2.1 · The L1.4 matrix along row 2: still 70',
        source: lec('L2.1', '5:00') + ': you can expand along any row or column, and the answer does not change. Try every row and column.',
        st: { A: M(L14), B: ID(3), exp: { kind: 'row', idx: 1 } } },
      { label: 'L2.1 · The same matrix along column 2',
        source: lec('L2.1', '7:30') + ': along a column, ' + t('\\det A=\\sum_{i}(-1)^{i+2}a_{i2}M_{i2}') + '.',
        st: { A: M(L14), B: ID(3), exp: { kind: 'col', idx: 1 } } },
      { label: 'L2.1 · The whole matrix times 2: det(2A) = 2³ det A',
        source: lec('L2.1', '24:30') + ': multiplying an ' + t('n\\times n') + ' matrix by ' + t('t') + ' multiplies det by ' + t('t^n') + ', not by ' + t('t') + '. Here ' + t('c=2') + ' and ' + t('n=3') + ': ' + t('8\\cdot70=560') + ', in the cA panel.',
        st: { A: M(L14), B: ID(3), c: '2' } },

                                                                                              ];
  }

  /* ================================================================ the lab */
  const DEF = () => ({
    A: M(L14), B: ID(3), c: '2', fmt: 'auto',
    exp: { kind: 'row', idx: 0 },
    op: { kind: 'swap', on: 'row', i: 0, j: 1, k: '2' },
    sel: { sum: [0, 0], prod: [0, 0], tr: [0, 1] },
    loaded: { label: 'L1.4 · A 3 × 3 along row 1: 70' },
  });
  const okCells = x => Array.isArray(x) && x.length >= 1 && x.length <= MAX && x.every(r => Array.isArray(r) && r.length === x[0].length && r.length >= 1 && r.length <= MAX && r.every(s => typeof s === 'string'));
  const copy = x => x.map(r => r.slice());

  function matrixLab() {
    const st = Object.assign(DEF(), Lab.store.get(KEY, {}) || {});
    const d0 = DEF();
    if (!okCells(st.A)) st.A = d0.A;
    if (!okCells(st.B)) st.B = d0.B;
    if (typeof st.c !== 'string') st.c = d0.c;
    if (!st.exp || !/^(row|col)$/.test(st.exp.kind) || !(st.exp.idx >= 0)) st.exp = d0.exp;
    st.op = Object.assign(d0.op, st.op || {});
    if (!/^(swap|scale|add)$/.test(st.op.kind) || !/^(row|col)$/.test(st.op.on)) st.op = DEF().op;
    st.sel = Object.assign(d0.sel, st.sel || {});
    let root, items, opsBox, opsRes, opsSig = '', hist = [];
    const P = {}, ctl = {};
    const parseMat = cells => {
      const bad = [];
      const Mx = cells.map((r, i) => r.map((s, j) => { const p = parseEntry(s); if (p.err) { bad.push({ i, j, s, err: p.err }); return null; } return p.f; }));
      return { M: bad.length ? null : Mx, bad };
    };
    // the last valid values: a typo in one box never blanks the panels
    const G = { A: parseMat(d0.A).M, B: parseMat(d0.B).M, c: F(2), k: F(2) };
    let errs = { A: [], B: [], c: null };
    const save = () => Lab.store.set(KEY, { A: st.A, B: st.B, c: st.c, fmt: st.fmt, exp: st.exp, op: st.op, sel: st.sel, loaded: st.loaded });
    const title = (pn, html) => Lab.setHTML(pn.querySelector('.pl-panel-head h3'), html);
    function selOf(key, r, c) {
      let [i, j] = Array.isArray(st.sel[key]) ? st.sel[key] : [0, 0];
      i = Math.max(0, Math.min(r - 1, i | 0)); j = Math.max(0, Math.min(c - 1, j | 0));
      st.sel[key] = [i, j];
      return [i, j];
    }

    /* ---------------------------------------------------------------- controls */
    function touched() {
      if (!st.loaded) return;
      st.loaded = null;
      if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); }
    }
    function loadPreset(it) {
      const d = it.st;
      st.A = copy(d.A);
      st.B = copy(d.B || ID(d.A.length));
      if (d.c != null) st.c = d.c;
      st.fmt = d.fmt || 'auto';
      st.exp = Object.assign({ kind: 'row', idx: 0 }, d.exp || {});
      st.op = Object.assign(DEF().op, d.op || {});
      st.sel = Object.assign(DEF().sel, d.sel || {});
      st.loaded = { label: it.label };
      hist = [];
      opsSig = '';
      buildSide();
      draw();
      Lab.setHTML(ctl.pre.lastChild, 'From: ' + it.source);
    }
    const drawSoon = Lab.debounce(() => draw(), 160);
    function editor(name) {
      const wrap = h('div', { class: 'pl-field mx-ed' });
      const lab = h('div', { class: 'pl-label' });
      Lab.setHTML(lab, 'Type the entries of ' + tex(name) + ': whole numbers, fractions such as 3/4, or decimals such as 0.5');
      const mkSize = which => {
        const cur = which === 'r' ? st[name].length : st[name][0].length;
        const seg = Lab.seg([1, 2, 3, 4].map(v => ({ label: String(v), value: v })), cur, v => resize(name, which, v));
        seg.setAttribute('aria-label', (which === 'r' ? 'Rows' : 'Columns') + ' of ' + name);
        return h('div', { class: 'mx-size-f' }, h('span', { class: 'pl-label', text: which === 'r' ? 'Rows' : 'Columns' }), seg);
      };
      const grid = h('div', { class: 'mx-grid' });
      const msg = h('div', { class: 'pl-hint' });
      const tools = h('div', { class: 'pl-chips' },
        Lab.button('Identity', () => fill(name, 'id'), 'btn xs'),
        Lab.button('Random whole numbers', () => fill(name, 'rand'), 'btn xs'));
      wrap.append(lab, h('div', { class: 'mx-size' }, mkSize('r'), mkSize('c')), grid, msg, tools);
      const Mx = st[name];
      grid.style.gridTemplateColumns = 'repeat(' + Mx[0].length + ', minmax(0, 1fr))';
      Mx.forEach((row, i) => row.forEach((s, j) => {
        const inp = h('input', { class: 'field mono mx-in', type: 'text', value: s, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', enterkeyhint: 'next', 'aria-label': name + ', row ' + (i + 1) + ', column ' + (j + 1) });
        inp.addEventListener('input', () => { st[name][i][j] = inp.value; touched(); drawSoon(); });
        inp.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          const all = Lab.$$('.mx-in', grid), k = all.indexOf(inp);
          if (all[k + 1]) all[k + 1].focus(); else inp.blur();
        });
        grid.appendChild(inp);
      }));
      wrap.showErrors = bad => {
        const ins = Lab.$$('.mx-in', grid), c = st[name][0].length;
        ins.forEach(x => x.classList.remove('bad'));
        bad.forEach(b => { const el = ins[b.i * c + b.j]; if (el) el.classList.add('bad'); });
        const r = st[name].length;
        Lab.setHTML(msg, bad.length
          ? '<span class="cbad">' + bad.slice(0, 3).map(b => 'Row ' + (b.i + 1) + ', column ' + (b.j + 1) + ' ' + (b.err === 'empty' ? WHY.empty : '(“' + esc(b.s.trim()) + '”) ' + WHY[b.err])).join('; ') + '. The panels keep your last valid ' + name + '.</span>'
          : tex(name) + ' is ' + tex(r + '\\times ' + c) + ': ' + r + ' row' + (r > 1 ? 's' : '') + ' and ' + c + ' column' + (c > 1 ? 's' : '') + '.');
      };
      return wrap;
    }
    function rebuildEditor(name) {
      const key = name === 'A' ? 'edA' : 'edB', old = ctl[key];
      ctl[key] = editor(name);
      old.replaceWith(ctl[key]);
    }
    function resize(name, which, v) {
      const Mx = st[name];
      if (which === 'r') { while (Mx.length < v) Mx.push(Mx[0].map(() => '0')); Mx.length = v; }
      else Mx.forEach(r => { while (r.length < v) r.push('0'); r.length = v; });
      touched();
      rebuildEditor(name);
      draw();
    }
    function fill(name, kind) {
      const r = st[name].length, c = st[name][0].length;
      st[name] = kind === 'id' ? ID(r) : Array.from({ length: r }, () => Array.from({ length: c }, () => String(Math.floor(Math.random() * 11) - 5)));
      touched();
      rebuildEditor(name);
      draw();
    }
    function buildSide() {
      const box = ctl.dyn;
      Lab.clear(box);
      box.appendChild(K.group('1 · Matrix A'));
      ctl.edA = editor('A');
      box.appendChild(ctl.edA);
      box.appendChild(K.group('2 · Matrix B'));
      ctl.edB = editor('B');
      box.appendChild(ctl.edB);
      box.appendChild(h('div', { class: 'pl-chips' },
        Lab.button('Swap A and B', () => { const t = st.A; st.A = st.B; st.B = t; touched(); rebuildEditor('A'); rebuildEditor('B'); draw(); }, 'btn xs'),
        Lab.button('Copy A into B', () => { st.B = copy(st.A); touched(); rebuildEditor('B'); draw(); }, 'btn xs')));
      box.appendChild(K.group('3 · Scalar c'));
      ctl.c = K.textField({ label: 'Your number ' + tex('c') + ' for ' + tex('cA') + ' (3, −2, 1/2 or 0.5)', value: st.c, onChange: v => { st.c = v; touched(); draw(); } });
      ['autocapitalize', 'autocorrect'].forEach(a => ctl.c.input.setAttribute(a, 'off'));
      box.appendChild(ctl.c);
      box.appendChild(K.group('4 · How numbers are written'));
      ctl.fmt = h('div', { class: 'pl-field' });
      box.appendChild(ctl.fmt);
    }
    function fmtControls() {
      Lab.clear(ctl.fmt);
      const seg = Lab.seg([{ label: 'Fractions', value: 'frac' }, { label: 'Decimals', value: 'dec' }], DEC ? 'dec' : 'frac', v => { st.fmt = v; draw(); });
      ctl.fmt.append(seg, K.note('Fractions are exact. A decimal is used only when it ends, such as 0.5 or 13.5; other numbers stay fractions.', 'pl-hint'));
    }

    /* ---------------------------------------------------------------- draw */
    function draw() {
      save();
      const pa = parseMat(st.A), pb = parseMat(st.B), pc = parseEntry(st.c);
      if (pa.M) G.A = pa.M;
      if (pb.M) G.B = pb.M;
      if (!pc.err) G.c = pc.f;
      errs = { A: pa.bad, B: pb.bad, c: pc.err || null };
      ctl.edA.showErrors(pa.bad);
      ctl.edB.showErrors(pb.bad);
      ctl.c.input.classList.toggle('bad', !!pc.err);
      ctl.c.hint(pc.err ? '<span class="cbad">' + tex('c') + ' ' + WHY[pc.err] + '. Type a number such as 3, −2, 1/2 or 0.5.</span>' : 'Your scalar is ' + tex('c=' + (pc.f.d === 1 ? String(pc.f.n) : pc.f.n + '/' + pc.f.d)) + '.');
      const typed = st.A.flat().concat(st.B.flat(), [st.c]);
      DEC = st.fmt === 'dec' || (st.fmt === 'auto' && typed.some(s => /\d\.\d|^\s*-?\.\d/.test(s)));
      INEXACT = false;
      fmtControls();
      drawSum();
      drawScale();
      drawProd();
      drawT();
      drawDet();
      drawOps();
      drawAnswer();
    }
    function problems() {
      const p = [];
      if (errs.A.length) p.push('some entries of ' + tex('A'));
      if (errs.B.length) p.push('some entries of ' + tex('B'));
      if (errs.c) p.push(tex('c'));
      return p.length ? 'Fix ' + p.join(' and ') + ' (red boxes). The panels show your last valid values.' : '';
    }

    function drawAnswer() {
      const { A, B, c } = G;
      const ev = [];
      const ki = st.loaded ? itemIndex(st.loaded.label) : -1;
      if (ki >= 0) ev.push('Example: <b>' + esc(items[ki].label) + '</b> — ' + items[ki].source);
      ev.push('Your ' + tex('A') + ' is ' + sz(A) + ', ' + tex('B') + ' is ' + sz(B) + ', and ' + tex('c=' + nt(c)) + '.');
      const pr = problems();
      if (pr) ev.push('<span class="cbad">' + pr + '</span>');
      let big, sub;
      if (isSq(A)) {
        const L = st.exp, d = det(A);
        big = '\\det A=' + nt(d);
        sub = A.length === 1 ? 'A 1 × 1 matrix: its determinant is its only entry.' : 'Worked out in the panel ' + tex('\\det A') + ' by expanding along <b>' + lineName(L) + '</b>.';
      } else {
        big = '\\det A\\ \\text{needs a square matrix}';
        sub = tex('A') + ' is ' + sz(A) + ', and only a square matrix has a determinant.';
      }
      K.setAnswer(P.answer, { ev: ev.join(' '), big, sub: sub + ' Tap a result below to see how it is worked out.' });
      const strip = h('div', { class: 'mx-strip' });
      const card = (name, body, why, pnl) => tapBox('mx-res', [h('span', { class: 'mx-res-t', html: tex(name) }), body ? h('span', { class: 'mx-res-m', html: tex(body) }) : h('span', { class: 'mx-res-no', html: why })],
        () => pnl.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }));
      strip.append(
        card('A+B', sameSize(A, B) ? bm(matAdd(A, B)) : null, 'Not defined: ' + sz(A) + ' and ' + sz(B), P.sum),
        card('cA', bm(matScale(c, A)), '', P.scale),
        card('AB', A[0].length === B.length ? bm(matMul(A, B)) : null, 'Not defined: ' + A[0].length + ' column' + (A[0].length > 1 ? 's' : '') + ' in ' + tex('A') + ', ' + B.length + ' row' + (B.length > 1 ? 's' : '') + ' in ' + tex('B'), P.prod),
        card('A^{T}', bm(tr(A)), '', P.tr));
      P.answer.appendChild(strip);
      if (INEXACT) P.answer.appendChild(note('<span class="cbad">Some numbers grew beyond 15 digits, too big for exact arithmetic; they are shown rounded. Use smaller entries.</span>', 'warn'));
    }

    /* A + B */
    function drawSum() {
      const { A, B } = G, pn = P.sum, body = pn.body;
      Lab.clear(body);
      title(pn, 'Add: ' + tex('A+B') + ', entry by entry');
      pn.sub('From ' + lec('L1.2', '11:00') + ': two matrices of the same size are added by adding the entries in the same place, ' + tex('(A+B)_{ij}=a_{ij}+b_{ij}') + '.');
      const m = A.length, n = A[0].length;
      if (!sameSize(A, B)) {
        const why = [];
        if (m !== B.length) why.push(tex('A') + ' has ' + m + ' row' + (m > 1 ? 's' : '') + ' and ' + tex('B') + ' has ' + B.length);
        if (n !== B[0].length) why.push(tex('A') + ' has ' + n + ' column' + (n > 1 ? 's' : '') + ' and ' + tex('B') + ' has ' + B[0].length);
        body.appendChild(stepList([{ html: tex('A') + ' is ' + sz(A) + ' and ' + tex('B') + ' is ' + sz(B) + ': ' + why.join(', and ') + '. Some entries have no partner, so <b>' + tex('A+B') + ' is not defined</b>. Give ' + tex('B') + ' the size of ' + tex('A') + ' to add them.',
          block: eqRow([mxView(A, { name: 'A', foot: sz(A) }), sym('+'), mxView(B, { name: 'B', foot: sz(B) })]) }]));
        return;
      }
      const S = matAdd(A, B), [i, j] = selOf('sum', m, n);
      const at = (a, b) => (a === i && b === j ? 'lit' : '');
      const pic = eqRow([mxView(A, { name: 'A', cls: at }), sym('+'), mxView(B, { name: 'B', cls: at }), sym('='),
        mxView(S, { name: 'A+B', cls: (a, b) => (a === i && b === j ? 'hot' : ''), label: 'entry of A + B', tap: (a, b) => { st.sel.sum = [a, b]; save(); drawSum(); } })]);
      const read = readEl(chain('(A+B)_{' + ij(i, j) + '}', ['a_{' + ij(i, j) + '}+b_{' + ij(i, j) + '}', nt(A[i][j]) + '+' + pt(B[i][j]), hl(nt(S[i][j]))]));
      body.appendChild(stepList([
        { html: 'Same size: both are ' + sz(A) + ' ✓, so ' + tex('A+B') + ' is ' + sz(A) + ' too. Tap any entry of ' + tex('A+B') + ' to see where it comes from:', block: h('div', { class: 'mx-work' }, pic, read) },
        { html: 'All ' + m * n + ' entr' + (m * n > 1 ? 'ies' : 'y') + ' at once:', math: chain('A+B', [bm(A, (v, a, b) => nt(v) + '+' + pt(B[a][b])), bm(S)]) },
      ]));
    }

    /* cA */
    function drawScale() {
      const { A, c } = G, pn = P.scale, body = pn.body;
      Lab.clear(body);
      title(pn, 'Scale: ' + tex('cA') + ', every entry times ' + tex('c'));
      pn.sub('From ' + lec('L1.2', '14:00') + ': to multiply a matrix by a number, multiply each entry by that number, ' + tex('(cA)_{ij}=c\\,a_{ij}') + '.');
      const m = A.length, n = A[0].length, C = matScale(c, A), [i, j] = selOf('scale', m, n);
      const pic = eqRow([h('span', { class: 'mx-sym', html: tex(pt(c)) }), sym('\\cdot'), mxView(A, { name: 'A', cls: (a, b) => (a === i && b === j ? 'lit' : '') }), sym('='),
        mxView(C, { name: 'cA', cls: (a, b) => (a === i && b === j ? 'hot' : ''), label: 'entry of cA', tap: (a, b) => { st.sel.scale = [a, b]; save(); drawScale(); } })]);
      const read = readEl(chain('(cA)_{' + ij(i, j) + '}', ['c\\cdot a_{' + ij(i, j) + '}', pt(c) + '\\cdot ' + pt(A[i][j]), hl(nt(C[i][j]))]));
      const steps = [
        { html: 'Your ' + tex('c=' + nt(c)) + ' multiplies all ' + m * n + ' entr' + (m * n > 1 ? 'ies' : 'y') + ' of ' + tex('A') + ' (' + sz(A) + '), so ' + tex('cA') + ' is ' + sz(A) + ' too. Tap an entry of ' + tex('cA') + ':', block: h('div', { class: 'mx-work' }, pic, read) },
        { html: 'All entries at once, as in the lecture:', math: chain('cA', [pt(c) + bm(A), bm(A, v => pt(c) + '\\cdot ' + pt(v)), bm(C)]) },
      ];
      if (isSq(A)) {
        const dA = det(A), cn = pow(c, n), dC = det(C);
        steps.push({ html: tex('A') + ' is square (' + tex('n=' + n) + '), so it has a determinant. Every one of its ' + n + ' rows is multiplied by ' + tex('c') + ', and each row gives one factor ' + tex('c') + ' (' + lec('L2.1', '24:30') + '): ' + tex('\\det(cA)=c^{n}\\det A') + ', not ' + tex('c\\det A') + '. With ' + tex('\\det A=' + nt(dA)) + ' from the panel ' + tex('\\det A') + ' below:',
          math: chain('\\det(cA)', ['c^{' + n + '}\\det A', powT(c, n) + '\\cdot ' + pt(dA), pt(cn) + '\\cdot ' + pt(dA), nt(mul(cn, dA))]),
          block: more('Check: work out ' + tex('\\det(cA)') + ' directly', [workOut(C, '\\det(cA)'), K.note(dC.eq(mul(cn, dA)) ? 'The same number ✓' : 'Different!', 'small muted')]) });
      }
      body.appendChild(stepList(steps));
    }

    /* AB */
    function drawProd() {
      const { A, B } = G, pn = P.prod, body = pn.body;
      Lab.clear(body);
      title(pn, 'Multiply: ' + tex('AB') + ', a row times a column');
      pn.sub('From ' + lec('L1.2', '15:30') + ': entry ' + tex('(i,j)') + ' of ' + tex('AB') + ' takes row ' + tex('i') + ' of ' + tex('A') + ' and column ' + tex('j') + ' of ' + tex('B') + ', multiplies the matching entries and adds them: ' + tex('(AB)_{ij}=\\sum_k a_{ik}b_{kj}') + '.');
      const m = A.length, n = A[0].length, n2 = B.length, p = B[0].length;
      const sizeT = '(' + m + '\\times ' + hl(String(n)) + ')\\,(' + hl(String(n2)) + '\\times ' + p + ')';
      if (n !== n2) {
        const ba = p === m;
        body.appendChild(stepList([{ html: tex('A') + ' is ' + sz(A) + ' and ' + tex('B') + ' is ' + sz(B) + ': a row of ' + tex('A') + ' has ' + n + ' entr' + (n > 1 ? 'ies' : 'y') + ' but a column of ' + tex('B') + ' has ' + n2 + ', so they cannot be paired. <b>' + tex('AB') + ' is not defined</b>: the number of columns of ' + tex('A') + ' must equal the number of rows of ' + tex('B') + ' (' + lec('L1.2', '20:00') + ').' + (ba ? ' The other order works: ' + tex('BA') + ' is ' + tex('(' + n2 + '\\times ' + p + ')(' + m + '\\times ' + n + ')') + ', so press <b>Swap A and B</b>.' : ''),
          math: sizeT, block: eqRow([mxView(A, { name: 'A', foot: sz(A) }), sym('\\cdot'), mxView(B, { name: 'B', foot: sz(B) })]) }]));
        return;
      }
      const Pm = matMul(A, B), [i, j] = selOf('prod', m, p);
      const go = k => { const tot = m * p; k = (k + tot) % tot; st.sel.prod = [Math.floor(k / p), k % p]; save(); drawProd(); };
      const at = i * p + j;
      const prods = A[i].map((v, k) => mul(v, B[k][j]));
      const rhs = [A[i].map((_, k) => 'a_{' + ij(i, k) + '}b_{' + ij(k, j) + '}').join('+'), A[i].map((v, k) => pt(v) + '\\cdot ' + pt(B[k][j])).join('+')];
      if (n > 1) rhs.push(sumTex(prods));
      rhs.push(hl(nt(Pm[i][j])));
      const steps = [
        { html: 'Sizes: ' + tex('A') + ' is ' + sz(A) + ' and ' + tex('B') + ' is ' + sz(B) + '. The inner numbers match (' + n + ' columns of ' + tex('A') + ', ' + n2 + ' rows of ' + tex('B') + '), so ' + tex('AB') + ' is defined, and its size is the outer numbers, ' + tex(m + '\\times ' + p) + ' (' + lec('L1.2', '21:00') + '):', math: sizeT + '\\ \\to\\ ' + m + '\\times ' + p },
        { html: 'Row ' + (i + 1) + ' of ' + tex('A') + ' meets column ' + (j + 1) + ' of ' + tex('B') + ' at entry ' + tex('(' + (i + 1) + ',' + (j + 1) + ')') + ' of ' + tex('AB') + '. Tap any entry of ' + tex('AB') + ', or step through them:',
          block: h('div', { class: 'mx-work' },
            h('div', { class: 'mx-scroll' }, falk(A, B, Pm, [i, j], (a, b) => { st.sel.prod = [a, b]; save(); drawProd(); })),
            K.note(tex('A') + ' on the left, ' + tex('B') + ' on top, ' + tex('AB') + ' where they meet.', 'pl-hint'),
            h('div', { class: 'mx-row' }, Lab.button('‹ Previous', () => go(at - 1), 'btn sm'), Lab.button('Next ›', () => go(at + 1), 'btn sm'), h('span', { class: 'small muted', text: 'Entry ' + (at + 1) + ' of ' + m * p })),
            readEl(chain('(AB)_{' + ij(i, j) + '}', rhs))) },
      ];
      const lines = h('div', { class: 'mx-lines' });
      for (let a = 0; a < m; a++) {
        for (let b = 0; b < p; b++) {
          const pr = A[a].map((v, k) => mul(v, B[k][b]));
          const src = '(AB)_{' + ij(a, b) + '}=' + A[a].map((v, k) => pt(v) + '\\cdot ' + pt(B[k][b])).join('+') + (n > 1 ? '=' + sumTex(pr) : '') + '=' + nt(Pm[a][b]);
          lines.appendChild(tapBox('mx-line' + (a === i && b === j ? ' on' : ''), [h('span', { html: tex(src) })], () => { st.sel.prod = [a, b]; save(); drawProd(); }, 'entry ' + (a + 1) + ', ' + (b + 1) + ' of AB'));
        }
      }
      steps.push({ html: 'Every entry, row by row (tap one to light it up):', block: lines });
      steps.push({ html: 'So', math: 'AB=' + bm(Pm) });
      if (m === n && n === p) {
        const dA = det(A), dB = det(B), dP = det(Pm), pr = mul(dA, dB);
        steps.push({ html: 'Both are square and the same size, so the product rule holds (' + lec('L1.4', '18:00') + ', ' + lec('L2.1', '10:00') + '): ' + tex('\\det(AB)=\\det A\\cdot\\det B') + '. With ' + tex('\\det A=' + nt(dA)) + ' and ' + tex('\\det B=' + nt(dB)) + ':',
          math: chain('\\det(AB)', ['\\det A\\cdot\\det B', pt(dA) + '\\cdot ' + pt(dB), nt(pr) + (dP.eq(pr) ? '\\ \\checkmark' : '')]),
          block: more('Work out ' + tex('\\det A') + ', ' + tex('\\det B') + ' and ' + tex('\\det(AB)') + ' directly', [workOut(A, '\\det A'), workOut(B, '\\det B'), workOut(Pm, '\\det(AB)')]) });
      }
      body.appendChild(stepList(steps));
    }

    /* Aᵀ */
    function drawT() {
      const A = G.A, At = tr(A), pn = P.tr, body = pn.body;
      Lab.clear(body);
      title(pn, 'Transpose: ' + tex('A^{T}') + ', rows become columns');
      pn.sub('From ' + lec('L1.5', '6:00') + ': ' + tex('(A^{T})_{ij}=a_{ji}') + '. Row ' + tex('k') + ' of ' + tex('A') + ' is column ' + tex('k') + ' of ' + tex('A^{T}') + ': the matrix is reflected in its diagonal.');
      const m = A.length, n = A[0].length, [i, j] = selOf('tr', n, m);
      const pic = eqRow([mxView(A, { name: 'A', foot: sz(A), cls: (a, b) => (a === j && b === i ? 'hot' : a === j ? 'lit' : '') }), sym('\\longrightarrow'),
        mxView(At, { name: 'A^{T}', foot: sz(At), label: 'entry of A transpose', cls: (a, b) => (a === i && b === j ? 'hot' : b === j ? 'lit' : ''), tap: (a, b) => { st.sel.tr = [a, b]; save(); drawT(); } })]);
      const steps = [
        { html: tex('A') + ' is ' + sz(A) + ', so ' + tex('A^{T}') + ' is ' + sz(At) + '. Tap an entry of ' + tex('A^{T}') + ': its row ' + (j + 1) + ' of ' + tex('A') + ' is lit, and it becomes column ' + (j + 1) + ':',
          block: h('div', { class: 'mx-work' }, pic, readEl(chain('(A^{T})_{' + ij(i, j) + '}', ['a_{' + ij(j, i) + '}', hl(nt(At[i][j]))]))) },
        { html: 'The whole transpose:', math: 'A^{T}=' + bm(At) },
      ];
      if (isSq(A)) {
        const go = h('div', { class: 'mx-row' }, Lab.button('Expand ' + tex('A') + ' along column 1', () => { st.exp = { kind: 'col', idx: 0 }; save(); drawDet(); drawAnswer(); P.det.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }); }, 'btn sm'));
        steps.push({ html: 'For a square matrix, ' + tex('\\det A^{T}=\\det A') + ' (' + lec('L1.5', '9:00') + '): expanding ' + tex('A^{T}') + ' along row ' + tex('k') + ' uses the same entries and minors as expanding ' + tex('A') + ' along column ' + tex('k') + ' (' + lec('L2.1', '14:00') + ').', math: chain('\\det A^{T}', ['\\det A', nt(det(A))]), block: go });
      }
      body.appendChild(stepList(steps));
    }

    /* det A */
    function chooser(A) {
      const n = A.length, L = st.exp;
      const wrap = h('div', { class: 'mx-pick' });
      ['row', 'col'].forEach(kind => {
        const row = h('div', { class: 'mx-pick-row' }, h('span', { class: 'mx-pick-lab', text: kind === 'row' ? 'Row' : 'Column' }));
        for (let k = 0; k < n; k++) {
          const on = L.kind === kind && L.idx === k;
          const b = h('button', { type: 'button', class: 'mx-chip' + (on ? ' on' : ''), text: String(k + 1), 'aria-pressed': String(on), 'aria-label': 'Expand along ' + (kind === 'row' ? 'row ' : 'column ') + (k + 1) });
          b.addEventListener('click', () => { st.exp = { kind, idx: k }; save(); drawDet(); drawAnswer(); });
          row.appendChild(b);
        }
        wrap.appendChild(row);
      });
      const best = bestLine(A), z = zerosIn(A, best);
      wrap.appendChild(K.note(z ? 'Fewest terms: <b>' + lineName(best) + '</b> has ' + z + ' zero' + (z > 1 ? 's' : '') + ', and a zero entry makes its whole term 0 (' + lec('L2.1', '27:00') + ').' : 'No row or column has a zero, so every choice has ' + n + ' terms to work out.', 'pl-hint'));
      return wrap;
    }
    function termCard(A, t, k, n) {
      const s = ij(t.i, t.j), sgnE = '(-1)^{' + (t.i + 1) + '+' + (t.j + 1) + '}';
      const card = h('div', { class: 'mx-term' + (t.a.isZero() ? ' zero' : '') });
      const head = h('div', { class: 'mx-term-h' });
      Lab.setHTML(head, 'Term ' + (k + 1) + ' of ' + n + ': ' + tex('a_{' + s + '}=' + hl(nt(t.a))) + ' (row ' + (t.i + 1) + ', column ' + (t.j + 1) + '), sign ' + tex(sgnE + '=' + (t.sign < 0 ? '-1' : '+1')));
      card.appendChild(head);
      if (t.a.isZero()) {
        card.appendChild(K.note('The entry is 0, so this term is ' + tex(sgnE + '\\cdot 0\\cdot M_{' + s + '}=0') + ' whatever the minor is: no need to work out ' + tex('M_{' + s + '}') + '.', ''));
        return card;
      }
      card.appendChild(h('div', { class: 'mx-term-pics' },
        mxView(A, { name: 'A', small: true, strike: [t.i, t.j], cls: (a, b) => (a === t.i && b === t.j ? 'key' : a === t.i || b === t.j ? 'dim' : '') }),
        sym('\\to'),
        mxView(t.minor, { name: '\\text{left over}', small: true })));
      const w = detWork(t.minor);
      card.appendChild(mathEl(chain('M_{' + s + '}', ['\\det' + bm(t.minor)].concat(w.rhs), t.minor.length === 3)));
      card.appendChild(mathEl(chain(sgnE + 'a_{' + s + '}M_{' + s + '}', [(t.sign < 0 ? '(-1)' : '(+1)') + '\\cdot ' + pt(t.a) + '\\cdot ' + pt(t.m), hl(nt(t.val))])));
      card.appendChild(K.note('The cofactor ' + tex('C_{' + s + '}=' + sgnE + 'M_{' + s + '}=' + nt(t.cof)) + ' carries the sign, so the term is also ' + tex('a_{' + s + '}C_{' + s + '}=' + pt(t.a) + '\\cdot ' + pt(t.cof) + '=' + nt(t.val)) + ' (' + lec('L1.5', '11:30') + ').', 'pl-hint'));
      return card;
    }
    /** Things worth noticing about A: a zero line, equal or proportional lines, a triangular shape. */
    function facts(A) {
      const n = A.length, out = [];
      const lines = allLines(n);
      const zero = lines.find(L => lineOf(A, L).every(v => v.isZero()));
      if (zero) out.push('<b>' + lineName(zero)[0].toUpperCase() + lineName(zero).slice(1) + ' is all zeros</b>: expanding along it, every term is 0, so ' + tex('\\det A=0') + ' (' + lec('L2.1', '25:30') + ').');
      if (!zero) {
        for (const kind of ['row', 'col']) {
          let found = null;
          for (let a = 0; a < n && !found; a++) {
            for (let b = 0; b < n && !found; b++) {
              if (a === b) continue;
              const u = lineOf(A, { kind, idx: a }), v = lineOf(A, { kind, idx: b });
              const q = v.findIndex(x => !x.isZero());
              if (q < 0) continue;
              const r = u[q].div(v[q]);
              if (u.every((x, k) => x.eq(mul(r, v[k])))) found = { a, b, r };
            }
          }
          if (found) {
            const nm = kind === 'row' ? 'row' : 'column', Ls = kind === 'row' ? 'R' : 'C';
            out.push(found.r.eq(1)
              ? '<b>' + nm[0].toUpperCase() + nm.slice(1) + 's ' + (Math.min(found.a, found.b) + 1) + ' and ' + (Math.max(found.a, found.b) + 1) + ' are equal</b>, so ' + tex('\\det A=0') + ' (' + lec('L2.1', '20:00') + ').'
              : '<b>' + nm[0].toUpperCase() + nm.slice(1) + ' ' + (found.a + 1) + ' is ' + tex(nt(found.r)) + ' × ' + nm + ' ' + (found.b + 1) + '</b>: the operation ' + tex(Ls + '_{' + (found.a + 1) + '}\\to ' + Ls + '_{' + (found.a + 1) + '}' + (isNeg(found.r) ? '+' + nt(neg(found.r)) : '-' + nt(found.r)) + Ls + '_{' + (found.b + 1) + '}') + ' does not change det and makes a zero ' + nm + ', so ' + tex('\\det A=0') + ' (' + lec('L2.1', '26:00') + ').');
            break;
          }
        }
      }
      const up = A.every((r, i) => r.every((v, j) => j >= i || v.isZero()));
      const low = A.every((r, i) => r.every((v, j) => j <= i || v.isZero()));
      if (n > 1 && (up || low)) {
        const dg = A.map((r, i) => r[i]);
        out.push('<b>' + tex('A') + ' is ' + (up && low ? 'diagonal' : up ? 'upper triangular' : 'lower triangular') + '</b> (only zeros ' + (up && low ? 'off the diagonal' : up ? 'below the diagonal' : 'above the diagonal') + '), so ' + tex('\\det A') + ' is the product of the diagonal entries (' + lec('L1.5', '4:00') + '): ' + tex('\\det A=' + dg.map(pt).join('\\cdot ') + '=' + nt(dg.reduce((s, v) => mul(s, v), F(1)))) + '.');
      }
      return out;
    }
    function drawDet() {
      const A = G.A, pn = P.det, body = pn.body;
      Lab.clear(body);
      title(pn, 'The determinant ' + tex('\\det A') + ', expanded along a row or column');
      if (!isSq(A)) {
        pn.sub('Only a square matrix has a determinant (' + lec('L1.4', '1:00') + ').');
        body.appendChild(note(tex('A') + ' is ' + sz(A) + ': ' + A.length + ' row' + (A.length > 1 ? 's' : '') + ' but ' + A[0].length + ' column' + (A[0].length > 1 ? 's' : '') + '. Give ' + tex('A') + ' as many rows as columns (under <b>1 · Matrix A</b>) to see its determinant.'));
        return;
      }
      const n = A.length;
      if (!(st.exp.idx < n)) st.exp = { kind: st.exp.kind, idx: 0 };
      const L = st.exp, isRow = L.kind === 'row', f = L.idx + 1;
      pn.sub('From ' + lec('L1.5', '9:30') + ' and ' + lec('L2.1', '3:00') + ': pick any row or column. Each of its entries is multiplied by its <b>minor</b> ' + tex('M_{ij}') + ', the determinant of what is left after deleting row ' + tex('i') + ' and column ' + tex('j') + ', with the sign ' + tex('(-1)^{i+j}') + '.');
      if (n === 1) {
        body.appendChild(stepList([{ html: 'A 1 × 1 matrix is a single number, and its determinant is that number (' + lec('L1.4', '2:00') + '):', math: chain('\\det A', ['\\det\\begin{bmatrix}' + nt(A[0][0]) + '\\end{bmatrix}', hl(nt(A[0][0]))]) }]));
        return;
      }
      body.appendChild(chooser(A));
      const ex = expand(A, L), run = isRow ? 'j' : 'i', sub2 = isRow ? f + 'j' : 'i' + f;
      const sg = (t, k) => (k === 0 ? (t.sign < 0 ? '-' : '') : t.sign < 0 ? '-' : '+');
      const symT = ex.terms.map((t, k) => sg(t, k) + 'a_{' + ij(t.i, t.j) + '}M_{' + ij(t.i, t.j) + '}').join('');
      const numT = ex.terms.map((t, k) => sg(t, k) + hl(pt(t.a)) + '\\cdot ' + (t.a.isZero() ? 'M_{' + ij(t.i, t.j) + '}' : pt(t.m))).join('');
      const steps = [
        { html: 'You expand along <b>' + lineName(L) + '</b> (tap another row or column above). The rule, with ' + (isRow ? tex('i=' + f) : tex('j=' + f)) + ':',
          math: chain('\\det A', ['\\sum_{' + run + '=1}^{' + n + '}(-1)^{' + (isRow ? f + '+j' : 'i+' + f) + '}\\,a_{' + sub2 + '}M_{' + sub2 + '}', symT]) },
        { html: 'The signs ' + tex('(-1)^{i+j}') + ' make a checkerboard that starts with + in the top-left corner. Your ' + (isRow ? 'row' : 'column') + ' is lit:', block: signChart(n, L) },
        { html: 'Each term on its own. The struck-out row and column are deleted; the entries left over form the minor, a ' + tex((n - 1) + '\\times ' + (n - 1)) + ' matrix' + (n === 2 ? ' (a single number)' : '') + ':', block: h('div', { class: 'mx-terms' }, ex.terms.map((t, k) => termCard(A, t, k, n))) },
        { html: 'Add the ' + n + ' terms:', math: chain('\\det A', [symT, numT, sumTex(ex.terms.map(t => t.val)), hl(nt(ex.val))], true) },
      ];
      const fs = facts(A);
      if (fs.length) steps.push({ html: 'Worth noticing:', block: h('div', { class: 'mx-notes' }, fs.map(x => note(x, 'good'))) });
      const chips = h('div', { class: 'mx-row' });
      allLines(n).forEach(L2 => {
        const v = L2.kind === L.kind && L2.idx === L.idx ? ex.val : expand(A, L2).val;
        const on = L2.kind === L.kind && L2.idx === L.idx;
        const b = h('button', { type: 'button', class: 'mx-chip wide' + (on ? ' on' : ''), html: (L2.kind === 'row' ? 'Row ' : 'Col ') + (L2.idx + 1) + ': ' + tex(nt(v)) });
        b.addEventListener('click', () => { st.exp = L2; save(); drawDet(); drawAnswer(); });
        chips.appendChild(b);
      });
      steps.push({ html: 'Any row or column gives the same determinant (' + lec('L2.1', '9:00') + '). Each button below is a full expansion along that line; tap one to see it worked out:', block: chips });
      body.appendChild(stepList(steps));
    }
    /** det M worked out in full: along row 1 for n ≤ 3, along the line with the most zeros for a 4 × 4. */
    function workOut(Mx, name) {
      const box = h('div', { class: 'mx-work' }), n = Mx.length;
      if (n <= 3) {
        box.appendChild(mathEl(chain(name, (n > 1 ? ['\\det' + bm(Mx)] : []).concat(detWork(Mx).rhs), n === 3)));
        return box;
      }
      const L = bestLine(Mx), ex = expand(Mx, L);
      box.appendChild(K.note('Expand along ' + lineName(L) + ', the line with the most zeros. First the minors that are needed:', 'small muted'));
      ex.terms.forEach(t => {
        if (t.a.isZero()) return;
        box.appendChild(mathEl(chain('M_{' + ij(t.i, t.j) + '}', ['\\det' + bm(t.minor)].concat(detWork(t.minor).rhs), true)));
      });
      const sg = (t, k) => (k === 0 ? (t.sign < 0 ? '-' : '') : t.sign < 0 ? '-' : '+');
      box.appendChild(mathEl(chain(name, [ex.terms.map((t, k) => sg(t, k) + pt(t.a) + '\\cdot ' + (t.a.isZero() ? 'M_{' + ij(t.i, t.j) + '}' : pt(t.m))).join(''), sumTex(ex.terms.map(t => t.val)), nt(ex.val)], true)));
      return box;
    }

    /* row and column operations */
    function opTex(op, k) {
      const Ls = op.on === 'row' ? 'R' : 'C', a = Ls + '_{' + (op.i + 1) + '}', b = Ls + '_{' + (op.j + 1) + '}';
      const coef = x => (x.eq(1) ? '' : x.eq(-1) ? '-' : nt(x));
      if (op.kind === 'swap') return a + '\\leftrightarrow ' + b;
      if (op.kind === 'scale') return a + '\\to ' + coef(k) + a;
      return a + '\\to ' + a + (isNeg(k) ? '-' + coef(neg(k)) : '+' + coef(k)) + b;
    }
    function fixOp(n) {
      const op = st.op;
      op.i = Math.max(0, Math.min(n - 1, op.i | 0));
      op.j = Math.max(0, Math.min(n - 1, op.j | 0));
      if (op.kind !== 'scale' && op.i === op.j) op.j = op.i === 0 ? 1 : 0;
    }
    function drawOps() {
      const A = G.A, pn = P.ops, body = pn.body, op = st.op;
      const word = op.on === 'row' ? 'row' : 'column';
      title(pn, (op.on === 'row' ? 'Row' : 'Column') + ' operations: what happens to ' + tex('\\det A'));
      pn.sub('From ' + lec('L1.4', '20:00') + ' and ' + lec('L2.1', '16:00') + ': swapping two ' + word + 's changes the sign of det, multiplying a ' + word + ' by ' + tex('k') + ' multiplies det by ' + tex('k') + ', and adding ' + tex('k') + ' times one ' + word + ' to another leaves det unchanged.');
      const n = A.length;
      if (!isSq(A)) {
        Lab.clear(body); opsSig = '';
        body.appendChild(note(tex('A') + ' is ' + sz(A) + ', so it has no determinant. Make ' + tex('A') + ' square to try the operations.'));
        return;
      }
      if (n === 1 && op.kind !== 'scale') op.kind = 'scale';
      fixOp(n);
      const sig = [n, op.kind, op.on, op.i, op.j].join('|');
      if (sig !== opsSig) {
        opsSig = sig;
        Lab.clear(body);
        opsBox = opsControls(n);
        opsRes = h('div', { class: 'mx-work' });
        body.append(opsBox, opsRes);
      }
      drawOpsResult();
    }
    function opsControls(n) {
      const op = st.op, word = op.on === 'row' ? 'row' : 'column', Word = op.on === 'row' ? 'Row' : 'Column';
      const box = h('div', { class: 'mx-opctl' });
      const field = (label, el) => { const f = h('div', { class: 'mx-f' }, h('div', { class: 'pl-label', html: label }), el); return f; };
      const kinds = [{ label: 'Swap two ' + word + 's', value: 'swap' }, { label: 'Multiply a ' + word + ' by ' + tex('k'), value: 'scale' }, { label: 'Add ' + tex('k') + ' × a ' + word, value: 'add' }];
      box.appendChild(field('Operation', Lab.seg(n === 1 ? kinds.slice(1, 2) : kinds, op.kind, v => { op.kind = v; fixOp(n); save(); drawOps(); })));
      box.appendChild(field('On', Lab.seg([{ label: 'Rows', value: 'row' }, { label: 'Columns', value: 'col' }], op.on, v => { op.on = v; save(); drawOps(); })));
      const pick = (label, key) => {
        const row = h('div', { class: 'mx-pick-row' });
        for (let k = 0; k < n; k++) {
          const on = op[key] === k, other = key === 'i' ? op.j : op.i;
          const b = h('button', { type: 'button', class: 'mx-chip' + (on ? ' on' : ''), text: String(k + 1), 'aria-pressed': String(on), 'aria-label': label + ' ' + (k + 1) });
          if (op.kind !== 'scale' && k === other) b.disabled = true;
          b.addEventListener('click', () => { op[key] = k; fixOp(n); save(); drawOps(); });
          row.appendChild(b);
        }
        return field(label, row);
      };
      if (op.kind === 'swap') { box.appendChild(pick('Swap ' + word, 'i')); box.appendChild(pick('with ' + word, 'j')); }
      else if (op.kind === 'scale') box.appendChild(pick(Word + ' to multiply', 'i'));
      else { box.appendChild(pick(Word + ' that changes', 'i')); box.appendChild(pick('Add ' + tex('k') + ' times ' + word, 'j')); }
      if (op.kind !== 'swap') {
        const inp = h('input', { class: 'field mono mx-k', type: 'text', value: op.k, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', 'aria-label': 'k' });
        const hint = h('div', { class: 'pl-hint' });
        inp.addEventListener('input', Lab.debounce(() => { op.k = inp.value; save(); drawOpsResult(); drawAnswer(); }, 160));
        box.appendChild(field('Your ' + tex('k') + ' (3, −2, 1/2 or 0.5)', h('div', { class: 'mx-row' }, inp, hint)));
        box.kInput = inp; box.kHint = hint;
      }
      return box;
    }
    function drawOpsResult() {
      const A = G.A, op = st.op, n = A.length;
      if (!opsRes || !isSq(A)) return;
      Lab.clear(opsRes);
      const word = op.on === 'row' ? 'row' : 'column';
      let k = null;
      if (op.kind !== 'swap') {
        const pk = parseEntry(op.k);
        if (opsBox.kInput) opsBox.kInput.classList.toggle('bad', !!pk.err);
        if (pk.err) { Lab.setHTML(opsBox.kHint, '<span class="cbad">' + tex('k') + ' ' + WHY[pk.err] + '</span>'); opsRes.appendChild(note('Type ' + tex('k') + ' as a number such as 3, −2, 1/2 or 0.5.', 'warn')); return; }
        Lab.setHTML(opsBox.kHint, '');
        k = pk.f;
      }
      const A2 = applyOp(A, op, k), dA = det(A), d2 = det(A2);
      const lit = (a, b) => { const x = op.on === 'row' ? a : b; return x === op.i || (op.kind === 'swap' && x === op.j) ? 'chg' : ''; };
      opsRes.appendChild(eqRow([mxView(A, { name: 'A', cls: lit }), h('span', { class: 'mx-sym', html: tex('\\xrightarrow{' + opTex(op, k) + '}') }), mxView(A2, { name: "A'", cls: lit })]));
      const pred = op.kind === 'swap' ? neg(dA) : op.kind === 'scale' ? mul(k, dA) : dA;
      const rule = op.kind === 'swap' ? "\\det A'=-\\det A" : op.kind === 'scale' ? "\\det A'=k\\cdot\\det A" : "\\det A'=\\det A";
      const ruleN = op.kind === 'swap' ? '-' + pt(dA) : op.kind === 'scale' ? pt(k) + '\\cdot ' + pt(dA) : nt(dA);
      const same = d2.eq(pred);
      const steps = [];
      const ruleWords = op.kind === 'swap' ? 'Swapping two ' + word + 's changes the sign of the determinant (' + lec('L1.4', '20:00') + ', ' + lec('L2.1', '16:30') + ').'
        : op.kind === 'scale' ? 'Multiplying one ' + word + ' by ' + tex('k') + ' multiplies the determinant by ' + tex('k') + ' (' + lec('L1.4', '26:30') + ', ' + lec('L2.1', '21:30') + ').'
          : 'Adding ' + tex('k') + ' times one ' + word + ' to another leaves the determinant unchanged (' + lec('L1.4', '22:30') + ', ' + lec('L2.1', '18:30') + ').';
      steps.push({ html: ruleWords + ' With ' + tex('\\det A=' + nt(dA)) + ' from the panel ' + tex('\\det A') + (op.kind === 'swap' ? '' : ' and your ' + tex('k=' + nt(k))) + ':', math: chain("\\det A'", [rule.replace("\\det A'=", ''), ruleN, nt(pred)]) });
      steps.push({ html: 'Check it on ' + tex("A'") + ' itself (worked out in full below): ' + tex("\\det A'=" + nt(d2)) + (same ? ' <span class="cgood">✓ the same</span>.' : ' <span class="cbad">✗</span>'), block: more('Work out ' + tex("\\det A'") + ' directly', [workOut(A2, "\\det A'")]) });
      if (op.kind === 'scale') {
        const L = { kind: op.on, idx: op.i }, ex = expand(A, L);
        const sgn = (t, q) => (q === 0 ? (t.sign < 0 ? '-' : '') : t.sign < 0 ? '-' : '+');
        steps.push({ html: 'Why: expand both along ' + word + ' ' + (op.i + 1) + '. Deleting that ' + word + ' gives the same minors for ' + tex('A') + ' and ' + tex("A'") + ', and each entry of it is ' + tex('k') + ' times bigger, so ' + tex('k') + ' comes out of every term (' + lec('L2.1', '22:00') + '):',
          math: chain("\\det A'", [ex.terms.map((t, q) => sgn(t, q) + pt(k) + '\\cdot ' + pt(t.a) + '\\cdot ' + pt(t.m)).join(''), pt(k) + '\\cdot\\left(' + ex.terms.map((t, q) => sgn(t, q) + pt(t.a) + '\\cdot ' + pt(t.m)).join('') + '\\right)', pt(k) + '\\cdot ' + pt(dA), nt(mul(k, dA))], true) });
      } else if (op.kind === 'add') {
        const X = op.on === 'row' ? A.map(r => r.slice()) : tr(A);
        X[op.i] = X[op.j].slice();
        const E = op.on === 'row' ? X : tr(X);
        const eqLit = (v, a, b) => { const x = op.on === 'row' ? a : b; return x === op.i || x === op.j ? hl(nt(v)) : nt(v); };
        steps.push({ html: 'Why (' + lec('L2.1', '19:30') + '): expand ' + tex("A'") + ' along ' + word + ' ' + (op.i + 1) + '. Each of its entries is a sum, so the determinant splits in two: ' + tex('\\det A') + ', plus ' + tex('k') + ' times the determinant of ' + tex('A') + ' with ' + word + ' ' + (op.i + 1) + ' replaced by ' + word + ' ' + (op.j + 1) + '. That matrix has two equal ' + word + 's, so its determinant is 0:',
          math: chain("\\det A'", ['\\det A+k\\cdot\\det' + bm(E, eqLit), nt(dA) + '+' + pt(k) + '\\cdot 0', nt(dA)], true) });
      } else if (n === 2) {
        const [[a, b], [c, d]] = op.on === 'row' ? A : tr(A);
        steps.push({ html: 'Why, for a 2 × 2 (' + lec('L1.4', '20:30') + '): with the ' + word + 's swapped, the two products of the formula ' + tex('ad-bc') + ' trade places:', math: chain("\\det A'", [pt(c) + '\\cdot ' + pt(b) + '-' + pt(d) + '\\cdot ' + pt(a), '-\\left(' + pt(a) + '\\cdot ' + pt(d) + '-' + pt(b) + '\\cdot ' + pt(c) + '\\right)', '-' + pt(dA)]) });
      } else {
        steps.push({ html: 'Why (' + lec('L2.1', '17:30') + '): expand along a ' + word + ' that is not swapped. Each minor is a smaller determinant with the same two ' + word + 's swapped, so every term changes sign — down to the 2 × 2 case, where ' + tex('cb-da=-(ad-bc)') + '.' });
      }
      const actions = h('div', { class: 'mx-row' },
        Lab.button('Use ' + tex("A'") + ' as your ' + tex('A'), () => {
          hist.push(copy(st.A));
          st.A = A2.map(r => r.map(plain));
          touched(); rebuildEditor('A'); opsSig = ''; draw();
        }, 'btn sm soft'),
        Lab.button('Undo', () => { if (!hist.length) return; st.A = hist.pop(); touched(); rebuildEditor('A'); opsSig = ''; draw(); }, 'btn sm'));
      if (!hist.length) actions.lastChild.disabled = true;
      steps.push({ html: 'Keep going: make ' + tex("A'") + ' your ' + tex('A') + ' and apply another operation. With zeros below the diagonal, det is the product of the diagonal (' + lec('L1.5', '4:00') + ').', block: actions });
      opsRes.appendChild(stepList(steps));
    }

    /* ---------------------------------------------------------------- mount */
    function mount(el) {
      addStyle();
      root = el;
      const { side, main } = K.layout(root, 'mxl');
      items = presets();
      side.appendChild(K.group('Lecture examples'));
      ctl.pre = K.presets({ label: Lab.course && Lab.course.lectureOnly ? 'Examples from the lectures' : 'Examples from the lectures', items, onPick: loadPreset });
      // group the menu: lecture by lecture, then the activity questions. A site may leave some options out
      // (option values are indices into items), so a group is added only when it gets at least one option.
      const sel = ctl.pre.select;
      const byVal = new Map(Array.from(sel.options).filter(o => o.value !== '').map(o => [o.value, o]));
      ctl.shown = new Set(byVal.keys());
      let grp = null;
      items.forEach((it, k) => {
        if (it.group) grp = h('optgroup', { label: it.group });
        const o = byVal.get(String(k));
        if (!o) return;
        if (grp && !grp.parentNode) sel.appendChild(grp);
        (grp || sel).appendChild(o);
      });
      if (st.loaded && itemIndex(st.loaded.label) < 0) st.loaded = null;
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 'mx-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
        Lab.store.set(KEY, {});
        Object.keys(st).forEach(x => delete st[x]);
        Object.assign(st, DEF());
        hist = []; opsSig = '';
        buildSide(); draw();
        showLoaded();
      }, 'btn ghost sm')));
      P.answer = K.answer();
      P.sum = K.panel('Add');
      P.scale = K.panel('Scale');
      P.prod = K.panel('Multiply');
      P.tr = K.panel('Transpose');
      P.det = K.panel('Determinant');
      P.ops = K.panel('Row operations');
      main.append(P.answer, P.sum, P.scale, P.prod, P.tr, P.det, P.ops);
      root.__mx = { st, G, dump };
      buildSide();
      draw();
      showLoaded();
    }
    /** The index of the example with this label, or −1 when the menu does not offer it. */
    function itemIndex(label) {
      const k = items.findIndex(x => x.label === label);
      return k >= 0 && ctl.shown.has(String(k)) ? k : -1;
    }
    function showLoaded() {
      const k = st.loaded ? itemIndex(st.loaded.label) : -1;
      ctl.pre.select.value = k >= 0 ? String(k) : '';
      Lab.setHTML(ctl.pre.lastChild, k >= 0 ? 'From: ' + items[k].source : '');
      if (k < 0) st.loaded = null;
    }
    /** Every computed value as plain strings (for checks). */
    function dump() {
      const { A, B, c } = G, s = Mx => Mx.map(r => r.map(String));
      const out = { A: s(A), B: s(B), c: String(c), scale: s(matScale(c, A)), tr: s(tr(A)) };
      if (sameSize(A, B)) out.sum = s(matAdd(A, B));
      if (A[0].length === B.length) out.prod = s(matMul(A, B));
      if (isSq(A)) {
        out.det = String(det(A));
        out.lines = A.length > 1 ? allLines(A.length).map(L => String(expand(A, L).val)) : [];
        const pk = parseEntry(st.op.k);
        if (st.op.kind === 'swap' || !pk.err) { const A2 = applyOp(A, st.op, pk.f || null); out.op = { A2: s(A2), det: String(det(A2)) }; }
      }
      if (isSq(B)) out.detB = String(det(B));
      if (out.prod && isSq(A) && sameSize(A, B)) out.detAB = String(det(matMul(A, B)));
      return out;
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-m2-matrix', course: 'm2', week: 1, weeks: [1, 2], order: 1,
    title: 'Matrix lab', sub: 'Matrices and determinants',
    topics: ['A + B', 'cA', 'AB as row × column', 'transpose', 'determinant', 'minors and cofactors', 'any row or column', 'row operations'],
    desc: 'Type your own matrices A and B (up to 4 × 4) and a number c. See A + B, cA and AB with every entry worked out, the transpose, det A expanded along the row or column you choose (minors, signs and every term), and what each row or column operation does to det A.',
    render: el => matrixLab().mount(el),
  });
})();
