/* Figures the reader can move. Two kinds: ```jd, a joint density in 3D (described here), and ```live, a 2D chart of one
   variable (described further down, at "2D figures").

   Joint-density figures. A ```jd block in a page becomes a figure: the density f(x, y) over its support drawn as a
   solid that turns under the finger, the event's part of it in a second colour with its volume (the probability),
   and, for marginals and conditionals, a slice that moves with a slider, with its curve in a 2D chart below.

   ```jd
   alt: …                       what the figure shows, read aloud by screen readers
   caption: …                   a line under the figure (the build renders its $maths$)
   box: 0 1 0 1                 the floor drawn: x from 0 to 1, y from 0 to 1 (numbers or expressions)
   f: x+y                       the density on its support: + - * / ^ ( ), exp sqrt abs log min max step, pi, e
   support: 0<x<1, 0<y<1        ',' joins conditions (and), '|' joins pieces (or); 0<x<1 is two conditions
   event: x+y<1                 the teal part; its volume is the probability (and-conditions only)
   exact: 1/3                   the exact answer, shown beside the volume the figure measures (and checked by the build)
   label: P(X + Y < 1)          the name of that volume
   param: l1 0.2 3 1 λ₁         a slider: name, lowest, highest, start, label; the expressions may use the name
   ibox: 0 14/l1 0 14/l2        where volumes are measured, when the support goes on beyond the box drawn
   slice: x y 0.3               a slice at x = a (and, with "y", at y = a), its start; a slider moves it
   chart: marginal              under the solid: the marginal (each slice's area), or "conditional" (the slice ÷ its area)
   fx: a+1/2 | a + ½            the marginal of X at a, exact, with its words (fy for Y); checked against the slices
   cx: (a+y)/(a+1/2) | …        the conditional of Y given X = a, as a formula of a and y (cy: of X given Y = a, in x)
   zmax: 2                      the height of the top of the drawing (default: the tallest point)
   note: Area of D = {w*h}      a sentence after the figure's own; {expr} is a value (a and b: the slice or the point)
   chart: independence          two sliders pick a point (a, b): the joint density there against f_X(a) × f_Y(b)
   chart: product               the same point and slices: f_X(a) × f_{Y|X=a}(b), which is the joint density again
   at: 1/4 3/4                  where that point starts; expect: 0 1 (the joint and the product there) and indep: no
                                (or yes) are checked by the build
   case: Two squares            a button: the lines after it change the figure for this case
   ```
   The same code runs in the build (REV.jdParse, REV.jdCheck: no DOM) and in the page (REV.jdMount). */
(function (root) {
  'use strict';
  const REV = (root.REV = root.REV || {});

  /* ---------------------------------------------------------------- expressions */
  const FN = {
    exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs, log: Math.log, ln: Math.log, sin: Math.sin, cos: Math.cos, atan: Math.atan,
    min: Math.min, max: Math.max, step: t => (t >= 0 ? 1 : 0),      // 1 from 0 on: a block's own edge counts as the block
  };
  const CONST = { pi: Math.PI, e: Math.E };
  const BIN = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 };
  const TOKEN = /\s*(?:(\d+\.?\d*(?:e[+-]?\d+)?|\.\d+)|([A-Za-z_][A-Za-z_0-9]*)|([-+*/^(),]))/y;

  function compile(src, names) {
    src = String(src);
    const toks = [];
    for (let pos = 0; pos < src.length && /\S/.test(src.slice(pos));) {
      TOKEN.lastIndex = pos;
      const m = TOKEN.exec(src);
      if (!m) throw new Error('cannot read "' + src.slice(pos).trim() + '" in "' + src + '"');
      toks.push(m[1] != null ? { n: parseFloat(m[1]) } : m[2] != null ? { id: m[2] } : { op: m[3] });
      pos = TOKEN.lastIndex;
    }
    let i = 0;
    const peek = () => toks[i], take = () => toks[i++], is = (t, o) => !!t && t.op === o;
    const need = o => { if (!is(take(), o)) throw new Error('"' + o + '" is missing in "' + src + '"'); };
    function primary() {
      const t = take();
      if (!t) throw new Error('"' + src + '" ends too soon');
      if (t.n != null) { const n = t.n; return () => n; }
      if (t.op === '(') { const e = sum(1); need(')'); return e; }
      if (t.op === '-') { const e = sum(3); return v => -e(v); }
      if (t.op === '+') return sum(3);
      if (t.id != null) {
        if (FN[t.id]) {
          const f = FN[t.id];
          need('(');
          const args = [sum(1)];
          while (is(peek(), ',')) { take(); args.push(sum(1)); }
          need(')');
          if (args.length === 1) { const a = args[0]; return v => f(a(v)); }
          return v => f(...args.map(a => a(v)));
        }
        if (t.id in CONST) { const c = CONST[t.id]; return () => c; }
        if (names.includes(t.id)) { const k = t.id; return v => v[k]; }
        throw new Error('unknown name "' + t.id + '" in "' + src + '"');
      }
      throw new Error('unexpected "' + t.op + '" in "' + src + '"');
    }
    function sum(min) {
      let l = primary();
      for (;;) {
        const t = peek(), p = t && t.op ? BIN[t.op] : 0;
        if (!p || p < min) return l;
        take();
        const r = sum(t.op === '^' ? p : p + 1), a = l, o = t.op;
        l = o === '+' ? v => a(v) + r(v) : o === '-' ? v => a(v) - r(v) : o === '*' ? v => a(v) * r(v)
          : o === '/' ? v => a(v) / r(v) : v => Math.pow(a(v), r(v));
      }
    }
    const e = sum(1);
    if (i < toks.length) { const t = toks[i]; throw new Error('unexpected "' + (t.op || t.id || t.n) + '" in "' + src + '"'); }
    return e;
  }

  // "0<x<1, y>0 | …" → pieces (or) of conditions (and), each a function that is negative inside
  // split at a character, but not inside brackets: the comma of max(x-1, 1-y) stays
  function splitTop(s, ch) {
    const out = [];
    let depth = 0, from = 0;
    for (let k = 0; k < s.length; k++) {
      if (s[k] === '(') depth++;
      else if (s[k] === ')') depth--;
      else if (s[k] === ch && depth === 0) { out.push(s.slice(from, k)); from = k + 1; }
    }
    out.push(s.slice(from));
    return out;
  }
  function region(src, names) {
    return splitTop(String(src), '|').map(piece => splitTop(piece, ',').flatMap(q => {
      const parts = q.split(/(<=|>=|<|>)/).map(s => s.trim());
      if (parts.length < 3 || parts.length % 2 === 0) throw new Error('"' + q.trim() + '" is not an inequality');
      const gs = [];
      for (let k = 0; k + 2 < parts.length; k += 2) {
        const L = compile(parts[k], names), R = compile(parts[k + 2], names);
        gs.push(parts[k + 1][0] === '<' ? v => L(v) - R(v) : v => R(v) - L(v));
      }
      return gs;
    }));
  }

  /* ---------------------------------------------------------------- the block's text */
  const CASE_KEYS = ['f', 'support', 'event', 'exact', 'label', 'box', 'ibox', 'fx', 'fy', 'cx', 'cy', 'zmax', 'at', 'indep', 'expect', 'note'];
  function parse(text) {
    const spec = { cases: [], params: [] };
    let cur = null;
    for (const raw of String(text).split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = /^([a-z]+):\s*(.*)$/.exec(line);
      if (!m) throw new Error('cannot read the line "' + line + '"');
      const k = m[1], val = m[2].trim();
      if (k === 'case') { cur = { name: val }; spec.cases.push(cur); }
      else if (k === 'param') spec.params.push(val);
      else if (CASE_KEYS.includes(k)) (cur || spec)[k] = val;
      else if (['alt', 'caption', 'slice', 'chart'].includes(k)) spec[k] = val;
      else throw new Error('unknown key "' + k + '"');
    }
    if (!spec.cases.length) spec.cases.push({ name: '' });
    spec.cases = spec.cases.map(c => { const o = {}; CASE_KEYS.forEach(k => { if (spec[k] != null) o[k] = spec[k]; }); return Object.assign(o, c); });
    CASE_KEYS.forEach(k => delete spec[k]);
    return spec;
  }

  // compile a parsed block: functions of v = { x, y, a, params… }
  function prep(spec) {
    const params = spec.params.map(p => {
      const [name, lo, hi, start, ...lab] = p.split(/\s+/);
      if (!/^[A-Za-z_]\w*$/.test(name) || ['x', 'y', 'a', 'b'].includes(name) || name in CONST || name in FN || [lo, hi, start].some(t => !isFinite(+t))) throw new Error('cannot read the param "' + p + '"');
      return { name, lo: +lo, hi: +hi, v: +start, label: lab.join(' ') || name };
    });
    const names = ['x', 'y', 'a', 'b', ...params.map(p => p.name)];
    const num = s => compile(s, names);
    const words2 = s => String(s).split(/\{([^}]*)\}/).map((t, i) => (i % 2 ? num(t) : t));   // "area {w*h}"
    const four = s => { const t = String(s || '').trim().split(/\s+/); if (t.length !== 4) throw new Error('a box needs four numbers: "' + s + '"'); return t.map(num); };
    const formula = s => { if (!s) return null; const [e, words] = s.split('|'); return { f: num(e), text: (words || e).trim() }; };
    const sl = (spec.slice || '').split(/\s+/).filter(Boolean);
    return {
      params, names, chart: spec.chart || '',
      dirs: sl.filter(t => t === 'x' || t === 'y'), a0: sl.find(t => isFinite(+t)) != null ? +sl.find(t => isFinite(+t)) : null,
      cases: spec.cases.map(c => {
        if (!c.support) throw new Error('a case needs a support');
        return {
          name: c.name || '', label: c.label || '', exactText: c.exact || '',
          f: num(c.f || '1'), support: region(c.support, names), event: c.event ? region(c.event, names) : null,
          exact: c.exact ? num(c.exact) : null, box: four(c.box), ibox: c.ibox ? four(c.ibox) : null,
          fx: formula(c.fx), fy: formula(c.fy), cx: formula(c.cx), cy: formula(c.cy), zmax: c.zmax ? num(c.zmax) : null,
          at: c.at ? c.at.trim().split(/\s+/).map(num) : null, indep: c.indep || null, expect: c.expect ? c.expect.trim().split(/\s+/).map(num) : null,
          note: c.note ? words2(c.note) : null,
          uses: params.filter(p => new RegExp('\\b' + p.name + '\\b').test(CASE_KEYS.map(k => c[k] || '').join('\n'))).map(p => p.name),
        };
      }),
    };
  }

  /* ---------------------------------------------------------------- geometry */
  // keep the part of a polygon where g < 0; b on a vertex: the edge from it to the next one is on a boundary
  function clip(poly, g, v) {
    const n = poly.length, val = new Array(n), out = [];
    for (let k = 0; k < n; k++) { v.x = poly[k].x; v.y = poly[k].y; val[k] = g(v); }
    for (let k = 0; k < n; k++) {
      const P = poly[k], Q = poly[(k + 1) % n], gp = val[k], gq = val[(k + 1) % n], pin = gp < 0, qin = gq < 0;
      if (pin) out.push(P);
      if (pin !== qin) {
        const t = gp / (gp - gq);
        out.push({ x: P.x + t * (Q.x - P.x), y: P.y + t * (Q.y - P.y), b: pin ? true : P.b });
      }
    }
    return out.length >= 3 ? out : null;
  }
  const inside = (pieces, v) => pieces.some(p => p.every(g => g(v) < 0));

  // the support's and the event's polygons over an n × n grid of the box B
  function cells(c, v, B, n) {
    const sup = [], ev = [], dx = (B[1] - B[0]) / n, dy = (B[3] - B[2]) / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const x0 = B[0] + i * dx, y0 = B[2] + j * dy, x1 = x0 + dx, y1 = y0 + dy;
        const cell = [{ x: x0, y: y0, b: j === 0 }, { x: x1, y: y0, b: i === n - 1 }, { x: x1, y: y1, b: j === n - 1 }, { x: x0, y: y1, b: i === 0 }];
        for (const piece of c.support) {
          let p = cell;
          for (const g of piece) { p = clip(p, g, v); if (!p) break; }
          if (!p) continue;
          sup.push(p);
          if (c.event) for (const ep of c.event) {
            let q = p;
            for (const g of ep) { q = clip(q, g, v); if (!q) break; }
            if (q) ev.push(q);
          }
        }
      }
    }
    return { sup, ev };
  }

  // ∬ f over the polygons: each is cut into triangles, and a triangle's share is its area × the mean of f at the
  // middles of its three sides (exact for a flat, a sloping and a quadratic f; very close for a smooth one)
  function volume(polys, f, v) {
    let s = 0;
    for (const p of polys) {
      const a = p[0];
      for (let k = 1; k + 1 < p.length; k++) {
        const b = p[k], c = p[k + 1];
        const A = Math.abs((b.x - a.x) * (c.y - a.y) - (c.x - a.x) * (b.y - a.y)) / 2;
        if (A < 1e-15) continue;
        let t = 0;
        v.x = (a.x + b.x) / 2; v.y = (a.y + b.y) / 2; t += f(v);
        v.x = (b.x + c.x) / 2; v.y = (b.y + c.y) / 2; t += f(v);
        v.x = (c.x + a.x) / 2; v.y = (c.y + a.y) / 2; t += f(v);
        s += A * t / 3;
      }
    }
    return s;
  }

  // the area of the slice at x = a (dir "x") or y = a (dir "y"): ∫ f over the other variable, inside the support
  function sliceArea(c, v, B, dir, a, m) {
    m = m || 2000;
    const lo = dir === 'x' ? B[2] : B[0], hi = dir === 'x' ? B[3] : B[1], h = (hi - lo) / m;
    let s = 0;
    for (let k = 0; k < m; k++) {
      const t = lo + (k + 0.5) * h;
      if (dir === 'x') { v.x = a; v.y = t; } else { v.x = t; v.y = a; }
      if (inside(c.support, v)) s += c.f(v);
    }
    return s * h;
  }

  function jointProduct(c, v, B, IB, a, b) {
    const fa = sliceArea(c, v, IB, 'x', a, 1200), fb = sliceArea(c, v, IB, 'y', b, 1200);
    v.x = a; v.y = b;
    return { joint: inside(c.support, v) ? c.f(v) : 0, fa, fb, product: fa * fb };
  }
  function independent(c, v, B, IB) {      // the same at every point of a 13 × 13 grid?
    for (let i = 0; i < 13; i++) for (let j = 0; j < 13; j++) {
      const q = jointProduct(c, v, B, IB, B[0] + (B[1] - B[0]) * (i + 0.43) / 13, B[2] + (B[3] - B[2]) * (j + 0.57) / 13);
      if (Math.abs(q.joint - q.product) > 2e-3 * Math.max(1, q.joint)) return false;
    }
    return true;
  }

  const env = (C, vals) => { const v = { x: 0, y: 0, a: 0 }; C.params.forEach(p => { v[p.name] = vals && p.name in vals ? vals[p.name] : p.v; }); return v; };
  const boxOf = (B, v) => B.map(f => f(v));

  /* ---------------------------------------------------------------- the build's check */
  // every number the figure shows must be right: total volume 1, the event's volume = exact, formulas = slices
  function check(text) {
    const errs = [];
    let C;
    try { C = prep(parse(text)); } catch (e) { return [e.message]; }
    C.cases.forEach((c, ci) => {
      const tag = c.name ? 'case "' + c.name + '": ' : '';
      try {
        const v = env(C), B = boxOf(c.box, v), IB = c.ibox ? boxOf(c.ibox, v) : B;
        const g = cells(c, v, IB, 160);
        const total = volume(g.sup, c.f, v);
        if (Math.abs(total - 1) > 2e-3) errs.push(tag + 'the total volume is ' + total.toFixed(4) + ', not 1');
        if (c.exact) {
          const got = c.event ? volume(g.ev, c.f, v) : total, want = c.exact(v);
          if (Math.abs(got - want) > 2e-3 * Math.max(1, Math.abs(want))) errs.push(tag + 'the figure measures ' + got.toFixed(4) + ' but exact says ' + want.toFixed(4));
        }
        for (const [key, dir] of [['fx', 'x'], ['fy', 'y']]) {
          if (!c[key]) continue;
          const lo = dir === 'x' ? B[0] : B[2], hi = dir === 'x' ? B[1] : B[3];
          for (let k = 1; k < 20; k++) {
            const a = lo + (hi - lo) * (k + 0.37) / 20, area = sliceArea(c, v, IB, dir, a, 4000);
            if (area <= 0) continue;
            v.a = a;
            const want = c[key].f(v);
            if (Math.abs(area - want) > 3e-3 * Math.max(1, Math.abs(want))) { errs.push(tag + key + ' at a = ' + a.toFixed(3) + ' gives ' + want.toFixed(4) + ' but the slice has area ' + area.toFixed(4)); break; }
          }
        }
        for (const [key, dir] of [['cx', 'x'], ['cy', 'y']]) {
          if (!c[key]) continue;
          const lo = dir === 'x' ? B[0] : B[2], hi = dir === 'x' ? B[1] : B[3];
          outer: for (let k = 1; k < 12; k++) {
            const a = lo + (hi - lo) * (k + 0.37) / 12, area = sliceArea(c, v, IB, dir, a, 4000);
            if (area <= 0) continue;
            for (let j = 1; j < 12; j++) {
              const t = (dir === 'x' ? B[2] + (B[3] - B[2]) * (j + 0.29) / 12 : B[0] + (B[1] - B[0]) * (j + 0.29) / 12);
              if (dir === 'x') { v.x = a; v.y = t; } else { v.x = t; v.y = a; }
              if (!inside(c.support, v)) continue;
              const cond = c.f(v) / area;
              v.a = a;
              const want = c[key].f(v);
              if (Math.abs(cond - want) > 3e-3 * Math.max(1, Math.abs(want))) { errs.push(tag + key + ' at a = ' + a.toFixed(3) + ' gives ' + want.toFixed(4) + ' but the slice ÷ its area is ' + cond.toFixed(4)); break outer; }
            }
          }
        }
        if (C.chart === 'independence') {
          const same = independent(c, v, B, IB);
          if (c.indep && (c.indep === 'yes') !== same) errs.push(tag + 'indep says ' + c.indep + ' but the joint and the product ' + (same ? 'agree everywhere' : 'differ'));
          if (c.expect) {
            const at = c.at ? c.at.map(f => f(v)) : [(B[0] + B[1]) / 2, (B[2] + B[3]) / 2], q = jointProduct(c, v, B, IB, at[0], at[1]), want = c.expect.map(f => f(v));
            if (Math.abs(q.joint - want[0]) > 2e-3 || Math.abs(q.product - want[1]) > 2e-3) errs.push(tag + 'at (' + at.join(', ') + ') the joint is ' + q.joint.toFixed(4) + ' and the product ' + q.product.toFixed(4) + ', not ' + want.join(' and '));
          }
        }
      } catch (e) { errs.push(tag + e.message); }
    });
    return errs;
  }

  /* ================================================================ 2D figures: ```live blocks
     One variable: curves, bars, shaded areas with their value, the data or a seeded sample, sliders and a legend.

     ```live
     alt: …                                  what the figure shows (required)
     caption: …                              a line under the figure (the build renders its $maths$)
     param: n 5 200 20 n | int               a slider: name, lowest, highest, start, label; "| int" for whole numbers
     x: -4 4                                 the x range (numbers or expressions); y: lo hi (else it fits the marks)
     xlabel: sample mean                     under the x axis
     data: 1, 1, 0, 1                        the data (a case may give its own); or a seeded sample with a "New sample" button:
     sample: bernoulli(p) | n=n              bernoulli(p) normal(mu, s) uniform(a, b) expon(l) binomial(m, p) poisson(l) randint(a, b) gamma(alpha, beta) choice(0:0.3, 1:0.7)
                                             and, to see a theorem by simulation: sumexp(n, beta) normalsq(s) ratio(1) gratio(alpha, beta) chisq(n)
     let: bound = 0.25 / (n * d^2)           a named value; the data give N, xbar, s2 (÷ N−1), v0 (÷ N), total, dmin, dmax, lbar (the mean of the logs)
     prop: S = x <= -1                       the share of the data with the condition (x is a data value)
     sum: T = k from 0 to n : binom(n, p, k) if abs(k/n - p) > d
     curve: normpdf(x, 0, 1) | color=1 label="Normal(0, 1)"            (also: from a to b, dashed, thin)
     bars: k from 0 to n : binom(n, p, k) | at=k/n hi=abs(k/n - p) > d color=1 hicolor=2 label="…" hilabel="…"
     area: normpdf(x, 0, 1) from -d to d | name=A color=3 label="…"    (A is its area, for read lines; hide: measured, not drawn)
     dots: | color=1 label="the data"        the data on the x axis, equal values stacked
     pmf: | color=1 label="…"                the data's share of each value, as bars
     hist: 20 -4 4 | color=0 label="…"       a density histogram of the data: bins, from, to
     spikes: -1:1/2, 0:1/4, 2:1/4 | hi=x > 1   a PMF given as value:probability pairs (expressions allowed), as bars
     sumdist: -1:1/2, 0:1/4, 2:1/4 | n=n step=1 std hi=x > 2 name=T      the exact distribution of the sum of n i.i.d. copies (avg: of their average)
                                             (step: the spacing of the values; std: shown as (sum − nμ)/(√n σ), bars as a
                                             density; T: the probability of the highlighted bars); or uniform(-1, 1) | grid=0.04
     dat(k) in an expression is the k-th value of the data (k from 1)
     vline: xbar | color=2 label="mean {xbar}" dashed      (hline: the same across; point: x, y | …)
     read: Chebyshev's bound | bound | exact=0.1           a line under the picture: text = value (exact: checked by the build)
     check: normcdf(1.96) ~ 0.975            the build stops if the two differ
     case: Sampling 2                        a button; the lines after it belong to this case
     ```
     Colours: 1 blue (the accent), 2 orange, 3 green, 4 purple, 0 grey. Text in label="…" and in read lines may
     hold {expr}: its value. Functions: those of ```jd, and floor ceil round cosh sinh fact comb gamma lgamma
     normpdf normcdf norminv binom binomcdf pois geom exppdf unifpdf gammapdf betapdf cauchypdf chi2pdf tpdf tcdf tinv. */
  function lgamma(x) {        // Lanczos; for x > 0
    const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = x, t = x + 5.5, s = 1.000000000190015;
    t -= (x + 0.5) * Math.log(t);
    for (let j = 0; j < 6; j++) s += g[j] / ++y;
    return -t + Math.log(2.5066282746310005 * s / x);
  }
  const isInt = n => n === Math.floor(n);
  function fact(n) { if (n < 0) return NaN; if (isInt(n) && n <= 170) { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; } return Math.exp(lgamma(n + 1)); }
  function lcomb(n, k) { return lgamma(n + 1) - lgamma(k + 1) - lgamma(n - k + 1); }
  function comb(n, k) {
    if (k < 0 || k > n) return 0;
    if (isInt(n) && isInt(k) && n <= 60) { let c = 1; k = Math.min(k, n - k); for (let i = 1; i <= k; i++) c = c * (n - k + i) / i; return Math.round(c); }
    return Math.exp(lcomb(n, k));
  }
  function erfc(z) {          // a series with positive terms near 0, a continued fraction beyond; both to about 1e-13
    if (z < 0) return 2 - erfc(-z);
    if (z < 2.5) {
      let term = z, sum = z;
      for (let n = 1; n < 200 && term > 1e-17 * sum; n++) { term *= 2 * z * z / (2 * n + 1); sum += term; }
      return 1 - 2 / Math.sqrt(Math.PI) * Math.exp(-z * z) * sum;
    }
    let K = z;
    for (let k = 80; k >= 1; k--) K = z + (k / 2) / K;
    return Math.exp(-z * z) / (Math.sqrt(Math.PI) * K);
  }
  const normcdf = (x, mu, s) => 0.5 * erfc(-((x - (mu || 0)) / (s == null ? 1 : s)) / Math.SQRT2);
  const normpdf = (x, mu, s) => { s = s == null ? 1 : s; const z = (x - (mu || 0)) / s; return Math.exp(-z * z / 2) / (s * Math.sqrt(2 * Math.PI)); };
  function bisect(f, lo, hi) { for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (f(m) < 0) lo = m; else hi = m; } return (lo + hi) / 2; }
  const norminv = p => (p <= 0 ? -Infinity : p >= 1 ? Infinity : bisect(x => normcdf(x) - p, -12, 12));
  function binom(n, p, k) {
    if (!isInt(k) || k < 0 || k > n) return 0;
    if (p <= 0) return k === 0 ? 1 : 0;
    if (p >= 1) return k === n ? 1 : 0;
    return Math.exp(lcomb(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p));
  }
  function binomcdf(n, p, k) { let s = 0; for (let i = 0; i <= Math.min(n, Math.floor(k)); i++) s += binom(n, p, i); return s; }
  const pois = (l, k) => (!isInt(k) || k < 0 ? 0 : Math.exp(-l + k * Math.log(l) - lgamma(k + 1)));
  const geom = (p, k) => (!isInt(k) || k < 1 ? 0 : Math.pow(1 - p, k - 1) * p);
  const gammapdf = (x, a, b) => (x <= 0 ? 0 : Math.exp(a * Math.log(b) - lgamma(a) + (a - 1) * Math.log(x) - b * x));
  const betapdf = (x, a, b) => (x <= 0 || x >= 1 ? 0 : Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + (a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x)));
  const tpdf = (x, n) => Math.exp(lgamma((n + 1) / 2) - lgamma(n / 2) - 0.5 * Math.log(n * Math.PI) - (n + 1) / 2 * Math.log(1 + x * x / n));
  function tcdf(x, n) {       // Simpson's rule on the density from 0 to |x|
    const a = Math.abs(x), m = 400, hh = a / m;
    let s = tpdf(0, n) + tpdf(a, n);
    for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * tpdf(i * hh, n);
    const half = s * hh / 3;
    return x >= 0 ? 0.5 + half : 0.5 - half;
  }
  Object.assign(FN, {
    floor: Math.floor, ceil: Math.ceil, round: Math.round, cosh: Math.cosh, sinh: Math.sinh, tanh: Math.tanh, sign: Math.sign,
    fact, comb, lgamma, gamma: x => Math.exp(lgamma(x)), normpdf, normcdf, norminv, binom, binomcdf, pois, geom,
    exppdf: (x, l) => (x < 0 ? 0 : l * Math.exp(-l * x)), unifpdf: (x, a, b) => (x > a && x < b ? 1 / (b - a) : 0),
    gammapdf, betapdf, cauchypdf: (x, th, al) => al / (Math.PI * (al * al + (x - th) * (x - th))),
    chi2pdf: (x, n) => gammapdf(x, n / 2, 0.5), tpdf, tcdf, tinv: (p, n) => bisect(x => tcdf(x, n) - p, -200, 200),
  });

  // split at | outside brackets and quotes; then the options after the first part: color=2 label="…" dashed
  function fields(s) {
    const out = [];
    let depth = 0, q = false, from = 0;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === '"') q = !q;
      else if (q) continue;
      else if (ch === '(') depth++;
      else if (ch === ')') depth--;
      else if (ch === '|' && depth === 0 && s[i - 1] === ' ' && s[i + 1] === ' ') { out.push(s.slice(from, i)); from = i + 1; }
    }
    out.push(s.slice(from));
    return out.map(t => t.trim());
  }
  function options(parts) {
    const o = {};
    for (const part of parts) {
      let m, rest = part;
      // name="quoted text", name=expression (to the next " name=" or the end), or a bare word
      while (rest.trim()) {
        m = /^\s*([a-z]+)=("[^"]*")\s*/i.exec(rest) || /^\s*([a-z]+)=(.*?)(?=\s+[a-z]+=|\s+(?:dashed|thin|int|hide|pct|std|raw|signed|avg)\b|$)\s*/i.exec(rest) || /^\s*([a-z]+)\s*/i.exec(rest);
        if (!m) throw new Error('cannot read the option "' + rest + '"');
        o[m[1]] = m[2] == null ? true : m[2].replace(/^"|"$/g, '');
        rest = rest.slice(m[0].length);
      }
    }
    return o;
  }
  const LIVE_SERIES = ['curve', 'bars', 'area', 'dots', 'pmf', 'hist', 'vline', 'hline', 'point', 'spikes', 'sumdist'];
  const LIVE_ONE = ['x', 'y', 'xlabel', 'ylabel', 'data', 'sample'];
  function liveParse(text) {
    const spec = { params: [], cases: [], common: [] };
    let cur = null;
    for (const raw of String(text).split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const m = /^([a-z]+):\s*(.*)$/.exec(line);
      if (!m) throw new Error('cannot read the line "' + line + '"');
      const k = m[1], val = m[2].trim();
      if (k === 'alt' || k === 'caption') spec[k] = val;
      else if (k === 'param') spec.params.push(val);
      else if (k === 'case') { cur = { name: val, lines: [] }; spec.cases.push(cur); }
      else if (LIVE_SERIES.includes(k) || LIVE_ONE.includes(k) || ['let', 'prop', 'sum', 'read', 'check'].includes(k)) (cur ? cur.lines : spec.common).push([k, val]);
      else throw new Error('unknown key "' + k + '"');
    }
    if (!spec.cases.length) spec.cases.push({ name: '', lines: [] });
    return spec;
  }

  const DATA_NAMES = ['N', 'xbar', 's2', 'v0', 'total', 'dmin', 'dmax', 'lbar'];
  function livePrep(spec) {
    const params = spec.params.map(p => {
      const parts = fields(p), [name, lo, hi, start, ...lab] = parts[0].split(/\s+/), o = options(parts.slice(1));
      if (!/^[A-Za-z_]\w*$/.test(name) || ['x', 'k'].includes(name) || name in CONST || name in FN || [lo, hi, start].some(t => !isFinite(+t))) throw new Error('cannot read the param "' + p + '" (x, k, e, pi and function names are taken)');
      return { name, lo: +lo, hi: +hi, v: +start, label: lab.join(' ') || name, int: !!o.int, step: o.step ? +o.step : null };
    });
    const cases = spec.cases.map(c => {
      const lines = spec.common.concat(c.lines);
      // every name an expression may use: the sliders, the data's numbers, and what let / prop / sum / area name=… define
      const names = ['x', 'k', ...params.map(p => p.name), ...DATA_NAMES];
      for (const [k, val] of lines) {
        if (k === 'let' || k === 'prop' || k === 'sum') { const m = /^([A-Za-z_]\w*)\s*=/.exec(val); if (!m) throw new Error('"' + k + ': ' + val + '" needs name = …'); names.push(m[1]); }
        if (k === 'area' || k === 'sumdist') { const m = /\bname=([A-Za-z_]\w*)/.exec(val); if (m) names.push(m[1]); }
      }
      const num = s => compile(s, names);
      const text = s => { const parts = String(s).split(/\{([^}]*)\}/); return parts.map((t, i) => (i % 2 ? num(t) : t)); };   // "n = {n}"
      const one = {}, steps = [], series = [], reads = [], checks = [];
      for (const [k, val] of lines) {
        const parts = fields(' ' + val), head = parts[0], o = options(parts.slice(k === 'read' ? 2 : 1));   // "dots: | color=1": nothing before the options
        const style = { color: o.color == null ? (k === 'vline' || k === 'hline' ? 0 : 1) : +o.color, label: o.label ? text(o.label) : null, dashed: !!o.dashed, thin: !!o.thin };
        if (LIVE_ONE.includes(k)) {
          if (k === 'x' || k === 'y') { const t = head.split(/\s+/); if (t.length !== 2) throw new Error(k + ': needs two values'); one[k] = t.map(num); }
          else if (k === 'data') one.data = splitTop(head, ',').map(num);
          else if (k === 'sample') {
            const m = /^([a-z]+)\((.*)\)$/.exec(head); if (!m) throw new Error('cannot read the sample "' + head + '"');
            const args = m[1] === 'choice' ? splitTop(m[2], ',').map(t => t.split(':').map(num)) : splitTop(m[2], ',').map(num);
            one.sample = { dist: m[1], args, n: num(o.n || '20') };
          } else one[k] = head;
        } else if (k === 'let') { const i = val.indexOf('='); steps.push({ k, name: val.slice(0, i).trim(), f: num(val.slice(i + 1)) }); }
        else if (k === 'prop') { const i = val.indexOf('='); steps.push({ k, name: val.slice(0, i).trim(), cond: region(val.slice(i + 1), names) }); }
        else if (k === 'sum') {
          const m = /^([A-Za-z_]\w*)\s*=\s*k from (.+?) to (.+?)\s*:\s*(.+?)(?:\s+if\s+(.+))?$/.exec(val);
          if (!m) throw new Error('cannot read "sum: ' + val + '"');
          steps.push({ k, name: m[1], a: num(m[2]), b: num(m[3]), f: num(m[4]), cond: m[5] ? region(m[5], names) : null });
        } else if (k === 'read') reads.push({ text: text(head), f: parts[1] ? num(parts[1]) : null, exact: o.exact ? num(o.exact) : null, pct: !!o.pct });
        else if (k === 'check') { const t = head.split('~'); if (t.length !== 2) throw new Error('check: needs a ~ b'); checks.push({ a: num(t[0]), b: num(t[1]), src: head, tol: o.tol ? +o.tol : 1e-3 }); }
        else if (k === 'curve' || k === 'area') {
          const m = /^(.+?)(?:\s+from\s+(.+?)\s+to\s+(.+))?$/.exec(head);
          const s = { k, f: num(m[1]), a: m[2] ? num(m[2]) : null, b: m[3] ? num(m[3]) : null, name: o.name || null, hide: !!o.hide, ...style };
          if (k === 'area' && !s.a) throw new Error('an area needs "from a to b"');
          if (k === 'area') steps.push(s);
          if (!s.hide) series.push(s);
        } else if (k === 'bars') {
          const m = /^k from (.+?) to (.+?)\s*:\s*(.+)$/.exec(head); if (!m) throw new Error('cannot read "bars: ' + head + '"');
          series.push({ k, a: num(m[1]), b: num(m[2]), f: num(m[3]), at: o.at ? num(o.at) : null, width: o.width ? num(o.width) : null,
            hi: o.hi ? region(o.hi, names) : null, hicolor: o.hicolor == null ? 2 : +o.hicolor, hilabel: o.hilabel ? text(o.hilabel) : null, signed: !!o.signed, ...style });
        } else if (k === 'spikes' || k === 'sumdist') {
          const u = /^uniform\((.+)\)$/.exec(head);
          const sr = { k, base: u ? null : splitTop(head, ',').map(t => { const q = t.split(':'); if (q.length !== 2) throw new Error(k + ': needs value:probability pairs'); return q.map(num); }),
            unif: u ? splitTop(u[1], ',').map(num) : null, n: num(o.n || '1'), step: num(o.step || o.grid || '1'), std: !!o.std, avg: !!o.avg, raw: !!o.raw, name: o.name || null,
            hi: o.hi ? region(o.hi, names) : null, hicolor: o.hicolor == null ? 2 : +o.hicolor, hilabel: o.hilabel ? text(o.hilabel) : null, ...style };
          if (k === 'sumdist') steps.push(sr);
          series.push(sr);
        } else if (k === 'hist') { const t = head.split(/\s+/); if (t.length !== 3) throw new Error('hist: needs bins, from, to'); series.push({ k, bins: num(t[0]), a: num(t[1]), b: num(t[2]), ...style }); }
        else if (k === 'dots' || k === 'pmf') series.push({ k, ...style });
        else if (k === 'vline' || k === 'hline') series.push({ k, f: num(head), ...style });
        else if (k === 'point') { const t = splitTop(head, ','); if (t.length !== 2) throw new Error('point: needs x, y'); series.push({ k, fx: num(t[0]), f: num(t[1]), ...style }); }
      }
      if (!one.x) throw new Error('a live figure needs an x range');
      const src = lines.map(q => q[1]).join('\n');
      return { name: c.name || '', ...one, steps, series, reads, checks, uses: params.filter(p => new RegExp('\\b' + p.name + '\\b').test(src)).map(p => p.name) };
    });
    return { params, cases };
  }

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function gammaDraw(r, std, a) {        // Marsaglia and Tsang's method; a shape below 1 by the usual lift
    if (a < 1) return gammaDraw(r, std, a + 1) * Math.pow(r(), 1 / a);
    const d = a - 1 / 3, c = 1 / Math.sqrt(9 * d);
    for (;;) {
      let x, t;
      do { x = std(); t = 1 + c * x; } while (t <= 0);
      t = t * t * t;
      const u = r();
      if (u < 1 - 0.0331 * x * x * x * x || Math.log(u) < 0.5 * x * x + d * (1 - t + Math.log(t))) return d * t;
    }
  }
  function draws(sm, v, seed) {
    const r = rng(seed), n = Math.max(1, Math.min(20000, Math.round(sm.n(v)))), out = [], a = sm.dist === 'choice' ? null : sm.args.map(f => f(v));
    const std = () => Math.sqrt(-2 * Math.log(1 - r())) * Math.cos(2 * Math.PI * r());
    for (let i = 0; i < n; i++) {
      if (sm.dist === 'bernoulli') out.push(r() < a[0] ? 1 : 0);
      else if (sm.dist === 'normal') out.push(a[0] + a[1] * std());
      else if (sm.dist === 'uniform') out.push(a[0] + (a[1] - a[0]) * r());
      else if (sm.dist === 'expon') out.push(-Math.log(1 - r()) / a[0]);
      else if (sm.dist === 'binomial') { let c = 0; for (let j = 0; j < a[0]; j++) if (r() < a[1]) c++; out.push(c); }
      else if (sm.dist === 'poisson') { let c = 0, p = Math.exp(-a[0]), s = p; const u = r(); while (u > s && c < 1000) { c++; p *= a[0] / c; s += p; } out.push(c); }
      else if (sm.dist === 'sumexp') { let t = 0; for (let j = 0; j < Math.round(a[0]); j++) t += -Math.log(1 - r()) / a[1]; out.push(t); }
      else if (sm.dist === 'normalsq') { const z = a[0] * std(); out.push(z * z); }
      else if (sm.dist === 'ratio') out.push(std() / std());
      else if (sm.dist === 'gratio') { const g1 = gammaDraw(r, std, a[0]), g2 = gammaDraw(r, std, a[1]); out.push(g1 / (g1 + g2)); }
      else if (sm.dist === 'chisq') { let t = 0; for (let j = 0; j < Math.round(a[0]); j++) { const z = std(); t += z * z; } out.push(t); }
      else if (sm.dist === 'randint') out.push(Math.round(a[0]) + Math.floor(r() * (Math.round(a[1]) - Math.round(a[0]) + 1)));
      else if (sm.dist === 'gamma') out.push(gammaDraw(r, std, a[0]) / a[1]);
      else if (sm.dist === 'choice') { const u = r(); let s = 0, val = sm.args[sm.args.length - 1][0](v); for (const [fv, fp] of sm.args) { s += fp(v); if (u < s) { val = fv(v); break; } } out.push(val); }
      else throw new Error('unknown sample "' + sm.dist + '"');
    }
    return out;
  }
  // the distribution of a sum of n i.i.d. copies, exactly, on the lattice of the values (powers by repeated squaring)
  function conv(a, b) { const out = new Float64Array(a.length + b.length - 1); for (let i = 0; i < a.length; i++) { const ai = a[i]; if (ai) for (let j = 0; j < b.length; j++) out[i + j] += ai * b[j]; } return out; }
  function sumDist(sr, v) {
    const n = Math.max(1, Math.min(200, Math.round(sr.n(v)))), step = sr.step(v);
    let first, p;                                        // the base PMF: p[j] at first + j × step
    if (sr.unif) { const a = sr.unif[0](v), b = sr.unif[1](v), m = Math.max(2, Math.round((b - a) / step)); first = a + step / 2; p = new Float64Array(m).fill(1 / m); }
    else {
      const pairs = sr.base.map(([fv, fp]) => [Math.round(fv(v) / step), fp(v)]), lo = Math.min(...pairs.map(q => q[0])), hi = Math.max(...pairs.map(q => q[0]));
      first = lo * step; p = new Float64Array(hi - lo + 1); pairs.forEach(([i, q]) => { p[i - lo] += q; });
    }
    let mu = 0, m2 = 0; p.forEach((q, j) => { const x = first + j * step; mu += q * x; m2 += q * x * x; });
    const sd = Math.sqrt(m2 - mu * mu);
    let res = new Float64Array([1]), base = p, e = n;
    while (e > 0) { if (e & 1) res = conv(res, base); e >>= 1; if (e) base = conv(base, base); }
    const scale = sr.std ? Math.sqrt(n) * sd : sr.avg ? n : 1, w = step / scale, dens = sr.std || (!!sr.unif && !sr.avg), bars = [];   // avg: the sum ÷ n
    let T = 0;
    for (let j = 0; j < res.length; j++) {
      const q = res[j]; if (q < 1e-300) continue;
      const x = sr.std ? (n * first + j * step - n * mu) / scale : (n * first + j * step) / scale;
      // a continuous base: each bar stands for a cell of values, so a boundary that cuts a cell takes only its share
      let share = 0;
      if (sr.hi && sr.unif) { for (let i = 0; i < 10; i++) { v.x = x + ((i + 0.5) / 10 - 0.5) * w; if (inside(sr.hi, v)) share += 0.1; } }
      else if (sr.hi) { v.x = x; share = inside(sr.hi, v) ? 1 : 0; }
      T += q * share;
      bars.push({ x, y: dens ? q / w : q, hi: share >= 0.5 });
    }
    return { bars, w, T, mu, sd };
  }
  let curData = null;                                    // dat(k): the k-th value of the figure's data
  FN.dat = k => (curData && curData[Math.round(k) - 1] != null ? curData[Math.round(k) - 1] : NaN);
  FN.lcombsum = m => (curData ? curData.reduce((a, d) => a + (d > m ? -Infinity : lcomb(m, d)), 0) : NaN);   // the sum of log C(m, x_i) over the data
  const simpson = (f, a, b, m) => { m = m || 400; const hh = (b - a) / m; let s = f(a) + f(b); for (let i = 1; i < m; i++) s += (i % 2 ? 4 : 2) * f(a + i * hh); return s * hh / 3; };

  // everything a case shows, for the sliders' values (vals) and the sample's number (seed)
  function liveState(C, ci, vals, seed) {
    const c = C.cases[ci], v = { x: 0, k: 0 };
    C.params.forEach(p => { v[p.name] = vals && p.name in vals ? vals[p.name] : p.v; });
    DATA_NAMES.forEach(nm => { if (!(nm in v)) v[nm] = NaN; });
    let data = null;
    if (c.data) data = c.data.map(f => f(v));
    else if (c.sample) data = draws(c.sample, v, seed || 1);
    if (data) {
      const N = data.length, total = data.reduce((a, b) => a + b, 0), xbar = total / N, ss = data.reduce((a, b) => a + (b - xbar) * (b - xbar), 0);
      Object.assign(v, { N, total, xbar, s2: N > 1 ? ss / (N - 1) : NaN, v0: ss / N, dmin: Math.min(...data), dmax: Math.max(...data), lbar: data.reduce((a, b) => a + Math.log(b), 0) / N });
    }
    curData = data;
    for (const s of c.steps) {
      if (s.k === 'let') v[s.name] = s.f(v);
      else if (s.k === 'sumdist') { s.out = sumDist(s, v); if (s.name) v[s.name] = s.out.T; }
      else if (s.k === 'prop') { let cnt = 0; for (const d of data || []) { v.x = d; if (inside(s.cond, v)) cnt++; } v[s.name] = data && data.length ? cnt / data.length : NaN; }
      else if (s.k === 'sum') { let t = 0; const b = Math.round(s.b(v)); for (let k = Math.round(s.a(v)); k <= b; k++) { v.k = k; if (!s.cond || inside(s.cond, v)) t += s.f(v); } v[s.name] = t; }
      else if (s.k === 'area') { const a = s.a(v), b = s.b(v); s.A = b > a ? simpson(x => { v.x = x; const y = s.f(v); return isFinite(y) ? y : 0; }, a, b, 4000) : 0; if (s.name) v[s.name] = s.A; }
    }
    const xr = c.x.map(f => f(v));
    return { c, v, data, xr };
  }
  const liveText = (parts, v, f) => parts.map((t, i) => (i % 2 ? f(t(v)) : t)).join('');

  function liveCheck(text) {
    const errs = [];
    let C;
    try { C = livePrep(liveParse(text)); } catch (e) { return [e.message]; }
    C.cases.forEach((c, ci) => {
      const tag = c.name ? 'case "' + c.name + '": ' : '';
      try {
        // at the sliders' starting values, then at a few others across their ranges
        const tries = [null];
        const r = rng(7);
        for (let t = 0; t < 4; t++) { const o = {}; C.params.forEach(p => { let x = p.lo + (p.hi - p.lo) * r(); if (p.int) x = Math.round(x); o[p.name] = x; }); tries.push(o); }
        tries.forEach((vals, ti) => {
          const st = liveState(C, ci, vals, 1), v = st.v, at = ti ? ' (at ' + JSON.stringify(vals) + ')' : '';
          if (!(st.xr[1] > st.xr[0])) errs.push(tag + 'the x range is empty' + at);
          for (const rd of c.reads) {
            if (!rd.f) continue;
            const got = rd.f(v), name = liveText(rd.text, v, x => String(+x.toFixed(4)));
            if (!isFinite(got)) errs.push(tag + '"' + name + '" is not a number' + at);
            if (rd.exact) { const want = rd.exact(v); if (Math.abs(got - want) > 2e-3 * Math.max(1e-9, Math.abs(want)) + 1e-12) errs.push(tag + '"' + name + '" is ' + got + ' but exact says ' + want + at); }
          }
          if (!ti) for (const ch of c.checks) { const a = ch.a(v), b = ch.b(v); if (!(Math.abs(a - b) <= ch.tol * Math.max(1e-9, Math.abs(b)) + 1e-12)) errs.push(tag + 'check ' + ch.src + ': ' + a + ' against ' + b); }
          for (const s of c.series) {
            if (s.k === 'curve') { let ok = 0; const a = s.a ? s.a(v) : st.xr[0], b = s.b ? s.b(v) : st.xr[1]; for (let i = 0; i <= 40; i++) { v.x = a + (b - a) * (i + 0.5) / 41; if (isFinite(s.f(v))) ok++; } if (!ok) errs.push(tag + 'a curve has no value anywhere' + at); }
            if (s.k === 'bars') { const b = Math.round(s.b(v)); for (let k = Math.round(s.a(v)); k <= b; k++) { v.k = k; const y = s.f(v); if (!isFinite(y) || (y < -1e-12 && !s.signed)) { errs.push(tag + 'a bar at k = ' + k + ' is ' + y + ' (signed: bars that may go below 0)' + at); break; } } }
            if ((s.k === 'vline' || s.k === 'hline' || s.k === 'point') && !isFinite(s.f(v))) errs.push(tag + 'a ' + s.k + ' has no value' + at);
            if (['dots', 'pmf', 'hist'].includes(s.k) && !st.data) errs.push(tag + s.k + ' needs data or a sample');
            if (s.k === 'sumdist' && !(Math.abs(s.out.bars.reduce((a, q) => a + q.y * (s.std || s.unif ? s.out.w : 1), 0) - 1) < 1e-6)) errs.push(tag + 'a sumdist does not add up to 1' + at);
            if (s.k === 'spikes') { let t = 0; for (const [fv, fp] of s.base) { const q = fp(v); if (!isFinite(fv(v)) || !(q >= 0)) errs.push(tag + 'a spike has no value' + at); t += q; } if (!s.raw && Math.abs(t - 1) > 1e-6) errs.push(tag + 'the spikes add up to ' + t + ', not 1 (raw: heights that are not probabilities)' + at); }
          }
        });
      } catch (e) { errs.push(tag + e.message); }
    });
    return errs;
  }
  REV.liveParse = liveParse;
  REV.liveCheck = liveCheck;
  REV.liveFn = FN;

  REV.jdParse = parse;
  REV.jdCheck = check;
  if (typeof document === 'undefined') return;

  /* ---------------------------------------------------------------- the figure on the page */
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const fmt = x => (!isFinite(x) ? '—' : Math.abs(x) >= 100 ? x.toFixed(1) : x.toFixed(3));
  const words = (s, C) => { let t = String(s).replace(/\bpi\b/g, 'π').replace(/\*/g, ' × ').replace(/\s+/g, ' ').trim(); C.params.forEach(p => { t = t.replace(new RegExp('\\b' + p.name + '\\b', 'g'), p.label); }); return t; };
  const rgb = (el, name, fb) => {
    const s = getComputedStyle(el).getPropertyValue(name).trim();
    const m = /^#([0-9a-f]{6})$/i.exec(s) || /^#([0-9a-f]{3})$/i.exec(s);
    if (!m) return fb;
    const hx = m[1].length === 3 ? m[1].replace(/./g, ch => ch + ch) : m[1];
    return [0, 2, 4].map(k => parseInt(hx.slice(k, k + 2), 16)).join(',');
  };
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  REV.jdMount = function (fig) {
    if (fig.jdOn) return;
    fig.jdOn = true;
    if (fig.hasAttribute('data-live')) return liveMount(fig);
    let C;
    try { C = prep(parse(fig.getAttribute('data-jd') || '')); } catch (e) { fig.prepend(h('p', 'small', 'This figure could not be drawn: ' + e.message)); return; }
    const vals = {}; C.params.forEach(p => { vals[p.name] = p.v; });
    const S = { k: 0, yaw: 0.52, pitch: 0.5, top: false, dir: C.dirs[0] || null, a: C.a0, geo: null };

    const cap = fig.querySelector('figcaption');
    const cases = C.cases.length > 1 ? h('div', 'jd-cases') : null;
    const cv = h('canvas', 'jd-3d');
    cv.tabIndex = 0; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', fig.getAttribute('aria-label') || 'A joint density in 3D');
    const key = h('ul', 'jd-key');           // the legend: what each colour is
    const read = h('p', 'jd-read'); read.setAttribute('aria-live', 'polite');
    const ctrl = h('div', 'jd-ctrl');
    const IND = C.chart === 'independence' || C.chart === 'product', PROD = C.chart === 'product';
    const cv2 = C.chart && S.dir && !IND ? h('canvas', 'jd-2d') : null;
    if (cv2) { cv2.setAttribute('role', 'img'); cv2.setAttribute('aria-label', C.chart === 'marginal' ? 'The marginal density, each slice’s area' : 'The conditional density: the slice divided by its area'); }
    const kids = [cases, cv, key, read, ctrl, cv2].filter(Boolean);
    kids.forEach(k => fig.insertBefore(k, cap || null));

    if (cases) C.cases.forEach((c, i) => {
      const b = h('button', null, c.name); b.type = 'button';
      b.addEventListener('click', () => { S.k = i; S.geo = null; update(); });
      cases.append(b);
    });
    const row = (label, min, max, step, value, on) => {
      const l = h('label'), t = h('span', null, label), r = h('input'), o = h('output');
      Object.assign(r, { type: 'range', min, max, step, value });
      o.textContent = fmt(+value);
      r.addEventListener('input', () => { o.textContent = fmt(+r.value); on(+r.value); });
      l.append(t, r, o); ctrl.append(l);
      return { l, r, o, t };
    };
    C.params.forEach(p => { row(p.label, p.lo, p.hi, (p.hi - p.lo) / 200, p.v, x => { vals[p.name] = x; S.geo = null; update(); }).l.dataset.p = p.name; });
    let sl = null;
    const btns = h('div', 'jd-btns');
    const pt = IND ? [row('a, along x', 0, 1, 0.005, 0, x => { S.a = x; update(true); }), row('b, along y', 0, 1, 0.005, 0, x => { S.b = x; update(true); })] : null;
    if (S.dir) {
      sl = row('', 0, 1, 0.005, 0, x => { S.a = x; update(true); });
      if (C.dirs.length > 1) C.dirs.forEach(d => {
        const b = h('button', 'jd-dir', d === 'x' ? 'Slice x = a' : 'Slice y = a'); b.type = 'button'; b.dataset.d = d;
        b.addEventListener('click', () => { S.dir = d; S.geo = null; update(); });
        btns.append(b);
      });
    }
    const tv = h('button', 'jd-top', 'Top view'); tv.type = 'button';
    tv.addEventListener('click', () => { S.top = !S.top; draw(); });
    btns.append(tv, h('span', 'jd-hint', 'Drag the picture to turn it'));
    ctrl.append(btns);

    // geometry for the current case and sliders (the slice moving needs none of it)
    function build() {
      const c = C.cases[S.k], v = env(C, vals), B = boxOf(c.box, v), IB = c.ibox ? boxOf(c.ibox, v) : B;
      const g = cells(c, v, B, 24);            // drawn: 24 × 24 cells (a box such as 0..1 or 0..2 puts 0, ½, 1 on cell edges)
      const lift = p => p.map(q => { v.x = q.x; v.y = q.y; return { x: q.x, y: q.y, z: c.f(v), b: q.b }; });
      const sup = g.sup.map(lift), ev = g.ev.map(lift);
      const ig = cells(c, v, IB, 140);         // measured: a finer grid, over all of the support
      let zmax = c.zmax ? c.zmax(v) : 0;
      if (!zmax) sup.forEach(p => p.forEach(q => { if (q.z > zmax) zmax = q.z; }));
      const geo = { c, v, B, IB, sup, ev, zmax: zmax || 1, total: volume(ig.sup, c.f, v), vol: c.event ? volume(ig.ev, c.f, v) : null, curve: null, same: IND && !PROD ? independent(c, v, B, IB) : null };
      if (S.dir && C.chart === 'marginal') {
        const lo = S.dir === 'x' ? B[0] : B[2], hi = S.dir === 'x' ? B[1] : B[3], pts = [];
        // the two ends are taken just inside, so the curve starts and ends at the density's own edge values
        for (let k = 0; k <= 160; k++) { const a = lo + (hi - lo) * (k === 0 ? 1e-6 : k === 160 ? 1 - 1e-6 : k / 160); pts.push([a, sliceArea(c, v, IB, S.dir, a, 700)]); }
        geo.curve = pts;
      }
      return geo;
    }

    function update(sliceOnly) {
      if (!S.geo || !sliceOnly) S.geo = build();
      const G = S.geo, c = G.c, v = G.v;
      if (cases) [...cases.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === S.k)));
      ctrl.querySelectorAll('label[data-p]').forEach(l => { l.hidden = !c.uses.includes(l.dataset.p); });   // only the sliders this case uses
      btns.querySelectorAll('.jd-dir').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.d === S.dir)));
      if (sl) {
        const lo = S.dir === 'x' ? G.B[0] : G.B[2], hi = S.dir === 'x' ? G.B[1] : G.B[3];
        if (S.a == null || S.a < lo || S.a > hi) S.a = Math.min(hi, Math.max(lo, S.a == null ? (lo + hi) / 2 : S.a));
        Object.assign(sl.r, { min: lo, max: hi, step: (hi - lo) / 400 }); sl.r.value = S.a;
        sl.t.textContent = 'Slice ' + S.dir + ' = a'; sl.o.textContent = fmt(S.a);
      }
      if (pt) {
        if (S.kAt !== S.k) { const at = c.at ? c.at.map(f => f(v)) : [(G.B[0] + G.B[1]) / 2, (G.B[2] + G.B[3]) / 2]; S.a = at[0]; S.b = at[1]; S.kAt = S.k; }
        [[pt[0], 0, 1, S.a], [pt[1], 2, 3, S.b]].forEach(([r, i, j, val]) => { Object.assign(r.r, { min: G.B[i], max: G.B[j], step: (G.B[j] - G.B[i]) / 400 }); r.r.value = val; r.o.textContent = fmt(val); });
      }
      // what the figure says, in words and numbers
      let html = '';
      if (PROD) {
        const q = S.q = jointProduct(c, v, G.B, G.IB, S.a, S.b), cy = q.fa > 1e-9 ? q.joint / q.fa : NaN, cx = q.fb > 1e-9 ? q.joint / q.fb : NaN;
        html = 'At the point (' + fmt(S.a) + ', ' + fmt(S.b) + ') the joint density is <b>' + fmt(q.joint) + '</b>. ' +
          'Orange slice: its area is f<sub>X</sub>(a) = ' + fmt(q.fa) + ', so the conditional density is f<sub>Y|X=a</sub>(b) = ' + fmt(q.joint) + ' ÷ ' + fmt(q.fa) + ' = ' + fmt(cy) +
          '. Marginal × conditional: ' + fmt(q.fa) + ' × ' + fmt(cy) + ' = <b>' + fmt(q.fa * cy) + '</b>, the joint density again. ' +
          'Purple slice: f<sub>Y</sub>(b) = ' + fmt(q.fb) + ' and f<sub>X|Y=b</sub>(a) = ' + fmt(cx) + ', and ' + fmt(q.fb) + ' × ' + fmt(cx) + ' = <b>' + fmt(q.fb * cx) + '</b> too.';
      } else if (IND) {
        const q = S.q = jointProduct(c, v, G.B, G.IB, S.a, S.b), eq = Math.abs(q.joint - q.product) <= 2e-3 * Math.max(1, q.joint);
        html = 'At the point (' + fmt(S.a) + ', ' + fmt(S.b) + '): the joint density is <b>' + fmt(q.joint) + '</b>. The slices have areas f<sub>X</sub>(a) = ' + fmt(q.fa) +
          ' and f<sub>Y</sub>(b) = ' + fmt(q.fb) + ', so the product is <b>' + fmt(q.product) + '</b>. ' +
          (G.same ? 'They are equal here, and at every other point too: X and Y are <b>independent</b>.'
            : eq ? 'They happen to be equal here, but not at every point (move a and b): X and Y are <b>not independent</b>.'
              : 'They differ, and one such point is enough: X and Y are <b>not independent</b>.');
      } else if (S.dir && C.chart) {
        const A = sliceArea(c, v, G.IB, S.dir, S.a, 2500), other = S.dir === 'x' ? 'Y' : 'X', me = S.dir.toUpperCase();
        v.a = S.a;
        const fm = S.dir === 'x' ? c.fx : c.fy, cm = S.dir === 'x' ? c.cx : c.cy;
        if (C.chart === 'marginal' && A <= 1e-9) {
          html = 'Slice at ' + S.dir + ' = ' + fmt(S.a) + ': it misses the support, so its area is <b>f<sub>' + me + '</sub>(' + fmt(S.a) + ') = 0</b>';
        } else if (C.chart === 'marginal') {
          html = 'Slice at ' + S.dir + ' = ' + fmt(S.a) + ': its area is <b>f<sub>' + me + '</sub>(' + fmt(S.a) + ') ≈ ' + fmt(A) + '</b>' +
            (fm ? ' · formula ' + esc(words(fm.text, C)) + ' = ' + fmt(fm.f(v)) : '');
        } else if (A <= 1e-9) {
          html = 'At ' + S.dir + ' = ' + fmt(S.a) + ' the slice is empty: ' + me + ' never takes this value, so there is no conditional density.';
        } else {
          html = 'The slice at ' + S.dir + ' = ' + fmt(S.a) + ' has area f<sub>' + me + '</sub>(' + fmt(S.a) + ') ≈ ' + fmt(A) + '. ' +
            'Divided by it, the slice becomes <b>f<sub>' + other + '|' + me + '=' + fmt(S.a) + '</sub></b>' + (cm ? ' = ' + esc(words(cm.text, C)) : '') + ', with area 1.';
        }
        S.A = A;
      } else if (G.vol != null) {
        const ex = c.exact ? c.exact(v) : null;
        html = esc(c.label || 'The probability') + ' = the volume of the green part ≈ <b>' + fmt(G.vol) + '</b>' +
          (ex == null ? '' : c.exactText.length > 28 ? ' · exact ' + fmt(ex) : ' · exact ' + esc(words(c.exactText, C)) + (/^\d+$/.test(c.exactText.trim()) ? '' : ' = ' + fmt(ex)));
      } else {
        html = 'Total volume under the density ≈ <b>' + fmt(G.total) + '</b>' + (c.exact ? ' · exact ' + esc(words(c.exactText, C)) : '') + ': a valid joint density.';
      }
      if (c.note) { v.a = S.a; v.b = S.b; html += ' ' + esc(c.note.map((t, i) => (i % 2 ? String(+t(v).toFixed(3)) : t)).join('')); }
      read.innerHTML = html;
      const evName = c.label ? esc((/^P\((.*)\)$/.exec(c.label) || [0, c.label])[1]) : 'the event';
      const items = [['acc', '<b>Blue</b>: the density f(x, y), standing on its support. Its whole volume is 1.']];
      if (c.event) items.push(['ev', '<b>Green</b>: the part of it over the event ' + evName + '. Its volume is ' + (c.label ? esc(c.label) : 'the probability') + '.']);
      if (IND) {
        items.push(['sl', '<b>Orange</b>: the slice at x = a. Its area is the marginal density f<sub>X</sub>(a).']);
        items.push(['pk', '<b>Purple</b>: the slice at y = b. Its area is the marginal density f<sub>Y</sub>(b).']);
        items.push(['ink k-dot', '<b>Dot</b>: the point (a, b). The height of the density there is the joint density f(a, b).']);
      } else if (S.dir && C.chart) {
        const me = S.dir.toUpperCase(), other = S.dir === 'x' ? 'Y' : 'X';
        if (C.chart === 'marginal') {
          items.push(['sl', '<b>Orange</b>: the slice at ' + S.dir + ' = a. Its area is the marginal density f<sub>' + me + '</sub>(a).']);
          items.push(['acc k-line', '<b>Chart, blue line</b>: f<sub>' + me + '</sub>, the area of every slice. The orange dot is the slice shown.']);
        } else {
          items.push(['sl', '<b>Orange</b>: the slice at ' + S.dir + ' = a. Divided by its area, it is the conditional density of ' + other + ' given ' + me + ' = a.']);
          items.push(['sl k-line', '<b>Chart, orange line</b>: that conditional density, f<sub>' + other + '|' + me + '=a</sub>. Its area is 1.']);
        }
      }
      key.innerHTML = items.map(([k, t]) => '<li><i class="k-' + k + '"></i><span>' + t + '</span></li>').join('');
      draw();
    }

    /* ---- drawing */
    const ctx = cv.getContext('2d'), ctx2 = cv2 ? cv2.getContext('2d') : null;
    function size(c) {
      const d = window.devicePixelRatio || 1, W = c.clientWidth, H = c.clientHeight;
      if (c.width !== Math.round(W * d) || c.height !== Math.round(H * d)) { c.width = Math.round(W * d); c.height = Math.round(H * d); }
      const g = c.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      return [W, H];
    }
    function draw() {
      if (!S.geo || !cv.isConnected) return;
      const G = S.geo, c = G.c, B = G.B, [W, H] = size(cv);
      const col = { acc: rgb(fig, '--accent', '70,85,212'), ev: rgb(fig, '--good', '31,138,76'), sl: rgb(fig, '--warn', '161,92,0'), ink: rgb(fig, '--ink-3', '120,120,120') };
      const L = Math.max(B[1] - B[0], B[3] - B[2]), mx = (B[0] + B[1]) / 2, my = (B[2] + B[3]) / 2;
      const pitch = S.top ? Math.PI / 2 : S.pitch, yaw = S.top ? 0 : S.yaw;   // the top view: straight down, x right, y up
      const cyw = Math.cos(yaw), syw = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      // x to the right, y away from the viewer, f upwards (seen from straight above: x right, y up, as in a 2D sketch).
      // The tallest point stands ZH floor-lengths high; the size is the same at every turn, so the picture does not swell.
      const ZH = 0.62, zs = ZH / G.zmax;
      const R = Math.hypot(B[1] - B[0], B[3] - B[2]) / L / 2 + 0.2;
      const sc = Math.min((W / 2 - 8) / R, (H / 2 - 10) / (R * sp + (ZH / 2 + 0.07) * cp));
      const P = (x, y, z) => {
        const X = (x - mx) / L, Y = (y - my) / L, Z = z * zs - ZH / 2;
        return [W / 2 + (X * cyw + Y * syw) * sc, H / 2 + ((X * syw - Y * cyw) * sp - Z * cp) * sc];
      };
      const toward = (x, y) => (x - mx) * syw - (y - my) * cyw;     // larger: nearer the viewer
      const fill = (polys, rgbS, alpha) => {
        if (!polys.length) return;
        ctx.beginPath();
        for (const q of polys) { q.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
        ctx.fillStyle = 'rgba(' + rgbS + ',' + alpha + ')'; ctx.fill('nonzero');
      };
      const strokeEdges = (polys, rgbS, alpha, lw, z0) => {
        ctx.beginPath();
        for (const p of polys) for (let k = 0; k < p.length; k++) {
          if (!p[k].b) continue;
          const A = p[k], Bq = p[(k + 1) % p.length], a1 = P(A.x, A.y, z0 ? 0 : A.z), b1 = P(Bq.x, Bq.y, z0 ? 0 : Bq.z);
          ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]);
        }
        ctx.strokeStyle = 'rgba(' + rgbS + ',' + alpha + ')'; ctx.lineWidth = lw; ctx.stroke();
      };
      // walls (the boundary edges, from the floor up to the density), split by the side they face, and the tops.
      // The polygons run anticlockwise, so an edge's outward side is on its right.
      const parts = polys => {
        const back = [], front = [], up = [], floor = [];
        for (const p of polys) {
          up.push(p.map(q => P(q.x, q.y, q.z))); floor.push(p.map(q => P(q.x, q.y, 0)));
          for (let k = 0; k < p.length; k++) {
            if (!p[k].b) continue;
            const A = p[k], Bq = p[(k + 1) % p.length];
            const w = [P(A.x, A.y, 0), P(Bq.x, Bq.y, 0), P(Bq.x, Bq.y, Bq.z), P(A.x, A.y, A.z)];
            ((Bq.y - A.y) * syw + (Bq.x - A.x) * cyw > 0 ? front : back).push(w);
          }
        }
        return { back, front, up, floor };
      };
      const sP = parts(G.sup), eP = parts(G.ev);
      // the floor: grid and axes
      ctx.lineWidth = 1;
      const tick = (lo, hi) => { const span = hi - lo, st = span <= 1.5 ? 0.5 : span <= 4.5 ? 1 : 2, out = []; for (let t = Math.ceil(lo / st - 1e-9) * st; t <= hi + 1e-9; t += st) out.push(+t.toFixed(6)); return out; };
      ctx.beginPath();
      for (const t of tick(B[0], B[1])) { const a = P(t, B[2], 0), b = P(t, B[3], 0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      for (const t of tick(B[2], B[3])) { const a = P(B[0], t, 0), b = P(B[1], t, 0); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); }
      ctx.strokeStyle = 'rgba(' + col.ink + ',0.18)'; ctx.stroke();
      fill(sP.floor, col.acc, 0.07); fill(eP.floor, col.ev, 0.16);
      // the solid, back to front
      fill(sP.back, col.acc, 0.1); fill(eP.back, col.ev, 0.3);
      fill(sP.up, col.acc, 0.17); fill(eP.up, col.ev, 0.48);
      // a faint mesh on the top shows its slope
      if (!S.top) {
        ctx.beginPath();
        for (const p of G.sup) { p.forEach((q, i) => { const s = P(q.x, q.y, q.z); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath(); }
        // a curved or sloping top needs its mesh to be seen; a flat one does not
        const curved = G.sup.some(p => p.some(q => Math.abs(q.z - G.sup[0][0].z) > 1e-9));
        ctx.strokeStyle = 'rgba(' + col.acc + (curved ? ',0.34)' : ',0.09)'); ctx.lineWidth = curved ? 0.7 : 0.5; ctx.stroke();
      }
      fill(sP.front, col.acc, 0.1); fill(eP.front, col.ev, 0.3);
      strokeEdges(G.sup, col.acc, 0.9, 1.3); strokeEdges(G.sup, col.acc, 0.45, 1, true);
      if (G.ev.length) { strokeEdges(G.ev, col.ev, 1, 1.8); strokeEdges(G.ev, col.ev, 0.7, 1.2, true); }
      // a slice: a curtain from the floor up to the density, at x = a (dir "x") or y = a
      const curtain = (dir, a, rgbS) => {
        const v = G.v, lo = dir === 'x' ? B[2] : B[0], hi = dir === 'x' ? B[3] : B[1], m = 240, runs = [];
        let cur = null;
        for (let k = 0; k <= m; k++) {
          const t = lo + (hi - lo) * k / m;
          if (dir === 'x') { v.x = a; v.y = t; } else { v.x = t; v.y = a; }
          if (inside(c.support, v)) { (cur = cur || []).push([v.x, v.y, c.f(v)]); } else if (cur) { runs.push(cur); cur = null; }
        }
        if (cur) runs.push(cur);
        ctx.beginPath();
        for (const r of runs) {
          const f0 = P(r[0][0], r[0][1], 0); ctx.moveTo(f0[0], f0[1]);
          r.forEach(q => { const s = P(q[0], q[1], q[2]); ctx.lineTo(s[0], s[1]); });
          const l0 = P(r[r.length - 1][0], r[r.length - 1][1], 0); ctx.lineTo(l0[0], l0[1]); ctx.closePath();
        }
        ctx.fillStyle = 'rgba(' + rgbS + ',0.5)'; ctx.fill();
        ctx.beginPath();
        for (const r of runs) r.forEach((q, i) => { const s = P(q[0], q[1], q[2]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); });
        ctx.strokeStyle = 'rgb(' + rgbS + ')'; ctx.lineWidth = 2.2; ctx.stroke();
        // the line of the slice on the floor, across the whole box
        const a1 = dir === 'x' ? P(a, B[2], 0) : P(B[0], a, 0), b1 = dir === 'x' ? P(a, B[3], 0) : P(B[1], a, 0);
        ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]);
        ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(' + rgbS + ',0.9)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.setLineDash([]);
      };
      if (IND) {
        // the further slice first; then the point (a, b): a pole from the floor up to the density there
        const pk = rgb(fig, '--pick', '123,79,214'), order = toward(S.a, my) < toward(mx, S.b) ? ['x', 'y'] : ['y', 'x'];
        order.forEach(dir => (dir === 'x' ? curtain('x', S.a, col.sl) : curtain('y', S.b, pk)));
        const z = S.q ? S.q.joint : 0, f0 = P(S.a, S.b, 0), f1 = P(S.a, S.b, z);
        ctx.strokeStyle = 'rgb(' + col.ink + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(f0[0], f0[1]); ctx.lineTo(f1[0], f1[1]); ctx.stroke();
        ctx.fillStyle = 'rgb(' + col.ink + ')'; ctx.beginPath(); ctx.arc(f1[0], f1[1], 4.5, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.arc(f0[0], f0[1], 2.5, 0, 7); ctx.fill();
      } else if (S.dir && C.chart) curtain(S.dir, S.a, col.sl);
      // the floor's outline; the numbers run along its two edges nearest the viewer, clear of the solid; the height
      // scale stands at the corner furthest to the left
      const corners = [[B[0], B[2]], [B[1], B[2]], [B[1], B[3]], [B[0], B[3]]].map(q => ({ q, s: P(q[0], q[1], 0) }));
      ctx.beginPath(); corners.forEach((k, i) => (i ? ctx.lineTo(k.s[0], k.s[1]) : ctx.moveTo(k.s[0], k.s[1]))); ctx.closePath();
      ctx.strokeStyle = 'rgba(' + col.ink + ',0.5)'; ctx.lineWidth = 1; ctx.stroke();
      const font = getComputedStyle(fig).fontFamily;
      ctx.fillStyle = 'rgb(' + col.ink + ')'; ctx.font = '12px ' + font; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const lab = (txt, p) => ctx.fillText(txt, p[0], p[1]);
      const n = t => String(+t.toFixed(3));
      const yE = toward(mx, B[2]) >= toward(mx, B[3]) ? B[2] : B[3], yOut = yE === B[2] ? -1 : 1;
      const xE = toward(B[0], my) >= toward(B[1], my) ? B[0] : B[1], xOut = xE === B[0] ? -1 : 1;
      ctx.strokeStyle = 'rgba(' + col.ink + ',0.95)'; ctx.lineWidth = 1.3; ctx.beginPath();
      let q1 = P(B[0], yE, 0), q2 = P(B[1], yE, 0); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]);
      q1 = P(xE, B[2], 0); q2 = P(xE, B[3], 0); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]);
      for (const t of tick(B[0], B[1])) { q1 = P(t, yE, 0); q2 = P(t, yE + yOut * 0.028 * L, 0); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); }
      for (const t of tick(B[2], B[3])) { q1 = P(xE, t, 0); q2 = P(xE + xOut * 0.028 * L, t, 0); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); }
      ctx.stroke();
      for (const t of tick(B[0], B[1])) lab(n(t), P(t, yE + yOut * 0.085 * L, 0));
      for (const t of tick(B[2], B[3])) lab(n(t), P(xE + xOut * 0.085 * L, t, 0));
      ctx.font = 'italic 13px ' + font;
      lab('x', P(mx + 0.25 * (B[1] - B[0]), yE + yOut * 0.18 * L, 0)); lab('y', P(xE + xOut * 0.18 * L, my + 0.25 * (B[3] - B[2]), 0));
      if (!S.top) {
        const zc = corners.reduce((a, k) => (k.s[0] < a.s[0] ? k : a)), top = P(zc.q[0], zc.q[1], G.zmax), end = P(zc.q[0], zc.q[1], G.zmax * 1.1);
        ctx.strokeStyle = 'rgba(' + col.ink + ',0.9)'; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(zc.s[0], zc.s[1]); ctx.lineTo(end[0], end[1]); ctx.moveTo(top[0] - 4, top[1]); ctx.lineTo(top[0] + 4, top[1]); ctx.stroke();
        ctx.textAlign = 'right'; lab('f(x, y)', [end[0] + 5, end[1] - 11]);
        ctx.font = '12px ' + font; ctx.textAlign = 'right'; lab(n(G.zmax), [top[0] - 8, top[1]]);
        ctx.beginPath();
        for (const t of tick(0, G.zmax).filter(t => t > 0 && t < G.zmax * 0.8)) {
          const q = P(zc.q[0], zc.q[1], t); ctx.moveTo(q[0] - 3, q[1]); ctx.lineTo(q[0] + 3, q[1]); lab(n(t), [q[0] - 8, q[1]]);
        }
        ctx.stroke();
      }
      tv.textContent = S.top ? '3D view' : 'Top view';
      tv.setAttribute('aria-pressed', String(S.top));
      if (cv2) chart();
    }

    // the 2D chart: the marginal (each slice's area, the current one marked) or the conditional (the slice ÷ its area)
    function chart() {
      const G = S.geo, c = G.c, v = G.v, B = G.B, [W, H] = size(cv2), g = ctx2;
      const col = { acc: rgb(fig, '--accent', '70,85,212'), sl: rgb(fig, '--warn', '161,92,0'), ink: rgb(fig, '--ink-3', '120,120,120') };
      let pts, xlo, xhi, name, mark = null;
      if (C.chart === 'marginal') {
        pts = G.curve; xlo = S.dir === 'x' ? B[0] : B[2]; xhi = S.dir === 'x' ? B[1] : B[3];
        name = 'f' + (S.dir === 'x' ? 'X' : 'Y') + '(' + S.dir + '): the area of each slice';
        mark = [S.a, S.A || 0];
      } else {
        xlo = S.dir === 'x' ? B[2] : B[0]; xhi = S.dir === 'x' ? B[3] : B[1]; pts = [];
        const A = S.A || 0;
        for (let k = 0; k <= 300; k++) {
          const t = xlo + (xhi - xlo) * (k === 0 ? 1e-6 : k === 300 ? 1 - 1e-6 : k / 300);
          if (S.dir === 'x') { v.x = S.a; v.y = t; } else { v.x = t; v.y = S.a; }
          pts.push([t, A > 1e-9 && inside(c.support, v) ? c.f(v) / A : 0]);
        }
        name = 'f(' + (S.dir === 'x' ? 'y | x' : 'x | y') + ' = ' + fmt(S.a) + '): the slice ÷ its area';
      }
      let ymax = 0; pts.forEach(p => { if (p[1] > ymax) ymax = p[1]; });
      if (C.chart === 'marginal' && mark[1] > ymax) ymax = mark[1];
      ymax = ymax > 0 ? ymax * 1.18 : 1;
      const l = 40, r = 12, t = 22, b = 22;
      const X = x => l + (x - xlo) / (xhi - xlo) * (W - l - r), Y = y => H - b - y / ymax * (H - t - b);
      g.strokeStyle = 'rgba(' + col.ink + ',0.6)'; g.lineWidth = 1;
      g.beginPath(); g.moveTo(l, t - 6); g.lineTo(l, H - b); g.lineTo(W - r, H - b); g.stroke();
      g.beginPath(); g.moveTo(X(pts[0][0]), Y(0));
      pts.forEach(p => g.lineTo(X(p[0]), Y(p[1])));
      g.lineTo(X(pts[pts.length - 1][0]), Y(0)); g.closePath();
      const tint = C.chart === 'marginal' ? col.acc : col.sl;
      g.fillStyle = 'rgba(' + tint + ',0.16)'; g.fill();
      g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))));
      g.strokeStyle = 'rgb(' + tint + ')'; g.lineWidth = 2; g.stroke();
      if (mark) {
        g.beginPath(); g.moveTo(X(mark[0]), Y(0)); g.lineTo(X(mark[0]), Y(mark[1]));
        g.setLineDash([4, 4]); g.strokeStyle = 'rgb(' + col.sl + ')'; g.lineWidth = 1.2; g.stroke(); g.setLineDash([]);
        g.beginPath(); g.arc(X(mark[0]), Y(mark[1]), 4.5, 0, 7); g.fillStyle = 'rgb(' + col.sl + ')'; g.fill();
      }
      g.fillStyle = 'rgb(' + col.ink + ')'; g.font = '12px ' + getComputedStyle(fig).fontFamily;
      g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.fillText(name, l + 4, 14);
      g.textAlign = 'center'; g.textBaseline = 'top';
      const span = xhi - xlo, st = span <= 1.5 ? 0.5 : span <= 4.5 ? 1 : 2;
      for (let x = Math.ceil(xlo / st - 1e-9) * st; x <= xhi + 1e-9; x += st) g.fillText(String(+x.toFixed(3)), X(x), H - b + 5);
      g.textAlign = 'right'; g.textBaseline = 'middle';
      const top = ymax / 1.18;
      g.fillText(String(+top.toFixed(3)), l - 6, Y(top));
      g.beginPath(); g.moveTo(l - 3, Y(top)); g.lineTo(l, Y(top)); g.stroke();
      g.fillText('0', l - 6, Y(0));
    }

    /* ---- turning it */
    let drag = null;
    cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, touch: e.pointerType === 'touch' }; if (!drag.touch) cv.setPointerCapture(e.pointerId); cv.classList.add('on'); });
    cv.addEventListener('pointermove', e => {
      if (!drag) return;
      S.yaw -= (e.clientX - drag.x) * 0.01;
      if (!drag.touch) S.pitch = Math.max(0.12, Math.min(1.45, S.pitch + (e.clientY - drag.y) * 0.01));
      drag.x = e.clientX; drag.y = e.clientY; S.top = false; draw();
    });
    const stop = () => { drag = null; cv.classList.remove('on'); };
    cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop); cv.addEventListener('pointerleave', () => { if (drag && !drag.touch) return; stop(); });
    cv.addEventListener('keydown', e => {
      const k = { ArrowLeft: [0.12, 0], ArrowRight: [-0.12, 0], ArrowUp: [0, 0.08], ArrowDown: [0, -0.08] }[e.key];
      if (!k) return;
      e.preventDefault(); S.yaw += k[0]; S.pitch = Math.max(0.12, Math.min(1.45, S.pitch + k[1])); S.top = false; draw();
    });
    if (window.ResizeObserver) new ResizeObserver(() => draw()).observe(fig);
    new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => draw());
    // the page gets every figure's frame at once (so nothing moves later); each is worked out when it comes near the screen
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); update(); } }, { rootMargin: '600px 0px' });
      io.observe(fig);
    } else update();
  };

  /* ---------------------------------------------------------------- a ```live figure on the page */
  const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
  // a value as the page would write it: 0.278, 12, 5.61 × 10⁻⁶
  const fmtv = x => {
    if (!isFinite(x)) return '—';
    if (x === 0 || Math.abs(x) >= 0.001) return String(+x.toFixed(Math.abs(x) >= 100 ? 1 : Math.abs(x) >= 1 ? 3 : 4));
    const e = Math.floor(Math.log10(Math.abs(x))), m = x / Math.pow(10, e);
    return (+m.toFixed(2)) + ' × 10' + String(e).split('').map(ch => SUP[ch]).join('');
  };
  function niceTicks(lo, hi, want) {
    const raw = (hi - lo) / (want || 6), p = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(s => s >= raw - 1e-12) || 10 * p, out = [];
    for (let t = Math.ceil(lo / step - 1e-9) * step; t <= hi + step * 1e-9; t += step) out.push(+t.toFixed(10));
    return out;
  }
  const LIVE_COL = ['--ink-3', '--accent', '--y', '--z', '--pick'], LIVE_FB = ['120,120,128', '70,85,212', '224,112,28', '19,145,127', '123,79,214'];

  function liveMount(fig) {
    let C;
    try { C = livePrep(liveParse(fig.getAttribute('data-live') || '')); } catch (e) { fig.prepend(h('p', 'small', 'This figure could not be drawn: ' + e.message)); return; }
    const vals = {}; C.params.forEach(p => { vals[p.name] = p.v; });
    const S = { k: 0, seed: 1, st: null };
    const cap = fig.querySelector('figcaption');
    const cases = C.cases.length > 1 ? h('div', 'jd-cases') : null;
    const cv = h('canvas', 'jd-plot');
    cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', fig.getAttribute('aria-label') || 'A chart');
    const key = h('ul', 'jd-key'), read = h('div', 'jd-read'), ctrl = h('div', 'jd-ctrl');
    read.setAttribute('aria-live', 'polite');
    [cases, cv, key, read, ctrl].filter(Boolean).forEach(k => fig.insertBefore(k, cap || null));
    if (cases) C.cases.forEach((c, i) => {
      const b = h('button', null, c.name); b.type = 'button';
      b.addEventListener('click', () => { S.k = i; update(); });
      cases.append(b);
    });
    const show = (p, x) => (p.int ? String(Math.round(x)) : String(+x.toFixed(3)));
    C.params.forEach(p => {
      const l = h('label'), t = h('span', null, p.label), r = h('input'), o = h('output', null, show(p, p.v));
      Object.assign(r, { type: 'range', min: p.lo, max: p.hi, step: p.int ? 1 : p.step || (p.hi - p.lo) / 200, value: p.v });
      r.addEventListener('input', () => { vals[p.name] = p.int ? Math.round(+r.value) : +r.value; o.textContent = show(p, vals[p.name]); update(); });
      l.append(t, r, o); l.dataset.p = p.name; ctrl.append(l);
    });
    const again = C.cases.some(c => c.sample) ? h('button', 'jd-again', 'New sample') : null;
    if (again) {
      again.type = 'button';
      again.addEventListener('click', () => { S.seed++; update(); });
      const row = h('div', 'jd-btns'); row.append(again, h('span', 'jd-hint', 'Every press draws fresh random values')); ctrl.append(row);
    }

    function update() {
      const st = S.st = liveState(C, S.k, vals, S.seed), c = st.c, v = st.v;
      if (cases) [...cases.children].forEach((b, i) => b.setAttribute('aria-pressed', String(i === S.k)));
      if (again) again.parentElement.hidden = !c.sample;
      ctrl.querySelectorAll('label').forEach(l => { l.hidden = !c.uses.includes(l.dataset.p); });   // only the sliders this case uses
      const items = [];
      for (const s of c.series) {
        const shape = ['curve', 'vline', 'hline'].includes(s.k) ? ' k-line' + (s.dashed ? ' k-dash' : '') : s.k === 'dots' || s.k === 'point' ? ' k-dot' : '';
        if (s.label) items.push('<li><i class="k-c' + s.color + shape + '"></i><span>' + esc(liveText(s.label, v, fmtv)) + '</span></li>');
        if (['bars', 'spikes', 'sumdist'].includes(s.k) && s.hi && s.hilabel) items.push('<li><i class="k-c' + s.hicolor + '"></i><span>' + esc(liveText(s.hilabel, v, fmtv)) + '</span></li>');
      }
      key.innerHTML = items.join(''); key.hidden = !items.length;
      cv.classList.toggle('flat', c.series.every(s => s.k === 'dots' || s.k === 'vline'));   // only dots on a line: a low picture
      // "text = value"; a text that ends with a colon is followed by the value alone
      read.innerHTML = c.reads.map(r => { const t = liveText(r.text, v, fmtv); return '<p>' + esc(t) + (r.f ? (/:$/.test(t) ? ' ' : ' = ') + '<b>' + (r.pct ? fmtv(100 * r.f(v)) + '%' : fmtv(r.f(v))) + '</b>' : '') + '</p>'; }).join('');
      draw();
    }

    function draw() {
      if (!S.st || !cv.isConnected) return;
      const { c, v, data, xr } = S.st, d = window.devicePixelRatio || 1, W = cv.clientWidth, H = cv.clientHeight;
      curData = data;
      if (cv.width !== Math.round(W * d) || cv.height !== Math.round(H * d)) { cv.width = Math.round(W * d); cv.height = Math.round(H * d); }
      const g = cv.getContext('2d');
      g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, W, H);
      const col = LIVE_COL.map((name, i) => rgb(fig, name, LIVE_FB[i])), ink = col[0], font = getComputedStyle(fig).fontFamily;
      const [x0, x1] = xr;
      // what to draw, and how high it goes
      let ylo = 0, yhi = 0;
      const see = y => { if (isFinite(y)) { if (y > yhi) yhi = y; if (y < ylo) ylo = y; } };
      const marks = [];
      for (const s of c.series) {
        if (s.k === 'curve' || s.k === 'area') {
          const a = s.a ? Math.max(x0, s.a(v)) : x0, b = s.b ? Math.min(x1, s.b(v)) : x1, pts = [];
          if (b > a) for (let i = 0; i <= 320; i++) { v.x = a + (b - a) * i / 320; const y = s.f(v); pts.push([v.x, y]); see(y); }
          marks.push({ s, pts });
        } else if (s.k === 'bars') {
          const b = Math.round(s.b(v)), bars = [];
          for (let k = Math.round(s.a(v)); k <= b; k++) { v.k = k; const y = s.f(v); bars.push({ x: s.at ? s.at(v) : k, y, hi: s.hi ? inside(s.hi, v) : false }); see(y); }
          marks.push({ s, bars, w: s.width ? s.width(v) : (bars.length > 1 ? Math.abs(bars[1].x - bars[0].x) : 1) * 0.84 });
        } else if (s.k === 'sumdist') {
          s.out.bars.forEach(q => see(q.y));
          marks.push({ s, bars: s.out.bars, w: s.out.w * (s.out.bars.length > 60 ? 1 : 0.84) });
        } else if (s.k === 'spikes') {
          const bars = s.base.map(([fv, fp]) => { v.x = fv(v); const x = v.x; return { x, y: fp(v), hi: s.hi ? inside(s.hi, v) : false }; }).sort((p, q) => p.x - q.x);
          let gap = Infinity; for (let i = 1; i < bars.length; i++) if (bars[i].x - bars[i - 1].x > 1e-9) gap = Math.min(gap, bars[i].x - bars[i - 1].x);
          bars.forEach(q => see(q.y));
          marks.push({ s, bars, w: Math.min(isFinite(gap) ? gap * 0.5 : 1, (x1 - x0) / 14) });
        } else if (s.k === 'pmf' && data) {
          const m = new Map(); data.forEach(q => { const t = +q.toFixed(9); m.set(t, (m.get(t) || 0) + 1); });
          const bars = [...m.entries()].sort((p, q) => p[0] - q[0]).map(([x, n]) => ({ x, y: n / data.length }));
          let gap = Infinity; for (let i = 1; i < bars.length; i++) gap = Math.min(gap, bars[i].x - bars[i - 1].x);
          bars.forEach(q => see(q.y));
          marks.push({ s, bars, w: (isFinite(gap) ? gap : 1) * 0.5, top: true });
        } else if (s.k === 'hist' && data) {
          const n = Math.max(1, Math.round(s.bins(v))), a = s.a(v), bw = (s.b(v) - a) / n, cnt = new Array(n).fill(0);
          data.forEach(q => { const i = Math.floor((q - a) / bw); if (i >= 0 && i < n) cnt[i]++; });
          const bars = cnt.map((q, i) => ({ x: a + (i + 0.5) * bw, y: q / (data.length * bw) }));
          bars.forEach(q => see(q.y));
          marks.push({ s, bars, w: bw * 0.96 });
        } else { if (s.k === 'hline' || s.k === 'point') see(s.f(v)); marks.push({ s }); }
      }
      const flat = yhi === 0 && ylo === 0;         // only the data on a line: no height scale
      if (c.y) { ylo = c.y[0](v); yhi = c.y[1](v); } else { yhi = yhi > 0 ? yhi * 1.14 : ylo < 0 ? 0 : 1; ylo = ylo < 0 ? ylo * 1.14 : 0; }
      const l = flat ? 16 : 46, r = 14, t = 14, b = c.xlabel ? 44 : 28;
      const X = x => l + (x - x0) / (x1 - x0) * (W - l - r), Y = y => H - b - (y - ylo) / (yhi - ylo) * (H - t - b), base = Y(Math.max(ylo, Math.min(yhi, 0)));
      const axisY = ylo <= 0 && yhi >= 0 ? base : H - b;      // 0 not among the heights shown (a log-likelihood): the axis is the bottom edge
      // the frame: light lines across at the height numbers, the x axis with its numbers
      g.font = '12px ' + font; g.lineWidth = 1;
      if (!flat) {
        g.textAlign = 'right'; g.textBaseline = 'middle';
        for (const q of niceTicks(ylo, yhi, 4)) {
          g.strokeStyle = 'rgba(' + ink + ',0.16)'; g.beginPath(); g.moveTo(l, Y(q)); g.lineTo(W - r, Y(q)); g.stroke();
          g.fillStyle = 'rgb(' + ink + ')'; g.fillText(fmtv(q), l - 6, Y(q));
        }
        if (c.ylabel) { g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(c.ylabel, l + 4, 0); }
      }
      g.strokeStyle = 'rgba(' + ink + ',0.75)'; g.beginPath(); g.moveTo(l, axisY); g.lineTo(W - r, axisY); if (!flat) { g.moveTo(l, t - 4); g.lineTo(l, H - b); } g.stroke();
      g.fillStyle = 'rgb(' + ink + ')'; g.textAlign = 'center'; g.textBaseline = 'top';
      for (const q of niceTicks(x0, x1, W < 380 ? 5 : 7)) { g.beginPath(); g.moveTo(X(q), H - b); g.lineTo(X(q), H - b + 4); g.stroke(); g.fillText(fmtv(q), X(q), H - b + 7); }
      if (c.xlabel) g.fillText(c.xlabel, l + (W - l - r) / 2, H - 16);
      g.save(); g.beginPath(); g.rect(l - 1, 0, W - l - r + 2, H - b + 1); g.clip();
      const bar = (q, w, rgbS, alpha) => { const xa = X(q.x - w / 2), xb = X(q.x + w / 2), ya = Y(q.y); g.fillStyle = 'rgba(' + rgbS + ',' + alpha + ')'; g.fillRect(xa, Math.min(ya, base), Math.max(1, xb - xa), Math.abs(base - ya)); };
      for (const m of marks) {
        const s = m.s, rgbS = col[s.color] || col[1];
        if (s.k === 'area' && m.pts.length) {
          g.beginPath(); g.moveTo(X(m.pts[0][0]), base);
          m.pts.forEach(q => g.lineTo(X(q[0]), Y(isFinite(q[1]) ? q[1] : 0)));
          g.lineTo(X(m.pts[m.pts.length - 1][0]), base); g.closePath(); g.fillStyle = 'rgba(' + rgbS + ',0.42)'; g.fill();
        } else if (m.bars) {
          m.bars.forEach(q => bar(q, m.w, q.hi ? col[s.hicolor] : rgbS, s.k === 'hist' ? 0.35 : 0.78));
        }
      }
      for (const m of marks) {
        const s = m.s, rgbS = col[s.color] || col[1];
        g.strokeStyle = 'rgb(' + rgbS + ')'; g.fillStyle = 'rgb(' + rgbS + ')'; g.lineWidth = s.thin ? 1.2 : 2.2; g.setLineDash(s.dashed ? [5, 4] : []);
        if (s.k === 'curve') {
          g.beginPath(); let pen = false;
          for (const q of m.pts) { if (!isFinite(q[1])) { pen = false; continue; } const px = X(q[0]), py = Math.max(-50, Math.min(H + 50, Y(q[1]))); pen ? g.lineTo(px, py) : g.moveTo(px, py); pen = true; }
          g.stroke();
        } else if (s.k === 'vline' || s.k === 'hline') {
          const q = s.f(v);
          g.lineWidth = 1.6; if (s.k === 'vline') g.setLineDash(s.dashed === false ? [] : [5, 4]);
          g.beginPath(); if (s.k === 'vline') { g.moveTo(X(q), t - 4); g.lineTo(X(q), H - b); } else { g.moveTo(l, Y(q)); g.lineTo(W - r, Y(q)); } g.stroke();
        } else if (s.k === 'point') {
          v.x = 0; g.setLineDash([]); g.beginPath(); g.arc(X(s.fx(v)), Y(s.f(v)), 5, 0, 7); g.fill();
        } else if (s.k === 'dots' && data) {
          // the data on the axis: equal values in a stack, the stacks made smaller when they would not fit
          const m2 = new Map(); data.forEach(q => { const u = +q.toFixed(9); m2.set(u, (m2.get(u) || 0) + 1); });
          const tall = Math.max(...m2.values()), rad = Math.max(1.5, Math.min(5, (axisY - t - 6) / (2 * tall)));
          g.setLineDash([]);
          for (const [x, n] of m2) for (let i = 0; i < n; i++) { g.beginPath(); g.arc(X(x), axisY - rad - 1 - i * 2 * rad, rad * 0.86, 0, 7); g.fill(); }
        }
      }
      g.restore(); g.setLineDash([]);
    }

    if (window.ResizeObserver) new ResizeObserver(() => draw()).observe(fig);
    new MutationObserver(() => draw()).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    if (window.matchMedia) window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => draw());
    if (window.IntersectionObserver) {
      const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); update(); } }, { rootMargin: '600px 0px' });
      io.observe(fig);
    } else update();
  }
})(typeof window !== 'undefined' ? window : this);
