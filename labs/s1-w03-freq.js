/* Playground lab — Statistics I, Week 3: frequency tables, histograms and stem-and-leaf (lab-s1-freq).
   Input: raw numbers, or a typed frequency table (values with counts, or classes [L, U) with counts).
   Shows the discrete frequency table (value | f | f/n | cumulative), the class table for a learner-chosen
   width and start (every boundary value explained: a class [L, U) contains its left end), class marks,
   a histogram with touching bars (frequency or relative frequency), the stem-and-leaf display, and the
   grouped mean Σf·x/Σf (exact) or Σf·m/Σf with class marks (approximate) next to the raw mean.
   Course rules: Statistics I revision notes, Week 3. Exact arithmetic and helpers come from
   Lab.play.stat1, defined in labs/s1-w03-describe.js (read when the lab is opened, after all files load). */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg } = Lab;

  /* Lecture and tutorial examples: every number was read from the lecture slides / sheets (frames checked)
     and re-checked with exact fractions. Times are minute marks in the YouTube videos. */
  const L1 = 'Lecture W3_L1 (Frequency tables for numerical data)', L2 = 'Lecture W3_L2 (Mean)';
  const M50 = '68, 79, 38, 68, 35, 70, 61, 47, 58, 66, 60, 45, 61, 60, 59, 45, 39, 80, 59, 62, 49, 76, 54, 60, 53, 55, 62, 58, 67, 55, 86, 56, 63, 64, 67, 50, 51, 78, 56, 62, 57, 69, 58, 52, 42, 66, 42, 56, 58, 57';
  const M50CLS = [['30', '40', '3'], ['40', '50', '6'], ['50', '60', '18'], ['60', '70', '17'], ['70', '80', '4'], ['80', '90', '2']];
  const HOUSE = '2, 1, 3, 4, 5, 2, 3, 3, 3, 4, 4, 1, 2, 3, 4';
  const FEES = '20, 20, 40, 40, 60, 80, 80, 20, 100, 60, 60, 120, 120, 80, 80, 120, 40, 40, 20, 100, 20, 20, 20, 40, 60, 80, 80, 100, 100, 140';
  const LECTURE_PRESETS = [
    { label: 'Marks of 50 students: classes of width 10', mode: 'raw', raw: M50, w: '10', L1: '30', bars: 'cls', source: L1 + ', at 17:00: classes 30–40, …, 80–90 of width 10; a class keeps its left end, so 70 goes in 70–80 (19:00). Frequencies 3, 6, 18, 17, 4, 2 (table at 19:30), histogram at 21:30. ' + L2 + ', at 13:00: Σf·m = 2940, x̄ ≈ 2940/50 = 58.8; the exact mean of the 50 marks is 2939/50 = 58.78. Note: the slide lists only 49 marks (one 57 is missing); these 50 come from her Google Sheet (at 24:40), which matches her table.' },
    { label: 'Marks of 50 students: the class table only', mode: 'cls', crows: M50CLS, bars: 'cls', source: L2 + ', at 12:30: with only the class table, each class is represented by its midpoint 35, 45, …, 85: x̄ ≈ (3×35 + 6×45 + 18×55 + 17×65 + 4×75 + 2×85)/50 = 2940/50 = 58.8, "an approximation" (14:00).' },
    { label: 'Household sizes of 15 people: one bar per value', mode: 'raw', raw: HOUSE, w: '1', L1: '1', bars: 'val', source: L1 + ', at 07:00: few distinct values, so each value is a category: frequencies 2, 3, 5, 4, 1 and relative frequencies 2/15, 3/15, 5/15, 4/15, 1/15 (09:30); a bar chart with gaps between the bars (12:30). ' + L2 + ', at 09:30: Σf·x = 44, x̄ = 44/15, written 2.93 (≈ 2.9333).' },
    { label: 'Ages of 11 patients: stem-and-leaf', mode: 'raw', raw: '15, 22, 29, 36, 31, 23, 45, 10, 25, 28, 48', w: '10', L1: '10', bars: 'cls', source: L1 + ', at 29:30: stems 1 to 4; leaves sorted: 1 | 0 5, 2 | 2 3 5 8 9, 3 | 1 6, 4 | 5 8 (final plot at 32:00).' },
    { label: 'Vehicle speeds (km/h): classes with counts', mode: 'cls', crows: [['10', '20', '4'], ['20', '30', '7'], ['30', '40', '5'], ['40', '50', '3'], ['50', '60', '6'], ['60', '70', '5']], bars: 'cls', source: 'W3_Tutorial 1, at 00:30: counts read from the histogram: 4, 7, 5, 3, 6, 5 (n = 30); the class marks 15, …, 65 give x̄ ≈ 1200/30 = 40 km/h (04:30), the speed limit. 6 + 5 = 11 vehicles at 50 km/h or more; 7 + 5 = 12 in [20, 40).' },
    { label: 'Annual fees of 30 students (₹ thousand)', mode: 'raw', raw: FEES, w: '20', L1: '20', bars: 'val', source: 'W3_Tutorial 2, at 00:00: counting each value gives 20: 7, 40: 5, 60: 4, 80: 6, 100: 4, 120: 3, 140: 1 (n = 30).' },
    { label: 'Class attendance over 17 days: stem-and-leaf', mode: 'raw', raw: '11, 12, 14, 20, 25, 26, 27, 31, 32, 33, 37, 38, 40, 41, 43, 45, 52', w: '10', L1: '10', bars: 'cls', source: 'W3_Tutorial 3, at 00:00: key 1 | 4 = 14 students; 17 days with total 527, mean 527/17 = 31 (03:30).' },
    { label: '30 rolls of a die: values with counts', mode: 'vals', vrows: [['1', '4'], ['2', '6'], ['3', '7'], ['4', '5'], ['5', '3'], ['6', '5']], w: '1', L1: '1', bars: 'val', source: 'W3_Tutorial 5, at 00:00: Σf·x = 102, x̄ = 102/30 = 3.4 (02:00), mode 3 (the highest frequency, 7). Its variance and SD are in the Describe-a-dataset lab.' },
  ];
  const SRC = 'Made for this lab in the style of the Week 3 questions (not from a lecture)';
  const HEIGHTS = '152, 160, 148, 165, 158, 171, 155, 162, 150, 168, 163, 157, 160, 149, 175, 166, 154, 159, 161, 170';
  const MARKS = '45, 52, 67, 71, 58, 63, 49, 77, 82, 55, 61, 69, 73, 58, 64, 90, 47, 66, 72, 59, 68, 81, 54, 62, 75';
  const SIBS = '1, 2, 0, 1, 3, 1, 2, 2, 0, 1, 4, 1, 2, 3, 1, 0, 2, 1, 1, 2';
  const TIMES = '0.42, 0.37, 0.51, 0.45, 0.39, 0.48, 0.55, 0.41, 0.36, 0.44, 0.47, 0.52, 0.40, 0.43, 0.38, 0.49';
  const GOALS = [['0', '6'], ['1', '9'], ['2', '8'], ['3', '4'], ['4', '2'], ['5', '1']];
  const OWN_CLS = [['20', '30', '4'], ['30', '40', '7'], ['40', '50', '12'], ['50', '60', '14'], ['60', '70', '8'], ['70', '80', '5']];
  const OWN_PRESETS = [
    { label: 'Heights of 20 students (cm): values on the boundaries', mode: 'raw', raw: HEIGHTS, w: '5', L1: '145', bars: 'cls', source: SRC + '. Six of the values sit exactly on class boundaries; the rule "class [L, U) contains the left end" decides each one.' },
    { label: 'Exam marks of 25 students: stem-and-leaf', mode: 'raw', raw: MARKS, w: '10', L1: '40', bars: 'cls', source: SRC + '. Two-digit marks: stem = all but the last digit (tens), leaf = the last digit (units).' },
    { label: 'Siblings of 20 students: discrete data', mode: 'raw', raw: SIBS, w: '1', L1: '0', bars: 'val', source: SRC + '. Few distinct values, so one row per value.' },
    { label: 'Goals in 30 matches: values with counts', mode: 'vals', vrows: GOALS, w: '1', L1: '0', bars: 'val', source: SRC + '. A frequency table typed directly: each value with its count.' },
    { label: 'Test scores: classes with counts', mode: 'cls', crows: OWN_CLS, bars: 'cls', source: SRC + '. Only class counts are known, so the mean must use class marks (approximate).' },
    { label: 'Reaction times (s): two decimals', mode: 'raw', raw: TIMES, w: '0.05', L1: '0.35', bars: 'cls', source: SRC + '. Decimals: the leaf is the last (hundredths) digit.' },
  ];
  const KEY = 'lab:s1-freq';
  const DEF = { mode: 'raw', raw: M50, vrows: [['1', '4'], ['2', '6'], ['3', '7'], ['4', '5'], ['5', '3'], ['6', '5']], crows: M50CLS, w: '10', L1: '30', hgt: 'f', bars: 'cls' };
  const MAXN = 5000;

  /* ------------------------------------------------------------ row editor */
  /** Small editable table: cols [{label (html), aria}], rows [[text]]. onChange(rows, mark(badCells: Set 'i,j')). */
  function rowEditor({ cols, rows, onChange, nextRow }) {
    let R = rows.map(r => r.slice());
    const grid = h('div', { class: 'w3-ed-grid' });
    const add = Lab.button('+ row', () => { R.push(nextRow(R)); draw(); emit(); }, 'btn xs');
    const wrap = h('div', { class: 'pl-field w3-ed' }, grid, h('div', { class: 'pl-chips' }, add));
    function draw() {
      Lab.clear(grid);
      grid.style.gridTemplateColumns = 'repeat(' + cols.length + ', minmax(0, 1fr)) 28px';
      cols.forEach(c => grid.appendChild(h('div', { class: 'w3-ed-h', html: c.label })));
      grid.appendChild(h('span'));
      R.forEach((r, i) => {
        cols.forEach((c, j) => {
          const inp = h('input', { class: 'field mono w3-ed-in', value: r[j], spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': c.aria + ', row ' + (i + 1) });
          inp.addEventListener('input', () => { R[i][j] = inp.value; emitSoon(); });
          grid.appendChild(inp);
        });
        const del = h('button', { class: 'icon-btn pe-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove row ' + (i + 1), title: 'remove this row' });
        del.addEventListener('click', () => { if (R.length > 1) { R.splice(i, 1); draw(); emit(); } });
        grid.appendChild(del);
      });
    }
    const mark = bad => Lab.$$('.w3-ed-in', grid).forEach((el, idx) => el.classList.toggle('bad', bad.has(Math.floor(idx / cols.length) + ',' + (idx % cols.length))));
    function emit() { onChange(R.map(r => r.slice()), mark); }
    const emitSoon = Lab.debounce(emit, 220);
    draw();
    wrap.set = rows2 => { R = rows2.map(r => r.slice()); draw(); emit(); };
    return wrap;
  }

  function freqLab(host) {
    const S = K.stat1;
    if (!S) throw new Error('This lab needs labs/s1-w03-describe.js, which is loaded with the other labs.');
    if (host.w3Off) host.w3Off();
    const saved = Lab.store.get(KEY, {});
    const st = Object.assign({}, DEF, saved);
    st.vrows = (st.vrows || DEF.vrows).map(r => r.slice());
    st.crows = (st.crows || DEF.crows).map(r => r.slice());
    const save = () => Lab.store.set(KEY, st);
    let D = null, pick = -1;
    const ctl = {}, P = {};
    const tex = s => Lab.tex(s);
    const { side, main } = K.layout(host, 's1w3');
    host.classList.add('w3-freq');
    const onResize = Lab.debounce(() => { if (!host.isConnected) { window.removeEventListener('resize', onResize); return; } if (D) drawHist(); }, 200);
    window.addEventListener('resize', onResize);
    host.w3Off = () => window.removeEventListener('resize', onResize);

    /* ---------------- controls */
    side.appendChild(K.group('1 · Your data'));
    ctl.mode = Lab.seg([{ label: 'Raw numbers', value: 'raw' }, { label: 'Values + counts', value: 'vals' }, { label: 'Classes + counts', value: 'cls' }], st.mode, v => { st.mode = v; save(); syncMode(); recompute(); });
    ctl.mode.classList.add('w3-seg3');
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'What will you type?' }), ctl.mode));
    ctl.raw = K.listField({ label: 'Raw values, with commas or spaces between them', value: st.raw, rows: 4, onChange: () => { st.raw = ctl.raw.input.value; save(); if (st.mode === 'raw') recompute(); } });
    ctl.vals = rowEditor({
      cols: [{ label: 'value ' + tex('x'), aria: 'value' }, { label: 'frequency ' + tex('f'), aria: 'frequency' }], rows: st.vrows,
      nextRow: R => { const last = R.length ? S.readNum(R[R.length - 1][0]) : null; return [last ? S.str(last.add(S.R1)) : '0', '1']; },
      onChange: (rows, mark) => { st.vrows = rows; save(); if (st.mode === 'vals') recompute(mark); },
    });
    ctl.cls = rowEditor({
      cols: [{ label: 'from ' + tex('L'), aria: 'lower limit L' }, { label: 'to ' + tex('U'), aria: 'upper limit U' }, { label: 'frequency ' + tex('f'), aria: 'frequency' }], rows: st.crows,
      nextRow: R => { const l = R[R.length - 1] || ['0', '10']; const a = S.readNum(l[0]), b = S.readNum(l[1]); return a && b ? [S.str(b), S.str(b.add(b.sub(a))), '1'] : ['0', '10', '1']; },
      onChange: (rows, mark) => { st.crows = rows; save(); if (st.mode === 'cls') recompute(mark); },
    });
    ctl.vals.prepend(h('label', { class: 'pl-label', text: 'Each value once, with how many times it occurs' }));
    ctl.cls.prepend(h('label', { class: 'pl-label', html: 'Classes ' + tex('[L,U)') + ' with their frequencies' }));
    ctl.msg = h('div', { class: 'pl-hint w3-msg' });
    side.append(ctl.raw, ctl.vals, ctl.cls, ctl.msg);
    ctl.presets = S.presetMenu({ label: 'Examples: the professor\u2019s first', groups: [{ label: 'From the Week 3 lectures and tutorials', items: LECTURE_PRESETS }, { label: 'Made for this lab', items: OWN_PRESETS }], onPick: loadPreset });
    side.appendChild(ctl.presets);

    ctl.clsGroup = h('div', { class: 'w3-side-block' });
    ctl.clsGroup.appendChild(K.group('2 · Classes [L, U) for your values'));
    ctl.w = S.freeField({ label: 'Class width ' + tex('w'), min: 0.5, max: 50, step: 0.5, value: st.w, onChange: (r, s) => { st.w = s; save(); recompute(); } });
    ctl.L1 = S.freeField({ label: 'Start: lower limit of the first class ' + tex('L_1'), min: 0, max: 200, step: 1, value: st.L1, onChange: (r, s) => { st.L1 = s; save(); recompute(); } });
    ctl.suggest = Lab.button('Suggest a width and start', () => { if (!D || D.kind !== 'raw') return; const sg = suggest(D.xs); st.w = sg.w; st.L1 = sg.L1; ctl.w.set(sg.w); ctl.L1.set(sg.L1); save(); recompute(); }, 'btn xs');
    ctl.clsGroup.append(ctl.w, ctl.L1, h('div', { class: 'pl-chips' }, ctl.suggest));
    side.appendChild(ctl.clsGroup);

    side.appendChild(K.group('3 · Histogram'));
    ctl.hgt = Lab.seg([{ label: 'Frequency', value: 'f' }, { label: 'Relative frequency', value: 'rf' }], st.hgt === 'den' ? 'f' : st.hgt, v => { st.hgt = v; save(); drawHist(); });
    ctl.bars = Lab.seg([{ label: 'Classes [L, U)', value: 'cls' }, { label: 'One bar per value', value: 'val' }], st.bars, v => { st.bars = v; save(); drawHist(); });
    ctl.barsField = h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Bars for' }), ctl.bars);
    side.append(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Bar height' }), ctl.hgt), ctl.barsField);
    side.appendChild(K.group('4 · Go to'));
    const nav = h('div', { class: 'pl-chips w3-nav' });
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, {}); freqLab(host); }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = K.answer();
    P.disc = K.panel('Frequency table: one row per value');
    P.cls = K.panel('Class frequency table');
    P.hist = K.panel('Histogram');
    P.stem = K.panel('Stem-and-leaf display', 'Course notes: stem = all but the last digit, leaf = the last digit; sort the leaves.');
    P.mean = K.panel('Grouped mean', 'From a frequency table: ' + tex('\\bar x=\\frac{\\sum f_i x_i}{\\sum f_i}') + ', or with class marks ' + tex('m_i') + ' for continuous data (approximate): ' + tex('\\bar x\\approx\\frac{\\sum f_i m_i}{\\sum f_i}') + '.');
    main.append(P.answer, P.disc, P.cls, P.hist, P.stem, P.mean);
    [['Value table', P.disc], ['Class table', P.cls], ['Histogram', P.hist], ['Stem-and-leaf', P.stem], ['Grouped mean', P.mean]]
      .forEach(([t, p]) => nav.appendChild(Lab.button(t, () => p.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn xs')));
    P.histChart = h('div', { class: 'w3-chart' });
    P.histRead = h('div', { class: 'w3-read ws-readout' });
    P.histTop = h('div', { class: 'w3-out' });
    P.hist.body.append(P.histTop, P.histChart, P.histRead);

    function syncMode() {
      ctl.mode.set(st.mode);
      ctl.raw.hidden = st.mode !== 'raw';
      ctl.vals.hidden = st.mode !== 'vals';
      ctl.cls.hidden = st.mode !== 'cls';
      ctl.clsGroup.hidden = st.mode === 'cls';
      ctl.barsField.hidden = st.mode === 'cls';
      Lab.setHTML(ctl.msg, '');
    }
    function loadPreset(it) {
      st.mode = it.mode;
      if (it.w) { st.w = it.w; ctl.w.set(it.w); }
      if (it.L1) { st.L1 = it.L1; ctl.L1.set(it.L1); }
      if (it.bars) { st.bars = it.bars; ctl.bars.set(it.bars); }
      save();
      syncMode();
      if (it.mode === 'raw') ctl.raw.set(it.raw);
      else if (it.mode === 'vals') ctl.vals.set(it.vrows);
      else ctl.cls.set(it.crows);
    }

    /* ---------------- reading the input */
    const ht = q => S.ht(q);
    function suggest(xs) {
      const lo = xs[0].num(), hi = xs[xs.length - 1].num();
      const allInt = xs.every(x => x.isInt());
      const cands = [];
      for (let e = -4; e <= 7; e++) [1, 2, 2.5, 5].forEach(b => { const w = +(b * Math.pow(10, e)).toPrecision(6); if (!allInt || Number.isInteger(w)) cands.push(w); });
      cands.sort((a, b) => a - b);
      for (const w of cands) {
        const L1 = +(Math.floor(lo / w + 1e-9) * w).toPrecision(12);
        const k = Math.floor((hi - L1) / w + 1e-9) + 1;
        if (k <= 8) return { w: String(w), L1: String(L1) };
      }
      return { w: '1', L1: String(Math.floor(lo)) };
    }
    function readVals(mark) {
      const bad = new Set(), seen = new Map(), vals = [];
      let msg = '';
      st.vrows.forEach((r, i) => {
        const v = S.readNum(r[0]), f = S.readNum(r[1]);
        if (!v) bad.add(i + ',0');
        if (!f || !f.isInt() || f.sign() < 0) bad.add(i + ',1');
        if (v) { const key = v.toString(); if (seen.has(key)) { bad.add(i + ',0'); bad.add(seen.get(key) + ',0'); msg = 'The value ' + ht(v) + ' is typed twice; list each value once.'; } else seen.set(key, i); }
      });
      if (mark) mark(bad);
      if (bad.size) return { ok: false, msg: msg || 'Fix the red boxes: a value is a number; a frequency is a whole number 0 or more.' };
      let total = 0;
      st.vrows.forEach(r => { total += Number(S.readNum(r[1]).n); });
      if (!total) return { ok: false, msg: 'Every frequency is 0 — there are no values.' };
      if (total > MAXN) return { ok: false, msg: 'The frequencies add up to ' + total + '; this lab handles up to ' + MAXN + ' values.' };
      st.vrows.forEach(r => { const v = S.readNum(r[0]), f = Number(S.readNum(r[1]).n); for (let t = 0; t < f; t++) vals.push(v); });
      return { ok: true, vals };
    }
    function readClasses(mark) {
      const bad = new Set(), rows = [];
      st.crows.forEach((r, i) => {
        const L = S.readNum(r[0]), U = S.readNum(r[1]), f = S.readNum(r[2]);
        if (!L) bad.add(i + ',0');
        if (!U) bad.add(i + ',1');
        if (L && U && L.cmp(U) >= 0) { bad.add(i + ',0'); bad.add(i + ',1'); }
        if (!f || !f.isInt() || f.sign() < 0) bad.add(i + ',2');
        rows.push({ i, L, U, f: f && f.isInt() ? Number(f.n) : 0 });
      });
      if (mark) mark(bad);
      if (bad.size) return { ok: false, msg: 'Fix the red boxes: each class needs numbers L < U, and a whole-number frequency 0 or more.' };
      rows.sort((a, b) => a.L.cmp(b.L));
      for (let j = 1; j < rows.length; j++) if (rows[j - 1].U.cmp(rows[j].L) > 0) {
        if (mark) mark(new Set([rows[j - 1].i + ',1', rows[j].i + ',0']));
        return { ok: false, msg: 'Classes [' + ht(rows[j - 1].L) + ', ' + ht(rows[j - 1].U) + ') and [' + ht(rows[j].L) + ', ' + ht(rows[j].U) + ') overlap: each value must be in exactly one class.' };
      }
      const n = rows.reduce((a, r) => a + r.f, 0);
      if (!n) return { ok: false, msg: 'Every frequency is 0 — there are no values.' };
      return { ok: true, rows: rows.map(r => ({ L: r.L, U: r.U, f: r.f, m: r.L.add(r.U).div(S.R2) })), n };
    }
    function recompute(mark) {
      if (st.mode === 'cls') {
        const r = readClasses(mark);
        if (!r.ok) { Lab.setHTML(ctl.msg, '<span class="cbad">' + r.msg + '</span> The pictures still show your last valid table.'); return; }
        const widths = r.rows.map(c => c.U.sub(c.L));
        D = { kind: 'cls', n: r.n, classes: r.rows, unequal: widths.some(w => !w.eq(widths[0])), gaps: r.rows.slice(1).map((c, j) => (r.rows[j].U.cmp(c.L) < 0 ? [r.rows[j].U, c.L] : null)).filter(Boolean) };
        Lab.setHTML(ctl.msg, tex('k=' + r.rows.length) + ' classes, ' + tex('n=\\sum f_i=' + r.n) + ' values.');
      } else {
        let vals;
        if (st.mode === 'raw') {
          const r = S.parseList(st.raw);
          if (r.bad.length || !r.vals.length) return;
          if (r.vals.length > MAXN) { Lab.setHTML(ctl.msg, '<span class="cbad">Up to ' + MAXN + ' values, please.</span>'); return; }
          vals = r.vals;
          Lab.setHTML(ctl.msg, '');
        } else {
          const r = readVals(mark);
          if (!r.ok) { Lab.setHTML(ctl.msg, '<span class="cbad">' + r.msg + '</span> The pictures still show your last valid table.'); return; }
          vals = r.vals;
          Lab.setHTML(ctl.msg, tex('n=\\sum f_i=' + vals.length) + ' values.');
        }
        const xs = S.sorted(vals), n = xs.length;
        const span = Math.max(xs[n - 1].num() - xs[0].num(), Math.abs(xs[0].num()) * 0.05, 1e-6);
        const wStep = S.niceStep(span / 50), wMax = Math.max(S.niceStep(span) * 2, wStep * 10);
        ctl.w.setRange(wStep, wMax, wStep);
        ctl.L1.setRange(+(Math.floor((xs[0].num() - span) / wStep) * wStep).toPrecision(12), +(Math.ceil(xs[0].num() / wStep) * wStep).toPrecision(12), wStep);
        D = { kind: 'raw', vals, xs, n, groups: S.modesOf(xs).groups, sum: S.sumR(xs) };
        D.mean = D.sum.div(S.int(n));
        D.cl = makeClasses(xs);
      }
      if (st.hgt === 'den' && !(D.kind === 'cls' && D.unequal)) st.hgt = 'f';
      pick = -1;
      drawAll();
    }
    /** Classes [L1 + (j−1)w, L1 + jw) for the learner's w and L1, or an explanation of what is wrong. */
    function makeClasses(xs) {
      const w = S.readNum(st.w), L1 = S.readNum(st.L1), n = xs.length;
      const max = xs[n - 1], min = xs[0];
      if (!w || w.sign() <= 0) return { err: 'The class width ' + tex('w') + ' must be a number above 0.' };
      if (!L1) return { err: 'The start ' + tex('L_1') + ' must be a number.' };
      if (L1.cmp(min) > 0) return { err: 'You chose ' + tex('L_1=' + S.vt(L1)) + ', which is above your smallest value ' + tex(S.vt(min)) + ': that value would be in no class. Choose ' + tex('L_1\\le ' + S.vt(min)) + ', or press "Suggest".' };
      const ratio = max.sub(L1).div(w), k = Number(ratio.floor()) + 1;
      if (k > 200) return { err: 'With ' + tex('w=' + S.vt(w)) + ' you would need ' + tex('k=' + k) + ' classes. The notes use 5 to 20 classes: make ' + tex('w') + ' bigger, or press "Suggest".' };
      const classes = [];
      let j0 = 0;
      for (let j = 0; j < k; j++) {
        const L = L1.add(w.mul(S.int(j))), U = L.add(w);
        const members = [];
        while (j0 < n && xs[j0].cmp(U) < 0) { members.push(xs[j0]); j0++; }
        classes.push({ L, U, f: members.length, members, m: L.add(U).div(S.R2) });
      }
      const bnd = [];
      S.modesOf(xs).groups.forEach(g => { const t = g.v.sub(L1).div(w); if (t.isInt()) bnd.push({ v: g.v, f: g.f, j: Number(t.n) }); });
      return { w, L1, k, ratio, classes, bnd };
    }

    /* ---------------- drawing */
    function drawAll() { syncMode(); drawAnswer(); drawDisc(); drawCls(); drawHist(); drawStem(); drawMean(); expose(); }
    const fracTxt = (a, b) => a + '/' + b;
    /** "3/20 = 0.15", or "1/3 ≈ 0.3333" when the decimal does not end. */
    const relTxt = (f, n) => { const q = S.frac(f, n), t = ht(q); return fracTxt(f, n) + (t.charAt(0) === '≈' ? ' ' : ' = ') + t; };

    function classMean() {
      const cl = D.kind === 'cls' ? D.classes : (D.cl.classes || null);
      if (!cl) return null;
      const sfm = S.sumR(cl.map(c => c.m.mul(S.int(c.f))));
      return { cl, sfm, value: sfm.div(S.int(D.n)) };
    }

    function drawAnswer() {
      const cm = classMean();
      if (D.kind === 'cls') {
        K.setAnswer(P.answer, {
          ev: 'Your table: ' + tex('k=' + D.classes.length) + ' classes holding ' + tex('n=\\sum f_i=' + D.n) + ' values. The individual values are not known — only how many fall in each class.',
          sub: 'The mean can only be estimated from the class marks ' + tex('m_i=\\tfrac{L+U}{2}') + ': ' + tex('\\frac{\\sum f_i m_i}{\\sum f_i}=' + S.overTex(cm.sfm, D.n, cm.value)) + '. Largest frequency: ' + tallest(D.classes) + '.',
        });
        P.answer.insertBefore(S.bigLine(['n=\\sum f_i=' + D.n, '\\bar x\\approx ' + S.full(cm.value).replace(/^\\approx /, '')]), P.answer.lastChild);
        return;
      }
      const g = D.groups, top = g.reduce((m, x) => Math.max(m, x.f), 0);
      const most = g.filter(x => x.f === top).map(x => tex(S.vt(x.v)));
      K.setAnswer(P.answer, {
        ev: 'Your data: ' + tex('n=' + D.n) + ' values from ' + tex(S.vt(D.xs[0])) + ' to ' + tex(S.vt(D.xs[D.n - 1])) + ', with ' + g.length + ' different value' + (g.length === 1 ? '' : 's') + '.',
        sub: 'Mean from all the values: ' + tex('\\bar x=\\frac{\\sum x_i}{n}=' + S.overTex(D.sum, D.n, D.mean)) + '. ' +
          (top > 1 ? (most.length > 1 ? 'Most frequent values: ' + most.join(', ') + ' (' + top + ' times each). ' : 'Most frequent value: ' + most[0] + ' (' + top + ' times). ') : 'No value repeats. ') +
          (cm ? 'Classes: ' + tex('k=' + D.cl.k) + ' of width ' + tex('w=' + S.vt(D.cl.w)) + ' from ' + tex('L_1=' + S.vt(D.cl.L1)) + '; the class-mark mean is ' + tex(S.full(cm.value)) + ' (approximate), off by ' + tex(S.full(cm.value.sub(D.mean).abs())) + '.' : '<span class="cbad">Fix the class settings (step 2).</span>'),
      });
      P.answer.insertBefore(S.bigLine(['n=' + D.n, '\\bar x' + S.eqt(D.mean)].concat(cm ? ['\\bar x_{\\text{class marks}}' + S.eqt(cm.value)] : [])), P.answer.lastChild);
    }
    function tallest(cl) {
      const top = cl.reduce((m, c) => Math.max(m, c.f), 0);
      return cl.filter(c => c.f === top).map(c => '[' + ht(c.L) + ', ' + ht(c.U) + ')').join(', ') + ' with ' + tex('f=' + top);
    }

    /* discrete table */
    function drawDisc() {
      const body = P.disc.body;
      Lab.clear(body);
      if (D.kind === 'cls') {
        P.disc.sub('Not available for a class table: it does not say which values are inside each class.');
        return;
      }
      const n = D.n, g = D.groups;
      P.disc.sub(tex('n=' + n) + ' values, ' + g.length + ' different. Relative frequency ' + tex('=\\frac{f}{n}') + '; cumulative frequency adds the frequencies from the top down to this row.' + (g.length > 15 ? ' Many different values — the class table below groups them.' : ''));
      let cum = 0;
      const rows = g.map(r => { cum += r.f; return [ht(r.v), String(r.f), relTxt(r.f, n), String(cum), relTxt(cum, n)]; });
      body.appendChild(S.table(['value ' + tex('x'), 'frequency ' + tex('f'), 'relative frequency ' + tex('f/n'), 'cumulative frequency', 'cumulative relative frequency'], rows,
        { foot: ['total', String(n), fracTxt(n, n) + ' = 1', '', ''], cls: 'w3-num w3-ft', scroll: g.length > 14 }));
      body.appendChild(K.note('Check: the frequencies add up to ' + tex('n=' + n) + ' and the relative frequencies add up to 1. The last cumulative frequency is always ' + tex('n') + '.', 'small muted'));
    }

    /* class table */
    function drawCls() {
      const body = P.cls.body;
      Lab.clear(body);
      if (D.kind === 'raw' && D.cl.err) {
        P.cls.sub('Every class is ' + tex('[L,U)') + ': it contains its left end ' + tex('L') + ' but not its right end ' + tex('U') + ' (course notes).');
        body.appendChild(h('div', { class: 'w3-verdict differ', html: D.cl.err }));
        return;
      }
      const n = D.n;
      const cl = D.kind === 'cls' ? D.classes : D.cl.classes;
      P.cls.sub('Every class is ' + tex('[L,U)') + ': it contains its left end ' + tex('L') + ' but not its right end ' + tex('U') + ' (course notes), so each value is in exactly one class. Class mark ' + tex('m=\\frac{L+U}{2}') + '.');
      const steps = [];
      if (D.kind === 'raw') {
        const c = D.cl, min = D.xs[0], max = D.xs[n - 1];
        steps.push({ html: 'You chose the width ' + tex('w=' + S.vt(c.w)) + ' and the start ' + tex('L_1=' + S.vt(c.L1)) + ' (it must not be above the smallest value ' + tex(S.vt(min)) + ' ✓). Class ' + tex('j') + ' is ' + tex('[L_1+(j-1)w,\\ L_1+jw)') + ': ' + cl.slice(0, 3).map(x => '[' + ht(x.L) + ', ' + ht(x.U) + ')').join(', ') + (cl.length > 3 ? ', …' : '') + '. Width check (notes): next lower limit − current lower limit ' + (cl.length > 1 ? tex('=' + S.vt(cl[1].L) + '-' + S.par(S.vt(cl[0].L)) + '=' + S.vt(c.w)) : tex('=w')) + '.' });
        steps.push({ html: 'How many classes reach the largest value ' + tex(S.vt(max)) + '? The last class must contain it:', math: 'k=\\left\\lfloor\\frac{x_{\\max}-L_1}{w}\\right\\rfloor+1=\\left\\lfloor\\frac{' + S.vt(max) + '-' + S.par(S.vt(c.L1)) + '}{' + S.vt(c.w) + '}\\right\\rfloor+1=\\left\\lfloor ' + S.nt(c.ratio) + '\\right\\rfloor+1=' + (c.k - 1) + '+1=' + c.k,
          note: (c.ratio.isInt() ? 'Here ' + tex('\\frac{x_{\\max}-L_1}{w}') + ' is a whole number: the largest value sits exactly on a boundary, and because ' + tex('[L,U)') + ' leaves out its right end it needs a class of its own, ' + '[' + ht(cl[c.k - 1].L) + ', ' + ht(cl[c.k - 1].U) + '). ' : '') + (c.k < 5 || c.k > 20 ? '<span class="cbad">The notes suggest 5 to 20 classes; you have ' + c.k + '.</span>' : 'The notes suggest 5 to 20 classes: ' + c.k + ' ✓.') });
      } else {
        const widths = cl.map(x => x.U.sub(x.L));
        steps.push({ html: 'You typed ' + tex('k=' + cl.length) + ' classes (sorted by ' + tex('L') + '). Class widths ' + tex('U-L') + ': ' + widths.map(w => tex(S.vt(w))).join(', ') + '.' + (D.unequal ? ' <span class="cbad">The widths are not equal.</span> A histogram must keep area in proportion to frequency (Week 2: the area principle), so for unequal widths choose bar height "frequency ÷ width".' : ' All equal ✓.') + (D.gaps.length ? ' There is a gap between ' + D.gaps.map(gp => tex(S.vt(gp[0])) + ' and ' + tex(S.vt(gp[1]))).join(', ') + ': no class covers it.' : '') });
      }
      body.appendChild(S.steps(steps));
      let cum = 0;
      const raw = D.kind === 'raw';
      const rows = cl.map((c, j) => {
        cum += c.f;
        const list = raw ? (c.members.length ? c.members.slice(0, 8).map(ht).join(', ') + (c.members.length > 8 ? ', … (' + c.members.length + ')' : '') : '—') : null;
        const cells = ['[' + ht(c.L) + ', ' + ht(c.U) + ')', String(c.f), relTxt(c.f, n), String(cum), ht(c.m), c.f + ' × ' + ht(c.m) + ' = ' + ht(c.m.mul(S.int(c.f)))];
        if (raw) cells.push('<span class="w3-mem">' + list + '</span>');
        return { cells, cls: j === pick ? 'hl-row' : null };
      });
      const cm = classMean();
      const head = ['class ' + tex('[L,U)'), 'frequency ' + tex('f'), 'relative ' + tex('f/n'), 'cumulative ' + tex('f'), 'class mark ' + tex('m'), tex('f\\times m')].concat(raw ? ['values in it'] : []);
      const foot = ['total', String(n), fracTxt(n, n) + ' = 1', '', '', ht(cm.sfm)].concat(raw ? [''] : []);
      body.appendChild(S.table(head, rows, { foot, cls: 'w3-num w3-ct', scroll: cl.length > 14 }));
      if (raw && D.cl.bnd.length) {
        const c = D.cl;
        const items = c.bnd.map(b => {
          const times = b.f > 1 ? ' (' + b.f + ' values)' : '';
          const into = c.classes[b.j];
          if (b.j === 0) return '<li>' + tex(S.vt(b.v)) + times + ' is the left end of the first class [' + ht(into.L) + ', ' + ht(into.U) + '), so it is counted there.</li>';
          const prev = c.classes[b.j - 1];
          return '<li>' + tex(S.vt(b.v)) + times + ' is the right end of [' + ht(prev.L) + ', ' + ht(prev.U) + ') and the left end of [' + ht(into.L) + ', ' + ht(into.U) + '). A class contains its left end, not its right end, so it is counted in <b>[' + ht(into.L) + ', ' + ht(into.U) + ')</b>.</li>';
        });
        body.appendChild(h('div', { class: 'w3-bnd' }, h('div', { class: 'w3-mhead', text: 'Values that sit on a class boundary' }), h('ul', { html: items.join('') })));
      } else if (raw) {
        body.appendChild(K.note('None of your values sits exactly on a class boundary, so no value had to be decided by the ' + tex('[L,U)') + ' rule.', 'small muted'));
      } else {
        body.appendChild(K.note('A value equal to a class’s right end ' + tex('U') + ' would be counted in the next class (the one that starts at ' + tex('U') + ').', 'small muted'));
      }
    }

    /* histogram */
    function histBars() {
      const n = D.n;
      if (D.kind === 'raw' && st.bars === 'val') {
        const g = D.groups;
        let gap = null;
        for (let j = 1; j < g.length; j++) { const d = g[j].v.sub(g[j - 1].v); if (!gap || d.cmp(gap) < 0) gap = d; }
        if (!gap) gap = S.R1;
        const half = gap.mul(S.frac(3, 10));   // bar width 0.6 × gap: separate values, so the bars do not touch
        return { gap, bars: g.map(x => ({ L: x.v.sub(half), U: x.v.add(half), f: x.f, c: x.v, name: S.ht(x.v), members: null })), centred: true };
      }
      const cl = D.kind === 'cls' ? D.classes : (D.cl.classes || []);
      return { bars: cl.map(c => ({ L: c.L, U: c.U, f: c.f, name: '[' + ht(c.L) + ', ' + ht(c.U) + ')', members: c.members || null })), centred: false };
    }
    function drawHist() {
      const n = D.n;
      Lab.clear(P.histTop);
      Lab.clear(P.histChart);
      if (D.kind === 'raw' && st.bars === 'cls' && D.cl.err) { P.hist.sub('Fix the class settings (step 2) to draw class bars, or choose "One bar per value".'); Lab.setHTML(P.histRead, ''); return; }
      const hb = histBars();
      const unequal = D.kind === 'cls' && D.unequal;
      if (unequal && !ctl.hgt.querySelector('[data-den]')) {
        const b = h('button', { type: 'button', role: 'tab', 'data-den': '1', text: 'f ÷ width' });
        b.addEventListener('click', () => { st.hgt = 'den'; save(); drawHist(); });
        ctl.hgt.appendChild(b);
      }
      if (!unequal) { const b = ctl.hgt.querySelector('[data-den]'); if (b) b.remove(); if (st.hgt === 'den') st.hgt = 'f'; }
      ctl.hgt.set(st.hgt === 'den' ? '' : st.hgt);
      const db = ctl.hgt.querySelector('[data-den]');
      if (db) db.classList.toggle('on', st.hgt === 'den');
      const hv = b => (st.hgt === 'rf' ? S.frac(b.f, n) : st.hgt === 'den' ? S.int(b.f).div(b.U.sub(b.L)) : S.int(b.f));
      const yName = st.hgt === 'rf' ? 'relative frequency f/n' : st.hgt === 'den' ? 'frequency ÷ class width' : 'frequency f';
      P.hist.querySelector('h3').textContent = hb.centred ? 'Bar chart: one bar per value' : 'Histogram';
      const hText = st.hgt === 'rf' ? 'relative frequency ' + tex('f/n') + ' (the heights add up to 1)' : st.hgt === 'den' ? 'frequency ÷ width, so the <b>area</b> of each bar is its frequency' : 'frequency ' + tex('f');
      P.hist.sub(hb.centred
        ? 'Each distinct value is its own category, so the bars stand apart with gaps between them, as the professor draws them (W3_L1 at 12:30: "since these are distinct values, I am not connecting the bar charts"). Height = ' + hText + '. For a histogram with touching bars, choose "Classes [L, U)".'
        : 'Histogram: bars touch, because each bar covers its whole class ' + tex('[L,U)') + ' and the classes leave no gaps between them (W3_L1 at 23:30). Height = ' + hText + '.');
      const bars = hb.bars.map((b, j) => ({ ...b, hv: hv(b), j }));
      histogram(P.histChart, bars, { yName, centred: hb.centred, onPick: j => { pick = j; readBar(bars[j]); } });
      readBar(null);
      function readBar(b) {
        if (!b) { Lab.setHTML(P.histRead, '<span class="muted">' + (hb.centred ? 'Point at (or tap) a bar to see its value and frequency.' : 'Point at (or tap) a bar to see its class, its frequency and the values inside it.') + '</span>'); return; }
        const what = hb.centred ? 'value ' + tex(b.name) : 'class ' + b.name;
        Lab.setHTML(P.histRead, '<b>' + what + '</b>: ' + tex('f=' + b.f) + ' of ' + tex('n=' + n) + ', relative frequency ' + tex('\\frac{' + b.f + '}{' + n + '}' + S.eqt(S.frac(b.f, n))) +
          (st.hgt === 'den' ? '; height ' + tex('\\frac{' + b.f + '}{' + S.vt(b.U.sub(b.L)) + '}' + S.eqt(b.hv)) : '') + '.' +
          (b.members ? (b.members.length ? ' Values: ' + b.members.slice(0, 20).map(ht).join(', ') + (b.members.length > 20 ? ', …' : '') + '.' : ' No values in this class.') : ''));
      }
    }
    /** Histogram with touching bars. bars: [{L, U (R), f, hv (R height), name}] */
    function histogram(host, bars, o) {
      const W = S.chartWidth(host), H = 270;
      const pl = 50, pr = 16, pt = 28, pb = 46;
      const lo = Math.min(...bars.map(b => b.L.num())), hi = Math.max(...bars.map(b => b.U.num()));
      const X = v => pl + ((Number(v) - lo) / (hi - lo)) * (W - pl - pr);
      const ymax = Math.max(...bars.map(b => b.hv.num()), 1e-9);
      let yt = S.niceTicks(0, ymax, 5);
      if (st.hgt === 'f' && yt.step < 1) yt = { step: 1, ticks: Array.from({ length: Math.ceil(ymax) + 1 }, (_, k) => k) };
      const top = Math.max(ymax, yt.ticks[yt.ticks.length - 1]);
      const Y = v => pt + (1 - Number(v) / top) * (H - pt - pb);
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w3-svg w3-hist', role: 'img', 'aria-label': 'histogram' });
      yt.ticks.forEach(t => { s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 'w3-grid' })); s.appendChild(svg('text', { x: pl - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'w3-tick' }, S.tickFmt(t, yt.step))); });
      s.appendChild(svg('text', { x: pl - 44, y: 14, class: 'w3-tick' }, o.yName));
      bars.forEach(b => {
        const x0 = X(b.L), x1 = X(b.U), y = Y(b.hv.num());
        const r = svg('rect', { x: x0, y, width: Math.max(0.5, x1 - x0), height: Math.max(0, Y(0) - y), class: 'w3-bar' + (b.j === pick ? ' on' : ''), tabindex: 0, role: 'img', 'aria-label': (o.centred ? 'value ' : 'class ') + b.name + ', frequency ' + b.f });
        r.appendChild(svg('title', {}, (o.centred ? 'value ' : '') + b.name + ': f = ' + b.f));
        const act = () => { Lab.$$('.w3-bar.on', s).forEach(e => e.classList.remove('on')); r.classList.add('on'); o.onPick(b.j); };
        r.addEventListener('pointerenter', act);
        r.addEventListener('click', act);
        r.addEventListener('focus', act);
        s.appendChild(r);
        const lab = st.hgt === 'f' ? String(b.f) : S.ht(b.hv);
        if (bars.length <= 24 && S.textW(lab, 11) + 2 <= x1 - x0) s.appendChild(svg('text', { x: (x0 + x1) / 2, y: y - 5, 'text-anchor': 'middle', class: 'w3-barlab' }, lab));
      });
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(0), y2: Y(0), class: 'w3-axis' }));
      const ticks = [];
      if (o.centred) bars.forEach(b => ticks.push(b.c.num()));
      else { bars.forEach(b => ticks.push(b.L.num())); ticks.push(bars[bars.length - 1].U.num()); }
      const uniq = [...new Set(ticks)];
      const labs = uniq.map(v => S.ht(S.fromSlider(v)).replace('≈ ', ''));
      const need = Math.max(...labs.map(l => S.textW(l))) + 8;
      const every = Math.max(1, Math.ceil(need / Math.max(1, (W - pl - pr) / Math.max(1, uniq.length - (o.centred ? 0 : 1)))));
      uniq.forEach((v, k) => {
        s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: Y(0), y2: Y(0) + 5, class: 'w3-tk' }));
        if (k % every === 0) s.appendChild(svg('text', { x: X(v), y: Y(0) + 19, 'text-anchor': 'middle', class: 'w3-tick' }, labs[k]));
      });
      s.appendChild(svg('text', { x: (pl + W - pr) / 2, y: H - 6, 'text-anchor': 'middle', class: 'w3-tick' }, o.centred ? 'value x (one bar per value)' : 'class boundaries'));
      Lab.clear(host);
      host.appendChild(s);
    }

    /* stem-and-leaf */
    function drawStem() {
      const body = P.stem.body;
      Lab.clear(body);
      if (D.kind === 'cls') { body.appendChild(K.note('Not available for a class table: the stem-and-leaf display needs every individual value, and a class table only keeps the counts.')); return; }
      const xs = D.xs;
      const p = xs.reduce((m, x) => Math.max(m, S.places(x)), 0);
      if (!Number.isFinite(p) || p > 6) { body.appendChild(K.note('A stem-and-leaf display needs decimal numbers; one of your values (such as a fraction like 1/3) has no last digit.')); return; }
      const scale = 10n ** BigInt(p);
      const items = xs.map(x => { const X = x.mul(new S.R(scale)).n; const a = X < 0n ? -X : X; return { x, neg: X < 0n, stem: a / 10n, leaf: Number(a % 10n) }; });
      const key = it => (it.neg ? -Number(it.stem) - 0.5 : Number(it.stem));
      const stemTxt = (neg, stem) => {
        let t = p === 0 ? String(stem) : S.decStr(new S.R(stem, 10n ** BigInt(p - 1)), p - 1);
        if (p > 1) t = Number(t).toFixed(p - 1);
        return (neg ? '−' : '') + t;
      };
      const rowsMap = new Map();
      items.forEach(it => { const k = key(it); if (!rowsMap.has(k)) rowsMap.set(k, { neg: it.neg, stem: it.stem, leaves: [] }); rowsMap.get(k).leaves.push(it); });
      const keys = items.map(key);
      const kmin = Math.min(...keys), kmax = Math.max(...keys);
      const all = [];
      if (kmin < 0) for (let s0 = Math.round(-kmin - 0.5); s0 >= 0 && -s0 - 0.5 <= kmax; s0--) all.push(-s0 - 0.5);
      for (let s0 = Math.max(0, Math.ceil(kmin)); s0 <= kmax; s0++) all.push(s0);
      if (all.length > 60) { body.appendChild(K.note('That would need ' + all.length + ' stems (rows), too many to read. A stem-and-leaf display works when the values share all but their last digit over a short range — try the class table and histogram instead.')); return; }
      const first = items[0];
      const valueTxt = it => S.ht(it.x);
      body.appendChild(K.note('Write each value with ' + (p === 0 ? 'its digits' : p + ' decimal place' + (p > 1 ? 's' : '')) + '; the stem is everything except the last digit and the leaf is the last digit' + (p ? ' (here the ' + ['tenths', 'hundredths', 'thousandths', 'ten-thousandths', 'hundred-thousandths', 'millionths'][p - 1] + ' digit)' : '') + '. Key: <b class="mono">' + stemTxt(first.neg, first.stem) + ' | ' + first.leaf + '</b> means ' + valueTxt(first) + '. Leaves in each row are sorted' + (kmin < 0 ? '; on a negative stem the values increase as the leaves get smaller (−1 | 9 is −19, which is less than −1 | 2 = −12)' : '') + '.', 'w3-lead-in'));
      const tbl = h('table', { class: 'w3-sl' });
      const tb = h('tbody');
      all.forEach(k => {
        const r = rowsMap.get(k);
        const neg = k < 0, stem = neg ? BigInt(Math.round(-k - 0.5)) : BigInt(k);
        const leaves = r ? r.leaves.map(it => it.leaf).sort((a, b) => (neg ? b - a : a - b)) : [];
        tb.appendChild(h('tr', {}, h('td', { class: 'st', text: stemTxt(neg, stem) }), h('td', { class: 'lv', text: leaves.join(' ') || ' ' }), h('td', { class: 'ct', text: leaves.length ? '(' + leaves.length + ')' : '' })));
      });
      tbl.appendChild(tb);
      body.appendChild(h('div', { class: 'w3-slwrap' }, tbl));
      body.appendChild(K.note('Stems with no leaves stay in the display, so gaps in the data show. The numbers in brackets count the leaves: they add up to ' + tex('n=' + D.n) + '. Turned on its side, the display is a histogram with one bar per stem.', 'small muted'));
    }

    /* grouped mean */
    function drawMean() {
      const body = P.mean.body;
      Lab.clear(body);
      const steps = [];
      const cm = classMean();
      if (D.kind === 'raw') {
        const g = D.groups, n = D.n;
        const sfx = S.sumR(g.map(x => x.v.mul(S.int(x.f))));
        steps.push({ html: '<b>From the value table (exact).</b> Multiply each value by its frequency and add:<div class="w3-long">' + tex('\\sum f_i x_i=' + S.sumTex(g, x => x.f + '\\times ' + S.par(S.vt(x.v)), 30) + '=' + S.vt(sfx)) + '</div>Divide by ' + tex('\\sum f_i=n=' + n) + ':', math: '\\bar x=\\frac{\\sum f_i x_i}{\\sum f_i}=' + S.overTex(sfx, n, sfx.div(S.int(n))) });
        steps.push({ html: 'This is exactly the mean of all ' + n + ' values, ' + tex('\\frac{\\sum x_i}{n}=' + S.overTex(D.sum, n, D.mean)) + ' ✓: a frequency table of the values just groups equal values, so nothing is lost.' });
      }
      if (cm) {
        const cl = cm.cl, n = D.n;
        steps.push({ html: '<b>From the class table (approximate).</b> Each class mark ' + tex('m_i=\\frac{L+U}{2}') + ' stands in for every value in its class:<div class="w3-long">' + tex('\\sum f_i m_i=' + S.sumTex(cl, c => c.f + '\\times ' + S.par(S.vt(c.m)), 30) + '=' + S.vt(cm.sfm)) + '</div>Divide by ' + tex('\\sum f_i=n=' + n) + ':', math: '\\bar x\\approx\\frac{\\sum f_i m_i}{\\sum f_i}=' + S.overTex(cm.sfm, n, cm.value) });
        if (D.kind === 'raw') {
          const diff = cm.value.sub(D.mean);
          steps.push({ html: 'Compare with the exact mean ' + tex('\\bar x' + S.eqt(D.mean)) + ': ' + (diff.isZero() ? 'the same here — the values happen to balance around each class mark.' : 'the class-mark value is off by ' + tex(S.par(S.nt(cm.value)) + '-' + S.par(S.nt(D.mean)) + S.eqt(diff)) + '. The class marks pretend each value sits in the middle of its class; change ' + tex('w') + ' or ' + tex('L_1') + ' and watch the error change.') });
        } else {
          steps.push({ html: 'The exact mean cannot be found from this table: it does not say where in each class the values are. That is why the notes call the class-mark mean approximate.' });
        }
      } else if (D.kind === 'raw') {
        steps.push({ html: '<span class="cbad">Fix the class settings (step 2) to see the class-mark mean.</span>' });
      }
      body.appendChild(S.steps(steps));
    }

    /** Exact results as fractions in a data attribute (read by the test scripts; nothing on screen). */
    function expose() {
      const s = q => (q ? q.toString() : null);
      const cm = classMean();
      const out = { kind: D.kind, n: D.n, cm: cm ? s(cm.value) : null, sfm: cm ? s(cm.sfm) : null };
      if (D.kind === 'raw') {
        Object.assign(out, { mean: s(D.mean), groups: D.groups.map(g => [s(g.v), g.f]), w: st.w, L1: st.L1, err: D.cl.err ? 1 : 0 });
        if (!D.cl.err) Object.assign(out, { k: D.cl.k, classes: D.cl.classes.map(c => [s(c.L), s(c.U), c.f]), bnd: D.cl.bnd.map(b => [s(b.v), b.f, b.j]) });
        out.stems = Lab.$$('.w3-sl tr', P.stem.body).map(tr => [tr.children[0].textContent, tr.children[1].textContent.trim()]);
      } else {
        out.classes = D.classes.map(c => [s(c.L), s(c.U), c.f]);
      }
      host.dataset.w3 = JSON.stringify(out);
    }

    syncMode();
    if (st.mode === 'vals') setTimeout(() => recompute(), 0);
    if (st.mode === 'cls') setTimeout(() => recompute(), 0);
  }

  Lab.lab({
    id: 'lab-s1-freq', course: 's1', week: 3, order: 2,
    title: 'Frequency tables and histogram lab', sub: 'Week 3 · tables and graphs',
    topics: ['frequency table', 'relative frequency', 'cumulative', 'classes [L, U)', 'class marks', 'histogram', 'stem-and-leaf', 'grouped mean'],
    desc: 'Type raw numbers or a frequency table (values with counts, or classes with counts). See the value table, a class table with your own width and start (every boundary value explained), the histogram, the stem-and-leaf display and the grouped mean next to the exact mean.',
    render: host => freqLab(host),
  });
})();
