/* Playground lab (s2-w3-bounds): Markov's and Chebyshev's inequalities with the learner's own X (L3.7).
   Pick a named distribution or type a PMF: μ and σ are worked out term by term. Markov: the bound μ/c next to the
   exact P(X ≥ c), the tail shaded on the PMF chart (with a warning when X can be negative). Chebyshev: the bound
   1/k² (or σ²/a² for a distance a) next to the exact P(|X − μ| ≥ kσ), both tails shaded. A table for
   k = 1, 1.5, 2, 3, Markov at multiples of μ (the lecture's c = 100μ), and the lecture's statements with the
   learner's numbers. Uses only the lab kit (Lab.play), so the public copy of the site can ship it. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const Frac = Lab.Frac;
  const tex = s => Lab.tex(String(s));
  const VID = 'NTGLrewi_uY';
  /** a link into the L3.7 video at m:ss */
  const at = (m, s = 0) => Lab.vlink(VID, m + s / 60);
  const STORE = 'lab:s2-bounds';
  const SHOW = 'shown up to k', LAM = 'λ';
  const FAMS = ['uniform', 'bernoulli', 'binomial', 'geometric', 'poisson', 'custom'];
  const RANGES = { uniform: { a: [-100, 200], b: [-100, 200] }, binomial: { n: [1, 60] }, geometric: { [SHOW]: [3, 60] }, poisson: { [SHOW]: [3, 60] } };

  /* ===================================================== numbers: exact fractions while they stay exact */
  const SAFE = Number.MAX_SAFE_INTEGER;
  const okN = x => Math.abs(x) <= SAFE;
  /** a positive probability too small for a float (below 1e-300); lg = its log10 */
  class Tiny { constructor(lg) { this.lg = lg; } valueOf() { return 0; } }
  const isEx = v => v instanceof Frac && !v.approx;
  const norm = v => (v instanceof Frac ? (v.approx ? v.valueOf() : v) : Number(v));
  const num = v => Number(norm(v));
  function mul(a, b) {
    a = norm(a); b = norm(b);
    if (isEx(a) && isEx(b) && okN(a.n * b.n) && okN(a.d * b.d)) return a.mul(b);
    return Number(a) * Number(b);
  }
  function add(a, b) {
    a = norm(a); b = norm(b);
    if (isEx(a) && isEx(b)) {
      const x = a.n * b.d, y = b.n * a.d;
      if (okN(x) && okN(y) && okN(a.d * b.d) && okN(x + y)) return a.add(b);
    }
    return Number(a) + Number(b);
  }
  const neg = a => { a = norm(a); return isEx(a) ? a.neg() : -a; };
  const sub = (a, b) => add(a, neg(b));
  function div(a, b) {
    a = norm(a); b = norm(b);
    if (isEx(a) && isEx(b) && b.n !== 0 && okN(a.n * b.d) && okN(a.d * b.n)) return a.div(b);
    return Number(a) / Number(b);
  }
  /** a^k for a whole k ≥ 0, by squaring; exact while the integers stay safe */
  function pow(a, k) {
    a = norm(a);
    if (!isEx(a)) return Math.pow(a, k);
    let r = F(1), b = a, e = k;
    while (e > 0) {
      if (e % 2 === 1) { r = mul(r, b); if (!isEx(r)) return Math.pow(a.valueOf(), k); }
      e = Math.floor(e / 2);
      if (e > 0) { b = mul(b, b); if (!isEx(b)) return Math.pow(a.valueOf(), k); }
    }
    return r;
  }
  const sq = a => mul(a, a);
  const sum = arr => arr.reduce((s, v) => add(s, v), F(0));
  /** sign of a − b: exact for fractions; floats count as equal within 1e-12 */
  function cmp(a, b) {
    a = norm(a); b = norm(b);
    if (isEx(a) && isEx(b)) { const x = a.n * b.d, y = b.n * a.d; if (okN(x) && okN(y)) return x > y ? 1 : x < y ? -1 : 0; }
    const A = Number(a), B = Number(b);
    if (Math.abs(A - B) <= 1e-12 * Math.max(Math.abs(A), Math.abs(B))) return 0;
    return A > B ? 1 : -1;
  }
  /** √v: exact when v is the square of a fraction, else a float */
  function sqrtV(v) {
    v = norm(v);
    if (isEx(v) && v.n >= 0) {
      const a = Math.round(Math.sqrt(v.n)), b = Math.round(Math.sqrt(v.d));
      if (a * a === v.n && b * b === v.d) return F(a, b);
    }
    return Math.sqrt(Math.max(0, Number(v)));
  }
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  /** the smallest whole number ≥ v */
  const ceilV = v => { v = norm(v); return isEx(v) ? Math.ceil(v.n / v.d) : Math.ceil(v - 1e-12); };
  function choose(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1n;
    for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
    return Number(r);
  }
  const fi = v => (Number.isSafeInteger(v) ? F(v) : Number(v));
  const lnF = [0];
  function lnFact(n) {
    if (n < 5000) { while (lnF.length <= n) lnF.push(lnF[lnF.length - 1] + Math.log(lnF.length)); return lnF[n]; }
    return n * Math.log(n) - n + 0.5 * Math.log(2 * Math.PI * n) + 1 / (12 * n) - 1 / (360 * n * n * n);
  }

  /* ------------------------------------------------------------ formatting (TeX and plain text) */
  function sci(x) { const [m, e] = x.toExponential(2).split('e'); return m.replace(/\.?0+$/, '') + '\\times10^{' + Number(e) + '}'; }
  /** a decimal with 4 places; tiny values in scientific form; a value that is not exactly 1 never shows as 1 */
  function dec(v, dp = 4) {
    if (v instanceof Tiny) { const e = Math.floor(v.lg); return Math.pow(10, v.lg - e).toFixed(1).replace(/\.0$/, '') + '\\times10^{' + e + '}'; }
    const x = num(v);
    if (!isFinite(x)) return '\\text{?}';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 5e-4) return (x < 0 ? '-' : '') + sci(a);
    const s = Lab.fmtDec(x, dp);
    if (s === '1' && x < 1) return '1-' + sci(1 - x);
    return Number(s) === x ? s : x.toFixed(dp);
  }
  const exactDec = v => isEx(v) && (v.d === 1 || K.exactDecimal(v));
  /** '=' when the decimal shown is the value itself, else '≈' */
  const eqD = v => (v instanceof Tiny ? '\\approx ' : Number(dec(v)) === num(v) ? '=' : '\\approx ');
  /** a probability inside a formula: the fraction when it is exact and short, else a decimal */
  function tp(v) {
    if (v instanceof Tiny) return dec(v);
    v = norm(v);
    if (isEx(v)) { if (v.d === 1) return String(v.n); if (v.d <= 99999) return v.tex(); }
    return dec(v);
  }
  /** a value (μ, c, an end of an interval): whole number, short decimal, short fraction, else a decimal */
  function tv(v) {
    v = norm(v);
    if (isEx(v)) { if (exactDec(v)) return Lab.fmtDec(v.valueOf(), 4); if (v.d <= 99999) return v.tex(); }
    return dec(v);
  }
  /** a value in brackets when it is negative: 2·(−3) */
  const par = v => (num(v) < 0 ? '(' + tv(v) + ')' : tv(v));
  /** "=5/36≈0.1389", "=1/4=0.25", "=3", "≈0.2240" */
  function rel(v) {
    if (v instanceof Tiny) return '\\approx ' + dec(v);
    v = norm(v);
    if (isEx(v)) {
      if (v.d === 1) return '=' + v.n;
      const d = dec(v), same = Number(d) === v.valueOf();
      if (v.d <= 99999) return '=' + v.tex() + (same ? '=' : '\\approx ') + d;
      return (same ? '=' : '\\approx ') + d;
    }
    return eqD(v) + dec(v);
  }
  /** a value with its sign: "=7", "=50.5", "=7/3≈2.3333", "≈2.4152" */
  const relv = v => (exactDec(norm(v)) ? '=' + Lab.fmtDec(num(v), 4) : rel(v));
  /** a probability over the common denominator den, not reduced (2/36, not 1/18): counts before probabilities */
  function pD(v, den) {
    if (v instanceof Tiny) return dec(v);
    v = norm(v);
    if (den > 1 && isEx(v) && den % v.d === 0) return v.n === 0 ? '0' : '\\frac{' + v.n * (den / v.d) + '}{' + den + '}';
    return tp(v);
  }
  /** "=6/36=1/6≈0.1667": the total over den first, then reduced */
  function relD(v, den) {
    if (v instanceof Tiny) return rel(v);
    v = norm(v);
    if (den > 1 && isEx(v) && den % v.d === 0 && v.d !== den && v.n !== 0) return '=\\frac{' + v.n * (den / v.d) + '}{' + den + '}' + rel(v);
    return rel(v);
  }
  /** is p shown exactly by pD (a fraction over den, or a short fraction)? */
  const shownExact = (v, den) => { v = norm(v); return isEx(v) && ((den > 1 && den % v.d === 0) || v.d <= 99999); };
  /** the total after a list of terms: "= total" when every term is shown exactly, else "≈ total" */
  const totAfter = (ps, v, den) => (ps.every(p => shownExact(p, den)) && !(v instanceof Tiny) ? relD(v, den) : '\\approx ' + dec(v));
  /** terms joined by +; a long list keeps the first three and the last two */
  const plusList = (arr, max = 16) => (arr.length <= max ? arr.join('+\\allowbreak ') : arr.slice(0, 3).join('+') + '+\\cdots+' + arr.slice(-2).join('+'));
  const listTex = arr => arr.join(',\\allowbreak\\ ');
  /** plain text (chart labels, tooltips) */
  function txt(v, dp = 2) {
    if (v instanceof Tiny) return '≈ 0';
    v = norm(v);
    if (isEx(v)) { if (exactDec(v)) return Lab.fmtDec(v.valueOf(), 4).replace(/^-/, '−'); if (v.d <= 99999) return (v.n < 0 ? '−' : '') + Math.abs(v.n) + '/' + v.d; }
    const s = Lab.fmtDec(v, dp);
    return (Number(s) === v ? '' : '≈ ') + s.replace(/^-/, '−');
  }
  function pTxt(v, den) {
    if (v instanceof Tiny) return '≈ 0';
    v = norm(v);
    if (den > 1 && isEx(v) && den % v.d === 0) return v.n === 0 ? '0' : v.n * (den / v.d) + '/' + den;
    if (isEx(v) && v.d <= 9999) return v.toString();
    const x = num(v);
    return x !== 0 && Math.abs(x) < 5e-4 ? x.toExponential(1) : Lab.fmtDec(x, 3);
  }
  /** machine-readable value (data attributes, read by the tests) */
  const plain = v => (v instanceof Tiny ? 'tiny' + v.lg.toFixed(3) : isEx(norm(v)) ? norm(v).toString() : String(num(v)));
  /** a typed value as a string the boxes can read back exactly */
  const valStr = v => { v = norm(v); return isEx(v) ? (exactDec(v) ? Lab.fmtDec(v.valueOf(), 4) : v.toString()) : String(+v.toPrecision(8)); };
  /** "X − μ" in TeX with the learner's μ: X-7, X+2, X */
  const xMinus = (mu, x = 'X') => (cmp(mu, 0) === 0 ? x : cmp(mu, 0) > 0 ? x + '-' + tv(mu) : x + '+' + tv(neg(mu)));

  /* ============================================================ the distribution of X */
  /** finite support: values (sorted numbers), probabilities, exact values xs; μ and σ² added term by term */
  function finiteM(vals, ps, info, xsIn) {
    const xs = xsIn || vals.map(v => F(v));
    const mean = sum(xs.map((x, i) => mul(x, ps[i])));
    const vr = sum(xs.map((x, i) => mul(sq(sub(x, mean)), ps[i])));
    let den = 1;
    for (const p of ps) { const q = norm(p); if (!isEx(q)) { den = 0; break; } den = lcm(den, q.d); if (den > 10000) { den = 0; break; } }
    // a named family gives its exact μ and σ² (info.mean, info.vr); the sums above stay as they are shown, term by term
    return Object.assign({ finite: true, vals, xs, ps, lo: vals[0], hi: vals[vals.length - 1], mean, vr, meanSum: mean, vrSum: vr, den }, info);
  }
  /** stored spec {fam, q} or {fam: 'custom', custom: {vals, probs}} (strings) → {m} or {err} */
  function fromSpec(spec) {
    const q = (spec && spec.q) || {};
    const prob = s => (s instanceof Frac ? s : K.parseProb(String(s)));
    const int = (v, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? x : d; };
    try {
      switch (spec && spec.fam) {
        case 'uniform': {
          const a0 = int(q.a, 1), b0 = int(q.b, 6), a = Math.min(a0, b0), b = Math.max(a0, b0);
          if (b - a > 400) return { err: 'Keep a and b within 400 of each other, so every bar can be drawn.' };
          const n = b - a + 1, vals = [];
          for (let x = a; x <= b; x++) vals.push(x);
          return { m: finiteM(vals, vals.map(() => F(1, n)), { fam: 'uniform', a, b, n, mean: F(a + b, 2), vr: F(n * n - 1, 12), name: '\\text{Uniform}\\{' + a + ',\\dots,' + b + '\\}' }) };
        }
        case 'bernoulli': {
          const p = prob(q.p);
          if (!p) return { err: 'Type p as a number from 0 to 1 (for example 1/3, 0.25 or 25%).' };
          return { m: finiteM([0, 1], [sub(F(1), p), norm(p)], { fam: 'bernoulli', p: norm(p), mean: norm(p), vr: mul(p, sub(F(1), p)), name: '\\text{Bernoulli}(' + tp(p) + ')' }) };
        }
        case 'binomial': {
          const p = prob(q.p), n = int(q.n, 4);
          if (!p) return { err: 'Type p as a number from 0 to 1 (for example 1/3, 0.25 or 25%).' };
          if (n < 1 || n > 60) return { err: 'n must be a whole number from 1 to 60.' };
          const qq = sub(F(1), p), vals = [], ps = [];
          for (let k = 0; k <= n; k++) { vals.push(k); ps.push(mul(mul(fi(choose(n, k)), pow(p, k)), pow(qq, n - k))); }
          return { m: finiteM(vals, ps, { fam: 'binomial', n, p: norm(p), mean: mul(F(n), p), vr: mul(mul(F(n), p), sub(F(1), p)), name: '\\text{Bin}(' + n + ',' + tp(p) + ')' }) };
        }
        case 'geometric': {
          const p = norm(prob(q.p) || F(0));
          if (num(p) < 0.001) return { err: 'Choose p of at least 1/1000 for the geometric distribution (with p = 0 the first success never comes).' };
          const qq = sub(F(1), p), show = Math.max(3, Math.min(200, int(q[SHOW], 10)));
          const pmf = x => (x < 1 ? F(0) : mul(pow(qq, x - 1), p));
          const tailGE = m => {
            if (m <= 1) return F(1);
            const v = pow(qq, m - 1);
            if (num(v) === 0 && num(qq) > 0) return new Tiny((m - 1) * Math.log10(num(qq)));
            return v;
          };
          return { m: { finite: false, fam: 'geometric', p, q: qq, lo: 1, show, pmf, tailGE, mean: div(F(1), p), vr: div(qq, sq(p)), den: 0, name: '\\text{Geometric}(' + tp(p) + ')' } };
        }
        case 'poisson': {
          const lamN = Number(q[LAM]);
          if (!(lamN > 0) || lamN > 50) return { err: 'λ must be more than 0 (and at most 50 here).' };
          const lam = norm(Frac.of(+lamN.toPrecision(12))), L = num(lam), lnL = Math.log(L);
          const lp = x => -L + x * lnL - lnFact(x);
          const pmf = x => (x < 0 ? 0 : Math.exp(lp(x)));
          const tailGE = m => {
            if (m <= 0) return F(1);
            if (m <= L + 1) { let s = 0; for (let x = 0; x < m; x++) s += Math.exp(lp(x)); return 1 - s; }
            const L0 = lp(m);
            let s = 0;
            for (let x = m; x < m + 200000; x++) { const t = Math.exp(lp(x) - L0); s += t; if (t < 1e-17 * s) break; }
            const v = Math.exp(L0) * s;
            return v > 1e-300 ? v : new Tiny((L0 + Math.log(s)) / Math.LN10);
          };
          const show = Math.max(3, Math.min(200, int(q[SHOW], 12)));
          return { m: { finite: false, fam: 'poisson', lam, lo: 0, show, pmf, tailGE, mean: lam, vr: lam, den: 0, name: '\\text{Poisson}(' + tv(lam) + ')' } };
        }
        case 'custom': return customFrom(spec.custom);
        default: return { err: 'Unknown distribution.' };
      }
    } catch (e) { return { err: 'Could not read the distribution: ' + e.message }; }
  }
  function customFrom(c) {
    if (!c || !c.vals || !c.vals.length) return { err: 'Type at least one value of X.' };
    const vs = c.vals.map(s => K.parseNum(String(s)));
    const ps = (c.probs || []).map(s => K.parseNum(String(s)));
    if (vs.some(v => v == null) || ps.length !== vs.length || ps.some(p => p == null || num(p) < 0)) return { err: 'Fix the red boxes in your PMF: values are numbers, probabilities are 0 or more (1/6, 0.25, 20%).' };
    const vals = vs.map(Number);
    if (vals.some(v => Math.abs(v) > 1e6)) return { err: 'Keep the values of X between −1,000,000 and 1,000,000.' };
    if (vals.length > 400) return { err: 'Use at most 400 values.' };
    if (new Set(vals).size !== vals.length) return { err: 'Each value of X may appear only once.' };
    const tot = sum(ps);
    if (cmp(tot, F(1)) !== 0) return { err: 'Your probabilities add up to ' + txt(tot, 4) + ', not 1. Press “Rescale to total 1” or edit them.' };
    const order = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
    return { m: finiteM(order.map(i => vals[i]), order.map(i => norm(ps[i])), { fam: 'custom', name: '\\text{your PMF}' }, order.map(i => (isEx(norm(vs[i])) ? norm(vs[i]) : F(vals[i])))) };
  }

  /* ============================================================ the two inequalities */
  /** P(X ≥ c), with the terms (finite X) or the first value m of the tail (infinite X) */
  function geTail(M, c) {
    if (M.finite) {
      const idx = [];
      M.xs.forEach((x, i) => { if (cmp(x, c) >= 0) idx.push(i); });
      return { terms: idx.map(i => ({ x: M.vals[i], p: M.ps[i] })), p: sum(idx.map(i => M.ps[i])) };
    }
    const m = Math.max(M.lo, ceilV(c));
    return { m, p: M.tailGE(m), terms: null };
  }
  /** the values with (x − μ)² ≥ T: left part (below μ), right part, and the values exactly at the edge */
  function chebPart(M, mu, T) {
    const d2 = x => cmp(sq(sub(x, mu)), T);
    const onEdge = [], L = [];
    if (M.finite) {
      const R = [];
      M.xs.forEach((x, i) => { const s = d2(x); if (s === 0) onEdge.push(M.vals[i]); if (s >= 0) (cmp(x, mu) < 0 ? L : R).push({ x: M.vals[i], p: M.ps[i] }); });
      const pL = sum(L.map(t => t.p)), pR = sum(R.map(t => t.p));
      return { L, R, pL, pR, p: add(pL, pR), onEdge };
    }
    for (let x = M.lo; cmp(F(x), mu) < 0; x++) { const s = d2(F(x)); if (s === 0) onEdge.push(x); if (s >= 0) L.push({ x, p: M.pmf(x) }); }
    let r = Math.max(M.lo, ceilV(mu), Math.ceil(num(mu) + Math.sqrt(Math.max(0, num(T)))) - 2);
    while (d2(F(r)) < 0) r++;
    if (d2(F(r)) === 0) onEdge.push(r);
    const pL = sum(L.map(t => t.p)), pR = M.tailGE(r);
    const p = pR instanceof Tiny ? (num(pL) === 0 ? pR : num(pL)) : add(pL, pR);
    return { L, R: null, Rm: r, pL, pR, p, onEdge };
  }
  const boundSym = C => (C.mode === 'k' ? '\\frac{1}{k^2}' : '\\frac{\\sigma^2}{a^2}');
  const sub1 = b => sub(F(1), b);
  /** 1 − p, with a tiny p kept visible */
  const oneMinus = p => (p instanceof Tiny ? { tiny: p } : sub(F(1), p));
  const relOne = v => (v && v.tiny ? '\\approx 1-' + dec(v.tiny) : rel(v));

  /* ============================================================ the lecture's examples (L3.7) */
  const DICE = () => ({ fam: 'custom', custom: { vals: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], probs: ['1/36', '2/36', '3/36', '4/36', '5/36', '6/36', '5/36', '4/36', '3/36', '2/36', '1/36'] } });
  const CHO = ' Markov’s c = ';
  const PRESETS = [
    { label: 'L3.7 · Two dice, X = sum: |X − μ| ≥ 2σ (7:40)',
      source: 'L3.7, slide “Examples” (' + at(7, 40) + '): throw a pair of dice, X = sum of the two numbers; μ = 7, σ ≈ 2.42; P(|X − μ| > 2σ) = P(X ∈ {2, 12}) = 2/36 ≈ 0.056. The slide writes “> 2σ”; no value of X lies exactly at 7 ± 2σ, so “≥” (Chebyshev’s event) gives the same 2/36.' + CHO + '10 is chosen here (the lecture uses this example for Chebyshev only).',
      set: { dist: DICE(), c: '10', kMode: 'k', k: '2', a: '5' } },
    { label: 'L3.7 · Two dice, X = sum: within one σ (7:00)',
      source: 'L3.7, slide “Examples” (' + at(7, 0) + '): P(|X − μ| ≤ σ) = P(4.58 ≤ X ≤ 9.42) = P(X ∈ {5, 6, 7, 8, 9}) = 2/3, so P(|X − μ| > σ) = 1/3. Here k = 1: Chebyshev’s 1/k² = 1 says nothing.' + CHO + '10 is chosen here.',
      set: { dist: DICE(), c: '10', kMode: 'k', k: '1', a: '2.42' } },
    { label: 'L3.7 · X ~ Uniform{1, …, 100}: one σ (8:20)',
      source: 'L3.7, slide “Examples” (' + at(8, 20) + '): X ~ Uniform{1, 2, …, 100}, μ = 50.5, σ ≈ 28.9. The slide prints P(|X − μ| > σ) = 58/100 and the correction on screen: 1 − 58/100 = 42/100 (58/100 is the part within σ).' + CHO + '80 is chosen here.',
      set: { dist: { fam: 'uniform', q: { a: 1, b: 100 } }, c: '80', kMode: 'k', k: '1', a: '28.9' } },
    { label: 'L3.7 · X ~ Uniform{1, …, 100}: two σ (8:40)',
      source: 'L3.7, slide “Examples” (' + at(8, 40) + '): P(|X − μ| > 2σ) = 0, because 2σ ≈ 57.7 is more than the largest distance |1 − 50.5| = |100 − 50.5| = 49.5.' + CHO + '80 is chosen here.',
      set: { dist: { fam: 'uniform', q: { a: 1, b: 100 } }, c: '80', kMode: 'k', k: '2', a: '57.7' } },
    { label: 'L3.7 · Binomial(10, 1/2): actual vs Chebyshev at 2σ (15:00)',
      source: 'L3.7, slide “Compare actual and Chebyshev” (' + at(15, 0) + '): X ~ Binomial(10, 1/2), μ = 5, σ = √2.5 ≈ 1.58; P(|X − 5| ≥ 2σ) = P(X ∈ {0, 1, 9, 10}) ≈ 0.021, far below Chebyshev’s 1/4.' + CHO + '8 is chosen here.',
      set: { dist: { fam: 'binomial', q: { n: 10, p: '1/2' } }, c: '8', kMode: 'k', k: '2', a: '3.16' } },
    { label: 'L3.7 · Geometric(1/4): actual vs Chebyshev at 2σ (15:30)',
      source: 'L3.7, slide “Compare actual and Chebyshev” (' + at(15, 30) + '): X ~ Geometric(1/4), μ = 4, σ ≈ 3.46; P(|X − 4| ≥ 2σ) = P(X ∈ {11, 12, …}) ≈ 0.056 &lt; 1/4. Drawn up to x = 20.' + CHO + '11 is chosen here, so Markov looks at the same tail X ≥ 11.',
      set: { dist: { fam: 'geometric', q: { p: '1/4', [SHOW]: 20 } }, c: '11', kMode: 'k', k: '2', a: '6.93' } },
    { label: 'L3.7 · Marks with average 50: can 0.9 of the class score 80 or more? (3:00) — class chosen here',
      source: 'L3.7, slide “What does mean say about the distribution?” (' + at(3, 0) + '): the average mark is 50/100. “What fraction of students will have marks ≥ 80? It cannot be 1. Can it be 0.9? No.” The lecture gives only the average; this class is chosen here: 3/8 of the students score 0 and 5/8 score 80 (average 5/8 × 80 = 50). It reaches Markov’s bound 50/80 = 5/8 exactly, so no class with average 50 has more than 5/8 of its students at 80 or above — never 0.9.',
      set: { dist: { fam: 'custom', custom: { vals: ['0', '80'], probs: ['3/8', '5/8'] } }, c: '80', kMode: 'k', k: '2', a: '50' } },
    { label: 'L3.7 · Marks with average 50: every mark 0–100 equally likely (2:00) — class chosen here',
      source: 'L3.7, slide “What does mean say about the distribution?” (' + at(2, 0) + '): average 50/100. The lecture gives only the average; here every mark 0, 1, …, 100 is equally likely (average 50, chosen here). P(X ≥ 80) = 21/101 is below Markov’s 50/80, and P(X ≥ 50) = 51/101 is not 0 (“It cannot be 0. Why?”).',
      set: { dist: { fam: 'uniform', q: { a: 0, b: 100 } }, c: '80', kMode: 'k', k: '2', a: '58' } },
  ];
  const DEF = () => Object.assign(JSON.parse(JSON.stringify(PRESETS[0].set)), { preset: 0 });

  /** K.steps, with each formula typeset inline (display size) so a long sum wraps on a phone instead of sliding sideways */
  function stepsW(list) {
    return K.steps(list.filter(Boolean).map(s => {
      if (!s.math) return s;
      const box = h('div', { class: 'bd-sm' });
      const m = h('div', { class: 'bd-math' });
      m.innerHTML = tex('\\displaystyle ' + s.math);
      box.appendChild(m);
      if (s.note) box.appendChild(K.note(s.note, 'small muted'));
      if (s.block) box.appendChild(s.block);
      return { html: s.html, block: box };
    }));
  }
  /** "written" + its value, without repeating a fraction that is already reduced (7/10 = 0.7, not 7/10 = 7/10 = 0.7) */
  function relAfter(written, v) {
    const r = rel(v);
    return written + (r.startsWith('=' + written) ? r.slice(1 + written.length) : r);
  }
  /** a probability for the comparison bars: 1/6 ≈ 0.1667 */
  const vtOf = v => (v instanceof Tiny ? dec(v) : isEx(norm(v)) && norm(v).d > 1 ? tp(v) + eqD(v) + dec(v) : tp(v));
  /** "= 7" or "≈ 2.17" for the chart labels */
  const eqTxt = v => { const t = txt(v); return t.startsWith('≈') ? t : '= ' + t; };

  /* ============================================================ controls */
  /** number box that takes any number (10, 2.5, 7/2, 100*7) and a slider for the usual range */
  function freeField({ label, value, min, max, step, check, onChange }) {
    const input = h('input', { class: 'field mono pl-num bd-num', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal' });
    const range = h('input', { class: 'slider pl-range', type: 'range', min, max, step, value: min });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), msg);
    let lo = min, hi = max;
    const paint = v => { const c = Math.max(lo, Math.min(hi, v)); range.value = c; range.style.setProperty('--pct', (hi > lo ? ((c - lo) / (hi - lo)) * 100 : 0) + '%'); };
    function read(fromSlider) {
      const f = K.parseNum(input.value);
      const err = f == null || !isFinite(num(f)) ? 'Type a number, for example 10, 2.5 or 7/2.' : check ? check(f) : null;
      input.classList.toggle('bad', !!err);
      if (err) { Lab.setHTML(msg, '<span class="cbad">' + err + '</span>'); onChange(null, input.value); return; }
      if (!fromSlider) paint(num(f));
      onChange(f, input.value.trim());
    }
    input.addEventListener('input', Lab.debounce(() => read(false), 250));
    range.addEventListener('input', () => { input.value = String(+(+range.value).toPrecision(12)); paint(+range.value); read(true); });
    wrap.set = s => { input.value = String(s); input.classList.remove('bad'); const f = K.parseNum(String(s)); if (f != null) paint(num(f)); };
    wrap.setRange = (a, b, s) => { lo = a; hi = b; range.min = a; range.max = b; if (s) range.step = s; const f = K.parseNum(input.value); if (f != null) paint(num(f)); };
    wrap.hint = html => { if (!input.classList.contains('bad')) Lab.setHTML(msg, html || ''); };
    wrap.input = input;
    const f0 = K.parseNum(String(value));
    paint(f0 == null ? min : num(f0));
    return wrap;
  }
  const checkC = f => (num(f) <= 0 ? 'Markov needs c > 0: type a positive number.' : num(f) > 1e9 ? 'Keep c at most 1,000,000,000.' : null);
  const checkK = f => (num(f) <= 0 ? 'k must be more than 0.' : num(f) > 1000 ? 'Keep k at most 1000.' : null);
  const checkA = f => (num(f) <= 0 ? 'The distance a must be more than 0.' : num(f) > 1e9 ? 'Keep a at most 1,000,000,000.' : null);
  /** a round upper end for a slider: 1, 2, 5 × 10ⁿ */
  function niceUp(x) {
    if (!(x > 0)) return 1;
    const e = Math.pow(10, Math.floor(Math.log10(x))), m = x / e;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * e;
  }

  /* ============================================================ the lab */
  function boundsLab(host) {
    const clone = o => JSON.parse(JSON.stringify(o));
    let st, good, goodC, goodK, goodA, errs = {}, ctl = {}, P = {}, lastW = 0, D = null;
    const save = () => Lab.store.set(STORE, st);
    const schedule = Lab.debounce(() => draw(), 40);
    load(Lab.store.get(STORE, null));
    const { side, main } = K.layout(host, 'bd-lab');
    ctl.box = h('div', { class: 'bd-ctl' });
    side.appendChild(ctl.box);
    P.err = h('div', { class: 'bd-err', hidden: true });
    P.answer = K.answer();
    P.dist = K.panel('Your ' + tex('X') + ': the PMF, the mean ' + tex('\\mu') + ' and the standard deviation ' + tex('\\sigma'), 'L3.7 writes μ for E[X] and σ² for Var(X) (' + at(1, 0) + ').');
    P.mk = K.panel('Markov’s inequality: ' + tex('P(X\\ge c)\\le \\frac{\\mu}{c}'), 'For X ≥ 0 with a finite mean; it needs only μ (' + at(9, 0) + ').');
    P.ch = K.panel('Chebyshev’s inequality: ' + tex('P(|X-\\mu|\\ge k\\sigma)\\le \\frac{1}{k^2}'), 'Needs μ and σ; X may take negative values (' + at(11, 0) + ', ' + at(12, 20) + ').');
    P.tab = K.panel('How loose is Chebyshev? ' + tex('k=1,\\ 1.5,\\ 2,\\ 3'), 'The exact probability next to the bound 1/k², with your X (' + at(14, 40) + ').');
    P.lec = K.panel('What L3.7 says, with your numbers', 'Each statement of the lecture, then the same statement with your X, c and k.');
    main.append(P.err, P.answer, P.dist, P.mk, P.ch, P.tab, P.lec);
    buildControls();
    draw();
    // the charts are drawn at the layout width: draw again when it changes
    const onResize = Lab.debounce(() => {
      if (!host.isConnected) { window.removeEventListener('resize', onResize); return; }
      const w = P.dist.body.clientWidth;
      if (w && Math.abs(w - lastW) > 8) draw();
    }, 150);
    window.addEventListener('resize', onResize);

    function load(saved) {
      st = Object.assign(DEF(), saved && typeof saved === 'object' ? clone(saved) : {});
      if (!['k', 'a'].includes(st.kMode)) st.kMode = 'k';
      let r = fromSpec(st.dist);
      if (!r.m) { st.dist = DEF().dist; r = fromSpec(st.dist); }
      good = r.m;
      const pc = K.parseNum(String(st.c)), pk = K.parseNum(String(st.k)), pa = K.parseNum(String(st.a));
      if (pc == null || checkC(pc)) st.c = '10';
      if (pk == null || checkK(pk)) st.k = '2';
      if (pa == null || checkA(pa)) st.a = '5';
      goodC = norm(K.parseNum(String(st.c))); goodK = norm(K.parseNum(String(st.k))); goodA = norm(K.parseNum(String(st.a)));
      errs = {};
    }

    function buildControls() {
      Lab.clear(ctl.box);
      ctl.box.appendChild(K.group('Lecture examples (L3.7)'));
      ctl.pre = K.presets({ label: 'Load an example from the lecture', items: PRESETS, onPick: it => loadPreset(it) });
      ctl.box.appendChild(ctl.pre);
      if (st.preset != null && PRESETS[st.preset]) { ctl.pre.select.value = String(st.preset); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[st.preset].source); }

      ctl.box.appendChild(K.group('1 · Your random variable X'));
      ctl.pick = h('div', { class: 'bd-pick' });
      ctl.box.appendChild(ctl.pick);
      mountPicker();
      ctl.sign = h('div', { class: 'pl-hint bd-sign' });
      ctl.box.appendChild(ctl.sign);

      ctl.box.appendChild(K.group('2 · Markov: the cut-off c'));
      ctl.c = freeField({ label: 'Cut-off ' + tex('c') + ' in ' + tex('P(X\\ge c)') + ' (any number > 0; 7/2 and 100*7 work too)', value: st.c, min: 0, max: 20, step: 0.5, check: checkC,
        onChange: (f, s) => { st.c = s; if (f) { goodC = norm(f); errs.c = ''; } else errs.c = 'bad'; schedule(); } });
      ctl.box.appendChild(ctl.c);
      const chips = h('div', { class: 'pl-chips' });
      [[2, 'c = 2μ'], [4, 'c = 4μ'], [100, 'c = 100μ (the lecture’s)']].forEach(([t, label]) => chips.appendChild(Lab.button(label, () => setC(mul(F(t), good.mean)), 'btn xs')));
      ctl.box.appendChild(chips);

      ctl.box.appendChild(K.group('3 · Chebyshev: how far from μ'));
      ctl.mode = Lab.seg([{ label: 'Type ' + tex('k'), value: 'k' }, { label: 'Type a distance ' + tex('a'), value: 'a' }], st.kMode, v => switchMode(v));
      ctl.box.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'k standard deviations, or a distance a = kσ' }), ctl.mode));
      ctl.k = freeField({ label: tex('k') + ', the number of standard deviations', value: st.k, min: 0.5, max: 5, step: 0.05, check: checkK,
        onChange: (f, s) => { st.k = s; if (f) { goodK = norm(f); errs.k = ''; } else errs.k = 'bad'; schedule(); } });
      ctl.a = freeField({ label: 'Distance ' + tex('a') + ' from ' + tex('\\mu') + ' (then ' + tex('k=a/\\sigma') + ')', value: st.a, min: 0, max: 10, step: 0.1, check: checkA,
        onChange: (f, s) => { st.a = s; if (f) { goodA = norm(f); errs.a = ''; } else errs.a = 'bad'; schedule(); } });
      ctl.box.append(ctl.k, ctl.a);
      syncMode();
      ctl.box.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); load(null); buildControls(); draw(); }, 'btn ghost sm')));
    }
    function mountPicker() {
      Lab.clear(ctl.pick);
      const s = st.dist, params = {};
      if (s.fam !== 'custom' && s.q) params[s.fam] = Object.assign({}, s.q);
      const cu = s.fam === 'custom' && s.custom ? s.custom : DICE().custom;
      ctl.picker = K.distPicker({ label: 'Distribution of ' + tex('X'), families: FAMS, value: s.fam, params, ranges: RANGES, custom: { vals: cu.vals.slice(), probs: cu.probs.slice() }, xName: 'X', onChange: onPick });
      ctl.pick.appendChild(ctl.picker);
    }
    /** the rows of the PMF editor as typed (2/36 stays 2/36) */
    function rawRows() {
      const rows = Lab.$$('.pe-row', ctl.pick).map(row => Array.from(row.querySelectorAll('input')).map(i => i.value.trim()));
      return { vals: rows.map(r => r[0]), probs: rows.map(r => r[1]) };
    }
    function onPick(r) {
      let spec;
      if (!r.fam) {
        if (!r.ok) { errs.dist = 'Your PMF is not valid yet (see the message under it). The pictures still show your last valid X.'; schedule(); return; }
        spec = { fam: 'custom', custom: rawRows() };
      } else {
        const q = {};
        Object.keys(r.q || {}).forEach(k => { const v = r.q[k]; q[k] = v instanceof Frac ? v.toString() : v; });
        spec = { fam: r.fam, q };
      }
      const res = fromSpec(spec);
      if (res.m) { st.dist = spec; good = res.m; errs.dist = ''; } else errs.dist = res.err + ' The pictures still show your last valid X.';
      schedule();
    }
    function loadPreset(it) {
      const k = PRESETS.indexOf(it);
      load(Object.assign(clone(it.set), { preset: k }));
      buildControls();
      draw();
    }
    function setC(v) {
      st.c = valStr(v);
      ctl.c.set(st.c);
      goodC = norm(K.parseNum(st.c)); errs.c = '';
      draw();
    }
    function switchMode(v) {
      if (v === st.kMode) return;
      const sig = sqrtV(good.vr);
      if (num(sig) > 0) {
        if (v === 'a' && goodK) { st.a = valStr(isEx(norm(mul(goodK, sig))) ? mul(goodK, sig) : +num(mul(goodK, sig)).toFixed(4)); ctl.a.set(st.a); goodA = norm(K.parseNum(st.a)); errs.a = ''; }
        if (v === 'k' && goodA) { const k = div(goodA, sig); st.k = isEx(norm(k)) ? valStr(k) : String(+num(k).toFixed(2)); ctl.k.set(st.k); goodK = norm(K.parseNum(st.k)); errs.k = ''; }
      }
      st.kMode = v;
      syncMode();
      draw();
    }
    function syncMode() { ctl.k.hidden = st.kMode !== 'k'; ctl.a.hidden = st.kMode !== 'a'; }

    /* ------------------------------------------------------------ the numbers */
    function compute() {
      const M = good, mu = M.mean, vr = M.vr, sigma = sqrtV(vr);
      const shown = M.finite ? { vals: M.vals, xs: M.xs, ps: M.ps } : (() => { const vals = []; for (let x = M.lo; x <= M.show; x++) vals.push(x); return { vals, xs: vals.map(x => F(x)), ps: vals.map(x => M.pmf(x)) }; })();
      const negs = M.finite ? M.vals.map((v, i) => ({ v, p: M.ps[i] })).filter(t => t.v < 0 && num(t.p) > 0) : [];
      const R = { M, mu, vr, sigma, shown, negs, nonneg: !negs.length, den: M.den, notDrawn: M.finite ? null : M.tailGE(M.show + 1) };
      // Markov
      const c = goodC;
      R.c = c;
      R.mk = Object.assign(geTail(M, c), { bound: div(mu, c) });
      R.mult = num(mu) > 0 ? [1, 2, 4, 10, 100].map(t => { const ct = mul(F(t), mu); return { t, c: ct, p: geTail(M, ct).p, bound: F(1, t) }; }) : null;
      R.atMu = geTail(M, mu);
      // Chebyshev
      const C = { mode: st.kMode };
      if (st.kMode === 'k') {
        C.k = goodK; C.kS = mul(goodK, sigma); C.a = C.kS;
        C.T = mul(sq(goodK), vr); C.bound = div(F(1), sq(goodK));
        if (num(sigma) === 0) C.err = 'Your X has σ = 0: it always equals μ = ' + txt(mu) + '. The k-form divides by kσ = 0, so it needs σ > 0. Switch to “Type a distance a”: then P(|X − μ| ≥ a) = 0 ≤ σ²/a² = 0.';
      } else {
        C.a = goodA; C.kS = goodA; C.T = sq(goodA); C.bound = div(vr, sq(goodA));
        C.k = num(sigma) > 0 ? div(goodA, sigma) : null;
      }
      C.loE = sub(mu, C.kS); C.hiE = add(mu, C.kS);
      if (!C.err) Object.assign(C, chebPart(M, mu, C.T));
      R.ch = C;
      // the k table (and the learner's k)
      R.table = num(sigma) > 0 ? [1, 1.5, 2, 3].map(k => ({ k: Frac.of(k), you: false })) : [];
      if (R.table.length && C.k != null && !R.table.some(r => cmp(r.k, C.k) === 0)) R.table.push({ k: C.k, you: true });
      R.table.forEach(r => { const T = mul(sq(r.k), vr); Object.assign(r, { kS: mul(r.k, sigma), part: chebPart(M, mu, T), bound: div(F(1), sq(r.k)) }); });
      R.table.sort((a, b) => num(a.k) - num(b.k));
      return R;
    }

    /* ------------------------------------------------------------ drawing */
    function draw() {
      save();
      D = compute();
      lastW = P.dist.body.clientWidth;
      paintErr();
      ctlHints();
      drawAnswer(); drawDist(); drawMarkov(); drawCheb(); drawTable(); drawLecture();
    }
    function paintErr() {
      const list = [errs.dist];
      if (errs.c) list.push('Your c is not a number above 0 yet (see the red box). The panels use the last valid c = ' + txt(goodC) + '.');
      if (st.kMode === 'k' && errs.k) list.push('Your k is not a number above 0 yet. The panels use the last valid k = ' + txt(goodK) + '.');
      if (st.kMode === 'a' && errs.a) list.push('Your distance a is not a number above 0 yet. The panels use the last valid a = ' + txt(goodA) + '.');
      const msgs = list.filter(Boolean);
      P.err.hidden = !msgs.length;
      Lab.setHTML(P.err, msgs.map(m => '<div>' + Lab.esc(m) + '</div>').join(''));
    }
    function ctlHints() {
      const M = D.M;
      // slider ranges from the distribution
      const top = M.finite ? M.hi : M.show;
      const cMax = niceUp(Math.max(1, top * 1.25, num(D.mu) * 2));
      ctl.c.setRange(0, cMax, cMax <= 20 ? 0.5 : cMax <= 100 ? 1 : cMax / 100);
      const s = num(D.sigma);
      if (s > 0) { const aMax = niceUp(5 * s); ctl.a.setRange(0, aMax, aMax / 100); }
      ctl.c.hint(cmp(D.mu, 0) > 0 ? tex('c=' + tv(D.c)) + ' is ' + tex(tv(div(D.c, D.mu)) + '\\,\\mu') + ' (μ = ' + txt(D.mu) + ').' : '');
      const C = D.ch;
      if (st.kMode === 'k') ctl.k.hint(C.err ? '' : tex('k\\sigma=' + tv(C.k) + '\\times ' + tv(D.sigma) + eqD(C.kS) + dec(C.kS)) + (num(D.sigma) && !isEx(norm(D.sigma)) ? ' (σ ≈ ' + dec(D.sigma) + ')' : ''));
      else ctl.a.hint(C.k != null ? tex('k=\\frac{a}{\\sigma}=\\frac{' + tv(C.a) + '}{' + dec(D.sigma) + '}' + eqD(C.k) + dec(C.k)) : '');
      // Markov needs X ≥ 0
      if (D.nonneg) Lab.setHTML(ctl.sign, '<span class="cgood">✓</span> Every value of your X is ≥ 0, so Markov’s inequality applies.');
      else Lab.setHTML(ctl.sign, '<span class="cbad">Your X can be negative</span> (' + tex('X=' + tv(D.negs[0].v)) + ' with probability ' + tex(tp(D.negs[0].p)) + (D.negs.length > 1 ? ', and ' + (D.negs.length - 1) + ' more' : '') + '): Markov’s inequality does not apply. Chebyshev’s still does.');
    }
    /** "|X − μ| ≥ kσ" with the learner's numbers, as TeX */
    function chebLhs(C, mu) {
      const k = C.mode === 'k' ? (cmp(C.k, 1) === 0 ? '' : tv(C.k)) + '\\sigma' : tv(C.a);
      return 'P(|' + xMinus(mu) + '|\\ge ' + k + ')';
    }
    function sigTex() {
      const s = norm(D.sigma);
      if (isEx(s)) return '\\sigma' + relv(s);
      return isEx(norm(D.vr)) ? '\\sigma=\\sqrt{' + tv(D.vr) + '}\\approx ' + dec(s) : '\\sigma\\approx ' + dec(s);
    }

    function drawAnswer() {
      const M = D.M, C = D.ch, mk = D.mk;
      const ev = 'Your ' + tex('X\\sim ' + M.name) + ': ' + tex('\\mu' + relv(D.mu)) + ', ' + tex(sigTex()) + '. You chose ' + tex('c=' + tv(D.c)) + ' and ' + (C.mode === 'k' ? tex('k=' + tv(C.k)) : tex('a=' + tv(C.a))) + '.';
      let big, sub = '';
      const mkLine = tex('P(X\\ge ' + tv(D.c) + ')' + relD(mk.p, D.den)) + (D.nonneg ? ' ≤ ' + tex('\\frac{\\mu}{c}' + rel(mk.bound)) + ' (Markov' + (cmp(D.c, D.mu) <= 0 ? ': with c ≤ μ the bound is ≥ 1 and says nothing' : '') + ').' : ', while ' + tex('\\frac{\\mu}{c}' + rel(mk.bound)) + ' — not a bound here: your X can be negative.');
      if (C.err) { big = 'P(X\\ge ' + tv(D.c) + ')' + rel(mk.p); sub = C.err; }
      else {
        big = chebLhs(C, D.mu) + relD(C.p, D.den) + '\\;\\le\\;' + boundSym(C) + '=' + tp(C.bound);
        sub = 'Markov with ' + tex('c=' + tv(D.c)) + ': ' + mkLine;
        if (cmp(C.bound, 1) < 0) sub += ' Chebyshev’s complement: at least ' + tex('1-' + tp(C.bound) + rel(sub1(C.bound))) + ' of the probability lies strictly between ' + tex('\\mu-k\\sigma' + relv(C.loE)) + ' and ' + tex('\\mu+k\\sigma' + relv(C.hiE)) + '; for your X it is ' + tex(relOne(oneMinus(C.p)).replace(/^=/, '')) + '.';
      }
      // the big line is typeset inline (display size) so it wraps on a phone
      K.setAnswer(P.answer, { ev, sub });
      const bigEl = h('div', { class: 'pl-ans-big bd-big' });
      bigEl.innerHTML = tex('\\displaystyle ' + big);
      P.answer.insertBefore(bigEl, P.answer.querySelector('.pl-ans-sub'));
      P.answer.dataset.plain = ['mu=' + plain(D.mu), 'var=' + plain(D.vr), 'sigma=' + plain(D.sigma), 'c=' + plain(D.c), 'pm=' + plain(mk.p), 'bm=' + plain(mk.bound), 'mode=' + C.mode, 'k=' + (C.k == null ? '' : plain(C.k)), 'a=' + plain(C.a), 'T=' + plain(C.T), 'pc=' + (C.err ? '' : plain(C.p)), 'bc=' + plain(C.bound), 'lo=' + plain(C.loE), 'hi=' + plain(C.hiE)].join(';');
    }

    /* ---------------------------------------------------- the PMF chart (SVG at the layout width) */
    function chart(host, mode) {
      const M = D.M, C = D.ch, den = D.den;
      const vals = D.shown.vals, ps = D.shown.ps;
      const Wd = Math.round(Math.max(280, Math.min(920, host.clientWidth || 640)));
      const narrow = Wd < 520;
      const H = narrow ? 236 : 262, ml = 10, mr = 10, mt = 50, mb = 36;
      const pw = Wd - ml - mr, ph = H - mt - mb;
      const lo = vals[0], hi = vals[vals.length - 1];
      let gap = Infinity;
      for (let i = 1; i < vals.length; i++) gap = Math.min(gap, vals[i] - vals[i - 1]);
      if (!isFinite(gap)) gap = 1;
      const span = Math.max(hi - lo, gap);
      const mu = num(D.mu);
      const marks = [{ v: mu, cls: 'mu', label: 'μ ' + eqTxt(D.mu), row: 0 }];
      if (mode === 'markov') marks.push({ v: num(D.c), cls: 'c', label: 'c ' + eqTxt(D.c), row: 1 });
      if (mode === 'cheb' && !C.err) { marks.push({ v: num(C.loE), cls: 'k', label: 'μ − kσ ' + eqTxt(C.loE), row: 1 }); marks.push({ v: num(C.hiE), cls: 'k', label: 'μ + kσ ' + eqTxt(C.hiE), row: 1 }); }
      const reach = 0.6 * span + gap;
      let x0 = lo - Math.max(gap * 0.6, span * 0.04), x1 = hi + Math.max(gap * 0.6, span * 0.04);
      marks.forEach(m => { if (m.v >= lo - reach && m.v <= hi + reach) { x0 = Math.min(x0, m.v - span * 0.03); x1 = Math.max(x1, m.v + span * 0.03); } });
      const X = v => ml + ((v - x0) / (x1 - x0)) * pw;
      const pmax = Math.max(...ps.map(num), 1e-12);
      const Y = p => mt + (1 - num(p) / pmax) * ph;
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, width: Wd, height: H, class: 'bd-svg', role: 'img', 'aria-label': mode === 'markov' ? 'PMF of X with the tail X ≥ c shaded' : mode === 'cheb' ? 'PMF of X with both tails beyond μ ± kσ shaded' : 'PMF of X' });
      // zones: the tail X ≥ c; the band μ ± kσ and the two tails outside it
      const clampX = v => Math.max(ml, Math.min(ml + pw, X(v)));
      if (mode === 'markov') s.appendChild(svg('rect', { x: clampX(num(D.c)), y: mt - 8, width: Math.max(0, ml + pw - clampX(num(D.c))), height: ph + 8, class: 'bd-zone' }));
      if (mode === 'cheb' && !C.err) {
        const a = clampX(num(C.loE)), b = clampX(num(C.hiE));
        s.appendChild(svg('rect', { x: ml, y: mt - 8, width: Math.max(0, a - ml), height: ph + 8, class: 'bd-zone' }));
        s.appendChild(svg('rect', { x: b, y: mt - 8, width: Math.max(0, ml + pw - b), height: ph + 8, class: 'bd-zone' }));
        s.appendChild(svg('rect', { x: a, y: mt - 8, width: Math.max(0, b - a), height: ph + 8, class: 'bd-band' }));
      }
      s.appendChild(svg('line', { x1: ml, x2: ml + pw, y1: mt + ph, y2: mt + ph, class: 'bd-axis' }));
      // marker lines under the bars (their labels come last, on top)
      const lineAt = m => { if (m.v >= x0 && m.v <= x1) s.appendChild(svg('line', { x1: X(m.v), x2: X(m.v), y1: mt - 10 - (m.row ? 0 : 14), y2: mt + ph, class: 'bd-mark ' + m.cls })); };
      marks.forEach(lineAt);
      // bars
      const inEv = x => (mode === 'markov' ? cmp(x, D.c) >= 0 : mode === 'cheb' && !C.err ? cmp(sq(sub(x, D.mu)), C.T) >= 0 : false);
      const bw = Math.max(1.5, Math.min(40, 0.62 * gap * pw / (x1 - x0)));
      const showVals = vals.length <= (narrow ? 8 : 14);
      vals.forEach((v, i) => {
        const p = ps[i], on = inEv(D.shown.xs[i]);
        const y = Y(p), x = X(v);
        const g = svg('g', { class: 'bd-b' + (on ? ' in' : '') });
        g.appendChild(svg('rect', { x: x - bw / 2, y: Math.min(y, mt + ph - (num(p) > 0 ? 1 : 0)), width: bw, height: Math.max(num(p) > 0 ? 1 : 0, mt + ph - y), rx: Math.min(4, bw / 3), class: 'bd-bar' }));
        if (showVals) g.appendChild(svg('text', { x, y: y - 5, 'text-anchor': 'middle', class: 'bd-pv' }, pTxt(p, den)));
        g.appendChild(svg('title', {}, 'P(X = ' + Lab.fmtVal(v) + ') = ' + pTxt(p, den) + (on ? (mode === 'markov' ? ' — in the tail X ≥ c' : ' — at least kσ from μ') : '')));
        s.appendChild(g);
      });
      // x ticks: the values while their labels fit, else round numbers
      const tick = v => { s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: mt + ph, y2: mt + ph + 4, class: 'bd-axis' })); s.appendChild(svg('text', { x: X(v), y: mt + ph + 17, 'text-anchor': 'middle', class: 'bd-tick' }, Lab.fmtVal(v))); };
      let fits = true, right = -Infinity;
      vals.forEach(v => { const w = Lab.fmtVal(v).length * 7 + 6; if (X(v) - w / 2 < right) fits = false; right = X(v) + w / 2; });
      if (fits) vals.forEach(tick);
      else {
        const raw = (hi - lo) / (narrow ? 5 : 8), mag = Math.pow(10, Math.floor(Math.log10(raw || 1))), nr = raw / mag;
        const stp = (nr < 1.5 ? 1 : nr < 3 ? 2 : nr < 7 ? 5 : 10) * mag;
        for (let k = Math.ceil(lo / stp); k * stp <= hi + 1e-9; k++) tick(+(k * stp).toPrecision(12));
      }
      s.appendChild(svg('text', { x: ml + pw, y: H - 3, 'text-anchor': 'end', class: 'bd-axname' }, 'values of X'));
      // markers with their labels (two rows; a marker off the chart gets an arrow at the edge)
      const rowsRight = [-Infinity, -Infinity];
      marks.sort((a, b) => a.v - b.v).forEach(m => {
        let x = X(m.v), arrow = '';
        if (m.v < x0) { x = ml; arrow = '← '; } else if (m.v > x1) { x = ml + pw; arrow = ' →'; }
        const label = arrow === '← ' ? arrow + m.label : m.label + arrow;
        const w = label.length * 6.6 + 8;
        let row = m.row;
        let lx = Math.max(ml + w / 2, Math.min(ml + pw - w / 2, x));
        if (lx - w / 2 < rowsRight[row]) row = 1 - row;
        if (lx - w / 2 < rowsRight[row]) lx = rowsRight[row] + w / 2;
        rowsRight[row] = lx + w / 2;
        s.appendChild(svg('text', { x: lx, y: row ? mt - 14 : mt - 30, 'text-anchor': 'middle', class: 'bd-mlab ' + m.cls }, label));
      });
      host.appendChild(s);
    }
    /** two bars on one 0–1 scale: the exact probability and the bound */
    function cmpBars(rows) {
      const box = h('div', { class: 'bd-cmp' });
      rows.forEach(r => {
        const v = Math.max(0, Math.min(1, num(r.v)));
        const bar = h('div', { class: 'bd-cmp-track' }, h('div', { class: 'bd-cmp-fill ' + r.cls }));
        bar.firstChild.style.width = (v * 100).toFixed(2) + '%';
        const lab = h('div', { class: 'bd-cmp-lab' });
        Lab.setHTML(lab, r.label);
        const val = h('div', { class: 'bd-cmp-val' });
        Lab.setHTML(val, tex(r.vt) + (num(r.v) > 1 ? ' <span class="small muted">(more than 1)</span>' : ''));
        box.appendChild(h('div', { class: 'bd-cmp-row' }, lab, bar, val));
      });
      return box;
    }
    function stage(body) { const w = h('div', { class: 'bd-stage' }); body.appendChild(w); return w; }
    /** a long sum: shown in full behind a "Show all n terms" switch */
    function more(label, tx) {
      const d = h('details', { class: 'bd-more' }, h('summary', { text: label }));
      const inner = h('div', { class: 'bd-more-body' });
      Lab.setHTML(inner, tex(tx));
      d.appendChild(inner);
      return d;
    }

    /* ---------------------------------------------------- panel: μ and σ */
    function drawDist() {
      const b = P.dist.body, M = D.M, den = D.den;
      Lab.clear(b);
      chart(stage(b), 'plain');
      if (!M.finite) b.appendChild(K.note('Drawn up to ' + tex('x=' + M.show) + ' (your “shown up to k”). Not drawn: ' + tex('P(X>' + M.show + ')' + rel(D.notDrawn)) + '. Every probability on this page still counts it.', 'pl-hint bd-trunc'));
      const steps = [];
      if (M.finite) {
        const n = M.vals.length;
        const tm = M.xs.map((x, i) => par(x) + '\\cdot ' + pD(M.ps[i], den));
        const tvv = M.xs.map((x, i) => '(' + tv(x) + (cmp(D.mu, 0) < 0 ? '+' + tv(neg(D.mu)) : '-' + tv(D.mu)) + ')^2\\cdot ' + pD(M.ps[i], den));
        const tot = v => totAfter(M.ps, v, den);
        steps.push({ html: 'The mean: every value times its probability, added (' + n + ' value' + (n > 1 ? 's' : '') + ').', math: '\\mu=E[X]=\\sum_x x\\,P(X=x)=' + plusList(tm) + tot(M.meanSum),
          block: n > 16 ? more('Show all ' + n + ' terms of μ', plusList(tm, 1e9) + tot(M.meanSum)) : null });
        steps.push({ html: 'The variance: the squared distance from ' + tex('\\mu' + relv(D.mu)) + ', weighted by the probabilities.', math: '\\sigma^2=E[(X-\\mu)^2]=\\sum_x (x-\\mu)^2P(X=x)=' + plusList(tvv) + tot(M.vrSum),
          block: n > 16 ? more('Show all ' + n + ' terms of σ²', plusList(tvv, 1e9) + tot(M.vrSum)) : null });
      } else if (M.fam === 'geometric') {
        const t3 = [1, 2, 3].map(x => x + '\\cdot ' + tp(M.pmf(x)));
        steps.push({ html: 'The mean of ' + tex('\\text{Geometric}(p)') + ' on 1, 2, 3, …: an infinite sum, whose value is ' + tex('1/p') + '.', math: '\\mu=\\sum_{x\\ge 1}x\\,(1-p)^{x-1}p=' + t3.join('+') + '+\\cdots=\\frac{1}{p}=\\frac{1}{' + tp(M.p) + '}' + relv(D.mu) });
        const v3 = [1, 2, 3].map(x => '(' + x + '-' + tv(D.mu) + ')^2\\cdot ' + tp(M.pmf(x)));
        steps.push({ html: 'The variance: also an infinite sum, whose value is ' + tex('(1-p)/p^2') + '.', math: '\\sigma^2=\\sum_{x\\ge 1}(x-\\mu)^2P(X=x)=' + v3.join('+') + '+\\cdots=\\frac{1-p}{p^2}=\\frac{' + tp(M.q) + '}{(' + tp(M.p) + ')^2}' + rel(D.vr) });
      } else {
        const t3 = [0, 1, 2, 3].map(x => x + '\\cdot ' + dec(M.pmf(x)));
        steps.push({ html: 'The mean of ' + tex('\\text{Poisson}(\\lambda)') + ': an infinite sum, whose value is ' + tex('\\lambda') + '.', math: '\\mu=\\sum_{x\\ge 0}x\\,e^{-\\lambda}\\frac{\\lambda^x}{x!}\\approx ' + t3.join('+') + '+\\cdots=\\lambda' + relv(D.mu) });
        steps.push({ html: 'The variance of a Poisson is also ' + tex('\\lambda') + '.', math: '\\sigma^2=\\sum_{x\\ge 0}(x-\\mu)^2P(X=x)=\\lambda' + relv(D.vr) });
      }
      steps.push({ html: 'The standard deviation is the square root of the variance.', math: sigTex() });
      const chk = famCheck();
      if (chk) steps.push(chk);
      b.appendChild(stepsW(steps));
    }
    /** the family's shortcut, as a check of the sums above */
    function famCheck() {
      const M = D.M;
      if (M.fam === 'uniform') return { html: 'Check with the shortcut for ' + tex('\\text{Uniform}\\{a,\\dots,b\\}') + ' (n = b − a + 1 = ' + M.n + ' values):', math: '\\mu=\\frac{a+b}{2}=\\frac{' + M.a + '+' + par(M.b) + '}{2}' + relv(D.mu) + ',\\quad \\sigma^2=\\frac{n^2-1}{12}=\\frac{' + M.n + '^2-1}{12}' + rel(D.vr) + '\\ \\checkmark' };
      if (M.fam === 'bernoulli') return { html: 'Check with the shortcut for ' + tex('\\text{Bernoulli}(p)') + ':', math: '\\mu=p' + rel(D.mu) + ',\\quad \\sigma^2=p(1-p)=' + tp(M.p) + '\\cdot ' + tp(sub1(M.p)) + rel(D.vr) + '\\ \\checkmark' };
      if (M.fam === 'binomial') return { html: 'Check with the shortcut for ' + tex('\\text{Bin}(n,p)') + ':', math: '\\mu=np=' + M.n + '\\cdot ' + tp(M.p) + relv(D.mu) + ',\\quad \\sigma^2=np(1-p)=' + M.n + '\\cdot ' + tp(M.p) + '\\cdot ' + tp(sub1(M.p)) + rel(D.vr) + '\\ \\checkmark' };
      return null;
    }

    /* ---------------------------------------------------- panel: Markov */
    /** P(X ≥ c) written out: [TeX of the event's terms, TeX of the numbers] */
    function tailTex(c, part) {
      const M = D.M, den = D.den, cT = tv(c);
      if (M.finite) {
        const t = part.terms;
        if (!t.length) return { math: 'P(X\\ge ' + cT + ')=0', html: 'No value of your X is ' + tex('\\ge ' + cT) + ', so the tail is empty.' };
        const names = t.map(x => 'P(X=' + Lab.fmtVal(x.x).replace('−', '-') + ')');
        const allEq = t.length > 16 && t.every(x => cmp(x.p, t[0].p) === 0);
        const nums = allEq ? t.length + '\\times ' + pD(t[0].p, den) : plusList(t.map(x => pD(x.p, den)));
        return { html: 'The tail: the value' + (t.length > 1 ? 's' : '') + ' of X that ' + (t.length > 1 ? 'are' : 'is') + ' at least c: ' + tex(listTex(t.length > 12 ? t.slice(0, 3).map(x => tv(F(x.x))).concat(['\\dots', tv(F(t[t.length - 1].x))]) : t.map(x => tv(F(x.x))))) + (t.length > 12 ? ' (' + t.length + ' values)' : '') + ' — violet in the chart.',
          math: 'P(X\\ge ' + cT + ')=' + plusList(names) + '=' + nums + totAfter(t.map(x => x.p), part.p, den),
          block: t.length > 16 && !allEq ? more('Show all ' + t.length + ' terms', plusList(t.map(x => pD(x.p, den)), 1e9) + totAfter(t.map(x => x.p), part.p, den)) : null };
      }
      const m = part.m;
      if (M.fam === 'geometric') {
        if (m <= 1) return { html: 'Every value of X (1, 2, 3, …) is at least c.', math: 'P(X\\ge ' + cT + ')=1' };
        return { html: 'The tail: the values ' + tex(m + ',\\ ' + (m + 1) + ',\\ \\dots') + ' — all of them, without end. ' + tex('X\\ge ' + m) + ' happens exactly when the first ' + (m - 1) + ' trials all fail.',
          math: 'P(X\\ge ' + cT + ')=P(X\\ge ' + m + ')=\\sum_{x\\ge ' + m + '}(1-p)^{x-1}p=(1-p)^{' + (m - 1) + '}=\\left(' + tp(M.q) + '\\right)^{' + (m - 1) + '}' + rel(part.p) };
      }
      if (m <= 0) return { html: 'Every value of X (0, 1, 2, …) is at least c.', math: 'P(X\\ge ' + cT + ')=1' };
      if (m <= num(M.lam) + 1) {
        const below = []; for (let x = 0; x < m; x++) below.push(dec(M.pmf(x)));
        return { html: 'The tail ' + tex('X\\ge ' + m) + ' has no end, so take away the values below it: ' + tex(listTex(below.map((_, x) => String(x)))) + '.',
          math: 'P(X\\ge ' + cT + ')=1-\\big[' + plusList(below.map((_, x) => 'P(X=' + x + ')')) + '\\big]\\approx 1-(' + plusList(below) + ')' + rel(part.p) };
      }
      const first = [m, m + 1, m + 2].map(x => dec(M.pmf(x)));
      return { html: 'The tail: the values ' + tex(m + ',\\ ' + (m + 1) + ',\\ \\dots') + ' — added until the terms are too small to matter.',
        math: 'P(X\\ge ' + cT + ')=\\sum_{x\\ge ' + m + '}e^{-\\lambda}\\frac{\\lambda^x}{x!}\\approx ' + first.join('+') + '+\\cdots' + (part.p instanceof Tiny ? '\\approx ' + dec(part.p) : '\\approx ' + dec(part.p)) };
    }
    function looseWords(p, bound) {
      if (cmp(p, bound) > 0) return '<span class="cbad">The inequality fails here: the exact value is larger than the “bound”.</span>';
      if (cmp(p, bound) === 0) return 'Equal: the bound is reached exactly — it cannot be improved for this X.';
      if (num(p) === 0 && !(p instanceof Tiny)) return 'The exact probability is 0, so any bound ≥ 0 holds; the bound ' + tex(dec(bound)) + ' is far from it.';
      const r = num(bound) / Math.max(num(p), 1e-300);
      return 'The bound is ' + (p instanceof Tiny || r > 1e6 ? 'astronomically larger than' : 'about ' + tex(Lab.fmtDec(r, r >= 100 ? 0 : r >= 10 ? 1 : 2)) + ' times') + ' the exact value' + (num(bound) >= 1 ? '' : ' (the gap is ' + tex(dec(sub(bound, num(p) && !(p instanceof Tiny) ? p : 0))) + ')') + '.';
    }
    function drawMarkov() {
      const b = P.mk.body, M = D.M, mk = D.mk, den = D.den, cT = tv(D.c);
      Lab.clear(b);
      if (!D.nonneg) b.appendChild(K.note('<b>Markov needs X ≥ 0.</b> The lecture: “X cannot take negative values … if the range of X has a negative value then this does not hold” (' + at(10, 30) + '). Your X takes ' + tex(listTex(D.negs.slice(0, 6).map(t => tv(F(t.v))))) + (D.negs.length > 6 ? ', …' : '') + ' with positive probability, so μ/c below is <b>not</b> a bound — the numbers show what goes wrong.', 'bd-warn'));
      chart(stage(b), 'markov');
      b.appendChild(cmpBars([
        { label: 'exact ' + tex('P(X\\ge ' + cT + ')'), v: mk.p, vt: vtOf(mk.p), cls: 'ex' },
        { label: (D.nonneg ? 'Markov’s bound ' : 'not a bound ') + tex('\\mu/c'), v: mk.bound, vt: vtOf(mk.bound), cls: 'bd' }]));
      const steps = [];
      const lowest = M.finite ? M.vals.find((_, i) => num(M.ps[i]) > 0) : M.lo;
      steps.push({ html: 'The conditions (' + at(9, 0) + '): ' + (D.nonneg ? 'X ≥ 0 — your smallest value with positive probability is ' + tex(tv(F(lowest))) + ' ✓' : '<span class="cbad">X ≥ 0 fails</span> — your X can be ' + tex(tv(F(D.negs[0].v))) + '') + '; ' + tex('c=' + cT + '>0') + ' ✓; the mean is finite: ' + tex('\\mu' + relv(D.mu)) + ' ✓.' });
      const tt = tailTex(D.c, mk);
      steps.push({ html: tt.html, math: tt.math, block: tt.block || null });
      steps.push({ html: 'The bound uses only the mean:', math: '\\frac{\\mu}{c}=' + relAfter('\\frac{' + tv(D.mu) + '}{' + cT + '}', mk.bound), note: cmp(D.c, D.mu) <= 0 ? 'Here c ≤ μ, so μ/c ≥ 1: the bound says nothing (every probability is at most 1). Markov only helps for c above the mean — that is the lecture’s “it cannot be 1” (' + at(3, 20) + ').' : null });
      steps.push({ html: 'Compare: ' + looseWords(mk.p, mk.bound), math: tp(mk.p) + (cmp(mk.p, mk.bound) <= 0 ? '\\;\\le\\;' : '\\;>\\;') + tp(mk.bound) });
      // the lecture's proof with the learner's numbers
      const proof = markovProof();
      if (proof) steps.push(proof);
      // Chebyshev on the same event
      if (cmp(D.c, D.mu) > 0 && num(D.sigma) > 0) {
        const d = sub(D.c, D.mu), cb = div(D.vr, sq(d));
        steps.push({ html: 'With σ as well (Chebyshev, one side, ' + at(14, 0) + '): ' + tex('X\\ge c') + ' means ' + tex('X-\\mu\\ge c-\\mu=' + tv(d)) + ', so',
          math: 'P(X\\ge ' + cT + ')\\le P(|' + xMinus(D.mu) + '|\\ge ' + tv(d) + ')\\le\\frac{\\sigma^2}{(c-\\mu)^2}=\\frac{' + tv(D.vr) + '}{' + par(d) + '^2}' + rel(cb),
          note: cmp(cb, mk.bound) < 0 ? 'Smaller than Markov’s ' + txt(mk.bound, 4) + ': knowing σ helps here.' : cmp(cb, mk.bound) > 0 ? 'Larger than Markov’s ' + txt(mk.bound, 4) + ': here the mean alone gives the better bound.' : 'The same as Markov’s.' });
      }
      b.appendChild(stepsW(steps));
      if (D.mult && D.nonneg) {
        b.appendChild(h('h4', { class: 'bd-h4', text: 'Markov at multiples of the mean' }));
        b.appendChild(K.note('With ' + tex('c=t\\mu') + ' the bound is ' + tex('\\frac{\\mu}{t\\mu}=\\frac{1}{t}') + ' for every non-negative X. The lecture’s example is ' + tex('c=100\\mu') + ': ' + tex('P(X\\ge 100\\mu)\\le\\frac{1}{100}=0.01') + ' (' + at(9, 40) + ').', 'bd-p'));
        const rows = D.mult.map(r => [tex('t=' + r.t), tex('c=' + r.t + '\\mu=' + tv(r.c)), tex(pD(r.p, D.den)) + (isEx(norm(r.p)) && norm(r.p).d > 1 ? ' <span class="muted">' + tex(eqD(r.p) + dec(r.p)) + '</span>' : ''), tex(tp(r.bound)), looseCell(r.p, r.bound)]);
        b.appendChild(table(['t', 'c = tμ', 'exact ' + tex('P(X\\ge c)'), 'bound ' + tex('1/t'), 'how loose'], rows));
      }
    }
    function looseCell(p, bound) {
      if (cmp(p, bound) > 0) return '<span class="cbad">fails</span>';
      if (cmp(p, bound) === 0) return 'equal (tight)';
      if (num(p) === 0 && !(p instanceof Tiny)) return 'exact is 0';
      const r = num(bound) / Math.max(num(p), 1e-300);
      return p instanceof Tiny || r > 1e6 ? 'far above' : tex('\\times' + Lab.fmtDec(r, r >= 100 ? 0 : r >= 10 ? 1 : 2));
    }
    /** a table on its side: one row per quantity, one column per value of X */
    function tableT(rows, on) {
      const t = h('table', { class: 'tbl bd-tbl bd-tt' });
      const tb = h('tbody');
      rows.forEach(([head, cells]) => tb.appendChild(h('tr', {}, [h('th', { html: head })].concat(cells.map((c, i) => h('td', { class: on && on[i] ? 'bd-on' : null, html: c }))))));
      t.appendChild(tb);
      return h('div', { class: 'tbl-wrap bd-tw' }, t);
    }
    /** the values counted in |X − μ| ≥ kσ, short: 2, 12 · 1–21; 80–100 · ≥ 11 */
    function outsideTex(part) {
      const side = list => (list.length <= 3 ? list.map(t => tv(F(t.x))).join(',\\ ') : tv(F(list[0].x)) + '\\text{–}' + tv(F(list[list.length - 1].x)));
      const bits = [];
      if (part.L.length) bits.push(side(part.L));
      if (part.R && part.R.length) bits.push(side(part.R));
      if (!part.R) bits.push('\\ge ' + part.Rm);
      return bits.length ? tex(bits.join('\\ \\text{and}\\ ')) : '<span class="muted">none</span>';
    }
    function table(head, rows, hl) {
      const t = h('table', { class: 'tbl bd-tbl' });
      t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
      const tb = h('tbody');
      rows.forEach((r, i) => tb.appendChild(h('tr', { class: hl && hl[i] ? 'bd-you' : null }, r.map(c => h('td', { html: c })))));
      t.appendChild(tb);
      return h('div', { class: 'tbl-wrap bd-tw' }, t);
    }
    /** the lecture's proof (10:20) with the learner's numbers: μ = A + B ≥ B ≥ c·P(X ≥ c) */
    function markovProof() {
      const M = D.M, c = D.c, den = D.den, cT = tv(c);
      let A, Aterms = null, B, Bterms = null;
      if (M.finite) {
        const lo = [], hi = [];
        M.xs.forEach((x, i) => (cmp(x, c) < 0 ? lo : hi).push(i));
        A = sum(lo.map(i => mul(M.xs[i], M.ps[i]))); B = sum(hi.map(i => mul(M.xs[i], M.ps[i])));
        Aterms = lo.map(i => par(M.xs[i]) + '\\cdot ' + pD(M.ps[i], den));
        Bterms = hi.map(i => par(M.xs[i]) + '\\cdot ' + pD(M.ps[i], den));
      } else {
        const m = Math.max(M.lo, ceilV(c));
        if (m - M.lo > 5000) return null;
        const xs = []; for (let x = M.lo; x < m; x++) xs.push(x);
        A = sum(xs.map(x => mul(F(x), M.pmf(x))));
        Aterms = xs.map(x => x + '\\cdot ' + (M.fam === 'poisson' ? dec(M.pmf(x)) : tp(M.pmf(x))));
        B = sub(D.mu, A);
      }
      // c·P(X ≥ c), with a probability too small for a float kept as a power of 10
      const cpT = D.mk.p instanceof Tiny ? '\\approx ' + dec(new Tiny(D.mk.p.lg + Math.log10(num(c)))) : num(D.mk.p) === 0 ? '=0' : rel(mul(c, D.mk.p));
      const aPs = M.finite ? M.xs.map((x, i) => i).filter(i => cmp(M.xs[i], c) < 0).map(i => M.ps[i]) : [0.5];
      const bPs = M.finite ? M.xs.map((x, i) => i).filter(i => cmp(M.xs[i], c) >= 0).map(i => M.ps[i]) : [];
      const aT = Aterms.length ? plusList(Aterms) + (M.fam === 'geometric' ? totAfter(Aterms.map((_, j) => M.pmf(M.lo + j)), A, den) : M.finite ? totAfter(aPs, A, den) : '\\approx ' + dec(A)) : '0';
      const bT = Bterms ? (Bterms.length ? plusList(Bterms) + totAfter(bPs, B, den) : '0') : '\\mu-A' + rel(B);
      const ok = cmp(A, 0) >= 0;
      return { html: 'Why it holds — the lecture’s proof (' + at(10, 20) + ') with your numbers. Split the mean at c: ' + tex('A') + ' adds ' + tex('t\\,P(X=t)') + ' over the values ' + tex('t\\lt c') + ', ' + tex('B') + ' over ' + tex('t\\ge c') + '.',
        math: '\\mu=A+B,\\quad A=' + aT + ',\\quad B=' + bT,
        note: ok ? 'A ≥ 0 because X ≥ 0. So μ ≥ B, and every t in B is at least c, so B ≥ c·P(X ≥ c): ' + tex(tv(D.mu) + '\\ge ' + tp(B) + '\\ge ' + cT + '\\cdot ' + tp(D.mk.p) + cpT) + '. Divide by c: P(X ≥ c) ≤ μ/c.'
          : '<span class="cbad">Here A is negative</span> (negative values of X pull the mean down), so “μ ≥ B” fails and the proof breaks: ' + tex('A' + rel(A) + '\\lt 0') + '.' };
    }

    /* ---------------------------------------------------- panel: Chebyshev */
    function drawCheb() {
      const b = P.ch.body, C = D.ch, M = D.M, den = D.den;
      Lab.clear(b);
      if (C.err) { b.appendChild(K.note(C.err, 'bd-warn')); chart(stage(b), 'plain'); return; }
      chart(stage(b), 'cheb');
      b.appendChild(cmpBars([
        { label: 'exact ' + tex(chebLhs(C, D.mu)), v: C.p, vt: vtOf(C.p), cls: 'ex' },
        { label: 'Chebyshev’s bound ' + tex(boundSym(C)), v: C.bound, vt: vtOf(C.bound), cls: 'bd' }]));
      const steps = [];
      const sT = isEx(norm(D.sigma)) ? tv(D.sigma) : (isEx(norm(D.vr)) ? '\\sqrt{' + tv(D.vr) + '}' : dec(D.sigma));
      if (C.mode === 'k') steps.push({ html: 'The distance: you chose ' + tex('k=' + tv(C.k)) + ' standard deviations.', math: 'k\\sigma=' + tv(C.k) + '\\cdot ' + sT + (isEx(norm(C.kS)) ? relv(C.kS) : '\\approx ' + dec(C.kS)) + ',\\quad \\mu\\pm k\\sigma=' + tv(D.mu) + '\\pm ' + (isEx(norm(C.kS)) ? tv(C.kS) : dec(C.kS)) });
      else steps.push({ html: 'The distance: you chose ' + tex('a=' + tv(C.a)) + '. In standard deviations that is ' + tex('k=a/\\sigma') + ' (the lecture’s “other form” with ' + tex('c') + ' for the distance, ' + at(12, 0) + ').', math: (C.k != null ? 'k=\\frac{' + tv(C.a) + '}{' + sT + '}' + (isEx(norm(C.k)) ? relv(C.k) : '\\approx ' + dec(C.k)) + ',\\quad ' : '') + '\\mu\\pm a=' + tv(D.mu) + '\\pm ' + tv(C.a) });
      steps.push({ html: 'The interval and its ends:', math: '\\mu-' + (C.mode === 'k' ? 'k\\sigma' : 'a') + relv(C.loE) + ',\\qquad \\mu+' + (C.mode === 'k' ? 'k\\sigma' : 'a') + relv(C.hiE) });
      // the event, by squares (no square roots)
      const Ttex = C.mode === 'k' ? 'k^2\\sigma^2=' + par(C.k) + '^2\\cdot ' + tv(D.vr) + rel(C.T) : 'a^2=' + par(C.a) + '^2' + rel(C.T);
      const ev = { html: 'The event ' + tex('|X-\\mu|\\ge ' + (C.mode === 'k' ? 'k\\sigma' : 'a')) + ' is the same as ' + tex('(X-\\mu)^2\\ge ' + (C.mode === 'k' ? 'k^2\\sigma^2' : 'a^2')) + ' — compare squares, no square roots needed (' + at(12, 20) + ').', math: Ttex };
      if (M.finite && M.vals.length <= 20) {
        const cols = M.xs.map(x => { const d = sub(x, D.mu), d2 = sq(d); return { x, d, d2, o: cmp(d2, C.T) >= 0 }; });
        ev.block = tableT([
          [tex('x'), cols.map(c => tex(tv(c.x)))],
          [tex('x-\\mu'), cols.map(c => tex(tv(c.d)))],
          [tex('(x-\\mu)^2'), cols.map(c => tex(tv(c.d2)))],
          [tex('\\ge ' + (C.mode === 'k' ? 'k^2\\sigma^2' : 'a^2') + '?'), cols.map(c => (c.o ? '<b class="bd-outk">yes</b>' : '<span class="muted">no</span>'))]], cols.map(c => c.o));
      }
      steps.push(ev);
      // the probability, term by term
      const outVals = C.L.map(t => t.x).concat(C.R ? C.R.map(t => t.x) : []);
      const sideTex = (list, word) => {
        if (!list.length) return { names: [], nums: [] };
        return { names: list.map(t => 'P(X=' + Lab.fmtVal(t.x).replace('−', '-') + ')'), nums: list.map(t => (M.fam === 'poisson' ? dec(t.p) : pD(t.p, den))) };
      };
      const Lp = sideTex(C.L), Rp = C.R ? sideTex(C.R) : null;
      let names = Lp.names.concat(Rp ? Rp.names : []), nums = Lp.nums.concat(Rp ? Rp.nums : []);
      let infTail = '';
      if (!C.R) { names.push('P(X\\ge ' + C.Rm + ')'); nums.push(M.fam === 'geometric' ? '\\left(' + tp(M.q) + '\\right)^{' + (C.Rm - 1) + '}' : dec(C.pR)); infTail = M.fam === 'geometric' ? ' For the right tail without end: ' + tex('P(X\\ge ' + C.Rm + ')=(1-p)^{' + (C.Rm - 1) + '}' + rel(C.pR)) + ' (the first ' + (C.Rm - 1) + ' trials all fail).' : ' For the right tail without end: ' + tex('P(X\\ge ' + C.Rm + ')' + rel(C.pR)) + ' (the terms added until they no longer matter).'; }
      const sym = C.mode === 'k' ? 'k\\sigma' : 'a';
      const lhs = 'P(X\\le\\mu-' + sym + ')+P(X\\ge\\mu+' + sym + ')';
      const termPs = C.L.map(t => t.p).concat(C.R ? C.R.map(t => t.p) : []);
      const totC = (termPs.every(q => shownExact(q, den)) && (C.R || (M.fam === 'geometric' && !(C.pR instanceof Tiny)))) ? relD(C.p, den) : '\\approx ' + dec(C.p);
      const allEq = nums.length > 16 && C.R && outVals.length && [...C.L, ...C.R].every(t => cmp(t.p, (C.L[0] || C.R[0]).p) === 0);
      const total = C.p;
      steps.push({ html: (outVals.length || !C.R ? 'The values at least ' + (C.mode === 'k' ? 'kσ' : 'a') + ' from μ' + (outVals.length ? ': ' + tex(listTex(outVals.length > 12 ? outVals.slice(0, 3).map(v => tv(F(v))).concat(['\\dots'], outVals.slice(-2).map(v => tv(F(v)))) : outVals.map(v => tv(F(v))))) + (outVals.length > 12 ? ' (' + outVals.length + ' values)' : '') : '') + (C.R ? '' : (outVals.length ? ', and ' : ': ') + tex(C.Rm + ',\\ ' + (C.Rm + 1) + ',\\ \\dots')) + ' — violet in the chart, outside the green band.' : 'No value of your X is that far from μ: both tails are empty.') + infTail,
        math: chebLhs(C, D.mu) + '=' + lhs + (names.length ? '=' + plusList(names) + '=' + (allEq ? nums.length + '\\times ' + nums[0] : plusList(nums)) : '') + totC,
        block: nums.length > 16 && !allEq ? more('Show all ' + nums.length + ' terms', plusList(nums, 1e9) + totC) : null });
      if (C.onEdge.length) steps.push({ html: 'Exactly on the edge: ' + tex(listTex(C.onEdge.map(v => tv(F(v))))) + ' ' + (C.onEdge.length > 1 ? 'are' : 'is') + ' exactly ' + (C.mode === 'k' ? 'kσ' : 'a') + ' from μ. Chebyshev’s event uses ≥, so ' + (C.onEdge.length > 1 ? 'they count' : 'it counts') + '; with “>” (as on the dice slide, ' + at(7, 20) + ') ' + (C.onEdge.length > 1 ? 'they would' : 'it would') + ' not.' });
      steps.push({ html: 'The bound and the comparison: ' + looseWords(C.p, C.bound), math: (C.mode === 'k' ? '\\frac{1}{k^2}=\\frac{1}{' + par(C.k) + '^2}' : '\\frac{\\sigma^2}{a^2}=\\frac{' + tv(D.vr) + '}{' + par(C.a) + '^2}') + rel(C.bound) + ',\\qquad ' + tp(C.p) + (cmp(C.p, C.bound) <= 0 ? '\\le ' : '\\gt ') + tp(C.bound),
        note: cmp(C.bound, 1) >= 0 ? 'The bound is at least 1, so it says nothing: Chebyshev only helps for k > 1.' : null });
      const inside = oneMinus(C.p);
      if (cmp(C.bound, 1) < 0) steps.push({ html: 'The other side of the same fact (' + at(13, 20) + '): the probability strictly inside the interval is at least ' + tex('1-' + boundSym(C)) + '.', math: 'P(\\mu-' + (C.mode === 'k' ? 'k\\sigma' : 'a') + '\\lt X\\lt\\mu+' + (C.mode === 'k' ? 'k\\sigma' : 'a') + ')=1-' + tp(C.p) + relOne(inside) + '\\;\\ge\\;1-' + tp(C.bound) + rel(sub1(C.bound)) });
      b.appendChild(stepsW(steps));
    }

    /* ---------------------------------------------------- panel: the k table */
    function drawTable() {
      const b = P.tab.body, den = D.den;
      Lab.clear(b);
      if (!D.table.length) { b.appendChild(K.note('Your X has σ = 0 (it never moves from μ), so there is nothing to compare.', 'bd-p')); return; }
      const rows = D.table.map(r => {
        const p = r.part.p;
        return [tex(tv(r.k)) + (r.you ? ' <span class="bd-tag">yours</span>' : ''), tex((isEx(norm(r.kS)) ? '' : '\\approx ') + (isEx(norm(r.kS)) ? tv(r.kS) : dec(r.kS))),
          outsideTex(r.part),
          tex(pD(p, den)) + (isEx(norm(p)) && norm(p).d > 1 ? ' <span class="muted">' + tex(eqD(p) + dec(p)) + '</span>' : num(p) || p instanceof Tiny ? ' <span class="muted">' + tex(eqD(p) + dec(p)) + '</span>' : ''),
          tex(tp(r.bound)) + (norm(r.bound).d > 1 ? ' <span class="muted">' + tex(eqD(r.bound) + dec(r.bound)) + '</span>' : ''),
          looseCell(p, r.bound)];
      });
      b.appendChild(table([tex('k'), tex('k\\sigma'), 'outside ' + tex('\\mu\\pm k\\sigma'), 'exact ' + tex('P(|X-\\mu|\\ge k\\sigma)'), tex('1/k^2'), 'bound ÷ exact'], rows, D.table.map(r => r.you)));
      const two = D.table.find(r => cmp(r.k, 2) === 0);
      b.appendChild(K.note('At k = 1 the bound is 1 and says nothing. The lecture: Chebyshev “may be actually quite loose” (' + at(14, 50) + ') — it must hold for every X with this μ and σ, so it cannot be close for all of them.' + (two ? ' At k = 2 your X has ' + tex(tp(two.part.p) + eqD(two.part.p) + dec(two.part.p)) + ' outside, against the bound 1/4.' : ''), 'bd-p'));
    }

    /* ---------------------------------------------------- panel: the lecture's statements */
    function drawLecture() {
      const b = P.lec.body, C = D.ch, M = D.M, mk = D.mk, cT = tv(D.c);
      Lab.clear(b);
      const items = [];
      const add2 = (when, says, yours) => items.push({ when, says, yours });
      // marks: ≥ the mean cannot be 0
      add2(at(2, 20), 'The average is 50, so the fraction with marks ≥ 50 “cannot be 0”: some value is at least the mean, ' + tex('P(X\\ge\\mu)\\gt 0') + '.',
        tex('P(X\\ge ' + tv(D.mu) + ')' + rel(D.atMu.p)) + (num(D.atMu.p) > 0 || D.atMu.p instanceof Tiny ? ' > 0 ✓' : ''));
      // cannot be 1
      add2(at(3, 20), 'The fraction with marks ≥ 80 “cannot be 1”: if ' + tex('P(X\\ge c)=1') + ' then ' + tex('\\mu\\ge c') + '. Markov makes it precise: at most ' + tex('\\mu/c') + ', and 50/80 = 0.625 is why it cannot even be 0.9.',
        D.nonneg ? (cmp(D.c, D.mu) > 0 ? 'Your c = ' + txt(D.c) + ' is above μ = ' + txt(D.mu) + ': ' + tex('P(X\\ge ' + cT + ')\\le ' + relAfter('\\frac{' + tv(D.mu) + '}{' + cT + '}', mk.bound)) + ' < 1 ✓' : 'Your c = ' + txt(D.c) + ' is not above μ = ' + txt(D.mu) + ', so μ/c ≥ 1: pick c > μ to see it.') : 'Your X can be negative: Markov does not apply.');
      // standard units
      if (num(D.sigma) > 0) {
        const xs = M.finite ? [M.lo, M.hi] : [M.lo];
        add2(at(5, 40), 'Standard units: ' + tex('\\frac{X-\\mu}{\\sigma}') + ' is the number of standard deviations from the mean.',
          xs.map(x => tex('x=' + tv(F(x))) + ': ' + tex('\\frac{' + tv(F(x)) + '-' + par(D.mu) + '}{' + dec(D.sigma) + '}\\approx ' + dec(div(sub(F(x), D.mu), D.sigma), 2))).join(' &nbsp;·&nbsp; ') + (C.err ? '' : ' — Chebyshev’s event is “at least ' + (C.k != null ? txt(C.k) : 'k') + ' standard units away”.'));
      }
      // Markov
      add2(at(9, 0), 'Markov: for X ≥ 0, ' + tex('P(X\\ge c)\\le\\frac{\\mu}{c}') + '.',
        D.nonneg ? tex('P(X\\ge ' + cT + ')=' + tp(mk.p) + (cmp(mk.p, mk.bound) <= 0 ? '\\le ' : '\\gt ') + relAfter('\\frac{' + tv(D.mu) + '}{' + cT + '}', mk.bound)) + (cmp(mk.p, mk.bound) <= 0 ? ' ✓' : '') : 'Not for your X (it can be negative): ' + tex('P(X\\ge ' + cT + ')=' + tp(mk.p)) + ' against ' + tex('\\frac{\\mu}{c}=' + tp(mk.bound)) + (cmp(mk.p, mk.bound) > 0 ? ' — the inequality fails.' : ' — it happens to hold here, but nothing guarantees it.'));
      if (D.mult && D.nonneg) {
        const r = D.mult[4];
        add2(at(9, 40), tex('c=100\\mu') + ': ' + tex('P(X\\ge 100\\mu)\\le\\frac{1}{100}=0.01') + '.', tex('100\\mu=' + tv(r.c)) + ': ' + tex('P(X\\ge ' + tv(r.c) + ')' + relD(r.p, D.den) + '\\le 0.01') + ' ✓');
      }
      if (!C.err) {
        const kk = C.k != null ? tv(C.k) : 'k';
        add2(at(11, 0), 'Chebyshev: ' + tex('P(|X-\\mu|\\ge k\\sigma)\\le\\frac{1}{k^2}') + ' — X may be negative.',
          C.mode === 'k' ? tex(chebLhs(C, D.mu) + '=' + tp(C.p) + '\\le\\frac{1}{' + par(C.k) + '^2}=' + tp(C.bound)) + ' ✓' : tex('k=a/\\sigma' + (C.k != null ? (isEx(norm(C.k)) ? relv(C.k) : '\\approx ' + dec(C.k)) : '')) + ': ' + tex(chebLhs(C, D.mu) + '=' + tp(C.p) + '\\le ' + tp(C.bound)) + ' ✓');
        add2(at(12, 0), 'The same with a distance ' + tex('c') + ' (here ' + tex('a') + ', so it does not clash with Markov’s c): ' + tex('P(|X-\\mu|\\ge a)\\le\\frac{\\sigma^2}{a^2}') + '.',
          C.mode === 'k' ? tex('a=k\\sigma' + (isEx(norm(C.a)) ? relv(C.a) : '\\approx ' + dec(C.a))) + ': ' + tex('\\frac{\\sigma^2}{a^2}=\\frac{\\sigma^2}{k^2\\sigma^2}=\\frac{1}{k^2}' + rel(C.bound)) + ', and ' + tex(chebLhs(C, D.mu) + '=' + tp(C.p) + '\\le ' + tp(C.bound)) + ' ✓'
            : tex('a=' + tv(C.a)) + ': ' + tex('\\frac{\\sigma^2}{a^2}=\\frac{' + tv(D.vr) + '}{' + par(C.a) + '^2}' + rel(C.bound)) + ', and ' + tex(chebLhs(C, D.mu) + '=' + tp(C.p) + '\\le ' + tp(C.bound)) + ' ✓');
        add2(at(12, 20), 'Chebyshev is Markov applied to the non-negative ' + tex('Y=(X-\\mu)^2') + ', whose mean is ' + tex('E[Y]=\\sigma^2') + '.',
          tex('P\\big((' + xMinus(D.mu) + ')^2\\ge ' + tp(C.T) + '\\big)=' + tp(C.p) + '\\le\\frac{E[Y]}{' + tp(C.T) + '}=\\frac{' + tv(D.vr) + '}{' + tp(C.T) + '}' + rel(div(D.vr, C.T))));
        if (cmp(C.bound, 1) < 0) add2(at(13, 20), 'The complement: ' + tex('P(\\mu-k\\sigma\\lt X\\lt\\mu+k\\sigma)\\ge 1-\\frac{1}{k^2}') + ' — for k = 2: at least 3/4 = 75% within 2σ.',
          'At least ' + tex(tp(sub1(C.bound)) + eqD(sub1(C.bound)) + Lab.fmtDec(num(sub1(C.bound)) * 100, 2) + '\\%') + ' within ' + (C.k != null ? txt(C.k) : 'k') + 'σ; your X has ' + tex(relOne(oneMinus(C.p)).replace(/^=/, '').replace(/^\\approx /, '\\approx ')) + ' strictly inside ' + tex((isEx(norm(C.loE)) ? '' : '\\approx ') + '(' + (isEx(norm(C.loE)) ? tv(C.loE) : dec(C.loE)) + ',\\ ' + (isEx(norm(C.hiE)) ? tv(C.hiE) : dec(C.hiE)) + ')') + ' ✓');
        add2(at(14, 0), 'The two tails: ' + tex('P(X\\ge\\mu+k\\sigma)+P(X\\le\\mu-k\\sigma)\\le\\frac{1}{k^2}') + ', so each tail alone is ' + tex('\\le\\frac{1}{k^2}') + '.',
          tex(tp(C.pR) + '+' + tp(C.pL) + rel(C.p) + '\\le ' + tp(C.bound)) + '; each tail ' + tex(tp(C.pR)) + ' and ' + tex(tp(C.pL)) + ' ≤ ' + tex(tp(C.bound)) + ' ✓');
      }
      const two = D.table.find(r => cmp(r.k, 2) === 0);
      if (two) add2(at(14, 40), 'For every X: ' + tex('P(|X-\\mu|\\ge 2\\sigma)\\le\\frac14') + '. Binomial(10, 1/2) has ≈ 0.021 and Geometric(1/4) ≈ 0.056.', 'Your X: ' + tex('P(|' + xMinus(D.mu) + '|\\ge 2\\sigma)' + rel(two.part.p) + '\\le\\frac14') + ' ✓');
      const ul = h('ul', { class: 'bd-lec' });
      items.forEach(it => {
        const li = h('li', {}, h('div', { class: 'bd-when' }), h('div', { class: 'bd-says' }), h('div', { class: 'bd-yours' }));
        Lab.setHTML(li.children[0], it.when);
        Lab.setHTML(li.children[1], it.says);
        Lab.setHTML(li.children[2], '<b>Yours:</b> ' + it.yours);
        ul.appendChild(li);
      });
      b.appendChild(ul);
      b.appendChild(K.note('The lecture ends with a question to think about (' + at(17, 0) + '): if the number of accidents drops by 10000 a day, is that significant? Divide by the standard deviation: a change of 10000 is ' + tex('10000/\\sigma') + ' standard units.', 'bd-p'));
    }
  }

  Lab.lab({
    id: 'lab-s2-bounds', course: 's2', week: 3, order: 4,
    title: 'Markov and Chebyshev bounds lab', sub: 'Week 3 · L3.7',
    topics: ['Markov’s inequality', 'Chebyshev’s inequality', 'μ and σ', 'tail probability', 'k standard deviations', 'standard units', 'how loose a bound is'],
    desc: 'Pick a distribution or type your own PMF. See μ and σ worked out, then Markov’s bound μ/c next to the exact P(X ≥ c) and Chebyshev’s 1/k² next to the exact P(|X − μ| ≥ kσ), with the tails shaded, a table for k = 1, 1.5, 2, 3 and the lecture’s statements with your numbers.',
    render: host => boundsLab(host),
  });
})();
