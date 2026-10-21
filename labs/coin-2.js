/* Coin lab, part 2 (topics joint … test): two counts from the same tosses, simulation, the normal and exponential
   approximations, estimating p (moments, likelihood, interval, Bayes) and testing a coin.
   Each topic takes its values from the link (documented above it) and keeps them there. coin.js holds the other
   topics; the two files share only the kit. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, T, h } = K;
  /** a table whose first column shows pictures: K.table's cells go through the kit's text cleaner, which shows an <svg>
      as its source text, so the cells start as plain text and the coins are put in afterwards */
  const picColumn = (tbl, pics) => { tbl.querySelectorAll('tbody tr').forEach((tr, i) => { tr.cells[0].innerHTML = pics[i]; }); return tbl; };

  /* Maths a phone can wrap. The kit wraps a chain after =, + or × on a narrow phone, but shows an aligned block, or any
     formula with a matrix, as one display that can only scroll sideways. flow() gives each row of an aligned block a
     line of its own (a row that goes on with + or − joins the line before; one that goes on with = is indented), sets
     a formula with a matrix inline so that it can break between the matrices, and lets a list break after a comma
     outside brackets. flowSteps and flowAnswer are K.steps and K.answer with flow() for the maths. */
  const { flow, flowSteps, flowAnswer } = (() => {
    const TOK = /\\(?:begin|end)\{[^}]*\}|\\[A-Za-z]+|\\.|[\s\S]/y;
    const toks = s => { const a = []; for (TOK.lastIndex = 0; TOK.lastIndex < s.length;) a.push(TOK.exec(s)[0]); return a; };
    const depth = t => (t === '{' || t === '\\left' || t.startsWith('\\begin') ? 1 : t === '}' || t === '\\right' || t.startsWith('\\end') ? -1 : 0);
    const LEAD = /^(?:\s|~|\\(?:quad|qquad|[,;: ]))+/, BIN = /^(?:[+−-]|\\(?:times|cdot|pm|mp|div)(?![A-Za-z]))/;
    const REL = /^(?:[=<>]|\\(?:approx|le|leq|ge|geq|ne|neq|equiv|sim|to|Rightarrow|Longrightarrow|longrightarrow|iff|implies)(?![A-Za-z]))/;
    function lines(src) {
      const tk = toks(String(src)), out = [];
      let pre = '', d = 0, i = 0;
      while (i < tk.length) {
        let t = tk[i++];
        if (t !== '\\begin{aligned}' || d) { d += depth(t); pre += t; continue; }
        if (pre.trim()) out.push(pre.trim());
        pre = '';
        const rows = [[]];
        let cell = '', e = 0;
        for (; i < tk.length; i++) {
          t = tk[i];
          if (!e && t === '\\end{aligned}') { i++; break; }
          if (!e && t === '\\\\') {                                 // a new row; skip a spacing like \\[4pt]
            rows[rows.length - 1].push(cell); rows.push([]); cell = '';
            let k = i + 1;
            while (k < tk.length && /^\s$/.test(tk[k])) k++;
            if (tk[k] === '[') { while (k < tk.length && tk[k] !== ']') k++; i = k; }
            continue;
          }
          if (!e && t === '&') { rows[rows.length - 1].push(cell); cell = ''; continue; }
          e += depth(t);
          cell += t;
        }
        rows[rows.length - 1].push(cell);
        for (const c of rows) {
          if (!c.join('').trim()) continue;
          if (c.length > 2) { for (let k = 0; k < c.length; k += 2) { const p = (c[k] + ' ' + (c[k + 1] || '')).replace(LEAD, '').trim(); if (p) out.push(p); } continue; }
          const go = c.length === 2 && !c[0].trim() ? c[1].replace(LEAD, '').trim() : null;
          if (go && BIN.test(go) && out.length) out[out.length - 1] += ' ' + go;
          else out.push(go && REL.test(go) ? '\\quad ' + go : c.join(' ').trim());
        }
        while (i < tk.length && LEAD.test(tk[i])) i++;
      }
      if (pre.trim()) out.push(pre.trim());
      return out.map(line => {
        let s = '', b = 0, e = 0;
        for (const t of toks(line)) {
          if (t === '(' || t === '[') b++; else if (t === ')' || t === ']') b--; else e += depth(t);
          s += t + (t === ',' && !b && !e ? '\\allowbreak ' : '');
        }
        return s;
      });
    }
    // a little room above and below each unbreakable piece, so that tall fractions on wrapped lines do not touch
    const flow = tex => lines(tex).map(l => '<span class="lk-wrap">' + K.kx('\\displaystyle ' + l, false).replace(/<span class="base">/g, '<span class="base" style="margin: .15em 0">') + '</span>').join('');
    return {
      flow,
      flowSteps: list => h('ol', { class: 'lk-steps' }, list.map(x => h('li', {}, x.text ? h('div', { class: 'lk-step-t', html: K.rich(x.text) }) : null, x.tex ? h('div', { class: 'lk-step-m', html: flow(x.tex) }) : null))),
      flowAnswer: (label, tex, note) => h('div', { class: 'lk-answer' }, h('div', { class: 'lk-answer-k', html: K.rich(label) }), h('div', { class: 'lk-answer-v', html: flow(tex) }), note ? h('div', { class: 'lk-answer-n', html: K.rich(note) }) : null),
    };
  })();
  const S = (tag, attrs, ...kids) => K.sv(tag, attrs, ...kids);
  const mi = tex => K.kx(tex, false);                      // inline maths inside raw HTML (grid cells, legends)

  /* ---------------------------------------------------------------- numbers */
  /** a whole number from a control or the link, kept between lo and hi (d when it is not a number) */
  const int = (v, lo, hi, d) => { v = Math.round(+v); return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d; };
  /** an exact number typed as 1/6, 0.25 or 25%; throws a sentence for the page when it is not allowed */
  function num(text, what, lo, hi, above) {
    let v;
    try { v = F.parse(text); } catch (e) { throw new Error(what + ': ' + e.message); }
    if (above ? v.cmp(lo) <= 0 : v.cmp(lo) < 0) throw new Error(what + ' must be ' + (above ? 'more than ' : 'at least ') + F(lo).str() + '.');
    if (v.cmp(hi) > 0) throw new Error(what + ' must be at most ' + F(hi).str() + '.');
    return v;
  }
  const bits = x => (x < 0n ? -x : x).toString(16).length * 4;
  /** a / b for whole numbers of any size, as an ordinary number */
  function ratio(a, b) {
    const sh = Math.max(bits(a), bits(b)) - 1000;
    if (sh > 0) { a >>= BigInt(sh); b >>= BigInt(sh); }
    return b === 0n ? (a < 0n ? -Infinity : Infinity) : Number(a) / Number(b);
  }
  const val = fr => { fr = F(fr); return ratio(fr.n, fr.d); };
  /** a decimal for maths: 4 decimals (4 significant digits below 0.1), "× 10^k" when very small or big */
  function dx(x) {
    if (Number.isNaN(x)) return '\\text{?}';
    if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a >= 1e-4 && a < 1e7) { const s = a >= 0.1 ? x.toFixed(4) : x.toPrecision(4); return s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s; }
    const [mant, e] = x.toExponential(3).split('e');
    return mant.replace(/\.?0+$/, '') + ' \\times 10^{' + (+e) + '}';
  }
  /** the same as plain text (chart labels) */
  const pd = x => (x === 0 ? '0' : Math.abs(x) >= 1e-4 && Math.abs(x) < 1e7 ? String(+x.toPrecision(4)) : x.toExponential(2));
  const long = (fr, max) => String(fr.n).replace('-', '').length > max || String(fr.d).length > max;
  /** "= \frac{3}{8} = 0.375", "= \frac{1}{3} \approx 0.3333", "= 2", or "\approx 0.1234" when the fraction is too long to read */
  function eq(fr, max = 15) {
    fr = F(fr);
    const x = val(fr);
    if (long(fr, max)) return '\\approx ' + dx(x);
    if (fr.isInt()) return '= ' + fr.tex();
    return '= ' + fr.tex() + (fr.exactDecimal(6) ? ' = ' + String(+x.toFixed(6)) : ' \\approx ' + dx(x));
  }
  /** a fraction as TeX when it is short, else its decimal (inside a longer line) */
  const tx = (fr, max = 15) => { fr = F(fr); return long(fr, max) ? dx(val(fr)) : fr.tex(); };
  /** a fraction in a table cell, at full size */
  const TT = fr => T(fr).replace('\\frac', '\\dfrac');
  /** a chain of equalities, chain('E[X]', '= 0 + 1', '= 1'): one line on a wide screen; the kit wraps it after "=" on a phone */
  const chain = (...rows) => rows.join(' ');
  /** Z_1 + Z_2 + Z_3, or Z_1 + … + Z_9 when long */
  const zsum = (i, j) => (j - i < 3 ? range(i, j).map(k => 'Z_{' + k + '}').join(' + ') : 'Z_{' + i + '} + \\dots + Z_{' + j + '}');
  function isqrt(n) { if (n < 2n) return n; let x = BigInt(Math.ceil(Math.sqrt(Number(n)))) + 1n; for (;;) { const y = (x + n / x) >> 1n; if (y >= x) break; x = y; } while (x * x > n) x--; return x; }
  /** the exact square root of a fraction when there is one, else null */
  const sqrtF = fr => { fr = F(fr); if (fr.n < 0n) return null; const a = isqrt(fr.n), b = isqrt(fr.d); return a * a === fr.n && b * b === fr.d ? F(a, b) : null; };
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const sum = list => list.reduce((s, v) => s.add(v), F(0));

  /** Binomial(n, p) exactly, every chance over one denominator: P(X = k) = top[k] / den (quick for n up to 1000) */
  function binom(n, p) {
    const u = p.n, w = p.d, v = w - u, up = [1n], vp = [1n];
    for (let k = 1; k <= n; k++) { up.push(up[k - 1] * u); vp.push(vp[k - 1] * v); }
    const top = []; let c = 1n;
    for (let k = 0; k <= n; k++) { top.push(c * up[k] * vp[n - k]); c = (c * BigInt(n - k)) / BigInt(k + 1); }
    const den = w ** BigInt(n);
    return {
      pk: k => (k < 0 || k > n ? 0 : ratio(top[k], den)),                                   // P(X = k), a number
      sum: (lo, hi) => { let s = 0n; for (let k = Math.max(0, lo); k <= Math.min(n, hi); k++) s += top[k]; return F(s, den); },   // P(lo ≤ X ≤ hi), exact
    };
  }

  /* ---------------------------------------------------------------- the normal curve */
  // Φ comes from the error function, Φ(z) = ½·erfc(−z/√2): erf by its Taylor series below 2.5, erfc by its continued
  // fraction above. Both are good to about 14 decimal places, far more than the 4 decimals of a z-table.
  function erf(x) {
    if (x < 0) return -erf(-x);
    if (x >= 2.5) return 1 - erfc(x);
    let term = x, s = x;
    for (let k = 1; k < 200; k++) { term *= (-x * x) / k; const add = term / (2 * k + 1); s += add; if (Math.abs(add) < 1e-17) break; }
    return (2 / Math.sqrt(Math.PI)) * s;
  }
  function erfc(x) {
    if (x < 2.5) return 1 - erf(x);
    let f = x, C = x, D = 0;                                // x + (1/2)/(x + (2/2)/(x + (3/2)/(x + …))), Lentz's method
    for (let j = 1; j < 500; j++) {
      D = x + (j / 2) * D; D = 1 / (D || 1e-300);
      C = x + (j / 2) / C; C = C || 1e-300;
      f *= C * D;
      if (Math.abs(C * D - 1) < 1e-16) break;
    }
    return Math.exp(-x * x) / (Math.sqrt(Math.PI) * f);
  }
  const Phi = z => (z === Infinity ? 1 : z === -Infinity ? 0 : z < 0 ? 0.5 * erfc(-z / Math.SQRT2) : 1 - 0.5 * erfc(z / Math.SQRT2));
  /** the area under the standard normal curve from z1 to z2, taken from the nearer tail so that nothing is lost */
  const area = (z1, z2) => (z1 > 0 ? Phi(-z1) - Phi(-z2) : Phi(z2) - Phi(z1));
  const phi = z => Math.exp((-z * z) / 2) / Math.sqrt(2 * Math.PI);
  /** the z with Φ(z) = P, by halving an interval */
  const PhiInv = P => { let lo = -40, hi = 40; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (Phi(mid) < P) lo = mid; else hi = mid; } return (lo + hi) / 2; };
  const PHI_NOTE = 'How $\\Phi$ is computed: $\\Phi(z) = \\tfrac12\\bigl(1 + \\operatorname{erf}(z/\\sqrt2)\\bigr)$, with the error function $\\operatorname{erf}$ worked out by its series (and a continued fraction far out in the tails). That is accurate to about 14 decimal places, so the values agree with a $z$-table to all of its 4 decimals.';
  /** ln Γ(x) for x > 0 (Lanczos), for Beta densities */
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  function lnGamma(x) {
    if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
    x -= 1;
    let a = LG[0];
    const t = x + 7.5;
    for (let i = 1; i < 9; i++) a += LG[i] / (x + i);
    return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
  }

  /* ---------------------------------------------------------------- charts */
  const niceStep = (span, count) => { const raw = span / count, e = 10 ** Math.floor(Math.log10(raw)), f = raw / e; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * e; };
  const ticks = (lo, hi, count = 4) => { if (!(hi > lo)) return [lo]; const st = niceStep(hi - lo, count), out = []; for (let v = Math.ceil(lo / st - 1e-9) * st; v <= hi + st * 1e-9; v += st) out.push(+v.toPrecision(12)); return out; };
  /** an empty chart: gridlines, tick labels and axis names; X(v) and Y(v) turn values into positions */
  function frame({ x0, x1, y0, y1, xt, yt, xName, yName, label, xf = pd, yf = pd, W = 360, H = 240 }) {
    const L = 46, R = 14, Tp = 24, B = 38;
    const X = v => L + ((v - x0) / (x1 - x0)) * (W - L - R), Y = v => H - B - ((v - y0) / (y1 - y0)) * (H - B - Tp);
    const svg = S('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': label });
    yt.forEach(v => svg.append(S('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), S('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, yf(v))));
    xt.forEach(v => svg.append(S('text', { x: X(v), y: H - B + 15, 'text-anchor': 'middle', class: 'tick' }, xf(v))));
    svg.append(S('text', { x: (L + W - R) / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis' }, xName));
    if (yName) svg.append(S('text', { x: 4, y: 13, class: 'axis' }, yName));
    return { svg, X, Y, W, H, L, R, Tp, B, wrap: h('div', { class: 'lk-chart-wrap' }, svg) };
  }
  const path = pts => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('');
  const curve = (pts, style, title) => S('path', { d: path(pts), style: 'fill: none; stroke-width: 2; stroke-linejoin: round; ' + style }, title ? S('title', {}, title) : null);
  const vline = (f, x, style, title) => S('line', { x1: f.X(x), x2: f.X(x), y1: f.Tp - 4, y2: f.H - f.B, style: 'stroke-width: 2; ' + style }, title ? S('title', {}, title) : null);
  /** bars for k = lo … hi with heights ys[k − lo]; coloured where hiK(k) */
  function barChart({ lo, hi, ys, hiK, xName, yName, label, top }) {
    top = top || Math.max(...ys) * 1.12 || 1;
    const st = Math.max(1, Math.round(niceStep(hi - lo + 1, 6))), xt = [];
    for (let k = Math.ceil(lo / st) * st; k <= hi; k += st) xt.push(k);
    const f = frame({ x0: lo - 0.5, x1: hi + 0.5, y0: 0, y1: top, xt, yt: ticks(0, top, 4), xName, yName, label });
    const w = f.X(1) - f.X(0), bw = w > 6 ? w - 2 : w * 0.85;
    ys.forEach((v, i) => { const k = lo + i; f.svg.append(S('rect', { x: f.X(k) - bw / 2, y: f.Y(v), width: bw, height: Math.max(0, f.Y(0) - f.Y(v)), rx: Math.min(3, bw / 3), class: 'bar' + (hiK(k) ? ' hi' : '') }, S('title', {}, xName + ' = ' + k + ': ' + pd(v)))); });
    return f;
  }
  /** a legend under a chart: [colour, text, kind] with kind line | dash | bar | area | dot */
  const legend = items => h('div', { class: 'lk-row', style: 'font-size: 13px; color: var(--ink-2); margin: 6px 0 2px' }, items.map(([color, text, kind]) => h('span', { style: 'display: inline-flex; align-items: center; gap: 6px' },
    S('svg', { width: 22, height: 12, 'aria-hidden': 'true' },
      kind === 'bar' || kind === 'area' ? S('rect', { x: 3, y: 1, width: 16, height: 10, rx: 2, style: 'fill: ' + color + (kind === 'area' ? '; fill-opacity: .3' : '') })
        : kind === 'dot' ? S('circle', { cx: 11, cy: 6, r: 4.5, style: 'fill: ' + color })
          : S('line', { x1: 1, x2: 21, y1: 6, y2: 6, style: 'stroke: ' + color + '; stroke-width: 2.5' + (kind === 'dash' ? '; stroke-dasharray: 4 3' : '') })),
    h('span', { html: K.rich(text) }))));
  const BAR = 'color-mix(in srgb, var(--accent) 55%, var(--bg-elev))';
  /** a kit button with a full 44 px touch target */
  const btn = (label, fn) => { const b = K.button(label, fn); b.style.minHeight = '44px'; return b; };
  /** 10000 → 10{,}000 in maths, so the comma is not read as a list */
  const big = n => n.toLocaleString('en').replace(/,/g, '{,}');
  /** h/N as it stands (not reduced), with its decimal */
  const ratioTex = (a, b) => { const fr = F(a, b), x = val(fr); return '\\frac{' + big(a) + '}{' + big(b) + '} ' + (fr.exactDecimal(6) ? '= ' + String(+x.toFixed(6)) : '\\approx ' + dx(x)); };

  /* ---------------------------------------------------------------- coins */
  const outcomes = n => { const out = []; for (let m = 0; m < 2 ** n; m++) { let s = ''; for (let i = n - 1; i >= 0; i--) s += (m >> i) & 1 ? 'T' : 'H'; out.push(s); } return out; };
  const heads = s => [...s].filter(c => c === 'H').length;
  const coins = (seq, size = 20) => [...seq].map(c => K.coin(c, size)).join('');
  /** "Try" chips: each loads a lecture example or a telling case */
  const tries = (list, load) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }),
    h('div', { class: 'lk-presets' }, list.map(([label, values]) => h('button', { type: 'button', class: 'lk-chip', html: K.rich(label), onclick: () => load(values) }))));

  /** the kit's answer box, allowed to be narrower than its maths (which then scrolls inside it) */
  const answer = (...args) => { const el = flowAnswer(...args); el.style.minWidth = '0'; return el; };

  /** X = heads in the first a of n tosses, Y = heads in the last b: every outcome, the joint table P[x][y], both marginals */
  function jointOf(n, a, b, p) {
    const q = F(1).sub(p);
    const outs = outcomes(n).map(o => { const k = heads(o); return { o, pr: p.pow(k).mul(q.pow(n - k)), x: heads(o.slice(0, a)), y: heads(o.slice(n - b)) }; });
    const P = range(0, a).map(() => range(0, b).map(() => F(0)));
    outs.forEach(r => { P[r.x][r.y] = P[r.x][r.y].add(r.pr); });
    return { outs, P, px: P.map(sum), py: range(0, b).map(j => sum(P.map(row => row[j]))), m: Math.max(0, a + b - n), q };
  }
  const fixPair = v => { v.n = int(v.n, 2, 4, 3); v.a = int(v.a, 1, v.n, Math.min(2, v.n)); v.b = int(v.b, 1, v.n, Math.min(2, v.n)); };
  /** the controls the two-variable topics share: n, a, b and p */
  const pairControls = (s, load) => [
    K.p('Toss a coin $n$ times. $X$ counts the heads in the <b>first $a$</b> tosses and $Y$ the heads in the <b>last $b$</b> tosses. When $a + b > n$, the tosses in the middle count for both.'),
    K.int({ label: 'Number of tosses $n$ (2 to 4)', value: s.v.n, min: 2, max: 4, onChange: v => load({ n: v }) }),
    K.int({ label: '$X$ counts the first $a$ tosses', value: s.v.a, min: 1, max: s.v.n, onChange: v => load({ a: v }) }),
    K.int({ label: '$Y$ counts the last $b$ tosses', value: s.v.b, min: 1, max: s.v.n, onChange: v => load({ b: v }) }),
    K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
  ];
  /** which tosses X and Y count, and the shared ones */
  function tossCard(n, a, b, m) {
    const t = range(1, n);
    return K.card('Which tosses each one counts',
      K.table(['Toss', ...t.map(String)], [['$X$: first ' + a, ...t.map(i => (i <= a ? '✓' : ''))], ['$Y$: last ' + b, ...t.map(i => (i > n - b ? '✓' : ''))]], { rowHead: true }),
      K.p(m ? (m === 1 ? 'Toss ' + a + ' counts' : 'Tosses ' + (n - b + 1) + ' to ' + a + ' count') + ' for both: a head there adds 1 to $X$ <b>and</b> 1 to $Y$. This is what links them.'
        : 'No toss counts for both: $X$ and $Y$ are made from different tosses, and tosses do not affect each other.'));
  }

  /** the joint table as circles (area = chance) around the two means; shaded where (x − E[X])(y − E[Y]) > 0 */
  function bubbles(J, a, b, ex, ey) {
    const f = frame({ x0: -0.5, x1: a + 0.5, y0: -0.5, y1: b + 0.5, xt: range(0, a), yt: range(0, b), xName: 'x: heads in the first ' + a, yName: 'y: heads in the last ' + b, label: 'the joint chances as circles', H: 270 });
    const mx = f.X(ex), my = f.Y(ey), x0 = f.X(-0.5), x1 = f.X(a + 0.5), y0 = f.Y(b + 0.5), y1 = f.Y(-0.5);
    const shade = (x, y, w, hh) => S('rect', { x, y, width: Math.max(0, w), height: Math.max(0, hh), style: 'fill: var(--accent-soft)' });
    f.svg.insertBefore(shade(x0, my, mx - x0, y1 - my), f.svg.firstChild);
    f.svg.insertBefore(shade(mx, y0, x1 - mx, my - y0), f.svg.firstChild);
    [[x1 - 10, y0 + 16, '+'], [x0 + 10, y1 - 8, '+'], [x0 + 10, y0 + 16, '−'], [x1 - 10, y1 - 8, '−']].forEach(([x, y, t]) => f.svg.append(S('text', { x, y, 'text-anchor': 'middle', class: 'axis' }, t)));
    const top = Math.max(...J.P.flat().map(val)) || 1, rmax = 0.45 * Math.min(f.X(1) - f.X(0), f.Y(0) - f.Y(1));
    J.P.forEach((col, i) => col.forEach((v, j) => { if (!v.isZero()) f.svg.append(S('circle', { cx: f.X(i), cy: f.Y(j), r: Math.max(2, rmax * Math.sqrt(val(v) / top)), style: 'fill: var(--accent); fill-opacity: .8' }, S('title', {}, 'x = ' + i + ', y = ' + j + ': ' + v.str()))); }));
    f.svg.append(S('line', { x1: mx, x2: mx, y1: y0, y2: y1, class: 'mark' }), S('line', { x1: x0, x2: x1, y1: my, y2: my, class: 'mark' }));
    return f.wrap;
  }

  /** the mode of Beta(α, β), the p where its density is highest (none when it is flat or highest at both ends) */
  function betaMode(A, B) {
    const one = F(1);
    if (A.cmp(one) > 0 && B.cmp(one) > 0) { const v = A.sub(1).div(A.add(B).sub(2)); return { v, tex: '\\text{mode} = \\frac{\\alpha - 1}{\\alpha + \\beta - 2} = \\frac{' + tx(A.sub(1)) + '}{' + tx(A.add(B).sub(2)) + '} ' + eq(v) }; }
    if (A.eq(one) && B.eq(one)) return { v: null, text: 'The posterior is $\\operatorname{Beta}(1, 1)$, which is flat: every $p$ is equally likely, so there is no single highest point.' };
    if (A.cmp(one) <= 0 && B.cmp(one) <= 0) {
      if (A.eq(one)) return { v: F(1), text: 'With $\\alpha = 1$ and $\\beta < 1$ the density rises all the way to $p = 1$, so the mode is 1.' };
      if (B.eq(one)) return { v: F(0), text: 'With $\\alpha < 1$ and $\\beta = 1$ the density is highest at $p = 0$, so the mode is 0.' };
      return { v: null, text: 'With $\\alpha < 1$ and $\\beta < 1$ the density is U-shaped, highest at both ends $p = 0$ and $p = 1$: there is no single mode.' };
    }
    if (A.cmp(one) <= 0) return { v: F(0), text: 'With $\\alpha \\le 1 < \\beta$ the density only falls from $p = 0$, so the mode is 0.' };
    return { v: F(1), text: 'With $\\beta \\le 1 < \\alpha$ the density only rises towards $p = 1$, so the mode is 1.' };
  }

  REV.lab('coin', {
    /* ---------------------------------------------------------------- joint */
    // ?n=3&a=2&b=2&p=1/2&x=1&y=1   n tosses (2 to 4); X = heads in the first a, Y = heads in the last b (1 ≤ a, b ≤ n);
    //                              p = chance of heads; the cell X = x, Y = y and the distribution of X given Y = y
    joint(el, query, ctx) {
      const s = K.state(ctx, { n: 3, a: 2, b: 2, p: '1/2', x: 1, y: 1 }, query, draw);
      const { controls, out } = K.layout(el);
      const fix = () => { fixPair(s.v); s.v.x = int(s.v.x, 0, s.v.a, 0); s.v.y = int(s.v.y, 0, s.v.b, 0); };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(...pairControls(s, load),
          K.int({ label: 'The cell you ask about: $X = x$', value: s.v.x, min: 0, max: s.v.a, onChange: v => s.set({ x: v }) }),
          K.int({ label: 'and $Y = y$ (also the condition $Y = y$)', value: s.v.y, min: 0, max: s.v.b, onChange: v => s.set({ y: v }) }),
          tries([
            ['Two tosses, $X_1$ and $X_2$ (Stats 2 Week 1.1)', { n: 2, a: 1, b: 1, p: '1/2', x: 1, y: 1 }],
            ['Three tosses, one shared', { n: 3, a: 2, b: 2, p: '1/2', x: 1, y: 1 }],
            ['Same tosses: $X = Y$', { n: 2, a: 2, b: 2, p: '1/2', x: 1, y: 2 }],
            ['No shared toss', { n: 4, a: 2, b: 2, p: '1/2', x: 1, y: 1 }],
            ['Biased coin, $p = \\frac13$', { n: 3, a: 2, b: 2, p: '1/3', x: 2, y: 2 }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        const { n, a, b, x, y } = s.v;
        let p;
        try { p = num(s.v.p, 'The chance of heads', 0, 1); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const J = jointOf(n, a, b, p), cell = J.P[x][y], py = J.py[y], cond = py.isZero() ? null : cell.div(py);
        const xs = range(0, a), ys = range(0, b), prod = (i, j) => J.px[i].mul(J.py[j]);
        const bad = [];
        xs.forEach(i => ys.forEach(j => { if (!J.P[i][j].eq(prod(i, j))) bad.push([i, j]); }));
        out.append(answer('The cell $X = ' + x + ',\\ Y = ' + y + '$ for ' + n + ' tosses with $p = ' + T(p) + '$',
          '\\begin{aligned} P(X=' + x + ',\\ Y=' + y + ') &' + eq(cell) + ' \\\\ P(X=' + x + ' \\mid Y=' + y + ') &' + (cond ? eq(cond) : '\\text{ not defined: } P(Y=' + y + ') = 0') + '\\end{aligned}',
          bad.length ? '$X$ and $Y$ are <b>not independent</b> (see the check at the end).' : '$X$ and $Y$ are <b>independent</b> (see the check at the end).'));
        out.append(tossCard(n, a, b, J.m));

        // every outcome, and the cell asked about
        const inCell = J.outs.filter(r => r.x === x && r.y === y), ex = inCell[0] || J.outs[Math.min(2, J.outs.length - 1)], k = heads(ex.o);
        out.append(K.card('Every outcome, with its $X$ and $Y$',
          flowSteps([
            { text: 'There are $2^{' + n + '} = ' + 2 ** n + '$ outcomes. The tosses do not affect each other, so multiply: an outcome with $k$ heads has chance $p^k(1-p)^{' + n + '-k}$.' + (p.eq(F(1, 2)) ? ' With a fair coin every outcome has the same chance.' : ''),
              tex: 'P(\\text{' + ex.o + '}) = \\left(' + T(p) + '\\right)^{' + k + '}\\left(' + T(J.q) + '\\right)^{' + (n - k) + '} ' + eq(ex.pr) },
            { text: 'Read $X$ and $Y$ off each outcome. In <b>' + ex.o + '</b> the first ' + a + ' tosses, <b>' + ex.o.slice(0, a) + '</b>, have ' + ex.x + ' head' + (ex.x === 1 ? '' : 's') + '; the last ' + b + ', <b>' + ex.o.slice(n - b) + '</b>, have ' + ex.y + '.',
              tex: 'X = ' + ex.x + ',\\qquad Y = ' + ex.y },
            !inCell.length ? { text: 'No outcome gives $X = ' + x + '$ and $Y = ' + y + '$ together, so this cell is 0.', tex: 'P(X=' + x + ',\\ Y=' + y + ') = 0' }
              : inCell.length === 1 ? { text: 'Only <b>' + ex.o + '</b> gives $X = ' + x + '$ and $Y = ' + y + '$ (coloured in the table), so the cell is its chance:', tex: 'P(X=' + x + ',\\ Y=' + y + ') ' + eq(cell) }
                : { text: 'The outcomes with $X = ' + x + '$ and $Y = ' + y + '$ are coloured in the table: ' + inCell.map(r => '<b>' + r.o + '</b>').join(', ') + '. They cannot happen together, so add their chances:',
                  tex: chain('P(X=' + x + ',\\ Y=' + y + ')', '= ' + inCell.map(r => T(r.pr)).join(' + '), eq(cell)) },
          ]),
          picColumn(K.table(['Outcome', 'Chance', '$X$', '$Y$'], J.outs.map(r => [r.o, '$' + TT(r.pr) + '$', String(r.x), String(r.y)]),
            { compact: true, hi: new Set(J.outs.map((r, i) => (r.x === x && r.y === y ? i : -1)).filter(i => i >= 0)) }), J.outs.map(r => coins(r.o, 18)))));

        // the joint table with both marginals
        out.append(K.card('The joint table',
          K.p('Each cell is $P(X = x, Y = y)$, the total chance of its outcomes (the lecture writes $f_{XY}(t_1, t_2)$). $X$ runs across, $Y$ runs down. Add down a column for $P(X = x)$; add along a row for $P(Y = y)$.'),
          K.grid([...ys.map(j => '$y = ' + j + '$'), '$P(X = x)$'], [...xs.map(i => '$x = ' + i + '$'), '$P(Y = y)$'], (r, c, i, j) => {
            if (i <= b && j <= a) return { html: mi(TT(J.P[j][i])), hi: j === x && i === y, dim: J.P[j][i].isZero() };
            if (i <= b) return { html: '<b>' + mi(TT(J.py[i])) + '</b>' };
            if (j <= a) return { html: '<b>' + mi(TT(J.px[j])) + '</b>' };
            return { html: '<b>1</b>' };
          }, { corner: '$Y \\backslash X$' }),
          K.p('Check: the bottom row adds up to $' + J.px.map(T).join(' + ') + ' = ' + T(sum(J.px)) + '$, and so does the right column.')));

        const bx = K.C(a, x).mul(p.pow(x)).mul(J.q.pow(a - x)), by = K.C(b, y).mul(p.pow(y)).mul(J.q.pow(b - y));
        out.append(K.card('Marginals: add a column, add a row',
          flowSteps([
            { text: '$P(X = ' + x + ')$: add down the column $x = ' + x + '$.', tex: chain('P(X=' + x + ')', '= ' + ys.map(j => T(J.P[x][j])).join(' + '), eq(J.px[x])) },
            { text: '$P(Y = ' + y + ')$: add along the row $y = ' + y + '$.', tex: chain('P(Y=' + y + ')', '= ' + xs.map(i => T(J.P[i][y])).join(' + '), eq(py)) },
            { text: 'Check with the binomial: $X$ counts the heads in ' + a + ' independent tosses, so $X \\sim \\Bin(' + a + ', ' + T(p) + ')$; in the same way $Y \\sim \\Bin(' + b + ', ' + T(p) + ')$.',
              tex: '\\begin{aligned} P(X=' + x + ') &= \\tbinom{' + a + '}{' + x + '}\\left(' + T(p) + '\\right)^{' + x + '}\\left(' + T(J.q) + '\\right)^{' + (a - x) + '} \\\\ &' + eq(bx) + (bx.eq(J.px[x]) ? '\\ \\checkmark' : '') +
                ' \\\\[6pt] P(Y=' + y + ') &= \\tbinom{' + b + '}{' + y + '}\\left(' + T(p) + '\\right)^{' + y + '}\\left(' + T(J.q) + '\\right)^{' + (b - y) + '} \\\\ &' + eq(by) + (by.eq(py) ? '\\ \\checkmark' : '') + '\\end{aligned}' },
          ])));

        // conditional distribution of X given Y = y
        if (cond) {
          const ca = xs.map(i => J.P[i][y].div(py)), same = xs.every(i => ca[i].eq(J.px[i]));
          out.append(K.card('Conditional distribution of $X$ given $Y = ' + y + '$',
            flowSteps([
              { text: 'Knowing $Y = ' + y + '$ keeps only the row $y = ' + y + '$ of the table. The row\'s total chance is $P(Y = ' + y + ')$:', tex: 'P(Y=' + y + ') ' + eq(py) },
              { text: 'Divide each cell of that row by its total, so that the new chances add up to 1:', tex: chain('P(X=' + x + ' \\mid Y=' + y + ')', '= \\frac{P(X=' + x + ',\\ Y=' + y + ')}{P(Y=' + y + ')}', '= \\frac{' + TT(cell) + '}{' + TT(py) + '}', eq(cond)) },
              { text: 'Check: the whole conditional distribution adds up to 1.', tex: ca.map(T).join(' + ') + ' = ' + T(sum(ca)) },
            ]),
            K.table(['$x$', '$P(X=x,$<br>$Y=' + y + ')$', '$P(X=x$<br>$\\mid Y=' + y + ')$', '$P(X=x)$'], xs.map(i => ['$' + i + '$', '$' + TT(J.P[i][y]) + '$', '$' + TT(ca[i]) + '$', '$' + TT(J.px[i]) + '$']), { hi: new Set([x]), compact: true }),
            K.p(same ? 'The last two columns are equal: knowing $Y = ' + y + '$ does not change the chances for $X$.'
              : 'The last two columns differ: knowing $Y = ' + y + '$ changes the chances for $X$' + (J.m ? ', because the shared tosses are part of both counts.' : '.'))));
        } else out.append(K.note('$P(Y = ' + y + ') = 0$: this never happens, so there is no distribution of $X$ given $Y = ' + y + '$. Pick another $y$.'));

        // independence, cell by cell
        const [bi, bj] = bad[0] || [x, y], okB = J.P[bi][bj].eq(prod(bi, bj));
        out.append(K.card('Are $X$ and $Y$ independent? Check every cell',
          K.p('Independent means: <b>every</b> cell equals the product of its two marginals. In each cell, on top: $P(X = x, Y = y)$; below: $P(X = x)\\,P(Y = y)$.'),
          K.grid(ys.map(j => '$y = ' + j + '$'), xs.map(i => '$x = ' + i + '$'), (r, c, i, j) => {
            const ok = J.P[j][i].eq(prod(j, i));
            return { html: mi(TT(J.P[j][i])) + '<br>' + mi(TT(prod(j, i))) + ' ' + (ok ? '✓' : '✗'), hi: !ok };
          }, { corner: '$Y \\backslash X$' }),
          flowSteps([
            { text: (bad.length ? 'Take a failing cell, $x = ' : 'Take the cell $x = ') + bi + ', y = ' + bj + '$. Multiply its two marginals:', tex: 'P(X=' + bi + ')\\,P(Y=' + bj + ') = ' + T(J.px[bi]) + ' \\times ' + T(J.py[bj]) + ' = ' + T(prod(bi, bj)) },
            { text: 'Compare with the cell itself:', tex: 'P(X=' + bi + ',\\ Y=' + bj + ') = ' + T(J.P[bi][bj]) + (okB ? ' = ' : ' \\ne ') + T(prod(bi, bj)) },
            { text: bad.length ? bad.length + ' of the ' + (a + 1) * (b + 1) + ' cells fail (marked ✗). One failing cell is enough: $X$ and $Y$ are <b>not independent</b>.'
              : 'All ' + (a + 1) * (b + 1) + ' cells pass, so $X$ and $Y$ are <b>independent</b>.' },
          ]),
          K.p(bad.length ? 'Why: they share ' + J.m + ' toss' + (J.m > 1 ? 'es' : '') + '. A head there raises both counts, so a large $Y$ makes a large $X$ more likely.'
            : J.m ? 'Why: with $p = ' + T(p) + '$ nothing is random (every toss is ' + (p.isZero() ? 'tails' : 'heads') + '), so $X$ and $Y$ are fixed numbers, and fixed numbers are always independent.'
              : 'Why: they are made from different tosses, and tosses do not affect each other.')));
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- covariance */
    // ?n=3&a=2&b=2&p=1/2   the same X and Y as in "joint": X = heads in the first a of n tosses, Y = heads in the last b
    covariance(el, query, ctx) {
      const s = K.state(ctx, { n: 3, a: 2, b: 2, p: '1/2' }, query, draw);
      const { controls, out } = K.layout(el);
      const load = values => { Object.assign(s.v, values); fixPair(s.v); s.set({}, true); ui(); draw(); };
      function ui() {
        fixPair(s.v);
        controls.innerHTML = '';
        controls.append(...pairControls(s, load), tries([
          ['Three tosses, one shared', { n: 3, a: 2, b: 2, p: '1/2' }],
          ['Four tosses, two shared', { n: 4, a: 3, b: 3, p: '1/2' }],
          ['Same tosses: $X = Y$', { n: 3, a: 3, b: 3, p: '1/2' }],
          ['No shared toss', { n: 4, a: 2, b: 2, p: '1/2' }],
          ['Biased coin, $p = 0.9$', { n: 3, a: 2, b: 2, p: '9/10' }],
        ], load));
      }
      function draw() {
        fixPair(s.v);
        out.innerHTML = '';
        const { n, a, b } = s.v;
        let p;
        try { p = num(s.v.p, 'The chance of heads', 0, 1); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const J = jointOf(n, a, b, p), q = J.q, xs = range(0, a), ys = range(0, b), m = J.m;
        const EX = sum(xs.map(i => J.px[i].mul(i))), EY = sum(ys.map(j => J.py[j].mul(j)));
        const cells = [];
        xs.forEach(i => ys.forEach(j => { if (i * j && !J.P[i][j].isZero()) cells.push([i, j]); }));
        const EXY = sum(cells.map(([i, j]) => J.P[i][j].mul(i * j))), cov = EXY.sub(EX.mul(EY));
        const EX2 = sum(xs.map(i => J.px[i].mul(i * i))), EY2 = sum(ys.map(j => J.py[j].mul(j * j)));
        const vx = EX2.sub(EX.mul(EX)), vy = EY2.sub(EY.mul(EY)), vv = vx.mul(vy), root = sqrtF(vv);
        const corrX = root && !root.isZero() ? cov.div(root) : null, corrN = vv.isZero() ? null : val(cov) / Math.sqrt(val(vv));
        const corrTex = corrN == null ? '\\text{ not defined}' : corrX ? eq(corrX) : '\\approx ' + dx(corrN);
        out.append(answer('Covariance and correlation of $X$ and $Y$ (' + n + ' tosses, $p = ' + T(p) + '$)',
          '\\begin{aligned} \\Cov(X, Y) &' + eq(cov) + ' \\\\ \\Corr(X, Y) &' + corrTex + '\\end{aligned}',
          !cov.isZero() ? 'They share ' + m + ' toss' + (m > 1 ? 'es' : '') + ', so they move together: the covariance is positive.'
            : m ? 'With $p = ' + T(p) + '$ nothing varies, so the covariance is 0.' : 'They share no toss, so the covariance is 0.'));
        out.append(tossCard(n, a, b, m));

        out.append(K.card('The joint table, with each cell\'s share of $\\E[XY]$',
          K.p('Top of each cell: $P(X = x, Y = y)$. Below it: $x \\cdot y \\cdot P(X = x, Y = y)$, what the cell adds to $\\E[XY]$.'),
          K.grid(ys.map(j => '$y = ' + j + '$'), xs.map(i => '$x = ' + i + '$'), (r, c, i, j) => ({
            html: mi(TT(J.P[j][i])) + '<br><small>' + mi(i * j + ' \\times ' + T(J.P[j][i]) + ' = ' + T(J.P[j][i].mul(i * j))) + '</small>', hi: i * j > 0 && !J.P[j][i].isZero() }), { corner: '$Y \\backslash X$' })));

        const terms = (vals, w) => vals.map((v, i) => w(i) + ' \\cdot ' + T(v)).join(' + ');
        out.append(K.card('Step by step from the table',
          flowSteps([
            { text: '$\\E[X]$: each value of $X$ times its chance (the bottom row of the joint table), added up.', tex: chain('\\E[X]', '= ' + terms(J.px, i => i), eq(EX)) },
            { text: '$\\E[Y]$: the same with the right column.', tex: chain('\\E[Y]', '= ' + terms(J.py, j => j), eq(EY)) },
            { text: '$\\E[XY]$: every cell, $x \\cdot y$ times its chance. Cells with $x = 0$ or $y = 0$ add nothing, so ' + cells.length + ' cell' + (cells.length === 1 ? '' : 's') + ' count.',
              tex: chain('\\E[XY]', '= ' + (cells.length ? cells.map(([i, j]) => i * j + ' \\cdot ' + T(J.P[i][j])).join(' + ') : '0'), eq(EXY)) },
            { text: 'Covariance: the mean of the product minus the product of the means.', tex: chain('\\Cov(X, Y)', '= \\E[XY] - \\E[X]\\,\\E[Y]', '= ' + T(EXY) + ' - ' + T(EX) + ' \\times ' + T(EY), eq(cov)) },
            { text: 'For the variance of $X$, first $\\E[X^2]$: each value squared, times its chance.', tex: chain('\\E[X^2]', '= ' + terms(J.px, i => i * i), eq(EX2)) },
            { text: 'Then the mean of the square minus the square of the mean:', tex: chain('\\Var(X)', '= \\E[X^2] - (\\E[X])^2', '= ' + T(EX2) + ' - \\left(' + T(EX) + '\\right)^2', eq(vx)) },
            { text: 'The same for $Y$:', tex: chain('\\E[Y^2]', '= ' + terms(J.py, j => j * j), eq(EY2)) },
            { text: 'and', tex: chain('\\Var(Y)', '= ' + T(EY2) + ' - \\left(' + T(EY) + '\\right)^2', eq(vy)) },
            vv.isZero() ? { text: 'The correlation divides by $\\sqrt{\\Var(X)\\,\\Var(Y)}$, which is 0 here (nothing varies), so the correlation is not defined.' }
              : { text: 'Correlation: the covariance divided by both standard deviations. It always lies between $-1$ and $1$.',
                tex: chain('\\Corr(X, Y)', '= \\frac{\\Cov(X, Y)}{\\sqrt{\\Var(X)\\,\\Var(Y)}}', '= \\frac{' + TT(cov) + '}{\\sqrt{' + TT(vx) + ' \\times ' + TT(vy) + '}}', '= \\frac{' + TT(cov) + '}{' + (root ? TT(root) : '\\sqrt{' + TT(vv) + '}') + '}', corrX ? eq(corrX) : '\\approx ' + dx(corrN)) },
          ])));

        out.append(K.card('The picture',
          bubbles(J, a, b, val(EX), val(EY)),
          K.p('Each circle is one cell of the table; its area shows the chance. The dashed lines are $\\E[X] ' + eq(EX) + '$ and $\\E[Y] ' + eq(EY) + '$. In the shaded corners (+) $X$ and $Y$ are both above or both below their means, so $(X - \\E[X])(Y - \\E[Y])$ is positive; in the others (−) it is negative. The covariance is the average of this product, $\\Cov(X, Y) = \\E[(X - \\E[X])(Y - \\E[Y])]$: more weight in the shaded corners gives a positive covariance.')));

        const pq = p.mul(q), viaM = pq.mul(m), rab = sqrtF(F(a * b));
        out.append(K.card('Why sharing tosses makes them move together',
          flowSteps([
            { text: 'Write each toss as $Z_i = 1$ for heads and $0$ for tails. Each count is a sum of tosses:', tex: '\\begin{aligned} X &= ' + zsum(1, a) + ' \\\\ Y &= ' + zsum(n - b + 1, n) + '\\end{aligned}' },
            { text: 'Covariance splits over sums, one pair of tosses at a time:', tex: '\\Cov(X, Y) = \\sum_{i=1}^{' + a + '}\\ \\sum_{j=' + (n - b + 1) + '}^{' + n + '} \\Cov(Z_i, Z_j)' },
            { text: 'Two different tosses are independent, so their covariance is 0. A toss paired with itself gives its variance:', tex: '\\Cov(Z_i, Z_i) = \\Var(Z_i) = p(1-p) = ' + T(p) + ' \\times ' + T(q) + ' = ' + T(pq) },
            { text: 'So only the shared tosses count. There are $m = \\max(0,\\ a + b - n) = ' + m + '$ of them:', tex: '\\Cov(X, Y) = m\\,p(1-p) = ' + m + ' \\times ' + T(pq) + ' = ' + T(viaM) + (viaM.eq(cov) ? '\\ \\checkmark' : '') },
            pq.isZero() ? { text: 'Here $p(1-p) = 0$: nothing varies, so the correlation is not defined.' }
              : { text: 'In the same way $\\Var(X) = a\\,p(1-p)$ and $\\Var(Y) = b\\,p(1-p)$, so $p(1-p)$ cancels in the correlation:',
                tex: chain('\\Corr(X, Y)', '= \\frac{m\\,p(1-p)}{\\sqrt{a\\,p(1-p) \\cdot b\\,p(1-p)}}', '= \\frac{m}{\\sqrt{ab}} = \\frac{' + m + '}{\\sqrt{' + a * b + '}}', (rab ? eq(F(m).div(rab)) : '\\approx ' + dx(m / Math.sqrt(a * b))) + (corrN != null && Math.abs(m / Math.sqrt(a * b) - corrN) < 1e-12 ? '\\ \\checkmark' : '')) },
          ]),
          K.p('A shared head pushes both counts up; a shared tail holds both down. So the counts move together, and here the covariance can only be positive or 0. With no shared toss it is 0, and then $X$ and $Y$ are even independent. (In general a covariance of 0 does not prove independence: Stats 2 Week 3.5.)')));
      }
      ui();
      draw();
    },
    /* ---------------------------------------------------------------- simulate */
    // ?p=1/2&n=100&seed=1   p = chance of heads; n = tosses so far (1 to 100 000); seed = which random tosses (1 to 999 999)
    simulate(el, query, ctx) {
      const s = K.state(ctx, { p: '1/2', n: 100, seed: 1 }, query, draw);
      const { controls, out } = K.layout(el);
      const MAX = 100000;
      const fix = () => { s.v.n = int(s.v.n, 1, MAX, 100); s.v.seed = int(s.v.seed, 1, 999999, 1); };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(
          K.p('Toss a coin again and again. After every toss, work out the <b>proportion of heads</b> so far. The law of large numbers says this proportion settles down near $p$.'),
          K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
          K.int({ label: 'Number of tosses $N$ (up to 100 000)', value: s.v.n, min: 1, max: MAX, onChange: v => load({ n: v }) }),
          h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Toss more' }),
            h('div', { class: 'lk-row' }, [10, 100, 1000, 10000].map(k => btn('+' + k.toLocaleString('en'), () => load({ n: Math.min(MAX, s.v.n + k) }))))),
          K.int({ label: 'Seed: which random tosses (the same seed gives the same tosses)', value: s.v.seed, min: 1, max: 999999, onChange: v => load({ seed: v }) }),
          btn('New random tosses', () => load({ seed: (s.v.seed % 999999) + 1 })),
          tries([
            ['A fair coin, Bernoulli($\\frac12$) as in Stats 2 Week 7.6', { p: '1/2' }],
            ['A biased coin, $p = 0.3$', { p: '3/10' }],
            ['Rare heads, $p = 0.05$, 1000 tosses', { p: '1/20', n: 1000 }],
            ['10 000 tosses', { n: 10000 }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        let p;
        try { p = num(s.v.p, 'The chance of heads', 0, 1); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const N = s.v.n, pv = val(p), q = F(1).sub(p), pq = p.mul(q), rnd = K.rng(s.v.seed);
        const seq = new Uint8Array(N), cum = new Uint32Array(N + 1);
        for (let i = 1; i <= N; i++) { seq[i - 1] = rnd() < pv ? 1 : 0; cum[i] = cum[i - 1] + seq[i - 1]; }
        const hN = cum[N], prop = F(hN, N), d = prop.sub(p), ad = d.cmp(0) < 0 ? d.neg() : d, sdN = Math.sqrt(val(pq) / N);
        out.append(answer('After $N = ' + big(N) + '$ tosses with $p = ' + T(p) + '$: ' + hN.toLocaleString('en') + ' heads',
          '\\begin{aligned} \\hat p_{N} &= ' + ratioTex(hN, N) + ' \\\\ |\\hat p_{N} - p| &' + eq(ad) + '\\end{aligned}',
          'Press “+1,000” or “+10,000” and watch the distance shrink.'));

        const show = Math.min(N, 40);
        out.append(K.card(N > show ? 'The first ' + show + ' of the ' + N.toLocaleString('en') + ' tosses' : 'The ' + N + ' toss' + (N > 1 ? 'es' : ''),
          h('div', { class: 'lk-outcomes', html: coins(Array.from(seq.slice(0, show), v => (v ? 'H' : 'T')).join(''), 22) }),
          K.p('Each toss takes the next random number $u$ between 0 and 1 and is heads when $u < p$, which happens with chance $p$. The seed fixes the random numbers, so the same seed always gives the same tosses.')));

        // the running proportion on a ×10 axis, with the band where it usually stays
        const topN = Math.max(10, N), L10 = Math.log10(topN);
        const f = frame({ x0: 0, x1: L10, y0: 0, y1: 1, xt: range(0, Math.floor(L10)), yt: [0, 0.25, 0.5, 0.75, 1], xName: 'number of tosses N (each mark is ×10)', yName: 'proportion of heads', label: 'the proportion of heads after each toss', xf: v => (10 ** v).toLocaleString('en'), yf: String });
        const band = [], idx = [];
        for (let i = 0; i <= 200; i++) { const n = 10 ** ((L10 * i) / 200), w = 2 * Math.sqrt((pv * (1 - pv)) / n); band.push([n, Math.min(1, pv + w), Math.max(0, pv - w)]); }
        f.svg.append(S('path', { d: path(band.map(([n, u]) => [f.X(Math.log10(n)), f.Y(u)]).concat(band.slice().reverse().map(([n, , l]) => [f.X(Math.log10(n)), f.Y(l)]))) + 'Z', style: 'fill: var(--accent); fill-opacity: .14; stroke: none' }));
        for (let i = 1; i <= Math.min(N, 300); i++) idx.push(i);
        if (N > 300) for (let i = 1; i <= 500; i++) { const k = Math.round(10 ** (Math.log10(300) + ((Math.log10(N) - Math.log10(300)) * i) / 500)); if (k > idx[idx.length - 1]) idx.push(k); }
        f.svg.append(S('line', { x1: f.X(0), x2: f.X(L10), y1: f.Y(pv), y2: f.Y(pv), style: 'stroke: var(--y); stroke-width: 2; stroke-dasharray: 5 4' }));
        f.svg.append(curve(idx.map(k => [f.X(Math.log10(k)), f.Y(cum[k] / k)]), 'stroke: var(--accent)', 'proportion of heads'));
        f.svg.append(S('circle', { cx: f.X(Math.log10(N)), cy: f.Y(hN / N), r: 4, style: 'fill: var(--accent)' }, S('title', {}, 'after ' + N + ' tosses: ' + pd(hN / N))));
        out.append(K.card('The proportion of heads, toss after toss',
          f.wrap,
          legend([['var(--accent)', 'proportion of heads so far, $\\hat p_N$', 'line'], ['var(--y)', '$p = ' + T(p) + '$', 'dash'], ['var(--accent)', 'where it usually stays: $p \\pm 2\\sqrt{p(1-p)/N}$', 'area']]),
          K.p('The first tosses swing the proportion a lot; later ones hardly move it, because each new toss is only one of many. The band narrows as $N$ grows, and the line stays inside it most of the time.')));

        const marks = [10, 100, 1000, 10000].filter(k => k < N).concat([N]);
        out.append(K.card('The distance, checked at every ×10',
          K.table(['$N$', 'heads', '$\\hat p_N$', '$|\\hat p_N - p|$', 'typical: $\\sqrt{\\tfrac{p(1-p)}{N}}$'], marks.map(k => ['$' + big(k) + '$', '$' + big(cum[k]) + '$', '$' + dx(cum[k] / k) + '$', '$' + dx(Math.abs(cum[k] / k - pv)) + '$', '$' + dx(Math.sqrt((pv * (1 - pv)) / k)) + '$']), { hi: new Set([marks.length - 1]), compact: true }),
          K.p('The distance is random, so it does not shrink at every step, but it follows the typical size, which falls by a factor $\\sqrt{10} \\approx 3.16$ at each ×10.')));

        const bound = pq.mul(400).div(N);
        out.append(K.card('Why the proportion settles',
          flowSteps([
            { text: 'Write each toss as $X_i = 1$ for heads and $0$ for tails. The proportion is the average of the tosses:', tex: '\\hat p_{N} = \\frac{X_1 + \\dots + X_N}{N} = ' + ratioTex(hN, N) },
            { text: 'Its distance from $p$ now:', tex: '|\\hat p_{N} - p| = \\left|' + tx(prop) + ' - ' + T(p) + '\\right| ' + eq(ad) },
            { text: 'One toss has mean $p$ and variance $p(1-p)$. An average of $N$ independent tosses keeps the mean:', tex: '\\E[\\hat p_N] = p = ' + T(p) },
            { text: 'and divides the variance by $N$ (Stats 2 Week 7.4):', tex: chain('\\Var(\\hat p_N)', '= \\frac{p(1-p)}{N}', '= \\frac{' + T(pq) + '}{' + big(N) + '}', eq(pq.div(N))) },
            { text: 'So the typical distance, the standard deviation, shrinks like $1/\\sqrt N$: 100 times more tosses, 10 times closer.', tex: '\\SD(\\hat p_N) = \\sqrt{\\frac{p(1-p)}{N}} \\approx ' + dx(sdN) },
            { text: 'Chebyshev\'s inequality turns this into a promise, the <b>weak law of large numbers</b> (Stats 2 Week 7.4). For a distance $\\delta = 0.05$:',
              tex: chain('P(|\\hat p_N - p| \\ge 0.05)', '\\le \\frac{p(1-p)}{N\\,\\delta^2}', '= \\frac{' + T(pq) + '}{' + big(N) + ' \\times 0.05^2}', eq(bound)) },
            { text: bound.cmp(1) >= 0 ? 'That bound is 1 or more, which says nothing yet (every chance is at most 1). It falls like $1/N$, so add tosses and it soon drops below 1, then towards 0.'
              : 'This bound falls like $1/N$, so as $N$ grows the chance of being 0.05 or more away goes to 0: the proportion settles at $p$.' },
          ])));
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- normal-approx */
    // ?n=20&p=1/2&a=8&b=12   X ~ Binomial(n, p) with n from 1 to 1000; P(a ≤ X ≤ b) exactly and by the normal curve (0 ≤ a ≤ b ≤ n)
    'normal-approx'(el, query, ctx) {
      const s = K.state(ctx, { n: 20, p: '1/2', a: 8, b: 12 }, query, draw);
      const { controls, out } = K.layout(el);
      const fix = () => { const v = s.v; v.n = int(v.n, 1, 1000, 20); v.a = int(v.a, 0, v.n, 0); v.b = int(v.b, 0, v.n, v.n); if (v.a > v.b) [v.a, v.b] = [v.b, v.a]; };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(
          K.p('Toss a coin $n$ times and count the heads $X$, so $X \\sim \\Bin(n, p)$. For large $n$ its bar chart looks like a bell, so the normal curve with the same mean and variance can stand in for it.'),
          K.int({ label: 'Number of tosses $n$ (up to 1000)', value: s.v.n, min: 1, max: 1000, onChange: v => load({ n: v }) }),
          K.prob({ label: 'Chance of heads on one toss $p$', value: s.v.p, onChange: v => s.set({ p: v }) }),
          K.int({ label: 'From $a$ heads', value: s.v.a, min: 0, max: s.v.n, onChange: v => load({ a: v, b: Math.max(v, s.v.b) }) }),
          K.int({ label: 'to $b$ heads, for $P(a \\le X \\le b)$', value: s.v.b, min: 0, max: s.v.n, onChange: v => load({ b: v, a: Math.min(v, s.v.a) }) }),
          tries([
            ['100 tosses, 40 to 60 heads (Stats 2 Week 11.2)', { n: 100, p: '1/2', a: 40, b: 60 }],
            ['Only 10 tosses', { n: 10, p: '1/2', a: 4, b: 6 }],
            ['Lopsided: $p = 0.1$, 20 tosses', { n: 20, p: '1/10', a: 0, b: 2 }],
            ['One value: $P(X = 50)$', { n: 100, p: '1/2', a: 50, b: 50 }],
            ['1000 tosses', { n: 1000, p: '1/2', a: 480, b: 520 }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        const { n, a, b } = s.v;
        let p;
        try { p = num(s.v.p, 'The chance of heads', 0, 1); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const q = F(1).sub(p), mu = p.mul(n), v2 = mu.mul(q), sd = Math.sqrt(val(v2)), m = val(mu);
        const B = binom(n, p), exact = B.sum(a, b), ex = val(exact), cnt = b - a + 1;
        const what = a === b ? 'P(X = ' + a + ')' : 'P(' + a + ' \\le X \\le ' + b + ')';
        if (v2.isZero()) {
          out.append(answer('$' + what + '$ for $X \\sim \\Bin(' + n + ', ' + T(p) + ')$', what + ' ' + eq(exact)),
            K.note('With $p = ' + T(p) + '$ every toss gives the same face, so $X = ' + tx(mu) + '$ every time. There is no spread ($\\sigma = 0$), so there is no bell curve to use.'));
          return;
        }
        const lo = a === 0 ? -Infinity : a - 0.5, hi = b === n ? Infinity : b + 0.5;
        const z1 = (lo - m) / sd, z2 = (hi - m) / sd, approx = area(z1, z2);
        const plain = area(a === 0 ? -Infinity : (a - m) / sd, b === n ? Infinity : (b - m) / sd);
        out.append(answer('$' + what + '$ for $X \\sim \\Bin(' + n + ', ' + T(p) + ')$',
          '\\begin{aligned} \\text{exact} &' + eq(exact) + ' \\\\ \\text{normal curve} &\\approx ' + dx(approx) + '\\end{aligned}',
          'The normal curve is off by about ' + pd(Math.abs(approx - ex)) + '.'));

        const wlo = Math.max(0, Math.min(a, Math.floor(m - 4.5 * sd))), whi = Math.min(n, Math.max(b, Math.ceil(m + 4.5 * sd)));
        const ys = range(wlo, whi).map(k => B.pk(k));
        const f = barChart({ lo: wlo, hi: whi, ys, hiK: k => k >= a && k <= b, xName: 'k (number of heads)', yName: 'P(X = k)', label: 'binomial chances with the normal curve', top: Math.max(...ys, phi(0) / sd) * 1.12 });
        const gx = (x0, x1) => { const pts = []; for (let i = 0; i <= 240; i++) { const x = x0 + ((x1 - x0) * i) / 240; pts.push([f.X(x), f.Y(phi((x - m) / sd) / sd)]); } return pts; };
        const l = Math.max(lo, wlo - 0.5), r = Math.min(hi, whi + 0.5);
        if (r > l) f.svg.append(S('path', { d: path([[f.X(l), f.Y(0)], ...gx(l, r), [f.X(r), f.Y(0)]]) + 'Z', style: 'fill: var(--y); fill-opacity: .18; stroke: none' }));
        f.svg.append(curve(gx(wlo - 0.5, whi + 0.5), 'stroke: var(--y)', 'normal curve'));
        out.append(K.card('The bars and the bell',
          f.wrap,
          legend([[BAR, 'exact chance $P(X = k)$', 'bar'], ['var(--pick)', 'the bars you ask about', 'bar'], ['var(--y)', 'normal curve $\\Normal(' + tx(mu) + ',\\ ' + tx(v2) + ')$', 'line'], ['var(--y)', 'the area it uses, $' + (lo === -Infinity ? '-\\infty' : dx(lo)) + '$ to $' + (hi === Infinity ? '\\infty' : dx(hi)) + '$', 'area']]),
          K.p('Each bar has width 1 and stands on $k - \\tfrac12$ to $k + \\tfrac12$, so its area is its chance. The normal approximation replaces the coloured bars by the area under the curve over the same stretch.')));

        const terms = cnt <= 4 ? range(a, b).map(k => dx(B.pk(k))).join(' + ') : null;
        const big1 = (lo === -Infinity ? '-\\infty' : dx(lo)), big2 = (hi === Infinity ? '\\infty' : dx(hi));
        out.append(K.card('Exact, then by the normal curve',
          flowSteps([
            { text: 'The mean of the binomial:', tex: '\\mu = np = ' + n + ' \\times ' + T(p) + ' ' + eq(mu) },
            { text: 'Its variance:', tex: chain('\\sigma^2 = np(1-p)', '= ' + n + ' \\times ' + T(p) + ' \\times ' + T(q), eq(v2)) },
            { text: 'Its standard deviation:', tex: '\\sigma = \\sqrt{' + tx(v2) + '} \\approx ' + dx(sd) },
            { text: 'The exact answer adds the binomial chances for $k = ' + a + (cnt > 1 ? ', \\dots, ' + b : '') + '$ (' + cnt + ' term' + (cnt > 1 ? 's' : '') + '):',
              tex: chain(what, cnt > 1 ? '= \\sum_{k=' + a + '}^{' + b + '} \\binom{' + n + '}{k} p^k (1-p)^{' + n + '-k}' : '= \\binom{' + n + '}{' + a + '} p^{' + a + '} (1-p)^{' + (n - a) + '}', ...(terms && cnt > 1 ? ['\\approx ' + terms] : []), eq(exact)) },
            { text: 'Continuity correction: $X$ takes only whole numbers, and the bar for $k$ covers $k - \\tfrac12$ to $k + \\tfrac12$. So the bars from $' + a + '$ to $' + b + '$ cover $' + big1 + '$ to $' + big2 + '$' +
                (a === 0 ? ' ($0$ is the smallest value of $X$, so take the whole left tail)' : '') + (b === n ? ' ($' + n + '$ is the largest, so take the whole right tail)' : '') + ':',
              tex: what + ' \\approx P(' + big1 + ' \\le Y \\le ' + big2 + '),\\quad Y \\sim \\Normal(' + tx(mu) + ',\\ ' + tx(v2) + ')' },
            { text: 'Standardise the left end: subtract the mean, divide by the standard deviation.', tex: lo === -Infinity ? 'z_1 = -\\infty' : 'z_1 = \\frac{' + dx(lo) + ' - ' + dx(m) + '}{' + dx(sd) + '} \\approx ' + dx(z1) },
            { text: 'The same for the right end:', tex: hi === Infinity ? 'z_2 = \\infty' : 'z_2 = \\frac{' + dx(hi) + ' - ' + dx(m) + '}{' + dx(sd) + '} \\approx ' + dx(z2) },
            { text: 'The area between them under the standard normal curve, from its CDF $\\Phi$:', tex: chain('P(z_1 \\le Z \\le z_2)', '= \\Phi(z_2) - \\Phi(z_1)', '= ' + dx(Phi(z2)) + ' - ' + dx(Phi(z1)), '\\approx ' + dx(approx)) },
            { text: 'Compare with the exact answer:', tex: '|' + dx(approx) + ' - ' + dx(ex) + '| \\approx ' + dx(Math.abs(approx - ex)) },
          ]),
          K.p('Without the correction (from $' + a + '$ to $' + b + '$ exactly) the curve would give $' + dx(plain) + '$, off by $' + dx(Math.abs(plain - ex)) + '$' + (Math.abs(plain - ex) > Math.abs(approx - ex) ? ': the correction helps.' : '.')),
          K.p('A common rule of thumb: the normal curve works well when $np \\ge 5$ and $n(1-p) \\ge 5$. Here $np = ' + dx(m) + '$ and $n(1-p) = ' + dx(n - m) + '$' + (m >= 5 && n - m >= 5 ? ', so it should be close.' : ', so expect it to be rough.')),
          K.note(PHI_NOTE)));
      }
      ui();
      draw();
    },
    /* ---------------------------------------------------------------- exponential */
    // ?lambda=2&t=1&m=10   λ = heads per second on average (more than 0, at most 10); t = the time in seconds (0 to 10);
    //                      m = tosses per second for the worked steps (1, 10, 100 or 1000)
    exponential(el, query, ctx) {
      const s = K.state(ctx, { lambda: '2', t: '1', m: 10 }, query, draw);
      const { controls, out } = K.layout(el);
      const MS = [1, 10, 100, 1000];
      const RAMP = { 1: 'color-mix(in srgb, var(--accent) 30%, var(--bg-elev))', 10: 'color-mix(in srgb, var(--accent) 55%, var(--bg-elev))', 100: 'color-mix(in srgb, var(--accent) 78%, var(--bg-elev))', 1000: 'var(--accent)' };
      const fix = () => { s.v.m = MS.includes(+s.v.m) ? +s.v.m : 10; };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(
          K.p('Toss a coin $m$ times every second, each toss heads with the small chance $p = \\lambda/m$, so that $\\lambda$ heads come per second on average. $T$ is the waiting time until the first head.'),
          K.prob({ label: 'Heads per second on average, $\\lambda$', value: s.v.lambda, min: 0, max: 10, presets: ['1', '2', '1/2', '3'], onChange: v => s.set({ lambda: v }) }),
          K.prob({ label: 'Time $t$ in seconds, for $P(T > t)$', value: s.v.t, min: 0, max: 10, presets: ['1', '1/2', '2', '4'], onChange: v => s.set({ t: v }) }),
          K.seg({ label: 'Tosses per second $m$, for the steps', options: MS.map(v => [v, v.toLocaleString('en')]), value: s.v.m, onChange: v => s.set({ m: +v }) }),
          tries([
            ['$\\lambda = 2$, $t = 4$: $P(X > 4) = e^{-8}$ (Stats 2 Week 4.6)', { lambda: '2', t: '4', m: 1000 }],
            ['One head a second on average', { lambda: '1', t: '1', m: 10 }],
            ['Slow: $\\lambda = \\frac12$, $t = 3$', { lambda: '1/2', t: '3', m: 10 }],
            ['Fast: $\\lambda = 5$, $t = \\frac12$', { lambda: '5', t: '1/2', m: 100 }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        let lam, t;
        try { lam = num(s.v.lambda, 'The rate λ', 0, 10, true); t = num(s.v.t, 'The time t', 0, 10); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const L = val(lam), tv = val(t), m = s.v.m, limit = Math.exp(-L * tv), lt = lam.mul(t);
        const rows = MS.map(mm => {
          const p = lam.div(mm);
          if (p.cmp(1) > 0) return { m: mm, ok: false, p };
          const q = F(1).sub(p), k = Number((t.n * BigInt(mm)) / t.d);                    // ⌊m t⌋ tosses by time t
          const prob = q.isZero() ? (k === 0 ? 1 : 0) : Math.exp(k * Math.log1p(-val(p)));
          return { m: mm, ok: true, p, q, k, exact: k * bits(q.d) < 4000 ? q.pow(k) : null, prob };
        });
        const R = rows.find(r => r.m === m), tail = r => (r.exact ? eq(r.exact) : '\\approx ' + dx(r.prob));
        out.append(answer('$P(T > ' + T(t) + ')$ with $\\lambda = ' + T(lam) + '$ heads per second',
          '\\begin{aligned} m = ' + big(m) + ':\\quad P(T > ' + T(t) + ') &' + (R.ok ? tail(R) : '\\text{ not possible}') + ' \\\\ \\text{limit:}\\quad e^{-\\lambda t} &= e^{-' + tx(lt) + '} \\approx ' + dx(limit) + '\\end{aligned}',
          'As $m$ grows, the coin answer comes closer and closer to $e^{-\\lambda t}$: the exponential distribution.'));

        if (!R.ok) out.append(K.note('With $m = ' + m + '$ toss' + (m > 1 ? 'es' : '') + ' per second the chance of heads would be $p = \\lambda/m = ' + T(R.p) + '$, more than 1, which is impossible. Choose more tosses per second.', 'warn'));
        else {
          const mt = F(m).mul(t);
          out.append(K.card('Step by step, with $m = ' + big(m) + '$ tosses per second',
            flowSteps([
              { text: 'The chance of heads on each toss:', tex: 'p = \\frac{\\lambda}{m} = \\frac{' + T(lam) + '}{' + big(m) + '} ' + eq(R.p) },
              { text: 'Tosses come at $\\frac1m, \\frac2m, \\frac3m, \\dots$ seconds, so by time $t$ there have been $\\lfloor mt \\rfloor$ of them (the whole-number part of $mt$):',
                tex: '\\lfloor mt \\rfloor = \\lfloor ' + big(m) + ' \\times ' + T(t) + ' \\rfloor = ' + (mt.isInt() ? '' : '\\lfloor ' + dx(val(mt)) + ' \\rfloor = ') + R.k },
              { text: '$T > t$ means every one of those tosses was tails. The tosses are independent, so multiply their chances:',
                tex: chain('P(T > ' + T(t) + ')', '= (1-p)^{' + R.k + '}', '= \\left(' + T(R.q) + '\\right)^{' + R.k + '}', tail(R)) },
              { text: 'Now let $m$ grow: more tosses, each less likely to be heads. With $p = \\lambda/m$ and $mt$ tosses,', tex: '\\Bigl(1 - \\frac{\\lambda}{m}\\Bigr)^{mt} = \\Bigl[\\Bigl(1 - \\frac{\\lambda}{m}\\Bigr)^{m}\\Bigr]^{t} \\longrightarrow \\bigl(e^{-\\lambda}\\bigr)^{t} = e^{-\\lambda t}' },
              { text: 'because $(1 - \\frac{x}{m})^m \\to e^{-x}$ as $m \\to \\infty$, the same limit that defines $e$. With your numbers:', tex: 'e^{-\\lambda t} = e^{-' + T(lam) + ' \\times ' + T(t) + '} = e^{-' + tx(lt) + '} \\approx ' + dx(limit) },
              { text: 'The gap between the coin and the limit:', tex: '|' + dx(R.prob) + ' - ' + dx(limit) + '| \\approx ' + dx(Math.abs(R.prob - limit)) },
            ]),
            K.p('The limit is the <b>exponential distribution</b>, $T \\sim \\Exp(\\lambda)$: $P(T > t) = e^{-\\lambda t}$, the CDF is $1 - e^{-\\lambda t}$ and the density is $\\lambda e^{-\\lambda t}$ for $t > 0$ (Stats 2 Week 4.6).')));
        }

        out.append(K.card('The four coins and the limit',
          K.table(['$m$', '$p = \\lambda/m$', 'tosses by $t$', '$P(T > t)$', 'gap from $e^{-\\lambda t}$'],
            rows.map(r => r.ok ? ['$' + big(r.m) + '$', '$' + tx(r.p) + '$', '$' + big(r.k) + '$', '$' + dx(r.prob) + '$', '$' + dx(Math.abs(r.prob - limit)) + '$'] : ['$' + big(r.m) + '$', '$' + tx(r.p) + '$', '—', '$p > 1$: not possible', '—'])
              .concat([['$\\infty$', '$\\to 0$', '$\\infty$', '$e^{-\\lambda t} \\approx ' + dx(limit) + '$', '0']]), { hi: new Set([MS.indexOf(m)]), compact: true }),
          K.p('The gap shrinks as $m$ grows: the waiting time for a head among very fast, very rare tosses is exponential.')));

        // P(T > s) against s for every m, and the limit curve
        const tm = Math.max(tv * 1.25, Math.log(50) / L, 0.5), xt = ticks(0, tm, 5);
        const f = frame({ x0: 0, x1: tm, y0: 0, y1: 1, xt, yt: [0, 0.25, 0.5, 0.75, 1], xName: 'time s (seconds)', yName: 'P(T > s)', label: 'the chance of waiting longer than s', yf: String });
        rows.filter(r => r.ok).forEach(r => {
          const lq = r.q.isZero() ? -Infinity : Math.log1p(-val(r.p)), at = j => (j === 0 ? 1 : Math.exp(j * lq)), pts = [];
          if (r.m * tm <= 400) for (let j = 0; j <= Math.floor(r.m * tm); j++) pts.push([f.X(j / r.m), f.Y(at(j))], [f.X(Math.min(tm, (j + 1) / r.m)), f.Y(at(j))]);
          else for (let i = 0; i <= 400; i++) { const x = (tm * i) / 400; pts.push([f.X(x), f.Y(at(Math.floor(r.m * x + 1e-9)))]); }
          f.svg.append(curve(pts, 'stroke: ' + RAMP[r.m], 'm = ' + r.m));
        });
        const lim = [];
        for (let i = 0; i <= 200; i++) { const x = (tm * i) / 200; lim.push([f.X(x), f.Y(Math.exp(-L * x))]); }
        f.svg.append(curve(lim, 'stroke: var(--y); stroke-width: 2.5; stroke-dasharray: 6 4', 'e^(-λs)'));
        if (tv <= tm) f.svg.append(vline(f, tv, 'stroke: var(--pick); stroke-dasharray: 3 3', 'your t'));
        out.append(K.card('The chance of waiting longer than $s$',
          f.wrap,
          legend(rows.filter(r => r.ok).map(r => [RAMP[r.m], '$m = ' + big(r.m) + '$', 'line']).concat([['var(--y)', 'the limit $e^{-\\lambda s}$', 'dash'], ['var(--pick)', 'your $t = ' + T(t) + '$', 'dash']])),
          K.p('With few tosses per second the chance drops in big steps, once per toss. With many tosses the steps become tiny and the staircase melts into the smooth curve $e^{-\\lambda s}$.')));

        out.append(K.card('Check: the average wait is $1/\\lambda$ for every $m$',
          flowSteps([
            { text: 'The number of tosses up to the first head is geometric, with mean $1/p$:', tex: '\\E[\\text{tosses}] = \\frac{1}{p} = \\frac{m}{\\lambda}' },
            { text: 'Each toss takes $\\frac1m$ of a second, so the mean waiting time is', tex: '\\E[T] = \\frac{1}{m} \\cdot \\frac{m}{\\lambda} = \\frac{1}{\\lambda} = \\frac{1}{' + T(lam) + '} ' + eq(F(1).div(lam)) + '\\text{ s}' },
            { text: 'The $m$ cancels, so it is the same for every $m$, and it matches the mean of $\\Exp(\\lambda)$, which is $\\frac{1}{\\lambda}$. ✓' },
          ])));
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- estimate */
    // ?mode=seq&seq=HTHHT   the tosses as letters (H/T, or 1/0; up to 2000)  or  ?mode=counts&h=7&t=3 (each 0 to 100 000);
    // &c=95   the confidence level of the interval: 90, 95 or 99
    estimate(el, query, ctx) {
      const s = K.state(ctx, { mode: 'seq', seq: 'HTHHTHHTHT', h: 6, t: 4, c: 95 }, query, draw);
      const { controls, out } = K.layout(el);
      const fix = () => { const v = s.v; if (v.mode !== 'counts') v.mode = 'seq'; v.h = int(v.h, 0, 100000, 6); v.t = int(v.t, 0, 100000, 4); v.c = [90, 95, 99].includes(+v.c) ? +v.c : 95; v.seq = String(v.seq); };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(
          K.p('You tossed a coin and want its chance of heads $p$. Enter what you saw: the tosses one by one, or only how many heads and tails.'),
          K.seg({ label: 'How you enter the tosses', options: [['seq', 'Letters H, T'], ['counts', 'Counts']], value: s.v.mode, onChange: v => load({ mode: v }) }),
          ...(s.v.mode === 'seq'
            ? [K.text({ label: 'The tosses: H for heads, T for tails (1 and 0 also work)', value: s.v.seq, placeholder: 'HTTHH…', onChange: v => s.set({ seq: v }) })]
            : [K.int({ label: 'Heads $h$', value: s.v.h, min: 0, max: 100000, onChange: v => s.set({ h: v }) }), K.int({ label: 'Tails $t$', value: s.v.t, min: 0, max: 100000, onChange: v => s.set({ t: v }) })]),
          K.seg({ label: 'Confidence level of the interval', options: [[90, '90%'], [95, '95%'], [99, '99%']], value: s.v.c, onChange: v => s.set({ c: +v }) }),
          tries([
            ['HTHHT: the samples 1, 0, 1, 1, 0 of Stats 2 Week 10.1', { mode: 'seq', seq: 'HTHHT' }],
            ['7 heads in 10 tosses', { mode: 'counts', h: 7, t: 3 }],
            ['60 heads in 100', { mode: 'counts', h: 60, t: 40 }],
            ['600 heads in 1000', { mode: 'counts', h: 600, t: 400 }],
            ['All heads: HHHH', { mode: 'seq', seq: 'HHHH' }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        let h = s.v.h, t = s.v.t, seq = '';
        if (s.v.mode === 'seq') {
          const raw = s.v.seq.toUpperCase().replace(/[\s,;.]/g, ''), badc = /[^HT10]/.exec(raw);
          if (badc) { out.append(K.note('Use only H and T (or 1 and 0): “' + REV.esc(badc[0]) + '” is not a toss.', 'warn')); return; }
          if (raw.length > 2000) { out.append(K.note('That is ' + raw.length + ' tosses. Keep it to 2000, or switch to Counts.', 'warn')); return; }
          seq = raw.replace(/1/g, 'H').replace(/0/g, 'T');
          h = heads(seq); t = seq.length - h;
        }
        const n = h + t;
        if (!n) { out.append(K.note('Enter at least one toss.', 'warn')); return; }
        const c = s.v.c, ph = F(h, n), pv = val(ph), z = PhiInv(0.5 + c / 200), se = Math.sqrt((pv * (1 - pv)) / n);
        const lo = Math.max(0, pv - z * se), hi = Math.min(1, pv + z * se), cut = pv - z * se < 0 || pv + z * se > 1;
        out.append(answer('Your ' + n.toLocaleString('en') + ' toss' + (n > 1 ? 'es' : '') + ': ' + h.toLocaleString('en') + ' heads and ' + t.toLocaleString('en') + ' tails',
          '\\begin{aligned} \\hat p_{\\text{MME}} = \\hat p_{\\text{ML}} &= ' + ratioTex(h, n) + ' \\\\ ' + c + '\\%\\ \\text{interval} &\\approx [' + dx(lo) + ',\\ ' + dx(hi) + ']\\end{aligned}',
          'Both methods estimate $p$ by the proportion of heads.'));

        out.append(K.card(seq ? (n > 60 ? 'Your tosses (the first 60 of ' + n.toLocaleString('en') + ')' : 'Your tosses') : 'Your counts',
          seq ? K.h('div', { class: 'lk-outcomes', html: coins(seq.slice(0, 60), 22) }) : K.h('div', { class: 'lk-row', html: K.coin('H', 26) + mi('\\times ' + big(h)) + '&emsp;' + K.coin('T', 26) + mi('\\times ' + big(t)) }),
          K.p('Write each toss as $x_i = 1$ for heads and $x_i = 0$ for tails. Then $n = ' + big(n) + '$, the number of heads is $h = \\sum x_i = ' + big(h) + '$ and the number of tails is $t = n - h = ' + big(t) + '$.')));

        out.append(K.card('Method of moments',
          flowSteps([
            { text: 'One toss of the model is 1 with chance $p$ and 0 with chance $1-p$. Its mean, the first moment, is', tex: '\\E[X_i] = 1 \\cdot p + 0 \\cdot (1-p) = p' },
            { text: 'The same moment from your data is the sample mean:', tex: '\\bar x = \\frac{x_1 + \\dots + x_n}{n} = ' + ratioTex(h, n) },
            { text: 'Method of moments: set the model\'s moment equal to the data\'s moment, and solve for $p$:', tex: '\\hat p_{\\text{MME}} = \\bar x = ' + ratioTex(h, n) },
          ])));

        const ml = [{ text: 'The likelihood is the chance of exactly your tosses, as a function of $p$. Every head brings a factor $p$, every tail a factor $1-p$:', tex: 'L(p) = p^{' + h + '}(1-p)^{' + t + '}' }];
        if (h && t) ml.push(
          { text: 'Take logs: the peak stays at the same $p$, and powers turn into products:', tex: '\\ell(p) = \\ln L(p) = ' + h + '\\ln p + ' + t + '\\ln(1-p)' },
          { text: 'Differentiate:', tex: "\\ell'(p) = \\frac{" + h + "}{p} - \\frac{" + t + "}{1-p}" },
          { text: 'Set the slope to 0 and solve for $p$:', tex: chain('\\frac{' + h + '}{p} = \\frac{' + t + '}{1-p}', '\\iff ' + h + '(1-p) = ' + t + 'p', '\\iff ' + h + ' = ' + n + 'p', '\\iff p = ' + ratioTex(h, n)) },
          { text: 'It is a peak, not a dip: the second derivative is negative for every $p$.', tex: "\\ell''(p) = -\\frac{" + h + "}{p^2} - \\frac{" + t + "}{(1-p)^2} < 0" },
          { text: 'Check: at $\\hat p$ the slope really is 0.', tex: "\\ell'(" + tx(ph) + ') = \\frac{' + h + '}{' + tx(ph) + '} - \\frac{' + t + '}{' + tx(F(1).sub(ph)) + '} = ' + n + ' - ' + n + ' = 0\\ \\checkmark' });
        else if (!h) ml.push({ text: 'With no heads, $L(p) = (1-p)^{' + t + '}$ only falls as $p$ grows. Its largest value is at the left end, so the slope is never 0 inside and the peak is at $p = 0$:', tex: '\\hat p_{\\text{ML}} = 0 = \\frac{0}{' + n + '}' });
        else ml.push({ text: 'With no tails, $L(p) = p^{' + h + '}$ only grows with $p$. Its largest value is at the right end, $p = 1$:', tex: '\\hat p_{\\text{ML}} = 1 = \\frac{' + n + '}{' + n + '}' });
        ml.push({ text: 'Both methods give the same estimate here: the proportion of heads.' });

        // the likelihood curve with its peak and the interval
        const logL = p => (h ? h * Math.log(p) : 0) + (t ? t * Math.log(1 - p) : 0), top = logL(pv), rel = top < -700;
        const Lp = p => Math.exp(logL(p) - (rel ? top : 0)), ymax = rel ? 1 : Math.exp(top);
        const f = frame({ x0: 0, x1: 1, y0: 0, y1: ymax * 1.12, xt: [0, 0.25, 0.5, 0.75, 1], yt: ticks(0, ymax * 1.12, 4), xName: 'p', yName: rel ? 'L(p) ÷ L(p̂)' : 'L(p)', label: 'the likelihood of p', xf: String });
        const pts = [];
        for (let i = 0; i <= 400; i++) { const p = i / 400; pts.push([f.X(p), f.Y(Lp(p))]); }
        f.svg.append(curve(pts, 'stroke: var(--accent)', 'likelihood'));
        f.svg.append(vline(f, pv, 'stroke: var(--pick); stroke-dasharray: 4 3', 'the peak'), S('circle', { cx: f.X(pv), cy: f.Y(ymax), r: 4.5, style: 'fill: var(--pick)' }));
        const yb = f.Y(ymax * 0.06);
        f.svg.append(S('path', { d: 'M' + f.X(lo) + ' ' + (yb - 5) + 'v10M' + f.X(lo) + ' ' + yb + 'H' + f.X(hi) + 'M' + f.X(hi) + ' ' + (yb - 5) + 'v10', style: 'stroke: var(--z); stroke-width: 2.5; fill: none' }, S('title', {}, c + '% interval')));
        out.append(K.card('Maximum likelihood',
          flowSteps(ml),
          f.wrap,
          legend([['var(--accent)', 'the likelihood $L(p) = p^{' + h + '}(1-p)^{' + t + '}$' + (rel ? ', divided by its peak' : ''), 'line'], ['var(--pick)', 'its peak, at $\\hat p ' + eq(ph) + '$', 'dash'], ['var(--z)', 'the ' + c + '% interval', 'line']]),
          K.p(rel ? 'With this many tosses $L(p)$ is far too small to draw as it is, so the curve shows $L(p)$ divided by its peak value. The shape, and the peak, are the same.' : 'The curve is highest at $\\hat p$: no other value of $p$ makes your tosses as likely.')));

        out.append(K.card('An approximate ' + c + '% confidence interval',
          flowSteps([
            { text: 'For many tosses, $\\hat p$ is close to normal with mean $p$ and variance $\\frac{p(1-p)}{n}$ (central limit theorem). Put $\\hat p$ in place of the unknown $p$ to get the <b>standard error</b>:',
              tex: chain('\\text{SE}', '= \\sqrt{\\frac{\\hat p(1 - \\hat p)}{n}}', '= \\sqrt{\\frac{' + dx(pv) + ' \\times ' + dx(1 - pv) + '}{' + big(n) + '}}', '\\approx ' + dx(se)) },
            { text: 'For ' + c + '%, take the $z$ that leaves ' + c + '% of the normal curve between $-z$ and $z$, so that $\\Phi(z) = ' + (0.5 + c / 200) + '$:', tex: 'z = \\Phi^{-1}(' + (0.5 + c / 200) + ') \\approx ' + z.toFixed(4) },
            { text: 'The margin of error is $z$ standard errors:', tex: 'z \\times \\text{SE} \\approx ' + z.toFixed(4) + ' \\times ' + dx(se) + ' \\approx ' + dx(z * se) },
            { text: 'The interval reaches one margin either side of $\\hat p$' + (cut ? ', cut at 0 and 1 because $p$ is a chance' : '') + ':', tex: chain('\\hat p \\pm z\\,\\text{SE}', '\\approx ' + dx(pv) + ' \\pm ' + dx(z * se), (cut ? '\\to ' : '= ') + '[' + dx(lo) + ',\\ ' + dx(hi) + ']') },
          ]),
          K.p('What “' + c + '%” means: if many people each tossed this coin ' + n.toLocaleString('en') + ' times and each built an interval this way, about ' + c + '% of their intervals would contain the true $p$.'),
          h < 5 || t < 5 ? K.note('Only ' + Math.min(h, t) + ' ' + (h < t ? 'head' + (h === 1 ? '' : 's') : 'tail' + (t === 1 ? '' : 's')) + ': the normal curve is a rough guide here, so this interval is only a rough one' + (h === 0 || t === 0 ? ' (it even has width 0, which cannot be right)' : '') + '. More tosses give a better interval.', 'warn') : null,
          K.note(PHI_NOTE)));
      }
      ui();
      draw();
    },
    /* ---------------------------------------------------------------- bayesian */
    // ?a=1&b=1&h=3&t=2   prior Beta(a, b): a and b more than 0 and at most 1000 (1, 1/2 or 0.5); h heads and t tails seen (0 to 100 000 each)
    bayesian(el, query, ctx) {
      const s = K.state(ctx, { a: '1', b: '1', h: 3, t: 2 }, query, draw);
      const { controls, out } = K.layout(el);
      const fix = () => { s.v.h = int(s.v.h, 0, 100000, 3); s.v.t = int(s.v.t, 0, 100000, 2); };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      const Beta = (x, y) => '\\operatorname{Beta}(' + x + ',\\ ' + y + ')';
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(
          K.p('Before tossing, describe what you believe about $p$ by a <b>prior</b> distribution, $' + Beta('a', 'b') + '$. Then toss, and update the belief with what you saw: the <b>posterior</b>.'),
          K.prob({ label: 'Prior $a$ (acts like $a$ heads seen before)', value: s.v.a, min: 0, max: 1000, presets: ['1', '2', '1/2', '10'], onChange: v => s.set({ a: v }) }),
          K.prob({ label: 'Prior $b$ (acts like $b$ tails seen before)', value: s.v.b, min: 0, max: 1000, presets: ['1', '2', '1/2', '10'], onChange: v => s.set({ b: v }) }),
          K.int({ label: 'Heads seen $h$', value: s.v.h, min: 0, max: 100000, onChange: v => s.set({ h: v }) }),
          K.int({ label: 'Tails seen $t$', value: s.v.t, min: 0, max: 100000, onChange: v => s.set({ t: v }) }),
          tries([
            ['Flat prior $' + Beta(1, 1) + '$ (Stats 2 Week 10.2)', { a: '1', b: '1' }],
            ['The samples 1, 0, 1, 1, 0 (Stats 2 Week 10.1)', { h: 3, t: 2 }],
            ['Sure it is nearly fair: $' + Beta(50, 50) + '$', { a: '50', b: '50' }],
            ['Expect a small $p$: $' + Beta(1, 9) + '$', { a: '1', b: '9' }],
            ['Lots of data: 600 heads, 400 tails', { h: 600, t: 400 }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        let a, b;
        try { a = num(s.v.a, 'The prior a', 0, 1000, true); b = num(s.v.b, 'The prior b', 0, 1000, true); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const h = s.v.h, t = s.v.t, n = h + t, A = a.add(h), B = b.add(t), ab = a.add(b);
        const pm0 = a.div(ab), pm = A.div(A.add(B)), mle = n ? F(h, n) : null, mode = betaMode(A, B);
        const Av = val(A), Bv = val(B), sd = Math.sqrt((Av * Bv) / ((Av + Bv) ** 2 * (Av + Bv + 1)));
        out.append(answer('Posterior after ' + h.toLocaleString('en') + ' heads and ' + t.toLocaleString('en') + ' tails, from the prior $' + Beta(T(a), T(b)) + '$',
          '\\begin{aligned} \\text{posterior} &= ' + Beta(tx(A), tx(B)) + ' \\\\ \\text{mean} &' + eq(pm) + ' \\\\ \\text{mode} &' + (mode.v ? eq(mode.v) : '\\text{: none}') + '\\end{aligned}',
          mle ? 'The maximum likelihood estimate, from the data alone, is $\\hat p_{\\text{ML}} = ' + ratioTex(h, n) + '$.' : 'No tosses yet: the posterior is still the prior.'));

        const st = [
          { text: 'The prior $' + Beta('a', 'b') + '$ has density proportional to $p^{a-1}(1-p)^{b-1}$ for $0 < p < 1$. Its mean is your guess for $p$ before tossing:', tex: chain('\\E[p]', '= \\frac{a}{a + b}', ('\\frac{' + T(a) + '}{' + T(ab) + '}' === pm0.tex() ? '' : '= \\frac{' + T(a) + '}{' + T(ab) + '} ') + eq(pm0)) },
          { text: 'The likelihood of what you saw, $h = ' + h + '$ heads and $t = ' + t + '$ tails:', tex: 'L(p) = p^{h}(1-p)^{t} = p^{' + h + '}(1-p)^{' + t + '}' },
          { text: 'Bayes: the posterior is proportional to prior × likelihood. The powers of $p$ add, and so do the powers of $1 - p$:', tex: chain('\\text{posterior}', '\\propto p^{a-1}(1-p)^{b-1} \\cdot p^{h}(1-p)^{t}', '= p^{(a+h)-1}(1-p)^{(b+t)-1}') },
          { text: 'That is again a Beta density (the Beta prior is <b>conjugate</b> to coin tosses), with $\\alpha = a + h$ and $\\beta = b + t$:', tex: chain(Beta('\\alpha', '\\beta'), '= ' + Beta(T(a) + ' + ' + h, T(b) + ' + ' + t), '= ' + Beta(tx(A), tx(B))) },
          { text: 'The posterior mean, $\\frac{\\alpha}{\\alpha + \\beta}$:', tex: chain('\\E[p \\mid \\text{data}]', '= \\frac{' + tx(A) + '}{' + tx(A) + ' + ' + tx(B) + '}', eq(pm)) },
          mode.tex ? { text: 'The posterior mode, the top of the curve:', tex: mode.tex } : { text: 'The posterior mode, the top of the curve. ' + mode.text },
          mle ? { text: 'The maximum likelihood estimate uses the data alone:', tex: '\\hat p_{\\text{ML}} = \\frac{h}{h + t} = ' + ratioTex(h, n) } : { text: 'With no tosses there is no maximum likelihood estimate, and the posterior equals the prior.' },
        ];
        if (mle) {
          const w = ab.div(ab.add(n)), mix = w.mul(pm0).add(F(1).sub(w).mul(mle));
          st.push(
            { text: 'Check: the posterior mean is a weighted average of the prior mean and $\\hat p_{\\text{ML}}$, with weight $w = \\frac{a + b}{a + b + n}$ on the prior:', tex: chain('w', '= \\frac{' + T(ab) + '}{' + T(ab) + ' + ' + big(n) + '}', eq(w)) },
            { text: 'and', tex: chain('w \\cdot \\tfrac{a}{a+b} + (1 - w)\\,\\hat p_{\\text{ML}}', '= ' + tx(w) + ' \\times ' + tx(pm0) + ' + ' + tx(F(1).sub(w)) + ' \\times ' + tx(mle), eq(mix) + (mix.eq(pm) ? '\\ \\checkmark' : '')) });
        }
        st.push({ text: 'How sure the posterior is: its standard deviation. It shrinks as you toss more.', tex: '\\SD = \\sqrt{\\frac{\\alpha\\beta}{(\\alpha + \\beta)^2(\\alpha + \\beta + 1)}} \\approx ' + dx(sd) });
        out.append(K.card('From prior to posterior', flowSteps(st),
          K.p('The prior counts like $a + b = ' + tx(ab) + '$ extra tosses. With many real tosses its weight $w$ goes to 0, and the posterior mean comes close to $\\hat p_{\\text{ML}}$ (Stats 2 Week 10.2).')));

        // the two densities, with the mean, the mode and the MLE
        const lB = (x, y) => lnGamma(x) + lnGamma(y) - lnGamma(x + y);
        const dens = (x, y) => { const c = lB(x, y); return p => Math.exp((x - 1) * Math.log(p) + (y - 1) * Math.log(1 - p) - c); };
        const prior = dens(val(a), val(b)), post = dens(Av, Bv), ps = [];
        for (let i = 0; i <= 1000; i++) ps.push(Math.min(1 - 1e-9, Math.max(1e-9, i / 1000)));
        let ymax = 0;
        ps.forEach(p => { if (p >= 0.01 && p <= 0.99) ymax = Math.max(ymax, prior(p), post(p)); });
        ymax = (ymax || 1) * 1.1;
        const f = frame({ x0: 0, x1: 1, y0: 0, y1: ymax, xt: [0, 0.25, 0.5, 0.75, 1], yt: ticks(0, ymax, 4), xName: 'p', yName: 'density', label: 'the prior and the posterior', xf: String });
        const pts = g => ps.map(p => [f.X(p), f.Y(Math.min(ymax, g(p)))]);
        f.svg.append(curve(pts(prior), 'stroke: var(--ink-3); stroke-dasharray: 5 4', 'prior'), curve(pts(post), 'stroke: var(--accent); stroke-width: 2.5', 'posterior'));
        f.svg.append(vline(f, val(pm), 'stroke: var(--z)', 'posterior mean'));
        if (mle) f.svg.append(vline(f, val(mle), 'stroke: var(--y); stroke-dasharray: 4 3', 'maximum likelihood'));
        if (mode.v) f.svg.append(S('circle', { cx: f.X(val(mode.v)), cy: f.Y(Math.min(ymax, post(Math.min(1 - 1e-9, Math.max(1e-9, val(mode.v)))))), r: 5, style: 'fill: var(--accent); stroke: var(--bg-elev); stroke-width: 2' }, S('title', {}, 'posterior mode')));
        out.append(K.card('The prior and the posterior',
          f.wrap,
          legend([['var(--ink-3)', 'prior $' + Beta(T(a), T(b)) + '$', 'dash'], ['var(--accent)', 'posterior $' + Beta(tx(A), tx(B)) + '$', 'line'], ['var(--z)', 'posterior mean', 'line'], ...(mle ? [['var(--y)', '$\\hat p_{\\text{ML}}$', 'dash']] : []), ...(mode.v ? [['var(--accent)', 'posterior mode (the top)', 'dot']] : [])]),
          K.p('The data pull the curve towards $\\hat p_{\\text{ML}}$ and make it narrower. A strong prior (large $a + b$) needs more tosses to move.')));
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- test */
    // ?n=100&h=60&p0=1/2&alt=ne&alpha=0.05   n tosses (1 to 1000) with h heads (0 to n); H0: p = p0 (strictly between 0 and 1);
    //                                         alt = ne (p ≠ p0), gt (p > p0) or lt (p < p0); alpha = the level (more than 0, at most 0.5)
    test(el, query, ctx) {
      const s = K.state(ctx, { n: 100, h: 60, p0: '1/2', alt: 'ne', alpha: '0.05' }, query, draw);
      const { controls, out } = K.layout(el);
      const fix = () => { const v = s.v; v.n = int(v.n, 1, 1000, 100); v.h = int(v.h, 0, v.n, Math.round(v.n / 2)); if (!['ne', 'gt', 'lt'].includes(v.alt)) v.alt = 'ne'; };
      const load = values => { Object.assign(s.v, values); fix(); s.set({}, true); ui(); draw(); };
      function ui() {
        fix();
        controls.innerHTML = '';
        controls.append(
          K.p('Is the coin fair? The <b>null hypothesis</b> $H_0: p = p_0$ says the chance of heads is $p_0$. Toss $n$ times and count the heads $h$. Would a count this far from $np_0$ be surprising if $H_0$ were true?'),
          K.int({ label: 'Number of tosses $n$ (up to 1000)', value: s.v.n, min: 1, max: 1000, onChange: v => load({ n: v }) }),
          K.int({ label: 'Heads seen $h$', value: s.v.h, min: 0, max: s.v.n, onChange: v => s.set({ h: v }) }),
          K.prob({ label: '$H_0$: $p = p_0$, with $p_0$', value: s.v.p0, presets: ['1/2', '1/6', '0.3', '0.6'], onChange: v => s.set({ p0: v }) }),
          K.seg({ label: 'The alternative $H_1$', options: [['ne', 'p ≠ p₀'], ['gt', 'p > p₀'], ['lt', 'p < p₀']], value: s.v.alt, onChange: v => s.set({ alt: v }) }),
          K.prob({ label: 'Level $\\alpha$, the false-alarm chance you allow', value: s.v.alpha, min: 0, max: 0.5, presets: ['0.01', '0.05', '0.1'], onChange: v => s.set({ alpha: v }) }),
          tries([
            ['Fair or not? $H_0: p = \\frac12$, 100 tosses (Stats 2 Week 11.2)', { n: 100, h: 60, p0: '1/2', alt: 'ne', alpha: '0.05' }],
            ['Authentic or counterfeit: more heads than $0.5$? (Stats 2 Week 11.1)', { n: 100, h: 58, p0: '1/2', alt: 'gt', alpha: '0.05' }],
            ['Few tosses: 8 heads in 10', { n: 10, h: 8, p0: '1/2', alt: 'ne', alpha: '0.05' }],
            ['$p_0 = \\frac16$: too many heads?', { n: 60, h: 16, p0: '1/6', alt: 'gt', alpha: '0.05' }],
          ], load));
      }
      function draw() {
        fix();
        out.innerHTML = '';
        const { n, h, alt } = s.v;
        let p0, al;
        try {
          p0 = num(s.v.p0, 'p₀', 0, 1);
          if (p0.isZero() || p0.eq(1)) throw new Error('p₀ must be strictly between 0 and 1: with 0 or 1 there is nothing random to test.');
          al = num(s.v.alpha, 'The level α', 0, F(1, 2), true);
        } catch (e) { out.append(K.note(e.message, 'warn')); return; }
        const q0 = F(1).sub(p0), mu0 = p0.mul(n), v0 = mu0.mul(q0), sd0 = Math.sqrt(val(v0)), m0 = val(mu0), A = val(al), z = (h - m0) / sd0;
        const rel = { ne: '\\ne', gt: '>', lt: '<' }[alt];
        const pz = alt === 'ne' ? 2 * Phi(-Math.abs(z)) : alt === 'gt' ? Phi(-z) : Phi(z);
        const Bn = binom(n, p0), up = Bn.sum(h, n), down = Bn.sum(0, h);
        let pex = alt === 'gt' ? up : alt === 'lt' ? down : (up.cmp(down) < 0 ? up : down).mul(2);
        if (pex.cmp(1) > 0) pex = F(1);
        const pexN = val(pex), zc = PhiInv(alt === 'ne' ? 1 - A / 2 : 1 - A);
        const kL = alt === 'gt' ? -1 : Math.floor(m0 - zc * sd0 + 1e-9), kU = alt === 'lt' ? n + 1 : Math.ceil(m0 + zc * sd0 - 1e-9);
        const rej = k => k <= kL || k >= kU, reject = pz <= A, exReject = pexN <= A;
        const size = (kL >= 0 ? Bn.sum(0, kL) : F(0)).add(kU <= n ? Bn.sum(kU, n) : F(0));
        out.append(answer('$H_0: p = ' + T(p0) + '$ against $H_1: p ' + rel + ' ' + T(p0) + '$, with ' + h + ' heads in ' + n + ' tosses',
          '\\begin{aligned} z &\\approx ' + dx(z) + ' \\\\ \\text{p-value} &\\approx ' + dx(pz) + ' \\\\ \\text{exact p-value} &\\approx ' + dx(pexN) + '\\end{aligned}',
          (reject ? '<b>Reject $H_0$</b> at level $\\alpha = ' + dx(A) + '$: the p-value is at most $\\alpha$.' : '<b>Do not reject $H_0$</b> at level $\\alpha = ' + dx(A) + '$: the p-value is more than $\\alpha$.') +
            (reject !== exReject ? ' The exact binomial p-value ' + (exReject ? 'would reject' : 'would not reject') + ': the normal curve and the exact count disagree here (see below).' : '')));

        const tailTex = alt === 'ne'
          ? chain('\\text{p-value}', '= 2\\,\\bigl(1 - \\Phi(|z|)\\bigr)', '= 2\\,\\bigl(1 - \\Phi(' + dx(Math.abs(z)) + ')\\bigr)', '= 2 \\times ' + dx(Phi(-Math.abs(z))), '\\approx ' + dx(pz))
          : alt === 'gt' ? chain('\\text{p-value}', '= P(Z \\ge z) = 1 - \\Phi(' + dx(z) + ')', '\\approx ' + dx(pz)) : chain('\\text{p-value}', '= P(Z \\le z) = \\Phi(' + dx(z) + ')', '\\approx ' + dx(pz));
        out.append(K.card('The $z$-test, step by step',
          flowSteps([
            { text: 'If $H_0$ is true, the number of heads is $X \\sim \\Bin(n, p_0)$. Its mean:', tex: '\\mu_0 = np_0 = ' + n + ' \\times ' + T(p0) + ' ' + eq(mu0) },
            { text: 'and its standard deviation:', tex: chain('\\sigma_0 = \\sqrt{np_0(1-p_0)}', '= \\sqrt{' + n + ' \\times ' + T(p0) + ' \\times ' + T(q0) + '}', '= \\sqrt{' + tx(v0) + '} \\approx ' + dx(sd0)) },
            { text: 'The $z$-statistic: how many standard deviations $h$ lies from $\\mu_0$.', tex: 'z = \\frac{h - \\mu_0}{\\sigma_0} = \\frac{' + h + ' - ' + dx(m0) + '}{' + dx(sd0) + '} \\approx ' + dx(z) },
            { text: 'The p-value: if $H_0$ were true, the chance of a $z$ at least this far out ' + (alt === 'ne' ? 'on either side (so twice one tail)' : alt === 'gt' ? 'on the high side' : 'on the low side') + ', from the normal curve:', tex: tailTex },
            { text: 'Decide: compare the p-value with $\\alpha$.', tex: dx(pz) + (reject ? ' \\le ' : ' > ') + dx(A) + '\\ \\Longrightarrow\\ ' + (reject ? '\\text{reject } H_0' : '\\text{do not reject } H_0') },
            { text: 'The same decision with a critical value: reject when ' + (alt === 'ne' ? '$|z| \\ge z_{\\alpha/2}$' : alt === 'gt' ? '$z \\ge z_{\\alpha}$' : '$z \\le -z_{\\alpha}$') + ', where',
              tex: (alt === 'ne' ? 'z_{\\alpha/2} = \\Phi^{-1}(' + dx(1 - A / 2) + ')' : 'z_{\\alpha} = \\Phi^{-1}(' + dx(1 - A) + ')') + ' \\approx ' + dx(zc) + ',\\qquad ' + (alt === 'ne' ? '|z| \\approx ' + dx(Math.abs(z)) : 'z \\approx ' + dx(z)) + (reject ? '\\ \\text{(beyond it)}' : '\\ \\text{(not beyond it)}') },
          ]),
          K.note(PHI_NOTE)));

        const exactSteps = alt === 'ne' ? [
          { text: 'The normal curve is an approximation. The exact p-value adds binomial chances under $H_0$. The high tail:', tex: chain('P(X \\ge ' + h + ')', '= \\sum_{k=' + h + '}^{' + n + '} \\tbinom{' + n + '}{k} p_0^k (1-p_0)^{' + n + '-k}', eq(up)) },
          { text: 'The low tail:', tex: chain('P(X \\le ' + h + ')', '= \\sum_{k=0}^{' + h + '} \\tbinom{' + n + '}{k} p_0^k (1-p_0)^{' + n + '-k}', eq(down)) },
          { text: 'For $p \\ne p_0$ one common way is to double the smaller tail (at most 1):', tex: chain('\\text{exact p-value}', '= \\min\\bigl(1,\\ 2 \\times ' + dx(Math.min(val(up), val(down))) + '\\bigr)', '\\approx ' + dx(pexN)) },
        ] : [{ text: 'The normal curve is an approximation. The exact p-value adds binomial chances under $H_0$:', tex: chain(alt === 'gt' ? 'P(X \\ge ' + h + ')' : 'P(X \\le ' + h + ')', alt === 'gt' ? '= \\sum_{k=' + h + '}^{' + n + '} \\tbinom{' + n + '}{k} p_0^k (1-p_0)^{' + n + '-k}' : '= \\sum_{k=0}^{' + h + '} \\tbinom{' + n + '}{k} p_0^k (1-p_0)^{' + n + '-k}', eq(pex)) }];
        exactSteps.push({ text: reject === exReject ? 'Both give the same decision at $\\alpha = ' + dx(A) + '$.' : 'Here they disagree at $\\alpha = ' + dx(A) + '$: the normal curve ' + (reject ? 'rejects' : 'does not reject') + ', the exact count ' + (exReject ? 'rejects' : 'does not') + '. With few tosses or a lopsided $p_0$, trust the exact one.' });
        out.append(K.card('The exact binomial tail', flowSteps(exactSteps)));

        // the binomial bars under H0 with the rejection region and the count seen
        const wlo = Math.max(0, Math.min(h, Math.floor(m0 - 5 * sd0))), whi = Math.min(n, Math.max(h, Math.ceil(m0 + 5 * sd0)));
        const ys = range(wlo, whi).map(k => Bn.pk(k));
        const f = barChart({ lo: wlo, hi: whi, ys, hiK: rej, xName: 'k (number of heads)', yName: 'P(X = k) if H0 is true', label: 'the binomial chances under the null hypothesis' });
        f.svg.append(vline(f, h, 'stroke: var(--y); stroke-width: 2.5', 'the count you saw: ' + h));
        const region = (kL >= 0 ? '$X \\le ' + kL + '$' : '') + (kL >= 0 && kU <= n ? ' or ' : '') + (kU <= n ? '$X \\ge ' + kU + '$' : '');
        out.append(K.card('The rejection region on the bars',
          f.wrap,
          legend([[BAR, 'chance of each count if $H_0$ is true', 'bar'], ['var(--pick)', 'rejection region: ' + (region || 'empty'), 'bar'], ['var(--y)', 'what you saw, $h = ' + h + '$', 'line']]),
          K.p(region ? 'The test rejects $H_0$ exactly when the count falls in the coloured bars, ' + region + '. These are the counts with ' + (alt === 'ne' ? '$|z| \\ge ' + dx(zc) + '$' : alt === 'gt' ? '$z \\ge ' + dx(zc) + '$' : '$z \\le -' + dx(zc) + '$') + '.'
            : 'No count is far enough from $\\mu_0$ to reject at this level: with so few tosses the test can never reject.'),
          K.p('<b>Size</b> (the level $\\alpha$): the chance that the test rejects $H_0$ when $H_0$ is true, a false alarm. For these coloured bars it is exactly $P(X \\in R \\mid p_0) ' + eq(size) + '$, close to $\\alpha = ' + dx(A) + '$ but not equal, because counts are whole numbers.'),
          K.p('<b>Power</b>: the chance that the test rejects $H_0$ when $H_1$ is true, so it catches a coin that really is unfair; it depends on the true $p$ and grows with $n$.')));
      }
      ui();
      draw();
    },
  });
})();
