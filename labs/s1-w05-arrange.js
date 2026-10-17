/* Playground lab (s1-w05-arrange) — Statistics I, Week 5 (L5.1–L5.4).
   Tab 1 Rules: the addition rule (OR between disjoint cases) and the multiplication rule (AND between steps),
         with slots, a tree and every outcome; a factorial explorer (n! = n × (n−1)!, 0! = 1, n!/m!).
   Tab 2 Identical objects: a word or a bag of objects → n!/(p!q!…); label the copies to see why we divide;
         probability questions ("it starts with S").
   Tab 3 Circular: n people at a round table → (n−1)!; necklace (a flip is the same) → (n−1)!/2;
         rotate and flip a seating, list every distinct seating, "two people sit together".
   Rule 0 (LABS.md): every number says where it comes from — symbols first, then the learner's numbers.
   Every count is an exact BigInt (19! already passes 2^53). Styles: assets/css/labs/s4.css (prefix s4-). */
(function () {
  'use strict';
  const { h, svg } = Lab;
  const K = Lab.play;
  const ID = 'lab-s1-arrange';
  const KEY = 'lab:' + ID;
  const tx = (s, d) => Lab.tex(s, d);
  const esc = Lab.esc;
  const B = BigInt;
  const SAFE = 9007199254740991n; // 2^53 − 1: above this, ordinary JS numbers skip whole numbers

  /* ============================================================ exact integers */
  const FC = [1n];
  function fact(n) { for (let i = FC.length; i <= n; i++) FC[i] = FC[i - 1] * B(i); return FC[n]; }
  function choose(n, r) { if (r < 0 || r > n) return 0n; r = Math.min(r, n - r); let x = 1n; for (let i = 1; i <= r; i++) x = (x * B(n - r + i)) / B(i); return x; }
  function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }
  const prodB = arr => arr.reduce((a, v) => a * B(v), 1n);
  const grp = s => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  /** Integer as TeX with thin thousands separators. */
  const iT = v => grp(v).replace(/,/g, '{,}');
  /** Integer as text with commas. */
  const iH = v => grp(v);
  const plural = (k, w, ws) => iH(k) + ' ' + (String(k) === '1' ? w : ws || w + 's');
  const clone = o => JSON.parse(JSON.stringify(o));
  /** '\\approx 2.6525\\times 10^{32}' for integers with 8 or more digits, else ''. */
  function sci(v) {
    const s = B(v).toString();
    if (s.length < 8) return '';
    const d = s.length;
    let m = (B(s) + 5n * 10n ** B(d - 6)) / 10n ** B(d - 5);
    let e = d - 1;
    let ms = m.toString();
    if (ms.length > 5) { ms = ms.slice(0, 5); e++; }
    return '\\approx ' + ms[0] + '.' + ms.slice(1) + '\\times 10^{' + e + '}';
  }
  /** The note every page shows when a count passes 2^53. */
  function bigNote(...vals) {
    if (!vals.some(v => B(v) > SAFE)) return '';
    return '<div class="s4-bignote">Exact big integers: ' + tx('2^{53}\\approx 9.007\\times 10^{15}') + ' is the largest size up to which ordinary JavaScript numbers hold every whole number. Your count is bigger, so this lab computes it with BigInt — every digit shown is exact.</div>';
  }
  /** n/d as a JS number, also when n and d are far beyond 2^53. */
  function ratioNum(n, d) {
    if (n === 0n) return 0;
    const sh = d.toString().length - n.toString().length + 18;
    const q = sh >= 0 ? (n * 10n ** B(sh)) / d : n / (d * 10n ** B(-sh));
    return Number(q) / Math.pow(10, sh);
  }
  /** The decimal tail of n/d: '=0.25', '\\approx 0.3636', '' for whole numbers. */
  function decTail(n, d) {
    if (d === 0n || n % d === 0n) return '';
    const v = ratioNum(n, d);
    if (v < 1e-4) { const [m, e] = v.toExponential(3).split('e'); return '\\approx ' + m + '\\times 10^{' + parseInt(e, 10) + '}'; }
    const S = 10000n;
    const exact = (n * S) % d === 0n;
    const r = (2n * n * S + d) / (2n * d);
    let s = r.toString().padStart(5, '0');
    s = s.slice(0, -4) + '.' + s.slice(-4);
    if (exact) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return (exact ? '=' : '\\approx ') + s;
  }
  /** '\\frac{12600}{34650}=\\frac{4}{11}\\approx 0.3636' */
  function fracFull(n, d) {
    n = B(n); d = B(d);
    const g = gcd(n, d) || 1n;
    let s = '\\frac{' + iT(n) + '}{' + iT(d) + '}';
    if (g !== 1n) s += '=' + (d / g === 1n ? iT(n / g) : '\\frac{' + iT(n / g) + '}{' + iT(d / g) + '}');
    return s + decTail(n, d);
  }
  /** hi × (hi−1) × ⋯ × lo as TeX (shortened with ⋯ when long). */
  function downTex(hi, lo) {
    if (hi < lo) return '1';
    const k = hi - lo + 1;
    if (k <= 8) { const a = []; for (let v = hi; v >= lo; v--) a.push(v); return a.join('\\times '); }
    return hi + '\\times ' + (hi - 1) + '\\times ' + (hi - 2) + '\\times\\cdots\\times ' + (lo + 1) + '\\times ' + lo;
  }
  /** Rough printed width of a TeX string (commands count as one character). */
  const plainLen = t => String(t).replace(/\{,\}/g, ',').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\\]/g, '').length;
  /** lhs = parts[0] = parts[1] = …, broken over aligned lines when it would not fit (big = answer box size). */
  function eqChain(lhs, parts, big) {
    parts = parts.filter(p => p !== '' && p != null);
    const narrow = typeof window !== 'undefined' && window.innerWidth < 600;
    const max = big ? (narrow ? 20 : 46) : (narrow ? 30 : 72);
    const one = (lhs ? lhs + '=' : '') + parts.join('=');
    if (plainLen(one) <= max || parts.length < 2) return one;
    const lines = [];
    let cur = '';
    parts.forEach(p => {
      const cand = cur ? cur + '=' + p : p;
      if (cur && plainLen((lines.length ? '' : lhs + '=') + cand) > max) { lines.push(cur); cur = p; } else cur = cand;
    });
    lines.push(cur);
    // a line that is still too long is broken at its top-level + signs
    const out = lines.map(l => {
      if (plainLen(l) <= max) return l;
      const bits = splitTop(l, '+');
      if (bits.length < 2) return l;
      const sub = [];
      let c2 = '';
      bits.forEach(b => { const cand = c2 ? c2 + '+' + b : b; if (c2 && plainLen(cand) > max) { sub.push(c2); c2 = b; } else c2 = cand; });
      sub.push(c2);
      return sub.join('\\\\&\\quad+');
    });
    return '\\begin{aligned}' + (lhs ? lhs + '&=' : '&') + out[0] + out.slice(1).map(l => '\\\\&=' + l).join('') + '\\end{aligned}';
  }
  /** Split a TeX string at a character that is not inside {…} or (…). */
  function splitTop(s, ch) {
    const out = [];
    let depth = 0, cur = '';
    for (const c of s) {
      if (c === '{' || c === '(') depth++;
      if (c === '}' || c === ')') depth--;
      if (c === ch && depth === 0) { out.push(cur); cur = ''; } else cur += c;
    }
    out.push(cur);
    return out;
  }
  /** Product of factorials of the counts, as TeX: 1!\\,3!\\,2! — or grouped, (2!)^{4}\\,(1!)^{22}, when there are many. */
  function facTex(cs) {
    if (cs.length <= 6) return cs.map(c => c + '!').join('\\,');
    const m = new Map();
    cs.forEach(c => m.set(c, (m.get(c) || 0) + 1));
    return [...m.entries()].sort((x, y) => y[0] - x[0]).map(([c, k]) => (k === 1 ? c + '!' : '(' + c + '!)^{' + k + '}')).join('\\,');
  }
  /** The same product with each factorial's value: 1\\times 6\\times 2 — or (2)^{4}\\times(1)^{22}. */
  function facVals(cs) {
    if (cs.length <= 6) return cs.map(c => iT(fact(c))).join('\\times ');
    const m = new Map();
    cs.forEach(c => m.set(c, (m.get(c) || 0) + 1));
    return [...m.entries()].sort((x, y) => y[0] - x[0]).map(([c, k]) => (k === 1 ? iT(fact(c)) : iT(fact(c)) + '^{' + k + '}')).join('\\times ');
  }
  /** An exact integer for running text: TeX when short, otherwise plain digits that may wrap on a phone. */
  const numIn = v => (String(v).length <= 15 ? tx(iT(v)) : '<span class="s4-longnum">' + iH(v) + '</span>');
  function stale(box, msg) { box.hidden = !msg; if (msg) Lab.setHTML(box, msg); }
  function showSource(pre, items, label) {
    const i = items.findIndex(it => it.label === label);
    const hint = pre.querySelector('.pl-hint');
    if (i >= 0) { pre.select.value = String(i); Lab.setHTML(hint, 'From: ' + items[i].source); }
    else { pre.select.value = ''; Lab.setHTML(hint, ''); }
  }
  function iconBtn(label, onClick) {
    const b = h('button', { class: 'icon-btn s4-del', type: 'button', html: Lab.icon('x'), 'aria-label': label, title: label });
    b.addEventListener('click', onClick);
    return b;
  }
  const resetBtn = fn => h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', fn, 'btn ghost sm'));

  /* ============================================================ state */
  const RULE_PRESETS = [
    { label: 'L5.1 Gift card: a shirt OR a pant', source: 'L5.1 (basic principles of counting). The gift card buys one item: a shirt (yellow, blue, green, red) or a pant (black, blue, brown). Addition rule: 4 + 3 = 7.',
      cases: [{ name: 'buy a shirt', steps: [{ name: 'shirt', ch: 'yellow, blue, green, red' }] }, { name: 'buy a pant', steps: [{ name: 'pant', ch: 'black, blue, brown' }] }] },
    { label: 'L5.1 Gift card: a shirt AND a pant', source: 'L5.1. Now the card buys one shirt and one pant. Multiplication rule: 4 × 3 = 12 — the lecture draws this tree.',
      cases: [{ name: '', steps: [{ name: 'shirt', ch: 'yellow, blue, green, red' }, { name: 'pant', ch: 'black, blue, brown' }] }] },
    { label: 'L5.1 Shirt AND pant AND shoes', source: 'L5.1. Add a pair of shoes, black or brown: 4 × 3 × 2 = 24.',
      cases: [{ name: '', steps: [{ name: 'shirt', ch: 'yellow, blue, green, red' }, { name: 'pant', ch: 'black, blue, brown' }, { name: 'shoes', ch: 'black, brown' }] }] },
    { label: 'L5.1 Password: 2 letters, then 4 digits (repeats allowed)', source: 'L5.1. A 6-place code: letters A–Z (26 choices) in places 1–2, digits 0–9 (10 choices) in places 3–6: 26 × 26 × 10 × 10 × 10 × 10 = 6,760,000.',
      cases: [{ name: '', steps: [{ name: 'letter 1', ch: '26' }, { name: 'letter 2', ch: '26' }, { name: 'digit 1', ch: '10' }, { name: 'digit 2', ch: '10' }, { name: 'digit 3', ch: '10' }, { name: 'digit 4', ch: '10' }] }] },
    { label: 'L5.1 Same password, no repeats', source: 'L5.1. A letter or digit already used cannot come back: 26 × 25 × 10 × 9 × 8 × 7 = 3,276,000.',
      cases: [{ name: '', steps: [{ name: 'letter 1', ch: '26' }, { name: 'letter 2', ch: '25' }, { name: 'digit 1', ch: '10' }, { name: 'digit 2', ch: '9' }, { name: 'digit 3', ch: '8' }, { name: 'digit 4', ch: '7' }] }] },
    { label: 'L5.2 Order of finish of 8 runners', source: 'L5.2 (factorials). 8 different runners, no ties: 8 × 7 × 6 × 5 × 4 × 3 × 2 × 1 = 8! = 40,320.',
      cases: [{ name: '', steps: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'].map((w, k) => ({ name: w + ' place', ch: String(8 - k) })) }] },
    { label: 'L5.3 Chairman and vice-chairman from 8', source: 'L5.3 (permutations). A committee of 8; one person cannot hold both posts: 8 × 7 = 56.',
      cases: [{ name: '', steps: [{ name: 'chairman', ch: '8' }, { name: 'vice-chairman', ch: '7' }] }] },
    { label: 'L5.3 Even 4-digit numbers from 1–5, no repeats', source: 'L5.3. The last digit must be 2 or 4 (two cases). Fix it, then fill the other 3 places from the 4 digits left: 4 × 3 × 2 = 24 in each case, 24 + 24 = 48.',
      cases: [{ name: 'last digit is 2', steps: [{ name: 'last digit', ch: 'the digit 2' }, { name: '1st digit', ch: '4' }, { name: '2nd digit', ch: '3' }, { name: '3rd digit', ch: '2' }] },
        { name: 'last digit is 4', steps: [{ name: 'last digit', ch: 'the digit 4' }, { name: '1st digit', ch: '4' }, { name: '2nd digit', ch: '3' }, { name: '3rd digit', ch: '2' }] }] },
  ];
  const SAME_PRESETS = [
    { label: 'L5.4 DATA', text: 'DATA', ev: 'start', a: 'A', b: 'D', source: 'L5.4 (objects not distinct). Label the two A’s as A₁ and A₂: 4! = 24 orders, and they pair up, so 4!/2! = 12.' },
    { label: 'L5.4 STATISTICS', text: 'STATISTICS', ev: 'start', a: 'S', b: 'T', source: 'L5.4. n = 10 letters: S × 3, T × 3, A × 1, I × 2, C × 1, so 10!/(3!·3!·1!·2!·1!) = 50,400.' },
    { label: 'L5.3 2 red balls and 1 blue ball', text: '2 red, 1 blue balls', ev: 'start', a: 'blue', b: 'red', source: 'L5.3 names this as the first example of objects that are not all distinct: 3!/2! = 3 arrangements.' },
    { label: 'Practice: MISSISSIPPI', text: 'MISSISSIPPI', ev: 'start', a: 'S', b: 'I', source: 'A classic practice word (not from the lecture): 11!/(1!·4!·4!·2!) = 34,650.' },
    { label: 'Practice: BANANA', text: 'BANANA', ev: 'start', a: 'A', b: 'N', source: 'Practice word (not from the lecture): 6!/(1!·3!·2!) = 60.' },
    { label: 'Practice: 3 red, 2 blue balls', text: '3 red, 2 blue balls', ev: 'together', a: 'red', b: 'blue', source: 'Practice (not from the lecture): 5!/(3!·2!) = 10 rows of balls.' },
  ];
  const CIRCLE_PRESETS = [
    { label: 'L5.4 Round table: A, B, C, D', n: 4, names: 'A, B, C, D', mode: 'table', source: 'L5.4 (circular permutations). Clockwise and anticlockwise are different: fix A, arrange B, C, D in 3! = 6 ways.' },
    { label: 'L5.4 Same, clockwise = anticlockwise', n: 4, names: 'A, B, C, D', mode: 'necklace', source: 'L5.4. When a seating and its mirror image count as one: (4 − 1)!/2 = 3.' },
    { label: 'Practice: 5 friends at a round table', n: 5, names: 'Ann, Ben, Cara, Dev, Eli', mode: 'table', source: 'Practice (not from the lecture): (5 − 1)! = 4! = 24 seatings.' },
    { label: 'Practice: a necklace of 6 different beads', n: 6, names: 'red, blue, green, gold, pink, white', mode: 'necklace', source: 'Practice (not from the lecture): a necklace can be turned over, so (6 − 1)!/2 = 60.' },
  ];
  const LETTERS = 'ABCDEFGHIJKL'.split('');
  function defaults() {
    return {
      tab: 'rules',
      rules: { cases: clone(RULE_PRESETS[1].cases), src: RULE_PRESETS[1].label, fn: 6, fm: 3 },
      same: { text: 'BANANA', ev: 'start', a: 'A', b: 'N', k: 2, pick: '', groups: false, src: 'Practice: BANANA' },
      circle: { n: 4, names: 'A, B, C, D', mode: 'table', seat: [0, 1, 2, 3], ev: 'adj', a: 0, b: 1, src: CIRCLE_PRESETS[0].label },
    };
  }
  function loadState() {
    const d = defaults();
    const got = Lab.store.get(KEY, null) || {};
    const st = { tab: ['rules', 'same', 'circle'].includes(got.tab) ? got.tab : d.tab };
    st.rules = Object.assign(d.rules, got.rules || {});
    const okCases = Array.isArray(st.rules.cases) && st.rules.cases.length >= 1 && st.rules.cases.length <= 4 &&
      st.rules.cases.every(c => c && Array.isArray(c.steps) && c.steps.length >= 1 && c.steps.length <= 8 && c.steps.every(s => s && typeof s.ch === 'string'));
    if (!okCases || !Number.isInteger(st.rules.fn) || !Number.isInteger(st.rules.fm)) st.rules = defaults().rules;
    st.same = Object.assign(d.same, got.same || {});
    if (typeof st.same.text !== 'string') st.same = defaults().same;
    st.circle = Object.assign(d.circle, got.circle || {});
    const c = st.circle;
    if (!Number.isInteger(c.n) || c.n < 2 || c.n > 12 || !Array.isArray(c.seat) || c.seat.length !== c.n || new Set(c.seat).size !== c.n || c.seat.some(v => !(v >= 0 && v < c.n))) st.circle = defaults().circle;
    return st;
  }

  /* ================================================================ TAB 1 — RULES */
  /** A step's choices: a whole number (26) or names (yellow, blue, red). */
  function parseChoices(s) {
    s = String(s == null ? '' : s).trim();
    if (!s) return { err: 'Type a number of choices (e.g. 4) or their names (e.g. red, blue).' };
    if (/^\d+$/.test(s)) {
      const n = parseInt(s, 10);
      if (n < 1 || n > 1000000) return { err: 'Choose from 1 to 1,000,000 options.' };
      return { n, names: null };
    }
    const names = s.split(',').map(x => x.trim()).filter(Boolean);
    if (!names.length) return { err: 'Type a number or some names separated by commas.' };
    if (names.length > 60) return { err: 'At most 60 names — type a number instead.' };
    if (new Set(names.map(x => x.toLowerCase())).size !== names.length) return { err: 'Each option should appear once (two equal names are one option).' };
    return { n: names.length, names };
  }
  function evalCases(cases) {
    const out = { cases: [], ok: true };
    cases.forEach(c => {
      const steps = c.steps.map(s => Object.assign({ name: String(s.name || '').trim() }, parseChoices(s.ch)));
      if (steps.some(s => s.err)) out.ok = false;
      out.cases.push({ name: String(c.name || '').trim(), steps });
    });
    if (!out.ok) return out;
    out.cases.forEach(c => { c.total = c.steps.reduce((a, s) => a * B(s.n), 1n); });
    out.total = out.cases.reduce((a, c) => a + c.total, 0n);
    out.multi = out.cases.length > 1;
    return out;
  }
  const stepName = (s, si) => (s.name ? esc(s.name) : 'step ' + (si + 1));
  const caseName = (c, ci) => (c.name ? esc(c.name) : 'case ' + (ci + 1));

  function rulesTab({ side, main, st, save, restart }) {
    const S = st.rules;
    let R = null;
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: RULE_PRESETS, onPick: it => { S.cases = clone(it.cases); S.src = it.label; save(); buildEditor(); draw(); } });
    side.appendChild(pre);
    showSource(pre, RULE_PRESETS, S.src);
    side.appendChild(K.group('2 · Your task'));
    side.appendChild(K.note('Inside a case the steps are joined by <b>AND</b> (every step happens) → <b>multiply</b>. Different cases are joined by <b>OR</b> (exactly one case happens) → <b>add</b>. Type a step’s choices as a number (<code>26</code>) or as names (<code>yellow, blue, red</code>).'));
    const editor = h('div', { class: 's4-editor' });
    side.appendChild(editor);
    side.appendChild(resetBtn(() => restart('rules')));

    const P = {};
    P.stale = h('div', { class: 's4-stale', hidden: true });
    P.answer = K.answer();
    P.slots = K.panel('Slots: one box per step', 'Each box holds the number of choices for that step. × between steps (AND); + between cases (OR).');
    P.tree = K.panel('The tree: one path per outcome', 'Read a path from left to right: one branch per step. The number of leaves is the number of outcomes.');
    P.calc = K.panel('How the total is computed, with your numbers');
    P.list = K.panel('Every outcome');
    P.fact = K.panel('Factorial explorer', 'When every step uses up one of the objects (no repeats), the choices go ' + tx('n, n-1, \\dots, 1') + ' and the product has a name: ' + tx('n!') + ' (L5.2).');
    main.append(P.stale, P.answer, P.slots, P.tree, P.calc, P.list, P.fact);
    const drawSoon = Lab.debounce(() => draw(), 180);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, RULE_PRESETS, ''); } save(); };

    function buildEditor() {
      Lab.clear(editor);
      const multi = S.cases.length > 1;
      S.cases.forEach((c, ci) => {
        const box = h('div', { class: 's4-case' + (multi ? ' multi' : '') });
        const head = h('div', { class: 's4-case-head' }, h('span', { class: 's4-case-tag', text: multi ? 'Case ' + (ci + 1) : 'Steps (AND)' }));
        if (multi) {
          const nm = h('input', { class: 'field s4-in', value: c.name || '', placeholder: 'name, e.g. buy a shirt', maxlength: '28', spellcheck: 'false', 'aria-label': 'name of case ' + (ci + 1) });
          nm.addEventListener('input', () => { c.name = nm.value; touched(); drawSoon(); });
          head.append(nm, iconBtn('remove case ' + (ci + 1), () => { S.cases.splice(ci, 1); touched(); buildEditor(); draw(); }));
        }
        box.appendChild(head);
        c.steps.forEach((s, si) => {
          const nm = h('input', { class: 'field s4-in', value: s.name || '', placeholder: 'step ' + (si + 1), maxlength: '24', spellcheck: 'false', 'aria-label': 'name of step ' + (si + 1) });
          const ch = h('input', { class: 'field mono s4-in s4-ch', value: s.ch, placeholder: '4  or  a, b, c', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'choices for step ' + (si + 1) });
          const msg = h('div', { class: 'pl-hint s4-stepmsg' });
          const check = () => {
            const p = parseChoices(ch.value);
            ch.classList.toggle('bad', !!p.err);
            Lab.setHTML(msg, p.err ? '<span class="cbad">' + esc(p.err) + '</span>' : p.names ? plural(p.n, 'option') + ': ' + esc(p.names.join(', ')) : '');
          };
          nm.addEventListener('input', () => { s.name = nm.value; touched(); drawSoon(); });
          ch.addEventListener('input', () => { s.ch = ch.value; check(); touched(); drawSoon(); });
          check();
          const del = c.steps.length > 1 ? iconBtn('remove step ' + (si + 1), () => { c.steps.splice(si, 1); touched(); buildEditor(); draw(); }) : h('span', { class: 's4-del-pad' });
          box.append(h('div', { class: 's4-step' }, h('span', { class: 's4-step-k', text: String(si + 1) }), nm, ch, del), msg);
        });
        if (c.steps.length < 8) box.appendChild(h('div', { class: 'pl-chips' }, Lab.button('+ step (AND, ×)', () => { c.steps.push({ name: '', ch: '2' }); touched(); buildEditor(); draw(); }, 'btn xs')));
        editor.appendChild(box);
        if (ci < S.cases.length - 1) editor.appendChild(h('div', { class: 's4-or', html: '<b>OR</b> <span>— the cases cannot both happen → add</span>' }));
      });
      if (S.cases.length < 4) editor.appendChild(h('div', { class: 'pl-chips' }, Lab.button('+ case (OR, +)', () => { S.cases.push({ name: '', steps: [{ name: '', ch: '3' }] }); touched(); buildEditor(); draw(); }, 'btn xs')));
    }

    function draw() {
      const r = evalCases(S.cases);
      if (!r.ok) { stale(P.stale, 'Fix the red boxes in the controls. The pictures below still show your last complete task.'); return; }
      stale(P.stale, '');
      R = r;
      drawAnswer(); drawSlots(); drawTree(); drawCalc(); drawList();
    }
    function caseProd(c) { return c.steps.map(s => iT(s.n)).join('\\times '); }
    function drawAnswer() {
      const cs = R.cases;
      let ev, big, sub;
      const sc = sci(R.total);
      if (!R.multi) {
        const c = cs[0];
        ev = 'Your task: ' + c.steps.map((s, si) => '<b>' + stepName(s, si) + '</b>').join(' AND ') + ' — every step happens, one choice at each.';
        const sym = c.steps.map((s, si) => 'n_{' + (si + 1) + '}').join('\\times ');
        big = eqChain('N', [sym, c.steps.length > 1 ? caseProd(c) : '', iT(R.total) + sc], true);
        sub = (c.steps.length > 1 ? 'Multiplication rule (L5.1): ' + c.steps.length + ' steps with ' + c.steps.map(s => iH(s.n)).join(', ') + ' choices give ' + iH(R.total) + ' outcomes.' : 'One step with ' + plural(c.steps[0].n, 'choice') + ', so ' + plural(R.total, 'outcome') + '.');
      } else {
        ev = 'Your task: exactly one of ' + cs.length + ' cases — ' + cs.map((c, ci) => '<b>' + caseName(c, ci) + '</b>').join(' OR ') + '. Inside a case, every step happens.';
        const sym = cs.map((c, ci) => 'N_{' + (ci + 1) + '}').join('+');
        const nums = cs.map(c => (c.steps.length > 1 ? '(' + caseProd(c) + ')' : iT(c.total))).join('+');
        const tots = cs.map(c => iT(c.total)).join('+');
        big = eqChain('N', [sym, nums, cs.some(c => c.steps.length > 1) ? tots : '', iT(R.total) + sc], true);
        sub = 'Multiplication rule inside each case, then the addition rule across the ' + cs.length + ' cases (they are disjoint: one outcome cannot be in two cases): ' + cs.map(c => iH(c.total)).join(' + ') + ' = ' + iH(R.total) + ' outcomes.';
      }
      K.setAnswer(P.answer, { ev, big, sub: sub + bigNote(R.total) });
    }
    function drawSlots() {
      const body = P.slots.body;
      Lab.clear(body);
      R.cases.forEach((c, ci) => {
        if (R.multi) body.appendChild(h('div', { class: 's4-slothead', html: '<b>Case ' + (ci + 1) + '</b> · ' + caseName(c, ci) }));
        const row = h('div', { class: 'sl-row s4-slots' });
        c.steps.forEach((s, si) => {
          if (si) row.appendChild(h('span', { class: 'sl-times s4-and', html: '×<i>AND</i>' }));
          const slot = h('div', { class: 'sl-slot s4-slot', title: s.names ? s.names.join(', ') : plural(s.n, 'choice') },
            h('div', { class: 'sl-num', text: iH(s.n) }),
            h('div', { class: 'sl-cap', html: stepName(s, si) + '<br>' + tx('n_{' + (si + 1) + '}') }));
          row.appendChild(slot);
        });
        row.appendChild(h('span', { class: 'sl-times', text: '=' }));
        row.appendChild(h('div', { class: 'sl-total' }, h('b', { text: iH(c.total) }), h('span', { text: R.multi ? 'outcomes in case ' + (ci + 1) : 'outcomes' })));
        body.appendChild(h('div', { class: 'sl-scroll' }, row));
        if (R.multi && ci < R.cases.length - 1) body.appendChild(h('div', { class: 's4-plus', html: '<b>+</b> OR — addition rule' }));
      });
      if (R.multi) body.appendChild(h('div', { class: 's4-sum', html: tx('N=' + R.cases.map(c => iT(c.total)).join('+') + '=' + iT(R.total)) + ' outcomes in all.' }));
      Lab.renderMath(body);
    }
    function drawTree() {
      const body = P.tree.body;
      Lab.clear(body);
      const LIM = 36;
      const full = R.total <= B(LIM);
      // build: every branch when small; otherwise open only the first branch at each level
      const root = { kids: [], depth: 0, path: [] };
      let maxDepth = 0;
      function grow(nd, c, si) {
        if (si === c.steps.length) return;
        const st2 = c.steps[si];
        const below = c.steps.slice(si + 1).reduce((a, x) => a * B(x.n), 1n);
        const lab = k => (st2.names ? st2.names[k] : '#' + (k + 1));
        const ks = full || st2.n <= 4 ? Array.from({ length: st2.n }, (_, k) => k) : [0, 1, st2.n - 1];
        ks.forEach((k, j) => {
          if (!full && st2.n > 4 && j === 2) nd.kids.push({ kind: 'more', count: st2.n - 3, below, last: si === c.steps.length - 1, depth: nd.depth + 1, kids: [], path: [] });
          const ch = { label: lab(k), kids: [], depth: nd.depth + 1, path: nd.path.concat(lab(k)) };
          nd.kids.push(ch);
          if (full || k === 0) grow(ch, c, si + 1);
          else if (si + 1 < c.steps.length) { ch.stub = true; ch.below = below; }
        });
      }
      R.cases.forEach((c, ci) => {
        let top = root;
        if (R.multi) { top = { label: c.name || 'case ' + (ci + 1), kind: 'case', kids: [], depth: 1, path: [] }; root.kids.push(top); }
        grow(top, c, 0);
        maxDepth = Math.max(maxDepth, (R.multi ? 1 : 0) + c.steps.length);
      });
      const rowH = 23, top0 = 12;
      let li = 0, leaves = 0;
      (function lay(nd) {
        if (!nd.kids.length) { nd.y = top0 + rowH * li + rowH / 2; li++; if (!nd.stub && nd.kind !== 'more' && nd !== root) leaves++; return; }
        nd.kids.forEach(lay);
        const real = nd.kids.filter(k => k.kind !== 'more');
        nd.y = (real[0].y + real[real.length - 1].y) / 2;
      })(root);
      const Wd = 760, X0 = 14, labW = 270;
      const colW = Math.min(140, (Wd - X0 - labW) / Math.max(1, maxDepth));
      const xAt = d => X0 + d * colW;
      const xl = xAt(maxDepth) + 14;
      const Ht = top0 * 2 + rowH * li;
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + Ht, class: 's4-tree', role: 'img', 'aria-label': full ? 'tree with ' + li + ' leaves' : 'tree with the first branch opened' });
      const edges = svg('g'), nodes = svg('g'), labels = svg('g');
      s.append(edges, nodes, labels);
      (function walk(nd) {
        nd.kids.forEach(ch => {
          const x1 = xAt(nd.depth), x2 = xAt(ch.depth);
          if (ch.kind === 'more') {
            labels.appendChild(svg('text', { x: x2 - 2, y: ch.y + 4, class: 's4-tr-more' }, '⋮ ' + iH(ch.count) + ' more ' + (ch.last ? (ch.count === 1 ? 'leaf' : 'leaves') : (ch.count === 1 ? 'branch' : 'branches') + ', each → ' + iH(ch.below) + ' paths')));
            return;
          }
          edges.appendChild(svg('path', { d: 'M' + x1 + ',' + nd.y + ' C' + (x1 + colW * 0.5) + ',' + nd.y + ' ' + (x2 - colW * 0.5) + ',' + ch.y + ' ' + x2 + ',' + ch.y, class: 's4-tr-edge' + (ch.stub ? ' stub' : '') }));
          if (ch.kind === 'case') {
            labels.appendChild(svg('text', { x: x2 + 8, y: ch.y - 6, class: 's4-tr-case' }, String(ch.label).slice(0, 18)));
            nodes.appendChild(svg('circle', { cx: x2, cy: ch.y, r: 5, class: 's4-tr-cnode' }));
          } else {
            nodes.appendChild(svg('circle', { cx: x2, cy: ch.y, r: 3.6, class: 's4-tr-node' + (ch.stub ? ' stub' : '') }));
            if (ch.kids.length || ch.stub) labels.appendChild(svg('text', { x: x2 + 6, y: ch.y - 6, class: 's4-tr-lab' }, String(ch.label).slice(0, 12)));
          }
          walk(ch);
        });
        if (!nd.kids.length && nd !== root && nd.kind !== 'more') {
          if (nd.depth < maxDepth) edges.appendChild(svg('line', { x1: xAt(nd.depth) + 5, x2: xl - 4, y1: nd.y, y2: nd.y, class: 's4-tr-dot' }));
          if (nd.stub) labels.appendChild(svg('text', { x: xl, y: nd.y + 4, class: 's4-tr-stub' }, '… ' + iH(nd.below) + ' paths, shaped like the open branch'));
          else labels.appendChild(svg('text', { x: xl, y: nd.y + 4, class: 's4-tr-leaf' }, '(' + nd.path.join(', ') + ')'));
        }
      })(root);
      nodes.appendChild(svg('circle', { cx: xAt(0), cy: root.y, r: 4.5, class: 's4-tr-root' }));
      body.appendChild(h('div', { class: 's4-scroll' }, s));
      const hash = R.cases.some(c => c.steps.some(st2 => !st2.names)) ? ' A label like #3 means “the 3rd choice of that step” (you typed a number, not names).' : '';
      if (full) body.appendChild(K.note('Count the leaves: ' + plural(li, 'path') + ' = ' + tx('N=' + iT(R.total)) + '.' + hash, 'small muted'));
      else body.appendChild(K.note('The whole tree has ' + plural(R.total, 'leaf', 'leaves') + ' — too many to draw (the limit is ' + LIM + '). So only the <b>first</b> branch at each level is opened; every closed branch hides a copy of it, and says how many paths it holds. The ' + plural(leaves, 'leaf', 'leaves') + ' drawn on the right are the first outcomes.' + hash, 'small muted'));
    }
    function drawCalc() {
      const body = P.calc.body;
      Lab.clear(body);
      const steps = [];
      R.cases.forEach((c, ci) => {
        const head = R.multi ? '<b>Case ' + (ci + 1) + '</b> (' + caseName(c, ci) + '). ' : '';
        const list = c.steps.map((s, si) => tx('n_{' + (si + 1) + '}=' + iT(s.n)) + ' (' + stepName(s, si) + (s.names && s.n <= 8 ? ': ' + esc(s.names.join(', ')) : '') + ')').join(', ');
        const Nn = R.multi ? 'N_{' + (ci + 1) + '}' : 'N';
        if (c.steps.length === 1) {
          steps.push({ html: head + 'One step: ' + list + '. So ' + tx(Nn + '=n_{1}=' + iT(c.total)) + '.' });
        } else {
          let paths = 1n;
          const rows = c.steps.map((s, si) => {
            const prev = paths; paths *= B(s.n);
            return [String(si + 1) + ' · ' + stepName(s, si), tx('n_{' + (si + 1) + '}=' + iT(s.n)), tx(si === 0 ? iT(s.n) : iT(prev) + '\\times ' + iT(s.n) + '=' + iT(paths))];
          });
          steps.push({ html: head + 'Steps joined by AND: ' + list + '. Every choice at one step can be followed by every choice at the next, so the number of paths is multiplied at each step (multiplication rule, L5.1):',
            math: Nn + '=' + c.steps.map((s, si) => 'n_{' + (si + 1) + '}').join('\\times ') + '=' + caseProd(c) + '=' + iT(c.total) + sci(c.total),
            block: tableEl(['step', 'choices', 'paths after this step'], rows, 's4-ltab') });
        }
      });
      if (R.multi) {
        steps.push({ html: 'The ' + R.cases.length + ' cases are joined by OR: every outcome belongs to exactly one case (they are <b>disjoint</b>), so add (addition rule, L5.1):',
          math: 'N=' + R.cases.map((c, ci) => 'N_{' + (ci + 1) + '}').join('+') + '=' + R.cases.map(c => iT(c.total)).join('+') + '=' + iT(R.total) + sci(R.total),
          note: 'Careful: the addition rule needs disjoint cases. If one outcome could sit in two of your cases, the sum would count it twice.' });
      }
      // numbers typed as counts that go down by one (8, 7, 6, …): the product is a factorial ratio
      const c0 = R.cases[0];
      if (!R.multi && c0.steps.length >= 2 && c0.steps.every(s => !s.names) && c0.steps.every((s, si, a) => si === 0 || s.n === a[si - 1].n - 1) && c0.steps[0].n <= 200) {
        const n0 = c0.steps[0].n, last = c0.steps[c0.steps.length - 1].n, k = c0.steps.length;
        steps.push({ html: 'Your numbers go down by one (' + n0 + ', ' + (n0 - 1) + ', …, ' + last + ') — what happens when each step uses up one of ' + n0 + ' different objects. The product then has a short name: ' + (last === 1 ? tx(n0 + '!') + ' (L5.2)' : tx('\\frac{' + n0 + '!}{' + (last - 1) + '!}={}^{' + n0 + '}P_{' + k + '}') + ' (L5.3)') + '.', math: (last === 1 ? n0 + '!=' : '\\frac{' + n0 + '!}{' + (last - 1) + '!}=') + downTex(n0, last) + '=' + iT(R.total) });
      }
      body.appendChild(K.steps(steps));
      const bn = bigNote(R.total);
      if (bn) body.appendChild(h('div', { html: bn }));
    }
    function drawList() {
      const body = P.list.body;
      Lab.clear(body);
      const LIM = 400;
      const all = [];
      R.cases.forEach((c, ci) => {
        const idx = c.steps.map(() => 0);
        if (all.length >= LIM) return;
        for (;;) {
          all.push({ ci, t: c.steps.map((s, si) => (s.names ? s.names[idx[si]] : '#' + (idx[si] + 1))) });
          if (all.length >= LIM) break;
          let k = idx.length - 1;
          while (k >= 0 && idx[k] === c.steps[k].n - 1) { idx[k] = 0; k--; }
          if (k < 0) break;
          idx[k]++;
        }
      });
      P.list.sub(R.total > B(LIM) ? 'Your task has ' + plural(R.total, 'outcome') + ' — showing the first ' + LIM + '.' : 'All ' + plural(R.total, 'outcome') + (R.multi ? ', case by case (colours show the case).' : '.'));
      const g = h('div', { class: 'cl-grid' });
      all.forEach(o => g.appendChild(h('span', { class: 'cl-chip s4-oc s4-c' + o.ci, text: '(' + o.t.join(', ') + ')' })));
      body.appendChild(g);
    }

    buildEditor();
    draw();
    factExplorer(P.fact.body, S, save);
  }

  /** A small HTML table (cells may hold rendered TeX). */
  function tableEl(head, rows, cls) {
    const t = h('table', { class: 'tbl ' + (cls || '') });
    if (head) t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach(r => tb.appendChild(h('tr', { class: r.hl ? 'hl-row' : null }, (r.cells || r).map(c => h('td', { html: c })))));
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap' }, t);
  }

  /* ------------------------------------------------------------ factorial explorer */
  function factExplorer(body, S, save) {
    const out = h('div', { class: 's4-fact' });
    const nF = K.numField({ label: 'Your ' + tx('n') + ' (0 to 60)', min: 0, max: 60, value: S.fn, onChange: v => { S.fn = v; S.fm = mF.setRange(0, v); save(); paint(); } });
    const mF = K.numField({ label: 'Split point ' + tx('m') + ' (0 to ' + tx('n') + ')', min: 0, max: S.fn, value: Math.min(S.fm, S.fn), hint: tx('n!=n(n-1)\\cdots(m+1)\\times m!'), onChange: v => { S.fm = v; save(); paint(); } });
    const chips = h('div', { class: 'pl-chips' });
    [['L5.2 8 runners: 8!', 8, 0], ['L5.2 6!/3! = 120', 6, 3], ['L5.2 25 × 24 × 23 = 25!/22!', 25, 22], ['0! = 1', 0, 0], ['20! (beyond 2⁵³)', 20, 18]].forEach(([lab, n, m]) => chips.appendChild(Lab.button(lab, () => { S.fn = n; nF.set(n); mF.setRange(0, n); mF.set(m); S.fm = m; save(); paint(); }, 'btn xs')));
    body.append(h('div', { class: 's4-fact-ctl' }, nF, mF), chips, out);
    function paint() {
      Lab.clear(out);
      const n = S.fn, m = Math.min(S.fm, n);
      const fn = fact(n);
      const steps = [];
      if (n === 0) steps.push({ html: 'You chose ' + tx('n=0') + '. By convention ' + tx('0!=1') + ' (L5.2): there is exactly one way to arrange nothing — leave it empty. It also keeps the rule ' + tx('n!=n\\times(n-1)!') + ' true at ' + tx('n=1') + ': ' + tx('1!=1\\times 0!=1\\times 1=1') + '.' });
      else steps.push({ html: 'You chose ' + tx('n=' + n) + '. ' + tx('n!') + ' is the product of the first ' + tx('n=' + n) + ' positive whole numbers:', math: n + '!=' + (n === 1 ? '1' : downTex(n, 1)) + '=' + iT(fn) + sci(fn) });
      // recursion table
      const rows = [];
      const idx = [];
      if (n <= 16) for (let k = 0; k <= n; k++) idx.push(k);
      else { [0, 1, 2, 3].forEach(k => idx.push(k)); idx.push(-1); for (let k = n - 4; k <= n; k++) idx.push(k); }
      idx.forEach(k => {
        if (k < 0) { rows.push(['⋮', '⋮', '⋮']); return; }
        if (k === 0) { rows.push([tx('0!'), 'by convention', tx('1')]); return; }
        rows.push([tx(k + '!'), tx(k + '\\times ' + (k - 1) + '!=' + k + '\\times ' + iT(fact(k - 1))), tx(iT(fact(k)))]);
      });
      steps.push({ html: 'Each factorial is the one before it times one more number: ' + tx('n!=n\\times(n-1)!') + ' (L5.2).' + (n > 16 ? ' (Rows 4 to ' + (n - 5) + ' are skipped here.)' : ''), block: tableEl([tx('k!'), tx('k\\times(k-1)!'), 'value'], rows, 's4-ftab') });
      // split at m
      const prod = fact(n) / fact(m);
      if (n > 0) {
        if (m === n) steps.push({ html: 'Your ' + tx('m=' + m) + ' equals ' + tx('n') + ', so nothing is split off: ' + tx('\\frac{' + n + '!}{' + m + '!}=1') + '.' });
        else {
          const i = n - m;
          steps.push({ html: 'Split at ' + tx('m=' + m) + ' (the lecture’s ' + tx('n!=n(n-1)\\cdots(n-i+1)\\times(n-i)!') + ' with ' + tx('i=n-m=' + n + '-' + m + '=' + i) + '): keep the top ' + plural(i, 'factor') + ' and pack the rest into ' + tx(m + '!') + ':',
            math: n + '!=' + (i === 1 ? String(n) : downTex(n, m + 1)) + '\\times ' + m + '!=' + iT(prod) + '\\times ' + iT(fact(m)) + '=' + iT(fn) });
          steps.push({ html: 'Divide by ' + tx(m + '!') + ': it cancels, and only the top ' + plural(i, 'factor') + ' are left. This is how the lecture simplifies ' + tx('\\frac{6!}{3!}=6\\times 5\\times 4=120') + ' and writes ' + tx('25\\times 24\\times 23=\\frac{25!}{22!}') + ':',
            math: '\\frac{' + n + '!}{' + m + '!}=' + (i === 1 ? String(n) : downTex(n, m + 1)) + '=' + iT(prod) + sci(prod),
            note: 'The same number is ' + tx('{}^{' + n + '}P_{' + i + '}') + ': the ways to fill ' + plural(i, 'place') + ' from ' + tx('n=' + n) + ' different objects (L5.3).' });
        }
      }
      if (n > 0) steps.push({ html: 'Why ' + tx('0!=1') + ': put ' + tx('n=1') + ' into ' + tx('n!=n\\times(n-1)!') + ' to get ' + tx('1!=1\\times 0!') + '. Since ' + tx('1!=1') + ', ' + tx('0!') + ' must be 1. (And one way to arrange nothing.)' });
      out.appendChild(K.steps(steps));
      const bn = bigNote(fn);
      if (bn) out.appendChild(h('div', { html: bn }));
      if (n >= 19) out.appendChild(K.note('Check: ' + tx('18!=' + iT(fact(18))) + ' is still below ' + tx('2^{53}=9{,}007{,}199{,}254{,}740{,}992') + '; ' + tx('19!=' + iT(fact(19))) + ' is above it.', 'small muted'));
    }
    paint();
  }

  /* ================================================================ TAB 2 — IDENTICAL OBJECTS */
  const MAXOBJ = 30, ENUM_MAX = 100000n, LIST_MAX = 1000;
  const COLOURS = { red: '#d23c3c', blue: '#2f6fe0', green: '#1f9254', yellow: '#e9b308', white: '#ffffff', black: '#24252b', orange: '#ea6f1f', purple: '#8b5cf6', violet: '#8b5cf6', pink: '#e45d9b', brown: '#8a5a2b', grey: '#8d8d98', gray: '#8d8d98', gold: '#d4a017', silver: '#b8bec6' };
  /** A word (BANANA) or counts (3 red, 2 blue balls) → kinds with counts. */
  function parseObjects(text) {
    const raw = String(text || '').trim();
    if (!raw) return { err: 'Type a word (e.g. BANANA) or counts (e.g. 3 red, 2 blue).' };
    if (/^\d+\s*(?:x|×|\*)?\s*[^\d\s,;+]/i.test(raw)) {
      const parts = raw.split(/\s*(?:,|;|\+|\band\b)\s*/i).filter(Boolean);
      const items = [];
      for (const p of parts) {
        const m = p.match(/^(\d+)\s*(?:x|×|\*)?\s*(.+)$/i);
        if (!m) return { err: 'Could not read “' + p + '”. Write each kind as a count and a name: 3 red, 2 blue.' };
        const c = parseInt(m[1], 10);
        if (c < 1) return { err: 'Each count must be 1 or more (“' + p + '”).' };
        items.push({ count: c, name: m[2].trim().replace(/\s+/g, ' ').slice(0, 20) });
      }
      let noun = '';
      const words = items.map(it => it.name.split(' '));
      const last = words[words.length - 1];
      if (items.length > 1 && last.length >= 2) {
        const cand = last[last.length - 1].toLowerCase();
        if (words.every(w => w.length === 1 || w[w.length - 1].toLowerCase() === cand)) {
          noun = last[last.length - 1];
          items.forEach((it, k) => { if (words[k].length >= 2) it.name = words[k].slice(0, -1).join(' '); });
        }
      }
      const types = [];
      let merged = false;
      items.forEach(it => {
        const key = it.name.toLowerCase();
        const ex = types.find(t => t.key === key);
        if (ex) { ex.count += it.count; merged = true; } else types.push({ key, label: it.name, count: it.count });
      });
      const n = types.reduce((a, t) => a + t.count, 0);
      if (n > MAXOBJ) return { err: 'That is ' + n + ' objects; this lab takes at most ' + MAXOBJ + '.' };
      const used = new Set();
      types.forEach((t, i) => {
        t.color = COLOURS[t.key] || null;
        let sym = t.label[0].toUpperCase();
        if (used.has(sym)) sym = t.label[0].toUpperCase() + (t.label[1] || String(i)).toLowerCase();
        if (used.has(sym)) sym = sym + i;
        used.add(sym);
        t.sym = sym;
      });
      const seq = [];
      types.forEach((t, i) => { for (let c = 0; c < t.count; c++) seq.push(i); });
      return { mode: 'counts', types, n, seq, noun, merged, order: types.map((_, i) => i) };
    }
    const chars = [...raw.replace(/\s+/g, '')].map(c => c.toUpperCase());
    if (chars.length > MAXOBJ) return { err: 'That word has ' + chars.length + ' letters; this lab takes at most ' + MAXOBJ + '.' };
    const types = [], seq = [];
    chars.forEach(c => {
      let i = types.findIndex(t => t.key === c);
      if (i < 0) { types.push({ key: c, label: c, sym: c, count: 0, color: null }); i = types.length - 1; }
      types[i].count++;
      seq.push(i);
    });
    const order = types.map((_, i) => i).sort((a, b) => (types[a].key < types[b].key ? -1 : types[a].key > types[b].key ? 1 : 0));
    return { mode: 'word', types, n: chars.length, seq, word: chars.join(''), order };
  }
  /** Every distinct arrangement, in the given order of kinds (next-permutation on a sorted multiset). */
  function* arrangements(counts, order) {
    const rank = [];
    order.forEach((ti, k) => { rank[ti] = k; });
    const a = [];
    order.forEach((ti, k) => { for (let c = 0; c < counts[ti]; c++) a.push(k); });
    for (;;) {
      yield a.map(k => order[k]);
      let i = a.length - 2;
      while (i >= 0 && a[i] >= a[i + 1]) i--;
      if (i < 0) return;
      let j = a.length - 1;
      while (a[j] <= a[i]) j--;
      [a[i], a[j]] = [a[j], a[i]];
      for (let l = i + 1, r = a.length - 1; l < r; l++, r--) [a[l], a[r]] = [a[r], a[l]];
    }
  }
  function* permsOf(arr) {
    if (arr.length <= 1) { yield arr.slice(); return; }
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permsOf(rest)) yield [arr[i]].concat(p);
    }
  }
  /** Labelled versions of one arrangement: give the copies of each kind the subscripts 1..p in every order. */
  function labelled(seq, nTypes, limit) {
    const pos = [];
    for (let t = 0; t < nTypes; t++) pos[t] = [];
    seq.forEach((t, i) => pos[t].push(i));
    const out = [];
    const cur = new Array(seq.length);
    (function rec(t) {
      if (out.length >= limit) return;
      if (t === nTypes) { out.push(cur.slice()); return; }
      const ps = pos[t];
      if (!ps.length) { rec(t + 1); return; }
      for (const p of permsOf(ps.map((_, k) => k + 1))) {
        ps.forEach((i, k) => { cur[i] = p[k]; });
        rec(t + 1);
        if (out.length >= limit) return;
      }
    })(0);
    return out;
  }
  const EVENTS = [
    { value: 'none', label: '— no question —' },
    { value: 'start', label: 'it starts with a chosen kind' },
    { value: 'end', label: 'it ends with a chosen kind' },
    { value: 'startend', label: 'it starts with one kind and ends with another' },
    { value: 'pos', label: 'place k holds a chosen kind' },
    { value: 'together', label: 'all copies of a chosen kind stand together' },
    { value: 'apart', label: 'no two copies of a chosen kind stand side by side' },
  ];

  function sameTab({ side, main, st, save, restart }) {
    const S = st.same;
    let D = null;
    const ctl = {};
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: SAME_PRESETS, onPick: it => { S.text = it.text; S.ev = it.ev; S.a = it.a; S.b = it.b; S.pick = ''; S.src = it.label; ctl.text.input.value = it.text; save(); recompute(); } });
    side.appendChild(pre);
    showSource(pre, SAME_PRESETS, S.src);
    side.appendChild(K.group('2 · Your objects'));
    ctl.text = K.textField({ label: 'A word (BANANA) or counts (3 red, 2 blue balls)', value: S.text, onChange: v => { S.text = v; S.pick = ''; touched(); recompute(); } });
    side.appendChild(ctl.text);
    const chips = h('div', { class: 'pl-chips' });
    ['MISSISSIPPI', 'BANANA', 'DATA', 'STATISTICS', '3 red, 2 blue balls', '2 red, 2 white, 1 blue flags'].forEach(w => chips.appendChild(Lab.button(w, () => { S.text = w; S.pick = ''; ctl.text.input.value = w; touched(); recompute(); }, 'btn xs')));
    side.appendChild(chips);
    side.appendChild(K.group('3 · A probability question'));
    ctl.ev = K.selectField({ label: 'Lay the objects in a random row. Event:', options: EVENTS, value: S.ev, onChange: v => { S.ev = v; save(); syncEvent(); drawProb(); markList(); } });
    ctl.a = K.selectField({ label: 'kind', options: [], value: '', onChange: v => { S.a = v; save(); drawProb(); markList(); } });
    ctl.b = K.selectField({ label: 'ends with', options: [], value: '', onChange: v => { S.b = v; save(); drawProb(); markList(); } });
    ctl.k = K.numField({ label: 'place ' + tx('k'), min: 1, max: 6, value: S.k, onChange: v => { S.k = v; save(); drawProb(); markList(); } });
    side.append(ctl.ev, ctl.a, ctl.b, ctl.k);
    side.appendChild(resetBtn(() => restart('same')));

    const P = {};
    P.stale = h('div', { class: 's4-stale', hidden: true });
    P.answer = K.answer();
    P.kinds = K.panel('Count each kind');
    P.why = K.panel('Why divide? Give every copy its own label', 'Labels make all the objects different, so they have ' + tx('n!') + ' orders. Erasing the labels glues those orders together in groups.');
    P.list = K.panel('Every distinct arrangement');
    P.prob = K.panel('As a probability');
    main.append(P.stale, P.answer, P.kinds, P.why, P.list, P.prob);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, SAME_PRESETS, ''); } save(); };

    function recompute() {
      const d = parseObjects(S.text);
      if (d.err) { ctl.text.input.classList.add('bad'); ctl.text.hint('<span class="cbad">' + esc(d.err) + '</span>'); stale(P.stale, 'Fix the text box. The pictures below still show your last good objects.'); return; }
      ctl.text.input.classList.remove('bad');
      stale(P.stale, '');
      D = d;
      D.counts = D.types.map(t => t.count);
      D.denom = prodB(D.counts.map(c => fact(c)));
      D.total = fact(D.n) / D.denom;
      D.enumOK = D.total <= ENUM_MAX;
      ctl.text.hint(D.mode === 'word'
        ? 'Read as a word of ' + plural(D.n, 'letter') + ': ' + D.types.map(t => esc(t.sym) + ' × ' + t.count).join(', ') + '.'
        : 'Read as ' + plural(D.n, 'object') + (D.noun ? ' (' + esc(D.noun) + ')' : '') + ': ' + D.types.map(t => esc(t.label) + ' × ' + t.count).join(', ') + '.' + (D.merged ? ' Kinds with the same name were added together.' : ''));
      D.list = [];
      const gen = arrangements(D.counts, D.order);
      for (const a of gen) { D.list.push(a); if (D.list.length >= LIST_MAX) break; }
      if (!S.pick || !validPick(S.pick)) S.pick = D.seq.join('.');
      syncEvent();
      drawAnswer(); drawKinds(); drawWhy(); drawList(); drawProb();
    }
    function validPick(key) {
      const a = key.split('.').map(Number);
      if (a.length !== D.n || a.some(v => !(v >= 0 && v < D.types.length))) return false;
      const c = D.types.map(() => 0);
      a.forEach(v => c[v]++);
      return c.every((v, i) => v === D.counts[i]);
    }
    const kindWord = t => (D.mode === 'word' ? 'the letter ' + esc(t.label) : esc(t.label));
    const tIndex = key => { const i = D.types.findIndex(t => t.key === key); return i; };
    function syncEvent() {
      const opts = D.types.map(t => ({ value: t.key, label: D.mode === 'word' ? t.label : t.label + ' (' + t.count + ')' }));
      [ctl.a, ctl.b].forEach(c => { Lab.clear(c.select); opts.forEach(o => c.select.appendChild(h('option', { value: o.value, text: o.label }))); });
      if (tIndex(S.a) < 0) S.a = D.types[0].key;
      if (tIndex(S.b) < 0) S.b = (D.types[1] || D.types[0]).key;
      ctl.a.select.value = S.a; ctl.b.select.value = S.b;
      const word = D.mode === 'word' ? 'letter' : 'kind';
      Lab.clear(ctl.ev.select);
      EVENTS.forEach(o => ctl.ev.select.appendChild(h('option', { value: o.value, text: o.label.replace(/kind/g, word) })));
      ctl.ev.select.value = S.ev;
      ctl.a.hidden = S.ev === 'none';
      ctl.b.hidden = S.ev !== 'startend';
      ctl.k.hidden = S.ev !== 'pos';
      ctl.a.querySelector('label').textContent = S.ev === 'startend' ? 'starts with' : D.mode === 'word' ? 'letter' : 'kind';
      S.k = ctl.k.setRange(1, Math.max(1, D.n));
    }
    function tok(ti, sub, cls) {
      const t = D.types[ti];
      const s = sub != null ? '<sub>' + sub + '</sub>' : '';
      if (t.color) return '<span class="s4-tok s4-dotw' + (cls ? ' ' + cls : '') + '" title="' + esc(t.label) + '"><span class="s4-dot" style="--dc:' + t.color + '"></span>' + s + '</span>';
      return '<span class="s4-tok s4-k' + (ti % 10) + (cls ? ' ' + cls : '') + '" title="' + esc(t.label) + '">' + esc(t.sym) + s + '</span>';
    }
    const seqHTML = (seq, subs) => '<span class="s4-seq">' + seq.map((ti, i) => tok(ti, subs ? subs[i] : null)).join('') + '</span>';
    const denomTex = () => facTex(D.counts);
    const denomVals = () => facVals(D.counts);
    /** p_1!\\,p_2!\\,p_3! — or, with many kinds, p_1!\\,p_2!\\cdots p_k!; red = {kind index: 1 | 2 | 'b' (a glued block)}. */
    function symDen(red) {
      red = red || {};
      const k = D.counts.length;
      const one = i => (red[i] === 'b' ? '1!' : red[i] ? '(p_{' + (i + 1) + '}-' + red[i] + ')!' : 'p_{' + (i + 1) + '}!');
      if (k <= 6) return D.counts.map((_, i) => one(i)).join('\\,');
      const keys = Object.keys(red).map(Number);
      if (!keys.length) return 'p_{1}!\\,p_{2}!\\cdots p_{' + k + '}!';
      return keys.map(one).join('\\,') + '\\,\\prod_{\\text{other }j}p_{j}!';
    }
    function mainFormula(big) {
      return eqChain('', ['\\frac{n!}{' + symDen() + '}', '\\frac{' + D.n + '!}{' + denomTex() + '}', '\\frac{' + iT(fact(D.n)) + '}{' + denomVals() + '}', D.counts.length > 1 ? '\\frac{' + iT(fact(D.n)) + '}{' + iT(D.denom) + '}' : '', iT(D.total) + sci(D.total)], big);
    }
    function drawAnswer() {
      const what = D.mode === 'word' ? 'The word <b class="mono">' + esc(D.word) + '</b> has ' : 'You have ';
      const ev = what + tx('n=' + D.n) + ' ' + (D.mode === 'word' ? 'letters' : (D.noun ? esc(D.noun) : 'objects')) + ' of ' + plural(D.types.length, 'kind') + ': ' + D.types.map((t, i) => tok(i) + (t.color ? ' ' + esc(t.label) : '') + ' ' + tx('p_{' + (i + 1) + '}=' + t.count)).join(', ') + '.';
      const allDiff = D.counts.every(c => c === 1);
      K.setAnswer(P.answer, { ev, big: mainFormula(true),
        sub: plural(D.total, 'different arrangement') + ' in a row (L5.4). ' + (allDiff ? 'All objects are different, so this is just ' + tx(D.n + '!') + '.' : 'If every object were different there would be ' + tx(D.n + '!') + ' = ' + numIn(fact(D.n)) + '; copies that look alike cut that down by ' + tx(denomTex() + '=' + iT(D.denom)) + '.') + bigNote(fact(D.n)) });
    }
    function drawKinds() {
      const body = P.kinds.body;
      Lab.clear(body);
      body.appendChild(h('div', { class: 's4-tiles', html: seqHTML(D.seq) }));
      const rows = D.types.map((t, i) => [tok(i) + (t.label !== t.sym || t.color ? ' <span class="small">' + esc(t.label) + '</span>' : ''), tx('p_{' + (i + 1) + '}=' + t.count), tx(t.count + '!=' + iT(fact(t.count)))]);
      rows.push({ cells: ['<b>total</b>', tx('n=' + D.counts.join('+') + '=' + D.n), tx(denomTex() + '=' + denomVals() + '=' + iT(D.denom))], hl: true });
      const steps = [
        { html: 'Count the copies of each kind. They must add up to the number of objects:', block: tableEl(['kind', 'copies', 'its factorial'], rows, 's4-ktab') },
        { html: 'Arrangements of ' + tx('n') + ' objects when ' + tx('p_1') + ' are of one kind, ' + tx('p_2') + ' of a second kind, … (L5.4):', math: mainFormula(false) },
      ];
      body.appendChild(K.steps(steps));
    }
    function drawWhy() {
      const body = P.why.body;
      Lab.clear(body);
      const pick = S.pick.split('.').map(Number);
      const per = D.denom;
      const LAB = 24;
      const subs = [];
      const seen = D.types.map(() => 0);
      pick.forEach((ti, i) => { seen[ti]++; subs[i] = D.counts[ti] > 1 ? seen[ti] : null; });
      const steps = [];
      steps.push({ html: 'Give every copy a label: ' + seqHTML(pick, subs) + '. Now all ' + tx('n=' + D.n) + ' objects are different, so they can be put in a row in ' + tx('n!=' + D.n + '!') + ' = ' + numIn(fact(D.n)) + ' orders (multiplication rule; L5.4 does this with ' + tx('A_1, A_2') + ' in DATA).' });
      const swapParts = D.types.map((t, i) => (t.count > 1 ? tok(i) + ': ' + tx(t.count + '!=' + iT(fact(t.count))) : null)).filter(Boolean);
      steps.push({ html: 'Now erase the labels. Copies of one kind can swap places among themselves and the row looks the same: ' + (swapParts.length ? swapParts.join(', ') + ' orders.' : 'here every kind has a single copy, so nothing can swap.') + ' By the multiplication rule each row you can see is counted',
        math: denomTex() + '=' + denomVals() + '=' + iT(per) + '\\text{ times among the }' + iT(fact(D.n)) + '\\text{ labelled orders.}' });
      steps.push({ html: 'So (number of rows) × ' + numIn(per) + ' = ' + numIn(fact(D.n)) + ', and', math: '\\text{rows}=\\frac{' + iT(fact(D.n)) + '}{' + iT(per) + '}=' + iT(D.total) });
      body.appendChild(K.steps(steps));
      const lab = labelled(pick, D.types.length, LAB);
      const box = h('div', { class: 's4-zoom' });
      Lab.setHTML(box, 'The row ' + seqHTML(pick) + ' and the labelled orders that collapse into it' + (per > B(LAB) ? ' (the first ' + LAB + ' of ' + iH(per) + ')' : ' (all ' + iH(per) + ')') + ':');
      const g = h('div', { class: 's4-lablist' });
      lab.forEach(sb => g.appendChild(h('span', { class: 's4-lab1', html: seqHTML(pick, sb.map((v, i) => (D.counts[pick[i]] > 1 ? v : null))) })));
      box.appendChild(g);
      box.appendChild(K.note('Click any row in the list below to see its own labelled versions.', 'small muted'));
      body.appendChild(box);
      if (fact(D.n) <= 720n && D.n >= 2 && per > 1n) {
        const tog = K.toggle({ label: 'Show all ' + tx(D.n + '!=' + iT(fact(D.n))) + ' labelled orders, grouped by the row they become', value: S.groups, onChange: v => { S.groups = v; save(); drawGroups(); } });
        const host = h('div', { class: 's4-groups' });
        body.append(tog, host);
        const drawGroups = () => {
          Lab.clear(host);
          if (!S.groups) return;
          const all = [...arrangements(D.counts, D.order)];
          host.appendChild(K.note(all.length + ' groups × ' + iH(per) + ' labelled orders each = ' + iH(B(all.length) * per) + ' = ' + tx(D.n + '!') + ' ✓', 'small'));
          const gg = h('div', { class: 's4-grid2' });
          all.forEach(a => {
            const card = h('div', { class: 's4-grp' }, h('div', { class: 's4-grp-h', html: seqHTML(a) }));
            const inner = h('div', { class: 's4-grp-in' });
            labelled(a, D.types.length, 720).forEach(sb => inner.appendChild(h('span', { html: seqHTML(a, sb.map((v, i) => (D.counts[a[i]] > 1 ? v : null))) })));
            card.appendChild(inner);
            gg.appendChild(card);
          });
          host.appendChild(gg);
        };
        drawGroups();
      }
    }
    function drawList() {
      const body = P.list.body;
      Lab.clear(body);
      P.list.sub((D.total > B(LIST_MAX) ? 'There are ' + iH(D.total) + ' — showing the first ' + iH(LIST_MAX) : 'All ' + iH(D.total)) + (D.mode === 'word' ? ', in dictionary (alphabetical) order.' : ', in the order you typed the kinds.') + ' Violet = in your event. Click one to see its labelled versions above.');
      const g = h('div', { class: 'cl-grid s4-arrs' });
      D.list.forEach(a => {
        const key = a.join('.');
        const chip = h('button', { type: 'button', class: 'cl-chip s4-arr' + (key === S.pick ? ' cur' : ''), dataset: { key } });
        if (D.types.some(t => t.color)) chip.innerHTML = seqHTML(a);
        else chip.textContent = a.map(ti => D.types[ti].sym).join(D.types.some(t => t.sym.length > 1) ? ' ' : '');
        chip.addEventListener('click', () => { S.pick = key; save(); Lab.$$('.s4-arr', body).forEach(c => c.classList.toggle('cur', c.dataset.key === key)); drawWhy(); });
        g.appendChild(chip);
      });
      body.appendChild(g);
      markList();
    }
    /** The event as a test on one arrangement, its formula count and its explanation. */
    function event() {
      const ev = S.ev;
      if (ev === 'none') return null;
      const a = tIndex(S.a), b = tIndex(S.b), n = D.n, k = Math.min(S.k, n);
      const pa = D.counts[a], pb = D.counts[b];
      const baseOf = cs => fact(cs.reduce((x, y) => x + y, 0)) / prodB(cs.map(c => fact(c)));
      const minus = (cs, i, by) => cs.map((c, j) => (j === i ? c - by : c));
      const dTex = cs => facTex(cs);
      const ka = kindWord(D.types[a]), kb = kindWord(D.types[b]);
      let test, fav, words, why = [];
      if (ev === 'start' || ev === 'end' || ev === 'pos') {
        const place = ev === 'start' ? 1 : ev === 'end' ? n : k;
        test = s => s[place - 1] === a;
        const cs = minus(D.counts, a, 1);
        fav = baseOf(cs);
        words = (ev === 'start' ? 'it starts with ' : ev === 'end' ? 'it ends with ' : 'place ' + k + ' holds ') + ka;
        why.push({ html: 'Put one copy of ' + ka + ' in place ' + place + '. The other ' + tx('n-1=' + n + '-1=' + (n - 1)) + ' objects — with ' + ka + ' now down to ' + tx(pa + '-1=' + (pa - 1)) + ' copies — fill the remaining places in any order:',
          math: eqChain('', ['\\frac{(n-1)!}{' + symDen({ [a]: 1 }) + '}', '\\frac{' + (n - 1) + '!}{' + dTex(cs) + '}', '\\frac{' + iT(fact(n - 1)) + '}{' + iT(prodB(cs.map(c => fact(c)))) + '}', iT(fav)]) });
        why.push({ html: 'Shortcut: every one of the ' + tx('n=' + n) + ' objects is equally likely to land in place ' + place + ', and ' + tx('p=' + pa) + ' of them are ' + ka + ':', math: 'P=\\frac{p}{n}=\\frac{' + pa + '}{' + n + '}' + (gcd(B(pa), B(n)) > 1n ? '=' + fracFull(pa, n).split('=').slice(1).join('=') : decTail(B(pa), B(n))) });
      } else if (ev === 'startend') {
        test = s => s[0] === a && s[n - 1] === b;
        words = 'it starts with ' + ka + ' and ends with ' + kb;
        if (a === b) {
          if (pa < 2 || n < 2) { fav = 0n; why.push({ html: ka + ' has only ' + plural(pa, 'copy', 'copies') + ', so it cannot be both first and last: 0 rows.' }); }
          else {
            const cs = minus(D.counts, a, 2);
            fav = baseOf(cs);
            why.push({ html: 'Put copies of ' + ka + ' in place 1 and in place ' + n + '. The other ' + tx('n-2=' + (n - 2)) + ' objects (' + ka + ' now has ' + tx(pa + '-2=' + (pa - 2)) + ' copies) fill the middle:', math: eqChain('', ['\\frac{(n-2)!}{' + symDen({ [a]: 2 }) + '}', '\\frac{' + (n - 2) + '!}{' + dTex(cs) + '}', iT(fav)]) });
            why.push({ html: 'Shortcut: place 1 gets ' + ka + ' with chance ' + tx('\\frac{' + pa + '}{' + n + '}') + '; then place ' + n + ' gets one of the ' + (pa - 1) + ' left among ' + (n - 1) + ':', math: 'P=\\frac{' + pa + '}{' + n + '}\\times\\frac{' + (pa - 1) + '}{' + (n - 1) + '}=' + fracFull(B(pa * (pa - 1)), B(n * (n - 1))) });
          }
        } else {
          const cs = minus(minus(D.counts, a, 1), b, 1);
          fav = baseOf(cs);
          why.push({ html: 'Put ' + ka + ' first and ' + kb + ' last. The other ' + tx('n-2=' + (n - 2)) + ' objects fill the middle:', math: eqChain('', ['\\frac{(n-2)!}{' + symDen({ [a]: 1, [b]: 1 }) + '}', '\\frac{' + (n - 2) + '!}{' + dTex(cs) + '}', '\\frac{' + iT(fact(n - 2)) + '}{' + iT(prodB(cs.map(c => fact(c)))) + '}', iT(fav)]) });
          why.push({ html: 'Shortcut: first place ' + ka + ' (' + pa + ' of ' + n + '), then last place ' + kb + ' (' + pb + ' of the ' + (n - 1) + ' left):', math: 'P=\\frac{' + pa + '}{' + n + '}\\times\\frac{' + pb + '}{' + (n - 1) + '}=' + fracFull(B(pa * pb), B(n * (n - 1))) });
        }
      } else if (ev === 'together') {
        test = s => { const f = s.indexOf(a), l = s.lastIndexOf(a); return l - f + 1 === pa; };
        words = 'all ' + plural(pa, 'copy', 'copies') + ' of ' + ka + ' stand together';
        const rest = D.counts.map((c, j) => (j === a ? 1 : c));
        fav = baseOf(rest);
        why.push({ html: 'Glue the ' + plural(pa, 'copy', 'copies') + ' of ' + ka + ' into one block (inside the block they look alike, so there is only 1 way to order them). Now there are ' + tx('n-p+1=' + n + '-' + pa + '+1=' + (n - pa + 1)) + ' things to arrange, the block counting as one of a kind:',
          math: eqChain('', ['\\frac{(n-p_{' + (a + 1) + '}+1)!}{' + symDen({ [a]: 'b' }) + '}', '\\frac{' + (n - pa + 1) + '!}{' + dTex(rest) + '}', '\\frac{' + iT(fact(n - pa + 1)) + '}{' + iT(prodB(rest.map(c => fact(c)))) + '}', iT(fav)]) });
      } else {
        test = s => { for (let i = 1; i < s.length; i++) if (s[i] === a && s[i - 1] === a) return false; return true; };
        words = 'no two copies of ' + ka + ' stand side by side';
        const others = D.counts.map((c, j) => (j === a ? 0 : c));
        const no = n - pa;
        const arr = baseOf(others);
        const gaps = no + 1;
        fav = arr * choose(gaps, pa);
        const oth = others.filter(c => c > 0);
        why.push({ html: 'First arrange the other ' + tx('n-p=' + n + '-' + pa + '=' + no) + ' objects:', math: oth.length ? eqChain('', ['\\frac{(n-p_{' + (a + 1) + '})!}{\\prod_{j\\ne ' + (a + 1) + '}p_{j}!}', '\\frac{' + no + '!}{' + dTex(oth) + '}', iT(arr)]) : '0!=1\\text{ (there are none)}' });
        why.push({ html: 'They leave ' + tx(no + '+1=' + gaps) + ' gaps (before, between, after). Put each copy of ' + ka + ' in a different gap: choose ' + pa + ' of the ' + gaps + ' gaps (a combination, Week 6):', math: '\\binom{' + gaps + '}{' + pa + '}=' + iT(choose(gaps, pa)) + ',\\qquad ' + iT(arr) + '\\times ' + iT(choose(gaps, pa)) + '=' + iT(fav) });
      }
      return { test, fav, words, why };
    }
    function markList() {
      const E = D ? event() : null;
      Lab.$$('.s4-arr', P.list.body).forEach(c => {
        const a = c.dataset.key.split('.').map(Number);
        c.classList.toggle('in', !!E && E.test(a));
      });
    }
    function drawProb() {
      if (!D) return;
      const body = P.prob.body;
      Lab.clear(body);
      const E = event();
      if (!E) { body.appendChild(K.note('Choose an event in the controls (step 3). Lay the ' + D.n + ' objects in a random row: each of the ' + tx(D.n + '!') + ' labelled orders is equally likely, and every visible row collects the same number of them (' + iH(D.denom) + '), so the ' + iH(D.total) + ' rows are equally likely too. Then ' + tx('P=\\frac{\\text{rows in the event}}{\\text{all rows}}') + '.', 'small muted')); return; }
      const box = K.answer();
      box.classList.add('small-answer');
      K.setAnswer(box, { ev: 'Event: ' + E.words + '.', big: 'P=' + fracFull(E.fav, D.total), sub: iH(E.fav) + ' of the ' + iH(D.total) + ' equally likely rows are in the event.' });
      body.appendChild(box);
      const steps = E.why.slice();
      steps.push({ html: 'All rows: ' + numIn(D.total) + ' (the answer above). Rows in the event: ' + numIn(E.fav) + '. Every row is equally likely (each one is ' + iH(D.denom) + ' labelled orders out of ' + iH(fact(D.n)) + '), so', math: 'P=\\frac{' + iT(E.fav) + '}{' + iT(D.total) + '}' + (fracFull(E.fav, D.total).indexOf('=') >= 0 ? '=' + fracFull(E.fav, D.total).split('=').slice(1).join('=') : '') });
      if (D.enumOK) {
        let c = 0n;
        for (const a of arrangements(D.counts, D.order)) if (E.test(a)) c++;
        steps.push({ html: 'Check by listing all ' + iH(D.total) + ' rows one by one: ' + iH(c) + ' are in the event ' + (c === E.fav ? '<span class="cgood">✓ matches</span>' : '<span class="cbad">✗ does not match</span>') + '.' });
      } else steps.push({ html: 'There are too many rows (' + iH(D.total) + ') to check one by one here; the formula above is exact.' });
      body.appendChild(K.steps(steps));
    }
    recompute();
  }

  /* ================================================================ TAB 3 — CIRCULAR */
  function parseNames(s, n) {
    const got = String(s || '').split(',').map(x => x.trim()).filter(Boolean).slice(0, 12);
    const names = got.slice(0, n);
    for (let i = 0; names.length < n && i < 26; i++) { const L = String.fromCharCode(65 + i); if (!names.includes(L)) names.push(L); }
    return names;
  }
  const rotCW = s => [s[s.length - 1]].concat(s.slice(0, -1));
  const rotACW = s => s.slice(1).concat(s[0]);
  const flip = s => s.map((_, i) => s[(s.length - i) % s.length]);
  const canonTable = s => { const k = s.indexOf(0); return s.slice(k).concat(s.slice(0, k)); };
  function canonNeck(s) { const c = canonTable(s); if (c.length < 3) return c; const m = [c[0]].concat(c.slice(1).reverse()); return c[1] < c[c.length - 1] ? c : m; }
  /** Rank (1-based) of a table seating among the (n−1)! seatings in dictionary order (Lehmer code). */
  function rankTable(c) {
    const rest = c.slice(1), n = rest.length;
    let r = 0n;
    const pool = rest.slice().sort((x, y) => x - y);
    rest.forEach((v, i) => { const j = pool.indexOf(v); r += B(j) * fact(n - 1 - i); pool.splice(j, 1); });
    return r + 1n;
  }
  function* tablePerms(n) {
    const a = []; for (let i = 1; i < n; i++) a.push(i);
    for (;;) {
      yield [0].concat(a);
      let i = a.length - 2;
      while (i >= 0 && a[i] >= a[i + 1]) i--;
      if (i < 0) return;
      let j = a.length - 1;
      while (a[j] <= a[i]) j--;
      [a[i], a[j]] = [a[j], a[i]];
      for (let l = i + 1, r = a.length - 1; l < r; l++, r--) [a[l], a[r]] = [a[r], a[l]];
    }
  }
  function rankNeck(c) {
    let k = 0;
    for (const p of tablePerms(c.length)) { if (p.length >= 3 && !(p[1] < p[p.length - 1])) continue; k++; if (p.every((v, i) => v === c[i])) return k; }
    return k;
  }
  const PEOPLE_COL = [0, 1, 2, 4, 5, 6, 8, 9, 7]; // never violet: violet marks the people in the event
  const adjacent = (s, a, b) => { const n = s.length, i = s.indexOf(a), j = s.indexOf(b); const d = Math.abs(i - j); return d === 1 || d === n - 1; };

  function circleTab({ side, main, st, save, restart }) {
    const S = st.circle;
    const ctl = {};
    let names = parseNames(S.names, S.n);
    let msg = '';
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: CIRCLE_PRESETS, onPick: it => { S.n = it.n; S.names = it.names; S.mode = it.mode; S.seat = []; for (let i = 0; i < it.n; i++) S.seat.push(i); S.src = it.label; S.a = 0; S.b = 1; msg = ''; save(); ctl.n.set(S.n); ctl.names.input.value = S.names; ctl.mode.set(S.mode); afterN(); } });
    side.appendChild(pre);
    showSource(pre, CIRCLE_PRESETS, S.src);
    side.appendChild(K.group('2 · Who sits around the circle'));
    ctl.n = K.numField({ label: 'Number of people (or beads) ' + tx('n'), min: 2, max: 12, value: S.n, onChange: v => { S.n = v; const got = S.names.split(',').map(x => x.trim()).filter(Boolean); names = parseNames(got.join(', '), v); S.names = names.join(', '); ctl.names.input.value = S.names; S.seat = names.map((_, i) => i); msg = ''; touched(); afterN(); } });
    ctl.names = K.textField({ label: 'Their names, separated by commas', value: S.names, mono: false, onChange: v => { const got = v.split(',').map(x => x.trim()).filter(Boolean); if (got.length >= 2 && got.length <= 12) { S.n = got.length; ctl.n.set(S.n); } S.names = v; S.seat = []; for (let i = 0; i < S.n; i++) S.seat.push(i); msg = ''; touched(); afterN(); } });
    side.append(ctl.n, ctl.names);
    side.appendChild(K.group('3 · Is a mirror image the same?'));
    ctl.mode = Lab.seg([{ label: 'Table: clockwise ≠ anticlockwise', value: 'table' }, { label: 'Necklace: a flip is the same', value: 'necklace' }], S.mode, v => { S.mode = v; touched(); draw(); });
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Seating at a round table, or beads on a necklace (L5.4)?' }), ctl.mode));
    side.appendChild(K.group('4 · A probability question'));
    ctl.ev = K.selectField({ label: 'Seat everyone at random. Event:', options: [{ value: 'none', label: '— no question —' }, { value: 'adj', label: 'two chosen people sit next to each other' }, { value: 'notadj', label: 'two chosen people do NOT sit together' }], value: S.ev, onChange: v => { S.ev = v; save(); syncEv(); drawAll(); drawProb(); } });
    ctl.a = K.selectField({ label: 'person', options: [], value: '0', onChange: v => { S.a = +v; if (S.b === S.a) S.b = (S.a + 1) % S.n; syncEv(); save(); drawAll(); drawProb(); drawTable(); } });
    ctl.b = K.selectField({ label: 'and person', options: [], value: '1', onChange: v => { S.b = +v; if (S.b === S.a) S.a = (S.b + 1) % S.n; syncEv(); save(); drawAll(); drawProb(); drawTable(); } });
    side.append(ctl.ev, ctl.a, ctl.b);
    side.appendChild(resetBtn(() => restart('circle')));

    const P = {};
    P.answer = K.answer();
    P.table = K.panel('Your seating — rotate it, flip it', 'Seat numbers 1, 2, … stay on the table; people move. Read a seating clockwise.');
    P.calc = K.panel('How it is computed, with your numbers');
    P.rot = K.panel('The rotations of your seating are the same seating');
    P.mirror = K.panel('A seating and its mirror image');
    P.all = K.panel('Every distinct seating');
    P.prob = K.panel('As a probability');
    main.append(P.answer, P.table, P.calc, P.rot, P.mirror, P.all, P.prob);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, CIRCLE_PRESETS, ''); } save(); };

    function afterN() { names = parseNames(S.names, S.n); if (!Array.isArray(S.seat) || S.seat.length !== S.n) { S.seat = []; for (let i = 0; i < S.n; i++) S.seat.push(i); } syncEv(); draw(); }
    function syncEv() {
      [ctl.a, ctl.b].forEach(c => { Lab.clear(c.select); names.forEach((nm, i) => c.select.appendChild(h('option', { value: String(i), text: nm }))); });
      if (!(S.a >= 0 && S.a < S.n)) S.a = 0;
      if (!(S.b >= 0 && S.b < S.n) || S.b === S.a) S.b = (S.a + 1) % S.n;
      ctl.a.select.value = String(S.a); ctl.b.select.value = String(S.b);
      ctl.ev.select.value = S.ev;
      ctl.a.hidden = ctl.b.hidden = S.ev === 'none';
    }
    const nm = i => esc(names[i]);
    const reading = s => s.map(i => nm(i)).join(', ');
    const total = () => (S.mode === 'table' ? fact(S.n - 1) : S.n <= 2 ? 1n : fact(S.n - 1) / 2n);
    const label = s => { const c = S.mode === 'table' ? canonTable(s) : canonNeck(s); return c; };
    function rankOf(s) { if (S.mode === 'table') return rankTable(canonTable(s)); if (S.n > 8) return null; return B(rankNeck(canonNeck(s))); }

    function draw() { drawAnswer(); drawTable(); drawCalc(); drawRot(); drawMirror(); drawAll(); drawProb(); }
    function drawAnswer() {
      const n = S.n, tot = total();
      let big, sub;
      if (S.mode === 'table') {
        big = 'N=(n-1)!=(' + n + '-1)!=' + (n - 1) + '!=' + iT(tot);
        sub = 'In a straight row the same ' + n + ' people have ' + tx(n + '!=' + iT(fact(n))) + ' orders. A round table has no first seat: the ' + n + ' rotations of a seating give everyone the same neighbours, so ' + tx('\\frac{' + n + '!}{' + n + '}=\\frac{' + iT(fact(n)) + '}{' + n + '}=' + iT(tot)) + ' (L5.4).';
      } else if (n <= 2) {
        big = 'N=1';
        sub = 'With ' + tx('n=' + n) + ' beads there is only one seating, and its mirror image is itself — nothing to halve. The formula ' + tx('\\frac{(n-1)!}{2}') + ' needs ' + tx('n\\ge 3') + '.';
      } else {
        big = 'N=\\frac{(n-1)!}{2}=\\frac{(' + n + '-1)!}{2}=\\frac{' + (n - 1) + '!}{2}=\\frac{' + iT(fact(n - 1)) + '}{2}=' + iT(tot);
        sub = 'A necklace can be turned over, so a seating and its mirror image (clockwise read as anticlockwise) are one necklace: the ' + iH(fact(n - 1)) + ' table seatings pair up, ' + tx('\\frac{' + iT(fact(n - 1)) + '}{2}=' + iT(tot)) + ' (L5.4).';
      }
      K.setAnswer(P.answer, { ev: tx('n=' + n) + ' ' + (S.mode === 'table' ? 'people around a round table — clockwise and anticlockwise are different' : 'beads on a necklace — a flip (mirror image) is the same') + ': ' + names.map(esc).join(', ') + '.', big: big + sci(tot), sub: sub + bigNote(fact(n)) });
    }
    /** Round table SVG. big: seat numbers + names; small: names only. */
    function tableSVG(seat, opts = {}) {
      const n = seat.length, small = !!opts.small;
      const W = small ? 110 : 360, Hh = small ? 110 : 300, cx = W / 2, cy = Hh / 2;
      const Rt = small ? 26 : 66, Rp = small ? 40 : 108, rp = small ? 11 : 21;
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + Hh, class: 's4-rt' + (small ? ' mini' : ''), role: 'img', 'aria-label': 'round table: ' + seat.map(i => names[i]).join(', ') });
      s.appendChild(svg('circle', { cx, cy, r: Rt, class: 's4-rt-table' }));
      const ang = i => -Math.PI / 2 + (2 * Math.PI * i) / n;
      if (!small) {
        for (let i = 0; i < n; i++) s.appendChild(svg('text', { x: cx + (Rp + 32) * Math.cos(ang(i)), y: cy + (Rp + 32) * Math.sin(ang(i)) + 4, 'text-anchor': 'middle', class: 's4-rt-seat' }, String(i + 1)));
        const a1 = -Math.PI / 2 + 0.35, a2 = -Math.PI / 2 + 1.05, r0 = Rt - 14;
        s.appendChild(svg('path', { d: 'M' + (cx + r0 * Math.cos(a1)) + ',' + (cy + r0 * Math.sin(a1)) + ' A' + r0 + ',' + r0 + ' 0 0 1 ' + (cx + r0 * Math.cos(a2)) + ',' + (cy + r0 * Math.sin(a2)), class: 's4-rt-arrow', 'marker-end': 'url(#s4-arr)' }));
        const defs = svg('defs', {}, svg('marker', { id: 's4-arr', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, svg('path', { d: 'M0,0 L10,5 L0,10 z', class: 's4-rt-arrowhead' })));
        s.appendChild(defs);
        s.appendChild(svg('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 's4-rt-cw' }, 'clockwise'));
      }
      const g = svg('g', { class: 's4-rt-people' });
      seat.forEach((p, i) => {
        const x = cx + Rp * Math.cos(ang(i)), y = cy + Rp * Math.sin(ang(i));
        const hot = opts.hot && opts.hot.includes(p);
        const c = svg('g', { class: 's4-rt-p s4-k' + PEOPLE_COL[p % PEOPLE_COL.length] + (hot ? ' hot' : '') });
        if (hot) c.appendChild(svg('circle', { cx: x, cy: y, r: rp + (small ? 3.5 : 6), class: 's4-rt-ring' }));
        c.appendChild(svg('circle', { cx: x, cy: y, r: rp, class: 's4-rt-body' }));
        c.appendChild(svg('text', { x, y: y + (small ? 3.5 : 5), 'text-anchor': 'middle' }, String(names[p]).slice(0, small ? 2 : 4)));
        c.appendChild(svg('title', {}, names[p]));
        g.appendChild(c);
      });
      s.appendChild(g);
      if (opts.onClick) { s.classList.add('click'); s.addEventListener('click', opts.onClick); }
      return s;
    }
    function act(kind) {
      const before = S.seat.slice();
      const after = kind === 'cw' ? rotCW(before) : kind === 'acw' ? rotACW(before) : kind === 'flip' ? flip(before) : before;
      const rb = rankOf(before), ra = rankOf(after);
      const same = S.mode === 'table' ? canonTable(before).join() === canonTable(after).join() : canonNeck(before).join() === canonNeck(after).join();
      const what = kind === 'cw' ? 'Everyone moved one seat clockwise.' : kind === 'acw' ? 'Everyone moved one seat anticlockwise.' : 'You flipped the circle (mirror image: the person in seat 1 stays, left and right swap).';
      msg = what + ' Read from seat 1: ' + reading(before) + ' → <b>' + reading(after) + '</b>. ' +
        (same ? '<span class="cgood">Same ' + (S.mode === 'table' ? 'seating' : 'necklace') + '</span>' + (rb ? ' (#' + iH(rb) + ')' : '') + ': read clockwise from ' + nm(0) + ' it is still ' + reading(label(after)) + (kind === 'flip' ? ' — turning a necklace over does not change it.' : ' — everyone has the same two neighbours.')
          : '<span class="cbad">A different seating</span>' + (rb && ra ? ' (#' + iH(rb) + ' → #' + iH(ra) + ')' : '') + ': clockwise from ' + nm(0) + ' it now reads ' + reading(canonTable(after)) + ' — left and right neighbours swapped. At a table that matters; as a necklace (switch in the controls) it would be the same.');
      const g = P.table.body.querySelector('.s4-rt-people');
      const done = () => { S.seat = after; save(); drawTable(); drawRot(); drawMirror(); markAll(); };
      if (g && !Lab.reducedMotion() && kind !== 'shuffle') {
        g.style.transition = 'transform .45s cubic-bezier(.2,.7,.2,1)';
        g.style.transformOrigin = '180px 150px';
        g.style.transform = kind === 'cw' ? 'rotate(' + 360 / S.n + 'deg)' : kind === 'acw' ? 'rotate(' + -360 / S.n + 'deg)' : 'scale(-1,1)';
        setTimeout(done, 470);
      } else done();
    }
    function drawTable() {
      const body = P.table.body;
      Lab.clear(body);
      const hot = S.ev !== 'none' ? [S.a, S.b] : null;
      body.appendChild(h('div', { class: 's4-rt-wrap' }, tableSVG(S.seat, { hot })));
      const btns = h('div', { class: 'btn-row s4-rt-btns' },
        Lab.button('⟲ Rotate anticlockwise', () => act('acw'), 'btn sm'),
        Lab.button('⟳ Rotate clockwise', () => act('cw'), 'btn sm'),
        Lab.button('⇋ Flip (mirror)', () => act('flip'), 'btn sm'),
        Lab.button('Shuffle', () => { const a = S.seat.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } S.seat = a; msg = 'A new random seating.'; save(); drawTable(); drawRot(); drawMirror(); markAll(); }, 'btn ghost sm'),
        Lab.button('Back to ' + names.slice(0, 3).map(esc).join(', ') + ', …', () => { S.seat = names.map((_, i) => i); msg = ''; save(); drawTable(); drawRot(); drawMirror(); markAll(); }, 'btn ghost sm'));
      body.appendChild(btns);
      const c = label(S.seat);
      const rk = rankOf(S.seat);
      const read = h('div', { class: 'ws-readout s4-rt-read' });
      Lab.setHTML(read, 'Read from seat 1, clockwise: <b>' + reading(S.seat) + '</b>. Start at ' + nm(0) + ' instead: <b>' + reading(canonTable(S.seat)) + '</b>' +
        (S.mode === 'necklace' && S.n >= 3 ? '; as a necklace (flip allowed) it is listed as <b>' + reading(c) + '</b>' : '') + '.' +
        (rk ? ' This is ' + (S.mode === 'table' ? 'seating' : 'necklace') + ' <b>#' + iH(rk) + '</b> of ' + tx('N=' + iT(total())) + ' in the list below.' : '') +
        (msg ? '<div class="s4-rt-msg">' + msg + '</div>' : ''));
      body.appendChild(read);
    }
    function drawCalc() {
      const body = P.calc.body, n = S.n;
      Lab.clear(body);
      const steps = [];
      steps.push({ html: 'In a straight row, ' + tx('n=' + n) + ' different people can stand in ' + tx('n!=' + n + '!=' + iT(fact(n))) + ' orders (L5.2).' });
      steps.push({ html: 'Around a table there is no first seat. Each seating can be read starting from any of its ' + tx('n=' + n) + ' seats, so it shows up as ' + n + ' different rows (its rotations, next panel). Divide:', math: '\\frac{n!}{n}=\\frac{' + iT(fact(n)) + '}{' + n + '}=' + iT(fact(n - 1)) + '=(n-1)!' });
      const slots = []; for (let k = n - 1; k >= 1; k--) slots.push(k);
      steps.push({ html: 'Same answer by the lecture’s method: fix ' + nm(0) + ' in one seat. The other ' + tx('n-1=' + (n - 1)) + ' seats, going clockwise, are filled like a row — ' + (n - 1) + ' choices, then ' + Math.max(1, n - 2) + ', … (multiplication rule):', math: '(n-1)!=' + (n - 1) + '!=' + (slots.length > 1 ? downTex(n - 1, 1) + '=' : '') + iT(fact(n - 1)) });
      if (S.mode === 'necklace') {
        if (n <= 2) steps.push({ html: 'Necklace with ' + tx('n=' + n) + ': the only seating is its own mirror image, so there is just 1 necklace (no halving).' });
        else steps.push({ html: 'Necklace: turning it over makes each seating equal to its mirror image (clockwise ↔ anticlockwise). For ' + tx('n\\ge 3') + ' a seating is never its own mirror image, so the ' + iH(fact(n - 1)) + ' seatings pair up:', math: '\\frac{(n-1)!}{2}=\\frac{' + iT(fact(n - 1)) + '}{2}=' + iT(fact(n - 1) / 2n) });
      }
      body.appendChild(K.steps(steps));
    }
    function drawRot() {
      const body = P.rot.body, n = S.n;
      Lab.clear(body);
      P.rot.sub('Turn the table one seat at a time: the row read from seat 1 changes, but every person keeps the same two neighbours. ' + tx('n=' + n) + ' rotations = ' + n + ' rows for one seating — that is the ' + tx('\\div n') + '.');
      const g = h('div', { class: 's4-minis' });
      let s = S.seat.slice();
      for (let j = 0; j < n; j++) {
        g.appendChild(h('figure', { class: 's4-mini' }, tableSVG(s, { small: true }), h('figcaption', { html: 'row ' + (j + 1) + ': <b>' + s.map(i => esc(String(names[i]).slice(0, 4))).join(' ') + '</b>' })));
        s = rotCW(s);
      }
      body.appendChild(g);
    }
    function drawMirror() {
      const body = P.mirror.body, n = S.n;
      Lab.clear(body);
      const m = flip(S.seat);
      const sameT = canonTable(S.seat).join() === canonTable(m).join();
      const g = h('div', { class: 's4-minis two' },
        h('figure', { class: 's4-mini' }, tableSVG(S.seat, { small: true }), h('figcaption', { html: 'your seating<br>from ' + nm(0) + ': <b>' + reading(canonTable(S.seat)) + '</b>' })),
        h('figure', { class: 's4-mini' }, tableSVG(m, { small: true }), h('figcaption', { html: 'its mirror image<br>from ' + nm(0) + ': <b>' + reading(canonTable(m)) + '</b>' })));
      body.appendChild(g);
      body.appendChild(K.note(sameT
        ? 'With ' + tx('n=' + n) + ' every seating is its own mirror image (each person has the same people on both sides), so a flip changes nothing.'
        : 'Clockwise from ' + nm(0) + ' these read in opposite directions. At a <b>table</b> they are two different seatings (left and right neighbours swap). On a <b>necklace</b> they are the same — turn it over. That is the ' + tx('\\div 2') + ' in ' + tx('\\frac{(n-1)!}{2}') + '.' + (S.mode === 'table' ? ' (You are counting table seatings now.)' : ' (You are counting necklaces now.)'), 'small'));
    }
    function drawAll() {
      const body = P.all.body, n = S.n;
      Lab.clear(body);
      if (n > 6) { P.all.sub(''); body.appendChild(K.note('With ' + tx('n=' + n) + ' there are ' + tx(iT(total())) + ' — set ' + tx('n') + ' to 6 or less to see them all drawn.', 'small muted')); return; }
      const hotEv = S.ev !== 'none';
      P.all.sub(S.mode === 'table' ? 'All ' + tx('(n-1)!=' + iT(fact(n - 1))) + ' seatings, each read clockwise from ' + nm(0) + '. Click one to sit everyone that way.' + (hotEv ? ' Violet = in your event.' : '')
        : n <= 2 ? 'Only one.' : 'All ' + tx('\\frac{(n-1)!}{2}=' + iT(total())) + ' necklaces; each card holds a seating and its mirror image (the same necklace).' + (hotEv ? ' Violet = in your event.' : ''));
      const g = h('div', { class: 's4-minis all' });
      let k = 0;
      for (const p of tablePerms(n)) {
        if (S.mode === 'necklace' && n >= 3 && !(p[1] < p[n - 1])) continue;
        k++;
        const inEv = hotEv && (S.ev === 'adj' ? adjacent(p, S.a, S.b) : !adjacent(p, S.a, S.b));
        const fig = h('figure', { class: 's4-mini pick' + (inEv ? ' in' : ''), dataset: { key: p.join('.') } });
        const go = () => { S.seat = p.slice(); msg = 'You picked ' + (S.mode === 'table' ? 'seating' : 'necklace') + ' #' + k + '.'; save(); drawTable(); drawRot(); drawMirror(); markAll(); };
        fig.appendChild(tableSVG(p, { small: true, onClick: go }));
        if (S.mode === 'necklace' && n >= 3) fig.appendChild(tableSVG(flip(p), { small: true, onClick: go }));
        fig.appendChild(h('figcaption', { html: '#' + k + ': ' + p.map(i => esc(String(names[i]).slice(0, 4))).join(' ') }));
        g.appendChild(fig);
      }
      body.appendChild(g);
      markAll();
    }
    function markAll() {
      const key = (S.mode === 'table' ? canonTable(S.seat) : canonNeck(S.seat)).join('.');
      Lab.$$('.s4-mini.pick', P.all.body).forEach(f => f.classList.toggle('cur', f.dataset.key === key));
    }
    function drawProb() {
      const body = P.prob.body, n = S.n;
      Lab.clear(body);
      if (S.ev === 'none') { body.appendChild(K.note('Choose an event in the controls (step 4). If everyone is seated at random, all ' + tx(iT(total())) + ' ' + (S.mode === 'table' ? 'seatings' : 'necklaces') + ' are equally likely, so ' + tx('P=\\frac{\\text{favourable}}{\\text{all}}') + '.', 'small muted')); return; }
      const A = nm(S.a), Bn = nm(S.b), tot = total();
      let favAdj;
      if (n === 2) favAdj = 1n;
      else favAdj = S.mode === 'table' ? 2n * fact(n - 2) : fact(n - 2);
      const fav = S.ev === 'adj' ? favAdj : tot - favAdj;
      const box = K.answer();
      box.classList.add('small-answer');
      K.setAnswer(box, { ev: 'Event: ' + A + ' and ' + Bn + (S.ev === 'adj' ? ' sit next to each other.' : ' do <b>not</b> sit next to each other.'), big: 'P=' + fracFull(fav, tot), sub: iH(fav) + ' of the ' + iH(tot) + ' equally likely ' + (S.mode === 'table' ? 'seatings' : 'necklaces') + '.' });
      body.appendChild(box);
      const steps = [];
      if (n === 2) steps.push({ html: 'With only 2 people, ' + A + ' and ' + Bn + ' are always next to each other (on both sides). So the count is 1 of 1.' });
      else if (S.mode === 'table') {
        steps.push({ html: 'Glue ' + A + ' and ' + Bn + ' into one block. Now ' + tx('n-1=' + n + '-1=' + (n - 1)) + ' units sit around the table: ' + tx('(n-2)!=' + (n - 2) + '!=' + iT(fact(n - 2))) + ' ways (fix one unit, arrange the rest).' });
        steps.push({ html: 'Inside the block: ' + A + ' on the left or on the right — ' + tx('2!=2') + ' ways. Multiply:', math: '2\\times(n-2)!=2\\times ' + iT(fact(n - 2)) + '=' + iT(favAdj) });
      } else {
        steps.push({ html: 'Being neighbours does not change when the necklace is turned over, so each necklace stands for exactly 2 table seatings, and both are in the event or both are out. Table count ' + tx('2\\times(n-2)!=2\\times ' + iT(fact(n - 2)) + '=' + iT(2n * fact(n - 2))) + ', halved:', math: '\\frac{2\\times(n-2)!}{2}=(n-2)!=' + iT(favAdj) });
      }
      if (S.ev === 'notadj') steps.push({ html: 'Complement: all minus the ones where they sit together:', math: iT(tot) + '-' + iT(favAdj) + '=' + iT(fav) });
      steps.push({ html: 'Divide by all ' + iH(tot) + ':', math: 'P=' + fracFull(fav, tot) + (n >= 3 ? (S.ev === 'adj' ? ',\\qquad\\text{in symbols }\\frac{2}{n-1}=\\frac{2}{' + (n - 1) + '}' : ',\\qquad\\text{in symbols }1-\\frac{2}{n-1}=\\frac{' + (n - 3) + '}{' + (n - 1) + '}') : '') });
      if (n <= 9) {
        let c = 0n;
        for (const p of tablePerms(n)) { if (S.mode === 'necklace' && n >= 3 && !(p[1] < p[n - 1])) continue; if (S.ev === 'adj' ? adjacent(p, S.a, S.b) : !adjacent(p, S.a, S.b)) c++; }
        steps.push({ html: 'Check by listing every ' + (S.mode === 'table' ? 'seating' : 'necklace') + ': ' + iH(c) + ' of ' + iH(tot) + ' are in the event ' + (c === fav ? '<span class="cgood">✓ matches</span>' : '<span class="cbad">✗ does not match</span>') + '.' });
      }
      steps.push({ html: 'Why ' + tx('\\frac{2}{n-1}') + ': sit ' + A + ' down first. ' + Bn + ' is equally likely to take any of the other ' + tx('n-1') + ' seats, and 2 of them are next to ' + A + '.' });
      body.appendChild(K.steps(steps));
    }
    afterN();
  }

  /* ================================================================ LAB */
  const TABS = [
    { value: 'rules', label: '1 · Rules and factorials', cap: 'AND → multiply, OR → add (L5.1). Build a task from steps and cases and see the slots, the tree and every outcome. Factorial explorer: n! = n × (n−1)!, 0! = 1, n!/m! (L5.2).', build: rulesTab },
    { value: 'same', label: '2 · Identical objects', cap: 'A word or a bag of objects with repeats: n!/(p₁! p₂! ⋯) different rows (L5.4). Label the copies to see why we divide, then ask probability questions.', build: sameTab },
    { value: 'circle', label: '3 · Circular', cap: 'n people around a table: (n−1)! seatings; a necklace that can be turned over: (n−1)!/2 (L5.4). Rotate or flip a seating and see whether it changes.', build: circleTab },
  ];
  function render(host) {
    const st = loadState();
    const save = () => Lab.store.set(KEY, st);
    const bar = h('div', { class: 's4-tabs' }), cap = h('div', { class: 's4-tabcap' }), body = h('div', { class: 's4-body' });
    host.append(bar, cap, body);
    bar.appendChild(Lab.seg(TABS.map(t => ({ label: t.label, value: t.value })), st.tab, v => { st.tab = v; save(); show(); }));
    function restart(part) { st[part] = defaults()[part]; save(); show(); }
    function show() {
      const t = TABS.find(x => x.value === st.tab) || TABS[0];
      cap.textContent = t.cap;
      body.className = 's4-body';
      const { side, main } = K.layout(body, 's4-lab');
      body.classList.add('s4-' + t.value);
      t.build({ side, main, st, save, restart });
    }
    show();
  }

  Lab.lab({
    id: ID, course: 's1', week: 5, order: 2,
    title: 'Arrangements lab', sub: 'Week 5 · rules, identical objects, circles',
    topics: ['addition rule', 'multiplication rule', 'tree', 'n!', '0! = 1', 'n!/(p!q!…)', 'MISSISSIPPI', '(n−1)!', 'necklace (n−1)!/2'],
    desc: 'Build a task from steps (AND) and cases (OR) and watch the slots, the tree and the total; explore n!; type a word or a bag of coloured balls for n!/(p!q!…) with every labelled order; seat people around a table, rotate and flip them, and count (n−1)! and (n−1)!/2.',
    render,
  });
})();
