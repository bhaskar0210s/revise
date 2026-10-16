/* Playground lab (s2-w2-gx) — Function of one random variable lab: Y = g(X).  Week 2 · L2.3–L2.5.
   X comes from K.distPicker (uniform, binomial, geometric, Poisson, typed PMF); g(x) is typed (K.exprField).
   Panels: answer, arrows x → g(x) (mass moves and merges) with the one-to-one check, the graph of g at the values
   of X with a movable horizontal line y = c (the horizontal-line test of L2.3 min 14–15 and L2.4 min 01–02),
   PMF and CDF of X and Y, the lecture's table method with every sum written, E[g(X)] computed two ways.
   This file also defines Lab.t4a: helpers shared with labs/s2-w2-gxy.js (exact sums, TeX of a typed
   expression with numbers substituted, compact lists, a stem plot for big supports, small tables). */
(function () {
  'use strict';
  const { h, svg, F, T } = Lab;
  const K = Lab.play;
  const U = (Lab.t4a = Lab.t4a || {});
  const tex = (s, d) => Lab.tex(s, d);
  const isF = v => v instanceof Lab.Frac;
  const gcd = (a, b) => Lab.math.gcd(a, b);
  const lcm = (a, b) => (a / gcd(a, b)) * b;

  /* ================================================================== shared helpers (Lab.t4a) */
  U.exact = p => isF(p) && !p.approx;
  U.peq = (a, b) => (U.exact(a) && U.exact(b) ? a.eq(b) : Math.abs(Number(a) - Number(b)) < 1e-12);
  /** Exact sum when both are exact (lcm-based, so 1/3^20 + 2/3^20 stays exact); otherwise a float. */
  U.add = function (a, b) {
    if (U.exact(a) && U.exact(b)) {
      const l = lcm(a.d, b.d), n = a.n * (l / a.d) + b.n * (l / b.d);
      if (Number.isSafeInteger(l) && Number.isSafeInteger(n)) return new Lab.Frac(n, l);
    }
    return Number(a) + Number(b);
  };
  U.mul = function (a, b) {
    if (U.exact(a) && U.exact(b)) {
      const g1 = gcd(a.n, b.d), g2 = gcd(b.n, a.d);
      const n = (a.n / g1) * (b.n / g2), d = (a.d / g2) * (b.d / g1);
      if (Number.isSafeInteger(n) && Number.isSafeInteger(d)) return new Lab.Frac(n, d);
    }
    return Number(a) * Number(b);
  };
  U.sum = arr => arr.reduce((s, x) => U.add(s, x), F(0));
  /** An exact fraction for v when that is honest (integers, short decimals, exact Fracs); else the float. */
  U.toF = function (v) {
    if (U.exact(v)) return v;
    if (isF(v)) return Number(v);
    if (typeof v === 'number' && Number.isSafeInteger(v)) return F(v);
    if (typeof v === 'number' && isFinite(v)) { const f = Lab.Frac.of(v); return f.approx ? v : f; }
    return Number(v);
  };
  /** Common denominator of exact fractions; null when one is a decimal or it would pass max. */
  U.commonDen = function (ps, max = 1e6) {
    let D = 1;
    for (const p of ps) {
      if (!U.exact(p)) return null;
      D = lcm(D, p.d);
      if (D > max) return null;
    }
    return D;
  };

  const bigTex = n => (Math.abs(n) >= 10000 ? K.intTex(n) : String(n));
  const bigTxt = n => (Math.abs(n) >= 10000 ? K.fmtInt(n) : String(n));
  U.bigTex = bigTex;
  /** A float as a short decimal: 4 places; 3 significant digits when tiny; ×10^k when huge or very tiny. */
  U.dec = function (v, asTex = true) {
    v = Number(v);
    if (!isFinite(v)) return String(v);
    if (v === 0) return '0';
    const a = Math.abs(v);
    const sci = digits => {
      const parts = v.toExponential(digits).split('e');
      const mant = parts[0].replace(/\.?0+$/, '');
      return asTex ? mant + '\\times10^{' + Number(parts[1]) + '}' : mant + '×10^' + Number(parts[1]);
    };
    if (a >= 1e15) return sci(4);
    if (Number.isInteger(v)) return asTex ? bigTex(v) : bigTxt(v);
    if (a >= 0.001) return Lab.fmtDec(v, 4);
    if (a >= 1e-7) return v.toFixed(Math.min(12, 2 - Math.floor(Math.log10(a)))).replace(/0+$/, '');
    return sci(2);
  };
  U.fracTex = f => (f.d === 1 ? bigTex(f.n) : (f.n < 0 ? '-' : '') + '\\frac{' + bigTex(Math.abs(f.n)) + '}{' + bigTex(f.d) + '}');
  /** TeX of a value of a random variable. raw = the exact result of the expression, when there is one. */
  U.vTex = function (v, raw) {
    if (U.exact(raw)) return U.fracTex(raw);
    if (U.exact(v)) return U.fracTex(v);
    return U.dec(v);
  };
  /** Plain text (SVG labels) of a value; minus sign as −. */
  U.vTxt = function (v, raw) {
    let s;
    if (U.exact(raw) && raw.d !== 1) s = raw.toString();
    else if (U.exact(v) && v.d !== 1) s = v.toString();
    else s = U.dec(U.exact(raw) ? raw.n : Number(v), false);
    return s.replace(/^-/, '−');
  };
  /** Is the value shown in full by vTex? (decides between = and ≈) */
  U.shownExact = function (v, raw) {
    if (U.exact(raw) || U.exact(v)) return true;
    v = Number(v);
    if (Number.isInteger(v)) return Math.abs(v) < 1e15;
    return Number(U.dec(v, false)) === v;
  };
  U.eqv = (v, raw) => (U.shownExact(v, raw) ? '=' : '\\approx ');
  U.par = t => (String(t).charAt(0) === '-' ? '(' + t + ')' : t);
  /** TeX of a probability; over the common denominator D when given (e.g. 210/1024 instead of 105/512). */
  U.pTex = function (p, D) {
    if (!U.exact(p)) return U.dec(Number(p));
    if (p.d === 1) return String(p.n);
    if (D && D % p.d === 0) return '\\frac{' + bigTex(p.n * (D / p.d)) + '}{' + bigTex(D) + '}';
    return U.fracTex(p);
  };
  U.pTxt = function (p, D) {
    if (!U.exact(p)) return U.dec(Number(p), false);
    if (p.d === 1) return String(p.n);
    if (D && D % p.d === 0) return bigTxt(p.n * (D / p.d)) + '/' + bigTxt(D);
    return bigTxt(p.n) + '/' + bigTxt(p.d);
  };
  /** "= p over D = reduced ≈ decimal" (or "≈ decimal" for a float): the relation is included. */
  U.pEq = function (p, D) {
    if (!U.exact(p)) return (Number(p) === 0 ? '=' : '\\approx ') + U.dec(Number(p));
    let s = '=' + U.pTex(p, D);
    if (D && p.d !== 1 && p.d !== D) s += '=' + U.fracTex(p);
    if (p.d !== 1) s += (K.exactDecimal(p) ? '=' : '\\approx ') + U.dec(Number(p));
    return s;
  };
  /** A computed number (an expectation): exact fraction ≈ decimal, an integer, or ≈ decimal. */
  U.numTex = function (v) {
    if (U.exact(v)) return v.d === 1 ? bigTex(v.n) : U.fracTex(v) + (K.exactDecimal(v) ? '=' : '\\approx ') + U.dec(Number(v));
    return (U.shownExact(v) ? '' : '\\approx ') + U.dec(v);
  };
  /** "= value" or "≈ value" for a computed number. */
  U.numEq = v => { const t = U.numTex(v); return t.indexOf('\\approx') === 0 ? t : '=' + t; };
  /** Compact TeX list of sorted values: all of them, "a, a+d, …, b" for a progression, or first … last. */
  U.listTex = function (vals, raws, max = 8) {
    const n = vals.length;
    if (!n) return '';
    const t = k => U.vTex(vals[k], raws ? raws[k] : undefined);
    if (n <= max) return vals.map((_, k) => t(k)).join(',\\ ');
    const d = vals[1] - vals[0];
    const ap = vals.every((v, k) => k === 0 || Math.abs(v - vals[k - 1] - d) <= 1e-9 * Math.max(1, Math.abs(d)));
    if (ap) return t(0) + ',\\ ' + t(1) + ',\\ \\dots,\\ ' + t(n - 1);
    return [0, 1, 2].map(t).join(',\\ ') + ',\\ \\dots,\\ ' + t(n - 2) + ',\\ ' + t(n - 1);
  };
  U.listTxt = function (vals, raws, max = 5) {
    const n = vals.length;
    const t = k => U.vTxt(vals[k], raws ? raws[k] : undefined);
    if (n <= max) return vals.map((_, k) => t(k)).join(', ');
    const d = vals[1] - vals[0];
    const ap = vals.every((v, k) => k === 0 || Math.abs(v - vals[k - 1] - d) <= 1e-9 * Math.max(1, Math.abs(d)));
    if (ap) return t(0) + ', ' + t(1) + ', …, ' + t(n - 1);
    return t(0) + ', ' + t(1) + ', …, ' + t(n - 1);
  };
  /** Terms joined by +; long lists are shortened (k × term when all equal). */
  U.sumTex = function (terms, max = 8) {
    const n = terms.length;
    if (!n) return '0';
    if (n <= max) return terms.join('+');
    if (terms.every(t => t === terms[0])) return '\\underbrace{' + terms[0] + '+\\dots+' + terms[0] + '}_{' + n + '\\text{ terms}}';
    return terms.slice(0, 3).join('+') + '+\\dots+' + terms.slice(-2).join('+') + '\\;{\\scriptstyle(' + n + '\\text{ terms})}';
  };
  /** Compile a typed expression; the function returns the exact result (Frac) when it can. */
  U.compile = function (src, vars) {
    const f = Lab.expr.compile(src);
    return (...a) => { const env = {}; vars.forEach((v, k) => (env[v] = a[k])); return f(env); };
  };

  /* --- TeX of a typed expression, optionally with numbers substituted: g(3) = (3-5)^{2} --- */
  const AT = 9;
  const wrapP = (t, on) => (on ? '\\left(' + t + '\\right)' : t);
  function modTex(A, B) { return { t: wrapP(A.t, A.p < 2) + '\\bmod ' + wrapP(B.t, B.p <= 2 || B.neg), p: 2, neg: A.neg && A.p >= 2 }; }
  function node2tex(n, subs) {
    if (n.num !== undefined) return { t: n.num.charAt(0) === '.' ? '0' + n.num : n.num, p: AT, lit: true };
    if (n.id !== undefined) {
      if (subs && Object.prototype.hasOwnProperty.call(subs, n.id)) {
        const s = subs[n.id];
        if (s && s.tex) return { t: s.tex, p: AT, id: true };
        const t = s && s.v !== undefined ? U.vTex(s.v, s.raw) : U.vTex(s);
        const neg = t.charAt(0) === '-';
        return { t, p: neg ? 2.5 : AT, neg, sub: true };
      }
      if (n.id === 'pi') return { t: '\\pi', p: AT };
      return { t: n.id.length === 1 ? n.id : '\\mathrm{' + n.id + '}', p: AT, id: true };
    }
    if (n.fn) {
      const A = n.args.map(a => node2tex(a, subs));
      const at = t => ({ t, p: AT });
      switch (n.fn) {
        case 'abs': return at('\\left|' + A[0].t + '\\right|');
        case 'max': case 'min': return at('\\' + n.fn + '(' + A.map(a => a.t).join(',') + ')');
        case 'mod': return modTex(A[0], A[1]);
        case 'floor': return at('\\lfloor ' + A[0].t + '\\rfloor');
        case 'ceil': return at('\\lceil ' + A[0].t + '\\rceil');
        case 'round': case 'sign': return at('\\operatorname{' + n.fn + '}(' + A[0].t + ')');
        case 'sqrt': return at('\\sqrt{' + A[0].t + '}');
        case 'fact': return at(wrapP(A[0].t, A[0].p < AT || A[0].neg) + '!');
        case 'C': case 'nCr': return at('\\binom{' + A[0].t + '}{' + A[1].t + '}');
        case 'P': case 'nPr': return at('{}^{' + A[0].t + '}P_{' + A[1].t + '}');
        case 'exp': return { t: 'e^{' + A[0].t + '}', p: 4 };
        case 'ln': return at('\\ln(' + A[0].t + ')');
        case 'log': return at('\\log_{10}(' + A[0].t + ')');
        default: return at('\\operatorname{' + n.fn + '}(' + A.map(a => a.t).join(',') + ')');
      }
    }
    if (n.op === 'neg') { const A = node2tex(n.a, subs); return { t: '-' + wrapP(A.t, A.p < 2.5 || A.neg), p: 2.5, neg: true }; }
    const A = node2tex(n.a, subs), B = node2tex(n.b, subs);
    switch (n.op) {
      case '+': return { t: A.t + '+' + wrapP(B.t, B.neg), p: 1, neg: A.neg };
      case '-': return { t: A.t + '-' + wrapP(B.t, B.p <= 1 || B.neg), p: 1, neg: A.neg };
      case '*': {
        const L = wrapP(A.t, A.p < 2), R = wrapP(B.t, B.p <= 2 || B.neg);
        const implicit = ((A.lit && !B.lit && !B.sub) || (A.id && B.id)) && !/^[0-9.]/.test(R) && !B.neg;
        return { t: implicit ? L + R : L + '\\cdot ' + R, p: 2, neg: A.neg && A.p >= 2 };
      }
      case '/': return { t: '\\frac{' + A.t + '}{' + B.t + '}', p: 3 };
      case '%': return modTex(A, B);
      case '^': return { t: wrapP(A.t, A.p < AT || A.neg) + '^{' + B.t + '}', p: 4 };
    }
    return { t: '?', p: AT };
  }
  const astCache = new Map();
  /** TeX of a typed expression. subs: {x: 3} or {x: {v, raw}} substitutes numbers; {x: {tex: 'X'}} renames. */
  U.exprTex = function (src, subs) {
    try {
      let ast = astCache.get(src);
      if (!ast) { if (astCache.size > 300) astCache.clear(); ast = Lab.expr.parse(src); astCache.set(src, ast); }
      return node2tex(ast, subs).t;
    } catch (e) { return '\\text{' + String(src).replace(/[{}\\$&#^_%~]/g, '') + '}'; }
  };

  /** P(name = v) = cases, grouping the values that share a probability. groups: [{value, raw, p}]. */
  U.casesTex = function (groups, D, name, v) {
    const bundles = [];
    groups.forEach(g => { const b = bundles.find(x => U.peq(x.p, g.p)); if (b) b.gs.push(g); else bundles.push({ p: g.p, gs: [g] }); });
    const short = (vals, raws) => {
      if (vals.length <= 5) return U.listTex(vals, raws, 5);
      const d = vals[1] - vals[0];
      if (vals.every((x, k) => k === 0 || Math.abs(x - vals[k - 1] - d) <= 1e-9 * Math.max(1, Math.abs(d)))) return U.listTex(vals, raws, 2);
      const n = vals.length;
      return U.vTex(vals[0], raws[0]) + ',\\ ' + U.vTex(vals[1], raws[1]) + ',\\ \\dots,\\ ' + U.vTex(vals[n - 1], raws[n - 1]) + '\\ {\\scriptstyle(' + n + '\\text{ values})}';
    };
    const rows = bundles.slice(0, 6).map(b => U.pTex(b.p, D) + '&\\text{for } ' + v + '=' + short(b.gs.map(g => g.value), b.gs.map(g => g.raw)));
    if (bundles.length > 6) rows.push('\\vdots&\\text{(' + (bundles.length - 6) + ' more probabilities: see the tables below)}');
    return 'P(' + name + '=' + v + ')=\\begin{cases}' + rows.join('\\\\') + '\\end{cases}';
  };

  /**
   * One value of a named PMF with the learner's numbers: "P(X=2)=\binom{4}{2}(1/2)^2(1/2)^2=6/16=3/8≈0.375".
   * r = a K.distPicker result ({fam, q}); x = the value; p = its probability; D = common denominator or null.
   */
  U.famLine = function (name, r, x, p, D) {
    const q = (r && r.q) || {}, xt = U.vTex(x), P = 'P(' + name + '=' + xt + ')', pe = U.pEq(p, D);
    const pq = () => { const pp = F(q.p); return [U.pTex(pp), U.pTex(F(1).sub(pp))]; };
    switch (r && r.fam) {
      case 'uniform': { const a = Math.min(q.a, q.b), b = Math.max(q.a, q.b); return P + '=\\frac{1}{b-a+1}=\\frac{1}{' + U.vTex(b) + '-' + U.par(U.vTex(a)) + '+1}' + pe; }
      case 'bernoulli': return P + '=' + (Number(x) === 1 ? 'p' : '1-p') + pe;
      case 'binomial': { const [a, b] = pq(); return P + '=\\binom{' + q.n + '}{' + xt + '}\\left(' + a + '\\right)^{' + xt + '}\\left(' + b + '\\right)^{' + (q.n - x) + '}' + pe; }
      case 'geometric': { const [a, b] = pq(); return P + '=(1-p)^{' + xt + '-1}\\,p=\\left(' + b + '\\right)^{' + (x - 1) + '}\\cdot ' + a + pe; }
      case 'negbin': { const [a, b] = pq(); return P + '=\\binom{' + (x - 1) + '}{' + (q.r - 1) + '}\\left(' + a + '\\right)^{' + q.r + '}\\left(' + b + '\\right)^{' + (x - q.r) + '}' + pe; }
      case 'poisson': { const lam = q['λ']; return P + '=\\frac{e^{-' + lam + '}\\,' + lam + '^{' + xt + '}}{' + xt + '!}' + pe; }
      default: return P + pe;
    }
  };

  /** Small table: head = [html], rows = [[html | {html, cls}] | {cells, cls} | {gap: html}]. Cells hold ready HTML. */
  U.tbl = function (head, rows, opts = {}) {
    const t = h('table', { class: 'tbl t4-tbl' + (opts.cls ? ' ' + opts.cls : '') });
    if (head) t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach(r => {
      if (r && r.gap) { tb.appendChild(h('tr', { class: 'gap' }, h('td', { colspan: String(head ? head.length : 1), html: r.gap }))); return; }
      const cells = Array.isArray(r) ? r : r.cells;
      tb.appendChild(h('tr', { class: (!Array.isArray(r) && r.cls) || null }, cells.map(c => (c && typeof c === 'object' ? h('td', { class: c.cls || null, html: c.html }) : h('td', { html: c })))));
    });
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap t4-tw' }, t);
  };
  /** Several display lines aligned at "=": first = 'E[Y]&=…', rest = ['=…', …]. */
  U.aligned = (first, rest) => '\\begin{aligned}' + first + rest.map(r => '\\\\&' + r).join('') + '\\end{aligned}';
  U.mathEl = (src, cls) => h('div', { class: 's-math t4-math' + (cls ? ' ' + cls : ''), html: tex(src, true) });

  U.niceTicks = function (lo, hi, count = 6) {
    const span = hi - lo;
    if (!(span > 0)) return [lo];
    const raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 5, 10].map(f => f * mag).find(s => s >= raw) || 10 * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : Number(v.toPrecision(12)));
    return out;
  };
  /**
   * Stem plot on a true number line (for supports too big for bars). rows [{x, p, raw?}] sorted by x.
   * opts: tone 'x'|'y'|'z', name (TeX letter), D, hot(row) → bool, caption (html), height
   */
  U.stemChart = function (rows, o = {}) {
    const wrap = h('div', { class: 't4-stem tone-' + (o.tone || 'z') });
    const Wd = 660, H = o.height || 210, pl = 64, pr = 18, pt = 16, pb = 34;
    const xs = rows.map(r => Number(r.x));
    let lo = Math.min(...xs), hi = Math.max(...xs);
    if (lo === hi) { lo -= 1; hi += 1; }
    const padV = (hi - lo) * 0.03;
    const X = v => pl + ((v - lo + padV) / (hi - lo + 2 * padV)) * (Wd - pl - pr);
    const pmax = Math.max(...rows.map(r => Number(r.p)), 1e-300);
    const Y = v => pt + (1 - v / pmax) * (H - pt - pb);
    const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 't4-stem-svg', role: 'img', 'aria-label': 'stem plot' });
    const top = rows.reduce((a, r) => (Number(r.p) > Number(a.p) ? r : a), rows[0]);
    [0, 1].forEach(f => {
      s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(f * pmax), y2: Y(f * pmax), class: 't4-grid' }));
      s.appendChild(svg('text', { x: pl - 7, y: Y(f * pmax) + 4, 'text-anchor': 'end', class: 't4-tick' }, f === 0 ? '0' : U.pTxt(top.p, o.D)));
    });
    U.niceTicks(lo, hi, 7).forEach(v => {
      s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: Y(0), y2: Y(0) + 5, class: 't4-axis' }));
      s.appendChild(svg('text', { x: X(v), y: H - 13, 'text-anchor': 'middle', class: 't4-tick' }, U.vTxt(v)));
    });
    let d = '', dh = '';
    rows.forEach(r => {
      const top = Math.min(Y(Number(r.p)), Y(0) - (Number(r.p) > 0 ? 1.2 : 0));
      const seg = 'M' + X(Number(r.x)).toFixed(2) + ',' + Y(0) + 'V' + top.toFixed(2);
      if (o.hot && o.hot(r)) dh += seg; else d += seg;
    });
    if (d) s.appendChild(svg('path', { d, class: 't4-stems' }));
    if (dh) s.appendChild(svg('path', { d: dh, class: 't4-stems hot' }));
    if (rows.length <= 150) rows.forEach(r => s.appendChild(svg('circle', { cx: X(Number(r.x)), cy: Y(Number(r.p)), r: 2.6, class: 't4-stem-dot' + (o.hot && o.hot(r) ? ' hot' : '') })));
    s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(0), y2: Y(0), class: 't4-axis' }));
    const mark = svg('line', { x1: 0, x2: 0, y1: pt, y2: Y(0), class: 't4-mark', visibility: 'hidden' });
    s.appendChild(mark);
    const name = o.name || 'Y';
    const read = h('div', { class: 't4-stem-read', html: '<span class="muted">Point at the plot to read the nearest stem.</span>' });
    s.addEventListener('pointermove', ev => {
      const ctm = s.getScreenCTM();
      if (!ctm) return;
      const q = new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse());
      let best = 0, bd = Infinity;
      rows.forEach((r, k) => { const dd = Math.abs(X(Number(r.x)) - q.x); if (dd < bd) { bd = dd; best = k; } });
      const r = rows[best];
      mark.setAttribute('x1', X(Number(r.x))); mark.setAttribute('x2', X(Number(r.x))); mark.setAttribute('visibility', 'visible');
      read.innerHTML = tex('P(' + name + '=' + U.vTex(r.x, r.raw) + ')' + U.pEq(r.p, o.D));
    });
    wrap.append(h('div', { class: 't4-stem-scroll' }, s), read);
    if (o.caption) { const c = h('div', { class: 'pd-name' }); Lab.setHTML(c, o.caption); wrap.appendChild(c); }
    return wrap;
  };

  /* ================================================================== the lab */
  const STORE = 'lab:s2-gx';
  const DEFAULTS = () => ({
    fam: 'uniform',
    params: { uniform: { a: 0, b: 10 }, binomial: { n: 10, p: '1/2' }, geometric: { p: '1/2', 'shown up to k': 10 }, poisson: { 'λ': 2, 'shown up to k': 12 } },
    custom: { vals: [0, 1, 2, 3], probs: ['1/2', '1/4', '1/8', '1/8'] },
    g: '(x-5)^2', useD: null, hc: null,
  });
  const QUICK = [['x-5', 'x-5'], ['2x+1', '2x+1'], ['x^2', 'x^2'], ['(x-5)^2', '(x-5)^2'], ['abs(x)', '|x|'], ['2^x', '2^x'],
    ['max(x,0)', '\\max(x,0)'], ['max(x,5)', '\\max(x,5)'], ['min(x,3)', '\\min(x,3)'], ['mod(x,2)', 'x\\bmod 2']];
  /* hc: the height c of the horizontal line in "The graph of g" panel when the preset loads */
  const PRESETS = [
    { label: 'L2.3 · Uniform{0,…,10} and Y = X − 5', fam: 'uniform', q: { a: 0, b: 10 }, g: 'x-5', hc: -5,
      source: T`L2.3, min 05–10 (one-to-one, "a translation"): \(X\sim\text{Uniform}\{0,\dots,10\}\), \(Y=X-5\). Every value moves 5 to the left and keeps its \(\tfrac1{11}\).` },
    { label: 'L2.3 · Bin(10, 1/2) and Y = X − 5', fam: 'binomial', q: { n: 10, p: '1/2' }, g: 'x-5', hc: -5,
      source: T`L2.3, min 05–10: the same translation on \(X\sim\text{Bin}(10,\tfrac12)\). For example \(P(Y=-5)=P(X=0)=\tfrac1{1024}\).` },
    { label: 'L2.3 · Uniform{0,…,10} and Y = 2^X', fam: 'uniform', q: { a: 0, b: 10 }, g: '2^x', hc: 1,
      source: T`L2.3, min 10–13: \(Y=2^X\) takes the values \(1,2,4,\dots,1024\) — spread out unevenly, every probability unchanged ("instead of \(X=0\), \(Y\) becomes 1").` },
    { label: 'L2.3 · Bin(10, 1/2) and Y = 2^X', fam: 'binomial', q: { n: 10, p: '1/2' }, g: '2^x', hc: 64,
      source: T`L2.3, min 10–13: \(P(Y=64)=P(X=6)=\tfrac{210}{1024}\) and \(P(Y=1024)=P(X=10)=\tfrac{1}{1024}\).` },
    { label: 'L2.4 · Uniform{0,…,10} and Y = (X − 5)²', fam: 'uniform', q: { a: 0, b: 10 }, g: '(x-5)^2', hc: 4,
      source: T`L2.4, min 00–06 (many-to-one): \(P(Y=0)=\tfrac1{11}\), and \(P(Y=y)=\tfrac2{11}\) for \(y=1,4,9,16,25\). At min 01–02 the line \(y=4\) cuts the cup twice, at \(x=3\) and \(x=7\).` },
    { label: 'L2.4 · Bin(10, 1/2) and Y = (X − 5)²', fam: 'binomial', q: { n: 10, p: '1/2' }, g: '(x-5)^2', hc: 4,
      source: T`L2.4, min 06–07: the bell folds in half — \(252,\ 420,\ 240,\ 90,\ 20,\ 2\) out of 1024 at \(y=0,1,4,9,16,25\) ("3 and 7 add").` },
    { label: 'L2.5 · Uniform{−5,…,5} and Y = max(X, 0)', fam: 'uniform', q: { a: -5, b: 5 }, g: 'max(x,0)', hc: 0,
      source: T`L2.5 Problem 1, min 00–02: the six values \(x=-5,\dots,0\) land on 0, so \(P(Y=0)=\tfrac6{11}\); \(P(Y=y)=\tfrac1{11}\) for \(y=1,\dots,5\).` },
    { label: 'L2.5 · Uniform{−500,…,500} and Y = max(X, 5)', fam: 'uniform', q: { a: -500, b: 500 }, g: 'max(x,5)', hc: 5,
      source: T`L2.5 Problem 2, min 02–07: 1001 values. The 506 values \(x=-500,\dots,5\) land on 5, so \(P(Y=5)=\tfrac{506}{1001}\); \(P(Y=y)=\tfrac{1}{1001}\) for \(y=6,\dots,500\).` },
    { label: 'L1.6 (min 07–14) · IPL: runs off ball 1 in 1598 matches', fam: 'custom', g: 'x', hc: 0,
      custom: { vals: [0, 1, 2, 3, 4, 5, 6, 7, 8], probs: ['957/1598', '429/1598', '57/1598', '5/1598', '138/1598', '8/1598', '4/1598', '0', '0'] },
      source: T`L1.6, min 07–14 (Example 3, IPL powerplay, over 1): \(X\) = runs off the first ball, \(X\in\{0,1,\dots,8\}\). In 1598 matches the first ball gave 0 runs 957 times, 1 run 429, 2 runs 57, 3 runs 5, 4 runs 138, 5 runs 8, 6 runs 4, and 7 or 8 runs never. The lecture assigns probabilities "in the same proportion as the data": \(P(X=0)=\tfrac{957}{1598}\approx0.5989\), \(P(X=1)=\tfrac{429}{1598}\approx0.2685\). The lecture applies no function to these data, so this example uses \(g(x)=x\) (\(Y=X\)). Type your own \(g\) to transform them.` },
  ];
  const curve = (x1, y1, x2, y2) => 'M' + x1 + ',' + y1 + ' C' + (x1 + 0.45 * (x2 - x1)) + ',' + y1 + ' ' + (x2 - 0.45 * (x2 - x1)) + ',' + y2 + ' ' + x2 + ',' + y2;

  function gxLab(host) {
    const saved = Lab.store.get(STORE, null) || {};
    const D0 = DEFAULTS();
    const st = {
      fam: saved.fam || D0.fam,
      params: Object.assign({}, D0.params, saved.params || {}),
      custom: saved.custom || D0.custom,
      g: saved.g || D0.g,
      useD: saved.useD == null ? null : !!saved.useD,
      hc: typeof saved.hc === 'number' && isFinite(saved.hc) ? saved.hc : null, hcRaw: undefined,
    };
    const save = () => Lab.store.set(STORE, { fam: st.fam, params: st.params, custom: st.custom, g: st.g, useD: st.useD, hc: st.hc });
    let Xin = null, gSrc = null, model = null, batch = false, view = null, busy = false, runId = 0;
    let xSig = null, pendingHc = null, GR = null;

    const { side, main } = K.layout(host, 'gx-lab');
    host.classList.add('t4-lab');

    /* ---------------- controls */
    side.appendChild(K.group('1 · Your random variable X'));
    const picker = K.distPicker({
      label: 'Distribution of ' + tex('X'), families: ['uniform', 'binomial', 'geometric', 'poisson', 'custom'],
      value: st.fam, params: JSON.parse(JSON.stringify(st.params)), custom: st.custom, xName: 'X', onChange: r => onX(r),
    });
    const xHint = K.note('', 'pl-hint');
    side.append(picker, xHint);
    side.appendChild(K.group('2 · Your function g'));
    const gField = K.exprField({ label: 'Type ' + tex('g(x)') + ' using ' + tex('x'), value: st.g, vars: ['x'], placeholder: 'e.g. (x-5)^2', onChange: (fn, src) => onG(fn, src) });
    const chips = h('div', { class: 'pl-chips t4-chips' });
    QUICK.forEach(([src, t]) => chips.appendChild(Lab.button(tex(t), () => gField.set(src), 'btn xs')));
    side.append(gField, K.note('Quick choices:', 'pl-hint'), chips);
    side.appendChild(K.group('3 · Lecture examples'));
    const presetBox = K.presets({ items: PRESETS, onPick: it => applyPreset(it) });
    side.appendChild(presetBox);
    side.appendChild(K.group('4 · Fractions'));
    const dToggle = K.toggle({ label: '', value: true, onChange: v => { st.useD = v; save(); if (model) drawAll(); } });
    const dNote = K.note('', 'pl-hint');
    side.append(dToggle, dNote);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); gxLab(host); }, 'btn ghost sm')));

    /* ---------------- panels */
    const msg = h('div', { class: 't4-msg', hidden: true });
    const ans = K.answer();
    const P = {
      map: K.panel('Every value of ' + tex('X') + ' sends its probability to ' + tex('g(x)'), 'Blue bars: ' + tex('P(X=x)') + '. Teal bars: ' + tex('P(Y=y)') + ', on the same scale. Arrows that meet are violet: their probabilities add. Point at any value.'),
      graph: K.panel('The graph of ' + tex('g') + ' on ' + tex('T_X') + ' and the horizontal-line test',
        'One dot ' + tex('(x,g(x))') + ' for each value ' + tex('x') + ' of ' + tex('X') + '. The violet line is ' + tex('y=c') + ': the dots it meets are exactly the ' + tex('x') + ' with ' + tex('g(x)=c') + '. ' + tex('g') + ' is one-to-one when no horizontal line meets two dots — the test from L2.3 (min 14–15); in L2.4 (min 01–02) the line ' + tex('y=4') + ' cuts the cup ' + tex('(x-5)^2') + ' at ' + tex('x=3') + ' and ' + tex('x=7') + '. Drag the line, tap a dot, or type ' + tex('c') + '.'),
      pmf: K.panel('PMF of ' + tex('X') + ' and PMF of ' + tex('Y=g(X)')),
      cdf: K.panel('CDF of ' + tex('X') + ' and CDF of ' + tex('Y=g(X)'), tex('F(t)') + ' adds the probabilities of all values ' + tex('\\le t') + '. Move ' + tex('t') + ' under each staircase.'),
      table: K.panel('How the PMF of ' + tex('Y') + ' is computed: the table method', 'Exactly as in the lecture: write ' + tex('x') + ', ' + tex('P(X=x)') + ' and ' + tex('y=g(x)') + ' side by side, look for repeated values of ' + tex('y') + ', keep each value once and add.'),
      exp: K.panel(tex('E[g(X)]') + ' computed two ways', 'From the PMF of ' + tex('Y') + ', and straight from the PMF of ' + tex('X') + ' without grouping. Both must agree.'),
    };
    main.append(msg, ans, P.map, P.graph, P.pmf, P.cdf, P.table, P.exp);
    Lab.setHTML(ans, '<div class="pl-ans-ev muted">Loading your X and g…</div>');

    /* ---------------- input handlers */
    function problem(text) {
      msg.hidden = false;
      Lab.setHTML(msg, '<b>Not drawn yet:</b> ' + text + (model ? ' <span class="muted">The panels below still show your last valid choice.</span>' : ''));
    }
    function serialQ(q) { const o = {}; Object.keys(q || {}).forEach(k => (o[k] = isF(q[k]) ? q[k].toString() : q[k])); return o; }
    function widenUniform() {
      Lab.$$('.dp-params > .pl-field', picker).forEach((f, k) => {
        if (typeof f.setRange !== 'function' || f.dataset.wide) return;
        f.dataset.wide = '1';
        f.setRange(-500, 500);
        if (k === 1 && f.hint) f.hint('Type any whole numbers from −500 to 500 for ' + tex('a') + ' and ' + tex('b') + ' (the lecture uses up to 1001 values).');
      });
    }
    function clearPreset() {
      if (batch) return;
      presetBox.select.value = '';
      const s = presetBox.querySelector('.pl-hint');
      if (s) s.textContent = '';
    }
    function onX(r) {
      const fam = r.fam || 'custom';
      // the same X again (the PMF editor repeats its values once after it is built): nothing changed, so keep
      // the loaded example and its "From:" note
      const sig = r.ok ? fam + '|' + r.dist.vals.join(',') + '|' + r.dist.p.map(String).join(',') : null;
      if (sig && sig === xSig && Xin && Xin.ok && model) return;
      xSig = sig;
      if (fam === 'uniform') widenUniform();
      Xin = Object.assign({}, r, { fam });
      if (!r.ok) {
        problem(fam === 'custom' ? 'your PMF of ' + tex('X') + ' is not valid yet' + (r.total ? ' (its probabilities add up to ' + tex(U.pTex(r.total)) + ', not 1)' : '') + '. Fix the red boxes in the controls, or press “Rescale to total 1”.' : 'the distribution of ' + tex('X') + ' is not valid.');
        return;
      }
      st.fam = fam;
      if (fam === 'custom') st.custom = { vals: r.dist.vals.slice(), probs: r.dist.p.map(p => p.toString()) };
      else st.params[fam] = serialQ(r.q);
      if (!batch) { clearPreset(); update(); }
    }
    function onG(fn, src) {
      if (!fn) { gSrc = null; problem(tex('g(x)') + ' cannot be read yet: see the red message under the box.'); return; }
      gSrc = src; st.g = src;
      if (!batch) { clearPreset(); update(); }
    }
    function applyPreset(it) {
      batch = true;
      try {
        if (it.fam === 'custom') {
          picker.setFamily('custom');
          const pe = picker.querySelector('.pmf-ed');
          if (pe && pe.set) pe.set(it.custom.vals, it.custom.probs);
        } else picker.setFamily(it.fam, Object.assign({}, it.q));
        gField.set(it.g);
      } finally { batch = false; }
      pendingHc = it.hc != null ? it.hc : null;
      update();
    }
    function update() {
      if (!Xin || !gSrc || !Xin.ok) return;
      try { model = build(Xin, gSrc); }
      catch (e) { problem(Lab.esc(e.message)); return; }
      msg.hidden = true;
      save();
      drawAll();
    }

    /* ---------------- the model */
    function build(Xi, src) {
      const dist = Xi.dist;
      const n = dist.vals.length;
      if (!n) throw new Error('X has no values yet.');
      const fn = U.compile(src, ['x']);
      const float = !!dist.float || dist.p.some(p => !U.exact(p));
      const xs = dist.vals.map(Number);
      const ps = float ? dist.p.map(Number) : dist.p.slice();
      const ys = new Array(n), raws = new Array(n);
      for (let k = 0; k < n; k++) {
        let r;
        try { r = fn(U.toF(xs[k])); }
        catch (e) { throw new Error('g(' + Lab.fmtVal(xs[k]) + ') cannot be computed (' + e.message + '). Change g(x) or the values of X.'); }
        const v = Lab.expr.num(r);
        if (typeof v !== 'number' || !isFinite(v)) throw new Error('g(' + Lab.fmtVal(xs[k]) + ') is not a finite number. Change g(x) or the values of X.');
        ys[k] = v; raws[k] = r;
      }
      const map = new Map();
      for (let k = 0; k < n; k++) {
        const key = String(Number(ys[k].toPrecision(12)));
        let e = map.get(key);
        if (!e) { e = { value: ys[k], raw: raws[k], from: [], p: F(0) }; map.set(key, e); }
        e.from.push(k);
        e.p = U.add(e.p, ps[k]);
      }
      const groups = [...map.values()].sort((a, b) => a.value - b.value);
      const gi = new Array(n);
      groups.forEach((g, r) => g.from.forEach(k => (gi[k] = r)));
      const yFloat = float || groups.some(g => !U.exact(g.p));
      const D = yFloat ? null : U.commonDen(ps.concat(groups.map(g => g.p)), 1e6);
      const total = U.sum(ps);
      const m = { Xi, src, fn, xs, ps, ys, raws, n, groups, m: groups.length, gi, float, yFloat, D, total, oneToOne: groups.every(g => g.from.length === 1) };
      m.tail = tailOf(Xi, total);
      return m;
    }
    function tailOf(Xi, total) {
      const q = Xi.q || {};
      if (Xi.fam === 'geometric') { const k = q['shown up to k']; const qq = F(1).sub(q.p); return { k, p: qq.pow(k), qq, first: 1 }; }
      if (Xi.fam === 'poisson') return { k: q['shown up to k'], p: Math.max(0, 1 - Number(total)), first: 0 };
      return null;
    }
    /** the common denominator to use (null = reduced fractions) and whether the switch matters */
    function dState(m) {
      if (!m.D || m.D === 1) return { D: null, useful: false };
      const useful = m.ps.concat(m.groups.map(g => g.p)).some(p => p.d !== 1 && p.d !== m.D);
      if (!useful) return { D: m.D, useful };
      const on = st.useD == null ? m.D <= 4096 : st.useD;
      return { D: on ? m.D : null, useful, on };
    }

    /* ---------------- drawing */
    function drawAll() {
      const m = model;
      const ds = dState(m);
      const D = ds.D;
      dToggle.hidden = !ds.useful;
      if (ds.useful) {
        dToggle.querySelector('input').checked = !!ds.on;
        Lab.setHTML(dToggle.querySelector('.pl-tlabel'), 'Write every probability out of ' + tex(bigTex(m.D)) + ', the common denominator (as the lecture does)');
        Lab.setHTML(dNote, ds.on ? 'For example ' + tex(exampleD(m)) + '. Switch off to see reduced fractions.' : 'Showing reduced fractions. Switch on to add them over ' + tex(bigTex(m.D)) + ', like the lecture.');
      } else Lab.setHTML(dNote, m.yFloat ? 'These probabilities are decimals (4 places), not fractions.' : 'Every probability here is already written over the same denominator.');
      Lab.setHTML(xHint, tex('T_X') + ', the values ' + tex('X') + ' takes' + (m.tail ? ' (shown here)' : '') + ': ' + tex('\\{' + U.listTex(m.xs) + '\\}') + ' — ' + m.n + ' value' + (m.n > 1 ? 's' : '') + '.');
      drawAnswer(m, D);
      drawMap(m, D);
      drawGraph(m, D);
      drawPmf(m, D);
      drawCdf(m, D);
      drawTable(m, D);
      drawE(m, D);
    }
    function exampleD(m) {
      const p = m.ps.concat(m.groups.map(g => g.p)).find(q => q.d !== 1 && q.d !== m.D);
      return U.pTex(p, m.D) + '=' + U.fracTex(p);
    }
    const xT = (m, k) => U.vTex(m.xs[k]);
    const yT = (m, k) => U.vTex(m.ys[k], m.raws[k]);
    const gyT = g => U.vTex(g.value, g.raw);
    /** g(3)=(3-5)^{2}=4 */
    /** (3-5)^{2}=4, or just 4 when the substituted expression is already the value (g(x)=x, a constant g) */
    const gVal = (m, k) => { const mid = U.exprTex(m.src, { x: m.xs[k] }), y = yT(m, k), rel = U.eqv(m.ys[k], m.raws[k]); return mid === y && rel === '=' ? y : mid + rel + y; };
    const gSub = (m, k) => 'g(' + xT(m, k) + ')=' + gVal(m, k);

    function xDesc(m, D) {
      const i = m.Xi, q = i.q || {}, n = m.n;
      if (i.fam === 'uniform') {
        const a = Math.min(q.a, q.b), b = Math.max(q.a, q.b);
        return {
          short: tex('X\\sim\\text{Uniform}\\{' + U.vTex(a) + ',\\dots,' + U.vTex(b) + '\\}') + ': ' + n + ' equally likely value' + (n > 1 ? 's' : '') + ', each ' + tex('P(X=x)=' + U.pTex(F(1, n))),
          html: 'You chose ' + tex('X\\sim\\text{Uniform}\\{a,\\dots,b\\}') + ' with ' + tex('a=' + U.vTex(a)) + ' and ' + tex('b=' + U.vTex(b)) + '. That is ' + tex('b-a+1=' + U.vTex(b) + '-' + U.par(U.vTex(a)) + '+1=' + n) + ' value' + (n > 1 ? 's' : '') + ', each with the same probability',
          math: 'P(X=x)=\\frac{1}{b-a+1}=\\frac{1}{' + n + '}\\quad\\text{for } x=' + U.listTex(m.xs),
        };
      }
      if (i.fam === 'binomial') {
        const N = q.n, p = F(q.p), qq = F(1).sub(p), pT = U.pTex(p), qT = U.pTex(qq);
        const k0 = Math.min(3, N), C = Lab.math.choose(N, k0);
        const half = p.eq(F(1, 2));
        return {
          short: tex('X\\sim\\text{Bin}(' + N + ',' + pT + ')') + ': values ' + tex('0,1,\\dots,' + N),
          html: 'You chose ' + tex('X\\sim\\text{Bin}(n,p)') + ' with ' + tex('n=' + N) + ' and ' + tex('p=' + pT) + ', so ' + tex('1-p=' + qT) + '. For ' + tex('k=0,1,\\dots,' + N) + ':',
          math: 'P(X=k)=\\binom{n}{k}p^{k}(1-p)^{n-k}=\\binom{' + N + '}{k}\\left(' + pT + '\\right)^{k}\\left(' + qT + '\\right)^{' + N + '-k}' + (half ? '=\\frac{\\binom{' + N + '}{k}}{' + bigTex(Math.pow(2, N)) + '}' : ''),
          note: 'For example ' + tex('P(X=' + k0 + ')=\\binom{' + N + '}{' + k0 + '}\\left(' + pT + '\\right)^{' + k0 + '}\\left(' + qT + '\\right)^{' + (N - k0) + '}=' + C + '\\cdot ' + U.pTex(p.pow(k0)) + '\\cdot ' + U.pTex(qq.pow(N - k0)) + U.pEq(m.ps[k0], D)) + '.',
        };
      }
      if (i.fam === 'geometric') {
        const p = F(q.p), pT = U.pTex(p), t = m.tail, qT = U.pTex(t.qq), kk = Math.min(3, t.k);
        return {
          short: tex('X\\sim\\text{Geometric}(' + pT + ')') + ', shown for ' + tex('x=1,\\dots,' + t.k),
          html: 'You chose ' + tex('X\\sim\\text{Geometric}(p)') + ' on ' + tex('\\{1,2,3,\\dots\\}') + ' with ' + tex('p=' + pT) + ', so ' + tex('1-p=' + qT) + ':',
          math: 'P(X=k)=(1-p)^{k-1}p=\\left(' + qT + '\\right)^{k-1}\\cdot ' + pT,
          note: 'For example ' + tex('P(X=' + kk + ')=\\left(' + qT + '\\right)^{' + (kk - 1) + '}\\cdot ' + pT + U.pEq(m.ps[kk - 1], D)) + '. This lab shows ' + tex('k=1,\\dots,' + t.k) + ' (your “shown up to k”). The rest, ' + tex('P(X>' + t.k + ')=(1-p)^{' + t.k + '}=\\left(' + qT + '\\right)^{' + t.k + '}' + U.pEq(t.p, D)) + ', is <b>left out</b> of every table and sum below.',
        };
      }
      if (i.fam === 'poisson') {
        const lam = q['λ'], t = m.tail, k2 = Math.min(2, n - 1);
        const fact = k => { let r = 1; for (let j = 2; j <= k; j++) r *= j; return r; };
        return {
          short: tex('X\\sim\\text{Poisson}(' + lam + ')') + ', shown for ' + tex('x=0,\\dots,' + t.k),
          html: 'You chose ' + tex('X\\sim\\text{Poisson}(\\lambda)') + ' with ' + tex('\\lambda=' + lam) + '. For ' + tex('k=0,1,2,\\dots') + ':',
          math: 'P(X=k)=\\frac{e^{-\\lambda}\\lambda^{k}}{k!}=\\frac{e^{-' + lam + '}\\cdot ' + lam + '^{k}}{k!}',
          note: 'For example ' + tex('P(X=' + k2 + ')=\\frac{e^{-' + lam + '}\\cdot ' + lam + '^{' + k2 + '}}{' + k2 + '!}=\\frac{' + U.dec(Math.exp(-lam)) + '\\times' + U.dec(Math.pow(lam, k2)) + '}{' + fact(k2) + '}\\approx ' + U.dec(m.ps[k2])) + '. These are not fractions, so this lab uses decimals. Shown: ' + tex('k=0,\\dots,' + t.k) + '; the rest, ' + tex('P(X>' + t.k + ')=1-\\sum_{k=0}^{' + t.k + '}P(X=k)\\approx ' + U.dec(t.p)) + ', is <b>left out</b> of every table and sum below.',
        };
      }
      const terms = m.ps.map(p => U.pTex(p, D));
      return {
        short: 'the PMF you typed: ' + n + ' value' + (n > 1 ? 's' : ''),
        html: 'You typed the PMF of ' + tex('X') + ' yourself: ' + n + ' value' + (n > 1 ? 's' : '') + '. It is a valid PMF because the probabilities are ' + tex('\\ge 0') + ' and add up to 1:',
        math: '\\sum_x P(X=x)=' + U.sumTex(terms, 10) + '=' + U.pTex(m.total, D),
      };
    }
    function tailNote(m, D) {
      if (!m.tail) return '';
      return ' <span class="muted">(Only ' + tex('x\\le ' + m.tail.k) + ' is shown; the left-out tail has ' + tex('P(X>' + m.tail.k + ')' + (m.float ? '\\approx ' + U.dec(m.tail.p) : '=' + U.pTex(m.tail.p, D))) + '.)</span>';
    }

    /** P(Y=y) = P(X=a)+P(X=b) = p+p = total, for one group */
    function groupSum(m, g, D, prefix = true) {
      const y = gyT(g), k = g.from.length;
      const sym = k <= 4 ? g.from.map(i => 'P(X=' + xT(m, i) + ')').join('+') : '\\sum_{x:\\,g(x)=' + y + '}P(X=x)';
      const terms = g.from.map(i => U.pTex(m.ps[i], D));
      const nums = k > 8 && terms.every(t => t === terms[0]) ? k + '\\times ' + terms[0] : U.sumTex(terms);
      const rel = U.exact(g.p) ? '=' : '\\approx ';
      let s = (prefix ? 'P(Y=' + y + ')=' + sym + '=' : '') + (k > 1 ? nums + rel : '') + U.pTex(g.p, D);
      if (D && U.exact(g.p) && g.p.d !== D && g.p.d !== 1) s += '=' + U.fracTex(g.p);
      return s;
    }
    function verdictWords(m, D) {
      if (m.oneToOne) return '<b>One-to-one on ' + tex('T_X') + '</b>: the ' + m.n + ' values of ' + tex('g(x)') + ' are all different, so every probability keeps its size and only its label changes: ' + tex('P\\big(Y=g(x)\\big)=P(X=x)') + '.';
      const multi = m.groups.filter(g => g.from.length > 1);
      const g = multi[0];
      const ex = g.from.length <= 3 ? tex(g.from.map(k => 'g(' + xT(m, k) + ')').join('=') + '=' + gyT(g)) : g.from.length + ' values of ' + tex('x') + ' give ' + tex('g(x)=' + gyT(g));
      return '<b>Many-to-one on ' + tex('T_X') + '</b>: ' + m.n + ' values of ' + tex('X') + ' land on only ' + m.m + ' value' + (m.m > 1 ? 's' : '') + ' of ' + tex('Y') + '. For example ' + ex + ', so ' + tex(groupSum(m, g, D)) + '.';
    }

    /* ---------------- answer box */
    function drawAnswer(m, D) {
      const xd = xDesc(m, D);
      const ev = 'Your ' + tex('X') + ': ' + xd.short + '. Your function: ' + tex('g(x)=' + U.exprTex(m.src)) + '. So ' + tex('Y=g(X)=' + U.exprTex(m.src, { x: { tex: 'X' } })) + ', with ' + m.m + ' possible value' + (m.m > 1 ? 's' : '') + '.';
      const E = expectations(m);
      const sub = verdictWords(m, D) + '<br>Expected value: ' + tex('E[Y]=E[g(X)]' + U.numEq(E.e1)) + ' (computed two ways at the bottom).' + tailNote(m, D);
      K.setAnswer(ans, { ev, big: U.casesTex(m.groups, D, 'Y', 'y'), sub });
      // machine-readable copy of the result (exact strings), for checking
      const str = v => (U.exact(v) ? v.toString() : String(Number(v)));
      ans.dataset.pmf = JSON.stringify(m.groups.map(g => [U.exact(g.raw) ? g.raw.toString() : String(g.value), str(g.p)]));
      ans.dataset.e = str(E.e1) + '|' + str(E.e2);
    }

    /* ---------------- mapping picture */
    function drawMap(m, D) {
      const body = P.map.body;
      Lab.clear(body);
      runId++; busy = false;
      const stage = h('div', { class: 'map-stage gx-stage' });
      const read = h('div', { class: 'ws-readout gx-read' });
      const verdict = h('div', { class: 't4-verdict ' + (m.oneToOne ? 'one' : 'many') });
      body.append(stage, read,
        h('div', { class: 'btn-row' }, Lab.button('Send the probability along the arrows', () => flow(), 'btn primary sm'), Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => drawMap(model, dState(model).D), 'btn ghost sm')),
        verdict);
      view = m.n > 45 ? mapBig(m, D, stage, read) : mapSmall(m, D, stage, read);
      view.layer = h('div', { class: 'fx-layer' });
      stage.appendChild(view.layer);
      read.innerHTML = view.idle;
      Lab.setHTML(verdict, verdictHtml(m, D));
    }
    function idleText(m) {
      return '<span class="muted">' + (m.oneToOne ? 'No two arrows meet: ' + tex('g') + ' is <b>one-to-one</b> on ' + tex('T_X') + ', so the probabilities only move.' : 'Some arrows meet (violet): ' + tex('g') + ' is <b>many-to-one</b> on ' + tex('T_X') + ', so those probabilities add.') + ' Point at a value of ' + tex('X') + ' or of ' + tex('Y') + ', or press the button.</span>';
    }
    function mapSmall(m, D, stage, read) {
      const n = m.n, mm = m.m, rows = Math.max(n, mm);
      const rowH = rows <= 12 ? 32 : rows <= 24 ? 26 : 21;
      const xLab = m.xs.map(x => U.vTxt(x)), yLab = m.groups.map(g => U.vTxt(g.value, g.raw));
      const pxL = m.ps.map(p => U.pTxt(p, D));
      const pyL = m.groups.map(g => U.pTxt(g.p, D) + (g.from.length > 1 ? '  ← ' + g.from.length + ' arrows' : ''));
      const len = arr => Math.max(...arr.map(s => s.length));
      const wVL = len(xLab) * 8.4 + 14, wVR = len(yLab) * 8.4 + 14, wPL = len(pxL) * 6.7 + 10, wPR = len(pyL) * 6.7 + 10;
      const narrow = stage.clientWidth > 0 && stage.clientWidth < 560;
      const barMax = narrow ? 44 : 92, gap = narrow ? 120 : 200;
      const xL = 8 + wPL + barMax + wVL, xR = xL + gap;
      const Wd = Math.max(narrow ? 0 : 600, Math.ceil(xR + wVR + barMax + 10 + wPR));
      const padT = 30, H = padT + rows * rowH + 8;
      const offL = padT + ((rows - n) * rowH) / 2, offR = padT + ((rows - mm) * rowH) / 2;
      const yL = k => offL + k * rowH + rowH / 2, yR = r => offR + r * rowH + rowH / 2;
      const pmax = Math.max(...m.ps.map(Number), ...m.groups.map(g => Number(g.p))) || 1;
      const bw = p => (Number(p) > 0 ? Math.max(1.5, (Number(p) / pmax) * barMax) : 0);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'map-svg gx-map' + (rows > 24 ? ' tight' : '') + (narrow ? ' fit' : ''), role: 'img', 'aria-label': 'arrows from each value of X to g(x)' });
      s.appendChild(svg('text', { x: xL, y: 15, 'text-anchor': 'end', class: 'map-head x' }, 'values x of X'));
      s.appendChild(svg('text', { x: xR, y: 15, class: 'map-head z' }, 'values y = g(x) of Y'));
      const arrowsG = svg('g', {});
      s.appendChild(arrowsG);
      const merged = m.groups.map(g => g.from.length > 1);
      const L = m.xs.map((x, k) => {
        const yv = yL(k), w = bw(m.ps[k]), r = m.gi[k];
        const g = svg('g', { class: 'map-l' });
        g.appendChild(svg('rect', { x: xL - wVL - w, y: yv - 8, width: w, height: 16, rx: 4, class: 'mbar x' }));
        g.appendChild(svg('text', { x: xL - wVL - w - 6, y: yv + 4.5, 'text-anchor': 'end', class: 'map-p' }, pxL[k]));
        g.appendChild(svg('text', { x: xL - 10, y: yv + 5, 'text-anchor': 'end', class: 'map-val x' }, xLab[k]));
        const dot = svg('circle', { cx: xL, cy: yv, r: 4, class: 'map-dot x' });
        g.appendChild(dot);
        g.appendChild(svg('rect', { x: 0, y: yv - rowH / 2, width: xL + 8, height: rowH, class: 'gx-hit' }));
        const arrow = svg('path', { d: curve(xL + 6, yv, xR - 7, yR(r)), class: 'map-arrow' + (merged[r] ? ' mg' : '') });
        arrowsG.appendChild(arrow);
        g.addEventListener('mouseenter', () => focusX(k));
        g.addEventListener('mouseleave', () => focusX(null));
        s.appendChild(g);
        return { g, dot, arrow };
      });
      const R = m.groups.map((grp, r) => {
        const yv = yR(r);
        const g = svg('g', { class: 'map-r' + (merged[r] ? ' mg' : '') });
        const dot = svg('circle', { cx: xR, cy: yv, r: merged[r] ? 5 : 4, class: 'map-dot z' });
        const rect = svg('rect', { x: xR + wVR, y: yv - 8, width: bw(grp.p), height: 16, rx: 4, class: 'mbar z' });
        const pt = svg('text', { x: xR + wVR + bw(grp.p) + 6, y: yv + 4.5, class: 'map-p' }, pyL[r]);
        g.append(dot, svg('text', { x: xR + 10, y: yv + 5, class: 'map-val z' }, yLab[r]), rect, pt,
          svg('rect', { x: xR - 8, y: yv - rowH / 2, width: Wd - xR + 8, height: rowH, class: 'gx-hit' }));
        g.addEventListener('mouseenter', () => focusY(r));
        g.addEventListener('mouseleave', () => focusY(null));
        s.appendChild(g);
        return {
          g, dot,
          set(p, final) { const w = bw(p); rect.setAttribute('width', w); pt.setAttribute('x', xR + wVR + w + 6); pt.textContent = final ? pyL[r] : Number(p) > 0 ? U.pTxt(p, D) : ''; },
        };
      });
      stage.appendChild(s);
      const idle = idleText(m);
      function focusX(k) {
        if (busy) return;
        L.forEach((l, i) => { l.g.classList.toggle('dim', k != null && i !== k); l.arrow.classList.toggle('hot', i === k); });
        R.forEach((rr, i) => rr.g.classList.toggle('dim', k != null && i !== m.gi[k]));
        if (k == null) { Lab.setHTML(read, idle); return; }
        const g = m.groups[m.gi[k]];
        const others = g.from.filter(i => i !== k);
        Lab.setHTML(read, tex('X=' + xT(m, k) + '\\ \\Rightarrow\\ Y=' + gSub(m, k)) + ', carrying ' + tex('P(X=' + xT(m, k) + ')=' + U.pTex(m.ps[k], D)) + '.' +
          (others.length ? '<div>Also landing on ' + tex(gyT(g)) + ': ' + tex('x=' + U.listTex(others.map(i => m.xs[i]))) + '. So ' + tex(groupSum(m, g, D)) + '.</div>'
            : '<div class="xs muted">No other value of ' + tex('X') + ' lands on ' + tex(gyT(g)) + ', so ' + tex('P(Y=' + gyT(g) + ')=P(X=' + xT(m, k) + ')=' + U.pTex(m.ps[k], D)) + '.</div>'));
      }
      function focusY(r) {
        if (busy) return;
        const g = m.groups[r];
        L.forEach((l, i) => { const on = r != null && m.gi[i] === r; l.g.classList.toggle('dim', r != null && !on); l.arrow.classList.toggle('hot', on); });
        R.forEach((rr, i) => rr.g.classList.toggle('dim', r != null && i !== r));
        if (r == null) { Lab.setHTML(read, idle); return; }
        Lab.setHTML(read, tex('Y=' + gyT(g)) + ' collects ' + (g.from.length === 1 ? 'one arrow, from ' + tex('x=' + xT(m, g.from[0])) : g.from.length + ' arrows, from ' + tex('x=' + U.listTex(g.from.map(i => m.xs[i])))) + ':<div>' + tex(groupSum(m, g, D)) + '</div>');
      }
      const items = m.xs.map((x, k) => ({ from: L[k].dot, to: R[m.gi[k]].dot, p: m.ps[k], r: m.gi[k], arrows: [L[k].arrow], label: pxL[k] }));
      return { R, items, idle, reset: () => R.forEach(rr => rr.set(0)), finish: () => R.forEach((rr, r) => rr.set(m.groups[r].p, true)) };
    }
    /** big supports: one row per value of Y (runs of one-to-one values become one band) */
    function mapBlocks(m) {
      const gs = m.groups, blocks = [];
      let k = 0;
      while (k < gs.length) {
        if (gs[k].from.length === 1) {
          let j = k, dir = 0;
          while (j + 1 < gs.length && gs[j + 1].from.length === 1 && U.peq(gs[j + 1].p, gs[k].p)) {
            const d = gs[j + 1].from[0] - gs[j].from[0];
            if (Math.abs(d) !== 1 || (dir && d !== dir)) break;
            dir = d; j++;
          }
          if (j - k + 1 >= 4) { blocks.push({ type: 'band', a: k, b: j }); k = j + 1; continue; }
        }
        blocks.push({ type: 'one', a: k, b: k }); k++;
      }
      if (blocks.length <= 30) return blocks;
      const head = blocks.slice(0, 18), tail = blocks.slice(-8), mid = blocks.slice(18, -8);
      return head.concat([{ type: 'gap', a: mid[0].a, b: mid[mid.length - 1].b }], tail);
    }
    function mapBig(m, D, stage, read) {
      const blocks = mapBlocks(m);
      const rowH = 50, padT = 30, H = padT + blocks.length * rowH + 8, Wd = 720, xL = 300, xR = 430, barMax = 70;
      const pmax = Math.max(...m.groups.map(g => Number(g.p))) || 1;
      const bw = p => (Number(p) > 0 ? Math.max(1.5, (Number(p) / pmax) * barMax) : 0);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'map-svg gx-map big', role: 'img', 'aria-label': 'arrows from the values of X to g(x), grouped' });
      s.appendChild(svg('text', { x: xL, y: 15, 'text-anchor': 'end', class: 'map-head x' }, 'values x of X (' + K.fmtInt(m.n) + ' in all)'));
      s.appendChild(svg('text', { x: xR, y: 15, class: 'map-head z' }, 'values y = g(x) of Y (' + K.fmtInt(m.m) + ' in all)'));
      const R = [], items = [], rows = [];
      blocks.forEach((b, i) => {
        const yv = padT + i * rowH + rowH / 2;
        const g = svg('g', { class: 'map-r gx-block' });
        if (b.type === 'gap') {
          const ys = m.groups.slice(b.a, b.b + 1);
          g.appendChild(svg('text', { x: (xL + xR) / 2, y: yv + 4, 'text-anchor': 'middle', class: 'gx-gap' }, '⋮  ' + K.fmtInt(ys.length) + ' more values of Y here: y = ' + U.listTxt(ys.map(q => q.value), ys.map(q => q.raw)) + '  (all in the tables below)'));
          s.appendChild(g);
          rows.push(null);
          return;
        }
        const gs = m.groups.slice(b.a, b.b + 1);
        const ks = b.type === 'band' ? gs.map(q => q.from[0]) : gs[0].from;
        const ksSorted = ks.slice().sort((p, q) => p - q);
        const pTot = U.sum(gs.map(q => q.p));
        const each = ksSorted.every(k => U.peq(m.ps[k], m.ps[ksSorted[0]])) ? U.pTxt(m.ps[ksSorted[0]], D) : null;
        const xLine = ksSorted.length === 1 ? 'x = ' + U.vTxt(m.xs[ksSorted[0]]) : 'x = ' + U.listTxt(ksSorted.map(k => m.xs[k]));
        const xSub = ksSorted.length === 1 ? 'P(X = x) = ' + U.pTxt(m.ps[ksSorted[0]], D) : K.fmtInt(ksSorted.length) + ' values' + (each ? ', each ' + each : '');
        g.appendChild(svg('text', { x: xL - 12, y: yv - 3, 'text-anchor': 'end', class: 'map-val x' }, xLine));
        g.appendChild(svg('text', { x: xL - 12, y: yv + 13, 'text-anchor': 'end', class: 'map-p' }, xSub));
        const dotL = svg('circle', { cx: xL, cy: yv, r: 4, class: 'map-dot x' });
        const dotR = svg('circle', { cx: xR, cy: yv, r: b.type === 'one' && gs[0].from.length > 1 ? 5.5 : 4, class: 'map-dot z' });
        const arrows = [];
        const merge = b.type === 'one' && gs[0].from.length > 1;
        const offs = b.type === 'band' || merge ? [-9, 0, 9] : [0];
        offs.forEach(o => {
          const a = svg('path', { d: curve(xL + 6, yv + o, xR - 7, yv + (b.type === 'band' ? o : 0)), class: 'map-arrow' + (merge ? ' mg' : '') });
          arrows.push(a); g.appendChild(a);
        });
        if (offs.length > 1) g.appendChild(svg('text', { x: (xL + xR) / 2, y: yv - 13, 'text-anchor': 'middle', class: 'gx-count' + (merge ? ' mg' : '') }, K.fmtInt(ksSorted.length) + ' arrows'));
        const yLine = gs.length === 1 ? 'y = ' + U.vTxt(gs[0].value, gs[0].raw) : 'y = ' + U.listTxt(gs.map(q => q.value), gs.map(q => q.raw));
        const yFinal = gs.length === 1 ? 'P(Y = y) = ' + U.pTxt(gs[0].p, D) : K.fmtInt(gs.length) + ' values, each ' + U.pTxt(gs[0].p, D) + ' (bar: all ' + K.fmtInt(gs.length) + ' together, ' + U.pTxt(pTot, D) + ')';
        const rect = svg('rect', { x: xR + 12, y: yv + 5, width: bw(gs.length === 1 ? gs[0].p : pTot), height: 9, rx: 3, class: 'mbar z' });
        const yText = svg('text', { x: xR + 12, y: yv - 1, class: 'map-val z' }, yLine);
        const pText = svg('text', { x: xR + 18 + barMax, y: yv + 13, class: 'map-p' }, yFinal);
        g.append(dotL, dotR, yText, rect, pText, svg('rect', { x: 0, y: yv - rowH / 2, width: Wd, height: rowH, class: 'gx-hit' }));
        g.addEventListener('mouseenter', () => focusB(i));
        g.addEventListener('mouseleave', () => focusB(null));
        s.appendChild(g);
        const ri = R.length;
        R.push({ g, dot: dotR, set(p, final) { rect.setAttribute('width', bw(p)); pText.textContent = final ? yFinal : Number(p) > 0 ? 'so far ' + U.pTxt(p, D) : ''; } });
        R[ri].full = gs.length === 1 ? gs[0].p : pTot;
        items.push({ from: dotL, to: dotR, p: R[ri].full, r: ri, arrows, label: gs.length === 1 ? U.pTxt(gs[0].p, D) : U.pTxt(pTot, D) });
        rows.push({ b, gs, ks: ksSorted, g });
      });
      stage.appendChild(s);
      const idle = idleText(m) + '<div class="xs muted">' + K.fmtInt(m.n) + ' values are too many to draw one by one, so each row is a whole set of values. Violet fans: many values of ' + tex('X') + ' land on one ' + tex('y') + '. Grey bands: a run of values that map one-to-one.</div>';
      function focusB(i) {
        if (busy) return;
        rows.forEach((r, j) => { if (r) r.g.classList.toggle('dim', i != null && j !== i); });
        if (i == null) { Lab.setHTML(read, idle); return; }
        const r = rows[i];
        if (r.b.type === 'band') {
          const a = r.gs[0], z = r.gs[r.gs.length - 1];
          Lab.setHTML(read, 'A one-to-one run: each of the ' + K.fmtInt(r.gs.length) + ' values ' + tex('y=' + U.listTex(r.gs.map(q => q.value), r.gs.map(q => q.raw))) + ' comes from exactly one ' + tex('x') + ' — from ' + tex(gSub(m, a.from[0])) + ' to ' + tex(gSub(m, z.from[0])) + '.<div>' + tex('P(Y=y)=P(X=x)=' + U.pTex(a.p, D)) + ' for each of them.</div>');
        } else {
          const g = r.gs[0];
          Lab.setHTML(read, (g.from.length === 1 ? tex(gSub(m, g.from[0])) : g.from.length + ' values ' + tex('x=' + U.listTex(g.from.map(k => m.xs[k]))) + ' all give ' + tex('g(x)=' + gyT(g)) + ' — for example ' + tex(gSub(m, g.from[0])) + '.') + '<div>' + tex(groupSum(m, g, D)) + '</div>');
        }
      }
      return { R, items, idle, reset: () => R.forEach(rr => rr.set(0)), finish: () => R.forEach(rr => rr.set(rr.full, true)) };
    }
    async function flow() {
      if (!view || busy) return;
      busy = true;
      const my = ++runId, v = view, read = P.map.body.querySelector('.gx-read');
      try {
        v.reset();
        const acc = v.R.map(() => F(0));
        const jobs = [];
        Lab.setHTML(read, 'Every value of ' + tex('X') + ' sends its probability along its arrow…');
        for (const it of v.items) {
          if (my !== runId) return;
          it.arrows.forEach(a => a.classList.add('hot'));
          const tok = h('span', { class: 'map-tok', text: it.label });
          jobs.push(Lab.fly(it.from, it.to, v.layer, { ms: 900, ghost: tok, scale: 1, arc: 0, fadeOut: false }).then(() => {
            if (my !== runId) return;
            acc[it.r] = U.add(acc[it.r], it.p);
            v.R[it.r].set(acc[it.r]);
            Lab.pulse(v.R[it.r].g);
          }));
          await Lab.sleep(v.items.length > 20 ? 55 : 150);
        }
        await Promise.all(jobs);
        if (my !== runId) return;
        v.finish();
        v.items.forEach(it => it.arrows.forEach(a => a.classList.remove('hot')));
        Lab.setHTML(read, 'Done. Each value ' + tex('y') + ' collected the probability of every ' + tex('x') + ' whose arrow points to it: ' + tex('P(Y=y)=\\sum_{x:\\,g(x)=y}P(X=x)') + '. ' + (model.oneToOne ? 'Here every ' + tex('y') + ' got exactly one arrow.' : 'Violet values got two or more arrows, so their bars are longer.'));
      } finally { if (my === runId) busy = false; }
    }
    function verdictHtml(m, D) {
      let html = '<div class="t4-v-title">Is ' + tex('g') + ' one-to-one on ' + tex('T_X') + '?</div>';
      if (m.oneToOne) {
        html += '<b>Yes.</b> The ' + m.n + ' values of ' + tex('g(x)') + ' (one for each value of ' + tex('X') + ') are all different' + (m.n <= 11 ? ': ' + tex(m.xs.map((x, k) => yT(m, k)).join(',\\ ')) : '') + '. No two arrows meet, so for every ' + tex('x') + ' the events are the same, ' + tex('\\{Y=g(x)\\}=\\{X=x\\}') + ', and ' + tex('P\\big(Y=g(x)\\big)=P(X=x)') + '.';
      } else {
        const multi = m.groups.filter(g => g.from.length > 1);
        html += '<b>No — many-to-one.</b> ' + m.n + ' values of ' + tex('X') + ' land on only ' + m.m + ' value' + (m.m > 1 ? 's' : '') + ' of ' + tex('Y') + '. ' + multi.length + ' value' + (multi.length > 1 ? 's' : '') + ' of ' + tex('y') + (multi.length > 1 ? ' are' : ' is') + ' hit by two or more values of ' + tex('x') + ' — these are the collisions:';
        html += '<ul class="t4-coll">' + multi.slice(0, 6).map(g => '<li>' + collision(m, g, D) + '</li>').join('') + '</ul>';
        if (multi.length > 6) html += '<div class="xs muted">… and ' + (multi.length - 6) + ' more values of ' + tex('y') + ' with two or more ' + tex('x') + '’s (all of them are in the table method below).</div>';
      }
      html += '<div class="xs muted">The check uses ' + tex('T_X') + ', the values ' + tex('X') + ' really takes. The same ' + tex('g') + ' can be one-to-one for another ' + tex('X') + ' (for example ' + tex('x^2') + ' on ' + tex('\\{0,\\dots,10\\}') + ' but not on ' + tex('\\{-5,\\dots,5\\}') + ').</div>';
      return html;
    }
    function collision(m, g, D) {
      const y = gyT(g);
      const line = g.from.length <= 3
        ? g.from.map(k => tex(gSub(m, k))).join(' and ')
        : g.from.length + ' values ' + tex('x=' + U.listTex(g.from.map(k => m.xs[k]))) + ' all give ' + tex('g(x)=' + y) + ' (for example ' + tex(gSub(m, g.from[0])) + ')';
      return line + '<br>' + tex('\\Rightarrow\\ ' + groupSum(m, g, D));
    }

    /* ---------------- the graph of g and the horizontal-line test (L2.3 min 14–15; L2.4 min 01–02 and 07–08) */
    const INT_ONLY = /\b(C|nCr|P|nPr|fact)\s*\(/;   // defined only at whole numbers: join the dots instead of drawing g
    const nearV = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    const keyOf = v => String(Number(Number(v).toPrecision(12)));   // the same "equal values" rule as build()
    const groupAt = (m, v) => (typeof v === 'number' && isFinite(v) ? m.groups.find(g => nearV(g.value, v)) || null : null);
    const niceStep = s => { const e = Math.pow(10, Math.floor(Math.log10(s))), f = s / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; };
    /** the height c for a new model: the example's c, else the old c while it is still a value of Y, else the biggest collision */
    function pickLevel(m) {
      const want = pendingHc;
      pendingHc = null;
      if (groupAt(m, want)) return want;
      if (groupAt(m, st.hc)) return st.hc;
      const multi = m.groups.filter(g => g.from.length > 1);
      return (multi.length ? multi.reduce((a, q) => (q.from.length > a.from.length ? q : a)) : m.groups[Math.floor((m.m - 1) / 2)]).value;
    }
    /** directions of the dots from left to right: 1 up, -1 down, 0 flat (a run of the same direction counts once) */
    function runs(m) {
      const out = [];
      for (let k = 0; k + 1 < m.n; k++) {
        const s = keyOf(m.ys[k + 1]) === keyOf(m.ys[k]) ? 0 : m.ys[k + 1] > m.ys[k] ? 1 : -1;
        if (!out.length || out[out.length - 1] !== s) out.push(s);
      }
      return out;
    }
    function shapeWords(m, rs) {
      if (rs.length > 4) return rs.includes(1) && rs.includes(-1) ? 'up and down several times' : (rs.includes(1) ? 'up' : 'down') + ' in steps, with flat stretches';
      let s = rs.map(r => (r > 0 ? 'up' : r < 0 ? 'down' : 'flat')).join(', then ');
      if (rs.length === 2 && rs[0] === -1 && rs[1] === 1) s += ' (a cup, lowest at ' + tex('x=' + xT(m, m.ys.indexOf(Math.min(...m.ys)))) + ')';
      if (rs.length === 2 && rs[0] === 1 && rs[1] === -1) s += ' (a cap, highest at ' + tex('x=' + xT(m, m.ys.indexOf(Math.max(...m.ys)))) + ')';
      return s;
    }
    /** one-to-one or many-to-one, with the reason; chips draw every line that meets two or more dots */
    function graphVerdict(m, D, setLevel) {
      const el = h('div', { class: 't4-verdict gxg-verdict ' + (m.oneToOne ? 'one' : 'many') });
      const rs = runs(m), mono = rs.length === 1 ? rs[0] : 0;
      let html = '<div class="t4-v-title">The horizontal-line test at the values of ' + tex('X') + '</div>';
      if (m.n === 1) html += '<b>Passes: one-to-one.</b> ' + tex('X') + ' has one value, so the graph is a single dot and no line can meet it twice.';
      else if (m.oneToOne && mono) {
        html += '<b>Passes: one-to-one.</b> The dots ' + (mono > 0 ? 'climb' : 'fall') + ' from left to right, so ' + tex('g') + ' is ' + (mono > 0 ? 'increasing' : 'decreasing') + ' on ' + tex('T_X') + '. No two dots are at the same height, so every horizontal line meets at most one dot. This is the lecture’s rule: monotonic ⇒ one-to-one (L2.3, min 14–15).';
      } else if (m.oneToOne) {
        html += '<b>Passes: one-to-one on ' + tex('T_X') + '</b>, although ' + tex('g') + ' is not monotonic here: the dots go ' + shapeWords(m, rs) + '. Still, no two dots are at the same height, so no horizontal line meets two of them. Some lines cut the grey curve twice between the dots, but ' + tex('X') + ' never takes those in-between values. Only the dots count, just as only the rows of the table count.';
      } else {
        const cur = groupAt(m, st.hc);
        const g = cur && cur.from.length > 1 ? cur : m.groups.find(q => q.from.length > 1);
        const ks = g.from;
        html += '<b>Fails: many-to-one.</b> The line ' + tex('y=' + gyT(g)) + ' meets ' + ks.length + ' dots: ' + (ks.length <= 3 ? ks.map(k => tex(gSub(m, k))).join(' and ') : tex('x=' + U.listTex(ks.map(k => m.xs[k]))) + ', for example ' + tex(gSub(m, ks[0]))) + '. ';
        if (rs.includes(1) && rs.includes(-1)) html += 'The dots go ' + shapeWords(m, rs) + '. A graph that goes down and comes back up, or up and then down, is cut twice by some horizontal line (L2.4, min 07–08). ';
        if (rs.length === 1 && rs[0] === 0) html += 'All the dots are at one height: ' + tex('g') + ' is constant on ' + tex('T_X') + '.';
        else if (rs.includes(0)) html += 'Where the dots stay flat (they go ' + shapeWords(m, rs) + '), neighbouring values of ' + tex('X') + ' share one height.';
      }
      Lab.setHTML(el, html);
      if (!m.oneToOne) {
        const multi = m.groups.filter(q => q.from.length > 1);
        el.appendChild(K.note(multi.length + ' horizontal line' + (multi.length > 1 ? 's meet' : ' meets') + ' two or more dots' + (multi.length > 8 ? ' (the first 8 are here)' : '') + '. Tap one to draw it:', 'xs muted gxg-chiph'));
        const chips = h('div', { class: 'pl-chips gxg-chips' });
        multi.slice(0, 8).forEach(q => chips.appendChild(Lab.button(tex('y=' + gyT(q)) + '<span class="muted"> · ' + q.from.length + ' dots</span>', () => setLevel(q.value, q.raw, 'chip'), 'btn xs')));
        el.appendChild(chips);
      }
      return el;
    }
    /** what the line y = c meets, with the numbers: the x's, their g(x), and P(Y = c) as their sum */
    function levelRead(m, D, v, raw, curveOK) {
      const g = groupAt(m, v);
      if (!g) {
        const cT = U.exact(raw) ? U.vTex(Number(raw), raw) : U.vTex(v);
        const lo = m.groups[0], hi = m.groups[m.m - 1];
        const where = v < lo.value ? 'below every dot (the smallest value of ' + tex('Y') + ' is ' + tex(gyT(lo)) + ')'
          : v > hi.value ? 'above every dot (the largest value of ' + tex('Y') + ' is ' + tex(gyT(hi)) + ')'
            : 'between the dots: no value of ' + tex('X') + ' has ' + tex('g(x)=' + cT);
        return 'The line ' + tex('y=' + cT) + ' meets <b>no dot</b>: it passes ' + where + '. So ' + tex(cT) + ' is not a value of ' + tex('Y') + ', and ' + tex('P(Y=' + cT + ')=0') + '.' +
          (curveOK && v > lo.value && v < hi.value ? '<div class="xs muted">It may still cross the grey curve, at an ' + tex('x') + ' that ' + tex('X') + ' never takes.</div>' : '');
      }
      const c = gyT(g), ks = g.from;
      if (ks.length === 1) {
        const k = ks[0];
        return 'The line ' + tex('y=' + c) + ' meets <b>one dot</b>, at ' + tex('x=' + xT(m, k)) + ': ' + tex(gSub(m, k)) + '. Only this value of ' + tex('X') + ' gives ' + tex('g(x)=' + c) + ', so ' + tex('P(Y=' + c + ')=P(X=' + xT(m, k) + ')=' + U.pTex(m.ps[k], D)) + '.';
      }
      return 'The line ' + tex('y=' + c) + ' meets <b>' + ks.length + ' dots</b>, at ' + tex('x=' + U.listTex(ks.map(k => m.xs[k]))) + ': ' +
        (ks.length <= 3 ? ks.map(k => tex(gSub(m, k))).join(' and ') : 'for example ' + tex(gSub(m, ks[0])) + ' and ' + tex(gSub(m, ks[ks.length - 1]))) + '. ' +
        ks.length + ' values of ' + tex('X') + ' give the same ' + tex('y') + ', so this one line already shows that ' + tex('g') + ' is many-to-one. Their probabilities add:<div>' + tex(groupSum(m, g, D)) + '</div>';
    }
    /** the height c: a box (any number) + a slider through the values of Y and the gaps between them + previous/next */
    function levelControl(m, onSet) {
      const input = h('input', { class: 'field mono pl-num gxg-cin', type: 'text', inputmode: 'decimal', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'height c of the line y = c' });
      const range = h('input', { class: 'slider pl-range', type: 'range', min: 0, max: 1, step: 1, value: 0, 'aria-label': 'slide the line y = c through the values of Y' });
      const hint = h('div', { class: 'pl-hint' });
      const lab = h('label', { class: 'pl-label' });
      Lab.setHTML(lab, 'Height ' + tex('c') + ' of the line ' + tex('y=c') + ': type any number, or slide through the values of ' + tex('Y'));
      const el = h('div', { class: 'pl-field gxg-ctl' }, lab, h('div', { class: 'pl-row' }, input, range),
        h('div', { class: 'gxy-cbar' }, Lab.button('← lower value', () => jump(-1), 'btn xs'), Lab.button('higher value →', () => jump(1), 'btn xs')), hint);
      const zs = m.groups.map(g => g.value);
      let gap = Infinity;
      for (let k = 1; k < zs.length; k++) gap = Math.min(gap, zs[k] - zs[k - 1]);
      if (!(gap > 0 && isFinite(gap))) gap = 1;
      const stops = [zs[0] - gap / 2];
      zs.forEach((z, k) => stops.push(z, k + 1 < zs.length ? (z + zs[k + 1]) / 2 : z + gap / 2));
      range.max = String(stops.length - 1);
      function paint(v, raw) {
        input.value = U.exact(raw) && raw.d !== 1 && !K.exactDecimal(raw) ? raw.toString() : String(Number(Number(v).toPrecision(10)));
        let best = 0;
        stops.forEach((s, k) => { if (Math.abs(s - v) < Math.abs(stops[best] - v)) best = k; });
        range.value = String(best);
        range.style.setProperty('--pct', (stops.length > 1 ? (best / (stops.length - 1)) * 100 : 0) + '%');
        input.classList.remove('bad');
        Lab.setHTML(hint, '');
      }
      function jump(dir) {
        const v = st.hc;
        let g = null;
        if (dir > 0) g = m.groups.find(q => q.value > v && !nearV(q.value, v));
        else for (let k = m.m - 1; k >= 0; k--) if (m.groups[k].value < v && !nearV(m.groups[k].value, v)) { g = m.groups[k]; break; }
        if (g) onSet(g.value, g.raw, 'jump');
      }
      range.addEventListener('input', () => { const v = stops[+range.value], g = groupAt(m, v); onSet(v, g ? g.raw : undefined, 'range'); });
      input.addEventListener('input', Lab.debounce(() => {
        const f = K.parseNum(input.value);
        if (f == null || !isFinite(Number(f))) { input.classList.add('bad'); Lab.setHTML(hint, '<span class="cbad">Type a number, for example 4, 2.5 or 1/3.</span>'); return; }
        input.classList.remove('bad');
        Lab.setHTML(hint, '');
        onSet(Number(f), U.exact(f) ? f : undefined, 'box');
      }, 300));
      return { el, paint };
    }
    function drawGraph(m, D) {
      const body = P.graph.body;
      Lab.clear(body);
      if (!GR || GR.m !== m) { st.hc = pickLevel(m); st.hcRaw = undefined; }
      const stage = h('div', { class: 'gxg-stage' });
      body.appendChild(stage);
      // sizes from the layout width (clientWidth), never getBoundingClientRect: the content can be zoomed
      const Wd = Math.round(Math.max(300, Math.min(780, stage.clientWidth || 640)));
      const narrow = Wd < 520;
      const H = Math.round(Math.max(240, Math.min(340, Wd * 0.52)));
      const n = m.n, xs = m.xs, ys = m.ys;
      const xlo = xs[0], xhi = xs[n - 1], ylo = m.groups[0].value, yhi = m.groups[m.m - 1].value;
      let minGap = Infinity;
      for (let k = 1; k < n; k++) minGap = Math.min(minGap, xs[k] - xs[k - 1]);
      const xsp = xhi - xlo, ysp = yhi - ylo;
      const padX = xsp > 0 ? Math.max(0.03 * xsp, Math.min(0.5 * minGap, 0.08 * xsp)) : 1;
      const padY = ysp > 0 ? 0.08 * ysp : 1;
      const x0 = xlo - padX, x1 = xhi + padX, y0 = ylo - padY, y1 = yhi + padY;
      const yt = U.niceTicks(y0, y1, narrow ? 4 : 6).filter(v => v >= y0 && v <= y1);
      const ml = Math.round(Math.max(34, 14 + 6.6 * Math.max(1, ...yt.map(v => U.vTxt(v).length)))), mr = 16, mt = 26, mb = 40;
      const pw = Wd - ml - mr, ph = H - mt - mb;
      const X = v => ml + ((v - x0) / (x1 - x0)) * pw;
      const Y = v => mt + (1 - (v - y0) / (y1 - y0)) * ph;
      const yOf = py => y0 + (1 - (py - mt) / ph) * (y1 - y0);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'gxg-svg' + (n > 150 ? ' big' : ''), role: 'img', 'aria-label': 'the graph of g at the values of X, with the horizontal line y = c' });
      const clip = Lab.uid('gxgclip');
      s.appendChild(svg('defs', {}, svg('clipPath', { id: clip }, svg('rect', { x: ml, y: mt, width: pw, height: ph }))));
      s.appendChild(svg('rect', { x: ml, y: mt, width: pw, height: ph, rx: 6, class: 'gxg-frame' }));
      yt.forEach(v => {
        s.appendChild(svg('line', { x1: ml, x2: ml + pw, y1: Y(v), y2: Y(v), class: 'gxg-grid' }));
        s.appendChild(svg('text', { x: ml - 7, y: Y(v) + 4, 'text-anchor': 'end', class: 'gxg-tick' }, U.vTxt(v)));
      });
      // x ticks at the values of X while their labels fit side by side; round numbers for big supports
      const tickEls = new Array(n).fill(null);
      const xTick = (v, k) => {
        s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: mt + ph, y2: mt + ph + 5, class: 'gxg-axis' }));
        const t = svg('text', { x: X(v), y: mt + ph + 18, 'text-anchor': 'middle', class: 'gxg-tick x' }, U.vTxt(v));
        s.appendChild(t);
        if (k != null) tickEls[k] = t;
      };
      if (n <= 30) { let right = -Infinity; xs.forEach((x, k) => { const w = U.vTxt(x).length * 7 + 8, px = X(x); if (px - w / 2 >= right) { xTick(x, k); right = px + w / 2; } }); }
      else U.niceTicks(xlo, xhi, narrow ? 5 : 8).forEach(v => xTick(v, null));
      s.appendChild(svg('text', { x: ml + pw, y: H - 4, 'text-anchor': 'end', class: 'gxg-axname x' }, 'x, the values of X'));
      s.appendChild(svg('text', { x: ml, y: 16, class: 'gxg-axname y' }, 'y = g(x)'));
      // g between the values (grey), or the dots joined in order when g is defined only at whole numbers
      const layer = svg('g', { 'clip-path': 'url(#' + clip + ')' });
      s.appendChild(layer);
      const curveOK = n > 1 && !INT_ONLY.test(m.src);
      let d = '';
      if (curveOK) {
        const f = Lab.expr.compile(m.src);
        const gAt = x => { try { const r = Lab.expr.num(f({ x })); return typeof r === 'number' && isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
        const N = Math.max(160, Math.min(720, Math.round(pw * 1.2)));
        const lim = v => Math.max(-4 * H, Math.min(5 * H, v));
        let prev = null;
        for (let k = 0; k <= N; k++) {
          const xv = xlo + (xsp * k) / N, yv = gAt(xv);
          if (!isFinite(yv)) { prev = null; continue; }
          let pen = !!prev;
          // a jump (floor, round, mod …) is not drawn as a steep line: the midpoint is not halfway between
          if (prev && Math.abs(yv - prev[1]) > 0.02 * (y1 - y0)) {
            const ym = gAt((prev[0] + xv) / 2);
            if (!isFinite(ym) || Math.abs(ym - (prev[1] + yv) / 2) > 0.35 * Math.abs(yv - prev[1])) pen = false;
          }
          d += (pen ? 'L' : 'M') + X(xv).toFixed(1) + ',' + lim(Y(yv)).toFixed(1);
          prev = [xv, yv];
        }
      } else if (n > 1) d = xs.map((x, k) => (k ? 'L' : 'M') + X(x).toFixed(1) + ',' + Y(ys[k]).toFixed(1)).join('');
      if (d) layer.appendChild(svg('path', { d, class: 'gxg-curve' + (curveOK ? '' : ' joined') }));
      const drops = svg('g', { class: 'gxg-drops' });
      s.appendChild(drops);
      const lineG = svg('g', { class: 'gxg-level' });
      const hline = svg('line', { x1: ml, x2: ml + pw, y1: 0, y2: 0, class: 'gxg-hline' });
      const strip = svg('rect', { x: ml, y: 0, width: pw, height: 28, class: 'gxg-strip' });
      const knob = svg('circle', { cx: ml + pw, cy: 0, r: 7, class: 'gxg-knob' });
      lineG.append(hline, strip, knob);
      s.appendChild(lineG);
      const big = n > 150;
      const dots = xs.map((x, k) => {
        const g = svg('g', { class: 'gxg-pt' + (Number(m.ps[k]) > 0 ? '' : ' zero') });
        g.appendChild(svg('circle', { cx: X(x), cy: Y(ys[k]), r: big ? 2.6 : narrow ? 4.4 : 5.2, class: 'gxg-dot' }));
        g.appendChild(svg('title', {}, 'x = ' + U.vTxt(x) + ':  g(x) = ' + U.vTxt(ys[k], m.raws[k]) + ',  P(X = x) = ' + U.pTxt(m.ps[k], D) + '. Tap to draw the line through this dot.'));
        g.addEventListener('click', ev => { ev.stopPropagation(); setLevel(ys[k], m.raws[k], 'dot'); });
        s.appendChild(g);
        return g;
      });
      const cLab = svg('text', { x: ml + pw - 14, y: 0, 'text-anchor': 'end', class: 'gxg-clab' }, '');
      s.appendChild(cLab);
      stage.appendChild(s);
      // drag the line (mouse anywhere, a finger on the line), or tap anywhere to move it there
      const toPy = ev => { const ctm = s.getScreenCTM(); return ctm ? new DOMPoint(ev.clientX, ev.clientY).matrixTransform(ctm.inverse()).y : null; };
      function fromPy(py) {
        let best = null, bd = 8;
        m.groups.forEach(g => { const dd = Math.abs(Y(g.value) - py); if (dd < bd) { bd = dd; best = g; } });
        if (best) return [best.value, best.raw];
        const v = yOf(Math.max(mt, Math.min(mt + ph, py))), stp = niceStep((y1 - y0) / 200);
        return [Number((Math.round(v / stp) * stp).toPrecision(12)), undefined];
      }
      let dragging = false, raf = 0, lastPy = null;
      const moveTo = ev => {
        const py = toPy(ev);
        if (py == null) return;
        lastPy = py;
        if (!raf) raf = requestAnimationFrame(() => { raf = 0; const [v, raw] = fromPy(lastPy); setLevel(v, raw, 'drag'); });
      };
      s.addEventListener('pointerdown', ev => {
        if (ev.button > 0 || ev.target.closest('.gxg-pt')) return;
        const onLine = ev.target === strip || ev.target === knob || ev.target === hline;
        if (ev.pointerType === 'touch' && !onLine) return;   // a finger elsewhere scrolls the page; its tap still moves the line
        dragging = true;
        try { s.setPointerCapture(ev.pointerId); } catch (e) { /* capture is optional */ }
        moveTo(ev);
        ev.preventDefault();
      });
      s.addEventListener('pointermove', ev => { if (dragging) moveTo(ev); });
      const endDrag = () => { if (dragging) save(); dragging = false; };
      s.addEventListener('pointerup', endDrag);
      s.addEventListener('pointercancel', endDrag);
      s.addEventListener('click', ev => {
        if (ev.target.closest('.gxg-pt')) return;
        const py = toPy(ev);
        if (py == null) return;
        const [v, raw] = fromPy(py);
        setLevel(v, raw, 'tap');
      });
      const legend = h('div', { class: 'gxy-legend gxg-legend' });
      Lab.setHTML(legend, '<span><i class="x"></i>a value of ' + tex('X') + ': the dot ' + tex('(x,g(x))') + '</span><span><i class="on"></i>a dot on the line</span><span><i class="line"></i>the line ' + tex('y=c') + '</span>' +
        (d ? '<span><i class="curve' + (curveOK ? '' : ' joined') + '"></i>' + (curveOK ? tex('g(x)') + ' between the values (' + tex('X') + ' never takes these)' : 'the dots joined in order (' + tex('g') + ' is defined only at whole numbers)') + '</span>' : '') +
        (m.ps.some(p => !(Number(p) > 0)) ? '<span><i class="zero"></i>' + tex('P(X=x)=0') + '</span>' : ''));
      const ctl = levelControl(m, (v, raw, from) => setLevel(v, raw, from));
      const read = h('div', { class: 'ws-readout gxg-read' });
      body.append(legend, ctl.el, read);
      function setLevel(v, raw, from) {
        if (typeof v !== 'number' || !isFinite(v)) return;
        st.hc = v; st.hcRaw = raw;
        if (from !== 'drag') save();
        const g = groupAt(m, v), hit = new Set(g ? g.from : []);
        dots.forEach((el, k) => el.classList.toggle('hit', hit.has(k)));
        tickEls.forEach((el, k) => { if (el) el.classList.toggle('hit', hit.has(k)); });
        const inside = v >= y0 && v <= y1;
        const py = inside ? Y(v) : v > y1 ? mt : mt + ph;
        hline.setAttribute('y1', py); hline.setAttribute('y2', py);
        strip.setAttribute('y', py - 14);
        knob.setAttribute('cy', py);
        lineG.classList.toggle('out', !inside);
        cLab.setAttribute('y', py - 9 < mt + 12 ? py + 20 : py - 9);
        const r0 = g ? g.raw : raw;
        cLab.textContent = 'c = ' + (U.exact(r0) && r0.d !== 1 && !K.exactDecimal(r0) ? r0.toString() : U.vTxt(g ? g.value : v)).replace(/^-/, '−') + (inside ? '' : v > y1 ? ' (above the plot)' : ' (below the plot)');
        Lab.clear(drops);
        if (g && g.from.length <= 80) g.from.forEach(k => drops.appendChild(svg('line', { x1: X(xs[k]), x2: X(xs[k]), y1: Y(ys[k]), y2: mt + ph, class: 'gxg-drop' })));
        Lab.setHTML(read, levelRead(m, D, v, raw, curveOK));
        if (from !== 'box') ctl.paint(v, g ? g.raw : raw);
        // machine-readable copy (exact strings), for checking
        body.dataset.c = String(v);
        body.dataset.hits = JSON.stringify(g ? g.from.map(k => xs[k]) : []);
        body.dataset.p = g ? (U.exact(g.p) ? g.p.toString() : String(Number(g.p))) : '0';
      }
      body.appendChild(graphVerdict(m, D, setLevel));
      body.dataset.verdict = m.oneToOne ? 'one-to-one' : 'many-to-one';
      GR = { m, setLevel };
      const g0 = groupAt(m, st.hc);
      setLevel(st.hc, g0 ? g0.raw : st.hcRaw, 'init');
    }

    /* ---------------- PMF charts */
    function chart(rows, tone, name, D) {
      if (rows.length <= 40) return K.pmfChart(rows.map(r => ({ x: r.x, p: r.p, label: U.pTex(r.p, D) })), { xName: name, tone, height: 170, xPlain: name });
      return U.stemChart(rows, { tone, name, D, caption: 'values of ' + tex(name) + ' — ' + K.fmtInt(rows.length) + ' stems drawn at their true positions (too many for bars)' });
    }
    function drawPmf(m, D) {
      const b = P.pmf.body;
      Lab.clear(b);
      b.appendChild(h('div', { class: 't4-sub', html: 'PMF of ' + tex('X') + ': ' + tex('f_X(x)=P(X=x)') + ', ' + m.n + ' value' + (m.n > 1 ? 's' : '') }));
      b.appendChild(chart(m.xs.map((x, k) => ({ x, p: m.ps[k] })), 'x', 'X', D));
      b.appendChild(h('div', { class: 't4-sub', html: 'PMF of ' + tex('Y=g(X)') + ': ' + tex('P(Y=y)=\\sum_{x:\\,g(x)=y}P(X=x)') + ', ' + m.m + ' value' + (m.m > 1 ? 's' : '') }));
      b.appendChild(chart(m.groups.map(g => ({ x: g.value, raw: g.raw, p: g.p })), 'z', 'Y', D));
      const totY = U.sum(m.groups.map(g => g.p));
      b.appendChild(K.note('Each chart has its own height scale, so compare the numbers. Both add up to the same total, ' + tex(U.pTex(totY, D)) + ': the arrows only move probability, they never create or lose any.' + tailNote(m, D), 'small muted'));
      if (m.n <= 60) {
        b.appendChild(h('div', { class: 't4-sub', html: 'The lecture’s picture: stem plots on true number lines' }));
        b.appendChild(K.note('Top: the stems of ' + tex('X') + '. Bottom: ' + tex('Y=g(X)') + ' on its own axis, spaced by value (so ' + tex('2^x') + ' really spreads out). Press <b>Apply g</b> to watch the stems move: stems that land on the same ' + tex('y') + ' stack up.', 'small muted'));
        const host = h('div');
        b.appendChild(host);
        const sm = Lab.W.stemMorph({ dists: [{ label: 'X', dist: { vals: m.xs, p: m.ps, float: m.float }, den: D }], g: m.src, xName: 'X', yName: 'Y' });
        sm.mount(host);
        sm.showResult();
      }
    }

    /* ---------------- CDF charts */
    function drawCdf(m, D) {
      const b = P.cdf.body;
      Lab.clear(b);
      const trunc = !!m.tail;
      b.appendChild(h('div', { class: 't4-sub', html: 'CDF of ' + tex('X') + ': ' + tex('F_X(t)=P(X\\le t)') }));
      b.appendChild(K.cdfChart({ vals: m.xs, p: m.ps, float: m.float }, { xName: 'X', truncated: trunc }));
      b.appendChild(h('div', { class: 't4-sub', html: 'CDF of ' + tex('Y') + ': ' + tex('F_Y(t)=P(Y\\le t)=P\\big(g(X)\\le t\\big)') }));
      const yd = { vals: m.groups.map(g => g.value), p: m.groups.map(g => g.p), float: m.yFloat };
      const link = h('div', { class: 'ws-readout t4-link' });
      b.appendChild(K.cdfChart(yd, { xName: 'Y', truncated: trunc, onT: t => paintLink(t) }));
      b.appendChild(link);
      function paintLink(t) {
        const ks = [];
        m.xs.forEach((x, k) => { if (m.ys[k] <= t + 1e-12) ks.push(k); });
        const tt = U.vTex(t);
        if (!ks.length) { Lab.setHTML(link, 'Seen through ' + tex('X') + ': no value of ' + tex('X') + ' has ' + tex('g(x)\\le ' + tt) + ', so ' + tex('F_Y(' + tt + ')=0') + '.'); return; }
        const tot = U.sum(ks.map(k => m.ps[k]));
        Lab.setHTML(link, 'Seen through ' + tex('X') + ': ' + tex('Y\\le ' + tt) + ' happens exactly when ' + tex('g(X)\\le ' + tt) + ', that is when ' + tex('X\\in\\{' + U.listTex(ks.map(k => m.xs[k])) + '\\}') + ' (' + ks.length + ' value' + (ks.length > 1 ? 's' : '') + ' of ' + tex('X') + '). So' +
          '<div>' + tex('F_Y(' + tt + ')=\\sum_{x:\\,g(x)\\le ' + tt + '}P(X=x)=' + U.sumTex(ks.map(k => U.pTex(m.ps[k], D))) + U.pEq(tot, D)) + '</div><div class="xs muted">The same number as the staircase gives, now added over values of ' + tex('X') + ' instead of values of ' + tex('Y') + '.</div>');
      }
      paintLink(yd.vals[Math.floor(yd.vals.length / 2)]);
    }

    /* ---------------- the table method */
    function patternRows(m, full) {
      const n = m.n, out = [];
      if (n <= 24 || full) { for (let k = 0; k < n; k++) out.push({ k }); return out; }
      const keep = new Set(), d = [];
      for (let k = 0; k < n - 1; k++) d.push(m.ys[k + 1] - m.ys[k]);
      const change = [];
      for (let k = 1; k < n - 1; k++) if (Math.abs(d[k] - d[k - 1]) > 1e-9 * Math.max(1, Math.abs(d[k]))) change.push(k);
      if (change.length <= 6) {
        [0, 1, 2, n - 2, n - 1].forEach(k => keep.add(k));
        change.forEach(c => { for (let j = c - 2; j <= c + 2; j++) if (j >= 0 && j < n) keep.add(j); });
      } else { for (let k = 0; k < 10; k++) keep.add(k); for (let k = n - 3; k < n; k++) keep.add(k); }
      const ks = [...keep].sort((a, b) => a - b);
      ks.forEach((k, i) => { if (i && k - ks[i - 1] > 1) out.push({ gap: [ks[i - 1] + 1, k - 1] }); out.push({ k }); });
      return out;
    }
    function groupRows(m, full) {
      const gs = m.groups, M = gs.length;
      let out = [];
      if (M <= 24 || full) return gs.map((g, r) => ({ r }));
      const sig = g => g.from.length + '|' + Number(g.p).toPrecision(12);
      let r = 0;
      while (r < M) {
        let j = r;
        while (j + 1 < M && sig(gs[j + 1]) === sig(gs[r])) j++;
        if (j - r + 1 > 5) out.push({ r }, { r: r + 1 }, { gap: [r + 2, j - 1] }, { r: j });
        else for (let i = r; i <= j; i++) out.push({ r: i });
        r = j + 1;
      }
      if (out.length > 34) {
        const head = out.slice(0, 22), tail = out.slice(-8);
        const firstHidden = out[22].r != null ? out[22].r : out[22].gap[0];
        const lastHidden = out[out.length - 9].r != null ? out[out.length - 9].r : out[out.length - 9].gap[1];
        out = head.concat([{ gap: [firstHidden, lastHidden] }], tail);
      }
      return out;
    }
    const fullBtn = (label, onClick) => h('div', { class: 'btn-row t4-full' }, Lab.button(label, onClick, 'btn sm'));
    function drawTable(m, D, full) {
      const b = P.table.body;
      Lab.clear(b);
      const xd = xDesc(m, D);
      const steps = [];
      steps.push({ html: '<b>The PMF of ' + tex('X') + '.</b> ' + xd.html, math: xd.math, note: xd.note });
      // step 2: x | P(X=x) | y = g(x)
      const rep = m.groups.map(g => g.from.length > 1);
      const pr = patternRows(m, full);
      const rowsX = pr.map(e => {
        if (e.gap) {
          const [a, z] = e.gap, ks = []; for (let k = a; k <= z; k++) ks.push(k);
          const yv = ks.map(k => m.ys[k]);
          const sameY = yv.every(v => Math.abs(v - yv[0]) < 1e-12);
          const sameP = ks.every(k => U.peq(m.ps[k], m.ps[a]));
          return { gap: '⋮ ' + K.fmtInt(ks.length) + ' more rows like these: ' + tex('x=' + U.listTex(ks.map(k => m.xs[k]))) + (sameY ? ', each with ' + tex('y=' + yT(m, a)) : ', with ' + tex('y=' + U.listTex(yv, ks.map(k => m.raws[k])))) + (sameP ? ', each ' + tex('P(X=x)=' + U.pTex(m.ps[a], D)) : '') };
        }
        const k = e.k, r = m.gi[k];
        return [tex(xT(m, k)), tex(U.pTex(m.ps[k], D)), { html: tex(gVal(m, k)), cls: rep[r] ? 'rep' : '' }];
      });
      const xBlock = h('div', {}, U.tbl([tex('x'), tex('P(X=x)'), tex('y=g(x)')], rowsX));
      if (m.n > 24) xBlock.appendChild(full ? fullBtn('Show the short pattern table again', () => drawTable(m, D, false)) : fullBtn('Show all ' + K.fmtInt(m.n) + ' rows', () => drawTable(m, D, true)));
      steps.push({
        html: '<b>The table.</b> One row per value of ' + tex('X') + ': ' + tex('x') + ', its probability, and ' + tex('y=g(x)=' + U.exprTex(m.src)) + ' worked out' + (m.n > 24 && !full ? '. With ' + K.fmtInt(m.n) + ' rows, the pattern is written with “⋮” as in L2.5: first rows, the rows where the pattern changes, last rows' : '') + '.',
        block: xBlock,
        note: m.oneToOne ? 'No value of ' + tex('y') + ' repeats.' : 'Violet: a value of ' + tex('y') + ' that appears in more than one row.',
      });
      // step 3: repeats
      steps.push({ html: '<b>Look for repeats in the ' + tex('y') + ' column.</b> ' + verdictWords(m, D) });
      // step 4: group and add
      const rowsY = groupRows(m, full).map(e => {
        if (e.gap) {
          const gs = m.groups.slice(e.gap[0], e.gap[1] + 1);
          const one = gs.every(g => g.from.length === gs[0].from.length) && gs.every(g => U.peq(g.p, gs[0].p));
          return { gap: '⋮ ' + K.fmtInt(gs.length) + ' more values ' + tex('y=' + U.listTex(gs.map(g => g.value), gs.map(g => g.raw))) + (one ? ': each comes from ' + (gs[0].from.length === 1 ? 'exactly one ' + tex('x') : gs[0].from.length + ' values of ' + tex('x')) + ' and has ' + tex('P(Y=y)=' + U.pTex(gs[0].p, D)) : ' (press “Show all” to see them)') };
        }
        const g = m.groups[e.r];
        return { cells: [tex(gyT(g)), tex(U.listTex(g.from.map(k => m.xs[k]))), String(g.from.length), tex(groupSum(m, g, D, false))], cls: g.from.length > 1 ? 'hl-row' : '' };
      });
      const yBlock = h('div', {}, U.tbl([tex('y'), tex('x') + ' with ' + tex('g(x)=y'), 'how many', tex('P(Y=y)')], rowsY));
      if (m.m > 24) yBlock.appendChild(full ? fullBtn('Show the short table again', () => drawTable(m, D, false)) : fullBtn('Show all ' + K.fmtInt(m.m) + ' values of Y', () => drawTable(m, D, true)));
      steps.push({
        html: '<b>Keep each value of ' + tex('y') + ' once and add the probabilities of the ' + tex('x') + '’s that give it.</b> The events ' + tex('\\{X=x\\}') + ' for different ' + tex('x') + ' never overlap, so their probabilities add:',
        math: 'P(Y=y)=\\sum_{x:\\ g(x)=y}P(X=x)',
        block: yBlock,
      });
      // step 5: check the total
      const totY = U.sum(m.groups.map(g => g.p));
      const totTerms = m.groups.map(g => U.pTex(g.p, D));
      const exact = U.exact(totY);
      let numLine = '';
      if (D && exact && m.groups.every(g => U.exact(g.p) && D % g.p.d === 0)) {
        const runs = [];
        m.groups.forEach(g => { const c = g.p.n * (D / g.p.d); const last = runs[runs.length - 1]; if (last && last.c === c) last.k++; else runs.push({ c, k: 1 }); });
        const parts = runs.map(r => (r.k === 1 ? bigTex(r.c) : r.k + '\\times ' + bigTex(r.c)));
        if (parts.length <= 14 && parts.length < totTerms.length + 1) numLine = '=\\frac{' + parts.join('+') + '}{' + bigTex(D) + '}' + (totY.d === 1 ? '=\\frac{' + bigTex(totY.n * D) + '}{' + bigTex(D) + '}' : '');
      }
      steps.push({
        html: '<b>Check:</b> the ' + m.m + ' probabilities of ' + tex('Y') + ' add up to the same total as those of ' + tex('X') + '.',
        math: '\\sum_y P(Y=y)=' + U.sumTex(totTerms, full ? 1e9 : 10) + numLine + (exact ? '=' : '\\approx ') + U.pTex(totY, D) + (!m.tail && exact && totY.eq(1) ? '\\ \\checkmark' : ''),
        note: m.tail ? 'This is less than 1 only because the values ' + tex('x>' + m.tail.k) + ' are left out: ' + tex(U.pTex(totY, D) + '+' + (m.float ? U.dec(m.tail.p) : U.pTex(m.tail.p, D)) + (m.float ? '\\approx 1' : '=1')) + '.' : '',
      });
      b.appendChild(K.steps(steps));
    }

    /* ---------------- E[g(X)] two ways */
    const valF = it => U.toF(it.raw != null ? it.raw : it.v);
    function expectations(m) {
      const e1 = U.sum(m.groups.map(g => U.mul(valF({ v: g.value, raw: g.raw }), g.p)));
      const e2 = U.sum(m.xs.map((x, k) => U.mul(valF({ v: m.ys[k], raw: m.raws[k] }), m.ps[k])));
      return { e1, e2 };
    }
    /** the last lines of a sum: = N/D, then the reduced fraction or the integer, then ≈ decimal */
    function finalLines(total, D, withD) {
      const out = [];
      if (!U.exact(total)) { out.push('\\approx ' + U.dec(total)); return out; }
      if (withD) {
        const N = U.mul(total, F(D));
        out.push('=\\frac{' + U.vTex(N) + '}{' + bigTex(D) + '}');
        if (total.d === 1) out.push('=' + bigTex(total.n));
        else if (total.d !== D) out.push('=' + U.fracTex(total) + '\\approx ' + U.dec(Number(total)));
        else out.push('\\approx ' + U.dec(Number(total)));
        return out;
      }
      out.push('=' + U.numTex(total));
      return out;
    }
    /** items [{v, raw, p}] → aligned lines: terms, the same over the common denominator, the total; notes for runs */
    function eLines(items, D, full) {
      const n = items.length, lines = [], notes = [];
      const prods = items.map(it => U.mul(valF(it), it.p));
      const total = U.sum(prods);
      const exactAll = U.exact(total) && prods.every(U.exact);
      const rel = exactAll ? '=' : '\\approx ';
      const vt = it => U.vTex(it.v, it.raw);
      const allD = !!D && exactAll && items.every(it => U.exact(it.p) && D % it.p.d === 0);
      if (n <= 24 || full) {
        lines.push('=' + items.map(it => U.par(vt(it)) + '\\cdot ' + U.pTex(it.p, D)).join('+'));
        if (allD) {
          const parts = items.map(it => { const c = it.p.n * (D / it.p.d); return c === 1 ? U.par(vt(it)) : U.par(vt(it)) + '\\cdot ' + c; });
          lines.push('=\\frac{' + parts.join('+') + '}{' + bigTex(D) + '}');
        } else if (n > 1) lines.push(rel + prods.map(q => U.pTex(q)).join('+'));
        return { lines: lines.concat(finalLines(total, D, allD)), notes, total, cut: false };
      }
      // long sums: runs of equal probability with evenly spaced values are added with (first + last) × count / 2
      const pieces = [];
      let k = 0;
      while (k < n) {
        let j = k;
        const d = k + 1 < n ? items[k + 1].v - items[k].v : 0;
        while (j + 1 < n && U.peq(items[j + 1].p, items[k].p) && Math.abs(items[j + 1].v - items[j].v - d) <= 1e-9 * Math.max(1, Math.abs(d))) j++;
        const L = j - k + 1;
        if (L >= 5) {
          const a = items[k], z = items[j], p = a.p;
          const aT = vt(a), zT = vt(z), flat = Math.abs(d) < 1e-12;
          const S = flat ? U.mul(valF(a), F(L)) : U.mul(U.add(valF(a), valF(z)), F(L, 2));
          const inner = flat ? '\\underbrace{' + aT + '+\\dots+' + aT + '}_{' + L + '}' : U.par(aT) + '+' + U.par(vt(items[k + 1])) + '+\\dots+' + U.par(zT);
          pieces.push({ t: U.pTex(p, D) + '\\cdot\\left(' + inner + '\\right)', val: U.mul(p, S) });
          notes.push(flat ? tex(L + '\\times ' + U.par(aT) + '=' + U.vTex(S)) + ' (' + L + ' equal terms).'
            : tex(U.par(aT) + '+\\dots+' + U.par(zT)) + ' has ' + L + ' evenly spaced terms, so it equals ' + tex('\\frac{' + U.par(aT) + '+' + U.par(zT) + '}{2}\\times ' + L + '=' + U.vTex(S)) + '.');
          k = j + 1;
        } else {
          pieces.push({ t: U.par(vt(items[k])) + '\\cdot ' + U.pTex(items[k].p, D), val: prods[k] });
          k++;
        }
      }
      const cut = pieces.length > 16;
      const show = arr => (!cut ? arr.join('+') : arr.slice(0, 6).join('+') + '+\\dots+' + arr.slice(-2).join('+') + '\;{\\scriptstyle(' + arr.length + '\\text{ pieces})}');
      lines.push('=' + show(pieces.map(q => q.t)));
      lines.push(rel + show(pieces.map(q => U.pTex(q.val, allD ? D : null))));
      return { lines: lines.concat(finalLines(total, D, allD)), notes, total, cut };
    }
    function drawE(m, D, full) {
      const b = P.exp.body;
      Lab.clear(b);
      const it1 = m.groups.map(g => ({ v: g.value, raw: g.raw, p: g.p }));
      const it2 = m.xs.map((x, k) => ({ v: m.ys[k], raw: m.raws[k], p: m.ps[k] }));
      const w1 = eLines(it1, D, full), w2 = eLines(it2, D, full);
      const same = U.peq(w1.total, w2.total) || Math.abs(Number(w1.total) - Number(w2.total)) <= 1e-9 * Math.max(1, Math.abs(Number(w1.total)));
      const ex = m.groups.find(g => g.from.length > 1);
      const steps = [
        { html: '<b>Way 1 — from the PMF of ' + tex('Y') + '</b> (the grouped table above): multiply each value ' + tex('y') + ' by ' + tex('P(Y=y)') + ' and add. ' + m.m + ' term' + (m.m > 1 ? 's' : '') + '.', math: U.aligned('E[Y]&=\\sum_{y}y\\,P(Y=y)', w1.lines), note: w1.notes.join('<br>') },
        { html: '<b>Way 2 — straight from the PMF of ' + tex('X') + ',</b> without grouping: multiply each ' + tex('g(x)') + ' by ' + tex('P(X=x)') + ' and add. ' + m.n + ' term' + (m.n > 1 ? 's' : '') + '.', math: U.aligned('E[g(X)]&=\\sum_{x}g(x)\\,P(X=x)', w2.lines), note: w2.notes.join('<br>') },
        {
          html: (same ? '<b>Both ways give ' + tex('E[g(X)]' + U.numEq(w1.total)) + ' ✓.</b> ' : '<b class="cbad">The two ways differ</b> — that would be a bug; please report it. ') +
            (ex ? 'Why they agree: Way 1 is Way 2 with the terms of each collision added first. For example ' + tex(U.par(gyT(ex)) + '\\cdot ' + U.pTex(ex.p, D) + '=' + ex.from.slice(0, 4).map(k => U.par(yT(m, k)) + '\\cdot ' + U.pTex(m.ps[k], D)).join('+') + (ex.from.length > 4 ? '+\\dots' : '')) + ' (the values ' + tex('x=' + U.listTex(ex.from.map(k => m.xs[k]))) + ').' : 'Here ' + tex('g') + ' is one-to-one, so the two sums have exactly the same terms in a different order.'),
        },
      ];
      // g(E[X]) is a different number in general
      const eX = U.sum(m.xs.map((x, k) => U.mul(U.toF(x), m.ps[k])));
      let gE = null;
      try { gE = m.fn(U.exact(eX) ? eX : Number(eX)); } catch (e) { gE = null; }
      if (U.exact(eX) && gE != null && isFinite(Lab.expr.num(gE))) {
        const gEv = Lab.expr.num(gE);
        const eq = Math.abs(gEv - Number(w1.total)) <= 1e-9 * Math.max(1, Math.abs(gEv));
        const gMid = U.exprTex(m.src, { x: { v: Number(eX), raw: U.exact(eX) ? eX : undefined } });
        steps.push({ html: '<b>Careful:</b> ' + tex('E[g(X)]') + ' is not ' + tex('g(E[X])') + ' in general. Here ' + tex('E[X]=\\sum_x x\\,P(X=x)' + U.numEq(eX)) + ', so ' + tex('g(E[X])=' + (gMid === U.vTex(gEv, gE) ? '' : gMid + U.eqv(gEv, gE)) + U.vTex(gEv, gE)) + (eq ? ', which happens to equal ' + tex('E[g(X)]') + ' here.' : ', not ' + tex(U.numTex(w1.total)) + '.') });
      }
      if (m.tail) steps.push({ html: '<span class="muted">These sums use only the values shown (' + tex('x\\le ' + m.tail.k) + '). The left-out tail has probability ' + tex(m.float ? '\\approx ' + U.dec(m.tail.p) : U.pTex(m.tail.p, D)) + ', so the true ' + tex('E[g(X)]') + ' can be a little different.</span>' });
      b.appendChild(K.steps(steps));
      if (w1.cut || w2.cut || full) b.appendChild(full ? fullBtn('Show the short sums again', () => drawE(m, D, false)) : fullBtn('Show every term (' + K.fmtInt(m.n) + ' terms in Way 2)', () => drawE(m, D, true)));
    }
  }

  Lab.lab({
    id: 'lab-s2-gx', course: 's2', week: 2, order: 3, ic: 'sigma',
    title: 'Function of one random variable lab', sub: 'Week 2 · L2.3–L2.5',
    topics: ['Y = g(X)', 'one-to-one', 'many-to-one', 'table method', 'PMF and CDF of Y', 'E[g(X)]'],
    desc: 'Pick any X (uniform, binomial, geometric, Poisson or your own PMF) and type any g(x). See every arrow x → g(x) and which values collide, the lecture’s table method with every sum written out, the PMF and CDF of Y next to those of X, and E[g(X)] computed two ways.',
    render: host => gxLab(host),
  });
})();
