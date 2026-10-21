/* Many-variable calculus lab: functions f(x, y) and f(x, y, z) typed by the learner, worked out step by step.
   It serves Mathematics 2, Weeks 9–11 (lectures 9.1–11.4); the "Try" examples are the lectures' own (lecture number
   given) and the Week 9 tutorials'. Course questions are never used.

   A formula is read by a small parser (never eval): numbers (2, 2.5, 1/2), the variables x, y, z, the constants pi and
   e, + − * / ^ and brackets, and sin cos tan exp log sqrt (log is the natural logarithm, as in the lectures).
   3xy means 3·x·y, x^2y means x²·y, and e^(x+y) is exp(x + y). Derivatives come from a small symbolic differentiator
   over the parse tree (exact polynomials and rational functions where it can), are checked numerically, and every
   number is exact (a fraction) when it is rational.

   Link parameters (each topic lists its own above it):
     f        the function, e.g. ?f=x^2+3xy-y^2 (a + is kept as it is in the link)
     a, b, c  the point (x, y, z) = (a, b, c); c is used only when f has z. Numbers such as 1, -2, 1/2, 0.5, pi/2.
     w        the half-width of the picture window around the point (0 = automatic) */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, h } = K;
  const Z = F(0), ONE = F(1);

  /* ================================================================== styles (added once) */
  const CSS = `
.mv-controls + .lk-out > * { min-width: 0; }
.mv-controls + .lk-out :is(.lk-tbl, .lk-step-m, .lk-answer-v, .lk-md, .lk-chart-wrap, .mv-show) { position: relative; }
@media (min-width: 861px) { .lk-controls.mv-controls { max-height: calc(100vh - 80px); overflow-y: auto; } }
.mv-show { overflow-x: auto; overflow-y: hidden; font-size: 15px; color: var(--ink-2); min-height: 1.6em; }
.mv-row { display: grid; grid-template-columns: repeat(var(--n, 2), minmax(0, 1fr)); gap: 8px; align-items: end; }
.mv-row .lk-field { min-width: 0; }
.mv-row .field { min-width: 0; text-align: center; }
.mv-try { min-height: 44px; line-height: 1.25; padding: 6px 12px; text-align: left; }
.mv-plot, .mv-legend { --mv1: var(--x); --mv2: var(--y); --mv3: var(--z); }
.mv-plot { width: 100%; max-width: 460px; height: auto; display: block; touch-action: pan-y; }
.mv-plot.wide { max-width: 560px; }
.mv-plot .bg { fill: var(--bg-elev); }
.mv-plot .gl { stroke: var(--line); stroke-width: 1; }
.mv-plot .ax { stroke: var(--line-2); stroke-width: 1; }
.mv-plot .fr { fill: none; stroke: var(--line-2); stroke-width: 1; }
.mv-plot .tk { fill: var(--ink-3); font: 11px var(--font); }
.mv-plot .an { fill: var(--ink-2); font: 600 12px var(--font); paint-order: stroke; stroke: var(--bg-elev); stroke-width: 3px; stroke-linejoin: round; }
.mv-plot .band { fill: none; stroke: var(--mv2); stroke-width: 6; stroke-opacity: .4; stroke-linecap: round; }
.mv-plot .lv { fill: none; stroke-width: 1.5; stroke-linejoin: round; stroke-linecap: round; }
.mv-plot .lv0 { stroke: var(--ink); stroke-width: 2.5; }
.mv-plot .lvn { stroke: var(--ink-4); stroke-width: 1.1; }
.mv-plot .lb { fill: var(--ink-2); font: 600 11px var(--font); paint-order: stroke; stroke: var(--bg-elev); stroke-width: 3px; stroke-linejoin: round; }
.mv-plot .lb.strong { fill: var(--ink); font-weight: 700; }
.mv-plot .pt { fill: var(--ink); stroke: var(--bg-elev); stroke-width: 2; }
.mv-plot .ln { fill: none; stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
.mv-plot .tg { fill: none; stroke-width: 2; stroke-linecap: round; }
.mv-plot .cv { fill: none; stroke: var(--accent); stroke-width: 2; stroke-linejoin: round; }
.mv-plot .s1 { stroke: var(--mv1); } .mv-plot .f1 { fill: var(--mv1); }
.mv-plot .s2 { stroke: var(--mv2); } .mv-plot .f2 { fill: var(--mv2); }
.mv-plot .s3 { stroke: var(--mv3); } .mv-plot .f3 { fill: var(--mv3); }
.mv-plot .s0 { stroke: var(--ink); } .mv-plot .f0 { fill: var(--ink); }
.mv-plot .mk { stroke: var(--bg-elev); stroke-width: 2; }
.mv-plot .hair { stroke: var(--ink-3); stroke-width: 1; }
.mv-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: var(--ink-2); margin: 8px 0 2px; }
.mv-legend span { display: inline-flex; align-items: center; gap: 6px; }
.mv-key { display: inline-block; width: 18px; height: 0; border-top: 3px solid var(--ink); border-radius: 2px; }
.mv-key.k1 { border-color: var(--mv1); } .mv-key.k2 { border-color: var(--mv2); } .mv-key.k3 { border-color: var(--mv3); }
.mv-key.thin { border-top-width: 2px; }
.mv-key.grey { border-color: var(--ink-4); border-top-width: 2px; }
.mv-sym { display: inline-block; width: 14px; text-align: center; font-weight: 800; color: var(--ink); }
.mv-readout { font-size: 13px; color: var(--ink-3); min-height: 1.5em; margin-top: 4px; font-variant-numeric: tabular-nums; }
`;
  if (!document.getElementById('mv-css')) document.head.append(h('style', { id: 'mv-css', text: CSS }));

  /* ================================================================== reading a formula: tokens → tree (never eval) */
  // A tree node is one of
  //   { k: 'n', v: Frac, d }   a number (d: it was typed as a decimal; sub: put in for a variable, printed as it is)
  //   { k: 'v', n: 'x' }       a variable          { k: 'c', n: 'pi' | 'e' }   a constant
  //   { k: '+', a: [...] }     a sum               { k: '*', a: [...] }        a product (a/b is a·b^(−1))
  //   { k: '^', b, e }         a power (sqrt(u) is u^(1/2))
  //   { k: 'f', n: 'sin' | 'cos' | 'tan' | 'exp' | 'log', a }   a function (e^u is exp(u))
  class MathError extends Error {}
  const FNS = ['sqrt', 'sin', 'cos', 'tan', 'exp', 'log', 'ln'];
  const XYZ = ['x', 'y', 'z'];
  const num = (v, d) => ({ k: 'n', v: F.is(v) ? v : F(v), d: !!d });
  const isNum = (n, v) => n.k === 'n' && (v == null || n.v.eq(v));
  const add = (a, b) => ({ k: '+', a: [...(a.k === '+' ? a.a : [a]), ...(b.k === '+' ? b.a : [b])] });
  const mul = (a, b) => ({ k: '*', a: [...(a.k === '*' ? a.a : [a]), ...(b.k === '*' ? b.a : [b])] });
  const neg = a => (a.k === 'n' ? num(a.v.neg(), a.d) : mul(num(-1), a));
  const pow = (b, e) => (b.k === 'c' && b.n === 'e' ? { k: 'f', n: 'exp', a: e } : { k: '^', b, e });
  const div = (a, b) => mul(a, pow(b, num(-1)));
  const fn = (n, a) => ({ k: 'f', n, a });
  const V = n => ({ k: 'v', n });

  function tokens(src) {
    const s = String(src == null ? '' : src).replace(/[−–—]/g, '-').replace(/[×·∙⋅∗]/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi')
      .replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/\*\*/g, '^').replace(/[[{]/g, '(').replace(/[\]}]/g, ')');
    if (s.length > 160) throw new MathError('The formula is too long for this lab (at most 160 characters).');
    if (/(\d|\.)[eE]\d/.test(s)) throw new MathError('Write numbers in full (1000000, not 1e6): here e is the number e = 2.718…, so 1e6 would mean 6e.');
    const out = [];
    let i = 0, m;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if ((m = /^(\d+(\.\d*)?|\.\d+)/.exec(s.slice(i)))) { out.push({ t: 'num', s: m[1] }); i += m[1].length; continue; }
      if (/[a-z]/i.test(c)) {
        const word = /^[a-z]+/i.exec(s.slice(i))[0], low = word.toLowerCase();
        for (let j = 0; j < low.length;) {
          const rest = low.slice(j), f = FNS.find(x => rest.startsWith(x));
          if (f) { out.push({ t: 'fn', s: f === 'ln' ? 'log' : f }); j += f.length; }
          else if (rest.startsWith('pi')) { out.push({ t: 'const', s: 'pi' }); j += 2; }
          else if (XYZ.includes(rest[0])) { out.push({ t: 'var', s: rest[0] }); j++; }
          else if (rest[0] === 'e') { out.push({ t: 'const', s: 'e' }); j++; }
          else throw new MathError('“' + word + '” is not something this lab knows. Use the letters x, y, z, the numbers pi and e, and sin, cos, tan, exp, log, sqrt.');
        }
        i += word.length;
        continue;
      }
      if ('+-*/^()'.includes(c)) { out.push({ t: c }); i++; continue; }
      throw new MathError(c === ',' ? 'A comma cannot go inside a formula.' : 'The sign “' + c + '” cannot be used. Use + − * / ^ and brackets.');
    }
    if (out.length > 120) throw new MathError('The formula is too long for this lab.');
    return out;
  }

  /** the tree of a formula; throws a MathError with a message for the learner */
  function parse(src) {
    const tk = tokens(src);
    if (!tk.length) throw new MathError('Type a formula, for example x^2 + y^2.');
    let i = 0, depth = 0;
    const peek = () => tk[i];
    const starts = t => t && (t.t === 'num' || t.t === 'var' || t.t === 'const' || t.t === 'fn' || t.t === '(');
    const close = what => { if (!tk[i] || tk[i].t !== ')') throw new MathError('A closing bracket “)” is missing' + (what ? ' after ' + what + '(…' : '') + '.'); i++; };
    function sum() {
      let a = product();
      while (peek() && (peek().t === '+' || peek().t === '-')) { const op = tk[i++].t; if (!peek()) throw new MathError('The formula ends with “' + op + '”: something is missing after it.'); const b = product(); a = add(a, op === '-' ? neg(b) : b); }
      return a;
    }
    function product() {
      let a = unary();
      for (;;) {
        const t = peek();
        if (t && (t.t === '*' || t.t === '/')) { i++; if (!peek()) throw new MathError('The formula ends with “' + t.t + '”: something is missing after it.'); const b = unary(); a = t.t === '*' ? mul(a, b) : div(a, b); }
        else if (starts(t)) a = mul(a, power());
        else break;
      }
      return a;
    }
    function unary() {
      const t = peek();
      if (t && t.t === '-') { i++; return neg(unary()); }
      if (t && t.t === '+') { i++; return unary(); }
      return power();
    }
    function power() {
      const b = primary();
      if (peek() && peek().t === '^') { i++; if (!peek()) throw new MathError('The formula ends with “^”: the power is missing.'); return pow(b, unary()); }
      return b;
    }
    function primary() {
      const t = tk[i++];
      if (!t) throw new MathError('The formula ends too early: something is missing.');
      if (++depth > 40) throw new MathError('Too many brackets inside each other.');
      try {
        if (t.t === 'num') return num(F.parse(t.s.replace(/\.$/, '')), t.s.includes('.'));
        if (t.t === 'var') return V(t.s);
        if (t.t === 'const') return { k: 'c', n: t.s };
        if (t.t === 'fn') {
          let p = null;
          if (peek() && peek().t === '^') { i++; p = unary(); }
          if (!peek() || peek().t !== '(') throw new MathError('Put what ' + t.s + ' acts on in brackets: ' + t.s + '(…), for example ' + t.s + '(xy).');
          i++;
          const a = sum();
          close(t.s);
          const f = t.s === 'sqrt' ? pow(a, num(F(1, 2))) : fn(t.s, a);
          return p ? pow(f, p) : f;
        }
        if (t.t === '(') { if (peek() && peek().t === ')') throw new MathError('There is an empty bracket “()”.'); const a = sum(); close(); return a; }
        if (t.t === ')') throw new MathError('There is a “)” without a matching “(”.');
        throw new MathError('Something is missing before “' + t.t + '”.');
      } finally { depth--; }
    }
    const tree = sum();
    if (i < tk.length) throw new MathError(tk[i].t === ')' ? 'There is a “)” without a matching “(”.' : 'I could not read the formula from “' + (tk[i].s || tk[i].t) + '” on.');
    if (size(tree) > 300) throw new MathError('The formula is too big for this lab.');
    return tree;
  }
  const size = n => 1 + (n.a && Array.isArray(n.a) ? n.a.reduce((s, c) => s + size(c), 0) : n.a ? size(n.a) : 0) + (n.b ? size(n.b) + size(n.e) : 0);

  /* ================================================================== the tree: variables, keys, values */
  function hasVar(n, v) {
    switch (n.k) {
      case 'n': case 'c': return false;
      case 'v': return n.n === v;
      case 'f': return hasVar(n.a, v);
      case '^': return hasVar(n.b, v) || hasVar(n.e, v);
      default: return n.a.some(c => hasVar(c, v));
    }
  }
  const usesAny = (n, vs) => vs.some(v => hasVar(n, v));
  /** a string that is equal for equal trees (children in the order they have) */
  function key(n) {
    switch (n.k) {
      case 'n': return n.v.str();
      case 'v': return n.n;
      case 'c': return '#' + n.n;
      case 'f': return n.n + '(' + key(n.a) + ')';
      case '^': return '(' + key(n.b) + ')^(' + key(n.e) + ')';
      case '+': return '+[' + n.a.map(key).join(',') + ']';
      default: return '*[' + n.a.map(key).join(',') + ']';
    }
  }
  /** put trees in for variables: map { x: tree, … }; mark = numbers put in are printed as they are (sub) */
  function subst(n, map) {
    switch (n.k) {
      case 'n': case 'c': return n;
      case 'v': return map[n.n] || n;
      case 'f': return fn(n.n, subst(n.a, map));
      case '^': return pow(subst(n.b, map), subst(n.e, map));
      case '+': return { k: '+', a: n.a.map(c => subst(c, map)) };
      default: return { k: '*', a: n.a.map(c => subst(c, map)) };
    }
  }
  const subNode = t => (t.k === 'n' ? { k: 'n', v: t.v, d: t.d, sub: true } : t);

  /** a fast numeric function of the tree: compile(n)({ x: 1, y: 2 }) */
  function compile(n) {
    switch (n.k) {
      case 'n': { const v = n.v.num(); return () => v; }
      case 'v': { const nm = n.n; return e => e[nm]; }
      case 'c': { const v = n.n === 'pi' ? Math.PI : Math.E; return () => v; }
      case '+': { const fs = n.a.map(compile); return e => { let s = 0; for (const f of fs) s += f(e); return s; }; }
      case '*': { const fs = n.a.map(compile); return e => { let p = 1; for (const f of fs) p *= f(e); return p; }; }
      case '^': {
        const b = compile(n.b), x = compile(n.e), ev = n.e.k === 'n' ? n.e.v : null;
        if (ev && ev.isInt()) { const k = Number(ev.n); return e => Math.pow(b(e), k); }
        if (ev && ev.d % 2n === 1n) { const r = ev.num(), sg = ev.n % 2n === 0n ? 1 : -1; return e => { const v = b(e); return v < 0 ? sg * Math.pow(-v, r) : Math.pow(v, r); }; }
        return e => Math.pow(b(e), x(e));
      }
      default: {
        const a = compile(n.a);
        const f = { sin: Math.sin, cos: Math.cos, tan: Math.tan, exp: Math.exp, log: v => (v > 0 ? Math.log(v) : NaN) }[n.n];
        return e => f(a(e));
      }
    }
  }
  const UNDEF = { undef: true };
  /** the exact value of the tree at exact values env = { x: Frac, … }: a Frac, null (not a fraction, or unknown), or UNDEF */
  function evx(n, env) {
    switch (n.k) {
      case 'n': return n.v;
      case 'v': return env[n.n] || null;
      case 'c': return null;
      case '+': { let s = Z, bad = false; for (const c of n.a) { const v = evx(c, env); if (v === UNDEF) return UNDEF; if (v === null) bad = true; else s = s.add(v); } return bad ? null : s; }
      case '*': {
        let p = ONE, bad = false, zero = false;
        for (const c of n.a) { const v = evx(c, env); if (v === UNDEF) return UNDEF; if (v === null) bad = true; else if (v.isZero()) zero = true; else p = p.mul(v); }
        if (zero) return bad && !finiteAt(n, env) ? UNDEF : Z;
        return bad ? null : p;
      }
      case '^': {
        const b = evx(n.b, env), e = evx(n.e, env);
        if (b === UNDEF || e === UNDEF) return UNDEF;
        if (e && e.isZero() && b !== null && !b.isZero()) return ONE;
        if (b === null || e === null) return null;
        return powExact(b, e);
      }
      default: {
        const a = evx(n.a, env);
        if (a === UNDEF) return UNDEF;
        if (n.n === 'log' && a && a.cmp(0) <= 0) return UNDEF;
        if (a === null) return null;
        if (!a.isZero()) return n.n === 'log' && a.eq(1) ? Z : null;
        return n.n === 'cos' || n.n === 'exp' ? ONE : n.n === 'log' ? UNDEF : Z;
      }
    }
  }
  const finiteAt = (n, env) => { const e = {}; for (const k in env) e[k] = env[k].num(); return Number.isFinite(compile(n)(e)); };
  const babs = a => (a < 0n ? -a : a);
  function iroot(n, k) { // the k-th root of a BigInt n ≥ 0 when it is a whole number, else null
    if (n < 2n) return n;
    let x = BigInt(Math.round(Math.pow(Number(n), 1 / k)));
    for (const d of [0n, 1n, -1n, 2n, -2n]) { const y = x + d; if (y >= 0n && y ** BigInt(k) === n) return y; }
    return null;
  }
  function powExact(b, e) {
    if (e.isInt()) {
      if (b.isZero() && e.n < 0n) return UNDEF;
      if (babs(e.n) > 60n) return null;
      return b.pow(Number(e.n));
    }
    if (b.isZero()) return e.cmp(0) > 0 ? Z : UNDEF;
    const q = Number(e.d);
    if (q > 12) return null;
    if (b.n < 0n && q % 2 === 0) return UNDEF;
    const rn = iroot(babs(b.n), q), rd = iroot(b.d, q);
    if (rn === null || rd === null) return null;
    let r = F(rn, rd);
    if (b.n < 0n) r = r.neg();
    return babs(e.n) > 60n ? null : r.pow(Number(e.n));
  }

  /* ================================================================== the tree as TeX */
  // o: { dec: show terminating fractions as decimals (the learner typed decimals), ren: { t: 'h' } names to print }
  function decStr(v) { const x = v.num(); let s = x.toFixed(8).replace(/0+$/, '').replace(/\.$/, ''); return s === '-0' ? '0' : s; }
  function numT(v, dec) {
    if (v.isInt()) return v.n.toString();
    if (dec && v.exactDecimal(8)) return decStr(v);
    return v.tex();
  }
  function tx(n, o = {}) {
    switch (n.k) {
      case 'n': return n.sub && (n.v.cmp(0) < 0) ? '\\left(' + numT(n.v, o.dec || n.d) + '\\right)' : numT(n.v, o.dec || n.d);
      case 'v': return (o.ren && o.ren[n.n]) || n.n;
      case 'c': return n.n === 'pi' ? '\\pi' : 'e';
      case 'f': {
        const a = tx(n.a, o);
        if (n.n === 'exp') return 'e^{' + a + '}';
        return '\\' + n.n + (/\\frac|\\sqrt|\\left/.test(a) ? '\\left(' + a + '\\right)' : '(' + a + ')');
      }
      case '+': {
        let s = '';
        n.a.forEach((t, i) => { const p = tx(t, o); s += i === 0 ? p : p[0] === '-' ? ' - ' + p.slice(1) : ' + ' + p; });
        return s;
      }
      case '*': return prodT(n.a, o);
      default: return powT(n, o);
    }
  }
  const negExp = f => f.k === '^' && f.e.k === 'n' && !f.e.sub && f.e.v.cmp(0) < 0;
  function powT(n, o) {
    const e = n.e, b = n.b;
    if (negExp(n)) return prodT([n], o);
    if (e.k === 'n' && e.v.eq(F(1, 2))) return '\\sqrt{' + tx(b, o) + '}';
    if (b.k === 'f' && b.n !== 'exp' && b.n !== 'log' && e.k === 'n' && e.v.isInt()) return '\\' + b.n + '^{' + e.v.n + '}' + (/\\frac|\\sqrt/.test(tx(b.a, o)) ? '\\left(' + tx(b.a, o) + '\\right)' : '(' + tx(b.a, o) + ')');
    const plain = b.k === 'v' || b.k === 'c' || (b.k === 'n' && b.v.isInt() && b.v.cmp(0) >= 0) || (b.k === 'n' && b.sub && b.v.cmp(0) < 0);
    const base = plain ? tx(b, o) : '\\left(' + tx(b, o) + '\\right)';
    const ex = e.k === 'n' ? (e.v.isInt() ? e.v.n.toString() : (e.v.n < 0n ? '-' : '') + babs(e.v.n) + '/' + e.v.d) : tx(e, o);
    return base + '^{' + ex + '}';
  }
  function prodT(fs, o) {
    let coef = ONE, dec = !!o.dec;
    const top = [], bot = [];
    for (const f of fs) {
      if (f.k === 'n' && !f.sub) { coef = coef.mul(f.v); dec = dec || f.d; continue; }
      if (negExp(f)) {
        const pe = f.e.v.neg();
        for (const g of f.b.k === '*' && pe.isInt() ? f.b.a : [f.b]) {
          if (g.k === 'n' && !g.sub && pe.isInt() && !g.v.isZero()) { coef = coef.div(g.v.pow(Number(pe.n))); continue; }
          bot.push(pe.eq(1) ? g : { k: '^', b: g, e: num(pe) });
        }
        continue;
      }
      top.push(f);
    }
    const sg = coef.cmp(0) < 0 ? '-' : '', c = coef.cmp(0) < 0 ? coef.neg() : coef;
    if (bot.length || (!c.isInt() && top.length && !(dec && c.exactDecimal(8)))) {
      const ntop = (c.n === 1n && top.length ? '' : c.n.toString()) + factorsT(top, o, c.n !== 1n);
      const nbot = (c.d === 1n ? '' : c.d.toString()) + factorsT(bot, o, c.d !== 1n);
      return sg + '\\frac{' + (ntop || '1') + '}{' + (nbot || '1') + '}';
    }
    const ct = c.eq(1) && top.length ? '' : numT(c, dec);
    return sg + ct + factorsT(top, o, ct !== '');
  }
  function factorsT(list, o, afterCoef) {
    let s = '', prevSub = false;
    list.forEach(f => {
      let p;
      if (f.k === '+') p = list.length === 1 && !afterCoef ? tx(f, o) : '\\left(' + tx(f, o) + '\\right)';
      else if (f.k === 'n') p = f.v.cmp(0) < 0 || (!f.v.isInt() && !(o.dec || f.d)) ? '\\left(' + numT(f.v, o.dec || f.d) + '\\right)' : numT(f.v, o.dec || f.d);
      else if (f.k === '*') p = '\\left(' + tx(f, o) + '\\right)';
      else p = tx(f, o);
      if ((s !== '' || afterCoef) && (/^[\d.]/.test(p) || prevSub)) s += ' \\cdot ';
      s += p;
      prevSub = f.k === 'n' && !!f.sub;
    });
    return s;
  }

  /* ================================================================== simplifying a tree (enough to read) */
  const rankOf = f => (f.k === 'c' ? 1 : f.k === 'v' || (f.k === '^' && f.b.k === 'v' && f.e.k === 'n') ? 2 : f.k === 'f' ? 3 : f.k === '^' && f.b.k === 'f' ? 3 : 4);
  const varName = f => (f.k === 'v' ? f.n : f.b.n);
  function S(n) {
    switch (n.k) {
      case 'n': return n.sub ? num(n.v) : n;
      case 'v': case 'c': return n;
      case 'f': return sFn(n.n, S(n.a));
      case '^': return sPow(S(n.b), S(n.e));
      case '*': return sMul(n.a.map(S));
      default: return sAdd(n.a.map(S));
    }
  }
  function sFn(name, a) {
    if (a.k === 'n') {
      if (a.v.isZero() && name !== 'log') return num(name === 'cos' || name === 'exp' ? 1 : 0);
      if (name === 'log' && a.v.eq(1)) return num(0);
    }
    if (name === 'log' && a.k === 'f' && a.n === 'exp') return a.a;
    if (name === 'exp' && a.k === 'f' && a.n === 'log') return a.a;
    return fn(name, a);
  }
  function sPow(b, e) {
    if (e.k === 'n') {
      if (e.v.isZero()) return num(1);
      if (e.v.eq(1)) return b;
      if (b.k === 'n') { const r = powExact(b.v, e.v); if (r && r !== UNDEF) return num(r); }
      if (b.k === '^' && e.v.isInt()) return sPow(b.b, sMul([b.e, e]));
      if (b.k === '*' && e.v.isInt()) return sMul(b.a.map(f => sPow(f, e)));
      if (b.k === 'f' && b.n === 'exp') return sFn('exp', sMul([e, b.a]));
    }
    if (b.k === 'c' && b.n === 'e') return sFn('exp', e);
    if (b.k === 'n' && b.v.eq(1)) return num(1);
    return { k: '^', b, e };
  }
  function sMul(list) {
    const items = [];
    list.forEach(f => (f.k === '*' ? items.push(...f.a) : items.push(f)));
    let coef = ONE;
    const groups = new Map(), order = [], expArgs = [];
    for (const f of items) {
      if (f.k === 'n') { coef = coef.mul(f.v); continue; }
      if (f.k === 'f' && f.n === 'exp') { expArgs.push(f.a); continue; }
      let base = f, ex = ONE;
      if (f.k === '^' && f.e.k === 'n') { base = f.b; ex = f.e.v; }
      const k = key(base);
      if (groups.has(k)) groups.get(k).ex = groups.get(k).ex.add(ex);
      else { groups.set(k, { base, ex }); order.push(k); }
    }
    if (coef.isZero()) return num(0);
    let fs = [];
    for (const k of order) {
      const { base, ex } = groups.get(k);
      if (ex.isZero()) continue;
      const p = ex.eq(1) ? base : sPow(base, num(ex));
      if (p.k === 'n') { coef = coef.mul(p.v); continue; }
      if (p.k === '*') { p.a.forEach(q => (q.k === 'n' ? (coef = coef.mul(q.v)) : fs.push(q))); continue; }
      fs.push(p);
    }
    if (expArgs.length) { const e = sFn('exp', sAdd(expArgs)); if (e.k === 'n') coef = coef.mul(e.v); else fs.push(e); }
    fs = fs.map((f, i) => ({ f, i })).sort((p, q) => rankOf(p.f) - rankOf(q.f) || (rankOf(p.f) === 2 ? (varName(p.f) < varName(q.f) ? -1 : varName(p.f) > varName(q.f) ? 1 : 0) : 0) || p.i - q.i).map(p => p.f);
    if (!fs.length) return num(coef);
    if (fs.length === 1 && fs[0].k === '+' && !coef.eq(1) && coef.isInt()) return sAdd(fs[0].a.map(t => sMul([num(coef), t])));
    if (coef.eq(1)) return fs.length === 1 ? fs[0] : { k: '*', a: fs };
    return { k: '*', a: [num(coef), ...fs] };
  }
  function splitCoef(t) {
    if (t.k === '*' && t.a[0].k === 'n') return { c: t.a[0].v, rest: t.a.length === 2 ? t.a[1] : { k: '*', a: t.a.slice(1) } };
    return { c: ONE, rest: t };
  }
  function sAdd(list) {
    const items = [];
    list.forEach(t => (t.k === '+' ? items.push(...t.a) : items.push(t)));
    let cst = Z;
    const terms = new Map(), order = [];
    for (const t of items) {
      if (t.k === 'n') { cst = cst.add(t.v); continue; }
      const { c, rest } = splitCoef(t), k = key(rest);
      if (terms.has(k)) terms.get(k).c = terms.get(k).c.add(c);
      else { terms.set(k, { c, rest }); order.push(k); }
    }
    const out = [];
    for (const k of order) { const { c, rest } = terms.get(k); if (!c.isZero()) out.push(c.eq(1) ? rest : sMul([num(c), rest])); }
    if (!cst.isZero()) out.push(num(cst));
    if (!out.length) return num(0);
    return out.length === 1 ? out[0] : { k: '+', a: out };
  }

  /* ================================================================== derivatives of a tree */
  /** ∂n/∂v as a tree (not simplified) */
  function D(n, v) {
    switch (n.k) {
      case 'n': case 'c': return num(0);
      case 'v': return num(n.n === v ? 1 : 0);
      case '+': return { k: '+', a: n.a.map(c => D(c, v)) };
      case '*': {
        const terms = [];
        n.a.forEach((f, i) => { if (!hasVar(f, v)) return; terms.push({ k: '*', a: [...n.a.slice(0, i), D(f, v), ...n.a.slice(i + 1)] }); });
        return terms.length ? { k: '+', a: terms } : num(0);
      }
      case '^': {
        const bv = hasVar(n.b, v), ev = hasVar(n.e, v);
        if (!bv && !ev) return num(0);
        if (!ev) return { k: '*', a: [n.e, pow(n.b, add(n.e, num(-1))), D(n.b, v)] };
        if (!bv) return { k: '*', a: [n, fn('log', n.b), D(n.e, v)] };
        return { k: '*', a: [n, add(mul(D(n.e, v), fn('log', n.b)), { k: '*', a: [n.e, D(n.b, v), pow(n.b, num(-1))] })] };
      }
      default: {
        const a = n.a, da = D(a, v);
        if (!hasVar(a, v)) return num(0);
        switch (n.n) {
          case 'sin': return mul(fn('cos', a), da);
          case 'cos': return { k: '*', a: [num(-1), fn('sin', a), da] };
          case 'tan': return mul(pow(fn('cos', a), num(-2)), da);
          case 'exp': return mul(n, da);
          default: return mul(da, pow(a, num(-1)));
        }
      }
    }
  }

  /* ================================================================== exact polynomials in x, y, z (and t, m for paths) */
  const PV = ['x', 'y', 'z', 't', 'm'];
  const NV = PV.length, Z5 = '0,0,0,0,0';
  const ex = k => k.split(',').map(Number);
  const cmpMono = (a, b) => { const da = a.reduce((s, x) => s + x, 0), db = b.reduce((s, x) => s + x, 0); if (da !== db) return db - da; for (let i = 0; i < NV; i++) if (a[i] !== b[i]) return b[i] - a[i]; return 0; };
  class Poly {
    constructor(t) { this.t = t || new Map(); }
    static c(v) { const p = new Poly(); v = F.is(v) ? v : F(v); if (!v.isZero()) p.t.set(Z5, v); return p; }
    static v(i) { const e = [0, 0, 0, 0, 0]; e[i] = 1; const p = new Poly(); p.t.set(e.join(), ONE); return p; }
    put(k, c) { const o = this.t.get(k), s = o ? o.add(c) : c; if (s.isZero()) this.t.delete(k); else this.t.set(k, s); return this; }
    add(q) { const r = new Poly(new Map(this.t)); for (const [k, c] of q.t) r.put(k, c); return r; }
    sub(q) { const r = new Poly(new Map(this.t)); for (const [k, c] of q.t) r.put(k, c.neg()); return r; }
    scale(c) { c = F.is(c) ? c : F(c); const r = new Poly(); if (c.isZero()) return r; for (const [k, v] of this.t) r.t.set(k, v.mul(c)); return r; }
    neg() { return this.scale(-1); }
    mul(q) {
      const r = new Poly();
      for (const [k1, c1] of this.t) { const e1 = ex(k1); for (const [k2, c2] of q.t) { const e2 = ex(k2); r.put(e1.map((x, i) => x + e2[i]).join(), c1.mul(c2)); } }
      if (r.t.size > 4000) throw new MathError('The algebra gets too big for this lab.');
      return r;
    }
    pow(n) { let r = Poly.c(1); for (let i = 0; i < n; i++) r = r.mul(this); return r; }
    isZero() { return this.t.size === 0; }
    isConst() { return this.t.size === 0 || (this.t.size === 1 && this.t.has(Z5)); }
    cval() { return this.t.get(Z5) || Z; }
    deg(i) { let d = 0; for (const k of this.t.keys()) d = Math.max(d, ex(k)[i]); return d; }
    minDeg(i) { let d = Infinity; for (const k of this.t.keys()) d = Math.min(d, ex(k)[i]); return d === Infinity ? 0 : d; }
    totalDeg() { let d = 0; for (const k of this.t.keys()) d = Math.max(d, ex(k).reduce((s, x) => s + x, 0)); return d; }
    uses(i) { return this.deg(i) > 0; }
    vars() { return PV.map((_, i) => i).filter(i => this.uses(i)); }
    diff(i) { const r = new Poly(); for (const [k, c] of this.t) { const e = ex(k); if (!e[i]) continue; const m = e[i]; e[i]--; r.put(e.join(), c.mul(m)); } return r; }
    /** exact value: vals[i] a Frac (missing variables count as 0) */
    ev(vals) { let s = Z; for (const [k, c] of this.t) { let p = c; ex(k).forEach((d, i) => { if (d) p = p.mul((vals[i] || Z).pow(d)); }); s = s.add(p); } return s; }
    evf(vals) { let s = 0; for (const [k, c] of this.t) { let p = c.num(); ex(k).forEach((d, i) => { if (d) p *= Math.pow(vals[i] || 0, d); }); s += p; } return s; }
    /** a fast numeric function of the polynomial: (vals) => number */
    fn() { const ts = [...this.t].map(([k, c]) => [c.num(), ex(k)]); return vals => { let s = 0; for (const [c, e] of ts) { let p = c; for (let i = 0; i < 5; i++) if (e[i]) p *= e[i] === 1 ? vals[i] : Math.pow(vals[i], e[i]); s += p; } return s; }; }
    /** put the polynomial q in for variable i */
    subst(i, q) {
      let r = new Poly();
      const pw = [Poly.c(1)];
      for (const [k, c] of this.t) {
        const e = ex(k), d = e[i];
        while (pw.length <= d) pw.push(pw[pw.length - 1].mul(q));
        e[i] = 0;
        const m = new Poly(); m.t.set(e.join(), c);
        r = r.add(m.mul(pw[d]));
      }
      return r;
    }
    /** the coefficient of (variable i)^d, a polynomial in the other variables */
    coef(i, d) { const r = new Poly(); for (const [k, c] of this.t) { const e = ex(k); if (e[i] !== d) continue; e[i] = 0; r.t.set(e.join(), c); } return r; }
    terms() { return [...this.t].map(([k, c]) => ({ e: ex(k), c })).sort((a, b) => cmpMono(a.e, b.e)); }
    lead() { return this.terms()[0]; }
    key() { return this.terms().map(t => t.e.join('.') + ':' + t.c.str()).join('|'); }
  }
  const gcdB = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  /** P = c · p with p primitive (whole coefficients without a common factor, leading coefficient positive) */
  function prim(P) {
    const ts = P.terms();
    if (!ts.length) return { c: ONE, p: P };
    let g = 0n, l = 1n;
    for (const t of ts) { g = gcdB(g, t.c.n); l = l / gcdB(l, t.c.d) * t.c.d; }
    let c = F(g, l);
    if (ts[0].c.cmp(0) < 0) c = c.neg();
    return { c, p: P.scale(ONE.div(c)) };
  }
  /** N / Q when Q divides N exactly, else null */
  function pdiv(N, Q) {
    if (Q.isZero()) return null;
    const lq = Q.lead();
    let r = N, q = new Poly();
    for (let guard = 0; !r.isZero(); guard++) {
      if (guard > 2000) return null;
      const lr = r.lead();
      if (lr.e.some((d, i) => d < lq.e[i])) return null;
      const m = new Poly(); m.t.set(lr.e.map((d, i) => d - lq.e[i]).join(), lr.c.div(lq.c));
      q = q.add(m);
      r = r.sub(m.mul(Q));
    }
    return q;
  }
  function polyOf(n) {
    switch (n.k) {
      case 'n': return Poly.c(n.v);
      case 'v': { const i = PV.indexOf(n.n); return i < 0 ? null : Poly.v(i); }
      case 'c': case 'f': return null;
      case '+': { let r = Poly.c(0); for (const c of n.a) { const p = polyOf(c); if (!p) return null; r = r.add(p); } return r; }
      case '*': { let r = Poly.c(1); for (const c of n.a) { const p = polyOf(c); if (!p) return null; r = r.mul(p); } return r; }
      default: {
        if (n.e.k !== 'n' || !n.e.v.isInt()) return null;
        const k = Number(n.e.v.n);
        if (n.b.k === 'n') { const r = powExact(n.b.v, n.e.v); return r && r !== UNDEF ? Poly.c(r) : null; }
        if (k < 0 || k > 16) return null;
        const p = polyOf(n.b);
        return p && p.pow(k);
      }
    }
  }
  /** the polynomial as a tree, terms in the usual order (highest degree first, x before y before z) */
  function polyTree(P) {
    let ts = P.terms();
    const firstPos = ts.findIndex(t => t.c.cmp(0) > 0), dg = t => t.e.reduce((a, b) => a + b, 0);
    if (firstPos > 0 && ts.every(t => dg(t) === dg(ts[0]))) ts = [...ts.slice(firstPos), ...ts.slice(0, firstPos)];
    if (!ts.length) return num(0);
    const terms = ts.map(t => {
      const fs = [];
      t.e.forEach((d, i) => { if (d) fs.push(d === 1 ? V(PV[i]) : pow(V(PV[i]), num(d))); });
      if (!fs.length) return num(t.c);
      return t.c.eq(1) ? (fs.length === 1 ? fs[0] : { k: '*', a: fs }) : { k: '*', a: [num(t.c), ...fs] };
    });
    return terms.length === 1 ? terms[0] : { k: '+', a: terms };
  }
  /** a polynomial in variable i with the other variables' parts grouped: (1 + m^2)x^2 */
  function polyByT(P, i, o) {
    const ds = [...new Set(P.terms().map(t => t.e[i]))].sort((a, b) => b - a);
    if (!ds.length) return '0';
    let s = '';
    ds.forEach((d, j) => {
      const c = P.coef(i, d), cs = c.terms();
      const vn = (o.ren && o.ren[PV[i]]) || PV[i], vp = d === 0 ? '' : d === 1 ? vn : vn + '^{' + d + '}';
      let p;
      if (cs.length === 1 && cs[0].e.every(x => !x)) { const cc = cs[0].c; p = d && cc.eq(1) ? vp : d && cc.eq(-1) ? '-' + vp : (cc.isInt() || !d ? numT(cc, o.dec) : numT(cc, o.dec)) + vp; }
      else if (cs.length === 1) p = tx(polyTree(c), o) + vp;
      else p = (d ? '\\left(' + tx(polyTree(c), o) + '\\right)' : tx(polyTree(c), o)) + vp;
      s += j === 0 ? p : p[0] === '-' ? ' - ' + p.slice(1) : ' + ' + p;
    });
    return s;
  }

  /* ================================================================== exact rational functions: n / (p1^k1 · p2^k2 …) */
  const Rn = (n, d = []) => ({ n, d });
  function rCancel(r) {
    if (r.n.isZero()) return Rn(r.n, []);
    let n = r.n;
    const d = [];
    for (const f of r.d) { let k = f.k; while (k > 0) { const q = pdiv(n, f.p); if (!q) break; n = q; k--; } if (k) d.push({ p: f.p, k }); }
    return Rn(n, d);
  }
  function mergeD(a, b) {
    const out = a.map(f => ({ p: f.p, k: f.k }));
    for (const f of b) { const o = out.find(g => g.p.key() === f.p.key()); if (o) o.k += f.k; else out.push({ p: f.p, k: f.k }); }
    return out.filter(f => f.k);
  }
  const rMul = (a, b) => rCancel(Rn(a.n.mul(b.n), mergeD(a.d, b.d)));
  function rPow(a, k) {
    if (k >= 0) return Rn(a.n.pow(k), a.d.map(f => ({ p: f.p, k: f.k * k })).filter(f => f.k));
    if (a.n.isZero()) throw new MathError('This divides by zero.');
    const m = -k, { c, p } = prim(a.n);
    let top = Poly.c(ONE.div(c.pow(m)));
    for (const f of a.d) top = top.mul(f.p.pow(f.k * m));
    return Rn(top, p.isConst() ? [] : [{ p, k: m }]);
  }
  function rAdd(a, b) {
    const L = new Map();
    for (const f of [...a.d, ...b.d]) { const kk = f.p.key(), o = L.get(kk); if (!o || o.k < f.k) L.set(kk, { p: f.p, k: f.k }); }
    const lcm = [...L.values()];
    const fill = x => { let r = x.n; for (const f of lcm) { const own = x.d.find(g => g.p.key() === f.p.key()); const e = f.k - (own ? own.k : 0); if (e) r = r.mul(f.p.pow(e)); } return r; };
    return rCancel(Rn(fill(a).add(fill(b)), lcm));
  }
  function ratOf(n) {
    switch (n.k) {
      case 'n': return Rn(Poly.c(n.v));
      case 'v': { const i = PV.indexOf(n.n); return i < 0 ? null : Rn(Poly.v(i)); }
      case 'c': case 'f': return null;
      case '+': { let r = Rn(Poly.c(0)); for (const c of n.a) { const q = ratOf(c); if (!q) return null; r = rAdd(r, q); } return r; }
      case '*': { let r = Rn(Poly.c(1)); for (const c of n.a) { const q = ratOf(c); if (!q) return null; r = rMul(r, q); } return r; }
      default: {
        if (n.e.k !== 'n' || !n.e.v.isInt()) return null;
        const k = Number(n.e.v.n);
        if (Math.abs(k) > 12) return null;
        const q = ratOf(n.b);
        return q && rPow(q, k);
      }
    }
  }
  function rDiff(r, i) {
    const ps = r.d;
    if (!ps.length) return Rn(r.n.diff(i));
    let P = Poly.c(1);
    for (const f of ps) P = P.mul(f.p);
    let Sm = Poly.c(0);
    ps.forEach((f, j) => { let t = f.p.diff(i).scale(f.k); if (t.isZero()) return; ps.forEach((g, l) => { if (l !== j) t = t.mul(g.p); }); Sm = Sm.add(t); });
    return rCancel(Rn(r.n.diff(i).mul(P).sub(r.n.mul(Sm)), ps.map(f => ({ p: f.p, k: f.k + 1 }))));
  }
  const rDen = r => r.d.reduce((a, f) => a.mul(f.p.pow(f.k)), Poly.c(1));
  /** the rational function as a tree (to print it): numerator over the factors of the denominator */
  function ratTree(r) {
    const top = polyTree(r.n);
    if (!r.d.length) return top;
    const fs = r.d.map(f => pow(polyTree(f.p), num(-f.k)));
    return { k: '*', a: [top, ...fs] };
  }

  /** ∂f/∂v in its nicest form: exact polynomial or rational algebra when f is one, else the simplified tree */
  function deriv(f, v) {
    const P = polyOf(f);
    if (P) return polyTree(P.diff(PV.indexOf(v)));
    const R = ratOf(f);
    if (R) return ratTree(rDiff(R, PV.indexOf(v)));
    return S(D(f, v));
  }

  /* ================================================================== numbers: exact when rational, else decimals */
  /** a decimal for TeX: up to k places; 3 significant figures × 10^… when tiny or huge */
  function decT(x, k = 4) {
    if (!Number.isFinite(x)) return '\\text{undefined}';
    const a = Math.abs(x);
    if (a !== 0 && (a < 1e-4 || a >= 1e8)) { const [m, e] = x.toExponential(2).split('e'); return m + ' \\times 10^{' + (+e) + '}'; }
    const s = x.toFixed(k).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s === '-0' ? '0' : s;
  }
  /** the same as plain text (for the live readout under a picture) */
  function decS(x, k = 3) {
    if (!Number.isFinite(x)) return 'undefined';
    const a = Math.abs(x);
    if (a !== 0 && (a < 1e-3 || a >= 1e7)) return x.toExponential(2).replace('e', '×10^').replace('^+', '^');
    const s = x.toFixed(k).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return (s === '-0' ? '0' : s).replace('-', '−');
  }
  /** the fraction p/q (q ≤ maxDen) closest to x, when it is within tol of x */
  function ratApprox(x, maxDen = 1000, tol = 1e-11) {
    if (!Number.isFinite(x) || Math.abs(x) > 1e9) return null;
    let h0 = 1, h1 = 0, k0 = 0, k1 = 1, v = x;
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(v), h2 = a * h0 + h1, k2 = a * k0 + k1;
      if (k2 > maxDen) break;
      h1 = h0; h0 = h2; k1 = k0; k0 = k2;
      if (Math.abs(x - h0 / k0) <= tol * Math.max(1, Math.abs(x))) return F(h0, k0);
      const fr = v - a;
      if (fr < 1e-15) break;
      v = 1 / fr;
    }
    return null;
  }
  /** n = s² · t with t squarefree (n a BigInt ≥ 1, at most 10^12 or so) → [s, t], else null */
  function sqfree(n) {
    if (n > 10n ** 13n) return null;
    let s = 1n, t = 1n, m = n;
    for (let p = 2n; p * p <= m; p++) { let e = 0; while (m % p === 0n) { m /= p; e++; } s *= p ** BigInt(Math.floor(e / 2)); if (e % 2) t *= p; }
    return [s, t * m];
  }
  /** √r for a fraction r > 0 as c·√t (c a fraction, t a squarefree whole number) */
  function sqrtParts(r) {
    const a = sqfree(r.n * r.d);
    if (!a) return null;
    return { c: F(a[0], r.d), t: a[1] };
  }
  /** TeX of c·√t: \sqrt{3}, -2\sqrt{2}, \frac{\sqrt{3}}{2}, \frac{3\sqrt{2}}{4} (t = 1: just c) */
  function surdT(c, t, dec) {
    if (t === 1n) return numT(c, dec);
    const sg = c.cmp(0) < 0 ? '-' : '', a = c.cmp(0) < 0 ? c.neg() : c, r = '\\sqrt{' + t + '}';
    const top = (a.n === 1n ? '' : a.n.toString()) + r;
    return sg + (a.d === 1n ? top : '\\frac{' + top + '}{' + a.d + '}');
  }
  /** TeX of a length k·√t written as the lecture does: 5, \sqrt{2}, 3\sqrt{5} */
  const lenT = (c, t) => surdT(c, t);
  const piT = p => { const sg = p.cmp(0) < 0 ? '-' : '', a = p.cmp(0) < 0 ? p.neg() : p; const top = (a.n === 1n ? '' : a.n.toString()) + '\\pi'; return sg + (a.d === 1n ? top : '\\frac{' + top + '}{' + a.d + '}'); };

  /* a number of the form r + c·√t (r, c fractions, t squarefree): unit vectors and the angles 30°, 45°, 60° stay exact */
  class Q2 {
    constructor(r, c = Z, t = 1n) { this.r = r; this.c = t === 1n ? Z : c; this.t = t === 1n || c.isZero() ? 1n : t; if (t === 1n) this.r = r.add(c); }
    static of(x) { return x instanceof Q2 ? x : new Q2(F.is(x) ? x : F(x)); }
    ok(o) { return this.t === 1n || o.t === 1n || this.t === o.t; }
    add(o) { o = Q2.of(o); if (!this.ok(o)) return null; return new Q2(this.r.add(o.r), this.c.add(o.c), this.t === 1n ? o.t : this.t); }
    mul(o) {
      o = Q2.of(o);
      if (!this.ok(o)) return null;
      const t = this.t === 1n ? o.t : this.t;
      return new Q2(this.r.mul(o.r).add(this.c.mul(o.c).mul(F(t))), this.r.mul(o.c).add(this.c.mul(o.r)), t);
    }
    isQ() { return this.t === 1n || this.c.isZero(); }
    num() { return this.r.num() + this.c.num() * Math.sqrt(Number(this.t)); }
    tex(dec) {
      if (this.isQ()) return numT(this.r, dec);
      const s = surdT(this.c, this.t, dec);
      if (this.r.isZero()) return s;
      return numT(this.r, dec) + (s[0] === '-' ? ' - ' + s.slice(1) : ' + ' + s);
    }
  }
  /** cos θ and sin θ exactly for multiples of 30° and 45° (else null) */
  function cosSinDeg(deg) {
    let d = ((deg % 360) + 360) % 360;
    if (!Number.isInteger(d)) return null;
    const h2 = new Q2(Z, F(1, 2), 2n), h3 = new Q2(Z, F(1, 2), 3n), half = new Q2(F(1, 2)), one = new Q2(ONE), zero = new Q2(Z);
    const T = { 0: [one, zero], 30: [h3, half], 45: [h2, h2], 60: [half, h3], 90: [zero, one] };
    const sg = (q, s) => (s < 0 ? q.mul(new Q2(F(-1))) : q);
    for (const [base, sx, sy, swap] of [[d, 1, 1, false], [180 - d, -1, 1, false], [d - 180, -1, -1, false], [360 - d, 1, -1, false]]) {
      if (T[base] && base >= 0) return [sg(T[base][0], sx), sg(T[base][1], sy)];
    }
    return null;
  }

  /* values at a point: { q: Frac or null, x: number, t: TeX or null } — exact when q is set */
  const valQ = q => ({ q, x: q.num(), t: null });
  /** a float, recognised as a fraction, a multiple of π or a square root when it is one to 12 digits */
  function ident(x) {
    if (!Number.isFinite(x)) return { q: null, x, t: null };
    const q = ratApprox(x, 1000, 1e-12);
    if (q) return valQ(q);
    const p = ratApprox(x / Math.PI, 24, 1e-12);
    if (p && !p.isZero()) return { q: null, x, t: piT(p) };
    if (x > 0) { const le = ratApprox(Math.log(x), 12, 1e-12); if (le && !le.isZero()) return { q: null, x, t: le.eq(1) ? 'e' : 'e^{' + numT(le) + '}' }; }
    const s = ratApprox(x * x, 1000, 1e-11);
    if (s && s.cmp(0) > 0) { const sp = sqrtParts(s); if (sp && sp.t !== 1n) return { q: null, x, t: surdT(x < 0 ? sp.c.neg() : sp.c, sp.t) }; }
    return { q: null, x, t: null };
  }
  /** TeX of a value (no decimals added) */
  const vT = (v, dec) => (v.q ? numT(v.q, dec) : v.t ? v.t : decT(v.x));
  /** "= exact (= decimal)" or "\approx decimal" to end a chain of equalities */
  function vEnd(v, dec) {
    if (v.q) { const s = numT(v.q, dec); if (v.q.isInt() || (dec && v.q.exactDecimal(8))) return '= ' + s; return '= ' + s + (v.q.exactDecimal(6) ? ' = ' : ' \\approx ') + decT(v.x, 4); }
    if (v.t) return '= ' + v.t + ' \\approx ' + decT(v.x, 4);
    return '\\approx ' + decT(v.x, 4);
  }
  const vNum = v => (v.q ? v.q.num() : v.x);

  /** the value of tree n at a point given as trees (pt: { x: tree, … }): exact when possible */
  function valueAt(n, pt) {
    const ex = {}, fl = {};
    let exact = true;
    for (const k in pt) { const q = evx(pt[k], {}); if (q && q !== UNDEF) ex[k] = q; else exact = false; fl[k] = compile(pt[k])({}); }
    if (exact) { const q = evx(n, ex); if (q === UNDEF) return { undef: true }; if (q) return valQ(q); }
    const x = compile(n)(fl);
    if (!Number.isFinite(x)) return { undef: true };
    return ident(x);
  }
  /** the steps of working out f at a point: "f(1, 2) = 1^{2} + 3 \cdot 1 \cdot 2 - 2^{2} = 1 + 6 - 4 = 3" (TeX, no "f(…) =") */
  function evalChain(n, pt, o = {}) {
    const map = {};
    for (const k in pt) map[k] = subNode(pt[k]);
    const s1 = tx(subst(n, map), o);
    const v = valueAt(n, pt);
    if (v.undef) return { tex: s1, v, undef: true };
    let mid = '';
    if (n.k === '+' && n.a.length > 1) {
      const parts = n.a.map(t => valueAt(t, pt));
      if (parts.every(p => !p.undef && (p.q || p.t))) {
        mid = '';
        parts.forEach((p, i) => { const s = p.q ? (p.q.cmp(0) < 0 && i ? '\\left(' + numT(p.q, o.dec) + '\\right)' : numT(p.q, o.dec)) : p.t; mid += i === 0 ? s : ' + ' + s; });
        mid = mid.replace(/\+ \\left\((-[^)]*)\\right\)/g, (m, x) => '- ' + x.slice(1));
      }
    }
    const end = vEnd(v, o.dec);
    const chain = [s1];
    if (mid && mid !== s1) chain.push('= ' + mid);
    if (end.replace(/^= /, '') !== s1 && end.replace(/^= /, '') !== mid) chain.push(end);
    return { tex: chain.join(' '), v };
  }

  /* ================================================================== equations in one variable */
  const trimU = c => { c = c.slice(); while (c.length && c[c.length - 1].isZero()) c.pop(); return c; };
  const hornerQ = (c, r) => c.reduceRight((s, a) => s.mul(r).add(a), Z);
  const hornerF = (c, x) => c.reduceRight((s, a) => s * x + a, 0);
  function divisors(n) {
    n = babs(n);
    if (n === 0n || n > 10n ** 12n) return null;
    const out = [];
    for (let d = 1n; d * d <= n; d++) if (n % d === 0n) { out.push(d); if (d * d !== n) out.push(n / d); }
    return out;
  }
  /** real roots of c[0] + c[1]t + … = 0: { roots: [{ q } or { x, t }], lead, factors: [Frac roots with repeats], rest, how } */
  function uniSolve(c) {
    c = trimU(c);
    const roots = [], facts = [];
    let rest = c.slice();
    while (rest.length > 1 && rest[0].isZero()) { rest.shift(); facts.push(Z); }
    for (let guard = 0; rest.length > 1 && guard < 20; guard++) {
      let L = 1n;
      rest.forEach(a => { L = L / gcdB(L, a.d) * a.d; });
      const a0 = rest[0].mul(L).n, an = rest[rest.length - 1].mul(L).n;
      const P = divisors(a0), Q = divisors(an);
      if (!P || !Q || P.length * Q.length > 4000) break;
      let hit = null;
      outer: for (const q of Q.sort((x, y) => (x < y ? -1 : 1))) for (const p of P.sort((x, y) => (x < y ? -1 : 1))) for (const s of [1n, -1n]) {
        const r = F(s * p, q);
        if (hornerQ(rest, r).isZero()) { hit = r; break outer; }
      }
      if (!hit) break;
      facts.push(hit);
      const b = new Array(rest.length - 1);
      b[b.length - 1] = rest[rest.length - 1];
      for (let k = b.length - 1; k > 0; k--) b[k - 1] = rest[k].add(hit.mul(b[k]));
      rest = b;
    }
    const seen = new Set();
    facts.forEach(r => { if (!seen.has(r.str())) { seen.add(r.str()); roots.push({ q: r }); } });
    let how = null;
    if (rest.length === 3) {
      const [cc, bb, aa] = rest, Dd = bb.mul(bb).sub(aa.mul(cc).mul(4));
      how = { quad: true, D: Dd };
      if (Dd.cmp(0) > 0) {
        const sp = sqrtParts(Dd);
        const r0 = bb.neg().div(aa.mul(2));
        if (sp) { const k = sp.c.div(aa.mul(2)).cmp(0) < 0 ? sp.c.div(aa.mul(2)).neg() : sp.c.div(aa.mul(2)); [1, -1].forEach(sg => { const q2 = new Q2(r0, sg > 0 ? k : k.neg(), sp.t); roots.push({ x: q2.num(), t: q2.tex(), q2 }); }); }
        else { const sd = Math.sqrt(Dd.num()); [1, -1].forEach(sg => roots.push({ x: (-bb.num() + sg * sd) / (2 * aa.num()), t: null })); }
      }
    } else if (rest.length > 3) {
      how = { numeric: true };
      realRoots(rest.map(a => a.num())).forEach(x => roots.push({ x, t: null }));
    }
    roots.sort((p, q) => (p.q ? p.q.num() : p.x) - (q.q ? q.q.num() : q.x));
    return { roots, facts, rest, how, lead: c.length ? c[c.length - 1] : Z };
  }
  /** real roots of a float polynomial (coefficients from the constant up), by bisection between the turning points */
  function realRoots(a) {
    while (a.length && Math.abs(a[a.length - 1]) < 1e-300) a.pop();
    const n = a.length - 1;
    if (n < 1) return [];
    if (n === 1) return [-a[0] / a[1]];
    const B = 1 + Math.max(...a.slice(0, n).map(x => Math.abs(x / a[n])));
    const d = a.slice(1).map((x, i) => x * (i + 1));
    const cuts = [-B, ...realRoots(d).filter(x => x > -B && x < B).sort((p, q) => p - q), B];
    const out = [];
    for (let i = 0; i + 1 < cuts.length; i++) {
      let lo = cuts[i], hi = cuts[i + 1], flo = hornerF(a, lo), fhi = hornerF(a, hi);
      if (Math.abs(fhi) < 1e-12 * Math.max(1, Math.abs(a[n]))) { if (!out.some(r => Math.abs(r - hi) < 1e-9)) out.push(hi); continue; }
      if (flo * fhi > 0) continue;
      for (let k = 0; k < 200; k++) { const mid = (lo + hi) / 2, fm = hornerF(a, mid); if (fm === 0) { lo = hi = mid; break; } if (flo * fm < 0) { hi = mid; fhi = fm; } else { lo = mid; flo = fm; } }
      const r = (lo + hi) / 2;
      if (!out.some(x => Math.abs(x - r) < 1e-9)) out.push(r);
    }
    return out;
  }
  /** TeX of the factored form lead · (q t − p)…: the found fraction roots as whole-number factors */
  function factoredT(u, vn) {
    let c = u.lead, s = '';
    const fs = [];
    const groups = new Map();
    u.facts.forEach(r => groups.set(r.str(), { r, k: (groups.get(r.str()) || { k: 0 }).k + 1 }));
    for (const { r, k } of groups.values()) {
      let f;
      if (r.isZero()) f = vn;
      else { c = c.div(F(r.d).pow(k)); f = '\\left(' + (r.d === 1n ? '' : r.d.toString()) + vn + (r.cmp(0) > 0 ? ' - ' : ' + ') + babs(r.n) + '\\right)'; }
      fs.push(k > 1 ? (r.isZero() ? vn + '^{' + k + '}' : f + '^{' + k + '}') : f);
    }
    if (c.cmp(0) < 0) {
      const odd = [...groups.values()].find(g => !g.r.isZero() && g.k % 2 === 1);
      if (odd) { c = c.neg(); const r = odd.r, i = [...groups.values()].indexOf(odd); fs[i] = '\\left(' + babs(r.n) + (r.cmp(0) > 0 ? ' - ' : ' + ') + (r.d === 1n ? '' : r.d.toString()) + vn + '\\right)'; if (r.cmp(0) < 0) { c = c.neg(); fs[i] = '\\left(-' + babs(r.n) + ' - ' + (r.d === 1n ? '' : r.d.toString()) + vn + '\\right)'; } }
    }
    let restT = '';
    if (u.rest.length > 1) { const P = new Poly(); u.rest.forEach((a, i) => { if (!a.isZero()) { const e = [0, 0, 0, 0, 0]; e[0] = i; P.t.set(e.join(), a.div(c)); } }); const rt = tx(polyTree(P), { ren: { x: vn } }); restT = fs.length || !c.eq(1) ? '\\left(' + rt + '\\right)' : rt; }
    const ct = c.eq(1) ? '' : c.eq(-1) ? '-' : numT(c);
    s = ct + fs.join('') + restT;
    return s || numT(c);
  }

  /* ================================================================== solving ∇f = 0 step by step (polynomial equations) */
  const vname = i => PV[i];
  const pT = (P, o) => tx(polyTree(P), o);
  const qKey = vals => Object.keys(vals).sort().map(k => k + '=' + (vals[k].q ? vals[k].q.str() : vals[k].x.toFixed(9))).join(';');
  /** solve eqs = 0 (Polys in the slots vs); returns { sols: [{ vals: { slot: { q } | { x, t } }, free: [slots] }], steps, ok } */
  function solveSys(eqs, vs, ctx = { n: 0, depth: 0 }) {
    const steps = [];
    if (++ctx.n > 200 || ctx.depth > 8) return { ok: false, sols: [], steps };
    eqs = eqs.filter(e => !e.isZero());
    const bad = eqs.find(e => e.isConst());
    if (bad) { steps.push({ text: 'This would need $' + numT(bad.cval()) + ' = 0$, which is false: no solution here.' }); return { ok: true, sols: [], steps }; }
    if (!eqs.length) return { ok: true, sols: [{ vals: {}, free: vs.slice() }], steps };
    // an equation in one variable only
    const one = eqs.find(e => e.vars().length === 1);
    if (!one && eqs.every(e => e.totalDeg() <= 1)) return gaussSolve(eqs, vs, steps);   // linear equations: Gaussian elimination, as in lecture 10.4
    if (one) {
      const v = one.vars()[0], u = uniSolve(uniOfP(one, v)), ft = factoredT(u, vname(v)), same = ft.replace(/\\left|\\right/g, '') === pT(one).replace(/\\left|\\right/g, '');
      steps.push({ text: 'This equation has only $' + vname(v) + '$ in it' + (same ? '' : '; factor it') + ':', tex: pT(one) + ' = 0' + (same ? '' : ' \\iff ' + ft + ' = 0') });
      if (u.how && u.how.quad) steps.push(u.how.D.cmp(0) < 0 ? { text: 'The quadratic factor has no real solution: its discriminant $b^2 - 4ac = ' + numT(u.how.D) + '$ is negative.' } : { text: 'The quadratic formula $\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ gives the other solutions (discriminant $' + numT(u.how.D) + '$).' });
      if (u.how && u.how.numeric) steps.push({ text: 'The remaining part has no fraction as a solution; its real solutions are found numerically.' });
      if (!u.roots.length) { steps.push({ text: 'So no real $' + vname(v) + '$ works: no solution here.' }); return { ok: true, sols: [], steps }; }
      steps.push({ text: 'So $' + u.roots.map(r => vname(v) + ' = ' + (r.q ? numT(r.q) : r.t || decT(r.x))).join('$ or $') + '$.' });
      const others = eqs.filter(e => e !== one), rest = vs.filter(x => x !== v), sols = [];
      for (const r of u.roots) {
        if (!r.q) {
          // an irrational value: allowed only when no other equation still links it to another unknown
          if (others.some(e => e.uses(v) && e.vars().some(w => w !== v))) return { ok: false, sols: [], steps };
          if (others.some(e => e.uses(v) && Math.abs(e.evf(PV.map((_, i) => (i === v ? r.x : 0)))) > 1e-9)) continue;
          const sub = solveSys(others.filter(e => !e.uses(v)), rest, { n: ctx.n, depth: ctx.depth + 1 });
          ctx.n += sub.n || 0;
          if (!sub.ok) return { ok: false, sols: [], steps };
          sub.sols.forEach(s => sols.push({ vals: { ...s.vals, [v]: { q: null, x: r.x, t: r.t } }, free: s.free }));
          continue;
        }
        const sub = solveSys(others.map(e => e.subst(v, Poly.c(r.q))), rest, { n: ctx.n, depth: ctx.depth + 1 });
        if (!sub.ok) return { ok: false, sols: [], steps };
        if (sub.steps.length && others.length) steps.push({ text: '<b>When $' + vname(v) + ' = ' + numT(r.q) + '$</b>, the other equation' + (others.length > 1 ? 's become' : ' becomes') + ' $' + others.map(e => pT(e.subst(v, Poly.c(r.q))) + ' = 0').join(',\\ ') + '$.' }, ...sub.steps);
        sub.sols.forEach(s => sols.push({ vals: { ...s.vals, [v]: { q: r.q } }, free: s.free }));
      }
      return { ok: true, sols, steps };
    }
    // an equation in which one variable appears once, times a number: solve for it and put it into the others
    for (const e of eqs) for (const v of vs) {
      if (e.deg(v) !== 1 || !e.coef(v, 1).isConst()) continue;
      const cv = e.coef(v, 1).cval(), expr = e.coef(v, 0).scale(ONE.div(cv).neg());
      steps.push({ text: 'Solve $' + pT(e) + ' = 0$ for $' + vname(v) + '$:', tex: vname(v) + ' = ' + pT(expr) });
      const others = eqs.filter(x => x !== e).map(x => x.subst(v, expr));
      steps.push({ text: 'Put this into the other equation' + (others.length > 1 ? 's' : '') + ':', tex: others.map(x => pT(x) + ' = 0').join(',\\quad ') });
      const sub = solveSys(others, vs.filter(x => x !== v), { n: ctx.n, depth: ctx.depth + 1 });
      if (!sub.ok) return { ok: false, sols: [], steps };
      steps.push(...sub.steps);
      const sols = [];
      for (const s of sub.sols) {
        if (s.free && s.free.length) { sols.push({ vals: { ...s.vals }, free: s.free, dep: { v, expr } }); continue; }
        const vals = PV.map((_, i) => (s.vals[i] ? s.vals[i] : null));
        if (vals.some((x, i) => x && !x.q && expr.uses(i))) { const xv = expr.evf(PV.map((_, i) => (s.vals[i] ? (s.vals[i].q ? s.vals[i].q.num() : s.vals[i].x) : 0))); sols.push({ vals: { ...s.vals, [v]: ident(xv) }, free: [] }); continue; }
        const q = expr.ev(PV.map((_, i) => (s.vals[i] && s.vals[i].q ? s.vals[i].q : Z)));
        sols.push({ vals: { ...s.vals, [v]: { q } }, free: [] });
      }
      if (sols.length) steps.push({ text: 'Then $' + vname(v) + ' = ' + pT(expr) + '$ gives ' + sols.filter(s => !s.free.length).map(s => '$' + vname(v) + ' = ' + vT(s.vals[v]) + '$').join(', ') + '.' });
      return { ok: true, sols, steps };
    }
    // an equation with a common factor x (or y, z): x·(…) = 0, so x = 0 or (…) = 0
    for (const e of eqs) {
      const mono = PV.map((_, i) => (vs.includes(i) ? e.minDeg(i) : 0));
      const w = vs.find(i => mono[i] > 0);
      if (w == null) continue;
      const m = new Poly(); const me = [0, 0, 0, 0, 0]; me[w] = 1; m.t.set(me.join(), ONE);
      let restE = e; for (let k = 0; k < mono[w]; k++) restE = pdiv(restE, m);
      steps.push({ text: 'Take out the common factor $' + vname(w) + (mono[w] > 1 ? '^{' + mono[w] + '}' : '') + '$:', tex: pT(e) + ' = ' + vname(w) + (mono[w] > 1 ? '^{' + mono[w] + '}' : '') + '\\left(' + pT(restE) + '\\right) = 0' });
      steps.push({ text: 'A product is $0$ only when one of its factors is $0$, so $' + vname(w) + ' = 0$ or $' + pT(restE) + ' = 0$.' });
      const sols = [];
      const A = solveSys(eqs.filter(x => x !== e).map(x => x.subst(w, Poly.c(0))), vs.filter(x => x !== w), { n: ctx.n, depth: ctx.depth + 1 });
      if (!A.ok) return { ok: false, sols: [], steps };
      steps.push({ text: '<b>Case $' + vname(w) + ' = 0$.</b>' }, ...A.steps);
      A.sols.forEach(s => sols.push({ vals: { ...s.vals, [w]: { q: Z } }, free: s.free }));
      const B = solveSys([restE, ...eqs.filter(x => x !== e)], vs, { n: ctx.n, depth: ctx.depth + 1 });
      if (!B.ok) return { ok: false, sols: [], steps };
      steps.push({ text: '<b>Case $' + pT(restE) + ' = 0$.</b>' }, ...B.steps);
      B.sols.forEach(s => sols.push(s));
      const seen = new Set();
      return { ok: true, sols: sols.filter(s => { const k = qKey(s.vals) + '|' + (s.free || []).join(); if (seen.has(k)) return false; seen.add(k); return true; }), steps };
    }
    return { ok: false, sols: [], steps };
  }
  const uniOfP = (P, i) => { const d = P.deg(i), c = []; for (let k = 0; k <= d; k++) c.push(P.coef(i, k).cval()); return c; };
  /** Gaussian elimination on the linear equations, every row operation shown (lecture 10.4) */
  function gaussSolve(eqs, vs, steps) {
    const cols = vs.slice().sort((a, b) => a - b);
    const M = eqs.map(e => [...cols.map(v => e.coef(v, 1).cval()), e.coef(cols[0], 0).ev([]).neg().add(cols.slice(1).reduce((s, v) => s, Z))]);
    // the constant term: the part with no variable at all
    eqs.forEach((e, r) => { M[r][cols.length] = e.t.get(Z5) ? e.t.get(Z5).neg() : Z; });
    const mT = () => '\\left(\\begin{array}{' + 'r'.repeat(cols.length) + '|r}' + M.map(row => row.map(x => numT(x)).join(' & ')).join(' \\\\ ') + '\\end{array}\\right)';
    steps.push({ text: 'These are linear equations. Move the numbers to the right-hand side and write the augmented matrix (the columns are ' + cols.map(v => '$' + vname(v) + '$').join(', ') + '):', tex: eqs.map(e => { const l = new Poly(new Map(e.t)); l.t.delete(Z5); return pT(l) + ' = ' + numT(e.t.get(Z5) ? e.t.get(Z5).neg() : Z); }).join(',\\quad ') + '\\qquad ' + mT() });
    let r = 0;
    const piv = [];
    for (let c = 0; c < cols.length && r < M.length; c++) {
      let p = M.findIndex((row, i) => i >= r && !row[c].isZero());
      if (p < 0) continue;
      if (p !== r) { [M[p], M[r]] = [M[r], M[p]]; steps.push({ text: 'Swap rows ' + (r + 1) + ' and ' + (p + 1) + ':', tex: 'R_{' + (r + 1) + '} \\leftrightarrow R_{' + (p + 1) + '}:\\quad ' + mT() }); }
      const a = M[r][c];
      if (!a.eq(1)) { M[r] = M[r].map(x => x.div(a)); steps.push(a.isInt() ? { text: 'Divide row ' + (r + 1) + ' by $' + numT(a) + '$:', tex: 'R_{' + (r + 1) + '} \\to R_{' + (r + 1) + '}/' + (a.cmp(0) < 0 ? '(' + numT(a) + ')' : numT(a)) + ':\\quad ' + mT() } : { text: 'Multiply row ' + (r + 1) + ' by $' + numT(ONE.div(a)) + '$ (that is, divide it by $' + numT(a) + '$):', tex: 'R_{' + (r + 1) + '} \\to ' + numT(ONE.div(a)) + 'R_{' + (r + 1) + '}:\\quad ' + mT() }); }
      for (let i = 0; i < M.length; i++) {
        if (i === r || M[i][c].isZero()) continue;
        const k = M[i][c];
        M[i] = M[i].map((x, j) => x.sub(k.mul(M[r][j])));
        steps.push({ text: 'Use row ' + (r + 1) + ' to make the $' + vname(cols[c]) + '$ entry of row ' + (i + 1) + ' zero:', tex: 'R_{' + (i + 1) + '} \\to R_{' + (i + 1) + '} ' + (k.cmp(0) > 0 ? '- ' : '+ ') + (k.eq(1) || k.eq(-1) ? '' : numT(k.cmp(0) > 0 ? k : k.neg())) + 'R_{' + (r + 1) + '}:\\quad ' + mT() });
      }
      piv.push(c);
      r++;
    }
    if (M.some(row => row.slice(0, cols.length).every(x => x.isZero()) && !row[cols.length].isZero())) { steps.push({ text: 'A row says $0 = $ a non-zero number: the equations contradict each other, so there is no solution.' }); return { ok: true, sols: [], steps }; }
    const free = cols.filter((_, c) => !piv.includes(c));
    if (free.length) {
      steps.push({ text: 'There is no pivot for ' + free.map(v => '$' + vname(v) + '$').join(', ') + ': ' + (free.length > 1 ? 'they are' : 'it is') + ' free, so there are infinitely many solutions.' });
      const sol = { vals: {}, free, lin: piv.map((c, i) => ({ v: cols[c], row: M[i] })), cols };
      return { ok: true, sols: [sol], steps };
    }
    const vals = {};
    piv.forEach((c, i) => { vals[cols[c]] = { q: M[i][cols.length] }; });
    steps.push({ text: 'Read off the solution:', tex: cols.map(v => vname(v) + ' = ' + numT(vals[v].q)).join(',\\quad ') });
    return { ok: true, sols: [{ vals, free: [] }], steps };
  }
  /** all solutions of grad = 0 found numerically (damped Newton from many starting points), each checked */
  function numSolve(grad, hess, vs, R) {
    const n = vs.length, found = [];
    const at = x => { const a = [0, 0, 0, 0, 0]; vs.forEach((v, i) => { a[v] = x[i]; }); return a; };
    const gf = grad.map(g => g.fn()), hf = hess.map(row => row.map(g => g.fn()));
    const G = x => { const a = at(x); return gf.map(g => g(a)); }, J = x => { const a = at(x); return hf.map(row => row.map(g => g(a))); };
    const norm = v => Math.sqrt(v.reduce((s, a) => s + a * a, 0));
    const solveLin = (A, b) => { // (AᵀA + λI) d = Aᵀb, small and safe
      const m = A.length, AtA = [], Atb = [];
      for (let i = 0; i < m; i++) { AtA.push([]); Atb.push(0); for (let j = 0; j < m; j++) { let s = 0; for (let k = 0; k < m; k++) s += A[k][i] * A[k][j]; AtA[i].push(s); } for (let k = 0; k < m; k++) Atb[i] += A[k][i] * b[k]; }
      const lam = 1e-14 * Math.max(...AtA.map((row, i) => row[i])) + 1e-300;
      for (let i = 0; i < m; i++) AtA[i][i] += lam;
      for (let c = 0; c < m; c++) { let p = c; for (let i = c + 1; i < m; i++) if (Math.abs(AtA[i][c]) > Math.abs(AtA[p][c])) p = i; [AtA[c], AtA[p]] = [AtA[p], AtA[c]]; [Atb[c], Atb[p]] = [Atb[p], Atb[c]]; if (Math.abs(AtA[c][c]) < 1e-300) return null; for (let i = c + 1; i < m; i++) { const f = AtA[i][c] / AtA[c][c]; for (let j = c; j < m; j++) AtA[i][j] -= f * AtA[c][j]; Atb[i] -= f * Atb[c]; } }
      const d = new Array(m).fill(0);
      for (let i = m - 1; i >= 0; i--) { let s = Atb[i]; for (let j = i + 1; j < m; j++) s -= AtA[i][j] * d[j]; d[i] = s / AtA[i][i]; }
      return d;
    };
    const per = n === 2 ? 9 : 5, starts = [];
    for (const scale of [R, R / 4]) {
      const pts = [];
      for (let i = 0; i < per; i++) pts.push(-scale + (2 * scale * (i + 0.37)) / per);
      if (n === 2) pts.forEach(a => pts.forEach(b => starts.push([a, b])));
      else pts.forEach(a => pts.forEach(b => pts.forEach(c => starts.push([a, b, c]))));
    }
    starts.push(new Array(n).fill(0));
    for (const s0 of starts) {
      let x = s0.slice(), g = G(x), ng = norm(g);
      for (let it = 0; it < 160 && ng > 1e-300; it++) {
        const d = solveLin(J(x), g);
        if (!d || !d.every(Number.isFinite)) break;
        let t = 1, xn, gn, nn;
        for (let k = 0; k < 30; k++) { xn = x.map((v, i) => v - t * d[i]); gn = G(xn); nn = norm(gn); if (nn < ng || t < 1e-6) break; t /= 2; }
        if (!(nn <= ng * 1.0000001)) break;
        x = xn; g = gn; ng = nn;
        if (norm(d) * t < 1e-15) break;
      }
      if (!(ng < 1e-8) || x.some(v => !Number.isFinite(v) || Math.abs(v) > 1e6)) continue;
      if (!found.some(y => norm(y.map((v, i) => v - x[i])) < 1e-6 * Math.max(1, norm(x)))) found.push(x);
    }
    // a nearby point with fraction coordinates that makes the gradient exactly zero is the point itself
    const out = [], seen = new Set();
    for (const x of found) {
      const qs = x.map(v => ratApprox(Math.abs(v) < 1e-5 ? 0 : v, 1000, 1e-6));
      const vals = {};
      if (qs.every(Boolean) && grad.every(g => g.ev((() => { const a = [Z, Z, Z, Z, Z]; vs.forEach((v, i) => { a[v] = qs[i]; }); return a; })()).isZero())) vs.forEach((v, i) => { vals[v] = { q: qs[i] }; });
      else vs.forEach((v, i) => { vals[v] = { q: null, x: x[i], t: null }; });
      const k = vs.map(v => (vals[v].q ? vals[v].q.str() : vals[v].x.toFixed(5))).join(',');
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ vals, free: [] });
    }
    return out;
  }

  /* ================================================================== "by the rules": how each derivative comes out */
  const ddT = v => '\\frac{\\partial}{\\partial ' + v + '}';
  function splitConst(t, v) {
    const fs = t.k === '*' ? t.a : [t];
    const c = fs.filter(f => !hasVar(f, v)), r = fs.filter(f => hasVar(f, v));
    return { c: c.length ? (c.length === 1 ? c[0] : { k: '*', a: c }) : null, r };
  }
  /** one sentence: which rule gives the derivative of the term t with respect to v (with the inner derivative's value) */
  function ruleFor(t, v, o) {
    if (!hasVar(t, v)) return 'There is no $' + v + '$ in $' + tx(t, o) + '$, so it is a constant: its derivative is $0$.';
    const { c, r } = splitConst(t, v);
    const pre = c ? 'The constant factor $' + tx(S(c), o) + '$ stays. ' : '';
    if (r.length > 1) {
      const den = r.filter(negExp), top = r.filter(f => !negExp(f));
      if (den.length) {
        const u = top.length ? (top.length === 1 ? top[0] : { k: '*', a: top }) : num(1);
        const w = S(den.length === 1 ? pow(den[0].b, num(den[0].e.v.neg())) : { k: '*', a: den.map(d => pow(d.b, num(d.e.v.neg()))) });
        return pre + 'Quotient rule $\\left(\\frac{u}{w}\\right)\' = \\frac{u\'w - uw\'}{w^2}$ with $u = ' + tx(u, o) + '$, $w = ' + tx(w, o) + '$, $u\' = ' + tx(S(D(u, v)), o) + '$ and $w\' = ' + tx(S(D(w, v)), o) + '$ (derivatives with respect to $' + v + '$).';
      }
      const u = r[0], w = r.length === 2 ? r[1] : { k: '*', a: r.slice(1) };
      return pre + 'Product rule $(uw)\' = u\'w + uw\'$ with $u = ' + tx(u, o) + '$ and $w = ' + tx(w, o) + '$: $u\' = ' + tx(S(D(u, v)), o) + '$, $w\' = ' + tx(S(D(w, v)), o) + '$.';
    }
    const g = r[0];
    const inner = (u, what) => (u.k === 'v' ? '' : ' Here $u = ' + tx(u, o) + '$ and $\\frac{\\partial u}{\\partial ' + v + '} = ' + tx(S(D(u, v)), o) + '$' + (what || '') + '.');
    if (g.k === 'v') return pre + 'The derivative of $' + v + '$ is $1$.';
    if (g.k === '^' && g.e.k === 'n' && !hasVar(g.e, v)) {
      const nn = g.e.v;
      if (g.b.k === 'v') return pre + 'Power rule: $' + ddT(v) + v + '^{n} = n' + v + '^{n-1}$, so $' + ddT(v) + tx(g, o) + ' = ' + tx(S(D(g, v)), o) + '$.';
      if (nn.eq(F(1, 2))) return pre + 'Chain rule: the derivative of $\\sqrt{u}$ is $\\frac{1}{2\\sqrt{u}}\\cdot\\frac{\\partial u}{\\partial ' + v + '}$.' + inner(g.b);
      if (nn.eq(-1)) return pre + 'Chain rule: the derivative of $\\frac{1}{u}$ is $-\\frac{1}{u^{2}}\\cdot\\frac{\\partial u}{\\partial ' + v + '}$.' + inner(g.b);
      return pre + 'Chain rule with the power rule: the derivative of $u^{n}$ is $nu^{n-1}\\cdot\\frac{\\partial u}{\\partial ' + v + '}$.' + inner(g.b);
    }
    if (g.k === '^' && !hasVar(g.b, v)) return pre + 'The derivative of $a^{u}$ ($a$ a constant) is $a^{u}\\log a\\cdot\\frac{\\partial u}{\\partial ' + v + '}$.' + inner(g.e);
    if (g.k === '^') return pre + 'Write $u^{w} = e^{w\\log u}$ and use the chain rule and the product rule.';
    if (g.k === 'f') {
      const said = { sin: 'the derivative of $\\sin u$ is $\\cos u$', cos: 'the derivative of $\\cos u$ is $-\\sin u$', tan: 'the derivative of $\\tan u$ is $\\frac{1}{\\cos^{2} u}$', exp: 'the derivative of $e^{u}$ is $e^{u}$', log: 'the derivative of $\\log u$ is $\\frac{1}{u}$' }[g.n];
      if (g.a.k === 'v') return pre + said[0].toUpperCase() + said.slice(1).replace(/u/g, v) + '.';
      return pre + 'Chain rule: ' + said + ', times $\\frac{\\partial u}{\\partial ' + v + '}$.' + inner(g.a);
    }
    if (g.k === '+') return pre + 'Differentiate the bracket term by term.';
    return pre + 'Differentiate as in one-variable calculus.';
  }
  /** the steps of ∂f/∂v by the rules (lecture 9.2: hold the other variables constant) → { res: tree, steps } */
  function explainD(f, v, vars, o) {
    const res = deriv(f, v), others = vars.filter(w => w !== v);
    const steps = [{ text: 'Hold ' + others.map(w => '$' + w + '$').join(' and ') + ' constant: treat ' + (others.length > 1 ? 'them' : 'it') + ' like a number, and differentiate with respect to $' + v + '$ only, as in one-variable calculus.' }];
    if (f.k === '+') {
      steps.push({ text: 'The derivative of a sum is the sum of the derivatives, so take the terms one at a time.' });
      const rs = f.a.map(t => S(D(t, v)));
      f.a.forEach((t, i) => steps.push({ text: ruleFor(t, v, o), tex: ddT(v) + '\\left(' + tx(t, o) + '\\right) = ' + tx(rs[i], o) }));
      const sumT = tx({ k: '+', a: rs }, o), resT = tx(res, o);
      steps.push({ text: 'Add them:', tex: 'f_{' + v + '} = ' + sumT + (sumT !== resT ? ' = ' + resT : '') });
    } else {
      const raw = S(D(f, v)), rawT = tx(raw, o), resT = tx(res, o);
      steps.push({ text: ruleFor(f, v, o), tex: 'f_{' + v + '} = ' + ddT(v) + '\\left(' + tx(f, o) + '\\right) = ' + rawT + (rawT !== resT ? ' = ' + resT : '') });
    }
    return { res, steps };
  }

  /* ================================================================== the page: controls and their frame */
  const safe = s => REV.esc(String(s)).replace(/\$/g, '&#36;');
  let uidN = 0;
  const hasDec = n => (n.k === 'n' ? !!n.d : n.k === 'f' ? hasDec(n.a) : n.k === '^' ? hasDec(n.b) || hasDec(n.e) : Array.isArray(n.a) ? n.a.some(hasDec) : false);
  /** rebuild the controls, keeping the keyboard focus (and the caret at the end of a text box) */
  function refill(box, fill) {
    const all = () => [...box.querySelectorAll('button, input, select')];
    const i = all().indexOf(document.activeElement);
    box.innerHTML = '';
    fill();
    const el = i >= 0 ? all()[i] : null;
    if (el) {
      el.focus({ preventScroll: true });
      if (el.tagName === 'INPUT' && el.type === 'text') { const n = el.value.length; try { el.setSelectionRange(n, n); } catch (e) { /* not a text box */ } }
    }
  }
  /** the frame every topic shares: values from the link (fixed by fix), controls built by ui, output drawn by draw */
  function topic(el, query, ctx, defaults, fix) {
    const t = { ui: () => {}, draw: () => {} };
    t.s = K.state(ctx, defaults, query, () => t.draw());
    fix(t.s.v);
    const f = K.layout(el);
    f.controls.classList.add('mv-controls');
    t.controls = f.controls;
    t.out = f.out;
    /** a Try example: every value from the defaults, then the example's own */
    t.load = patch => { t.s.set({ ...defaults, ...patch }, true); fix(t.s.v); refill(t.controls, t.ui); t.draw(); };
    t.start = (ui, draw) => {
      t.ui = ui;
      t.draw = () => {
        t.out.innerHTML = '';
        try { draw(); }
        catch (e) {
          if (!(e instanceof MathError)) console.error(e);
          t.out.append(K.note(e instanceof MathError ? safe(e.message) : 'This could not be worked out: ' + safe(e.message), 'warn'));
        }
      };
      refill(t.controls, ui);
      t.draw();
    };
    return t;
  }
  /** a text box that is checked as it is typed and used when the typing stops (or on Enter) */
  function entry({ label, value, help, placeholder, check, onCommit, mode }) {
    const id = 'mv' + (++uidN);
    const input = h('input', { id, class: 'field', type: 'text', value: value == null ? '' : String(value), placeholder: placeholder || null, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', inputmode: mode || 'text', enterkeyhint: 'done' });
    const err = h('div', { class: 'lk-err', hidden: true });
    let timer = 0, last = input.value;
    const test = () => { const m = check ? check(input.value) : null; err.hidden = !m; err.textContent = m || ''; input.classList.toggle('bad', !!m); return !m; };
    const commit = () => { clearTimeout(timer); if (test() && input.value !== last) { last = input.value; onCommit(input.value); } };
    input.addEventListener('input', () => { clearTimeout(timer); if (test()) timer = setTimeout(commit, 600); });
    input.addEventListener('change', commit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    const box = h('div', { class: 'lk-field' }, h('label', { for: id, html: K.rich(label) }), input, err, help ? h('div', { class: 'lk-help', html: K.rich(help) }) : null);
    box.input = input;
    test();
    return box;
  }
  /** the function box, with how the lab reads it shown under it */
  function fnEntry(t, o = {}) {
    const show = h('div', { class: 'mv-show' });
    const paint = src => {
      try { const f = parse(src); show.innerHTML = K.kx('f(' + (o.two || !hasVar(f, 'z') ? 'x, y' : 'x, y, z') + ') = ' + tx(f, { dec: hasDec(f) }), false); }
      catch (e) { show.innerHTML = ''; }
    };
    const box = entry({
      label: 'Your function $f$', value: t.s.v.f, placeholder: o.placeholder || 'x^2 + 3xy - y^2',
      check: src => { try { const f = parse(src); if (o.two && hasVar(f, 'z')) return 'This topic uses functions of x and y only: take the z out.'; return o.check ? o.check(f) : null; } catch (e) { return e.message; } },
      onCommit: v => t.s.set({ f: v }),
      help: 'Use x, y' + (o.two ? '' : ', z') + ', numbers, + − * / ^, brackets, and sin, cos, tan, exp, log, sqrt, pi, e. Write 3xy for $3 \\cdot x \\cdot y$ and e^(xy) for $e^{xy}$.',
    });
    box.input.addEventListener('input', () => paint(box.input.value));
    box.insertBefore(show, box.input.nextSibling);
    paint(t.s.v.f);
    return box;
  }
  /** a coordinate of the point: a number, or a formula without x, y, z (pi/2, sqrt(2)) */
  function readCoord(src, name) {
    let tr;
    try { tr = parse(src); } catch (e) { throw new MathError('The ' + name + '-coordinate of your point: ' + e.message); }
    if (usesAny(tr, XYZ)) throw new MathError('The ' + name + '-coordinate of your point must be a number such as 1, −2, 1/2 or pi/2, not a formula with x, y or z.');
    const x = compile(tr)({});
    if (!Number.isFinite(x)) throw new MathError('The ' + name + '-coordinate of your point is not a number.');
    if (Math.abs(x) > 1e4) throw new MathError('Keep the ' + name + '-coordinate of your point between −10000 and 10000.');
    const q = evx(tr, {});
    return { tr, x, q: q && q !== UNDEF ? q : null };
  }
  /** the x, y (and z) boxes of the point; box.setN(2 or 3) shows or hides z */
  function pointEntry(t, two) {
    const mk = (k, v) => entry({ label: '$' + v + '$', value: t.s.v[k], check: s => { try { readCoord(s, v); return null; } catch (e) { return e.message; } }, onCommit: x => t.s.set({ [k]: x }), mode: 'text' });
    const fa = mk('a', 'x'), fb = mk('b', 'y'), fc = two ? null : mk('c', 'z'), row = h('div', { class: 'mv-row' }, fa, fb, fc), lab = h('div', { class: 'lk-label' });
    const box = h('div', { class: 'lk-field' }, lab, row, h('div', { class: 'lk-help', text: 'Numbers such as 1, −2, 1/2, 0.5 or pi/2.' }));
    box.setN = n => { if (fc) fc.hidden = n !== 3; row.style.setProperty('--n', n); lab.innerHTML = K.rich('Your point $' + (n === 3 ? '(a, b, c)' : '(a, b)') + '$'); };
    box.setN(2);
    return box;
  }
  /** a number box for m, k, a value or an angle: a fraction or decimal (or empty when allowed) */
  function numEntry(t, key_, label, help, optional) {
    return entry({ label, value: t.s.v[key_], help, mode: 'text', check: s => { if (optional && !String(s).trim()) return null; try { readNum(s, 'This'); return null; } catch (e) { return e.message; } }, onCommit: v => t.s.set({ [key_]: v }) });
  }
  function readNum(src, what) {
    let tr;
    try { tr = parse(src); } catch (e) { throw new MathError(what + ': ' + e.message); }
    if (usesAny(tr, XYZ)) throw new MathError(what + ' must be a number, without x, y or z.');
    const x = compile(tr)({});
    if (!Number.isFinite(x) || Math.abs(x) > 1e4) throw new MathError(what + ' must be a number between −10000 and 10000.');
    const q = evx(tr, {});
    return q && q !== UNDEF ? { q, x: q.num(), t: null } : { q: null, x, t: tx(tr) };
  }
  const W_OPTS = [[0, 'automatic'], [0.5, '±0.5'], [1, '±1'], [2, '±2'], [3, '±3'], [5, '±5'], [10, '±10'], [20, '±20']];
  const wOf = w => (Number.isFinite(+w) && +w >= 0 ? Math.min(100, +w) : 0);
  const winSelect = t => K.select({ label: 'Picture window around the point', options: W_OPTS.some(([v]) => v === t.s.v.w) ? W_OPTS : [...W_OPTS, [t.s.v.w, '±' + t.s.v.w]], value: t.s.v.w, onChange: v => t.s.set({ w: +v }) });
  /** "Try" chips: each loads a lecture example ([label, values, where it comes from]) */
  const tries = (list, load) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try an example from the lectures' }),
    h('div', { class: 'lk-presets' }, list.map(([label, patch, title]) => h('button', { type: 'button', class: 'lk-chip mv-try', text: label, title: title || null, onclick: () => load(patch) }))));

  /** read the function and the point from the link values: { f, vars, n, o, pt, P, exact, fl, ex, tex } */
  function readAll(t, opt = {}) {
    const f = parse(t.s.v.f);
    if (opt.two && hasVar(f, 'z')) throw new MathError('This topic uses functions of x and y only: take the z out of your function.');
    const vars = hasVar(f, 'z') ? ['x', 'y', 'z'] : ['x', 'y'];
    if (t.ptBox) t.ptBox.setN(vars.length);
    const P = {}, pt = {}, keys = { x: 'a', y: 'b', z: 'c' };
    vars.forEach(v => { P[v] = readCoord(t.s.v[keys[v]], v); pt[v] = P[v].q ? num(P[v].q) : P[v].tr; });
    const exact = vars.every(v => P[v].q);
    return {
      f, vars, n: vars.length, o: { dec: hasDec(f) }, P, pt, exact,
      fl: Object.fromEntries(vars.map(v => [v, P[v].x])),
      ex: Object.fromEntries(vars.filter(v => P[v].q).map(v => [v, P[v].q])),
      tex: '(' + vars.map(v => (P[v].q ? numT(P[v].q) : tx(P[v].tr))).join(', ') + ')',
      coT: v => (P[v].q ? numT(P[v].q) : tx(P[v].tr)),
    };
  }
  /** TeX to plain text for labels drawn in a picture: \frac{1}{2}x → 1/2x, x^2 → x² */
  const plainT = tex => tex.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2').replace(/\^2/g, '²').replace(/\\left|\\right|\\,/g, '').replace(/[{}\\]/g, '').replace(/-/g, '−');
  /** the largest number used as a power in the tree (x^9 → 9) */
  const maxPow = n => (n.k === '^' && n.e.k === 'n' ? Math.max(Math.abs(n.e.v.num()), maxPow(n.b)) : n.k === 'f' ? maxPow(n.a) : Array.isArray(n.a) ? Math.max(0, ...n.a.map(maxPow)) : 0);
  /** one formula on its own line (display maths, scrolling sideways when long) */
  const mathBlock = tex => h('div', { class: 'lk-md', html: K.wrap(tex) });
  /** a vector of values as TeX: (2, 4, 6) */
  const vecT = vals => '\\left(' + vals.join(', ') + '\\right)';
  const fArgs = vars => vars.join(', ');
  /** f(x, y) as a function of the point coordinates, for pictures */
  const f2 = (cf, vars, fixed) => (vars.length === 3 ? (x, y) => cf({ x, y, z: fixed }) : (x, y) => cf({ x, y }));

  /* ================================================================== pictures */
  let plotN = 0;
  function niceTicks(lo, hi, n = 5) {
    const span = hi - lo;
    if (!(span > 0) || !Number.isFinite(span)) return [lo];
    const raw = span / n, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const st = [1, 2, 2.5, 5, 10].map(m => m * mag).find(x => x >= raw * 0.999);
    const out = [];
    for (let k = Math.ceil(lo / st - 1e-9); k * st <= hi + 1e-9 * span; k++) out.push(+(k * st).toPrecision(12));
    return out;
  }
  const tickS = v => { const a = Math.abs(v); if (a !== 0 && (a < 1e-3 || a >= 1e5)) return v.toExponential(0).replace('-', '−'); return String(+v.toFixed(3)).replace('-', '−'); };
  const MS = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 6: [[0, 2]], 7: [[2, 3]], 8: [[2, 3]], 9: [[0, 2]], 11: [[1, 2]], 12: [[1, 3]], 13: [[0, 1]], 14: [[0, 3]] };
  /** the pieces of the level curve f = c on an (N+1)×(N+1) grid of values (marching squares): [[i1, j1, i2, j2], …] in grid steps */
  function isoSegs(g, N, c, jump) {
    const out = [], M = N + 1;
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const v0 = g[j * M + i], v1 = g[j * M + i + 1], v2 = g[(j + 1) * M + i + 1], v3 = g[(j + 1) * M + i];
      if (!(Number.isFinite(v0) && Number.isFinite(v1) && Number.isFinite(v2) && Number.isFinite(v3))) continue;
      const k = (v0 > c ? 1 : 0) | (v1 > c ? 2 : 0) | (v2 > c ? 4 : 0) | (v3 > c ? 8 : 0);
      if (k === 0 || k === 15) continue;
      if (Math.max(v0, v1, v2, v3) - Math.min(v0, v1, v2, v3) > jump) continue;   // a jump (a pole or a break), not a crossing
      const at = e => (e === 0 ? [i + (c - v0) / (v1 - v0), j] : e === 1 ? [i + 1, j + (c - v1) / (v2 - v1)] : e === 2 ? [i + (c - v3) / (v2 - v3), j + 1] : [i, j + (c - v0) / (v3 - v0)]);
      let pairs = MS[k];
      if (k === 5 || k === 10) { const mid = (v0 + v1 + v2 + v3) / 4 > c; pairs = (k === 5) === mid ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]]; }
      for (const [p, q] of pairs) { const A = at(p), B = at(q); out.push([A[0], A[1], B[0], B[1]]); }
    }
    return out;
  }
  /** the levels to draw between the 4th and the 96th percentile of f on the window, at round numbers */
  function autoLevels(fxy, x0, x1, y0, y1, c0) {
    const vals = [];
    for (let j = 0; j <= 30; j++) for (let i = 0; i <= 30; i++) { const v = fxy(x0 + ((x1 - x0) * (i + 0.37)) / 31, y0 + ((y1 - y0) * (j + 0.29)) / 31); if (Number.isFinite(v)) vals.push(v); }
    if (!vals.length) return [];
    vals.sort((p, q) => p - q);
    let lo = vals[Math.floor(vals.length * 0.04)], hi = vals[Math.floor(vals.length * 0.96)];
    if (Number.isFinite(c0)) { lo = Math.min(lo, c0); hi = Math.max(hi, c0); }
    if (!(hi - lo > 1e-12)) return [Number.isFinite(c0) ? c0 : lo];
    return niceTicks(lo, hi, 8);
  }
  /** level curves of fxy in a window: o = { fxy, x0, x1, y0, y1, levels: [{ c, cls, style, main, text }], point: [a, b],
      arrows: [{ dx, dy, cls, fill, label }], lines: [{ dx, dy }], paths: [{ pts, cls, label }], marks: [{ x, y, shape, label, title }], aria, readout } */
  function contour(o) {
    const W = 360, H = 360, L = 38, R = 10, T = 10, B = 30, pw = W - L - R, ph = H - T - B;
    const X = x => L + ((x - o.x0) / (o.x1 - o.x0)) * pw, Y = y => T + ((o.y1 - y) / (o.y1 - o.y0)) * ph;
    const id = 'mvclip' + ++plotN;
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mv-plot', role: 'img', 'aria-label': o.aria || 'level curves of f' });
    svg.append(K.sv('defs', {}, K.sv('clipPath', { id }, K.sv('rect', { x: L, y: T, width: pw, height: ph }))), K.sv('rect', { x: L, y: T, width: pw, height: ph, class: 'bg' }));
    niceTicks(o.x0, o.x1).forEach(v => { if (v >= o.x0 && v <= o.x1) svg.append(K.sv('line', { x1: X(v), x2: X(v), y1: T, y2: T + ph, class: 'gl' }), K.sv('text', { x: X(v), y: T + ph + 16, 'text-anchor': 'middle', class: 'tk' }, tickS(v))); });
    niceTicks(o.y0, o.y1).forEach(v => { if (v >= o.y0 && v <= o.y1) svg.append(K.sv('line', { x1: L, x2: L + pw, y1: Y(v), y2: Y(v), class: 'gl' }), K.sv('text', { x: L - 5, y: Y(v) + 4, 'text-anchor': 'end', class: 'tk' }, tickS(v))); });
    if (o.x0 < 0 && o.x1 > 0) svg.append(K.sv('line', { x1: X(0), x2: X(0), y1: T, y2: T + ph, class: 'ax' }));
    if (o.y0 < 0 && o.y1 > 0) svg.append(K.sv('line', { x1: L, x2: L + pw, y1: Y(0), y2: Y(0), class: 'ax' }));
    const N = o.N || 80, M = N + 1, hx = (o.x1 - o.x0) / N, hy = (o.y1 - o.y0) / N, sx = hx * 0.0123, sy = hy * 0.0171;
    const g = new Float64Array(M * M);
    for (let j = 0; j < M; j++) for (let i = 0; i < M; i++) g[j * M + i] = o.fxy(o.x0 + i * hx + sx, o.y0 + j * hy + sy);
    const cs = o.levels.map(l => l.c), spanL = cs.length > 1 ? Math.max(...cs) - Math.min(...cs) : Math.abs(cs[0] || 1) + 1, jump = 6 * spanL;
    const gx = i => X(o.x0 + i * hx + sx), gy = j => Y(o.y0 + j * hy + sy);
    const clip = K.sv('g', { 'clip-path': 'url(#' + id + ')' }), labs = [], main = [];
    for (const lv of o.levels) {
      const segs = isoSegs(g, N, lv.c, jump);
      if (!segs.length) continue;
      let d = '';
      for (const s of segs) d += 'M' + gx(s[0]).toFixed(1) + ' ' + gy(s[1]).toFixed(1) + 'L' + gx(s[2]).toFixed(1) + ' ' + gy(s[3]).toFixed(1);
      clip.append(K.sv('path', { d, class: 'lv ' + (lv.cls || ''), style: lv.style || null }, K.sv('title', {}, 'f = ' + decS(lv.c))));
      if (lv.main) segs.forEach(s => main.push([o.x0 + ((s[0] + s[2]) / 2) * hx + sx, o.y0 + ((s[1] + s[3]) / 2) * hy + sy]));
      if (lv.text !== false) labs.push({ lv, segs });
    }
    (o.lines || []).forEach(a => { const n = Math.hypot(a.dx, a.dy) || 1, k = 0.9 * Math.max(o.x1 - o.x0, o.y1 - o.y0); clip.append(K.sv('line', { x1: X(o.point[0] - (a.dx / n) * k), y1: Y(o.point[1] - (a.dy / n) * k), x2: X(o.point[0] + (a.dx / n) * k), y2: Y(o.point[1] + (a.dy / n) * k), class: 'tg s0', style: 'stroke-width: 1.5' })); });
    (o.paths || []).forEach(p => { let d = ''; p.pts.forEach(([x, y], i) => { d += (i && Number.isFinite(y) && Number.isFinite(x) ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1); }); clip.append(K.sv('path', { d, class: 'ln ' + p.cls })); });
    svg.append(clip, K.sv('rect', { x: L, y: T, width: pw, height: ph, class: 'fr' }));
    // labels: the paths' names first, then the level through the point, then other levels where there is room
    const placed = o.point ? [[X(o.point[0]), Y(o.point[1])]] : [];
    (o.marks || []).forEach(m => placed.push([X(m.x), Y(m.y)]));
    (o.paths || []).forEach(p => {
      if (!p.label) return;
      const n = p.pts.length;
      for (const fr of [0.93, 0.07, 0.8, 0.2, 0.66, 0.34]) {
        const [x, y] = p.pts[Math.round(fr * (n - 1))];
        const px = X(x), py = Y(y);
        if (!(px > L + 24 && px < L + pw - 24 && py > T + 14 && py < T + ph - 10)) continue;
        if (placed.some(([qx, qy]) => Math.hypot(qx - px, qy - py) < 36)) continue;
        placed.push([px, py]);
        svg.append(K.sv('text', { x: px + 6, y: py - 6, 'text-anchor': px > L + pw - 60 ? 'end' : 'start', class: 'lb strong' }, p.label));
        break;
      }
    });
    labs.sort((p, q) => (q.lv.main ? 1 : 0) - (p.lv.main ? 1 : 0));
    for (const { lv, segs } of labs) {
      let best = null, bd = -1;
      const stride = Math.max(1, Math.floor(segs.length / 50));
      for (let k = 0; k < segs.length; k += stride) {
        const s = segs[k], x = (gx(s[0]) + gx(s[2])) / 2, y = (gy(s[1]) + gy(s[3])) / 2;
        if (x < L + 16 || x > L + pw - 16 || y < T + 12 || y > T + ph - 8) continue;
        let dm = 1e9;
        for (const [px, py] of placed) dm = Math.min(dm, Math.hypot(px - x, py - y));
        if (dm > bd) { bd = dm; best = [x, y]; }
      }
      if (best && bd > 30) { placed.push(best); svg.append(K.sv('text', { x: best[0], y: best[1] + 4, 'text-anchor': 'middle', class: 'lb' + (lv.main ? ' strong' : '') }, lv.text || tickS(lv.c))); }
    }
    const arrowLabs = [];
    (o.arrows || []).forEach(a => {
      const x = X(o.point[0]), y = Y(o.point[1]), n = Math.hypot(a.dx, a.dy) || 1, ux = a.dx / n, uy = -a.dy / n, len = a.len || 70;
      const x2 = x + ux * len, y2 = y + uy * len, px = -uy, py = ux;
      svg.append(K.sv('line', { x1: x, y1: y, x2: x2 - ux * 8, y2: y2 - uy * 8, class: 'tg ' + a.cls, style: 'stroke-width: 2.5' }),
        K.sv('path', { d: 'M' + x2.toFixed(1) + ' ' + y2.toFixed(1) + 'L' + (x2 - ux * 12 + px * 5.5).toFixed(1) + ' ' + (y2 - uy * 12 + py * 5.5).toFixed(1) + 'L' + (x2 - ux * 12 - px * 5.5).toFixed(1) + ' ' + (y2 - uy * 12 - py * 5.5).toFixed(1) + 'Z', class: a.fill }));
      if (a.label) {
        let lx = x2 + ux * 14, ly = y2 + uy * 14;
        for (const side of [0, 1, -1, 2, -2]) { const cx = lx + px * 15 * side, cy = ly + py * 15 * side; if (!arrowLabs.some(([qx, qy]) => Math.hypot(qx - cx, qy - cy) < 20)) { lx = cx; ly = cy; break; } }
        arrowLabs.push([lx, ly]);
        svg.append(K.sv('text', { x: lx.toFixed(1), y: (ly + 4).toFixed(1), 'text-anchor': 'middle', class: 'lb strong' }, a.label));
      }
    });
    (o.marks || []).forEach(m => {
      const x = X(m.x), y = Y(m.y);
      if (x < L - 1 || x > L + pw + 1 || y < T - 1 || y > T + ph + 1) return;
      const grp = K.sv('g', {}, K.sv('title', {}, m.title || ''));
      if (m.shape === 'min') grp.append(K.sv('circle', { cx: x, cy: y, r: 6.5, class: 'f1 mk' }));
      else if (m.shape === 'max') grp.append(K.sv('path', { d: 'M' + x + ' ' + (y - 8.5) + 'L' + (x + 7.5) + ' ' + (y + 5.5) + 'L' + (x - 7.5) + ' ' + (y + 5.5) + 'Z', class: 'f2 mk' }));
      else if (m.shape === 'saddle') grp.append(K.sv('path', { d: 'M' + (x - 6) + ' ' + (y - 6) + 'L' + (x + 6) + ' ' + (y + 6) + 'M' + (x + 6) + ' ' + (y - 6) + 'L' + (x - 6) + ' ' + (y + 6), class: 'tg s3', style: 'stroke-width: 3.5' }));
      else grp.append(K.sv('path', { d: 'M' + x + ' ' + (y - 7) + 'L' + (x + 7) + ' ' + y + 'L' + x + ' ' + (y + 7) + 'L' + (x - 7) + ' ' + y + 'Z', class: 'mk', style: 'fill: var(--bg-elev); stroke: var(--ink); stroke-width: 2' }));
      if (m.label) grp.append(K.sv('text', { x: x + 10, y: y - 7, class: 'lb strong' }, m.label));
      svg.append(grp);
    });
    if (o.point) svg.append(K.sv('circle', { cx: X(o.point[0]), cy: Y(o.point[1]), r: 5, class: 'pt' }, K.sv('title', {}, 'your point')));
    svg.append(K.sv('text', { x: L + pw - 4, y: T + ph - 6, 'text-anchor': 'end', class: 'an' }, o.xName || 'x'), K.sv('text', { x: L + 6, y: T + 15, class: 'an' }, o.yName || 'y'));
    const hint = 'Move over the picture (or tap it) to read the value of f there.';
    const ro = h('div', { class: 'mv-readout', text: hint });
    const read = e => {
      const ctm = svg.getScreenCTM();
      if (!ctm) return;
      const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY;
      const q = p.matrixTransform(ctm.inverse());
      if (q.x < L || q.x > L + pw || q.y < T || q.y > T + ph) { ro.textContent = hint; return; }
      const x = o.x0 + ((q.x - L) / pw) * (o.x1 - o.x0), y = o.y1 - ((q.y - T) / ph) * (o.y1 - o.y0);
      ro.textContent = (o.readout ? o.readout(x, y) : 'At (' + decS(x) + ', ' + decS(y) + '): f = ' + decS(o.fxy(x, y)));
    };
    svg.addEventListener('pointermove', read);
    svg.addEventListener('pointerdown', read);
    const wrap = h('div', {}, h('div', { class: 'lk-chart-wrap' }, svg), ro);
    wrap.main = main;
    return wrap;
  }
  /** the graph of a function of one variable: o = { fn, t0, t1, tName, yName, mark: [t, v], slope, aria } */
  function graph1(o) {
    const W = 360, H = 200, L = 46, R = 10, T = 10, B = 28, pw = W - L - R, ph = H - T - B, n = 240, xs = [], ys = [];
    for (let i = 0; i <= n; i++) { const t = o.t0 + ((o.t1 - o.t0) * i) / n; xs.push(t); ys.push(o.fn(t)); }
    const fin = ys.filter(Number.isFinite).sort((p, q) => p - q);
    let lo = fin.length ? fin[Math.floor(fin.length * 0.03)] : -1, hi = fin.length ? fin[Math.max(0, Math.ceil(fin.length * 0.97) - 1)] : 1;
    if (o.mark && Number.isFinite(o.mark[1])) { lo = Math.min(lo, o.mark[1]); hi = Math.max(hi, o.mark[1]); }
    if (!(hi - lo > 1e-9 * Math.max(1, Math.abs(hi)))) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.12;
    lo -= pad; hi += pad;
    const X = t => L + ((t - o.t0) / (o.t1 - o.t0)) * pw, Y = v => T + ((hi - v) / (hi - lo)) * ph;
    const id = 'mvclip' + ++plotN;
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'mv-plot wide', role: 'img', 'aria-label': o.aria || 'graph' });
    svg.append(K.sv('defs', {}, K.sv('clipPath', { id }, K.sv('rect', { x: L, y: T, width: pw, height: ph }))), K.sv('rect', { x: L, y: T, width: pw, height: ph, class: 'bg' }));
    niceTicks(o.t0, o.t1).forEach(v => { if (v >= o.t0 && v <= o.t1) svg.append(K.sv('line', { x1: X(v), x2: X(v), y1: T, y2: T + ph, class: 'gl' }), K.sv('text', { x: X(v), y: T + ph + 16, 'text-anchor': 'middle', class: 'tk' }, tickS(v))); });
    niceTicks(lo, hi, 4).forEach(v => { if (v >= lo && v <= hi) svg.append(K.sv('line', { x1: L, x2: L + pw, y1: Y(v), y2: Y(v), class: 'gl' }), K.sv('text', { x: L - 5, y: Y(v) + 4, 'text-anchor': 'end', class: 'tk' }, tickS(v))); });
    if (lo < 0 && hi > 0) svg.append(K.sv('line', { x1: L, x2: L + pw, y1: Y(0), y2: Y(0), class: 'ax' }));
    if (o.t0 < 0 && o.t1 > 0) svg.append(K.sv('line', { x1: X(0), x2: X(0), y1: T, y2: T + ph, class: 'ax' }));
    let d = '', pen = false;
    for (let i = 0; i <= n; i++) {
      const v = ys[i], ok = Number.isFinite(v) && Math.abs(v) < 1e9 && !(pen && Math.abs(v - ys[i - 1]) > 4 * (hi - lo));
      if (ok) { d += (pen ? 'L' : 'M') + X(xs[i]).toFixed(1) + ' ' + Y(v).toFixed(1); pen = true; } else pen = false;
    }
    const clip = K.sv('g', { 'clip-path': 'url(#' + id + ')' });
    if (o.mark && Number.isFinite(o.slope) && Number.isFinite(o.mark[1])) {
      const [a, v] = o.mark;
      clip.append(K.sv('line', { x1: X(o.t0), y1: Y(v + o.slope * (o.t0 - a)), x2: X(o.t1), y2: Y(v + o.slope * (o.t1 - a)), class: 'band' }));
    }
    clip.append(K.sv('path', { d, class: 'cv' }));
    svg.append(clip, K.sv('rect', { x: L, y: T, width: pw, height: ph, class: 'fr' }));
    if (o.mark && Number.isFinite(o.mark[1])) svg.append(K.sv('circle', { cx: X(o.mark[0]), cy: Y(o.mark[1]), r: 5, class: 'pt' }));
    svg.append(K.sv('text', { x: L + pw - 4, y: T + ph - 6, 'text-anchor': 'end', class: 'an' }, o.tName || 't'), K.sv('text', { x: L + 6, y: T + 15, class: 'an' }, o.yName || ''));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** a legend under a picture: [[key class or '', label with $maths$], …] */
  const legend = items => h('div', { class: 'mv-legend' }, items.map(([cls, label, sym]) => h('span', {}, sym ? h('span', { class: 'mv-sym', html: sym }) : h('i', { class: 'mv-key ' + cls }), h('span', { html: K.rich(label) }))));
  /** levels coloured on both sides of the level c0 through the point: lower in blue, higher in orange, c0 itself thick, in the text colour */
  function divergingLevels(cs, c0) {
    const tol = 1e-9 * Math.max(1, Math.abs(c0));
    const lower = cs.filter(c => c < c0 - tol).sort((p, q) => q - p), upper = cs.filter(c => c > c0 + tol).sort((p, q) => p - q);
    const tone = (k, n) => Math.round(55 + (45 * (k + 1)) / Math.max(1, n));
    const out = [];
    lower.forEach((c, k) => out.push({ c, style: 'stroke: color-mix(in oklab, var(--mv1) ' + tone(k, lower.length) + '%, var(--bg-elev))' }));
    upper.forEach((c, k) => out.push({ c, style: 'stroke: color-mix(in oklab, var(--mv2) ' + tone(k, upper.length) + '%, var(--bg-elev))' }));
    if (Number.isFinite(c0)) out.push({ c: c0, cls: 'lv0', main: true });
    return out;
  }
  /** the window [x0, x1] × [y0, y1] of half-width w around (a, b) */
  const box2 = (a, b, w) => ({ x0: a - w, x1: a + w, y0: b - w, y1: b + w });

  /* ================================================================== first principles: f along a line or a path, exactly */
  /** f(P + h·e) for rational f, a rational point P and a rational direction e, as N(h)/D(h) (h is slot t) */
  function ratAlong(R, P, e, vars) {
    const tP = Poly.v(3);
    let N = R.n, Dn = rDen(R);
    vars.forEach(v => { const i = PV.indexOf(v), q = Poly.c(P[v]).add(tP.scale(e[v] || Z)); N = N.subst(i, q); Dn = Dn.subst(i, q); });
    return { N, D: Dn };
  }
  /** the limit of (N(h)/D(h) − c0)/h as h → 0: { kind: 'val', L } or { kind: 'inf' } or { kind: 'undef' }, with M = N − c0·D */
  function quotLimit(N, Dn, c0) {
    if (Dn.isZero()) return { kind: 'undef' };
    const Mq = N.sub(Dn.scale(c0));
    if (Mq.isZero()) return { kind: 'val', L: Z, M: Mq };
    const pM = Mq.minDeg(3), pD = Dn.minDeg(3) + 1;
    if (pM > pD) return { kind: 'val', L: Z, M: Mq, pM, pD };
    if (pM === pD) return { kind: 'val', L: Mq.coef(3, pM).cval().div(Dn.coef(3, pD - 1).cval()), M: Mq, pM, pD };
    return { kind: 'inf', M: Mq, pM, pD };
  }
  /** the limit of N(t)/D(t) as t → 0 (coefficients may hold the symbol m, slot 4) */
  function ratLimit0(N, Dn) {
    if (Dn.isZero()) return { kind: 'undef' };
    if (N.isZero()) return { kind: 'val', L: Rn(Poly.c(0)), pN: Infinity, pD: Dn.minDeg(3) };
    const pN = N.minDeg(3), pD = Dn.minDeg(3), cN = N.coef(3, pN), cD = Dn.coef(3, pD);
    if (pN > pD) return { kind: 'val', L: Rn(Poly.c(0)), pN, pD, cN, cD };
    if (pN === pD) return { kind: 'val', L: simpQ(cN, cD), pN, pD, cN, cD };
    return { kind: 'inf', pN, pD, cN, cD };
  }
  /** cN/cD in the symbol m with common factors cancelled (Euclid's algorithm in one variable) */
  function simpQ(cN, cD) {
    if (cD.isConst()) return Rn(cN.scale(ONE.div(cD.cval())));
    const g = gcdU(cN, cD, 4);
    let n = cN, d = cD;
    if (g && !g.isConst()) { n = pdiv(cN, g) || cN; d = pdiv(cD, g) || cD; }
    const { c, p } = prim(d);
    return { n: n.scale(ONE.div(c)), dpoly: p };
  }
  function gcdU(a, b, i) {
    const lc = (P) => P.coef(i, P.deg(i)).cval();
    let A = a, B = b;
    for (let guard = 0; guard < 50 && !B.isZero(); guard++) {
      let r = A;
      while (!r.isZero() && r.deg(i) >= B.deg(i)) { const k = r.deg(i) - B.deg(i), e = [0, 0, 0, 0, 0]; e[i] = k; const m = new Poly(); m.t.set(e.join(), lc(r).div(lc(B))); r = r.sub(m.mul(B)); }
      A = B; B = r;
    }
    return A.isZero() ? null : A;
  }
  /** TeX of a limit in m: a fraction of polynomials, or a number */
  const limQT = (L, o) => (L.dpoly ? '\\frac{' + tx(polyTree(L.n), o) + '}{' + tx(polyTree(L.dpoly), o) + '}' : tx(polyTree(L.n), o));
  const limQconst = L => (!L.dpoly && L.n.isConst() ? L.n.cval() : null);
  const limQat = (L, m) => { const vals = [Z, Z, Z, Z, m]; const top = L.n.ev(vals); if (!L.dpoly) return top; const bot = L.dpoly.ev(vals); return bot.isZero() ? null : top.div(bot); };

  /* ================================================================== small TeX helpers for the topics */
  /** "(x - 1)", "(y + 2)", "x" (when the point's coordinate is 0) */
  function shiftT(v, P) {
    if (P.q) { if (P.q.isZero()) return v; return '(' + v + (P.q.cmp(0) > 0 ? ' - ' : ' + ') + numT(P.q.cmp(0) > 0 ? P.q : P.q.neg()) + ')'; }
    const s = tx(P.tr);
    return '(' + v + (s[0] === '-' ? ' + ' + s.slice(1) : ' - ' + s) + ')';
  }
  /** join TeX terms with + and −: ["1", "-2(z + 1)"] → "1 - 2(z + 1)" */
  const joinT = list => list.reduce((s, p, i) => (i === 0 ? p : p[0] === '-' ? s + ' - ' + p.slice(1) : s + ' + ' + p), '');
  /** a value in a product, bracketed when it is negative or a fraction: "(-1)", "\left(\frac{4}{5}\right)" */
  const facT = (v, dec) => { const s = v instanceof Q2 ? v.tex(dec) : vT(v, dec); return /^-|\\frac|\\sqrt|\+/.test(s) ? '\\left(' + s + '\\right)' : s; };
  /** f(1 + h, 2): the point with coordinate v moved by h·e_v */
  const movedT = (A, e) => 'f(' + A.vars.map(v => { const p = A.ex[v], c = e[v] || Z; if (c.isZero()) return numT(p); const hT = c.eq(1) ? 'h' : c.eq(-1) ? '-h' : numT(c) + 'h'; return p.isZero() ? hT : numT(p) + (hT[0] === '-' ? ' - ' + hT.slice(1) : ' + ' + hT); }).join(', ') + ')';
  const shiftH = (P, k) => { const r = new Poly(); for (const [kk, c] of P.t) { const e = ex(kk); e[3] -= k; r.t.set(e.join(), c); } return r; };
  /** the definition worked out exactly (rational f, fraction point and direction): its steps and the limit */
  function defSteps(f, R, A, e, c0, o) {
    const { N, D: Dn } = ratAlong(R, A.ex, e, A.vars);
    const res = quotLimit(N, Dn, c0);
    const arg = movedT(A, e), base = 'f' + A.tex;
    if (res.kind === 'undef') return { res, steps: [{ text: '$f$ is not defined along this line, so the definition cannot be used.' }] };
    const oo = { ...o, ren: { t: 'h' } }, pT_ = P => polyByT(P, 3, oo);
    const one = Dn.isConst() && Dn.cval().eq(1);
    const fracT = (top, bot) => (one || top.isZero() ? pT_(top) : '\\frac{' + pT_(top) + '}{' + pT_(bot) + '}');
    const map = {};
    A.vars.forEach(v => { const p = A.ex[v], c = e[v] || Z, hT = c.eq(1) ? V('h') : mul(num(c), V('h')); map[v] = c.isZero() ? subNode(num(p)) : p.isZero() ? hT : add(subNode(num(p)), hT); });
    const steps = [{ text: 'Put the moved point into $f$ and multiply out:', tex: arg + ' = ' + tx(subst(f, map), o) + ' = ' + fracT(N, Dn) }];
    const Mq = N.sub(Dn.scale(c0));
    steps.push({ text: 'Subtract $' + base + ' = ' + numT(c0, o.dec) + '$:', tex: arg + ' - ' + base + ' = ' + (Mq.isZero() ? '0' : fracT(Mq, Dn)) });
    const q = '\\frac{' + arg + ' - ' + base + '}{h}';
    if (Mq.isZero()) steps.push({ text: 'So the quotient is $0$ for every $h \\ne 0$, and its limit is $0$.', tex: q + ' = 0' });
    else if (Mq.minDeg(3) >= 1) steps.push({ text: 'Divide by $h$ (it is not zero):', tex: q + ' = ' + fracT(shiftH(Mq, 1), Dn) });
    else steps.push({ text: 'Divide by $h$:', tex: q + ' = \\frac{' + pT_(Mq) + '}{' + (one ? 'h' : 'h\\left(' + pT_(Dn) + '\\right)') + '}' });
    if (!Mq.isZero()) {
      if (res.kind === 'val') steps.push({ text: 'Let $h \\to 0$: every term that still has an $h$ goes to $0$.', tex: '\\lim_{h \\to 0}' + q + ' = ' + numT(res.L, o.dec) });
      else steps.push({ text: 'As $h \\to 0$ the top does not go to $0$ as fast as the bottom: the quotient grows without bound, so <b>this limit does not exist</b>.' });
    }
    return { res, steps };
  }
  /** a table of difference quotients (f(P + h e) − f(P))/h for h → 0 (e: numbers), with the value c0 used at the point */
  function quotTable(cf, A, e, c0x, o, exactR) {
    const hs = [0.1, 0.01, 0.001, 0.0001, -0.0001, -0.001, -0.01, -0.1], c0n = F.is(c0x) ? c0x.num() : c0x;
    const rows = hs.map(hh => {
      const env = {};
      A.vars.forEach((v, i) => { env[v] = A.fl[v] + hh * e[i]; });
      let fv = cf(env), qv = (fv - c0n) / hh;
      const eq = e.map(c => (F.is(c) ? c : Number.isInteger(c) ? F(c) : null));
      if (exactR && A.exact && eq.every(Boolean)) {
        const H = F.parse(String(hh)), envQ = [Z, Z, Z, Z, Z];
        A.vars.forEach((v, i) => { envQ[PV.indexOf(v)] = A.ex[v].add(H.mul(eq[i])); });
        const den = rDen(exactR).ev(envQ);
        if (!den.isZero()) { const fq = exactR.n.ev(envQ).div(den); fv = fq; qv = fq.sub(F.is(c0x) ? c0x : F.parse(String(c0x))).div(H); }
      }
      const show = v => (F.is(v) ? (v.exactDecimal(8) ? decStr(v) : '\\approx ' + decT(v.num(), 6)) : Number.isFinite(v) ? '\\approx ' + decT(v, 6) : '\\text{undefined}');
      return ['$' + (hh > 0 ? '' : '-') + decStr(F.parse(String(Math.abs(hh)))) + '$', '$' + show(fv) + '$', '$' + show(qv) + '$'];
    });
    return rows;
  }

  /* ================================================================== the topics */
  REV.lab('multivar', {
    /* ---------------------------------------------------------------- surface */
    // ?f=x^2+y^2&a=1&b=1&c=0&levels=auto&w=0   f = a function of x and y (or of x, y, z: then its level surfaces and the slice
    //   z = c); a, b, c = the point (c only when f has z); levels = auto, or up to 12 numbers separated by commas (0,1,2,4);
    //   w = the half-width of the picture around the point (0 = automatic, which is 3; else 0.5 to 100)
    surface(el, query, ctx) {
      const t = topic(el, query, ctx, { f: 'x^2+y^2', a: '1', b: '1', c: '0', levels: 'auto', w: 0 }, v => { v.w = wOf(v.w); });
      const { s } = t;
      t.start(() => {
        t.ptBox = pointEntry(t);
        t.controls.append(
          K.p('A function of two variables gives a height $f(x, y)$ above every point $(x, y)$. The points where $f$ has the same value $c$ form a <b>level curve</b>, like a contour line on a map.'),
          fnEntry(t), t.ptBox,
          entry({ label: 'Levels $c$ to draw', value: s.v.levels, placeholder: 'auto', help: 'auto, or numbers separated by commas (at most 12), for example 0, 1, 2, 4.', check: src => { try { readLevels(src); return null; } catch (e) { return e.message; } }, onCommit: v => s.set({ levels: v }) }),
          winSelect(t),
          tries([
            ['x² + y², a bowl', { f: 'x^2+y^2', a: '1', b: '1' }, 'Lectures 10.4 and 11.2: the bowl x² + y², lowest at (0, 0)'],
            ['sin(x² + y²): circles', { f: 'sin(x^2+y^2)', a: '1', b: '0' }, 'Lecture 9.1: sin(x² + y²) moves in circles'],
            ['xy/(x² + y²)', { f: 'xy/(x^2+y^2)', a: '1', b: '1', w: 2 }, 'Lecture 9.1: a rational function, not defined at (0, 0)'],
            ['2.5x − 3.9y: a plane', { f: '2.5x-3.9y', a: '1', b: '1' }, 'Lecture 9.1: a linear function; its graph is a plane'],
            ['The bivariate normal', { f: '1/(2pi)e^(-(x^2+y^2)/2)', a: '1', b: '0' }, 'Lecture 9.1: the bivariate normal density'],
            ['10e^(−2x − 5y)', { f: '10e^(-2x-5y)', a: '0', b: '0', w: 1 }, 'Lecture 9.1: two independent exponentials'],
            ['The 9.1 polynomial', { f: '2x^3-3y^2+4.8x^2y-9.9xy+pi', a: '1', b: '1' }, 'Lecture 9.1: 2x³ − 3y² + 4.8x²y − 9.9xy + π'],
            ['x² − y², a saddle', { f: 'x^2-y^2', a: '1', b: '0' }, 'Lecture 10.4: the saddle x² − y²'],
            ['x² + y² + z²: spheres', { f: 'x^2+y^2+z^2', a: '1', b: '1', c: '1' }, 'Lectures 9.1 and 10.1: x² + y² + z²'],
          ], t.load));
      }, draw);
      function readLevels(src) {
        const str = String(src == null ? '' : src).trim().toLowerCase();
        if (!str || str === 'auto') return null;
        const parts = str.split(/[,;]+/).map(x => x.trim()).filter(Boolean);
        if (parts.length > 12) throw new MathError('At most 12 levels.');
        return [...new Set(parts.map(p => readNum(p, 'A level').x))].sort((p, q) => p - q);
      }
      function draw() {
        const out = t.out, A = readAll(t), { f, vars, n, o } = A, cf = compile(f);
        const v0 = valueAt(f, A.pt), c0 = v0.undef ? NaN : vNum(v0), fT = 'f(' + fArgs(vars) + ')', what = n === 3 ? 'surface' : 'curve';
        const chain = v0.undef ? null : evalChain(f, A.pt, o).tex;
        if (v0.undef) out.append(K.note('$f$ has no value at your point $' + A.tex + '$ (it would divide by zero, take the log or square root of a negative number, or be too large to compute), so no level ' + what + ' passes through it. Choose another point.', 'warn'));
        else out.append(K.answer('The value at your point: the level ' + what + ' through it is $' + fT + ' = ' + vT(v0, o.dec) + '$', 'f' + A.tex + ' = ' + chain));
        const w = s.v.w || 3, a = A.fl.x, b = A.fl.y, fxy = f2(cf, vars, n === 3 ? A.fl.z : 0), win = box2(a, b, w);
        const typed = readLevels(s.v.levels);
        const cs = typed || autoLevels(fxy, win.x0, win.x1, win.y0, win.y1, c0);
        const pic = contour({ fxy, ...win, levels: divergingLevels(cs, c0), point: [a, b], aria: 'level curves of f around your point' });
        const keyEl = legend([['k1', 'levels below your point’s'], ['k2', 'levels above it'], ['', Number.isFinite(c0) ? 'the level through your point, $c = ' + vT(v0, o.dec) + '$' : 'your point (dot)']]);
        if (n === 2) {
          out.append(K.card('What a level curve is', K.steps([
            { text: 'The graph of $f$ is the surface $z = f(x, y)$: above each point $(x, y)$ of the plane it has height $f(x, y)$ (lecture 9.1 draws such surfaces).' },
            { text: 'Cut the surface at a height $c$. The points $(x, y)$ where $f(x, y) = c$ form the <b>level curve</b> of $f$ at level $c$. Drawn together, level curves are a map of the surface, like the contour lines of a hill.' },
            v0.undef ? { text: 'Your point $' + A.tex + '$: $f$ is not defined there.' } : { text: 'Your point: put $x = ' + A.coT('x') + '$ and $y = ' + A.coT('y') + '$ into $f$:', tex: 'f' + A.tex + ' = ' + chain },
            v0.undef ? null : { text: 'So your point lies on the level curve', tex: tx(f, o) + ' = ' + vT(v0, o.dec) },
          ].filter(Boolean))));
          out.append(K.card('The level curves', K.p('Each curve joins the points where $f$ has the value written on it' + (typed ? '' : ' (levels at round numbers across the picture)') + '. Where the curves crowd together $f$ changes fast; where they are far apart it changes slowly.'), pic, keyEl));
          const gx = S(subst(f, { y: A.pt.y })), gy = S(subst(f, { x: A.pt.x }));
          out.append(K.card('Slices: one variable at a time',
            K.p('Fix $y = ' + A.coT('y') + '$ and let only $x$ change: the plane $y = ' + A.coT('y') + '$ cuts the surface in a curve, the graph of a function of $x$ alone (lecture 9.2 cuts the graphs the same way). The dot is your point.'),
            mathBlock('g(x) = f(x, ' + A.coT('y') + ') = ' + tx(gx, o)),
            graph1({ fn: x => cf({ x, y: b }), t0: a - w, t1: a + w, mark: [a, c0], tName: 'x', yName: 'f(x, ' + decS(b) + ')', aria: 'f along the line y = b' }),
            K.p('Fix $x = ' + A.coT('x') + '$ and let only $y$ change:'),
            mathBlock('k(y) = f(' + A.coT('x') + ', y) = ' + tx(gy, o)),
            graph1({ fn: y => cf({ x: a, y }), t0: b - w, t1: b + w, mark: [b, c0], tName: 'y', yName: 'f(' + decS(a) + ', y)', aria: 'f along the line x = a' })));
        } else {
          const desc = v0.undef ? null : describeSurface(f, v0);
          out.append(K.card('Level surfaces', K.steps([
            { text: 'For $f(x, y, z)$ the graph would need four dimensions, so instead we look at <b>level surfaces</b>: all the points $(x, y, z)$ where $f(x, y, z) = c$ (lecture 9.1 shows $x^2 + y^2 + z^2$).' },
            v0.undef ? { text: 'Your point $' + A.tex + '$: $f$ is not defined there.' } : { text: 'Your point: put $x = ' + A.coT('x') + '$, $y = ' + A.coT('y') + '$ and $z = ' + A.coT('z') + '$ into $f$:', tex: 'f' + A.tex + ' = ' + chain },
            v0.undef ? null : { text: 'So your point lies on the level surface', tex: tx(f, o) + ' = ' + vT(v0, o.dec) },
            desc || { text: 'A surface is hard to draw on a flat page, so the picture below shows a slice of it.' },
          ].filter(Boolean))));
          out.append(K.card('A slice: the plane $z = ' + A.coT('z') + '$', K.p('Keep $z = ' + A.coT('z') + '$ fixed. The level surfaces of $f$ cut this plane in the level curves of $f(x, y, ' + A.coT('z') + ')$; the thick curve is where the level surface through your point meets the plane.'), pic, keyEl));
        }
        // check: two far-apart points of the thick curve give the same value
        if (pic.main.length >= 2 && Number.isFinite(c0)) {
          const p1 = pic.main[0];
          let p2 = pic.main[1], dmax = -1;
          pic.main.forEach(q => { const dd = Math.hypot(q[0] - p1[0], q[1] - p1[1]); if (dd > dmax) { dmax = dd; p2 = q; } });
          const u1 = fxy(p1[0], p1[1]), u2 = fxy(p2[0], p2[1]), tol = 0.02 * Math.max(1e-9, cs.length > 1 ? Math.max(...cs) - Math.min(...cs) : Math.abs(c0) + 1);
          const ok = Math.abs(u1 - c0) < tol && Math.abs(u2 - c0) < tol;
          const zz = n === 3 ? ', ' + A.coT('z') : '';
          out.append(K.card('Check', K.p('Two points read off the thick curve, far apart: $f(' + decT(p1[0], 3) + ', ' + decT(p1[1], 3) + zz + ') \\approx ' + decT(u1, 4) + '$ and $f(' + decT(p2[0], 3) + ', ' + decT(p2[1], 3) + zz + ') \\approx ' + decT(u2, 4) + '$. Along a level curve $f$ does not change, so both should be $' + vT(v0, o.dec) + '$ (up to the small error of reading the curve off a grid).'), K.note(ok ? 'Both values match the level ✓' : 'The values do not match ✗', ok ? 'good' : 'warn')));
        }
      }
    },

    /* ---------------------------------------------------------------- limit */
    // ?f=xy/(x^2+y^2)&a=0&b=0&m=1&k=1&v=&w=0   f = a function of x and y; (a, b) = the point; m = the slope of the line
    //   y − b = m(x − a); k = the number in the parabolas y − b = k(x − a)² and x − a = k(y − b)²; v = the value f is given at
    //   the point when its formula is not defined there (empty = none; it decides continuity); m, k, v are numbers such as
    //   2, -1/2 or 0.5; w = the half-width of the picture (0 = automatic, which is 1)
    limit(el, query, ctx) {
      const t = topic(el, query, ctx, { f: 'xy/(x^2+y^2)', a: '0', b: '0', m: '1', k: '1', v: '', w: 0 }, v => { v.w = wOf(v.w); });
      const { s } = t;
      t.start(() => {
        t.ptBox = pointEntry(t, true);
        t.controls.append(
          K.p('Walk towards a point along different paths and watch the values of $f$. If two paths lead to different values, the limit does not exist (lecture 9.5).'),
          fnEntry(t, { two: true, placeholder: 'xy/(x^2 + y^2)' }), t.ptBox,
          h('div', { class: 'mv-row', style: '--n: 2' }, numEntry(t, 'm', 'Slope $m$ (lines)', null), numEntry(t, 'k', 'Number $k$ (parabolas)', null)),
          numEntry(t, 'v', 'The value $f(a, b)$, when the formula is not defined there', 'Leave it empty if $f$ has no value there. Lecture 9.5 gives these functions the value 0 at (0, 0).', true),
          winSelect(t),
          tries([
            ['xy/(x² + y²)', { f: 'xy/(x^2+y^2)', a: '0', b: '0', m: '1', k: '1', v: '0' }, 'Lecture 9.5: the axes give 0 but the line y = x gives 1/2'],
            ['(x² − y²)/(x² + y²)', { f: '(x^2-y^2)/(x^2+y^2)', a: '0', b: '0', m: '1', k: '1' }, 'Lecture 9.5: the x-axis gives 1, the y-axis gives −1'],
            ['(x³ − xy²)/(x² + y²)²', { f: '(x^3-xy^2)/(x^2+y^2)^2', a: '0', b: '0', m: '1', k: '1', v: '0' }, 'Lectures 9.4 and 9.5: along the x-axis the values grow without bound'],
            ['xy²/(x² + y⁴)', { f: 'xy^2/(x^2+y^4)', a: '0', b: '0', m: '1', k: '1', v: '0' }, 'Lecture 9.5 and the Week 9 tutorial: every line gives 0, the parabola x = y² gives 1/2'],
            ['x²y/(x³ + y³)', { f: 'x^2y/(x^3+y^3)', a: '0', b: '0', m: '1', k: '1', v: '0' }, 'Week 9 tutorial: along y = mx the limit is m/(1 + m³)'],
            ['sin(xy)/(xy)', { f: 'sin(xy)/(xy)', a: '0', b: '0', m: '1', k: '1' }, 'Lecture 9.5: write u = xy; sin u / u → 1'],
            ['x²y + y³ at (1, 2)', { f: 'x^2y+y^3', a: '1', b: '2' }, 'Lecture 9.5: a polynomial, so substitute: 10'],
            ['e^(xy) at (1, 2)', { f: 'e^(xy)', a: '1', b: '2' }, 'Lecture 9.5: a composition, so substitute: e²'],
            ['(x² − 1)/(y³ − 2) at (1, 2)', { f: '(x^2-1)/(y^3-2)', a: '1', b: '2' }, 'Lecture 9.5: the bottom is not 0, so substitute: 0'],
          ], t.load));
      }, draw);
      function draw() {
        const out = t.out, A = readAll(t, { two: true }), { f, o } = A, cf = compile(f);
        const m = readNum(s.v.m, 'The slope m'), kk = readNum(s.v.k, 'The number k');
        const given = String(s.v.v).trim() === '' ? null : readNum(s.v.v, 'The value at the point');
        const v0 = valueAt(f, A.pt), a = A.fl.x, b = A.fl.y;
        const origin = A.exact && A.ex.x.isZero() && A.ex.y.isZero();
        const aT = A.coT('x'), bT = A.coT('y'), mT = m.q ? numT(m.q) : m.t, kT = kk.q ? numT(kk.q) : kk.t;
        const lim = '\\lim_{(x, y) \\to ' + A.tex + '} f(x, y)';
        const cT = (c, rest) => (c === '1' ? rest : c === '-1' ? '-' + rest : (/\\frac|\\pi|\\sqrt/.test(c) && c[0] !== '-' ? c + ' ' : c) + rest);
        const xs = origin ? 'x' : shiftT('x', A.P.x), ys = origin ? 'y' : shiftT('y', A.P.y);
        const paths = [
          { id: 'h', cls: 's1', name: origin ? 'the $x$-axis' : 'the line $y = ' + bT + '$', eq: 'y = ' + bT, at: u => [a + u, b] },
          { id: 'v', cls: 's1', name: origin ? 'the $y$-axis' : 'the line $x = ' + aT + '$', eq: 'x = ' + aT, at: u => [a, b + u] },
          { id: 'm', cls: 's2', name: 'the line $' + ys + ' = ' + cT(mT, xs) + '$', eq: ys + ' = ' + cT(mT, xs), at: u => [a + u, b + m.x * u] },
          { id: 'p', cls: 's3', name: 'the parabola $' + ys + ' = ' + cT(kT, origin ? 'x^2' : xs + '^2') + '$', eq: ys + ' = ' + cT(kT, origin ? 'x^2' : xs + '^2'), at: u => [a + u, b + kk.x * u * u] },
          { id: 'q', cls: 's3', name: 'the parabola $' + xs + ' = ' + cT(kT, origin ? 'y^2' : ys + '^2') + '$', eq: xs + ' = ' + cT(kT, origin ? 'y^2' : ys + '^2'), at: u => [a + kk.x * u * u, b + u] },
        ];
        const ns = [1, 10, 100, 1000, 10000];
        const valAt = (p, u) => { const [x, y] = p.at(u); const r = cf({ x, y }); return Number.isFinite(r) ? r : NaN; };
        const table = K.table(['$n$', ...paths.map(p => '$' + p.eq + '$')], ns.map(nn => ['$' + nn + '$', ...paths.map(p => { const r = valAt(p, 1 / nn); return Number.isFinite(r) ? '$' + decT(r, 6) + '$' : '—'; })]), { compact: true });
        const tableNote = K.p('Row $n$: the point of each path with ' + (origin ? '$x = \\frac{1}{n}$' : '$x = ' + aT + ' + \\frac{1}{n}$') + ' (for the last path, ' + (origin ? '$y = \\frac{1}{n}$' : '$y = ' + bT + ' + \\frac{1}{n}$') + '), coming closer as $n$ grows, like the sequences of lectures 9.4 and 9.5. A dash means $f$ is not defined there.');
        const w = s.v.w || 1, win = box2(a, b, w), fxy = (x, y) => cf({ x, y });
        const pts = p => { const arr = []; for (let i = -60; i <= 60; i++) arr.push(p.at((i / 60) * 1.5 * w)); return arr; };
        const pic = contour({ fxy, ...win, levels: autoLevels(fxy, win.x0, win.x1, win.y0, win.y1, NaN).map(c => ({ c, cls: 'lvn' })), point: [a, b], paths: paths.map(p => ({ pts: pts(p), cls: p.cls, label: plainT(p.eq) })), aria: 'level curves of f and the paths to the point' });
        const keyEl = legend([['k1', origin ? 'the axes' : 'the lines through the point parallel to the axes'], ['k2', 'the line with slope $m = ' + mT + '$'], ['k3', 'the two parabolas'], ['grey', 'level curves of $f$']]);
        const picCard = K.card('The paths in a picture', K.p('The point is the dot. Each coloured path runs into it; the grey curves are level curves of $f$. Where many level curves meet at the point, $f$ takes many values close to it.'), pic, keyEl);
        const tableCard = K.card('Values along the paths', tableNote, table);
        const R = ratOf(f);
        // the value exists: continuity by the rules (lecture 9.4)
        if (!v0.undef) {
          const chain = evalChain(f, A.pt, o).tex;
          out.append(K.answer('The limit, by putting in the point', lim + ' = ' + chain, '$f$ is continuous at $' + A.tex + '$: the limit is its value there.'));
          out.append(K.card('Why putting in the point works here', K.steps([
            { text: '$f$ is made of polynomials, sums, products, quotients and the functions sin, cos, tan, exp, log, sqrt. Each of these is continuous wherever it is defined, and so are sums, products, quotients (with a bottom that is not 0) and compositions of them (lecture 9.4: the limit rules and the composition rule).' },
            { text: 'At your point everything is defined: no division by zero, no log or square root of a negative number. So the limit is the value at the point:', tex: lim + ' = f' + A.tex + ' = ' + chain },
            { text: 'In particular every path into the point gives this same value, as the table below shows.' },
          ])));
          out.append(tableCard, picCard);
          return;
        }
        // f is not defined at the point: limits along paths
        const results = [];
        let verdict = null;
        if (R && A.exact && m.q && kk.q) {
          const P0 = A.ex;
          const steps = [];
          const ren = p => ({ ...o, ren: { t: origin ? (p.id === 'v' || p.id === 'q' ? 'y' : 'x') : 't', m: p.id === 'm' ? 'm' : 'k' } });
          for (const p of paths) {
            const sp = pathRat(R, P0.x, P0.y, p.id, p.id === 'h' || p.id === 'v' ? Z : null);
            const spec = p.id === 'h' || p.id === 'v' ? sp : pathRat(R, P0.x, P0.y, p.id, p.id === 'm' ? m.q : kk.q);
            results.push({ p, gen: sp, spec });
            const oo = ren(p), par = oo.ren.t;
            // the substitution shown with the letters of the lecture
            const tv = V(par), mv = V(oo.ren.m);
            const map = {};
            if (origin) {
              if (p.id === 'h') map.y = subNode(num(0));
              if (p.id === 'v') map.x = subNode(num(0));
              if (p.id === 'm') map.y = mul(mv, tv);
              if (p.id === 'p') map.y = mul(mv, pow(tv, num(2)));
              if (p.id === 'q') map.x = mul(mv, pow(tv, num(2)));
            } else {
              const ax = add(subNode(num(P0.x)), tv), by = add(subNode(num(P0.y)), tv);
              if (p.id === 'h') { map.x = ax; map.y = subNode(num(P0.y)); }
              if (p.id === 'v') { map.x = subNode(num(P0.x)); map.y = by; }
              if (p.id === 'm') { map.x = ax; map.y = add(subNode(num(P0.y)), mul(mv, tv)); }
              if (p.id === 'p') { map.x = ax; map.y = add(subNode(num(P0.y)), mul(mv, pow(tv, num(2)))); }
              if (p.id === 'q') { map.x = add(subNode(num(P0.x)), mul(mv, pow(tv, num(2)))); map.y = by; }
            }
            const g = sp.lim;
            const what = origin ? (p.id === 'h' ? 'put $y = 0$ and let $x \\to 0$' : p.id === 'v' ? 'put $x = 0$ and let $y \\to 0$' : p.id === 'm' ? 'put $y = mx$ (any slope $m$) and let $x \\to 0$' : p.id === 'p' ? 'put $y = kx^2$ and let $x \\to 0$' : 'put $x = ky^2$ and let $y \\to 0$')
              : (p.id === 'h' ? 'put $x = ' + aT + ' + t$, $y = ' + bT + '$' : p.id === 'v' ? 'put $x = ' + aT + '$, $y = ' + bT + ' + t$' : p.id === 'm' ? 'put $x = ' + aT + ' + t$, $y = ' + bT + ' + mt$' : p.id === 'p' ? 'put $x = ' + aT + ' + t$, $y = ' + bT + ' + kt^2$' : 'put $x = ' + aT + ' + kt^2$, $y = ' + bT + ' + t$') + ' and let $t \\to 0$';
            const argT = 'f(' + tx(map.x || V('x'), oo) + ', ' + tx(map.y || V('y'), oo) + ')';
            if (g.kind === 'undef') { steps.push({ text: '<b>Along ' + p.name + '</b>: $f$ is not defined anywhere on this path, so it says nothing.' }); continue; }
            const one = sp.D.isConst() && sp.D.cval().eq(1);
            const fracT = (N, Dd) => ((Dd.isConst() && Dd.cval().eq(1)) || N.isZero() ? polyByT(N, 3, oo) : '\\frac{' + polyByT(N, 3, oo) + '}{' + polyByT(Dd, 3, oo) + '}');
            let texs = argT + ' = ' + tx(subst(f, map), oo) + ' = ' + fracT(sp.N, sp.D);
            if (g.kind === 'val' && Number.isFinite(g.pN) && Math.min(g.pN, g.pD) > 0) { const kc = Math.min(g.pN, g.pD); texs += ' = ' + fracT(shiftH(sp.N, kc), shiftH(sp.D, kc)); }
            else if (g.kind === 'inf' && g.pN > 0) texs += ' = ' + fracT(shiftH(sp.N, g.pN), shiftH(sp.D, g.pN));
            const lead = '<b>' + (p.id === 'm' ? (origin ? 'Along the lines $y = mx$' : 'Along the lines through the point with slope $m$') : p.id === 'p' ? (origin ? 'Along the parabolas $y = kx^2$' : 'Along the parabolas $y - b = k(x - a)^2$') : p.id === 'q' ? (origin ? 'Along the parabolas $x = ky^2$' : 'Along the parabolas $x - a = k(y - b)^2$') : 'Along ' + p.name) + '</b>: ' + what + (one ? '' : ' (for $' + par + ' \\ne 0$)') + '.';
            steps.push({ text: lead, tex: texs });
            if (g.kind === 'inf') steps.push({ text: 'As $' + par + ' \\to 0$ the bottom goes to $0$ but the top does not: the values grow without bound. <b>No limit along this path.</b>' });
            else {
              const Lc = limQconst(g.L);
              if (Lc) steps.push({ text: 'Let $' + par + ' \\to 0$:', tex: '\\lim_{' + par + ' \\to 0} ' + argT + ' = ' + numT(Lc, o.dec) });
              else steps.push({ text: 'Let $' + par + ' \\to 0$: the limit depends on $' + oo.ren.m + '$, a different value for each ' + (p.id === 'm' ? 'slope' : 'parabola') + ':', tex: '\\lim_{' + par + ' \\to 0} ' + argT + ' = ' + limQT(g.L, oo) });
            }
          }
          out.append(K.card('The limit along each path (exact)', K.steps(steps)));
          // the verdict
          const vals = [];
          const constOf = r => (r.spec.lim.kind === 'val' ? limQconst(r.spec.lim.L) || (r.spec.lim.L.n.isZero() ? Z : null) : null);
          const blow = results.find(r => r.spec.lim.kind === 'inf');
          const ax = results.filter(r => r.p.id === 'h' || r.p.id === 'v').map(r => ({ p: r.p, L: constOf(r) })).filter(x => x.L);
          if (blow) verdict = { dne: true, why: 'Along ' + blow.p.name + ' the values grow without bound.' };
          else if (ax.length === 2 && !ax[0].L.eq(ax[1].L)) verdict = { dne: true, why: 'Along ' + ax[0].p.name + ' the limit is $' + numT(ax[0].L) + '$, but along ' + ax[1].p.name + ' it is $' + numT(ax[1].L) + '$.' };
          for (const r of verdict ? [] : results) {
            if (r.gen.lim.kind === 'val' && !limQconst(r.gen.lim.L) && (r.p.id === 'm' || r.p.id === 'p' || r.p.id === 'q')) {
              const letter = r.p.id === 'm' ? 'm' : 'k', tryV = [0, 1, -1, 2, F(1, 2), 3].map(x => F.is(x) ? x : F(x));
              const got = [];
              for (const mv of tryV) { const L = limQat(r.gen.lim.L, mv); if (L && !got.some(g2 => g2.L.eq(L))) got.push({ mv, L }); if (got.length === 2) break; }
              if (got.length === 2) { verdict = { dne: true, why: 'The limit along ' + (r.p.id === 'm' ? 'the lines' : 'the parabolas') + ' depends on $' + letter + '$: $' + letter + ' = ' + numT(got[0].mv) + '$ gives $' + numT(got[0].L) + '$ but $' + letter + ' = ' + numT(got[1].mv) + '$ gives $' + numT(got[1].L) + '$.' }; break; }
            }
            if (r.spec.lim.kind === 'val') { const L = limQconst(r.spec.lim.L) || (r.spec.lim.L.n.isZero() ? Z : null); if (L) vals.push({ p: r.p, L }); }
          }
          if (!verdict) {
            const d = vals.find(x => !x.L.eq(vals[0].L));
            if (d) verdict = { dne: true, why: 'Along ' + vals[0].p.name + ' the limit is $' + numT(vals[0].L) + '$, but along ' + d.p.name + ' it is $' + numT(d.L) + '$.' };
            else if (vals.length) verdict = { dne: false, L: vals[0].L };
          }
        } else {
          // numbers only (f is not a fraction of polynomials, or the point or m, k are not fractions)
          const est = paths.map(p => {
            const near = [1e-3, 1e-4, 1e-5].flatMap(u => [valAt(p, u), valAt(p, -u)]);
            if (near.every(x => !Number.isFinite(x))) return { p, kind: 'undef' };
            const fin = near.filter(Number.isFinite);
            if (fin.some(x => Math.abs(x) > 1e6) || Math.abs(near[4]) > 10 * Math.max(1, Math.abs(near[0]))) return { p, kind: 'inf' };
            const spread = Math.max(...fin) - Math.min(...fin);
            return { p, kind: spread < 1e-3 * Math.max(1, Math.abs(fin[fin.length - 1])) ? 'val' : 'unclear', L: near[4] };
          });
          const okE = est.filter(e => e.kind === 'val');
          const inf = est.find(e => e.kind === 'inf');
          const diff = okE.find(e => Math.abs(e.L - okE[0].L) > 1e-3 * Math.max(1, Math.abs(okE[0].L)));
          if (inf) verdict = { dne: true, numeric: true, why: 'Along ' + inf.p.name + ' the values seem to grow without bound.' };
          else if (diff) verdict = { dne: true, numeric: true, why: 'Along ' + okE[0].p.name + ' the values approach about $' + decT(okE[0].L, 4) + '$, along ' + diff.p.name + ' about $' + decT(diff.L, 4) + '$.' };
          else if (okE.length) verdict = { dne: false, numeric: true, Lx: okE[0].L };
          const und = est.filter(e => e.kind === 'undef');
          out.append(K.card('The limit along each path (from the numbers)', K.p('$f$ is not a fraction of two polynomials' + (R ? ' with fraction numbers' : '') + ', so this lab reads the limits off the values below instead of working them out exactly. Numbers can suggest a limit but never prove one.'),
            und.length ? K.note('$f$ is not defined along ' + und.map(e => e.p.name).join(' and ') + ', so ' + (und.length > 1 ? 'those paths say' : 'that path says') + ' nothing.', '') : null,
            K.steps(est.filter(e => e.kind !== 'undef').map(e => ({ text: 'Along ' + e.p.name + ': ' + (e.kind === 'inf' ? 'the values grow without bound.' : e.kind === 'val' ? 'the values approach about $' + decT(e.L, 4) + '$.' : 'the values do not settle down.') })))));
          if (key(f) === key(parse('sin(xy)/(xy)'))) out.append(K.note('Lecture 9.5 proves this limit: write $u = xy$. As $(x, y) \\to (0, 0)$, $u \\to 0$, and $\\frac{\\sin u}{u} \\to 1$ (one-variable calculus), so by the composition rule the limit is $1$.', 'good'));
        }
        // answer first
        const ansT = verdict && verdict.dne ? lim + '\\ \\text{does not exist}' : verdict ? lim + (verdict.numeric ? ' \\approx ' + decT(verdict.Lx, 4) + '\\ \\text{(if it exists)}' : ' = ' + numT(verdict.L) + '\\ \\text{(if it exists)}') : lim + '\\ ?';
        const ansNote = verdict && verdict.dne ? verdict.why + ' A limit must be the same along every path (lecture 9.5).' : verdict ? 'Every path tried gives this value. That makes the limit likely, but paths alone can never prove a limit exists: there are infinitely many paths (lecture 9.5; the Week 9 tutorial shows a function where every line agrees but a parabola does not).' : 'The paths tried say nothing here.';
        out.prepend(K.answer('The limit at $' + A.tex + '$, where the formula of $f$ is not defined', ansT, ansNote));
        out.append(tableCard, picCard);
        // continuity
        const cont = [];
        if (verdict && verdict.dne) cont.push({ text: 'The limit does not exist, so $f$ is <b>not continuous</b> at $' + A.tex + '$, whatever value $f$ is given there (lecture 9.5).' });
        else if (!given) cont.push({ text: 'The formula does not give $f$ a value at $' + A.tex + '$, so $f$ is not continuous there as it stands. Give $f$ a value at the point (the box on the left) to ask whether that makes it continuous.' });
        else if (verdict && !verdict.numeric) cont.push({ text: 'Continuity needs the limit to equal the value: $f' + A.tex + ' = ' + vT(given) + '$ against the limit $' + numT(verdict.L) + '$ (if the limit exists).', tex: given.q && given.q.eq(verdict.L) ? '\\text{equal: continuous at the point, if the limit exists}' : '\\text{not equal: not continuous}' });
        else if (verdict) cont.push({ text: 'Continuity needs the limit to equal the value: $f' + A.tex + ' = ' + vT(given) + '$ against a limit of about $' + decT(verdict.Lx, 4) + '$.', tex: Math.abs(vNum(given) - verdict.Lx) < 1e-3 * Math.max(1, Math.abs(verdict.Lx)) ? '\\text{they agree}' : '\\text{not equal: not continuous}' });
        out.append(K.card('Continuity at the point', K.p('$f$ is continuous at a point when its limit there exists and equals its value there (lecture 9.5).'), K.steps(cont)));
      }
    },

    /* ---------------------------------------------------------------- partial */
    // ?f=x^2+3xy-y^2&a=1&b=2&c=0&d=x&v=&w=0   f = a function of x, y (or x, y, z); a, b, c = the point; d = the variable worked
    //   out in detail (x, y or z); v = the value f is given at the point when its formula is not defined there (empty = none;
    //   then only the definition can give the partial derivatives there); w = the half-width of the picture (0 = automatic, 2)
    partial(el, query, ctx) {
      const t = topic(el, query, ctx, { f: 'x^2+3xy-y^2', a: '1', b: '2', c: '0', d: 'x', v: '', w: 0 }, v => { v.w = wOf(v.w); if (!['x', 'y', 'z'].includes(v.d)) v.d = 'x'; });
      const { s } = t;
      t.start(() => {
        t.ptBox = pointEntry(t);
        t.dBox = h('div', {});
        t.dN = 0;
        t.controls.append(
          K.p('A partial derivative is the rate of change of $f$ when only one variable changes and the others are held fixed (lecture 9.2).'),
          fnEntry(t), t.ptBox, t.dBox,
          numEntry(t, 'v', 'The value $f(a, b)$, when the formula is not defined there', 'Leave it empty when $f$ is defined at your point. Lecture 9.2 gives $\\frac{xy}{x^2 + y^2}$ the value 0 at (0, 0).', true),
          winSelect(t),
          tries([
            ['x + y at (0, 0)', { f: 'x+y', a: '0', b: '0', d: 'x' }, 'Lecture 9.2: the rate of change with respect to x is 1'],
            ['xy + yz + zx at (1, 2, 3), ∂/∂y', { f: 'xy+yz+zx', a: '1', b: '2', c: '3', d: 'y' }, 'Lecture 9.2: (h + 3h)/h = 4'],
            ['sin(xy) at (1, 0), ∂/∂x', { f: 'sin(xy)', a: '1', b: '0', d: 'x' }, 'Lecture 9.2: 0'],
            ['sin(xy) at (1, 0), ∂/∂y', { f: 'sin(xy)', a: '1', b: '0', d: 'y' }, 'Lecture 9.2: sin h / h → 1'],
            ['xy/(x² + y²) at (0, 0)', { f: 'xy/(x^2+y^2)', a: '0', b: '0', d: 'x', v: '0' }, 'Lecture 9.2: from the definition both partial derivatives are 0'],
            ['e^(xy)', { f: 'e^(xy)', a: '1', b: '1', d: 'x' }, 'Week 9 tutorial: f_x = y e^(xy)'],
            ['sin(xy): mixed partials', { f: 'sin(xy)', a: '1', b: '2', d: 'x' }, 'Lecture 11.1: f_xy = f_yx = cos(xy) − xy sin(xy)'],
            ['f_xy ≠ f_yx at (0, 0)', { f: 'xy(x^2-y^2)/(x^2+y^2)', a: '0', b: '0', d: 'x', v: '0' }, 'Lecture 11.1: an example advising caution'],
          ], t.load));
      }, draw);
      function draw() {
        const out = t.out, A = readAll(t), { f, vars, n, o } = A, cf = compile(f);
        if (t.dN !== n) { t.dBox.innerHTML = ''; t.dBox.append(K.seg({ label: 'Work out in detail', options: vars.map(v => [v, '∂f/∂' + v]), value: vars.includes(s.v.d) ? s.v.d : 'x', onChange: v => s.set({ d: v }) })); t.dN = n; }
        const d = vars.includes(s.v.d) ? s.v.d : 'x';
        const v0 = valueAt(f, A.pt);
        const given = String(s.v.v).trim() === '' ? null : readNum(s.v.v, 'The value at the point');
        const c0 = v0.undef ? given : v0;
        const R = ratOf(f), e = Object.fromEntries(vars.map(v => [v, v === d ? ONE : Z]));
        const fd = deriv(f, d), fdAt = valueAt(fd, A.pt);
        const dT = '\\frac{\\partial f}{\\partial ' + d + '}' + A.tex;
        // from the definition
        let def = null;
        if (c0 && c0.q && R && A.exact) def = defSteps(f, R, A, e, c0.q, o);
        // without exact algebra: read the limit off quotients from both sides
        let numDef = null;
        if (!def && c0) {
          const qn = hh => { const env = {}; vars.forEach(v => { env[v] = A.fl[v] + (v === d ? hh : 0); }); return (cf(env) - vNum(c0)) / hh; };
          const r4 = qn(1e-4), r6 = qn(1e-6), l6 = qn(-1e-6), tol = x => 1e-3 * Math.max(1, Math.abs(x));
          if (![r4, r6, l6].every(Number.isFinite) || Math.abs(r6) > 1e6 || (Math.abs(r6) > 50 * Math.abs(r4) + 1)) numDef = { kind: 'inf' };
          else if (Math.abs(r6 - l6) > tol(r6)) numDef = { kind: 'sides', r: r6, l: l6 };
          else numDef = { kind: 'val', x: (r6 + l6) / 2 };
        }
        const value = !fdAt.undef ? fdAt : def && def.res.kind === 'val' ? valQ(def.res.L) : numDef && numDef.kind === 'val' ? { q: null, x: numDef.x, t: null } : null;
        // the answer
        const others = vars.filter(v => v !== d).map(v => { const r = valueAt(deriv(f, v), A.pt); return r.undef ? null : '$f_{' + v + '}' + A.tex + ' = ' + vT(r, o.dec) + '$'; }).filter(Boolean);
        if (value) out.append(K.answer('The partial derivative with respect to $' + d + '$ at your point', dT + ' ' + vEnd(value, o.dec), others.length ? 'The other ' + (others.length > 1 ? 'ones are ' : 'one is ') + others.join(' and ') + '.' : null));
        else if ((def && def.res.kind === 'inf') || (numDef && numDef.kind === 'inf')) out.append(K.answer('The partial derivative with respect to $' + d + '$ at your point', dT + '\\ \\text{does not exist}', 'The difference quotient grows without bound as $h \\to 0$.'));
        else if (numDef && numDef.kind === 'sides') out.append(K.answer('The partial derivative with respect to $' + d + '$ at your point', dT + '\\ \\text{does not exist}', 'From the right ($h > 0$) the quotients approach about $' + decT(numDef.r) + '$, from the left about $' + decT(numDef.l) + '$: the two sides disagree, so there is no limit (the graph has a corner here).'));
        else if (v0.undef && !given) out.append(K.note('$f$ has no value at your point $' + A.tex + '$ (the formula would divide by zero, or take the log or square root of a negative number). If $f$ is given a value there, as lecture 9.2 gives $\\frac{xy}{x^2 + y^2}$ the value $0$ at $(0, 0)$, type it in the box on the left: the definition needs it. Otherwise choose a point where $f$ is defined.', 'warn'));
        // the definition
        const eNum = vars.map(v => (v === d ? 1 : 0));
        const defCard = K.card('From the definition: $h \\to 0$',
          K.steps([
            { text: 'Change only $' + d + '$, by a small number $h$, and keep ' + vars.filter(v => v !== d).map(v => '$' + v + '$').join(' and ') + ' fixed. The rate of change is the limit of the difference quotient (lecture 9.2):', tex: dT + ' = \\lim_{h \\to 0} \\frac{f(' + vars.map(v => (v === d ? (A.exact && A.ex[v].isZero() ? 'h' : A.coT(v) + ' + h') : A.coT(v))).join(', ') + ') - f' + A.tex + '}{h}' },
            ...(def ? def.steps : [{ text: c0 ? 'Here $f$ is not a fraction of polynomials with fraction numbers, so the limit is read off the table below.' : 'The definition needs a value of $f$ at the point.' }]),
          ]),
          c0 ? K.p('The difference quotient for smaller and smaller $h$, from both sides:') : null,
          c0 ? K.table(['$h$', '$f(\\text{moved point})$', 'quotient'], quotTable(cf, A, eNum, c0.q || vNum(c0), o, R && A.exact && c0.q ? R : null), { compact: true }) : null);
        // the rules
        const ex = explainD(f, d, vars, o);
        const rules = [...ex.steps];
        if (!fdAt.undef) rules.push({ text: 'At your point:', tex: 'f_{' + d + '}' + A.tex + ' = ' + evalChain(fd, A.pt, o).tex });
        const rulesCard = K.card('By the rules: hold the other variables constant', K.steps(rules), fdAt.undef ? K.note('This formula has no value at your point (it would divide by zero, or take the log or square root of a negative number), so the rules cannot give $f_{' + d + '}' + A.tex + '$. Where $f$ itself has a value, the definition can still decide, as lecture 9.2 does for $\\frac{xy}{x^2 + y^2}$ at $(0, 0)$.', 'warn') : null);
        out.append(def || v0.undef ? defCard : rulesCard, def || v0.undef ? rulesCard : defCard);
        // check
        const last = c0 ? (() => { const env = {}; vars.forEach(v => { env[v] = A.fl[v] + (v === d ? 1e-6 : 0); }); return (cf(env) - vNum(c0)) / 1e-6; })() : NaN;
        if (value && !fdAt.undef) {
          const ok = def && def.res.kind === 'val' ? def.res.L.eq(fdAt.q || F(0)) || Math.abs(def.res.L.num() - vNum(fdAt)) < 1e-9 : Math.abs(last - vNum(fdAt)) < 1e-4 * Math.max(1, Math.abs(vNum(fdAt)));
          out.append(K.note('Check: the rules give $' + vT(fdAt, o.dec) + '$; the definition gives ' + (def && def.res.kind === 'val' ? '$' + numT(def.res.L, o.dec) + '$ exactly' : 'about $' + decT(last, 5) + '$ (with $h = 0.000001$)') + '. ' + (ok ? 'They agree ✓' : 'They differ ✗'), ok ? 'good' : 'warn'));
        }
        // the slice and its tangent line
        const w = s.v.w || 2, pd = A.fl[d], val0 = c0 ? vNum(c0) : NaN, slope = value ? vNum(value) : NaN;
        out.append(K.card('The picture: a slice of $f$', K.p('Keep ' + vars.filter(v => v !== d).map(v => '$' + v + ' = ' + A.coT(v) + '$').join(' and ') + ' and let $' + d + '$ change: $f$ becomes a function of $' + d + '$ alone (lecture 9.2 cuts the graph with a plane). ' + (Number.isFinite(slope) ? 'The partial derivative is the slope of this curve at your point: the orange tangent line (the wide band) has slope $' + vT(value, o.dec) + '$.' : '')),
          graph1({ fn: tt => { const env = { ...A.fl, [d]: tt }; return cf(env); }, t0: pd - w, t1: pd + w, mark: [pd, val0], slope, tName: d, yName: 'f', aria: 'f along the line through your point in the ' + d + ' direction' })));
        // all first partials
        out.append(K.card('All the first partial derivatives', K.table(['', 'formula', 'at your point'], vars.map(v => { const g = deriv(f, v), r = valueAt(g, A.pt); return ['$f_{' + v + '}$', '$' + tx(g, o) + '$', r.undef ? 'not defined' : '$' + vT(r, o.dec) + '$']; }), { compact: true })));
        // second-order partials
        const sec = [], vals2 = {};
        for (const vi of vars) for (const vj of vars) {
          const g = deriv(deriv(f, vi), vj), r = valueAt(g, A.pt);
          vals2[vi + vj] = { g, r };
          sec.push(['$f_{' + vi + vj + '} = ' + (vi === vj ? '\\frac{\\partial^2 f}{\\partial ' + vi + '^2}' : '\\frac{\\partial^2 f}{\\partial ' + vj + '\\,\\partial ' + vi + '}') + '$', '$' + tx(g, o) + '$', r.undef ? 'not defined' : '$' + vT(r, o.dec) + '$']);
        }
        const pairs = [];
        vars.forEach((vi, i) => vars.slice(i + 1).forEach(vj => pairs.push([vi, vj])));
        const same = pairs.map(([vi, vj]) => sameFn(vals2[vi + vj].g, vals2[vj + vi].g, vars));
        const secCard = K.card('Second-order partial derivatives (lecture 11.1)',
          K.p('Differentiate a partial derivative again. $f_{xy}$ means: first with respect to $x$, then with respect to $y$; in the other notation this is $\\frac{\\partial^2 f}{\\partial y\\,\\partial x}$, the order written from right to left.'),
          K.table(['', 'formula', 'at your point'], sec, { compact: true }),
          K.note(same.every(Boolean) ? 'Check: ' + pairs.map(([vi, vj]) => '$f_{' + vi + vj + '} = f_{' + vj + vi + '}$').join(', ') + ' as formulas ✓ (Clairaut’s theorem: the mixed partial derivatives are equal where they are continuous).' : 'The mixed partial derivatives ' + pairs.filter((_, i) => !same[i]).map(([vi, vj]) => '$f_{' + vi + vj + '}$ and $f_{' + vj + vi + '}$').join(', ') + ' differ ✗', same.every(Boolean) ? 'good' : 'warn'));
        out.append(secCard);
        // the mixed partials at a point where only the definition works (lecture 11.1)
        if (v0.undef && given && given.q && R && A.exact && n === 2) {
          const first = {};
          for (const v of vars) { const r = quotLimit(...Object.values(ratAlong(R, A.ex, Object.fromEntries(vars.map(w2 => [w2, w2 === v ? ONE : Z])), vars)), given.q); first[v] = r.kind === 'val' ? r.L : null; }
          const lines = [];
          for (const [vi, vj] of [['x', 'y'], ['y', 'x']]) {
            if (!first[vi]) continue;
            const Ri = ratOf(deriv(f, vi));
            if (!Ri) continue;
            const { N, D: Dn } = ratAlong(Ri, A.ex, { [vj]: ONE, [vi]: Z }, vars), r = quotLimit(N, Dn, first[vi]);
            const mv = 'f_{' + vi + '}(' + vars.map(v => (v === vj ? (A.ex[v].isZero() ? 'h' : A.coT(v) + ' + h') : A.coT(v))).join(', ') + ')';
            const one = Dn.isConst() && Dn.cval().eq(1), oo = { ...o, ren: { t: 'h' } };
            lines.push({ text: '$f_{' + vi + vj + '}' + A.tex + '$: use the formula of $f_{' + vi + '}$ near the point (where it is defined) and its value $f_{' + vi + '}' + A.tex + ' = ' + numT(first[vi]) + '$ from the definition:', tex: 'f_{' + vi + vj + '}' + A.tex + ' = \\lim_{h \\to 0}\\frac{' + mv + ' - ' + numT(first[vi]) + '}{h} = \\lim_{h \\to 0}\\frac{' + (one ? polyByT(N, 3, oo) : '\\frac{' + polyByT(N, 3, oo) + '}{' + polyByT(Dn, 3, oo) + '}') + ' - ' + numT(first[vi]) + '}{h}' + (r.kind === 'val' ? ' = ' + numT(r.L) : '\\ \\text{does not exist}') });
          }
          if (lines.length) out.append(K.card('Mixed partials at your point, from the definition', K.steps(lines), K.p('Where the mixed partial derivatives are not continuous, Clairaut’s theorem does not apply and they can differ, as in lecture 11.1’s example.')));
        }
      }
    },

    /* ---------------------------------------------------------------- gradient */
    // ?f=xy+yz+zx&a=1&b=2&c=3&u=4,3,0&deg=&v=&w=0   f = a function of x, y (or x, y, z); a, b, c = the point; u = a direction as
    //   numbers separated by commas, one for each variable (any length but not all 0; it is made a unit vector); deg = a
    //   direction as an angle in degrees from the x-axis instead (functions of x and y only; empty = use u); v = the value
    //   f is given at the point when its formula is not defined there (empty = none); w = the half-width of the picture
    gradient(el, query, ctx) {
      const t = topic(el, query, ctx, { f: 'xy+yz+zx', a: '1', b: '2', c: '3', u: '4,3,0', deg: '', v: '', w: 0 }, v => { v.w = wOf(v.w); });
      const { s } = t;
      t.start(() => {
        t.ptBox = pointEntry(t);
        const angle = String(s.v.deg).trim() !== '';
        t.controls.append(
          K.p('The gradient $\\nabla f$ collects the partial derivatives in one vector. Its dot product with a unit vector $u$ is the rate of change of $f$ in the direction $u$ (lecture 9.6).'),
          fnEntry(t), t.ptBox,
          K.seg({ label: 'Give the direction as', options: [['vec', 'a vector'], ['deg', 'an angle']], value: angle ? 'deg' : 'vec', onChange: v => t.load({ ...s.v, deg: v === 'deg' ? (String(s.v.deg).trim() || '60') : '' }) }),
          angle ? numEntry(t, 'deg', 'Angle $\\theta$ from the $x$-axis, in degrees', 'For functions of $x$ and $y$. Lecture 9.3 uses 60°.')
            : entry({ label: 'Direction $v$', value: s.v.u, placeholder: '4, 3, 0', help: 'Numbers separated by commas, one for each variable, such as 4, 3, 0 or 1, 1. It does not need length 1.', check: src => { try { const parts = String(src).split(/[,;]/).map(x => x.trim()).filter(Boolean); if (!parts.length) return 'Type a direction such as 1, 1.'; parts.forEach(p => readNum(p, 'A number of the direction')); return null; } catch (e) { return e.message; } }, onCommit: v => s.set({ u: v }) }),
          numEntry(t, 'v', 'The value $f(a, b)$, when the formula is not defined there', 'Leave it empty when $f$ is defined at your point.', true),
          winSelect(t),
          tries([
            ['x + y at (0, 0), along y = x', { f: 'x+y', a: '0', b: '0', u: '1,1' }, 'Lecture 9.3: √2'],
            ['xy + yz + zx at (1, 2, 3), along (4, 3, 0)', { f: 'xy+yz+zx', a: '1', b: '2', c: '3', u: '4,3,0' }, 'Lecture 9.3: 32/5'],
            ['sin(xy) at (1, 0), at 60°', { f: 'sin(xy)', a: '1', b: '0', deg: '60', u: '1,0' }, 'Lecture 9.3: √3/2'],
            ['sin(xy) at (π, 1)', { f: 'sin(xy)', a: 'pi', b: '1', u: '1,pi' }, 'Lecture 10.1: steepest descent along (1, π)'],
            ['x² + y² + z² at (1, 1, 1)', { f: 'x^2+y^2+z^2', a: '1', b: '1', c: '1', u: '1,1,1' }, 'Lecture 10.1: steepest ascent along (1, 1, 1)'],
            ['x² + y² + z² at (1, 2, 3)', { f: 'x^2+y^2+z^2', a: '1', b: '2', c: '3', u: '1,0,0' }, 'Lecture 9.6: the gradient (2, 4, 6)'],
            ['xy at (1, 1), along (3, 4)', { f: 'xy', a: '1', b: '1', u: '3,4' }, 'Lecture 10.2: 7/5'],
            ['x²y + y²z, along (−1, 0, 1)', { f: 'x^2y+y^2z', a: '1', b: '1', c: '1', u: '-1,0,1' }, 'Week 9 tutorial (at a point chosen here, (1, 1, 1))'],
            ['xy/(x² + y²) at (0, 0)', { f: 'xy/(x^2+y^2)', a: '0', b: '0', u: '1,1', v: '0' }, 'Lectures 9.3 and 9.6: the gradient is (0, 0), yet this directional derivative does not exist'],
          ], t.load));
      }, draw);
      function draw() {
        const out = t.out, A = readAll(t), { f, vars, n, o } = A, cf = compile(f);
        const v0 = valueAt(f, A.pt);
        const given = String(s.v.v).trim() === '' ? null : readNum(s.v.v, 'The value at the point');
        // the direction
        let dir;
        if (String(s.v.deg).trim() !== '') {
          if (n !== 2) throw new MathError('An angle gives a direction in the plane, so use it with a function of x and y, or give the direction as a vector.');
          const th = readNum(s.v.deg, 'The angle');
          const cs = th.q && th.q.isInt() ? cosSinDeg(Number(th.q.n)) : null;
          const thT = th.q ? numT(th.q) : th.t;
          dir = { deg: thT, u: cs, uf: cs ? cs.map(q => q.num()) : [Math.cos((th.x * Math.PI) / 180), Math.sin((th.x * Math.PI) / 180)] };
        } else {
          const parts = String(s.v.u).split(/[,;]/).map(x => x.trim()).filter(Boolean);
          if (parts.length !== n) throw new MathError('Give the direction as ' + n + ' numbers separated by commas (one for each variable), for example ' + (n === 3 ? '4, 3, 0' : '1, 1') + '.');
          const comps = parts.map(p => readNum(p, 'The direction'));
          if (comps.every(c => c.x === 0)) throw new MathError('The direction cannot be the zero vector: it points nowhere.');
          dir = { v: comps };
          if (comps.every(c => c.q)) {
            const N2 = comps.reduce((acc, c) => acc.add(c.q.mul(c.q)), Z), sp = sqrtParts(N2);
            if (sp) { dir.len = sp; dir.u = comps.map(c => (sp.t === 1n ? new Q2(c.q.div(sp.c)) : new Q2(Z, c.q.div(sp.c.mul(F(sp.t))), sp.t))); }
          }
          const nf = Math.sqrt(comps.reduce((acc, c) => acc + c.x * c.x, 0));
          dir.uf = comps.map(c => c.x / nf);
        }
        // the gradient
        const grads = vars.map(v => deriv(f, v)), gv = grads.map(g => valueAt(g, A.pt));
        const singular = gv.some(g => g.undef) || v0.undef;
        const R = ratOf(f);
        const gradT = 'f(' + fArgs(vars) + ')';
        const stepsG = [
          { text: 'The gradient is the vector of the partial derivatives (each found by holding the other variables constant; the Partial derivatives topic shows every step):', tex: '\\nabla ' + gradT + ' = ' + vecT(grads.map(g => tx(g, o))) },
        ];
        let G = null;
        if (!singular) {
          const map = {};
          vars.forEach(v => { map[v] = subNode(A.pt[v]); });
          const subT = vecT(grads.map(g => tx(subst(g, map), o))), valT = vecT(gv.map(g => vT(g, o.dec)));
          stepsG.push({ text: 'At your point:', tex: '\\nabla f' + A.tex + ' = ' + subT + (subT !== valT ? ' = ' + valT : '') });
          G = gv;
        } else if (v0.undef && given && given.q && R && A.exact) {
          const parts = vars.map(v => quotLimit(...Object.values(ratAlong(R, A.ex, Object.fromEntries(vars.map(w2 => [w2, w2 === v ? ONE : Z])), vars)), given.q));
          if (parts.every(p => p.kind === 'val')) { G = parts.map(p => valQ(p.L)); stepsG.push({ text: 'The formulas are not defined at your point, so the partial derivatives there come from the definition (as in the Partial derivatives topic), using $f' + A.tex + ' = ' + vT(given) + '$:', tex: '\\nabla f' + A.tex + ' = ' + vecT(G.map(g => vT(g))) }); }
        }
        if (!G) { out.append(K.note(v0.undef && !given ? '$f$ is not defined at your point. Give it a value there (the box on the left), as lecture 9.3 does with $\\frac{xy}{x^2 + y^2}$ at $(0, 0)$.' : 'The gradient cannot be found at your point.', 'warn')); out.append(K.card('The gradient', K.steps(stepsG))); return; }
        // the unit vector
        const stepsU = [];
        if (dir.deg != null) {
          stepsU.push({ text: 'A direction at angle $\\theta$ from the $x$-axis has unit vector $u = (\\cos\\theta, \\sin\\theta)$ (lecture 9.3):', tex: 'u = (\\cos ' + dir.deg + '^\\circ, \\sin ' + dir.deg + '^\\circ) = ' + vecT(dir.u ? dir.u.map(q => q.tex()) : dir.uf.map(x => decT(x))) });
        } else {
          const vT_ = dir.v.map(c => (c.q ? numT(c.q) : c.t || decT(c.x)));
          const sq = dir.v.map(c => (c.q ? (c.q.cmp(0) < 0 || !c.q.isInt() ? '\\left(' + numT(c.q) + '\\right)' : numT(c.q)) + '^2' : '(' + (c.t || decT(c.x)) + ')^2')).join(' + ');
          if (dir.u) {
            const N2 = dir.v.reduce((acc, c) => acc.add(c.q.mul(c.q)), Z), lenTx = lenT(dir.len.c, dir.len.t);
            stepsU.push({ text: 'A direction is given by a <b>unit</b> vector (length 1). Divide $v$ by its length (lecture 9.3):', tex: '\\|v\\| = \\sqrt{' + sq + '} = \\sqrt{' + numT(N2) + '}' + (lenTx !== '\\sqrt{' + numT(N2) + '}' ? ' = ' + lenTx : '') });
            const comp = dir.comp = c => { if (c.q.isZero()) return '0'; if (dir.len.t === 1n) return numT(c.q.div(dir.len.c)); const r = c.q.div(dir.len.c), sg = r.cmp(0) < 0 ? '-' : '', ab = r.cmp(0) < 0 ? r.neg() : r; return sg + '\\frac{' + ab.n + '}{' + (ab.d === 1n ? '' : ab.d.toString()) + '\\sqrt{' + dir.len.t + '}}'; };
            stepsU.push({ text: 'So the unit vector is', tex: 'u = \\frac{v}{\\|v\\|} = \\frac{1}{' + lenTx + '}' + vecT(vT_) + ' = ' + vecT(dir.v.map(comp)) });
          } else {
            stepsU.push({ text: 'Divide $v$ by its length to get a unit vector (lecture 9.3):', tex: '\\|v\\| = \\sqrt{' + sq + '} \\approx ' + decT(Math.hypot(...dir.v.map(c => c.x))) + ',\\quad u \\approx ' + vecT(dir.uf.map(x => decT(x))) });
          }
        }
        // the directional derivative
        const exactG = G.every(g => g.q);
        let fu = null, fuT, fuX;
        if (exactG && dir.u) {
          fu = G.reduce((acc, g, i) => acc && acc.add(dir.u[i].mul(new Q2(g.q))), new Q2(Z));
        }
        const uTx = i => (dir.comp ? dir.comp(dir.v[i]) : dir.u ? dir.u[i].tex(o.dec) : decT(dir.uf[i]));
        const prods = G.map((g, i) => { const ut = uTx(i); return facT(g, o.dec) + ' \\cdot ' + (/^-|\\frac|\\sqrt|\+/.test(ut) ? '\\left(' + ut + '\\right)' : ut); }).join(' + ');
        if (fu) { fuT = fu.tex(o.dec); fuX = fu.num(); }
        else { fuX = G.reduce((acc, g, i) => acc + vNum(g) * dir.uf[i], 0); const idd = ident(fuX); fuT = idd.q ? numT(idd.q) : idd.t || decT(fuX); }
        const fuEnd = fu ? (fu.isQ() ? (fu.r.isInt() || fu.r.exactDecimal(6) ? '= ' + fuT + (fu.r.isInt() ? '' : ' = ' + decT(fuX)) : '= ' + fuT + ' \\approx ' + decT(fuX)) : '= ' + fuT + ' \\approx ' + decT(fuX)) : '\\approx ' + decT(fuX);
        let mid = '';
        if (fu && !fu.isQ() && dir.len && dir.len.t !== 1n && dir.v) { const dot = G.reduce((acc, g, i) => acc.add(g.q.mul(dir.v[i].q)), Z); mid = ' = \\frac{' + numT(dot) + '}{' + lenT(dir.len.c, dir.len.t) + '}'; }
        const stepsD = [{ text: 'When $\\nabla f$ is continuous near the point (true here: its parts are made of continuous pieces), the rate of change in the direction $u$ is the dot product (lecture 9.6):', tex: 'f_u' + A.tex + ' = \\nabla f' + A.tex + ' \\cdot u = ' + prods + mid + ' ' + fuEnd }];
        if (singular) stepsD[0] = { text: 'The theorem $f_u = \\nabla f \\cdot u$ needs $\\nabla f$ to be continuous near the point, which is not true here. The dot product would give', tex: '\\nabla f' + A.tex + ' \\cdot u = ' + prods + ' ' + fuEnd };
        // from the definition
        const c0 = v0.undef ? given : v0;
        const ue = dir.u && dir.u.every(q => q.isQ()) ? dir.u.map(q => ({ q: q.r })) : null;
        let defE = null;
        if (c0 && c0.q && R && A.exact && ue) defE = defSteps(f, R, A, Object.fromEntries(vars.map((v, i) => [v, ue[i].q])), c0.q, o);
        const rows = c0 ? quotTable(cf, A, dir.uf, c0.q || vNum(c0), o, null) : [];
        const qAt = hh => { const env = {}; vars.forEach((v, i) => { env[v] = A.fl[v] + hh * dir.uf[i]; }); return (cf(env) - vNum(c0)) / hh; };
        const lastQ = c0 ? qAt(1e-6) : NaN;
        // along v exactly (f a fraction of polynomials, v made of fractions): does the quotient settle down at all?
        let alongV = null;
        if (!defE && c0 && c0.q && R && A.exact && dir.v && dir.v.every(c => c.q)) alongV = quotLimit(...Object.values(ratAlong(R, A.ex, Object.fromEntries(vars.map((v, i) => [v, dir.v[i].q])), vars)), c0.q);
        const diverges = defE ? defE.res.kind === 'inf' : alongV ? alongV.kind === 'inf' : c0 && Math.abs(qAt(1e-6)) > 5 * Math.abs(qAt(1e-4)) + 1;
        const defOK = defE ? defE.res.kind === 'val' && Math.abs(defE.res.L.num() - fuX) < 1e-9 : !diverges && Math.abs(lastQ - fuX) < 1e-4 * Math.max(1, Math.abs(fuX));
        const defVal = diverges ? null : defE ? valQ(defE.res.L) : alongV && alongV.kind === 'val' && dir.len ? (() => { const r = new Q2(Z, alongV.L.div(dir.len.c.mul(F(dir.len.t))), dir.len.t); return { q: r.isQ() ? r.r : null, x: r.num(), t: r.isQ() ? null : r.tex() }; })() : Number.isFinite(lastQ) ? { q: null, x: lastQ, t: null } : null;
        // answer
        const agree = defVal && Math.abs(vNum(defVal) - fuX) < 1e-9 * Math.max(1, Math.abs(fuX));
        out.append(K.answer('The gradient and the rate of change in your direction', '\\begin{aligned}\\nabla f' + A.tex + ' &= ' + vecT(G.map(g => vT(g, o.dec))) + ' \\\\ f_u' + A.tex + (singular ? (defVal ? ' &= ' + vT(defVal) : ' &\\ \\text{does not exist}') : ' &' + fuEnd) + '\\end{aligned}', singular ? (agree ? 'Only the definition can be trusted at this point; in this direction it happens to agree with $\\nabla f \\cdot u$ (try another direction; lectures 9.3 and 9.6).' : 'Here the definition and the dot product disagree (lectures 9.3 and 9.6).') : '$f_u$ is the directional derivative, also written $D_u f$.'));
        out.append(K.card('Step 1: the gradient', K.steps(stepsG)));
        out.append(K.card('Step 2: the unit vector $u$', K.steps(stepsU)));
        out.append(K.card('Step 3: $f_u = \\nabla f \\cdot u$', K.steps(stepsD)));
        out.append(K.card('Check: from the definition', K.steps([{ text: 'Move from the point a small step $h$ along $u$ (lecture 9.3):', tex: 'f_u' + A.tex + ' = \\lim_{h \\to 0}\\frac{f\\left(' + A.tex + ' + hu\\right) - f' + A.tex + '}{h}' }, ...(defE ? defE.steps : [])]),
          c0 ? K.table(['$h$', '$f(\\text{point} + hu)$', 'quotient'], rows, { compact: true }) : null,
          c0 ? K.note(defOK && !singular ? 'The quotients approach $' + fuT + '$, the dot product ✓' : singular ? (defVal ? (agree ? 'The definition gives $' + vT(defVal) + '$, the same as the dot product in this direction. In other directions it need not: the gradient is not continuous at the point, so the theorem does not apply there.' : 'The definition gives $' + vT(defVal) + '$, not the dot product: the gradient is not continuous at the point, so the theorem does not apply.') : 'The quotients do not settle down: this directional derivative does not exist, although the gradient does (lecture 9.3).') : 'The quotients and the dot product differ ✗', defOK && !singular ? 'good' : singular && agree ? '' : 'warn') : null));
        // steepest ascent and descent
        const gx = G.map(vNum), gn = Math.hypot(...gx);
        const steep = [];
        if (gn < 1e-12) steep.push({ text: 'The gradient is the zero vector, so every directional derivative here is $0$: your point is a <b>critical point</b> (the Critical points topic says what kind).' });
        else {
          let lenG = null;
          if (exactG) { const N2 = G.reduce((acc, g) => acc.add(g.q.mul(g.q)), Z), sp = sqrtParts(N2); lenG = { N2, sp }; }
          const gT = vecT(G.map(g => vT(g, o.dec)));
          const nT = lenG ? '\\sqrt{' + G.map(g => (g.q.cmp(0) < 0 || !g.q.isInt() ? '\\left(' + numT(g.q) + '\\right)' : numT(g.q)) + '^2').join(' + ') + '} = \\sqrt{' + numT(lenG.N2) + '}' + (lenG.sp && lenG.sp.t === 1n ? ' = ' + numT(lenG.sp.c) : lenG.sp && !lenG.sp.c.eq(1) ? ' = ' + surdT(lenG.sp.c, lenG.sp.t) : '') + (lenG.sp && lenG.sp.t === 1n ? '' : ' \\approx ' + decT(gn)) : '\\approx ' + decT(gn);
          const lenTx = lenG && lenG.sp ? lenT(lenG.sp.c, lenG.sp.t) : decT(gn);
          steep.push({ text: 'The length of the gradient:', tex: '\\|\\nabla f' + A.tex + '\\| = ' + nT });
          steep.push({ text: 'Since $f_u = \\nabla f \\cdot u = \\|\\nabla f\\|\\cos\\theta$, where $\\theta$ is the angle between $\\nabla f$ and $u$ (lecture 10.1), $f_u$ is largest when $\\theta = 0$. <b>Steepest ascent</b>: the direction of the gradient, rate $\\|\\nabla f\\|$:', tex: 'u = \\frac{\\nabla f}{\\|\\nabla f\\|} = \\frac{1}{' + lenTx + '}' + gT + ',\\quad f_u = ' + lenTx });
          steep.push({ text: '<b>Steepest descent</b> ($\\theta = \\pi$, the way water runs downhill): the opposite direction, rate $-\\|\\nabla f\\|$:', tex: 'u = -\\frac{\\nabla f}{\\|\\nabla f\\|} = \\frac{1}{' + lenTx + '}' + vecT(G.map(g => (g.q ? numT(g.q.neg(), o.dec) : g.t ? (g.t[0] === '-' ? g.t.slice(1) : '-' + g.t) : decT(-g.x)))) + ',\\quad f_u = -' + lenTx });
          if (n === 2) {
            const tv = [G[1], G[0]].map((g, i) => (i === 0 ? (g.q ? numT(g.q.neg(), o.dec) : g.t ? (g.t[0] === '-' ? g.t.slice(1) : '-' + g.t) : decT(-g.x)) : vT(g, o.dec)));
            steep.push({ text: '<b>No change</b> ($\\theta = \\frac{\\pi}{2}$): the directions perpendicular to the gradient, along the level curve through the point:', tex: 'u = \\pm\\frac{1}{' + lenTx + '}' + vecT(tv) + ',\\quad f_u = 0' });
          } else {
            const [g1, g2, g3] = gx;
            const b1 = Math.abs(g1) > 1e-12 ? [g2, -g1, 0] : [1, 0, 0], b2 = Math.abs(g1) > 1e-12 ? [g3, 0, -g1] : [0, g3, -g2];
            const vt = vv => vecT(vv.map(x => { const r = ident(x); return r.q ? numT(r.q) : r.t || decT(x); }));
            steep.push({ text: '<b>No change</b>: every direction perpendicular to the gradient, that is every $u$ with $\\nabla f \\cdot u = 0$. With three variables these fill a plane; two directions in it (lecture 10.1):', tex: vt(b1) + '\\ \\text{and}\\allowbreak\\ ' + vt(b2) + '\\allowbreak\\ \\text{(divide each by its length)}' });
          }
          const cth = Math.max(-1, Math.min(1, fuX / gn));
          steep.push({ text: 'Your direction: $\\cos\\theta = \\frac{f_u}{\\|\\nabla f\\|} \\approx ' + decT(cth) + '$, so it makes an angle of about $' + decT((Math.acos(cth) * 180) / Math.PI, 1) + '^\\circ$ with the gradient.' });
        }
        out.append(K.card('Steepest ascent, steepest descent, no change (lecture 10.1)', K.steps(steep)));
        // the picture
        if (gn >= 0) {
          const w = s.v.w || 2, a = A.fl.x, b = A.fl.y, fxy = f2(cf, vars, n === 3 ? A.fl.z : 0), win = box2(a, b, w), cv = c0 ? vNum(c0) : NaN;
          const arrows = [], lines = [];
          if (Math.hypot(gx[0], gx[1]) > 1e-12) { arrows.push({ dx: gx[0], dy: gx[1], cls: 's2', fill: 'f2', label: '∇f' }, { dx: -gx[0], dy: -gx[1], cls: 's1', fill: 'f1', label: '−∇f' }); lines.push({ dx: -gx[1], dy: gx[0] }); }
          if (Math.hypot(dir.uf[0], dir.uf[1]) > 1e-12) arrows.push({ dx: dir.uf[0], dy: dir.uf[1], cls: 's3', fill: 'f3', label: 'u', len: 52 });
          const pic = contour({ fxy, ...win, levels: divergingLevels(autoLevels(fxy, win.x0, win.x1, win.y0, win.y1, cv), cv), point: [a, b], arrows, lines, aria: 'level curves of f with the gradient at your point' });
          out.append(K.card('The picture', K.p((n === 3 ? 'The slice $z = ' + A.coT('z') + '$ through your point, with the $x$- and $y$-parts of the arrows. ' : '') + 'The gradient points straight across the level curves, towards higher values; the thin straight line through the point follows the level curve (no change).'), pic,
            legend([['k2', '$\\nabla f$: steepest ascent'], ['k1', '$-\\nabla f$: steepest descent'], ['k3', 'your direction $u$'], ['thin', 'no change (thin); the thick curve is the level through your point']])));
        }
      }
    },

    /* ---------------------------------------------------------------- tangent-plane */
    // ?f=xy&a=1&b=1&c=1&u=&w=0   f = a function of x, y (or x, y, z: then the tangent hyperplane w = …); a, b, c = the point;
    //   u = an optional direction for a tangent line, numbers separated by commas (3,4); w = the half-width of the pictures
    'tangent-plane'(el, query, ctx) {
      const t = topic(el, query, ctx, { f: 'xy', a: '1', b: '1', c: '1', u: '', w: 0 }, v => { v.w = wOf(v.w); });
      const { s } = t;
      t.start(() => {
        t.ptBox = pointEntry(t);
        t.controls.append(
          K.p('Near a point, a smooth surface $z = f(x, y)$ looks like a plane: the <b>tangent plane</b>. All the tangent lines at the point lie in it (lecture 10.3).'),
          fnEntry(t), t.ptBox,
          entry({ label: 'A direction for a tangent line (optional)', value: s.v.u, placeholder: '3, 4', help: 'Numbers separated by commas, one for each variable. Lecture 10.2 finds tangent lines in a direction.', check: src => { if (!String(src).trim()) return null; try { String(src).split(/[,;]/).map(x => x.trim()).filter(Boolean).forEach(p => readNum(p, 'A number of the direction')); return null; } catch (e) { return e.message; } }, onCommit: v => s.set({ u: v }) }),
          winSelect(t),
          tries([
            ['x + y at (1, 1)', { f: 'x+y', a: '1', b: '1' }, 'Lecture 10.3: z = x + y'],
            ['xy at (1, 1)', { f: 'xy', a: '1', b: '1' }, 'Lecture 10.3: z = x + y − 1'],
            ['sin(xy) at (1, 0)', { f: 'sin(xy)', a: '1', b: '0' }, 'Lecture 10.3: z = y'],
            ['xy + yz + zx at (1, 1, 1)', { f: 'xy+yz+zx', a: '1', b: '1', c: '1' }, 'Lecture 10.3: the tangent hyperplane'],
            ['x² + y² + z² at (2, 3, −1)', { f: 'x^2+y^2+z^2', a: '2', b: '3', c: '-1' }, 'Lecture 10.3: the tangent hyperplane and the linear approximation'],
            ['xy at (1, 1), along (3, 4)', { f: 'xy', a: '1', b: '1', u: '3,4' }, 'Lecture 10.2: a tangent line'],
            ['x + y at (1, 1), along (1, 0)', { f: 'x+y', a: '1', b: '1', u: '1,0' }, 'Lecture 10.2: a tangent line'],
            ['sin(xy) at (π, 1), along (1, 2)', { f: 'sin(xy)', a: 'pi', b: '1', u: '1,2' }, 'Lecture 10.2: a tangent line'],
            ['xy + yz + zx at (1, 1, 1), along (−1, −2, 2)', { f: 'xy+yz+zx', a: '1', b: '1', c: '1', u: '-1,-2,2' }, 'Lecture 10.2: a tangent line in four dimensions'],
          ], t.load));
      }, draw);
      function draw() {
        const out = t.out, A = readAll(t), { f, vars, n, o } = A, cf = compile(f);
        const v0 = valueAt(f, A.pt);
        if (v0.undef) throw new MathError('f is not defined at your point, so there is no tangent plane there. Choose another point.');
        const grads = vars.map(v => deriv(f, v)), gv = grads.map(g => valueAt(g, A.pt));
        if (gv.some(g => g.undef)) throw new MathError('A partial derivative of f is not defined at your point (its formula divides by zero there), so the tangent plane formula cannot be used. Lecture 10.3: the tangent plane needs the partial derivatives to exist and be continuous near the point.');
        const zN = n === 3 ? 'w' : 'z', what = n === 3 ? 'hyperplane' : 'plane';
        const general = zN + ' = f' + (n === 3 ? '(a, b, c)' : '(a, b)') + vars.map((v, i) => ' + f_{' + v + '}' + (n === 3 ? '(a, b, c)' : '(a, b)') + '(' + v + ' - ' + 'abc'[i] + ')').join('');
        const terms = [vT(v0, o.dec)];
        vars.forEach((v, i) => { const sh = shiftT(v, A.P[v]); terms.push((gv[i].q && gv[i].q.cmp(0) < 0 ? '-' + numT(gv[i].q.neg(), o.dec) : facT(gv[i], o.dec)) + (sh[0] === '(' ? sh : '(' + v + ' - 0)')); });
        const withNums = zN + ' = ' + joinT(terms);
        // collect: exact when every value is a fraction
        let simple;
        if (v0.q && gv.every(g => g.q) && A.exact) {
          let P = Poly.c(v0.q);
          vars.forEach((v, i) => { P = P.add(Poly.v(PV.indexOf(v)).sub(Poly.c(A.ex[v])).scale(gv[i].q)); });
          simple = tx(polyTree(P), o);
        } else {
          const cst = vNum(v0) - vars.reduce((acc, v, i) => acc + vNum(gv[i]) * A.fl[v], 0);
          const nT = x => { const r = ident(x); return r.q ? numT(r.q, o.dec) : r.t || decT(x); };
          const parts = vars.map((v, i) => { const g = vNum(gv[i]); if (Math.abs(g) < 1e-14) return null; if (Math.abs(g - 1) < 1e-14) return v; if (Math.abs(g + 1) < 1e-14) return '-' + v; const c = nT(g); return c + (/\\pi$|\\}$/.test(c) ? ' ' : '') + v; }).filter(Boolean);
          if (Math.abs(cst) > 1e-12) parts.push(nT(cst));
          simple = joinT(parts.length ? parts : ['0']);
        }
        out.append(K.answer('The tangent ' + what + ' at $' + A.tex + '$', zN + ' = ' + simple, n === 3 ? 'With three variables the graph lives in four dimensions; the extra coordinate is called $w$ here (the lecture calls it $u$).' : null));
        const map = {};
        vars.forEach(v => { map[v] = subNode(A.pt[v]); });
        const st = [{ text: 'The formula (lecture 10.3) needs the value of $f$ and its partial derivatives at the point:', tex: general }];
        st.push({ text: 'The value at the point:', tex: 'f' + A.tex + ' = ' + evalChain(f, A.pt, o).tex });
        vars.forEach((v, i) => st.push({ text: 'The partial derivative with respect to $' + v + '$ (hold the other variables constant), then its value at the point:', tex: 'f_{' + v + '} = ' + tx(grads[i], o) + ',\\quad f_{' + v + '}' + A.tex + ' = ' + evalChain(grads[i], A.pt, o).tex }));
        st.push({ text: 'Put them into the formula:', tex: withNums });
        if (withNums.replace(/\s/g, '') !== (zN + ' = ' + simple).replace(/\s/g, '')) st.push({ text: 'Multiply out and collect:', tex: zN + ' = ' + simple });
        out.append(K.card('Every value', K.steps(st)));
        if (key(f) === key(parse('x^2+y^2+z^2')) && A.exact && A.ex.x.eq(2) && A.ex.y.eq(3) && A.ex.z.eq(-1)) out.append(K.note('In lecture 10.3 the slide for the linear approximation (at 33:30) starts from $3$ instead of $f(2, 3, -1) = 14$ and ends with $4x + 6y - 2z - 29$. With $14$, as the same lecture uses for the tangent hyperplane at 28:00, it is $4x + 6y - 2z - 14$.', ''));
        // the linear approximation
        const L = env => vNum(v0) + vars.reduce((acc, v, i) => acc + vNum(gv[i]) * (env[v] - A.fl[v]), 0);
        const exactL = v0.q && gv.every(g => g.q) && A.exact && ratOf(f);
        const hs = [1, 0.5, 0.1, 0.01, 0.001];
        const rows = hs.map(hh => {
          const env = {};
          vars.forEach(v => { env[v] = A.fl[v] + hh; });
          let fv = cf(env), lv = L(env), diff = fv - lv;
          if (exactL) {
            const H = F.parse(String(hh)), envQ = [Z, Z, Z, Z, Z];
            vars.forEach(v => { envQ[PV.indexOf(v)] = A.ex[v].add(H); });
            const den = rDen(exactL).ev(envQ);
            if (!den.isZero()) { const fq = exactL.n.ev(envQ).div(den), lq = vars.reduce((acc, v, i) => acc.add(gv[i].q.mul(H)), v0.q); fv = fq.num(); lv = lq.num(); diff = fq.sub(lq).num(); }
          }
          const dist = Math.abs(hh) * Math.sqrt(n);
          return ['$' + hh + '$', '$' + decT(fv, 6) + '$', '$' + decT(lv, 6) + '$', '$' + decT(diff, 6) + '$', '$' + decT(diff / dist, 6) + '$'];
        });
        out.append(K.card('The linear approximation (lecture 10.3)',
          K.p('The right-hand side, as a function, is the <b>best linear approximation</b> $L$ of $f$ near the point. Compare them at points $(' + vars.map(v => A.coT(v) + ' + h').join(', ') + ')$ closer and closer to it:'),
          mathBlock('L(' + fArgs(vars) + ') = ' + simple),
          K.table(['$h$', '$f$', '$L$', '$f - L$', '$\\frac{f - L}{\\text{distance}}$'], rows, { compact: true }),
          K.p('The error $f - L$ shrinks faster than the distance $h\\sqrt{' + n + '}$ to the point, so the last column goes to $0$. That is what <b>differentiable</b> means (lecture 11.4).')));
        // the normal vector
        const nv = [...gv.map(g => vT(g, o.dec)), '-1'];
        const dirs = vars.map((v, i) => vars.map((_, j) => (i === j ? '1' : '0')).concat([vT(gv[i], o.dec)]));
        out.append(K.card('The normal vector', K.steps([
          { text: 'Move everything to one side:', tex: vars.map((v, i) => 'f_{' + v + '}(' + v + ' - ' + 'abc'[i] + ')').join(' + ') + ' - (' + zN + ' - f' + (n === 3 ? '(a, b, c)' : '(a, b)') + ') = 0' },
          { text: 'In a linear equation the coefficients of the variables form a vector perpendicular to the ' + what + ' (its <b>normal vector</b>):', tex: 'n = (f_{' + vars.join('}, f_{') + '}, -1) = ' + vecT(nv) },
          { text: 'Check: the ' + what + ' contains the direction ' + vars.map((v, i) => '$' + vecT(dirs[i]) + '$').join(' and ') + ' (one step in $' + vars.join('$ or $') + '$ raises $' + zN + '$ by the partial derivative), and $n$ is perpendicular to ' + (n === 3 ? 'each' : 'both') + ':', tex: vars.map((v, i) => vecT(nv) + ' \\cdot ' + vecT(dirs[i]) + ' = ' + facT(gv[i], o.dec) + ' - ' + facT(gv[i], o.dec) + ' = 0').join(',\\quad ') },
        ])));
        // a tangent line in a direction
        if (String(s.v.u).trim()) {
          const parts = String(s.v.u).split(/[,;]/).map(x => x.trim()).filter(Boolean);
          if (parts.length !== n) out.append(K.note('Give the direction as ' + n + ' numbers separated by commas.', 'warn'));
          else {
            const comps = parts.map(p => readNum(p, 'The direction'));
            if (comps.every(c => c.x === 0)) out.append(K.note('The direction cannot be the zero vector.', 'warn'));
            else {
              let u, len;
              if (comps.every(c => c.q)) { const N2 = comps.reduce((acc, c) => acc.add(c.q.mul(c.q)), Z); len = sqrtParts(N2); }
              const nf = Math.sqrt(comps.reduce((acc, c) => acc + c.x * c.x, 0));
              if (len) u = comps.map(c => (len.t === 1n ? new Q2(c.q.div(len.c)) : new Q2(Z, c.q.div(len.c.mul(F(len.t))), len.t)));
              const uT = u ? u.map(q => q.tex(o.dec)) : comps.map(c => decT(c.x / nf));
              let fu = null;
              if (u && gv.every(g => g.q)) fu = gv.reduce((acc, g, i) => acc && acc.add(u[i].mul(new Q2(g.q))), new Q2(Z));
              const fuX = fu ? fu.num() : gv.reduce((acc, g, i) => acc + vNum(g) * (comps[i].x / nf), 0);
              const fuT = fu ? fu.tex(o.dec) : decT(fuX);
              const lineT = '(' + vars.join(', ') + ', ' + zN + ') = ' + vecT([...vars.map(v => A.coT(v)), vT(v0, o.dec)]) + ' + t' + vecT([...uT, fuT]);
              out.append(K.card('The tangent line in your direction (lecture 10.2)', K.steps([
                { text: 'The unit vector of your direction:', tex: 'u = ' + vecT(uT) },
                { text: 'The slope along it is the directional derivative:', tex: 'f_u' + A.tex + ' = \\nabla f' + A.tex + ' \\cdot u = ' + gv.map((g, i) => facT(g, o.dec) + ' \\cdot ' + facT(u ? u[i] : { q: null, x: comps[i].x / nf, t: null }, o.dec)).join(' + ') + (fu ? ' = ' + fuT : ' \\approx ' + fuT) },
                { text: 'Moving $t$ along $u$ raises the height by $t f_u$, so the tangent line is', tex: lineT },
                { text: 'Check: its points satisfy the equation of the tangent ' + what + ', since $L$ grows by $\\nabla f \\cdot (tu) = t f_u$ along it ✓' },
              ])));
            }
          }
        }
        // pictures: the slices and their tangent lines
        const w = s.v.w || 2;
        out.append(K.card('The picture: slices and their tangent lines', K.p('Keep all variables but one fixed: each slice of the graph is a curve, and its tangent line (the wide orange band) has slope equal to the partial derivative. The tangent ' + what + ' contains all these lines.'),
          ...vars.map((v, i) => h('div', {}, K.p('Only $' + v + '$ changes (slope $f_{' + v + '} = ' + vT(gv[i], o.dec) + '$):'), graph1({ fn: tt => cf({ ...A.fl, [v]: tt }), t0: A.fl[v] - w, t1: A.fl[v] + w, mark: [A.fl[v], vNum(v0)], slope: vNum(gv[i]), tName: v, yName: 'f', aria: 'the slice of f in the ' + v + ' direction with its tangent line' })))));
      }
    },

    /* ---------------------------------------------------------------- critical */
    // ?f=xy-x^3-y^2&w=0   f = a polynomial in x, y (or x, y, z), degree at most 8; w = the half-width of the picture around
    //   the critical points (0 = automatic; the picture is drawn for functions of x and y)
    critical(el, query, ctx) {
      const t = topic(el, query, ctx, { f: 'xy-x^3-y^2', w: 0 }, v => { v.w = wOf(v.w); });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('A <b>critical point</b> is where the gradient is the zero vector. The second-derivative test with the Hessian matrix says whether it is a local minimum, a local maximum or a saddle point (lectures 10.4, 11.2, 11.3).'),
          fnEntry(t, { placeholder: 'xy - x^3 - y^2', check: f => (maxPow(f) > 8 ? 'Keep the powers in f at most 8 in this topic.' : vars3(f).every(v => polyOf(deriv(f, v))) ? null : 'This topic needs a polynomial: only +, −, × and whole powers of x, y, z (no division by x, y, z, no sin, exp, …).') }),
          winSelect(t),
          tries([
            ['x² + 6xy + 4y² + 2x − 4y', { f: 'x^2+6xy+4y^2+2x-4y' }, 'Lectures 10.4 and 11.2: one critical point, (2, −1), a saddle point'],
            ['xy − x³ − y²', { f: 'xy-x^3-y^2' }, 'Lecture 11.2: a saddle point and a local maximum'],
            ['x³ + y³ − 3x − 3y² + 1', { f: 'x^3+y^3-3x-3y^2+1' }, 'Lecture 10.4: four critical points'],
            ['x² + y²', { f: 'x^2+y^2' }, 'Lecture 11.2: the prototype of a minimum'],
            ['−x² − y²', { f: '-x^2-y^2' }, 'Lecture 11.2: the prototype of a maximum'],
            ['x² − y²', { f: 'x^2-y^2' }, 'Lecture 11.2: the prototype of a saddle point'],
            ['x⁴ + y⁴', { f: 'x^4+y^4' }, 'Lecture 11.2: the test is inconclusive'],
            ['x³: a line of them', { f: 'x^3' }, 'Lecture 10.4: every point of the y-axis is critical'],
            ['x² − y² + z²', { f: 'x^2-y^2+z^2' }, 'Lecture 11.3: a saddle point in three variables'],
            ['xy + yz + zx', { f: 'xy+yz+zx' }, 'Lecture 11.3: a saddle point'],
            ['x⁴ + y⁴ + z⁴ + xyz', { f: 'x^4+y^4+z^4+xyz' }, 'Lecture 11.3: five critical points'],
          ], t.load));
      }, draw);
      function vars3(f) { return hasVar(f, 'z') ? ['x', 'y', 'z'] : ['x', 'y']; }
      function draw() {
        const out = t.out, f = parse(s.v.f), vars = vars3(f), n = vars.length, o = { dec: hasDec(f) }, cf = compile(f);
        const grads = vars.map(v => deriv(f, v)), gp = grads.map(polyOf);
        if (maxPow(f) > 8) throw new MathError('Keep the powers in f at most 8 in this topic.');
        if (gp.some(p => !p)) throw new MathError('This topic finds the critical points of polynomials: only +, −, × and whole powers of x, y, z (no division by x, y or z, no sin, exp, log). Lecture 11.2 shows that sin(xy) has infinitely many critical points.');
        if (gp.some(p => p.totalDeg() > 7)) throw new MathError('Keep the degree of f at most 8 in this topic.');
        const slots = vars.map(v => PV.indexOf(v));
        const hessP = gp.map(g => slots.map(j => g.diff(j)));
        const res = solveSys(gp, slots);
        const sols = res.ok ? res.sols : numSolve(gp, hessP, slots, 4);
        const pts = sols.filter(x => !x.free || !x.free.length), fams = sols.filter(x => x.free && x.free.length);
        // step 1
        out.append(K.card('Step 1: the gradient', K.p('Differentiate with respect to each variable, holding the others constant (the Partial derivatives topic shows every step).'),
          mathBlock('\\nabla f = ' + vecT(grads.map(g => tx(g, o))))));
        // step 2
        const st2 = [{ text: 'A critical point is where every partial derivative is $0$ (lecture 10.4). Solve', tex: grads.map((g, i) => 'f_{' + vars[i] + '} = ' + tx(g, o) + ' = 0').join(',\\quad ') }];
        if (res.ok) st2.push(...res.steps);
        else {
          if (key(f) === key(parse('x^4+y^4+z^4+xyz'))) st2.push(
            { text: 'The lecture’s way (11.3). If one of $x$, $y$, $z$ is $0$, all are: for example $x = 0$ turns $4y^3 + xz = 0$ into $4y^3 = 0$, so $y = 0$, and likewise $z = 0$. That gives $(0, 0, 0)$.' },
            { text: 'Otherwise none is $0$. Multiply the equations by $x$, $y$, $z$:', tex: '4x^4 = -xyz,\\quad 4y^4 = -xyz,\\quad 4z^4 = -xyz' },
            { text: 'So $x^4 = y^4 = z^4$: $y = \\pm x$ and $z = \\pm x$. Put this into $4x^3 + yz = 0$: $4x^3 \\pm x^2 = 0$, so $x = \\pm\\frac{1}{4}$. Checking the signs in all three equations leaves four points.' });
          st2.push({ text: 'This lab could not split these equations into simpler ones, so it solved them numerically (Newton’s method from many starting points between $-4$ and $4$) and then checked every point found by putting it back into $\\nabla f$. Critical points far outside that box could be missed.' });
        }
        const P = s_ => vars.map((v, i) => s_.vals[slots[i]]);
        const famCoord = (fm, v, i) => { if (fm.free.includes(slots[i])) return v; if (fm.vals[slots[i]]) return vT(fm.vals[slots[i]]); const l = fm.lin && fm.lin.find(x => x.v === slots[i]); if (!l) return v; let Pp = Poly.c(l.row[fm.cols.length]); fm.cols.forEach((cv, j) => { if (fm.free.includes(cv)) Pp = Pp.sub(Poly.v(cv).scale(l.row[j])); }); return tx(polyTree(Pp)); };
        const ptT = s_ => '\\left(' + P(s_).map(x => vT(x, o.dec)).join(', ') + '\\right)';
        if (pts.length || fams.length) st2.push({ text: 'So the critical point' + (pts.length + fams.length > 1 ? 's are' : ' is') + ':', tex: [...pts.map(ptT), ...fams.map(fm => '\\left(' + vars.map((v, i) => famCoord(fm, v, i)).join(', ') + '\\right)\\ \\text{for every } ' + fm.free.map(i => PV[i]).join(', '))].join(',\\quad ') });
        else st2.push({ text: '<b>There is no critical point</b>: the equations have no common real solution.' });
        // step 3: the Hessian test at each point
        const H = vars.map(a => vars.map(b => deriv(deriv(f, a), b)));
        const letters = 'ABCDEFGHIJKLMNOP';
        const verdicts = pts.map((p, idx) => hessTest(H, vars, p.vals, slots, o, letters[idx]));
        const ansRows = pts.map((p, idx) => '\\text{' + letters[idx] + '} = ' + ptT(p) + ':\\ \\text{' + verdicts[idx].name + '}');
        fams.forEach(fm => ansRows.push(fm.free.length === n ? '\\text{every point is a critical point}' : '\\left(' + vars.map((v, i) => famCoord(fm, v, i)).join(', ') + '\\right):\\ \\text{a whole ' + (fm.free.length === 1 ? 'line' : 'plane') + ' of critical points}'));
        out.prepend(K.answer(pts.length + fams.length ? 'The critical points and what the Hessian test says' : 'Critical points', ansRows.length ? (ansRows.length === 1 ? ansRows[0] : '\\begin{aligned}' + ansRows.map(r => r.replace(':\\ ', ' &:\\ ')).join(' \\\\ ') + '\\end{aligned}') : '\\text{none}', null));
        out.append(K.card('Step 2: solve $\\nabla f = 0$', K.steps(st2)));
        const Ht = '\\begin{pmatrix}' + H.map(row => row.map(g => tx(g, o)).join(' & ')).join(' \\\\ ') + '\\end{pmatrix}';
        out.append(K.card('Step 3: the Hessian matrix (lecture 11.1)', K.p('The matrix of the second-order partial derivatives; row $i$, column $j$ holds $\\frac{\\partial^2 f}{\\partial x_i\\,\\partial x_j}$. It is symmetric because the mixed partial derivatives of a polynomial are equal.'), mathBlock('H_f(' + fArgs(vars) + ') = ' + Ht),
          K.p(n === 2 ? 'The test (lecture 11.2) at a critical point: if $\\det H > 0$ and $f_{xx} > 0$, a local minimum; if $\\det H > 0$ and $f_{xx} < 0$, a local maximum; if $\\det H < 0$, a saddle point; if $\\det H = 0$, the test says nothing.' : 'The test (lecture 11.3) uses the determinants of the top-left corners $D_1 = f_{xx}$, $D_2 = f_{xx}f_{yy} - f_{xy}^2$, $D_3 = \\det H$: signs $+, +, +$ give a local minimum; $-, +, -$ a local maximum; any other signs with $D_3 \\ne 0$ a saddle point; $D_3 = 0$ says nothing.')));
        verdicts.forEach((vd, idx) => out.append(K.card('Point ' + letters[idx] + ': $' + ptT(pts[idx]) + '$', K.steps(vd.steps))));
        fams.forEach(fm => {
          const fixed = {};
          vars.forEach((v, i) => { if (!fm.free.includes(slots[i]) && fm.vals[slots[i]] && fm.vals[slots[i]].q) fixed[v] = num(fm.vals[slots[i]].q); });
          if (fm.lin) fm.lin.forEach(({ v, row }) => { let P = Poly.c(row[fm.cols.length]); fm.cols.forEach((cv, j) => { if (fm.free.includes(cv)) P = P.sub(Poly.v(cv).scale(row[j])); }); fixed[PV[v]] = polyTree(P); });
          const Hf = H.map(row => row.map(g => S(subst(g, fixed))));
          const det = n === 2 ? S(add(mul(Hf[0][0], Hf[1][1]), neg(mul(Hf[0][1], Hf[1][0])))) : null;
          out.append(K.card(fm.free.length === n ? 'Every point is a critical point' : 'A whole ' + (fm.free.length === 1 ? 'line' : 'plane') + ' of critical points', K.steps([
            { text: 'Every point ' + '$\\left(' + vars.map((v, i) => famCoord(fm, v, i)).join(', ') + '\\right)$ is a critical point (lecture 10.4 shows this for $x^3$: the whole $y$-axis).' },
            { text: 'The Hessian there:', tex: 'H = \\begin{pmatrix}' + Hf.map(row => row.map(g => tx(g, o)).join(' & ')).join(' \\\\ ') + '\\end{pmatrix}' + (det ? ',\\quad \\det H = ' + tx(det, o) : '') },
            det && isNum(det, 0) ? { text: 'The determinant is $0$ at every one of them, so the test says nothing. (For $x^3$ these points are saddle points: $f$ is negative on one side and positive on the other.)' } : { text: 'Apply the test at each point of the line separately.' },
          ])));
        });
        // the picture
        if (n === 2) {
          const xyPts = pts.map(p => [vNum(p.vals[0]), vNum(p.vals[1])]).filter(([x, y]) => Math.abs(x) < 1e3 && Math.abs(y) < 1e3);
          let cx = 0, cy = 0, w = s.v.w;
          if (xyPts.length) { const xsP = xyPts.map(p => p[0]), ysP = xyPts.map(p => p[1]); cx = (Math.min(...xsP) + Math.max(...xsP)) / 2; cy = (Math.min(...ysP) + Math.max(...ysP)) / 2; if (!w) w = Math.max(1, 1.5 * Math.max(Math.max(...xsP) - cx, Math.max(...ysP) - cy) + 0.6); }
          if (!w) w = 2;
          const fxy = (x, y) => cf({ x, y }), win = box2(cx, cy, w);
          const crit = pts.map(p => vNum(valueAt(f, Object.fromEntries(vars.map((v, i) => [v, p.vals[slots[i]].q ? num(p.vals[slots[i]].q) : num(F.parse(p.vals[slots[i]].x.toFixed(12)))])))));
          let cs = autoLevels(fxy, win.x0, win.x1, win.y0, win.y1, NaN);
          const lv = cs.map((c, i) => ({ c, style: 'stroke: color-mix(in oklab, var(--mv1) ' + Math.round(30 + (70 * i) / Math.max(1, cs.length - 1)) + '%, var(--bg-elev))' }));
          verdicts.forEach((vd, i) => { if (vd.kind === 'saddle' && Number.isFinite(crit[i])) lv.push({ c: crit[i], cls: 'lv0', text: false }); });
          const marks = pts.map((p, i) => ({ x: vNum(p.vals[0]), y: vNum(p.vals[1]), shape: verdicts[i].kind, label: letters[i], title: letters[i] + ': ' + verdicts[i].name }));
          const pic = contour({ fxy, ...win, levels: lv, marks, aria: 'level curves of f with its critical points' });
          out.append(K.card('The picture', K.p('Level curves of $f$, darker for higher values. ' + (verdicts.some(v => v.kind === 'saddle') ? 'At a saddle point the level through it (thick) crosses itself.' : '')), pic,
            legend([['', 'local minimum', '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><circle cx="7" cy="7" r="5.5" style="fill: var(--x)"/></svg>'], ['', 'local maximum', '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1L13 12H1Z" style="fill: var(--y)"/></svg>'], ['', 'saddle point', '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2 2L12 12M12 2L2 12" style="fill: none; stroke: var(--z); stroke-width: 3"/></svg>'], ['', 'test inconclusive', '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1L13 7L7 13L1 7Z" style="fill: var(--bg-elev); stroke: var(--ink); stroke-width: 2"/></svg>']])));
        }
        // checks
        if (pts.length) {
          const lines = pts.map((p, idx) => {
            const env = [Z, Z, Z, Z, Z];
            let exact = true;
            vars.forEach((v, i) => { const q = p.vals[slots[i]]; if (q.q) env[slots[i]] = q.q; else exact = false; });
            const ok = exact ? gp.every(g => g.ev(env).isZero()) : gp.every(g => Math.abs(g.evf(slots.reduce((a, sl, i) => { a[sl] = vNum(p.vals[sl]); return a; }, [0, 0, 0, 0, 0]))) < 1e-8);
            // look around: f on a small circle or sphere around the point
            const c = slots.map(sl => vNum(p.vals[sl])), fc = cf(Object.fromEntries(vars.map((v, i) => [v, c[i]]))), r = 1e-3 * Math.max(1, Math.hypot(...c));
            let up = 0, dn = 0;
            const dirs = n === 2 ? Array.from({ length: 36 }, (_, k) => [Math.cos((k * Math.PI) / 18), Math.sin((k * Math.PI) / 18)]) : Array.from({ length: 60 }, (_, k) => { const zz = 1 - (2 * (k + 0.5)) / 60, rr = Math.sqrt(1 - zz * zz), th = k * 2.399963; return [rr * Math.cos(th), rr * Math.sin(th), zz]; });
            dirs.forEach(dv => { const val = cf(Object.fromEntries(vars.map((v, i) => [v, c[i] + r * dv[i]]))) - fc; if (val > 1e-14 * Math.max(1, Math.abs(fc))) up++; else if (val < -1e-14 * Math.max(1, Math.abs(fc))) dn++; });
            const seen = up && !dn ? 'min' : dn && !up ? 'max' : up && dn ? 'saddle' : 'none';
            const agrees = verdicts[idx].kind === 'none' || verdicts[idx].kind === seen;
            return { ok, agrees, text: '<b>' + letters[idx] + '</b>: $\\nabla f = ' + vecT(vars.map(() => '0')) + '$ there ' + (ok ? (exact ? '(exactly) ✓' : '(to 8 decimals) ✓') : '✗') + '. Around it, at distance $' + decT(r) + '$, $f$ is ' + (seen === 'min' ? 'higher in every direction: it looks like a minimum' : seen === 'max' ? 'lower in every direction: it looks like a maximum' : seen === 'saddle' ? 'higher in some directions and lower in others: it looks like a saddle point' : 'about the same') + (verdicts[idx].kind === 'none' ? ' (the test could not tell).' : agrees ? ' ✓' : ' ✗') };
          });
          const allOK = lines.every(l => l.ok && l.agrees);
          out.append(K.card('Check', K.steps(lines.map(l => ({ text: l.text }))), K.note(allOK ? 'Every point solves $\\nabla f = 0$ and looks the way the test says ✓' : 'Some check failed ✗', allOK ? 'good' : 'warn')));
        }
      }
    },
  });

  /* ================================================================== helpers of the topics (defined after use; hoisted) */
  /** are the two trees the same function? exact for fractions of polynomials, else compared at a few points */
  function sameFn(a, b, vars) {
    const ra = ratOf(a), rb = ratOf(b);
    if (ra && rb) return ra.n.mul(rDen(rb)).sub(rb.n.mul(rDen(ra))).isZero();
    const ca = compile(a), cb = compile(b);
    for (let k = 0; k < 5; k++) {
      const env = {};
      vars.forEach((v, i) => { env[v] = 0.37 + 0.61 * k + 0.29 * i; });
      const x = ca(env), y = cb(env);
      if (Number.isFinite(x) && Number.isFinite(y) && Math.abs(x - y) > 1e-9 * Math.max(1, Math.abs(x))) return false;
    }
    return true;
  }
  /** f along a path through (a, b): x, y as polynomials in t (slot 3) with the symbol m (slot 4) or a number par */
  function pathRat(R, a, b, id, par) {
    const tP = Poly.v(3), mP = par == null ? Poly.v(4) : Poly.c(par), A_ = Poly.c(a), B_ = Poly.c(b), t2 = tP.mul(tP);
    const xs = id === 'v' ? A_ : id === 'q' ? A_.add(mP.mul(t2)) : A_.add(tP);
    const ys = id === 'h' ? B_ : id === 'v' || id === 'q' ? B_.add(tP) : id === 'm' ? B_.add(mP.mul(tP)) : B_.add(mP.mul(t2));
    const N = R.n.subst(0, xs).subst(1, ys), Dn = rDen(R).subst(0, xs).subst(1, ys);
    return { N, D: Dn, lim: ratLimit0(N, Dn) };
  }
  /** what a level surface of f looks like (planes and spheres are recognised), or null */
  function describeSurface(f, v0) {
    const P = polyOf(f);
    if (!P || !v0.q) return null;
    const d = P.totalDeg(), c = v0.q, co = e => P.t.get(e.join()) || Z;
    const lin = [co([1, 0, 0, 0, 0]), co([0, 1, 0, 0, 0]), co([0, 0, 1, 0, 0])];
    if (d === 1) return { text: 'Here $f$ has degree 1 (no powers and no products of the variables), so every level surface is a <b>plane</b>. The coefficients of $x$, $y$, $z$ form its normal vector, the direction straight out of the plane:', tex: 'n = ' + vecT(lin.map(q => numT(q))) };
    if (d !== 2 || P.terms().some(t => t.e.filter(Boolean).length > 1)) return null;
    const sq = [co([2, 0, 0, 0, 0]), co([0, 2, 0, 0, 0]), co([0, 0, 2, 0, 0])], k0 = co([0, 0, 0, 0, 0]);
    if (sq.every(q => q.eq(sq[0])) && sq[0].cmp(0) !== 0) {
      const al = sq[0], ctr = lin.map(p => p.div(al.mul(2)).neg());
      const r2 = c.sub(k0).div(al).add(ctr.reduce((acc, q) => acc.add(q.mul(q)), Z));
      const where = ctr.every(q => q.isZero()) ? 'the origin' : '$' + vecT(ctr.map(q => numT(q))) + '$';
      if (r2.cmp(0) <= 0) return { text: 'Completing the squares, the level surface through your point is just the point ' + where + '.' };
      const sp = sqrtParts(r2);
      return { text: 'The squares of $x$, $y$, $z$ have the same coefficient and there are no products like $xy$, so completing the squares shows that the level surface is a <b>sphere</b> with centre ' + where + ' and radius', tex: 'r = \\sqrt{' + numT(r2) + '}' + (sp && sp.t === 1n ? ' = ' + numT(sp.c) : sp && !sp.c.eq(1) ? ' = ' + surdT(sp.c, sp.t) + ' \\approx ' + decT(Math.sqrt(r2.num())) : ' \\approx ' + decT(Math.sqrt(r2.num()))) };
    }
    const sg = sq.map(q => q.cmp(0));
    if (sg.every(x => x > 0) || sg.every(x => x < 0)) return { text: 'All three squares have the same sign but different coefficients, and there are no products like $xy$: the level surfaces are <b>ellipsoids</b> (stretched spheres).' };
    if (sg.every(x => x !== 0)) return { text: 'The squares have different signs: the level surfaces are <b>hyperboloids</b> (and a cone at one level).' };
    return { text: 'One variable has no square: the level surfaces are <b>cylinders</b> over a curve.' };
  }
  /** the Hessian test at a critical point, every determinant written out (lectures 11.2, 11.3) */
  function hessTest(H, vars, vals, slots, o, letter) {
    const n = vars.length, pt = {};
    vars.forEach((v, i) => { const x = vals[slots[i]]; pt[v] = x.q ? num(x.q) : num(F.parse(x.x.toFixed(14))); });
    const exact = vars.every((v, i) => vals[slots[i]].q);
    const Hv = H.map(row => row.map(g => (exact ? valueAt(g, pt) : { q: null, x: compile(g)(Object.fromEntries(vars.map((v, i) => [v, vNum(vals[slots[i]])]))), t: null })));
    const e = (i, j) => Hv[i][j], E = (i, j) => facT(e(i, j), o.dec), pr = (i, j, k, l) => E(i, j) + ' \\cdot ' + E(k, l);
    // brackets of a fixed size, so that a long expansion can break inside them on a phone (\left( … \right) cannot)
    const br = x => (/\\frac/.test(x) ? '\\biggl(' + x + '\\biggr)' : '\\bigl(' + x + '\\bigr)');
    const sub = (p, q) => (p.q && q.q ? { q: p.q.sub(q.q) } : { q: null, x: vNum(p) - vNum(q) });
    const mulv = (p, q) => (p.q && q.q ? { q: p.q.mul(q.q) } : { q: null, x: vNum(p) * vNum(q) });
    const sgn = v => { const x = vNum(v); return v.q ? v.q.cmp(0) : Math.abs(x) < 1e-9 ? 0 : x > 0 ? 1 : -1; };
    const fin = v => (v.q ? numT(v.q, o.dec) : decT(v.x));
    const mat = '\\begin{pmatrix}' + Hv.map(row => row.map(x => vT(x.q ? x : { q: null, x: x.x, t: null }, o.dec)).join(' & ')).join(' \\\\ ') + '\\end{pmatrix}';
    const steps = [{ text: 'The Hessian at the point:', tex: 'H_f = ' + mat }];
    const name = { min: 'local minimum', max: 'local maximum', saddle: 'saddle point', none: 'test inconclusive' };
    let kind;
    if (n === 2) {
      const ad = mulv(e(0, 0), e(1, 1)), bc = mulv(e(0, 1), e(1, 0)), det = sub(ad, bc);
      steps.push({ text: 'Its determinant:', tex: '\\det H = f_{xx}f_{yy} - f_{xy}^2 = ' + pr(0, 0, 1, 1) + ' - ' + E(0, 1) + '^2 = ' + fin(ad) + ' - ' + facT(bc, o.dec) + ' = ' + fin(det) });
      const sd = sgn(det), sx = sgn(e(0, 0));
      if (sd < 0) { kind = 'saddle'; steps.push({ text: '$\\det H < 0$, so ' + letter + ' is a <b>saddle point</b> (like $x^2 - y^2$ at the origin).' }); }
      else if (sd === 0) { kind = 'none'; steps.push({ text: '$\\det H = 0$: the <b>test is inconclusive</b> (like $x^4 + y^4$ at the origin, which is in fact a minimum).' }); }
      else { kind = sx > 0 ? 'min' : 'max'; steps.push({ text: '$\\det H > 0$ and $f_{xx} = ' + fin(e(0, 0)) + (sx > 0 ? ' > 0' : ' < 0') + '$, so ' + letter + ' is a <b>' + name[kind] + '</b> (like $' + (sx > 0 ? 'x^2 + y^2' : '-x^2 - y^2') + '$ at the origin).' }); }
    } else {
      const D1 = e(0, 0), D2 = sub(mulv(e(0, 0), e(1, 1)), mulv(e(0, 1), e(1, 0)));
      const m1 = sub(mulv(e(1, 1), e(2, 2)), mulv(e(1, 2), e(2, 1))), m2 = sub(mulv(e(1, 0), e(2, 2)), mulv(e(1, 2), e(2, 0))), m3 = sub(mulv(e(1, 0), e(2, 1)), mulv(e(1, 1), e(2, 0)));
      const t1 = mulv(e(0, 0), m1), t2 = mulv(e(0, 1), m2), t3 = mulv(e(0, 2), m3);
      const D3 = t1.q && t2.q && t3.q ? { q: t1.q.sub(t2.q).add(t3.q) } : { q: null, x: vNum(t1) - vNum(t2) + vNum(t3) };
      steps.push({ text: 'The top-left $1 \\times 1$ determinant:', tex: 'D_1 = f_{xx} = ' + fin(D1) });
      steps.push({ text: 'The top-left $2 \\times 2$ determinant:', tex: 'D_2 = f_{xx}f_{yy} - f_{xy}^2 = ' + pr(0, 0, 1, 1) + ' - ' + E(0, 1) + '^2 = ' + fin(D2) });
      steps.push({ text: 'The whole determinant, expanded along the first row:', tex: 'D_3 = ' + E(0, 0) + br(pr(1, 1, 2, 2) + ' - ' + pr(1, 2, 2, 1)) + ' - ' + E(0, 1) + br(pr(1, 0, 2, 2) + ' - ' + pr(1, 2, 2, 0)) + ' + ' + E(0, 2) + br(pr(1, 0, 2, 1) + ' - ' + pr(1, 1, 2, 0)) + ' = ' + E(0, 0) + ' \\cdot ' + facT(m1, o.dec) + ' - ' + E(0, 1) + ' \\cdot ' + facT(m2, o.dec) + ' + ' + E(0, 2) + ' \\cdot ' + facT(m3, o.dec) + ' = ' + fin(D3) });
      const s1 = sgn(D1), s2 = sgn(D2), s3 = sgn(D3), sg = x => (x > 0 ? '+' : x < 0 ? '-' : '0');
      if (s3 === 0) kind = 'none';
      else if (s1 > 0 && s2 > 0 && s3 > 0) kind = 'min';
      else if (s1 < 0 && s2 > 0 && s3 < 0) kind = 'max';
      else kind = 'saddle';
      steps.push({ text: 'The signs of $D_1, D_2, D_3$ are $' + [s1, s2, s3].map(sg).join(',\\ ') + '$: ' + (kind === 'none' ? '$D_3 = 0$, so the <b>test is inconclusive</b>.' : kind === 'min' ? 'all positive, so ' + letter + ' is a <b>local minimum</b>.' : kind === 'max' ? 'minus, plus, minus, so ' + letter + ' is a <b>local maximum</b>.' : 'neither $+, +, +$ nor $-, +, -$, and $D_3 \\ne 0$, so ' + letter + ' is a <b>saddle point</b>.') });
    }
    return { kind, name: name[kind], steps };
  }

  // tests run outside the browser hand in window.MV_TEST to receive the engine; pages never set it
  if (typeof window !== 'undefined' && typeof window.MV_TEST === 'function') {
    window.MV_TEST({ parse, tx, S, D, deriv, polyOf, ratOf, rDiff, ratTree, polyTree, Poly, uniSolve, solveSys, numSolve, valueAt, evalChain, explainD, ident, Q2, cosSinDeg, ratApprox, compile, evx, subst, key, factoredT, sqrtParts, surdT, PV });
  }
})();
