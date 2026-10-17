/* Playground lab (s1-w08-bayes) — Statistics I, Week 8 (L8.1–L8.7): contingency tables, conditional probability,
   multiplication rule, independence (with complements), disjoint vs independent, total probability, Bayes' rule.
   Tab 3 reuses the Week 7 lab's sample spaces, event rules and outcome grid (Lab.play.s1ev, labs/s1-w07-events.js). */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const K = Lab.play;
  const tx = (s, d) => Lab.tex(s, d);
  const esc = Lab.esc;
  const fmtInt = n => K.fmtInt(n);
  const user = s => '<span class="no-math">' + esc(s) + '</span>';
  const TEXESC = { '\\': '/', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#', '^': '\\textasciicircum{}', '_': '\\_', '%': '\\%', '~': '\\textasciitilde{}' };
  const texText = s => '\\text{' + String(s).replace(/[\\{}$&#^_%~]/g, c => TEXESC[c]) + '}';
  /** Decimal mode: when every typed probability is a decimal (the lecture's 0.2, 0.1, 0.05), exact decimals are shown as decimals. */
  let DEC = false;
  const isDec = f => DEC && f instanceof Lab.Frac && K.exactDecimal(f);
  const pT = f => (isDec(f) ? Lab.fmtDec(Number(f), 4) : K.pTex(f));
  /** Decimal tail of a probability, taken from the kit's K.pTexApprox: '=0.75' when exact, '\\approx 0.3056' otherwise, '' for whole numbers. */
  const approx = f => { if (isDec(f)) return ''; const t = K.pTex(f), a = K.pTexApprox(f); return a.indexOf(t) === 0 ? a.slice(t.length) : ''; };
  const dec = f => Lab.fmtDec(Number(f), 4);
  const ok = '<span class="cgood">✓</span>', no = '<span class="cbad">✗</span>';
  const SUB = ['₁', '₂', '₃', '₄'];
  /** A count (whole numbers with thin spaces; otherwise a fraction). */
  const cTex = f => (f.d === 1 ? K.intTex(f.n) : pT(f));
  /** a/b for two counts, then "= reduced" when it changes. */
  function ratio(a, b) {
    const raw = '\\frac{' + cTex(a) + '}{' + cTex(b) + '}';
    if (a.isZero()) return raw + '=0';
    const q = a.div(b);
    const same = a.d === 1 && b.d === 1 && q.n === a.n && q.d === b.n;
    return raw + (same ? '' : '=' + pT(q));
  }
  /** Wrap each cell's content in one span, so stacked (phone) rows keep text and maths together. */
  const wrapCells = tbl => { tbl.querySelectorAll('td').forEach(td => { const w = h('span', { class: 's5-v' }); while (td.firstChild) w.appendChild(td.firstChild); td.appendChild(w); }); return tbl; };
  const KEY = 'lab:lab-s1-bayes';

  /* ================================================================ state */
  const defTable = () => ({ xs: ['No', 'Yes'], ys: ['Female', 'Male'], cells: [['10', '34'], ['14', '42']], A: 'c1', B: 'r0', cond: 'row', rowVar: 'Gender', colVar: 'Owns a smartphone' });
  const defBayes = () => ({ k: 2, ename: 'tests positive', names: ['has the condition', 'does not have it', 'hypothesis 3', 'hypothesis 4'], priors: ['1/100', '99/100', '0', '0'], likes: ['9/10', '1/20', '1/2', '1/2'], obs: 'E', focus: 0, N: 0 });
  const defIndep = () => ({
    space: 'die', useG: false, click: 'E', n: 2,
    evs: {
      coins: { E: { rule: 'tossH', i: 2 }, F: { rule: 'tossH', i: 1 }, G: { rule: 'same' } },
      die: { E: { rule: 'even' }, F: { rule: 'le', a: 2 }, G: { rule: 'prime' } },
      dice: { E: { rule: 'first', a: 6 }, F: { rule: 'sumEq', s: 7 }, G: { rule: 'doubles' } },
      card: { E: { rule: 'suit', s: '♥' }, F: { rule: 'rank', r: 'K' }, G: { rule: 'face' } },
    },
  });
  function loadState() {
    const s = Lab.store.get(KEY, null) || {};
    const st = { tab: ['table', 'bayes', 'indep'].indexOf(s.tab) >= 0 ? s.tab : 'table' };
    st.table = Object.assign(defTable(), s.table && typeof s.table === 'object' ? s.table : {});
    const t = st.table;
    if (!Array.isArray(t.xs) || !Array.isArray(t.ys) || !Array.isArray(t.cells) || t.cells.length !== t.ys.length || t.cells.some(r => !Array.isArray(r) || r.length !== t.xs.length)) st.table = defTable();
    if (typeof st.table.rowVar !== 'string') st.table.rowVar = 'row';
    if (typeof st.table.colVar !== 'string') st.table.colVar = 'column';
    st.bayes = Object.assign(defBayes(), s.bayes && typeof s.bayes === 'object' ? s.bayes : {});
    const b = st.bayes, d = defBayes();
    ['names', 'priors', 'likes'].forEach(k => { if (!Array.isArray(b[k]) || b[k].length < 4) b[k] = d[k]; });
    b.k = Math.max(2, Math.min(4, Math.round(Number(b.k)) || 2));
    st.indep = Object.assign(defIndep(), s.indep && typeof s.indep === 'object' ? s.indep : {});
    const di = defIndep();
    if (['die', 'dice', 'card', 'coins'].indexOf(st.indep.space) < 0) st.indep.space = 'die';
    st.indep.n = Math.max(1, Math.min(4, Math.round(Number(st.indep.n)) || 2));
    st.indep.evs = Object.assign(di.evs, st.indep.evs && typeof st.indep.evs === 'object' ? st.indep.evs : {});
    ['die', 'dice', 'card', 'coins'].forEach(k => { const fresh = defIndep().evs[k]; if (!st.indep.evs[k]) st.indep.evs[k] = fresh; ['E', 'F', 'G'].forEach(L => { if (!st.indep.evs[k][L] || typeof st.indep.evs[k][L] !== 'object') st.indep.evs[k][L] = fresh[L]; }); });
    return st;
  }

  /** Probability box (1/3, 0.25, 25%) + slider. onChange(Frac | null, text). note(f) adds a line under it. */
  function pField({ label, value, onChange, note }) {
    const input = h('input', { class: 'field mono pl-num pl-prob', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal' });
    const range = h('input', { class: 'slider pl-range', type: 'range', min: 0, max: 1, step: 0.01, 'aria-label': 'slider' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), msg);
    const paint = f => { const v = Number(f); range.value = v; range.style.setProperty('--pct', v * 100 + '%'); };
    const show = f => { input.classList.remove('bad'); Lab.setHTML(msg, (f.d === 1 || f.approx ? '' : (K.exactDecimal(f) ? '= ' : '≈ ') + dec(f) + ' ') + (note ? note(f) : '')); };
    const bad = () => { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Type a number from 0 to 1 — for example 1/3, 0.25 or 25%.</span>'); };
    input.addEventListener('input', () => { const f = K.parseProb(input.value); if (!f) { bad(); onChange(null, input.value); return; } paint(f); show(f); onChange(f, input.value); });
    range.addEventListener('input', () => { const s = String(parseFloat(range.value)); input.value = s; const f = K.parseProb(s); paint(f); show(f); onChange(f, s); });
    const f0 = K.parseProb(value);
    if (f0) { paint(f0); show(f0); } else bad();
    wrap.input = input;
    return wrap;
  }
  const resetBtn = fn => h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start this tab again</span>', fn, 'btn ghost sm'));

  /* ==================================================== TAB 1 · TABLE */
  const W8 = {
    cont: 'Lecture: Conditional probability – contingency tables',
    formula: 'Lecture: Conditional probability – conditional probability formula',
    mult: 'Lecture: Conditional probability – multiplication rule',
    indep: 'Lecture: Conditional probability – independent events',
    examples: 'Lecture: Conditional probability – independent events: examples',
    props: 'Lecture: Conditional probability – independent events: properties',
    bayes: 'Lecture: Conditional probability – Bayes’ rule',
    tut: n => 'Tutorial (Week 8, no. ' + n + ')',
  };
  const PHONE = { xs: ['No', 'Yes'], ys: ['Female', 'Male'], cells: [[10, 34], [14, 42]], rowVar: 'Gender', colVar: 'Owns a smartphone' };
  const ACES = (cells, n) => ({ xs: ['Spade', 'Not spade'], ys: ['Ace', 'Not ace'], cells, rowVar: 'Card (' + n + ' in the deck)', colVar: 'Suit', A: 'r0', B: 'c0' });
  const TABLE_PRESETS = [
    Object.assign({ label: 'Lecture · Smartphone by gender: P(owns one | female)', source: W8.cont + ', at 05:30–08:00 (counts for 100 people: 10, 34, 14, 42) and 13:30–18:00 (“among female buyers, what is the chance someone owns a phone?” — restrict to the Female row: 34/44).', A: 'c1', B: 'r0' }, PHONE),
    Object.assign({ label: 'Lecture · Smartphone by gender: P(no phone | female)', source: W8.cont + ', at 18:00–19:00 (restricted to females, 10 of 44 do not own a phone: (10/100)/(44/100) = 10/44).', A: 'c0', B: 'r0' }, PHONE),
    Object.assign({ label: 'Lecture · Smartphone by gender: P(male | no phone)', source: W8.cont + ', at 19:00–20:30 (“among people who don’t own a phone, how many are male?” — restrict to the No column: 14/24).', A: 'r1', B: 'c0' }, PHONE),
    { label: 'Tutorial · Voters per 10,000: P(man | voted)', source: W8.tut(3) + ', at 00:00–05:00: 54% women, 46% men; 68% of women and 62% of men voted, giving 0.3672N, 0.1728N, 0.2852N, 0.1748N. With N = 10,000 these are counts. Answer 0.2852/(0.3672 + 0.2852) ≈ 0.43715.', xs: ['Voted', 'Did not vote'], ys: ['Women', 'Men'], cells: [[3672, 1728], [2852, 1748]], rowVar: 'Voter', colVar: 'Last election', A: 'r1', B: 'c0' },
    Object.assign({ label: 'Tutorial · Ace and spade, standard deck (independent)', source: W8.tut(4) + ', at 00:00–04:30: P(A) = 4/52 = 1/13, P(B) = 13/52 = 1/4, P(ace | spade) = 1/13 = P(A).' }, ACES([[1, 3], [12, 36]], 52)),
    Object.assign({ label: 'Tutorial · Ace and spade, all 13 hearts removed (still independent)', source: W8.tut(4) + ', at 04:30–06:00: 39 cards, P(A) = 3/39 = 1/13, P(B) = 13/39 = 1/3, P(A ∩ B) = 1/39 = 1/13 × 1/3.' }, ACES([[1, 2], [12, 24]], 39)),
    Object.assign({ label: 'Tutorial · Ace and spade, hearts 2–9 removed (dependent)', source: W8.tut(4) + ', at 06:00–08:30: 44 cards, P(A) = 4/44 = 1/11, P(ace | spade) = 1/13 ≠ 1/11; P(A ∩ B) = 1/44 ≠ 1/11 × 13/44.' }, ACES([[1, 3], [12, 28]], 44)),
    { label: 'Tutorial · Car battery: P(past 20,000 miles | past 10,000 miles)', source: W8.tut(5) + ', at 00:00–05:30: P(past 10,000 miles) = 0.8 and P(past 20,000 miles) = 0.4. A battery that lasts 20,000 miles has already lasted 10,000 (one set inside the other in the tutorial’s Venn diagram), so P(both) = 0.4 and P(past 20,000 | past 10,000) = 0.4/0.8 = 0.5. (The tutorial’s letters are the other way round: its A is “past 10,000” and its B is “past 20,000”.) Here the probabilities are written as counts per 1,000 batteries; the 0 says no battery passes 20,000 miles without passing 10,000.', xs: ['Lasts past 20,000', 'Dies by 20,000'], ys: ['Lasts past 10,000', 'Dies by 10,000'], cells: [[400, 400], [0, 200]], rowVar: 'First 10,000 miles', colVar: 'First 20,000 miles', A: 'c0', B: 'r0' },
    { label: 'Tutorial · Car battery: P(past 30,000 miles | past 10,000 miles)', source: W8.tut(5) + ', at 05:00–05:30: P(past 30,000 miles) = 0.1 and every one of those batteries passed 10,000 miles, so P(past 30,000 | past 10,000) = 0.1/0.8 = 0.125 (the tutorial’s P(C | A)). Counts per 1,000 batteries.', xs: ['Lasts past 30,000', 'Dies by 30,000'], ys: ['Lasts past 10,000', 'Dies by 10,000'], cells: [[100, 700], [0, 200]], rowVar: 'First 10,000 miles', colVar: 'First 30,000 miles', A: 'c0', B: 'r0' },
    { label: 'Own example · Exam result by mode of study (independent)', source: 'This lab’s own numbers: 120 online and 80 offline students; 70% pass in both groups.', xs: ['Online', 'Offline'], ys: ['Passed', 'Failed'], cells: [[84, 56], [36, 24]], rowVar: 'Result', colVar: 'Mode of study', A: 'r0', B: 'c0' },
    { label: 'Own example · Spam filter: flagged vs really spam', source: 'This lab’s own numbers for 200 e-mails.', xs: ['Spam', 'Not spam'], ys: ['Flagged', 'Not flagged'], cells: [[45, 15], [5, 135]], rowVar: 'Filter', colVar: 'E-mail', A: 'r0', B: 'c0' },
    { label: 'Own example · Favourite drink by age group (3 × 3)', source: 'This lab’s own survey numbers for 240 people.', xs: ['18–30', '31–50', '51+'], ys: ['Tea', 'Coffee', 'Neither'], cells: [[20, 30, 40], [50, 40, 20], [10, 10, 20]], rowVar: 'Drink', colVar: 'Age', A: 'r1', B: 'c0' },
    { label: 'Own example · Two rows as events: A and B both rows', source: 'This lab’s own numbers. A and B are two different rows, so they cannot happen together: P(A | B) = 0.', xs: ['Morning', 'Evening'], ys: ['Bus', 'Train', 'Walk'], cells: [[30, 20], [15, 25], [5, 5]], rowVar: 'Travel', colVar: 'Time', A: 'r0', B: 'r1' },
  ];
  function tableModel(xs, ys, cells) {
    const rT = cells.map(r => F.sum(r));
    const cT = xs.map((_, i) => F.sum(cells.map(r => r[i])));
    return { xs: xs.map(String), ys: ys.map(String), n: cells, R: ys.length, C: xs.length, rT, cT, N: F.sum(rT) };
  }
  function tableTab(host, st, save) {
    const S = st.table;
    let T = null, stale = false;
    const ctl = {}, P = {};
    const { side, main } = K.layout(host, 's5-by-lab');
    ctl.presets = K.presets({ label: 'Examples to load', items: TABLE_PRESETS, onPick: it => { S.A = it.A; S.B = it.B; S.cond = it.B[0] === 'r' ? 'row' : 'col'; S.rowVar = it.rowVar || 'row'; S.colVar = it.colVar || 'column'; ctl.rowVar.input.value = S.rowVar; ctl.colVar.input.value = S.colVar; ctl.grid.set(it.xs, it.ys, it.cells); } });
    side.appendChild(ctl.presets);
    side.appendChild(K.group('1 · Your table of counts'));
    ctl.grid = K.gridEditor({ label: 'Type the counts. Rename the rows (orange) and columns (blue) in their boxes.', xs: S.xs, ys: S.ys, cells: S.cells, mode: 'count', xName: '\\text{column}', yName: '\\text{row}', onChange: onGrid });
    side.appendChild(ctl.grid);
    ctl.rowVar = K.textField({ label: 'The rows are (variable)', value: S.rowVar, mono: false, onChange: v => { S.rowVar = v; save(); draw(); } });
    ctl.colVar = K.textField({ label: 'The columns are (variable)', value: S.colVar, mono: false, onChange: v => { S.colVar = v; save(); draw(); } });
    side.append(ctl.rowVar, ctl.colVar);
    side.appendChild(K.group('2 · Your events'));
    ctl.A = K.selectField({ label: 'Event ' + tx('A'), options: [], value: S.A, onChange: v => { S.A = v; save(); draw(); } });
    ctl.B = K.selectField({ label: 'Event ' + tx('B') + ' — the condition (what you are told)', options: [], value: S.B, onChange: v => { S.B = v; S.cond = v[0] === 'r' ? 'row' : 'col'; save(); draw(); } });
    side.append(ctl.A, ctl.B, K.note('An event is a whole row or a whole column of your table. ' + tx('P(A\\mid B)') + ' is read “the probability of ' + tx('A') + ' given ' + tx('B') + '”.'));
    side.appendChild(resetBtn(() => { st.table = defTable(); save(); host.dispatchEvent(new CustomEvent('s5-restart')); }));

    P.answer = K.answer();
    P.table = K.panel('Your table, with its totals');
    P.joint = K.panel('Joint and marginal probabilities', 'Divide every count by the grand total ' + tx('N') + '. A cell gives a joint probability (row <b>and</b> column); a total gives a marginal probability.');
    P.cond = K.panel('Conditional probabilities: restrict, then re-normalise');
    P.calc = K.panel('How ' + tx('P(A\\mid B)') + ' is computed, with your numbers', tx('n(\\cdot)') + ' is a count from your table: ' + tx('n(B)') + ' = how many are in ' + tx('B') + '.');
    P.ind = K.panel('Are ' + tx('A') + ' and ' + tx('B') + ' independent?');
    main.append(P.answer, P.table, P.joint, P.cond, P.calc, P.ind);

    function onGrid(g) {
      if (!g.ok) { stale = true; drawStale(); return; }
      if (g.total.isZero()) { stale = true; drawStale('Every count is 0. Type at least one positive count.'); return; }
      stale = false;
      S.xs = g.xs.map(String); S.ys = g.ys.map(String); S.cells = g.cells.map(r => r.map(f => f.toString()));
      T = tableModel(S.xs, S.ys, g.cells);
      syncOptions();
      save();
      draw();
    }
    function syncOptions() {
      const opts = T.ys.map((y, j) => ({ value: 'r' + j, label: 'row: ' + y })).concat(T.xs.map((x, i) => ({ value: 'c' + i, label: 'column: ' + x })));
      const valid = v => opts.some(o => o.value === v);
      if (!valid(S.A)) S.A = 'r0';
      if (!valid(S.B)) S.B = 'c0';
      [[ctl.A, S.A], [ctl.B, S.B]].forEach(([c, v]) => { Lab.clear(c.select); opts.forEach(o => c.select.appendChild(h('option', { value: o.value, text: o.label }))); c.select.value = v; });
    }
    const isRow = spec => spec[0] === 'r';
    const idx = spec => +spec.slice(1);
    const inEv = (spec, i, j) => (isRow(spec) ? j === idx(spec) : i === idx(spec));
    const label = spec => (isRow(spec) ? T.ys[idx(spec)] : T.xs[idx(spec)]);
    const evDesc = spec => (isRow(spec) ? 'row “' + user(label(spec)) + '”' : 'column “' + user(label(spec)) + '”');
    const sumWhere = f => { let s = F(0); T.n.forEach((r, j) => r.forEach((v, i) => { if (f(i, j)) s = s.add(v); })); return s; };
    const cellsWhere = f => { const out = []; T.n.forEach((r, j) => r.forEach((v, i) => { if (f(i, j)) out.push(v); })); return out; };
    const sumTex = list => (list.length === 0 ? '0' : list.length <= 8 ? list.map(cTex).join('+') : list.slice(0, 6).map(cTex).join('+') + '+\\dots');
    function drawStale(msg) {
      if (!T) { K.setAnswer(P.answer, { ev: '<span class="cbad">' + (msg || 'Fix the red boxes in your table.') + '</span>' }); return; }
      const warn = P.answer.querySelector('.s5-stale') || h('div', { class: 's5-stale' });
      Lab.setHTML(warn, '<span class="cbad">' + (msg || 'Your table has a problem — see the red message under it.') + '</span> Everything below still shows your last valid table.');
      P.answer.prepend(warn);
    }

    function draw() {
      if (!T) return;
      DEC = false;
      const A = S.A, B = S.B, N = T.N;
      const nA = sumWhere((i, j) => inEv(A, i, j)), nB = sumWhere((i, j) => inEv(B, i, j));
      const nAB = sumWhere((i, j) => inEv(A, i, j) && inEv(B, i, j));
      const D = { A, B, N, nA, nB, nAB, nAcB: nB.sub(nAB) };
      drawAnswer(D); drawTable(D); drawJoint(D); drawCond(D); drawCalc(D); drawInd(D);
    }
    function drawAnswer(D) {
      const ev = tx('A') + ' = ' + evDesc(D.A) + ' &nbsp;·&nbsp; ' + tx('B') + ' = ' + evDesc(D.B) + ' &nbsp;·&nbsp; ' + tx('N=' + cTex(D.N)) + ' in your table';
      if (D.nB.isZero()) {
        K.setAnswer(P.answer, { ev, big: 'P(A\\mid B)\\text{ is not defined}', sub: 'The total of ' + evDesc(D.B) + ' is 0, so ' + tx('P(B)=0') + '. You cannot condition on an event that never happens (the definition needs ' + tx('P(B)>0') + ').' });
        return;
      }
      const q = D.nAB.div(D.nB);
      K.setAnswer(P.answer, {
        ev,
        big: '\\begin{aligned}P(A\\mid B)&=\\frac{P(A\\cap B)}{P(B)}=\\frac{' + cTex(D.nAB) + '/' + cTex(D.N) + '}{' + cTex(D.nB) + '/' + cTex(D.N) + '}\\\\&=' + ratio(D.nAB, D.nB) + approx(q) + '\\end{aligned}',
        sub: 'Restrict to ' + evDesc(D.B) + ' (' + tx('n(B)=' + cTex(D.nB)) + ') and ask what fraction of it is also in ' + tx('A') + ': ' + tx(cTex(D.nAB)) + ' of ' + tx(cTex(D.nB)) + '. The grand total ' + tx('N=' + cTex(D.N)) + ' cancels.',
      });
      if (stale) drawStale();
    }
    /* a table of the learner's rows and columns; cell(i, j) / rowTot(j) / colTot(i) / corner() return {html, cls} */
    function grid(cell, rowTot, colTot, corner, opts = {}) {
      const tbl = h('table', { class: 'tbl s5-ct' });
      const head = h('tr', {}, h('th', { class: 's5-corner2', html: opts.cornerHead || user(S.rowVar || 'row') + ' \\ ' + user(S.colVar || 'column') }));
      T.xs.forEach((x, i) => head.appendChild(h('th', { class: 's5-colh', html: user(x) + (opts.mark ? opts.mark('c', i) : '') })));
      if (rowTot) head.appendChild(h('th', { text: opts.totHead || 'Total' }));
      tbl.appendChild(h('thead', {}, head));
      const tb = h('tbody');
      T.ys.forEach((y, j) => {
        const tr = h('tr', {}, h('th', { class: 's5-rowh', html: user(y) + (opts.mark ? opts.mark('r', j) : '') }));
        T.xs.forEach((_, i) => { const c = cell(i, j); tr.appendChild(h('td', { class: c.cls || '', html: c.html })); });
        if (rowTot) { const c = rowTot(j); tr.appendChild(h('td', { class: 's5-tot2 ' + (c.cls || ''), html: c.html })); }
        tb.appendChild(tr);
      });
      if (colTot) {
        const tr = h('tr', { class: 's5-totrow' }, h('th', { text: opts.totHead || 'Total' }));
        T.xs.forEach((_, i) => { const c = colTot(i); tr.appendChild(h('td', { class: 's5-tot2 ' + (c.cls || ''), html: c.html })); });
        if (rowTot) { const c = corner(); tr.appendChild(h('td', { class: 's5-tot2 ' + (c.cls || ''), html: c.html })); }
        tb.appendChild(tr);
      }
      tbl.appendChild(tb);
      return h('div', { class: 'tbl-wrap s5-ctwrap' }, tbl);
    }
    const cellCls = (D, i, j) => { const a = inEv(D.A, i, j), b = inEv(D.B, i, j); return a && b ? 's5-inAB' : a ? 's5-inA' : b ? 's5-inB' : ''; };
    const markHead = D => (kind, k) => { const spec = kind + k; return (spec === D.A ? '<i class="s5-evtag s5-a">A</i>' : '') + (spec === D.B ? '<i class="s5-evtag s5-b">B</i>' : ''); };
    function legend() {
      return K.note('<span class="s5-key s5-kA"></span> in ' + tx('A') + ' only &nbsp; <span class="s5-key s5-kB"></span> in ' + tx('B') + ' only &nbsp; <span class="s5-key s5-kAB"></span> in both (' + tx('A\\cap B') + ')', 's5-legend');
    }
    function drawTable(D) {
      const body = P.table.body;
      Lab.clear(body);
      P.table.sub('Counts as you typed them. Row totals on the right, column totals at the bottom, the grand total ' + tx('N=' + cTex(D.N)) + ' in the corner.');
      body.appendChild(grid((i, j) => ({ html: tx(cTex(T.n[j][i])), cls: cellCls(D, i, j) }), j => ({ html: tx(cTex(T.rT[j])), cls: D.B === 'r' + j ? 's5-inB' : D.A === 'r' + j ? 's5-inA' : '' }), i => ({ html: tx(cTex(T.cT[i])), cls: D.B === 'c' + i ? 's5-inB' : D.A === 'c' + i ? 's5-inA' : '' }), () => ({ html: '<b>' + tx(cTex(D.N)) + '</b>' }), { mark: markHead(D) }));
      body.appendChild(legend());
    }
    function drawJoint(D) {
      const body = P.joint.body;
      Lab.clear(body);
      body.appendChild(grid((i, j) => ({ html: tx(ratio(T.n[j][i], D.N)), cls: cellCls(D, i, j) }), j => ({ html: tx(ratio(T.rT[j], D.N)) }), i => ({ html: tx(ratio(T.cT[i], D.N)) }), () => ({ html: tx(ratio(D.N, D.N)) }), { mark: markHead(D) }));
      const r0 = T.ys[0], c0 = T.xs[0];
      body.appendChild(K.note('Example: ' + tx('P(' + texText(r0) + '\\cap ' + texText(c0) + ')=' + ratio(T.n[0][0], D.N)) + ' (the cell where they cross). Marginal: ' + tx('P(' + texText(r0) + ')=' + ratio(T.rT[0], D.N)) + ' (row total ÷ N). The marginals in each margin add to 1, and so do all the cells.', 'small muted'));
    }
    function drawCond(D) {
      const body = P.cond.body;
      Lab.clear(body);
      if (!S.cond) S.cond = isRow(D.B) ? 'row' : 'col';
      const seg = Lab.seg([{ label: 'Given the column', value: 'col' }, { label: 'Given the row', value: 'row' }], S.cond, v => { S.cond = v; save(); drawCond(D); });
      seg.classList.add('s5-condseg');
      body.appendChild(seg);
      if (S.cond === 'col') {
        P.cond.sub('Each column on its own: divide each count by its <b>column total</b>. Every column now adds up to 1 — it is the distribution of the rows <b>given</b> that column.');
        body.appendChild(grid((i, j) => ({ html: T.cT[i].isZero() ? '—' : tx(ratio(T.n[j][i], T.cT[i])), cls: cellCls(D, i, j) }), null, i => ({ html: T.cT[i].isZero() ? '<span class="muted">total 0</span>' : tx(ratio(T.cT[i], T.cT[i])) + ' ' + ok }), null, { mark: markHead(D), totHead: 'Sum' }));
      } else {
        P.cond.sub('Each row on its own: divide each count by its <b>row total</b>. Every row now adds up to 1 — it is the distribution of the columns <b>given</b> that row.');
        body.appendChild(grid((i, j) => ({ html: T.rT[j].isZero() ? '—' : tx(ratio(T.n[j][i], T.rT[j])), cls: cellCls(D, i, j) }), j => ({ html: T.rT[j].isZero() ? '<span class="muted">total 0</span>' : tx(ratio(T.rT[j], T.rT[j])) + ' ' + ok }), null, null, { mark: markHead(D), totHead: 'Sum' }));
      }
      // the slice for B, written out
      const cells = [];
      T.n.forEach((r, j) => r.forEach((v, i) => { if (inEv(D.B, i, j)) cells.push({ i, j, v }); }));
      if (D.nB.isZero()) { body.appendChild(K.note('<span class="cbad">' + evDesc(D.B) + ' has total 0: there is nothing to re-normalise.</span>')); return; }
      const lines = cells.map(c => { const nm = isRow(D.B) ? T.xs[c.i] : T.ys[c.j]; return '<div class="s5-slice' + (inEv(D.A, c.i, c.j) ? ' s5-inAB' : '') + '">' + user(nm) + ': ' + tx(ratio(c.v, D.nB)) + '</div>'; });
      body.appendChild(K.note('<b>Restrict to ' + tx('B') + '</b> = ' + evDesc(D.B) + ': keep only its ' + cells.length + ' cells and divide each by ' + tx('n(B)=' + sumTex(cells.map(c => c.v)) + '=' + cTex(D.nB)) + ':<div class="s5-slices">' + lines.join('') + '</div>They add up to ' + tx('\\frac{' + cTex(D.nB) + '}{' + cTex(D.nB) + '}=1') + ' ' + ok + ' — given ' + tx('B') + ', these are the only possibilities left.', 's5-slicebox'));
    }
    function drawCalc(D) {
      const body = P.calc.body;
      Lab.clear(body);
      const all = cellsWhere(() => true);
      const steps = [];
      steps.push({ html: '<b>Grand total.</b> Add every cell of your table:', math: 'N=' + (all.length <= 12 ? all.map(cTex).join('+') : '\\text{(sum of all ' + all.length + ' cells)}') + '=' + cTex(D.N) });
      const bCells = cellsWhere((i, j) => inEv(D.B, i, j));
      steps.push({ html: tx('B') + ' = ' + evDesc(D.B) + '. Add its cells:', math: 'n(B)=' + sumTex(bCells) + '=' + cTex(D.nB) + ',\\qquad P(B)=\\frac{n(B)}{N}=' + ratio(D.nB, D.N) });
      const abDesc = isRow(D.A) === isRow(D.B) ? (D.A === D.B ? tx('A') + ' and ' + tx('B') + ' are the same ' + (isRow(D.A) ? 'row' : 'column') + ', so ' + tx('A\\cap B=A') : 'two different ' + (isRow(D.A) ? 'rows' : 'columns') + ' never overlap, so ' + tx('A\\cap B=\\emptyset')) : 'the cell where ' + evDesc(D.A) + ' crosses ' + evDesc(D.B);
      steps.push({ html: tx('A\\cap B') + ': ' + abDesc + '.', math: 'n(A\\cap B)=' + cTex(D.nAB) + ',\\qquad P(A\\cap B)=\\frac{n(A\\cap B)}{N}=' + ratio(D.nAB, D.N) });
      if (D.nB.isZero()) { steps.push({ html: '<span class="cbad">' + tx('P(B)=0') + ', so ' + tx('P(A\\mid B)') + ' is not defined.</span>' }); body.appendChild(K.steps(steps)); return; }
      const q = D.nAB.div(D.nB), pB = D.nB.div(D.N), pA = D.nA.div(D.N), pAB = D.nAB.div(D.N);
      steps.push({ html: '<b>Definition of conditional probability</b> (needs ' + tx('P(B)>0') + '):', math: 'P(A\\mid B)=\\frac{P(A\\cap B)}{P(B)}=\\frac{' + pT(pAB) + '}{' + pT(pB) + '}=' + pT(q) + approx(q), note: 'Same thing with counts, because ' + tx('N') + ' cancels: ' + tx('\\frac{n(A\\cap B)/N}{n(B)/N}=\\frac{n(A\\cap B)}{n(B)}=' + ratio(D.nAB, D.nB)) + '.' });
      const qc = D.nAcB.div(D.nB);
      steps.push({ html: '<b>Given ' + tx('B') + ', ' + tx('A') + ' and ' + tx('A^c') + ' still split everything:</b> the rest of ' + tx('B') + ' is in ' + tx('A^c') + ': ' + tx('n(A^c\\cap B)=n(B)-n(A\\cap B)=' + cTex(D.nB) + '-' + cTex(D.nAB) + '=' + cTex(D.nAcB)) + '.', math: 'P(A^c\\mid B)=\\frac{n(A^c\\cap B)}{n(B)}=' + ratio(D.nAcB, D.nB) + ',\\qquad P(A\\mid B)+P(A^c\\mid B)=' + pT(q) + '+' + pT(qc) + '=' + pT(q.add(qc)), note: q.add(qc).eq(1) ? ok + ' adds to 1, as it must.' : '' });
      if (!D.nA.isZero()) {
        const r = D.nAB.div(D.nA);
        steps.push({ html: '<b>The other way round</b> is a different question: of the ' + tx(cTex(D.nA)) + ' in ' + tx('A') + ' (' + evDesc(D.A) + '), how many are in ' + tx('B') + '?', math: 'P(B\\mid A)=\\frac{n(A\\cap B)}{n(A)}=' + ratio(D.nAB, D.nA) + approx(r), note: r.eq(q) ? 'Here it happens to equal ' + tx('P(A\\mid B)') + ' — because ' + tx('P(A)=P(B)') + ' or both are 0 or 1.' : 'Not the same as ' + tx('P(A\\mid B)=' + pT(q)) + ': in general ' + tx('P(A\\mid B)\\ne P(B\\mid A)') + '.' });
      }
      steps.push({ html: '<b>Multiplication rule</b> (the definition turned around):', math: '\\begin{aligned}P(A\\cap B)&=P(A\\mid B)\\,P(B)=' + pT(q) + '\\times ' + pT(pB) + '=' + pT(q.mul(pB)) + (D.nA.isZero() ? '' : '\\\\&=P(B\\mid A)\\,P(A)=' + pT(D.nAB.div(D.nA)) + '\\times ' + pT(pA) + '=' + pT(D.nAB.div(D.nA).mul(pA))) + '\\end{aligned}', note: q.mul(pB).eq(pAB) ? ok + ' equals ' + tx('P(A\\cap B)=' + pT(pAB)) + ' from step 3.' : '' });
      body.appendChild(K.steps(steps));
    }
    function drawInd(D) {
      const body = P.ind.body;
      Lab.clear(body);
      const N = D.N;
      const pA = D.nA.div(N), pB = D.nB.div(N), pAB = D.nAB.div(N), prod = pA.mul(pB);
      const indep = pAB.eq(prod);
      P.ind.sub('Week 8: ' + tx('A') + ' and ' + tx('B') + ' are independent exactly when ' + tx('P(A\\cap B)=P(A)\\,P(B)') + ' — equivalently ' + tx('P(A\\mid B)=P(A)') + ' (when ' + tx('P(B)>0') + '): knowing ' + tx('B') + ' does not change the chance of ' + tx('A') + '.');
      const steps = [
        { html: 'The two marginals:', math: 'P(A)=\\frac{n(A)}{N}=' + ratio(D.nA, N) + ',\\qquad P(B)=\\frac{n(B)}{N}=' + ratio(D.nB, N) },
        { html: '<b>Product check</b>:', math: 'P(A)\\,P(B)=' + pT(pA) + '\\times ' + pT(pB) + '=' + pT(prod) + '\\quad\\text{vs}\\quad P(A\\cap B)=' + ratio(D.nAB, N), note: indep ? ok + ' Equal, so ' + tx('A') + ' and ' + tx('B') + ' are <b>independent</b>.' : no + ' Not equal (' + tx(pT(pAB) + (Number(pAB) > Number(prod) ? '>' : '<') + pT(prod)) + '), so ' + tx('A') + ' and ' + tx('B') + ' are <b>dependent</b>.' },
        { html: 'The same check in whole numbers (multiply both sides by ' + tx('N^2') + '):', math: 'n(A\\cap B)\\times N=' + cTex(D.nAB) + '\\times ' + cTex(N) + '=' + cTex(D.nAB.mul(N)) + '\\quad\\text{vs}\\quad n(A)\\times n(B)=' + cTex(D.nA) + '\\times ' + cTex(D.nB) + '=' + cTex(D.nA.mul(D.nB)) },
      ];
      if (!D.nB.isZero()) { const q = D.nAB.div(D.nB); steps.push({ html: 'Conditional form:', math: 'P(A\\mid B)=' + pT(q) + (q.eq(pA) ? '=' : '\\ne ') + 'P(A)=' + pT(pA), note: q.eq(pA) ? 'Learning ' + tx('B') + ' leaves the chance of ' + tx('A') + ' unchanged.' : 'Learning ' + tx('B') + ' ' + (Number(q) > Number(pA) ? 'raises' : 'lowers') + ' the chance of ' + tx('A') + ' from ' + tx(pT(pA)) + ' to ' + tx(pT(q)) + '.' }); }
      body.appendChild(K.steps(steps));
      // complements
      const nAc = N.sub(D.nA), nBc = N.sub(D.nB);
      const rows = [
        ['A\\cap B', D.nAB, D.nA, D.nB, 'P(A)\\,P(B)'],
        ['A\\cap B^c', D.nA.sub(D.nAB), D.nA, nBc, 'P(A)\\,P(B^c)'],
        ['A^c\\cap B', D.nB.sub(D.nAB), nAc, D.nB, 'P(A^c)\\,P(B)'],
        ['A^c\\cap B^c', N.sub(D.nA).sub(D.nB).add(D.nAB), nAc, nBc, 'P(A^c)\\,P(B^c)'],
      ];
      const tbl = h('table', { class: 'tbl s5-comp s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, ['Pair', 'joint: count ÷ N', 'product of the two marginals', 'equal?'].map(t => h('th', { text: t })))));
      const tb = h('tbody');
      rows.forEach(([t, nj, n1, n2, ptx]) => {
        const j = nj.div(N), pr = n1.div(N).mul(n2.div(N));
        tb.appendChild(h('tr', {}, h('td', { html: tx(t) }), h('td', { html: tx('P(' + t + ')=' + ratio(nj, N)), 'data-l': 'joint' }), h('td', { html: tx(ptx + '=' + pT(n1.div(N)) + '\\times ' + pT(n2.div(N)) + '=' + pT(pr)), 'data-l': 'product' }), h('td', { html: j.eq(pr) ? ok : no, 'data-l': 'equal?' })));
      });
      tbl.appendChild(tb);
      body.appendChild(K.note('<b>Complements.</b> If ' + tx('A') + ' and ' + tx('B') + ' are independent, so is every pair made from them and their complements (Week 8 notes). Your four pairs:', 's5-p'));
      body.appendChild(h('div', { class: 'tbl-wrap' }, wrapCells(tbl)));
      body.appendChild(K.note('Why: ' + tx('P(A\\cap B^c)=P(A)-P(A\\cap B)') + ', and if ' + tx('P(A\\cap B)=P(A)P(B)') + ' this is ' + tx('P(A)-P(A)P(B)=P(A)\\,(1-P(B))=P(A)\\,P(B^c)') + '.', 'small muted'));
      // whole table
      let bad = 0, first = null;
      T.n.forEach((r, j) => r.forEach((v, i) => { if (!v.mul(N).eq(T.rT[j].mul(T.cT[i]))) { bad++; if (!first) first = { i, j }; } }));
      const cells = T.R * T.C;
      body.appendChild(K.note('<b>The whole table.</b> The row variable and the column variable are independent only if <b>every</b> cell passes ' + tx('n_{\\text{cell}}\\times N=(\\text{row total})\\times(\\text{column total})') + '. ' + (bad === 0 ? ok + ' All ' + cells + ' cells pass.' : no + ' ' + bad + ' of the ' + cells + ' cells fail, for example row “' + user(T.ys[first.j]) + '”, column “' + user(T.xs[first.i]) + '”: ' + tx(cTex(T.n[first.j][first.i]) + '\\times ' + cTex(N) + '=' + cTex(T.n[first.j][first.i].mul(N)) + '\\ne ' + cTex(T.rT[first.j]) + '\\times ' + cTex(T.cT[first.i]) + '=' + cTex(T.rT[first.j].mul(T.cT[first.i]))) + '.'), 's5-p'));
    }

    // first picture straight away from the saved strings (the editor confirms a moment later)
    const parsed = S.cells.map(r => r.map(K.parseNum));
    if (parsed.every(r => r.every(f => f != null && Number(f) >= 0))) {
      T = tableModel(S.xs, S.ys, parsed);
      if (!T.N.isZero()) { syncOptions(); draw(); } else T = null;
    }
  }

  /* ===================================================== TAB 2 · BAYES */
  const BAYES_PRESETS = [
    { label: 'Lecture · Insurance: accident-prone policyholders', source: W8.bayes + ', at 10:30–15:30 (P(F) = 0.2 accident-prone; P(E | F) = 0.1, P(E | Fᶜ) = 0.05; total probability 0.1 × 0.2 + 0.05 × 0.8 = 0.06) and 20:30–23:00 (Bayes: 0.02/0.06 = 1/3).',
      k: 2, ename: 'has an accident in the first year', names: ['accident-prone', 'not accident-prone'], priors: ['0.2'], likes: ['0.1', '0.05'] },
    { label: 'Lecture · Two students picked without replacement', source: W8.mult + ', at 03:00–08:00: 23 males and 17 females; P(first female and second male) = 17/40 × 23/39 ≈ 0.251 — the violet path F₁ ∩ E in the tree. (P(E | F₂) = 22/39 completes the tree.)',
      k: 2, ename: 'the second student is male', names: ['the first student is female', 'the first student is male'], priors: ['17/40'], likes: ['23/39', '22/39'] },
    { label: 'Tutorial · Mammography', source: W8.tut(6) + ', at 00:00–03:00: 2% have breast cancer, 90% of them test positive, 10% of the others too; 0.02 × 0.9 = 0.018, 0.98 × 0.1 = 0.098, and 0.018/0.116 ≈ 0.1552.',
      k: 2, ename: 'the mammography is positive', names: ['has breast cancer', 'does not have it'], priors: ['0.02'], likes: ['0.9', '0.1'] },
    { label: 'Tutorial · Voters: P(man | voted)', source: W8.tut(3) + ', at 00:00–05:00: 54% women, 46% men; 68% of women and 62% of men voted; P(man | voted) = 0.2852/(0.3672 + 0.2852) ≈ 0.43715.',
      k: 2, ename: 'voted in the last election', names: ['a woman', 'a man'], priors: ['0.54'], likes: ['0.68', '0.62'], focus: 1 },
    { label: 'Tutorial · Defective disks: two-stage inspection', source: W8.tut(1) + ', at 00:00–01:30: the manual check spots a defect with probability 0.7, the electronic one with 0.8, so a defect is missed by both with probability 0.3 × 0.2 = 0.06 — the violet path F₂ ∩ E.',
      k: 2, ename: 'the defect is never detected', names: ['the manual check spots the defect', 'the manual check misses it'], priors: ['0.7'], likes: ['0', '0.2'], focus: 1 },
    { label: 'Own example · Medical test (prevalence, sensitivity, false positives)', source: 'Original numbers. Prior ' + 'P(F₁) = prevalence = 1/100; P(E | F₁) = sensitivity = 9/10; P(E | F₂) = false-positive rate = 1/20.',
      k: 2, ename: 'tests positive', names: ['has the condition', 'does not have it'], priors: ['1/100'], likes: ['9/10', '1/20'] },
    { label: 'Own example · Rain, traffic and being late (4 hypotheses)', source: 'Original numbers in the style of the Week 8 rain / traffic / late example (not the graded question). P(rain) = 1/4, P(heavy traffic | rain) = 3/5, P(heavy traffic | no rain) = 1/5, so P(F₁) = 1/4 × 3/5 = 3/20, P(F₂) = 1/4 × 2/5 = 1/10, P(F₃) = 3/4 × 1/5 = 3/20 and P(F₄) = 3/4 × 4/5 = 3/5.',
      k: 4, ename: 'you are late', names: ['rain and heavy traffic', 'rain and light traffic', 'no rain, heavy traffic', 'no rain, light traffic'], priors: ['3/20', '1/10', '3/20'], likes: ['1/2', '1/5', '2/5', '1/20'] },
    { label: 'Own example · Two urns', source: 'Original example. A fair coin picks urn 1 (3 red, 2 blue balls) or urn 2 (1 red, 4 blue); one ball is drawn. P(red | urn 1) = 3/5 because 3 of its 5 balls are red.',
      k: 2, ename: 'the ball is red', names: ['urn 1 (3 red, 2 blue)', 'urn 2 (1 red, 4 blue)'], priors: ['1/2'], likes: ['3/5', '1/5'] },
    { label: 'Own example · Three machines and a defective item', source: 'Original numbers: the machines make 50%, 30% and 20% of the items, with defect rates 1%, 2% and 3%.',
      k: 3, ename: 'the item is defective', names: ['machine 1 made it', 'machine 2 made it', 'machine 3 made it'], priors: ['1/2', '3/10'], likes: ['1/100', '1/50', '3/100'] },
  ];
  const HUE = ['s5h0', 's5h1', 's5h2', 's5h3'];
  function bayesModel(S) {
    const k = S.k, pr = [], lk = [];
    for (let i = 0; i < k - 1; i++) { const f = K.parseProb(S.priors[i]); if (!f) return { err: 'Fix the red boxes: each probability is a number from 0 to 1.' }; pr.push(f); }
    const used = F.sum(pr), rest = F(1).sub(used);
    if (Number(rest) < -1e-12) return { err: 'Your priors ' + tx(pr.map((_, i) => 'P(F_' + (i + 1) + ')').join('+')) + ' add up to ' + tx(pT(used)) + ', more than 1, so nothing is left for ' + tx('P(F_' + k + ')') + '. Lower one of them.' };
    pr.push(rest);
    for (let i = 0; i < k; i++) { const f = K.parseProb(S.likes[i]); if (!f) return { err: 'Fix the red boxes: each probability is a number from 0 to 1.' }; lk.push(f); }
    const obsE = S.obs !== 'Ec';
    const lkC = lk.map(l => F(1).sub(l));
    const L = obsE ? lk : lkC;
    const jE = pr.map((p, i) => p.mul(lk[i])), jC = pr.map((p, i) => p.mul(lkC[i]));
    const joint = obsE ? jE : jC;
    const tot = F.sum(joint);
    return { k, pr, lk, lkC, L, jE, jC, joint, tot, post: tot.isZero() ? null : joint.map(x => x.div(tot)), obsE, used };
  }
  function bayesTab(host, st, save) {
    const S = st.bayes;
    let M = null;
    const ctl = {}, P = {};
    const { side, main } = K.layout(host, 's5-by-lab');
    const Es = () => (S.obs === 'Ec' ? 'E^c' : 'E');
    ctl.presets = K.presets({ label: 'Examples to load', items: BAYES_PRESETS, onPick: it => {
      S.k = it.k; S.ename = it.ename;
      it.names.forEach((n, i) => { S.names[i] = n; });
      it.priors.forEach((p, i) => { S.priors[i] = p; });
      it.likes.forEach((p, i) => { S.likes[i] = p; });
      S.obs = 'E'; S.focus = it.focus || 0; S.N = 0;
      buildInputs(); draw();
    } });
    side.appendChild(ctl.presets);
    side.appendChild(K.group('1 · Your hypotheses (a partition)'));
    ctl.k = K.numField({ label: 'Number of hypotheses ' + tx('k'), min: 2, max: 4, value: S.k, onChange: v => { changeK(v); } });
    side.appendChild(ctl.k);
    ctl.inputs = h('div', { class: 's5-hyps' });
    side.appendChild(ctl.inputs);
    side.appendChild(K.group('2 · What you observed'));
    ctl.ename = K.textField({ label: tx('E') + ' (the evidence) means', value: S.ename, mono: false, onChange: v => { S.ename = v; draw(); } });
    side.appendChild(ctl.ename);
    ctl.obs = Lab.seg([{ label: tx('E') + ' happened', value: 'E' }, { label: tx('E^c') + ' happened', value: 'Ec' }], S.obs, v => { S.obs = v; draw(); });
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Which one did you see?' }), ctl.obs, K.note(tx('E^c') + ' means ' + tx('E') + ' did <b>not</b> happen (for a test: a negative result).')));
    ctl.focus = K.selectField({ label: 'Answer box shows the posterior of', options: [], value: String(S.focus), onChange: v => { S.focus = +v; draw(); } });
    side.appendChild(ctl.focus);
    side.appendChild(resetBtn(() => { st.bayes = defBayes(); save(); host.dispatchEvent(new CustomEvent('s5-restart')); }));

    P.answer = K.answer();
    P.tree = K.panel('The probability tree', 'First branch: which hypothesis is true (the priors). Second branch: whether ' + tx('E') + ' happens, given that hypothesis. Multiply along a path; the violet paths end in what you observed.');
    P.total = K.panel('Total probability of what you observed');
    P.bayes = K.panel('Bayes’ rule for every hypothesis');
    P.nat = K.panel('Natural frequencies: the same numbers as whole counts');
    P.bars = K.panel('Prior → posterior', 'Light bar = before the evidence, ' + tx('P(F_i)') + '. Violet bar = after it, ' + tx('P(F_i\\mid E)') + '.');
    main.append(P.answer, P.tree, P.total, P.bayes, P.nat, P.bars);

    function changeK(v) {
      if (v === S.k) return;
      // keep the full list of priors (the last one was computed) so a new hypothesis takes half of the old last one
      const m = bayesModel(S);
      const full = m.err ? S.priors.slice(0, S.k - 1).concat(['0']) : m.pr.map(f => f.toString());
      if (v > S.k) {
        for (let i = S.k; i < v; i++) { const last = K.parseProb(full[i - 1]) || F(0); const half = last.div(2); full[i - 1] = half.toString(); full[i] = half.toString(); if (!S.likes[i]) S.likes[i] = '1/2'; }
      }
      full.forEach((p, i) => { if (i < 4) S.priors[i] = p; });
      S.k = v;
      if (S.focus >= v) S.focus = 0;
      buildInputs(); draw();
    }
    function buildInputs() {
      Lab.clear(ctl.inputs);
      ctl.k.set(S.k);
      ctl.ename.input.value = S.ename;
      ctl.obs.set(S.obs);
      ctl.prior = []; ctl.last = null;
      for (let i = 0; i < S.k; i++) {
        const box = h('div', { class: 's5-hyp ' + HUE[i] });
        const head = h('div', { class: 's5-hyphead', html: '<b>F' + SUB[i] + '</b>' });
        const name = h('input', { class: 'field pl-text s5-hname', value: S.names[i], size: 4, spellcheck: 'false', 'aria-label': 'meaning of F' + (i + 1) });
        name.addEventListener('input', Lab.debounce(() => { S.names[i] = name.value; draw(); }, 150));
        head.appendChild(name);
        box.appendChild(head);
        if (i < S.k - 1) {
          const pf = pField({ label: 'Prior ' + tx('P(F_' + (i + 1) + ')'), value: S.priors[i], onChange: (f, s) => { S.priors[i] = s; draw(); } });
          ctl.prior.push(pf);
          box.appendChild(pf);
        } else {
          ctl.last = h('div', { class: 'pl-field s5-lastprior' });
          box.appendChild(ctl.last);
        }
        box.appendChild(pField({ label: 'Likelihood ' + tx('P(E\\mid F_' + (i + 1) + ')'), value: S.likes[i], onChange: (f, s) => { S.likes[i] = s; draw(); }, note: f => tx('P(E^c\\mid F_' + (i + 1) + ')=1-' + pT(f) + '=' + pT(F(1).sub(f))) }));
        ctl.inputs.appendChild(box);
      }
      ctl.inputs.appendChild(K.note('The likelihoods ' + tx('P(E\\mid F_i)') + ' do <b>not</b> need to add up to 1 — each one lives on its own branch. The priors do, because exactly one hypothesis is true.'));
      Lab.clear(ctl.focus.select);
      for (let i = 0; i < S.k; i++) ctl.focus.select.appendChild(h('option', { value: String(i), text: 'F' + SUB[i] + ' — ' + S.names[i] }));
      ctl.focus.select.value = String(S.focus);
    }
    const fName = i => tx('F_' + (i + 1)) + ' (' + user(S.names[i]) + ')';
    function draw() {
      save();
      DEC = S.priors.slice(0, S.k - 1).concat(S.likes.slice(0, S.k)).every(t => !/\//.test(String(t)));
      const m = bayesModel(S);
      // the last prior is always derived
      if (ctl.last) {
        const k = S.k;
        if (m.err) Lab.setHTML(ctl.last, '<label class="pl-label">Prior ' + tx('P(F_' + k + ')') + '</label><div class="pl-hint"><span class="cbad">' + m.err + '</span></div>');
        else Lab.setHTML(ctl.last, '<label class="pl-label">Prior ' + tx('P(F_' + k + ')') + ' — worked out for you</label><div class="s5-derived">' + tx('P(F_' + k + ')=1-' + (k > 2 ? '(' : '') + m.pr.slice(0, k - 1).map(pT).join('+') + (k > 2 ? ')' : '') + '=' + pT(m.pr[k - 1])) + '</div><div class="pl-hint">The hypotheses are exclusive and exhaustive, so their priors add to 1.</div>');
      }
      Array.from(ctl.focus.select.options).forEach((o, i) => { o.text = 'F' + SUB[i] + ' — ' + S.names[i]; });
      if (m.err) { if (!M) { K.setAnswer(P.answer, { ev: '<span class="cbad">' + m.err + '</span>' }); return; } const w = P.answer.querySelector('.s5-stale') || h('div', { class: 's5-stale' }); Lab.setHTML(w, '<span class="cbad">' + m.err + '</span> The pictures below still show your last valid numbers.'); P.answer.prepend(w); return; }
      M = m;
      drawAnswer(); drawTree(); drawTotal(); drawBayes(); drawNat(); drawBars();
    }
    function drawAnswer() {
      const m = M, f = Math.min(S.focus, m.k - 1), E = Es();
      const ev = tx('F_' + (f + 1)) + ' = ' + user(S.names[f]) + ' &nbsp;·&nbsp; ' + tx('E') + ' = ' + user(S.ename) + ' &nbsp;·&nbsp; you observed ' + tx(E);
      if (!m.post) { K.setAnswer(P.answer, { ev, big: 'P(' + E + ')=0', sub: 'What you observed has probability 0 under every hypothesis, so ' + tx('P(F_i\\mid ' + E + ')') + ' is not defined: Bayes’ rule would divide by 0.' }); return; }
      const sym = 'P(F_' + (f + 1) + '\\mid ' + E + ')&=\\frac{P(' + E + '\\mid F_' + (f + 1) + ')\\,P(F_' + (f + 1) + ')}{\\sum_{j=1}^{' + m.k + '}P(' + E + '\\mid F_j)\\,P(F_j)}';
      const num = pT(m.L[f]) + '\\times ' + pT(m.pr[f]);
      const den = m.L.map((l, j) => pT(l) + '\\times ' + pT(m.pr[j])).join('+');
      const big = '\\begin{aligned}' + sym + '\\\\&=\\frac{' + num + '}{' + den + '}\\\\&=\\frac{' + pT(m.joint[f]) + '}{' + pT(m.tot) + '}=' + pT(m.post[f]) + approx(m.post[f]) + '\\end{aligned}';
      const pr = m.pr[f], po = m.post[f];
      let change;
      if (pr.isZero()) change = 'A hypothesis with prior 0 stays at 0, whatever you observe.';
      else if (po.eq(pr)) change = 'The evidence did not change it: ' + tx('P(' + E + '\\mid F_' + (f + 1) + ')') + ' equals ' + tx('P(' + E + ')') + '.';
      else change = 'The evidence multiplied it by ' + tx('\\frac{P(F_' + (f + 1) + '\\mid ' + E + ')}{P(F_' + (f + 1) + ')}=\\frac{' + pT(po) + '}{' + pT(pr) + '}=' + pT(po.div(pr)) + approx(po.div(pr))) + '.';
      K.setAnswer(P.answer, { ev, big, sub: 'Before the evidence: ' + tx('P(F_' + (f + 1) + ')=' + pT(pr)) + '. After seeing ' + tx(E) + ': ' + tx('P(F_' + (f + 1) + '\\mid ' + E + ')=' + pT(po) + approx(po)) + '. ' + change });
    }
    function drawTree() {
      const body = P.tree.body;
      Lab.clear(body);
      const m = M, k = m.k, rowH = 34, top = 30;
      // narrow panels (phones) drop the meaning column: the meanings are in the controls and in the Bayes table
      const narrow = body.clientWidth > 0 && body.clientWidth < 600;
      const VW = narrow ? 340 : 720;
      const VH = top + 2 * k * rowH + 10;
      const s = svg('svg', { viewBox: '0 0 ' + VW + ' ' + VH, class: 's5-tree', role: 'img', 'aria-label': 'probability tree' });
      s.style.minWidth = Math.round(VW * (narrow ? 0.95 : 0.86)) + 'px';
      const leafY = n => top + rowH * n + rowH / 2;
      // columns: root | prior branch | F node + its meaning | likelihood branch | E or Eᶜ | path product
      const x0 = 12, x1 = narrow ? 92 : 128, nameX = x1 + 36, bx = narrow ? x1 + 34 : nameX + 176, x2 = bx + (narrow ? 100 : 118), xl = x2 + 36;
      const y0 = top + k * rowH;
      [[(x0 + x1) / 2, 'prior P(Fᵢ)'], [(bx + x2) / 2, 'likelihood'], [xl, narrow ? 'product' : 'path product']].forEach(([x, t], j) => s.appendChild(svg('text', { x, y: 14, 'text-anchor': j === 2 ? 'start' : 'middle', class: 's5-th' }, t)));
      s.appendChild(svg('circle', { cx: x0, cy: y0, r: 4.5, class: 'tr-root' }));
      for (let i = 0; i < k; i++) {
        const yE = leafY(2 * i), yC = leafY(2 * i + 1), yF = (yE + yC) / 2;
        s.appendChild(svg('path', { d: 'M' + x0 + ',' + y0 + ' C' + (x0 + 60) + ',' + y0 + ' ' + (x1 - 60) + ',' + yF + ' ' + (x1 - 4) + ',' + yF, class: 's5-edge' }));
        s.appendChild(svg('text', { x: x1 - 30, y: yF - 6, 'text-anchor': 'middle', class: 's5-ep' }, Lab.fmt(m.pr[i])));
        s.appendChild(svg('rect', { x: x1, y: yF - 13, width: 28, height: 26, rx: 7, class: 's5-fnode ' + HUE[i] }));
        s.appendChild(svg('text', { x: x1 + 14, y: yF + 5, 'text-anchor': 'middle', class: 's5-fl' }, 'F' + SUB[i]));
        if (!narrow) {
          const nm = S.names[i].length > 25 ? S.names[i].slice(0, 24) + '…' : S.names[i];
          const nt = svg('text', { x: nameX, y: yF + 4.5, class: 's5-fname' }, nm);
          nt.appendChild(svg('title', {}, S.names[i]));
          s.appendChild(nt);
          s.appendChild(svg('line', { x1: x1 + 28, x2: bx, y1: yF, y2: yF, class: 's5-edge s5-dash' }));
        }
        [[yE, 'E', m.lk[i], m.jE[i], m.obsE], [yC, 'Eᶜ', m.lkC[i], m.jC[i], !m.obsE]].forEach(([y, lab, pp, j, hot]) => {
          s.appendChild(svg('path', { d: 'M' + bx + ',' + yF + ' C' + (bx + 50) + ',' + yF + ' ' + (x2 - 50) + ',' + y + ' ' + (x2 - 4) + ',' + y, class: 's5-edge' + (hot ? ' hot' : '') }));
          s.appendChild(svg('text', { x: (bx + x2) / 2, y: (yF + y) / 2 + (lab === 'E' ? -7 : 15), 'text-anchor': 'middle', class: 's5-ep' + (hot ? ' hot' : '') }, Lab.fmt(pp)));
          s.appendChild(svg('text', { x: x2 + 2, y: y + 5, class: 's5-el' + (hot ? ' hot' : '') }, lab));
          s.appendChild(svg('text', { x: xl, y: y + 4.5, class: 's5-leaf' + (hot ? ' hot' : '') }, narrow ? '= ' + Lab.fmt(j) : Lab.fmt(m.pr[i]) + ' × ' + Lab.fmt(pp) + ' = ' + Lab.fmt(j)));
        });
      }
      body.appendChild(h('div', { class: 's5-treescroll' }, s));
      const E = Es();
      body.appendChild(K.note('Each path is the multiplication rule: path product ' + tx('P(F_i\\cap E)=P(F_i)\\,P(E\\mid F_i)') + ' (and the same with ' + tx('E^c') + '). The ' + (2 * k) + ' path products add up to 1: ' + tx(m.jE.concat(m.jC).map(pT).join('+') + '=' + pT(F.sum(m.jE.concat(m.jC)))) + ' ' + ok + '. You observed ' + tx(E) + ', so only the violet paths are still possible.', 'small muted'));
    }
    function drawTotal() {
      const body = P.total.body;
      Lab.clear(body);
      const m = M, E = Es(), k = m.k;
      P.total.sub('The hypotheses ' + tx(m.pr.map((_, i) => 'F_' + (i + 1)).join(',\\ ')) + ' are exclusive and exhaustive (exactly one is true), so ' + tx(E) + ' happens along exactly one of the violet paths. Add them up.');
      const steps = [];
      if (!m.obsE) steps.push({ html: 'You observed ' + tx('E^c') + ', so each likelihood is the complement: ' + tx('P(E^c\\mid F_i)=1-P(E\\mid F_i)') + ': ' + m.lk.map((l, i) => tx('1-' + pT(l) + '=' + pT(m.L[i]))).join(', ') + '.' });
      steps.push({ html: 'One product per hypothesis (multiplication rule):', math: '\\begin{aligned}' + m.L.map((l, i) => 'P(F_' + (i + 1) + '\\cap ' + E + ')&=P(F_' + (i + 1) + ')\\,P(' + E + '\\mid F_' + (i + 1) + ')=' + pT(m.pr[i]) + '\\times ' + pT(l) + '=' + pT(m.joint[i])).join('\\\\ ') + '\\end{aligned}' });
      steps.push({ html: '<b>Law of total probability:</b>', math: '\\begin{aligned}P(' + E + ')&=\\sum_{i=1}^{' + k + '}P(F_i)\\,P(' + E + '\\mid F_i)\\\\&=' + m.joint.map(pT).join('+') + '=' + pT(m.tot) + approx(m.tot) + '\\end{aligned}' });
      if (k === 2) steps.push({ html: 'With two hypotheses this is the Week 8 form with ' + tx('F=F_1') + ' and ' + tx('F^c=F_2') + ':', math: 'P(' + E + ')=P(F)\\,P(' + E + '\\mid F)+P(F^c)\\,P(' + E + '\\mid F^c)' });
      body.appendChild(K.steps(steps));
    }
    function drawBayes() {
      const body = P.bayes.body;
      Lab.clear(body);
      const m = M, E = Es();
      if (!m.post) { body.appendChild(K.note('<span class="cbad">' + tx('P(' + E + ')=0') + ', so no posterior is defined.</span>')); return; }
      P.bayes.sub('Posterior = (this hypothesis’ path) ÷ (all paths that end in ' + tx(E) + '). Symbols first, then your numbers.');
      const tbl = h('table', { class: 'tbl s5-btbl s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, ['Hypothesis', 'prior ' + 'P(Fᵢ)', 'likelihood P(' + (m.obsE ? 'E' : 'Eᶜ') + ' | Fᵢ)', 'product', 'posterior P(Fᵢ | ' + (m.obsE ? 'E' : 'Eᶜ') + ')'].map(t => h('th', { text: t })))));
      const tb = h('tbody');
      for (let i = 0; i < m.k; i++) tb.appendChild(h('tr', { class: i === S.focus ? 'hl-row' : '' }, h('td', { class: 'l', html: '<span class="s5-dot ' + HUE[i] + '"></span>' + fName(i) }), h('td', { html: tx(pT(m.pr[i])), 'data-l': 'prior' }), h('td', { html: tx(pT(m.L[i])), 'data-l': 'likelihood' }), h('td', { html: tx(pT(m.joint[i])), 'data-l': 'product' }), h('td', { html: tx(pT(m.post[i]) + approx(m.post[i])), 'data-l': 'posterior' })));
      tb.appendChild(h('tr', { class: 's5-tot' }, h('td', { class: 'l', text: 'total' }), h('td', { html: tx(pT(F.sum(m.pr))), 'data-l': 'priors' }), h('td', { html: '<span class="muted">no need to be 1</span>', 'data-l': 'likelihoods' }), h('td', { html: tx(pT(m.tot) + '=P(' + E + ')'), 'data-l': 'products' }), h('td', { html: tx(pT(F.sum(m.post))) + ' ' + ok, 'data-l': 'posteriors' })));
      tbl.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap' }, wrapCells(tbl)));
      const steps = [];
      for (let i = 0; i < m.k; i++) steps.push({ html: fName(i) + ':', math: '\\begin{aligned}P(F_' + (i + 1) + '\\mid ' + E + ')&=\\frac{P(' + E + '\\mid F_' + (i + 1) + ')\\,P(F_' + (i + 1) + ')}{P(' + E + ')}\\\\&=\\frac{' + pT(m.L[i]) + '\\times ' + pT(m.pr[i]) + '}{' + pT(m.tot) + '}\\\\&=\\frac{' + pT(m.joint[i]) + '}{' + pT(m.tot) + '}=' + pT(m.post[i]) + approx(m.post[i]) + '\\end{aligned}' });
      steps.push({ html: 'Check: the posteriors add up to 1, because given ' + tx(E) + ' exactly one hypothesis is still true:', math: m.post.map(pT).join('+') + '=' + pT(F.sum(m.post)) });
      body.appendChild(K.steps(steps));
    }
    function drawNat() {
      const body = P.nat.body;
      Lab.clear(body);
      const m = M, k = m.k, E = Es(), Eu = m.obsE ? 'E' : 'Eᶜ';
      const lcm = (a, b) => (a / Lab.math.gcd(a, b)) * b;
      let L = 1, exactable = true;
      m.pr.concat(m.jE, m.jC).forEach(f => { if (f.approx) exactable = false; else if (L <= 1e7) L = lcm(L, f.d); });
      if (L > 1e7) exactable = false;
      const auto = exactable && L <= 100000 ? L * Math.max(1, Math.ceil(100 / L)) : 10000;
      const N = S.N > 0 ? S.N : auto;
      const ctlN = K.numField({ label: 'Imagine ' + tx('N') + ' people (or items)', min: 10, max: 100000, step: 1, value: N, onChange: v => { S.N = v; save(); drawNatBody(v); } });
      body.appendChild(ctlN);
      const btns = h('div', { class: 'btn-row' });
      if (exactable && L <= 100000) btns.appendChild(Lab.button('Use the smallest N with whole counts (' + fmtInt(auto) + ')', () => { S.N = 0; save(); drawNat(); }, 'btn xs'));
      body.appendChild(btns);
      const out = h('div');
      body.appendChild(out);
      ctlN.hint(exactable ? 'All counts are whole numbers when ' + tx('N') + ' is a multiple of ' + tx(K.intTex(L)) + ' — the lowest common denominator of your path probabilities.' : 'Your probabilities have no small common denominator, so counts are rounded.');
      function drawNatBody(Nv) {
        Lab.clear(out);
        const NF = F(Nv);
        const grp = [];
        for (let i = 0; i < k; i++) {
          const nF = NF.mul(m.pr[i]), nE = NF.mul(m.jE[i]), nC = NF.mul(m.jC[i]);
          grp.push({ i, nF, nE, nC, obs: m.obsE ? nE : nC, other: m.obsE ? nC : nE });
        }
        const whole = grp.every(g => g.nF.d === 1 && g.nE.d === 1 && g.nC.d === 1);
        const exactDec = f => { const v = Number(f) * 100; return Math.abs(v - Math.round(v)) < 1e-9; };
        const show = f => (f.d === 1 ? K.intTex(f.n) : Lab.fmtDec(Number(f), 2));
        const eqv = f => (f.d === 1 || exactDec(f) ? '=' : '\\approx ') + show(f);
        const lines = grp.map(g => '<div class="s5-natline"><span class="s5-dot ' + HUE[g.i] + '"></span>' + tx('F_' + (g.i + 1)) + ' (' + user(S.names[g.i]) + '): ' + tx(K.intTex(Nv) + '\\times ' + pT(m.pr[g.i]) + eqv(g.nF)) + '; of them, ' + tx(Eu === 'E' ? 'E' : 'E^c') + ' happens in ' + tx(show(g.nF) + '\\times ' + pT(m.L[g.i]) + eqv(g.obs)) + '</div>');
        const totObs = grp.reduce((a, g) => a.add(g.obs), F(0));
        out.appendChild(K.note(lines.join(''), 's5-natlines'));
        if (!whole) out.appendChild(K.note('<span class="cbad">With ' + tx('N=' + K.intTex(Nv)) + ' some counts are not whole numbers' + (exactable ? ' (use a multiple of ' + K.intTex(L) + ')' : '') + '. The picture rounds them; the exact answer is the formula above.</span>', 'small'));
        // icon array
        if (Nv <= 2500) {
          const cols = Nv <= 100 ? 10 : Nv <= 400 ? 20 : Nv <= 1000 ? 40 : 80;
          const sq = Math.min(14, Math.floor(640 / cols)) - 1;
          const cells = [];
          grp.forEach(g => { const a = Math.round(Number(g.obs)); for (let t = 0; t < a; t++) cells.push([g.i, true]); });
          grp.forEach(g => { const b = Math.round(Number(g.other)); for (let t = 0; t < b; t++) cells.push([g.i, false]); });
          const rows = Math.ceil(cells.length / cols);
          const sv = svg('svg', { viewBox: '0 0 ' + cols * (sq + 1) + ' ' + rows * (sq + 1), class: 's5-waffle', role: 'img', 'aria-label': Nv + ' people as squares' });
          cells.forEach(([i, hit], t) => sv.appendChild(svg('rect', { x: (t % cols) * (sq + 1), y: Math.floor(t / cols) * (sq + 1), width: sq, height: sq, rx: Math.min(2, sq / 4), class: 'wf ' + HUE[i] + (hit ? ' hit' : '') })));
          const box = h('div', { class: 's5-wafflebox' }, sv);
          box.style.maxWidth = Math.min(640, cols * (sq + 1) * 1.6) + 'px';
          out.appendChild(box);
          out.appendChild(K.note('One square per person. Solid squares (first) = people in whom ' + tx(E) + ' happened; pale squares = ' + tx(m.obsE ? 'E^c' : 'E') + '. Colour = which hypothesis is true for that person. Bayes’ rule asks: what fraction of the <b>solid</b> squares has each colour?', 'small muted'));
        } else out.appendChild(K.note('With ' + tx('N=' + K.intTex(Nv)) + ' the picture would need too many squares — choose ' + tx('N\\le 2500') + ' to see one square per person.', 'small muted'));
        if (totObs.isZero()) { out.appendChild(K.note('<span class="cbad">Nobody shows ' + tx(E) + ', so there is nothing to divide by.</span>')); return; }
        const f = Math.min(S.focus, k - 1), g = grp[f];
        out.appendChild(K.note('<b>Read Bayes off the counts.</b> People in whom ' + tx(E) + ' happened: ' + tx(grp.map(x => show(x.obs)).join('+') + eqv(totObs)) + '. Of these, ' + tx(show(g.obs)) + ' have ' + fName(f) + ', so ' + tx('P(F_' + (f + 1) + '\\mid ' + E + ')=' + (whole ? ratio(g.obs, totObs) : '\\approx ' + Lab.fmtDec(Number(g.obs) / Number(totObs), 4))) + (whole && g.obs.div(totObs).eq(m.post[f]) ? ' ' + ok + ' — the same as Bayes’ rule.' : '.'), 's5-p'));
      }
      drawNatBody(N);
    }
    function drawBars() {
      const body = P.bars.body;
      Lab.clear(body);
      const m = M;
      if (!m.post) return;
      const wrap = h('div', { class: 's5-pp' });
      for (let i = 0; i < m.k; i++) {
        const pr = Number(m.pr[i]), po = Number(m.post[i]);
        const row = h('div', { class: 's5-pprow' + (i === S.focus ? ' focus' : '') });
        row.appendChild(h('div', { class: 's5-pplab', html: '<span class="s5-dot ' + HUE[i] + '"></span>' + fName(i) }));
        const bars = h('div', { class: 's5-ppbars' });
        const b1 = h('div', { class: 's5-ppbar prior' }); b1.style.width = Math.max(0.4, pr * 100) + '%';
        const b2 = h('div', { class: 's5-ppbar post' }); b2.style.width = Math.max(0.4, po * 100) + '%';
        bars.append(h('div', { class: 's5-pptrack' }, b1, h('span', { class: 's5-ppval', html: tx(pT(m.pr[i])) })), h('div', { class: 's5-pptrack' }, b2, h('span', { class: 's5-ppval', html: tx(pT(m.post[i]) + approx(m.post[i])) })));
        row.appendChild(bars);
        wrap.appendChild(row);
      }
      body.appendChild(wrap);
      body.appendChild(K.note('Both columns of bars add to 1 (' + tx(m.pr.map(pT).join('+') + '=1') + ' and ' + tx(m.post.map(pT).join('+') + '=1') + '). The evidence moves probability towards the hypotheses under which it was more likely.', 'small muted'));
    }
    buildInputs();
    draw();
  }

  /* ======================================= TAB 3 · INDEPENDENT vs DISJOINT */
  const INDEP_PRESETS = [
    { label: 'Lecture · Two dice: sum is 10, given the first die shows 4', source: W8.formula + ', at 04:00–08:00 (restricted sample space: 1 of 6 outcomes) and 12:30–14:30 (formula: E ∩ F = {(4, 6)}, P(E | F) = (1/36)/(6/36) = 1/6).', space: 'dice', E: { rule: 'sumEq', s: 10 }, F: { rule: 'first', a: 4 } },
    { label: 'Lecture · Two coins: head on the 2nd toss vs head on the 1st toss', source: W8.indep + ', at 03:30–06:30 (P(E | F) = 1/2 = P(E): independent).', space: 'coins', n: 2, E: { rule: 'tossH', i: 2 }, F: { rule: 'tossH', i: 1 } },
    { label: 'Lecture · Two dice: first is 3 vs sum is 8 (dependent)', source: W8.examples + ', at 00:30–01:30 (E₁, E₂, E₃) and 05:30–07:00 (1/36 ≠ 6/36 × 5/36).', space: 'dice', E: { rule: 'first', a: 3 }, F: { rule: 'sumEq', s: 8 } },
    { label: 'Lecture · Two dice: first is 3 vs sum is 7 (independent)', source: W8.examples + ', at 07:30–08:30 (E₁ ∩ E₃ = {(3, 4)}: 1/36 = 6/36 × 6/36).', space: 'dice', E: { rule: 'first', a: 3 }, F: { rule: 'sumEq', s: 7 } },
    { label: 'Lecture · One card: face card vs king (dependent)', source: W8.examples + ', at 09:00–14:30 (4/52 ≠ 12/52 × 4/52).', space: 'card', E: { rule: 'face' }, F: { rule: 'rank', r: 'K' } },
    { label: 'Lecture · One card: king vs heart (independent)', source: W8.examples + ', at 15:00–16:00 (1/52 = 4/52 × 13/52).', space: 'card', E: { rule: 'rank', r: 'K' }, F: { rule: 'suit', s: '♥' } },
    { label: 'Lecture · Two dice: sum 7, first die 4, second die 3', source: W8.props + ', at 08:00–12:00 (E ⟂ F and E ⟂ G, yet P(E | F ∩ G) = 1 ≠ 1/6) and 12:30–13:30 (three events are independent only if all four products hold).', space: 'dice', E: { rule: 'sumEq', s: 7 }, F: { rule: 'first', a: 4 }, G: { rule: 'second', a: 3 } },
    { label: 'Lecture · Three children, each a girl with probability 1/2', source: W8.props + ', at 13:30–16:00 (all three girls: 1/2 × 1/2 × 1/2 = 1/8). Here each child is a coin toss: H = girl.', space: 'coins', n: 3, E: { rule: 'tossH', i: 1 }, F: { rule: 'tossH', i: 2 }, G: { rule: 'tossH', i: 3 } },
    { label: 'Lecture · One coin: heads vs tails (mutually exclusive, not independent)', source: W8.bayes + ', at 24:30–25:30 (“a word of caution”: mutually exclusive and independent are not the same — on one toss a head does not allow a tail, so P(E ∩ F) = 0 while P(E) P(F) = 1/2 × 1/2 = 1/4).', space: 'coins', n: 1, E: { rule: 'tossH', i: 1 }, F: { rule: 'tossT', i: 1 } },
    { label: 'Tutorial · One card: ace vs spade (independent)', source: W8.tut(4) + ', at 00:00–04:30 (1/52 = 1/13 × 1/4).', space: 'card', E: { rule: 'rank', r: 'A' }, F: { rule: 'suit', s: '♠' } },
    { label: 'Own example · Die: even vs odd (disjoint, so dependent)', source: 'This lab’s own example. Week 8 notes: disjoint events with positive probability are dependent.', space: 'die', E: { rule: 'even' }, F: { rule: 'odd' } },
    { label: 'Own example · Die: even vs at most 2 (independent, overlapping)', source: 'This lab’s own example: P(E ∩ F) = 1/6 and P(E)P(F) = 1/2 × 1/3 = 1/6.', space: 'die', E: { rule: 'even' }, F: { rule: 'le', a: 2 } },
    { label: 'Own example · Die: even vs at least 4 (dependent, overlapping)', source: 'This lab’s own example: P(E ∩ F) = 2/6 but P(E)P(F) = 1/2 × 1/2 = 1/4.', space: 'die', E: { rule: 'even' }, F: { rule: 'ge', a: 4 } },
    { label: 'Own example · Card: heart vs king (independent)', source: 'This lab’s own example on one card: P(heart ∩ king) = 1/52 = 1/4 × 1/13.', space: 'card', E: { rule: 'suit', s: '♥' }, F: { rule: 'rank', r: 'K' } },
    { label: 'Own example · Card: red vs spade (disjoint, so dependent)', source: 'This lab’s own example: no card is both red and a spade.', space: 'card', E: { rule: 'red' }, F: { rule: 'suit', s: '♠' } },
    { label: 'Own example · Card: face card vs red (independent)', source: 'This lab’s own example: P(face ∩ red) = 6/52 = 3/26 = 3/13 × 1/2.', space: 'card', E: { rule: 'face' }, F: { rule: 'red' } },
    { label: 'Own example · Two dice: first is 6 vs sum is 7 (independent)', source: 'This lab’s own example: 1/36 = 1/6 × 6/36.', space: 'dice', E: { rule: 'first', a: 6 }, F: { rule: 'sumEq', s: 7 } },
    { label: 'Own example · Two dice: first is 6 vs sum is 8 (dependent)', source: 'This lab’s own example: 1/36 but 1/6 × 5/36 = 5/216.', space: 'dice', E: { rule: 'first', a: 6 }, F: { rule: 'sumEq', s: 8 } },
    { label: 'Own example · Card: red, face, heart (chain rule for three)', source: 'This lab’s own example for P(E ∩ F ∩ G) = P(E) P(F | E) P(G | E ∩ F).', space: 'card', E: { rule: 'red' }, F: { rule: 'face' }, G: { rule: 'suit', s: '♥' } },
  ];
  function indepTab(host, st, save) {
    const EV = K.s1ev;
    if (!EV) { host.appendChild(K.note('<span class="cbad">This tab needs the Week 7 lab file (labs/s1-w07-events.js), which did not load.</span>')); return; }
    const S = st.indep;
    let sp = null, D = null;
    const ctl = {}, P = {};
    const LET = ['E', 'F', 'G'], TON = ['a', 'b', 'c'];
    const used = () => (S.useG ? LET : ['E', 'F']);
    const { side, main } = K.layout(host, 's5-by-lab');
    ctl.presets = K.presets({ label: 'Examples to load', items: INDEP_PRESETS, onPick: it => {
      S.space = it.space;
      if (it.n) { S.n = it.n; ctl.n.set(S.n); }
      const evs = S.evs[it.space];
      evs.E = Object.assign({}, it.E); evs.F = Object.assign({}, it.F);
      if (it.G) { evs.G = Object.assign({}, it.G); S.useG = true; } else S.useG = false;
      ctl.space.select.value = S.space;
      const box = ctl.useG.querySelector('input'); if (box) box.checked = S.useG;
      afterSpace();
    } });
    side.appendChild(ctl.presets);
    side.appendChild(K.group('1 · Your experiment'));
    ctl.space = K.selectField({ label: 'Sample space ' + tx('S') + ' (equally likely outcomes)', options: EV.SPACE_OPTS.filter(o => ['die', 'dice', 'card', 'coins'].indexOf(o.value) >= 0), value: S.space, onChange: v => { S.space = v; afterSpace(); } });
    ctl.n = K.numField({ label: 'Number of coins ' + tx('n'), min: 1, max: 4, value: S.n, onChange: v => { S.n = v; afterSpace(); } });
    side.append(ctl.space, ctl.n);
    side.appendChild(K.group('2 · Your events'));
    ctl.evHost = h('div', { class: 's5-evs' });
    side.appendChild(ctl.evHost);
    ctl.useG = K.toggle({ label: 'Add a third event ' + tx('G') + ' (chain rule)', value: S.useG, onChange: v => { S.useG = v; buildEvents(); draw(); } });
    side.appendChild(ctl.useG);
    ctl.clickWrap = h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Clicking an outcome tile adds or removes it from event' }));
    side.appendChild(ctl.clickWrap);
    side.appendChild(resetBtn(() => { st.indep = defIndep(); save(); host.dispatchEvent(new CustomEvent('s5-restart')); }));

    P.answer = K.answer();
    P.grid = K.panel('Your sample space and events');
    P.map = K.panel('Disjoint or independent? Two different questions', 'Disjoint is about the <b>sets</b>: do ' + tx('E') + ' and ' + tx('F') + ' share an outcome? Independent is about the <b>numbers</b>: is ' + tx('P(E\\cap F)') + ' equal to ' + tx('P(E)\\,P(F)') + '?');
    P.check = K.panel('The product check, with your numbers');
    P.mult = K.panel('Multiplication rule');
    P.comp = K.panel('Complements of independent events');
    P.three = K.panel('Three events: pairs are not enough', 'Week 8 lecture: ' + tx('E') + ', ' + tx('F') + ', ' + tx('G') + ' are independent only if all four products hold — the three pairs and the triple.');
    main.append(P.answer, P.grid, P.map, P.check, P.mult, P.three, P.comp);

    function afterSpace() { ctl.n.hidden = S.space !== 'coins'; sp = EV.makeSpace(S.space, { n: S.n }); buildEvents(); draw(); }
    function buildEvents() {
      Lab.clear(ctl.evHost);
      ctl.boxes = {};
      used().forEach((L, i) => { const box = EV.eventBox({ sp, L, tone: TON[i], q: S.evs[S.space][L], onChange: () => draw() }); ctl.boxes[L] = box; ctl.evHost.appendChild(box); });
      if (used().indexOf(S.click) < 0) S.click = 'E';
      if (ctl.clickSeg) ctl.clickSeg.remove();
      ctl.clickSeg = Lab.seg(used().map(L => ({ label: tx(L), value: L })), S.click, v => { S.click = v; save(); });
      if (S.useG) ctl.clickSeg.classList.add('s5-seg3');
      ctl.clickWrap.appendChild(ctl.clickSeg);
    }
    function toggleTile(o) {
      const L = S.click;
      if (used().indexOf(L) < 0) return;
      const q = S.evs[S.space][L];
      if (q.rule !== 'set') { q.set = EV.idsOf(sp, q); q.rule = 'set'; }
      const i = q.set.indexOf(o.id);
      if (i >= 0) q.set.splice(i, 1); else q.set.push(o.id);
      if (ctl.boxes[L]) ctl.boxes[L].sync();
      draw();
    }
    function draw() {
      save();
      DEC = false;
      const evs = S.evs[S.space];
      const mem = used().map(L => EV.members(sp, evs[L]));
      const and = (...ms) => sp.outs.map((o, k) => ms.every(m => m[k]));
      const c = m => EV.cnt(m);
      D = { N: sp.N, mem, words: used().map(L => EV.evWords(sp, evs[L])) };
      D.mE = mem[0]; D.mF = mem[1]; D.mEF = and(mem[0], mem[1]);
      D.nE = c(D.mE); D.nF = c(D.mF); D.nEF = c(D.mEF);
      if (S.useG) { D.mG = mem[2]; D.mEFG = and(mem[0], mem[1], mem[2]); D.nG = c(D.mG); D.nEFG = c(D.mEFG); }
      used().forEach((L, i) => { if (ctl.boxes[L]) ctl.boxes[L].info(tx('|' + L + '|=' + c(mem[i])) + ', ' + tx('P(' + L + ')=' + EV.frRed(c(mem[i]), sp.N))); });
      drawAnswer(); drawGrid(); drawMap(); drawCheck(); drawMult(); drawThree(); drawComp();
    }
    const P_ = n => F(n, D.N);
    function verdict() {
      const pEF = P_(D.nEF), prod = P_(D.nE).mul(P_(D.nF));
      return { disjoint: D.nEF === 0, indep: pEF.eq(prod), pEF, prod };
    }
    function drawAnswer() {
      const N = D.N, v = verdict();
      const ev = tx('E') + ' = ' + D.words[0] + ' &nbsp;·&nbsp; ' + tx('F') + ' = ' + D.words[1] + ' &nbsp;·&nbsp; ' + tx('|S|=' + N) + ' equally likely outcomes';
      const big = '\\begin{aligned}P(E\\cap F)&=' + EV.frRed(D.nEF, N) + '\\\\ P(E)\\,P(F)&=' + EV.fr(D.nE, N) + '\\times ' + EV.fr(D.nF, N) + '=' + pT(v.prod) + '\\end{aligned}\\quad\\Rightarrow\\quad ' + (v.indep ? '\\text{independent}' : '\\text{dependent}');
      let sub = (v.disjoint ? tx('E') + ' and ' + tx('F') + ' are <b>disjoint</b> (' + tx('E\\cap F=\\emptyset') + ')' : tx('E') + ' and ' + tx('F') + ' are <b>not disjoint</b> (they share ' + D.nEF + ' outcome' + (D.nEF === 1 ? '' : 's') + ')') + ' and <b>' + (v.indep ? 'independent' : 'dependent') + '</b>' + (v.indep ? ' (' + tx('P(E\\cap F)=P(E)\\,P(F)') + ').' : ' (' + tx('P(E\\cap F)\\ne P(E)\\,P(F)') + ').');
      if (v.disjoint && D.nE > 0 && D.nF > 0) sub += ' Disjoint events with positive probabilities are always dependent: if ' + tx('E') + ' happens, ' + tx('F') + ' cannot, so ' + tx('P(F\\mid E)=0\\ne P(F)=' + EV.frRed(D.nF, N)) + '.';
      else if (v.disjoint) sub += ' Here one event is empty (probability 0), and ' + tx('0=0') + ' — the only way disjoint events can be independent.';
      K.setAnswer(P.answer, { ev, big, sub });
    }
    function drawGrid() {
      const body = P.grid.body;
      Lab.clear(body);
      P.grid.sub(EV.spaceWhy(sp) + ' Violet tiles are in ' + tx('E\\cap F') + '. Click a tile to add or remove it from the event chosen in the controls.');
      const g = EV.outcomeGrid({ sp, letters: used(), tones: TON.slice(0, used().length), onTile: toggleTile, onHover: o => {
        const parts = used().map((L, i) => (D.mem[i][o.k] ? '<span class="s5-t' + TON[i] + '">in ' + L + '</span> ' + ok : '<span class="muted">not in ' + L + '</span> ' + no));
        read.classList.remove('muted');
        Lab.setHTML(read, '<b>' + esc(o.short) + '</b>: ' + tx('P=' + pT(o.p)) + ' &nbsp;·&nbsp; ' + parts.join(' &nbsp; '));
      } });
      const read = h('div', { class: 'ws-readout s5-read muted', text: 'Point at a tile to see which events it belongs to.' });
      body.append(g, read, K.note(tx('E\\cap F') + ' = ' + EV.setList(sp, D.mEF, 40) + ' — ' + D.nEF + ' outcome' + (D.nEF === 1 ? '' : 's') + '.', 's5-p'));
      g.paint(D.mem, D.mEF);
    }
    function drawMap() {
      const body = P.map.body;
      Lab.clear(body);
      const v = verdict(), zero = D.nE === 0 || D.nF === 0;
      const cell = (dis, ind, title, text) => {
        const here = v.disjoint === dis && v.indep === ind;
        const d = h('div', { class: 's5-mapcell' + (here ? ' here' : '') + (dis && ind ? ' rare' : '') });
        Lab.setHTML(d, '<div class="s5-maptitle">' + title + '</div><div class="small">' + text + '</div>' + (here ? '<div class="s5-here">your ' + tx('E') + ', ' + tx('F') + '</div>' : ''));
        return d;
      };
      const g = h('div', { class: 's5-map' },
        h('div'), h('div', { class: 's5-maph', html: 'Disjoint: ' + tx('E\\cap F=\\emptyset') }), h('div', { class: 's5-maph', html: 'Not disjoint: ' + tx('E\\cap F\\ne\\emptyset') }),
        h('div', { class: 's5-maph side', html: 'Independent: ' + tx('P(E\\cap F)=P(E)P(F)') }),
        cell(true, true, 'Only if an event is impossible', 'Needs ' + tx('P(E)=0') + ' or ' + tx('P(F)=0') + ', so that ' + tx('0=0') + '.'),
        cell(false, true, 'Overlap of exactly the right size', 'Knowing ' + tx('F') + ' leaves the chance of ' + tx('E') + ' unchanged: ' + tx('P(E\\mid F)=P(E)') + '.'),
        h('div', { class: 's5-maph side', html: 'Dependent: ' + tx('P(E\\cap F)\\ne P(E)P(F)') }),
        cell(true, false, 'The usual case for disjoint events', tx('P(E\\cap F)=0') + ' but ' + tx('P(E)P(F)>0') + ': one happening rules the other out.'),
        cell(false, false, 'Overlap too big or too small', 'Knowing ' + tx('F') + ' changes the chance of ' + tx('E') + '.'));
      body.appendChild(g);
      body.appendChild(K.note(zero ? 'One of your events is empty, which is the only way to land in the top-left box.' : 'Week 8 notes: “Independent ≠ disjoint. Disjoint events with ' + tx('P>0') + ' are dependent.”', 'small muted'));
    }
    function drawCheck() {
      const body = P.check.body;
      Lab.clear(body);
      const N = D.N, v = verdict();
      const pE = P_(D.nE), pF = P_(D.nF);
      const steps = [
        { html: 'Count, then divide by ' + tx('|S|=' + N) + ' (equally likely outcomes):', math: 'P(E)=' + EV.frRed(D.nE, N) + ',\\quad P(F)=' + EV.frRed(D.nF, N) + ',\\quad P(E\\cap F)=' + EV.frRed(D.nEF, N) },
        { html: '<b>Product check:</b>', math: 'P(E)\\,P(F)=' + pT(pE) + '\\times ' + pT(pF) + '=' + pT(v.prod) + (v.indep ? '=' : '\\ne ') + pT(v.pEF) + '=P(E\\cap F)', note: v.indep ? ok + ' equal: <b>independent</b>.' : no + ' not equal: <b>dependent</b>.' },
      ];
      if (D.nF > 0) { const q = F(D.nEF, D.nF); steps.push({ html: 'Conditional form — restrict to ' + tx('F') + ' (' + D.nF + ' outcomes) and count the ' + tx('E') + ' outcomes inside:', math: 'P(E\\mid F)=\\frac{|E\\cap F|}{|F|}=' + EV.frRed(D.nEF, D.nF) + (q.eq(pE) ? '=' : '\\ne ') + 'P(E)=' + pT(pE) }); }
      else steps.push({ html: tx('P(F)=0') + ', so ' + tx('P(E\\mid F)') + ' is not defined (and the product check gives ' + tx('0=0') + ').' });
      if (D.nE > 0) { const q = F(D.nEF, D.nE); steps.push({ html: 'And the other way round:', math: 'P(F\\mid E)=\\frac{|E\\cap F|}{|E|}=' + EV.frRed(D.nEF, D.nE) + (q.eq(pF) ? '=' : '\\ne ') + 'P(F)=' + pT(pF) }); }
      body.appendChild(K.steps(steps));
    }
    function drawMult() {
      const body = P.mult.body;
      Lab.clear(body);
      const N = D.N;
      P.mult.sub('Week 8: ' + tx('P(E\\cap F)=P(E\\mid F)\\,P(F)=P(F\\mid E)\\,P(E)') + ' — always true, independent or not.');
      const steps = [];
      if (D.nF > 0) steps.push({ html: 'Through ' + tx('F') + ':', math: 'P(E\\mid F)\\,P(F)=\\frac{' + D.nEF + '}{' + D.nF + '}\\times\\frac{' + D.nF + '}{' + N + '}=\\frac{' + D.nEF + '}{' + N + '}' + (F(D.nEF, N).d !== N && D.nEF ? '=' + pT(F(D.nEF, N)) : '') + '=P(E\\cap F)', note: 'The ' + tx('|F|=' + D.nF) + ' cancels.' });
      if (D.nE > 0) steps.push({ html: 'Through ' + tx('E') + ':', math: 'P(F\\mid E)\\,P(E)=\\frac{' + D.nEF + '}{' + D.nE + '}\\times\\frac{' + D.nE + '}{' + N + '}=\\frac{' + D.nEF + '}{' + N + '}=P(E\\cap F)' });
      if (!D.nE || !D.nF) steps.push({ html: 'A conditional probability given an event of probability 0 is not defined, so only the other form is shown.' });
      if (S.useG) {
        const g = D.nG, efg = D.nEFG;
        let chain;
        if (D.nE === 0) chain = 'P(E)=0\\text{, so }P(E\\cap F\\cap G)=0\\text{ (the chain stops)}';
        else if (D.nEF === 0) chain = 'P(E)\\,P(F\\mid E)=' + EV.fr(D.nE, N) + '\\times 0=0\\text{, so }P(E\\cap F\\cap G)=0';
        else chain = '\\frac{' + D.nE + '}{' + N + '}\\times\\frac{' + D.nEF + '}{' + D.nE + '}\\times\\frac{' + efg + '}{' + D.nEF + '}=' + EV.frRed(efg, N);
        steps.push({ html: '<b>Chain rule for three events</b> with ' + tx('G') + ' = ' + D.words[2] + ' (' + tx('|G|=' + g) + '). Each factor restricts further: first to ' + tx('E') + ', then to ' + tx('E\\cap F') + ':',
          math: '\\begin{aligned}P(E\\cap F\\cap G)&=P(E)\\,P(F\\mid E)\\,P(G\\mid E\\cap F)\\\\&=' + chain + '\\end{aligned}',
          note: 'Check by listing: ' + tx('E\\cap F\\cap G') + ' = ' + EV.setList(sp, D.mEFG, 30) + ', so ' + tx('P(E\\cap F\\cap G)=' + EV.frRed(efg, N)) + ' ' + ok });
      }
      body.appendChild(K.steps(steps));
    }
    function drawThree() {
      P.three.hidden = !S.useG;
      if (!S.useG) return;
      const body = P.three.body;
      Lab.clear(body);
      const N = D.N, c = m => EV.cnt(m);
      const both = (a, b) => sp.outs.map((o, k) => a[k] && b[k]);
      const nE = D.nE, nF = D.nF, nG = D.nG, nEF = D.nEF, nEG = c(both(D.mE, D.mG)), nFG = c(both(D.mF, D.mG)), nEFG = D.nEFG;
      const rows = [['E\\cap F', nEF, [nE, nF], 'P(E)\\,P(F)'], ['E\\cap G', nEG, [nE, nG], 'P(E)\\,P(G)'], ['F\\cap G', nFG, [nF, nG], 'P(F)\\,P(G)'], ['E\\cap F\\cap G', nEFG, [nE, nF, nG], 'P(E)\\,P(F)\\,P(G)']];
      const tbl = h('table', { class: 'tbl s5-comp s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, ['Events', 'by counting', 'product', 'equal?'].map(t => h('th', { text: t })))));
      const tb = h('tbody');
      const good = rows.map(([t, nj, ns, ptx]) => {
        const j = F(nj, N), pr = ns.reduce((a, n) => a.mul(F(n, N)), F(1));
        tb.appendChild(h('tr', {}, h('td', { html: tx(t) }), h('td', { html: tx('P(' + t + ')=' + EV.frRed(nj, N)), 'data-l': 'by counting' }), h('td', { html: tx(ptx + '=' + ns.map(n => EV.fr(n, N)).join('\\times ') + '=' + pT(pr)), 'data-l': 'product' }), h('td', { html: j.eq(pr) ? ok : no, 'data-l': 'equal?' })));
        return j.eq(pr);
      });
      tbl.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap' }, wrapCells(tbl)));
      const pairs = good[0] && good[1] && good[2];
      const verdict = pairs && good[3] ? ok + ' All four hold: ' + tx('E') + ', ' + tx('F') + ', ' + tx('G') + ' are <b>independent</b>.'
        : pairs ? no + ' Every pair is independent, but the triple product fails: the three events are <b>pairwise independent only</b>, not independent.'
          : no + ' At least one pair fails, so ' + tx('E') + ', ' + tx('F') + ', ' + tx('G') + ' are <b>not independent</b>.';
      body.appendChild(K.note(verdict, 's5-p'));
      if (nFG > 0) {
        const q = F(nEFG, nFG), pE = F(nE, N);
        body.appendChild(K.note('Is ' + tx('E') + ' independent of ' + tx('F\\cap G') + '? Restrict to ' + tx('F\\cap G') + ' (' + nFG + ' outcome' + (nFG === 1 ? '' : 's') + '): ' + tx('P(E\\mid F\\cap G)=\\frac{|E\\cap F\\cap G|}{|F\\cap G|}=' + EV.frRed(nEFG, nFG) + (q.eq(pE) ? '=' : '\\ne ') + 'P(E)=' + EV.frRed(nE, N)) + ' — ' + (q.eq(pE) ? 'yes.' : '<b>no</b>.'), 's5-p'));
      } else body.appendChild(K.note(tx('F\\cap G=\\emptyset') + ', so ' + tx('P(E\\mid F\\cap G)') + ' is not defined.', 'small muted'));
    }
    function drawComp() {
      const body = P.comp.body;
      Lab.clear(body);
      const N = D.N, v = verdict();
      const nE = D.nE, nF = D.nF, nEF = D.nEF;
      const rows = [['E\\cap F', nEF, nE, nF, 'P(E)\\,P(F)'], ['E\\cap F^c', nE - nEF, nE, N - nF, 'P(E)\\,P(F^c)'], ['E^c\\cap F', nF - nEF, N - nE, nF, 'P(E^c)\\,P(F)'], ['E^c\\cap F^c', N - nE - nF + nEF, N - nE, N - nF, 'P(E^c)\\,P(F^c)']];
      P.comp.sub('Week 8 notes: if ' + tx('E') + ', ' + tx('F') + ' are independent, so is each complement pair. ' + (v.indep ? 'Yours are independent — all four rows must pass:' : 'Yours are dependent — so every row fails:'));
      const tbl = h('table', { class: 'tbl s5-comp s5-stack' });
      tbl.appendChild(h('thead', {}, h('tr', {}, ['Pair', 'by counting', 'product', 'equal?'].map(t => h('th', { text: t })))));
      const tb = h('tbody');
      rows.forEach(([t, nj, n1, n2, ptx]) => {
        const j = F(nj, N), pr = F(n1, N).mul(F(n2, N));
        tb.appendChild(h('tr', {}, h('td', { html: tx(t) }), h('td', { html: tx('P(' + t + ')=' + EV.frRed(nj, N)), 'data-l': 'by counting' }), h('td', { html: tx(ptx + '=' + EV.fr(n1, N) + '\\times ' + EV.fr(n2, N) + '=' + pT(pr)), 'data-l': 'product' }), h('td', { html: j.eq(pr) ? ok : no, 'data-l': 'equal?' })));
      });
      tbl.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap' }, wrapCells(tbl)));
      body.appendChild(K.note('Counting the complement cells: ' + tx('|E\\cap F^c|=|E|-|E\\cap F|=' + nE + '-' + nEF + '=' + (nE - nEF)) + ', ' + tx('|E^c\\cap F|=' + nF + '-' + nEF + '=' + (nF - nEF)) + ', ' + tx('|E^c\\cap F^c|=|S|-|E|-|F|+|E\\cap F|=' + N + '-' + nE + '-' + nF + '+' + nEF + '=' + (N - nE - nF + nEF)) + '.', 'small muted'));
    }
    afterSpace();
  }

  /* ================================================================== LAB */
  function bayesLab(host) {
    const st = loadState();
    const save = () => Lab.store.set(KEY, st);
    Lab.clear(host);
    const TABS = [{ label: '1 · Contingency table', value: 'table' }, { label: '2 · Tree and Bayes', value: 'bayes' }, { label: '3 · Independent vs disjoint', value: 'indep' }];
    const tabs = Lab.seg(TABS, st.tab, v => { st.tab = v; save(); show(); });
    tabs.classList.add('s5-tabs');
    const body = h('div', { class: 's5-tabbody' });
    host.append(h('div', { class: 's5-tabbar' }, tabs), body);
    function show() {
      Lab.clear(body);
      body.className = 's5-tabbody';
      const fn = { table: tableTab, bayes: bayesTab, indep: indepTab }[st.tab] || tableTab;
      fn(body, st, save);
      Lab.renderMath(body);
    }
    body.addEventListener('s5-restart', () => show());
    show();
  }

  Lab.lab({
    id: 'lab-s1-bayes', course: 's1', week: 8, order: 1,
    title: 'Conditional probability and Bayes lab', sub: 'Week 8 · conditioning, independence, Bayes',
    topics: ['contingency table', 'P(A | B)', 'multiplication rule', 'independence', 'disjoint vs independent', 'total probability', 'Bayes’ rule'],
    desc: 'Type your own table of counts and condition on a row or column; set your own hypotheses, priors and likelihoods and watch the tree, total probability and Bayes’ rule; compare disjoint and independent events on dice and cards.',
    render: host => bayesLab(host),
  });
})();
