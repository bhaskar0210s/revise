/* Revise — Statistics I, Week 12 lab: continuous random variables and the normal.
   Uniform U(a, b), triangular (corners a, m, b), exponential exp(λ), normal N(μ, σ²) and standard normal Z.
   The learner types every parameter and drags the interval [c, d] on the PDF; everything redraws (LABS.md).
   Rule 0: every number says where it comes from — symbols first, then the learner's numbers.
   Φ has no closed form: it is computed with Marsaglia's series (continued fraction in the far tails),
   about 15 correct digits, and shown to 4 places. Uniform and triangle answers are exact fractions
   (BigInt) when the inputs are exact. Styles: assets/css/labs/s7.css (prefix s7-). */
(function () {
  'use strict';
  const { h, svg } = Lab;
  const K = Lab.play;
  const ID = 'lab-s1-continuous';
  const KEY = 'lab:' + ID;
  const FAMS = ['uniform', 'triangle', 'exponential', 'normal', 'std'];
  const DEF = {
    fam: 'normal', ua: '0', ub: '10', ta: '0', tm: '4', tb: '10', lam: '0.5', mu: '70', sp: '10', par: 'sd',
    cd: { uniform: ['2', '7'], triangle: ['2', '6'], exponential: ['1', '3'], normal: ['60', '85'], std: ['-1', '1.5'] },
    ev: 'between', alpha: '0.05', mu2: '30', sd2: '5', tsum: '110', mx: '2', mk: '3',
  };
  const tx = (s, d) => Lab.tex(s, d);
  const range = (a, b) => { const o = []; for (let v = a; v <= b; v++) o.push(v); return o; };
  /** Several equations, one per line, left-aligned (display TeX). */
  const lines = (...ls) => (ls.length === 1 ? ls[0] : '\\begin{aligned}&' + ls.join('\\\\&') + '\\end{aligned}');

  /* ============================================================ exact fractions (BigInt) — same as the Week 11 lab */
  const B = BigInt;
  const bAbs = v => (v < 0n ? -v : v);
  function bGcd(a, b) { a = bAbs(a); b = bAbs(b); while (b) { const t = a % b; a = b; b = t; } return a; }
  const bLen = v => (v === 0n ? 0 : bAbs(v).toString(2).length);
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
    num() { return bDiv(this.n, this.d); }
  }
  const Q1 = new Q(1n);
  const modeOf = (...ss) => (ss.some(s => /\//.test(String(s))) ? 'frac' : 'dec');

  /* ============================================================ number formatting */
  const sepD = s => s.replace(/\B(?=(\d{3})+(?!\d))/g, '{,}');
  const sepN = s => { const i = s.indexOf('.'); return i < 0 ? sepD(s) : sepD(s.slice(0, i)) + s.slice(i); };
  const trimZ = s => (s.indexOf('.') < 0 ? s : s.replace(/0+$/, '').replace(/\.$/, ''));
  function sci(v, sig = 4) { const [m, e] = v.toExponential(sig - 1).split('e'); return m + '\\times 10^{' + parseInt(e, 10) + '}'; }
  const SUPS = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function sciText(v, sig = 4) { const [m, e] = v.toExponential(sig - 1).split('e'); return m + '×10' + String(parseInt(e, 10)).split('').map(c => SUPS[c]).join(''); }
  /** 4 decimal places (kept: they show the rounding); tiny or huge values in scientific form. */
  function d4(v) {
    if (v === 0) return '0';
    if (Number.isInteger(v) && Math.abs(v) < 1e15) return sepD(String(v));
    const a = Math.abs(v);
    if (a < 0.001 || a >= 1e9) return sci(v);
    return sepN(v.toFixed(4));
  }
  function d4Text(v) { if (v === 0) return '0'; if (Number.isInteger(v) && Math.abs(v) < 1e15) return String(v); const a = Math.abs(v); if (a < 0.001 || a >= 1e9) return sciText(v); return v.toFixed(4); }
  /** Six significant digits, for factors inside a longer calculation. */
  function d6(v) { if (v === 0) return '0'; const a = Math.abs(v); if (a < 1e-4 || a >= 1e9) { const [m, e] = v.toExponential(5).split('e'); return trimZ(m) + '\\times 10^{' + parseInt(e, 10) + '}'; } return sepN(trimZ(String(+v.toPrecision(6)))); }
  function termPlaces(q) { let d = q.d, a = 0, b = 0; while (d % 2n === 0n) { d /= 2n; a++; } while (d % 5n === 0n) { d /= 5n; b++; } return d === 1n ? Math.max(a, b) : -1; }
  function qRound(q, dp, trim) {
    const neg = q.n < 0n, s = 10n ** B(dp);
    const r = (2n * bAbs(q.n) * s + q.d) / (2n * q.d);
    let str = r.toString();
    if (dp > 0) { str = str.padStart(dp + 1, '0'); str = str.slice(0, -dp) + '.' + str.slice(-dp); if (trim) str = trimZ(str); }
    return (neg && r !== 0n ? '-' : '') + sepN(str);
  }
  function qEx(q, mode) {
    if (q.d === 1n) return bAbs(q.n).toString().length <= 15 ? (q.n < 0n ? '-' : '') + sepD(bAbs(q.n).toString()) : null;
    const tp = termPlaces(q);
    const dec = tp >= 0 && tp <= 10 ? qRound(q, tp, true) : null;
    const fr = q.d <= 10000000n ? (q.n < 0n ? '-' : '') + '\\frac{' + sepD(bAbs(q.n).toString()) + '}{' + sepD(q.d.toString()) + '}' : null;
    return mode === 'dec' ? dec || fr : fr || dec;
  }
  const qD4exact = q => { const tp = termPlaces(q); return tp >= 0 && tp <= 4; };
  function qD4(q) {
    if (q.n === 0n) return '0';
    if (qD4exact(q)) return qRound(q, termPlaces(q), true);
    const v = q.num();
    if (Math.abs(v) < 0.001 || Math.abs(v) >= 1e9) return sci(v);
    return qRound(q, 4, false);
  }
  function qEq(q, mode) {
    const ex = qEx(q, mode), ap = qD4(q), rel = qD4exact(q) ? '=' : '\\approx ';
    if (ex == null) return rel + ap;
    if (ex === ap) return '=' + ex;
    return '=' + ex + rel + ap;
  }
  /* values that are exact fractions (Q) when every input was exact, else decimals */
  const isQ = v => v instanceof Q;
  const vNum = v => (isQ(v) ? v.num() : v);
  const both = (a, b) => isQ(a) && isQ(b);
  const vAdd = (a, b) => (both(a, b) ? a.add(b) : vNum(a) + vNum(b));
  const vSub = (a, b) => (both(a, b) ? a.sub(b) : vNum(a) - vNum(b));
  const vMul = (a, b) => (both(a, b) ? a.mul(b) : vNum(a) * vNum(b));
  const vDiv = (a, b) => (both(a, b) ? a.div(b) : vNum(a) / vNum(b));
  const vEq = (v, mode) => (isQ(v) ? qEq(v, mode) : v === 0 ? '=0' : Number.isInteger(v) ? '=' + d4(v) : '\\approx ' + d4(v));
  const vT = (v, mode) => (isQ(v) ? qEx(v, mode) || qD4(v) : d4(v));
  /** '=' when v is shown exactly, '≈' when it is rounded. */
  const vRel = (v, mode) => (isQ(v) ? (qEx(v, mode) != null ? '=' : '\\approx ') : Number.isInteger(v) ? '=' : '\\approx ');
  const neg = t => (/^-/.test(t) ? '(' + t + ')' : t);
  /** For plain-text labels: '= 0.2' when the value is exact and short, else '≈ 0.2000'. */
  const eqText = v => (isQ(v) && qD4exact(v) ? '= ' + qD4(v).replace(/\{,\}/g, ',') : Number.isInteger(v) ? '= ' + v : '≈ ' + d4Text(vNum(v)));
  /** √v with '=' when the root is exact (√100 = 10, √90.25 = 9.5), else '≈'. */
  function sqrtEq(v) { const r = Math.sqrt(vNum(v)), t = String(+r.toPrecision(12)); if (isQ(v)) { const rp = pv(t); if (rp && rp.q) { const sq = rp.q.mul(rp.q); if (sq.n === v.n && sq.d === v.d) return '=' + rp.t; } } else if (Number.isInteger(v) && Number.isInteger(r)) return '=' + r; return '\\approx ' + d4(r); }

  /** Parse what the learner typed: 2.5, 5/2, 25%, 1e-3. → {s, v, q (exact or null), t (TeX)} */
  function pv(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return null;
    if (/^[+-]?(\d+\.?\d*|\.\d+)e[+-]?\d+$/i.test(s)) { const v = Number(s); return Number.isFinite(v) ? { s, v, q: null, t: d6(v) } : null; }
    const f = K.parseNum(s);
    if (f == null) return null;
    const v = Number(f);
    if (!Number.isFinite(v)) return null;
    const q = f.approx ? null : Q.of(f);
    return { s, v, q, t: q ? qEx(q, modeOf(s)) || d6(v) : d6(v) };
  }
  const val = p => (p.q || p.v);

  /* ============================================================ Φ and its inverse */
  const SQRT2PI = Math.sqrt(2 * Math.PI);
  const phi = z => Math.exp(-0.5 * z * z) / SQRT2PI;
  /** Upper tail P(Z > z) for large z: Laplace's continued fraction, evaluated from the back. */
  function tailCF(z) { let f = z; for (let k = 160; k >= 1; k--) f = z + k / f; return phi(z) / f; }
  /** Φ(z) = P(Z ≤ z). Marsaglia's series for |z| ≤ 5.5, continued fraction beyond. */
  function Phi(z) {
    if (!Number.isFinite(z)) return z > 0 ? 1 : 0;
    if (z < -5.5) return tailCF(-z);
    if (z > 5.5) return 1 - tailCF(z);
    let s = z, t = 0, b = z, i = 1;
    const q = z * z;
    while (s !== t) { t = s; i += 2; b *= q / i; s = t + b; }
    return 0.5 + s * Math.exp(-0.5 * q - 0.91893853320467274178);
  }
  /** Φ⁻¹(p): Acklam's rational start, then two Halley steps using Φ itself (≈ 15 digits). */
  function PhiInv(p) {
    if (p <= 0) return -Infinity;
    if (p >= 1) return Infinity;
    const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
    const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
    const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
    const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
    let x;
    if (p < 0.02425) { const q = Math.sqrt(-2 * Math.log(p)); x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    else if (p <= 1 - 0.02425) { const q = p - 0.5, r = q * q; x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
    else { const q = Math.sqrt(-2 * Math.log(1 - p)); x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
    for (let i = 0; i < 2; i++) { const e = Phi(x) - p; const u = e * SQRT2PI * Math.exp((x * x) / 2); x -= u / (1 + (x * u) / 2); }
    return x;
  }
  /** Numerical integral (Simpson's rule) of g on [a, b], split at the given points. */
  function integrate(g, a, b, cuts = [], n = 2000) {
    const pts = [a].concat(cuts.filter(x => x > a && x < b).sort((u, v) => u - v), [b]);
    let s = 0;
    for (let k = 0; k + 1 < pts.length; k++) {
      const lo = pts[k], hi = pts[k + 1], m = n % 2 ? n + 1 : n, hstep = (hi - lo) / m;
      let acc = g(lo) + g(hi);
      for (let i = 1; i < m; i++) acc += g(lo + i * hstep) * (i % 2 ? 4 : 2);
      s += (acc * hstep) / 3;
    }
    return s;
  }

  /* ============================================================ inputs */
  /** Number box that keeps exactly what the learner typed (2.5, 5/2, 1/10, 25%) + a slider. onChange(value, text). */
  function valField({ label, value, min, max, step, onChange, check, hint, key }) {
    const input = h('input', { class: 'field mono pl-num s7-val', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal' });
    const rng = h('input', { class: 'slider pl-range', type: 'range', min, max, step });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, rng), msg);
    if (key) wrap.dataset.k = key;
    let lo = min, hi = max;
    const paint = v => { const c = Math.max(lo, Math.min(hi, v)); rng.value = c; rng.style.setProperty('--pct', (hi > lo ? ((c - lo) / (hi - lo)) * 100 : 0) + '%'); };
    function apply() {
      const p = pv(input.value);
      const err = p == null ? 'Type a number, for example 2.5 or 5/2.' : check ? check(p.v) : null;
      if (err) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">' + err + '</span>'); return; }
      input.classList.remove('bad');
      Lab.setHTML(msg, hint ? hint(p) : '');
      paint(p.v);
      onChange(p.v, input.value.trim());
    }
    input.addEventListener('input', apply);
    rng.addEventListener('input', () => { input.value = String(+(+rng.value).toFixed(6)); apply(); });
    const p0 = pv(value);
    if (p0) { paint(p0.v); if (hint) Lab.setHTML(msg, hint(p0)); }
    wrap.input = input;
    wrap.set = s => { input.value = String(s); input.classList.remove('bad'); const p = pv(s); if (p) { paint(p.v); Lab.setHTML(msg, hint ? hint(p) : ''); } };
    wrap.setRange = (a, b, st) => { lo = a; hi = b; rng.min = a; rng.max = b; if (st) rng.step = st; const p = pv(input.value); if (p) paint(p.v); };
    return wrap;
  }

  /* ============================================================ drawing */
  function niceStep(raw) { const mag = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / mag; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * mag; }
  function niceTicks(lo, hi, count) {
    const step = niceStep((hi - lo || Math.abs(hi) || 1) / Math.max(1, count));
    const out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toPrecision(12));
    return out;
  }
  const tickTxt = v => String(+(+v).toPrecision(8));
  /** A plot area: x from lo to hi, y from 0 to ymax. Returns {s (svg), X, Y, W, H, pl, pr, pt, pb, path(), area(), toX(evt)}. */
  function frame(o) {
    const W = o.W || 720, H = o.height || 270, pl = W < 480 ? 46 : 56, pr = W < 480 ? 12 : 18, pt = o.pt || 22, pb = 40;
    const lo = o.lo, hi = o.hi;
    const yt = o.yticks === false ? [] : niceTicks(0, o.ymax, (o.W || 720) < 480 ? 3 : 4);
    const ym = Math.max(o.ymax, yt.length ? yt[yt.length - 1] : o.ymax) || 1;
    const X = x => pl + ((x - lo) / (hi - lo)) * (W - pl - pr);
    const Y = y => pt + (1 - Math.max(0, Math.min(y, ym * 1.08)) / ym) * (H - pt - pb);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 's7-plot ' + (o.cls || ''), role: 'img', 'aria-label': o.aria || 'graph' });
    yt.forEach(t => {
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 's7-grid' }));
      s.appendChild(svg('text', { x: pl - 7, y: Y(t) + 4, 'text-anchor': 'end', class: 's7-tick' }, tickTxt(t)));
    });
    (o.xticks || niceTicks(lo, hi, W < 480 ? 5 : 8)).forEach(t => {
      if (t < lo - 1e-9 || t > hi + 1e-9) return;
      s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: Y(0), y2: Y(0) + 5, class: 's7-axis' }));
      s.appendChild(svg('text', { x: X(t), y: Y(0) + 18, 'text-anchor': 'middle', class: 's7-tick' }, o.xfmt ? o.xfmt(t) : tickTxt(t)));
    });
    s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(0), y2: Y(0), class: 's7-axis' }));
    if (o.xLabel) s.appendChild(svg('text', { x: W - pr, y: H - 4, 'text-anchor': 'end', class: 's7-tick s7-axlab' }, o.xLabel));
    if (o.yLabel) s.appendChild(svg('text', { x: 6, y: 12, class: 's7-tick s7-axlab' }, o.yLabel));
    /** points of g on [a, b], with the kinks of g included (and both sides of a jump) */
    const pts = (g, a, b, kinks = [], n = 360) => {
      const xs = [];
      for (let i = 0; i <= n; i++) xs.push(a + ((b - a) * i) / n);
      kinks.forEach(k => { if (k > a && k < b) { const e = (hi - lo) * 1e-7; xs.push(k - e, k, k + e); } });
      return xs.sort((u, v) => u - v).map(x => [x, g(x)]);
    };
    const path = (g, a, b, kinks) => pts(g, a, b, kinks).map((p, i) => (i ? 'L' : 'M') + X(p[0]).toFixed(1) + ',' + Y(p[1]).toFixed(1)).join(' ');
    const area = (g, a, b, kinks) => { if (!(b > a)) return ''; const p = pts(g, a, b, kinks, 200); return 'M' + X(a).toFixed(1) + ',' + Y(0).toFixed(1) + ' ' + p.map(q => 'L' + X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1)).join(' ') + ' L' + X(b).toFixed(1) + ',' + Y(0).toFixed(1) + ' Z'; };
    const toX = e => { const m = s.getScreenCTM(); if (!m) return lo; const p = s.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(m.inverse()); return lo + ((q.x - pl) / (W - pl - pr)) * (hi - lo); };
    return { s, X, Y, W, H, pl, pr, pt, pb, lo, hi, path, area, toX };
  }
  const wrapSvg = (s, cls) => h('div', { class: 's7-scroll' + (cls ? ' ' + cls : '') }, s);
  /** Drawing width for a chart in this panel: its real width (so text keeps its size), 340–760. */
  const chartW = el => Math.round(Math.max(340, Math.min(760, (el && el.clientWidth) || 720)));
  function table(head, rows, opts = {}) {
    const t = h('table', { class: 'tbl s7-tbl' });
    t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach((r, i) => tb.appendChild(h('tr', { class: opts.hl && opts.hl(i) ? 'hl-row' : null }, r.map(c => h('td', { html: c })))));
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap s7-tblwrap' + (opts.tall ? ' s7-tall' : '') }, t);
  }

  /* ============================================================ the five families */
  function famUniform(st) {
    const a = pv(st.ua), b = pv(st.ub);
    if (!a || !b) return { error: 'Type a number for ' + tx('a') + ' and for ' + tx('b') + '.' };
    if (!(b.v > a.v)) return { error: 'A uniform distribution needs ' + tx('a<b') + '. You have ' + tx('a=' + a.t) + ' and ' + tx('b=' + b.t) + '.' };
    const L = b.v - a.v, aV = val(a), bV = val(b), wV = vSub(bV, aV), hV = vDiv(isQ(wV) ? Q1 : 1, wV), mode = modeOf(st.ua, st.ub);
    return {
      fam: 'uniform', V: 'X', a, b, mode, hV, lo: a.v - 0.25 * L, hi: b.v + 0.25 * L, kinks: [a.v, b.v], fmax: 1 / L,
      law: 'U(' + a.t + ',' + b.t + ')',
      pdf: x => (x >= a.v && x <= b.v ? 1 / L : 0),
      cdf: x => (x <= a.v ? 0 : x >= b.v ? 1 : (x - a.v) / L),
      support: [a.v, b.v],
      intro: 'The PDF is flat: ' + tx('f(x)=\\frac{1}{b-a}=\\frac{1}{' + b.t + '-' + neg(a.t) + '}' + vEq(hV, mode)) + ' for ' + tx(a.t + '\\le x\\le ' + b.t) + ', and 0 outside. Area = width × height = ' + tx('(b-a)\\times\\frac{1}{b-a}=1') + '.',
      heightNote: 'Height ' + tx('\\frac{1}{b-a}' + vEq(hV, mode)),
      /** F at a typed point x (p = parsed), with the working, exact when possible */
      F(p) {
        const x = val(p);
        if (p.v <= a.v) return { v: isQ(x) ? new Q(0n) : 0, why: tx(p.t + '\\le a=' + a.t) + ', so no area is to its left: ' + tx('F(' + p.t + ')=0') + '.' };
        if (p.v >= b.v) return { v: isQ(x) ? Q1 : 1, why: tx(p.t + '\\ge b=' + b.t) + ', so all the area is to its left: ' + tx('F(' + p.t + ')=1') + '.' };
        const num = vSub(x, aV), F = vDiv(num, wV);
        return { v: F, why: 'Rectangle from ' + tx('a') + ' to ' + tx('x') + ': width ' + tx('x-a') + ' times height ' + tx('\\frac{1}{b-a}') + ':', math: 'F(' + p.t + ')=\\frac{x-a}{b-a}=\\frac{' + p.t + '-' + neg(a.t) + '}{' + b.t + '-' + neg(a.t) + '}=\\frac{' + vT(num, mode) + '}{' + vT(wV, mode) + '}' + vEq(F, mode) };
      },
      E: { sym: 'E(X)=\\frac{a+b}{2}', num: 'E(X)=\\frac{a+b}{2}=\\frac{' + a.t + '+' + neg(b.t) + '}{2}', v: vDiv(vAdd(aV, bV), isQ(aV) && isQ(bV) ? new Q(2n) : 2) },
      Var: { sym: '\\mathrm{Var}(X)=\\frac{(b-a)^{2}}{12}', num: '\\mathrm{Var}(X)=\\frac{(b-a)^{2}}{12}=\\frac{(' + vT(wV, mode) + ')^{2}}{12}', v: vDiv(vMul(wV, wV), isQ(wV) ? new Q(12n) : 12) },
    };
  }

  function famTriangle(st) {
    const a = pv(st.ta), m = pv(st.tm), b = pv(st.tb);
    if (!a || !m || !b) return { error: 'Type a number for each corner ' + tx('a') + ', ' + tx('m') + ', ' + tx('b') + '.' };
    if (!(b.v > a.v)) return { error: 'The triangle needs ' + tx('a<b') + '. You have ' + tx('a=' + a.t) + ' and ' + tx('b=' + b.t) + '.' };
    if (m.v < a.v || m.v > b.v) return { error: 'The peak must lie between the ends: ' + tx('a\\le m\\le b') + '. You have ' + tx('m=' + m.t) + '.' };
    const mode = modeOf(st.ta, st.tm, st.tb), ex = isQ(val(a)) && isQ(val(m)) && isQ(val(b));
    const aV = val(a), mV = val(m), bV = val(b), wV = vSub(bV, aV), two = ex ? new Q(2n) : 2, half = ex ? new Q(1n, 2n) : 0.5;
    const hV = vDiv(two, wV), L = b.v - a.v, hgt = 2 / L;
    const f = x => (x < a.v || x > b.v ? 0 : x <= m.v ? (m.v > a.v ? (hgt * (x - a.v)) / (m.v - a.v) : hgt) : m.v < b.v ? (hgt * (b.v - x)) / (b.v - m.v) : hgt);
    const cdf = x => (x <= a.v ? 0 : x >= b.v ? 1 : x <= m.v ? ((x - a.v) * (x - a.v)) / (L * (m.v - a.v)) : 1 - ((b.v - x) * (b.v - x)) / (L * (b.v - m.v)));
    const sq = v => vMul(v, v);
    const Ev = vDiv(vAdd(vAdd(aV, mV), bV), ex ? new Q(3n) : 3);
    const Vv = vDiv(vSub(vAdd(vAdd(sq(aV), sq(mV)), sq(bV)), vAdd(vAdd(vMul(aV, mV), vMul(aV, bV)), vMul(mV, bV))), ex ? new Q(18n) : 18);
    return {
      fam: 'triangle', V: 'X', a, m, b, mode, lo: a.v - 0.2 * L, hi: b.v + 0.2 * L, kinks: [a.v, m.v, b.v], fmax: hgt,
      law: '\\text{Triangle}(a=' + a.t + ',\\,m=' + m.t + ',\\,b=' + b.t + ')',
      pdf: f, cdf, support: [a.v, b.v], hV,
      intro: 'A triangle with corners ' + tx('(a,0)=(' + a.t + ',0)') + ', ' + tx('(m,h)=(' + m.t + ',h)') + ' and ' + tx('(b,0)=(' + b.t + ',0)') + '. You set ' + tx('a') + ', ' + tx('m') + ' and ' + tx('b') + '; the height ' + tx('h') + ' is <b>not</b> free:',
      heightMath: lines('\\text{area}=\\tfrac12\\times\\text{base}\\times\\text{height}=\\tfrac12(b-a)\\,h=1', 'h=\\frac{2}{b-a}=\\frac{2}{' + b.t + '-' + neg(a.t) + '}' + vEq(hV, mode)),
      heightNote: 'Height ' + tx('h=\\frac{2}{b-a}' + vEq(hV, mode)),
      F(p) {
        const x = val(p);
        if (p.v <= a.v) return { v: ex && isQ(x) ? new Q(0n) : 0, why: tx(p.t + '\\le a=' + a.t) + ': no area to its left, ' + tx('F(' + p.t + ')=0') + '.' };
        if (p.v >= b.v) return { v: ex && isQ(x) ? Q1 : 1, why: tx(p.t + '\\ge b=' + b.t) + ': all the area is to its left, ' + tx('F(' + p.t + ')=1') + '.' };
        if (p.v <= m.v && m.v > a.v) {
          const run = vSub(x, aV), fx = vMul(hV, vDiv(run, vSub(mV, aV))), F = vMul(vMul(half, run), fx);
          return { v: F, why: 'Left of the peak, the area to the left of ' + tx('x') + ' is a small triangle: base ' + tx('x-a') + ', height ' + tx('f(x)') + ' (similar triangles: ' + tx('f(x)=h\\,\\frac{x-a}{m-a}') + ').',
            math: lines('f(' + p.t + ')=h\\,\\frac{x-a}{m-a}=' + vT(hV, mode) + '\\times\\frac{' + vT(run, mode) + '}{' + vT(vSub(mV, aV), mode) + '}' + vEq(fx, mode), 'F(' + p.t + ')=\\tfrac12\\,(x-a)\\,f(x)=\\tfrac12\\times ' + vT(run, mode) + '\\times ' + vT(fx, mode) + vEq(F, mode)) };
        }
        const run = vSub(bV, x), fx = vMul(hV, vDiv(run, vSub(bV, mV))), small = vMul(vMul(half, run), fx), F = vSub(ex && isQ(small) ? Q1 : 1, small);
        return { v: F, why: 'Right of the peak, take all the area (1) and remove the small triangle to the right of ' + tx('x') + ': base ' + tx('b-x') + ', height ' + tx('f(x)=h\\,\\frac{b-x}{b-m}') + '.',
          math: lines('f(' + p.t + ')=h\\,\\frac{b-x}{b-m}=' + vT(hV, mode) + '\\times\\frac{' + vT(run, mode) + '}{' + vT(vSub(bV, mV), mode) + '}' + vEq(fx, mode), 'F(' + p.t + ')=1-\\tfrac12\\,(b-x)\\,f(x)=1-\\tfrac12\\times ' + vT(run, mode) + '\\times ' + vT(fx, mode) + vEq(F, mode)) };
      },
      E: { sym: 'E(X)=\\frac{a+m+b}{3}', num: 'E(X)=\\frac{a+m+b}{3}=\\frac{' + a.t + '+' + neg(m.t) + '+' + neg(b.t) + '}{3}', v: Ev, extra: true },
      Var: { sym: '\\mathrm{Var}(X)=\\frac{a^2+m^2+b^2-am-ab-mb}{18}', num: '\\mathrm{Var}(X)=\\frac{a^2+m^2+b^2-am-ab-mb}{18}', v: Vv, extra: true },
    };
  }

  function famExponential(st) {
    const l = pv(st.lam);
    if (!l || !(l.v > 0)) return { error: 'The rate must be positive: ' + tx('\\lambda>0') + '.' };
    const lam = l.v, R = 5 / lam;
    return {
      fam: 'exponential', V: 'X', l, mode: 'dec', lo: -0.06 * R, hi: R, kinks: [0], fmax: lam,
      law: '\\exp(' + l.t + ')',
      pdf: x => (x < 0 ? 0 : lam * Math.exp(-lam * x)),
      cdf: x => (x <= 0 ? 0 : 1 - Math.exp(-lam * x)),
      support: [0, Infinity],
      intro: 'Waiting times (Week 12): ' + tx('f(x)=\\lambda e^{-\\lambda x}') + ' for ' + tx('x\\ge 0') + ', with rate ' + tx('\\lambda=' + l.t) + '. The curve starts at height ' + tx('f(0)=\\lambda=' + l.t) + ' and falls. ' + tx('F(x)=1-e^{-\\lambda x}') + ' for ' + tx('x\\ge 0') + '.',
      heightNote: 'Height at 0: ' + tx('f(0)=\\lambda=' + l.t),
      F(p) {
        if (p.v <= 0) return { v: 0, why: tx(p.t + '\\le 0') + ': a waiting time is never negative, so ' + tx('F(' + p.t + ')=0') + '.' };
        const k = lam * p.v, e = Math.exp(-k), F = 1 - e;
        return { v: F, why: tx('F(x)=1-e^{-\\lambda x}') + ', and ' + tx('e^{-\\lambda x}') + ' is shown to 6 significant digits:',
          math: lines('\\lambda x=' + l.t + '\\times ' + neg(p.t) + (Number.isInteger(k) ? '=' : '\\approx ') + d6(k), 'F(' + p.t + ')=1-e^{-' + d6(k) + '}\\approx 1-' + d6(e) + '\\approx ' + d6(F)) };
      },
      E: { sym: 'E(X)=\\frac{1}{\\lambda}', num: 'E(X)=\\frac{1}{\\lambda}=\\frac{1}{' + l.t + '}', v: l.q ? Q1.div(l.q) : 1 / lam },
      Var: { sym: '\\mathrm{Var}(X)=\\frac{1}{\\lambda^{2}}', num: '\\mathrm{Var}(X)=\\frac{1}{\\lambda^{2}}=\\frac{1}{(' + l.t + ')^{2}}', v: l.q ? Q1.div(l.q.mul(l.q)) : 1 / (lam * lam) },
    };
  }

  function famNormal(st, std) {
    let mu, sd, sp, sigT, sdLine = '';
    if (std) { mu = pv('0'); sd = pv('1'); sp = pv('1'); sigT = '1'; }
    else {
      mu = pv(st.mu); sp = pv(st.sp);
      if (!mu || !sp) return { error: 'Type a number for ' + tx('\\mu') + ' and for ' + tx(st.par === 'var' ? '\\sigma^2' : '\\sigma') + '.' };
      if (!(sp.v > 0)) return { error: tx(st.par === 'var' ? '\\sigma^2' : '\\sigma') + ' must be positive.' };
      if (st.par === 'var') {
        const r = Math.sqrt(sp.v), rp = pv(String(+r.toPrecision(12)));
        const exactRoot = !!(sp.q && rp && rp.q && rp.q.mul(rp.q).n === sp.q.n && rp.q.mul(rp.q).d === sp.q.d);
        sd = exactRoot ? rp : pv(String(r));
        sigT = exactRoot ? rp.t : d6(r);
        sdLine = tx('\\sigma=\\sqrt{\\sigma^2}=\\sqrt{' + sp.t + '}' + (exactRoot ? '=' : '\\approx ') + sigT);
      } else { sd = sp; sigT = sp.t; }
    }
    const m = mu.v, s = sd.v;
    const varT = std ? '1' : st.par === 'var' ? sp.t : (sp.q ? qEx(sp.q.mul(sp.q), modeOf(st.sp)) || d6(s * s) : d6(s * s));
    const V = std ? 'Z' : 'X';
    return {
      fam: std ? 'std' : 'normal', V, mu, sd, std, mode: 'dec', m, s, muT: mu.t, sigT, varT, sdLine,
      lo: m - 4 * s, hi: m + 4 * s, kinks: [], fmax: 1 / (SQRT2PI * s),
      law: std ? 'N(0,1)' : 'N(' + mu.t + ',\\,' + varT + ')',
      pdf: x => phi((x - m) / s) / s,
      cdf: x => Phi((x - m) / s),
      support: [-Infinity, Infinity],
      intro: std ? 'The standard normal ' + tx('Z\\sim N(0,1)') + ': mean 0, SD 1. Its CDF has its own name, ' + tx('\\Phi(z)=P(Z\\le z)') + '.'
        : tx('X\\sim N(\\mu,\\sigma^2)') + ' with ' + tx('\\mu=' + mu.t) + ' and ' + tx('\\sigma^2=' + varT) + ', so ' + tx('\\sigma=' + sigT) + (sdLine ? ' (' + sdLine + ')' : '') + '. Bell-shaped and symmetric about ' + tx('\\mu') + '; peak height ' + tx('\\frac{1}{\\sqrt{2\\pi}\\,\\sigma}\\approx ' + d4(1 / (SQRT2PI * s))) + '.',
      heightNote: 'Peak height ' + tx('\\frac{1}{\\sqrt{2\\pi}\\,\\sigma}\\approx ' + d4(1 / (SQRT2PI * s))),
      z(p) { const zq = !std && mu.q && sd.q && p.q ? p.q.sub(mu.q).div(sd.q) : std && p.q ? p.q : null; return { v: zq ? zq.num() : (p.v - m) / s, q: zq }; },
      F(p) {
        const z = this.z(p), Fz = Phi(z.v), zt = z.q ? qEx(z.q, 'dec') || d4(z.v) : d4(z.v), zrel = z.q && qEx(z.q, 'dec') != null ? '=' : '\\approx ';
        const out = { v: Fz, z: z.v, zt };
        if (std) { out.why = 'For ' + tx('Z') + ' itself, ' + tx('F(z)=\\Phi(z)') + ', computed numerically:'; out.math = '\\Phi(' + p.t + ')\\approx ' + d4(Fz); return out; }
        out.why = 'Standardise: ' + tx('z=\\frac{x-\\mu}{\\sigma}') + ' counts how many SDs ' + tx('x') + ' is from the mean. Then ' + tx('F(x)=\\Phi(z)') + ':';
        out.math = lines('z=\\frac{' + p.t + '-' + neg(mu.t) + '}{' + sigT + '}' + zrel + zt, 'F(' + p.t + ')=\\Phi(z)' + (zrel === '=' ? '=' : '\\approx ') + '\\Phi(' + zt + ')\\approx ' + d4(Fz));
        return out;
      },
      E: { sym: 'E(' + V + ')=\\mu', num: 'E(' + V + ')=\\mu', v: mu.q || m },
      Var: { sym: '\\mathrm{Var}(' + V + ')=\\sigma^{2}', num: '\\mathrm{Var}(' + V + ')=\\sigma^{2}', v: std ? 1 : st.par === 'var' ? (sp.q || sp.v) : (sp.q ? sp.q.mul(sp.q) : sp.v * sp.v) },
    };
  }
  const BUILD = { uniform: famUniform, triangle: famTriangle, exponential: famExponential, normal: st => famNormal(st, false), std: st => famNormal(st, true) };
  const LABEL = { uniform: 'Uniform U(a, b)', triangle: 'Triangular (you set the corners)', exponential: 'Exponential exp(λ)', normal: 'Normal N(μ, σ²)', std: 'Standard normal Z ~ N(0, 1)' };
  const EVENTS = [{ value: 'between', label: 'c ≤ X ≤ d' }, { value: 'le', label: 'X ≤ d' }, { value: 'ge', label: 'X ≥ c' }];
  const ZCHIPS = ['0.10', '0.05', '0.025', '0.01', '0.005'];
  /** z_α as printed in the lecture slide ("Additive property and percentiles", 22:00–22:30). */
  const ZSLIDE = { '0.1': '1.282', '0.05': '1.645', '0.025': '1.96', '0.01': '2.326', '0.005': '2.576' };

  /* ============================================================ the lab */
  function render(host) {
    const saved = Lab.store.get(KEY, {});
    const st = Object.assign({}, DEF, saved && typeof saved === 'object' ? saved : {});
    // a fresh copy per family: editing the interval must never change DEF
    const savedCd = st.cd && typeof st.cd === 'object' ? st.cd : {};
    st.cd = {};
    FAMS.forEach(f => { const v = savedCd[f]; st.cd[f] = Array.isArray(v) && v.length === 2 && pv(v[0]) && pv(v[1]) ? v.map(String) : DEF.cd[f].slice(); });
    if (!FAMS.includes(st.fam)) st.fam = DEF.fam;
    if (!EVENTS.some(e => e.value === st.ev)) st.ev = DEF.ev;
    if (st.par !== 'var') st.par = 'sd';
    ['ua', 'ub', 'ta', 'tm', 'tb', 'lam', 'mu', 'sp', 'alpha', 'mu2', 'sd2', 'tsum', 'mx', 'mk'].forEach(k => { if (!pv(st[k])) st[k] = DEF[k]; });
    const save = () => Lab.store.set(KEY, st);
    const ctl = {}, P = {};
    let M = null, mKey = '', sim = null, preset = null;

    function model() {
      const key = [st.fam, st.ua, st.ub, st.ta, st.tm, st.tb, st.lam, st.mu, st.sp, st.par].join('|');
      if (key === mKey && M) return M;
      const m = BUILD[st.fam](st);
      if (!m.error) { M = m; mKey = key; sim = null; }
      return m;
    }
    const cdv = () => st.cd[st.fam];

    const { side, main } = K.layout(host, 's7-lab');
    /* ---------------- controls */
    function buildControls() {
      Lab.clear(side);
      side.appendChild(K.group('1 · Your distribution'));
      ctl.fam = K.selectField({ label: 'Family', options: FAMS.map(f => ({ value: f, label: LABEL[f] })), value: st.fam, onChange: v => { st.fam = v; buildParams(); syncInterval(); afterParams(); } });
      ctl.fam.dataset.k = 'fam';
      ctl.params = h('div', { class: 'dp-params' });
      side.append(ctl.fam, ctl.params);
      ctl.presets = K.presets({ label: 'Lecture examples', items: PRESETS, onPick: it => { const keep = st.cd; Object.assign(st, DEF, it.st); st.cd = keep; if (it.st.cd) st.cd[it.st.fam] = it.st.cd.slice(); if (!('mu2' in it.st)) copyY(); preset = { idx: PRESETS.indexOf(it), key: null }; sim = null; buildControls(); afterParams(); } });
      ctl.presets.dataset.k = 'presets';
      side.appendChild(ctl.presets);
      showPreset();
      side.appendChild(K.group('2 · Your interval'));
      ctl.ev = K.selectField({ label: 'Event', options: EVENTS, value: st.ev, onChange: v => { st.ev = v; syncInterval(); draw(); } });
      ctl.ev.dataset.k = 'ev';
      ctl.c = valField({ label: 'Left end ' + tx('c'), value: cdv()[0], min: 0, max: 1, step: 0.01, key: 'c', onChange: (v, s) => { cdv()[0] = s; draw(); } });
      ctl.d = valField({ label: 'Right end ' + tx('d'), value: cdv()[1], min: 0, max: 1, step: 0.01, key: 'd', onChange: (v, s) => { cdv()[1] = s; draw(); } });
      side.append(ctl.ev, ctl.c, ctl.d, K.note('Or drag the violet handles on the PDF.', 'pl-hint'));
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, {}); Object.keys(st).forEach(k => delete st[k]); Object.assign(st, DEF); st.cd = JSON.parse(JSON.stringify(DEF.cd)); buildControls(); afterParams(); }, 'btn ghost sm')));
      buildParams();
      syncInterval();
    }
    function field(o) { return valField(Object.assign({ onChange: (v, s) => { st[o.key] = s; afterParams(); } }, o, { value: st[o.key] })); }
    function buildParams() {
      Lab.clear(ctl.params);
      const f = st.fam;
      if (f === 'uniform') ctl.params.append(field({ key: 'ua', label: 'Left end ' + tx('a'), min: -50, max: 50, step: 0.5 }), field({ key: 'ub', label: 'Right end ' + tx('b'), min: -50, max: 100, step: 0.5 }));
      if (f === 'triangle') ctl.params.append(field({ key: 'ta', label: 'Left corner ' + tx('a'), min: -50, max: 50, step: 0.5 }), field({ key: 'tm', label: 'Peak ' + tx('m') + ' (where the top corner is)', min: -50, max: 100, step: 0.5 }), field({ key: 'tb', label: 'Right corner ' + tx('b'), min: -50, max: 100, step: 0.5 }),
        K.note('The height is not an input: area = 1 fixes it (see below).', 'pl-hint'));
      if (f === 'exponential') ctl.params.append(field({ key: 'lam', label: 'Rate ' + tx('\\lambda') + ' (mean wait ' + tx('1/\\lambda') + ')', min: 0.05, max: 5, step: 0.05, check: v => (v > 0 ? null : 'Use ' + tx('\\lambda>0') + '.'), hint: p => tx('\\text{mean}=\\frac{1}{\\lambda}\\approx ' + d4(1 / p.v)) }));
      if (f === 'normal') {
        const seg = Lab.seg([{ label: 'I type σ (SD)', value: 'sd' }, { label: 'I type σ² (variance)', value: 'var' }], st.par, v => {
          const p = pv(st.sp);
          if (p && v !== st.par) st.sp = v === 'var' ? (p.q ? qEx(p.q.mul(p.q), 'dec') || String(p.v * p.v) : String(p.v * p.v)).replace(/\{,\}/g, '').replace(/\\frac\{(\d+)\}\{(\d+)\}/, '$1/$2') : String(+Math.sqrt(p.v).toPrecision(10));
          st.par = v; buildParams(); afterParams();
        });
        seg.dataset.k = 'par';
        ctl.params.append(field({ key: 'mu', label: 'Mean ' + tx('\\mu'), min: -100, max: 200, step: 0.5 }),
          h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Second number' }), seg),
          field({ key: 'sp', label: st.par === 'var' ? 'Variance ' + tx('\\sigma^2') : 'Standard deviation ' + tx('\\sigma'), min: st.par === 'var' ? 0.25 : 0.5, max: st.par === 'var' ? 400 : 40, step: st.par === 'var' ? 0.25 : 0.1, check: v => (v > 0 ? null : 'Must be positive.'),
            hint: p => (st.par === 'var' ? tx('\\sigma=\\sqrt{' + p.t + '}\\approx ' + d4(Math.sqrt(p.v))) : tx('\\sigma^2=(' + p.t + ')^2' + (p.q ? qEq(p.q.mul(p.q), 'dec') : '\\approx ' + d4(p.v * p.v)))) + '. Notes write ' + tx('N(\\mu,\\sigma^2)') + '; many lecture slides put the SD second.' }));
      }
      if (f === 'std') ctl.params.appendChild(K.note('Nothing to set: ' + tx('\\mu=0') + ' and ' + tx('\\sigma=1') + '. Your interval is in ' + tx('z') + ' units.', 'pl-hint'));
    }
    /** For the X + Y panel: Y = an independent copy of X, and t one SD of X + Y above its mean (as in the lecture's bulbs and rainfall). */
    function copyY() {
      const mu = st.fam === 'std' ? 0 : (pv(st.mu) || pv('0')).v, spv = st.fam === 'std' ? 1 : (pv(st.sp) || pv('1')).v;
      const sd = st.fam !== 'std' && st.par === 'var' ? Math.sqrt(spv) : spv;
      st.mu2 = st.fam === 'std' ? '0' : st.mu; st.sd2 = String(+sd.toPrecision(8));
      st.tsum = String(+(2 * mu + Math.SQRT2 * sd).toPrecision(3));
    }
    /** Keep the lecture source visible after a pick; clear it once the learner changes the distribution. */
    function showPreset() {
      if (!ctl.presets) return;
      ctl.presets.select.value = preset ? String(preset.idx) : '';
      Lab.setHTML(ctl.presets.querySelector('.pl-hint'), preset ? '<b>Lecture example.</b> From: ' + PRESETS[preset.idx].source : '');
    }
    function syncInterval() {
      ctl.c.hidden = st.ev === 'le';
      ctl.d.hidden = st.ev === 'ge';
      ctl.c.set(cdv()[0]); ctl.d.set(cdv()[1]);
      const v = st.fam === 'std' ? 'Z' : 'X';
      Lab.$$('option', ctl.ev.select).forEach((o, i) => { o.textContent = EVENTS[i].label.replace('X', v); });
    }
    function afterParams() {
      const m = model();
      if (m.error) { K.setAnswer(P.answer, { ev: '<span class="cbad">' + m.error + '</span>', big: '', sub: 'The panels below still show your last valid choice.' }); return; }
      if (preset) { if (preset.key == null) preset.key = mKey; else if (preset.key !== mKey) { preset = null; showPreset(); } }
      const step = niceStep((M.hi - M.lo) / 200);
      ctl.c.setRange(M.lo, M.hi, step); ctl.d.setRange(M.lo, M.hi, step);
      draw();
    }

    /* ---------------- panels */
    P.answer = K.answer();
    P.pdf = K.panel('The PDF: probability is area');
    P.cdf = K.panel('The CDF: the same probability as a height difference');
    P.calc = K.panel('How it is computed, with your numbers');
    P.mom = K.panel('Mean and variance');
    P.x1 = K.panel(''); P.x2 = K.panel(''); P.x3 = K.panel('');
    main.append(P.answer, P.pdf, P.cdf, P.calc, P.mom, P.x1, P.x2, P.x3);

    let queued = false;
    function draw() { if (queued) return; queued = true; requestAnimationFrame(() => { queued = false; drawNow(); }); }
    /** The interval as parsed values: lower L and upper U (null = no end), and the probability. */
    function interval() {
      const c = pv(cdv()[0]), d = pv(cdv()[1]);
      let L = st.ev === 'le' ? null : c, U = st.ev === 'ge' ? null : d;
      let swapped = false;
      if (L && U && L.v > U.v) { const t = L; L = U; U = t; swapped = true; }
      const FU = U ? M.F(U) : null, FL = L ? M.F(L) : null;
      const one = (isQ(FU && FU.v) || isQ(FL && FL.v)) ? Q1 : 1;
      const up = FU ? FU.v : one, lo = FL ? FL.v : (isQ(up) ? new Q(0n) : 0);
      const Pv = vSub(up, lo);
      const V = M.V;
      const texE = L && U ? L.t + '\\le ' + V + '\\le ' + U.t : U ? V + '\\le ' + U.t : V + '\\ge ' + L.t;
      return { L, U, FL, FU, P: Pv, tex: texE, swapped };
    }
    function drawNow() {
      if (!M) return;
      save();
      const I = interval();
      drawAnswer(I); drawPdf(I); drawCdf(I); drawCalc(I); drawMoments(); drawExtras(I);
    }

    function drawAnswer(I) {
      const mode = M.mode, V = M.V;
      const pt = I.L || I.U;
      K.setAnswer(P.answer, {
        ev: 'Your model: ' + tx(V + '\\sim ' + M.law) + (M.sdLine ? ' (' + M.sdLine + ')' : '') + '. Your event: ' + tx(I.tex) + '.' + (I.swapped ? ' <span class="small muted">(Your ' + tx('c') + ' was bigger than ' + tx('d') + ', so they are used the other way round.)</span>' : ''),
        big: 'P(' + I.tex + ')' + vEq(I.P, mode),
        sub: '= the violet area under the PDF = ' + (I.L && I.U ? tx('F(' + I.U.t + ')-F(' + I.L.t + ')') : I.U ? tx('F(' + I.U.t + ')') : tx('1-F(' + I.L.t + ')')) + ' on the CDF. ' +
          'One point has no width, so ' + tx('P(' + V + '=' + pt.t + ')=0') + ', and ' + tx('<') + ' or ' + tx('\\le') + ' give the same answer. ' +
          'Mean ' + tx(M.E.num + vEq(M.E.v, mode)) + ', variance ' + tx(M.Var.num + (M.Var.extra ? '' : '') + vEq(M.Var.v, mode)) + '.' +
          '<div class="s7-fine">Decimals are rounded to 4 places (≈); exact fractions are shown when the inputs allow.</div>',
      });
    }

    /* ---------------- the PDF with the draggable interval */
    function drawPdf(I) {
      const key = mKey + '|' + st.ev;
      if (P.pdfObj && P.pdfObj.key === key) { P.pdfObj.update(I); return; }
      const body = P.pdf.body;
      Lab.clear(body);
      const fr = frame({ W: chartW(body), lo: M.lo, hi: M.hi, ymax: M.fmax * 1.12, height: 280, aria: 'probability density curve with the chosen interval shaded', xLabel: M.V === 'Z' ? 'z' : 'x', yLabel: 'f(x)' });
      const s = fr.s;
      const shade = svg('path', { class: 's7-area' });
      s.appendChild(shade);
      s.appendChild(svg('path', { d: fr.path(M.pdf, M.lo, M.hi, M.kinks), class: 's7-curve' }));
      if (M.fam === 'normal' || M.fam === 'std') { s.appendChild(svg('line', { x1: fr.X(M.m), x2: fr.X(M.m), y1: fr.Y(0), y2: fr.Y(M.fmax), class: 's7-mid' })); s.appendChild(svg('text', { x: fr.X(M.m) + 5, y: fr.Y(M.fmax) - 6, class: 's7-tick' }, M.V === 'Z' ? 'μ = 0' : 'μ = ' + M.mu.s)); }
      if (M.fam === 'triangle') { s.appendChild(svg('circle', { cx: fr.X(M.m.v), cy: fr.Y(M.fmax), r: 3.5, class: 's7-dotk' })); s.appendChild(svg('text', { x: fr.X(M.m.v), y: fr.Y(M.fmax) - 8, 'text-anchor': 'middle', class: 's7-tick s7-hl' }, 'h = 2/(b − a) ' + eqText(M.hV))); }
      if (M.fam === 'uniform') s.appendChild(svg('text', { x: fr.X((M.a.v + M.b.v) / 2), y: fr.Y(M.fmax) - 8, 'text-anchor': 'middle', class: 's7-tick s7-hl' }, '1/(b − a) ' + eqText(M.hV)));
      if (M.fam === 'exponential') s.appendChild(svg('text', { x: fr.X(0) + 8, y: fr.Y(M.fmax) + 4, class: 's7-tick s7-hl' }, 'f(0) = λ = ' + M.l.s));
      const label = svg('text', { class: 's7-alab', 'text-anchor': 'middle' });
      s.appendChild(label);
      const H = {};
      ['c', 'd'].forEach(k => {
        const g = svg('g', { class: 's7-handle', tabindex: '0', role: 'slider', 'aria-label': 'interval end ' + k });
        g.append(svg('line', { class: 's7-hline' }), svg('circle', { r: 9, class: 's7-knob' }), svg('text', { class: 's7-hlab', 'text-anchor': 'middle' }));
        s.appendChild(g);
        H[k] = g;
        g.addEventListener('keydown', e => { if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; e.preventDefault(); const p = pv(cdv()[k === 'c' ? 0 : 1]); if (!p) return; moveTo(k, p.v + (e.key === 'ArrowRight' ? 1 : -1) * stepOf()); });
      });
      const stepOf = () => niceStep((M.hi - M.lo) / 200);
      const fmtStep = (x, stp) => { const dp = Math.max(0, -Math.floor(Math.log10(stp) + 1e-9)); return String(+x.toFixed(dp)); };
      function moveTo(k, x) {
        const stp = stepOf();
        x = Math.max(M.lo, Math.min(M.hi, Math.round(x / stp) * stp));
        const other = pv(cdv()[k === 'c' ? 1 : 0]);
        if (st.ev === 'between' && other) { if (k === 'c' && x > other.v) x = other.v; if (k === 'd' && x < other.v) x = other.v; }
        const s2 = fmtStep(x, stp);
        cdv()[k === 'c' ? 0 : 1] = s2;
        (k === 'c' ? ctl.c : ctl.d).set(s2);
        draw();
      }
      let dragging = null;
      s.addEventListener('pointerdown', e => {
        const x = fr.toX(e);
        const act = ['c', 'd'].filter(k => (k === 'c' ? st.ev !== 'le' : st.ev !== 'ge'));
        const pos = k => { const p = pv(cdv()[k === 'c' ? 0 : 1]); return p ? p.v : 0; };
        dragging = act.reduce((best, k) => (best == null || Math.abs(pos(k) - x) < Math.abs(pos(best) - x) ? k : best), null);
        if (!dragging) return;
        try { s.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
        moveTo(dragging, x);
      });
      s.addEventListener('pointermove', e => { if (dragging) moveTo(dragging, fr.toX(e)); });
      const stop = () => { dragging = null; };
      s.addEventListener('pointerup', stop); s.addEventListener('pointercancel', stop);
      body.appendChild(wrapSvg(s, 's7-drag'));
      const note = h('div', { class: 'small muted' });
      body.appendChild(note);
      function update(I2) {
        const a = I2.L ? Math.max(M.lo, I2.L.v) : M.lo, b = I2.U ? Math.min(M.hi, I2.U.v) : M.hi;
        shade.setAttribute('d', fr.area(M.pdf, a, b, M.kinks));
        ['c', 'd'].forEach(k => {
          const on = k === 'c' ? st.ev !== 'le' : st.ev !== 'ge';
          const g = H[k];
          g.style.display = on ? '' : 'none';
          if (!on) return;
          const p = pv(cdv()[k === 'c' ? 0 : 1]);
          const x = Math.max(M.lo, Math.min(M.hi, p ? p.v : M.lo)), X = fr.X(x);
          const [ln, kn, tl] = g.childNodes;
          ln.setAttribute('x1', X); ln.setAttribute('x2', X); ln.setAttribute('y1', fr.Y(0)); ln.setAttribute('y2', fr.pt + 14);
          kn.setAttribute('cx', X); kn.setAttribute('cy', fr.Y(0));
          tl.setAttribute('x', X); tl.setAttribute('y', fr.pt + 9); tl.textContent = k + ' = ' + (p ? p.s : '?');
          g.setAttribute('aria-valuenow', p ? p.v : '');
        });
        const mid = (a + b) / 2;
        label.setAttribute('x', fr.X(mid)); label.setAttribute('y', fr.Y(Math.max(M.pdf(mid) * 0.45, M.fmax * 0.08)));
        label.textContent = 'P ' + eqText(I2.P);
        const off = [];
        if (I2.L && I2.L.v < M.lo) off.push(tx('c=' + I2.L.t) + ' is left of the picture');
        if (I2.U && I2.U.v > M.hi) off.push(tx('d=' + I2.U.t) + ' is right of the picture');
        Lab.setHTML(note, 'Violet area = ' + tx('P(' + I2.tex + ')') + '. ' + M.heightNote + '.' + (off.length ? ' ' + off.join('; ') + ' (the shading stops at the edge, the number does not).' : ''));
        P.pdf.sub('The curve is the PDF ' + tx('f(x)') + '; the total area under it is 1. Drag the violet handles (or use the arrow keys on them, or type ' + tx('c') + ' and ' + tx('d') + ').');
      }
      P.pdfObj = { key, update };
      update(I);
    }

    /* ---------------- the CDF with F(d) − F(c) */
    function drawCdf(I) {
      const body = P.cdf.body;
      Lab.clear(body);
      const fr = frame({ W: chartW(body), lo: M.lo, hi: M.hi, ymax: 1, height: 250, aria: 'cumulative distribution curve', xLabel: M.V === 'Z' ? 'z' : 'x', yLabel: 'F(x)' });
      const s = fr.s;
      s.appendChild(svg('path', { d: fr.path(M.cdf, M.lo, M.hi, M.kinks), class: 's7-curve' }));
      const yU = I.FU ? vNum(I.FU.v) : 1, yL = I.FL ? vNum(I.FL.v) : 0;
      const close = I.FU && I.FL && fr.Y(yL) - fr.Y(yU) < 16;
      const mark = (p, Fv, cls) => {
        const x = Math.max(M.lo, Math.min(M.hi, p.v)), y = vNum(Fv);
        s.appendChild(svg('line', { x1: fr.pl, x2: fr.X(x), y1: fr.Y(y), y2: fr.Y(y), class: 's7-guide' }));
        s.appendChild(svg('line', { x1: fr.X(x), x2: fr.X(x), y1: fr.Y(0), y2: fr.Y(y), class: 's7-guide' }));
        s.appendChild(svg('circle', { cx: fr.X(x), cy: fr.Y(y), r: 5, class: 's7-dotp' }));
        // the label sits on its dashed line, next to the y axis (away from the curve)
        s.appendChild(svg('text', { x: fr.pl + 6, y: fr.Y(y) + (cls === 'lo' && close ? 15 : -6), class: 's7-plab s7-small' }, 'F(' + p.s + ') ' + eqText(Fv)));
      };
      if (I.FL) mark(I.L, I.FL.v, 'lo');
      if (I.FU) mark(I.U, I.FU.v, 'up');
      const bx = fr.W - fr.pr - 10;
      s.appendChild(svg('line', { x1: bx, x2: bx, y1: fr.Y(yL), y2: fr.Y(yU), class: 's7-bracket' }));
      s.appendChild(svg('line', { x1: bx - 6, x2: bx + 4, y1: fr.Y(yL), y2: fr.Y(yL), class: 's7-bracket' }));
      s.appendChild(svg('line', { x1: bx - 6, x2: bx + 4, y1: fr.Y(yU), y2: fr.Y(yU), class: 's7-bracket' }));
      s.appendChild(svg('text', { x: bx - 10, y: (fr.Y(yL) + fr.Y(yU)) / 2 + 4, 'text-anchor': 'end', class: 's7-plab' }, 'height ' + eqText(I.P)));
      body.appendChild(wrapSvg(s));
      P.cdf.sub(tx('F(x)=P(' + M.V + '\\le x)') + ' = the area to the left of ' + tx('x') + '. The violet bar on the right is the gap between the two heights — it is the same number as the violet area above.');
      body.appendChild(K.note(I.L && I.U ? tx('P(' + I.tex + ')=F(' + I.U.t + ')-F(' + I.L.t + ')\\approx ' + d4(yU) + '-' + d4(yL) + '\\approx ' + d4(vNum(I.P))) : I.U ? tx('P(' + I.tex + ')=F(' + I.U.t + ')\\approx ' + d4(yU)) : tx('P(' + I.tex + ')=1-F(' + I.L.t + ')\\approx 1-' + d4(yL) + '\\approx ' + d4(vNum(I.P))), 'ws-readout'));
    }

    /* ---------------- the computation */
    function zTable(z) {
      const za = Math.abs(z), z2 = Math.round(za * 100) / 100;
      if (z2 > 3.49) return K.note(tx('|z|\\approx ' + d4(za)) + ' is beyond the usual table, which stops at 3.49. There ' + tx('\\Phi') + ' is within 0.0003 of ' + (z > 0 ? '1' : '0') + '.', 'small muted');
      const row = Math.floor(z2 * 10 + 1e-9) / 10, col = Math.round((z2 - row) * 100);
      const rows = [row - 0.1, row, row + 0.1].filter(r => r > -1e-9 && r < 3.45);
      const t = h('table', { class: 'tbl s7-ztab' });
      t.appendChild(h('thead', {}, h('tr', {}, [h('th', { text: 'z' })].concat(range(0, 9).map(k => h('th', { text: '.0' + k, class: k === col ? 's7-zc' : null }))))));
      const tb = h('tbody');
      rows.forEach(r => {
        const tr = h('tr', { class: Math.abs(r - row) < 1e-9 ? 's7-zr' : null }, h('th', { text: r.toFixed(1) }));
        range(0, 9).forEach(k => tr.appendChild(h('td', { text: Phi(r + k / 100).toFixed(4), class: Math.abs(r - row) < 1e-9 && k === col ? 's7-zhit' : k === col ? 's7-zc' : null })));
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      const tv = Phi(z2);
      const msg = 'Table lookup (rows: ' + tx('z') + ' to one decimal; columns: the second decimal). Row ' + row.toFixed(1) + ', column .0' + col + ': ' + tx('\\Phi(' + z2.toFixed(2) + ')\\approx ' + tv.toFixed(4)) + '.' +
        (z < 0 ? ' The table has positive ' + tx('z') + ' only, so use symmetry: ' + tx('\\Phi(-' + z2.toFixed(2) + ')=1-\\Phi(' + z2.toFixed(2) + ')\\approx 1-' + tv.toFixed(4) + '=' + (1 - tv).toFixed(4)) + '.' : '') +
        (Math.abs(za - z2) > 1e-9 ? ' The table rounds ' + tx('z') + ' to 2 decimals; the exact ' + tx('\\Phi(' + d4(z) + ')\\approx ' + Phi(z).toFixed(4)) + '.' : '');
      return h('div', { class: 's7-zwrap' }, h('div', { class: 'tbl-wrap s7-tblwrap' }, t), K.note(msg, 'small muted'));
    }
    function drawCalc(I) {
      const body = P.calc.body;
      Lab.clear(body);
      const mode = M.mode, V = M.V, steps = [];
      if (M.fam === 'triangle') steps.push({ html: M.intro, math: M.heightMath, note: 'Here ' + tx('b-a=' + M.b.t + '-' + neg(M.a.t) + vEq(vSub(val(M.b), val(M.a)), mode)) + '. So the corners are ' + tx('(' + M.a.t + ',0)') + ', ' + tx('(' + M.m.t + ',' + vT(M.hV, mode) + ')') + ', ' + tx('(' + M.b.t + ',0)') + '.' });
      else steps.push({ html: M.intro });
      steps.push({ html: 'The rule (Week 12): ' + tx('P(c\\le ' + V + '\\le d)=\\int_c^d f(x)\\,dx=F(d)-F(c)') + ', where ' + tx('F(x)=P(' + V + '\\le x)') + ' is the area to the left of ' + tx('x') + '. Your event: ' + tx(I.tex) + '.' });
      const addF = (p, F, which) => {
        const s = { html: '<b>' + tx('F(' + p.t + ')') + '</b> (' + which + '): ' + F.why };
        if (F.math) s.math = F.math;
        if ((M.fam === 'normal' || M.fam === 'std') && F.z != null) s.block = zTable(F.z);
        steps.push(s);
      };
      if (I.U) addF(I.U, I.FU, I.L ? 'right end' : 'your ' + tx('d'));
      if (I.L) { if (I.U && I.FL.z != null && !M.std) I.FL.why = 'The same steps:'; addF(I.L, I.FL, I.U ? 'left end' : 'your ' + tx('c')); }
      const r = vRel(I.P, mode);
      if (I.L && I.U) steps.push({ html: 'Subtract' + (isQ(I.P) ? '' : ' (from the unrounded values)') + ':', math: 'P(' + I.tex + ')=F(' + I.U.t + ')-F(' + I.L.t + ')' + (isQ(I.P) ? '=' + vT(I.FU.v, mode) + '-' + neg(vT(I.FL.v, mode)) : '\\approx ' + d4(vNum(I.FU.v)) + '-' + d4(vNum(I.FL.v))) + vEq(I.P, mode) });
      else if (I.L) steps.push({ html: 'The area to the right is all the area (1) minus the area to the left:', math: 'P(' + I.tex + ')=1-F(' + I.L.t + ')' + (isQ(I.P) ? '=1-' + neg(vT(I.FL.v, mode)) : '\\approx 1-' + d4(vNum(I.FL.v))) + vEq(I.P, mode) });
      else steps.push({ html: 'It is the CDF itself:', math: 'P(' + I.tex + ')=F(' + I.U.t + ')' + vEq(I.P, mode) });
      if (M.fam === 'uniform' && I.L && I.U) {
        const lo = I.L.v < M.a.v ? M.a : I.L, hi = I.U.v > M.b.v ? M.b : I.U, w = vSub(val(hi), val(lo));
        if (vNum(w) > 0) steps.push({ html: 'Check with "width × height": only the part of the interval inside ' + tx('[a,b]') + ' counts, from ' + tx(lo.t) + ' to ' + tx(hi.t) + '.', math: '(' + hi.t + '-' + neg(lo.t) + ')\\times\\frac{1}{' + vT(vSub(val(M.b), val(M.a)), mode) + '}' + r + vT(I.P, mode) });
      }
      if (M.fam === 'exponential' && I.L && I.U && I.L.v >= 0) steps.push({ html: 'Shortcut: ' + tx('F(d)-F(c)=(1-e^{-\\lambda d})-(1-e^{-\\lambda c})=e^{-\\lambda c}-e^{-\\lambda d}') + ':', math: 'e^{-' + d6(M.l.v * I.L.v) + '}-e^{-' + d6(M.l.v * I.U.v) + '}\\approx ' + d6(Math.exp(-M.l.v * I.L.v)) + '-' + d6(Math.exp(-M.l.v * I.U.v)) + '\\approx ' + d4(vNum(I.P)) });
      const pt = I.L || I.U;
      steps.push({ html: '<b>One point has probability 0.</b> A single point has width 0, so its area is 0: ' + tx('P(' + V + '=' + pt.t + ')=0') + '. That is why ' + tx('P(' + I.tex + ')') + ' is the same with ' + tx('<') + ' instead of ' + tx('\\le') + '.' });
      if (M.fam === 'normal' || M.fam === 'std') steps.push({ html: 'How ' + tx('\\Phi') + ' is computed here: it has no simple formula, so the lab adds up its series (about 15 correct digits) and shows 4 decimals. A printed table gives the same 4 decimals after rounding ' + tx('z') + ' to 2 places.' });
      body.appendChild(K.steps(steps));
    }

    /* ---------------- mean and variance */
    function drawMoments() {
      const body = P.mom.body;
      Lab.clear(body);
      const mode = M.mode, V = M.V;
      const sup = M.fam === 'exponential' ? [0, 60 / M.l.v] : M.fam === 'normal' || M.fam === 'std' ? [M.m - 12 * M.s, M.m + 12 * M.s] : M.support;
      const e1 = integrate(x => x * M.pdf(x), sup[0], sup[1], M.kinks, 4000), e2 = integrate(x => x * x * M.pdf(x), sup[0], sup[1], M.kinks, 4000), tot = integrate(M.pdf, sup[0], sup[1], M.kinks, 4000);
      const vn = e2 - e1 * e1;
      const ok = Math.abs(e1 - vNum(M.E.v)) < 1e-6 * Math.max(1, Math.abs(vNum(M.E.v))) && Math.abs(vn - vNum(M.Var.v)) < 1e-6 * Math.max(1, vNum(M.Var.v));
      const varLines = M.fam === 'triangle'
        ? [M.Var.num, '\\phantom{\\mathrm{Var}(X)}=\\frac{' + [M.a.t, M.m.t, M.b.t].map(t => '(' + t + ')^2').join('+') + '-' + neg(M.a.t) + '\\cdot ' + neg(M.m.t) + '-' + neg(M.a.t) + '\\cdot ' + neg(M.b.t) + '-' + neg(M.m.t) + '\\cdot ' + neg(M.b.t) + '}{18}' + vEq(M.Var.v, mode)]
        : [(M.fam === 'normal' ? M.Var.num + '=' + (st.par === 'var' ? M.varT : '(' + M.sigT + ')^{2}') : M.Var.num) + vEq(M.Var.v, mode)];
      const steps = [
        { html: 'By formula' + (M.E.extra ? ' (for a triangle these two are not in the course notes; they come from ' + tx('\\int x f(x)\\,dx') + ' — the check below confirms them)' : ' (Week 12 notes)') + ', symbols then your numbers:', math: lines(M.E.num + vEq(M.E.v, mode), ...varLines), note: 'Standard deviation ' + tx('\\mathrm{SD}(' + V + ')=\\sqrt{\\mathrm{Var}(' + V + ')}' + sqrtEq(M.Var.v)) + '.' },
        { html: 'Check by adding up thin strips (Simpson’s rule, 4000 strips' + (M.fam === 'normal' || M.fam === 'std' ? ' over ' + tx('\\mu\\pm 12\\sigma') : M.fam === 'exponential' ? ' over ' + tx('0\\le x\\le 60/\\lambda') : ' over ' + tx('[a,b]')) + '):',
          math: lines('\\int f(x)\\,dx\\approx ' + d4(tot), 'E(' + V + ')=\\int x f(x)\\,dx\\approx ' + d4(e1), '\\mathrm{Var}(' + V + ')=\\int x^{2}f(x)\\,dx-[E(' + V + ')]^{2}\\approx ' + d4(e2) + '-(' + d4(e1) + ')^{2}\\approx ' + d4(vn)),
          note: ok ? '<span class="cgood">✓ Formula and strips agree.</span>' : '<span class="cbad">They differ — please report this.</span>' },
      ];
      body.appendChild(K.steps(steps));
    }

    /* ---------------- extras: normal bands, percentiles, X + Y, memoryless */
    function drawExtras(I) {
      [P.x1, P.x2, P.x3].forEach(p => { p.hidden = true; });
      const show = (pn, title, sub, fill) => { pn.hidden = false; Lab.setHTML(pn.querySelector('h3'), title); pn.sub(sub || ''); Lab.clear(pn.body); fill(pn.body); };
      if (M.fam === 'normal' || M.fam === 'std') {
        show(P.x1, 'The 68–95–99.7 rule on your curve', 'Course notes, Week 12: 34.13%, 13.59% and 2.15% on each side, so about 68%, 95% and 99.7% within 1, 2 and 3 SDs. Your ' + tx('\\mu=' + M.muT) + ' and ' + tx('\\sigma=' + M.sigT) + ' put the cut points where shown.', bands);
        show(P.x2, 'Percentiles: find ' + tx('z_\\alpha') + ' and ' + tx('x=\\mu+\\sigma z_\\alpha'), 'Week 12: ' + tx('P(Z>z_\\alpha)=\\alpha') + ' — the upper-tail cut-off. ' + tx('z_\\alpha') + ' is the ' + tx('100(1-\\alpha)') + 'th percentile of ' + tx('N(0,1)') + '.', percentile);
        show(P.x3, 'Adding two independent normals', 'Week 12: if ' + tx('X') + ' and ' + tx('Y') + ' are independent normals, ' + tx('X+Y\\sim N(\\mu_X+\\mu_Y,\\ \\sigma_X^2+\\sigma_Y^2)') + '. Means add; variances add; SDs do <b>not</b> add.', sumPanel);
      } else if (M.fam === 'exponential') {
        show(P.x1, 'The exponential has no memory', 'Course notes, Week 12 (Practice 12): ' + tx('P(X>x+k\\mid X>k)=P(X>x)') + '. Having waited ' + tx('k') + ' already does not change the chance of waiting ' + tx('x') + ' more.', memoryless);
      } else if (M.fam === 'uniform') {
        show(P.x1, 'The standard uniform', 'Week 12: ' + tx('U(0,1)') + ' has ' + tx('f=1') + ' on ' + tx('(0,1)') + ', ' + tx('F(x)=x') + ', ' + tx('E=\\tfrac12') + ' and ' + tx('\\mathrm{Var}=\\tfrac1{12}') + '.', b => {
          b.appendChild(K.note('For ' + tx('U(0,1)') + ' a probability is just a length: ' + tx('P(0.3\\le X\\le 0.9)=0.9-0.3=0.6') + '. Your ' + tx(M.law) + ' works the same way once lengths are divided by ' + tx('b-a=' + vT(vSub(val(M.b), val(M.a)), M.mode)) + '.', 'small'));
          b.appendChild(h('div', { class: 'btn-row' }, Lab.button('Use U(0, 1)', () => { st.ua = '0'; st.ub = '1'; st.cd.uniform = ['0.3', '0.9']; buildParams(); syncInterval(); afterParams(); }, 'btn sm')));
        });
      }
    }
    function bands(b) {
      const m = M.m, s = M.s, V = M.V;
      const fr = frame({ W: chartW(b), lo: m - 4 * s, hi: m + 4 * s, ymax: M.fmax * 1.42, height: 300, pt: 22, aria: 'normal curve with the 1, 2 and 3 SD bands', yticks: false,
        xticks: [-3, -2, -1, 0, 1, 2, 3].map(k => m + k * s), xfmt: t => { const k = Math.round((t - m) / s); return (k === 0 ? 'μ' : 'μ' + (k > 0 ? '+' : '−') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + 'σ'); } });
      const sv = fr.s;
      [[0, 1, 's7-b1'], [1, 2, 's7-b2'], [2, 3, 's7-b3']].forEach(([i, j, cls]) => {
        sv.appendChild(svg('path', { d: fr.area(M.pdf, m + i * s, m + j * s), class: 's7-band ' + cls }));
        sv.appendChild(svg('path', { d: fr.area(M.pdf, m - j * s, m - i * s), class: 's7-band ' + cls }));
      });
      sv.appendChild(svg('path', { d: fr.path(M.pdf, m - 4 * s, m + 4 * s, []), class: 's7-curve' }));
      const pct = ['34.13%', '13.59%', '2.15%'];
      [0.5, 1.5, 2.5].forEach((k, i) => { [1, -1].forEach(sg => sv.appendChild(svg('text', { x: fr.X(m + sg * k * s), y: i === 2 ? fr.Y(M.fmax * 0.16) : fr.Y(M.pdf(m + k * s) * 0.42), 'text-anchor': 'middle', class: 's7-blab' + (i === 2 ? ' small' : '') }, pct[i]))); });
      const top = M.fmax * 1.06;
      [[1, '68%'], [2, '95%'], [3, '99.7%']].forEach(([k, t], i) => {
        const y = fr.Y(top + i * M.fmax * 0.12);
        sv.appendChild(svg('line', { x1: fr.X(m - k * s), x2: fr.X(m + k * s), y1: y, y2: y, class: 's7-bracket' }));
        [m - k * s, m + k * s].forEach(x => sv.appendChild(svg('line', { x1: fr.X(x), x2: fr.X(x), y1: y - 4, y2: y + 4, class: 's7-bracket' })));
        sv.appendChild(svg('text', { x: fr.X(m), y: y - 5, 'text-anchor': 'middle', class: 's7-tick s7-hl' }, t + ' within ' + k + 'σ'));
      });
      [-3, -2, -1, 0, 1, 2, 3].forEach(k => sv.appendChild(svg('text', { x: fr.X(m + k * s), y: fr.Y(0) + 32, 'text-anchor': 'middle', class: 's7-tick s7-hl' }, (Number.isInteger(+(m + k * s).toFixed(10)) ? String(+(m + k * s).toFixed(10)) : trimZ((m + k * s).toFixed(4))))));
      b.appendChild(wrapSvg(sv));
      const cut = k => m + k * s;
      b.appendChild(K.note('Cut points with your numbers: ' + [-3, -2, -1, 0, 1, 2, 3].map(k => tx((k === 0 ? '\\mu' : '\\mu' + (k > 0 ? '+' : '-') + (Math.abs(k) === 1 ? '' : Math.abs(k)) + '\\sigma') + '=' + d4Text(cut(k)).replace(/^-/, '-'))).join(', ') + (V === 'X' ? ' (from ' + tx('\\mu=' + M.muT) + ', ' + tx('\\sigma=' + M.sigT) + ').' : '.'), 'small'));
      const one = [Phi(1) - Phi(0), Phi(2) - Phi(1), Phi(3) - Phi(2), 1 - Phi(3)];
      const rows = [
        [tx('\\mu') + ' to ' + tx('\\mu+\\sigma'), '34.13%', '0.34', tx('\\Phi(1)-\\Phi(0)\\approx ' + d4(one[0]))],
        [tx('\\mu+\\sigma') + ' to ' + tx('\\mu+2\\sigma'), '13.59%', '0.135', tx('\\Phi(2)-\\Phi(1)\\approx ' + d4(one[1]))],
        [tx('\\mu+2\\sigma') + ' to ' + tx('\\mu+3\\sigma'), '2.15%', '0.024', tx('\\Phi(3)-\\Phi(2)\\approx ' + d4(one[2]))],
        ['beyond ' + tx('\\mu+3\\sigma'), '0.13%', '≈ 0', tx('1-\\Phi(3)\\approx ' + d4(one[3]))],
        ['within ' + tx('\\mu\\pm\\sigma'), '≈ 68%', '0.68', tx('\\Phi(1)-\\Phi(-1)\\approx ' + d4(Phi(1) - Phi(-1)))],
        ['within ' + tx('\\mu\\pm 2\\sigma'), '≈ 95%', '0.95', tx('\\Phi(2)-\\Phi(-2)\\approx ' + d4(Phi(2) - Phi(-2)))],
        ['within ' + tx('\\mu\\pm 3\\sigma'), '≈ 99.7%', '0.997', tx('\\Phi(3)-\\Phi(-3)\\approx ' + d4(Phi(3) - Phi(-3)))],
      ];
      b.appendChild(table(['band (and its mirror on the left)', 'course notes', 'lecture figure', 'computed here'], rows));
      b.appendChild(K.note('The three sources agree once rounded. One exact difference: ' + tx('\\Phi(3)-\\Phi(2)\\approx 0.0214') + ' (2.14%), while the notes say 2.15%. With 2.15 the half-curve pieces add to exactly ' + tx('34.13+13.59+2.15+0.13=50.00') + '; with 2.14 they add to 49.99. The lecture figure (“Normal distribution”, 15:30–22:00) uses 0.34, 0.135 and 0.024 per side.', 'small muted'));
    }
    function percentile(b) {
      const box = h('div', { class: 's7-stack' });
      const f = valField({ label: 'Upper-tail area ' + tx('\\alpha') + ' (0.05, 5% or 1/20)', value: st.alpha, min: 0.001, max: 0.5, step: 0.001, key: 'alpha',
        check: v => (v > 0 && v < 1 ? null : 'Use a number between 0 and 1, like 0.05.'), onChange: (v, s) => { st.alpha = s; save(); fill(); } });
      const chips = h('div', { class: 'pl-chips' });
      ZCHIPS.forEach(a => chips.appendChild(Lab.button(tx('\\alpha=' + a), () => { st.alpha = a; f.set(a); save(); fill(); }, 'btn xs')));
      b.append(f, chips, box);
      function fill() {
        Lab.clear(box);
        const ap = pv(st.alpha);
        if (!ap || !(ap.v > 0 && ap.v < 1)) return;
        const a = ap.v, z = -PhiInv(a), m = M.m, s = M.s, x = m + s * z;
        const zl = Math.floor(z * 100 + 1e-9) / 100, zh = zl + 0.01;
        const slide = ZSLIDE[String(+a)];
        const fr = frame({ W: chartW(box), lo: m - 4 * s, hi: m + 4 * s, ymax: M.fmax * 1.12, height: 240, aria: 'normal curve with the upper tail shaded', xLabel: M.V === 'Z' ? 'z' : 'x' });
        fr.s.appendChild(svg('path', { d: fr.area(M.pdf, Math.min(x, m + 4 * s), m + 4 * s), class: 's7-area' }));
        fr.s.appendChild(svg('path', { d: fr.path(M.pdf, m - 4 * s, m + 4 * s, []), class: 's7-curve' }));
        if (x <= m + 4 * s) {
          fr.s.appendChild(svg('line', { x1: fr.X(x), x2: fr.X(x), y1: fr.Y(0), y2: fr.Y(M.fmax * 0.95), class: 's7-hline' }));
          fr.s.appendChild(svg('text', { x: fr.X(x), y: fr.Y(M.fmax * 0.95) - 6, 'text-anchor': 'middle', class: 's7-tick s7-hl' }, (M.V === 'Z' ? 'z' : 'x') + ' ≈ ' + d4Text(x)));
          fr.s.appendChild(svg('text', { x: Math.min(fr.X(x) + 34, fr.W - fr.pr - 20), y: fr.Y(M.fmax * 0.18), 'text-anchor': 'middle', class: 's7-plab' }, 'area α = ' + ap.s));
        }
        box.appendChild(wrapSvg(fr.s));
        const steps = [
          { html: 'Your ' + tx('\\alpha=' + ap.t) + '. ' + tx('P(Z>z_\\alpha)=\\alpha') + ' means the area to the left is ' + tx('1-\\alpha') + ':', math: '\\Phi(z_{\\alpha})=1-\\alpha=1-' + ap.t + (ap.q ? qEq(Q1.sub(ap.q), 'dec') : '\\approx ' + d4(1 - a)) },
          { html: 'Solve ' + tx('\\Phi(z)=' + d4Text(1 - a)) + ' numerically (a good first guess, then Newton’s method using ' + tx('\\Phi') + ' itself):', math: 'z_{' + ap.t + '}\\approx ' + d4(z), note: 'Check: ' + tx('\\Phi(' + d4(z) + ')\\approx ' + Phi(+z.toFixed(4)).toFixed(4)) + '. In a printed table, ' + tx('\\Phi(' + zl.toFixed(2) + ')\\approx ' + Phi(zl).toFixed(4)) + ' and ' + tx('\\Phi(' + zh.toFixed(2) + ')\\approx ' + Phi(zh).toFixed(4)) + ' are the two entries around ' + d4Text(1 - a) + '.' + (slide ? ' The lecture slide value is ' + tx('z_{' + ap.t + '}=' + slide) + ' (“Additive property and percentiles”, 22:00).' : '') },
        ];
        if (M.V === 'X') steps.push({ html: 'For your ' + tx('X') + ': the same percentile sits ' + tx('z_\\alpha') + ' SDs above the mean.', math: 'x=\\mu+\\sigma z_{\\alpha}=' + M.muT + '+' + M.sigT + '\\times ' + d4(z) + '\\approx ' + d4(x), note: 'So ' + tx('P(X>' + d4(x) + ')\\approx ' + ap.t) + ' and ' + tx('P(X\\le ' + d4(x) + ')\\approx ' + d4Text(1 - a)) + ': ' + tx(d4(x)) + ' is the ' + tx(d4Text(100 * (1 - a)).replace(/\.?0+$/, '')) + 'th percentile of ' + tx('X') + '.' });
        steps.push({ html: 'The lower tail, by symmetry: ' + tx('P(' + M.V + '<\\mu-\\sigma z_\\alpha)=\\alpha') + (M.V === 'X' ? ', here ' + tx(M.muT + '-' + M.sigT + '\\times ' + d4(z) + '\\approx ' + d4(m - s * z)) : ', here ' + tx('-' + d4(z))) + '.' });
        box.appendChild(K.steps(steps));
      }
      fill();
    }
    function sumPanel(b) {
      const box = h('div', { class: 's7-stack' });
      const fx = (k, label, mn, mx, stp, chk) => valField({ label, value: st[k], min: mn, max: mx, step: stp, key: k, check: chk, onChange: (v, s) => { st[k] = s; save(); sim = null; fill(); } });
      const grid = h('div', { class: 's7-grid2' }, fx('mu2', 'Mean of ' + tx('Y') + ': ' + tx('\\mu_Y'), -100, 200, 0.5), fx('sd2', 'SD of ' + tx('Y') + ': ' + tx('\\sigma_Y'), 0.1, 40, 0.1, v => (v > 0 ? null : 'Must be positive.')), fx('tsum', 'A value ' + tx('t') + ' for ' + tx('P(X+Y>t)'), -200, 400, 0.5));
      const btns = h('div', { class: 'btn-row' });
      [[1000, 'Simulate 1,000 pairs'], [10000, 'Simulate 10,000 pairs']].forEach(([n, l], k) => btns.appendChild(Lab.button(l, () => { runSum(n); fill(); }, k ? 'btn primary sm' : 'btn sm')));
      btns.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => { sim = null; fill(); }, 'btn ghost sm'));
      b.append(grid, box, btns);
      function fill() {
        Lab.clear(box);
        const m2 = pv(st.mu2), s2 = pv(st.sd2), tt = pv(st.tsum);
        if (!m2 || !s2 || !(s2.v > 0) || !tt) return;
        const m1 = M.m, s1 = M.s, mS = m1 + m2.v, vS = s1 * s1 + s2.v * s2.v, sS = Math.sqrt(vS), wrong = s1 + s2.v;
        const xn = M.V === 'Z' ? 'Z' : 'X';
        const vT2 = (p) => (p.q ? qEx(p.q.mul(p.q), 'dec') || d6(p.v * p.v) : d6(p.v * p.v));
        const var1 = M.std ? '1' : M.varT, var2 = vT2(s2);
        const z = (tt.v - mS) / sS, pGt = 1 - Phi(z);
        const steps = [
          { html: 'Your two variables: ' + tx(xn + '\\sim N(' + M.muT + ',\\,' + var1 + ')') + ' (the distribution above) and ' + tx('Y\\sim N(' + m2.t + ',\\,' + var2 + ')') + ', with ' + tx('\\sigma_Y=' + s2.t) + '. They must be independent for this rule.' },
          { html: 'Add the means:', math: '\\mu_{' + xn + '+Y}=' + M.muT + '+' + neg(m2.t) + (Number.isInteger(mS) ? '=' : '\\approx ') + d6(mS) },
          { html: 'Add the variances (not the SDs):', math: lines('\\sigma^2_{' + xn + '+Y}=\\sigma_' + xn + '^2+\\sigma_Y^2=' + var1 + '+' + var2 + (Number.isInteger(vS) ? '=' : '\\approx ') + d6(vS), '\\sigma_{' + xn + '+Y}=\\sqrt{' + d6(vS) + '}\\approx ' + d4(sS)),
            note: 'Adding the SDs would give ' + tx(M.sigT + '+' + s2.t + (Number.isInteger(wrong) ? '=' : '\\approx ') + d6(wrong)) + ' — too big (dashed curve below). That is a common mistake.' },
          { html: 'So ' + tx(xn + '+Y\\sim N(' + d6(mS) + ',\\,' + d6(vS) + ')') + '. With your ' + tx('t=' + tt.t) + ':', math: lines('z=\\frac{t-\\mu_{' + xn + '+Y}}{\\sigma_{' + xn + '+Y}}=\\frac{' + tt.t + '-' + neg(d6(mS)) + '}{' + d4(sS) + '}\\approx ' + d4(z), 'P(' + xn + '+Y>' + tt.t + ')=1-\\Phi(z)\\approx 1-\\Phi(' + d4(z) + ')\\approx ' + d4(pGt)) },
        ];
        box.appendChild(K.steps(steps));
        // histogram of simulated sums with the theory curve
        const lo = mS - 4.2 * Math.max(sS, wrong * 0.75), hi = mS + 4.2 * Math.max(sS, wrong * 0.75);
        const fT = x => phi((x - mS) / sS) / sS, fW = x => phi((x - mS) / wrong) / wrong;
        const fr = frame({ W: chartW(box), lo, hi, ymax: fT(mS) * 1.15, height: 250, aria: 'histogram of simulated sums with the normal curve', xLabel: 'x + y' });
        if (sim && sim.n) {
          const nb = 40, w = (hi - lo) / nb, cnt = new Array(nb).fill(0);
          sim.vals.forEach(v => { const k = Math.floor((v - lo) / w); if (k >= 0 && k < nb) cnt[k]++; });
          cnt.forEach((c, k) => { if (!c) return; const dens = c / (sim.n * w); fr.s.appendChild(svg('rect', { x: fr.X(lo + k * w) + 0.5, y: fr.Y(dens), width: Math.max(1, fr.X(lo + (k + 1) * w) - fr.X(lo + k * w) - 1), height: Math.max(0, fr.Y(0) - fr.Y(dens)), class: 's7-hist' })); });
        }
        fr.s.appendChild(svg('path', { d: fr.path(fW, lo, hi, []), class: 's7-curve s7-wrong' }));
        fr.s.appendChild(svg('path', { d: fr.path(fT, lo, hi, []), class: 's7-curve s7-sum' }));
        box.appendChild(wrapSvg(fr.s));
        box.appendChild(h('div', { class: 's7-legend' },
          h('span', { class: 's7-key' }, h('i', { class: 's7-sc' }), h('span', { html: tx('N(' + d6(mS) + ',\\,' + d6(vS) + ')') + ' — the rule' })),
          h('span', { class: 's7-key' }, h('i', { class: 's7-kdash' }), h('span', { html: 'SD ' + tx(d6(wrong)) + ' — adding SDs (wrong)' })),
          h('span', { class: 's7-key' }, h('i', { class: 's7-sd' }), h('span', { text: 'your simulated sums (bar height = fraction ÷ bar width)' }))));
        if (sim && sim.n) {
          const mean = sim.s1 / sim.n, vr = sim.s2 / sim.n - mean * mean, gt = sim.vals.filter(v => v > tt.v).length;
          box.appendChild(K.note('Simulated <b>' + K.fmtInt(sim.n) + '</b> pairs (' + tx(xn) + ' and ' + tx('Y') + ' drawn separately, then added): average ' + tx('\\approx ' + d4(mean)) + ' (rule: ' + tx(d6(mS)) + '), variance ' + tx('\\approx ' + d4(vr)) + ' (rule: ' + tx(d6(vS)) + '), fraction above ' + tx('t') + ': ' + tx('\\frac{' + gt + '}{' + sim.n + '}\\approx ' + d4(gt / sim.n)) + ' (rule: ' + tx(d4(pGt)) + ').', 'ws-readout'));
        } else box.appendChild(K.note('No pairs simulated yet. Press a button: each pair draws ' + tx(xn) + ' and ' + tx('Y') + ' on their own, then adds them.', 'small muted'));
      }
      function runSum(n) {
        const m2 = pv(st.mu2), s2 = pv(st.sd2);
        if (!m2 || !s2) return;
        if (!sim) sim = { n: 0, s1: 0, s2: 0, vals: [] };
        for (let i = 0; i < n; i++) {
          const u1 = 1 - Math.random(), u2 = Math.random(), r = Math.sqrt(-2 * Math.log(u1));
          const v = M.m + M.s * r * Math.cos(2 * Math.PI * u2) + m2.v + s2.v * r * Math.sin(2 * Math.PI * u2);
          sim.n++; sim.s1 += v; sim.s2 += v * v; sim.vals.push(v);
        }
        if (sim.vals.length > 200000) sim.vals = sim.vals.slice(-200000);
      }
      fill();
    }
    function memoryless(b) {
      const box = h('div', { class: 's7-stack' });
      const fx = (k, label) => valField({ label, value: st[k], min: 0, max: Math.ceil(4 / M.l.v), step: 0.1, key: k, check: v => (v >= 0 ? null : 'Use a number ≥ 0.'), onChange: (v, s) => { st[k] = s; save(); fill(); } });
      b.append(h('div', { class: 's7-grid2' }, fx('mk', 'Time already waited ' + tx('k')), fx('mx', 'Extra time ' + tx('x'))), box);
      function fill() {
        Lab.clear(box);
        const xp = pv(st.mx), kp = pv(st.mk);
        if (!xp || !kp) return;
        const lam = M.l.v, lt = M.l.t, x = xp.v, k = kp.v;
        const pk = Math.exp(-lam * k), pxk = Math.exp(-lam * (x + k)), px = Math.exp(-lam * x);
        const sum = x + k, sumT = xp.q && kp.q ? qEx(xp.q.add(kp.q), 'dec') || d6(sum) : d6(sum);
        const fr = frame({ W: chartW(box), lo: M.lo, hi: Math.max(M.hi, sum * 1.15), ymax: M.fmax * 1.12, height: 230, aria: 'exponential curve with the regions X > k and X > x + k', xLabel: 'x' });
        fr.s.appendChild(svg('path', { d: fr.area(M.pdf, k, fr.hi), class: 's7-area s7-light' }));
        fr.s.appendChild(svg('path', { d: fr.area(M.pdf, sum, fr.hi), class: 's7-area' }));
        fr.s.appendChild(svg('path', { d: fr.path(M.pdf, fr.lo, fr.hi, [0]), class: 's7-curve' }));
        [[k, 'k = ' + kp.s], [sum, 'x + k = ' + sumT.replace(/\{,\}/g, ',')]].forEach(([v, t]) => { fr.s.appendChild(svg('line', { x1: fr.X(v), x2: fr.X(v), y1: fr.Y(0), y2: fr.Y(M.fmax * 0.9), class: 's7-hline' })); fr.s.appendChild(svg('text', { x: fr.X(v), y: fr.Y(M.fmax * 0.9) - 6, 'text-anchor': 'middle', class: 's7-tick s7-hl' }, t)); });
        box.appendChild(wrapSvg(fr.s));
        box.appendChild(K.note('Light violet = ' + tx('P(X>k)') + '. Dark violet = ' + tx('P(X>x+k)') + '. The conditional chance is dark ÷ (light + dark).', 'small muted'));
        box.appendChild(K.steps([
          { html: 'Survival (Week 12): ' + tx('P(X>t)=1-F(t)=e^{-\\lambda t}') + '. With your ' + tx('\\lambda=' + lt) + ' and ' + tx('k=' + kp.t) + ':', math: 'P(X>' + kp.t + ')=e^{-' + lt + '\\times ' + neg(kp.t) + '}' + (Number.isInteger(lam * k) || +(lam * k).toFixed(10) === lam * k ? '=' : '\\approx ') + 'e^{-' + d6(lam * k) + '}\\approx ' + d6(pk) },
          { html: 'And with ' + tx('x+k=' + xp.t + '+' + neg(kp.t) + '=' + sumT) + ':', math: 'P(X>' + sumT + ')=e^{-' + lt + '\\times ' + neg(sumT) + '}\\approx e^{-' + d6(lam * sum) + '}\\approx ' + d6(pxk) },
          { html: 'Conditional probability. If ' + tx('X>x+k') + ' then also ' + tx('X>k') + ', so "both" is just ' + tx('X>x+k') + ':', math: 'P(X>' + sumT + '\\mid X>' + kp.t + ')=\\frac{P(X>' + sumT + ')}{P(X>' + kp.t + ')}\\approx\\frac{' + d6(pxk) + '}{' + d6(pk) + '}\\approx ' + d6(pxk / pk) },
          { html: 'Compare with a fresh start:', math: 'P(X>' + xp.t + ')=e^{-' + lt + '\\times ' + neg(xp.t) + '}\\approx e^{-' + d6(lam * x) + '}\\approx ' + d6(px) + '\\approx ' + d4(px), note: (Math.abs(pxk / pk - px) < 1e-12 ? '<span class="cgood">✓ The same.</span> ' : '') + 'Why, in symbols: ' + tx('\\frac{e^{-\\lambda(x+k)}}{e^{-\\lambda k}}=e^{-\\lambda x}') + ' — the ' + tx('k') + ' cancels.' },
        ]));
      }
      fill();
    }

    let lastW = 0;
    const onResize = Lab.debounce(() => { if (!host.isConnected) { window.removeEventListener('resize', onResize); return; } const w = P.pdf.body.clientWidth; if (Math.abs(w - lastW) > 24) { lastW = w; P.pdfObj = null; draw(); } }, 200);
    window.addEventListener('resize', onResize);
    buildControls();
    afterParams();
    requestAnimationFrame(() => { lastW = P.pdf.body.clientWidth; });
  }

  /* ============================================================ lecture examples
     Week 12 lectures are cited by their YouTube titles (the course playlist); minute marks in brackets. */
  const PRESETS = [
    { label: 'Uniform · waiting for a friend, U(0, 60)', source: 'Week 12 lecture “Uniform applications” (08:00–17:00): the friend arrives uniformly between 2 and 3 pm; P(wait between 10 and 35 minutes) = 25/60 = 5/12.', st: { fam: 'uniform', ua: '0', ub: '60', ev: 'between', cd: ['10', '35'] } },
    { label: 'Uniform · the standard uniform U(0, 1)', source: '“Uniform applications” (00:30–06:30): P(0.3 < X ≤ 0.9) = 0.6.', st: { fam: 'uniform', ua: '0', ub: '1', cd: ['0.3', '0.9'] } },
    { label: 'Triangle · Joan’s study hours on [0, 4], peak at 2', source: '“Non-uniform and triangular” (07:30–13:00): height 1/2 from ½·4·h = 1; P(1 to 3 hours) = 0.75 and P(more than 3 hours) = 1/8.', st: { fam: 'triangle', ta: '0', tm: '2', tb: '4', cd: ['1', '3'] } },
    { label: 'Exponential · a phone call, exp(0.1)', source: '“Exponential” (09:00–12:30): mean 10 minutes; P(wait > 10) = e⁻¹ ≈ 0.368 and P(10 to 20) = e⁻¹ − e⁻² ≈ 0.233.', st: { fam: 'exponential', lam: '0.1', cd: ['10', '20'] } },
    { label: 'Normal · heights of men, mean 69, SD 6.5', source: '“Normal distribution” (22:30–26:30): 82 = μ + 2σ, so the approximation rule gives P(X < 82) ≈ 0.975 (Φ(2) is 0.9772 exactly).', st: { fam: 'normal', mu: '69', sp: '6.5', par: 'sd', ev: 'le', cd: ['56', '82'] } },
    { label: 'Normal · slide “X ~ N(15, 4)” with SD 4', source: '“Normal distribution” (26:30–30:00): this slide writes the SD second, so σ = 4 and σ² = 16. The rule gives P(11 < X < 19) ≈ 0.68.', st: { fam: 'normal', mu: '15', sp: '4', par: 'sd', cd: ['11', '19'] } },
    { label: 'Standard normal · P(−0.9 < Z < 1.2)', source: '“Standard normal” (14:30–26:00), item 4: 0.8849 + 0.8159 − 1 = 0.7008 from 4-place table values (unrounded: 0.7009).', st: { fam: 'std', cd: ['-0.9', '1.2'] } },
    { label: 'Standard normal · P(Z > 1.1)', source: '“Standard normal” (14:30–26:00), item 2: 1 − 0.8643 = 0.1357.', st: { fam: 'std', ev: 'ge', cd: ['1.1', '2'] } },
    { label: 'Standardising · IQ scores, mean 140, SD 10', source: '“Standardizing” (05:00–10:30): P(120 < X < 150) = P(−2 < Z < 1) = 0.8185 from table values (unrounded: 0.8186).', st: { fam: 'normal', mu: '140', sp: '10', par: 'sd', cd: ['120', '150'] } },
    { label: 'Standardising · mean 10, SD 3: P(8 < X < 11)', source: '“Standardizing” (16:00–22:30): the lecture rounds z to −0.67 and 0.33 and gets 0.3779; with exact z = −2/3 and 1/3 it is 0.3781.', st: { fam: 'normal', mu: '10', sp: '3', par: 'sd', cd: ['8', '11'] } },
    { label: 'Standardising · entrance exam, mean 500, SD 90', source: '“Standardizing” (22:30–27:00): z = 200/90 ≈ 2.22 and P(X > 700) = 1 − 0.9868 = 0.0132 (with unrounded z: 0.0131).', st: { fam: 'normal', mu: '500', sp: '90', par: 'sd', ev: 'ge', cd: ['700', '800'] } },
    { label: 'Standardising · bolts, mean 1.10, SD 0.005', source: '“Standardizing” (34:30–37:30): P(1.09 < X < 1.11) = P(−2 < Z < 2) = 0.9544 from the table (unrounded: 0.9545), so 4.56% fail.', st: { fam: 'normal', mu: '1.10', sp: '0.005', par: 'sd', cd: ['1.09', '1.11'] } },
    { label: 'Standardising · pulse rates, mean 72, SD 9.5', source: '“Standardizing” (33:00–34:30): P(X > 95) = P(Z > 2.42) = 0.0078 (with unrounded z: 0.0077).', st: { fam: 'normal', mu: '72', sp: '9.5', par: 'sd', ev: 'ge', cd: ['95', '100'] } },
    { label: 'Sum · two light bulbs, each mean 400 h, SD 40', source: '“Additive property and percentiles” (02:00–05:00): the total ~ N(800, 3200) and P(total > 750) ≈ 0.81 — see “Adding two independent normals” below.', st: { fam: 'normal', mu: '400', sp: '40', par: 'sd', mu2: '400', sd2: '40', tsum: '750', cd: ['360', '440'] } },
    { label: 'Sum · yearly rainfall, mean 67 in, SD 8', source: '“Additive property and percentiles” (05:00–07:30): P(one year > 70) = 0.3538; the two-year total ~ N(134, 128) and P(total > 140) ≈ 0.297.', st: { fam: 'normal', mu: '67', sp: '8', par: 'sd', ev: 'ge', cd: ['70', '80'], mu2: '67', sd2: '8', tsum: '140' } },
    { label: 'Percentile · 95th percentile, mean 40, SD 5', source: '“Additive property and percentiles” (23:30–25:30): P(X < a) = 0.95 gives a = 40 + 5 × 1.645 = 48.225 (with z₀.₀₅ ≈ 1.6449: 48.2243).', st: { fam: 'normal', mu: '40', sp: '5', par: 'sd', alpha: '0.05', ev: 'le', cd: ['30', '48.225'] } },
    { label: 'Percentile · top 1% of IQ, mean 100, SD 14.2', source: '“Additive property and percentiles” (25:30–29:30): a = 100 + 14.2 × 2.33 = 133.086 with the table value 2.33 (with z₀.₀₁ ≈ 2.3263: 133.0341).', st: { fam: 'normal', mu: '100', sp: '14.2', par: 'sd', alpha: '0.01', ev: 'ge', cd: ['133', '150'] } },
  ];

  Lab.lab({
    id: ID, course: 's1', week: 12, order: 1,
    title: 'Continuous distributions and the normal lab', sub: 'Week 12 · PDF, CDF, normal',
    topics: ['PDF', 'CDF', 'uniform', 'triangular', 'exponential', 'memoryless', 'normal', 'standardise', 'Φ table', 'percentiles', 'X + Y'],
    desc: 'Pick a continuous distribution and type its parameters. Drag an interval on the PDF and see its area, the same number as F(d) − F(c) on the CDF, and every step with your numbers — plus the 68–95–99.7 rule, percentiles, sums of normals and the memoryless property.',
    render,
  });
})();
