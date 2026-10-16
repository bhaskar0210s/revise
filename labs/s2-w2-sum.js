/* Playground lab (s2-w2-sum): Z = X + Y for the learner's own X and Y (L2.8, L2.10).
   Star grid with the line x + y = z, the convolution term by term with the learner's numbers, the PMF and CDF
   of Z (and the CDFs of X and Y), the check E[Z] = E[X] + E[Y], and the known results (Binomial, Poisson,
   Geometric and Negative binomial, Uniform sums, and X given X + Y = n for Poissons).
   This file also defines Lab.play.t4b: exact/float arithmetic, number formatting, distribution models (with the
   negative binomial), the joint-table reader and the star grid. labs/s2-w2-maxmin.js uses it; the manifest loads that file right after this one. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const tex = s => Lab.tex(String(s));

  /* ======================================================================= shared kit */
  const U = (function () {
    const Frac = Lab.Frac;
    const SAFE = Number.MAX_SAFE_INTEGER;
    const okN = x => Math.abs(x) <= SAFE;
    const isEx = v => v instanceof Frac && !v.approx;
    /** an exact fraction stays a Frac; anything else becomes a plain number */
    const norm = v => (v instanceof Frac ? (v.approx ? v.valueOf() : v) : Number(v));
    const num = v => Number(norm(v));
    /* exact while the integers stay safe, otherwise floating point (never a wrong "exact" fraction) */
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
    function pow(a, k) {
      a = norm(a);
      if (!isEx(a)) return Math.pow(a, k);
      let r = F(1);
      for (let i = 0; i < k; i++) { r = mul(r, a); if (!isEx(r)) return Math.pow(a.valueOf(), k); }
      return r;
    }
    const sum = arr => arr.reduce((s, v) => add(s, v), F(0));
    /** an integer as an exact Frac when it is a safe integer, else a plain number (Frac cannot hold it) */
    const fi = v => (Number.isSafeInteger(v) ? F(v) : Number(v));
    const isZero = v => num(v) === 0;
    function same(a, b, tol = 1e-11) {
      a = norm(a); b = norm(b);
      if (isEx(a) && isEx(b)) return a.eq(b);
      return Math.abs(Number(a) - Number(b)) <= tol * Math.max(1, Math.abs(Number(a)));
    }
    const range = (a, b) => { const r = []; for (let v = a; v <= b; v++) r.push(v); return r; };
    const fact = k => { let r = 1; for (let i = 2; i <= k; i++) r *= i; return r; };
    /** C(n, k) worked out exactly (BigInt); past 2^53 the number is rounded, and fi() then keeps it a plain number */
    function chooseN(n, k) {
      if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return 0;
      k = Math.min(k, n - k);
      let r = 1n;
      for (let i = 1; i <= k; i++) r = (r * BigInt(n - k + i)) / BigInt(i);
      return Number(r);
    }

    /* ------------------------------------------------------------ formatting (TeX) */
    function sci(x) {
      const [m, e] = x.toExponential(2).split('e');
      return m.replace(/\.?0+$/, '') + '\\times10^{' + Number(e) + '}';
    }
    /** decimal TeX: 4 places; tiny values in scientific form; a value that is not exactly 1 is never shown as 1 */
    function dec(v, dp = 4) {
      const x = num(v);
      if (!isFinite(x)) return '\\text{?}';
      if (x === 0) return '0';
      const a = Math.abs(x);
      if (a < 5e-4) return (x < 0 ? '-' : '') + sci(a);
      const s = Lab.fmtDec(x, dp);
      if (s === '1' && x < 1) return '1-' + sci(1 - x);
      return Number(s) === x ? s : x.toFixed(dp);   // a rounded value keeps all its places: 0.2240, not 0.224
    }
    /** a number inside a formula: the exact fraction when its denominator is short, else a decimal */
    function tx(v, maxD = 99999) {
      v = norm(v);
      if (isEx(v)) {
        if (v.d === 1) return String(v.n);
        if (v.d <= maxD) return v.tex();
      }
      return dec(v);
    }
    /** a result with its sign: "= 5/36 ≈ 0.1389", "= 1/4 = 0.25", or "≈ 0.2240" when it is not exact */
    function rel(v) {
      v = norm(v);
      if (isEx(v)) {
        if (v.d === 1) return '=' + v.n;
        const d = dec(v);
        const same = Number(d) === v.valueOf();
        if (v.d <= 1e7) return '=' + v.tex() + (same ? '=' : '\\approx ') + d;
        return (same ? '=' : '\\approx ') + d;
      }
      const d = dec(v);
      return (Number(d) === v ? '=' : '\\approx ') + d;
    }
    /** "c/T = reduced ≈ decimal": a count c out of T equally likely cases */
    function overTex(c, T) {
      const it = v => (Math.abs(v) >= 10000 ? K.intTex(v) : String(v));
      if (!c) return '\\frac{0}{' + it(T) + '}=0';
      if (!okN(c) || !okN(T)) return dec(c / T);
      const f = F(c, T);
      let s = '\\frac{' + it(c) + '}{' + it(T) + '}';
      if (f.d === 1) return s + '=' + f.n;
      if (f.d !== T) s += '=' + (f.d <= 99999 ? f.tex() : dec(f));
      const d = dec(f);
      return s + (Number(d) === f.valueOf() ? '=' : '\\approx ') + d;
    }
    /** full-precision plain text: "5/36" or "0.22404180765538775" (data attributes and tooltips) */
    const plain = v => { v = norm(v); return isEx(v) ? v.toString() : String(v); };
    /** plain text (tooltips, messages) */
    const txt = v => { v = norm(v); return isEx(v) ? v.toString() : (v !== 0 && Math.abs(v) < 5e-4 ? v.toExponential(2) : Lab.fmtDec(v, 4)); };
    /** label above a bar: short fraction or 3 decimals */
    function barLab(v) {
      v = norm(v);
      if (isEx(v) && v.d <= 999) return v.d === 1 ? String(v.n) : v.tex();
      const x = Number(v);
      if (x === 0) return '0';
      if (x < 0.001) return '{<}0.001';
      return Lab.fmtDec(x, 3);
    }
    const par = v => (v < 0 ? '(' + v + ')' : String(v));
    /** "1,2,3" or "1,2,\dots,6" or "0,1,2,\dots" */
    function setTex(lo, hi) {
      if (hi === Infinity) return lo + ',' + (lo + 1) + ',' + (lo + 2) + ',\\dots';
      if (hi - lo <= 3) return range(lo, hi).join(',');
      return lo + ',' + (lo + 1) + ',\\dots,' + hi;
    }
    /** inline list of pairs (x, y) */
    function pairsHtml(list) {
      const f = q => Lab.tex('(' + q.x + ',' + q.y + ')');
      if (list.length <= 10) return list.map(f).join(', ');
      return list.slice(0, 4).map(f).join(', ') + ', …, ' + list.slice(-2).map(f).join(', ');
    }

    /* ---------------------------------------------- distributions on whole numbers */
    const fS = nm => 'f_{' + nm + '}', FS = nm => 'F_{' + nm + '}';
    function listPmfTex(m) {
      const vs = m.vals.filter(v => !isZero(m.pmf(v)));
      const items = vs.map(v => fS(m.nm) + '(' + v + ')=' + tx(m.pmf(v)));
      return items.length <= 6 ? items.join(',\\ ') : items.slice(0, 3).join(',\\ ') + ',\\ \\dots,\\ ' + items[items.length - 1];
    }
    function meanSumTex(m) {
      const vs = m.vals.filter(v => !isZero(m.pmf(v)));
      const terms = vs.map(v => par(v) + '\\cdot ' + tx(m.pmf(v)));
      const shown = terms.length <= 6 ? terms.join('+') : terms.slice(0, 2).join('+') + '+\\dots+' + terms[terms.length - 1];
      return 'E[' + m.nm + ']=\\sum_x x\\,' + fS(m.nm) + '(x)=' + shown + rel(m.mean);
    }
    function cdfSumTex(m, t) {
      const head = FS(m.nm) + '(' + t + ')=P(' + m.nm + '\\le ' + t + ')';
      const vs = m.vals.filter(v => v <= t && !isZero(m.pmf(v)));
      if (!vs.length) return head + '=0';
      if (vs.length === 1) return head + '=' + fS(m.nm) + '(' + vs[0] + ')' + rel(m.cdf(t));
      const terms = vs.map(v => tx(m.pmf(v)));
      return head + '=' + (terms.length <= 6 ? terms.join('+') : '\\sum_{x\\le ' + t + '}' + fS(m.nm) + '(x)') + rel(m.cdf(t));
    }
    function tailSumTex(m, t) {
      const head = 'P(' + m.nm + '\\ge ' + t + ')';
      if (t <= m.lo) return head + '=1';
      if (t > m.hi) return head + '=0';
      return head + '=1-' + FS(m.nm) + '(' + (t - 1) + ')=1-' + tx(m.cdf(t - 1)) + rel(m.tail(t));
    }
    /** a distribution with finitely many values (sorted whole numbers) */
    function finite(nm, vals, ps) {
      const map = new Map();
      vals.forEach((v, i) => map.set(v, norm(ps[i])));
      const cum = new Map();
      let acc = F(0);
      vals.forEach(v => { acc = add(acc, map.get(v)); cum.set(v, acc); });
      const m = { nm, finite: true, lo: vals[0], hi: vals[vals.length - 1], vals: vals.slice(), params: {}, fam: 'custom' };
      m.show = m.hi;
      m.pmf = k => (map.has(k) ? map.get(k) : F(0));
      m.cdf = t => { let r = F(0); for (const v of vals) { if (v <= t) r = cum.get(v); else break; } return r; };
      m.tail = t => sum(vals.filter(v => v >= t).map(v => map.get(v)));
      m.mean = sum(vals.map(v => mul(F(v), map.get(v))));
      m.notDrawn = F(0);
      m.defTex = listPmfTex(m);
      m.meanTex = meanSumTex(m);
      m.cdfTex = t => cdfSumTex(m, t);
      m.tailTex = t => tailSumTex(m, t);
      m.tex = '\\text{your PMF}';
      m.words = 'your PMF';
      return m;
    }
    function uniform(nm, a, b) {
      const lo = Math.min(a, b), hi = Math.max(a, b), n = hi - lo + 1;
      const vals = range(lo, hi);
      const m = finite(nm, vals, vals.map(() => F(1, n)));
      m.fam = 'uniform'; m.params = { a: lo, b: hi, n };
      m.tex = '\\text{Uniform}\\{' + setTex(lo, hi) + '\\}';
      m.words = 'Uniform{' + lo + ', …, ' + hi + '}';
      m.defTex = fS(nm) + '(x)=\\frac{1}{b-a+1}=\\frac{1}{' + hi + '-' + par(lo) + '+1}=' + F(1, n).tex() + '\\ \\text{ for } x=' + setTex(lo, hi);
      m.meanTex = 'E[' + nm + ']=\\frac{a+b}{2}=\\frac{' + lo + '+' + par(hi) + '}{2}' + rel(m.mean);
      m.cdfTex = t => {
        const head = FS(nm) + '(' + t + ')=P(' + nm + '\\le ' + t + ')';
        if (t < lo) return head + '=0';
        if (t >= hi) return head + '=1';
        return head + '=\\frac{t-a+1}{b-a+1}=\\frac{' + t + '-' + par(lo) + '+1}{' + n + '}' + rel(m.cdf(t));
      };
      m.tailTex = t => {
        const head = 'P(' + nm + '\\ge ' + t + ')';
        if (t <= lo) return head + '=1';
        if (t > hi) return head + '=0';
        return head + '=\\frac{b-t+1}{b-a+1}=\\frac{' + hi + '-' + par(t) + '+1}{' + n + '}' + rel(m.tail(t));
      };
      return m;
    }
    function bernoulli(nm, p) {
      const q = sub(F(1), p);
      const m = finite(nm, [0, 1], [q, p]);
      m.fam = 'bernoulli'; m.params = { p, q, n: 1 };
      m.tex = '\\text{Bernoulli}(' + tx(p) + ')';
      m.words = 'Bernoulli(' + txt(p) + ')';
      m.defTex = fS(nm) + '(1)=p=' + tx(p) + ',\\quad ' + fS(nm) + '(0)=1-p=' + tx(q);
      m.meanTex = 'E[' + nm + ']=0\\cdot(1-p)+1\\cdot p=p' + rel(p);
      return m;
    }
    function binomial(nm, n, p) {
      const q = sub(F(1), p);
      const vals = range(0, n);
      const m = finite(nm, vals, vals.map(k => mul(mul(fi(Lab.math.choose(n, k)), pow(p, k)), pow(q, n - k))));
      m.fam = 'binomial'; m.params = { p, q, n };
      m.tex = '\\text{Bin}(' + n + ',' + tx(p) + ')';
      m.words = 'Bin(' + n + ', ' + txt(p) + ')';
      m.defTex = fS(nm) + '(x)=\\binom{n}{x}p^{x}(1-p)^{n-x}=\\binom{' + n + '}{x}\\left(' + tx(p) + '\\right)^{x}\\left(' + tx(q) + '\\right)^{' + n + '-x},\\ x=' + setTex(0, n);
      m.meanTex = 'E[' + nm + ']=np=' + n + '\\cdot ' + tx(p) + rel(m.mean);
      return m;
    }
    function geometric(nm, p, show) {
      const q = sub(F(1), p);
      const cache = new Map();
      const m = { nm, fam: 'geometric', finite: false, lo: 1, hi: Infinity, show, params: { p, q } };
      m.pmf = k => {
        if (!Number.isInteger(k) || k < 1) return F(0);
        if (!cache.has(k)) cache.set(k, mul(pow(q, k - 1), p));
        return cache.get(k);
      };
      m.cdf = t => (t < 1 ? F(0) : sub(F(1), pow(q, Math.floor(t))));
      m.tail = t => (t <= 1 ? F(1) : pow(q, Math.ceil(t) - 1));
      m.mean = div(F(1), p);
      m.vals = range(1, show);
      m.notDrawn = m.tail(show + 1);
      m.tex = '\\text{Geometric}(' + tx(p) + ')';
      m.words = 'Geometric(' + txt(p) + ')';
      m.defTex = fS(nm) + '(x)=(1-p)^{x-1}p=\\left(' + tx(q) + '\\right)^{x-1}\\cdot ' + tx(p) + ',\\ x=1,2,3,\\dots';
      m.meanTex = 'E[' + nm + ']=\\frac{1}{p}=\\frac{1}{' + tx(p) + '}' + rel(m.mean);
      m.cdfTex = t => {
        const head = FS(nm) + '(' + t + ')=P(' + nm + '\\le ' + t + ')';
        if (t < 1) return head + '=0';
        return head + '=1-(1-p)^{' + t + '}=1-\\left(' + tx(q) + '\\right)^{' + t + '}' + rel(m.cdf(t));
      };
      m.tailTex = t => {
        const head = 'P(' + nm + '\\ge ' + t + ')';
        if (t <= 1) return head + '=1';
        return head + '=(1-p)^{' + t + '-1}=\\left(' + tx(q) + '\\right)^{' + (t - 1) + '}' + rel(m.tail(t));
      };
      return m;
    }
    /** Negative binomial(r, p) on {r, r+1, …}: the trial on which the r-th success comes (L2.10 exercises) */
    function negbin(nm, r, p, show) {
      const q = sub(F(1), p);
      const cache = new Map();
      const m = { nm, fam: 'negbin', finite: false, lo: r, hi: Infinity, show: Math.max(r, show), params: { r, p, q } };
      m.pmf = k => {
        if (!Number.isInteger(k) || k < r) return F(0);
        if (!cache.has(k)) cache.set(k, mul(mul(fi(chooseN(k - 1, r - 1)), pow(p, r)), pow(q, k - r)));
        return cache.get(k);
      };
      // F(t): the bars r … t added (no subtraction, so tiny values keep their digits)
      m.cdf = t => { t = Math.floor(t); if (t < r) return F(0); let s = F(0); for (let k = r; k <= t; k++) s = add(s, m.pmf(k)); return s; };
      // P(X ≥ t) = P(fewer than r successes in the first t − 1 trials): a finite sum of r binomial terms
      m.tail = t => {
        t = Math.ceil(t);
        if (t <= r) return F(1);
        let s = F(0);
        for (let j = 0; j <= r - 1; j++) s = add(s, mul(mul(fi(chooseN(t - 1, j)), pow(p, j)), pow(q, t - 1 - j)));
        return s;
      };
      m.mean = div(F(r), p);
      m.vals = range(r, m.show);
      m.notDrawn = m.tail(m.show + 1);
      m.tex = '\\text{NegBin}(' + r + ',' + tx(p) + ')';
      m.words = 'NegBin(' + r + ', ' + txt(p) + ')';
      m.defTex = fS(nm) + '(x)=\\binom{x-1}{r-1}p^{r}(1-p)^{x-r}=\\binom{x-1}{' + (r - 1) + '}\\left(' + tx(p) + '\\right)^{' + r + '}\\left(' + tx(q) + '\\right)^{x-' + r + '},\\ x=' + setTex(r, Infinity);
      m.meanTex = 'E[' + nm + ']=\\frac{r}{p}=\\frac{' + r + '}{' + tx(p) + '}' + rel(m.mean);
      m.cdfTex = t => {
        const head = FS(nm) + '(' + t + ')=P(' + nm + '\\le ' + t + ')';
        if (t < r) return head + '=0';
        const top = Math.floor(t);
        if (top === r) return head + '=' + fS(nm) + '(' + r + ')' + rel(m.cdf(t));
        const terms = range(r, top).map(k => tx(m.pmf(k)));
        return head + '=' + (terms.length <= 5 ? terms.join('+') : '\\sum_{x=' + r + '}^{' + top + '}' + fS(nm) + '(x)') + rel(m.cdf(t));
      };
      m.tailTex = t => tailSumTex(m, t);
      return m;
    }
    function poisson(nm, lam, show) {
      lam = Math.round(lam * 1e6) / 1e6;
      const L = Lab.fmtDec(lam, 4);
      const lnf = [0];
      const lnFact = k => { while (lnf.length <= k) lnf.push(lnf[lnf.length - 1] + Math.log(lnf.length)); return lnf[k]; };
      const pmf = k => (Number.isInteger(k) && k >= 0 ? Math.exp(-lam + k * Math.log(lam) - lnFact(k)) : 0);
      const cum = [];
      const cdf = t => {
        if (t < 0) return 0;
        const k = Math.floor(t);
        while (cum.length <= k) cum.push((cum.length ? cum[cum.length - 1] : 0) + pmf(cum.length));
        return Math.min(1, cum[k]);
      };
      const tail = t => {
        if (t <= 0) return 1;
        let k = Math.ceil(t), s = 0;
        for (let i = 0; i < 6000; i++, k++) { const v = pmf(k); s += v; if (k > lam + 1 && v <= s * 1e-17) break; }
        return Math.min(1, s);
      };
      const m = { nm, fam: 'poisson', finite: false, lo: 0, hi: Infinity, show, params: { lam, L } };
      m.pmf = pmf; m.cdf = cdf; m.tail = tail; m.mean = lam;
      m.vals = range(0, show);
      m.notDrawn = tail(show + 1);
      m.tex = '\\text{Poisson}(' + L + ')';
      m.words = 'Poisson(' + L + ')';
      m.defTex = fS(nm) + '(x)=\\frac{e^{-\\lambda}\\lambda^{x}}{x!}=\\frac{e^{-' + L + '}\\,' + L + '^{x}}{x!},\\ x=0,1,2,\\dots';
      m.meanTex = 'E[' + nm + ']=\\lambda' + rel(lam);
      m.cdfTex = t => {
        const head = FS(nm) + '(' + t + ')=P(' + nm + '\\le ' + t + ')';
        if (t < 0) return head + '=0';
        const k = Math.floor(t);
        if (k === 0) return head + '=e^{-' + L + '}' + rel(cdf(0));
        const terms = range(0, Math.min(k, 3)).map(j => dec(pmf(j)));
        const shown = k <= 3 ? terms.join('+') : terms.slice(0, 2).join('+') + '+\\dots+' + dec(pmf(k));
        return head + '=\\sum_{j=0}^{' + k + '}\\frac{e^{-' + L + '}\\,' + L + '^{j}}{j!}=' + shown + rel(cdf(t));
      };
      m.tailTex = t => {
        const head = 'P(' + nm + '\\ge ' + t + ')';
        if (t <= 0) return head + '=1';
        return head + '=1-' + FS(nm) + '(' + (t - 1) + ')=1-' + dec(cdf(t - 1)) + rel(tail(t));
      };
      return m;
    }

    /* the picker's parameter names (K.FAMILIES) */
    const SHOW = 'shown up to k', LAM = 'λ';
    /** spec {fam, q, custom} (as stored) → {m} or {err} */
    function fromSpec(spec, nm) {
      const q = (spec && spec.q) || {};
      const prob = s => (s instanceof Frac ? s : K.parseProb(String(s)));
      const int = (v, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? x : d; };
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
            return { m: bernoulli(nm, p) };
          }
          case 'binomial': {
            const p = prob(q.p), n = int(q.n, 4);
            if (!p) return { err: 'Type p for ' + nm + ' as a number from 0 to 1.' };
            if (n < 1 || n > 40) return { err: 'n for ' + nm + ' must be a whole number from 1 to 40.' };
            return { m: binomial(nm, n, p) };
          }
          case 'geometric': {
            const p = prob(q.p);
            if (!p) return { err: 'Type p for ' + nm + ' as a number from 0 to 1.' };
            if (num(p) === 0) return { err: 'Geometric(0) is not a distribution: with p = 0 the first success never comes. Choose p > 0 for ' + nm + '.' };
            return { m: geometric(nm, p, Math.max(3, int(q[SHOW], 10))) };
          }
          case 'negbin': {
            const p = prob(q.p), r = int(q.r, 2);
            if (!p) return { err: 'Type p for ' + nm + ' as a number from 0 to 1.' };
            if (num(p) === 0) return { err: 'NegBin(r, 0) is not a distribution: with p = 0 no success ever comes. Choose p > 0 for ' + nm + '.' };
            if (r < 1 || r > 20) return { err: 'r for ' + nm + ' must be a whole number from 1 to 20.' };
            return { m: negbin(nm, r, p, Math.max(3, int(q[SHOW], 12))) };
          }
          case 'poisson': {
            const lam = Number(q[LAM]);
            if (!(lam > 0)) return { err: 'λ for ' + nm + ' must be more than 0.' };
            return { m: poisson(nm, lam, Math.max(3, int(q[SHOW], 12))) };
          }
          case 'custom': return customFrom(spec.custom, nm);
          default: return { err: 'Unknown distribution for ' + nm + '.' };
        }
      } catch (e) { return { err: 'Could not read the distribution of ' + nm + ': ' + e.message }; }
    }
    function customFrom(c, nm) {
      if (!c || !c.vals || !c.vals.length) return { err: 'Type at least one value for ' + nm + '.' };
      const vals = c.vals.map(Number);
      const ps = (c.probs || []).map(s => (s instanceof Frac ? s : K.parseNum(String(s))));
      if (ps.length !== vals.length || ps.some(p => p == null || num(p) < 0)) return { err: 'Fix the red boxes in the PMF of ' + nm + '.' };
      if (vals.some(v => !Number.isInteger(v))) return { err: 'Use whole numbers as the values of ' + nm + ': the sums, the grid and the CDF steps here work on whole numbers, as in L2.8–L2.11.' };
      if (new Set(vals).size !== vals.length) return { err: 'Each value of ' + nm + ' may appear only once.' };
      const lo = Math.min(...vals), hi = Math.max(...vals);
      if (hi - lo > 60 || Math.abs(lo) > 500 || Math.abs(hi) > 500) return { err: 'Keep the values of ' + nm + ' within 60 of each other, so the grid can be drawn.' };
      const tot = sum(ps);
      if (!same(tot, F(1))) return { err: 'The probabilities of ' + nm + ' add up to ' + txt(tot) + ', not 1. Press "Rescale to total 1" or edit them.' };
      const order = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
      return { m: finite(nm, order.map(i => vals[i]), order.map(i => ps[i])) };
    }
    /** stored spec from a K.distPicker result */
    function specFromPick(r) {
      if (!r.fam) return { fam: 'custom', custom: { vals: r.dist.vals.slice(), probs: r.dist.p.map(f => String(f)) } };
      const q = {};
      Object.keys(r.q || {}).forEach(k => { const v = r.q[k]; q[k] = v instanceof Frac ? v.toString() : v; });
      return { fam: r.fam, q };
    }
    /** joint table as stored (strings, rows = Y) → {J: {xs, ys (sorted), p[i][k] = f(xs[i], ys[k])}} or {err} */
    function jointFrom(j) {
      try {
        if (!j || !j.xs || !j.ys || !j.cells) return { err: 'There is no joint table yet.' };
        const xs = j.xs.map(Number), ys = j.ys.map(Number);
        if (xs.some(v => !Number.isInteger(v)) || ys.some(v => !Number.isInteger(v))) return { err: 'Use whole numbers as the values of X (top row) and Y (left column) of the table.' };
        if (new Set(xs).size !== xs.length || new Set(ys).size !== ys.length) return { err: 'Each value of X and of Y may appear only once in the table.' };
        if (Math.max(...xs) - Math.min(...xs) > 40 || Math.max(...ys) - Math.min(...ys) > 40) return { err: 'Keep the values of X (and of Y) within 40 of each other, so the grid can be drawn.' };
        const cells = j.cells.map(r => r.map(c => (c instanceof Frac ? c : K.parseNum(String(c)))));
        if (cells.length !== ys.length || cells.some(r => r.length !== xs.length || r.some(c => c == null || num(c) < 0))) return { err: 'Fix the red boxes in the joint table (numbers 0 or more, like 1/8 or 0.125).' };
        const tot = sum(cells.flat());
        if (!same(tot, F(1))) return { err: 'The cells of the joint table add up to ' + txt(tot) + ', not 1. Press “Rescale to total 1” or edit them.' };
        const xo = xs.map((_, i) => i).sort((a, b) => xs[a] - xs[b]);
        const yo = ys.map((_, k) => k).sort((a, b) => ys[a] - ys[b]);
        return { J: { xs: xo.map(i => xs[i]), ys: yo.map(k => ys[k]), p: xo.map(i => yo.map(k => norm(cells[k][i]))) } };
      } catch (e) { return { err: 'Could not read the joint table: ' + e.message }; }
    }

    /* ------------------------------------------------------------------ star grid */
    function starPath(cx, cy, R, r) {
      let d = '';
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5, rad = k % 2 ? r : R;
        d += (k ? 'L' : 'M') + (cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2);
      }
      return d + 'Z';
    }
    /**
     * Grid of pairs (x, y): x across (blue), y up (orange). A star wherever f(x, y) > 0, sized by probability.
     * o: {xs, ys (consecutive whole numbers), f(x,y), g(x,y) (written above a star), gName, on(x,y), blk(x,y),
     *     shape: 'sum'|'max'|'min', z, prev (dashed block one step back), onPick(x,y), maxPx, aria}
     */
    function starGrid(o) {
      const xs = o.xs, ys = o.ys;
      const xlo = xs[0], xhi = xs[xs.length - 1], ylo = ys[0], yhi = ys[ys.length - 1];
      const nx = xhi - xlo + 1, ny = yhi - ylo + 1;
      const s = Math.max(10, Math.min(48, Math.floor((o.maxPx || 430) / Math.max(nx, ny))));
      const padL = 34, padB = 28, padT = 10, padR = 18;
      const Wd = padL + nx * s + padR, H = padT + ny * s + padB;
      const X = x => padL + (x - xlo + 0.5) * s, Y = y => padT + (yhi - y + 0.5) * s;
      const el = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 't4b-svg', style: 'max-width:' + Wd + 'px', role: 'img', 'aria-label': o.aria || 'grid of pairs (x, y)' });
      const id = Lab.uid('t4bclip');
      const x0 = padL, y0 = padT, gw = nx * s, gh = ny * s;
      el.appendChild(svg('defs', {}, svg('clipPath', { id }, svg('rect', { x: x0, y: y0, width: gw, height: gh }))));
      el.appendChild(svg('rect', { x: x0, y: y0, width: gw, height: gh, rx: 8, class: 't4b-bg' }));
      const every = s >= 22 ? 1 : s >= 13 ? 2 : 5;
      const lab = v => String(v).replace('-', '−');
      xs.forEach(x => { if (x % every === 0) el.appendChild(svg('text', { x: X(x), y: H - 10, 'text-anchor': 'middle', class: 't4b-tick x' }, lab(x))); });
      ys.forEach(y => { if (y % every === 0) el.appendChild(svg('text', { x: padL - 7, y: Y(y) + 4, 'text-anchor': 'end', class: 't4b-tick y' }, lab(y))); });
      el.appendChild(svg('text', { x: Wd - 3, y: H - 10, 'text-anchor': 'end', class: 't4b-axis x' }, 'x'));
      el.appendChild(svg('text', { x: padL - 7, y: padT - 1, 'text-anchor': 'end', class: 't4b-axis y' }, 'y'));
      const gShade = svg('g', { 'clip-path': 'url(#' + id + ')' });
      const gLine = svg('g', { 'clip-path': 'url(#' + id + ')' });
      el.append(gShade, gLine);
      const z = o.z, lw = Math.max(5, s * 0.42), big = 4000;
      const rect = (x1, y1, x2, y2, cls) => { if (x2 > x1 && y2 > y1) gShade.appendChild(svg('rect', { x: x1, y: y1, width: x2 - x1, height: y2 - y1, class: cls })); };
      if (o.shape === 'sum') {
        gLine.appendChild(svg('line', { x1: X(xlo - 3), y1: Y(z - xlo + 3), x2: X(xhi + 3), y2: Y(z - xhi - 3), class: 't4b-line', 'stroke-width': lw }));
      } else if (o.shape === 'max') {
        rect(-big, Y(z) - s / 2, X(z) + s / 2, big, 't4b-block');
        if (o.prev) rect(-big, Y(z - 1) - s / 2, X(z - 1) + s / 2, big, 't4b-prev');
        gLine.appendChild(svg('path', { d: 'M' + X(xlo - 3) + ',' + Y(z) + 'L' + X(z) + ',' + Y(z) + 'L' + X(z) + ',' + Y(ylo - 3), class: 't4b-line', 'stroke-width': lw }));
      } else if (o.shape === 'min') {
        rect(X(z) - s / 2, -big, big, Y(z) + s / 2, 't4b-block');
        if (o.prev) rect(X(z + 1) - s / 2, -big, big, Y(z + 1) + s / 2, 't4b-prev');
        gLine.appendChild(svg('path', { d: 'M' + X(z) + ',' + Y(yhi + 3) + 'L' + X(z) + ',' + Y(z) + 'L' + X(xhi + 3) + ',' + Y(z), class: 't4b-line', 'stroke-width': lw }));
      }
      let pmax = 0;
      const pos = [];
      xs.forEach(x => ys.forEach(y => { const p = num(o.f(x, y)); if (p > 0) { pos.push(p); if (p > pmax) pmax = p; } }));
      const equal = pos.length > 0 && pos.every(p => Math.abs(p - pos[0]) <= 1e-12 * pos[0]);
      const labels = nx <= 10 && ny <= 10 && o.g;
      xs.forEach(x => ys.forEach(y => {
        const pv = o.f(x, y), p = num(pv), cx = X(x), cy = Y(y);
        if (!(p > 0)) { el.appendChild(svg('circle', { cx, cy, r: Math.max(1.2, s * 0.045), class: 't4b-dot' })); return; }
        const R = equal ? Math.min(11, s * 0.3) : Math.max(2.2, s * (0.1 + 0.24 * Math.sqrt(p / pmax)));
        const on = o.on(x, y), inb = !on && o.blk ? o.blk(x, y) : false;
        const g = svg('g', { class: 't4b-pt' + (on ? ' on' : inb ? ' inblock' : '') });
        g.appendChild(svg('path', { d: starPath(cx, cy, R, R * 0.45), class: 't4b-star' }));
        if (labels) g.appendChild(svg('text', { x: cx, y: cy - R - 3, 'text-anchor': 'middle', class: 't4b-slab' }, String(o.g(x, y))));
        g.appendChild(svg('title', {}, '(' + x + ', ' + y + '): probability ' + txt(pv) + (o.gName ? ';  ' + o.gName + ' = ' + o.g(x, y) : '')));
        if (o.onPick) g.addEventListener('click', () => o.onPick(x, y));
        el.appendChild(g);
      }));
      return el;
    }

    /* ------------------------------------------------------------- small blocks */
    function table(head, rows, opts = {}) {
      const t = h('table', { class: 'tbl t4b-tbl' });
      t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
      const tb = h('tbody');
      rows.forEach(r => {
        const tr = h('tr', { class: r.cls || null }, r.cells.map(c => h('td', { html: c })));
        if (r.onClick) { tr.classList.add('t4b-click'); tr.addEventListener('click', r.onClick); }
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      return h('div', { class: 'tbl-wrap t4b-tw' + (opts.tall ? ' t4b-tall' : '') }, t);
    }
    function section(title, intro) {
      const box = h('div', { class: 't4b-sec' });
      const hd = h('h4', { class: 't4b-sec-h' });
      Lab.setHTML(hd, title);
      box.appendChild(hd);
      if (intro) box.appendChild(K.note(intro, 't4b-sec-p'));
      return box;
    }
    /** tooltip text of a probability: "5/36 ≈ 0.1389", "1/4 = 0.25", "≈ 1.27e-5" — never a rounded 0 */
    function tipVal(v) {
      v = norm(v);
      const d = x => (x !== 0 && Math.abs(x) < 5e-4 ? x.toExponential(3) : Lab.fmtDec(x, 4));
      if (isEx(v)) {
        if (v.d === 1) return '= ' + v.n;
        const s = d(v.valueOf());
        return (v.d <= 1e7 ? '= ' + v.toString() + (Number(s) === v.valueOf() ? ' = ' : ' ≈ ') : '≈ ') + s;
      }
      const s = d(v);
      return (Number(s) === v ? '= ' : '≈ ') + s;
    }
    /** K.pmfChart, with tooltips that keep tiny probabilities visible (the kit rounds them to 0) */
    function pmfChart(rows, opts) {
      const el = K.pmfChart(rows, opts);
      Lab.$$('.pd-col', el).forEach((col, i) => { if (rows[i]) col.title = 'P(' + (opts.xPlain || 'X') + ' = ' + rows[i].x + ') ' + tipVal(rows[i].p); });
      return el;
    }
    /** a titled PMF chart for one model (drawn values lo … show) */
    function pmfBox(title, m, tone, opts = {}) {
      const vals = range(m.lo, m.finite ? m.hi : m.show);
      const rows = vals.map(v => ({ x: v, p: m.pmf(v), label: barLab(m.pmf(v)), hot: opts.hot != null && v === opts.hot }));
      const box = h('div', { class: 't4b-chart' });
      box.appendChild(h('div', { class: 'ws-title', html: title }));
      box.appendChild(pmfChart(rows, { xName: opts.xName || m.nm.toLowerCase(), tone, height: opts.height || 130, showValues: rows.length <= 16, xPlain: m.nm, onPick: opts.onPick }));
      if (!m.finite) box.appendChild(K.note('Drawn up to ' + tex(m.nm.toLowerCase() + '=' + m.show) + ' (your “shown up to k”). Not drawn: ' + tex('P(' + m.nm + '>' + m.show + ')' + rel(m.notDrawn)) + '.', 'pl-hint t4b-trunc'));
      return box;
    }
    /** distribution {vals, p, float} for K.cdfChart: exact fractions when they are short, else numbers */
    function cdfDist(vals, ps) {
      const P = ps.map(norm);
      const float = P.some(p => !isEx(p) || p.d > 1e6);
      return { vals, p: float ? P.map(Number) : P, float };
    }

    /** the families offered in the pickers of both t4b labs: K.FAMILIES keys (only those the kit has) + 'custom' */
    const fams = () => ['uniform', 'bernoulli', 'binomial', 'geometric', 'negbin', 'poisson', 'custom'].filter(f => f === 'custom' || (K.FAMILIES && K.FAMILIES[f]));

    return {
      isEx, norm, num, mul, add, sub, div, pow, sum, fi, isZero, same, range, fact, neg, chooseN,
      sci, dec, tx, rel, txt, plain, barLab, par, setTex, pairsHtml, overTex,
      finite, uniform, bernoulli, binomial, geometric, negbin, poisson, fromSpec, specFromPick, jointFrom, SHOW, LAM, fams,
      starGrid, table, section, pmfBox, pmfChart, tipVal, cdfDist,
    };
  })();
  K.t4b = U;

  /* ======================================================================= the sum lab */
  const STORE = 'lab:s2-sum';
  const { SHOW, LAM } = U;
  const uni = (a, b) => ({ fam: 'uniform', q: { a, b } });
  const ber = p => ({ fam: 'bernoulli', q: { p } });
  const bin = (n, p) => ({ fam: 'binomial', q: { n, p } });
  const geo = (p, k) => ({ fam: 'geometric', q: { p, [SHOW]: k || 10 } });
  const nb = (r, p, k) => ({ fam: 'negbin', q: { r, p, [SHOW]: k || 12 } });
  const poi = (l, k) => ({ fam: 'poisson', q: { [LAM]: l, [SHOW]: k || 12 } });
  const cus = (vals, probs) => ({ fam: 'custom', custom: { vals, probs } });
  const LOADED = () => cus([1, 2, 3, 4, 5, 6], ['1/10', '1/10', '1/10', '1/10', '1/10', '1/2']);
  // L2.6 lecture table: rows are Y = 0, 1, 2; columns are X = 0, 1
  const L26 = () => ({ xs: [0, 1], ys: [0, 1, 2], cells: [['1/2', '1/16'], ['1/4', '1/32'], ['1/8', '1/32']] });
  const SAME_DIE = () => ({ xs: [1, 2, 3, 4, 5, 6], ys: [1, 2, 3, 4, 5, 6], cells: [1, 2, 3, 4, 5, 6].map(j => [1, 2, 3, 4, 5, 6].map(i => (i === j ? '1/6' : '0'))) });
  const DEF = () => ({ mode: 'indep', X: uni(1, 6), Y: uni(1, 6), joint: L26(), z: 7, n: 3 });

  // Rule 0: a preset whose numbers come from this site's lesson pages says so in its label (the lecture slides use other or no numbers)
  const LESSON = n => ' — the L' + n + ' lesson (not a lecture slide)';
  const PRESETS = [
    { label: 'Two fair dice, z = 8 (L2.8)', source: 'L2.8, the star grid for two fair dice. The lecture calls z = 8 “the tricky one”: the pair (1, 7) is impossible, so only 5 pairs remain.', set: { mode: 'indep', X: uni(1, 6), Y: uni(1, 6), z: 8 } },
    { label: 'Two loaded dice' + LESSON('2.8'), source: 'The L2.8 lesson, card “Stars of different sizes” (the lecture uses fair dice only): two independent dice that show 6 with probability 1/2 and every other face with 1/10. P(X + Y = 7) = 7/50.', set: { mode: 'indep', X: LOADED(), Y: LOADED(), z: 7 } },
    { label: 'A coin and a die' + LESSON('2.8'), source: 'The L2.8 lesson, “Your turn” (not in the lecture): X ∈ {0, 1} from a fair coin, Y from a fair die, independent. P(X + Y = 4) = 1/6.', set: { mode: 'indep', X: ber('1/2'), Y: uni(1, 6), z: 4 } },
    { label: 'Two Uniform{1, …, 10}: a triangle (L2.8, L2.9)', source: 'L2.9 (≈ 3–8 min): the sum of two Uniform{1, …, n} and its stem plot for n = 10, the L2.8 dice grown from 6 faces to n. P(W = 15) = 6/100.', set: { mode: 'indep', X: uni(1, 10), Y: uni(1, 10), z: 15 } },
    { label: 'Uniform{0, …, 3} + Uniform{0, …, 3} (L2.10)', source: 'L2.10 (≈ 15–19 min), X and Y independent Uniform{0, 1, 2, 3}: counts 1, 2, 3, 4, 3, 2, 1 out of 16. At z = 4 the count goes down: (0, 4) is impossible.', set: { mode: 'indep', X: uni(0, 3), Y: uni(0, 3), z: 4 } },
    { label: 'Two Bernoulli(1/3)' + LESSON('2.10'), source: 'The L2.10 lesson, the convolution strip “Two Bernoulli(1/3)”. The lecture says “a sum of n independent Bernoulli(p) is Binomial(n, p)” with letters (L2.10 ≈ 14–15 min); with p = 1/3 the sum is Binomial(2, 1/3).', set: { mode: 'indep', X: ber('1/3'), Y: ber('1/3'), z: 1 } },
    { label: 'Three tosses of a 1/3 coin' + LESSON('2.10'), source: 'The L2.10 lesson, “Sum of Bernoulli trials = Binomial” (the lecture keeps p as a letter): X₁ + X₂ ~ Bin(2, 1/3) plus a third toss ~ Bernoulli(1/3) gives Bin(3, 1/3): 8/27, 12/27, 6/27, 1/27.', set: { mode: 'indep', X: bin(2, '1/3'), Y: ber('1/3'), z: 2 } },
    { label: 'Bernoulli(1/2) + Bernoulli(1/4): different p' + LESSON('2.10'), source: 'The L2.10 lesson, the warning after Exercise 1 (not in the lecture): with different p the sum gives 3/8, 1/2, 1/8 — no Binomial(2, p) has these values.', set: { mode: 'indep', X: ber('1/2'), Y: ber('1/4'), z: 1 } },
    { label: 'Bin(2, 1/2) + Bin(3, 1/2)' + LESSON('2.10'), source: 'The lecture leaves Bin(m, p) + Bin(n, p) as an exercise without numbers (L2.10 ≈ 31–32 min); m = 2, n = 3, p = 1/2 come from the L2.10 lesson, “Exercise 1”. At z = 2 the binomial coefficients give 1·3 + 2·3 + 1·1 = 10 = C(5, 2).', set: { mode: 'indep', X: bin(2, '1/2'), Y: bin(3, '1/2'), z: 2 } },
    { label: 'Poisson(1) + Poisson(2)' + LESSON('2.10'), source: 'The lecture derives Poisson(λ₁) + Poisson(λ₂) = Poisson(λ₁ + λ₂) with letters (L2.10 ≈ 22–28 min); λ₁ = 1, λ₂ = 2 come from the L2.10 lesson, “Check the result with actual numbers”: z = 2 gives 4.5·e^(−3) ≈ 0.2240.', set: { mode: 'indep', X: poi(1), Y: poi(2), z: 2, n: 3 } },
    { label: 'Poisson(1) + Poisson(3), total n = 3' + LESSON('2.10'), source: 'The lecture shows X | X + Y = n ~ Bin(n, λ₁/(λ₁ + λ₂)) with letters (L2.10 ≈ 28–31 min); the numbers come from the L2.10 lesson, “Split a Poisson total”: given X + Y = 3, X ~ Bin(3, 1/4), so P(X = 1 | X + Y = 3) = 27/64.', set: { mode: 'indep', X: poi(1), Y: poi(3), z: 3, n: 3 } },
    { label: 'Geometric(1/2) + Geometric(1/2) = NegBin(2, 1/2)' + LESSON('2.10'), source: 'The lecture’s exercise “sum of two independent geometric distributions” (L2.10 ≈ 32 min) has no numbers; p = 1/2 and s = 4 come from the L2.10 lesson, “Exercises 2–4”. P(S = s) = (s − 1)p²(1 − p)^(s − 2), so P(S = 4) = 3·(1/2)⁴ = 3/16.', set: { mode: 'indep', X: geo('1/2'), Y: geo('1/2'), z: 4 } },
    { label: 'Three i.i.d. Geometric(1/2): NegBin(2, 1/2) + Geometric(1/2) = NegBin(3, 1/2) (L2.10 exercise; p = 1/2 and s = 7 chosen here)', source: 'L2.10 (≈ 32 min) leaves “sum of r i.i.d. geometric” as an exercise, with no numbers. Here r = 3, p = 1/2: X = X₁ + X₂ ~ NegBin(2, 1/2) (the exercise above) and Y = X₃ ~ Geometric(1/2). P(S = s) = C(s − 1, 2)(1/2)^s, so P(S = 7) = C(6, 2)/2⁷ = 15/128.', set: { mode: 'indep', X: nb(2, '1/2'), Y: geo('1/2'), z: 7 } },
    { label: 'NegBin(2, 1/2) + NegBin(3, 1/2) = NegBin(5, 1/2) (L2.10 exercise; numbers chosen here)', source: 'L2.10 (≈ 32 min) leaves “sum of two independent negative binomial distributions” as an exercise, with no numbers. With r₁ = 2, r₂ = 3 and p = 1/2: S ~ NegBin(5, 1/2), P(S = s) = C(s − 1, 4)(1/2)^s, so P(S = 7) = C(6, 4)/2⁷ = 15/128.', set: { mode: 'indep', X: nb(2, '1/2'), Y: nb(3, '1/2'), z: 7 } },
    { label: 'The same die read twice, Y = X' + LESSON('2.10'), source: 'The L2.10 lesson, pitfall “No independence, no convolution”. The lecture states the rule (L2.10 ≈ 19–22 min: independence is needed for the convolution); the table is ours: f(x, x) = 1/6. X + Y = 2X, so P(X + Y = 7) = 0 — the convolution would wrongly say 6/36.', set: { mode: 'joint', joint: SAME_DIE(), z: 7 } },
    { label: 'The L2.6 lecture table (not independent)', source: 'L2.6, the given joint PMF: X ∈ {0, 1}, Y ∈ {0, 1, 2} with probabilities 1/2, 1/4, 1/8 (X = 0) and 1/16, 1/32, 1/32 (X = 1).', set: { mode: 'joint', joint: L26(), z: 1 } },
  ];

  const plural = (n, w, ws) => n + ' ' + (n === 1 ? w : ws || w + 's');
  const jointFrom = U.jointFrom;

  function sumLab(host) {
    const clone = o => JSON.parse(JSON.stringify(o));
    let st;
    let ctl = {}, P = {}, good = {}, errs = {}, lastRange = '', meanCache = {};
    const save = () => Lab.store.set(STORE, st);
    const schedule = Lab.debounce(() => draw(), 40);
    load(Lab.store.get(STORE, null));
    build();

    function load(saved) {
      st = Object.assign(DEF(), saved && typeof saved === 'object' ? clone(saved) : {});
      if (!['indep', 'joint'].includes(st.mode)) st.mode = 'indep';
      if (!['Z', 'X', 'Y'].includes(st.cdfView)) st.cdfView = 'Z';
      if (!Number.isFinite(+st.z)) st.z = 7;
      if (!Number.isFinite(+st.n)) st.n = 3;
      good = { X: null, Y: null, J: null }; errs = { X: '', Y: '', J: '' };
      ['X', 'Y'].forEach(nm => {
        const r = U.fromSpec(st[nm], nm);
        if (r.m) good[nm] = r.m;
        else { st[nm] = uni(1, 6); good[nm] = U.fromSpec(st[nm], nm).m; }
      });
      const rj = jointFrom(st.joint);
      if (rj.J) good.J = rj.J; else { st.joint = L26(); good.J = jointFrom(st.joint).J; }
    }

    /* ------------------------------------------------------------------ controls */
    function build(pre) {
      const { side, main } = K.layout(host, 't4b-lab');
      ctl = {}; P = {}; lastRange = '';
      side.appendChild(K.group('Lecture and lesson examples'));
      ctl.pre = K.presets({ label: 'Load an example (L2.8–L2.10, or the lessons)', items: PRESETS, onPick: it => loadPreset(it) });
      side.appendChild(ctl.pre);
      if (pre != null) { ctl.pre.select.value = String(pre); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[pre].source); }

      side.appendChild(K.group('1 · How X and Y are given'));
      ctl.mode = Lab.seg([{ label: 'Independent X and Y', value: 'indep' }, { label: 'A joint table', value: 'joint' }], st.mode, v => { st.mode = v; syncMode(); draw(); });
      side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Two named distributions, or your own table of f(x, y)?' }), ctl.mode));

      ctl.xHost = h('div', { class: 't4b-px' }); ctl.yHost = h('div', { class: 't4b-py' }); ctl.jHost = h('div', { class: 't4b-pj' });
      ctl.indep = h('div', { class: 't4b-ctl' }, K.group('2 · Your X'), ctl.xHost, K.group('3 · Your Y'), ctl.yHost);
      ctl.joint = h('div', { class: 't4b-ctl' }, K.group('2 · Your joint table'),
        K.note('Values of ' + tex('X') + ' across the top, values of ' + tex('Y') + ' down the left, ' + tex('f_{XY}(x,y)') + ' in the cells. Whole-number values; the cells must add up to 1. No independence is assumed.'), ctl.jHost);
      side.append(ctl.indep, ctl.joint);
      mountPicker('X'); mountPicker('Y'); mountJoint();

      ctl.zTitle = K.group('4 · The value of Z');
      ctl.z = K.numField({ label: 'Value ' + tex('z') + ' of ' + tex('Z=X+Y'), min: 0, max: 12, value: st.z, onChange: v => { st.z = v; draw(); } });
      ctl.z.classList.add('t4b-z');
      side.append(ctl.zTitle, ctl.z);
      ctl.n = K.numField({ label: 'Total ' + tex('n') + ' in ' + tex('P(X=k\\mid X+Y=n)'), min: 0, max: 30, value: st.n, onChange: v => { st.n = v; draw(); } });
      ctl.n.classList.add('t4b-n');
      ctl.split = h('div', { class: 't4b-ctl' }, K.group('5 · Poisson split'), ctl.n);
      side.appendChild(ctl.split);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); meanCache = {}; load(null); build(); }, 'btn ghost sm')));

      P.err = h('div', { class: 't4b-err', hidden: true });
      P.answer = K.answer();
      P.grid = K.panel('The stars and the line ' + tex('x+y=z'));
      P.pmf = K.panel('The PMF of ' + tex('Z=X+Y') + ', next to ' + tex('X') + ' and ' + tex('Y'));
      P.cdf = K.panel('The CDF of ' + tex('Z') + ', and of ' + tex('X') + ' and ' + tex('Y'));
      P.conv = K.panel('How ' + tex('P(Z=z)') + ' is computed, with your numbers');
      P.mean = K.panel('Check: ' + tex('E[Z]=E[X]+E[Y]'));
      P.known = K.panel('Known results for your ' + tex('X') + ' and ' + tex('Y'), 'Shortcuts from L2.8 and L2.10. They appear when your inputs match one.');
      main.append(P.err, P.answer, P.grid, P.pmf, P.cdf, P.conv, P.mean, P.known);
      syncMode();
      draw();
    }
    function mountPicker(nm) {
      const host = nm === 'X' ? ctl.xHost : ctl.yHost;
      Lab.clear(host);
      const s = st[nm];
      const params = {};
      if (s.fam !== 'custom' && s.q) params[s.fam] = Object.assign({}, s.q);
      const custom = s.custom ? { vals: s.custom.vals.slice(), probs: s.custom.probs.slice() } : undefined;
      host.appendChild(K.distPicker({ label: 'Distribution of ' + tex(nm), families: U.fams(), value: s.fam, params, custom, xName: nm, onChange: r => onPick(nm, r) }));
    }
    function onPick(nm, r) {
      if (!r.fam && !r.ok) {
        errs[nm] = 'The PMF of ' + nm + ' is not valid yet (see the message under it). The pictures still show your last valid ' + nm + '.';
        schedule();
        return;
      }
      const spec = U.specFromPick(r);
      const s = st[nm];
      s.fam = spec.fam;
      if (spec.fam === 'custom') s.custom = spec.custom; else s.q = spec.q;
      const res = U.fromSpec(s, nm);
      if (res.m) { good[nm] = res.m; errs[nm] = ''; } else errs[nm] = res.err + ' The pictures still show your last valid ' + nm + '.';
      meanCache = {};
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
        errs.J = (r.total && !r.total.eq(1) ? 'The cells of the joint table add up to ' + U.txt(r.total) + ', not 1.' : 'Fix the red boxes in the joint table.') + ' The pictures still show your last valid table.';
        schedule();
        return;
      }
      const j = { xs: r.xs.slice(), ys: r.ys.slice(), cells: r.cells.map(row => row.map(c => String(c))) };
      const res = jointFrom(j);
      if (res.J) { good.J = res.J; errs.J = ''; st.joint = j; } else errs.J = res.err + ' The pictures still show your last valid table.';
      schedule();
    }
    function loadPreset(it) {
      const k = PRESETS.indexOf(it);
      const base = DEF();
      st = Object.assign(base, clone(it.set));
      if (it.set.mode === 'joint') { st.X = uni(1, 6); st.Y = uni(1, 6); }
      meanCache = {};
      load(st);
      build(k);
    }
    function syncMode() {
      const ind = st.mode === 'indep';
      ctl.indep.hidden = !ind;
      ctl.joint.hidden = ind;
      ctl.zTitle.textContent = (ind ? '4' : '3') + ' · The value of Z';
    }
    function setZ(v) { st.z = v; ctl.z.set(v); draw(); }

    /* --------------------------------------------------------------- the numbers */
    function compute() {
      if (st.mode === 'joint') {
        const J = good.J;
        if (!J) return null;
        const xi = new Map(J.xs.map((x, i) => [x, i])), yj = new Map(J.ys.map((y, k) => [y, k]));
        const f = (x, y) => (xi.has(x) && yj.has(y) ? J.p[xi.get(x)][yj.get(y)] : F(0));
        const MX = U.finite('X', J.xs, J.xs.map((_, i) => U.sum(J.p[i])));
        const MY = U.finite('Y', J.ys, J.ys.map((_, k) => U.sum(J.p.map(r => r[k]))));
        MX.tex = MY.tex = '\\text{the marginal of your table}';
        MX.words = MY.words = 'the marginal of your table';
        let zLo = Infinity, zHi = -Infinity;
        J.xs.forEach((x, i) => J.ys.forEach((y, k) => { if (U.num(J.p[i][k]) > 0) { zLo = Math.min(zLo, x + y); zHi = Math.max(zHi, x + y); } }));
        const memo = new Map();
        const conv = z => {
          if (!memo.has(z)) {
            const terms = J.xs.map(x => ({ x, y: z - x, inY: yj.has(z - x), pr: f(x, z - x) }));
            memo.set(z, { terms, tot: U.sum(terms.map(t => t.pr)) });
          }
          return memo.get(z);
        };
        const zs = U.range(zLo, zHi), fz = zs.map(z => conv(z).tot);
        let bad = null;
        J.xs.forEach(x => J.ys.forEach(y => { if (!bad && !U.same(f(x, y), U.mul(MX.pmf(x), MY.pmf(y)))) bad = { x, y }; }));
        return { joint: true, J, f, MX, MY, xs: U.range(J.xs[0], J.xs[J.xs.length - 1]), ys: U.range(J.ys[0], J.ys[J.ys.length - 1]), zLo, zHi, zs, fz, conv, drawn: U.sum(fz), tail: F(0), infinite: false, indep: !bad, bad };
      }
      const MX = good.X, MY = good.Y;
      if (!MX || !MY) return null;
      const memo = new Map();
      const conv = z => {
        if (!memo.has(z)) {
          const lows = [MX.lo], highs = [];
          if (MY.finite) lows.push(z - MY.hi);
          if (MX.finite) highs.push(MX.hi);
          highs.push(z - MY.lo);
          const L = Math.max(...lows), H = Math.min(...highs);
          const terms = [];
          let tot = F(0);
          for (let x = L; x <= H; x++) {
            const a = MX.pmf(x), b = MY.pmf(z - x), pr = U.mul(a, b);
            terms.push({ x, y: z - x, a, b, pr });
            tot = U.add(tot, pr);
          }
          memo.set(z, { L, H, lows, highs, terms, tot });
        }
        return memo.get(z);
      };
      const zLo = MX.lo + MY.lo, zHi = MX.show + MY.show;
      const zs = U.range(zLo, zHi), fz = zs.map(z => conv(z).tot);
      const drawn = U.sum(fz);
      const infinite = !MX.finite || !MY.finite;
      let tail = infinite ? U.sub(F(1), drawn) : F(0);
      // in floating point, 1 − (sum of the bars) keeps only about 16 digits after the point: add the tail terms themselves
      if (infinite && !U.isEx(U.norm(tail))) {
        const key = 'tail' + JSON.stringify([st.X, st.Y]);
        if (meanCache[key] == null) meanCache[key] = floatTail(MX, MY, zHi);
        tail = meanCache[key];
      }
      return { joint: false, MX, MY, f: (x, y) => U.mul(MX.pmf(x), MY.pmf(y)), xs: U.range(MX.lo, MX.show), ys: U.range(MY.lo, MY.show), zLo, zHi, zs, fz, conv, drawn, tail, infinite };
    }

    /** P(Z > zHi) for independent X, Y, added term by term in floating point (no cancellation) */
    function floatTail(A, B, zHi) {
      const fx = [], fy = [];
      const gx = k => { while (fx.length <= k - A.lo) fx.push(U.num(A.pmf(A.lo + fx.length))); return fx[k - A.lo]; };
      const gy = k => { while (fy.length <= k - B.lo) fy.push(U.num(B.pmf(B.lo + fy.length))); return fy[k - B.lo]; };
      let s = 0, prev = Infinity;
      for (let z = zHi + 1; z <= zHi + 6000; z++) {
        const L = Math.max(A.lo, B.finite ? z - B.hi : -Infinity), H = Math.min(A.finite ? A.hi : Infinity, z - B.lo);
        let p = 0;
        for (let x = L; x <= H; x++) p += gx(x) * gy(z - x);
        s += p;
        if (z > zHi + 5 && p <= prev && p <= s * 1e-17) break;
        prev = p;
      }
      return s;
    }

    /* ------------------------------------------------------------------- drawing */
    function draw() {
      save();
      paintErrors();
      ctl.split.hidden = !(st.mode === 'indep' && good.X && good.Y && good.X.fam === 'poisson' && good.Y.fam === 'poisson');
      const D = compute();
      if (!D) return;
      const key = D.zLo + ':' + D.zHi;
      if (key !== lastRange) { lastRange = key; ctl.z.setRange(D.zLo, D.zHi); }
      const z0 = Math.max(D.zLo, Math.min(D.zHi, Math.round(+st.z)));
      if (z0 !== st.z) { st.z = z0; ctl.z.set(z0); save(); }
      ctl.z.hint(zHint(D));
      drawAnswer(D); drawGrid(D); drawPmf(D); drawCdf(D); drawConv(D); drawMean(D); drawKnown(D);
    }
    function paintErrors() {
      const list = st.mode === 'joint' ? [errs.J] : [errs.X, errs.Y];
      const msgs = list.filter(Boolean);
      P.err.hidden = !msgs.length;
      Lab.setHTML(P.err, msgs.map(m => '<div>' + Lab.esc(m) + '</div>').join(''));
    }
    function zHint(D) {
      if (D.joint) return tex('Z') + ' goes from ' + D.zLo + ' to ' + D.zHi + ': the smallest and largest ' + tex('x+y') + ' over the cells of your table with ' + tex('f_{XY}>0') + '.';
      const A = D.MX, B = D.MY;
      const low = 'from ' + tex(A.lo + '+' + U.par(B.lo) + '=' + D.zLo);
      if (!D.infinite) return tex('Z') + ' goes ' + low + ' (both smallest values) to ' + tex(A.hi + '+' + U.par(B.hi) + '=' + D.zHi) + ' (both largest).';
      return tex('Z') + ' goes ' + low + ' upward without end; the lab draws it up to ' + tex(A.show + '+' + U.par(B.show) + '=' + D.zHi) + ' (the two “shown up to” values).';
    }

    function drawAnswer(D) {
      const z = st.z, c = D.conv(z);
      const nz = c.terms.filter(t => !U.isZero(t.pr));
      let ev, sub;
      if (D.joint) {
        ev = 'Your joint table ' + tex('f_{XY}') + ' (values of ' + tex('X') + ': ' + tex('\\{' + D.J.xs.join(',') + '\\}') + '; values of ' + tex('Y') + ': ' + tex('\\{' + D.J.ys.join(',') + '\\}') + '). ' + tex('Z=X+Y') + '. You chose ' + tex('z=' + z) + '.';
        sub = nz.length
          ? 'Add ' + tex('f_{XY}(x,\\,' + z + '-x)') + ' over the ' + plural(nz.length, 'cell') + ' of your table on the line ' + tex('x+y=' + z) + ': ' + U.pairsHtml(nz) + '. No independence is needed for this sum.'
          : 'No cell of your table with probability above 0 lies on the line ' + tex('x+y=' + z) + ', so ' + tex('P(Z=' + z + ')=0') + '.';
      } else {
        ev = 'Your ' + tex('X\\sim ' + D.MX.tex) + ' and ' + tex('Y\\sim ' + D.MY.tex) + ', independent. ' + tex('Z=X+Y') + '. You chose ' + tex('z=' + z) + '.';
        if (!nz.length) sub = 'No pair ' + tex('(x,\\,' + z + '-x)') + ' has both ' + tex('f_X(x)>0') + ' and ' + tex('f_Y(' + z + '-x)>0') + ', so ' + tex('P(Z=' + z + ')=0') + '.';
        else {
          const eq = nz.length > 1 && nz.every(t => U.same(t.pr, nz[0].pr));
          sub = 'Add the ' + plural(nz.length, 'product') + ' ' + tex('f_X(x)\\,f_Y(' + z + '-x)') + ' for ' + tex('x=' + U.setTex(nz[0].x, nz[nz.length - 1].x)) + (nz.length < c.terms.length ? ' (the other values of ' + tex('x') + ' in the limits give 0)' : '') + ' — the convolution, step by step below. In the star grid these are the stars on the line ' + tex('x+y=' + z) + '.' +
            (eq ? ' Every product equals ' + tex(U.tx(nz[0].pr)) + ', so ' + tex('P(Z=' + z + ')=' + nz.length + '\\times ' + U.tx(nz[0].pr) + U.rel(c.tot)) + '.' : '');
        }
        sub += ' Mean: ' + tex('E[Z]=E[X]+E[Y]=' + U.tx(D.MX.mean) + '+' + U.tx(D.MY.mean) + U.rel(U.add(D.MX.mean, D.MY.mean))) + '.';
      }
      K.setAnswer(P.answer, { ev, big: 'P(Z=' + z + ')=f_Z(' + z + ')' + U.rel(c.tot), sub });
      P.answer.dataset.plain = 'z=' + z + ';p=' + U.plain(c.tot) + ';EZ=' + U.plain(U.add(D.MX.mean, D.MY.mean)) + ';zHi=' + D.zHi + ';tail=' + U.plain(D.tail) + ';EZpmf=' + U.plain(meanZ(D).v);
    }

    function drawGrid(D) {
      const body = P.grid.body;
      Lab.clear(body);
      const z = st.z;
      const pos = [];
      D.xs.forEach(x => D.ys.forEach(y => { const p = U.num(D.f(x, y)); if (p > 0) pos.push(p); }));
      const equal = pos.length > 0 && pos.every(p => Math.abs(p - pos[0]) <= 1e-12 * pos[0]);
      P.grid.sub('Every pair ' + tex('(x,y)') + ' that can happen gets a star: ' + tex('x') + ' across (blue), ' + tex('y') + ' up (orange). ' +
        (D.joint ? 'Its probability is ' + tex('f_{XY}(x,y)') + ', read from your table.' : 'Its probability is ' + tex('f_{XY}(x,y)=f_X(x)\\,f_Y(y)') + ' (independent).') +
        (equal ? ' All stars here have the same probability.' : ' A bigger star means a bigger probability.') +
        ' The violet line is ' + tex('x+y=' + z) + '. Tap a star to move the line to its sum.');
      const stage = h('div', { class: 't4b-stage' });
      stage.appendChild(U.starGrid({ xs: D.xs, ys: D.ys, f: D.f, g: (x, y) => x + y, gName: 'x + y', on: (x, y) => x + y === z, shape: 'sum', z, onPick: (x, y) => setZ(x + y), aria: 'star grid of the pairs (x, y) with the line x + y = ' + z }));
      body.appendChild(stage);
      const c = D.conv(z);
      const inGrid = [];
      D.xs.forEach(x => { const y = z - x; if (y >= D.ys[0] && y <= D.ys[D.ys.length - 1] && U.num(D.f(x, y)) > 0) inGrid.push({ x, y, p: D.f(x, y) }); });
      const nzAll = c.terms.filter(t => !U.isZero(t.pr));
      const outside = nzAll.length - inGrid.length;
      let html = 'The line ' + tex('x+y=' + z) + ' passes through ' + plural(inGrid.length, 'star') + (inGrid.length ? ': ' + U.pairsHtml(inGrid) : '') + '.';
      if (outside > 0) html += ' ' + plural(outside, 'more pair') + ' with ' + tex('x+y=' + z) + ' lie beyond the drawn part of the grid; the sum includes them.';
      if (nzAll.length) {
        const pr = nzAll.map(t => U.tx(t.pr));
        html += '<br>Add their probabilities: ' + tex('P(Z=' + z + ')=' + (equal && inGrid.length === nzAll.length && nzAll.length > 1 ? nzAll.length + '\\times ' + pr[0] : pr.length <= 6 ? pr.join('+') : pr.slice(0, 3).join('+') + '+\\dots+' + pr[pr.length - 1]) + U.rel(c.tot)) + '.';
        if (equal && D.joint === false) html += ' <span class="muted">(Each star: ' + tex(U.tx(D.MX.pmf(nzAll[0].x)) + '\\cdot ' + U.tx(D.MY.pmf(nzAll[0].y)) + '=' + U.tx(nzAll[0].pr)) + '.)</span>';
      } else html += ' So ' + tex('P(Z=' + z + ')=0') + '.';
      body.appendChild(h('div', { class: 'ws-readout', html }));
      if (!D.joint) [D.MX, D.MY].forEach(m => {
        if (m.finite) return;
        body.appendChild(K.note('Your ' + tex(m.nm + '\\sim ' + m.tex) + ' takes the values ' + tex('\\{' + U.setTex(m.lo, Infinity) + '\\}') + ' without end. The grid stops at ' + tex(m.nm.toLowerCase() + '=' + m.show) + ' (your “shown up to k”); the stars beyond it hold ' + tex('P(' + m.nm + '>' + m.show + ')' + U.rel(m.notDrawn)) + ' of the probability.', 'pl-hint t4b-trunc'));
      });
    }

    function drawPmf(D) {
      const body = P.pmf.body;
      Lab.clear(body);
      const two = h('div', { class: 't4b-two' });
      const nameX = D.joint ? 'PMF of ' + tex('X') + ' (marginal: add each column of your table)' : 'PMF of ' + tex('X\\sim ' + D.MX.tex);
      const nameY = D.joint ? 'PMF of ' + tex('Y') + ' (marginal: add each row of your table)' : 'PMF of ' + tex('Y\\sim ' + D.MY.tex);
      two.append(U.pmfBox(nameX, D.MX, 'x'), U.pmfBox(nameY, D.MY, 'y'));
      body.appendChild(two);
      const rows = D.zs.map((z, i) => ({ x: z, p: D.fz[i], hot: z === st.z, label: U.barLab(D.fz[i]) }));
      const box = h('div', { class: 't4b-chart' });
      box.appendChild(h('div', { class: 'ws-title', html: 'PMF of ' + tex('Z=X+Y') + ': bar ' + tex('z') + ' is ' + tex('f_Z(z)') + ', the convolution sum at ' + tex('z') + '. Violet = your ' + tex('z=' + st.z) + '. Tap a bar to choose ' + tex('z') + '.' }));
      box.appendChild(U.pmfChart(rows, { xName: 'z', tone: 'z', height: 180, showValues: rows.length <= 24, xPlain: 'Z', onPick: x => setZ(x) }));
      const drawnTex = rows.length <= 8 ? rows.map(r => U.tx(r.p)).join('+') : '\\sum_{z=' + D.zLo + '}^{' + D.zHi + '}f_Z(z)';
      box.appendChild(K.note(D.infinite
        ? 'The drawn bars, ' + tex('z=' + D.zLo + ',\\dots,' + D.zHi) + ', add up to ' + tex(drawnTex + U.rel(D.drawn)) + '. ' + tex('Z') + ' has no largest value, so the rest is not drawn: ' + tex('P(Z>' + D.zHi + ')=1-' + U.tx(D.drawn) + U.rel(D.tail)) + '.'
        : 'The bars add up to ' + tex(drawnTex + U.rel(D.drawn)) + (U.same(D.drawn, F(1)) ? ' ✓ — every pair lands on exactly one value of ' + tex('Z') + '.' : '.'), 'pl-hint'));
      body.appendChild(box);
    }

    /* the CDF of Z, or of the inputs X and Y (a switch), each with a movable t */
    function drawCdf(D) {
      const body = P.cdf.body;
      Lab.clear(body);
      if (!['Z', 'X', 'Y'].includes(st.cdfView)) st.cdfView = 'Z';
      const view = st.cdfView;
      const seg = Lab.seg([{ label: 'Z = X + Y', value: 'Z' }, { label: 'X', value: 'X' }, { label: 'Y', value: 'Y' }], view, v => { st.cdfView = v; save(); drawCdf(D); });
      body.appendChild(h('div', { class: 'pl-field t4b-view' }, h('label', { class: 'pl-label', text: 'Draw the CDF of' }), seg));
      if (view === 'Z') {
        P.cdf.sub(tex('F_Z(t)=P(Z\\le t)') + ' adds the bars of the PMF of ' + tex('Z') + ' up to ' + tex('t') + '. Move ' + tex('t') + ' to read it.');
        body.appendChild(K.cdfChart(U.cdfDist(D.zs, D.fz), { xName: 'Z', t: st.z, truncated: D.infinite }));
        if (D.infinite) body.appendChild(K.note('The staircase stops at ' + tex('t=' + D.zHi) + ' at height ' + tex(U.tx(D.drawn)) + ', not 1: the remaining ' + tex(U.tx(D.tail)) + ' belongs to values of ' + tex('Z') + ' above ' + D.zHi + '.', 'pl-hint t4b-trunc'));
        return;
      }
      const m = view === 'X' ? D.MX : D.MY;
      const vals = U.range(m.lo, m.finite ? m.hi : m.show);
      P.cdf.sub(tex('F_' + view + '(t)=P(' + view + '\\le t)') + ' adds the bars of the PMF of ' + tex(view) + (D.joint ? ' (the ' + (view === 'X' ? 'column' : 'row') + ' totals of your table)' : ' (' + tex(view + '\\sim ' + m.tex) + ')') + ' up to ' + tex('t') + '. Move ' + tex('t') + ' to read it.');
      body.appendChild(K.cdfChart(U.cdfDist(vals, vals.map(v => m.pmf(v))), { xName: view, truncated: !m.finite }));
      if (!m.finite) body.appendChild(K.note('Your ' + tex(view) + ' has no largest value: the staircase stops at ' + tex('t=' + m.show) + ' (your “shown up to k”) at height ' + tex('F_' + view + '(' + m.show + ')' + U.rel(m.cdf(m.show))) + '; the remaining ' + tex('P(' + view + '>' + m.show + ')' + U.rel(m.notDrawn)) + ' lies further right.', 'pl-hint t4b-trunc'));
    }

    /* ------------------------------------------------------------- convolution */
    function drawConv(D) {
      const body = P.conv.body;
      Lab.clear(body);
      body.appendChild(D.joint ? convJoint(D) : convIndep(D));
    }
    function sumLine(prefix, nz, termTex, total) {
      if (!nz.length) return prefix + '0';
      const parts = nz.map(termTex);
      let line = prefix + (parts.length <= 6 ? parts.join('+') : parts.slice(0, 3).join('+') + '+\\dots+' + parts[parts.length - 1]);
      const eq = nz.length > 1 && nz.every(t => U.same(t.pr, nz[0].pr));
      if (eq) line += '=' + nz.length + '\\times ' + U.tx(nz[0].pr);
      else if (nz.length > 1 && nz.length <= 6 && parts.some((p, i) => p !== U.tx(nz[i].pr))) line += '=' + nz.map(t => U.tx(t.pr)).join('+');
      return line + U.rel(total);
    }
    function convIndep(D) {
      const z = st.z, A = D.MX, B = D.MY, c = D.conv(z);
      const steps = [];
      steps.push({
        html: 'Split the event ' + tex('\\{Z=' + z + '\\}') + ' by the value of ' + tex('X') + ': when ' + tex('X=x') + ', the sum is ' + z + ' only if ' + tex('Y=' + z + '-x') + '. Different ' + tex('x') + ' give events that cannot happen together, so their probabilities add. Your ' + tex('X') + ' and ' + tex('Y') + ' are independent, so each joint probability is a product:',
        math: '\\begin{aligned}f_Z(z)&=\\sum_x f_{XY}(x,\\,z-x)=\\sum_x f_X(x)\\,f_Y(z-x)\\\\ f_Z(' + z + ')&=\\sum_x f_X(x)\\,f_Y(' + z + '-x)\\end{aligned}',
      });
      steps.push({ html: 'Your two PMFs, the inputs of the sum:', math: '\\begin{aligned}&' + A.defTex + '\\\\&' + B.defTex + '\\end{aligned}' });
      const xPart = A.finite ? tex(A.lo + '\\le x\\le ' + A.hi) : tex('x\\ge ' + A.lo) + ' (no upper end: ' + tex('X') + ' has no largest value)';
      const yPart = B.finite
        ? tex(U.par(B.lo) + '\\le ' + z + '-x\\le ' + B.hi) + ', that is ' + tex((z - B.hi) + '\\le x\\le ' + (z - B.lo))
        : tex(z + '-x\\ge ' + B.lo) + ', that is ' + tex('x\\le ' + (z - B.lo)) + ' (no lower end from ' + tex('Y') + ': it has no largest value)';
      const lowT = c.lows.length > 1 ? 'x\\ge\\max(' + c.lows.join(',\\,') + ')=' + c.L : 'x\\ge ' + c.L;
      const highT = c.highs.length > 1 ? 'x\\le\\min(' + c.highs.join(',\\,') + ')=' + c.H : 'x\\le ' + c.H;
      steps.push({
        html: '<b>The limits.</b> ' + tex('f_X(x)=0') + ' unless ' + tex('x') + ' is a value of ' + tex('X') + ': ' + xPart + '. ' + tex('f_Y(' + z + '-x)=0') + ' unless ' + tex(z + '-x') + ' is a value of ' + tex('Y') + ': ' + yPart + '. Keep the ' + tex('x') + ' that satisfy both:',
        math: '\\begin{aligned}' + lowT.replace('\\ge', '&\\ge') + '\\\\' + highT.replace('\\le', '&\\le') + '\\end{aligned}',
        note: c.L <= c.H ? 'So ' + tex('x=' + U.setTex(c.L, c.H)) + ': ' + plural(c.H - c.L + 1, 'term') + '.' + (c.terms.some(t => U.isZero(t.pr)) ? ' Inside the limits a term can still be 0 where your PMF is 0 (grey rows).' : '') : 'No ' + tex('x') + ' satisfies both, so the sum is empty: ' + tex('f_Z(' + z + ')=0') + '.',
      });
      if (c.terms.length) {
        const rows = c.terms.map(t => ({ cls: U.isZero(t.pr) ? 't4b-zero' : null, cells: [tex(String(t.x)), tex(U.tx(t.a)), tex(String(t.y)), tex(U.tx(t.b)), tex(U.tx(t.pr))] }));
        steps.push({ html: 'One row per ' + tex('x') + ' from ' + c.L + ' to ' + c.H + '. Multiply across:', block: U.table([tex('x'), tex('f_X(x)'), tex(z + '-x'), tex('f_Y(' + z + '-x)'), tex('f_X(x)\\,f_Y(' + z + '-x)')], rows, { tall: rows.length > 12 }) });
      }
      const nz = c.terms.filter(t => !U.isZero(t.pr));
      steps.push({
        html: 'Add the products' + (nz.length && nz.length < c.terms.length ? ' (the ' + plural(c.terms.length - nz.length, 'grey row') + ' add 0)' : '') + ':',
        math: sumLine('f_Z(' + z + ')=', nz, t => U.tx(t.a) + '\\cdot ' + U.tx(t.b), c.tot),
        note: nz.length > 6 ? 'All ' + nz.length + ' products are in the table above.' : '',
      });
      return K.steps(steps);
    }
    function convJoint(D) {
      const z = st.z, J = D.J, c = D.conv(z);
      const steps = [];
      steps.push({ html: 'Split ' + tex('\\{Z=' + z + '\\}') + ' by the value of ' + tex('X') + ': when ' + tex('X=x') + ', ' + tex('Y') + ' must be ' + tex(z + '-x') + '. The pieces cannot happen together, so add them. This reads the joint table directly and needs <b>no</b> independence:', math: '\\begin{aligned}f_Z(z)&=\\sum_x f_{XY}(x,\\,z-x)\\\\ f_Z(' + z + ')&=\\sum_x f_{XY}(x,\\,' + z + '-x)\\end{aligned}' });
      steps.push({ html: '<b>The limits.</b> ' + tex('x') + ' runs over the values of ' + tex('X') + ' in your table, ' + tex('\\{' + J.xs.join(',') + '\\}') + '. A term is 0 unless ' + tex(z + '-x') + ' is a value of ' + tex('Y') + ' in your table, ' + tex('\\{' + J.ys.join(',') + '\\}') + ', and that cell is not 0.' });
      const rows = c.terms.map(t => ({ cls: U.isZero(t.pr) ? 't4b-zero' : null, cells: [tex(String(t.x)), tex(String(t.y)), t.inY ? 'yes' : 'no', tex(t.inY ? 'f_{XY}(' + t.x + ',' + t.y + ')=' + U.tx(t.pr) : '0')] }));
      steps.push({ html: 'One row per value of ' + tex('X') + ':', block: U.table([tex('x'), tex(z + '-x'), 'a value of ' + tex('Y') + '?', tex('f_{XY}(x,\\,' + z + '-x)')], rows, { tall: rows.length > 12 }) });
      const nz = c.terms.filter(t => !U.isZero(t.pr));
      steps.push({ html: 'Add:', math: sumLine('f_Z(' + z + ')=', nz, t => 'f_{XY}(' + t.x + ',' + t.y + ')', c.tot) });
      // what the (wrong) convolution of the marginals would give
      const A = D.MX, B = D.MY;
      const wrong = U.sum(J.xs.map(x => U.mul(A.pmf(x), B.pmf(z - x))));
      if (D.indep) {
        steps.push({ html: 'Your table happens to be independent: every cell equals ' + tex('f_X(x)\\,f_Y(y)') + '. So the convolution of the two marginals gives the same value here: ' + tex('\\sum_x f_X(x)\\,f_Y(' + z + '-x)' + U.rel(wrong)) + '.' });
      } else {
        const b = D.bad, fx = A.pmf(b.x), fy = B.pmf(b.y);
        steps.push({
          html: 'Careful: your ' + tex('X') + ' and ' + tex('Y') + ' are <b>not</b> independent. For example ' + tex('f_{XY}(' + b.x + ',' + b.y + ')=' + U.tx(D.f(b.x, b.y))) + ', but ' + tex('f_X(' + b.x + ')\\,f_Y(' + b.y + ')=' + U.tx(fx) + '\\cdot ' + U.tx(fy) + '=' + U.tx(U.mul(fx, fy))) + ' (the marginals add the columns and rows of your table). So the convolution of the marginals is the wrong tool here:',
          math: '\\sum_x f_X(x)\\,f_Y(' + z + '-x)' + U.rel(wrong) + (U.same(wrong, c.tot) ? '\\ \\ (\\text{equal here by chance})' : '\\ne ' + U.tx(c.tot)),
          note: 'L2.10: “The product f_X(x) f_Y(z − x) is allowed only for independent X and Y. Without independence, use f_XY(x, z − x).”',
        });
      }
      return K.steps(steps);
    }

    /* ------------------------------------------------------------------- E[Z] */
    function meanZ(D) {
      if (!D.infinite) return { v: U.sum(D.zs.map((z, i) => U.mul(F(z), D.fz[i]))), exact: true, upTo: D.zHi, rest: 0 };
      const key = JSON.stringify([st.X, st.Y]);
      if (meanCache[key]) return meanCache[key];
      const A = D.MX, B = D.MY;
      const fx = [], fy = [];
      const gx = k => { while (fx.length <= k - A.lo) fx.push(U.num(A.pmf(A.lo + fx.length))); return fx[k - A.lo]; };
      const gy = k => { while (fy.length <= k - B.lo) fy.push(U.num(B.pmf(B.lo + fy.length))); return fy[k - B.lo]; };
      let mass = 0, s = 0, z = D.zLo;
      const cap = D.zLo + 5000;
      for (; z <= cap; z++) {
        const L = Math.max(A.lo, B.finite ? z - B.hi : -Infinity), H = Math.min(A.finite ? A.hi : Infinity, z - B.lo);
        let p = 0;
        for (let x = L; x <= H; x++) p += gx(x) * gy(z - x);
        mass += p; s += z * p;
        if (z >= D.zHi && 1 - mass < 1e-13) break;
      }
      const r = { v: s, exact: false, upTo: Math.min(z, cap), rest: Math.max(0, 1 - mass) };
      meanCache[key] = r;
      return r;
    }
    function drawMean(D) {
      const body = P.mean.body;
      Lab.clear(body);
      const A = D.MX, B = D.MY;
      const ES = U.add(A.mean, B.mean);
      const EZ = meanZ(D);
      const termsZ = D.zs.map((z, i) => ({ z, p: D.fz[i] })).filter(t => !U.isZero(t.p));
      const tT = t => U.par(t.z) + '\\cdot ' + U.tx(t.p);
      const zLine = 'E[Z]=\\sum_z z\\,f_Z(z)=' + (!EZ.exact ? termsZ.slice(0, 2).map(tT).join('+') + '+\\dots' : termsZ.length <= 5 ? termsZ.map(tT).join('+') : termsZ.slice(0, 2).map(tT).join('+') + '+\\dots+' + tT(termsZ[termsZ.length - 1])) + U.rel(EZ.v);
      const ok = U.same(ES, EZ.v, 1e-9);
      body.appendChild(K.steps([
        { html: 'From the PMF of ' + tex('X') + (D.joint ? ' (the marginal of your table)' : '') + ':', math: A.meanTex },
        { html: 'From the PMF of ' + tex('Y') + (D.joint ? ' (the marginal of your table)' : '') + ':', math: B.meanTex },
        { html: 'From the PMF of ' + tex('Z') + ' itself (the bars above)' + (EZ.exact ? '' : ', added up for ' + tex('z=' + D.zLo + ',\\dots,' + EZ.upTo) + '. The probability of ' + tex('Z') + ' beyond ' + EZ.upTo + ' is ' + (EZ.rest > 0 ? tex(U.dec(EZ.rest)) : 'below ' + tex('10^{-13}')) + ', too small to change four decimals') + ':', math: zLine },
        { html: 'Compare:', math: 'E[X]+E[Y]=' + U.tx(A.mean) + '+' + U.tx(B.mean) + U.rel(ES), note: (ok ? '<span class="cgood">Same as ' + tex('E[Z]') + ' ✓</span>' : tex('E[Z]') + ' from the bars: ' + tex(U.dec(EZ.v))) + ' — linearity of expectation: ' + tex('E[X+Y]=E[X]+E[Y]') + ' for any ' + tex('X') + ' and ' + tex('Y') + ', independent or not.' },
      ]));
    }

    /* ------------------------------------------------------------ known results */
    function drawKnown(D) {
      const body = P.known.body;
      Lab.clear(body);
      if (D.joint) {
        body.appendChild(K.note('The named shortcuts (Binomial, Poisson, Geometric, Uniform sums) need <b>independent</b> ' + tex('X') + ' and ' + tex('Y') + ' with named distributions. With a joint table, the answer is always ' + tex('f_Z(z)=\\sum_x f_{XY}(x,\\,z-x)') + ' (above). ' +
          (D.indep ? 'Your table is independent (every cell is ' + tex('f_X(x)f_Y(y)') + '), so the convolution of the marginals also works.' : 'Your table is <b>not</b> independent, so the convolution of the marginals does not work.'), ''));
        return;
      }
      const A = D.MX, B = D.MY;
      const binLike = m => m.fam === 'bernoulli' || m.fam === 'binomial';
      const secs = [];
      if (binLike(A) && binLike(B)) secs.push(binomSec(D));
      if (A.fam === 'poisson' && B.fam === 'poisson') secs.push(poisSec(D), splitSec(D));
      const wait = m => m.fam === 'geometric' || m.fam === 'negbin';
      if (wait(A) && wait(B)) secs.push(A.fam === 'geometric' && B.fam === 'geometric' ? geoSec(D) : nbSec(D));
      if (A.fam === 'uniform' && B.fam === 'uniform') secs.push(uniSec(D));
      if (!secs.length) {
        body.appendChild(K.note('No named shortcut for ' + tex('X\\sim ' + A.tex) + ' plus ' + tex('Y\\sim ' + B.tex) + ': the convolution above is the answer. Shortcuts appear here for Bernoulli or Binomial with the same ' + tex('p') + ', Poisson + Poisson, Geometric or Negative binomial with the same ' + tex('p') + ', and Uniform + Uniform. Try an example from the menu.', ''));
        return;
      }
      secs.forEach(s => body.appendChild(s));
    }
    function checkTable(D, from, to, formula, head) {
      const rows = [];
      let all = true;
      for (let z = from; z <= to; z++) {
        const a = D.conv(z).tot, b = formula(z), ok = U.same(a, b, 1e-9);
        if (!ok) all = false;
        rows.push({ cls: z === st.z ? 't4b-on' : null, cells: [tex(String(z)), tex(U.tx(a)), tex(U.tx(b)), ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>'], onClick: () => setZ(z) });
      }
      return { el: U.table([tex('z'), 'convolution ' + tex('f_Z(z)'), head, 'same?'], rows, { tall: rows.length > 12 }), all };
    }
    function binomSec(D) {
      const A = D.MX, B = D.MY, z = st.z;
      const m = A.params.n, n = B.params.n, N = m + n;
      const p1 = A.params.p, p2 = B.params.p;
      const bernNote = (A.fam === 'bernoulli' || B.fam === 'bernoulli') ? 'A Bernoulli(' + tex('p') + ') is a ' + tex('\\text{Bin}(1,p)') + ': one trial. ' : '';
      if (U.same(p1, p2)) {
        const p = p1, q = U.sub(F(1), p);
        const sec = U.section(tex('\\text{Bin}(m,p)+\\text{Bin}(n,p)=\\text{Bin}(m+n,p)'),
          bernNote + 'Your ' + tex('X') + ' counts the successes in ' + tex('m=' + m) + ' trial' + (m === 1 ? '' : 's') + ' and ' + tex('Y') + ' in ' + tex('n=' + n) + ' more, every trial with the same ' + tex('p=' + U.tx(p)) + ', all independent. Together they count the successes in ' + tex('m+n=' + m + '+' + n + '=' + N) + ' trials, so ' + tex('Z\\sim\\text{Bin}(' + N + ',' + U.tx(p) + ')') + '.');
        const k0 = Math.max(0, z - n), k1 = Math.min(m, z);
        const ks = U.range(k0, k1);
        const bc = k => Lab.math.choose(m, k) * Lab.math.choose(n, z - k);
        const S = ks.reduce((s, k) => s + bc(k), 0);
        const symT = ks.map(k => '\\binom{' + m + '}{' + k + '}\\binom{' + n + '}{' + (z - k) + '}');
        const numT = ks.map(k => Lab.math.choose(m, k) + '\\cdot ' + Lab.math.choose(n, z - k));
        const short = a => (a.length <= 4 ? a.join('+') : a.slice(0, 2).join('+') + '+\\dots+' + a[a.length - 1]);
        const val = U.mul(U.mul(U.fi(Lab.math.choose(N, z)), U.pow(p, z)), U.pow(q, N - z));
        sec.appendChild(K.steps([
          { html: 'The convolution with ' + tex('q=1-p=' + U.tx(q)) + '. The powers of ' + tex('p') + ' and ' + tex('q') + ' do not depend on ' + tex('k') + ', so they come out of the sum:', math: 'P(Z=z)=\\sum_k\\binom{m}{k}p^{k}q^{m-k}\\binom{n}{z-k}p^{z-k}q^{n-z+k}=p^{z}q^{m+n-z}\\sum_k\\binom{m}{k}\\binom{n}{z-k}' },
          { html: 'At your ' + tex('z=' + z) + ': ' + tex('k') + ' runs from ' + tex('\\max(0,\\,' + z + '-' + n + ')=' + k0) + ' to ' + tex('\\min(' + m + ',\\,' + z + ')=' + k1) + ' (outside, a binomial coefficient is 0):', math: '\\sum_k\\binom{' + m + '}{k}\\binom{' + n + '}{' + z + '-k}=' + short(symT) + '=' + short(numT) + '=' + S },
          { html: 'Choosing ' + z + ' of the ' + N + ' trials = choosing ' + tex('k') + ' of the first ' + m + ' and ' + tex(z + '-k') + ' of the other ' + n + ', for every split ' + tex('k') + ' (Vandermonde). So the sum is ' + tex('\\binom{' + N + '}{' + z + '}=' + Lab.math.choose(N, z)) + ' ' + (S === Lab.math.choose(N, z) ? '✓' : '✗') + ', and', math: 'P(Z=' + z + ')=\\binom{' + N + '}{' + z + '}p^{' + z + '}q^{' + (N - z) + '}=' + Lab.math.choose(N, z) + '\\cdot\\left(' + U.tx(p) + '\\right)^{' + z + '}\\left(' + U.tx(q) + '\\right)^{' + (N - z) + '}' + U.rel(val), note: 'The convolution gave ' + tex(U.tx(D.conv(z).tot)) + (U.same(val, D.conv(z).tot, 1e-9) ? ' — the same ✓' : '') + '.' },
        ]));
        const t = checkTable(D, 0, N, zz => U.mul(U.mul(U.fi(Lab.math.choose(N, zz)), U.pow(p, zz)), U.pow(q, N - zz)), tex('\\binom{' + N + '}{z}p^{z}q^{' + N + '-z}'));
        sec.appendChild(K.note('Every value at once (tap a row to choose ' + tex('z') + '):', 'pl-hint'));
        sec.appendChild(t.el);
        if (A.fam === 'bernoulli' && B.fam === 'bernoulli') sec.appendChild(K.note('This is the lecture’s “sum of Bernoulli trials”: ' + tex('X_1+\\cdots+X_n') + ' with ' + tex('X_i') + ' i.i.d. Bernoulli(' + tex('p') + ') is ' + tex('\\text{Bin}(n,p)') + '. To add a third trial, set ' + tex('X') + ' to ' + tex('\\text{Bin}(2,' + U.tx(p) + ')') + ' and keep ' + tex('Y') + ' Bernoulli (the example “Three tosses of a 1/3 coin”).', 'pl-hint'));
        return sec;
      }
      // different p
      const q1 = U.sub(F(1), p1), q2 = U.sub(F(1), p2);
      const sec = U.section('Different ' + tex('p') + ': not a Binomial',
        bernNote + 'The rule ' + tex('\\text{Bin}(m,p)+\\text{Bin}(n,p)=\\text{Bin}(m+n,p)') + ' needs the <b>same</b> ' + tex('p') + '. Yours are ' + tex('p_X=' + U.tx(p1)) + ' and ' + tex('p_Y=' + U.tx(p2)) + '. The trials are not all alike, so ' + tex('Z') + ' is not a Binomial — here is a test with your numbers.');
      const deg = v => U.isZero(v) || U.same(v, F(1));
      if (deg(p1) || deg(p2)) {
        sec.appendChild(K.note('One of your ' + tex('p') + ' is 0 or 1, so that variable is a constant and the test below does not apply. The convolution above is the answer.', 'pl-hint'));
        return sec;
      }
      const PN = U.mul(U.pow(p1, m), U.pow(p2, n));
      const P0 = U.mul(U.pow(q1, m), U.pow(q2, n));
      const r = Math.pow(U.num(PN), 1 / N), pred = Math.pow(1 - r, N);
      sec.appendChild(K.steps([
        { html: 'Suppose ' + tex('Z\\sim\\text{Bin}(' + N + ',r)') + ' for some ' + tex('r') + '. Then ' + tex('P(Z=' + N + ')=r^{' + N + '}') + ' (every trial succeeds). Yours:', math: 'P(Z=' + N + ')=p_X^{' + m + '}\\,p_Y^{' + n + '}=\\left(' + U.tx(p1) + '\\right)^{' + m + '}\\left(' + U.tx(p2) + '\\right)^{' + n + '}' + U.rel(PN) + '\\ \\Rightarrow\\ r=\\left(' + U.tx(PN) + '\\right)^{1/' + N + '}\\approx ' + U.dec(r) },
        { html: 'Then ' + tex('P(Z=0)') + ' would have to be', math: '(1-r)^{' + N + '}\\approx(1-' + U.dec(r) + ')^{' + N + '}\\approx ' + U.dec(pred) },
        { html: 'But your ' + tex('P(Z=0)') + ' (every trial fails) is', math: '(1-p_X)^{' + m + '}(1-p_Y)^{' + n + '}=\\left(' + U.tx(q1) + '\\right)^{' + m + '}\\left(' + U.tx(q2) + '\\right)^{' + n + '}' + U.rel(P0), note: U.same(P0, pred, 1e-9) ? 'Equal.' : 'Not equal to ' + tex(U.dec(pred)) + ', so no Binomial(' + N + ', r) fits: ' + tex('Z') + ' is not Binomial.' },
      ]));
      return sec;
    }
    function lamFrac(L) { try { return F(L); } catch (e) { return null; } }
    function poisSec(D) {
      const A = D.MX, B = D.MY, z = st.z;
      const L1 = A.params.L, L2 = B.params.L, lam = A.params.lam + B.params.lam, LS = Lab.fmtDec(lam, 4);
      const sec = U.section(tex('\\text{Poisson}(\\lambda_1)+\\text{Poisson}(\\lambda_2)=\\text{Poisson}(\\lambda_1+\\lambda_2)'),
        'Your ' + tex('\\lambda_1=' + L1) + ' (for ' + tex('X') + ') and ' + tex('\\lambda_2=' + L2) + ' (for ' + tex('Y') + '). The lecture’s derivation, line by line, with your numbers:');
      // the constant (λ1+λ2)^z / z!, exact when possible
      const lf = lamFrac(LS);
      const coef = lf && z <= 18 ? U.div(U.pow(lf, z), U.fi(U.fact(z))) : Math.exp(z * Math.log(lam) - lnFactorial(z));
      const val = Math.exp(-lam) * U.num(coef);
      const conv = D.conv(z).tot;
      sec.appendChild(K.steps([
        { html: 'The convolution with its limits: ' + tex('f_X(x)=0') + ' for ' + tex('x<0') + ', and ' + tex('f_Y(z-x)=0') + ' for ' + tex('x>z') + '. So ' + tex('x=0,\\dots,z') + ':', math: 'f_Z(z)=\\sum_{x=0}^{z}f_X(x)\\,f_Y(z-x)' },
        { html: 'Put in both Poisson PMFs:', math: '=\\sum_{x=0}^{z}\\frac{e^{-\\lambda_1}\\lambda_1^{x}}{x!}\\cdot\\frac{e^{-\\lambda_2}\\lambda_2^{z-x}}{(z-x)!}=\\sum_{x=0}^{z}\\frac{e^{-' + L1 + '}\\,' + L1 + '^{x}}{x!}\\cdot\\frac{e^{-' + L2 + '}\\,' + L2 + '^{z-x}}{(z-x)!}' },
        { html: 'The exponentials do not depend on ' + tex('x') + '; take them out, using ' + tex('e^{-' + L1 + '}e^{-' + L2 + '}=e^{-(' + L1 + '+' + L2 + ')}=e^{-' + LS + '}') + ':', math: '=e^{-' + LS + '}\\sum_{x=0}^{z}\\frac{' + L1 + '^{x}\\,' + L2 + '^{z-x}}{x!\\,(z-x)!}' },
        { html: 'Multiply and divide by ' + tex('z!') + ', and use ' + tex('\\frac{z!}{x!\\,(z-x)!}=\\binom{z}{x}') + ':', math: '=\\frac{e^{-' + LS + '}}{z!}\\sum_{x=0}^{z}\\binom{z}{x}' + L1 + '^{x}\\,' + L2 + '^{z-x}' },
        { html: 'The binomial theorem ' + tex('(a+b)^z=\\sum_{x=0}^{z}\\binom{z}{x}a^{x}b^{z-x}') + ' with ' + tex('a=' + L1) + ', ' + tex('b=' + L2) + ':', math: '=\\frac{e^{-' + LS + '}\\,(' + L1 + '+' + L2 + ')^{z}}{z!}=\\frac{e^{-' + LS + '}\\,' + LS + '^{z}}{z!}' },
        { html: 'That is the Poisson PMF with parameter ' + tex('\\lambda_1+\\lambda_2=' + L1 + '+' + L2 + '=' + LS) + ':', math: 'Z=X+Y\\sim\\text{Poisson}(' + LS + ')' },
        { html: 'At your ' + tex('z=' + z) + ':', math: 'f_Z(' + z + ')=\\frac{e^{-' + LS + '}\\,' + LS + '^{' + z + '}}{' + z + '!}=' + U.tx(coef) + '\\,e^{-' + LS + '}' + U.rel(val), note: 'The convolution sum above gave ' + tex(U.dec(conv)) + (U.same(conv, val, 1e-9) ? ' — the same ✓' : '') + '.' },
      ]));
      const t = checkTable(D, D.zLo, Math.min(D.zHi, D.zLo + 15), zz => Math.exp(-lam + zz * Math.log(lam) - lnFactorial(zz)), 'Poisson(' + tex(LS) + ') at ' + tex('z'));
      sec.appendChild(t.el);
      return sec;
    }
    function lnFactorial(k) { let s = 0; for (let i = 2; i <= k; i++) s += Math.log(i); return s; }
    function splitSec(D) {
      const A = D.MX, B = D.MY, n = Math.round(+st.n);
      const L1 = A.params.L, L2 = B.params.L, lam = A.params.lam + B.params.lam, LS = Lab.fmtDec(lam, 4);
      const l1f = lamFrac(L1), lsf = lamFrac(LS);
      const r = l1f && lsf ? U.div(l1f, lsf) : A.params.lam / lam;
      const rq = U.sub(F(1), r);
      const fzn = Math.exp(-lam + n * Math.log(lam) - lnFactorial(n));
      const sec = U.section('Given the total: ' + tex('X\\mid(X+Y=n)\\sim\\text{Bin}\\big(n,\\ \\tfrac{\\lambda_1}{\\lambda_1+\\lambda_2}\\big)'),
        'Choose the total ' + tex('n') + ' in the controls (5 · Poisson split). You chose ' + tex('n=' + n) + '. Then ' + tex('k') + ' runs over ' + tex('0,\\dots,' + n) + '.');
      const rows = U.range(0, n).map(k => {
        const a = A.pmf(k), b = B.pmf(n - k), joint = a * b / fzn;
        const bin = U.mul(U.mul(U.fi(Lab.math.choose(n, k)), U.pow(r, k)), U.pow(rq, n - k));
        const ok = Math.abs(joint - U.num(bin)) <= 1e-9;
        return { cells: [tex(String(k)), tex(U.dec(a)), tex(U.dec(b)), '<span title="' + U.plain(joint) + '">' + tex('\\frac{' + U.dec(a) + '\\cdot ' + U.dec(b) + '}{' + U.dec(fzn) + '}\\approx ' + U.dec(joint)) + '</span>', '<span title="' + U.plain(bin) + '">' + tex(U.tx(bin)) + '</span>', ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>'] };
      });
      sec.appendChild(K.steps([
        { html: 'Conditional probability. If ' + tex('X=k') + ' and ' + tex('X+Y=' + n) + ', then ' + tex('Y=' + n + '-k') + '; independence splits the top:', math: 'P(X=k\\mid X+Y=' + n + ')=\\frac{P(X=k,\\ Y=' + n + '-k)}{P(X+Y=' + n + ')}=\\frac{f_X(k)\\,f_Y(' + n + '-k)}{f_Z(' + n + ')}' },
        { html: 'The bottom, from ' + tex('Z\\sim\\text{Poisson}(' + LS + ')') + ' (above):', math: 'f_Z(' + n + ')=\\frac{e^{-' + LS + '}\\,' + LS + '^{' + n + '}}{' + n + '!}' + U.rel(fzn) },
        { html: 'Put in the three Poisson PMFs: ' + tex('e^{-\\lambda_1}e^{-\\lambda_2}') + ' cancels with ' + tex('e^{-(\\lambda_1+\\lambda_2)}') + ', and ' + tex('n!') + ' moves to the top:', math: '=\\binom{n}{k}\\frac{\\lambda_1^{k}\\lambda_2^{n-k}}{(\\lambda_1+\\lambda_2)^{n}}=\\binom{n}{k}\\left(\\frac{\\lambda_1}{\\lambda_1+\\lambda_2}\\right)^{k}\\left(\\frac{\\lambda_2}{\\lambda_1+\\lambda_2}\\right)^{n-k}' },
        { html: 'With your numbers:', math: 'r=\\frac{\\lambda_1}{\\lambda_1+\\lambda_2}=\\frac{' + L1 + '}{' + L1 + '+' + L2 + '}' + U.rel(r) + '\\quad\\Rightarrow\\quad X\\mid(X+Y=' + n + ')\\sim\\text{Bin}(' + n + ',\\,' + U.tx(r) + ')' },
        { html: 'Both ways, for every ' + tex('k') + ':', block: U.table([tex('k'), tex('f_X(k)'), tex('f_Y(' + n + '-k)'), 'from the joint ' + tex('\\frac{f_X(k)f_Y(' + n + '-k)}{f_Z(' + n + ')}'), 'formula ' + tex('\\binom{' + n + '}{k}r^{k}(1-r)^{' + n + '-k}'), 'same?'], rows, { tall: rows.length > 12 }) },
      ]));
      return sec;
    }
    function geoSec(D) {
      const A = D.MX, B = D.MY, z = st.z;
      const p1 = A.params.p, p2 = B.params.p, q1 = A.params.q, q2 = B.params.q;
      if (U.same(p1, p2)) {
        const p = p1, q = q1;
        const val = z >= 2 ? U.mul(U.mul(F(z - 1), U.pow(p, 2)), U.pow(q, z - 2)) : F(0);
        const sec = U.section(tex('\\text{Geometric}(p)+\\text{Geometric}(p)') + ': ' + tex('P(Z=s)=(s-1)\\,p^{2}(1-p)^{s-2}'),
          'Both start at 1 and have the same ' + tex('p=' + U.tx(p)) + '. The lecture’s exercise, with your numbers; ' + tex('s') + ' is a value of ' + tex('Z') + ' (so ' + tex('s\\ge2') + ').');
        sec.appendChild(K.steps([
          { html: 'The limits: ' + tex('x\\ge1') + ' and ' + tex('s-x\\ge1') + ', so ' + tex('x=1,\\dots,s-1') + ':', math: 'P(Z=s)=\\sum_{x=1}^{s-1}(1-p)^{x-1}p\\cdot(1-p)^{s-x-1}p' },
          { html: 'Every term is the same, ' + tex('(1-p)^{x-1}(1-p)^{s-x-1}=(1-p)^{s-2}') + ', and there are ' + tex('s-1') + ' terms:', math: '=(s-1)\\,p^{2}(1-p)^{s-2}' },
          z >= 2 ? { html: 'At your ' + tex('s=z=' + z) + ' with ' + tex('p=' + U.tx(p)) + ':', math: 'P(Z=' + z + ')=(' + z + '-1)\\left(' + U.tx(p) + '\\right)^{2}\\left(' + U.tx(q) + '\\right)^{' + z + '-2}=' + (z - 1) + '\\cdot ' + U.tx(U.pow(p, 2)) + '\\cdot ' + U.tx(U.pow(q, z - 2)) + U.rel(val), note: 'The convolution gave ' + tex(U.tx(D.conv(z).tot)) + (U.same(val, D.conv(z).tot, 1e-9) ? ' — the same ✓' : '') + '.' } : null,
          { html: 'This is the Negative Binomial' + tex('(2,p)') + ': the trial on which the <b>second</b> success comes. Its formula ' + tex('\\binom{s-1}{r-1}p^{r}(1-p)^{s-r}') + ' with ' + tex('r=2') + ' is ' + tex('\\binom{s-1}{1}p^{2}(1-p)^{s-2}=(s-1)\\,p^{2}(1-p)^{s-2}') + ' — the same line.', note: 'To add a third geometric, choose “Negative binomial(r, p)” with ' + tex('r=2') + ' for ' + tex('X') + ' and keep ' + tex('Y') + ' Geometric (the example “Three i.i.d. Geometric(1/2)”).' },
        ]));
        sec.appendChild(checkTable(D, 2, Math.min(D.zHi, 2 + 13), s => U.mul(U.mul(F(s - 1), U.pow(p, 2)), U.pow(q, s - 2)), 'NegBin(2, ' + tex(U.tx(p)) + '): ' + tex('(z-1)p^{2}(1-p)^{z-2}')).el);
        return sec;
      }
      const sec = U.section('Two geometrics with different ' + tex('p'),
        'The shortcut ' + tex('(s-1)p^{2}(1-p)^{s-2}') + ' needs the same ' + tex('p') + ' (then every term of the sum is equal). Yours are ' + tex('p_X=' + U.tx(p1)) + ' and ' + tex('p_Y=' + U.tx(p2)) + ', so the terms change with ' + tex('x') + '. The sum still has a closed form:');
      const cf = s => U.div(U.mul(U.mul(p1, p2), U.sub(U.pow(q1, s - 1), U.pow(q2, s - 1))), U.sub(q1, q2));
      sec.appendChild(K.steps([
        { html: 'The convolution, ' + tex('x=1,\\dots,s-1') + ':', math: 'P(Z=s)=\\sum_{x=1}^{s-1}(1-p_X)^{x-1}p_X\\,(1-p_Y)^{s-x-1}p_Y' },
        { html: 'With ' + tex('a=1-p_X=' + U.tx(q1)) + ' and ' + tex('b=1-p_Y=' + U.tx(q2)) + ', the sum ' + tex('\\sum_{x=1}^{s-1}a^{x-1}b^{s-1-x}=\\frac{a^{s-1}-b^{s-1}}{a-b}') + ':', math: 'P(Z=s)=p_X\\,p_Y\\,\\frac{a^{s-1}-b^{s-1}}{a-b}' },
        z >= 2 ? { html: 'At your ' + tex('s=z=' + z) + ':', math: 'P(Z=' + z + ')=' + U.tx(p1) + '\\cdot ' + U.tx(p2) + '\\cdot\\frac{\\left(' + U.tx(q1) + '\\right)^{' + (z - 1) + '}-\\left(' + U.tx(q2) + '\\right)^{' + (z - 1) + '}}{' + U.tx(q1) + '-' + U.tx(q2) + '}' + U.rel(cf(z)), note: 'The convolution gave ' + tex(U.tx(D.conv(z).tot)) + (U.same(cf(z), D.conv(z).tot, 1e-9) ? ' — the same ✓' : '') + '.' } : null,
      ]));
      return sec;
    }
    /** Geometric/NegBin inputs, at least one NegBin: NegBin(r1, p) + NegBin(r2, p) = NegBin(r1 + r2, p) (L2.10 exercises) */
    function nbSec(D) {
      const A = D.MX, B = D.MY, z = st.z;
      const rOf = m => (m.fam === 'geometric' ? 1 : m.params.r);
      const r1 = rOf(A), r2 = rOf(B), r = r1 + r2;
      const p1 = A.params.p, p2 = B.params.p;
      const asNb = m => (m.fam === 'geometric' ? tex(m.nm + '\\sim ' + m.tex + '=\\text{NegBin}(1,' + U.tx(m.params.p) + ')') : tex(m.nm + '\\sim ' + m.tex));
      if (!U.same(p1, p2)) {
        return U.section('Different ' + tex('p') + ': not a negative binomial',
          'The rule ' + tex('\\text{NegBin}(r_1,p)+\\text{NegBin}(r_2,p)=\\text{NegBin}(r_1+r_2,p)') + ' needs the <b>same</b> ' + tex('p') + ' on every trial. Yours are ' + tex('p_X=' + U.tx(p1)) + ' and ' + tex('p_Y=' + U.tx(p2)) + ', so no NegBin formula applies: the convolution above is the answer.');
      }
      const p = p1, q = U.sub(F(1), p);
      // binomial coefficients as BigInt, so the count check stays exact for any r and z
      const cB = (n, k) => { if (k < 0 || k > n) return 0n; k = Math.min(k, n - k); let c = 1n; for (let i = 1; i <= k; i++) c = (c * BigInt(n - k + i)) / BigInt(i); return c; };
      const big = v => { const s = String(v); return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '{,}') : s; };
      const nbP = s => (s < r ? F(0) : U.mul(U.mul(U.fi(U.chooseN(s - 1, r - 1)), U.pow(p, r)), U.pow(q, s - r)));
      const sec = U.section(tex('\\text{NegBin}(r_1,p)+\\text{NegBin}(r_2,p)=\\text{NegBin}(r_1+r_2,p)'),
        'Yours: ' + asNb(A) + ' and ' + asNb(B) + ', independent, with the same ' + tex('p=' + U.tx(p)) + '. Picture one long row of trials: ' + tex('X') + ' is the trial of success number ' + tex('r_1=' + r1) + ' (a Geometric waits for the first one), and ' + tex('Y') + ' counts the further trials up to ' + tex('r_2=' + r2) + ' more successes. So ' + tex('Z=X+Y') + ' is the trial of success number ' + tex('r=r_1+r_2=' + r1 + '+' + r2 + '=' + r) + ': ' + tex('Z\\sim\\text{NegBin}(' + r + ',' + U.tx(p) + ')') + '. The lecture leaves this as an exercise (L2.10 ≈ 32 min: “sum of r i.i.d. geometric”, “sum of two independent negative binomial”); the steps are ours, with your numbers.');
      const steps = [
        { html: 'The convolution. ' + tex('f_X(x)=0') + ' unless ' + tex('x\\ge ' + r1) + ', and ' + tex('f_Y(s-x)=0') + ' unless ' + tex('s-x\\ge ' + r2) + '. So ' + tex('x') + ' runs from ' + tex(r1) + ' to ' + tex('s-' + r2) + ':', math: '\\begin{aligned}P(Z=s)&=\\sum_{x=' + r1 + '}^{s-' + r2 + '}f_X(x)\\,f_Y(s-x)\\\\&=\\sum_{x=' + r1 + '}^{s-' + r2 + '}\\binom{x-1}{' + (r1 - 1) + '}p^{' + r1 + '}q^{x-' + r1 + '}\\\\&\\qquad\\cdot\\binom{s-x-1}{' + (r2 - 1) + '}p^{' + r2 + '}q^{s-x-' + r2 + '}\\end{aligned}' },
        { html: 'With ' + tex('q=1-p=' + U.tx(q)) + ': ' + tex('p^{' + r1 + '}p^{' + r2 + '}=p^{' + r + '}') + ' and ' + tex('q^{x-' + r1 + '}q^{s-x-' + r2 + '}=q^{s-' + r + '}') + ' do not depend on ' + tex('x') + ', so they come out of the sum:', math: '\\begin{aligned}P(Z=s)&=p^{' + r + '}q^{s-' + r + '}\\\\&\\quad\\times\\sum_{x=' + r1 + '}^{s-' + r2 + '}\\binom{x-1}{' + (r1 - 1) + '}\\binom{s-x-1}{' + (r2 - 1) + '}\\end{aligned}' },
      ];
      if (z >= r) {
        const xs = U.range(r1, z - r2);
        const cnt = xs.map(x => cB(x - 1, r1 - 1) * cB(z - x - 1, r2 - 1));
        const S = cnt.reduce((a, b) => a + b, 0n), C = cB(z - 1, r - 1);
        const short = (a, k) => (a.length <= k ? a.join('+') : a.slice(0, 2).join('+') + '+\\dots+' + a[a.length - 1]);
        const symT = xs.map(x => '\\binom{' + (x - 1) + '}{' + (r1 - 1) + '}\\binom{' + (z - x - 1) + '}{' + (r2 - 1) + '}');
        const val = nbP(z);
        steps.push({ html: 'Count the sum: the ' + tex('r-1=' + (r - 1)) + ' successes before the last one sit somewhere in the first ' + tex('s-1') + ' trials, and ' + tex('x') + ' is the trial of success number ' + tex(r1) + '. Every placement is counted once, so the sum is ' + tex('\\binom{s-1}{r-1}') + '. At your ' + tex('s=z=' + z) + ' (' + tex('x=' + U.setTex(r1, z - r2)) + ', ' + plural(xs.length, 'term') + '):', math: '\\begin{aligned}&' + short(symT, 3) + '\\\\&=' + short(cnt.map(big), 6) + '=' + big(S) + (S === C ? '=\\binom{' + (z - 1) + '}{' + (r - 1) + '}' : '\\ne\\binom{' + (z - 1) + '}{' + (r - 1) + '}=' + big(C)) + '\\end{aligned}', note: S === C ? 'The count agrees ✓' : '' });
        steps.push({ html: 'So the NegBin formula ' + tex('\\binom{s-1}{r-1}p^{r}(1-p)^{s-r}') + ' with ' + tex('r=' + r) + ', at ' + tex('s=' + z) + ':', math: 'P(Z=' + z + ')=\\binom{' + (z - 1) + '}{' + (r - 1) + '}\\left(' + U.tx(p) + '\\right)^{' + r + '}\\left(' + U.tx(q) + '\\right)^{' + (z - r) + '}=' + big(C) + '\\cdot ' + U.tx(U.pow(p, r)) + '\\cdot ' + U.tx(U.pow(q, z - r)) + U.rel(val), note: 'The convolution gave ' + tex(U.tx(D.conv(z).tot)) + (U.same(val, D.conv(z).tot, 1e-9) ? ' — the same ✓' : '') + '.' });
      } else {
        steps.push({ html: 'At your ' + tex('z=' + z) + ': ' + tex('z<r=' + r) + ', so ' + tex('P(Z=' + z + ')=0') + ' — ' + z + ' trials cannot hold ' + r + ' successes.' });
      }
      sec.appendChild(K.steps(steps));
      sec.appendChild(K.note('Every value at once: the convolution next to the NegBin(' + tex(r + ',' + U.tx(p)) + ') formula (tap a row to choose ' + tex('z') + '):', 'pl-hint'));
      sec.appendChild(checkTable(D, r, Math.min(D.zHi, r + 13), nbP, 'NegBin(' + tex(r + ',' + U.tx(p)) + '): ' + tex('\\binom{z-1}{' + (r - 1) + '}p^{' + r + '}(1-p)^{z-' + r + '}')).el);
      return sec;
    }
    function uniSec(D) {
      const A = D.MX, B = D.MY, z = st.z;
      const a1 = A.params.a, b1 = A.params.b, n1 = A.params.n, a2 = B.params.a, b2 = B.params.b, n2 = B.params.n;
      const count = zz => Math.max(0, Math.min(b1, zz - a2) - Math.max(a1, zz - b2) + 1);
      const N = n1 * n2, c = count(z);
      const same = n1 === n2;
      const sec = U.section(same ? 'Two uniforms of the same size: a triangle' : 'Two uniforms of different sizes: a trapezoid',
        'Every pair ' + tex('(x,y)') + ' has the same probability ' + tex('\\frac{1}{' + n1 + '}\\cdot\\frac{1}{' + n2 + '}=\\frac{1}{' + N + '}') + ' (' + tex('n_X=' + n1) + ' values for ' + tex('X') + ', ' + tex('n_Y=' + n2) + ' for ' + tex('Y') + '). So ' + tex('P(Z=z)') + ' is the number of pairs on the line ' + tex('x+y=z') + ', divided by ' + N + '.');
      const lo = Math.max(a1, z - b2), hi = Math.min(b1, z - a2);
      const pz = F(c, N);
      const pzT = U.overTex(c, N);
      const steps = [
        { html: 'Count the pairs at your ' + tex('z=' + z) + ': ' + tex('x') + ' needs ' + tex(a1 + '\\le x\\le ' + b1) + ' and ' + tex(U.par(a2) + '\\le ' + z + '-x\\le ' + b2) + ':', math: '\\max(' + a1 + ',\\,' + z + '-' + U.par(b2) + ')\\le x\\le\\min(' + b1 + ',\\,' + z + '-' + U.par(a2) + ')\\ \\Rightarrow\\ ' + lo + '\\le x\\le ' + hi + ':\\ ' + (c ? hi + '-' + U.par(lo) + '+1=' + c : '0') + '\\text{ pairs}', note: tex('P(Z=' + z + ')=' + pzT) + (U.same(pz, D.conv(z).tot) ? ' — the same as the convolution ✓' : '') },
      ];
      if (same) {
        const n = n1, peak = a1 + a2 + n - 1;
        steps.push({ html: 'The counts rise by one up to the peak ' + tex('z=a_X+a_Y+n-1=' + a1 + '+' + U.par(a2) + '+' + n + '-1=' + peak) + ', where all ' + tex('n=' + n) + ' values of ' + tex('x') + ' work, and fall by one after it:', math: '\\#\\text{pairs}=n-|z-' + U.par(peak) + '|=' + n + '-|' + z + '-' + U.par(peak) + '|=' + c });
        if (a1 === 1 && a2 === 1) {
          const up = z <= n + 1;
          steps.push({ html: 'The lecture’s form (L2.8, values 1 to ' + tex('n') + '), with ' + tex('n=' + n) + ':', math: 'P(W=w)=\\begin{cases}\\dfrac{w-1}{n^2}, & 2\\le w\\le n+1\\\\[2mm]\\dfrac{2n-w+1}{n^2}, & n+2\\le w\\le 2n\\end{cases}', note: 'At ' + tex('w=' + z) + (up ? ' (' + tex('\\le n+1=' + (n + 1)) + '): ' + tex('\\frac{' + z + '-1}{' + n * n + '}=\\frac{' + (z - 1) + '}{' + n * n + '}') : ' (' + tex('\\ge n+2=' + (n + 2)) + '): ' + tex('\\frac{2\\cdot' + n + '-' + z + '+1}{' + n * n + '}=\\frac{' + (2 * n - z + 1) + '}{' + n * n + '}')) + ' ✓' });
        }
      } else {
        steps.push({ html: 'With ' + tex('n_X=' + n1) + ' and ' + tex('n_Y=' + n2) + ', the count climbs by one up to ' + tex('\\min(n_X,n_Y)=' + Math.min(n1, n2)) + ', stays there, then falls by one: a flat-topped triangle (trapezoid).' });
      }
      const counts = D.zs.map(count);
      steps.push({ html: 'All the counts, for ' + tex('z=' + D.zLo + ',\\dots,' + D.zHi) + ':', math: (counts.length <= 24 ? counts.join(',\\ ') + '\\quad' : '') + '(\\text{total } ' + counts.reduce((s, v) => s + v, 0) + '=n_X\\,n_Y=' + n1 + '\\cdot ' + n2 + ')' });
      sec.appendChild(K.steps(steps));
      return sec;
    }
  }

  Lab.lab({
    id: 'lab-s2-sum', course: 's2', week: 2, order: 4,
    title: 'Sums and convolution lab', sub: 'Week 2 · L2.8, L2.10',
    topics: ['X + Y', 'star grid', 'convolution', 'limits of the sum', 'PMF and CDF of Z', 'E[X + Y]', 'Binomial, Poisson, Geometric sums', 'negative binomial', 'X given X + Y'],
    desc: 'Choose X and Y (uniform, Bernoulli, binomial, geometric, negative binomial, Poisson or your own PMF), or type a joint table. See the stars on the line x + y = z, the convolution term by term with your numbers, the PMF and CDF of Z next to the CDFs of X and Y, and the known shortcuts.',
    render: host => sumLab(host),
  });
})();
