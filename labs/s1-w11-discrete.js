/* Revise — Statistics I, Week 11 lab: Bernoulli, binomial, hypergeometric, Poisson and geometric.
   The learner types every parameter; every picture, table and formula redraws (LABS.md).
   Rule 0: every number says where it comes from — symbols first, then the learner's numbers.
   Exact fractions use BigInt (class Q below), so nothing overflows; the Poisson PMF uses decimals
   because e^(−λ) is irrational. Styles: assets/css/labs/s7.css (prefix s7-). */
(function () {
  'use strict';
  const { h, svg } = Lab;
  const K = Lab.play;
  const ID = 'lab-s1-discrete';
  const KEY = 'lab:' + ID;
  const DEF = { fam: 'binomial', p: '1/3', n: 10, hN: 20, hm: 7, hn: 5, lam: '2.5', K: 0, x: 3, ev: 'between', a: 2, b: 4, cmpN: 50, t: null };
  const tx = (s, d) => Lab.tex(s, d);
  const range = (a, b) => { const o = []; for (let v = a; v <= b; v++) o.push(v); return o; };
  const plural = (k, w) => k + ' ' + (k === 1 ? w : /(s|x|ch|sh)$/.test(w) ? w + 'es' : w + 's');
  /** Several equations, one per line, left-aligned (display TeX). */
  const lines = (...ls) => (ls.length === 1 ? ls[0] : '\\begin{aligned}&' + ls.join('\\\\&') + '\\end{aligned}');

  /* ============================================================ exact fractions (BigInt) */
  const B = BigInt;
  const bAbs = v => (v < 0n ? -v : v);
  function bGcd(a, b) { a = bAbs(a); b = bAbs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  const bLen = v => (v === 0n ? 0 : bAbs(v).toString(2).length);
  /** n/d as a double, also when n and d are far beyond 2^53. */
  function bDiv(n, d) {
    if (n === 0n) return 0;
    const neg = (n < 0n) !== (d < 0n);
    n = bAbs(n); d = bAbs(d);
    const sh = bLen(d) - bLen(n) + 64;
    const q = sh >= 0 ? (n << B(sh)) / d : n / (d << B(-sh));
    const v = Number(q) * Math.pow(2, -sh);
    return neg ? -v : v;
  }
  class Q {
    constructor(n, d = 1n) {
      if (d === 0n) throw new Error('division by zero');
      if (d < 0n) { n = -n; d = -d; }
      const g = bGcd(n, d);
      this.n = g > 1n ? n / g : n;
      this.d = g > 1n ? d / g : d;
    }
    static of(v) {
      if (v instanceof Q) return v;
      if (typeof v === 'bigint') return new Q(v);
      if (typeof v === 'number' && Number.isInteger(v)) return new Q(B(v));
      if (v instanceof Lab.Frac) return new Q(B(v.n), B(v.d));
      throw new Error('not an exact number');
    }
    add(o) { o = Q.of(o); return new Q(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Q.of(o); return new Q(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Q.of(o); return new Q(this.n * o.n, this.d * o.d); }
    div(o) { o = Q.of(o); return new Q(this.n * o.d, this.d * o.n); }
    pow(k) { return new Q(this.n ** B(k), this.d ** B(k)); }
    num() { return bDiv(this.n, this.d); }
    get zero() { return this.n === 0n; }
    eq(o) { o = Q.of(o); return this.n === o.n && this.d === o.d; }
  }
  const Q0 = new Q(0n), Q1 = new Q(1n);
  const qSum = list => list.reduce((s, v) => s.add(v), Q0);
  function bChoose(n, k) { if (k < 0 || k > n) return 0n; k = Math.min(k, n - k); let r = 1n; for (let i = 1; i <= k; i++) r = (r * B(n - k + i)) / B(i); return r; }
  function bFact(n) { let r = 1n; for (let i = 2; i <= n; i++) r *= B(i); return r; }
  const probQ = s => { const f = K.parseProb(s); return f ? Q.of(f) : null; };
  const modeOf = s => (/\//.test(String(s)) ? 'frac' : 'dec');

  /* ============================================================ number formatting */
  const sepD = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  /** Thousands separators in the whole-number part only (0.082085 stays as it is). */
  const sepN = s => { const i = s.indexOf('.'); return i < 0 ? sepD(s) : sepD(s.slice(0, i)) + s.slice(i); };
  const bDigits = v => bAbs(v).toString().length;
  const trimZ = s => (s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''));
  /** Scientific form 1.234 × 10^{-5} (TeX). */
  function sci(v, sig = 4) { const [m, e] = v.toExponential(sig - 1).split('e'); return m + '\\times 10^{' + parseInt(e, 10) + '}'; }
  const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sciText(v, sig = 4) { const [m, e] = v.toExponential(sig - 1).split('e'); return m + '×10' + String(parseInt(e, 10)).split('').map(c => SUPS[c]).join(''); }
  /** A decimal as TeX: 4 places (kept — they show the rounding); very small or large values in scientific form. */
  function d4(v) {
    if (v === 0) return '0';
    if (Number.isInteger(v) && Math.abs(v) < 1e15) return sepD(String(v));
    const a = Math.abs(v);
    if (a < 0.001 || a >= 1e9) return sci(v);
    return v.toFixed(4);
  }
  function d4Text(v) {
    if (v === 0) return '0';
    if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v);
    const a = Math.abs(v);
    if (a < 0.001 || a >= 1e9) return sciText(v);
    return v.toFixed(4);
  }
  /** Six significant digits, for factors inside a longer calculation. */
  function d6(v) { if (v === 0) return '0'; const a = Math.abs(v); if (a < 1e-4 || a >= 1e9) return trimZ(v.toExponential(5).split('e')[0]) + '\\times 10^{' + parseInt(v.toExponential(5).split('e')[1], 10) + '}'; return sepN(trimZ(String(+v.toPrecision(6)))); }
  function termPlaces(q) { let d = q.d, a = 0, b = 0; while (d % 2n === 0n) { d /= 2n; a++; } while (d % 5n === 0n) { d /= 5n; b++; } return d === 1n ? Math.max(a, b) : -1; }
  /** q rounded half-up to dp places, exactly (BigInt). */
  function qRound(q, dp, trim) {
    const neg = q.n < 0n, s = 10n ** B(dp);
    const r = (2n * bAbs(q.n) * s + q.d) / (2n * q.d);
    let str = r.toString();
    if (dp > 0) { str = str.padStart(dp + 1, '0'); str = str.slice(0, -dp) + '.' + str.slice(-dp); if (trim) str = trimZ(str); }
    return (neg && r !== 0n ? '-' : '') + sepD(str.split('.')[0]) + (str.indexOf('.') >= 0 ? '.' + str.split('.')[1] : '');
  }
  const intTexB = v => (v < 0n ? '-' : '') + sepD(bAbs(v).toString());
  /** Exact TeX of q, or null when it would be too long to read. */
  function qEx(q, mode) {
    if (q.d === 1n) return bDigits(q.n) <= 15 ? intTexB(q.n) : null;
    const tp = termPlaces(q);
    const dec = tp >= 0 && tp <= 10 ? qRound(q, tp, true) : null;
    const fr = q.d <= 10000000n ? (q.n < 0n ? '-' : '') + '\\frac{' + sepD(bAbs(q.n).toString()) + '}{' + sepD(q.d.toString()) + '}' : null;
    return mode === 'dec' ? dec || fr : fr || dec;
  }
  /** q to 4 decimal places (exact rounding); tiny values in scientific form. */
  function qD4(q) {
    if (q.n === 0n) return '0';
    const tp = termPlaces(q);
    if (tp >= 0 && tp <= 4) return qRound(q, tp, true);
    const v = q.num();
    if (Math.abs(v) < 0.001 || Math.abs(v) >= 1e9) return sci(v);
    return qRound(q, 4, false);
  }
  const qD4exact = q => { const tp = termPlaces(q); return tp >= 0 && tp <= 4; };
  /** The end of an equation that lands on q: '=exact≈decimal', '=exact' or '≈decimal'. */
  function qEq(q, mode) {
    const ex = qEx(q, mode), ap = qD4(q), rel = qD4exact(q) ? '=' : '\\approx ';
    if (ex == null) return rel + ap;
    if (ex === ap) return '=' + ex;
    return '=' + ex + rel + ap;
  }
  /** Short form for bars and table cells: the exact value when it is short, else 4 decimal places. */
  function qShort(q, mode) {
    const ex = qEx(q, mode);
    if (ex != null && (q.d <= 9999n || qD4exact(q))) return ex;
    return qD4(q);
  }
  /** As a factor in a product: {t, ok} — ok is false when only a rounded decimal can be shown. */
  function qFac(q, mode) { const ex = qEx(q, mode); return ex != null ? { t: ex, ok: true } : { t: qD4(q), ok: false }; }
  /** 'a × b … = result': '=' and the exact result only when every factor is shown exactly, else '≈'. */
  function prodEq(facs, res, mode) { const ok = facs.every(f => f.ok); return (ok ? '=' : '\\approx ') + facs.map(f => f.t).join('\\times ') + (ok ? qEq(res, mode) : '\\approx ' + qD4(res)); }
  const isQ = v => v instanceof Q;
  const vNum = v => (isQ(v) ? v.num() : v);
  const vEq = (v, mode) => (isQ(v) ? qEq(v, mode) : v === 0 ? '=0' : '\\approx ' + d4(v));
  const vShort = (v, mode) => (isQ(v) ? qShort(v, mode) : d4(v));
  const vSum = list => (list.length && list.every(isQ) ? qSum(list) : list.reduce((s, v) => s + vNum(v), 0));
  const vMul = (v, k) => (isQ(v) ? v.mul(k) : v * k);
  const vSub = (a, b) => (isQ(a) && isQ(b) ? a.sub(b) : vNum(a) - vNum(b));
  const vAdd = (a, b) => (isQ(a) && isQ(b) ? a.add(b) : vNum(a) + vNum(b));
  /** Exact big integer, or ≈ scientific form past 15 digits: '=120' or '\approx 1.009\times10^{29}'. */
  const bEq = v => (bDigits(v) <= 15 ? '=' + intTexB(v) : '\\approx ' + sci(Number(v)));
  const bT = v => (bDigits(v) <= 15 ? intTexB(v) : sci(Number(v)));
  /** A list of values as plain text (it can wrap on a phone, unlike one long formula). */
  /** A table cell: plain numbers as text (fast, many rows), anything else through KaTeX. */
  const cell = t => (/^-?[\d{},.]+$/.test(t) ? '<span class="s7-num">' + t.replace(/\{,\}/g, ',').replace(/^-/, '−') + '</span>' : tx(t));
  const listTxt = (xs, max = 14) => '<span class="s7-list">' + (xs.length > max ? xs.slice(0, max - 2).join(', ') + ', …, ' + xs.slice(-2).join(', ') : xs.join(', ')) + '</span>';

  /** C(n, k) worked out: n!/(k!(n−k)!) → cancel the larger factorial → the number. */
  function chooseChain(n, k) {
    const c = bChoose(n, k), small = Math.min(k, n - k);
    let s = '\\binom{' + n + '}{' + k + '}=\\frac{' + n + '!}{' + k + '!\\,' + (n - k) + '!}';
    if (small === 0) return s + '=1';
    if (small <= 6) {
      const top = [], bot = [];
      for (let i = 0; i < small; i++) { top.push(n - i); bot.push(small - i); }
      s += '=\\frac{' + top.join('\\cdot ') + '}{' + bot.join('\\cdot ') + '}';
      if (small > 1) s += '=\\frac{' + bT(top.reduce((a, v) => a * B(v), 1n)) + '}{' + bT(bFact(small)) + '}';
    }
    return s + bEq(c);
  }

  /* ============================================================ inputs */
  /** Number box that keeps exactly what the learner typed (2.5, 5/2, 1/10) + a slider. onChange(value, text). */
  function valField({ label, value, min, max, step, onChange, check, hint }) {
    const input = h('input', { class: 'field mono pl-num s7-val', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal' });
    const rng = h('input', { class: 'slider pl-range', type: 'range', min, max, step });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, rng), msg);
    let lo = min, hi = max;
    const paint = v => { const c = Math.max(lo, Math.min(hi, v)); rng.value = c; rng.style.setProperty('--pct', (hi > lo ? ((c - lo) / (hi - lo)) * 100 : 0) + '%'); };
    const parse = s => {
      s = String(s).trim();
      if (/^[+-]?(\d+\.?\d*|\.\d+)e[+-]?\d+$/i.test(s)) { const v = Number(s); return Number.isFinite(v) ? v : null; }
      const f = K.parseNum(s);
      if (f == null) return null;
      const v = Number(f);
      return Number.isFinite(v) ? v : null;
    };
    function apply() {
      const v = parse(input.value);
      const err = v == null ? 'Type a number, for example 2.5 or 5/2.' : check ? check(v) : null;
      if (err) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">' + err + '</span>'); return; }
      input.classList.remove('bad');
      Lab.setHTML(msg, hint ? hint(v, input.value) : '');
      paint(v);
      onChange(v, input.value.trim());
    }
    input.addEventListener('input', apply);
    rng.addEventListener('input', () => { input.value = String(+(+rng.value).toFixed(6)); apply(); });
    const v0 = parse(value);
    if (v0 != null) { paint(v0); if (hint) Lab.setHTML(msg, hint(v0, String(value))); }
    wrap.input = input;
    wrap.set = s => { input.value = String(s); input.classList.remove('bad'); const v = parse(s); if (v != null) { paint(v); Lab.setHTML(msg, hint ? hint(v, String(s)) : ''); } };
    return wrap;
  }

  /* ============================================================ charts */
  function niceTicks(lo, hi, count) {
    const span = hi - lo || Math.abs(hi) || 1;
    const raw = span / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const nrm = raw / mag;
    const step = (nrm < 1.5 ? 1 : nrm < 3 ? 2 : nrm < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.floor(lo / step) * step; v <= hi + step * 0.999; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  /** Grouped bars: PMFs side by side. series: [{name (html), plain, vals: number[], cls}] */
  function cmpChart(xs, series, opts = {}) {
    const W = 720, H = opts.height || 230, pl = 52, pr = 10, pt = 12, pb = 30;
    const nx = xs.length, ns = series.length;
    const vmax = Math.max(1e-12, ...series.flatMap(se => se.vals.filter(Number.isFinite)));
    const ticks = niceTicks(0, vmax, 4);
    const ymax = ticks[ticks.length - 1] || vmax;
    const Y = v => pt + (1 - v / ymax) * (H - pt - pb);
    const band = (W - pl - pr) / nx;
    const bw = Math.min(18, (band * 0.86) / ns);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 's7-cmp', role: 'img', 'aria-label': opts.aria || 'bar chart' });
    ticks.forEach(t => {
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 's7-grid' }));
      s.appendChild(svg('text', { x: pl - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 's7-tick' }, String(+t.toPrecision(6))));
    });
    const every = Math.max(1, Math.ceil(nx / 22));
    xs.forEach((x, i) => {
      const cx = pl + band * (i + 0.5);
      series.forEach((se, j) => {
        const v = se.vals[i];
        if (!(v > 0)) return;
        const r = svg('rect', { x: cx - (ns * bw) / 2 + j * bw, y: Y(v), width: Math.max(1, bw - 1), height: Math.max(0.6, Y(0) - Y(v)), rx: 1.5, class: 's7-bar ' + se.cls });
        r.appendChild(svg('title', {}, se.plain + ': ' + (opts.yPlain || 'P') + '(' + (opts.xPlain || 'X') + ' = ' + x + ') ≈ ' + d4Text(v)));
        s.appendChild(r);
      });
      if (i % every === 0) s.appendChild(svg('text', { x: cx, y: H - pb + 17, 'text-anchor': 'middle', class: 's7-tick' }, String(x)));
    });
    s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(0), y2: Y(0), class: 's7-axis' }));
    s.appendChild(svg('text', { x: (W + pl) / 2, y: H - 1, 'text-anchor': 'middle', class: 's7-tick' }, opts.xLabel || 'x'));
    const legend = h('div', { class: 's7-legend' }, series.map(se => { const k = h('span', { class: 's7-key' }, h('i', { class: se.cls })); const t = h('span'); Lab.setHTML(t, se.name); k.appendChild(t); return k; }));
    return h('div', { class: 's7-cmpwrap' }, h('div', { class: 's7-scroll' }, s), legend);
  }
  /** Plain table (cells are HTML, may hold rendered TeX). opts.tall → scroll box; opts.hl(rowIndex) → highlighted row. */
  function table(head, rows, opts = {}) {
    const t = h('table', { class: 'tbl s7-tbl' });
    t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach((r, i) => tb.appendChild(h('tr', { class: (opts.hl && opts.hl(i) ? 'hl-row' : '') + (opts.foot && i === rows.length - 1 ? ' s7-sum' : '') || null }, r.map(c => h('td', { html: c })))));
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap s7-tblwrap' + (opts.tall ? ' s7-tall' : '') }, t);
  }

  /* ============================================================ the five families */
  const lnFactC = [0];
  function lnFact(x) { for (let i = lnFactC.length; i <= x; i++) lnFactC[i] = lnFactC[i - 1] + Math.log(i); return lnFactC[x]; }
  function poisPmf(lam, x) { return Number.isInteger(x) && x >= 0 ? Math.exp(-lam + x * Math.log(lam) - lnFact(x)) : 0; }
  /** Σ_{x>k} x^pow · P(X = x) for Poisson(λ), added term by term until the terms are negligible. */
  function poisTail(lam, k, pow = 0) {
    let s = 0, x = Math.max(0, k + 1), t = poisPmf(lam, x);
    for (let guard = 0; guard < 100000; guard++) {
      s += Math.pow(x, pow) * t;
      x++; t = (t * lam) / x;
      if (x > lam + 1 && (t === 0 || Math.pow(x, pow) * t < s * 1e-17)) break;
    }
    return s;
  }
  const FAMS = {
    bernoulli: { label: 'Bernoulli(p)' },
    binomial: { label: 'Binomial(n, p)' },
    hyper: { label: 'Hypergeometric(N, m, n)' },
    poisson: { label: 'Poisson(λ)' },
    geometric: { label: 'Geometric(p) on {1, 2, …}' },
  };

  function famBernoulli(st) {
    const p = probQ(st.p), mode = modeOf(st.p), q = Q1.sub(p);
    const pT = qEx(p, mode), qT = qEx(q, mode);
    return {
      fam: 'bernoulli', mode, exact: true, p, q, pT, qT, pn: p.num(), lo: 0, hi: 1, K: 1, common: p.d,
      pAt: x => (x === 1 ? p : x === 0 ? q : Q0),
      lawN: '\\text{Bernoulli}(' + pT + ')',
      what: tx('X') + ' is one trial: ' + tx('X=1') + ' for a success (chance ' + tx('p=' + pT) + '), ' + tx('X=0') + ' for a failure (chance ' + tx('1-p=' + qT) + ').',
      pmfSym: 'P(X=x)=p^{x}(1-p)^{1-x},\\quad x\\in\\{0,1\\}',
      term: x => (x === 1 ? 'p=' + pT : '1-p=' + qT),
      E: { sym: 'E(X)=p', num: 'E(X)=p', val: p },
      V: { sym: '\\mathrm{Var}(X)=p(1-p)', num: '\\mathrm{Var}(X)=p(1-p)=' + pT + '\\times ' + qT, val: p.mul(q) },
      one(x) {
        if (x !== 0 && x !== 1) return [{ html: 'A Bernoulli ' + tx('X') + ' is 0 or 1 only. ' + tx('x=' + x) + ' is neither, so ' + tx('P(X=' + x + ')=0') + '.' }];
        return [
          { html: 'The Bernoulli PMF (Week 10–11): one trial, success = 1.', math: 'P(X=x)=p^{x}(1-p)^{1-x},\\quad x\\in\\{0,1\\}' },
          { html: 'Your numbers: ' + tx('p=' + pT) + ', so ' + tx('1-p=1-' + pT + '=' + qT) + '. Put in ' + tx('x=' + x) + ':',
            math: x === 1 ? 'P(X=1)=p^{1}(1-p)^{0}=p=' + pT : 'P(X=0)=p^{0}(1-p)^{1}=1-p=' + qT,
            note: 'Anything to the power 0 is 1, so only one factor is left.' },
        ];
      },
      sample() { const s = Math.random() < this.pn ? 1 : 0; return { x: s, seq: String(s) }; },
    };
  }

  function famBinomial(st) {
    const n = st.n, p = probQ(st.p), mode = modeOf(st.p), q = Q1.sub(p);
    const den = p.d ** B(n);
    const pq = range(0, n).map(x => new Q(bChoose(n, x) * p.n ** B(x) * q.n ** B(n - x), den));
    const pT = qEx(p, mode), qT = qEx(q, mode);
    return {
      fam: 'binomial', mode, exact: true, n, p, q, pT, qT, pn: p.num(), lo: 0, hi: n, K: n, common: den,
      pAt: x => (Number.isInteger(x) && x >= 0 && x <= n ? pq[x] : Q0),
      lawN: '\\text{Bin}(' + n + ',' + pT + ')',
      what: tx('X') + ' = number of successes in ' + tx('n=' + n) + ' independent trials; each trial is a success with chance ' + tx('p=' + pT) + '.',
      pmfSym: 'P(X=x)=\\binom{n}{x}p^{x}(1-p)^{n-x},\\quad x=0,1,\\dots,n',
      term: x => '\\binom{' + n + '}{' + x + '}\\left(' + pT + '\\right)^{' + x + '}\\left(' + qT + '\\right)^{' + (n - x) + '}',
      E: { sym: 'E(X)=np', num: 'E(X)=np=' + n + '\\times ' + pT, val: p.mul(n) },
      V: { sym: '\\mathrm{Var}(X)=np(1-p)', num: '\\mathrm{Var}(X)=np(1-p)=' + n + '\\times ' + pT + '\\times ' + qT, val: p.mul(q).mul(n) },
      one(x) {
        if (!(Number.isInteger(x) && x >= 0 && x <= n)) return [{ html: tx('X') + ' counts successes in ' + tx('n=' + n) + ' trials, so it can only be ' + tx('0,1,\\dots,' + n) + '. ' + tx('x=' + x) + ' is not one of them, so ' + tx('P(X=' + x + ')=0') + '.' }];
        const k = n - x, c = bChoose(n, x), px = p.pow(x), qk = q.pow(k), one = px.mul(qk), res = one.mul(new Q(c));
        const fp = qFac(px, mode), fq = qFac(qk, mode), fo = qFac(one, mode), fc = { t: bT(c), ok: bDigits(c) <= 15 };
        return [
          { html: 'The binomial PMF (Week 11): choose which ' + tx('x') + ' of the ' + tx('n') + ' trials are successes, then multiply one chance per trial.', math: 'P(X=x)=\\binom{n}{x}\\,p^{x}\\,(1-p)^{n-x}' },
          { html: 'Your numbers: ' + tx('n=' + n) + ' trials, success chance ' + tx('p=' + pT) + ', and ' + tx('x=' + x) + ' successes. So the failure chance is ' + tx('1-p=1-' + pT + '=' + qT) + ' and there are ' + tx('n-x=' + n + '-' + x + '=' + k) + ' failures.',
            math: 'P(X=' + x + ')=\\binom{' + n + '}{' + x + '}\\left(' + pT + '\\right)^{' + x + '}\\left(' + qT + '\\right)^{' + k + '}' },
          { html: 'How many sequences of ' + n + ' trials have exactly ' + x + ' successes? Choose their places:', math: chooseChain(n, x), note: 'Cancel the larger factorial from the top and the bottom; what is left is the short product.' },
          { html: 'One such sequence has ' + plural(x, 'success') + ' and ' + plural(k, 'failure') + '. The trials are independent, so multiply:', math: '\\left(' + pT + '\\right)^{' + x + '}\\left(' + qT + '\\right)^{' + k + '}' + prodEq([fp, fq], one, mode) },
          { html: 'All ' + tx(bT(c)) + ' sequences have this same chance. Adding them up is the same as multiplying by ' + tx(bT(c)) + ':', math: 'P(X=' + x + ')' + prodEq([fc, fo], res, mode) },
        ];
      },
      sample() { let x = 0, seq = ''; for (let i = 0; i < n; i++) { const s = Math.random() < this.pn; x += s; if (n <= 20) seq += s ? '1' : '0'; } return { x, seq }; },
    };
  }

  function famHyper(st) {
    const N = st.hN, m = st.hm, n = st.hn, Nm = N - m;
    const lo = Math.max(0, n - Nm), hi = Math.min(n, m), tot = bChoose(N, n);
    const pq = {};
    for (let x = lo; x <= hi; x++) pq[x] = new Q(bChoose(m, x) * bChoose(Nm, n - x), tot);
    return {
      fam: 'hyper', mode: 'frac', exact: true, N, m, n, Nm, lo, hi, K: hi, tot, common: tot,
      pAt: x => pq[x] || Q0,
      lawN: '\\text{Hypergeometric}(N=' + N + ',\\,m=' + m + ',\\,n=' + n + ')',
      what: 'A box has ' + tx('N=' + N) + ' items: ' + tx('m=' + m) + ' of type 1 and ' + tx('N-m=' + Nm) + ' of type 2. You draw ' + tx('n=' + n) + ' without putting any back. ' + tx('X') + ' = number of type-1 items you drew.',
      pmfSym: 'P(X=x)=\\frac{\\binom{m}{x}\\binom{N-m}{n-x}}{\\binom{N}{n}}',
      term: x => '\\frac{\\binom{' + m + '}{' + x + '}\\binom{' + Nm + '}{' + (n - x) + '}}{\\binom{' + N + '}{' + n + '}}',
      E: { sym: 'E(X)=\\frac{nm}{N}', num: 'E(X)=\\frac{nm}{N}=\\frac{' + n + '\\times ' + m + '}{' + N + '}', val: new Q(B(n * m), B(N)) },
      V: { sym: '\\mathrm{Var}(X)=n\\cdot\\frac{m}{N}\\cdot\\frac{N-m}{N}\\cdot\\frac{N-n}{N-1}', num: '\\mathrm{Var}(X)=' + n + '\\cdot\\frac{' + m + '}{' + N + '}\\cdot\\frac{' + Nm + '}{' + N + '}\\cdot\\frac{' + (N - n) + '}{' + (N - 1) + '}', val: new Q(B(n) * B(m) * B(Nm) * B(N - n), B(N) * B(N) * B(N - 1)) },
      one(x) {
        if (!(Number.isInteger(x) && x >= lo && x <= hi)) {
          return [{ html: tx('X') + ' must satisfy ' + tx('x\\le n=' + n) + ', ' + tx('x\\le m=' + m) + ' and ' + tx('n-x\\le N-m=' + Nm) + ' (you cannot draw more type-2 items than there are). So ' + tx('X') + ' runs from ' + tx(String(lo)) + ' to ' + tx(String(hi)) + ', and ' + tx('P(X=' + x + ')=0') + '.' }];
        }
        const a = bChoose(m, x), b = bChoose(Nm, n - x), res = pq[x];
        return [
          { html: 'The hypergeometric PMF (Week 11): every set of ' + tx('n') + ' items is equally likely. Count the sets with exactly ' + tx('x') + ' type-1 items and divide by all sets.', math: 'P(X=x)=\\frac{\\binom{m}{x}\\binom{N-m}{n-x}}{\\binom{N}{n}}' },
          { html: 'Your numbers: ' + tx('N=' + N) + ', ' + tx('m=' + m) + ', so ' + tx('N-m=' + N + '-' + m + '=' + Nm) + ' type-2 items. You draw ' + tx('n=' + n) + ' and ask for ' + tx('x=' + x) + ', so ' + tx('n-x=' + n + '-' + x + '=' + (n - x)) + ' of the drawn items are type 2.',
            math: 'P(X=' + x + ')=\\frac{\\binom{' + m + '}{' + x + '}\\binom{' + Nm + '}{' + (n - x) + '}}{\\binom{' + N + '}{' + n + '}}' },
          { html: 'Ways to pick the ' + x + ' type-1 items from the ' + m + ':', math: chooseChain(m, x) },
          { html: 'Ways to pick the ' + (n - x) + ' type-2 items from the ' + Nm + ':', math: chooseChain(Nm, n - x) },
          { html: 'All ways to pick ' + n + ' items from ' + N + ' (each set equally likely):', math: chooseChain(N, n) },
          { html: 'Favourable sets ÷ all sets:', math: hyperDivide(x, a, b, tot, res) },
        ];
      },
      sample() { let left1 = m, left = N, x = 0, seq = ''; for (let i = 0; i < n; i++) { const s = Math.random() * left < left1; if (s) { x++; left1--; } left--; if (n <= 20) seq += s ? '1' : '0'; } return { x, seq }; },
    };
  }

  function hyperDivide(x, a, b, tot, res) {
    const ok = bDigits(a) <= 15 && bDigits(b) <= 15 && bDigits(tot) <= 15;
    const first = 'P(X=' + x + ')' + (ok ? '=' : '\\approx ') + '\\frac{' + bT(a) + '\\times ' + bT(b) + '}{' + bT(tot) + '}';
    if (!ok) return first + '\\approx ' + qD4(res);
    return first + (bDigits(a * b) <= 15 ? '=\\frac{' + bT(a * b) + '}{' + bT(tot) + '}' : '') + qEq(res, 'frac');
  }

  function famPoisson(st) {
    const lf = K.parseNum(st.lam), lam = Number(lf);
    const lamT = lf && !lf.approx ? qEx(Q.of(lf), modeOf(st.lam)) || d6(lam) : d6(lam);
    let Kauto = Math.max(6, Math.ceil(lam));
    while (poisTail(lam, Kauto) >= 1e-4 && Kauto < 400) Kauto++;
    const Kt = st.K > 0 ? st.K : Kauto;
    const lamQ = lf && !lf.approx ? Q.of(lf) : null;
    const powT = x => {
      if (lamQ) { const pw = lamQ.pow(x); const ex = qEx(pw, modeOf(st.lam)); if (ex != null) return { t: ex, ok: true }; }
      return { t: d6(Math.pow(lam, x)), ok: false };
    };
    const factT = x => { const f = bFact(x); return bDigits(f) <= 15 ? { t: intTexB(f), ok: true } : { t: sci(Number(f), 6), ok: false }; };
    return {
      fam: 'poisson', mode: 'dec', exact: false, lam, lamT, lo: 0, hi: Infinity, K: Kt, Kauto,
      pAt: x => poisPmf(lam, x),
      tail: (k, pw = 0) => poisTail(lam, k, pw),
      lawN: '\\text{Poisson}(' + lamT + ')',
      what: tx('X') + ' = number of events in one interval, when on average ' + tx('\\lambda=' + lamT) + ' events happen per interval.',
      pmfSym: 'P(X=x)=\\frac{e^{-\\lambda}\\lambda^{x}}{x!},\\quad x=0,1,2,\\dots',
      term: x => '\\frac{e^{-' + lamT + '}\\,(' + lamT + ')^{' + x + '}}{' + x + '!}',
      E: { sym: 'E(X)=\\lambda', num: 'E(X)=\\lambda', val: lamQ || lam },
      V: { sym: '\\mathrm{Var}(X)=\\lambda', num: '\\mathrm{Var}(X)=\\lambda', val: lamQ || lam },
      one(x) {
        if (!(Number.isInteger(x) && x >= 0)) return [{ html: 'A Poisson count is ' + tx('0,1,2,\\dots') + ', so ' + tx('P(X=' + x + ')=0') + '.' }];
        const e = Math.exp(-lam), pw = powT(x), ft = factT(x), res = poisPmf(lam, x);
        const fx = x <= 6 ? (x <= 1 ? '' : '=' + range(1, x).reverse().join('\\cdot ')) : '';
        return [
          { html: 'The Poisson PMF (Week 11):', math: 'P(X=x)=\\frac{e^{-\\lambda}\\lambda^{x}}{x!}' },
          { html: 'Your numbers: ' + tx('\\lambda=' + lamT) + ' and ' + tx('x=' + x) + ':', math: 'P(X=' + x + ')=\\frac{e^{-' + lamT + '}\\,(' + lamT + ')^{' + x + '}}{' + x + '!}' },
          { html: 'Each piece. ' + tx('e^{-\\lambda}') + ' is irrational, so it is shown to 6 significant digits:', math: lines('e^{-' + lamT + '}\\approx ' + d6(e), '(' + lamT + ')^{' + x + '}' + (pw.ok ? '=' : '\\approx ') + pw.t, x + '!' + fx + (ft.ok ? '=' : '\\approx ') + ft.t) },
          { html: 'Put them together:', math: 'P(X=' + x + ')\\approx\\frac{' + d6(e) + '\\times ' + pw.t + '}{' + ft.t + '}\\approx ' + d6(res) + (Math.abs(res) >= 0.001 ? '\\approx ' + d4(res) : ''), note: 'The last digits come from the full-precision values, not from the rounded pieces.' },
        ];
      },
      sample() { const u = Math.random(); let x = 0, pr = Math.exp(-lam), c = pr; while (u > c && x < 5000) { x++; pr = (pr * lam) / x; c += pr; if (pr === 0 && x > lam) break; } return { x, seq: '' }; },
    };
  }

  function famGeometric(st) {
    const p = probQ(st.p), mode = modeOf(st.p), q = Q1.sub(p);
    if (p.zero) return { error: 'With ' + tx('p=0') + ' a success never comes, so the geometric distribution needs ' + tx('p>0') + '. Type a bigger ' + tx('p') + '.' };
    const pT = qEx(p, mode), qT = qEx(q, mode);
    let Kauto = 1;
    if (!q.zero) Kauto = Math.min(300, Math.max(6, Math.ceil(Math.log(1e-4) / Math.log(q.num()))));
    const Kt = st.K > 0 ? st.K : Kauto;
    return {
      fam: 'geometric', mode, exact: true, p, q, pT, qT, pn: p.num(), lo: 1, hi: Infinity, K: Kt, Kauto, common: p.d ** B(Kt),
      pAt: x => (Number.isInteger(x) && x >= 1 ? q.pow(x - 1).mul(p) : Q0),
      /** Σ_{x>k} x^pw P(X = x), exact, from the geometric series. */
      tail(k, pw = 0) {
        const qk = q.pow(k), ip = Q1.div(p);
        if (pw === 0) return qk;
        if (pw === 1) return qk.mul(ip.add(k));
        return qk.mul(new Q(B(k * k)).add(ip.mul(2 * k)).add(new Q(2n).sub(p).div(p.mul(p))));
      },
      lawN: '\\text{Geometric}(' + pT + ')',
      what: 'Repeat independent trials, each a success with chance ' + tx('p=' + pT) + '. ' + tx('X') + ' = the number of the trial with the first success (so ' + tx('X=1,2,3,\\dots') + ').',
      pmfSym: 'P(X=x)=(1-p)^{x-1}\\,p,\\quad x=1,2,3,\\dots',
      term: x => '\\left(' + qT + '\\right)^{' + (x - 1) + '}\\cdot ' + pT,
      E: { sym: 'E(X)=\\frac{1}{p}', num: 'E(X)=\\frac{1}{p}=\\frac{1}{' + pT + '}', val: Q1.div(p) },
      V: { sym: '\\mathrm{Var}(X)=\\frac{1-p}{p^{2}}', num: '\\mathrm{Var}(X)=\\frac{1-p}{p^{2}}=\\frac{' + qT + '}{\\left(' + pT + '\\right)^{2}}', val: q.div(p.mul(p)) },
      one(x) {
        if (!(Number.isInteger(x) && x >= 1)) return [{ html: 'The first success comes on trial ' + tx('1,2,3,\\dots') + ', so ' + tx('P(X=' + x + ')=0') + '.' }];
        const f = q.pow(x - 1), res = f.mul(p), ff = qFac(f, mode);
        return [
          { html: 'The geometric PMF: the first ' + tx('x-1') + ' trials fail, then trial ' + tx('x') + ' succeeds. Independent trials, so multiply.', math: 'P(X=x)=(1-p)^{x-1}\\,p' },
          { html: 'Your numbers: ' + tx('p=' + pT) + ', so ' + tx('1-p=1-' + pT + '=' + qT) + '. For ' + tx('x=' + x) + ' there are ' + tx('x-1=' + (x - 1)) + ' failures first:', math: 'P(X=' + x + ')=\\left(' + qT + '\\right)^{' + (x - 1) + '}\\cdot ' + pT },
          { html: 'Work it out:', math: 'P(X=' + x + ')' + (ff.ok ? '=' : '\\approx ') + ff.t + '\\times ' + pT + qEq(res, mode) },
        ];
      },
      sample() { let x = 1; while (Math.random() >= this.pn && x < 1e6) x++; return { x, seq: x <= 20 ? '0'.repeat(x - 1) + '1' : '' }; },
    };
  }
  const BUILD = { bernoulli: famBernoulli, binomial: famBinomial, hyper: famHyper, poisson: famPoisson, geometric: famGeometric };

  /* ============================================================ events */
  const EVENTS = [
    { value: 'eq', label: 'X = a' },
    { value: 'le', label: 'X ≤ a  (at most a)' },
    { value: 'lt', label: 'X < a  (less than a)' },
    { value: 'ge', label: 'X ≥ a  (at least a)' },
    { value: 'gt', label: 'X > a  (more than a)' },
    { value: 'between', label: 'a ≤ X ≤ b' },
  ];
  function evTex(st) {
    const a = st.a, lo = Math.min(st.a, st.b), hi = Math.max(st.a, st.b);
    return { eq: 'X=' + a, le: 'X\\le ' + a, lt: 'X<' + a, ge: 'X\\ge ' + a, gt: 'X>' + a, between: lo + '\\le X\\le ' + hi }[st.ev];
  }
  function evTest(st) {
    const a = st.a, lo = Math.min(st.a, st.b), hi = Math.max(st.a, st.b);
    return { eq: x => x === a, le: x => x <= a, lt: x => x < a, ge: x => x >= a, gt: x => x > a, between: x => x >= lo && x <= hi }[st.ev];
  }
  /** Values in the event (list) and outside it (comp); for an infinite support one of them is null. */
  function eventInfo(M, st) {
    const test = evTest(st);
    const inf = M.hi === Infinity;
    const lo = Math.min(st.a, st.b), hi = Math.max(st.a, st.b);
    let list = null, comp = null;
    if (!inf) { list = range(M.lo, M.hi).filter(test); comp = range(M.lo, M.hi).filter(x => !test(x)); }
    else if (st.ev === 'ge' || st.ev === 'gt') comp = range(M.lo, st.ev === 'ge' ? st.a - 1 : st.a);
    else list = range(M.lo, { eq: st.a, le: st.a, lt: st.a - 1, between: hi }[st.ev]).filter(test);
    // P(X ≥ a) = P(X > a − 1): the tail is exact for the geometric and added term by term for the Poisson.
    const P = list ? vSum(list.map(M.pAt)) : M.tail(st.ev === 'ge' ? st.a - 1 : st.a);
    return { tex: evTex(st), test, list, comp, P, lo, hi };
  }

  /* ============================================================ the lab */
  function render(host) {
    const saved = Lab.store.get(KEY, {});
    const st = Object.assign({}, DEF, saved && typeof saved === 'object' ? saved : {});
    if (!BUILD[st.fam]) st.fam = DEF.fam;
    if (!K.parseProb(st.p)) st.p = DEF.p;
    if (!(Number(K.parseNum(st.lam)) > 0 && Number(K.parseNum(st.lam)) <= 50)) st.lam = DEF.lam;
    const clampInt = (v, lo, hi, d) => (Number.isInteger(v) ? Math.max(lo, Math.min(hi, v)) : d);
    st.n = clampInt(st.n, 1, 500, DEF.n);
    st.hN = clampInt(st.hN, 2, 500, DEF.hN);
    st.hm = clampInt(st.hm, 0, st.hN, Math.min(DEF.hm, st.hN));
    st.hn = clampInt(st.hn, 1, Math.min(st.hN, 100), Math.min(DEF.hn, st.hN));
    st.K = clampInt(st.K, 0, 400, 0);
    st.cmpN = clampInt(st.cmpN, 1, 2000, DEF.cmpN);
    ['x', 'a', 'b'].forEach(k => { st[k] = clampInt(st[k], 0, 1000, DEF[k]); });
    if (!EVENTS.some(e => e.value === st.ev)) st.ev = DEF.ev;
    const save = () => Lab.store.set(KEY, st);
    const ctl = {}, P = {};
    let M = null, mKey = '', sim = null, preset = null;

    function model() {
      const key = [st.fam, st.p, st.n, st.hN, st.hm, st.hn, st.lam, st.K].join('|');
      if (key === mKey && M) return M;
      const m = BUILD[st.fam](st);
      if (!m.error) { M = m; mKey = key; sim = null; }
      return m;
    }

    const { side, main } = K.layout(host, 's7-lab');
    /* ---------------- controls */
    function buildControls() {
      Lab.clear(side);
      side.appendChild(K.group('1 · Your distribution'));
      ctl.fam = K.selectField({ label: 'Family', options: Object.keys(FAMS).map(k => ({ value: k, label: FAMS[k].label })), value: st.fam, onChange: v => { st.fam = v; st.K = 0; buildParams(); afterParams(); } });
      ctl.params = h('div', { class: 'dp-params' });
      ctl.fam.dataset.k = 'fam';
      side.append(ctl.fam, ctl.params);
      ctl.presets = K.presets({ label: 'Lecture examples', items: PRESETS, onPick: it => { Object.assign(st, DEF, it.st); preset = { idx: PRESETS.indexOf(it), key: null }; buildControls(); afterParams(); } });
      ctl.presets.dataset.k = 'presets';
      side.appendChild(ctl.presets);
      showPreset();
      side.appendChild(K.group('2 · One value x'));
      ctl.x = K.numField({ label: 'Value ' + tx('x') + ' for ' + tx('P(X=x)'), min: 0, max: 10, value: st.x, onChange: v => { st.x = v; draw(); }, hint: 'Or click a bar in the PMF.' });
      ctl.x.dataset.k = 'x';
      side.appendChild(ctl.x);
      side.appendChild(K.group('3 · Your event'));
      ctl.ev = K.selectField({ label: 'Event', options: EVENTS, value: st.ev, onChange: v => { st.ev = v; ctl.b.hidden = v !== 'between'; draw(); } });
      ctl.a = K.numField({ label: tx('a'), min: 0, max: 10, value: st.a, onChange: v => { st.a = v; draw(); } });
      ctl.b = K.numField({ label: tx('b'), min: 0, max: 10, value: st.b, onChange: v => { st.b = v; draw(); } });
      ctl.b.hidden = st.ev !== 'between';
      ctl.ev.dataset.k = 'ev'; ctl.a.dataset.k = 'a'; ctl.b.dataset.k = 'b';
      side.append(ctl.ev, ctl.a, ctl.b);
      ctl.kTitle = K.group('4 · Where the table stops');
      ctl.k = K.numField({ label: 'Last value in the table ' + tx('K'), min: 1, max: 400, value: 10, onChange: v => { st.K = v; afterParams(); } });
      ctl.k.dataset.k = 'K';
      ctl.kAuto = Lab.button('Auto (less than 0.0001 left)', () => { st.K = 0; afterParams(); }, 'btn xs');
      ctl.kBox = h('div', { class: 's7-kbox' }, ctl.k, h('div', { class: 'pl-chips' }, ctl.kAuto));
      side.append(ctl.kTitle, ctl.kBox);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, {}); Object.keys(st).forEach(k => delete st[k]); Object.assign(st, DEF); buildControls(); afterParams(); }, 'btn ghost sm')));
      buildParams();
    }
    function pField() {
      // the kit's hint says "Tails" (it was made for coins); here a trial is a success or a failure
      const hint = () => { const pq = probQ(st.p); if (!pq) return; const m = modeOf(st.p); Lab.setHTML(f.querySelector('.pl-hint'), (qEx(pq, m) !== qD4(pq) ? '= ' + d4Text(pq.num()) + '. ' : '') + 'Failure: ' + tx('1-p' + qEq(Q1.sub(pq), m))); };
      const f = K.probField({ label: 'Chance of success on one trial ' + tx('p'), value: st.p, onChange: () => { st.p = f.querySelector('input').value.trim(); hint(); afterParams(); } });
      f.dataset.k = 'p';
      const chips = h('div', { class: 'pl-chips' });
      ['1/2', '1/3', '1/6', '0.1', '0.25', '0.05'].forEach(v => chips.appendChild(Lab.button(v, () => { f.set(v); st.p = v; hint(); afterParams(); }, 'btn xs')));
      hint();
      return [f, chips];
    }
    function buildParams() {
      Lab.clear(ctl.params);
      const f = st.fam;
      if (f === 'binomial') { const fn = K.numField({ label: 'Number of trials ' + tx('n'), min: 1, max: 500, value: st.n, onChange: v => { st.n = v; afterParams(); } }); fn.dataset.k = 'n'; ctl.params.appendChild(fn); }
      if (f === 'bernoulli' || f === 'binomial' || f === 'geometric') ctl.params.append(...pField());
      if (f === 'hyper') {
        ctl.hN = K.numField({ label: 'Items in the box ' + tx('N'), min: 2, max: 500, value: st.hN, onChange: v => { st.hN = v; syncHyper(); afterParams(); } });
        ctl.hm = K.numField({ label: 'Type-1 items ' + tx('m'), min: 0, max: st.hN, value: st.hm, onChange: v => { st.hm = v; afterParams(); } });
        ctl.hn = K.numField({ label: 'Items drawn ' + tx('n') + ' (no replacement)', min: 1, max: Math.min(st.hN, 100), value: st.hn, onChange: v => { st.hn = v; afterParams(); } });
        ctl.hN.dataset.k = 'hN'; ctl.hm.dataset.k = 'hm'; ctl.hn.dataset.k = 'hn';
        ctl.params.append(ctl.hN, ctl.hm, ctl.hn);
        syncHyper();
      }
      if (f === 'poisson') {
        const lf = valField({ label: 'Average number of events per interval ' + tx('\\lambda'), value: st.lam, min: 0.1, max: 30, step: 0.1,
          check: v => (v > 0 && v <= 50 ? null : 'Use ' + tx('0<\\lambda\\le 50') + '.'),
          hint: (v, s) => (/\//.test(s) ? '= ' + d4Text(v) + '. ' : '') + 'Type any value, e.g. 2.5 or 5/2.',
          onChange: (v, s) => { st.lam = s; afterParams(); } });
        lf.dataset.k = 'lam';
        ctl.params.appendChild(lf);
      }
      const inf = f === 'poisson' || f === 'geometric';
      ctl.kTitle.hidden = !inf; ctl.kBox.hidden = !inf;
    }
    /** Keep the lecture source visible after a pick; clear it once the learner changes the numbers. */
    function showPreset() {
      if (!ctl.presets) return;
      const src = ctl.presets.querySelector('.pl-hint');
      ctl.presets.select.value = preset ? String(preset.idx) : '';
      Lab.setHTML(src, preset ? '<b>Lecture example.</b> From: ' + PRESETS[preset.idx].source : '');
    }
    function syncHyper() {
      st.hm = ctl.hm.setRange(0, st.hN);
      st.hn = ctl.hn.setRange(1, Math.min(st.hN, 100));
    }
    function afterParams() {
      const m = model();
      if (m.error) { K.setAnswer(P.answer, { ev: '<span class="cbad">' + m.error + '</span>', big: '', sub: 'The panels below still show your last valid choice.' }); return; }
      if (preset) { if (preset.key == null) preset.key = mKey; else if (preset.key !== mKey) { preset = null; showPreset(); } }
      const xmax = M.hi === Infinity ? Math.max(M.K, M.lo + 15) : M.hi;
      st.x = ctl.x.setRange(M.lo, xmax);
      st.a = ctl.a.setRange(M.lo, xmax);
      st.b = ctl.b.setRange(M.lo, xmax);
      if (M.hi === Infinity) { ctl.k.setRange(1, 400); ctl.k.set(M.K); ctl.k.hint(st.K > 0 ? 'You chose ' + tx('K=' + M.K) + '.' : 'Auto: ' + tx('K=' + M.K) + ' is the first value with less than 0.0001 of the probability left after it.'); }
      draw();
    }

    /* ---------------- panels */
    P.answer = K.answer();
    P.model = K.panel('The model: what ' + tx('X') + ' counts, and when it fits');
    P.pmf = K.panel('PMF: ' + tx('P(X=x)') + ' for every value');
    P.cdf = K.panel('CDF: ' + tx('F(t)=P(X\\le t)'), 'A staircase: at each value ' + tx('x') + ' it jumps up by ' + tx('P(X=x)') + '. Move ' + tx('t') + ' and read the sum.');
    P.one = K.panel('One value: ' + tx('P(X=x)') + ' with your numbers');
    P.range = K.panel('Your event: every term, added up');
    P.mom = K.panel('Mean and variance: by formula and from the table');
    P.x1 = K.panel('');
    P.x2 = K.panel('');
    P.sim = K.panel('Run it for real', 'Draw values of ' + tx('X') + ' at random, many times. The fraction of draws at each value settles on ' + tx('P(X=x)') + '.');
    main.append(P.answer, P.model, P.pmf, P.cdf, P.one, P.range, P.mom, P.x1, P.x2, P.sim);
    buildSim();

    let queued = false;
    function draw() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; drawNow(); }); }
    function drawNow() {
      if (!M) return;
      save();
      const vals = range(M.lo, M.K);
      const pv = vals.map(M.pAt), pf = pv.map(vNum);
      const miss = M.hi === Infinity ? M.tail(M.K) : Q0;
      const Ev = eventInfo(M, st);
      const D = { vals, pv, pf, miss, Ev };
      windowOf(D);
      drawAnswer(D); drawModel(D); drawPmf(D); drawCdf(D); drawOne(); drawRange(D); drawMoments(D); drawExtras(D); paintSim();
    }
    function windowOf(D) {
      const pf = D.pf;
      let i0 = 0, i1 = pf.length - 1;
      if (pf.length > 61) {
        while (i0 < i1 && pf[i0] < 1e-6) i0++;
        while (i1 > i0 && pf[i1] < 1e-6) i1--;
        if (i1 - i0 + 1 > 61) { let md = i0; for (let i = i0; i <= i1; i++) if (pf[i] > pf[md]) md = i; i0 = Math.max(i0, md - 30); i1 = Math.min(i1, i0 + 60); i0 = Math.max(0, i1 - 60); }
      }
      D.i0 = i0; D.i1 = i1;
      D.hidL = vSum(D.pv.slice(0, i0));
      D.hidR = vAdd(vSum(D.pv.slice(i1 + 1)), D.miss);
    }
    /** A value can be shown exactly and briefly (short fraction or short decimal). */
    const shortOK = v => isQ(v) && qEx(v, M.mode) != null && (v.d <= 9999n || qD4exact(v));
    /** One format for a whole column: exact when every entry is short, else decimals for all. */
    const colFmt = vals => { const ex = vals.length > 0 && vals.every(shortOK); return vals.map(v => (ex ? qEx(v, M.mode) : isQ(v) ? qD4(v) : d4(v))); };
    /** Bar labels: exact when all are short, else 4 places for all (tiny values as <0.0001). */
    const barFmt = vals => { const ex = vals.every(shortOK); return vals.map(v => { if (ex) return qEx(v, M.mode); const x = vNum(v); if (x === 0) return '0'; if (x < 0.00005) return '<0.0001'; return isQ(v) ? (qD4exact(v) ? qD4(v) : qRound(v, 4, false)) : x.toFixed(4); }); };
    const supTex = () => (M.hi === Infinity ? M.lo + ',' + (M.lo + 1) + ',' + (M.lo + 2) + ',\\dots' : M.hi - M.lo <= 4 ? range(M.lo, M.hi).join(',') : M.lo + ',' + (M.lo + 1) + ',\\dots,' + M.hi);

    function drawAnswer(D) {
      const Ev = D.Ev, mode = M.mode;
      const nTerms = Ev.list ? Ev.list.length : null;
      K.setAnswer(P.answer, {
        ev: 'Your model: ' + tx('X\\sim ' + M.lawN) + '. ' + M.what + ' Your event: ' + tx(Ev.tex) + '.',
        big: 'P(' + Ev.tex + ')' + vEq(Ev.P, mode),
        sub: (nTerms != null ? (nTerms ? 'This is the sum of ' + plural(nTerms, 'term') + ' ' + tx('P(X=x)') + ', one for each value of ' + tx('x') + ' in your event — all listed below.' : 'No possible value of ' + tx('X') + ' is in your event.') : 'Your event has infinitely many values, so it is computed as ' + tx('1-P(\\text{not }E)') + ' (below).') +
          '<br>Mean ' + tx(M.E.num + vEq(M.E.val, mode)) + ', variance ' + tx(M.V.num + vEq(M.V.val, mode)) + '.' +
          '<div class="s7-fine">Exact fractions when they are short; otherwise decimals rounded to 4 places (≈). Very small values are written like ' + tx('1.234\\times 10^{-5}') + '.</div>',
      });
    }

    /* ---- model checklist */
    const CHECK = [
      { q: 'A fixed number of trials ' + tx('n'), v: { bernoulli: ['y', tx('n=1')], binomial: ['y', ''], hyper: ['y', tx('n') + ' draws'], poisson: ['na', 'no trials; it counts events'], geometric: ['n', 'it goes on until the first success'] } },
      { q: 'Each trial: success or failure', v: { bernoulli: ['y', ''], binomial: ['y', ''], hyper: ['y', 'type 1 or type 2'], poisson: ['na', ''], geometric: ['y', ''] } },
      { q: 'The same chance ' + tx('p') + ' every trial', v: { bernoulli: ['y', ''], binomial: ['y', ''], hyper: ['n', 'it changes after each draw'], poisson: ['na', 'a constant rate ' + tx('\\lambda') + ' instead'], geometric: ['y', ''] } },
      { q: 'Trials are independent', v: { bernoulli: ['y', 'one trial'], binomial: ['y', ''], hyper: ['n', 'each draw changes what is left'], poisson: ['na', 'non-overlapping intervals are independent'], geometric: ['y', ''] } },
    ];
    const COUNTS = { bernoulli: '1 for a success, 0 for a failure', binomial: 'successes in ' + tx('n') + ' trials', hyper: 'type-1 items among the ' + tx('n') + ' drawn', poisson: 'events in one interval', geometric: 'trials up to the first success' };
    const SHORT = { bernoulli: 'Bernoulli', binomial: 'Binomial', hyper: 'Hypergeo&shy;metric', poisson: 'Poisson', geometric: 'Geometric' };
    function drawModel(D) {
      const body = P.model.body;
      Lab.clear(body);
      body.appendChild(K.note(M.what, 's7-lead'));
      body.appendChild(modelPicture());
      const fams = Object.keys(FAMS);
      const mark = ([k, why]) => '<span class="s7-mk ' + k + '">' + (k === 'y' ? '✓' : k === 'n' ? '✗' : '—') + '</span>' + (why ? '<span class="s7-why">' + why + '</span>' : '');
      const rows = CHECK.map(c => [c.q].concat(fams.map(f => mark(c.v[f]))));
      rows.push(['What ' + tx('X') + ' counts'].concat(fams.map(f => '<span class="s7-why">' + COUNTS[f] + '</span>')));
      const t = table(['The checklist (Week 11)'].concat(fams.map(f => SHORT[f])), rows);
      const ci = fams.indexOf(M.fam) + 2;
      Lab.$$('tr > :nth-child(' + ci + ')', t).forEach(c => c.classList.add('s7-col'));
      Lab.$$('td:first-child, th:first-child', t).forEach(c => c.classList.add('l'));
      body.appendChild(t);
      const verdict = {
        bernoulli: () => 'One trial with two outcomes: Bernoulli. Repeat it ' + tx('n') + ' times independently with the same ' + tx('p') + ' (IID Bernoulli trials) and the number of successes is binomial.',
        binomial: () => 'Your ' + tx('X\\sim ' + M.lawN) + ' passes all four checks. That is exactly when the binomial model is right.',
        hyper: () => 'Drawing without replacement fails checks 3 and 4, so ' + tx('X') + ' is <b>not</b> binomial. ' + hyperDraws() + ' When ' + tx('N') + ' is much bigger than ' + tx('n') + ', the chance hardly changes and ' + tx('\\text{Bin}(n,\\tfrac{m}{N})') + ' is close (compare below).',
        poisson: () => 'Poisson (Week 11 notes): ' + tx('X') + ' counts events in an interval at rate ' + tx('\\lambda') + '; counts in non-overlapping intervals are independent; at most one event happens in a tiny interval.',
        geometric: () => 'Checks 2–4 hold, but there is no fixed ' + tx('n') + ': you stop at the first success. So ' + tx('X') + ' is geometric, not binomial.',
      }[M.fam]();
      body.appendChild(K.note(verdict, 's7-verdict'));
    }
    function hyperDraws() {
      const { N, m } = M;
      if (m < 1 || m >= N) return '';
      const f1 = new Q(B(m), B(N)), s1 = new Q(B(m - 1), B(N - 1)), s0 = new Q(B(m), B(N - 1));
      return 'For example: first draw ' + tx('P(\\text{type 1})=\\frac{m}{N}=' + qEx(f1, 'frac')) + '. If it was type 1, the second draw has ' + tx('\\frac{m-1}{N-1}=\\frac{' + (m - 1) + '}{' + (N - 1) + '}' + (s1.d !== B(N - 1) || s1.n !== B(m - 1) ? '=' + qEx(s1, 'frac') : '')) + '; if not, ' + tx('\\frac{m}{N-1}=\\frac{' + m + '}{' + (N - 1) + '}' + (s0.d !== B(N - 1) || s0.n !== B(m) ? '=' + qEx(s0, 'frac') : '')) + '.';
    }
    function modelPicture() {
      const wrap = h('div', { class: 's7-pic' });
      if (M.fam === 'binomial' || M.fam === 'bernoulli') {
        const n = M.fam === 'bernoulli' ? 1 : M.n, show = Math.min(n, 12);
        const row = h('div', { class: 's7-trials' });
        for (let i = 1; i <= show; i++) row.appendChild(h('div', { class: 's7-trial' }, h('b', { text: 'trial ' + i }), h('span', { html: tx('S:\\ ' + M.pT) }), h('span', { html: tx('F:\\ ' + M.qT) })));
        if (n > show) row.appendChild(h('div', { class: 's7-more', text: '… ' + (n - show) + ' more (n = ' + n + ')' }));
        wrap.appendChild(row);
        wrap.appendChild(K.note('Each box is one trial: success S with chance ' + tx('p=' + M.pT) + ', failure F with chance ' + tx('1-p=' + M.qT) + '. ' + (M.fam === 'binomial' ? tx('X') + ' counts the S results.' : ''), 'small muted'));
      } else if (M.fam === 'hyper') {
        const { N, m } = M;
        if (N <= 200) {
          const urn = h('div', { class: 's7-urn' });
          for (let i = 0; i < N; i++) urn.appendChild(h('i', { class: i < m ? 'one' : '' }));
          wrap.appendChild(urn);
        }
        wrap.appendChild(K.note('<span class="s7-dot one"></span> type 1: ' + tx('m=' + m) + ' &nbsp; <span class="s7-dot"></span> type 2: ' + tx('N-m=' + N + '-' + m + '=' + (N - m)) + (N > 200 ? ' (too many dots to draw for ' + tx('N=' + N) + ')' : '') + '. You take ' + tx('n=' + M.n) + ' of the ' + N + ' without putting any back.', 'small muted'));
      } else if (M.fam === 'geometric') {
        const x = Math.max(1, Math.min(st.x, 12));
        const row = h('div', { class: 's7-trials' });
        for (let i = 1; i <= x; i++) row.appendChild(h('div', { class: 's7-trial ' + (i === x ? 's' : 'f') }, h('b', { text: 'trial ' + i }), h('span', { text: i === x ? 'S' : 'F' }), h('span', { html: tx(i === x ? M.pT : M.qT) })));
        wrap.appendChild(row);
        wrap.appendChild(K.note('For ' + tx('X=' + x) + ': ' + (x - 1) + ' failure' + (x - 1 === 1 ? '' : 's') + ' then a success. (Change ' + tx('x') + ' in step 2 to redraw.)', 'small muted'));
      } else {
        const line = h('div', { class: 's7-interval' }, h('span', { text: 'start of the interval' }), h('i'), h('span', { text: 'end' }));
        wrap.appendChild(line);
        wrap.appendChild(K.note('On average ' + tx('\\lambda=' + M.lamT) + ' events fall in one interval. The count can be ' + tx('0,1,2,\\dots') + ' with no upper limit.', 'small muted'));
      }
      return wrap;
    }

    /* ---- PMF and CDF */
    function drawPmf(D) {
      const body = P.pmf.body;
      Lab.clear(body);
      const rows = [];
      const labels = barFmt(D.pv.slice(D.i0, D.i1 + 1));
      for (let i = D.i0; i <= D.i1; i++) { const x = D.vals[i]; rows.push({ x, p: D.pf[i], label: labels[i - D.i0], part: D.Ev.test(x) ? D.pf[i] : null, hot: x === st.x }); }
      const many = rows.length > 16;
      const chart = K.pmfChart(rows, { xName: 'X', xPlain: 'X', showValues: !many, onPick: x => { st.x = x; ctl.x.set(x); draw(); } });
      chart.classList.add('s7-pmf');
      // the kit's tooltip rounds tiny values to "0"; say the real size instead
      Lab.$$('.pd-col', chart).forEach((col, k) => { col.title = 'P(X = ' + rows[k].x + ') ' + (isQ(D.pv[D.i0 + k]) && qD4exact(D.pv[D.i0 + k]) ? '= ' : '≈ ') + d4Text(rows[k].p) + ' — click to use x = ' + rows[k].x; });
      if (many) {
        chart.classList.add('many');
        const stp = rows.length > 40 ? 10 : 5;
        Lab.$$('.pd-x', chart).forEach((el, k) => { if (rows[k].x % stp !== 0) el.innerHTML = ''; });
      }
      body.appendChild(chart);
      P.pmf.sub('Bar height = ' + tx('P(X=x)') + (many ? ' (point at a bar for its value; every value is in the mean-and-variance table below)' : '') + '. <span class="cpick">Violet</span> = the values in your event ' + tx(D.Ev.tex) + '. <span class="s7-hotkey">Outlined</span> = your ' + tx('x=' + st.x) + ' — click any bar to choose it.');
      const notes = [];
      if (D.i0 > 0 || D.i1 < D.vals.length - 1) notes.push('Bars are drawn for ' + tx('x=' + D.vals[D.i0] + ',\\dots,' + D.vals[D.i1]) + ' only. The values left of them hold ' + tx('P' + vEq(D.hidL, M.mode)) + ' in total and the values right of them ' + tx('P' + vEq(D.hidR, M.mode)) + '.');
      if (M.hi === Infinity) notes.push(truncNote(D));
      const tot = vSum(D.pv);
      notes.push('The bars from ' + tx('x=' + M.lo) + ' to ' + tx('x=' + M.K) + ' add up to ' + tx(vShortEq(tot)) + (M.hi === Infinity ? '; with the missing part, the total is exactly 1.' : ' — every outcome gives exactly one value of ' + tx('X') + '.'));
      notes.forEach(t => body.appendChild(K.note(t, 'small muted')));
    }
    const vShortEq = v => (isQ(v) ? (qEx(v, M.mode) != null ? qEx(v, M.mode) + (qD4exact(v) || qEx(v, M.mode) === qD4(v) ? '' : '\\approx ' + qD4(v)) : '\\approx ' + qD4(v)) : '\\approx ' + d4(v));
    function truncNote(D) {
      const mm = M.fam === 'poisson'
        ? 'Missing mass: ' + tx('P(X>' + M.K + ')=1-\\sum_{x=0}^{' + M.K + '}P(X=x)\\approx ' + d4(D.miss)) + ' (added up term by term after ' + tx('x=' + M.K) + '). The full sum is 1 because ' + tx('\\sum_{x\\ge 0}\\frac{\\lambda^{x}}{x!}=e^{\\lambda}') + '.'
        : 'Missing mass: ' + tx('P(X>' + M.K + ')=(1-p)^{' + M.K + '}=\\left(' + M.qT + '\\right)^{' + M.K + '}' + qEq(D.miss, M.mode)) + ' — all of the first ' + M.K + ' trials fail. The full sum is 1 by the geometric series ' + tx('\\sum_{x\\ge 1}(1-p)^{x-1}p=\\frac{p}{1-(1-p)}=1') + '.';
      return '<b>The table stops at ' + tx('K=' + M.K) + '</b> (step 4 in the controls). ' + tx('X') + ' can be larger. ' + mm;
    }
    function drawCdf(D) {
      const body = P.cdf.body;
      Lab.clear(body);
      const kitExact = M.exact && M.common != null && M.common <= 10000000n;
      const dist = kitExact ? { vals: D.vals, p: D.pv.map(q => Lab.F(Number(q.n), Number(q.d))) } : { vals: D.vals, p: D.pf, float: true };
      const lo = D.vals[0], hi = D.vals[D.vals.length - 1];
      const t = st.t != null && st.t >= lo - 1 && st.t <= hi + 1 ? st.t : undefined;
      body.appendChild(K.cdfChart(dist, { xName: 'X', t, onT: v => { st.t = v; save(); }, truncated: M.hi === Infinity }));
      if (!kitExact) body.appendChild(K.note('Here the readout uses decimals (the exact fractions are too long to read).', 'small muted'));
      if (M.hi === Infinity) body.appendChild(K.note('The staircase is drawn up to ' + tx('x=' + M.K) + '; there it has reached ' + tx('F(' + M.K + ')=1-P(X>' + M.K + ')' + (isQ(D.miss) ? vEq(Q1.sub(D.miss), M.mode) : '\\approx ' + d4(1 - D.miss))) + ', not 1.', 'small muted'));
    }

    /* ---- one value */
    function drawOne() {
      const body = P.one.body;
      Lab.clear(body);
      P.one.sub('Your ' + tx('x=' + st.x) + ' (step 2 in the controls, or click a bar). Symbols first, then your numbers.');
      body.appendChild(K.steps(M.one(st.x)));
    }

    /* ---- the event */
    function termsTable(list) {
      const showF = list.length <= 12;
      const ps = colFmt(list.map(M.pAt));
      const rows = list.map((x, i) => [cell(String(x))].concat(showF ? [tx(M.term(x))] : []).concat([cell(ps[i])]));
      return table([tx('x')].concat(showF ? ['the formula with your numbers'] : []).concat([tx('P(X=x)')]), rows, { tall: list.length > 12 });
    }
    function sumLine(list, total, lead) {
      const pv = list.map(M.pAt);
      const allEx = pv.every(shortOK);
      const syms = list.map(x => 'P(X=' + x + ')'), nums = colFmt(pv);
      const cut = arr => (arr.length > 6 ? arr.slice(0, 3).concat(['\\dots'], arr.slice(-2)) : arr);
      if (list.length === 1) return lead === syms[0] ? lead + vEq(total, M.mode) : lines(lead + '=' + syms[0], vEq(total, M.mode));
      return lines(lead + '=' + cut(syms).join('+'), (allEx ? '=' : '\\approx ') + cut(nums).join('+'), vEq(total, M.mode));
    }
    function drawRange(D) {
      const body = P.range.body;
      Lab.clear(body);
      const Ev = D.Ev, steps = [], strict = st.ev === 'lt' || st.ev === 'gt';
      P.range.sub('Your event ' + tx(Ev.tex) + ' (step 3 in the controls). ' + tx('P') + '(event) = the sum of ' + tx('P(X=x)') + ' over the values ' + tx('x') + ' in the event.');
      const intro = 'Your event is ' + tx(Ev.tex) + '. ' + tx('X') + ' can be ' + tx(supTex()) + '. ';
      if (Ev.list) {
        steps.push({ html: intro + (Ev.list.length ? 'The values in your event: ' + listTxt(Ev.list) + ' (' + plural(Ev.list.length, 'value') + ').' : 'No possible value is in your event, so ' + tx('P(' + Ev.tex + ')=0') + '.'),
          note: strict ? 'For a discrete ' + tx('X') + ', ' + tx('<') + ' and ' + tx('\\le') + ' are different: ' + (st.ev === 'lt' ? tx('X<' + st.a) + ' is ' + tx('X\\le ' + (st.a - 1)) : tx('X>' + st.a) + ' is ' + tx('X\\ge ' + (st.a + 1))) + '.' : '' });
        if (Ev.list.length) {
          steps.push({ html: 'One term for each value (step 5 works one out in full):', block: termsTable(Ev.list) });
          steps.push({ html: 'Add the terms' + (Ev.list.length > 1 && !Ev.list.map(M.pAt).every(shortOK) ? ' (the terms are shown rounded to 4 places; the total is added from the exact terms)' : '') + ':', math: sumLine(Ev.list, Ev.P, 'P(' + Ev.tex + ')') });
        }
        if (Ev.comp && Ev.comp.length && Ev.list.length && Ev.comp.length < Ev.list.length) {
          const pc = vSum(Ev.comp.map(M.pAt));
          steps.push({ html: 'Shorter: the opposite event has only ' + plural(Ev.comp.length, 'value') + ' (' + listTxt(Ev.comp) + '). Use ' + tx('P(E)=1-P(\\text{not }E)') + ':',
            math: 'P(' + Ev.tex + ')=1-' + (Ev.comp.length > 1 ? '[' : '') + Ev.comp.slice(0, 4).map(x => 'P(X=' + x + ')').join('+') + (Ev.comp.length > 4 ? '+\\dots' : '') + (Ev.comp.length > 1 ? ']' : '') + '=1-' + vShort(pc, M.mode) + vEq(vSub(isQ(pc) ? Q1 : 1, pc), M.mode) });
        }
      } else {
        const top = st.ev === 'ge' ? st.a - 1 : st.a;
        steps.push({ html: intro + 'Your event holds for every ' + tx('x\\ge ' + (st.ev === 'ge' ? st.a : st.a + 1)) + ' — infinitely many values, so the terms cannot all be listed. Use the opposite event: ' + (Ev.comp.length ? tx('X\\le ' + top) + ', which has ' + plural(Ev.comp.length, 'value') + '.' : 'it has no possible values, so ' + tx('P(' + Ev.tex + ')=1') + '.') });
        if (Ev.comp.length) {
          const pc = vSum(Ev.comp.map(M.pAt));
          steps.push({ html: 'The terms of the opposite event:', block: termsTable(Ev.comp) });
          steps.push({ html: 'Then ' + tx('P(E)=1-P(\\text{not }E)') + ':', math: sumLine(Ev.comp, pc, 'P(X\\le ' + top + ')') });
          steps.push({ html: 'Subtract from 1:', math: 'P(' + Ev.tex + ')=1-P(X\\le ' + top + ')' + (isQ(pc) ? '=1-' + vShort(pc, M.mode) : '\\approx 1-' + d4(pc)) + vEq(Ev.P, M.mode),
            note: M.fam === 'poisson' ? 'The answer above uses the tail added term by term (no rounding loss); ' + tx('1-P(X\\le ' + top + ')') + ' gives the same 4 decimals.' : '' });
        }
        if (M.fam === 'geometric') steps.push({ html: 'Check with a shortcut: ' + tx('X>' + top) + ' means the first ' + top + ' trials all fail, so', math: 'P(X>' + top + ')=(1-p)^{' + top + '}=\\left(' + M.qT + '\\right)^{' + top + '}' + qEq(Ev.P, M.mode) });
      }
      body.appendChild(K.steps(steps));
    }

    /* ---- mean and variance */
    function drawMoments(D) {
      const body = P.mom.body;
      Lab.clear(body);
      const mode = M.mode, inf = M.hi === Infinity;
      const rows = D.vals.map((x, i) => ({ x, p: D.pv[i], xp: vMul(D.pv[i], x), x2p: vMul(D.pv[i], x * x) }));
      const S0 = vSum(rows.map(r => r.p)), S1 = vSum(rows.map(r => r.xp)), S2 = vSum(rows.map(r => r.x2p));
      const T0 = inf ? D.miss : Q0, T1 = inf ? M.tail(M.K, 1) : Q0, T2 = inf ? M.tail(M.K, 2) : Q0;
      const E1 = vAdd(S1, T1), E2 = vAdd(S2, T2), Var = vSub(E2, isQ(E1) ? E1.mul(E1) : vNum(E1) * vNum(E1));
      const sd = Math.sqrt(vNum(M.V.val));
      const steps = [];
      steps.push({ html: 'By formula (Week 11 notes), symbols then your numbers:', math: lines(M.E.num + vEq(M.E.val, mode), M.V.num + vEq(M.V.val, mode)),
        note: 'Standard deviation ' + tx('\\mathrm{SD}(X)=\\sqrt{\\mathrm{Var}(X)}\\approx ' + d4(sd)) + '.' });
      const c0 = colFmt(rows.map(r => r.p).concat(inf ? [T0] : [], [vAdd(S0, T0)]));
      const c1 = colFmt(rows.map(r => r.xp).concat(inf ? [T1] : [], [E1]));
      const c2 = colFmt(rows.map(r => r.x2p).concat(inf ? [T2] : [], [E2]));
      const tRows = rows.map((r, i) => [cell(String(r.x)), cell(c0[i]), cell(c1[i]), cell(c2[i])]);
      const nR = rows.length;
      if (inf) tRows.push([tx('x>' + M.K), cell(c0[nR]), cell(c1[nR]), cell(c2[nR])]);
      const sR = inf ? nR + 1 : nR;
      tRows.push(['<b>sum</b>', cell(c0[sR]), cell(c1[sR]), cell(c2[sR])]);
      steps.push({ html: 'From the table: multiply each value by its probability and add. ' + tx('E(X)=\\sum x\\,P(X=x)') + ' and ' + tx('E(X^2)=\\sum x^{2}P(X=x)') + '.' + (inf ? ' The row ' + tx('x>' + M.K) + ' is everything after the table, added up separately (' + (M.fam === 'poisson' ? 'term by term until the terms are below ' + tx('10^{-17}') + ' of the total' : 'from the geometric series') + ').' : ''),
        block: table([tx('x'), tx('P(X=x)'), tx('x\\,P(X=x)'), tx('x^{2}P(X=x)')], tRows, { tall: tRows.length > 14, foot: true, hl: i => (inf && i === tRows.length - 2) }) });
      if (inf) steps.push({ html: 'The table alone (up to ' + tx('x=' + M.K) + ') gives ' + tx('\\sum x\\,P(X=x)' + vEq(S1, mode)) + '. The part after ' + tx('x=' + M.K) + ' adds ' + tx(vShort(T1, mode)) + ', so', math: 'E(X)' + (isQ(S1) ? '=' + vShort(S1, mode) + '+' + vShort(T1, mode) : '\\approx ' + d4(S1) + '+' + d4(T1)) + vEq(E1, mode) });
      else steps.push({ html: 'The column sums (added from the exact values, not the rounded ones):', math: lines('E(X)=\\sum x\\,P(X=x)' + vEq(E1, mode), 'E(X^{2})=\\sum x^{2}P(X=x)' + vEq(E2, mode)) });
      steps.push({ html: 'Variance from the table (Week 10): ' + tx('\\mathrm{Var}(X)=E(X^{2})-[E(X)]^{2}') + ':', math: '\\mathrm{Var}(X)' + (isQ(E2) && qEx(E2, mode) != null && qEx(E1, mode) != null ? '=' + qEx(E2, mode) + '-\\left(' + qEx(E1, mode) + '\\right)^{2}' : '\\approx ' + d4(vNum(E2)) + '-(' + d4(vNum(E1)) + ')^{2}') + vEq(Var, mode) });
      const okE = isQ(E1) && isQ(M.E.val) ? E1.eq(M.E.val) : Math.abs(vNum(E1) - vNum(M.E.val)) < 1e-9 * Math.max(1, vNum(M.E.val));
      const okV = isQ(Var) && isQ(M.V.val) ? Var.eq(M.V.val) : Math.abs(vNum(Var) - vNum(M.V.val)) < 1e-8 * Math.max(1, vNum(M.V.val));
      steps.push({ html: (okE && okV ? '<span class="cgood">✓ They agree.</span> ' : '<span class="cbad">They differ.</span> ') + 'Formula: ' + tx('E(X)' + vEq(M.E.val, mode)) + ' and ' + tx('\\mathrm{Var}(X)' + vEq(M.V.val, mode)) + '. Table: ' + tx('E(X)' + vEq(E1, mode)) + ' and ' + tx('\\mathrm{Var}(X)' + vEq(Var, mode)) + '.' + (isQ(E1) ? ' (Exact fractions, so they are equal exactly — not just to 4 places.)' : ' (Equal to within ' + tx('10^{-9}') + '.)') + (inf ? ' Without the part after ' + tx('x=' + M.K) + ', the table alone would give ' + tx('E(X)' + vEq(S1, mode)) + '.' : '') });
      body.appendChild(K.steps(steps));
    }

    /* ---- extras by family */
    function drawExtras(D) {
      P.x1.hidden = P.x2.hidden = true;
      const show = (pn, title, sub, fill) => { pn.hidden = false; Lab.setHTML(pn.querySelector('h3'), title); pn.sub(sub || ''); Lab.clear(pn.body); fill(pn.body); };
      if (M.fam === 'binomial') {
        show(P.x1, tx('X') + ' as a sum of ' + tx('n') + ' Bernoulli indicators', 'Week 11: ' + tx('X=X_1+X_2+\\dots+X_n') + ', where ' + tx('X_i=1') + ' if trial ' + tx('i') + ' is a success and ' + tx('0') + ' if not.', indicators);
        show(P.x2, 'Poisson approximation: ' + tx('\\text{Bin}(n,p)') + ' next to ' + tx('\\text{Poisson}(\\lambda=np)'), 'Week 11: the Poisson approximates ' + tx('\\text{Bin}(n,p)') + ' when ' + tx('n') + ' is large and ' + tx('p') + ' is small.', b => poissonApprox(b, M.n, M.p, M.pT));
      } else if (M.fam === 'hyper') {
        show(P.x1, 'Without vs with replacement: hypergeometric next to ' + tx('\\text{Bin}(n,\\tfrac{m}{N})'), 'Same box, same ' + tx('n') + '. With replacement every draw has chance ' + tx('p=\\tfrac{m}{N}') + ' and the draws are independent — that is binomial.', hyperVsBin);
      } else if (M.fam === 'poisson') {
        show(P.x1, 'Where the Poisson comes from: ' + tx('\\text{Bin}(n,\\tfrac{\\lambda}{n})') + ' as ' + tx('n') + ' grows', 'Split the interval into ' + tx('n') + ' tiny pieces, each with chance ' + tx('p=\\lambda/n') + ' of one event. That is ' + tx('\\text{Bin}(n,\\lambda/n)') + ', and for large ' + tx('n') + ' it is close to ' + tx('\\text{Poisson}(\\lambda)') + '.', poissonLimit);
      } else if (M.fam === 'geometric') {
        show(P.x1, 'The tail: ' + tx('P(X>k)=(1-p)^{k}'), tx('X>k') + ' means the first ' + tx('k') + ' trials all fail. This is why the table can stop at ' + tx('K') + ' with an exact missing mass.', geoTail);
      } else {
        show(P.x1, 'From one trial to many: IID Bernoulli trials', 'Week 11: IID Bernoulli trials are independent, identical trials (same ' + tx('p') + '), each a success or a failure.', b => {
          b.appendChild(K.note('Repeat your trial ' + tx('n') + ' times. The trials are independent and all have ' + tx('p=' + M.pT) + '. The number of successes ' + tx('X_1+X_2+\\dots+X_n') + ' is then ' + tx('\\text{Bin}(n,' + M.pT + ')') + '. Its mean adds up: ' + tx('E(X_1)+\\dots+E(X_n)=n\\cdot ' + M.pT) + '.', 'small'));
          b.appendChild(h('div', { class: 'btn-row' }, Lab.button('Go to ' + tx('\\text{Bin}(5,' + M.pT + ')'), () => { st.fam = 'binomial'; st.n = 5; buildControls(); afterParams(); }, 'btn sm')));
        });
      }
    }
    function indicators(b) {
      const n = M.n, mode = M.mode;
      if (n <= 6) {
        const cols = h('div', { class: 'cs-cols' + (n > 4 ? ' compact' : '') });
        for (let k = 0; k <= n; k++) {
          const col = h('div', { class: 'cs-col' });
          const head = h('div', { class: 'cs-head' });
          const c = Number(bChoose(n, k));
          Lab.setHTML(head, tx('X=' + k) + '<span>' + tx('\\binom{' + n + '}{' + k + '}=' + c) + ' sequence' + (c > 1 ? 's' : '') + '</span>');
          col.appendChild(head);
          const tiles = h('div', { class: 'cs-tiles' });
          for (let mask = 0; mask < 1 << n; mask++) {
            let ones = 0, s = '';
            for (let i = n - 1; i >= 0; i--) { const bit = (mask >> i) & 1; ones += bit; s += bit; }
            if (ones !== k) continue;
            const tile = h('div', { class: 'cs-tile s7-seq', title: 'X₁…X' + n + ' = ' + s.split('').join(',') + '; chance p^' + k + '(1−p)^' + (n - k) });
            s.split('').forEach(ch => tile.appendChild(h('i', { class: ch === '1' ? 'one' : '', text: ch })));
            tiles.appendChild(tile);
          }
          col.appendChild(tiles);
          col.appendChild(h('div', { class: 'cs-foot', html: tx('P(X=' + k + ')=' + qShort(M.pAt(k), mode)) }));
          cols.appendChild(col);
        }
        b.appendChild(h('div', { class: 'cs-scroll' }, cols));
        b.appendChild(K.note('All ' + tx('2^{n}=2^{' + n + '}=' + (1 << n)) + ' sequences of 0s and 1s (1 = success), grouped by how many 1s they have. Each 1 is one indicator ' + tx('X_i=1') + '.', 'small muted'));
      } else {
        b.appendChild(K.note('With ' + tx('n=' + n) + ' there are ' + tx('2^{' + n + '}' + bEq(1n << B(n))) + ' sequences — too many to draw (they are drawn for ' + tx('n\\le 6') + '). They group the same way: ' + tx('\\binom{' + n + '}{k}') + ' sequences have ' + tx('k') + ' ones.', 'small muted'));
      }
      const ks = range(0, n).filter(k => n <= 12 || k <= 3 || k >= n - 1 || k === Math.round(n * M.pn));
      const pc = colFmt(ks.map(k => M.pAt(k)));
      const rows = ks.map((k, i) => {
        const c = bChoose(n, k), one = M.p.pow(k).mul(M.q.pow(n - k));
        return [cell(String(k)), cell(bT(c)), tx('p^{' + k + '}(1-p)^{' + (n - k) + '}' + qEq(one, mode)), cell(pc[i])];
      });
      b.appendChild(table([tx('k') + ' ones', 'sequences ' + tx('\\binom{n}{k}'), 'chance of each sequence', tx('P(X=k)') + ' = count × chance'], rows, { tall: rows.length > 12 }));
      if (n > 12) b.appendChild(K.note('Rows shown: ' + tx('k\\le 3') + ', the most likely ' + tx('k') + ', and the last two.', 'small muted'));
      b.appendChild(K.steps([
        { html: 'Each indicator is Bernoulli: ' + tx('E(X_i)=p=' + M.pT) + ' and ' + tx('\\mathrm{Var}(X_i)=p(1-p)=' + M.pT + '\\times ' + M.qT + qEq(M.p.mul(M.q), mode)) + '.' },
        { html: 'Means always add (no independence needed):', math: 'E(X)=E(X_1)+\\dots+E(X_{' + n + '})=' + n + '\\times ' + M.pT + qEq(M.p.mul(n), mode) },
        { html: 'Variances add because the trials are independent:', math: '\\mathrm{Var}(X)=\\mathrm{Var}(X_1)+\\dots+\\mathrm{Var}(X_{' + n + '})=' + n + '\\times ' + M.pT + '\\times ' + M.qT + qEq(M.p.mul(M.q).mul(n), mode) },
      ]));
    }
    function cmpTable(xs, a, b2, an, bn) {
      const rows = xs.map((x, i) => [cell(String(x)), cell(d4(a[i])), cell(d4(b2[i])), cell(d4(Math.abs(a[i] - b2[i])))]);
      return table([tx('x'), an, bn, 'difference'], rows, { tall: rows.length > 12 });
    }
    function maxDiff(xs, a, b2) { let k = 0; xs.forEach((_, i) => { if (Math.abs(a[i] - b2[i]) > Math.abs(a[k] - b2[k])) k = i; }); return { x: xs[k], d: Math.abs(a[k] - b2[k]), i: k }; }
    function binFloat(n, p, xs) { // Bin(n, p) as decimals via logs (works for large n)
      const lp = Math.log(p), lq = Math.log1p(-p);
      return xs.map(x => (x < 0 || x > n ? 0 : p === 0 ? (x === 0 ? 1 : 0) : p === 1 ? (x === n ? 1 : 0) : Math.exp(lnFact(n) - lnFact(x) - lnFact(n - x) + x * lp + (n - x) * lq)));
    }
    function poissonApprox(b, n, p, pT) {
      const pn = p.num(), lamQ = p.mul(n), lam = lamQ.num();
      const lamT = qEx(lamQ, M.mode) || d4(lam);
      let x1 = n;
      if (n > 40) { x1 = Math.max(10, Math.ceil(lam + 6 * Math.sqrt(lam) + 6)); x1 = Math.min(n, x1); }
      const xs = range(0, x1);
      const bin = xs.map(x => vNum(M.pAt(x))), poi = xs.map(x => poisPmf(lam, x));
      const md = maxDiff(xs, bin, poi);
      b.appendChild(K.note('Match the means: ' + tx('\\lambda=np=' + n + '\\times ' + pT + qEq(lamQ, M.mode)) + '.', 's7-lead'));
      b.appendChild(cmpChart(xs, [{ name: tx('\\text{Bin}(' + n + ',' + pT + ')'), plain: 'Bin(' + n + ', ' + Lab.fmt(p.num()) + ')', vals: bin, cls: 's7-sa' }, { name: tx('\\text{Poisson}(' + lamT + ')'), plain: 'Poisson(' + d4Text(lam) + ')', vals: poi, cls: 's7-sb' }], { aria: 'binomial and Poisson PMFs side by side' }));
      const poiBeyond = n > 0 ? poisTail(lam, n) : 1;
      b.appendChild(K.steps([
        { html: 'Each Poisson bar uses ' + tx('P(Y=x)=\\frac{e^{-\\lambda}\\lambda^{x}}{x!}') + ' with ' + tx('\\lambda=' + lamT) + '; each binomial bar is the PMF above.', block: cmpTable(xs, bin, poi, tx('\\text{Bin}'), tx('\\text{Poisson}')) },
        { html: '<b>Largest difference</b> over ' + tx('x=0,\\dots,' + x1) + ': ' + tx('|' + d4(bin[md.i]) + '-' + d4(poi[md.i]) + '|\\approx ' + d4(md.d)) + ' at ' + tx('x=' + md.x) + '.' + (x1 < n ? ' (After ' + tx('x=' + x1) + ' both PMFs are below ' + tx('10^{-6}') + '.)' : '') + ' The Poisson also puts ' + tx('P(Y>' + n + ')\\approx ' + d4(poiBeyond)) + ' on values the binomial can never take.' },
        { html: verdictPoisson(n, pn, md.d) },
      ]));
    }
    function verdictPoisson(n, pn, d) {
      return (d < 0.01 ? '<span class="cgood">Close:</span> ' : '<span class="cbad">Not close yet:</span> ') + 'here ' + tx('n=' + n) + ' and ' + tx('p\\approx ' + d4(pn)) + '. Try a larger ' + tx('n') + ' with a smaller ' + tx('p') + ' (same ' + tx('np') + ') and watch the largest difference shrink.';
    }
    function hyperVsBin(b) {
      const { N, m, n } = M;
      const pQ = new Q(B(m), B(N)), pT = qEx(pQ, 'frac') || d4(pQ.num());
      const xs = range(0, n);
      const hy = xs.map(x => vNum(M.pAt(x)));
      const bQ = xs.map(x => new Q(bChoose(n, x) * pQ.n ** B(x) * (pQ.d - pQ.n) ** B(n - x), pQ.d ** B(n)));
      const bi = bQ.map(q => q.num());
      const md = maxDiff(xs, hy, bi);
      b.appendChild(cmpChart(xs, [{ name: 'Hypergeometric (no replacement)', plain: 'Hypergeometric', vals: hy, cls: 's7-sa' }, { name: tx('\\text{Bin}(' + n + ',' + pT + ')') + ' (with replacement)', plain: 'Binomial', vals: bi, cls: 's7-sc' }], { aria: 'hypergeometric and binomial PMFs side by side' }));
      const vB = pQ.mul(Q1.sub(pQ)).mul(n), fpc = new Q(B(N - n), B(N - 1));
      b.appendChild(K.steps([
        { html: 'The binomial uses ' + tx('p=\\frac{m}{N}=\\frac{' + m + '}{' + N + '}' + (pT === '\\frac{' + m + '}{' + N + '}' ? '' : '=' + pT)) + ' on every draw.', block: cmpTable(xs, hy, bi, 'hypergeometric', tx('\\text{Bin}(n,\\tfrac{m}{N})')) },
        { html: '<b>Largest difference</b>: ' + tx('\\approx ' + d4(md.d)) + ' at ' + tx('x=' + md.x) + '.' },
        { html: 'Same mean:', math: lines('E_{\\text{hyper}}=\\frac{nm}{N}=\\frac{' + n + '\\times ' + m + '}{' + N + '}' + qEq(M.E.val, 'frac'), 'E_{\\text{Bin}}=np=' + n + '\\times ' + pT + qEq(pQ.mul(n), 'frac')) },
        { html: 'Smaller variance. The <b>finite-population correction</b> ' + tx('\\frac{N-n}{N-1}') + ' is the only difference:', math: '\\frac{N-n}{N-1}=\\frac{' + N + '-' + n + '}{' + N + '-1}=\\frac{' + (N - n) + '}{' + (N - 1) + '}' + qEq(fpc, 'frac') },
        { html: 'So', math: '\\mathrm{Var}_{\\text{hyper}}=\\underbrace{np(1-p)}_{\\mathrm{Var}_{\\text{Bin}}' + qEq(vB, 'frac') + '}\\times\\frac{N-n}{N-1}' + qEq(M.V.val, 'frac'),
          note: 'When ' + tx('N') + ' is much larger than ' + tx('n') + ', ' + tx('\\frac{N-n}{N-1}') + ' is close to 1 and the two models almost agree.' },
      ]));
      const can10 = N * 10 <= 500;
      b.appendChild(h('div', { class: 'btn-row' }, Lab.button('Make the box 10× bigger (same ' + tx('m/N') + ')', () => { if (!can10) return; st.hN = N * 10; st.hm = m * 10; buildParams(); afterParams(); }, 'btn sm' + (can10 ? '' : ' s7-off')), can10 ? null : h('span', { class: 'small muted', text: 'N would pass 500, the limit here.' })));
    }
    function poissonLimit(b) {
      const lam = M.lam;
      const nMin = Math.max(1, Math.ceil(lam));
      if (st.cmpN < nMin) st.cmpN = nMin;
      const out = h('div', { class: 's7-stack' });
      const f = K.numField({ label: 'Pieces ' + tx('n') + ' (so ' + tx('p=\\lambda/n') + ')', min: nMin, max: 2000, value: st.cmpN, onChange: v => { st.cmpN = v; save(); fill(); } });
      f.dataset.k = 'cmpN';
      b.append(f, out);
      function fill() {
        Lab.clear(out);
        const n = st.cmpN, p = lam / n;
        const xs = range(0, Math.max(M.K, 3));
        const bin = binFloat(n, p, xs), poi = xs.map(x => poisPmf(lam, x));
        const md = maxDiff(xs, bin, poi);
        out.appendChild(cmpChart(xs, [{ name: tx('\\text{Bin}(' + n + ',\\,' + M.lamT + '/' + n + ')'), plain: 'Bin(' + n + ', λ/n)', vals: bin, cls: 's7-sc' }, { name: tx('\\text{Poisson}(' + M.lamT + ')'), plain: 'Poisson', vals: poi, cls: 's7-sb' }], { aria: 'binomial and Poisson PMFs side by side' }));
        out.appendChild(K.steps([
          { html: 'Your numbers: ' + tx('n=' + n) + ' pieces, so ' + tx('p=\\frac{\\lambda}{n}=\\frac{' + M.lamT + '}{' + n + '}\\approx ' + d6(p)) + '. The binomial mean is ' + tx('np=\\lambda=' + M.lamT) + ', the same as the Poisson.', block: cmpTable(xs, bin, poi, tx('\\text{Bin}(n,\\lambda/n)'), tx('\\text{Poisson}(\\lambda)')) },
          { html: '<b>Largest difference</b> over ' + tx('x=0,\\dots,' + xs[xs.length - 1]) + ': ' + tx('\\approx ' + d4(md.d)) + ' at ' + tx('x=' + md.x) + '. Make ' + tx('n') + ' bigger and it shrinks.' },
        ]));
      }
      fill();
    }
    function geoTail(b) {
      const ks = [1, 2, 3, 5, 10, 20, M.K].filter((v, i, a) => a.indexOf(v) === i).sort((u, v) => u - v);
      const tv = colFmt(ks.map(k => M.q.pow(k)));
      const rows = ks.map((k, i) => [cell(String(k)), tx('\\left(' + M.qT + '\\right)^{' + k + '}'), cell(tv[i])]);
      b.appendChild(table([tx('k'), tx('(1-p)^{k}'), tx('P(X>k)')], rows, { hl: i => ks[i] === M.K }));
      b.appendChild(K.note('Highlighted: your table end ' + tx('K=' + M.K) + '. The missing mass ' + tx('P(X>' + M.K + ')') + ' is exact here — no rounding.', 'small muted'));
    }

    /* ---- simulation */
    function buildSim() {
      const body = P.sim.body;
      const btns = h('div', { class: 'btn-row' });
      [[1, 'Draw once'], [100, 'Draw 100×'], [1000, 'Draw 1,000×'], [10000, 'Draw 10,000×']].forEach(([r, l], k) => btns.appendChild(Lab.button(l, () => runSim(r), k === 2 ? 'btn primary sm' : 'btn sm')));
      btns.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => { sim = null; paintSim(); }, 'btn ghost sm'));
      P.simStat = h('div', { class: 'ps-stat' });
      P.simRecent = h('div', { class: 'ps-recent' });
      P.simChart = h('div');
      body.append(btns, P.simStat, P.simRecent, P.simChart);
    }
    function runSim(r) {
      if (!M) return;
      if (!sim) sim = { n: 0, counts: new Map(), s1: 0, s2: 0, recent: [] };
      for (let i = 0; i < r; i++) {
        const o = M.sample();
        sim.n++; sim.s1 += o.x; sim.s2 += o.x * o.x;
        sim.counts.set(o.x, (sim.counts.get(o.x) || 0) + 1);
        sim.recent.push(o); if (sim.recent.length > 8) sim.recent.shift();
      }
      paintSim();
    }
    function paintSim() {
      if (!P.simStat || !M) return;
      if (!sim || !sim.n) {
        Lab.setHTML(P.simStat, '<span class="muted">No draws yet. Press a button. ' + ({ binomial: 'One draw = ' + M.n + ' trials, then count the successes.', hyper: 'One draw = take ' + M.n + ' items from the box, one by one, without putting them back.', geometric: 'One draw = run trials until the first success.', poisson: 'One draw = one interval, counted.', bernoulli: 'One draw = one trial.' }[M.fam]) + '</span>');
        Lab.clear(P.simRecent); Lab.clear(P.simChart);
        return;
      }
      const mean = sim.s1 / sim.n, vr = sim.s2 / sim.n - mean * mean;
      Lab.setHTML(P.simStat, 'Draws: <b>' + K.fmtInt(sim.n) + '</b> · average of the draws ' + tx('\\approx ' + d4(mean)) + ' (theory ' + tx('E(X)' + vEq(M.E.val, M.mode)) + ') · spread ' + tx('\\frac{1}{N}\\sum(x-\\bar x)^{2}\\approx ' + d4(vr)) + ' (theory ' + tx('\\mathrm{Var}(X)' + vEq(M.V.val, M.mode)) + ').');
      Lab.clear(P.simRecent);
      sim.recent.slice().reverse().forEach(o => P.simRecent.appendChild(h('span', { class: 'ps-seq' }, (o.seq && o.seq.length > 1 ? o.seq + ' → ' : '') + 'X = ' + o.x)));
      const vals = range(M.lo, M.K);
      let i0 = 0, i1 = vals.length - 1;
      const pf = vals.map(x => vNum(M.pAt(x)));
      if (vals.length > 61) { const D = { pf, pv: vals.map(M.pAt), miss: M.hi === Infinity ? M.tail(M.K) : Q0 }; windowOf(D); i0 = D.i0; i1 = D.i1; }
      const xs = vals.slice(i0, i1 + 1);
      const fr = xs.map(x => (sim.counts.get(x) || 0) / sim.n);
      const outside = sim.n - xs.reduce((s, x) => s + (sim.counts.get(x) || 0), 0);
      Lab.clear(P.simChart);
      P.simChart.appendChild(cmpChart(xs, [{ name: 'fraction of your ' + K.fmtInt(sim.n) + ' draws', plain: 'draws', vals: fr, cls: 's7-sd' }, { name: 'PMF ' + tx('P(X=x)'), plain: 'PMF', vals: pf.slice(i0, i1 + 1), cls: 's7-sa' }], { aria: 'simulated frequencies next to the PMF' }));
      if (outside) P.simChart.appendChild(K.note(outside + ' draw' + (outside === 1 ? '' : 's') + ' landed outside the values drawn here.', 'small muted'));
    }

    buildControls();
    afterParams();
  }

  /* ============================================================ lecture examples */
  const PRESETS = [
    { label: 'L11.1 · One die roll, success = a six', source: 'L11.1 Bernoulli distribution (03:00–05:30): a die roll is a Bernoulli trial with success = 6; E = p and Var = p(1 − p).', st: { fam: 'bernoulli', p: '1/6', ev: 'eq', a: 1, b: 1, x: 1 } },
    { label: 'L11.2 · 20 red + 40 black, draw 3 without replacement', source: 'L11.2 IID Bernoulli trials (05:00–07:30): not binomial — P(red) = 20/60 on the first draw and later draws depend on earlier ones. It is hypergeometric.', st: { fam: 'hyper', hN: 60, hm: 20, hn: 3, ev: 'eq', a: 1, b: 2, x: 1 } },
    { label: 'L11.2 · Roll a die until the first six', source: 'L11.2 IID Bernoulli trials (11:30–12:30): not binomial, because n is not fixed. The number of rolls is geometric (its PMF is not in the Week 11 notes).', st: { fam: 'geometric', p: '1/6', ev: 'le', a: 6, b: 6, x: 3 } },
    { label: 'L11.3 · A fair coin tossed 3 times', source: 'L11.3 Distribution of the binomial RV (01:30–05:30): Bin(3, 1/2) has PMF 1/8, 3/8, 3/8, 1/8.', st: { fam: 'binomial', n: 3, p: '1/2', ev: 'eq', a: 1, b: 2, x: 1 } },
    { label: 'L11.3 · Bin(4, 0.3), skewed to the right', source: 'L11.3 (07:00–08:30): slide PMF 0.2401, 0.4116, 0.2646, 0.0756, 0.0081.', st: { fam: 'binomial', n: 4, p: '0.3', ev: 'le', a: 1, b: 2, x: 0 } },
    { label: 'L11.4 · Toothbrush packs of 3, 10% defective', source: 'L11.4 Modelling situations as binomial (01:00–09:30): X = number of good brushes ~ Bin(3, 0.9). Customers complain if more than 1 is defective: P(X ≤ 1) = 0.001 + 0.027 = 0.028.', st: { fam: 'binomial', n: 3, p: '0.9', ev: 'le', a: 1, b: 2, x: 1 } },
    { label: 'L11.4 · Four dice, success = a six', source: 'L11.4 (12:00–18:30): X ~ Bin(4, 1/6); P(X ≥ 1) = 1 − 0.4823 = 0.5177 and P(X ≥ 2) = 0.1319.', st: { fam: 'binomial', n: 4, p: '1/6', ev: 'ge', a: 1, b: 2, x: 1 } },
    { label: 'L11.4 · Ball bearings, 5% defective, sample of 5', source: 'L11.4 (24:00–29:00): Bin(5, 0.05); none defective 0.7738. Two or more: 0.0225 in the lecture, which adds rounded table values (unrounded 0.0226).', st: { fam: 'binomial', n: 5, p: '0.05', ev: 'ge', a: 2, b: 5, x: 0 } },
    { label: 'L11.4 · Satellite with 4 parts, works if 2 work', source: 'L11.4 (29:00–33:00): Bin(4, 0.8); P(X ≥ 2) = 0.9728.', st: { fam: 'binomial', n: 4, p: '0.8', ev: 'ge', a: 2, b: 4, x: 2 } },
    { label: 'L11.4 · Guessing 5 questions with 4 options each', source: 'L11.4 (33:00–36:00): Bin(5, 1/4); P(X ≥ 4) = 0.0156.', st: { fam: 'binomial', n: 5, p: '1/4', ev: 'ge', a: 4, b: 5, x: 4 } },
    { label: 'L11.5 · Bin(10, 0.6): P(X = 8)', source: 'L11.5 E and Var of the binomial (08:00–11:30): C(10,8)(0.6)⁸(0.4)² = 0.121.', st: { fam: 'binomial', n: 10, p: '0.6', ev: 'eq', a: 8, b: 8, x: 8 } },
    { label: 'L11.5 · Bin(5, 0.9), found from E = 4.5 and Var = 0.45', source: 'L11.5 (13:00–16:00): p = 1 − 0.45/4.5 = 0.9 and n = 4.5/0.9 = 5; P(X = 3) = 0.0729 and P(X ≥ 4) = 0.9185.', st: { fam: 'binomial', n: 5, p: '0.9', ev: 'ge', a: 4, b: 5, x: 3 } },
    { label: 'L11.5 · A fair coin tossed 500 times', source: 'L11.5 (05:30–07:30): Bin(500, 1/2) has E = 250, Var = 125 and SD = √125 ≈ 11.1803.', st: { fam: 'binomial', n: 500, p: '1/2', ev: 'between', a: 240, b: 260, x: 250 } },
    { label: 'L11.6 · Box of 4 white + 3 black, draw 2', source: 'L11.6 Hypergeometric distribution (04:00–17:30): X = number of black. With a tree: P(0) = 12/42, P(1) = 24/42, P(2) = 6/42.', st: { fam: 'hyper', hN: 7, hm: 3, hn: 2, ev: 'eq', a: 1, b: 2, x: 1 } },
    { label: 'L11.6 · Bag of 50 balls (20 blue), sample 5', source: 'L11.6 (18:00–20:00): slide PMF 0.07, 0.26, 0.36, 0.23, 0.07, 0.01 for X = number of blue balls.', st: { fam: 'hyper', hN: 50, hm: 20, hn: 5, ev: 'eq', a: 2, b: 3, x: 2 } },
    { label: 'L11.6 · 150 women among 400 voters, a group of 25', source: 'L11.6 (20:00–22:00): P(X = 10) = C(150,10)·C(250,15)/C(400,25), left unworked in the lecture.', st: { fam: 'hyper', hN: 400, hm: 150, hn: 25, ev: 'eq', a: 10, b: 10, x: 10 } },
    { label: 'L11.6 · Five cards: the number of aces', source: 'L11.6 (26:30–28:00): N = 52 cards, m = 4 aces, n = 5 drawn; x = 0, …, 4 (no numbers in the lecture).', st: { fam: 'hyper', hN: 52, hm: 4, hn: 5, ev: 'ge', a: 1, b: 4, x: 0 } },
    { label: 'L11.7 · Hyper(500, 250, 50) next to Bin(50, 0.5)', source: 'L11.7 E and Var of the hypergeometric (24:00–31:30): the same mean; the hypergeometric is less spread out by the factor (N − n)/(N − 1).', st: { fam: 'hyper', hN: 500, hm: 250, hn: 50, ev: 'between', a: 20, b: 30, x: 25 } },
    { label: 'L11.8 · Vehicles per minute: Poisson(2.39)', source: 'L11.8 Poisson distribution (18:00–21:00): fitted PMF 0.092, 0.219, 0.262, 0.208, 0.125, 0.060, 0.024 for x = 0, …, 6.', st: { fam: 'poisson', lam: '2.39', ev: 'le', a: 2, b: 2, x: 0 } },
    { label: 'L11.9 · Factory accidents: Poisson(0.5) per week', source: 'L11.9 E and Var of Poisson (08:30–09:30): P(X ≤ 2) = 0.9856.', st: { fam: 'poisson', lam: '0.5', ev: 'le', a: 2, b: 2, x: 2 } },
    { label: 'L11.9 · Dogs on a road: Poisson(0.42) per day', source: 'L11.9 (09:30–10:30): P(X = 2) = 0.058.', st: { fam: 'poisson', lam: '0.42', ev: 'eq', a: 2, b: 2, x: 2 } },
    { label: 'L11.9 · Wire cable: Poisson(0.5) defects per metre', source: 'L11.9 (12:30–13:30): P(exactly 3 in one metre) = 0.0126.', st: { fam: 'poisson', lam: '0.5', ev: 'eq', a: 3, b: 3, x: 3 } },
    { label: 'L11.9 · Typist: Poisson(3) mistakes per page', source: 'L11.9 (13:30–16:00): 1500 mistakes in 500 pages gives λ = 3; expected pages with no mistake = 500e⁻³ ≈ 24.9 (not worked out aloud).', st: { fam: 'poisson', lam: '3', ev: 'eq', a: 0, b: 0, x: 0 } },
  ];

  Lab.lab({
    id: ID, course: 's1', week: 11, order: 1,
    title: 'Binomial, hypergeometric and Poisson lab', sub: 'Week 11 · named distributions',
    topics: ['Bernoulli', 'binomial', 'hypergeometric', 'Poisson', 'geometric', 'PMF', 'CDF', 'E and Var', 'Poisson approximation'],
    desc: 'Pick a named distribution and type its parameters. See the PMF and CDF, the formula with your numbers, any range added term by term, E(X) and Var(X) by formula and from the table, binomial vs hypergeometric, and the Poisson approximation.',
    render,
  });
})();
