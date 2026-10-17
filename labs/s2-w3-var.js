/* Playground lab (s2-w3-var): variance and standard deviation of the learner's own X (L3.4, with L3.5's joint tables).
   The PMF with μ and μ ± σ; Var(X) both ways (E[(X − μ)²] row by row, and E[X²] − μ²); SD = √Var; Var(aX + b) = a²Var(X)
   and SD(aX + b) = |a|SD(X), checked on the PMF of aX + b; the lecture's table of variances of the standard
   distributions; Var(X + Y) = Var(X) + Var(Y) for independent X and Y, and a joint table for dependent ones.
   Self-contained: uses only the lab kit (Lab.play), not the lesson widgets. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const Frac = Lab.Frac;
  const tex = s => Lab.tex(String(s));
  const V4 = 'tZs2xS6XfYg', V5 = 'UoZc81wNK4I';
  const vl = (id, m) => Lab.vlink(id, m);

  /* ================================================= exact while the integers stay safe, else floating point */
  const SAFE = Number.MAX_SAFE_INTEGER;
  const okN = x => Math.abs(x) <= SAFE;
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
  const sq = a => mul(a, a);
  const sum = arr => arr.reduce((s, v) => add(s, v), F(0));
  function pow(a, k) { let r = F(1); for (let i = 0; i < k; i++) r = mul(r, a); return r; }
  function same(a, b, tol = 1e-9) {
    a = norm(a); b = norm(b);
    if (isEx(a) && isEx(b)) return a.eq(b);
    return Math.abs(Number(a) - Number(b)) <= tol * Math.max(1, Math.abs(Number(a)), Math.abs(Number(b)));
  }
  const isZero = v => num(v) === 0;
  const absV = v => (num(v) < 0 ? neg(v) : norm(v));
  function isqrt(n) { if (n < 0 || !okN(n)) return null; const r = Math.round(Math.sqrt(n)); return r * r === n ? r : null; }
  /** square root: exact when the fraction is a perfect square (1/4 → 1/2), else a decimal */
  function sqrtV(v) {
    v = norm(v);
    if (isEx(v) && v.n >= 0) { const a = isqrt(v.n), b = isqrt(v.d); if (a != null && b != null) return F(a, b); }
    return Math.sqrt(Math.max(0, Number(v)));
  }
  /** a ≤ b, exactly when both are exact */
  const leq = (a, b) => { a = norm(a); b = norm(b); return isEx(a) && isEx(b) ? a.sub(b).n <= 0 : Number(a) <= Number(b) * (1 + 1e-12) + 1e-15; };

  /* ================================================================ formatting (TeX) */
  function sci(x, sig = 3) { const [m, e] = x.toExponential(sig - 1).split('e'); return m.replace(/\.?0+$/, '') + '\\times 10^{' + Number(e) + '}'; }
  const shortDec = v => isEx(v) && K.exactDecimal(v);
  /** number of places of an exact decimal (denominator 2^a·5^b), else −1 */
  function decPlaces(f) {
    if (!isEx(f)) return -1;
    let d = f.d, a = 0, b = 0;
    while (d % 2 === 0) { d /= 2; a++; }
    while (d % 5 === 0) { d /= 5; b++; }
    return d === 1 ? Math.max(a, b) : -1;
  }
  /** the full decimal of an exact fraction with at most 8 places ("0.16807"), else null */
  function exactDec(f) { const k = decPlaces(f); return k < 0 || k > 8 ? null : Lab.fmtDec(f.valueOf(), k); }
  /** a rounded result: 4 places (0.2240 keeps its 0), small values keep 3 significant digits */
  function dec(v, dp = 4) {
    const x = num(v);
    if (!isFinite(x)) return '\\text{?}';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 1e-4) return (x < 0 ? '-' : '') + sci(a);
    if (a < 0.01) { const s = x.toPrecision(3); return Number(s) === x ? String(Number(s)) : s; }
    const s = Lab.fmtDec(x, dp);
    return Number(s) === x ? s : x.toFixed(dp);
  }
  /** an inexact number inside a formula: 6 places, so that the digits shown reproduce the 4-place results */
  function decL(v) {
    const x = num(v);
    if (!isFinite(x)) return '\\text{?}';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 1e-4) return (x < 0 ? '-' : '') + sci(a, 4);
    if (a < 0.01) { const s = x.toPrecision(4); return Number(s) === x ? String(Number(s)) : s; }
    const s = Lab.fmtDec(x, 6);
    return Number(s) === x ? s : x.toFixed(6);
  }
  /** a probability inside a formula: whole number, short fraction (1/6), exact decimal (0.16807), fraction, else 6 places */
  function txP(v) {
    v = norm(v);
    if (isEx(v)) {
      if (v.d === 1) return String(v.n);
      if (v.d <= 1000) return v.tex();
      const e = exactDec(v); if (e) return e;
      if (v.d <= 1e7) return v.tex();
    }
    return decL(v);
  }
  /** a value inside a formula: whole number, exact decimal (3.5, 12.25), fraction (7/3), else 6 places */
  function txV(v) {
    v = norm(v);
    if (isEx(v)) {
      if (v.d === 1) return String(v.n);
      const e = exactDec(v); if (e) return e;
      if (v.d <= 1e7) return v.tex();
    }
    return decL(v);
  }
  /** a result with its sign: "=35/12≈2.9167", "=3.5", "=7203/20000=0.36015", "≈2.9167" */
  function rel(v) {
    v = norm(v);
    if (isEx(v)) {
      if (v.d === 1) return '=' + v.n;
      if (shortDec(v)) return '=' + Lab.fmtDec(v.valueOf(), 4);
      const e = exactDec(v);
      if (v.d <= 1e7) return '=' + v.tex() + (e ? '=' + e : '\\approx ' + dec(v));
      return e ? '=' + e : '\\approx ' + dec(v);
    }
    const d = dec(v);
    return (Number(d) === v ? '=' : '\\approx ') + d;
  }
  /** the SD inside a formula: exact when it is, else √(variance) with the exact variance, else 6 places */
  const sdTex = (sd, v) => (isEx(norm(sd)) ? txV(sd) : isEx(norm(v)) ? '\\sqrt{' + txV(v) + '}' : decL(sd));
  const par = s => (/^-/.test(s) ? '\\left(' + s + '\\right)' : s);
  /** plain text (tooltips, messages) */
  const txt = v => { v = norm(v); return isEx(v) ? v.toString() : (v !== 0 && Math.abs(v) < 5e-5 ? v.toExponential(2) : Lab.fmtDec(v, 4)); };
  /** full precision (data attributes for checks) */
  const plain = v => { v = norm(v); return isEx(v) ? v.toString() : String(v); };
  /** short label above a bar */
  function barLab(v) { v = norm(v); if (isEx(v) && v.d <= 99) return v.toString(); const x = Number(v); return x === 0 ? '0' : x < 0.001 ? '<0.001' : Lab.fmtDec(x, 3); }
  /** "t1+t2+… = total" — a lone term is not repeated as its own total */
  function withRel(terms, v) {
    v = norm(v);
    if (terms.length > 1) return sumOut(terms) + rel(v);
    if (!isEx(v) || v.d === 1) return terms[0];
    return terms[0] + rel(v);
  }
  const plural = (n, w, ws) => n + ' ' + (n === 1 ? w : ws || w + 's');
  const range = (a, b) => { const r = []; for (let v = a; v <= b; v++) r.push(v); return r; };
  const setTex = (lo, hi) => (hi - lo <= 3 ? range(lo, hi).join(',') : lo + ',' + (lo + 1) + ',\\dots,' + hi);
  /** a long sum written out term by term (inline maths, so it wraps on phones) */
  function sumOut(terms, max = 40) {
    if (!terms.length) return '0';
    terms = terms.map(t => '{' + t + '}');   // a group: a line never breaks inside one term
    if (terms.length <= max) return terms.join('+');
    return terms.slice(0, 6).join('+') + '+\\dots+' + terms.slice(-3).join('+');
  }
  /** "+" between terms that may start with a minus: a + (−b) is written a - b */
  const joinSigned = terms => terms.map((t, i) => (i && /^-/.test(t) ? t : (i ? '+' : '') + t)).join('');

  /* ===================================================================== distributions */
  const SHOW = 'shown up to k', LAM = 'λ';
  function choose(n, k) { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return Math.round(r); }
  /** the values beyond the drawn part of an infinite PMF, as floats, until they are below 10^-19 */
  function tailRows(pmf, from, cap = 2500) {
    const out = [];
    for (let x = from; x < from + cap; x++) { const p = pmf(x); out.push({ x: F(x), p }); if (p < 1e-19 && x > from + 2) break; }
    return out;
  }
  /** model: {nm, fam, tex, words, rows [{x, p}] (drawn and listed), rest [{x, p}] (floats beyond the drawn part),
   *  finite, params, muF / varF (the lecture's formula values, exact when the parameters are)} */
  const model = (nm, fam, rows, extra) => Object.assign({ nm, fam, rows, rest: [], finite: true, params: {} }, extra);
  function fromSpec(spec, nm) {
    const q = (spec && spec.q) || {};
    const prob = s => (s instanceof Frac ? s : K.parseProb(String(s)));
    const int = (v, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? x : d; };
    const pErr = 'Type p for ' + nm + ' as a number from 0 to 1 (for example 1/3, 0.25 or 25%).';
    try {
      switch (spec && spec.fam) {
        case 'uniform': {
          let a = int(q.a, 1), b = int(q.b, 6);
          if (a > b) [a, b] = [b, a];
          if (b - a > 60) return { err: 'Keep a and b of ' + nm + ' within 60 of each other.' };
          const n = b - a + 1;
          return { m: model(nm, 'uniform', range(a, b).map(x => ({ x: F(x), p: F(1, n) })), { tex: '\\text{Uniform}\\{' + setTex(a, b) + '\\}', words: 'Uniform{' + a + ', …, ' + b + '}', params: { a, b, n }, muF: F(a + b, 2), varF: F(n * n - 1, 12) }) };
        }
        case 'bernoulli': {
          const p = prob(q.p);
          if (!p) return { err: pErr };
          const pp = norm(p), qq = sub(F(1), pp);
          return { m: model(nm, 'bernoulli', [{ x: F(0), p: qq }, { x: F(1), p: pp }], { tex: '\\text{Bernoulli}(' + txP(pp) + ')', words: 'Bernoulli(' + txt(pp) + ')', params: { p: pp, q: qq }, muF: pp, varF: mul(pp, qq) }) };
        }
        case 'binomial': {
          const p = prob(q.p), n = int(q.n, 4);
          if (!p) return { err: pErr };
          if (n < 1 || n > 40) return { err: 'n for ' + nm + ' must be a whole number from 1 to 40.' };
          const pp = norm(p), qq = sub(F(1), pp);
          const rows = range(0, n).map(k => ({ x: F(k), p: mul(mul(F(choose(n, k)), pow(pp, k)), pow(qq, n - k)) }));
          return { m: model(nm, 'binomial', rows, { tex: '\\text{Bin}(' + n + ',' + txP(pp) + ')', words: 'Bin(' + n + ', ' + txt(pp) + ')', params: { n, p: pp, q: qq }, muF: mul(F(n), pp), varF: mul(mul(F(n), pp), qq) }) };
        }
        case 'geometric': {
          const p = prob(q.p);
          if (!p) return { err: pErr };
          const pp = norm(p);
          if (num(pp) === 0) return { err: 'Geometric(0) is not a distribution: with p = 0 the first success never comes. Choose p > 0 for ' + nm + '.' };
          const qq = sub(F(1), pp), k = Math.max(3, int(q[SHOW], 10));
          const rows = range(1, k).map(x => ({ x: F(x), p: mul(pow(qq, x - 1), pp) }));
          const P = num(pp), Q = 1 - P;
          const rest = Q === 0 ? [] : tailRows(x => Math.pow(Q, x - 1) * P, k + 1);
          return { m: model(nm, 'geometric', rows, { finite: false, rest, restFrom: k + 1, tex: '\\text{Geometric}(' + txP(pp) + ')', words: 'Geometric(' + txt(pp) + ')', params: { p: pp, q: qq, k }, muF: div(F(1), pp), varF: div(qq, sq(pp)) }) };
        }
        case 'poisson': {
          const lam = Number(q[LAM]);
          if (!(lam > 0)) return { err: 'λ for ' + nm + ' must be more than 0.' };
          const L = Math.round(lam * 1e6) / 1e6, k = Math.max(3, int(q[SHOW], 12));
          const lnf = [0];
          const lnFact = n => { while (lnf.length <= n) lnf.push(lnf[lnf.length - 1] + Math.log(lnf.length)); return lnf[n]; };
          const pmf = x => Math.exp(-L + x * Math.log(L) - lnFact(x));
          const lamF = norm(F(L));
          return { m: model(nm, 'poisson', range(0, k).map(x => ({ x: F(x), p: pmf(x) })), { finite: false, rest: tailRows(pmf, k + 1), restFrom: k + 1, tex: '\\text{Poisson}(' + txV(lamF) + ')', words: 'Poisson(' + Lab.fmtDec(L, 4) + ')', params: { lam: lamF, k }, muF: lamF, varF: lamF }) };
        }
        case 'custom': {
          const c = spec.custom;
          if (!c || !c.vals || !c.vals.length) return { err: 'Type at least one value for ' + nm + '.' };
          const xs = c.vals.map(v => K.parseNum(String(v)));
          const ps = (c.probs || []).map(s => K.parseNum(String(s)));
          if (xs.some(v => v == null) || ps.length !== xs.length || ps.some(p => p == null || num(p) < 0)) return { err: 'Fix the red boxes in the PMF of ' + nm + '.' };
          if (xs.length > 60) return { err: 'Keep the PMF of ' + nm + ' to 60 values or fewer.' };
          if (xs.some(v => Math.abs(num(v)) > 1e6)) return { err: 'Keep the values of ' + nm + ' between −1,000,000 and 1,000,000.' };
          if (new Set(xs.map(num)).size !== xs.length) return { err: 'Each value of ' + nm + ' may appear only once.' };
          const tot = sum(ps);
          if (!same(tot, F(1), 1e-12)) return { err: 'The probabilities of ' + nm + ' add up to ' + txt(tot) + ', not 1. Press “Rescale to total 1” or edit them.' };
          const order = xs.map((_, i) => i).sort((i, j) => num(xs[i]) - num(xs[j]));
          return { m: model(nm, 'custom', order.map(i => ({ x: norm(xs[i]), p: norm(ps[i]) })), { tex: '\\text{your PMF}', words: 'your PMF' }) };
        }
        default: return { err: 'Unknown distribution for ' + nm + '.' };
      }
    } catch (e) { return { err: 'Could not read the distribution of ' + nm + ': ' + e.message }; }
  }
  function specFromPick(r) {
    if (!r.fam) return { fam: 'custom', custom: { vals: r.dist.vals.map(v => String(v)), probs: r.dist.p.map(f => String(f)) } };
    const q = {};
    Object.keys(r.q || {}).forEach(k => { const v = r.q[k]; q[k] = v instanceof Frac ? v.toString() : v; });
    return { fam: r.fam, q };
  }
  /** joint table as stored (strings, rows = Y) → {J: {xs, ys (sorted, exact), p[i][k] = f(xs[i], ys[k])}} or {err} */
  function jointFrom(j) {
    try {
      if (!j || !j.xs || !j.ys || !j.cells) return { err: 'There is no joint table yet.' };
      const xs = j.xs.map(v => K.parseNum(String(v))), ys = j.ys.map(v => K.parseNum(String(v)));
      if (xs.some(v => v == null) || ys.some(v => v == null)) return { err: 'Use numbers as the values of X (top row) and Y (left column) of the table.' };
      if (new Set(xs.map(num)).size !== xs.length || new Set(ys.map(num)).size !== ys.length) return { err: 'Each value of X and of Y may appear only once in the table.' };
      const cells = j.cells.map(r => r.map(c => K.parseNum(String(c))));
      if (cells.length !== ys.length || cells.some(r => r.length !== xs.length || r.some(c => c == null || num(c) < 0))) return { err: 'Fix the red boxes in the joint table (numbers 0 or more, like 1/8 or 0.125).' };
      const tot = sum(cells.flat());
      if (!same(tot, F(1), 1e-12)) return { err: 'The cells of the joint table add up to ' + txt(tot) + ', not 1. Press “Rescale to total 1” or edit them.' };
      const xo = xs.map((_, i) => i).sort((a, b) => num(xs[a]) - num(xs[b]));
      const yo = ys.map((_, k) => k).sort((a, b) => num(ys[a]) - num(ys[b]));
      return { J: { xs: xo.map(i => norm(xs[i])), ys: yo.map(k => norm(ys[k])), p: xo.map(i => yo.map(k => norm(cells[k][i]))) } };
    } catch (e) { return { err: 'Could not read the joint table: ' + e.message }; }
  }

  /* ========================================================================= the numbers */
  /** every number of one variable: μ, the rows of both tables, E[X²], both variances, SD */
  function moments(m) {
    const all = m.rows.concat(m.rest);
    const scale = Math.max(1, ...m.rows.map(r => Math.abs(num(r.x))));
    // floating-point noise (1e-17 where the answer is 0) is shown as 0
    const snap = (v, s) => (!isEx(norm(v)) && Math.abs(num(v)) < 1e-12 * s ? 0 : v);
    const muSum = snap(sum(all.map(r => mul(r.x, r.p))), scale);
    const mu = m.muF != null ? m.muF : muSum;
    const rows = m.rows.map(r => {
      const d = sub(r.x, mu), d2 = sq(d), x2 = sq(r.x);
      return { x: r.x, p: r.p, xp: mul(r.x, r.p), d, d2, t: mul(d2, r.p), x2, t2: mul(x2, r.p) };
    });
    const rest = m.rest.length ? {
      mass: m.rest.reduce((s, r) => s + num(r.p), 0),
      xp: m.rest.reduce((s, r) => s + num(r.x) * num(r.p), 0),
      t: m.rest.reduce((s, r) => s + Math.pow(num(r.x) - num(mu), 2) * num(r.p), 0),
      t2: m.rest.reduce((s, r) => s + num(r.x) * num(r.x) * num(r.p), 0),
      last: m.rest[m.rest.length - 1].x,
    } : null;
    const var1 = snap(add(sum(rows.map(r => r.t)), rest ? rest.t : F(0)), scale * scale);
    const ex2 = add(sum(rows.map(r => r.t2)), rest ? rest.t2 : F(0));
    const var2 = snap(sub(ex2, sq(mu)), scale * scale);
    const v = m.varF != null ? m.varF : var1;
    return { mu, muSum, rows, rest, var1, ex2, var2, v, sd: sqrtV(v) };
  }
  /** merge rows with the same value (a = 0 sends every x to b) */
  function mergeRows(rows) {
    const map = new Map();
    rows.forEach(r => { const k = plain(r.x); const e = map.get(k); if (e) e.p = add(e.p, r.p); else map.set(k, { x: r.x, p: r.p }); });
    return [...map.values()].sort((u, w) => num(u.x) - num(w.x));
  }
  /** PMF of a sum from pairs [{x, y, p}] → [{x: s, p, n (pairs)}] */
  function sumPmf(pairs) {
    const map = new Map();
    pairs.forEach(t => {
      if (isZero(t.p)) return;
      const s = add(t.x, t.y), k = plain(s);
      const e = map.get(k);
      if (e) { e.p = add(e.p, t.p); e.n++; e.pairs.push(t); } else map.set(k, { x: s, p: t.p, n: 1, pairs: [t] });
    });
    return [...map.values()].sort((u, w) => num(u.x) - num(w.x));
  }
  /** PMF of X + Y for independent X, Y: add f_X(x) f_Y(y) over the pairs with x + y = s (floats for long lists) */
  function convolve(ax, ay) {
    const big = ax.length * ay.length > 20000;
    const map = new Map();
    for (const r of ax) for (const u of ay) {
      const p = big ? num(r.p) * num(u.p) : mul(r.p, u.p);
      if (big ? !(p > 0) : isZero(p)) continue;
      const s = big ? num(r.x) + num(u.x) : add(r.x, u.x);
      const k = big ? s : plain(s);
      const e = map.get(k);
      const pair = big ? null : { x: r.x, y: u.x, p, a: r.p, b: u.p };
      if (e) { e.p = big ? e.p + p : add(e.p, p); e.n++; if (pair) e.pairs.push(pair); } else map.set(k, { x: s, p, n: 1, pairs: pair ? [pair] : null });
    }
    return [...map.values()].sort((a, b) => num(a.x) - num(b.x));
  }
  /** moments of a PMF given as rows only (exact when the rows are) */
  function rowMoments(rows) {
    const mu = sum(rows.map(r => mul(r.x, r.p)));
    const ex2 = sum(rows.map(r => mul(sq(r.x), r.p)));
    const v = sub(ex2, sq(mu));
    return { mu, ex2, v: num(v) < 0 && num(v) > -1e-12 ? 0 : v, sd: sqrtV(num(v) < 0 ? 0 : v) };
  }

  /* ================================================================== drawing helpers */
  function table(head, rows, opts = {}) {
    const t = h('table', { class: 'tbl w3v-tbl' });
    t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach(r => tb.appendChild(h('tr', { class: r.cls || null }, r.cells.map(c => h('td', { html: c })))));
    t.appendChild(tb);
    if (opts.foot) t.appendChild(h('tfoot', {}, h('tr', { class: 'w3v-foot' }, opts.foot.map(c => h('td', { html: c })))));
    return h('div', { class: 'tbl-wrap w3v-tw' }, t);
  }
  /** a PMF on a number line, with μ (violet line) and the band from μ − σ to μ + σ. o: {rows [{x, p}], mu, sd, name, tone, aria} */
  function spreadChart(o) {
    const box = h('div', { class: 'w3v-chart tone-' + (o.tone || 'x') });
    let lastW = -1, ro = null;
    const paint = () => {
      if (!box.isConnected) { if (ro && lastW > 0) ro.disconnect(); return; }
      const W = Math.max(260, Math.floor(box.clientWidth));
      if (!box.clientWidth || W === lastW) return;
      lastW = W;
      Lab.clear(box);
      box.appendChild(drawSpread(o, W));
    };
    if (window.ResizeObserver) { ro = new ResizeObserver(paint); ro.observe(box); }
    setTimeout(paint, 0);
    return box;
  }
  function drawSpread(o, W) {
    const H = 232, pl = 16, pr = 16, pt = 34, pb = 64;
    const xs = o.rows.map(r => num(r.x)), mu = num(o.mu), sd = num(o.sd);
    let lo = Math.min(...xs, mu - sd), hi = Math.max(...xs, mu + sd);
    if (!(hi > lo)) { lo -= 1; hi += 1; }
    const padX = (hi - lo) * 0.06; lo -= padX; hi += padX;
    const X = v => pl + ((v - lo) / (hi - lo)) * (W - pl - pr);
    const base = H - pb;
    const pmax = Math.max(...o.rows.map(r => num(r.p)), 1e-12);
    const Y = p => base - (p / pmax) * (base - pt);
    let gap = Infinity;
    for (let i = 1; i < xs.length; i++) gap = Math.min(gap, X(xs[i]) - X(xs[i - 1]));
    const bw = Math.max(2, Math.min(30, (isFinite(gap) ? gap : 80) * 0.6));
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w3v-svg', role: 'img', 'aria-label': o.aria || 'PMF with the mean and one standard deviation either side' });
    const b1 = X(mu - sd), b2 = X(mu + sd);
    if (sd > 0) s.appendChild(svg('rect', { x: b1, y: pt - 10, width: Math.max(0, b2 - b1), height: base - pt + 10, class: 'w3v-band' }));
    s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: base, y2: base, class: 'w3v-axis' }));
    const showVals = o.rows.length <= 16 && bw >= 18;
    o.rows.forEach(r => {
      const x = X(num(r.x)), y = Y(num(r.p));
      const g = svg('g', { class: 'w3v-col' });
      g.appendChild(svg('rect', { x: x - bw / 2, y, width: bw, height: Math.max(0, base - y), rx: Math.min(3, bw / 3), class: 'w3v-bar' }));
      if (showVals && num(r.p) > 0) g.appendChild(svg('text', { x, y: y - 5, 'text-anchor': 'middle', class: 'w3v-pv' }, barLab(r.p)));
      g.appendChild(svg('title', {}, 'P(' + o.name + ' = ' + Lab.fmtVal(num(r.x)) + ') = ' + txt(r.p)));
      s.appendChild(g);
    });
    // x labels: the values when they fit side by side
    const labW = str => str.length * 7 + 8;
    let right = -Infinity;
    const lastK = xs.length - 1;
    const txs = xs.map(v => Lab.fmtVal(v));
    const lastLeft = X(xs[lastK]) - labW(txs[lastK]) / 2;
    xs.forEach((v, k) => {
      const x = X(v), w = labW(txs[k]);
      if (x - w / 2 < right) return;
      if (k < lastK && k > 0 && x + w / 2 > lastLeft) return;
      right = x + w / 2;
      s.appendChild(svg('text', { x, y: base + 16, 'text-anchor': 'middle', class: 'w3v-tick' }, txs[k]));
    });
    // μ
    s.appendChild(svg('line', { x1: X(mu), x2: X(mu), y1: pt - 18, y2: base + 4, class: 'w3v-mu' }));
    const sgn = (v, dp) => (Math.abs(+Lab.fmtDec(v, dp) - v) < 1e-12 ? ' = ' : ' ≈ ');
    const muLab = 'μ' + sgn(mu, 4) + Lab.fmtDec(mu, 4).replace(/^-/, '−');
    const clampX = (x, w) => Math.max(pl + w / 2, Math.min(W - pr - w / 2, x));
    s.appendChild(svg('text', { x: clampX(X(mu), labW(muLab)), y: pt - 22, 'text-anchor': 'middle', class: 'w3v-mulab' }, muLab));
    // the band μ ± σ, as a bracket under the axis
    const yb = base + 30;
    if (sd > 0) {
      s.appendChild(svg('path', { d: 'M' + b1 + ',' + (yb - 6) + 'V' + yb + 'H' + b2 + 'V' + (yb - 6), class: 'w3v-brk' }));
      const f2 = v => Lab.fmtDec(v, 2).replace(/^-/, '−');
      const lab = 'μ − σ' + sgn(mu - sd, 2) + f2(mu - sd) + '   to   μ + σ' + sgn(mu + sd, 2) + f2(mu + sd);
      const short = f2(mu - sd) + ' to ' + f2(mu + sd) + '  (μ ± σ)';
      const t = labW(lab) * 0.92 < W - pl - pr ? lab : short;
      s.appendChild(svg('text', { x: clampX((b1 + b2) / 2, labW(t) * 0.92), y: yb + 18, 'text-anchor': 'middle', class: 'w3v-brklab' }, t));
    } else {
      s.appendChild(svg('text', { x: clampX(X(mu), 160), y: yb + 12, 'text-anchor': 'middle', class: 'w3v-brklab' }, 'σ = 0: no spread at all'));
    }
    return s;
  }

  /* ========================================================================= presets */
  const cus = (vals, probs) => ({ fam: 'custom', custom: { vals: vals.map(String), probs } });
  const uni = (a, b) => ({ fam: 'uniform', q: { a, b } });
  const ber = p => ({ fam: 'bernoulli', q: { p } });
  const bin = (n, p) => ({ fam: 'binomial', q: { n, p } });
  const geo = (p, k) => ({ fam: 'geometric', q: { p, [SHOW]: k || 10 } });
  const poi = (l, k) => ({ fam: 'poisson', q: { [LAM]: l, [SHOW]: k || 12 } });
  // L3.5 joint tables: rows are the values of Y, columns the values of X (as on the slides)
  const T_IND = () => ({ xs: ['0', '1'], ys: ['0', '1'], cells: [['1/4', '1/4'], ['1/4', '1/4']] });
  const T_DET = () => ({ xs: ['0', '1'], ys: ['0', '1'], cells: [['0', '1/2'], ['1/2', '0']] });
  const T_COV = () => ({ xs: ['-1', '0', '1'], ys: ['-1', '0', '1'], cells: [['1/15', '2/15', '2/15'], ['2/15', '1/15', '2/15'], ['2/15', '2/15', '1/15']] });
  const T_UNC = () => ({ xs: ['-1', '0', '1'], ys: ['0', '1'], cells: [['1/8', '1/4', '1/8'], ['1/4', '0', '1/4']] });
  const DEF = () => ({ X: uni(1, 6), a: '10', b: '0', std: false, mode: 'indep', Y: uni(1, 6), joint: T_DET() });
  const m = (mm, ss) => mm + ss / 60;
  const PRESETS = [
    { label: 'L3.4 · Throw a die: Uniform{1, …, 6}', source: 'L3.4 ' + vl(V4, 8) + ', “Example: Throw a die”: E[X] = 3.5, Var(X) = (1 − 3.5)²·1/6 + … + (6 − 3.5)²·1/6 = 35/12 = 2.916…, SD(X) = 1.7078… With a = 10 (the lecture’s “if a is 10”, ' + vl(V4, m(12, 20)) + ') and the second die for X + Y (' + vl(V4, 23) + ').', set: {} },
    { label: 'L3.4 · X = 10 with probability 1 (a constant)', source: 'L3.4 motivation ' + vl(V4, 1) + ' and ' + vl(V4, 6) + ': E[X] = 10, Var(X) = (10 − 10)²·1 = 0, SD(X) = 0. “Variance is 0 means the random variable is a constant.”', set: { X: cus([10], ['1']) } },
    { label: 'L3.4 · 9 or 11, each with probability 1/2', source: 'L3.4 ' + vl(V4, m(6, 40)) + ': the lecture’s Y. E = 10, Var = (9 − 10)²·1/2 + (11 − 10)²·1/2 = 1, SD = 1. (The lab calls it X.)', set: { X: cus([9, 11], ['1/2', '1/2']) } },
    { label: 'L3.4 · 0 or 20, each with probability 1/2', source: 'L3.4 ' + vl(V4, m(7, 20)) + ': the lecture’s Z. Same mean 10, Var = (0 − 10)²·1/2 + (20 − 10)²·1/2 = 100, SD = 10. (The lab calls it X.)', set: { X: cus([0, 20], ['1/2', '1/2']) } },
    { label: 'L3.4 · A negative a: the SD uses |a| (a = −2, b = 7 chosen here)', source: 'L3.4 ' + vl(V4, 11) + ': “even if you were to multiply X by a negative number the standard deviation gets only multiplied by the absolute value”, and ' + vl(V4, m(11, 20)) + ': a shift does not change the variance. The slide (' + vl(V4, m(9, 40)) + ') has letters only; a = −2 and b = 7 are this lab’s.', set: { a: '-2', b: '7' } },
    { label: 'L3.4 · Standardise the die: (X − E[X])/SD(X)', source: 'L3.4 ' + vl(V4, 31) + ', theorem: (X − E[X])/SD(X) has E = 0 and Var = 1. The lecture states it with letters; the die is this lab’s choice. Here a = 1/SD(X) and b = −E[X]/SD(X).', set: { std: true } },
    { label: 'L3.4 · Bernoulli(p): E[X²] = p (p = 1/3 chosen here)', source: 'L3.4 ' + vl(V4, m(25, 40)) + ': E[X²] = 1·p = p, so Var(X) = p − p² = p(1 − p). The lecture keeps p as a letter.', set: { X: ber('1/3') } },
    { label: 'L3.4 · Binomial(n, p) as n Bernoulli trials (n = 4, p = 1/2 chosen here)', source: 'L3.4 ' + vl(V4, 27) + ': X = X₁ + … + Xₙ with Xᵢ i.i.d. Bernoulli(p), so Var(X) = Var(X₁) + … + Var(Xₙ) = np(1 − p). Letters in the lecture.', set: { X: bin(4, '1/2') } },
    { label: 'L3.4 · Geometric(p), the table’s row (p = 1/2 chosen here)', source: 'L3.4 ' + vl(V4, m(24, 20)) + ', table: Var = (1 − p)/p². The sum is left as an exercise (' + vl(V4, 29) + ').', set: { X: geo('1/2') } },
    { label: 'L3.4 · Poisson(λ): variance = mean (λ = 3 chosen here)', source: 'L3.4 ' + vl(V4, m(25, 30)) + ': “expected value λ, variance is also λ”.', set: { X: poi(3) } },
    { label: 'L3.4 · Sum of two dice (independent)', source: 'L3.4 ' + vl(V4, 23) + ': X the first die, Y the second, independent: Var(X + Y) = Var(X) + Var(Y) = 2·35/12 = 35/6 (the on-screen correction at ' + vl(V4, m(23, 40)) + ').', set: { mode: 'indep', Y: uni(1, 6) } },
    { label: 'L3.5 · Same marginals, independent table (all 1/4)', source: 'L3.5 ' + vl(V5, m(2, 20)) + ', the first table: f(x, y) = 1/4 for x, y ∈ {0, 1}. Independent, so the L3.4 rule gives Var(X + Y) = 1/4 + 1/4 = 1/2.', set: { mode: 'joint', joint: T_IND() } },
    { label: 'L3.5 · Same marginals, X decides Y (dependent)', source: 'L3.5 ' + vl(V5, m(2, 20)) + ', the second table: f(0, 1) = f(1, 0) = 1/2. Same marginals as the first, but X + Y = 1 always: Var(X + Y) = 0, not 1/4 + 1/4. The L3.4 warning (' + vl(V4, m(21, 40)) + '): “not always true if X and Y are dependent”.', set: { mode: 'joint', joint: T_DET() } },
    { label: 'L3.5 · The covariance example (fifteenths)', source: 'L3.5 ' + vl(V5, m(9, 40)) + ': X, Y ∈ {−1, 0, 1}, the table as corrected on the slide; E[X] = E[Y] = 0 and the lecture finds Cov(X, Y) = −2/15.', set: { mode: 'joint', joint: T_COV() } },
    { label: 'L3.5 · Uncorrelated but dependent (eighths)', source: 'L3.5 ' + vl(V5, 17) + ': X ∈ {−1, 0, 1}, Y ∈ {0, 1}; dependent (the 0 cell), yet E[XY] = E[X]E[Y], so Var(X + Y) = Var(X) + Var(Y) holds here anyway.', set: { mode: 'joint', joint: T_UNC() } },
  ];
  const STORE = 'lab:s2-var';

  function varLab(host) {
    const clone = o => JSON.parse(JSON.stringify(o));
    let st, ctl = {}, P = {}, good = {}, errs = {};
    const save = () => Lab.store.set(STORE, st);
    const schedule = Lab.debounce(() => draw(), 40);
    const saved = Lab.store.get(STORE, null);
    const fresh = !(saved && typeof saved === 'object' && Object.keys(saved).length);
    load(saved);
    if (fresh) st.pre = 0;   // the default values are the lecture's die (preset 0)
    build(st.pre != null ? st.pre : null);

    function load(sv) {
      st = Object.assign(DEF(), sv && typeof sv === 'object' ? clone(sv) : {});
      if (!['indep', 'joint'].includes(st.mode)) st.mode = 'indep';
      if (typeof st.a !== 'string') st.a = String(st.a == null ? '10' : st.a);
      if (typeof st.b !== 'string') st.b = String(st.b == null ? '0' : st.b);
      st.std = !!st.std;
      good = { X: null, Y: null, J: null, a: F(10), b: F(0) };
      errs = { X: '', Y: '', J: '', ab: '' };
      ['X', 'Y'].forEach(nm => {
        const r = fromSpec(st[nm], nm);
        if (r.m) good[nm] = r.m; else { st[nm] = uni(1, 6); good[nm] = fromSpec(st[nm], nm).m; }
      });
      const rj = jointFrom(st.joint);
      if (rj.J) good.J = rj.J; else { st.joint = T_DET(); good.J = jointFrom(st.joint).J; }
      readAB();
    }
    /** the learner changed something: the example menu no longer describes the values */
    function touched() {
      if (st.pre == null) return;
      st.pre = null;
      if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); }
    }
    function readAB() {
      const a = K.parseNum(st.a), b = K.parseNum(st.b);
      const bad = [];
      if (a == null) bad.push('a'); else good.a = norm(a);
      if (b == null) bad.push('b'); else good.b = norm(b);
      errs.ab = bad.length ? 'Type ' + bad.join(' and ') + ' as a number, like 2, −3, 0.5 or 1/2. The pictures still show your last valid ' + bad.join(' and ') + '.' : '';
    }

    /* -------------------------------------------------------------------- controls */
    function build(pre) {
      const { side, main } = K.layout(host, 'w3v-lab');
      ctl = {}; P = {};
      side.appendChild(K.group('Lecture examples'));
      ctl.pre = K.presets({ label: 'Load an example (L3.4, L3.5)', items: PRESETS, onPick: it => loadPreset(it) });
      side.appendChild(ctl.pre);
      if (pre != null && PRESETS[pre]) { ctl.pre.select.value = String(pre); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[pre].source); }

      side.appendChild(K.group('1 · Your X'));
      ctl.xHost = h('div', { class: 'w3v-ctl' });
      side.appendChild(ctl.xHost);
      mountPicker('X', ctl.xHost);

      side.appendChild(K.group('2 · Scale and shift: aX + b'));
      ctl.a = K.textField({ label: tex('a') + ' (multiplies ' + tex('X') + ')', value: st.a, onChange: v => { st.a = v; touched(); readAB(); paintAB(); schedule(); } });
      ctl.b = K.textField({ label: tex('b') + ' (is added)', value: st.b, onChange: v => { st.b = v; touched(); readAB(); paintAB(); schedule(); } });
      ctl.std = K.toggle({ label: 'Standardise instead: ' + tex('a=1/\\mathrm{SD}(X)') + ', ' + tex('b=-E[X]/\\mathrm{SD}(X)'), value: st.std, onChange: v => { st.std = v; touched(); paintAB(); schedule(); } });
      ctl.a.input.setAttribute('inputmode', 'text'); ctl.b.input.setAttribute('inputmode', 'text');
      ctl.abNote = K.note('These ' + tex('a') + ' and ' + tex('b') + ' scale and shift your ' + tex('X') + '. They are not the ends ' + tex('a') + ', ' + tex('b') + ' of the uniform in step 1.', 'pl-hint w3v-abnote');
      side.append(h('div', { class: 'w3v-ab' }, ctl.a, ctl.b), ctl.abNote, h('div', { class: 'pl-field' }, ctl.std));
      paintAB();

      side.appendChild(K.group('3 · A second variable for X + Y'));
      ctl.mode = Lab.seg([{ label: 'Independent Y', value: 'indep' }, { label: 'A joint table', value: 'joint' }], st.mode, v => { st.mode = v; touched(); syncMode(); schedule(); });
      side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Y independent of your X, or X and Y from one joint table?' }), ctl.mode));
      ctl.yHost = h('div', { class: 'w3v-ctl' });
      ctl.jHost = h('div', { class: 'w3v-ctl' });
      ctl.indep = h('div', { class: 'w3v-ctl' }, ctl.yHost);
      ctl.joint = h('div', { class: 'w3v-ctl' }, K.note('Values of ' + tex('X') + ' across the top, values of ' + tex('Y') + ' down the left, ' + tex('f_{XY}(x,y)') + ' in the cells (they must add up to 1). In this part the table gives both ' + tex('X') + ' and ' + tex('Y') + '; your ' + tex('X') + ' from step 1 is not used.'), ctl.jHost);
      side.append(ctl.indep, ctl.joint);
      mountPicker('Y', ctl.yHost);
      mountJoint();
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); load(null); st.pre = 0; build(0); }, 'btn ghost sm')));

      P.err = h('div', { class: 'w3v-err', hidden: true });
      P.answer = K.answer();
      P.chart = K.panel('The PMF of ' + tex('X') + ', its mean ' + tex('\\mu') + ' and the band ' + tex('\\mu\\pm\\sigma'));
      P.mean = K.panel('Step 1 · The mean ' + tex('\\mu=E[X]'));
      P.def = K.panel('Step 2 · ' + tex('\\mathrm{Var}(X)=E\\big[(X-\\mu)^2\\big]') + ', row by row');
      P.alt = K.panel('Step 3 · The other way: ' + tex('\\mathrm{Var}(X)=E[X^2]-\\big(E[X]\\big)^2') + ', and the SD');
      P.lin = K.panel('Scale and shift: ' + tex('\\mathrm{Var}(aX+b)=a^2\\,\\mathrm{Var}(X)'));
      P.known = K.panel('Variances of the standard distributions (the L3.4 table)');
      P.sum = K.panel('Two variables: ' + tex('\\mathrm{Var}(X+Y)'));
      main.append(P.err, P.answer, P.chart, P.mean, P.def, P.alt, P.lin, P.known, P.sum);
      syncMode();
      draw();
    }
    function mountPicker(nm, hostEl) {
      Lab.clear(hostEl);
      const s = st[nm];
      const params = {};
      if (s.fam !== 'custom' && s.q) params[s.fam] = Object.assign({}, s.q);
      const custom = s.custom ? { vals: s.custom.vals.slice(), probs: s.custom.probs.slice() } : undefined;
      hostEl.appendChild(K.distPicker({ label: 'Distribution of ' + tex(nm), families: ['uniform', 'bernoulli', 'binomial', 'geometric', 'poisson', 'custom'], value: s.fam, params, custom, xName: nm, onChange: r => onPick(nm, r) }));
    }
    function onPick(nm, r) {
      if (!r.fam && !r.ok) {
        errs[nm] = 'The PMF of ' + nm + ' is not valid yet (see the message under it). The pictures still show your last valid ' + nm + '.';
        schedule();
        return;
      }
      const spec = specFromPick(r);
      const s = st[nm];
      if (JSON.stringify(spec) !== JSON.stringify(s.fam === 'custom' ? { fam: 'custom', custom: s.custom } : { fam: s.fam, q: s.q })) touched();
      s.fam = spec.fam;
      if (spec.fam === 'custom') { s.custom = spec.custom; delete s.q; } else { s.q = spec.q; }
      const res = fromSpec(s, nm);
      if (res.m) { good[nm] = res.m; errs[nm] = ''; } else errs[nm] = res.err + ' The pictures still show your last valid ' + nm + '.';
      if (nm === 'X') paintAB();
      schedule();
    }
    function mountJoint() {
      Lab.clear(ctl.jHost);
      const j = st.joint;
      ctl.grid = K.gridEditor({ label: 'Joint PMF ' + tex('f_{XY}(x,y)'), xs: j.xs, ys: j.ys, cells: j.cells, xName: 'X', yName: 'Y', onChange: onJoint });
      ctl.jHost.appendChild(ctl.grid);
    }
    function onJoint(r) {
      if (!r.ok) {
        errs.J = (r.total && !r.total.eq(1) ? 'The cells of the joint table add up to ' + txt(r.total) + ', not 1.' : 'Fix the red boxes in the joint table.') + ' The pictures still show your last valid table.';
        schedule();
        return;
      }
      const j = { xs: r.xs.map(String), ys: r.ys.map(String), cells: r.cells.map(row => row.map(c => String(c))) };
      if (JSON.stringify(j) !== JSON.stringify(st.joint)) touched();
      const res = jointFrom(j);
      if (res.J) { good.J = res.J; errs.J = ''; st.joint = j; } else errs.J = res.err + ' The pictures still show your last valid table.';
      schedule();
    }
    function loadPreset(it) {
      const k = PRESETS.indexOf(it);
      st = Object.assign(DEF(), clone(it.set));
      st.pre = k;
      load(st);
      build(k);
    }
    function syncMode() {
      const ind = st.mode === 'indep';
      ctl.indep.hidden = !ind;
      ctl.joint.hidden = ind;
    }
    /** a and b actually used: typed, or the standardising pair */
    function abNow() {
      if (!st.std) return { a: good.a, b: good.b, std: false };
      const M = moments(good.X);
      if (isZero(M.sd)) return { a: good.a, b: good.b, std: false, stdFail: true };
      const a = div(F(1), M.sd);
      return { a, b: neg(mul(M.mu, a)), std: true, M };
    }
    function paintAB() {
      if (!ctl.a) return;
      ctl.a.input.disabled = ctl.b.input.disabled = st.std;
      ctl.abNote.hidden = !(good.X && good.X.fam === 'uniform');
      const bad = s => K.parseNum(s) == null;
      ctl.a.input.classList.toggle('bad', !st.std && bad(st.a));
      ctl.b.input.classList.toggle('bad', !st.std && bad(st.b));
      if (st.std && good.X) {
        const r = abNow();
        if (r.stdFail) { ctl.a.hint('<span class="cbad">SD(X) = 0: a constant cannot be standardised (it would divide by 0). Using your typed a and b.</span>'); ctl.b.hint(''); return; }
        ctl.a.hint(tex('a=\\frac{1}{\\mathrm{SD}(X)}=\\frac{1}{' + sdTex(r.M.sd, r.M.v) + '}' + rel(r.a)));
        ctl.b.hint(tex('b=-\\frac{E[X]}{\\mathrm{SD}(X)}=-\\frac{' + txV(r.M.mu) + '}{' + sdTex(r.M.sd, r.M.v) + '}' + rel(r.b)));
        return;
      }
      const show = (f, s) => { const v = K.parseNum(s); if (v == null) return '<span class="cbad">Not a number yet (e.g. 2, −3, 0.5, 1/2).</span>'; const n = norm(v); return tex(f + (isEx(n) && n.d !== 1 && !shortDec(n) ? '=' + n.tex() + '\\approx ' + dec(n) : '=' + txV(n))); };
      ctl.a.hint(show('a', st.a));
      ctl.b.hint(show('b', st.b));
    }

    /* ------------------------------------------------------------------------ drawing */
    function draw() {
      save();
      paintErrors();
      const MX = good.X;
      if (!MX) return;
      const M = moments(MX);
      drawAnswer(MX, M); drawChart(MX, M); drawMean(MX, M); drawDef(MX, M); drawAlt(MX, M); drawLin(MX, M); drawKnown(MX, M); drawSum(MX, M);
    }
    function paintErrors() {
      const list = [errs.X, errs.ab, st.mode === 'joint' ? errs.J : errs.Y].filter(Boolean);
      P.err.hidden = !list.length;
      Lab.setHTML(P.err, list.map(m2 => '<div>' + Lab.esc(m2) + '</div>').join(''));
    }
    const nameOf = m0 => (m0.fam === 'custom' ? 'your PMF' : tex(m0.nm + '\\sim ' + m0.tex));

    function drawAnswer(MX, M) {
      const ev = 'Your ' + (MX.fam === 'custom' ? tex('X') + ' (your PMF, ' + plural(MX.rows.length, 'value') + ')' : tex('X\\sim ' + MX.tex)) + '. Its mean is ' + tex('\\mu=E[X]' + rel(M.mu)) + '.';
      const big = '\\begin{aligned}\\mathrm{Var}(X)&' + rel(M.v) + '\\\\ \\mathrm{SD}(X)&=\\sqrt{' + txV(M.v) + '}' + rel(M.sd) + '\\end{aligned}';
      const ok1 = same(M.var1, M.v), ok2 = same(M.var2, M.v);
      let sub = 'Both ways of L3.4 give it: ' + tex('E[(X-\\mu)^2]' + (MX.finite ? rel(M.var1) : '\\approx ' + dec(M.var1))) + (ok1 ? ' ✓' : ' ✗') + ' and ' + tex('E[X^2]-\\mu^2' + (MX.finite ? rel(M.var2) : '\\approx ' + dec(M.var2))) + (ok2 ? ' ✓' : ' ✗') + '.';
      if (!MX.finite) sub += ' (Your ' + tex('X') + ' has infinitely many values; the sums add the lab’s rows and then the rest, and the exact value is the formula of the L3.4 table.)';
      sub += ' The standard deviation is the positive square root of the variance.';
      K.setAnswer(P.answer, { ev, big, sub });
      P.answer.dataset.plain = JSON.stringify({ mu: plain(M.mu), v: plain(M.v), v1: plain(M.var1), v2: plain(M.var2), ex2: plain(M.ex2), sd: plain(M.sd) });
    }

    function drawChart(MX, M) {
      const body = P.chart.body;
      Lab.clear(body);
      P.chart.sub('Bars: ' + tex('P(X=x)') + '. Violet line: the mean ' + tex('\\mu') + ', the balance point. Shaded band: one standard deviation ' + tex('\\sigma=\\mathrm{SD}(X)') + ' either side of ' + tex('\\mu') + '. Same centre, wider band = more spread (L3.4 ' + vl(V4, 1) + ').');
      body.appendChild(spreadChart({ rows: MX.rows, mu: M.mu, sd: M.sd, name: 'X', tone: 'x', aria: 'PMF of X with the mean and the band from mu minus sigma to mu plus sigma' }));
      const lo = sub(M.mu, M.sd), hi = add(M.mu, M.sd);
      const all = MX.rows;
      const inside = all.filter(r => leq(sq(sub(r.x, M.mu)), M.v));
      const sT = sdTex(M.sd, M.v);
      let html = 'The band runs from ' + tex('\\mu-\\sigma=' + txV(M.mu) + '-' + sT + rel(lo)) + ' to ' + tex('\\mu+\\sigma=' + txV(M.mu) + '+' + sT + rel(hi)) + '. ';
      const inP = sum(inside.filter(r => !isZero(r.p)).map(r => r.p));
      const nz = inside.filter(r => !isZero(r.p));
      html += nz.length
        ? 'Values of ' + tex('X') + ' inside it (' + tex('|x-\\mu|\\le\\sigma') + '): ' + tex(nz.map(r => txV(r.x)).join(',\\allowbreak\\ ')) + ', with probability ' + tex(withRel(nz.map(r => txP(r.p)), inP)) + '.'
        : 'No value of ' + tex('X') + ' lies inside it.';
      if (!MX.finite) html += ' Drawn up to ' + tex('x=' + MX.params.k) + ' (your “shown up to k”); the bars beyond hold ' + tex('P(X\\ge ' + MX.restFrom + ')\\approx ' + dec(M.rest.mass)) + '.';
      body.appendChild(h('div', { class: 'ws-readout w3v-read', html }));
    }

    function drawMean(MX, M) {
      const body = P.mean.body;
      Lab.clear(body);
      const terms = M.rows.filter(r => !isZero(r.p)).map(r => par(txV(r.x)) + '\\cdot ' + txP(r.p));
      const steps = [{ html: 'Multiply each value by its probability and add (the expected value of L3.1):', math: '\\mu=E[X]=\\sum_{x\\in T_X}x\\,P(X=x)' }];
      if (MX.finite) {
        steps.push({ html: tex('\\mu=' + sumOut(terms) + rel(M.mu)) });
      } else {
        steps.push({ html: tex('\\mu=' + sumOut(terms) + '+\\underbrace{\\cdots}_{x\\ge ' + MX.restFrom + '}') + '. The terms for ' + tex('x\\ge ' + MX.restFrom) + ' add ' + tex('\\approx ' + dec(M.rest.xp)) + ', so the sum is ' + tex('\\approx ' + dec(M.muSum)) + '.' });
        steps.push({ html: 'The L3.4 table gives the exact value, ' + (MX.fam === 'geometric' ? tex('E[X]=\\frac{1}{p}=\\frac{1}{' + txP(MX.params.p) + '}' + rel(M.mu)) : tex('E[X]=\\lambda' + rel(M.mu))) + (same(M.muSum, M.mu) ? ' ✓ (same as the sum).' : '.') + ' The steps below use this ' + tex('\\mu') + '.' });
      }
      body.appendChild(K.steps(steps));
    }

    function devTerm(r, mu) { return '(' + txV(r.x) + '-' + par(txV(mu)) + ')^2\\cdot ' + txP(r.p); }
    function drawDef(MX, M) {
      const body = P.def.body;
      Lab.clear(body);
      const mu = M.mu;
      const rows = M.rows.map(r => ({ cls: isZero(r.p) ? 'w3v-zero' : null, cells: [tex(txV(r.x)), tex(txV(r.x) + '-' + par(txV(mu)) + '=' + txV(r.d)), tex(par(txV(r.d)) + '^2=' + txV(r.d2)), tex(txP(r.p)), tex(txV(r.d2) + '\\cdot ' + txP(r.p) + (isZero(r.t) ? '=0' : rel(r.t)))] }));
      if (M.rest) rows.push({ cls: 'w3v-rest', cells: [tex('x\\ge ' + MX.restFrom), '…', '…', tex('\\approx ' + dec(M.rest.mass)), tex('\\approx ' + dec(M.rest.t))] });
      const foot = ['', '', '', tex('\\text{total }1'), tex('\\textstyle\\sum' + (MX.finite ? rel(M.var1) : '\\approx ' + dec(M.var1)))];
      const nzRows = M.rows.filter(r => !isZero(r.p));
      const big = nzRows.length ? nzRows.reduce((b, r) => (num(r.t) > num(b.t) ? r : b), nzRows[0]) : null;
      const steps = [
        { html: 'L3.4’s definition: the variance is the expected value of the function ' + tex('(X-E[X])^2') + ' of ' + tex('X') + '. Here ' + tex('E[X]=\\mu') + ' is just a number, ' + tex('\\mu' + rel(mu)) + ' (step 1).', math: '\\begin{aligned}\\mathrm{Var}(X)&=E\\big[(X-E[X])^2\\big]\\\\&=\\sum_{x\\in T_X}(x-\\mu)^2\\,P(X=x)\\end{aligned}' },
        { html: 'One row per value ' + tex('x') + ': how far it is from ' + tex('\\mu') + ', that distance squared, its probability, and the product.', block: table([tex('x'), tex('x-\\mu'), tex('(x-\\mu)^2'), tex('P(X=x)'), tex('(x-\\mu)^2\\,P(X=x)')], rows, { foot }) },
        { html: 'Add the last column:<div class="w3v-long">' + tex('\\mathrm{Var}(X)=' + sumOut(nzRows.map(r => devTerm(r, mu))) + (M.rest ? '+\\underbrace{\\cdots}_{x\\ge ' + MX.restFrom + '}' : '')) + '</div><div class="w3v-long">' + tex('=' + sumOut(nzRows.map(r => txP(r.t))) + (M.rest ? '+' + decL(M.rest.t) : '') + (MX.finite ? rel(M.var1) : '\\approx ' + dec(M.var1))) + '</div>' + (MX.finite ? '' : '<div class="small muted">The rows for ' + tex('x\\ge ' + MX.restFrom) + ' are added by the lab until they are below ' + tex('10^{-19}') + '. The exact value from the L3.4 table is ' + tex(rel(M.v).replace(/^=/, '')) + (same(M.var1, M.v) ? ' ✓' : '') + '.</div>') },
        { html: 'Every term is a square times a probability, so it is 0 or more, and so is the variance (L3.4 ' + vl(V4, m(4, 30)) + ').' + (big && !isZero(big.t) ? ' The biggest term comes from ' + tex('x=' + txV(big.x)) + ', ' + tex(txV(absV(big.d))) + ' away from ' + tex('\\mu') + ': far values count most, on either side.' : ' All terms are 0: every value equals ' + tex('\\mu') + ', a constant, and a constant has variance 0 (L3.4 ' + vl(V4, 6) + ').') },
      ];
      body.appendChild(K.steps(steps));
    }

    function drawAlt(MX, M) {
      const body = P.alt.body;
      Lab.clear(body);
      const nzRows = M.rows.filter(r => !isZero(r.p));
      const rows = M.rows.map(r => ({ cls: isZero(r.p) ? 'w3v-zero' : null, cells: [tex(txV(r.x)), tex(par(txV(r.x)) + '^2=' + txV(r.x2)), tex(txP(r.p)), tex(txV(r.x2) + '\\cdot ' + txP(r.p) + (isZero(r.t2) ? '=0' : rel(r.t2)))] }));
      if (M.rest) rows.push({ cls: 'w3v-rest', cells: [tex('x\\ge ' + MX.restFrom), '…', tex('\\approx ' + dec(M.rest.mass)), tex('\\approx ' + dec(M.rest.t2))] });
      const ex2Line = 'E[X^2]=' + sumOut(nzRows.map(r => par(txV(r.x)) + '^2\\cdot ' + txP(r.p))) + (M.rest ? '+\\underbrace{\\cdots}_{x\\ge ' + MX.restFrom + '}' : '');
      const ex2Num = '=' + sumOut(nzRows.map(r => txV(r.t2))) + (M.rest ? '+' + decL(M.rest.t2) : '') + (MX.finite ? rel(M.ex2) : '\\approx ' + dec(M.ex2));
      const ok = same(M.var2, M.v);
      const steps = [
        { html: 'L3.4 ' + vl(V4, m(13, 30)) + ': first the second moment ' + tex('E[X^2]') + ' (square inside the expectation), then subtract the square of the mean (square outside). They are different numbers.', math: '\\begin{aligned}\\mathrm{Var}(X)&=E[X^2]-\\big(E[X]\\big)^2,\\\\ E[X^2]&=\\sum_{x\\in T_X}x^2\\,P(X=x)\\end{aligned}' },
        { html: 'One row per value:', block: table([tex('x'), tex('x^2'), tex('P(X=x)'), tex('x^2\\,P(X=x)')], rows, { foot: ['', '', tex('\\text{total }1'), tex('\\textstyle\\sum' + (MX.finite ? rel(M.ex2) : '\\approx ' + dec(M.ex2)))] }) },
        { html: 'The second moment:<div class="w3v-long">' + tex(ex2Line) + '</div><div class="w3v-long">' + tex(ex2Num) + '</div>' },
        { html: 'Subtract ' + tex('\\mu^2=' + par(txV(M.mu)) + '^2' + rel(sq(M.mu))) + ':', math: '\\mathrm{Var}(X)=E[X^2]-\\mu^2=' + txV(M.ex2) + '-' + par(txV(sq(M.mu))) + (MX.finite ? rel(M.var2) : '\\approx ' + dec(M.var2)), note: (ok ? '<span class="cgood">Same as step 2 ✓</span>' : 'Step 2 gave ' + tex(dec(M.var1))) + (MX.finite ? '' : ' (up to the rounding of the infinite sum; the exact value is ' + tex(txV(M.v)) + ').') },
        { html: 'The standard deviation is the positive square root, in the same units as ' + tex('X') + ' (L3.4 ' + vl(V4, 4) + '):', math: '\\mathrm{SD}(X)=\\sqrt{\\mathrm{Var}(X)}=\\sqrt{' + txV(M.v) + '}' + rel(M.sd) },
      ];
      body.appendChild(K.steps(steps));
    }

    /* ------------------------------------------------------------------ aX + b */
    function drawLin(MX, M) {
      const body = P.lin.body;
      Lab.clear(body);
      const AB = abNow(), a = AB.a, b = AB.b, std = AB.std;
      const aT = txV(a), bT = txV(b), muT = txV(M.mu), sT = sdTex(M.sd, M.v);
      const mapRow = r => ({ x: add(mul(a, r.x), b), p: r.p, from: r.x });
      const wRowsRaw = MX.rows.map(mapRow);
      const wRows = mergeRows(wRowsRaw);
      const wRest = MX.rest.map(mapRow);
      // E[aX + b] = aE[X] + b (L3.2): exact, and 0 when standardising
      const ruleMu = std ? F(0) : add(mul(a, M.mu), b);
      const WM = moments(model('W', 'lin', wRows, { rest: wRest, finite: MX.finite, muF: ruleMu }));
      const ruleV = std ? F(1) : mul(sq(a), M.v), ruleSD = std ? F(1) : mul(absV(a), M.sd);
      // the sums below are exact only when every value and probability of W is
      const exactW = MX.finite && wRows.every(r => isEx(norm(r.x)) && isEx(norm(r.p)));
      const r1 = v => (exactW ? rel(v) : '\\approx ' + dec(v));
      P.lin.sub('Call the new variable ' + tex('W=aX+b') + '. When ' + tex('X=x') + ', ' + tex('W=ax+b') + ', with the same probability. L3.4 ' + vl(V4, m(9, 40)) + ': ' + tex('\\mathrm{Var}(aX)=a^2\\mathrm{Var}(X)') + ', ' + tex('\\mathrm{SD}(aX)=|a|\\,\\mathrm{SD}(X)') + ', and a shift changes nothing: ' + tex('\\mathrm{Var}(X+b)=\\mathrm{Var}(X)') + '.');
      const head = std
        ? 'You chose to standardise (L3.4 ' + vl(V4, 30) + '): ' + tex('W=\\frac{X-E[X]}{\\mathrm{SD}(X)}=\\frac{X-' + par(muT) + '}{' + sT + '}') + ', that is ' + tex('a=\\frac{1}{' + sT + '}' + rel(a)) + ' and ' + tex('b=-\\frac{' + muT + '}{' + sT + '}' + rel(b)) + '.'
        : 'Your ' + tex('a=' + aT) + ' and ' + tex('b=' + bT) + '.';
      const wCell = (r, i) => std
        ? tex('\\frac{' + txV(r.x) + '-' + par(muT) + '}{' + sT + '}' + rel(wRowsRaw[i].x))
        : tex(par(aT) + '\\cdot ' + par(txV(r.x)) + '+' + par(bT) + rel(wRowsRaw[i].x));
      const tRows = MX.rows.map((r, i) => ({ cls: isZero(r.p) ? 'w3v-zero' : null, cells: [tex(txV(r.x)), tex(txP(r.p)), wCell(r, i)] }));
      if (MX.rest.length) tRows.push({ cls: 'w3v-rest', cells: [tex('x\\ge ' + MX.restFrom), tex('\\approx ' + dec(M.rest.mass)), '…'] });
      const steps = [{ html: head + ' The values move; the probabilities stay:', block: table([tex('x'), tex('P(X=x)'), std ? tex('w=\\frac{x-\\mu}{\\sigma}') : tex('w=ax+b')], tRows) }];
      if (wRows.length < MX.rows.length) steps.push({ html: 'With ' + tex('a=0') + ' every value goes to ' + tex('b=' + bT) + ': ' + tex('W') + ' is the constant ' + tex(bT) + ' with probability 1.' });
      body.appendChild(K.steps(steps));
      const chartBox = h('div', { class: 'w3v-sub' });
      chartBox.appendChild(h('div', { class: 'ws-title', html: 'The PMF of ' + tex('W=aX+b') + ' (teal), its mean and ' + tex('\\mu_W\\pm\\sigma_W') }));
      chartBox.appendChild(spreadChart({ rows: wRows, mu: WM.mu, sd: WM.sd, name: 'W', tone: 'z', aria: 'PMF of W = aX + b with its mean and one standard deviation either side' }));
      body.appendChild(chartBox);
      const nz = WM.rows.filter(r => !isZero(r.p));
      const restU = WM.rest ? '+\\underbrace{\\cdots}_{\\text{rest}}' : '';
      const muWT = txV(WM.mu);
      const checkMu = std
        ? tex('E[W]=\\frac{E[X]-' + par(muT) + '}{' + sT + '}=0')
        : tex('a\\mu+b=' + par(aT) + '\\cdot ' + par(muT) + '+' + par(bT) + rel(ruleMu));
      const s2 = [
        { html: 'The mean of ' + tex('W') + ', from its own PMF:<div class="w3v-long">' + tex('E[W]=' + sumOut(nz.map(r => par(txV(r.x)) + '\\cdot ' + txP(r.p))) + restU + r1(WM.muSum)) + '</div>', note: 'Check: ' + checkMu + (same(WM.muSum, ruleMu, 1e-9) || Math.abs(num(WM.muSum) - num(ruleMu)) < 1e-12 ? ' <span class="cgood">✓</span>' : '') + ' (the mean moves with the values, L3.2). The steps below use ' + tex('\\mu_W=' + muWT) + '.' },
        { html: 'Way 1, ' + tex('E[(W-\\mu_W)^2]') + ' on the PMF of ' + tex('W') + ':<div class="w3v-long">' + tex('\\mathrm{Var}(W)=' + sumOut(nz.map(r => '(' + txV(r.x) + '-' + par(muWT) + ')^2\\cdot ' + txP(r.p))) + restU) + '</div><div class="w3v-long">' + tex('=' + sumOut(nz.map(r => txP(r.t))) + (WM.rest ? '+' + decL(WM.rest.t) : '') + r1(WM.var1)) + '</div>' },
        { html: 'Way 2, ' + tex('E[W^2]-\\mu_W^2') + ':<div class="w3v-long">' + tex('E[W^2]=' + sumOut(nz.map(r => par(txV(r.x)) + '^2\\cdot ' + txP(r.p))) + restU + r1(WM.ex2)) + '</div><div class="w3v-long">' + tex('\\mathrm{Var}(W)=' + (exactW ? txV(WM.ex2) : decL(WM.ex2)) + '-' + par(muWT) + '^2' + r1(WM.var2)) + '</div>' },
        { html: 'The rule of L3.4, from ' + tex('\\mathrm{Var}(X)') + ' alone (' + tex('b') + ' plays no part):', math: std ? 'a^2\\,\\mathrm{Var}(X)=\\frac{1}{\\mathrm{SD}(X)^2}\\cdot\\mathrm{Var}(X)=\\frac{' + txV(M.v) + '}{' + txV(M.v) + '}=1' : 'a^2\\,\\mathrm{Var}(X)=' + par(aT) + '^2\\cdot ' + txV(M.v) + rel(ruleV), note: (same(WM.var1, ruleV, 1e-8) && same(WM.var2, ruleV, 1e-7) ? '<span class="cgood">Both ways on the PMF of ' + tex('W') + ' give the same ✓</span>' : 'The PMF of ' + tex('W') + ' gives ' + tex(dec(WM.var1))) + (std ? ' — and it is 1: ' + tex('W') + ' is standardised (' + tex('E[W]=0') + ', ' + tex('\\mathrm{Var}(W)=1') + ').' : '') },
        { html: 'The standard deviation:', math: '\\mathrm{SD}(W)=\\sqrt{\\mathrm{Var}(W)}' + (isEx(norm(WM.v)) ? '=\\sqrt{' + txV(WM.v) + '}' : '') + r1(WM.sd) + ',\\qquad |a|\\,\\mathrm{SD}(X)=' + (std ? '\\frac{1}{' + sT + '}\\cdot ' + sT + '=1' : txV(absV(a)) + '\\cdot ' + sT + rel(ruleSD)), note: (same(WM.sd, ruleSD, 1e-7) ? '<span class="cgood">Same ✓</span> ' : '') + (num(a) < 0 ? 'Your ' + tex('a') + ' is negative: the PMF is flipped left to right, but the spread uses ' + tex('|a|=' + txV(absV(a))) + '.' : num(a) === 0 ? 'With ' + tex('a=0') + ' there is no spread left.' : Math.abs(num(a)) > 1 ? tex('|a|>1') + ' stretches the PMF: more spread.' : Math.abs(num(a)) < 1 ? tex('|a|') + ' below 1 squeezes the PMF: less spread.' : tex('|a|=1') + ': same spread.') },
      ];
      body.appendChild(K.steps(s2));
      P.lin.dataset.plain = JSON.stringify({ a: plain(a), b: plain(b), mu: plain(WM.muSum), v1: plain(WM.var1), v2: plain(WM.var2), rule: plain(ruleV), sd: plain(WM.sd), sdRule: plain(ruleSD) });
    }

    /* ------------------------------------------------------- the lecture's table */
    function drawKnown(MX, M) {
      const body = P.known.body;
      Lab.clear(body);
      const rowsDef = [
        ['bernoulli', '\\text{Bernoulli}(p)', 'p', 'p(1-p)'],
        ['binomial', '\\text{Binomial}(n,p)', 'np', 'np(1-p)'],
        ['geometric', '\\text{Geometric}(p)', '1/p', '(1-p)/p^2'],
        ['poisson', '\\text{Poisson}(\\lambda)', '\\lambda', '\\lambda'],
        ['uniform', '\\text{Uniform}\\{1,\\dots,n\\}', '(n+1)/2', '(n^2-1)/12'],
      ];
      const pr = MX.params;
      const yours = {
        bernoulli: () => 'p(1-p)=' + txP(pr.p) + '\\cdot ' + txP(pr.q) + rel(M.v),
        binomial: () => 'np(1-p)=' + pr.n + '\\cdot ' + txP(pr.p) + '\\cdot ' + txP(pr.q) + rel(M.v),
        geometric: () => '\\frac{1-p}{p^2}=\\frac{' + txP(pr.q) + '}{' + par(txP(pr.p)) + '^2}' + rel(M.v),
        poisson: () => '\\lambda' + rel(M.v),
        uniform: () => 'n=' + pr.b + '-' + par(String(pr.a)) + '+1=' + pr.n + ',\\ \\frac{n^2-1}{12}=\\frac{' + pr.n + '^2-1}{12}' + rel(M.v),  // n = largest − smallest + 1
      };
      const rows = rowsDef.map(([f, name, e, v]) => ({ cls: f === MX.fam ? 'hl-row' : null, cells: [tex(name), tex(e), tex(v), f === MX.fam ? tex(yours[f]()) : '<span class="muted">—</span>'] }));
      body.appendChild(K.note('The lecture’s table (L3.4 ' + vl(V4, m(24, 20)) + '; “just know this by heart”). Your distribution’s row is highlighted, with your numbers.', 'pl-hint'));
      body.appendChild(table(['Distribution', 'Expected value', 'Variance', 'Your ' + tex('X')], rows));
      const steps = [];
      const cmp = 'From the PMF above (steps 2 and 3): ' + tex('\\mathrm{Var}(X)' + (MX.finite ? rel(M.var1) : '\\approx ' + dec(M.var1))) + (same(M.var1, M.v) ? ' <span class="cgood">— the same as the formula ✓</span>' : '');
      if (MX.fam === 'bernoulli') {
        steps.push({ html: 'How the lecture gets it (' + vl(V4, m(25, 40)) + '): ' + tex('X') + ' is 0 or 1, so ' + tex('X^2=X') + ' and the second moment is easy:', math: 'E[X^2]=0^2\\cdot(1-p)+1^2\\cdot p=p=' + txP(pr.p) });
        steps.push({ html: 'Then the other formula:', math: '\\mathrm{Var}(X)=E[X^2]-(E[X])^2=p-p^2=' + txP(pr.p) + '-' + par(txP(pr.p)) + '^2' + rel(M.v) });
      } else if (MX.fam === 'binomial') {
        steps.push({ html: 'How the lecture gets it (' + vl(V4, 27) + '): ' + tex('X=X_1+\\dots+X_n') + ' with ' + tex('X_i') + ' i.i.d. Bernoulli(' + tex('p') + '). They are independent, so the variances add (the rule in the last panel):', math: '\\mathrm{Var}(X)=\\mathrm{Var}(X_1)+\\dots+\\mathrm{Var}(X_{' + pr.n + '})=' + pr.n + '\\cdot p(1-p)=' + pr.n + '\\cdot ' + txP(pr.p) + '\\cdot ' + txP(pr.q) + rel(M.v) });
        steps.push({ html: 'And in reverse (' + vl(V4, m(28, 30)) + '): the hard sum ' + tex('E[X^2]=\\sum_k k^2\\binom{n}{k}p^k(1-p)^{n-k}') + ' comes for free:', math: 'E[X^2]=\\mathrm{Var}(X)+(E[X])^2=' + txV(M.v) + '+' + par(txV(M.mu)) + '^2' + rel(add(M.v, sq(M.mu))) });
      } else if (MX.fam === 'geometric' || MX.fam === 'poisson') {
        steps.push({ html: 'The lecture leaves this sum as an exercise (' + vl(V4, 29) + '). The lab adds the series instead: the rows of step 2 up to ' + tex('x=' + pr.k) + ', then the rest until the terms are below ' + tex('10^{-19}') + '.' });
      } else if (MX.fam === 'uniform') {
        steps.push({ html: 'The lecture’s row is for ' + tex('\\{1,\\dots,n\\}') + '. ' + (pr.a === 1 ? 'Yours starts at 1, so it is that row with ' + tex('n=' + pr.n) + '.' : 'Yours, ' + tex('\\{' + setTex(pr.a, pr.b) + '\\}') + ', is ' + tex('\\{1,\\dots,' + pr.n + '\\}') + ' shifted by ' + tex(String(pr.a - 1)) + ', and a shift does not change the variance (L3.4 ' + vl(V4, m(11, 20)) + '), so the row still applies, with ' + tex('n') + ' = largest − smallest + 1 ' + tex('=' + pr.b + '-' + par(String(pr.a)) + '+1=' + pr.n) + '. The mean does move: (smallest + largest)/2 ' + tex('=\\frac{' + pr.a + '+' + par(String(pr.b)) + '}{2}' + rel(M.mu)) + '.') });
      } else {
        steps.push({ html: 'Your own PMF is not one of the five named distributions, so it has no row. Pick one in “1 · Your X” to see its row and formula next to the sums.' });
      }
      if (MX.fam !== 'custom') steps.push({ html: cmp });
      body.appendChild(K.steps(steps));
      body.appendChild(K.note('L3.4 also warns (' + vl(V4, 33) + '): some random variables have no finite mean or variance, for example the values ' + tex('1,2,4,8,\\dots') + ' with probabilities ' + tex('\\tfrac12,\\tfrac14,\\tfrac18,\\dots') + ' (every term of ' + tex('E[X]') + ' is ' + tex('\\tfrac12') + '). The course, and this lab, keep to variables with a finite mean and variance.', 'pl-hint w3v-aside'));
    }

    /* ------------------------------------------------------------------ X + Y */
    function drawSum(MX, M) {
      const body = P.sum.body;
      Lab.clear(body);
      if (st.mode === 'indep') sumIndep(body, MX, M); else sumJoint(body);
    }
    function momLines(nm, m0, Mm, exactNote = true) {
      const nz = Mm.rows.filter(r => !isZero(r.p));
      const fin = m0.finite;
      const restU = Mm.rest ? '+\\underbrace{\\cdots}_{\\text{rest}}' : '';
      return '<div class="w3v-long">' + tex('E[' + nm + ']=' + sumOut(nz.map(r => par(txV(r.x)) + '\\cdot ' + txP(r.p))) + restU + (fin ? rel(Mm.muSum) : '\\approx ' + dec(Mm.muSum))) + '</div>' +
        '<div class="w3v-long">' + tex('E[' + nm + '^2]=' + sumOut(nz.map(r => par(txV(r.x)) + '^2\\cdot ' + txP(r.p))) + restU + (fin ? rel(Mm.ex2) : '\\approx ' + dec(Mm.ex2))) + '</div>' +
        '<div class="w3v-long">' + tex('\\mathrm{Var}(' + nm + ')=E[' + nm + '^2]-(E[' + nm + '])^2=' + txV(Mm.ex2) + '-' + par(txV(Mm.muSum)) + '^2' + (fin ? rel(Mm.var2) : '\\approx ' + dec(Mm.var2))) + (fin || !exactNote ? '' : ' (exact, from the L3.4 table: ' + tex(txV(Mm.v)) + ')') + '</div>';
    }
    function sumIndep(body, MX, M) {
      const MY = good.Y;
      const N = moments(MY);
      const rule = add(M.v, N.v);
      P.sum.sub('L3.4 ' + vl(V4, m(17, 20)) + ': if ' + tex('X') + ' and ' + tex('Y') + ' are <b>independent</b>, then ' + tex('E[XY]=E[X]E[Y]') + ' and ' + tex('\\mathrm{Var}(X+Y)=\\mathrm{Var}(X)+\\mathrm{Var}(Y)') + '. Here ' + tex('X') + ' is your ' + tex('X') + ' from step 1 and ' + tex('Y') + ' is independent of it.');
      // the PMF of S = X + Y by the products f_X(x) f_Y(y)
      const S = convolve(MX.rows.concat(MX.rest), MY.rows.concat(MY.rest));
      const SM = rowMoments(S);
      const finite = MX.finite && MY.finite;
      const r1 = v => (finite ? rel(v) : '\\approx ' + dec(v));
      const steps = [
        { html: 'Your ' + tex('Y\\sim ' + (MY.fam === 'custom' ? '\\text{your PMF}' : MY.tex)) + '. Its mean, second moment and variance, as in steps 1–3:' + momLines('Y', MY, N) },
        { html: 'The rule of L3.4 adds the two variances:', math: '\\mathrm{Var}(X)+\\mathrm{Var}(Y)=' + txV(M.v) + '+' + txV(N.v) + rel(rule) },
      ];
      // check on the PMF of S
      const shownS = finite ? S : S.filter(r => num(r.x) <= Math.max(...MX.rows.map(q => num(q.x))) + Math.max(...MY.rows.map(q => num(q.x))));
      const pairCell = r => (r.pairs && r.pairs.length <= 6 ? r.pairs.map(t => tex('(' + txV(t.x) + ',' + txV(t.y) + ')')).join(', ') : plural(r.n, 'pair'));
      const probCell = r => {
        if (!r.pairs) return tex(txP(r.p));
        const pr = r.pairs.map(t => txP(t.a) + '\\cdot ' + txP(t.b));
        const eq = r.pairs.length > 1 && r.pairs.every(t => same(t.p, r.pairs[0].p));
        if (r.pairs.length === 1) return tex(pr[0] + (isZero(r.p) ? '' : rel(r.p)));
        if (eq) return tex(r.pairs.length + '\\times ' + txP(r.pairs[0].p) + rel(r.p));
        return tex((r.pairs.length <= 4 ? sumOut(pr) : sumOut(r.pairs.map(t => txP(t.p)))) + rel(r.p));
      };
      const sRows = shownS.map(r => ({ cells: [tex(txV(r.x)), pairCell(r), probCell(r)] }));
      steps.push({ html: 'Check it without the rule. The PMF of ' + tex('S=X+Y') + ': add ' + tex('P(X=x)\\,P(Y=y)') + ' (independent: a product) over the pairs with ' + tex('x+y=s') + (finite ? '' : '; the table stops where the drawn parts of ' + tex('X') + ' and ' + tex('Y') + ' stop, the sums below use every value') + ':', block: table([tex('s'), 'pairs ' + tex('(x,y)'), tex('P(S=s)=\\sum P(X=x)\\,P(Y=y)')], sRows) });
      steps.push({ html: 'Then the variance of ' + tex('S') + ' from its own PMF' + (finite ? '' : ' (every value, up to where the probabilities fall below ' + tex('10^{-19}') + ')') + ':' + momLines('S', model('S', 'sum', S, { finite }), Object.assign({}, SM, { rows: S, rest: null, muSum: SM.mu, var2: SM.v }), false), note: same(SM.v, rule, 1e-8) ? '<span class="cgood">The same as ' + tex('\\mathrm{Var}(X)+\\mathrm{Var}(Y)') + ' ✓</span>' : 'The PMF of ' + tex('S') + ' gives ' + tex(dec(SM.v)) + '.' });
      steps.push({ html: 'And ' + tex('\\mathrm{SD}(X+Y)=\\sqrt{' + txV(rule) + '}' + rel(sqrtV(rule))) + ' — not ' + tex('\\mathrm{SD}(X)+\\mathrm{SD}(Y)=' + sdTex(M.sd, M.v) + '+' + sdTex(N.sd, N.v) + rel(add(M.sd, N.sd))) + ': variances add, standard deviations do not.' });
      body.appendChild(K.steps(steps));
      const cb = h('div', { class: 'w3v-sub' });
      cb.appendChild(h('div', { class: 'ws-title', html: 'The PMF of ' + tex('S=X+Y') + ' (teal), its mean and ' + tex('\\mu_S\\pm\\sigma_S') }));
      cb.appendChild(spreadChart({ rows: shownS, mu: SM.mu, sd: SM.sd, name: 'S', tone: 'z', aria: 'PMF of S = X + Y with its mean and one standard deviation either side' }));
      body.appendChild(cb);
      P.sum.dataset.plain = JSON.stringify({ vx: plain(M.v), vy: plain(N.v), rule: plain(rule), vs: plain(SM.v), es: plain(SM.mu) });
    }
    function sumJoint(body) {
      const J = good.J;
      const xs = J.xs, ys = J.ys;
      const fx = xs.map((_, i) => sum(J.p[i]));
      const fy = ys.map((_, k) => sum(J.p.map(col => col[k])));
      const mX = model('X', 'custom', xs.map((x, i) => ({ x, p: fx[i] }))), mY = model('Y', 'custom', ys.map((y, k) => ({ x: y, p: fy[k] })));
      const A = moments(mX), B = moments(mY);
      const rule = add(A.v, B.v);
      const pairs = [];
      xs.forEach((x, i) => ys.forEach((y, k) => pairs.push({ x, y, p: J.p[i][k] })));
      const S = sumPmf(pairs);
      const SM = rowMoments(S);
      let bad = null;
      xs.forEach((x, i) => ys.forEach((y, k) => { if (!bad && !same(J.p[i][k], mul(fx[i], fy[k]))) bad = { i, k }; }));
      const exy = sum(pairs.map(t => mul(mul(t.x, t.y), t.p)));
      const cross = sub(exy, mul(A.mu, B.mu));
      P.sum.sub('L3.4 ' + vl(V4, m(17, 20)) + ': ' + tex('\\mathrm{Var}(X+Y)=\\mathrm{Var}(X)+\\mathrm{Var}(Y)') + ' needs <b>independent</b> ' + tex('X') + ' and ' + tex('Y') + '; “not always true if X and Y are dependent” (' + vl(V4, m(21, 40)) + '). Here both come from your joint table.');
      const ml = l => '<div class="w3v-long">' + tex(l) + '</div>';
      const fxT = xs.map((x, i) => 'f_X(' + txV(x) + ')=' + sumOut(J.p[i].map(txP)) + '=' + txP(fx[i]));
      const fyT = ys.map((y, k) => 'f_Y(' + txV(y) + ')=' + sumOut(J.p.map(col => txP(col[k]))) + '=' + txP(fy[k]));
      const steps = [
        { html: 'The marginals: add each column (for ' + tex('X') + ') and each row (for ' + tex('Y') + ') of your table:' + ml(fxT.join(',\\allowbreak\\quad ')) + ml(fyT.join(',\\allowbreak\\quad ')) },
        { html: 'The variance of each, the second way (step 3):' + ml('\\mathrm{Var}(X)=E[X^2]-(E[X])^2=' + txV(A.ex2) + '-' + par(txV(A.mu)) + '^2' + rel(A.v)) + ml('\\mathrm{Var}(Y)=E[Y^2]-(E[Y])^2=' + txV(B.ex2) + '-' + par(txV(B.mu)) + '^2' + rel(B.v)) + ml('\\mathrm{Var}(X)+\\mathrm{Var}(Y)=' + txV(A.v) + '+' + txV(B.v) + rel(rule)) },
      ];
      if (!bad) steps.push({ html: '<b>Independent?</b> Yes: every cell equals ' + tex('f_X(x)\\,f_Y(y)') + ' (for example ' + tex('f_{XY}(' + txV(xs[0]) + ',' + txV(ys[0]) + ')=' + txP(J.p[0][0]) + '=' + txP(fx[0]) + '\\cdot ' + txP(fy[0])) + '). So the rule of L3.4 applies.' });
      else {
        const i = bad.i, k = bad.k;
        steps.push({ html: '<b>Independent?</b> No: ' + tex('f_{XY}(' + txV(xs[i]) + ',' + txV(ys[k]) + ')=' + txP(J.p[i][k])) + ', but ' + tex('f_X(' + txV(xs[i]) + ')\\,f_Y(' + txV(ys[k]) + ')=' + txP(fx[i]) + '\\cdot ' + txP(fy[k]) + '=' + txP(mul(fx[i], fy[k]))) + '. The rule of L3.4 is not promised here.' });
      }
      const sRows = S.map(r => ({ cells: [tex(txV(r.x)), r.pairs.map(t => tex('(' + txV(t.x) + ',' + txV(t.y) + ')')).join(', '), tex(r.pairs.length > 1 ? sumOut(r.pairs.map(t => txP(t.p))) + '=' + txP(r.p) : txP(r.p))] }));
      steps.push({ html: 'Now ' + tex('\\mathrm{Var}(X+Y)') + ' directly. The PMF of ' + tex('S=X+Y') + ': add the cells of your table with ' + tex('x+y=s') + ' (no independence needed for this):', block: table([tex('s'), 'cells ' + tex('(x,y)'), tex('P(S=s)')], sRows) });
      const sm = model('S', 'sum', S, { finite: true });
      const SMx = moments(sm);
      steps.push({ html: 'Its variance:' + momLines('S', sm, SMx) });
      const equal = same(SM.v, rule);
      steps.push({ html: equal ? '<span class="cgood">' + tex('\\mathrm{Var}(X+Y)=' + txV(SM.v)) + ' and ' + tex('\\mathrm{Var}(X)+\\mathrm{Var}(Y)=' + txV(rule)) + ' agree ✓</span>' + (bad ? ' — even though your ' + tex('X') + ' and ' + tex('Y') + ' are dependent. The lecture allows this: “even if X and Y are not independent something like this can happen in some situations” (L3.4 ' + vl(V4, m(20, 30)) + '). The next step shows why.' : '') : '<span class="cbad">' + tex('\\mathrm{Var}(X+Y)=' + txV(SM.v) + '\\ne ' + txV(rule) + '=\\mathrm{Var}(X)+\\mathrm{Var}(Y)') + '</span>. The rule fails for your dependent ' + tex('X') + ' and ' + tex('Y') + ', as L3.4 warns.' });
      const exyT = pairs.filter(t => !isZero(t.p) && !isZero(t.x) && !isZero(t.y)).map(t => par(txV(t.x)) + '\\cdot ' + par(txV(t.y)) + '\\cdot ' + txP(t.p));
      steps.push({ html: 'Where the difference comes from — the lecture’s hint for its exercise (' + vl(V4, 22) + '): square out ' + tex('\\big((X-E[X])+(Y-E[Y])\\big)^2') + ' and take expectations. The cross terms leave ' + tex('2\\big(E[XY]-E[X]E[Y]\\big)') + ', which L3.5 calls ' + tex('2\\,\\mathrm{Cov}(X,Y)') + ':' + ml('E[XY]=\\sum x\\,y\\,f_{XY}(x,y)=' + (exyT.length ? sumOut(exyT) : '0') + rel(exy)) + '<div class="small muted">(cells with ' + tex('x=0') + ' or ' + tex('y=0') + ' add 0)</div>' + ml('E[XY]-E[X]E[Y]=' + txV(exy) + '-' + par(txV(A.mu)) + '\\cdot ' + par(txV(B.mu)) + rel(cross)) + ml('\\mathrm{Var}(X)+\\mathrm{Var}(Y)+2\\big(E[XY]-E[X]E[Y]\\big)=' + txV(A.v) + '+' + txV(B.v) + '+2\\cdot ' + par(txV(cross)) + rel(add(rule, mul(F(2), cross)))), note: (same(add(rule, mul(F(2), cross)), SM.v) ? '<span class="cgood">= ' + tex('\\mathrm{Var}(X+Y)') + ' from the PMF of ' + tex('S') + ' ✓</span> ' : '') + (isZero(cross) ? 'Here ' + tex('E[XY]=E[X]E[Y]') + ', so the extra term is 0' + (bad ? ' although the table is dependent (L3.5: uncorrelated but dependent).' : ' (independence gives ' + tex('E[XY]=E[X]E[Y]') + ', L3.4 ' + vl(V4, m(17, 20)) + ').') : 'Here ' + tex('E[XY]\\ne E[X]E[Y]') + ', so the extra term is not 0.') });
      body.appendChild(K.steps(steps));
      const cb = h('div', { class: 'w3v-sub' });
      cb.appendChild(h('div', { class: 'ws-title', html: 'The PMF of ' + tex('S=X+Y') + ' from your table (teal), its mean and ' + tex('\\mu_S\\pm\\sigma_S') }));
      cb.appendChild(spreadChart({ rows: S.length ? S : [{ x: F(0), p: F(1) }], mu: SM.mu, sd: SM.sd, name: 'S', tone: 'z', aria: 'PMF of S = X + Y from the joint table' }));
      body.appendChild(cb);
      P.sum.dataset.plain = JSON.stringify({ vx: plain(A.v), vy: plain(B.v), rule: plain(rule), vs: plain(SM.v), es: plain(SM.mu), exy: plain(exy), cross: plain(cross), indep: !bad });
    }
  }

  Lab.lab({
    id: 'lab-s2-var', course: 's2', week: 3, order: 2,
    title: 'Variance and standard deviation lab', sub: 'Week 3 · L3.4',
    topics: ['variance', 'standard deviation', 'E[(X − μ)²]', 'E[X²] − μ²', 'μ ± σ', 'Var(aX + b)', 'standardising', 'variances of standard distributions', 'Var(X + Y)', 'independent vs dependent'],
    desc: 'Choose X (uniform, Bernoulli, binomial, geometric, Poisson or your own PMF). See μ, then Var(X) both ways the lecture shows — E[(X − μ)²] row by row and E[X²] − μ² — and SD = √Var, the PMF with μ ± σ, Var(aX + b) = a²Var(X) checked on the new PMF, the lecture’s table of variances, and Var(X + Y) for independent Y or a joint table of your own.',
    render: host => varLab(host),
  });
})();
