/* Revise — core helpers shared by every page and widget.
   Classic script (no modules) so the site opens straight from file://. */
(function () {
  'use strict';
  const Lab = (window.Lab = window.Lab || {});

  /* ------------------------------------------------------------------ DOM */
  const SVGNS = 'http://www.w3.org/2000/svg';

  function setAttrs(el, attrs) {
    if (!attrs) return;
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') el.setAttribute('class', v);
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  function append(el, kids) {
    for (const k of kids.flat(Infinity)) {
      if (k == null || k === false) continue;
      el.appendChild(k instanceof Node ? k : document.createTextNode(String(k)));
    }
    return el;
  }
  /** h('div', {class:'x'}, child, 'text', [more]) */
  function h(tag, attrs, ...kids) {
    const el = document.createElement(tag);
    setAttrs(el, attrs);
    return append(el, kids);
  }
  /** svg('rect', {x:0, y:0}) */
  function svg(tag, attrs, ...kids) {
    const el = document.createElementNS(SVGNS, tag);
    setAttrs(el, attrs);
    return append(el, kids);
  }
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /** Template tag with String.raw semantics: lesson text can hold LaTeX (\frac, \text) unescaped. */
  function T(strings, ...vals) {
    let out = '';
    strings.raw.forEach((str, i) => { out += str; if (i < vals.length) out += vals[i]; });
    return out;
  }

  Object.assign(Lab, { h, svg, $, $$, clear, esc, T, append });

  /* ------------------------------------------------------------ Fractions */
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a || 1; }

  class Frac {
    constructor(n, d = 1) {
      if (n instanceof Frac) { this.n = n.n; this.d = n.d; this.approx = n.approx; return; }
      if (!Number.isInteger(n) || !Number.isInteger(d) || !Number.isSafeInteger(n) || !Number.isSafeInteger(d)) {
        const v = n / d;
        if (!isFinite(v)) throw new Error('Not a finite number');
        // too big for an exact integer (e.g. 40!): keep the rounded value, marked approximate
        if (Math.abs(v) >= Number.MAX_SAFE_INTEGER) { this.n = Math.round(v); this.d = 1; this.approx = true; return; }
        const f = Frac.fromNumber(v);
        this.n = f.n; this.d = f.d; this.approx = true;
        return;
      }
      if (d === 0) throw new Error('Fraction with zero denominator');
      if (d < 0) { n = -n; d = -d; }
      const g = gcd(n, d);
      this.n = n / g; this.d = d / g;
      if (this.n === 0) this.d = 1;
    }
    static of(x) {
      if (x instanceof Frac) return x;
      if (typeof x === 'number') return Number.isInteger(x) ? new Frac(x, 1) : Frac.fromDecimal(x);
      if (typeof x === 'string') {
        const s = x.trim();
        const m = s.match(/^(-?\d+)\s*\/\s*(\d+)$/);
        if (m) return new Frac(parseInt(m[1], 10), parseInt(m[2], 10));
        if (/^-?\d*\.?\d+$/.test(s)) return Frac.fromDecimalString(s);
        const v = Lab.expr ? Lab.expr.evaluate(s) : NaN;
        if (v instanceof Frac) return v;
        if (typeof v === 'number' && isFinite(v)) return Frac.fromNumber(v);
        throw new Error('Cannot read "' + x + '" as a number');
      }
      throw new Error('Cannot read value as a number');
    }
    static fromDecimalString(s) {
      const neg = s.startsWith('-');
      const t = neg ? s.slice(1) : s;
      const [a, b = ''] = t.split('.');
      const d = Math.pow(10, b.length);
      const n = parseInt((a || '0') + b, 10);
      return new Frac(neg ? -n : n, d);
    }
    static fromDecimal(x) {
      // exact for short decimals like 0.25, 0.1; else best rational approximation
      const s = String(x);
      if (/^-?\d*\.\d{1,9}$/.test(s)) return Frac.fromDecimalString(s);
      return Frac.fromNumber(x);
    }
    static fromNumber(x, maxDen = 1e6) {
      if (!isFinite(x)) throw new Error('Not a finite number');
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x);
      let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
      for (let i = 0; i < 40; i++) {
        const a = Math.floor(b);
        const h2 = a * h1 + h0, k2 = a * k1 + k0;
        if (k2 > maxDen || !Number.isSafeInteger(h2)) break;
        h0 = h1; h1 = h2; k0 = k1; k1 = k2;
        if (Math.abs(x - h1 / k1) < 1e-12) break;
        b = 1 / (b - a);
        if (!isFinite(b)) break;
      }
      const f = new Frac(sign * h1, k1 || 1);
      if (Math.abs(f.valueOf() - sign * x) > 1e-12) f.approx = true;
      return f;
    }
    add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
    sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
    mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
    div(o) { o = Frac.of(o); if (o.n === 0) throw new Error('Division by zero'); return new Frac(this.n * o.d, this.d * o.n); }
    neg() { return new Frac(-this.n, this.d); }
    pow(k) { let r = new Frac(1); for (let i = 0; i < Math.abs(k); i++) r = r.mul(this); return k < 0 ? new Frac(1).div(r) : r; }
    eq(o) { o = Frac.of(o); return this.n === o.n && this.d === o.d; }
    cmp(o) { o = Frac.of(o); return this.valueOf() - o.valueOf(); }
    isZero() { return this.n === 0; }
    valueOf() { return this.n / this.d; }
    toString() { return this.d === 1 ? String(this.n) : this.n + '/' + this.d; }
    /** LaTeX: \frac{n}{d} */
    tex() {
      if (this.d === 1) return String(this.n);
      const s = this.n < 0 ? '-' : '';
      return s + '\\frac{' + Math.abs(this.n) + '}{' + this.d + '}';
    }
    /** Stacked fraction as HTML (for tables and widgets) */
    html() {
      if (this.d === 1) return '<span class="fr-int">' + this.n + '</span>';
      const s = this.n < 0 ? '−' : '';
      return '<span class="fr">' + (s ? '<span class="fr-sign">' + s + '</span>' : '') +
        '<span class="fr-n">' + Math.abs(this.n) + '</span><span class="fr-d">' + this.d + '</span></span>';
    }
    /** Re-express with a chosen denominator if it divides evenly (e.g. 1/12 -> 3/36) */
    over(den) {
      if (den % this.d !== 0) return null;
      return { n: this.n * (den / this.d), d: den };
    }
    dec(dp = 4) { return Lab.fmtDec(this.valueOf(), dp); }
  }
  const F = (n, d) => (d === undefined ? Frac.of(n) : new Frac(n, d));
  F.sum = arr => arr.reduce((a, b) => a.add(b), new Frac(0));
  F.zero = () => new Frac(0);
  F.one = () => new Frac(1);
  F.isFrac = x => x instanceof Frac;
  Lab.Frac = Frac;
  Lab.F = F;

  /** Format any numeric value (Frac or float) as short text */
  Lab.fmtDec = function (v, dp = 4) {
    if (typeof v !== 'number') v = Number(v);
    if (!isFinite(v)) return String(v);
    if (Number.isInteger(v)) return String(v);
    let s = v.toFixed(dp);
    s = s.replace(/0+$/, '').replace(/\.$/, '');
    if (s === '-0') s = '0';
    return s;
  };
  /** Decimal for display: 3 places normally, 2 significant digits for small values (0.0025, 0.0050). */
  Lab.fmtSmall = function (v) {
    v = Number(v);
    const a = Math.abs(v);
    if (a !== 0 && a < 0.01) return v.toPrecision(2);
    return Lab.fmtDec(v, 3);
  };
  Lab.fmt = function (v, dp = 4) {
    if (v instanceof Frac) return v.approx ? Lab.fmtDec(v.valueOf(), dp) : v.toString();
    return Lab.fmtDec(v, dp);
  };
  Lab.fmtTex = function (v, dp = 4) {
    if (v instanceof Frac) return v.approx ? Lab.fmtDec(v.valueOf(), dp) : v.tex();
    return Lab.fmtDec(v, dp);
  };
  Lab.fmtHtml = function (v, dp = 4) {
    if (v instanceof Frac) return v.approx ? '<span class="fr-int">' + Lab.fmtDec(v.valueOf(), dp) + '</span>' : v.html();
    return '<span class="fr-int">' + Lab.fmtDec(v, dp) + '</span>';
  };
  /** A value used as a label (outcome values like 3, -1, 0.5) */
  Lab.fmtVal = function (v) {
    if (v instanceof Frac) return v.toString();
    if (typeof v === 'number') return Lab.fmtDec(v, 4).replace(/^-/, '−');
    return String(v);
  };

  /* ---------------------------------------------- Safe expression parser */
  // Supports: numbers, + - * / ^ %, parentheses, |x| bars, implicit multiplication (2x),
  // variables, functions abs min max floor ceil round sqrt mod C P fact exp ln log,
  // and comparisons < <= > >= == != (also = ), which give 1 (true) or 0 (false): (y >= 5) is an indicator.
  const expr = (function () {
    const FUNCS = {
      abs: { n: 1, f: a => (isF(a) ? (a.n < 0 ? a.neg() : a) : Math.abs(a)) },
      min: { n: -1, f: (...a) => a.reduce((m, x) => (num(x) < num(m) ? x : m)) },
      max: { n: -1, f: (...a) => a.reduce((m, x) => (num(x) > num(m) ? x : m)) },
      floor: { n: 1, f: a => new Frac(Math.floor(num(a))) },
      ceil: { n: 1, f: a => new Frac(Math.ceil(num(a))) },
      round: { n: 1, f: a => new Frac(Math.round(num(a))) },
      sign: { n: 1, f: a => new Frac(Math.sign(num(a))) },
      sqrt: { n: 1, f: a => { const v = Math.sqrt(num(a)); return Number.isInteger(v) ? new Frac(v) : v; } },
      mod: { n: 2, f: (a, b) => modOp(a, b) },
      fact: { n: 1, f: a => new Frac(factorial(num(a))) },
      C: { n: 2, f: (a, b) => new Frac(choose(num(a), num(b))) },
      nCr: { n: 2, f: (a, b) => new Frac(choose(num(a), num(b))) },
      P: { n: 2, f: (a, b) => new Frac(perm(num(a), num(b))) },
      nPr: { n: 2, f: (a, b) => new Frac(perm(num(a), num(b))) },
      exp: { n: 1, f: a => Math.exp(num(a)) },
      ln: { n: 1, f: a => Math.log(num(a)) },
      log: { n: 1, f: a => Math.log10(num(a)) },
    };
    const CONSTS = { e: Math.E, pi: Math.PI };
    function isF(x) { return x instanceof Frac; }
    function num(x) { return isF(x) ? x.valueOf() : x; }
    const CMP = { '<': 1, '<=': 1, '>': 1, '>=': 1, '==': 1, '!=': 1 };
    function bin(op, a, b) {
      if (CMP[op]) {
        const d = isF(a) && isF(b) && !a.approx && !b.approx ? a.sub(b).valueOf() : num(a) - num(b);
        const r = op === '<' ? d < 0 : op === '<=' ? d <= 1e-12 : op === '>' ? d > 0 : op === '>=' ? d >= -1e-12 : op === '==' ? Math.abs(d) < 1e-12 : Math.abs(d) >= 1e-12;
        return new Frac(r ? 1 : 0);
      }
      if (isF(a) && isF(b) && !a.approx && !b.approx) {
        switch (op) {
          case '+': return a.add(b);
          case '-': return a.sub(b);
          case '*': return a.mul(b);
          case '/': if (b.n === 0) throw new Error('Division by zero'); return a.div(b);
          case '^': if (b.d === 1 && Math.abs(b.n) <= 64) return a.pow(b.n); return Math.pow(num(a), num(b));
          case '%': return modOp(a, b);
        }
      }
      const x = num(a), y = num(b);
      switch (op) {
        case '+': return x + y; case '-': return x - y; case '*': return x * y;
        case '/': if (y === 0) throw new Error('Division by zero'); return x / y;
        case '^': return Math.pow(x, y);
        case '%': return ((x % y) + y) % y;
      }
      throw new Error('Unknown operator ' + op);
    }
    function modOp(a, b) {
      const x = num(a), y = num(b);
      if (y === 0) throw new Error('mod by zero');
      const r = ((x % y) + y) % y;
      return Number.isInteger(r) ? new Frac(r) : r;
    }
    function tokenize(src) {
      const toks = [];
      let i = 0;
      const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
      while (i < s.length) {
        const c = s[i];
        if (/\s/.test(c)) { i++; continue; }
        if (/[0-9.]/.test(c)) {
          let j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
          const t = s.slice(i, j);
          if ((t.match(/\./g) || []).length > 1) throw new Error('Bad number "' + t + '"');
          toks.push({ t: 'num', v: t }); i = j; continue;
        }
        if (/[A-Za-z_]/.test(c)) {
          let j = i; while (j < s.length && /[A-Za-z_0-9]/.test(s[j])) j++;
          toks.push({ t: 'id', v: s.slice(i, j) }); i = j; continue;
        }
        const two = s.slice(i, i + 2);
        if (two === '<=' || two === '>=' || two === '==' || two === '!=') { toks.push({ t: two }); i += 2; continue; }
        if (c === '<' || c === '>') { toks.push({ t: c }); i++; continue; }
        if (c === '=') { toks.push({ t: '==' }); i++; continue; }
        if ('+-*/^%(),|'.includes(c)) { toks.push({ t: c }); i++; continue; }
        throw new Error('Unexpected "' + c + '"');
      }
      return toks;
    }
    function parse(src) {
      const toks = tokenize(src);
      let p = 0;
      const peek = () => toks[p];
      const eat = t => { const k = toks[p]; if (!k || k.t !== t) throw new Error('Expected "' + t + '"'); p++; return k; };
      function comparison() {
        const node = expression();
        const k = peek();
        if (k && CMP[k.t]) { p++; return { op: k.t, a: node, b: expression() }; }
        return node;
      }
      function expression() {
        let node = term();
        while (peek() && (peek().t === '+' || peek().t === '-')) { const op = toks[p++].t; node = { op, a: node, b: term() }; }
        return node;
      }
      function startsPrimary(k) { return k && (k.t === 'num' || k.t === 'id' || k.t === '('); }
      function term() {
        let node = unary();
        for (;;) {
          const k = peek();
          if (k && (k.t === '*' || k.t === '/' || k.t === '%')) { p++; node = { op: k.t, a: node, b: unary() }; }
          else if (startsPrimary(k)) { node = { op: '*', a: node, b: unary() }; } // implicit 2x, 3(x+1)
          else break;
        }
        return node;
      }
      function unary() {
        const k = peek();
        if (k && k.t === '-') { p++; return { op: 'neg', a: unary() }; }
        if (k && k.t === '+') { p++; return unary(); }
        return power();
      }
      function power() {
        const base = primary();
        if (peek() && peek().t === '^') { p++; return { op: '^', a: base, b: unary() }; }
        return base;
      }
      function primary() {
        const k = toks[p++];
        if (!k) throw new Error('Expression ended early');
        if (k.t === 'num') return { num: k.v };
        if (k.t === '(') { const e = comparison(); eat(')'); return e; }
        if (k.t === '|') { const e = expression(); eat('|'); return { fn: 'abs', args: [e] }; }
        if (k.t === 'id') {
          if (peek() && peek().t === '(') {
            p++;
            const args = [];
            if (peek() && peek().t !== ')') { args.push(comparison()); while (peek() && peek().t === ',') { p++; args.push(comparison()); } }
            eat(')');
            if (!FUNCS[k.v]) throw new Error('Unknown function "' + k.v + '"');
            const need = FUNCS[k.v].n;
            if (need > 0 && args.length !== need) throw new Error(k.v + '() needs ' + need + ' argument' + (need > 1 ? 's' : ''));
            return { fn: k.v, args };
          }
          return { id: k.v };
        }
        throw new Error('Unexpected "' + k.t + '"');
      }
      const tree = comparison();
      if (p < toks.length) throw new Error('Unexpected "' + (toks[p].v || toks[p].t) + '"');
      return tree;
    }
    function evalNode(n, vars) {
      if (n.num !== undefined) return Frac.fromDecimalString(n.num.startsWith('.') ? '0' + n.num : n.num);
      if (n.id !== undefined) {
        if (vars && Object.prototype.hasOwnProperty.call(vars, n.id)) { const v = vars[n.id]; return typeof v === 'number' && Number.isInteger(v) ? new Frac(v) : v; }
        if (CONSTS[n.id] !== undefined) return CONSTS[n.id];
        throw new Error('Unknown name "' + n.id + '"');
      }
      if (n.fn) return FUNCS[n.fn].f(...n.args.map(a => evalNode(a, vars)));
      if (n.op === 'neg') { const v = evalNode(n.a, vars); return isF(v) ? v.neg() : -v; }
      return bin(n.op, evalNode(n.a, vars), evalNode(n.b, vars));
    }
    function compile(src) {
      const tree = parse(src);
      return vars => evalNode(tree, vars);
    }
    function evaluate(src, vars) { return evalNode(parse(src), vars); }
    function vars(src) {
      const out = new Set();
      (function walk(n) { if (!n) return; if (n.id && !CONSTS[n.id]) out.add(n.id); if (n.args) n.args.forEach(walk); walk(n.a); walk(n.b); })(parse(src));
      return [...out];
    }
    return { parse, compile, evaluate, vars, num };
  })();
  Lab.expr = expr;

  function factorial(n) { if (n < 0 || !Number.isInteger(n)) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; }
  function choose(n, k) {
    if (!Number.isInteger(n) || !Number.isInteger(k) || k < 0 || k > n) return 0;
    k = Math.min(k, n - k); let r = 1;
    for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
    return Math.round(r);
  }
  function perm(n, k) { if (k < 0 || k > n) return 0; let r = 1; for (let i = 0; i < k; i++) r *= n - i; return r; }
  Lab.math = { factorial, choose, perm, gcd };

  /** Compare a learner's typed answer against an expected value.
      Fractions and expressions ("3/36", "1/6*1/6") must be exact; a decimal is accepted when it is
      the expected value correctly rounded to the places typed (at least 2). */
  Lab.answerMatches = function (input, expected, tol) {
    const s = String(input).trim().replace(/,/g, '');
    if (!s) return { ok: false, error: 'Type an answer first.' };
    let v;
    try { v = expr.evaluate(s); } catch (e) { return { ok: false, error: e.message }; }
    const a = expr.num(v), b = expr.num(Frac.of(expected));
    if (!isFinite(a)) return { ok: false, error: 'That is not a finite number.' };
    let t = tol;
    if (t == null) {
      const decs = s.match(/\.\d+/g);
      const dp = decs ? Math.max(...decs.map(x => x.length - 1)) : 0;
      t = dp >= 2 ? 0.5 * Math.pow(10, -dp) + 1e-12 : 1e-9 * Math.max(1, Math.abs(b));
    }
    return { ok: Math.abs(a - b) <= t, value: v };
  };

  /* ------------------------------------------------------------- KaTeX */
  Lab.macros = { '\\given': '\\,\\middle|\\,', '\\Prob': '\\operatorname{P}' };
  Lab.tex = function (src, display = false) {
    if (typeof src === 'number') src = Lab.fmtVal(src);
    if (!window.katex) return '<code>' + esc(src) + '</code>';
    try {
      return katex.renderToString(src, { displayMode: display, throwOnError: false, strict: 'ignore', macros: Lab.macros, output: 'html' });
    } catch (e) { return '<code>' + esc(src) + '</code>'; }
  };
  Lab.renderMath = function (el) {
    if (!el || !window.renderMathInElement) return;
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '$', right: '$', display: false },
      ],
      ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'option', 'input'],
      ignoredClasses: ['no-math', 'katex'],
      throwOnError: false,
      strict: 'ignore',
      macros: Lab.macros,
    });
  };
  /** Set innerHTML and typeset any math inside. */
  Lab.setHTML = function (el, html) { el.innerHTML = html; Lab.renderMath(el); return el; };

  /* ------------------------------------------------------------- Events */
  const handlers = {};
  Lab.on = (evt, fn) => { (handlers[evt] = handlers[evt] || []).push(fn); return () => Lab.off(evt, fn); };
  Lab.off = (evt, fn) => { handlers[evt] = (handlers[evt] || []).filter(f => f !== fn); };
  Lab.emit = (evt, payload) => { (handlers[evt] || []).slice().forEach(fn => { try { fn(payload); } catch (e) { console.error(e); } }); };

  /* ----------------------------------------------------------- Storage */
  const KEY = 'statslab.v1';
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; }
  }
  const data = loadStore();
  Lab.store = {
    get(key, def) { return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : def; },
    set(key, val) { data[key] = val; try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode: keep in memory */ } },
    all() { return data; },
    reset() { for (const k of Object.keys(data)) delete data[k]; try { localStorage.removeItem(KEY); } catch (e) {} },
  };

  /* --------------------------------------------------------- Animation */
  const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  Lab.reducedMotion = () => mq.matches;
  /** Global animation speed: 0.5 slow, 1 normal, 2 fast (user setting). */
  Lab.speed = () => Lab.store.get('speed', 1);
  Lab.dur = ms => (Lab.reducedMotion() ? 0 : ms / Lab.speed());
  Lab.ease = {
    inOut: t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: t => 1 - Math.pow(1 - t, 3),
    in: t => t * t * t,
    linear: t => t,
    back: t => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  };
  Lab.sleep = ms => new Promise(r => setTimeout(r, Lab.dur(ms)));
  /** Animate a value 0→1 over ms; onUpdate(eased t). Resolves when done. */
  Lab.tween = function (ms, onUpdate, ease = Lab.ease.inOut) {
    const d = Lab.dur(ms);
    return new Promise(resolve => {
      if (d <= 0) { onUpdate(1); resolve(); return; }
      const t0 = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - t0) / d);
        onUpdate(ease(t));
        if (t < 1) requestAnimationFrame(frame); else resolve();
      }
      requestAnimationFrame(frame);
    });
  };
  /** Fly a ghost copy of `node` from its place to `target` (both inside `layer`). */
  Lab.fly = function (node, target, layer, opts = {}) {
    const d = Lab.dur(opts.ms || 650);
    const lr = layer.getBoundingClientRect();
    const a = node.getBoundingClientRect();
    const b = target.getBoundingClientRect();
    // rects are on-screen pixels; under the text-size zoom the layer's own pixels are bigger by z
    const z = layer.offsetWidth ? lr.width / layer.offsetWidth || 1 : 1;
    const ghost = opts.ghost || node.cloneNode(true);
    ghost.classList.add('fly-ghost');
    Object.assign(ghost.style, {
      position: 'absolute', left: (a.left - lr.left) / z + 'px', top: (a.top - lr.top) / z + 'px',
      width: a.width / z + 'px', height: a.height / z + 'px', margin: 0, zIndex: 20, pointerEvents: 'none',
    });
    layer.appendChild(ghost);
    if (d <= 0) { ghost.remove(); return Promise.resolve(); }
    const dx = (b.left + b.width / 2 - (a.left + a.width / 2)) / z;
    const dy = (b.top + b.height / 2 - (a.top + a.height / 2)) / z;
    const sc = opts.scale != null ? opts.scale : 0.7;
    const anim = ghost.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: 'translate(' + dx * 0.5 + 'px,' + (dy * 0.5 - (opts.arc || 24)) + 'px) scale(' + (1 + sc) / 2 + ')', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sc + ')', opacity: opts.fadeOut === false ? 1 : 0.15 },
    ], { duration: d, easing: 'cubic-bezier(.45,.05,.3,1)', fill: 'forwards' });
    return anim.finished.then(() => ghost.remove(), () => ghost.remove());
  };
  /** Brief attention pulse on an element. */
  Lab.pulse = function (el) {
    if (!el || Lab.reducedMotion()) return;
    el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)' }], { duration: Lab.dur(380), easing: 'ease-out' });
  };

  /* ------------------------------------------------------------ Random */
  Lab.rand = {
    int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)),
    pick: arr => arr[Math.floor(Math.random() * arr.length)],
    /** index drawn with the given probabilities (Frac or numbers) */
    weighted(ps) {
      const w = ps.map(p => Number(p));
      const tot = w.reduce((a, b) => a + b, 0);
      let r = Math.random() * tot;
      for (let i = 0; i < w.length; i++) { r -= w[i]; if (r < 0) return i; }
      return w.length - 1;
    },
  };

  /* ---------------------------------------------------- Misc utilities */
  Lab.range = (a, b, step = 1) => { const out = []; for (let v = a; step > 0 ? v <= b : v >= b; v += step) out.push(v); return out; };
  Lab.uid = (() => { let i = 0; return (p = 'u') => p + (++i).toString(36); })();
  Lab.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  Lab.sameVal = (a, b) => Number(a) === Number(b);
})();
