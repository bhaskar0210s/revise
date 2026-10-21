/* Functions and calculus lab: straight lines, quadratics, polynomials, exponentials, composition and inverses,
   logarithms, limits, derivatives, maxima and minima, and integrals. Every topic draws on one coordinate plane
   (plot() below: axes, grid, a window scaled to what is drawn, curves sampled finely, points marked) and works every
   number out step by step from the learner's values: exact fractions (K.F) wherever the numbers are rational, and ≈
   in front of a rounded value. The "Try" chips load examples from the Maths 1 lectures (week.lecture, as on the week
   pages). Topics are listed in labs.json; the comment above each topic lists its link parameters. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, T, TD, h, sv, rich } = K;

  /* ================================================================ exact and rounded numbers */
  const babs = a => (a < 0n ? -a : a);
  const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  const blcm = (a, b) => (a && b ? babs((a / bgcd(a, b)) * b) : 0n);
  const neg = q => q.cmp(0) < 0;
  const fabs = q => (neg(q) ? q.neg() : q);
  /** a fraction as a factor, or after a minus sign: −3 → (−3) */
  const par = q => (neg(q) ? '\\mathopen{}\\left(' + T(q) + '\\right)' : T(q));
  /** q² written out: 3^2, (−3)^2, (1/2)^2 */
  const sqp = q => (neg(q) || !q.isInt() ? '\\mathopen{}\\left(' + T(q) + '\\right)^2' : T(q) + '^2');
  /** brackets of a fixed size around a long expression: unlike \left( … \right), a narrow phone can break the line inside them */
  const fixedPar = x => (/\\frac/.test(x) ? '\\biggl(' + x + '\\biggr)' : '(' + x + ')');
  /** a term after the first one: " + 3x", " - x", "" */
  const sgn = (q, v = '') => (q.isZero() ? '' : (neg(q) ? ' - ' : ' + ') + (v && fabs(q).eq(1) ? '' : T(fabs(q))) + v);
  /** a coefficient in front of a letter: 1 → "", −1 → "-" */
  const coef = q => (q.eq(1) ? '' : q.eq(-1) ? '-' : T(q));
  const xp = (q, v = 'x') => v + sgn(F(q));          // x + q
  const xm = (q, v = 'x') => v + sgn(F(q).neg());    // x − q
  /** q·(inner): 3(x − 1), −(x + 2), 3x, 0 */
  const times = (q, inner) => (q.isZero() ? '0' : /^[a-z]$/.test(inner) ? coef(q) + inner : coef(q) + '\\mathopen{}\\left(' + inner + '\\right)');
  /** " + 3 \cdot 4" or " - 4 \cdot (−5)": a product written after another term */
  const term = (c, x) => (neg(c) ? ' - ' : ' + ') + T(fabs(c)) + ' \\cdot ' + par(x);
  /** [[coefficient, letter], …] → "3x - y - 1" */
  function linTex(terms) {
    let s = '';
    for (const [c, v] of terms) {
      if (c.isZero()) continue;
      const body = (v && fabs(c).eq(1) ? '' : T(fabs(c))) + v;
      s += s ? (neg(c) ? ' - ' : ' + ') + body : (neg(c) ? '-' : '') + body;
    }
    return s || '0';
  }
  /** a real number for TeX: 0.3333, −2, 1.5 \times 10^{7} */
  function fmt(x, k = 4) {
    if (Number.isNaN(x)) return '\\text{undefined}';
    if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e7 || a < 10 ** -k) {
      let e = Math.floor(Math.log10(a)), m = +(x / 10 ** e).toFixed(3);
      if (Math.abs(m) >= 10) { m /= 10; e++; }
      return m + ' \\times 10^{' + e + '}';
    }
    const s = String(+x.toFixed(k));
    return s === '-0' ? '0' : s;
  }
  /** plain text for a fraction (labels in a drawing): −3/2 */
  const ns = q => F(q).str().replace(/-/g, '−');
  const nx = (x, k = 2) => String(+x.toFixed(k)).replace(/-/g, '−');

  /* A value that is exact ({ fr }) or rounded ({ x }, with tex for its exact form when it is known, like \sqrt{2}). */
  const ex = q => { q = F(q); return { fr: q, x: q.num(), tex: null }; };
  const ap = (x, tex) => ({ fr: null, x, tex: tex || null });
  const vt = v => (v.fr ? T(v.fr) : v.tex || fmt(v.x));
  /** "= 3/8 = 0.375", "= \sqrt{2} ≈ 1.4142", "≈ 0.3473": the end of an equation */
  const eqv = v => (v.fr ? ' = ' + TD(v.fr) : v.tex ? ' = ' + v.tex + ' \\approx ' + fmt(v.x) : ' \\approx ' + fmt(v.x));
  /** the value on its own: "\frac{3}{8} = 0.375", "\sqrt{2} ≈ 1.4142", "≈ 0.3473" */
  const vd = v => (v.fr ? TD(v.fr) : (v.tex ? v.tex + ' \\approx ' : '\\approx ') + fmt(v.x));
  const vsign = v => (v.fr ? v.fr.cmp(0) : Math.abs(v.x) < 1e-12 ? 0 : Math.sign(v.x));
  const veq = (a, b) => (a.fr && b.fr ? a.fr.eq(b.fr) : Math.abs(a.x - b.x) <= 1e-9 * Math.max(1, Math.abs(a.x), Math.abs(b.x)));
  const vadd = (a, b) => (a.fr && b.fr ? ex(a.fr.add(b.fr)) : ap(a.x + b.x));
  const vsub = (a, b) => (a.fr && b.fr ? ex(a.fr.sub(b.fr)) : ap(a.x - b.x));
  const vmul = (a, b) => (a.fr && b.fr ? ex(a.fr.mul(b.fr)) : ap(a.x * b.x));
  const vdiv = (a, b) => (a.fr && b.fr ? ex(a.fr.div(b.fr)) : ap(a.x / b.x));
  const vpowi = (b, k) => (b.fr && !(b.fr.isZero() && k < 0) && Math.abs(k) <= 60 ? ex(b.fr.pow(k)) : ap(Math.pow(b.x, k)));
  const vsqrt = a => { if (a.fr) { const r = sqrtFr(a.fr); return r.r === 1n ? ex(r.k) : ap(Math.sqrt(a.x), rootTex(r.k, r.r)); } return ap(Math.sqrt(a.x)); };

  /* ---------------------------------------------------------------- square roots, kept exact */
  function isqrt(n) { if (n < 2n) return n; let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2)); for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; } }
  /** √q = k·√r, with r a whole number free of square factors (r = 1 when √q is rational) */
  function sqrtFr(q) {
    let m = q.n * q.d;
    if (m < 0n) throw new Error('There is no real square root of a negative number.');
    if (m === 0n) return { k: F(0), r: 1n };
    const t = isqrt(m);
    if (t * t === m) return { k: F(t, q.d), r: 1n };
    let out = 1n;
    for (let p = 2n; p * p <= m && p < 20000n; p++) while (m % (p * p) === 0n) { m /= p * p; out *= p; }
    const u = isqrt(m);
    if (u * u === m) { out *= u; m = 1n; }
    return { k: F(out, q.d), r: m };
  }
  /** k√r: 2\sqrt{3}, \frac{\sqrt{5}}{2}, -\frac{3\sqrt{2}}{4} */
  function rootTex(k, r) {
    if (r === 1n || k.isZero()) return T(k);
    const a = fabs(k), top = (a.n === 1n ? '' : String(a.n)) + '\\sqrt{' + r + '}';
    return (neg(k) ? '-' : '') + (a.d === 1n ? top : '\\frac{' + top + '}{' + a.d + '}');
  }
  /** p + q√r (pm: p ± q√r) as one fraction */
  function surdTex(p, q, r, pm) {
    const D = blcm(p.d, q.d), P = p.n * (D / p.d), Q = q.n * (D / q.d);
    const root = (babs(Q) === 1n ? '' : String(babs(Q))) + '\\sqrt{' + r + '}';
    const top = P === 0n ? (pm ? '\\pm ' : Q < 0n ? '-' : '') + root : P + (pm ? ' \\pm ' : Q < 0n ? ' - ' : ' + ') + root;
    return D === 1n ? top : '\\frac{' + top + '}{' + D + '}';
  }

  /* ================================================================ what the learner types */
  /** "1,2" → [F(1), F(2)] */
  function pair(str, n) {
    const parts = String(str == null ? '' : str).split(',');
    if (parts.length !== n) throw new Error('Type ' + n + ' numbers separated by commas.');
    return parts.map(t => F.parse(t));
  }
  const split = (str, n) => { const a = String(str == null ? '' : str).split(','); while (a.length < n) a.push(''); return a.slice(0, n); };
  /** "1, 1, -2" → fractions (the zeros of a polynomial) */
  function parseList(t) {
    const parts = String(t == null ? '' : t).split(',').map(u => u.trim()).filter(u => u !== '');
    if (!parts.length) throw new Error('Type at least one zero, like 1, -2.');
    if (parts.length > 8) throw new Error('At most 8 zeros, please (degree 8).');
    return parts.map(u => F.parse(u));
  }
  /** a real number: 2, -1/3, 0.25, 40%, pi/4, 2pi, e, sqrt(2), e^2. Exact (fr) when it is rational, else x with its TeX. */
  function parseReal(src) {
    const s = String(src == null ? '' : src).toLowerCase().replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/π/g, 'pi').replace(/√/g, 'sqrt').replace(/\s+/g, '');
    if (!s) throw new Error('Type a number: 2, -1/3, 0.5, pi/4 or e.');
    if (/\de[-+]?\d/.test(s)) throw new Error('Write the number in full, without e-notation.');
    let i = 0;
    const fail = m => { throw new Error(m); };
    const num = q => ({ fr: q, x: q.num(), tex: T(q), k: neg(q) ? 'u' : q.isInt() ? 'n' : 'f' });
    const wrap = (v, ks) => (ks.includes(v.k) ? '\\mathopen{}\\left(' + v.tex + '\\right)' : v.tex);
    const sum = () => {
      let a = prod();
      while (s[i] === '+' || s[i] === '-') {
        const op = s[i++], b = prod();
        if (a.fr && b.fr) a = num(op === '+' ? a.fr.add(b.fr) : a.fr.sub(b.fr));
        else a = { fr: null, x: op === '+' ? a.x + b.x : a.x - b.x, tex: a.tex + (op === '+' ? ' + ' + wrap(b, ['u']) : ' - ' + wrap(b, ['a', 'u'])), k: 'a' };
      }
      return a;
    };
    const mult = (a, b) => {
      if (a.fr && b.fr) return num(a.fr.mul(b.fr));
      if (a.fr && (b.k === 's' || b.k === 'p')) return { fr: null, x: a.x * b.x, tex: coef(a.fr) + (a.fr.isInt() || a.fr.eq(-1) ? '' : '\\,') + b.tex, k: neg(a.fr) ? 'u' : 'p' };
      return { fr: null, x: a.x * b.x, tex: wrap(a, ['a']) + ' \\cdot ' + wrap(b, ['a', 'u']), k: 'p' };
    };
    const over = (a, b) => {
      if (b.x === 0) fail('Division by zero.');
      if (a.fr && b.fr) return num(a.fr.div(b.fr));
      const ng = a.k === 'u';
      return { fr: null, x: a.x / b.x, tex: (ng ? '-' : '') + '\\frac{' + (ng ? a.tex.slice(1) : a.tex) + '}{' + b.tex + '}', k: ng ? 'u' : 'p' };
    };
    const prod = () => {
      let a = unary();
      for (;;) {
        const c = s[i];
        if (c === '*' || c === '/') { i++; const b = unary(); a = c === '*' ? mult(a, b) : over(a, b); }
        else if (c && /[0-9.(a-z]/.test(c)) a = mult(a, power());
        else return a;
      }
    };
    const unary = () => {
      if (s[i] === '-') { i++; const v = unary(); return v.fr ? num(v.fr.neg()) : { fr: null, x: -v.x, tex: '-' + wrap(v, ['a', 'u']), k: 'u' }; }
      if (s[i] === '+') { i++; return unary(); }
      return power();
    };
    const power = () => {
      const b = atom();
      if (s[i] !== '^') return b;
      i++;
      const e = unary();
      if (b.fr && e.fr && e.fr.isInt() && Math.abs(Number(e.fr.n)) <= 60 && !(b.fr.isZero() && neg(e.fr))) return num(b.fr.pow(Number(e.fr.n)));
      const x = Math.pow(b.x, e.x);
      if (!Number.isFinite(x)) fail('That power is not a real number here.');
      return { fr: null, x, tex: wrap(b, ['a', 'u', 'p', 'f']) + '^{' + e.tex + '}', k: 's' };
    };
    const group = () => { i++; const v = sum(); if (s[i] !== ')') fail('A bracket is not closed.'); i++; return v; };
    const atom = () => {
      if (s.startsWith('pi', i)) { i += 2; return { fr: null, x: Math.PI, tex: '\\pi', k: 's' }; }
      if (s.startsWith('sqrt', i)) {
        i += 4;
        const v = s[i] === '(' ? group() : atom();
        if (v.x < 0) fail('There is no real square root of a negative number.');
        if (v.fr) { const r = sqrtFr(v.fr); return r.r === 1n ? num(r.k) : { fr: null, x: Math.sqrt(v.x), tex: rootTex(r.k, r.r), k: r.k.eq(1) ? 's' : 'p' }; }
        return { fr: null, x: Math.sqrt(v.x), tex: '\\sqrt{' + v.tex + '}', k: 's' };
      }
      if (s[i] === 'e') { i++; return { fr: null, x: Math.E, tex: 'e', k: 's' }; }
      if (s[i] === '(') return group();
      const m = /^(\d+(\.\d+)?|\.\d+)%?/.exec(s.slice(i));
      if (m) { i += m[0].length; return num(F.parse(m[0])); }
      return fail(i >= s.length ? 'The number is not finished.' : '“' + s[i] + '” cannot be used here: type numbers, fractions like 1/3, pi, e or sqrt(2).');
    };
    const v = sum();
    if (i < s.length) fail('“' + s.slice(i, i + 8) + '” cannot be used here.');
    if (!Number.isFinite(v.x)) fail('That number is too large.');
    return v.fr ? ex(v.fr) : ap(v.x, v.tex);
  }
  const SUPS = '⁰¹²³⁴⁵⁶⁷⁸⁹';
  /** a polynomial in x with exact coefficients, lowest power first: "x^3 - 4x + 1/2", "(x-1)^2(x+3)", "2x³ − x" */
  function parsePoly(src, maxDeg = 8) {
    const s = String(src == null ? '' : src).replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, m => '^' + [...m].map(ch => SUPS.indexOf(ch)).join(''))
      .toLowerCase().replace(/[−–]/g, '-').replace(/[×·]/g, '*').replace(/\s+/g, '');
    if (!s) throw new Error('Type a polynomial in x, like x^3 - 4x + 1.');
    let i = 0;
    const fail = m => { throw new Error(m); };
    const cap = p => { if (pdeg(p) > maxDeg) fail('Keep the degree at most ' + maxDeg + '.'); return p; };
    const sum = () => { let p = prod(); while (s[i] === '+' || s[i] === '-') { const op = s[i++], q = prod(); p = op === '+' ? padd(p, q) : psub(p, q); } return p; };
    const prod = () => {
      let p = unary();
      for (;;) {
        const c = s[i];
        if (c === '*') { i++; p = cap(pmul(p, unary())); }
        else if (c === '/') {
          i++;
          const q = unary();
          if (pdeg(q) > 0) fail('Divide only by numbers: a polynomial has no x in a denominator.');
          if (pdeg(q) < 0) fail('Division by zero.');
          p = pscale(p, F(1).div(q[0]));
        } else if (c && /[0-9.(x]/.test(c)) p = cap(pmul(p, power()));
        else return p;
      }
    };
    const unary = () => {
      if (s[i] === '-') { i++; return pneg(unary()); }
      if (s[i] === '+') { i++; return unary(); }
      return power();
    };
    const power = () => {
      const b = atom();
      if (s[i] !== '^') return b;
      i++;
      const m = /^\d+/.exec(s.slice(i));
      if (!m) fail('After ^ type a whole-number power, like x^3.');
      i += m[0].length;
      const k = +m[0];
      if (k > 64 || Math.max(pdeg(b), 0) * k > maxDeg) fail('Keep the degree at most ' + maxDeg + '.');
      return ppow(b, k);
    };
    const atom = () => {
      const c = s[i];
      if (c === 'x') { i++; return [F(0), F(1)]; }
      if (c === '(') { i++; const p = sum(); if (s[i] !== ')') fail('A bracket is not closed.'); i++; return p; }
      const m = /^(\d+(\.\d+)?|\.\d+)/.exec(s.slice(i));
      if (m) { i += m[0].length; return [F.parse(m[0])]; }
      return fail(c == null ? 'The polynomial is not finished.' : '“' + c + '” cannot be used here: type numbers, x, + − * / ^ and brackets.');
    };
    const p = sum();
    if (i < s.length) fail('“' + s.slice(i, i + 8) + '” cannot be used here.');
    return cap(ptrim(p));
  }

  /* ================================================================ polynomials: arrays of fractions, lowest power first */
  const ptrim = p => { p = p.map(c => F(c)); while (p.length > 1 && p[p.length - 1].isZero()) p.pop(); return p.length ? p : [F(0)]; };
  const pdeg = p => { p = ptrim(p); return p.length === 1 && p[0].isZero() ? -1 : p.length - 1; };
  const padd = (p, q) => ptrim(Array.from({ length: Math.max(p.length, q.length) }, (_, i) => F(p[i] || 0).add(F(q[i] || 0))));
  const pneg = p => p.map(c => F(c).neg());
  const psub = (p, q) => padd(p, pneg(q));
  const pscale = (p, k) => ptrim(p.map(c => F(c).mul(k)));
  const pmul = (p, q) => {
    p = ptrim(p); q = ptrim(q);
    const r = Array.from({ length: p.length + q.length - 1 }, () => F(0));
    p.forEach((a, i) => { if (!a.isZero()) q.forEach((b, j) => { r[i + j] = r[i + j].add(a.mul(b)); }); });
    return ptrim(r);
  };
  const ppow = (p, k) => { let r = [F(1)]; for (let j = 0; j < k; j++) r = pmul(r, p); return r; };
  const pev = (p, x) => { x = F(x); let r = F(0); for (let j = p.length - 1; j >= 0; j--) r = r.mul(x).add(p[j]); return r; };
  const pfn = p => { const c = p.map(q => F(q).num()); return x => { let r = 0; for (let j = c.length - 1; j >= 0; j--) r = r * x + c[j]; return r; }; };
  const pder = p => (p.length < 2 ? [F(0)] : ptrim(p.slice(1).map((c, j) => c.mul(j + 1))));
  const pint = p => ptrim([F(0), ...p.map((c, j) => c.div(j + 1))]);
  const pmonic = p => { const d = pdeg(p); return d < 0 ? p : pscale(p, F(1).div(p[d])); };
  const mono = (c, k) => { const t = Array.from({ length: k + 1 }, () => F(0)); t[k] = F(c); return t; };
  /** p(a + h) as a polynomial in h */
  const pshift = (p, a) => { let r = [F(0)]; for (let j = p.length - 1; j >= 0; j--) r = padd(pmul(r, [F(a), F(1)]), [p[j]]); return r; };
  /** 3x^{2} - x + \frac{1}{2} */
  function ptex(p, v = 'x') {
    p = ptrim(p);
    let s = '';
    for (let k = p.length - 1; k >= 0; k--) {
      const c = p[k];
      if (c.isZero()) continue;
      const body = (k > 0 && fabs(c).eq(1) ? '' : T(fabs(c))) + (k === 0 ? '' : k === 1 ? v : v + '^{' + k + '}');
      s += s ? (neg(c) ? ' - ' : ' + ') + body : (neg(c) ? '-' : '') + body;
    }
    return s || '0';
  }
  /** long division p = d·q + r, keeping a record of every step */
  function pdiv(p, d) {
    p = ptrim(p); d = ptrim(d);
    const dd = pdeg(d);
    if (dd < 0) throw new Error('Division by the zero polynomial.');
    let r = p;
    const q = Array.from({ length: Math.max(1, p.length - dd) }, () => F(0)), steps = [];
    while (pdeg(r) >= dd && steps.length < 40) {
      const top = pdeg(r), k = top - dd, c = r[top].div(d[dd]);
      q[k] = c;
      const m = pmul(d, mono(c, k)), nr = psub(r, m);
      steps.push({ lead: r[top], top, c, k, m, before: r, after: nr });
      r = nr;
    }
    return { q: ptrim(q), r, steps };
  }
  function divisors(n) { n = babs(n); const out = []; for (let i = 1n; i * i <= n; i++) if (n % i === 0n) { out.push(i); if (i * i !== n) out.push(n / i); } return out; }
  /** rational zeros by the rational root test; each is divided out as often as it goes (its multiplicity) */
  function rationalRoots(p) {
    let q = ptrim(p);
    const roots = [];
    let zero = 0;
    while (pdeg(q) > 0 && q[0].isZero()) { q = q.slice(1); zero++; }
    if (zero) roots.push({ r: F(0), m: zero });
    let L = 1n, cands = [], big = false, ints = null;
    if (pdeg(q) >= 1) {
      for (const c of q) L = blcm(L, c.d);
      ints = q.map(c => c.n * (L / c.d));
      const a0 = ints[0], an = ints[ints.length - 1];
      if (babs(a0) > 10n ** 10n || babs(an) > 10n ** 10n) big = true;
      else {
        const seen = new Map();
        for (const u of divisors(a0)) for (const w of divisors(an)) for (const g of [1n, -1n]) { const f = F(g * u, w); seen.set(f.str(), f); }
        cands = [...seen.values()].sort((u, w) => u.cmp(w));
        for (const c of cands) { let m = 0; while (pdeg(q) >= 1 && pev(q, c).isZero()) { q = pdiv(q, [c.neg(), F(1)]).q; m++; } if (m) roots.push({ r: c, m }); }
      }
    }
    roots.sort((u, w) => u.r.cmp(w.r));
    return { roots, rest: q, cands, L, ints, zero, big };
  }
  const pgcd = (a, b) => { a = ptrim(a); b = ptrim(b); while (pdeg(b) >= 0) { const r = pdiv(a, b).r; a = b; b = r; } return pmonic(a); };
  /** p = c·Π fᵢ^mᵢ with every fᵢ free of repeated factors (Yun's algorithm), so each zero gets its multiplicity */
  function squareFree(p) {
    p = pmonic(ptrim(p));
    if (pdeg(p) < 1) return [];
    const out = [];
    let a = pgcd(p, pder(p)), b = pdiv(p, a).q, c = pdiv(pder(p), a).q, d = psub(c, pder(b)), m = 1;
    while (pdeg(b) >= 1 && m < 30) {
      a = pgcd(b, d);
      if (pdeg(a) >= 1) out.push({ f: a, m });
      b = pdiv(b, a).q; c = pdiv(d, a).q; d = psub(c, pder(b)); m++;
    }
    return out;
  }
  /** the real zeros of a polynomial with simple zeros (numbers, lowest power first): bisection between its turning points */
  function realRootsNum(c) {
    c = c.slice();
    while (c.length > 1 && c[c.length - 1] === 0) c.pop();
    const n = c.length - 1;
    if (n < 1) return [];
    if (n === 1) return [-c[0] / c[1]];
    const ev = x => { let r = 0; for (let j = n; j >= 0; j--) r = r * x + c[j]; return r; };
    const B = 1 + Math.max(...c.slice(0, n).map(v => Math.abs(v / c[n])));
    const pts = [-B, ...realRootsNum(c.slice(1).map((v, j) => v * (j + 1))).filter(x => x > -B && x < B), B];
    const out = [];
    for (let k = 0; k < pts.length - 1; k++) {
      let lo = pts[k], hi = pts[k + 1], flo = ev(lo);
      const fhi = ev(hi);
      if (flo === 0) { out.push(lo); continue; }
      if (fhi === 0 || (flo < 0) === (fhi < 0)) continue;
      for (let it = 0; it < 300 && hi - lo > 4e-16 * Math.max(1, Math.abs(lo)); it++) {
        const mid = (lo + hi) / 2, fm = ev(mid);
        if (fm === 0) { lo = hi = mid; break; }
        if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid;
      }
      out.push((lo + hi) / 2);
    }
    out.sort((u, w) => u - w);
    return out.filter((x, k) => k === 0 || Math.abs(x - out[k - 1]) > 1e-9 * Math.max(1, Math.abs(x)));
  }
  /** every real zero of p with its multiplicity: exact when rational, a ± b√r from a quadratic factor, else numerical */
  function solvePoly(p) {
    const rr = rationalRoots(p);
    const roots = rr.roots.map(o => ({ x: o.r.num(), m: o.m, fr: o.r, tex: null }));
    let complex = 0;
    const parts = [];
    for (const { f, m } of squareFree(rr.rest)) {
      const d = pdeg(f);
      if (d === 2) {
        const [c, b, a] = f, D = b.mul(b).sub(a.mul(c).mul(4)), p0 = b.neg().div(a.mul(2));
        if (neg(D)) { complex += 2 * m; parts.push({ f, m, kind: 'complex' }); continue; }
        const sq = sqrtFr(D), q0 = sq.k.div(fabs(a.mul(2)));
        for (const g of [-1, 1]) roots.push({ x: p0.num() + g * q0.num() * Math.sqrt(Number(sq.r)), m, fr: null, tex: surdTex(p0, g < 0 ? q0.neg() : q0, sq.r) });
        parts.push({ f, m, kind: 'surd' });
      } else if (d >= 3) {
        const xs = realRootsNum(f.map(q => q.num()));
        xs.forEach(x => roots.push({ x, m, fr: null, tex: null }));
        complex += (d - xs.length) * m;
        parts.push({ f, m, kind: 'numeric', count: xs.length });
      } else if (d === 1) {
        const r = f[0].neg().div(f[1]);
        roots.push({ x: r.num(), m, fr: r, tex: null });
      }
    }
    roots.sort((u, w) => u.x - w.x);
    return { roots, rest: rr.rest, complex, rr, parts };
  }
  /** a zero as the end of an equation: " = \frac{1}{2}", " = 1 + \sqrt{2} ≈ 2.4142", " ≈ 0.3473" */
  const req = o => (o.fr ? ' = ' + TD(o.fr) : o.tex ? ' = ' + o.tex + ' \\approx ' + fmt(o.x) : ' \\approx ' + fmt(o.x));
  const rtex = o => (o.fr ? T(o.fr) : o.tex || '\\approx ' + fmt(o.x));
  /** the factor form a(x − r)^m … (rest), from solvePoly */
  function factorTex(p, sol) {
    const an = p[pdeg(p)];
    let s = coef(an);
    for (const o of sol.rr.roots) s += (o.r.isZero() ? 'x' : '\\mathopen{}\\left(' + xm(o.r) + '\\right)') + (o.m > 1 ? '^{' + o.m + '}' : '');
    if (pdeg(sol.rest) >= 1) s += '\\mathopen{}\\left(' + ptex(pmonic(sol.rest)) + '\\right)';
    return s;
  }

  /* ================================================================ the coordinate plane */
  const CSS = [
    '.fx-out>*{min-width:0}',
    '.fx-wrap{margin:.3em 0 0}',
    '.fx-plot{width:100%;height:auto;display:block;border-radius:12px;background:var(--bg-elev)}',
    '.fx-plot .gr{stroke:var(--line);stroke-width:1}',
    '.fx-plot .ax{stroke:var(--ink-3);stroke-width:1.4}',
    '.fx-plot .tk{fill:var(--ink-3);font:11px var(--font);paint-order:stroke;stroke:var(--bg-elev);stroke-width:3px;stroke-linejoin:round}',
    '.fx-plot .an{fill:var(--ink-2);font:italic 600 14px var(--serif)}',
    '.fx-plot .cv{fill:none;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}',
    '.fx-plot .cv.thin{stroke-width:1.5}',
    '.fx-plot .cv.dash{stroke-dasharray:7 5}',
    '.fx-plot .c0{stroke:var(--accent)}.fx-plot .c1{stroke:var(--y)}.fx-plot .c2{stroke:var(--z)}.fx-plot .c3{stroke:var(--pick)}.fx-plot .c4{stroke:var(--ink-4)}.fx-plot .c5{stroke:var(--bad)}',
    '.fx-plot .pt{stroke:var(--bg-elev);stroke-width:2}',
    '.fx-plot .f0{fill:var(--accent)}.fx-plot .f1{fill:var(--y)}.fx-plot .f2{fill:var(--z)}.fx-plot .f3{fill:var(--pick)}.fx-plot .f4{fill:var(--ink-2)}.fx-plot .f5{fill:var(--bad)}',
    '.fx-plot .pt.open{fill:var(--bg-elev);stroke-width:2.2}',
    '.fx-plot .o0{stroke:var(--accent)}.fx-plot .o1{stroke:var(--y)}.fx-plot .o2{stroke:var(--z)}.fx-plot .o3{stroke:var(--pick)}.fx-plot .o4{stroke:var(--ink-2)}.fx-plot .o5{stroke:var(--bad)}',
    '.fx-plot .lb{fill:var(--ink);font:650 12.5px var(--font);paint-order:stroke;stroke:var(--bg-elev);stroke-width:3.5px;stroke-linejoin:round}',
    '.fx-plot .rc{fill:color-mix(in srgb,var(--accent) 20%,transparent);stroke:var(--accent);stroke-width:1}',
    '.fx-plot .rc.neg{fill:color-mix(in srgb,var(--bad) 16%,transparent);stroke:var(--bad)}',
    '.fx-legend{display:flex;flex-wrap:wrap;gap:4px 16px;margin:8px 2px 0;font-size:.9em;color:var(--ink-2)}',
    '.fx-legend>span{display:inline-flex;align-items:center;gap:7px}',
    '.fx-sw{display:inline-block;width:20px;border-top:3px solid currentColor}',
    '.fx-sw.dash{border-top-style:dashed}',
    '.fx-k0{color:var(--accent)}.fx-k1{color:var(--y)}.fx-k2{color:var(--z)}.fx-k3{color:var(--pick)}.fx-k4{color:var(--ink-4)}.fx-k5{color:var(--bad)}',
    '.fx-row{display:grid;gap:8px}',
    '.fx-cell{display:grid;gap:3px;min-width:0}',
    '.fx-cap{font-size:12.5px;color:var(--ink-3);text-align:center}',
    '.fx-in{text-align:center;padding:8px 4px;min-width:0}',
    '.fx-in.bad,.fx-expr.bad{border-color:var(--bad)}',
    '.lk-chip.fx-chip{height:auto;padding-top:6px;padding-bottom:6px;text-align:left;line-height:1.3;color:var(--ink)}',
    '.fx-cite{margin-left:6px;font-size:.82em;font-weight:600;color:var(--ink-3)}',
  ].join('\n');
  const css = () => { if (!document.getElementById('fx-css')) document.head.append(h('style', { id: 'fx-css', text: CSS })); };
  let seq = 0, live = null, rto = 0;
  /** the width a plot gets inside the output column (a card has 16 px padding and a 1 px border on each side) */
  const plotWidth = out => Math.round(Math.max(270, Math.min(760, ((out && out.clientWidth) || 360) - 34)));
  /** remember the topic on screen, so that turning the phone redraws its plot at the new width */
  const track = (out, draw) => { const w = plotWidth(out); live = { out, draw, w }; return w; };
  window.addEventListener('resize', () => { clearTimeout(rto); rto = setTimeout(() => { if (live && document.body.contains(live.out) && Math.abs(plotWidth(live.out) - live.w) > 24) live.draw(); }, 200); });

  const niceStep = (span, n) => { const raw = span / Math.max(1, n), mag = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / mag; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * mag; };
  const SUPX = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  function tickLabel(v, step) {
    const a = Math.abs(v);
    if (a < step * 1e-6) return '0';
    if (a >= 1e5 || a < 1e-3) {
      const e = Math.floor(Math.log10(a)), m = +(v / Math.pow(10, e)).toFixed(2);
      return (m === 1 ? '' : m === -1 ? '−' : String(m).replace('-', '−') + '×') + '10' + String(e).split('').map(ch => SUPX[ch]).join('');
    }
    return v.toFixed(Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)))).replace('-', '−');
  }
  /** a y-window that shows the curves (cutting off a blow-up so the rest stays readable) and every marked point */
  function autoY(items, x0, x1, zero) {
    const ys = [];
    for (const it of items) {
      if (it.type === 'fn' && !it.nofit) {
        const a = Math.max(x0, it.from == null ? -Infinity : it.from), b = Math.min(x1, it.to == null ? Infinity : it.to);
        if (b > a) for (let j = 0; j <= 240; j++) { const y = it.f(a + ((b - a) * j) / 240); if (Number.isFinite(y)) ys.push(y); }
      }
      if (it.type === 'rect') ys.push(0, it.y);
      if (it.type === 'seg' && !it.nofit) ys.push(it.y1, it.y2);
    }
    const pts = items.filter(it => it.type === 'pt' && it.fit !== false && Number.isFinite(it.y)).map(it => it.y);
    let lo = Infinity, hi = -Infinity;
    if (ys.length) {
      ys.sort((u, w) => u - w);
      const q = f => ys[Math.min(ys.length - 1, Math.max(0, Math.round(f * (ys.length - 1))))];
      lo = ys[0]; hi = ys[ys.length - 1];
      const core = q(0.9) - q(0.1);
      if (core > 0 && hi - lo > 6 * core) { lo = Math.max(lo, q(0.1) - core); hi = Math.min(hi, q(0.9) + core); }
    }
    for (const y of pts) { lo = Math.min(lo, y); hi = Math.max(hi, y); }
    if (!Number.isFinite(lo)) return [-5, 5];
    if (zero) { if (lo > 0 && lo < 0.6 * (hi - lo)) lo = 0; if (hi < 0 && -hi < 0.6 * (hi - lo)) hi = 0; }
    if (!(hi - lo > 1e-9)) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.08;
    return [lo - pad, hi + pad];
  }
  /** a window around some points [x, y], taking in the origin when it is near */
  function around(pts, minHalf = 3) {
    const xs = pts.map(p => p[0]).filter(Number.isFinite), ys = pts.map(p => p[1]).filter(Number.isFinite);
    if (!xs.length) xs.push(0);
    if (!ys.length) ys.push(0);
    let a = Math.min(...xs), b = Math.max(...xs), c = Math.min(...ys), d = Math.max(...ys);
    const big = Math.max(b - a, d - c, 2 * minHalf);
    if (a > 0 && a < big) a = 0;
    if (b < 0 && -b < big) b = 0;
    if (c > 0 && c < big) c = 0;
    if (d < 0 && -d < big) d = 0;
    const px = Math.max((b - a) * 0.2, minHalf - (b - a) / 2, 0.5), py = Math.max((d - c) * 0.2, minHalf - (d - c) / 2, 0.5);
    return { x: [a - px, b + px], y: [c - py, d + py] };
  }
  /** an SVG path for y = f(x) on [a, b]: lifted where f is undefined, at the given breaks (jumps) and across a blow-up */
  function curvePath(f, a, b, X, Y, y0, y1, n, breaks) {
    const span = y1 - y0, lo = y0 - 2 * span, hi = y1 + 2 * span;
    const cuts = [a, ...(breaks || []).filter(t => t > a && t < b).sort((u, w) => u - w), b];
    const atA = (breaks || []).some(t => Math.abs(t - a) < 1e-12), atB = (breaks || []).some(t => Math.abs(t - b) < 1e-12);
    let d = '';
    for (let s = 0; s < cuts.length - 1; s++) {
      const u0 = cuts[s], u1 = cuts[s + 1], m = Math.max(12, Math.round((n * (u1 - u0)) / (b - a))), eps = (u1 - u0) * 1e-7;
      let pen = false, py = null;
      for (let j = 0; j <= m; j++) {
        let x = u0 + ((u1 - u0) * j) / m;
        if (j === 0 && (s > 0 || atA)) x += eps;
        if (j === m && (s < cuts.length - 2 || atB)) x -= eps;
        const y = f(x);
        if (!Number.isFinite(y)) { pen = false; py = null; continue; }
        if (pen && ((py > y1 && y < y0) || (py < y0 && y > y1)) && Math.abs(y - py) > 1.5 * span) pen = false;
        d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(Math.max(lo, Math.min(hi, y))).toFixed(1);
        pen = true;
        py = y;
      }
    }
    return d || 'M0 0';
  }
  /** A coordinate plane. o = { x: [x0, x1], y?: [y0, y1] (else fitted), equal? (same scale on both axes), items, legend?,
      width, label }. Items: { type: 'fn', f, from, to, breaks, nofit } a curve y = f(x); { type: 'gline', A, B, C } the line
      Ax + By + C = 0; { type: 'seg', x1, y1, x2, y2 }; { type: 'vline', x }; { type: 'hline', y }; { type: 'rect', x0, x1, y }
      a rectangle standing on the x-axis; { type: 'pt', x, y, open, label, below, left, r }. c: colour 0–5, dash, thin. */
  function plot(o) {
    css();
    const W = Math.round(o.width || 360), H = Math.round(o.height || Math.max(220, Math.min(430, W * (o.ratio || 0.72))));
    let [x0, x1] = o.x;
    let [y0, y1] = o.y || autoY(o.items, x0, x1, o.zero !== false);
    if (o.equal) {
      const ux = (x1 - x0) / W, uy = (y1 - y0) / H;
      if (ux > uy) { const m = (y0 + y1) / 2; y0 = m - (ux * H) / 2; y1 = m + (ux * H) / 2; }
      else { const m = (x0 + x1) / 2; x0 = m - (uy * W) / 2; x1 = m + (uy * W) / 2; }
    }
    const cl = v => Math.max(-1e5, Math.min(1e5, v));
    const X = x => cl(((x - x0) / (x1 - x0)) * W), Y = y => cl(H - ((y - y0) / (y1 - y0)) * H);
    const cid = 'fxclip' + ++seq;
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'fx-plot', role: 'img', 'aria-label': o.label || 'Graph' });
    svg.append(sv('defs', {}, sv('clipPath', { id: cid }, sv('rect', { x: 0, y: 0, width: W, height: H }))));
    const grid = sv('g', {}), ticks = sv('g', {}), body = sv('g', { 'clip-path': 'url(#' + cid + ')' }), marks = sv('g', {});
    const sx = niceStep(x1 - x0, W / 72), sy = niceStep(y1 - y0, H / 46);
    const showX = y0 < 0 && y1 > 0, showY = x0 < 0 && x1 > 0;
    const xLab = Math.min(H - 5, Math.max(14, Y(0) + 15)), yLabX = X(0) - 6, yInside = !showY || yLabX < 28;
    const marked = o.items.filter(it => it.type === 'pt' && Number.isFinite(it.x) && Number.isFinite(it.y)).map(it => [X(it.x), Y(it.y)]);
    const near = (x, y) => marked.some(([u, v]) => Math.abs(u - x) < 17 && Math.abs(v - y) < 15);
    for (let k = Math.ceil(x0 / sx), stop = k + 400; k * sx <= x1 && k < stop; k++) {
      const px = X(k * sx);
      grid.append(sv('line', { x1: px, x2: px, y1: 0, y2: H, class: 'gr' }));
      if ((k !== 0 || !showX || !showY) && px > 14 && px < W - 14 && !near(px, xLab - 4)) ticks.append(sv('text', { x: px, y: xLab, 'text-anchor': 'middle', class: 'tk' }, tickLabel(k * sx, sx)));
    }
    for (let k = Math.ceil(y0 / sy), stop = k + 400; k * sy <= y1 && k < stop; k++) {
      const py = Y(k * sy);
      grid.append(sv('line', { x1: 0, x2: W, y1: py, y2: py, class: 'gr' }));
      if ((k !== 0 || !showX || !showY) && py > 12 && py < H - 20 && !near(yInside ? 14 : yLabX - 8, py)) ticks.append(sv('text', { x: yInside ? 5 : yLabX, y: py + 4, 'text-anchor': yInside ? 'start' : 'end', class: 'tk' }, tickLabel(k * sy, sy)));
    }
    if (showX) grid.append(sv('line', { x1: 0, x2: W, y1: Y(0), y2: Y(0), class: 'ax' }));
    if (showY) grid.append(sv('line', { x1: X(0), x2: X(0), y1: 0, y2: H, class: 'ax' }));
    if (showX && showY) ticks.append(sv('text', { x: X(0) - 5, y: Y(0) + 14, 'text-anchor': 'end', class: 'tk' }, '0'));
    if (showX) ticks.append(sv('text', { x: W - 7, y: Y(0) - 7, 'text-anchor': 'end', class: 'an' }, 'x'));
    if (showY) ticks.append(sv('text', { x: X(0) + 7, y: 15, class: 'an' }, 'y'));
    const n = o.samples || Math.max(400, Math.round(W * 1.6));
    for (const it of o.items) {
      const cls = 'cv c' + (it.c || 0) + (it.dash ? ' dash' : '') + (it.thin ? ' thin' : '');
      if (it.type === 'fn') {
        const a = Math.max(x0, it.from == null ? -Infinity : it.from), b = Math.min(x1, it.to == null ? Infinity : it.to);
        if (b > a) body.append(sv('path', { d: curvePath(it.f, a, b, X, Y, y0, y1, it.n || n, it.breaks), class: cls }));
      } else if (it.type === 'gline') {
        if (Math.abs(it.B) > 1e-12) body.append(sv('line', { x1: X(x0), y1: Y((-it.C - it.A * x0) / it.B), x2: X(x1), y2: Y((-it.C - it.A * x1) / it.B), class: cls }));
        else body.append(sv('line', { x1: X(-it.C / it.A), x2: X(-it.C / it.A), y1: 0, y2: H, class: cls }));
      } else if (it.type === 'seg') body.append(sv('line', { x1: X(it.x1), y1: Y(it.y1), x2: X(it.x2), y2: Y(it.y2), class: cls }));
      else if (it.type === 'vline') body.append(sv('line', { x1: X(it.x), x2: X(it.x), y1: 0, y2: H, class: cls }));
      else if (it.type === 'hline') body.append(sv('line', { x1: 0, x2: W, y1: Y(it.y), y2: Y(it.y), class: cls }));
      else if (it.type === 'rect') {
        const top = Y(Math.max(0, it.y)), bot = Y(Math.min(0, it.y));
        body.append(sv('rect', { x: X(it.x0), y: top, width: Math.max(0, X(it.x1) - X(it.x0)), height: Math.max(0, bot - top), class: 'rc' + (it.y < 0 ? ' neg' : '') }));
      } else if (it.type === 'pt') {
        if (!Number.isFinite(it.x) || !Number.isFinite(it.y)) continue;
        const px = X(it.x), py = Y(it.y);
        if (px < -3 || px > W + 3 || py < -3 || py > H + 3) continue;
        const c = it.c == null ? 3 : it.c;
        marks.append(sv('circle', { cx: px, cy: py, r: it.r || 4.5, class: 'pt ' + (it.open ? 'open o' + c : 'f' + c) }));
        if (it.label) {
          const left = it.left || px > W - 70, below = it.below || py < 22;
          marks.append(sv('text', { x: px + (left ? -9 : 9), y: py + (it.side ? 4.5 : below ? 17 : -8), 'text-anchor': left ? 'end' : 'start', class: 'lb' }, it.label));
        }
      }
    }
    svg.append(grid, ticks, body, marks);
    const wrap = h('div', { class: 'fx-wrap' }, svg);
    if (o.legend) wrap.append(h('div', { class: 'fx-legend' }, o.legend.map(l => h('span', {}, h('i', { class: 'fx-sw fx-k' + (l.c || 0) + (l.dash ? ' dash' : '') }), h('span', { html: rich(l.text) })))));
    return wrap;
  }

  /* ================================================================ controls */
  /** numbers side by side (a point's x and y; a line's A, B, C; a, b, c): each typed as 3, -1/2, 0.25 (real: also pi, e) */
  function numRow({ label, names, values, onChange, help, real }) {
    const err = h('div', { class: 'lk-err', hidden: true });
    const inputs = names.map((nm, i) => h('input', { class: 'field fx-in', type: 'text', value: values[i] == null ? '' : values[i], autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': nm.replace(/\$/g, '') }));
    const apply = () => {
      let bad = null;
      inputs.forEach(inp => { try { (real ? parseReal : F.parse)(inp.value); inp.classList.remove('bad'); } catch (e) { inp.classList.add('bad'); if (!bad) bad = e.message; } });
      if (bad) { err.textContent = bad; err.hidden = false; return; }
      err.hidden = true;
      onChange(inputs.map(inp => inp.value.replace(/\s+/g, '')));
    };
    inputs.forEach(inp => inp.addEventListener('input', apply));
    const row = h('div', { class: 'fx-row', style: 'grid-template-columns:repeat(' + names.length + ',minmax(0,1fr))' }, names.map((nm, i) => h('label', { class: 'fx-cell' }, h('span', { class: 'fx-cap', html: rich(nm) }), inputs[i])));
    return h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', html: rich(label) }), row, help ? h('div', { class: 'lk-help', html: rich(help) }) : null, err);
  }
  /** a typed expression (a polynomial, a list of zeros), checked as it is typed */
  function exprField({ label, value, parse, onChange, help, placeholder }) {
    const id = 'fxe' + ++seq;
    const input = h('input', { id, class: 'field fx-expr', type: 'text', value, placeholder, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const err = h('div', { class: 'lk-err', hidden: true });
    input.addEventListener('input', () => {
      try { parse(input.value); input.classList.remove('bad'); err.hidden = true; onChange(input.value.replace(/\s+/g, '')); }
      catch (e) { input.classList.add('bad'); err.textContent = e.message; err.hidden = false; }
    });
    return h('div', { class: 'lk-field' }, h('label', { for: id, html: rich(label) }), input, help ? h('div', { class: 'lk-help', html: rich(help) }) : null, err);
  }
  /** "Try" chips: lecture examples (cite: "lecture 3.8") and telling cases */
  function tries(list, pick) {
    css();
    return h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }),
      h('div', { class: 'lk-presets' }, list.map(t => h('button', { type: 'button', class: 'lk-chip fx-chip', onclick: () => pick(t.v) }, t.label, t.cite ? h('span', { class: 'fx-cite', text: t.cite }) : null))),
      list.some(t => t.cite) ? h('div', { class: 'lk-help', text: 'Lecture numbers are Maths 1 week.lecture, as on the week pages.' }) : null);
  }
  /** keep an inline formula together with the punctuation right after it, so a line never starts with "." or ")":
      an invisible word joiner (U+2060) forbids that one break and leaves every break inside the formula alone */
  function glue(root) {
    root.querySelectorAll('.katex').forEach(k => {
      const n = k.nextSibling;
      if (k.closest('.katex-display') || !n || n.nodeType !== 3 || !/^[.,:;!?)\]]/.test(n.data)) return;
      n.data = '\u2060' + n.data;
    });
  }
  /** K.layout, with an output column whose blocks may shrink (a long answer then scrolls inside its box), and
      punctuation glued to formulas after every redraw */
  const lay = el => {
    css();
    const L = K.layout(el);
    L.out.classList.add('fx-out');
    for (const box of [L.controls, L.out]) { glue(box); new MutationObserver(() => glue(box)).observe(box, { childList: true }); }
    return L;
  };
  const bad = (out, e) => out.append(K.note(REV.esc(e.message), 'warn'));
  const ok = s => K.note('Check: ' + s, 'good');

  /* ================================================================ straight lines */
  /** the line Ax + By + C = 0 with whole, coprime A, B, C and A > 0 (or A = 0, B > 0); with its slope m and y-intercept c */
  function lineFrom(A, B, C) {
    const L = blcm(blcm(A.d, B.d), C.d);
    let a = A.n * (L / A.d), b = B.n * (L / B.d), c = C.n * (L / C.d);
    const g = bgcd(bgcd(a, b), c) || 1n;
    a /= g; b /= g; c /= g;
    if (a < 0n || (a === 0n && b < 0n)) { a = -a; b = -b; c = -c; }
    const o = { A: F(a), B: F(b), C: F(c), vertical: b === 0n };
    if (!o.vertical) { o.m = o.A.neg().div(o.B); o.c = o.C.neg().div(o.B); }
    return o;
  }
  const gtex = L => linTex([[L.A, 'x'], [L.B, 'y'], [L.C, '']]) + ' = 0';
  const stex = L => (L.vertical ? 'x = ' + T(L.C.neg().div(L.A)) : 'y = ' + linTex([[L.m, 'x'], [L.c, '']]));
  /** A·x + B·y + C with the numbers put in */
  const lineAt = (L, x, y) => T(L.A) + ' \\cdot ' + par(x) + term(L.B, y) + sgn(L.C);

  /* ================================================================ roots, powers and logarithms, exact when they can be */
  /** the whole k-th root of n ≥ 0 when n is a perfect k-th power, else null */
  function iroot(n, k) {
    if (n < 0n) return null;
    if (n < 2n) return n;
    const kk = BigInt(k);
    let x = 1n << BigInt(Math.ceil(n.toString(2).length / k) + 1);
    for (;;) { const y = ((kk - 1n) * x + n / x ** (kk - 1n)) / kk; if (y >= x) break; x = y; }
    while (x ** kk > n) x--;
    while ((x + 1n) ** kk <= n) x++;
    return x ** kk === n ? x : null;
  }
  /** the k-th root of a fraction when it is a fraction (an odd k allows a negative), else null */
  function rootFr(q, k) {
    if (neg(q) && k % 2 === 0) return null;
    const a = iroot(babs(q.n), k), b = iroot(q.d, k);
    return a == null || b == null ? null : F(neg(q) ? -a : a, b);
  }
  /** the exponent r with b^r = x exactly (r = p/q with q ≤ 12), or null */
  function exactLog(b, x) {
    if (x.fr && x.fr.eq(1)) return F(0);
    if (b.fr && x.fr) {
      const lb = Math.log(b.x), lx = Math.log(x.x);
      for (let q = 1; q <= 12; q++) {
        const r = (q * lx) / lb, p = Math.round(r);
        if (Math.abs(r - p) > 1e-7 || Math.abs(p) > 400) continue;
        if (b.fr.pow(p).eq(x.fr.pow(q))) return F(p, q);
      }
      return null;
    }
    return !b.fr && !x.fr && b.tex && b.tex === x.tex ? F(1) : null;
  }
  const logv = (b, x) => { const r = exactLog(b, x); return r ? ex(r) : ap(Math.log(x.x) / Math.log(b.x)); };
  /** b^v: exact for an exact base and a whole (or exactly rootable) exponent, else rounded */
  function vpow(b, v) {
    if (b.fr && v.fr) {
      if (v.fr.isInt() && babs(v.fr.n) <= 60n && !(b.fr.isZero() && neg(v.fr))) return ex(b.fr.pow(Number(v.fr.n)));
      if (v.fr.d <= 12n && babs(v.fr.n) <= 60n && !neg(b.fr)) { const r = rootFr(b.fr, Number(v.fr.d)); if (r && !(r.isZero() && neg(v.fr))) return ex(r.pow(Number(v.fr.n))); }
    }
    return ap(Math.pow(b.x, v.x), !b.fr && b.tex && v.fr ? baseTex(b) + '^{' + T(v.fr) + '}' : null);
  }
  const vcbrt = v => { if (v.fr) { const r = rootFr(v.fr, 3); if (r) return ex(r); } return ap(Math.cbrt(v.x)); };
  const vneg = v => (v.fr ? ex(v.fr.neg()) : ap(-v.x, v.tex ? (v.tex.startsWith('-') ? v.tex.slice(1) : '-' + v.tex) : null));
  const isZ = v => vsign(v) === 0;

  /* ---------------------------------------------------------------- formulas around an inside u */
  /** is u a sum at its top level ("x + 1", "2 - x") */
  function isSum(u) {
    let d = 0;
    for (let i = 0; i < u.length; i++) {
      const ch = u[i];
      if (ch === '{' || ch === '(') d++;
      else if (ch === '}' || ch === ')') d--;
      else if (d === 0 && i > 0 && (ch === '+' || ch === '-')) return true;
    }
    return false;
  }
  const wrapMul = u => (isSum(u) || u.startsWith('-') ? '\\mathopen{}\\left(' + u + '\\right)' : u);
  /** is u a single bracket group, \\left( … \\right), with nothing outside it */
  function oneGroup(u) {
    if (!u.startsWith('\\mathopen{}\\left(') || !u.endsWith('\\right)')) return false;
    let d = 0;
    for (let i = 0; i < u.length; i++) {
      if (u.startsWith('\\left', i)) d++;
      else if (u.startsWith('\\right', i) && --d === 0 && i !== u.length - 7) return false;
    }
    return true;
  }
  const wrapPow = u => (/^([a-z]|\d+)$/i.test(u) || oneGroup(u) ? u : '\\mathopen{}\\left(' + u + '\\right)');
  /** p·u: 3x, -x, \frac{1}{2}x, 3 \cdot 2, 3\left(x + 1\right), \pi x */
  function cmul(p, u) {
    if (p.fr && p.fr.eq(1)) return u;
    if (p.fr && p.fr.eq(-1)) return '-' + wrapMul(u);
    const pt = vt(p), w = wrapMul(u), pre = !p.fr && pt.startsWith('-') ? '\\mathopen{}\\left(' + pt + '\\right)' : pt;
    return pre + (/^[0-9.]/.test(w) || w.startsWith('\\frac') ? ' \\cdot ' : /[a-z]$/i.test(pre) ? ' ' : '') + w;
  }
  /** t + q with the sign of q folded in: x + 4, x - 4, x */
  const cadd = (t, q) => { if (isZ(q)) return t; const qt = vt(q); return qt.startsWith('-') ? t + ' - ' + qt.slice(1) : t + ' + ' + qt; };
  /** t ÷ p as a fraction (nothing to do when p = 1) */
  const cdiv = (t, p) => (p.fr && p.fr.eq(1) ? t : p.fr && p.fr.eq(-1) ? '-' + wrapMul(t) : '\\frac{' + t + '}{' + vt(p) + '}');
  /** a value put in place of x: (−2), \frac{1}{2}, 1.4142 */
  const sub = v => { const t = vt(v); return t.startsWith('-') || (!v.fr && isSum(t)) ? '\\mathopen{}\\left(' + t + '\\right)' : t; };
  const baseTex = b => (b.fr ? (b.fr.isInt() && !neg(b.fr) ? T(b.fr) : '\\mathopen{}\\left(' + T(b.fr) + '\\right)') : /^(e|\\pi)$/.test(vt(b)) ? vt(b) : '\\mathopen{}\\left(' + vt(b) + '\\right)');
  const logName = b => (!b.fr && b.tex === 'e' ? '\\ln' : '\\log_{' + vt(b) + '}');
  const logOf = (b, u) => logName(b) + (/^([a-z]|\d+)$/i.test(u) ? ' ' + u : '\\mathopen{}\\left(' + u + '\\right)');
  /** sorted numbers that fall inside [x0, x1] */
  const inside = (xs, x0, x1) => xs.filter(t => Number.isFinite(t) && t > x0 && t < x1);

  /* ================================================================ the menu of functions for composition and inverses */
  // Each family: its parameters [letter, default], tex(u, P) its formula around an inside u, ev(v, P) its value at v
  // ({ v } or { err }), poly(P) its polynomial when it is one, inv(P) how to undo it (or why it cannot be undone),
  // breaks(P) where it jumps or blows up. P holds the parameters as values (exact or rounded).
  const FAM = {
    lin: {
      name: 'Linear: p·x + q', pars: [['p', '3'], ['q', '-4']],
      tex: (u, [p, q]) => (isZ(p) ? vt(q) : cadd(cmul(p, u), q)),
      ev: (v, [p, q]) => ({ v: vadd(vmul(p, v), q) }),
      poly: ([p, q]) => (p.fr && q.fr ? ptrim([q.fr, p.fr]) : null),
      inv([p, q]) {
        if (isZ(p)) return { no: 'With $p = 0$ the function is the constant $' + vt(q) + '$: every input gives the same output, so it is not one-to-one and cannot be undone.', twin: v => vadd(v, ex(1)) };
        const top = cadd('x', vneg(q));
        return {
          steps: [['Swap $x$ and $y$ (the inverse sends each output back to its input):', 'x = ' + cadd(cmul(p, 'y'), q)]]
            .concat(isZ(q) ? [] : [[vsign(q) < 0 ? 'Add $' + vt(vneg(q)) + '$ to both sides:' : 'Take $' + vt(q) + '$ away from both sides:', top + ' = ' + cmul(p, 'y')]])
            .concat(p.fr && p.fr.eq(1) ? [] : [['Divide both sides by $' + vt(p) + '$:', 'y = ' + cdiv(top, p)]]),
          tex: cdiv(top, p), ev: v => ({ v: vdiv(vsub(v, q), p) }), dom: 'every real number',
        };
      },
    },
    quad: {
      name: 'Square: p·x² + q', pars: [['p', '1'], ['q', '0']],
      tex: (u, [p, q]) => (isZ(p) ? vt(q) : cadd(cmul(p, wrapPow(u) + '^2'), q)),
      ev: (v, [p, q]) => ({ v: vadd(vmul(p, vmul(v, v)), q) }),
      poly: ([p, q]) => (p.fr && q.fr ? ptrim([q.fr, F(0), p.fr]) : null),
      inv([p, q]) {
        const top = cadd('x', vneg(q));
        return {
          no: isZ(p) ? 'With $p = 0$ the function is a constant, so it cannot be undone.' : 'It is not one-to-one: $x$ and $-x$ give the same output, so a horizontal line can meet the graph twice (lecture 5.1). There is no inverse on all of $\\mathbb{R}$.',
          twin: v => (isZ(p) ? vadd(v, ex(1)) : isZ(v) ? ex(1) : vneg(v)),
          part: isZ(p) ? null : {
            note: 'Keep only the right half, $x \\ge 0$. There it is one-to-one, and the steps below undo it (lecture 5.10 does this for $x^2 + 1$).',
            steps: [['Swap $x$ and $y$ (with $y \\ge 0$):', 'x = ' + cadd(cmul(p, 'y^2'), q)], ['Solve for $y^2$:', 'y^2 = ' + cdiv(top, p)], ['Take the square root that is $\\ge 0$:', 'y = \\sqrt{' + cdiv(top, p) + '}']],
            tex: '\\sqrt{' + cdiv(top, p) + '}',
            ev: v => { const t = vdiv(vsub(v, q), p); return t.x < 0 ? { err: 'It has no real square root there.' } : { v: vsqrt(t) }; },
          },
        };
      },
    },
    cube: {
      name: 'Cube: p·x³ + q', pars: [['p', '1'], ['q', '0']],
      tex: (u, [p, q]) => (isZ(p) ? vt(q) : cadd(cmul(p, wrapPow(u) + '^3'), q)),
      ev: (v, [p, q]) => ({ v: vadd(vmul(p, vmul(v, vmul(v, v))), q) }),
      poly: ([p, q]) => (p.fr && q.fr ? ptrim([q.fr, F(0), F(0), p.fr]) : null),
      inv([p, q]) {
        if (isZ(p)) return { no: 'With $p = 0$ the function is a constant, so it cannot be undone.', twin: v => vadd(v, ex(1)) };
        const top = cadd('x', vneg(q));
        return {
          steps: [['Swap $x$ and $y$:', 'x = ' + cadd(cmul(p, 'y^3'), q)], ['Solve for $y^3$:', 'y^3 = ' + cdiv(top, p)], ['Every real number has exactly one real cube root (lecture 5.9):', 'y = \\sqrt[3]{' + cdiv(top, p) + '}']],
          tex: '\\sqrt[3]{' + cdiv(top, p) + '}', ev: v => ({ v: vcbrt(vdiv(vsub(v, q), p)) }), dom: 'every real number',
        };
      },
    },
    sqrt: {
      name: 'Square root: √(p·x + q)', pars: [['p', '1'], ['q', '0']],
      tex: (u, [p, q]) => '\\sqrt{' + (isZ(p) ? vt(q) : cadd(cmul(p, u), q)) + '}',
      ev: (v, [p, q]) => { const t = vadd(vmul(p, v), q); return t.x < -1e-12 ? { err: 'The square root of $' + vt(t) + '$, a negative number, is not a real number.' } : { v: vsqrt(t.fr ? t : ap(Math.max(0, t.x))) }; },
      inv([p, q]) {
        if (isZ(p)) return { no: 'With $p = 0$ the function is a constant, so it cannot be undone.', twin: v => vadd(v, ex(1)) };
        return {
          steps: [['Swap $x$ and $y$; a square root is never negative, so $x \\ge 0$:', 'x = \\sqrt{' + cadd(cmul(p, 'y'), q) + '}'], ['Square both sides:', 'x^2 = ' + cadd(cmul(p, 'y'), q)], ['Solve for $y$:', 'y = ' + cdiv(cadd('x^2', vneg(q)), p)]],
          tex: cdiv(cadd('x^2', vneg(q)), p), dom: '$x \\ge 0$ (the outputs of the square root)',
          ev: v => (v.x < 0 ? { err: 'The inverse only takes $x \\ge 0$, the outputs of a square root.' } : { v: vdiv(vsub(vmul(v, v), q), p) }),
        };
      },
    },
    recip: {
      name: 'Reciprocal: p/(x + q)', pars: [['p', '1'], ['q', '0']],
      tex: (u, [p, q]) => '\\frac{' + vt(p) + '}{' + cadd(u, q) + '}',
      ev: (v, [p, q]) => { const d = vadd(v, q); return isZ(d) ? { err: 'The bottom is $' + cadd(vt(v), q) + ' = 0$, and nothing can be divided by $0$.' } : { v: vdiv(p, d) }; },
      breaks: ([, q]) => [-q.x],
      inv([p, q]) {
        if (isZ(p)) return { no: 'With $p = 0$ the function is $0$ wherever it is defined, so it cannot be undone.', twin: v => vadd(v, ex(1)) };
        return {
          steps: [['Swap $x$ and $y$:', 'x = \\frac{' + vt(p) + '}{' + cadd('y', q) + '}'], ['Multiply by the bottom and divide by $x$:', cadd('y', q) + ' = \\frac{' + vt(p) + '}{x}'], ['Solve for $y$:', 'y = ' + cadd('\\frac{' + vt(p) + '}{x}', vneg(q))]],
          tex: cadd('\\frac{' + vt(p) + '}{x}', vneg(q)), dom: '$x \\ne 0$', ibreaks: () => [0],
          ev: v => (isZ(v) ? { err: 'The inverse is not defined at $0$.' } : { v: vsub(vdiv(p, v), q) }),
        };
      },
    },
    frac: {
      name: 'Fraction: (a·x + b)/(c·x + d)', pars: [['a', '4'], ['b', '5'], ['c', '3'], ['d', '-2']],
      check: ([, , c, d]) => { if (isZ(c) && isZ(d)) throw new Error('c and d cannot both be 0: the bottom would always be 0.'); },
      tex: (u, [a, b, c, d]) => '\\frac{' + (isZ(a) ? vt(b) : cadd(cmul(a, u), b)) + '}{' + (isZ(c) ? vt(d) : cadd(cmul(c, u), d)) + '}',
      ev: (v, [a, b, c, d]) => { const den = vadd(vmul(c, v), d); return isZ(den) ? { err: 'The bottom $cx + d$ is $0$ there, and nothing can be divided by $0$.' } : { v: vdiv(vadd(vmul(a, v), b), den) }; },
      breaks: ([, , c, d]) => (isZ(c) ? [] : [-d.x / c.x]),
      inv([a, b, c, d]) {
        const det = vsub(vmul(a, d), vmul(b, c));
        if (isZ(det)) return { no: 'Here $ad - bc = 0$: the top is a multiple of the bottom, so the function is a constant wherever it is defined and cannot be undone.', twin: v => vadd(v, ex(1)) };
        const top = cadd(isZ(d) ? '' : cmul(vneg(d), 'x'), b) || '0', bot = cadd(isZ(c) ? '' : cmul(c, 'x'), vneg(a));
        const fixTop = top.startsWith(' + ') ? top.slice(3) : top.startsWith(' - ') ? '-' + top.slice(3) : top;
        const fixBot = bot.startsWith(' + ') ? bot.slice(3) : bot.startsWith(' - ') ? '-' + bot.slice(3) : bot;
        return {
          steps: [['Swap $x$ and $y$:', 'x = \\frac{' + (isZ(a) ? vt(b) : cadd(cmul(a, 'y'), b)) + '}{' + (isZ(c) ? vt(d) : cadd(cmul(c, 'y'), d)) + '}'],
            ['Multiply both sides by the bottom:', 'x\\mathopen{}\\left(' + (isZ(c) ? vt(d) : cadd(cmul(c, 'y'), d)) + '\\right) = ' + (isZ(a) ? vt(b) : cadd(cmul(a, 'y'), b))],
            ['Bring the $y$ terms to one side and take $y$ out: $y(cx - a) = b - dx$:', 'y\\mathopen{}\\left(' + fixBot + '\\right) = ' + fixTop],
            ['Divide (lecture 5.10 does this for $\\frac{4x + 5}{3x - 2}$):', 'y = \\frac{' + fixTop + '}{' + fixBot + '}']],
          tex: '\\frac{' + fixTop + '}{' + fixBot + '}', dom: isZ(c) ? 'every real number' : '$x \\ne ' + vt(vdiv(a, c)) + '$',
          ibreaks: () => (isZ(c) ? [] : [a.x / c.x]),
          ev: v => { const den = vsub(vmul(c, v), a); return isZ(den) ? { err: 'The inverse is not defined there (its bottom is $0$).' } : { v: vdiv(vsub(b, vmul(d, v)), den) }; },
        };
      },
    },
    abs: {
      name: 'Absolute value: p·|x| + q', pars: [['p', '1'], ['q', '0']],
      tex: (u, [p, q]) => (isZ(p) ? vt(q) : cadd(cmul(p, '\\mathopen{}\\left|' + u + '\\right|'), q)),
      ev: (v, [p, q]) => ({ v: vadd(vmul(p, v.fr ? ex(fabs(v.fr)) : ap(Math.abs(v.x))), q) }),
      inv([p, q]) {
        return {
          no: isZ(p) ? 'With $p = 0$ the function is a constant, so it cannot be undone.' : 'It is not one-to-one: $|x| = |-x|$, so $x$ and $-x$ give the same output and a horizontal line meets the graph twice (lecture 5.2).',
          twin: v => (isZ(p) ? vadd(v, ex(1)) : isZ(v) ? ex(1) : vneg(v)),
          part: isZ(p) ? null : {
            note: 'On $x \\ge 0$ alone it is $p \\cdot x + q$, which is one-to-one and undone by:',
            steps: [['Swap $x$ and $y$ (with $y \\ge 0$):', 'x = ' + cadd(cmul(p, 'y'), q)], ['Solve for $y$:', 'y = ' + cdiv(cadd('x', vneg(q)), p)]],
            tex: cdiv(cadd('x', vneg(q)), p),
            ev: v => { const t = vdiv(vsub(v, q), p); return t.x < 0 ? { err: 'That output does not come from an $x \\ge 0$.' } : { v: t }; },
          },
        };
      },
    },
    exp: {
      name: 'Exponential: p·bˣ', pars: [['p', '1'], ['b', '2']],
      check: ([, b]) => { if (!(b.x > 0) || veq(b, ex(1))) throw new Error('The base b must be positive and not 1.'); },
      tex: (u, [p, b]) => (isZ(p) ? '0' : cmul(p, baseTex(b) + '^{' + u + '}')),
      ev: (v, [p, b]) => ({ v: vmul(p, vpow(b, v)) }),
      inv([p, b]) {
        if (isZ(p)) return { no: 'With $p = 0$ the function is $0$, so it cannot be undone.', twin: v => vadd(v, ex(1)) };
        return {
          steps: [['Swap $x$ and $y$:', 'x = ' + cmul(p, baseTex(b) + '^{y}')]].concat(p.fr && p.fr.eq(1) ? [] : [['Divide by $' + vt(p) + '$:', baseTex(b) + '^{y} = ' + cdiv('x', p)]]).concat([['The power that gives this is a logarithm (lecture 6.1):', 'y = ' + logOf(b, cdiv('x', p))]]),
          tex: logOf(b, cdiv('x', p)), dom: vsign(p) > 0 ? '$x > 0$' : '$x < 0$',
          ev: v => { const t = vdiv(v, p); return t.x <= 0 ? { err: 'Logarithms only take positive numbers.' } : { v: logv(b, t) }; },
        };
      },
    },
    log: {
      name: 'Logarithm: p·log_b x', pars: [['p', '1'], ['b', '2']],
      check: ([, b]) => { if (!(b.x > 0) || veq(b, ex(1))) throw new Error('The base b must be positive and not 1.'); },
      tex: (u, [p, b]) => (isZ(p) ? '0' : cmul(p, logOf(b, u))),
      ev: (v, [p, b]) => (v.x <= 0 ? { err: 'The logarithm of $' + vt(v) + '$ is not defined: logarithms only take positive numbers.' } : { v: vmul(p, logv(b, v)) }),
      inv([p, b]) {
        if (isZ(p)) return { no: 'With $p = 0$ the function is $0$, so it cannot be undone.', twin: v => vadd(v, ex(1)) };
        return {
          steps: [['Swap $x$ and $y$:', 'x = ' + cmul(p, logOf(b, 'y'))]].concat(p.fr && p.fr.eq(1) ? [] : [['Divide by $' + vt(p) + '$:', logOf(b, 'y') + ' = ' + cdiv('x', p)]]).concat([['A logarithm is a power of the base, so raise $' + vt(b) + '$ to both sides (lecture 6.1):', 'y = ' + baseTex(b) + '^{' + cdiv('x', p) + '}']]),
          tex: baseTex(b) + '^{' + cdiv('x', p) + '}', dom: 'every real number', ev: v => ({ v: vpow(b, vdiv(v, p)) }),
        };
      },
    },
  };
  /** the parameters of a family, typed (a missing one takes its default) */
  function famPars(fam, str, who) {
    const P = split(str, fam.pars.length).map((t, i) => { try { return parseReal(t === '' ? fam.pars[i][1] : t); } catch (e) { throw new Error('In ' + who + ', ' + fam.pars[i][0] + ': ' + e.message); } });
    if (fam.check) try { fam.check(P); } catch (e) { throw new Error('In ' + who + ': ' + e.message); }
    return P;
  }
  /** a family as a plain function of a number (NaN where it is not defined), for drawing */
  const famFn = (fam, P) => x => { const r = fam.ev(ap(x), P); return r.err ? NaN : r.v.x; };
  /** p(q(x)) for polynomials */
  const pcompose = (p, q) => { let r = [F(0)]; for (let j = p.length - 1; j >= 0; j--) r = padd(pmul(r, q), [p[j]]); return r; };

  /* ================================================================ the menu of functions for limits */
  // at(a) → { L, R } one-sided limits ({ v } a value, { inf: ±1 } a blow-up, { osc: true } no limit), val f(a) or null,
  // why: the reasons from each side (and wv why f(a) is what it is)
  const lim = v => ({ v }), INF = s => ({ inf: s }), OSC = { osc: true };
  const isWhole = v => (v.fr ? v.fr.isInt() : Number.isInteger(v.x));
  const LIMF = {
    square: { name: 'x², a polynomial', tex: 'x^2', f: x => x * x,
      at: a => { const v = vmul(a, a); return { L: lim(v), R: lim(v), val: v, why: 'Near $a$, $x^2$ is near $a^2$: a polynomial is continuous everywhere, so put $x = a$ straight in.' }; } },
    hole: { name: '(x² − 5x + 6)/(x − 2), a hole', tex: '\\frac{x^2 - 5x + 6}{x - 2}', f: x => (x * x - 5 * x + 6) / (x - 2),
      at: a => (veq(a, ex(2)) ? { L: lim(ex(-1)), R: lim(ex(-1)), val: null, wv: 'Putting $x = 2$ in gives $\\frac{0}{0}$, which is not a number.', why: 'For $x \\ne 2$ the factor $(x - 2)$ cancels: $\\frac{(x - 2)(x - 3)}{x - 2} = x - 3$, and $x - 3$ gets close to $2 - 3 = -1$ (lecture 7.5).' }
        : (() => { const v = vsub(a, ex(3)); return { L: lim(v), R: lim(v), val: v, why: 'The bottom $x - 2$ is not $0$ at $a$, so put $x = a$ in. (Since $x^2 - 5x + 6 = (x - 2)(x - 3)$, the value is $a - 3$.)' }; })()) },
    floor: { name: '⌊x⌋, the floor (greatest whole number ≤ x)', tex: '\\lfloor x \\rfloor', f: Math.floor, breaks: (x0, x1) => { const o = []; for (let k = Math.ceil(x0); k <= x1; k++) o.push(k); return o; },
      at: a => { if (isWhole(a)) { const n = a.fr ? a : ex(Math.round(a.x)), m = vsub(n, ex(1)); return { L: lim(m), R: lim(n), val: n, whyL: 'Just left of $' + vt(n) + '$, $x$ is between $' + vt(m) + '$ and $' + vt(n) + '$, so $\\lfloor x \\rfloor = ' + vt(m) + '$.', whyR: 'Just right of $' + vt(n) + '$, $x$ is between $' + vt(n) + '$ and $' + vt(vadd(n, ex(1))) + '$, so $\\lfloor x \\rfloor = ' + vt(n) + '$.' }; }
        const n = ex(Math.floor(a.x)); return { L: lim(n), R: lim(n), val: n, why: 'Between the whole numbers $' + vt(n) + '$ and $' + vt(vadd(n, ex(1))) + '$ the floor stays $' + vt(n) + '$, on both sides of $a$.' }; } },
    recip: { name: '1/x, a blow-up', tex: '\\frac{1}{x}', f: x => 1 / x, breaks: () => [0], yr: [-8, 8],
      at: a => (isZ(a) ? { L: INF(-1), R: INF(1), val: null, wv: '$\\frac{1}{0}$ is not a number.', whyL: 'For small negative $x$ ($-0.1, -0.01, \\dots$), $\\frac{1}{x}$ is $-10, -100, \\dots$: it falls without bound.', whyR: 'For small positive $x$, $\\frac{1}{x}$ is $10, 100, \\dots$: it grows without bound (lecture 7.6).' }
        : (() => { const v = vdiv(ex(1), a); return { L: lim(v), R: lim(v), val: v, why: 'Away from $0$, $\\frac{1}{x}$ is continuous, so put $x = a$ in.' }; })()) },
    recip2: { name: '1/x², a blow-up on both sides', tex: '\\frac{1}{x^2}', f: x => 1 / (x * x), breaks: () => [0], yr: [-1.5, 12],
      at: a => (isZ(a) ? { L: INF(1), R: INF(1), val: null, wv: '$\\frac{1}{0}$ is not a number.', why: 'From either side $x^2$ is a tiny positive number, so $\\frac{1}{x^2}$ grows without bound.' }
        : (() => { const v = vdiv(ex(1), vmul(a, a)); return { L: lim(v), R: lim(v), val: v, why: 'Away from $0$ it is continuous, so put $x = a$ in.' }; })()) },
    sinc: { name: 'sin(x)/x, a hole', tex: '\\frac{\\sin x}{x}', f: x => Math.sin(x) / x,
      at: a => (isZ(a) ? { L: lim(ex(1)), R: lim(ex(1)), val: null, wv: 'Putting $x = 0$ in gives $\\frac{0}{0}$.', why: 'Squeezed between $\\cos x$ and $1$, which both tend to $1$, it tends to $1$ (lecture 7.6; also L’Hôpital, lecture 8.2).' }
        : (() => { const v = ap(Math.sin(a.x) / a.x, '\\frac{\\sin ' + sub(a) + '}{' + vt(a) + '}'); return { L: lim(v), R: lim(v), val: v, why: 'Away from $0$ the bottom is not $0$, so put $x = a$ in.' }; })()) },
    cosq: { name: '(1 − cos x)/x², a hole', tex: '\\frac{1 - \\cos x}{x^2}', f: x => (1 - Math.cos(x)) / (x * x),
      at: a => (isZ(a) ? { L: lim(ex(F(1, 2))), R: lim(ex(F(1, 2))), val: null, wv: 'Putting $x = 0$ in gives $\\frac{0}{0}$.', why: 'With $1 - \\cos x = 2\\sin^2\\frac{x}{2}$ it equals $\\frac{1}{2}\\mathopen{}\\left(\\frac{\\sin(x/2)}{x/2}\\right)^2$, which tends to $\\frac{1}{2}$ (lecture 7.6).' }
        : (() => { const v = ap((1 - Math.cos(a.x)) / (a.x * a.x)); return { L: lim(v), R: lim(v), val: v, why: 'Away from $0$ the bottom is not $0$, so put $x = a$ in.' }; })()) },
    sign: { name: '|x|/x, a jump', tex: '\\frac{|x|}{x}', f: x => Math.abs(x) / x, breaks: () => [0],
      at: a => (isZ(a) ? { L: lim(ex(-1)), R: lim(ex(1)), val: null, wv: '$\\frac{0}{0}$ is not a number.', whyL: 'For $x < 0$, $|x| = -x$, so $\\frac{|x|}{x} = -1$.', whyR: 'For $x > 0$, $|x| = x$, so $\\frac{|x|}{x} = 1$.' }
        : (() => { const v = ex(vsign(a)); return { L: lim(v), R: lim(v), val: v, why: 'Near $a$ every $x$ has the sign of $a$, so the value stays $' + vt(v) + '$.' }; })()) },
    moved: { name: 'x², but f(1) = 3 (a moved point)', tex: '\\begin{cases} x^2 & x \\ne 1 \\\\ 3 & x = 1 \\end{cases}', f: x => x * x,
      at: a => (veq(a, ex(1)) ? { L: lim(ex(1)), R: lim(ex(1)), val: ex(3), wv: 'The definition says $f(1) = 3$.', why: 'Near $1$ (but not at it) $f(x) = x^2$, which gets close to $1$.' }
        : (() => { const v = vmul(a, a); return { L: lim(v), R: lim(v), val: v, why: 'Near $a \\ne 1$ the function is just $x^2$: put $x = a$ in.' }; })()) },
    sin1x: { name: 'sin(1/x), wild near 0', tex: '\\sin\\frac{1}{x}', f: x => Math.sin(1 / x), breaks: () => [0], yr: [-1.6, 1.6], n: 6000, half: 1,
      at: a => (isZ(a) ? { L: OSC, R: OSC, val: null, wv: '$\\frac{1}{0}$ is not a number.', why: 'As $x \\to 0$, $\\frac{1}{x}$ runs off to $\\pm\\infty$ and the sine swings between $-1$ and $1$ faster and faster: the values never settle.' }
        : (() => { const v = ap(Math.sin(1 / a.x)); return { L: lim(v), R: lim(v), val: v, why: 'Away from $0$ it is continuous, so put $x = a$ in.' }; })()) },
  };

  /* ================================================================ the menu of functions for derivatives */
  // f(k) and d(k) are f and f′ as functions of a number (k is the family's parameter), tex/dtex their formulas,
  // fAt/dAt(t) the formulas at a point t, rules(k) the named rules that give f′, dom/diff where f is defined/differentiable
  const sec2 = x => 1 / Math.cos(x) ** 2;
  const odd = k => (x0, x1) => { const c = Math.abs(k), o = []; for (let j = Math.ceil((x0 * c) / Math.PI - 0.5); ((j + 0.5) * Math.PI) / c <= x1 && o.length < 2000; j++) o.push(((j + 0.5) * Math.PI) / c); return o; };
  const br = t => '\\mathopen{}\\left(' + t + '\\right)';
  const xpow = n => (n === 1 ? 'x' : 'x^{' + n + '}');
  const DF = {
    poly: { name: 'A polynomial (type it)' },
    sin: { name: 'sin x', tex: () => '\\sin x', f: () => Math.sin, d: () => Math.cos, dtex: () => '\\cos x', fAt: t => '\\sin' + br(t), dAt: t => '\\cos' + br(t),
      rules: () => [{ text: 'The derivative of $\\sin x$ is $\\cos x$. It comes from the limit $\\lim_{h \\to 0} \\frac{\\sin h}{h} = 1$ (lecture 7.6).', tex: '\\frac{d}{dx}\\sin x = \\cos x' }] },
    cos: { name: 'cos x', tex: () => '\\cos x', f: () => Math.cos, d: () => x => -Math.sin(x), dtex: () => '-\\sin x', fAt: t => '\\cos' + br(t), dAt: t => '-\\sin' + br(t),
      rules: () => [{ text: 'The derivative of $\\cos x$ is $-\\sin x$ (lecture 8.3 uses it at $\\frac{\\pi}{3}$).', tex: '\\frac{d}{dx}\\cos x = -\\sin x' }] },
    tan: { name: 'tan x (quotient rule)', tex: () => '\\tan x', f: () => Math.tan, d: () => sec2, dtex: () => '\\sec^2 x', fAt: t => '\\tan' + br(t), dAt: t => '\\sec^2' + br(t), breaks: () => odd(1), dom: () => x => Math.abs(Math.cos(x)) > 1e-9, why: '$\\tan x = \\frac{\\sin x}{\\cos x}$ is not defined where $\\cos x = 0$.',
      rules: () => [
        { text: 'Write $\\tan x = \\frac{\\sin x}{\\cos x}$ and use the <b>quotient rule</b> $\\mathopen{}\\left(\\frac{u}{v}\\right)\' = \\frac{u\'v - uv\'}{v^2}$ (lecture 8.2):', tex: '\\frac{d}{dx}\\tan x = \\frac{\\cos x \\cdot \\cos x - \\sin x \\cdot (-\\sin x)}{\\cos^2 x}' },
        { text: 'The top is $\\cos^2 x + \\sin^2 x = 1$:', tex: '\\frac{d}{dx}\\tan x = \\frac{1}{\\cos^2 x} = \\sec^2 x' }] },
    exp: { name: 'eˣ', tex: () => 'e^x', f: () => Math.exp, d: () => Math.exp, dtex: () => 'e^x', fAt: t => 'e^{' + t + '}', dAt: t => 'e^{' + t + '}',
      rules: () => [{ text: '$e^x$ is its own derivative: its slope at every point equals its height. That is what makes $e$ special (lecture 5.5).', tex: '\\frac{d}{dx}e^x = e^x' }] },
    ln: { name: 'ln x', tex: () => '\\ln x', f: () => Math.log, d: () => x => 1 / x, dtex: () => '\\frac{1}{x}', fAt: t => '\\ln' + br(t), dAt: t => '\\frac{1}{' + t + '}', dom: () => x => x > 0, why: '$\\ln x$ is only defined for $x > 0$.',
      rules: () => [{ text: 'The natural logarithm undoes $e^x$, and its derivative is $\\frac{1}{x}$ (for $x > 0$):', tex: '\\frac{d}{dx}\\ln x = \\frac{1}{x}' }] },
    sqrt: { name: '√x (power rule, n = ½)', tex: () => '\\sqrt{x}', f: () => Math.sqrt, d: () => x => 1 / (2 * Math.sqrt(x)), dtex: () => '\\frac{1}{2\\sqrt{x}}', fAt: t => '\\sqrt{' + t + '}', dAt: t => '\\frac{1}{2\\sqrt{' + t + '}}', dom: () => x => x >= 0, why: '$\\sqrt{x}$ is only defined for $x \\ge 0$.', diff: () => x => x > 0,
      nodiff: 'At $0$ the graph starts straight upwards: the difference quotients $\\frac{\\sqrt{h}}{h} = \\frac{1}{\\sqrt{h}}$ grow without bound, so the tangent would be vertical and $f\'(0)$ does not exist.',
      rules: () => [{ text: 'Write $\\sqrt{x} = x^{1/2}$ and use the <b>power rule</b> $\\frac{d}{dx}x^n = nx^{n-1}$ with $n = \\frac{1}{2}$:', tex: '\\frac{d}{dx}x^{1/2} = \\frac{1}{2}x^{-1/2} = \\frac{1}{2\\sqrt{x}}' }] },
    cbrt: { name: '∛x (power rule, n = ⅓)', tex: () => '\\sqrt[3]{x}', f: () => Math.cbrt, d: () => x => 1 / (3 * Math.cbrt(x) ** 2), dtex: () => '\\frac{1}{3\\sqrt[3]{x^2}}', fAt: t => '\\sqrt[3]{' + t + '}', dAt: t => '\\frac{1}{3\\sqrt[3]{' + br(t) + '^2}}', diff: () => x => x !== 0,
      nodiff: 'At $0$ the slope blows up: $\\frac{\\sqrt[3]{h}}{h} = h^{-2/3}$ grows without bound from both sides. The tangent is the vertical line $x = 0$, and $f\'(0)$ does not exist (lecture 8.3).',
      rules: () => [{ text: 'Write $\\sqrt[3]{x} = x^{1/3}$ and use the <b>power rule</b> with $n = \\frac{1}{3}$ (lecture 8.3):', tex: '\\frac{d}{dx}x^{1/3} = \\frac{1}{3}x^{-2/3} = \\frac{1}{3\\sqrt[3]{x^2}}' }] },
    recip: { name: '1/x (power rule, n = −1)', tex: () => '\\frac{1}{x}', f: () => x => 1 / x, d: () => x => -1 / (x * x), dtex: () => '-\\frac{1}{x^2}', fAt: t => '\\frac{1}{' + t + '}', dAt: t => '-\\frac{1}{' + br(t) + '^2}', dom: () => x => x !== 0, why: '$\\frac{1}{x}$ is not defined at $0$.', breaks: () => () => [0],
      rules: () => [{ text: 'Write $\\frac{1}{x} = x^{-1}$ and use the <b>power rule</b> with $n = -1$ (the quotient rule gives the same, lecture 8.2):', tex: '\\frac{d}{dx}x^{-1} = -1 \\cdot x^{-2} = -\\frac{1}{x^2}' }] },
    xnsin: { name: 'xⁿ · sin x (product rule)', par: 'n', tex: n => xpow(n) + '\\sin x', f: n => x => x ** n * Math.sin(x), d: n => x => n * x ** (n - 1) * Math.sin(x) + x ** n * Math.cos(x),
      dtex: n => (n === 1 ? '' : n) + xpow(n - 1).replace(/^x\^\{0\}$/, '') + (n === 1 ? '' : '\\,') + '\\sin x + ' + xpow(n) + '\\cos x',
      fAt: (t, n) => br(t) + '^{' + n + '}\\sin' + br(t), dAt: (t, n) => (n === 1 ? '' : n + ' \\cdot ') + (n === 1 ? '' : br(t) + (n - 1 === 1 ? '' : '^{' + (n - 1) + '}')) + '\\sin' + br(t) + ' + ' + br(t) + (n === 1 ? '' : '^{' + n + '}') + '\\cos' + br(t),
      rules: n => [
        { text: 'A product: use the <b>product rule</b> $(uv)\' = u\'v + uv\'$ (lecture 8.2) with $u = ' + xpow(n) + '$ and $v = \\sin x$. The power rule and the sine rule give:', tex: 'u\' = ' + (n === 1 ? '1' : n + xpow(n - 1)) + ',\\qquad v\' = \\cos x' },
        { text: 'Put them together:', tex: "f'(x) = u'v + uv' = " + (n === 1 ? '\\sin x + x\\cos x' : n + xpow(n - 1) + '\\sin x + ' + xpow(n) + '\\cos x') }] },
    tankx: { name: 'tan(kx) (chain rule)', par: 'k', tex: k => '\\tan(' + kx(k) + ')', f: k => x => Math.tan(k.x * x), d: k => x => k.x * sec2(k.x * x), dtex: k => cmul(k, '\\sec^2(' + kx(k) + ')'), fAt: (t, k) => '\\tan\\mathopen{}\\left(' + cmul(k, br(t)) + '\\right)', dAt: (t, k) => cmul(k, '\\sec^2\\mathopen{}\\left(' + cmul(k, br(t)) + '\\right)'),
      breaks: k => odd(k.x), dom: k => x => Math.abs(Math.cos(k.x * x)) > 1e-9, why: '$\\tan$ is not defined where its cosine is $0$.',
      rules: k => [
        { text: 'A function inside a function: the <b>chain rule</b> $\\mathopen{}\\left(f(g(x))\\right)\' = f\'(g(x))\\,g\'(x)$ (lecture 8.2), with outer $\\tan u$ and inner $u = ' + kx(k) + '$:', tex: '\\frac{d}{du}\\tan u = \\sec^2 u,\\qquad \\frac{d}{dx}\\mathopen{}\\left(' + kx(k) + '\\right) = ' + vt(k) },
        { text: 'Multiply the outer derivative (at the inner function) by the inner derivative:', tex: "f'(x) = \\sec^2(" + kx(k) + ') \\cdot ' + sub(k) + ' = ' + cmul(k, '\\sec^2(' + kx(k) + ')') }] },
    xtan: { name: 'x · tan x (product rule)', tex: () => 'x\\tan x', f: () => x => x * Math.tan(x), d: () => x => Math.tan(x) + x * sec2(x), dtex: () => '\\tan x + x\\sec^2 x', fAt: t => br(t) + '\\tan' + br(t), dAt: t => '\\tan' + br(t) + ' + ' + br(t) + '\\sec^2' + br(t), breaks: () => odd(1), dom: () => x => Math.abs(Math.cos(x)) > 1e-9, why: '$\\tan x$ is not defined where $\\cos x = 0$.',
      rules: () => [
        { text: 'A product: the <b>product rule</b> $(uv)\' = u\'v + uv\'$ with $u = x$ and $v = \\tan x$ (lecture 8.3):', tex: "u' = 1,\\qquad v' = \\sec^2 x" },
        { text: 'Put them together:', tex: "f'(x) = 1 \\cdot \\tan x + x\\sec^2 x" }] },
    abs: { name: '|x| (a corner)', tex: () => '|x|', f: () => Math.abs, d: () => x => Math.sign(x), dtex: () => '\\begin{cases} 1 & x > 0 \\\\ -1 & x < 0 \\end{cases}', fAt: t => '\\mathopen{}\\left|' + t + '\\right|', dAt: t => '\\operatorname{sign}' + br(t), diff: () => x => x !== 0,
      nodiff: 'At $0$ the difference quotients are $\\frac{|h|}{h} = -1$ from the left and $1$ from the right. They never agree, the graph has a corner, and $f\'(0)$ does not exist.',
      rules: () => [{ text: 'For $x > 0$, $|x| = x$ has slope $1$; for $x < 0$, $|x| = -x$ has slope $-1$:', tex: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ -1 & x < 0 \\end{cases}" }] },
  };
  function kx(k) { return cmul(k, 'x'); }

  /* ================================================================ zeros of a polynomial, step by step */
  /** the steps that find every real zero of p: the rational root test, then the quadratic formula or numerics */
  function zeroSteps(p, sol, name) {
    const st = [], rr = sol.rr;
    if (rr.zero) st.push({ text: 'The constant term is $0$, so $x = 0$ is a zero: take out $x' + (rr.zero > 1 ? '^{' + rr.zero + '}' : '') + '$.', tex: name + '(x) = x' + (rr.zero > 1 ? '^{' + rr.zero + '}' : '') + '\\mathopen{}\\left(' + ptex(ptrim(p).slice(rr.zero)) + '\\right)' });
    if (rr.ints && rr.L !== 1n) st.push({ text: 'Multiply by $' + rr.L + '$ to clear the fractions (the zeros stay the same):', tex: ptex(rr.ints.map(v => F(v))) });
    if (rr.big) st.push({ text: 'The numbers are too large to try every rational candidate, so the zeros are found numerically.' });
    else if (rr.ints) {
      const a0 = rr.ints[0], aN = rr.ints[rr.ints.length - 1], pos = rr.cands.filter(c => !neg(c));
      st.push({ text: 'The <b>rational root test</b>: a fraction $\\frac{u}{w}$ in lowest terms can be a zero only if $u$ divides the constant term $' + a0 + '$ and $w$ divides the leading coefficient $' + aN + '$. The candidates:', tex: pos.length <= 16 ? '\\pm ' + pos.map(c => T(c)).join(',\\allowbreak\\ \\pm ') : '\\pm ' + pos.slice(0, 12).map(c => T(c)).join(',\\allowbreak\\ \\pm ') + ',\\allowbreak\\ \\dots\\ (' + rr.cands.length + '\\text{ in all})' });
      const found = rr.roots.filter(o => !o.r.isZero());
      st.push({ text: found.length ? 'Putting each candidate in, these give $0$. Dividing by $(x - r)$ again and again shows how often each one goes in, its <b>multiplicity</b>:' : 'None of the candidates gives $0$: there is no rational zero' + (rr.zero ? ' apart from $0$.' : '.'), tex: found.length ? found.map(o => name + '\\mathopen{}\\left(' + T(o.r) + '\\right) = 0' + (o.m > 1 ? '\\ (\\times ' + o.m + ')' : '')).join(',\\quad ') : null });
    }
    for (const part of sol.parts) {
      const these = sol.roots.filter(o => !o.fr && o.m === part.m);
      if (part.kind === 'surd') st.push({ text: 'What is left contains the quadratic $' + ptex(part.f) + '$' + (part.m > 1 ? ' (to the power ' + part.m + ')' : '') + '; the quadratic formula gives its zeros:', tex: these.filter(o => o.tex).map(o => 'x = ' + o.tex + ' \\approx ' + fmt(o.x)).join(',\\quad ') });
      if (part.kind === 'complex') st.push({ text: 'The factor $' + ptex(part.f) + '$ has a negative discriminant, so no real zeros come from it.' });
      if (part.kind === 'numeric') st.push({ text: 'The factor $' + ptex(part.f) + '$ has no rational zeros. ' + (part.count ? 'Its ' + (part.count === 1 ? 'real zero is' : part.count + ' real zeros are') + ' found numerically, by halving an interval where the sign changes:' : 'It has no real zeros either.'), tex: part.count ? these.filter(o => !o.tex).map(o => 'x \\approx ' + fmt(o.x, 6)).join(',\\quad ') : null });
    }
    if (rr.roots.length && pdeg(p) > 1) st.push({ text: 'So, as factors:', tex: name + '(x) = ' + factorTex(p, sol) });
    return st;
  }
  /** the simplest fraction strictly between lo and hi (either may be infinite), for test points */
  function between(lo, hi) {
    if (lo === -Infinity && hi === Infinity) return F(0);
    if (lo === -Infinity) return F(Math.floor(hi) - 1);
    if (hi === Infinity) return F(Math.ceil(lo) + 1);
    for (const d of [1, 2, 4, 5, 10, 20, 100, 1000, 10000, 100000]) {
      const a = Math.floor(lo * d) + 1, b = Math.ceil(hi * d) - 1;
      if (a <= b) return F(Math.min(b, Math.max(a, Math.round(((lo + hi) / 2) * d))), d);
    }
    return F.parse(((lo + hi) / 2).toFixed(9));
  }
  /** do two TeX strings show the same thing (braces, spacing and bracket sizing aside) */
  const sameTex = (u, w) => { const z = t => t.replace(/\\mathopen\{\}|\\left|\\right|[{}\s]/g, ''); return z(u) === z(w); };
  /** a number of a table: exact decimal when short, else rounded */
  const dec = q => (q.exactDecimal(10) ? q.dec(10) : '\\approx ' + fmt(q.num(), 8));

  /* ================================================================ the topics */
  REV.lab('functions', {
    /* ---------------------------------------------------------------- straight lines (Maths 1 week 2) */
    // ?mode=points|pslope|slope|general  how L₁ is given: two points P and Q; P and the slope m; the slope m and the
    //   y-intercept c; or its equation Ax + By + C = 0
    // &p=1,2 &q=3,8 (points, as x,y) &m=3 &c=-1 &l=3,-1,-1 (A,B,C of L₁) &l2=1,3,-9 (A,B,C of L₂) &r=4,0 (a point R)
    line(el, query, ctx) {
      const s = K.state(ctx, { mode: 'points', p: '1,2', q: '3,8', m: '3', c: '-1', l: '3,-1,-1', l2: '1,3,-9', r: '4,0' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function first() {
        const mode = s.v.mode;
        if (mode === 'points') {
          const [x1, y1] = pair(s.v.p, 2), [x2, y2] = pair(s.v.q, 2);
          if (x1.eq(x2) && y1.eq(y2)) throw new Error('P and Q are the same point, and one point does not fix a line: move Q.');
          return { ...lineFrom(y2.sub(y1), x1.sub(x2), x2.sub(x1).mul(y1).sub(y2.sub(y1).mul(x1))), P: [x1, y1], Q: [x2, y2] };
        }
        if (mode === 'pslope') { const [x1, y1] = pair(s.v.p, 2), m = F.parse(s.v.m); return { ...lineFrom(m, F(-1), y1.sub(m.mul(x1))), P: [x1, y1] }; }
        if (mode === 'slope') return lineFrom(F.parse(s.v.m), F(-1), F.parse(s.v.c));
        const [A, B, C] = pair(s.v.l, 3);
        if (A.isZero() && B.isZero()) throw new Error('A and B cannot both be 0: that equation is not a line.');
        return { ...lineFrom(A, B, C), raw: [A, B, C] };
      }
      function build() {
        controls.innerHTML = '';
        const mode = s.v.mode;
        controls.append(
          K.p('A straight line is fixed by two of its points, or by one point and how steep it is (its <b>slope</b>). From that come every form of its equation, where it crosses the axes, and distances to it.'),
          K.select({ label: 'Give the line $L_1$ by', value: mode, options: [['points', 'Two points P and Q'], ['pslope', 'A point P and the slope m'], ['slope', 'Slope m and y-intercept c'], ['general', 'Its equation Ax + By + C = 0']], onChange: v => { s.set({ mode: v }); build(); } }));
        if (mode === 'points' || mode === 'pslope') controls.append(numRow({ label: 'Point $P$', names: ['$x_1$', '$y_1$'], values: split(s.v.p, 2), onChange: v => s.set({ p: v.join(',') }) }));
        if (mode === 'points') controls.append(numRow({ label: 'Point $Q$', names: ['$x_2$', '$y_2$'], values: split(s.v.q, 2), onChange: v => s.set({ q: v.join(',') }) }));
        if (mode === 'pslope') controls.append(numRow({ label: 'Slope', names: ['$m$'], values: [s.v.m], onChange: v => s.set({ m: v[0] }) }));
        if (mode === 'slope') controls.append(numRow({ label: 'Slope and $y$-intercept', names: ['$m$', '$c$'], values: [s.v.m, s.v.c], onChange: v => s.set({ m: v[0], c: v[1] }) }));
        if (mode === 'general') controls.append(numRow({ label: '$L_1:\\ Ax + By + C = 0$', names: ['$A$', '$B$', '$C$'], values: split(s.v.l, 3), onChange: v => s.set({ l: v.join(',') }) }));
        const turn = perp => { let L; try { L = first(); } catch (e) { return; } pick({ l2: (perp ? [L.B, L.A.neg()] : [L.A, L.B]).map(q => q.str()).join(',') + ',' + (split(s.v.l2, 3)[2] || '0') }); };
        controls.append(
          numRow({ label: 'A second line $L_2:\\ Ax + By + C = 0$', names: ['$A$', '$B$', '$C$'], values: split(s.v.l2, 3), onChange: v => s.set({ l2: v.join(',') }) }),
          h('div', { class: 'lk-row' }, K.button('Make $L_2 \\parallel L_1$', () => turn(false)), K.button('Make $L_2 \\perp L_1$', () => turn(true))),
          numRow({ label: 'A point $R$ (its distance to $L_1$)', names: ['$x_0$', '$y_0$'], values: split(s.v.r, 2), onChange: v => s.set({ r: v.join(',') }) }),
          tries([
            { label: 'P(5, 6), Q(−1, 2): distance', cite: 'lecture 2.2', v: { mode: 'points', p: '5,6', q: '-1,2' } },
            { label: 'Through (5, 6) with slope −2', cite: 'lecture 2.7', v: { mode: 'pslope', p: '5,6', m: '-2' } },
            { label: '3x − 4y + 12 = 0', cite: 'lecture 2.9', v: { mode: 'general', l: '3,-4,12' } },
            { label: 'Perpendicular to x − 2y + 3 = 0 through (−1, 2)', cite: 'lecture 2.11', v: { mode: 'general', l: '1,-2,3', l2: '2,1,0', r: '-1,2' } },
            { label: 'Distance from (3, −5) to 3x − 4y − 26 = 0', cite: 'lecture 2.12', v: { mode: 'general', l: '3,-4,-26', r: '3,-5' } },
            { label: '3x − 4y + 7 = 0 and 3x − 4y + 5 = 0', cite: 'lecture 2.12', v: { mode: 'general', l: '3,-4,7', l2: '3,-4,5' } },
            { label: 'A vertical line: P(2, −1), Q(2, 3)', v: { mode: 'points', p: '2,-1', q: '2,3' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        let L, M, R;
        try {
          L = first();
          const [a2, b2, c2] = pair(s.v.l2, 3);
          if (a2.isZero() && b2.isZero()) throw new Error('In L₂, A and B cannot both be 0.');
          M = lineFrom(a2, b2, c2);
          R = pair(s.v.r, 2);
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), { A, B, C } = L, mode = s.v.mode, [x0, y0] = R;
        out.append(K.answer('The line $L_1$', stex(L) + (L.vertical ? '' : '\\qquad ' + gtex(L)), L.vertical ? 'A vertical line: every point on it has the same $x$, and its slope is undefined.' : 'Slope $' + T(L.m) + '$; it crosses the $y$-axis at $' + T(L.c) + '$.'));

        // the second line: parallel, perpendicular, where they meet
        const D = A.mul(M.B).sub(M.A.mul(B)), P2 = A.mul(M.A).add(B.mul(M.B));
        const same = D.isZero() && A.mul(M.C).sub(M.A.mul(C)).isZero() && B.mul(M.C).sub(M.B.mul(C)).isZero();
        const X = D.isZero() ? null : [B.mul(M.C).sub(M.B.mul(C)).div(D), C.mul(M.A).sub(M.C.mul(A)).div(D)];
        // the point R: distance, the foot F of the perpendicular
        const N = A.mul(x0).add(B.mul(y0)).add(C), S = A.mul(A).add(B.mul(B)), rS = sqrtFr(S);
        const dist = N.isZero() ? ex(0) : rS.r === 1n ? ex(fabs(N).div(rS.k)) : ap(Math.abs(N.num()) / Math.sqrt(S.num()), rootTex(fabs(N).div(rS.k.mul(F(rS.r))), rS.r));
        const t = N.div(S), Fx = x0.sub(A.mul(t)), Fy = y0.sub(B.mul(t));
        const xi = A.isZero() ? null : C.neg().div(A), yi = B.isZero() ? null : C.neg().div(B);

        // the picture
        const pts = [[x0.num(), y0.num()], [Fx.num(), Fy.num()]];
        if (L.P) pts.push(L.P.map(q => q.num()));
        if (L.Q) pts.push(L.Q.map(q => q.num()));
        if (X) pts.push(X.map(q => q.num()));
        if (xi) pts.push([xi.num(), 0]);
        if (yi) pts.push([0, yi.num()]);
        const win = around(pts, 3);
        const items = [
          { type: 'gline', A: A.num(), B: B.num(), C: C.num(), c: 0 },
          { type: 'gline', A: M.A.num(), B: M.B.num(), C: M.C.num(), c: 1 },
          { type: 'seg', x1: x0.num(), y1: y0.num(), x2: Fx.num(), y2: Fy.num(), c: 3, dash: true, thin: true },
        ];
        if (L.P) items.push({ type: 'pt', x: L.P[0].num(), y: L.P[1].num(), c: 0, label: 'P' });
        if (L.Q) items.push({ type: 'pt', x: L.Q[0].num(), y: L.Q[1].num(), c: 0, label: 'Q' }, { type: 'pt', x: L.P[0].add(L.Q[0]).div(2).num(), y: L.P[1].add(L.Q[1]).div(2).num(), c: 4, r: 3.5, label: 'M' });
        if (!N.isZero()) items.push({ type: 'pt', x: Fx.num(), y: Fy.num(), c: 3, r: 3, label: 'F', below: true });
        items.push({ type: 'pt', x: x0.num(), y: y0.num(), c: 3, label: 'R' });
        if (X) items.push({ type: 'pt', x: X[0].num(), y: X[1].num(), c: 2, label: 'X' });
        out.append(K.card('The picture', plot({ x: win.x, y: win.y, equal: true, items, width: W, label: 'The lines L1 and L2 with the points', legend: [{ c: 0, text: '$L_1:\\ ' + gtex(L) + '$' }, { c: 1, text: '$L_2:\\ ' + gtex(M) + '$' }, { c: 3, dash: true, text: 'from $R$ at a right angle to $L_1$' }] })));

        // slope and the forms of the equation
        const st = [];
        if (mode === 'points') {
          const [x1, y1] = L.P, [x2, y2] = L.Q, run = x2.sub(x1), rise = y2.sub(y1);
          const fr = '\\frac{' + T(y2) + ' - ' + par(y1) + '}{' + T(x2) + ' - ' + par(x1) + '}';
          if (run.isZero()) st.push({ text: 'The <b>slope</b> is rise over run: the change in $y$ divided by the change in $x$ from $P$ to $Q$. Here the run is $0$, and nothing can be divided by $0$: the slope is <b>undefined</b>. The line is <b>vertical</b>; every point on it has $x = ' + T(x1) + '$.', tex: 'm = ' + fr + ' = \\frac{' + T(rise) + '}{0}' });
          else st.push({ text: 'The <b>slope</b> is rise over run, $m = \\frac{y_2 - y_1}{x_2 - x_1}$: the change in $y$ divided by the change in $x$, going from $P$ to $Q$.', tex: 'm = ' + fr + ' = \\frac{' + T(rise) + '}{' + T(run) + '}' + (rise.isInt() && run.isInt() && L.m.n === rise.n && L.m.d === run.n ? '' : ' = ' + T(L.m)) });
        }
        if (L.P && !L.vertical) {
          const [x1, y1] = L.P;
          st.push({ text: (mode === 'pslope' ? 'The slope $m = ' + T(L.m) + '$ is given. ' : '') + 'The <b>point-slope form</b> $y - y_1 = m(x - x_1)$ says: from $P(x_1, y_1)$ to any point $(x, y)$ of the line, the slope is $m$.', tex: xm(y1, 'y') + ' = ' + times(L.m, xm(x1)) });
          st.push({ text: 'Open the bracket and add $y_1 = ' + T(y1) + '$ to both sides: the <b>slope-intercept form</b> $y = mx + c$.', tex: 'y = ' + linTex([[L.m, 'x'], [L.m.mul(x1).neg(), '']]) + sgn(y1) + ' = ' + linTex([[L.m, 'x'], [L.c, '']]) });
        }
        if (mode === 'slope') st.push({ text: 'The <b>slope-intercept form</b> $y = mx + c$ takes the slope $m$ and the $y$-intercept $c$ straight in.', tex: 'y = ' + linTex([[L.m, 'x'], [L.c, '']]) });
        if (mode === 'general') {
          const [A0, B0, C0] = L.raw;
          if (!(A0.eq(A) && B0.eq(B) && C0.eq(C))) st.push({ text: 'Multiply or divide every term by the same number, so the coefficients are whole numbers with no common factor:', tex: linTex([[A0, 'x'], [B0, 'y'], [C0, '']]) + ' = 0 \\;\\Rightarrow\\; ' + gtex(L) });
          if (L.vertical) st.push({ text: 'There is no $y$ term ($B = 0$), so the line is <b>vertical</b> and its slope is undefined.', tex: gtex(L) + ' \\;\\Rightarrow\\; x = ' + T(C.neg().div(A)) });
          else st.push({ text: 'Solve for $y$ to read off the slope and the $y$-intercept: $By = -Ax - C$, so $y = -\\frac{A}{B}x - \\frac{C}{B}$.', tex: 'y = -\\frac{' + T(A) + '}{' + T(B) + '}x - \\frac{' + T(C) + '}{' + T(B) + '} = ' + linTex([[L.m, 'x'], [L.c, '']]) });
        }
        if (mode !== 'general') st.push(L.vertical ? { text: 'As an equation in the <b>general form</b> $Ax + By + C = 0$:', tex: 'x = ' + T(C.neg().div(A)) + ' \\;\\Leftrightarrow\\; ' + gtex(L) } : { text: 'Bring every term to one side and clear fractions: the <b>general form</b> $Ax + By + C = 0$.', tex: gtex(L) });
        st.push({ text: 'Where it crosses the $x$-axis, $y = 0$:', tex: xi ? linTex([[A, 'x'], [C, '']]) + ' = 0 \\;\\Rightarrow\\; x = ' + TD(xi) : '\\text{' + (C.isZero() ? 'the line is the } x\\text{-axis itself' : 'the line is parallel to the } x\\text{-axis: no } x\\text{-intercept') + '}' });
        st.push({ text: 'Where it crosses the $y$-axis, $x = 0$:', tex: yi ? linTex([[B, 'y'], [C, '']]) + ' = 0 \\;\\Rightarrow\\; y = ' + TD(yi) : '\\text{' + (C.isZero() ? 'the line is the } y\\text{-axis itself' : 'the line is parallel}\\allowbreak\\ \\text{to the } y\\text{-axis:}\\allowbreak\\ \\text{no } y\\text{-intercept') + '}' });
        if (xi && yi && !xi.isZero() && !yi.isZero()) st.push({ text: 'With both intercepts known (and not $0$), the <b>intercept form</b> $\\frac{x}{a} + \\frac{y}{b} = 1$:', tex: '\\frac{x}{' + T(xi) + '} + \\frac{y}{' + T(yi) + '} = 1' });
        const deg = L.vertical ? 90 : ((Math.atan(L.m.num()) * 180) / Math.PI + 180) % 180;
        st.push({ text: 'The <b>angle of inclination</b> $\\theta$ is measured from the positive $x$-axis, with $\\tan\\theta = m$ (lecture 2.5).', tex: L.vertical ? '\\theta = 90^\\circ' : '\\tan\\theta = ' + T(L.m) + ' \\;\\Rightarrow\\; \\theta \\approx ' + fmt(deg, 2) + '^\\circ' });
        const on = (L.P ? [['P', L.P]] : []).concat(L.Q ? [['Q', L.Q]] : []);
        out.append(K.card('Slope and the forms of the equation', K.steps(st),
          on.length ? ok(on.map(([nm, [x, y]]) => '$' + nm + '$: $' + lineAt(L, x, y) + ' = ' + T(A.mul(x).add(B.mul(y)).add(C)) + '$').join(', ') + ', so ' + (on.length > 1 ? 'both points lie' : '$P$ lies') + ' on $' + gtex(L) + '$.') : null));

        // distance and midpoint
        if (L.P && L.Q) {
          const [x1, y1] = L.P, [x2, y2] = L.Q, dx = x2.sub(x1), dy = y2.sub(y1), S2 = dx.mul(dx).add(dy.mul(dy)), r = sqrtFr(S2);
          const Mx = x1.add(x2).div(2), My = y1.add(y2).div(2);
          const pm2 = Mx.sub(x1).mul(Mx.sub(x1)).add(My.sub(y1).mul(My.sub(y1))), mq2 = x2.sub(Mx).mul(x2.sub(Mx)).add(y2.sub(My).mul(y2.sub(My)));
          out.append(K.card('Distance and midpoint',
            K.steps([
              { text: 'The <b>distance</b> $PQ$ is the long side of a right triangle whose short sides are the run and the rise (Pythagoras, lecture 2.2): $PQ = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}$.', tex: 'PQ = \\sqrt{' + sqp(dx) + ' + ' + sqp(dy) + '} = \\sqrt{' + T(S2) + '}' + (r.r === 1n ? ' = ' + TD(r.k) : (r.k.eq(1) ? '' : ' = ' + rootTex(r.k, r.r)) + ' \\approx ' + fmt(Math.sqrt(S2.num()))) },
              { text: 'The <b>midpoint</b> $M$ averages the coordinates: $M = \\mathopen{}\\left(\\frac{x_1 + x_2}{2}, \\frac{y_1 + y_2}{2}\\right)$.', tex: 'M = \\mathopen{}\\left(\\frac{' + T(x1) + sgn(x2) + '}{2}, \\frac{' + T(y1) + sgn(y2) + '}{2}\\right) = \\mathopen{}\\left(' + T(Mx) + ', ' + T(My) + '\\right)' },
            ]),
            ok('$PM^2 = ' + T(pm2) + '$ and $MQ^2 = ' + T(mq2) + '$, both $\\frac{1}{4}PQ^2 = \\frac{' + T(S2) + '}{4}$: $M$ is exactly halfway.')));
        }

        // the second line
        const st2 = [{ text: 'The slope of $L_2:\\ ' + gtex(M) + '$, from $B_2 y = -A_2 x - C_2$:', tex: M.vertical ? 'B_2 = 0:\\ \\text{vertical, the slope is undefined}' : 'm_2 = -\\frac{A_2}{B_2} = -\\frac{' + T(M.A) + '}{' + T(M.B) + '}' + (M.A.isInt() && M.B.isInt() && bgcd(M.A.n, M.B.n) === 1n && M.B.cmp(1) > 0 ? '' : ' = ' + T(M.m)) }];
        st2.push({ text: 'Two lines are <b>parallel</b> when their slopes are equal. With $m = -\\frac{A}{B}$ that is $A_1B_2 - A_2B_1 = 0$, which also works for vertical lines (lecture 2.10).', tex: 'A_1B_2 - A_2B_1 = ' + T(A) + ' \\cdot ' + par(M.B) + ' - ' + par(M.A) + ' \\cdot ' + par(B) + ' = ' + T(D) });
        st2.push({ text: 'They are <b>perpendicular</b> when $m_1 m_2 = -1$, that is $A_1A_2 + B_1B_2 = 0$ (a vertical and a horizontal line count too).', tex: 'A_1A_2 + B_1B_2 = ' + T(A) + ' \\cdot ' + par(M.A) + term(B, M.B) + ' = ' + T(P2) });
        if (X) {
          const cterm = C.mul(M.B).sub(M.C.mul(B));
          st2.push({ text: 'Not parallel, so they meet at one point. Multiply $L_1$ by $B_2 = ' + T(M.B) + '$ and $L_2$ by $B_1 = ' + T(B) + '$ and subtract: the $y$ terms cancel, leaving $(A_1B_2 - A_2B_1)\\,x + (C_1B_2 - C_2B_1) = 0$.', tex: linTex([[D, 'x'], [cterm, '']]) + ' = 0 \\;\\Rightarrow\\; x = ' + TD(X[0]) });
          const use = !B.isZero() ? [A, B, C, '1'] : [M.A, M.B, M.C, '2'];
          st2.push({ text: 'Put this $x$ into $L_' + use[3] + '$ and solve for $y$:', tex: T(use[0]) + ' \\cdot ' + par(X[0]) + sgn(use[1], 'y') + sgn(use[2]) + ' = 0 \\;\\Rightarrow\\; y = ' + TD(X[1]) });
          if (!L.vertical && !M.vertical && !P2.isZero()) {
            const tn = fabs(M.m.sub(L.m).div(F(1).add(L.m.mul(M.m))));
            st2.push({ text: 'The angle $\\theta$ between them (lecture 2.6):', tex: '\\tan\\theta = \\mathopen{}\\left|\\frac{m_2 - m_1}{1 + m_1m_2}\\right| = ' + TD(tn) + ' \\;\\Rightarrow\\; \\theta \\approx ' + fmt((Math.atan(tn.num()) * 180) / Math.PI, 2) + '^\\circ' });
          }
        } else if (!same) {
          const k = !A.isZero() ? A.div(M.A) : B.div(M.B), C2 = M.C.mul(k), dC = fabs(C.sub(C2));
          const dd = rS.r === 1n ? ex(dC.div(rS.k)) : ap(dC.num() / Math.sqrt(S.num()), rootTex(dC.div(rS.k.mul(F(rS.r))), rS.r));
          st2.push({ text: 'Write $L_2$ with the same $A$ and $B$ as $L_1$ (multiply it by $' + T(k) + '$):', tex: linTex([[A, 'x'], [B, 'y'], [C2, '']]) + ' = 0' });
          st2.push({ text: 'The distance between two parallel lines $Ax + By + C_1 = 0$ and $Ax + By + C_2 = 0$ is $\\frac{|C_1 - C_2|}{\\sqrt{A^2 + B^2}}$ (lecture 2.12):', tex: 'd = \\frac{|' + T(C) + ' - ' + par(C2) + '|}{\\sqrt{' + sqp(A) + ' + ' + sqp(B) + '}} = \\frac{' + T(dC) + '}{\\sqrt{' + T(S) + '}}' + eqv(dd) });
        }
        const verdict = same ? '$L_2$ is the <b>same line</b> as $L_1$: its equation is a multiple of $L_1$’s.' : D.isZero() ? '$L_1 \\parallel L_2$: <b>parallel</b>, they never meet.' : P2.isZero() ? '$L_1 \\perp L_2$: <b>perpendicular</b>, they meet at a right angle at $X = (' + T(X[0]) + ', ' + T(X[1]) + ')$.' : 'Neither parallel nor perpendicular: they cross at $X = (' + T(X[0]) + ', ' + T(X[1]) + ')$.';
        out.append(K.card('A second line $L_2$', K.steps(st2), K.p(verdict),
          X ? ok('$L_1$: $' + lineAt(L, X[0], X[1]) + ' = ' + T(A.mul(X[0]).add(B.mul(X[1])).add(C)) + '$ and $L_2$: $' + lineAt(M, X[0], X[1]) + ' = ' + T(M.A.mul(X[0]).add(M.B.mul(X[1])).add(M.C)) + '$, so $X$ is on both.') : null));

        // the point R
        const parL = lineFrom(A, B, A.mul(x0).add(B.mul(y0)).neg()), perpL = lineFrom(B, A.neg(), A.mul(y0).sub(B.mul(x0)));
        const st3 = [{ text: 'The distance from $R(x_0, y_0)$ to $Ax + By + C = 0$ is measured at a right angle to the line: $d = \\frac{|Ax_0 + By_0 + C|}{\\sqrt{A^2 + B^2}}$ (lecture 2.12).', tex: 'd = \\frac{|' + lineAt(L, x0, y0) + '|}{\\sqrt{' + sqp(A) + ' + ' + sqp(B) + '}} = \\frac{' + T(fabs(N)) + '}{\\sqrt{' + T(S) + '}}' + eqv(dist) }];
        if (!N.isZero()) st3.push({ text: 'The foot $F$ of that perpendicular: go from $R$ against the direction $(A, B)$ by $t = \\frac{Ax_0 + By_0 + C}{A^2 + B^2}$.', tex: 't = \\frac{' + T(N) + '}{' + T(S) + '}' + (N.div(S).str() === N.str() + '/' + S.str() ? '' : ' = ' + T(t)) + ',\\qquad F = (x_0 - At,\\ y_0 - Bt) = \\mathopen{}\\left(' + T(Fx) + ', ' + T(Fy) + '\\right)' });
        st3.push({ text: 'The line through $R$ <b>parallel</b> to $L_1$ keeps $A$ and $B$ and passes through $R$:', tex: gtex(parL) });
        st3.push({ text: 'The line through $R$ <b>perpendicular</b> to $L_1$ swaps $A$ and $B$ and changes one sign, so its slope is $-\\frac{1}{m}$ (lecture 2.11):', tex: gtex(perpL) + (perpL.vertical ? '' : ' \\;\\Leftrightarrow\\; ' + stex(perpL)) });
        out.append(K.card('The point $R(' + T(x0) + ', ' + T(y0) + ')$', K.steps(st3),
          N.isZero() ? K.p('$R$ lies on $L_1$, so its distance is $0$.') : ok('$F$ is on $L_1$: $' + lineAt(L, Fx, Fy) + ' = ' + T(A.mul(Fx).add(B.mul(Fy)).add(C)) + '$; and $RF^2 = ' + T(x0.sub(Fx).mul(x0.sub(Fx)).add(y0.sub(Fy).mul(y0.sub(Fy)))) + ' = d^2$.')));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- quadratics (week 3) */
    // ?a=1&b=-4&c=3   f(x) = ax² + bx + c, each a whole number, fraction or decimal (a ≠ 0)
    quadratic(el, query, ctx) {
      const s = K.state(ctx, { a: '1', b: '-4', c: '3' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('A quadratic $f(x) = ax^2 + bx + c$ draws a <b>parabola</b>. Completing the square finds its turning point, the <b>vertex</b>; the quadratic formula finds where it meets the $x$-axis, its <b>roots</b>.'),
          numRow({ label: '$f(x) = ax^2 + bx + c$', names: ['$a$', '$b$', '$c$'], values: [s.v.a, s.v.b, s.v.c], onChange: ([a, b, c]) => s.set({ a, b, c }) }),
          tries([
            { label: 'x² + 8x + 9: graph it', cite: 'lecture 3.1', v: { a: '1', b: '8', c: '9' } },
            { label: 'x² − 6x + 9: least value', cite: 'lecture 3.2', v: { a: '1', b: '-6', c: '9' } },
            { label: 'x² + 6x + 8 = 0', cite: 'lecture 3.4', v: { a: '1', b: '6', c: '8' } },
            { label: '5x² − 13x + 6: factorise', cite: 'lecture 3.6', v: { a: '5', b: '-13', c: '6' } },
            { label: 'x² + 10x − 24 = 0', cite: 'lecture 3.7', v: { a: '1', b: '10', c: '-24' } },
            { label: 'x² − 4x + 4 = 32', cite: 'lecture 3.8', v: { a: '1', b: '-4', c: '-28' } },
            { label: '2x² + 16x + 33 = 0', cite: 'lecture 3.8', v: { a: '2', b: '16', c: '33' } },
            { label: '3x² + 6x + 9: vertex form', cite: 'lecture 3.9', v: { a: '3', b: '6', c: '9' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        let a, b, c;
        try {
          [a, b, c] = [s.v.a, s.v.b, s.v.c].map(t => F.parse(t));
          if (a.isZero()) throw new Error('With a = 0 there is no x² term: that is a straight line, not a quadratic. Choose a ≠ 0.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw);
        const f = [c, b, a], ft = ptex(f), hh = b.neg().div(a.mul(2)), k = c.sub(b.mul(b).div(a.mul(4))), D = b.mul(b).sub(a.mul(c).mul(4));
        const half = b.div(a.mul(2)), sq = half.mul(half), up = !neg(a), A = coef(a);
        const rD = neg(D) ? null : sqrtFr(D), q = rD ? rD.k.div(fabs(a.mul(2))) : null;
        let roots = [], rootsTex;
        if (rD && rD.r === 1n) {
          roots = (D.isZero() ? [hh] : [hh.sub(q), hh.add(q)]).map(r => ex(r));
          rootsTex = D.isZero() ? 'x = ' + T(hh) + '\\ \\text{(a double root)}' : 'x = ' + T(roots[0].fr) + '\\ \\text{or}\\ x = ' + T(roots[1].fr);
        } else if (rD) {
          roots = [-1, 1].map(g => ap(hh.num() + g * q.num() * Math.sqrt(Number(rD.r)), surdTex(hh, g < 0 ? q.neg() : q, rD.r)));
          rootsTex = 'x = ' + surdTex(hh, q, rD.r, true);
        } else rootsTex = '\\text{no real roots}';
        out.append(K.answer('Vertex and roots of $f(x) = ' + ft + '$', 'V = \\mathopen{}\\left(' + T(hh) + ',\\ ' + T(k) + '\\right),\\qquad ' + rootsTex, (up ? 'It opens upwards: the least value is $' : 'It opens downwards: the greatest value is $') + TD(k) + '$, at $x = ' + T(hh) + '$.'));

        // the picture
        const keyX = [hh.num(), ...roots.map(r => r.x)];
        let lo = Math.min(...keyX), hi = Math.max(...keyX);
        if (Math.abs((lo + hi) / 2) < 2 * Math.max(2.5, hi - lo)) { lo = Math.min(lo, 0); hi = Math.max(hi, 0); }
        const w = Math.max(2.5, ((hi - lo) / 2) * 1.35 + 0.8), mid = (lo + hi) / 2;
        const items = [{ type: 'fn', f: pfn(f), c: 0 }, { type: 'vline', x: hh.num(), c: 4, dash: true, thin: true }];
        roots.forEach((r, j) => items.push({ type: 'pt', x: r.x, y: 0, c: 0, label: roots.length > 1 ? (j ? 'x₂' : 'x₁') : null, below: !up, left: j === 1 }));
        items.push({ type: 'pt', x: hh.num(), y: k.num(), c: 3, label: D.isZero() ? 'V = x₁ = x₂' : 'V', side: true });
        if (!hh.isZero()) items.push({ type: 'pt', x: 0, y: c.num(), c: 2, r: 3.5, label: '(0, ' + ns(c) + ')', below: !up });
        out.append(K.card('The parabola', plot({ x: [mid - w, mid + w], items, width: W, label: 'The parabola y = f(x) with its vertex and roots', legend: [{ c: 0, text: '$y = ' + ft + '$' }, { c: 4, dash: true, text: 'axis of symmetry $x = ' + T(hh) + '$' }] })));

        // completing the square
        const ba = b.div(a), st = [], grp = inner => (a.eq(1) ? inner : A + fixedPar(inner));
        st.push(a.eq(1) ? { text: 'Here $a = 1$, so the $x$ terms are simply $x^2' + sgn(b, 'x') + '$.' } : { text: 'Take $a = ' + T(a) + '$ out of the two $x$ terms.', tex: 'f(x) = ' + A + '\\mathopen{}\\left(x^2' + sgn(ba, 'x') + '\\right)' + sgn(c) });
        if (b.isZero()) st.push({ text: 'There is no $x$ term ($b = 0$), so $f(x)$ is already in vertex form $a(x - 0)^2 + c$.', tex: 'f(x) = ' + A + 'x^2' + sgn(c) });
        else {
          st.push({ text: 'Half of the $x$-coefficient $\\frac{b}{a}$ is $\\frac{b}{2a} = ' + T(half) + '$. Add its square and take it away again inside the bracket (adding $0$ changes nothing).', tex: 'f(x) = ' + grp('x^2' + sgn(ba, 'x') + ' + ' + sqp(half) + ' - ' + sqp(half)) + sgn(c) });
          st.push({ text: 'The first three terms are a perfect square, because $x^2 + 2px + p^2 = (x + p)^2$, here with $p = ' + T(half) + '$:', tex: 'f(x) = ' + grp('\\mathopen{}\\left(' + xp(half) + '\\right)^2 - ' + T(sq)) + sgn(c) });
          st.push({ text: 'Multiply the $-' + T(sq) + '$ by $a$ and add up the numbers:', tex: 'f(x) = ' + A + '\\mathopen{}\\left(' + xp(half) + '\\right)^2' + sgn(a.mul(sq).neg()) + sgn(c) + ' = ' + A + '\\mathopen{}\\left(' + xp(half) + '\\right)^2' + sgn(k) });
        }
        st.push({ text: 'This is the <b>vertex form</b> $a(x - h)^2 + k$, so the vertex is $(h, k)$:', tex: 'h = -\\frac{b}{2a} = ' + TD(hh) + ',\\qquad k = c - \\frac{b^2}{4a} = ' + TD(k) });
        st.push({ text: 'A square is never negative, so ' + (up ? 'with $a > 0$ we get $f(x) \\ge k$: the parabola opens <b>upwards</b> and $k$ is its <b>minimum</b>.' : 'with $a < 0$ we get $f(x) \\le k$: the parabola opens <b>downwards</b> and $k$ is its <b>maximum</b>.'), tex: 'f(x) ' + (up ? '\\ge' : '\\le') + ' ' + T(k) + '\\ \\text{for every } x,\\qquad f\\mathopen{}\\left(' + T(hh) + '\\right) = ' + T(k) });
        st.push({ text: 'The parabola is symmetric about the vertical line through its vertex (the <b>axis of symmetry</b>), crosses the $y$-axis at $f(0) = c = ' + T(c) + '$, and takes every value from $k$ ' + (up ? 'upwards' : 'downwards') + ' (its range):', tex: 'x = ' + T(hh) + ',\\qquad \\text{range } ' + (up ? '\\left[' + T(k) + ', \\infty\\right)' : '\\mathopen{}\\left(-\\infty, ' + T(k) + '\\right]') });
        out.append(K.card('The vertex, by completing the square', K.steps(st)));

        // the roots
        const rs = [{ text: 'The <b>discriminant</b> $D = b^2 - 4ac$ tells how many roots there are.', tex: 'D = ' + sqp(b) + ' - 4 \\cdot ' + par(a) + ' \\cdot ' + par(c) + ' = ' + T(b.mul(b)) + ' - ' + par(a.mul(c).mul(4)) + ' = ' + T(D) }];
        rs.push({ text: D.isZero() ? '$D = 0$: <b>one repeated root</b>, where the vertex touches the $x$-axis.' : neg(D) ? '$D < 0$: <b>no real roots</b>, because a negative number has no real square root. The parabola stays ' + (up ? 'above' : 'below') + ' the $x$-axis.' : '$D > 0$: <b>two real roots</b>, ' + (rD.r === 1n ? 'rational because $D$ is a perfect square.' : 'irrational because $D$ is not a perfect square.') });
        rs.push({ text: 'The <b>quadratic formula</b>, which comes from completing the square on $ax^2 + bx + c = 0$:', tex: 'x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{' + T(b.neg()) + ' \\pm \\sqrt{' + T(D) + '}}{' + T(a.mul(2)) + '}' });
        let check = null;
        if (rD && rD.r === 1n && !D.isZero()) {
          rs.push({ text: '$\\sqrt{' + T(D) + '} = ' + T(rD.k) + '$, so the two signs give:', tex: 'x = \\frac{' + T(b.neg()) + ' - ' + T(rD.k) + '}{' + T(a.mul(2)) + '} = ' + TD(b.neg().sub(rD.k).div(a.mul(2))) + ',\\qquad x = \\frac{' + T(b.neg()) + ' + ' + T(rD.k) + '}{' + T(a.mul(2)) + '} = ' + TD(b.neg().add(rD.k).div(a.mul(2))) });
          check = [roots[0].fr.add(roots[1].fr), roots[0].fr.mul(roots[1].fr)];
        } else if (rD && D.isZero()) {
          rs.push({ text: 'With $D = 0$ both signs give the same number:', tex: 'x = \\frac{' + T(b.neg()) + '}{' + T(a.mul(2)) + '} = ' + TD(hh) });
          check = [hh.mul(2), hh.mul(hh)];
        } else if (rD) {
          rs.push({ text: 'Simplify the square root (take out square factors), then split the fraction:', tex: '\\sqrt{' + T(D) + '} = ' + rootTex(rD.k, rD.r) + ' \\;\\Rightarrow\\; x = ' + surdTex(hh, q, rD.r, true) + ' \\approx ' + fmt(roots[0].x) + '\\ \\text{or}\\ ' + fmt(roots[1].x) });
          check = [hh.mul(2), hh.mul(hh).sub(q.mul(q).mul(F(rD.r)))];
        } else {
          const ri = sqrtFr(D.neg()), qi = ri.k.div(fabs(a.mul(2)));
          rs.push({ text: 'In the complex numbers $\\sqrt{D} = i\\sqrt{-D}$, so the roots are not real:', tex: 'x = ' + (hh.isZero() ? '' : T(hh) + ' ') + '\\pm ' + (ri.r === 1n ? (qi.eq(1) ? '' : T(qi)) : rootTex(qi, ri.r)) + '\\,i' });
        }
        out.append(K.card('The roots, by the quadratic formula', K.steps(rs),
          check ? ok('the roots add to $' + T(check[0]) + ' = -\\frac{b}{a}$ and multiply to $' + T(check[1]) + ' = \\frac{c}{a}$' + (check[0].eq(b.neg().div(a)) && check[1].eq(c.div(a)) ? '' : ' (they do not: please report this)') + '.') : null));

        // factorisation
        const fs = [];
        if (rD && rD.r === 1n) {
          const whole = a.isInt() && b.isInt() && c.isInt();
          const split2 = whole && !c.isZero() ? splitMiddle(a.n, b.n, c.n) : null;
          if (whole && c.isZero()) fs.push({ text: 'There is no constant term, so $x$ is a common factor:', tex: ft + ' = x\\mathopen{}\\left(' + ptex([b, a]) + '\\right)' });
          if (split2) {
            const [p, qq, g1, g2] = split2.map(v => F(v)), br = linTex([[a.div(g1), 'x'], [p.div(g1), '']]);
            fs.push({ text: 'Multiply $a \\cdot c = ' + T(a.mul(c)) + '$, then look for two whole numbers whose product is $ac$ and whose sum is $b = ' + T(b) + '$:', tex: T(p) + ' \\times ' + par(qq) + ' = ' + T(a.mul(c)) + ',\\qquad ' + T(p) + ' + ' + par(qq) + ' = ' + T(b) });
            fs.push({ text: 'Split the middle term $' + linTex([[b, 'x']]) + '$ into $' + linTex([[p, 'x']]) + '$ and $' + linTex([[qq, 'x']]) + '$:', tex: linTex([[a, 'x^2'], [p, 'x'], [qq, 'x'], [c, '']]) });
            fs.push({ text: 'Group the terms in pairs and take out what each pair has in common:', tex: coef(g1) + 'x\\mathopen{}\\left(' + br + '\\right)' + (neg(g2) ? ' - ' : ' + ') + (fabs(g2).eq(1) ? '' : T(fabs(g2))) + '\\mathopen{}\\left(' + br + '\\right)' });
            fs.push({ text: 'Both parts share the bracket, so take it out:', tex: ft + ' = \\mathopen{}\\left(' + linTex([[g1, 'x'], [g2, '']]) + '\\right)\\mathopen{}\\left(' + br + '\\right)' });
            fs.push({ text: 'A product is $0$ only when one of its factors is $0$:', tex: linTex([[g1, 'x'], [g2, '']]) + ' = 0 \\Rightarrow x = ' + T(g2.neg().div(g1)) + ',\\qquad ' + br + ' = 0 \\Rightarrow x = ' + T(p.div(g1).neg().div(a.div(g1))) });
          }
          fs.push({ text: 'With the roots $r$ found above, every quadratic factors as $a(x - r_1)(x - r_2)$:', tex: ft + ' = ' + A + (D.isZero() ? '\\mathopen{}\\left(' + xm(hh) + '\\right)^2' : '\\mathopen{}\\left(' + xm(roots[0].fr) + '\\right)\\mathopen{}\\left(' + xm(roots[1].fr) + '\\right)') });
        } else if (rD) fs.push({ text: 'The roots are irrational, so there are no factors with whole numbers (lecture 3.6 needs rational roots); with the roots it still factors:', tex: ft + ' = ' + A + '\\mathopen{}\\left(x - ' + roots[0].tex + '\\right)\\mathopen{}\\left(x - ' + roots[1].tex + '\\right)' });
        else fs.push({ text: 'There are no real roots, so $f(x)$ does not split into real factors $(x - r_1)(x - r_2)$.' });
        out.append(K.card('Factorisation', K.steps(fs)));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- polynomials (week 4) */
    // ?mode=expr|roots  &p=x^3-2x^2-5x+6 (the polynomial, mode expr, any form up to degree 8)  &roots=1,1,-2 (its zeros,
    // each repeated as often as its multiplicity, mode roots)  &lead=1 (the leading coefficient, mode roots)
    // &d=x-1 (the divisor for the long division)
    polynomial(el, query, ctx) {
      const s = K.state(ctx, { mode: 'expr', p: 'x^3-2x^2-5x+6', roots: '1,1,-2', lead: '1', d: 'x-1' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      const divisor = t => { const d = parsePoly(t, 8); if (pdeg(d) < 1) throw new Error('Divide by a polynomial with an x in it, like x - 2.'); return d; };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('A polynomial adds up powers of $x$ times numbers. Its highest power (the <b>degree</b>) and that power’s coefficient decide where the ends of the graph go; its <b>zeros</b> are where the graph meets the $x$-axis.'),
          K.select({ label: 'Give the polynomial by', value: s.v.mode, options: [['expr', 'Its expression (any form)'], ['roots', 'Its zeros and leading coefficient']], onChange: v => { s.set({ mode: v }); build(); } }));
        if (s.v.mode === 'roots') controls.append(
          exprField({ label: 'Zeros, a zero repeated for its multiplicity', value: s.v.roots, parse: parseList, onChange: v => s.set({ roots: v }), help: 'For example $1, 1, -2$ means $(x - 1)^2(x + 2)$.' }),
          numRow({ label: 'Leading coefficient', names: ['$a$'], values: [s.v.lead], onChange: v => s.set({ lead: v[0] }) }));
        else controls.append(exprField({ label: '$p(x) =$', value: s.v.p, parse: t => parsePoly(t, 8), onChange: v => s.set({ p: v }), help: 'Any form: $x^3 - 4x$, $2x^2 + x/2 - 1$, $(x-1)^2(x+3)$. Degree up to 8.' }));
        controls.append(
          exprField({ label: 'Divide by $d(x) =$', value: s.v.d, parse: divisor, onChange: v => s.set({ d: v }), help: 'Long division, step by step: $p(x) = d(x)\\,q(x) + r(x)$.' }),
          tries([
            { label: '(x − 1)²(x + 2)³(x + 4)', cite: 'lecture 4.9', v: { mode: 'roots', roots: '1,1,-2,-2,-2,-4', lead: '1' } },
            { label: '(x − 1)³(x + 2): turning points', cite: 'lecture 4.12', v: { mode: 'roots', roots: '1,1,1,-2', lead: '1' } },
            { label: '−(x + 2)²(x − 5)', cite: 'lecture 4.13', v: { mode: 'roots', roots: '-2,-2,5', lead: '-1' } },
            { label: '(2x³ + 3x² + 1) ÷ (2x + 1)', cite: 'lecture 4.6', v: { mode: 'expr', p: '2x^3+3x^2+1', d: '2x+1' } },
            { label: 'x⁴ + 1: no real zeros', v: { mode: 'expr', p: 'x^4+1', d: 'x^2+1' } },
            { label: 'x⁵ − 5x³ + 4x', v: { mode: 'expr', p: 'x^5-5x^3+4x', d: 'x+2' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        let p, d, given = null;
        try {
          if (s.v.mode === 'roots') {
            const rs = parseList(s.v.roots), a = F.parse(s.v.lead);
            if (a.isZero()) throw new Error('The leading coefficient cannot be 0.');
            given = { rs, a };
            p = rs.reduce((acc, r) => pmul(acc, [r.neg(), F(1)]), [a]);
          } else p = parsePoly(s.v.p, 8);
          d = divisor(s.v.d);
          if (pdeg(p) < 1) throw new Error(pdeg(p) === 0 ? 'p(x) = ' + p[0].str() + ' is a constant, so it has no zeros. Type a polynomial with x in it.' : 'p(x) = 0 for every x, so every number is a zero. Type another polynomial.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), n = pdeg(p), an = p[n], pt = ptex(p), sol = solvePoly(p), f = pfn(p);
        const fac = sol.rr.roots.length ? factorTex(p, sol) : null;
        const zs = sol.roots;
        const turnSol = solvePoly(pder(p)), turns = turnSol.roots.filter(o => o.m % 2 === 1);
        out.append(K.answer('$p(x)$, its degree and its zeros', 'p(x) = ' + pt + (fac && fac !== pt ? ' = ' + fac : ''), 'Degree $' + n + '$, leading coefficient $' + T(an) + '$. ' + (zs.length ? 'Real zeros: ' + zs.map(o => '$' + rtex(o) + (o.m > 1 ? '\\ (\\times ' + o.m + ')' : '') + '$').join(', ') + '.' : 'No real zeros.')));

        // the picture
        const keyX = zs.map(o => o.x).concat(turns.map(o => o.x));
        let lo = keyX.length ? Math.min(...keyX) : -2, hi = keyX.length ? Math.max(...keyX) : 2;
        const padX = Math.max(1, (hi - lo) * 0.3);
        lo -= padX; hi += padX;
        let yr = null;
        if (turns.length) {
          const vals = turns.map(o => f(o.x)).concat([0]);
          if (lo < 0 && hi > 0) vals.push(f(0));
          const a0 = Math.min(...vals), b0 = Math.max(...vals), sp = Math.max(b0 - a0, 1);
          yr = [a0 - 0.35 * sp, b0 + 0.35 * sp];
        }
        const items = [{ type: 'fn', f, c: 0 }];
        zs.forEach(o => items.push({ type: 'pt', x: o.x, y: 0, c: 0, label: (o.fr ? ns(o.fr) : nx(o.x)) + (o.m > 1 ? ' (×' + o.m + ')' : ''), below: true }));
        turns.forEach(o => items.push({ type: 'pt', x: o.x, y: f(o.x), c: 4, r: 3.5 }));
        items.push({ type: 'pt', x: 0, y: p[0].num(), c: 2, r: 3.5, label: zs.some(o => o.x === 0) ? null : '(0, ' + ns(p[0]) + ')', fit: false });
        out.append(K.card('The graph', plot({ x: [lo, hi], y: yr, items, width: W, label: 'The graph of p(x) with its zeros', legend: [{ c: 0, text: '$y = p(x)$, zeros marked with their multiplicity; grey dots are turning points' }] })));

        // expanded form and degree
        const st = [];
        if (given) {
          st.push({ text: 'Each zero $r$ gives a factor $(x - r)$. Start with the leading coefficient and multiply the factors in, one at a time.', tex: 'p(x) = ' + coef(given.a) + given.rs.map(r => (r.isZero() ? 'x' : '\\mathopen{}\\left(' + xm(r) + '\\right)')).join('\\allowbreak ') });
          let acc = [given.a];
          given.rs.forEach(r => { const prev = acc; acc = pmul(acc, [r.neg(), F(1)]); st.push({ text: 'Multiply by $(' + xm(r) + ')$:', tex: (pdeg(prev) < 1 ? T(prev[0]) : fixedPar(ptex(prev))) + '\\allowbreak\\mathopen{}\\left(' + xm(r) + '\\right) = ' + ptex(acc) }); });
        } else st.push({ text: 'Multiply out any brackets and collect like terms, highest power first:', tex: 'p(x) = ' + pt });
        st.push({ text: 'The <b>degree</b> is the highest power with a nonzero coefficient, and that term $a_nx^n$ is the <b>leading term</b>.', tex: 'n = ' + n + ',\\qquad a_n = ' + T(an) + ',\\qquad \\text{leading term } ' + ptex(mono(an, n)) });
        out.append(K.card('Expanded form and degree', K.steps(st)));

        // end behaviour
        const rightUp = !neg(an), leftUp = n % 2 === 0 ? rightUp : !rightUp;
        let over = T(an);
        for (let j = n - 1; j >= 0; j--) if (!p[j].isZero()) { const c = fabs(p[j]), m = n - j; over += (neg(p[j]) ? ' - ' : ' + ') + '\\frac{' + c.n + '}{' + (c.d === 1n ? '' : c.d) + 'x' + (m > 1 ? '^{' + m + '}' : '') + '}'; }
        out.append(K.card('End behaviour',
          K.steps([
            { text: 'Divide by $x^n$: every term except the leading one gets a power of $x$ underneath and shrinks to $0$ as $x$ grows. Far from $0$, $p(x)$ behaves like its leading term.', tex: '\\frac{p(x)}{x^{' + n + '}} = ' + over + ' \\;\\to\\; ' + T(an) + ',\\qquad p(x) \\approx ' + ptex(mono(an, n)) },
            { text: 'As $x \\to \\infty$, $x^{' + n + '}$ is huge and positive, so $p(x)$ takes the sign of $a_n = ' + T(an) + '$.', tex: '\\lim_{x \\to \\infty} p(x) = ' + (rightUp ? '\\infty' : '-\\infty') },
            { text: 'As $x \\to -\\infty$, $x^{' + n + '}$ is ' + (n % 2 === 0 ? 'positive (an even power)' : 'negative (an odd power)') + ', so the sign is ' + (leftUp ? '$+$' : '$-$') + '.', tex: '\\lim_{x \\to -\\infty} p(x) = ' + (leftUp ? '\\infty' : '-\\infty') },
          ]),
          K.p('So the graph ' + (leftUp ? 'comes down from the top on the left' : 'comes up from the bottom on the left') + ' and ' + (rightUp ? 'goes up on the right' : 'goes down on the right') + (n % 2 === 0 ? ': both ends point the same way (even degree).' : ': the ends point opposite ways (odd degree).'))));

        // zeros
        const zst = [];
        if (given) zst.push({ text: 'The zeros are the numbers you gave; a zero listed $m$ times has <b>multiplicity</b> $m$, so its factor appears to the power $m$:', tex: 'p(x) = ' + factorTex(p, sol) });
        else zeroSteps(p, sol, 'p').forEach(o => zst.push(o));
        const total = zs.reduce((t, o) => t + o.m, 0);
        out.append(K.card('Zeros and multiplicities', K.steps(zst),
          zs.length ? K.table(['zero', 'multiplicity', 'at the $x$-axis the graph'], zs.map(o => ['$' + rtex(o) + '$', '$' + o.m + '$', o.m % 2 === 0 ? 'touches and turns back' : o.m === 1 ? 'crosses' : 'crosses, flattening out like $x^3$'])) : K.p('No real zeros: the graph never meets the $x$-axis.'),
          K.p('The multiplicities add up to $' + total + '$' + (total === n ? ' $= n$: every zero is real.' : ', and $n - ' + total + ' = ' + (n - total) + '$ zeros are not real (they come in complex pairs).') + ' The graph crosses the $y$-axis at $p(0) = ' + T(p[0]) + '$.')));

        // turning points
        out.append(K.card('Turning points',
          K.p('Between two turns the graph only rises or only falls, so a degree-$n$ polynomial turns at most $n - 1 = ' + (n - 1) + '$ times (lecture 4.12). ' + (turns.length ? 'This one turns ' + (turns.length === 1 ? 'once' : turns.length + ' times') + (turns.length < n - 1 ? ' (fewer is allowed: “at most”)' : '') + ', where its slope $p\'(x) = ' + ptex(pder(p)) + '$ changes sign (slopes come in week 8):' : 'This one never turns: its slope $p\'(x) = ' + ptex(pder(p)) + '$ never changes sign.')),
          turns.length ? K.table(['turning point $x$', 'height $p(x)$'], turns.map(o => ['$' + (o.fr ? TD(o.fr) : o.tex ? o.tex + ' \\approx ' + fmt(o.x) : '\\approx ' + fmt(o.x)) + '$', '$' + (o.fr ? TD(pev(p, o.fr)) : '\\approx ' + fmt(f(o.x))) + '$'])) : null));

        // long division
        const dv = pdiv(p, d), dt = ptex(d), dd = pdeg(d), lst = [];
        dv.steps.forEach(o => {
          const tm = ptex(mono(o.c, o.k));
          lst.push({ text: 'Divide the leading term $' + ptex(mono(o.lead, o.top)) + '$ by the leading term of $d(x)$, $' + ptex(mono(d[dd], dd)) + '$: the next term of the quotient is $' + tm + '$.', tex: '\\frac{' + ptex(mono(o.lead, o.top)) + '}{' + ptex(mono(d[dd], dd)) + '} = ' + tm });
          lst.push({ text: 'Multiply $d(x)$ by $' + tm + '$ and subtract it from what is left:', tex: fixedPar(ptex(o.before)) + ' - ' + fixedPar(ptex(o.m)) + ' = ' + ptex(o.after) });
        });
        lst.push({ text: dv.steps.length ? 'Stop: what is left has a lower degree than $d(x)$. It is the <b>remainder</b>.' : 'The degree of $p(x)$ is already below that of $d(x)$: the quotient is $0$ and $p(x)$ itself is the remainder.', tex: 'q(x) = ' + ptex(dv.q) + ',\\qquad r(x) = ' + ptex(dv.r) });
        const back = padd(pmul(d, dv.q), dv.r), same = psub(back, p).every(c => c.isZero());
        let rt = null;
        if (dd === 1) { const c0 = d[0].neg().div(d[1]), pc = pev(p, c0); rt = K.p('<b>Remainder theorem</b>: dividing by $' + dt + '$ (which is $0$ at $x = ' + T(c0) + '$) leaves $p(' + T(c0) + ') = ' + T(pc) + '$' + (pc.isZero() ? ', so $' + dt + '$ is a <b>factor</b> of $p(x)$ (factor theorem).' : '.')); }
        out.append(K.card('Long division by $d(x) = ' + dt + '$', K.steps(lst),
          K.p('So $p(x) = d(x)\\,q(x) + r(x)$:'), h('div', { class: 'lk-md', html: '<span class="lk-wrap">' + K.kx('\\displaystyle ' + pt + ' = \\mathopen{}\\left(' + dt + '\\right)' + fixedPar(ptex(dv.q)) + (pdeg(dv.r) < 0 ? '' : (neg(dv.r[pdeg(dv.r)]) ? ' - ' + ptex(pneg(dv.r)) : ' + ' + ptex(dv.r))), false) + '</span>' }),
          rt, ok('multiplying back, $d(x)\\,q(x) + r(x) = ' + ptex(back) + '$' + (same ? ', which is $p(x)$.' : ' (not $p(x)$: please report this).'))));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- exponential functions (week 5) */
    // ?a=1&b=2   f(x) = a·bˣ: a any number except 0; the base b > 0 and b ≠ 1. Each may be whole, a fraction, a decimal,
    //   e, pi or sqrt(…)
    exponential(el, query, ctx) {
      const s = K.state(ctx, { a: '1', b: '2' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('An exponential function $f(x) = a \\cdot b^x$ starts at $a$ when $x = 0$ and is <b>multiplied by $b$</b> each time $x$ goes up by $1$, so it grows (or shrinks) faster and faster.'),
          numRow({ label: '$f(x) = a \\cdot b^x$', names: ['$a$', '$b$'], values: [s.v.a, s.v.b], real: true, onChange: ([a, b]) => s.set({ a, b }), help: 'The base $b$ must be positive and not $1$. Type <b>e</b> for $e \\approx 2.718$.' }),
          tries([
            { label: '2ˣ', cite: 'lecture 5.4', v: { a: '1', b: '2' } },
            { label: '(1/5)ˣ = 5⁻ˣ: decay', cite: 'lecture 5.4', v: { a: '1', b: '1/5' } },
            { label: '₹1 at 1% a year: 1.01ˣ', cite: 'lecture 5.5', v: { a: '1', b: '1.01' } },
            { label: 'eˣ itself', cite: 'lecture 5.5', v: { a: '1', b: 'e' } },
            { label: '4ˣ doubles every ½', v: { a: '1', b: '4' } },
            { label: '−2 · 3ˣ: a negative start', v: { a: '-2', b: '3' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        let a, b;
        try {
          a = parseReal(s.v.a); b = parseReal(s.v.b);
          if (isZ(a)) throw new Error('With a = 0 the function is 0 everywhere. Choose a ≠ 0.');
          if (!(b.x > 0)) throw new Error(b.x === 0 ? 'The base b cannot be 0: 0 to a negative power is not defined. Choose b > 0.' : 'The base b must be positive: a negative base has no real value at x = 1/2, for example.');
          if (veq(b, ex(1))) throw new Error('With b = 1 every power is 1, so f(x) = a stays flat. Choose b ≠ 1.');
          if (Math.abs(Math.log(b.x)) > 40) throw new Error('That base is too extreme to work with here; keep it between e^-40 and e^40.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), grow = b.x > 1, lnb = Math.log(b.x), rising = (vsign(a) > 0) === grow;
        const bT = baseTex(b), ftex = cmul(a, bT + '^{x}'), f = x => a.x * Math.pow(b.x, x), val = k => vmul(a, vpow(b, ex(k)));
        const T2 = Math.LN2 / Math.abs(lnb), Tx = exactLog(b, ex(grow ? 2 : F(1, 2)));
        const word = grow ? 'doubling' : 'halving', two = grow ? '2' : '\\frac{1}{2}', Tt = Tx ? T(Tx) : '\\approx ' + fmt(T2);
        out.append(K.answer('$f(x) = ' + ftex + '$', 'f(0) = ' + vt(a) + ',\\qquad f(x + 1) = ' + sub(b) + ' \\cdot f(x),\\qquad T ' + (Tx ? '= ' + TD(Tx) : '\\approx ' + fmt(T2)),
          '<b>' + (grow ? 'Growth' : 'Decay') + '</b>: it ' + (grow ? 'doubles' : 'halves') + ' every $T' + (Tx ? ' = ' : ' ') + Tt + '$ steps of $x$, its ' + word + ' time.'));

        // the graph
        const x0 = -Math.min(3 * T2, 300), x1 = Math.min(4 * T2, 400);
        const items = [{ type: 'fn', f, c: 0 }, { type: 'fn', f: Math.exp, c: 1, dash: true, nofit: true }];
        [0, 1, 2].forEach(j => items.push({ type: 'pt', x: j * T2, y: f(j * T2), c: 3, label: j === 0 ? 'a' : grow ? (j === 1 ? '2a' : '4a') : (j === 1 ? 'a/2' : 'a/4'), left: j === 0 && !rising }));
        items.push({ type: 'pt', x: 0, y: 1, c: 1, r: 3, fit: false });
        out.append(K.card('The graph', plot({ x: [x0, x1], items, width: W, label: 'The graph of a times b to the x, with e to the x',
          legend: [{ c: 0, text: '$y = ' + ftex + '$; the dots are ' + (grow ? '$a$, $2a$, $4a$' : '$a$, $\\frac{a}{2}$, $\\frac{a}{4}$') + ', one ' + word + ' time apart' }, { c: 1, dash: true, text: '$y = e^x$' }] })));

        // the table
        const rows = [];
        for (let k = -3; k <= 4; k++) { const v = val(k), w = val(k + 1); rows.push(['$' + k + '$', '$' + vd(v) + '$', '$' + vd(vdiv(w, v)) + '$', '$' + fmt(Math.exp(k)) + '$']); }
        out.append(K.card('A table of values', K.table(['$x$', '$f(x)$', '$f(x + 1) \\div f(x)$', '$e^x$'], rows),
          K.p('Every step of $1$ in $x$ multiplies by the same $b = ' + vt(b) + '$: equal steps give equal <b>ratios</b>. A straight line would give equal differences instead.')));

        // growth or decay
        out.append(K.card(grow ? 'Growth' : 'Decay', K.steps([
          { text: 'At $x = 0$ every base gives $b^0 = 1$, so the graph crosses the $y$-axis at $a$:', tex: 'f(0) = ' + cmul(a, bT + '^{0}') + ' = ' + vt(a) },
          { text: 'One step of $1$ in $x$ multiplies by $b$, because $b^{x + 1} = b^x \\cdot b$:', tex: 'f(x + 1) = ' + cmul(a, bT + '^{x + 1}') + ' = ' + sub(b) + ' \\cdot f(x)' },
          grow ? { text: '$b = ' + vt(b) + ' > 1$, so each step makes $f$ bigger in size: <b>exponential growth</b>, by $(b - 1) \\times 100\\% \\approx ' + fmt((b.x - 1) * 100, 2) + '\\%$ a step. Going back, it shrinks towards $0$: the $x$-axis is a horizontal asymptote.', tex: '\\lim_{x \\to \\infty} f(x) = ' + (vsign(a) > 0 ? '\\infty' : '-\\infty') + ',\\qquad \\lim_{x \\to -\\infty} f(x) = 0' }
            : { text: '$0 < b = ' + vt(b) + ' < 1$, so each step makes $f$ smaller in size: <b>exponential decay</b>, by $(1 - b) \\times 100\\% \\approx ' + fmt((1 - b.x) * 100, 2) + '\\%$ a step. It gets ever closer to the $x$-axis but never reaches it.', tex: '\\lim_{x \\to \\infty} f(x) = 0,\\qquad \\lim_{x \\to -\\infty} f(x) = ' + (vsign(a) > 0 ? '\\infty' : '-\\infty') },
          { text: 'Every real $x$ is allowed and $b^x > 0$ always, so $f$ keeps the sign of $a$. It is always ' + (rising ? 'rising' : 'falling') + ', so it is one-to-one (lecture 5.4).', tex: '\\text{domain } \\mathbb{R},\\qquad \\text{range } ' + (vsign(a) > 0 ? '(0, \\infty)' : '(-\\infty, 0)') },
        ])));

        // doubling or halving time
        out.append(K.card('The ' + word + ' time', K.steps([
          { text: (grow ? 'Doubling' : 'Halving') + ' after a time $T$ means $f(x + T) = ' + two + '\\,f(x)$. Divide both sides by $f(x) = a \\cdot b^x$: the starting point drops out, so the ' + word + ' time is the same from anywhere.', tex: cmul(a, bT + '^{x + T}') + ' = ' + two + ' \\cdot ' + cmul(a, bT + '^{x}') + ' \\;\\Rightarrow\\; ' + bT + '^{T} = ' + two },
          { text: 'So $T$ is the power of $b$ that gives $' + two + '$, a logarithm (week 6), found with $\\ln$:', tex: 'T = ' + logOf(b, grow ? '2' : '\\tfrac{1}{2}') + ' = \\frac{\\ln ' + (grow ? '2' : '\\frac{1}{2}') + '}{\\ln ' + sub(b) + '}' + (Tx ? ' = ' + TD(Tx) : ' \\approx \\frac{' + fmt(grow ? Math.LN2 : -Math.LN2) + '}{' + fmt(lnb) + '} \\approx ' + fmt(T2)) },
        ]), ok('$f(T) \\div f(0) = b^T ' + (Tx ? '= ' + vt(vpow(b, ex(Tx))) : '\\approx ' + fmt(Math.pow(b.x, T2), 6)) + '$, ' + (grow ? 'twice' : 'half') + ' the start.')));

        // e^x beside it
        const isE = !b.fr && b.tex === 'e';
        out.append(K.card('$e^x$ beside it', K.steps([
          { text: 'The number $e \\approx 2.71828$ is the base whose graph crosses the $y$-axis with slope exactly $1$. It also comes from compounding interest more and more often: $\\mathopen{}\\left(1 + \\frac{1}{n}\\right)^n \\to e$ (lecture 5.5).', tex: '\\mathopen{}\\left(1 + \\frac{1}{1000}\\right)^{1000} \\approx ' + fmt(Math.pow(1.001, 1000), 5) + ',\\qquad e \\approx ' + fmt(Math.E, 5) },
          { text: 'Every positive base is a power of $e$, $b = e^{\\ln b}$. So $a \\cdot b^x = a \\cdot e^{kx}$ with $k = \\ln b$: the same curve as $e^x$, run at speed $k$' + (grow ? '.' : ' (backwards, as $k < 0$).'), tex: 'k = \\ln ' + sub(b) + (isE ? ' = 1' : ' \\approx ' + fmt(lnb)) + ',\\qquad f(x) ' + (isE ? '= ' : '\\approx ') + cmul(a, 'e^{' + (isE ? '' : fmt(lnb)) + 'x}') },
        ])));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- composition and inverse (week 5) */
    // ?f=lin&fp=3,-4 (the outer function's family and its numbers)  &g=quad&gp=1,0 (the inner one's)  &x=3 (the input)
    //   families and their numbers in order: lin p·x+q (p,q); quad p·x²+q (p,q); cube p·x³+q (p,q); sqrt √(p·x+q) (p,q);
    //   recip p/(x+q) (p,q); frac (a·x+b)/(c·x+d) (a,b,c,d); abs p·|x|+q (p,q); exp p·bˣ (p,b); log p·log_b x (p,b).
    //   Numbers and x may be fractions, decimals, e, pi or sqrt(…).
    composition(el, query, ctx) {
      const s = K.state(ctx, { f: 'lin', fp: '3,-4', g: 'quad', gp: '1,0', x: '3' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      const fam = id => FAM[id] || FAM.lin, defs = id => fam(id).pars.map(p => p[1]).join(',');
      const opts = Object.keys(FAM).map(id => [id, FAM[id].name]);
      function build() {
        controls.innerHTML = '';
        const nums = (who, pk) => numRow({ label: 'The numbers in $' + who + '$', names: fam(s.v[who]).pars.map(p => '$' + p[0] + '$'), values: split(s.v[pk], fam(s.v[who]).pars.length), real: true, onChange: v => s.set({ [pk]: v.join(',') }) });
        controls.append(
          K.p('Composition chains two functions: $f(g(x))$ puts $x$ into $g$ first and then feeds $g$’s output into $f$. An <b>inverse</b> runs a function backwards, and only a one-to-one function has one.'),
          K.select({ label: 'The outer function $f$', value: s.v.f, options: opts, onChange: v => { s.set({ f: v, fp: defs(v) }); build(); } }), nums('f', 'fp'),
          K.select({ label: 'The inner function $g$', value: s.v.g, options: opts, onChange: v => { s.set({ g: v, gp: defs(v) }); build(); } }), nums('g', 'gp'),
          numRow({ label: 'The input', names: ['$x$'], values: [s.v.x], real: true, onChange: v => s.set({ x: v[0] }) }),
          tries([
            { label: 'f = 3x − 4, g = x²', cite: 'lecture 5.7', v: { f: 'lin', fp: '3,-4', g: 'quad', gp: '1,0', x: '3' } },
            { label: 'f = x + 1, g = x² − 1', cite: 'lecture 5.7', v: { f: 'lin', fp: '1,1', g: 'quad', gp: '1,-1', x: '3' } },
            { label: '85% of the price, then ₹3000 off', cite: 'lecture 5.6', v: { f: 'lin', fp: '1,-3000', g: 'lin', gp: '0.85,0', x: '40000' } },
            { label: 'f = 2/(x − 1), g = 3/x at x = 3', cite: 'lecture 5.8', v: { f: 'recip', fp: '2,-1', g: 'recip', gp: '3,0', x: '3' } },
            { label: 'x³ and its inverse ∛x', cite: 'lecture 5.9', v: { f: 'cube', fp: '1,0', g: 'lin', gp: '4,0', x: '2' } },
            { label: '(4x + 5)/(3x − 2): its inverse', cite: 'lecture 5.10', v: { f: 'frac', fp: '4,5,3,-2', g: 'lin', gp: '1,0', x: '1' } },
            { label: 'x² + 1 undone by √(x − 1)', cite: 'lecture 5.10', v: { f: 'quad', fp: '1,1', g: 'sqrt', gp: '1,-1', x: '5' } },
            { label: '|x| is not one-to-one', cite: 'lecture 5.2', v: { f: 'abs', fp: '1,0', g: 'lin', gp: '1,-3', x: '2' } },
            { label: '2ˣ after log₂ x', v: { f: 'exp', fp: '1,2', g: 'log', gp: '1,2', x: '3' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        const fF = fam(s.v.f), gF = fam(s.v.g);
        let Pf, Pg, x0;
        try { Pf = famPars(fF, s.v.fp, 'f'); Pg = famPars(gF, s.v.gp, 'g'); x0 = parseReal(s.v.x); } catch (e) { bad(out, e); return; }
        const W = track(out, draw), xT = vt(x0), fT = u => fF.tex(u, Pf), gT = u => gF.tex(u, Pg);
        const chain = (A, PA, B, PB) => { const r1 = B.ev(x0, PB); if (r1.err) return { e1: r1.err }; const r2 = A.ev(r1.v, PA); return r2.err ? { mid: r1.v, e2: r2.err } : { mid: r1.v, v: r2.v }; };
        const fg = chain(fF, Pf, gF, Pg), gf = chain(gF, Pg, fF, Pf);
        const said = (name, r) => (r.v ? '$' + name + eqv(r.v) + '$' : '$' + name + '$ is not defined');
        out.append(K.answer('$f(g(x))$ and $g(f(x))$', 'f(g(x)) = ' + fT(gT('x')) + ',\\qquad g(f(x)) = ' + gT(fT('x')),
          'At $x = ' + xT + '$: ' + said('f(g(' + xT + '))', fg) + ' and ' + said('g(f(' + xT + '))', gf) + '.'));

        // the inverse of f, drawn with f and the mirror line y = x
        const iv = fF.inv(Pf), undo = iv.steps ? iv : iv.part || null, fx0 = fF.ev(x0, Pf);
        const fN = famFn(fF, Pf), iN = undo ? x => { const r = undo.ev(ap(x)); return r.err ? NaN : r.v.x; } : null;
        const A = fx0.v ? [x0.x, fx0.v.x] : null;
        const near = A && Math.abs(A[0]) < 60 && Math.abs(A[1]) < 60;
        const win = around((near ? [A, [A[1], A[0]]] : []).concat([[-4, -4], [4, 4]]), 3);
        const k = A ? A[1] : NaN, flat = [-1.3, 0.4, 2.1].every(t => Math.abs(fN(t) - fN(0.7)) < 1e-12);
        const hits = [];
        if (Number.isFinite(k) && !flat) {
          const lo = win.x[0] - (win.x[1] - win.x[0]) / 2, hi = win.x[1] + (win.x[1] - win.x[0]) / 2, m = 1600;
          let px = lo, pv = fN(lo) - k;
          for (let j = 1; j <= m; j++) {
            const xx = lo + ((hi - lo) * j) / m, v = fN(xx) - k;
            if (Number.isFinite(v) && Number.isFinite(pv) && (v === 0 || (v < 0) !== (pv < 0)) && Math.abs(v - pv) < 1e3) {
              let a1 = px, b1 = xx, fa1 = pv;
              for (let it = 0; it < 60 && v !== 0; it++) { const mid = (a1 + b1) / 2, fm = fN(mid) - k; if ((fm < 0) === (fa1 < 0)) { a1 = mid; fa1 = fm; } else b1 = mid; }
              const r = v === 0 ? xx : (a1 + b1) / 2;
              if (!hits.some(t => Math.abs(t - r) < 1e-6)) hits.push(r);
            }
            px = xx; pv = v;
          }
        }
        const items = [{ type: 'fn', f: x => x, c: 4, dash: true, thin: true, nofit: true }, { type: 'fn', f: fN, c: 0, breaks: fF.breaks ? fF.breaks(Pf) : null }];
        if (iN) items.push({ type: 'fn', f: iN, c: 1, breaks: undo.ibreaks ? undo.ibreaks() : null });
        if (Number.isFinite(k)) items.push({ type: 'hline', y: k, c: 3, dash: true, thin: true });
        hits.forEach(t => items.push({ type: 'pt', x: t, y: k, c: 3, r: 3.5, fit: false }));
        if (A) items.push({ type: 'pt', x: A[0], y: A[1], c: 0, label: 'A' });
        if (A && iN && (iv.steps || x0.x >= 0)) items.push({ type: 'seg', x1: A[0], y1: A[1], x2: A[1], y2: A[0], c: 4, dash: true, thin: true }, { type: 'pt', x: A[1], y: A[0], c: 1, label: 'A′' });
        out.append(K.card('$f$, its inverse and the mirror line', plot({ x: win.x, y: win.y, equal: true, items, width: W, label: 'f, its inverse and the line y = x',
          legend: [{ c: 0, text: '$y = f(x) = ' + fT('x') + '$' }].concat(iN ? [{ c: 1, text: iv.steps ? '$y = f^{-1}(x)$, the mirror image in $y = x$' : 'the inverse of the right half ($x \\ge 0$)' }] : [])
            .concat([{ c: 4, dash: true, text: 'the mirror line $y = x$' }], Number.isFinite(k) ? [{ c: 3, dash: true, text: 'the horizontal line through $A$' }] : []) })));

        // f(g(x)) and g(f(x)), step by step
        const steps = (outer, inner, oT, iT, r, oP, iP) => {
          const o = outer === 'f' ? fF : gF, ip = outer === 'f' ? gF.poly && gF.poly(Pg) : fF.poly && fF.poly(Pf), op = outer === 'f' ? fF.poly && fF.poly(Pf) : gF.poly && gF.poly(Pg);
          const comp = ip && op ? pcompose(op, ip) : null, formula = oT(iT('x'));
          const st = [{ text: 'The formula: put the whole of $' + inner + '(x) = ' + iT('x') + '$ in place of $x$ in $' + outer + '(x) = ' + oT('x') + '$ (lecture 5.7).', tex: outer + '(' + inner + '(x)) = ' + formula + (comp && !sameTex(ptex(comp), formula) ? ' = ' + ptex(comp) : '') }];
          st.push({ text: 'Work from the inside out. First $' + inner + '(' + xT + ')$: put $' + xT + '$ in place of $x$ in $' + inner + '$.' + (r.e1 ? ' ' + r.e1 + ' So $' + xT + '$ is not in the domain of $' + inner + '$, nor of $' + outer + ' \\circ ' + inner + '$ (lecture 5.8).' : ''), tex: r.e1 ? null : inner + '\\mathopen{}\\left(' + xT + '\\right) = ' + iT(sub(x0)) + eqv(r.mid) });
          if (!r.e1) st.push({ text: 'Then feed that output into $' + outer + '$.' + (r.e2 ? ' ' + r.e2 + ' So $' + xT + '$ is not in the domain of $' + outer + ' \\circ ' + inner + '$: $' + inner + '$ accepts it, but $' + outer + '$ cannot take $' + inner + '$’s output (lecture 5.8).' : ''), tex: r.e2 ? null : outer + '\\mathopen{}\\left(' + inner + '\\mathopen{}\\left(' + xT + '\\right)\\right) = ' + outer + '\\mathopen{}\\left(' + vt(r.mid) + '\\right) = ' + oT(sub(r.mid)) + eqv(r.v) });
          const kids = [K.steps(st)];
          if (r.v) kids.push(K.p('As a machine: $' + xT + ' \\xrightarrow{\\ ' + inner + '\\ } ' + vt(r.mid) + ' \\xrightarrow{\\ ' + outer + '\\ } ' + vt(r.v) + '$'));
          if (r.v && comp && x0.fr) { const direct = pev(comp, x0.fr); kids.push(ok('the expanded formula at $x = ' + xT + '$ gives $' + T(direct) + '$' + (r.v.fr && direct.eq(r.v.fr) ? ', the same.' : ' (they differ: please report this).'))); }
          return K.card('$' + outer + '(' + inner + '(x))$, step by step', ...kids);
        };
        out.append(steps('f', 'g', fT, gT, fg), steps('g', 'f', gT, fT, gf));
        if (fg.v && gf.v && !veq(fg.v, gf.v)) out.append(K.note('Order matters: $f(g(' + xT + ')) = ' + vt(fg.v) + '$ but $g(f(' + xT + ')) = ' + vt(gf.v) + '$. In general $f \\circ g \\ne g \\circ f$.'));

        // the inverse of f
        const ist = [{ text: 'Write $y = f(x)$:', tex: 'y = ' + fT('x') }];
        if (iv.steps) {
          iv.steps.forEach(([t, m]) => ist.push({ text: t, tex: m }));
          ist.push({ text: 'So the inverse, defined for ' + iv.dom + ':', tex: 'f^{-1}(x) = ' + iv.tex });
        } else {
          ist.push({ text: iv.no });
          if (iv.part) { ist.push({ text: iv.part.note }); iv.part.steps.forEach(([t, m]) => ist.push({ text: t, tex: m })); }
        }
        const kids = [K.steps(ist)];
        if (fx0.v && undo) {
          const back = undo.ev(fx0.v);
          if (back.v && (iv.steps || x0.x >= 0)) kids.push(ok('undoing $f$ brings $x$ back: $f(' + xT + ')' + eqv(fx0.v) + '$ and $f^{-1}\\mathopen{}\\left(' + vt(fx0.v) + '\\right)' + eqv(back.v) + '$' + (veq(back.v, x0) ? '.' : ' (not $x$: please report this).')));
        }
        if (fx0.v && !iv.steps && iv.twin) { const tw = iv.twin(x0), ft = fF.ev(tw, Pf); if (ft.v) kids.push(K.p('For example $f(' + xT + ')' + eqv(fx0.v) + '$ and also $f(' + vt(tw) + ')' + eqv(ft.v) + '$: two inputs, one output, so $f^{-1}(' + vt(fx0.v) + ')$ could not choose between them.')); }
        if (Number.isFinite(k) && !flat) kids.push(K.p('<b>Horizontal line test</b> (lecture 5.1): the line $y = ' + fmt(k) + '$ through $A$ meets the graph ' + (hits.length === 1 ? 'once.' : hits.length + ' times, at $x \\approx ' + hits.sort((u, w) => u - w).map(t => fmt(t, 3)).join(',\\ ') + '$.') + (iv.steps ? ' A one-to-one function passes for every horizontal line.' : ' The test fails.')));
        out.append(K.card('The inverse of $f$', ...kids));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- logarithms (week 6) */
    // ?b=2&x=8&y=4&k=3   the base b (> 0, ≠ 1: 2, 10, e, 1/2 …), a number x > 0, a second number y > 0 for the product and
    //   quotient laws, and a power k for the power law (each may be a fraction, a decimal, e, pi or sqrt(…))
    logarithm(el, query, ctx) {
      const s = K.state(ctx, { b: '2', x: '8', y: '4', k: '3' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('$\\log_b x$ is an <b>exponent</b>: the power you raise $b$ to, to get $x$. So $\\log_b$ undoes $b^x$, and its graph is the mirror image of the graph of $b^x$ in the line $y = x$.'),
          numRow({ label: 'Base and number: $\\log_b x$', names: ['$b$', '$x$'], values: [s.v.b, s.v.x], real: true, onChange: ([b, x]) => s.set({ b, x }), help: 'Type <b>e</b> as the base for the natural logarithm $\\ln$.' }),
          numRow({ label: 'For the laws: a second number $y$ and a power $k$', names: ['$y$', '$k$'], values: [s.v.y, s.v.k], real: true, onChange: ([y, k]) => s.set({ y, k }) }),
          tries([
            { label: 'log₂ 32: solve 2ˣ = 2⁵', cite: 'lecture 6.3', v: { b: '2', x: '32', y: '4', k: '3' } },
            { label: 'log₄ 2 = ½', cite: 'lecture 6.2', v: { b: '4', x: '2', y: '8', k: '2' } },
            { label: 'base ¼: a falling graph', cite: 'lecture 6.2', v: { b: '1/4', x: '2', y: '8', k: '2' } },
            { label: 'log₅ 89 by change of base', cite: 'lecture 6.6', v: { b: '5', x: '89', y: '5', k: '2' } },
            { label: 'ln 10', cite: 'lecture 6.2', v: { b: 'e', x: '10', y: '2', k: '3' } },
            { label: 'log₈ 4 = ⅔', v: { b: '8', x: '4', y: '2', k: '3' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        let b, x, y, k;
        try {
          [b, x, y, k] = [s.v.b, s.v.x, s.v.y, s.v.k].map(t => parseReal(t));
          if (!(b.x > 0) || veq(b, ex(1))) throw new Error('The base must be positive and not 1.');
          if (!(x.x > 0) || !(y.x > 0)) throw new Error('Logarithms only take positive numbers: x and y must be greater than 0.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), lg = v => logv(b, v), L = lg(x), LT = u => logOf(b, u), bT = baseTex(b), r = exactLog(b, x);
        const vp = v => { const t = vt(v); return t.startsWith('-') ? '\\mathopen{}\\left(' + t + '\\right)' : t; };
        out.append(K.answer('$' + LT(vt(x)) + '$', LT(vt(x)) + eqv(L), r ? 'Because $' + bT + '^{' + T(r) + '} = ' + vt(x) + '$.' : 'Not a fraction: $' + vt(x) + '$ is not a rational power of $' + vt(b) + '$, so the value is rounded.'));

        // the graph: log_b x and b^x, mirror images in y = x
        const P = [x.x, L.x], small = Math.abs(P[0]) <= 20 && Math.abs(P[1]) <= 20;
        const win = around((small ? [P, [P[1], P[0]]] : []).concat([[-3, -3], [5, 5]]), 3);
        const items = [{ type: 'fn', f: t => x => x, c: 4, dash: true, thin: true, nofit: true }];
        items[0].f = t => t;
        items.push({ type: 'fn', f: t => Math.log(t) / Math.log(b.x), c: 0, from: 1e-9 }, { type: 'fn', f: t => Math.pow(b.x, t), c: 1 });
        items.push({ type: 'pt', x: 1, y: 0, c: 0, r: 3.5, label: '(1, 0)', below: true }, { type: 'pt', x: 0, y: 1, c: 1, r: 3.5, label: '(0, 1)', left: true });
        if (small) items.push({ type: 'pt', x: P[0], y: P[1], c: 0, label: 'P' }, { type: 'pt', x: P[1], y: P[0], c: 1, label: 'P′' }, { type: 'seg', x1: P[0], y1: P[1], x2: P[1], y2: P[0], c: 4, dash: true, thin: true });
        out.append(K.card('The graphs of $' + LT('x') + '$ and $' + bT + '^x$', plot({ x: win.x, y: win.y, equal: true, items, width: W, label: 'log base b of x and b to the x, mirrored in y = x',
          legend: [{ c: 0, text: '$y = ' + LT('x') + '$, through $P = (x, ' + LT('x') + ')$' }, { c: 1, text: '$y = ' + bT + '^x$, through the mirror point $P\'$' }, { c: 4, dash: true, text: '$y = x$' }] }),
          K.p(b.x > 1 ? 'With $b > 1$ both graphs rise. The logarithm crosses the $x$-axis at $x = 1$ (since $b^0 = 1$), is negative for $0 < x < 1$, and has the $y$-axis as a vertical asymptote: only $x > 0$ is allowed.' : 'With $0 < b < 1$ both graphs fall. The logarithm still crosses the $x$-axis at $x = 1$ and only takes $x > 0$.')));

        // a logarithm is an exponent
        const st = [{ text: '$' + LT(vt(x)) + '$ asks: <b>which power of $' + vt(b) + '$ gives $' + vt(x) + '$?</b>', tex: bT + '^{\\,?} = ' + vt(x) }];
        if (r && r.isInt()) st.push({ text: 'It is a whole power of $' + vt(b) + '$:', tex: bT + '^{' + T(r) + '} = ' + vt(x) + ' \\;\\Rightarrow\\; ' + LT(vt(x)) + ' = ' + T(r) });
        else if (r) { const q = Number(r.d), rt = rootFr(b.fr, q); st.push({ text: 'Not a whole power, but a root of one: $b^{p/q}$ is the $q$-th root of $b$, raised to the power $p$.', tex: bT + '^{' + T(r) + '} = \\mathopen{}\\left(\\sqrt[' + q + ']{' + vt(b) + '}\\right)^{' + r.n + '} = ' + par(rt) + '^{' + r.n + '} = ' + vt(x) + ' \\;\\Rightarrow\\; ' + LT(vt(x)) + ' = ' + T(r) }); }
        else {
          const n = Math.floor(L.x + 1e-12), lo = vpow(b, ex(n)), hi = vpow(b, ex(n + 1));
          st.push({ text: 'It is not a whole power: $' + vt(x) + '$ lies between two neighbouring powers of $' + vt(b) + '$, so the logarithm lies between their exponents.', tex: bT + '^{' + n + '} ' + (lo.fr ? '= ' + vt(lo) : '\\approx ' + fmt(lo.x)) + ',\\quad ' + bT + '^{' + (n + 1) + '} ' + (hi.fr ? '= ' + vt(hi) : '\\approx ' + fmt(hi.x)) + ' \\;\\Rightarrow\\; ' + n + ' < ' + LT(vt(x)) + ' < ' + (n + 1) });
          st.push({ text: 'The change of base (below) gives its value:', tex: LT(vt(x)) + ' = \\frac{\\ln ' + sub(x) + '}{\\ln ' + sub(b) + '} \\approx ' + fmt(L.x) });
        }
        out.append(K.card('A logarithm is an exponent', K.steps(st), ok('$' + bT + '^{' + vt(L) + '}' + (r ? ' = ' + vt(vpow(b, ex(r))) : ' \\approx ' + fmt(Math.pow(b.x, L.x))) + '$, which is $x$.')));

        // the laws, on these numbers
        // each law as one chain: the left side worked out, then the right side worked out, then the right side as logs
        const law = (lhs, lv, nums, rv, syms) => lhs + eqv(lv) + (lv.fr && rv.fr ? ' = ' : ' \\approx ') + nums + ' = ' + syms;
        const Ly = lg(y), xy = vmul(x, y), xq = vdiv(x, y), xk = vpow(x, k), same = [];
        const laws = [
          { text: '<b>Product law</b>: multiplying numbers adds their logarithms, because $b^m \\cdot b^n = b^{m+n}$ (lecture 6.4).', tex: law(LT(vt(x) + ' \\cdot ' + vt(y)) + ' = ' + LT(vt(xy)), lg(xy), vt(L) + ' + ' + vp(Ly), vadd(L, Ly), LT(vt(x)) + ' + ' + LT(vt(y))) },
          { text: '<b>Quotient law</b>: dividing subtracts them.', tex: law(LT('\\frac{' + vt(x) + '}{' + vt(y) + '}') + ' = ' + LT(vt(xq)), lg(xq), vt(L) + ' - ' + vp(Ly), vsub(L, Ly), LT(vt(x)) + ' - ' + LT(vt(y))) },
        ];
        same.push(veq(lg(xy), vadd(L, Ly)), veq(lg(xq), vsub(L, Ly)));
        if (Number.isFinite(xk.x) && xk.x > 0 && xk.x < 1e300) {
          laws.push({ text: '<b>Power law</b>: a power comes down in front, because $(b^m)^k = b^{mk}$.', tex: law(LT(wrapPow(vt(x)) + '^{' + vt(k) + '}') + ' = ' + LT(vt(xk)), lg(xk), sub(k) + ' \\cdot ' + vp(L), vmul(k, L), sub(k) + ' \\cdot ' + LT(vt(x))) });
          same.push(veq(lg(xk), vmul(k, L)));
        }
        const wrong = lg(vadd(x, y));
        out.append(K.card('The laws, on your numbers', K.steps(laws),
          ok(same.every(Boolean) ? 'in each law both sides come to the same number.' : 'the two sides differ (please report this).'),
          K.note('A common mistake (lecture 6.5): $' + LT('x + y') + '$ is <b>not</b> $' + LT('x') + ' + ' + LT('y') + '$. Here $' + LT(vt(vadd(x, y))) + eqv(wrong) + '$, while $' + LT(vt(x)) + ' + ' + LT(vt(y)) + eqv(vadd(L, Ly)) + '$.')));

        // change of base
        out.append(K.card('Change of base', K.steps([
          { text: 'Any logarithm is a ratio of logarithms to one fixed base (lecture 6.6), so a calculator with $\\ln$ is enough:', tex: LT(vt(x)) + ' = \\frac{\\ln ' + sub(x) + '}{\\ln ' + sub(b) + '} \\approx \\frac{' + fmt(Math.log(x.x)) + '}{' + fmt(Math.log(b.x)) + '} \\approx ' + fmt(Math.log(x.x) / Math.log(b.x)) },
          { text: 'With $\\log_{10}$ instead, the same number comes out:', tex: LT(vt(x)) + ' = \\frac{\\log_{10} ' + sub(x) + '}{\\log_{10} ' + sub(b) + '} \\approx \\frac{' + fmt(Math.log10(x.x)) + '}{' + fmt(Math.log10(b.x)) + '} \\approx ' + fmt(Math.log10(x.x) / Math.log10(b.x)) },
        ])));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- limits and continuity (week 7) */
    // ?f=hole&a=2   f: square, hole, floor, recip, recip2, sinc, cosq, sign, moved, sin1x (the menu LIMF above);
    //   a: the point (a number, a fraction, pi/2 …)
    limit(el, query, ctx) {
      const s = K.state(ctx, { f: 'hole', a: '2' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('A <b>limit</b> asks what $f(x)$ gets close to as $x$ gets close to $a$, from the left and from the right, whatever happens at $a$ itself. $f$ is <b>continuous</b> at $a$ when that limit exists and equals $f(a)$.'),
          K.select({ label: 'The function', value: s.v.f, options: Object.keys(LIMF).map(id => [id, LIMF[id].name]), onChange: v => s.set({ f: v }) }),
          numRow({ label: 'The point', names: ['$a$'], values: [s.v.a], real: true, onChange: v => s.set({ a: v[0] }) }),
          tries([
            { label: '⌊x⌋ at 2', cite: 'lecture 7.5', v: { f: 'floor', a: '2' } },
            { label: '(x² − 5x + 6)/(x − 2) at 2', cite: 'lecture 7.5', v: { f: 'hole', a: '2' } },
            { label: 'x² at 3', cite: 'lecture 7.5', v: { f: 'square', a: '3' } },
            { label: '1/x at 0', cite: 'lecture 7.6', v: { f: 'recip', a: '0' } },
            { label: 'sin x / x at 0', cite: 'lecture 7.6', v: { f: 'sinc', a: '0' } },
            { label: '(1 − cos x)/x² at 0', cite: 'lecture 7.6', v: { f: 'cosq', a: '0' } },
            { label: '|x|/x at 0: a jump', v: { f: 'sign', a: '0' } },
            { label: 'x², but f(1) = 3', v: { f: 'moved', a: '1' } },
            { label: 'sin(1/x) at 0', v: { f: 'sin1x', a: '0' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        const fn = LIMF[s.v.f] || LIMF.hole;
        let a;
        try { a = parseReal(s.v.a); if (Math.abs(a.x) > 1e6) throw new Error('Keep a between −1000000 and 1000000.'); } catch (e) { bad(out, e); return; }
        const W = track(out, draw), A = fn.at(a), aT = vt(a), limT = '\\lim_{x \\to ' + aT + '} f(x)';
        const side = o => (o.v ? vd(o.v) : o.inf ? (o.inf > 0 ? '+\\infty' : '-\\infty') : '\\text{none: no single value}');
        const both = A.L.v && A.R.v && veq(A.L.v, A.R.v) ? A.L.v : null;
        const c1 = !!A.val, c2 = !!both, c3 = c1 && c2 && veq(A.val, both);
        const kind = c3 ? '' : c2 ? (c1 ? '<b>removable</b>: the limit exists, but $f(a)$ is a different number (a moved point)' : '<b>removable</b>: the limit exists, but $f(a)$ is not defined (a hole)') : A.L.inf || A.R.inf ? '<b>infinite</b>: the function blows up (a vertical asymptote)' : A.L.osc ? '<b>oscillating</b>: the values never settle' : 'a <b>jump</b>: the two one-sided limits differ';
        const ans = both ? limT + ' = ' + vd(both) : A.L.inf && A.L.inf === A.R.inf ? 'f(x) \\to ' + (A.L.inf > 0 ? '+' : '-') + '\\infty\\ \\text{from both sides}' : limT + '\\ \\text{does not exist}';
        out.append(K.answer('$f(x) = ' + fn.tex + '$ as $x \\to ' + aT + '$', ans, c3 ? '$f$ is <b>continuous</b> at $' + aT + '$.' : '$f$ is <b>not continuous</b> at $' + aT + '$: ' + kind + '.'));

        // the graph near a
        const half = fn.half || 3, x0 = a.x - half, x1 = a.x + half, inf = A.L.inf || A.R.inf || A.L.osc;
        const items = [{ type: 'vline', x: a.x, c: 4, dash: true, thin: true }, { type: 'fn', f: fn.f, c: 0, breaks: fn.breaks ? fn.breaks(x0, x1) : null, n: fn.n }];
        if (A.L.v) items.push({ type: 'pt', x: a.x, y: A.L.v.x, c: 0, open: !(A.val && veq(A.val, A.L.v)) });
        if (A.R.v && !(A.L.v && veq(A.L.v, A.R.v))) items.push({ type: 'pt', x: a.x, y: A.R.v.x, c: 0, open: !(A.val && veq(A.val, A.R.v)) });
        if (A.val && !(A.L.v && veq(A.val, A.L.v)) && !(A.R.v && veq(A.val, A.R.v))) items.push({ type: 'pt', x: a.x, y: A.val.x, c: 3, label: 'f(a)' });
        out.append(K.card('The graph near $x = ' + aT + '$', plot({ x: [x0, x1], y: inf && fn.yr ? fn.yr : null, items, width: W, label: 'The graph of f near a',
          legend: [{ c: 0, text: '$y = ' + fn.tex + '$; an open circle is a value $f$ gets close to but does not take' }, { c: 4, dash: true, text: '$x = ' + aT + '$' }] })));

        // the one-sided limits
        const st = A.whyL ? [
          { text: 'From the left, $x < ' + aT + '$: ' + A.whyL, tex: '\\lim_{x \\to ' + aT + '^-} f(x) = ' + side(A.L) },
          { text: 'From the right, $x > ' + aT + '$: ' + A.whyR, tex: '\\lim_{x \\to ' + aT + '^+} f(x) = ' + side(A.R) },
        ] : [{ text: '<b>From both sides.</b> ' + A.why, tex: '\\lim_{x \\to ' + aT + '^-} f(x) = ' + side(A.L) + ',\\qquad \\lim_{x \\to ' + aT + '^+} f(x) = ' + side(A.R) }];
        st.push({ text: both ? 'Both sides agree, so the limit exists (lecture 7.5):' : A.L.osc ? 'Neither side settles on one value, so the limit does not exist:' : A.L.inf && A.L.inf === A.R.inf ? 'Both sides grow without bound: the limit is not a number, so it does not exist (we write $\\to \\infty$ for how it fails).' : 'The two sides do not agree, so the (two-sided) limit does not exist:', tex: ans });
        const hs = [0.1, 0.01, 0.001, 0.0001, 0.00001];
        out.append(K.card('From the left and from the right', K.steps(st),
          K.p('Values of $f$ as $x$ closes in on $' + aT + '$ (the table never uses $x = a$ itself):'),
          K.table(['$h$', '$a - h$', '$f(a - h)$', '$a + h$', '$f(a + h)$'], hs.map(hv => ['$' + fmt(hv, 6) + '$', '$' + fmt(a.x - hv, 7) + '$', '$' + fmt(fn.f(a.x - hv), 6) + '$', '$' + fmt(a.x + hv, 7) + '$', '$' + fmt(fn.f(a.x + hv), 6) + '$']))));

        // continuity
        const mark = good => (good ? '\\quad \\checkmark' : '\\quad \\times');
        out.append(K.card('Continuity: three conditions', K.steps([
          { text: 'Is $f(a)$ defined?' + (A.wv ? ' ' + A.wv : ''), tex: (A.val ? 'f\\mathopen{}\\left(' + aT + '\\right) = ' + vd(A.val) : 'f\\mathopen{}\\left(' + aT + '\\right)\\ \\text{is not defined}') + mark(c1) },
          { text: 'Does the limit exist?', tex: ans + mark(c2) },
          { text: 'Is the limit equal to $f(a)$?', tex: (c1 && c2 ? vd(both) + (c3 ? ' = ' : ' \\ne ') + vd(A.val) : '\\text{cannot hold: a condition above fails}') + mark(c3) },
        ]), K.p(c3 ? 'All three hold, so $f$ is <b>continuous</b> at $' + aT + '$: near $a$ its graph can be drawn without lifting the pen (lecture 7.6).' : 'A condition fails, so $f$ is not continuous at $' + aT + '$. The break is ' + kind + '.')));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- the derivative and the tangent (week 8) */
    // ?f=poly&p=x^3  f: poly, sin, cos, tan, exp, ln, sqrt, cbrt, recip, xnsin, tankx, xtan, abs (the menu DF above);
    //   p: the polynomial when f=poly (degree up to 6)  &k=2  n of xⁿ·sin x (a whole number 1–9) or k of tan(kx)
    //   &a=1 (the point)  &x1=1.1 (a nearby x for the chord and the linear approximation). a, k and x1 may be fractions,
    //   decimals, pi/3 …
    derivative(el, query, ctx) {
      const s = K.state(ctx, { f: 'poly', p: 'x^3', k: '2', a: '1', x1: '1.1' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        const id = DF[s.v.f] ? s.v.f : 'poly';
        controls.append(
          K.p('The <b>derivative</b> $f\'(a)$ is the slope of the graph at $x = a$: the limit of the slopes $\\frac{f(a + h) - f(a)}{h}$ of ever shorter chords. The line through $(a, f(a))$ with that slope is the <b>tangent</b>, and near $a$ it is a good stand-in for $f$.'),
          K.select({ label: 'The function', value: id, options: Object.keys(DF).map(k => [k, DF[k].name]), onChange: v => { s.set({ f: v }); build(); } }));
        if (id === 'poly') controls.append(exprField({ label: '$f(x) =$', value: s.v.p, parse: t => parsePoly(t, 6), onChange: v => s.set({ p: v }), help: 'A polynomial up to degree 6, any form.' }));
        if (id === 'xnsin') controls.append(K.int({ label: 'The power $n$ in $x^n \\sin x$', value: Math.max(1, Math.min(9, Math.round(+s.v.k) || 1)), min: 1, max: 9, onChange: v => s.set({ k: String(v) }) }));
        if (id === 'tankx') controls.append(numRow({ label: 'The number $k$ in $\\tan(kx)$', names: ['$k$'], values: [s.v.k], real: true, onChange: v => s.set({ k: v[0] }) }));
        controls.append(
          numRow({ label: 'The point $a$, and a nearby $x$', names: ['$a$', '$x$'], values: [s.v.a, s.v.x1], real: true, onChange: ([a, x1]) => s.set({ a, x1 }) }),
          tries([
            { label: 'x³ at 1, near x = 1.1', cite: 'lecture 8.3', v: { f: 'poly', p: 'x^3', a: '1', x1: '1.1' } },
            { label: 'cos x at π/3', cite: 'lecture 8.3', v: { f: 'cos', a: 'pi/3', x1: '1.1' } },
            { label: 'x tan x at π/4', cite: 'lecture 8.3', v: { f: 'xtan', a: 'pi/4', x1: '0.8' } },
            { label: '∛x at 0: a vertical tangent', cite: 'lecture 8.3', v: { f: 'cbrt', a: '0', x1: '0.5' } },
            { label: 'x⁷ sin x: the product rule', cite: 'lecture 8.2', v: { f: 'xnsin', k: '7', a: '1', x1: '1.05' } },
            { label: 'tan 2x: the chain rule', cite: 'lecture 8.2', v: { f: 'tankx', k: '2', a: '0', x1: '0.1' } },
            { label: '√x at 4: estimate √4.1', v: { f: 'sqrt', a: '4', x1: '4.1' } },
            { label: '|x| at 0: a corner', v: { f: 'abs', a: '0', x1: '0.5' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        const id = DF[s.v.f] ? s.v.f : 'poly', D = DF[id];
        let a, x1, p = null, kk = null;
        try {
          a = parseReal(s.v.a); x1 = parseReal(s.v.x1);
          if (id === 'poly') p = parsePoly(s.v.p, 6);
          if (id === 'xnsin') { kk = Math.round(+s.v.k); if (!(kk >= 1 && kk <= 9)) throw new Error('n must be a whole number from 1 to 9.'); }
          if (id === 'tankx') { kk = parseReal(s.v.k); if (isZ(kk)) throw new Error('With k = 0, tan(0x) = 0 is flat. Choose k ≠ 0.'); }
          if (Math.abs(a.x) > 1e4 || Math.abs(x1.x) > 1e4) throw new Error('Keep a and x between −10000 and 10000.');
          if (veq(a, x1)) throw new Error('Pick the nearby x different from a.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), poly = id === 'poly', exact = poly && !!a.fr, aT = vt(a);
        const fN = poly ? pfn(p) : D.f(kk), dN = poly ? pfn(pder(p)) : D.d(kk), dom = poly || !D.dom ? () => true : D.dom(kk), diff = poly || !D.diff ? dom : D.diff(kk);
        const ftex = poly ? ptex(p) : D.tex(kk);
        if (!dom(a.x) || !Number.isFinite(fN(a.x))) { out.append(K.note('$f(x) = ' + ftex + '$ is not defined at $x = ' + aT + '$, so it has no slope there. ' + (D.why ? D.why + ' ' : '') + 'Pick another $a$.', 'warn')); return; }
        const fa = exact ? ex(pev(p, a.fr)) : ap(fN(a.x), poly ? null : D.fAt(aT, kk)), can = diff(a.x) && Number.isFinite(dN(a.x));
        const da = can ? (exact ? ex(pev(pder(p), a.fr)) : ap(dN(a.x), poly ? null : D.dAt(aT, kk))) : null;
        const tl = can ? (exact ? { m: da.fr, c: fa.fr.sub(da.fr.mul(a.fr)) } : null) : null;
        const lineNum = (m, c) => (Math.abs(m) < 1e-12 ? fmt(c) : (fmt(m) === '1' ? '' : fmt(m) === '-1' ? '-' : fmt(m)) + 'x' + (Math.abs(c) < 1e-12 ? '' : c > 0 ? ' + ' + fmt(c) : ' - ' + fmt(-c)));
        const tangentTex = can ? (tl ? 'y = ' + linTex([[tl.m, 'x'], [tl.c, '']]) : 'y \\approx ' + lineNum(da.x, fa.x - da.x * a.x)) : null;
        out.append(K.answer('$f(x) = ' + ftex + '$ at $a = ' + aT + '$', can ? "f'(" + aT + ')' + eqv(da) + ',\\qquad \\text{tangent } ' + tangentTex : "f'(" + aT + ')\\ \\text{does not exist}', can ? 'The slope of the graph at $x = ' + aT + '$, and the line that touches it there.' : D.nodiff));

        // the picture: f, the tangent, the chord to x
        const w = Math.max(1.2, 3 * Math.abs(x1.x - a.x)), X0 = a.x - w, X1 = a.x + w, f1n = fN(x1.x), right = x1.x > a.x;
        const items = [{ type: 'fn', f: fN, c: 0, breaks: D.breaks ? D.breaks(kk)(X0, X1) : null }];
        if (can) items.push({ type: 'fn', f: t => fa.x + da.x * (t - a.x), c: 1, nofit: true });
        else if (id === 'sqrt' || id === 'cbrt') items.push({ type: 'vline', x: a.x, c: 1 });
        if (Number.isFinite(f1n)) items.push({ type: 'seg', x1: a.x, y1: fa.x, x2: x1.x, y2: f1n, c: 2, dash: true, thin: true, nofit: true }, { type: 'pt', x: x1.x, y: f1n, c: 2, label: 'B', left: !right, below: true });
        items.push({ type: 'pt', x: a.x, y: fa.x, c: 3, label: 'A', left: right });
        if (can && Number.isFinite(f1n)) items.push({ type: 'pt', x: x1.x, y: fa.x + da.x * (x1.x - a.x), c: 1, r: 3.5, fit: false });
        out.append(K.card('The tangent and a chord', plot({ x: [X0, X1], items, width: W, label: 'The graph of f with its tangent at a',
          legend: [{ c: 0, text: '$y = ' + ftex + '$' }].concat(can ? [{ c: 1, text: 'the tangent at $A$, slope $f\'(a)$' }] : id === 'sqrt' || id === 'cbrt' ? [{ c: 1, text: 'the vertical tangent $x = ' + aT + '$' }] : [], Number.isFinite(f1n) ? [{ c: 2, dash: true, text: 'the chord from $A$ to $B$, slope $\\frac{f(x) - f(a)}{x - a}$' }] : []) })));

        // the difference quotient
        const rows = [], hs = [1, 0.1, 0.01, 0.001, 0.0001];
        for (const g of [1, -1]) for (const hv of hs) {
          const h1 = g * hv;
          if (exact) { const hq = F.parse(String(h1)), fah = pev(p, a.fr.add(hq)); rows.push(['$' + h1 + '$', '$' + dec(fah) + '$', '$' + dec(fah.sub(fa.fr).div(hq)) + '$']); }
          else { const v = fN(a.x + h1), q = (v - fa.x) / h1; rows.push(['$' + h1 + '$', '$' + (Number.isFinite(v) ? fmt(v, 8) : '\\text{undefined}') + '$', '$' + (Number.isFinite(q) ? fmt(q, 8) : '\\text{undefined}') + '$']); }
        }
        const dqKids = [K.p('The chord from $(a, f(a))$ to $(a + h, f(a + h))$ has slope $\\frac{f(a + h) - f(a)}{h}$, the <b>difference quotient</b>. Shrink $h$ from both sides:'),
          K.table(['$h$', '$f(a + h)$', '$\\frac{f(a + h) - f(a)}{h}$'], rows), K.p(can ? 'The quotients close in on one number from both sides: that limit is $f\'(' + aT + ')' + eqv(da) + '$.' : D.nodiff)];
        if (exact) {
          const sh = pshift(p, a.fr), dq = ptrim(sh.slice(1).length ? sh.slice(1) : [F(0)]);
          dqKids.push(K.steps([
            { text: 'The same limit by algebra. Expand $f(a + h)$ in powers of $h$:', tex: 'f\\mathopen{}\\left(' + aT + ' + h\\right) = ' + ptex(sh, 'h') },
            { text: 'Take away $f(' + aT + ') = ' + T(fa.fr) + '$: every term left has a factor $h$.', tex: 'f\\mathopen{}\\left(' + aT + ' + h\\right) - f\\mathopen{}\\left(' + aT + '\\right) = ' + ptex(padd(sh, [fa.fr.neg()]), 'h') },
            { text: 'Divide by $h$ (allowed, since $h \\ne 0$):', tex: '\\frac{f(' + aT + ' + h) - f(' + aT + ')}{h} = ' + ptex(dq, 'h') },
            { text: 'Let $h \\to 0$: every term with an $h$ vanishes.', tex: "f'(" + aT + ') = \\lim_{h \\to 0}\\mathopen{}\\left(' + ptex(dq, 'h') + '\\right) = ' + T(dq[0]) },
          ]));
        }
        out.append(K.card('The slope as a limit', ...dqKids));

        // the derivative by the rules
        const rs = [];
        if (poly) {
          // one chain: each term's derivative by the power rule (number in front × power × x to one less), then tidied
          const parts = [];
          for (let j = p.length - 1; j >= 0; j--) {
            const c = p[j];
            if (c.isZero()) continue;
            const body = j === 0 ? '0' : j === 1 ? T(fabs(c)) : (fabs(c).eq(1) ? '' : T(fabs(c)) + ' \\cdot ') + j + xpow(j - 1);
            parts.push((parts.length ? (neg(c) && j > 0 ? ' - ' : ' + ') : neg(c) && j > 0 ? '-' : '') + body);
          }
          rs.push({ text: 'The <b>sum rule</b> lets us take one term at a time, the <b>constant multiple rule</b> keeps each number in front, and the <b>power rule</b> $\\frac{d}{dx}x^n = nx^{n-1}$ does each power; a constant term has slope $0$ (lecture 8.2).', tex: "f'(x) = " + parts.join('') + (sameTex(parts.join(''), ptex(pder(p))) ? '' : ' = ' + ptex(pder(p))) });
        } else {
          D.rules(kk).forEach(o => rs.push(o));
          rs.push({ text: 'In short:', tex: "f'(x) = " + D.dtex(kk) });
        }
        if (can) {
          let at = "f'(" + aT + ') = ';
          if (exact) { const dp = pder(p), parts = []; for (let j = dp.length - 1; j >= 0; j--) { const c = dp[j]; if (c.isZero()) continue; const body = j === 0 ? T(fabs(c)) : (fabs(c).eq(1) ? '' : T(fabs(c)) + ' \\cdot ') + par(a.fr) + (j > 1 ? '^{' + j + '}' : ''); parts.push((parts.length ? (neg(c) ? ' - ' : ' + ') : neg(c) ? '-' : '') + body); } at += (parts.join('') || '0') + ' = ' + TD(da.fr); }
          else at += poly ? '\\approx ' + fmt(da.x) : D.dAt(aT, kk) + ' \\approx ' + fmt(da.x);
          rs.push({ text: 'At $x = ' + aT + '$:', tex: at });
        }
        out.append(K.card('The derivative by the rules', K.steps(rs), can ? null : K.note(D.nodiff)));

        if (!can) return;
        // the tangent and the linear approximation
        const fx1 = exact && x1.fr ? ex(pev(p, x1.fr)) : ap(fN(x1.x), poly ? null : D.fAt(vt(x1), kk));
        const dx = vsub(x1, a), L1 = vadd(fa, vmul(da, dx)), err = vsub(fx1, L1);
        out.append(K.card('The tangent line', K.steps([
          { text: 'The tangent at $A = (a, f(a))$ has slope $f\'(a)$. By the point-slope form, $y = f(a) + f\'(a)(x - a)$ (lecture 8.3):', tex: 'y = ' + vt(fa) + ' + ' + sub(da) + '\\mathopen{}\\left(' + cadd('x', vneg(a)) + '\\right)' },
          { text: 'Open the bracket:', tex: tangentTex },
        ])));
        if (!Number.isFinite(fx1.x)) { out.append(K.note('$f$ is not defined at $x = ' + vt(x1) + '$, so there is nothing to approximate there. Pick another nearby $x$.', 'warn')); return; }
        const mid = vadd(a, vdiv(dx, ex(2))), fm = exact && mid.fr ? ex(pev(p, mid.fr)) : ap(fN(mid.x)), em = vsub(fm, vadd(fa, vmul(da, vdiv(dx, ex(2)))));
        out.append(K.card('Linear approximation near $a$', K.steps([
          { text: 'Near $a$ the tangent hugs the curve, so use it in place of $f$: the <b>linear approximation</b> $L(x) = f(a) + f\'(a)(x - a)$ (lecture 8.3).', tex: 'L\\mathopen{}\\left(' + vt(x1) + '\\right) = ' + vt(fa) + ' + ' + sub(da) + ' \\cdot ' + sub(dx) + eqv(L1) },
          { text: 'The true value:', tex: 'f\\mathopen{}\\left(' + vt(x1) + '\\right)' + eqv(fx1) },
          { text: 'The <b>error</b> is what the tangent misses:', tex: 'f\\mathopen{}\\left(' + vt(x1) + '\\right) - L\\mathopen{}\\left(' + vt(x1) + '\\right)' + eqv(err) + (isZ(fx1) ? '' : '\\quad (' + fmt((100 * Math.abs(err.x)) / Math.abs(fx1.x), 3) + '\\%\\ \\text{of } f)') },
        ]), isZ(err) && isZ(em) ? K.p('$f$ is a straight line here, so its tangent is $f$ itself and the error is $0$.') : ok('halfway, at $x = ' + vt(mid) + '$, the error is $' + fmt(em.x, 6) + '$: about $\\frac{1}{' + fmt(err.x / em.x, 1) + '}$ of the error at $x = ' + vt(x1) + '$. Halving the distance to $a$ cuts the error about four times: it shrinks like $(x - a)^2$.')));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- maxima and minima (week 8) */
    // ?p=x^3-12x   a polynomial of degree 1 to 6 (any form)
    extrema(el, query, ctx) {
      const s = K.state(ctx, { p: 'x^3-12x' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('Where a smooth graph turns, its tangent is flat: $f\'(x) = 0$. Solving that gives the <b>critical points</b>; the sign of $f\'$ on each side, or the sign of $f\'\'$ at the point, tells a maximum from a minimum.'),
          exprField({ label: '$f(x) =$', value: s.v.p, parse: t => parsePoly(t, 6), onChange: v => s.set({ p: v }), help: 'A polynomial up to degree 6, any form: $x^3 - 12x$, $(x^2 - 1)^2$.' }),
          tries([
            { label: 'x³ − 12x', cite: 'lecture 8.5', v: { p: 'x^3-12x' } },
            { label: 'x³ + x² − x + 5', cite: 'lecture 8.5', v: { p: 'x^3+x^2-x+5' } },
            { label: 'x⁴: the second test fails', cite: 'lecture 8.5', v: { p: 'x^4' } },
            { label: '(x² − 4x + 3.8)(x + 2)x³', cite: 'lecture 8.4', v: { p: '(x^2-4x+3.8)(x+2)x^3' } },
            { label: 'x³: flat, but no turn', v: { p: 'x^3' } },
            { label: '3x⁴ − 4x³', v: { p: '3x^4-4x^3' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        let p;
        try {
          p = parsePoly(s.v.p, 6);
          if (pdeg(p) < 1) throw new Error('f is a constant: its slope is 0 everywhere, so every point is critical and none is a turn. Type a polynomial with x in it.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), dp = pder(p), ddp = pder(dp), f = pfn(p), d1 = pfn(dp), d2 = pfn(ddp), ft = ptex(p);
        const sol = solvePoly(dp), cs = sol.roots;
        const fv = c => (c.fr ? ex(pev(p, c.fr)) : ap(f(c.x)));
        const f2 = c => (c.m >= 2 ? ex(0) : c.fr ? ex(pev(ddp, c.fr)) : ap(d2(c.x)));
        const ctex = c => (c.fr ? T(c.fr) : c.tex || fmt(c.x, 4));
        const cuts = [-Infinity, ...cs.map(c => c.x), Infinity];
        const tests = cuts.slice(0, -1).map((lo, j) => between(lo, cuts[j + 1]));
        const sg = tests.map(t => pev(dp, t).cmp(0));
        const kinds = cs.map((c, j) => (sg[j] > 0 && sg[j + 1] < 0 ? 'max' : sg[j] < 0 && sg[j + 1] > 0 ? 'min' : 'flat'));
        const word = { max: 'local maximum', min: 'local minimum', flat: 'neither (a flat point)' };
        const named = cs.map((c, j) => '\\text{' + (kinds[j] === 'flat' ? 'flat' : 'local ' + kinds[j]) + ' at } x ' + (c.fr || c.tex ? '= ' : '\\approx ') + ctex(c));
        out.append(K.answer('Turning points of $f(x) = ' + ft + '$', cs.length ? named.join(',\\quad ') : '\\text{no critical points}', cs.length ? cs.map((c, j) => '$f(' + ctex(c) + ')' + eqv(fv(c)) + '$' + (kinds[j] === 'flat' ? ' (no turn)' : ' (' + kinds[j] + ')')).join(', ') + '.' : 'The slope never reaches $0$, so the graph never turns.'));

        // the pictures: f with its critical points, and f′
        const xs = cs.map(c => c.x);
        let lo = xs.length ? Math.min(...xs) : -2, hi = xs.length ? Math.max(...xs) : 2;
        const pad = Math.max(1.2, (hi - lo) * 0.4);
        lo -= pad; hi += pad;
        let yr = null;
        if (cs.length) { const vals = xs.map(f), a0 = Math.min(...vals), b0 = Math.max(...vals), sp = Math.max(b0 - a0, 1); yr = [a0 - 0.6 * sp, b0 + 0.6 * sp]; }
        const items = [{ type: 'fn', f, c: 0 }].concat(cs.map((c, j) => ({ type: 'pt', x: c.x, y: f(c.x), c: kinds[j] === 'max' ? 3 : kinds[j] === 'min' ? 2 : 4, label: kinds[j], below: kinds[j] === 'min' })));
        const items2 = [{ type: 'fn', f: d1, c: 1 }].concat(cs.map(c => ({ type: 'pt', x: c.x, y: 0, c: 1, r: 3.5 })));
        out.append(K.card('The graphs of $f$ and $f\'$',
          plot({ x: [lo, hi], y: yr, items, width: W, label: 'The graph of f with its critical points', legend: [{ c: 0, text: '$y = f(x)$, critical points marked' }] }),
          plot({ x: [lo, hi], items: items2, width: W, ratio: 0.5, label: 'The graph of f prime', legend: [{ c: 1, text: '$y = f\'(x) = ' + ptex(dp) + '$: above the axis $f$ rises, below it $f$ falls' }] })));

        // critical points
        const st = [{ text: 'Differentiate with the power rule, term by term (week 8):', tex: "f'(x) = " + ptex(dp) }];
        const dd = pdeg(dp);
        if (dd < 1) st.push({ text: '$f\'(x) = ' + T(dp[0]) + '$ is never $0$: $f$ is a straight line, always ' + (neg(dp[0]) ? 'falling' : 'rising') + ', with no critical points.' });
        else if (dd === 1) st.push({ text: 'Set it to $0$ and solve:', tex: ptex(dp) + ' = 0 \\;\\Rightarrow\\; x = ' + TD(cs[0].fr) });
        else if (dd === 2) {
          const [C0, B0, A0] = dp, Dd = B0.mul(B0).sub(A0.mul(C0).mul(4));
          if (B0.isZero() && !neg(C0.neg().div(A0))) st.push({ text: 'Set it to $0$: there is no $x$ term, so solve for $x^2$ and take both square roots:', tex: ptex(dp) + ' = 0 \\;\\Rightarrow\\; x^2 = ' + T(C0.neg().div(A0)) + ' \\;\\Rightarrow\\; ' + (cs.length > 1 ? 'x = \\pm ' + ctex(cs[1]) : 'x = 0') });
          else {
            st.push({ text: 'Set it to $0$: a quadratic, so use $D = b^2 - 4ac$ and the formula:', tex: 'D = ' + sqp(B0) + ' - 4 \\cdot ' + par(A0) + ' \\cdot ' + par(C0) + ' = ' + T(Dd) });
            st.push(neg(Dd) ? { text: '$D < 0$: $f\'(x) = 0$ has no real solution, so there are no critical points.' } : { text: Dd.isZero() ? '$D = 0$: one solution.' : 'Two solutions:', tex: 'x = \\frac{' + T(B0.neg()) + ' \\pm \\sqrt{' + T(Dd) + '}}{' + T(A0.mul(2)) + '} \\;\\Rightarrow\\; ' + cs.map(c => 'x' + req(c)).join(',\\quad ') });
          }
        } else zeroSteps(dp, sol, "f'").forEach(o => st.push(o));
        if (cs.length) st.push({ text: 'The critical points, with the height of the graph at each:', tex: cs.map(c => 'f\\mathopen{}\\left(' + ctex(c) + '\\right)' + eqv(fv(c))).join(',\\quad ') });
        out.append(K.card('Critical points: solve $f\'(x) = 0$', K.steps(st)));
        if (!cs.length) return;

        // the sign chart of f′
        const ends = j => (j === 0 ? '-\\infty' : ctex(cs[j - 1])), ende = j => (j === cs.length ? '\\infty' : ctex(cs[j]));
        const rows = tests.map((t, j) => ['$(' + ends(j) + ',\\ ' + ende(j) + ')$', '$' + T(t) + '$', '$' + TD(pev(dp, t)) + '$', sg[j] > 0 ? '$+$' : '$-$', sg[j] > 0 ? 'rises' : 'falls']);
        out.append(K.card('The sign chart of $f\'$', K.p('Between two neighbouring critical points $f\'$ keeps one sign, since to change sign it would have to pass through $0$. So one test point in each interval tells the sign there:'),
          K.table(['interval', 'test $x$', '$f\'(x)$', 'sign', '$f$'], rows),
          K.steps(cs.map((c, j) => ({ text: 'At $x = ' + ctex(c) + '$, $f\'$ goes from $' + (sg[j] > 0 ? '+' : '-') + '$ to $' + (sg[j + 1] > 0 ? '+' : '-') + '$: ' + (kinds[j] === 'max' ? 'the graph rises then falls, a <b>local maximum</b>.' : kinds[j] === 'min' ? 'the graph falls then rises, a <b>local minimum</b>.' : 'no change of direction, so <b>neither</b>: the graph only flattens for a moment.'), tex: 'f\\mathopen{}\\left(' + ctex(c) + '\\right)' + eqv(fv(c)) })))));

        // the second derivative test
        const res = cs.map(c => f2(c)), verdict = res.map(v => (vsign(v) < 0 ? 'max' : vsign(v) > 0 ? 'min' : null));
        const agree = verdict.every((v, j) => v == null || v === kinds[j]);
        out.append(K.card('The second-derivative test', K.steps([
          { text: '$f\'\'$ is the slope of $f\'$. If $f\'\'(c) < 0$ at a critical point, the graph bends down there (a cap): a maximum. If $f\'\'(c) > 0$ it bends up (a cup): a minimum. If $f\'\'(c) = 0$ the test says nothing (lecture 8.4).', tex: "f''(x) = " + ptex(ddp) },
        ].concat(cs.map((c, j) => ({ text: 'At $x = ' + ctex(c) + '$: ' + (verdict[j] === 'max' ? 'negative, so a <b>local maximum</b>.' : verdict[j] === 'min' ? 'positive, so a <b>local minimum</b>.' : 'zero, so the test fails; the sign chart above decides: ' + word[kinds[j]] + '.'), tex: "f''\\mathopen{}\\left(" + ctex(c) + '\\right)' + eqv(res[j]) })))),
        ok(agree ? 'wherever the second-derivative test gives an answer, it agrees with the sign chart.' : 'the two tests disagree (please report this).')));
      }
      build();
      draw();
    },

    /* ---------------------------------------------------------------- area and the integral (week 9) */
    // ?p=x^2 (a polynomial, degree up to 6) &a=0&b=1 (the interval, a < b: whole numbers, fractions or decimals)
    //   &n=4 (rectangles, 1–50) &rule=left|right|mid (where each rectangle takes its height; drawn and listed)
    integral(el, query, ctx) {
      const s = K.state(ctx, { p: 'x^2', a: '0', b: '1', n: 4, rule: 'left' }, query, draw);
      const { controls, out } = lay(el);
      const pick = v => { s.set(v); build(); };
      function build() {
        controls.innerHTML = '';
        controls.append(
          K.p('The area under a curve can be filled with thin rectangles. Their total, a <b>Riemann sum</b>, closes in on the <b>integral</b> as they get thinner, and an antiderivative gives that exact value at once.'),
          exprField({ label: '$f(x) =$', value: s.v.p, parse: t => parsePoly(t, 6), onChange: v => s.set({ p: v }), help: 'A polynomial up to degree 6, any form.' }),
          numRow({ label: 'From $a$ to $b$', names: ['$a$', '$b$'], values: [s.v.a, s.v.b], onChange: ([a, b]) => s.set({ a, b }) }),
          K.int({ label: 'Rectangles $n$', value: Math.max(1, Math.min(50, Math.round(+s.v.n) || 4)), min: 1, max: 50, onChange: v => s.set({ n: v }) }),
          K.seg({ label: 'Each rectangle’s height is $f$ at the strip’s', options: [['left', 'Left end'], ['right', 'Right end'], ['mid', 'Midpoint']], value: s.v.rule, onChange: v => s.set({ rule: v }) }),
          tries([
            { label: '2x − 1 on [1, 2], left ends', cite: 'lecture 9.2', v: { p: '2x-1', a: '1', b: '2', n: 4, rule: 'left' } },
            { label: 'x² − 4x + 2 on [1, 3]', cite: 'lecture 9.4', v: { p: 'x^2-4x+2', a: '1', b: '3', n: 8, rule: 'mid' } },
            { label: 'x² on [0, 1]', v: { p: 'x^2', a: '0', b: '1', n: 4, rule: 'right' } },
            { label: 'x³ on [−1, 2]: area below counts negative', v: { p: 'x^3', a: '-1', b: '2', n: 6, rule: 'mid' } },
          ], pick));
      }
      function draw() {
        out.innerHTML = '';
        const n = Math.max(1, Math.min(50, Math.round(+s.v.n) || 4)), rule = ['left', 'right', 'mid'].includes(s.v.rule) ? s.v.rule : 'left';
        let p, a, b;
        try {
          p = parsePoly(s.v.p, 6); a = F.parse(s.v.a); b = F.parse(s.v.b);
          if (b.cmp(a) <= 0) throw new Error('Choose a < b: the interval runs from a to b.');
          if (Math.abs(a.num()) > 1000 || Math.abs(b.num()) > 1000) throw new Error('Keep a and b between −1000 and 1000.');
        } catch (e) { bad(out, e); return; }
        const W = track(out, draw), dx = b.sub(a).div(n), f = pfn(p), ft = ptex(p);
        const xs = Array.from({ length: n + 1 }, (_, i) => a.add(dx.mul(i)));
        const at = { left: i => xs[i - 1], right: i => xs[i], mid: i => xs[i - 1].add(xs[i]).div(2) };
        const heights = r => Array.from({ length: n }, (_, i) => pev(p, at[r](i + 1)));
        const H = { left: heights('left'), right: heights('right'), mid: heights('mid') };
        const S = {}; for (const r of ['left', 'right', 'mid']) S[r] = H[r].reduce((t, v) => t.add(v), F(0)).mul(dx);
        const Fp = pint(p), Fa = pev(Fp, a), Fb = pev(Fp, b), I = Fb.sub(Fa);
        const sym = { left: 'L_{' + n + '}', right: 'R_{' + n + '}', mid: 'M_{' + n + '}' }, rn = { left: 'left end', right: 'right end', mid: 'midpoint' };
        const intT = '\\int_{' + T(a) + '}^{' + T(b) + '} \\mathopen{}\\left(' + ft + '\\right)\\,dx';
        out.append(K.answer('The integral and the three sums with $n = ' + n + '$', intT + ' = ' + TD(I), 'Left sum $' + TD(S.left) + '$, right sum $' + TD(S.right) + '$, midpoint sum $' + TD(S.mid) + '$.'));

        // the picture
        const span = b.num() - a.num(), items = [{ type: 'fn', f, c: 0 }];
        for (let i = 1; i <= n; i++) items.push({ type: 'rect', x0: xs[i - 1].num(), x1: xs[i].num(), y: H[rule][i - 1].num() });
        if (n <= 30) for (let i = 1; i <= n; i++) items.push({ type: 'pt', x: at[rule](i).num(), y: H[rule][i - 1].num(), c: 3, r: 3 });
        out.append(K.card('The rectangles', plot({ x: [a.num() - 0.15 * span, b.num() + 0.15 * span], items, width: W, label: 'The curve with the Riemann rectangles',
          legend: [{ c: 0, text: '$y = ' + ft + '$' }, { c: 3, text: n + ' rectangles, each as tall as $f$ at its strip’s ' + rn[rule] + (H[rule].some(v => neg(v)) ? '; red ones lie below the axis and count as negative' : '') }] })));

        // the sum of the chosen rectangles
        const pt = { left: 'x_{i-1}', right: 'x_i', mid: '\\frac{x_{i-1} + x_i}{2}' }[rule];
        const Hs = H[rule].reduce((t, v) => t.add(v), F(0));
        const rows = H[rule].map((v, i) => ['$' + (i + 1) + '$', '$[' + T(xs[i]) + ',\\ ' + T(xs[i + 1]) + ']$', '$' + T(at[rule](i + 1)) + '$', '$' + TD(v) + '$', '$' + TD(v.mul(dx)) + '$']);
        rows.push(['', '', '', 'total', '$' + TD(S[rule]) + '$']);
        out.append(K.card('Every rectangle', K.steps([
          { text: 'Cut $[a, b]$ into $n$ strips of equal width $\\Delta x = \\frac{b - a}{n}$:', tex: '\\Delta x = \\frac{' + T(b) + ' - ' + par(a) + '}{' + n + '} = ' + TD(dx) },
          { text: 'The cut points are $x_i = a + i\\,\\Delta x$:', tex: xs.slice(0, Math.min(n + 1, 5)).map((q, i) => 'x_{' + i + '} = ' + T(q)).join(',\\ ') + (n + 1 > 5 ? ',\\ \\dots,\\ x_{' + n + '} = ' + T(xs[n]) : '') },
          { text: 'On strip $i$ stands a rectangle as tall as $f$ at the strip’s <b>' + rn[rule] + '</b>, $' + pt + '$. Its area is height × width, listed below.' },
          { text: 'All the widths are $\\Delta x$, so add the heights and multiply once:', tex: sym[rule] + ' = \\Delta x \\sum_{i=1}^{' + n + '} f\\mathopen{}\\left(' + pt + '\\right) = ' + T(dx) + ' \\cdot ' + par(Hs) + ' = ' + TD(S[rule]) },
        ]), K.table(['$i$', 'strip', 'height at $x =$', 'height $f(x)$', 'area $f(x)\\,\\Delta x$'], rows, { hi: new Set([rows.length - 1]) })));

        // the exact integral
        const below = (() => { for (let j = 0; j <= 400; j++) if (f(a.num() + (span * j) / 400) < -1e-12) return true; return false; })();
        out.append(K.card('The exact value, by an antiderivative', K.steps([
          { text: 'An <b>antiderivative</b> $F$ has $F\'(x) = f(x)$. Undo the power rule term by term: $x^n$ comes from $\\frac{x^{n+1}}{n+1}$ (lecture 9.3).', tex: 'F(x) = ' + ptex(Fp) },
          { text: 'The <b>fundamental theorem</b>: the integral from $a$ to $b$ is $F(b) - F(a)$ (lecture 9.4).', tex: 'F\\mathopen{}\\left(' + T(b) + '\\right) = ' + TD(Fb) + ',\\qquad F\\mathopen{}\\left(' + T(a) + '\\right) = ' + TD(Fa) },
          { text: 'Subtract:', tex: intT + ' = ' + T(Fb) + ' - ' + par(Fa) + ' = ' + TD(I) },
        ]), ok('differentiating $F$ gives back $' + ptex(pder(Fp)) + '$, which is $f$.'),
        below ? K.p('Part of the curve lies below the $x$-axis. There $f(x) < 0$, so area below the axis counts as negative: the integral is the area above minus the area below.') : null));

        // the three sums, and n growing
        const num = (r, m) => { const hh = span / m; let t = 0; for (let i = 1; i <= m; i++) { const xl = a.num() + (i - 1) * hh; t += f(r === 'left' ? xl : r === 'right' ? xl + hh : xl + hh / 2); } return t * hh; };
        const In = I.num(), ns = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024];
        const grid = ns.map(m => [m, num('left', m), num('right', m), num('mid', m)]);
        const last = grid[grid.length - 1], prev = grid[grid.length - 2];
        const ratio = (j) => (Math.abs(last[j] - In) > 1e-13 ? (prev[j] - In) / (last[j] - In) : null);
        const rL = ratio(1), rM = ratio(3);
        out.append(K.card('The sums as $n$ grows', K.table(['sum, $n = ' + n + '$', 'value', 'minus the integral'], ['left', 'right', 'mid'].map(r => [{ left: 'left', right: 'right', mid: 'midpoint' }[r] + ' $' + sym[r] + '$', '$' + TD(S[r]) + '$', '$' + TD(S[r].sub(I)) + '$'])),
          K.table(['$n$', '$L_n$', '$R_n$', '$M_n$', '$M_n - \\int$'], grid.map(([m, L, R, M]) => ['$' + m + '$', '$' + fmt(L, 6) + '$', '$' + fmt(R, 6) + '$', '$' + fmt(M, 6) + '$', '$' + fmt(M - In, 6) + '$'])),
          K.p('All three columns close in on $' + TD(I) + '$. ' + (rL ? 'Each doubling of $n$ roughly halves the left and right errors (the last step divides the left error by $' + fmt(rL, 2) + '$)' : 'The left and right sums are exact here') + (rM ? ' and roughly quarters the midpoint error (divided by $' + fmt(rM, 2) + '$).' : ', and the midpoint sums are exact: for a straight line each midpoint rectangle gains exactly what it loses.'))));
      }
      build();
      draw();
    },
  });

  /** ax² + bx + c with whole a, b, c (c ≠ 0): two whole numbers p + q = b with pq = ac, and the common factors of the
      groups ax² + px = g₁x(…) and qx + c = g₂(…) */
  function splitMiddle(a, b, c) {
    const ac = a * c;
    if (babs(ac) > 10n ** 10n) return null;
    for (const d of divisors(ac).sort((u, w) => (u < w ? -1 : u > w ? 1 : 0))) for (const p of [d, -d]) {
      const q = ac / p;
      if (p + q === b) { const g1 = (a < 0n ? -1n : 1n) * bgcd(a, p), g2 = (q * g1) / a; return [p, q, g1, g2]; }
    }
    return null;
  }

  // for the tests: the exact and numerical helpers
  REV.labs.functions.maths = { parseReal, parsePoly, ptex, pdiv, pmul, pev, pder, pint, pshift, solvePoly, rationalRoots, squareFree, realRootsNum, sqrtFr, rootTex, surdTex, lineFrom, splitMiddle, exactLog, logv, vpow, rootFr, iroot, between, FAM, LIMF, DF, famPars, pcompose };
})();
