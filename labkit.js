/* Lab kit: what every lab is built from.

   REV.lab('coin', { binomial(el, query, ctx) { … }, … })   registers a lab's topics (ids from labs/labs.json)
   const K = REV.kit;
     K.F(3, 8), K.F.parse('3/8' | '0.375' | '37.5%')     exact fractions (BigInt); .add .sub .mul .div .pow .neg .cmp .eq
                                                          .isZero .isInt .num() .tex() .str() .dec(k)
     K.T(fr) / K.TD(fr)                                   TeX of a fraction; with "≈ decimal" when not exact
     K.C(n, k), K.fact(n)                                 binomial coefficient, factorial (BigInt-based fractions)
     K.state(ctx, defaults, query, redraw)                values from the link (?n=10&p=1/2), kept in the link as they change
     K.layout(el) → { controls, out }                     controls card on top (phone) or left (wide screen)
     K.int / K.prob / K.select / K.seg / K.text / K.check controls (16 px inputs, 44 px targets)
     K.card(title, …) K.answer(label, tex) K.steps([{ text, tex }]) K.table(head, rows, { hi }) K.p(text with $maths$)
     K.bars({ xs, ys, labels, hi, xName, yName }) K.cdf({ xs, ps }) charts (SVG, theme colours)
     K.coin('H'|'T') K.die(v, faces) K.tree(n, p, { hi }) K.grid(rows, cols, cell) small drawings
     K.rng(seed) seeded random numbers for simulations
   Every number on a lab page is worked out from the learner's values, with each step written out. */
(function () {
  'use strict';
  const REV = (window.REV = window.REV || {});
  const h = (...a) => REV.h(...a);
  REV.labs = REV.labs || {};
  REV.lab = (id, topics) => { REV.labs[id] = { topics: Object.assign((REV.labs[id] || {}).topics || {}, topics) }; };

  /* ------------------------------------------------------------------ exact fractions */
  const babs = a => (a < 0n ? -a : a);
  const gcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  class Frac {
    constructor(n, d = 1n) {
      n = BigInt(n); d = BigInt(d);
      if (d === 0n) throw new Error('division by zero');
      if (d < 0n) { n = -n; d = -d; }
      const g = gcd(n, d) || 1n;
      this.n = n / g; this.d = d / g;
    }
    add(b) { b = F(b); return new Frac(this.n * b.d + b.n * this.d, this.d * b.d); }
    sub(b) { b = F(b); return new Frac(this.n * b.d - b.n * this.d, this.d * b.d); }
    mul(b) { b = F(b); return new Frac(this.n * b.n, this.d * b.d); }
    div(b) { b = F(b); if (b.n === 0n) throw new Error('division by zero'); return new Frac(this.n * b.d, this.d * b.n); }
    neg() { return new Frac(-this.n, this.d); }
    pow(k) { k = Number(k); if (k < 0) return F(1).div(this.pow(-k)); return new Frac(this.n ** BigInt(k), this.d ** BigInt(k)); }
    cmp(b) { b = F(b); const x = this.n * b.d - b.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }
    eq(b) { return this.cmp(b) === 0; }
    isZero() { return this.n === 0n; }
    isInt() { return this.d === 1n; }
    num() { return Number(this.n) / Number(this.d); }
    /** "3/8", "-2", for inputs and links */
    str() { return this.d === 1n ? String(this.n) : this.n + '/' + this.d; }
    /** TeX: 3/8 → \frac{3}{8}, −3/8 → -\frac{3}{8} */
    tex() { if (this.d === 1n) return String(this.n); return (this.n < 0n ? '-' : '') + '\\frac{' + babs(this.n) + '}{' + this.d + '}'; }
    /** exact when the decimal terminates within k places, else rounded */
    dec(k = 4) { const x = this.num(); if (!isFinite(x)) return String(x); const r = +x.toFixed(k); return String(r); }
    exactDecimal(k = 6) { let d = this.d; while (d % 2n === 0n) d /= 2n; while (d % 5n === 0n) d /= 5n; if (d !== 1n) return false; return +this.num().toFixed(k) === this.num(); }
  }
  function F(n, d) {
    if (n instanceof Frac) return n;
    if (typeof n === 'number' && d == null) { if (Number.isInteger(n)) return new Frac(n); return F.parse(String(n)); }
    return new Frac(n, d == null ? 1 : d);
  }
  F.parse = s => {
    s = String(s).trim().replace(/\s+/g, '').replace(/−/g, '-');
    if (!s) throw new Error('empty');
    let m;
    if ((m = /^(-?\d+)\/(\d+)$/.exec(s))) return new Frac(m[1], m[2]);
    if ((m = /^(-?)(\d*)\.(\d+)$/.exec(s))) return new Frac((m[1] + (m[2] || '0') + m[3]), 10n ** BigInt(m[3].length));
    if ((m = /^(-?\d+)$/.exec(s))) return new Frac(m[1]);
    if ((m = /^(-?\d*\.?\d+)%$/.exec(s))) return F.parse(m[1]).div(100);
    throw new Error('“' + s + '” is not a number (write 3/8, 0.375 or 37.5%)');
  };
  F.is = x => x instanceof Frac;
  const fact = n => { let r = 1n; for (let i = 2n; i <= BigInt(n); i++) r *= i; return new Frac(r); };
  const C = (n, k) => { n = BigInt(n); k = BigInt(k); if (k < 0n || k > n) return new Frac(0); if (k > n - k) k = n - k; let r = 1n; for (let i = 1n; i <= k; i++) r = (r * (n - k + i)) / i; return new Frac(r); };
  const T = fr => F(fr).tex();
  /** "\frac{3}{8} = 0.375" or "\frac{1}{3} \approx 0.3333" or just "2" */
  const TD = (fr, k = 4) => { fr = F(fr); if (fr.isInt()) return fr.tex(); return fr.tex() + (fr.exactDecimal(k) ? ' = ' : ' \\approx ') + fr.dec(k); };

  /* ------------------------------------------------------------------ maths in text */
  // the same macros as the revision pages (tools/build.mjs)
  const MACROS = {
    '\\R': '\\mathbb{R}', '\\N': '\\mathbb{N}', '\\Z': '\\mathbb{Z}', '\\Q': '\\mathbb{Q}', '\\C': '\\mathbb{C}',
    '\\E': '\\operatorname{E}', '\\Var': '\\operatorname{Var}', '\\Cov': '\\operatorname{Cov}', '\\Corr': '\\operatorname{Corr}',
    '\\SD': '\\operatorname{SD}', '\\Bin': '\\operatorname{Bin}', '\\Pois': '\\operatorname{Poisson}', '\\Geo': '\\operatorname{Geometric}',
    '\\Unif': '\\operatorname{Uniform}', '\\Exp': '\\operatorname{Exp}', '\\Normal': '\\mathcal{N}', '\\rank': '\\operatorname{rank}',
    '\\nullity': '\\operatorname{nullity}', '\\span': '\\operatorname{span}', '\\ker': '\\operatorname{ker}', '\\Im': '\\operatorname{Im}',
    '\\adj': '\\operatorname{adj}', '\\tr': '\\operatorname{tr}',
  };
  const kx = (src, display) => {
    if (!window.katex) return '<code>' + REV.esc(src) + '</code>';
    try { return window.katex.renderToString(src, { displayMode: !!display, throwOnError: false, strict: false, macros: { ...MACROS } }); }
    catch (e) { return '<code>' + REV.esc(src) + '</code>'; }
  };
  /** a display formula that may wrap after "=", "+" or "×" on a narrow phone instead of scrolling sideways
      (a formula with its own line layout — an environment or \\ — stays a normal display) */
  const kxWrap = src => /\\begin\{|\\\\/.test(src) ? kx(src, true) : '<span class="lk-wrap">' + kx('\\displaystyle ' + src, false) + '</span>';
  /** Lab text is trusted code, but it often quotes what came from a link or a text box (error messages, typed lists),
      and anyone can make a link. So the text between the maths keeps the labs' own markup (<b>, <span class>, <code> …)
      and loses anything that could run: script-like elements, on… handlers, javascript: and data: URLs. */
  const RISKY = /<\s*\/?\s*(script|iframe|frame|object|embed|style|link|meta|base|form|img|image|svg|math|video|audio|source|track|input|textarea|select|button|template|noscript|details|marquee)\b|\son[a-z]+\s*=|(javascript|vbscript|data)\s*:/i;
  const DROP = 'script,iframe,frame,object,embed,style,link,meta,base,form,img,image,svg,math,video,audio,source,track,input,textarea,select,button,template,noscript,details,marquee';
  const clean = t => {
    if (!t.includes('<') || !RISKY.test(t)) return t;
    const doc = new DOMParser().parseFromString('<!doctype html><body>' + t, 'text/html');   // inert: nothing runs or loads
    doc.body.querySelectorAll(DROP).forEach(e => e.replaceWith(doc.createTextNode(e.outerHTML)));   // shown as text
    doc.body.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => {
      if (/^on/i.test(a.name) || /^\s*(javascript|vbscript|data)\s*:/i.test(a.value)) e.removeAttribute(a.name);
    }));
    return doc.body.innerHTML;
  };
  /** text with $inline$ and $$display$$ maths → HTML */
  const rich = s => String(s).replace(/\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|([^$]+)/g, (_, d, i, t) =>
    d != null ? '<div class="lk-md">' + kx(d, true) + '</div>' : i != null ? kx(i, false) : clean(t));

  /* ------------------------------------------------------------------ state in the link */
  function state(ctx, defaults, query, redraw) {
    if (ctx && ctx.used) Object.keys(defaults).forEach(k => ctx.used.add(k));  // app.js reports link values no topic reads
    const values = {};
    for (const [k, d] of Object.entries(defaults)) {
      const q = query && query[k] != null && query[k] !== '' ? query[k] : null;
      values[k] = q == null ? d : typeof d === 'number' ? (isFinite(+q) ? +q : d) : q;
    }
    const s = {
      v: values,
      set(patch, quiet) { Object.assign(values, patch); REV.setQuery(ctx.base, values); if (!quiet && redraw) redraw(); },
    };
    return s;
  }

  /* ------------------------------------------------------------------ layout and blocks */
  function layout(el) {
    const controls = h('section', { class: 'lk-controls', 'aria-label': 'Your values' });
    const out = h('div', { class: 'lk-out' });
    el.append(h('div', { class: 'lk' }, controls, out));
    return { controls, out };
  }
  const card = (title, ...kids) => h('section', { class: 'lk-card' }, title ? h('h2', { class: 'lk-h', html: rich(title) }) : null, ...kids);
  const p = (s, cls) => h('p', { class: cls || 'lk-p', html: rich(s) });
  const answer = (label, tex, note) => h('div', { class: 'lk-answer' }, h('div', { class: 'lk-answer-k', html: rich(label) }), h('div', { class: 'lk-answer-v', html: kxWrap(tex) }), note ? h('div', { class: 'lk-answer-n', html: rich(note) }) : null);
  /** numbered steps; each { text, tex } shows the words, then the maths with the learner's numbers */
  const steps = list => h('ol', { class: 'lk-steps' }, list.map(s => h('li', {}, s.text ? h('div', { class: 'lk-step-t', html: rich(s.text) }) : null, s.tex ? h('div', { class: 'lk-step-m', html: kxWrap(s.tex) }) : null)));
  /** head: [html], rows: [[html]]; hi: set of "r,c" or row indexes to highlight */
  function table(head, rows, opt = {}) {
    const hi = opt.hi || new Set();
    const t = h('table', { class: 'lk-table' + (opt.compact ? ' compact' : '') },
      head ? h('thead', {}, h('tr', {}, head.map(x => h('th', { html: rich(x) })))) : null,
      h('tbody', {}, rows.map((r, i) => h('tr', { class: hi.has(i) ? 'hi' : '' }, r.map((x, j) => h(j === 0 && opt.rowHead ? 'th' : 'td', { class: hi.has(i + ',' + j) ? 'hi' : '', html: rich(x) }))))));
    return h('div', { class: 'lk-tbl' }, t);
  }
  const note = (s, kind) => h('div', { class: 'lk-note ' + (kind || '') , html: rich(s) });

  /* ------------------------------------------------------------------ controls */
  let uid = 0;
  const field = (label, control, help) => { const id = 'lk' + (++uid); control.id = control.id || id; return h('div', { class: 'lk-field' }, h('label', { for: control.id, html: rich(label) }), control, help ? h('div', { class: 'lk-help', html: rich(help) }) : null); };
  /** whole number with − and + buttons */
  function int({ label, value, min = 0, max = 100, step = 1, onChange, help }) {
    const input = h('input', { class: 'field lk-num', type: 'number', inputmode: 'numeric', min, max, step, value });
    const clamp = v => Math.max(min, Math.min(max, Math.round(v)));
    const set = v => { v = clamp(v); input.value = v; onChange(v); };
    const minus = h('button', { class: 'lk-step-btn', type: 'button', 'aria-label': 'Less', text: '−', onclick: () => set(+input.value - step) });
    const plus = h('button', { class: 'lk-step-btn', type: 'button', 'aria-label': 'More', text: '+', onclick: () => set(+input.value + step) });
    input.addEventListener('change', () => set(+input.value || min));
    const box = h('div', { class: 'lk-stepper' }, minus, input, plus);
    const f = field(label, input, help);
    f.replaceChild(box, input);
    box.insertBefore(input, plus);
    return f;
  }
  /** a probability or any exact number: typed as 1/6, 0.25 or 25% */
  function prob({ label, value, onChange, presets = ['1/2', '1/3', '1/6', '0.3'], min = 0, max = 1, help }) {
    const input = h('input', { class: 'field lk-frac', type: 'text', inputmode: 'decimal', value, autocomplete: 'off', spellcheck: 'false' });
    const err = h('div', { class: 'lk-err', hidden: true });
    const apply = () => {
      try { const v = F.parse(input.value); if (v.cmp(min) < 0 || v.cmp(max) > 0) throw new Error('Keep it between ' + min + ' and ' + max + '.'); err.hidden = true; input.classList.remove('bad'); onChange(v.str()); }
      catch (e) { err.textContent = e.message; err.hidden = false; input.classList.add('bad'); }
    };
    input.addEventListener('input', apply);
    const chips = presets.length ? h('div', { class: 'lk-presets' }, presets.map(x => h('button', { type: 'button', class: 'lk-chip', text: x, onclick: () => { input.value = x; apply(); } }))) : null;
    const f = field(label, input, help);
    f.append(chips || '', err);
    return f;
  }
  function select({ label, options, value, onChange, help }) {
    const s = h('select', { class: 'field' }, options.map(([v, t]) => h('option', { value: v, selected: String(v) === String(value) ? true : null, text: t })));
    s.addEventListener('change', () => onChange(s.value));
    return field(label, s, help);
  }
  function seg({ label, options, value, onChange, help }) {
    const g = REV.seg(options, value, onChange);
    g.classList.add('lk-seg');
    const f = h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', html: rich(label) }), g, help ? h('div', { class: 'lk-help', html: rich(help) }) : null);
    return f;
  }
  function text({ label, value, placeholder, onChange, help }) {
    const input = h('input', { class: 'field', type: 'text', value, placeholder, autocomplete: 'off', spellcheck: 'false' });
    input.addEventListener('input', () => onChange(input.value));
    return field(label, input, help);
  }
  function check({ label, value, onChange }) {
    const input = h('input', { type: 'checkbox', checked: value ? true : null });
    input.addEventListener('change', () => onChange(input.checked));
    return h('label', { class: 'lk-check' }, input, h('span', { html: rich(label) }));
  }
  const button = (label, onClick, cls) => h('button', { class: 'btn sm ' + (cls || ''), type: 'button', html: rich(label), onclick: onClick });

  /* ------------------------------------------------------------------ charts */
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs, ...kids) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs || {})) if (v != null) el.setAttribute(k, v); kids.flat().forEach(k => k != null && el.append(k.nodeType ? k : document.createTextNode(String(k)))); return el; };
  /** bar chart of values ys (numbers or fractions) at labels xs; hi: indexes to colour */
  function bars({ xs, ys, hi = [], xName = 'x', yName = 'P', fmt, height = 220 }) {
    const vals = ys.map(y => (F.is(y) ? y.num() : y));
    const top = Math.max(1e-9, ...vals);
    const n = xs.length, W = Math.max(320, n * 34 + 60), H = height, L = 44, B = 34, R = 10, Tp = 18;
    const bw = Math.min(42, (W - L - R) / n * 0.7), step = (W - L - R) / n;
    const y = v => H - B - (v / top) * (H - B - Tp);
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': yName + ' for each ' + xName });
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) { const v = top * i / ticks; svg.append(sv('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), class: 'grid' }), sv('text', { x: L - 6, y: y(v) + 4, 'text-anchor': 'end', class: 'tick' }, (Math.round(v * 1000) / 1000).toString())); }
    xs.forEach((x, i) => {
      const cx = L + step * i + step / 2, v = vals[i];
      svg.append(sv('rect', { x: cx - bw / 2, y: y(v), width: bw, height: Math.max(0, H - B - y(v)), rx: 3, class: 'bar' + (hi.includes(i) ? ' hi' : '') }, sv('title', {}, xName + ' = ' + x + ': ' + (fmt ? fmt(ys[i]) : (F.is(ys[i]) ? ys[i].str() : v)))));
      svg.append(sv('text', { x: cx, y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, String(x)));
    });
    svg.append(sv('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle', class: 'axis' }, xName));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** CDF as a staircase: F(x) for the values xs with probabilities ps */
  function cdf({ xs, ps, xName = 'x', mark }) {
    const W = 420, H = 210, L = 44, B = 32, R = 14, Tp = 14;
    const lo = Math.min(...xs) - 1, hi = Math.max(...xs) + 1;
    const X = v => L + (v - lo) / (hi - lo) * (W - L - R), Y = v => H - B - v * (H - B - Tp);
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'CDF of ' + xName });
    [0, 0.25, 0.5, 0.75, 1].forEach(v => svg.append(sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), sv('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v))));
    let cum = 0, prevX = lo;
    xs.forEach((x, i) => {
      svg.append(sv('line', { x1: X(prevX), x2: X(x), y1: Y(cum), y2: Y(cum), class: 'step' }));
      svg.append(sv('circle', { cx: X(x), cy: Y(cum), r: 3.5, class: 'open' }));
      cum += F.is(ps[i]) ? ps[i].num() : ps[i];
      svg.append(sv('circle', { cx: X(x), cy: Y(cum), r: 3.5, class: 'dot' }));
      svg.append(sv('text', { x: X(x), y: H - B + 16, 'text-anchor': 'middle', class: 'tick' }, String(x)));
      prevX = x;
    });
    svg.append(sv('line', { x1: X(prevX), x2: X(hi), y1: Y(cum), y2: Y(cum), class: 'step' }));
    if (mark != null) svg.append(sv('line', { x1: X(mark), x2: X(mark), y1: Y(0), y2: Y(1), class: 'mark' }));
    svg.append(sv('text', { x: (L + W - R) / 2, y: H - 4, 'text-anchor': 'middle', class: 'axis' }, xName));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }

  /* ------------------------------------------------------------------ drawings */
  const coin = (face, size = 28) => '<svg class="lk-coin ' + (face === 'H' ? 'h' : 't') + '" width="' + size + '" height="' + size + '" viewBox="0 0 32 32" aria-label="' + (face === 'H' ? 'heads' : 'tails') + '"><circle cx="16" cy="16" r="14"/><text x="16" y="21" text-anchor="middle">' + face + '</text></svg>';
  const PIPS = { 1: [[16, 16]], 2: [[9, 9], [23, 23]], 3: [[9, 9], [16, 16], [23, 23]], 4: [[9, 9], [23, 9], [9, 23], [23, 23]], 5: [[9, 9], [23, 9], [16, 16], [9, 23], [23, 23]], 6: [[9, 8], [23, 8], [9, 16], [23, 16], [9, 24], [23, 24]] };
  const die = (v, faces = 6, size = 28) => {
    const pips = faces === 6 && PIPS[v] ? PIPS[v].map(([x, y]) => '<circle cx="' + x + '" cy="' + y + '" r="2.6"/>').join('') : '<text x="16" y="21" text-anchor="middle">' + v + '</text>';
    return '<svg class="lk-die" width="' + size + '" height="' + size + '" viewBox="0 0 32 32" aria-label="' + v + '"><rect x="2" y="2" width="28" height="28" rx="7"/>' + pips + '</svg>';
  };
  /** probability tree for n tosses (n ≤ 4) with P(H) = p: each path labelled, hi = set of outcome strings */
  function tree(n, p, opt = {}) {
    p = F(p); const q = F(1).sub(p);
    const leaves = 2 ** n, W = 120 + n * 120, H = Math.max(140, leaves * 30 + 20);
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-tree', role: 'img', 'aria-label': 'tree of ' + n + ' tosses' });
    const hi = opt.hi || new Set();
    const nodeY = (level, idx) => { const span = leaves / 2 ** level; return 10 + (idx * span + span / 2) * ((H - 20) / leaves); };
    const draw = (level, idx, path) => {
      const x = 20 + level * 120, y = nodeY(level, idx);
      if (level === n) {
        svg.append(sv('text', { x: x + 6, y: y + 4, class: 'leaf' + (hi.has(path) ? ' hi' : '') }, path));
        return;
      }
      [['H', p, 0], ['T', q, 1]].forEach(([f, pr, k]) => {
        const ci = idx * 2 + k, x2 = x + 120, y2 = nodeY(level + 1, ci);
        const on = [...hi].some(s => s.startsWith(path + f));
        svg.append(sv('line', { x1: x, y1: y, x2, y2, class: 'edge' + (on ? ' hi' : '') }));
        svg.append(sv('text', { x: (x + x2) / 2, y: (y + y2) / 2 - 4, 'text-anchor': 'middle', class: 'elabel' }, f + ' ' + pr.str()));
        draw(level + 1, ci, path + f);
      });
    };
    draw(0, 0, '');
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** a rows × cols grid (two dice): cell(r, c) → { html, hi } */
  function grid(rows, cols, cell, opt = {}) {
    const t = h('table', { class: 'lk-grid' },
      h('thead', {}, h('tr', {}, h('th', { html: rich(opt.corner || '') }), cols.map(c => h('th', { html: rich(String(c)) })))),
      h('tbody', {}, rows.map((r, i) => h('tr', {}, h('th', { html: rich(String(r)) }), cols.map((c, j) => { const x = cell(r, c, i, j); return h('td', { class: x.hi ? 'hi' : x.dim ? 'dim' : '', html: x.html }); })))));
    return h('div', { class: 'lk-tbl' }, t);
  }
  /** seeded random numbers in [0, 1) */
  const rng = seed => { let a = seed >>> 0 || 1; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };

  REV.kit = { F, Frac, C, fact, T, TD, kx, rich, state, layout, card, p, answer, steps, table, note, int, prob, select, seg, text, check, button, bars, cdf, coin, die, tree, grid, rng, sv, h };
})();
