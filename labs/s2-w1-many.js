/* Playground lab (s2-w1-many) — three or more random variables (Statistics II, Week 1 · L1.5–L1.7).
   The learner gives a joint PMF of 2–5 variables, either typed as a list of tuples or built from an experiment
   (coin tosses, dice, a random number) with each variable typed as an expression of the outcome. From it:
   the marginal of any group (keep / sum), the conditional PMF given any fixed values, the chain rule in two
   orders, slices (one 2-D table per value of a third variable) and the PMF and CDF of one variable.
   A typed table can also get new columns, each a formula of the typed ones (L2.10: G = X1+X2+X3, H = X2*X3);
   every panel then treats them as more variables. Panel 7 counts the cells of a joint range (L1.5: 9^6 for an over).
   Every derived number is shown with its sum or its division, exact fractions first.
   Registers itself with Lab.lab({...}); styles live in assets/css/labs/t2.css (scoped to .mv-lab). */
(function () {
  'use strict';
  const { h, F } = Lab;
  const K = Lab.play;
  const KEY = 'lab:s2-many';
  const MIN_N = 2, MAX_N = 5, MAX_ROWS = 120, MINI_ROWS = 32, SLICE_MAX = 12, MAX_TUPLES = 1000, TABLE_MAX = 200;
  /** new columns (formulas of the typed ones): at most MAX_DER of them, and at most MAX_ALL columns in all */
  const MAX_DER = 3, MAX_ALL = 7;
  const VC = ['v0', 'v1', 'v2', 'v3', 'v4', 'v5', 'v6'];
  const TONE = ['x', 'y', 'z', 'mass', 'mass', 'mass', 'mass'];
  const NAME_RE = /^[A-Za-z]{1,4}[0-9]{0,2}$/;
  const range = n => Array.from({ length: n }, (_, k) => k);
  const tex = (s, display) => Lab.tex(s, !!display);
  const clampInt = (v, lo, hi, def) => (Number.isInteger(v) ? Math.max(lo, Math.min(hi, v)) : def);

  /* ------------------------------------------------------------- small helpers */
  /** Variable name → TeX: X1 → X_{1}, S → S, Max → \mathit{Max}. Names are checked against NAME_RE first. */
  function tn(nm) {
    const m = String(nm).trim().match(/^([A-Za-z]+)([0-9]*)$/);
    if (!m) return '?';
    return (m[1].length === 1 ? m[1] : '\\mathit{' + m[1] + '}') + (m[2] ? '_{' + m[2] + '}' : '');
  }
  const vt = v => Lab.fmtDec(Number(v), 4);          // a value inside TeX (ASCII minus)
  const vh = v => Lab.fmtVal(Number(v));             // a value in plain text
  const keyOf = t => t.map(v => String(Number(v))).join('|');
  const cmpT = (a, b) => { for (let i = 0; i < a.length; i++) { const d = Number(a[i]) - Number(b[i]); if (d) return d; } return 0; };
  const uniqSorted = arr => [...new Set(arr.map(Number))].sort((a, b) => a - b);
  const tupH = t => '(' + t.map(vh).join(', ') + ')';
  const plural = (k, one, many) => k + ' ' + (k === 1 ? one : (many || one + 's'));
  /** "rows 1–4, 7" (1-based) */
  function rowList(idx) {
    const s = idx.map(i => i + 1).sort((a, b) => a - b);
    if (!s.length) return 'no row';
    const parts = [];
    let a = s[0], b = s[0];
    for (let k = 1; k <= s.length; k++) {
      if (k < s.length && s[k] === b + 1) { b = s[k]; continue; }
      parts.push(a === b ? String(a) : b === a + 1 ? a + ', ' + b : a + '–' + b);
      if (k < s.length) { a = s[k]; b = s[k]; }
    }
    return (s.length === 1 ? 'row ' : 'rows ') + parts.join(', ');
  }
  /** ["X_{1}","X_{2}"] → "X1 and X2" rendered */
  function andList(texs) {
    const t = texs.map(x => tex(x));
    return t.length < 2 ? t.join('') : t.slice(0, -1).join(', ') + ' and ' + t[t.length - 1];
  }
  function setTex(vals) {
    const v = vals.length > 12 ? vals.slice(0, 6).map(vt).concat(['\\dots'], vals.slice(-2).map(vt)) : vals.map(vt);
    return '\\{' + v.join(',') + '\\}';
  }
  function commonDen(ps) {
    let D = 1;
    for (const p of ps) {
      if (!(p instanceof Lab.Frac) || p.approx) return null;
      D = (D / Lab.math.gcd(D, p.d)) * p.d;
      if (D > 10000) return null;
    }
    return D > 1 ? D : null;
  }
  /** How the learner typed the probabilities: fractions ('frac') or decimals ('dec'). */
  function styleOf(strs) {
    const s = strs.map(x => String(x));
    if (s.some(x => x.includes('/'))) return 'frac';
    if (s.some(x => /[.%]/.test(x))) return 'dec';
    return 'frac';
  }
  /** Places of a terminating decimal (−1 if the fraction does not terminate). */
  function decPlaces(f) {
    if (!(f instanceof Lab.Frac) || f.approx) return -1;
    let d = f.d, a = 0, b = 0;
    while (d % 2 === 0) { d /= 2; a++; }
    while (d % 5 === 0) { d /= 5; b++; }
    return d === 1 ? Math.max(a, b) : -1;
  }
  function decStr(f, k) {
    if (k === 0) return String(f.n / f.d);
    const scale = Math.pow(10, k);
    const N = Math.round(f.n * (scale / f.d));
    const A = Math.abs(N);
    const fp = String(A % scale).padStart(k, '0').replace(/0+$/, '');
    return (N < 0 ? '-' : '') + Math.floor(A / scale) + (fp ? '.' + fp : '');
  }
  /** Number formatting for one joint PMF: exact fractions, or the learner's decimals when they typed decimals. */
  function makeFmt(style, D) {
    const dec = f => { if (style !== 'dec') return null; const k = decPlaces(f); return k >= 0 && k <= 8 ? decStr(f, k) : null; };
    const pT = f => {
      if (typeof f === 'number') return Lab.fmtDec(f, 6);
      if (f.approx || f.d > 1e9) return Lab.fmtDec(Number(f), 6);
      const d = dec(f);
      return d != null ? d : f.tex();
    };
    /** with the common denominator first, like the lecture: 3/9 = 1/3 */
    const pTD = f => {
      if (style === 'frac' && D && f instanceof Lab.Frac && !f.approx && !f.isZero() && f.d !== D) { const c = f.over(D); if (c) return '\\frac{' + c.n + '}{' + c.d + '}=' + f.tex(); }
      return pT(f);
    };
    const approx = f => {
      if (!(f instanceof Lab.Frac) || f.approx || f.d === 1 || dec(f) != null) return '';
      const k = decPlaces(f);
      return k >= 0 && k <= 4 ? '=' + decStr(f, k) : '\\approx ' + Lab.fmtDec(Number(f), 4);
    };
    /** a probability written with a slash, for fractions inside a big fraction */
    const sl = f => {
      const d = dec(f);
      if (d != null) return d;
      if (f.approx) return Lab.fmtDec(Number(f), 6);
      if (style === 'frac' && D && !f.isZero()) { const c = f.over(D); if (c) return c.n + '/' + c.d; }
      return f.d === 1 ? String(f.n) : f.n + '/' + f.d;
    };
    const pH = f => { const d = dec(f); return d != null ? '<span class="fr-int">' + d + '</span>' : Lab.fmtHtml(f); };
    const plain = f => { const d = dec(f); return d != null ? d : f.approx ? Lab.fmtDec(Number(f), 6) : f.toString(); };
    /** a sum of probabilities, written out: equal terms grouped as "k × v" when there are many */
    const sumT = fs => {
      if (!fs.length) return '0';
      if (fs.length > 4 && fs.every(f => f.eq(fs[0]))) return fs.length + '\\times ' + pT(fs[0]);
      if (fs.length <= 12) return fs.map(pT).join('+');
      const g = [];
      fs.forEach(f => { const e = g.find(x => x.f.eq(f)); if (e) e.k++; else g.push({ f, k: 1 }); });
      if (g.length <= 6) return g.map(x => (x.k > 1 ? x.k + '\\times ' : '') + pT(x.f)).join('+');
      return fs.map(pT).join('+');
    };
    return { pT, pTD, pTA: f => pT(f) + approx(f), pTDA: f => pTD(f) + approx(f), sl, pH, plain, sumT, style, D };
  }
  /** "a + b + c = s": the total is first written over the common denominator of these terms (1/7 + 2/7 = 3/7; 1/9 + 1/9 + 1/9 = 3/9 = 1/3). */
  function sumEqWith(fm, ps, total, approx) {
    if (ps.length <= 1) return approx ? fm.pTDA(total) : fm.pTD(total);
    const loc = fm.style === 'frac' ? makeFmt('frac', commonDen(ps)) : fm;
    return fm.sumT(ps) + '=' + (approx ? loc.pTDA(total) : loc.pTD(total));
  }

  /* --------------------------------------- examples (data copied from the verified lesson files) */
  // L1.6 slide (lessons/l1-6-marginal-many.js): X1, X2 in {0,1}, X3 in {0,1,2}; 9 rows, every row 1/9
  const T9 = [[0, 0, 0], [0, 0, 1], [0, 0, 2], [0, 1, 1], [0, 1, 2], [1, 0, 0], [1, 0, 2], [1, 1, 0], [1, 1, 1]];
  // L1.7 slide (lessons/l1-7-conditioning-many.js): 4 variables, 12 rows in the slide's order, every row 1/12
  const T12 = [[0, 0, 0, 0], [0, 0, 0, 1], [0, 0, 1, 1], [0, 0, 2, 0], [0, 1, 1, 0], [0, 1, 1, 1], [0, 1, 2, 0], [1, 0, 0, 1], [1, 0, 2, 0], [1, 0, 2, 1], [1, 1, 0, 1], [1, 1, 1, 0]];
  const tableRows = (T, p) => T.map(t => ({ t: t.map(String), p }));
  const PRESETS = [
    {
      label: 'L1.5 · Three fair tosses: X1, X2, X3',
      short: 'the three fair tosses of the L1.5 lecture',
      source: 'L1.5 lecture, first example: a fair coin tossed 3 times, X<sub>i</sub> = 1 if toss i is heads, else 0 — 8 tuples of 1/8 each. Loaded with: keep X1 (L1.6: f<sub>X1</sub>(0) = 4 × 1/8 = 1/2) and slices by X3 (as in the L1.5 lesson).',
      set: { mode: 'exp', exp: { kind: 'coins', n: 3, p: '1/2', vars: [['X1', 't1'], ['X2', 't2'], ['X3', 't3']] }, keep: [1, 0, 0], cond: ['keep', 'sum', 'v:1'], chain: { tuple: [1, 0, 1], A: [0, 1, 2], B: [2, 1, 0] }, slice: { c: 0, r: 1, s: 2, view: 'stack' }, graph: { v: 0, mode: 'marg' } },
    },
    {
      label: 'L1.5 · Number 000–999: X first digit, Y mod 2, Z last digit',
      short: 'the random number 000–999 of the L1.5 lecture',
      source: 'L1.5 lecture: a number from 000 to 999 picked uniformly (1000 numbers); X = first digit, Y = the number mod 2, Z = last digit. The lecture’s values: f<sub>XYZ</sub>(0,0,0) = f<sub>XYZ</sub>(1,1,1) = f<sub>XYZ</sub>(8,0,6) = 1/100, f<sub>XYZ</sub>(1,0,1) = 0. Loaded with: keep X (L1.6: P(X = d) = 1/10), Y given Z = 6, and the chain rule at (8, 0, 6).',
      set: { mode: 'exp', exp: { kind: 'number', digits: 3, vars: [['X', 'd1'], ['Y', 'mod(x,2)'], ['Z', 'd3']] }, keep: [1, 0, 0], cond: ['sum', 'keep', 'v:6'], chain: { tuple: [8, 0, 6], A: [0, 1, 2], B: [2, 1, 0] }, slice: { c: 2, r: 0, s: 1, view: 'stack' }, graph: { v: 0, mode: 'marg' } },
    },
    {
      label: 'L1.6 · The 9-row table (X1, X2, X3), each row 1/9',
      short: 'the 9-row table of the L1.6 lecture (slide)',
      source: 'L1.6 lecture, the 9-row table on the slide: X1, X2 in {0,1}, X3 in {0,1,2}, every row 1/9. Loaded with the lecture’s marginal f<sub>X1X2</sub> (L1.6) and its chain rule at (0,0,0) in the orders X3 → X2 → X1 and X1 → X2 → X3 (L1.7).',
      set: { mode: 'table', names: ['X1', 'X2', 'X3'], rows: tableRows(T9, '1/9'), keep: [1, 1, 0], cond: ['keep', 'v:0', 'v:0'], chain: { tuple: [0, 0, 0], A: [2, 1, 0], B: [0, 1, 2] }, slice: { c: 0, r: 1, s: 2, view: 'stack' }, graph: { v: 2, mode: 'marg' } },
    },
    {
      label: 'L1.7 · The 12-row table (X1, …, X4), each row 1/12',
      short: 'the 12-row table of the L1.7 lecture (slide)',
      source: 'L1.7 lecture, the 12-row table on the slide: 4 variables, every row 1/12. Loaded with the lecture’s examples: X1 given X2 = 0 (4/7 and 3/7), the marginal f<sub>X3X4</sub> (f<sub>X3X4</sub>(0,1) = 3/12), the pair (X3, X4) given X1 = 0 as a slice, and the chain rule in the order X4 → X3 → X2 → X1 of the lecture’s derivation (the lecture derives it in symbols; the tuple (0,0,0,1) is this lab’s choice).',
      set: { mode: 'table', names: ['X1', 'X2', 'X3', 'X4'], rows: tableRows(T12, '1/12'), keep: [0, 0, 1, 1], cond: ['keep', 'v:0', 'sum', 'sum'], chain: { tuple: [0, 0, 0, 1], A: [3, 2, 1, 0], B: [0, 1, 2, 3] }, slice: { c: 2, r: 3, s: 0, view: 'given:0' }, graph: { v: 0, mode: 'cond' } },
    },
    {
      label: 'L1.7 lesson · Three tosses and N = number of heads',
      short: 'three tosses and N from the L1.7 lesson',
      source: 'The L1.7 lesson (predict card), not a lecture slide: three fair tosses, X1, X2, X3 = 1 if that toss is heads, N = number of heads. Loaded with P(X1 = 1 | N = 2) = 2/3 and the pair (X1, X2) given N = 2.',
      set: { mode: 'exp', exp: { kind: 'coins', n: 3, p: '1/2', vars: [['X1', 't1'], ['X2', 't2'], ['X3', 't3'], ['N', 'H']] }, keep: [1, 0, 0, 1], cond: ['keep', 'sum', 'sum', 'v:2'], chain: { tuple: [1, 1, 0, 2], A: [3, 0, 1, 2], B: [0, 1, 2, 3] }, slice: { c: 0, r: 1, s: 3, view: 'given:2' }, graph: { v: 0, mode: 'cond' } },
    },
    {
      label: 'L1.5 lesson · X first toss heads, Y heads, Z all the same',
      short: 'the “your turn” tosses of the L1.5 lesson',
      source: 'The L1.5 lesson (“your turn” card), not a lecture slide: three fair tosses, X = 1 if the first toss is heads, Y = number of heads, Z = 1 if all three tosses show the same face. There f<sub>XYZ</sub>(1,2,0) = 1/8 + 1/8 = 1/4.',
      set: { mode: 'exp', exp: { kind: 'coins', n: 3, p: '1/2', vars: [['X', 't1'], ['Y', 'H'], ['Z', 'same']] }, keep: [1, 1, 0], cond: ['keep', 'sum', 'v:1'], chain: { tuple: [1, 2, 0], A: [0, 1, 2], B: [2, 1, 0] }, slice: { c: 0, r: 1, s: 2, view: 'stack' }, graph: { v: 1, mode: 'marg' } },
    },
    {
      label: 'L1.5 lesson · Two dice: X1, X2 and X3 = 1 if the sum is even',
      short: 'the two dice of the L1.5 recall questions',
      source: 'The L1.5 lesson (recall question), not a lecture slide: two fair dice, X1 = first, X2 = second, X3 = 1 if the sum is even, else 0 (typed as 1 − mod(S, 2)). There f(2,3,1) = 0 and f(2,3,0) = 1/36.',
      set: { mode: 'exp', exp: { kind: 'dice', k: 2, faces: 6, vars: [['X1', 'd1'], ['X2', 'd2'], ['X3', '1-mod(S,2)']] }, keep: [0, 0, 1], cond: ['keep', 'v:3', 'v:1'], chain: { tuple: [2, 3, 0], A: [0, 1, 2], B: [2, 0, 1] }, slice: { c: 0, r: 1, s: 2, view: 'given:1' }, graph: { v: 0, mode: 'cond' } },
    },
    {
      label: 'L2.10 · Example 3 (minute 8): new columns G = X1+X2+X3 and H = X2·X3',
      short: 'the 9-row table of the L2.10 lecture with its new columns G and H',
      source: 'L2.10 lecture, Example 3 (minutes 8–13): the 9-row table of L1.6, every row 1/9. The lecture adds a column for g = X1 + X2 + X3 (it reads 0, 1, 2, 2, 3, 1, 3, 2, 3) and gets f<sub>g</sub> = 1/9, 2/9, 3/9, 3/9 at g = 0, 1, 2, 3; then a column for h = X2·X3 (0, 0, 0, 1, 2, 0, 0, 0, 1) and the joint PMF of (g, h) by counting rows: for h = 0 the values 1/9, 2/9, 2/9, 1/9 at g = 0, 1, 2, 3; 1/9 at (g, h) = (2, 1), (3, 1) and (3, 2); 0 elsewhere. Here they are the new columns G and H. Loaded with: keep G and H (panel 4, also drawn as a table), the PMF and CDF of G (panel 3).',
      set: { mode: 'table', names: ['X1', 'X2', 'X3'], rows: tableRows(T9, '1/9'), derived: [['G', 'X1+X2+X3'], ['H', 'X2*X3']], keep: [0, 0, 0, 1, 1], cond: ['sum', 'sum', 'sum', 'keep', 'v:0'], chain: { tuple: [0, 1, 2, 3, 2], A: [0, 1, 2, 3, 4], B: [3, 4, 0, 1, 2] }, slice: { c: 3, r: 4, s: 0, view: 'stack' }, graph: { v: 3, mode: 'marg' } },
    },
  ];
  /* Panel 7: how many cells a joint range has. Sizes are |T_1|, …, |T_n|; N is how many observations there are. */
  const SIZE_PRESETS = [
    {
      label: 'L1.5 · Example 3 (minute 10): an IPL over, 6 balls, 0 to 8 runs each',
      source: 'L1.5 lecture, Example 3 (minutes 10–13): X<sub>i</sub> = runs off ball i of an over, i = 1, …, 6, each from 0 to 8 (9 values; more than 8 runs off one ball is “for most practical purposes unreasonable”). N = 1598 is the number of IPL matches in the data of L1.6 (minutes 9–13).',
      sizes: '9, 9, 9, 9, 9, 9', N: 1598, what: 'an IPL over: X<sub>i</sub> = runs off ball i, from 0 to 8',
    },
    {
      label: 'L1.5 · Example 2 (minute 4): number 000–999, X first digit, Y mod 2, Z last digit',
      source: 'L1.5 lecture, Example 2 (minutes 4–10): X has 10 values (0–9), Y has 2 (0 even, 1 odd), Z has 10 (0–9). The lecture’s rule makes a cell 0 when Y does not match the parity of Z and 1/100 otherwise, so only 100 of the cells can happen.',
      sizes: '10, 2, 10', N: 0, what: 'the number 000–999: X first digit, Y the number mod 2, Z last digit',
    },
    {
      label: 'L1.5 · Example 1 (minute 2): a coin tossed 3 times, X1, X2, X3',
      source: 'L1.5 lecture, Example 1 (minutes 2–4): each X<sub>i</sub> is 0 or 1 (2 values), and all 8 rows have probability 1/8.',
      sizes: '2, 2, 2', N: 0, what: 'three tosses: X<sub>i</sub> = 1 if toss i is heads, else 0',
    },
  ];

  const KINDS = [
    { value: 'coins', label: 'Toss a coin n times' },
    { value: 'dice', label: 'Roll k fair dice' },
    { value: 'number', label: 'Pick a random number with D digits (000–999 for D = 3)' },
  ];

  function defaults() {
    return {
      v: 1, mode: 'table', preset: 2,
      names: ['X1', 'X2', 'X3'], rows: tableRows(T9, '1/9'), derived: [],
      exp: { kind: 'coins', n: 3, p: '1/2', k: 2, faces: 6, digits: 3, vars: [{ name: 'X1', expr: 't1' }, { name: 'X2', expr: 't2' }, { name: 'S', expr: 'H' }] },
      keep: [true, true, false], cond: ['keep', 'v:0', 'v:0'],
      chain: { tuple: [0, 0, 0], A: [2, 1, 0], B: [0, 1, 2] },
      slice: { c: 0, r: 1, s: 2, view: 'stack' },
      graph: { v: 2, mode: 'marg', t: null },
      size: { sizes: SIZE_PRESETS[0].sizes, N: SIZE_PRESETS[0].N, preset: 0 },
    };
  }
  function load() {
    const d = defaults();
    const s = Lab.store.get(KEY, null);
    if (!s || typeof s !== 'object' || s.v !== 1) return d;
    try {
      const o = JSON.parse(JSON.stringify(s));
      const okNames = Array.isArray(o.names) && o.names.length >= MIN_N && o.names.length <= MAX_N && o.names.every(x => typeof x === 'string');
      const okRows = okNames && Array.isArray(o.rows) && o.rows.length >= 1 && o.rows.length <= MAX_ROWS &&
        o.rows.every(r => r && Array.isArray(r.t) && r.t.length === o.names.length && r.t.every(x => typeof x === 'string') && typeof r.p === 'string');
      if (!okRows) return d;
      const okDer = Array.isArray(o.derived) && o.derived.length <= MAX_DER && o.names.length + o.derived.length <= MAX_ALL &&
        o.derived.every(x => x && typeof x.name === 'string' && typeof x.expr === 'string');
      const sz = o.size && typeof o.size === 'object' ? o.size : {};
      const size = { sizes: typeof sz.sizes === 'string' ? sz.sizes : d.size.sizes, N: Number.isInteger(sz.N) && sz.N >= 0 ? sz.N : d.size.N, preset: Number.isInteger(sz.preset) && SIZE_PRESETS[sz.preset] ? sz.preset : null };
      const e = Object.assign({}, d.exp, o.exp || {});
      if (!Array.isArray(e.vars) || e.vars.length < MIN_N || e.vars.length > MAX_N || !e.vars.every(v => v && typeof v.name === 'string' && typeof v.expr === 'string')) e.vars = d.exp.vars;
      if (!KINDS.some(k => k.value === e.kind)) e.kind = 'coins';
      e.n = clampInt(e.n, 1, 6, 3); e.k = clampInt(e.k, 1, 3, 2); e.faces = clampInt(e.faces, 2, 8, 6); e.digits = clampInt(e.digits, 1, 3, 3);
      if (typeof e.p !== 'string') e.p = '1/2';
      return {
        v: 1, mode: o.mode === 'exp' ? 'exp' : 'table', preset: Number.isInteger(o.preset) && PRESETS[o.preset] ? o.preset : null,
        names: o.names, rows: o.rows, derived: okDer ? o.derived : [], exp: e, size,
        keep: Array.isArray(o.keep) ? o.keep : d.keep, cond: Array.isArray(o.cond) ? o.cond : d.cond,
        chain: Object.assign({}, d.chain, o.chain || {}), slice: Object.assign({}, d.slice, o.slice || {}), graph: Object.assign({}, d.graph, o.graph || {}),
      };
    } catch (err) { return d; }
  }
  function freeName(names) {
    const cand = ['X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'X8', 'X9', 'Y', 'Z', 'W', 'V', 'U'];
    return cand.find(c => !names.some(n => String(n).trim() === c)) || 'Q' + names.length;
  }
  /** A joint PMF object from rows [{t:[numbers], p:Frac, members?}] */
  function makeJ(names, rows, style, origin, extra) {
    const n = names.length;
    const pos = rows.filter(r => !r.p.isZero());
    return Object.assign({
      n, names: names.slice(), tex: names.map(tn), rows, style, origin,
      D: commonDen(rows.map(r => r.p)),
      ranges: range(n).map(k => uniqSorted(pos.map(r => r.t[k]))),
    }, extra || {});
  }

  /* ------------------------------------------------------------ experiments */
  function expOutcomes(e) {
    const op = 'Operators: + − * / ^, mod(a, b), min, max, abs, floor.';
    if (e.kind === 'coins') {
      const n = clampInt(e.n, 1, 6, 3);
      const p = K.parseProb(e.p);
      if (!p) return { error: 'P(heads) must be a number from 0 to 1, for example 1/2, 0.3 or 30%.' };
      const q = F(1).sub(p);
      const outs = [];
      for (let m = 0; m < (1 << n); m++) {
        let s = '';
        for (let k = n - 1; k >= 0; k--) s += ((m >> k) & 1) ? 'T' : 'H';
        const hh = [...s].filter(c => c === 'H').length;
        const env = { H: hh, T: n - hh, first: s.indexOf('H') + 1, same: hh === 0 || hh === n ? 1 : 0 };
        for (let k = 0; k < n; k++) env['t' + (k + 1)] = s[k] === 'H' ? 1 : 0;
        outs.push({ label: s, env, p: p.pow(hh).mul(q.pow(n - hh)) });
      }
      const ts = range(n).map(k => 't' + (k + 1));
      return {
        kind: 'coins', n, p, q, outs, syms: ts.concat(['H', 'T', 'first', 'same']), example: 't1 or H',
        symHtml: '<b>Symbols:</b> <code>' + (n > 2 ? 't1</code> … <code>t' + n : ts.join('</code>, <code>')) + '</code> (1 if toss i is heads, else 0), <code>H</code> (number of heads), <code>T</code> (number of tails), <code>first</code> (toss number of the first head, 0 if none), <code>same</code> (1 if all ' + n + ' tosses show the same face, else 0). ' + op,
      };
    }
    if (e.kind === 'dice') {
      const k = clampInt(e.k, 1, 3, 2), s = clampInt(e.faces, 2, 8, 6), N = Math.pow(s, k);
      const outs = [];
      for (let m = 0; m < N; m++) {
        const d = [];
        let r = m;
        for (let j = 0; j < k; j++) { d.unshift((r % s) + 1); r = Math.floor(r / s); }
        const env = { S: d.reduce((a, b) => a + b, 0), same: d.every(x => x === d[0]) ? 1 : 0 };
        d.forEach((x, j) => (env['d' + (j + 1)] = x));
        outs.push({ label: k === 1 ? String(d[0]) : '(' + d.join(',') + ')', env, p: F(1, N) });
      }
      const ds = range(k).map(j => 'd' + (j + 1));
      return {
        kind: 'dice', k, s, N, outs, syms: ds.concat(['S', 'same']), example: 'd1 or S',
        symHtml: '<b>Symbols:</b> <code>' + ds.join('</code>, <code>') + '</code> (the face of die i, 1 to ' + s + '), <code>S</code> (sum of all ' + k + ' dice), <code>same</code> (1 if all dice show the same face, else 0). ' + op,
      };
    }
    const D = clampInt(e.digits, 1, 3, 3), N = Math.pow(10, D);
    const outs = [];
    for (let x = 0; x < N; x++) {
      const lab = String(x).padStart(D, '0');
      const env = { x };
      [...lab].forEach((c, j) => (env['d' + (j + 1)] = Number(c)));
      outs.push({ label: lab, env, p: F(1, N) });
    }
    const ds = range(D).map(j => 'd' + (j + 1));
    return {
      kind: 'number', D, N, outs, syms: ['x'].concat(ds), example: 'd1 or mod(x,2)',
      symHtml: '<b>Symbols:</b> <code>x</code> (the number, 0 to ' + (N - 1) + '), <code>' + ds.join('</code>, <code>') + '</code> (its digits from the left; leading zeros count, so 007 has d1 = 0). ' + op,
    };
  }

  /* ------------------------------------------------------------------ the lab */
  function manyLab(host) {
    let alive = true;
    const st = load();
    let good = null;
    let FM = makeFmt('frac', null);
    const ctl = { note: '' }, P = {}, undo = [];
    const save = () => { if (alive) Lab.store.set(KEY, st); };
    const soon = Lab.debounce(() => { if (alive) recompute(); }, 220);
    const { side, main } = K.layout(host, 'mv-lab');

    /* ----------------------------------------------------------- controls column */
    side.appendChild(K.group('1 · Start from an example'));
    ctl.presets = K.presets({ label: 'Lecture and lesson examples', items: PRESETS, onPick: applyPreset });
    side.appendChild(ctl.presets);
    if (st.preset != null) showPresetSource();
    side.appendChild(K.group('2 · Your joint PMF'));
    ctl.mode = Lab.seg([{ label: 'Type a table', value: 'table' }, { label: 'Build from an experiment', value: 'exp' }], st.mode, v => {
      if (v === st.mode) return;
      st.mode = v; touched(); showMode(); recompute();
    });
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Give it as' }), ctl.mode));
    ctl.tableBox = h('div', { class: 'mv-mode' });
    ctl.expBox = h('div', { class: 'mv-mode' });
    side.append(ctl.tableBox, ctl.expBox);
    ctl.undo = Lab.button('Undo', doUndo, 'btn ghost sm');
    side.appendChild(h('div', { class: 'pl-reset' }, ctl.undo, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', startAgain, 'btn ghost sm')));
    paintUndo();

    /* ------------------------------------------------------------------ panels */
    P.banner = h('div', { class: 'mv-banner', role: 'status' });
    P.banner.hidden = true;
    P.answer = K.answer();
    P.answer.classList.add('mv-answer');
    P.joint = K.panel('1 · Your joint PMF, one row per tuple');
    P.slices = K.panel('2 · Slices: one small table per value of a third variable');
    P.graph = K.panel('3 · PMF and CDF of one variable');
    P.marg = K.panel('4 · Marginal of any group: keep what you want, sum over the rest');
    P.cond = K.panel('5 · Conditional: fix some variables, then divide by the probability of what you fixed');
    P.chain = K.panel('6 · Chain rule: one marginal times a chain of conditionals');
    P.size = K.panel('7 · How many cells does a joint PMF have? One for every tuple');
    main.append(P.banner, P.answer, P.joint, P.slices, P.graph, P.marg, P.cond, P.chain, P.size);
    ['answer', 'joint', 'slices', 'graph', 'marg', 'cond', 'chain', 'size'].forEach(k => (P[k].dataset.panel = k));

    /* ------------------------------------------------------------ state helpers */
    function showPresetSource() {
      const it = PRESETS[st.preset];
      if (!it) return;
      ctl.presets.select.value = String(st.preset);
      const src = ctl.presets.querySelector('.pl-hint');
      if (src) Lab.setHTML(src, 'From: ' + it.source);
    }
    /** The learner changed the joint PMF by hand: it is no longer the loaded example. */
    function touched() {
      if (st.preset == null) return;
      st.preset = null;
      ctl.presets.select.value = '';
      const src = ctl.presets.querySelector('.pl-hint');
      if (src) src.textContent = '';
    }
    function showMode() {
      ctl.tableBox.hidden = st.mode !== 'table';
      ctl.expBox.hidden = st.mode !== 'exp';
      ctl.mode.set(st.mode);
    }
    function pushUndo() {
      undo.push(JSON.stringify({ mode: st.mode, names: st.names, rows: st.rows, derived: st.derived, exp: st.exp, preset: st.preset }));
      if (undo.length > 30) undo.shift();
      paintUndo();
    }
    function paintUndo() { ctl.undo.disabled = !undo.length; ctl.undo.title = undo.length ? 'Undo the last change to the joint PMF (rows, variables, rescale, example)' : 'Nothing to undo yet'; }
    function doUndo() {
      if (!undo.length) return;
      const s = JSON.parse(undo.pop());
      Object.assign(st, s);
      ctl.note = 'Undone.';
      buildTable(); buildExp(); showMode();
      if (st.preset != null) showPresetSource(); else { ctl.presets.select.value = ''; const src = ctl.presets.querySelector('.pl-hint'); if (src) src.textContent = ''; }
      paintUndo();
      recompute();
    }
    function startAgain() {
      alive = false;
      Lab.store.set(KEY, null);
      manyLab(host);
    }
    function applyPreset(it) {
      pushUndo();
      const a = it.set;
      st.mode = a.mode;
      if (a.mode === 'table') {
        st.names = a.names.slice(); st.rows = a.rows.map(r => ({ t: r.t.slice(), p: r.p }));
        st.derived = (a.derived || []).map(([name, expr]) => ({ name, expr }));
      } else st.exp = Object.assign({}, st.exp, a.exp, { vars: a.exp.vars.map(([name, expr]) => ({ name, expr })) });
      st.keep = a.keep.map(Boolean);
      st.cond = a.cond.slice();
      st.chain = { tuple: a.chain.tuple.slice(), A: a.chain.A.slice(), B: a.chain.B.slice() };
      st.slice = Object.assign({}, a.slice);
      st.graph = Object.assign({ t: null }, a.graph);
      st.preset = PRESETS.indexOf(it);
      ctl.note = '';
      buildTable(); buildExp(); showMode();
      recompute();
    }
    /** Variable k was removed (experiment mode): shift every per-variable setting. */
    function dropVar(k) {
      if (Array.isArray(st.keep)) st.keep.splice(k, 1);
      if (Array.isArray(st.cond)) st.cond.splice(k, 1);
      ['A', 'B'].forEach(w => { if (Array.isArray(st.chain[w])) st.chain[w] = st.chain[w].filter(q => q !== k).map(q => (q > k ? q - 1 : q)); });
      if (Array.isArray(st.chain.tuple)) st.chain.tuple.splice(k, 1);
      ['c', 'r', 's'].forEach(role => { if (st.slice[role] === k) st.slice[role] = -1; else if (st.slice[role] > k) st.slice[role]--; });
      if (st.graph.v === k) st.graph.v = 0; else if (st.graph.v > k) st.graph.v--;
    }
    /** A typed column was added at position k, in front of the new columns: shift their settings one place on. */
    function insertVar(k) {
      if (Array.isArray(st.keep) && st.keep.length >= k) st.keep.splice(k, 0, false);
      if (Array.isArray(st.cond) && st.cond.length >= k) st.cond.splice(k, 0, 'sum');
      ['A', 'B'].forEach(w => { if (Array.isArray(st.chain[w])) st.chain[w] = st.chain[w].map(q => (q >= k ? q + 1 : q)).concat([k]); });
      if (Array.isArray(st.chain.tuple) && st.chain.tuple.length >= k) st.chain.tuple.splice(k, 0, 0);
      ['c', 'r', 's'].forEach(role => { if (Number.isInteger(st.slice[role]) && st.slice[role] >= k) st.slice[role]++; });
      if (Number.isInteger(st.graph.v) && st.graph.v >= k) st.graph.v++;
    }

    /* -------------------------------------------------------------- table editor */
    function buildTable() {
      const box = ctl.tableBox;
      Lab.clear(box);
      ctl.n = K.numField({ label: 'Number of variables ' + tex('n') + ' (2 to 5)', min: MIN_N, max: MAX_N, value: st.names.length, onChange: v => setN(v) });
      box.appendChild(ctl.n);
      box.appendChild(K.note('Type the names in the coloured header boxes. Then one row per tuple: its values and its probability ' + tex('P') + ' — for example <code>1/9</code>, <code>0.25</code> or <code>25%</code>.'));
      ctl.ed = h('div', { class: 'mv-ed', role: 'group', 'aria-label': 'rows of the joint PMF' });
      ctl.edMsg = h('div', { class: 'pl-hint mv-msg' });
      const tools = h('div', { class: 'pl-chips' },
        Lab.button('+ row', addRow, 'btn xs'),
        Lab.button('Make all equal', makeEqual, 'btn xs'),
        Lab.button('Rescale to total 1', rescale, 'btn xs'),
        Lab.button('Sort rows', sortRows, 'btn xs'));
      ctl.derBox = h('div', { class: 'mv-der', role: 'group', 'aria-label': 'new columns from formulas' });
      box.append(ctl.ed, ctl.edMsg, tools, ctl.derBox);
      drawEditor();
      drawDerived();
    }

    /* ------------------------------------------------- new columns (L2.10: a function of each row) */
    const baseNames = () => st.names.map(s => String(s).trim());
    const derLimit = () => Math.max(0, Math.min(MAX_DER, MAX_ALL - st.names.length));
    function drawDerived() {
      const box = ctl.derBox;
      if (!box) return;
      Lab.clear(box);
      const base = baseNames();
      const usable = base.filter((s, k) => NAME_RE.test(s) && base.indexOf(s) === k);
      ctl.derSig = usable.join('|');
      box.appendChild(h('label', { class: 'pl-label', text: 'New columns: a name = a formula of each row' }));
      box.appendChild(K.note('As in L2.10: “make another column for it, then add”. A formula may use ' + (usable.length ? usable.map(s => '<code>' + Lab.esc(s) + '</code>').join(', ') : 'your column names') + ' — for example <code>' + Lab.esc(usable.slice(0, 3).join('+') || 'X1+X2') + '</code> or <code>' + Lab.esc(usable.slice(-2).join('*') || 'X2*X3') + '</code>. Every panel then treats a new column as one more random variable.', 'pl-hint'));
      ctl.derEls = st.derived.map((d, k) => {
        const idx = st.names.length + k;
        const ni = h('input', { class: 'field mono mv-in mv-name ' + (VC[idx] || ''), value: d.name, maxlength: 6, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'name of new column ' + (k + 1), title: 'name of new column ' + (k + 1) });
        ni.addEventListener('input', () => { d.name = ni.value; touched(); soon(); });
        const ef = K.exprField({
          label: '', value: d.expr, vars: usable, placeholder: 'e.g. ' + (usable.slice(0, 3).join('+') || 'X1+X2'),
          onChange: (fn, src) => { if (src === d.expr) { if (ctl.lastRes) paintDerived(ctl.lastRes); return; } d.expr = src; touched(); soon(); },
        });
        ef.input.classList.add('mv-in', 'mv-expr');
        ef.input.setAttribute('aria-label', 'formula of new column ' + (k + 1));
        const del = h('button', { class: 'icon-btn mv-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove new column ' + (k + 1), title: 'remove this new column' });
        del.addEventListener('click', () => {
          pushUndo();
          st.derived.splice(k, 1); dropVar(st.names.length + k); touched();
          ctl.note = 'Removed the new column ' + (String(d.name).trim() || (k + 1)) + '.';
          drawDerived(); recompute();
        });
        box.appendChild(h('div', { class: 'mv-der-row' }, ni, h('span', { class: 'mv-eq', text: '=' }), ef, del));
        return { ni, ef };
      });
      const lim = derLimit();
      const add = Lab.button('+ new column', addDerived, 'btn xs');
      add.disabled = st.derived.length >= lim;
      add.title = st.derived.length >= lim ? 'At most ' + MAX_DER + ' new columns, and ' + MAX_ALL + ' columns in all' : 'Add a column computed from each row';
      box.appendChild(h('div', { class: 'pl-chips' }, add));
    }
    function addDerived() {
      if (st.derived.length >= derLimit()) { ctl.note = 'At most ' + MAX_DER + ' new columns, and ' + MAX_ALL + ' columns in all.'; recompute(); return; }
      pushUndo();
      const base = baseNames();
      const taken = base.concat(st.derived.map(d => String(d.name).trim()));
      const name = ['G', 'H', 'S', 'M', 'W', 'V', 'U'].find(c => !taken.includes(c)) || 'Q' + taken.length;
      const sum = base.filter(s => NAME_RE.test(s)).join('+') || '0';
      st.derived.push({ name, expr: st.derived.length ? base.filter(s => NAME_RE.test(s)).slice(-2).join('*') || sum : sum });
      ctl.note = 'Added the new column ' + name + ' — change its name or its formula.';
      touched(); drawDerived(); recompute();
    }
    function drawEditor() {
      const ed = ctl.ed;
      Lab.clear(ed);
      const n = st.names.length;
      ed.style.setProperty('--mv-cols', '22px repeat(' + n + ', minmax(0, 1fr)) minmax(54px, 1.5fr) 24px');
      const head = h('div', { class: 'mv-ed-row mv-ed-head' }, h('span', { class: 'mv-idx', text: '#' }));
      ctl.nameIns = st.names.map((nm, k) => {
        const inp = h('input', { class: 'field mono mv-in mv-name ' + VC[k], value: nm, maxlength: 6, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'name of variable ' + (k + 1), title: 'name of variable ' + (k + 1) });
        inp.addEventListener('input', () => { st.names[k] = inp.value; touched(); soon(); });
        head.appendChild(inp);
        return inp;
      });
      head.append(h('span', { class: 'mv-ph', html: tex('P') }), h('span'));
      ed.appendChild(head);
      ctl.rowIns = st.rows.map((r, i) => {
        const row = h('div', { class: 'mv-ed-row' }, h('span', { class: 'mv-idx', text: String(i + 1) }));
        const vis = r.t.map((v, k) => {
          const inp = h('input', { class: 'field mono mv-in', value: v, spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': 'row ' + (i + 1) + ', value of variable ' + (k + 1) });
          inp.addEventListener('input', () => { r.t[k] = inp.value; touched(); soon(); });
          row.appendChild(inp);
          return inp;
        });
        const pi = h('input', { class: 'field mono mv-in mv-p', value: r.p, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'row ' + (i + 1) + ', probability' });
        pi.addEventListener('input', () => { r.p = pi.value; touched(); soon(); });
        const del = h('button', { class: 'icon-btn mv-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove row ' + (i + 1), title: 'remove row ' + (i + 1) });
        del.disabled = st.rows.length <= 1;
        del.addEventListener('click', () => {
          if (st.rows.length <= 1) return;
          pushUndo(); st.rows.splice(i, 1); touched();
          ctl.note = 'Removed row ' + (i + 1) + '. The total is now probably below 1: press “Rescale to total 1” or edit.';
          drawEditor(); recompute();
        });
        row.append(pi, del);
        ed.appendChild(row);
        return { vis, pi };
      });
    }
    function setN(v) {
      const n = st.names.length;
      if (v === n || v < MIN_N || v > MAX_N) return;
      const nd = st.derived.length;
      if (v > n && v + nd > MAX_ALL) {
        if (ctl.n) ctl.n.set(n);
        ctl.note = 'At most ' + MAX_ALL + ' columns in all: your ' + n + ' variables and ' + plural(nd, 'new column') + ' already make ' + (n + nd) + '. Remove a new column first.';
        recompute();
        return;
      }
      pushUndo();
      if (v > n) {
        const added = [];
        while (st.names.length < v) {
          const nm = freeName(st.names.concat(st.derived.map(d => String(d.name).trim())));
          if (nd) insertVar(st.names.length);
          st.names.push(nm); added.push(nm); st.rows.forEach(r => r.t.push('0'));
        }
        ctl.note = 'Added ' + added.join(', ') + ' with the value 0 in every row — type its values.';
      } else {
        if (nd) for (let k = n - 1; k >= v; k--) dropVar(k);
        const removed = st.names.slice(v);
        const style = styleOf(st.rows.map(r => r.p));
        st.names = st.names.slice(0, v);
        const merged = new Map();
        st.rows.forEach(r => {
          const t = r.t.slice(0, v);
          const key = t.map(s => { const f = K.parseNum(s); return f == null ? 's:' + String(s).trim() : String(Number(f)); }).join('|');
          if (!merged.has(key)) merged.set(key, { t, ps: [] });
          merged.get(key).ps.push(r.p);
        });
        let groups = 0;
        st.rows = [...merged.values()].map(g => {
          if (g.ps.length === 1) return { t: g.t, p: g.ps[0] };
          groups++;
          const fs = g.ps.map(s => K.parseNum(s));
          return { t: g.t, p: fs.every(f => f != null) ? makeFmt(style, null).plain(F.sum(fs)) : g.ps.map(s => '(' + s + ')').join('+') };
        });
        ctl.note = 'Removed ' + removed.join(', ') + '. ' + (groups ? plural(groups, 'group') + ' of rows became the same tuple and ' + (groups === 1 ? 'was' : 'were') + ' merged by adding their probabilities — that is the marginal of the variables you kept. (Undo brings the column back.)' : 'No two rows became equal, so nothing was merged.');
      }
      touched();
      drawEditor();
      drawDerived();
      recompute();
    }
    function parsedRows() { return st.rows.map(r => ({ t: r.t.map(s => K.parseNum(s)), p: K.parseNum(r.p) })); }
    function addRow() {
      if (st.rows.length >= MAX_ROWS) { ctl.note = 'At most ' + MAX_ROWS + ' rows here.'; recompute(); return; }
      pushUndo();
      const n = st.names.length;
      const pr = parsedRows();
      const keys = new Set(pr.filter(r => r.t.every(f => f != null)).map(r => keyOf(r.t.map(Number))));
      const last = pr.length && pr[pr.length - 1].t.every(f => f != null) ? pr[pr.length - 1].t.map(Number) : Array(n).fill(0);
      const t = last.slice();
      for (let tries = 0; tries < 500 && keys.has(keyOf(t)); tries++) t[n - 1] += 1;
      st.rows.push({ t: t.map(v => Lab.fmtDec(v, 6)), p: '0' });
      ctl.note = 'Added row ' + st.rows.length + ' with probability 0 — type its values and its probability.';
      touched(); drawEditor(); recompute();
      const last2 = ctl.rowIns[ctl.rowIns.length - 1];
      if (last2) last2.pi.focus();
    }
    function makeEqual() {
      pushUndo();
      const m = st.rows.length;
      st.rows.forEach(r => (r.p = '1/' + m));
      ctl.note = 'Every row now has probability 1/' + m + ' (you have ' + plural(m, 'row') + ').';
      touched(); drawEditor(); recompute();
    }
    function rescale() {
      const ps = st.rows.map(r => K.parseNum(r.p));
      if (ps.some(f => f == null || Number(f) < 0)) { ctl.note = 'Fix the red probabilities first.'; recompute(); return; }
      const tot = F.sum(ps);
      if (tot.isZero()) { ctl.note = 'All probabilities are 0 — there is nothing to rescale.'; recompute(); return; }
      if (tot.eq(1)) { ctl.note = 'The total is already 1.'; recompute(); return; }
      pushUndo();
      const fm = makeFmt(styleOf(st.rows.map(r => r.p)), null);
      st.rows.forEach((r, i) => (r.p = fm.plain(ps[i].div(tot))));
      ctl.note = 'Divided every probability by the old total ' + tex(fm.pT(tot)) + ', so the new total is ' + tex(fm.pT(tot) + '\\div ' + fm.pT(tot) + '=1') + '.';
      touched(); drawEditor(); recompute();
    }
    function sortRows() {
      pushUndo();
      const pr = parsedRows();
      const order = st.rows.map((_, i) => i).sort((a, b) => {
        const A = pr[a].t, B = pr[b].t;
        const okA = A.every(f => f != null), okB = B.every(f => f != null);
        if (okA && okB) return cmpT(A.map(Number), B.map(Number)) || a - b;
        return okA ? -1 : okB ? 1 : a - b;
      });
      st.rows = order.map(i => st.rows[i]);
      ctl.note = 'Rows sorted by their tuples (first variable first). The row numbers changed.';
      touched(); drawEditor(); recompute();
    }

    function parseTable() {
      const names = st.names.map(s => String(s).trim());
      const nameBad = names.map((s, k) => !NAME_RE.test(s) || names.indexOf(s) !== k);
      const rows = parsedRows();
      const valBad = rows.map(r => r.t.map(f => f == null || !Number.isFinite(Number(f))));
      const pBad = rows.map(r => r.p == null || Number(r.p) < 0 || Number(r.p) > 1);
      const dup = rows.map(() => false);
      const firstOf = new Map(), dupPairs = [];
      rows.forEach((r, i) => {
        if (valBad[i].some(Boolean)) return;
        const key = keyOf(r.t.map(Number));
        if (firstOf.has(key)) { dup[i] = true; dup[firstOf.get(key)] = true; dupPairs.push([firstOf.get(key), i]); } else firstOf.set(key, i);
      });
      const msgs = [];
      if (nameBad.some(Boolean)) msgs.push('Names: letters, then up to 2 digits (X1, S, Max), and every name different. Check ' + names.filter((_, k) => nameBad[k]).map(s => '“' + Lab.esc(s) + '”').join(', ') + '.');
      const vb = valBad.findIndex(a => a.some(Boolean));
      if (vb >= 0) msgs.push('Row ' + (vb + 1) + ': every value must be a number (for example 0, 1, 2 or −1).');
      const pb = pBad.findIndex(Boolean);
      if (pb >= 0) msgs.push('Row ' + (pb + 1) + ': the probability must be a number from 0 to 1 (1/9, 0.25 or 25%).');
      if (dupPairs.length) { const [a, b] = dupPairs[0]; msgs.push('Rows ' + (a + 1) + ' and ' + (b + 1) + ' have the same tuple ' + tupH(rows[b].t.map(Number)) + '. Each tuple may appear only once — put their probabilities together in one row.'); }
      const base = { nameBad, valBad, pBad, dup };
      if (msgs.length) return Object.assign(base, { ok: false, msg: '<span class="cbad">' + msgs.join('<br>') + '</span>' });
      const ps = rows.map(r => r.p);
      const total = F.sum(ps);
      const style = styleOf(st.rows.map(r => r.p));
      const fm = makeFmt(style, commonDen(ps));
      const sumLine = 'Total ' + tex('\\sum P=' + sumEqWith(fm, ps, total));
      if (!total.eq(1)) return Object.assign(base, { ok: false, msg: sumLine + ' <span class="cbad">— a joint PMF must total exactly 1. “Rescale to total 1” divides every probability by ' + tex(fm.pT(total)) + '; or edit the rows.</span>' });
      const D = derivedCols(names, rows);
      Object.assign(base, { derMsgs: D.msgs });
      if (D.msgs.some(Boolean)) {
        const bad = D.msgs.map((m, k) => (m ? 'New column ' + Lab.esc(D.names[k] || String(k + 1)) + ': ' + Lab.esc(m.m) : null)).filter(Boolean);
        return Object.assign(base, { ok: false, derOnly: true, msg: sumLine + ' <span class="cgood">✓</span><br><span class="cbad">' + bad.join('<br>') + '</span>' });
      }
      const nb = names.length;
      const J = makeJ(names.concat(D.names), rows.map((r, i) => ({ t: r.t.map(Number).concat(D.vals[i]), p: r.p })), style, 'table',
        { nBase: nb, derived: D.names.map((nm, k) => ({ name: nm, expr: D.exprs[k], k: nb + k, uses: D.uses[k] })) });
      return Object.assign(base, { ok: true, J, msg: sumLine + ' <span class="cgood">✓ a valid joint PMF</span>' + (D.names.length ? ' — and ' + plural(D.names.length, 'new column') + ', ' + D.names.join(', ') + ', computed in every row.' : '') });
    }
    /** The new columns: every formula evaluated in every row. {names, exprs, uses (indices of typed columns), vals[row][k], msgs[k]} */
    function derivedCols(names, rows) {
      const der = st.derived || [];
      const dn = der.map(d => String(d.name).trim());
      const exprs = der.map(d => String(d.expr).trim());
      const msgs = der.map(() => null), uses = der.map(() => []);
      const vals = rows.map(() => []);
      der.forEach((d, k) => {
        if (!NAME_RE.test(dn[k]) || /^(e|pi)$/.test(dn[k])) msgs[k] = { f: 'name', m: 'Name: letters, then up to 2 digits (G, H, S1).' };
        else if (names.includes(dn[k]) || dn.indexOf(dn[k]) !== k) msgs[k] = { f: 'name', m: 'The name ' + dn[k] + ' is already used.' };
      });
      const fns = der.map((d, k) => {
        if (msgs[k]) return null;
        try {
          if (!exprs[k]) throw new Error('Type a formula, for example ' + names.slice(0, 3).join('+') + '.');
          const used = Lab.expr.vars(exprs[k]);
          const unknown = used.filter(u => !names.includes(u));
          if (unknown.length) throw new Error('Unknown name ' + unknown.map(u => '“' + u + '”').join(', ') + ' — use ' + names.join(', ') + (/^[A-Za-z]+\d+[A-Za-z]/.test(unknown[0]) ? ' (write X2*X3 with a *, not X2X3)' : '') + '.');
          uses[k] = names.map((nm, j) => (used.includes(nm) ? j : -1)).filter(j => j >= 0);
          return Lab.expr.compile(exprs[k]);
        } catch (err) { msgs[k] = { f: 'expr', m: err.message }; return null; }
      });
      fns.forEach((fn, k) => {
        if (!fn) return;
        for (let i = 0; i < rows.length; i++) {
          const env = {};
          names.forEach((nm, j) => (env[nm] = Number(rows[i].t[j])));
          let v;
          try { v = Number(Lab.expr.num(fn(env))); } catch (err) { msgs[k] = { f: 'expr', m: 'Row ' + (i + 1) + ': ' + err.message + '.' }; return; }
          if (!Number.isFinite(v)) { msgs[k] = { f: 'expr', m: 'Row ' + (i + 1) + ': not a finite number.' }; return; }
          vals[i][k] = Number(v.toPrecision(12));
        }
      });
      return { names: dn, exprs, uses, vals, msgs };
    }

    /* ---------------------------------------------------------- experiment editor */
    function buildExp() {
      const box = ctl.expBox;
      Lab.clear(box);
      const e = st.exp;
      box.appendChild(K.selectField({ label: 'Experiment', options: KINDS, value: e.kind, onChange: v => { pushUndo(); e.kind = v; touched(); buildExp(); recompute(); } }));
      if (e.kind === 'coins') {
        box.appendChild(K.numField({ label: 'Number of tosses ' + tex('n') + ' (1 to 6)', min: 1, max: 6, value: e.n, onChange: v => { if (v === e.n) return; e.n = v; touched(); paintSyms(); soon(); } }));
        const pf = K.probField({ label: 'Chance of heads on one toss ' + tex('p'), value: e.p, onChange: () => { e.p = pf.querySelector('input').value.trim(); touched(); soon(); } });
        box.appendChild(pf);
      } else if (e.kind === 'dice') {
        box.appendChild(K.numField({ label: 'Number of dice ' + tex('k') + ' (1 to 3)', min: 1, max: 3, value: e.k, onChange: v => { if (v === e.k) return; e.k = v; touched(); paintSyms(); soon(); } }));
        box.appendChild(K.numField({ label: 'Faces on each die ' + tex('s') + ' (2 to 8; all equally likely)', min: 2, max: 8, value: e.faces, onChange: v => { if (v === e.faces) return; e.faces = v; touched(); paintSyms(); soon(); } }));
      } else {
        box.appendChild(K.numField({ label: 'Number of digits ' + tex('D') + ' (1 to 3)', min: 1, max: 3, value: e.digits, onChange: v => { if (v === e.digits) return; e.digits = v; touched(); paintSyms(); soon(); } }));
      }
      ctl.syms = h('div', { class: 'pl-hint mv-syms' });
      box.appendChild(ctl.syms);
      paintSyms();
      box.appendChild(h('label', { class: 'pl-label', text: 'Your variables: a name = an expression of the outcome' }));
      ctl.vars = h('div', { class: 'mv-vars' });
      box.appendChild(ctl.vars);
      drawVars();
      box.appendChild(h('div', { class: 'pl-chips' }, Lab.button('+ variable', addVar, 'btn xs'), Lab.button('Copy into the table editor', copyToTable, 'btn xs')));
      ctl.expMsg = h('div', { class: 'pl-hint mv-msg' });
      box.appendChild(ctl.expMsg);
    }
    function paintSyms() { const O = expOutcomes(st.exp); Lab.setHTML(ctl.syms, O.symHtml || ''); }
    function drawVars() {
      const wrap = ctl.vars;
      Lab.clear(wrap);
      ctl.varEls = st.exp.vars.map((v, k) => {
        const ni = h('input', { class: 'field mono mv-in mv-name ' + VC[k], value: v.name, maxlength: 6, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'name of variable ' + (k + 1) });
        const ei = h('input', { class: 'field mono mv-in mv-expr', value: v.expr, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'expression for variable ' + (k + 1), placeholder: 'e.g. t1 or H' });
        const del = h('button', { class: 'icon-btn mv-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove variable ' + (k + 1), title: 'remove this variable' });
        del.disabled = st.exp.vars.length <= MIN_N;
        ni.addEventListener('input', () => { v.name = ni.value; touched(); soon(); });
        ei.addEventListener('input', () => { v.expr = ei.value; touched(); soon(); });
        del.addEventListener('click', () => {
          if (st.exp.vars.length <= MIN_N) return;
          pushUndo(); st.exp.vars.splice(k, 1); dropVar(k); touched(); drawVars(); recompute();
        });
        const hint = h('div', { class: 'pl-hint mv-var-hint' });
        wrap.append(h('div', { class: 'mv-var-row' }, ni, h('span', { class: 'mv-eq', text: '=' }), ei, del), hint);
        return { ni, ei, hint };
      });
    }
    function addVar() {
      const e = st.exp;
      if (e.vars.length >= MAX_N) { ctl.note = 'At most ' + MAX_N + ' variables here.'; recompute(); return; }
      pushUndo();
      const def = e.kind === 'coins' ? 'H' : e.kind === 'dice' ? 'S' : 'mod(x,2)';
      e.vars.push({ name: freeName(e.vars.map(v => v.name)), expr: def });
      touched(); drawVars(); recompute();
    }
    function copyToTable() {
      const r = parseExp();
      if (!r.ok) { ctl.note = 'Fix the experiment first (see the red message).'; paintExp(r); return; }
      if (r.J.rows.length > MAX_ROWS) { ctl.note = 'Your experiment has ' + r.J.rows.length + ' rows; the table editor holds at most ' + MAX_ROWS + '.'; paintExp(r); return; }
      pushUndo();
      const fm = makeFmt(r.J.style, null);
      st.names = r.J.names.slice();
      st.rows = r.J.rows.map(row => ({ t: row.t.map(v => Lab.fmtDec(v, 6)), p: fm.plain(row.p) }));
      st.mode = 'table';
      const cleared = st.derived.length;
      st.derived = [];
      ctl.note = 'Copied the ' + plural(r.J.rows.length, 'row') + ' of your experiment. Edit them freely.' + (cleared ? ' The table’s new columns were cleared (Undo brings them back).' : '');
      buildTable(); showMode(); recompute();
    }
    function parseExp() {
      const e = st.exp;
      const O = expOutcomes(e);
      const varMsgs = e.vars.map(() => null);
      if (O.error) return { ok: false, varMsgs, msg: '<span class="cbad">' + O.error + '</span>' };
      const names = e.vars.map(v => String(v.name).trim());
      const fns = e.vars.map((v, k) => {
        if (!NAME_RE.test(names[k])) { varMsgs[k] = { f: 'name', m: 'Name: letters, then up to 2 digits (X1, S, Max).' }; return null; }
        if (names.indexOf(names[k]) !== k) { varMsgs[k] = { f: 'name', m: 'The name ' + names[k] + ' is already used.' }; return null; }
        try {
          const src = String(v.expr).trim();
          if (!src) throw new Error('Type an expression, for example ' + O.example + '.');
          const unknown = Lab.expr.vars(src).filter(u => !O.syms.includes(u));
          if (unknown.length) throw new Error('Unknown symbol ' + unknown.map(u => '“' + u + '”').join(', ') + ' — see the list of symbols above.');
          return Lab.expr.compile(src);
        } catch (err) { varMsgs[k] = { f: 'expr', m: err.message }; return null; }
      });
      const bad = () => ({ ok: false, varMsgs, msg: '<span class="cbad">Fix the red variable' + (varMsgs.filter(Boolean).length > 1 ? 's' : '') + ' above.</span>' });
      if (fns.some(f => !f)) return bad();
      const map = new Map();
      for (const o of O.outs) {
        const t = [];
        for (let k = 0; k < fns.length; k++) {
          let v;
          try { v = Number(Lab.expr.num(fns[k](o.env))); } catch (err) { varMsgs[k] = { f: 'expr', m: 'Cannot compute it for the outcome ' + o.label + ': ' + err.message }; return bad(); }
          if (!Number.isFinite(v)) { varMsgs[k] = { f: 'expr', m: 'Not a finite number for the outcome ' + o.label + '.' }; return bad(); }
          t.push(Number(v.toPrecision(12)));
        }
        const key = keyOf(t);
        if (!map.has(key)) map.set(key, { t, p: F(0), members: [] });
        const g = map.get(key);
        g.p = g.p.add(o.p);
        g.members.push(o);
      }
      let rows = [...map.values()].sort((a, b) => cmpT(a.t, b.t));
      const zeroRows = rows.filter(r => r.p.isZero());
      rows = rows.filter(r => !r.p.isZero());
      if (rows.length > MAX_TUPLES) return { ok: false, varMsgs, msg: '<span class="cbad">Your variables give ' + rows.length + ' different tuples — too many to list here (at most ' + MAX_TUPLES + '). Use fewer or coarser variables.</span>' };
      const style = e.kind === 'coins' ? styleOf([e.p]) : 'frac';
      const J = makeJ(names, rows, style, 'exp', { exp: Object.assign({}, O, { outs: undefined, count: O.outs.length, zeroOutcomes: zeroRows.reduce((a, r) => a + r.members.length, 0), exprs: e.vars.map(v => String(v.expr).trim()) }) });
      return { ok: true, J, varMsgs, msg: tex(fNameJ(J)) + ': ' + plural(rows.length, 'row') + ' from ' + plural(O.outs.length, 'outcome') + ' <span class="cgood">✓</span>' };
    }

    /* ----------------------------------------------------------- recompute & paint */
    function recompute() {
      const res = st.mode === 'table' ? parseTable() : parseExp();
      if (st.mode === 'table') paintTable(res); else paintExp(res);
      if (res.ok) good = res.J;
      P.banner.hidden = res.ok || !good;
      if (!res.ok && good) Lab.setHTML(P.banner, res.derOnly
        ? '<b>A new column cannot be computed yet</b> — see the red message on the left. Every panel below still shows your last valid table.'
        : '<b>Not a valid joint PMF yet</b> — see the red message on the left. Every panel below still shows your last valid joint PMF.');
      ctl.note = '';
      save();
      drawAll();
    }
    function paintTable(res) {
      (ctl.nameIns || []).forEach((inp, k) => inp.classList.toggle('bad', !!(res.nameBad && res.nameBad[k])));
      (ctl.rowIns || []).forEach((ri, i) => {
        ri.vis.forEach((inp, k) => inp.classList.toggle('bad', !!((res.valBad && res.valBad[i] && res.valBad[i][k]) || (res.dup && res.dup[i]))));
        ri.pi.classList.toggle('bad', !!(res.pBad && res.pBad[i]));
      });
      Lab.setHTML(ctl.edMsg, (ctl.note ? '<span class="mv-note">' + ctl.note + '</span><br>' : '') + res.msg);
      // the formulas may use the typed names: when those change, rebuild the formula boxes with the new names
      const base = baseNames();
      if (ctl.derBox && ctl.derSig !== base.filter((s, k) => NAME_RE.test(s) && base.indexOf(s) === k).join('|')) drawDerived();
      ctl.lastRes = res;
      paintDerived(res);
    }
    /** Under each new column: its range, or what is wrong with it. */
    function paintDerived(res) {
      (ctl.derEls || []).forEach((el, k) => {
        const m = res.derMsgs && res.derMsgs[k];
        el.ni.classList.toggle('bad', !!m && m.f === 'name');
        const hint = el.ef.querySelector('.pl-hint');
        if (m) { el.ef.input.classList.toggle('bad', m.f === 'expr'); if (hint) Lab.setHTML(hint, '<span class="cbad">' + Lab.esc(m.m) + '</span>'); return; }
        el.ef.input.classList.remove('bad');
        const J = res.ok ? res.J : null, dk = J && J.derived ? J.derived[k] : null;
        if (hint) Lab.setHTML(hint, dk ? 'Range ' + tex('T_{' + J.tex[dk.k] + '}=' + setTex(J.ranges[dk.k])) + ' — ' + plural(J.ranges[dk.k].length, 'value') : '');
      });
    }
    function paintExp(res) {
      (ctl.varEls || []).forEach((el, k) => {
        const m = res.varMsgs && res.varMsgs[k];
        el.ei.classList.toggle('bad', !!m && m.f === 'expr');
        el.ni.classList.toggle('bad', !!m && m.f === 'name');
        if (m) Lab.setHTML(el.hint, '<span class="cbad">' + Lab.esc(m.m) + '</span>');
        else if (res.ok) Lab.setHTML(el.hint, 'Range ' + tex('T_{' + res.J.tex[k] + '}=' + setTex(res.J.ranges[k])) + ' — ' + plural(res.J.ranges[k].length, 'value'));
        else el.hint.textContent = '';
      });
      Lab.setHTML(ctl.expMsg, (ctl.note ? '<span class="mv-note">' + ctl.note + '</span><br>' : '') + res.msg);
    }

    /* ------------------------------------------------------------- notation helpers */
    function fNameJ(J) { return 'f_{' + J.tex.join('') + '}'; }
    const sortedKeys = given => Object.keys(given).map(Number).sort((a, b) => a - b);
    /** f_{X1X2 | X3=0} */
    function fName(J, idx, given) {
      const a = idx.map(k => J.tex[k]).join('');
      const g = given && sortedKeys(given).length ? '\\mid ' + sortedKeys(given).map(k => J.tex[k] + '=' + vt(given[k])).join(',') : '';
      return 'f_{' + a + g + '}';
    }
    const tArgs = idx => idx.map(k => 't_{' + (k + 1) + '}').join(',');
    const vArgs = (t, idx) => idx.map(k => vt(t[k])).join(',');
    const eqTex = (J, given) => sortedKeys(given).map(k => J.tex[k] + '=' + vt(given[k])).join(',\\ ');
    const allRows = J => J.rows.map((_, i) => i);
    function matchIdx(J, given) { const ks = sortedKeys(given); return allRows(J).filter(i => ks.every(k => J.rows[i].t[k] === given[k])); }
    const sumP = (J, idx) => F.sum(idx.map(i => J.rows[i].p));
    function givenOf(J) {
      const g = {};
      st.cond.forEach((c, k) => { if (k < J.n && typeof c === 'string' && c.startsWith('v:')) g[k] = Number(c.slice(2)); });
      return g;
    }
    /** "f_{X1X2}(0,1) = 1/9 + 1/9 = 2/9" pieces for a group of rows */
    function sumEq(ps, total, approx) { return sumEqWith(FM, ps, total, approx); }
    /** A column header: the variable's name; a new column also shows its formula under the name. */
    function varTh(J, k) {
      if (!isDer(J, k)) return h('th', { class: VC[k], html: tex(J.tex[k]) });
      return h('th', { class: VC[k] + ' mv-dth', title: 'new column ' + J.names[k] + ' = ' + J.derived[k - J.nBase].expr, html: tex(J.tex[k]) + '<div class="mv-dexpr">= ' + Lab.esc(J.derived[k - J.nBase].expr) + '</div>' });
    }
    /** The joint table drawn small, for panels that colour its rows. */
    function miniTable(J, classOf) {
      if (J.rows.length > MINI_ROWS) return null;
      const t = h('table', { class: 'tbl tp-tbl mv-mini' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'idx', text: 'row' }), J.tex.map((x, k) => varTh(J, k)), h('th', { html: tex(fNameJ(J)) }))));
      const tb = h('tbody');
      const trs = J.rows.map((r, i) => {
        const tr = h('tr', { class: classOf(i) || null }, h('td', { class: 'idx', text: String(i + 1) }), r.t.map(v => h('td', { text: vh(v) })), h('td', { class: 'pcol', html: FM.pH(r.p) }));
        tb.appendChild(tr);
        return tr;
      });
      t.appendChild(tb);
      const wrap = h('div', { class: 'tbl-wrap mv-scroll mv-mini-wrap' }, t);
      wrap.trs = trs;
      return wrap;
    }
    function linkRows(tr, mini, idx) {
      if (!mini || !idx.length) return;
      tr.classList.add('mv-linked');
      tr.addEventListener('mouseenter', () => idx.forEach(i => mini.trs[i].classList.add('mv-hl')));
      tr.addEventListener('mouseleave', () => idx.forEach(i => mini.trs[i].classList.remove('mv-hl')));
    }
    function note(html, cls) { return K.note(html, cls || 'small'); }
    /** Long result tables draw their first TABLE_MAX lines; the checks still add every value. */
    const capNote = (count, what) => (count > TABLE_MAX ? note('<span class="muted">Showing the first ' + TABLE_MAX + ' of the ' + count + ' ' + what + ' here; the check below adds all ' + count + '.</span>', 'xs') : null);
    /** A formula that stays on one line when it fits and wraps after = or + on a narrow screen. */
    const mathDiv = (src, cls) => h('div', { class: cls || 'mv-m', html: tex('\\displaystyle ' + src) });
    /** K.steps, with every formula drawn by mathDiv (its note stays under it). */
    function steps(list) {
      return K.steps(list.filter(Boolean).map(st0 => {
        if (!st0.math) return st0;
        const box = h('div', { class: 'mv-sm' }, mathDiv(st0.math));
        if (st0.note) box.appendChild(K.note(st0.note, 'small muted'));
        if (st0.block) Lab.mountBlock(st0.block, box);
        return { html: st0.html, block: box };
      }));
    }

    /* -------------------------------------------------------------- normalise */
    function normalizeOps(J) {
      const n = J.n, all = range(n);
      const fit = (arr, def) => { const a = Array.isArray(arr) ? arr.slice(0, n) : []; while (a.length < n) a.push(def(a.length)); return a; };
      st.keep = fit(st.keep, k => k < 2).map(Boolean);
      st.cond = fit(st.cond, () => 'sum').map((c, k) => {
        if (c === 'keep' || c === 'sum') return c;
        if (typeof c === 'string' && c.startsWith('v:')) { const v = Number(c.slice(2)); return 'v:' + String(J.ranges[k].includes(v) ? v : J.ranges[k][0]); }
        return 'sum';
      });
      const isPerm = p => Array.isArray(p) && p.length === n && all.every(k => p.includes(k));
      ['A', 'B'].forEach((w, wi) => {
        let p = Array.isArray(st.chain[w]) ? st.chain[w].filter(k => Number.isInteger(k) && k >= 0 && k < n) : [];
        p = p.filter((k, i) => p.indexOf(k) === i);
        all.forEach(k => { if (!p.includes(k)) p.push(k); });
        st.chain[w] = isPerm(p) ? p : wi ? all.slice() : all.slice().reverse();
      });
      const tup = Array.isArray(st.chain.tuple) && st.chain.tuple.length === n ? keyOf(st.chain.tuple) : null;
      let ri = tup ? J.rows.findIndex(r => keyOf(r.t) === tup) : -1;
      if (ri < 0) ri = J.rows.findIndex(r => !r.p.isZero());
      st.chain.tuple = J.rows[ri].t.slice();
      const sl = st.slice;
      if (n >= 3) {
        const roles = [sl.c, sl.r, sl.s];
        if (!roles.every(x => Number.isInteger(x) && x >= 0 && x < n) || new Set(roles).size < 3) {
          const used = roles.filter((x, i) => Number.isInteger(x) && x >= 0 && x < n && roles.indexOf(x) === i);
          const free = all.filter(k => !used.includes(k));
          ['c', 'r', 's'].forEach((role, i) => { const x = roles[i]; if (!(Number.isInteger(x) && x >= 0 && x < n && roles.indexOf(x) === i)) sl[role] = free.shift(); });
        }
        if (typeof sl.view !== 'string') sl.view = 'stack';
        if (sl.view.startsWith('given:') && !J.ranges[sl.s].includes(Number(sl.view.slice(6)))) sl.view = 'stack';
      }
      if (!(Number.isInteger(st.graph.v) && st.graph.v >= 0 && st.graph.v < n)) st.graph.v = 0;
      if (st.graph.mode !== 'cond') st.graph.mode = 'marg';
    }

    /* ------------------------------------------------------------------ drawing */
    function drawAll() {
      if (!good) { drawEmpty(); return; }
      const J = good;
      FM = makeFmt(J.style, J.D);
      normalizeOps(J);
      save();
      const R = {};
      guard(P.joint, () => drawJoint(J));
      guard(P.slices, () => drawSlices(J));
      guard(P.graph, () => drawGraph(J));
      guard(P.marg, () => { R.marg = drawMarg(J); });
      guard(P.cond, () => { R.cond = drawCond(J); });
      guard(P.chain, () => { R.chain = drawChain(J); });
      guard(P.answer, () => drawAnswer(J, R));
    }
    function guard(panel, fn) {
      try { fn(); } catch (err) {
        console.error(err);
        const b = panel.body || panel;
        Lab.clear(b);
        b.appendChild(h('div', { class: 'callout warn', text: 'This part could not be drawn: ' + err.message }));
      }
    }
    function drawEmpty() {
      const msg = 'Your joint PMF is not valid yet — fix the red message on the left and every panel appears.';
      Lab.clear(P.answer);
      P.answer.appendChild(K.note(msg, 'pl-ans-ev'));
      [P.joint, P.slices, P.graph, P.marg, P.cond, P.chain].forEach(pn => { Lab.clear(pn.body); pn.body.appendChild(note('<span class="muted">' + msg + '</span>')); });
    }
    const derOf = J => (J.derived && J.derived.length ? J.derived : null);
    const isDer = (J, k) => !!(J.derived && k >= J.nBase);
    /** "G and H" with their formulas: G = X1+X2+X3 */
    const derWords = J => andList(J.derived.map(d => J.tex[d.k])) + ' (' + J.derived.map(d => '<code>' + Lab.esc(d.name + ' = ' + d.expr) + '</code>').join(', ') + ')';
    function originWords(J) {
      if (J.origin === 'table') return 'you typed it as a table of ' + plural(J.rows.length, 'row') + (derOf(J) ? ', and ' + derWords(J) + ' ' + (J.derived.length === 1 ? 'is a new column' : 'are new columns') + ' computed from each row' : '');
      const x = J.exp;
      if (x.kind === 'coins') return 'from ' + tex('n=' + x.n) + ' tosses of a coin with ' + tex('p=' + FM.pT(x.p));
      if (x.kind === 'dice') return 'from ' + tex('k=' + x.k) + ' fair ' + (x.k === 1 ? 'die' : 'dice') + ' with ' + tex('s=' + x.s) + ' faces';
      return 'from a random number with ' + tex('D=' + x.D) + ' digit' + (x.D > 1 ? 's' : '') + ' (' + '0'.repeat(x.D) + '–' + '9'.repeat(x.D) + ')';
    }

    /* --------------------------------------------------------------- 1 · joint */
    function drawJoint(J) {
      const body = P.joint.body;
      Lab.clear(body);
      const all = range(J.n);
      const pr = st.preset != null ? PRESETS[st.preset] : null;
      P.joint.sub('Your ' + J.n + ' variables are ' + andList(J.tex) + '; ' + originWords(J) + '.' + (pr ? ' This is ' + pr.short + '.' : ''));
      body.appendChild(mathDiv((fNameJ(J) + '(' + tArgs(all) + ')=P(' + all.map(k => J.tex[k] + '=t_{' + (k + 1) + '}').join(',\\ ') + ')'), 'mv-def'));
      body.appendChild(note('In words: the probability that ' + (J.n > 2 ? 'all ' + J.n + ' variables take' : 'both variables take') + ' these values on the same outcome — every comma means AND.', 'small muted'));
      if (J.origin === 'exp') body.appendChild(steps(expSteps(J)));
      const exp = J.origin === 'exp';
      const t = h('table', { class: 'tbl tp-tbl mv-jt' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'idx', text: 'row' }), J.tex.map((x, k) => varTh(J, k)),
        exp ? h('th', { class: 'l', text: 'outcomes that give this tuple' }) : null, h('th', { html: tex(fNameJ(J)) }))));
      const tb = h('tbody');
      J.rows.forEach((r, i) => {
        const tr = h('tr', { class: r.p.isZero() ? 'mv-zero' : null }, h('td', { class: 'idx', text: String(i + 1) }), r.t.map(v => h('td', { text: vh(v) })));
        if (exp) tr.appendChild(h('td', { class: 'l mv-outs', text: memberText(r.members) }));
        const pc = h('td', { class: 'pcol' });
        pc.innerHTML = exp && r.members.length > 1 ? tex(sumEq(r.members.map(o => o.p), r.p)) : FM.pH(r.p);
        pc.dataset.p = r.p.toString();
        tr.dataset.t = keyOf(r.t);
        tr.appendChild(pc);
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap mv-scroll mv-jt-wrap' }, t));
      body.appendChild(steps(jointFacts(J)));
    }
    function memberText(ms) {
      const l = ms.map(o => o.label);
      if (l.length <= 12) return l.join(', ');
      return l.slice(0, 5).join(', ') + ', …, ' + l.slice(-2).join(', ') + ' (' + l.length + ' outcomes)';
    }
    function expSteps(J) {
      const x = J.exp, out = [];
      if (x.kind === 'coins') {
        const N = 1 << x.n;
        out.push({ html: 'You chose ' + tex('n=' + x.n) + ' tosses and ' + tex('p=' + FM.pT(x.p)) + ' (chance of heads on one toss). Every toss is H or T, so there are ' + tex('2^{n}=2^{' + x.n + '}=' + N) + ' sequences.' });
        if (x.p.eq(F(1, 2))) {
          out.push({ html: 'The tosses are independent, so multiply one factor per toss. With a fair coin every factor is ' + tex('\\tfrac12') + ', so a sequence with ' + tex('h') + ' heads has probability',
            math: 'p^{h}(1-p)^{n-h}=\\left(\\tfrac12\\right)^{h}\\left(\\tfrac12\\right)^{' + x.n + '-h}=\\left(\\tfrac12\\right)^{' + x.n + '}=\\frac{1}{' + N + '}', note: 'All ' + N + ' sequences are equally likely.' });
        } else {
          const lines = h('div', { class: 'mv-hlist' });
          range(x.n + 1).forEach(hh => {
            const fac = (hh ? '\\left(' + FM.pT(x.p) + '\\right)^{' + hh + '}' : '') + (x.n - hh ? '\\left(' + FM.pT(x.q) + '\\right)^{' + (x.n - hh) + '}' : '');
            lines.appendChild(h('div', { html: tex('h=' + hh + ':\\quad ' + fac + '=' + FM.pT(x.p.pow(hh).mul(x.q.pow(x.n - hh)))) }));
          });
          out.push({ html: 'The tosses are independent: a sequence with ' + tex('h') + ' heads and ' + tex('n-h=' + x.n + '-h') + ' tails has probability ' + tex('p^{h}(1-p)^{n-h}') + ', where ' + tex('1-p=1-' + FM.pT(x.p) + '=' + FM.pT(x.q)) + ':', block: lines });
        }
      } else if (x.kind === 'dice') {
        out.push({ html: 'You chose ' + tex('k=' + x.k) + ' fair ' + (x.k === 1 ? 'die' : 'dice') + ' with ' + tex('s=' + x.s) + ' faces each, so there are ' + tex('s^{k}=' + x.s + '^{' + x.k + '}=' + x.N) + ' equally likely outcomes, each with probability ' + tex('\\frac{1}{' + x.N + '}') + '.' });
      } else {
        out.push({ html: 'You chose ' + tex('D=' + x.D) + ' digit' + (x.D > 1 ? 's' : '') + ': the numbers ' + '0'.repeat(x.D) + ' to ' + '9'.repeat(x.D) + ', written with leading zeros, so there are ' + tex('10^{D}=10^{' + x.D + '}=' + x.N) + ' equally likely numbers, each with probability ' + tex('\\frac{1}{' + x.N + '}') + '.' });
      }
      out.push({ html: 'Your variables read each outcome: ' + J.names.map((nm, k) => tex(J.tex[k]) + ' = <code>' + Lab.esc(x.exprs[k]) + '</code>').join(', ') + '. Outcomes that give the same tuple share one row, and their probabilities are <b>added</b> (the last column).' +
        (x.zeroOutcomes ? ' ' + plural(x.zeroOutcomes, 'outcome') + ' have probability 0 (because ' + tex('p=' + FM.pT(x.p)) + ') and are left out.' : '') });
      return out;
    }
    function jointFacts(J) {
      const all = range(J.n);
      const sizes = J.ranges.map(r => r.length);
      const prod = sizes.reduce((a, b) => a * b, 1);
      const pos = J.rows.filter(r => !r.p.isZero()).length;
      const zeroIn = J.rows.filter(r => r.p.isZero() && r.t.every((v, k) => J.ranges[k].includes(v))).length;
      const zeroAll = J.rows.length - pos;
      const other = prod - pos - zeroIn;
      const ps = J.rows.map(r => r.p);
      let listed = (J.origin === 'table' ? 'Your table lists ' : 'Your experiment gives ') + pos + ' of them with positive probability' + (zeroAll ? ' (and ' + plural(zeroAll, 'row') + ' with probability 0)' : '') + '. ';
      listed += other > 0 ? 'The other ' + tex(K.intTex(prod) + '-' + (pos + zeroIn) + '=' + K.intTex(other)) + ' possible tuples are not listed: their probability is 0.' : 'That is every possible tuple.';
      const D = derOf(J);
      if (D) {
        const base = range(J.nBase), bProd = base.reduce((a, k) => a * sizes[k], 1);
        listed += ' Your new ' + (D.length === 1 ? 'column is computed' : 'columns are computed') + ' from ' + andList(base.map(k => J.tex[k])) + ', so at most ' + tex(base.map(k => '|T_{' + J.tex[k] + '}|').join('\\times ') + '=' + base.map(k => sizes[k]).join('\\times ') + '=' + K.intTex(bProd)) + ' of these tuples can have positive probability.';
      }
      return [
        D ? derStep(J) : null,
        { html: 'The <b>range</b> of each variable — the values it takes in the rows with positive probability:', math: all.map(k => 'T_{' + J.tex[k] + '}=' + setTex(J.ranges[k])).join(',\\quad ') },
        { html: 'One value from each range makes a tuple, so there are ' + tex(all.map(k => '|T_{' + J.tex[k] + '}|').join('\\times ') + '=' + sizes.join('\\times ') + '=' + K.intTex(prod)) + ' possible tuples. ' + listed },
        { html: 'Both properties of a joint PMF hold: every value is between 0 and 1, and all ' + plural(J.rows.length, 'row') + ' add up to 1:', math: '\\sum ' + fNameJ(J) + '=' + sumEq(ps, F.sum(ps)) + '\\ \\checkmark' },
      ];
    }
    /** The new columns, worked out row by row: "X1+X2+X3 = 0+1+2 = 3". */
    function derStep(J) {
      const D = J.derived, SHOW = 12;
      const subst = (src, t) => src.replace(/[A-Za-z_][A-Za-z0-9_]*/g, m => { const j = J.names.indexOf(m); if (j < 0 || j >= J.nBase) return m; const v = vh(t[j]); return /^[−-]/.test(v) ? '(' + v + ')' : v; });
      const t = h('table', { class: 'tbl tp-tbl mv-res mv-dtbl' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'idx', text: 'row' }), D.map(d => h('th', { class: VC[d.k], html: tex(J.tex[d.k]) + ' = <code>' + Lab.esc(d.expr) + '</code>' })))));
      const tb = h('tbody');
      J.rows.slice(0, SHOW).forEach((r, i) => {
        tb.appendChild(h('tr', {}, h('td', { class: 'idx', text: String(i + 1) }),
          D.map(d => h('td', { class: 'l', html: '<code>' + Lab.esc(subst(d.expr, r.t)) + '</code> = <b>' + Lab.esc(vh(r.t[d.k])) + '</b>' }))));
      });
      t.appendChild(tb);
      const more = J.rows.length > SHOW ? note('<span class="muted">Rows ' + (SHOW + 1) + '–' + J.rows.length + ' are computed the same way (panel 1 lists every value).</span>', 'xs') : null;
      return {
        html: '<b>New columns</b> (L2.10): a function of the variables is computed in every row, “make another column for it”. ' + derWords(J) + ', with the values of each row of the table above put in:',
        block: h('div', { class: 'mv-sm' }, h('div', { class: 'tbl-wrap' }, t), more,
          note('Each new column is a random variable too: on every outcome it has one value. Its PMF adds the rows that give each value (panel 3), and every row keeps its probability, so the table is still a joint PMF.', 'small muted')),
      };
    }

    /* -------------------------------------------------------------- 2 · slices */
    function drawSlices(J) {
      const body = P.slices.body;
      Lab.clear(body);
      if (J.n < 3) {
        P.slices.sub('Slices need three variables.');
        body.appendChild(note('You have ' + tex('n=2') + ' variables, so your joint PMF is already one small table. Set ' + tex('n') + ' to 3 or more, or add a variable, to cut it into slices.', 'small muted'));
        return;
      }
      const sl = st.slice;
      const c = sl.c, r = sl.r, s = sl.s;
      const others = range(J.n).filter(k => k !== c && k !== r && k !== s);
      P.slices.sub('Each small table holds the rows with one value of ' + tex(J.tex[s]) + ': ' + tex(J.tex[c]) + ' across, ' + tex(J.tex[r]) + ' down. ' +
        (others.length ? 'You have ' + J.n + ' variables, so each cell first adds the rows over ' + andList(others.map(k => J.tex[k])) + ' (that sum is written in the cell).' : 'Each cell with a number is exactly one row of your table (its row number is under it).'));
      const roleSel = (role, label) => {
        const sel = h('select', { class: 'field mv-sel', 'aria-label': label });
        J.names.forEach((nm, k) => sel.appendChild(h('option', { value: String(k), text: nm })));
        sel.value = String(sl[role]);
        sel.addEventListener('change', () => {
          const v = +sel.value, old = sl[role];
          ['c', 'r', 's'].forEach(o => { if (o !== role && sl[o] === v) sl[o] = old; });
          sl[role] = v;
          if (role === 's') sl.view = 'stack';
          save(); drawSlices(J);
        });
        return h('label', { class: 'mv-role' }, h('span', { text: label }), sel);
      };
      body.appendChild(h('div', { class: 'mv-ctl-row' }, roleSel('s', 'one table per value of'), roleSel('c', 'across'), roleSel('r', 'down')));
      const xs = J.ranges[c], ys = J.ranges[r], zs = J.ranges[s];
      const big = [[c, xs], [r, ys], [s, zs]].find(([, v]) => v.length > SLICE_MAX);
      if (big) { body.appendChild(note(tex(J.tex[big[0]]) + ' has ' + big[1].length + ' values. Slices are drawn when each of the three chosen variables has at most ' + SLICE_MAX + ' values — pick other variables above.', 'small muted')); return; }
      const cellOf = (x, y, z) => { const idx = allRows(J).filter(i => { const t = J.rows[i].t; return t[c] === x && t[r] === y && t[s] === z; }); return { idx, ps: idx.map(i => J.rows[i].p), p: sumP(J, idx) }; };
      const grid = zs.map(z => xs.map(x => ys.map(y => cellOf(x, y, z))));
      const cellHtml = q => {
        let src;
        if (!q.idx.length) src = 'no row';
        else if (q.idx.length === 1) src = 'row ' + (q.idx[0] + 1);
        else if (q.idx.length <= 3) src = q.ps.map(FM.sl).join(' + ');
        else src = rowList(q.idx);
        return '<div class="mv-cv">' + FM.pH(q.p) + '</div><div class="mv-cs">' + src + '</div>';
      };
      const view = sl.view || 'stack';
      const wrap = h('div', { class: 'mv-slices' });
      zs.forEach((z, zi) => {
        const cells = grid[zi].flat();
        const tot = F.sum(cells.map(q => q.p));
        const nz = cells.filter(q => !q.p.isZero()).map(q => q.p);
        const box = h('div', { class: 'mv-slice' + (view === 'given:' + z ? ' on' : view.startsWith('given:') ? ' dim' : '') });
        box.appendChild(h('div', { class: 'mv-slice-title', html: 'Slice ' + tex(J.tex[s] + '=' + vt(z)) }));
        box.appendChild(sliceTable(J, c, r, xs, ys, (xi, yi) => cellHtml(grid[zi][xi][yi]), (xi, yi) => grid[zi][xi][yi]));
        box.appendChild(h('div', { class: 'mv-slice-foot', html: 'Slice total: ' + tex('P(' + J.tex[s] + '=' + vt(z) + ')=' + sumEq(nz, tot)) }));
        wrap.appendChild(box);
      });
      body.appendChild(wrap);
      const btns = h('div', { class: 'btn-row' });
      btns.appendChild(Lab.button('Stack the slices (sum over ' + tex(J.tex[s]) + ')', () => { sl.view = 'stack'; save(); drawSlices(J); }, 'btn sm' + (view === 'stack' ? ' primary' : '')));
      zs.forEach(z => btns.appendChild(Lab.button('Given ' + tex(J.tex[s] + '=' + vt(z)), () => { sl.view = 'given:' + z; save(); drawSlices(J); }, 'btn sm' + (view === 'given:' + z ? ' primary' : ''))));
      body.appendChild(btns);
      const out = h('div', { class: 'mv-slice-out' });
      body.appendChild(out);
      const keep = [c, r].sort((a, b) => a - b);
      const cellArgs = (x, y) => keep.map(k => vt(k === c ? x : y)).join(',');
      if (view === 'stack') {
        const sums = xs.map((x, xi) => ys.map((y, yi) => { const parts = zs.map((z, zi) => grid[zi][xi][yi].p); return { parts, p: F.sum(parts) }; }));
        const summed = [s].concat(others).sort((a, b) => a - b);
        out.appendChild(h('div', { class: 'mv-out-title', html: 'Stack the ' + zs.length + ' slices and add them cell by cell. That sums over every value of ' + tex(J.tex[s]) + ', so the result is the marginal of ' + andList(keep.map(k => J.tex[k])) + ':' }));
        out.appendChild(mathDiv((fName(J, keep) + '(' + tArgs(keep) + ')=\\sum_{' + summed.map(k => "t_{" + (k + 1) + "}'").join(',') + '}' + fNameJ(J) + '(' + range(J.n).map(k => (keep.includes(k) ? 't_{' + (k + 1) + '}' : "t_{" + (k + 1) + "}'")).join(',') + ')'), 'mv-def'));
        out.appendChild(sliceTable(J, c, r, xs, ys, (xi, yi) => {
          const q = sums[xi][yi];
          const nzp = q.parts.filter(p => !p.isZero());
          const from = zs.filter((z, zi) => !q.parts[zi].isZero());
          return '<div class="mv-cv"><b>' + FM.pH(q.p) + '</b></div><div class="mv-cs">' + (nzp.length ? (nzp.length > 1 ? nzp.map(FM.sl).join(' + ') : 'from ' + J.names[s] + ' = ' + vh(from[0])) : 'all slices 0') + '</div>';
        }, (xi, yi) => ({ p: sums[xi][yi].p, t: cellArgs(xs[xi], ys[yi]) }), 'mv-st-res'));
        const vals = sums.flat().map(q => q.p).filter(p => !p.isZero());
        out.appendChild(note('These are the same numbers as keeping ' + andList(keep.map(k => J.tex[k])) + ' in panel 4. Check: ' + tex(sumEq(vals, F.sum(vals)) + '\\ \\checkmark')));
      } else if (view.startsWith('given:')) {
        const z = Number(view.slice(6)), zi = zs.indexOf(z);
        const cells = grid[zi];
        const tot = F.sum(cells.flat().map(q => q.p));
        out.appendChild(h('div', { class: 'mv-out-title', html: 'Only the slice ' + tex(J.tex[s] + '=' + vt(z)) + ' survives. Its total is ' + tex('P(' + J.tex[s] + '=' + vt(z) + ')=' + FM.pTD(tot)) + ' (under the slice above). Divide every cell by it:' }));
        out.appendChild(mathDiv((fName(J, keep, { [s]: z }) + '(' + tArgs(keep) + ')=\\dfrac{' + fName(J, keep.concat([s]).sort((a, b) => a - b)) + '(' + keep.concat([s]).sort((a, b) => a - b).map(k => (k === s ? vt(z) : 't_{' + (k + 1) + '}')).join(',') + ')}{' + fName(J, [s]) + '(' + vt(z) + ')}'), 'mv-def'));
        out.appendChild(sliceTable(J, c, r, xs, ys, (xi, yi) => {
          const q = cells[xi][yi];
          return '<div class="mv-cv"><b>' + tex(FM.pT(q.p.div(tot))) + '</b></div><div class="mv-cs">' + FM.sl(q.p) + ' ÷ ' + FM.sl(tot) + '</div>';
        }, (xi, yi) => ({ p: cells[xi][yi].p.div(tot), t: cellArgs(xs[xi], ys[yi]) }), 'mv-st-res'));
        const res = cells.flat().map(q => q.p.div(tot)).filter(p => !p.isZero());
        out.appendChild(note('This is ' + tex(fName(J, keep, { [s]: z })) + ', the joint PMF of ' + andList(keep.map(k => J.tex[k])) + ' given ' + tex(J.tex[s] + '=' + vt(z)) + '. It adds up to 1 again: ' + tex(sumEq(res, F.sum(res)) + '\\ \\checkmark')));
      }
    }
    function sliceTable(J, c, r, xs, ys, cellHtml, cellData, extra) {
      const t = h('table', { class: 'tbl mv-st' + (extra ? ' ' + extra : '') });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'mv-corner', html: tex(J.tex[r] + '\\,\\backslash\\,' + J.tex[c]) }), xs.map(x => h('th', { class: VC[c], html: tex(vt(x)) })))));
      const tb = h('tbody');
      ys.forEach((y, yi) => {
        const tr = h('tr', {}, h('th', { class: VC[r], html: tex(vt(y)) }));
        xs.forEach((x, xi) => {
          const td = h('td', { html: cellHtml(xi, yi) });
          const d = cellData(xi, yi);
          if (d && d.p) { td.dataset.p = d.p.toString(); if (d.p.isZero()) td.classList.add('mv-z'); }
          if (d && d.t) td.dataset.t = d.t;
          tr.appendChild(td);
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      return h('div', { class: 'tbl-wrap' }, t);
    }

    /* ------------------------------------------------------------ 3 · PMF & CDF */
    function drawGraph(J) {
      const body = P.graph.body;
      Lab.clear(body);
      const g = st.graph, k = g.v;
      const given = givenOf(J), gk = sortedKeys(given);
      const condIdx = gk.length ? matchIdx(J, given) : [];
      const condTot = sumP(J, condIdx);
      const canCond = gk.length > 0 && !condTot.isZero();
      const mode = g.mode === 'cond' && canCond ? 'cond' : 'marg';
      const vSel = K.selectField({ label: 'Variable', options: J.names.map((nm, i) => ({ value: String(i), label: nm })), value: String(k), onChange: v => { st.graph.v = +v; st.graph.t = null; save(); drawGraph(J); } });
      const seg = Lab.seg([{ label: 'Marginal ' + tex(fName(J, [k])), value: 'marg' }, { label: 'Given ' + (gk.length ? tex(eqTex(J, given)) : 'a condition (panel 5)'), value: 'cond' }], mode, v => { st.graph.mode = v; save(); drawGraph(J); });
      body.appendChild(h('div', { class: 'mv-ctl-row' }, vSel, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Which PMF' }), seg)));
      P.graph.sub(mode === 'cond'
        ? 'The PMF of ' + tex(J.tex[k]) + ' <b>given</b> ' + tex(eqTex(J, given)) + ' — the condition you set in panel 5 below. Every probability here is conditional.'
        : 'The marginal PMF of ' + tex(J.tex[k]) + ': keep ' + tex(J.tex[k]) + ', sum over the other ' + plural(J.n - 1, 'variable') + '. Pick “Given …” to use the condition of panel 5 instead.');
      if (g.mode === 'cond' && !canCond) body.appendChild(note('<span class="cbad">' + (gk.length ? 'No row has ' + tex(eqTex(J, given)) + ', so that condition has probability 0.' : 'Panel 5 has no fixed variable yet.') + '</span> Fix at least one variable to a value in panel 5 (“fix … = …”). Showing the marginal meanwhile.'));
      if (mode === 'marg' && isDer(J, k)) {
        const d = J.derived[k - J.nBase], base = range(J.nBase);
        body.appendChild(note(tex(J.tex[k]) + ' = <code>' + Lab.esc(d.expr) + '</code> is a function of ' + andList(base.map(q => J.tex[q])) + '. From L2.10 (minute 7): its PMF adds the joint PMF over every tuple that gives ' + tex(J.tex[k] + '=t') + ' — “sort of like ' + tex('g^{-1}(t)') + '”. In this table: add the rows whose ' + tex(J.tex[k]) + ' column is ' + tex('t') + '.', 'small'));
        body.appendChild(mathDiv(fName(J, [k]) + '(t)=P(' + J.tex[k] + '=t)=\\sum_{(' + tArgs(base) + '):\\ ' + J.tex[k] + '(' + tArgs(base) + ')=t}f_{' + base.map(q => J.tex[q]).join('') + '}(' + tArgs(base) + ')', 'mv-def'));
      }
      const vals = J.ranges[k];
      const data = vals.map(v => {
        const idx = (mode === 'cond' ? condIdx : allRows(J)).filter(i => J.rows[i].t[k] === v);
        const num = sumP(J, idx);
        return { x: v, idx, num, p: mode === 'cond' ? num.div(condTot) : num };
      });
      const nm = mode === 'cond' ? fName(J, [k], given) : fName(J, [k]);
      body.appendChild(K.pmfChart(data.map(d => ({ x: d.x, p: d.p, label: FM.pT(d.p) })), { xName: J.tex[k], xPlain: J.names[k], tone: TONE[k] || 'mass', showValues: data.length <= 40 }));
      if (data.length > 40) body.appendChild(note('<span class="muted">' + data.length + ' bars: their values are in the table below (and in each bar’s tooltip).</span>', 'xs'));
      const t = h('table', { class: 'tbl mv-res' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { html: tex(J.tex[k]) }), h('th', { text: mode === 'cond' ? 'rows (among the condition’s)' : 'rows' }),
        h('th', { text: mode === 'cond' ? 'numerator: add them' : 'add them' }), mode === 'cond' ? h('th', { text: 'divide by P(condition)' }) : null, h('th', { html: tex(nm) }))));
      const tb = h('tbody');
      data.slice(0, TABLE_MAX).forEach(d => {
        const ps = d.idx.map(i => J.rows[i].p);
        const tr = h('tr', { class: d.p.isZero() ? 'mv-zero' : null }, h('td', { html: tex(vt(d.x)) }), h('td', { class: 'small', text: rowList(d.idx) }),
          h('td', { html: d.idx.length ? tex(sumEq(ps, d.num)) : '<span class="muted">none: 0</span>' }),
          mode === 'cond' ? h('td', { html: tex('\\dfrac{' + FM.sl(d.num) + '}{' + FM.sl(condTot) + '}') }) : null,
          h('td', { html: '<b>' + tex(FM.pTA(d.p)) + '</b>' }));
        tr.dataset.p = d.p.toString();
        tr.dataset.t = vt(d.x);
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap' }, t));
      const cg = capNote(data.length, 'values of ' + J.names[k]);
      if (cg) body.appendChild(cg);
      const tot = F.sum(data.map(d => d.p));
      body.appendChild(note((mode === 'cond' ? 'The condition ' + tex(eqTex(J, given)) + ' holds in ' + rowList(condIdx) + ', with total ' + tex('P(' + eqTex(J, given) + ')=' + sumEq(condIdx.map(i => J.rows[i].p), condTot)) + ' — the denominator. ' : '') +
        'The bars add up to ' + tex(sumEq(data.map(d => d.p).filter(p => !p.isZero()), tot) + (tot.eq(1) ? '\\ \\checkmark' : ''))));
      if (mode === 'cond') body.appendChild(note('In the CDF below every probability is conditional: read ' + tex('F(t)') + ' as ' + tex('P(' + J.tex[k] + '\\le t\\mid ' + eqTex(J, given) + ')') + '.', 'small muted'));
      body.appendChild(K.cdfChart({ vals, p: data.map(d => d.p) }, { xName: J.tex[k], t: g.t != null ? g.t : undefined, onT: v => { st.graph.t = v; save(); } }));
    }

    /* ------------------------------------------------------------- 4 · marginal */
    function marginalGroups(J, keep, within) {
      const map = new Map();
      (within || allRows(J)).forEach(i => {
        const r = J.rows[i];
        const t = keep.map(k => r.t[k]);
        const key = keyOf(t);
        if (!map.has(key)) map.set(key, { t, idx: [], p: F(0) });
        const g = map.get(key);
        g.idx.push(i);
        g.p = g.p.add(r.p);
      });
      return [...map.values()].sort((a, b) => cmpT(a.t, b.t));
    }
    function drawMarg(J) {
      const body = P.marg.body;
      Lab.clear(body);
      const all = range(J.n);
      const chips = h('div', { class: 'mv-keep' });
      J.names.forEach((nm, k) => {
        const cb = h('input', { type: 'checkbox', 'aria-label': 'keep ' + nm });
        cb.checked = !!st.keep[k];
        cb.addEventListener('change', () => { st.keep[k] = cb.checked; save(); drawAll(); });
        chips.appendChild(h('label', { class: 'mv-chip ' + VC[k] + (cb.checked ? ' on' : '') }, cb, h('span', { html: 'keep ' + tex(J.tex[k]) })));
      });
      body.appendChild(h('div', { class: 'mv-ctl-row' }, h('span', { class: 'mv-ctl-lab', text: 'Tick the variables you want:' }), chips));
      const keep = all.filter(k => st.keep[k]), sum = all.filter(k => !st.keep[k]);
      if (!keep.length) { body.appendChild(note('<span class="cbad">Keep at least one variable</span> — a marginal is the PMF of the variables you keep.')); return null; }
      const groups = marginalGroups(J, keep);
      if (!sum.length) {
        body.appendChild(note('You keep all ' + J.n + ' variables, so nothing is summed: the “marginal” of all of them is the joint PMF itself (panel 1). Untick a variable to sum it out.'));
        return { keep, groups };
      }
      const lhs = fName(J, keep) + '(' + tArgs(keep) + ')';
      const rhs = '\\sum_{' + sum.map(k => "t_{" + (k + 1) + "}'\\in T_{" + J.tex[k] + '}').join(',\\ ') + '}' + fNameJ(J) + '(' + all.map(k => (keep.includes(k) ? 't_{' + (k + 1) + '}' : "t_{" + (k + 1) + "}'")).join(',') + ')';
      const mini = miniTable(J, i => 'g' + (groups.findIndex(g => g.idx.includes(i)) % 8));
      const rt = h('table', { class: 'tbl mv-res' });
      rt.appendChild(h('thead', {}, h('tr', {}, h('th'), keep.map(k => h('th', { class: VC[k], html: tex(J.tex[k]) })), h('th', { text: 'rows it collects' }), h('th', { text: 'add them' }), h('th', { html: tex(fName(J, keep)) }))));
      const tb = h('tbody');
      groups.slice(0, TABLE_MAX).forEach((g, gi) => {
        const tr = h('tr', {}, h('td', {}, h('span', { class: 'tp-chip g' + (gi % 8) })), g.t.map(v => h('td', { text: vh(v) })), h('td', { class: 'small', text: rowList(g.idx) }),
          h('td', { html: tex(g.idx.length > 1 ? FM.sumT(g.idx.map(i => J.rows[i].p)) : FM.pT(g.p)) }), h('td', { html: '<b>' + tex(FM.pTDA(g.p)) + '</b>' }));
        tr.dataset.p = g.p.toString();
        tr.dataset.t = keyOf(g.t);
        linkRows(tr, mini, g.idx);
        tb.appendChild(tr);
      });
      rt.appendChild(tb);
      const stage = h('div', { class: 'mv-stage' }, mini, h('div', { class: 'mv-res-wrap' }, h('div', { class: 'tbl-wrap' }, rt), capNote(groups.length, 'values')));
      const tot = F.sum(groups.map(g => g.p));
      const grid = keep.length === 2 ? pairGrid(J, keep[0], keep[1], groups) : null;
      body.appendChild(steps([
        { html: 'You keep ' + andList(keep.map(k => J.tex[k])) + ' and sum over ' + andList(sum.map(k => J.tex[k])) + ': “keep what you want, sum over everything else”. Kept slots get plain ' + tex('t') + '’s; summed slots get primed ' + tex("t'") + '’s that run through their whole range:', math: lhs + '=' + rhs },
        { html: 'Group the ' + plural(J.rows.length, 'row') + ' of panel 1 by their kept values ' + tex('(' + tArgs(keep) + ')') + '. Rows with the same kept values (same colour) are added — ' + plural(groups.length, 'group') + ':' + (mini ? ' <span class="muted">Point at a result to light up its rows.</span>' : ' <span class="muted">(Row numbers refer to panel 1.)</span>'), block: stage },
        grid ? { html: 'The same ' + plural(groups.length, 'value') + ' as a table, ' + tex(J.tex[keep[0]]) + ' across and ' + tex(J.tex[keep[1]]) + ' down; an empty pair is 0. Adding down each column gives ' + tex(fName(J, [keep[0]])) + ', adding along each row gives ' + tex(fName(J, [keep[1]])) + ' (the margins):', block: grid } : null,
        { html: 'Check: a marginal PMF is a PMF, so its values add up to 1:', math: sumEq(groups.map(g => g.p), tot) + (tot.eq(1) ? '\\ \\checkmark' : '') },
      ]));
      return { keep, groups };
    }
    /** The marginal of two kept variables as a 2-D table with both margins (the lecture's picture of a joint PMF). */
    function pairGrid(J, a, b, groups) {
      const xs = J.ranges[a], ys = J.ranges[b];
      if (!xs.length || !ys.length || xs.length > SLICE_MAX || ys.length > SLICE_MAX) return null;
      const cell = (x, y) => { const g = groups.find(G => G.t[0] === x && G.t[1] === y); return g ? g.p : F(0); };
      const colS = xs.map(x => F.sum(ys.map(y => cell(x, y)))), rowS = ys.map(y => F.sum(xs.map(x => cell(x, y))));
      const margHtml = s => '<div class="mv-cv">' + FM.pH(s) + '</div>';
      /** the margins written out under the table: f_H(0) = 1/9 + 2/9 + 2/9 + 1/9 = 6/9 = 2/3, … */
      const sums = (k, vals, cellsOf, tots) => vals.map((v, i) => { const nz = cellsOf(v).filter(p => !p.isZero()); return '<span class="mv-nw">' + tex(fName(J, [k]) + '(' + vt(v) + ')=' + (nz.length ? sumEq(nz, tots[i]) : '0')) + '</span>'; }).join(', ');
      const t = h('table', { class: 'tbl mv-st mv-pair' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'mv-corner', html: tex(J.tex[b] + '\\,\\backslash\\,' + J.tex[a]) }), xs.map(x => h('th', { class: VC[a], html: tex(vt(x)) })), h('th', { class: 'mv-marg-h', html: tex(fName(J, [b])) }))));
      const tb = h('tbody');
      ys.forEach((y, yi) => {
        const tr = h('tr', {}, h('th', { class: VC[b], html: tex(vt(y)) }));
        xs.forEach(x => {
          const p = cell(x, y);
          const td = h('td', { class: p.isZero() ? 'mv-z' : null, html: '<div class="mv-cv">' + FM.pH(p) + '</div>' });
          td.dataset.p = p.toString();
          td.dataset.t = vt(x) + ',' + vt(y);
          tr.appendChild(td);
        });
        tr.appendChild(h('td', { class: 'mv-marg', html: margHtml(rowS[yi]) }));
        tb.appendChild(tr);
      });
      tb.appendChild(h('tr', { class: 'mv-marg-row' }, h('th', { class: 'mv-marg-h', html: tex(fName(J, [a])) }), colS.map(s => h('td', { class: 'mv-marg', html: margHtml(s) })), h('td', { class: 'mv-marg', html: margHtml(F.sum(colS)) })));
      t.appendChild(tb);
      return h('div', { class: 'mv-sm' }, h('div', { class: 'tbl-wrap' }, t),
        note('Along each row: ' + sums(b, ys, y => xs.map(x => cell(x, y)), rowS) + '.<br>Down each column: ' + sums(a, xs, x => ys.map(y => cell(x, y)), colS) + '.', 'small mv-pair-sums'));
    }

    /* ---------------------------------------------------------- 5 · conditional */
    function drawCond(J) {
      const body = P.cond.body;
      Lab.clear(body);
      const all = range(J.n);
      const grid = h('div', { class: 'mv-cond-grid' });
      J.names.forEach((nm, k) => {
        const s = h('select', { class: 'field mv-sel', 'aria-label': 'role of ' + nm });
        [['keep', 'ask about it (keep)'], ['sum', 'sum it out']].concat(J.ranges[k].map(v => ['v:' + String(v), 'fix ' + nm + ' = ' + vh(v)])).forEach(([v, l]) => s.appendChild(h('option', { value: v, text: l })));
        s.value = st.cond[k];
        s.addEventListener('change', () => { st.cond[k] = s.value; save(); drawAll(); });
        grid.appendChild(h('label', { class: 'mv-cond-item' }, h('span', { class: 'mv-vname ' + VC[k], html: tex(J.tex[k]) }), s));
      });
      body.appendChild(note('For each variable choose: <b>fix</b> it to a value (the condition, after the bar), <b>ask about it</b> (it stays in the answer), or <b>sum it out</b> (you do not care about it).', 'small muted'));
      body.appendChild(grid);
      const keep = all.filter(k => st.cond[k] === 'keep'), sum = all.filter(k => st.cond[k] === 'sum');
      const given = givenOf(J), gk = sortedKeys(given);
      if (!gk.length) { body.appendChild(note('<span class="cbad">Fix at least one variable</span> to a value to condition on it. With nothing fixed, what you get is a marginal — panel 4.')); return null; }
      if (!keep.length) { body.appendChild(note('<span class="cbad">Ask about at least one variable</span> (“ask about it (keep)”): that is what the conditional PMF describes.')); return null; }
      const idx = matchIdx(J, given);
      const total = sumP(J, idx);
      const gNames = gk.map(k => J.tex[k]).join('');
      const lhs = fName(J, keep, given) + '(' + tArgs(keep) + ')';
      const numIdx = keep.concat(gk).sort((a, b) => a - b);
      const numSym = fName(J, numIdx) + '(' + numIdx.map(k => (k in given ? vt(given[k]) : 't_{' + (k + 1) + '}')).join(',') + ')';
      const denSym = 'f_{' + gNames + '}(' + gk.map(k => vt(given[k])).join(',') + ')';
      const L = [];
      L.push({ html: 'You fix ' + tex(eqTex(J, given)) + ' (the condition), ask about ' + andList(keep.map(k => J.tex[k])) + (sum.length ? ' and sum over ' + andList(sum.map(k => J.tex[k])) : '') + '. A conditional PMF is the joint PMF of everything involved divided by the marginal of what you fix:',
        math: lhs + '=\\dfrac{' + numSym + '}{' + denSym + '}',
        note: sum.length ? 'The numerator is itself a marginal: it adds over ' + andList(sum.map(k => J.tex[k])) + ', ' + tex(numSym + '=\\sum_{' + sum.map(k => "t_{" + (k + 1) + "}'").join(',') + '}' + fNameJ(J) + '(' + all.map(k => (k in given ? vt(given[k]) : keep.includes(k) ? 't_{' + (k + 1) + '}' : "t_{" + (k + 1) + "}'")).join(',') + ')') + '.' : '' });
      if (total.isZero()) {
        L.push({ html: '<span class="cbad">No row has ' + tex(eqTex(J, given)) + '.</span> The condition has probability ' + tex('P(' + eqTex(J, given) + ')=0') + ', so the conditional PMF is <b>not defined</b> (it would divide by 0). Pick values that occur together in some row.' });
        body.appendChild(steps(L));
        return { keep, given, total, groups: null };
      }
      const pc = idx.map(i => J.rows[i].p);
      L.push({ html: 'Zoom into the rows where the condition holds: ' + rowList(idx) + ' — ' + idx.length + ' of the ' + J.rows.length + '. Their total is the probability of the condition, the denominator:', math: 'P(' + eqTex(J, given) + ')=' + denSym + '=' + sumEq(pc, total) });
      // every tuple of the asked variables seen in the table, so impossible ones show as 0
      const groups = marginalGroups(J, keep, idx);
      marginalGroups(J, keep).forEach(G => { if (!groups.some(g => keyOf(g.t) === keyOf(G.t))) groups.push({ t: G.t, idx: [], p: F(0) }); });
      groups.sort((a, b) => cmpT(a.t, b.t));
      groups.forEach(g => (g.res = g.p.div(total)));
      let ci = 0;
      groups.forEach(g => (g.color = g.idx.length ? ci++ % 8 : -1));
      const mini = miniTable(J, i => { if (!idx.includes(i)) return 'dim'; const g = groups.find(G => G.idx.includes(i)); return g ? 'g' + g.color : 'on'; });
      const rt = h('table', { class: 'tbl mv-res' });
      rt.appendChild(h('thead', {}, h('tr', {}, h('th'), keep.map(k => h('th', { class: VC[k], html: tex(J.tex[k]) })), h('th', { text: 'rows' }), h('th', { text: 'numerator: add them' }), h('th', { html: 'divide by ' + tex(FM.pT(total)) }), h('th', { html: tex(fName(J, keep, given)) }))));
      const tb = h('tbody');
      groups.slice(0, TABLE_MAX).forEach(g => {
        const ps = g.idx.map(i => J.rows[i].p);
        const tr = h('tr', { class: g.idx.length ? null : 'mv-zero' }, h('td', {}, g.idx.length ? h('span', { class: 'tp-chip g' + g.color }) : null), g.t.map(v => h('td', { text: vh(v) })),
          h('td', { class: 'small', text: g.idx.length ? rowList(g.idx) : 'none' }),
          h('td', { html: g.idx.length ? tex(sumEq(ps, g.p)) : tex('0') }),
          h('td', { html: tex('\\dfrac{' + FM.sl(g.p) + '}{' + FM.sl(total) + '}') }),
          h('td', { html: '<b>' + tex(FM.pTA(g.res)) + '</b>' }));
        tr.dataset.p = g.res.toString();
        tr.dataset.t = keyOf(g.t);
        linkRows(tr, mini, g.idx);
        tb.appendChild(tr);
      });
      rt.appendChild(tb);
      const zeroCount = groups.filter(g => !g.idx.length).length;
      L.push({ html: 'For each value of ' + (keep.length > 1 ? 'the tuple ' + tex('(' + tArgs(keep) + ')') : tex(J.tex[keep[0]])) + ': add its rows among those (the numerator), then divide by ' + tex('P(' + eqTex(J, given) + ')=' + FM.pT(total)) + '.' +
        (zeroCount ? ' ' + plural(zeroCount, 'value') + ' never ' + (zeroCount === 1 ? 'happens' : 'happen') + ' under the condition (grey) — the range of a conditional can be smaller.' : '') + (mini ? ' <span class="muted">Point at a result to light up its rows; rows outside the condition are faded.</span>' : ''),
        block: h('div', { class: 'mv-stage' }, mini, h('div', { class: 'mv-res-wrap' }, h('div', { class: 'tbl-wrap' }, rt), capNote(groups.length, 'values'))) });
      const rs = groups.map(g => g.res).filter(p => !p.isZero());
      const rt2 = F.sum(rs);
      L.push({ html: 'Check: a conditional PMF is a PMF, so its values add up to 1:', math: sumEq(rs, rt2) + (rt2.eq(1) ? '\\ \\checkmark' : '') });
      body.appendChild(steps(L));
      return { keep, given, total, groups };
    }

    /* ------------------------------------------------------------ 6 · chain rule */
    function chainCalc(J, order, row) {
      const factors = [];
      let prevIdx = allRows(J), prevP = F(1), dead = false;
      order.forEach((k, j) => {
        const S = order.slice(0, j + 1);
        const idx = allRows(J).filter(i => S.every(q => J.rows[i].t[q] === row.t[q]));
        const num = sumP(J, idx);
        let val = null;
        if (!dead) { if (j === 0) val = num; else if (!prevP.isZero()) val = num.div(prevP); }
        factors.push({ j, k, prev: order.slice(0, j), idx, prevIdx, num, den: prevP, val });
        if (val == null || val.isZero()) dead = true;
        prevIdx = idx; prevP = num;
      });
      const vals = factors.map(f => f.val);
      const product = vals.some(v => v != null && v.isZero()) ? F(0) : vals.every(v => v != null) ? vals.reduce((a, b) => a.mul(b), F(1)) : null;
      return { factors, product };
    }
    function drawChain(J) {
      const body = P.chain.body;
      Lab.clear(body);
      const ri = J.rows.findIndex(r => keyOf(r.t) === keyOf(st.chain.tuple));
      const row = J.rows[ri];
      const tupSel = h('select', { class: 'field pl-select', 'aria-label': 'the joint entry to rebuild' });
      J.rows.forEach((r, i) => tupSel.appendChild(h('option', { value: String(i), text: 'row ' + (i + 1) + ':  ' + tupH(r.t) + '   f = ' + FM.plain(r.p) })));
      tupSel.value = String(ri);
      tupSel.addEventListener('change', () => { st.chain.tuple = J.rows[+tupSel.value].t.slice(); save(); drawAll(); });
      body.appendChild(h('div', { class: 'mv-ctl-row' }, h('div', { class: 'pl-field mv-tuple' }, h('label', { class: 'pl-label', text: 'The joint entry to rebuild (a row of panel 1)' }), tupSel)));
      body.appendChild(h('div', { class: 'mv-orders' }, orderPicker(J, 'A'), orderPicker(J, 'B')));
      const A = chainCalc(J, st.chain.A, row), B = chainCalc(J, st.chain.B, row);
      body.appendChild(chainBlock(J, 'A', st.chain.A, row, ri, A));
      body.appendChild(chainBlock(J, 'B', st.chain.B, row, ri, B));
      const all = range(J.n);
      const target = fNameJ(J) + '(' + vArgs(row.t, all) + ')';
      const same = A.product && B.product && A.product.eq(B.product) && A.product.eq(row.p);
      const why = h('div', { class: 'mv-why' });
      if (row.p.isZero()) Lab.setHTML(why, '<b>' + (same ? 'Both orders give ' + tex(target + '=0') + ' ✓' : 'Compare the two orders') + '.</b> This joint entry is 0, so in every order some factor is 0, and each conditional after that factor is not defined — its condition has probability 0. As soon as one factor is 0 the product is 0, which matches the table. (For a non-zero entry the denominators cancel one by one; that argument needs every condition to have positive probability, so it does not apply here.)');
      else Lab.setHTML(why, '<b>' + (same ? 'Both orders give ' + tex(target + '=' + FM.pT(row.p)) + ' ✓' : 'Compare the two orders') + '.</b> Why the order does not matter: each conditional is “joint ÷ marginal”, so in the product every denominator cancels the numerator just before it. For order A:' +
        '<div class="mv-tele mv-m">' + tex('\\displaystyle ' + teleTex(J, st.chain.A, row, A)) + '</div>' +
        'The same AND, bracketed in a different order, is the same event — so every order rebuilds the same number.');
      body.appendChild(why);
      return { row, ri, A, B };
    }
    function teleTex(J, order, row, calc) {
      const mName = S => { const s = S.slice().sort((a, b) => a - b); return 'f_{' + s.map(k => J.tex[k]).join('') + '}(' + vArgs(row.t, s) + ')'; };
      const sym = order.map((k, j) => (j === 0 ? mName([k]) : '\\dfrac{' + mName(order.slice(0, j + 1)) + '}{' + mName(order.slice(0, j)) + '}')).join('\\cdot ');
      const ok = calc.factors.every(f => f.j === 0 || !f.den.isZero());
      const num = ok ? '=' + calc.factors.map(f => (f.j === 0 ? FM.pT(f.num) : '\\dfrac{' + FM.sl(f.num) + '}{' + FM.sl(f.den) + '}')).join('\\cdot ') : '';
      return sym + num + '=' + mName(order) + '=' + FM.pT(row.p);
    }
    function orderPicker(J, which) {
      const ord = st.chain[which];
      const wrap = h('div', { class: 'mv-order' }, h('span', { class: 'mv-order-lab', text: 'Order ' + which + ':' }));
      ord.forEach((k, pos) => {
        if (pos) wrap.appendChild(h('span', { class: 'mv-arrow', text: '→' }));
        const s = h('select', { class: 'field mv-sel mv-ord ' + VC[k], 'aria-label': 'order ' + which + ', position ' + (pos + 1) });
        J.names.forEach((nm, i) => s.appendChild(h('option', { value: String(i), text: nm })));
        s.value = String(k);
        s.addEventListener('change', () => {
          const v = +s.value, o = st.chain[which].slice();
          const other = o.indexOf(v);
          o[other] = o[pos]; o[pos] = v;
          st.chain[which] = o; save(); drawAll();
        });
        wrap.appendChild(s);
      });
      wrap.appendChild(Lab.button('reverse', () => { st.chain[which] = st.chain[which].slice().reverse(); save(); drawAll(); }, 'btn xs ghost'));
      return wrap;
    }
    function chainBlock(J, which, order, row, ri, calc) {
      const all = range(J.n);
      const box = h('section', { class: 'mv-chain' });
      box.dataset.order = which;
      const condSym = (j, useVals) => {
        const k = order[j], prev = order.slice(0, j).sort((a, b) => a - b);
        const arg = useVals ? vt(row.t[k]) : 't_{' + (k + 1) + '}';
        return 'f_{' + J.tex[k] + (prev.length ? '\\mid ' + prev.map(q => J.tex[q] + '=' + (useVals ? vt(row.t[q]) : 't_{' + (q + 1) + '}')).join(',') : '') + '}(' + arg + ')';
      };
      const mName = S => { const s = S.slice().sort((a, b) => a - b); return 'f_{' + s.map(k => J.tex[k]).join('') + '}(' + vArgs(row.t, s) + ')'; };
      const target = fNameJ(J) + '(' + vArgs(row.t, all) + ')';
      box.appendChild(h('div', { class: 'mv-chain-head', html: '<b>Order ' + which + '</b>: ' + tex(order.map(k => J.tex[k]).join('\\to ')) + ' — start with the marginal of ' + tex(J.tex[order[0]]) + '; each next factor conditions on <b>every</b> variable already used.' }));
      box.appendChild(mathDiv((fNameJ(J) + '(' + tArgs(all) + ')=' + order.map((_, j) => condSym(j, false)).join('\\cdot ')), 'mv-def'));
      const L = [{ html: 'At your tuple ' + tex('(' + vArgs(row.t, all) + ')') + ' (row ' + (ri + 1) + ' of panel 1):', math: target + '=' + order.map((_, j) => condSym(j, true)).join('\\cdot ') }];
      calc.factors.forEach(f => {
        const k = f.k, eq = tex(J.tex[k] + '=' + vt(row.t[k]));
        const ps = f.idx.map(i => J.rows[i].p);
        if (f.j === 0) {
          L.push({ html: 'Factor 1 is a marginal: add the rows with ' + eq + ' — ' + rowList(f.idx) + ':', math: condSym(0, true) + '=' + sumEq(ps, f.num) });
        } else if (f.den.isZero()) {
          L.push({ html: 'Factor ' + (f.j + 1) + ', ' + tex(condSym(f.j, true)) + ', is <b>not defined</b>: its condition has probability ' + tex(mName(f.prev) + '=0') + ' (division by 0). The chain already reached 0 before it.' });
        } else {
          const dd = isDer(J, k) ? J.derived[k - J.nBase] : null;
          const fixedBy = dd && dd.uses.every(q => f.prev.includes(q)) && f.val && f.val.eq(1)
            ? ' ' + tex(J.tex[k]) + ' is computed from ' + (dd.uses.length ? andList(dd.uses.map(q => J.tex[q])) : 'no variable at all') + ', which ' + (dd.uses.length === 1 ? 'is' : 'are') + ' fixed already, so it has only one possible value: this factor is 1.' : '';
          L.push({ html: 'Factor ' + (f.j + 1) + ' = joint ÷ marginal of the condition. Of the rows used just before (' + rowList(f.prevIdx) + '), keep those with also ' + eq + ': ' + rowList(f.idx) + (f.idx.length ? '' : ' — none') + '.' + fixedBy,
            math: condSym(f.j, true) + '=\\dfrac{' + mName(order.slice(0, f.j + 1)) + '}{' + mName(f.prev) + '}=\\dfrac{' + FM.sl(f.num) + '}{' + FM.sl(f.den) + '}=' + FM.pT(f.val),
            note: f.idx.length > 1 ? 'Numerator: ' + tex(mName(order.slice(0, f.j + 1)) + '=' + sumEq(ps, f.num)) + '. The denominator is the numerator of the factor before.' : 'The denominator ' + tex(FM.pT(f.den)) + ' is the numerator of the factor before.' });
        }
      });
      if (calc.product) {
        const vals = calc.factors.map(f => f.val).filter(v => v != null);
        let mid = '';
        if (FM.style === 'frac' && vals.length > 1 && vals.every(v => !v.approx && !v.isZero())) {
          const nn = vals.reduce((a, v) => a * v.n, 1), dd = vals.reduce((a, v) => a * v.d, 1);
          if (Number.isSafeInteger(nn) && Number.isSafeInteger(dd) && dd !== calc.product.d) mid = '=\\frac{' + nn + '}{' + dd + '}';
        }
        const stopped = vals.length < calc.factors.length;
        L.push({ html: stopped ? 'Factor ' + vals.length + ' is 0, so the product is 0 whatever comes after (the later factors are not even defined):' : 'Multiply the ' + plural(vals.length, 'factor') + ':', math: target + '=' + vals.map(v => FM.pT(v)).join('\\cdot ') + (stopped ? '\\cdots' : mid) + '=' + FM.pTA(calc.product) });
        const eq = calc.product.eq(row.p);
        L.push({ html: 'Compare with row ' + (ri + 1) + ' of panel 1: ' + tex(target + '=' + FM.pT(row.p)) + (eq ? ' — <span class="cgood">the same ✓</span>' : ' — <span class="cbad">different</span>') + '.' });
      }
      box.appendChild(steps(L));
      box.dataset.p = calc.product ? calc.product.toString() : '';
      box.dataset.factors = calc.factors.map(f => (f.val ? f.val.toString() : 'undef')).join(';');
      return box;
    }

    /* ---------------------------------------------- 7 · how many cells a joint range has */
    const bigTex = b => b.toLocaleString('en-US').replace(/,/g, '{,}');
    const bigTxt = b => b.toLocaleString('en-US');
    function buildSize() {
      const body = P.size.body;
      Lab.clear(body);
      const S = st.size;
      P.size.sub('From ' + 'L1.5' + ': a joint PMF gives one probability for every tuple, one value from each range — the Cartesian product of the ranges. Type how many values each variable has, or load a lecture example.');
      ctl.sizePre = K.presets({ label: 'Lecture examples for this panel', items: SIZE_PRESETS, onPick: it => {
        S.preset = SIZE_PRESETS.indexOf(it); S.sizes = it.sizes; S.N = it.N;
        ctl.sizeList.input.value = it.sizes; ctl.sizeN.set(it.N);
        save(); paintSize();
      } });
      const unload = () => { if (S.preset == null) return; S.preset = null; ctl.sizePre.select.value = ''; const src = ctl.sizePre.querySelector('.pl-hint'); if (src) src.textContent = ''; };
      ctl.sizeList = K.listField({
        label: 'Range sizes ' + tex('|T_{X_1}|,\\ |T_{X_2}|,\\ \\dots') + ' — how many values each variable has, one number per variable', value: S.sizes, rows: 1,
        hint: nums => tex('n=' + nums.length) + (nums.length === 1 ? ' variable' : ' variables'),
        onChange: () => { const txt = ctl.sizeList.input.value; if (txt !== S.sizes) { S.sizes = txt; unload(); save(); } paintSize(); },
      });
      ctl.sizeN = K.numField({ label: 'Observations ' + tex('N') + ' you have, for example matches in the data (0 = none)', min: 0, max: 100000, step: 1, value: S.N, onChange: v => { if (v === S.N) return; S.N = v; unload(); save(); paintSize(); } });
      const mine = Lab.button('Use the ranges of my joint PMF (panel 1)', () => {
        if (!good) return;
        S.sizes = good.ranges.map(r => r.length).join(', ');
        ctl.sizeList.input.value = S.sizes;
        unload(); save(); paintSize();
      }, 'btn xs');
      ctl.sizeOut = h('div', { class: 'mv-size-out' });
      body.append(h('div', { class: 'mv-size-ctl' }, ctl.sizePre, ctl.sizeList, ctl.sizeN, h('div', { class: 'pl-chips' }, mine)), ctl.sizeOut);
      if (S.preset != null) { ctl.sizePre.select.value = String(S.preset); const src = ctl.sizePre.querySelector('.pl-hint'); if (src) Lab.setHTML(src, 'From: ' + SIZE_PRESETS[S.preset].source); }
      paintSize();
    }
    function paintSize() {
      const out = ctl.sizeOut, S = st.size;
      if (!out) return;
      Lab.clear(out);
      const { nums, bad } = K.parseList(S.sizes);
      const err = bad.length || !nums.length ? 'Type the range sizes as whole numbers, for example 9, 9, 9.'
        : nums.some(x => !Number.isInteger(x) || x < 1) ? 'Each range size counts values, so it is a whole number, at least 1.'
          : nums.length > 20 ? 'At most 20 variables here.' : nums.some(x => x > 1e6) ? 'At most 1,000,000 values per variable here.' : '';
      if (err) { out.appendChild(note('<span class="cbad">' + err + '</span>')); return; }
      const n = nums.length, N = Number.isInteger(S.N) && S.N > 0 ? S.N : 0;
      const prod = nums.reduce((a, x) => a * BigInt(x), 1n);
      const same = nums.every(x => x === nums[0]);
      const pw = same && n > 1 ? '=' + nums[0] + '^{' + n + '}' : '';
      const T = i => 'T_{X_{' + i + '}}';
      const symProd = n <= 3 ? range(n).map(i => '|' + T(i + 1) + '|').join('\\times ') : '|' + T(1) + '|\\times |' + T(2) + '|\\times\\cdots\\times |' + T(n) + '|';
      const symSet = n <= 3 ? range(n).map(i => T(i + 1)).join('\\times ') : T(1) + '\\times\\cdots\\times ' + T(n);
      const pr = S.preset != null ? SIZE_PRESETS[S.preset] : null;
      const head = 'You chose ' + tex('n=' + n) + (n === 1 ? ' variable' : ' variables') + (same ? ' with ' + nums[0] + (nums[0] === 1 ? ' value' : ' values') + (n > 1 ? ' each' : '') : ' with ' + nums.join(', ') + ' values') +
        (pr ? ' (' + pr.what + ')' : '') + ', so the joint range has ' + tex(nums.join('\\times ') + pw + '=' + bigTex(prod)) + ' cells — the joint PMF needs one probability for each of them.';
      const box = h('div', { class: 'mv-why mv-size-head' });
      Lab.setHTML(box, head);
      box.dataset.cells = prod.toString();
      out.appendChild(box);
      // how the count grows, one variable at a time
      const gt = h('table', { class: 'tbl mv-res mv-grow' });
      gt.appendChild(h('thead', {}, h('tr', {}, h('th', { text: 'variables' }), h('th', { html: 'cells ' + tex('=') + ' product of their range sizes' }))));
      const gb = h('tbody');
      let acc = 1n;
      nums.forEach((x, i) => {
        acc *= BigInt(x);
        gb.appendChild(h('tr', {}, h('td', { html: tex(i < 2 ? range(i + 1).map(j => 'X_{' + (j + 1) + '}').join(',') : 'X_{1},\\dots,X_{' + (i + 1) + '}') }),
          h('td', { html: tex((i ? nums.slice(0, i + 1).join('\\times ') + (same && i > 0 ? '=' + x + '^{' + (i + 1) + '}' : '') + '=' : '') + bigTex(acc)) })));
      });
      gt.appendChild(gb);
      const margSum = nums.reduce((a, x) => a + x, 0);
      const L = [
        { html: 'A tuple takes one value from each range, so the multiplication rule counts the tuples: multiply the range sizes.', math: '|' + symSet + '|=' + symProd + '=' + nums.join('\\times ') + pw + '=' + bigTex(prod) },
        { html: 'Each new variable multiplies the count by its own range size:', block: h('div', { class: 'tbl-wrap' }, gt) },
        n > 1 ? { html: 'The marginals are small: the marginal of ' + tex('X_{i}') + ' has only ' + tex('|T_{X_{i}}|') + ' cells, so all ' + n + ' marginals together need ' + tex(nums.join('+') + '=' + K.intTex(margSum)) + ' numbers, against ' + tex(bigTex(prod)) + ' for the joint. This is why, in large problems, “marginals are your only way in which you are going to make progress” (L1.6, minute 14).' } : null,
      ];
      if (N) {
        const pct = Number(N) / Number(prod) * 100;
        const pctTxt = pct >= 100 ? '' : pct >= 0.01 ? (pct >= 1 ? pct.toFixed(1) : pct.toFixed(2)).replace(/\.?0+$/, '') + '%' : 'less than 0.01%';
        if (BigInt(N) < prod) {
          const empty = prod - BigInt(N);
          L.push({ html: 'You have ' + tex('N=' + K.intTex(N)) + ' observations' + (pr && S.preset === 0 ? ' (the 1598 IPL matches of L1.6)' : '') + '. Each one lands in one cell, so at most ' + K.fmtInt(N) + ' of the ' + bigTxt(prod) + ' cells can be seen even once — ' + (pctTxt ? 'at most ' + pctTxt + ' of them — ' : '') + 'and at least ' + tex(bigTex(prod) + '-' + K.intTex(N) + '=' + bigTex(empty)) + ' cells get no data at all.' + (n > 1 ? ' One marginal is different: its ' + nums[0] + ' cells share the same ' + K.fmtInt(N) + ' observations, about ' + tex('\\tfrac{' + K.intTex(N) + '}{' + nums[0] + '}\\approx ' + Lab.fmtDec(N / nums[0], 1)) + ' per cell.' : '') + (S.preset === 0 ? ' L1.6 (minute 13): for all 6 balls, “1598 matches is not good enough”.' : '') });
        } else {
          L.push({ html: 'You have ' + tex('N=' + K.intTex(N)) + ' observations, at least as many as the ' + bigTxt(prod) + ' cells — on average ' + tex('\\tfrac{' + K.intTex(N) + '}{' + bigTex(prod) + '}\\approx ' + Lab.fmtDec(N / Number(prod), 2)) + ' per cell, so many cells are still seen only a few times.' });
        }
      }
      if (S.preset === 0) L.push({ html: 'The lecture says “it seems like it is 8 power 6” (minute 12). With 9 values per ball, 0 to 8, the count is ' + tex('9^{6}=531{,}441') + '; ' + tex('8^{6}=262{,}144') + ' would count 8 values per ball. Either way: far too many cells to write down, think about or estimate.' });
      out.appendChild(steps(L));
    }

    /* --------------------------------------------------------------- answer box */
    function drawAnswer(J, R) {
      const box = P.answer;
      Lab.clear(box);
      const all = range(J.n);
      const pr = st.preset != null ? PRESETS[st.preset] : null;
      box.appendChild(K.note('Your joint PMF ' + tex(fNameJ(J)) + ' of ' + J.n + ' variables — ' + originWords(J) + (pr ? ': ' + pr.short : '') + '. What the panels below compute from it, with your numbers:', 'pl-ans-ev'));
      const grid = h('div', { class: 'mv-ans' });
      const add = (label, html, panel) => {
        const go = h('button', { class: 'btn xs ghost mv-go', type: 'button', text: 'how ↓' });
        go.addEventListener('click', () => panel.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }));
        const v = h('div', { class: 'mv-ans-v' });
        Lab.setHTML(v, html);
        grid.append(h('div', { class: 'mv-ans-k', text: label }), v, go);
      };
      const list = (name, groups, val, fmt, max) => {
        const m = max || 4;
        const shown = groups.slice(0, m).map(g => '<span class="mv-nw">' + tex(name + '(' + g.t.map(vt).join(',') + ')=' + (fmt || FM.pT)(val(g))) + '</span>');
        return shown.join(', ') + (groups.length > m ? ', … <span class="muted">(' + groups.length + ' values)</span>' : '');
      };
      const sizes = J.ranges.map(r => r.length), prod = sizes.reduce((a, b) => a * b, 1);
      add('Joint', tex(J.rows.length + '\\text{ rows},\\ \\ \\sum ' + fNameJ(J) + '=1') + ' ✓; its range has ' + tex(sizes.join('\\times ') + '=' + K.intTex(prod)) + ' possible tuples <span class="muted">— panel 1</span>', P.joint);
      if (derOf(J)) J.derived.forEach(d => add(J.derived.length > 1 ? 'New column ' + d.name : 'New column', '<code>' + Lab.esc(d.name + ' = ' + d.expr) + '</code>: ' + list(fName(J, [d.k]), marginalGroups(J, [d.k]), g => g.p, FM.pTD, 6), P.graph));
      if (R.marg && R.marg.groups) add('Marginal', list(fName(J, R.marg.keep), R.marg.groups, g => g.p), P.marg);
      else add('Marginal', '<span class="muted">tick at least one variable in panel 4</span>', P.marg);
      if (R.cond && R.cond.groups) add('Conditional', list(fName(J, R.cond.keep, R.cond.given), R.cond.groups, g => g.res), P.cond);
      else add('Conditional', '<span class="muted">' + (R.cond && R.cond.total && R.cond.total.isZero() ? 'not defined: the condition has probability 0' : 'fix a variable and ask about another in panel 5') + '</span>', P.cond);
      if (R.chain) {
        const c = R.chain, target = fNameJ(J) + '(' + vArgs(c.row.t, all) + ')';
        const prod = calc => calc.factors.filter(f => f.val != null).map(f => FM.pT(f.val)).join('\\cdot ');
        const okA = c.A.product && c.A.product.eq(c.row.p), okB = c.B.product && c.B.product.eq(c.row.p);
        add('Chain rule', tex(target + '=' + prod(c.A) + '=' + FM.pT(c.row.p)) + ' <span class="muted">(order A)</span>' + (okA ? ' ✓' : '') + '<br>' +
          tex(target + '=' + prod(c.B) + '=' + FM.pT(c.row.p)) + ' <span class="muted">(order B)</span>' + (okB ? ' ✓' : ''), P.chain);
      }
      box.appendChild(grid);
    }

    /* ------------------------------------------------------------------ start */
    buildTable();
    buildExp();
    showMode();
    buildSize();
    recompute();
  }

  /* ------------------------------------------------------------------ register */
  Lab.lab({
    id: 'lab-s2-many', course: 's2', week: 1, order: 3,
    title: 'Three or more variables lab', sub: 'Week 1 · L1.5–L1.7',
    topics: ['list of tuples', 'marginal of any group', 'conditioning', 'chain rule', 'slices', 'PMF & CDF', 'new columns g(X1, …, Xn)', 'size of a joint range'],
    desc: 'Type a joint PMF of 2–5 variables as a list of tuples, or build one from coins, dice or a random number; add new columns that are formulas of the others (L2.10). Keep any group (marginal), fix any variables (conditional) and rebuild an entry with the chain rule in two orders — every sum and every division written out with your numbers.',
    render: host => manyLab(host),
  });
})();
