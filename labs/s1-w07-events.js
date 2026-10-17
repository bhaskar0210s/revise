/* Playground lab (s1-w07-events) — Statistics I, Week 7 (L7.1–L7.6): experiment and sample space, events,
   Venn algebra, three interpretations of probability, axioms, addition and complement rules, equally likely outcomes.
   It also exports Lab.play.s1ev (sample spaces, event rules, outcome grid, Venn diagram) for the Week 8 lab. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const K = Lab.play;
  const tx = (s, d) => Lab.tex(s, d);
  const esc = Lab.esc;
  const fmtInt = n => K.fmtInt(n);
  /** Learner-typed text: escaped and never typeset as maths. */
  const user = s => '<span class="no-math">' + esc(s) + '</span>';
  const TEXESC = { '\\': '/', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#', '^': '\\textasciicircum{}', '_': '\\_', '%': '\\%', '~': '\\textasciitilde{}' };
  const texText = s => '\\text{' + String(s).replace(/[\\{}$&#^_%~]/g, c => TEXESC[c]) + '}';
  const fr = (n, d) => '\\frac{' + K.intTex(n) + '}{' + K.intTex(d) + '}';
  /** n/d as TeX, then "= reduced" when the fraction reduces. */
  const frRed = (n, d) => {
    if (!d) return fr(n, d);
    if (n === 0) return fr(0, d) + '=0';
    const f = F(n, d);
    return fr(n, d) + (f.d !== d ? '=' + f.tex() : '');
  };
  /** Decimal mode: when the learner typed decimals (the lecture's 0.3, 0.2, 0.1), exact decimals are shown as decimals. */
  let DEC = false;
  const isDec = f => DEC && f instanceof Lab.Frac && K.exactDecimal(f);
  const pT = f => (isDec(f) ? Lab.fmtDec(Number(f), 4) : K.pTex(f));
  /** Decimal tail of a probability, taken from the kit's K.pTexApprox: '=0.75' when exact, '\\approx 0.3056' otherwise, '' for whole numbers. */
  const approx = f => { if (isDec(f)) return ''; const t = K.pTex(f), a = K.pTexApprox(f); return a.indexOf(t) === 0 ? a.slice(t.length) : ''; };
  const cnt = m => m.reduce((a, b) => a + (b ? 1 : 0), 0);
  /** '=0.497' when hits/n is exactly that 4-place decimal, else '\\approx 0.3327'. */
  const decEq = (hits, n) => (K.exactDecimal(F(hits, n)) ? '=' : '\\approx ') + Lab.fmtDec(hits / n, 4);
  const prob = (sp, m) => F.sum(sp.outs.filter((o, k) => m[k]).map(o => o.p));
  /** Wrap each cell's content in one span, so stacked (phone) rows keep text and maths together. */
  const wrapCells = tbl => { tbl.querySelectorAll('td').forEach(td => { const w = h('span', { class: 's5-v' }); while (td.firstChild) w.appendChild(td.firstChild); td.appendChild(w); }); return tbl; };
  const ok = '<span class="cgood">✓</span>', no = '<span class="cbad">✗</span>';

  /* ======================================================== sample spaces */
  const SPACE_OPTS = [
    { value: 'die', label: 'One die — 6 outcomes' },
    { value: 'dice', label: 'Two dice — 36 outcomes' },
    { value: 'card', label: 'One card from a 52-card deck' },
    { value: 'coins', label: 'n coins — 2ⁿ outcomes' },
    { value: 'race', label: 'Order of finish in a race — n! outcomes' },
    { value: 'custom', label: 'Your own outcomes and probabilities' },
    { value: 'given', label: 'Only probabilities given: P(A), P(B), …' },
  ];
  const RUNNERS = 'ABCDEF';
  const factorial = n => (n <= 1 ? 1 : n * factorial(n - 1));
  /** Every ordering of the letters in s, in alphabetical order. */
  function perms(s) { if (s.length <= 1) return [s]; const out = []; for (let i = 0; i < s.length; i++) perms(s.slice(0, i) + s.slice(i + 1)).forEach(q => out.push(s[i] + q)); return out; }
  const ordinal = k => k + (k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th');
  /** Build a sample space. Every outcome: {id, short (text label), v, p (Frac), k (index)}. */
  function makeSpace(kind, opt) {
    opt = opt || {};
    let outs;
    if (kind === 'die') outs = [1, 2, 3, 4, 5, 6].map(k => ({ id: String(k), short: String(k), v: k, p: F(1, 6) }));
    else if (kind === 'dice') outs = Lab.P.dice(2).map(o => ({ id: o.id, short: '(' + o.v.join(',') + ')', v: o.v, p: o.p }));
    else if (kind === 'card') outs = Lab.P.deck().map(o => ({ id: o.id, short: o.label, v: o.v, p: o.p }));
    else if (kind === 'coins') outs = Lab.P.coins(opt.n || 3).map(o => ({ id: o.id, short: o.label, v: o.v, p: o.p }));
    else if (kind === 'race') { const n = Math.max(3, Math.min(6, opt.n || 6)); opt.n = n; outs = perms(RUNNERS.slice(0, n)).map(q => ({ id: q, short: q, v: q, p: F(1, factorial(n)) })); }
    else if (kind === 'given') {
      // only probabilities are known: the four Venn regions play the part of the outcomes
      const g = opt.g;
      outs = [
        { id: 'g11', short: 'A and B', v: '11', p: g.pAB },
        { id: 'g10', short: 'A only', v: '10', p: g.pA.sub(g.pAB) },
        { id: 'g01', short: 'B only', v: '01', p: g.pB.sub(g.pAB) },
        { id: 'g00', short: 'neither', v: '00', p: F(1).sub(g.pA).sub(g.pB).add(g.pAB) },
      ];
    }
    else outs = (opt.rows || []).map(r => ({ id: 'c' + r.id, short: r.name, v: r.name, p: r.p, user: true }));
    outs.forEach((o, k) => { o.k = k; });
    const N = outs.length;
    return { kind, outs, N, n: opt.n || 3, equal: kind !== 'given' && N > 0 && outs.every(o => o.p.eq(outs[0].p)), total: F.sum(outs.map(o => o.p)) };
  }
  /** Where |S| comes from, with the learner's numbers. */
  function spaceWhy(sp) {
    const N = sp.N;
    switch (sp.kind) {
      case 'die': return 'One fair die shows one of the faces 1, 2, 3, 4, 5, 6, so ' + tx('|S|=6') + '. Fair means equally likely: each face has probability ' + tx('\\frac{1}{|S|}=\\frac16') + '.';
      case 'dice': return 'Two fair dice: 6 faces for the first die times 6 for the second, so ' + tx('|S|=6\\times 6=36') + ' ordered pairs (first, second). Each pair has probability ' + tx('\\frac1{36}') + '.';
      case 'card': return 'One card from a well-shuffled deck: 4 suits times 13 ranks, so ' + tx('|S|=4\\times 13=52') + '. Each card has probability ' + tx('\\frac1{52}') + '.';
      case 'race': return 'Order of finish of ' + tx('n=' + sp.n) + ' runners (' + RUNNERS.slice(0, sp.n).split('').join(', ') + '), no ties: every ordering is one outcome, so ' + tx('|S|=n!=' + sp.n + '!=' + Array.from({ length: sp.n }, (_, i) => sp.n - i).join('\\times ') + '=' + K.intTex(N)) + '. All orders are equally likely, each with probability ' + tx('\\frac1{' + K.intTex(N) + '}') + '.';
      case 'given': return 'There is no list of outcomes here — only probabilities are given. The four regions of the Venn diagram (“A and B”, “A only”, “B only”, “neither”) act as the outcomes; their probabilities follow from your numbers (step list below).';
      case 'coins': return 'You chose ' + tx('n=' + sp.n) + ' fair coin' + (sp.n > 1 ? 's' : '') + '. Each toss is H or T, so ' + tx('|S|=2^{n}=2^{' + sp.n + '}=' + N) + (sp.n > 1 ? ' sequences' : ' outcomes') + ', each with probability ' + tx('\\left(\\tfrac12\\right)^{' + sp.n + '}=\\frac1{' + N + '}') + '.';
      default: return 'You typed ' + tx('|S|=' + N) + ' outcome' + (N === 1 ? '' : 's') + ' with your own probabilities' + (sp.equal ? ' — all equal (' + tx(pT(sp.outs[0].p)) + ' each), so they are equally likely.' : ' — <b>not</b> all equal, so they are <b>not</b> equally likely.');
    }
  }

  /* ========================================================== event rules */
  const RANKS = Lab.P.RANKS;
  const SUITS = ['♠', '♥', '♦', '♣'];
  const SUITNAME = { '♠': 'spades', '♥': 'hearts', '♦': 'diamonds', '♣': 'clubs' };
  const nH = s => [...s].filter(c => c === 'H').length;
  const P1 = (k, def, min, max, label) => ({ k, def, min, max, label: label || k });
  const plural = (k, w) => k + ' ' + w + (k === 1 ? '' : 's');
  const SET_RULE = { id: 'set', label: 'My own set — click the outcomes', test: (v, q, o) => (q.set || []).indexOf(o.id) >= 0, words: () => 'your own set' };
  const RULES = {
    die: [
      { id: 'even', label: 'face is even', test: v => v % 2 === 0, words: () => 'the face is even' },
      { id: 'odd', label: 'face is odd', test: v => v % 2 === 1, words: () => 'the face is odd' },
      { id: 'prime', label: 'face is prime (2, 3, 5)', test: v => v === 2 || v === 3 || v === 5, words: () => 'the face is prime (2, 3 or 5)' },
      { id: 'eq', label: 'face = a', params: [P1('a', 6, 1, 6)], test: (v, q) => v === q.a, words: q => 'the face is ' + q.a },
      { id: 'ge', label: 'face ≥ a (at least a)', params: [P1('a', 4, 1, 6)], test: (v, q) => v >= q.a, words: q => 'the face is at least ' + q.a },
      { id: 'le', label: 'face ≤ a (at most a)', params: [P1('a', 2, 1, 6)], test: (v, q) => v <= q.a, words: q => 'the face is at most ' + q.a },
      { id: 'mult', label: 'face is a multiple of a', params: [P1('a', 3, 1, 6)], test: (v, q) => v % q.a === 0, words: q => 'the face is a multiple of ' + q.a },
      SET_RULE,
    ],
    dice: [
      { id: 'sumEq', label: 'sum is s', params: [P1('s', 7, 2, 12)], test: (v, q) => v[0] + v[1] === q.s, words: q => 'the sum is ' + q.s },
      { id: 'sumGe', label: 'sum ≥ s (at least s)', params: [P1('s', 9, 2, 12)], test: (v, q) => v[0] + v[1] >= q.s, words: q => 'the sum is at least ' + q.s },
      { id: 'sumLe', label: 'sum ≤ s (at most s)', params: [P1('s', 4, 2, 12)], test: (v, q) => v[0] + v[1] <= q.s, words: q => 'the sum is at most ' + q.s },
      { id: 'sumEven', label: 'sum is even', test: v => (v[0] + v[1]) % 2 === 0, words: () => 'the sum is even' },
      { id: 'sumOdd', label: 'sum is odd', test: v => (v[0] + v[1]) % 2 === 1, words: () => 'the sum is odd' },
      { id: 'atLeast', label: 'at least one die shows a', params: [P1('a', 6, 1, 6)], test: (v, q) => v[0] === q.a || v[1] === q.a, words: q => 'at least one die shows ' + q.a },
      { id: 'noneShows', label: 'no die shows a', params: [P1('a', 6, 1, 6)], test: (v, q) => v[0] !== q.a && v[1] !== q.a, words: q => 'no die shows ' + q.a },
      { id: 'doubles', label: 'doubles (both dice the same)', test: v => v[0] === v[1], words: () => 'both dice show the same face (doubles)' },
      { id: 'first', label: 'first die shows a', params: [P1('a', 6, 1, 6)], test: (v, q) => v[0] === q.a, words: q => 'the first die shows ' + q.a },
      { id: 'second', label: 'second die shows a', params: [P1('a', 6, 1, 6)], test: (v, q) => v[1] === q.a, words: q => 'the second die shows ' + q.a },
      { id: 'firstGt', label: 'first die > second die', test: v => v[0] > v[1], words: () => 'the first die is larger than the second' },
      { id: 'diff', label: '|first − second| = d', params: [P1('d', 1, 0, 5)], test: (v, q) => Math.abs(v[0] - v[1]) === q.d, words: q => 'the two faces differ by ' + q.d },
      { id: 'bothEven', label: 'both faces even', test: v => v[0] % 2 === 0 && v[1] % 2 === 0, words: () => 'both faces are even' },
      SET_RULE,
    ],
    card: [
      { id: 'red', label: 'red card (♥ or ♦)', test: v => v.color === 'red', words: () => 'the card is red (♥ or ♦)' },
      { id: 'black', label: 'black card (♠ or ♣)', test: v => v.color === 'black', words: () => 'the card is black (♠ or ♣)' },
      { id: 'face', label: 'face card (J, Q, K)', test: v => v.face, words: () => 'the card is a face card (J, Q or K)' },
      { id: 'suit', label: 'suit is …', params: [{ k: 's', def: '♥', options: SUITS, label: 'suit' }], test: (v, q) => v.suit === q.s, words: q => 'the suit is ' + q.s + ' (' + SUITNAME[q.s] + ')' },
      { id: 'rank', label: 'rank is …', params: [{ k: 'r', def: 'K', options: RANKS, label: 'rank' }], test: (v, q) => v.rank === q.r, words: q => 'the rank is ' + q.r },
      { id: 'number', label: 'number card (2 to 10)', test: v => v.r >= 2 && v.r <= 10, words: () => 'the card is a number card (2 to 10)' },
      { id: 'rankLe', label: 'rank ≤ a (A = 1, J = 11, Q = 12, K = 13)', params: [P1('a', 5, 1, 13)], test: (v, q) => v.r <= q.a, words: q => 'the rank is at most ' + q.a + ' (A counts as 1)' },
      SET_RULE,
    ],
    coins: [
      { id: 'hEq', label: 'exactly k heads', params: [P1('k', 2, 0, 'n')], test: (v, q) => nH(v) === q.k, words: q => 'exactly ' + plural(q.k, 'head') },
      { id: 'hGe', label: 'at least k heads', params: [P1('k', 2, 0, 'n')], test: (v, q) => nH(v) >= q.k, words: q => 'at least ' + plural(q.k, 'head') },
      { id: 'hLe', label: 'at most k heads', params: [P1('k', 1, 0, 'n')], test: (v, q) => nH(v) <= q.k, words: q => 'at most ' + plural(q.k, 'head') },
      { id: 'tossH', label: 'toss i is heads', params: [P1('i', 1, 1, 'n')], test: (v, q) => v[q.i - 1] === 'H', words: q => 'toss ' + q.i + ' is heads' },
      { id: 'tossT', label: 'toss i is tails', params: [P1('i', 1, 1, 'n')], test: (v, q) => v[q.i - 1] === 'T', words: q => 'toss ' + q.i + ' is tails' },
      { id: 'same', label: 'all tosses the same', test: v => /^(H+|T+)$/.test(v), words: () => 'all tosses are the same' },
      { id: 'firstLast', label: 'first toss = last toss', test: v => v[0] === v[v.length - 1], words: () => 'the first and last tosses match' },
      SET_RULE,
    ],
    race: [
      { id: 'place', label: 'runner X finishes in place k', params: [{ k: 'r', def: 'A', options: sp => RUNNERS.slice(0, sp.n).split(''), label: 'runner' }, P1('k', 1, 1, 'n')], test: (v, q) => v[q.k - 1] === q.r, words: q => 'runner ' + q.r + ' finishes ' + ordinal(q.k) },
      { id: 'before', label: 'runner X finishes before runner Y', params: [{ k: 'r', def: 'A', options: sp => RUNNERS.slice(0, sp.n).split(''), label: 'runner' }, { k: 'r2', def: 'B', options: sp => RUNNERS.slice(0, sp.n).split(''), label: 'finishes before runner' }], test: (v, q) => v.indexOf(q.r) < v.indexOf(q.r2), words: q => 'runner ' + q.r + ' finishes before runner ' + q.r2 },
      SET_RULE,
    ],
    custom: [SET_RULE],
    given: [
      { id: 'gA', label: 'A (set by your numbers)', test: v => v[0] === '1', words: () => 'A' },
      { id: 'gB', label: 'B (set by your numbers)', test: v => v[1] === '1', words: () => 'B' },
    ],
  };
  const optionsOf = (pd, sp) => (typeof pd.options === 'function' ? pd.options(sp) : pd.options);
  const ruleOf = (kind, id) => RULES[kind].find(r => r.id === id) || RULES[kind][0];
  /** Make an event's parameters valid for this space (clamped, defaults filled). Returns the rule. */
  function normQ(sp, q) {
    const r = ruleOf(sp.kind, q.rule);
    q.rule = r.id;
    (r.params || []).forEach(pd => {
      if (pd.options) { const opts = optionsOf(pd, sp); if (opts.indexOf(q[pd.k]) < 0) q[pd.k] = opts.indexOf(pd.def) >= 0 ? pd.def : opts[0]; return; }
      const hi = pd.max === 'n' ? sp.n : pd.max;
      let v = Math.round(Number(q[pd.k]));
      if (q[pd.k] == null || !Number.isFinite(v)) v = Math.min(pd.def, hi);
      q[pd.k] = Math.max(pd.min, Math.min(hi, v));
    });
    if (!Array.isArray(q.set)) q.set = [];
    return r;
  }
  function members(sp, q) { const r = normQ(sp, q); return sp.outs.map(o => !!r.test(o.v, q, o)); }
  function idsOf(sp, q) { const m = members(sp, q); return sp.outs.filter((o, k) => m[k]).map(o => o.id); }
  /** The outcomes of a mask written as a set {…}. */
  function setList(sp, m, max) {
    const items = sp.outs.filter((o, k) => m[k]);
    if (!items.length) return '∅';
    const shown = max && items.length > max ? items.slice(0, max) : items;
    return '{' + shown.map(o => (o.user ? user(o.short) : esc(o.short))).join(', ') + (shown.length < items.length ? ', … ' + (items.length - shown.length) + ' more' : '') + '}';
  }
  /** An event in words. */
  function evWords(sp, q) {
    const r = normQ(sp, q);
    if (r.id !== 'set') return esc(r.words(q));
    const m = members(sp, q), c = cnt(m);
    return c === 0 ? 'your own set — empty so far (∅)' : c <= 8 ? 'your own set ' + setList(sp, m) : 'your own set of ' + c + ' outcomes';
  }

  /* ======================================================== outcome grid */
  function drawOutcome(sp, o) {
    switch (sp.kind) {
      case 'die': return Lab.draw.die(o.v, { size: 30 });
      case 'dice': return h('span', { class: 's5-dd' }, Lab.draw.die(o.v[0], { size: 17 }), Lab.draw.die(o.v[1], { size: 17 }));
      case 'card': return h('span', { class: 's5-cd' + (o.v.color === 'red' ? ' red' : '') }, o.v.rank, h('small', { text: o.v.suit }));
      case 'coins': return sp.n <= 4 ? h('span', { class: 's5-cc' }, [...o.v].map(c => Lab.draw.coin(c, { size: 16 }))) : h('span', { class: 's5-seq', text: o.v });
      case 'race': return h('span', { class: 's5-seq', text: o.v });
      default: return h('span', { class: 's5-cu' }, h('b', { class: 'no-math', text: o.short }), h('small', { html: tx(pT(o.p)) }));
    }
  }
  /**
   * Every outcome as a tile with membership badges (one per event letter).
   * opts: sp, letters ['A','B'], tones ['a','b'], onTile(o), onHover(o). Returns an element with .paint(mems, hl).
   */
  function outcomeGrid({ sp, letters, tones, onTile, onHover }) {
    const tiles = [];
    const tile = o => {
      const t = h('button', { class: 's5-tile s5-k-' + sp.kind + ((sp.kind === 'coins' && sp.n >= 6) || sp.kind === 'race' ? ' s5-row' : ''), type: 'button', title: o.short + '  ·  P = ' + Lab.fmt(o.p) });
      t.appendChild(drawOutcome(sp, o));
      const bd = h('span', { class: 's5-badges' });
      letters.forEach((L, i) => bd.appendChild(h('i', { class: 'bd-' + tones[i], text: L })));
      t.appendChild(bd);
      if (onTile) t.addEventListener('click', () => onTile(o));
      if (onHover) { t.addEventListener('mouseenter', () => onHover(o)); t.addEventListener('focus', () => onHover(o)); }
      tiles[o.k] = t;
      return t;
    };
    let grid;
    if (sp.kind === 'dice') {
      grid = h('div', { class: 's5-dgrid' });
      grid.appendChild(h('div', { class: 's5-hd s5-corner', html: '1st&nbsp;↓<br>2nd&nbsp;→' }));
      for (let b = 1; b <= 6; b++) grid.appendChild(h('div', { class: 's5-hd', text: String(b) }));
      for (let a = 1; a <= 6; a++) {
        grid.appendChild(h('div', { class: 's5-hd', text: String(a) }));
        for (let b = 1; b <= 6; b++) grid.appendChild(tile(sp.outs[(a - 1) * 6 + (b - 1)]));
      }
    } else if (sp.kind === 'card') {
      grid = h('div', { class: 's5-cgrid' });
      grid.appendChild(h('div', { class: 's5-hd' }));
      RANKS.forEach(r => grid.appendChild(h('div', { class: 's5-hd', text: r })));
      SUITS.forEach((s, si) => {
        grid.appendChild(h('div', { class: 's5-hd' + (si === 1 || si === 2 ? ' red' : ''), text: s }));
        RANKS.forEach((r, ri) => grid.appendChild(tile(sp.outs[si * 13 + ri])));
      });
    } else {
      grid = h('div', { class: 's5-fgrid' });
      sp.outs.forEach(o => grid.appendChild(tile(o)));
    }
    const wrap = h('div', { class: 's5-gscroll' + (sp.N > 128 ? ' s5-tall' : '') }, grid);
    wrap.paint = (mems, hl) => {
      tiles.forEach((t, k) => {
        const bd = t.lastChild.children;
        mems.forEach((m, i) => { if (bd[i]) bd[i].classList.toggle('on', !!(m && m[k])); });
        t.classList.toggle('hl', !!(hl && hl[k]));
      });
    };
    return wrap;
  }

  /* ========================================================= Venn diagram */
  function lensArea(d, r1, r2) {
    if (r1 <= 0 || r2 <= 0 || d >= r1 + r2) return 0;
    if (d <= Math.abs(r1 - r2)) return Math.PI * Math.min(r1, r2) ** 2;
    const a1 = Math.acos(Math.max(-1, Math.min(1, (d * d + r1 * r1 - r2 * r2) / (2 * d * r1))));
    const a2 = Math.acos(Math.max(-1, Math.min(1, (d * d + r2 * r2 - r1 * r1) / (2 * d * r2))));
    const k = Math.sqrt(Math.max(0, (-d + r1 + r2) * (d + r1 - r2) * (d - r1 + r2) * (d + r1 + r2)));
    return r1 * r1 * a1 + r2 * r2 * a2 - k / 2;
  }
  /** Distance between centres so that the two circles share exactly area T. */
  function solveDist(r1, r2, T) {
    if (r1 <= 1e-12 || r2 <= 1e-12) return r1 + r2 + 0.05;
    const full = Math.PI * Math.min(r1, r2) ** 2;
    if (T <= 1e-12) return (r1 + r2) * 1.06 + 0.03;
    if (T >= full * (1 - 1e-9)) return Math.abs(r1 - r2) * 0.5;
    let lo = Math.abs(r1 - r2), hi = r1 + r2;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (lensArea(mid, r1, r2) > T) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  /** Circles in "probability units" (area of S = 1). ps = [pA, pB, pC?], pairs = {AB, AC, BC}. */
  function vennLayout(ps, pairs) {
    const r = ps.map(p => Math.sqrt(Math.max(0, p) / Math.PI));
    const c = [{ x: 0, y: 0, r: r[0] }];
    const dAB = solveDist(r[0], r[1], pairs.AB);
    c.push({ x: dAB, y: 0, r: r[1] });
    let approxPos = false;
    if (ps.length === 3) {
      const dAC = solveDist(r[0], r[2], pairs.AC), dBC = solveDist(r[1], r[2], pairs.BC);
      let x, y;
      if (dAB < 1e-9) { x = 0; y = dAC; if (Math.abs(dAC - dBC) > 1e-6) approxPos = true; }
      else {
        x = (dAC * dAC - dBC * dBC + dAB * dAB) / (2 * dAB);
        const yy = dAC * dAC - x * x;
        if (yy < -1e-9) approxPos = true;
        y = Math.sqrt(Math.max(0, yy));
      }
      c.push({ x, y, r: r[2] });
    }
    return { c, approxPos };
  }
  const regionCodes = n => (n === 2 ? ['10', '11', '01', '00'] : ['100', '110', '111', '101', '001', '011', '010', '000']);
  const regionTex = (code, L) => [...code].map((b, i) => L[i] + (b === '1' ? '' : '^c')).join('\\cap ');
  function regionWords(code, L) {
    const ins = L.filter((_, i) => code[i] === '1'), outs = L.filter((_, i) => code[i] === '0');
    if (!ins.length) return L.length === 2 ? 'neither ' + L[0] + ' nor ' + L[1] : 'none of ' + L.join(', ');
    if (!outs.length) return L.length === 2 ? 'both ' + L[0] + ' and ' + L[1] : 'all three';
    if (L.length === 2) return ins[0] + ' but not ' + outs[0];
    return ins.length === 1 ? ins[0] + ' only' : ins.join(' and ') + ' but not ' + outs[0];
  }
  /**
   * Area-proportional Venn diagram.
   * opts: ps (numbers), pairs {AB, AC, BC}, regions {code: {n, p, ptxt}}, letters, tones, hl (array of codes), onPick(code), onHover(code|null),
   * counts (default true: each region shows its number of outcomes above its probability; false: the probability only).
   * Returns {el, toScale, approxPos, missing: [codes with outcomes but no drawn area]}.
   */
  function venn({ ps, pairs, regions, letters, tones, hl, onPick, onHover, counts = true }) {
    const { c, approxPos } = vennLayout(ps, pairs);
    const live = c.filter(ci => ci.r > 1e-9);
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    if (live.length) {
      minX = Math.min(...live.map(ci => ci.x - ci.r)); maxX = Math.max(...live.map(ci => ci.x + ci.r));
      minY = Math.min(...live.map(ci => ci.y - ci.r)); maxY = Math.max(...live.map(ci => ci.y + ci.r));
    }
    const m = 0.025, bw = maxX - minX + 2 * m, bh = maxY - minY + 2 * m;
    let W = Math.sqrt(1.75), H = 1 / W, toScale = true;
    if (W < bw) { W = bw; H = 1 / W; }
    if (H < bh) { H = bh; W = 1 / H; }
    if (W < bw - 1e-9) { toScale = false; W = Math.max(bw, bh * 1.35); H = bh; }
    const rx = (minX + maxX) / 2 - W / 2, ry = (minY + maxY) / 2 - H / 2;
    const VW = 640, pad = 10;
    let s = (VW - 2 * pad) / W;
    if (H * s > 380) s = 380 / H;
    const VH = Math.round(H * s + 2 * pad), ox = (VW - W * s) / 2;
    const X = u => ox + (u - rx) * s, Y = u => pad + (u - ry) * s;
    const inside = (i, ux, uy) => c[i].r > 1e-9 && (ux - c[i].x) ** 2 + (uy - c[i].y) ** 2 <= c[i].r * c[i].r;
    const codeAt = (ux, uy) => c.map((_, i) => (inside(i, ux, uy) ? '1' : '0')).join('');
    // label spots: the sample point of each region farthest from every edge
    const best = {}, area = {};
    const step = W / 120;
    for (let ux = rx + step / 2; ux < rx + W; ux += step) {
      for (let uy = ry + step / 2; uy < ry + H; uy += step) {
        const code = codeAt(ux, uy);
        let cl = Math.min(ux - rx, rx + W - ux, uy - ry, ry + H - uy);
        for (const ci of c) if (ci.r > 1e-9) cl = Math.min(cl, Math.abs(Math.hypot(ux - ci.x, uy - ci.y) - ci.r));
        area[code] = (area[code] || 0) + 1;
        if (!best[code] || cl > best[code].cl) best[code] = { ux, uy, cl };
      }
    }
    const uid = Lab.uid('s5v');
    const el = svg('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 's5-venn', role: 'img', 'aria-label': 'Venn diagram of the events ' + letters.join(', ') });
    const defs = svg('defs');
    el.appendChild(defs);
    c.forEach((ci, i) => { const cp = svg('clipPath', { id: uid + 'c' + i }); cp.appendChild(svg('circle', { cx: X(ci.x), cy: Y(ci.y), r: Math.max(0, ci.r * s) })); defs.appendChild(cp); });
    el.appendChild(svg('rect', { x: X(rx), y: Y(ry), width: W * s, height: H * s, rx: 10, class: 'vS' }));
    c.forEach((ci, i) => { if (ci.r > 1e-9) el.appendChild(svg('circle', { cx: X(ci.x), cy: Y(ci.y), r: ci.r * s, class: 'vfill ' + tones[i] })); });
    (hl || []).forEach(code => {
      const mid = uid + 'm' + code;
      const mask = svg('mask', { id: mid, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: VW, height: VH });
      mask.appendChild(svg('rect', { x: 0, y: 0, width: VW, height: VH, fill: '#fff' }));
      [...code].forEach((b, i) => { if (b === '0' && c[i].r > 1e-9) mask.appendChild(svg('circle', { cx: X(c[i].x), cy: Y(c[i].y), r: c[i].r * s, fill: '#000' })); });
      defs.appendChild(mask);
      let node = svg('rect', { x: X(rx), y: Y(ry), width: W * s, height: H * s, rx: 10, class: 'vhl' });
      [...code].forEach((b, i) => { if (b === '1') { const g = svg('g', { 'clip-path': 'url(#' + uid + 'c' + i + ')' }); g.appendChild(node); node = g; } });
      const g = svg('g', { mask: 'url(#' + mid + ')' });
      g.appendChild(node);
      el.appendChild(g);
    });
    c.forEach((ci, i) => { if (ci.r > 1e-9) el.appendChild(svg('circle', { cx: X(ci.x), cy: Y(ci.y), r: ci.r * s, class: 'vline ' + tones[i] })); });
    const missing = [];
    Object.keys(regions).forEach(code => {
      const R = regions[code], b = best[code];
      const has = counts ? R.n > 0 : Number(R.p) > 0;
      if (!b || (area[code] || 0) < 3) { if (has) missing.push(code); return; }
      const px = b.cl * s, x = X(b.ux), y = Y(b.uy);
      if (!counts) {
        if (px >= 6) el.appendChild(svg('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'vlab2' + (px >= 15 ? '' : ' sm') }, R.ptxt));
        else if (has) missing.push(code);
      } else if (px >= 15) {
        el.appendChild(svg('text', { x, y: y - 1, 'text-anchor': 'middle', class: 'vlab' }, String(R.n)));
        el.appendChild(svg('text', { x, y: y + 13, 'text-anchor': 'middle', class: 'vlab2' }, R.ptxt));
      } else if (px >= 6) el.appendChild(svg('text', { x, y: y + 4, 'text-anchor': 'middle', class: 'vlab2 sm' }, String(R.n)));
      else if (has) missing.push(code);
    });
    // event letters, pushed outwards from the middle of the picture (and a little upwards)
    const cx0 = live.length ? live.reduce((a, ci) => a + ci.x, 0) / live.length : 0;
    const cy0 = live.length ? live.reduce((a, ci) => a + ci.y, 0) / live.length : 0;
    c.forEach((ci, i) => {
      if (ci.r <= 1e-9) return;
      let dx = ci.x - cx0, dy = ci.y - cy0;
      const len = Math.hypot(dx, dy);
      if (len < 1e-6) { dx = [-1, 1, 0][i]; dy = [0, 0, 1][i]; } else { dx /= len; dy /= len; }
      if (dy <= 0.2) { dx *= 0.75; dy = dy * 0.75 - 0.66; }
      const l2 = Math.hypot(dx, dy) || 1;
      dx /= l2; dy /= l2;
      let x = X(ci.x) + dx * (ci.r * s + 13), y = Y(ci.y) + dy * (ci.r * s + 13);
      x = Math.max(X(rx) + 14, Math.min(X(rx + W) - 14, x));
      y = Math.max(Y(ry) + 18, Math.min(Y(ry + H) - 8, y));
      el.appendChild(svg('text', { x, y: y + 6, 'text-anchor': 'middle', class: 'vname ' + tones[i] }, letters[i]));
    });
    el.appendChild(svg('text', { x: X(rx) + 10, y: Y(ry) + 20, class: 'vSname' }, 'S'));
    // pointer: which region is under the mouse (computed from the circles, so masks never get in the way)
    // (box and pointer are both read in viewport pixels, so this stays right when the page text size is zoomed)
    const toUnit = ev => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      const qx = (ev.clientX - r.left) / r.width * VW, qy = (ev.clientY - r.top) / r.height * VH;
      const ux = rx + (qx - ox) / s, uy = ry + (qy - pad) / s;
      return ux >= rx && ux <= rx + W && uy >= ry && uy <= ry + H ? { ux, uy } : null;
    };
    el.addEventListener('click', ev => { const u = toUnit(ev); if (u && onPick) onPick(codeAt(u.ux, u.uy)); });
    let last = null;
    el.addEventListener('mousemove', ev => { const u = toUnit(ev); const code = u ? codeAt(u.ux, u.uy) : null; if (code !== last) { last = code; if (onHover) onHover(code); } });
    el.addEventListener('mouseleave', () => { last = null; if (onHover) onHover(null); });
    return { el, toScale, approxPos, missing, pick: onPick, hover: onHover };
  }
  /** What the Venn picture gets right, in plain words. */
  function vennCaption(V, n, counts = true) {
    let t = V.toScale
      ? (n === 2 ? 'To scale: the rectangle ' + tx('S') + ' has area 1 and every region’s area is its probability.' : 'To scale: the rectangle ' + tx('S') + ' has area 1, and each circle and each overlap of two circles has the right area. How those overlaps split into the 7 inner regions is approximate — three circles cannot match every region at once.')
      : 'The circles and their overlap' + (n === 2 ? '' : 's') + ' are to scale with each other, but circles this large cannot fit inside a rectangle of area 1, so ' + tx('S') + ' is drawn larger than to scale. The bar under the picture is always to scale.';
    if (V.approxPos) t += ' (The three pairwise overlaps cannot all be drawn exactly here.)';
    t += ' Each region shows ' + (counts ? 'its number of outcomes and ' : '') + 'its probability; click a region, a bar piece or a table row to highlight it.';
    if (V.missing.length) t += ' Regions with no room in the picture are still listed in the table.';
    return t;
  }
  /**
   * Linear diagram (always to scale): S is a bar of length 1, cut into the regions; one row per event shows where it holds.
   * opts: codes (in order), regions {code: {n, p, ptxt}}, letters, tones, hl (codes), onPick(code), onHover(code|null)
   */
  function linearBar({ codes, regions, letters, tones, hl, onPick, onHover }) {
    const VW = 640, x0 = 30, x1 = VW - 8, top = 6, barH = 28, rowH = 13, gap = 5;
    const VH = top + barH + 8 + letters.length * (rowH + gap) + 22;
    const el = svg('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 's5-lin', role: 'img', 'aria-label': 'bar of length 1 split into the regions' });
    const total = codes.reduce((a, c) => a + Number(regions[c].p), 0) || 1;
    let x = x0;
    el.appendChild(svg('text', { x: 4, y: top + barH / 2 + 5, class: 'lnS' }, 'S'));
    letters.forEach((L, i) => el.appendChild(svg('text', { x: 6, y: top + barH + 8 + i * (rowH + gap) + rowH - 2, class: 'lnL ' + tones[i] }, L)));
    codes.forEach(code => {
      const R = regions[code], w = (Number(R.p) / total) * (x1 - x0);
      if (w <= 0) return;
      const g = svg('g', { class: 'lnseg' });
      g.appendChild(svg('rect', { x, y: top, width: w, height: barH, class: 'lnbar' + ((hl || []).indexOf(code) >= 0 ? ' on' : '') }));
      if (w >= 34) g.appendChild(svg('text', { x: x + w / 2, y: top + barH / 2 + 4, 'text-anchor': 'middle', class: 'lnp' }, R.ptxt));
      letters.forEach((L, i) => { if (code[i] === '1') g.appendChild(svg('rect', { x: x + 0.5, y: top + barH + 8 + i * (rowH + gap), width: Math.max(0, w - 1), height: rowH, rx: 3, class: 'lnrow ' + tones[i] })); });
      g.appendChild(svg('rect', { x, y: top, width: w, height: VH - top - 18, class: 'lnhit' }));
      if (onPick) g.addEventListener('click', () => onPick(code));
      if (onHover) { g.addEventListener('mouseenter', () => onHover(code)); g.addEventListener('mouseleave', () => onHover(null)); }
      el.appendChild(g);
      x += w;
    });
    const ay = VH - 12;
    el.appendChild(svg('line', { x1: x0, x2: x1, y1: ay, y2: ay, class: 'lnaxis' }));
    [0, 0.25, 0.5, 0.75, 1].forEach(v => {
      const xx = x0 + v * (x1 - x0);
      el.appendChild(svg('line', { x1: xx, x2: xx, y1: ay - 3, y2: ay + 3, class: 'lnaxis' }));
      el.appendChild(svg('text', { x: xx, y: ay + 11, 'text-anchor': v === 0 ? 'start' : v === 1 ? 'end' : 'middle', class: 'lntick' }, String(v)));
    });
    return el;
  }

  /* ===================================================== event controls */
  /** Controls for one event: rule menu + parameters. q is mutated; onChange() after every edit. */
  function eventBox({ sp, L, tone, q, onChange }) {
    const box = h('div', { class: 's5-evbox s5-' + tone });
    const sel = h('select', { class: 'field pl-select', 'aria-label': 'event ' + L });
    RULES[sp.kind].forEach(r => sel.appendChild(h('option', { value: r.id, text: r.label })));
    normQ(sp, q);
    sel.value = q.rule;
    const pbox = h('div', { class: 's5-evparams' });
    const info = h('div', { class: 'pl-hint s5-evinfo' });
    box.append(h('div', { class: 's5-evrow' }, h('b', { class: 's5-evL', text: L }), h('span', { class: 's5-eq', text: '=' }), sel), pbox, info);
    function params() {
      Lab.clear(pbox);
      const r = normQ(sp, q);
      (r.params || []).forEach(pd => {
        if (pd.options) {
          pbox.appendChild(K.selectField({ label: pd.label, options: optionsOf(pd, sp).map(o => ({ value: o, label: o })), value: q[pd.k], onChange: v => { q[pd.k] = v; onChange(); } }));
        } else {
          const hi = pd.max === 'n' ? sp.n : pd.max;
          pbox.appendChild(K.numField({ label: 'Your ' + tx(pd.k), min: pd.min, max: hi, value: q[pd.k], onChange: v => { q[pd.k] = v; onChange(); } }));
        }
      });
      pbox.hidden = !(r.params && r.params.length);
    }
    sel.addEventListener('change', () => { if (sel.value === 'set' && q.rule !== 'set') q.set = idsOf(sp, q); q.rule = sel.value; params(); onChange(); });
    params();
    box.sync = () => { sel.value = q.rule; params(); };
    box.info = html => Lab.setHTML(info, html);
    return box;
  }

  /* exported for the Week 8 lab (independent vs disjoint) */
  K.s1ev = { SPACE_OPTS, makeSpace, spaceWhy, RULES, ruleOf, normQ, members, idsOf, setList, evWords, outcomeGrid, venn, vennCaption, linearBar, regionCodes, regionTex, regionWords, eventBox, texText, user, fr, frRed, approx, cnt, prob };

  /* ================================================================= LAB */
  const KEY = 'lab:lab-s1-events';
  const L3 = ['A', 'B', 'C'], T3 = ['a', 'b', 'c'];
  const SPACE_KEYS = SPACE_OPTS.map(o => o.value);
  const defaultRows = () => [{ id: 1, name: 'Red', p: '1/2' }, { id: 2, name: 'Blue', p: '1/4' }, { id: 3, name: 'Green', p: '1/8' }, { id: 4, name: 'Yellow', p: '1/8' }];
  const defaultEvs = () => ({
    die: { A: { rule: 'even' }, B: { rule: 'ge', a: 4 }, C: { rule: 'prime' } },
    dice: { A: { rule: 'sumEven' }, B: { rule: 'atLeast', a: 6 }, C: { rule: 'doubles' } },
    card: { A: { rule: 'red' }, B: { rule: 'face' }, C: { rule: 'rank', r: 'A' } },
    coins: { A: { rule: 'hGe', k: 2 }, B: { rule: 'tossH', i: 1 }, C: { rule: 'same' } },
    custom: { A: { rule: 'set', set: ['c1', 'c2'] }, B: { rule: 'set', set: ['c2', 'c3'] }, C: { rule: 'set', set: ['c4'] } },
    race: { A: { rule: 'place', r: 'A', k: 1 }, B: { rule: 'place', r: 'B', k: 2 }, C: { rule: 'before', r: 'C', r2: 'D' } },
    given: { A: { rule: 'gA' }, B: { rule: 'gB' }, C: { rule: 'gA' } },
  });
  const defaultGiven = () => ({ nameA: 'buys a shirt', nameB: 'buys a pant', pA: '0.3', pB: '0.2', third: 'and', p3: '0.1' });
  const defaults = () => ({ space: 'dice', n: 3, nr: 6, rows: defaultRows(), given: defaultGiven(), evs: defaultEvs(), useC: false, click: 'A', show: 'AuB', track: 'A' });
  function loadState() {
    const d = defaults();
    const s = Lab.store.get(KEY, null);
    if (!s || typeof s !== 'object') return d;
    const st = Object.assign(d, s);
    const de = defaultEvs();
    st.evs = Object.assign(de, s.evs && typeof s.evs === 'object' ? s.evs : {});
    SPACE_KEYS.forEach(k => {
      const fresh = defaultEvs()[k];
      if (!st.evs[k] || typeof st.evs[k] !== 'object') st.evs[k] = fresh;
      L3.forEach(L => { if (!st.evs[k][L] || typeof st.evs[k][L] !== 'object') st.evs[k][L] = fresh[L]; });
    });
    if (!Array.isArray(st.rows) || !st.rows.length || st.rows.some(r => !r || r.id == null)) st.rows = defaultRows();
    if (SPACE_KEYS.indexOf(st.space) < 0) st.space = 'dice';
    st.n = Math.max(1, Math.min(8, Math.round(Number(st.n)) || 3));
    st.nr = Math.max(3, Math.min(6, Math.round(Number(st.nr)) || 6));
    const g = st.given;
    if (!g || typeof g !== 'object' || ['and', 'or', 'indep'].indexOf(g.third) < 0 || ['nameA', 'nameB', 'pA', 'pB', 'p3'].some(k => typeof g[k] !== 'string')) st.given = defaultGiven();
    return st;
  }
  /**
   * Read the given-probabilities mode: P(A), P(B) and one more fact — P(A ∩ B), P(A ∪ B), or "A and B are independent".
   * Returns {ok, msg} or {ok, pA, pB, pAB, pU, third, dec}; dec is true when every typed number is a decimal.
   */
  function parseGiven(G) {
    const pA = K.parseProb(G.pA), pB = K.parseProb(G.pB);
    if (!pA || !pB) return { ok: false, msg: 'Type ' + tx('P(A)') + ' and ' + tx('P(B)') + ' as numbers from 0 to 1 (for example 0.3, 3/10 or 30%).' };
    let pAB, pU;
    if (G.third === 'indep') { pAB = pA.mul(pB); pU = pA.add(pB).sub(pAB); }
    else {
      const p3 = K.parseProb(G.p3);
      if (!p3) return { ok: false, msg: 'Type the third number as a probability from 0 to 1.' };
      if (G.third === 'or') { pU = p3; pAB = pA.add(pB).sub(pU); } else { pAB = p3; pU = pA.add(pB).sub(pAB); }
    }
    if (G.third === 'and' && Number(pAB) > Math.min(Number(pA), Number(pB)) + 1e-12) return { ok: false, msg: tx('P(A\\cap B)') + ' cannot be bigger than ' + tx('P(A)') + ' or ' + tx('P(B)') + ': ' + tx('A\\cap B') + ' lies inside both.' };
    if (G.third === 'or' && Number(pU) < Math.max(Number(pA), Number(pB)) - 1e-12) return { ok: false, msg: tx('P(A\\cup B)') + ' cannot be smaller than ' + tx('P(A)') + ' or ' + tx('P(B)') + ': both lie inside ' + tx('A\\cup B') + '.' };
    if (Number(pAB) < -1e-12) return { ok: false, msg: tx('P(A\\cup B)') + ' cannot be bigger than ' + tx('P(A)+P(B)') + ' — the overlap ' + tx('P(A\\cap B)') + ' would be negative.' };
    if (Number(pU) > 1 + 1e-12) return { ok: false, msg: tx('P(A)+P(B)-P(A\\cap B)') + ' comes to more than 1, so ' + tx('P(A\\cup B)') + ' would break Axiom 1. Lower a number.' };
    const typed = [G.pA, G.pB].concat(G.third === 'indep' ? [] : [G.p3]);
    return { ok: true, pA, pB, pAB, pU, third: G.third, dec: typed.every(t => !/\//.test(String(t))) };
  }
  const THIRD_OPTS = [{ value: 'and', label: 'P(A ∩ B) — both happen' }, { value: 'or', label: 'P(A ∪ B) — at least one happens' }, { value: 'indep', label: 'A and B are independent' }];
  /** Read the learner's outcome rows. ok only when names are distinct and probabilities are valid and total 1. */
  function parseRows(rows) {
    const names = rows.map(r => String(r.name == null ? '' : r.name).trim());
    const ps = rows.map(r => K.parseNum(r.p));
    const bad = ps.map(p => p == null || Number(p) < 0 || Number(p) > 1);
    let msg = '';
    if (names.some(n => !n)) msg = 'Give every outcome a name.';
    else if (new Set(names).size !== names.length) msg = 'Each outcome needs a different name.';
    else if (bad.some(Boolean)) msg = 'Fix the red boxes: each probability is a number from 0 to 1 (for example 1/6, 0.25 or 25%).';
    const total = bad.some(Boolean) ? null : F.sum(ps);
    if (!msg && !total.eq(1)) msg = 'Your probabilities add up to ' + tx(pT(total)) + ', not 1. Axiom 2 needs ' + tx('P(S)=1') + ': press “Rescale to total 1” or edit a box.';
    return { ok: !msg, msg, bad, total, rows: msg ? null : rows.map((r, k) => ({ id: r.id, name: names[k], p: ps[k] })) };
  }

  /* The professor's examples come first (sources: the Week 7 lectures and tutorials; the YouTube playlist calls this week W6). */
  const LEC = {
    defs: 'Lecture: Probability – basic definitions',
    ops: 'Lecture: Probability – events & basic operations on events',
    rss: 'Lecture: Probability – random experiment, sample space, events',
    props: 'Lecture: Probability – properties of probability',
  };
  const coins2 = (st, A, B, show) => { st.space = 'coins'; st.n = 2; st.useC = false; st.evs.coins = { A, B, C: { rule: 'same' } }; st.show = show; };
  const givenPreset = (st, g, show) => { st.space = 'given'; st.useC = false; st.given = Object.assign(defaultGiven(), g); st.show = show; };
  const PRESETS = [
    { label: 'Lecture · One die: odd {1, 3, 5} vs even {2, 4, 6}', source: LEC.ops + ', at 01:50 (E = {1, 3, 5}, F = {2, 4, 6}); ' + LEC.props + ', at 19:30 (they are disjoint, so P(E₁ ∪ E₂) = 3/6 + 3/6 = 1) and at 05:00 (even: 3/6 = 1/2). Here A = odd, B = even.',
      apply: st => { st.space = 'die'; st.useC = false; st.evs.die = { A: { rule: 'odd' }, B: { rule: 'even' }, C: { rule: 'prime' } }; st.show = 'AuB'; } },
    { label: 'Lecture · Two coins: head on 1st toss vs head on 2nd toss', source: LEC.ops + ', at 11:50 (union E₁ ∪ E₂ = {HH, HT, TH}) and 15:10 (intersection E₁ ∩ E₂ = {HH}); ' + LEC.rss + ', at 17:20–18:40 (the same events in a Venn diagram: E = {HH, HT}, F = {HH, TH}, E ∩ F = {HH}).',
      apply: st => coins2(st, { rule: 'tossH', i: 1 }, { rule: 'tossH', i: 2 }, 'AnB') },
    { label: 'Lecture · Two coins: {HH} and {TT} are disjoint', source: LEC.rss + ', at 19:20 (Venn diagram of disjoint events E = {HH}, F = {TT}).',
      apply: st => coins2(st, { rule: 'set', set: ['HH'] }, { rule: 'set', set: ['TT'] }, 'AnB') },
    { label: 'Lecture · Two coins: {HH} inside {HH, HT} (subset)', source: LEC.ops + ', at 22:30 and ' + LEC.rss + ', at 20:00 (E = head in both tosses = {HH} ⊂ F = head in the first toss = {HH, HT}).',
      apply: st => coins2(st, { rule: 'set', set: ['HH'] }, { rule: 'tossH', i: 1 }, 'BmA') },
    { label: 'Lecture · Two coins: at least one head, and its complement', source: LEC.ops + ', at 20:30 (E = at least one head = {HH, HT, TH}, Eᶜ = both tails = {TT}). Here A = E and B = Eᶜ.',
      apply: st => coins2(st, { rule: 'hGe', k: 1 }, { rule: 'hEq', k: 0 }, 'Ac') },
    { label: 'Lecture · One coin: heads vs tails, and relative frequency', source: LEC.ops + ', at 17:30 (E = {H}, F = {T}, E ∩ F = ∅) and 19:30 (Eᶜ = {T}); ' + LEC.props + ', at 07:00–11:00 (relative frequency: 10 heads in 20 tosses; 469 heads in 1,000 tosses). Run the simulation below.',
      apply: st => { st.space = 'coins'; st.n = 1; st.useC = false; st.evs.coins = { A: { rule: 'tossH', i: 1 }, B: { rule: 'tossT', i: 1 }, C: { rule: 'same' } }; st.show = 'AuB'; st.track = 'A'; } },
    { label: 'Lecture · Guessing a 4-option question: answer a vs answer b', source: LEC.defs + ', at 13:00 (S = {a, b, c, d}); ' + LEC.ops + ', at 07:50 (E₁ = {a}, E₂ = {b}, E₁ ∪ E₂ = {a, b}) and 18:30 (E₁ ∩ E₂ = ∅: mutually exclusive). A pure guess makes the four options equally likely.',
      apply: st => { st.space = 'custom'; st.useC = false; st.rows = ['a', 'b', 'c', 'd'].map((x, k) => ({ id: k + 1, name: x, p: '1/4' })); st.evs.custom = { A: { rule: 'set', set: ['c1'] }, B: { rule: 'set', set: ['c2'] }, C: { rule: 'set', set: ['c3'] } }; st.show = 'AuB'; } },
    { label: 'Lecture · Race of six: A finishes first vs B comes second', source: LEC.defs + ', at 13:30 (S = every order of finish of six students A, B, C, D, E, F); ' + LEC.ops + ', at 08:30 (E₁ = A first: 5! = 120 orders; E₂ = B second: 5! = 120; E₁ ∪ E₂) and 14:30 (E₁ ∩ E₂ = A first and B second: 4! = 24 orders), out of 6! = 720.',
      apply: st => { st.space = 'race'; st.nr = 6; st.useC = false; st.evs.race = { A: { rule: 'place', r: 'A', k: 1 }, B: { rule: 'place', r: 'B', k: 2 }, C: { rule: 'before', r: 'C', r2: 'D' } }; st.show = 'AnB'; } },
    { label: 'Lecture · One card: king, heart, king of hearts', source: LEC.rss + ', at 04:00–08:00 (E = king of hearts, F = king, G = heart; F ∪ G = king or heart; F ∩ G = {K♥} = E); ' + LEC.props + ', at 25:30–27:30 (E₁ = king of hearts: 1 card, E₂ = hearts: 13, E₃ = kings: 4; “a heart or a king” needs the addition rule because E₂ and E₃ share the king of hearts). Here A = king, B = heart, C = king of hearts.',
      apply: st => { st.space = 'card'; st.useC = true; st.evs.card = { A: { rule: 'rank', r: 'K' }, B: { rule: 'suit', s: '♥' }, C: { rule: 'set', set: ['K♥'] } }; st.show = 'AuB'; } },
    { label: 'Lecture · One card: heart vs ace — not mutually exclusive', source: LEC.rss + ', at 09:20–11:20 (G = heart, H = ace: both contain the ace of hearts, so they are not mutually exclusive).',
      apply: st => { st.space = 'card'; st.useC = false; st.evs.card = { A: { rule: 'suit', s: '♥' }, B: { rule: 'rank', r: 'A' }, C: { rule: 'face' } }; st.show = 'AnB'; } },
    { label: 'Lecture · One card: king vs queen — mutually exclusive', source: LEC.rss + ', at 12:00 (F = king, I = queen: no card is both, so they are mutually exclusive).',
      apply: st => { st.space = 'card'; st.useC = false; st.evs.card = { A: { rule: 'rank', r: 'K' }, B: { rule: 'rank', r: 'Q' }, C: { rule: 'face' } }; st.show = 'AnB'; } },
    { label: 'Lecture · Shirts and pants: P(S) = 0.3, P(P) = 0.2, both 0.1', source: LEC.props + ', at 36:30–44:30 (neither a shirt nor a pant: 1 − (0.3 + 0.2 − 0.1) = 0.6).',
      apply: st => givenPreset(st, { nameA: 'buys a shirt', nameB: 'buys a pant', pA: '0.3', pB: '0.2', third: 'and', p3: '0.1' }, 'none') },
    { label: 'Lecture · Subject grades: 0.4, 0.6, either 0.86', source: LEC.props + ', at 45:30–52:30 (P(S) = 0.4, P(M) = 0.6, P(S ∪ M) = 0.86, so neither = 0.14 and both = 0.4 + 0.6 − 0.86 = 0.14).',
      apply: st => givenPreset(st, { nameA: 'gets an A in statistics', nameB: 'gets an A in mathematics', pA: '0.4', pB: '0.6', third: 'or', p3: '0.86' }, 'none') },
    { label: 'Tutorial · Feedback forms: Mary gets one, Asad does not', source: 'Tutorial (Week 7, no. 4), at 00:00–01:00: 1,000 of 30,000 students get a feedback form; P(Mary gets one) = 1000/30000 = 1/30, P(Asad does not) = 29000/30000 = 29/30, and the tutorial multiplies them: 1/30 × 29/30 = 29/900 ≈ 0.0322. Multiplying treats the two students as independent; strictly, once Mary has a form only 999 of the other 29,999 students get one, so the exact answer is 1/30 × 29000/29999 ≈ 0.032223 — almost the same as 29/900 ≈ 0.032222.',
      apply: st => givenPreset(st, { nameA: 'Mary gets a form', nameB: 'Asad does not get a form', pA: '1/30', pB: '29/30', third: 'indep', p3: '29/900' }, 'AnB') },
    { label: 'Tutorial · Venn: P(C) = 0.3, P(A ∪ B) = 0.6, P(A ∪ B ∪ C) = 0.8', source: 'Tutorial (Week 7, no. 5), at 00:00–04:30: P((A ∪ B)ᶜ ∩ C) = 0.8 − 0.6 = 0.2. In this lab A stands for the tutorial’s A ∪ B and B for its C, so the answer is the region “B but not A”.',
      apply: st => givenPreset(st, { nameA: 'in A ∪ B (the tutorial’s union)', nameB: 'in C', pA: '0.6', pB: '0.3', third: 'or', p3: '0.8' }, 'BmA') },
    { label: 'Tutorial · Independent A, B: P(A) = 0.8, P(Bᶜ) = 0.4', source: 'Tutorial (Week 8, no. 2), at 00:00–02:00: P(B) = 1 − 0.4 = 0.6, P(A ∩ B) = 0.8 × 0.6 = 0.48, P(A ∪ B) = 0.8 + 0.6 − 0.48 = 0.92.',
      apply: st => givenPreset(st, { nameA: 'A happens', nameB: 'B happens', pA: '0.8', pB: '0.6', third: 'indep', p3: '0.48' }, 'AuB') },
    { label: 'Own example · One die: even vs at least 4', source: 'This lab’s own example (Week 7 notes, “Equally likely”: a fair die gives each face 1/6).',
      apply: st => { st.space = 'die'; st.useC = false; st.evs.die = { A: { rule: 'even' }, B: { rule: 'ge', a: 4 }, C: { rule: 'prime' } }; st.show = 'AnB'; } },
    { label: 'Own example · Two dice: sum is 7 vs doubles (mutually exclusive)', source: 'This lab’s own example: a sum of 7 is odd while doubles always have an even sum, so the events cannot happen together.',
      apply: st => { st.space = 'dice'; st.useC = false; st.evs.dice = { A: { rule: 'sumEq', s: 7 }, B: { rule: 'doubles' }, C: { rule: 'atLeast', a: 6 } }; st.show = 'AuB'; } },
    { label: 'Own example · Two dice: sum even, a 6, doubles (three events)', source: 'This lab’s own example, for the three-event addition rule (inclusion–exclusion).',
      apply: st => { st.space = 'dice'; st.useC = true; st.evs.dice = { A: { rule: 'sumEven' }, B: { rule: 'atLeast', a: 6 }, C: { rule: 'doubles' } }; st.show = 'AuBuC'; } },
    { label: 'Own example · One card: red vs face card', source: 'This lab’s own example (Week 7 notes: a shuffled card gives each card 1/52).',
      apply: st => { st.space = 'card'; st.useC = false; st.evs.card = { A: { rule: 'red' }, B: { rule: 'face' }, C: { rule: 'rank', r: 'A' } }; st.show = 'AnB'; } },
    { label: 'Own example · Three coins: at least 2 heads vs toss 1 is heads', source: 'This lab’s own example (Week 7 notes: a fair coin gives each side 1/2).',
      apply: st => { st.space = 'coins'; st.n = 3; st.useC = false; st.evs.coins = { A: { rule: 'hGe', k: 2 }, B: { rule: 'tossH', i: 1 }, C: { rule: 'same' } }; st.show = 'AuB'; } },
    { label: 'Own example · Spinner with unequal sectors (not equally likely)', source: 'This lab’s own example. Week 7 notes: |E|/|S| “fails if outcomes are not equally likely” — compare it with the true sum here.',
      apply: st => { st.space = 'custom'; st.useC = false; st.rows = defaultRows(); st.evs.custom = { A: { rule: 'set', set: ['c1', 'c2'] }, B: { rule: 'set', set: ['c2', 'c3'] }, C: { rule: 'set', set: ['c4'] } }; st.show = 'AuB'; } },
    { label: 'Own example · Loaded die (not equally likely)', source: 'This lab’s own example: faces 1 and 6 each have probability 1/4, faces 2 to 5 each have 1/8 (total 1/4 + 1/4 + 4 × 1/8 = 1).',
      apply: st => { st.space = 'custom'; st.useC = false; st.rows = [1, 2, 3, 4, 5, 6].map(k => ({ id: k, name: String(k), p: k === 1 || k === 6 ? '1/4' : '1/8' })); st.evs.custom = { A: { rule: 'set', set: ['c1', 'c2'] }, B: { rule: 'set', set: ['c2', 'c4', 'c6'] }, C: { rule: 'set', set: ['c6'] } }; st.show = 'AuB'; } },
    { label: 'Own example · Tomorrow’s weather (subjective probabilities)', source: 'This lab’s own example (Week 7 notes, “Subjective”: expert judgement such as weather forecasts). The numbers are made up.',
      apply: st => { st.space = 'custom'; st.useC = false; st.rows = [{ id: 1, name: 'Sunny', p: '1/2' }, { id: 2, name: 'Cloudy', p: '3/10' }, { id: 3, name: 'Rain', p: '1/5' }]; st.evs.custom = { A: { rule: 'set', set: ['c2', 'c3'] }, B: { rule: 'set', set: ['c3'] }, C: { rule: 'set', set: ['c1'] } }; st.show = 'AnB'; } },
  ];

  /** Every set the lab can name. f(a, b, c) says whether an outcome with those memberships is in the set. */
  const SETS = [
    { key: 'A', tex: 'A', f: a => a },
    { key: 'B', tex: 'B', f: (a, b) => b },
    { key: 'C', tex: 'C', f: (a, b, c) => c, c: true },
    { key: 'AuB', tex: 'A\\cup B', words: 'in A or B (or both)', f: (a, b) => a || b },
    { key: 'AnB', tex: 'A\\cap B', words: 'in both A and B', f: (a, b) => a && b },
    { key: 'Ac', tex: 'A^c', words: 'not in A', f: a => !a },
    { key: 'Bc', tex: 'B^c', words: 'not in B', f: (a, b) => !b },
    { key: 'AmB', tex: 'A\\setminus B', alt: 'A\\cap B^c', words: 'in A but not in B', f: (a, b) => a && !b },
    { key: 'BmA', tex: 'B\\setminus A', alt: 'A^c\\cap B', words: 'in B but not in A', f: (a, b) => b && !a },
    { key: 'none', tex: '(A\\cup B)^c', alt: 'A^c\\cap B^c', words: 'in neither A nor B', f: (a, b) => !a && !b },
    { key: 'Cc', tex: 'C^c', words: 'not in C', f: (a, b, c) => !c, c: true },
    { key: 'AnC', tex: 'A\\cap C', words: 'in both A and C', f: (a, b, c) => a && c, c: true },
    { key: 'BnC', tex: 'B\\cap C', words: 'in both B and C', f: (a, b, c) => b && c, c: true },
    { key: 'AnBnC', tex: 'A\\cap B\\cap C', words: 'in all three', f: (a, b, c) => a && b && c, c: true },
    { key: 'AuBuC', tex: 'A\\cup B\\cup C', words: 'in at least one of A, B, C', f: (a, b, c) => a || b || c, c: true },
    { key: 'none3', tex: '(A\\cup B\\cup C)^c', alt: 'A^c\\cap B^c\\cap C^c', words: 'in none of A, B, C', f: (a, b, c) => !a && !b && !c, c: true },
  ];
  const setByKey = key => SETS.find(x => x.key === key);

  function eventsLab(host) {
    const st = loadState();
    let sp = null, lastRows = null, lastGiven = null, ctl = {}, P = {}, D = null, sim = null;
    const save = () => Lab.store.set(KEY, st);
    const used = () => (st.useC ? L3 : ['A', 'B']);
    const tones = () => (st.useC ? T3 : ['a', 'b']);

    function currentSpace() {
      if (st.space === 'custom') {
        const res = parseRows(st.rows);
        if (res.ok) lastRows = res.rows;
        if (!lastRows) lastRows = parseRows(defaultRows()).rows;
        return makeSpace('custom', { rows: lastRows });
      }
      if (st.space === 'given') {
        const res = parseGiven(st.given);
        if (res.ok) lastGiven = res;
        if (!lastGiven) lastGiven = parseGiven(defaultGiven());
        return makeSpace('given', { g: lastGiven });
      }
      return makeSpace(st.space, { n: st.space === 'race' ? st.nr : st.n });
    }

    /* ---------------------------------------------------------- controls */
    function build() {
      const { side, main } = K.layout(host, 's5-ev-lab');
      ctl = {}; P = {};
      ctl.presets = K.presets({ label: 'Examples to load', items: PRESETS, onPick: it => { it.apply(st); syncControls(); } });
      side.appendChild(ctl.presets);
      side.appendChild(K.group('1 · Your experiment'));
      ctl.space = K.selectField({ label: 'Sample space ' + tx('S'), options: SPACE_OPTS, value: st.space, onChange: v => { st.space = v; afterSpace(); } });
      ctl.n = K.numField({ label: 'Number of coins ' + tx('n'), min: 1, max: 8, value: st.n, onChange: v => { st.n = v; afterSpace(); } });
      ctl.nr = K.numField({ label: 'Number of runners ' + tx('n'), min: 3, max: 6, value: st.nr, onChange: v => { st.nr = v; afterSpace(); }, hint: 'Runners A, B, C, … ; ' + tx('n!') + ' orders of finish.' });
      ctl.rows = rowsEditor();
      ctl.given = givenEditor();
      side.append(ctl.space, ctl.n, ctl.nr, ctl.rows, ctl.given);
      side.appendChild(K.group('2 · Your events'));
      ctl.evHost = h('div', { class: 's5-evs' });
      side.appendChild(ctl.evHost);
      ctl.useC = K.toggle({ label: 'Add a third event ' + tx('C'), value: st.useC, onChange: v => { st.useC = v; if (!v && setByKey(st.show) && setByKey(st.show).c) st.show = 'AuB'; if (!v && /^r:/.test(st.show)) st.show = 'AuB'; buildEvents(); draw(); } });
      side.appendChild(ctl.useC);
      ctl.clickWrap = h('div', { class: 'pl-field' });
      ctl.clickWrap.appendChild(h('label', { class: 'pl-label', text: 'Clicking an outcome tile adds or removes it from event' }));
      side.appendChild(ctl.clickWrap);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, {}); Object.keys(st).forEach(k => delete st[k]); Object.assign(st, defaults()); lastRows = null; build(); }, 'btn ghost sm')));

      P.answer = K.answer();
      P.grid = K.panel('Your sample space ' + tx('S') + ' and your events');
      P.venn = K.panel('Venn diagram, drawn from your numbers');
      P.sets = K.panel('The sets, written out');
      P.calc = K.panel('How each probability is computed, with your numbers');
      P.axioms = K.panel('The three axioms, checked with your numbers');
      P.interp = K.panel('Three ways to read ' + tx('P(A)'), 'Week 7 names three interpretations of probability.');
      P.sim = K.panel('Relative frequency: run the experiment', 'Repeat the experiment many times. The fraction of runs in which the event happens settles near its probability.');
      main.append(P.answer, P.grid, P.venn, P.sets, P.calc, P.axioms, P.interp, P.sim);
      buildSim();
      afterSpace();
    }
    function syncControls() {
      ctl.space.select.value = st.space;
      ctl.n.set(st.n);
      ctl.nr.set(st.nr);
      ctl.given.reload();
      const box = ctl.useC.querySelector('input');
      if (box) box.checked = st.useC;
      ctl.rows.reload();
      afterSpace();
    }
    function afterSpace() {
      ctl.n.hidden = st.space !== 'coins';
      ctl.nr.hidden = st.space !== 'race';
      ctl.rows.hidden = st.space !== 'custom';
      ctl.given.hidden = st.space !== 'given';
      const given = st.space === 'given';
      if (given && st.useC) { st.useC = false; const box = ctl.useC.querySelector('input'); if (box) box.checked = false; if (setByKey(st.show) && setByKey(st.show).c) st.show = 'AuB'; }
      if (given && /^r:/.test(st.show) && st.show.length !== 4) st.show = 'AuB';
      ctl.useC.hidden = given;
      ctl.clickWrap.hidden = given;
      sp = currentSpace();
      buildEvents();
      draw();
    }
    function buildEvents() {
      Lab.clear(ctl.evHost);
      ctl.boxes = {};
      if (st.space === 'given') {
        ctl.evHost.appendChild(K.note(tx('A') + ' and ' + tx('B') + ' are described by your numbers above — there is no list of outcomes to pick from.'));
        if (ctl.clickSeg) { ctl.clickSeg.remove(); ctl.clickSeg = null; }
        return;
      }
      const evs = st.evs[st.space];
      used().forEach((L, i) => {
        const box = eventBox({ sp, L, tone: T3[i], q: evs[L], onChange: () => draw() });
        ctl.boxes[L] = box;
        ctl.evHost.appendChild(box);
      });
      if (used().indexOf(st.click) < 0) st.click = 'A';
      if (ctl.clickSeg) ctl.clickSeg.remove();
      ctl.clickSeg = Lab.seg(used().map(L => ({ label: tx(L), value: L })), st.click, v => { st.click = v; save(); });
      if (st.useC) ctl.clickSeg.classList.add('s5-seg3');
      ctl.clickWrap.appendChild(ctl.clickSeg);
    }

    /* only probabilities given: P(A), P(B) and a third fact */
    function givenEditor() {
      const wrap = h('div', { class: 'pl-field s5-given' });
      const val = f => f.querySelector('input.pl-prob').value;
      let f3 = null, msg = null;
      function sync3() { f3.hidden = st.given.third === 'indep'; Lab.setHTML(f3.querySelector('.pl-label'), st.given.third === 'and' ? tx('P(A\\cap B)') + ' — both happen' : tx('P(A\\cup B)') + ' — at least one happens'); }
      function showMsg() { const res = parseGiven(st.given); Lab.setHTML(msg, res.ok ? '' : '<span class="cbad">' + res.msg + '</span>' + (lastGiven ? ' <span class="muted">The pictures keep your last valid numbers.</span>' : '')); }
      function regive() { showMsg(); if (st.space !== 'given') return; if (parseGiven(st.given).ok) sp = currentSpace(); draw(); }
      function make() {
        Lab.clear(wrap);
        const G = st.given;
        const nA = K.textField({ label: 'Event ' + tx('A') + ' means', value: G.nameA, mono: false, onChange: v => { st.given.nameA = v; draw(); } });
        const nB = K.textField({ label: 'Event ' + tx('B') + ' means', value: G.nameB, mono: false, onChange: v => { st.given.nameB = v; draw(); } });
        const fA = K.probField({ label: tx('P(A)'), value: G.pA, complement: false, onChange: () => { st.given.pA = val(fA); regive(); } });
        const fB = K.probField({ label: tx('P(B)'), value: G.pB, complement: false, onChange: () => { st.given.pB = val(fB); regive(); } });
        const third = K.selectField({ label: 'The third thing you know', options: THIRD_OPTS, value: G.third, onChange: v => { st.given.third = v; sync3(); regive(); } });
        f3 = K.probField({ label: 'third', value: G.p3, complement: false, onChange: () => { st.given.p3 = val(f3); regive(); } });
        msg = h('div', { class: 'pl-hint' });
        wrap.append(nA, nB, fA, fB, third, f3, msg);
        sync3();
        showMsg();
      }
      make();
      wrap.reload = make;
      return wrap;
    }

    /* the learner's own outcomes */
    function rowsEditor() {
      const wrap = h('div', { class: 'pl-field s5-rows' });
      const lab = h('label', { class: 'pl-label', text: 'Your outcomes and their probabilities' });
      const tbl = h('div', { class: 'pe-rows' });
      const msg = h('div', { class: 'pl-hint' });
      const tools = h('div', { class: 'pl-chips' });
      wrap.append(lab, tbl, msg, tools);
      const after = () => { drawRows(); emit(); };
      tools.append(
        Lab.button('+ outcome', () => { if (st.rows.length >= 12) return; const id = Math.max(0, ...st.rows.map(r => r.id)) + 1; st.rows.push({ id, name: 'O' + id, p: '0' }); after(); }, 'btn xs'),
        Lab.button('Make all equal', () => { st.rows.forEach(r => { r.p = '1/' + st.rows.length; }); after(); }, 'btn xs'),
        Lab.button('Rescale to total 1', () => { const ps = st.rows.map(r => K.parseNum(r.p)); if (ps.some(x => x == null || Number(x) < 0)) return; const tot = F.sum(ps); if (tot.isZero()) return; st.rows.forEach((r, k) => { r.p = ps[k].div(tot).toString(); }); after(); }, 'btn xs'));
      function drawRows() {
        Lab.clear(tbl);
        tbl.appendChild(h('div', { class: 'pe-head' }, h('span', { text: 'outcome (name)' }), h('span', { text: 'its probability' }), h('span')));
        st.rows.forEach((r, k) => {
          const ni = h('input', { class: 'field pe-in', value: r.name, spellcheck: 'false', 'aria-label': 'outcome ' + (k + 1) + ' name' });
          const pi = h('input', { class: 'field mono pe-in', value: r.p, spellcheck: 'false', 'aria-label': 'outcome ' + (k + 1) + ' probability' });
          const del = h('button', { class: 'icon-btn pe-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove outcome', title: 'remove outcome' });
          ni.addEventListener('input', () => { r.name = ni.value; emitSoon(); });
          pi.addEventListener('input', () => { r.p = pi.value; emitSoon(); });
          del.addEventListener('click', () => {
            if (st.rows.length <= 1) return;
            st.rows.splice(k, 1);
            const id = 'c' + r.id;
            L3.forEach(L => { const q = st.evs.custom[L]; if (q && Array.isArray(q.set)) q.set = q.set.filter(x => x !== id); });
            after();
          });
          tbl.appendChild(h('div', { class: 'pe-row' }, ni, pi, del));
        });
      }
      const emitSoon = Lab.debounce(() => emit(), 200);
      function emit() {
        const res = parseRows(st.rows);
        Lab.$$('.pe-row', tbl).forEach((row, k) => { const ins = row.querySelectorAll('input'); if (ins[0]) ins[0].classList.toggle('bad', !String(st.rows[k].name).trim()); if (ins[1]) ins[1].classList.toggle('bad', !!res.bad[k]); });
        Lab.setHTML(msg, res.ok ? 'Total ' + tx('P(S)=' + st.rows.map(r => pT(K.parseNum(r.p))).join('+') + '=1') + ' ' + ok : '<span class="cbad">' + res.msg + '</span>' + (lastRows ? ' <span class="muted">The pictures keep your last valid outcomes.</span>' : ''));
        st.rowsBad = res.ok ? null : (res.total ? res.total.toString() : 'bad');
        if (st.space !== 'custom') return;
        if (res.ok) { sp = currentSpace(); buildEvents(); }
        draw();
      }
      drawRows();
      setTimeout(() => { const res = parseRows(st.rows); Lab.setHTML(msg, res.ok ? 'Total ' + tx('P(S)=' + st.rows.map(r => pT(K.parseNum(r.p))).join('+') + '=1') + ' ' + ok : '<span class="cbad">' + res.msg + '</span>'); }, 0);
      wrap.reload = () => { drawRows(); const res = parseRows(st.rows); st.rowsBad = res.ok ? null : 'bad'; Lab.setHTML(msg, res.ok ? 'Total ' + tx('P(S)=' + st.rows.map(r => pT(K.parseNum(r.p))).join('+') + '=1') + ' ' + ok : '<span class="cbad">' + res.msg + '</span>'); };
      return wrap;
    }

    /* ------------------------------------------------------------- compute */
    function compute() {
      const evs = st.evs[st.space];
      const U = used();
      const mem = U.map(L => members(sp, evs[L]));
      const d = { sp, U, mem, words: U.map(L => (sp.kind === 'given' ? user(L === 'A' ? st.given.nameA : st.given.nameB) : evWords(sp, evs[L]))), m: {}, n: {}, p: {} };
      const N = sp.N;
      d.N = N;
      SETS.forEach(x => {
        if (x.c && !st.useC) return;
        const mk = sp.outs.map((o, k) => !!x.f(mem[0][k], mem[1][k], st.useC ? mem[2][k] : false));
        d.m[x.key] = mk; d.n[x.key] = cnt(mk); d.p[x.key] = prob(sp, mk);
      });
      d.m.S = sp.outs.map(() => true); d.n.S = N; d.p.S = sp.total;
      d.codes = regionCodes(U.length);
      d.code = sp.outs.map((o, k) => mem.map(m => (m[k] ? '1' : '0')).join(''));
      d.regions = {};
      d.codes.forEach(code => { d.regions[code] = { n: 0, p: F(0) }; });
      sp.outs.forEach((o, k) => { const R = d.regions[d.code[k]]; R.n++; R.p = R.p.add(o.p); });
      d.codes.forEach(code => { const R = d.regions[code]; R.ptxt = sp.equal ? (R.n ? R.n + '/' + N : '0') : isDec(R.p) ? Lab.fmtDec(Number(R.p), 4) : Lab.fmt(R.p); });
      return d;
    }

    function draw() {
      if (!sp) return;
      save();
      DEC = st.space === 'given' && !!(lastGiven && lastGiven.dec);
      D = compute();
      used().forEach((L, i) => { if (ctl.boxes[L]) ctl.boxes[L].info(tx('|' + L + '|=' + D.n[L]) + ' outcome' + (D.n[L] === 1 ? '' : 's') + ', ' + tx('P(' + L + ')=' + pT(D.p[L]))); });
      if (!setByKey(st.show) && !/^r:/.test(st.show)) st.show = 'AuB';
      if (/^r:/.test(st.show) && st.show.length - 2 !== used().length) st.show = 'AuB';
      drawAnswer(); drawGrid(); drawVenn(); drawSets(); drawCalc(); drawAxioms(); drawInterp(); resetSim();
    }

    /* ---------------------------------------------------------- the answer */
    function drawAnswer() {
      const d = D, sp2 = d.sp, N = d.N;
      const a = d.n.A, b = d.n.B, ab = d.n.AnB, u = d.n.AuB;
      const ev = d.U.map((L, i) => '<b class="s5-t' + T3[i] + '">' + L + '</b> = ' + d.words[i]).join(' &nbsp;·&nbsp; ');
      let big, sub;
      if (sp2.kind === 'given') {
        const G = lastGiven, nb = F(1).sub(G.pU);
        if (G.third === 'or') big = '\\begin{aligned}P(A\\cap B)&=P(A)+P(B)-P(A\\cup B)\\\\&=' + pT(G.pA) + '+' + pT(G.pB) + '-' + pT(G.pU) + '=' + pT(G.pAB) + approx(G.pAB) + '\\end{aligned}';
        else big = '\\begin{aligned}' + (G.third === 'indep' ? 'P(A\\cap B)&=P(A)\\,P(B)=' + pT(G.pA) + '\\times ' + pT(G.pB) + '=' + pT(G.pAB) + approx(G.pAB) + '\\\\ ' : '') + 'P(A\\cup B)&=P(A)+P(B)-P(A\\cap B)\\\\&=' + pT(G.pA) + '+' + pT(G.pB) + '-' + pT(G.pAB) + '=' + pT(G.pU) + approx(G.pU) + '\\end{aligned}';
        sub = 'Only probabilities are given, so everything comes from the rules (step list below). Neither ' + tx('A') + ' nor ' + tx('B') + ': ' + tx('P\\big((A\\cup B)^c\\big)=1-P(A\\cup B)=1-' + pT(G.pU) + '=' + pT(nb) + approx(nb)) + '.';
        K.setAnswer(P.answer, { ev, big, sub });
        return;
      }
      if (sp2.equal) {
        big = '\\begin{aligned}P(A\\cup B)&=P(A)+P(B)-P(A\\cap B)\\\\&=' + fr(a, N) + '+' + fr(b, N) + '-' + fr(ab, N) + '=' + frRed(u, N) + approx(d.p.AuB) + '\\end{aligned}';
        sub = u + ' of the ' + tx('|S|=' + N) + ' equally likely outcomes are in ' + tx('A') + ' or ' + tx('B') + ' or both: ' + tx('|A\\cup B|=|A|+|B|-|A\\cap B|=' + a + '+' + b + '-' + ab + '=' + u) + '. ';
      } else {
        big = '\\begin{aligned}P(A\\cup B)&=P(A)+P(B)-P(A\\cap B)\\\\&=' + pT(d.p.A) + '+' + pT(d.p.B) + '-' + pT(d.p.AnB) + '=' + pT(d.p.AuB) + approx(d.p.AuB) + '\\end{aligned}';
        sub = 'Your outcomes are <b>not</b> equally likely, so each probability is a sum of outcome probabilities (see the steps below), not a count divided by ' + N + '. ';
      }
      sub += 'Neither ' + tx('A') + ' nor ' + tx('B') + ': ' + tx('1-P(A\\cup B)=1-' + (sp2.equal ? fr(u, N) + '=' + frRed(N - u, N) : pT(d.p.AuB) + '=' + pT(d.p.none))) + (sp2.equal ? ' (' + (N - u) + ' outcomes)' : '') + '.';
      if (st.useC) sub += ' With ' + tx('C') + ' (three-event addition rule; every term is derived in the steps below):';
      if (ab === 0) sub += ' Here ' + tx('A\\cap B=\\emptyset') + ': ' + tx('A') + ' and ' + tx('B') + ' are mutually exclusive, so the last term is 0.';
      K.setAnswer(P.answer, { ev, big, sub });
      if (st.useC) {
        const c = d.n.C;
        const nums = sp2.equal ? fr(a, N) + '+' + fr(b, N) + '+' + fr(c, N) + '-' + fr(ab, N) + '-' + fr(d.n.AnC, N) + '-' + fr(d.n.BnC, N) + '+' + fr(d.n.AnBnC, N) + '=' + frRed(d.n.AuBuC, N)
          : [d.p.A, d.p.B, d.p.C].map(pT).join('+') + '-' + [d.p.AnB, d.p.AnC, d.p.BnC].map(pT).join('-') + '+' + pT(d.p.AnBnC) + '=' + pT(d.p.AuBuC);
        P.answer.appendChild(h('div', { class: 's5-ans2', html: tx('\\begin{aligned}P(A\\cup B\\cup C)&=P(A)+P(B)+P(C)\\\\&\\quad-P(A\\cap B)-P(A\\cap C)-P(B\\cap C)+P(A\\cap B\\cap C)\\\\&=' + nums + approx(d.p.AuBuC) + '\\end{aligned}', true) }));
      }
    }

    /* ------------------------------------------------------- grid and chips */
    function highlightMask() {
      if (/^r:/.test(st.show)) { const code = st.show.slice(2); return D.code.map(c => c === code); }
      return D.m[st.show] || D.m.AuB;
    }
    function highlightTex() {
      if (/^r:/.test(st.show)) return regionTex(st.show.slice(2), D.U);
      return setByKey(st.show).tex;
    }
    function highlightWords() {
      if (/^r:/.test(st.show)) return regionWords(st.show.slice(2), D.U);
      const x = setByKey(st.show);
      if (x.words) return x.words;
      const i = L3.indexOf(x.key);
      return D.words[i] || '';
    }
    function drawGrid() {
      const body = P.grid.body;
      Lab.clear(body);
      const given = D.sp.kind === 'given';
      P.grid.sub(spaceWhy(D.sp) + (given ? ' Each tile is one region; its letters light up for the events that contain it.' : ' Each tile is one outcome; its letters light up for the events it belongs to.'));
      const chips = h('div', { class: 's5-chips' });
      P.chips = [];
      SETS.filter(x => !x.c || st.useC).forEach(x => {
        const b = h('button', { class: 's5-chip', type: 'button', html: tx(x.tex) });
        b.addEventListener('click', () => { st.show = x.key; save(); paintHL(); });
        b.dataset.key = x.key;
        P.chips.push(b);
        chips.appendChild(b);
      });
      body.appendChild(h('div', { class: 's5-chiprow' }, h('span', { class: 's5-chiplab', text: 'Highlight in violet:' }), chips));
      P.gridEl = outcomeGrid({ sp: D.sp, letters: D.U, tones: tones(), onTile: toggleTile, onHover: tileInfo });
      body.appendChild(P.gridEl);
      P.showRead = h('div', { class: 'ws-readout s5-read' });
      P.tileRead = h('div', { class: 'ws-readout s5-read muted', html: 'Point at (or tab to) a tile to see its probability and its events.' + (given ? ' The regions come from your numbers, so here the events are changed in the controls, not by clicking.' : ' Click a tile to add it to, or remove it from, the event chosen in the controls.') });
      body.append(P.showRead, P.tileRead);
      P.gridEl.paint(D.mem, highlightMask());
      paintShowRead();
    }
    function paintShowRead() {
      const m = highlightMask(), k = cnt(m), pr = prob(D.sp, m), t = highlightTex();
      P.chips.forEach(b => b.classList.toggle('on', b.dataset.key === st.show));
      Lab.setHTML(P.showRead, '<b>' + tx(t) + '</b> (' + highlightWords() + ') = ' + setList(D.sp, m, 60) + ' &nbsp;—&nbsp; ' + (D.sp.kind === 'given' ? '' : k + ' outcome' + (k === 1 ? '' : 's') + ', ') +
        tx('P(' + t + ')=' + (D.sp.equal ? frRed(k, D.N) : pT(pr)) + approx(pr)));
    }
    function paintHL() {
      if (!D) return;
      P.gridEl.paint(D.mem, highlightMask());
      paintShowRead();
      drawVenn();
    }
    function toggleTile(o) {
      if (st.space === 'given') return;
      const L = st.click;
      if (used().indexOf(L) < 0) return;
      const q = st.evs[st.space][L];
      if (q.rule !== 'set') { q.set = idsOf(sp, q); q.rule = 'set'; }
      const i = q.set.indexOf(o.id);
      if (i >= 0) q.set.splice(i, 1); else q.set.push(o.id);
      if (ctl.boxes[L]) ctl.boxes[L].sync();
      draw();
      tileInfo(o);
    }
    function tileInfo(o) {
      if (!D || !P.tileRead) return;
      const parts = D.U.map((L, i) => (D.mem[i][o.k] ? '<span class="s5-t' + T3[i] + '">in ' + L + '</span> ' + ok : '<span class="muted">not in ' + L + '</span> ' + no));
      P.tileRead.classList.remove('muted');
      Lab.setHTML(P.tileRead, '<b>' + (o.user ? user(o.short) : esc(o.short)) + '</b>: ' + tx('P=' + pT(o.p)) + ' &nbsp;·&nbsp; ' + parts.join(' &nbsp; '));
    }

    /* --------------------------------------------------------------- Venn */
    function drawVenn() {
      const body = P.venn.body;
      Lab.clear(body);
      const d = D, U = d.U, counts = d.sp.kind !== 'given';
      const ps = U.map(L => Number(d.p[L]));
      const pairs = { AB: Number(d.p.AnB), AC: st.useC ? Number(d.p.AnC) : 0, BC: st.useC ? Number(d.p.BnC) : 0 };
      const hlCodes = /^r:/.test(st.show) ? [st.show.slice(2)] : d.codes.filter(code => setByKey(st.show).f(code[0] === '1', code[1] === '1', code[2] === '1'));
      const read = h('div', { class: 'ws-readout s5-read muted', text: 'Point at a region to name it.' });
      const V = venn({
        ps, pairs, regions: d.regions, letters: U, tones: tones(), hl: hlCodes, counts,
        onPick: code => { st.show = 'r:' + code; save(); paintHL(); },
        onHover: code => {
          if (!code) { read.classList.add('muted'); read.textContent = 'Point at a region to name it.'; return; }
          const R = d.regions[code];
          read.classList.remove('muted');
          Lab.setHTML(read, tx(regionTex(code, U)) + ' — ' + esc(regionWords(code, U)) + ': ' + (counts ? R.n + ' outcome' + (R.n === 1 ? '' : 's') + ', ' : '') + tx('P=' + (d.sp.equal ? frRed(R.n, d.N) : pT(R.p))));
        },
      });
      P.venn.sub(vennCaption(V, U.length, counts));
      // region table (no outcome counts when only probabilities are given)
      const tbl = h('table', { class: 'tbl s5-rtbl s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, ['Region', 'In words'].concat(counts ? ['Outcomes'] : [], ['Probability']).map(t => h('th', { text: t })))));
      const tb = h('tbody');
      d.codes.forEach(code => {
        const R = d.regions[code];
        const tr = h('tr', { class: 's5-click' + (hlCodes.indexOf(code) >= 0 ? ' hl-row' : '') });
        tr.append(h('td', { html: tx(regionTex(code, U)) }), h('td', { class: 'l', text: regionWords(code, U), 'data-l': 'in words' }));
        if (counts) tr.appendChild(h('td', { text: String(R.n), 'data-l': 'outcomes' }));
        tr.appendChild(h('td', { html: tx(d.sp.equal ? frRed(R.n, d.N) : pT(R.p)), 'data-l': 'probability' }));
        tr.addEventListener('click', () => { st.show = 'r:' + code; save(); paintHL(); });
        tb.appendChild(tr);
      });
      const tot = F.sum(d.codes.map(code => d.regions[code].p));
      const totRow = h('tr', { class: 's5-tot' }, h('td', { text: 'all regions' }), h('td', { class: 'l', text: 'they never overlap and cover S', 'data-l': 'in words' }));
      if (counts) totRow.appendChild(h('td', { text: String(d.N), 'data-l': 'outcomes' }));
      totRow.appendChild(h('td', { html: tx(pT(tot)) + ' ' + (tot.eq(1) ? ok : no), 'data-l': 'probability' }));
      tb.appendChild(totRow);
      tbl.appendChild(tb);
      const bar = linearBar({ codes: d.codes, regions: d.regions, letters: U, tones: tones(), hl: hlCodes, onPick: V.pick, onHover: V.hover });
      body.append(h('div', { class: 's5-venn-box' }, V.el), h('div', { class: 's5-lin-box' }, bar, h('div', { class: 's5-lin-cap', html: 'Always to scale: the bar is ' + tx('S') + ' with length 1, cut into the regions above (left to right as in the table); each coloured row shows where its event holds, so its length is the event’s probability.' })), read, h('div', { class: 'tbl-wrap s5-rwrap' }, wrapCells(tbl)));
    }

    /* ---------------------------------------------------------- sets table */
    function drawSets() {
      const body = P.sets.body;
      Lab.clear(body);
      const d = D, N = d.N, given = d.sp.kind === 'given';
      P.sets.sub(given ? 'Every set built from your events, written as the Venn regions it is made of (“A and B”, “A only”, “B only”, “neither”). Its probability is the sum of their probabilities.' : 'Every set built from your events, with its outcomes listed. ' + tx('|E|') + ' is the number of outcomes in ' + tx('E') + '.');
      const tbl = h('table', { class: 'tbl s5-stbl s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, (given ? ['Set', 'Meaning', 'Regions', 'Probability'] : ['Set', 'Meaning', 'Outcomes', '|·|', 'Probability']).map(t => h('th', { text: t })))));
      const tb = h('tbody');
      const row = (texName, words, m, key) => {
        const k = cnt(m), pr = prob(d.sp, m);
        const tr = h('tr', { class: key ? 's5-click' + (st.show === key ? ' hl-row' : '') : '' });
        tr.append(h('td', { html: tx(texName) }), h('td', { class: 'l', html: words, 'data-l': 'meaning' }), h('td', { class: 'l s5-list s5-blockcell', html: setList(d.sp, m, d.N > 100 ? 60 : 0), 'data-l': given ? 'regions' : 'outcomes' }));
        if (!given) tr.appendChild(h('td', { text: String(k), 'data-l': 'number of outcomes' }));
        tr.appendChild(h('td', { html: tx(d.sp.equal ? frRed(k, N) : pT(pr)), 'data-l': 'probability' }));
        if (key) tr.addEventListener('click', () => { st.show = key; save(); paintHL(); drawSets(); });
        tb.appendChild(tr);
      };
      row('S', 'every outcome (the sample space)', d.m.S, null);
      SETS.forEach(x => {
        if (x.c && !st.useC) return;
        const i = L3.indexOf(x.key);
        const words = i >= 0 ? d.words[i] : esc(x.words) + (x.alt ? ' — also written ' + tx(x.alt) : '');
        row(x.tex, words, d.m[x.key], x.key);
      });
      tbl.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap s5-swrap' }, wrapCells(tbl)));
      // mutually exclusive checks
      const pairs = [['A', 'B', 'AnB']].concat(st.useC ? [['A', 'C', 'AnC'], ['B', 'C', 'BnC']] : []);
      const lines = pairs.map(([X1, X2, key]) => {
        const k = d.n[key];
        if (given) {
          return d.p[key].eq(0)
            ? '<div>' + ok + ' ' + tx('P(' + X1 + '\\cap ' + X2 + ')=0') + ': ' + tx(X1) + ' and ' + tx(X2) + ' never happen together, so they are treated as <b>mutually exclusive</b> and ' + tx('P(' + X1 + '\\cup ' + X2 + ')=P(' + X1 + ')+P(' + X2 + ')') + '.</div>'
            : '<div>' + no + ' ' + tx(X1) + ' and ' + tx(X2) + ' are <b>not</b> mutually exclusive: ' + tx('P(' + X1 + '\\cap ' + X2 + ')=' + pT(d.p[key]) + approx(d.p[key]) + '>0') + ', so they can happen together.</div>';
        }
        if (k === 0) return '<div>' + ok + ' ' + tx(X1) + ' and ' + tx(X2) + ' <b>are mutually exclusive</b> (disjoint): ' + tx(X1 + '\\cap ' + X2 + '=\\emptyset') + ' — no outcome is in both, so they can never happen together and ' + tx('P(' + X1 + '\\cup ' + X2 + ')=P(' + X1 + ')+P(' + X2 + ')') + '.</div>';
        const ex = d.sp.outs.find((o, j) => d.m[key][j]);
        return '<div>' + no + ' ' + tx(X1) + ' and ' + tx(X2) + ' are <b>not</b> mutually exclusive: ' + tx(X1 + '\\cap ' + X2) + ' has ' + k + ' outcome' + (k === 1 ? '' : 's') + ', for example ' + (ex.user ? user(ex.short) : esc(ex.short)) + ', which is in both.</div>';
      });
      body.appendChild(K.note(lines.join(''), 's5-me'));
    }

    /* ------------------------------------------------------ the derivation */
    function probLine(m, name) {
      const d = D, k = cnt(m), pr = prob(d.sp, m);
      if (d.sp.equal) return 'P(' + name + ')=\\frac{|' + name + '|}{|S|}=' + frRed(k, d.N) + approx(pr);
      const items = d.sp.outs.filter((o, j) => m[j]);
      if (!items.length) return 'P(' + name + ')=0';
      const names = items.length <= 5 ? items.map(o => 'P(' + texText(o.short) + ')').join('+') + '=' : '';
      const nums = items.length <= 10 ? items.map(o => pT(o.p)).join('+') : items.slice(0, 8).map(o => pT(o.p)).join('+') + '+\\dots';
      return 'P(' + name + ')=' + names + (items.length > 1 ? nums + '=' : '') + pT(pr) + approx(pr);
    }
    function drawCalcGiven(body, d) {
      const G = lastGiven, one = F(1);
      const pAmB = G.pA.sub(G.pAB), pBmA = G.pB.sub(G.pAB), pN = one.sub(G.pU);
      const named = tx('A') + ' = ' + d.words[0] + ', ' + tx('B') + ' = ' + d.words[1];
      const knew = G.third === 'and' ? tx('P(A\\cap B)=' + pT(G.pAB)) : G.third === 'or' ? tx('P(A\\cup B)=' + pT(G.pU)) : 'that ' + tx('A') + ' and ' + tx('B') + ' are independent';
      const steps = [{ html: '<b>What is given.</b> ' + named + '. You know ' + tx('P(A)=' + pT(G.pA)) + ', ' + tx('P(B)=' + pT(G.pB)) + ' and ' + knew + '. There is no list of outcomes, so every other probability comes from the rules.' }];
      if (G.third === 'indep') steps.push({ html: '<b>Independent events:</b> the probability that both happen is the product of the two probabilities.', math: 'P(A\\cap B)=P(A)\\,P(B)=' + pT(G.pA) + '\\times ' + pT(G.pB) + '=' + pT(G.pAB) + approx(G.pAB) });
      if (G.third === 'or') steps.push({ html: '<b>Addition rule, solved for the overlap:</b> from ' + tx('P(A\\cup B)=P(A)+P(B)-P(A\\cap B)') + ',', math: 'P(A\\cap B)=P(A)+P(B)-P(A\\cup B)=' + pT(G.pA) + '+' + pT(G.pB) + '-' + pT(G.pU) + '=' + pT(G.pAB) + approx(G.pAB) });
      else steps.push({ html: '<b>Addition rule:</b> adding ' + tx('P(A)') + ' and ' + tx('P(B)') + ' counts the overlap twice, so subtract it once:', math: 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)=' + pT(G.pA) + '+' + pT(G.pB) + '-' + pT(G.pAB) + '=' + pT(G.pU) + approx(G.pU) });
      steps.push({ html: '<b>Neither A nor B</b> is the complement of “A or B”:', math: 'P\\big((A\\cup B)^c\\big)=1-P(A\\cup B)=1-' + pT(G.pU) + '=' + pT(pN) + approx(pN) });
      steps.push({ html: '<b>Only A, only B:</b> take the overlap away from each event.', math: '\\begin{aligned}P(A\\setminus B)&=P(A)-P(A\\cap B)=' + pT(G.pA) + '-' + pT(G.pAB) + '=' + pT(pAmB) + '\\\\ P(B\\setminus A)&=P(B)-P(A\\cap B)=' + pT(G.pB) + '-' + pT(G.pAB) + '=' + pT(pBmA) + '\\end{aligned}' });
      steps.push({ html: '<b>Complement rule:</b>', math: '\\begin{aligned}P(A^c)&=1-P(A)=1-' + pT(G.pA) + '=' + pT(one.sub(G.pA)) + '\\\\ P(B^c)&=1-P(B)=1-' + pT(G.pB) + '=' + pT(one.sub(G.pB)) + '\\end{aligned}' });
      const tot = G.pAB.add(pAmB).add(pBmA).add(pN);
      steps.push({ html: '<b>Check:</b> the four regions never overlap and together cover everything, so (Axioms 2 and 3) their probabilities add to 1:', math: 'P(A\\cap B)+P(A\\setminus B)+P(B\\setminus A)+P\\big((A\\cup B)^c\\big)=' + [G.pAB, pAmB, pBmA, pN].map(pT).join('+') + '=' + pT(tot), note: tot.eq(1) ? ok + ' These four numbers are the “outcomes” used by the grid, the Venn diagram and the simulation.' : '' });
      body.appendChild(K.steps(steps));
    }
    function drawCalc() {
      const body = P.calc.body;
      Lab.clear(body);
      if (D.sp.kind === 'given') { drawCalcGiven(body, D); return; }
      const d = D, N = d.N, eq = d.sp.equal;
      const a = d.n.A, b = d.n.B, ab = d.n.AnB, u = d.n.AuB;
      const pv = key => (eq ? fr(d.n[key], N) : pT(d.p[key]));
      const pres = key => (eq ? frRed(d.n[key], N) : pT(d.p[key])) + approx(d.p[key]);
      const steps = [];
      steps.push({ html: '<b>The sample space.</b> ' + spaceWhy(d.sp) });
      if (!eq) {
        steps.push({ html: '<b>Not equally likely.</b> The formula ' + tx('P(E)=\\frac{|E|}{|S|}') + ' assumes every outcome has probability ' + tx('\\frac{1}{|S|}=\\frac1{' + N + '}') + '. Yours do not, so instead <b>add the probabilities of the outcomes inside the event</b>:', math: 'P(E)=\\sum_{\\text{outcomes }o\\text{ in }E}P(o)',
          note: 'For your ' + tx('A') + ': ' + tx('\\frac{|A|}{|S|}=' + frRed(a, N)) + (d.p.A.eq(F(a, N)) ? ' happens to equal ' : ' is <b>not</b> ') + tx('P(A)=' + pT(d.p.A)) + '. Week 7 notes: the classical formula “fails if outcomes are not equally likely”.' });
      }
      d.U.forEach((L, i) => steps.push({ html: 'Event ' + tx(L) + ' = ' + d.words[i] + '. Its outcomes: ' + setList(d.sp, d.mem[i], 40) + ', so ' + tx('|' + L + '|=' + d.n[L]) + '.', math: probLine(d.mem[i], L) }));
      steps.push({ html: 'Both ' + tx('A') + ' and ' + tx('B') + ': ' + tx('A\\cap B') + ' = ' + setList(d.sp, d.m.AnB, 40) + ', so ' + tx('|A\\cap B|=' + ab) + '.', math: probLine(d.m.AnB, 'A\\cap B') });
      // addition rule
      const add = 'P(A\\cup B)=P(A)+P(B)-P(A\\cap B)=' + (eq ? fr(a, N) + '+' + fr(b, N) + '-' + fr(ab, N) + '=' + frRed(u, N) : pT(d.p.A) + '+' + pT(d.p.B) + '-' + pT(d.p.AnB) + '=' + pT(d.p.AuB)) + approx(d.p.AuB);
      steps.push({ html: '<b>Addition rule.</b> Adding ' + (eq ? tx('|A|') + ' and ' + tx('|B|') + ' counts the ' + ab + ' outcome' + (ab === 1 ? '' : 's') + ' of ' + tx('A\\cap B') + ' twice' : tx('P(A)') + ' and ' + tx('P(B)') + ' counts the probability of ' + tx('A\\cap B') + ' twice') + ', so subtract ' + (eq ? 'them' : 'it') + ' once:',
        math: eq ? '\\begin{aligned}|A\\cup B|&=|A|+|B|-|A\\cap B|=' + a + '+' + b + '-' + ab + '=' + u + '\\\\ ' + add.replace('=P(A)+', '&=P(A)+') + '\\end{aligned}' : add,
        note: 'Check by listing: ' + tx('A\\cup B') + ' = ' + setList(d.sp, d.m.AuB, 30) + ' has ' + u + ' outcome' + (u === 1 ? '' : 's') + (eq ? ' ' + ok : ' with total probability ' + tx(pT(d.p.AuB)) + ' ' + ok) + (ab === 0 ? ' Since ' + tx('A\\cap B=\\emptyset') + ', this is just Axiom 3: ' + tx('P(A\\cup B)=P(A)+P(B)') + '.' : '') });
      // complements
      steps.push({ html: '<b>Complement rule.</b> ' + tx('A') + ' and ' + tx('A^c') + ' do not overlap and together make ' + tx('S') + ', so ' + tx('P(A)+P(A^c)=P(S)=1') + '. Same for ' + tx('B') + ':',
        math: '\\begin{aligned}P(A^c)&=1-P(A)=1-' + pv('A') + '=' + pres('Ac') + '\\\\ P(B^c)&=1-P(B)=1-' + pv('B') + '=' + pres('Bc') + '\\end{aligned}',
        note: eq ? 'Counting gives the same: ' + tx('|A^c|=|S|-|A|=' + N + '-' + a + '=' + (N - a)) + ' and ' + tx('|B^c|=' + N + '-' + b + '=' + (N - b)) + '.' : '' });
      steps.push({ html: '<b>Neither A nor B.</b> “Neither” is the complement of “A or B”: ' + tx('(A\\cup B)^c=A^c\\cap B^c') + '.',
        math: 'P\\big((A\\cup B)^c\\big)=1-P(A\\cup B)=1-' + pv('AuB') + '=' + pres('none'),
        note: eq ? 'Count: ' + tx('|S|-|A\\cup B|=' + N + '-' + u + '=' + (N - u)) + ' outcomes: ' + setList(d.sp, d.m.none, 30) + '.' : 'Outcomes in neither: ' + setList(d.sp, d.m.none, 30) + '.' });
      steps.push({ html: '<b>Only A, only B.</b> ' + tx('A') + ' splits into two pieces that do not overlap — ' + tx('A\\setminus B') + ' and ' + tx('A\\cap B') + ' — so ' + tx('P(A)=P(A\\setminus B)+P(A\\cap B)') + ':',
        math: '\\begin{aligned}P(A\\setminus B)&=P(A)-P(A\\cap B)=' + pv('A') + '-' + pv('AnB') + '=' + pres('AmB') + '\\\\ P(B\\setminus A)&=P(B)-P(A\\cap B)=' + pv('B') + '-' + pv('AnB') + '=' + pres('BmA') + '\\end{aligned}' });
      if (st.useC) {
        const c = d.n.C;
        steps.push({ html: 'The overlaps with ' + tx('C') + ': ' + tx('A\\cap C') + ' = ' + setList(d.sp, d.m.AnC, 20) + ', ' + tx('B\\cap C') + ' = ' + setList(d.sp, d.m.BnC, 20) + ', ' + tx('A\\cap B\\cap C') + ' = ' + setList(d.sp, d.m.AnBnC, 20) + '.',
          math: '\\begin{aligned}' + [probLine(d.m.AnC, 'A\\cap C'), probLine(d.m.BnC, 'B\\cap C'), probLine(d.m.AnBnC, 'A\\cap B\\cap C')].map(t => t.replace('=', '&=')).join('\\\\ ') + '\\end{aligned}' });
        const sym = 'P(A\\cup B\\cup C)=P(A)+P(B)+P(C)\\\\&\\quad-P(A\\cap B)-P(A\\cap C)-P(B\\cap C)+P(A\\cap B\\cap C)';
        const nums = eq ? fr(a, N) + '+' + fr(b, N) + '+' + fr(c, N) + '-' + fr(ab, N) + '-' + fr(d.n.AnC, N) + '-' + fr(d.n.BnC, N) + '+' + fr(d.n.AnBnC, N) + '=' + frRed(d.n.AuBuC, N)
          : [d.p.A, d.p.B, d.p.C].map(pT).join('+') + '-' + [d.p.AnB, d.p.AnC, d.p.BnC].map(pT).join('-') + '+' + pT(d.p.AnBnC) + '=' + pT(d.p.AuBuC);
        steps.push({ html: '<b>Addition rule for three events</b> (inclusion–exclusion). Adding the three probabilities counts every outcome that lies in two events twice and every outcome in all three events three times. Subtracting the three pairwise overlaps fixes the first but removes the triple overlap three times, so add it back once:',
          math: '\\begin{aligned}' + sym.replace('=', '&=') + '\\\\ &=' + nums + approx(d.p.AuBuC) + '\\end{aligned}',
          note: (eq ? 'In counts: ' + tx('|A\\cup B\\cup C|=' + a + '+' + b + '+' + c + '-' + ab + '-' + d.n.AnC + '-' + d.n.BnC + '+' + d.n.AnBnC + '=' + d.n.AuBuC) + '. ' : '') + 'Check by listing: ' + tx('A\\cup B\\cup C') + ' has ' + d.n.AuBuC + ' outcome' + (d.n.AuBuC === 1 ? '' : 's') + ' ' + ok });
        steps.push({ html: '<b>None of the three.</b> The complement of “at least one of them”:', math: 'P\\big((A\\cup B\\cup C)^c\\big)=1-P(A\\cup B\\cup C)=1-' + pv('AuBuC') + '=' + pres('none3') });
      }
      body.appendChild(K.steps(steps));
    }

    /* -------------------------------------------------------------- axioms */
    function drawAxioms() {
      const body = P.axioms.body;
      Lab.clear(body);
      const d = D, N = d.N, eq = d.sp.equal;
      const pv = key => (eq ? fr(d.n[key], N) : pT(d.p[key]));
      const list = d.U.concat(['A\\cup B', 'A\\cap B']).map((t, i) => [t, i < d.U.length ? d.p[d.U[i]] : (t === 'A\\cup B' ? d.p.AuB : d.p.AnB)]);
      const ax1 = list.map(([t, p]) => tx('0\\le P(' + t + ')=' + pT(p) + '\\le 1') + ' ' + (Number(p) >= 0 && Number(p) <= 1 ? ok : no)).join(' &nbsp; ');
      const total = d.sp.total;
      let ax2;
      if (d.sp.equal && d.sp.kind !== 'custom') ax2 = tx('P(S)=\\underbrace{' + pT(d.sp.outs[0].p) + '+\\dots+' + pT(d.sp.outs[0].p) + '}_{' + N + '\\text{ outcomes}}=' + N + '\\times ' + pT(d.sp.outs[0].p) + '=' + pT(total)) + ' ' + ok;
      else ax2 = tx('P(S)=' + d.sp.outs.map(o => pT(o.p)).join('+') + '=' + pT(total)) + ' ' + (total.eq(1) ? ok : no);
      const sum3 = d.p.AmB.add(d.p.AnB).add(d.p.BmA);
      const steps = [
        { html: '<b>Axiom 1:</b> ' + tx('0\\le P(E)\\le 1') + ' for every event ' + tx('E') + '. Your events: <div class="s5-ax">' + ax1 + '</div>', note: 'Why it holds: each ' + tx('P(E)') + ' is a sum of outcome probabilities, none negative, and it can never exceed the sum over all of ' + tx('S') + '.' },
        { html: '<b>Axiom 2:</b> ' + tx('P(S)=1') + ' — something in the sample space must happen. Your ' + N + ' outcome probabilities: <div class="s5-ax">' + ax2 + '</div>', note: (st.space === 'custom' && st.rowsBad ? '<span class="cbad">What you are typing right now does not add to 1, so it is not a probability model yet; the pictures use your last valid outcomes.</span>' : '') },
        { html: '<b>Axiom 3:</b> for mutually exclusive events, probabilities add: ' + tx('P(E_1\\cup E_2\\cup\\dots)=P(E_1)+P(E_2)+\\dots') + '. The three pieces ' + tx('A\\setminus B') + ', ' + tx('A\\cap B') + ', ' + tx('B\\setminus A') + ' never overlap and together make ' + tx('A\\cup B') + ':',
          math: '\\begin{aligned}&P(A\\setminus B)+P(A\\cap B)+P(B\\setminus A)\\\\&=' + pv('AmB') + '+' + pv('AnB') + '+' + pv('BmA') + '=' + (eq ? frRed(d.n.AmB + d.n.AnB + d.n.BmA, N) : pT(sum3)) + '\\end{aligned}', note: 'and that is ' + tx('P(A\\cup B)=' + pT(d.p.AuB)) + ' ' + (sum3.eq(d.p.AuB) ? ok : no) + ' — the addition rule is Axiom 3 applied to these pieces.' },
        outcomesStep(d),
        { html: '<b>Consequence: the complement.</b> ' + tx('A') + ' and ' + tx('A^c') + ' are disjoint with ' + tx('A\\cup A^c=S') + ', so Axioms 2 and 3 give ' + tx('P(A)+P(A^c)=1') + ': ' + tx(pv('A') + '+' + pv('Ac') + '=' + pT(d.p.A.add(d.p.Ac))) + ' ' + (d.p.A.add(d.p.Ac).eq(1) ? ok : no) + '.' },
        emptyStep(d),
      ];
      const sub = (x, y) => d.m[x].every((v, k) => !v || d.m[y][k]);
      if (d.n.A > 0 && d.n.A < d.n.B && sub('A', 'B')) steps.push({ html: 'Every outcome of ' + tx('A') + ' is also in ' + tx('B') + ' (' + tx('A\\subseteq B') + '), so ' + tx('P(A)\\le P(B)') + ': ' + tx(pT(d.p.A) + '\\le ' + pT(d.p.B)) + ' ' + ok });
      else if (d.n.B > 0 && d.n.B < d.n.A && sub('B', 'A')) steps.push({ html: 'Every outcome of ' + tx('B') + ' is also in ' + tx('A') + ' (' + tx('B\\subseteq A') + '), so ' + tx('P(B)\\le P(A)') + ': ' + tx(pT(d.p.B) + '\\le ' + pT(d.p.A)) + ' ' + ok });
      body.appendChild(K.steps(steps));
    }
    /** Axioms step: the basic outcomes are mutually exclusive and exhaustive, so their probabilities add up to P(S) = 1. */
    function outcomesStep(d) {
      const sp = d.sp, N = d.N, outs = sp.outs, given = sp.kind === 'given';
      const nm = o => (o.user ? user(o.short) : esc(o.short));
      const noun = given ? 'regions' : 'outcomes';
      const lhs = N <= 3 ? outs.map((o, k) => 'P(\\{o_{' + (k + 1) + '}\\})').join('+') : 'P(\\{o_1\\})+\\dots+P(\\{o_{' + N + '}\\})';
      const sumTex = sp.equal && N > 1 ? K.intTex(N) + '\\times ' + pT(outs[0].p) : outs.map(o => pT(o.p)).join('+');
      const union = N <= 8 ? outs.map(o => '{' + nm(o) + '}').join(' ∪ ') : '{' + nm(outs[0]) + '} ∪ {' + nm(outs[1]) + '} ∪ … ∪ {' + nm(outs[N - 1]) + '}';
      return {
        html: '<b>The basic outcomes are mutually exclusive and exhaustive.</b> ' + (given ? 'Here the four regions “A and B”, “A only”, “B only” and “neither” play the part of the outcomes. ' : 'One run of the experiment gives exactly one outcome of ' + tx('S') + '. ') +
          '<b>Mutually exclusive:</b> ' + (N >= 2 ? 'no two of them happen together, for example {' + nm(outs[0]) + '} ∩ {' + nm(outs[1]) + '} = ∅; all ' + tx('\\frac{N(N-1)}{2}=\\frac{' + K.intTex(N) + '\\times ' + K.intTex(N - 1) + '}{2}=' + K.intTex(N * (N - 1) / 2)) + ' pairs of your ' + tx('N=' + K.intTex(N)) + ' ' + noun + ' are disjoint.' : 'there is only one outcome, so nothing can overlap.') +
          ' <b>Exhaustive:</b> one of them always happens, ' + union + ' = ' + tx('S') + '. So Axiom 3 adds their probabilities to give ' + tx('P(S)') + ':',
        math: N > 1 ? '\\begin{aligned}&' + lhs + '\\\\&=' + sumTex + '=' + pT(sp.total) + '\\end{aligned}' : lhs + '=' + pT(sp.total),
        note: 'Axiom 2 needs this total to be 1 ' + (sp.total.eq(1) ? ok : no) + ' — that is why Axiom 2 above adds up the outcome probabilities.',
      };
    }
    /** Axioms step: the empty event has probability 0, checked on the learner's A and its complement. */
    function emptyStep(d) {
      const sp = d.sp;
      const both = sp.outs.filter((o, k) => d.m.A[k] && d.m.Ac[k]).length;
      let mine = d.n.A === 0
        ? 'Your ' + tx('A') + ' is empty right now: ' + tx('A=\\emptyset') + ' and ' + tx('P(A)=' + pT(d.p.A)) + ' ' + ok + '.'
        : 'With your events: ' + tx('A') + ' = ' + setList(sp, d.m.A, 8) + ' and ' + tx('A^c') + ' = ' + setList(sp, d.m.Ac, 8) + ' have no outcome in common (' + tx('|A\\cap A^c|=' + both) + ' ' + (both === 0 ? ok : no) + '), so ' + tx('A\\cap A^c=\\emptyset') + ' and ' + tx('P(A\\cap A^c)=P(\\emptyset)=0') + '.';
      if (d.n.A > 0 && d.n.Ac === 0) mine += ' Here ' + tx('A=S') + ', so ' + tx('A^c') + ' itself is the empty event: ' + tx('P(A^c)=' + pT(d.p.Ac)) + ' ' + ok + '.';
      if (sp.kind !== 'given' && d.n.A > 0 && d.n.B > 0 && d.n.AnB === 0) mine += ' Your ' + tx('A') + ' and ' + tx('B') + ' are disjoint too: ' + tx('A\\cap B=\\emptyset') + ', so ' + tx('P(A\\cap B)=' + pT(d.p.AnB)) + ' ' + ok + '.';
      return {
        html: '<b>The empty event has probability 0:</b> ' + tx('P(\\emptyset)=0') + '. ' + tx('S') + ' and ' + tx('\\emptyset') + ' are disjoint and ' + tx('S\\cup\\emptyset=S') + ', so Axioms 2 and 3 give',
        math: '\\begin{aligned}P(S)&=P(S\\cup\\emptyset)=P(S)+P(\\emptyset)\\\\ 1&=1+P(\\emptyset)\\\\ P(\\emptyset)&=1-1=0\\end{aligned}',
        block: K.note(mine, ''),
      };
    }

    /* ---------------------------------------------------- interpretations */
    function drawInterp() {
      const body = P.interp.body;
      Lab.clear(body);
      const d = D, a = d.n.A, N = d.N;
      const classical = d.sp.kind === 'given'
        ? '<div class="small"><b>Does not apply:</b> only probabilities are given — there is no list of equally likely outcomes to count.</div>'
        : d.sp.equal
        ? tx('P(A)=\\frac{m}{n}=' + frRed(a, N)) + '<div class="small">' + tx('m=|A|=' + a) + ' favourable outcomes, ' + tx('n=|S|=' + N) + ' in total. Valid here because all ' + N + ' outcomes are equally likely.</div>'
        : '<div class="small"><b>Does not apply:</b> your outcomes are not equally likely. It would give ' + tx('\\frac{m}{n}=' + frRed(a, N)) + ', but ' + tx('P(A)=' + pT(d.p.A)) + '.</div>';
      P.rfCard = h('div', { class: 'small' });
      const card = (title, html, el) => { const c = h('div', { class: 's5-icard' }, h('div', { class: 's5-ititle', text: title })); const b = h('div'); Lab.setHTML(b, html); c.appendChild(b); if (el) c.appendChild(el); return c; };
      body.appendChild(h('div', { class: 's5-igrid' },
        card('Classical', classical),
        card('Relative frequency', '<div class="small">' + tx('P(A)\\approx\\frac{\\text{runs in which }A\\text{ happened}}{\\text{number of runs}}') + '</div>', P.rfCard),
        card('Subjective', '<div class="small">A degree of belief from experience or expert judgement — a weather forecast, an election prediction. Under “Your own outcomes and probabilities” you can type such numbers; they must still obey the three axioms.</div>')));
    }

    /* ---------------------------------------------------------- simulation */
    const SIM_CAP = 200000;
    const TRACK = [['A', 'A'], ['B', 'B'], ['AuB', 'A\\cup B'], ['AnB', 'A\\cap B'], ['C', 'C']];
    function buildSim() {
      const body = P.sim.body;
      P.trackHost = h('div', { class: 'pl-field' });
      const btns = h('div', { class: 'btn-row' });
      [[1, 'Run once'], [10, 'Run 10×'], [100, 'Run 100×'], [1000, 'Run 1,000×'], [10000, 'Run 10,000×']].forEach(([r, lab], k) => btns.appendChild(Lab.button(lab, () => runSim(r), k === 3 ? 'btn primary sm' : 'btn sm')));
      btns.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => resetSim(), 'btn ghost sm'));
      P.simStat = h('div', { class: 'ps-stat' });
      P.simRecent = h('div', { class: 'ps-recent' });
      P.simChart = h('div', { class: 'ps-chart' });
      P.simTable = h('div', { class: 'tbl-wrap' });
      body.append(P.trackHost, btns, P.simStat, P.simRecent, P.simChart, P.simTable);
    }
    function trackList() { return TRACK.filter(t => t[0] !== 'C' || st.useC); }
    function resetSim() {
      sim = { n: 0, seq: [], hits: {} };
      trackList().forEach(t => { sim.hits[t[0]] = 0; });
      if (!trackList().some(t => t[0] === st.track)) st.track = 'A';
      Lab.clear(P.trackHost);
      P.trackHost.appendChild(h('label', { class: 'pl-label', text: 'Follow the event' }));
      const seg = Lab.seg(trackList().map(t => ({ label: tx(t[1]), value: t[0] })), st.track, v => { st.track = v; save(); paintSim(); });
      seg.classList.add('s5-trackseg');
      P.trackHost.appendChild(seg);
      paintSim();
    }
    function runSim(r) {
      if (!D) return;
      const left = SIM_CAP - sim.n;
      r = Math.min(r, left);
      if (r <= 0) { paintSim(); return; }
      const outs = D.sp.outs, eq = D.sp.equal, ps = outs.map(o => Number(o.p));
      for (let t = 0; t < r; t++) {
        const k = eq ? Math.floor(Math.random() * outs.length) : Lab.rand.weighted(ps);
        sim.seq.push(k);
        sim.n++;
        Object.keys(sim.hits).forEach(key => { if (D.m[key][k]) sim.hits[key]++; });
      }
      paintSim();
    }
    function paintSim() {
      if (!P.simStat || !D || !sim) return;
      const key = st.track, t = (TRACK.find(x => x[0] === key) || TRACK[0])[1];
      const pE = D.p[key], pe = Number(pE);
      const n = sim.n, hits = sim.hits[key] || 0;
      const words = L3.indexOf(key) >= 0 ? D.words[L3.indexOf(key)] : esc(setByKey(key).words);
      Lab.setHTML(P.simStat, n
        ? 'Event ' + tx(t) + ' (' + words + ') happened <b>' + fmtInt(hits) + '</b> times in <b>' + fmtInt(n) + '</b> runs, so its relative frequency is ' + tx('\\frac{' + K.intTex(hits) + '}{' + K.intTex(n) + '}' + decEq(hits, n)) + '. The probability is ' + tx('P(' + t + ')=' + pT(pE) + approx(pE)) + '; the gap between them is about ' + Lab.fmtDec(Math.abs(hits / n - pe), 4) + '.' + (n >= SIM_CAP ? ' <span class="muted">(Limit of ' + fmtInt(SIM_CAP) + ' runs reached — press Reset.)</span>' : '')
        : '<span class="muted">No runs yet. Each run picks one outcome' + (D.sp.equal ? ' (all ' + D.N + ' equally likely)' : ' with your probabilities') + ' and checks whether ' + tx(t) + ' happened.</span>');
      Lab.clear(P.simRecent);
      sim.seq.slice(-10).reverse().forEach(k => { const o = D.sp.outs[k], hit = D.m[key][k]; P.simRecent.appendChild(h('span', { class: 'ps-seq' + (hit ? ' in' : '') }, o.short, h('b', { text: hit ? ' ✓' : ' ✗' }))); });
      // running relative frequency
      Lab.clear(P.simChart);
      const Wd = 640, Hh = 170, pl = 34, pr = 10, pt = 10, pb = 22;
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + Hh, class: 'ps-svg' });
      const Y = v => pt + (1 - v) * (Hh - pt - pb);
      [0, 0.25, 0.5, 0.75, 1].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(v), y2: Y(v), class: 'ps-grid' })); s.appendChild(svg('text', { x: pl - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'ps-tick' }, String(v))); });
      s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(pe), y2: Y(pe), class: 'ps-theory' }));
      s.appendChild(svg('text', { x: Wd - pr, y: Y(pe) - 5, 'text-anchor': 'end', class: 'ps-tlabel' }, 'probability ≈ ' + Lab.fmtDec(pe, 3)));
      if (n > 1) {
        const pts = Math.min(600, n), hist = [];
        let h2 = 0, next = 0;
        for (let i = 0; i < n; i++) {
          if (D.m[key][sim.seq[i]]) h2++;
          if (i >= next || i === n - 1) { hist.push([i + 1, h2 / (i + 1)]); next = Math.floor(((hist.length) * n) / pts); }
        }
        const X = c => pl + ((c - 1) / Math.max(1, n - 1)) * (Wd - pl - pr);
        s.appendChild(svg('path', { d: hist.map((q, i) => (i ? 'L' : 'M') + X(q[0]).toFixed(1) + ',' + Y(q[1]).toFixed(1)).join(' '), class: 'ps-line' }));
      }
      s.appendChild(svg('text', { x: (Wd + pl) / 2, y: Hh - 4, 'text-anchor': 'middle', class: 'ps-tick' }, n ? 'relative frequency after 1 … ' + fmtInt(n) + ' runs' : 'relative frequency'));
      P.simChart.appendChild(s);
      // every tracked event at once
      Lab.clear(P.simTable);
      const tbl = h('table', { class: 'tbl s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, ['Event', 'happened', 'relative frequency', 'probability'].map(x => h('th', { text: x })))));
      const tb = h('tbody');
      trackList().forEach(([k2, t2]) => {
        const hk = sim.hits[k2] || 0;
        tb.appendChild(h('tr', { class: k2 === key ? 'hl-row' : '' }, h('td', { html: tx(t2) }), h('td', { text: fmtInt(hk) + ' of ' + fmtInt(n), 'data-l': 'happened' }), h('td', { html: n ? tx('\\frac{' + K.intTex(hk) + '}{' + K.intTex(n) + '}' + decEq(hk, n)) : '—', 'data-l': 'relative frequency' }), h('td', { html: tx(pT(D.p[k2]) + approx(D.p[k2])), 'data-l': 'probability' })));
      });
      tbl.appendChild(tb);
      P.simTable.appendChild(wrapCells(tbl));
      if (P.rfCard) {
        const hA = sim.hits.A || 0;
        Lab.setHTML(P.rfCard, n ? 'Your runs so far: ' + tx('\\frac{' + K.intTex(hA) + '}{' + K.intTex(n) + '}' + decEq(hA, n)) + ' (true ' + tx('P(A)=' + pT(D.p.A) + approx(D.p.A)) + ').' : '<span class="muted">Press a Run button below; the fraction of runs in which ' + tx('A') + ' happens appears here.</span>');
      }
    }

    build();
  }

  Lab.lab({
    id: 'lab-s1-events', course: 's1', week: 7, order: 2,
    title: 'Events and Venn lab', sub: 'Week 7 · events, axioms, addition rule',
    topics: ['sample space', 'events', 'Venn diagram', 'union, intersection, complement', 'axioms', 'addition rule', 'equally likely', 'relative frequency', 'lecture examples'],
    desc: 'Choose a die, two dice, a card, n coins, a race, your own outcomes — or just the probabilities, as in the lecture’s word problems. Define events A, B and C by a rule or by clicking outcomes; see the grid, a proportional Venn diagram with an always-to-scale bar, every set written out, the addition and complement rules with your numbers, the axioms and a simulation. Loads the professor’s examples.',
    render: host => eventsLab(host),
  });
})();
