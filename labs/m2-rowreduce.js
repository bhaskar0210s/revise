/* Revise — Mathematics II · Weeks 1–2 playground lab (L1.3, L2.4–L2.6).
   'lab-m2-rowreduce': a typed augmented matrix [A | b] (up to 4 × 5) or a plain matrix A, changed by elementary row
   operations — typed by hand, or Gaussian elimination one operation at a time. Every step shows the matrix after it
   with the changed rows highlighted. The panels show the REF and RREF rules, the leading 1s, the dependent and
   independent variables, the solution type, back substitution or the general solution, a check in the original
   equations, the determinant for a square A and, with two unknowns, the equations as lines. Exact fractions only. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const Frac = Lab.Frac;
  const K = Lab.play;
  const esc = Lab.esc;

  const KEY = 'lab:m2-rowreduce';
  const MAX_ROWS = 4, MAX_COLS = 5, MAX_OPS = 60;
  const ZERO = F(0), ONE = F(1);
  const range = n => Array.from({ length: n }, (_, i) => i);
  const plural = (n, word) => n + ' ' + word + (n === 1 ? '' : 's');

  /* ================================================================ numbers and TeX */
  const isOne = f => f.n === 1 && f.d === 1;
  /** TeX for an exact number: 3, -2, \tfrac{2}{3}, -\tfrac{11}{4}. */
  const nt = f => (f.d === 1 ? String(f.n) : (f.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.n) + '}{' + f.d + '}');
  /** The same in brackets when negative, for products such as 3\cdot(-2). */
  const np = f => (f.n < 0 ? '(' + nt(f) + ')' : nt(f));
  /** A typed entry (whole number, decimal, fraction or a short expression) as an exact fraction, or null. */
  const parseCell = s => { const f = K.parseNum(String(s == null ? '' : s)); return f instanceof Frac && !f.approx ? f : null; };
  const TEXC = new Map();
  /** Inline TeX, cached: the matrices repeat the same entries many times. */
  function tx(s) {
    let v = TEXC.get(s);
    if (v === undefined) { if (TEXC.size > 4000) TEXC.clear(); v = Lab.tex(s); TEXC.set(s, v); }
    return v;
  }
  const aligned = lines => '\\begin{aligned}' + lines.join('\\\\') + '\\end{aligned}';
  /** A sum written out: [3, 5, -2] → 3+5-2. */
  const sumTex = list => (list.length ? list.map((f, k) => (k === 0 ? nt(f) : f.n < 0 ? '-' + nt(f.neg()) : '+' + nt(f))).join('') : '0');
  /** c0 + co[0]·pn[0] + co[1]·pn[1] + … as TeX; pn holds the names that multiply the coefficients. */
  function linTex(c0, co, pn) {
    let s = c0.isZero() ? '' : nt(c0);
    co.forEach((a, k) => {
      if (a.isZero()) return;
      const neg = a.n < 0, abs = neg ? a.neg() : a;
      s += (s ? (neg ? '-' : '+') : neg ? '-' : '') + (isOne(abs) ? '' : nt(abs)) + pn[k];
    });
    return s || '0';
  }
  /** The left side of an equation: the first nA entries of a row times the unknowns N. */
  const lhsTex = (row, nA, N) => linTex(ZERO, row.slice(0, nA), N);
  const RT = i => 'R_{' + (i + 1) + '}';
  /** The factor in front of a row: 1 → nothing, −1 → a minus sign, else the number. */
  const kTex = k => (isOne(k) ? '' : k.n === -1 && k.d === 1 ? '-' : nt(k));
  /** An operation in the notation of L2.5: R_1 \leftrightarrow R_2, R_1 \to \tfrac{1}{3}R_1, R_2 \to R_2-3R_1. */
  function opTex(op) {
    if (op.t === 'swap') return RT(op.i) + '\\leftrightarrow ' + RT(op.j);
    if (op.t === 'scale') return RT(op.i) + '\\to ' + kTex(op.k) + RT(op.i);
    const neg = op.k.n < 0, a = neg ? op.k.neg() : op.k;
    return RT(op.i) + '\\to ' + RT(op.i) + (neg ? '-' : '+') + (isOne(a) ? '' : nt(a)) + RT(op.j);
  }
  const TYPE = { swap: 'type 1', scale: 'type 2', add: 'type 3' };
  const tupleTex = list => '(' + list.join(',\\ ') + ')';
  const nw = html => '<span class="rr-nw">' + html + '</span>';
  /** Inline TeX glued to the punctuation after it, so a line never starts with that mark. */
  const txp = (s, p) => nw(tx(s) + (p == null ? '.' : p));
  /** Names of the free parameters: t for one, t_1, t_2, … for several. */
  const params = k => (k === 1 ? ['t'] : range(k).map(i => 't_{' + (i + 1) + '}'));

  /* ================================================================ row operations and Gaussian elimination */
  /** The matrix after one elementary row operation; rows i, j count from 0 and k is a fraction. */
  function applyOp(M, op) {
    const R = M.slice();
    if (op.t === 'swap') { R[op.i] = M[op.j]; R[op.j] = M[op.i]; }
    else if (op.t === 'scale') R[op.i] = M[op.i].map(v => v.mul(op.k));
    else R[op.i] = M[op.i].map((v, c) => v.add(op.k.mul(M[op.j][c])));
    return R;
  }
  /** Column of the first non-zero entry among the first nc entries of a row, or −1 for a row of zeros. */
  const lead = (row, nc) => { for (let c = 0; c < nc; c++) if (!row[c].isZero()) return c; return -1; };
  /**
   * The next operation of Gaussian elimination as in L2.5 and L2.6. Leading entries are looked for in the first nA
   * columns only (the coefficient part). Forward: take the leftmost column with a non-zero entry in the rows not done
   * yet, bring a non-zero entry to the top (type 1), make it 1 (type 2), clear the entries below it (type 3).
   * Backward, once that part is in REF: from the rightmost leading 1 to the left, clear the entries above each one.
   * Returns {op, why, r, c, p} (r, c: the leading entry worked on; p: the other row involved) or null at RREF.
   */
  function nextStep(M, nA) {
    const m = M.length;
    let r = 0;
    for (let c = 0; c < nA && r < m; c++) {
      let p = -1;
      for (let i = r; i < m; i++) if (!M[i][c].isZero()) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) return { op: { t: 'swap', i: r, j: p }, why: 'swap', r, c, p };
      if (!isOne(M[r][c])) return { op: { t: 'scale', i: r, k: ONE.div(M[r][c]) }, why: 'one', r, c, p: r };
      for (let i = r + 1; i < m; i++) if (!M[i][c].isZero()) return { op: { t: 'add', i, j: r, k: M[i][c].neg() }, why: 'below', r, c, p: i };
      r++;
    }
    const piv = [];
    M.forEach((row, i) => { const c = lead(row, nA); if (c >= 0) piv.push({ r: i, c }); });
    for (let q = piv.length - 1; q >= 0; q--) {
      const { r: pr, c } = piv[q];
      for (let i = pr - 1; i >= 0; i--) if (!M[i][c].isZero()) return { op: { t: 'add', i, j: pr, k: M[i][c].neg() }, why: 'above', r: pr, c, p: i };
    }
    return null;
  }
  /** The rest of the elimination from M: the forward steps to REF, then the backward steps to RREF. */
  function complete(M, nA) {
    const fw = [], bw = [];
    let s, guard = 0;
    while ((s = nextStep(M, nA)) && s.why !== 'above' && guard++ < 100) { fw.push(s); M = applyOp(M, s.op); }
    const ref = M;
    while ((s = nextStep(M, nA)) && guard++ < 200) { bw.push(s); M = applyOp(M, s.op); }
    return { fw, ref, bw, rref: M };
  }
  /** The rules of L2.4 checked on the first nc columns: which rows break rule 1, 2, 3 (REF) and rule 4 (RREF). */
  function echelon(M, nc) {
    const leads = M.map(row => lead(row, nc));
    const notOne = [], order = [], zeros = [], others = [];
    leads.forEach((c, i) => { if (c >= 0 && !isOne(M[i][c])) notOne.push(i); });
    let pc = -1, pr = -1, firstZero = -1;
    leads.forEach((c, i) => {
      if (c < 0) { if (firstZero < 0) firstZero = i; return; }
      if (firstZero >= 0) zeros.push({ z: firstZero, i });
      if (pr >= 0 && c <= pc) order.push({ a: pr, b: i });
      pc = c; pr = i;
    });
    leads.forEach((c, i) => { if (c >= 0) M.forEach((row, k) => { if (k !== i && !row[c].isZero()) others.push({ k, c, i }); }); });
    const ref = !notOne.length && !order.length && !zeros.length;
    return { leads, notOne, order, zeros, others, ref, rref: ref && !others.length };
  }
  /**
   * Read the solutions off a matrix whose first nA columns are in RREF. Every unknown becomes
   * c0 + Σ co[k]·t_k, with one parameter t_k for each independent (free) variable.
   */
  function solveR(R, nA, aug) {
    const leads = R.map(row => lead(row, nA));
    const pivRows = [];
    leads.forEach((c, i) => { if (c >= 0) pivRows.push({ r: i, c }); });
    const pivCols = pivRows.map(p => p.c);
    const free = range(nA).filter(c => !pivCols.includes(c));
    const bad = aug ? range(R.length).filter(i => leads[i] < 0 && !R[i][nA].isZero()) : [];
    const expr = range(nA).map(j => ({ c0: ZERO, co: free.map(f => (f === j ? ONE : ZERO)) }));
    pivRows.forEach(({ r, c }) => { expr[c] = { c0: aug ? R[r][nA] : ZERO, co: free.map(f => R[r][f].neg()) }; });
    return { pivRows, pivCols, free, bad, expr, type: bad.length ? 'none' : free.length ? 'many' : 'one' };
  }
  /** Rows changed by an operation. */
  const changed = op => (op.t === 'swap' ? [op.i, op.j] : [op.i]);
  /** Rows of an augmented matrix that read 0 = (non-zero): zero in the coefficient part, not zero in b. */
  const zeroB = (M, nA, aug) => (aug ? range(M.length).filter(i => lead(M[i], nA) < 0 && !M[i][nA].isZero()) : []);
  const sameOp = (a, b) => a.t === b.t && (a.t === 'swap' ? (a.i === b.i && a.j === b.j) || (a.i === b.j && a.j === b.i) : a.i === b.i && (a.t === 'scale' || a.j === b.j) && a.k.eq(b.k));

  /* ================================================================ lecture examples */
  const VID = { 'L1.3': 'WzR4NKeLHMY', 'L2.4': '6N8owlkf9AQ', 'L2.5': 'ECRhKDTUxM8', 'L2.6': 'gdk1_aEe7j4' };
  /** A link to a lecture video at a time m:ss. */
  function vid(code, at) {
    const [mm, ss] = at.split(':').map(Number);
    return '<a href="https://www.youtube.com/watch?v=' + VID[code] + '&amp;t=' + (mm * 60 + ss) + 's" target="_blank" rel="noopener">' + code + ' video, ' + at + '</a>';
  }
  /** A link to a page of activity questions on this site. */
  const aq = (id, code) => '' + code + '';
  /** Rows written as '8 8 4 1960; 12 5 7 2215'. */
  const S = s => s.split(';').map(r => r.trim().split(/\s+/));
  const GROUPS = [
    { label: 'L1.3 · Systems of linear equations', items: [
      { label: 'L1.3 · Rice, dal and oil: 3 buyers, 3 prices', names: 'xyz', rows: S('8 8 4 1960; 12 5 7 2215; 3 2 5 1135'),
        source: vid('L1.3', '0:30') + ' (written as Ax = b at ' + vid('L1.3', '15:30') + '). Buyer A pays ₹1960 for 8 kg rice, 8 kg dal and 4 l oil; B pays ₹2215 for 12, 5 and 7; C pays ₹1135 for 3, 2 and 5. x, y, z are the three prices. The lecture eliminates by hand and gets x = 45, y = 125, z = 150.' },
      { label: 'L1.3 · 3x + 2y + z = 6, with fractions', names: 'xyz', rows: S('3 2 1 6; 1 -1/2 2/3 7/6; 4 6 -10 0'),
        source: vid('L1.3', '8:00') + ' (as a matrix at ' + vid('L1.3', '14:00') + '): 3x + 2y + z = 6, x − ½y + ⅔z = 7/6, 4x + 6y − 10z = 0. The lecture checks that x = y = z = 1 solves it.' },
      { label: 'L1.3 · 2x + y = 215, 4x + 2y = 430: infinitely many', names: 'xyz', rows: S('2 1 215; 4 2 430'), free: { 1: '215' },
        source: vid('L1.3', '19:00') + ': two buyers; both equations give the same line, so every point on it is a solution. The lecture names x = 0, y = 215 (the value of y below starts at 215) and x = 107.5, y = 0.' },
      { label: 'L1.3 · 2x + y = 215, 4x + 2y = 400: no solution', names: 'xyz', rows: S('2 1 215; 4 2 400'),
        source: vid('L1.3', '21:30') + ': B gets a discount. Doubling the first equation gives 4x + 2y = 430, but the second says 400: the lines are parallel.' },
      { label: 'L1.3 · 2x + y = 215, 3x + y = 260: one solution', names: 'xyz', rows: S('2 1 215; 3 1 260'),
        source: vid('L1.3', '24:00') + ': the two lines cross at x = 45, y = 125.' },
    ] },
    { label: 'L2.4 · The echelon form', items: [
      { label: 'L2.4 · A = [1 0 2; 0 1 3] and Ax = 0', rows: S('1 0 2 0; 0 1 3 0'), free: { 2: '5' },
        source: vid('L2.4', '2:00') + ': A is already in reduced row echelon form. With x₃ = c the lecture gets x = (−2c, −3c, c), and for c = 5, x = (−10, −15, 5); the value of x₃ below starts at 5.' },
      { label: 'L2.4 · [1 2 0 0; 0 0 1 0; 0 0 0 1]: x₂ is independent', rows: S('1 2 0 0 0; 0 0 1 0 0; 0 0 0 1 0'),
        source: vid('L2.4', '12:30') + ' and ' + vid('L2.4', '20:00') + ': the leading 1s are in columns 1, 3 and 4, so x₁, x₃, x₄ are dependent and x₂ is independent. The lecture keeps b general and gets x = (b₁ − 2c, c, b₂, b₃); here b = 0 — type your own b.' },
    ] },
    { label: 'L2.5 · Row reduction', items: [
      { label: 'L2.5 · Reduce [3 2 1 1; 1 1 0 0; 0 7 1 1]', aug: false, rows: S('3 2 1 1; 1 1 0 0; 0 7 1 1'),
        source: vid('L2.5', '4:30') + ' to ' + vid('L2.5', '17:00') + ': R₁/3, R₂ − R₁, 3R₂, R₃ − 7R₂, R₃/8, then R₂ + R₃, R₁ − ⅓R₃ and R₁ − ⅔R₂ give [1 0 0 0; 0 1 0 0; 0 0 1 1]. It is a plain matrix here, so the solutions are those of Ax = 0.' },
      { label: 'L2.5 · Reduce [2 4 1; 3 8 7; 5 6 9], and its determinant', aug: false, rows: S('2 4 1; 3 8 7; 5 6 9'),
        source: vid('L2.5', '17:30') + ' (the reduced form is the identity matrix) and ' + vid('L2.5', '23:30') + ' (det = 70, traced back through the operations).' },
    ] },
    { label: 'L2.6 · Gaussian elimination', items: [
      { label: 'L2.6 · Example 1: [A | b] with b = (6, 2, 8)', rows: S('3 2 1 1 6; 1 1 0 0 2; 0 7 1 1 8'),
        source: vid('L2.6', '8:30') + ' (the augmented matrix) and ' + vid('L2.6', '15:00') + ' (the elimination): the same A as in L2.5. The lecture gets x₄ = c free and x = (1, 1, 1 − c, c).' },
      { label: 'L2.6 · Example 2: no solution', rows: S('1 1 1 2; 0 1 -3 1; 2 1 5 0'),
        source: vid('L2.6', '21:30') + ': x₁ + x₂ + x₃ = 2, x₂ − 3x₃ = 1, 2x₁ + x₂ + 5x₃ = 0. After R₃ − 2R₁, R₃ + R₂ and R₁ − R₂ the last row reads 0 0 0 | −3, so there is no solution (' + vid('L2.6', '25:00') + ').' },
    ] },
    { label: 'Activity questions (not graded)', items: [
                                                                                                                ] },
  ];
  const PRESETS = GROUPS.flatMap(g => g.items);
  const DEFAULT = PRESETS.find(p => /^L2\.6 · Example 1/.test(p.label));
  /** A site built with Lab.course.lectureOnly lists only lecture examples, never course questions (the same rule as K.presets). */
  const hidden = it => !!(Lab.course && Lab.course.lectureOnly) && /^(AQ|TQ|PA|GA|PPA|GrPA)\s?\d/.test(it.label || '');
  const presetState = it => ({ rows: it.rows.map(r => r.slice()), aug: it.aug !== false, names: it.names || 'idx', free: Object.assign({}, it.free || {}), ops: [], loaded: it.label });

  /* ================================================================ style (phone first: 16px inputs, 44px targets) */
  const CSS = [
    '.rr-lab .rr-dyn { display: grid; gap: 12px; min-width: 0; }',
    /* the tall struts of KaTeX fractions reach above their line and would catch taps meant for the buttons above */
    '.rr-lab .katex { pointer-events: none; }',
    '.rr-lab input.field, .rr-lab select.field { font-size: 16px; }',
    '.rr-lab .btn { min-height: 44px; height: auto; }',
    '.rr-lab .pl-toggle { min-height: 44px; }',
    '.rr-lab .pl-controls .seg button { min-height: 44px; }',
    '.rr-lab .pl-controls .seg.rr-segn, .rr-lab .seg.rr-segn { display: grid; grid-template-columns: repeat(var(--k, 4), minmax(0, 1fr)); width: 100%; }',
    '.rr-lab .seg.rr-segn button { min-height: 44px; padding: 4px; font-size: 14.5px; white-space: normal; line-height: 1.2; }',
    '.rr-lab .rr-src a { font-weight: 600; }',
    '.rr-lab .rr-nw { white-space: nowrap; }',
    '@media (max-width: 480px) { .rr-lab .pl-main .tbl-wrap table th, .rr-lab .pl-main .tbl-wrap table td { padding-left: 7px; padding-right: 7px; } }',
    '.rr-lab .rr-edwrap { overflow-x: auto; padding: 3px 2px; }',
    '.rr-lab .rr-ed { display: grid; gap: 5px 4px; align-items: center; min-width: 0; }',
    '.rr-lab .rr-ed .field { height: 44px; width: 100%; min-width: 42px; padding: 0 2px; text-align: center; font-family: var(--font-mono); font-size: 16px; }',
    '.rr-lab .rr-ed .rr-ch { font-size: 13px; color: var(--ink-3); text-align: center; }',
    '.rr-lab .rr-ed .rr-rl { font-size: 13px; color: var(--ink-3); text-align: right; padding-right: 2px; }',
    '.rr-lab .rr-ed .rr-sep { align-self: stretch; justify-self: center; width: 0; margin: -3px 0; border-left: 2px solid var(--line-2); }',
    /* a matrix: an explicit grid, brackets drawn by one element spanning the entries */
    '.rr-lab .rr-mx { max-width: 100%; overflow-x: auto; overflow-y: hidden; padding: 3px 1px 5px; }',
    '.rr-lab .rr-m { display: inline-grid; align-items: stretch; font-size: 17px; line-height: 1; vertical-align: top; }',
    '.rr-lab .rr-m.sm { font-size: 14.5px; }',
    '.rr-lab .rr-m .e { display: flex; align-items: center; justify-content: center; min-width: 2.1em; min-height: 2.1em; padding: 0 .3em; }',
    '.rr-lab .rr-m.sm .e { min-width: 1.9em; min-height: 1.95em; padding: 0 .22em; }',
    '.rr-lab .rr-m .rl { display: flex; align-items: center; justify-content: flex-end; padding-right: 7px; font-size: .8em; color: var(--ink-3); white-space: nowrap; }',
    '.rr-lab .rr-m .ch { text-align: center; font-size: .8em; color: var(--ink-3); padding: 0 .2em 4px; }',
    '.rr-lab .rr-m .bar { background: linear-gradient(var(--ink-3), var(--ink-3)) center / 1.5px 100% no-repeat; }',
    '.rr-lab .rr-m .br { position: relative; pointer-events: none; }',
    '.rr-lab .rr-m .br::before, .rr-lab .rr-m .br::after { content: ""; position: absolute; top: 0; bottom: 0; width: 6px; border: 1.6px solid var(--ink-2); }',
    '.rr-lab .rr-m .br::before { left: 0; border-right: 0; border-radius: 3px 0 0 3px; }',
    '.rr-lab .rr-m .br::after { right: 0; border-left: 0; border-radius: 0 3px 3px 0; }',
    '.rr-lab .rr-m .dep { background-color: var(--x-soft); }',
    '.rr-lab .rr-m .free { background-color: var(--y-soft); }',
    '.rr-lab .rr-m .zb { background-color: var(--bad-soft); }',
    '.rr-lab .rr-m .hot { background-color: var(--pick-soft); }',
    '.rr-lab .rr-m .rl.hot, .rr-lab .rr-m .rl.zb { background-color: transparent; color: var(--pick); font-weight: 700; }',
    '.rr-lab .rr-m .rl.zb { color: var(--bad); }',
    '.rr-lab .rr-m .ch.dep { background: none; color: var(--x); font-weight: 700; }',
    '.rr-lab .rr-m .ch.free { background: none; color: var(--y); font-weight: 700; }',
    '.rr-lab .rr-m .rule { border-top: 1.5px solid var(--ink-3); }',
    '.rr-lab .rr-m .lead .v { box-shadow: 0 0 0 1.6px var(--good); border-radius: 99px; padding: .14em .36em; }',
    '.rr-lab .rr-m .lead.no .v { box-shadow: 0 0 0 1.6px var(--warn); }',
    /* the work area */
    '.rr-lab .rr-cap { font-size: 15px; line-height: 1.55; color: var(--ink-2); }',
    '.rr-lab .rr-stage { display: flex; flex-wrap: wrap; gap: 4px 28px; align-items: center; }',
    '.rr-lab .rr-stage > * { min-width: 0; max-width: 100%; }',
    '.rr-lab .rr-eqs .katex-display { margin: 0; }',
    '.rr-lab .rr-gh { font-size: 14px; color: var(--ink-2); }',
    '.rr-lab .rr-btns { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }',
    '.rr-lab .rr-btns .btn { min-height: 44px; padding: 6px 10px; white-space: normal; line-height: 1.15; }',
    '.rr-lab .rr-next { font-size: 14.5px; line-height: 1.55; color: var(--ink-2); padding: 9px 12px; border-radius: 12px; background: var(--bg-sunk); border: 1px solid var(--line); }',
    '.rr-lab .rr-tool { display: grid; gap: 10px; border-top: 1px solid var(--line); padding-top: 14px; }',
    '.rr-lab .rr-trow { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 8px; align-items: center; }',
    '.rr-lab .rr-trow[hidden] { display: none; }',
    '.rr-lab .rr-tl { font-size: 14px; color: var(--ink-2); font-weight: 600; }',
    '.rr-lab .rr-k { width: 140px; max-width: 100%; height: 44px; text-align: center; font-family: var(--font-mono); }',
    '.rr-lab .rr-prev { font-size: 14.5px; line-height: 1.6; color: var(--ink-2); }',
    '.rr-lab .rr-apply { display: flex; flex-wrap: wrap; gap: 8px; }',
    '.rr-lab .rr-apply .btn { min-height: 44px; white-space: normal; line-height: 1.2; }',
    /* steps */
    '.rr-lab .rr-hist { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 250px), 1fr)); gap: 12px; }',
    '.rr-lab .rr-card { min-width: 0; display: grid; gap: 6px; align-content: start; padding: 10px 12px 12px; border-radius: 16px; border: 1px solid var(--line); background: var(--bg-sunk); }',
    '.rr-lab .rr-card.last { border-color: var(--pick-line); background: color-mix(in srgb, var(--pick-soft) 50%, var(--bg-elev)); }',
    '.rr-lab .rr-card.gap { place-items: center; background: none; border-style: dashed; }',
    '.rr-lab .rr-card .hd { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 15px; }',
    '.rr-lab .rr-card .num { flex: none; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 12px; font-weight: 700; background: var(--accent-soft); color: var(--accent-ink); }',
    '.rr-lab .rr-card .ty { font-size: 12px; color: var(--ink-3); font-weight: 600; }',
    '.rr-lab .rr-card .why { font-size: 13.5px; line-height: 1.5; color: var(--ink-2); }',
    '.rr-lab .rr-card .stop { font-size: 13.5px; line-height: 1.5; color: var(--bad); }',
    '.rr-lab .rr-card details > summary { cursor: pointer; font-size: 13.5px; font-weight: 600; color: var(--accent-ink); min-height: 34px; display: flex; align-items: center; }',
    /* checks, variables, solutions */
    '.rr-lab .rr-badges { display: flex; flex-wrap: wrap; gap: 6px; }',
    '.rr-lab .rr-badge { font-size: 12.5px; font-weight: 700; padding: 4px 11px; border-radius: 99px; background: var(--bg-sunk-2); color: var(--ink-3); }',
    '.rr-lab .rr-badge.ok { background: var(--good-soft); color: var(--good); }',
    '.rr-lab .rr-badge.no { background: var(--bad-soft); color: var(--bad); }',
    '.rr-lab .rr-depw { color: var(--x); }',
    '.rr-lab .rr-freew { color: var(--y); }',
    '.rr-lab .rr-free { display: flex; flex-wrap: wrap; gap: 10px 18px; align-items: center; }',
    '.rr-lab .rr-free label { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; }',
    '.rr-lab .rr-free input { width: 104px; height: 44px; text-align: center; font-family: var(--font-mono); }',
    '.rr-lab .rr-part { margin-top: 8px; font-size: 15px; line-height: 1.6; }',
    '.rr-lab .rr-part .katex-display { margin: 4px 0; text-align: left; }',
    '.rr-lab .pl-main.rr-stale > .pl-panel { opacity: .5; }',
    /* two unknowns as lines */
    '.rr-lab .rr-plot { display: block; width: 100%; max-width: 560px; height: auto; background: var(--bg-sunk); border: 1px solid var(--line); border-radius: 14px; }',
    '.rr-lab .rr-plot .gr { stroke: var(--line-2); stroke-width: 1; }',
    '.rr-lab .rr-plot .ax { stroke: var(--ink-4); stroke-width: 1.4; }',
    '.rr-lab .rr-plot .tk { font: 11px var(--font-sans); fill: var(--ink-3); }',
    '.rr-lab .rr-plot .ln { fill: none; stroke-width: 2.6; stroke-linecap: round; }',
    '.rr-lab .rr-plot .ln.old { stroke-width: 1.5; stroke-dasharray: 6 5; opacity: .6; }',
    '.rr-lab .rr-plot .lb { font: 700 12.5px var(--font-sans); }',
    '.rr-lab .rr-plot .pt { fill: var(--pick); stroke: var(--bg-elev); stroke-width: 2.5; }',
    '.rr-lab .rr-plot .ptl { font: 700 12.5px var(--font-sans); fill: var(--pick); }',
    '.rr-lab .rr-narrow { display: none; }',
    '.rr-lab .rr-part .katex-display, .rr-lab .rr-part .katex-display > .katex { text-align: left; }',
  ];
  /* narrow screens: phones (where the page is not a size container) and narrow lab columns */
  const NARROW = [
    '.rr-lab .rr-btns { grid-template-columns: repeat(3, minmax(0, 1fr)); }',
    '.rr-lab .rr-btns .rr-nextb { grid-column: 1 / -1; order: -1; }',
    '.rr-lab .rr-apply .btn { flex: 1 1 140px; }',
    '.rr-lab .btn, .rr-lab .pl-toggle, .rr-lab .seg button, .rr-lab .seg.rr-segn button, .rr-lab .pl-controls .seg button { min-height: 44px; }',
    '.rr-lab select.field { height: 44px; }',
    '.rr-lab .rr-card details > summary { min-height: 44px; }',
    '.rr-lab .rr-trow { grid-template-columns: 64px minmax(0, 1fr); }',
    '.rr-lab .rr-wide { display: none; }',
    '.rr-lab .rr-narrow { display: block; }',
    '.rr-lab .pl-ans-big .katex-display > .katex { font-size: 1.25em; }',
  ];
  function injectStyle() {
    if (document.getElementById('rr-style')) return;
    const el = document.createElement('style');
    el.id = 'rr-style';
    el.textContent = CSS.concat(['@media (max-width: 640px) {'], NARROW, ['}', '@container (max-width: 640px) {'], NARROW, ['}']).join('\n');
    document.head.appendChild(el);
  }

  /* ================================================================ drawing helpers */
  /**
   * A matrix as a grid with brackets. o: nA (columns before the bar), aug (draw the bar and the last column),
   * labels (true → R_1, R_2 …, or an array of TeX), head (TeX for each column), hot (rows to highlight), zb (rows that
   * read 0 = c), leads (ring the leading entries), tint ('dep' | 'free' per column), rule (row with a line above it),
   * brackets (default true), sm (smaller type).
   */
  function matEl(M, o) {
    const m = M.length, nA = o.nA, aug = !!o.aug && M[0].length > nA;
    const br = o.brackets !== false;
    const colL = 1, colS1 = 2, col0 = 3, colBar = col0 + nA, colB = colBar + 1, colS2 = aug ? colB + 1 : colBar;
    const tmpl = [o.labels ? 'auto' : '0px', br ? '7px' : '2px'].concat(range(nA).map(() => 'auto'), aug ? ['9px', 'auto'] : [], [br ? '7px' : '2px']);
    const g = h('div', { class: 'rr-m' + (o.sm ? ' sm' : '') });
    g.style.gridTemplateColumns = tmpl.join(' ');
    const put = (el, row, col) => { el.style.gridRow = String(row); el.style.gridColumn = String(col); g.appendChild(el); return el; };
    const r0 = o.head ? 2 : 1;
    if (o.head) {
      range(nA).forEach(j => put(h('div', { class: 'ch' + (o.tint && o.tint[j] ? ' ' + o.tint[j] : ''), html: tx(o.head[j]) }), 1, col0 + j));
      if (aug) put(h('div', { class: 'ch', html: tx(o.head[nA] || 'b') }), 1, colB);
    }
    const leads = o.leads ? M.map(row => lead(row, nA)) : null;
    M.forEach((row, i) => {
      const R = r0 + i;
      const rc = (o.hot && o.hot.includes(i) ? ' hot' : '') + (o.zb && o.zb.includes(i) ? ' zb' : '') + (o.rule === i ? ' rule' : '');
      if (o.labels) put(h('div', { class: 'rl' + rc, html: tx(o.labels === true ? RT(i) : o.labels[i]) }), R, colL);
      row.forEach((v, j) => {
        if (j >= nA && !aug) return;
        let cls = 'e' + rc;
        if (o.tint && j < nA && o.tint[j]) cls += ' ' + o.tint[j];
        if (leads && leads[i] === j) cls += isOne(v) ? ' lead' : ' lead no';
        put(h('div', { class: cls, html: '<span class="v">' + tx(nt(v)) + '</span>' }), R, j < nA ? col0 + j : colB);
      });
      if (aug) put(h('div', { class: 'bar' + rc }), R, colBar);
      put(h('div', { class: 'sp' + rc }), R, colS1);
      put(h('div', { class: 'sp' + rc }), R, colS2);
    });
    if (br) {
      const b = h('div', { class: 'br' });
      b.style.gridRow = r0 + ' / ' + (r0 + m);
      b.style.gridColumn = colS1 + ' / ' + (colS2 + 1);
      g.appendChild(b);
    }
    return h('div', { class: 'rr-mx' }, g);
  }
  const details = (summary, content) => h('details', {}, h('summary', { text: summary }), content);
  const badge = (text, ok) => h('span', { class: 'rr-badge ' + (ok ? 'ok' : 'no'), text: text + (ok ? ' ✓' : ' ✗') });
  const markTex = ok => (ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>');
  const setTitle = (panel, html) => Lab.setHTML(panel.querySelector('.pl-panel-head h3'), html);

  /** Round numbers between lo and hi, about n of them. */
  function ticks(lo, hi, n) {
    const raw = (hi - lo) / n, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9 && out.length < 40; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  const LINE_COL = ['var(--x)', 'var(--y)', 'var(--z)', 'var(--pick)'];
  const SUB = ['₁', '₂', '₃', '₄'];
  /**
   * Equations in two unknowns drawn as lines a·x + b·y = c: the rows of cur solid, the rows of orig dashed (when
   * given). pt: the common point or null; nm: the axis names.
   */
  function linePlot(cur, orig, pt, nm) {
    const toL = (M, old) => M.map((r, i) => ({ a: Number(r[0]), b: Number(r[1]), c: Number(r[2]), i, old })).filter(l => l.a !== 0 || l.b !== 0);
    const all = (orig ? toL(orig, true) : []).concat(toL(cur, false));
    const pts = [[0, 0]];
    all.forEach(l => { if (l.a) pts.push([l.c / l.a, 0]); if (l.b) pts.push([0, l.c / l.b]); });
    for (let p = 0; p < all.length; p++) for (let q = p + 1; q < all.length; q++) {
      const D = all[p].a * all[q].b - all[q].a * all[p].b;
      if (Math.abs(D) > 1e-12) pts.push([(all[p].c * all[q].b - all[q].c * all[p].b) / D, (all[p].a * all[q].c - all[q].a * all[p].c) / D]);
    }
    if (pt) pts.push(pt);
    const box = k => { let lo = Math.min(...pts.map(p => p[k])), hi = Math.max(...pts.map(p => p[k])); if (hi - lo < 2) { const c = (lo + hi) / 2; lo = c - 1; hi = c + 1; } const pad = (hi - lo) * 0.16; return [lo - pad, hi + pad]; };
    const [x0, x1] = box(0), [y0, y1] = box(1);
    const W = 360, H = 270, pl = 46, pr = 14, pt0 = 14, pb = 30;
    const X = x => pl + ((x - x0) / (x1 - x0)) * (W - pl - pr);
    const Y = y => pt0 + ((y1 - y) / (y1 - y0)) * (H - pt0 - pb);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'rr-plot', role: 'img', 'aria-label': 'The equations drawn as lines' });
    ticks(x0, x1, 5).forEach(v => {
      s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: pt0, y2: H - pb, class: 'gr' }));
      s.appendChild(svg('text', { x: X(v), y: H - pb + 16, 'text-anchor': 'middle', class: 'tk' }, Lab.fmtVal(v)));
    });
    ticks(y0, y1, 5).forEach(v => {
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), class: 'gr' }));
      s.appendChild(svg('text', { x: pl - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tk' }, Lab.fmtVal(v)));
    });
    if (x0 < 0 && x1 > 0) s.appendChild(svg('line', { x1: X(0), x2: X(0), y1: pt0, y2: H - pb, class: 'ax' }));
    if (y0 < 0 && y1 > 0) s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(0), y2: Y(0), class: 'ax' }));
    s.appendChild(svg('text', { x: W - pr - 2, y: H - pb - 6, 'text-anchor': 'end', class: 'tk' }, nm[0] + ' →'));
    s.appendChild(svg('text', { x: pl + 6, y: pt0 + 12, class: 'tk' }, nm[1] + ' ↑'));
    const inX = x => x >= x0 - 1e-9 && x <= x1 + 1e-9, inY = y => y >= y0 - 1e-9 && y <= y1 + 1e-9;
    all.forEach(l => {
      const P = [];
      if (l.b !== 0) [x0, x1].forEach(x => { const y = (l.c - l.a * x) / l.b; if (inY(y)) P.push([X(x), Y(y)]); });
      if (l.a !== 0) [y0, y1].forEach(y => { const x = (l.c - l.b * y) / l.a; if (inX(x)) P.push([X(x), Y(y)]); });
      if (P.length < 2) return;
      let best = [P[0], P[1]], bd = -1;
      for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) { const dd = (P[i][0] - P[j][0]) ** 2 + (P[i][1] - P[j][1]) ** 2; if (dd > bd) { bd = dd; best = [P[i], P[j]]; } }
      const col = LINE_COL[l.i % 4];
      s.appendChild(svg('line', { x1: best[0][0], y1: best[0][1], x2: best[1][0], y2: best[1][1], class: 'ln' + (l.old ? ' old' : ''), style: 'stroke:' + col }));
      if (!l.old) {
        const e = best[0][0] > best[1][0] ? best[0] : best[1];
        s.appendChild(svg('text', { x: Math.min(e[0] - 4, W - pr - 4), y: Math.max(e[1] - 7, pt0 + 12), 'text-anchor': 'end', class: 'lb', style: 'fill:' + col }, 'R' + SUB[l.i]));
      }
    });
    if (pt) {
      s.appendChild(svg('circle', { cx: X(pt[0]), cy: Y(pt[1]), r: 6, class: 'pt' }));
      const right = X(pt[0]) < W - 120;
      s.appendChild(svg('text', { x: X(pt[0]) + (right ? 10 : -10), y: Y(pt[1]) + (Y(pt[1]) < pt0 + 24 ? 18 : -10), 'text-anchor': right ? 'start' : 'end', class: 'ptl' }, '(' + Lab.fmtVal(pt[0]) + ', ' + Lab.fmtVal(pt[1]) + ')'));
    }
    return s;
  }

  /* ================================================================ the lab */
  function rowLab() {
    const fresh = () => Object.assign({ v: 1, tool: { t: 'add', i: 1, j: 0, k: '-1' }, histAll: false }, presetState(DEFAULT));
    let st = load();
    let root = null, G = null, note = '';
    const ctl = {}, P = {}, W = {}, T = {};
    const save = () => Lab.store.set(KEY, st);

    /* ---------------------------------------------------------- state */
    function okRows(rows, aug) {
      if (!Array.isArray(rows) || !rows.length || rows.length > MAX_ROWS || !Array.isArray(rows[0])) return false;
      const nc = rows[0].length;
      if (nc < (aug ? 2 : 1) || nc > MAX_COLS) return false;
      return rows.every(r => Array.isArray(r) && r.length === nc && r.every(x => typeof x === 'string'));
    }
    function okOps(ops, m) {
      if (!Array.isArray(ops) || ops.length > MAX_OPS) return false;
      return ops.every(e => {
        if (!e || !['swap', 'scale', 'add'].includes(e.t) || !Number.isInteger(e.i) || e.i < 0 || e.i >= m) return false;
        if (e.t !== 'scale' && (!Number.isInteger(e.j) || e.j < 0 || e.j >= m || e.j === e.i)) return false;
        if (e.t === 'swap') return true;
        const k = parseCell(e.k);
        return !!k && !k.isZero();
      });
    }
    function load() {
      const s = Lab.store.get(KEY, null);
      if (!s || typeof s !== 'object' || !okRows(s.rows, s.aug !== false)) return fresh();
      // a saved example that this site does not list starts over from the default lecture example
      const was = s.loaded ? PRESETS.find(p => p.label === s.loaded) : null;
      if (was && hidden(was)) return fresh();
      const out = Object.assign(fresh(), s);
      out.aug = s.aug !== false;
      out.tool = Object.assign(fresh().tool, s.tool && typeof s.tool === 'object' ? s.tool : {});
      if (!out.free || typeof out.free !== 'object') out.free = {};
      if (!okOps(out.ops, out.rows.length)) out.ops = [];
      return out;
    }
    const shape = () => { const m = st.rows.length, nc = st.rows[0].length; return { m, nc, nA: st.aug ? nc - 1 : nc }; };
    const nameT = (j, nA) => (st.names === 'xyz' && nA <= 4 ? 'xyzw'[j] : 'x_{' + (j + 1) + '}');
    const namesT = nA => range(nA).map(j => nameT(j, nA));
    const nameP = (j, nA) => (st.names === 'xyz' && nA <= 4 ? 'xyzw'[j] : 'x' + (j + 1));
    const headT = d => namesT(d.nA).concat(d.aug ? ['b'] : []);
    const opOut = (op, extra) => Object.assign({ t: op.t, i: op.i, j: op.t === 'scale' ? undefined : op.j, k: op.k ? op.k.toString() : undefined }, extra || {});
    const opIn = e => ({ t: e.t, i: e.i, j: e.j, k: e.k != null ? parseCell(e.k) : undefined });

    /* ---------------------------------------------------------- the controls column */
    function presetMenu() {
      const title = GROUPS.some(g => g.items.some(hidden)) ? 'Lecture examples' : 'Lecture examples';
      const sel = h('select', { class: 'field pl-select', 'aria-label': title });
      sel.appendChild(h('option', { value: '', text: '— choose an example —' }));
      // option values are indices into PRESETS; a group is added only when one of its examples is listed
      GROUPS.forEach(g => {
        const shown = g.items.filter(it => !hidden(it));
        if (!shown.length) return;
        const og = h('optgroup', { label: g.label });
        shown.forEach(it => og.appendChild(h('option', { value: String(PRESETS.indexOf(it)), text: it.label })));
        sel.appendChild(og);
      });
      const src = h('div', { class: 'pl-hint rr-src' });
      sel.addEventListener('change', () => {
        const it = sel.value === '' ? null : PRESETS[+sel.value];
        if (!it || hidden(it)) { Lab.setHTML(src, ''); return; }
        Object.assign(st, presetState(it));
        note = '';
        showPreset(); buildSide(); buildTool(); draw();
      });
      const wrap = h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: title }), sel, src);
      wrap.select = sel;
      wrap.src = src;
      return wrap;
    }
    function showPreset() {
      const k = st.loaded ? PRESETS.findIndex(p => p.label === st.loaded && !hidden(p)) : -1;
      ctl.pre.select.value = k >= 0 ? String(k) : '';
      Lab.setHTML(ctl.pre.src, k >= 0 ? 'From: ' + PRESETS[k].source : '');
    }
    function touched() { if (st.loaded) { st.loaded = null; showPreset(); } }
    function numSeg(label, lo, hi, val, fn) {
      const seg = Lab.seg(range(hi - lo + 1).map(k => ({ label: String(lo + k), value: lo + k })), val, fn);
      seg.classList.add('rr-segn');
      seg.style.setProperty('--k', hi - lo + 1);
      seg.setAttribute('aria-label', label);
      return h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: label }), seg);
    }
    function buildSide() {
      const box = ctl.dyn;
      Lab.clear(box);
      const { m, nc, nA } = shape();
      box.appendChild(K.group('1 · Your matrix'));
      box.appendChild(numSeg('Equations (rows)', 1, MAX_ROWS, m, v => resize(v, null)));
      box.appendChild(st.aug ? numSeg('Unknowns (columns of A)', 1, MAX_COLS - 1, nA, v => resize(null, v)) : numSeg('Columns', 1, MAX_COLS, nc, v => resize(null, v)));
      box.appendChild(K.toggle({ label: 'The last column is ' + tx('b') + ': an augmented matrix ' + tx('[A\\mid b]'), value: st.aug, onChange: setAug }));
      if (nA <= 4) {
        const ns = Lab.seg([{ label: tx('x_1,x_2,x_3,\\dots'), value: 'idx' }, { label: tx('x,y,z,w'), value: 'xyz' }], st.names, v => { st.names = v; save(); buildSide(); buildTool(); draw(); });
        box.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Names of the unknowns' }), ns));
      }
      const ed = h('div', { class: 'rr-ed' });
      ed.style.gridTemplateColumns = 'auto repeat(' + nA + ', minmax(0, 1fr))' + (st.aug ? ' 8px minmax(0, 1fr)' : '');
      ed.appendChild(h('span'));
      namesT(nA).forEach(n => ed.appendChild(h('div', { class: 'rr-ch', html: tx(n) })));
      if (st.aug) ed.append(h('span'), h('div', { class: 'rr-ch', html: tx('b') }));
      ctl.cells = [];
      st.rows.forEach((row, i) => {
        ed.appendChild(h('div', { class: 'rr-rl', html: tx(RT(i)) }));
        row.forEach((s, j) => {
          if (st.aug && j === nA) ed.appendChild(h('div', { class: 'rr-sep' }));
          const inp = h('input', { class: 'field mono rr-cell', type: 'text', value: s, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', enterkeyhint: 'next',
            'aria-label': 'Row ' + (i + 1) + ', ' + (st.aug && j === nA ? 'right side b' : 'coefficient of ' + nameP(j, nA)) });
          inp.addEventListener('input', onCellSoon);
          inp.addEventListener('keydown', ev => {
            if (ev.key !== 'Enter') return;
            ev.preventDefault();
            const k = ctl.cells.indexOf(inp);
            if (ctl.cells[k + 1]) ctl.cells[k + 1].focus(); else inp.blur();
          });
          ctl.cells.push(inp);
          ed.appendChild(inp);
        });
      });
      ctl.msg = h('div', { class: 'pl-hint' });
      box.appendChild(h('div', { class: 'pl-field' },
        h('label', { class: 'pl-label', html: st.aug ? 'Type ' + tx('[A\\mid b]') + ': the coefficients left of the bar, the right sides ' + tx('b') + ' after it' : 'Type the matrix ' + tx('A') }),
        h('div', { class: 'rr-edwrap' }, ed), ctl.msg));
      box.appendChild(K.note('Entries can be whole numbers (−3), fractions (2/3) or decimals (0.5 is kept exactly as 1/2). Changing an entry starts the row operations again.', 'pl-hint'));
    }
    const onCellSoon = Lab.debounce(onCell, 250);
    function onCell() {
      const { m, nc } = shape();
      if (!ctl.cells || ctl.cells.length !== m * nc) return;
      const rows = range(m).map(i => range(nc).map(j => ctl.cells[i * nc + j].value.trim()));
      if (JSON.stringify(rows) === JSON.stringify(st.rows)) return;
      st.rows = rows;
      if (st.ops.length) note = 'You changed the matrix, so the row operations started again.';
      st.ops = [];
      touched();
      draw();
    }
    function resize(mNew, nNew) {
      const rows = st.rows.map(r => r.slice());
      let next = rows;
      if (nNew != null) {
        next = rows.map(r => {
          const A = st.aug ? r.slice(0, -1) : r.slice();
          while (A.length < nNew) A.push('0');
          A.length = nNew;
          return st.aug ? A.concat([r[r.length - 1]]) : A;
        });
      }
      const m = mNew || next.length;
      while (next.length < m) next.push(next[0].map(() => '0'));
      next.length = m;
      if (JSON.stringify(next) === JSON.stringify(st.rows)) return;
      st.rows = next;
      st.ops = [];
      note = '';
      touched(); buildSide(); buildTool(); draw();
    }
    function setAug(v) {
      st.aug = v;
      if (v && st.rows[0].length < 2) st.rows = st.rows.map(r => r.concat(['0']));
      st.ops = [];
      note = '';
      touched(); buildSide(); buildTool(); draw();
    }

    /* ---------------------------------------------------------- the work area: Gaussian elimination and the tool */
    function buildWork() {
      W.cap = h('div', { class: 'rr-cap' });
      W.mat = h('div');
      W.eqs = h('div', { class: 'rr-eqs' });
      W.undo = Lab.button(Lab.icon('arrowLeft') + '<span>Undo</span>', undo, 'btn');
      W.nextB = Lab.button('<span>Next step</span>' + Lab.icon('arrowRight'), stepOnce, 'btn primary rr-nextb');
      W.refB = Lab.button('To REF', () => runTo('ref'), 'btn');
      W.rrefB = Lab.button('To RREF', () => runTo('rref'), 'btn');
      W.next = h('div', { class: 'rr-next' });
      W.tool = h('div', { class: 'rr-tool' });
      P.work.body.append(W.cap, h('div', { class: 'rr-stage' }, W.mat, W.eqs),
        h('div', { class: 'rr-gh', html: '<b>Gaussian elimination</b>, one operation at a time (L2.5, L2.6):' }),
        h('div', { class: 'rr-btns' }, W.undo, W.nextB, W.refB, W.rrefB), W.next, W.tool);
    }
    function buildTool() {
      const { m } = shape();
      const t = st.tool;
      if (!['swap', 'scale', 'add'].includes(t.t)) t.t = 'add';
      if (!(Number.isInteger(t.i) && t.i >= 0 && t.i < m)) t.i = 0;
      if (!(Number.isInteger(t.j) && t.j >= 0 && t.j < m)) t.j = m > 1 ? (t.i === 0 ? 1 : 0) : 0;
      if (typeof t.k !== 'string') t.k = '1';
      Lab.clear(W.tool);
      T.type = Lab.seg([{ label: 'Swap two rows', value: 'swap' }, { label: 'Multiply a row', value: 'scale' }, { label: 'Add a multiple', value: 'add' }], t.t, v => { t.t = v; save(); updateTool(); });
      T.type.classList.add('rr-segn');
      T.type.style.setProperty('--k', 3);
      T.type.setAttribute('aria-label', 'Type of row operation');
      const rowSeg = (val, fn, label) => {
        const sg = Lab.seg(range(m).map(i => ({ label: tx(RT(i)), value: i })), val, fn);
        sg.classList.add('rr-segn');
        sg.style.setProperty('--k', m);
        sg.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-label', label + ' ' + (i + 1)));
        return sg;
      };
      T.iSeg = rowSeg(t.i, v => { t.i = v; save(); updateTool(); }, 'Row');
      T.jSeg = rowSeg(t.j, v => { t.j = v; save(); updateTool(); }, 'Other row');
      T.iLab = h('div', { class: 'rr-tl' });
      T.jLab = h('div', { class: 'rr-tl' });
      T.kLab = h('div', { class: 'rr-tl' });
      T.k = h('input', { class: 'field mono rr-k', type: 'text', value: t.k, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', enterkeyhint: 'done', 'aria-label': 'The number k' });
      T.k.addEventListener('input', () => { t.k = T.k.value; save(); updateTool(); });
      T.k.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); applyTool(); } });
      T.iRow = h('div', { class: 'rr-trow' }, T.iLab, T.iSeg);
      T.jRow = h('div', { class: 'rr-trow' }, T.jLab, T.jSeg);
      T.kRow = h('div', { class: 'rr-trow' }, T.kLab, h('div', {}, T.k));
      T.prev = h('div', { class: 'rr-prev' });
      T.apply = Lab.button('Apply', applyTool, 'btn primary');
      T.fill = Lab.button('Fill in the next elimination step', fillNext, 'btn soft');
      W.tool.append(h('div', { class: 'rr-gh', html: '<b>Your own row operation</b>, any of the three types:' }), T.type, T.iRow, T.jRow, T.kRow, T.prev, h('div', { class: 'rr-apply' }, T.apply, T.fill));
      updateTool();
    }
    /** The operation described by the tool, or the reason it cannot be applied. */
    function readTool() {
      const t = st.tool, { m } = shape();
      if (t.t !== 'scale' && m < 2) return { err: 'With one row there is nothing to swap or add: use “Multiply a row”, or add a row on the left.' };
      if (t.t !== 'scale' && t.i === t.j) return { err: 'Pick two different rows.' };
      if (t.t === 'swap') return { op: { t: 'swap', i: t.i, j: t.j } };
      const k = parseCell(t.k);
      if (!k) return { err: 'Type the number ' + tx('k') + ', for example 3, -2, 1/3 or 0.5.', badK: true };
      if (k.isZero()) return { err: t.t === 'scale' ? 'Multiplying a row by 0 is not allowed: it wipes the row out, that cannot be undone, and the solutions could change.' : 'With ' + tx('k=0') + ' nothing changes.', badK: true };
      return { op: { t: t.t, i: t.i, j: t.j, k } };
    }
    function updateTool() {
      if (!T.type) return;
      const t = st.tool;
      T.jRow.hidden = t.t === 'scale';
      T.kRow.hidden = t.t === 'swap';
      Lab.setHTML(T.iLab, t.t === 'swap' ? 'Swap' : t.t === 'scale' ? 'Row' : 'Change');
      Lab.setHTML(T.jLab, t.t === 'swap' ? 'with' : 'add ' + tx('k') + ' ×');
      Lab.setHTML(T.kLab, t.t === 'scale' ? 'times ' + tx('k') : tx('k') + ' =');
      const r = readTool();
      T.k.classList.toggle('bad', !!r.badK);
      T.apply.disabled = !r.op || !G || st.ops.length >= MAX_OPS;
      T.fill.disabled = !G || !nextStep(G.cur, G.d.nA);
      if (!r.op) { Lab.setHTML(T.prev, '<span class="cbad">' + r.err + '</span>'); return; }
      if (!G) { Lab.setHTML(T.prev, ''); return; }
      const op = r.op, d = G.d, cur = G.cur, after = applyOp(cur, op);
      const tup = row => '(' + row.slice(0, d.nA).map(nt).join(',\\ ') + (d.aug ? '\\mid ' + nt(row[d.nA]) : '') + ')';
      Lab.setHTML(T.prev, tx(opTex(op)) + ' <span class="muted">(' + TYPE[op.t] + ')</span>: ' + (op.t === 'swap' ? tx(RT(op.i)) + ' and ' + tx(RT(op.j)) + ' trade places.' : tx(RT(op.i)) + ' ' + nw(tx(tup(cur[op.i]))) + ' becomes ' + nw(tx(tup(after[op.i]))) + '.'));
    }
    function applyTool() {
      const r = readTool();
      if (!r.op || !G || st.ops.length >= MAX_OPS) return;
      const s = nextStep(G.cur, G.d.nA);
      st.ops.push(opOut(r.op, { auto: false, same: !!s && sameOp(s.op, r.op) }));
      note = '';
      draw();
    }
    function fillNext() {
      if (!G) return;
      const s = nextStep(G.cur, G.d.nA);
      if (!s) return;
      const t = st.tool;
      t.t = s.op.t; t.i = s.op.i;
      if (s.op.j != null) t.j = s.op.j;
      if (s.op.k) t.k = s.op.k.toString();
      T.type.set(t.t); T.iSeg.set(t.i); T.jSeg.set(t.j); T.k.value = t.k;
      save();
      updateTool();
    }
    const autoEntry = s => opOut(s.op, { auto: true, why: s.why, r: s.r, c: s.c, p: s.p });
    function stepOnce() {
      if (!G || st.ops.length >= MAX_OPS) return;
      const s = nextStep(G.cur, G.d.nA);
      if (!s) return;
      st.ops.push(autoEntry(s));
      note = '';
      draw();
    }
    function runTo(which) {
      if (!G) return;
      const list = which === 'ref' ? G.plan.fw : G.plan.fw.concat(G.plan.bw);
      if (!list.length || st.ops.length + list.length > MAX_OPS) return;
      list.forEach(s => st.ops.push(autoEntry(s)));
      note = '';
      draw();
    }
    function undo() { if (st.ops.length) { st.ops.pop(); note = ''; draw(); } }

    /* ---------------------------------------------------------- explanations of one step */
    function whyHtml(e, M, d) {
      const N = namesT(d.nA), R = i => tx(RT(i));
      if (e.why === 'swap') {
        const m = M.length;
        return 'Column ' + (e.c + 1) + ' (' + tx(N[e.c]) + ') is the leftmost column with a non-zero entry in ' + (e.r === m - 1 ? 'row ' + m : 'rows ' + (e.r + 1) + '–' + m) + '. Its top entry, in ' + R(e.r) + ', is 0, so bring up ' + R(e.p) + ', the first row below with a non-zero entry there (' + tx(nt(M[e.p][e.c])) + ').';
      }
      if (e.why === 'one') {
        const a = M[e.r][e.c];
        return 'Get a 1 in the top position: ' + R(e.r) + ' starts with ' + tx(nt(a)) + ' in column ' + (e.c + 1) + ', and ' + txp(np(ONE.div(a)) + '\\cdot ' + np(a) + '=1');
      }
      const a = M[e.p][e.c], abs = a.n < 0 ? a.neg() : a;
      return 'Clear ' + (e.why === 'below' ? 'below' : 'above') + ' the leading 1 of ' + R(e.r) + (e.why === 'above' ? ' (the rightmost leading 1 first, L2.5 at 14:30)' : '') + ': ' + R(e.p) + ' has ' + tx(nt(a)) + ' in column ' + (e.c + 1) + ', and ' + txp(nt(a) + (a.n > 0 ? '-' : '+') + nt(abs) + '\\cdot 1=0');
    }
    function stopHtml(rows, M, d, initial) {
      return tx(RT(rows[0])) + (initial ? ' already reads ' : ' now reads ') + tx('0=' + nt(M[rows[0]][d.nA])) + ': the system has no solution. You could stop here (L2.6 at 26:30); the method still finishes the reduction.';
    }
    /** The arithmetic of one operation, entry by entry. */
    function calcEl(M, op, d) {
      if (op.t === 'scale') return matEl([M[op.i], M[op.i].map(v => v.mul(op.k))], { nA: d.nA, aug: d.aug, labels: [RT(op.i), kTex(op.k) + RT(op.i)], brackets: false, sm: true, rule: 1 });
      const kr = M[op.j].map(v => v.mul(op.k));
      const neg = op.k.n < 0, a = neg ? op.k.neg() : op.k;
      return matEl([M[op.i], kr, M[op.i].map((v, c) => v.add(kr[c]))], { nA: d.nA, aug: d.aug, labels: [RT(op.i), (neg ? '-' : '+') + (isOne(a) ? '' : nt(a)) + RT(op.j), '='], brackets: false, sm: true, rule: 2 });
    }
    const eqsTex = (M, d) => Lab.tex(aligned(M.map(row => lhsTex(row, d.nA, namesT(d.nA)) + '&=' + (d.aug ? nt(row[d.nA]) : '0'))), true);
    const stageEl = (M, d, o) => h('div', { class: 'rr-stage' }, matEl(M, Object.assign({ nA: d.nA, aug: d.aug, labels: true, head: headT(d), leads: true }, o || {})), h('div', { class: 'rr-eqs', html: eqsTex(M, d) }));

    /* ---------------------------------------------------------- compute and draw */
    function compute() {
      const { m, nc, nA } = shape();
      const bad = new Set();
      const A = st.rows.map((r, i) => r.map((s, j) => { const f = parseCell(s); if (!f) bad.add(i * nc + j); return f; }));
      return { m, nc, nA, aug: st.aug, bad, A: bad.size ? null : A };
    }
    function draw() {
      save();
      const d = compute();
      if (ctl.cells) ctl.cells.forEach((inp, k) => inp.classList.toggle('bad', d.bad.has(k)));
      const mainEl = root.querySelector('.pl-main');
      if (!d.A) {
        Lab.setHTML(ctl.msg, '<span class="cbad">Fix the red box' + (d.bad.size > 1 ? 'es' : '') + ': type a number such as 3, -2, 2/3 or 0.5.</span>');
        K.setAnswer(P.answer, { ev: '<span class="cbad">Some entries are not numbers yet (the red boxes on the left).</span>' + (G ? ' The panels below still show your last complete matrix.' : '') });
        mainEl.classList.add('rr-stale');
        return;
      }
      Lab.setHTML(ctl.msg, '');
      mainEl.classList.remove('rr-stale');
      const ops = st.ops.map(opIn);
      const mats = [d.A];
      ops.forEach(op => mats.push(applyOp(mats[mats.length - 1], op)));
      const cur = mats[mats.length - 1];
      const plan = complete(cur, d.nA);
      G = { d, ops, mats, cur, plan, sol: solveR(plan.rref, d.nA, d.aug), ech: echelon(cur, d.nA), whole: d.aug ? echelon(cur, d.nc) : null };
      G.lost = mats.concat([plan.rref]).some(M => M.some(r => r.some(v => v.approx)));
      drawAnswer(); drawWork(); drawLines(); drawHist(); drawForm(); drawVars(); drawSol(); drawCheck(); drawDet();
    }

    function drawAnswer() {
      const { d, ops, sol, ech, plan } = G;
      const N = namesT(d.nA), pn = params(sol.free.length);
      const sys = d.aug ? plural(d.m, 'equation') + ' in ' + plural(d.nA, 'unknown') + ' ' + tx(N.join(',')) : 'the ' + d.m + ' × ' + d.nc + ' matrix ' + tx('A') + ', read as the system ' + tx('Ax=0');
      const state = ech.rref ? 'in reduced row echelon form' : ech.ref ? 'in row echelon form, not yet reduced' : 'not yet in row echelon form';
      const ev = (st.loaded ? 'Example: <b>' + esc(st.loaded) + '</b>. ' : '') + 'Your system: ' + sys + '. After ' + plural(ops.length, 'row operation') + ', the ' + (d.aug ? 'coefficient part is ' : 'matrix is ') + state + '.' + (G.lost ? ' <span class="cbad">Some numbers grew too long to keep exactly and were rounded.</span>' : '');
      // the result on one line for wide screens, one unknown per line for narrow ones
      let big, tall, sub;
      const vals = sol.expr.map(e => linTex(e.c0, e.co, pn));
      if (sol.type === 'none') {
        const b = sol.bad[0];
        big = tall = '\\text{No solution}';
        sub = 'Gaussian elimination ends with row ' + tx(RT(b)) + ' of ' + tx('[R\\mid c]') + ' reading ' + tx('0=' + nt(plan.rref[b][d.nA])) + ', and no choice of the unknowns makes that true (L2.4 at 16:30).';
      } else if (sol.type === 'one') {
        big = '(' + N.join(',') + ')=' + tupleTex(vals);
        tall = aligned(N.map((n, j) => n + '&=' + vals[j]));
        sub = (d.aug ? 'Exactly one solution' : 'Only the trivial solution ' + tx('x=0') + ' (L2.6 at 28:00)') + ': each of the ' + plural(d.nA, 'unknown') + ' has a leading 1 in its column, so every unknown is dependent and none is free' + (d.aug ? ', and no row reads 0 = (a non-zero number).' : '.');
      } else {
        big = '(' + N.join(',') + ')=' + tupleTex(vals) + ',\\ \\ ' + pn.join(',') + '\\in\\mathbb{R}';
        tall = aligned(N.map((n, j) => n + '&=' + vals[j])) + '\\qquad ' + pn.join(',') + '\\in\\mathbb{R}';
        const fr = sol.free.map(f => tx(N[f])).join(', ');
        const many = sol.free.length > 1;
        sub = 'Infinitely many solutions: ' + fr + (many ? ' have' : ' has') + ' no leading 1, so ' + (many ? 'they are independent variables' : 'it is an independent variable') + ' and can take any value ' + tx(pn.join(',')) + '; the dependent variables follow from ' + (many ? 'them' : 'it') + '.';
      }
      K.setAnswer(P.answer, { ev, sub: sub + ' Every number is worked out in the panels below.' });
      P.answer.insertBefore(h('div', { class: 'pl-ans-big rr-wide', html: Lab.tex(big, true) }), P.answer.querySelector('.pl-ans-sub'));
      P.answer.insertBefore(h('div', { class: 'pl-ans-big rr-narrow', html: Lab.tex(tall, true) }), P.answer.querySelector('.pl-ans-sub'));
    }

    function drawWork() {
      const { d, ops, cur, plan, mats } = G;
      setTitle(P.work, 'Row operations on ' + tx(d.aug ? '[A\\mid b]' : 'A'));
      P.work.sub('Step through Gaussian elimination or type your own operation. An operation acts on a whole row' + (d.aug ? ', ' + tx('b') + ' included (L2.6 at 16:30)' : '') + ', and it never changes the solutions.');
      const e = st.ops[st.ops.length - 1];
      let cap = note ? '<span class="cbad">' + note + '</span> ' : '';
      if (!ops.length) cap += '<b>Step 0:</b> your matrix as typed. Its leading entries are ringed: green when they are 1, amber when not.';
      else {
        const op = ops[ops.length - 1];
        cap += '<b>Step ' + ops.length + ':</b> ' + tx(opTex(op)) + ' <span class="muted">(' + TYPE[op.t] + (e.auto ? ', Gaussian elimination' : ', your operation') + ')</span>. ' +
          (e.auto ? whyHtml(e, mats[ops.length - 1], d) + ' ' : e.same ? 'It is the next step of Gaussian elimination ✓. ' : '') + 'The changed row' + (op.t === 'swap' ? 's are' : ' is') + ' highlighted.';
      }
      Lab.setHTML(W.cap, cap);
      Lab.clear(W.mat);
      W.mat.appendChild(matEl(cur, { nA: d.nA, aug: d.aug, labels: true, head: headT(d), leads: true, hot: e ? changed(e) : [], zb: zeroB(cur, d.nA, d.aug) }));
      Lab.setHTML(W.eqs, eqsTex(cur, d));
      const s = nextStep(cur, d.nA);
      const full = ops.length >= MAX_OPS;
      W.undo.disabled = !ops.length;
      W.nextB.disabled = !s || full;
      W.refB.disabled = !plan.fw.length || ops.length + plan.fw.length > MAX_OPS;
      W.rrefB.disabled = !s || ops.length + plan.fw.length + plan.bw.length > MAX_OPS;
      Lab.setHTML(W.next, s
        ? '<b>Next step:</b> ' + tx(opTex(s.op)) + ' <span class="muted">(' + TYPE[s.op.t] + ')</span>. ' + whyHtml(s, cur, d) + ' <span class="muted">' + (plan.fw.length ? plural(plan.fw.length, 'step') + ' to REF, ' + (plan.fw.length + plan.bw.length) + ' to RREF.' : plural(plan.bw.length, 'step') + ' to RREF.') + '</span>' + (full ? ' <span class="cbad">That is ' + MAX_OPS + ' steps: press Undo or clear the steps first.</span>' : '')
        : '<b>Gaussian elimination is finished:</b> the ' + (d.aug ? 'coefficient part is' : 'matrix is') + ' in reduced row echelon form. Press <b>Undo</b> to go back a step.');
      updateTool();
    }

    function drawLines() {
      const { d, cur, mats, sol, ops } = G;
      const show = d.aug && d.nA === 2;
      P.lines.hidden = !show;
      if (!show) return;
      const body = P.lines.body;
      Lab.clear(body);
      const N = namesT(2), plainN = N.map(n => n.replace(/_\{(\d)\}/, (_, k) => SUB[+k - 1]));
      setTitle(P.lines, 'Two unknowns: each equation is a line');
      P.lines.sub('L1.3 (20:30): an equation ' + tx('a' + N[0] + '+b' + N[1] + '=c') + ' is a straight line, and a solution is a point on every line. Crossing lines: one solution; the same line: infinitely many; parallel lines: none.');
      const pt = sol.type === 'one' ? [Number(sol.expr[0].c0), Number(sol.expr[1].c0)] : null;
      body.appendChild(linePlot(cur, ops.length ? mats[0] : null, pt, plainN));
      const notes = [];
      cur.forEach((r, i) => { if (r[0].isZero() && r[1].isZero()) notes.push(tx(RT(i)) + ' reads ' + tx('0=' + nt(r[2])) + (r[2].isZero() ? ': every point fits it, so it draws no line.' : ': no point fits it.')); });
      const what = sol.type === 'one' ? 'The lines cross at ' + tx('(' + N.join(',') + ')=' + tupleTex(sol.expr.map(e => nt(e.c0)))) + ': the solution.' : sol.type === 'many' ? 'Every line drawn is the same line, so every point on it is a solution.' : 'No point lies on every line' + (notes.length ? '.' : ': the lines are parallel.');
      body.appendChild(K.note('Solid: the rows of the current matrix' + (ops.length ? '; dashed: your original equations. A row operation swaps one line for another through the same common points, so the solution never moves.' : '.') + ' ' + what + (notes.length ? ' ' + notes.join(' ') : ''), 'small muted'));
    }

    function drawHist() {
      const { d, ops, mats } = G;
      const body = P.hist.body;
      Lab.clear(body);
      setTitle(P.hist, 'Every step, with the matrix after it');
      P.hist.sub('The types of L2.5 (1:30): type 1 swaps two rows, type 2 multiplies a row by a non-zero number, type 3 adds a multiple of one row to another. The changed row is highlighted; open “Entry by entry” for the arithmetic.');
      const card = o => {
        const c = h('div', { class: 'rr-card' + (o.last ? ' last' : '') });
        c.appendChild(h('div', { class: 'hd' }, h('span', { class: 'num', text: String(o.k) }), h('span', { html: o.head })));
        if (o.why) c.appendChild(h('div', { class: 'why', html: o.why }));
        if (o.stop) c.appendChild(h('div', { class: 'stop', html: o.stop }));
        c.appendChild(matEl(o.M, { nA: d.nA, aug: d.aug, labels: true, sm: true, hot: o.hot || [], zb: zeroB(o.M, d.nA, d.aug) }));
        if (o.extra) c.appendChild(o.extra);
        return c;
      };
      const z0 = zeroB(mats[0], d.nA, d.aug);
      const cards = [card({ k: 0, head: '<b>Your matrix</b>', M: mats[0], last: !ops.length, stop: z0.length ? stopHtml(z0, mats[0], d, true) : '' })];
      let seen = z0.length > 0;
      ops.forEach((op, k) => {
        const e = st.ops[k], after = mats[k + 1], zb = zeroB(after, d.nA, d.aug);
        const stop = !seen && zb.length ? stopHtml(zb, after, d, false) : '';
        if (zb.length) seen = true;
        cards.push(card({ k: k + 1, head: tx(opTex(op)) + ' <span class="ty">' + TYPE[op.t] + '</span>', M: after, hot: changed(e), last: k === ops.length - 1, stop,
          why: e.auto ? whyHtml(e, mats[k], d) : 'Your operation' + (e.same ? ' — the next step of Gaussian elimination ✓' : '') + '.',
          extra: op.t === 'swap' ? null : details('Entry by entry', calcEl(mats[k], op, d)) }));
      });
      const SHOW = 6;
      const grid = h('div', { class: 'rr-hist' });
      if (cards.length > SHOW + 1 && !st.histAll) {
        const hidden = cards.length - 1 - SHOW;
        grid.append(cards[0], h('div', { class: 'rr-card gap' }, Lab.button('Show the ' + plural(hidden, 'earlier step'), () => { st.histAll = true; save(); drawHist(); }, 'btn soft')));
        cards.slice(cards.length - SHOW).forEach(c => grid.appendChild(c));
      } else cards.forEach(c => grid.appendChild(c));
      body.appendChild(grid);
      const tools = h('div', { class: 'rr-apply' });
      if (!ops.length) body.appendChild(K.note('No steps yet: press <b>Next step</b>, <b>To REF</b> or <b>To RREF</b>, or apply your own operation.', 'small muted'));
      else tools.appendChild(Lab.button('Clear all steps', () => { st.ops = []; note = ''; draw(); }, 'btn'));
      if (st.histAll && cards.length > SHOW + 1) tools.appendChild(Lab.button('Show only the last ' + SHOW, () => { st.histAll = false; save(); drawHist(); }, 'btn ghost'));
      if (tools.childNodes.length) body.appendChild(tools);
    }

    function drawForm() {
      const { d, cur, ech, whole } = G;
      const body = P.form.body;
      Lab.clear(body);
      const R = i => tx(RT(i));
      setTitle(P.form, 'Is the current matrix in row echelon form?');
      P.form.sub('The rules of L2.4 (6:00–10:30)' + (d.aug ? ', checked on the coefficient part ' + tx('A') + ' (left of the bar): Gaussian elimination brings that part to RREF (L2.6 at 10:30).' : '.') + ' Leading entries are ringed: green when they are 1, amber when not.');
      body.appendChild(h('div', { class: 'rr-badges' }, badge('REF', ech.ref), badge('RREF', ech.rref)));
      body.appendChild(matEl(cur, { nA: d.nA, aug: d.aug, labels: true, head: headT(d), leads: true, zb: zeroB(cur, d.nA, d.aug) }));
      const lim = (list, n) => (list.length > n ? list.slice(0, n).join('; ') + '; …' : list.join('; '));
      const verdict = (name, rules, ok) => '<br><b>' + name + '</b> (rules ' + rules + '): ' + (ok ? '<span class="cgood">yes ✓</span>' : '<span class="cbad">not yet ✗</span>');
      const steps = [
        { html: markTex(!ech.notOne.length) + ' <b>Rule 1.</b> The first non-zero entry of each non-zero row, its <i>leading entry</i>, is 1.' + (ech.notOne.length ? ' Not yet: ' + lim(ech.notOne.map(i => R(i) + ' starts with ' + tx(nt(cur[i][ech.leads[i]]))), 4) + '.' : '') },
        { html: markTex(!ech.order.length) + ' <b>Rule 2.</b> Each leading entry is in a column to the right of the leading entry of the row above.' + (ech.order.length ? ' Not yet: ' + lim(ech.order.map(o => R(o.b) + ' has its leading entry in column ' + (ech.leads[o.b] + 1) + ', not to the right of column ' + (ech.leads[o.a] + 1) + ' (' + R(o.a) + ')'), 3) + '.' : '') },
        { html: markTex(!ech.zeros.length) + ' <b>Rule 3.</b> Rows of zeros' + (d.aug ? ' (in ' + tx('A') + ')' : '') + ' are at the bottom.' + (ech.zeros.length ? ' Not yet: ' + lim(ech.zeros.map(z => R(z.z) + ' is all zeros but ' + R(z.i) + ' below it is not'), 3) + '.' : '') + verdict('Row echelon form', '1–3', ech.ref) },
        { html: (ech.ref ? markTex(!ech.others.length) + ' <b>Rule 4.</b> In a column with a leading 1, every other entry is 0.' + (ech.others.length ? ' Not yet: ' + lim(ech.others.map(o => 'column ' + (o.c + 1) + ' holds the leading 1 of ' + R(o.i) + ' and ' + tx(nt(cur[o.k][o.c])) + ' in ' + R(o.k)), 4) + '.' : '')
          : '<span class="muted">–</span> <b>Rule 4.</b> In a column with a leading 1, every other entry is 0. <span class="muted">It is checked once rules 1–3 hold.</span>') + verdict('Reduced row echelon form', '1–4', ech.rref) },
      ];
      if (d.aug) {
        const zb = zeroB(cur, d.nA, d.aug);
        let s = 'The whole matrix ' + tx('[A\\mid b]') + ', with the ' + tx('b') + ' column: ' + (whole.rref ? 'in RREF.' : whole.ref ? 'in REF, not reduced.' : 'not in REF.');
        if (zb.length) s += ' ' + zb.map(R).join(', ') + (zb.length > 1 ? ' are' : ' is') + ' zero in ' + tx('A') + ' but not in ' + tx('b') + ', so ' + (zb.length > 1 ? 'they read' : 'it reads') + ' ' + tx('0=' + nt(cur[zb[0]][d.nA])) + ': the system has no solution (L2.6 at 25:00).';
        steps.push({ html: s });
      }
      body.appendChild(K.steps(steps));
    }

    function drawVars() {
      const { d, plan, sol } = G;
      const body = P.vars.body;
      Lab.clear(body);
      const N = namesT(d.nA);
      setTitle(P.vars, 'Leading 1s: dependent and independent variables');
      P.vars.sub('L2.4 (19:00): when column ' + tx('i') + ' holds a leading 1, ' + tx('x_i') + ' is a <b>dependent</b> variable; when it does not, ' + tx('x_i') + ' is <b>independent</b> (free to take any value). The columns are read from the reduced form that Gaussian elimination reaches from your matrix; every echelon form of it has its leading 1s in the same columns.');
      const tint = range(d.nA).map(j => (sol.pivCols.includes(j) ? 'dep' : 'free'));
      body.appendChild(matEl(plan.rref, { nA: d.nA, aug: d.aug, labels: true, head: headT(d), leads: true, tint, zb: zeroB(plan.rref, d.nA, d.aug) }));
      const rows = range(d.nA).map(j => {
        const pr = sol.pivRows.find(p => p.c === j);
        return [tx(N[j]), pr ? 'yes, of ' + tx(RT(pr.r)) : 'no', pr ? '<b class="rr-depw">dependent</b>' : '<b class="rr-freew">independent</b>'];
      });
      const nd = sol.pivCols.length, nf = sol.free.length;
      const list = (cols, p) => (cols.length ? txp(cols.map(j => N[j]).join(',\\ '), p) : 'none' + p);
      body.appendChild(K.steps([
        { html: 'Column by column (blue: a leading 1, dependent; orange: no leading 1, independent):', block: Lab.table(['unknown', 'leading 1?', 'so it is'], rows) },
        { html: 'Count: ' + tx('n=' + d.nA) + ' unknowns and ' + plural(nd, 'leading 1') + ', so ' + tx(d.nA + '-' + nd + '=' + nf) + ' independent. Dependent: ' + list(sol.pivCols, ';') + ' independent: ' + list(sol.free, '.') + (sol.type === 'none' ? ' <span class="cbad">But this system has no solution at all (see below).</span>' : '') },
      ]));
    }

    function drawSol() {
      const { d, plan, sol } = G;
      const body = P.sol.body;
      Lab.clear(body);
      G.partEl = null;
      const N = namesT(d.nA), pn = params(sol.free.length);
      setTitle(P.sol, sol.type === 'none' ? 'The solutions: none' : sol.type === 'one' ? (d.aug ? 'The solution: exactly one' : 'The solution: only x = 0') : 'The solutions: infinitely many');
      P.sol.sub('L1.3 (18:00): a system of linear equations has no solution, exactly one, or infinitely many — never exactly two or three.' + (d.aug ? '' : ' A homogeneous system ' + tx('Ax=0') + ' always has the trivial solution ' + tx('x=0') + ' (L2.6 at 27:30).'));
      const more = plan.fw.length + plan.bw.length;
      const steps = [{
        html: 'Gaussian elimination turns ' + (d.aug ? tx('[A\\mid b]') + ' into ' + tx('[R\\mid c]') : tx('A') + ' into ' + tx('R')) + ' with ' + tx('R') + ' in reduced row echelon form (L2.6 at 11:30)' + (more ? ', ' + plural(more, 'more operation') + ' from the current matrix (<b>To RREF</b> shows them).' : '; the current matrix already is it.') + ' The solutions of ' + tx(d.aug ? 'Ax=b' : 'Ax=0') + ' are exactly those of ' + tx(d.aug ? 'Rx=c' : 'Rx=0') + ':',
        block: stageEl(plan.rref, d, { zb: zeroB(plan.rref, d.nA, d.aug) }),
      }];
      const zr = range(d.m).filter(i => lead(plan.rref[i], d.nA) < 0);
      if (sol.type === 'none') {
        const b = sol.bad[0], c = plan.rref[b][d.nA];
        steps.push({ html: '<span class="cbad">✗</span> Row ' + tx(RT(b)) + ' of ' + tx('R') + ' is all zeros but its right side is ' + tx(nt(c)) + '. As an equation it reads', math: N.map(n => '0' + n).join('+') + '=' + nt(c) + ',\\quad\\text{that is}\\quad 0=' + nt(c),
          note: 'No choice of the unknowns makes that true, so the system has no solution (L2.4 at 16:30, L2.6 at 25:00). The next panel shows which of your equations clash.' });
      } else {
        steps.push({ html: zr.length ? '<span class="cgood">✓</span> ' + tx('R') + ' has ' + plural(zr.length, 'row') + ' of zeros, and ' + (zr.length > 1 ? 'their right sides are' : 'its right side is') + ' 0: ' + tx('0=0') + ' puts no condition on the unknowns.' : '<span class="cgood">✓</span> ' + tx('R') + ' has no row of zeros, so no equation reads 0 = (a non-zero number).' });
        if (sol.type === 'one') backSub(steps, d, N);
        else general(steps, d, N, pn);
      }
      body.appendChild(K.steps(steps));
      if (sol.type === 'many') updateParticular();
    }
    function backSub(steps, d, N) {
      const { cur, plan, ech, sol } = G;
      const useCur = ech.ref;
      const E = useCur ? cur : plan.ref;
      steps.push({ html: '<b>Back substitution.</b> Start from ' + (useCur ? 'the current matrix (it is in row echelon form)' : 'the row echelon form that Gaussian elimination reaches from the current matrix (' + plural(plan.fw.length, 'more step') + ', <b>To REF</b>)') + ', solve its last equation, then go up one row at a time:', block: stageEl(E, d) });
      const val = range(d.nA).map(() => ZERO);
      const lines = [];
      const piv = [];
      E.forEach((row, i) => { const c = lead(row, d.nA); if (c >= 0) piv.push({ r: i, c }); });
      for (let q = piv.length - 1; q >= 0; q--) {
        const { r, c } = piv[q];
        const rhs = d.aug ? E[r][d.nA] : ZERO;
        const others = range(d.nA).filter(j => j > c && !E[r][j].isZero());
        let v = rhs;
        others.forEach(j => { v = v.sub(E[r][j].mul(val[j])); });
        val[c] = v;
        const eq = lhsTex(E[r], d.nA, N) + '=' + nt(rhs);
        lines.push(others.length ? eq + '&\\ \\Rightarrow\\ ' + N[c] + '=' + nt(rhs) + others.map(j => '-' + np(E[r][j]) + '\\cdot ' + np(val[j])).join('') + '=' + nt(v) : eq + '&');
      }
      steps.push({ html: 'From the bottom up' + (lines.length > 1 ? ', each value found is put into the row above' : '') + ':', math: aligned(lines) });
      steps.push({ html: 'So ' + txp('(' + N.join(',') + ')=' + tupleTex(val.map(nt))) + ' The reduced form ' + tx('R') + ' says the same at once: its rows read ' + txp(sol.pivRows.map(p => N[p.c] + '=' + nt(d.aug ? plan.rref[p.r][d.nA] : ZERO)).join(',\\ ')) });
    }
    function general(steps, d, N, pn) {
      const { plan, sol } = G;
      const Rm = plan.rref;
      steps.push({ html: '<b>Independent variables</b> get any value (L2.4 at 21:00): ' + sol.free.map((f, k) => tx(N[f] + '=' + pn[k])).join(', ') + '. <span class="muted">(The lecture calls the value ' + tx('c') + '; here it is ' + tx('t') + ', so it does not clash with the column ' + tx('c') + ' of ' + tx('[R\\mid c]') + '.)</span>' });
      const lines = sol.pivRows.map(({ r, c }) => {
        const rhs = d.aug ? Rm[r][d.nA] : ZERO;
        const fr = sol.free.filter(f => !Rm[r][f].isZero());
        const eq = lhsTex(Rm[r], d.nA, N) + '=' + nt(rhs);
        if (!fr.length) return eq + '&';
        const e = sol.expr[c];
        return eq + '&\\ \\Rightarrow\\ ' + N[c] + '=' + linTex(rhs, fr.map(f => Rm[r][f].neg()), fr.map(f => N[f])) + '=' + linTex(e.c0, e.co, pn);
      });
      steps.push({ html: '<b>Dependent variables:</b> each one sits in exactly one equation of ' + tx(d.aug ? 'Rx=c' : 'Rx=0') + ' (L2.4 at 21:30). Keep it on the left and move the rest to the right:', math: aligned(lines) });
      steps.push({ html: 'All the solutions, one for each choice of ' + tx(pn.join(',')) + ':', math: '(' + N.join(',') + ')=' + tupleTex(sol.expr.map(e => linTex(e.c0, e.co, pn))) + ',\\quad ' + pn.join(',') + '\\in\\mathbb{R}' });
      const box = h('div', { class: 'rr-free' });
      sol.free.forEach((f, k) => {
        const inp = h('input', { class: 'field mono', type: 'text', value: st.free[f] != null ? String(st.free[f]) : '1', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', 'aria-label': 'Value of ' + nameP(f, d.nA) });
        inp.addEventListener('input', () => { st.free[f] = inp.value; save(); updateParticular(); drawCheck(); });
        box.appendChild(h('label', {}, h('span', { html: tx(N[f] + '=' + pn[k] + '=') }), inp));
      });
      G.partEl = h('div', { class: 'rr-part' });
      steps.push({ html: '<b>One particular solution:</b> choose ' + (sol.free.length > 1 ? 'values' : 'a value') + ' (fractions are fine):', block: h('div', {}, box, G.partEl) });
    }
    /** The values of the free variables typed in the solutions panel, and the solution they give. */
    function particular() {
      const { sol } = G;
      const tv = sol.free.map(f => parseCell(st.free[f] != null ? st.free[f] : '1'));
      if (tv.some(v => !v)) return { bad: sol.free.filter((_, k) => !tv[k]) };
      return { tv, x: sol.expr.map(e => e.co.reduce((s, a, k) => s.add(a.mul(tv[k])), e.c0)) };
    }
    function updateParticular() {
      if (!G || !G.partEl) return;
      const { d, sol } = G, N = namesT(d.nA), pn = params(sol.free.length);
      const p = particular();
      Lab.$$('.rr-free input', P.sol.body).forEach((inp, k) => inp.classList.toggle('bad', !!p.bad && p.bad.includes(sol.free[k])));
      if (p.bad) { Lab.setHTML(G.partEl, '<span class="cbad">Type a number, for example 0, 5, -2 or 1/2.</span>'); return; }
      const sub = e => {
        let s = e.c0.isZero() ? '' : nt(e.c0);
        e.co.forEach((a, k) => {
          if (a.isZero()) return;
          const neg = a.n < 0, abs = neg ? a.neg() : a;
          s += (s ? (neg ? '-' : '+') : neg ? '-' : '') + (isOne(abs) ? '' : nt(abs) + '\\cdot ') + np(p.tv[k]);
        });
        return s || '0';
      };
      // one line per unknown: a free one is its own value, a dependent one is worked out from them
      const lines = range(d.nA).map(j => {
        const k = sol.free.indexOf(j), e = sol.expr[j];
        if (k >= 0) return N[j] + '&=' + pn[k] + '=' + nt(p.x[j]);
        if (e.co.every(a => a.isZero())) return N[j] + '&=' + nt(p.x[j]);
        return N[j] + '&=' + linTex(e.c0, e.co, pn) + '=' + sub(e) + '=' + nt(p.x[j]);
      });
      Lab.setHTML(G.partEl, Lab.tex(aligned(lines), true) + 'So ' + tx('(' + N.join(',') + ')=' + tupleTex(p.x.map(nt))) + ' is one solution; it is checked in the next panel.');
    }

    function drawCheck() {
      const { d, sol, mats } = G;
      const A0 = mats[0];
      const body = P.check.body;
      Lab.clear(body);
      const N = namesT(d.nA), pn = params(sol.free.length);
      const rhs = i => (d.aug ? A0[i][d.nA] : ZERO);
      setTitle(P.check, sol.type === 'none' ? 'Why there is no solution: your equations clash' : 'Check: put the solution back into your equations');
      P.check.sub(sol.type === 'none' ? 'Every row operation adds multiples of your equations, so each row of the final matrix is a mix of them. The bad row is a mix whose unknowns all cancel.' : 'Your original equations, as you typed them. Each left side must come out equal to its right side.');
      const numLine = (row, x, b) => {
        const js = range(d.nA).filter(j => !row[j].isZero());
        if (!js.length) return '0&=' + nt(b) + (b.isZero() ? '\\ \\checkmark' : '\\ \\times');
        const prods = js.map(j => row[j].mul(x[j]));
        const tot = F.sum(prods);
        return js.map(j => np(row[j]) + '\\cdot ' + np(x[j])).join('+') + '&=' + (js.length > 1 ? sumTex(prods) + '=' : '') + nt(tot) + (tot.eq(b) ? '\\ \\checkmark' : '\\ne ' + nt(b));
      };
      const steps = [];
      if (sol.type === 'one') {
        const x = sol.expr.map(e => e.c0);
        steps.push({ html: 'Put ' + tx('(' + N.join(',') + ')=' + tupleTex(x.map(nt))) + ' into each of your ' + plural(d.m, 'equation') + ':', math: aligned(A0.map((row, i) => numLine(row, x, rhs(i)))) });
        steps.push({ html: 'Every equation holds <span class="cgood">✓</span>, so the solution is right.' });
      } else if (sol.type === 'many') {
        const genLine = (row, b) => {
          const js = range(d.nA).filter(j => !row[j].isZero());
          if (!js.length) return '0&=' + nt(b) + (b.isZero() ? '\\ \\checkmark' : '\\ \\times');
          const part = j => {
            const e = sol.expr[j], s = linTex(e.c0, e.co, pn);
            const terms = e.co.filter(a => !a.isZero()).length + (e.c0.isZero() ? 0 : 1);
            return np(row[j]) + '\\cdot ' + (terms <= 1 && s[0] !== '-' ? s : '(' + s + ')');
          };
          // the numbers without a parameter, then the coefficient of each parameter, each added up
          const consts = js.map(j => row[j].mul(sol.expr[j].c0)).filter(f => !f.isZero());
          const c0 = F.sum(consts);
          const groups = sol.free.map((_, k) => js.map(j => row[j].mul(sol.expr[j].co[k])).filter(f => !f.isZero()));
          const hasT = groups.some(g => g.length);
          let mid = consts.length ? (hasT && consts.length > 1 ? '(' + sumTex(consts) + ')' : sumTex(consts)) : hasT ? '' : '0';
          groups.forEach((list, k) => { if (list.length) mid += (mid ? '+' : '') + '(' + sumTex(list) + ')' + pn[k]; });
          const zeroT = groups.every(list => F.sum(list).isZero());
          return js.map(part).join('+') + '&=' + mid + (mid === nt(c0) ? '' : '=' + nt(c0)) + (zeroT && c0.eq(b) ? '\\ \\checkmark' : '\\ne ' + nt(b));
        };
        steps.push({ html: '<b>All the solutions at once.</b> Put the general solution into each equation: the parts with ' + tx(pn.join(',')) + ' cancel, and what is left is the right side:', math: aligned(A0.map((row, i) => genLine(row, rhs(i)))) });
        const p = particular();
        if (!p.bad) steps.push({ html: '<b>Your particular solution</b> ' + tx('(' + N.join(',') + ')=' + tupleTex(p.x.map(nt))) + ':', math: aligned(A0.map((row, i) => numLine(row, p.x, rhs(i)))) });
      } else {
        // the row operations as one matrix: row k of the final matrix = Σ T[k][i] · (equation i)
        let Tm = range(d.m).map(i => range(d.m).map(j => (i === j ? ONE : ZERO)));
        G.ops.concat(G.plan.fw.map(s => s.op), G.plan.bw.map(s => s.op)).forEach(op => { Tm = applyOp(Tm, op); });
        const b = sol.bad[0], lam = Tm[b];
        const used = range(d.m).filter(i => !lam[i].isZero());
        const eqN = used.map(i => '(\\text{eq. }' + (i + 1) + ')');
        steps.push({ html: 'Following all the operations from your matrix to ' + tx('[R\\mid c]') + ', row ' + tx(RT(b)) + ' is this mix of your equations:', math: RT(b) + '=' + linTex(ZERO, used.map(i => lam[i]), eqN) });
        const varRows = range(d.nA).map(j => [tx(N[j]), nw(tx(used.map(i => np(lam[i]) + '\\cdot ' + np(A0[i][j])).join('+') + '=' + nt(F.sum(used.map(i => lam[i].mul(A0[i][j]))))))]);
        steps.push({ html: '<b>Left sides.</b> With these multipliers the coefficients of every unknown add up to 0:', block: Lab.table(['unknown', 'its coefficients, mixed'], varRows) });
        const rs = F.sum(used.map(i => lam[i].mul(A0[i][d.nA])));
        steps.push({ html: '<b>Right sides.</b> The same mix of the right sides:', math: used.map(i => np(lam[i]) + '\\cdot ' + np(A0[i][d.nA])).join('+') + '=' + nt(rs) });
        steps.push({ html: 'So any solution would also solve ' + tx('0=' + nt(rs)) + ', which is false. The equations contradict each other: there is no solution to put back.' });
      }
      body.appendChild(K.steps(steps));
    }

    function drawDet() {
      const { d, ops, plan, sol } = G;
      const sq = d.nA === d.m;
      P.det.hidden = !sq;
      if (!sq) return;
      const body = P.det.body;
      Lab.clear(body);
      setTitle(P.det, 'The determinant from the row operations');
      P.det.sub('L2.5 (23:30–29:30): for a square ' + tx('A') + ', row reduction also gives ' + tx('\\det A') + '. Each operation multiplies the determinant by a known number, and an echelon form of a square matrix is upper triangular.');
      const all = ops.map(op => ({ op, todo: false })).concat(plan.fw.map(s => ({ op: s.op, todo: true })));
      const fac = op => (op.t === 'swap' ? F(-1) : op.t === 'scale' ? op.k : ONE);
      const prod = all.reduce((a, o) => a.mul(fac(o.op)), ONE);
      const E = plan.ref;
      const diag = range(d.m).map(i => E[i][i]);
      const detE = diag.reduce((a, f) => a.mul(f), ONE);
      const detA = detE.div(prod);
      const steps = [{ html: 'How each type changes the determinant (L2.5 at 24:00): type 1 (swap two rows) multiplies it by ' + tx('-1') + '; type 2 (' + tx('R_i\\to kR_i') + ') multiplies it by ' + tx('k') + '; type 3 leaves it unchanged.' }];
      if (all.length) {
        const rows = all.map((o, k) => [String(k + 1), nw(tx(opTex(o.op))) + (o.todo ? ' <span class="muted">(still to do)</span>' : ''), TYPE[o.op.t], tx(nt(fac(o.op)))]);
        steps.push({ html: 'From your matrix to its row echelon form' + (plan.fw.length ? ' (the steps so far, then those Gaussian elimination still needs)' : '') + ':', block: Lab.table(['#', 'operation', 'type', 'det multiplied by'], rows) });
        const nonOne = all.map(o => fac(o.op)).filter(f => !isOne(f));
        steps.push({ html: 'So the determinant of the REF is ' + tx('\\det A') + ' times all those factors:', math: '\\det(\\text{REF})=' + (nonOne.length ? nonOne.map(np).join('\\cdot ') + '\\cdot\\det A' + (nonOne.length > 1 ? '=' + kTex(prod) + '\\det A' : '') : '\\det A') });
      } else steps.push({ html: 'Your matrix is already in row echelon form, so no operation is needed: ' + tx('\\det(\\text{REF})=\\det A') + '.' });
      steps.push({ html: 'The REF is upper triangular, so its determinant is the product of its diagonal (L2.5 at 26:00):', math: '\\det(\\text{REF})=' + diag.map(np).join('\\cdot ') + '=' + nt(detE) });
      if (detE.isZero()) steps.push({ html: 'A 0 on the diagonal makes ' + tx('\\det(\\text{REF})=0') + ', and the factors are never 0, so', math: '\\det A=0' });
      else if (isOne(prod)) steps.push({ html: 'The factors multiply to 1, so', math: '\\det A=\\det(\\text{REF})=' + nt(detE) });
      else steps.push({ html: 'Divide by the product of the factors:', math: '\\det A=\\dfrac{\\det(\\text{REF})}{' + nt(prod) + '}=\\dfrac{' + nt(detE) + '}{' + nt(prod) + '}=' + nt(detA) });
      const kind = sol.type === 'none' ? 'none' : sol.type === 'many' ? 'infinitely many' : 'exactly one';
      steps.push({ html: detA.isZero()
        ? tx('\\det A=0') + ': ' + tx('A') + ' is not invertible (L2.3), and its reduced form has a column without a leading 1. ' + (d.aug ? 'So ' + tx('Ax=b') + ' never has exactly one solution: it has none or infinitely many, and for your ' + tx('b') + ': ' + kind + '.' : 'So ' + tx('Ax=0') + ' has infinitely many solutions.')
        : tx('\\det A\\ne 0') + ': ' + tx('A') + ' is invertible (L2.3), so ' + (d.aug ? tx('Ax=b') + ' has exactly one solution for every ' + tx('b') + ', ' + tx('x=A^{-1}b') + ' (L2.6 at 1:00).' :tx('Ax=0') + ' has only the trivial solution.') });
      body.appendChild(K.steps(steps));
    }

    /* ---------------------------------------------------------- mount */
    function mount(el) {
      root = el;
      injectStyle();
      const { side, main } = K.layout(root, 'rr-lab');
      side.appendChild(K.group('Examples'));
      ctl.pre = presetMenu();
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 'rr-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
        st = fresh();
        note = '';
        showPreset(); buildSide(); buildTool(); draw();
      }, 'btn ghost sm')));
      P.answer = K.answer();
      P.work = K.panel('Row operations');
      P.lines = K.panel('Each equation is a line');
      P.hist = K.panel('Every step');
      P.form = K.panel('Row echelon form?');
      P.vars = K.panel('Dependent and independent variables');
      P.sol = K.panel('The solutions');
      P.check = K.panel('Check');
      P.det = K.panel('The determinant');
      main.append(P.answer, P.work, P.lines, P.hist, P.form, P.vars, P.sol, P.check, P.det);
      buildWork();
      root.__rr = { get st() { return st; }, get G() { return G; } };
      showPreset();
      buildSide();
      buildTool();
      draw();
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-m2-rowreduce', course: 'm2', week: 2, weeks: [1, 2], order: 2, ic: 'grid',
    title: 'Row reduction lab', sub: 'Echelon form and Gaussian elimination',
    topics: ['augmented matrix', 'row operations', 'REF', 'RREF', 'leading 1s', 'dependent and independent variables', 'Gaussian elimination', 'back substitution', 'general solution', 'determinant'],
    desc: 'Type your own augmented matrix [A | b], up to 4 × 5. Apply row operations yourself or step through Gaussian elimination one operation at a time, and see the REF and RREF checks, the leading 1s, the dependent and independent variables, the solution and a check in your equations, all in exact fractions.',
    render: el => rowLab().mount(el),
  });
})();
