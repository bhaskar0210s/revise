/* Playground lab — Statistics I, Week 4 (L4.2–L4.3): two categorical variables (lab-s1-table).
   The learner types a contingency table of counts with their own variable and category names. Every panel is
   recomputed from it: row, column and grand totals written as sums; joint relative frequencies (cell ÷ n); row
   relative frequencies (cell ÷ row total); column relative frequencies (cell ÷ column total); the row profiles as a
   100% stacked, side-by-side or stacked-count bar chart; and the L4.3 association check (compare the row profiles)
   with the expected counts n·(row total/n)·(column total/n) of a table with the same totals and no association.
   Arithmetic is exact (fractions); a value is printed exactly when it is a short decimal, otherwise to 4 decimal
   places with "≈" (percentages to 2 places).
   Sources: Statistics I revision notes, Week 4; lecture transcripts L4.2 and L4.3 (both lecture tables below).
   Exact arithmetic and helpers come from Lab.play.stat1, defined in labs/s1-w03-describe.js (read when the lab opens). */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg } = Lab;
  const esc = Lab.esc;
  const tx = s => Lab.tex(s);
  const blank = s => (String(s == null ? '' : s).trim() === '' ? '(blank)' : String(s).trim());
  const user = s => '<span class="no-math">' + esc(blank(s)) + '</span>';
  const TEXESC = { '\\': '/', '{': '\\{', '}': '\\}', '$': '\\$', '&': '\\&', '#': '\\#', '^': '\\textasciicircum{}', '_': '\\_', '%': '\\%', '~': '\\textasciitilde{}' };
  const texText = s => '\\text{' + blank(s).replace(/[\\{}$&#^_%~]/g, c => TEXESC[c]) + '}';
  /** "\text{Female:}\ " — a label with its colon inside the text (no relation spacing). */
  const texLabel = s => '\\text{' + blank(s).replace(/[\\{}$&#^_%~]/g, c => TEXESC[c]) + ':}\\ ';
  /** keep a short formula and the punctuation after it on one line */
  const nw = html => '<span class="w4-nw">' + html + '</span>';
  const KEY = 'lab:s1-table';
  const MAXR = 10, MAXC = 8;

  const PRESETS = [
    {
      label: 'L4.2–L4.3 · gender and owning a smartphone', rowVar: 'Gender', colVar: 'Owns a smartphone',
      ys: ['Female', 'Male'], xs: ['No', 'Yes'], cells: [['10', '34'], ['14', '42']],
      source: 'Lectures 4.2–4.3: a market research firm surveyed 100 university students. L4.3 reads the row profiles 22.73% / 77.27% (female) and 25% / 75% (male) as “the same”, so gender and owning a smartphone are <b>not associated</b>.',
    },
    {
      label: 'L4.2–L4.3 · income and owning a smartphone', rowVar: 'Income', colVar: 'Owns a smartphone',
      ys: ['High', 'Medium', 'Low'], xs: ['No', 'Yes'], cells: [['2', '18'], ['27', '39'], ['9', '5']],
      source: 'Lectures 4.2–4.3: the same firm, 100 people. Income is ordinal, so the rows keep the order high, medium, low (L4.2). L4.3 finds the row profiles different (90% of the high-income group own a phone, about 36% of the low-income group), so income and owning a smartphone are <b>associated</b>.',
    },
    {
      label: 'Made for this lab · exactly no association (2 × 3)', rowVar: 'Batch', colVar: 'Grade',
      ys: ['Morning', 'Evening'], xs: ['A', 'B', 'C'], cells: [['12', '24', '4'], ['18', '36', '6']],
      source: 'made for this lab: both rows split 30% / 60% / 10%, so every count equals its expected count.',
    },
    {
      label: 'Made for this lab · perfect association (2 × 2)', rowVar: 'Diet', colVar: 'Lunch ordered',
      ys: ['Vegetarian', 'Non-vegetarian'], xs: ['Veg thali', 'Chicken biryani'], cells: [['25', '0'], ['0', '15']],
      source: 'made for this lab: knowing the row tells you the column exactly.',
    },
    {
      label: 'Made for this lab · age group and device (3 × 3)', rowVar: 'Age group', colVar: 'Preferred device',
      ys: ['18–25', '26–40', '41+'], xs: ['Phone', 'Laptop', 'Tablet'], cells: [['48', '22', '10'], ['35', '40', '15'], ['12', '20', '28']],
      source: 'made for this lab: a bigger table. Age group is ordinal, so the rows stay in age order (L4.2).',
    },
  ];
  const DEF = () => ({ rowVar: 'Gender', colVar: 'Owns a smartphone', ys: ['Female', 'Male'], xs: ['No', 'Yes'], cells: [['10', '34'], ['14', '42']], fmt: 'dec', chart: 'pct' });
  function loadState() {
    const s = Lab.store.get(KEY, null);
    const st = Object.assign(DEF(), s && typeof s === 'object' ? s : {});
    const shapeOk = Array.isArray(st.xs) && Array.isArray(st.ys) && Array.isArray(st.cells) && st.xs.length >= 1 && st.ys.length >= 1 &&
      st.cells.length === st.ys.length && st.cells.every(r => Array.isArray(r) && r.length === st.xs.length);
    if (!shapeOk) { const d = DEF(); st.xs = d.xs; st.ys = d.ys; st.cells = d.cells; }
    if (typeof st.rowVar !== 'string') st.rowVar = 'Rows';
    if (typeof st.colVar !== 'string') st.colVar = 'Columns';
    if (!['dec', 'pct'].includes(st.fmt)) st.fmt = 'dec';
    if (!['pct', 'side', 'count'].includes(st.chart)) st.chart = 'pct';
    return st;
  }

  /** Path of a horizontal bar with its data end (right) rounded. */
  function hBar(x, y, w, hh, r) {
    r = Math.max(0, Math.min(r, w / 2, hh / 2));
    return 'M' + x + ',' + y + 'H' + (x + w - r) + (r ? 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) : '') + 'V' + (y + hh - r) +
      (r ? 'Q' + (x + w) + ',' + (y + hh) + ' ' + (x + w - r) + ',' + (y + hh) : '') + 'H' + x + 'Z';
  }
  /** Path of a vertical bar standing on y + hh, its top rounded. */
  function vBar(x, y, w, hh, r) {
    r = Math.max(0, Math.min(r, w / 2, hh / 2));
    return 'M' + x + ',' + (y + hh) + 'V' + (y + r) + (r ? 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y : '') + 'H' + (x + w - r) +
      (r ? 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) : '') + 'V' + (y + hh) + 'Z';
  }

  function tableLab(host) {
    if (host.w4Off) host.w4Off();
    Lab.clear(host);
    const S = K.stat1;
    if (!S) { host.appendChild(K.note('<span class="cbad">This lab needs the exact-arithmetic kit of labs/s1-w03-describe.js, which did not load.</span>')); return; }
    const st = loadState();
    const save = () => Lab.store.set(KEY, st);
    const H100 = S.int(100), LINE = S.frac(1, 20);
    let T = null, A = null, stale = false, prevCells = null, pick = null;
    const ctl = {}, P = {};
    const { side, main } = K.layout(host, 'w4t');
    const onResize = Lab.debounce(() => {
      if (!host.isConnected) { window.removeEventListener('resize', onResize); return; }
      if (T) drawChart();
    }, 200);
    window.addEventListener('resize', onResize);
    host.w4Off = () => window.removeEventListener('resize', onResize);

    /* ---------------- number formats */
    const V = q => S.vt(q);
    const pctStr = p => S.decStr(p, S.exact(p) ? S.places(p) : 2);
    const decStr = q => S.decStr(q, S.exact(q) ? S.places(q) : 4);
    const asShown = q => (st.fmt === 'pct' ? q.mul(H100) : q);
    const rel = q => (S.exact(asShown(q)) ? '=' : '\\approx ');
    /** TeX value of a share, no relation sign: 0.7727 or 77.27\%. */
    const shareVal = q => (st.fmt === 'pct' ? pctStr(q.mul(H100)) + '\\%' : V(q));
    /** Plain-text value of a share (chart labels). */
    const shareTxt = q => (st.fmt === 'pct' ? pctStr(q.mul(H100)) + '%' : decStr(q).replace(/^-/, '−'));
    /** "\frac{a}{b}=0.75" or "\frac{a}{b}\approx 77.27\%". */
    const ratio = (a, b) => (b.isZero() ? '\\text{—}' : '\\frac{' + V(a) + '}{' + V(b) + '}' + rel(a.div(b)) + shareVal(a.div(b)));
    const sumTex = list => S.sumTex(list, q => V(q), 12);
    const plainCount = q => S.ht(q);
    /** A gap between two shares, in percentage points. */
    const pointsTex = g => { const p = g.mul(H100); return (S.exact(p) ? '' : '\\approx ') + pctStr(p); };
    /** "0.7727-0.75\approx 0.0227" or "77.27\%-75\%\approx 2.27\text{ points}": a larger share minus a smaller one. */
    function gapTexOf(a, c) {
      const g = a.sub(c);
      const allEx = S.exact(asShown(a)) && S.exact(asShown(c)) && S.exact(asShown(g));
      return st.fmt === 'pct'
        ? pctStr(a.mul(H100)) + '\\%-' + pctStr(c.mul(H100)) + '\\%' + (allEx ? '=' : '\\approx ') + pctStr(g.mul(H100)) + '\\text{ points}'
        : V(a) + '-' + V(c) + (allEx ? '=' : '\\approx ') + V(g);
    }

    /* ---------------- controls */
    side.appendChild(K.group('1 · Your two variables'));
    ctl.rowVar = K.textField({ label: 'Rows: the first variable (orange boxes)', value: st.rowVar, mono: false, onChange: v => { st.rowVar = v; save(); patchCorner(); if (T) drawAll(); } });
    ctl.colVar = K.textField({ label: 'Columns: the second variable (blue boxes)', value: st.colVar, mono: false, onChange: v => { st.colVar = v; save(); patchCorner(); if (T) drawAll(); } });
    side.append(ctl.rowVar, ctl.colVar);
    side.appendChild(K.group('2 · Your counts'));
    ctl.grid = K.gridEditor({
      label: 'Type how many fall in each cell. Rename a category in its orange (row) or blue (column) box.',
      xs: st.xs, ys: st.ys, cells: st.cells, mode: 'count', xName: '\\text{col}', yName: '\\text{row}', onChange: onGrid,
    });
    side.appendChild(ctl.grid);
    side.appendChild(K.presets({
      label: 'Examples (lectures and made-up)', items: PRESETS,
      onPick: it => {
        st.rowVar = it.rowVar; st.colVar = it.colVar;
        ctl.rowVar.input.value = it.rowVar; ctl.colVar.input.value = it.colVar;
        prevCells = null;
        ctl.grid.set(it.xs, it.ys, it.cells);
      },
    }));
    side.appendChild(K.group('3 · Show'));
    ctl.fmt = Lab.seg([{ label: 'Decimals', value: 'dec' }, { label: 'Percentages', value: 'pct' }], st.fmt, v => { st.fmt = v; save(); if (T) drawAll(); });
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Relative frequencies as' }), ctl.fmt));
    side.appendChild(K.note('Decimals are exact when they are short; otherwise rounded to 4 places and marked ≈ (percentages to 2 places). Every total is computed exactly from your counts.'));
    side.appendChild(K.group('4 · Go to'));
    const nav = h('div', { class: 'pl-chips w4-nav' });
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, {}); tableLab(host); }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = K.answer();
    P.counts = K.panel('Your table, with its totals');
    P.joint = K.panel('Joint relative frequencies: cell ÷ n');
    P.row = K.panel('Row relative frequencies: cell ÷ row total');
    P.col = K.panel('Column relative frequencies: cell ÷ column total');
    P.chart = K.panel('The row profiles as bar charts');
    P.assoc = K.panel('Association? Compare the row profiles');
    P.steps = K.panel('How it is computed, with your numbers');
    main.append(P.answer, P.counts, P.joint, P.row, P.col, P.chart, P.assoc, P.steps);
    [['Table and totals', P.counts], ['Joint', P.joint], ['Row relative', P.row], ['Column relative', P.col], ['Bar charts', P.chart], ['Association?', P.assoc], ['How it is computed', P.steps]]
      .forEach(([t, p]) => nav.appendChild(Lab.button(t, () => p.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn xs')));
    ctl.chart = Lab.seg([{ label: '100% stacked', value: 'pct' }, { label: 'Side by side', value: 'side' }, { label: 'Stacked counts', value: 'count' }], st.chart, v => { st.chart = v; save(); pick = null; drawChart(); expose(); });
    P.chartOut = h('div', { class: 'pl-panel-body' });
    P.chart.body.append(h('div', { class: 'w4-ctl' }, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Chart' }), ctl.chart)), P.chartOut);

    /* ---------------- table → model */
    function patchCorner() {
      const c = ctl.grid.querySelector('.ge-corner');
      if (c) c.innerHTML = '<span class="w4-gc"><span class="no-math" style="color:var(--y)">' + esc(blank(st.rowVar)) + '&nbsp;↓</span><br><span class="no-math" style="color:var(--x)">' + esc(blank(st.colVar)) + '&nbsp;→</span></span>';
    }
    function readRaw() {
      const xs = Lab.$$('.ge-x', ctl.grid).map(e => e.value), ys = Lab.$$('.ge-y', ctl.grid).map(e => e.value);
      const c = Lab.$$('.ge-c', ctl.grid).map(e => e.value);
      return { xs, ys, cells: ys.map((_, j) => xs.map((_, i) => c[j * xs.length + i])) };
    }
    function onGrid(g) {
      patchCorner();
      const raw = readRaw();
      if (!g.ok) { drawStale('Fix the red boxes in your table: counts are numbers 0 or more, and no two rows (or two columns) may have the same name.'); return; }
      if (g.total.isZero()) { drawStale('Every count is 0. Type at least one positive count.'); return; }
      if (raw.xs.length > MAXC || raw.ys.length > MAXR) { drawStale('This lab draws up to ' + MAXR + ' rows and ' + MAXC + ' columns. Remove a row or column.'); return; }
      stale = false;
      st.xs = raw.xs; st.ys = raw.ys; st.cells = raw.cells;
      save();
      const n = g.cells.map(r => r.map(f => S.from(f)));
      const rT = n.map(r => S.sumR(r));
      const cT = raw.xs.map((_, i) => S.sumR(n.map(r => r[i])));
      T = { xs: raw.xs.map(s => s.trim()), ys: raw.ys.map(s => s.trim()), n, rT, cT, N: S.sumR(rT) };
      if (pick && (pick.j >= T.ys.length || pick.i >= T.xs.length)) pick = null;
      drawAll();
    }
    function drawStale(msg) {
      stale = true;
      if (!T) { K.setAnswer(P.answer, { ev: '<span class="cbad">' + msg + '</span>' }); return; }
      const old = P.answer.querySelector('.w4-stale');
      if (old) old.remove();
      P.answer.prepend(h('div', { class: 'w4-stale', html: '<span class="cbad">' + msg + '</span> Everything below still shows your last valid table.' }));
    }

    /* ---------------- the association numbers */
    function assoc() {
      const J = T.ys.length, I = T.xs.length;
      const valid = T.ys.map((_, j) => j).filter(j => !T.rT[j].isZero());
      const share = T.n.map((r, j) => r.map(v => (T.rT[j].isZero() ? null : v.div(T.rT[j]))));
      const all = T.cT.map(c => c.div(T.N));
      let best = null;
      if (valid.length >= 2) {
        for (let i = 0; i < I; i++) {
          let hi = valid[0], lo = valid[0];
          valid.forEach(j => { if (share[j][i].cmp(share[hi][i]) > 0) hi = j; if (share[j][i].cmp(share[lo][i]) < 0) lo = j; });
          const gap = share[hi][i].sub(share[lo][i]);
          if (!best || gap.cmp(best.gap) > 0) best = { i, hi, lo, gap };
        }
      }
      const kind = valid.length < 2 ? 'one' : best.gap.isZero() ? 'none' : best.gap.cmp(LINE) < 0 ? 'small' : 'differ';
      const E = T.ys.map((_, j) => T.xs.map((_, i) => T.rT[j].mul(T.cT[i]).div(T.N)));
      let off = 0;
      for (let j = 0; j < J; j++) for (let i = 0; i < I; i++) if (!T.n[j][i].eq(E[j][i])) off++;
      const validC = T.xs.map((_, i) => i).filter(i => !T.cT[i].isZero());
      let bestC = null;
      if (validC.length >= 2) {
        for (let j = 0; j < J; j++) {
          let hi = validC[0], lo = validC[0];
          const cs = i => T.n[j][i].div(T.cT[i]);
          validC.forEach(i => { if (cs(i).cmp(cs(hi)) > 0) hi = i; if (cs(i).cmp(cs(lo)) < 0) lo = i; });
          const gap = cs(hi).sub(cs(lo));
          if (!bestC || gap.cmp(bestC.gap) > 0) bestC = { j, hi, lo, gap, a: cs(hi), b: cs(lo) };
        }
      }
      return { valid, share, all, best, kind, E, off, bestC };
    }

    /* ---------------- drawing */
    function drawAll() {
      if (!T) return;
      A = assoc();
      drawAnswer(); drawCounts(); drawJoint(); drawRow(); drawCol(); drawChart(); drawAssoc(); drawSteps();
      if (pick) readSeg(pick.j, pick.i);
      if (stale) drawStale('Your table has a problem — see the red message under it.');
      expose();
    }
    /** Exact results as fractions in a data attribute (read by the test scripts; nothing on screen). */
    function expose() {
      if (!T || !A) return;
      const s = q => (q == null ? null : q.toString());
      host.dataset.w4t = JSON.stringify({
        N: s(T.N), rT: T.rT.map(s), cT: T.cT.map(s),
        joint: T.n.map(r => r.map(v => s(v.div(T.N)))),
        row: T.n.map((r, j) => r.map(v => (T.rT[j].isZero() ? null : s(v.div(T.rT[j]))))),
        col: T.n.map(r => r.map((v, i) => (T.cT[i].isZero() ? null : s(v.div(T.cT[i]))))),
        exp: A.E.map(r => r.map(s)), kind: A.kind, gap: A.best ? s(A.best.gap) : null, gapCol: A.bestC ? s(A.bestC.gap) : null,
        off: A.off, fmt: st.fmt, chart: st.chart, xs: T.xs, ys: T.ys,
      });
    }

    function verdictHtml() {
      const b = A.best;
      if (A.kind === 'one') return 'Only one row has counts, so there are no row profiles to compare. Add a second row (the “+ row” button under your table).';
      if (A.kind === 'none') return '<b>No association.</b> Every row has exactly the same profile, and it is the profile of all rows together (column total ÷ ' + tx('n') + '). Knowing the ' + user(st.rowVar) + ' category tells you nothing new about the ' + user(st.colVar) + ' category.';
      const where = 'in column “' + user(T.xs[b.i]) + '”: “' + user(T.ys[b.hi]) + '” has ' + nw(tx(ratio(T.n[b.hi][b.i], T.rT[b.hi]))) + ', “' + user(T.ys[b.lo]) + '” has ' + nw(tx(ratio(T.n[b.lo][b.i], T.rT[b.lo])));
      const gap = 'The largest gap between two rows is ' + tx(pointsTex(b.gap)) + ' percentage points (' + where + ').';
      if (A.kind === 'small') return '<b>The row profiles are almost the same: little or no association.</b> ' + gap + ' L4.3 read a gap this small (2.27 points in its gender example) as “the same”, so: not associated.';
      return '<b>The row profiles differ: the two variables are associated.</b> ' + gap + ' L4.3: when the row relative frequencies differ for some rows, the variables are associated.';
    }

    function drawAnswer() {
      const ev = 'Rows: <b>' + user(st.rowVar) + '</b> (' + T.ys.length + ' categor' + (T.ys.length === 1 ? 'y' : 'ies') + ') · columns: <b>' + user(st.colVar) + '</b> (' + T.xs.length + ' categor' + (T.xs.length === 1 ? 'y' : 'ies') + ') · grand total ' + nw(tx('n=' + V(T.N)) + '.');
      if (A.kind === 'one') { K.setAnswer(P.answer, { ev, sub: verdictHtml() }); return; }
      const b = A.best, i = b.i;
      const js = A.valid.length <= 4 ? A.valid : [b.hi, b.lo];
      const pieces = js.map(j => texLabel(T.ys[j]) + ratio(T.n[j][i], T.rT[j])).concat([texLabel('all rows') + ratio(T.cT[i], T.N)]);
      K.setAnswer(P.answer, {
        ev: ev + '<br>Share of each row that falls in column “' + user(T.xs[i]) + '”' + (A.kind === 'none' ? '' : ' (the column where the rows differ most)') + (A.valid.length > 4 ? ', for the two rows furthest apart' : '') + ':',
        sub: verdictHtml(),
      });
      P.answer.insertBefore(S.bigLine(pieces), P.answer.lastChild);
    }

    /** A contingency-style table. cols: [{html, cls}] after the corner; rows: [{head: {html, cls}, cells: [{html, cls, key}], cls}] */
    function ctable(cols, rows, cls) {
      const t = h('table', { class: 'tbl w4-ct' + (cls ? ' ' + cls : '') });
      const tr = h('tr', {}, h('th', { class: 'w4-corner', html: '<span class="w4-cr">' + user(st.rowVar) + '&nbsp;↓</span><span class="w4-cc">' + user(st.colVar) + '&nbsp;→</span>' }));
      cols.forEach(c => tr.appendChild(h('th', { class: c.cls || 'w4-colh', html: c.html })));
      t.appendChild(h('thead', {}, tr));
      const tb = h('tbody');
      rows.forEach(r => {
        const row = h('tr', { class: r.cls || null }, h('th', { class: r.head.cls || 'w4-rowh', html: r.head.html }));
        r.cells.forEach(c => row.appendChild(h('td', { class: c.cls || null, html: c.html, 'data-cell': c.key || null })));
        tb.appendChild(row);
      });
      t.appendChild(tb);
      return h('div', { class: 'tbl-wrap w4-tw' }, t);
    }
    const colHeads = () => T.xs.map(x => ({ html: user(x) }));
    const key = (j, i) => j + ',' + i;

    function drawCounts() {
      const body = P.counts.body;
      Lab.clear(body);
      P.counts.sub('Your counts. A row total adds its row, a column total adds its column, and the grand total ' + tx('n') + ' adds everything (L4.2 builds the lecture tables this way).');
      const rows = T.ys.map((y, j) => ({
        head: { html: user(y) },
        cells: T.n[j].map((v, i) => ({ html: tx(V(v)), key: key(j, i) })).concat([{ html: tx(sumTex(T.n[j]) + '=' + V(T.rT[j])), cls: 'w4-tot' }]),
      }));
      rows.push({
        head: { html: 'Column total', cls: 'w4-toth' }, cls: 'w4-totrow',
        cells: T.xs.map((_, i) => ({ html: tx(sumTex(T.n.map(r => r[i])) + '=' + V(T.cT[i])), cls: 'w4-tot' })).concat([{ html: tx('n=' + sumTex(T.rT) + '=' + V(T.N)), cls: 'w4-tot w4-grand' }]),
      });
      body.appendChild(ctable(colHeads().concat([{ html: 'Row total', cls: 'w4-toth' }]), rows));
      body.appendChild(K.note('Check: adding the column totals gives the same grand total, ' + tx(sumTex(T.cT) + '=' + V(T.N)) + ' ✓ — each of the ' + V(T.N).replace(/\{,\}/g, ',') + ' counted cases sits in exactly one row and one column.', 'small muted'));
      if (T.n.some(r => r.some(v => !v.isInt()))) body.appendChild(K.note('Some of your counts are not whole numbers. That is fine for exploring (for example the expected-count table at the end), but real counts are whole numbers.', 'small muted'));
      const zr = T.ys.filter((_, j) => T.rT[j].isZero());
      if (zr.length) body.appendChild(K.note('<span class="cbad">Row ' + zr.map(y => '“' + user(y) + '”').join(', ') + ' has total 0</span>: its row relative frequencies would divide by 0, so it is left out of the row comparisons.', 'small'));
    }

    function drawJoint() {
      const body = P.joint.body;
      Lab.clear(body);
      P.joint.sub('Divide every number by the grand total ' + tx('n=' + V(T.N)) + '. A cell gives the share of <b>all</b> ' + V(T.N).replace(/\{,\}/g, ',') + ' cases that are in that row <b>and</b> that column; a total gives the share of the whole row or column.');
      const rows = T.ys.map((y, j) => ({
        head: { html: user(y) },
        cells: T.n[j].map((v, i) => ({ html: tx(ratio(v, T.N)), key: key(j, i) })).concat([{ html: tx(ratio(T.rT[j], T.N)), cls: 'w4-tot' }]),
      }));
      rows.push({ head: { html: 'Column total ÷ n', cls: 'w4-toth' }, cls: 'w4-totrow', cells: T.xs.map((_, i) => ({ html: tx(ratio(T.cT[i], T.N)), cls: 'w4-tot' })).concat([{ html: tx(ratio(T.N, T.N)), cls: 'w4-tot w4-grand' }]) });
      body.appendChild(ctable(colHeads().concat([{ html: 'Row total ÷ n', cls: 'w4-toth' }]), rows));
      const j0 = T.ys.findIndex((_, j) => !T.n[j].every(v => v.isZero())), i0 = j0 >= 0 ? T.n[j0].findIndex(v => !v.isZero()) : -1;
      const ex = j0 >= 0 && i0 >= 0 ? 'Read a cell like this: ' + V(T.n[j0][i0]).replace(/\{,\}/g, ',') + ' of all ' + V(T.N).replace(/\{,\}/g, ',') + ' cases are “' + user(T.ys[j0]) + '” and “' + user(T.xs[i0]) + '”, so their joint relative frequency is ' + tx(ratio(T.n[j0][i0], T.N)) + '. ' : '';
      body.appendChild(K.note(ex + 'All the cells together add up to ' + tx('\\frac{' + V(T.N) + '}{' + V(T.N) + '}=1') + ' ✓, and so do the shares in each margin.', 'small muted'));
    }

    function drawRow() {
      const body = P.row.body;
      Lab.clear(body);
      P.row.sub('Each row on its own: divide each count by its <b>row total</b> (L4.3). A row of these shares is that row’s <b>profile</b>, and it adds up to 1. The last line, column total ÷ ' + tx('n') + ', is the profile of all rows together.');
      const rows = T.ys.map((y, j) => ({
        head: { html: user(y) },
        cells: T.n[j].map((v, i) => ({ html: T.rT[j].isZero() ? '<span class="muted">÷ 0</span>' : tx(ratio(v, T.rT[j])), key: key(j, i) }))
          .concat([{ html: T.rT[j].isZero() ? '<span class="muted">total 0</span>' : tx(ratio(T.rT[j], T.rT[j])) + ' ✓', cls: 'w4-tot w4-sum1' }]),
      }));
      rows.push({ head: { html: 'All rows: column total ÷ n', cls: 'w4-toth' }, cls: 'w4-allrow', cells: T.xs.map((_, i) => ({ html: tx(ratio(T.cT[i], T.N)), key: key(-1, i) })).concat([{ html: tx(ratio(T.N, T.N)) + ' ✓', cls: 'w4-tot w4-sum1' }]) });
      body.appendChild(ctable(colHeads().concat([{ html: 'Row sum', cls: 'w4-toth' }]), rows));
      const j0 = A.valid[0];
      if (j0 != null) {
        const i0 = A.best ? A.best.i : 0;
        body.appendChild(K.note('Read it like this: of the ' + V(T.rT[j0]).replace(/\{,\}/g, ',') + ' cases in row “' + user(T.ys[j0]) + '”, ' + V(T.n[j0][i0]).replace(/\{,\}/g, ',') + ' are in column “' + user(T.xs[i0]) + '”: ' + tx(ratio(T.n[j0][i0], T.rT[j0])) + '. Compare the rows down each column: if every row matches the last line, there is no association.', 'small muted'));
      }
    }

    function drawCol() {
      const body = P.col.body;
      Lab.clear(body);
      P.col.sub('Each column on its own: divide each count by its <b>column total</b> (L4.3). Every column now adds up to 1. The last column, row total ÷ ' + tx('n') + ', is the profile of all columns together.');
      const rows = T.ys.map((y, j) => ({
        head: { html: user(y) },
        cells: T.n[j].map((v, i) => ({ html: T.cT[i].isZero() ? '<span class="muted">÷ 0</span>' : tx(ratio(v, T.cT[i])), key: key(j, i) }))
          .concat([{ html: tx(ratio(T.rT[j], T.N)), cls: 'w4-allcol' }]),
      }));
      rows.push({ head: { html: 'Column sum', cls: 'w4-toth' }, cls: 'w4-totrow', cells: T.xs.map((_, i) => ({ html: T.cT[i].isZero() ? '<span class="muted">total 0</span>' : tx(ratio(T.cT[i], T.cT[i])) + ' ✓', cls: 'w4-tot w4-sum1' })).concat([{ html: tx(ratio(T.N, T.N)) + ' ✓', cls: 'w4-allcol w4-sum1' }]) });
      body.appendChild(ctable(colHeads().concat([{ html: 'All columns: row total ÷ n', cls: 'w4-allcol' }]), rows));
      const i0 = T.xs.findIndex((_, i) => !T.cT[i].isZero());
      if (i0 >= 0) {
        const j0 = T.n.findIndex(r => !r[i0].isZero());
        body.appendChild(K.note('This answers the reverse question: of the ' + V(T.cT[i0]).replace(/\{,\}/g, ',') + ' cases in column “' + user(T.xs[i0]) + '”, what share is in each row? For example ' + tx(ratio(T.n[Math.max(0, j0)][i0], T.cT[i0])) + ' of them are “' + user(T.ys[Math.max(0, j0)]) + '”.', 'small muted'));
      }
    }

    /* ---------------- charts */
    const fillOf = i => 'var(--w4-c' + ((i % 8) + 1) + ')';
    const inkOf = i => 'var(--w4-t' + ((i % 8) + 1) + ')';
    function clip(s, maxW) {
      s = blank(s);
      if (S.textW(s, 12.5) <= maxW) return s;
      let t = s;
      while (t.length > 1 && S.textW(t + '…', 12.5) > maxW) t = t.slice(0, -1);
      return t + '…';
    }
    function legend() {
      const box = h('div', { class: 'w4-legend' });
      T.xs.forEach((x, i) => box.appendChild(h('span', {}, h('i', { class: 'w4-key sw', style: { background: fillOf(i) } }), h('span', { html: user(x) }))));
      return box;
    }
    function drawChart() {
      if (!T) return;
      const body = P.chartOut;
      Lab.clear(body);
      ctl.chart.set(st.chart);
      const mode = st.chart;
      const lead = {
        pct: 'One bar per row of your table, each stretched to 1 (100%). Segment = row relative frequency (cell ÷ row total). The last bar is all rows together (column total ÷ ' + tx('n') + '); the dashed lines carry its boundaries up. <b>No association ⇔ every bar’s boundaries sit on the dashed lines</b> (L4.3 calls this a 100% stacked bar chart).',
        side: 'One group per row; bar = row relative frequency (cell ÷ row total) of each column category. The dashed mark on each bar is the share for all rows together (column total ÷ ' + tx('n') + '). <b>No association ⇔ every bar reaches its dashed mark.</b>',
        count: 'The stacked (segmented) bar chart of L4.3: bar length = row total, segment = count. Rows of different sizes are hard to compare this way — that is why the 100% stacked chart divides by the row total.',
      }[mode];
      body.appendChild(K.note(lead + (mode === 'count' ? '' : ' Labels on the bars are rounded like the tables (4 decimals, or percentages to 2); point at a bar for the exact fraction.'), 'w4-lead'));
      body.appendChild(legend());
      const box = h('div', { class: 'w4-chart' });
      P.read = h('div', { class: 'w4-read', html: '<span class="muted">Point at (or tap) a segment to read its numbers.</span>' });
      body.append(box, P.read);
      if (mode === 'side') sideChart(box); else stackChart(box, mode);
      if (pick) readSeg(pick.j, pick.i);
    }
    function segEvents(el, j, i) {
      el.setAttribute('tabindex', '0');
      el.setAttribute('data-seg', key(j, i));
      el.addEventListener('pointerenter', () => readSeg(j, i));
      el.addEventListener('focus', () => readSeg(j, i));
      el.addEventListener('click', () => readSeg(j, i));
    }
    function stackChart(box, mode) {
      const W = S.chartWidth(box);
      const rows = T.ys.map((y, j) => ({ label: blank(y), j, tot: T.rT[j], cells: T.n[j] }));
      if (mode === 'pct') rows.push({ label: 'All rows', j: -1, tot: T.N, cells: T.cT });
      const lw = Math.min(Math.max(...rows.map(r => S.textW(r.label, 12.5))) + 8, Math.round(W * 0.3));
      const pl = lw + 14, pr = mode === 'count' ? 46 : 14, pt = 8, bh = 28, gap = 12, sep = mode === 'pct' ? 14 : 0;
      const nR = rows.length;
      const yOf = k => pt + k * (bh + gap) + (rows[k].j === -1 ? sep : 0);
      const axisY = yOf(nR - 1) + bh + 8;
      const H = axisY + 26;
      const pw = Math.max(60, W - pl - pr);
      const maxTot = Math.max(...T.rT.map(q => q.num()), 1e-9);
      const tk = mode === 'count' ? S.niceTicks(0, maxTot, Math.max(3, Math.floor(pw / 80))) : { ticks: [0, 0.25, 0.5, 0.75, 1], step: 0.25 };
      const top = mode === 'count' ? Math.max(maxTot, tk.ticks[tk.ticks.length - 1]) : 1;
      const X = v => pl + (v / top) * pw;
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w4-svg', role: 'img', 'aria-label': mode === 'pct' ? '100% stacked bar chart of the row profiles' : 'stacked bar chart of the counts' });
      tk.ticks.forEach(t => {
        s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: pt - 4, y2: axisY, class: 'w4-grid' }));
        s.appendChild(svg('text', { x: X(t), y: axisY + 17, 'text-anchor': 'middle', class: 'w4-tick' }, mode === 'count' ? S.tickFmt(t, tk.step) : st.fmt === 'pct' ? Math.round(t * 100) + '%' : String(t)));
      });
      s.appendChild(svg('line', { x1: pl, x2: pl, y1: pt - 4, y2: axisY, class: 'w4-axis' }));
      if (sep) { const ys = yOf(nR - 1) - gap / 2 - sep / 2; s.appendChild(svg('line', { x1: 0, x2: W, y1: ys, y2: ys, class: 'w4-sep' })); }
      rows.forEach((r, k) => {
        const y = yOf(k);
        s.appendChild(svg('text', { x: pl - 10, y: y + bh / 2 + 4.5, 'text-anchor': 'end', class: 'w4-name' }, clip(r.label, lw)));
        if (r.tot.isZero()) {
          s.appendChild(svg('rect', { x: pl, y, width: pw, height: bh, rx: 4, class: 'w4-empty' }));
          s.appendChild(svg('text', { x: pl + 10, y: y + bh / 2 + 4, class: 'w4-tick' }, 'row total 0: no profile'));
          return;
        }
        let acc = S.R0;
        const lastNZ = r.cells.reduce((m, v, i) => (v.isZero() ? m : i), -1);
        r.cells.forEach((v, i) => {
          const a = acc, b = acc.add(v);
          acc = b;
          if (v.isZero()) return;
          const x0 = X((mode === 'pct' ? a.div(r.tot) : a).num()), x1 = X((mode === 'pct' ? b.div(r.tot) : b).num());
          const w = Math.max(0.8, x1 - x0 - (i === lastNZ ? 0 : 2));
          const seg = svg('path', { d: hBar(x0, y, w, bh, i === lastNZ ? 4 : 0), class: 'w4-seg' + (pick && pick.j === r.j && pick.i === i ? ' on' : ''), style: 'fill:' + fillOf(i) });
          const share = v.div(r.tot);
          seg.appendChild(svg('title', {}, blank(r.label) + ' · ' + blank(T.xs[i]) + ': ' + plainCount(v) + (mode === 'pct' ? ' of ' + plainCount(r.tot) + ' = ' + shareTxt(share) : '')));
          segEvents(seg, r.j, i);
          s.appendChild(seg);
          const lab = mode === 'pct' ? shareTxt(share) : plainCount(v);
          if (S.textW(lab, 11.5) + 10 <= w) s.appendChild(svg('text', { x: x0 + w / 2, y: y + bh / 2 + 4, 'text-anchor': 'middle', class: 'w4-seglab', style: 'fill:' + inkOf(i) }, lab));
        });
        if (mode === 'count') s.appendChild(svg('text', { x: X(r.tot.num()) + 6, y: y + bh / 2 + 4.5, class: 'w4-tick' }, plainCount(r.tot)));
      });
      if (mode === 'pct') {
        let acc = S.R0;
        const yEnd = yOf(nR - 1) + bh + 3;
        T.cT.slice(0, -1).forEach(c => {
          acc = acc.add(c);
          const x = X(acc.div(T.N).num());
          s.appendChild(svg('line', { x1: x, x2: x, y1: pt - 5, y2: yEnd, class: 'w4-guide' }));
        });
      }
      box.appendChild(h('div', { class: 'w4-scroll' }, s));
    }
    function sideChart(box) {
      const groups = T.ys.map((y, j) => ({ label: blank(y), j, tot: T.rT[j], cells: T.n[j] })).filter(g => !g.tot.isZero())
        .concat([{ label: 'All rows', j: -1, tot: T.N, cells: T.cT }]);
      const I = T.xs.length;
      const W0 = S.chartWidth(box);
      const pl = 50, pr = 10, pt = 14, pb = 34, H = 270;
      const bw = Math.max(8, Math.min(24, Math.floor(((W0 - pl - pr) / groups.length - 16) / I) - 2));
      const groupW = I * bw + (I - 1) * 2;
      const W = Math.max(W0, pl + pr + groups.length * (groupW + 16));
      const slot = (W - pl - pr) / groups.length;
      const shares = groups.map(g => g.cells.map(v => v.div(g.tot)));
      const maxS = Math.max(0.05, ...shares.flat().map(q => q.num()));
      const tk = S.niceTicks(0, maxS, 4);
      const top = Math.max(maxS, tk.ticks[tk.ticks.length - 1]);
      const Y = v => pt + (1 - v / top) * (H - pt - pb);
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w4-svg', role: 'img', 'aria-label': 'side-by-side bar chart of the row profiles' });
      tk.ticks.forEach(t => {
        s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 'w4-grid' }));
        s.appendChild(svg('text', { x: pl - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'w4-tick' }, st.fmt === 'pct' ? S.tickFmt(t * 100, tk.step * 100) + '%' : S.tickFmt(t, tk.step)));
      });
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(0), y2: Y(0), class: 'w4-axis' }));
      groups.forEach((g, k) => {
        const x0 = pl + k * slot + (slot - groupW) / 2;
        if (g.j === -1) s.appendChild(svg('line', { x1: pl + k * slot + 2, x2: pl + k * slot + 2, y1: pt, y2: H - pb + 4, class: 'w4-sep' }));
        shares[k].forEach((q, i) => {
          const x = x0 + i * (bw + 2), y = Y(q.num()), hh = Math.max(0, Y(0) - y);
          const bar = svg('path', { d: vBar(x, y, bw, hh, 4), class: 'w4-seg' + (pick && pick.j === g.j && pick.i === i ? ' on' : ''), style: 'fill:' + fillOf(i) });
          bar.appendChild(svg('title', {}, g.label + ' · ' + blank(T.xs[i]) + ': ' + plainCount(g.cells[i]) + ' of ' + plainCount(g.tot) + ' = ' + shareTxt(q)));
          segEvents(bar, g.j, i);
          s.appendChild(bar);
          if (hh < 1) s.appendChild(svg('line', { x1: x, x2: x + bw, y1: Y(0) - 0.5, y2: Y(0) - 0.5, style: 'stroke:' + fillOf(i) + ';stroke-width:2' }));
          if (g.j !== -1) { const ya = Y(A.all[i].num()); s.appendChild(svg('line', { x1: x - 2, x2: x + bw + 2, y1: ya, y2: ya, class: 'w4-ref' })); }
        });
        s.appendChild(svg('text', { x: pl + k * slot + slot / 2, y: H - pb + 20, 'text-anchor': 'middle', class: 'w4-name' }, clip(g.label, slot - 6)));
      });
      box.appendChild(h('div', { class: 'w4-scroll' }, s));
      box.appendChild(h('div', { class: 'w4-legend' }, h('span', {}, h('i', { class: 'w4-key ref' }), h('span', { html: 'share for all rows together (column total ÷ ' + tx('n') + ')' }))));
    }
    function readSeg(j, i) {
      pick = { j, i };
      if (!P.read) return;
      Lab.$$('.w4-seg', P.chartOut).forEach(el => el.classList.toggle('on', el.getAttribute('data-seg') === key(j, i)));
      Lab.$$('td[data-cell]', main).forEach(el => el.classList.toggle('w4-hot', el.getAttribute('data-cell') === key(j, i)));
      const x = '“' + user(T.xs[i]) + '”';
      if (j === -1) {
        Lab.setHTML(P.read, '<b>All rows</b>, column ' + x + ': ' + V(T.cT[i]).replace(/\{,\}/g, ',') + ' of all ' + V(T.N).replace(/\{,\}/g, ',') + ' cases, so ' + tx(ratio(T.cT[i], T.N)) + ' (column total ÷ ' + tx('n') + '). With no association, every row would have this share.');
        return;
      }
      if (!T.ys[j] || T.rT[j].isZero()) { Lab.setHTML(P.read, '<span class="muted">Row “' + user(T.ys[j] || '') + '” has total 0, so it has no profile.</span>'); return; }
      const y = '“' + user(T.ys[j]) + '”', v = T.n[j][i], q = v.div(T.rT[j]);
      const e = A.E[j][i];
      const cmp = q.cmp(A.all[i]);
      Lab.setHTML(P.read, '<b>' + user(T.ys[j]) + '</b> and <b>' + user(T.xs[i]) + '</b>: ' + V(v).replace(/\{,\}/g, ',') + ' of the ' + V(T.rT[j]).replace(/\{,\}/g, ',') + ' cases in row ' + y + ', so ' + tx(ratio(v, T.rT[j])) + '. All rows together: ' + tx(ratio(T.cT[i], T.N)) + ' — this row is ' +
        (cmp === 0 ? '<b>exactly the same</b>' : '<b>' + (cmp > 0 ? 'higher' : 'lower') + '</b> by ' + tx(pointsTex(q.sub(A.all[i]).abs())) + ' percentage points') + '.<div class="muted">With no association this cell would hold the expected count ' + tx('\\frac{' + V(T.rT[j]) + '\\times ' + V(T.cT[i]) + '}{' + V(T.N) + '}' + S.eqt(e)) + ' instead of ' + V(v).replace(/\{,\}/g, ',') + '.</div>');
    }

    /* ---------------- association */
    function drawAssoc() {
      const body = P.assoc.body;
      Lab.clear(body);
      P.assoc.sub('L4.3: if the row relative frequencies are the same for all rows, the two variables are <b>not associated</b>; if they differ for some rows, they are <b>associated</b>. Below: each column of your table, with every row’s share side by side.');
      if (A.kind === 'one') { body.appendChild(h('div', { class: 'w4-verdict small', html: verdictHtml() })); return; }
      const b = A.best;
      const cols = A.valid.map(j => ({ html: user(T.ys[j]), cls: 'w4-rowh' })).concat([{ html: 'All rows', cls: 'w4-allcol' }, { html: 'Largest − smallest', cls: 'w4-toth' }]);
      const rows = T.xs.map((x, i) => {
        let hi = A.valid[0], lo = A.valid[0];
        A.valid.forEach(j => { if (A.share[j][i].cmp(A.share[hi][i]) > 0) hi = j; if (A.share[j][i].cmp(A.share[lo][i]) < 0) lo = j; });
        const a = A.share[hi][i], c = A.share[lo][i], g = a.sub(c);
        const gapTex = gapTexOf(a, c);
        return {
          head: { html: user(x), cls: 'w4-colh' }, cls: i === b.i && A.kind !== 'none' ? 'w4-maxrow' : null,
          cells: A.valid.map(j => ({ html: tx(ratio(T.n[j][i], T.rT[j])), key: key(j, i) }))
            .concat([{ html: tx(ratio(T.cT[i], T.N)), cls: 'w4-allcol', key: key(-1, i) }, { html: g.isZero() ? tx('0') + ' (all equal)' : tx(gapTex), cls: 'w4-tot' }]),
        };
      });
      const t = ctable(cols, rows);
      const th0 = t.querySelector('.w4-corner');
      if (th0) th0.innerHTML = '<span class="w4-cc">' + user(st.colVar) + '&nbsp;↓</span><span class="w4-cr">' + user(st.rowVar) + '&nbsp;→</span>';
      body.appendChild(t);
      body.appendChild(h('div', { class: 'w4-verdict ' + A.kind, html: verdictHtml() + '<span class="w4-rule">How this lab words it: largest gap 0 → “no association”; under 5 percentage points → “almost the same”; 5 points or more → “differ”. The 5-point line is this lab’s choice, not a course rule — L4.3 called 2.27 points “the same” and 54.29 points (90% vs 35.71% in its income example) “different”.</span>' }));
      Lab.renderMath(body.lastChild);

      /* what no association would look like */
      const E = A.E;
      body.appendChild(h('h4', { class: 'w4-h4', text: 'What “no association” would look like, with your totals' }));
      body.appendChild(K.note('Keep every row total and column total, but give every row the profile of all rows together (column total ÷ ' + tx('n') + '). The count in row ' + tx('r') + ', column ' + tx('c') + ' is then the <b>expected count</b>', 'w4-lead'));
      body.appendChild(S.chain('E=n\\cdot\\frac{\\text{row total}}{n}\\cdot\\frac{\\text{column total}}{n}=\\frac{\\text{row total}\\times\\text{column total}}{n}'));
      const erows = T.ys.map((y, j) => ({
        head: { html: user(y) },
        cells: T.xs.map((_, i) => {
          const e = E[j][i], d = T.n[j][i].sub(e);
          return {
            key: key(j, i),
            html: '<div class="w4-l"><span>' + tx(V(T.N) + '\\cdot\\frac{' + V(T.rT[j]) + '}{' + V(T.N) + '}\\cdot\\frac{' + V(T.cT[i]) + '}{' + V(T.N) + '}') + '</span></div><div class="w4-l"><span>' + tx('=\\frac{' + V(T.rT[j]) + '\\times ' + V(T.cT[i]) + '}{' + V(T.N) + '}') + '</span><span>' + tx(S.eqt(e)) + '</span></div>' +
              '<div class="w4-obs">yours: ' + plainCount(T.n[j][i]) + (d.isZero() ? ' (the same ✓)' : ' (' + (d.sign() > 0 ? '+' : '−') + S.ht(d.abs()).replace(/^≈ /, '≈') + ')') + '</div>',
          };
        }).concat([{ html: tx(V(T.rT[j])), cls: 'w4-tot' }]),
      }));
      erows.push({ head: { html: 'Column total', cls: 'w4-toth' }, cls: 'w4-totrow', cells: T.cT.map(c => ({ html: tx(V(c)), cls: 'w4-tot' })).concat([{ html: tx('n=' + V(T.N)), cls: 'w4-tot w4-grand' }]) });
      body.appendChild(ctable(colHeads().concat([{ html: 'Row total', cls: 'w4-toth' }]), erows));
      body.appendChild(K.note(A.off === 0
        ? 'Every one of your counts equals its expected count ✓ — your table is exactly the “no association” table.'
        : A.off + ' of your ' + (T.xs.length * T.ys.length) + ' counts differ from their expected counts (the brackets show yours minus expected). The further apart they are, the more the row profiles differ.', 'small muted'));
      const btns = h('div', { class: 'w4-btnrow' });
      if (A.off > 0) btns.appendChild(Lab.button('Put these expected counts into my table', () => {
        prevCells = { xs: st.xs.slice(), ys: st.ys.slice(), cells: st.cells.map(r => r.slice()) };
        const str = q => (S.exact(q) ? S.decStr(q, S.places(q)) : q.toString());
        ctl.grid.set(st.xs, st.ys, E.map(r => r.map(str)));
      }, 'btn sm'));
      if (prevCells) btns.appendChild(Lab.button('Back to my counts', () => { const p = prevCells; prevCells = null; ctl.grid.set(p.xs, p.ys, p.cells); }, 'btn ghost sm'));
      if (btns.childNodes.length) body.appendChild(btns);
      if (A.bestC) {
        const c = A.bestC;
        body.appendChild(K.note('<b>Why only the rows?</b> L4.3 compares the column profiles too. Every row profile equals the all-rows profile exactly when every count equals its expected count, and that happens exactly when every column profile equals the all-columns profile — so rows and columns always agree on “exactly no association”. Your column profiles: the largest gap is ' + tx(pointsTex(c.gap)) + ' percentage points (row “' + user(T.ys[c.j]) + '” is ' + nw(tx(ratio(T.n[c.j][c.hi], T.cT[c.hi]))) + ' of column “' + user(T.xs[c.hi]) + '” but ' + nw(tx(ratio(T.n[c.j][c.lo], T.cT[c.lo]))) + ' of column “' + user(T.xs[c.lo]) + '”).', 'small'));
      }
    }

    /* ---------------- how it is computed: every operation, the rule in words first, then the learner's numbers */
    /** "10+34=44": a sum written out, then its value (just the value when there is one term). */
    const sumEq = (list, tot) => (list.length > 1 ? sumTex(list) + '=' : '') + V(tot);
    /** "\frac{34}{44}\times 100\%\approx 77.27\%" */
    function pctTex(a, b) {
      const p = a.div(b).mul(H100);
      return '\\frac{' + V(a) + '}{' + V(b) + '}\\times 100\\%' + (S.exact(p) ? '=' : '\\approx ') + pctStr(p) + '\\%';
    }
    const names = list => list.map(s => '“' + user(s) + '”').join(', ');
    /**
     * Formula lines, one under another. A TeX string is one line; [name, tex] puts the learner's row or column
     * name in front as plain text, so a long name wraps on a phone instead of being cut off inside the formula.
     * Every line may wrap before its "=" and "≈" signs.
     */
    const mlines = (...items) => h('div', { class: 'w3-mlines' }, items.filter(Boolean).map(it => (typeof it === 'string' ? S.chain(it)
      : h('div', { class: 's-math w3-chain w4-nl' }, h('span', { class: 'w4-nlh', html: '<b>' + user(it[0]) + ':</b>' }), S.splitEq(it[1]).map(p => h('span', { html: Lab.tex(p, true) }))))));
    function drawSteps() {
      const body = P.steps.body;
      Lab.clear(body);
      const J = T.ys.length, I = T.xs.length;
      const b = A.best;
      // the cell the answer box looks at: the column where the rows differ most, and its row with the largest share
      const iF = b ? b.i : Math.max(0, T.xs.findIndex((_, i) => !T.cT[i].isZero()));
      const jF = b ? b.hi : (A.valid.length ? A.valid[0] : 0);
      const xF = '“' + user(T.xs[iF]) + '”', yF = '“' + user(T.ys[jF]) + '”';
      const allCols = I <= 4, allRows = J <= 4;
      const colOrder = allCols ? (I > 1 ? ' Each line follows the column order ' + names(T.xs) + '.' : '') : ' Your table has ' + I + ' columns, so each line shows column ' + xF + ' only (every cell is in the tables above).';
      P.steps.sub('Every number on this page comes from your counts. Each step says the rule in words first, then puts in your numbers.');
      const steps = [];
      steps.push({
        html: '<b>Row totals.</b> Add the counts across each row.',
        block: mlines('\\text{row total}=\\text{sum of the counts in the row}', ...T.ys.map((y, j) => [y, sumEq(T.n[j], T.rT[j])])),
      });
      steps.push({
        html: '<b>Column totals.</b> Add the counts down each column.',
        block: mlines('\\text{column total}=\\text{sum of the counts in the column}', ...T.xs.map((x, i) => [x, sumEq(T.n.map(r => r[i]), T.cT[i])])),
      });
      steps.push({
        html: '<b>Grand total</b> ' + tx('n') + ': add the row totals.',
        math: 'n=' + sumEq(T.rT, T.N),
        note: 'Check: the column totals give the same ' + tx('n') + ', ' + tx(sumEq(T.cT, T.N)) + ' ✓ — the same cases, counted the other way.',
      });
      const cellsOf = (j, den) => (allCols ? T.n[j].map(v => ratio(v, den)).join(',\\quad ') : ratio(T.n[j][iF], den));
      steps.push({
        html: '<b>Joint relative frequencies.</b> Divide a cell by the grand total ' + tx('n=' + V(T.N)) + ': the share of <b>all</b> the cases that are in that row <b>and</b> that column.' + colOrder,
        block: mlines('\\text{joint relative frequency}=\\frac{\\text{count in the cell}}{n}', ...T.ys.map((y, j) => [y, cellsOf(j, T.N)])),
        note: 'All the cells together: ' + tx('\\frac{n}{n}=\\frac{' + V(T.N) + '}{' + V(T.N) + '}=1') + ' ✓',
      });
      const j0 = A.valid.length ? A.valid[0] : -1;
      steps.push({
        html: '<b>Row relative frequencies.</b> Each row on its own: divide a cell by its <b>row total</b>. The shares of one row are that row’s <b>profile</b>. The last line divides each column total by ' + tx('n') + ': the profile of all rows together.' + colOrder,
        block: mlines('\\text{row relative frequency}=\\frac{\\text{count in the cell}}{\\text{row total}}',
          ...T.ys.map((y, j) => [y, T.rT[j].isZero() ? '\\text{row total }0\\text{, so no shares}' : cellsOf(j, T.rT[j])]),
          ['All rows', allCols ? T.cT.map(c => ratio(c, T.N)).join(',\\quad ') : ratio(T.cT[iF], T.N)]),
        note: j0 >= 0 && I > 1 ? 'Each profile adds up to 1, for example row “' + user(T.ys[j0]) + '”: ' + tx('\\frac{' + sumTex(T.n[j0]) + '}{' + V(T.rT[j0]) + '}=\\frac{' + V(T.rT[j0]) + '}{' + V(T.rT[j0]) + '}=1') + ' ✓' : '',
      });
      const i0 = T.xs.findIndex((_, i) => !T.cT[i].isZero());
      steps.push({
        html: '<b>Column relative frequencies.</b> Each column on its own: divide a cell by its <b>column total</b>.' + (allRows ? (J > 1 ? ' Each line follows the row order ' + names(T.ys) + '.' : '') : ' Your table has ' + J + ' rows, so each line shows row ' + yF + ' only (every cell is in the tables above).'),
        block: mlines('\\text{column relative frequency}=\\frac{\\text{count in the cell}}{\\text{column total}}',
          ...T.xs.map((x, i) => [x, T.cT[i].isZero() ? '\\text{column total }0\\text{, so no shares}' : allRows ? T.n.map(r => ratio(r[i], T.cT[i])).join(',\\quad ') : ratio(T.n[jF][i], T.cT[i])])),
        note: i0 >= 0 && J > 1 ? 'Each column adds up to 1, for example column “' + user(T.xs[i0]) + '”: ' + tx('\\frac{' + sumTex(T.n.map(r => r[i0])) + '}{' + V(T.cT[i0]) + '}=\\frac{' + V(T.cT[i0]) + '}{' + V(T.cT[i0]) + '}=1') + ' ✓' : '',
      });
      const v = T.n[jF][iF];
      const pl = [];
      if (!T.rT[jF].isZero()) pl.push('<b>Row percentage:</b> of the ' + plainCount(T.rT[jF]) + ' cases in row ' + yF + ', ' + plainCount(v) + ' are in column ' + xF + ': ' + nw(tx(pctTex(v, T.rT[jF]))) + '.');
      if (!T.cT[iF].isZero()) pl.push('<b>Column percentage:</b> of the ' + plainCount(T.cT[iF]) + ' cases in column ' + xF + ', ' + plainCount(v) + ' are in row ' + yF + ': ' + nw(tx(pctTex(v, T.cT[iF]))) + '.');
      pl.push('<b>Joint percentage:</b> of all ' + plainCount(T.N) + ' cases, ' + plainCount(v) + ' are in both: ' + nw(tx(pctTex(v, T.N))) + '.');
      steps.push({
        html: '<b>The same shares as percentages</b> (times 100%, the way L4.3 reads them), for the cell in row ' + yF + ' and column ' + xF + ':',
        block: h('div', { class: 'w4-plines' }, pl.map(t => K.note(t, ''))),
        note: 'The row percentage answers “what share of this row?”, the column percentage “what share of this column?” — usually two different numbers.',
      });
      if (A.kind === 'one') steps.push({ html: '<b>Compare the row profiles.</b> ' + verdictHtml() });
      else {
        steps.push({
          html: '<b>Compare the row profiles</b> (L4.3). ' + (A.kind === 'none' ? 'Every row has the same share in every column, for example in column ' + xF + ':' : 'In column ' + xF + ' the rows differ most:'),
          block: h('div', {}, mlines(...A.valid.map(j => [T.ys[j], ratio(T.n[j][b.i], T.rT[j])]), ['All rows', ratio(T.cT[b.i], T.N)],
            '\\text{largest}-\\text{smallest}=' + gapTexOf(A.share[b.hi][b.i], A.share[b.lo][b.i])), h('div', { class: 'w4-verdict ' + A.kind, html: verdictHtml() })),
        });
      }
      const E = A.E;
      steps.push({
        html: '<b>Expected counts.</b> With your row and column totals but <b>no association</b>, every row would have the all-rows profile. For a cell with row total ' + tx('R') + ' and column total ' + tx('C') + ', its count would be' + (I > 1 ? ' (column ' + xF + ' here; the last table of “Association?” has every cell)' : '') + ':',
        block: mlines('E=n\\cdot\\frac{R}{n}\\cdot\\frac{C}{n}=\\frac{R\\times C}{n}', ...T.ys.map((y, j) => [y, V(T.N) + '\\cdot\\frac{' + V(T.rT[j]) + '}{' + V(T.N) + '}\\cdot\\frac{' + V(T.cT[iF]) + '}{' + V(T.N) + '}=\\frac{' + V(T.rT[j]) + '\\times ' + V(T.cT[iF]) + '}{' + V(T.N) + '}' + S.eqt(E[j][iF]) + '\\quad(\\text{yours: }' + V(T.n[j][iF]) + ')'])),
        note: A.off === 0 ? 'Every one of your counts equals its expected count ✓ — your table is exactly the “no association” table.' : A.off + ' of your ' + (J * I) + ' counts differ from their expected counts. The further apart they are, the more the row profiles differ.',
      });
      body.appendChild(S.steps(steps));
    }

    patchCorner();
  }

  Lab.lab({
    id: 'lab-s1-table', course: 's1', week: 4, order: 1,
    title: 'Two categorical variables lab', sub: 'Week 4 · contingency tables',
    topics: ['contingency table', 'totals', 'joint relative frequency', 'row relative frequency', 'column relative frequency', '100% stacked bar chart', 'association', 'expected counts'],
    desc: 'Type your own table of counts with your own names. See the totals as sums, the joint, row and column relative frequencies with every division shown, bar charts of the row profiles, and whether the two variables are associated — with the expected counts of a table with no association.',
    render: host => tableLab(host),
  });
})();
