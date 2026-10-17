/* Playground lab (s1-w06-choose) — Statistics I, Week 6 (L6.1–L6.2), with the "solve for n" equations of L5.4.
   Tab 1 Committees with conditions: groups with sizes and exactly / at least / at most rules → a sum of products
         of combinations (⁵C₄ × ¹²C₇), the complement, and the probability.
   Tab 2 Roles: choose r people, then give out k roles → ⁿCᵣ × ʳPₖ (= ⁿPᵣ when everyone gets a role).
   Tab 3 Pascal: the triangle up to n = 15, ⁿCᵣ = ⁿCₙ₋ᵣ, Pascal's rule as "contains a fixed person or not",
         binomial coefficients in (a + b)ⁿ.
   Tab 4 Permutation or combination?: scenario cards with the learner's numbers, the choice and the reason.
   Tab 5 Solve for n: ⁿPₐ = k·ⁿP_b, ⁿPₐ ÷ ⁿ⁻¹Pₐ = p/q, ⁿCₐ = ⁿC_b, ⁿCₐ = k, ᵐPᵣ = k·ᵐ⁺¹Pᵣ₋₁.
   Rule 0 (LABS.md): every number says where it comes from — symbols first, then the learner's numbers.
   Counts are exact BigInt integers. Styles: assets/css/labs/s4.css (prefix s4-). */
(function () {
  'use strict';
  const { h, svg } = Lab;
  const K = Lab.play;
  const ID = 'lab-s1-choose';
  const KEY = 'lab:' + ID;
  const tx = (s, d) => Lab.tex(s, d);
  const esc = Lab.esc;
  const B = BigInt;
  const SAFE = 9007199254740991n;

  /* ============================================================ exact integers and formatting */
  const FC = [1n];
  function fact(n) { for (let i = FC.length; i <= n; i++) FC[i] = FC[i - 1] * B(i); return FC[n]; }
  function perm(n, r) { if (r < 0 || r > n) return 0n; let x = 1n; for (let i = 0; i < r; i++) x *= B(n - i); return x; }
  function choose(n, r) { if (r < 0 || r > n) return 0n; r = Math.min(r, n - r); let x = 1n; for (let i = 1; i <= r; i++) x = (x * B(n - r + i)) / B(i); return x; }
  function gcd(a, b) { a = a < 0n ? -a : a; b = b < 0n ? -b : b; while (b) { const t = a % b; a = b; b = t; } return a; }
  function isqrt(v) { if (v < 0n) return -1n; if (v < 2n) return v; let x = B(Math.floor(Math.sqrt(Number(v)))); while (x * x > v) x--; while ((x + 1n) * (x + 1n) <= v) x++; return x; }
  const grp = s => String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const iT = v => (String(v).startsWith('-') ? '-' + grp(String(v).slice(1)) : grp(v)).replace(/,/g, '{,}');
  const iH = v => grp(v);
  const plural = (k, w, ws) => iH(k) + ' ' + (String(k) === '1' ? w : ws || w + 's');
  const clone = o => JSON.parse(JSON.stringify(o));
  const Ct = (n, r) => '{}^{' + n + '}C_{' + r + '}';
  const Pt = (n, r) => '{}^{' + n + '}P_{' + r + '}';
  function sci(v) {
    const s = B(v).toString();
    if (s.length < 8) return '';
    const d = s.length;
    const m = (B(s) + 5n * 10n ** B(d - 6)) / 10n ** B(d - 5);
    let e = d - 1, ms = m.toString();
    if (ms.length > 5) { ms = ms.slice(0, 5); e++; }
    return '\\approx ' + ms[0] + '.' + ms.slice(1) + '\\times 10^{' + e + '}';
  }
  function bigNote(...vals) {
    if (!vals.some(v => B(v) > SAFE)) return '';
    return '<div class="s4-bignote">Exact big integers: ' + tx('2^{53}\\approx 9.007\\times 10^{15}') + ' is the largest size up to which ordinary JavaScript numbers hold every whole number. Your count is bigger, so this lab computes it with BigInt — every digit shown is exact.</div>';
  }
  function ratioNum(n, d) {
    if (n === 0n) return 0;
    const sh = d.toString().length - n.toString().length + 18;
    const q = sh >= 0 ? (n * 10n ** B(sh)) / d : n / (d * 10n ** B(-sh));
    return Number(q) / Math.pow(10, sh);
  }
  function decTail(n, d) {
    if (d === 0n || n % d === 0n) return '';
    const v = ratioNum(n, d);
    if (v < 1e-4) { const [m, e] = v.toExponential(3).split('e'); return '\\approx ' + m + '\\times 10^{' + parseInt(e, 10) + '}'; }
    const S10 = 10000n;
    const exact = (n * S10) % d === 0n;
    const r = (2n * n * S10 + d) / (2n * d);
    let s = r.toString().padStart(5, '0');
    s = s.slice(0, -4) + '.' + s.slice(-4);
    if (exact) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return (exact ? '=' : '\\approx ') + s;
  }
  function fracFull(n, d) {
    n = B(n); d = B(d);
    const g = gcd(n, d) || 1n;
    let s = '\\frac{' + iT(n) + '}{' + iT(d) + '}';
    if (g !== 1n) s += '=' + (d / g === 1n ? iT(n / g) : '\\frac{' + iT(n / g) + '}{' + iT(d / g) + '}');
    return s + decTail(n, d);
  }
  function downTex(hi, lo) {
    if (hi < lo) return '1';
    const k = hi - lo + 1;
    if (k <= 8) { const a = []; for (let v = hi; v >= lo; v--) a.push(v); return a.join('\\times '); }
    return hi + '\\times ' + (hi - 1) + '\\times ' + (hi - 2) + '\\times\\cdots\\times ' + (lo + 1) + '\\times ' + lo;
  }
  const plainLen = t => String(t).replace(/\{,\}/g, ',').replace(/\\[a-zA-Z]+/g, 'x').replace(/[{}\\]/g, '').length;
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
  /** lhs = parts[0] = parts[1] = …, broken over aligned lines when it would not fit (big = answer box size). */
  function eqChain(lhs, parts, big, width) {
    parts = parts.filter(p => p !== '' && p != null);
    const narrow = window.innerWidth < 600;
    const max = width || (big ? (narrow ? 20 : 46) : (narrow ? 30 : 72));
    const one = (lhs ? lhs + '=' : '') + parts.join('=');
    if (plainLen(one) <= max) return one;
    const lines = [];
    let cur = '';
    parts.forEach(p => {
      const cand = cur ? cur + '=' + p : p;
      if (cur && plainLen((lines.length ? '' : lhs + '=') + cand) > max) { lines.push(cur); cur = p; } else cur = cand;
    });
    lines.push(cur);
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
  const numIn = v => (String(v).length <= 15 ? tx(iT(v)) : '<span class="s4-longnum">' + iH(v) + '</span>');
  /** ⁿCᵣ worked out: [ⁿCᵣ, n!/(r!(n−r)!), falling product / k!, value]. */
  function cParts(n, r) {
    const k = Math.min(r, n - r);
    const parts = [Ct(n, r), '\\frac{' + n + '!}{' + r + '!\\,' + (n - r) + '!}'];
    if (k >= 1 && k <= 7) parts.push('\\frac{' + downTex(n, n - k + 1) + '}{' + downTex(k, 1) + '}');
    if (k >= 2) parts.push('\\frac{' + iT(perm(n, k)) + '}{' + iT(fact(k)) + '}');
    parts.push(iT(choose(n, r)));
    return parts;
  }
  function pParts(n, r) {
    const parts = [Pt(n, r), '\\frac{' + n + '!}{(' + n + '-' + r + ')!}'];
    if (r >= 1 && r <= 8) parts.push(downTex(n, n - r + 1));
    parts.push(iT(perm(n, r)));
    return parts;
  }
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
  function tableEl(head, rows, cls) {
    const t = h('table', { class: 'tbl ' + (cls || '') });
    if (head) t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach(r => tb.appendChild(h('tr', { class: r.hl ? 'hl-row' : null }, (r.cells || r).map(c => h('td', { html: c })))));
    t.appendChild(tb);
    return h('div', { class: 'tbl-wrap' }, t);
  }
  const COLS = [0, 1, 2, 4, 5, 6, 8, 9, 7]; // never violet: violet marks what is chosen
  const letters = n => Array.from({ length: n }, (_, i) => (n <= 26 ? String.fromCharCode(65 + i) : 'P' + (i + 1)));

  /* ============================================================ state */
  const COMM_PRESETS = [
    { label: 'L6.1 Cricket: 11 of 17, exactly 4 of the 5 bowlers', source: 'L6.1 (combinations). 17 players, 5 of them bowlers. The team of 11 must have exactly 4 bowlers, so the other 7 come from the 12 non-bowlers: ⁵C₄ × ¹²C₇ = 5 × 792 = 3,960.',
      groups: [{ name: 'bowlers', n: 5, cond: 'exactly', k: 4 }, { name: 'non-bowlers', n: 12, cond: 'any', k: 0 }], r: 11, whole: 'none' },
    { label: 'L6.1 Exam: 8 of 12 questions, at least 3 from each part', source: 'L6.1. Part 1 has 7 questions, part 2 has 5. Answer 8 with at least 3 from each part: ⁷C₃·⁵C₅ + ⁷C₄·⁵C₄ + ⁷C₅·⁵C₃ = 35 + 175 + 210 = 420.',
      groups: [{ name: 'part 1', n: 7, cond: 'atleast', k: 3 }, { name: 'part 2', n: 5, cond: 'atleast', k: 3 }], r: 8, whole: 'none' },
    { label: 'L6.1 Cards: any 4 cards from 52', source: 'L6.1. No condition at all: ⁵²C₄ = 270,725.',
      groups: [{ name: 'cards', n: 52, cond: 'any', k: 0 }], r: 4, whole: 'none' },
    { label: 'L6.1 Cards: 4 cards of the same suit', source: 'L6.1. Choose the suit (⁴C₁ = 4 ways), then 4 of its 13 cards (¹³C₄ = 715): 4 × 715 = 2,860.',
      groups: [{ name: 'clubs', n: 13, cond: 'any', k: 0 }, { name: 'spades', n: 13, cond: 'any', k: 0 }, { name: 'hearts', n: 13, cond: 'any', k: 0 }, { name: 'diamonds', n: 13, cond: 'any', k: 0 }], r: 4, whole: 'one' },
    { label: 'L6.1 Cards: 4 cards of the same colour', source: 'L6.1. Choose the colour (²C₁ = 2 ways), then 4 of its 26 cards (²⁶C₄ = 14,950): 2 × 14,950 = 29,900.',
      groups: [{ name: 'red', n: 26, cond: 'any', k: 0 }, { name: 'black', n: 26, cond: 'any', k: 0 }], r: 4, whole: 'one' },
    { label: 'Practice: 5 from 6 men and 4 women, at least 2 women', source: 'Practice (not from the lecture). All committees ¹⁰C₅ = 252; take away those with 0 women (⁶C₅ = 6) or 1 woman (⁴C₁·⁶C₄ = 60): 252 − 66 = 186.',
      groups: [{ name: 'men', n: 6, cond: 'any', k: 0 }, { name: 'women', n: 4, cond: 'atleast', k: 2 }], r: 5, whole: 'none' },
    { label: 'Practice: 3 from 4 boys and 3 girls, at most 1 girl', source: 'Practice (not from the lecture): ⁴C₃·³C₀ + ⁴C₂·³C₁ = 4 + 18 = 22.',
      groups: [{ name: 'boys', n: 4, cond: 'any', k: 0 }, { name: 'girls', n: 3, cond: 'atmost', k: 1 }], r: 3, whole: 'none' },
  ];
  const ROLE_PRESETS = [
    { label: 'L6.2 Two class representatives from 40', n: 40, r: 2, roles: '', source: 'L6.2 (applications). Two representatives, no order between them: ⁴⁰C₂ = 780.' },
    { label: 'L6.2 Captain and vice-captain from 40', n: 40, r: 2, roles: 'captain, vice-captain', source: 'L6.2. Now the two posts differ: ⁴⁰P₂ = 1,560 = ⁴⁰C₂ × 2! = 780 × 2.' },
    { label: 'L5.3 Chairman and vice-chairman from 8', n: 8, r: 2, roles: 'chairman, vice-chairman', source: 'L5.3 (permutations). A committee of 8: ⁸P₂ = 8 × 7 = 56.' },
    { label: 'L6.2 8 athletes: gold, silver, bronze', n: 8, r: 3, roles: 'gold, silver, bronze', source: 'L6.2. Order matters: ⁸P₃ = 336 = ⁸C₃ × 3! = 56 × 6.' },
    { label: 'L6.2 8 athletes: top 3 go to the next round', n: 8, r: 3, roles: '', source: 'L6.2. Only who goes through matters: ⁸C₃ = 56.' },
    { label: 'Practice: team of 11 from 15, then captain and vice-captain', n: 15, r: 11, roles: 'captain, vice-captain', source: 'Practice (not from the lecture): ¹⁵C₁₁ × 11 × 10 = 1,365 × 110 = 150,150.' },
  ];
  const PASCAL_PRESETS = [
    { label: 'L6.1 Fix A: ⁵C₃ = ⁴C₂ + ⁴C₃', n: 5, r: 3, source: 'L6.1. Choose 3 of A, B, C, D, E. Committees with A: choose 2 more from 4 (⁴C₂ = 6); without A: all 3 from the other 4 (⁴C₃ = 4). 6 + 4 = 10 = ⁵C₃.' },
    { label: 'L6.1 Three students, choose two: ³C₂', n: 3, r: 2, source: 'L6.1. AB, AC, BC: ³C₂ = 3, and each pair has 2! orders, so ³P₂ = 6.' },
    { label: 'Practice: ¹⁰C₄ = ¹⁰C₆', n: 10, r: 4, source: 'Practice (not from the lecture): choosing 4 to take = choosing 6 to leave, ¹⁰C₄ = ¹⁰C₆ = 210.' },
  ];
  const SOLVE_PRESETS = [
    { label: 'L5.4 ⁿP₄ = 20 · ⁿP₂', form: 'pp', a: 4, b: 2, k: 20, source: 'L5.4: cancel n!, then (n − 2)(n − 3) = 20, so n² − 5n − 14 = 0 and n = 7 (n = −2 is rejected).' },
    { label: 'L5.4 ⁿP₄ ÷ ⁿ⁻¹P₄ = 5/3', form: 'ratio', a: 4, p: 5, q: 3, source: 'L5.4: the ratio is n/(n − 4) = 5/3, so 3n = 5n − 20 and n = 10.' },
    { label: 'L5.4 ⁵Pᵣ = 2 · ⁶Pᵣ₋₁', form: 'rr', m: 5, k: 2, source: 'L5.4: (7 − r)(6 − r) = 12, so r² − 13r + 30 = 0, r = 3 or 10; ⁵Pᵣ needs r ≤ 5, so r = 3.' },
    { label: 'Notes: ⁿP₄ ÷ ⁿP₃ = k (k = 5)', form: 'pp', a: 4, b: 3, k: 5, source: 'Week 6 notes: equations in n — expand and cancel. ⁿP₄ ÷ ⁿP₃ = n − 3.' },
    { label: 'Practice: ⁿC₂ = 45 (handshakes)', form: 'ck', a: 2, k: 45, source: 'Practice (not from the lecture): n(n − 1)/2 = 45 gives n = 10.' },
    { label: 'Practice: ⁿC₈ = ⁿC₆', form: 'cc', a: 8, b: 6, source: 'Practice (not from the lecture): ⁿCᵣ = ⁿCₙ₋ᵣ gives n = 8 + 6 = 14.' },
  ];
  function defaults() {
    const c = COMM_PRESETS[0], ro = ROLE_PRESETS[1];
    return {
      tab: 'committee',
      committee: { groups: clone(c.groups), r: c.r, whole: c.whole, src: c.label },
      roles: { n: ro.n, r: ro.r, roles: ro.roles, src: ro.label },
      pascal: { n: 5, r: 3, a: 2, b: 3, src: PASCAL_PRESETS[0].label },
      which: { first: {}, last: {}, nums: {}, showAll: false, sel: 'medal', open: {} },
      solve: { form: 'pp', a: 4, b: 2, k: 20, p: 5, q: 3, m: 5, src: SOLVE_PRESETS[0].label },
    };
  }
  const intIn = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
  function loadState() {
    const d = defaults();
    const got = Lab.store.get(KEY, null) || {};
    const st = { tab: ['committee', 'roles', 'pascal', 'which', 'solve'].includes(got.tab) ? got.tab : d.tab };
    st.committee = Object.assign(d.committee, got.committee || {});
    const C = st.committee;
    if (!Array.isArray(C.groups) || C.groups.length < 1 || C.groups.length > 5 || C.groups.some(g => !g || !intIn(g.n, 0, 60) || !intIn(g.k, 0, 60) || !['any', 'exactly', 'atleast', 'atmost'].includes(g.cond)) || !intIn(C.r, 0, 300) || !['none', 'one', 'each'].includes(C.whole)) st.committee = defaults().committee;
    st.roles = Object.assign(d.roles, got.roles || {});
    if (!intIn(st.roles.n, 1, 60) || !intIn(st.roles.r, 0, 60) || typeof st.roles.roles !== 'string') st.roles = defaults().roles;
    st.pascal = Object.assign(d.pascal, got.pascal || {});
    if (!intIn(st.pascal.n, 0, 15) || !intIn(st.pascal.r, 0, 15) || !intIn(st.pascal.a, -20, 20) || !intIn(st.pascal.b, -20, 20)) st.pascal = defaults().pascal;
    st.which = Object.assign(d.which, got.which || {});
    if (typeof st.which.first !== 'object' || typeof st.which.nums !== 'object' || typeof st.which.last !== 'object') st.which = defaults().which;
    if (!CARDS.some(c => c.id === st.which.sel)) st.which.sel = CARDS[0].id;
    if (!st.which.open || typeof st.which.open !== 'object') st.which.open = {};
    st.solve = Object.assign(d.solve, got.solve || {});
    const So = st.solve;
    if (!['pp', 'ratio', 'cc', 'ck', 'rr'].includes(So.form) || ![So.a, So.b, So.k, So.p, So.q, So.m].every(Number.isInteger)) st.solve = defaults().solve;
    return st;
  }

  /* ================================================================ TAB 1 — COMMITTEES */
  const CONDS = [{ value: 'any', label: 'any number' }, { value: 'exactly', label: 'exactly' }, { value: 'atleast', label: 'at least' }, { value: 'atmost', label: 'at most' }];
  const condOK = (g, k) => (g.cond === 'exactly' ? k === g.k : g.cond === 'atleast' ? k >= g.k : g.cond === 'atmost' ? k <= g.k : true);
  const condWords = g => ({ any: 'any number', exactly: 'exactly ' + g.k, atleast: 'at least ' + g.k, atmost: 'at most ' + g.k })[g.cond];
  const gName = (g, i) => (g.name ? esc(g.name) : 'group ' + (i + 1));

  function committeeTab({ side, main, st, save, restart }) {
    const S = st.committee;
    let D = null, example = null;
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: COMM_PRESETS, onPick: it => { S.groups = clone(it.groups); S.r = it.r; S.whole = it.whole; S.src = it.label; save(); buildGroups(); syncR(); draw(); } });
    side.appendChild(pre);
    showSource(pre, COMM_PRESETS, S.src);
    side.appendChild(K.group('2 · The people, in groups'));
    side.appendChild(K.note('Each group: a name, how many people it has, and how many of them the committee must take.'));
    const ged = h('div', { class: 's4-editor' });
    side.appendChild(ged);
    side.appendChild(K.group('3 · The committee'));
    const rF = K.numField({ label: 'Committee size ' + tx('r'), min: 0, max: 17, value: S.r, onChange: v => { S.r = v; touched(); draw(); } });
    side.appendChild(rF);
    const wF = K.selectField({ label: 'A rule for the whole committee', options: [{ value: 'none', label: 'no extra rule' }, { value: 'one', label: 'all r from one single group' }, { value: 'each', label: 'at least one from every group' }], value: S.whole, onChange: v => { S.whole = v; touched(); draw(); } });
    side.appendChild(wF);
    side.appendChild(resetBtn(() => restart('committee')));

    const P = {};
    P.answer = K.answer();
    P.people = K.panel('The people and one allowed committee', 'One dot per person, coloured by group. Violet rings = the members of one committee that obeys your rules.');
    P.splits = K.panel('Every way to split the committee between the groups', 'A split says how many members come from each group. Each split is a product of combinations; the allowed splits add up.');
    P.calc = K.panel('How it is computed, with your numbers');
    main.append(P.answer, P.people, P.splits, P.calc);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, COMM_PRESETS, ''); } save(); };
    const drawSoon = Lab.debounce(() => draw(), 180);

    function buildGroups() {
      Lab.clear(ged);
      S.groups.forEach((g, i) => {
        const box = h('div', { class: 's4-case s4-grpbox s4-k' + COLS[i % COLS.length] });
        const nm = h('input', { class: 'field s4-in', value: g.name, placeholder: 'group ' + (i + 1), maxlength: '20', spellcheck: 'false', 'aria-label': 'name of group ' + (i + 1) });
        nm.addEventListener('input', () => { g.name = nm.value; touched(); drawSoon(); });
        const sz = h('input', { class: 'field mono s4-in s4-sz', type: 'number', min: '0', max: '60', step: '1', value: String(g.n), 'aria-label': 'size of group ' + (i + 1) });
        const cs = h('select', { class: 'field s4-in s4-cond', 'aria-label': 'rule for group ' + (i + 1) });
        CONDS.forEach(o => cs.appendChild(h('option', { value: o.value, text: o.label })));
        cs.value = g.cond;
        const kk = h('input', { class: 'field mono s4-in s4-kk', type: 'number', min: '0', max: '60', step: '1', value: String(g.k), 'aria-label': 'number for group ' + (i + 1) });
        kk.hidden = g.cond === 'any';
        const msg = h('div', { class: 'pl-hint' });
        const check = () => {
          const bad = g.cond !== 'any' && g.k > g.n;
          kk.classList.toggle('bad', bad);
          Lab.setHTML(msg, bad ? '<span class="cbad">' + condWords(g) + ' is more than the ' + g.n + ' people in this group, so no committee can obey it.</span>' : '');
        };
        sz.addEventListener('input', () => { const v = parseInt(sz.value, 10); if (Number.isFinite(v)) { g.n = Math.max(0, Math.min(60, v)); check(); touched(); syncR(); drawSoon(); } });
        sz.addEventListener('change', () => { sz.value = String(g.n); });
        cs.addEventListener('change', () => { g.cond = cs.value; kk.hidden = g.cond === 'any'; check(); touched(); draw(); });
        kk.addEventListener('input', () => { const v = parseInt(kk.value, 10); if (Number.isFinite(v)) { g.k = Math.max(0, Math.min(60, v)); check(); touched(); drawSoon(); } });
        kk.addEventListener('change', () => { kk.value = String(g.k); });
        check();
        box.append(
          h('div', { class: 's4-grow1' }, h('span', { class: 's4-gdot' }), nm, h('span', { class: 's4-glab', text: 'people' }), sz, S.groups.length > 1 ? iconBtn('remove group ' + (i + 1), () => { S.groups.splice(i, 1); touched(); buildGroups(); syncR(); draw(); }) : h('span', { class: 's4-del-pad' })),
          h('div', { class: 's4-grow2' }, h('span', { class: 's4-glab', text: 'take' }), cs, kk),
          msg);
        ged.appendChild(box);
      });
      if (S.groups.length < 5) ged.appendChild(h('div', { class: 'pl-chips' }, Lab.button('+ group', () => { S.groups.push({ name: '', n: 4, cond: 'any', k: 0 }); touched(); buildGroups(); syncR(); draw(); }, 'btn xs')));
    }
    function syncR() {
      const N = S.groups.reduce((a, g) => a + g.n, 0);
      rF.setRange(0, Math.max(0, N));
      S.r = Math.max(0, Math.min(S.r, N));
      rF.set(S.r);
      rF.hint(tx('r') + ' can be 0 to ' + tx('N=' + N) + ', the number of people in all groups together.');
      wF.select.value = S.whole;
    }
    function validSplit(ks, G) {
      if (!ks.every((k, i) => condOK(G[i], k))) return false;
      if (S.whole === 'one') return ks.filter(k => k > 0).length === 1;
      if (S.whole === 'each') return ks.every(k => k >= 1);
      return true;
    }
    function whyNot(ks, G) {
      for (let i = 0; i < G.length; i++) if (!condOK(G[i], ks[i])) return 'needs ' + condWords(G[i]) + ' from ' + gName(G[i], i);
      if (S.whole === 'one') return 'not all from one group';
      if (S.whole === 'each') return 'misses a group';
      return '';
    }
    function compute() {
      const G = S.groups.map(g => ({ name: g.name || '', n: g.n, cond: g.cond, k: g.k }));
      const N = G.reduce((a, g) => a + g.n, 0);
      const r = Math.min(S.r, N);
      const total = choose(N, r);
      const allowed = G.map(g => { const a = []; for (let k = 0; k <= g.n; k++) if (condOK(g, k) && !(S.whole === 'each' && k === 0)) a.push(k); return a; });
      let fav;
      if (S.whole === 'one') {
        fav = 0n;
        if (r > 0) G.forEach((g, i) => { if (allowed[i].includes(r) && G.every((g2, j) => j === i || allowed[j].includes(0))) fav += choose(g.n, r); });
      } else {
        let poly = [1n];
        G.forEach((g, i) => {
          const nx = new Array(poly.length + g.n).fill(0n);
          poly.forEach((c, s) => { if (c) allowed[i].forEach(k => { nx[s + k] += c * choose(g.n, k); }); });
          poly = nx;
        });
        fav = r < poly.length ? poly[r] : 0n;
      }
      let cnt = [1n];
      G.forEach(g => { const nx = new Array(cnt.length + g.n).fill(0n); cnt.forEach((c, s) => { for (let k = 0; k <= g.n; k++) nx[s + k] += c; }); cnt = nx; });
      const nSplits = r < cnt.length ? cnt[r] : 0n;
      let splits = null;
      if (nSplits <= 3000n) {
        const out = [], cur = [];
        (function rec(i, left) {
          if (i === G.length) { if (left === 0) out.push(cur.slice()); return; }
          const capRest = G.slice(i + 1).reduce((a, g) => a + g.n, 0);
          for (let k = Math.max(0, left - capRest); k <= Math.min(G[i].n, left); k++) { cur.push(k); rec(i + 1, left - k); cur.pop(); }
        })(0, r);
        splits = out.map(ks => ({ ks, term: ks.reduce((a, k, i) => a * choose(G[i].n, k), 1n), ok: validSplit(ks, G) }));
      }
      return { G, N, r, total, fav, nSplits, splits };
    }
    function firstValid() {
      if (D.fav === 0n) return null;
      if (D.splits) { const s = D.splits.find(x => x.ok); return s ? s.ks : null; }
      let found = null;
      const cur = [];
      (function rec(i, left) {
        if (found) return;
        if (i === D.G.length) { if (left === 0 && validSplit(cur, D.G)) found = cur.slice(); return; }
        for (let k = Math.min(D.G[i].n, left); k >= 0 && !found; k--) { cur.push(k); rec(i + 1, left - k); cur.pop(); }
      })(0, D.r);
      return found;
    }
    function pickExample(random) {
      example = null;
      if (D.fav === 0n) return;
      if (random) {
        const ids = [];
        D.G.forEach((g, i) => { for (let j = 0; j < g.n; j++) ids.push([i, j]); });
        for (let t = 0; t < 4000; t++) {
          const a = ids.slice();
          for (let q = 0; q < D.r; q++) { const z = q + Math.floor(Math.random() * (a.length - q)); [a[q], a[z]] = [a[z], a[q]]; }
          const chosen = a.slice(0, D.r);
          const ks = D.G.map((_, i) => chosen.filter(c => c[0] === i).length);
          if (validSplit(ks, D.G)) { example = D.G.map((_, i) => new Set(chosen.filter(c => c[0] === i).map(c => c[1]))); return; }
        }
      }
      const ks = firstValid();
      if (ks) example = ks.map(k => new Set(Array.from({ length: k }, (_, j) => j)));
    }

    function draw() {
      D = compute();
      pickExample(false);
      drawAnswer(); drawPeople(); drawSplits(); drawCalc();
    }
    const rulesWords = () => {
      const w = D.G.map((g, i) => (g.cond === 'any' ? null : condWords(g) + ' from ' + gName(g, i))).filter(Boolean);
      if (S.whole === 'one') w.push('all from one single group');
      if (S.whole === 'each') w.push('at least one from every group');
      return w;
    };
    const validList = () => (D.splits ? D.splits.filter(s => s.ok) : null);
    const equalSizes = () => D.G.every(g => g.n === D.G[0].n);
    function drawAnswer() {
      const G = D.G, r = D.r;
      const rw = rulesWords();
      const ev = 'Committees of ' + tx('r=' + r) + ' from ' + tx('N=' + D.N) + ' people (' + G.map((g, i) => gName(g, i) + ': ' + g.n).join(', ') + ')' + (rw.length ? ' with ' + rw.join(', ') : ', no conditions') + '.';
      let big;
      const V = validList();
      if (G.length === 1 && !rw.length) big = eqChain('', cParts(G[0].n, r).slice(0, 2).concat(iT(D.fav) + sci(D.fav)), true);
      else if (S.whole === 'one' && equalSizes() && G.every(g => g.cond === 'any') && r > 0) big = eqChain('', [Ct(G.length, 1) + '\\times ' + Ct(G[0].n, r), G.length + '\\times ' + iT(choose(G[0].n, r)), iT(D.fav) + sci(D.fav)], true);
      else if (V && V.length >= 1 && V.length <= 4) {
        const sym = V.map(s => s.ks.map((k, i) => Ct(G[i].n, k)).join('\\times ')).join('+');
        const vals = V.map(s => s.ks.map((k, i) => iT(choose(G[i].n, k))).join('\\times ')).join('+');
        big = eqChain('', [sym, vals, V.length > 1 ? V.map(s => iT(s.term)).join('+') : '', iT(D.fav) + sci(D.fav)], true);
      } else big = '\\text{allowed committees}=' + iT(D.fav) + sci(D.fav);
      const sub = (D.fav === 0n ? 'No committee obeys all your rules' : plural(D.fav, 'committee') + (D.fav === 1n ? ' obeys' : ' obey') + ' your rules') + ', out of ' + tx(Ct(D.N, r) + '=' + iT(D.total)) + ' committees in all. If the committee is picked at random (all equally likely): ' + tx('P=' + fracFull(D.fav, D.total)) + '.' + bigNote(D.total);
      K.setAnswer(P.answer, { ev, big, sub });
    }
    function drawPeople() {
      const body = P.people.body;
      Lab.clear(body);
      const wrap = h('div', { class: 's4-people' });
      D.G.forEach((g, i) => {
        const dots = h('div', { class: 's4-pdots' });
        for (let j = 0; j < g.n; j++) dots.appendChild(h('span', { class: 's4-pd' + (example && example[i].has(j) ? ' on' : ''), title: gName(g, i) + ' ' + (j + 1) }));
        const k = example ? example[i].size : 0;
        wrap.appendChild(h('div', { class: 's4-prow s4-k' + COLS[i % COLS.length] }, h('div', { class: 's4-plab', html: '<b>' + gName(g, i) + '</b> · ' + g.n + (example ? ' · <span class="cpick">' + k + ' chosen</span>' : '') }), dots));
      });
      body.appendChild(wrap);
      const ks = example ? example.map(s => s.size) : null;
      body.appendChild(K.note(example ? 'This committee takes ' + ks.map((k, i) => k + ' from ' + gName(D.G[i], i)).join(' + ') + ' = ' + D.r + ' people. It is one of the ' + iH(D.fav) + ' allowed committees.' : 'No committee obeys your rules — nothing to show.', 'small'));
      if (D.fav > 0n) body.appendChild(h('div', { class: 'btn-row' }, Lab.button('Show another allowed committee', () => { pickExample(true); drawPeople(); }, 'btn sm')));
    }
    function drawSplits() {
      const body = P.splits.body;
      Lab.clear(body);
      const G = D.G;
      if (!D.splits) { body.appendChild(K.note('There are ' + iH(D.nSplits) + ' possible splits — too many to list. The allowed committees were added up exactly anyway: ' + numIn(D.fav) + '.', 'small muted')); return; }
      const V = D.splits.filter(s => s.ok);
      if (G.length === 2 && D.splits.length > 1) {
        const rows = D.splits.map(s => ({ x: s.ks[0], p: Number(s.term) || 0, label: iT(s.term), hot: s.ok }));
        body.appendChild(K.pmfChart(rows, { xName: 'k_1', height: 170 }));
        body.appendChild(K.note('Bars: committees with ' + tx('k_1') + ' from ' + gName(G[0], 0) + ' (and the rest, ' + tx('r-k_1') + ', from ' + gName(G[1], 1) + '). Violet bars are allowed.', 'small muted'));
      }
      const LIM = 40;
      let show = D.splits;
      if (show.length > LIM) show = V.slice(0, LIM);
      const head = G.map((g, i) => 'from ' + gName(g, i) + ' (' + g.n + ')').concat(['committees', 'allowed?']);
      const rows = show.map(s => ({ hl: s.ok, cells: s.ks.map(k => tx('k=' + k)).concat([tx(G.length > 1 ? s.ks.map((k, i) => Ct(G[i].n, k)).join('\\times ') + '=' + s.ks.map((k, i) => iT(choose(G[i].n, k))).join('\\times ') + '=' + iT(s.term) : Ct(G[0].n, s.ks[0]) + '=' + iT(s.term)), s.ok ? '<span class="cgood">✓ allowed</span>' : '<span class="muted">✗ ' + whyNot(s.ks, G) + '</span>']) }));
      body.appendChild(tableEl(head, rows, 's4-split'));
      if (show.length < D.splits.length) body.appendChild(K.note('Showing the first ' + show.length + ' allowed splits of ' + V.length + ' (and none of the ' + (D.splits.length - V.length) + ' that are not allowed). The totals use all of them.', 'small muted'));
      const sumAll = D.splits.reduce((a, s) => a + s.term, 0n);
      body.appendChild(K.note('Check: all ' + plural(D.splits.length, 'split') + ' together give ' + iH(sumAll) + ' = ' + tx(Ct(D.N, D.r) + '=' + iT(D.total)) + ' ' + (sumAll === D.total ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>') + ' — every committee has exactly one split.', 'small'));
    }
    function drawCalc() {
      const body = P.calc.body;
      Lab.clear(body);
      const G = D.G, r = D.r, steps = [];
      steps.push({ html: 'All the people: ' + tx('N=' + (G.length > 1 ? G.map(g => g.n).join('+') + '=' : '') + D.N) + '. With no conditions, a committee is any ' + r + ' of them — order does not matter, so it is a combination (L6.1):', math: eqChain('', cParts(D.N, r).slice(0, -1).concat(iT(D.total) + sci(D.total))) });
      if (G.length > 1) steps.push({ html: 'Sort the committees by their split: ' + tx('k_1') + ' from ' + gName(G[0], 0) + ', ' + tx('k_2') + ' from ' + gName(G[1], 1) + (G.length > 2 ? ', …' : '') + '. For one split, choose the members of each group separately — ' + tx(G.map((g, i) => Ct('n_' + (i + 1), 'k_' + (i + 1))).join('\\times ')) + ' ways (AND → multiply). Different splits never share a committee, so the splits add (OR → add).' });
      const V = validList();
      const rw = rulesWords();
      if (!rw.length) steps.push({ html: 'You set no conditions, so every committee counts: ' + tx(iT(D.fav)) + '.' });
      else if (S.whole === 'one') {
        const terms = G.map((g, i) => Ct(g.n, r)).join('+');
        steps.push({ html: 'All ' + r + ' from one single group: one split per group (all ' + r + ' there, 0 elsewhere). Add them:', math: eqChain('', [terms, G.map(g => iT(choose(g.n, r))).join('+'), iT(D.fav)]), note: equalSizes() && G.every(g => g.cond === 'any') ? 'All groups have ' + G[0].n + ' people, so this is the lecture’s “choose the group, then the members”: ' + tx(Ct(G.length, 1) + '\\times ' + Ct(G[0].n, r) + '=' + G.length + '\\times ' + iT(choose(G[0].n, r)) + '=' + iT(D.fav)) + '.' : '' });
      } else if (V) {
        if (!V.length) steps.push({ html: 'Your rules (' + rw.join(', ') + ') allow no split, so there is no committee: 0.' });
        else if (V.length <= 6) steps.push({ html: 'Your rules: ' + rw.join(', ') + '. They allow ' + plural(V.length, 'split') + ':', math: eqChain('', [V.map(s => s.ks.map((k, i) => Ct(G[i].n, k)).join('\\times ')).join('+'), V.map(s => iT(s.term)).join('+'), iT(D.fav)]) });
        else steps.push({ html: 'Your rules: ' + rw.join(', ') + '. They allow ' + plural(V.length, 'split') + (V.length <= 40 ? ' (all listed in the table above)' : ' (the table above shows the first 40)') + '. Add their products:', math: '\\sum_{\\text{allowed splits}}\\;\\prod_{i}{}^{n_i}C_{k_i}=' + iT(D.fav) });
      } else steps.push({ html: 'Your rules: ' + rw.join(', ') + '. Adding the allowed splits (too many to write out) gives ' + numIn(D.fav) + '.' });
      // every combination used, worked out once
      if (V && V.length && V.length <= 6) {
        const pairs = [];
        V.forEach(s => s.ks.forEach((k, i) => { const key = G[i].n + ',' + k; if (!pairs.includes(key)) pairs.push(key); }));
        if (S.whole === 'one') G.forEach(g => { const key = g.n + ',' + r; if (!pairs.includes(key)) pairs.push(key); });
        const lines = pairs.slice(0, 8).map(key => { const [n, k] = key.split(',').map(Number); return cParts(n, k).join('='); });
        steps.push({ html: 'Each combination above, from ' + tx(Ct('n', 'r') + '=\\frac{n!}{r!\\,(n-r)!}') + ':', math: lines.length > 1 ? '\\begin{aligned}' + lines.map(l => '&' + l).join('\\\\[6pt]') + '\\end{aligned}' : lines[0] });
      }
      // the complement
      if (rw.length && D.fav < D.total && D.splits) {
        const bad = D.splits.filter(s => !s.ok);
        const badSum = bad.reduce((a, s) => a + s.term, 0n);
        const one = G.filter(g => g.cond === 'atleast').length === 1 && G.every(g => g.cond === 'any' || g.cond === 'atleast') && S.whole === 'none';
        let html = 'The same number from the other side (complement): all committees minus the ones your rules forbid' + (bad.length <= 6 ? ' (' + bad.map(s => '(' + s.ks.join(', ') + ')').join(', ') + ')' : ' (' + bad.length + ' splits)') + ':';
        if (one) {
          const gi = G.findIndex(g => g.cond === 'atleast'), g = G[gi], other = D.N - g.n;
          html = '“At least ' + g.k + ' ' + gName(g, gi) + '” is the opposite of “at most ' + (g.k - 1) + '”. Count those and subtract (complement):';
          const lows = [];
          for (let j = 0; j < g.k && j <= r; j++) if (r - j <= other) lows.push(j);
          steps.push({ html, math: eqChain('', [Ct(D.N, r) + '-\\left(' + lows.map(j => Ct(g.n, j) + '\\,' + Ct(other, r - j)).join('+') + '\\right)', iT(D.total) + '-(' + lows.map(j => iT(choose(g.n, j) * choose(other, r - j))).join('+') + ')', iT(D.total) + '-' + iT(badSum), iT(D.total - badSum)]) });
        } else steps.push({ html: html + (bad.length > 6 ? ' (the ✗ rows of the table add up to ' + numIn(badSum) + ')' : ''), math: eqChain('', [bad.length <= 6 && bad.length > 1 ? iT(D.total) + '-(' + bad.map(x => iT(x.term)).join('+') + ')' : '', iT(D.total) + '-' + iT(badSum), iT(D.total - badSum)]) });
      }
      steps.push({ html: 'As a probability: pick one committee at random, every one of the ' + iH(D.total) + ' equally likely. Then', math: 'P=\\frac{\\text{allowed}}{\\text{all}}=' + fracFull(D.fav, D.total) });
      body.appendChild(K.steps(steps));
    }
    buildGroups();
    syncR();
    draw();
  }

  /* ================================================================ TAB 2 — ROLES */
  function parseRoles(s) {
    const names = String(s || '').split(',').map(x => x.trim()).filter(Boolean);
    if (names.length > 12) return { err: 'At most 12 roles here.' };
    if (new Set(names.map(x => x.toLowerCase())).size !== names.length) return { err: 'Each role name should appear once.' };
    return { names };
  }
  function rolesTab({ side, main, st, save, restart }) {
    const S = st.roles;
    let roles = [];
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: ROLE_PRESETS, onPick: it => { S.n = it.n; S.r = it.r; S.roles = it.roles; S.src = it.label; nF.set(S.n); rF.setRange(0, S.n); rF.set(S.r); rlF.input.value = S.roles; save(); draw(); } });
    side.appendChild(pre);
    showSource(pre, ROLE_PRESETS, S.src);
    side.appendChild(K.group('2 · Your numbers'));
    const nF = K.numField({ label: 'People to choose from ' + tx('n'), min: 1, max: 60, value: S.n, onChange: v => { S.n = v; S.r = rF.setRange(0, v); touched(); draw(); } });
    const rF = K.numField({ label: 'Team size ' + tx('r'), min: 0, max: S.n, value: Math.min(S.r, S.n), onChange: v => { S.r = v; touched(); draw(); } });
    const rlF = K.textField({ label: 'Roles inside the team, separated by commas (leave empty for none)', value: S.roles, mono: false, onChange: v => { S.roles = v; touched(); draw(); } });
    const chips = h('div', { class: 'pl-chips' });
    [['no roles', ''], ['captain, vice-captain', 'captain, vice-captain'], ['gold, silver, bronze', 'gold, silver, bronze'], ['chair, secretary, treasurer', 'chair, secretary, treasurer']].forEach(([l, v]) => chips.appendChild(Lab.button(l, () => { S.roles = v; rlF.input.value = v; touched(); draw(); }, 'btn xs')));
    side.append(nF, rF, rlF, chips);
    side.appendChild(resetBtn(() => restart('roles')));
    const P = {};
    P.stale = h('div', { class: 's4-stale', hidden: true });
    P.answer = K.answer();
    P.stages = K.panel('Two stages: choose the team, then give out the roles');
    P.routes = K.panel('Two ways to count — the same answer');
    P.cmp = K.panel('Order matters, or not?');
    P.list = K.panel('See them');
    main.append(P.stale, P.answer, P.stages, P.routes, P.cmp, P.list);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, ROLE_PRESETS, ''); } save(); };
    const roleList = () => (roles.length ? roles.map(esc).join(', ') : 'none');

    function draw() {
      const pr = parseRoles(S.roles);
      const n = S.n, r = Math.min(S.r, S.n);
      if (pr.err || pr.names.length > r) {
        const m = pr.err || 'You typed ' + plural(pr.names.length, 'role') + ' but the team has only ' + tx('r=' + r) + ' people — each role needs its own person.';
        rlF.input.classList.add('bad'); rlF.hint('<span class="cbad">' + m + '</span>');
        stale(P.stale, 'Fix the roles box. The pictures below still show your last good numbers.');
        return;
      }
      rlF.input.classList.remove('bad');
      roles = pr.names;
      const k = roles.length;
      rlF.hint(k ? tx('k=' + k) + ' role' + (k > 1 ? 's' : '') + ': ' + roles.map(esc).join(', ') + (k < r ? '; the other ' + tx('r-k=' + (r - k)) + ' team members are ordinary members.' : '; everyone in the team gets a role.') : 'No roles: the team is just a group (order does not matter).');
      stale(P.stale, '');
      const teams = choose(n, r), assign = perm(r, k), total = teams * assign;
      const routeB = perm(n, k) * choose(n - k, r - k);
      const D = { n, r, k, teams, assign, total, routeB };
      drawAnswer(D); drawStages(D); drawRoutes(D); drawCmp(D); drawList(D);
    }
    function drawAnswer(D) {
      const { n, r, k } = D;
      const ev = 'Choose a team of ' + tx('r=' + r) + ' from ' + tx('n=' + n) + ' people' + (k ? ', then give out ' + tx('k=' + k) + ' different role' + (k > 1 ? 's' : '') + ' (' + roleList() + ') inside the team.' : ' — no roles, so the order of choosing does not matter.');
      let big;
      if (!k) big = eqChain('', cParts(n, r).slice(0, 2).concat(iT(D.total) + sci(D.total)), true);
      else big = eqChain('', [Ct(n, r) + '\\times ' + Pt(r, k), iT(D.teams) + '\\times ' + iT(D.assign), iT(D.total) + sci(D.total) + (k === r ? '=' + Pt(n, r) : '')], true);
      const sub = k ? (k === r ? 'Everyone in the team gets a different role, so this is ' + tx(Pt(n, r)) + ' — the course’s ' + tx(Pt(n, r) + '=' + Ct(n, r) + '\\times ' + r + '!') + ' (L6.1). ' : '') + 'Without the roles it would be only ' + tx(Ct(n, r) + '=' + iT(D.teams)) + '; each team can hand out its roles in ' + tx(Pt(r, k) + '=' + iT(D.assign)) + ' ways.'
        : 'Each of these teams could be put in order in ' + tx(r + '!=' + iT(fact(r))) + ' ways; with roles (e.g. captain first) the count would be ' + tx(Ct(n, r) + '\\times ' + r + '!=' + Pt(n, r) + '=' + iT(perm(n, r))) + ' (L6.2).';
      K.setAnswer(P.answer, { ev, big, sub: sub + bigNote(D.total, perm(n, r)) });
    }
    function slot(num, cap) { return h('div', { class: 'sl-slot s4-slot' }, h('div', { class: 'sl-num', text: num }), h('div', { class: 'sl-cap', html: cap })); }
    function drawStages(D) {
      const body = P.stages.body, { n, r, k } = D;
      Lab.clear(body);
      const row = h('div', { class: 'sl-row s4-slots' });
      row.appendChild(slot(iH(D.teams), 'teams<br>' + tx(Ct(n, r))));
      for (let i = 0; i < k; i++) {
        row.appendChild(h('span', { class: 'sl-times s4-and', html: '×<i>THEN</i>' }));
        row.appendChild(slot(String(r - i), esc(roles[i]).slice(0, 18) + '<br>' + (i === 0 ? 'any of ' + tx('r') : tx('r-' + i))));
      }
      row.appendChild(h('span', { class: 'sl-times', text: '=' }));
      row.appendChild(h('div', { class: 'sl-total' }, h('b', { text: iH(D.total) }), h('span', { text: k ? 'teams with roles' : 'teams' })));
      body.appendChild(h('div', { class: 'sl-scroll' }, row));
      body.appendChild(K.note(k ? 'Stage 1 picks the ' + r + ' people (a combination: order does not matter yet). Stage 2 fills the roles one after another from those ' + r + ' people: ' + roles.map((nm, i) => esc(nm) + ' ' + plural(r - i, 'choice')).join(', ') + ' — the multiplication rule gives ' + tx(Pt(r, k) + '=' + (k > 1 ? downTex(r, r - k + 1) + '=' : '') + iT(D.assign)) + '.' : 'No roles: stage 2 is empty, the answer is just the number of teams.', 'small'));
    }
    function drawRoutes(D) {
      const body = P.routes.body, { n, r, k } = D;
      Lab.clear(body);
      const steps = [];
      steps.push({ html: '<b>Team first.</b> Choose the ' + r + ' team members from ' + n + ' (order does not matter):', math: eqChain('', cParts(n, r)) });
      if (k) {
        steps.push({ html: 'Then the roles, one at a time, from the ' + r + ' team members: ' + roles.map((nm, i) => esc(nm) + ' ' + plural(r - i, 'choice')).join(', ') + '.', math: eqChain('', [Pt(r, k), k > 1 ? downTex(r, r - k + 1) : '', iT(D.assign)]) });
        steps.push({ html: 'Multiply the two stages:', math: eqChain('', [Ct(n, r) + '\\times ' + Pt(r, k), iT(D.teams) + '\\times ' + iT(D.assign), iT(D.total)]) });
        steps.push({ html: '<b>Roles first.</b> Fill the roles straight from all ' + n + ' people — ' + esc(roles[0]) + ' has ' + n + ' choices, the next role ' + (n - 1) + ', …:', math: eqChain('', [Pt(n, k), k > 1 ? downTex(n, n - k + 1) : '', iT(perm(n, k))]) });
        steps.push({ html: 'Then the other ' + tx('r-k=' + (r - k)) + ' ordinary members from the ' + tx('n-k=' + (n - k)) + ' people left:', math: eqChain('', [Pt(n, k) + '\\times ' + Ct(n - k, r - k), iT(perm(n, k)) + '\\times ' + iT(choose(n - k, r - k)), iT(D.routeB)]), note: D.routeB === D.total ? '<span class="cgood">✓ Same number both ways</span> — the same teams-with-roles, counted in a different order.' : '<span class="cbad">✗ mismatch</span>' });
        if (k === r) steps.push({ html: 'Everyone gets a role here (' + tx('k=r=' + r) + '), so “roles first” fills all ' + r + ' places in order: that is ' + tx(Pt(n, r)) + '. So', math: Pt(n, r) + '=' + Ct(n, r) + '\\times ' + r + '!=' + iT(D.teams) + '\\times ' + iT(fact(r)) + '=' + iT(perm(n, r)), note: 'This is how L6.1 gets the formula ' + tx(Ct('n', 'r') + '=\\frac{' + Pt('n', 'r') + '}{r!}') + ': every group of ' + tx('r') + ' gives ' + tx('r!') + ' ordered lists.' });
      } else steps.push({ html: 'No roles, so nothing more to choose: the answer is ' + tx(iT(D.teams)) + '.' });
      body.appendChild(K.steps(steps));
    }
    function drawCmp(D) {
      const body = P.cmp.body, { n, r, k } = D;
      Lab.clear(body);
      const rows = [
        { hl: k === 0, cells: ['a group of ' + r + ', no roles', 'no', tx(Ct(n, r) + '=' + iT(D.teams))] },
        { hl: k > 0 && k < r, cells: [k > 0 && k < r ? 'your ' + k + ' role' + (k > 1 ? 's' : '') + ' + ' + (r - k) + ' ordinary' : 'some roles (' + tx('0<k<r') + ')', 'partly', k > 0 && k < r ? tx(Ct(n, r) + '\\times ' + Pt(r, k) + '=' + iT(D.total)) : '—'] },
        { hl: k === r && k > 0, cells: ['every member a different role', 'yes', tx(Pt(n, r) + '=' + Ct(n, r) + '\\times ' + r + '!=' + iT(perm(n, r)))] },
      ];
      body.appendChild(tableEl(['what is counted', 'order matters?', 'count'], rows, 's4-cmp'));
      body.appendChild(K.note('The swap test (L6.2): swap two chosen people. If the outcome changes (A captain, B vice ≠ B captain, A vice), order matters → permutation. If it does not (two representatives A and B = B and A), use a combination.', 'small'));
    }
    function drawList(D) {
      const body = P.list.body, { n, r, k } = D;
      Lab.clear(body);
      const nm = letters(n);
      if (r === 0) { body.appendChild(K.note('A team of 0: exactly one way — choose nobody (' + tx(Ct(n, 0) + '=1') + ').', 'small muted')); return; }
      const showTeams = D.teams <= 12n ? Number(D.teams) : 6;
      const per = D.assign;
      P.list.sub('People are called ' + nm.slice(0, Math.min(n, 4)).join(', ') + (n > 4 ? ', … (' + n + ' in all)' : '') + '. ' + (D.teams > 12n ? 'Showing ' + showTeams + ' of the ' + iH(D.teams) + ' teams.' : 'All ' + iH(D.teams) + ' teams.') + (k ? ' Inside each team: its ' + iH(per) + ' ways to give out the roles.' : ''));
      const g = h('div', { class: 's4-teams' });
      const idx = Array.from({ length: r }, (_, i) => i);
      let shown = 0;
      for (;;) {
        const team = idx.map(i => nm[i]);
        const card = h('div', { class: 's4-team' }, h('div', { class: 's4-team-h', text: '{' + team.join(', ') + '}' }));
        if (k) {
          const inner = h('div', { class: 's4-team-in' });
          let c = 0;
          (function rec(used, out) {
            if (c >= 8) return;
            if (out.length === k) { inner.appendChild(h('span', { html: out.map((p2, i) => '<i>' + esc(roles[i]) + '</i> ' + p2).join(' · ') })); c++; return; }
            team.forEach(p2 => { if (!used.includes(p2)) rec(used.concat(p2), out.concat(p2)); });
          })([], []);
          if (per > 8n) inner.appendChild(h('span', { class: 'muted', text: '… ' + iH(per) + ' in all' }));
          card.appendChild(inner);
        }
        g.appendChild(card);
        shown++;
        if (shown >= showTeams) break;
        let i = r - 1;
        while (i >= 0 && idx[i] === n - r + i) i--;
        if (i < 0) break;
        idx[i]++;
        for (let j = i + 1; j < r; j++) idx[j] = idx[j - 1] + 1;
      }
      body.appendChild(g);
      if (k) body.appendChild(K.note('Count check: ' + iH(D.teams) + ' teams × ' + iH(per) + ' role assignments each = ' + iH(D.total) + '.', 'small muted'));
    }
    draw();
  }

  /* ================================================================ TAB 3 — PASCAL */
  function pascalTab({ side, main, st, save, restart }) {
    const S = st.pascal;
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: PASCAL_PRESETS, onPick: it => { S.n = it.n; S.r = it.r; S.src = it.label; nF.set(S.n); rF.setRange(0, S.n); rF.set(S.r); save(); draw(); } });
    side.appendChild(pre);
    showSource(pre, PASCAL_PRESETS, S.src);
    side.appendChild(K.group('2 · Your n and r'));
    const nF = K.numField({ label: 'Row ' + tx('n') + ' (0 to 15)', min: 0, max: 15, value: S.n, onChange: v => { S.n = v; S.r = rF.setRange(0, v); touched(); draw(); } });
    const rF = K.numField({ label: 'Position ' + tx('r') + ' in the row (0 to ' + tx('n') + ')', min: 0, max: S.n, value: Math.min(S.r, S.n), onChange: v => { S.r = v; touched(); draw(); } });
    side.append(nF, rF, K.note('Or click any number in the triangle.'));
    side.appendChild(K.group('3 · Numbers for a and b'));
    const aF = K.numField({ label: tx('a'), min: -10, max: 10, value: S.a, onChange: v => { S.a = v; save(); drawBinom(); } });
    const bF = K.numField({ label: tx('b'), min: -10, max: 10, value: S.b, onChange: v => { S.b = v; save(); drawBinom(); } });
    side.append(aF, bF);
    side.appendChild(resetBtn(() => restart('pascal')));
    const P = {};
    P.answer = K.answer();
    P.tri = K.panel('Pascal’s triangle, rows 0 to 15', 'Row ' + tx('n') + ' lists ' + tx(Ct('n', '0') + ',' + Ct('n', '1') + ',\\dots,' + Ct('n', 'n')) + '. Each number is the sum of the two above it.');
    P.sym = K.panel('Symmetry: ' + tx(Ct('n', 'r') + '=' + Ct('n', 'n-r')));
    P.rule = K.panel('Pascal’s rule: does the committee contain A or not?');
    P.binom = K.panel('Binomial coefficients: the numbers in ' + tx('(a+b)^n'));
    main.append(P.answer, P.tri, P.sym, P.rule, P.binom);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, PASCAL_PRESETS, ''); } save(); };
    function setNR(n, r) { S.n = n; nF.set(n); S.r = rF.setRange(0, n); rF.set(r); S.r = r; touched(); draw(); }
    function draw() { drawAnswer(); drawTri(); drawSym(); drawRule(); drawBinom(); }
    function drawAnswer() {
      const { n, r } = S;
      K.setAnswer(P.answer, { ev: 'Row ' + tx('n=' + n) + ', position ' + tx('r=' + r) + ': the number of ways to choose ' + r + ' of ' + n + ' different things (order does not matter). It is also called the binomial coefficient ' + tx('\\binom{' + n + '}{' + r + '}') + '.', big: eqChain('', cParts(n, r), true), sub: 'Its neighbours: ' + (n >= 1 ? tx(Ct(n - 1, r - 1) + '+' + Ct(n - 1, r) + '=' + iT(choose(n - 1, r - 1)) + '+' + iT(choose(n - 1, r)) + '=' + iT(choose(n, r))) + ' (the two numbers above it), and ' : '') + (2 * r === n ? tx(Ct(n, r)) + ' is its own mirror (' + tx('r=n-r=' + r) + ').' : tx(Ct(n, n - r) + '=' + iT(choose(n, n - r))) + ' (its mirror in the row).') });
    }
    function drawTri() {
      const body = P.tri.body;
      Lab.clear(body);
      const R = 15, dx = 46, dy = 31, W = dx * (R + 1) + 64, Ht = dy * (R + 1) + 14;
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + Ht, class: 's4-tri', role: 'img', 'aria-label': 'Pascal triangle rows 0 to 15' });
      const { n, r } = S;
      for (let i = 0; i <= R; i++) {
        const y = 10 + i * dy;
        if (i === n) s.appendChild(svg('rect', { x: 2, y: y - 2, width: W - 4, height: dy - 2, rx: 8, class: 's4-pc-row' }));
        s.appendChild(svg('text', { x: 10, y: y + 17, class: 's4-pc-n' }, String(i)));
        for (let j = 0; j <= i; j++) {
          const x = W / 2 + 12 + (j - i / 2) * dx;
          let cls = 's4-pc';
          if (i === n && j === r) cls += ' tgt';
          else if (n >= 1 && i === n - 1 && j === r - 1) cls += ' p1';
          else if (n >= 1 && i === n - 1 && j === r) cls += ' p2';
          else if (i === n && j === n - r) cls += ' mir';
          const g = svg('g', { class: cls, tabindex: '0', role: 'button', 'aria-label': i + ' choose ' + j + ' = ' + choose(i, j) });
          g.appendChild(svg('rect', { x: x - dx / 2 + 2, y, width: dx - 4, height: dy - 6, rx: 7 }));
          g.appendChild(svg('text', { x, y: y + 17, 'text-anchor': 'middle' }, String(choose(i, j))));
          g.appendChild(svg('title', {}, i + 'C' + j + ' = ' + choose(i, j)));
          g.addEventListener('click', () => setNR(i, j));
          g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setNR(i, j); } });
          s.appendChild(g);
        }
      }
      body.appendChild(h('div', { class: 's4-scroll' }, s));
      body.appendChild(h('div', { class: 's4-legend', html: '<span class="lg tgt"></span>' + tx(Ct(n, r)) + ' &nbsp; <span class="lg p1"></span>' + (n >= 1 ? tx(Ct(n - 1, r - 1)) : '—') + ' &nbsp; <span class="lg p2"></span>' + (n >= 1 ? tx(Ct(n - 1, r)) : '—') + ' &nbsp; <span class="lg mir"></span>mirror ' + tx(Ct(n, n - r)) + ' &nbsp; numbers at the left = ' + tx('n') }));
      const row = [];
      for (let j = 0; j <= n; j++) row.push(choose(n, j));
      body.appendChild(K.note('Row ' + n + ' adds up to ' + tx(row.map(iT).join('+') + '=' + iT(row.reduce((a, b) => a + b, 0n)) + '=2^{' + n + '}') + ': every subset of ' + n + ' things has some size from 0 to ' + n + ', and there are ' + tx('2^{' + n + '}') + ' subsets (each thing is in or out).', 'small muted'));
    }
    function drawSym() {
      const body = P.sym.body, { n, r } = S;
      Lab.clear(body);
      const steps = [
        { html: 'Choosing the ' + tx('r=' + r) + ' to <b>take</b> is the same as choosing the ' + tx('n-r=' + (n - r)) + ' to <b>leave out</b> (L6.1). Both formulas have the same bottom:', math: Ct(n, r) + '=\\frac{' + n + '!}{' + r + '!\\,' + (n - r) + '!}=\\frac{' + n + '!}{' + (n - r) + '!\\,' + r + '!}=' + Ct(n, n - r) + '=' + iT(choose(n, r)) },
        { html: 'Special ends of every row: ' + tx(Ct(n, 0) + '=' + Ct(n, n) + '=\\frac{' + n + '!}{0!\\,' + n + '!}=1') + ' (take nobody, or everybody; ' + tx('0!=1') + ').' },
      ];
      body.appendChild(K.steps(steps));
      const total = choose(n, r);
      if (n >= 1 && total <= 35n) {
        const nm = letters(n);
        const g = h('div', { class: 's4-pairs' });
        combos(n, r).forEach(c => {
          const left = nm.filter((_, i) => !c.includes(i));
          g.appendChild(h('div', { class: 's4-pair', html: '<b>take</b> {' + c.map(i => nm[i]).join(', ') + '} <span class="muted">↔</span> <b>leave</b> {' + left.join(', ') + '}' }));
        });
        body.appendChild(K.note('Every one of the ' + iH(total) + ' ways, with its partner:', 'small'));
        body.appendChild(g);
      } else if (n >= 1) body.appendChild(K.note('There are ' + iH(total) + ' ways — too many to list (the list appears when ' + tx(Ct('n', 'r') + '\\le 35') + ').', 'small muted'));
    }
    function combos(n, r) {
      const out = [], cur = [];
      (function rec(s) { if (cur.length === r) { out.push(cur.slice()); return; } for (let i = s; i < n; i++) { cur.push(i); rec(i + 1); cur.pop(); } })(0);
      return out;
    }
    function drawRule() {
      const body = P.rule.body, { n, r } = S;
      Lab.clear(body);
      if (n === 0 || r === 0) {
        body.appendChild(K.note('Pascal’s rule ' + tx(Ct('n', 'r') + '=' + Ct('n-1', 'r-1') + '+' + Ct('n-1', 'r')) + ' is for ' + tx('1\\le r\\le n') + ' (L6.1). You chose ' + tx('n=' + n + ',\\ r=' + r) + ': here ' + tx(Ct(n, r) + '=1') + ' directly — the empty committee. Pick ' + tx('r\\ge 1') + ' to see the rule.', 'small'));
        return;
      }
      const nm = letters(n), A = nm[0];
      const withA = choose(n - 1, r - 1), without = choose(n - 1, r);
      const steps = [];
      steps.push({ html: 'Fix one person, <b>' + A + '</b>. Every committee of ' + r + ' from the ' + n + ' people either contains ' + A + ' or it does not — never both — so the two counts add (L6.1).' });
      steps.push({ html: 'Contains ' + A + ': ' + A + ' is in, so choose the other ' + tx('r-1=' + (r - 1)) + ' from the ' + tx('n-1=' + (n - 1)) + ' people left:', math: eqChain('', cParts(n - 1, r - 1)) });
      steps.push({ html: 'Does not contain ' + A + ': all ' + tx('r=' + r) + ' come from the other ' + tx('n-1=' + (n - 1)) + ':', math: eqChain('', cParts(n - 1, r)), note: r === n ? 'You cannot take ' + r + ' from only ' + (n - 1) + ' people, so this count is 0.' : '' });
      steps.push({ html: 'Add:', math: Ct(n, r) + '=' + Ct(n - 1, r - 1) + '+' + Ct(n - 1, r) + '=' + iT(withA) + '+' + iT(without) + '=' + iT(withA + without) });
      steps.push({ html: 'The same rule, one row down (as in the notes): ' + tx(Ct(n, r) + '+' + Ct(n, r - 1) + '=' + Ct(n + 1, r)) + ', i.e. ' + tx(iT(choose(n, r)) + '+' + iT(choose(n, r - 1)) + '=' + iT(choose(n + 1, r))) + '.' });
      body.appendChild(K.steps(steps));
      if (withA + without <= 70n) {
        const cs = combos(n, r);
        const colA = h('div', { class: 's4-col' }, h('div', { class: 's4-col-h', html: 'contains ' + A + ' — ' + tx(iT(withA)) }));
        const colN = h('div', { class: 's4-col' }, h('div', { class: 's4-col-h', html: 'no ' + A + ' — ' + tx(iT(without)) }));
        cs.forEach(c => (c.includes(0) ? colA : colN).appendChild(h('span', { class: 'cl-chip' + (c.includes(0) ? ' in' : ''), text: '{' + c.map(i => nm[i]).join(', ') + '}' })));
        body.appendChild(h('div', { class: 's4-cols' }, colA, colN));
      } else body.appendChild(K.note('The two lists would hold ' + iH(withA + without) + ' committees — they appear when ' + tx(Ct('n', 'r') + '\\le 70') + '.', 'small muted'));
    }
    function drawBinom() {
      const body = P.binom.body, { n, r, a, b } = S;
      Lab.clear(body);
      const term = k => { const c = choose(n, k); const ea = n - k, eb = k; const pa = ea === 0 ? '' : ea === 1 ? 'a' : 'a^{' + ea + '}'; const pb = eb === 0 ? '' : eb === 1 ? 'b' : 'b^{' + eb + '}'; let t = (c === 1n && (pa || pb) ? '' : iT(c)) + pa + pb; if (!t) t = '1'; return k === r ? '\\boxed{' + t + '}' : t; };
      const terms = [];
      for (let k = 0; k <= n; k++) terms.push(term(k));
      const steps = [];
      steps.push({ html: 'Multiply out ' + tx('(a+b)^{' + n + '}') + ' = ' + n + ' brackets ' + tx('(a+b)') + '. From each bracket take ' + tx('a') + ' or ' + tx('b') + '. A term ' + tx('a^{' + (n - r) + '}b^{' + r + '}') + ' comes from choosing which ' + r + ' of the ' + n + ' brackets give ' + tx('b') + ': ' + tx(Ct(n, r) + '=' + iT(choose(n, r))) + ' ways. So the coefficients are row ' + n + ' of the triangle (your term is boxed):', math: eqChain('(a+b)^{' + n + '}', [terms.join('+')]) });
      // numbers
      const A = B(a), Bb = B(b);
      const rows = [];
      let sum = 0n;
      for (let k = 0; k <= n; k++) {
        const v = choose(n, k) * A ** B(n - k) * Bb ** B(k);
        sum += v;
        const pw = A ** B(n - k) * Bb ** B(k);
        rows.push({ hl: k === r, cells: [tx('k=' + k), tx(Ct(n, k) + '=' + iT(choose(n, k))), tx('(' + a + ')^{' + (n - k) + '}(' + b + ')^{' + k + '}=' + iT(A ** B(n - k)) + '\\times ' + (Bb ** B(k) < 0n ? '(' + iT(Bb ** B(k)) + ')' : iT(Bb ** B(k))) + '=' + iT(pw)), tx(iT(choose(n, k)) + '\\times ' + (pw < 0n ? '(' + iT(pw) + ')' : iT(pw)) + '=' + iT(v))] });
      }
      const direct = (A + Bb) ** B(n);
      steps.push({ html: 'With your numbers ' + tx('a=' + a) + ', ' + tx('b=' + b) + ' (change them in the controls), each term is coefficient × powers:', block: tableEl([tx('k'), tx(Ct(n, 'k')), tx('a^{n-k}b^{k}'), 'term ' + tx(Ct(n, 'k') + '\\,a^{n-k}b^{k}')], rows, 's4-btab') });
      const par = v => (v < 0 ? '(' + v + ')' : String(v));
      steps.push({ html: 'Total of the terms ' + tx('=' + iT(sum)) + ', and directly ' + tx('(' + a + '+' + par(b) + ')^{' + n + '}=' + par(a + b) + '^{' + n + '}=' + iT(direct)) + ' ' + (sum === direct ? '<span class="cgood">✓ equal</span>' : '<span class="cbad">✗</span>') + '. With ' + tx('a=b=1') + ' the row sum is ' + tx('2^{' + n + '}=' + iT(2n ** B(n))) + '.' });
      body.appendChild(K.steps(steps));
      if (n >= 1 && n <= 4) {
        const words = [];
        for (let m = 0; m < 1 << n; m++) { let w = ''; for (let i = n - 1; i >= 0; i--) w += (m >> i) & 1 ? 'b' : 'a'; words.push(w); }
        const g = h('div', { class: 's4-cols' });
        for (let k = 0; k <= n; k++) {
          const col = h('div', { class: 's4-col' + (k === r ? ' cur' : '') }, h('div', { class: 's4-col-h', html: tx(k + '\\text{ b’s: }' + Ct(n, k) + '=' + iT(choose(n, k))) }));
          words.filter(w => [...w].filter(c => c === 'b').length === k).forEach(w => col.appendChild(h('span', { class: 'cl-chip' + (k === r ? ' in' : ''), text: w })));
          g.appendChild(col);
        }
        body.appendChild(K.note('All ' + tx('2^{' + n + '}=' + (1 << n)) + ' ways to pick a or b from the ' + n + ' brackets, sorted by how many b’s:', 'small'));
        body.appendChild(g);
      }
    }
    draw();
  }

  /* ================================================================ TAB 4 — PERMUTATION OR COMBINATION? */
  // ans: 'P' (order matters), 'C' (order does not matter), 'B' (choose a group, then give roles); rep: n^r
  const CARDS = [
    { id: 'medal', src: 'L6.2', title: 'Medals in a race', text: '{n} athletes run a 100 m race. In how many ways can the gold, silver and bronze medals be given out?', n: [8, 3, 40], r: 3, ans: 'P', swap: 'Swap the gold and silver winners: a different result. Order matters.' },
    { id: 'heat', src: 'L6.2', title: 'Through to the next round', text: '{n} athletes run a heat; the top {r} go to the next round. How many different groups can go through?', n: [8, 2, 40], r: [3, 1, 10], ans: 'C', swap: 'Swap two of the qualifiers: the same group goes through. Order does not matter.' },
    { id: 'reps', src: 'L6.2', title: 'Two class representatives', text: 'Choose 2 class representatives from {n} students.', n: [40, 2, 60], r: 2, ans: 'C', swap: 'Representatives A and B are the same pair as B and A. Order does not matter.' },
    { id: 'capt', src: 'L6.2', title: 'Captain and vice-captain', text: 'Choose a captain and a vice-captain from {n} students.', n: [40, 2, 60], r: 2, ans: 'P', swap: 'A captain with B vice is not the same as B captain with A vice. Order matters.' },
    { id: 'chord', src: 'L6.1', title: 'Chords between points', text: '{n} points lie on a circle. How many line segments (chords) join two of them?', n: [6, 2, 40], r: 2, ans: 'C', swap: 'The segment AB is the segment BA. Order does not matter.' },
    { id: 'arrow', src: 'L6.2', title: 'Arrows between points', text: '{n} points lie on a circle. How many arrows (A → B, with a direction) join two of them?', n: [6, 2, 40], r: 2, ans: 'P', swap: 'A → B and B → A point opposite ways. Order matters.' },
    { id: 'hand', src: 'L6.1', title: 'A hand of cards', text: 'A hand of {r} cards is dealt from a deck of {n} cards.', n: [52, 4, 60], r: [4, 1, 13], ans: 'C', swap: 'The same cards in a different order are the same hand. Order does not matter.' },
    { id: 'code', src: 'L5.1', title: 'A code with no repeats', text: 'A code uses {r} different digits from the {n} digits 0–9 (no digit used twice).', n: [10, 2, 10], r: [4, 1, 10], ans: 'P', swap: '1234 and 4321 are different codes. Order matters.' },
    { id: 'pin', src: 'L5.3', title: 'A PIN with repeats', text: 'A PIN has {r} places, each any of the {n} digits 0–9 (repeats allowed).', n: [10, 2, 10], r: [4, 1, 8], ans: 'P', rep: true, swap: '1123 and 3211 are different PINs: order matters. Repeats are allowed, so each place has all n choices.' },
    { id: 'chair', src: 'L5.3', title: 'Chairman and vice-chairman', text: 'A committee has {n} members. Choose a chairman and a vice-chairman (one person cannot hold both).', n: [8, 2, 40], r: 2, ans: 'P', swap: 'Swapping the two posts gives a different result. Order matters.' },
    { id: 'team', src: 'L6.1', title: 'A team, no captain', text: 'Pick a team of {r} players from {n}.', n: [17, 2, 40], r: [11, 1, 20], ans: 'C', swap: 'A team is a group: listing the players in another order gives the same team.' },
    { id: 'teamcap', src: 'Practice', title: 'A team, then a captain', text: 'Pick a team of {r} from {n} players, then choose a captain from the team.', n: [9, 2, 30], r: [5, 1, 12], ans: 'B', swap: 'The team itself is a group (order does not matter), but who is captain matters: choose the group, then the role.' },
    { id: 'top', src: 'Practice', title: 'Pizza toppings', text: 'Choose {r} different toppings from {n} for a pizza.', n: [8, 2, 30], r: [3, 1, 10], ans: 'C', swap: 'Olives then onion is the same pizza as onion then olives.' },
    { id: 'rank', src: 'Practice', title: 'Rank your favourites', text: 'Rank your top {r} of {n} films (1st, 2nd, …).', n: [10, 2, 30], r: [3, 1, 10], ans: 'P', swap: 'Swap your 1st and 2nd: a different ranking. Order matters.' },
    { id: 'prizes', src: 'Practice', title: 'Different prizes', text: 'Give {r} different prizes (1st, 2nd, 3rd, …) to {r} of {n} students, at most one each.', n: [10, 2, 30], r: [3, 1, 10], ans: 'P', swap: 'Swap the 1st and 2nd prize between two students: a different outcome.' },
    { id: 'same', src: 'Practice', title: 'Identical prizes', text: 'Give {r} identical prizes to {r} of {n} students, at most one each.', n: [10, 2, 30], r: [3, 1, 10], ans: 'C', swap: 'The prizes are identical: swapping them changes nothing. Only who gets one matters.' },
    { id: 'shake', src: 'Practice', title: 'Handshakes', text: '{n} people each shake hands once with every other person. How many handshakes?', n: [10, 2, 40], r: 2, ans: 'C', swap: 'A shaking hands with B is the same handshake as B with A.' },
  ];
  const OPTS = [{ v: 'P', label: 'Permutation — order matters' }, { v: 'C', label: 'Combination — order does not matter' }, { v: 'B', label: 'Choose a group, then give roles' }];
  function cardNums(S, c) {
    const got = S.nums[c.id] || {};
    const n0 = Array.isArray(c.n) ? c.n : [c.n, c.n, c.n];
    const r0 = Array.isArray(c.r) ? c.r : [c.r, c.r, c.r];
    let n = intIn(got.n, n0[1], n0[2]) ? got.n : n0[0];
    let r = intIn(got.r, r0[1], r0[2]) ? got.r : r0[0];
    if (!c.rep && r > n) r = n;
    return { n, r };
  }
  function cardCount(c, n, r) {
    if (c.rep) return { val: B(n) ** B(r), math: eqChain('', [n + '^{' + r + '}', r <= 8 ? Array(r).fill(n).join('\\times ') : '', iT(B(n) ** B(r))], false, 30), name: tx('n^r') + ' (order matters, repeats allowed — L5.3)' };
    if (c.ans === 'P') return { val: perm(n, r), math: eqChain('', pParts(n, r).concat(r >= 2 && r <= 6 ? [Ct(n, r) + '\\times ' + r + '!', iT(choose(n, r)) + '\\times ' + iT(fact(r)), iT(perm(n, r))] : []), false, 30), name: tx(Pt('n', 'r')) + ' (order matters, no repeats)' };
    if (c.ans === 'C') return { val: choose(n, r), math: eqChain('', cParts(n, r), false, 30), name: tx(Ct('n', 'r')) + ' (order does not matter)' };
    return { val: choose(n, r) * B(r), math: eqChain('', [Ct(n, r) + '\\times ' + r, iT(choose(n, r)) + '\\times ' + r, iT(choose(n, r) * B(r))], false, 30), name: tx(Ct('n', 'r') + '\\times r') + ' (the team, then 1 captain from its ' + tx('r') + ' members)' };
  }
  /**
   * Words for the selected card's answer box and steps (Rule 0: name every input):
   * [what n counts, what r counts, why a thing can (pin) or cannot be chosen twice, the count in words (one, many)].
   */
  const CARD_WORDS = {
    medal: ['athletes', 'medals: gold, silver, bronze', 'one athlete cannot win two of the medals.', ['way to give out the medals', 'ways to give out the medals']],
    heat: ['athletes in the heat', 'athletes who go through', 'an athlete goes through only once.', ['group that can go through', 'groups that can go through']],
    reps: ['students', 'representatives', 'one student cannot be both representatives.', ['pair of representatives', 'pairs of representatives']],
    capt: ['students', 'posts: captain and vice-captain', 'one student cannot hold both posts.', ['way to fill the two posts', 'ways to fill the two posts']],
    chord: ['points on the circle', 'end points of one chord', 'a chord joins two different points.', ['chord', 'chords']],
    arrow: ['points on the circle', 'end points of one arrow: from and to', 'an arrow joins two different points.', ['arrow', 'arrows']],
    hand: ['cards in the deck', 'cards in the hand', 'each card is in the deck only once.', ['hand', 'hands']],
    code: ['digits to use', 'digits in the code', 'the card says no digit is used twice.', ['code', 'codes']],
    pin: ['digits for each place', 'places in the PIN', 'a digit may come again, so every place can use all the digits.', ['PIN', 'PINs']],
    chair: ['members', 'posts: chairman and vice-chairman', 'one person cannot hold both posts.', ['way to fill the two posts', 'ways to fill the two posts']],
    team: ['players', 'players in the team', 'a player is in the team only once.', ['team', 'teams']],
    teamcap: ['players', 'players in the team', 'a player is in the team only once, and the captain is one of them.', ['way to pick the team and its captain', 'ways to pick the team and its captain']],
    top: ['toppings to choose from', 'toppings on the pizza', 'the toppings on one pizza are all different.', ['pizza', 'different pizzas']],
    rank: ['films', 'places in your ranking', 'a film gets only one place.', ['ranking', 'rankings']],
    prizes: ['students', 'prizes', 'each student gets at most one prize.', ['way to give out the prizes', 'ways to give out the prizes']],
    same: ['students', 'prizes', 'each student gets at most one prize.', ['way to give out the prizes', 'ways to give out the prizes']],
    shake: ['people', 'people in one handshake', 'nobody shakes hands with themselves, and each pair shakes once.', ['handshake', 'handshakes']],
  };
  /** The card's question with the learner's numbers put in. */
  const cardQ = (c, n, r) => c.text.replace(/\{n\}/g, String(n)).replace(/\{r\}/g, String(r));
  /** "A,B,C" — the first r letters (after 5: "A,B,C,D,E,\dots"); swapped: the first two change places. */
  function lettersTex(r, swapped) {
    let xs = ['A', 'B', 'C', 'D', 'E'].slice(0, Math.min(r, 5));
    if (swapped && xs.length >= 2) xs = [xs[1], xs[0]].concat(xs.slice(2));
    return xs.join(',') + (r > 5 ? ',\\dots' : '');
  }
  const ansWordOf = c => (c.rep ? 'Order matters, repeats allowed' : c.ans === 'P' ? 'Permutation' : c.ans === 'C' ? 'Combination' : 'Choose a group, then give a role');
  /** The card's count with the learner's numbers, as equal forms (joined by eqChain). */
  function countParts(c, n, r) {
    if (c.rep) return [n + '^{' + r + '}', r >= 2 && r <= 8 ? Array(r).fill(n).join('\\times ') : '', iT(B(n) ** B(r))];
    if (c.ans === 'P') return pParts(n, r);
    if (c.ans === 'C') return cParts(n, r);
    return [Ct(n, r) + '\\times ' + r, '\\frac{' + n + '!}{' + r + '!\\,' + (n - r) + '!}\\times ' + r, iT(choose(n, r)) + '\\times ' + r, iT(choose(n, r) * B(r))];
  }
  const countVal = (c, n, r) => (c.rep ? B(n) ** B(r) : c.ans === 'P' ? perm(n, r) : c.ans === 'C' ? choose(n, r) : choose(n, r) * B(r));
  function whichTab({ side, main, st, save, restart }) {
    const S = st.which;
    side.appendChild(K.group('The test (L6.2)'));
    side.appendChild(K.note('Swap two of the chosen things. <b>Is it a different outcome?</b> Yes → order matters → <b>permutation</b> ' + tx(Pt('n', 'r')) + ' (or ' + tx('n^r') + ' with repeats). No → <b>combination</b> ' + tx(Ct('n', 'r')) + '. A group whose members then get different jobs: <b>choose, then arrange</b>.', 's4-test'));
    side.appendChild(K.group('Your score'));
    const score = h('div', { class: 's4-score' });
    side.appendChild(score);
    const tog = K.toggle({ label: 'Show every answer', value: S.showAll, onChange: v => { S.showAll = v; save(); drawCards(); drawSel(); } });
    side.appendChild(tog);
    side.appendChild(h('div', { class: 'btn-row' }, Lab.button('Clear my answers', () => { S.first = {}; S.last = {}; S.open = {}; save(); drawCards(); drawSel(); }, 'btn ghost sm')));
    side.appendChild(resetBtn(() => restart('which')));
    // the answer box and the steps follow the selected card (violet outline): the last card answered or edited
    const P = {};
    P.answer = K.answer();
    const grid = h('div', { class: 's4-cards' });
    P.calc = K.panel('How it is computed, with your numbers');
    main.append(P.answer, grid, P.calc);
    const cardEls = {};
    const smooth = () => (Lab.reducedMotion() ? 'auto' : 'smooth');
    function select(id) {
      S.sel = id;
      save();
      Object.keys(cardEls).forEach(k => cardEls[k].classList.toggle('sel', k === id));
      drawSel();
    }
    const ok = (c, v) => v === c.ans || (c.ans === 'P' && !c.rep && v === 'B');
    function drawScore() {
      const done = CARDS.filter(c => S.first[c.id]);
      const right = done.filter(c => ok(c, S.first[c.id]));
      Lab.setHTML(score, done.length ? '<b>' + right.length + '</b> of ' + done.length + ' right on the first try (' + CARDS.length + ' cards).' : 'Answer the cards — ' + CARDS.length + ' situations, each with your own numbers.');
    }
    function drawCards() {
      Lab.clear(grid);
      Object.keys(cardEls).forEach(k => delete cardEls[k]);
      CARDS.forEach(c => grid.appendChild(card(c)));
      drawScore();
    }
    function card(c) {
      const box = h('div', { class: 's4-card' + (c.id === S.sel ? ' sel' : '') });
      cardEls[c.id] = box;
      box.appendChild(h('div', { class: 's4-card-h' }, h('span', { class: 's4-src', text: c.src }), h('b', { text: c.title })));
      const q = h('div', { class: 's4-card-q' });
      const fb = h('div', { class: 's4-card-fb' });
      const parts = c.text.split(/(\{n\}|\{r\})/);
      const nums = cardNums(S, c);
      parts.forEach(p => {
        if (p === '{n}' || p === '{r}') {
          const key = p[1];
          const rng = Array.isArray(c[key]) ? c[key] : null;
          if (!rng) { q.appendChild(document.createTextNode(String(nums[key]))); return; }
          const inp = h('input', { class: 'field mono s4-inl', type: 'number', min: String(rng[1]), max: String(rng[2]), step: '1', value: String(nums[key]), 'aria-label': key + ' for ' + c.title });
          inp.addEventListener('input', () => {
            const v = parseInt(inp.value, 10);
            if (!Number.isFinite(v)) return;
            const vv = Math.max(rng[1], Math.min(rng[2], v));
            S.nums[c.id] = Object.assign({}, S.nums[c.id] || {}, { [key]: vv });
            save();
            Lab.$$('.s4-inl', q).forEach(x => { if (x !== inp && x.getAttribute('aria-label') === inp.getAttribute('aria-label')) x.value = String(vv); });
            paintFb();
            select(c.id);
          });
          inp.addEventListener('change', () => { inp.value = String(cardNums(S, c)[key]); });
          q.appendChild(inp);
        } else if (p) q.appendChild(document.createTextNode(p));
      });
      box.appendChild(q);
      const btns = h('div', { class: 's4-card-btns' });
      OPTS.forEach(o => {
        const b = h('button', { type: 'button', class: 'btn sm s4-opt', dataset: { v: o.v }, text: o.label });
        b.addEventListener('click', () => { if (!S.first[c.id]) S.first[c.id] = o.v; S.last[c.id] = o.v; save(); paintFb(); drawScore(); select(c.id); });
        btns.appendChild(b);
      });
      box.append(btns, fb);
      function paintFb() {
        const { n, r } = cardNums(S, c);
        const pick = S.last[c.id];
        Lab.$$('.s4-opt', btns).forEach(b => { b.classList.toggle('on', b.dataset.v === pick); b.classList.toggle('good', !!pick && b.dataset.v === pick && ok(c, pick)); b.classList.toggle('bad', !!pick && b.dataset.v === pick && !ok(c, pick)); });
        Lab.clear(fb);
        if (!pick && !S.showAll && !S.open[c.id]) return;
        const cnt = cardCount(c, n, r);
        let verdict = '';
        if (pick) {
          if (pick === c.ans) verdict = '<span class="cgood">✓ Right.</span> ';
          else if (ok(c, pick)) verdict = '<span class="cgood">✓ Also right:</span> choosing the ' + r + ' people (' + tx(Ct(n, r)) + ') and then ordering them (' + tx(r + '!') + ') gives ' + tx(Ct(n, r) + '\\times ' + r + '!=' + Pt(n, r)) + ' — the same count. ';
          else verdict = '<span class="cbad">✗ Not this one.</span> ';
        }
        const ansWord = c.ans === 'P' ? (c.rep ? 'Order matters (with repeats)' : 'Permutation') : c.ans === 'C' ? 'Combination' : 'Choose, then arrange';
        Lab.setHTML(fb, verdict + '<b>' + ansWord + '.</b> ' + esc(c.swap) + '<div class="s4-card-n">' + 'Count with ' + tx('n=' + n) + ', ' + tx('r=' + r) + ': ' + cnt.name + '</div>');
        fb.appendChild(h('div', { class: 's4-card-m', html: tx(cnt.math, true) }));
        if (c.ans === 'C' && pick === 'P') fb.appendChild(K.note('With order it would be ' + tx(Pt(n, r) + '=' + iT(perm(n, r))) + ' — each group counted ' + tx(r + '!=' + iT(fact(r))) + ' times.', 'small muted'));
        if (c.ans === 'P' && !c.rep && pick === 'C') fb.appendChild(K.note('Without order it would be only ' + tx(Ct(n, r) + '=' + iT(choose(n, r))) + ' — but here swapping changes the outcome, so each group of ' + r + ' really gives ' + tx(r + '!') + ' outcomes.', 'small muted'));
        if (c.ans === 'B' && pick !== 'B' && r >= 2) fb.appendChild(K.note('Just the team: ' + tx(Ct(n, r) + '=' + iT(choose(n, r))) + '. All ' + r + ' in order: ' + tx(Pt(n, r) + '=' + iT(perm(n, r))) + ' (too many — only the captain’s role is special).', 'small muted'));
        fb.appendChild(h('div', { class: 's4-card-go' }, Lab.button('How it is computed, step by step ↓', () => { select(c.id); P.calc.scrollIntoView({ behavior: smooth(), block: 'start' }); }, 'btn ghost xs')));
      }
      box.paint = paintFb;
      paintFb();
      return box;
    }
    /** The answer box and the step list for the selected card. Before the card is answered they do not give the answer away. */
    function drawSel() {
      const c = CARDS.find(x => x.id === S.sel) || CARDS[0];
      const { n, r } = cardNums(S, c);
      const W = CARD_WORDS[c.id];
      const pick = S.last[c.id];
      const open = !!(pick || S.showAll || S.open[c.id]);
      const nums = tx('n=' + n) + ' (' + W[0] + ') and ' + tx('r=' + r) + ' (' + W[1] + ')';
      const ev = 'Selected card: <b>' + esc(c.title) + '</b> (' + esc(c.src) + '). “' + esc(cardQ(c, n, r)) + '” Your numbers: ' + nums + '.';
      if (open) {
        const val = countVal(c, n, r);
        const o = pick ? OPTS.find(x => x.v === pick) : null;
        const mine = !pick ? '' : pick === c.ans ? ' Your answer: <span class="cgood">✓ right.</span>'
          : ok(c, pick) ? ' Your answer “' + esc(o.label) + '” is <span class="cgood">✓ also right</span>: it gives the same count.'
          : ' Your answer “' + esc(o.label) + '”: <span class="cbad">✗ not this one</span> — step 1 at the end of the page says why.';
        K.setAnswer(P.answer, {
          ev,
          big: eqChain('', countParts(c, n, r), true),
          sub: 'So there ' + (val === 1n ? 'is <b>1</b> ' + W[3][0] : 'are <b>' + iH(val) + '</b> ' + W[3][1]) + '. <b>' + ansWordOf(c) + ':</b> ' + esc(c.swap) + mine + bigNote(val),
        });
      } else {
        K.setAnswer(P.answer, { ev, sub: 'Answer this card first — <b>Permutation</b>, <b>Combination</b> or <b>Choose a group, then give roles</b> — or switch on “Show every answer”. Then its count, worked out with your numbers, appears here, and every step at the end of the page.' });
        P.answer.appendChild(h('div', { class: 'btn-row' }, Lab.button('Show the answer for this card', () => { S.open[c.id] = true; save(); const el = cardEls[c.id]; if (el && el.paint) el.paint(); drawSel(); }, 'btn sm')));
      }
      P.answer.appendChild(h('div', { class: 's4-card-go' }, Lab.button('Show the card', () => { const el = cardEls[c.id]; if (el) el.scrollIntoView({ behavior: smooth(), block: 'center' }); }, 'btn ghost xs')));
      P.calc.sub('For the selected card, “' + esc(c.title) + '” (violet outline). Answering a card or changing its numbers selects it.');
      const body = P.calc.body;
      Lab.clear(body);
      if (!open) {
        body.appendChild(K.steps([
          { html: '<b>Does order matter?</b> Swap two of the chosen things. If that gives a different outcome, order matters.' },
          { html: '<b>Can the same thing be chosen twice?</b> If it can, every place has all ' + tx('n') + ' choices again.' },
          { html: '<b>Pick the formula.</b> Order matters, no repeats: ' + tx(Pt('n', 'r') + '=\\frac{n!}{(n-r)!}') + '. Order matters, repeats allowed: ' + tx('n^{r}') + '. Order does not matter: ' + tx(Ct('n', 'r') + '=\\frac{n!}{r!\\,(n-r)!}') + '. A group, then one special role: ' + tx(Ct('n', 'r') + '\\times r') + '.' },
          { html: '<b>Put in your numbers</b> ' + nums + '. Answer the card (or press “Show the answer for this card”) to see these steps worked out for it, with a check.' },
        ]));
        return;
      }
      const steps = [];
      if (r >= 2) {
        steps.push({
          html: '<b>Does order matter?</b> Swap two of the chosen things — call them ' + tx('A') + ' and ' + tx('B') + '. ' + esc(c.swap),
          math: c.ans === 'P' ? '(' + lettersTex(r, false) + ')\\ne(' + lettersTex(r, true) + ')' : '\\{' + lettersTex(r, false) + '\\}=\\{' + lettersTex(r, true) + '\\}',
          note: c.ans === 'P' ? 'Yes: as ordered lists they are different outcomes, so order matters.' : c.ans === 'C' ? 'No: as groups they are the same outcome, so order does not matter.' : 'For the team, no: it is a group. But the captain is one special member, so who gets that role matters.',
        });
      } else {
        steps.push({ html: '<b>Does order matter?</b> With ' + tx('r=1') + ' only one thing is chosen, so there is nothing to swap: here ' + tx(Pt(n, 1) + '=' + Ct(n, 1) + '=' + n) + '. ' + esc(c.swap) });
      }
      steps.push({ html: '<b>Can the same thing be chosen twice?</b> ' + (c.rep ? '<b>Yes</b> — ' : '<b>No</b> — ') + esc(W[2]) });
      if (c.rep) steps.push({ html: '<b>So: order matters and repeats are allowed.</b> Each of the ' + tx('r') + ' places can be filled in all ' + tx('n') + ' ways, so multiply ' + tx('n') + ' by itself ' + tx('r') + ' times (multiplication rule, L5.1):', math: 'n\\times n\\times\\cdots\\times n=n^{r}' });
      else if (c.ans === 'P') steps.push({ html: '<b>So: order matters, no repeats — a permutation.</b> Fill the ' + tx('r') + ' places one by one: ' + tx('n') + ' choices for the first, ' + tx('n-1') + ' for the second, and so on down to ' + tx('n-r+1') + ' for the last, then multiply (L5.3):', math: Pt('n', 'r') + '=n(n-1)\\cdots(n-r+1)=\\frac{n!}{(n-r)!}' });
      else if (c.ans === 'C') steps.push({ html: '<b>So: order does not matter, no repeats — a combination.</b> Count the ordered lists ' + tx(Pt('n', 'r')) + ', then divide by ' + tx('r!') + ', because each group of ' + tx('r') + ' can be put in order in ' + tx('r!') + ' ways (L6.1):', math: Ct('n', 'r') + '=\\frac{' + Pt('n', 'r') + '}{r!}=\\frac{n!}{r!\\,(n-r)!}' });
      else steps.push({ html: '<b>So: choose the group, then give the role.</b> The team is a group: ' + tx(Ct('n', 'r')) + ' ways. Then the captain is one of its ' + tx('r') + ' members: ' + tx('r') + ' ways. Multiply (multiplication rule):', math: Ct('n', 'r') + '\\times r' });
      steps.push({ html: '<b>With your numbers</b> ' + nums + ':', math: eqChain('', countParts(c, n, r), false) });
      if (c.rep) {
        const tot = B(n) ** B(r), pr = perm(n, r);
        steps.push(r > n
          ? { html: '<b>Check.</b> Without repeats this would be impossible: only ' + n + ' different digits for ' + r + ' places, so ' + tx(Pt(n, r) + '=0') + '. Every one of the ' + iH(tot) + ' PINs repeats a digit.' }
          : { html: '<b>Check.</b> Without repeats it would be only ' + tx(Pt(n, r) + '=' + iT(pr)) + '. The difference is the number of PINs with at least one repeated digit:', math: n + '^{' + r + '}-' + Pt(n, r) + '=' + iT(tot) + '-' + iT(pr) + '=' + iT(tot - pr) });
      } else if (c.ans === 'P' && r >= 2) steps.push({ html: '<b>Check another way.</b> First choose which ' + r + ' (order does not matter), then put them in order, in ' + tx(r + '!') + ' ways:', math: Ct(n, r) + '\\times ' + r + '!=' + iT(choose(n, r)) + '\\times ' + iT(fact(r)) + '=' + iT(perm(n, r)) + '\\ \\checkmark' });
      else if (c.ans === 'C' && r >= 2) steps.push({ html: '<b>Check.</b> Among the ordered lists, each group of ' + r + ' appears ' + tx(r + '!=' + iT(fact(r))) + ' times:', math: '\\frac{' + Pt(n, r) + '}{' + r + '!}=\\frac{' + iT(perm(n, r)) + '}{' + iT(fact(r)) + '}=' + iT(choose(n, r)) + '\\ \\checkmark' });
      else if (c.ans === 'B') steps.push({ html: '<b>Check another way.</b> Pick the captain first (' + tx('n=' + n) + ' ways), then the other ' + tx('r-1=' + (r - 1)) + ' team members from the remaining ' + tx('n-1=' + (n - 1)) + ' players:', math: n + '\\times ' + Ct(n - 1, r - 1) + '=' + n + '\\times ' + iT(choose(n - 1, r - 1)) + '=' + iT(B(n) * choose(n - 1, r - 1)) + '\\ \\checkmark',
        note: r >= 2 ? 'Not ' + tx(Ct(n, r) + '=' + iT(choose(n, r))) + ' (that leaves out the captain) and not ' + tx(Pt(n, r) + '=' + iT(perm(n, r))) + ' (that would give every player a different role).' : 'With ' + tx('r=1') + ' the team is one player, who is also the captain, so all three counts agree.' });
      body.appendChild(K.steps(steps));
    }
    drawCards();
    drawSel();
  }

  /* ================================================================ TAB 5 — SOLVE FOR n */
  const FORMS = [
    { value: 'pp', label: 'P(n, a) = k · P(n, b)' },
    { value: 'ratio', label: 'P(n, a) ÷ P(n − 1, a) = p/q' },
    { value: 'cc', label: 'C(n, a) = C(n, b)' },
    { value: 'ck', label: 'C(n, a) = k' },
    { value: 'rr', label: 'P(m, r) = k · P(m + 1, r − 1)   — solve for r' },
  ];
  /** x^2 + Bx + C written in TeX with the variable v. */
  function polyTex(v, Bq, Cq) {
    let s = v + '^{2}';
    if (Bq) s += (Bq < 0n ? '-' : '+') + (Bq === 1n || Bq === -1n ? '' : iT(Bq < 0n ? -Bq : Bq)) + v;
    if (Cq) s += (Cq < 0n ? '-' : '+') + iT(Cq < 0n ? -Cq : Cq);
    return s;
  }
  const quadTex = (v, Bq, Cq) => polyTex(v, Bq, Cq) + '=0';
  /** The reduced value of n/d with its decimal: '\\frac{5}{3}\\approx 1.6667' (or the integer). */
  function fracRed(n, d) {
    n = B(n); d = B(d);
    const g = gcd(n, d) || 1n;
    const a = n / g, b = d / g;
    return (b === 1n ? iT(a) : '\\frac{' + iT(a) + '}{' + iT(b) + '}') + decTail(n, d);
  }
  /** Rows lo..hi for a trial table, kept short around the interesting n. */
  const windowAround = (lo, at, before, after) => [Math.max(lo, at - before), at + after];
  const lin = (v, c) => (c === 0n ? v : v + (c < 0n ? '+' + iT(-c) : '-' + iT(c)));
  /** Integer roots of x^2 + Bx + C = 0 with the steps. */
  function solveQuad(v, Bq, Cq) {
    const Dd = Bq * Bq - 4n * Cq;
    const out = { D: Dd, roots: [], tex: [] };
    out.tex.push('B=' + iT(Bq) + ',\\quad C=' + iT(Cq));
    out.tex.push('\\Delta=B^{2}-4C');
    out.tex.push('\\phantom{\\Delta}=' + (Bq < 0n ? '(' + iT(Bq) + ')' : iT(Bq)) + '^{2}-4\\times' + (Cq < 0n ? '(' + iT(Cq) + ')' : iT(Cq)) + '=' + iT(Dd));
    if (Dd < 0n) { out.note = 'Δ is negative: no real solution.'; return out; }
    const s = isqrt(Dd);
    if (s * s !== Dd) { out.note = 'Δ = ' + iH(Dd) + ' is not a perfect square, so there is no whole-number solution (the roots are ' + ((-Number(Bq) - Math.sqrt(Number(Dd))) / 2).toFixed(3) + ' and ' + ((-Number(Bq) + Math.sqrt(Number(Dd))) / 2).toFixed(3) + ').'; return out; }
    const r1 = -Bq - s, r2 = -Bq + s;
    if (r1 % 2n !== 0n) { out.note = 'The roots ' + ((-Number(Bq) - Number(s)) / 2) + ' and ' + ((-Number(Bq) + Number(s)) / 2) + ' are not whole numbers.'; return out; }
    out.roots = [r1 / 2n, r2 / 2n];
    out.tex.push(v + '=\\frac{' + (Bq === 0n ? '' : iT(-Bq)) + '\\pm' + iT(s) + '}{2}');
    out.tex.push('(' + lin(v, out.roots[0]) + ')(' + lin(v, out.roots[1]) + ')=0');
    return out;
  }
  function solveTab({ side, main, st, save, restart }) {
    const S = st.solve;
    const ctl = {};
    side.appendChild(K.group('1 · Lecture examples'));
    const pre = K.presets({ items: SOLVE_PRESETS, onPick: it => { Object.assign(S, { form: it.form }, ['a', 'b', 'k', 'p', 'q', 'm'].reduce((o, x) => (it[x] != null ? Object.assign(o, { [x]: it[x] }) : o), {})); S.src = it.label; save(); syncForm(); draw(); } });
    side.appendChild(pre);
    showSource(pre, SOLVE_PRESETS, S.src);
    side.appendChild(K.group('2 · Your equation'));
    ctl.form = K.selectField({ label: 'Form (P(n, r) means ' + tx(Pt('n', 'r')) + ', C(n, r) means ' + tx(Ct('n', 'r')) + ')', options: FORMS, value: S.form, onChange: v => { S.form = v; touched(); syncForm(); draw(); } });
    side.appendChild(ctl.form);
    const mk = (key, label, lo, hi) => { ctl[key] = K.numField({ label, min: lo, max: hi, value: Math.max(lo, Math.min(hi, S[key])), onChange: v => { S[key] = v; touched(); syncForm(); draw(); } }); side.appendChild(ctl[key]); };
    mk('a', tx('a'), 0, 12); mk('b', tx('b'), 0, 12); mk('m', tx('m'), 1, 30); mk('k', tx('k'), 1, 1000000); mk('p', tx('p'), 1, 100); mk('q', tx('q'), 1, 100);
    side.appendChild(resetBtn(() => restart('solve')));
    const P = {};
    P.answer = K.answer();
    P.steps = K.panel('Solve it step by step', 'Write each side with its formula, cancel what is common, and solve (L5.4).');
    P.tryp = K.panel('Check by trying values');
    main.append(P.answer, P.steps, P.tryp);
    const touched = () => { if (S.src) { S.src = ''; showSource(pre, SOLVE_PRESETS, ''); } save(); };
    /** Give field x the range lo..hi, keep the learner's value inside it, and show that value. */
    function rng(x, lo, hi) { ctl[x].setRange(lo, hi); S[x] = Math.max(lo, Math.min(hi, Number.isInteger(S[x]) ? S[x] : lo)); ctl[x].set(S[x]); }
    function syncForm() {
      const f = S.form;
      const show = { pp: ['a', 'b', 'k'], ratio: ['a', 'p', 'q'], cc: ['a', 'b'], ck: ['a', 'k'], rr: ['m', 'k'] }[f];
      ['a', 'b', 'm', 'k', 'p', 'q'].forEach(x => { ctl[x].hidden = !show.includes(x); ctl[x].hint(''); });
      if (f === 'pp') { rng('a', 1, 12); rng('b', 0, Math.max(0, S.a - 1)); rng('k', 1, 1000000); ctl.b.hint(tx('b') + ' must be smaller than ' + tx('a') + ' (here 0 to ' + (S.a - 1) + ').'); }
      if (f === 'ratio') { rng('a', 1, 12); rng('p', 1, 100); rng('q', 1, 100); }
      if (f === 'cc') { rng('a', 0, 30); rng('b', 0, 30); }
      if (f === 'ck') { rng('a', 1, 10); rng('k', 1, 1000000000); }
      if (f === 'rr') { rng('m', 1, 30); rng('k', 1, 100); }
      ctl.form.select.value = f;
    }
    function draw() {
      const f = S.form;
      const R = f === 'pp' ? solvePP() : f === 'ratio' ? solveRatio() : f === 'cc' ? solveCC() : f === 'ck' ? solveCK() : solveRR();
      K.setAnswer(P.answer, { ev: 'Your equation: ' + tx(R.eq) + (R.unknown === 'r' ? ' — find ' + tx('r') : ' — find ' + tx('n')) + '.', big: R.answer, sub: R.sub });
      Lab.clear(P.steps.body);
      P.steps.body.appendChild(K.steps(R.steps));
      Lab.clear(P.tryp.body);
      P.tryp.sub(R.trySub);
      P.tryp.body.appendChild(tableEl(R.tryHead, R.tryRows, 's4-trytab'));
    }
    function solvePP() {
      const a = S.a, b = Math.min(S.b, a - 1), k = S.k, d = a - b;
      const eq = Pt('n', a) + '=' + iT(k) + '\\cdot ' + Pt('n', b);
      const prodOf = n => perm(n - b, d);
      const facs = (m) => { const f = []; for (let j = b; j < a; j++) f.push(j === 0 ? m : '(' + m + '-' + j + ')'); return f.join(''); };
      const steps = [];
      steps.push({ html: 'Write both sides with ' + tx(Pt('n', 'r') + '=\\frac{n!}{(n-r)!}') + ' (L5.3):', math: '\\frac{n!}{(n-' + a + ')!}=' + iT(k) + '\\times\\frac{n!}{(n-' + b + ')!}' });
      steps.push({ html: 'Divide both sides by ' + tx('n!') + ' (it is never 0) and move the factorials:', math: '\\frac{(n-' + b + ')!}{(n-' + a + ')!}=' + iT(k) });
      steps.push({ html: 'Expand the top as in L5.2, ' + tx('(n-' + b + ')!=' + facs('n') + '\\times(n-' + a + ')!') + ', and cancel ' + tx('(n-' + a + ')!') + ': a product of ' + plural(d, 'factor') + ' must equal ' + iH(k) + ':', math: facs('n') + '=' + iT(k) });
      let sol = null;
      if (d === 1) {
        sol = B(k + b);
        steps.push({ html: 'One factor:', math: lin('n', B(b)) + '=' + iT(k) + '\\;\\Rightarrow\\; n=' + (b ? iT(k) + '+' + b + '=' : '') + iT(sol) });
        if (sol < B(a)) sol = null;
      } else if (d === 2) {
        // (n-b)(n-b-1) = k  →  n^2 - (2b+1)n + b(b+1) - k = 0
        const Bq = -B(2 * b + 1), Cq = B(b * (b + 1) - k);
        const Q = solveQuad('n', Bq, Cq);
        steps.push({ html: 'Multiply out: ' + tx(facs('n') + '=' + polyTex('n', -B(2 * b + 1), B(b * (b + 1)))) + ', so', math: polyTex('n', -B(2 * b + 1), B(b * (b + 1))) + '=' + iT(k) + '\\;\\Rightarrow\\;' + quadTex('n', Bq, Cq) });
        steps.push({ html: 'Solve ' + tx('n^{2}+Bn+C=0') + ' with ' + tx('n=\\frac{-B\\pm\\sqrt{\\Delta}}{2}') + ':', math: Q.tex.length > 1 ? '\\begin{aligned}&' + Q.tex.join('\\\\&') + '\\end{aligned}' : Q.tex[0], note: Q.note || '' });
        if (Q.roots.length) {
          const okR = Q.roots.filter(x => x >= B(a));
          steps.push({ html: 'So ' + tx('n=' + iT(Q.roots[0]) + '\\text{ or }n=' + iT(Q.roots[1])) + '. ' + tx(Pt('n', a)) + ' needs a whole number ' + tx('n\\ge ' + a) + (Q.roots.some(x => x < B(a)) ? ', so reject ' + Q.roots.filter(x => x < B(a)).map(x => tx('n=' + iT(x))).join(' and ') + '.' : '.') });
          sol = okR.length ? okR[okR.length - 1] : null;
        }
      } else {
        steps.push({ html: 'With ' + d + ' factors there is no quick formula: try whole numbers ' + tx('n\\ge ' + a) + ' (the product grows as ' + tx('n') + ' grows, so at most one works) — see the table below.' });
        const est = Math.max(a, b + Math.floor(Math.pow(k, 1 / d)) - 3);
        for (let n = est; n <= est + 400; n++) { const v = prodOf(n); if (v === B(k)) { sol = B(n); break; } if (v > B(k)) break; }
      }
      const n0 = sol != null ? Number(sol) : null;
      if (n0 != null) steps.push({ html: 'Check by putting ' + tx('n=' + iT(n0)) + ' back:', math: '\\begin{aligned}&\\text{left: }' + Pt(n0, a) + '=' + iT(perm(n0, a)) + '\\\\&\\text{right: }' + iT(k) + '\\times ' + Pt(n0, b) + '=' + iT(k) + '\\times ' + iT(perm(n0, b)) + '=' + iT(B(k) * perm(n0, b)) + '\\ \\checkmark\\end{aligned}' });
      let cross = a;
      if (n0 != null) cross = n0;
      else { const est = Math.max(a, b + Math.floor(Math.pow(k, 1 / d)) - 3); for (cross = est; cross < est + 400 && prodOf(cross) < B(k); cross++); }
      const [lo, hi] = windowAround(a, cross, 6, 3);
      const rows = [];
      for (let n = lo; n <= hi; n++) { const L = perm(n, a), Rr = B(k) * perm(n, b); rows.push({ hl: L === Rr, cells: [tx('n=' + n), tx(iT(L)), tx(iT(k) + '\\times ' + iT(perm(n, b)) + '=' + iT(Rr)), L === Rr ? '<span class="cgood">equal ✓</span>' : L < Rr ? 'left smaller' : 'left bigger'] }); }
      return { eq, unknown: 'n', answer: n0 != null ? 'n=' + iT(n0) : '\\text{no whole number }n\\ge ' + a + '\\text{ works}', sub: n0 != null ? 'Only ' + tx('n=' + n0) + ' satisfies the equation (with ' + tx('n\\ge a=' + a) + ' so that ' + tx(Pt('n', a)) + ' exists).' : 'The product jumps past ' + iH(k) + ' without hitting it — check the table.', steps, trySub: 'Both sides for the whole numbers ' + tx('n=' + lo) + ' to ' + tx(String(hi)) + (lo > a ? ' (smaller ' + tx('n') + ' give a smaller left side)' : '') + '.', tryHead: [tx('n'), tx(Pt('n', a)), tx(iT(k) + '\\times ' + Pt('n', b)), ''], tryRows: rows };
    }
    function solveRatio() {
      const a = S.a, p0 = S.p, q0 = S.q;
      const g = Number(gcd(B(p0), B(q0))), p = p0 / g, q = q0 / g;
      const eq = '\\frac{' + Pt('n', a) + '}{' + Pt('n-1', a) + '}=\\frac{' + p0 + '}{' + q0 + '}';
      const steps = [];
      steps.push({ html: 'Write both with ' + tx(Pt('n', 'r') + '=\\frac{n!}{(n-r)!}') + ':', math: '\\frac{n!/(n-' + a + ')!}{(n-1)!/(n-1-' + a + ')!}=\\frac{n!}{(n-1)!}\\times\\frac{(n-' + (a + 1) + ')!}{(n-' + a + ')!}' });
      steps.push({ html: 'Cancel with ' + tx('n!=n\\times(n-1)!') + ' and ' + tx('(n-' + a + ')!=(n-' + a + ')\\times(n-' + (a + 1) + ')!') + ':', math: '\\frac{n}{n-' + a + '}=\\frac{' + p0 + '}{' + q0 + '}' + (g > 1 ? '=\\frac{' + p + '}{' + q + '}' : '') });
      steps.push({ html: 'Cross-multiply:', math: q + 'n=' + p + '(n-' + a + ')\\;\\Rightarrow\\;' + (p - q) + 'n=' + p * a });
      let n0 = null;
      if (p <= q) steps.push({ html: 'The left side ' + tx('\\frac{n}{n-' + a + '}') + ' is always bigger than 1, but ' + tx('\\frac{p}{q}=\\frac{' + p + '}{' + q + '}\\le 1') + ': no solution.' });
      else if ((p * a) % (p - q) !== 0) steps.push({ html: tx('n=\\frac{' + p * a + '}{' + (p - q) + '}') + ' is not a whole number: no solution.' });
      else {
        n0 = (p * a) / (p - q);
        steps.push({ html: 'Divide:', math: 'n=\\frac{' + p * a + '}{' + (p - q) + '}=' + n0 });
        if (n0 < a + 1) { steps.push({ html: tx(Pt('n-1', a)) + ' needs ' + tx('n-1\\ge ' + a) + ', and ' + tx('n=' + n0) + ' is too small: no solution.' }); n0 = null; }
        else steps.push({ html: 'Check:', math: '\\frac{' + Pt(n0, a) + '}{' + Pt(n0 - 1, a) + '}=\\frac{' + iT(perm(n0, a)) + '}{' + iT(perm(n0 - 1, a)) + '}=' + fracRed(perm(n0, a), perm(n0 - 1, a)) + '\\ \\checkmark' });
      }
      const rows = [];
      const [wlo, whi] = windowAround(a + 1, n0 != null ? n0 : a + 1, 5, n0 != null ? 3 : 9);
      for (let n = wlo; n <= whi; n++) { const L = perm(n, a), Rr = perm(n - 1, a); const hit = L * B(q0) === Rr * B(p0); rows.push({ hl: hit, cells: [tx('n=' + n), tx('\\frac{' + iT(L) + '}{' + iT(Rr) + '}=\\frac{' + n + '}{' + (n - a) + '}=' + fracRed(B(n), B(n - a))), hit ? '<span class="cgood">= ' + p0 + '/' + q0 + ' ✓</span>' : ''] }); }
      return { eq, unknown: 'n', answer: n0 != null ? 'n=' + iT(n0) : '\\text{no whole-number solution}', sub: n0 != null ? 'The ratio simplifies to ' + tx('\\frac{n}{n-' + a + '}') + ', and only ' + tx('n=' + n0) + ' makes it ' + tx('\\frac{' + p0 + '}{' + q0 + '}') + '.' : 'See the steps for the reason.', steps, trySub: 'The ratio ' + tx('\\frac{n}{n-' + a + '}') + ' for ' + tx('n=' + wlo) + ' to ' + tx(String(whi)) + ' (it shrinks towards 1 as ' + tx('n') + ' grows).', tryHead: [tx('n'), tx('\\frac{' + Pt('n', a) + '}{' + Pt('n-1', a) + '}'), ''], tryRows: rows };
    }
    function solveCC() {
      const a = S.a, b = S.b;
      const eq = Ct('n', a) + '=' + Ct('n', b);
      const steps = [];
      let n0 = null;
      if (a === b) steps.push({ html: 'Both sides are the same, so every whole number ' + tx('n\\ge ' + a) + ' works. Make ' + tx('a') + ' and ' + tx('b') + ' different to get a real equation.' });
      else {
        n0 = a + b;
        steps.push({ html: 'Symmetry (L6.1): ' + tx(Ct('n', 'r') + '=' + Ct('n', 'n-r')) + ' — choosing ' + tx('r') + ' to take is choosing ' + tx('n-r') + ' to leave. So ' + tx(Ct('n', b) + '=' + Ct('n', 'n-' + b)) + ', and the two sides match when', math: a + '=n-' + b + '\\;\\Rightarrow\\; n=' + a + '+' + b + '=' + n0 });
        steps.push({ html: 'No other ' + tx('n') + ' works: along a row the numbers rise to the middle and then fall back in mirror order, so two different positions hold equal numbers only when they are mirror images (' + tx(a + '+' + b + '=n') + '). The table below checks it.' });
        steps.push({ html: 'Check:', math: Ct(n0, a) + '=' + iT(choose(n0, a)) + '=' + Ct(n0, b) + '\\ \\checkmark' });
      }
      const lo = Math.max(a, b), rows = [];
      for (let n = lo; n <= lo + Math.max(8, a + b - lo + 3) && n <= lo + 40; n++) { const L = choose(n, a), Rr = choose(n, b); rows.push({ hl: L === Rr, cells: [tx('n=' + n), tx(iT(L)), tx(iT(Rr)), L === Rr ? '<span class="cgood">equal ✓</span>' : ''] }); }
      return { eq, unknown: 'n', answer: a === b ? '\\text{every }n\\ge ' + a : 'n=' + n0, sub: a === b ? '' : 'Mirror positions in row ' + n0 + ': ' + tx(a + '+' + b + '=' + n0) + '.', steps, trySub: 'Both sides for ' + tx('n=' + lo + ',' + (lo + 1) + ',\\dots') + '.', tryHead: [tx('n'), tx(Ct('n', a)), tx(Ct('n', b)), ''], tryRows: rows };
    }
    function solveCK() {
      const a = S.a, k = S.k;
      const eq = Ct('n', a) + '=' + iT(k);
      const steps = [];
      steps.push({ html: 'Write it out with ' + tx(Ct('n', 'r') + '=\\frac{n!}{r!\\,(n-r)!}') + ' and cancel ' + tx('(n-' + a + ')!') + ':', math: '\\frac{' + (a === 1 ? 'n' : 'n(n-1)' + (a > 2 ? '\\cdots(n-' + (a - 1) + ')' : '')) + '}{' + a + '!}=' + iT(k) + '\\;\\Rightarrow\\;' + (a === 1 ? 'n' : 'n(n-1)' + (a > 2 ? '\\cdots(n-' + (a - 1) + ')' : '')) + '=' + iT(k) + '\\times ' + iT(fact(a)) + '=' + iT(B(k) * fact(a)) });
      let n0 = null;
      if (a === 1) { n0 = B(k); steps.push({ html: 'One factor: ' + tx('n=' + iT(k)) + '.' }); }
      else if (a === 2) {
        const Q = solveQuad('n', -1n, -2n * B(k));
        steps.push({ html: 'Multiply out: ' + tx('n^{2}-n=' + iT(2n * B(k))) + ', so', math: quadTex('n', -1n, -2n * B(k)) });
        steps.push({ html: 'Solve ' + tx('n^{2}+Bn+C=0') + ' with ' + tx('n=\\frac{-B\\pm\\sqrt{\\Delta}}{2}') + ':', math: Q.tex.length > 1 ? '\\begin{aligned}&' + Q.tex.join('\\\\&') + '\\end{aligned}' : Q.tex[0], note: Q.note || '' });
        if (Q.roots.length) { const okR = Q.roots.filter(x => x >= 2n); n0 = okR.length ? okR[okR.length - 1] : null; steps.push({ html: 'Keep the root with ' + tx('n\\ge 2') + (Q.roots.some(x => x < 2n) ? ' and reject ' + Q.roots.filter(x => x < 2n).map(x => tx('n=' + iT(x))).join(', ') : '') + '.' }); }
      } else {
        steps.push({ html: 'The left side grows with ' + tx('n') + ', so try ' + tx('n=' + a + ',' + (a + 1) + ',\\dots') + ' until it reaches ' + iH(B(k) * fact(a)) + ' (table below).' });
        for (let n = a; n <= 5000; n++) { const v = choose(n, a); if (v === B(k)) { n0 = B(n); break; } if (v > B(k)) break; }
      }
      if (n0 != null && n0 >= B(a)) steps.push({ html: 'Check:', math: Ct(n0, a) + '=' + iT(choose(Number(n0), a)) + '\\ \\checkmark', note: n0 > B(a) && Number(n0) - a !== a ? 'By symmetry ' + tx(Ct(n0, Number(n0) - a)) + ' is the same number, but the question fixes the bottom number at ' + a + '.' : '' });
      else n0 = null;
      const rows = [];
      let cross = a;
      if (n0 != null) cross = Number(n0);
      else { const lim = a === 1 ? k + 1 : a + 6000; for (cross = a; cross < lim && choose(cross, a) < B(k); cross++); }
      const [start, stop] = windowAround(a, cross, 6, n0 != null ? 3 : 1);
      let lastV = 0n;
      for (let n = start; n <= stop; n++) { const v = choose(n, a); lastV = v; rows.push({ hl: v === B(k), cells: [tx('n=' + n), tx(Ct(n, a) + '=' + iT(v)), v === B(k) ? '<span class="cgood">= ' + iH(k) + ' ✓</span>' : v < B(k) ? 'too small' : 'too big'] }); }
      return { eq, unknown: 'n', answer: n0 != null ? 'n=' + iT(n0) : '\\text{no whole-number solution}', sub: n0 != null ? tx(Ct(iT(n0), a) + '=' + iT(k)) + '.' : iH(k) + ' is not in column ' + a + ' of Pascal’s triangle (the values jump past it).', steps, trySub: 'Column ' + a + ' of Pascal’s triangle, rows ' + start + ' to ' + stop + (start > a ? ' (earlier rows are smaller still)' : '') + '.' + (lastV < B(k) && n0 == null ? ' (Still too small at the end of the table.)' : ''), tryHead: [tx('n'), tx(Ct('n', a)), ''], tryRows: rows };
    }
    function solveRR() {
      const m = S.m, k = S.k;
      const eq = Pt(m, 'r') + '=' + k + '\\cdot ' + Pt(m + 1, 'r-1');
      const steps = [];
      steps.push({ html: 'Write both sides with the formula (the unknown is now ' + tx('r') + '):', math: '\\frac{' + m + '!}{(' + m + '-r)!}=' + k + '\\times\\frac{' + (m + 1) + '!}{(' + (m + 1) + '-(r-1))!}=' + k + '\\times\\frac{' + (m + 1) + '!}{(' + (m + 2) + '-r)!}' });
      steps.push({ html: 'Use ' + tx((m + 1) + '!=' + (m + 1) + '\\times ' + m + '!') + ' and ' + tx('(' + (m + 2) + '-r)!=(' + (m + 2) + '-r)(' + (m + 1) + '-r)(' + m + '-r)!') + ', then cancel ' + tx(m + '!') + ' and ' + tx('(' + m + '-r)!') + ':', math: '(' + (m + 2) + '-r)(' + (m + 1) + '-r)=' + k + '\\times ' + (m + 1) + '=' + k * (m + 1) });
      const Bq = -B(2 * m + 3), Cq = B((m + 1) * (m + 2) - k * (m + 1));
      const Q = solveQuad('r', Bq, Cq);
      steps.push({ html: 'Multiply out and collect:', math: quadTex('r', Bq, Cq) });
      steps.push({ html: 'Solve ' + tx('r^{2}+Br+C=0') + ' with ' + tx('r=\\frac{-B\\pm\\sqrt{\\Delta}}{2}') + ':', math: Q.tex.length > 1 ? '\\begin{aligned}&' + Q.tex.join('\\\\&') + '\\end{aligned}' : Q.tex[0], note: Q.note || '' });
      let r0 = null;
      if (Q.roots.length) {
        const okR = Q.roots.filter(x => x >= 1n && x <= B(m));
        steps.push({ html: 'So ' + tx('r=' + iT(Q.roots[0]) + '\\text{ or }r=' + iT(Q.roots[1])) + '. But ' + tx(Pt(m, 'r')) + ' needs ' + tx('r\\le ' + m) + ' and ' + tx(Pt(m + 1, 'r-1')) + ' needs ' + tx('r\\ge 1') + (okR.length < 2 ? ', so keep only ' + (okR.length ? tx('r=' + iT(okR[0])) : 'neither') + '.' : '.') });
        r0 = okR.length ? Number(okR[0]) : null;
      }
      if (r0 != null) steps.push({ html: 'Check:', math: '\\begin{aligned}&\\text{left: }' + Pt(m, r0) + '=' + iT(perm(m, r0)) + '\\\\&\\text{right: }' + k + '\\times ' + Pt(m + 1, r0 - 1) + '=' + k + '\\times ' + iT(perm(m + 1, r0 - 1)) + '=' + iT(B(k) * perm(m + 1, r0 - 1)) + '\\ \\checkmark\\end{aligned}' });
      const rows = [];
      for (let r = 1; r <= m; r++) { const L = perm(m, r), Rr = B(k) * perm(m + 1, r - 1); rows.push({ hl: L === Rr, cells: [tx('r=' + r), tx(iT(L)), tx(k + '\\times ' + iT(perm(m + 1, r - 1)) + '=' + iT(Rr)), L === Rr ? '<span class="cgood">equal ✓</span>' : ''] }); }
      return { eq, unknown: 'r', answer: r0 != null ? 'r=' + r0 : '\\text{no valid }r', sub: r0 != null ? 'The quadratic has two roots; only ' + tx('r=' + r0) + ' fits ' + tx('1\\le r\\le ' + m) + '.' : 'No root fits ' + tx('1\\le r\\le ' + m) + '.', steps, trySub: 'Every allowed ' + tx('r=1,\\dots,' + m) + '.', tryHead: [tx('r'), tx(Pt(m, 'r')), tx(k + '\\times ' + Pt(m + 1, 'r-1')), ''], tryRows: rows };
    }
    syncForm();
    draw();
  }

  /* ================================================================ LAB */
  const TABS = [
    { value: 'committee', label: '1 · Committees with conditions', cap: 'Groups of people and rules like “exactly 4 of the 5 bowlers” or “at least 3 from each part”: the count as a sum of products of combinations, the complement, and the probability (L6.1).', build: committeeTab },
    { value: 'roles', label: '2 · Roles', cap: 'Choose r people, then give out roles: ⁿCᵣ × ʳPₖ. When everyone gets a role this is ⁿPᵣ = ⁿCᵣ × r! — two class representatives versus a captain and a vice-captain (L6.2).', build: rolesTab },
    { value: 'pascal', label: '3 · Pascal', cap: 'Pascal’s triangle to n = 15: ⁿCᵣ = ⁿCₙ₋ᵣ, ⁿCᵣ = ⁿ⁻¹Cᵣ₋₁ + ⁿ⁻¹Cᵣ (“contains A or not”, L6.1), and the binomial coefficients of (a + b)ⁿ.', build: pascalTab },
    { value: 'which', label: '4 · Permutation or combination?', cap: 'Situations from the lectures and beyond. Pick the method; the card explains the swap test and counts it with your numbers (L6.2).', build: whichTab },
    { value: 'solve', label: '5 · Solve for n', cap: 'Equations in n or r: write the factorial form, cancel, solve — and check by trying values (L5.4, Week 6 notes).', build: solveTab },
  ];
  function render(host) {
    const st = loadState();
    const save = () => Lab.store.set(KEY, st);
    const bar = h('div', { class: 's4-tabs five' }), cap = h('div', { class: 's4-tabcap' }), body = h('div', { class: 's4-body' });
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
    id: ID, course: 's1', week: 6, order: 1,
    title: 'Combinations in practice lab', sub: 'Week 6 · committees, Pascal, roles',
    topics: ['ⁿCᵣ with conditions', 'exactly / at least / at most', 'complement', 'ⁿCᵣ × r! = ⁿPᵣ', 'Pascal’s rule', 'ⁿCᵣ = ⁿCₙ₋ᵣ', '(a + b)ⁿ', 'permutation or combination?', 'solve for n'],
    desc: 'Build committees from groups with rules like “exactly 4 of the 5 bowlers” (⁵C₄ × ¹²C₇) and see every split; choose a team and hand out roles (⁴⁰C₂ vs ⁴⁰P₂); explore Pascal’s triangle with “contains A or not”; decide permutation or combination on scenario cards; and solve equations in n.',
    render,
  });
})();
