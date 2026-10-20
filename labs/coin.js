/* Coin lab: probability, random variables, distributions, estimation and testing with coins.
   Topics are listed in labs.json; each one below takes its values from the link (?n=4&p=1/2) and keeps them there.
   This file: space, events, probability, conditional, independence, bayes, random-variable, pmf-cdf, expectation,
   bernoulli, binomial, geometric, negative-binomial, poisson (the other coin topics are in coin-2.js).
   The link parameters of each topic are listed in the comment above it. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, TD, h } = K;

  /** all 2^n outcomes of n tosses, as strings like "HTH" */
  const outcomes = n => { const out = []; for (let m = 0; m < 2 ** n; m++) { let s = ''; for (let i = n - 1; i >= 0; i--) s += (m >> i) & 1 ? 'T' : 'H'; out.push(s); } return out; };
  const heads = s => [...s].filter(c => c === 'H').length;

  /* ================================================================== helpers shared by the topics */

  // the few styles only this lab needs, in the site's theme colours
  const CSS = [
    '.cl-try { min-height: 44px; line-height: 1.25; padding: 6px 12px; text-align: left; }',
    '.cl-group { display: grid; gap: 10px; padding: 12px; border: 1px solid var(--line); border-radius: 14px; }',
    '.cl-group-h { font-size: 13px; font-weight: 800; color: var(--ink-2); }',
    '.cl-set { font-family: var(--mono); font-size: .88em; overflow-wrap: anywhere; }',
    '.cl-tag { align-self: center; margin-left: 3px; font: 700 11px/1 var(--font); color: var(--ink-3); }',
    '.lk-outcome.cl-dim { opacity: .35; }',
    '.lk-outcome.cl-in { border-style: dashed; border-color: var(--ink-3); }',
    '.cl-cell { white-space: normal; text-align: left; min-width: 7em; }',
    '.cl-cell .cl-set, .cl-cell small { display: block; margin-top: 2px; font-size: .8em; color: var(--ink-3); }',
    '.cl-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: var(--ink-2); margin: 6px 0 2px; }',
    '.cl-key { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-right: 6px; vertical-align: -1px; }',
    '.cl-key.k1 { background: color-mix(in srgb, var(--accent) 55%, var(--bg-elev)); }',
    '.cl-key.k2 { background: var(--pick); }',
    '.lk-chart .cl-b1 { fill: color-mix(in srgb, var(--accent) 55%, var(--bg-elev)); }',
    '.lk-chart .cl-b2 { fill: var(--pick); }',
    '.lk-chart .cl-band { fill: var(--pick-soft); }',
    '.lk-chart .cl-curve { fill: none; stroke: var(--accent); stroke-width: 2.5; }',
    '.lk-chart .cl-lbl, .lk-tree .cl-lbl { fill: var(--ink-2); font: 600 11px var(--font); }',
    '.lk-tree .cl-node { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1.5; }',
    '.lk-tree .cl-val { fill: var(--accent-ink); font: 700 12px var(--font); }',
    '.lk-tree.cl-small { max-width: 440px; }',
    '.cl-controls + .lk-out > * { min-width: 0; }',
    // a tall panel of controls scrolls by itself instead of running below the window (wide screens, where it is sticky)
    '@media (min-width: 861px) { .lk-controls.cl-controls { max-height: calc(100vh - 80px); overflow-y: auto; } }',
  ].join('\n');
  if (!document.getElementById('coin-lab-css')) document.head.append(h('style', { id: 'coin-lab-css', text: CSS }));

  /** K.layout, with this lab's controls panel (see the CSS above) */
  const frame = el => { const f = K.layout(el); f.controls.classList.add('cl-controls'); return f; };
  /** a whole number from the link, kept between lo and hi (d when it is not a number) */
  const whole = (v, lo, hi, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  /** an exact number from a box or the link, between lo and hi; throws a message the page shows */
  function frac(v, lo, hi, what) {
    const x = F.parse(v);
    if (x.cmp(lo) < 0 || x.cmp(hi) > 0) throw new Error(what + ' must be between ' + lo + ' and ' + hi + '; it is ' + x.str() + '.');
    return x;
  }
  /** the value of a fraction as a float, also when its numerator or denominator is too long for one */
  function num(fr) {
    fr = F(fr);
    const la = String(fr.n < 0n ? -fr.n : fr.n).length, ld = String(fr.d).length;
    if (la < 300 && ld < 300) return Number(fr.n) / Number(fr.d);
    const sh = ld - la + 20, t = 10n ** BigInt(Math.abs(sh));
    return Number(sh >= 0 ? (fr.n * t) / fr.d : fr.n / (fr.d * t)) / Math.pow(10, sh);
  }
  /** a decimal for TeX: k places, or 3 significant figures (× 10^…) when the number is tiny */
  function decT(x, k = 4) {
    if (!Number.isFinite(x)) return '\\text{?}';
    if (x !== 0 && Math.abs(x) < 1e-3) { const [m, e] = x.toExponential(2).split('e'); return m + ' \\times 10^{' + (+e) + '}'; }
    if (Math.abs(x) >= 1e6) { const [m, e] = x.toExponential(3).split('e'); return m + ' \\times 10^{' + (+e) + '}'; }
    const r = +x.toFixed(k);
    return String(Object.is(r, -0) ? 0 : r);
  }
  /** a fraction too long to read (numerator or denominator over 18 digits) is shown as a decimal ending in "…" */
  const isLong = fr => String(fr.n < 0n ? -fr.n : fr.n).length > 18 || String(fr.d).length > 18;
  function longDec(x) {
    if (x === 0) return '0';
    if (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e6) { const [m, e] = x.toExponential(3).split('e'); return m + '\\ldots \\times 10^{' + (+e) + '}'; }
    return String(+x.toPrecision(Math.abs(x) >= 1 ? 6 : 4)) + '\\ldots';
  }
  /** TeX of a fraction: \frac{3}{8}, or 0.1234… when it is too long */
  const T = fr => { fr = F(fr); return isLong(fr) ? longDec(num(fr)) : fr.tex(); };
  /** TeX of an exact fraction and its decimal: "\frac{3}{8} = 0.375", "\frac{1}{3} \approx 0.3333" */
  function TX(fr, k = 4) {
    fr = F(fr);
    if (isLong(fr)) return longDec(num(fr));
    if (fr.isInt()) return fr.tex();
    const d = decT(num(fr), k);
    let exact = false;
    try { exact = F.parse(d).eq(fr); } catch (e) { exact = false; }
    return fr.tex() + (exact ? ' = ' : ' \\approx ') + d;
  }
  /** a fraction to a power, for TeX: brackets around fractions, nothing at all for the power 0 */
  const powT = (fr, e) => (e === 0 ? '' : (fr.isInt() && fr.n >= 0n ? fr.tex() : '\\left(' + fr.tex() + '\\right)') + (e === 1 ? '' : '^{' + e + '}'));
  /** a whole number for a product: (-3) in brackets */
  const nb = x => (x < 0 ? '(' + x + ')' : String(x));
  const pl = (k, word) => k + ' ' + word + (k === 1 ? '' : 's');
  const tosses = k => k + (k === 1 ? ' toss' : ' tosses');
  const ord = r => r + ((r % 100 >= 11 && r % 100 <= 13) ? 'th' : ['th', 'st', 'nd', 'rd'][r % 10] || 'th');
  const sumF = list => list.reduce((a, x) => a.add(x), F(0));
  /** lhs = a = b = … on one line (the kit wraps it after "=" on a narrow phone); a part starting with \approx gets ≈ instead */
  const chain = (lhs, ...rest) => lhs + rest.map(x => (/^\\approx/.test(x) ? ' ' + x : ' = ' + x)).join('');
  /** integer square root of a BigInt */
  function isqrt(n) { if (n < 2n) return n; let x = BigInt(Math.floor(Math.sqrt(Number(n)))); while (x * x > n) x--; while ((x + 1n) * (x + 1n) <= n) x++; return x; }
  /** "= \frac12 = 0.5" when the square root of a fraction is exact, else "\approx 0.866" */
  function sqrtT(v) { const a = isqrt(v.n), b = isqrt(v.d); if (a * a === v.n && b * b === v.d) return '= ' + TX(F(a, b)); return '\\approx ' + decT(Math.sqrt(num(v)), 4); }

  /** chance of one outcome with h heads: p^h (1 - p)^(n - h), for h = 0, 1, …, n */
  function perHeads(n, p) { const q = F(1).sub(p), out = []; for (let i = 0; i <= n; i++) out.push(p.pow(i).mul(q.pow(n - i))); return out; }
  /** how many outcomes of the list have 0, 1, …, n heads */
  function countHeads(list, n) { const c = new Array(n + 1).fill(0); list.forEach(o => c[heads(o)]++); return c; }
  /** the chance of a set of outcomes: add p^h (1 - p)^(n - h) over its outcomes */
  const chance = (list, n, ph) => countHeads(list, n).reduce((a, c, i) => (c ? a.add(ph[i].mul(c)) : a), F(0));
  /** that sum written out in TeX, outcomes with the same number of heads grouped: sym (letters), nums (numbers), vals (each group) */
  function sumT(list, n, p, keepGroups) {
    const q = F(1).sub(p), ph = perHeads(n, p), sym = [], nums = [], vals = [];
    if (!keepGroups && p.eq(F(1, 2)) && list.length) {
      // a fair coin: every outcome has the same chance (1/2)^n
      return { sym: list.length + '\\cdot \\left(\\frac12\\right)^{' + n + '}', nums: (list.length === 1 ? '' : list.length + '\\cdot ') + powT(p, n), vals: T(ph[0].mul(list.length)), terms: 1 };
    }
    countHeads(list, n).forEach((c, i) => {
      if (!c) return;
      const lead = c === 1 ? '' : c + '\\cdot ';
      sym.push(lead + (i ? 'p' + (i > 1 ? '^{' + i + '}' : '') : '') + (n - i ? '(1-p)' + (n - i > 1 ? '^{' + (n - i) + '}' : '') : ''));
      nums.push(lead + [powT(p, i), powT(q, n - i)].filter(Boolean).join('\\cdot '));
      vals.push(T(ph[i].mul(c)));
    });
    return { sym: sym.join(' + ') || '0', nums: nums.join(' + ') || '0', vals: vals.join(' + ') || '0', terms: vals.length };
  }

  /** outcomes drawn as coins; opt.cls(o) adds classes ('hi', 'cl-dim', 'cl-in'), opt.tag(o) a small label after the coins */
  function coinRows(list, opt = {}) {
    const n = list.length ? list[0].length : 1, size = opt.size || (n <= 3 ? 24 : n === 4 ? 21 : 17);
    return h('div', { class: 'lk-outcomes' }, list.map(o => {
      const tag = opt.tag ? opt.tag(o) : '';
      return h('span', { class: 'lk-outcome' + (opt.cls ? ' ' + opt.cls(o) : ''), title: o, html: [...o].map(f => K.coin(f, size)).join('') + (tag ? '<small class="cl-tag">' + tag + '</small>' : '') });
    }));
  }
  /** a set of outcomes as text: {HHT, HTH}, or ∅ */
  const setT = list => (list.length ? '<span class="cl-set">{' + list.join(', ') + '}</span>' : '$\\varnothing$ (no outcome)');

  /** rebuild the controls, keeping the keyboard focus on the same control */
  function refill(box, fill) {
    const all = () => [...box.querySelectorAll('button, input, select')];
    const i = all().indexOf(document.activeElement);
    box.innerHTML = '';
    fill();
    const el = i >= 0 ? all()[i] : null;
    if (el) el.focus({ preventScroll: true });
  }
  /** "Try" chips: each loads a lecture example or a telling case ([label, values or a function giving them, tooltip]) */
  const tries = (list, load) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }),
    h('div', { class: 'lk-presets' }, list.map(([label, patch, title]) => h('button', { type: 'button', class: 'lk-chip cl-try', text: label, title: title || null, onclick: () => load(typeof patch === 'function' ? patch() : patch) }))));
  /** the frame every topic shares: values from the link (fixed by fix), controls built by ui, output by draw */
  function topic(el, query, ctx, defaults, fix) {
    const t = { ui: () => {}, draw: () => {} };
    t.s = K.state(ctx, defaults, query, () => t.draw());
    fix(t.s.v);
    Object.assign(t, frame(el));
    /** new values that may change the controls too (Try chips, a new n): fix them, rebuild, redraw */
    t.load = patch => { t.s.set(patch, true); fix(t.s.v); refill(t.controls, t.ui); t.draw(); };
    t.start = (ui, draw) => { t.ui = ui; t.draw = () => { t.out.innerHTML = ''; draw(); }; refill(t.controls, ui); t.draw(); };
    return t;
  }
  /** a probability from the link; on a bad value, a warning in the output and null */
  function readP(out, v, what = 'The chance of heads $p$') {
    try { return frac(v, 0, 1, what); } catch (e) { out.append(K.note(e.message, 'warn')); return null; }
  }

  /* ------------------------------------------------------------------ events, kept in the link as short codes */
  const EV_KINDS = [['eq', 'Exactly k heads'], ['ge', 'At least k heads'], ['le', 'At most k heads'], ['h', 'Toss number i is heads'], ['t', 'Toss number i is tails'],
    ['hL', 'The last toss is heads'], ['tL', 'The last toss is tails'], ['same', 'All tosses the same'], ['alt', 'Heads and tails take turns'], ['hh', 'Two heads in a row'], ['even', 'An even number of heads']];
  const KIND_K = ['eq', 'ge', 'le'], KIND_I = ['h', 't'];
  /** the event with this code on n tosses (null for an unknown code); its k or i is kept within 0…n or 1…n */
  function event(code, n) {
    const m = /^(eq|ge|le|h|t)(\d+)$/.exec(String(code || ''));
    const kind = m ? m[1] : String(code || '');
    if (!m && !EV_KINDS.some(([c]) => c === kind && !KIND_K.includes(c) && !KIND_I.includes(c))) return null;
    let x = null, name, test;
    if (KIND_K.includes(kind)) {
      const k = (x = Math.min(+m[2], n));
      name = kind === 'eq' ? (k === 0 ? 'no heads' : 'exactly ' + pl(k, 'head')) : (kind === 'ge' ? 'at least ' : 'at most ') + pl(k, 'head');
      test = kind === 'eq' ? o => heads(o) === k : kind === 'ge' ? o => heads(o) >= k : o => heads(o) <= k;
    } else if (KIND_I.includes(kind)) {
      const i = (x = Math.max(1, Math.min(+m[2], n))), face = kind === 'h' ? 'H' : 'T';
      name = (i === 1 ? 'the first toss' : i === n ? 'the last toss' : 'toss ' + i) + ' is ' + (face === 'H' ? 'heads' : 'tails');
      test = o => o[i - 1] === face;
    } else if (kind === 'hL' || kind === 'tL') { const face = kind === 'hL' ? 'H' : 'T'; name = 'the last toss is ' + (face === 'H' ? 'heads' : 'tails'); test = o => o[n - 1] === face; }
    else if (kind === 'same') { name = 'all tosses show the same face'; test = o => !o.includes(o[0] === 'H' ? 'T' : 'H'); }
    else if (kind === 'alt') { name = 'heads and tails take turns'; test = o => !/HH|TT/.test(o); }
    else if (kind === 'hh') { name = 'two heads in a row somewhere'; test = o => o.includes('HH'); }
    else { name = 'an even number of heads'; test = o => heads(o) % 2 === 0; }
    return { code: kind + (x == null ? '' : x), kind, x, name, test };
  }
  /** choose an event: a rule, then its number of heads k or its toss number i */
  function eventPicker(title, code, n, pick) {
    const ev = event(code, n);
    const box = h('div', { class: 'cl-group' }, h('div', { class: 'cl-group-h', html: K.rich(title) }),
      K.select({ label: 'Rule', options: EV_KINDS, value: ev.kind, onChange: kind => {
        const x = KIND_K.includes(kind) ? (KIND_K.includes(ev.kind) ? ev.x : Math.min(2, n)) : KIND_I.includes(kind) ? (KIND_I.includes(ev.kind) ? ev.x : 1) : '';
        pick(kind + x);
      } }));
    if (KIND_K.includes(ev.kind)) box.append(K.int({ label: 'Number of heads $k$', value: ev.x, min: 0, max: n, onChange: v => pick(ev.kind + v) }));
    if (KIND_I.includes(ev.kind)) box.append(K.int({ label: 'Toss number $i$ (1 to ' + n + ')', value: ev.x, min: 1, max: n, onChange: v => pick(ev.kind + v) }));
    return box;
  }

  /* ------------------------------------------------------------------ random variables on n tosses (x=… in the link) */
  const RV = {
    heads: { label: 'Number of heads', name: 'the number of heads', f: o => heads(o) },
    run: { label: 'Longest run of heads', name: 'the longest run of heads in a row (0 if there is no head)', f: o => Math.max(...o.split('T').map(r => r.length)) },
    first: { label: 'Toss of the first head (0 if none)', name: 'the toss on which the first head appears (0 if no head appears)', f: o => o.indexOf('H') + 1 },
    diff: { label: 'Heads minus tails', name: 'heads minus tails (win ₹1 for each head, lose ₹1 for each tail)', f: o => 2 * heads(o) - o.length },
  };
  const rvPicker = (value, onChange) => K.select({ label: 'The random variable $X$', options: Object.entries(RV).map(([k, v]) => [k, v.label]), value, onChange });
  /** the distribution of X on n tosses with chance p of heads: [{ x, outs, P }] in increasing x */
  function dist(n, p, X) {
    const ph = perHeads(n, p), groups = new Map();
    for (const o of outcomes(n)) { const v = X.f(o); if (!groups.has(v)) groups.set(v, []); groups.get(v).push(o); }
    return [...groups.keys()].sort((a, b) => a - b).map(x => ({ x, outs: groups.get(x), P: chance(groups.get(x), n, ph) }));
  }

  /* ------------------------------------------------------------------ pictures */
  /** a dashed line at the value v on a K.bars chart whose bars stand at the values xs (the frame of labkit.js: L 44, R 10, B 34, top 18) */
  function barsMark(wrap, xs, v, label, height = 220) {
    const svg = wrap.querySelector('svg'), W = +svg.getAttribute('viewBox').split(' ')[2], L = 44, R = 10, B = 34, Tp = 18;
    const step = (W - L - R) / xs.length;
    let idx = 0;
    for (let i = 0; i < xs.length - 1; i++) if (v >= xs[i]) idx = i + Math.min(1, (v - xs[i]) / (xs[i + 1] - xs[i]));
    const x = L + step * idx + step / 2;
    svg.append(K.sv('line', { x1: x, x2: x, y1: Tp - 8, y2: height - B, class: 'mark' }), K.sv('text', { x: x + 4, y: Tp, class: 'cl-lbl' }, label));
  }
  /** two bar series side by side (a in blue, b in purple) with a legend; hi = the index of a group to shade */
  function bars2({ xs, a, b, aName, bName, xName, hi }) {
    const va = a.map(v => (F.is(v) ? num(v) : v)), vb = b.map(v => (F.is(v) ? num(v) : v));
    const top = Math.max(1e-9, ...va, ...vb), m = xs.length, W = Math.max(320, m * 40 + 60), H = 230, L = 44, B = 34, R = 10, Tp = 18;
    const step = (W - L - R) / m, bw = Math.min(16, step * 0.38), Y = v => H - B - (v / top) * (H - B - Tp);
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': aName + ' and ' + bName + ' for each ' + xName });
    if (hi != null && hi >= 0 && hi < m) svg.append(K.sv('rect', { x: L + step * hi + 1, y: Tp - 6, width: step - 2, height: H - B - Tp + 6, rx: 6, class: 'cl-band' }));
    for (let i = 0; i <= 4; i++) { const v = top * i / 4; svg.append(K.sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), K.sv('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(Math.round(v * 1000) / 1000))); }
    xs.forEach((x, i) => {
      const cx = L + step * i + step / 2;
      [[va[i], 'cl-b1', cx - bw - 1, aName], [vb[i], 'cl-b2', cx + 1, bName]].forEach(([v, cls, x0, nm]) =>
        svg.append(K.sv('rect', { x: x0, y: Y(v), width: bw, height: Math.max(0, H - B - Y(v)), rx: 2, class: cls }, K.sv('title', {}, nm + ', ' + xName + ' = ' + x + ': ' + (+v.toPrecision(6))))));
      svg.append(K.sv('text', { x: cx, y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, String(x)));
    });
    svg.append(K.sv('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle', class: 'axis' }, xName));
    return h('div', {}, h('div', { class: 'cl-legend' }, h('span', {}, h('i', { class: 'cl-key k1' }), aName), h('span', {}, h('i', { class: 'cl-key k2' }), bName)), h('div', { class: 'lk-chart-wrap' }, svg));
  }
  /** K.cdf with the interval a < x ≤ b marked: dashed lines at x = a and x = b, and at the heights F(a) and F(b) */
  function cdfMarked(xs, ps, a, b, Fa, Fb) {
    const wrap = K.cdf({ xs, ps, xName: 'x' }), svg = wrap.querySelector('svg');
    // the frame of K.cdf in labkit.js: 420 × 210, margins L 44, R 14, B 32, top 14, x from min − 1 to max + 1
    const W = 420, H = 210, L = 44, B = 32, R = 14, Tp = 14, lo = Math.min(...xs) - 1, hi = Math.max(...xs) + 1;
    const X = v => L + (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (W - L - R), Y = v => H - B - v * (H - B - Tp);
    [[Fa, 'F(a)'], [Fb, 'F(b)']].forEach(([v, t]) => svg.append(K.sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'mark' }), K.sv('text', { x: W - R - 2, y: Y(v) - 4, 'text-anchor': 'end', class: 'cl-lbl' }, t)));
    [[a, 'a'], [b, 'b']].forEach(([v, t]) => svg.append(K.sv('line', { x1: X(v), x2: X(v), y1: Y(0), y2: Y(1), class: 'mark' }), K.sv('text', { x: X(v) + 4, y: Tp + 10, class: 'cl-lbl' }, t)));
    return wrap;
  }
  /** the function picture of a random variable: every outcome (left) joined to its value X(s) (right) */
  function mapPic(S, X) {
    const vals = [...new Set(S.map(X.f))].sort((a, b) => a - b), rowH = 22, H = S.length * rowH + 16, W = 300;
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-tree cl-small', role: 'img', 'aria-label': 'each outcome joined to its value' });
    const vy = j => 8 + (j + 0.5) * (H - 16) / vals.length;
    S.forEach((o, i) => { const y = 8 + (i + 0.5) * rowH; svg.append(K.sv('line', { x1: 80, y1: y, x2: 233, y2: vy(vals.indexOf(X.f(o))), class: 'edge' }), K.sv('text', { x: 12, y: y + 4, class: 'leaf' }, o)); });
    vals.forEach((v, j) => svg.append(K.sv('circle', { cx: 250, cy: vy(j), r: 14, class: 'cl-node' }), K.sv('text', { x: 250, y: vy(j) + 4, 'text-anchor': 'middle', class: 'cl-val' }, String(v))));
    svg.append(K.sv('text', { x: 12, y: H - 2, class: 'cl-lbl' }, ''));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** the two-step tree of the bayes topic: pick coin i (chance c_i), then it shows H or T; the paths ending in `face` are coloured */
  function coinTree(c, pr, face) {
    const m = c.length, rowH = 32, H = m * 2 * rowH + 12, W = 420, x0 = 12, x1 = 150, x2 = 286, y0 = H / 2;
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-tree cl-small', role: 'img', 'aria-label': 'tree: pick a coin, then toss it' });
    c.forEach((ci, i) => {
      const yc = 6 + (2 * i + 1) * rowH;
      svg.append(K.sv('line', { x1: x0, y1: y0, x2: x1, y2: yc, class: 'edge' }), K.sv('text', { x: (x0 + x1) / 2 + 6, y: (y0 + yc) / 2 - 5, 'text-anchor': 'middle', class: 'elabel' }, 'C' + (i + 1) + ': ' + ci.str()));
      [['H', pr[i]], ['T', F(1).sub(pr[i])]].forEach(([f, pf], k) => {
        const yl = 6 + (2 * i + k) * rowH + rowH / 2, on = f === face;
        svg.append(K.sv('line', { x1, y1: yc, x2, y2: yl, class: 'edge' + (on ? ' hi' : '') }),
          K.sv('text', { x: (x1 + x2) / 2, y: (yc + yl) / 2 + (f === 'H' ? -5 : 13), 'text-anchor': 'middle', class: 'elabel' }, f + ': ' + pf.str()),
          K.sv('text', { x: x2 + 6, y: yl + 4, class: 'leaf' + (on ? ' hi' : '') }, 'C' + (i + 1) + ' ' + f + ' ' + ci.mul(pf).str()));
      });
    });
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** the curve p(1 − p) for p from 0 to 1, with the learner's p as a dot */
  function varCurve(p) {
    const W = 420, H = 230, L = 48, R = 16, B = 36, Tp = 16, X = v => L + v * (W - L - R), Y = v => H - B - (v / 0.25) * (H - B - Tp);
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'the variance p(1 − p) for every p' });
    [0, 0.05, 0.1, 0.15, 0.2, 0.25].forEach(v => svg.append(K.sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), K.sv('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v))));
    [0, 0.25, 0.5, 0.75, 1].forEach(v => svg.append(K.sv('text', { x: X(v), y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, String(v))));
    let d = '';
    for (let i = 0; i <= 100; i++) { const t = i / 100; d += (i ? ' L' : 'M') + X(t).toFixed(1) + ' ' + Y(t * (1 - t)).toFixed(1); }
    const pv = num(p), v = pv * (1 - pv);
    svg.append(K.sv('path', { d, class: 'cl-curve' }), K.sv('line', { x1: X(0.5), x2: X(0.5), y1: Y(0), y2: Y(0.25), class: 'grid' }),
      K.sv('text', { x: L + 6, y: Tp + 12, class: 'cl-lbl' }, 'largest: 1/4 at p = 1/2'),
      K.sv('line', { x1: X(pv), x2: X(pv), y1: Y(0), y2: Y(v), class: 'mark' }), K.sv('circle', { cx: X(pv), cy: Y(v), r: 5.5, class: 'dot' }, K.sv('title', {}, 'your p: ' + p.str())),
      K.sv('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle', class: 'axis' }, 'p (chance of heads)'));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** chances of a waiting time, as floats: P(X = j) for j = from … to, from P(from) and the ratio P(j + 1) / P(j) */
  function floatsBy(first, ratio, from, to) { const out = []; let v = first; for (let j = from; j <= to; j++) { out.push(v); v *= ratio(j); } return out; }
  /** binomial chances P(X = j), j = 0 … K, as floats (n may be large) */
  function binomFloats(n, p, K2) {
    const out = new Array(K2 + 1).fill(0);
    if (p >= 1) { if (n <= K2) out[n] = 1; return out; }
    out[0] = Math.pow(1 - p, n);
    for (let j = 0; j < K2; j++) out[j + 1] = j + 1 > n ? 0 : out[j] * (n - j) / (j + 1) * p / (1 - p);
    return out;
  }
  const poisFloats = (L, K2) => { const out = [Math.exp(-L)]; for (let j = 0; j < K2; j++) out.push(out[j] * L / (j + 1)); return out; };

  REV.lab('coin', {
    /* ---------------------------------------------------------------- space */
    // ?n=3   n = the number of tosses, 1 to 6
    space(el, query, ctx) {
      const t = topic(el, query, ctx, { n: 3 }, v => { v.n = whole(v.n, 1, 6, 3); });
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('Toss a coin $n$ times and write down the faces in order. Each possible result is an <b>outcome</b>; the set of all outcomes is the <b>sample space</b> $S$.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 6, onChange: v => s.set({ n: v }) }),
        tries([['Stats 1 Week 7: two coins', { n: 2 }, 'Lecture 7.1 tosses two coins: HH, HT, TH, TT'], ['One toss', { n: 1 }], ['Six tosses', { n: 6 }]], t.load)), draw);
      function draw() {
        const n = s.v.n, S = outcomes(n), N = S.length;
        out.append(K.answer('The number of outcomes of ' + tosses(n), '|S| = 2^{' + n + '} = ' + N));
        out.append(K.card('Every outcome',
          K.p(n === 1 ? 'One toss: the coin shows heads (H) or tails (T).' : 'Each outcome lists the faces in toss order, so <span class="cl-set">HT</span> (heads first, then tails) and <span class="cl-set">TH</span> are two different outcomes.'),
          coinRows(S),
          n <= 4 ? K.p('$S =$ ' + setT(S)) : null));
        out.append(K.card('The tree',
          K.p(n <= 4 ? 'Read it from left to right. Each toss splits every branch in two, H and T. One path from the start to an end is one outcome, so there are as many ends as outcomes: ' + N + '. (The numbers on the branches are the chances for a fair coin; the Probability topic uses them.)'
            : 'With $n = ' + n + '$ the tree has ' + N + ' ends, too many to draw here. It grows the same way as for 4 tosses, and the list above shows every end.'),
          n <= 4 ? K.tree(n, F(1, 2)) : null));
        const st = [{ text: 'The first toss shows H or T: 2 results.', tex: '2^{1} = 2' }];
        for (let i = 2; i <= n; i++) st.push({ text: 'Toss ' + i + ' can show H or T after <b>each</b> of the ' + 2 ** (i - 1) + ' results so far, so their number doubles.', tex: '2^{' + (i - 1) + '} \\times 2 = 2^{' + i + '} = ' + 2 ** i });
        if (n > 1) st.push({ text: 'This is the multiplication rule of counting: ' + n + ' tosses with 2 choices each, multiplied together.', tex: '|S| = ' + new Array(n).fill('2').join(' \\times ') + ' = 2^{' + n + '} = ' + N });
        out.append(K.card('Why $2^n$', K.steps(st)));
        const counts = [], rows = [];
        for (let k = 0; k <= n; k++) { const c = K.C(n, k); counts.push(c); rows.push(['$' + k + '$', '$\\binom{' + n + '}{' + k + '} = ' + c.tex() + '$'].concat(n <= 4 ? ['<div class="cl-cell">' + setT(S.filter(o => heads(o) === k)) + '</div>'] : [])); }
        const total = sumF(counts), ok = total.eq(N) && S.length === N;
        out.append(K.card('Check: count them another way',
          K.p('Sort the outcomes by their number of heads $k$. Choosing which $k$ of the ' + n + ' tosses show heads can be done in $\\binom{' + n + '}{k}$ ways.'),
          K.table(['heads $k$', 'outcomes'].concat(n <= 4 ? ['which'] : []), rows),
          K.steps([{ text: 'Add the counts:', tex: counts.map(c => c.tex()).join(' + ') + ' = ' + total.tex() }]),
          K.note(ok ? 'The same ' + N + ' outcomes ✓ (this is why $\\binom{n}{0} + \\binom{n}{1} + \\dots + \\binom{n}{n} = 2^n$).' : 'The counts do not match ✗', ok ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- events */
    // ?n=3&a=ge2&b=h1&show=or   n = tosses (1 to 6); a, b = the events A and B as codes: eq2 exactly 2 heads, ge2 at least 2,
    //   le2 at most 2, h1 / t1 toss 1 is heads / tails, hL / tL the last toss is heads / tails, same all tosses the same,
    //   alt heads and tails take turns, hh two heads in a row, even an even number of heads (k and i are kept within n);
    //   show = the set coloured: a | b | notA | or | and
    events(el, query, ctx) {
      const fix = v => { v.n = whole(v.n, 1, 6, 3); v.a = (event(v.a, v.n) || event('ge2', v.n)).code; v.b = (event(v.b, v.n) || event('h1', v.n)).code; if (!['a', 'b', 'notA', 'or', 'and'].includes(v.show)) v.show = 'or'; };
      const t = topic(el, query, ctx, { n: 3, a: 'ge2', b: 'h1', show: 'or' }, fix);
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('An <b>event</b> is a set of outcomes, given by a rule such as "at least 2 heads". Build two events $A$ and $B$; the lab finds "not $A$", "$A$ or $B$" and "$A$ and $B$", outcome by outcome.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 6, onChange: v => t.load({ n: v }) }),
        eventPicker('Event $A$', s.v.a, s.v.n, c => t.load({ a: c })),
        eventPicker('Event $B$', s.v.b, s.v.n, c => t.load({ b: c })),
        K.seg({ label: 'Colour the outcomes of', options: [['a', 'A'], ['b', 'B'], ['notA', 'not A'], ['or', 'A or B'], ['and', 'A and B']], value: s.v.show, onChange: v => s.set({ show: v }) }),
        tries([['B is "not A"', { n: 3, a: 'ge2', b: 'le1', show: 'or' }, 'At least 2 heads, and at most 1 head: together they cover everything, with nothing in common'],
          ['Disjoint events', { n: 3, a: 'same', b: 'eq1', show: 'and' }, 'All the same, and exactly 1 head: no common outcome'],
          ['A inside B', { n: 3, a: 'eq3', b: 'ge2', show: 'or' }, 'Three heads is a special case of at least 2 heads']], t.load)), draw);
      function draw() {
        const n = s.v.n, A = event(s.v.a, n), B = event(s.v.b, n), S = outcomes(n), N = S.length;
        const inA = S.filter(A.test), inB = S.filter(B.test), notA = S.filter(o => !A.test(o));
        const and = inA.filter(B.test), or = S.filter(o => A.test(o) || B.test(o));
        const parts = [[and, inA.filter(o => !B.test(o))], [notA.filter(B.test), notA.filter(o => !B.test(o))]];
        const [chosen, label, sym, cells] = {
          a: [inA, '$A$ = ' + A.name, 'A', [parts[0][0], parts[0][1]]],
          b: [inB, '$B$ = ' + B.name, 'B', [parts[0][0], parts[1][0]]],
          notA: [notA, '"not $A$", written $A^c$: the outcomes that are not in $A$ = ' + A.name, 'A^c', [parts[1][0], parts[1][1]]],
          or: [or, '"$A$ or $B$", written $A \\cup B$: the outcomes in $A$, in $B$, or in both', 'A \\cup B', [parts[0][0], parts[0][1], parts[1][0]]],
          and: [and, '"$A$ and $B$", written $A \\cap B$: the outcomes in both', 'A \\cap B', [parts[0][0]]],
        }[s.v.show];
        out.append(K.answer(label, '|' + sym + '| = ' + chosen.length + '\\ \\text{of the}\\ ' + N + '\\ \\text{outcomes}', '$' + sym + ' =$ ' + setT(chosen)));
        out.append(K.card('The outcomes',
          K.p('$A$ = ' + A.name + '. $B$ = ' + B.name + '. Coloured: $' + sym + '$. The small letters show which events each outcome is in.'),
          coinRows(S, { cls: o => (chosen.includes(o) ? 'hi' : ''), tag: o => (A.test(o) ? 'A' : '') + (B.test(o) ? 'B' : '') })));
        const cell = list => ({ html: '<div class="cl-cell"><b>' + list.length + '</b>' + (list.length ? '<span class="cl-set">' + list.join(', ') + '</span>' : '') + '</div>', hi: cells.includes(list) });
        out.append(K.card('A table of $A$ and $B$',
          K.p('Every outcome lands in exactly one of the four inner cells: in $A$ or not, and in $B$ or not. The coloured cells make up $' + sym + '$. The last row and column are totals.'),
          K.grid(['$A$', '$A^c$', 'all'], ['$B$', '$B^c$', 'all'], (r, c, i, j) => (i < 2 && j < 2 ? cell(parts[i][j])
            : { html: '<b>' + (i === 2 && j === 2 ? N : i === 2 ? parts[0][j].length + parts[1][j].length : parts[i][0].length + parts[i][1].length) + '</b>' }))));
        out.append(K.card('Step by step',
          K.steps([
            { text: '$A$ = ' + A.name + '. Go through all ' + N + ' outcomes and keep those that fit the rule: $A =$ ' + setT(inA) + '.', tex: '|A| = ' + inA.length },
            { text: '$B$ = ' + B.name + ': $B =$ ' + setT(inB) + '.', tex: '|B| = ' + inB.length },
            { text: '"Not $A$" ($A^c$, the <b>complement</b>) holds the outcomes of $S$ that are not in $A$: ' + setT(notA) + '. Count it by taking $A$ away from all outcomes:', tex: '|A^c| = |S| - |A| = ' + N + ' - ' + inA.length + ' = ' + notA.length },
            { text: '"$A$ and $B$" ($A \\cap B$, the <b>intersection</b>) holds the outcomes in both: ' + setT(and) + '.', tex: '|A \\cap B| = ' + and.length },
            { text: '"$A$ or $B$" ($A \\cup B$, the <b>union</b>) holds the outcomes in $A$, in $B$, or in both: ' + setT(or) + '. Adding $|A| + |B|$ counts the outcomes of $A \\cap B$ twice, so take them away once:', tex: chain('|A \\cup B|', '|A| + |B| - |A \\cap B|', inA.length + ' + ' + inB.length + ' - ' + and.length + ' = ' + (inA.length + inB.length - and.length)) },
          ]),
          K.note(and.length === 0 ? '$A$ and $B$ have no outcome in common: they are <b>disjoint</b> (mutually exclusive), and then $|A \\cup B| = |A| + |B|$.'
            : '$A$ and $B$ share ' + pl(and.length, 'outcome') + ', so they are not disjoint.')));
        const notOr = S.filter(o => !or.includes(o)), neither = parts[1][1], ok = notOr.length === neither.length && notOr.every(o => neither.includes(o)) && or.length === inA.length + inB.length - and.length;
        out.append(K.card('Check: "not ($A$ or $B$)" is "not $A$ and not $B$"',
          K.p('An outcome misses "$A$ or $B$" exactly when it misses both. Count both sides.'),
          K.steps([
            { text: 'Left side: everything outside $A \\cup B$.', tex: '|(A \\cup B)^c| = ' + N + ' - ' + or.length + ' = ' + notOr.length },
            { text: 'Right side: the cell "$A^c$ and $B^c$" of the table: ' + setT(neither) + '.', tex: '|A^c \\cap B^c| = ' + neither.length },
          ]),
          K.note(ok ? 'Both sides are the same ' + pl(neither.length, 'outcome') + ' ✓ (De Morgan\'s law); and the union counted one by one has ' + or.length + ' outcomes, as the formula said ✓' : 'The two sides differ ✗', ok ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- probability */
    // ?n=3&p=1/2&e=ge2   n = tosses (1 to 6), p = the chance of heads on one toss (0 to 1, as 1/2, 0.3 or 30%),
    //   e = the event (codes as in events: eq2, ge2, le2, h1, t1, hL, tL, same, alt, hh, even)
    probability(el, query, ctx) {
      const fix = v => { v.n = whole(v.n, 1, 6, 3); v.e = (event(v.e, v.n) || event('ge2', v.n)).code; };
      const t = topic(el, query, ctx, { n: 3, p: '1/2', e: 'ge2' }, fix);
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('The <b>probability</b> of an event is the total chance of the outcomes in it. You can count outcomes (only when all are equally likely) or multiply along the tree (always).'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 6, onChange: v => t.load({ n: v }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        eventPicker('Event $E$', s.v.e, s.v.n, c => t.load({ e: c })),
        tries([['Fair coin, at least 2 heads in 3', { n: 3, p: '1/2', e: 'ge2' }], ['Same event, p = 3/10', { n: 3, p: '3/10', e: 'ge2' }], ['All the same, 4 tosses', { n: 4, p: '1/2', e: 'same' }]], t.load)), draw);
      function draw() {
        const n = s.v.n, E = event(s.v.e, n), p = readP(out, s.v.p);
        if (!p) return;
        const q = F(1).sub(p), S = outcomes(n), N = S.length, inE = S.filter(E.test), notE = S.filter(o => !E.test(o));
        const ph = perHeads(n, p), PE = chance(inE, n, ph), PnE = chance(notE, n, ph), byCount = F(inE.length, N), fair = p.eq(F(1, 2));
        out.append(K.answer('$P(E)$ for $E$ = ' + E.name + ', with $n = ' + n + '$ tosses and $p = ' + T(p) + '$', 'P(E) = ' + TX(PE)));
        const allH = 'H'.repeat(n), allT = 'T'.repeat(n);
        out.append(K.card('Method 1: count the outcomes (fair coin only)',
          K.steps([
            { text: 'With a fair coin all ' + N + ' outcomes are equally likely, so the probability is the share of the outcomes that are in $E$:', tex: chain('P(E)', '\\frac{\\text{outcomes in } E}{\\text{all outcomes}}', '\\frac{|E|}{|S|}') },
            { text: 'The outcomes in $E$: ' + setT(inE) + '.', tex: '|E| = ' + inE.length },
            { text: 'All outcomes: 2 faces for each of the ' + tosses(n) + '.', tex: '|S| = 2^{' + n + '} = ' + N },
            { text: 'Divide:', tex: 'P(E) = \\frac{' + inE.length + '}{' + N + '} = ' + TX(byCount) },
          ]),
          fair ? null : K.note('Your coin has $p = ' + T(p) + '$, not $\\frac12$, so the outcomes are <b>not</b> equally likely: $P(\\text{' + allH + '}) = ' + powT(p, n) + ' = ' + T(p.pow(n)) + '$ but $P(\\text{' + allT + '}) = ' + powT(q, n) + ' = ' + T(q.pow(n)) + '$. Counting does not give $P(E)$ here; method 2 does.', 'warn')));
        const ex = inE.length ? inE[0] : S[0], sm = sumT(inE, n, p, true);
        const path = o => [...o].map(f => (f === 'H' ? 'p' : '(1-p)')).join(' \\cdot '), pathN = o => [...o].map(f => T(f === 'H' ? p : q)).join(' \\cdot ');
        const table = n <= 4
          ? K.table(['outcome of $E$', 'along its path', 'chance'], inE.map(o => ['<span class="cl-set">' + o + '</span>', '$' + pathN(o) + '$', '$' + T(ph[heads(o)]) + '$']))
          : K.table(['heads $h$', 'outcomes of $E$ with $h$ heads', 'chance of one', 'together'], countHeads(inE, n).map((c, i) => [i, c]).filter(([, c]) => c)
            .map(([i, c]) => ['$' + i + '$', '$' + c + '$', '$' + [powT(p, i), powT(q, n - i)].filter(Boolean).join('\\cdot ') + ' = ' + T(ph[i]) + '$', '$' + T(ph[i].mul(c)) + '$']));
        out.append(K.card('Method 2: multiply along each path, then add',
          K.steps([
            { text: 'One toss shows heads with chance $p = ' + T(p) + '$ and tails with chance $1 - p = ' + T(q) + '$. The tosses do not affect each other, so the chance of a whole outcome is the product of the chances along its path in the tree. For example:', tex: chain('P(\\text{' + ex + '})', path(ex), pathN(ex), T(ph[heads(ex)])) },
            { text: 'An outcome with $h$ heads and $' + n + ' - h$ tails has chance $p^{h}(1-p)^{' + n + '-h}$, whatever the order. Add over the outcomes of $E$, grouped by their number of heads (table below):', tex: 'P(E) = ' + sm.sym },
            { text: 'Put in $p = ' + T(p) + '$:', tex: chain('P(E)', sm.nums, ...(sm.terms > 1 ? [sm.vals] : [])) },
            { text: 'Add:', tex: 'P(E) = ' + TX(PE) },
          ]),
          inE.length ? table : K.note('$E$ has no outcomes, so $P(E) = 0$.'),
          n <= 4 ? K.p('In the tree, the paths of $E$ are coloured:') : null,
          n <= 4 ? K.tree(n, p, { hi: new Set(inE) }) : null));
        const agree = byCount.eq(PE), sum = PE.add(PnE);
        out.append(K.card('Compare, then check',
          K.table(['method', '$P(E)$'], [['counting (assumes a fair coin)', '$' + TX(byCount) + '$'], ['multiplying (your $p = ' + T(p) + '$)', '$' + TX(PE) + '$']]),
          fair ? K.note('The coin is fair, so both methods agree ✓', 'good')
            : K.note(agree ? 'Here the two numbers happen to agree, but counting is only safe for a fair coin.' : 'They differ: counting treats every outcome as equally likely, which is wrong for $p = ' + T(p) + '$. Multiplying along the paths is right for every coin.', agree ? '' : 'warn'),
          K.steps([
            { text: '"Not $E$" ($E^c$) holds the other ' + pl(notE.length, 'outcome') + '. Its chance by method 2:', tex: chain('P(E^c)', sumT(notE, n, p).nums, TX(PnE)) },
            { text: 'Every outcome is in $E$ or in $E^c$, never both, so the two chances must add up to 1:', tex: 'P(E) + P(E^c) = ' + T(PE) + ' + ' + T(PnE) + ' = ' + T(sum) },
          ]),
          K.note(sum.eq(1) ? 'They add up to 1 ✓' : 'They do not add up to 1 ✗', sum.eq(1) ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- conditional */
    // ?n=3&p=1/2&a=eq2&b=t1   n = tosses (1 to 6), p = the chance of heads, a = the event A you ask about,
    //   b = the event B you are told happened (codes as in events)
    conditional(el, query, ctx) {
      const fix = v => { v.n = whole(v.n, 1, 6, 3); v.a = (event(v.a, v.n) || event('eq2', v.n)).code; v.b = (event(v.b, v.n) || event('t1', v.n)).code; };
      const t = topic(el, query, ctx, { n: 3, p: '1/2', a: 'eq2', b: 't1' }, fix);
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('If you are told that $B$ happened, only the outcomes of $B$ are still possible. $P(A \\mid B)$, "the chance of $A$ given $B$", is the chance of $A$ inside that smaller sample space.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 6, onChange: v => t.load({ n: v }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        eventPicker('Event $A$: what you ask about', s.v.a, s.v.n, c => t.load({ a: c })),
        eventPicker('Event $B$: what you are told', s.v.b, s.v.n, c => t.load({ b: c })),
        tries([['Stats 2: first toss is tails', { n: 3, p: '1/2', a: 'eq2', b: 't1' }, 'The conditional probability lecture tosses 3 times and is told B = the first toss is tails'],
          ['Turn it around: B given A', () => ({ a: s.v.b, b: s.v.a })], ['Biased coin, p = 2/3', { p: '2/3' }]], t.load)), draw);
      function draw() {
        const n = s.v.n, A = event(s.v.a, n), B = event(s.v.b, n), p = readP(out, s.v.p);
        if (!p) return;
        const S = outcomes(n), ph = perHeads(n, p), fair = p.eq(F(1, 2));
        const inA = S.filter(A.test), inB = S.filter(B.test), AB = inB.filter(A.test), nAB = inB.filter(o => !A.test(o));
        const PA = chance(inA, n, ph), PB = chance(inB, n, ph), PAB = chance(AB, n, ph);
        const pic = K.card('The sample space shrinks to $B$',
          K.p('$A$ = ' + A.name + '. $B$ = ' + B.name + '. Faded: the outcomes outside $B$, ruled out once you know $B$ happened. Dashed: the outcomes of $B$, the new sample space. Coloured: the outcomes of $B$ where $A$ happens too ($A \\cap B$).'),
          coinRows(S, { cls: o => (!B.test(o) ? 'cl-dim' : A.test(o) ? 'hi' : 'cl-in'), tag: o => (A.test(o) ? 'A' : '') + (B.test(o) ? 'B' : '') }));
        if (PB.isZero()) {
          out.append(K.answer('$P(A \\mid B)$', '\\text{not defined, because } P(B) = 0'),
            K.note((inB.length ? 'Every outcome of $B$ has chance 0 when $p = ' + T(p) + '$' : 'No outcome fits the rule of $B$') + ', so $B$ never happens and there is nothing to shrink to. Choose another $B$ or $p$.', 'warn'), pic);
          return;
        }
        const PAgB = PAB.div(PB);
        out.append(K.answer('$P(A \\mid B)$: the chance of $A$ = ' + A.name + ', when you know that $B$ = ' + B.name, 'P(A \\mid B) = ' + TX(PAgB)), pic);
        // method 1: work inside B only
        const m1 = [{ text: 'You are told that $B$ happened, so only its outcomes are still possible: ' + setT(inB) + '.', tex: '|B| = ' + inB.length }];
        let m1val, m1table = null;
        if (fair) {
          m1val = F(AB.length, inB.length);
          m1.push({ text: 'With a fair coin these ' + inB.length + ' outcomes are equally likely, so each now has chance $\\frac{1}{' + inB.length + '}$.' },
            { text: 'Inside $B$, $A$ happens for ' + setT(AB) + '.', tex: '|A \\cap B| = ' + AB.length },
            { text: 'Count, as in a small sample space of its own:', tex: chain('P(A \\mid B)', '\\frac{|A \\cap B|}{|B|}', '\\frac{' + AB.length + '}{' + inB.length + '} = ' + TX(m1val)) });
        } else {
          const cAB = countHeads(AB, n);
          m1val = cAB.reduce((a, c, i) => a.add(ph[i].div(PB).mul(c)), F(0));
          m1.push({ text: 'With $p = ' + T(p) + '$ they are not equally likely. Each keeps its share: its new chance is its old chance divided by $P(B)$, so that the new chances add up to 1. Here', tex: chain('P(B)', sumT(inB, n, p).nums, TX(PB)) });
          const terms = cAB.map((c, i) => (c ? (c > 1 ? c + '\\cdot ' : '') + T(ph[i].div(PB)) : null)).filter(Boolean);
          m1.push({ text: 'Add the new chances of the outcomes that are also in $A$ (the coloured rows of the table):', tex: chain('P(A \\mid B)', ...(terms.length ? [terms.join(' + ')] : []), TX(m1val)) });
          m1table = inB.length <= 16
            ? K.table(['outcome of $B$', 'in $A$?', 'old chance', 'new chance (old $\\div P(B)$)'], inB.map(o => ['<span class="cl-set">' + o + '</span>', A.test(o) ? 'yes' : 'no', '$' + T(ph[heads(o)]) + '$', '$' + T(ph[heads(o)].div(PB)) + '$']), { hi: new Set(inB.map((o, i) => (A.test(o) ? i : -1)).filter(i => i >= 0)) })
            : K.table(['heads $h$', 'outcomes of $B$', 'of them in $A$', 'old chance of one', 'new chance of one'], countHeads(inB, n).map((c, i) => [i, c]).filter(([, c]) => c)
              .map(([i, c]) => ['$' + i + '$', '$' + c + '$', '$' + cAB[i] + '$', '$' + T(ph[i]) + '$', '$' + T(ph[i].div(PB)) + '$']));
        }
        out.append(K.card('Method 1: shrink the sample space to $B$', m1table, K.steps(m1)));
        out.append(K.card('Method 2: the formula',
          K.steps([
            { text: 'The chance that both happen, in the full sample space ($A \\cap B$ = ' + setT(AB) + '):', tex: chain('P(A \\cap B)', sumT(AB, n, p).nums, TX(PAB)) },
            { text: 'The chance of $B$:', tex: chain('P(B)', sumT(inB, n, p).nums, TX(PB)) },
            { text: 'Divide:', tex: chain('P(A \\mid B)', '\\frac{P(A \\cap B)}{P(B)}', T(PAB) + ' \\div ' + T(PB), TX(PAgB)) },
          ]),
          K.note(m1val.eq(PAgB) ? 'Both methods give $' + T(PAgB) + '$ ✓' : 'The two methods differ ✗', m1val.eq(PAgB) ? 'good' : 'warn')));
        const PBgA = PA.isZero() ? null : PAB.div(PA), PnAgB = chance(nAB, n, ph).div(PB), ok = PAgB.add(PnAgB).eq(1);
        out.append(K.card('Careful: knowing $B$ changes the question',
          K.steps([
            { text: 'Before you are told anything, the chance of $A$ is', tex: chain('P(A)', sumT(inA, n, p).nums, TX(PA)) },
            { text: 'Knowing $B$ ' + (PAgB.eq(PA) ? 'leaves it unchanged' : PAgB.cmp(PA) > 0 ? 'raises it' : 'lowers it') + ':', tex: 'P(A \\mid B) = ' + TX(PAgB) },
            PBgA ? { text: '"$B$ given $A$" is a different question: it divides by $P(A)$, not by $P(B)$.', tex: chain('P(B \\mid A)', '\\frac{P(A \\cap B)}{P(A)}', T(PAB) + ' \\div ' + T(PA), TX(PBgA)) }
              : { text: '"$B$ given $A$" is not defined here, because $P(A) = 0$.' },
          ]),
          PAgB.eq(PA) ? K.note('Here knowing $B$ does not change the chance of $A$: such events are <b>independent</b> (the next topic).') : null,
          K.note('Check: inside $B$, either $A$ happens or it does not, so $P(A \\mid B) + P(A^c \\mid B) = ' + T(PAgB) + ' + ' + T(PnAgB) + ' = ' + T(PAgB.add(PnAgB)) + '$ ' + (ok ? '✓' : '✗'), ok ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- independence */
    // ?n=3&p=1/2&a=h1&b=h2   n = tosses (1 to 6), p = the chance of heads, a and b = the two events (codes as in events)
    independence(el, query, ctx) {
      const fix = v => { v.n = whole(v.n, 1, 6, 3); v.a = (event(v.a, v.n) || event('h1', v.n)).code; v.b = (event(v.b, v.n) || event('h2', v.n)).code; };
      const t = topic(el, query, ctx, { n: 3, p: '1/2', a: 'h1', b: 'h2' }, fix);
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('Two events are <b>independent</b> when knowing that one happened does not change the chance of the other. The test: $P(A \\cap B) = P(A)\\,P(B)$.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 6, onChange: v => t.load({ n: v }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        eventPicker('Event $A$', s.v.a, s.v.n, c => t.load({ a: c })),
        eventPicker('Event $B$', s.v.b, s.v.n, c => t.load({ b: c })),
        tries([['Stats 2: first H, second H', { n: 3, p: '1/2', a: 'h1', b: 'h2' }, 'The independence lecture: toss 3 times, A = first toss heads, B = second toss heads'],
          ['Disjoint: first H, first T', { n: 3, p: '1/2', a: 'h1', b: 't1' }], ['Even heads and first H', { n: 3, p: '1/2', a: 'even', b: 'h1' }, 'Independent with a fair coin, though both depend on the first toss'],
          ['The same, p = 2/3', { n: 3, p: '2/3', a: 'even', b: 'h1' }]], t.load)), draw);
      function draw() {
        const n = s.v.n, A = event(s.v.a, n), B = event(s.v.b, n), p = readP(out, s.v.p);
        if (!p) return;
        const S = outcomes(n), ph = perHeads(n, p);
        const inA = S.filter(A.test), inB = S.filter(B.test), notA = S.filter(o => !A.test(o)), AB = inA.filter(B.test);
        const parts = [[AB, inA.filter(o => !B.test(o))], [notA.filter(B.test), notA.filter(o => !B.test(o))]];
        const PA = chance(inA, n, ph), PB = chance(inB, n, ph), PAB = chance(AB, n, ph), prod = PA.mul(PB), indep = PAB.eq(prod);
        out.append(K.answer('Are $A$ = ' + A.name + ' and $B$ = ' + B.name + ' independent?',
          '\\begin{aligned} P(A \\cap B) &= ' + T(PAB) + ' \\\\ P(A)\\,P(B) &= ' + T(prod) + '\\end{aligned}',
          indep ? '<b>Yes</b>: the two numbers are equal, so $A$ and $B$ are independent.' : '<b>No</b>: the two numbers differ, so $A$ and $B$ are dependent.'));
        out.append(K.card('Step by step',
          K.steps([
            { text: '$A$ = ' + A.name + ': ' + setT(inA) + '. Add the chances of its outcomes (one with $h$ heads has chance $p^{h}(1-p)^{' + n + '-h}$):', tex: chain('P(A)', sumT(inA, n, p).nums, TX(PA)) },
            { text: '$B$ = ' + B.name + ': ' + setT(inB) + '.', tex: chain('P(B)', sumT(inB, n, p).nums, TX(PB)) },
            { text: '"$A$ and $B$": ' + setT(AB) + '.', tex: chain('P(A \\cap B)', sumT(AB, n, p).nums, TX(PAB)) },
            { text: 'Multiply the two single chances:', tex: 'P(A)\\,P(B) = ' + T(PA) + ' \\times ' + T(PB) + ' = ' + TX(prod) },
            { text: 'Compare:', tex: 'P(A \\cap B) ' + (indep ? '=' : '\\ne') + ' P(A)\\,P(B) \\;\\Rightarrow\\; \\text{' + (indep ? 'independent' : 'dependent') + '}' },
          ]),
          PB.isZero() ? null : K.note('The same test in words: knowing $B$ ' + (indep ? 'does not change' : 'changes') + ' the chance of $A$, because $P(A \\mid B) = P(A \\cap B) \\div P(B) = ' + T(PAB) + ' \\div ' + T(PB) + ' = ' + T(PAB.div(PB)) + '$ ' + (indep ? 'equals' : 'differs from') + ' $P(A) = ' + T(PA) + '$.')));
        const rowP = [PA, F(1).sub(PA)], colP = [PB, F(1).sub(PB)];
        out.append(K.card('The table of chances',
          K.p('Each inner cell is the chance of that combination. Below it: what independence would give, $P(\\text{row}) \\times P(\\text{column})$. Coloured cells do not match.'),
          K.grid(['$A$', '$A^c$', 'all'], ['$B$', '$B^c$', 'all'], (r, c, i, j) => {
            if (i === 2 && j === 2) return { html: K.kx('1') };
            if (i === 2) return { html: K.kx(T(colP[j])) };
            if (j === 2) return { html: K.kx(T(rowP[i])) };
            const actual = chance(parts[i][j], n, ph), ifInd = rowP[i].mul(colP[j]);
            return { html: '<div class="cl-cell">' + K.kx(T(actual)) + '<small>if independent: ' + K.kx(T(ifInd)) + '</small></div>', hi: !actual.eq(ifInd) };
          }),
          coinRows(S, { cls: o => (A.test(o) && B.test(o) ? 'hi' : ''), tag: o => (A.test(o) ? 'A' : '') + (B.test(o) ? 'B' : '') }),
          K.p('Coloured outcomes: $A \\cap B$.')));
        const both = AB.length > 0;
        out.append(K.card('Independent is not the same as disjoint',
          K.p('<b>Disjoint</b> (mutually exclusive) means the events cannot happen together: they have no common outcome, so $P(A \\cap B) = 0$. <b>Independent</b> means knowing one does not change the chance of the other.'),
          K.steps([
            { text: 'If $A$ and $B$ are disjoint and both can happen ($P(A) > 0$ and $P(B) > 0$), then', tex: 'P(A \\cap B) = 0 \\quad\\text{but}\\quad P(A)\\,P(B) > 0' },
            { text: 'So disjoint events are <b>dependent</b>: if you learn that $B$ happened, you know for sure that $A$ did not.' },
            { text: 'And independent events with chances above 0 must overlap, because then $P(A \\cap B) = P(A)\\,P(B) > 0$.' },
          ]),
          K.note('Your events: ' + (!both
            ? '$A$ and $B$ are disjoint (no common outcome)' + (PA.isZero() || PB.isZero() ? ', and one of them has chance 0: the only case where disjoint events count as independent.' : ', so they cannot be independent.')
            : 'they share ' + pl(AB.length, 'outcome') + ', so they are not disjoint' + (indep ? ', and they are independent.' : ', yet they are dependent: overlapping is needed for independence, but it is not enough.')))));
        const PAnB = chance(parts[0][1], n, ph), prod2 = PA.mul(F(1).sub(PB)), same = PAnB.eq(prod2) === indep;
        out.append(K.card('Check: $A$ and "not $B$"',
          K.p('If $A$ and $B$ are independent, so are $A$ and $B^c$ (and the other way round). Test it with your numbers:'),
          K.steps([
            { text: '"$A$ and not $B$": ' + setT(parts[0][1]) + '.', tex: 'P(A \\cap B^c) = ' + TX(PAnB) },
            { text: 'Multiply:', tex: 'P(A)\\,P(B^c) = ' + T(PA) + ' \\times ' + T(F(1).sub(PB)) + ' = ' + TX(prod2) },
          ]),
          K.note((PAnB.eq(prod2) ? 'Equal: $A$ and $B^c$ are independent' : 'Not equal: $A$ and $B^c$ are dependent') + (same ? ', the same answer as for $A$ and $B$ ✓' : ' ✗'), same ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- bayes */
    // ?m=2&c1=1/2&c2=1/4&p1=1/2&p2=9/10&p3=1&f=H   m = coins in the bag (2 or 3); c1 (and c2 when m = 3) = the chance of
    //   picking coin 1 (coin 2), the last coin gets the rest; p1, p2, p3 = each coin's chance of heads; f = the face seen, H or T
    bayes(el, query, ctx) {
      const fix = v => { v.m = whole(v.m, 2, 3, 2); if (v.f !== 'T') v.f = 'H'; };
      const t = topic(el, query, ctx, { m: 2, c1: '1/2', c2: '1/4', p1: '1/2', p2: '9/10', p3: '1', f: 'H' }, fix);
      const { s, controls, out } = t;
      t.start(() => {
        const m = s.v.m, groups = [];
        for (let i = 1; i <= m; i++) {
          groups.push(h('div', { class: 'cl-group' }, h('div', { class: 'cl-group-h', html: K.rich('Coin ' + i + ' ($C_' + i + '$)') }),
            i < m ? K.prob({ label: 'Chance of picking it, $P(C_' + i + ')$', value: s.v['c' + i], presets: [], onChange: v => s.set({ ['c' + i]: v }) })
              : K.p('It is picked with the rest of the chance: $P(C_' + m + ') = 1 - ' + Array.from({ length: m - 1 }, (_, j) => 'P(C_' + (j + 1) + ')').join(' - ') + '$.', 'lk-help'),
            K.prob({ label: 'Its chance of heads, $P(H \\mid C_' + i + ')$', value: s.v['p' + i], presets: ['0', '1/2', '1'], onChange: v => s.set({ ['p' + i]: v }) })));
        }
        controls.append(
          K.p('A bag holds different coins. Pick one at random, toss it once and look at the face. Which coin was it? The <b>law of total probability</b> gives the chance of that face; <b>Bayes\' rule</b> then turns the question around.'),
          K.seg({ label: 'Coins in the bag', options: [[2, '2 coins'], [3, '3 coins']], value: m, onChange: v => t.load({ m: +v }) }),
          ...groups,
          K.seg({ label: 'The toss shows', options: [['H', 'Heads'], ['T', 'Tails']], value: s.v.f, onChange: v => s.set({ f: v }) }),
          tries([['Stats 2: a bag of 5 coins', { m: 3, c1: '2/5', c2: '1/5', p1: '1', p2: '0', p3: '1/2', f: 'H' }, 'The law of total probability lecture: 2 two-headed coins, 1 two-tailed coin and 2 normal coins'],
            ['Fair or biased, 50:50', { m: 2, c1: '1/2', p1: '1/2', p2: '9/10', f: 'H' }], ['A rare two-headed coin', { m: 2, c1: '99/100', p1: '1/2', p2: '1', f: 'H' }], ['Saw tails instead', { f: 'T' }]], t.load));
      }, draw);
      function draw() {
        const m = s.v.m, face = s.v.f, word = face === 'H' ? 'heads' : 'tails', c = [], pr = [];
        try {
          for (let i = 1; i < m; i++) c.push(frac(s.v['c' + i], 0, 1, 'The chance of picking coin ' + i));
          for (let i = 1; i <= m; i++) pr.push(frac(s.v['p' + i], 0, 1, 'The chance of heads of coin ' + i));
        } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const rest = c.reduce((a, x) => a.sub(x), F(1));
        if (rest.cmp(0) < 0) { out.append(K.note('The chances of picking the coins must add up to 1, but $' + c.map(T).join(' + ') + '$ is already more than 1. Make them smaller.', 'warn')); return; }
        c.push(rest);
        const like = pr.map(x => (face === 'H' ? x : F(1).sub(x))), joint = c.map((x, i) => x.mul(like[i])), total = sumF(joint);
        if (total.isZero()) { out.append(K.note('None of these coins can show ' + word + ', so $P(' + face + ') = 0$ and Bayes\' rule would divide by 0. Change a coin or the face.', 'warn'), K.card('The tree', coinTree(c, pr, face))); return; }
        const post = joint.map(x => x.div(total)), ids = c.map((_, i) => i + 1);
        out.append(K.answer('You saw ' + word + '. The chance of each coin now:', '\\begin{aligned}' + ids.map(i => 'P(C_' + i + ' \\mid ' + face + ') &= ' + TX(post[i - 1])).join(' \\\\ ') + '\\end{aligned}'));
        out.append(K.card('The tree',
          K.p('First you pick a coin (the first branches, with the chances of picking), then it shows H or T (the second branches). The paths that end in ' + word + ' are coloured; at the end of each path is its chance, the product along it.'),
          coinTree(c, pr, face)));
        const likeT = i => (face === 'H' ? T(pr[i]) : '\\left(1 - ' + T(pr[i]) + '\\right)');
        const st1 = [{ text: 'The last coin gets the rest of the chance of being picked:', tex: 'P(C_' + m + ') = 1 - ' + c.slice(0, -1).map(T).join(' - ') + ' = ' + T(rest) }];
        c.forEach((x, i) => st1.push({ text: i === 0 ? 'Pick coin 1 <b>and</b> see ' + word + ': multiply along its path, the chance of picking the coin times the chance that it shows ' + word + '.' : 'The same for coin ' + (i + 1) + ':',
          tex: chain('P(C_' + (i + 1) + ' \\cap ' + face + ')', 'P(C_' + (i + 1) + ')\\,P(' + face + ' \\mid C_' + (i + 1) + ')', T(x) + ' \\times ' + likeT(i) + ' = ' + T(joint[i])) }));
        st1.push({ text: 'You pick exactly one coin, so these paths do not overlap. Add them: this is the law of total probability.', tex: chain('P(' + face + ')', joint.map(T).join(' + '), TX(total)) });
        out.append(K.card('Step 1: the chance of ' + word, K.steps(st1)));
        const st2 = post.map((x, i) => ({ text: i === 0 ? 'Now turn it around. Of all the ways to see ' + word + ', what share comes through coin 1? Divide its path by the total: this is Bayes\' rule.' : 'The same for coin ' + (i + 1) + ':',
          tex: chain('P(C_' + (i + 1) + ' \\mid ' + face + ')', '\\frac{P(C_' + (i + 1) + ' \\cap ' + face + ')}{P(' + face + ')}', T(joint[i]) + ' \\div ' + T(total) + ' = ' + TX(x)) }));
        const sumPost = sumF(post);
        out.append(K.card('Step 2: which coin was it? (Bayes\' rule)',
          K.steps(st2),
          K.table(['coin', 'before', '$P(' + face + ' \\mid C_i)$', 'path', 'after'], c.map((x, i) => ['$C_' + (i + 1) + '$', '$' + T(x) + '$', '$' + T(like[i]) + '$', '$' + T(joint[i]) + '$', '$' + T(post[i]) + '$'])),
          bars2({ xs: ids.map(i => 'C' + i), a: c, b: post, aName: 'before the toss', bName: 'after seeing ' + word, xName: 'coin' }),
          K.p('A coin that makes ' + word + ' more likely than the bag as a whole ($P(' + face + ' \\mid C_i) > P(' + face + ') = ' + T(total) + '$) gains weight; a coin that makes it less likely loses weight.'),
          K.note('Check: the chances after the toss add up to 1: $' + post.map(T).join(' + ') + ' = ' + T(sumPost) + '$ ' + (sumPost.eq(1) ? '✓' : '✗'), sumPost.eq(1) ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- random-variable */
    // ?n=3&p=1/2&x=heads   n = tosses (1 to 6), p = the chance of heads, x = the random variable: heads (the number of heads),
    //   run (the longest run of heads), first (the toss of the first head, 0 if none), diff (heads minus tails)
    'random-variable'(el, query, ctx) {
      const t = topic(el, query, ctx, { n: 3, p: '1/2', x: 'heads' }, v => { v.n = whole(v.n, 1, 6, 3); if (!RV[v.x]) v.x = 'heads'; });
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('A <b>random variable</b> $X$ is a rule that gives a number to every outcome: a function from the sample space to the numbers. Several outcomes may get the same number; the outcomes that get the number $x$ form the event "$X = x$".'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 6, onChange: v => s.set({ n: v }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        rvPicker(s.v.x, v => s.set({ x: v })),
        tries([['Stats 1 Week 9: heads in 3 tosses', { n: 3, p: '1/2', x: 'heads' }, 'Lecture 9.1: X = the number of heads in 3 tosses'],
          ['Stats 1 Week 9: the first head', { n: 3, p: '1/2', x: 'first' }, 'Lecture 9.1: Y = the toss where the first head appears; for TTT the lecture writes "nil" and notes that 0 could be used, as here'], ['Longest run, 4 tosses', { n: 4, p: '1/2', x: 'run' }]], t.load)), draw);
      function draw() {
        const n = s.v.n, X = RV[s.v.x], p = readP(out, s.v.p);
        if (!p) return;
        const S = outcomes(n), N = S.length, ph = perHeads(n, p), d = dist(n, p, X);
        out.append(K.answer('$X$ = ' + X.name + ', for ' + tosses(n) + ' with $p = ' + T(p) + '$: its values and their chances', '\\begin{aligned}' + d.map(r => 'P(X = ' + r.x + ') &= ' + TX(r.P)).join(' \\\\ ') + '\\end{aligned}'));
        out.append(K.card('The rule, outcome by outcome',
          K.p('Each outcome on the left gets one number on the right. Different outcomes may share a number, but no outcome gets two: that is what makes $X$ a function.'),
          n <= 4 ? mapPic(S, X) : null,
          n <= 4 ? K.table(['outcome $s$', '$X(s)$', 'chance of $s$'], S.map(o => [[...o].map(f => K.coin(f, 18)).join(''), '$' + X.f(o) + '$', '$' + T(ph[heads(o)]) + '$']))
            : h('div', { class: 'lk-outcomes' }, S.map(o => h('span', { class: 'lk-outcome', html: '<span class="cl-set">' + o + '</span>&nbsp;↦&nbsp;<b>' + X.f(o) + '</b>' }))),
          K.p('The chance of one outcome with $h$ heads is $p^{h}(1-p)^{' + n + '-h}$, with $p = ' + T(p) + '$.'),
          s.v.x === 'first' ? K.note('When no head appears (<span class="cl-set">' + 'T'.repeat(n) + '</span>) there is no "first head". Stats 1 lecture 9.1 writes "nil" there and says a number such as 0 could be used instead; this lab uses 0.') : null));
        const sum = sumF(d.map(r => r.P)), cnt = d.reduce((a, r) => a + r.outs.length, 0);
        out.append(K.card('The events $X = x$',
          K.table(['$x$', 'the event $X = x$', 'outcomes', '$P(X = x)$'], d.map(r => ['$' + r.x + '$', '<div class="cl-cell"><span class="cl-set">{' + r.outs.join(', ') + '}</span></div>', '$' + r.outs.length + '$', '$' + TX(r.P) + '$'])),
          K.steps(d.map((r, i) => ({ text: i > 0 ? '' : p.eq(F(1, 2)) ? 'With a fair coin each outcome has chance $\\left(\\frac12\\right)^{' + n + '}$, so the chance of an event is (its number of outcomes) × that:' : 'Each event adds up the chances of its outcomes; an outcome with $h$ heads has chance $p^{h}(1-p)^{' + n + '-h}$:', tex: chain('P(X = ' + r.x + ')', sumT(r.outs, n, p).nums, TX(r.P)) }))),
          K.note('Check: the events $X = x$ do not overlap and every outcome is in one of them: $' + d.map(r => r.outs.length).join(' + ') + ' = ' + cnt + '$ outcomes ' + (cnt === N ? '✓' : '✗') + ', and the chances add up to $' + T(sum) + '$ ' + (sum.eq(1) ? '✓' : '✗'), cnt === N && sum.eq(1) ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- pmf-cdf */
    // ?n=4&p=1/2&x=heads&a=1&b=3   n = tosses (1 to 10), p = the chance of heads, x = the random variable (heads | run |
    //   first | diff, as in random-variable), a and b = the ends of the interval in P(a < X ≤ b), whole numbers from −10 to 10
    'pmf-cdf'(el, query, ctx) {
      const fix = v => { v.n = whole(v.n, 1, 10, 4); if (!RV[v.x]) v.x = 'heads'; v.a = whole(v.a, -10, 10, 1); v.b = whole(v.b, -10, 10, 3); };
      const t = topic(el, query, ctx, { n: 4, p: '1/2', x: 'heads', a: 1, b: 3 }, fix);
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('The <b>PMF</b> (probability mass function) lists each value of $X$ with its chance, $p(x) = P(X = x)$. The <b>CDF</b> (cumulative distribution function) adds them up from the left: $F(x) = P(X \\le x)$. From $F$ you get the chance of any interval.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 10, onChange: v => s.set({ n: v }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        rvPicker(s.v.x, v => s.set({ x: v })),
        K.int({ label: 'Left end $a$ (not included)', value: s.v.a, min: -10, max: 10, onChange: v => s.set({ a: v }) }),
        K.int({ label: 'Right end $b$ (included)', value: s.v.b, min: -10, max: 10, onChange: v => s.set({ b: v }) }),
        tries([['Stats 1 Week 9: heads in 3 tosses', { n: 3, p: '1/2', x: 'heads', a: 0, b: 2 }, 'Lecture 9.1: P(X = 0, 1, 2, 3) = 1/8, 3/8, 3/8, 1/8'],
          ['Biased: n = 10, p = 3/10', { n: 10, p: '3/10', x: 'heads', a: 2, b: 5 }], ['An empty interval', { a: 3, b: 2 }]], t.load)), draw);
      function draw() {
        const n = s.v.n, X = RV[s.v.x], a = s.v.a, b = s.v.b, p = readP(out, s.v.p);
        if (!p) return;
        const d = dist(n, p, X), xs = d.map(r => r.x), cum = [];
        d.reduce((acc, r, i) => (cum[i] = acc.add(r.P)), F(0));
        const Fx = v => sumF(d.filter(r => r.x <= v).map(r => r.P)), inside = d.filter(r => r.x > a && r.x <= b), Pin = sumF(inside.map(r => r.P));
        const Fa = Fx(a), Fb = Fx(b), empty = a >= b;
        out.append(K.answer('$P(a < X \\le b)$ with $a = ' + a + '$ and $b = ' + b + '$, for $X$ = ' + X.name + ' ($n = ' + n + '$, $p = ' + T(p) + '$)',
          'P(' + a + ' < X \\le ' + b + ') = ' + (empty ? '0' : TX(Fb.sub(Fa))),
          empty ? 'No number $x$ has $' + a + ' < x \\le ' + b + '$ when $a \\ge b$, so the interval is empty.' : null));
        const hiIdx = d.map((r, i) => (r.x > a && r.x <= b ? i : -1)).filter(i => i >= 0);
        out.append(K.card('The PMF: $p(x) = P(X = x)$',
          K.p('Each value of $X$ with its chance; the chance of a value adds up its outcomes (see the Random variable topic). The bars of the interval $' + a + ' < x \\le ' + b + '$ are coloured.'),
          K.bars({ xs, ys: d.map(r => num(r.P)), hi: hiIdx, xName: 'x', yName: 'p(x)' }),
          K.table(['$x$', 'from the outcomes', '$p(x)$', '$F(x) = P(X \\le x)$'], d.map((r, i) => ['$' + r.x + '$', '$' + sumT(r.outs, n, p).nums + '$', '$' + TX(r.P) + '$', '$' + TX(cum[i]) + '$']), { hi: new Set(hiIdx) }),
          K.note('Check: the chances add up to $F(' + xs[xs.length - 1] + ') = ' + T(cum[cum.length - 1]) + '$ ' + (cum[cum.length - 1].eq(1) ? '✓' : '✗'), cum[cum.length - 1].eq(1) ? 'good' : 'warn')));
        const Fsteps = v => { const list = d.filter(r => r.x <= v); return list.length ? [list.map(r => 'p(' + r.x + ')').join(' + '), list.map(r => T(r.P)).join(' + '), TX(Fx(v))] : ['0']; };
        const cdfSteps = [
          { text: '$F(' + b + ')$ adds $p(x)$ for every value $x \\le ' + b + '$' + (d.some(r => r.x <= b) ? ':' : '; there is none, so it is 0.'), tex: chain('F(' + b + ')', ...Fsteps(b)) },
          { text: '$F(' + a + ')$ adds $p(x)$ for every value $x \\le ' + a + '$' + (d.some(r => r.x <= a) ? ':' : '; there is none, so it is 0.'), tex: chain('F(' + a + ')', ...Fsteps(a)) },
        ];
        if (!empty) cdfSteps.push({ text: 'The values with $' + a + ' < x \\le ' + b + '$ are counted in $F(' + b + ')$ but not in $F(' + a + ')$, so subtract:', tex: chain('P(' + a + ' < X \\le ' + b + ')', 'F(' + b + ') - F(' + a + ')', T(Fb) + ' - ' + T(Fa), TX(Fb.sub(Fa))) });
        out.append(K.card('The CDF: $F(x) = P(X \\le x)$',
          K.p('$F$ adds the chances from the left. It is flat between the values of $X$ and jumps by $p(x)$ at each value $x$, from 0 on the far left to 1 on the far right. The dashed lines mark $a = ' + a + '$, $b = ' + b + '$ and the heights $F(a)$ and $F(b)$: the gap between those heights is the answer.'),
          cdfMarked(xs, d.map(r => num(r.P)), a, b, num(Fa), num(Fb)),
          K.steps(cdfSteps),
          empty ? K.note('With $a \\ge b$ the interval is empty: the chance is 0 (the subtraction $F(b) - F(a) = ' + T(Fb.sub(Fa)) + '$ would not be a chance).', '')
            : K.note('Check by adding the PMF directly: $' + (inside.length ? inside.map(r => 'p(' + r.x + ')').join(' + ') + ' = ' + T(Pin) : '0') + '$ ' + (Pin.eq(Fb.sub(Fa)) ? '✓' : '✗'), Pin.eq(Fb.sub(Fa)) ? 'good' : 'warn')));
        const kinds = [
          ['P(' + a + ' < X \\le ' + b + ')', 'F(' + b + ') - F(' + a + ')', r => r.x > a && r.x <= b, Fx(b).sub(Fx(a))],
          ['P(' + a + ' \\le X \\le ' + b + ')', 'F(' + b + ') - F(' + (a - 1) + ')', r => r.x >= a && r.x <= b, Fx(b).sub(Fx(a - 1))],
          ['P(' + a + ' < X < ' + b + ')', 'F(' + (b - 1) + ') - F(' + a + ')', r => r.x > a && r.x < b, Fx(b - 1).sub(Fx(a))],
          ['P(' + a + ' \\le X < ' + b + ')', 'F(' + (b - 1) + ') - F(' + (a - 1) + ')', r => r.x >= a && r.x < b, Fx(b - 1).sub(Fx(a - 1))],
          ['P(X > ' + a + ')', '1 - F(' + a + ')', r => r.x > a, F(1).sub(Fx(a))],
        ];
        out.append(K.card('Careful with $<$ and $\\le$',
          K.p('$X$ takes whole numbers only, so "$X < ' + b + '$" is the same as "$X \\le ' + (b - 1) + '$", and "$X \\ge ' + a + '$" is the same as "$X > ' + (a - 1) + '$". Each interval then becomes a difference of two CDF values:'),
          K.table(['chance', 'with the CDF', 'value'], kinds.map(([lhs, rhs, test, viaF]) => { const direct = sumF(d.filter(test).map(r => r.P)); return ['$' + lhs + '$', '$' + rhs + ' = ' + T(viaF) + '$', '$' + T(direct) + (direct.eq(viaF) ? '' : '\\ (\\text{empty interval})') + '$']; }))));
      }
    },

    /* ---------------------------------------------------------------- expectation */
    // ?n=3&p=1/2&x=heads   n = tosses (1 to 10), p = the chance of heads, x = the random variable (heads | diff | run | first)
    expectation(el, query, ctx) {
      const t = topic(el, query, ctx, { n: 3, p: '1/2', x: 'heads' }, v => { v.n = whole(v.n, 1, 10, 3); if (!RV[v.x]) v.x = 'heads'; });
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('The <b>expectation</b> $\\E[X]$ is the long-run average of $X$: each value weighted by its chance. The <b>variance</b> measures how far $X$ spreads around it; the <b>standard deviation</b> (SD) is its square root.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 10, onChange: v => s.set({ n: v }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        rvPicker(s.v.x, v => s.set({ x: v })),
        tries([['Stats 1 Week 10: 3 fair tosses', { n: 3, p: '1/2', x: 'heads' }, 'Lectures 10.2 and 10.5: the number of heads in 3 tosses has mean 3/2 and variance 3/4'],
          ['A game: +₹1 per H, −₹1 per T', { x: 'diff' }], ['Biased: n = 10, p = 3/10', { n: 10, p: '3/10', x: 'heads' }]], t.load)), draw);
      function draw() {
        const n = s.v.n, key = s.v.x, X = RV[key], p = readP(out, s.v.p);
        if (!p) return;
        const q = F(1).sub(p), d = dist(n, p, X), xs = d.map(r => r.x);
        const mu = sumF(d.map(r => r.P.mul(r.x))), ex2 = sumF(d.map(r => r.P.mul(r.x * r.x))), vr = ex2.sub(mu.pow(2));
        const dev = d.map(r => F(r.x).sub(mu).pow(2).mul(r.P)), vdef = sumF(dev);
        out.append(K.answer('For $X$ = ' + X.name + ', $n = ' + n + '$, $p = ' + T(p) + '$', '\\begin{aligned} \\E[X] &= ' + TX(mu) + ' \\\\ \\Var(X) &= ' + TX(vr) + ' \\\\ \\SD(X) &' + sqrtT(vr) + '\\end{aligned}'));
        const chart = K.bars({ xs, ys: d.map(r => num(r.P)), xName: 'x', yName: 'p(x)' });
        barsMark(chart, xs, num(mu), 'mean');
        const short = d.length <= 7, sq = x => nb(x) + '^2';
        out.append(K.card('The table method',
          K.p('Each value with its chance (from the PMF), then the products. The dashed line is the mean: the balance point of the bars.'),
          chart,
          K.table(['$x$', '$p(x)$', '$x\\,p(x)$', '$x^2\\,p(x)$', '$(x-\\mu)^2\\,p(x)$'],
            d.map((r, i) => ['$' + r.x + '$', '$' + T(r.P) + '$', '$' + T(r.P.mul(r.x)) + '$', '$' + T(r.P.mul(r.x * r.x)) + '$', '$' + T(dev[i]) + '$'])
              .concat([['sum', '$' + T(sumF(d.map(r => r.P))) + '$', '$' + T(mu) + '$', '$' + T(ex2) + '$', '$' + T(vdef) + '$']]), { hi: new Set([d.length]) }),
          K.steps([
            { text: 'Multiply each value by its chance and add (the $x\\,p(x)$ column):', tex: chain('\\E[X]', '\\sum_x x\\,p(x)', ...(short ? [d.map(r => nb(r.x) + '\\cdot ' + T(r.P)).join(' + ')] : []), TX(mu)) },
            { text: 'Do the same with $x^2$ in place of $x$ (the $x^2\\,p(x)$ column):', tex: chain('\\E[X^2]', '\\sum_x x^2\\,p(x)', ...(short ? [d.map(r => sq(r.x) + '\\cdot ' + T(r.P)).join(' + ')] : []), TX(ex2)) },
            { text: 'The variance is the mean of the squares minus the square of the mean:', tex: chain('\\Var(X)', '\\E[X^2] - (\\E[X])^2', T(ex2) + ' - \\left(' + T(mu) + '\\right)^2', T(ex2) + ' - ' + T(mu.pow(2)), TX(vr)) },
            { text: 'The standard deviation is its square root, in the same units as $X$:', tex: '\\SD(X) = \\sqrt{' + T(vr) + '} ' + sqrtT(vr) },
          ]),
          K.note('Check with the definition $\\Var(X) = \\sum_x (x - \\mu)^2\\,p(x)$, the last column, where $\\mu = \\E[X] = ' + T(mu) + '$: it gives $' + T(vdef) + '$ ' + (vdef.eq(vr) ? '✓' : '✗'), vdef.eq(vr) ? 'good' : 'warn')));
        const np = p.mul(n), npq = p.mul(q).mul(n);
        if (key === 'heads') {
          out.append(K.card('The shortcut: $np$ and $np(1-p)$',
            K.steps([
              { text: 'Write $X = ' + (n <= 3 ? Array.from({ length: n }, (_, i) => 'X_' + (i + 1)).join(' + ') : 'X_1 + X_2 + \\dots + X_{' + n + '}') + '$, where $X_i = 1$ if toss $i$ is heads and $0$ if not. Each $X_i$ is a Bernoulli variable (see that topic):', tex: '\\begin{aligned} \\E[X_i] &= p = ' + T(p) + ' \\\\ \\Var(X_i) &= p(1-p) = ' + T(p) + ' \\times ' + T(q) + ' = ' + T(p.mul(q)) + '\\end{aligned}' },
              { text: 'Expectations always add up:', tex: chain('\\E[X]', 'np', n + ' \\times ' + T(p), TX(np)) },
              { text: 'The tosses are independent, so the variances add up too:', tex: chain('\\Var(X)', 'np(1-p)', n + ' \\times ' + T(p) + ' \\times ' + T(q), TX(npq)) },
            ]),
            K.note(np.eq(mu) && npq.eq(vr) ? 'The same as the table ✓' : 'The shortcut and the table differ ✗', np.eq(mu) && npq.eq(vr) ? 'good' : 'warn')));
        } else if (key === 'diff') {
          const m2 = np.mul(2).sub(n), v2 = npq.mul(4);
          out.append(K.card('The shortcut: $X = 2H - n$',
            K.steps([
              { text: 'Let $H$ be the number of heads. The tails are the other $' + n + ' - H$ tosses, so', tex: 'X = H - (' + n + ' - H) = 2H - ' + n },
              { text: 'For the number of heads, $\\E[H] = np$ and $\\Var(H) = np(1-p)$ (choose "Number of heads" above to see why):', tex: '\\begin{aligned} \\E[H] &= ' + n + ' \\times ' + T(p) + ' = ' + T(np) + ' \\\\ \\Var(H) &= ' + n + ' \\times ' + T(p) + ' \\times ' + T(q) + ' = ' + T(npq) + '\\end{aligned}' },
              { text: 'Multiplying by 2 doubles the mean, and taking away ' + n + ' moves it down by ' + n + ': $\\E[aH + b] = a\\,\\E[H] + b$.', tex: '\\E[X] = 2 \\times ' + T(np) + ' - ' + n + ' = ' + TX(m2) },
              { text: 'Taking away a constant does not change the spread, and multiplying by 2 multiplies the variance by $2^2$: $\\Var(aH + b) = a^2\\,\\Var(H)$.', tex: '\\Var(X) = 2^2 \\times ' + T(npq) + ' = ' + TX(v2) },
            ]),
            K.note(m2.eq(mu) && v2.eq(vr) ? 'The same as the table ✓' : 'The shortcut and the table differ ✗', m2.eq(mu) && v2.eq(vr) ? 'good' : 'warn')));
        } else out.append(K.card('A shortcut?', K.p('For ' + X.name + ' there is no short formula: the table above is the way to find its mean and variance. (For the number of heads, and for heads minus tails, there is one: choose them above.)')));
      }
    },

    /* ---------------------------------------------------------------- bernoulli */
    // ?p=1/2   p = the chance of heads on the one toss
    bernoulli(el, query, ctx) {
      const t = topic(el, query, ctx, { p: '1/2' }, () => {});
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('One toss. $X = 1$ if it shows heads (a "success") and $X = 0$ if it shows tails. This is a <b>Bernoulli</b> random variable with parameter $p$, the chance of a success.'),
        K.prob({ label: 'Chance of heads $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        tries([['Stats 1 Week 11: a fair coin', { p: '1/2' }, 'Lecture 11.1: the variance p(1 − p) is largest at p = 1/2'], ['p = 1/6 (a six on a die)', { p: '1/6' }], ['p = 9/10', { p: '9/10' }], ['p = 1 (always heads)', { p: '1' }]], t.load)), draw);
      function draw() {
        const p = readP(out, s.v.p);
        if (!p) return;
        const q = F(1).sub(p), pq = p.mul(q), half = F(1, 2);
        out.append(K.answer('$X \\sim$ Bernoulli$(' + T(p) + ')$: one toss, $X = 1$ for heads and $0$ for tails', '\\begin{aligned} \\E[X] &= ' + TX(p) + ' \\\\ \\Var(X) &= ' + TX(pq) + ' \\\\ \\SD(X) &' + sqrtT(pq) + '\\end{aligned}'));
        out.append(K.card('The PMF',
          K.table(['$x$', '$P(X = x)$'], [['$0$ (tails)', '$1 - p = ' + TX(q) + '$'], ['$1$ (heads)', '$p = ' + TX(p) + '$']]),
          K.bars({ xs: [0, 1], ys: [num(q), num(p)], xName: 'x', yName: 'P(X = x)' }),
          K.note('Check: $' + T(q) + ' + ' + T(p) + ' = ' + T(q.add(p)) + '$ ✓', 'good')));
        out.append(K.card('Mean and variance, step by step',
          K.steps([
            { text: 'Mean: each value times its chance, added.', tex: chain('\\E[X]', '0 \\cdot (1-p) + 1 \\cdot p', '0 \\cdot ' + T(q) + ' + 1 \\cdot ' + T(p), TX(p)) },
            { text: '$X^2 = X$, because $0^2 = 0$ and $1^2 = 1$. So the mean of $X^2$ is the same:', tex: chain('\\E[X^2]', '0^2 \\cdot (1-p) + 1^2 \\cdot p', 'p = ' + T(p)) },
            { text: 'Variance: the mean of the square minus the square of the mean.', tex: chain('\\Var(X)', '\\E[X^2] - (\\E[X])^2', 'p - p^2 = p(1-p)', T(p) + ' \\times ' + T(q), TX(pq)) },
            { text: 'Standard deviation: the square root.', tex: '\\SD(X) = \\sqrt{' + T(pq) + '} ' + sqrtT(pq) },
          ])));
        const dd = p.sub(half).pow(2), back = F(1, 4).sub(dd);
        out.append(K.card('Which coin is the hardest to predict?',
          K.p('The variance $p(1-p)$ for every $p$ from 0 to 1. Your coin is the dot.'),
          varCurve(p),
          K.steps([
            { text: 'Complete the square:', tex: chain('p(1-p)', 'p - p^2', '\\frac14 - \\left(p - \\frac12\\right)^2') },
            { text: 'With your $p$:', tex: chain('\\frac14 - \\left(' + T(p) + ' - \\frac12\\right)^2', '\\frac14 - ' + T(dd), T(back)) },
            { text: 'A square is never negative, so $p(1-p) \\le \\frac14$, with equality only at $p = \\frac12$. A fair coin is the hardest to predict; a coin with $p$ near 0 or 1 is almost certain. Stats 1 lecture 11.1 finds the same with calculus: the derivative $1 - 2p$ is 0 at $p = \\frac12$.' },
          ]),
          K.note((back.eq(pq) ? 'Check: the same as $p(1-p) = ' + T(pq) + '$ ✓' : 'Check failed ✗') + (p.eq(half) ? '' : ' And $p = ' + T(p) + '$ and $p = ' + T(q) + '$ give the same variance: swapping the names of heads and tails does not change the spread.'), back.eq(pq) ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- binomial (the model topic) */
    // ?n=5&p=1/2&k=2   n = tosses (1 to 30), p = the chance of heads, k = the number of heads asked about
    binomial(el, query, ctx) {
      const s = K.state(ctx, { n: 5, p: '1/2', k: 2 }, query, draw);
      const { controls, out } = K.layout(el);
      controls.append(
        K.p('Toss a coin $n$ times. Each toss is heads with probability $p$, and the tosses do not affect each other. $X$ counts the heads.'),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 30, onChange: v => s.set({ n: v, k: Math.min(s.v.k, v) }) }),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        K.int({ label: 'Number of heads $k$ you ask about', value: s.v.k, min: 0, max: 30, onChange: v => s.set({ k: Math.min(v, s.v.n) }) }));
      function draw() {
        out.innerHTML = '';
        const n = s.v.n, k = Math.min(s.v.k, n);
        let p;
        try { p = F.parse(s.v.p); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const q = F(1).sub(p);
        const pmf = []; for (let j = 0; j <= n; j++) pmf.push(K.C(n, j).mul(p.pow(j)).mul(q.pow(n - j)));
        const pk = pmf[k];
        out.append(K.answer('$P(X = ' + k + ')$ for $X \\sim \\Bin(' + n + ', ' + T(p) + ')$', 'P(X=' + k + ') = ' + TD(pk, 6)));

        // why: one particular sequence, then how many sequences
        const one = 'H'.repeat(k) + 'T'.repeat(n - k);
        out.append(K.card('Where the formula comes from',
          K.steps([
            { text: 'Take <b>one</b> sequence with exactly ' + k + ' heads, for example <b>' + (n <= 12 ? one : one.slice(0, 12) + '…') + '</b>. The tosses are independent, so multiply the chance of each toss: ' + k + ' heads at $p$ each and ' + (n - k) + ' tails at $1-p$ each.',
              tex: 'P(\\text{' + (n <= 8 ? one : 'that sequence') + '}) = p^{' + k + '}(1-p)^{' + (n - k) + '} = \\left(' + T(p) + '\\right)^{' + k + '}\\left(' + T(q) + '\\right)^{' + (n - k) + '} = ' + T(p.pow(k).mul(q.pow(n - k))) },
            { text: 'Every sequence with ' + k + ' heads has this same chance, only the positions of the heads change. Choosing the ' + k + ' positions out of ' + n + ' can be done in $\\binom{' + n + '}{' + k + '}$ ways.',
              tex: '\\binom{' + n + '}{' + k + '} = \\frac{' + n + '!}{' + k + '!\\,' + (n - k) + '!} = ' + K.C(n, k).tex() },
            { text: 'These sequences cannot happen together, so add their chances: (number of sequences) × (chance of one).',
              tex: 'P(X=' + k + ') = \\binom{' + n + '}{' + k + '}p^{' + k + '}(1-p)^{' + (n - k) + '} = ' + K.C(n, k).tex() + '\\times ' + T(p.pow(k).mul(q.pow(n - k))) + ' = ' + TD(pk, 6) },
          ])));

        // the whole distribution
        const xs = pmf.map((_, j) => j);
        out.append(K.card('The whole distribution of $X$',
          K.p('Every value $0, 1, \\dots, ' + n + '$ with its chance. The bar for $k = ' + k + '$ is coloured.'),
          K.bars({ xs, ys: pmf, hi: [k], xName: 'X (number of heads)', yName: 'P(X = k)' }),
          n <= 12 ? K.table(['$k$', '$\\binom{' + n + '}{k}$', '$P(X=k)$'], pmf.map((v, j) => ['$' + j + '$', '$' + K.C(n, j).tex() + '$', '$' + TD(v, 4) + '$']), { hi: new Set([k]) }) : null,
          K.p('Check: the chances add up to 1, because $(p + (1-p))^{' + n + '} = 1^{' + n + '} = 1$ (binomial theorem).')));

        // mean and variance
        const mean = p.mul(n), varr = p.mul(q).mul(n);
        out.append(K.card('Mean and variance',
          K.steps([
            { text: '$X$ is a sum of $n$ Bernoulli tosses $X_1 + \\dots + X_n$, each with mean $p$. Expectation adds up:', tex: '\\E[X] = np = ' + n + '\\times ' + T(p) + ' = ' + TD(mean) },
            { text: 'The tosses are independent, so variances add up too; one toss has variance $p(1-p)$:', tex: '\\Var(X) = np(1-p) = ' + n + '\\times ' + T(p) + '\\times ' + T(q) + ' = ' + TD(varr) },
            { text: 'The standard deviation is the square root:', tex: '\\SD(X) = \\sqrt{' + T(varr) + '} \\approx ' + Math.sqrt(varr.num()).toFixed(4) },
          ])));
      }
      draw();
    },

    /* ---------------------------------------------------------------- geometric */
    // ?p=1/2&k=3&m=2&n=3   p = the chance of heads (above 0), k = the number of tosses asked about (1 to 60), m and n = the
    //   numbers in the no-memory check P(X > m + n | X > m) = P(X > n), 0 to 40 each
    geometric(el, query, ctx) {
      const fix = v => { v.k = whole(v.k, 1, 60, 3); v.m = whole(v.m, 0, 40, 2); v.n = whole(v.n, 0, 40, 3); };
      const t = topic(el, query, ctx, { p: '1/2', k: 3, m: 2, n: 3 }, fix);
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('Toss until the first head appears. $X$ = the number of tosses needed, the head included. So $X$ can be $1, 2, 3, \\dots$ with no upper limit: this is the <b>geometric</b> distribution.'),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        K.int({ label: 'Number of tosses $k$ you ask about', value: s.v.k, min: 1, max: 60, onChange: v => s.set({ k: v }) }),
        K.int({ label: 'No-memory check: tails so far $m$', value: s.v.m, min: 0, max: 40, onChange: v => s.set({ m: v }) }),
        K.int({ label: 'No-memory check: more tosses $n$', value: s.v.n, min: 0, max: 40, onChange: v => s.set({ n: v }) }),
        tries([['Stats 2: a fair coin', { p: '1/2', k: 3 }, 'The geometric distribution lecture: P(1) = 1/2, P(2) = 1/4, P(3) = 1/8'],
          ['Stats 2: Ludo, wait for a 1', { p: '1/6', k: 5 }, 'The same lecture: throw a die until it shows 1, a "head" with chance 1/6; fewer than 6 throws means X ≤ 5'],
          ['Stats 2 Week 3: p = 0.3', { p: '3/10', k: 3 }, 'Lecture 3.1: the mean of a geometric(0.3) is 1/0.3 ≈ 3.33']], t.load)), draw);
      function draw() {
        const k = s.v.k, m = s.v.m, nn = s.v.n, p = readP(out, s.v.p);
        if (!p) return;
        if (p.isZero()) { out.append(K.note('With $p = 0$ the coin never shows heads, so the wait never ends and $X$ has no value. Choose $p$ above 0.', 'warn')); return; }
        const q = F(1).sub(p), pk = q.pow(k - 1).mul(p), qk = q.pow(k), Fk = F(1).sub(qk), mean = F(1).div(p), pf = num(p), qf = 1 - pf;
        out.append(K.answer('$X$ = the number of tosses until the first head, with $p = ' + T(p) + '$', 'P(X = ' + k + ') = ' + TX(pk)));
        const seq = 'T'.repeat(k - 1) + 'H';
        out.append(K.card('Why $(1-p)^{k-1}\\,p$',
          K.steps([
            { text: k === 1 ? '$X = 1$ means: the first toss is heads.' : '$X = ' + k + '$ means: tosses 1 to ' + (k - 1) + ' are all tails and toss ' + k + ' is heads. Only one sequence does that:' },
            { text: k === 1 ? 'Its chance is just $p$:' : 'The tosses are independent, so multiply: ' + pl(k - 1, 'tail') + ' at $1 - p$ each, then one head at $p$.', tex: chain('P(X = ' + k + ')', (k === 1 ? 'p' : '(1-p)^{' + (k - 1) + '}\\,p'), [powT(q, k - 1), T(p)].filter(Boolean).join(' \\cdot '), TX(pk)) },
          ]),
          k <= 14 ? coinRows([seq], { cls: () => 'hi' }) : K.p('<span class="cl-set">' + 'T'.repeat(6) + '…' + 'T'.repeat(3) + 'H</span> (' + pl(k - 1, 'tail') + ', then a head)')));
        // bars up to K, far enough to show most of the chance
        const Kmax = Math.min(40, Math.max(k + 2, 8, qf > 0 ? Math.ceil(Math.log(0.02) / Math.log(qf)) : 1));
        const xs = Array.from({ length: Kmax }, (_, i) => i + 1), ys = floatsBy(pf, () => qf, 1, Kmax);
        const sumK = sumF(Array.from({ length: k }, (_, i) => q.pow(i).mul(p)));
        out.append(K.card('PMF and CDF',
          K.p('The chances fall by the factor $1 - p = ' + T(q) + '$ from each value to the next. Shown up to $' + Kmax + '$; they go on for ever, smaller and smaller.'),
          K.bars({ xs, ys, hi: k <= Kmax ? [k - 1] : [], xName: 'k (tosses until the first head)', yName: 'P(X = k)' }),
          K.cdf({ xs, ps: ys, xName: 'k', mark: k <= Kmax ? k : null }),
          K.steps([
            { text: '$X > ' + k + '$ means the first ' + k + ' tosses are all tails:', tex: chain('P(X > ' + k + ')', '(1-p)^{' + k + '}', powT(q, k), TX(qk)) },
            { text: 'So the CDF, the chance of a head within ' + tosses(k) + ', is', tex: chain('F(' + k + ')', 'P(X \\le ' + k + ')', '1 - (1-p)^{' + k + '}', '1 - ' + T(qk), TX(Fk)) },
          ]),
          K.note('Check by adding the PMF: $P(X = 1) + \\dots + P(X = ' + k + ') = ' + T(sumK) + '$ ' + (sumK.eq(Fk) ? '✓' : '✗'), sumK.eq(Fk) ? 'good' : 'warn')));
        // the mean, and a numerical check of it
        let part = 0, j = 1, v = pf;
        const stop = Math.min(2e5, Math.ceil(60 / pf) + 10);
        for (; j <= stop; j++) { part += j * v; v *= qf; }
        out.append(K.card('Mean: $1/p$',
          K.steps([
            { text: 'Look at the first toss. With chance $p$ it is heads: you stop after 1 toss. With chance $1 - p$ it is tails: you have used 1 toss and, because the coin has no memory, the rest of the wait is a fresh copy of $X$. So on average', tex: '\\E[X] = 1 + (1-p)\\,\\E[X]' },
            { text: 'Take $(1-p)\\,\\E[X]$ to the left side:', tex: '\\E[X] - (1-p)\\,\\E[X] = p\\,\\E[X] = 1' },
            { text: 'Divide by $p$:', tex: '\\E[X] = \\frac{1}{p} = 1 \\div ' + T(p) + ' = ' + TX(mean) },
          ]),
          K.note('Check: adding $k \\cdot P(X = k)$ for $k = 1$ to ' + stop + ' gives $\\approx ' + decT(part, 4) + '$ (the terms after that are tiny) ' + (Math.abs(part - num(mean)) < 1e-6 * Math.max(1, num(mean)) ? '✓' : '✗'), Math.abs(part - num(mean)) < 1e-6 * Math.max(1, num(mean)) ? 'good' : 'warn')));
        // no memory
        const qm = q.pow(m), qmn = q.pow(m + nn), qn = q.pow(nn);
        if (qm.isZero()) { out.append(K.card('No memory', K.note('With $p = 1$ the first toss is always heads, so "$X > ' + m + '$" never happens and $P(X > m + n \\mid X > m)$ is not defined. Try $m = 0$ or a $p$ below 1.', 'warn'))); return; }
        const ratio = qmn.div(qm);
        out.append(K.card('No memory: $P(X > m + n \\mid X > m) = P(X > n)$',
          K.p('Suppose the first $m = ' + m + '$ tosses were all tails. Is a head now "due"? Find the chance of needing more than $n = ' + nn + '$ further tosses.'),
          K.steps([
            { text: 'Conditional probability:', tex: chain('P(X > ' + (m + nn) + ' \\mid X > ' + m + ')', '\\frac{P(X > ' + (m + nn) + ' \\text{ and } X > ' + m + ')}{P(X > ' + m + ')}') },
            { text: 'If $X > ' + (m + nn) + '$, then surely $X > ' + m + '$, so the top is just $P(X > ' + (m + nn) + ')$. Use $P(X > t) = (1-p)^{t}$:', tex: chain('P(X > ' + (m + nn) + ' \\mid X > ' + m + ')', '\\frac{(1-p)^{' + (m + nn) + '}}{(1-p)^{' + m + '}}', T(qmn) + ' \\div ' + T(qm), TX(ratio)) },
            { text: 'Now a fresh start, with no tosses so far:', tex: chain('P(X > ' + nn + ')', '(1-p)^{' + nn + '}', TX(qn)) },
          ]),
          K.note(ratio.eq(qn) ? 'The same ✓ After ' + pl(m, 'tail') + ' in a row the wait for the first head starts again, as if nothing had happened: the coin has no memory (Stats 2 lecture 2.2).' : 'They differ ✗', ratio.eq(qn) ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- negative-binomial */
    // ?p=1/2&r=2&k=4   p = the chance of heads (above 0), r = how many heads you wait for (1 to 10), k = the number of tosses
    //   asked about (1 to 80)
    'negative-binomial'(el, query, ctx) {
      const t = topic(el, query, ctx, { p: '1/2', r: 2, k: 4 }, v => { v.r = whole(v.r, 1, 10, 2); v.k = whole(v.k, 1, 80, 4); });
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('Toss until the $r$-th head appears. $X$ = the number of tosses needed, so $X$ can be $r, r + 1, r + 2, \\dots$ This is the <b>negative binomial</b> distribution; with $r = 1$ it is the geometric one.'),
        K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
        K.int({ label: 'Heads to wait for $r$', value: s.v.r, min: 1, max: 10, onChange: v => s.set({ r: v }) }),
        K.int({ label: 'Number of tosses $k$ you ask about', value: s.v.k, min: 1, max: 80, onChange: v => s.set({ k: v }) }),
        tries([['Stats 2: wait for 2 heads', { p: '1/2', r: 2, k: 4 }, 'The common distributions lecture: the number of trials needed for 2 successes is negative binomial (2, p)'],
          ['r = 1 is the geometric', { r: 1, k: 3 }], ['3 heads with p = 3/10', { p: '3/10', r: 3, k: 8 }]], t.load)), draw);
      function draw() {
        const r = s.v.r, k = s.v.k, p = readP(out, s.v.p);
        if (!p) return;
        if (p.isZero()) { out.append(K.note('With $p = 0$ the coin never shows heads, so the wait never ends. Choose $p$ above 0.', 'warn')); return; }
        const q = F(1).sub(p), pf = num(p), qf = 1 - pf, mean = F(r).div(p);
        const Ck = K.C(k - 1, r - 1), one = p.pow(r).mul(q.pow(Math.max(0, k - r))), pk = k < r ? F(0) : Ck.mul(one);
        out.append(K.answer('$X$ = the number of tosses until the ' + ord(r) + ' head, with $p = ' + T(p) + '$', 'P(X = ' + k + ') = ' + TX(pk)));
        if (k < r) out.append(K.card('Where the binomial coefficient comes from', K.note('You need at least ' + tosses(r) + ' to see ' + pl(r, 'head') + ', so $P(X = ' + k + ') = 0$. Choose $k \\ge ' + r + '$.', '')));
        else {
          const seqs = [];
          if (Ck.n <= 30n && k <= 12) for (const o of outcomes(k - 1)) if (heads(o) === r - 1) seqs.push(o + 'H');
          out.append(K.card('Where the binomial coefficient comes from',
            K.steps([
              { text: '$X = ' + k + '$ means: toss ' + k + ' is heads and it is the ' + ord(r) + ' head. So ' + (r === 1 ? (k === 1 ? 'there is nothing before it.' : 'the first ' + tosses(k - 1) + ' before it are all tails.') : 'the first ' + tosses(k - 1) + ' hold exactly ' + pl(r - 1, 'head') + ', in any places.') },
              { text: r === 1 ? 'There is just one way to place no heads:' : r === 2 ? 'Choose the place of that one head among the first ' + tosses(k - 1) + ':' : 'Choose the places of those ' + (r - 1) + ' heads among the first ' + tosses(k - 1) + ':', tex: '\\binom{k-1}{r-1} = \\binom{' + (k - 1) + '}{' + (r - 1) + '} = ' + Ck.tex() },
              { text: 'Each such sequence has ' + pl(r, 'head') + ' and ' + pl(k - r, 'tail') + ', so each has the same chance:', tex: chain('p^{' + r + '}(1-p)^{' + (k - r) + '}', [powT(p, r), powT(q, k - r)].filter(Boolean).join(' \\cdot '), TX(one)) },
              { text: 'They cannot happen together, so add: (number of sequences) × (chance of one).', tex: chain('P(X = ' + k + ')', '\\binom{' + (k - 1) + '}{' + (r - 1) + '}\\,p^{' + r + '}(1-p)^{' + (k - r) + '}', Ck.tex() + ' \\times ' + T(one), TX(pk)) },
            ]),
            seqs.length ? K.p('The ' + seqs.length + ' sequence' + (seqs.length === 1 ? '' : 's') + ' (the last coin is always the ' + ord(r) + ' head):') : null,
            seqs.length ? coinRows(seqs, { size: k <= 6 ? 21 : 16 }) : null,
            r === 1 ? K.note('With $r = 1$: $\\binom{k-1}{0} = 1$ and the formula becomes $(1-p)^{k-1}\\,p$, the geometric PMF ✓', 'good') : null));
        }
        // the PMF as floats, from P(r) = p^r and P(j + 1) / P(j) = j (1 − p) / (j − r + 1)
        const ratio = j => j * qf / (j - r + 1);
        let Kmax = Math.max(k + 2, r + 8), cum = 0;
        { let v = Math.pow(pf, r); for (let j = r; j <= r + 60; j++) { cum += v; if (cum >= 0.99 && j >= Kmax) { Kmax = j; break; } v *= ratio(j); Kmax = Math.max(Kmax, Math.min(j + 1, r + 60)); } }
        Kmax = Math.min(Kmax, r + 60);
        const xs = [], ys = floatsBy(Math.pow(pf, r), ratio, r, Kmax);
        for (let j = r; j <= Kmax; j++) xs.push(j);
        const shown = ys.reduce((a, b) => a + b, 0);
        out.append(K.card('The PMF',
          K.p('Each value from $' + r + '$ to $' + Kmax + '$ with its chance; the coloured bar is $k = ' + k + '$. Together these bars hold $' + decT(shown, 4) + '$ of the chance; the rest lies further right.'),
          K.bars({ xs, ys, hi: k >= r && k <= Kmax ? [k - r] : [], xName: 'k (tosses until the ' + ord(r) + ' head)', yName: 'P(X = k)' })));
        let part = 0, v = Math.pow(pf, r), j = r;
        const stop = Math.min(1e6, Math.ceil((r + 40 + 10 * Math.sqrt(r)) / pf) + 10);
        for (; j <= stop; j++) { part += j * v; v *= ratio(j); }
        const ok = Math.abs(part - num(mean)) < 1e-6 * Math.max(1, num(mean));
        out.append(K.card('Mean: $r/p$',
          K.steps([
            { text: 'Split the wait into ' + r + ' part' + (r === 1 ? '' : 's') + ': the tosses until the 1st head' + (r > 1 ? ', then from there until the 2nd head' + (r > 2 ? ', and so on' : '') : '') + '. Each part is a geometric wait with mean $1/p$, because the coin has no memory:', tex: 'X = G_1' + (r > 1 ? ' + G_2' : '') + (r > 2 ? ' + \\dots + G_{' + r + '}' : '') },
            { text: 'Expectations add up:', tex: '\\E[X] = ' + (r === 1 ? '' : r + ' \\times ') + '\\frac{1}{p} = ' + r + ' \\div ' + T(p) + ' = ' + TX(mean) },
          ]),
          K.note('Check: adding $k \\cdot P(X = k)$ for $k = ' + r + '$ to ' + stop + ' gives $\\approx ' + decT(part, 4) + '$ ' + (ok ? '✓' : '✗'), ok ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- poisson */
    // ?lambda=2&n=20&k=2   lambda = λ, the average number of heads (above 0, at most 30, as 2, 1/2 or 2.5), n = the number of
    //   tosses (at least λ, at most 100000), k = the number of heads asked about (0 to 60)
    poisson(el, query, ctx) {
      const t = topic(el, query, ctx, { lambda: '2', n: 20, k: 2 }, v => { v.n = whole(v.n, 1, 100000, 20); v.k = whole(v.k, 0, 60, 2); });
      const { s, controls, out } = t;
      t.start(() => controls.append(
        K.p('Toss a coin many times ($n$ large) when heads is rare ($p$ small), keeping the average number of heads $\\lambda = np$ fixed. The number of heads, a binomial count, is then very close to a <b>Poisson</b> random variable with mean $\\lambda$.'),
        K.prob({ label: 'Average number of heads $\\lambda$', value: s.v.lambda, min: 0, max: 30, presets: ['1', '2', '4', '8'], onChange: v => s.set({ lambda: v }) }),
        K.int({ label: 'Number of tosses $n$', value: s.v.n, min: 1, max: 100000, onChange: v => s.set({ n: v }) }),
        K.int({ label: 'Number of heads $k$ you ask about', value: s.v.k, min: 0, max: 60, onChange: v => s.set({ k: v }) }),
        tries([['Stats 1 Week 11: n = 16, λ = 1', { lambda: '1', n: 16, k: 1 }, 'Lecture 11.8 draws the Poisson PMF for λ = 1, 4 and 8 and compares it with n = 16 tosses (p = 1/16, 1/4, 1/2)'],
          ['n = 16, λ = 4', { lambda: '4', n: 16, k: 4 }], ['n = 16, λ = 8', { lambda: '8', n: 16, k: 8 }], ['n = 1000, λ = 2', { lambda: '2', n: 1000, k: 2 }]], t.load)), draw);
      function draw() {
        const n = s.v.n, k = s.v.k;
        let lam;
        try { lam = frac(s.v.lambda, 0, 30, 'The average $\\lambda$'); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        if (lam.isZero()) { out.append(K.note('With $\\lambda = 0$ there are never any heads. Choose $\\lambda$ above 0.', 'warn')); return; }
        if (lam.cmp(n) > 0) { out.append(K.note('$p = \\lambda / n = ' + T(lam.div(n)) + '$ would be more than 1. Use at least ' + Math.ceil(num(lam)) + ' tosses.', 'warn')); return; }
        const p = lam.div(n), q = F(1).sub(p), L = num(lam), pf = num(p), d6 = x => decT(x, 6);
        const K2 = Math.min(60, Math.max(k + 1, Math.ceil(L + 4 * Math.sqrt(L) + 2), 6));
        const bin = binomFloats(n, pf, K2), po = poisFloats(L, K2), diff = Math.abs(bin[k] - po[k]);
        const exact = n <= 30 ? (k > n ? F(0) : K.C(n, k).mul(p.pow(k)).mul(q.pow(n - k))) : null;
        out.append(K.answer('$P(X = ' + k + ')$ with $n = ' + n + '$ tosses and $p = \\lambda / n = ' + T(p) + '$: binomial and Poisson',
          '\\begin{aligned} \\text{binomial: } P(X = ' + k + ') &\\approx ' + d6(bin[k]) + ' \\\\ \\text{Poisson: } P(X = ' + k + ') &\\approx ' + d6(po[k]) + '\\end{aligned}',
          'They differ by about $' + d6(diff) + '$.'));
        out.append(K.card('Side by side',
          K.p('Blue: the exact binomial chances of $k$ heads in ' + n + ' tosses with $p = ' + T(p) + '$. Purple: Poisson with $\\lambda = ' + T(lam) + '$. The shaded pair is $k = ' + k + '$.'),
          bars2({ xs: Array.from({ length: K2 + 1 }, (_, i) => i), a: bin, b: po, aName: 'binomial (n = ' + n + ')', bName: 'Poisson (λ = ' + lam.str() + ')', xName: 'k (number of heads)', hi: k }),
          K.table(['$k$', 'binomial', 'Poisson', 'difference'], bin.map((b, i) => ['$' + i + '$', '$' + d6(b) + '$', '$' + d6(po[i]) + '$', '$' + d6(Math.abs(b - po[i])) + '$']), { hi: new Set([k]) })));
        const f2 = lam.pow(k).div(K.fact(k)), e = Math.exp(-L);
        out.append(K.card('The Poisson PMF, step by step',
          K.steps([
            { text: 'The Poisson PMF with mean $\\lambda$, for $k = 0, 1, 2, \\dots$ ($e \\approx 2.71828$):', tex: 'P(X = k) = e^{-\\lambda}\\,\\frac{\\lambda^{k}}{k!}' },
            { text: 'Put in $\\lambda = ' + T(lam) + '$ and $k = ' + k + '$:', tex: 'P(X = ' + k + ') = e^{-' + T(lam) + '}\\,\\frac{' + (k === 0 ? '1' : powT(lam, k)) + '}{' + k + '!}' },
            { text: 'The first factor:', tex: 'e^{-' + T(lam) + '} \\approx ' + d6(e) },
            { text: 'The second factor' + (isLong(lam.pow(k)) || isLong(K.fact(k)) ? ' (its numbers are long, so in decimals):' : ', exactly:'), tex: '\\frac{' + (k === 0 ? '1' : powT(lam, k)) + '}{' + k + '!} = \\frac{' + T(lam.pow(k)) + '}{' + T(K.fact(k)) + '} = ' + TX(f2, 6) },
            { text: 'Multiply:', tex: 'P(X = ' + k + ') \\approx ' + d6(e) + ' \\times ' + d6(num(f2)) + ' \\approx ' + d6(po[k]) },
          ])));
        if (pf < 1) {
          let g2 = 1; for (let j = 0; j < k; j++) g2 *= (n - j) / n;
          const g1 = num(f2), g3 = Math.pow(1 - pf, n), g4 = Math.pow(1 - pf, -k), prod = g1 * g2 * g3 * g4, ok = Math.abs(prod - bin[k]) <= 1e-9 * Math.max(1e-300, bin[k]) + 1e-15;
          out.append(K.card('Why the binomial turns into Poisson',
            K.steps([
              k > n ? { text: 'The exact binomial chance with your numbers is 0: ' + k + ' heads cannot happen in ' + tosses(n) + '.' }
                : { text: 'The exact binomial chance with your numbers:', tex: chain('P(X = ' + k + ')', '\\binom{' + n + '}{' + k + '}' + [powT(p, k), powT(q, n - k)].filter(Boolean).join(''), exact ? TX(exact, 6) : '\\approx ' + d6(bin[k])) },
              { text: 'Start from the binomial PMF and write $p = \\lambda / n$:', tex: 'P(X = k) = \\binom{n}{k}\\left(\\frac{\\lambda}{n}\\right)^{k}\\left(1 - \\frac{\\lambda}{n}\\right)^{n-k}' },
              { text: 'Write $\\binom{n}{k} = \\frac{n(n-1)\\cdots(n-k+1)}{k!}$ and split into four factors (Stats 1 lecture 11.8 does the same):', tex: 'P(X = k) = \\frac{\\lambda^{k}}{k!} \\times \\frac{n(n-1)\\cdots(n-k+1)}{n^{k}} \\times \\left(1 - \\frac{\\lambda}{n}\\right)^{n} \\times \\left(1 - \\frac{\\lambda}{n}\\right)^{-k}' },
              { text: 'With your $n = ' + n + '$, $\\lambda = ' + T(lam) + '$, $k = ' + k + '$:' + (k > n ? ' the second factor is 0, because you cannot get more heads than tosses.' : ''), tex: 'P(X = ' + k + ') \\approx ' + d6(g1) + ' \\times ' + d6(g2) + ' \\times ' + d6(g3) + ' \\times ' + d6(g4) + ' \\approx ' + d6(prod) },
              { text: 'As $n$ grows, the second and fourth factors go to 1 and the third goes to $e^{-\\lambda}$:', tex: '\\begin{aligned} \\frac{n(n-1)\\cdots(n-k+1)}{n^{k}} &\\to 1 \\\\ \\left(1 - \\frac{\\lambda}{n}\\right)^{n} &\\to e^{-' + T(lam) + '} \\approx ' + d6(e) + ' \\\\ \\left(1 - \\frac{\\lambda}{n}\\right)^{-k} &\\to 1 \\end{aligned}' },
              { text: 'So the binomial chance tends to the Poisson chance:', tex: '\\frac{\\lambda^{k}}{k!}\\,e^{-\\lambda} \\approx ' + d6(g1) + ' \\times ' + d6(e) + ' \\approx ' + d6(po[k]) },
            ]),
            K.note('Check: the four factors multiply to the binomial value $' + d6(bin[k]) + '$ ' + (ok ? '✓' : '✗'), ok ? 'good' : 'warn')));
        }
        const KE = Math.min(400, Math.ceil(L + 10 * Math.sqrt(L) + 10));
        const gap = x => { const b = binomFloats(x, L / x, KE), pp = poisFloats(L, KE); return Math.max(...b.map((v, j) => Math.abs(v - pp[j]))); };
        const ns = [...new Set([Math.ceil(L), 10, 20, 50, 100, 1000, 10000, 100000, n])].filter(x => x >= L).sort((a, b) => a - b);
        out.append(K.card('The gap shrinks as $n$ grows',
          K.p('For each number of tosses, the largest gap between the binomial and the Poisson chances (over all $k$), with $\\lambda = ' + T(lam) + '$ kept fixed. Once $n$ is large, $n \\times \\text{gap}$ hardly changes: the gap shrinks like $1/n$, so 10 times more tosses give about a 10 times smaller gap. Your $n$ is coloured.'),
          K.table(['tosses $n$', '$p = \\lambda / n$', 'largest gap', '$n \\times$ gap'], ns.map(x => { const g = gap(x); return ['$' + x + '$', '$' + d6(L / x) + '$', '$' + d6(g) + '$', '$' + decT(g * x, 3) + '$']; }), { hi: new Set([ns.indexOf(n)]) })));
        const vb = lam.mul(q), sumPo = po.reduce((a, b) => a + b, 0);
        out.append(K.card('Check: mean and variance',
          K.steps([
            { text: 'The binomial mean is $np$, the Poisson mean is $\\lambda$; they are equal by the choice $p = \\lambda / n$:', tex: 'np = ' + n + ' \\times ' + T(p) + ' = ' + T(lam) + ' = \\lambda' },
            { text: 'The binomial variance is $np(1-p) = \\lambda(1 - p)$; the Poisson variance is $\\lambda$. They agree when $p$ is small:', tex: '\\begin{aligned} \\text{binomial: } \\lambda(1-p) &= ' + T(lam) + ' \\times ' + T(q) + ' = ' + TX(vb) + ' \\\\ \\text{Poisson: } \\lambda &= ' + T(lam) + ' \\end{aligned}' },
            { text: 'The Poisson chances add up to 1, because $1 + \\lambda + \\frac{\\lambda^2}{2!} + \\dots = e^{\\lambda}$. The bars above already hold', tex: 'P(X \\le ' + K2 + ') \\approx ' + d6(sumPo) },
          ])));
      }
    },
  });
})();
