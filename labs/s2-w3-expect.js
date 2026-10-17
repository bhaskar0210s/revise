/* Playground lab (s2-w3-expect): Expected value lab, Statistics II, Week 3, lectures L3.1–L3.3.
   Every value is the learner's and every panel redraws at once.
   1 · E[X] = Σ t·f_X(t) for the learner's X (kit distPicker: uniform, Bernoulli, binomial, geometric, Poisson, own PMF),
       written out term by term with exact fractions; the PMF as a stem plot (as on the L3.1 slide "PMF and expected
       value") with E[X] as the balance point (left pull = right pull), and the CDF.
   2 · E[g(X)] for a typed g(x): the PMF of g(X) first (table method), then Σ g(t)·f_X(t) directly (L3.2), next to g(E[X]).
   3 · E[aX + b] = aE[X] + b, both ways, with the PMF of aX + b and a "make it zero-mean" button (L3.2).
   4 · Two random variables (a joint table, or two independent distributions): E[X + Y] = E[X] + E[Y], E[XY] against
       E[X]E[Y] (equal when independent, L3.5), and E[g(X, Y)] both ways (L3.2).
   5 · Simulation (L3.3): n draws at a time; the running average settles at E[X].
   Self-contained: only the lab kit (Lab.play), Lab.F, Lab.expr and Lab.vlink. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const Frac = Lab.Frac;
  const STORE = 'lab:s2-expect';
  const VID = { 'L3.1': '7FrGkXw0OKQ', 'L3.2': 'r1-n85hdJUw', 'L3.3': 'hUidLbV0fNo', 'L3.5': 'UoZc81wNK4I' };
  const mm = (m, s) => m + s / 60;
  /** "L3.1 ▶ 12:40" — a link into the lecture at that minute */
  const at = (lec, m, s = 0) => lec + ' ' + Lab.vlink(VID[lec], mm(m, s));
  const tex = (s, d) => Lab.tex(String(s), d);

  /* ================================================================ exact arithmetic */
  const SAFE = Number.MAX_SAFE_INTEGER;
  const okN = x => Math.abs(x) <= SAFE;
  const isEx = v => v instanceof Frac && !v.approx;
  const num = v => Number(v);
  /** a typed value as an exact fraction when it is one (1.4 → 7/5, 2.333… → 7/3), else a plain number. Only for inputs:
      a computed decimal is never turned into a fraction (no fake exactness). */
  function ex(v) {
    if (v instanceof Frac) return v.approx ? v.valueOf() : v;
    if (typeof v === 'number') {
      if (!isFinite(v)) return v;
      if (Number.isInteger(v)) return okN(v) ? F(v) : v;
      if (/^-?\d*\.\d{1,9}$/.test(String(v))) return Frac.fromDecimal(v);
      try { const f = Frac.fromNumber(v, 1000); return !f.approx && Math.abs(f.valueOf() - v) < 1e-13 * Math.max(1, Math.abs(v)) ? f : v; } catch (e) { return v; }
    }
    return v;
  }
  /** a computed value: exact fractions stay exact, anything else is a plain number */
  const norm = v => (v instanceof Frac ? (v.approx ? v.valueOf() : v) : Number(v));
  function add(a, b) {
    if (isEx(a) && isEx(b)) {
      const x = a.n * b.d, y = b.n * a.d, d = a.d * b.d;
      if (okN(x) && okN(y) && okN(d) && okN(x + y)) return a.add(b);
    }
    return num(a) + num(b);
  }
  function mul(a, b) {
    if (isEx(a) && isEx(b) && okN(a.n * b.n) && okN(a.d * b.d)) return a.mul(b);
    return num(a) * num(b);
  }
  const neg = a => (isEx(a) ? a.neg() : -num(a));
  const sub = (a, b) => add(a, neg(b));
  function div(a, b) {
    if (isEx(a) && isEx(b) && b.n !== 0 && okN(a.n * b.d) && okN(a.d * b.n)) return a.div(b);
    return num(a) / num(b);
  }
  function pow(a, k) { let r = F(1); for (let i = 0; i < k; i++) r = mul(r, a); return r; }
  const sum = arr => arr.reduce((s, v) => add(s, v), F(0));
  function same(a, b) {
    if (isEx(a) && isEx(b)) return a.eq(b);
    return Math.abs(num(a) - num(b)) <= 1e-9 * Math.max(1, Math.abs(num(a)), Math.abs(num(b)));
  }
  const isZero = v => num(v) === 0;
  const range = (a, b) => { const r = []; for (let v = a; v <= b; v++) r.push(v); return r; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; };
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  function chooseN(n, k) {
    if (k < 0 || k > n) return 0;
    k = Math.min(k, n - k);
    let r = 1n;
    for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
    return Number(r);
  }

  /* ================================================================ formatting (TeX) */
  function sci(x) {
    const [m, e] = x.toExponential(2).split('e');
    return m.replace(/\.?0+$/, '') + '\\times10^{' + Number(e) + '}';
  }
  /** decimal TeX, 4 places (a rounded value keeps its places: 0.2240); tiny values in scientific form */
  function dec(v, dp = 4) {
    const x = num(v);
    if (!isFinite(x)) return '\\text{?}';
    if (x === 0) return '0';
    if (Math.abs(x) < 5e-4) return (x < 0 ? '-' : '') + sci(Math.abs(x));
    const s = Lab.fmtDec(x, dp);
    return Number(s) === x ? s : x.toFixed(dp);
  }
  /** a number inside a formula: integer, short fraction, or decimal */
  function tx(v) {
    v = norm(v);
    if (isEx(v)) {
      if (v.d === 1) return String(v.n);
      if (v.d <= 99999) return v.tex();
    }
    return dec(v);
  }
  /** "=7/2=3.5", "=1/3≈0.3333", "=6", or "≈0.2240" when the value is not exact */
  function rel(v) {
    v = norm(v);
    if (isEx(v)) {
      if (v.d === 1) return '=' + v.n;
      const d = dec(v), exact = Number(d) === v.valueOf();
      if (v.d <= 1e7) return '=' + v.tex() + (exact ? '=' : '\\approx ') + d;
      return (exact ? '=' : '\\approx ') + d;
    }
    return (Number.isInteger(v) ? '=' : '\\approx ') + dec(v);
  }
  /** true when tx(v) shows v exactly: a whole number or a short fraction (a decimal shown is rounded) */
  function shownExact(v) { v = norm(v); return isEx(v) ? v.d <= 99999 : Number.isInteger(v); }
  /** the relation after an expression built from the shown values `parts`: "=" only when every part is shown exactly */
  const relAfter = (parts, total) => (parts.every(shownExact) ? rel(total) : '\\approx ' + dec(total));
  /** a value on its own (table cells): "1/6 ≈ 0.1667", "1/2 = 0.5", "≈ 0.3602" */
  const valTex = v => { if (!shownExact(v)) return '\\approx ' + dec(v); const r = rel(v); return r[0] === '=' ? r.slice(1) : r; };
  /** TeX of a value, in brackets when it is negative (inside products) */
  const pt = v => { const s = tx(v); return s[0] === '-' ? '(' + s + ')' : s; };
  /** plain text (messages, tooltips) */
  const txt = v => { v = norm(v); return isEx(v) ? v.toString() : (num(v) !== 0 && Math.abs(num(v)) < 5e-4 ? num(v).toExponential(3) : Lab.fmtDec(num(v), 4)); };
  /** full precision (data attributes for the tests) */
  const plain = v => { v = norm(v); return isEx(v) ? v.toString() : String(num(v)); };
  /** join TeX numbers with + (a number that starts with − keeps its sign) */
  const jn = list => list.map((s, i) => (i && s[0] !== '-' ? '+' : '') + s).join('');
  /** a long list of terms: all of them when there are few, else the first and the last ones */
  function cut(list, max = 30) {
    if (list.length <= max) return list;
    return list.slice(0, 6).concat(['\\dots'], list.slice(-2));
  }
  /** TeX of aX + b with the learner's numbers: X, 2X+1, -X, X-\frac{7}{2}, 3 (when a = 0) */
  function linTex(a, b, nm = 'X') {
    const aT = isZero(a) ? '' : same(a, F(1)) ? nm : same(a, F(-1)) ? '-' + nm : pt(a) + nm;
    if (!aT) return tx(b);
    return aT + (isZero(b) ? '' : (num(b) < 0 ? '' : '+') + tx(b));
  }
  const plural = (n, w, ws) => n + ' ' + (n === 1 ? w : ws || w + 's');
  /** an axis label: short decimal with a real minus sign */
  const fmtTick = v => Lab.fmtDec(+v.toPrecision(10), 4).replace(/^-/, '−');

  /**
   * A sum written out: lhs = f1 + f2 + … = (common-denominator form) = total.
   * terms: [{f: 'TeX of the term as typed', v: value}]. Returns TeX (meant for inline maths, so it wraps on phones).
   */
  function sumTex(lhs, terms, opts = {}) {
    const total = opts.total != null ? opts.total : sum(terms.map(t => t.v));
    if (!terms.length) return lhs + '=0';
    let s = lhs + (lhs ? '=' : '') + jn(cut(terms.map(t => t.f)));
    // a factor shown as a rounded decimal: only an approximate value can follow
    if (!terms.every(t => !t.parts || t.parts.every(shownExact))) return s + '\\approx ' + dec(total);
    if (terms.length === 1 && !opts.always) return s + rel(total);
    const vs = terms.map(t => norm(t.v));
    if (vs.every(isEx)) {
      let D = 1;
      for (const v of vs) { D = lcm(D, v.d); if (D > 1e6) break; }
      if (D > 1 && D <= 1e6) {
        const nums = vs.map(v => v.n * (D / v.d));
        const S = nums.reduce((a, b) => a + b, 0);
        if (nums.every(okN) && okN(S)) {
          const top = jn(cut(nums.map(String)));
          // a long numerator cannot wrap inside \frac: write (1/D)(… + …) instead, which wraps at the + signs on phones
          s += top.length > 34 ? '=\\frac{1}{' + D + '}\\,(' + top + ')' : '=\\frac{' + top + '}{' + D + '}';
          const fr = F(S, D);
          if (fr.d !== D || fr.n !== S) s += '=\\frac{' + S + '}{' + D + '}';
          return s + rel(total);
        }
      }
      if (D === 1) {
        const ints = vs.map(v => String(v.n));
        if (terms.some((t, i) => t.f !== ints[i])) s += '=' + jn(cut(ints));
        return s + rel(total);
      }
      if (terms.length === 1) return s + rel(total);
      const all = vs.every(shownExact);
      return s + (all ? '=' : '\\approx ') + jn(cut(vs.map(tx))) + (all ? rel(total) : '\\approx ' + dec(total));
    }
    return s + '\\approx ' + jn(cut(vs.map(v => dec(v)))) + '\\approx ' + dec(total);
  }

  /* ================================================================ distributions */
  const SHOW = 'shown up to k', LAM = 'λ';
  const FAMS1 = ['uniform', 'bernoulli', 'binomial', 'geometric', 'poisson', 'custom'];
  const FAMS2 = ['uniform', 'bernoulli', 'binomial', 'custom'];
  const prob = s => (s instanceof Frac ? s : K.parseProb(String(s)));
  const int = (v, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? x : d; };
  const setTex = (lo, hi) => (hi - lo <= 3 ? range(lo, hi).join(',') : lo + ',' + (lo + 1) + ',\\dots,' + hi);
  const fS = nm => 'f_{' + nm + '}';

  /** inverse-CDF sampler over a finite list */
  function finiteSampler(vals, ps) {
    const cum = [];
    let acc = 0;
    ps.forEach(p => { acc += num(p); cum.push(acc); });
    return () => {
      const u = Math.random() * acc;
      let lo = 0, hi = cum.length - 1;
      while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] > u) hi = mid; else lo = mid + 1; }
      while (lo < cum.length - 1 && isZero(ps[lo])) lo++;
      return vals[lo];
    };
  }
  /** a distribution with finitely many values: vals (exact, ascending), ps (exact or numbers) */
  function finite(nm, vals, ps) {
    const m = { nm, finite: true, vals: vals.slice(), ps: ps.slice(), fam: 'custom' };
    m.termsMean = sum(vals.map((t, i) => mul(t, ps[i])));
    m.mean = m.termsMean;
    m.tex = '\\text{your PMF}';
    m.words = 'your PMF';
    m.sample = finiteSampler(m.vals, m.ps);
    return m;
  }
  function uniform(nm, a, b) {
    const lo = Math.min(a, b), hi = Math.max(a, b), n = hi - lo + 1;
    const m = finite(nm, range(lo, hi).map(v => F(v)), range(lo, hi).map(() => F(1, n)));
    m.fam = 'uniform';
    m.tex = '\\text{Uniform}\\{' + setTex(lo, hi) + '\\}';
    m.words = 'Uniform{' + lo + ', …, ' + hi + '}';
    m.short = { tex: 'E[' + nm + ']=\\frac{a+b}{2}=\\frac{' + lo + '+' + pt(hi) + '}{2}' + rel(m.mean), src: at('L3.1', 17, 0), name: 'Uniform{a, …, b}' };
    return m;
  }
  function bernoulli(nm, p) {
    const q = sub(F(1), p);
    const m = finite(nm, [F(0), F(1)], [q, p]);
    m.fam = 'bernoulli';
    m.tex = '\\text{Bernoulli}(' + tx(p) + ')';
    m.words = 'Bernoulli(' + txt(p) + ')';
    m.short = { tex: 'E[' + nm + ']=0\\cdot(1-p)+1\\cdot p=p=' + tx(p), src: at('L3.1', 11, 40), name: 'Bernoulli(p)' };
    return m;
  }
  function binomial(nm, n, p) {
    const q = sub(F(1), p);
    const vals = range(0, n);
    const m = finite(nm, vals.map(v => F(v)), vals.map(k => mul(F(chooseN(n, k)), mul(pow(p, k), pow(q, n - k)))));
    m.fam = 'binomial';
    m.mean = mul(F(n), p);
    m.tex = '\\text{Bin}(' + n + ',' + tx(p) + ')';
    m.words = 'Binomial(' + n + ', ' + txt(p) + ')';
    m.short = { tex: 'E[' + nm + ']=np=' + n + '\\cdot ' + tx(p) + relAfter([p], m.mean), src: at('L3.1', 29, 30) + ' (and by linearity, ' + at('L3.2', 20, 40) + ')', name: 'Binomial(n, p)' };
    return m;
  }
  function geometric(nm, p, show) {
    const q = sub(F(1), p);
    const vals = range(1, show);
    const ps = vals.map(t => mul(pow(q, t - 1), p));
    const m = { nm, finite: false, fam: 'geometric', lo: 1, show, vals: vals.map(v => F(v)), ps, p, q };
    m.mean = div(F(1), p);
    m.termsMean = sum(vals.map((t, i) => mul(F(t), ps[i])));
    m.tail = pow(q, show);                                    // P(X > k)
    m.rest = mul(pow(q, show), add(F(show), div(F(1), p)));   // Σ_{t>k} t f(t) = (1−p)^k (k + 1/p)
    m.restTex = '\\sum_{t>' + show + '}t\\,(1-p)^{t-1}p=(1-p)^{' + show + '}\\left(' + show + '+\\frac1p\\right)=\\left(' + tx(q) + '\\right)^{' + show + '}\\left(' + show + '+' + tx(div(F(1), p)) + '\\right)' + relAfter([q, div(F(1), p)], m.rest);
    m.pmfTex = fS(nm) + '(t)=(1-p)^{t-1}p=\\left(' + tx(q) + '\\right)^{t-1}\\cdot ' + tx(p) + ',\\ t=1,2,3,\\dots';
    m.infTex = 'E[' + nm + ']=\\sum_{t=1}^{\\infty}t\\,(1-p)^{t-1}p';
    m.tex = '\\text{Geometric}(' + tx(p) + ')';
    m.words = 'Geometric(' + txt(p) + ')';
    m.short = { tex: 'E[' + nm + ']=\\frac1p=\\frac{1}{' + tx(p) + '}' + relAfter([p], m.mean), src: at('L3.1', 27, 30), name: 'Geometric(p)' };
    const qn = num(q), pn = num(p);
    m.sample = () => (qn <= 0 ? F(1) : F(1 + Math.floor(Math.log(1 - Math.random()) / Math.log(qn))));
    m.f = t => (t >= 1 ? Math.pow(qn, t - 1) * pn : 0);
    m.T = qn <= 0 ? 1 : Math.min(20000, Math.ceil(Math.log(1e-18) / Math.log(qn)) + 10);
    return m;
  }
  function poisson(nm, lam, show) {
    lam = Math.round(lam * 1e6) / 1e6;
    const L = Lab.fmtDec(lam, 4);
    const lnf = [0];
    const lnFact = k => { while (lnf.length <= k) lnf.push(lnf[lnf.length - 1] + Math.log(lnf.length)); return lnf[k]; };
    const f = t => (Number.isInteger(t) && t >= 0 ? Math.exp(-lam + t * Math.log(lam) - lnFact(t)) : 0);
    const vals = range(0, show);
    const m = { nm, finite: false, fam: 'poisson', lo: 0, show, vals: vals.map(v => F(v)), ps: vals.map(f), lam, f };
    m.mean = ex(lam);
    m.termsMean = vals.reduce((s, t) => s + t * f(t), 0);
    let tail = 0;
    for (let t = show + 1; t < show + 4000; t++) { const v = f(t); tail += v; if (t > lam && v < tail * 1e-17) break; }
    m.tail = tail;
    m.rest = num(lam) - m.termsMean;
    let restSum = 0;
    for (let t = show + 1; t < show + 4000; t++) { const v = t * f(t); restSum += v; if (t > lam && v < restSum * 1e-17) break; }
    if (restSum > 0) m.rest = restSum;
    m.restTex = '\\sum_{t>' + show + '}t\\,\\frac{e^{-\\lambda}\\lambda^t}{t!}' + rel(m.rest);
    m.pmfTex = fS(nm) + '(t)=\\frac{e^{-\\lambda}\\lambda^{t}}{t!}=\\frac{e^{-' + L + '}\\,' + L + '^{t}}{t!},\\ t=0,1,2,\\dots';
    m.infTex = 'E[' + nm + ']=\\sum_{t=0}^{\\infty}t\\,\\frac{e^{-\\lambda}\\lambda^t}{t!}';
    m.tex = '\\text{Poisson}(' + L + ')';
    m.words = 'Poisson(' + L + ')';
    m.short = { tex: 'E[' + nm + ']=\\lambda=' + L, src: at('L3.1', 29, 0), name: 'Poisson(λ)' };
    const Lexp = Math.exp(-lam);
    m.sample = () => {
      if (lam > 30) { // inverse CDF for large λ
        let u = Math.random(), t = 0, c = f(0);
        while (u > c && t < 4000) { t++; c += f(t); }
        return F(t);
      }
      let k = 0, prod = Math.random();
      while (prod > Lexp) { k++; prod *= Math.random(); }
      return F(k);
    };
    m.T = Math.ceil(lam + 14 * Math.sqrt(lam) + 40);
    return m;
  }
  function customFrom(c, nm) {
    if (!c || !c.vals || !c.vals.length) return { err: 'Type at least one value for ' + nm + '.' };
    const vals = c.vals.map(s => (s instanceof Frac || typeof s === 'number' ? ex(s) : ex(K.parseNum(String(s)))));
    const ps = (c.probs || []).map(s => (s instanceof Frac ? s : K.parseNum(String(s))));
    if (vals.some(v => v == null || !isFinite(num(v)))) return { err: 'Fix the red value boxes of ' + nm + ' (numbers such as 3, -1, 1.4 or 7/5).' };
    if (ps.length !== vals.length || ps.some(p => p == null || num(p) < 0)) return { err: 'Fix the red probability boxes of ' + nm + ' (numbers 0 or more, such as 1/6, 0.25 or 25%).' };
    if (new Set(vals.map(v => num(v))).size !== vals.length) return { err: 'Each value of ' + nm + ' may appear only once.' };
    if (vals.length > 80) return { err: 'Keep the PMF of ' + nm + ' to 80 values or fewer.' };
    if (vals.some(v => Math.abs(num(v)) > 1e6)) return { err: 'Keep the values of ' + nm + ' between −1,000,000 and 1,000,000.' };
    const tot = sum(ps.map(norm));
    if (!same(tot, F(1))) return { err: 'The probabilities of ' + nm + ' add up to ' + txt(tot) + ', not 1. Press “Rescale to total 1” or edit them.' };
    const order = vals.map((_, i) => i).sort((a, b) => num(vals[a]) - num(vals[b]));
    return { m: finite(nm, order.map(i => vals[i]), order.map(i => norm(ps[i]))) };
  }
  /** spec {fam, q} or {fam: 'custom', custom: {vals, probs}} (as stored) → {m} or {err} */
  function fromSpec(spec, nm) {
    const q = (spec && spec.q) || {};
    try {
      switch (spec && spec.fam) {
        case 'uniform': {
          const a = int(q.a, 1), b = int(q.b, 6);
          if (Math.abs(b - a) > 60) return { err: 'Keep a and b of ' + nm + ' within 60 of each other.' };
          return { m: uniform(nm, a, b) };
        }
        case 'bernoulli': {
          const p = prob(q.p);
          if (!p) return { err: 'Type p for ' + nm + ' as a number from 0 to 1 (for example 1/3, 0.25 or 25%).' };
          return { m: bernoulli(nm, ex(p)) };
        }
        case 'binomial': {
          const p = prob(q.p), n = int(q.n, 4);
          if (!p) return { err: 'Type p for ' + nm + ' as a number from 0 to 1.' };
          if (n < 1 || n > 40) return { err: 'n for ' + nm + ' must be a whole number from 1 to 40.' };
          return { m: binomial(nm, n, ex(p)) };
        }
        case 'geometric': {
          const p = prob(q.p);
          if (!p) return { err: 'Type p for ' + nm + ' as a number from 0 to 1.' };
          if (num(p) === 0) return { err: 'Geometric(0) is not a distribution: with p = 0 the first success never comes. Choose p > 0.' };
          return { m: geometric(nm, ex(p), Math.max(3, Math.min(60, int(q[SHOW], 10)))) };
        }
        case 'poisson': {
          const lam = Number(q[LAM]);
          if (!(lam > 0) || lam > 50) return { err: 'λ for ' + nm + ' must be more than 0 (and at most 50 here).' };
          return { m: poisson(nm, lam, Math.max(3, Math.min(80, int(q[SHOW], 12)))) };
        }
        case 'custom': return customFrom(spec.custom, nm);
        default: return { err: 'Unknown distribution for ' + nm + '.' };
      }
    } catch (e) { return { err: 'Could not read the distribution of ' + nm + ': ' + e.message }; }
  }
  /** stored spec from a K.distPicker result */
  function specFromPick(r) {
    if (!r.fam) return { fam: 'custom', custom: { vals: r.dist.vals.map(v => plain(ex(v))), probs: r.dist.p.map(f => (f instanceof Frac ? f.toString() : String(f))) } };
    const q = {};
    Object.keys(r.q || {}).forEach(k => { const v = r.q[k]; q[k] = v instanceof Frac ? v.toString() : v; });
    return { fam: r.fam, q };
  }
  /** joint table as stored (strings, rows = Y) → {J: {xs, ys (ascending, exact), p[i][j] = f(xs[i], ys[j])}} or {err} */
  function jointFrom(j) {
    try {
      if (!j || !j.xs || !j.ys || !j.cells) return { err: 'There is no joint table yet.' };
      const xs = j.xs.map(s => ex(K.parseNum(String(s)))), ys = j.ys.map(s => ex(K.parseNum(String(s))));
      if (xs.some(v => v == null || !isFinite(num(v))) || ys.some(v => v == null || !isFinite(num(v)))) return { err: 'Use numbers as the values of X (top row) and Y (left column) of the table.' };
      if (new Set(xs.map(num)).size !== xs.length || new Set(ys.map(num)).size !== ys.length) return { err: 'Each value of X and of Y may appear only once in the table.' };
      if (xs.length > 12 || ys.length > 12) return { err: 'Keep the table to 12 values of X and 12 values of Y.' };
      const cells = j.cells.map(r => r.map(c => (c instanceof Frac ? c : K.parseNum(String(c)))));
      if (cells.length !== ys.length || cells.some(r => r.length !== xs.length || r.some(c => c == null || num(c) < 0))) return { err: 'Fix the red boxes in the joint table (numbers 0 or more, like 1/8 or 0.125).' };
      const tot = sum(cells.flat().map(norm));
      if (!same(tot, F(1))) return { err: 'The cells of the joint table add up to ' + txt(tot) + ', not 1. Press “Rescale to total 1” or edit them.' };
      const xo = xs.map((_, i) => i).sort((a, b) => num(xs[a]) - num(xs[b]));
      const yo = ys.map((_, k) => k).sort((a, b) => num(ys[a]) - num(ys[b]));
      return { J: { xs: xo.map(i => xs[i]), ys: yo.map(k => ys[k]), p: xo.map(i => yo.map(k => norm(cells[k][i]))) } };
    } catch (e) { return { err: 'Could not read the joint table: ' + e.message }; }
  }

  /* ================================================================ small blocks */
  function table(head, rows, cls) {
    const t = h('table', { class: 'tbl ex-tbl' });
    t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach(r => tb.appendChild(h('tr', { class: r.cls || null }, r.cells.map(c => h('td', { html: c })))));
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap ex-tw' + (cls ? ' ' + cls : '') }, t);
  }
  /** a line of inline maths that wraps at + and = on phones */
  function mline(src, cls) { const d = h('div', { class: 'ex-math' + (cls ? ' ' + cls : '') }); Lab.setHTML(d, tex(src)); return d; }
  function para(html, cls) { const d = h('div', { class: 'ex-p' + (cls ? ' ' + cls : '') }); Lab.setHTML(d, html); return d; }
  function head4(html) { const d = h('h4', { class: 'ex-h' }); Lab.setHTML(d, html); return d; }
  function verdict(ok, html) { const d = h('div', { class: 'ex-verdict ' + (ok ? 'good' : 'bad') }); Lab.setHTML(d, (ok ? '<span class="cgood">✓</span> ' : '<span class="cbad">≠</span> ') + html); return d; }
  function box(kind, html) { const d = h('div', { class: 'ex-box ' + kind }); Lab.setHTML(d, html); return d; }

  /** Number box that takes fractions (1/3, −7/2, 0.25) + slider. onChange(value | null, text). */
  function exactField({ label, value, min, max, step, onChange, hint }) {
    const input = h('input', { class: 'field mono pl-num ex-exact', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'text' });
    const clampN = v => Math.max(min, Math.min(max, v));
    const range0 = h('input', { class: 'slider pl-range', type: 'range', min, max, step, value: clampN(num(ex(K.parseNum(String(value)) || 0))) });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range0), msg);
    const paint = v => { v = clampN(v); range0.value = v; range0.style.setProperty('--pct', ((v - min) / (max - min)) * 100 + '%'); };
    const read = s => { const f = K.parseNum(s); if (f == null || !isFinite(num(f)) || Math.abs(num(f)) > 1e6) return null; return ex(f); };
    const show = f => { input.classList.remove('bad'); Lab.setHTML(msg, hint ? hint(f) : ''); };
    input.addEventListener('input', () => {
      const f = read(input.value);
      if (f == null) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Type a number, for example 2, -1.5, 1/3 or -7/2.</span>'); onChange(null, input.value); return; }
      paint(num(f)); show(f); onChange(f, input.value);
    });
    range0.addEventListener('input', () => { const s = String(+parseFloat(range0.value).toPrecision(12)); input.value = s; const f = read(s); paint(num(f)); show(f); onChange(f, s); });
    const f0 = read(String(value));
    if (f0 != null) { paint(num(f0)); show(f0); }
    wrap.set = s => { input.value = String(s); const f = read(input.value); if (f != null) { paint(num(f)); show(f); } };
    wrap.input = input;
    return wrap;
  }
  /** A typed function of x (or of x and y). onChange(compiled | null, text). */
  function exprBox({ label, value, vars, onChange, example }) {
    const input = h('input', { class: 'field mono pl-text', type: 'text', value, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, input, msg);
    const run = () => {
      const src = input.value;
      try {
        if (!src.trim()) throw new Error('Type a function, for example ' + example + '.');
        const used = Lab.expr.vars(src).filter(v => !vars.includes(v));
        if (used.length) throw new Error('Unknown name: ' + used.join(', ') + ' (use ' + vars.join(' and ') + ').');
        const f = Lab.expr.compile(src);
        input.classList.remove('bad');
        Lab.setHTML(msg, 'Use + − * / ^, abs(), min(), max(), sqrt(), and comparisons such as (' + vars[0] + ' >= 2), which give 1 or 0.');
        onChange(f, src);
      } catch (e) {
        input.classList.add('bad');
        Lab.setHTML(msg, '<span class="cbad">' + Lab.esc(e.message) + '</span>');
        onChange(null, src);
      }
    };
    input.addEventListener('input', Lab.debounce(run, 220));
    wrap.set = v => { input.value = v; run(); };
    wrap.input = input;
    return wrap;
  }
  /** evaluate a compiled g at exact values; returns an exact value or a number, or throws a readable error */
  function evalAt(f, env, where) {
    let r;
    try { r = f(env); } catch (e) { throw new Error('g cannot be worked out at ' + where + ': ' + e.message); }
    r = norm(r);
    if (!isFinite(num(r))) throw new Error('g is not a finite number at ' + where + '.');
    return r;
  }

  /* ================================================================ presets */
  const uni = (a, b) => ({ fam: 'uniform', q: { a, b } });
  const ber = p => ({ fam: 'bernoulli', q: { p } });
  const bin = (n, p) => ({ fam: 'binomial', q: { n, p } });
  const geo = (p, k) => ({ fam: 'geometric', q: { p, [SHOW]: k } });
  const poi = (l, k) => ({ fam: 'poisson', q: { [LAM]: l, [SHOW]: k } });
  const cus = (vals, probs) => ({ fam: 'custom', custom: { vals: vals.map(String), probs: probs.map(String) } });
  // L3.2 (12:20): (X, Y) uniform on (0,0), (1,0), (0,1), (1,1), (−1,1), (1,−1). Columns X = −1, 0, 1; rows Y = −1, 0, 1.
  const L32J = () => ({ xs: ['-1', '0', '1'], ys: ['-1', '0', '1'], cells: [['0', '0', '1/6'], ['0', '1/6', '1/6'], ['1/6', '1/6', '1/6']] });
  // L3.5 (2:40): two joint PMFs of X, Y in {0, 1}: all cells 1/4 (independent), and Y = 1 − X
  const BITS = () => ({ xs: ['0', '1'], ys: ['0', '1'], cells: [['1/4', '1/4'], ['1/4', '1/4']] });
  const FLIP = () => ({ xs: ['0', '1'], ys: ['0', '1'], cells: [['0', '1/2'], ['1/2', '0']] });
  // L3.5 (16:20): uncorrelated but dependent. Columns X = −1, 0, 1; rows Y = 0, 1.
  const UNC = () => ({ xs: ['-1', '0', '1'], ys: ['0', '1'], cells: [['1/8', '1/4', '1/8'], ['1/4', '0', '1/4']] });
  // L3.2 (24:20) balls in bins, 10 balls and 3 bins. X1, X2 = indicators "bin 1 empty", "bin 2 empty" (worked out here).
  const BINS2 = () => ({ xs: ['0', '1'], ys: ['0', '1'], cells: [['57002/59049', '1023/59049'], ['1023/59049', '1/59049']] });
  /** the lecture's own joint tables, recognised when they are in section 4 (Rule 0: say where the numbers come from) */
  const LECTURE_TABLES = [
    { j: L32J, html: 'This is the joint PMF of ' + at('L3.2', 12, 20) + ': (X, Y) uniform on (0,0), (1,0), (0,1), (1,1), (−1,1), (1,−1).' },
    { j: BITS, html: 'This is the first table of ' + at('L3.5', 2, 40) + ' (independent X and Y).' },
    { j: FLIP, html: 'This is the second table of ' + at('L3.5', 2, 40) + ' (Y = 1 − X).' },
    { j: UNC, html: 'This is the table of ' + at('L3.5', 16, 20) + ' (uncorrelated but dependent).' },
    { j: BINS2, html: 'This table is worked out here from ' + at('L3.2', 24, 20) + ': X₁, X₂ = “bin 1 empty”, “bin 2 empty” after 10 balls go into 3 bins; P(both empty) = (1/3)¹⁰ = 1/59049, P(bin 1 empty) = (2/3)¹⁰ = 1024/59049.' },
  ];
  /** the same joint PMF (values and probabilities compared as numbers, so 1023/59049 and 341/19683 match) */
  function sameJoint(A, B) {
    if (!A || !B || A.xs.length !== B.xs.length || A.ys.length !== B.ys.length) return false;
    return A.xs.every((x, i) => same(x, B.xs[i])) && A.ys.every((y, j) => same(y, B.ys[j])) && A.p.every((r, i) => r.every((v, j) => same(v, B.p[i][j])));
  }
  const DEF = () => ({ X: uni(1, 6), g: 'x^2', a: '2', b: '1', mode: 'joint', joint: L32J(), IX: uni(1, 6), IY: uni(1, 6), h: 'x^2 + x*y + y^2', n: 1000, t: 3 });

  const PRESETS = [
    { label: 'L3.1 · A fair die: Uniform{1, …, 6}', source: at('L3.1', 12, 40) + ': E[X] = 1·1/6 + 2·1/6 + … + 6·1/6 = 3.5, a value the die never shows. The g, a and b boxes keep your values.', set: { X: uni(1, 6) } },
    { label: 'L3.1 · Bernoulli(0.3)', source: at('L3.1', 31, 0) + ' (slide “PMF and expected value”): E[X] = 0·0.7 + 1·0.3 = 0.3, between the two values 0 and 1. The rule E[X] = p is at ' + at('L3.1', 11, 40) + '.', set: { X: ber('3/10') } },
    { label: 'L3.1 · Binomial(20, 0.3)', source: at('L3.1', 31, 0) + ': E[X] = np = 20 × 0.3 = 6, near the peak of the PMF. In ' + at('L3.3', 4, 20) + ' the notebook draws 1000 samples and gets averages 6.026 and 6.062.', set: { X: bin(20, '3/10'), n: 1000 } },
    { label: 'L3.1 · Geometric(0.3)', source: at('L3.1', 31, 0) + ': E[X] = 1/p = 1/0.3 ≈ 3.33, well right of the peak at 1. ' + at('L3.3', 5, 40) + ': 1000 samples, average 3.367.', set: { X: geo('3/10', 20), n: 1000 } },
    { label: 'L3.1 · Poisson(6)', source: at('L3.1', 31, 0) + ': E[X] = λ = 6 (drawn there up to 20). ' + at('L3.3', 6, 20) + ': 1000 samples, average 6.029.', set: { X: poi(6, 20), n: 1000 } },
    { label: 'L3.1 · Lottery ticket (Rs. 200, 20, 0)', source: at('L3.1', 13, 40) + ': Rs. 200 with probability 1/1000, Rs. 20 with 27/1000, Rs. 0 with 972/1000. The slide writes “= Rs. 0.56”, but its own terms add up to 200/1000 + 540/1000 = 0.74; the lab shows the sum of the terms.', set: { X: cus([0, 20, 200], ['972/1000', '27/1000', '1/1000']) } },
    { label: 'L3.1 · Casino: bet 1 unit on “Under 7”', source: at('L3.1', 5, 20) + ', table “Bets and returns”: gain 0 with probability 5/12 (money back) and −1 with 7/12. Expected gain −7/12.', set: { X: cus([-1, 0], ['7/12', '5/12']) } },
    { label: 'L3.1 · Casino: bet 1 unit on “Equal to 7”', source: at('L3.1', 5, 20) + ': gain +3 with probability 1/6 (4 times the money back), −1 with 5/6. Expected gain −1/3 (also ' + at('L3.2', 3, 20) + ', the case p₁ = 0).', set: { X: cus([-1, 3], ['5/6', '1/6']) } },
    { label: 'L3.2 · Casino: mixed bets with p₁ = 0.3', source: at('L3.2', 1, 0) + '–3:20: bet “Under 7” and “Over 7” with probability p₁ each, “Equal to 7” with 1 − 2p₁; the slide gets −(2 + 3p₁)/6, negative for every p₁. p₁ = 0.3 is the value the professor mentions (' + at('L3.2', 0, 45) + '). Gains: 0 with 2·0.3·5/12 = 1/4; +3 with 0.4·1/6 = 1/15; −1 with 2·0.3·7/12 + 0.4·5/6 = 41/60.', set: { X: cus([-1, 0, 3], ['41/60', '1/4', '1/15']) } },
    { label: 'L3.2 · X uniform on {−2, …, 2}, g(X) = X²', source: at('L3.2', 10, 0) + '–11:40: E[g(X)] = 0·1/5 + 1·2/5 + 4·2/5 = 2 from the PMF of X², and (−2)²·1/5 + … + 2²·1/5 = 2 straight from X. Here g(E[X]) = g(0) = 0 ≠ 2.', set: { X: uni(-2, 2), g: 'x^2' } },
    { label: 'L3.2 · Joint uniform on 6 pairs, g = X² + XY + Y²', source: at('L3.2', 12, 20) + '–14:20: (X, Y) uniform on (0,0), (1,0), (0,1), (1,1), (−1,1), (1,−1); E[g(X, Y)] = 7/6 both ways. ' + at('L3.2', 18, 20) + ': E[X²] + E[XY] + E[Y²] = 4/6 − 1/6 + 4/6 = 7/6, so E[XY] = −1/6, while E[X]E[Y] = 1/3 · 1/3 = 1/9.', set: { mode: 'joint', joint: L32J(), h: 'x^2 + x*y + y^2' } },
    { label: 'L3.2 · Throw a fair die twice: E[X + Y] = 7', source: at('L3.2', 19, 20) + ': X = first number, Y = second number; E[X + Y] = E[X] + E[Y] = 3.5 + 3.5 = 7 without the 36 pairs. The two throws are independent, so the lab builds the 36-cell table from the two PMFs.', set: { mode: 'indep', IX: uni(1, 6), IY: uni(1, 6), h: 'x + y' } },
    { label: 'L3.2 · Zero-mean: Y = X − E[X] for the die', source: at('L3.2', 23, 20) + ': Y = X − E[X] is a translated X with E[Y] = 0. For the fair die E[X] = 7/2, so a = 1, b = −7/2.', set: { X: uni(1, 6), a: '1', b: '-7/2' } },
    { label: 'L3.2 · Balls in bins: 10 balls, 3 bins', source: at('L3.2', 24, 20) + '–28:40: Y = number of empty bins = X₁ + X₂ + X₃ (indicators, dependent); E[Y] = 3·(2/3)¹⁰ = 1024/19683 ≈ 0.0520 by linearity. The lecture leaves the PMF of Y as “a little hard”; worked out here: P(Y = 2) = 3·(1/3)¹⁰ = 1/19683, P(Y = 1) = 3·(2¹⁰ − 2)/3¹⁰ = 1022/19683, P(Y = 0) = the rest = 18660/19683 = 6220/6561. Section 4 gets the joint table of X₁, X₂ (P(both empty) = (1/3)¹⁰). ' + at('L3.3', 6, 40) + ': simulated average 0.054 from 1000 runs.', set: { X: cus([0, 1, 2], ['18660/19683', '1022/19683', '1/19683']), mode: 'joint', joint: BINS2(), h: 'x + y', n: 1000 } },
    { label: 'L3.3 · Casino simulation: returns a = 12/5, b = 6', source: at('L3.3', 2, 40) + '–3:20, notebook: each round the bet is chosen at random (uniform(3,1)); “Under 7” or “Over 7” wins with probability 5/12 and pays a − 1 = 7/5, “Equal to 7” wins with 1/6 and pays b − 1 = 5; a loss costs 1. Gain 7/5 with 2/3·5/12 = 5/18, 5 with 1/3·1/6 = 1/18, −1 with 2/3·7/12 + 1/3·5/6 = 2/3. Expected gain 0; the notebook’s 1000 rounds gave 0.002.', set: { X: cus([-1, '7/5', 5], ['2/3', '5/18', '1/18']), n: 1000 } },
    { label: 'L3.3 · Casino simulation: returns a = 1, b = 4', source: at('L3.3', 3, 40) + ': the same notebook with a = 1, b = 4 (the L3.1 game): gain 0 with 5/18, 3 with 1/18, −1 with 2/3. Expected gain −1/2; the notebook printed −0.5 and the simulated −0.508.', set: { X: cus([-1, 0, 3], ['2/3', '5/18', '1/18']), n: 1000 } },
    { label: 'L3.5 · Two independent fair bits: E[XY] = E[X]E[Y]', source: at('L3.5', 2, 40) + ', the first table (every cell 1/4): X and Y independent. ' + at('L3.5', 15, 20) + ': independent X, Y have E[XY] = E[X]E[Y] (so Cov(X, Y) = 0).', set: { mode: 'joint', joint: BITS(), h: 'x*y' } },
    { label: 'L3.5 · Y = 1 − X: E[XY] ≠ E[X]E[Y]', source: at('L3.5', 2, 40) + ', the second table: f(0, 1) = f(1, 0) = 1/2, so X determines Y. Same marginals as the independent table, but E[XY] = 0 while E[X]E[Y] = 1/4.', set: { mode: 'joint', joint: FLIP(), h: 'x*y' } },
    { label: 'L3.5 · Uncorrelated but dependent', source: at('L3.5', 16, 20) + ': X ∈ {−1, 0, 1}, Y ∈ {0, 1}; E[XY] = 0 = E[X]E[Y] (E[X] = 0), yet f(0, 1) = 0 ≠ f_X(0) f_Y(1) = 1/4 · 1/2: equal does not mean independent.', set: { mode: 'joint', joint: UNC(), h: 'x*y' } },
  ];

  /* ================================================================ the lab */
  function expectLab(host) {
    const clone = o => JSON.parse(JSON.stringify(o));
    let st, good = {}, errs = {}, ctl = {}, P = {}, sim = null;
    const save = () => Lab.store.set(STORE, st);
    const schedule = Lab.debounce(() => draw(), 30);
    // charts are drawn in layout pixels and redrawn when their box changes width (pinning, phone rotation)
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(list => list.forEach(e => {
      const el = e.target, w = Math.round(el.clientWidth);
      if (w > 0 && w !== el._w && el._paint) { el._w = w; el._paint(w); }
    })) : null;
    const chartHost = (cls, paint) => {
      const el = h('div', { class: cls });
      el._paint = w => { Lab.clear(el); el.appendChild(paint(Math.max(260, w))); };
      el._paint(640);
      if (ro) ro.observe(el);
      return el;
    };
    const saved0 = Lab.store.get(STORE, null);
    load(saved0);
    build(saved0 && Object.keys(saved0).length ? null : 0);

    function load(saved) {
      st = Object.assign(DEF(), saved && typeof saved === 'object' ? clone(saved) : {});
      if (!['joint', 'indep'].includes(st.mode)) st.mode = 'joint';
      if (!(st.n >= 1 && st.n <= 10000)) st.n = 1000;
      good = {}; errs = {};
      const r = fromSpec(st.X, 'X');
      if (r.m) good.X = r.m; else { st.X = uni(1, 6); good.X = fromSpec(st.X, 'X').m; }
      ['IX', 'IY'].forEach(k => {
        const nm = k === 'IX' ? 'X' : 'Y';
        const rr = fromSpec(st[k], nm);
        if (rr.m && rr.m.finite) good[k] = rr.m; else { st[k] = uni(1, 6); good[k] = fromSpec(st[k], nm).m; }
      });
      const rj = jointFrom(st.joint);
      if (rj.J) good.J = rj.J; else { st.joint = L32J(); good.J = jointFrom(st.joint).J; }
      good.g = compileOr(st.g, ['x'], 'x^2', 'g');
      good.h = compileOr(st.h, ['x', 'y'], 'x^2 + x*y + y^2', 'h');
      good.a = ex(K.parseNum(String(st.a))); if (good.a == null || !isFinite(num(good.a))) { st.a = '2'; good.a = F(2); }
      good.b = ex(K.parseNum(String(st.b))); if (good.b == null || !isFinite(num(good.b))) { st.b = '1'; good.b = F(1); }
      sim = null;
    }
    function compileOr(src, vars, def, key) {
      try {
        if (Lab.expr.vars(src).some(v => !vars.includes(v))) throw new Error('bad');
        return { f: Lab.expr.compile(src), src };
      } catch (e) { st[key] = def; return { f: Lab.expr.compile(def), src: def }; }
    }

    /* ------------------------------------------------------------ controls */
    function build(pre) {
      const { side, main } = K.layout(host, 'ex-lab');
      ctl = {}; P = {};
      side.appendChild(K.group('Lecture examples'));
      ctl.pre = K.presets({ label: 'Load an example from the lectures', items: PRESETS, onPick: it => loadPreset(it) });
      side.appendChild(ctl.pre);
      if (pre != null) { ctl.pre.select.value = String(pre); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[pre].source); }

      side.appendChild(K.group('1 · Your random variable X'));
      ctl.xHost = h('div', { class: 'ex-ctl' });
      side.appendChild(ctl.xHost);
      mountPicker(ctl.xHost, 'X', 'X', FAMS1);

      side.appendChild(K.group('2 · A function of X'));
      ctl.g = exprBox({ label: tex('g(x)=') + ' (type it with ' + tex('x') + ')', value: st.g, vars: ['x'], example: 'x^2', onChange: (f, src) => {
        if (!f) { errs.g = 'Your g(x) cannot be read yet (see the message under it). The panels keep your last valid g.'; schedule(); return; }
        st.g = src; good.g = { f, src }; errs.g = ''; schedule();
      } });
      side.appendChild(ctl.g);

      side.appendChild(K.group('3 · Stretch and shift'));
      ctl.a = exactField({ label: tex('a') + ' (stretch)', value: st.a, min: -5, max: 5, step: 0.5, onChange: (f, s) => onConst('a', f, s) });
      ctl.b = exactField({ label: tex('b') + ' (shift)', value: st.b, min: -10, max: 10, step: 0.5, onChange: (f, s) => onConst('b', f, s) });
      side.append(ctl.a, ctl.b);

      side.appendChild(K.group('4 · Two random variables X and Y'));
      side.appendChild(K.note('This section has its own ' + tex('X') + ' and ' + tex('Y') + ': a joint table, or two independent distributions.'));
      ctl.mode = Lab.seg([{ label: 'A joint table', value: 'joint' }, { label: 'Independent X and Y', value: 'indep' }], st.mode, v => { st.mode = v; syncMode(); draw(); });
      side.appendChild(h('div', { class: 'pl-field' }, ctl.mode));
      ctl.jHost = h('div', { class: 'ex-ctl' });
      ctl.iHost = h('div', { class: 'ex-ctl' });
      side.append(ctl.jHost, ctl.iHost);
      mountJoint();
      ctl.ixHost = h('div'); ctl.iyHost = h('div');
      ctl.iHost.append(ctl.ixHost, ctl.iyHost);
      mountPicker(ctl.ixHost, 'IX', 'X', FAMS2);
      mountPicker(ctl.iyHost, 'IY', 'Y', FAMS2);
      ctl.h = exprBox({ label: tex('g(x,y)=') + ' (type it with ' + tex('x') + ' and ' + tex('y') + ')', value: st.h, vars: ['x', 'y'], example: 'x*y', onChange: (f, src) => {
        if (!f) { errs.h = 'Your g(x, y) cannot be read yet (see the message under it). Section 4 keeps your last valid g(x, y).'; schedule(); return; }
        st.h = src; good.h = { f, src }; errs.h = ''; schedule();
      } });
      side.appendChild(ctl.h);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); load(null); build(0); }, 'btn ghost sm')));

      P.err = h('div', { class: 'ex-err', hidden: true });
      P.answer = K.answer();
      P.sum = K.panel(tex('E[X]') + ' term by term, with your numbers');
      P.pmf = K.panel('The PMF of ' + tex('X') + ', balanced at ' + tex('E[X]'), 'A stem for each value ' + tex('t') + ', as tall as ' + tex('f_X(t)') + ' (the lecture’s picture, ' + at('L3.1', 31, 0) + '). If the stems were weights on a rod, the rod would balance at ' + tex('E[X]') + '.');
      P.g = K.panel(tex('E[g(X)]') + ': add up ' + tex('g(t)\\,f_X(t)') + ', not ' + tex('g(E[X])'));
      P.lin = K.panel(tex('E[aX+b]=aE[X]+b') + ', checked both ways');
      P.two = K.panel('Two random variables: ' + tex('E[X+Y]') + ' and ' + tex('E[XY]'));
      P.sim = K.panel('Simulation: the average of many draws settles at ' + tex('E[X]'), 'As in ' + at('L3.3', 4, 20) + ': draw ' + tex('X') + ' again and again; the running average (blue line) wanders, then settles at ' + tex('E[X]') + ' (dashed line).');
      main.append(P.err, P.answer, P.sum, P.pmf, P.g, P.lin, P.two, P.sim);
      syncMode();
      draw();
    }
    function mountPicker(hostEl, key, nm, fams) {
      Lab.clear(hostEl);
      const s = st[key];
      const params = {};
      if (s.fam !== 'custom' && s.q) params[s.fam] = Object.assign({}, s.q);
      const custom = s.custom ? { vals: s.custom.vals.slice(), probs: s.custom.probs.slice() } : undefined;
      const label = key === 'X' ? 'Distribution of ' + tex('X') : 'Distribution of ' + tex(nm) + ' (independent)';
      hostEl.appendChild(K.distPicker({ label, families: fams, value: s.fam, params, custom, xName: nm, onChange: r => onPick(key, nm, r) }));
    }
    function onPick(key, nm, r) {
      const where = key === 'X' ? 'section 1' : 'section 4';
      if (!r.fam && !r.ok) {
        errs[key] = 'The PMF of ' + nm + ' in ' + where + ' is not valid yet (see the message under it). The panels keep your last valid ' + nm + '.';
        schedule();
        return;
      }
      const spec = specFromPick(r);
      const res = fromSpec(spec, nm);
      if (res.m) {
        st[key] = spec; good[key] = res.m; errs[key] = '';
        if (key === 'X') sim = null;
      } else errs[key] = res.err + ' The panels keep your last valid ' + nm + '.';
      schedule();
    }
    function mountJoint() {
      Lab.clear(ctl.jHost);
      const j = st.joint;
      ctl.grid = K.gridEditor({ label: 'Joint PMF ' + tex('f_{XY}(t_1,t_2)'), xs: j.xs, ys: j.ys, cells: j.cells, xName: 'X', yName: 'Y', onChange: onJoint });
      ctl.jHost.appendChild(ctl.grid);
    }
    function onJoint(r) {
      if (!r.ok) {
        errs.J = (r.total && !r.total.eq(1) ? 'The cells of the joint table add up to ' + txt(r.total) + ', not 1.' : 'Fix the red boxes in the joint table.') + ' Section 4 keeps your last valid table.';
        schedule();
        return;
      }
      const j = { xs: r.xs.map(String), ys: r.ys.map(String), cells: r.cells.map(row => row.map(c => String(c))) };
      const res = jointFrom(j);
      if (res.J) { good.J = res.J; errs.J = ''; st.joint = j; } else errs.J = res.err + ' Section 4 keeps your last valid table.';
      schedule();
    }
    function onConst(k, f, s) {
      if (f == null) { errs[k] = 'Type ' + k + ' as a number (2, −1.5, 1/3 or −7/2). The panels keep your last valid ' + k + '.'; schedule(); return; }
      st[k] = s; good[k] = f; errs[k] = ''; schedule();
    }
    function loadPreset(it) {
      const k = PRESETS.indexOf(it);
      const next = Object.assign(clone(st), clone(it.set));
      load(next);
      build(k);
    }
    function syncMode() {
      const j = st.mode === 'joint';
      ctl.jHost.hidden = !j;
      ctl.iHost.hidden = j;
    }

    /* ------------------------------------------------------------ drawing */
    function draw() {
      save();
      const list = ['X', 'g', 'a', 'b', st.mode === 'joint' ? 'J' : 'IX', st.mode === 'joint' ? '' : 'IY', 'h'].map(k => k && errs[k]).filter(Boolean);
      P.err.hidden = !list.length;
      Lab.setHTML(P.err, list.map(m => '<div>' + Lab.esc(m) + '</div>').join(''));
      if (ro) ro.disconnect();
      const m = good.X;
      const D = { m, g: good.g, a: good.a, b: good.b };
      try { D.G = gData(m, good.g); } catch (e) { D.G = { err: e.message }; }
      drawSum(D); drawPmf(D); drawG(D); drawLin(D); drawTwo(); drawSim(false); drawAnswer(D);
    }

    /* ---------- the answer box */
    function drawAnswer(D) {
      const m = D.m;
      const inRange = m.vals.some(v => same(v, m.mean));
      let sub = 'The sum ' + tex('\\sum_t t\\,f_X(t)') + ' is written out term by term below. ';
      if (!inRange) sub += tex('E[X]' + rel(m.mean)) + ' is not one of the values ' + tex('X') + ' takes: it is a weighted average of them (' + at('L3.1', 11, 0) + '). ';
      if (D.G && !D.G.err && D.G.ok) sub += 'With your ' + tex('g') + ': ' + tex('E[g(X)]' + rel(D.G.E)) + (D.G.gE != null ? ', while ' + tex('g(E[X])' + rel(D.G.gE)) : '') + '. ';
      sub += 'And ' + tex('{E[' + linTex(D.a, D.b) + ']}=' + pt(D.a) + '\\cdot ' + pt(m.mean) + (num(D.b) < 0 ? '' : '+') + tx(D.b) + relAfter([D.a, m.mean, D.b], add(mul(D.a, m.mean), D.b))) + '.';
      K.setAnswer(P.answer, { ev: 'Your ' + tex('X\\sim ' + m.tex) + '.', big: 'E[X]' + rel(m.mean), sub });
      P.answer.dataset.v = 'EX=' + plain(m.mean);
    }

    /* ---------- E[X] term by term */
    function drawSum(D) {
      const m = D.m, body = P.sum.body;
      Lab.clear(body);
      body.appendChild(para('Definition (' + at('L3.1', 8, 0) + '): ' + tex('E[X]=\\sum_{t\\in T_X} t\\,f_X(t)') + ' — every value ' + tex('t') + ' times its probability, all added up.'));
      if (m.finite) {
        const vals = m.vals, nz = vals.map((t, i) => ({ t, p: m.ps[i] }));
        body.appendChild(para('Your ' + tex('X') + ' has ' + plural(vals.length, 'value') + ': ' + tex('T_X=\\{' + cut(vals.map(tx), 20).join(',\\allowbreak ') + '\\}') + '.'));
        const terms = nz.map(r => ({ f: pt(r.t) + '\\cdot ' + tx(r.p), v: mul(r.t, r.p), parts: [r.t, r.p] }));
        body.appendChild(mline(sumTex('E[X]', terms, { total: m.termsMean, always: true })));
        let run = F(0);
        body.appendChild(table([tex('t'), tex('f_X(t)'), tex('t\\cdot f_X(t)'), 'running total'], nz.map(r => {
          const v = mul(r.t, r.p);
          run = add(run, v);
          return { cells: [tex(tx(r.t)), tex(tx(r.p)), tex(pt(r.t) + '\\cdot ' + tx(r.p) + relAfter([r.t, r.p], v)), tex(valTex(run))], cls: isZero(r.p) ? 'ex-zero' : null };
        })));
        if (m.short) {
          const agree = same(m.short ? m.mean : m.termsMean, m.termsMean);
          body.appendChild(para('Shortcut for ' + m.short.name + ' (' + m.short.src + '): ' + tex(m.short.tex) + (agree ? ' — the same number as the sum.' : '')));
          if (!isEx(norm(m.termsMean)) && isEx(norm(m.mean))) body.appendChild(para('(The terms are rounded decimals here, so their sum is ' + tex('\\approx ' + dec(m.termsMean)) + '; the shortcut gives the exact value.)', 'small muted'));
        }
      } else {
        const terms = m.vals.map((t, i) => ({ f: pt(t) + '\\cdot ' + tx(m.ps[i]), v: mul(t, m.ps[i]), parts: [t, m.ps[i]] }));
        body.appendChild(para('Your ' + tex('X\\sim ' + m.tex) + ' has infinitely many values: ' + tex(m.pmfTex) + '.'));
        const shown = terms.map(t => t.f);
        body.appendChild(mline(m.infTex + '=' + jn(cut(shown, 12)) + '+\\dots'));
        body.appendChild(para('The ' + plural(m.vals.length, 'term') + ' up to ' + tex('t=' + m.show) + ' (your “shown up to k”) add up to ' + tex(valTex(m.termsMean)) + '. The terms after it add ' + tex(m.restTex) + '.'));
        if (shownExact(m.termsMean) && shownExact(m.rest)) body.appendChild(mline('E[X]=' + tx(m.termsMean) + '+' + tx(m.rest) + rel(m.mean)));
        else body.appendChild(mline('E[X]\\approx ' + dec(m.termsMean) + '+' + dec(m.rest) + '\\approx ' + dec(add(m.termsMean, m.rest)) + ',\\quad\\text{exactly }' + tx(m.mean)));
        body.appendChild(para('Shortcut for ' + m.short.name + ' (' + m.short.src + '): ' + tex(m.short.tex) + '.'));
        let run = F(0);
        const rows = m.vals.map((t, i) => {
          const v = mul(t, m.ps[i]);
          run = add(run, v);
          return { cells: [tex(tx(t)), tex(tx(m.ps[i])), tex(pt(t) + '\\cdot ' + tx(m.ps[i]) + relAfter([t, m.ps[i]], v)), tex(valTex(run))] };
        });
        rows.push({ cells: [tex('t>' + m.show), tex('\\text{total }' + tx(m.tail)), tex(tx(m.rest)), tex(tx(m.mean))], cls: 'ex-rest' });
        body.appendChild(table([tex('t'), tex('f_X(t)'), tex('t\\cdot f_X(t)'), 'running total'], rows));
      }
      P.sum.dataset.v = 'terms=' + plain(m.termsMean) + ';mean=' + plain(m.mean) + (m.finite ? '' : ';rest=' + plain(m.rest));
    }

    /* ---------- the PMF with its balance point, and the CDF */
    function drawPmf(D) {
      const m = D.m, body = P.pmf.body;
      Lab.clear(body);
      const mu = m.mean;
      body.appendChild(chartHost('ex-chart', w => stemChart({ w, vals: m.vals.map(num), ps: m.ps.map(num), mean: num(mu), meanLab: 'E[X] = ' + txt(mu), tone: 'x', name: 'X' })));
      if (!m.finite) body.appendChild(para('Drawn up to ' + tex('t=' + m.show) + '. Not drawn: ' + tex('P(X>' + m.show + ')' + rel(m.tail)) + ' — tiny stems far to the right, which still pull the balance point that way.', 'small muted'));
      // balance: the left pull equals the right pull
      const left = [], right = [];
      m.vals.forEach((t, i) => {
        if (isZero(m.ps[i])) return;
        const d = sub(t, mu);
        if (num(d) < 0) left.push({ f: '(' + tx(mu) + '-' + pt(t) + ')\\cdot ' + tx(m.ps[i]), v: mul(neg(d), m.ps[i]), parts: [mu, t, m.ps[i]] });
        else if (num(d) > 0) right.push({ f: '(' + tx(t) + '-' + pt(mu) + ')\\cdot ' + tx(m.ps[i]), v: mul(d, m.ps[i]), parts: [mu, t, m.ps[i]] });
      });
      const L = sum(left.map(x => x.v)), R = sum(right.map(x => x.v));
      body.appendChild(head4('Why it balances, with your numbers'));
      body.appendChild(para('Each stem pulls with (its distance from ' + tex('E[X]') + ') × (its probability). Stems left of ' + tex('E[X]' + rel(mu)) + ':'));
      body.appendChild(mline(left.length ? sumTex('\\text{left pull}', left, { always: true }) : '\\text{left pull}=0'));
      if (m.finite) {
        body.appendChild(para('Stems right of it:'));
        body.appendChild(mline(right.length ? sumTex('\\text{right pull}', right, { always: true }) : '\\text{right pull}=0'));
        body.appendChild(verdict(same(L, R), 'The two pulls are equal, because ' + tex('\\sum_t (t-E[X])\\,f_X(t)=E[X]-E[X]\\cdot 1=0') + '.'));
      } else {
        body.appendChild(para('The right side has infinitely many stems; they add up to the same ' + tex(tx(L)) + ', because ' + tex('\\sum_t (t-E[X])\\,f_X(t)=E[X]-E[X]=0') + '.'));
      }
      body.appendChild(head4('The CDF of ' + tex('X')));
      const fl = m.ps.some(p => !isEx(norm(p)) || norm(p).d > 1e6);
      const dist = { vals: m.vals.map(num), p: fl ? m.ps.map(num) : m.ps.map(norm), float: fl };
      const lo = num(m.vals[0]), hi = num(m.vals[m.vals.length - 1]);
      const t0 = Math.max(lo - 1, Math.min(hi + 1, Number(st.t)));
      body.appendChild(K.cdfChart(dist, { xName: 'X', t: Number.isFinite(t0) ? t0 : lo, truncated: !m.finite, onT: v => { st.t = v; save(); } }));
      P.pmf.dataset.v = 'left=' + plain(L) + ';right=' + plain(R);
    }

    /* ---------- E[g(X)] */
    function gData(m, G) {
      const f = G.f;
      const gv = t => evalAt(f, { x: norm(t) }, tex('x=' + tx(t)));
      const out = { src: G.src, rows: [], ok: true };
      m.vals.forEach((t, i) => { const g = gv(t); out.rows.push({ t, p: m.ps[i], g, v: mul(g, m.ps[i]) }); });
      out.drawn = sum(out.rows.map(r => r.v));
      try { out.gE = gv(m.mean); } catch (e) { out.gE = null; out.gEerr = e.message; }
      if (m.finite) {
        out.E = out.drawn;
        // table method: group the values t by g(t)
        const groups = new Map();
        out.rows.forEach(r => {
          const key = isEx(norm(r.g)) ? norm(r.g).toString() : String(+num(r.g).toPrecision(12));
          if (!groups.has(key)) groups.set(key, { y: r.g, from: [], p: F(0) });
          const gr = groups.get(key);
          gr.from.push(r); gr.p = add(gr.p, r.p);
        });
        out.groups = [...groups.values()].sort((a, b) => num(a.y) - num(b.y));
        out.E1 = sum(out.groups.map(gr => mul(gr.y, gr.p)));
      } else {
        // infinite sum: the drawn terms exactly, then the rest in floating point until it settles
        let rest = 0, last = 0;
        const hiT = m.T;
        for (let t = m.show + 1; t <= hiT; t++) {
          let g;
          try { g = num(f({ x: F(t) })); } catch (e) { throw new Error('g cannot be worked out at x = ' + t + ': ' + e.message); }
          const v = g * m.f(t);
          rest += v;
          if (t > hiT - 5) last += Math.abs(v);
        }
        out.rest = rest;
        out.E = add(out.drawn, rest);
        out.ok = isFinite(num(out.E)) && last <= 1e-9 * Math.max(1, Math.abs(num(out.E)));
      }
      return out;
    }
    function drawG(D) {
      const m = D.m, body = P.g.body;
      Lab.clear(body);
      const G = D.G;
      body.appendChild(para('Your ' + tex('g(x)') + ' = <code class="ex-code">' + Lab.esc(D.g.src) + '</code>. The rule from ' + at('L3.2', 8, 40) + ': ' + tex('E[g(X)]=\\sum_{t\\in T_X} g(t)\\,f_X(t)') + ' — you do not need the PMF of ' + tex('g(X)') + ', the PMF of ' + tex('X') + ' is enough.'));
      if (G.err) { body.appendChild(box('bad', Lab.esc(G.err) + ' Change g(x) or the distribution.')); P.g.dataset.v = 'err'; return; }
      const rows = G.rows.map(r => ({ cells: [tex(tx(r.t)), tex(tx(r.p)), tex(tx(r.g)), tex(pt(r.g) + '\\cdot ' + tx(r.p) + relAfter([r.g, r.p], r.v))], cls: isZero(r.p) ? 'ex-zero' : null }));
      if (!m.finite) rows.push({ cells: [tex('t>' + m.show), '…', '…', tex('\\approx ' + dec(G.rest))], cls: 'ex-rest' });
      body.appendChild(table([tex('t'), tex('f_X(t)'), tex('g(t)'), tex('g(t)\\cdot f_X(t)')], rows));
      if (m.finite) {
        body.appendChild(head4('Way 1 · the PMF of ' + tex('g(X)') + ' first (table method, ' + at('L3.2', 10, 20) + ')'));
        body.appendChild(para('Collect the values ' + tex('t') + ' that give the same ' + tex('g(t)') + ' and add their probabilities:'));
        body.appendChild(table([tex('y=g(t)'), 'from ' + tex('t='), tex('f_{g(X)}(y)')], G.groups.map(gr => ({ cells: [tex(tx(gr.y)), tex(gr.from.map(r => tx(r.t)).join(',\\ ')), tex(gr.from.length > 1 ? jn(gr.from.map(r => tx(r.p))) + relAfter(gr.from.map(r => r.p), gr.p) : tx(gr.p))] }))));
        body.appendChild(mline(sumTex('E[g(X)]=\\sum_y y\\,f_{g(X)}(y)', G.groups.map(gr => ({ f: pt(gr.y) + '\\cdot ' + tx(gr.p), v: mul(gr.y, gr.p), parts: [gr.y, gr.p] })), { always: true })));
        body.appendChild(head4('Way 2 · straight from the PMF of ' + tex('X') + ' (' + at('L3.2', 11, 0) + ')'));
        body.appendChild(mline(sumTex('E[g(X)]=\\sum_t g(t)\\,f_X(t)', G.rows.map(r => ({ f: pt(r.g) + '\\cdot ' + tx(r.p), v: r.v, parts: [r.g, r.p] })), { always: true })));
        body.appendChild(verdict(same(G.E1, G.E), 'Both ways give ' + tex('E[g(X)]' + rel(G.E)) + '.'));
      } else {
        body.appendChild(mline('E[g(X)]=\\sum_{t}g(t)\\,f_X(t)=' + jn(cut(G.rows.map(r => pt(r.g) + '\\cdot ' + tx(r.p)), 10)) + '+\\dots'));
        body.appendChild(para('The ' + plural(G.rows.length, 'term') + ' up to ' + tex('t=' + m.show) + ' add up to ' + tex(valTex(G.drawn)) + '; the terms after it add ' + tex('\\approx ' + dec(G.rest)) + ' (summed by the lab up to ' + tex('t=' + m.T) + ').'));
        if (G.ok) body.appendChild(mline('E[g(X)]' + rel(G.E)));
        else body.appendChild(box('bad', 'The terms of this sum do not die out: ' + tex('E[g(X)]') + ' does not exist (it is infinite) for this ' + tex('g') + ' and this ' + tex('X') + '. The definition assumes the sum exists (' + at('L3.1', 8, 0) + ').'));
      }
      body.appendChild(head4('Compare: ' + tex('g(E[X])') + ', ' + tex('g') + ' applied to the average'));
      if (G.gE == null) { body.appendChild(box('note', 'Your ' + tex('g') + ' cannot be worked out at ' + tex('x=E[X]' + rel(m.mean)) + ' (' + Lab.esc(G.gEerr) + '), so there is no ' + tex('g(E[X])') + ' to compare with.')); P.g.dataset.v = 'E=' + plain(G.E) + ';gE=none' + (m.finite ? ';E1=' + plain(G.E1) : ';ok=' + G.ok); return; }
      body.appendChild(mline('g(E[X])=g\\left(' + tx(m.mean) + (shownExact(m.mean) ? '' : '\\ldots') + '\\right)' + rel(G.gE)));
      if (G.ok) {
        if (same(G.gE, G.E)) body.appendChild(box('note', 'Here ' + tex('E[g(X)]') + ' and ' + tex('g(E[X])') + ' agree. For ' + tex('g(x)=ax+b') + ' they always do (section 3); for most other ' + tex('g') + ' they differ — try ' + tex('x^2') + '.'));
        else body.appendChild(box('warn', tex('E[g(X)]' + rel(G.E)) + ' but ' + tex('g(E[X])' + rel(G.gE)) + ': different numbers. Average the values ' + tex('g(t)') + ', do not apply ' + tex('g') + ' to the average.'));
      }
      P.g.dataset.v = 'E=' + plain(G.E) + ';gE=' + plain(G.gE) + (m.finite ? ';E1=' + plain(G.E1) : ';ok=' + G.ok);
    }

    /* ---------- E[aX + b] */
    function drawLin(D) {
      const m = D.m, body = P.lin.body, a = D.a, b = D.b;
      Lab.clear(body);
      const bT = (num(b) < 0 ? '' : '+') + tx(b);
      const yTex = linTex(a, b);
      const direct = sum(m.vals.map((t, i) => mul(add(mul(a, t), b), m.ps[i])));
      const short = add(mul(a, m.mean), b);
      body.appendChild(para('You chose ' + tex('a=' + tx(a)) + ' and ' + tex('b=' + tx(b)) + ', so ' + tex('Y=aX+b=' + yTex) + '. Linearity (' + at('L3.2', 17, 0) + ') and translation (' + at('L3.2', 24, 0) + ') say ' + tex('E[aX+b]=aE[X]+b') + '.'));
      body.appendChild(head4('Way 1 · add up ' + tex('(at+b)\\,f_X(t)') + ' over the values of ' + tex('X')));
      if (m.finite) {
        body.appendChild(mline(sumTex('E[' + yTex + ']=\\sum_t (' + pt(a) + 't' + bT + ')\\,f_X(t)', m.vals.map((t, i) => ({ f: '(' + pt(a) + '\\cdot ' + pt(t) + bT + ')\\cdot ' + tx(m.ps[i]), v: mul(add(mul(a, t), b), m.ps[i]), parts: [a, t, b, m.ps[i]] })), { always: true })));
      } else {
        body.appendChild(mline('E[' + yTex + ']=\\sum_t (' + pt(a) + 't' + bT + ')\\,f_X(t)=' + jn(cut(m.vals.map((t, i) => '(' + pt(a) + '\\cdot ' + pt(t) + bT + ')\\cdot ' + tx(m.ps[i])), 8)) + '+\\dots'));
        body.appendChild(mline('=' + pt(a) + '\\sum_t t\\,f_X(t)' + (num(b) < 0 ? '' : '+') + tx(b) + '\\sum_t f_X(t)=' + pt(a) + '\\cdot ' + pt(m.mean) + bT + '\\cdot 1' + relAfter([a, m.mean, b], short)));
      }
      body.appendChild(head4('Way 2 · ' + tex('aE[X]+b')));
      body.appendChild(mline('aE[X]+b=' + pt(a) + '\\cdot ' + pt(m.mean) + bT + relAfter([a, m.mean, b], short)));
      const agree = m.finite ? same(direct, short) : true;
      body.appendChild(verdict(agree, 'Both ways: ' + tex('E[' + yTex + ']' + rel(short)) + '.'));
      if (isZero(a)) body.appendChild(box('note', 'With ' + tex('a=0') + ', ' + tex('Y=' + tx(b)) + ' is a constant: it takes the value ' + tx(b) + ' with probability 1, and ' + tex('E[c]=c') + ' (' + at('L3.2', 5, 40) + ').'));
      if (isZero(short) && !isZero(m.mean) && same(a, F(1))) body.appendChild(box('good', 'Zero mean: ' + tex('Y=X-E[X]') + ' is ' + tex('X') + ' moved left by ' + tex(tx(m.mean)) + ', a zero-mean random variable (' + at('L3.2', 23, 20) + ').'));
      // the PMF of Y = aX + b: the same stems, stretched by a and moved by b
      const yv = new Map();
      m.vals.forEach((t, i) => { const y = add(mul(a, t), b); const k = String(+num(y).toPrecision(12)); if (!yv.has(k)) yv.set(k, { y, p: F(0) }); yv.get(k).p = add(yv.get(k).p, m.ps[i]); });
      const ys = [...yv.values()].sort((u, v) => num(u.y) - num(v.y));
      body.appendChild(head4('The PMF of ' + tex('Y=' + yTex) + ', balanced at ' + tex('aE[X]+b')));
      body.appendChild(chartHost('ex-chart', w => stemChart({ w, vals: ys.map(r => num(r.y)), ps: ys.map(r => num(r.p)), mean: num(short), meanLab: 'E[Y] = ' + txt(short), tone: 'z', name: 'Y' })));
      body.appendChild(para('Every stem of ' + tex('X') + ' at ' + tex('t') + ' moves to ' + tex(tx(a) + '\\cdot t' + bT) + ' with the same height, so the balance point moves the same way: ' + tex(pt(a) + '\\cdot ' + pt(m.mean) + bT + relAfter([a, m.mean, b], short)) + '.', 'small muted'));
      const zero = h('div', { class: 'pl-chips' }, Lab.button('Make it zero-mean: a = 1, b = −E[X]', () => {
        const bb = neg(m.mean);
        st.a = '1'; st.b = plain(bb); good.a = F(1); good.b = norm(bb); errs.a = errs.b = '';
        ctl.a.set('1'); ctl.b.set(plain(bb));
        draw();
      }, 'btn sm'));
      body.appendChild(zero);
      P.lin.dataset.v = 'direct=' + plain(direct) + ';short=' + plain(short);
    }

    /* ---------- two random variables */
    function twoJoint() {
      if (st.mode === 'joint') return good.J;
      const A = good.IX, B = good.IY;
      return { xs: A.vals, ys: B.vals, p: A.vals.map((_, i) => B.vals.map((_, j) => mul(A.ps[i], B.ps[j]))), indepFrom: true };
    }
    function drawTwo() {
      const body = P.two.body;
      Lab.clear(body);
      const J = twoJoint();
      const nx = J.xs.length, ny = J.ys.length;
      const fX = J.xs.map((_, i) => sum(J.p[i])), fY = J.ys.map((_, j) => sum(J.p.map(r => r[j])));
      const EX = sum(J.xs.map((t, i) => mul(t, fX[i]))), EY = sum(J.ys.map((t, j) => mul(t, fY[j])));
      const cells = [];
      J.ys.forEach((y, j) => J.xs.forEach((x, i) => { if (!isZero(J.p[i][j])) cells.push({ x, y, p: J.p[i][j], i, j }); }));
      const zeros = nx * ny - cells.length;
      if (st.mode === 'joint') { const lt = LECTURE_TABLES.find(x => sameJoint(jointFrom(x.j()).J, good.J)); if (lt) body.appendChild(box('note', lt.html)); }
      else if (good.IX.fam === 'uniform' && good.IY.fam === 'uniform' && good.IX.words === 'Uniform{1, …, 6}' && good.IY.words === 'Uniform{1, …, 6}') body.appendChild(box('note', 'Two fair dice, as in ' + at('L3.2', 19, 20) + ': X = first number, Y = second number.'));
      if (st.mode === 'joint') body.appendChild(para('Your joint table: ' + tex('X') + ' across (blue), ' + tex('Y') + ' down (orange), ' + tex('f_{XY}(t_1,t_2)') + ' in the cells; the margins are ' + tex('f_X') + ' (bottom row) and ' + tex('f_Y') + ' (right column).'));
      else body.appendChild(para('Your ' + tex('X\\sim ' + good.IX.tex) + ' and ' + tex('Y\\sim ' + good.IY.tex) + ', independent: every cell is ' + tex('f_{XY}(t_1,t_2)=f_X(t_1)\\,f_Y(t_2)') + '.'));
      if (nx <= 12 && ny <= 12) body.appendChild(jointTable(J, fX, fY));
      else body.appendChild(para('The table has ' + nx + ' × ' + ny + ' = ' + nx * ny + ' cells — too many to draw here; every sum below still uses all of them.', 'small muted'));
      body.appendChild(mline(margTex('X', 't_1', J.xs, fX, i => J.ys.map((_, j) => J.p[i][j]))));
      body.appendChild(mline(margTex('Y', 't_2', J.ys, fY, j => J.xs.map((_, i) => J.p[i][j]))));
      const zNote = zeros ? ' (the ' + plural(zeros, 'cell') + ' with probability 0 add nothing and are left out)' : '';
      // E[X + Y]
      const sumT = cells.map(c => ({ f: '(' + tx(c.x) + (num(c.y) < 0 ? '' : '+') + tx(c.y) + ')\\cdot ' + tx(c.p), v: mul(add(c.x, c.y), c.p), parts: [c.x, c.y, c.p] }));
      const EXY1 = sum(sumT.map(t => t.v));
      body.appendChild(head4(tex('E[X+Y]=E[X]+E[Y]') + ' (' + at('L3.2', 16, 0) + ')'));
      body.appendChild(para('Straight from the table, over the ' + plural(cells.length, 'cell') + zNote + ':'));
      body.appendChild(mline(sumTex('E[X+Y]=\\sum_{t_1,t_2}(t_1+t_2)\\,f_{XY}(t_1,t_2)', sumT, { always: true })));
      body.appendChild(para('From the margins alone:'));
      body.appendChild(mline(sumTex('E[X]=\\sum_{t_1} t_1 f_X(t_1)', J.xs.map((t, i) => ({ f: pt(t) + '\\cdot ' + tx(fX[i]), v: mul(t, fX[i]), parts: [t, fX[i]] })), { always: true })));
      body.appendChild(mline(sumTex('E[Y]=\\sum_{t_2} t_2 f_Y(t_2)', J.ys.map((t, j) => ({ f: pt(t) + '\\cdot ' + tx(fY[j]), v: mul(t, fY[j]), parts: [t, fY[j]] })), { always: true })));
      body.appendChild(mline('E[X]+E[Y]=' + tx(EX) + (num(EY) < 0 ? '' : '+') + tx(EY) + relAfter([EX, EY], add(EX, EY))));
      const indep = indepCheck(J, fX, fY);
      body.appendChild(verdict(same(EXY1, add(EX, EY)), 'Both give ' + tex('E[X+Y]' + rel(EXY1)) + (indep.ok ? '.' : ' — although ' + tex('X') + ' and ' + tex('Y') + ' are dependent here: this rule holds for any ' + tex('X') + ' and ' + tex('Y') + ', independent or not.')));
      // E[XY]
      const prodT = cells.map(c => ({ f: pt(c.x) + '\\cdot ' + pt(c.y) + '\\cdot ' + tx(c.p), v: mul(mul(c.x, c.y), c.p), parts: [c.x, c.y, c.p] }));
      const EXYp = sum(prodT.map(t => t.v));
      const EXEY = mul(EX, EY);
      body.appendChild(head4(tex('E[XY]') + ' against ' + tex('E[X]\\,E[Y]')));
      body.appendChild(mline(sumTex('E[XY]=\\sum_{t_1,t_2}t_1t_2\\,f_{XY}(t_1,t_2)', prodT, { always: true })));
      body.appendChild(mline('E[X]\\,E[Y]=' + pt(EX) + '\\cdot ' + pt(EY) + relAfter([EX, EY], EXEY)));
      const eq = same(EXYp, EXEY);
      let why;
      if (indep.ok) why = tex('X') + ' and ' + tex('Y') + ' are independent (every cell is ' + tex('f_X(t_1)f_Y(t_2)') + '), and then ' + tex('E[XY]=E[X]E[Y]') + ' always (' + at('L3.5', 15, 20) + ').';
      else why = tex('X') + ' and ' + tex('Y') + ' are dependent: the cell ' + tex('(' + tx(indep.x) + ',' + tx(indep.y) + ')') + ' has ' + tex('f_{XY}=' + tx(indep.p)) + ' but ' + tex('f_X(' + tx(indep.x) + ')f_Y(' + tx(indep.y) + ')=' + tx(indep.fx) + '\\cdot ' + tx(indep.fy) + relAfter([indep.fx, indep.fy], indep.prod)) + '. ' + (eq ? 'The two numbers still agree — equal does not prove independence (' + at('L3.5', 16, 20) + ').' : 'So the product rule need not hold, and here it does not.');
      body.appendChild(verdict(eq, (eq ? tex('E[XY]=E[X]E[Y]' + rel(EXEY)) + '. ' : tex('E[XY]' + rel(EXYp)) + ' but ' + tex('E[X]E[Y]' + rel(EXEY)) + '. ') + why));
      // E[g(X, Y)]
      const H = good.h;
      body.appendChild(head4(tex('E[g(X,Y)]') + ' for your ' + tex('g(x,y)') + ' = <code class="ex-code">' + Lab.esc(H.src) + '</code> (' + at('L3.2', 12, 20) + ')'));
      let hv;
      try {
        hv = cells.map(c => ({ c, g: evalAt(H.f, { x: norm(c.x), y: norm(c.y) }, tex('(x,y)=(' + tx(c.x) + ',' + tx(c.y) + ')')) }));
      } catch (e) { body.appendChild(box('bad', Lab.esc(e.message))); P.two.dataset.v = 'EsumDirect=' + plain(EXY1) + ';EX=' + plain(EX) + ';EY=' + plain(EY) + ';EXY=' + plain(EXYp) + ';EXEY=' + plain(EXEY) + ';indep=' + indep.ok; return; }
      const groups = new Map();
      hv.forEach(r => {
        const key = isEx(norm(r.g)) ? norm(r.g).toString() : String(+num(r.g).toPrecision(12));
        if (!groups.has(key)) groups.set(key, { z: r.g, list: [], p: F(0) });
        const gr = groups.get(key);
        gr.list.push(r); gr.p = add(gr.p, r.c.p);
      });
      const gs = [...groups.values()].sort((u, v) => num(u.z) - num(v.z));
      body.appendChild(para('Way 1 · the PMF of ' + tex('Z=g(X,Y)') + ' first: ' + gs.map(gr => tex('P(Z=' + tx(gr.z) + ')=' + (gr.list.length > 1 && gr.list.length <= 8 ? jn(gr.list.map(r => tx(r.c.p))) + relAfter(gr.list.map(r => r.c.p), gr.p) : tx(gr.p)))).join(',&nbsp; ') + '.'));
      const E1 = sum(gs.map(gr => mul(gr.z, gr.p)));
      body.appendChild(mline(sumTex('E[Z]=\\sum_z z\\,f_Z(z)', gs.map(gr => ({ f: pt(gr.z) + '\\cdot ' + tx(gr.p), v: mul(gr.z, gr.p), parts: [gr.z, gr.p] })), { always: true })));
      body.appendChild(para('Way 2 · straight from the joint table:'));
      const E2t = hv.map(r => ({ f: pt(r.g) + '\\cdot ' + tx(r.c.p), v: mul(r.g, r.c.p), parts: [r.g, r.c.p] }));
      const E2 = sum(E2t.map(t => t.v));
      body.appendChild(mline(sumTex('E[g(X,Y)]=\\sum_{t_1,t_2}g(t_1,t_2)\\,f_{XY}(t_1,t_2)', E2t, { always: true })));
      body.appendChild(verdict(same(E1, E2), 'Both ways: ' + tex('E[g(X,Y)]' + rel(E2)) + '.'));
      P.two.dataset.v = 'EsumDirect=' + plain(EXY1) + ';EX=' + plain(EX) + ';EY=' + plain(EY) + ';EXY=' + plain(EXYp) + ';EXEY=' + plain(EXEY) + ';indep=' + indep.ok + ';Eh1=' + plain(E1) + ';Eh2=' + plain(E2);
    }
    function margTex(nm, ix, vals, f, col) {
      const items = vals.map((t, k) => {
        const parts = col(k).filter(v => !isZero(v));
        const sumPart = parts.length > 1 && parts.length <= 6 ? jn(parts.map(tx)) + (parts.every(shownExact) && shownExact(f[k]) ? '=' : '\\approx ') : '';
        return fS(nm) + '(' + tx(t) + ')=' + sumPart + tx(f[k]);
      });
      return cut(items, 12).join(',\\allowbreak\\ ');
    }
    function indepCheck(J, fX, fY) {
      for (let j = 0; j < J.ys.length; j++) for (let i = 0; i < J.xs.length; i++) {
        const prod = mul(fX[i], fY[j]);
        if (!same(J.p[i][j], prod)) return { ok: false, x: J.xs[i], y: J.ys[j], p: J.p[i][j], fx: fX[i], fy: fY[j], prod };
      }
      return { ok: true };
    }
    function jointTable(J, fX, fY) {
      const t = h('table', { class: 'tbl ex-tbl ex-joint' });
      const hr = h('tr', {}, h('th', { class: 'ex-corner', html: tex('Y\\backslash X') }));
      J.xs.forEach(x => hr.appendChild(h('th', { class: 'ex-xh', html: tex(tx(x)) })));
      hr.appendChild(h('th', { class: 'ex-mh', html: tex('f_Y') }));
      t.appendChild(h('thead', {}, hr));
      const tb = h('tbody');
      J.ys.forEach((y, j) => {
        const tr = h('tr', {}, h('th', { class: 'ex-yh', html: tex(tx(y)) }));
        J.xs.forEach((_, i) => tr.appendChild(h('td', { class: isZero(J.p[i][j]) ? 'ex-zero' : '', html: tex(tx(J.p[i][j])) })));
        tr.appendChild(h('td', { class: 'ex-m', html: tex(tx(fY[j])) }));
        tb.appendChild(tr);
      });
      const fr = h('tr', { class: 'ex-foot' }, h('th', { class: 'ex-mh', html: tex('f_X') }));
      J.xs.forEach((_, i) => fr.appendChild(h('td', { class: 'ex-m', html: tex(tx(fX[i])) })));
      fr.appendChild(h('td', { class: 'ex-m', html: tex(tx(sum(fX))) }));
      tb.appendChild(fr);
      t.appendChild(tb);
      return h('div', { class: 'tbl-wrap ex-tw' }, t);
    }

    /* ---------- simulation */
    function newSim(m) { return { m, N: 0, counts: new Map(), runSum: 0, avgs: [], first: [] }; }
    function drawMore(n) {
      if (!sim) sim = newSim(good.X);
      const cap = 200000;
      n = Math.max(0, Math.min(n, cap - sim.N));
      const m = sim.m;
      for (let k = 0; k < n; k++) {
        const v = m.sample();
        const key = plain(v);
        let c = sim.counts.get(key);
        if (!c) { c = { t: v, c: 0 }; sim.counts.set(key, c); }
        c.c++;
        sim.N++;
        sim.runSum += num(v);
        sim.avgs.push(sim.runSum / sim.N);
        if (sim.first.length < 12) sim.first.push(v);
      }
    }
    function drawSim(more) {
      const body = P.sim.body;
      if (!sim || sim.m !== good.X) { sim = newSim(good.X); drawMore(st.n); }
      else if (more) drawMore(st.n);
      Lab.clear(body);
      const m = sim.m;
      const nField = K.numField({ label: 'Draws per click ' + tex('n'), min: 1, max: 10000, step: 1, value: st.n, onChange: v => { st.n = Math.max(1, Math.min(10000, Math.round(v))); save(); } });
      const btns = h('div', { class: 'pl-chips ex-simbtns' },
        Lab.button('Draw n more', () => drawSim(true), 'btn primary sm'),
        Lab.button('Start over', () => { sim = newSim(good.X); drawMore(st.n); drawSim(false); }, 'btn sm'));
      if (sim.N >= 200000) btns.firstChild.disabled = true;
      body.append(nField, btns);
      const cs = [...sim.counts.values()].sort((u, v) => num(u.t) - num(v.t));
      const S = sum(cs.map(c => mul(c.t, F(c.c))));
      const avg = div(S, F(sim.N));
      const run = sim;   // the chart keeps its own run (a redraw after X changed must not read the next one)
      body.appendChild(chartHost('ex-chart', w => simChart({ w, avgs: run.avgs, mean: num(m.mean), meanLab: 'E[X] = ' + txt(m.mean) })));
      body.appendChild(para('Your first draws: ' + tex(sim.first.map(tx).join(',\\allowbreak\\ ') + (sim.N > sim.first.length ? ',\\ \\dots' : '')) + '.'));
      body.appendChild(para('After ' + tex('N=' + K.intTex(sim.N)) + ' draws the values add up to ' + tex('S=' + tx(S)) + ', so the average is'));
      body.appendChild(mline('\\bar{x}=\\frac{S}{N}=\\frac{' + tx(S) + '}{' + sim.N + '}' + (!shownExact(S) ? '\\approx ' + dec(avg) : isEx(norm(avg)) && norm(S).d === 1 && norm(avg).d === sim.N ? (Number(dec(avg)) === num(avg) ? '=' : '\\approx ') + dec(avg) : rel(avg))));
      const freqT = cs.map(c => ({ f: pt(c.t) + '\\cdot\\frac{' + c.c + '}{' + sim.N + '}', v: mul(c.t, F(c.c, sim.N)), parts: [c.t] }));
      body.appendChild(para('The same average, value by value — the definition of ' + tex('E[X]') + ' with the share of draws (count ÷ N) in place of ' + tex('f_X(t)') + ':'));
      body.appendChild(mline(sumTex('\\bar{x}=\\sum_t t\\cdot\\frac{\\text{count of }t}{N}', freqT, { total: avg, always: true })));
      const gap = sub(avg, m.mean);
      body.appendChild(mline('\\bar{x}-E[X]=' + tx(avg) + '-' + pt(m.mean) + relAfter([avg, m.mean], gap)));
      body.appendChild(para('Press “Draw n more”: the line flattens out at ' + tex('E[X]') + '. The gap shrinks roughly like ' + tex('1/\\sqrt{N}') + ', so 100 times more draws make it about 10 times smaller.' + (sim.N >= 200000 ? ' (The lab stops at 200,000 draws.)' : ''), 'small muted'));
      P.sim.dataset.v = 'N=' + sim.N + ';S=' + plain(S) + ';avg=' + plain(avg) + ';last=' + sim.avgs[sim.avgs.length - 1] + ';mean=' + plain(m.mean);
    }

    /* ---------- charts (layout pixels) */
    function niceStep(span, target) {
      const raw = span / Math.max(1, target), mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
      return (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    }
    function stemChart(o) {
      const W = o.w, H = 236, pl = 46, pr = 18, ptp = 30, pb = 52;
      const vals = o.vals, ps = o.ps;
      let lo = Math.min(o.mean, ...vals), hi = Math.max(o.mean, ...vals);
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.06 + 0.3;
      lo -= pad; hi += pad;
      const X = v => pl + ((v - lo) / (hi - lo)) * (W - pl - pr);
      const pmax = Math.max(...ps, 1e-12) * 1.12;
      const Y = v => ptp + (1 - v / pmax) * (H - ptp - pb);
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ex-svg', role: 'img', 'aria-label': 'PMF of ' + o.name + ' with its expected value marked' });
      s.style.maxWidth = W + 'px';
      const ystep = niceStep(pmax, 4);
      for (let v = 0; v <= pmax + 1e-12; v += ystep) {
        s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), class: 'ex-grid' }));
        s.appendChild(svg('text', { x: pl - 7, y: Y(v) + 4, 'text-anchor': 'end', class: 'ex-tick' }, fmtTick(v)));
      }
      const y0 = Y(0);
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: y0, y2: y0, class: 'ex-axis' }));
      // value labels: every value when they fit, else round numbers
      const lab = v => fmtTick(v);
      const wOf = str => str.length * 7 + 8;
      const xs = vals.map(X);
      let fits = true;
      for (let i = 1; i < vals.length; i++) if (xs[i] - xs[i - 1] < (wOf(lab(vals[i])) + wOf(lab(vals[i - 1]))) / 2) { fits = false; break; }
      if (fits && vals.length <= 40) vals.forEach((v, i) => s.appendChild(svg('text', { x: xs[i], y: H - 12, 'text-anchor': 'middle', class: 'ex-tick ex-tx' }, lab(v))));
      else {
        const stp = niceStep(hi - lo, Math.max(3, Math.floor((W - pl - pr) / 60)));
        for (let k = Math.ceil(lo / stp); k * stp <= hi; k++) { const v = k * stp; s.appendChild(svg('text', { x: X(v), y: H - 12, 'text-anchor': 'middle', class: 'ex-tick ex-tx' }, lab(v))); }
      }
      // the stems
      vals.forEach((v, i) => {
        const g = svg('g', { class: 'ex-stem tone-' + o.tone });
        g.appendChild(svg('line', { x1: xs[i], x2: xs[i], y1: y0, y2: Y(ps[i]), class: 'ex-stick' }));
        g.appendChild(svg('circle', { cx: xs[i], cy: Y(ps[i]), r: vals.length > 40 ? 2.6 : 4.2, class: 'ex-dot' }));
        g.appendChild(svg('title', {}, 'P(' + o.name + ' = ' + lab(v) + ') ≈ ' + (ps[i] < 5e-4 && ps[i] > 0 ? ps[i].toExponential(3) : Lab.fmtDec(ps[i], 4))));
        s.appendChild(g);
      });
      // E[X]: a line, its label and a fulcrum under the axis
      const xm = X(o.mean);
      s.appendChild(svg('line', { x1: xm, x2: xm, y1: ptp - 8, y2: y0, class: 'ex-mean' }));
      s.appendChild(svg('path', { d: 'M' + xm + ',' + (y0 + 2) + 'L' + (xm - 10) + ',' + (y0 + 17) + 'L' + (xm + 10) + ',' + (y0 + 17) + 'Z', class: 'ex-fulcrum' }));
      const lw = o.meanLab.length * 7.4;
      const lx = Math.max(pl + lw / 2, Math.min(W - pr - lw / 2, xm));
      s.appendChild(svg('text', { x: lx, y: ptp - 13, 'text-anchor': 'middle', class: 'ex-mean-lab' }, o.meanLab));
      return s;
    }
    function simChart(o) {
      const W = o.w, H = 230, pl = 52, pr = 18, ptp = 18, pb = 36;
      const A = o.avgs, N = A.length;
      let lo = o.mean, hi = o.mean;
      const step = Math.max(1, Math.floor(N / 900));
      const pts = [];
      for (let k = 0; k < N; k += step) pts.push([k + 1, A[k]]);
      if (N && pts[pts.length - 1][0] !== N) pts.push([N, A[N - 1]]);
      pts.forEach(p => { if (p[1] < lo) lo = p[1]; if (p[1] > hi) hi = p[1]; });
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const pad = (hi - lo) * 0.08;
      lo -= pad; hi += pad;
      const X = n => pl + ((n - 1) / Math.max(1, N - 1)) * (W - pl - pr);
      const Y = v => ptp + ((hi - v) / (hi - lo)) * (H - ptp - pb);
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'ex-svg', role: 'img', 'aria-label': 'running average of the draws' });
      s.style.maxWidth = W + 'px';
      const ys = niceStep(hi - lo, 4);
      for (let k = Math.ceil(lo / ys); k * ys <= hi; k++) {
        const v = k * ys;
        s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(v), y2: Y(v), class: 'ex-grid' }));
        s.appendChild(svg('text', { x: pl - 7, y: Y(v) + 4, 'text-anchor': 'end', class: 'ex-tick' }, fmtTick(v)));
      }
      const xs = niceStep(Math.max(1, N - 1), Math.max(3, Math.floor((W - pl - pr) / 80)));
      for (let k = 0; k * xs <= N; k++) {
        const n = Math.max(1, k * xs);
        s.appendChild(svg('text', { x: X(n), y: H - 12, 'text-anchor': 'middle', class: 'ex-tick' }, K.fmtInt(n)));
      }
      s.appendChild(svg('text', { x: W - pr, y: H - 0.5, 'text-anchor': 'end', class: 'ex-tick ex-ax' }, 'number of draws'));
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(o.mean), y2: Y(o.mean), class: 'ex-mean' }));
      s.appendChild(svg('text', { x: W - pr - 4, y: Y(o.mean) - 6, 'text-anchor': 'end', class: 'ex-mean-lab' }, o.meanLab));
      if (pts.length) s.appendChild(svg('polyline', { points: pts.map(p => X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' '), class: 'ex-run' }));
      if (N) s.appendChild(svg('circle', { cx: X(N), cy: Y(A[N - 1]), r: 4, class: 'ex-run-dot' }));
      return s;
    }
  }

  Lab.lab({
    id: 'lab-s2-expect', course: 's2', week: 3, order: 1,
    title: 'Expected value lab', sub: 'Week 3 · L3.1–L3.3',
    topics: ['expected value', 'E[g(X)]', 'linearity', 'E[X + Y]', 'E[XY]', 'simulation'],
    desc: 'Pick or type a distribution and see E[X] = Σ t·P(X = t) term by term, the PMF balance at E[X], E[g(X)] next to g(E[X]), E[aX + b], E[X + Y] and E[XY] from a joint table, and a simulation whose average settles at E[X].',
    render: host => expectLab(host),
  });
})();
