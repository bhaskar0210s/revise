/* Revise — playground labs. Every value is the learner's to type; every panel redraws instantly.
   W.countLab: permutations and combinations with your own items.
   W.coinLab:  n tosses of a coin with your own P(heads), your own random variable and your own event. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const W = (Lab.W = Lab.W || {});
  const fmtInt = n => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : String(n));

  /* ------------------------------------------------------------ inputs */
  /** Number box + slider, kept in sync. onChange(value) fires on every change. */
  function numField({ label, min, max, step = 1, value, onChange, hint }) {
    let lo = min, hi = max;
    const input = h('input', { class: 'field mono pl-num', type: 'number', min: lo, max: hi, step, value, inputmode: 'numeric' });
    const range = h('input', { class: 'slider pl-range', type: 'range', min: lo, max: hi, step, value });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range));
    const hintEl = h('div', { class: 'pl-hint' });
    if (hint) Lab.setHTML(hintEl, hint);
    wrap.appendChild(hintEl);
    // toPrecision(12) removes float noise such as 0.30000000000000004
    const snap = v => +(Math.round(v / step) * step).toPrecision(12);
    const inRange = v => Math.max(lo, Math.min(hi, v));
    const clamp = v => inRange(snap(v));
    // a typed value keeps its decimals (2.75 stays 2.75); whole-number fields still round to whole numbers
    const typed = v => inRange(Number.isInteger(step) ? snap(v) : +v.toPrecision(12));
    const paint = v => { range.value = v; range.style.setProperty('--pct', (hi > lo ? ((v - lo) / (hi - lo)) * 100 : 0) + '%'); };
    input.addEventListener('input', () => { const v = parseFloat(input.value); if (Number.isFinite(v)) { const c = typed(v); paint(c); onChange(c); } });
    input.addEventListener('change', () => { const raw = parseFloat(input.value); const v = typed(Number.isFinite(raw) ? raw : lo); input.value = v; paint(v); onChange(v); });
    range.addEventListener('input', () => { const v = clamp(parseFloat(range.value)); input.value = v; paint(v); onChange(v); });
    paint(value);
    wrap.set = v => { const c = typed(v); input.value = c; paint(c); };
    wrap.setRange = (a, b, s) => { lo = a; hi = b; input.min = a; input.max = b; range.min = a; range.max = b; if (s) { step = s; input.step = s; range.step = s; } const c = typed(parseFloat(input.value)); input.value = c; paint(c); return c; };
    wrap.hint = html => Lab.setHTML(hintEl, html || '');
    return wrap;
  }

  /** True when f has a short exact decimal (4 places or fewer). */
  function K4exact(f) { return Math.abs(Number(f) * 1e4 - Math.round(Number(f) * 1e4)) < 1e-9; }
  /** Parse "1/3", "0.25", "25%", ".4" into an exact fraction in [0, 1]; null if not valid. */
  function parseProb(s) {
    s = String(s).trim();
    if (!s) return null;
    try {
      let f;
      if (/%$/.test(s)) f = F(s.slice(0, -1).trim()).div(100);
      else f = F(s.startsWith('.') ? '0' + s : s);
      const v = Number(f);
      return v >= 0 && v <= 1 ? f : null;
    } catch (e) { return null; }
  }
  /** Probability box (accepts fractions) + slider. onChange(Frac). */
  /** other: word for 1 − p (default 'Tails' when the label talks about heads); complement: false hides the 1 − p line. */
  function probField({ label, value, onChange, sym = 'p', other, complement = true }) {
    if (other == null) other = /head/i.test(label) ? 'Tails' : '';
    const input = h('input', { class: 'field mono pl-num pl-prob', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal' });
    const range = h('input', { class: 'slider pl-range', type: 'range', min: 0, max: 1, step: 0.01, value: Number(parseProb(value) || 0.5) });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), msg);
    const paint = v => { range.value = v; range.style.setProperty('--pct', v * 100 + '%'); };
    function show(f) {
      input.classList.remove('bad');
      const dec = f.approx || f.d === 1 ? '' : (K4exact(f) ? '= ' : '≈ ') + Lab.fmtDec(Number(f), 4);
      Lab.setHTML(msg, dec + (complement ? '&nbsp; ' + (other ? other + ': ' : '') + Lab.tex('1-' + sym + '=' + (f.approx ? Lab.fmtDec(1 - Number(f), 4) : F(1).sub(f).tex())) : ''));
    }
    input.addEventListener('input', () => {
      const f = parseProb(input.value);
      if (!f) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Type a number from 0 to 1 — for example 1/3, 0.25 or 25%.</span>'); return; }
      paint(Number(f)); show(f); onChange(f);
    });
    range.addEventListener('input', () => { const s = String(parseFloat(range.value)); input.value = s; const f = parseProb(s); paint(Number(f)); show(f); onChange(f); });
    const f0 = parseProb(value) || F(1, 2);
    paint(Number(f0)); show(f0);
    wrap.set = s => { input.value = s; const f = parseProb(s); if (f) { paint(Number(f)); show(f); } };
    return wrap;
  }
  function selectField({ label, options, value, onChange }) {
    const sel = h('select', { class: 'field pl-select' });
    options.forEach(o => sel.appendChild(h('option', { value: o.value, text: o.label })));
    sel.value = value;
    sel.addEventListener('change', () => onChange(sel.value));
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const wrap = h('div', { class: 'pl-field' }, lab, sel);
    wrap.select = sel;
    return wrap;
  }
  function textField({ label, value, placeholder, onChange, mono = true }) {
    const input = h('input', { class: 'field' + (mono ? ' mono' : '') + ' pl-text', type: 'text', value, placeholder: placeholder || '', spellcheck: 'false', autocomplete: 'off' });
    input.addEventListener('input', Lab.debounce(() => onChange(input.value), 120));
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const hintEl = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, input, hintEl);
    wrap.input = input;
    wrap.hint = html => Lab.setHTML(hintEl, html || '');
    return wrap;
  }
  function toggle({ label, value, onChange }) {
    const box = h('input', { type: 'checkbox' });
    box.checked = !!value;
    box.addEventListener('change', () => onChange(box.checked));
    const lab = h('label', { class: 'pl-toggle' }, box, h('span', { class: 'pl-switch' }), h('span', { class: 'pl-tlabel' }));
    Lab.setHTML(lab.lastChild, label);
    return lab;
  }
  function panel(title, sub) {
    const box = h('section', { class: 'pl-panel' });
    const head = h('div', { class: 'pl-panel-head' }, h('h3'));
    Lab.setHTML(head.firstChild, title);
    if (sub) { const s = h('div', { class: 'pl-panel-sub' }); Lab.setHTML(s, sub); head.appendChild(s); }
    const body = h('div', { class: 'pl-panel-body' });
    box.append(head, body);
    box.body = body;
    box.sub = html => { let s = head.querySelector('.pl-panel-sub'); if (!s) { s = h('div', { class: 'pl-panel-sub' }); head.appendChild(s); } Lab.setHTML(s, html); };
    return box;
  }
  /** TeX for a probability: exact fraction when it is exact and readable, else a decimal. */
  function pTex(f) {
    if (typeof f === 'number') return Lab.fmtDec(f, 6);
    if (f.approx || f.d > 1e7) return Lab.fmtDec(Number(f), 6);
    return f.tex();
  }
  function pTexApprox(f) {
    const t = pTex(f);
    if (f instanceof Lab.Frac && !f.approx && f.d !== 1 && f.d <= 1e7) return t + '\\approx ' + Lab.fmtDec(Number(f), 4);
    return t;
  }
  const lab = { numField, probField, selectField, textField, toggle, panel, pTex, parseProb };
  Lab.play = lab;

  /* ================================================================ COIN LAB */
  const COIN_VARS = {
    heads: { label: 'Number of heads', sym: 'X', word: 'number of heads', f: s => [...s].filter(c => c === 'H').length },
    tails: { label: 'Number of tails', sym: 'X', word: 'number of tails', f: s => [...s].filter(c => c === 'T').length },
    first: { label: 'Toss number of the first head (0 = no head)', sym: 'X', word: 'toss number of the first head', f: s => s.indexOf('H') + 1 },
    run: { label: 'Longest run of heads in a row', sym: 'X', word: 'longest run of heads', f: s => Math.max(0, ...s.split('T').map(x => x.length)) },
    switches: { label: 'Number of switches (H→T or T→H)', sym: 'X', word: 'number of switches', f: s => { let k = 0; for (let i = 1; i < s.length; i++) if (s[i] !== s[i - 1]) k++; return k; } },
    diff: { label: 'Heads minus tails', sym: 'X', word: 'heads minus tails', f: s => { const hh = [...s].filter(c => c === 'H').length; return hh - (s.length - hh); } },
  };
  const COIN_EVENTS = [
    { value: 'eq', label: 'X = a' },
    { value: 'ge', label: 'X ≥ a  (at least a)' },
    { value: 'le', label: 'X ≤ a  (at most a)' },
    { value: 'between', label: 'a ≤ X ≤ b' },
    { value: 'toss', label: 'Toss number i is heads' },
    { value: 'pattern', label: 'The sequence matches a pattern' },
    { value: 'all', label: 'Any outcome (whole sample space)' },
  ];
  const COIN_DEF = { n: 3, p: '1/2', x: 'heads', ev: 'eq', a: 2, b: 3, i: 1, pat: 'H?H', not: false, t: null, preset: '' };

  /* ------------------------------------------- lecture examples menu (coin lab and counting lab) */
  /** K.presets (labkit.js) with one <optgroup> per item.group. onClear runs when "— choose an example —" is picked. */
  function lectureMenu(items, onPick, onClear) {
    const menu = Lab.play.presets({ label: 'Lecture examples', items, onPick });
    menu.classList.add('pl-lecture');
    let grp = null, name = null;
    Array.from(menu.select.options).forEach(o => {
      if (o.value === '') return;
      const g = items[+o.value].group;
      if (g !== name) { name = g; grp = h('optgroup', { label: g }); menu.select.appendChild(grp); }
      grp.appendChild(o);
    });
    menu.select.addEventListener('change', () => { if (menu.select.value === '') onClear(); });
    return menu;
  }
  /** Select the example with this key (none for '') and show its source line and note. Returns the key if it exists, else ''. */
  function showLecture(menu, items, key) {
    const k = key ? items.findIndex(it => it.key === key) : -1;
    const it = items[k];
    menu.select.value = it ? String(k) : '';
    Lab.setHTML(menu.querySelector('.pl-hint'), it ? '<span class="pl-src">' + it.source + '</span>' + (it.note ? '<span class="pl-src-note">' + it.note + '</span>' : '') : '');
    return it ? it.key : '';
  }

  /* The professor's coin examples (LABS.md Rule 1). set = the lab state each one loads; the rest comes from COIN_DEF.
     Minutes: lecture transcripts, and the verified presets of labs s1-w07-events, s1-w09-pmf, s1-w11-discrete. */
  const S1 = 'Statistics I · lecture ';
  const CG7 = 'Statistics I · Week 7 · probability and events', CG9 = 'Statistics I · Week 9 · random variables, PMF, CDF',
    CG11 = 'Statistics I · Week 11 · Bernoulli and binomial', CGS2 = 'Statistics II · Weeks 1–2 · several random variables';
  const COIN_PRESETS = [
    { key: 'w7-space', group: CG7, label: 'Two coins: the sample space S',
      source: S1 + '‘Probability – basic definitions’, minutes 15:30–16:30 and 25:00–25:30',
      note: 'Tossing two coins: S = {HH, HT, TH, TT}. Here E is the whole sample space: all 4 outcomes, so P(S) = 4/4 = 1.',
      set: { n: 2, ev: 'all' } },
    { key: 'w7-e1', group: CG7, label: 'Two coins: head on the 1st toss, E₁ = {HH, HT}',
      source: S1 + '‘Probability – events &amp; basic operations on events’, minute 11:50; ‘Probability – random experiment, sample space, events’, minutes 17:20–18:40',
      note: 'E₁ = head on the first toss = {HH, HT} (and E₂ = head on the second toss = {HH, TH}). The lecture names the set; the lab adds its probability: 2 of the 4 equally likely outcomes, 2/4 = 1/2.',
      set: { n: 2, ev: 'toss', i: 1 } },
    { key: 'w7-union', group: CG7, label: 'Two coins: E₁ ∪ E₂, a head on the 1st or the 2nd toss',
      source: S1 + '‘Probability – events &amp; basic operations on events’, minute 11:50',
      note: 'E₁ ∪ E₂ = {HH, HT, TH}. A head on the 1st or on the 2nd toss is the same as at least one head, so here E is X ≥ 1 with X = number of heads: 3 of the 4 outcomes, P = 3/4.',
      set: { n: 2, x: 'heads', ev: 'ge', a: 1 } },
    { key: 'w7-inter', group: CG7, label: 'Two coins: E₁ ∩ E₂, a head on both tosses',
      source: S1 + '‘Probability – events &amp; basic operations on events’, minute 15:10',
      note: 'E₁ ∩ E₂ = {HH}: a head on toss 1 and a head on toss 2, the pattern HH. 1 of the 4 outcomes, P = 1/4.',
      set: { n: 2, ev: 'pattern', pat: 'HH' } },
    { key: 'w7-comp', group: CG7, label: 'Two coins: at least one head, and its complement',
      source: S1 + '‘Probability – events &amp; basic operations on events’, minute 20:30',
      note: 'E = at least one head = {HH, HT, TH}; its complement Eᶜ = both tails = {TT}. “Use the opposite event” is on, so the lab shows Eᶜ: P(Eᶜ) = 1 − 3/4 = 1/4. Switch it off to see P(E) = 3/4.',
      set: { n: 2, x: 'heads', ev: 'ge', a: 1, not: true } },
    { key: 'w7-freq', group: CG7, label: 'One coin: P(head) as a relative frequency',
      source: S1 + '‘Probability – properties of probability’, minutes 07:00–11:00',
      note: 'The lecture counts heads: 10 in 20 tosses (10/20 = 0.5) and 469 in 1,000 tosses (469/1,000 = 0.469). With more and more tosses the fraction settles on P(H) = 1/2. Press “Toss 1,000×” in “Run it for real” below.',
      set: { n: 1, ev: 'toss', i: 1 } },
    { key: 'w9-heads', group: CG9, label: 'Three coins: X = number of heads',
      source: S1 + '‘Random variables – introduction’, minute 38:00',
      note: 'P(X = 0, 1, 2, 3) = 1/8, 3/8, 3/8, 1/8: the PMF below (‘Graph of the probability mass function’ draws it at 20:30). Here E is X = 2: HHT, HTH, THH, so 3/8.',
      set: { n: 3, x: 'heads', ev: 'eq', a: 2 } },
    { key: 'w9-first', group: CG9, label: 'Three coins: X = toss of the first head',
      source: S1 + '‘Random variables – introduction’, minute 43:30',
      note: 'P(X = 1, 2, 3) = 4/8, 2/8, 1/8, and 1/8 for “nil” (no head at all). The lecture writes nil; this lab writes 0 for it. Here E is X = 1: the first toss is a head, 4/8.',
      set: { n: 3, x: 'first', ev: 'eq', a: 1 } },
    { key: 'w9-atmost', group: CG9, label: 'Three coins: at most 1 head, P(X ≤ 1)',
      source: S1 + '‘Cumulative distribution function’, minute 02:30',
      note: 'The question that introduces F(a) = P(X ≤ a). F(1) = P(X = 0) + P(X = 1) = 1/8 + 3/8 = 4/8 = 1/2 (t = 1 in the CDF below).',
      set: { n: 3, x: 'heads', ev: 'le', a: 1, t: 1 } },
    { key: 'w9-atleast', group: CG9, label: 'Three coins: at least 1 head, P(X ≥ 1)',
      source: S1 + '‘Cumulative distribution function’, minute 02:00',
      note: 'P(X ≥ 1) = 1 − P(X = 0) = 1 − F(0) = 1 − 1/8 = 7/8 (t = 0 in the CDF below).',
      set: { n: 3, x: 'heads', ev: 'ge', a: 1, t: 0 } },
    { key: 'w9-one', group: CG9, label: 'One coin: X = 1 for heads, 0 for tails',
      source: S1 + '‘Graph of the probability mass function’, minutes 17:30–19:30',
      note: 'Heads ↦ 1, tails ↦ 0. A fair coin gives P(X = 0) = P(X = 1) = 0.5. Here E is X = 1.',
      set: { n: 1, x: 'heads', ev: 'eq', a: 1 } },
    { key: 'w11-bern', group: CG11, label: 'One toss is a Bernoulli trial (success = head)',
      source: S1 + '‘Binomial distribution – Bernoulli distribution’, minutes 03:00–03:30 and 11:30–12:30',
      note: 'Success = a head, failure = a tail. A fair coin has p = 1/2, “the most uncertain” Bernoulli trial. X = number of heads in one toss, so P(X = 1) = p: change p and watch it follow.',
      set: { n: 1, x: 'heads', ev: 'eq', a: 1 } },
    { key: 'w11-bin3', group: CG11, label: 'Three tosses: X ~ Binomial(3, 1/2)',
      source: S1 + '‘Binomial distribution – distribution of the binomial random variable’, minutes 01:30–05:30',
      note: 'P(X = i) = C(3, i)(1/2)ⁱ(1/2)³⁻ⁱ gives 1/8, 3/8, 3/8, 1/8 for i = 0, 1, 2, 3. Here E is X = 1: C(3, 1)(1/2)(1/2)² = 3/8.',
      set: { n: 3, x: 'heads', ev: 'eq', a: 1 } },
    { key: 'w11-brush', group: CG11, label: 'Toothbrushes, pack of 3, each good with p = 0.9',
      source: S1 + '‘Binomial distribution – modelling situations as binomial’, minutes 01:00–08:30',
      note: '“This resembles the toss of a coin 3 times” (04:00), with unequal chances: heads = a good brush, p = 0.9. A customer complains when more than 1 brush is defective, that is X ≤ 1 good: 0.001 + 0.027 = 0.028.',
      set: { n: 3, p: '0.9', x: 'heads', ev: 'le', a: 1 } },
    { key: 'w11-ten', group: CG11, label: 'Ten tosses, 6 heads expected: P(8 heads)',
      source: S1 + '‘Binomial distribution – expectation and variance of the binomial random variable’, minutes 08:30–11:30',
      note: 'E(X) = np = 6 with n = 10 gives p = 6/10 = 0.6. P(X = 8) = C(10, 8)(0.6)⁸(0.4)² = 45 × 0.01679616 × 0.16 ≈ 0.1209; the lecture rounds it to 0.121.',
      set: { n: 10, p: '0.6', x: 'heads', ev: 'eq', a: 8 } },
    { key: 's2-x1', group: CGS2, label: 'Three tosses: X₁ = 1 (the 1st toss is a head)',
      source: 'Statistics II · lecture L1.1 ‘Joint PMF of two discrete random variables’, minutes 1–5',
      note: 'X₁, X₂, X₃ are the indicators of heads on tosses 1, 2, 3, and {X₁ = 1} is an event: 4 of the 8 outcomes, P = 1/2. L1.6 (minutes 3–5) gets the same f<sub>X₁</sub>(1) = 4 × 1/8 = 1/2 by adding 4 rows of the joint PMF.',
      set: { n: 3, ev: 'toss', i: 1 } },
    { key: 's2-cell', group: CGS2, label: 'Two tosses: X₁ = 1 and X₂ = 1 (one joint PMF cell)',
      source: 'Statistics II · lecture L1.1 ‘Joint PMF of two discrete random variables’, minutes 20–23',
      note: 'f<sub>X₁X₂</sub>(1, 1) = P(X₁ = 1, X₂ = 1) = 1/2 × 1/2 = 1/4, and every cell of the 2 × 2 table is 1/4. The pattern HH is the cell (1, 1). L1.2 (minutes 4–7) adds a column: f<sub>X₁</sub>(1) = 1/4 + 1/4 = 1/2.',
      set: { n: 2, ev: 'pattern', pat: 'HH' } },
    { key: 's2-row', group: CGS2, label: 'Three tosses: one row (1, 0, 1) of the joint PMF',
      source: 'Statistics II · lecture L1.5 ‘Joint PMF of more than two discrete random variables’, minutes 3–4',
      note: 'Each of the 8 rows (t₁, t₂, t₃) has 1/2 × 1/2 × 1/2 = 1/8; the pattern HTH is the row (1, 0, 1). L2.2 (minutes 2–3): every row is 1/8 = f<sub>X₁</sub> · f<sub>X₂</sub> · f<sub>X₃</sub>, so X₁, X₂, X₃ are independent.',
      set: { n: 3, ev: 'pattern', pat: 'HTH' } },
  ];

  W.coinLab = function () {
    const st = Object.assign({}, COIN_DEF, Lab.store.get('lab:coins', {}));
    let root, ctl = {}, P = {}, sim = null, data = null;
    const save = () => Lab.store.set('lab:coins', st);
    const self = { mount(el) { root = el; build(); } };
    /** A control was changed by hand: the loaded lecture example no longer describes the lab. */
    function touched() { if (!st.preset) return; st.preset = ''; showLecture(ctl.pre, COIN_PRESETS, ''); }
    /** Load a lecture example: the lab state, then every control through its own set/value. */
    function applyPreset(it) {
      Object.assign(st, COIN_DEF, it.set, { preset: it.key });
      ctl.n.set(st.n);
      ctl.p.set(st.p);
      ctl.x.select.value = st.x;
      ctl.ev.select.value = st.ev;
      ctl.pat.input.value = st.pat;
      ctl.not.querySelector('input').checked = !!st.not;
      syncEventInputs();
      showLecture(ctl.pre, COIN_PRESETS, st.preset);
      afterN();
    }

    function compute() {
      const n = st.n;
      const p = parseProb(st.p) || F(1, 2);
      const q = F(1).sub(p);
      const V = COIN_VARS[st.x];
      const outs = [];
      for (let m = 0; m < 1 << n; m++) {
        let s = '';
        for (let k = n - 1; k >= 0; k--) s += ((m >> k) & 1) ? 'T' : 'H';
        const hh = [...s].filter(c => c === 'H').length;
        outs.push({ s, h: hh, prob: p.pow(hh).mul(q.pow(n - hh)), x: V.f(s) });
      }
      const xs = [...new Set(outs.map(o => o.x))].sort((a, b) => a - b);
      const pat = (st.pat || '').toUpperCase().replace(/[^HT?*]/g, '').replace(/\*/g, '?').padEnd(n, '?').slice(0, n);
      const test = o => {
        switch (st.ev) {
          case 'eq': return o.x === st.a;
          case 'ge': return o.x >= st.a;
          case 'le': return o.x <= st.a;
          case 'between': return o.x >= Math.min(st.a, st.b) && o.x <= Math.max(st.a, st.b);
          case 'toss': return o.s[st.i - 1] === 'H';
          case 'pattern': return [...pat].every((c, k) => c === '?' || c === o.s[k]);
          default: return true;
        }
      };
      outs.forEach(o => { o.inE = st.not ? !test(o) : test(o); });
      const pE = F.sum(outs.filter(o => o.inE).map(o => o.prob));
      const fair = p.eq(F(1, 2));
      return { n, p, q, V, outs, xs, pat, pE, fair, m: outs.filter(o => o.inE).length };
    }

    function eventWords(d) {
      const X = 'X';
      const base = {
        eq: Lab.tex(X + '=' + st.a),
        ge: Lab.tex(X + '\\ge ' + st.a),
        le: Lab.tex(X + '\\le ' + st.a),
        between: Lab.tex(Math.min(st.a, st.b) + '\\le ' + X + '\\le ' + Math.max(st.a, st.b)),
        toss: 'toss ' + st.i + ' is heads',
        pattern: 'the sequence matches <code>' + Lab.esc(d.pat) + '</code> (<code>?</code> = H or T)',
        all: 'any outcome',
      }[st.ev];
      return (st.not ? '<b>NOT</b> (' + base + ')' : base);
    }

    function build() {
      Lab.clear(root);
      root.classList.add('pl-lab', 'coin-lab');
      const side = h('aside', { class: 'pl-controls' });
      const main = h('div', { class: 'pl-main' });
      root.append(side, main);

      ctl.pre = lectureMenu(COIN_PRESETS, applyPreset, () => { st.preset = ''; save(); });
      side.appendChild(ctl.pre);
      st.preset = showLecture(ctl.pre, COIN_PRESETS, st.preset);

      side.appendChild(h('div', { class: 'pl-group-title', text: '1 · Your coin' }));
      ctl.n = numField({ label: 'Number of tosses ' + Lab.tex('n'), min: 1, max: 10, value: st.n, onChange: v => { touched(); st.n = v; afterN(); } });
      ctl.p = probField({ label: 'Chance of heads on one toss ' + Lab.tex('p'), value: st.p, onChange: f => { touched(); st.p = ctl.p.querySelector('input').value; draw(); } });
      const presets = h('div', { class: 'pl-chips' });
      ['1/2', '1/3', '2/3', '0.1', '0.9'].forEach(v => presets.appendChild(Lab.button(v === '1/2' ? 'fair ½' : v, () => { touched(); ctl.p.set(v); st.p = v; draw(); }, 'btn xs')));
      side.append(ctl.n, ctl.p, presets);

      side.appendChild(h('div', { class: 'pl-group-title', text: '2 · Your random variable' }));
      ctl.x = selectField({ label: Lab.tex('X') + ' reads each outcome and gives', options: Object.entries(COIN_VARS).map(([k, v]) => ({ value: k, label: v.label })), value: st.x, onChange: v => { touched(); st.x = v; draw(); } });
      side.appendChild(ctl.x);

      side.appendChild(h('div', { class: 'pl-group-title', text: '3 · Your event' }));
      ctl.ev = selectField({ label: 'Event ' + Lab.tex('E'), options: COIN_EVENTS, value: st.ev, onChange: v => { touched(); st.ev = v; syncEventInputs(); draw(); } });
      ctl.a = numField({ label: Lab.tex('a'), min: -10, max: 10, value: st.a, onChange: v => { touched(); st.a = v; draw(); } });
      ctl.b = numField({ label: Lab.tex('b'), min: -10, max: 10, value: st.b, onChange: v => { touched(); st.b = v; draw(); } });
      ctl.i = numField({ label: 'Toss number ' + Lab.tex('i'), min: 1, max: st.n, value: Math.min(st.i, st.n), onChange: v => { touched(); st.i = v; draw(); } });
      ctl.pat = textField({ label: 'Pattern (H, T, and ? for "either")', value: st.pat, placeholder: 'e.g. H?T', onChange: v => { touched(); st.pat = v; draw(); } });
      ctl.not = toggle({ label: 'Use the opposite event (NOT ' + Lab.tex('E') + ')', value: st.not, onChange: v => { touched(); st.not = v; draw(); } });
      side.append(ctl.ev, ctl.a, ctl.b, ctl.i, ctl.pat, ctl.not);
      ctl.reset = Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set('lab:coins', {}); Object.assign(st, COIN_DEF); build(); }, 'btn ghost sm');
      side.appendChild(h('div', { class: 'pl-reset' }, ctl.reset));

      P.answer = h('div', { class: 'pl-answer' });
      P.space = panel('The sample space, sorted by your ' + Lab.tex('X'));
      P.calc = panel('How ' + Lab.tex('P(E)') + ' is computed, with your numbers');
      P.dist = panel('The PMF of your ' + Lab.tex('X'), 'Full bar = ' + Lab.tex('P(X=x)') + '. Violet part = the outcomes inside ' + Lab.tex('E') + '.');
      P.cdf = panel('The CDF of your ' + Lab.tex('X'), Lab.tex('F(t)=P(X\\le t)') + ': the total probability of all values up to ' + Lab.tex('t') + '. It is a staircase: at each value ' + Lab.tex('x') + ' it jumps up by ' + Lab.tex('P(X=x)') + '.');
      P.tree = panel('The probability tree', 'Multiply along a path; add the paths that land in ' + Lab.tex('E') + '.');
      P.sim = panel('Run it for real', 'Toss the coins many times and watch the fraction of times ' + Lab.tex('E') + ' happens settle on ' + Lab.tex('P(E)') + '.');
      main.append(P.answer, P.space, P.calc, P.dist, P.cdf, P.tree, P.sim);
      buildSim();
      syncEventInputs();
      afterN();
    }
    function syncEventInputs() {
      const ev = st.ev;
      ctl.a.hidden = !['eq', 'ge', 'le', 'between'].includes(ev);
      ctl.b.hidden = ev !== 'between';
      ctl.i.hidden = ev !== 'toss';
      ctl.pat.hidden = ev !== 'pattern';
    }
    function afterN() {
      ctl.i.setRange(1, st.n);
      st.i = Math.max(1, Math.min(st.n, st.i));
      ctl.i.set(st.i);
      ctl.a.setRange(-st.n, st.n); ctl.b.setRange(-st.n, st.n);
      st.a = Math.max(-st.n, Math.min(st.n, st.a)); st.b = Math.max(-st.n, Math.min(st.n, st.b));
      ctl.a.set(st.a); ctl.b.set(st.b);
      draw();
    }

    function draw() {
      save();
      data = compute();
      const d = data;
      // range hints for a, b
      ctl.a.hint('Possible values of ' + Lab.tex('X') + ': ' + Lab.tex('\\{' + d.xs.join(',') + '\\}'));
      ctl.b.hint('');
      if (st.ev === 'pattern') ctl.pat.hint('Read as <code>' + Lab.esc(d.pat) + '</code> for ' + d.n + ' tosses.');
      drawAnswer(d); drawSpace(d); drawCalc(d); drawDist(d); drawCdf(d); drawTree(d); resetSim();
    }

    function drawAnswer(d) {
      const N = 1 << d.n;
      P.answer.innerHTML = '';
      const ev = h('div', { class: 'pl-ans-ev' });
      Lab.setHTML(ev, 'Your event ' + Lab.tex('E') + ': ' + eventWords(d) + ', where ' + Lab.tex('X') + ' = ' + COIN_VARS[st.x].word + '.');
      const big = h('div', { class: 'pl-ans-big', html: Lab.tex('P(E)=' + pTexApprox(d.pE), true) });
      const sub = h('div', { class: 'pl-ans-sub' });
      Lab.setHTML(sub, 'You toss ' + Lab.tex('n=' + d.n) + ' times and each toss is H or T, so there are ' + Lab.tex('2^{n}=2^{' + d.n + '}=' + N) + ' possible sequences. ' + d.m + ' of these ' + N + ' are in ' + Lab.tex('E') + (d.fair ? ' — and with a fair coin all ' + N + ' are equally likely, so ' + Lab.tex('P(E)=\\frac{' + d.m + '}{' + N + '}') + '.' : ' — but with ' + Lab.tex('p\\ne\\tfrac12') + ' they are <b>not</b> equally likely, so add their probabilities (below).'));
      P.answer.append(ev, big, sub);
    }

    function drawSpace(d) {
      const body = P.space.body;
      Lab.clear(body);
      const N = 1 << d.n;
      P.space.sub(Lab.tex('2^{n}=2^{' + d.n + '}=' + N) + ' outcomes (each of the ' + Lab.tex('n=' + d.n) + ' tosses is H or T). Each column holds the outcomes with the same value of your ' + Lab.tex('X') + '. ' + (d.fair ? 'With a fair coin each outcome has probability ' + Lab.tex('\\left(\\tfrac12\\right)^{n}=\\left(\\tfrac12\\right)^{' + d.n + '}=\\tfrac1{' + N + '}') + '.' : 'An outcome with ' + Lab.tex('h') + ' heads has probability ' + Lab.tex('p^{h}(1-p)^{n-h}') + ' — the bar under each tile shows it.') + ' Violet = in ' + Lab.tex('E') + '. Point at a tile for its numbers.');
      const maxP = Math.max(...d.outs.map(o => Number(o.prob)));
      const compact = d.n > 6;
      const cols = h('div', { class: 'cs-cols' + (compact ? ' compact' : '') });
      d.xs.forEach(x => {
        const group = d.outs.filter(o => o.x === x);
        const px = F.sum(group.map(o => o.prob));
        const col = h('div', { class: 'cs-col' });
        const head = h('div', { class: 'cs-head' });
        Lab.setHTML(head, Lab.tex('X=' + x) + '<span>' + group.length + ' outcome' + (group.length > 1 ? 's' : '') + '</span>');
        col.appendChild(head);
        const tiles = h('div', { class: 'cs-tiles' });
        group.forEach(o => {
          const t = h('div', { class: 'cs-tile' + (o.inE ? ' in' : ''), title: o.s + ':  P = ' + Lab.fmt(o.prob) });
          if (compact) { const bc = h('span', { class: 'cs-code' }); [...o.s].forEach(c => bc.appendChild(h('i', { class: c === 'H' ? 'h' : 't' }))); t.appendChild(bc); }
          else { const cc = h('span', { class: 'cs-coins' }); [...o.s].forEach(c => cc.appendChild(Lab.draw.coin(c, { size: 17 }))); t.appendChild(cc); }
          const bar = h('span', { class: 'cs-mass' });
          bar.style.width = Math.max(4, (Number(o.prob) / maxP) * 100) + '%';
          t.appendChild(bar);
          t.addEventListener('mouseenter', () => tileInfo(o, d));
          tiles.appendChild(t);
        });
        col.appendChild(tiles);
        const foot = h('div', { class: 'cs-foot', html: Lab.tex('P(X=' + x + ')=' + pTex(px)) });
        col.appendChild(foot);
        cols.appendChild(col);
      });
      body.appendChild(h('div', { class: 'cs-scroll' }, cols));
      P.tileInfo = h('div', { class: 'ws-readout cs-info', html: '<span class="muted">Point at any tile: you will see its probability as a product, one factor per toss.</span>' });
      body.appendChild(P.tileInfo);
    }
    function tileInfo(o, d) {
      const fac = [...o.s].map(c => (c === 'H' ? pTex(d.p) : pTex(d.q)));
      const same = fac.every(f => f === fac[0]);
      const prod = fac.length > 6 && same ? '\\left(' + fac[0] + '\\right)^{' + fac.length + '}' : fac.map(f => (f.includes('frac') ? f : f)).join('\\cdot ');
      Lab.setHTML(P.tileInfo, '<b class="mono">' + o.s + '</b>: ' + Lab.tex('X=' + o.x) + ', ' + Lab.tex('P=' + prod + '=' + pTexApprox(o.prob)) + ' — ' + (o.inE ? '<span class="cpick">in E</span>' : '<span class="muted">not in E</span>'));
    }

    function drawCalc(d) {
      const body = P.calc.body;
      Lab.clear(body);
      const N = 1 << d.n;
      const inE = d.outs.filter(o => o.inE);
      const byH = {};
      inE.forEach(o => { (byH[o.h] = byH[o.h] || []).push(o); });
      const hs = Object.keys(byH).map(Number).sort((a, b) => a - b);
      const steps = [];
      steps.push({ html: 'One toss: heads with probability ' + Lab.tex('p=' + pTex(d.p)) + ', tails with ' + Lab.tex('1-p=' + pTex(d.q)) + '. The tosses are independent, so <b>multiply</b> along a sequence.' });
      const ex = d.outs.find(o => o.inE) || d.outs[0];
      steps.push({ html: 'You chose ' + Lab.tex('n=' + d.n) + ' tosses. A sequence with ' + Lab.tex('h') + ' heads has its other ' + Lab.tex('n-h=' + d.n + '-h') + ' tosses as tails. One factor per toss — ' + Lab.tex('p') + ' for each H, ' + Lab.tex('1-p') + ' for each T — so its probability is',
        math: 'p^{h}(1-p)^{n-h}=p^{h}(1-p)^{' + d.n + '-h}' + (d.fair ? '=\\left(\\tfrac12\\right)^{h}\\left(\\tfrac12\\right)^{' + d.n + '-h}=\\left(\\tfrac12\\right)^{' + d.n + '}=\\tfrac1{' + N + '}' : ''),
        note: 'Example: <b class="mono">' + ex.s + '</b> has ' + Lab.tex('h=' + ex.h) + ' head' + (ex.h === 1 ? '' : 's') + ' and ' + Lab.tex(String(d.n - ex.h)) + ' tail' + (d.n - ex.h === 1 ? '' : 's') + ': ' + Lab.tex([...ex.s].map(c => (c === 'H' ? pTex(d.p) : pTex(d.q))).join('\\cdot ') + '=' + pTex(ex.prob)) + (d.fair ? '. With a fair coin every one of the ' + N + ' sequences gets this same ' + Lab.tex('\\tfrac1{' + N + '}') + '.' : '.') });
      if (!inE.length) {
        steps.push({ html: 'No outcome is in ' + Lab.tex('E') + ', so ' + Lab.tex('P(E)=0') + '.' });
      } else {
        const rows = hs.map(k => {
          const each = d.p.pow(k).mul(d.q.pow(d.n - k));
          return { k, c: byH[k].length, each, sub: each.mul(byH[k].length) };
        });
        steps.push({ html: 'Sort the ' + inE.length + ' outcomes in ' + Lab.tex('E') + ' by their number of heads:', block: Lab.table(['heads ' + Lab.tex('h'), 'outcomes in E', 'each has prob.', 'subtotal'], rows.map(r => [
          Lab.tex(String(r.k)), String(r.c) + (r.c <= 4 ? ' <span class="muted mono">(' + byH[r.k].map(o => o.s).join(', ') + ')</span>' : ''),
          Lab.tex('p^{' + r.k + '}(1-p)^{' + (d.n - r.k) + '}=' + pTex(r.each)), Lab.tex(r.c + '\\times ' + pTex(r.each) + '=' + pTex(r.sub))])) });
        const sum = rows.map(r => (r.c === 1 ? '' : r.c + '\\cdot ') + (d.fair ? '\\tfrac1{' + N + '}' : '(' + pTex(d.p) + ')^{' + r.k + '}(' + pTex(d.q) + ')^{' + (d.n - r.k) + '}')).join('+');
        steps.push({ html: 'Add the subtotals:', math: 'P(E)=' + (rows.length > 6 ? '\\sum' : sum) + '=' + pTexApprox(d.pE) });
        if (st.x === 'heads' && st.ev === 'eq' && !st.not) {
          const c = Lab.math.choose(d.n, st.a);
          steps.push({ html: 'This is the <b>Binomial</b> formula with ' + Lab.tex('n=' + d.n) + ' tosses and ' + Lab.tex('a=' + st.a) + ' heads: ' + Lab.tex('\\binom{' + d.n + '}{' + st.a + '}=' + c) + ' ways to choose which ' + st.a + ' of the ' + d.n + ' tosses are heads, times the chance ' + Lab.tex('p^{' + st.a + '}(1-p)^{' + (d.n - st.a) + '}') + ' of one such sequence.', math: '\\binom{' + d.n + '}{' + st.a + '}p^{' + st.a + '}(1-p)^{' + (d.n - st.a) + '}=' + c + '\\cdot ' + pTex(d.p.pow(st.a)) + '\\cdot ' + pTex(d.q.pow(d.n - st.a)) + '=' + pTex(d.pE) });
        }
        if (st.not) steps.push({ html: 'Check with the complement rule: ' + Lab.tex('P(\\text{NOT }E)=1-P(E)') + ' for the original event, so the original event had probability ' + Lab.tex(pTex(F(1).sub(d.pE))) + '.' });
        else if (inE.length > N / 2) steps.push({ html: 'Shortcut: ' + Lab.tex('E') + ' has more than half the outcomes, so it is quicker to count the ' + (N - inE.length) + ' outcomes NOT in ' + Lab.tex('E') + ' and use ' + Lab.tex('P(E)=1-P(\\text{not }E)=1-' + pTex(F(1).sub(d.pE)) + '=' + pTex(d.pE)) + '.' });
      }
      const ol = h('ol', { class: 'pl-steps' });
      steps.forEach((s, k) => {
        const li = h('li', {}, h('span', { class: 's-num', text: String(k + 1) }), h('div', { class: 's-body' }));
        if (s.html) { const p = h('div'); Lab.setHTML(p, s.html); li.lastChild.appendChild(p); }
        if (s.math) li.lastChild.appendChild(h('div', { class: 's-math', html: Lab.tex(s.math, true) }));
        if (s.note) { const nt = h('div', { class: 'small muted' }); Lab.setHTML(nt, s.note); li.lastChild.appendChild(nt); }
        if (s.block) Lab.mountBlock(s.block, li.lastChild);
        ol.appendChild(li);
      });
      body.appendChild(ol);
    }

    function drawDist(d) {
      const body = P.dist.body;
      Lab.clear(body);
      const rows = d.xs.map(x => {
        const g = d.outs.filter(o => o.x === x);
        return { x, px: F.sum(g.map(o => o.prob)), pe: F.sum(g.filter(o => o.inE).map(o => o.prob)) };
      });
      const max = Math.max(...rows.map(r => Number(r.px)), 1e-9);
      const chart = h('div', { class: 'pd-chart' });
      const axis = h('div', { class: 'pd-axis' });
      rows.forEach(r => {
        const col = h('div', { class: 'pd-col' + (Number(r.pe) > 0 ? ' has' : '') });
        const val = h('div', { class: 'pd-val', html: Lab.tex(pTex(r.px)) });
        const stack = h('div', { class: 'pd-stack' });
        const full = h('div', { class: 'pd-bar' });
        full.style.height = (Number(r.px) / max) * 80 + '%';
        const part = h('div', { class: 'pd-part' });
        part.style.height = Number(r.px) ? (Number(r.pe) / Number(r.px)) * 100 + '%' : '0';
        full.appendChild(part);
        stack.append(val, full);
        col.append(stack);
        axis.appendChild(h('div', { class: 'pd-x', html: Lab.tex(String(r.x)) }));
        col.title = 'P(X=' + r.x + ') = ' + Lab.fmt(r.px) + ';  P(E and X=' + r.x + ') = ' + Lab.fmt(r.pe);
        chart.appendChild(col);
      });
      body.appendChild(h('div', { class: 'pd-scroll' }, h('div', { class: 'pd-inner' }, chart, axis)));
      body.appendChild(h('div', { class: 'pd-name', html: 'values of ' + Lab.tex('X') + ' (' + COIN_VARS[st.x].word + ')' }));
      const tot = F.sum(rows.map(r => r.px));
      body.appendChild(h('div', { class: 'small muted', html: 'The bars add up to ' + Lab.tex(pTex(tot)) + ' — every outcome lands on exactly one value of ' + Lab.tex('X') + '.' }));
    }

    function drawCdf(d) {
      const body = P.cdf.body;
      Lab.clear(body);
      const rows = d.xs.map(x => ({ x, px: F.sum(d.outs.filter(o => o.x === x).map(o => o.prob)) }));
      let acc = F(0);
      rows.forEach(r => { acc = acc.add(r.px); r.F = acc; });
      const lo = d.xs[0], hi = d.xs[d.xs.length - 1];
      if (st.t == null || st.t < lo - 1 || st.t > hi + 1) st.t = Math.round((lo + hi) / 2);
      const tCtl = numField({ label: 'Choose ' + Lab.tex('t') + ' (any number; the staircase is defined everywhere)', min: lo - 1, max: hi + 1, step: 0.5, value: st.t, onChange: v => { st.t = v; save(); paint(); } });
      const chartHost = h('div', { class: 'cdf-host' });
      const read = h('div', { class: 'ws-readout cdf-read' });
      body.append(tCtl, chartHost, read);
      function paint() {
        const t = st.t;
        const Wd = 640, H = 230, pl = 44, pr = 16, pt = 14, pb = 34;
        const X = v => pl + ((v - (lo - 1)) / ((hi + 1) - (lo - 1))) * (Wd - pl - pr);
        const Y = v => pt + (1 - v) * (H - pt - pb);
        const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'cdf-svg pl-cdf' });
        [0, 0.25, 0.5, 0.75, 1].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(v), y2: Y(v), class: 'grid' })); s.appendChild(svg('text', { x: pl - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v))); });
        let prevF = 0, prevX = X(lo - 1);
        rows.forEach(r => {
          const fx = Number(r.F);
          s.appendChild(svg('line', { x1: prevX, x2: X(r.x), y1: Y(prevF), y2: Y(prevF), class: 'step' }));
          s.appendChild(svg('line', { x1: X(r.x), x2: X(r.x), y1: Y(prevF), y2: Y(fx), class: 'jump' }));
          s.appendChild(svg('text', { x: X(r.x) + 5, y: (Y(prevF) + Y(fx)) / 2 + 4, class: 'jump-lab' }, '+' + Lab.fmt(r.px)));
          s.appendChild(svg('circle', { cx: X(r.x), cy: Y(prevF), r: 3.6, class: 'open' }));
          s.appendChild(svg('circle', { cx: X(r.x), cy: Y(fx), r: 3.6, class: 'closed' }));
          s.appendChild(svg('text', { x: X(r.x), y: H - 14, 'text-anchor': 'middle', class: 'tick' }, String(r.x)));
          prevF = fx; prevX = X(r.x);
        });
        s.appendChild(svg('line', { x1: prevX, x2: X(hi + 1), y1: Y(prevF), y2: Y(prevF), class: 'step' }));
        const Ft = rows.filter(r => r.x <= t).reduce((a, r) => a.add(r.px), F(0));
        s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: Y(0), y2: Y(Number(Ft)), class: 'marker' }));
        s.appendChild(svg('line', { x1: pl, x2: X(t), y1: Y(Number(Ft)), y2: Y(Number(Ft)), class: 'marker' }));
        s.appendChild(svg('circle', { cx: X(t), cy: Y(Number(Ft)), r: 5.5, class: 'marker-dot' }));
        s.appendChild(svg('text', { x: (Wd + pl) / 2, y: H - 1, 'text-anchor': 'middle', class: 'tick' }, 't'));
        Lab.clear(chartHost);
        chartHost.appendChild(s);
        const used = rows.filter(r => r.x <= t);
        const terms = used.map(r => 'P(X=' + r.x + ')');
        const nums = used.map(r => pTex(r.px));
        Lab.setHTML(read, used.length
          ? Lab.tex('F(' + Lab.fmtVal(t) + ')=P(X\\le ' + Lab.fmtVal(t) + ')=' + (terms.length > 4 ? '\\sum_{x\\le ' + Lab.fmtVal(t) + '}P(X=x)' : terms.join('+'))) + '<br>' + Lab.tex('=' + (nums.length > 1 ? nums.join('+') + '=' : '') + pTexApprox(Ft)) +
            '<div class="small muted">The values of ' + Lab.tex('X') + ' that are ' + Lab.tex('\\le ' + Lab.fmtVal(t)) + ': ' + used.map(r => r.x).join(', ') + '. And ' + Lab.tex('P(X>' + Lab.fmtVal(t) + ')=1-F(' + Lab.fmtVal(t) + ')=' + pTex(F(1).sub(Ft))) + '.</div>'
          : Lab.tex('F(' + Lab.fmtVal(t) + ')=P(X\\le ' + Lab.fmtVal(t) + ')=0') + ' — no value of ' + Lab.tex('X') + ' is ' + Lab.tex('\\le ' + Lab.fmtVal(t)) + ' (the smallest is ' + lo + ').');
      }
      paint();
    }

    function drawTree(d) {
      const body = P.tree.body;
      Lab.clear(body);
      if (d.n > 4) { body.appendChild(h('p', { class: 'small muted', text: 'The tree has ' + (1 << d.n) + ' leaves for ' + d.n + ' tosses — too many to read. Set n to 4 or less to see it; the sample space above shows the same outcomes.' })); return; }
      const leaves = d.outs;
      const L = leaves.length;
      const rowH = L > 8 ? 26 : 34, Wd = 720, H = L * rowH + 20;
      const colW = (Wd - 230) / d.n;
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'pt-svg', role: 'img', 'aria-label': 'probability tree' });
      const leafY = k => 10 + rowH * k + rowH / 2;
      // node y for prefix: average of its leaves
      const nodeY = prefix => { const ks = leaves.map((o, k) => (o.s.startsWith(prefix) ? k : -1)).filter(k => k >= 0); return (leafY(ks[0]) + leafY(ks[ks.length - 1])) / 2; };
      const X0 = 16;
      const xAt = lvl => X0 + lvl * colW;
      const pre = [''];
      for (let lvl = 0; lvl < d.n; lvl++) {
        const prefixes = [...new Set(leaves.map(o => o.s.slice(0, lvl)))];
        prefixes.forEach(pf => ['H', 'T'].forEach(c => {
          const child = pf + c;
          const y1 = nodeY(pf), y2 = nodeY(child);
          const inE = leaves.some(o => o.s.startsWith(child) && o.inE);
          s.appendChild(svg('path', { d: 'M' + xAt(lvl) + ',' + y1 + ' C' + (xAt(lvl) + colW * 0.5) + ',' + y1 + ' ' + (xAt(lvl + 1) - colW * 0.5) + ',' + y2 + ' ' + xAt(lvl + 1) + ',' + y2, class: 'pt-edge' + (inE ? ' in' : '') }));
          s.appendChild(svg('text', { x: xAt(lvl) + colW * 0.55, y: (y1 + y2) / 2 + (c === 'H' ? -5 : 13), 'text-anchor': 'middle', class: 'pt-p' }, (c === 'H' ? Lab.fmt(d.p) : Lab.fmt(d.q))));
          s.appendChild(svg('circle', { cx: xAt(lvl + 1), cy: y2, r: 9, class: 'pt-node ' + (c === 'H' ? 'h' : 't') }));
          s.appendChild(svg('text', { x: xAt(lvl + 1), y: y2 + 3.5, 'text-anchor': 'middle', class: 'pt-letter' }, c));
        }));
      }
      s.appendChild(svg('circle', { cx: X0, cy: nodeY(''), r: 4, class: 'pt-root' }));
      leaves.forEach((o, k) => {
        const g = svg('text', { x: xAt(d.n) + 18, y: leafY(k) + 4, class: 'pt-leaf' + (o.inE ? ' in' : '') }, o.s + '   ' + Lab.fmt(o.prob));
        s.appendChild(g);
      });
      body.appendChild(h('div', { class: 'pt-scroll' }, s));
    }

    /* --- simulation --- */
    function buildSim() {
      const body = P.sim.body;
      const btns = h('div', { class: 'btn-row' });
      [1, 10, 100, 1000].forEach((r, k) => btns.appendChild(Lab.button(r === 1 ? 'Toss once' : 'Toss ' + r.toLocaleString('en-US') + '×', () => runSim(r), k === 2 ? 'btn primary sm' : 'btn sm')));
      btns.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => resetSim(), 'btn ghost sm'));
      P.simStat = h('div', { class: 'ps-stat' });
      P.simRecent = h('div', { class: 'ps-recent' });
      P.simChart = h('div', { class: 'ps-chart' });
      body.append(btns, P.simStat, P.simRecent, P.simChart);
    }
    function resetSim() { sim = { trials: 0, hits: 0, hist: [], recent: [] }; paintSim(); }
    function runSim(r) {
      if (!data) return;
      const p = Number(data.p);
      for (let t = 0; t < r; t++) {
        let s = '';
        for (let k = 0; k < data.n; k++) s += Math.random() < p ? 'H' : 'T';
        const o = data.outs.find(z => z.s === s);
        sim.trials++;
        if (o.inE) sim.hits++;
        sim.recent.push(o);
        if (sim.recent.length > 8) sim.recent.shift();
        sim.hist.push(sim.hits / sim.trials);
      }
      if (sim.hist.length > 600) { const step = sim.hist.length / 600; sim.hist = Array.from({ length: 600 }, (_, k) => sim.hist[Math.floor(k * step)]); }
      paintSim();
    }
    function paintSim() {
      if (!P.simStat || !data) return;
      const pe = Number(data.pE);
      Lab.setHTML(P.simStat, sim.trials
        ? 'Trials: <b>' + fmtInt(sim.trials) + '</b> · ' + Lab.tex('E') + ' happened <b>' + fmtInt(sim.hits) + '</b> times · fraction ' + Lab.tex('= ' + Lab.fmtDec(sim.hits / sim.trials, 4)) + ' · theory ' + Lab.tex('P(E)\\approx ' + Lab.fmtDec(pe, 4))
        : '<span class="muted">No tosses yet. Press a button.</span>');
      Lab.clear(P.simRecent);
      sim.recent.slice().reverse().forEach(o => P.simRecent.appendChild(h('span', { class: 'ps-seq' + (o.inE ? ' in' : '') }, o.s, h('b', { text: o.inE ? ' ✓' : ' ✗' }))));
      // running fraction line
      Lab.clear(P.simChart);
      const Wd = 640, H = 170, pl = 34, pr = 10, pt = 10, pb = 22;
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'ps-svg' });
      const Y = v => pt + (1 - v) * (H - pt - pb);
      [0, 0.25, 0.5, 0.75, 1].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(v), y2: Y(v), class: 'ps-grid' })); s.appendChild(svg('text', { x: pl - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'ps-tick' }, String(v))); });
      s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(pe), y2: Y(pe), class: 'ps-theory' }));
      s.appendChild(svg('text', { x: Wd - pr, y: Y(pe) - 5, 'text-anchor': 'end', class: 'ps-tlabel' }, 'P(E) ≈ ' + Lab.fmtDec(pe, 3)));
      if (sim.hist.length > 1) {
        const n = sim.hist.length;
        const X = k => pl + (k / (n - 1)) * (Wd - pl - pr);
        s.appendChild(svg('path', { d: sim.hist.map((v, k) => (k ? 'L' : 'M') + X(k).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '), class: 'ps-line' }));
      }
      s.appendChild(svg('text', { x: (Wd + pl) / 2, y: H - 4, 'text-anchor': 'middle', class: 'ps-tick' }, sim.trials ? 'fraction of trials in E, after 1 … ' + fmtInt(sim.trials) + ' trials' : 'fraction of trials in E'));
      P.simChart.appendChild(s);
    }
    return self;
  };

  /* ============================================================ COUNTING LAB */
  const ITEM_PRESETS = [
    { label: 'Letters', items: 'A, B, C, D' },
    { label: 'Digits', items: '1, 2, 3, 4, 5' },
    { label: 'Cards', items: 'A♠, K♠, Q♠, J♠, 10♠' },
    { label: 'Friends', items: 'Ann, Ben, Cara, Dev, Eli' },
    { label: 'Colours', items: 'red, blue, green' },
  ];
  const LIST_LIMIT = 1500;
  const MAX_ITEMS = 52; // a full deck of cards; the class of 40 students in L6.2 also fits
  const COUNT_DEF = { items: 'A, B, C, D', r: 2, order: true, rep: false, showOrders: false, ev: 'none', ea: 0, eb: 1, preset: '' };
  const fact = n => { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };

  /* The professor's counting examples (LABS.md Rule 1), with minutes from the Week 5–6 lecture transcripts.
     The lecture codes L5.1–L6.2 are the ones the labs s1-w05-arrange and s1-w06-choose use. set = the lab state; the rest is COUNT_DEF. */
  const seqItems = (pre, k) => Array.from({ length: k }, (_, i) => pre + (i + 1)).join(', ');
  const AZ = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).join(', ');
  const DIG = '0, 1, 2, 3, 4, 5, 6, 7, 8, 9';
  const A2H = 'A, B, C, D, E, F, G, H';
  const DECK = ['♣', '♠', '♥', '♦'].map(s => ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'].map(r => r + s).join(', ')).join(', ');
  const T51 = S1 + '‘Permutations &amp; combinations – basic principles of counting’', T52 = S1 + '‘Permutations &amp; combinations – factorials’',
    T53 = S1 + '‘Permutations &amp; combinations – permutations: distinct objects’', T61 = S1 + '‘Permutations &amp; combinations – combinations’',
    T62 = S1 + '‘Permutations &amp; combinations – applications’';
  const KG51 = 'Statistics I · Week 5 · L5.1 basic principles of counting', KG52 = 'Statistics I · Week 5 · L5.2 factorials',
    KG53 = 'Statistics I · Week 5 · L5.3 permutations', KG61 = 'Statistics I · Week 6 · L6.1 combinations', KG62 = 'Statistics I · Week 6 · L6.2 applications';
  const PW_REP = 'A 6-place password: 2 letters (A–Z), then 4 digits (0–9), repeats allowed: 26 × 26 × 10 × 10 × 10 × 10 = 6,760,000. This lab counts one kind of item at a time: ';
  const PW_NOREP = 'The same password with no letter or digit used twice: 26 × 25 × 10 × 9 × 8 × 7 = 3,276,000. This lab counts one kind of item at a time: ';
  const COUNT_PRESETS = [
    { key: 'pw-letters-rep', group: KG51, label: 'Password, repeats allowed: the 2 letters, 26²',
      source: T51 + ', minutes 17:55–20:00', note: PW_REP + 'here the letters, 26² = 676. Times the digits’ 10⁴ = 10,000 (next example): 676 × 10,000 = 6,760,000.',
      set: { items: AZ, r: 2, order: true, rep: true } },
    { key: 'pw-digits-rep', group: KG51, label: 'Password, repeats allowed: the 4 digits, 10⁴',
      source: T51 + ', minutes 17:55–20:00', note: PW_REP + 'here the digits, 10⁴ = 10,000. Times the letters’ 26² = 676: 676 × 10,000 = 6,760,000.',
      set: { items: DIG, r: 4, order: true, rep: true } },
    { key: 'pw-letters', group: KG51, label: 'Password, no repeats: the 2 letters, ²⁶P₂',
      source: T51 + ', minutes 20:05–21:40', note: PW_NOREP + 'here the letters, 26 × 25 = 650. Times the digits’ 10 × 9 × 8 × 7 = 5,040 (next example): 650 × 5,040 = 3,276,000.',
      set: { items: AZ, r: 2, order: true, rep: false } },
    { key: 'pw-digits', group: KG51, label: 'Password, no repeats: the 4 digits, ¹⁰P₄',
      source: T51 + ', minutes 20:05–21:40', note: PW_NOREP + 'here the digits, 10 × 9 × 8 × 7 = 5,040. Times the letters’ 26 × 25 = 650: 650 × 5,040 = 3,276,000.',
      set: { items: DIG, r: 4, order: true, rep: false } },
    { key: 'runners', group: KG52, label: '8 runners: the orders of finish, 8!',
      source: T52 + ', minutes 00:20–04:45',
      note: '8 different runners and no ties: 8 choices for 1st place, then 7, 6, …, 1: 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1, written 8! (05:00) = 40,320. P1, …, P8 are the 8 runners.',
      set: { items: seqItems('P', 8), r: 8, order: true, rep: false } },
    { key: 'abc-all', group: KG53, label: 'A, B, C, all 3 at a time: 3! = 6',
      source: T53 + ', minutes 02:00–05:10 (formula at 18:30–19:10)',
      note: 'ABC, ACB, BAC, BCA, CAB, CBA: 6 arrangements, and ³P₃ = 3! = 6.',
      set: { items: 'A, B, C', r: 3, order: true, rep: false } },
    { key: 'abc-two', group: KG53, label: 'A, B, C, 2 at a time: ³P₂ = 6',
      source: T53 + ', minutes 05:25–06:45 (formula at 19:10–19:45)',
      note: 'AB, BA, BC, CB, AC, CA: 6 arrangements, and ³P₂ = 3!/1! = 6, the same count as taking all 3.',
      set: { items: 'A, B, C', r: 2, order: true, rep: false } },
    { key: 'abcd-all', group: KG53, label: 'A, B, C, D, all 4 at a time: 4! = 24',
      source: T53 + ', minutes 06:50–09:00 (formula at 19:55–20:30)',
      note: 'Fix A in the first place: B, C, D fill the other 3 places in 6 ways. The same for B, C or D first: 6 + 6 + 6 + 6 = 24 = 4!. The event “starts with A” shows the 6 with A first.',
      set: { items: 'A, B, C, D', r: 4, order: true, rep: false, ev: 'starts', ea: 0 } },
    { key: 'abcd-two', group: KG53, label: 'A, B, C, D, 2 at a time: ⁴P₂ = 12',
      source: T53 + ', minutes 09:10–10:15 (formula at 20:40–21:20)',
      note: 'AB, AC, AD, BA, BC, BD, CA, CB, CD, DA, DB, DC: 12 arrangements, and ⁴P₂ = 4!/2! = 12.',
      set: { items: 'A, B, C, D', r: 2, order: true, rep: false } },
    { key: 'chair', group: KG53, label: 'Chairman and vice-chairman from 8: ⁸P₂ = 56',
      source: T53 + ', minutes 21:45–23:30',
      note: 'A committee of 8 people A, …, H. One person cannot hold both posts, and (A chairman, B vice) is not (B chairman, A vice): ⁸P₂ = 8!/6! = 8 × 7 = 56.',
      set: { items: A2H, r: 2, order: true, rep: false } },
    { key: 'digits4', group: KG53, label: '4-digit numbers from 1, 2, 3, 4, 5: ⁵P₄ = 120',
      source: T53 + ', minutes 23:35–24:35',
      note: 'No digit repeated: ⁵P₄ = 5!/1! = 5 × 4 × 3 × 2 = 120.',
      set: { items: '1, 2, 3, 4, 5', r: 4, order: true, rep: false } },
    { key: 'even', group: KG53, label: 'Even 4-digit numbers from 1–5: 24 + 24 = 48',
      source: T53 + ', minutes 24:50–26:35',
      note: 'Even means the last digit is 2 or 4. Fix 2 last: the other 3 places come from 1, 3, 4, 5 in ⁴P₃ = 4 × 3 × 2 = 24 ways; fix 4 last: another 24. 24 + 24 = 48 even numbers. Here the event is “ends with 2” (24 of the 120); choose 4 as the item for the other 24.',
      set: { items: '1, 2, 3, 4, 5', r: 4, order: true, rep: false, ev: 'ends', ea: 1 } },
    { key: 'cinema', group: KG53, label: '6 people in a row of 10 cinema seats: ¹⁰P₆',
      source: T53 + ', minutes 26:55–28:35',
      note: 'Each ordered list says which seat person 1, person 2, …, person 6 takes: ¹⁰P₆ = 10!/4! = 151,200 (the lecture leaves the answer as ¹⁰P₆).',
      set: { items: seqItems('seat ', 10), r: 6, order: true, rep: false } },
    { key: 'cinema-block', group: KG53, label: 'The same, with the 4 empty seats together: ⁷P₆',
      source: T53 + ', minutes 28:45–30:40',
      note: 'The 4 empty seats form one block, so the row has 6 + 1 = 7 places; the 6 people take 6 of the 7 places in order: ⁷P₆ = 7!/1! = 5,040 (the lecture leaves it as ⁷P₆). The place nobody takes is the empty block.',
      set: { items: seqItems('place ', 7), r: 6, order: true, rep: false } },
    { key: 'abc-rep3', group: KG53, label: 'A, B, C with repeats, 3 at a time: 3³ = 27',
      source: T53 + ', minutes 31:15–34:20 (formula at 37:15–37:35)',
      note: 'Now AAA is allowed: each of the 3 places can take A, B or C, so 3 × 3 × 3 = 3³ = 27.',
      set: { items: 'A, B, C', r: 3, order: true, rep: true } },
    { key: 'abc-rep2', group: KG53, label: 'A, B, C with repeats, 2 at a time: 3² = 9',
      source: T53 + ', minutes 34:25–35:20 (formula at 37:35–37:50)',
      note: 'AA, AB, AC, BA, BB, BC, CA, CB, CC: 3² = 9.',
      set: { items: 'A, B, C', r: 2, order: true, rep: true } },
    { key: 'three-two', group: KG61, label: 'Three students, choose two: ³C₂ = 3',
      source: T61 + ', minutes 00:30–02:50 (formula at 10:35–11:05)',
      note: 'The groups AB, AC, BC: ³C₂ = 3. Each group has 2! = 2 orders, so ³C₂ × 2! = 3 × 2 = 6 = ³P₂ (04:25–06:30; the orders are shown in “Every possibility”). The same 3 come back at 33:40–35:55 as the line segments joining 3 points on a circle.',
      set: { items: 'A, B, C', r: 2, order: false, rep: false, showOrders: true } },
    { key: 'fix-a', group: KG61, label: 'Fix A: ⁵C₃ = ⁴C₂ + ⁴C₃',
      source: T61 + ', minutes 15:20–18:00',
      note: 'Choose 3 of A, B, C, D, E. Groups with A: choose the other 2 from B, C, D, E, ⁴C₂ = 6 (the event “contains A”); groups without A: all 3 from B, C, D, E, ⁴C₃ = 4. 6 + 4 = 10 = ⁵C₃.',
      set: { items: 'A, B, C, D, E', r: 3, order: false, rep: false, ev: 'contains', ea: 0 } },
    { key: 'cards4', group: KG61, label: 'Any 4 cards from a deck of 52: ⁵²C₄',
      source: T61 + ', minutes 26:45–27:45',
      note: '4 suits × 13 cards = 52 cards. No condition on the 4 cards, so it is just ⁵²C₄ = 270,725 (“a pretty large number”).',
      set: { items: DECK, r: 4, order: false, rep: false } },
    { key: 'medals', group: KG62, label: '8 athletes: gold, silver and bronze, ⁸P₃ = 336',
      source: T62 + ', minutes 02:10–03:50 and 06:10–06:50',
      note: 'Order matters: A gold, D silver, F bronze is not D gold, A silver, F bronze. ⁸P₃ = 8!/5! = 8 × 7 × 6 = 336.',
      set: { items: A2H, r: 3, order: true, rep: false } },
    { key: 'heat', group: KG62, label: '8 athletes: the top 3 go to the next round, ⁸C₃ = 56',
      source: T62 + ', minutes 04:10–05:45 and 06:50–08:10',
      note: 'Only who goes through matters: ⁸C₃ = 8!/(3! 5!) = 56. Check (07:45): 56 × 3! = 56 × 6 = 336 = ⁸P₃.',
      set: { items: A2H, r: 3, order: false, rep: false } },
    { key: 'reps', group: KG62, label: 'Two class representatives from 40: ⁴⁰C₂ = 780',
      source: T62 + ', minutes 08:30–09:05 and 10:45–11:15',
      note: 'No order between the two: ⁴⁰C₂ = (40 × 39)/2 = 780. S1, …, S40 are the 40 students.',
      set: { items: seqItems('S', 40), r: 2, order: false, rep: false } },
    { key: 'captain', group: KG62, label: 'Captain and vice-captain from 40: ⁴⁰P₂ = 1,560',
      source: T62 + ', minutes 09:05–10:20 and 11:10–11:45',
      note: 'The two posts differ, so order matters: ⁴⁰P₂ = 40 × 39 = 1,560 = 780 × 2!. S1, …, S40 are the 40 students.',
      set: { items: seqItems('S', 40), r: 2, order: true, rep: false } },
  ];

  function* perms(items, r, rep, used = [], cur = []) {
    if (cur.length === r) { yield cur.slice(); return; }
    for (let i = 0; i < items.length; i++) {
      if (!rep && used[i]) continue;
      used[i] = true; cur.push(i);
      yield* perms(items, r, rep, used, cur);
      cur.pop(); used[i] = false;
    }
  }
  function* combs(n, r, rep, start = 0, cur = []) {
    if (cur.length === r) { yield cur.slice(); return; }
    for (let i = start; i < n; i++) { cur.push(i); yield* combs(n, r, rep, rep ? i : i + 1, cur); cur.pop(); }
  }

  W.countLab = function () {
    const st = Object.assign({}, COUNT_DEF, Lab.store.get('lab:count', {}));
    let root, ctl = {}, P = {}, built = [];
    const save = () => Lab.store.set('lab:count', st);
    const self = { mount(el) { root = el; build(); } };
    const parseItems = s => { s = String(s); const parts = /[,\n]/.test(s) ? s.split(/[,\n]+/) : s.split(/\s+/); return [...new Set(parts.map(x => x.trim()).filter(Boolean))].slice(0, MAX_ITEMS); };
    const items = () => { const it = parseItems(st.items); return it.length ? it : ['A']; };
    /** A control was changed by hand: the loaded lecture example no longer describes the lab. */
    function touched() { if (!st.preset) return; st.preset = ''; showLecture(ctl.pre, COUNT_PRESETS, ''); }
    /** Load a lecture example: the lab state, then every control through its own set/value. */
    function applyPreset(it) {
      Object.assign(st, COUNT_DEF, it.set, { preset: it.key });
      built = [];
      ctl.items.input.value = st.items;
      ctl.order.set(st.order);
      ctl.rep.set(st.rep);
      ctl.r.setRange(0, st.rep ? 6 : Math.min(items().length, 8));
      ctl.r.set(st.r);
      showLecture(ctl.pre, COUNT_PRESETS, st.preset);
      afterItems(); // ranges and hints, the event menus (syncEvent), then draw()
    }

    function count(n, r) {
      if (st.order && !st.rep) return Lab.math.perm(n, r);
      if (st.order && st.rep) return Math.pow(n, r);
      if (!st.order && !st.rep) return Lab.math.choose(n, r);
      return Lab.math.choose(n + r - 1, r);
    }
    function kind() {
      if (st.order && !st.rep) return { name: 'Permutations', what: 'ordered lists, no repeats', sym: (n, r) => '{}^{' + n + '}P_{' + r + '}' };
      if (st.order && st.rep) return { name: 'Ordered lists with repeats', what: 'ordered lists, repeats allowed', sym: (n, r) => n + '^{' + r + '}' };
      if (!st.order && !st.rep) return { name: 'Combinations', what: 'groups, no repeats', sym: (n, r) => '\\binom{' + n + '}{' + r + '}' };
      return { name: 'Combinations with repeats', what: 'groups, repeats allowed', sym: (n, r) => '\\binom{' + n + '+' + r + '-1}{' + r + '}' };
    }

    function build() {
      Lab.clear(root);
      root.classList.add('pl-lab', 'count-lab');
      const side = h('aside', { class: 'pl-controls' });
      const main = h('div', { class: 'pl-main' });
      root.append(side, main);
      ctl.pre = lectureMenu(COUNT_PRESETS, applyPreset, () => { st.preset = ''; save(); });
      side.appendChild(ctl.pre);
      st.preset = showLecture(ctl.pre, COUNT_PRESETS, st.preset);
      side.appendChild(h('div', { class: 'pl-group-title', text: '1 · Your items' }));
      ctl.items = textField({ label: 'Type your items, separated by commas', value: st.items, mono: false, onChange: v => { touched(); st.items = v; afterItems(); } });
      const pre = h('div', { class: 'pl-chips' });
      ITEM_PRESETS.forEach(pz => pre.appendChild(Lab.button(pz.label, () => { touched(); st.items = pz.items; ctl.items.input.value = pz.items; afterItems(); }, 'btn xs')));
      const more = h('div', { class: 'pl-chips' },
        Lab.button('+ add an item', () => {
          const it = items(); if (it.length >= MAX_ITEMS) return;
          // next free letter; after Z try A2, B2, … (so it always stops, whatever the items are)
          let k = 0, nm; do { nm = String.fromCharCode(65 + ((it.length + k) % 26)) + (k >= 26 ? String(Math.floor(k / 26) + 1) : ''); k++; } while (it.includes(nm));
          touched(); st.items = it.concat(nm).join(', '); ctl.items.input.value = st.items; afterItems();
        }, 'btn xs'),
        Lab.button('− remove last', () => { const it = items(); if (it.length <= 1) return; touched(); st.items = it.slice(0, -1).join(', '); ctl.items.input.value = st.items; afterItems(); }, 'btn xs'));
      side.append(ctl.items, pre, more);
      side.appendChild(h('div', { class: 'pl-group-title', text: '2 · How many you pick' }));
      ctl.r = numField({ label: 'Pick ' + Lab.tex('r') + ' items', min: 0, max: 8, value: st.r, onChange: v => { touched(); st.r = v; built = []; draw(); } });
      side.appendChild(ctl.r);
      side.appendChild(h('div', { class: 'pl-group-title', text: '3 · The rules' }));
      ctl.order = Lab.seg([{ label: 'Order matters', value: true }, { label: 'Order doesn’t matter', value: false }], st.order, v => { touched(); st.order = v; built = []; if (!v && ['starts', 'ends', 'before'].includes(st.ev)) st.ev = 'none'; syncEvent(); draw(); });
      ctl.rep = Lab.seg([{ label: 'No repeats', value: false }, { label: 'Repeats allowed', value: true }], st.rep, v => { touched(); st.rep = v; built = []; afterItems(); });
      side.append(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Is (A, B) different from (B, A)?' }), ctl.order),
        h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Can the same item be picked twice?' }), ctl.rep));
      side.appendChild(h('div', { class: 'pl-group-title', text: '4 · Turn it into a probability' }));
      ctl.ev = selectField({ label: 'Pick one possibility at random. Event:', options: [], value: st.ev, onChange: v => { touched(); st.ev = v; syncEvent(); save(); drawProb(); } });
      ctl.ea = selectField({ label: 'item', options: [], value: '0', onChange: v => { touched(); st.ea = +v; save(); drawProb(); } });
      ctl.eb = selectField({ label: 'second item', options: [], value: '1', onChange: v => { touched(); st.eb = +v; save(); drawProb(); } });
      side.append(ctl.ev, ctl.ea, ctl.eb);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set('lab:count', {}); Object.assign(st, COUNT_DEF); built = []; build(); }, 'btn ghost sm')));

      P.answer = h('div', { class: 'pl-answer' });
      P.slots = panel('Fill the slots, one at a time');
      P.build = panel('Build one yourself', 'Click your items in order. Watch how many choices are left for the next slot.');
      P.formula = panel('The formula, with your numbers');
      P.list = panel('Every possibility');
      P.prob = panel('As a probability');
      main.append(P.answer, P.slots, P.build, P.formula, P.list, P.prob);
      afterItems();
    }
    function afterItems() {
      const n = items().length;
      st.r = ctl.r.setRange(0, st.rep ? 6 : Math.min(n, 8));
      ctl.r.hint(st.rep ? 'With repeats, ' + Lab.tex('r') + ' can be more than ' + Lab.tex('n') + ' (up to 6 here).' : Lab.tex('r') + ' can be at most ' + Lab.tex('n=' + n) + ' without repeats.');
      ctl.items.hint(Lab.tex('n=' + n) + ' distinct item' + (n > 1 ? 's' : '') + (parseItems(st.items).length >= MAX_ITEMS ? ' (' + MAX_ITEMS + ' is the limit here)' : ''));
      built = [];
      syncEvent();
      draw();
    }
    function syncEvent() {
      const it = items();
      const opts = [{ value: 'none', label: '— none —' }, { value: 'contains', label: 'it contains a chosen item' }, { value: 'without', label: 'it does NOT contain a chosen item' }];
      if (st.order) opts.push({ value: 'starts', label: 'it starts with a chosen item' }, { value: 'ends', label: 'it ends with a chosen item' }, { value: 'before', label: 'one item comes before another' });
      if (st.rep) opts.push({ value: 'distinct', label: 'all picked items are different' });
      const sel = ctl.ev.select;
      Lab.clear(sel);
      opts.forEach(o => sel.appendChild(h('option', { value: o.value, text: o.label })));
      if (!opts.some(o => o.value === st.ev)) st.ev = 'none';
      sel.value = st.ev;
      [ctl.ea, ctl.eb].forEach(c => { Lab.clear(c.select); it.forEach((x, k) => c.select.appendChild(h('option', { value: k, text: x }))); });
      st.ea = Math.min(st.ea, it.length - 1); st.eb = Math.min(st.eb, it.length - 1);
      if (st.eb === st.ea && it.length > 1) st.eb = (st.ea + 1) % it.length;
      ctl.ea.select.value = st.ea; ctl.eb.select.value = st.eb;
      ctl.ea.hidden = !['contains', 'without', 'starts', 'ends', 'before'].includes(st.ev);
      ctl.eb.hidden = st.ev !== 'before';
      ctl.ea.querySelector('label').textContent = st.ev === 'before' ? 'this item…' : 'item';
      ctl.eb.querySelector('label').textContent = '…comes before this item';
    }

    function draw() {
      save();
      const it = items(), n = it.length, r = st.r, K = kind();
      const total = count(n, r);
      Lab.setHTML(P.answer, '<div class="pl-ans-ev">' + K.name + ': ' + K.what + ' of ' + Lab.tex('r=' + r) + ' from ' + Lab.tex('n=' + n) + ' items.</div>' +
        '<div class="pl-ans-big">' + Lab.tex(K.sym(n, r) + '=' + fmtInt(total).replace(/,/g, '{,}'), true) + '</div>' +
        '<div class="pl-ans-sub">' + fmtInt(total) + ' different ' + (st.order ? 'ordered lists' : 'groups') + '.</div>');
      drawSlots(it, r, total); drawBuild(it, r); drawFormula(n, r, total); drawList(it, r, total); drawProb();
    }

    function drawSlots(it, r, total) {
      const body = P.slots.body;
      Lab.clear(body);
      const n = it.length;
      if (r === 0) { body.appendChild(h('p', { class: 'small muted', html: 'Picking 0 items: there is exactly 1 way — pick nothing. (That is why ' + Lab.tex('0!=1') + '.)' })); return; }
      if (!st.order && st.rep) {
        body.appendChild(h('p', { class: 'small', html: 'Here a pick is just "how many of each item". Think of ' + r + ' stars (the picks) and ' + (n - 1) + ' bars that split them into ' + n + ' boxes, one box per item. Every way to order the stars and bars is one group:' }));
        const ex = combs(n, r, true).next().value || []; // only the first group (listing them all can be millions)
        const counts = it.map((_, k) => ex.filter(x => x === k).length);
        const pic = h('div', { class: 'sb-pic' });
        counts.forEach((c, k) => { pic.appendChild(h('span', { class: 'sb-box' }, h('b', { text: '★'.repeat(c) || '·' }), h('i', { text: it[k] }))); if (k < n - 1) pic.appendChild(h('span', { class: 'sb-bar', text: '|' })); });
        body.appendChild(pic);
        body.appendChild(h('p', { class: 'small', html: Lab.tex('r+n-1=' + (r + n - 1)) + ' positions; choose which ' + r + ' hold stars: ' + Lab.tex('\\binom{' + (r + n - 1) + '}{' + r + '}=' + fmtInt(total)) + '.' }));
        return;
      }
      const row = h('div', { class: 'sl-row' });
      const factors = [];
      for (let k = 0; k < r; k++) {
        const choices = st.rep ? n : n - k;
        factors.push(choices);
        if (k) row.appendChild(h('span', { class: 'sl-times', text: '×' }));
        row.appendChild(h('div', { class: 'sl-slot' }, h('div', { class: 'sl-num', text: String(choices) }), h('div', { class: 'sl-cap', html: 'slot ' + (k + 1) + '<br>' + (st.rep ? 'n' : k === 0 ? 'n' : 'n−' + k) + ' = ' + (st.rep ? n : (k === 0 ? n : n + '−' + k)) })));
      }
      const ordered = factors.reduce((a, b) => a * b, 1);
      row.appendChild(h('span', { class: 'sl-times', text: '=' }));
      row.appendChild(h('div', { class: 'sl-total' }, h('b', { text: fmtInt(ordered) }), h('span', { text: 'ordered lists' })));
      body.appendChild(h('div', { class: 'sl-scroll' }, row));
      const why = h('p', { class: 'small' });
      Lab.setHTML(why, st.rep ? 'You have ' + Lab.tex('n=' + n) + ' items and pick ' + Lab.tex('r=' + r) + '. Every slot can take any of the ' + Lab.tex('n=' + n) + ' items, because repeats are allowed: ' + Lab.tex('n^{r}=' + n + '^{' + r + '}') + '.' : 'You have ' + Lab.tex('n=' + n) + ' items and fill ' + Lab.tex('r=' + r) + ' slots. Slot 1 can take any of the ' + Lab.tex('n=' + n) + ' items. Each later slot has <b>one fewer</b> choice, because an item already used cannot come back: slot ' + Lab.tex('k') + ' has ' + Lab.tex('n-(k-1)') + ' choices.');
      body.appendChild(why);
      if (!st.order) {
        const div = h('div', { class: 'sl-divide' });
        Lab.setHTML(div, 'But order does not matter: each group of ' + Lab.tex('r=' + r) + ' items (for example <b>{' + Lab.esc(it.slice(0, r).join(', ')) + '}</b>) appeared in ' + Lab.tex('r!=' + r + '!=' + fmtInt(fact(r))) + ' different orders in that count. So divide: ' + Lab.tex(fmtInt(ordered).replace(/,/g, '{,}') + '\\div ' + fmtInt(fact(r)) + '=' + fmtInt(total).replace(/,/g, '{,}')) + ' groups.');
        body.appendChild(div);
      }
    }

    function drawBuild(it, r) {
      const body = P.build.body;
      Lab.clear(body);
      if (r === 0) { body.appendChild(h('p', { class: 'small muted', text: 'Set r to 1 or more to build a pick.' })); return; }
      const slots = h('div', { class: 'bd-slots' });
      for (let k = 0; k < r; k++) slots.appendChild(h('div', { class: 'bd-slot' + (k < built.length ? ' full' : k === built.length ? ' next' : '') }, k < built.length ? it[built[k]] : String(k + 1)));
      const pad = h('div', { class: 'bd-items' });
      it.forEach((x, k) => {
        const used = !st.rep && built.includes(k);
        const b = h('button', { class: 'bd-item' + (used ? ' used' : ''), type: 'button', text: x });
        b.disabled = used || built.length >= r;
        b.addEventListener('click', () => { built.push(k); drawBuild(it, r); });
        pad.appendChild(b);
      });
      const msg = h('div', { class: 'ws-readout bd-msg' });
      if (built.length < r) {
        const left = st.rep ? it.length : it.length - built.length;
        Lab.setHTML(msg, 'Slot ' + (built.length + 1) + ' of ' + Lab.tex('r=' + r) + ': you have <b>' + left + '</b> choice' + (left === 1 ? '' : 's') + (st.rep ? ' (repeats allowed, so all ' + Lab.tex('n=' + it.length) + ' items).' : ' — ' + Lab.tex('n=' + it.length) + ' items minus the ' + built.length + ' already used: ' + Lab.tex(it.length + '-' + built.length + '=' + left) + '.'));
      } else {
        const pick = built.map(k => it[k]);
        let html = 'Your pick: <b>(' + Lab.esc(pick.join(', ')) + ')</b> — one of the ' + fmtInt(count(it.length, r)) + ' possibilities.';
        if (!st.order) {
          const distinct = new Set(built).size === built.length;
          const sorted = built.slice().sort((a, b) => a - b).map(k => it[k]);
          const orders = distinct ? fact(r) : (() => { const c = {}; built.forEach(k => (c[k] = (c[k] || 0) + 1)); return fact(r) / Object.values(c).reduce((a, v) => a * fact(v), 1); })();
          html += '<br>Order does not matter, so this is the group <b>{' + Lab.esc(sorted.join(', ')) + '}</b> — you could have clicked it in ' + orders + ' different order' + (orders > 1 ? 's' : '') + '.';
        }
        Lab.setHTML(msg, html);
      }
      const tools = h('div', { class: 'btn-row' }, Lab.button('Undo', () => { built.pop(); drawBuild(it, r); }, 'btn ghost sm'), Lab.button('Clear', () => { built = []; drawBuild(it, r); }, 'btn ghost sm'));
      body.append(slots, pad, msg, tools);
    }

    function drawFormula(n, r, total) {
      const body = P.formula.body;
      Lab.clear(body);
      const steps = [];
      const big = x => fmtInt(x).replace(/,/g, '{,}');
      const expand = (from, k) => { const f = []; for (let i = 0; i < k; i++) f.push(from - i); return f; };
      if (st.order && !st.rep) {
        steps.push({ html: 'Permutations of ' + r + ' from ' + n + ' (order matters, no repeats):', math: '{}^{n}P_{r}=\\frac{n!}{(n-r)!}=\\frac{' + n + '!}{(' + n + '-' + r + ')!}=\\frac{' + n + '!}{' + (n - r) + '!}' });
        if (r > 0) steps.push({ html: 'Write out ' + n + '! and cancel the ' + (n - r) + '! part — what is left is exactly the slot product:', math: (n <= 9 ? '\\frac{' + expand(n, n).join('\\cdot ') + '}{' + (n - r > 0 ? expand(n - r, n - r).join('\\cdot ') : '1') + '}=' : '') + expand(n, r).join('\\times ') + '=' + big(total) });
      } else if (st.order && st.rep) {
        steps.push({ html: 'Ordered lists with repeats: each of the ' + r + ' slots has ' + n + ' choices.', math: 'n^{r}=' + n + '^{' + r + '}' + (r > 0 ? '=' + Array(r).fill(n).join('\\times ') : '') + '=' + big(total) });
      } else if (!st.order && !st.rep) {
        const perm = Lab.math.perm(n, r);
        steps.push({ html: 'Combinations of ' + r + ' from ' + n + ' (order does not matter, no repeats):', math: '\\binom{n}{r}=\\frac{n!}{r!\\,(n-r)!}=\\frac{' + n + '!}{' + r + '!\\,' + (n - r) + '!}' });
        steps.push({ html: 'Same thing, seen as "ordered lists ÷ orders of each group":', math: '\\binom{' + n + '}{' + r + '}=\\frac{{}^{' + n + '}P_{' + r + '}}{' + r + '!}=\\frac{' + (r ? expand(n, r).join('\\times ') : '1') + '}{' + (r ? expand(r, r).join('\\times ') : '1') + '}=\\frac{' + big(perm) + '}{' + big(fact(r)) + '}=' + big(total) });
        if (r !== n - r) steps.push({ html: 'Check: choosing ' + r + ' to take is the same as choosing ' + (n - r) + ' to leave, so ' + Lab.tex('\\binom{' + n + '}{' + r + '}=\\binom{' + n + '}{' + (n - r) + '}') + '.' });
      } else {
        steps.push({ html: 'Groups with repeats ("stars and bars"):', math: '\\binom{n+r-1}{r}=\\binom{' + n + '+' + r + '-1}{' + r + '}=\\binom{' + (n + r - 1) + '}{' + r + '}=' + big(total) });
      }
      const ol = h('ol', { class: 'pl-steps' });
      steps.forEach((s, k) => {
        const li = h('li', {}, h('span', { class: 's-num', text: String(k + 1) }), h('div', { class: 's-body' }));
        if (s.html) { const p = h('div'); Lab.setHTML(p, s.html); li.lastChild.appendChild(p); }
        if (s.math) li.lastChild.appendChild(h('div', { class: 's-math', html: Lab.tex(s.math, true) }));
        ol.appendChild(li);
      });
      body.appendChild(ol);
    }

    function listAll(it, r) {
      const n = it.length;
      const out = [];
      const gen = st.order ? perms(it, r, st.rep) : combs(n, r, st.rep);
      for (const c of gen) { out.push(c); if (out.length > LIST_LIMIT) break; }
      return out;
    }
    function matches(c, it) {
      switch (st.ev) {
        case 'contains': return c.includes(st.ea);
        case 'without': return !c.includes(st.ea);
        case 'starts': return c[0] === st.ea;
        case 'ends': return c.length > 0 && c[c.length - 1] === st.ea;
        case 'before': { const i = c.indexOf(st.ea), j = c.indexOf(st.eb); return i >= 0 && j >= 0 && i < j; }
        case 'distinct': return new Set(c).size === c.length;
        default: return false;
      }
    }
    function drawList(it, r, total) {
      const body = P.list.body;
      Lab.clear(body);
      const all = listAll(it, r);
      const truncated = total > LIST_LIMIT;
      P.list.sub(truncated ? fmtInt(total) + ' possibilities — too many to list. Showing the first ' + fmtInt(LIST_LIMIT) + '.' : 'All ' + fmtInt(total) + (st.order ? ' ordered lists.' : ' groups.') + (st.ev !== 'none' ? ' Violet = in your event.' : ''));
      if (!st.order && !st.rep && r > 1 && fact(r) * total <= LIST_LIMIT) {
        body.appendChild(toggle({ label: 'Show the ' + r + '! = ' + fact(r) + ' orders hidden inside each group', value: st.showOrders, onChange: v => { st.showOrders = v; save(); drawList(it, r, total); drawProbOnly(); } }));
      }
      const grid = h('div', { class: 'cl-grid' + (st.showOrders && !st.order ? ' groups' : '') });
      const label = c => (st.order ? '(' + c.map(k => it[k]).join(', ') + ')' : '{' + c.map(k => it[k]).join(', ') + '}');
      all.slice(0, LIST_LIMIT).forEach((c, idx) => {
        const chip = h('span', { class: 'cl-chip', dataset: { idx } });
        if (st.showOrders && !st.order && !st.rep && r > 1) {
          chip.classList.add('grp');
          chip.appendChild(h('b', { text: label(c) }));
          const inner = h('span', { class: 'cl-orders' });
          for (const p of perms(c.map(k => it[k]), r, false)) inner.appendChild(h('i', { text: '(' + p.map(k => c.map(z => it[z])[k]).join(', ') + ')' }));
          chip.appendChild(inner);
        } else chip.textContent = label(c);
        grid.appendChild(chip);
      });
      body.appendChild(grid);
      P.listData = { all, it };
    }
    function drawProbOnly() { drawProb(); }
    function drawProb() {
      const body = P.prob.body;
      Lab.clear(body);
      const it = items(), n = it.length, r = st.r;
      const total = count(n, r);
      const chips = Lab.$$('.cl-chip', P.list.body);
      if (st.ev === 'none') {
        chips.forEach(c => c.classList.remove('in'));
        body.appendChild(h('p', { class: 'small muted', html: 'Choose an event in the controls (step 4). Every possibility is equally likely, so ' + Lab.tex('P(\\text{event})=\\frac{\\text{possibilities in the event}}{\\text{all possibilities}}') + '.' }));
        return;
      }
      if (!st.order && st.rep) { body.appendChild(h('p', { class: 'small muted', html: 'With repeats and no order, the groups are <b>not</b> equally likely if you pick items one by one (for example {A, A} can happen 1 way but {A, B} 2 ways), so "count ÷ total" would be wrong here. Switch to "Order matters" to count probabilities safely.' })); chips.forEach(c => c.classList.remove('in')); return; }
      // count favourable (exactly, by enumeration up to a limit; else by formula where easy)
      let fav = 0, exact = true;
      if (total <= 200000) {
        const gen = st.order ? perms(it, r, st.rep) : combs(n, r, st.rep);
        for (const c of gen) if (matches(c, it)) fav++;
      } else exact = false;
      const all = (P.listData && P.listData.all) || [];
      chips.forEach(ch => { const c = all[+ch.dataset.idx]; ch.classList.toggle('in', !!c && matches(c, it)); });
      if (!exact) { body.appendChild(h('p', { class: 'small muted', text: 'Too many possibilities to count one by one here — make n or r smaller.' })); return; }
      const f = total ? F(fav, total) : F(0);
      const a = it[st.ea], b = it[st.eb];
      const words = { contains: 'contains ' + a, without: 'does not contain ' + a, starts: 'starts with ' + a, ends: 'ends with ' + a, before: a + ' comes before ' + b, distinct: 'has no repeated item' }[st.ev];
      const box = h('div', { class: 'pl-answer small-answer' });
      Lab.setHTML(box, '<div class="pl-ans-ev">Event: the random ' + (st.order ? 'list' : 'group') + ' ' + Lab.esc(words) + '.</div><div class="pl-ans-big">' + Lab.tex('P=\\frac{' + fmtInt(fav).replace(/,/g, '{,}') + '}{' + fmtInt(total).replace(/,/g, '{,}') + '}' + (f.d !== total ? '=' + f.tex() : '') + '\\approx ' + Lab.fmtDec(Number(f), 4), true) + '</div><div class="pl-ans-sub">' + fmtInt(fav) + ' of the ' + fmtInt(total) + ' equally likely possibilities are in the event' + (total <= LIST_LIMIT ? ' (violet in the list above).' : '.') + '</div>');
      body.appendChild(box);
      // a short "why" for the classic cases
      let why = '';
      if (st.ev === 'starts' && !st.rep && r >= 1) why = 'Why: fix ' + a + ' in slot 1; the other ' + (r - 1) + ' slots are filled from the remaining ' + (n - 1) + ' items: ' + Lab.tex('{}^{' + (n - 1) + '}P_{' + (r - 1) + '}=' + Lab.math.perm(n - 1, r - 1)) + '. So ' + Lab.tex('P=\\frac{' + Lab.math.perm(n - 1, r - 1) + '}{' + total + '}=\\frac1{' + n + '}') + ' — every item is equally likely to come first.';
      if (st.ev === 'ends' && !st.rep && r >= 1) why = 'Why: fix ' + a + ' in the last slot (slot ' + r + '); the other ' + (r - 1) + ' slots are filled from the remaining ' + (n - 1) + ' items: ' + Lab.tex('{}^{' + (n - 1) + '}P_{' + (r - 1) + '}=' + Lab.math.perm(n - 1, r - 1)) + '. So ' + Lab.tex('P=\\frac{' + Lab.math.perm(n - 1, r - 1) + '}{' + total + '}=\\frac1{' + n + '}') + ' — every item is equally likely to come last.';
      if (st.ev === 'contains' && !st.rep && !st.order) why = 'Why: groups that contain ' + a + ' = choose the other ' + (r - 1) + ' from the remaining ' + (n - 1) + ': ' + Lab.tex('\\binom{' + (n - 1) + '}{' + (r - 1) + '}=' + Lab.math.choose(n - 1, r - 1)) + '. So ' + Lab.tex('P=\\frac{' + Lab.math.choose(n - 1, r - 1) + '}{' + total + '}=\\frac{' + r + '}{' + n + '}') + '.';
      if (st.ev === 'without' && !st.rep && !st.order) why = 'Why: groups without ' + a + ' choose all ' + r + ' from the other ' + (n - 1) + ': ' + Lab.tex('\\binom{' + (n - 1) + '}{' + r + '}=' + Lab.math.choose(n - 1, r)) + '. Check: this plus "contains" gives ' + total + '.';
      if (st.ev === 'before' && !st.rep && st.ea !== st.eb) why = 'Why: in the lists that contain both ' + a + ' and ' + b + ', half have ' + a + ' first and half have ' + b + ' first (swap them) — so among those lists the chance is exactly ½.';
      if (st.ev === 'distinct' && st.order) why = 'Why: lists with no repeats are the permutations: ' + Lab.tex('{}^{' + n + '}P_{' + r + '}=' + Lab.math.perm(n, r)) + ', out of ' + Lab.tex(n + '^{' + r + '}=' + total) + ' lists.';
      if (why) body.appendChild(h('p', { class: 'small', html: why }));
      Lab.renderMath(body);
    }
    return self;
  };
})();
