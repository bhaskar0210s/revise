/* Playground lab — Statistics I, Week 10 (L10.1–L10.6): expectation and variance.   id 'lab-s1-expect'
   X from K.distPicker (uniform, Bernoulli, binomial, geometric, Poisson, or a typed PMF).
   Panels: answer · balance point (move the pivot c) · the table x | p | xp | x²p | (x−μ)²p with column sums ·
   how E, E[X²], Var (two ways) and SD are computed · E[g(X)] vs g(E[X]) · Y = aX + b from Y's own table ·
   X + W for an independent W (Var adds) · Bernoulli and discrete-uniform formulas checked · long-run average.
   Rules: LABS.md. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const Fr = Lab.Frac;
  const STORE = 'lab:lab-s1-expect';
  const tex = s => Lab.tex(s);
  const esc = s => Lab.esc(String(s));
  const clone = o => JSON.parse(JSON.stringify(o));
  const fmtInt = n => Math.round(n).toLocaleString('en-US');

  /* ------------------------------------------------------- numbers: exact fractions when possible */
  const ex = v => v instanceof Fr && !v.approx;
  const fin = v => (v instanceof Fr && v.approx ? Number(v) : v);
  function toQ(v) {
    if (v instanceof Fr) return v.approx ? Number(v) : v;
    if (typeof v !== 'number' || !Number.isFinite(v)) return v;
    if (Number.isInteger(v)) return Number.isSafeInteger(v) ? F(v) : v;
    const f = Fr.fromDecimal(v);
    return f.approx ? v : f;
  }
  const add = (a, b) => (ex(a) && ex(b) ? fin(a.add(b)) : Number(a) + Number(b));
  const sub = (a, b) => (ex(a) && ex(b) ? fin(a.sub(b)) : Number(a) - Number(b));
  const mul = (a, b) => (ex(a) && ex(b) ? fin(a.mul(b)) : Number(a) * Number(b));
  const div = (a, b) => (ex(a) && ex(b) ? fin(a.div(b)) : Number(a) / Number(b));
  const sq = v => mul(v, v);
  const sum = arr => arr.reduce((s, v) => add(s, v), F(0));
  const isZero = v => (ex(v) ? v.isZero() : Math.abs(Number(v)) < 1e-12);
  const same = (a, b) => (ex(a) && ex(b) ? a.eq(b) : Math.abs(Number(a) - Number(b)) <= 1e-9 * Math.max(1, Math.abs(Number(a)), Math.abs(Number(b))));
  const dec = (v, dp = 4) => Lab.fmtDec(Number(v), dp);
  const shortDec = v => Math.abs(Number(dec(v)) - Number(v)) < 1e-12;
  function sci(x, sig = 4) { const [m, e] = Number(x).toExponential(sig - 1).split('e'); return m.replace(/\.?0+$/, '') + '\\times 10^{' + Number(e) + '}'; }
  /** A decimal as TeX that stays honest for tiny values (scientific) and values just below 1. */
  function decStr(x, dp = 4) {
    x = Number(x);
    if (x === 0 || Math.abs(x) < 1e-15) return '0';
    const a = Math.abs(x);
    if (a < 0.001) return sci(x);
    if (a < 1 && 1 - a < Math.pow(10, -dp)) return (x < 0 ? '-' : '') + '(1-' + sci(1 - a, 3) + ')';
    return Lab.fmtDec(x, dp);
  }
  /** TeX of a number: the exact fraction when there is one, else a decimal. */
  const tx = v => (ex(v) ? (v.d === 1 ? String(v.n) : v.tex()) : decStr(v));
  /** "=0.25" / "\approx 0.3333" after an exact non-whole fraction; empty otherwise. */
  const decTail = v => (ex(v) && v.d !== 1 ? (shortDec(v) ? '=' : '\\approx ') + decStr(v) : '');
  /** "=7/2=3.5", "\approx 1.7078": a value with the right sign in front. */
  const eqv = v => (ex(v) ? '=' + tx(v) + decTail(v) : (shortDec(v) ? '=' : '\\approx ') + decStr(v));
  const par = v => (Number(v) < 0 ? '\\left(' + tx(v) + '\\right)' : tx(v));
  /** A number used as the base of a power: brackets unless it is a whole number ≥ 0. */
  const pb = v => (ex(v) && v.d === 1 && v.n >= 0 ? tx(v) : '\\left(' + tx(v) + '\\right)');
  const vp = v => (ex(v) ? v.toString() : Lab.fmtDec(Number(v), 4)).replace(/^-/, '−');
  function sqrtQ(v) {
    if (ex(v) && v.n >= 0) { const a = Math.round(Math.sqrt(v.n)), b = Math.round(Math.sqrt(v.d)); if (a * a === v.n && b * b === v.d) return F(a, b); }
    return Math.sqrt(Math.max(0, Number(v)));
  }
  /** "\sqrt{35/12}\approx 1.7078" or "\sqrt{1089}=33". */
  const sdTex = v => { const s = sqrtQ(v); return (ex(v) ? '\\sqrt{' + tx(v) + '}' : '\\sqrt{' + decStr(v) + '}') + eqv(s); };
  function niceStep(x) {
    const p = Math.pow(10, Math.floor(Math.log10(x)));
    const m = x / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  const subst = (src, vars) => String(src).replace(/[A-Za-z_][A-Za-z_0-9]*/g, w => (Object.prototype.hasOwnProperty.call(vars, w) ? (Number(vars[w]) < 0 || !Number.isInteger(Number(vars[w])) ? '(' + vp(vars[w]).replace('−', '-') + ')' : vp(vars[w])) : w));

  /* ------------------------------------------------------------------------- small views */
  function table(head, rows, opts = {}) {
    const wrap = h('div', { class: 'tbl-wrap s6-tblw' + (opts.scroll ? ' s6-scrolly' : '') });
    const t = h('table', { class: 'tbl s6-tbl' });
    t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach((r, i) => tb.appendChild(h('tr', { class: r.cls || (opts.hl && opts.hl(i) ? 'hl-row' : null) }, (r.cells || r).map(c => h('td', { html: c })))));
    t.appendChild(tb);
    if (opts.foot) t.appendChild(h('tfoot', {}, h('tr', {}, opts.foot.map(c => h('td', { html: c })))));
    wrap.appendChild(t);
    return wrap;
  }
  const mark = ok => (ok ? '<span class="cgood">✓ same</span>' : '<span class="cbad">✗ different</span>');
  /** Rule checks as stacked rows: [{what, rule, table, ok, note}] — readable at any width. */
  function checkList(items, ruleLabel = 'Rule', tableLabel = 'Table') {
    const box = h('div', { class: 's6-rcs' });
    items.forEach(it => {
      const row = h('div', { class: 's6-rc ' + (it.ok ? 'ok' : 'bad') });
      row.appendChild(h('div', { class: 's6-rc-what', html: it.what + ' ' + mark(it.ok) }));
      const right = h('div', { class: 's6-rc-body' });
      right.appendChild(K.note('<span class="s6-rc-k">' + ruleLabel + '</span> ' + it.rule, 's6-rc-line'));
      right.appendChild(K.note('<span class="s6-rc-k">' + tableLabel + '</span> ' + it.table, 's6-rc-line'));
      if (it.note) right.appendChild(K.note(it.note, 's6-rc-note'));
      row.appendChild(right);
      box.appendChild(row);
    });
    return box;
  }
  /** K.steps, but each formula is inline \displaystyle maths, so long lines wrap at = and + instead of scrolling. */
  const stepsW = list => K.steps(list.filter(Boolean).map(st0 => (st0.math ? Object.assign({}, st0, { html: (st0.html || '') + '<div class="s6-math">' + Lab.tex('\\displaystyle ' + st0.math) + '</div>', math: null }) : st0)));
  /** Rows {x, p} (sorted by value) → the input of K.cdfChart: exact fractions when every probability is exact, else decimals. */
  function cdfDist(rows) {
    const flt = rows.some(r => !ex(r.p));
    return { vals: rows.map(r => Number(r.x)), p: rows.map(r => (flt ? Number(r.p) : r.p)), float: flt };
  }
  /**
   * A CDF staircase drawn like K.cdfChart, for a variable whose values go on without end to the LEFT — Y = aX + b
   * with a < 0 when X is Poisson or geometric. K.cdfChart always starts at height 0 on the left; this one starts at
   * base = P(Y < left edge), so every F(t) it shows is right.
   * all: every value of Y the lab knows, [{v, p}] numbers, sorted; tail: the probability further left still;
   * lo, hi: the smallest and largest values drawn in the PMF; baseWhy(leftEdge): HTML that explains base.
   */
  function leftTailCdf({ all, tail, lo, hi, t, xName, baseWhy }) {
    const span = Math.max(1, hi - lo), pad = Math.max(1, Math.round(span / 10));
    const left = lo - pad, right = hi + pad;
    const rows = all.filter(r => r.v >= left - 1e-9 && r.v <= right + 1e-9);
    const base = all.filter(r => r.v < left - 1e-9).reduce((s0, r) => s0 + r.p, 0) + tail;
    const fv = v => Lab.fmtVal(v);
    const wrap = h('div', { class: 'kc-cdf' });
    const tCtl = K.numField({ label: 'Move ' + tex('t') + ' (any number)', min: left, max: right, step: span > 40 ? 1 : 0.5, value: t, onChange: v => { t = v; paint(); } });
    const host = h('div', { class: 'cdf-host' });
    const read = h('div', { class: 'ws-readout cdf-read' });
    wrap.append(tCtl, host, read);
    function paint() {
      const Wd = 640, H = 230, pl = 44, pr = 16, pt = 14, pb = 34;
      const X = v => pl + ((v - left) / (right - left)) * (Wd - pl - pr);
      const Y = v => pt + (1 - v) * (H - pt - pb);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'cdf-svg pl-cdf', role: 'img', 'aria-label': 'CDF staircase of ' + xName + '; it starts at P(' + xName + ' < ' + fv(left) + ') on the left' });
      [0, 0.25, 0.5, 0.75, 1].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(v), y2: Y(v), class: 'grid' })); s.appendChild(svg('text', { x: pl - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v))); });
      // x labels as in K.cdfChart: the values when they fit side by side, else round numbers
      const labW = str => str.length * 7.2 + 10;
      const shown = new Set();
      if (rows.length <= 24) {
        let edge = -Infinity;
        rows.forEach((r, k) => { const x = X(r.v), w = labW(fv(r.v)); if (x - w / 2 < edge) return; shown.add(k); edge = x + w / 2; });
      } else {
        const stp = niceStep((hi - lo) / 7);
        for (let k = Math.ceil(lo / stp); k * stp <= hi + 1e-9; k++) {
          const v = +(k * stp).toPrecision(12);
          s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: Y(0), y2: Y(0) + 5, class: 'grid' }));
          s.appendChild(svg('text', { x: X(v), y: H - 14, 'text-anchor': 'middle', class: 'tick' }, fv(v)));
        }
      }
      let acc = base, prevX = X(left);
      rows.forEach((r, k) => {
        s.appendChild(svg('line', { x1: prevX, x2: X(r.v), y1: Y(acc), y2: Y(acc), class: 'step' }));
        s.appendChild(svg('line', { x1: X(r.v), x2: X(r.v), y1: Y(acc), y2: Y(acc + r.p), class: 'jump' }));
        if (rows.length <= 12 && r.p > 0.02) s.appendChild(svg('text', { x: X(r.v) + 5, y: (Y(acc) + Y(acc + r.p)) / 2 + 4, class: 'jump-lab' }, '+' + Lab.fmt(r.p, 3)));
        s.appendChild(svg('circle', { cx: X(r.v), cy: Y(acc), r: 3.4, class: 'open' }));
        acc += r.p;
        s.appendChild(svg('circle', { cx: X(r.v), cy: Y(acc), r: 3.4, class: 'closed' }));
        if (shown.has(k)) s.appendChild(svg('text', { x: X(r.v), y: H - 14, 'text-anchor': 'middle', class: 'tick' }, fv(r.v)));
        prevX = X(r.v);
      });
      s.appendChild(svg('line', { x1: prevX, x2: X(right), y1: Y(acc), y2: Y(acc), class: 'step' }));
      const used = rows.filter(r => r.v <= t + 1e-12);
      const Ft = base + used.reduce((s0, r) => s0 + r.p, 0);
      s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: Y(0), y2: Y(Ft), class: 'marker' }));
      s.appendChild(svg('line', { x1: pl, x2: X(t), y1: Y(Ft), y2: Y(Ft), class: 'marker' }));
      s.appendChild(svg('circle', { cx: X(t), cy: Y(Ft), r: 5.5, class: 'marker-dot' }));
      Lab.clear(host);
      host.appendChild(s);
      const tt = fv(t), lt = fv(left);
      const terms = used.length > 4 ? '\\sum_{' + lt + '\\le y\\le ' + tt + '}P(' + xName + '=y)' : used.map(r => 'P(' + xName + '=' + fv(r.v) + ')').join('+');
      Lab.setHTML(read, tex('F(' + tt + ')=P(' + xName + '\\le ' + tt + ')=P(' + xName + '<' + lt + ')' + (used.length ? '+' + terms : '')) + '<br>' +
        tex('\\approx ' + decStr(base) + (used.length ? '+' + (used.length <= 8 ? used.map(r => decStr(r.p)).join('+') : '\\dots') : '') + '\\approx ' + decStr(Ft)) +
        '<div class="small muted">' + baseWhy(left, base) + ' Values of ' + tex(xName) + ' from ' + tex(lt) + ' up to ' + tex(tt) + ': ' + (used.length ? (used.length > 12 ? used.slice(0, 12).map(r => fv(r.v)).join(', ') + ', …' : used.map(r => fv(r.v)).join(', ')) : 'none') + '. And ' + tex('P(' + xName + '>' + tt + ')=1-F(' + tt + ')\\approx ' + decStr(1 - Ft)) + '.</div>');
    }
    paint();
    return wrap;
  }
  /* ---------------------------------------------------------------- distributions */
  /** distPicker result → {rows (exact when possible), hidden (far tail, summed into one table row), …}. */
  function distModel(res, name) {
    if (!res) return { ok: false, pending: true };
    const fam = res.fam || 'custom';
    const vals = res.dist.vals, ps = res.dist.p;
    if (fam === 'custom' && !res.ok) return { ok: false, err: 'The PMF of ' + tex(name) + ' is not ready: ' + (vals.length ? 'its probabilities add up to ' + tex(tx(fin(F.sum(ps.map(x => F(x)))))) + ', not 1 (press “Rescale to total 1”).' : 'fix the red boxes (numbers, no value twice, probabilities 0 or more).') };
    if (!vals.length) return { ok: false, err: tex(name) + ' has no values.' };
    if (fam === 'geometric' && !(Number(res.q.p) > 0)) return { ok: false, err: 'A geometric ' + tex(name) + ' needs ' + tex('p>0') + ' (with ' + tex('p=0') + ' the first success never comes).' };
    const rows = vals.map((v, i) => ({ x: toQ(v), xn: Number(v), p: typeof ps[i] === 'number' ? ps[i] : fin(ps[i]) }));
    if (rows.some(r => !Number.isFinite(r.xn) || !Number.isFinite(Number(r.p)))) return { ok: false, err: 'The parameters of ' + tex(name) + ' are not complete yet.' };
    const hidden = [];
    let tail = 0;
    if (res.truncated) {
      const kmax = vals[vals.length - 1];
      if (fam === 'geometric') {
        const p = Number(res.q.p), q = 1 - p;
        let t = p * Math.pow(q, kmax);
        for (let x = kmax + 1; x <= kmax + 4000 && t > 1e-17; x++) { hidden.push({ x, xn: x, p: t }); t *= q; }
        tail = Math.pow(q, kmax + hidden.length);
      } else {
        const lam = Number(res.q['λ']);
        let t = Number(ps[ps.length - 1]), x = kmax;
        while (x < kmax + 4000) { x++; t = (t * lam) / x; if (t < 1e-17 && x > lam) break; hidden.push({ x, xn: x, p: t }); }
        const rr = lam / (x + 1);
        tail = rr < 1 ? t / (1 - rr) : t;
      }
    }
    return { ok: true, fam, res, name, rows, hidden, tail, exact: !hidden.length && rows.every(r => ex(r.p) && ex(r.x)) };
  }
  function moments(D) {
    const all = D.rows.concat(D.hidden);
    const S0 = sum(all.map(r => r.p));
    const mu = sum(all.map(r => mul(r.x, r.p)));
    const ex2 = sum(all.map(r => mul(sq(r.x), r.p)));
    const v1 = sum(all.map(r => mul(sq(sub(r.x, mu)), r.p)));
    const v2 = sub(ex2, sq(mu));
    return { S0, mu, ex2, v1, v2, sd: sqrtQ(v1) };
  }
  /** Y = aX + b, value by value (the probabilities stay with their x). */
  function linModel(D, a, b) {
    const map = r => ({ x: add(mul(a, r.x), b), xn: Number(a) * r.xn + Number(b), p: r.p, from: r });
    if (isZero(a)) {
      const all = D.rows.concat(D.hidden);
      return { ok: true, rows: [{ x: b, xn: Number(b), p: sum(all.map(r => r.p)), from: null }], hidden: [], tail: 0, merged: true };
    }
    return { ok: true, rows: D.rows.map(map), hidden: D.hidden.map(map), tail: D.tail };
  }
  /**
   * The CDF of Y = aX + b, for under its PMF: the rule that turns P(Y ≤ t) into a question about X, then the staircase
   * (K.cdfChart, or leftTailCdf when a < 0 sends the endless far values of X to the left).
   */
  function linCdf(Y, sorted, a, b, MY, ytx) {
    const box = h('div', { class: 's6-cdfblk' });
    const an = Number(a);
    const lhs = ytx.replace(/^Y=/, '');
    const tmb = isZero(b) ? 't' : Number(b) < 0 ? 't+' + tx(mul(b, F(-1))) : 't-' + tx(b);
    // (t − b)/a, written simply when a = 1 or a = −1 (then it is b − t)
    const inner = same(a, F(1)) ? tmb : same(a, F(-1)) ? (isZero(b) ? '-t' : tx(b) + '-t') : '\\frac{' + tmb + '}{' + tx(a) + '}';
    let rule;
    if (isZero(a)) rule = 'With ' + tex('a=0') + ', ' + tex('Y=' + tx(b)) + ' every time, so its CDF has one step: ' + tex('F_Y(t)=0') + ' for ' + tex('t<' + tx(b)) + ' and ' + tex('F_Y(t)=1') + ' for ' + tex('t\\ge ' + tx(b)) + '.';
    else if (an > 0) rule = tex('F_Y(t)=P(' + lhs + '\\le t)=P\\left(X\\le ' + inner + '\\right)') + '. With ' + tex('a=' + tx(a) + '>0') + ' the values keep their order, so this is the staircase of ' + tex('X') + ' with each step moved to ' + tex('y=ax+b') + ' (same heights).';
    else rule = tex('F_Y(t)=P(' + lhs + '\\le t)=P\\left(X\\ge ' + inner + '\\right)') + '. Dividing by ' + tex('a=' + tx(a) + '<0') + ' turns ' + tex('\\le') + ' into ' + tex('\\ge') + ': the largest ' + tex('x') + ' now gives the smallest ' + tex('y') + ', so the steps come in the opposite order.';
    box.appendChild(K.note('<b>The CDF of ' + tex('Y') + '</b>, ' + tex('F_Y(t)=P(Y\\le t)') + '. ' + rule, 'small'));
    const start = sorted.find(r => Number(r.x) >= Number(MY.mu) - 1e-9) || sorted[sorted.length - 1];
    const leftTail = an < 0 && (Y.hidden.length > 0 || Number(Y.tail) > 0);
    if (!leftTail) {
      box.appendChild(K.cdfChart(cdfDist(sorted), { xName: 'Y', t: Number(start.x), truncated: an > 0 && (Y.hidden.length > 0 || Number(Y.tail) > 0) }));
      return box;
    }
    const all = Y.rows.concat(Y.hidden).map(r => ({ v: Number(r.x), p: Number(r.p) })).sort((p, q) => p.v - q.v);
    const vs = Y.rows.map(r => Number(r.x));
    const lastX = Y.rows[Y.rows.length - 1].from.x;
    // Y < left  ⇔  aX + b < left  ⇔  X > (left − b)/a, because a < 0
    const cutTex = q => (ex(q) && q.d !== 1 && shortDec(q) ? dec(q) : tx(q));
    box.appendChild(leftTailCdf({ all, tail: Number(Y.tail) || 0, lo: Math.min(...vs), hi: Math.max(...vs), t: Number(start.x), xName: 'Y',
      baseWhy: (left, base) => 'The values of ' + tex('X') + ' after ' + tex('x=' + tx(lastX)) + ' go on without end, and ' + tex('a<0') + ' sends them to the left, so the staircase starts at ' + tex('P(Y<' + Lab.fmtVal(left) + ')=P\\left(X>' + cutTex(div(sub(toQ(left), b), a)) + '\\right)\\approx ' + decStr(base)) + ', not at 0.' }));
    return box;
  }
  /** S = X + W for independent X and W: P(S = s) = Σ_x P(X = x) P(W = s − x). */
  function sumModel(DX, DW) {
    const ax = DX.rows.concat(DX.hidden), aw = DW.rows.concat(DW.hidden);
    const exact = DX.exact && DW.exact && ax.length * aw.length <= 6000;
    const map = new Map();
    const allInt = ax.every(r => Number.isInteger(r.xn)) && aw.every(r => Number.isInteger(r.xn));
    let rows;
    if (!exact && allInt) {
      const lo = ax[0].xn + aw[0].xn;
      const hi = ax[ax.length - 1].xn + aw[aw.length - 1].xn;
      const arr = new Float64Array(hi - lo + 1);
      ax.forEach(r => { const px = Number(r.p); aw.forEach(w => { arr[r.xn + w.xn - lo] += px * Number(w.p); }); });
      rows = [];
      arr.forEach((p, i) => { if (p > 0) rows.push({ x: F(lo + i), xn: lo + i, p }); });
    } else {
      ax.forEach(r => aw.forEach(w => {
        const sn = r.xn + w.xn, key = String(Math.round(sn * 1e9) / 1e9);
        if (!map.has(key)) map.set(key, { x: add(r.x, w.x), xn: sn, p: F(0) });
        const e = map.get(key);
        e.p = exact ? add(e.p, mul(r.p, w.p)) : Number(e.p) + Number(r.p) * Number(w.p);
      }));
      rows = [...map.values()].sort((a, b) => a.xn - b.xn).filter(r => Number(r.p) > 0);
    }
    const LIM = 40;
    return { ok: true, rows: rows.slice(0, LIM), hidden: rows.slice(LIM), tail: Number(DX.tail) + Number(DW.tail), exact };
  }

  /* ------------------------------------------------------------------------ the lab */
  const DEF = {
    x: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } }, custom: { vals: [0, 1, 2], probs: ['1/4', '1/2', '1/4'] } },
    w: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } }, custom: { vals: [0, 1], probs: ['1/2', '1/2'] } },
    g: 'x^2', a: 2, b: 3, pivot: null, sPick: null, preset: '',
  };
  const NOTES = 'Statistics I course notes, Week 10';
  const TYPICAL = 'a typical Statistics I exercise (Weeks 9–10), not one specific lecture example';
  const G91 = 'Lecture: Discrete random variable — application', G92 = 'Lecture: Expectation of a random variable', G93 = 'Lecture: Properties of expectation',
    G94 = 'Lecture: Variance of a random variable', G95 = 'Lecture: Properties of variance', G96 = 'Lecture: Standard deviation of a random variable';
  const cus = (vals, probs) => ({ fam: 'custom', custom: { vals, probs } });
  const uni = (a, b) => ({ fam: 'uniform', params: { uniform: { a, b } } });
  const ber = p => ({ fam: 'bernoulli', params: { bernoulli: { p } } });
  const bin = (n, p) => ({ fam: 'binomial', params: { binomial: { n, p } } });
  const half2 = ['1/2', '1/2'];
  const CARDS = cus([0, 1, 2, 3, 4], ['21/50', '9/25', '7/50', '3/50', '1/50']);
  const GAME = cus([-6, -4, -2, 1, 3, 5], ['1/6', '1/6', '1/6', '1/6', '1/6', '1/6']);
  const SUM2 = cus(Lab.range(2, 12), Lab.range(2, 12).map(v => F(6 - Math.abs(v - 7), 36).toString()));
  const ANITA = cus([12, 18], half2), SANJAY = cus([16, 24], half2), PM2 = cus([-2, 2], half2);
  const PRESETS = [
    // ---- the professor's examples, in lecture order (merged where two lectures use the same example)
    { group: G91, label: 'Credit cards: how many would you expect?', source: G91 + ', at 04:00 (PMF 0.42, 0.36, 0.14, 0.06, 0.02 on 0–4). The question “how many credit cards would I expect this person to have?” is asked at 13:30; the lab answers it: E[X] = 0.9', set: { x: CARDS, g: 'x^2', a: 1, b: 0, w: CARDS } },
    { group: G92, label: 'Dice game: win the odd outcomes, lose the even ones', source: G92 + ', at 00:30–08:30: winnings +1, −2, +3, −4, +5, −6, each with probability 1/6, so E = −3/6 = −0.5 (the lecture’s own runs averaged −0.09 over 100 rolls and −0.451 over 1,000 rolls)', set: { x: GAME, g: 'x^2', a: 1, b: 0, w: GAME } },
    { group: G92, label: 'One fair die: E = 7/2, Var = 35/12', source: G92 + ', at 11:00 (E = 3.5); “Variance of a random variable”, at 11:40: E(X²) = 15.167, Var = 15.167 − 3.5² = 2.917 (the same numbers as the discrete uniform with n = 6, at 19:00)', set: { x: uni(1, 6), g: 'x^2', a: 1, b: 0, w: uni(1, 6) } },
    { group: G92, label: 'Sum of two dice: E = 7', source: G92 + ', at 14:30–16:30 (E = 7, the balance point of a symmetric PMF); “Variance of a random variable”, at 12:20: E(X²) = 54.833, Var = 54.833 − 49 = 5.833', set: { x: SUM2, g: 'x^2', a: 1, b: 0, w: uni(1, 6) } },
    { group: G92, label: 'Heads in three tosses: E = 3/2', source: G92 + ', at 17:00 (E = 12/8 = 1.5); “Variance of a random variable”, at 14:20: E(X²) = 24/8 = 3, Var = 3 − 2.25 = 0.75', set: { x: bin(3, '1/2'), g: 'x^2', a: 1, b: 0, w: ber('1/2') } },
    { group: G92, label: 'Bernoulli(1/2): E = p = 1/2', source: G92 + ', at 18:30–20:30 (E = p, and 1/2 when 0 and 1 are equally likely); “Variance of a random variable”, at 16:20: Var = p − p² = p(1 − p)', set: { x: ber('1/2'), g: 'x^2', a: 1, b: 0, w: ber('1/2') } },
    { group: G93, label: 'E[X²] = 0.5 but (E[X])² = 0.01', source: G93 + ', at 06:00–09:30: x = −1, 0, 1 with 0.2, 0.5, 0.3; E(X²) = 0.5 by both routes, E(X) = 0.1', set: { x: cus([-1, 0, 1], ['1/5', '1/2', '3/10']), g: 'x^2', a: 1, b: 0, w: ber('1/2') } },
    { group: G93, label: 'Bonus: Sanjay gets 0.9 × Anita’s', source: G93 + ', at 10:00–11:00: E(X) = ₹15,000, so E(0.9X) = ₹13,500. The lecture gives only the mean; the PMF here (₹12,000 or ₹18,000, each 1/2; values in ₹ thousand) is chosen to have it — and the SD ₹3,000 used in “Standard deviation of a random variable” at 06:20', set: { x: ANITA, g: 'x^2', a: 0.9, b: 0, w: SANJAY } },
    { group: G93, label: 'Bonus: Sanjay gets Anita’s + ₹1,000', source: G93 + ', at 11:30–12:30: E(X + 1000) = ₹16,000 (values in ₹ thousand, so b = 1; same chosen PMF for X)', set: { x: ANITA, g: 'x^2', a: 1, b: 1, w: SANJAY } },
    { group: G93, label: 'Boys among 2 chosen from 20 boys and 10 girls', source: G93 + ', at 19:00–22:00: hypergeometric with N = 30, m = 20, n = 2, so E(boys) = 2 · 20/30 = 4/3; girls = 2 − boys (a = −1, b = 2 here) has E = 2/3; together E = 2. The PMF 3/29, 40/87, 38/87 is the slide’s hypergeometric formula worked out', set: { x: cus([0, 1, 2], ['3/29', '40/87', '38/87']), g: 'x^2', a: -1, b: 2, w: ber('1/2') } },
    { group: G94, label: 'Same mean 0, different spread: ±2 and ±20', source: G94 + ', at 03:40–05:40: X = 0, Y = ±2, Z = ±20 (each sign 1/2) all have mean 0, but Z spreads more than Y, and Y more than X. Here the lab’s X is the lecture’s Y and Y = 10X is the lecture’s Z; the variances 4 and 400 are worked out here', set: { x: PM2, g: 'x^2', a: 10, b: 0, w: PM2 } },
    { group: G95, label: 'Var(X + X) = 4 Var(X), not 2 Var(X)', source: G95 + ', at 05:30–07:00: X + X = 2X has variance 4 Var(X). An independent copy W instead gives Var(X + W) = 2 Var(X)', set: { x: uni(1, 6), g: 'x^2', a: 2, b: 0, w: uni(1, 6) } },
    { group: G95, label: 'Two independent dice: Var(X + Y) = 70/12', source: G95 + ', at 10:00–11:30: 35/12 + 35/12 = 70/12 ≈ 5.83; “Properties of expectation”, at 13:30–15:00: E(X + Y) = 7/2 + 7/2 = 7', set: { x: uni(1, 6), g: 'x^2', a: 1, b: 0, w: uni(1, 6) } },
    { group: G95, label: 'Three tosses as a sum of Bernoullis', source: G95 + ', at 13:30–16:30: X₁ + X₂ + X₃, each Bernoulli(1/2) and independent: E = 3/2, Var = 1/4 + 1/4 + 1/4 = 3/4 (here X = X₁ and W = X₂ + X₃); E = 3/2 also in “Properties of expectation”, at 23:00', set: { x: ber('1/2'), g: 'x^2', a: 1, b: 0, w: bin(2, '1/2') } },
    { group: G96, label: 'Var(X) = 4, so SD(3X) = 6', source: G96 + ', at 04:20–05:00. The lecture gives only Var(X) = 4; X = ±2 (each 1/2) is chosen here to have it', set: { x: PM2, g: 'x^2', a: 3, b: 0, w: PM2 } },
    { group: G96, label: 'Var(2X + 3) = 16, so SD(X) = 2', source: G96 + ', at 05:40 (same chosen X = ±2)', set: { x: PM2, g: 'x^2', a: 2, b: 3, w: PM2 } },
    { group: G96, label: 'Family bonus: SD of the total', source: G96 + ', at 06:20–09:00: Anitha E = ₹15,000, SD = ₹3,000; Sanjay E = ₹20,000, SD = ₹4,000; independent, so E = ₹35,000 and SD = √(Var X + Var Y) = ₹5,000. Values in ₹ thousand; the two-point PMFs 15 ± 3 and 20 ± 4 are chosen here to have those means and SDs', set: { x: ANITA, g: 'x^2', a: 1, b: 0, w: SANJAY } },
    { group: G96, label: 'Lawyer: contingency fee', source: G96 + ', at 09:40–13:00: ₹50,000 if she wins (probability 0.5), ₹0 if she loses: E = ₹25,000, SD = ₹25,000 (values in ₹ thousand)', set: { x: cus([0, 50], half2), g: 'x^2', a: 1, b: 0, w: cus([0, 50], half2) } },
    { group: G96, label: 'Lawyer: fixed fee', source: G96 + ', at 13:00: ₹25,000 for sure, so E = ₹25,000 and SD = 0 (values in ₹ thousand)', set: { x: cus([25], ['1']), g: 'x^2', a: 1, b: 0, w: cus([0, 50], half2) } },
    // ---- earlier examples (course notes and typical exercises)
    { group: 'More examples (course notes and typical exercises)', label: 'A fair die: E = 7/2, Var = 35/12', source: NOTES + ' · discrete uniform on {1, …, n} with n = 6: E(X) = (n + 1)/2, Var(X) = (n² − 1)/12', set: { x: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } } }, g: 'x^2', a: 2, b: 3, w: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'Bernoulli(p = 0.3)', source: NOTES + ' · Bernoulli: X ∈ {0, 1}, P(X = 1) = p, E(X) = p, Var(X) = p(1 − p)', set: { x: { fam: 'bernoulli', params: { bernoulli: { p: '3/10' } } }, g: 'x^2', a: -1, b: 1, w: { fam: 'bernoulli', params: { bernoulli: { p: '3/10' } } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'Discrete uniform on {1, …, 10}', source: NOTES + ' · discrete uniform on {1, …, n}: PMF 1/n, E(X) = (n + 1)/2, Var(X) = (n² − 1)/12', set: { x: { fam: 'uniform', params: { uniform: { a: 1, b: 10 } } }, g: 'x^2', a: 1, b: -1, w: { fam: 'uniform', params: { uniform: { a: 1, b: 10 } } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'A game: win ₹100 with prob. 1/10, else lose ₹10', source: TYPICAL, set: { x: { fam: 'custom', custom: { vals: [-10, 100], probs: ['9/10', '1/10'] } }, g: 'max(x,0)', a: 2, b: 0, w: { fam: 'custom', custom: { vals: [-10, 100], probs: ['9/10', '1/10'] } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'E[X²] ≠ (E[X])²: uniform on {−2, …, 2}', source: TYPICAL + ' (the “do not put E(X) inside g” warning in the notes)', set: { x: { fam: 'uniform', params: { uniform: { a: -2, b: 2 } } }, g: 'x^2', a: 1, b: 5, w: { fam: 'bernoulli', params: { bernoulli: { p: '1/2' } } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'Heads in 3 fair tosses, Bin(3, 1/2)', source: TYPICAL + ' (E = np, Var = np(1 − p) are Week 11 formulas)', set: { x: { fam: 'binomial', params: { binomial: { n: 3, p: '1/2' } } }, g: 'x^2', a: 1, b: 0, w: { fam: 'bernoulli', params: { bernoulli: { p: '1/2' } } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'Celsius to Fahrenheit: Y = 1.8X + 32', source: TYPICAL, set: { x: { fam: 'custom', custom: { vals: [20, 25, 30], probs: ['3/10', '1/2', '1/5'] } }, g: '(x-25)^2', a: 1.8, b: 32, w: { fam: 'custom', custom: { vals: [0, 1], probs: ['1/2', '1/2'] } } } },
    { group: 'More examples (course notes and typical exercises)', label: 'Two independent dice: Var(X + W) = 35/6', source: TYPICAL, set: { x: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } } }, g: 'x^2', a: 1, b: 0, w: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } } } } },
  ];
  const G_CHIPS = [['x^2', 'x²'], ['(x-1)^2', '(x−1)²'], ['2x+3', '2x+3'], ['abs(x-3)', '|x−3|'], ['x^3', 'x³'], ['max(x,3)', 'max(x, 3)'], ['1/(x+1)', '1/(x+1)']];
  const AB_CHIPS = [[2, 3, 'Y = 2X + 3'], [-1, 0, 'Y = −X'], [1, 10, 'Y = X + 10'], [0.5, 0, 'Y = X/2'], [1.8, 32, 'Y = 1.8X + 32']];

  /** Put the example menu's options into one <optgroup> per lecture (the option values stay the item indexes). */
  function groupOptions(sel, items) {
    let grp = null, name = null;
    Array.from(sel.options).forEach(o => {
      if (o.value === '') return;
      const g = items[+o.value].group || 'Examples';
      if (g !== name) { name = g; grp = h('optgroup', { label: g.replace(/^Lecture: /, '') }); sel.appendChild(grp); }
      grp.appendChild(o);
    });
  }

  Lab.lab({
    id: 'lab-s1-expect', course: 's1', week: 10, order: 1,
    title: 'Expectation and variance lab', sub: 'Week 10 · E, Var, SD',
    topics: ['E[X]', 'balance point', 'E[g(X)]', 'Var two ways', 'SD', 'aX + b', 'Var(X + W)', 'Bernoulli', 'uniform', 'long-run average'],
    desc: 'Pick or type any PMF. See E[X] as the balance point, the table x · p(x), x² p(x), (x − μ)² p(x) with its sums, Var two ways, E[g(X)] against g(E[X]), Y = aX + b, the sum of two independent variables and a long-run average.',
    render: host => run(host),
  });

  function run(host) {
    const saved = Lab.store.get(STORE, {}) || {};
    const st = Object.assign(clone(DEF), saved);
    // merge X and W slot by slot, so an older or partial saved state still has every key
    ['x', 'w'].forEach(k => {
      const sv = saved[k] && typeof saved[k] === 'object' ? saved[k] : {};
      st[k] = Object.assign(clone(DEF[k]), sv, { params: Object.assign(clone(DEF[k].params), sv.params || {}) });
      if (!st[k].custom || !Array.isArray(st[k].custom.vals) || !Array.isArray(st[k].custom.probs)) st[k].custom = clone(DEF[k].custom);
    });
    let side, main, P = {}, ctl = {}, xRes = null, wRes = null, last = null, sim = null, cum = null;
    let cdfPick = 'S'; // the CDF shown in the X + W panel: 'S' (X + W) or 'W'
    const save = () => Lab.store.set(STORE, st);
    let pending = false;
    const rebuild = () => { if (pending) return; pending = true; setTimeout(() => { pending = false; buildSide(); draw(); }, 0); };
    build();

    function build() {
      ({ side, main } = K.layout(host, 's6-exp'));
      host.classList.add('s6-lab');
      P.err = h('div', { class: 's6-err', role: 'status' });
      P.err.hidden = true;
      P.answer = K.answer();
      P.bal = K.panel('The balance point: ' + tex('E[X]') + ' is where the PMF balances');
      P.cdf = K.panel('The CDF of ' + tex('X'), tex('F(t)=P(X\\le t)') + ': the total probability up to ' + tex('t') + ' — a staircase that jumps by ' + tex('p(x)') + ' at each value (Week 9). Move ' + tex('t') + ' to read any ' + tex('F(t)') + '; it starts at the first value at or above ' + tex('E[X]') + '.');
      P.table = K.panel('The table, with its column sums');
      P.steps = K.panel('How it is computed, with your numbers');
      P.g = K.panel(tex('E[g(X)]') + ' for your ' + tex('g') + ' — and why it is not ' + tex('g(E[X])'));
      P.lin = K.panel('Change of scale: ' + tex('Y=aX+b'));
      P.sum = K.panel('Adding an independent variable: ' + tex('X+W'));
      P.fam = K.panel('Formula check: Bernoulli and discrete uniform');
      P.sim = K.panel('Long-run average', 'Draw ' + tex('X') + ' again and again. The average of the draws settles on ' + tex('E[X]') + ' — the notes: “long-run average if the experiment is repeated. Not a value ' + tex('X') + ' must hit in one trial.”');
      main.append(P.err, P.answer, P.bal, P.cdf, P.table, P.steps, P.g, P.lin, P.sum, P.fam, P.sim);
      buildSim();
      buildSide();
      draw();
    }
    function changed() {
      if (st.preset === '') return;
      st.preset = '';
      if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); }
    }
    function applyPreset(k) {
      const it = PRESETS[k];
      ['x', 'w'].forEach(key => {
        const s2 = it.set[key];
        st[key].fam = s2.fam;
        if (s2.params) Object.assign(st[key].params, clone(s2.params));
        if (s2.custom) st[key].custom = clone(s2.custom);
      });
      st.g = it.set.g; st.a = it.set.a; st.b = it.set.b; st.pivot = null; st.sPick = null;
      st.preset = String(k);
      xRes = wRes = null;
      rebuild();
    }
    /** Remember what the picker reports, so the learner's numbers survive a reload. */
    function keep(slot, res) {
      const s0 = st[slot], before = JSON.stringify(s0);
      if (res.fam) {
        s0.fam = res.fam;
        const q = {};
        Object.keys(res.q || {}).forEach(k => (q[k] = res.q[k] instanceof Fr ? res.q[k].toString() : res.q[k]));
        s0.params[res.fam] = q;
      } else {
        s0.fam = 'custom';
        if (res.dist.vals.length) s0.custom = { vals: res.dist.vals, probs: res.dist.p.map(p => (p instanceof Fr ? p.toString() : String(p))) };
      }
      if (JSON.stringify(s0) !== before) return true;
      return false;
    }

    /* ---------------- controls */
    function buildSide() {
      Lab.clear(side);
      ctl = {};
      ctl.pre = K.presets({ label: 'Examples — the professor’s first', items: PRESETS, onPick: it => applyPreset(PRESETS.indexOf(it)) });
      groupOptions(ctl.pre.select, PRESETS);
      if (st.preset !== '' && PRESETS[+st.preset]) { ctl.pre.select.value = st.preset; Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[+st.preset].source); }
      side.appendChild(ctl.pre);
      side.appendChild(K.group('1 · Your random variable X'));
      side.appendChild(K.distPicker({ label: 'Distribution of ' + tex('X'), value: st.x.fam, params: clone(st.x.params), custom: clone(st.x.custom), xName: 'X',
        onChange: res => { xRes = res; if (keep('x', res)) { changed(); st.pivot = null; } resetSim(); draw(); } }));
      side.appendChild(K.group('2 · A function of X'));
      ctl.g = K.exprField({ label: tex('g(x)=') + ' (type any function of ' + tex('x') + ')', value: st.g, vars: ['x'], onChange: (fn, src) => { if (src !== st.g) { st.g = src; changed(); } draw(); } });
      side.appendChild(ctl.g);
      const gc = h('div', { class: 'pl-chips' });
      G_CHIPS.forEach(([src, lab]) => { const b = Lab.button(lab, () => ctl.g.set(src), 'btn xs'); b.title = 'g(x) = ' + src; gc.appendChild(b); });
      side.appendChild(gc);
      side.appendChild(K.group('3 · A linear change of X'));
      ctl.a = K.numField({ label: tex('a') + ' (multiplies every value)', min: -10, max: 10, step: 0.1, value: st.a, onChange: v => { st.a = v; changed(); draw(); } });
      ctl.b = K.numField({ label: tex('b') + ' (is added to every value)', min: -50, max: 50, step: 0.5, value: st.b, onChange: v => { st.b = v; changed(); draw(); } });
      side.append(ctl.a, ctl.b);
      const ab = h('div', { class: 'pl-chips' });
      AB_CHIPS.forEach(([a, b, lab]) => ab.appendChild(Lab.button(lab, () => { st.a = a; st.b = b; ctl.a.set(a); ctl.b.set(b); changed(); draw(); }, 'btn xs')));
      side.appendChild(ab);
      side.appendChild(K.group('4 · A second, independent variable W'));
      side.appendChild(K.distPicker({ label: 'Distribution of ' + tex('W'), value: st.w.fam, params: clone(st.w.params), custom: clone(st.w.custom), xName: 'W',
        onChange: res => { wRes = res; if (keep('w', res)) { changed(); st.sPick = null; } draw(); } }));
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); Object.keys(st).forEach(k => delete st[k]); Object.assign(st, clone(DEF)); xRes = wRes = null; last = null; build(); }, 'btn ghost sm')));
    }

    /* ---------------- drawing */
    function draw() {
      save();
      const DX = distModel(xRes, 'X');
      if (DX.pending) return;
      if (DX.ok) { const M = moments(DX); if (!last || last.DX !== DX) { last = { DX, M }; cum = null; } }
      P.err.hidden = DX.ok;
      if (!DX.ok) Lab.setHTML(P.err, '<b>Not redrawn yet.</b> ' + DX.err + (last ? ' The panels below still show your last valid ' + tex('X') + '.' : ''));
      if (!last) { [P.answer, P.bal, P.cdf, P.table, P.steps, P.g, P.lin, P.sum, P.fam, P.sim].forEach(p => (p.hidden = true)); return; }
      [P.answer, P.bal, P.cdf, P.table, P.steps, P.g, P.lin, P.sum, P.fam, P.sim].forEach(p => { p.hidden = false; p.classList.toggle('s6-stale', !DX.ok); });
      const { DX: D, M } = last;
      drawAnswer(D, M); drawBalance(D, M); drawCdf(D, M); drawTable(D, M); drawSteps(D, M); drawG(D, M); drawLin(D, M); drawSum(D, M); drawFam(D, M); paintSim();
    }
    const xWords = D => (D.fam === 'custom' ? 'the PMF you typed (' + D.rows.length + ' value' + (D.rows.length > 1 ? 's' : '') + ')' : tex('X\\sim ' + D.res.tex));

    function drawAnswer(D, M) {
      const box = P.answer;
      Lab.clear(box);
      box.appendChild(K.note('Your ' + tex('X') + ': ' + xWords(D) + '. Mean, variance and standard deviation:', 'pl-ans-ev'));
      box.appendChild(h('div', { class: 'pl-ans-big s6-big', html: Lab.tex('\\displaystyle E[X]=\\mu' + eqv(M.mu)) }));
      box.appendChild(h('div', { class: 'pl-ans-big s6-big', html: Lab.tex('\\displaystyle \\operatorname{Var}(X)' + eqv(M.v1) + ',\\qquad \\operatorname{SD}(X)=' + sdTex(M.v1)) }));
      box.appendChild(K.note('From the table below: ' + tex('E[X]=\\sum x\\,p(x)') + ' is the sum of the ' + tex('x\\,p(x)') + ' column; ' + tex('\\operatorname{Var}(X)=\\sum (x-\\mu)^2p(x)') + ' is the sum of the last column (and equals ' + tex('E[X^2]-(E[X])^2') + '); ' + tex('\\operatorname{SD}=\\sqrt{\\operatorname{Var}}') + ', in the same units as ' + tex('X') + '.' + (D.hidden.length ? ' ' + tailNote(D) : ''), 'pl-ans-sub'));
    }
    function tailNote(D) {
      const last0 = D.rows[D.rows.length - 1].xn, lastH = D.hidden[D.hidden.length - 1].xn;
      const k = Math.max(-18, Math.ceil(Math.log10(Math.max(D.tail, 1e-300))));
      return 'The values after ' + tex('x=' + last0) + ' are not drawn one by one, but they are in every sum: the italic table row adds ' + tex('x=' + (last0 + 1) + ',\\dots,' + lastH) + '. The probability beyond ' + tex('x=' + lastH) + ' is less than ' + tex('10^{' + k + '}') + '.';
    }

    /* -------- balance point */
    function drawBalance(D, M) {
      const body = P.bal.body;
      Lab.clear(body);
      const rows = D.rows;
      const xs = rows.map(r => r.xn);
      const lo0 = Math.min(...xs), hi0 = Math.max(...xs);
      const span0 = Math.max(1, hi0 - lo0);
      const step = niceStep(span0 / 100);
      const c0 = st.pivot == null ? M.mu : toQ(st.pivot);
      P.bal.sub('Each value ' + tex('x') + ' carries a weight ' + tex('p(x)') + ' on a light beam. The beam balances exactly at ' + tex('\\mu=E[X]') + '. Move the pivot ' + tex('c') + ' and watch it tip.');
      const pv = K.numField({ label: 'Pivot ' + tex('c'), min: Math.floor(lo0 / step) * step, max: Math.ceil(hi0 / step) * step, step, value: +Number(c0).toPrecision(10), onChange: v => { st.pivot = v; save(); paint(); } });
      const btn = Lab.button('Balance it: put ' + tex('c') + ' at ' + tex('E[X]'), () => { st.pivot = null; save(); pv.set(Number(M.mu)); paint(); }, 'btn sm');
      const host = h('div', { class: 's6-bal-host' }), read = h('div', { class: 'ws-readout s6-read' });
      body.append(h('div', { class: 's6-pivot' }, pv, btn), host, read);
      paint();
      function paint() {
      const c = st.pivot == null ? M.mu : toQ(st.pivot);
      Lab.clear(host);
      host.appendChild(balanceSvg(D, M, c));
      // the moments about c
      const all = D.rows.concat(D.hidden);
      const left = all.filter(r => r.xn < Number(c) - 1e-12), right = all.filter(r => r.xn > Number(c) + 1e-12);
      const L = sum(left.map(r => mul(sub(c, r.x), r.p))), R = sum(right.map(r => mul(sub(r.x, c), r.p)));
      const torque = sub(M.mu, c);
      const bal = isZero(torque);
      Lab.setHTML(read,
        'Turning effect of the weights about ' + tex('c') + ': ' + tex('\\sum_x (x-c)\\,p(x)=\\sum_x x\\,p(x)-c\\sum_x p(x)=E[X]-c') + '.<br>' +
        'With your pivot: ' + tex('E[X]-c=' + tx(M.mu) + '-' + par(c) + eqv(torque)) + ' — ' + (bal ? '<b class="cgood">zero, so the beam balances.</b>' : Number(torque) > 0 ? '<b>positive: the right side is heavier and the beam tips right.</b> Move ' + tex('c') + ' right, to ' + tex('E[X]') + '.' : '<b>negative: the left side is heavier and the beam tips left.</b> Move ' + tex('c') + ' left, to ' + tex('E[X]') + '.') +
        '<div class="small muted">Same thing as two sides: left of ' + tex('c') + ', ' + tex('\\sum_{x<c}(c-x)\\,p(x)' + eqv(L)) + '; right of ' + tex('c') + ', ' + tex('\\sum_{x>c}(x-c)\\,p(x)' + eqv(R)) + (bal ? ' — equal.' : ' — not equal.') + '</div>');
      }
    }
    function balanceSvg(D, M, c) {
      const rows = D.rows, xs = rows.map(r => r.xn);
      let lo = Math.min(...xs, Number(M.mu), Number(c)), hi = Math.max(...xs, Number(M.mu), Number(c));
      const span = Math.max(1, hi - lo);
      lo -= span * 0.07; hi += span * 0.07;
      const Wd = 680, H = 268, pl = 18, pr = 18, beamY = 168, topY = 54, axisY = 232;
      const X = v => pl + ((v - lo) / (hi - lo)) * (Wd - pl - pr);
      const maxP = Math.max(...rows.map(r => Number(r.p)), 1e-12);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 's6-bal-svg', role: 'img', 'aria-label': 'PMF of X as weights on a beam, balanced at E[X]' });
      const torque = Number(M.mu) - Number(c);
      const theta = Math.max(-5, Math.min(5, (torque / span) * 30));
      const cx = X(Number(c));
      const g = svg('g', { transform: 'rotate(' + theta.toFixed(3) + ' ' + cx.toFixed(2) + ' ' + beamY + ')' });
      g.appendChild(svg('line', { x1: X(lo), x2: X(hi), y1: beamY, y2: beamY, class: 's6-beam' }));
      rows.forEach(r => {
        const hg = (Number(r.p) / maxP) * (beamY - topY);
        g.appendChild(svg('line', { x1: X(r.xn), x2: X(r.xn), y1: beamY, y2: beamY - hg, class: 's6-spike' }));
        g.appendChild(svg('circle', { cx: X(r.xn), cy: beamY - hg, r: 4.6, class: 's6-spike-dot' }));
        if (rows.length <= 13) g.appendChild(svg('text', { x: X(r.xn), y: beamY - hg - 9, 'text-anchor': 'middle', class: 's6-spike-lab' }, vp(r.p)));
      });
      s.appendChild(g);
      const balanced = Math.abs(torque) < 1e-12;
      s.appendChild(svg('polygon', { points: cx + ',' + (beamY + 3) + ' ' + (cx - 13) + ',' + (beamY + 27) + ' ' + (cx + 13) + ',' + (beamY + 27), class: 's6-fulcrum' + (balanced ? ' ok' : '') }));
      // number line
      s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: axisY, y2: axisY, class: 's6-axis' }));
      const every = rows.length > 16 ? Math.ceil(rows.length / 16) : 1;
      rows.forEach((r, k) => {
        s.appendChild(svg('line', { x1: X(r.xn), x2: X(r.xn), y1: axisY - 4, y2: axisY + 4, class: 's6-axis' }));
        if (k % every === 0) s.appendChild(svg('text', { x: X(r.xn), y: axisY + 18, 'text-anchor': 'middle', class: 's6-tick' }, vp(r.x)));
      });
      const mx = X(Number(M.mu));
      s.appendChild(svg('polygon', { points: mx + ',' + (axisY - 2) + ' ' + (mx - 7) + ',' + (axisY - 14) + ' ' + (mx + 7) + ',' + (axisY - 14), class: 's6-mu' }));
      s.appendChild(svg('text', { x: Math.min(Wd - 60, Math.max(60, mx)), y: H - 2, 'text-anchor': 'middle', class: 's6-mu-lab' }, 'E[X] = ' + (ex(M.mu) ? vp(M.mu) + (M.mu.d !== 1 ? (shortDec(M.mu) ? ' = ' : ' ≈ ') + dec(M.mu) : '') : (shortDec(M.mu) ? '' : '≈ ') + dec(M.mu))));
      s.appendChild(svg('text', { x: Math.min(Wd - 40, Math.max(40, cx)), y: beamY + 42, 'text-anchor': 'middle', class: 's6-c-lab' + (balanced ? ' ok' : '') }, 'c = ' + (balanced ? 'E[X]' : vp(c))));
      return s;
    }

    /* -------- the CDF (kit chart, movable t) */
    function drawCdf(D, M) {
      const body = P.cdf.body;
      Lab.clear(body);
      const flt = D.rows.some(r => !ex(r.p));
      const dist = { vals: D.rows.map(r => r.xn), p: D.rows.map(r => (flt ? Number(r.p) : r.p)), float: flt };
      const mid = D.rows.find(r => Number(r.xn) >= Number(M.mu) - 1e-9) || D.rows[D.rows.length - 1];
      body.appendChild(K.cdfChart(dist, { xName: 'X', t: mid.xn, truncated: !!D.hidden.length }));
    }

    /* -------- the table */
    function cellProd(a, b, out, small) { return small ? tex(a + '\\cdot ' + b + '=' + tx(out)) : tex(tx(out)); }
    function momentTable(D, M, nm, opts = {}) {
      const mu = M.mu, small = !opts.compact && D.rows.length <= 10;
      const xs = nm === 'X' ? 'x' : nm.toLowerCase();
      const head = [opts.head0 || tex(xs), tex('p(' + xs + ')'), tex(xs + '\\cdot p(' + xs + ')'), tex(xs + '^2\\cdot p(' + xs + ')'), tex('(' + xs + '-\\mu' + (nm === 'X' ? '' : '_' + nm) + ')^2\\cdot p(' + xs + ')')];
      if (opts.pre) head.unshift(opts.pre.head);
      const rows = D.rows.map(r => {
        const xp = mul(r.x, r.p), x2p = mul(sq(r.x), r.p), dp = mul(sq(sub(r.x, mu)), r.p);
        const cells = [tex(tx(r.x)), tex(tx(r.p)), cellProd(par(r.x), tx(r.p), xp, small), cellProd(pb(r.x) + '^2', tx(r.p), x2p, small), cellProd('\\left(' + tx(r.x) + '-' + par(mu) + '\\right)^2', tx(r.p), dp, small && ex(mu))];
        if (opts.pre) cells.unshift(opts.pre.cell(r));
        return cells;
      });
      if (D.hidden.length) {
        const hs = D.hidden;
        const cells = [tex(vp(hs[0].x).replace('−', '-') + ',\\dots,' + vp(hs[hs.length - 1].x).replace('−', '-')), tex(decStr(sum(hs.map(r => r.p)))), tex(decStr(sum(hs.map(r => mul(r.x, r.p))))), tex(decStr(sum(hs.map(r => mul(sq(r.x), r.p))))), tex(decStr(sum(hs.map(r => mul(sq(sub(r.x, mu)), r.p)))))];
        if (opts.pre) cells.unshift(opts.pre.agg(hs));
        rows.push({ cls: 's6-agg', cells });
      }
      const foot = ['sum', tex('\\sum p' + (ex(M.S0) || Math.abs(Number(M.S0) - 1) < 1e-12 ? '=1' : '\\approx ' + decStr(M.S0))), tex('E[' + nm + ']' + eqv(mu)), tex('E[' + nm + '^2]' + eqv(M.ex2)), tex('\\operatorname{Var}(' + nm + ')' + eqv(M.v1))];
      if (opts.pre) foot.unshift('');
      const tb = table(head, rows, { foot, scroll: rows.length > 14 });
      if (head.length > 5) tb.classList.add('s6-tight');
      return tb;
    }
    function drawTable(D, M) {
      const body = P.table.body;
      Lab.clear(body);
      P.table.sub('One row per value of ' + tex('X') + '. Each column multiplies something by ' + tex('p(x)') + '; its sum is a mean. ' + tex('\\mu=E[X]' + eqv(M.mu)) + ' is the sum of the third column — it is used in the last one.' + (D.rows.length > 10 ? ' (With this many rows the cells show only the products; the first rows of “How it is computed” show the pattern.)' : ''));
      body.appendChild(momentTable(D, M, 'X'));
      if (D.hidden.length) body.appendChild(K.note(tailNote(D), 'small muted'));
    }

    /* -------- steps */
    function drawSteps(D, M) {
      const body = P.steps.body;
      Lab.clear(body);
      const rs = D.rows, few = rs.length <= 6 && !D.hidden.length;
      const steps = [];
      steps.push({ html: '<b>Mean.</b> Multiply each value by its probability and add (the third column):',
        math: 'E[X]=\\sum_x x\\,p(x)=' + (few ? rs.map(r => par(r.x) + '\\cdot ' + tx(r.p)).join('+').replace(/\+-/g, '-') + '=' : '') + tx(M.mu) + decTail(M.mu) });
      steps.push({ html: '<b>Mean of the squares</b> (fourth column):',
        math: 'E[X^2]=\\sum_x x^2\\,p(x)=' + (few ? rs.map(r => pb(r.x) + '^2\\cdot ' + tx(r.p)).join('+').replace(/\+-/g, '-') + '=' : '') + tx(M.ex2) + decTail(M.ex2) });
      steps.push({ html: '<b>Variance, way 1 — the definition:</b> the average squared distance from ' + tex('\\mu=' + tx(M.mu)) + ' (last column):',
        math: '\\operatorname{Var}(X)=E\\left[(X-\\mu)^2\\right]=\\sum_x (x-\\mu)^2p(x)=' + (few && ex(M.mu) ? rs.map(r => '\\left(' + tx(r.x) + '-' + par(M.mu) + '\\right)^2\\cdot ' + tx(r.p)).join('+') + '=' : '') + tx(M.v1) + decTail(M.v1) });
      steps.push({ html: '<b>Variance, way 2 — the shortcut</b> from the notes, ' + tex('E[X^2]-(E[X])^2') + ':',
        math: '\\operatorname{Var}(X)=E[X^2]-(E[X])^2=' + tx(M.ex2) + '-' + '\\left(' + tx(M.mu) + '\\right)^2=' + tx(M.ex2) + '-' + tx(sq(M.mu)) + '=' + tx(M.v2) + decTail(M.v2),
        note: same(M.v1, M.v2) ? '<span class="cgood">✓ Both ways give the same variance.</span>' : 'The two ways differ only by rounding: ' + tex(decStr(M.v1) + '\\ \\text{vs}\\ ' + decStr(M.v2)) + '.' });
      steps.push({ html: '<b>Standard deviation</b> — the square root, back in the units of ' + tex('X') + ':', math: '\\operatorname{SD}(X)=\\sqrt{\\operatorname{Var}(X)}=' + sdTex(M.v1) });
      if (D.hidden.length) steps.push({ html: tailNote(D) });
      body.appendChild(stepsW(steps));
    }

    /* -------- E[g(X)] */
    function drawG(D, M) {
      const body = P.g.body;
      Lab.clear(body);
      const src = String(st.g || '').trim();
      let fn;
      try {
        const bad = Lab.expr.vars(src).filter(v => v !== 'x');
        if (bad.length) throw new Error('unknown name ' + bad.join(', ') + ' (use x)');
        fn = Lab.expr.compile(src);
      } catch (e) { body.appendChild(h('div', { class: 's6-err', html: 'Your <code>g(x)</code> is not readable: ' + esc(e.message) + '.' })); return; }
      const gv = r => { const v = fin(fn({ x: ex(r.x) ? r.x : F(r.xn) })); if (!Number.isFinite(Number(v))) throw new Error('not a finite number'); return v; };
      let rows, hid;
      try {
        rows = D.rows.map(r => ({ r, g: gv(r) }));
        hid = D.hidden.map(r => ({ r, g: Number(fn({ x: r.xn })) }));
        if (hid.some(z => !Number.isFinite(z.g))) throw new Error('not a finite number for a far value');
      } catch (e) {
        const badRow = D.rows.find(r => { try { gv(r); return false; } catch (er) { return true; } });
        body.appendChild(h('div', { class: 's6-err', html: tex('g') + ' cannot be worked out' + (badRow ? ' at ' + tex('x=' + tx(badRow.x)) : '') + ': ' + esc(e.message) + '. Pick another ' + tex('g') + ' or another ' + tex('X') + '.' }));
        return;
      }
      const Eg = sum(rows.map(z => mul(z.g, z.r.p)).concat(hid.map(z => z.g * Number(z.r.p))));
      let gmu, gmuErr = '';
      try { gmu = fin(fn({ x: ex(M.mu) ? M.mu : Number(M.mu) })); if (!Number.isFinite(Number(gmu))) throw new Error('not a finite number'); } catch (e) { gmuErr = e.message; }
      // is g a straight line on the values of X?
      // does g follow one straight line through every value of X — and through E[X] too?
      const pts = rows.map(z => [z.r.x, z.g]);
      let onLine = false, slope = null, icpt = null;
      if (pts.length >= 2) {
        slope = div(sub(pts[1][1], pts[0][1]), sub(pts[1][0], pts[0][0]));
        icpt = sub(pts[0][1], mul(slope, pts[0][0]));
        onLine = pts.every(([x, y]) => same(y, add(mul(slope, x), icpt))) && hid.every(z => Math.abs(z.g - (Number(slope) * z.r.xn + Number(icpt))) < 1e-9 * Math.max(1, Math.abs(z.g)));
      }
      const lineAtMu = onLine ? add(mul(slope, M.mu), icpt) : null;
      const linear = onLine && !gmuErr && same(gmu, lineAtMu);
      const lineTex = (m, k) => {
        const mx = isZero(m) ? '' : same(m, F(1)) ? 'x' : same(m, F(-1)) ? '-x' : tx(m) + 'x';
        if (isZero(k)) return mx || '0';
        return mx ? mx + (Number(k) < 0 ? '-' + tx(mul(k, F(-1))) : '+' + tx(k)) : tx(k);
      };
      P.g.sub('Your ' + tex('g') + ': <code>g(x) = ' + esc(src) + '</code>. The notes: ' + tex('E(g(X))=\\sum_i g(x_i)\\,p(x_i)') + ' — do <b>not</b> first replace ' + tex('X') + ' by ' + tex('E(X)') + ' inside ' + tex('g') + ', unless ' + tex('g') + ' is linear.');
      const small = rows.length <= 10;
      const trs = rows.map(z => [tex(tx(z.r.x)), tex(tx(z.r.p)), small ? '<code>' + esc(subst(src, { x: z.r.x })) + '</code> = ' + tex(tx(z.g)) : tex(tx(z.g)), cellProd(par(z.g), tx(z.r.p), mul(z.g, z.r.p), small)]);
      if (hid.length) trs.push({ cls: 's6-agg', cells: [tex(hid[0].r.xn + ',\\dots,' + hid[hid.length - 1].r.xn), tex(decStr(sum(hid.map(z => z.r.p)))), '…', tex(decStr(hid.reduce((s0, z) => s0 + z.g * Number(z.r.p), 0)))] });
      body.appendChild(table([tex('x'), tex('p(x)'), tex('g(x)'), tex('g(x)\\cdot p(x)')], trs, { foot: ['sum', '', '', tex('E[g(X)]' + eqv(Eg))], scroll: trs.length > 14 }));
      const box = h('div', { class: 's6-cmp' });
      const left = h('div'), right = h('div');
      Lab.setHTML(left, '<div class="s6-cmp-h">The right way: average the values of ' + tex('g') + '</div>' + Lab.tex('E[g(X)]=\\sum_x g(x)\\,p(x)' + eqv(Eg)));
      Lab.setHTML(right, '<div class="s6-cmp-h">Put ' + tex('E[X]') + ' inside ' + tex('g') + '</div>' + (gmuErr ? '<span class="cbad">' + tex('g(E[X])') + ' cannot be worked out: ' + esc(gmuErr) + '.</span>' : Lab.tex('g(E[X])=g\\left(' + tx(M.mu) + '\\right)' + eqv(gmu)) + '<div class="small muted"><code>' + esc(subst(src, { x: ex(M.mu) ? M.mu : Number(dec(M.mu, 6)) })) + '</code></div>'));
      box.append(left, right);
      body.appendChild(box);
      let verdict;
      if (gmuErr) verdict = 'Only ' + tex('E[g(X)]') + ' makes sense here.';
      else if (pts.length < 2 && !hid.length) verdict = tex('X') + ' has only one value, so ' + tex('E[g(X)]') + ' and ' + tex('g(E[X])') + ' are both ' + tex('g') + ' of that value — equal for every ' + tex('g') + '.';
      else if (linear) verdict = '<b class="cgood">Equal:</b> your ' + tex('g') + ' is the straight line ' + tex('g(x)=' + lineTex(slope, icpt)) + ' at every value of ' + tex('X') + ' and at ' + tex('E[X]') + ', and ' + tex('E[aX+b]=aE[X]+b') + '. A linear ' + tex('g') + ' is the only case where you may put ' + tex('E[X]') + ' inside.';
      else if (same(Eg, gmu)) verdict = '<b>Equal by coincidence</b> for this ' + tex('X') + ' — ' + tex('g') + ' is not linear, so in general the two differ.';
      else verdict = '<b class="cbad">Different:</b> ' + tex('E[g(X)]-g(E[X])=' + tx(Eg) + '-' + par(gmu) + eqv(sub(Eg, gmu))) + '. ' + tex('g') + ' is not linear, so ' + tex('E[g(X)]\\ne g(E[X])') + '.' +
        (onLine ? ' (On the values of ' + tex('X') + ' alone your ' + tex('g') + ' happens to follow the line ' + tex('y=' + lineTex(slope, icpt)) + ', but at ' + tex('E[X]' + eqv(M.mu)) + ' the line gives ' + tex(tx(lineAtMu)) + ' while ' + tex('g') + ' gives ' + tex(tx(gmu)) + '.)' : '') +
        (/^\s*x\s*\^\s*2\s*$/.test(src) ? ' For ' + tex('g(x)=x^2') + ' the gap is exactly ' + tex('E[X^2]-(E[X])^2=\\operatorname{Var}(X)' + eqv(M.v1)) + ' — never negative.' : '');
      body.appendChild(K.note(verdict, 's6-verdict'));
    }

    /* -------- Y = aX + b */
    function drawLin(D, M) {
      const body = P.lin.body;
      Lab.clear(body);
      const a = toQ(st.a), b = toQ(st.b);
      const Y = linModel(D, a, b);
      const MY = moments(Y);
      const ytx = 'Y=' + (same(a, F(1)) ? '' : same(a, F(-1)) ? '-' : tx(a)) + 'X' + (isZero(b) ? '' : Number(b) < 0 ? '-' + tx(mul(b, F(-1))) : '+' + tx(b));
      P.lin.sub('You chose ' + tex('a=' + tx(a)) + ' and ' + tex('b=' + tx(b)) + ', so ' + tex(ytx) + '. Every value ' + tex('x') + ' moves to ' + tex('y=ax+b') + ' and keeps its probability. Below, ' + tex('Y') + '’s own table — then the three rules from the notes, checked.');
      if (Y.merged) body.appendChild(K.note('With ' + tex('a=0') + ' every value of ' + tex('X') + ' lands on the same number ' + tex('y=b=' + tx(b)) + ': ' + tex('Y') + ' is the constant ' + tx(b) + ' with probability 1.', 'small'));
      const sorted = Y.rows.slice().sort((p, q) => p.xn - q.xn);
      body.appendChild(K.pmfChart(sorted.map(r => ({ x: r.xn, p: r.p, label: tx(r.p) })), { xName: 'Y', height: 150, tone: 'z', showValues: sorted.length <= 12 }));
      body.appendChild(linCdf(Y, sorted, a, b, MY, ytx));
      const DY = { rows: Y.rows, hidden: Y.hidden, tail: Y.tail };
      const yRule = 'y=' + (same(a, F(1)) ? '' : same(a, F(-1)) ? '-' : par(a) + '\\,') + 'x' + (isZero(b) ? '' : Number(b) < 0 ? '-' + tx(mul(b, F(-1))) : '+' + tx(b));
      body.appendChild(K.note(tex('Y') + '’s own table. Its mean ' + tex('\\mu_Y=E[Y]=\\sum y\\,p(y)' + eqv(MY.mu)) + ' (sum of the ' + tex('y\\cdot p(y)') + ' column) is used in the last column.', 'small muted'));
      body.appendChild(momentTable(DY, MY, 'Y', Y.merged ? { compact: true } : { compact: true, head0: tex(yRule), pre: { head: tex('x'), cell: r => tex(tx(r.from.x)), agg: hs => tex(hs[0].from.xn + ',\\dots,' + hs[hs.length - 1].from.xn) } }));
      const EYf = add(mul(a, M.mu), b), VYf = mul(sq(a), M.v1);
      const absA = Number(a) < 0 ? mul(a, F(-1)) : a;
      const SDYf = mul(absA, M.sd);
      body.appendChild(checkList([
        { what: tex('E[Y]'), rule: tex('aE[X]+b=' + par(a) + '\\cdot ' + par(M.mu) + (Number(b) < 0 ? '-' + tx(mul(b, F(-1))) : '+' + tx(b)) + eqv(EYf)), table: tex('\\sum y\\,p(y)' + eqv(MY.mu)), ok: same(EYf, MY.mu) },
        { what: tex('\\operatorname{Var}(Y)'), rule: tex('a^2\\operatorname{Var}(X)=' + pb(a) + '^2\\cdot ' + par(M.v1) + eqv(VYf)), table: tex('\\sum (y-\\mu_Y)^2p(y)' + eqv(MY.v1)), ok: same(VYf, MY.v1) },
        { what: tex('\\operatorname{SD}(Y)'), rule: tex('|a|\\,\\operatorname{SD}(X)=' + tx(absA) + '\\cdot ' + (ex(M.sd) ? tx(M.sd) : decStr(M.sd)) + eqv(SDYf)), table: tex('\\sqrt{\\operatorname{Var}(Y)}' + eqv(MY.sd)), ok: same(SDYf, MY.sd) },
      ], 'Rule from the notes:', 'From ' + tex('Y') + '’s own table:'));
      body.appendChild(K.note('Why: ' + tex('b') + ' slides every value by the same amount, so the centre moves by ' + tex('b') + ' but the distances from the centre do not change — no ' + tex('b') + ' in ' + tex('\\operatorname{Var}') + '. ' + tex('a') + ' stretches every distance from the centre by ' + tex('|a|') + ', so squared distances grow by ' + tex('a^2') + '.', 'small muted'));
    }

    /* -------- X + W */
    function drawSum(D, M) {
      const body = P.sum.body;
      Lab.clear(body);
      const DW = distModel(wRes, 'W');
      if (DW.pending) return;
      if (!DW.ok) { body.appendChild(h('div', { class: 's6-err', html: DW.err })); return; }
      const MW = moments(DW);
      const S = sumModel(D, DW);
      if (!S.rows.length) { body.appendChild(h('div', { class: 's6-err', text: 'X + W has no values to show.' })); return; }
      const MS = moments(S);
      P.sum.sub('Your ' + tex('W') + ': ' + (DW.fam === 'custom' ? 'the PMF you typed' : tex('W\\sim ' + DW.res.tex)) + ', independent of ' + tex('X') + '. Independence means ' + tex('P(X=x,\\,W=w)=p_X(x)\\,p_W(w)') + ', so ' + tex('P(X+W=s)=\\sum_x p_X(x)\\,p_W(s-x)') + '.');
      const grid = h('div', { class: 's6-stack2' });
      const cw = h('div'), cs = h('div');
      cw.appendChild(K.note('PMF of ' + tex('W') + ': ' + tex('E[W]' + eqv(MW.mu)) + ', ' + tex('\\operatorname{Var}(W)' + eqv(MW.v1)), 'small'));
      cw.appendChild(K.pmfChart(DW.rows.map(r => ({ x: r.xn, p: r.p, label: tx(r.p) })), { xName: 'W', height: 110, tone: 'y', showValues: DW.rows.length <= 14 }));
      const sPick = st.sPick != null && S.rows.some(r => Math.abs(r.xn - st.sPick) < 1e-9) ? st.sPick : S.rows.reduce((m0, r) => (Number(r.p) > Number(m0.p) ? r : m0), S.rows[0]).xn;
      cs.appendChild(K.note('PMF of ' + tex('X+W') + ' (tap a bar to see how it is made):', 'small'));
      cs.appendChild(K.pmfChart(S.rows.map(r => ({ x: r.xn, p: r.p, label: tx(r.p), hot: Math.abs(r.xn - sPick) < 1e-9 })), { xName: 'X+W', height: 150, tone: 'z', showValues: S.rows.length <= 14, onPick: v => { st.sPick = v; save(); drawSum(D, M); } }));
      grid.append(cw, cs);
      body.appendChild(grid);
      // how one bar is made
      const ax = D.rows.concat(D.hidden), wmap = new Map(DW.rows.concat(DW.hidden).map(r => [String(Math.round(r.xn * 1e9) / 1e9), r]));
      const terms = ax.map(r => ({ r, w: wmap.get(String(Math.round((sPick - r.xn) * 1e9) / 1e9)) })).filter(z => z.w && Number(z.r.p) > 0 && Number(z.w.p) > 0);
      const pS = S.rows.concat(S.hidden).find(r => Math.abs(r.xn - sPick) < 1e-9);
      const tt = terms.slice(0, 6).map(z => 'p_X(' + tx(z.r.x) + ')\\,p_W(' + tx(z.w.x) + ')');
      const tn = terms.slice(0, 6).map(z => tx(z.r.p) + '\\cdot ' + tx(z.w.p));
      body.appendChild(K.note(tex('P(X+W=' + vp(sPick).replace('−', '-') + ')=' + tt.join('+') + (terms.length > 6 ? '+\\dots' : '') + (terms.length <= 6 ? '=' + tn.join('+') : '') + eqv(pS ? pS.p : 0)) + ' <span class="muted">(' + terms.length + ' pair' + (terms.length === 1 ? '' : 's') + ' ' + tex('(x,\\,w)') + ' with ' + tex('x+w=' + vp(sPick).replace('−', '-')) + ')</span>', 's6-read small'));
      body.appendChild(sumCdf(S, DW, MS, MW));
      body.appendChild(momentTable(S, MS, 'S'));
      body.appendChild(K.note(tex('S=X+W') + ' — its own table, built from the PMF above.' + (S.hidden.length ? ' The italic row adds the values after ' + tex('s=' + S.rows[S.rows.length - 1].xn) + '.' : ''), 'small muted'));
      const VS = add(M.v1, MW.v1);
      body.appendChild(checkList([
        { what: tex('E[X+W]'), rule: tex('E[X]+E[W]=' + tx(M.mu) + '+' + par(MW.mu) + eqv(add(M.mu, MW.mu))), table: tex('\\sum s\\,p(s)' + eqv(MS.mu)), ok: same(add(M.mu, MW.mu), MS.mu), note: 'Holds always — the notes: the sum rule needs no independence.' },
        { what: tex('\\operatorname{Var}(X+W)'), rule: tex('\\operatorname{Var}(X)+\\operatorname{Var}(W)=' + tx(M.v1) + '+' + par(MW.v1) + eqv(VS)), table: tex('\\sum (s-\\mu_S)^2p(s)' + eqv(MS.v1)), ok: same(VS, MS.v1), note: 'Holds here because ' + tex('X') + ' and ' + tex('W') + ' are independent.' },
        { what: tex('\\operatorname{SD}(X+W)'), rule: tex('\\sqrt{\\operatorname{Var}(X)+\\operatorname{Var}(W)}=' + sdTex(VS)), table: tex('\\sqrt{\\operatorname{Var}(S)}' + eqv(MS.sd)), ok: same(sqrtQ(VS), MS.sd), note: 'Not ' + tex('\\operatorname{SD}(X)+\\operatorname{SD}(W)=' + (ex(M.sd) ? tx(M.sd) : decStr(M.sd)) + '+' + (ex(MW.sd) ? tx(MW.sd) : decStr(MW.sd)) + eqv(add(M.sd, MW.sd))) + ' — standard deviations do not add.' },
      ], 'Rule from the notes:', 'From the table of ' + tex('S') + ':'));
      body.appendChild(K.note('In the notes these are written with ' + tex('Y') + ': ' + tex('\\operatorname{Var}(X+Y)=\\operatorname{Var}(X)+\\operatorname{Var}(Y)') + ' for independent ' + tex('X, Y') + '. Here the second variable is called ' + tex('W') + ' so it is not confused with ' + tex('Y=aX+b') + ' above. Without independence the variances need not add.', 'small muted'));
    }
    /** The CDF of X + W (or of W), under the two PMFs. */
    function sumCdf(S, DW, MS, MW) {
      const box = h('div', { class: 's6-cdfblk' });
      const seg = Lab.seg([{ label: 'CDF of ' + tex('X+W'), value: 'S' }, { label: 'CDF of ' + tex('W'), value: 'W' }], cdfPick, v => { cdfPick = v; paint(); });
      seg.classList.add('s6-cdfseg');
      const note = h('div'), host = h('div');
      box.append(seg, note, host);
      function paint() {
        Lab.clear(note);
        Lab.clear(host);
        if (cdfPick === 'W') {
          const rows = DW.rows.slice().sort((p, q) => p.xn - q.xn);
          const start = rows.find(r => r.xn >= Number(MW.mu) - 1e-9) || rows[rows.length - 1];
          note.appendChild(K.note('<b>The CDF of ' + tex('W') + '</b>, ' + tex('F_W(t)=P(W\\le t)') + ': add ' + tex('p_W(w)') + ' for every value ' + tex('w\\le t') + ' (the bars of the small PMF of ' + tex('W') + ').', 'small'));
          host.appendChild(K.cdfChart(cdfDist(rows), { xName: 'W', t: Number(start.x), truncated: DW.hidden.length > 0 }));
        } else {
          const start = S.rows.find(r => r.xn >= Number(MS.mu) - 1e-9) || S.rows[S.rows.length - 1];
          note.appendChild(K.note('<b>The CDF of ' + tex('X+W') + '</b>, ' + tex('F_{X+W}(t)=P(X+W\\le t)') + ': add the bars of the PMF of ' + tex('X+W') + ' from the left, up to ' + tex('t') + '.', 'small'));
          host.appendChild(K.cdfChart(cdfDist(S.rows), { xName: 'X+W', t: Number(start.x), truncated: S.hidden.length > 0 || Number(S.tail) > 0 }));
        }
      }
      paint();
      return box;
    }

    /* -------- Bernoulli and uniform formulas */
    function drawFam(D, M) {
      const body = P.fam.body;
      Lab.clear(body);
      const q = D.res.q || {};
      const items = [];
      let fam = D.fam, p = null, lo = null, hi = null;
      if (fam === 'custom') {
        const vs = D.rows.map(r => r.xn);
        if (D.rows.length === 2 && vs[0] === 0 && vs[1] === 1) { fam = 'bernoulli'; p = D.rows[1].p; }
        else if (vs.every((v, i) => v === vs[0] + i) && Number.isInteger(vs[0]) && D.rows.every(r => same(r.p, D.rows[0].p))) { fam = 'uniform'; lo = vs[0]; hi = vs[vs.length - 1]; }
      } else if (fam === 'bernoulli') p = q.p;
      else if (fam === 'uniform') { lo = D.rows[0].xn; hi = D.rows[D.rows.length - 1].xn; }
      const row = (what, rule, val, tab) => ({ what, rule: tex(rule + eqv(val)), table: tex((what.includes('Var') ? '\\sum (x-\\mu)^2p(x)' : '\\sum x\\,p(x)') + eqv(tab)), ok: same(val, tab) });
      if (fam === 'bernoulli') {
        const pp = toQ(p), qq = sub(F(1), pp);
        body.appendChild(K.note((D.fam === 'custom' ? 'Your PMF has values 0 and 1 only, so it is a <b>Bernoulli</b> with ' : 'Your ' + tex('X') + ' is <b>Bernoulli</b> with ') + tex('p=P(X=1)=' + tx(pp)) + '. From the notes: ' + tex('E(X)=p') + ', ' + tex('\\operatorname{Var}(X)=p(1-p)') + '. Why: ' + tex('E[X]=0\\cdot(1-p)+1\\cdot p=p') + ' and, since ' + tex('0^2=0') + ' and ' + tex('1^2=1') + ', ' + tex('E[X^2]=p') + ' too, so ' + tex('\\operatorname{Var}=p-p^2=p(1-p)') + '.', 'small'));
        items.push(row(tex('E[X]'), 'p=' + tx(pp), pp, M.mu));
        items.push(row(tex('\\operatorname{Var}(X)'), 'p(1-p)=' + tx(pp) + '\\cdot ' + tx(qq), mul(pp, qq), M.v1));
      } else if (fam === 'uniform') {
        const n = hi - lo + 1, shift = lo - 1;
        const En = F(n + 1, 2), Vn = F(n * n - 1, 12);
        body.appendChild(K.note((D.fam === 'custom' ? 'Your PMF puts the same probability on each whole number from ' + lo + ' to ' + hi + ', so it is <b>discrete uniform</b>' : 'Your ' + tex('X') + ' is <b>discrete uniform</b>') + ' on ' + tex('\\{' + lo + ',\\dots,' + hi + '\\}') + ': ' + tex('n=' + hi + '-' + par(F(lo)) + '+1=' + n) + ' values, each with probability ' + tex('\\frac{1}{n}=\\frac{1}{' + n + '}') + '. The notes give ' + tex('E(X)=\\frac{n+1}{2}') + ' and ' + tex('\\operatorname{Var}(X)=\\frac{n^2-1}{12}') + ' for the values ' + tex('\\{1,\\dots,n\\}') + '.' + (shift ? ' Yours start at ' + lo + ', not 1: ' + tex('X=U+' + par(F(shift))) + ' where ' + tex('U') + ' is uniform on ' + tex('\\{1,\\dots,' + n + '\\}') + '. Adding a constant moves the mean by it and leaves the variance alone.' : ''), 'small'));
        items.push(row(tex('E[X]'), (shift ? 'E[U]+' + par(F(shift)) + '=' : '') + '\\frac{n+1}{2}' + (shift ? '+' + par(F(shift)) : '') + '=\\frac{' + n + '+1}{2}' + (shift ? '+' + par(F(shift)) : ''), add(En, F(shift)), M.mu));
        items.push(row(tex('\\operatorname{Var}(X)'), (shift ? '\\operatorname{Var}(U)=' : '') + '\\frac{n^2-1}{12}=\\frac{' + n + '^2-1}{12}', Vn, M.v1));
      } else if (fam === 'binomial') {
        const pp = toQ(q.p), n = q.n;
        body.appendChild(K.note('Your ' + tex('X\\sim\\text{Bin}(' + n + ',' + tx(pp) + ')') + '. Its formulas come in Week 11 (' + tex('X') + ' is a sum of ' + n + ' independent Bernoulli(' + tex(tx(pp)) + ') variables, so ' + tex('E') + ' and ' + tex('\\operatorname{Var}') + ' add up ' + n + ' times):', 'small'));
        items.push(row(tex('E[X]'), 'np=' + n + '\\cdot ' + tx(pp), mul(F(n), pp), M.mu));
        items.push(row(tex('\\operatorname{Var}(X)'), 'np(1-p)=' + n + '\\cdot ' + tx(pp) + '\\cdot ' + tx(sub(F(1), pp)), mul(mul(F(n), pp), sub(F(1), pp)), M.v1));
      } else if (fam === 'poisson') {
        const lam = q['λ'];
        body.appendChild(K.note('Your ' + tex('X\\sim\\text{Poisson}(' + lam + ')') + '. Week 11 gives ' + tex('E(X)=\\operatorname{Var}(X)=\\lambda') + ':', 'small'));
        items.push(row(tex('E[X]'), '\\lambda=' + lam, lam, M.mu));
        items.push(row(tex('\\operatorname{Var}(X)'), '\\lambda=' + lam, lam, M.v1));
      } else if (fam === 'geometric') {
        const pp = toQ(q.p);
        body.appendChild(K.note('Your ' + tex('X\\sim\\text{Geometric}(' + tx(pp) + ')') + ' on ' + tex('\\{1,2,\\dots\\}') + ' (the toss of the first success). Standard results, not in the Statistics I notes: ' + tex('E(X)=\\frac1p') + ', ' + tex('\\operatorname{Var}(X)=\\frac{1-p}{p^2}') + ':', 'small'));
        items.push(row(tex('E[X]'), '\\frac{1}{p}=\\frac{1}{' + tx(pp) + '}', div(F(1), pp), M.mu));
        items.push(row(tex('\\operatorname{Var}(X)'), '\\frac{1-p}{p^2}=\\frac{' + tx(sub(F(1), pp)) + '}{' + par(pp) + '^2}', div(sub(F(1), pp), sq(pp)), M.v1));
      } else {
        body.appendChild(K.note('Your PMF is not Bernoulli (values 0 and 1 only) and not uniform on whole numbers, so there is no shortcut formula: the table above <b>is</b> the calculation. Load one of the two Week 10 examples to see their formulas checked:', 'small'));
      }
      if (items.length) body.appendChild(checkList(items, 'Formula:', 'From the table:'));
      const tries = h('div', { class: 'btn-row' });
      tries.appendChild(Lab.button('Try Bernoulli(p = 1/4)', () => { st.x.fam = 'bernoulli'; st.x.params.bernoulli = { p: '1/4' }; changed(); xRes = null; rebuild(); }, 'btn sm'));
      tries.appendChild(Lab.button('Try uniform on {1, …, 8}', () => { st.x.fam = 'uniform'; st.x.params.uniform = { a: 1, b: 8 }; changed(); xRes = null; rebuild(); }, 'btn sm'));
      body.appendChild(tries);
    }

    /* -------- long-run average */
    function buildSim() {
      const body = P.sim.body;
      const btns = h('div', { class: 'btn-row' });
      [1, 10, 100, 1000, 10000].forEach(n => btns.appendChild(Lab.button('Run ' + fmtInt(n) + '×', () => runSim(n), n === 100 ? 'btn primary sm' : 'btn sm')));
      btns.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => resetSim(), 'btn ghost sm'));
      P.simStat = h('div', { class: 'ps-stat' });
      P.simRecent = h('div', { class: 'ps-recent' });
      P.simChart = h('div', { class: 'ps-chart' });
      body.append(btns, P.simStat, P.simRecent, P.simChart);
      resetSim();
    }
    function resetSim() { sim = { n: 0, total: 0, hist: [], recent: [] }; paintSim(); }
    function runSim(n) {
      if (!last) return;
      const D = last.DX;
      const all = D.rows.concat(D.hidden);
      if (!cum) { let acc = 0; cum = all.map(r => (acc += Number(r.p))); }
      for (let t = 0; t < n; t++) {
        const u = Math.random() * cum[cum.length - 1];
        let lo = 0, hi = cum.length - 1;
        while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] > u) hi = mid; else lo = mid + 1; }
        const x = all[lo].xn;
        sim.n++; sim.total += x;
        sim.recent.push(x);
        if (sim.recent.length > 14) sim.recent.shift();
        sim.hist.push(sim.total / sim.n);
      }
      if (sim.hist.length > 700) { const step = sim.hist.length / 700; sim.hist = Array.from({ length: 700 }, (_, k) => sim.hist[Math.floor(k * step)]); }
      paintSim();
    }
    function paintSim() {
      if (!P.simStat || !last) return;
      const { DX: D, M } = last;
      const mu = Number(M.mu);
      Lab.setHTML(P.simStat, sim.n
        ? 'Draws: ' + tex('n=' + K.intTex(sim.n)) + ' · sum of the draws ' + tex('=' + Lab.fmtDec(sim.total, 4).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1{,}')) + ' · average ' + tex('=\\frac{\\text{sum}}{n}=' + Lab.fmtDec(sim.total / sim.n, 4)) + ' · ' + tex('E[X]' + eqv(M.mu)) + ' · gap ' + tex('=' + Lab.fmtDec(Math.abs(sim.total / sim.n - mu), 4))
        : '<span class="muted">No draws yet. Press a button: each draw picks a value of ' + tex('X') + ' with probability ' + tex('p(x)') + '.</span>');
      Lab.clear(P.simRecent);
      sim.recent.slice().reverse().forEach(x => P.simRecent.appendChild(h('span', { class: 'ps-seq', text: Lab.fmtVal(x) })));
      Lab.clear(P.simChart);
      const xs = D.rows.map(r => r.xn);
      let lo = Math.min(...xs), hi = Math.max(...xs);
      if (D.hidden.length) hi = Math.max(hi, mu + 3 * Number(M.sd));
      if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
      const Wd = 640, H = 180, pl = 44, pr = 12, pt = 12, pb = 24;
      const Y = v => pt + (1 - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (H - pt - pb);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'ps-svg', role: 'img', 'aria-label': 'running average of the draws' });
      [lo, (lo + hi) / 2, hi].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(v), y2: Y(v), class: 'ps-grid' })); s.appendChild(svg('text', { x: pl - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'ps-tick' }, Lab.fmtDec(v, 2))); });
      s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(mu), y2: Y(mu), class: 'ps-theory' }));
      s.appendChild(svg('text', { x: Wd - pr, y: Y(mu) - 6, 'text-anchor': 'end', class: 'ps-tlabel' }, 'E[X] = ' + Lab.fmtDec(mu, 4)));
      if (sim.hist.length > 1) {
        const n = sim.hist.length;
        const X = k => pl + (k / (n - 1)) * (Wd - pl - pr);
        s.appendChild(svg('path', { d: sim.hist.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '), class: 'ps-line' }));
      }
      s.appendChild(svg('text', { x: (Wd + pl) / 2, y: H - 5, 'text-anchor': 'middle', class: 'ps-tick' }, sim.n ? 'average of the first 1 … ' + fmtInt(sim.n) + ' draws' : 'average of the draws so far'));
      P.simChart.appendChild(s);
    }
  }
})();
