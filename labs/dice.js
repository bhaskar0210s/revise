/* Dice lab, part 1: describe data (tables, summaries, two variables), counting, the sample space of two dice,
   events, conditional probability, Bayes, one die's PMF and CDF, expectation and variance.
   Topic ids are fixed in labs.json; the other Dice topics are in dice-2.js. Every topic takes its values from the
   link (?f=6&n=20) and keeps them there, so a week page can open it on a lecture's numbers. A die has f = 4, 6, 8,
   10, 12 or 20 faces. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, TD, h } = K;

  /* ================================================================ numbers */
  const FACES = [4, 6, 8, 10, 12, 20];
  const facesOf = v => (FACES.includes(+v) ? +v : 6);
  const whole = (v, lo, hi, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d; };
  const upTo = n => Array.from({ length: n }, (_, i) => i + 1);
  const add = arr => arr.reduce((a, b) => a.add(b), F(0));
  const safe = s => REV.esc(String(s)).replace(/\$/g, '&#36;');
  const dec = (x, k = 4) => String(+(+x).toFixed(k));
  const minus = s => String(s).replace(/-/g, '−');
  const ends = fr => fr.isInt() || fr.exactDecimal(6);
  /** TeX of an exact number: 3, 3.45 or \frac{7}{3} */
  const tx = fr => { fr = F(fr); return fr.isInt() || !fr.exactDecimal(6) ? fr.tex() : dec(fr.num(), 6); };
  /** the same, in brackets when negative (inside sums and products) */
  const tb = fr => (F(fr).cmp(0) < 0 ? '(' + tx(fr) + ')' : tx(fr));
  /** a square: 2^2, (-1.5)^2, \left(\frac{7}{3}\right)^2 */
  const sq = fr => { fr = F(fr); return fr.cmp(0) < 0 || !ends(fr) ? '\\left(' + tx(fr) + '\\right)^2' : tx(fr) + '^2'; };
  /** with a decimal when the fraction does not end: \frac{7}{3} \approx 2.3333 */
  const txd = fr => { fr = F(fr); return ends(fr) ? tx(fr) : fr.tex() + ' \\approx ' + fr.dec(4); };
  /** plain text for big tables: 3, 3.45 or 7/3 */
  const pl = fr => { fr = F(fr); return minus(fr.isInt() ? fr.n.toString() : fr.exactDecimal(6) ? dec(fr.num(), 6) : fr.n + '/' + fr.d); };
  const raw = (a, b) => '\\frac{' + a + '}{' + b + '}';
  /** a count over a total, then reduced, with its decimal: \frac{6}{36} = \frac{1}{6} \approx 0.1667 */
  const ratio = (a, b) => { const r = F(a, b); return raw(a, b) + (r.n === BigInt(a) && r.d === BigInt(b) ? (r.exactDecimal(4) ? ' = ' : ' \\approx ') + r.dec(4) : ' = ' + TD(r)); };
  /** relations for a count over a total: = \frac{6}{36} = \frac{1}{6} \approx 0.1667 */
  const approx = x => { if (x === 0 || Math.abs(x) >= 0.001) return dec(x); let e = Math.floor(Math.log10(Math.abs(x))), m = +(x / 10 ** e).toFixed(3); if (Math.abs(m) >= 10) { m /= 10; e += 1; } return dec(m, 3) + ' \\times 10^{' + e + '}'; };
  const ratioRels = (a, b) => { const q = F(a, b), out = [['=', raw(a, b)]]; if (!(q.n === BigInt(a) && q.d === BigInt(b))) out.push(['=', q.tex()]); if (!q.isInt()) out.push([q.exactDecimal(4) ? '=' : '\\approx', approx(q.num())]); return out; };
  /** relations for an exact value: = \frac{1}{6} \approx 0.1667 */
  const valueRels = fr => { fr = F(fr); return fr.isInt() ? [['=', fr.tex()]] : [['=', fr.tex()], [fr.exactDecimal(4) ? '=' : '\\approx', approx(fr.num())]]; };
  /** relations for a square root: = 2, or \\approx 1.7078 */
  const rootRels = fr => { const e = rootOf(fr); return e ? [['=', tx(e)]] : [['\\approx', dec(Math.sqrt(F(fr).num()))]]; };
  /** an exact value for an answer: \\frac{1}{6} \\approx 0.1667, or 1.235 \\times 10^{-5} when it is tiny */
  const tdx = fr => valueRels(fr).map(([rel, v]) => rel + ' ' + v).join(' ').replace(/^= /, '');
  /** a tick after the last relation */
  const ticked = rels => rels.map((x, i) => (i === rels.length - 1 ? [x[0], x[1] + '\\ \\checkmark'] : x));
  const isqrt = n => { if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; };
  /** the exact square root of a fraction, when it has one */
  const rootOf = fr => { fr = F(fr); if (fr.n < 0n) return null; const a = isqrt(fr.n), b = isqrt(fr.d); return a * a === fr.n && b * b === fr.d ? F(a, b) : null; };
  const sqrtTx = fr => { const e = rootOf(fr); return '\\sqrt{' + tx(fr) + '} ' + (e ? '= ' + tx(e) : '\\approx ' + dec(Math.sqrt(F(fr).num()))); };
  const sqrtShort = fr => { const e = rootOf(fr); return e ? '= ' + tx(e) : '\\approx ' + dec(Math.sqrt(F(fr).num())); };
  /** a chain lhs = a = b …; a long sum is an array of terms (or { t: terms, op }). The kit wraps it after =, + or ×
      on a narrow phone, so it stays one line on a laptop */
  const fit = (lhs, rels) => lhs + ' ' + rels.map(([rel, c]) => rel + ' ' + (Array.isArray(c) ? c.join(' + ') : c && c.t ? c.t.join(c.op) : c)).join(' ');
  /** at most 60 terms: the first 30, a gap, the last 5 */
  const cap = t => (t.length <= 60 ? t : t.slice(0, 30).concat(['\\dots'], t.slice(-5)));
  /** two short equations, one under the other */
  const stack = (...rows) => '\\begin{aligned} ' + rows.join(' \\\\ ') + ' \\end{aligned}';
  const andList = a => (a.length === 1 ? String(a[0]) : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const ordinal = x => { const s = dec(x, 2); if (!/^\d+$/.test(s)) return s + 'th'; const m = +s % 100; return s + (m >= 11 && m <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[m % 10] || 'th')); };

  /* ================================================================ input */
  const LIMIT = 10n ** 12n;
  /** numbers typed as "3, 5 1; 6" (whole, decimal or fraction) → exact fractions; throws a message the learner can act on */
  function numbers(str, max, what) {
    const parts = String(str == null ? '' : str).split(/[\s,;]+/).filter(Boolean);
    if (!parts.length) throw new Error('Type at least one ' + what + ', separated by commas or spaces.');
    if (parts.length > max) throw new Error('At most ' + max + ' ' + what + 's, please (you typed ' + parts.length + ').');
    return parts.map(p => {
      let v;
      try { v = F.parse(p); } catch (e) { throw new Error('“' + safe(p) + '” is not a number. Write numbers like 4, 2.5 or 7/2, separated by commas.'); }
      if (v.n > LIMIT * v.d || -v.n > LIMIT * v.d || v.d > LIMIT) throw new Error('“' + safe(p) + '” is too large or has too many digits for this lab.');
      return v;
    });
  }
  /** typed die results: whole numbers 1 … f */
  function faceList(str, f, max) {
    return numbers(str, max, 'result').map(v => {
      if (!v.isInt() || v.cmp(1) < 0 || v.cmp(f) > 0) throw new Error('A die with ' + f + ' faces shows a whole number from 1 to ' + f + ', so ' + pl(v) + ' cannot be a result. Change the result or the number of faces.');
      return Number(v.n);
    });
  }
  const rollDie = (f, n, seed) => { const r = K.rng(seed); return Array.from({ length: n }, () => 1 + Math.floor(r() * f)); };
  const rollPairs = (f, n, seed) => { const r = K.rng(seed); return Array.from({ length: n }, () => [1 + Math.floor(r() * f), 1 + Math.floor(r() * f)]); };
  const heavyLast = f => upTo(f).map(i => (i === f ? 3 : 1)).join(',');
  /** the loaded die: one weight per face; each face's chance is its weight over the total weight */
  function weightsOf(str, f) {
    const ws = numbers(str, 20, 'weight');
    if (ws.length !== f) throw new Error('Give ' + f + ' weights, one for each face 1 to ' + f + ' (you gave ' + ws.length + ').');
    if (ws.some(w => w.cmp(0) < 0)) throw new Error('A weight cannot be negative.');
    const W = add(ws);
    if (W.isZero()) throw new Error('At least one weight must be more than 0.');
    return { ws, W, ps: ws.map(w => w.div(W)) };
  }

  /* ================================================================ controls */
  /** after the link's values were corrected (out of range, unknown), write the corrected ones back into the link */
  const tidyLink = (s, query) => { if (query && Object.keys(query).some(k => k in s.v && String(query[k]) !== String(s.v[k]))) s.set({}, true); };
  const facesSeg = (label, f, pick) => K.seg({ label, options: FACES.map(v => [v, String(v)]), value: f, onChange: v => pick(+v) });
  const tryRow = items => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }), h('div', { class: 'lk-presets' }, items.map(([label, go]) => h('button', { type: 'button', class: 'lk-chip', text: label, onclick: go }))));
  const bigButton = (text, go) => h('button', { type: 'button', class: 'btn', text, onclick: go });
  function weightField(s, redo) {
    const f = s.v.f;
    return h('div', { class: 'lk-field' },
      K.text({ label: 'Weights of the loaded die, faces 1 to ' + f, value: s.v.w, placeholder: heavyLast(f), onChange: w => s.set({ w }), help: 'A bigger weight makes a face more likely: its chance is its weight divided by the total weight.' }),
      h('div', { class: 'lk-presets' }, [['Last face ×3', heavyLast(f)], ['Falling', upTo(f).map(i => f + 1 - i).join(',')], ['Never the last face', upTo(f).map(i => (i === f ? 0 : 1)).join(',')]]
        .map(([label, w]) => h('button', { type: 'button', class: 'lk-chip', text: label, onclick: () => { s.set({ w }, true); redo(); } }))));
  }

  const { table, steps, answer, bars } = K;

  /* ================================================================ drawings */
  const diceRow = (vals, f, max = 120) => h('div', {}, h('div', { class: 'lk-outcomes', html: vals.slice(0, max).map(v => K.die(v, f, 26)).join('') }), vals.length > max ? K.p('… and ' + (vals.length - max) + ' more.') : null);
  const pairRow = (pairs, f, max = 40) => h('div', {}, h('div', { class: 'lk-outcomes', html: pairs.slice(0, max).map(([a, b]) => '<span class="lk-outcome">' + K.die(a, f, 22) + K.die(b, f, 22) + '</span>').join('') }), pairs.length > max ? K.p('… and ' + (pairs.length - max) + ' more rolls.') : null);
  /** round tick values for an axis from lo to hi */
  function ticks(lo, hi, count) {
    if (!(hi > lo)) { lo -= 1; hi += 1; }
    const rawStep = (hi - lo) / count, mag = 10 ** Math.floor(Math.log10(rawStep)), r = rawStep / mag;
    const step = (r < 1.5 ? 1 : r < 3 ? 2 : r < 7 ? 5 : 10) * mag;
    const out = [];
    for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(+v.toFixed(10));
    return out;
  }
  const tickText = v => minus(String(+(+v).toFixed(6)));
  /** the part of y = mx + c inside the box xr × yr, as [x0, y0, x1, y1] */
  function clipLine(m, c, xr, yr) {
    let t0 = 0, t1 = 1;
    const x0 = xr[0], dx = xr[1] - xr[0], y0 = m * x0 + c, dy = m * dx;
    if (Math.abs(dy) < 1e-12) { if (y0 < yr[0] || y0 > yr[1]) return null; }
    else {
      let ta = (yr[0] - y0) / dy, tz = (yr[1] - y0) / dy;
      if (ta > tz) [ta, tz] = [tz, ta];
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tz);
      if (t0 >= t1) return null;
    }
    return [x0 + t0 * dx, y0 + t0 * dy, x0 + t1 * dx, y0 + t1 * dy];
  }
  /** scatter plot: dots (bigger when a point repeats), dashed mean lines, the fitted line */
  function scatter({ xs, ys, xr, yr, xName, yName, fit, mx, my }) {
    const W = 420, H = 300, L = 54, R = 14, Tp = 14, B = 44;
    const X = v => L + (v - xr[0]) / (xr[1] - xr[0]) * (W - L - R);
    const Y = v => H - B - (v - yr[0]) / (yr[1] - yr[0]) * (H - B - Tp);
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'scatter plot of ' + yName + ' against ' + xName });
    ticks(xr[0], xr[1], 8).forEach(v => svg.append(K.sv('line', { x1: X(v), x2: X(v), y1: Tp, y2: H - B, class: 'grid' }), K.sv('text', { x: X(v), y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, tickText(v))));
    ticks(yr[0], yr[1], 6).forEach(v => svg.append(K.sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), K.sv('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, tickText(v))));
    svg.append(K.sv('line', { x1: X(mx), x2: X(mx), y1: Tp, y2: H - B, class: 'mark' }), K.sv('line', { x1: L, x2: W - R, y1: Y(my), y2: Y(my), class: 'mark' }),
      K.sv('text', { x: X(mx) + 4, y: Tp + 11, class: 'tick' }, 'x̄'), K.sv('text', { x: W - R - 4, y: Y(my) - 5, 'text-anchor': 'end', class: 'tick' }, 'ȳ'));
    if (fit) { const seg = clipLine(fit.m, fit.c, xr, yr); if (seg) svg.append(K.sv('line', { x1: X(seg[0]), y1: Y(seg[1]), x2: X(seg[2]), y2: Y(seg[3]), class: 'step' })); }
    const groups = new Map();
    xs.forEach((x, i) => { const k = x + ',' + ys[i]; groups.set(k, (groups.get(k) || 0) + 1); });
    groups.forEach((c, k) => {
      const [x, y] = k.split(',').map(Number);
      svg.append(K.sv('circle', { cx: X(x), cy: Y(y), r: Math.min(13, 3.5 + 1.9 * Math.sqrt(c)), class: 'dot', 'fill-opacity': 0.8 }, K.sv('title', {}, '(' + tickText(x) + ', ' + tickText(y) + ')' + (c > 1 ? ': ' + c + ' times' : ''))));
      if (c > 1) svg.append(K.sv('text', { x: X(x), y: Y(y) + 3.5, 'text-anchor': 'middle', style: 'font:700 9.5px var(--font);fill:var(--bg-elev);pointer-events:none' }, String(c)));
    });
    svg.append(K.sv('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis' }, xName),
      K.sv('text', { x: 12, y: (Tp + H - B) / 2, 'text-anchor': 'middle', class: 'axis', transform: 'rotate(-90 12 ' + (Tp + H - B) / 2 + ')' }, yName));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** horizontal box plot with the 1.5 IQR fences; numbers in */
  function boxPlot(b) {
    const W = 440, H = 146, L = 18, R = 18, yB = 66, bh = 34, axis = 112;
    let a = Math.min(b.min, b.lo), z = Math.max(b.max, b.hi);
    if (!(z > a)) { a -= 1; z += 1; }
    const pad = (z - a) * 0.04; a -= pad; z += pad;
    const X = v => L + (v - a) / (z - a) * (W - L - R);
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'box plot' });
    ticks(a, z, 7).forEach(v => svg.append(K.sv('line', { x1: X(v), x2: X(v), y1: 26, y2: axis, class: 'grid' }), K.sv('text', { x: X(v), y: axis + 18, 'text-anchor': 'middle', class: 'tick' }, tickText(v))));
    const near = Math.abs(X(b.hi) - X(b.lo)) < 120;
    [[b.lo, near ? '' : 'lower fence'], [b.hi, near ? 'fences' : 'upper fence']].forEach(([v, t]) => {
      svg.append(K.sv('line', { x1: X(v), x2: X(v), y1: 26, y2: axis - 4, class: 'mark' }));
      if (t) svg.append(K.sv('text', { x: near ? (X(b.lo) + X(b.hi)) / 2 : Math.min(W - 44, Math.max(44, X(v))), y: 17, 'text-anchor': 'middle', class: 'tick' }, t));
    });
    const ink = 'stroke:var(--ink-2);stroke-width:1.6';
    svg.append(
      K.sv('line', { x1: X(b.wl), x2: X(b.q1), y1: yB, y2: yB, style: ink }),
      K.sv('line', { x1: X(b.q3), x2: X(b.wh), y1: yB, y2: yB, style: ink }),
      K.sv('line', { x1: X(b.wl), x2: X(b.wl), y1: yB - 10, y2: yB + 10, style: ink }),
      K.sv('line', { x1: X(b.wh), x2: X(b.wh), y1: yB - 10, y2: yB + 10, style: ink }),
      K.sv('rect', { x: X(b.q1), y: yB - bh / 2, width: Math.max(1.5, X(b.q3) - X(b.q1)), height: bh, rx: 4, style: 'fill:var(--accent-soft);stroke:var(--accent);stroke-width:1.6' }),
      K.sv('line', { x1: X(b.med), x2: X(b.med), y1: yB - bh / 2, y2: yB + bh / 2, style: 'stroke:var(--pick);stroke-width:3' }));
    b.outs.forEach(v => svg.append(K.sv('circle', { cx: X(v), cy: yB, r: 4.5, class: 'open' }, K.sv('title', {}, 'outlier ' + tickText(v)))));
    svg.append(K.sv('line', { x1: L, x2: W - R, y1: axis, y2: axis, style: 'stroke:var(--line-2)' }));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** the PMF as bars with its balance point E[X] marked underneath */
  function pmfMean(xs, ps, mu) {
    const n = xs.length, W = Math.max(320, n * 34 + 60), H = 236, L = 44, B = 62, R = 10, Tp = 18;
    const vals = ps.map(p => p.num()), top = Math.max(1e-9, ...vals);
    const step = (W - L - R) / n, bw = Math.min(42, step * 0.7);
    const X = v => L + step * (v - xs[0]) + step / 2, Y = v => H - B - (v / top) * (H - B - Tp);
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'PMF with its mean' });
    for (let i = 0; i <= 4; i++) { const v = top * i / 4; svg.append(K.sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), K.sv('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(Math.round(v * 1000) / 1000))); }
    xs.forEach((x, i) => svg.append(
      K.sv('rect', { x: X(x) - bw / 2, y: Y(vals[i]), width: bw, height: Math.max(0, H - B - Y(vals[i])), rx: 3, class: 'bar' }, K.sv('title', {}, 'P(X = ' + x + ') = ' + ps[i].str())),
      K.sv('text', { x: X(x), y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, String(x))));
    const m = X(mu.num());
    svg.append(K.sv('line', { x1: m, x2: m, y1: Tp, y2: H - B, class: 'mark' }),
      K.sv('polygon', { points: (m - 8) + ',' + (H - B + 38) + ' ' + (m + 8) + ',' + (H - B + 38) + ' ' + m + ',' + (H - B + 24), style: 'fill:var(--pick)' }),
      K.sv('text', { x: Math.min(W - 70, Math.max(70, m)), y: H - 4, 'text-anchor': 'middle', class: 'axis' }, 'balance point E[X] = ' + tickText(+mu.num().toFixed(4))));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }

  /* ================================================================ two dice */
  const cellsOf = f => { const c = []; for (let i = 1; i <= f; i++) for (let j = 1; j <= f; j++) c.push([i, j]); return c; };
  const pairsText = (list, max = 24) => (list.length ? '{' + list.slice(0, max).map(([i, j]) => '(' + i + ', ' + j + ')').join(', ') + (list.length > max ? ', … and ' + (list.length - max) + ' more' : '') + '}' : '∅, no outcome at all');
  const twoDiceGrid = (f, cell) => K.grid(upTo(f), upTo(f), cell, { corner: '' });
  const tag = (a, b) => (a && b ? 'AB' : a ? 'A' : b ? 'B' : '·');
  const EVENTS = {
    sum: { pick: 'Sum is v', kind: 'sum', name: v => 'the sum is ' + v, test: (i, j, v) => i + j === v },
    'sum-ge': { pick: 'Sum is at least v', kind: 'sum', name: v => 'the sum is at least ' + v, test: (i, j, v) => i + j >= v },
    'sum-le': { pick: 'Sum is at most v', kind: 'sum', name: v => 'the sum is at most ' + v, test: (i, j, v) => i + j <= v },
    even: { pick: 'Sum is even', name: () => 'the sum is even', test: (i, j) => (i + j) % 2 === 0 },
    doubles: { pick: 'Doubles', name: () => 'doubles (both dice show the same face)', test: (i, j) => i === j },
    one: { pick: 'At least one v', kind: 'face', name: v => 'at least one die shows ' + v, test: (i, j, v) => i === v || j === v },
    first: { pick: 'First die shows v', kind: 'face', name: v => 'the first die shows ' + v, test: (i, j, v) => i === v },
    second: { pick: 'Second die shows v', kind: 'face', name: v => 'the second die shows ' + v, test: (i, j, v) => j === v },
    bigger: { pick: 'First die larger', name: () => 'the first die shows more than the second', test: (i, j) => i > j },
  };
  const evRange = (type, f) => (EVENTS[type].kind === 'sum' ? [2, 2 * f] : [1, f]);
  const evDefault = (type, f) => ({ sum: f + 1, 'sum-ge': 2 * f - 2, 'sum-le': 4, one: f, first: Math.min(4, f), second: Math.min(3, f) }[type] || 1);
  /** keep the link's events valid for f faces */
  function tidyEvents(s, keys) {
    keys.forEach(k => {
      if (!EVENTS[s.v[k]]) s.v[k] = 'sum';
      const E = EVENTS[s.v[k]];
      if (E.kind) { const [lo, hi] = evRange(s.v[k], s.v.f); s.v[k + 'v'] = whole(s.v[k + 'v'], lo, hi, evDefault(s.v[k], s.v.f)); }
    });
  }
  const eventOf = (type, v) => { const E = EVENTS[type]; return { name: E.name(v), test: (i, j) => E.test(i, j, v) }; };
  function eventControls(s, key, redo) {
    const type = s.v[key], E = EVENTS[type], K_ = key.toUpperCase();
    const out = [K.select({ label: 'Event $' + K_ + '$', options: Object.entries(EVENTS).map(([id, e]) => [id, e.pick]), value: type, onChange: t => { s.set({ [key]: t, [key + 'v']: evDefault(t, s.v.f) }, true); redo(); } })];
    if (E.kind) { const [lo, hi] = evRange(type, s.v.f); out.push(K.int({ label: (E.kind === 'sum' ? 'The sum $v$' : 'The face $v$') + ' in $' + K_ + '$', value: s.v[key + 'v'], min: lo, max: hi, onChange: v => s.set({ [key + 'v']: v }) })); }
    return out;
  }

  /* ================================================================ percentiles */
  /** the course's rule (Stats 1 Week 3, lecture 3.5): np whole → average of positions np and np + 1; otherwise round np up */
  function coursePct(sorted, p) {
    const n = sorted.length, np = p.mul(n);
    if (np.isInt()) {
      const k = Number(np.n);
      if (k >= n) return { np, whole: true, pos: [n], value: sorted[n - 1], last: true };
      return { np, whole: true, pos: [k, k + 1], value: sorted[k - 1].add(sorted[k]).div(2) };
    }
    const k = Number(np.n / np.d) + 1;
    return { np, whole: false, pos: [k], value: sorted[k - 1] };
  }
  /** Google Sheets' PERCENTILE: position p(n − 1) + 1, then part of the way to the next value */
  function sheetsPct(sorted, p) {
    const n = sorted.length, rank = p.mul(n - 1).add(1), i = Number(rank.n / rank.d), part = rank.sub(i);
    return i >= n ? sorted[n - 1] : sorted[i - 1].add(part.mul(sorted[i].sub(sorted[i - 1])));
  }

  const LECTURE_MARKS = '35, 38, 47, 58, 61, 66, 68, 68, 70, 79';
  const YS = {
    sum: { pick: 'Sum of the two dice', short: 'the sum', fn: (a, b) => a + b, range: f => [2, 2 * f] },
    second: { pick: 'The second die', short: 'the second die', fn: (a, b) => b, range: f => [1, f] },
    max: { pick: 'The larger face', short: 'the larger face', fn: (a, b) => Math.max(a, b), range: f => [1, f] },
    diff: { pick: 'First minus second', short: 'first minus second', fn: (a, b) => a - b, range: f => [1 - f, f - 1] },
  };
  /** the line y = mx + c, exact, and rounded when its numbers are long */
  function lineOf(m, c) {
    const slope = fmt => (m.isZero() ? '' : m.eq(1) ? 'x' : m.eq(-1) ? '-x' : fmt(m) + 'x');
    const rhs = fmt => (slope(fmt) ? slope(fmt) + (c.isZero() ? '' : c.cmp(0) < 0 ? ' - ' + fmt(c.neg()) : ' + ' + fmt(c)) : fmt(c));
    const near = fr => ends(fr) && +fr.num().toFixed(4) === fr.num();
    const exact = rhs(tx), round = rhs(fr => dec(fr.num()));
    return near(m) && near(c) ? { full: 'y = ' + exact, short: 'y = ' + exact } : { full: fit('y', [['=', exact], ['\\approx', round]]), short: 'y \\approx ' + round };
  }
  const strength = r => { const a = Math.abs(r); return a >= 0.9 ? 'a very strong' : a >= 0.7 ? 'a strong' : a >= 0.4 ? 'a moderate' : a >= 0.1 ? 'a weak' : 'almost no'; };

  REV.lab('dice', {
    /* ---------------------------------------------------------------- data */
    // ?f=6&n=20&seed=1               roll a die with f faces (4, 6, 8, 10, 12 or 20) n times (1–1000); seed = which rolls
    // ?src=typed&f=6&x=3,5,1,6,6     or type the results yourself (whole numbers 1 to f, at most 1000)
    data(el, query, ctx) {
      const s = K.state(ctx, { src: 'roll', f: 6, n: 20, seed: 1, x: '3, 5, 1, 6, 6, 2, 4, 6, 3, 1' }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        const v = s.v;
        v.src = v.src === 'typed' ? 'typed' : 'roll'; v.f = facesOf(v.f); v.n = whole(v.n, 1, 1000, 20); v.seed = whole(v.seed, 1, 1e9, 1);
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Roll a die again and again, then describe what came up: how often each face appeared (a frequency table), a bar chart and the most common face (the mode).'),
          K.seg({ label: 'Data', options: [['roll', 'Roll the die'], ['typed', 'Type results']], value: v.src, onChange: x => { s.set({ src: x }, true); redo(); } }),
          facesSeg('Faces on the die', v.f, f => { s.set({ f }, true); redo(); }),
          ...(v.src === 'roll'
            ? [K.int({ label: 'Number of rolls $n$', value: v.n, min: 1, max: 1000, onChange: n => s.set({ n }) }), bigButton('Roll again', () => s.set({ seed: v.seed + 1 }))]
            : [K.text({ label: 'Your results, separated by commas', value: v.x, placeholder: '3, 5, 1, 6', onChange: x => s.set({ x }) })]),
          tryRow([
            ['6 rolls', () => { s.set({ src: 'roll', n: 6 }, true); redo(); }],
            ['600 rolls', () => { s.set({ src: 'roll', n: 600 }, true); redo(); }],
            ['20 faces, 100 rolls', () => { s.set({ src: 'roll', f: 20, n: 100 }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, typed = s.v.src === 'typed';
        let rolls;
        if (typed) { try { rolls = faceList(s.v.x, f, 1000); } catch (e) { out.append(K.note(e.message, 'warn')); return; } }
        else rolls = rollDie(f, s.v.n, s.v.seed);
        const n = rolls.length, faces = upTo(f);
        const freq = faces.map(v => rolls.filter(r => r === v).length);
        const most = Math.max(...freq), modes = faces.filter(v => freq[v - 1] === most), noMode = modes.length === f;
        const times = c => c + (c === 1 ? ' time' : ' times');
        out.append(noMode
          ? answer('The mode of your ' + n + (typed ? ' results' : ' rolls'), '\\text{no mode}', 'Every face came up ' + times(most) + ', so no face stands out.')
          : answer('The mode of your ' + n + (typed ? ' results' : ' rolls'), (modes.length > 1 ? '\\text{modes} = ' + modes.slice(0, -1).join(', ') + '\\text{ and }' + modes[modes.length - 1] : '\\text{mode} = ' + modes[0]),
            (modes.length > 1 ? 'Faces ' + andList(modes) + ' each came up ' : 'Face ' + modes[0] + ' came up ') + times(most) + ' out of ' + n + (modes.length > 1 ? ': ' + (modes.length === 2 ? 'two modes (bimodal).' : modes.length + ' modes (multimodal).') : ', more often than any other face.')));

        out.append(K.card(typed ? 'Your ' + n + ' results' : 'Your ' + n + ' rolls', diceRow(rolls, f)));

        // the frequency table
        const rel = c => raw(c, n) + (F(c, n).exactDecimal(4) ? ' = ' : ' \\approx ') + F(c, n).dec(4);
        const tally = c => Array(Math.floor(c / 5)).fill('|||||').concat(c % 5 ? ['|'.repeat(c % 5)] : []).join(' ');
        const showTally = n <= 40;
        const rows = faces.map((v, i) => [String(v), ...(showTally ? [tally(freq[i])] : []), String(freq[i]), '$' + rel(freq[i]) + '$']);
        rows.push(['Total', ...(showTally ? [''] : []), String(n), '$' + raw(n, n) + ' = 1$']);
        const m0 = noMode ? 1 : modes[0];
        out.append(K.card('Frequency table',
          table(['Face', ...(showTally ? ['Tally'] : []), 'Frequency', 'Relative<br>frequency'], rows, { hi: new Set(noMode ? [] : modes.map(v => v - 1)) }),
          steps([
            { text: 'Count how many times each face came up. That count is the face’s <b>frequency</b>. All the counts together give the number of ' + (typed ? 'results' : 'rolls') + ':', tex: fit('\\sum f', [['=', freq.map(String)], ['=', String(n)]]) },
            { text: 'Divide each frequency by $n = ' + n + '$. The answer, the <b>relative frequency</b>, is the share of the ' + (typed ? 'results' : 'rolls') + ' that showed that face. For face ' + m0 + ':', tex: '\\text{relative frequency} = ' + rel(freq[m0 - 1]) },
            { text: 'Check: the relative frequencies add up to 1, because the frequencies add up to $n$.', tex: fit('\\sum \\frac{f}{n}', [['=', '\\frac{\\sum f}{n}'], ['=', raw(n, n)], ['=', '1\\ \\checkmark']]) },
            { text: 'The <b>mode</b> is the face with the highest frequency.', tex: noMode ? '\\text{no mode}' : stack('\\text{highest frequency} &= ' + most, '\\text{mode' + (modes.length > 1 ? 's' : '') + '} &= ' + modes.join(',\\ ')) },
          ])));

        const share = F(n, f);
        out.append(K.card('Bar chart',
          bars({ xs: faces, ys: freq, hi: noMode ? [] : modes.map(v => v - 1), xName: 'face', yName: 'frequency' }),
          K.p('One bar per face; its height is the frequency' + (noMode ? '' : ', and the mode’s bar is coloured') + '. A fair die gives each face $\\frac{1}{' + f + '}$ of the rolls in the long run, here about $\\frac{' + n + '}{' + f + '} ' + (share.exactDecimal(2) ? '= ' : '\\approx ') + share.dec(2) + '$ each. Real rolls wobble around that; with more rolls the relative frequencies settle closer to $\\frac{1}{' + f + '}$.')));

        const same = '#/labs/dice/summary?' + (typed ? 'src=typed&x=' + encodeURIComponent(s.v.x) : 'f=' + f + '&n=' + n + '&seed=' + s.v.seed);
        out.append(K.card('Categorical or numerical?',
          K.p('A face can be read as <b>categorical</b> data, a label for which face came up (so you count it: frequency table, bar chart and mode), or as <b>numerical</b> data, a number of dots that you can add and average (mean, median and spread: <a href="' + safe(same) + '">the same ' + (typed ? 'results' : 'rolls') + ' in the next topic</a>).')));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- summary */
    // ?f=6&n=20&seed=1&p=0.9              the same rolls as "Describe data" (n up to 1000); p = the percentile you ask about (0 < p ≤ 1)
    // ?src=typed&x=35,38,47,58,61&p=0.1   or numbers you type (at most 1000; whole, decimal like 2.5, or fractions like 7/2)
    summary(el, query, ctx) {
      const s = K.state(ctx, { src: 'roll', f: 6, n: 20, seed: 1, x: LECTURE_MARKS, p: '0.9' }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        const v = s.v;
        v.src = v.src === 'typed' ? 'typed' : 'roll'; v.f = facesOf(v.f); v.n = whole(v.n, 1, 1000, 20); v.seed = whole(v.seed, 1, 1e9, 1);
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Describe a list of numbers by its centre (mean, median, mode) and its spread (range, variance, standard deviation, quartiles), and draw its box plot.'),
          K.seg({ label: 'Data', options: [['roll', 'Roll a die'], ['typed', 'Type numbers']], value: v.src, onChange: x => { s.set({ src: x }, true); redo(); } }),
          ...(v.src === 'roll'
            ? [facesSeg('Faces on the die', v.f, f => { s.set({ f }, true); redo(); }), K.int({ label: 'Number of rolls $n$', value: v.n, min: 1, max: 1000, onChange: n => s.set({ n }) }), bigButton('Roll again', () => s.set({ seed: v.seed + 1 }))]
            : [K.text({ label: 'Your numbers, separated by commas', value: v.x, placeholder: '35, 38, 47', onChange: x => s.set({ x }) })]),
          K.prob({ label: 'A percentile to work out: $p$', value: v.p, presets: ['0.1', '0.25', '0.9', '0.95'], onChange: p => s.set({ p }), help: '$p = 0.9$ asks for the 90th percentile.' }),
          tryRow([
            ['Lecture marks (Week 3)', () => { s.set({ src: 'typed', x: LECTURE_MARKS, p: '0.1' }, true); redo(); }],
            ['An outlier', () => { s.set({ src: 'typed', x: '2, 3, 3, 4, 4, 4, 5, 5, 6, 19', p: '0.9' }, true); redo(); }],
            ['7 rolls (odd n)', () => { s.set({ src: 'roll', n: 7 }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        let vals;
        try { vals = s.v.src === 'typed' ? numbers(s.v.x, 1000, 'number') : rollDie(s.v.f, s.v.n, s.v.seed).map(v => F(v)); }
        catch (e) { out.append(K.note(e.message, 'warn')); return; }
        let p = null;
        try { p = F.parse(s.v.p); if (p.cmp(0) <= 0 || p.cmp(1) > 0) p = null; } catch (e) { p = null; }
        const n = vals.length, sorted = vals.slice().sort((a, b) => a.cmp(b));
        const groups = [];
        sorted.forEach(v => { const g = groups[groups.length - 1]; if (g && g.v.eq(v)) g.c++; else groups.push({ v, c: 1 }); });
        const sumX = add(vals), mean = sumX.div(n);
        groups.forEach(g => { g.d = g.v.sub(mean); g.d2 = g.d.mul(g.d); });
        const S = add(groups.map(g => g.d2.mul(g.c))), popVar = S.div(n), sampVar = n > 1 ? S.div(n - 1) : null;
        const sumSq = add(groups.map(g => g.v.mul(g.v).mul(g.c)));
        const med = coursePct(sorted, F(1, 2)), q1 = coursePct(sorted, F(1, 4)), q3 = coursePct(sorted, F(3, 4));
        const iqr = q3.value.sub(q1.value), lo = q1.value.sub(iqr.mul(F(3, 2))), hi = q3.value.add(iqr.mul(F(3, 2)));
        const outs = sorted.filter(v => v.cmp(lo) < 0 || v.cmp(hi) > 0), inside = sorted.filter(v => v.cmp(lo) >= 0 && v.cmp(hi) <= 0);
        const most = Math.max(...groups.map(g => g.c)), modeGroups = groups.filter(g => g.c === most);
        const noMode = groups.length > 1 && modeGroups.length === groups.length;
        const min = sorted[0], max = sorted[n - 1], range = max.sub(min);
        const modeTx = noMode ? '\\text{none}' : modeGroups.slice(0, 4).map(g => tx(g.v)).join(',\\ ') + (modeGroups.length > 4 ? ',\\ \\dots' : '');
        const sTx = sampVar ? 's &' + sqrtShort(sampVar) : 's &\\text{ needs } n \\ge 2';
        out.append(answer('Your ' + n + ' value' + (n === 1 ? '' : 's') + ' in short',
          '\\begin{aligned} \\bar x &= ' + txd(mean) + ' & \\quad \\text{median} &= ' + tx(med.value) + ' \\\\ \\text{mode} &= ' + modeTx + ' & \\quad \\text{range} &= ' + tx(range) + ' \\\\ ' + sTx + ' & \\quad \\text{IQR} &= ' + tx(iqr) + ' \\end{aligned}',
          '$s$ is the sample standard deviation; every value is worked out below.'));

        // the sorted values, with the positions the median and quartiles use
        const mark = new Map();
        [...q1.pos, ...q3.pos].forEach(k => mark.set(k, 'q'));
        med.pos.forEach(k => mark.set(k, 'm'));
        const chip = (v, k) => '<span class="lk-outcome' + (mark.get(k) === 'm' ? ' hi' : '') + '"' + (mark.get(k) === 'q' ? ' style="border-color:var(--accent);background:var(--accent-soft)"' : '') + ' title="position ' + k + '"><span style="display:grid;justify-items:center;line-height:1.15"><small style="font-size:10px;color:var(--ink-4)">' + k + '</small><span>' + pl(v) + '</span></span></span>';
        let cum = 0;
        const cumRows = groups.map(g => { const a = cum + 1; cum += g.c; return [pl(g.v), String(g.c), String(cum), a === cum ? String(a) : a + '–' + cum]; });
        out.append(K.card('Sorted from smallest to largest',
          n <= 100 ? h('div', { class: 'lk-outcomes', html: sorted.map((v, i) => chip(v, i + 1)).join('') }) : null,
          n <= 100 ? K.p('The small number on each value is its position $k$; write $x_{k}$ for the value at position $k$. Purple: the median’s position' + (med.pos.length > 1 ? 's' : '') + '. Blue: the quartiles’ positions.') : K.p('With ' + n + ' values, read positions from the cumulative frequency below: write $x_{k}$ for the value at position $k$ of the sorted list.'),
          groups.length <= 40 ? table(['Value', 'Frequency', 'Cumulative<br>frequency', 'Positions'], cumRows, { compact: true }) : null));

        // mean
        const repeats = groups.length < n;
        const sumTerms = repeats ? groups.map(g => (g.c === 1 ? tb(g.v) : g.c + ' \\times ' + tb(g.v))) : vals.map(tb);
        out.append(K.card('Mean',
          steps([
            { text: 'Add up all ' + n + ' values' + (repeats ? ' (a value that appears $k$ times adds $k \\times$ value)' : '') + ':', tex: fit('\\sum x', [['=', cap(sumTerms)], ['=', tx(sumX)]]) },
            { text: 'Divide by how many values there are, $n = ' + n + '$:', tex: fit('\\bar x', [['=', '\\frac{\\sum x}{n}'], ['=', raw(tx(sumX), n)], ['=', txd(mean)]]) },
          ])));

        // median, mode, range
        const odd = n % 2 === 1;
        out.append(K.card('Median, mode and range',
          steps([
            odd
              ? { text: 'Sort the values (above). $n = ' + n + '$ is odd, so the <b>median</b> is the middle value, at position $\\frac{n + 1}{2} = ' + (n + 1) / 2 + '$:', tex: '\\text{median} = x_{' + (n + 1) / 2 + '} = ' + tx(med.value) }
              : { text: 'Sort the values (above). $n = ' + n + '$ is even, so the <b>median</b> is the average of the two middle values, at positions $\\frac{n}{2} = ' + n / 2 + '$ and $\\frac{n}{2} + 1 = ' + (n / 2 + 1) + '$:', tex: fit('\\text{median}', [['=', '\\frac{x_{' + n / 2 + '} + x_{' + (n / 2 + 1) + '}}{2}'], ['=', '\\frac{' + tx(sorted[n / 2 - 1]) + ' + ' + tb(sorted[n / 2]) + '}{2}'], ['=', tx(med.value)]]) },
            { text: 'The <b>mode</b> is the value that appears most often' + (noMode ? '. Here every value appears ' + most + (most === 1 ? ' time' : ' times') + ', so there is no mode.' : ':'), tex: noMode ? null : modeGroups.slice(0, 6).map(g => tx(g.v)).join(',\\ ') + (modeGroups.length > 6 ? ',\\ \\dots' : '') + '\\ \\text{appear' + (modeGroups.length === 1 ? 's' : '') + ' ' + most + ' time' + (most === 1 ? '' : 's') + (modeGroups.length > 1 ? ' each' : '') + '}' },
            { text: 'The <b>range</b> is the largest value minus the smallest:', tex: fit('\\text{range}', [['=', tx(max) + ' - ' + tb(min)], ['=', tx(range)]]) },
          ])));

        // variance and standard deviation, with every sum
        const cTimes = g => (g.c === 1 ? '' : g.c + ' \\times ');
        out.append(K.card('Variance and standard deviation',
          table(['$x$', 'times', '$x - \\bar x$', '$(x - \\bar x)^2$', 'times ×<br>$(x - \\bar x)^2$'],
            groups.slice(0, 60).map(g => [pl(g.v), String(g.c), pl(g.d), pl(g.d2), pl(g.d2.mul(g.c))]).concat(groups.length > 60 ? [['…', '', '', '', '']] : []).concat([['Sum', String(n), '', '', pl(S)]]), { compact: true }),
          steps([
            { text: 'Take each value’s <b>deviation</b> from the mean, $x - \\bar x$. Values above the mean give positive deviations, values below give negative ones, and together they cancel out:', tex: fit('\\sum (x - \\bar x)', [['=', cap(groups.map(g => cTimes(g) + tb(g.d)))], ['=', '0']]) },
            { text: 'Square each deviation, so that negatives no longer cancel, and add them all up (a value that appears $k$ times counts $k$ times):', tex: fit('\\sum (x - \\bar x)^2', [['=', cap(groups.map(g => cTimes(g) + sq(g.d)))], ['=', tx(S)]]) },
            { text: 'If your values are a whole <b>population</b> (then the mean is called $\\mu$), divide by $N = ' + n + '$:', tex: fit('\\sigma^2', [['=', '\\frac{\\sum (x - \\mu)^2}{N}'], ['=', raw(tx(S), n)], ['=', txd(popVar)]]) },
            sampVar
              ? { text: 'If they are a <b>sample</b> (the usual case in this course), divide by $n - 1 = ' + (n - 1) + '$ instead:', tex: fit('s^2', [['=', '\\frac{\\sum (x - \\bar x)^2}{n - 1}'], ['=', raw(tx(S), n - 1)], ['=', txd(sampVar)]]) }
              : { text: 'With a single value the sample variance would divide by $n - 1 = 0$, so it is not defined.' },
            { text: 'The <b>standard deviation</b> is the square root of the variance. It is in the same units as the data:', tex: stack('\\sigma &= ' + sqrtTx(popVar), ...(sampVar ? ['s &= ' + sqrtTx(sampVar)] : [])) },
            { text: 'Check with the shortcut $\\sum x^2 - n\\bar x^2$, which gives the same sum of squares:', tex: fit('\\sum x^2 - n\\bar x^2', [['=', tx(sumSq) + ' - ' + n + ' \\times ' + sq(mean)], ['=', tx(sumSq) + ' - ' + tx(mean.mul(mean).mul(n))], ['=', tx(S) + '\\ \\checkmark']]) },
          ])));

        // percentiles and quartiles (the course's rule)
        const pctStep = (title, sym, pp, r) => {
          const npTx = '$np = ' + n + ' \\times ' + tx(pp) + ' = ' + tx(r.np) + '$';
          if (r.last) return { text: title + ': ' + npTx + ' is the last position, so take the largest value:', tex: fit(sym, [['=', 'x_{' + n + '}'], ['=', tx(r.value)]]) };
          if (r.whole) return { text: title + ': ' + npTx + ' is a whole number, so take the average of the values at positions ' + r.pos[0] + ' and ' + r.pos[1] + ':', tex: fit(sym, [['=', '\\frac{x_{' + r.pos[0] + '} + x_{' + r.pos[1] + '}}{2}'], ['=', '\\frac{' + tx(sorted[r.pos[0] - 1]) + ' + ' + tb(sorted[r.pos[1] - 1]) + '}{2}'], ['=', tx(r.value)]]) };
          return { text: title + ': ' + npTx + ' is not a whole number, so round it up to position ' + r.pos[0] + ':', tex: fit(sym, [['=', 'x_{' + r.pos[0] + '}'], ['=', tx(r.value)]]) };
        };
        const extra = p && ![F(1, 4), F(1, 2), F(3, 4)].some(q => q.eq(p));
        const pr = p ? coursePct(sorted, p) : null;
        const pName = p ? ordinal(p.num() * 100) : '', pSym = p ? 'P_{' + dec(p.num() * 100, 2) + '}' : '';
        const where = r => (r.last ? r.pos[0] + ' (last)' : r.pos.join(', '));
        const pRows = [['25th ($Q_1$)', F(1, 4), q1], ['50th (median)', F(1, 2), med], ['75th ($Q_3$)', F(3, 4), q3]].concat(extra ? [[pName, p, pr]] : [])
          .map(([name, pp, r]) => [name, pl(r.np), where(r), pl(r.value)]);
        out.append(K.card('Percentiles and quartiles',
          K.p('The course’s rule (Stats 1 Week 3, lecture 3.5): sort the data and work out $np$. If $np$ is not a whole number, round it <b>up</b> and take the value at that position. If $np$ is a whole number, take the <b>average</b> of the values at positions $np$ and $np + 1$.'),
          steps([
            pctStep('First quartile $Q_1$ (the 25th percentile, $p = 0.25$)', 'Q_1', F(1, 4), q1),
            pctStep('Third quartile $Q_3$ (the 75th percentile, $p = 0.75$)', 'Q_3', F(3, 4), q3),
            p ? (extra ? pctStep('The ' + pName + ' percentile ($p = ' + tx(p) + '$)', pSym, p, pr) : { text: 'Your $p = ' + tx(p) + '$ is one of the quartiles above (the 50th percentile is the median).' }) : { text: 'Give $p$ between 0 and 1 (like 0.9 for the 90th percentile) to work out another percentile.' },
            { text: 'The <b>interquartile range</b> is the spread of the middle half of the data:', tex: fit('\\text{IQR}', [['=', 'Q_3 - Q_1'], ['=', tx(q3.value) + ' - ' + tb(q1.value)], ['=', tx(iqr)]]) },
          ]),
          table(['Percentile', '$np$', 'Position', 'Value'], pRows, { compact: true }),
          K.note('Google Sheets’ PERCENTILE and QUARTILE use another rule (position $p(n - 1) + 1$, then part of the way to the next value), so they can give other numbers. Here they give $Q_1 = ' + tx(sheetsPct(sorted, F(1, 4))) + '$, $Q_3 = ' + tx(sheetsPct(sorted, F(3, 4))) + '$' + (extra ? ' and $' + pSym + ' = ' + tx(sheetsPct(sorted, p)) + '$' : '') + '. The lecture shows both; neither is wrong, they are different rules.')));

        // box plot and outliers
        const outText = () => { const m = new Map(); outs.forEach(v => m.set(v.str(), { v, c: (m.get(v.str()) || { c: 0 }).c + 1 })); return [...m.values()].map(o => pl(o.v) + (o.c > 1 ? ' (' + o.c + ' times)' : '')).join(', '); };
        out.append(K.card('Box plot and outliers',
          boxPlot({ min: min.num(), max: max.num(), q1: q1.value.num(), med: med.value.num(), q3: q3.value.num(), lo: lo.num(), hi: hi.num(), wl: inside[0].num(), wh: inside[inside.length - 1].num(), outs: outs.map(v => v.num()) }),
          table(['Minimum', '$Q_1$', 'Median', '$Q_3$', 'Maximum'], [[pl(min), pl(q1.value), pl(med.value), pl(q3.value), pl(max)]], { compact: true }),
          steps([
            { text: 'The <b>fences</b> sit 1.5 IQR beyond the quartiles:', tex: stack('\\text{lower} &= Q_1 - 1.5 \\times \\text{IQR}', '&= ' + tx(q1.value) + ' - 1.5 \\times ' + tb(iqr) + ' = ' + tx(lo), '\\text{upper} &= Q_3 + 1.5 \\times \\text{IQR}', '&= ' + tx(q3.value) + ' + 1.5 \\times ' + tb(iqr) + ' = ' + tx(hi)) },
            { text: 'A value below the lower fence or above the upper fence is an <b>outlier</b>. ' + (outs.length ? 'Here: ' + outText() + '.' : 'Here there is none: every value lies between ' + pl(lo) + ' and ' + pl(hi) + '.') },
            { text: 'The box runs from $Q_1$ to $Q_3$ with a line at the median. The whiskers reach the smallest and the largest values that are not outliers (' + pl(inside[0]) + ' and ' + pl(inside[inside.length - 1]) + ')' + (outs.length ? '; each outlier is a circle.' : ', here the minimum and the maximum.') },
          ])));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- two variables */
    // ?f=6&n=20&seed=1&y=sum                        roll two dice n times (2–200): x = first die, y = sum | second | max | diff
    // ?src=typed&xs=1,2,3,4,5&ys=75,85,94,101,108    or type the x values and the y values (2–200 pairs, same count in each)
    'two-variables'(el, query, ctx) {
      const s = K.state(ctx, { src: 'roll', f: 6, n: 20, seed: 1, y: 'sum', xs: '1, 2, 3, 4, 5', ys: '75, 85, 94, 101, 108' }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        const v = s.v;
        v.src = v.src === 'typed' ? 'typed' : 'roll'; v.f = facesOf(v.f); v.n = whole(v.n, 2, 200, 20); v.seed = whole(v.seed, 1, 1e9, 1); if (!YS[v.y]) v.y = 'sum';
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Two numbers come from each roll: $x$ from the first die and $y$ from both. Do they move together? A scatter plot, the covariance, the correlation and the best straight line say how much.'),
          K.seg({ label: 'Data', options: [['roll', 'Roll two dice'], ['typed', 'Type pairs']], value: v.src, onChange: x => { s.set({ src: x }, true); redo(); } }),
          ...(v.src === 'roll'
            ? [facesSeg('Faces on each die', v.f, f => { s.set({ f }, true); redo(); }),
              K.select({ label: '$y$ is', options: Object.entries(YS).map(([id, o]) => [id, o.pick]), value: v.y, onChange: y => s.set({ y }) }),
              K.int({ label: 'Number of rolls $n$', value: v.n, min: 2, max: 200, onChange: n => s.set({ n }) }),
              bigButton('Roll again', () => s.set({ seed: v.seed + 1 }))]
            : [K.text({ label: 'The $x$ values', value: v.xs, placeholder: '1, 2, 3, 4, 5', onChange: xs => s.set({ xs }) }),
              K.text({ label: 'The $y$ values, in the same order', value: v.ys, placeholder: '6, 5, 4, 3, 2', onChange: ys => s.set({ ys }) })]),
          tryRow([
            ['Lecture 4.6: age and height', () => { s.set({ src: 'typed', xs: '1, 2, 3, 4, 5', ys: '75, 85, 94, 101, 108' }, true); redo(); }],
            ['Lecture 4.6: car age and price', () => { s.set({ src: 'typed', xs: '1, 2, 3, 4, 5', ys: '6, 5, 4, 3, 2' }, true); redo(); }],
            ['y = second die', () => { s.set({ src: 'roll', y: 'second' }, true); redo(); }],
            ['200 rolls', () => { s.set({ src: 'roll', n: 200 }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const typed = s.v.src === 'typed', f = s.v.f, Yc = YS[s.v.y];
        let xs, ys, pairs = null;
        if (typed) {
          try { xs = numbers(s.v.xs, 200, 'x value'); ys = numbers(s.v.ys, 200, 'y value'); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
          if (xs.length !== ys.length) { out.append(K.note('You typed ' + xs.length + ' $x$ values and ' + ys.length + ' $y$ values. Each $x$ needs its $y$.', 'warn')); return; }
          if (xs.length < 2) { out.append(K.note('Type at least two pairs.', 'warn')); return; }
        } else {
          pairs = rollPairs(f, s.v.n, s.v.seed);
          xs = pairs.map(([a]) => F(a)); ys = pairs.map(([a, b]) => F(Yc.fn(a, b)));
        }
        const n = xs.length, word = typed ? 'pair' : 'roll';
        const sx = add(xs), sy = add(ys), mx = sx.div(n), my = sy.div(n);
        const dx = xs.map(x => x.sub(mx)), dy = ys.map(y => y.sub(my));
        const prod = dx.map((d, i) => d.mul(dy[i]));
        const Sxy = add(prod), Sxx = add(dx.map(d => d.mul(d))), Syy = add(dy.map(d => d.mul(d)));
        const covS = Sxy.div(n - 1), covP = Sxy.div(n);
        const flatX = Sxx.isZero(), flatY = Syy.isZero();
        const r2 = flatX || flatY ? null : Sxy.mul(Sxy).div(Sxx.mul(Syy));
        const rNum = r2 ? Math.sign(Sxy.num()) * Math.sqrt(r2.num()) : null;
        const rExact = r2 ? rootOf(r2) : null;
        const rRel = rExact ? '=' : '\\approx', rVal = r2 ? (rExact ? tx(Sxy.cmp(0) < 0 ? rExact.neg() : rExact) : dec(rNum)) : '', rTx = r2 ? rRel + ' ' + rVal : '';
        const m = flatX ? null : Sxy.div(Sxx), c = flatX ? null : my.sub(m.mul(mx));
        const line = m ? lineOf(m, c) : null;
        const xLabel = typed ? 'x' : 'x (first die)', yLabel = typed ? 'y' : 'y (' + Yc.short + ')';

        out.append(r2
          ? answer(typed ? 'Correlation of $x$ and $y$ over your ' + n + ' pairs' : 'Correlation of the first die and ' + Yc.short + ' over your ' + n + ' rolls', 'r ' + rTx,
            'Sample covariance $' + txd(covS) + '$; fitted line $' + line.short + '$.')
          : answer('Covariance over your ' + n + ' ' + word + 's', '\\Cov(x, y) = ' + txd(covS), (flatX ? 'Every $x$ is the same' : 'Every $y$ is the same') + ', so that variable does not vary: $r$ is not defined' + (flatX ? ' and no line can be fitted.' : '.')));

        if (pairs) out.append(K.card('Your ' + n + ' rolls (first die, second die)', pairRow(pairs, f)));

        // scatter plot
        const span = arr => { const a = Math.min(...arr), z = Math.max(...arr), pad = z > a ? (z - a) * 0.08 : 1; return [a - pad, z + pad]; };
        const xr = typed ? span(xs.map(x => x.num())) : [0.5, f + 0.5];
        const yr = typed ? span(ys.map(y => y.num())) : [Yc.range(f)[0] - 0.5, Yc.range(f)[1] + 0.5];
        out.append(K.card('Scatter plot',
          scatter({ xs: xs.map(x => x.num()), ys: ys.map(y => y.num()), xr, yr, xName: xLabel, yName: yLabel, fit: m ? { m: m.num(), c: c.num() } : null, mx: mx.num(), my: my.num() }),
          K.p('Each dot is a ' + word + '. A bigger dot with a number in it: the same point came up that many times. Dashed lines: the means $\\bar x$ and $\\bar y$. Solid line: the fitted line.')));

        // the table of deviations and products
        const many = n > 30;
        let head, rows, terms;
        if (!many) {
          head = [typed ? 'Pair' : 'Roll', '$x$', '$y$', '$x - \\bar x$', '$y - \\bar y$', '$(x - \\bar x)(y - \\bar y)$', '$(x - \\bar x)^2$', '$(y - \\bar y)^2$'];
          rows = xs.map((x, i) => [String(i + 1), pl(x), pl(ys[i]), pl(dx[i]), pl(dy[i]), pl(prod[i]), pl(dx[i].mul(dx[i])), pl(dy[i].mul(dy[i]))]);
          terms = { xy: prod.map(tb), xx: dx.map(sq), yy: dy.map(sq) };
        } else {
          const g = new Map();
          xs.forEach((x, i) => { const k = x.str() + '|' + ys[i].str(); const e = g.get(k) || { x, y: ys[i], dx: dx[i], dy: dy[i], c: 0 }; e.c++; g.set(k, e); });
          const list = [...g.values()].sort((a, b) => a.x.cmp(b.x) || a.y.cmp(b.y));
          head = ['$x$', '$y$', 'times', '$x - \\bar x$', '$y - \\bar y$', 'times × $(x - \\bar x)(y - \\bar y)$', 'times × $(x - \\bar x)^2$', 'times × $(y - \\bar y)^2$'];
          rows = list.map(e => [pl(e.x), pl(e.y), String(e.c), pl(e.dx), pl(e.dy), pl(e.dx.mul(e.dy).mul(e.c)), pl(e.dx.mul(e.dx).mul(e.c)), pl(e.dy.mul(e.dy).mul(e.c))]);
          const t = e => (e.c === 1 ? '' : e.c + ' \\times ');
          terms = { xy: list.map(e => t(e) + tb(e.dx.mul(e.dy))), xx: list.map(e => t(e) + sq(e.dx)), yy: list.map(e => t(e) + sq(e.dy)) };
        }
        rows.push(many ? ['Sum', '', String(n), '', '', pl(Sxy), pl(Sxx), pl(Syy)] : ['Sum', pl(sx), pl(sy), '0', '0', pl(Sxy), pl(Sxx), pl(Syy)]);
        const stepsC = [
          { text: 'The means of $x$ and of $y$:', tex: stack('\\bar x &= \\frac{\\sum x}{n} = ' + raw(tx(sx), n) + ' = ' + txd(mx), '\\bar y &= \\frac{\\sum y}{n} = ' + raw(tx(sy), n) + ' = ' + txd(my)) },
          { text: 'For each ' + word + ', the deviations $x - \\bar x$ and $y - \\bar y$, and their product (the table' + (many ? '; a repeated point is one row, counted as many times as it came up' : '') + '). The product is positive when both are above their means or both below (they move together), and negative when one is above and the other below.' },
          { text: 'Add up the products:', tex: fit('\\sum (x - \\bar x)(y - \\bar y)', [['=', cap(terms.xy)], ['=', tx(Sxy)]]) },
          { text: 'The <b>covariance</b> divides this sum by $n - 1 = ' + (n - 1) + '$ for a sample (the course’s usual choice). For a population you would divide by $N = ' + n + '$ instead: $' + raw(tx(Sxy), n) + ' = ' + txd(covP) + '$. The sample covariance:', tex: fit('\\Cov(x, y)', [['=', '\\frac{\\sum (x - \\bar x)(y - \\bar y)}{n - 1}'], ['=', raw(tx(Sxy), n - 1)], ['=', txd(covS)]]) },
          { text: 'Its sign gives the direction: ' + (Sxy.cmp(0) > 0 ? 'positive, so $y$ tends to be large when $x$ is large.' : Sxy.cmp(0) < 0 ? 'negative, so $y$ tends to be small when $x$ is large.' : 'zero, so there is no linear trend either way.') + ' Its size depends on the units, so on its own it does not say how strong the link is.' },
          { text: 'The sums of squared deviations (last two columns), for the standard deviations:', tex: fit('\\sum (x - \\bar x)^2', [['=', cap(terms.xx)], ['=', tx(Sxx)]]) },
          { text: 'and for $y$:', tex: fit('\\sum (y - \\bar y)^2', [['=', cap(terms.yy)], ['=', tx(Syy)]]) },
        ];
        if (r2) {
          stepsC.push(
            { text: 'The sample standard deviations:', tex: stack('s_x &= \\sqrt{' + raw(tx(Sxx), n - 1) + '} ' + sqrtShort(Sxx.div(n - 1)), 's_y &= \\sqrt{' + raw(tx(Syy), n - 1) + '} ' + sqrtShort(Syy.div(n - 1))) },
            { text: 'The <b>correlation</b> $r$ divides the covariance by both standard deviations, which removes the units; the $n - 1$ cancels:', tex: fit('r', [['=', '\\frac{\\Cov(x, y)}{s_x s_y}'], ['=', '\\frac{\\sum (x - \\bar x)(y - \\bar y)}{\\sqrt{\\sum (x - \\bar x)^2 \\sum (y - \\bar y)^2}}'], ['=', '\\frac{' + tx(Sxy) + '}{\\sqrt{' + tx(Sxx) + ' \\times ' + tb(Syy) + '}}'], [rRel, rVal]]) },
            { text: '$r$ is always between $-1$ and $1$. Here $r ' + rTx + '$: ' + (rNum > 0 ? 'positive' : rNum < 0 ? 'negative' : 'zero') + ', with ' + strength(rNum) + ' linear association' + (Math.abs(rNum) > 0.9999 ? ' (the points lie exactly on a line).' : '.') });
        } else stepsC.push({ text: (flatX ? 'All $x$ values are equal' : 'All $y$ values are equal') + ', so its sum of squares is 0 and $r$ would divide by 0: the correlation is not defined.' });
        out.append(K.card('Covariance and correlation, step by step', table(head, rows, { compact: true }), steps(stepsC)));

        if (m) {
          out.append(K.card('The fitted line $y = mx + c$',
            steps([
              { text: 'The best straight line (least squares, the trend line Google Sheets draws) has slope', tex: fit('m', [['=', '\\frac{\\sum (x - \\bar x)(y - \\bar y)}{\\sum (x - \\bar x)^2}'], ['=', raw(tx(Sxy), tx(Sxx))], ['=', txd(m)]]) },
              { text: 'It passes through the point of means $(\\bar x, \\bar y)$, which gives the intercept:', tex: fit('c', [['=', '\\bar y - m\\bar x'], ['=', tx(my) + ' - ' + tb(m) + ' \\times ' + tb(mx)], ['=', txd(c)]]) },
              { text: 'So the line is', tex: line.full },
              r2 ? { text: '$R^2 = r^2$ measures how well the line fits, from 0 (not at all) to 1 (every point on the line):', tex: 'R^2 = r^2 = ' + txd(r2) } : null,
            ].filter(Boolean))));
        }

        if (!typed) {
          // what the correlation and the line settle to, from all f² equally likely pairs
          let ex = F(0), ey = F(0), exy = F(0), ex2 = F(0), ey2 = F(0);
          const w = F(1, f * f);
          for (let a = 1; a <= f; a++) for (let b = 1; b <= f; b++) { const yv = Yc.fn(a, b); ex = ex.add(w.mul(a)); ey = ey.add(w.mul(yv)); exy = exy.add(w.mul(a * yv)); ex2 = ex2.add(w.mul(a * a)); ey2 = ey2.add(w.mul(yv * yv)); }
          const cv = exy.sub(ex.mul(ey)), vx = ex2.sub(ex.mul(ex)), vy = ey2.sub(ey.mul(ey));
          const rho2 = cv.mul(cv).div(vx.mul(vy)), rhoE = rootOf(rho2), sl = cv.div(vx), ic = ey.sub(sl.mul(ex));
          const rhoTx = rhoE ? tx(cv.cmp(0) < 0 ? rhoE.neg() : rhoE) : (cv.cmp(0) < 0 ? '-' : '') + '\\sqrt{' + tx(rho2) + '} \\approx ' + dec(Math.sign(cv.num()) * Math.sqrt(rho2.num()));
          out.append(K.card('In the long run',
            K.p('Roll for ever and every pair (first, second) turns up $\\frac{1}{' + f * f + '}$ of the time. Then the correlation of the first die and ' + Yc.short + ' would be $\\rho = ' + rhoTx + '$ and the line $' + lineOf(sl, ic).short + '$. Your ' + n + ' rolls give $r ' + (r2 ? rTx : '\\text{: not defined}') + '$; more rolls bring it closer.')));
        }
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- counting */
    // ?f=6&k=2        k dice (1–10) with f faces each: ordered outcomes, all faces different, unordered outcomes
    counting(el, query, ctx) {
      const s = K.state(ctx, { f: 6, k: 2 }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        s.v.f = facesOf(s.v.f); s.v.k = whole(s.v.k, 1, 10, 2);
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Roll $k$ dice at once and count the possible outcomes: in order (which die shows what), with all faces different, or ignoring the order.'),
          facesSeg('Faces on each die $f$', s.v.f, f => { s.set({ f }, true); redo(); }),
          K.int({ label: 'Number of dice $k$', value: s.v.k, min: 1, max: 10, onChange: k => s.set({ k }) }),
          tryRow([
            ['Two dice', () => { s.set({ f: 6, k: 2 }, true); redo(); }],
            ['Three dice', () => { s.set({ f: 6, k: 3 }, true); redo(); }],
            ['Seven dice, six faces', () => { s.set({ f: 6, k: 7 }, true); redo(); }],
            ['Two 4-faced dice', () => { s.set({ f: 4, k: 2 }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, k = s.v.k;
        const ordered = F(f).pow(k), perm = k > f ? F(0) : K.fact(f).div(K.fact(f - k)), unordered = K.C(f + k - 1, k), distinct = K.C(f, k);
        out.append(answer('Outcomes of ' + k + (k === 1 ? ' die' : ' dice') + ' with ' + f + ' faces each',
          '\\begin{aligned} \\text{ordered} &= ' + f + '^{' + k + '} = ' + ordered.tex() + ' \\\\ \\text{ordered, all faces different} &= ' + perm.tex() + ' \\\\ \\text{unordered} &= \\tbinom{' + (f + k - 1) + '}{' + k + '} = ' + unordered.tex() + ' \\end{aligned}'));

        // stars and bars picture of one unordered outcome
        const ex = upTo(k).map(i => Math.max(1, Math.min(f, Math.ceil(i * f / (k + 1)))));
        if (k >= 3) ex[1] = ex[0];
        ex.sort((a, b) => a - b);
        const bars = upTo(f).map(v => '★'.repeat(ex.filter(x => x === v).length)).join(' | ').replace(/\s+/g, ' ').trim();
        const st = [
          { text: '<b>Ordered</b> outcomes: the dice are told apart (say they have different colours, or one die is rolled ' + k + ' times), so (1, 2) and (2, 1) are different outcomes. Each die has ' + f + ' faces, and by the multiplication rule the choices multiply:', tex: fit(k <= 4 ? Array(k).fill(f).join(' \\times ') : '\\underbrace{' + f + ' \\times ' + f + ' \\times \\cdots \\times ' + f + '}_{' + k + '\\text{ dice}}', [['=', f + '^{' + k + '}'], ['=', ordered.tex()]]) },
          k > f
            ? { text: '<b>All faces different</b>: impossible, because ' + k + ' dice cannot show ' + k + ' different faces when a die has only ' + f + ' faces.', tex: '{}^{' + f + '}P_{' + k + '} = 0' }
            : { text: '<b>All faces different</b> (still in order): the first die has ' + f + ' choices, the second must avoid that face (' + (f - 1) + ' choices), and so on. This is a <b>permutation</b> of ' + k + ' faces out of ' + f + ':', tex: fit('{}^{' + f + '}P_{' + k + '}', [['=', '\\frac{' + f + '!}{(' + f + ' - ' + k + ')!}'], ['=', { t: upTo(k).map(i => String(f - i + 1)), op: ' \\times ' }], ['=', perm.tex()]]) },
          { text: '<b>Unordered</b> outcomes: only which faces show matters, not which die shows them, so (1, 2) and (2, 1) are the same outcome {1, 2}; faces may repeat. Write an outcome as a row of stars and bars: one star ★ per die, and a bar | between neighbouring faces (' + (f - 1) + ' bars for ' + f + ' faces). The stars before the first bar are 1s, between the first and second bar 2s, and so on. For example {' + ex.join(', ') + '} is <code>' + bars + '</code>.' },
          { text: 'Every row of ' + k + ' stars and ' + (f - 1) + ' bars is exactly one unordered outcome, and back. So count the ways to choose which ' + k + ' of the ' + (f + k - 1) + ' places hold the stars (a combination, repetition allowed):', tex: fit('\\binom{f + k - 1}{k}', [['=', '\\binom{' + f + ' + ' + k + ' - 1}{' + k + '}'], ['=', '\\binom{' + (f + k - 1) + '}{' + k + '}'], ['=', '\\frac{' + (f + k - 1) + '!}{' + k + '!\\,' + (f - 1) + '!}'], ['=', unordered.tex()]]) },
        ];
        if (k === 2) st.push({ text: 'Check for two dice: in the ordered list the ' + f + ' doubles appear once each, and the other ' + (f * f - f) + ' outcomes come in pairs like (1, 2) and (2, 1):', tex: f + ' + \\frac{' + (f * f - f) + '}{2} = ' + (f + (f * f - f) / 2) + '\\ \\checkmark' });
        st.push(k > f
          ? { text: '<b>Unordered, all faces different</b>: also impossible here.', tex: '\\binom{' + f + '}{' + k + '} = 0' }
          : { text: '<b>Unordered, all faces different</b>: each set of ' + k + ' different faces appears in $' + k + '!$ orders among the permutations, so divide (a <b>combination</b>):', tex: fit('\\binom{' + f + '}{' + k + '}', [['=', '\\frac{{}^{' + f + '}P_{' + k + '}}{' + k + '!}'], ['=', '\\frac{' + perm.tex() + '}{' + K.fact(k).tex() + '}'], ['=', distinct.tex()]]) });
        out.append(K.card('Where the numbers come from', steps(st)));

        // listings for small cases
        const list = [];
        if (k === 2) {
          list.push(twoDiceGrid(f, (i, j) => ({ html: i + ',' + j, hi: i < j, dim: i > j })),
            K.p('Each cell is an ordered outcome (first die, second die): $' + f + ' \\times ' + f + ' = ' + f * f + '$ cells. The ' + f + ' cells on the diagonal are doubles. Each coloured cell $(i, j)$ with $i < j$ has a faded twin $(j, i)$ below the diagonal, the same unordered outcome. So the unordered outcomes are the diagonal plus the coloured cells: $' + f + ' + ' + (f * (f - 1)) / 2 + ' = ' + unordered.tex() + '$.'));
        } else if (ordered.cmp(216) <= 0) {
          const all = [];
          const walk = (pre) => { if (pre.length === k) { all.push(pre); return; } for (let v = 1; v <= f; v++) walk(pre.concat(v)); };
          walk([]);
          list.push(K.p('All ' + ordered.tex() + ' ordered outcomes; the coloured ones have all faces different (' + perm.tex() + ' of them).'),
            h('div', { class: 'lk-outcomes', html: all.map(t => '<span class="lk-outcome' + (new Set(t).size === k ? ' hi' : '') + '">(' + t.join(',') + ')</span>').join('') }));
        }
        if (unordered.cmp(126) <= 0) {
          const ms = [];
          const walk = (pre, from) => { if (pre.length === k) { ms.push(pre); return; } for (let v = from; v <= f; v++) walk(pre.concat(v), v); };
          walk([], 1);
          list.push(K.p('All ' + unordered.tex() + ' unordered outcomes; the coloured ones have all faces different (' + distinct.tex() + ' of them).'),
            h('div', { class: 'lk-outcomes', html: ms.map(t => '<span class="lk-outcome' + (new Set(t).size === k ? ' hi' : '') + '">{' + t.join(',') + '}</span>').join('') }));
        }
        if (list.length) out.append(K.card('The outcomes, listed', ...list));
        else out.append(K.card('The outcomes, listed', K.p('There are too many outcomes to list here. Try fewer dice or fewer faces.')));

        out.append(K.card('Which list gives chances?',
          K.p('The ' + ordered.tex() + ' ordered outcomes are equally likely, each with chance $\\frac{1}{' + ordered.tex() + '}$, so chances come from counting them. The unordered outcomes are <b>not</b> equally likely: with two dice {1, 1} happens in one way, (1, 1), but {1, 2} in two ways, (1, 2) and (2, 1).'),
          steps([{ text: 'For example, the chance that all ' + k + ' faces are different:', tex: fit('P', [['=', '\\frac{{}^{' + f + '}P_{' + k + '}}{' + f + '^{' + k + '}}'], ...ratioRels(perm.n, ordered.n)]) }])));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- sample space */
    // ?f=6&show=pair       every outcome of two dice with f faces; each cell shows the pair | the sum | the larger face (max)
    space(el, query, ctx) {
      const s = K.state(ctx, { f: 6, show: 'pair' }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        s.v.f = facesOf(s.v.f); if (!['pair', 'sum', 'max'].includes(s.v.show)) s.v.show = 'pair';
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Roll two dice. The sample space is the list of every possible outcome, here a grid with one cell for each (first die, second die).'),
          facesSeg('Faces on each die', s.v.f, f => { s.set({ f }, true); redo(); }),
          K.seg({ label: 'Each cell shows', options: [['pair', 'The pair'], ['sum', 'The sum'], ['max', 'The larger']], value: s.v.show, onChange: show => s.set({ show }) }));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, N = f * f, show = s.v.show;
        out.append(answer('Two dice with ' + f + ' faces each', '\\begin{aligned} |S| &= ' + f + ' \\times ' + f + ' = ' + N + ' \\\\ P(\\text{each outcome}) &= ' + TD(F(1, N)) + ' \\end{aligned}'));
        out.append(K.card('The sample space $S$',
          twoDiceGrid(f, (i, j) => ({ html: show === 'sum' ? String(i + j) : show === 'max' ? String(Math.max(i, j)) : i + ',' + j })),
          // the two dice go in through the DOM: K.p's text cleaner would show an <svg> as its source text
          h('p', { class: 'lk-p' }, [...K.p('Rows: the first die. Columns: the second die. For example the cell in row 2, column ' + Math.min(5, f) + ' is the outcome (2, ' + Math.min(5, f) + '): ').childNodes],
            h('span', { html: K.die(2, f, 22) + ' ' + K.die(Math.min(5, f), f, 22) }), '.' + (show === 'sum' ? ' Cells with the same sum lie on a slanting line ↙.' : show === 'max' ? ' The larger face is the same along each ⌐-shaped band.' : ''))));
        out.append(K.card('Step by step',
          steps([
            { text: 'An <b>outcome</b> is one possible result. Write it as a pair $(i, j)$: $i$ is the face of the first die and $j$ the face of the second. Think of a red die and a blue die, so $(1, 2)$ and $(2, 1)$ are different outcomes.' },
            { text: 'The <b>sample space</b> $S$ is the set of all outcomes. The first die has ' + f + ' faces and, for each of them, the second die has ' + f + ' faces. By the multiplication rule:', tex: '|S| = ' + f + ' \\times ' + f + ' = ' + N },
            { text: 'Fair dice favour no face, so no outcome is more likely than another: the ' + N + ' outcomes are <b>equally likely</b>, and their chances add up to 1:', tex: 'P(\\{(i, j)\\}) = \\frac{1}{' + N + '} ' + (F(1, N).exactDecimal(4) ? '= ' : '\\approx ') + F(1, N).dec(4) },
            { text: 'Check:', tex: N + ' \\times \\frac{1}{' + N + '} = 1\\ \\checkmark' },
            { text: 'So the chance of any event $E$ (a set of outcomes) is found by counting: <a href="#/labs/dice/events?f=' + f + '">events on two dice</a>.', tex: 'P(E) = \\frac{\\text{number of outcomes in } E}{' + N + '}' },
          ])));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- events */
    // ?f=6&a=one&av=6&b=doubles&show=or
    //   a, b: sum (the sum is v) | sum-ge (at least v) | sum-le (at most v) | even (even sum) | doubles |
    //         one (at least one die shows v) | first (first die shows v) | second (second die shows v) | bigger (first > second)
    //   av, bv: the number v of each event (a sum 2 to 2f, or a face 1 to f); show: A | B | or | and | notA (what is picked out)
    events(el, query, ctx) {
      const s = K.state(ctx, { f: 6, a: 'one', av: 6, b: 'doubles', bv: 1, show: 'or' }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        s.v.f = facesOf(s.v.f); tidyEvents(s, ['a', 'b']); if (!['A', 'B', 'or', 'and', 'notA'].includes(s.v.show)) s.v.show = 'or';
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('An event is a set of outcomes, like “the sum is 7”. Pick two events $A$ and $B$ on two dice; see them on the grid and find their chances by counting.'),
          facesSeg('Faces on each die', s.v.f, f => { s.set({ f }, true); redo(); }),
          ...eventControls(s, 'a', redo), ...eventControls(s, 'b', redo),
          K.seg({ label: 'Show', options: [['A', 'A'], ['B', 'B'], ['or', 'A or B'], ['and', 'A and B'], ['notA', 'not A']], value: s.v.show, onChange: show => s.set({ show }) }),
          tryRow([
            ['At least one six', () => { s.set({ f: 6, a: 'one', av: 6, b: 'doubles', show: 'A' }, true); redo(); }],
            ['Sum 7 or doubles', () => { s.set({ f: 6, a: 'sum', av: 7, b: 'doubles', show: 'or' }, true); redo(); }],
            ['Sum ≥ 10 and doubles', () => { s.set({ f: 6, a: 'sum-ge', av: 10, b: 'doubles', show: 'and' }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, N = f * f, S = cellsOf(f);
        const A = eventOf(s.v.a, s.v.av), B = eventOf(s.v.b, s.v.bv);
        const inA = S.filter(([i, j]) => A.test(i, j)), inB = S.filter(([i, j]) => B.test(i, j));
        const both = S.filter(([i, j]) => A.test(i, j) && B.test(i, j)), either = S.filter(([i, j]) => A.test(i, j) || B.test(i, j));
        const a = inA.length, b = inB.length, ab = both.length, eo = either.length;
        const pick = {
          A: { sym: 'P(A)', words: 'A: ' + A.name, k: a, on: (x, y) => x },
          B: { sym: 'P(B)', words: 'B: ' + B.name, k: b, on: (x, y) => y },
          or: { sym: 'P(A \\cup B)', words: '<b>A or B</b>: ' + A.name + ', or ' + B.name + ' (or both)', k: eo, on: (x, y) => x || y },
          and: { sym: 'P(A \\cap B)', words: '<b>A and B</b>: ' + A.name + ', and also ' + B.name, k: ab, on: (x, y) => x && y },
          notA: { sym: 'P(A^c)', words: '<b>not A</b>: it is not true that ' + A.name, k: N - a, on: x => !x },
        }[s.v.show];
        out.append(answer('Chance of ' + pick.words, pick.sym + ' = ' + ratio(pick.k, N)));
        out.append(K.card('The events on the grid',
          K.p('$A$: ' + A.name + '. $B$: ' + B.name + '.'),
          twoDiceGrid(f, (i, j) => { const x = A.test(i, j), y = B.test(i, j), on = pick.on(x, y); return { html: tag(x, y), hi: on, dim: !on }; }),
          K.p('Each cell is an outcome (rows: first die, columns: second die). A cell shows A if it is in $A$, B if it is in $B$, AB if in both. Coloured cells: the event in the answer, ' + pick.k + ' of the ' + N + '.')));
        const st = [
          { text: '$A$ = ' + A.name + ': ' + pairsText(inA) + '. All ' + N + ' outcomes are equally likely, so count:', tex: fit('P(A)', [['=', '\\frac{|A|}{|S|}'], ...ratioRels(a, N)]) },
          { text: '$B$ = ' + B.name + ': ' + pairsText(inB) + '.', tex: fit('P(B)', [['=', '\\frac{|B|}{|S|}'], ...ratioRels(b, N)]) },
          { text: '<b>A and B</b>, written $A \\cap B$ (intersection): the outcomes in both, ' + pairsText(both) + '.' + (ab ? '' : ' $A$ and $B$ cannot happen together: they are <b>mutually exclusive</b> (disjoint).'), tex: fit('P(A \\cap B)', ratioRels(ab, N)) },
          { text: '<b>A or B</b>, written $A \\cup B$ (union): the outcomes in at least one of them. Counting the cells:', tex: fit('P(A \\cup B)', ratioRels(eo, N)) },
          { text: 'Check with the addition rule. Adding $P(A)$ and $P(B)$ counts the overlap $A \\cap B$ twice, so take it away once:', tex: fit('P(A \\cup B)', [['=', 'P(A) + P(B) - P(A \\cap B)'], ['=', raw(a, N) + ' + ' + raw(b, N) + ' - ' + raw(ab, N)], ['=', raw(a + b - ab, N) + '\\ \\checkmark']]) },
          { text: '<b>not A</b>, written $A^c$ (complement): the ' + (N - a) + ' outcomes outside $A$. $A$ and $A^c$ share nothing and together make $S$, so', tex: fit('P(A^c)', [['=', '1 - P(A)'], ['=', '1 - ' + raw(a, N)], ...ratioRels(N - a, N)]) },
        ];
        [[s.v.a, s.v.av, 'A'], [s.v.b, s.v.bv, 'B']].forEach(([type, v, L]) => {
          if (type === 'one') st.push({ text: 'Shortcut for $' + L + '$: “at least one ' + v + '” fails only when neither die shows ' + v + ', in $' + (f - 1) + ' \\times ' + (f - 1) + ' = ' + (f - 1) ** 2 + '$ ways. Note it is ' + (2 * f - 1) + ' outcomes, not ' + 2 * f + ': the cell (' + v + ', ' + v + ') would be counted twice.', tex: fit('P(' + L + ')', [['=', '1 - \\left(\\frac{' + (f - 1) + '}{' + f + '}\\right)^2'], ['=', '1 - ' + raw((f - 1) ** 2, N)], ...ratioRels(2 * f - 1, N)]) });
        });
        out.append(K.card('Step by step', steps(st)));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- conditional */
    // ?f=6&a=sum&av=10&b=first&bv=4     P(A | B); events as in "Events on two dice" (a, av, b, bv)
    conditional(el, query, ctx) {
      const s = K.state(ctx, { f: 6, a: 'sum', av: 10, b: 'first', bv: 4 }, query, draw);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        s.v.f = facesOf(s.v.f); tidyEvents(s, ['a', 'b']);
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Someone tells you that $B$ happened. How likely is $A$ now? Keep only the outcomes in $B$ and count those that are also in $A$.'),
          facesSeg('Faces on each die', s.v.f, f => { s.set({ f }, true); redo(); }),
          ...eventControls(s, 'a', redo), ...eventControls(s, 'b', redo),
          tryRow([
            ['Lecture 8.2: sum 10, first die 4', () => { s.set({ f: 6, a: 'sum', av: 10, b: 'first', bv: 4 }, true); redo(); }],
            ['Lecture 8.5: sum 8, first die 3', () => { s.set({ f: 6, a: 'sum', av: 8, b: 'first', bv: 3 }, true); redo(); }],
            ['Lecture 8.5: sum 7, first die 3', () => { s.set({ f: 6, a: 'sum', av: 7, b: 'first', bv: 3 }, true); redo(); }],
            ['Doubles, given sum 8', () => { s.set({ f: 6, a: 'doubles', b: 'sum', bv: 8 }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, N = f * f, S = cellsOf(f);
        const A = eventOf(s.v.a, s.v.av), B = eventOf(s.v.b, s.v.bv);
        const inA = S.filter(([i, j]) => A.test(i, j)), inB = S.filter(([i, j]) => B.test(i, j)), both = inB.filter(([i, j]) => A.test(i, j));
        const a = inA.length, b = inB.length, ab = both.length;
        const grid = twoDiceGrid(f, (i, j) => { const x = A.test(i, j), y = B.test(i, j); return { html: tag(x, y), hi: x && y, dim: !y }; });
        const legend = K.p('$A$: ' + A.name + '. $B$: ' + B.name + '. Faded cells are outside $B$ (ruled out by the news); coloured cells are in both $A$ and $B$.');
        if (!b) {
          out.append(K.note('$B$ (' + B.name + ') never happens with ' + f + '-faced dice, so “given $B$” makes no sense: $P(A \\mid B)$ is not defined. Pick another $B$.', 'warn'));
          out.append(K.card('The grid', legend, grid));
          return;
        }
        const pAB = F(ab, b), pA = F(a, N);
        out.append(answer('Chance of $A$ (' + A.name + ') given $B$ (' + B.name + ')', 'P(A \\mid B) = ' + ratio(ab, b)));
        out.append(K.card('Keep only $B$', legend, grid));
        const st = [
          { text: 'You are told that $B$ happened: ' + B.name + '. Every outcome outside $B$ is now impossible. The ' + b + ' outcomes of $B$ form the new, smaller sample space, and they are still equally likely: ' + pairsText(inB) + '.', tex: '|B| = ' + b },
          { text: 'Of these, the ones where $A$ also happens are $A \\cap B$: ' + pairsText(both) + '.', tex: '|A \\cap B| = ' + ab },
          { text: 'So, counting inside $B$:', tex: fit('P(A \\mid B)', [['=', '\\frac{|A \\cap B|}{|B|}'], ...ratioRels(ab, b)]) },
          { text: 'The same with the formula: the chance of both, divided by the chance of $B$. The ' + N + 's cancel:', tex: fit('P(A \\mid B)', ticked([['=', '\\frac{P(A \\cap B)}{P(B)}'], ['=', raw(ab, N) + ' \\div ' + raw(b, N)], ...ratioRels(ab, b)])) },
          { text: 'Turned around, this is the multiplication rule:', tex: fit('P(A \\cap B)', [['=', 'P(B)\\,{P(A \\mid B)}'], ['=', K.T(F(b, N)) + ' \\times ' + K.T(pAB)], ...valueRels(F(ab, N))]) },
          { text: 'Without the news, $A$ had chance $P(A) = ' + raw(a, N) + (pA.n === BigInt(a) && pA.d === BigInt(N) ? '' : ' = ' + K.T(pA)) + '$. ' + (pAB.eq(pA) ? 'Knowing $B$ does not change the chance of $A$: $A$ and $B$ are <b>independent</b>.' : pAB.cmp(pA) > 0 ? 'Knowing $B$ makes $A$ more likely, so $A$ and $B$ are not independent.' : 'Knowing $B$ makes $A$ less likely, so $A$ and $B$ are not independent.'), tex: 'P(A \\mid B) = ' + K.T(pAB) + (pAB.eq(pA) ? ' = ' : ' \\ne ') + K.T(pA) + ' = P(A)' },
        ];
        if (a) st.push({ text: 'The other way round is a different question, with a different answer in general:', tex: fit('P(B \\mid A)', [['=', '\\frac{|A \\cap B|}{|A|}'], ...ratioRels(ab, a)]) });
        out.append(K.card('Step by step', steps(st)));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- bayes */
    // ?f=6&w=1,1,1,1,1,3&pf=1/2&v=6&r=1
    //   w: the loaded die's weights, one per face (chance = weight / total); pf: chance of picking the fair die (0 to 1, 1/2 or 0.5)
    //   v: the face you see; r: how many rolls in a row (1–10) all showed v
    bayes(el, query, ctx) {
      const s = K.state(ctx, { f: 6, w: '1,1,1,1,1,3', pf: '1/2', v: 6, r: 1 }, query, draw);
      if (!(query && query.w)) s.v.w = heavyLast(facesOf(s.v.f));
      if (!(query && query.v)) s.v.v = facesOf(s.v.f);
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        const v = s.v;
        v.f = facesOf(v.f); v.v = whole(v.v, 1, v.f, v.f); v.r = whole(v.r, 1, 10, 1);
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('A bag holds a fair die and a loaded one. You pick one without looking and roll it: a ' + v.v + '. Which die is it likely to be?'),
          facesSeg('Faces on each die', v.f, f => { s.set({ f, w: heavyLast(f), v: f }, true); redo(); }),
          weightField(s, redo),
          K.prob({ label: 'Chance of picking the fair die', value: v.pf, presets: ['1/2', '1/3', '2/3', '9/10'], onChange: pf => s.set({ pf }) }),
          K.int({ label: 'The face you see $v$', value: v.v, min: 1, max: v.f, onChange: x => { s.set({ v: x }, true); redo(); } }),
          K.int({ label: 'Rolls in a row that all showed $v$', value: v.r, min: 1, max: 10, onChange: r => s.set({ r }) }),
          tryRow([
            ['Six-heavy die', () => { s.set({ f: 6, w: '1,1,1,1,1,3', pf: '1/2', v: 6, r: 1 }, true); redo(); }],
            ['Three sixes in a row', () => { s.set({ f: 6, w: '1,1,1,1,1,3', pf: '1/2', v: 6, r: 3 }, true); redo(); }],
            ['A die that never shows 6', () => { s.set({ f: 6, w: '1,1,1,1,1,0', pf: '1/2', v: 6, r: 1 }, true); redo(); }],
            ['Seeing a 1 instead', () => { s.set({ f: 6, w: '1,1,1,1,1,3', pf: '1/2', v: 1, r: 1 }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, v = s.v.v, r = s.v.r;
        let L, pf;
        try { L = weightsOf(s.v.w, f); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        try { pf = F.parse(s.v.pf); if (pf.cmp(0) < 0 || pf.cmp(1) > 0) throw 0; } catch (e) { out.append(K.note('The chance of picking the fair die must be between 0 and 1.', 'warn')); return; }
        const pl_ = F(1).sub(pf), q = L.ps[v - 1];
        const lf = F(1, f).pow(r), ll = q.pow(r);
        const jf = pf.mul(lf), jl = pl_.mul(ll), pe = jf.add(jl);
        const E = r === 1 ? 'a ' + v + ' is rolled' : 'all ' + r + ' rolls show ' + v;
        const Et = r === 1 ? '\\text{a } ' + v : v + '\\text{ in all ' + r + ' rolls}';
        if (pe.isZero()) { out.append(K.note('“' + E + '” cannot happen with these dice and this choice, so there is nothing to update: $P(\\text{fair} \\mid E)$ is not defined.', 'warn')); return; }
        const postF = jf.div(pe), postL = jl.div(pe);
        out.append(answer('Chance the die is fair, given that ' + E, 'P(\\text{fair} \\mid E) = ' + tdx(postF), 'and loaded: $P(\\text{loaded} \\mid E) = ' + tdx(postL) + '$. Before the roll, $P(\\text{fair}) = ' + K.T(pf) + '$.'));

        out.append(K.card('The loaded die',
          table(['Face', 'Weight', 'Chance = weight ÷ ' + pl(L.W)], upTo(f).map(i => [String(i), pl(L.ws[i - 1]), '$' + TD(L.ps[i - 1]) + '$']), { hi: new Set([v - 1]), compact: true }),
          K.p('Total weight $W = ' + L.ws.map(tx).join(' + ') + ' = ' + tx(L.W) + '$; each chance is the weight divided by $W$, so the chances add up to 1.')));

        // the tree
        const W = 470, H = 236, svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-tree', style: 'min-width:0;max-width:640px', role: 'img', 'aria-label': 'probability tree' });
        const nodes = { root: [16, 118], fair: [170, 62], loaded: [170, 174], fE: [324, 30], fN: [324, 94], lE: [324, 142], lN: [324, 206] };
        const edge = (a, b, label, hi) => { const [x1, y1] = nodes[a], [x2, y2] = nodes[b]; svg.append(K.sv('line', { x1, y1, x2, y2, class: 'edge' + (hi ? ' hi' : '') }), K.sv('text', { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 6, 'text-anchor': 'middle', class: 'elabel' }, label)); };
        edge('root', 'fair', 'fair ' + pf.str(), false); edge('root', 'loaded', 'loaded ' + pl_.str(), false);
        edge('fair', 'fE', 'E ' + lf.str(), true); edge('fair', 'fN', 'not E ' + F(1).sub(lf).str(), false);
        edge('loaded', 'lE', 'E ' + ll.str(), true); edge('loaded', 'lN', 'not E ' + F(1).sub(ll).str(), false);
        [['fE', jf, true], ['fN', pf.mul(F(1).sub(lf)), false], ['lE', jl, true], ['lN', pl_.mul(F(1).sub(ll)), false]].forEach(([k, val, hi]) => svg.append(K.sv('text', { x: nodes[k][0] + 6, y: nodes[k][1] + 4, class: 'leaf' + (hi ? ' hi' : '') }, (hi ? 'E: ' : 'not E: ') + val.str())));
        out.append(K.card('The tree', K.p('$E$: ' + E + '. First branch: which die. Second branch: whether $E$ happens. Multiply along a path to get the chance at its end.'), h('div', { class: 'lk-chart-wrap' }, svg)));

        out.append(K.card('Step by step',
          steps([
            { text: 'The fair die shows ' + v + ' with chance $\\frac{1}{' + f + '}$' + (r > 1 ? '. The rolls do not affect each other, so ' + r + ' in a row multiply:' : ':'), tex: fit('P(E \\mid \\text{fair})', [...(r > 1 ? [['=', '\\left(\\frac{1}{' + f + '}\\right)^{' + r + '}']] : []), ...valueRels(lf)]) },
            { text: 'The loaded die shows ' + v + ' with chance $\\frac{w_{' + v + '}}{W} = \\frac{' + tx(L.ws[v - 1]) + '}{' + tx(L.W) + '}$' + (r > 1 ? ', and ' + r + ' times in a row:' : ':'), tex: fit('P(E \\mid \\text{loaded})', [...(r > 1 ? [['=', '\\left(' + K.T(q) + '\\right)^{' + r + '}']] : []), ...valueRels(ll)]) },
            { text: '<b>Total probability</b>: $E$ happens either with the fair die or with the loaded one. Add the two paths of the tree:', tex: fit('P(E)', [['=', ['{P(E \\mid \\text{fair})}\\,P(\\text{fair})', '{P(E \\mid \\text{loaded})}\\,P(\\text{loaded})']], ['=', [K.T(lf) + ' \\times ' + K.T(pf), K.T(ll) + ' \\times ' + K.T(pl_)]], ['=', [K.T(jf), K.T(jl)]], ...valueRels(pe)]) },
            { text: '<b>Bayes’ rule</b>: the share of $P(E)$ that comes through the fair die.', tex: fit('P(\\text{fair} \\mid E)', [['=', '\\frac{P(E \\mid \\text{fair})\\,P(\\text{fair})}{P(E)}'], ['=', K.T(jf) + ' \\div ' + K.T(pe)], ['=', K.T(jf) + ' \\times ' + K.T(F(1).div(pe))], ...valueRels(postF)]) },
            { text: 'The same for the loaded die:', tex: fit('P(\\text{loaded} \\mid E)', [['=', K.T(jl) + ' \\div ' + K.T(pe)], ['=', K.T(jl) + ' \\times ' + K.T(F(1).div(pe))], ...valueRels(postL)]) },
            { text: 'Check: the two answers add up to 1.', tex: K.T(postF) + ' + ' + K.T(postL) + ' = 1\\ \\checkmark' },
            { text: postF.eq(pf) ? 'Here the news changes nothing: both dice make $E$ equally likely, so $P(\\text{fair})$ stays $' + K.T(pf) + '$.' : postF.cmp(pf) < 0 ? 'Seeing $E$ moved the chance of “fair” down from $' + K.T(pf) + '$ to $' + K.T(postF) + '$: $E$ is more typical of the loaded die.' : 'Seeing $E$ moved the chance of “fair” up from $' + K.T(pf) + '$ to $' + K.T(postF) + '$: $E$ is more typical of the fair die.' },
          ]),
          table(['Die', 'Before<br>$P(\\text{die})$', '$P(E \\mid \\text{die})$', 'Product', 'After<br>$P(\\text{die} \\mid E)$'],
            [['fair', '$' + K.T(pf) + '$', '$' + K.T(lf) + '$', '$' + K.T(jf) + '$', '$' + TD(postF) + '$'], ['loaded', '$' + K.T(pl_) + '$', '$' + K.T(ll) + '$', '$' + K.T(jl) + '$', '$' + TD(postL) + '$'], ['Total', '1', '', '$' + K.T(pe) + '$', '1']], { compact: true })));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- pmf */
    // ?f=6&die=fair&x=4                  one die's PMF and CDF; x = the value you ask about (any number −1000 to 1000, like 3.5)
    // ?f=6&die=loaded&w=1,1,1,1,1,3      a loaded die: one weight per face, each divided by the total
    pmf(el, query, ctx) {
      const s = K.state(ctx, { f: 6, die: 'fair', w: '1,1,1,1,1,3', x: '4' }, query, draw);
      if (!(query && query.w)) s.v.w = heavyLast(facesOf(s.v.f));
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        const v = s.v;
        v.f = facesOf(v.f); if (v.die !== 'loaded') v.die = 'fair';
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Roll one die and let $X$ be the face. Its PMF gives the chance of each value, $P(X = x)$; its CDF adds them up to $x$, $F(x) = P(X \\le x)$.'),
          facesSeg('Faces on the die', v.f, f => { s.set({ f, w: heavyLast(f) }, true); redo(); }),
          K.seg({ label: 'The die', options: [['fair', 'Fair'], ['loaded', 'Loaded']], value: v.die, onChange: die => { s.set({ die }, true); redo(); } }),
          ...(v.die === 'loaded' ? [weightField(s, redo)] : []),
          K.prob({ label: 'A value $x$ to ask about', value: v.x, presets: ['0', '2', '3.5', String(v.f), String(v.f + 1)], min: -1000, max: 1000, onChange: x => s.set({ x }) }),
          tryRow([
            ['Lecture 9.5: fair die', () => { s.set({ f: 6, die: 'fair', x: '4' }, true); redo(); }],
            ['Loaded, x = 3.5', () => { s.set({ die: 'loaded', x: '3.5' }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, loaded = s.v.die === 'loaded', faces = upTo(f);
        let ps, L = null, x;
        if (loaded) { try { L = weightsOf(s.v.w, f); ps = L.ps; } catch (e) { out.append(K.note(e.message, 'warn')); return; } }
        else ps = faces.map(() => F(1, f));
        try { x = F.parse(s.v.x); } catch (e) { out.append(K.note('Type $x$ as a number, like 4 or 3.5.', 'warn')); return; }
        const isFace = x.isInt() && x.cmp(1) >= 0 && x.cmp(f) <= 0, xi = isFace ? Number(x.n) : null;
        const upto = faces.filter(k => x.cmp(k) >= 0), Fx = add(upto.map(k => ps[k - 1])), px = isFace ? ps[xi - 1] : F(0);
        const cum = []; faces.reduce((acc, k) => { const c = acc.add(ps[k - 1]); cum.push(c); return c; }, F(0));
        out.append(answer('For ' + (loaded ? 'the loaded die' : 'a fair die') + ' with ' + f + ' faces and $x = ' + tx(x) + '$', '\\begin{aligned} P(X = ' + tx(x) + ') &= ' + tdx(px) + ' \\\\ F(' + tx(x) + ') = P(X \\le ' + tx(x) + ') &= ' + tdx(Fx) + ' \\end{aligned}'));
        const st = [
          ...(loaded
            ? [{ text: 'Add up the weights:', tex: fit('W', [['=', cap(L.ws.map(tx))], ['=', tx(L.W)]]) },
              { text: 'Each face’s chance is its weight $w_k$ divided by the total $W$ (the table below has every face):', tex: 'p(k) = \\frac{w_k}{W} = \\frac{w_k}{' + tx(L.W) + '}' }]
            : [{ text: 'A fair die favours no face, so each of the ' + f + ' faces has the same chance:', tex: 'p(k) = \\frac{1}{' + f + '}\\ \\text{ for each face } k' }]),
          { text: 'Check: a PMF is never negative and adds up to 1.', tex: fit('\\sum p(k)', [['=', cap(ps.map(K.T))], ['=', '1\\ \\checkmark']]) },
          isFace
            ? { text: '$X = ' + tx(x) + '$ is one of the faces, so read its chance off the PMF:', tex: fit('P(X = ' + tx(x) + ')', [['=', 'p(' + tx(x) + ')'], ...valueRels(px)]) }
            : { text: '$X$ only takes the values $1, 2, \\dots, ' + f + '$, and ' + tx(x) + ' is not one of them:', tex: 'P(X = ' + tx(x) + ') = 0' },
          upto.length === 0
            ? { text: 'No face is at most ' + tx(x) + ', so nothing is added up yet:', tex: 'F(' + tx(x) + ') = P(X \\le ' + tx(x) + ') = 0' }
            : { text: 'The CDF adds the chances of every face up to $x$' + (upto.length === f ? ' (here all of them)' : ': faces ' + andList(upto.map(String))) + ':', tex: fit('F(' + tx(x) + ')', [['=', 'P(X \\le ' + tx(x) + ')'], ['=', cap(upto.map(k => 'p(' + k + ')'))], ['=', cap(upto.map(k => K.T(ps[k - 1])))], ...valueRels(Fx)]) },
          { text: 'The rest is the chance of a bigger value:', tex: fit('P(X > ' + tx(x) + ')', [['=', '1 - F(' + tx(x) + ')'], ['=', '1 - ' + K.T(Fx)], ...valueRels(F(1).sub(Fx))]) },
        ];
        out.append(K.card('Step by step', steps(st)));
        const mark = Math.max(0, Math.min(f + 1, x.num()));
        out.append(K.card('The PMF and the CDF',
          bars({ xs: faces, ys: ps, hi: isFace ? [xi - 1] : [], xName: 'x (face)', yName: 'P(X = x)' }),
          K.cdf({ xs: faces, ps, xName: 'x', mark }),
          K.p('The CDF is a staircase: it is 0 before the first face, jumps up by $p(k)$ at each face $k$, stays flat in between (so $F(3.5) = F(3)$) and is 1 from the last face on. The dashed line marks $x = ' + tx(x) + '$.'),
          table(['$k$', ...(loaded ? ['Weight $w_k$'] : []), '$p(k) = P(X = k)$', '$F(k) = P(X \\le k)$'], faces.map(k => ['$' + k + '$', ...(loaded ? [pl(L.ws[k - 1])] : []), '$' + TD(ps[k - 1]) + '$', '$' + TD(cum[k - 1]) + '$']), { hi: new Set(isFace ? [xi - 1] : []), compact: true })));
      }
      build(); draw();
    },

    /* ---------------------------------------------------------------- expectation */
    // ?f=6&die=fair                      E[X], E[X²], Var(X) and SD of one die, then the sum of two such dice
    // ?f=6&die=loaded&w=1,1,1,1,1,3      a loaded die: one weight per face, each divided by the total
    expectation(el, query, ctx) {
      const s = K.state(ctx, { f: 6, die: 'fair', w: '1,1,1,1,1,3' }, query, draw);
      if (!(query && query.w)) s.v.w = heavyLast(facesOf(s.v.f));
      const { controls, out } = K.layout(el);
      const redo = () => { build(); draw(); };
      function build() {
        const v = s.v;
        v.f = facesOf(v.f); if (v.die !== 'loaded') v.die = 'fair';
        tidyLink(s, query);
        controls.innerHTML = '';
        controls.append(
          K.p('Roll one die many times: the average of the faces settles at the expectation $\\E[X]$, and the variance measures how far the faces spread around it.'),
          facesSeg('Faces on the die', v.f, f => { s.set({ f, w: heavyLast(f) }, true); redo(); }),
          K.seg({ label: 'The die', options: [['fair', 'Fair'], ['loaded', 'Loaded']], value: v.die, onChange: die => { s.set({ die }, true); redo(); } }),
          ...(v.die === 'loaded' ? [weightField(s, redo)] : []),
          tryRow([
            ['Lectures 10.2–10.5: fair die', () => { s.set({ f: 6, die: 'fair' }, true); redo(); }],
            ['Loaded die', () => { s.set({ die: 'loaded' }, true); redo(); }],
            ['20 faces', () => { s.set({ f: 20, die: 'fair', w: heavyLast(20) }, true); redo(); }],
          ]));
      }
      function draw() {
        out.innerHTML = '';
        const f = s.v.f, loaded = s.v.die === 'loaded', faces = upTo(f);
        let ps, L = null;
        if (loaded) { try { L = weightsOf(s.v.w, f); ps = L.ps; } catch (e) { out.append(K.note(e.message, 'warn')); return; } }
        else ps = faces.map(() => F(1, f));
        const xp = faces.map(k => ps[k - 1].mul(k)), x2p = faces.map(k => ps[k - 1].mul(k * k));
        const mu = add(xp), ex2 = add(x2p), varr = ex2.sub(mu.mul(mu));
        const devp = faces.map(k => F(k).sub(mu).pow(2).mul(ps[k - 1]));
        out.append(answer('One ' + (loaded ? 'loaded' : 'fair') + ' die with ' + f + ' faces', '\\begin{aligned} \\E[X] &= ' + TD(mu) + ' \\\\ \\Var(X) &= ' + TD(varr) + ' \\\\ \\SD(X) &' + sqrtShort(varr) + ' \\end{aligned}'));

        out.append(K.card('The table',
          table(['$x$', '$p(x)$', '$x\\,p(x)$', '$x^2$', '$x^2\\,p(x)$'],
            faces.map(k => ['$' + k + '$', '$' + K.T(ps[k - 1]) + '$', '$' + K.T(xp[k - 1]) + '$', '$' + k * k + '$', '$' + K.T(x2p[k - 1]) + '$'])
              .concat([['Sum', '$1$', '$' + K.T(mu) + '$', '', '$' + K.T(ex2) + '$']]), { compact: true }),
          pmfMean(faces, ps, mu),
          K.p('$\\E[X]$ is the balance point of the PMF: put weights $p(x)$ at the faces and the bar balances there. It need not be a face: a ' + f + '-faced die never shows ' + tx(mu) + '.')));

        out.append(K.card('Step by step',
          steps([
            { text: 'The <b>expectation</b> (mean) is each value times its chance, added up (the third column):', tex: fit('\\E[X]', [['=', '\\sum x\\,p(x)'], ['=', cap(faces.map(k => k + ' \\times ' + K.T(ps[k - 1])))], ...valueRels(mu)]) },
            { text: 'The same with $x^2$ in place of $x$ (the last column):', tex: fit('\\E[X^2]', [['=', '\\sum x^2 p(x)'], ['=', cap(faces.map(k => k * k + ' \\times ' + K.T(ps[k - 1])))], ...valueRels(ex2)]) },
            { text: 'The <b>variance</b> is the mean of the squares minus the square of the mean:', tex: fit('\\Var(X)', [['=', '\\E[X^2] - (\\E[X])^2'], ['=', K.T(ex2) + ' - ' + sq(mu)], ['=', K.T(ex2) + ' - ' + K.T(mu.mul(mu))], ...valueRels(varr)]) },
            { text: 'Check with the definition, the mean squared distance from $\\mu = \\E[X]$:', tex: fit('\\Var(X)', [['=', '\\sum (x - \\mu)^2 p(x)'], ['=', cap(devp.map(K.T))], ['=', K.T(add(devp)) + '\\ \\checkmark']]) },
            { text: 'The <b>standard deviation</b> is the square root, back in the units of $X$:', tex: fit('\\SD(X)', [['=', '\\sqrt{\\Var(X)}'], ['=', '\\sqrt{' + K.T(varr) + '}'], ...rootRels(varr)]) },
          ])));

        // two dice: the sum
        const sumP = new Map();
        for (let i = 1; i <= f; i++) for (let j = 1; j <= f; j++) sumP.set(i + j, (sumP.get(i + j) || F(0)).add(ps[i - 1].mul(ps[j - 1])));
        const ES = add([...sumP].map(([t, p]) => p.mul(t))), ES2 = add([...sumP].map(([t, p]) => p.mul(t * t))), VS = ES2.sub(ES.mul(ES));
        const sd1 = Math.sqrt(varr.num());
        out.append(K.card('Two dice: $X_1 + X_2$',
          steps([
            { text: 'Roll two such dice and add the faces: $X_1 + X_2$. Expectation is <b>linear</b>: the expectation of a sum is the sum of the expectations.', tex: fit('\\E[X_1 + X_2]', [['=', '\\E[X_1] + \\E[X_2]'], ['=', K.T(mu) + ' + ' + K.T(mu)], ...valueRels(mu.mul(2))]) },
            { text: 'The two dice do not affect each other (they are <b>independent</b>), so their variances add too:', tex: fit('\\Var(X_1 + X_2)', [['=', '\\Var(X_1) + \\Var(X_2)'], ['=', K.T(varr) + ' + ' + K.T(varr)], ...valueRels(varr.mul(2))]) },
            { text: 'Check from the distribution of the sum: each pair $(i, j)$ has chance $p(i)\\,p(j)$, which gives $P(X_1 + X_2 = t)$ for $t = 2, \\dots, ' + 2 * f + '$. Then', tex: fit('\\E[X_1 + X_2]', [['=', '\\sum t\\,P(X_1 + X_2 = t)'], ['=', K.T(ES) + '\\ \\checkmark']]) },
            { text: 'and, with $\\E[(X_1 + X_2)^2] = \\sum t^2\\,P(X_1 + X_2 = t) = ' + K.T(ES2) + '$,', tex: fit('\\Var(X_1 + X_2)', [['=', '\\E[(X_1 + X_2)^2] - ' + sq(ES)], ['=', K.T(ES2) + ' - ' + K.T(ES.mul(ES))], ['=', K.T(VS) + '\\ \\checkmark']]) },
            { text: 'Standard deviations do <b>not</b> add: take the square root of the added variances, not $' + dec(sd1) + ' + ' + dec(sd1) + ' = ' + dec(2 * sd1) + '$.', tex: fit('\\SD(X_1 + X_2)', [['=', '\\sqrt{' + K.T(varr.mul(2)) + '}'], ...rootRels(varr.mul(2))]) },
          ]),
          !loaded && f === 6 ? K.note('The lectures’ numbers for a fair six-faced die (Stats 1 Week 10, lectures 10.2–10.5): $\\E[X] = \\frac{7}{2}$, $\\Var(X) = \\frac{35}{12}$, $\\E[X + Y] = 7$ and $\\Var(X + Y) = \\frac{70}{12}$, the same as here ($\\frac{70}{12} = \\frac{35}{6}$).', 'good') : null));
      }
      build(); draw();
    },
  });
})();
