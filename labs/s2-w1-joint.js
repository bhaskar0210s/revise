/* Revise — Statistics II · Week 1 playground lab (L1.1–L1.3).
   'lab-s2-joint': the learner's own joint PMF — typed as a table, or counted from an experiment — with the validity
   checks, both marginal PMFs, a conditional PMF, the probability of any event, X and Y given that event (L1.3) and
   PMF/CDF graphs. Every number on the page is written out with the learner's values.
   Also defines Lab.play.t1: number-formatting helpers shared with labs/s2-w1-build.js (looked up at render time). */
(function () {
  'use strict';
  const { h, F } = Lab;
  const Frac = Lab.Frac;
  const K = Lab.play;
  const tex = (s, d) => Lab.tex(s, d);
  const esc = Lab.esc;

  /* ================================================================ shared helpers */
  const U = (K.t1 = K.t1 || {});
  const isExact = f => f instanceof Frac && !f.approx;
  U.isExact = isExact;
  /** TeX for a variable name: X1 → X_{1}. */
  U.tn = n => String(n).replace(/(\d+)$/, '_{$1}');
  /** A safe variable name (1–3 letters/digits, starting with a letter), or def. */
  U.name = (s, def) => { s = String(s == null ? '' : s).trim(); return /^[A-Za-z][A-Za-z0-9]{0,2}$/.test(s) && !/^(e|pi)$/.test(s) ? s : def; };
  U.val = v => Lab.fmtVal(v);
  /** A float as TeX: 4 decimals, or scientific notation below 0.001. */
  U.fl = function (x) {
    x = Number(x);
    if (!Number.isFinite(x)) return String(x);
    if (x === 0) return '0';
    if (Math.abs(x) >= 0.001) return Lab.fmtDec(x, 4);
    const [m, e] = x.toExponential(1).split('e');
    return m + '\\times 10^{' + Number(e) + '}';
  };
  /** Exact fraction in small (text-style) TeX. */
  U.tf = f => (isExact(f) ? f.tex().replace('\\frac', '\\tfrac') : U.fl(f));
  /** The exact decimal of a fraction whose denominator has only the factors 2 and 5 (else null). */
  U.exactDec = function (f) {
    if (!isExact(f)) return null;
    let d = f.d, a = 0, b = 0;
    while (d % 2 === 0) { d /= 2; a++; }
    while (d % 5 === 0) { d /= 5; b++; }
    if (d !== 1) return null;
    const k = Math.max(a, b);
    if (k > 8) return null;
    const m = Math.abs(f.n) * (Math.pow(10, k) / f.d);
    if (!Number.isSafeInteger(m)) return null;
    let s = String(m);
    if (k > 0) { s = s.padStart(k + 1, '0'); s = s.slice(0, s.length - k) + '.' + s.slice(s.length - k); }
    return (f.n < 0 ? '-' : '') + s;
  };
  /** Least common denominator of exact fractions (null when one is not exact or it is too big). */
  U.lcd = function (list, limit = 1e6) {
    let L = 1;
    for (const f of list) {
      if (!isExact(f)) return null;
      if (f.isZero()) continue;
      L = (L / Lab.math.gcd(L, f.d)) * f.d;
      if (L > limit) return null;
    }
    return L;
  };
  U.add = (a, b) => (isExact(a) && isExact(b) ? a.add(b) : Number(a) + Number(b));
  U.mul = (a, b) => (isExact(a) && isExact(b) ? a.mul(b) : Number(a) * Number(b));
  U.sum = list => list.reduce((s, x) => U.add(s, x), F(0));
  U.isOne = f => (isExact(f) ? f.eq(1) : Math.abs(Number(f) - 1) < 1e-9);
  /**
   * TeX for a probability in the chosen number format c = {mode: 'frac'|'count'|'dec', D}.
   * frac: 3/8 · count: 3/8 written over the common denominator D · dec: exact decimal when it exists.
   */
  U.p = function (f, c) {
    if (!(f instanceof Frac)) return U.fl(f);
    if (!isExact(f)) return U.fl(f);
    if (f.isZero()) return '0';
    const mode = c && c.mode;
    if (mode === 'dec') { const s = U.exactDec(f); return s != null ? s : U.tf(f); }
    if (mode === 'count' && c.D && c.D % f.d === 0) return '\\tfrac{' + f.n * (c.D / f.d) + '}{' + c.D + '}';
    return U.tf(f);
  };
  /** A result: U.p plus the reduced fraction (count mode) and ≈ decimal (when asked, or when the decimal does not end). */
  U.res = function (f, c, approx) {
    let s = U.p(f, c);
    if (!isExact(f) || f.isZero()) return s;
    const mode = c && c.mode;
    if (mode === 'count' && c.D && c.D % f.d === 0 && f.d !== c.D) s += '=' + U.tf(f);
    const dec = U.exactDec(f);
    if (mode === 'dec') { if (dec == null) s += '\\approx ' + Lab.fmtDec(Number(f), 4); }
    else if (approx && f.d !== 1) s += dec != null ? '=' + dec : '\\approx ' + Lab.fmtDec(Number(f), 4);
    return s;
  };
  /** "a + b + c [= same denominator] = total" */
  U.sumLine = function (terms, total, c, approx) {
    if (!terms.length) return '0';
    if (terms.length === 1) return U.res(total, c, approx);
    let s = terms.map(t => U.p(t, c)).join('+');
    if (c && c.mode === 'frac' && terms.length <= 16 && terms.every(isExact)) {
      const nz = terms.filter(t => !t.isZero());
      const L = U.lcd(nz);
      if (L && new Set(nz.map(t => t.d)).size > 1) s += '=' + terms.map(t => (t.isZero() ? '0' : '\\tfrac{' + t.n * (L / t.d) + '}{' + L + '}')).join('+');
    }
    return s + '=' + U.res(total, c, approx);
  };
  /** "a ÷ b = …" with every step: count mode cancels the common denominator, fraction mode multiplies by 1/b. */
  U.divLine = function (a, b, c) {
    if (!isExact(a) || !isExact(b)) return '\\dfrac{' + U.p(a, c) + '}{' + U.p(b, c) + '}=' + U.fl(Number(a) / Number(b));
    if (a.isZero()) {
      const mode0 = c && c.mode, db = U.exactDec(b);
      const den = mode0 === 'count' && c.D && c.D % b.d === 0 ? b.n * (c.D / b.d) + '/' + c.D : mode0 === 'dec' && db != null ? db : b.toString();
      return '\\dfrac{0}{' + den + '}=0';
    }
    const r = a.div(b);
    const mode = c && c.mode;
    if (mode === 'count' && c.D && c.D % a.d === 0 && c.D % b.d === 0) {
      const ka = a.n * (c.D / a.d), kb = b.n * (c.D / b.d);
      return '\\dfrac{' + ka + '/' + c.D + '}{' + kb + '/' + c.D + '}=\\dfrac{' + ka + '}{' + kb + '}' + (r.n !== ka || r.d !== kb ? '=' + U.tf(r) : '');
    }
    if (mode === 'dec') {
      const da = U.exactDec(a), db = U.exactDec(b);
      if (da != null && db != null) return '\\dfrac{' + da + '}{' + db + '}=' + U.res(r, c);
    }
    if (b.eq(1)) return '\\dfrac{' + a.toString() + '}{1}=' + U.tf(r);
    return '\\dfrac{' + a.toString() + '}{' + b.toString() + '}=' + U.tf(a) + '\\cdot ' + U.tf(F(1).div(b)) + '=' + U.tf(r);
  };
  /** (p1, p2, …) — over a common denominator in count mode; long lists keep the ends. */
  U.tuple = function (list, c, max = 10) {
    const cut = parts => (parts.length > max ? parts.slice(0, max - 3).concat(['\\dots'], parts.slice(-2)) : parts).join(',\\ ');
    if (c && c.mode === 'count' && c.D && list.every(f => isExact(f) && c.D % f.d === 0)) return '\\tfrac{1}{' + c.D + '}\\left(' + cut(list.map(f => String(f.n * (c.D / f.d)))) + '\\right)';
    return '\\left(' + cut(list.map(f => U.p(f, c))) + '\\right)';
  };
  /** {0,1,2} — consecutive integers shortened to {0,1,…,40}. */
  U.set = function (vals) {
    const v = vals.map(Number);
    if (v.length > 5 && v.every((x, i) => i === 0 || x === v[i - 1] + 1)) return '\\{' + U.val(v[0]) + ',' + U.val(v[1]) + ',\\dots,' + U.val(v[v.length - 1]) + '\\}';
    const parts = vals.map(U.val);
    return '\\{' + (parts.length > 14 ? parts.slice(0, 10).concat(['\\dots'], parts.slice(-2)) : parts).join(',') + '\\}';
  };
  /** Replace variable names in an expression by their values (for "X = max(2,5) = 5" readouts). */
  U.subst = function (src, env) {
    const show = v => (v instanceof Frac ? v.toString() : String(Lab.expr.num(v)));
    return String(src).replace(/[A-Za-z_][A-Za-z0-9_]*/g, m => {
      if (!Object.prototype.hasOwnProperty.call(env, m)) return m;
      const s = show(env[m]);
      return s.startsWith('-') ? '(' + s + ')' : s;
    });
  };
  /** A value read from an expression, as a plain number (float noise rounded away). */
  U.numVal = function (v) {
    const x = Lab.expr.num(v);
    if (typeof x !== 'number' || !Number.isFinite(x)) throw new Error('the result is not a finite number');
    return Math.round(x * 1e9) / 1e9;
  };
  /** Compile an expression that may use only the given names. Throws a readable error. */
  U.compile = function (src, names) {
    if (!String(src || '').trim()) throw new Error('Type a formula.');
    const used = Lab.expr.vars(src).filter(v => !names.includes(v));
    if (used.length) throw new Error('Unknown name' + (used.length > 1 ? 's' : '') + ': ' + used.join(', ') + '. You can use ' + names.join(', ') + '.');
    return Lab.expr.compile(src);
  };
  /**
   * An event written with comparisons: "X + Y <= 2", "X = Y", "1 <= X <= 3 and Y != 0", "X < 1 or Y > 2".
   * Returns env → true/false. Throws a readable error.
   */
  U.parseEvent = function (src, names) {
    const s = String(src || '').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=').replace(/==/g, '=').replace(/&&/g, ' and ').replace(/\|\|/g, ' or ').trim();
    if (!s) throw new Error('Type an event, for example X + Y <= 2.');
    const cmp = (a, op, b) => {
      const eps = 1e-9;
      switch (op) {
        case '<': return a < b - eps; case '<=': return a <= b + eps; case '>': return a > b + eps;
        case '>=': return a >= b - eps; case '=': return Math.abs(a - b) <= eps; default: return Math.abs(a - b) > eps;
      }
    };
    const atom = a => {
      const toks = a.split(/(<=|>=|!=|<|>|=)/).map(t => t.trim());
      if (toks.length < 3) throw new Error('"' + a.trim() + '" has no comparison. Use <, <=, >, >=, = or !=.');
      const exprs = toks.filter((_, k) => k % 2 === 0), ops = toks.filter((_, k) => k % 2 === 1);
      if (exprs.some(e => !e)) throw new Error('Something is missing next to a comparison sign in "' + a.trim() + '".');
      const fns = exprs.map(e => U.compile(e, names));
      return env => { const vs = fns.map(f => Lab.expr.num(f(env))); return ops.every((op, k) => cmp(vs[k], op, vs[k + 1])); };
    };
    const ors = s.split(/\s+or\s+/i).map(part => part.split(/\s+and\s+/i).map(atom));
    return env => ors.some(ands => ands.every(f => f(env)));
  };
  /** PMF chart above its CDF staircase. dist {vals, p}. o: {name (TeX), given (TeX, e.g. 'X=0'), tone, c, t, onT, truncated} */
  U.graphs = function (host, dist, o) {
    const rows = dist.vals.map((x, k) => ({ x, p: dist.p[k], label: U.p(dist.p[k], o.c) }));
    const float = dist.p.some(p => !isExact(p));
    const cd = { vals: dist.vals.map(Number), p: float ? dist.p.map(Number) : dist.p, float };
    const vals = cd.vals, span = Math.max(1, vals[vals.length - 1] - vals[0]), pad = Math.max(1, Math.round(span / 10));
    const t = o.t != null && o.t >= vals[0] - pad && o.t <= vals[vals.length - 1] + pad ? o.t : null;
    const gv = o.given ? '\\mid ' + o.given : '';
    const a = h('div', { class: 't1-g' }, h('div', { class: 't1-g-title', html: 'PMF: bar height ' + tex('P(' + o.name + '=t' + gv + ')') }), K.pmfChart(rows, { xName: o.name, tone: o.tone, height: o.height || 170, xPlain: o.plain }));
    const b = h('div', { class: 't1-g' }, h('div', { class: 't1-g-title', html: 'CDF: ' + tex('F(t)=P(' + o.name + '\\le t' + gv + ')') + ', a staircase' }), K.cdfChart(cd, { xName: o.name, given: o.given, t: t == null ? undefined : t, onT: o.onT, truncated: o.truncated }));
    host.appendChild(h('div', { class: 't1-graphs' }, a, b));
  };
  /** Set the title of a K.panel. */
  U.title = (panel, html) => Lab.setHTML(panel.querySelector('.pl-panel-head h3'), html);
  U.link = (id, code) => '' + code + '';
  /** TeX that must stay on one line (table cells): the table scrolls sideways instead. */
  U.nw = s => '<span class="t1-nw">' + Lab.tex(s) + '</span>';

  /* ================================================================ LAB 1 data */
  const KEY = 'lab:s2-joint';
  const EIGHTHS = { xs: ['0', '1', '2'], ys: ['0', '1'], cells: [['1/4', '1/8', '1/8'], ['1/8', '1/8', '1/4']] };
  const TWELFTHS = { xs: ['0', '1', '2'], ys: ['0', '1', '2'], cells: [['1/12', '0', '3/12'], ['2/12', '1/12', '0'], ['3/12', '1/12', '1/12']] };
  const SLIDE = { xs: ['0', '1'], ys: ['0', '1'], cells: [['0.05', '0.35'], ['0.25', '0.35']] };
  const QUARTERS = { xs: ['0', '1'], ys: ['0', '1'], cells: [['1/4', '1/4'], ['1/4', '1/4']] };
  const EXPRS = () => ({ coins: ['h1', 'H'], dice: ['d1+d2', 'max(d1,d2)'], card: ['heart', 'face'], number: ['mod(v,10)', 'mod(v,4)'] });
  const DEF = () => ({
    mode: 'type', xName: 'X', yName: 'Y', xLabel: '', yLabel: '',
    grid: JSON.parse(JSON.stringify(EIGHTHS)), param: null,
    exp: 'dice', n: 2, p: '1/2', dice: 2, faces: 6, lo: 0, hi: 99, exprs: EXPRS(),
    fmt: 'auto', cAxis: 'x', cVal: 0, event: 'X + Y <= 1', t: {},
    loaded: { label: 'L1.3 · Example 1: the eighths table', source: 'L1.3, Example 1' },
  });
  const tx = s => tex(s);
  const PRESETS = [
    { label: 'L1.1 · Two fair coin tosses: X₁, X₂ (every cell ¼)',
      source: U.link('l1-1', 'L1.1') + ' (about 20 min; again in L1.2, Example 1): a fair coin tossed twice; ' + tx('X_1=1') + ' if toss 1 is heads, ' + tx('X_2=1') + ' if toss 2 is heads (else 0).',
      st: { mode: 'exp', exp: 'coins', n: 2, p: '1/2', xName: 'X1', yName: 'X2', expr: ['h1', 'h2'], fmt: 'count', cAxis: 'x', cVal: 1 } },
    { label: 'L1.1 · Random number 00–99: units digit X, remainder mod 4 Y',
      source: U.link('l1-1', 'L1.1') + ' (about 5 min; again in L1.2, Example 3): a number from 00 to 99, all 100 equally likely. ' + tx('X') + ' = units digit, ' + tx('Y') + ' = remainder after dividing by 4.',
      st: { mode: 'exp', exp: 'number', lo: 0, hi: 99, xName: 'X', yName: 'Y', expr: ['mod(v,10)', 'mod(v,4)'], fmt: 'count', cAxis: 'x', cVal: 1 } },
    { label: 'L1.1 lesson exercise · 3 tosses: heads in tosses 1–2, in 2–3',
      source: U.link('l1-1', 'L1.1') + ' lesson page, “Your turn” (also in L1.3) — a lesson exercise, not a lecture example.',
      st: { mode: 'exp', exp: 'coins', n: 3, p: '1/2', xName: 'X', yName: 'Y', expr: ['h1+h2', 'h2+h3'], fmt: 'count', cAxis: 'x', cVal: 0 } },
    { label: 'L1.2 · Example 2, as on the slide (0.05, 0.35 / 0.25, 0.35)',
      source: U.link('l1-2', 'L1.2') + ', Example 2 (about 6 min): row ' + tx('t_2=0') + ' holds 0.05, 0.35; row ' + tx('t_2=1') + ' holds 0.25, 0.35. The lecture gets ' + tx('f_{X_2}=(0.40,\\,0.60)') + ' and ' + tx('f_{X_1}=(0.30,\\,0.70)') + '.',
      st: { mode: 'type', grid: SLIDE, xName: 'X1', yName: 'X2', fmt: 'dec', cAxis: 'x', cVal: 0 } },
    { label: 'L1.2 · Case 1: every cell ¼',
      source: U.link('l1-2', 'L1.2') + ', “same marginals, different joints” (about 8 min): Case 1.',
      st: { mode: 'type', grid: QUARTERS, xName: 'X1', yName: 'X2', fmt: 'frac', cAxis: 'x', cVal: 0 } },
    { label: 'L1.2 · Case 2: cells x, ½ − x, ½ − x, x (you set x)',
      source: U.link('l1-2', 'L1.2') + ' (about 8 min): Case 2. The lecture tries ' + tx('x=0.1') + ' and ' + tx('x=0') + '; every row and column still adds up to ' + tx('\\tfrac12') + '.',
      st: { mode: 'type', param: { kind: 'case2', x: '0.1' }, xName: 'X1', yName: 'X2', fmt: 'dec', cAxis: 'x', cVal: 0 } },
    { label: 'L1.2 lesson exercise · One card: heart?, face card?',
      source: U.link('l1-2', 'L1.2') + ' lesson page, “Your turn” — a lesson exercise, not a lecture example. ' + tx('X=1') + ' if the card is a heart, ' + tx('Y=1') + ' if it is J, Q or K.',
      st: { mode: 'exp', exp: 'card', xName: 'X', yName: 'Y', expr: ['heart', 'face'], fmt: 'count', cAxis: 'y', cVal: 1 } },
    { label: 'L1.3 · Example 1: the eighths table',
      source: U.link('l1-3', 'L1.3') + ', Example 1 (about 5 min). The lecture finds ' + tx('Y\\mid X=0') + ' takes 0, 1 with ' + tx('\\tfrac23,\\tfrac13') + ', and ' + tx('X\\mid Y=1') + ' takes 0, 1, 2 with ' + tx('\\tfrac14,\\tfrac14,\\tfrac12') + '.',
      st: { mode: 'type', grid: EIGHTHS, xName: 'X', yName: 'Y', fmt: 'frac', cAxis: 'x', cVal: 0 } },
    { label: 'L1.3 · Example 2: the twelfths table',
      source: U.link('l1-3', 'L1.3') + ', Example 2 (about 9 min; it is also the proof table in L1.2). Zeros drop out of the conditional ranges.',
      st: { mode: 'type', grid: TWELFTHS, xName: 'X', yName: 'Y', fmt: 'count', cAxis: 'x', cVal: 1 } },
    { label: 'L1.3 · Given an event (minute 0): eighths table, X | X ≥ 1',
      source: U.link('l1-3', 'L1.3') + ' (minutes 0–1) defines the PMF of ' + tx('X') + ' given an event ' + tx('A') + ': ' + tx('f_{X\\mid A}(t)=P(X=t\\mid A)=\\dfrac{P(X=t,\\ A)}{P(A)}') + ', and warns that the range can shrink. The lecture gives no numbers there; this applies it to the Example 1 table (minute 5) with the event ' + tx('E=\\{X\\ge 1\\}') + ': ' + tx('P(E)=\\tfrac58') + ', and ' + tx('X\\mid E') + ' takes 1, 2 with ' + tx('\\tfrac25,\\tfrac35') + '.',
      st: { mode: 'type', grid: EIGHTHS, xName: 'X', yName: 'Y', fmt: 'frac', cAxis: 'x', cVal: 0, event: 'X >= 1' } },
    { label: 'L1.3 · Given an event (minute 0): twelfths table, X | X + Y = 2',
      source: U.link('l1-3', 'L1.3') + ' (minutes 0–1): the PMF of ' + tx('X') + ' given an event, ' + tx('P(X=t,\\ A)/P(A)') + ', applied to the Example 2 table (minute 9) with ' + tx('E=\\{X+Y=2\\}') + ' (the lecture gives no numbers for it): the cells ' + tx('(0,2),(1,1),(2,0)') + ' hold ' + tx('\\tfrac3{12},\\tfrac1{12},\\tfrac3{12}') + ', so ' + tx('P(E)=\\tfrac7{12}') + ' and ' + tx('X\\mid E') + ' takes 0, 1, 2 with ' + tx('\\tfrac37,\\tfrac17,\\tfrac37') + '.',
      st: { mode: 'type', grid: TWELFTHS, xName: 'X', yName: 'Y', fmt: 'count', cAxis: 'x', cVal: 1, event: 'X + Y = 2' } },
  ];
  const case2Grid = xs => {
    const x = K.parseProb(xs) || F(1, 10);
    const o = F(1, 2).sub(x);
    const dec = /[.%]/.test(String(xs));
    const s = f => (dec && U.exactDec(f) != null ? U.exactDec(f) : f.toString());
    return { xs: ['0', '1'], ys: ['0', '1'], cells: [[s(x), s(o)], [s(o), s(x)]] };
  };

  /* experiments: outcomes carry .vars, the names the learner may use in X and Y */
  const SUIT_NO = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
  const EXPS = {
    coins: {
      label: 'Toss a coin n times',
      vars: s => Lab.range(1, s.n).map(i => 'h' + i).concat(['H', 'T', 'n']),
      outcomes(s) {
        return Lab.P.coins(s.n, K.parseProb(s.p) || F(1, 2)).map(o => {
          const vars = {};
          [...o.v].forEach((c, i) => (vars['h' + (i + 1)] = c === 'H' ? 1 : 0));
          vars.H = [...o.v].filter(c => c === 'H').length;
          vars.T = s.n - vars.H;
          vars.n = s.n;
          o.vars = vars;
          return o;
        });
      },
      doc: s => 'One outcome is a sequence such as <b class="mono">' + 'HTH'.slice(0, Math.min(3, s.n)) + '</b>. Variables: ' +
        '<code>h1</code>' + (s.n > 1 ? ' … <code>h' + s.n + '</code>' : '') + ' = 1 if that toss is heads, else 0; <code>H</code> = number of heads; <code>T</code> = number of tails = n − H; <code>n</code> = ' + s.n + '.',
      size: s => 'You toss ' + tx('n=' + s.n) + ' times; each toss is H or T, so there are ' + tx('2^{n}=2^{' + s.n + '}=' + Math.pow(2, s.n)) + ' sequences',
    },
    dice: {
      label: 'Roll dice',
      vars: s => Lab.range(1, s.dice).map(i => 'd' + i),
      outcomes(s) {
        return Lab.P.dice(s.dice, s.faces).map(o => { const vars = {}; o.v.forEach((f, i) => (vars['d' + (i + 1)] = f)); o.vars = vars; return o; });
      },
      doc: s => 'One outcome is ' + (s.dice === 1 ? 'a face' : 'a list of faces such as <b class="mono">(' + Lab.range(1, s.dice).map(i => Math.min(i + 1, s.faces)).join(', ') + ')</b>') + '. Variables: ' +
        Lab.range(1, s.dice).map(i => '<code>d' + i + '</code>').join(', ') + ' = the face of die ' + Lab.range(1, s.dice).join(', ') + ' (each from 1 to ' + s.faces + ').',
      size: s => 'You roll ' + tx('k=' + s.dice) + ' ' + (s.dice === 1 ? 'die' : 'dice') + ' with ' + tx('m=' + s.faces) + ' faces, so there are ' + tx('m^{k}=' + s.faces + '^{' + s.dice + '}=' + Math.pow(s.faces, s.dice)) + ' outcomes',
    },
    card: {
      label: 'Draw one card from a 52-card deck',
      vars: () => ['r', 's', 'red', 'black', 'face', 'ace', 'heart', 'diamond', 'club', 'spade'],
      outcomes() {
        return Lab.P.deck().map(o => {
          const v = o.v;
          o.vars = { r: v.r, s: SUIT_NO[v.suit], red: +(v.color === 'red'), black: +(v.color === 'black'), face: +v.face, ace: +(v.r === 1), heart: +(v.suit === '♥'), diamond: +(v.suit === '♦'), club: +(v.suit === '♣'), spade: +(v.suit === '♠') };
          return o;
        });
      },
      doc: () => 'One outcome is a card such as <b class="mono">Q♥</b>. Variables: <code>r</code> = rank (A = 1, 2–10, J = 11, Q = 12, K = 13); <code>s</code> = suit (♠ = 1, ♥ = 2, ♦ = 3, ♣ = 4); 1-or-0 flags <code>red</code>, <code>black</code>, <code>face</code> (J, Q, K), <code>ace</code>, <code>heart</code>, <code>diamond</code>, <code>club</code>, <code>spade</code>.',
      size: () => 'A deck has 4 suits × 13 ranks = 52 cards',
    },
    number: {
      label: 'Pick a whole number from lo to hi',
      vars: () => ['v'],
      outcomes(s) {
        const pad = s.lo === 0 && /^9+$/.test(String(s.hi)) ? String(s.hi).length : 0;
        return Lab.P.numbers(s.lo, s.hi, pad).map(o => { o.vars = { v: o.v }; return o; });
      },
      doc: s => 'One outcome is a number <code>v</code> from ' + s.lo + ' to ' + s.hi + '. Units digit: <code>mod(v,10)</code>; tens digit: <code>mod(floor(v/10),10)</code>; remainder after dividing by 4: <code>mod(v,4)</code>.',
      size: s => 'The numbers ' + s.lo + ' to ' + s.hi + ' make ' + tx(s.hi + '-' + (s.lo < 0 ? '(' + s.lo + ')' : s.lo) + '+1=' + (s.hi - s.lo + 1)) + ' outcomes',
    },
  };
  const MAXV = 40;

  /* ================================================================ LAB 1 */
  function jointLab() {
    const st = Object.assign(DEF(), Lab.store.get(KEY, {}));
    if (!st.grid || !Array.isArray(st.grid.xs) || !Array.isArray(st.grid.cells)) st.grid = JSON.parse(JSON.stringify(EIGHTHS));
    st.exprs = Object.assign(EXPRS(), st.exprs || {});
    if (!EXPS[st.exp]) st.exp = 'dice';
    const W = Lab.W;
    let root, ctl = {}, P = {}, good = null, lastC = null, lastD = null, settingGrid = false, condSig = '', fmtSig = '', dump = {};
    const save = () => Lab.store.set(KEY, st);
    const nX = () => U.tn(st.xName), nY = () => U.tn(st.yName);
    const fXY = () => 'f_{' + nX() + nY() + '}';

    /* ---------------------------------------------------------- compute */
    function compute() { return st.mode === 'type' ? fromGrid() : fromExp(); }
    function autoFmt(strs) {
      const simple = strs.every(s => /^\s*-?(\d+(\.\d*)?|\.\d+)\s*%?\s*$/.test(s));
      return simple && strs.some(s => /[.%]/.test(s)) ? 'dec' : 'frac';
    }
    function fromGrid() {
      const g = st.grid, nx = g.xs.length, ny = g.ys.length;
      const res = { mode: 'type', issues: [], raw: g, autoFmt: autoFmt(g.cells.flat()) };
      const xv = g.xs.map(s => K.parseNum(s)), yv = g.ys.map(s => K.parseNum(s));
      if (xv.some(v => v == null) || yv.some(v => v == null)) { res.labelErr = 'Every value of ' + tx(nX()) + ' (top row) and of ' + tx(nY()) + ' (left column) must be a number — a random variable outputs numbers.'; return res; }
      const xn = xv.map(Number), yn = yv.map(Number);
      if (new Set(xn).size !== nx || new Set(yn).size !== ny) { res.labelErr = 'Two columns (or two rows) have the same value. Each value may appear only once.'; return res; }
      const cells = g.cells.map(r => r.map(s => K.parseNum(s)));
      g.cells.forEach((r, j) => r.forEach((s, i) => {
        const f = cells[j][i];
        if (f == null) res.issues.push({ x: xn[i], y: yn[j], raw: s, why: 'is not a number' });
        else if (Number(f) < 0) res.issues.push({ x: xn[i], y: yn[j], raw: s, f, why: 'is negative — a probability is never below 0' });
        else if (Number(f) > 1) res.issues.push({ x: xn[i], y: yn[j], raw: s, f, why: 'is bigger than 1 — a probability is never above 1' });
      }));
      const ox = Lab.range(0, nx - 1).sort((a, b) => xn[a] - xn[b]), oy = Lab.range(0, ny - 1).sort((a, b) => yn[a] - yn[b]);
      const parsed = cells.every(r => r.every(f => f != null));
      res.xs = ox.map(i => xn[i]); res.ys = oy.map(j => yn[j]);
      if (parsed) {
        res.J = { xs: res.xs, ys: res.ys, p: ox.map(i => oy.map(j => cells[j][i])) };
        res.total = U.sum(cells.flat());
        res.totalOk = U.isOne(res.total);
        res.D = U.lcd(res.J.p.flat(), 10000);
      }
      res.ok = parsed && !res.issues.length && res.totalOk;
      return res;
    }
    function fromExp() {
      const E = EXPS[st.exp];
      const res = { mode: 'exp', exp: st.exp, autoFmt: 'count' };
      if (st.exp === 'number' && (st.hi < st.lo || st.hi - st.lo + 1 > 1000)) { res.sizeErr = st.hi < st.lo ? 'hi must be at least lo.' : 'At most 1,000 numbers (you asked for ' + (st.hi - st.lo + 1).toLocaleString('en-US') + ').'; return res; }
      const names = E.vars(st);
      const [sx, sy] = st.exprs[st.exp];
      let fx, fy;
      try { fx = U.compile(sx, names); } catch (e) { res.errX = e.message; }
      try { fy = U.compile(sy, names); } catch (e) { res.errY = e.message; }
      if (res.errX || res.errY) return res;
      const outs = E.outcomes(st);
      const xv = [], yv = [];
      for (const o of outs) {
        try { xv.push(U.numVal(fx(o.vars))); } catch (e) { res.errX = 'For the outcome ' + o.label + ': ' + e.message + '.'; return res; }
        try { yv.push(U.numVal(fy(o.vars))); } catch (e) { res.errY = 'For the outcome ' + o.label + ': ' + e.message + '.'; return res; }
      }
      const xs = [...new Set(xv)].sort((a, b) => a - b), ys = [...new Set(yv)].sort((a, b) => a - b);
      if (xs.length > MAXV) { res.errX = 'Your ' + st.xName + ' takes ' + xs.length + ' different values — too many columns for a table (at most ' + MAXV + '). Try a coarser formula.'; return res; }
      if (ys.length > MAXV) { res.errY = 'Your ' + st.yName + ' takes ' + ys.length + ' different values — too many rows for a table (at most ' + MAXV + '). Try a coarser formula.'; return res; }
      const ix = new Map(xs.map((v, i) => [v, i])), iy = new Map(ys.map((v, j) => [v, j]));
      const p = xs.map(() => ys.map(() => F(0))), cells = xs.map(() => ys.map(() => []));
      outs.forEach((o, k) => { const i = ix.get(xv[k]), j = iy.get(yv[k]); p[i][j] = p[i][j].add(o.p); cells[i][j].push(k); });
      const same = outs.every(o => o.p.eq(outs[0].p));
      Object.assign(res, { ok: true, xs, ys, J: { xs, ys, p, cells }, outcomes: outs, xv, yv, N: outs.length, same, src: [sx, sy] });
      res.total = U.sum(p.flat());
      res.totalOk = U.isOne(res.total);
      res.D = same ? outs.length : U.lcd(p.flat(), 10000);
      return res;
    }
    function fmtCtx(d) {
      let mode = st.fmt === 'auto' ? d.autoFmt : st.fmt;
      if (mode === 'count' && !(d.D > 1)) mode = 'frac';
      return { mode, D: d.D };
    }
    function marg(J) {
      const mx = J.xs.map((_, i) => U.sum(J.p[i])), my = J.ys.map((_, j) => U.sum(J.p.map(r => r[j])));
      return { mx, my };
    }
    function condIndex(g) {
      const vals = st.cAxis === 'x' ? g.J.xs : g.J.ys;
      let k = vals.findIndex(v => Lab.sameVal(v, st.cVal));
      const m = st.cAxis === 'x' ? g.mx : g.my;
      if (k < 0) { k = Math.max(0, m.findIndex(f => Number(f) > 0)); st.cVal = vals[k]; }
      return k;
    }

    /* ----------------------------------------------------------- controls */
    function touched() {
      if (st.loaded) { st.loaded = null; if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); } }
    }
    function loadPreset(it) {
      const d = JSON.parse(JSON.stringify(it.st));
      Object.assign(st, { xLabel: '', yLabel: '', param: null, t: {} }, d);
      if (d.expr) st.exprs[d.exp] = d.expr.slice();
      if (d.param) st.grid = case2Grid(d.param.x);
      delete st.expr;
      st.loaded = { label: it.label, source: it.source };
      buildSide();
      draw();
      Lab.setHTML(ctl.pre.lastChild, 'From: ' + it.source);
    }
    function field2(a, b) { return h('div', { class: 't1-two' }, a, b); }
    function nameFields() {
      const mk = axis => {
        const f = K.textField({ label: axis === 'x' ? 'Column variable' : 'Row variable', value: axis === 'x' ? st.xName : st.yName, onChange: v => setName(axis, v, f) });
        return f;
      };
      return field2(mk('x'), mk('y'));
    }
    function setName(axis, v, f) {
      const nm = U.name(v, null), other = axis === 'x' ? st.yName : st.xName;
      if (!nm || nm === other) { f.input.classList.add('bad'); f.hint('<span class="cbad">' + (nm ? 'Use a name different from ' + esc(other) + '.' : '1–3 letters or digits, starting with a letter (X, X1, N).') + '</span>'); return; }
      f.input.classList.remove('bad'); f.hint('');
      if (axis === 'x') st.xName = nm; else st.yName = nm;
      if (ctl.grid) { const old = ctl.grid; ctl.grid = makeGrid(); old.replaceWith(ctl.grid); }
      draw();
    }
    function makeGrid() {
      return K.gridEditor({
        label: 'Your table: values of ' + tx(nX()) + ' across the top, of ' + tx(nY()) + ' down the side. Type cells as 1/8, 0.125 or 12.5%.',
        xs: st.grid.xs, ys: st.grid.ys, cells: st.grid.cells, xName: nX(), yName: nY(), onChange: onGrid,
      });
    }
    function readGrid(ed) {
      const xs = Lab.$$('.ge-x', ed).map(i => i.value), ys = Lab.$$('.ge-y', ed).map(i => i.value);
      const cs = Lab.$$('.ge-c', ed).map(i => i.value);
      return { xs, ys, cells: ys.map((_, j) => xs.map((_, i) => cs[j * xs.length + i])) };
    }
    function onGrid() {
      if (!ctl.grid) return;
      const g = readGrid(ctl.grid);
      if (JSON.stringify(g) === JSON.stringify(st.grid)) return;
      st.grid = g;
      if (!settingGrid) { if (st.param) { st.param = null; if (ctl.param) ctl.param.hidden = true; } touched(); }
      draw();
    }
    function applyParam() {
      st.grid = case2Grid(st.param.x);
      settingGrid = true;
      ctl.grid.set(st.grid.xs, st.grid.ys, st.grid.cells);
      settingGrid = false;
      draw();
    }
    function buildSide() {
      const box = ctl.dyn;
      Lab.clear(box);
      ctl.grid = null; ctl.param = null;
      box.appendChild(K.group('1 · Your joint PMF'));
      ctl.mode = Lab.seg([{ label: 'Type a table', value: 'type' }, { label: 'Count it from an experiment', value: 'exp' }], st.mode, v => { if (v === st.mode) return; st.mode = v; touched(); buildSide(); draw(); });
      box.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Where does the table come from?' }), ctl.mode));
      if (st.mode === 'type') {
        box.appendChild(nameFields());
        box.appendChild(field2(
          K.textField({ label: 'What ' + tx(nX()) + ' means (optional)', value: st.xLabel, mono: false, onChange: v => { st.xLabel = v; draw(); } }),
          K.textField({ label: 'What ' + tx(nY()) + ' means (optional)', value: st.yLabel, mono: false, onChange: v => { st.yLabel = v; draw(); } })));
        if (st.param) {
          ctl.param = K.probField({ label: 'Case 2: your ' + tx('x') + ' (cells ' + tx('x,\\ \\tfrac12-x,\\ \\tfrac12-x,\\ x') + ')', complement: false, value: st.param.x, onChange: () => { st.param.x = ctl.param.querySelector('input').value; applyParam(); } });
          box.appendChild(ctl.param);
        }
        ctl.grid = makeGrid();
        box.appendChild(ctl.grid);
      } else {
        ctl.exp = K.selectField({ label: 'Experiment', options: Object.keys(EXPS).map(k => ({ value: k, label: EXPS[k].label })), value: st.exp, onChange: v => { st.exp = v; touched(); buildSide(); draw(); } });
        box.appendChild(ctl.exp);
        if (st.exp === 'coins') {
          box.appendChild(K.numField({ label: 'Number of tosses ' + tx('n'), min: 1, max: 10, value: st.n, onChange: v => { st.n = v; touched(); draw(); } }));
          ctl.p = K.probField({ label: 'Chance of heads on one toss ' + tx('p'), value: st.p, onChange: () => { st.p = ctl.p.querySelector('input').value; touched(); draw(); } });
          box.appendChild(ctl.p);
        } else if (st.exp === 'dice') {
          box.appendChild(K.numField({ label: 'Number of dice ' + tx('k'), min: 1, max: 3, value: st.dice, onChange: v => { st.dice = v; touched(); draw(); } }));
          box.appendChild(K.numField({ label: 'Faces on each die ' + tx('m') + ' (a fair die shows 1 to m)', min: 2, max: 12, value: st.faces, onChange: v => { st.faces = v; touched(); draw(); } }));
        } else if (st.exp === 'number') {
          box.appendChild(K.numField({ label: 'Smallest number ' + tx('\\text{lo}'), min: -50, max: 999, value: st.lo, onChange: v => { st.lo = v; touched(); draw(); } }));
          box.appendChild(K.numField({ label: 'Largest number ' + tx('\\text{hi}'), min: -50, max: 1999, value: st.hi, onChange: v => { st.hi = v; touched(); draw(); } }));
        }
        ctl.size = K.note('', 'pl-hint');
        ctl.vars = K.note('', 'pl-hint t1-vars');
        box.append(ctl.size, ctl.vars, nameFields());
        const mkExpr = k => {
          const f = K.textField({ label: '', value: st.exprs[st.exp][k], onChange: v => { st.exprs[st.exp][k] = v; touched(); draw(); } });
          f.input.setAttribute('aria-label', k ? 'formula for the row variable' : 'formula for the column variable');
          return f;
        };
        ctl.xe = mkExpr(0); ctl.ye = mkExpr(1);
        box.append(ctl.xe, ctl.ye, K.note('Formulas may use + − * / ^, <code>abs()</code>, <code>min()</code>, <code>max()</code>, <code>floor()</code>, <code>mod(a,b)</code>.', 'pl-hint'));
      }
      box.appendChild(K.group('2 · How numbers are written'));
      ctl.fmtBox = h('div', { class: 'pl-field' });
      box.appendChild(ctl.fmtBox);
      box.appendChild(K.group('3 · Condition on one value'));
      ctl.condBox = h('div', { class: 't1-dyn' });
      box.appendChild(ctl.condBox);
      box.appendChild(K.group('4 · Your event E: P(E), then X and Y given E'));
      // an example that comes with its own event (L1.3, given an event) is no longer loaded once the event changes
      const evTouched = () => { if (st.loaded && PRESETS.some(it => it.label === st.loaded.label && it.st.event != null && it.st.event !== st.event)) touched(); };
      ctl.ev = K.textField({ label: 'Event', value: st.event, onChange: v => { st.event = v; evTouched(); draw(); } });
      const chips = h('div', { class: 'pl-chips' });
      ['X + Y <= 1', 'X = Y', 'X < Y', 'max(X,Y) <= 1', 'X >= 1 and Y >= 1', 'X >= 1', 'X + Y = 2'].forEach(s => chips.appendChild(Lab.button(esc(s), () => { st.event = s; ctl.ev.input.value = s; evTouched(); draw(); }, 'btn xs')));
      box.append(ctl.ev, chips, K.note('The panels “The probability of your event E” and “Condition on E” use this event.', 'pl-hint'));
      condSig = ''; fmtSig = '';
    }
    function sideLabels(d) {
      if (st.mode === 'exp' && ctl.xe) {
        Lab.setHTML(ctl.xe.querySelector('.pl-label'), 'Your ' + tx(nX()) + ' (columns) = a formula of one outcome');
        Lab.setHTML(ctl.ye.querySelector('.pl-label'), 'Your ' + tx(nY()) + ' (rows) = a formula of one outcome');
        const E = EXPS[st.exp];
        Lab.setHTML(ctl.vars, E.doc(st));
        Lab.setHTML(ctl.size, E.size(st) + (st.exp === 'coins' && !(K.parseProb(st.p) || F(1, 2)).eq(F(1, 2)) ? ' (not equally likely: ' + tx('p\\ne\\tfrac12') + ').' : ', all equally likely.'));
        [[ctl.xe, d.errX], [ctl.ye, d.errY]].forEach(([f, err]) => { f.input.classList.toggle('bad', !!err); f.hint(err ? '<span class="cbad">' + esc(err) + '</span>' : ''); });
        if (d.sizeErr) Lab.setHTML(ctl.size, '<span class="cbad">' + esc(d.sizeErr) + '</span>');
      }
      Lab.setHTML(ctl.ev.querySelector('.pl-label'), 'Event ' + tx('E') + ' about ' + tx(nX()) + ' and ' + tx(nY()) + ' (compare with &lt; &lt;= &gt; &gt;= = !=, join with <i>and</i>, <i>or</i>)');
    }
    function fmtControls(d) {
      const D = d.D > 1 ? d.D : null;
      const sig = [st.fmt, D, d.autoFmt].join('|');
      if (sig === fmtSig) return;
      fmtSig = sig;
      Lab.clear(ctl.fmtBox);
      const eff = fmtCtx(d).mode;
      const items = [{ label: 'Fractions', value: 'frac' }].concat(D ? [{ label: 'Counts over ' + D, value: 'count' }] : [], [{ label: 'Decimals', value: 'dec' }]);
      const seg = Lab.seg(items, eff, v => { st.fmt = v; fmtSig = ''; draw(); });
      seg.classList.add('t1-seg3');
      ctl.fmtBox.append(seg, K.note(D ? 'Counts over ' + D + ': every probability written with the denominator ' + D + (d.mode === 'exp' && d.same ? ' — the number of equally likely outcomes.' : ' — the smallest common denominator of your cells.') : 'Fractions are exact. Decimals are exact when they end; otherwise they are shown with ≈.', 'pl-hint'));
    }
    function condControls(g) {
      const vals = st.cAxis === 'x' ? g.J.xs : g.J.ys;
      const sig = [st.cAxis, st.xName, st.yName, g.J.xs.join(','), g.J.ys.join(','), st.cVal].join('|');
      if (sig === condSig) return;
      condSig = sig;
      Lab.clear(ctl.condBox);
      const seg = Lab.seg([{ label: 'Given ' + tx(nX() + '=t'), value: 'x' }, { label: 'Given ' + tx(nY() + "=t'"), value: 'y' }], st.cAxis, v => { st.cAxis = v; st.cVal = null; draw(); });
      seg.querySelectorAll('button').forEach((bt, k) => bt.setAttribute('aria-label', 'Given ' + (k ? st.yName + " = t'" : st.xName + ' = t')));
      const sel = K.selectField({ label: 'Value ' + (st.cAxis === 'x' ? tx('t') + ' of ' + tx(nX()) : tx("t'") + ' of ' + tx(nY())), options: vals.map(v => ({ value: String(v), label: Lab.fmtVal(v) })), value: String(st.cVal), onChange: v => { st.cVal = Number(v); draw(); } });
      ctl.condBox.append(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Learn one value, then look at the other variable' }), seg), sel,
        K.note('You can also tap a column or row header in the table.', 'pl-hint'));
    }

    /* -------------------------------------------------------------- draw */
    function draw() {
      save();
      const d = (lastD = compute());
      if (d.ok) {
        good = d;
        const m = marg(d.J);
        good.mx = m.mx; good.my = m.my;
      }
      sideLabels(d);
      fmtControls(good || d);
      const c = (lastC = fmtCtx(good || d));
      drawValid(d, fmtCtx(d));
      if (!good) {
        K.setAnswer(P.answer, { ev: '<span class="cbad">' + problemText(d) + '</span>' });
        [P.table, P.out, P.marg, P.gx, P.gy, P.cond, P.gc, P.event, P.ce, P.gce].forEach(p => { Lab.clear(p.body); p.body.appendChild(K.note('Fix the input on the left; this panel fills in as soon as your table is a valid joint PMF.', 'small muted')); });
        P.out.hidden = st.mode !== 'exp';
        return;
      }
      condIndex(good);
      condControls(good);
      drawAnswer(d, good, c);
      drawTable(good, c);
      drawOutcomes(good, c);
      drawMarg(good, c);
      drawGraphsXY(good, c);
      drawCond(good, c);
      drawEvent(good, c);
      drawCondE(good, c);
      root.querySelector('.pl-main').classList.toggle('t1-stale', !d.ok);
    }
    function problemText(d) {
      if (d.labelErr) return d.labelErr;
      if (d.sizeErr) return 'Experiment size: ' + esc(d.sizeErr);
      if (d.errX || d.errY) return 'Your formula for ' + (d.errX ? st.xName : st.yName) + ' cannot be used yet: ' + esc(d.errX || d.errY);
      if (d.issues && d.issues.length) return 'Some cells are not probabilities (see “Is it a valid joint PMF?”).';
      if (d.total != null && !d.totalOk) return 'The cells add up to ' + tx(U.p(d.total, fmtCtx(d))) + ', not 1 (see “Is it a valid joint PMF?”).';
      return 'Not a valid joint PMF yet.';
    }

    function drawAnswer(d, g, c) {
      const J = g.J;
      const k = condIndex(g);
      const isX = st.cAxis === 'x';
      const cv = isX ? J.xs[k] : J.ys[k];
      const slice = isX ? J.p[k] : J.p.map(r => r[k]);
      const tot = isX ? g.mx[k] : g.my[k];
      const cn = isX ? nY() + '\\mid ' + nX() + '=' + U.val(cv) : nX() + '\\mid ' + nY() + '=' + U.val(cv);
      const condT = Number(tot) > 0 ? U.tuple(slice.map(v => (isExact(v) && isExact(tot) ? v.div(tot) : Number(v) / Number(tot))), c.mode === 'count' ? { mode: 'frac' } : c) : '\\text{not defined}';
      const ev = evalEvent(g);
      const ce = condOnEvent(g, ev);
      const cc = c.mode === 'count' ? { mode: 'frac' } : c;
      dump = { cAxis: st.cAxis, cVal: cv, cond: Number(tot) > 0 ? slice.map(v => String(isExact(v) && isExact(tot) ? v.div(tot) : Number(v) / Number(tot))) : null, pE: ev.ok ? String(ev.pE) : null, cells: ev.ok ? ev.cells.map(([i, j]) => [J.xs[i], J.ys[j]]) : null,
        ce: ce.ok && !ce.zero ? { x: ce.fx.map(String), y: ce.fy.map(String) } : null };
      const lines = [
        'f_{' + nX() + '}&=' + U.tuple(g.mx, c),
        'f_{' + nY() + '}&=' + U.tuple(g.my, c),
        'f_{' + cn + '}&=' + condT,
      ];
      if (ev.ok) lines.push('P(E)&=' + U.res(ev.pE, c, true));
      if (ce.ok && !ce.zero) lines.push('f_{' + nX() + '\\mid E}&=' + U.tuple(ce.fx, cc), 'f_{' + nY() + '\\mid E}&=' + U.tuple(ce.fy, cc));
      else if (ce.ok) lines.push('f_{' + nX() + '\\mid E}&=\\text{not defined: }P(E)=0');
      const evText = (st.loaded ? 'Lecture example: <b>' + esc(st.loaded.label) + '</b>. ' : '') +
        'Your table: ' + tx(nX()) + ' takes ' + J.xs.length + ' value' + (J.xs.length > 1 ? 's ' : ' ') + tx('T_{' + nX() + '}=' + U.set(J.xs)) + ' (columns), ' + tx(nY()) + ' takes ' + J.ys.length + ' value' + (J.ys.length > 1 ? 's ' : ' ') + tx('T_{' + nY() + '}=' + U.set(J.ys)) + ' (rows): ' + J.xs.length + ' × ' + J.ys.length + ' = ' + J.xs.length * J.ys.length + ' cells. ' +
        (d.ok ? 'It is a valid joint PMF <span class="cgood">✓</span>' : '<span class="cbad">' + problemText(d) + ' Everything below shows your last valid table.</span>');
      const sub = 'Read the lists in the order of ' + tx('T_{' + nX() + '}') + ' and ' + tx('T_{' + nY() + '}') + '. ' + tx('f_{' + nX() + '}') + ': each column added (bottom margin). ' + tx('f_{' + nY() + '}') + ': each row added (right margin). ' +
        tx('f_{' + cn + '}') + ': the ' + (isX ? 'column ' : 'row ') + tx((isX ? nX() : nY()) + '=' + U.val(cv)) + ' divided by its total ' + tx(U.p(tot, c)) + '. ' +
        (ev.ok ? tx('P(E)') + ': the ' + ev.cells.length + ' cell' + (ev.cells.length === 1 ? '' : 's') + ' where <code>' + esc(st.event) + '</code> holds, added.' : '<span class="cbad">Event: ' + esc(ev.err) + '</span>') +
        (ce.ok && !ce.zero ? ' ' + tx('f_{' + nX() + '\\mid E}') + ', ' + tx('f_{' + nY() + '\\mid E}') + ': the cells in ' + tx('E') + ' divided by ' + tx('P(E)') + ', then added down each column, along each row.' : '');
      K.setAnswer(P.answer, { ev: evText, big: '\\begin{aligned}' + lines.join('\\\\') + '\\end{aligned}', sub });
    }

    function jointWidget(g, c, extra) {
      const J = g.J;
      const o = Object.assign({
        J, x: { name: st.xName, label: g.mode === 'exp' ? g.src[0] : st.xLabel }, y: { name: st.yName, label: g.mode === 'exp' ? g.src[1] : st.yLabel },
        margins: 'shown', fmt: c.mode === 'count' ? 'count' : c.mode === 'dec' ? 'dec' : 'frac', outcomes: g.mode === 'exp' ? g.outcomes : undefined,
      }, extra || {});
      if (c.mode === 'count') o.den = c.D;
      return W.joint(o);
    }
    function drawTable(g, c) {
      const body = P.table.body;
      Lab.clear(body);
      U.title(P.table, 'Your joint PMF ' + tx(fXY() + '(t_1,t_2)') + ' as a table');
      P.table.sub(tx(nX()) + ' across (the values ' + tx('t_1') + '), ' + tx(nY()) + ' down (the values ' + tx('t_2') + '). Each cell is ' + tx(fXY() + '(t_1,t_2)=P(' + nX() + '=t_1,\\ ' + nY() + '=t_2)') + ' — ' +
        (g.mode === 'type' ? 'the number you typed.' : g.same ? 'the number of outcomes that give this pair, divided by the ' + g.N + ' equally likely outcomes.' : 'the probabilities of the outcomes that give this pair, added.') +
        ' Bottom row: ' + tx('f_{' + nX() + '}') + ' (each column added); right column: ' + tx('f_{' + nY() + '}') + ' (each row added).' + (c.mode === 'count' ? ' Numbers are counts over ' + c.D + '.' : '') + ' Point at a cell to read it; tap a header to condition on it (step 3).');
      const host = h('div');
      body.appendChild(host);
      const jt = jointWidget(g, c, { pick: 'any', onPick: s => onPick(s) });
      jt.mount(host);
    }
    function onPick(s) {
      if (!good) return;
      if (s.type === 'col') { st.cAxis = 'x'; st.cVal = good.J.xs[s.i]; }
      else if (s.type === 'row') { st.cAxis = 'y'; st.cVal = good.J.ys[s.j]; }
      else return;
      save();
      condControls(good);
      drawAnswer(lastD || good, good, lastC);
      drawCond(good, lastC);
    }

    function drawOutcomes(g, c) {
      P.out.hidden = g.mode !== 'exp';
      if (g.mode !== 'exp') return;
      const body = P.out.body;
      Lab.clear(body);
      const J = g.J, outs = g.outcomes, N = outs.length;
      const nx = J.xs.length, ny = J.ys.length;
      U.title(P.out, 'Which outcomes land in each cell');
      P.out.sub(EXPS[g.exp].size(st) + '. Each outcome gives one value of ' + tx(nX()) + ' and one value of ' + tx(nY()) + ', so it lands in exactly one cell. ' +
        (g.same ? 'All ' + N + ' are equally likely, so a cell with ' + tx('k') + ' outcomes has probability ' + tx('k\\times\\tfrac{1}{' + N + '}=\\tfrac{k}{' + N + '}') + '.' : 'They are not equally likely, so a cell adds the probabilities of its outcomes.') + ' Tap an outcome to see its ' + tx(nX()) + ' and ' + tx(nY()) + '.');
      const chipsOK = N <= 600 && nx * ny <= 240;
      const grid = h('div', { class: 't1-oc' });
      grid.style.gridTemplateColumns = 'auto repeat(' + nx + ', minmax(' + (chipsOK ? 92 : 60) + 'px, 1fr))';
      grid.appendChild(h('div', { class: 't1-oc-corner', html: tx(nY() + '\\,\\backslash\\,' + nX()) }));
      J.xs.forEach(x => grid.appendChild(h('div', { class: 't1-oc-xh', html: tx(U.val(x)) })));
      const read = h('div', { class: 'ws-readout t1-oc-read', html: '<span class="muted">Tap an outcome: you will see the values of its variables and how ' + tx(nX()) + ' and ' + tx(nY()) + ' are worked out.</span>' });
      J.ys.forEach((y, j) => {
        grid.appendChild(h('div', { class: 't1-oc-yh', html: tx(U.val(y)) }));
        J.xs.forEach((x, i) => {
          const mem = J.cells[i][j];
          const cell = h('div', { class: 't1-oc-cell' + (mem.length ? '' : ' empty') });
          if (chipsOK && mem.length) {
            const chips = h('div', { class: 't1-oc-chips' });
            mem.slice(0, 24).forEach(k => { const b = h('button', { type: 'button', class: 't1-chip', text: outs[k].label }); b.addEventListener('click', () => info(k)); chips.appendChild(b); });
            if (mem.length > 24) chips.appendChild(h('span', { class: 't1-more', text: '+' + (mem.length - 24) + ' more' }));
            cell.appendChild(chips);
          }
          cell.appendChild(h('div', { class: 't1-oc-p', html: tx(cellTex(mem, J.p[i][j])) }));
          grid.appendChild(cell);
        });
      });
      body.appendChild(h('div', { class: 't1-oc-scroll' }, grid));
      if (!chipsOK) body.appendChild(K.note('Too many outcomes to draw every one here — point at a cell of the table above to list its outcomes.', 'small muted'));
      body.appendChild(read);
      function cellTex(mem, p) {
        if (!mem.length) return '0';
        if (g.same) { const k = mem.length; return (k === 1 ? '' : k + '\\times') + '\\tfrac{1}{' + N + '}' + (k === 1 ? '' : '=\\tfrac{' + k + '}{' + N + '}') + (p.d !== N ? '=' + U.tf(p) : ''); }
        return mem.length <= 4 ? U.sumLine(mem.map(k => outs[k].p), p, c) : '\\text{' + mem.length + ' outcomes, together }' + U.res(p, c);
      }
      function info(k) {
        const o = outs[k];
        const vars = Object.keys(o.vars).map(n => '<code>' + n + '</code> = ' + o.vars[n]).join(', ');
        const line = (nm, src, v) => tx(nm) + ' = <code>' + esc(src) + '</code> = <code>' + esc(U.subst(src, o.vars)) + '</code> = <b>' + esc(Lab.fmtVal(v)) + '</b>';
        Lab.setHTML(read, '<b class="mono">' + esc(o.label) + '</b> (probability ' + tx(U.p(o.p, c)) + '): ' + vars + '.<br>' + line(nX(), g.src[0], g.xv[k]) + ' &nbsp;and&nbsp; ' + line(nY(), g.src[1], g.yv[k]) +
          ' → it lands in the cell ' + tx('(t_1,t_2)=(' + U.val(g.xv[k]) + ',' + U.val(g.yv[k]) + ')') + '.');
      }
    }

    function drawValid(d, c) {
      const body = P.valid.body;
      Lab.clear(body);
      U.title(P.valid, 'Is it a valid joint PMF?');
      P.valid.sub('Two checks from ' + U.link('l1-1', 'L1.1') + ': every cell is a probability, ' + tx('0\\le ' + fXY() + '(t_1,t_2)\\le 1') + ', and all the cells add up to 1.');
      if (d.labelErr || d.sizeErr || d.errX || d.errY) { body.appendChild(K.note('<span class="cbad">' + (d.labelErr || esc(d.sizeErr || d.errX || d.errY)) + '</span>', 'small')); return; }
      const steps = [];
      if (d.mode === 'type') {
        const nCells = d.raw.xs.length * d.raw.ys.length;
        if (d.issues.length) {
          steps.push({ html: '<b>Check 1 — every cell between 0 and 1:</b> <span class="cbad">✗</span> ' + d.issues.length + ' of the ' + nCells + ' cells fail:',
            block: Lab.table(['cell', 'you typed', 'problem'], d.issues.map(s => [U.nw(fXY() + '(' + U.val(s.x) + ',' + U.val(s.y) + ')'), '<span class="t1-nw"><code>' + esc(s.raw) + '</code>' + (s.f != null && s.f.toString() !== s.raw.trim() ? ' = ' + tx(U.tf(s.f)) : '') + '</span>', s.why])) });
        } else {
          const all = d.J.p.flat();
          const lo = all.reduce((a, b) => (Number(b) < Number(a) ? b : a)), hi = all.reduce((a, b) => (Number(b) > Number(a) ? b : a));
          steps.push({ html: '<b>Check 1 — every cell between 0 and 1:</b> all ' + nCells + ' cells pass <span class="cgood">✓</span> (smallest ' + tx(U.p(lo, c)) + ', largest ' + tx(U.p(hi, c)) + ').' });
        }
        if (d.J) steps.push(...totalStep(d, c));
        else steps.push({ html: '<b>Check 2 — total 1:</b> fix the cells that are not numbers first.' });
        if (d.total != null && !d.totalOk) {
          const diff = U.add(F(1), isExact(d.total) ? d.total.neg() : -Number(d.total));
          steps.push({ html: 'The total misses 1 by ' + tx('1-' + U.p(d.total, c) + '=' + U.res(diff, c)) + '. Press <b>Rescale to total 1</b> under your table: it divides every cell by ' + tx(U.p(d.total, c)) + ', so the new total is ' + tx('\\tfrac{' + U.p(d.total, c) + '}{' + U.p(d.total, c) + '}=1') + '.' });
        }
      } else {
        steps.push({ html: '<b>Check 1 — every cell between 0 and 1:</b> a cell is a sum of outcome probabilities, so it is at least 0; and it is part of the total, so it is at most 1 <span class="cgood">✓</span>.' });
        steps.push(...totalStep(d, c));
        steps.push({ html: 'Why the total is always 1 here: each of the ' + d.N + ' outcomes lands in exactly <b>one</b> cell, so the cells split the whole sample space, whose probability is 1.' });
      }
      body.appendChild(K.steps(steps));
    }
    function totalStep(d, c) {
      const J = d.J, nx = J.xs.length, ny = J.ys.length;
      const ok = U.isOne(d.total);
      const mark = ok ? '\\ \\checkmark' : '\\ne 1';
      const sym = '\\sum_{t_1\\in T_{' + nX() + '}}\\ \\sum_{t_2\\in T_{' + nY() + '}}' + fXY() + '(t_1,t_2)';
      if (nx * ny <= 12) {
        const terms = [];
        J.ys.forEach((_, j) => J.xs.forEach((_, i) => terms.push(J.p[i][j])));
        return [{ html: '<b>Check 2 — total 1:</b> add all ' + nx * ny + ' cells, row by row: ' + (ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>'), math: sym + '=' + U.sumLine(terms, d.total, c) + mark }];
      }
      const rows = J.ys.map((y, j) => { const r = J.xs.map((_, i) => J.p[i][j]); return { y, s: U.sum(r), r }; });
      return [
        { html: '<b>Check 2 — total 1:</b> ' + nx * ny + ' cells, so first add each row:', block: Lab.table(['row', 'its ' + nx + ' cells added'], rows.map(r => [U.nw(nY() + '=' + U.val(r.y)), U.nw(U.sumLine(r.r, r.s, c))])) },
        { html: 'Then add the ' + ny + ' row totals: ' + (ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>'), math: sym + '=' + U.sumLine(rows.map(r => r.s), d.total, c) + mark },
      ];
    }

    function drawMarg(g, c) {
      const body = P.marg.body;
      Lab.clear(body);
      const J = g.J;
      U.title(P.marg, 'Marginal PMFs: add down each column, along each row');
      P.marg.sub('From ' + U.link('l1-2', 'L1.2') + ': keep one variable fixed and add over every value of the other (“marginalize it out”). The sums sit in the <b>margins</b> of the table.');
      const colSym = t => J.ys.length <= 4 ? J.ys.map(y => fXY() + '(' + t + ',' + U.val(y) + ')').join('+') : "\\sum_{t'}" + fXY() + '(' + t + ",t')";
      const rowSym = t => J.xs.length <= 4 ? J.xs.map(x => fXY() + '(' + U.val(x) + ',' + t + ')').join('+') : "\\sum_{t'}" + fXY() + "(t'," + t + ')';
      const steps = [
        { html: '<b>Marginal of ' + tx(nX()) + '.</b> Fix the column ' + tx('t_1=t') + ' and add its cells, one for each value of ' + tx(nY()) + ' in ' + tx('T_{' + nY() + '}=' + U.set(J.ys)) + ':', math: 'f_{' + nX() + "}(t)=\\sum_{t'\\in T_{" + nY() + '}}' + fXY() + "(t,t')",
          block: Lab.table([tx('t'), 'column ' + tx('t') + ' added', 'with your numbers'], J.xs.map((x, i) => [U.nw(U.val(x)), U.nw('f_{' + nX() + '}(' + U.val(x) + ')=' + colSym(U.val(x))), U.nw('=' + U.sumLine(J.p[i], g.mx[i], c))])) },
        { html: 'Check: ' + tx('f_{' + nX() + '}') + ' is a PMF — its values add up to 1:', math: '\\sum_t f_{' + nX() + '}(t)=' + U.sumLine(g.mx, U.sum(g.mx), c) + (U.isOne(U.sum(g.mx)) ? '\\ \\checkmark' : '') },
        { html: '<b>Marginal of ' + tx(nY()) + '.</b> Fix the row ' + tx('t_2=t') + ' and add its cells, one for each value of ' + tx(nX()) + ' in ' + tx('T_{' + nX() + '}=' + U.set(J.xs)) + ':', math: 'f_{' + nY() + "}(t)=\\sum_{t'\\in T_{" + nX() + '}}' + fXY() + "(t',t)",
          block: Lab.table([tx('t'), 'row ' + tx('t') + ' added', 'with your numbers'], J.ys.map((y, j) => [U.nw(U.val(y)), U.nw('f_{' + nY() + '}(' + U.val(y) + ')=' + rowSym(U.val(y))), U.nw('=' + U.sumLine(J.p.map(r => r[j]), g.my[j], c))])) },
        { html: 'Check: ' + tx('\\sum_t f_{' + nY() + '}(t)=1') + ':', math: '\\sum_t f_{' + nY() + '}(t)=' + U.sumLine(g.my, U.sum(g.my), c) + (U.isOne(U.sum(g.my)) ? '\\ \\checkmark' : '') },
        { html: 'Joint → marginal has exactly one answer. Marginal → joint does not: many tables share these margins (' + U.link('l1-2', 'L1.2') + ', Case 1 and Case 2 — both are in the Lecture examples menu).' },
      ];
      body.appendChild(K.steps(steps));
    }

    function drawGraphsXY(g, c) {
      [[P.gx, 'x'], [P.gy, 'y']].forEach(([panel, ax]) => {
        const isX = ax === 'x';
        const nm = isX ? nX() : nY();
        U.title(panel, 'PMF and CDF of ' + tx(nm));
        panel.sub(tx('f_{' + nm + '}(t)') + ' is the ' + (isX ? 'bottom margin (column sums)' : 'right margin (row sums)') + ' of the table. The CDF ' + tx('F_{' + nm + '}(t)=P(' + nm + '\\le t)') + ' adds the bars up to ' + tx('t') + '; move ' + tx('t') + ' and read the sum.');
        Lab.clear(panel.body);
        U.graphs(panel.body, { vals: isX ? g.J.xs : g.J.ys, p: isX ? g.mx : g.my }, { name: nm, plain: isX ? st.xName : st.yName, tone: ax, c, t: st.t[ax], onT: v => { st.t[ax] = v; save(); } });
      });
    }

    function drawCond(g, c) {
      const body = P.cond.body;
      Lab.clear(body);
      const J = g.J;
      const k = condIndex(g);
      const isX = st.cAxis === 'x';
      const A = isX ? nX() : nY(), B = isX ? nY() : nX();
      const av = U.val(isX ? J.xs[k] : J.ys[k]);
      const slice = isX ? J.p[k] : J.p.map(r => r[k]);
      const vals = isX ? J.ys : J.xs;
      const tot = isX ? g.mx[k] : g.my[k];
      const given = A + '=' + av;
      const cf = 'f_{' + B + '\\mid ' + given + '}';
      const cell = t => fXY() + (isX ? '(' + av + ',' + t + ')' : '(' + t + ',' + av + ')');
      U.title(P.cond, 'Conditional PMF of ' + tx(B + '\\mid ' + given) + ': slice, then divide');
      P.cond.sub('From ' + U.link('l1-3', 'L1.3') + ': once you know ' + tx(given) + ', only the ' + (isX ? 'column' : 'row') + ' ' + tx((isX ? 't_1' : 't_2') + '=' + av) + ' can still happen. Take that slice and divide it by its total, the marginal ' + tx('f_{' + A + '}(' + av + ')') + '.');
      const host = h('div');
      body.appendChild(host);
      const jt = jointWidget(g, c, { caption: false, hover: true });
      jt.mount(host);
      const keep = vals.map((_, q) => (isX ? [k, q] : [q, k]));
      jt.dimExcept(keep);
      jt.mark(keep);
      (isX ? jt.xHead(k) : jt.yHead(k)).classList.add('sel');
      if (!(Number(tot) > 0)) {
        body.appendChild(K.steps([{ html: tx('f_{' + A + '}(' + av + ')=' + U.sumLine(slice, tot, c)) + ': the event ' + tx(given) + ' never happens, so there is nothing to condition on — ' + tx(B + '\\mid ' + given) + ' is not defined. Pick another value.' }]));
        P.gc.hidden = true;
        return;
      }
      const cond = slice.map(v => (isExact(v) && isExact(tot) ? v.div(tot) : Number(v) / Number(tot)));
      const range = vals.filter((_, q) => Number(cond[q]) > 0);
      const zeros = vals.filter((_, q) => Number(cond[q]) === 0);
      const cc = c.mode === 'count' ? { mode: 'frac' } : c;
      const steps = [
        { html: 'The definition, with ' + tx(A + '=' + av) + ':', math: cf + "(t')=P(" + B + "=t'\\mid " + given + ')=\\dfrac{' + cell("t'") + '}{f_{' + A + '}(' + av + ')}' },
        { html: 'The slice is the ' + (isX ? 'column' : 'row') + ' ' + tx(given) + ' (violet). Its total is the marginal, from the ' + (isX ? 'bottom' : 'right') + ' margin:', math: 'f_{' + A + '}(' + av + ')=' + U.sumLine(slice, tot, c) },
        { html: 'Divide every cell of the slice by ' + tx('f_{' + A + '}(' + av + ')=' + U.p(tot, c)) + ':',
          block: Lab.table([tx("t'"), tx(cell("t'")), tx('\\div f_{' + A + '}(' + av + ')'), tx(cf + "(t')")], vals.map((v, q) => [U.nw(U.val(v)), U.nw(U.p(slice[q], c)), U.nw(U.divLine(slice[q], tot, c)), '<b>' + U.nw(U.res(cond[q], cc, c.mode !== 'dec')) + '</b>'])) },
        { html: 'Range of ' + tx(B + '\\mid ' + given) + ': ' + tx(U.set(range)) + (zeros.length ? ' — the value' + (zeros.length > 1 ? 's ' : ' ') + tx(zeros.map(U.val).join(',')) + ' drop' + (zeros.length > 1 ? '' : 's') + ' out (zero cell' + (zeros.length > 1 ? 's' : '') + ' in the slice), so the range is smaller than ' + tx('T_{' + B + '}=' + U.set(vals)) + '.' : ' — the same as ' + tx('T_{' + B + '}') + ': no zero cells in the slice.') },
        { html: 'Check: a conditional PMF is a full PMF, so it adds up to 1:', math: "\\sum_{t'}" + cf + "(t')=" + U.sumLine(cond, U.sum(cond), cc) + (U.isOne(U.sum(cond)) ? '\\ \\checkmark' : '') },
      ];
      const q0 = vals.findIndex((_, q) => Number(cond[q]) > 0);
      if (q0 >= 0) steps.push({ html: 'The product rule turns it back into the joint: cell = conditional × marginal. For example, with ' + tx("t'=" + U.val(vals[q0])) + ':', math: cell(U.val(vals[q0])) + '=' + cf + '(' + U.val(vals[q0]) + ')\\cdot f_{' + A + '}(' + av + ')=' + U.p(cond[q0], cc) + '\\cdot ' + U.p(tot, c) + '=' + U.res(U.mul(cond[q0], tot), c) + '\\ \\checkmark' });
      body.appendChild(K.steps(steps));
      P.gc.hidden = false;
      U.title(P.gc, 'PMF and CDF of ' + tx(B + '\\mid ' + given));
      P.gc.sub('The conditional distribution you just computed: bar height ' + tx(cf + "(t')") + '. Values outside its range have height 0. Its CDF adds the bars up to ' + tx('t') + '.');
      Lab.clear(P.gc.body);
      U.graphs(P.gc.body, { vals, p: cond }, { name: B, given, plain: (isX ? st.yName : st.xName) + ' | ' + (isX ? st.xName : st.yName) + '=' + av, tone: isX ? 'y' : 'x', c: cc, t: st.t.c, onT: v => { st.t.c = v; save(); } });
    }

    function evalEvent(g) {
      const names = [...new Set(['X', 'Y', 'x', 'y', st.xName, st.yName])];
      let test;
      try { test = U.parseEvent(st.event, names); } catch (e) { return { ok: false, err: e.message }; }
      const J = g.J, cells = [];
      try {
        J.xs.forEach((x, i) => J.ys.forEach((y, j) => {
          const env = { X: x, Y: y, x, y };
          env[st.xName] = x; env[st.yName] = y;
          if (test(env)) cells.push([i, j]);
        }));
      } catch (e) { return { ok: false, err: e.message }; }
      const pE = U.sum(cells.map(([i, j]) => J.p[i][j]));
      return { ok: true, cells, pE };
    }
    function drawEvent(g, c) {
      const body = P.event.body;
      Lab.clear(body);
      const J = g.J;
      const ev = evalEvent(g);
      ctl.ev.input.classList.toggle('bad', !ev.ok);
      ctl.ev.hint(ev.ok ? ev.cells.length + ' of the ' + J.xs.length * J.ys.length + ' cells are in ' + tx('E') + '.' : '<span class="cbad">' + esc(ev.err) + '</span>');
      U.title(P.event, 'The probability of your event ' + tx('E'));
      P.event.sub('An event about ' + tx(nX()) + ' and ' + tx(nY()) + ' is a set of cells. Its probability is the sum of those cells — the same rule as for one random variable.');
      if (!ev.ok) { body.appendChild(K.note('<span class="cbad">' + esc(ev.err) + '</span> Showing nothing until the event can be read. Examples: <code>X + Y &lt;= 2</code>, <code>X = Y</code>, <code>1 &lt;= X &lt;= 3 and Y != 0</code>.', 'small')); return; }
      const host = h('div');
      body.appendChild(host);
      const jt = jointWidget(g, c, { caption: false, margins: 'none', hover: true });
      jt.mount(host);
      jt.mark(ev.cells);
      const srcX = (st.event || '').trim();
      const inRows = ev.cells.map(([i, j]) => {
        const env = { X: J.xs[i], Y: J.ys[j], x: J.xs[i], y: J.ys[j] };
        env[st.xName] = J.xs[i]; env[st.yName] = J.ys[j];
        return [U.nw('(' + U.val(J.xs[i]) + ',' + U.val(J.ys[j]) + ')'), '<span class="t1-nw"><code>' + esc(U.subst(srcX, env)) + '</code> <span class="cgood">✓</span></span>', U.nw(U.p(J.p[i][j], c))];
      });
      const nz = ev.cells.filter(([i, j]) => Number(J.p[i][j]) > 0);
      const zc = ev.cells.length - nz.length;
      const steps = [
        { html: 'Your event: <code>' + esc(srcX) + '</code>. Test each of the ' + J.xs.length * J.ys.length + ' cells ' + tx('(t_1,t_2)') + ' by putting ' + tx(nX() + '=t_1') + ' and ' + tx(nY() + '=t_2') + ' into it. ' + ev.cells.length + ' pass' + (ev.cells.length === 1 ? 'es' : '') + ' (violet above):',
          block: ev.cells.length ? Lab.table(['cell ' + tx('(t_1,t_2)'), 'the test with its numbers', tx(fXY() + '(t_1,t_2)')], inRows.slice(0, 80)) : null },
        { html: 'Add the probabilities of the cells in ' + tx('E') + (zc ? ' (' + zc + ' of them ' + (zc === 1 ? 'is' : 'are') + ' 0 and add nothing, so they are left out of the sum)' : '') + ':',
          math: 'P(E)=\\sum_{(t_1,t_2)\\in E}' + fXY() + '(t_1,t_2)=' + (nz.length ? U.sumLine(nz.map(([i, j]) => J.p[i][j]), ev.pE, c, true) : '0') },
        { html: 'And the opposite event: ' + tx('P(\\text{not }E)=1-P(E)=1-' + U.p(ev.pE, c) + '=' + U.res(U.add(F(1), isExact(ev.pE) ? ev.pE.neg() : -Number(ev.pE)), c)) + ' — the cells that are not violet.' },
      ];
      if (ev.cells.length > 80) steps[0].note = 'Only the first 80 of the ' + ev.cells.length + ' cells are listed.';
      body.appendChild(K.steps(steps));
    }

    /** A display formula as a step block (a second formula under a step's math, so phones stack them). */
    const mathLine = src => h('div', { class: 's-math', html: Lab.tex(src, true) });
    /** X | E and Y | E (L1.3, minutes 0–1): keep the cells in E, divide each by P(E), add down each column / along each row. */
    function condOnEvent(g, ev) {
      if (!ev.ok) return { ok: false };
      if (!(Number(ev.pE) > 0)) return { ok: true, zero: true };
      const J = g.J;
      const inE = new Set(ev.cells.map(([i, j]) => i + ',' + j));
      const inside = (i, j) => inE.has(i + ',' + j);
      const dv = (a, b) => (isExact(a) && isExact(b) ? a.div(b) : Number(a) / Number(b));
      const p = J.xs.map((_, i) => J.ys.map((_, j) => (inside(i, j) ? dv(J.p[i][j], ev.pE) : F(0))));
      const nx = J.xs.map((_, i) => U.sum(J.ys.map((_, j) => (inside(i, j) ? J.p[i][j] : F(0)))));
      const ny = J.ys.map((_, j) => U.sum(J.xs.map((_, i) => (inside(i, j) ? J.p[i][j] : F(0)))));
      return { ok: true, zero: false, inside, p, nx, ny, fx: nx.map(v => dv(v, ev.pE)), fy: ny.map(v => dv(v, ev.pE)) };
    }
    function drawCondE(g, c) {
      const body = P.ce.body;
      Lab.clear(body);
      const J = g.J, ev = evalEvent(g), ce = condOnEvent(g, ev);
      const A = nX(), B = nY();
      U.title(P.ce, 'Condition on your event ' + tx('E') + ': ' + tx(A + '\\mid E') + ' and ' + tx(B + '\\mid E'));
      P.ce.sub('From ' + U.link('l1-3', 'L1.3') + ' (minutes 0–1): once you know that ' + tx('E') + ' happened, only the cells in ' + tx('E') + ' can still happen. Keep them, divide each by ' + tx('P(E)') + ', then add down each column for ' + tx(A + '\\mid E') + ' and along each row for ' + tx(B + '\\mid E') + '. The range can shrink.');
      if (!ev.ok) { body.appendChild(K.note('<span class="cbad">' + esc(ev.err) + '</span> Fix the event in step 4 on the left to condition on it.', 'small')); P.gce.hidden = true; return; }
      const srcE = '<code>' + esc((st.event || '').trim()) + '</code>';
      if (ce.zero) {
        body.appendChild(K.steps([{ html: 'Your event ' + srcE + ' has ' + tx('P(E)=0') + (ev.cells.length ? ' (its ' + ev.cells.length + ' cell' + (ev.cells.length === 1 ? ' is' : 's are') + ' 0)' : ' (no cell passes the test)') + ', so it never happens: ' + tx(A + '\\mid E') + ' and ' + tx(B + '\\mid E') + ' are <b>not defined</b> — they would divide by 0. Pick an event with a cell of positive probability.' }]));
        P.gce.hidden = true;
        return;
      }
      const cc = c.mode === 'count' ? { mode: 'frac' } : c;
      const pE = ev.pE;
      const nz = ev.cells.filter(([i, j]) => Number(J.p[i][j]) > 0);
      const zc = ev.cells.length - nz.length;
      const cellT = (i, j) => fXY() + '(' + U.val(J.xs[i]) + ',' + U.val(J.ys[j]) + ')';
      const condT = (i, j) => 'f_{' + A + B + '\\mid E}(' + U.val(J.xs[i]) + ',' + U.val(J.ys[j]) + ')';
      // the table given E: every cell of E divided by P(E), the others 0
      const MAXL = 40;
      const divRows = nz.slice(0, MAXL).map(([i, j]) => [U.nw('(' + U.val(J.xs[i]) + ',' + U.val(J.ys[j]) + ')'), U.nw(U.p(J.p[i][j], c)), U.nw(U.divLine(J.p[i][j], pE, c)), '<b>' + U.nw(U.res(ce.p[i][j], cc, c.mode !== 'dec')) + '</b>']);
      const divBlock = h('div', { class: 't1-ce-div' });
      Lab.mountBlock(Lab.table(['cell ' + tx('(t_1,t_2)'), tx(fXY() + '(t_1,t_2)'), tx('\\div P(E)'), tx('f_{' + A + B + '\\mid E}(t_1,t_2)')], divRows), divBlock);
      if (nz.length > MAXL) divBlock.appendChild(K.note('Only the first ' + MAXL + ' of the ' + nz.length + ' cells are listed.', 'small muted'));
      const toF = v => (v instanceof Frac ? v : Frac.fromNumber(Number(v)));
      const jHost = h('div', { class: 't1-ce-table' });
      divBlock.appendChild(jHost);
      const jt = W.joint({ J: { xs: J.xs, ys: J.ys, p: ce.p.map(col => col.map(toF)) }, x: { name: st.xName }, y: { name: st.yName }, margins: 'shown', fmt: c.mode === 'dec' ? 'dec' : 'frac', caption: false, hover: false });
      jt.mount(jHost);
      const inCells = ev.cells.slice();
      jt.dimExcept(inCells);
      jt.mark(inCells);
      const mh = (cls, html) => { const el = jHost.querySelector(cls); if (el) Lab.setHTML(el, html); };
      mh('.jt-mh-x', tx('f_{' + A + '\\mid E}'));
      mh('.jt-mh-y', tx('f_{' + B + '\\mid E}'));
      // X | E: each column; Y | E: each row
      const sideTable = isX => {
        const vals = isX ? J.xs : J.ys;
        const rows = vals.map((v, q) => {
          const terms = (isX ? J.ys.map((_, j) => [q, j]) : J.xs.map((_, i) => [i, q])).filter(([i, j]) => ce.inside(i, j) && Number(J.p[i][j]) > 0).map(([i, j]) => J.p[i][j]);
          const num = isX ? ce.nx[q] : ce.ny[q], res = isX ? ce.fx[q] : ce.fy[q];
          const nm = isX ? A : B;
          return [U.nw(U.val(v)), terms.length ? U.nw('P(' + nm + '=' + U.val(v) + ',\\ E)=' + U.sumLine(terms, num, c)) : '<span class="muted">no cell of ' + tx('E') + ': 0</span>', U.nw(U.divLine(num, pE, c)), '<b>' + U.nw(U.res(res, cc, c.mode !== 'dec')) + '</b>'];
        });
        const nm = isX ? A : B, s = isX ? 't' : "t'";
        return Lab.table([tx(s), 'cells of ' + tx('E') + ' in this ' + (isX ? 'column' : 'row') + ', added', tx('\\div P(E)'), tx('f_{' + nm + '\\mid E}(' + s + ')')], rows);
      };
      const rangeLine = isX => {
        const vals = isX ? J.xs : J.ys, f = isX ? ce.fx : ce.fy, nm = isX ? A : B;
        const rng = vals.filter((_, q) => Number(f[q]) > 0), gone = vals.filter((_, q) => !(Number(f[q]) > 0));
        return 'Range of ' + tx(nm + '\\mid E') + ': ' + tx(U.set(rng)) + (gone.length ? ' — the value' + (gone.length > 1 ? 's ' : ' ') + tx(gone.map(U.val).join(',')) + ' drop' + (gone.length > 1 ? '' : 's') + ' out (no cell of ' + tx('E') + ' with positive probability there), so it is smaller than ' + tx('T_{' + nm + '}=' + U.set(vals)) + '.' : ' — the same as ' + tx('T_{' + nm + '}') + '.');
      };
      const q0 = J.xs.findIndex((_, q) => Number(ce.fx[q]) > 0);
      const steps = [
        { html: 'The definition (' + U.link('l1-3', 'L1.3') + ', minute 1): “probability of intersection of those two events divided by probability of ' + tx('A') + '”. Here the event is ' + tx('E') + ':',
          math: '\\begin{aligned}f_{' + A + '\\mid E}(t)&=P(' + A + '=t\\mid E)\\\\&=\\dfrac{P(' + A + '=t,\\ E)}{P(E)}\\end{aligned}',
          block: mathLine('\\begin{aligned}f_{' + B + "\\mid E}(t')&=P(" + B + "=t'\\mid E)\\\\&=\\dfrac{P(" + B + "=t',\\ E)}{P(E)}\\end{aligned}") },
        { html: 'Your event ' + srcE + ' holds in ' + ev.cells.length + ' of the ' + J.xs.length * J.ys.length + ' cells (violet' + (zc ? '; ' + zc + ' of them ' + (zc === 1 ? 'is' : 'are') + ' 0 and add nothing' : '') + '). Their total is the denominator:',
          math: 'P(E)=' + U.sumLine(nz.map(([i, j]) => J.p[i][j]), pE, c, true) },
        { html: 'Divide every cell of ' + tx('E') + ' by ' + tx('P(E)=' + U.p(pE, c)) + '; every cell outside ' + tx('E') + ' becomes 0. The result is the joint PMF given ' + tx('E') + ' (below the list: its bottom margin is ' + tx('f_{' + A + '\\mid E}') + ', its right margin ' + tx('f_{' + B + '\\mid E}') + ', and all its cells add up to 1):', block: divBlock },
        { html: '<b>' + tx(A + '\\mid E') + '</b>: add each column of that table. It is the same as adding the cells of ' + tx('E') + ' in the column, ' + tx('P(' + A + '=t,\\ E)') + ', and dividing once by ' + tx('P(E)') + ':', block: sideTable(true) },
        { html: '<b>' + tx(B + '\\mid E') + '</b>: add each row the same way:', block: sideTable(false) },
        { html: rangeLine(true) + '<br>' + rangeLine(false) },
        { html: 'Check: both are full PMFs, so each adds up to 1:', math: '\\sum_t f_{' + A + '\\mid E}(t)=' + U.sumLine(ce.fx, U.sum(ce.fx), cc) + (U.isOne(U.sum(ce.fx)) ? '\\ \\checkmark' : ''),
          block: mathLine("\\sum_{t'} f_{" + B + "\\mid E}(t')=" + U.sumLine(ce.fy, U.sum(ce.fy), cc) + (U.isOne(U.sum(ce.fy)) ? '\\ \\checkmark' : '')) },
      ];
      if (q0 >= 0) steps.push({ html: 'The product rule turns it back: ' + tx('P(' + A + '=t,\\ E)=f_{' + A + '\\mid E}(t)\\cdot P(E)') + '. For example, with ' + tx('t=' + U.val(J.xs[q0])) + ':', math: 'P(' + A + '=' + U.val(J.xs[q0]) + ',\\ E)=' + U.p(ce.fx[q0], cc) + '\\cdot ' + U.p(pE, c) + '=' + U.res(U.mul(ce.fx[q0], pE), c) + '\\ \\checkmark' });
      // when E is a whole column (X = t) or a whole row (Y = t'), this is the slice conditional of step 3
      const cols = new Set(ev.cells.map(([i]) => i)), rows = new Set(ev.cells.map(([, j]) => j));
      if (cols.size === 1 && ev.cells.length === J.ys.length) steps.push({ html: 'Your ' + tx('E') + ' is the whole column ' + tx(A + '=' + U.val(J.xs[[...cols][0]])) + ', so ' + tx(B + '\\mid E') + ' is exactly the conditional ' + tx(B + '\\mid ' + A + '=' + U.val(J.xs[[...cols][0]])) + ' of step 3 (“slice, then divide”) — the same numbers.' });
      else if (rows.size === 1 && ev.cells.length === J.xs.length) steps.push({ html: 'Your ' + tx('E') + ' is the whole row ' + tx(B + '=' + U.val(J.ys[[...rows][0]])) + ', so ' + tx(A + '\\mid E') + ' is exactly the conditional ' + tx(A + '\\mid ' + B + '=' + U.val(J.ys[[...rows][0]])) + ' of step 3 (“slice, then divide”) — the same numbers.' });
      body.appendChild(K.steps(steps));
      // the two conditional distributions as graphs
      P.gce.hidden = false;
      U.title(P.gce, 'PMF and CDF of ' + tx(A + '\\mid E') + ' and of ' + tx(B + '\\mid E'));
      P.gce.sub('The conditional distributions you just computed, with ' + tx('E') + ': ' + srcE + '. Every probability here is given ' + tx('E') + ' — read ' + tx('F(t)') + ' as ' + tx('P(' + A + '\\le t\\mid E)') + '. Values outside a range have height 0.');
      Lab.clear(P.gce.body);
      [[true, 'ex'], [false, 'ey']].forEach(([isX, key]) => {
        const box = h('div', { class: 't1-ce-g' });
        box.appendChild(h('div', { class: 't1-ce-h', html: tx((isX ? A : B) + '\\mid E') + ' — the ' + (isX ? 'bottom' : 'right') + ' margin of the table given ' + tx('E') }));
        U.graphs(box, { vals: isX ? J.xs : J.ys, p: isX ? ce.fx : ce.fy }, { name: isX ? A : B, given: 'E', plain: (isX ? st.xName : st.yName) + ' | E', tone: isX ? 'x' : 'y', c: cc, t: st.t[key], onT: v => { st.t[key] = v; save(); } });
        P.gce.body.appendChild(box);
      });
    }

    /* -------------------------------------------------------------- mount */
    function mount(el) {
      root = el;
      const { side, main } = K.layout(root, 't1-joint');
      side.appendChild(K.group('Lecture examples'));
      ctl.pre = K.presets({ items: PRESETS, onPick: loadPreset });
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 't1-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
        Lab.store.set(KEY, {});
        Object.keys(st).forEach(k => delete st[k]);
        Object.assign(st, DEF());
        ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, '');
        buildSide(); draw();
      }, 'btn ghost sm')));
      P.answer = K.answer();
      P.table = K.panel('Your joint PMF');
      P.out = K.panel('Which outcomes land in each cell');
      P.valid = K.panel('Is it a valid joint PMF?');
      P.valid.classList.add('t1-keep');
      P.marg = K.panel('Marginal PMFs');
      P.gx = K.panel('PMF and CDF of X');
      P.gy = K.panel('PMF and CDF of Y');
      P.cond = K.panel('Conditional PMF');
      P.gc = K.panel('PMF and CDF of the conditional');
      P.event = K.panel('Your event');
      P.ce = K.panel('Condition on your event');
      P.gce = K.panel('PMF and CDF given your event');
      main.append(P.answer, P.table, P.out, P.valid, P.marg, P.gx, P.gy, P.cond, P.gc, P.event, P.ce, P.gce);
      root.__t1 = { get st() { return st; }, get good() { return good; }, get dump() { return dump; } };
      buildSide();
      draw();
      if (st.loaded && st.loaded.source) {
        const k = PRESETS.findIndex(p => p.label === st.loaded.label);
        if (k >= 0) { ctl.pre.select.value = String(k); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[k].source); }
      }
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-s2-joint', course: 's2', week: 1, order: 1,
    title: 'Joint, marginal & conditional lab', sub: 'Week 1 · L1.1–L1.3',
    topics: ['joint PMF', 'validity', 'marginal PMF', 'conditional PMF', 'events', 'given an event', 'PMF', 'CDF', 'experiments'],
    desc: 'Type your own joint table of any size, or count one from coins, dice, a card or a random number with your own X and Y. See the checks, both marginals, any conditional, any event and X, Y given that event, every sum and division written out with your numbers.',
    render: el => jointLab().mount(el),
  });
})();
