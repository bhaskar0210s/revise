/* Playground lab — Statistics I, Week 4 (L4.4–L4.9): association between two numerical variables, and between a
   numerical and a two-category variable (lab-s1-scatter). Two tabs.
   Tab 1: the learner types paired data (a table of pairs, or two lists) or drags, adds and removes points on the
   scatterplot. Every panel is recomputed exactly: the scatterplot with the mean lines, the signed rectangles
   (x−x̄)(y−ȳ) and the fitted line; the deviations table with column sums; Cov_pop (÷ n), Cov_sample (÷ (n−1)) and the
   computational form Σxy − n·x̄·ȳ; s_x and s_y; Pearson's r; the least-squares line ŷ = mx + c with R² = r²; and a
   direction / form / strength / outliers description generated from the data (rules stated on screen).
   Tab 2: point-biserial correlation r_pb = (Ȳ0 − Ȳ1)/σx·√(p0·p1) with the POPULATION SD of X (course notes), the
   conversion nσ² = (n−1)s², the absolute form, and checks with the lecture's "sample correction" and Pearson's r.
   Arithmetic is exact (fractions); a value is printed exactly when it is a short decimal, otherwise to 4 decimal
   places with "≈" (square roots used inside a further step keep 6 places).
   Sources: Statistics I revision notes, Week 4; lecture transcripts and Google Sheets screens of L4.4–L4.9.
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
  /** keep a short formula and the punctuation after it on one line */
  const nw = html => '<span class="w4-nw">' + html + '</span>';
  /** plain-text "= 82.25" or "≈ 78.6667" for SVG labels */
  const eqTxt = (S, q) => { const t = S.ht(q); return t.charAt(0) === '≈' ? t : '= ' + t; };
  const KEY = 'lab:s1-scatter';
  const MAXN = 200;

  /* ------------------------------------------------------------------ examples */
  const pairs = (xs, ys) => xs.map((x, k) => [String(x), String(ys[k])]);
  const NUM_PRESETS = [
    { label: 'L4.4–L4.7 · age and height of 5 children', xName: 'Age (years)', yName: 'Height (cm)', pts: pairs([1, 2, 3, 4, 5], [75, 85, 94, 101, 108]),
      source: 'Lectures 4.4 (the scatterplot), 4.6 (covariance: sum of products 82, population 16.4, sample 20.5) and 4.7 (r = 0.9964, “a positive very strong linear relationship”).' },
    { label: 'L4.6–L4.7 · age of a car and its price (5 cars)', xName: 'Age of the car (years)', yName: 'Price (lakh ₹)', pts: pairs([1, 2, 3, 4, 5], [6, 5, 4, 3, 2]),
      source: 'Lectures 4.6 (covariance: sum of products −10, population −2, sample −2.5) and 4.7 (r = −1, a perfect negative linear relationship).' },
    { label: 'L4.4, L4.7, L4.8 · house size and price, data set 1 (15 homes)', xName: 'Size (1000 sq ft)', yName: 'Price (lakh ₹)',
      pts: pairs([0.8, 1, 1.1, 1.3, 1.6, 1.8, 2.3, 2.3, 2.5, 2.5, 2.7, 3.1, 3.1, 3.2, 3.4], [68, 81, 72, 91, 87, 56, 83, 112, 93, 98, 136, 109, 122, 159, 170]),
      source: 'Lectures 4.4 (the real-estate agent’s 15 homes), 4.7 (Google Sheets CORREL = 0.804) and 4.8 (Sheets trendline price = 30.5·size + 36, R² = 0.647). Values read from the lecture’s sheet.' },
    { label: 'L4.4, L4.7 · house size and price, data set 2 (15 homes)', xName: 'Size (1000 sq ft)', yName: 'Price (lakh ₹)',
      pts: pairs([0.5, 0.6, 0.9, 1.1, 1.3, 1.4, 1.5, 2, 2.2, 2.6, 2.7, 3, 3.1, 3.3, 3.4], [201, 69, 122, 133, 207, 71, 149, 122, 188, 198, 88, 207, 133, 206, 90]),
      source: 'Lectures 4.4 (“I do not see any clear pattern”) and 4.7 (CORREL = 0.149, “very close to 0”). Values read from the lecture’s sheet.' },
    { label: 'Made for this lab · a curve with r = 0 (speed and fuel)', xName: 'Speed (km/h)', yName: 'Fuel used (L per 100 km)', pts: pairs([20, 30, 40, 50, 60, 70, 80], [9, 7, 5.8, 5.5, 5.8, 7, 9]),
      source: 'made for this lab: a clear U-shaped curve, yet r = 0 exactly. r measures only straight-line association (course notes: “r = 0 = no linear association (a curve can still exist)”).' },
    { label: 'Made for this lab · one outlier (hours studied and marks)', xName: 'Hours studied', yName: 'Marks', pts: pairs([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [35, 41, 46, 52, 57, 15, 68, 72, 79, 84]),
      source: 'made for this lab: nine students follow a clear line; student 6 does not (L4.5: an outlier does not follow the pattern of the other points). Compare r with and without it.' },
    { label: 'Made for this lab · negative, not perfect (screen time and sleep)', xName: 'Screen time (hours/day)', yName: 'Sleep (hours)', pts: pairs([1, 1.5, 2, 3, 3.5, 4, 5, 6, 7], [8.2, 7.1, 7.9, 6.8, 7.6, 6.4, 7, 6.1, 6.6]),
      source: 'made for this lab: a downward trend with scatter — a “reasonable” (not strong) negative association on the L4.7 scale.' },
  ];
  const PB_PRESETS = [
    { label: 'L4.9 · gender and marks, test 1 (20 students)', xName: 'Marks (out of 100)', yName: 'Gender', g0name: 'Male', g1name: 'Female',
      g0: '69, 75, 83, 92, 71, 94, 84, 90', g1: '71, 67, 65, 91, 85, 69, 75, 79, 86, 75, 90, 91',
      source: 'Lecture 4.9 (sheet “point serial”, columns D–E): female coded 1, male coded 0. The lecture’s value is 0.1881 (RhoPS = 0.1881086147): close to 0, “gender really has no association with the marks”. The sheet also shows Sx = 9.5746 — that is the sample SD s; 0.1881 comes from the population σx = 9.3322, as in the course formula.' },
    { label: 'L4.9 · gender and marks, test 2 (same 20 students)', xName: 'Marks (out of 100)', yName: 'Gender', g0name: 'Male', g1name: 'Female',
      g0: '68, 70, 66, 68, 72, 67, 70, 72', g1: '86, 92, 92, 91, 90, 90, 89, 92, 92, 81, 93, 90',
      source: 'Lecture 4.9 (columns F–G): the lecture gets −0.9636 with this coding and 0.9636 with the codes swapped — “gender seems to play a role”.' },
    { label: 'Made for this lab · five numbers to check by hand', xName: 'Score', yName: 'Group', g0name: 'A', g1name: 'B', g0: '4, 6, 8', g1: '10, 12',
      source: 'made for this lab: small whole numbers, so every step can be redone on paper.' },
  ];

  /* ------------------------------------------------------------------ state */
  const DEF_NUM = () => ({ xName: NUM_PRESETS[0].xName, yName: NUM_PRESETS[0].yName, pts: NUM_PRESETS[0].pts.map(p => p.slice()), mode: 'table', rects: true, line: true, resid: false, tap: 'move' });
  const DEF_PB = () => { const p = PB_PRESETS[0]; return { xName: p.xName, yName: p.yName, g0name: p.g0name, g1name: p.g1name, g0: p.g0, g1: p.g1 }; };
  function loadState() {
    const s = Lab.store.get(KEY, null) || {};
    const st = { tab: s.tab === 'pb' ? 'pb' : 'num' };
    st.num = Object.assign(DEF_NUM(), s.num && typeof s.num === 'object' ? s.num : {});
    const ok = Array.isArray(st.num.pts) && st.num.pts.length >= 1 && st.num.pts.every(r => Array.isArray(r) && r.length === 2);
    if (!ok) st.num.pts = DEF_NUM().pts;
    st.num.pts = st.num.pts.map(r => [String(r[0]), String(r[1])]);
    if (!['table', 'lists'].includes(st.num.mode)) st.num.mode = 'table';
    if (!['move', 'add', 'remove'].includes(st.num.tap)) st.num.tap = 'move';
    ['xName', 'yName'].forEach(k => { if (typeof st.num[k] !== 'string') st.num[k] = k === 'xName' ? 'x' : 'y'; });
    st.pb = Object.assign(DEF_PB(), s.pb && typeof s.pb === 'object' ? s.pb : {});
    ['xName', 'yName', 'g0name', 'g1name', 'g0', 'g1'].forEach(k => { if (typeof st.pb[k] !== 'string') st.pb[k] = DEF_PB()[k]; });
    return st;
  }

  /* ------------------------------------------------------------------ small shared pieces */
  const BOARD = '(L4.7 board: 0.75 to 1 strong, 0.5 to 0.75 reasonable, 0.25 to 0.5 weak, −0.25 to 0.25 no linear association; the same on the negative side. The lecture calls these “just indicator measures”.)';
  /** L4.7 band from r² (exact comparisons: |r| ≥ 0.75 ⇔ r² ≥ 0.5625, …). */
  function bandOf(S, r2) {
    if (r2.cmp(S.frac(9, 16)) >= 0) return { k: 3, word: 'strong', range: '|r|\\ge 0.75' };
    if (r2.cmp(S.frac(1, 4)) >= 0) return { k: 2, word: 'reasonable', range: '0.5\\le |r|<0.75' };
    if (r2.cmp(S.frac(1, 16)) >= 0) return { k: 1, word: 'weak', range: '0.25\\le |r|<0.5' };
    return { k: 0, word: 'no linear association', range: '|r|<0.25' };
  }
  /** The L4.7 scale from −1 to 1 with its bands and a marker at r. */
  function rScale(S, host, rNum, label, band, sign) {
    const W = S.chartWidth(host), H = 80, pl = 14, pr = 14;
    const X = v => pl + ((v + 1) / 2) * (W - pl - pr);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w4-svg', role: 'img', 'aria-label': 'where r lies on the L4.7 scale' });
    const bands = [[-1, -0.75, 'strong'], [-0.75, -0.5, 'reasonable'], [-0.5, -0.25, 'weak'], [-0.25, 0.25, 'none'], [0.25, 0.5, 'weak'], [0.5, 0.75, 'reasonable'], [0.75, 1, 'strong']];
    const narrow = W < 520;
    bands.forEach(([a, b, w]) => {
      const k = { strong: 3, reasonable: 2, weak: 1, none: 0 }[w];
      const on = band != null && band.k === k && (k === 0 || (sign > 0 ? a >= 0 : a < 0));
      s.appendChild(svg('rect', { x: X(a) + 1, y: 18, width: X(b) - X(a) - 2, height: 14, rx: 3, class: 'w4-band' + (on ? ' on' : '') }));
      const t = narrow ? { strong: 'str.', reasonable: 'reas.', weak: 'weak', none: 'none' }[w] : w;
      s.appendChild(svg('text', { x: (X(a) + X(b)) / 2, y: 13, 'text-anchor': 'middle', class: 'w4-tick' }, t));
    });
    [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1].forEach(v => s.appendChild(svg('text', { x: X(v), y: 60, 'text-anchor': 'middle', class: 'w4-tick' }, (v < 0 ? '−' : '') + String(Math.abs(v)))));
    if (rNum != null) {
      s.appendChild(svg('line', { x1: X(rNum), x2: X(rNum), y1: 15, y2: 35, class: 'w4-rline' }));
      s.appendChild(svg('path', { d: 'M' + X(rNum) + ',34 l-6,10 h12 z', class: 'w4-rmark' }));
      s.appendChild(svg('text', { x: Math.min(W - 40, Math.max(40, X(rNum))), y: 77, 'text-anchor': 'middle', class: 'w4-lab' }, label));
    }
    Lab.clear(host);
    host.appendChild(s);
  }
  /** Pointer position in the SVG's own units (the SVG is drawn W × H and may be scaled by CSS). */
  function pointerFrac(e, el, W, H) { const r = el.getBoundingClientRect(); return { px: (e.clientX - r.left) * (W / r.width), py: (e.clientY - r.top) * (H / r.height) }; }

  /* ================================================================== the lab */
  function scatterLab(host) {
    if (host.w4Off) host.w4Off();
    Lab.clear(host);
    const S = K.stat1;
    if (!S) { host.appendChild(K.note('<span class="cbad">This lab needs the exact-arithmetic kit of labs/s1-w03-describe.js, which did not load.</span>')); return; }
    const st = loadState();
    const save = () => Lab.store.set(KEY, st);
    const tabs = Lab.seg([{ label: '1 · Two numerical variables', value: 'num' }, { label: '2 · Numerical and two-category (point-biserial)', value: 'pb' }], st.tab, v => { st.tab = v; save(); show(); });
    tabs.classList.add('w4-tabs');
    const body = h('div', { class: 'w4-tabbody' });
    host.append(h('div', { class: 'w4-tabbar' }, tabs), body);
    let off = null;
    function show() {
      if (off) off();
      off = null;
      Lab.clear(body);
      body.className = 'w4-tabbody';
      delete body.dataset.w4num; delete body.dataset.w4pb;
      off = (st.tab === 'pb' ? pbTab : numTab)(body, st, save, S, () => scatterLab(host));
      Lab.renderMath(body);
    }
    host.w4Off = () => { if (off) off(); off = null; };
    show();
  }

  /* ================================================================== tab 1: two numerical variables */
  function numTab(root, stAll, save, S, restart) {
    const st = stAll.num;
    const { side, main } = K.layout(root, 'w4s');
    const ctl = {}, P = {};
    let D = null, AN = null, dom = null, dims = null, drag = null, hot = -1, flags = { res: [], x: [], y: [] };
    const N1 = S.R1;
    let syncing = false;

    /* ---------------- number formats */
    const V = q => S.vt(q);                       // exact decimal, or 4 places
    const NT = q => S.nt(q);                      // shortest exact form (decimal, fraction) or 4 places
    const shownExact = q => S.exact(q) || S.fracOk(q);
    /** inside a step that goes on to divide: exact form, else 6 decimal places */
    const NT6 = q => (shownExact(q) ? NT(q) : S.decStr(q, 6));
    const D6 = q => (S.exact(q) ? V(q) : S.decStr(q, 6));
    const P_ = t => S.par(t);
    const eq = q => S.eqt(q);                     // "=3" / "=\frac{22}{7}\approx 3.1429"
    const relOf = (...qs) => (qs.every(shownExact) ? '=' : '\\approx ');
    /** a square root to 6 places (for use inside a further step) */
    const root6 = q => { const r = S.sqrtExact(q); return r ? { ex: true, t: V(r), q: r } : { ex: false, t: S.sqrtDec(q, 6) }; };
    const rTex = (sign, r2) => { const r = S.sqrtExact(r2); return r ? (sign < 0 && !r.isZero() ? '=-' : '=') + V(r) : '\\approx ' + (sign < 0 ? '-' : '') + S.sqrtDec(r2, 4); };
    const rNum = (sign, r2) => (sign < 0 ? -1 : 1) * Math.sqrt(r2.num());
    const rTxt = (sign, r2) => { const r = S.sqrtExact(r2); return r ? (sign < 0 && !r.isZero() ? '−' : '') + S.ht(r) : '≈ ' + (sign < 0 ? '−' : '') + S.sqrtDec(r2, 4); };
    const xN = () => user(st.xName), yN = () => user(st.yName);
    /** a share as a percentage, exact or to 2 places: "33.02\\%" (TeX, with ≈ when rounded) */
    /** a small non-negative value: exact, "≈ 0.0068", or "< 0.0001" when it would round to 0 */
    const tiny = q => (S.exact(q) ? V(q) : q.sign() > 0 && q.cmp(S.frac(1, 20000)) < 0 ? '<0.0001' : '\\approx ' + V(q));
    const pct2 = q => { const p = q.mul(S.int(100)); return (S.exact(p) ? '' : '\\approx ') + S.decStr(p, S.exact(p) ? S.places(p) : 2) + '\\%'; };

    /* ---------------- controls */
    side.appendChild(K.group('1 · Your paired data'));
    ctl.xName = K.textField({ label: 'Name of ' + tx('x') + ' (explanatory variable, across)', value: st.xName, mono: false, onChange: v => { st.xName = v; save(); ctl.pairs.heads(st.xName, st.yName); if (D) drawAll(); } });
    ctl.yName = K.textField({ label: 'Name of ' + tx('y') + ' (response variable, up)', value: st.yName, mono: false, onChange: v => { st.yName = v; save(); ctl.pairs.heads(st.xName, st.yName); if (D) drawAll(); } });
    side.append(ctl.xName, ctl.yName);
    ctl.mode = Lab.seg([{ label: 'Table of pairs', value: 'table' }, { label: 'Two lists', value: 'lists' }], st.mode, v => { st.mode = v; save(); syncMode(); });
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Type the data as' }), ctl.mode));
    ctl.pairs = pairEditor(S, { rows: st.pts, heads: [st.xName, st.yName], onChange: rows => { st.pts = rows; onData(); }, onFocus: k => setHot(k) });
    ctl.lx = K.listField({ label: tx('x') + ' values, in order', value: '', rows: 3, onChange: () => onLists(), hint: nums => nums.length + ' values' });
    ctl.ly = K.listField({ label: tx('y') + ' values, in the same order', value: '', rows: 3, onChange: () => onLists(), hint: nums => nums.length + ' values' });
    ctl.lists = h('div', { class: 'pl-field' }, ctl.lx, ctl.ly, K.note('Paste two columns from a spreadsheet: value number ' + tx('i') + ' of the first list pairs with value number ' + tx('i') + ' of the second.'));
    ctl.dataMsg = h('div', { class: 'pl-hint' });
    side.append(ctl.pairs, ctl.lists, ctl.dataMsg);
    side.appendChild(K.presets({ label: 'Examples (lectures and made-up)', items: NUM_PRESETS, onPick: it => {
      st.xName = it.xName; st.yName = it.yName; ctl.xName.input.value = it.xName; ctl.yName.input.value = it.yName;
      st.pts = it.pts.map(p => p.slice()); dom = null; hot = -1;
      ctl.pairs.heads(st.xName, st.yName); ctl.pairs.set(st.pts); syncLists();
    } }));
    side.appendChild(K.group('2 · On the scatterplot'));
    ctl.rects = K.toggle({ label: 'Rectangles ' + tx('(x_i-\\bar x)(y_i-\\bar y)'), value: st.rects, onChange: v => { st.rects = v; save(); drawPlot(); } });
    ctl.line = K.toggle({ label: 'Fitted line ' + tx('\\hat y=mx+c'), value: st.line, onChange: v => { st.line = v; save(); drawPlot(); } });
    ctl.resid = K.toggle({ label: 'Residuals ' + tx('y_i-\\hat y_i') + ' (gaps to the line)', value: st.resid, onChange: v => { st.resid = v; save(); drawPlot(); } });
    side.append(ctl.rects, ctl.line, ctl.resid);
    ctl.tap = Lab.seg([{ label: 'Drag points', value: 'move' }, { label: 'Add a point', value: 'add' }, { label: 'Remove a point', value: 'remove' }], st.tap, v => { st.tap = v; save(); setTapClass(); });
    ctl.tap.classList.add('w4-seg3');
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'A click or tap on the plot will' }), ctl.tap));
    ctl.snapNote = K.note('');
    side.appendChild(ctl.snapNote);
    side.appendChild(K.group('3 · Go to'));
    const nav = h('div', { class: 'pl-chips w4-nav' });
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start this tab again</span>', () => { stAll.num = DEF_NUM(); save(); restart(); }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = K.answer();
    P.plot = K.panel('Scatterplot');
    P.table = K.panel('Deviations, products and squares, with column sums');
    P.cov = K.panel('Covariance: population and sample');
    P.sd = K.panel('Standard deviations ' + tx('s_x') + ' and ' + tx('s_y'));
    P.corr = K.panel('Pearson correlation ' + tx('r'));
    P.fit = K.panel('Fitted line and ' + tx('R^2'));
    P.desc = K.panel('Describe the association: direction, form, strength, outliers');
    main.append(P.answer, P.plot, P.table, P.cov, P.sd, P.corr, P.fit, P.desc);
    [['Scatterplot', P.plot], ['Table', P.table], ['Covariance', P.cov], ['SDs', P.sd], ['Correlation', P.corr], ['Line, R²', P.fit], ['Describe', P.desc]]
      .forEach(([t, p]) => nav.appendChild(Lab.button(t, () => p.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn xs')));
    P.legend = h('div', { class: 'w4-legend' });
    P.plotBox = h('div', { class: 'w4-chart w4-plot' });
    P.read = h('div', { class: 'w4-read' });
    P.plot.body.append(P.legend, P.plotBox, P.read);
    setTapClass();
    const onResize = Lab.debounce(() => {
      if (!root.isConnected) { window.removeEventListener('resize', onResize); return; }
      if (D) { drawPlot(); drawCorrScale(); }
    }, 200);
    window.addEventListener('resize', onResize);
    const fullSoon = Lab.debounce(() => { if (D) drawPanels(); }, 180);

    /* ---------------- input → data */
    function setTapClass() { ['move', 'add', 'remove'].forEach(m => P.plotBox.classList.toggle(m, st.tap === m)); }
    function syncMode() {
      ctl.pairs.hidden = st.mode !== 'table';
      ctl.lists.hidden = st.mode !== 'lists';
      if (st.mode === 'lists') syncLists();
    }
    function syncLists() {
      syncing = true;
      ctl.lx.set(st.pts.map(p => p[0]).join(', '));
      ctl.ly.set(st.pts.map(p => p[1]).join(', '));
      syncing = false;
    }
    function onLists() {
      if (syncing || st.mode !== 'lists') return;
      const tok = s => String(s).replace(/−/g, '-').split(/[\s,;]+/).map(t => t.trim()).filter(Boolean);
      const a = tok(ctl.lx.input.value), b = tok(ctl.ly.input.value);
      if (a.length !== b.length) { Lab.setHTML(ctl.dataMsg, '<span class="cbad">The ' + tx('x') + ' list has ' + a.length + ' values and the ' + tx('y') + ' list has ' + b.length + '. Each ' + tx('x') + ' needs its own ' + tx('y') + '.</span>'); return; }
      st.pts = a.map((x, k) => [x, b[k]]);
      ctl.pairs.set(st.pts);
    }
    function parse() {
      const out = [], bad = new Set();
      st.pts.forEach((r, k) => {
        const x = S.readNum(r[0]), y = S.readNum(r[1]);
        if (!x) bad.add(k + ',0');
        if (!y) bad.add(k + ',1');
        if (x && y) out.push({ x, y });
      });
      return { out, bad };
    }
    function onData() {
      const { out, bad } = parse();
      ctl.pairs.mark(bad);
      if (bad.size) { Lab.setHTML(ctl.dataMsg, '<span class="cbad">Fix the red boxes: every ' + tx('x') + ' and every ' + tx('y') + ' must be a number (decimals like 2.5, negatives like −3 and fractions like 7/2 are fine).</span>'); staleNote(true); return; }
      if (out.length > MAXN) { Lab.setHTML(ctl.dataMsg, '<span class="cbad">This lab works with up to ' + MAXN + ' pairs.</span>'); staleNote(true); return; }
      if (!out.length) { Lab.setHTML(ctl.dataMsg, '<span class="cbad">Type at least one pair.</span>'); staleNote(true); return; }
      Lab.setHTML(ctl.dataMsg, tx('n=' + out.length) + ' pair' + (out.length === 1 ? '' : 's') + '. Decimals, negatives (−3) and fractions (7/2) are fine.');
      save();
      D = compute(out);
      dom = makeDom(D);
      if (hot >= D.n) hot = -1;
      staleNote(false);
      drawAll();
    }
    function staleNote(on) {
      const old = P.answer.querySelector('.w4-stale');
      if (old) old.remove();
      if (on && D) P.answer.prepend(h('div', { class: 'w4-stale', html: '<span class="cbad">Your data has a problem (see the message under it).</span> Everything below still shows your last valid data.' }));
    }

    /* ---------------- exact statistics */
    function compute(ps) {
      const n = ps.length, N = S.int(n);
      const xs = ps.map(p => p.x), ys = ps.map(p => p.y);
      const sx = S.sumR(xs), sy = S.sumR(ys), mx = sx.div(N), my = sy.div(N);
      const dx = xs.map(x => x.sub(mx)), dy = ys.map(y => y.sub(my));
      const pr = dx.map((d, i) => d.mul(dy[i])), dx2 = dx.map(d => d.mul(d)), dy2 = dy.map(d => d.mul(d)), xy = xs.map((x, i) => x.mul(ys[i]));
      const Sxy = S.sumR(pr), Sxx = S.sumR(dx2), Syy = S.sumR(dy2), Sxyr = S.sumR(xy);
      const d = { n, N, xs, ys, sx, sy, mx, my, dx, dy, pr, dx2, dy2, xy, Sxy, Sxx, Syy, Sxyr };
      d.covP = Sxy.div(N);
      d.covS = n > 1 ? Sxy.div(S.int(n - 1)) : null;
      d.vxS = n > 1 ? Sxx.div(S.int(n - 1)) : null; d.vyS = n > 1 ? Syy.div(S.int(n - 1)) : null;
      d.vxP = Sxx.div(N); d.vyP = Syy.div(N);
      d.sign = Sxy.sign();
      d.r2 = !Sxx.isZero() && !Syy.isZero() ? Sxy.mul(Sxy).div(Sxx.mul(Syy)) : null;
      d.m = !Sxx.isZero() ? Sxy.div(Sxx) : null;
      d.c = d.m ? my.sub(d.m.mul(mx)) : null;
      d.res = d.m ? ys.map((y, i) => y.sub(d.c.add(d.m.mul(xs[i])))) : null;
      d.SSE = d.m ? Syy.sub(Sxy.mul(Sxy).div(Sxx)) : null;
      return d;
    }
    function det3(M) {
      const t1 = M[1][1].mul(M[2][2]).sub(M[1][2].mul(M[2][1]));
      const t2 = M[1][0].mul(M[2][2]).sub(M[1][2].mul(M[2][0]));
      const t3 = M[1][0].mul(M[2][1]).sub(M[1][1].mul(M[2][0]));
      return M[0][0].mul(t1).sub(M[0][1].mul(t2)).add(M[0][2].mul(t3));
    }
    /** R² of the least-squares parabola y = b0 + b1·t + b2·t² (t = x − x̄), exact; null when it is not determined. */
    function quadR2(xs, ys) {
      const n = xs.length;
      if (n < 3) return null;
      const N = S.int(n), mx = S.sumR(xs).div(N);
      const t = xs.map(x => x.sub(mx)), t2 = t.map(v => v.mul(v));
      const T2 = S.sumR(t2), T3 = S.sumR(t2.map((v, i) => v.mul(t[i]))), T4 = S.sumR(t2.map(v => v.mul(v)));
      const Y0 = S.sumR(ys), Y1 = S.sumR(t.map((v, i) => v.mul(ys[i]))), Y2 = S.sumR(t2.map((v, i) => v.mul(ys[i])));
      const M = [[N, S.R0, T2], [S.R0, T2, T3], [T2, T3, T4]], b = [Y0, Y1, Y2];
      const det = det3(M);
      if (det.isZero()) return null;
      const beta = [0, 1, 2].map(k => det3(M.map((row, r) => row.map((v, c) => (c === k ? b[r] : v)))).div(det));
      const my = Y0.div(N);
      const sst = S.sumR(ys.map(y => y.sub(my).mul(y.sub(my))));
      if (sst.isZero()) return null;
      const sse = S.sumR(ys.map((y, i) => { const e = y.sub(beta[0].add(beta[1].mul(t[i])).add(beta[2].mul(t2[i]))); return e.mul(e); }));
      return N1.sub(sse.div(sst));
    }
    /** Week 3 fences (lecture np method, 1.5·IQR) for a list of exact values. */
    const fencesOf = vals => S.boxStats(S.sorted(vals), 'lec');
    function analyse(d) {
      const a = { n: d.n };
      a.band = d.r2 ? bandOf(S, d.r2) : null;
      a.res = []; a.xo = []; a.yo = [];
      if (d.n >= 5 && d.m) {
        a.fr = fencesOf(d.res);
        d.res.forEach((e, i) => { if (e.cmp(a.fr.lo) < 0 || e.cmp(a.fr.hi) > 0) a.res.push(i); });
      }
      if (d.n >= 5) {
        a.fx = fencesOf(d.xs); a.fy = fencesOf(d.ys);
        d.xs.forEach((v, i) => { if (v.cmp(a.fx.lo) < 0 || v.cmp(a.fx.hi) > 0) a.xo.push(i); });
        d.ys.forEach((v, i) => { if (v.cmp(a.fy.lo) < 0 || v.cmp(a.fy.hi) > 0) a.yo.push(i); });
      }
      a.without = [...new Set(a.res.concat(a.xo, a.yo))].sort((p, q) => p - q).map(i => {
        const keep = d.xs.map((_, k) => k).filter(k => k !== i);
        const w = compute(keep.map(k => ({ x: d.xs[k], y: d.ys[k] })));
        return { i, d: w };
      });
      // form: the line and the best parabola, on the points not flagged by the residual rule
      const keep = d.xs.map((_, k) => k).filter(k => !a.res.includes(k));
      a.formN = keep.length;
      a.formExcl = a.res.slice();
      const kx = keep.map(k => d.xs[k]), ky = keep.map(k => d.ys[k]);
      const distinct = new Set(kx.map(q => q.toString())).size;
      if (keep.length >= 5 && distinct >= 3) {
        const kd = compute(keep.map(k => ({ x: d.xs[k], y: d.ys[k] })));
        const lin = kd.r2 || S.R0, q = quadR2(kx, ky);
        if (q) {
          a.lin = lin; a.quad = q; a.gain = q.sub(lin);
          a.left = N1.sub(lin);
          a.rel = a.left.isZero() ? S.R0 : a.gain.div(a.left);
          a.curved = q.cmp(S.frac(4, 5)) >= 0 && a.gain.cmp(S.frac(1, 10)) >= 0 && a.rel.cmp(S.frac(7, 10)) >= 0;
          a.bends = !a.curved && a.rel.cmp(S.frac(7, 10)) >= 0 && a.gain.cmp(S.frac(1, 50)) >= 0 && q.cmp(S.frac(4, 5)) >= 0;
        }
      }
      return a;
    }

    /* ---------------- drawing */
    function drawAll() { drawPanels(); }
    function drawPanels() {
      AN = analyse(D);
      flags = { res: AN.res, x: AN.xo, y: AN.yo };
      drawPlot(); drawAnswer(); drawTable(); drawCov(); drawSD(); drawCorr(); drawFit(); drawDesc();
      if (hot >= 0) setHot(hot);
      expose();
    }
    function expose() {
      const s = q => (q == null ? null : q.toString());
      root.dataset.w4num = JSON.stringify({
        n: D.n, mx: s(D.mx), my: s(D.my), Sxy: s(D.Sxy), Sxx: s(D.Sxx), Syy: s(D.Syy), Sxyr: s(D.Sxyr), covP: s(D.covP), covS: s(D.covS),
        vxS: s(D.vxS), vyS: s(D.vyS), r2: s(D.r2), r: D.r2 ? rTxt(D.sign, D.r2) : null, m: s(D.m), c: s(D.c), SSE: s(D.SSE),
        band: AN && AN.band ? AN.band.word : null, outs: AN ? AN.res.map(i => i + 1) : [], xo: AN ? AN.xo.map(i => i + 1) : [], yo: AN ? AN.yo.map(i => i + 1) : [],
        quad: AN && AN.quad ? s(AN.quad) : null, curved: AN ? !!AN.curved : null, pts: st.pts,
      });
    }

    function drawAnswer() {
      const d = D;
      const ev = 'Your data: ' + tx('n=' + d.n) + ' pair' + (d.n === 1 ? '' : 's') + ' (' + tx('x') + ' = ' + xN() + ', ' + tx('y') + ' = ' + yN() + ').';
      const pieces = [];
      if (d.r2) pieces.push('r' + rTex(d.sign, d.r2));
      pieces.push('\\text{Cov}_{\\text{pop}}' + eq(d.covP));
      if (d.covS) pieces.push('\\text{Cov}_{\\text{sample}}' + eq(d.covS));
      let sub = '';
      if (d.n < 2) sub = 'One pair is not enough: covariance and correlation compare how two values move together, so type at least two pairs.';
      else if (!d.r2) sub = d.Sxx.isZero() ? 'Every ' + tx('x') + ' is the same, so ' + tx('\\sum(x_i-\\bar x)^2=0') + ': ' + tx('r') + ' and the fitted line divide by 0 and are not defined.' : 'Every ' + tx('y') + ' is the same, so ' + tx('\\sum(y_i-\\bar y)^2=0') + ': ' + tx('r') + ' divides by 0 and is not defined (the fitted line is flat, ' + tx('\\hat y=' + V(d.my)) + ').';
      else {
        const b = bandOf(S, d.r2);
        sub = 'Reading ' + tx('r') + ' on the L4.7 scale: ' + tx(b.range) + ' → <b>' + (b.k ? b.word + ' ' + (d.sign > 0 ? 'positive' : 'negative') + ' linear association' : 'no linear association') + '</b>. Fitted line ' + nw(tx(lineTex(d)) + ',') + ' ' + nw(tx('R^2=r^2' + eq(d.r2)) + '.');
      }
      K.setAnswer(P.answer, { ev, sub });
      P.answer.insertBefore(S.bigLine(pieces), P.answer.lastChild);
      if (P.answer.querySelector('.w4-stale') == null && parse().bad.size) staleNote(true);
    }
    function lineTex(d) {
      if (!d.m) return '';
      const m = d.m, c = d.c;
      const mt = m.isZero() ? '' : (m.eq(N1) ? '' : m.eq(N1.neg()) ? '-' : V(m)) + 'x';
      const ct = c.isZero() ? (mt ? '' : '0') : (mt && c.sign() > 0 ? '+' : '') + V(c);
      return '\\hat y=' + mt + ct;
    }
    function lineTxt(d) {
      if (!d.m) return '';
      const m = d.m, c = d.c;
      const ms = m.isZero() ? '' : (m.eq(N1) ? '' : m.eq(N1.neg()) ? '−' : S.ht(m).replace(/^≈ /, '')) + 'x';
      const cs = c.isZero() ? (ms ? '' : '0') : (ms ? (c.sign() > 0 ? ' + ' : ' − ') + S.ht(c.abs()).replace(/^≈ /, '') : S.ht(c).replace(/^≈ /, ''));
      return 'ŷ = ' + ms + cs;
    }

    /* ---------------- the scatterplot */
    function makeDom(d) {
      const [x0, x1] = S.domain(d.xs.map(q => q.num()), 0.08);
      const [y0, y1] = S.domain(d.ys.map(q => q.num()), 0.1);
      return { x0, x1, y0, y1 };
    }
    function snapStep(col, lo, hi) {
      let dp = 0;
      st.pts.forEach(p => { const m = String(p[col]).match(/\.(\d+)/); if (m) dp = Math.max(dp, m[1].length); });
      let step = Math.pow(10, -Math.min(dp, 4));
      while ((hi - lo) / step < 15 && step > 1e-4) step /= 10;
      return step;
    }
    const snapStr = (v, step) => { const dp = Math.max(0, Math.round(-Math.log10(step))); return String(+(Math.round(v / step) * step).toFixed(dp)); };
    function drawPlot() {
      if (!D || !dom) return;
      const d = D, box = P.plotBox;
      const W = S.chartWidth(box), H = Math.round(Math.max(280, Math.min(440, W * 0.62)));
      const pl = 56, pr = 16, pt = 30, pb = 46;
      dims = { W, H, pl, pr, pt, pb };
      const X = v => pl + ((v - dom.x0) / (dom.x1 - dom.x0)) * (W - pl - pr);
      const Y = v => pt + (1 - (v - dom.y0) / (dom.y1 - dom.y0)) * (H - pt - pb);
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w4-svg', role: 'img', 'aria-label': 'scatterplot of ' + d.n + ' points with mean lines' });
      const cid = Lab.uid('w4clip');
      s.appendChild(svg('defs', {}, svg('clipPath', { id: cid }, svg('rect', { x: pl, y: pt, width: W - pl - pr, height: H - pt - pb }))));
      s.appendChild(svg('rect', { x: pl, y: pt, width: W - pl - pr, height: H - pt - pb, class: 'w4-bg', 'data-bg': '1' }));
      const xt = S.niceTicks(dom.x0, dom.x1, Math.max(3, Math.floor((W - pl - pr) / 85)));
      const yt = S.niceTicks(dom.y0, dom.y1, Math.max(3, Math.floor((H - pt - pb) / 55)));
      xt.ticks.filter(t => t >= dom.x0 && t <= dom.x1).forEach(t => {
        s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: pt, y2: H - pb, class: 'w4-grid' }));
        s.appendChild(svg('text', { x: X(t), y: H - pb + 17, 'text-anchor': 'middle', class: 'w4-tick' }, S.tickFmt(t, xt.step)));
      });
      yt.ticks.filter(t => t >= dom.y0 && t <= dom.y1).forEach(t => {
        s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 'w4-grid' }));
        s.appendChild(svg('text', { x: pl - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'w4-tick' }, S.tickFmt(t, yt.step)));
      });
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: H - pb, y2: H - pb, class: 'w4-axis' }));
      s.appendChild(svg('line', { x1: pl, x2: pl, y1: pt, y2: H - pb, class: 'w4-axis' }));
      s.appendChild(svg('text', { x: W - pr, y: H - 8, 'text-anchor': 'end', class: 'w4-name' }, 'x: ' + blank(st.xName) + ' →'));
      s.appendChild(svg('text', { x: 6, y: 16, class: 'w4-name' }, '↑ y: ' + blank(st.yName)));
      const g = svg('g', { 'clip-path': 'url(#' + cid + ')' });
      s.appendChild(g);
      const mxv = d.mx.num(), myv = d.my.num();
      if (st.rects && d.n > 1) d.pr.forEach((q, i) => {
        if (q.isZero()) return;
        const x1 = X(d.xs[i].num()), x2 = X(mxv), y1 = Y(d.ys[i].num()), y2 = Y(myv);
        g.appendChild(svg('rect', { x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2), class: 'w4-rect ' + (q.sign() > 0 ? 'pos' : 'neg') + (i === hot ? ' hot' : ''), 'data-k': i }));
      });
      g.appendChild(svg('line', { x1: X(mxv), x2: X(mxv), y1: pt, y2: H - pb, class: 'w4-meanl' }));
      g.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(myv), y2: Y(myv), class: 'w4-meanl' }));
      if (st.line && d.m) {
        const f = x => d.c.num() + d.m.num() * x;
        if (st.resid) d.res.forEach((e, i) => { if (!e.isZero()) g.appendChild(svg('line', { x1: X(d.xs[i].num()), x2: X(d.xs[i].num()), y1: Y(d.ys[i].num()), y2: Y(f(d.xs[i].num())), class: 'w4-resl' })); });
        g.appendChild(svg('line', { x1: X(dom.x0), x2: X(dom.x1), y1: Y(f(dom.x0)), y2: Y(f(dom.x1)), class: 'w4-fitl' }));
      }
      if (st.rects && d.n > 1) {
        // one sign per quadrant, in the quadrant's outer corner: + where both deviations have the same sign
        const qx = X(mxv), qy = Y(myv);
        const px = d.xs.map((q, i) => [X(q.num()), Y(d.ys[i].num())]);
        const free = (x, y) => px.every(([a, b]) => Math.hypot(a - x, b - (y - 5)) > 20 && Math.hypot(a + 9 - x, b - 9 - (y - 5)) > 14);
        [[1, 1, '+', 'pos'], [-1, -1, '+', 'pos'], [-1, 1, '−', 'neg'], [1, -1, '−', 'neg']].forEach(([sx, sy, sign, cls]) => {
          // try the quadrant's outer corner first, then spots further along its two outer edges
          const cand = [];
          for (let k = 0; k < 4; k++) {
            cand.push([sx > 0 ? W - pr - 12 - 26 * k : pl + 12 + 26 * k, sy > 0 ? pt + 16 : H - pb - 8]);
            cand.push([sx > 0 ? W - pr - 12 : pl + 12, sy > 0 ? pt + 16 + 24 * k : H - pb - 8 - 24 * k]);
          }
          const ok = cand.find(([x0, y0]) => (sx > 0 ? x0 > qx + 10 : x0 < qx - 10) && (sy > 0 ? y0 < qy - 8 : y0 - 12 > qy + 4) && free(x0, y0));
          if (ok) s.appendChild(svg('text', { x: ok[0], y: ok[1], 'text-anchor': 'middle', class: 'w4-sign ' + cls }, sign));
        });
      }
      // labels of the mean lines and the line
      const xbarLab = 'x̄ = ' + S.ht(d.mx), ybarLab = 'ȳ = ' + S.ht(d.my);
      const lx = Math.min(W - pr - S.textW(xbarLab) / 2 - 2, Math.max(pl + S.textW(xbarLab) / 2 + 2, X(mxv)));
      s.appendChild(svg('text', { x: lx, y: pt - 6, 'text-anchor': 'middle', class: 'w4-lab' }, xbarLab));
      s.appendChild(svg('text', { x: W - pr - 4, y: Y(myv) - 6, 'text-anchor': 'end', class: 'w4-lab' }, ybarLab));
      // points
      const showIdx = d.n <= 15;
      const outSet = new Set(flags.res);
      d.xs.forEach((xq, i) => {
        const cx = X(xq.num()), cy = Y(d.ys[i].num());
        s.appendChild(svg('circle', { cx, cy, r: 5.5, class: 'w4-pt' + (outSet.has(i) ? ' out' : '') + (i === hot ? ' hot' : ''), 'data-k': i }));
        if (showIdx) s.appendChild(svg('text', { x: cx + 7, y: cy - 7, class: 'w4-idx' }, String(i + 1)));
        const hit = svg('circle', { cx, cy, r: W < 560 ? 16 : 12, class: 'w4-hit', tabindex: 0, 'data-k': i, role: 'button', 'aria-label': 'point ' + (i + 1) + ': x ' + S.ht(xq) + ', y ' + S.ht(d.ys[i]) });
        hit.addEventListener('pointerenter', () => { if (!drag) setHot(i); });
        hit.addEventListener('focus', () => setHot(i));
        hit.addEventListener('pointerdown', e => onPointDown(e, i));
        hit.addEventListener('keydown', e => onKey(e, i));
        s.appendChild(hit);
      });
      Lab.clear(box);
      box.appendChild(s);
      P.svg = s;
      drawLegend();
      if (hot >= 0 && !drag) readPoint(hot);
      else if (!drag && hot < 0) Lab.setHTML(P.read, '<span class="muted">Point at a point (or tab to it) to read its numbers. ' + (st.tap === 'move' ? 'Drag a point to move it; arrow keys move a focused point.' : st.tap === 'add' ? 'Click an empty spot to add a point there.' : 'Click a point to remove it.') + '</span>');
      const sx = snapStep(0, dom.x0, dom.x1), sy = snapStep(1, dom.y0, dom.y1);
      Lab.setHTML(ctl.snapNote, 'Dragged and added points snap to steps of ' + S.ht(S.from(sx)) + ' across and ' + S.ht(S.from(sy)) + ' up, so every value stays a short decimal.');
    }
    function drawLegend() {
      Lab.clear(P.legend);
      const items = [{ k: 'dot', t: 'one pair ' + tx('(x_i,y_i)') }, { k: 'mean', t: 'mean lines ' + tx('x=\\bar x') + ', ' + tx('y=\\bar y') }];
      if (st.rects) items.push({ k: 'pos', t: tx('(x_i-\\bar x)(y_i-\\bar y)>0') }, { k: 'neg', t: tx('(x_i-\\bar x)(y_i-\\bar y)<0') });
      if (st.line && D.m) items.push({ k: 'fit', t: 'fitted line ' + nw(tx(lineTex(D))) });
      if (st.line && st.resid && D.m) items.push({ k: 'res', t: 'residual' });
      if (flags.res.length) items.push({ k: 'out', t: 'possible outlier (see the last panel)' });
      items.forEach(it => P.legend.appendChild(h('span', {}, h('i', { class: 'w4-key ' + it.k }), h('span', { html: it.t }))));
    }
    function setHot(k) {
      if (!D || k < 0 || k >= D.n) return;
      hot = k;
      if (P.svg) {
        Lab.$$('.w4-pt', P.svg).forEach(el => el.classList.toggle('hot', +el.getAttribute('data-k') === k));
        Lab.$$('.w4-rect', P.svg).forEach(el => el.classList.toggle('hot', +el.getAttribute('data-k') === k));
      }
      Lab.$$('tr[data-k]', P.table.body).forEach(el => el.classList.toggle('hot', +el.getAttribute('data-k') === k));
      ctl.pairs.hot(k);
      readPoint(k);
    }
    function readPoint(k) {
      const d = D, x = d.xs[k], y = d.ys[k];
      let html = '<b>Point ' + (k + 1) + '</b>: ' + tx('(x_{' + (k + 1) + '},y_{' + (k + 1) + '})=(' + V(x) + ',' + V(y) + ')') + '. ';
      if (d.n > 1) {
        const p = d.pr[k];
        html += tx('x_{' + (k + 1) + '}-\\bar x=' + V(x) + '-' + P_(NT(d.mx)) + eq(d.dx[k])) + ', ' + tx('y_{' + (k + 1) + '}-\\bar y=' + V(y) + '-' + P_(NT(d.my)) + eq(d.dy[k])) + ', product ' + tx(P_(NT(d.dx[k])) + '\\times ' + P_(NT(d.dy[k])) + eq(p)) +
          (p.isZero() ? ' — on a mean line, so it adds nothing to the sum.' : p.sign() > 0 ? ' — positive (green rectangle): it pushes the covariance up.' : ' — negative (red rectangle): it pulls the covariance down.');
      }
      if (d.m) html += '<div class="muted">On the fitted line: ' + tx('\\hat y_{' + (k + 1) + '}=' + P_(NT(d.m)) + '\\times ' + P_(V(x)) + (d.c.sign() < 0 ? '-' + NT(d.c.abs()) : '+' + NT(d.c)) + eq(d.c.add(d.m.mul(x)))) + ', residual ' + tx('y_{' + (k + 1) + '}-\\hat y_{' + (k + 1) + '}' + eq(d.res[k])) + (flags.res.includes(k) ? ' — <span class="cbad">outside the residual fences: a possible outlier</span>' : '') + '.</div>';
      Lab.setHTML(P.read, html);
    }

    /* ---------------- pointer and keyboard */
    function toData(e) {
      const { W, H, pl, pr, pt, pb } = dims;
      const { px, py } = pointerFrac(e, P.svg, W, H);
      const x = dom.x0 + ((px - pl) / (W - pl - pr)) * (dom.x1 - dom.x0);
      const y = dom.y0 + (1 - (py - pt) / (H - pt - pb)) * (dom.y1 - dom.y0);
      return { x: Math.max(dom.x0, Math.min(dom.x1, x)), y: Math.max(dom.y0, Math.min(dom.y1, y)), inside: px >= pl && px <= W - pr && py >= pt && py <= H - pb };
    }
    function onPointDown(e, i) {
      if (st.tap === 'remove') {
        e.preventDefault();
        if (st.pts.length <= 2) { Lab.setHTML(P.read, '<span class="cbad">Keep at least 2 points.</span>'); return; }
        st.pts.splice(i, 1);
        hot = -1;
        ctl.pairs.set(st.pts); syncLists();
        return;
      }
      if (st.tap !== 'move') return;
      e.preventDefault();
      drag = { k: i, sx: snapStep(0, dom.x0, dom.x1), sy: snapStep(1, dom.y0, dom.y1), id: e.pointerId };
      try { P.plotBox.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
      P.plotBox.classList.add('drag');
      setHot(i);
    }
    P.plotBox.addEventListener('pointermove', e => {
      if (!drag) return;
      const q = toData(e);
      const xs = snapStr(q.x, drag.sx), ys = snapStr(q.y, drag.sy);
      const cur = st.pts[drag.k];
      if (cur[0] === xs && cur[1] === ys) return;
      st.pts[drag.k] = [xs, ys];
      ctl.pairs.setRow(drag.k, xs, ys);
      const { out } = parse();
      D = compute(out);
      drawPlot(); drawAnswer();
      readPoint(drag.k);
      fullSoon();
    });
    const endDrag = () => {
      if (!drag) return;
      drag = null;
      P.plotBox.classList.remove('drag');
      save(); syncLists();
      dom = makeDom(D);
      drawPanels();
    };
    P.plotBox.addEventListener('pointerup', endDrag);
    P.plotBox.addEventListener('pointercancel', endDrag);
    P.plotBox.addEventListener('lostpointercapture', endDrag);
    P.plotBox.addEventListener('click', e => {
      if (st.tap !== 'add' || !D || !dims || !P.svg) return;
      if (e.target.closest && e.target.closest('.w4-hit')) return;
      const q = toData(e);
      if (!q.inside) return;
      if (st.pts.length >= MAXN) return;
      const sx = snapStep(0, dom.x0, dom.x1), sy = snapStep(1, dom.y0, dom.y1);
      st.pts.push([snapStr(q.x, sx), snapStr(q.y, sy)]);
      hot = st.pts.length - 1;
      ctl.pairs.set(st.pts); syncLists();
    });
    function onKey(e, i) {
      const sx = snapStep(0, dom.x0, dom.x1), sy = snapStep(1, dom.y0, dom.y1);
      const mv = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
      if (!mv) return;
      e.preventDefault();
      const x = S.readNum(st.pts[i][0]), y = S.readNum(st.pts[i][1]);
      if (!x || !y) return;
      st.pts[i] = [snapStr(x.num() + mv[0] * sx, sx), snapStr(y.num() + mv[1] * sy, sy)];
      hot = i;
      ctl.pairs.set(st.pts); syncLists();
      const again = P.svg && P.svg.querySelector('.w4-hit[data-k="' + i + '"]');
      if (again) again.focus();
    }

    /* ---------------- the table */
    function drawTable() {
      const d = D, body = P.table.body;
      Lab.clear(body);
      P.table.sub('One row per pair, in the order you typed them. The means are ' + tx('\\bar x' + eq(d.mx)) + ' and ' + tx('\\bar y' + eq(d.my)) + ' (worked out in the covariance panel). The last column is only for the shortcut formula.');
      const heads = ['i', 'x_i', 'y_i', 'x_i-\\bar x', 'y_i-\\bar y', '(x_i-\\bar x)(y_i-\\bar y)', '(x_i-\\bar x)^2', '(y_i-\\bar y)^2', 'x_iy_i'];
      const t = h('table', { class: 'tbl w4-num' });
      t.appendChild(h('thead', {}, h('tr', {}, heads.map(c => h('th', { html: tx(c) })))));
      const tb = h('tbody');
      const outSet = new Set(flags.res);
      d.xs.forEach((x, i) => {
        const pr = d.pr[i];
        const tr = h('tr', { class: (i === hot ? 'hot ' : '') + (outSet.has(i) ? 'out' : '') || null, 'data-k': i },
          h('td', { text: String(i + 1) }), h('td', { text: S.ht(x) }), h('td', { text: S.ht(d.ys[i]) }), h('td', { text: S.ht(d.dx[i]) }), h('td', { text: S.ht(d.dy[i]) }),
          h('td', { class: pr.sign() > 0 ? 'pos' : pr.sign() < 0 ? 'neg' : null, text: S.ht(pr) }), h('td', { text: S.ht(d.dx2[i]) }), h('td', { text: S.ht(d.dy2[i]) }), h('td', { text: S.ht(d.xy[i]) }));
        tr.addEventListener('pointerenter', () => setHot(i));
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      t.appendChild(h('tfoot', {}, h('tr', {}, [tx('\\sum'), S.ht(d.sx), S.ht(d.sy), '0', '0', S.ht(d.Sxy), S.ht(d.Sxx), S.ht(d.Syy), S.ht(d.Sxyr)].map(c => h('td', { html: c })))));
      body.appendChild(h('div', { class: 'tbl-wrap w4-tw' + (d.n > 14 ? ' w4-scrolly' : '') }, t));
      const rounded = [d.mx, d.my].some(q => !S.exact(q)) || d.xs.concat(d.ys).some(q => !S.exact(q));
      body.appendChild(K.note('Columns 4 and 5 always add up to exactly 0: the values above a mean balance those below it. Green cells push the covariance up, red cells pull it down.' + (rounded ? ' Entries marked ≈ are rounded to 4 decimal places; every column sum is computed exactly from your values, not from the rounded entries.' : '') + ' Point at a row to find its point on the plot.', 'small muted'));
    }

    /* ---------------- covariance */
    const listSum = (qs, max) => (qs.length <= (max || 10) && qs.every(q => S.exact(q)));
    function meanStep(d, sym, vals, sum, mean) {
      const head = sym + '=\\frac{\\sum ' + (sym === '\\bar x' ? 'x_i' : 'y_i') + '}{n}=';
      if (vals.length <= 12) return head + '\\frac{' + S.sumTex(vals) + '}{' + d.n + '}=' + S.overTex(sum, d.n, mean);
      return head + S.overTex(sum, d.n, mean);
    }
    function drawCov() {
      const d = D, body = P.cov.body, n = d.n;
      Lab.clear(body);
      P.cov.sub('L4.6: multiply each point’s two deviations and add them up; divide by ' + tx('n') + ' for the population covariance, by ' + tx('n-1') + ' for the sample covariance (course notes, Week 4).');
      const steps = [];
      steps.push({ html: '<b>Means.</b> Add each column and divide by ' + tx('n=' + n) + ':', block: S.mathLines(meanStep(d, '\\bar x', d.xs, d.sx, d.mx), meanStep(d, '\\bar y', d.ys, d.sy, d.my)) });
      if (n < 2) { steps.push({ html: 'With one pair every deviation is 0 and there is nothing to compare. Type at least two pairs.' }); body.appendChild(S.steps(steps)); return; }
      const k = d.pr.findIndex(q => !q.isZero());
      const e = k >= 0 ? k : 0;
      steps.push({ html: '<b>Deviations and their product</b> for every point (table columns 4–6). For example, point ' + (e + 1) + ':',
        math: '(x_{' + (e + 1) + '}-\\bar x)(y_{' + (e + 1) + '}-\\bar y)=(' + V(d.xs[e]) + '-' + P_(NT(d.mx)) + ')(' + V(d.ys[e]) + '-' + P_(NT(d.my)) + ')=' + P_(NT(d.dx[e])) + '\\times ' + P_(NT(d.dy[e])) + eq(d.pr[e]) });
      steps.push({ html: '<b>Add the products</b>' + (listSum(d.pr) ? ':' : ' (the total of column 6 in the table, computed exactly):'),
        math: '\\sum(x_i-\\bar x)(y_i-\\bar y)' + (listSum(d.pr) ? '=' + S.sumTex(d.pr, q => P_(V(q))) : '') + eq(d.Sxy) });
      steps.push({ html: '<b>Population covariance</b>: divide by ' + tx('n=' + n) + '.', math: '\\text{Cov}_{\\text{pop}}(x,y)=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{n}=' + S.overTex(d.Sxy, n, d.covP) });
      steps.push({ html: '<b>Sample covariance</b>: divide by ' + tx('n-1=' + n + '-1=' + (n - 1)) + '.', math: '\\text{Cov}_{\\text{sample}}(x,y)=s_{xy}=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{n-1}=' + S.overTex(d.Sxy, n - 1, d.covS) });
      const nxy = d.sx.mul(d.sy).div(d.N);
      const nxyTex = S.exact(d.mx) && S.exact(d.my)
        ? 'n\\bar x\\bar y=' + n + '\\times ' + P_(V(d.mx)) + '\\times ' + P_(V(d.my)) + eq(nxy)
        : 'n\\bar x\\bar y=\\frac{(\\sum x_i)(\\sum y_i)}{n}=\\frac{' + P_(V(d.sx)) + '\\times ' + P_(V(d.sy)) + '}{' + n + '}' + eq(nxy);
      const xyWritten = d.n <= 8 && d.xy.every(q => S.exact(q)) ? d.xs.map((x, i) => P_(V(x)) + '\\cdot ' + P_(V(d.ys[i]))).join('+') + '=' : '';
      steps.push({
        html: '<b>Shortcut (computational form)</b> — no need to form each deviation. Multiply each pair and add (last table column):',
        block: h('div', {}, S.mathLines('\\sum x_iy_i=' + xyWritten + NT(d.Sxyr), nxyTex, '\\sum x_iy_i-n\\bar x\\bar y=' + NT(d.Sxyr) + '-' + P_(NT(nxy)) + eq(d.Sxy), 's_{xy}=\\frac{\\sum x_iy_i-n\\bar x\\bar y}{n-1}=' + S.overTex(d.Sxy, n - 1, d.covS)),
          K.note('The same ' + tx('\\sum(x_i-\\bar x)(y_i-\\bar y)' + eq(d.Sxy)) + ' as step 3, so the same covariance ✓ (the computational form in the course notes).', 'small muted')),
      });
      const posI = d.pr.map((q, i) => i).filter(i => d.pr[i].sign() > 0), negI = d.pr.map((q, i) => i).filter(i => d.pr[i].sign() < 0);
      const posS = S.sumR(posI.map(i => d.pr[i])), negS = S.sumR(negI.map(i => d.pr[i]));
      const zero = n - posI.length - negI.length;
      const cnt = (k, w) => k + ' point' + (k === 1 ? ' has' : 's have') + ' ' + w;
      steps.push({
        html: '<b>Reading the sign.</b> ' + cnt(posI.length, 'a positive product') + ' (green rectangles' + (posI.length ? ', adding up to ' + nw(tx(NT(posS))) : '') + '); ' + cnt(negI.length, 'a negative product') + ' (red' + (negI.length ? ', adding up to ' + nw(tx(NT(negS))) : '') + ')' + (zero ? '; ' + zero + ' sit' + (zero === 1 ? 's' : '') + ' on a mean line (product 0)' : '') + '.' + (posI.length && negI.length ? ' Green and red together:' : ''),
        math: posI.length && negI.length ? NT(posS) + '+' + P_(NT(negS)) + eq(d.Sxy) : null,
        note: d.sign > 0 ? 'Positive: large ' + tx('x') + ' tend to go with large ' + tx('y') + ', small with small (L4.6).' : d.sign < 0 ? 'Negative: large ' + tx('x') + ' tend to go with small ' + tx('y') + ' (L4.6).' : 'Exactly 0: the green and red rectangles cancel — no linear association.',
      });
      steps.push({ html: '<b>Units.</b> Covariance is in (units of ' + tx('x') + ') × (units of ' + tx('y') + '), so its size is hard to read (L4.6). Dividing by ' + tx('s_x s_y') + ' removes the units: that is ' + tx('r') + ' (next panels).' });
      body.appendChild(S.steps(steps));
    }

    /* ---------------- standard deviations */
    function drawSD() {
      const d = D, body = P.sd.body, n = d.n;
      Lab.clear(body);
      P.sd.sub('Week 3 again: square the deviations (table columns 7 and 8), add, divide by ' + tx('n-1') + ' (sample) or ' + tx('n') + ' (population), then take the square root.');
      if (n < 2) { body.appendChild(K.note('Needs at least two pairs.')); return; }
      const one = (sym, ssTex, ss, vS, vP) => S.mathLines(
        sym + '^2=\\frac{' + ssTex + '}{n-1}=' + S.overTex(ss, n - 1, vS), sym + '=\\sqrt{' + NT(vS) + '}' + S.sqrtEq(vS));
      const steps = [
        { html: tx('s_x') + ': the squares of column 4 add up to ' + tx('\\sum(x_i-\\bar x)^2' + eq(d.Sxx)) + '.', block: one('s_x', '\\sum(x_i-\\bar x)^2', d.Sxx, d.vxS) },
        { html: tx('s_y') + ': the squares of column 5 add up to ' + tx('\\sum(y_i-\\bar y)^2' + eq(d.Syy)) + '.', block: one('s_y', '\\sum(y_i-\\bar y)^2', d.Syy, d.vyS) },
        { html: 'The population versions divide by ' + tx('n=' + n) + ' instead:', block: S.mathLines('\\sigma_x^2=' + S.overTex(d.Sxx, n, d.vxP) + ',\\quad \\sigma_x=\\sqrt{' + NT(d.vxP) + '}' + S.sqrtEq(d.vxP), '\\sigma_y^2=' + S.overTex(d.Syy, n, d.vyP) + ',\\quad \\sigma_y=\\sqrt{' + NT(d.vyP) + '}' + S.sqrtEq(d.vyP)),
          note: 'Same squared deviations, different divisor: ' + tx('n\\sigma^2=(n-1)s^2') + ' (both equal the sum of squares).' },
      ];
      body.appendChild(S.steps(steps));
    }

    /* ---------------- correlation */
    function drawCorr() {
      const d = D, body = P.corr.body, n = d.n;
      Lab.clear(body);
      P.corr.sub('L4.7: Pearson’s ' + tx('r') + ' is the covariance divided by the product of the standard deviations — unitless, and always between −1 and 1.');
      if (!d.r2) { body.appendChild(K.note(n < 2 ? 'Needs at least two pairs.' : (d.Sxx.isZero() ? 'Every ' + tx('x') + ' is equal, so ' + tx('\\sum(x_i-\\bar x)^2=0') : 'Every ' + tx('y') + ' is equal, so ' + tx('\\sum(y_i-\\bar y)^2=0')) + ': the formula divides by 0, so ' + tx('r') + ' is not defined.')); P.scale = null; return; }
      const prod = d.Sxx.mul(d.Syy);
      const rt = root6(prod);
      const steps = [];
      steps.push({
        html: '<b>From the three column sums</b> of the table:',
        block: S.mathLines('r=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum(x_i-\\bar x)^2}\\,\\sqrt{\\sum(y_i-\\bar y)^2}}=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sqrt{\\sum(x_i-\\bar x)^2\\sum(y_i-\\bar y)^2}}',
          relOf(d.Sxy, d.Sxx, d.Syy) + '\\frac{' + NT(d.Sxy) + '}{\\sqrt{' + P_(NT(d.Sxx)) + '\\times ' + P_(NT(d.Syy)) + '}}' + relOf(d.Sxy, prod) + '\\frac{' + NT(d.Sxy) + '}{\\sqrt{' + NT(prod) + '}}' +
          (rt.ex ? '=\\frac{' + NT(d.Sxy) + '}{' + rt.t + '}' : '\\approx\\frac{' + D6(d.Sxy) + '}{' + rt.t + '}') + rTex(d.sign, d.r2)),
        note: rt.ex ? '' : 'The square root is kept to 6 decimal places so that the 4th decimal of ' + tx('r') + ' is right; ' + tx('r') + ' itself is rounded from the exact value.',
      });
      const sxs = root6(d.vxS), sys = root6(d.vyS), sxp = root6(d.vxP), syp = root6(d.vyP);
      steps.push({
        html: '<b>The same ' + tx('r') + ' from the covariance</b> (L4.7: ' + tx('r=\\frac{\\text{Cov}(x,y)}{s_x s_y}') + ', with ' + tx('s_x, s_y') + ' from the previous panel):',
        block: S.mathLines('r=\\frac{\\text{Cov}_{\\text{sample}}}{s_x\\,s_y}' + (sxs.ex && sys.ex && shownExact(d.covS) ? '=' : '\\approx ') + '\\frac{' + NT6(d.covS) + '}{' + sxs.t + '\\times ' + sys.t + '}' + rTex(d.sign, d.r2),
          'r=\\frac{\\text{Cov}_{\\text{pop}}}{\\sigma_x\\,\\sigma_y}' + (sxp.ex && syp.ex && shownExact(d.covP) ? '=' : '\\approx ') + '\\frac{' + NT6(d.covP) + '}{' + sxp.t + '\\times ' + syp.t + '}' + rTex(d.sign, d.r2)),
        note: 'Both give the same ' + tx('r') + ': the ' + tx('n-1') + ' (or the ' + tx('n') + ') appears once on top and once under each root below, so it cancels — that is why the first formula needs no divisor at all.',
      });
      steps.push({ html: '<b>' + tx('r^2') + ' is exact</b> (no square root needed), and it is the ' + tx('R^2') + ' of the fitted line in the next panel:', math: 'r^2=\\frac{\\left(\\sum(x_i-\\bar x)(y_i-\\bar y)\\right)^2}{\\sum(x_i-\\bar x)^2\\sum(y_i-\\bar y)^2}=\\frac{' + P_(NT(d.Sxy)) + '^2}{' + NT(prod) + '}' + eq(d.r2) });
      const b = bandOf(S, d.r2);
      steps.push({ html: '<b>Reading it.</b> ' + tx('r' + rTex(d.sign, d.r2)) + ', so ' + tx(b.range) + ': <b>' + (b.k ? b.word + ' ' + (d.sign > 0 ? 'positive' : 'negative') + ' linear association' : 'no linear association') + '</b>. ' + BOARD });
      body.appendChild(S.steps(steps));
      P.scale = h('div', { class: 'w4-chart' });
      body.appendChild(P.scale);
      drawCorrScale();
      if (d.r2.isZero() || b.k === 0) body.appendChild(K.note('“No linear association” does not mean “no relationship”: the points can still follow a curve (course notes). The last panel tests for one.', 'small muted'));
    }
    function drawCorrScale() {
      if (!P.scale || !D || !D.r2) return;
      rScale(S, P.scale, rNum(D.sign, D.r2), 'r ' + rTxt(D.sign, D.r2).replace(/^(?!≈)/, '= '), bandOf(S, D.r2), D.sign);
    }

    /* ---------------- fitted line */
    function drawFit() {
      const d = D, body = P.fit.body, n = d.n;
      Lab.clear(body);
      P.fit.sub('L4.8 gets this line from the Google Sheets trendline (“the mathematics … is beyond the scope of this course”). The trendline is the least-squares line; here are its formulas with your numbers.');
      if (!d.m) { body.appendChild(K.note(n < 2 ? 'Needs at least two pairs.' : 'Every ' + tx('x') + ' is equal, so the slope would divide by ' + tx('\\sum(x_i-\\bar x)^2=0') + ': the points stand on a vertical line and no line ' + tx('\\hat y=mx+c') + ' fits them.')); return; }
      const steps = [];
      steps.push({ html: '<b>Slope</b> ' + tx('m') + ': the sum of products over the sum of squares of ' + tx('x') + ':', math: 'm=\\frac{\\sum(x_i-\\bar x)(y_i-\\bar y)}{\\sum(x_i-\\bar x)^2}=\\frac{' + NT(d.Sxy) + '}{' + NT(d.Sxx) + '}' + eq(d.m) });
      const mx = d.m.mul(d.mx);
      steps.push({ html: '<b>Intercept</b> ' + tx('c') + ': the line passes through the point of means ' + tx('(\\bar x,\\bar y)') + ', so', math: 'c=\\bar y-m\\bar x=' + NT(d.my) + '-' + P_(NT(d.m)) + '\\times ' + P_(NT(d.mx)) + '=' + NT(d.my) + '-' + P_(NT(mx)) + eq(d.c) });
      steps.push({ html: '<b>The line</b> (L4.8 writes it ' + tx('y=mx+c') + '):', math: lineTex(d), note: d.m.isZero() ? 'Slope 0: a flat line — knowing ' + tx('x') + ' does not change the prediction.' : 'Each 1 more unit of ' + xN() + ' changes the predicted ' + yN() + ' by ' + tx(V(d.m)) + (d.m.sign() > 0 ? ' (up).' : ' (down).') + ' The slope has the same sign as ' + tx('r') + '.' });
      if (d.r2) {
        steps.push({ html: '<b>Goodness of fit</b>: ' + tx('R^2=r^2') + ' (L4.8; course notes).', math: 'R^2=r^2' + eq(d.r2) });
        steps.push({
          html: '<b>Check: what ' + tx('R^2') + ' measures.</b> Square the residuals ' + tx('y_i-\\hat y_i') + ' (the dashed gaps when “Residuals” is on) and add; compare with the total ' + tx('\\sum(y_i-\\bar y)^2') + ':',
          block: S.mathLines('\\sum(y_i-\\hat y_i)^2' + eq(d.SSE), 'R^2=1-\\frac{\\sum(y_i-\\hat y_i)^2}{\\sum(y_i-\\bar y)^2}=1-\\frac{' + NT(d.SSE) + '}{' + NT(d.Syy) + '}' + eq(d.r2)),
          note: 'The same number ✓: ' + tx('R^2') + ' is the share of the variation of ' + tx('y') + ' around ' + tx('\\bar y') + ' that the line captures (L4.8: near 1 = good fit, near 0 = poor fit). It never shows the direction — use the sign of ' + tx('r') + ' or of ' + tx('m') + ' for that.',
        });
      } else steps.push({ html: 'Every ' + tx('y') + ' is equal: the line is flat at ' + tx('\\bar y') + ' and fits perfectly, but ' + tx('R^2=r^2') + ' would divide by ' + tx('\\sum(y_i-\\bar y)^2=0') + ' and is not defined.' });
      body.appendChild(S.steps(steps));
    }

    /* ---------------- description */
    function drawDesc() {
      const d = D, a = AN, body = P.desc.body;
      Lab.clear(body);
      P.desc.sub('L4.5: describe a scatterplot by its direction, its form (line or curve), its strength (how tightly the points cluster) and any outliers. Below, each one is decided from your numbers, and the rule used is printed under it.');
      if (d.n < 2) { body.appendChild(K.note('Needs at least two pairs.')); return; }
      const dl = h('dl', { class: 'w4-desc' });
      const add = (t, html, how) => { dl.append(h('dt', { text: t }), h('dd', { html: html + (how ? '<span class="w4-how">' + how + '</span>' : '') })); };
      // direction
      const dirWord = d.sign > 0 ? 'upward (positive)' : d.sign < 0 ? 'downward (negative)' : 'none';
      add('Direction', '<b>' + dirWord + '</b>: ' + tx('\\sum(x_i-\\bar x)(y_i-\\bar y)' + eq(d.Sxy)) + (d.sign > 0 ? ' > 0, so larger ' + tx('x') + ' go with larger ' + tx('y') + '.' : d.sign < 0 ? ' < 0, so larger ' + tx('x') + ' go with smaller ' + tx('y') + '.' : ', so the line is flat.') + (a.band && a.band.k === 0 && d.sign !== 0 ? ' (So weak that the L4.7 scale reads it as no linear association.)' : ''), 'Rule: the sign of the sum of products (the same sign as the covariance, ' + tx('r') + ' and the slope ' + tx('m') + ').');
      // form
      let form, formHow;
      if (a.quad) {
        const vals = 'best line ' + tx('R^2' + eq(a.lin)) + ', best parabola ' + tx('R^2' + eq(a.quad)) + '. The line leaves ' + nw(tx('1-R^2' + eq(a.left))) + ' unexplained; the parabola adds ' + nw(tx(tiny(a.gain))) + (a.left.isZero() ? '' : ', which is ' + nw(tx(pct2(a.rel))) + ' of it');
        if (a.curved) form = '<b>curved</b>: ' + vals + '. The points follow a curve that a straight line misses' + (a.band && a.band.k < 3 ? ', so ' + tx('r') + ' understates the relationship.' : '.');
        else if (a.band && a.band.k === 0) form = '<b>no clear pattern</b> (a cloud): ' + vals + '. Neither a line nor a parabola describes the points (L4.4: “I do not see any clear pattern”).';
        else form = '<b>linear</b>: ' + vals + '. A curve is not clearly better than the line.' + (a.bends ? ' The points do bend slightly (the parabola fits a little better) — look at the plot.' : '');
        formHow = 'Rule made for this lab (not a course rule): the lab also fits the best parabola ' + tx('y=b_0+b_1x+b_2x^2') + '. “Curved” when the parabola reaches ' + tx('R^2\\ge 0.8') + ', adds at least 0.1 to the line’s ' + tx('R^2') + ', and removes at least 70% of what the line leaves unexplained.' + (a.formExcl.length ? ' Judged without the flagged outlier' + (a.formExcl.length > 1 ? 's' : '') + '.' : '') + (a.formN < 10 ? ' With fewer than 10 points a curve can fit by chance, so treat this as a rough guide.' : '');
      } else {
        form = 'not tested: ' + (a.formN < 5 ? 'the lab needs at least 5 points (not counting flagged outliers)' : 'it needs at least 3 different ' + tx('x') + ' values') + ' to compare a line with a curve. Judge it from the plot (L4.5).';
        formHow = '';
      }
      add('Form', form, formHow);
      // strength
      if (a.band) add('Strength', '<b>' + (a.band.k ? a.band.word : 'no linear association') + '</b>: ' + tx('r' + rTex(d.sign, d.r2)) + ', so ' + tx(a.band.range) + '.' + (a.curved ? ' (This measures only straight-line strength; the curve above can be tight even when ' + tx('r') + ' is small.)' : ''), 'Rule: the L4.7 scale ' + BOARD);
      else add('Strength', 'not defined: ' + tx('r') + ' divides by 0 (all ' + (d.Sxx.isZero() ? tx('x') : tx('y')) + ' values are equal).', '');
      // outliers
      let oHtml;
      if (d.n < 5 || !d.m) oHtml = 'not tested: the lab needs at least 5 points and a fitted line.';
      else {
        const fr = a.fr;
        const list = a.res.map(i => 'point ' + (i + 1) + ' ' + tx('(' + V(d.xs[i]) + ',' + V(d.ys[i]) + ')') + ', residual ' + tx(NT(d.res[i])) + ' ' + (d.res[i].cmp(fr.lo) < 0 ? 'below the lower' : 'above the upper') + ' fence');
        oHtml = (a.res.length ? '<b>' + a.res.length + ' possible outlier' + (a.res.length > 1 ? 's' : '') + '</b>: ' + list.join('; ') + '.' : '<b>none</b>: every residual lies inside the fences.') +
          ' Residual fences: ' + tx('Q_1-1.5\\,\\mathrm{IQR}' + eq(fr.lo)) + ' and ' + tx('Q_3+1.5\\,\\mathrm{IQR}' + eq(fr.hi)) + ' (' + tx('Q_1' + eq(fr.q1)) + ', ' + tx('Q_3' + eq(fr.q3)) + ').';
        const ext = [];
        if (a.xo.length) ext.push(tx('x') + ' of point' + (a.xo.length > 1 ? 's ' : ' ') + a.xo.map(i => i + 1).join(', ') + ' (fences ' + tx(V(a.fx.lo)) + ' to ' + tx(V(a.fx.hi)) + ')');
        if (a.yo.length) ext.push(tx('y') + ' of point' + (a.yo.length > 1 ? 's ' : ' ') + a.yo.map(i => i + 1).join(', ') + ' (fences ' + tx(V(a.fy.lo)) + ' to ' + tx(V(a.fy.hi)) + ')');
        oHtml += ext.length ? ' Far from the rest in one variable alone: ' + ext.join('; ') + '.' : ' No ' + tx('x') + ' or ' + tx('y') + ' value is far from the rest on its own either.';
        if (a.without.length) oHtml += '<br>Effect on ' + tx('r') + ': ' + a.without.map(w => 'without point ' + (w.i + 1) + ', ' + (w.d.r2 ? tx('r' + rTex(w.d.sign, w.d.r2)) : tx('r') + ' is not defined') + ' (with it: ' + tx('r' + rTex(d.sign, d.r2 || S.R0)) + ')').join('; ') + '.';
      }
      add('Outliers', oHtml, d.n >= 5 && d.m ? 'Rule made for this lab: a residual ' + tx('y_i-\\hat y_i') + ' outside the Week 3 box-plot fences (lecture ' + tx('np') + ' quartiles, 1.5·IQR) of all the residuals means the point does not follow the pattern of the others (L4.5). The same fences on the ' + tx('x') + ' column and on the ' + tx('y') + ' column catch values that are extreme on their own.' : '');
      body.appendChild(dl);
      // one-sentence summary
      if (a.band) {
        const words = [];
        if (a.quad && a.curved) words.push('a curved pattern');
        else if (a.band.k === 0) words.push('no clear linear pattern');
        else words.push('a ' + a.band.word + ', ' + (d.sign > 0 ? 'positive' : 'negative') + ', linear association');
        const o = d.n >= 5 && d.m ? (a.res.length ? ', with ' + a.res.length + ' possible outlier' + (a.res.length > 1 ? 's' : '') + ' (point ' + a.res.map(i => i + 1).join(', ') + ')' : ', with no outliers by the lab’s rule') : '';
        body.appendChild(h('div', { class: 'w4-sum', html: 'In one sentence: ' + xN() + ' and ' + yN() + ' show ' + words[0] + o + '.' }));
      }
    }

    /* ---------------- start */
    syncMode();
    onData();
    return () => { window.removeEventListener('resize', onResize); };
  }

  /* ---------------------------------------------------------------- paired-data editor */
  function pairEditor(S, { rows, heads, onChange, onFocus }) {
    let R = rows.map(r => [String(r[0]), String(r[1])]);
    let hx = heads[0], hy = heads[1], hotK = -1;
    const grid = h('div', { class: 'w4-pe' });
    const scroll = h('div', { class: 'w4-pe-scroll' }, grid);
    const tools = h('div', { class: 'pl-chips' });
    const wrap = h('div', { class: 'pl-field w4-pe-wrap' }, scroll, tools);
    tools.append(
      Lab.button('+ pair', () => {
        const last = R[R.length - 1] || ['0', '0'];
        const lx = S.readNum(last[0]);
        R.push([lx ? S.decStr(lx.add(S.R1), Math.min(6, S.places(lx.add(S.R1)))) : String(R.length + 1), last[1]]);
        draw(); emit();
        scroll.scrollTop = scroll.scrollHeight;
      }, 'btn xs'),
      Lab.button('Sort by x', () => {
        const key = r => { const q = S.readNum(r[0]); return q ? q.num() : Infinity; };
        R.sort((a, b) => key(a) - key(b));
        draw(); emit();
      }, 'btn xs'));
    function draw() {
      Lab.clear(grid);
      grid.append(h('span', { class: 'w4-pe-h', text: '#' }), h('span', { class: 'w4-pe-h', html: 'x: ' + user(hx), title: blank(hx) }), h('span', { class: 'w4-pe-h', html: 'y: ' + user(hy), title: blank(hy) }), h('span'));
      R.forEach((r, k) => {
        const xi = h('input', { class: 'field mono w4-pe-in' + (k === hotK ? ' hot' : ''), value: r[0], spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': 'x of pair ' + (k + 1) });
        const yi = h('input', { class: 'field mono w4-pe-in' + (k === hotK ? ' hot' : ''), value: r[1], spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': 'y of pair ' + (k + 1) });
        const del = h('button', { class: 'icon-btn pe-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove pair ' + (k + 1), title: 'remove this pair' });
        xi.addEventListener('input', () => { R[k][0] = xi.value; emitSoon(); });
        yi.addEventListener('input', () => { R[k][1] = yi.value; emitSoon(); });
        xi.addEventListener('focus', () => onFocus && onFocus(k));
        yi.addEventListener('focus', () => onFocus && onFocus(k));
        del.addEventListener('click', () => { if (R.length > 1) { R.splice(k, 1); draw(); emit(); } });
        grid.append(h('span', { class: 'w4-pe-i', text: String(k + 1) }), xi, yi, del);
      });
    }
    const emitSoon = Lab.debounce(() => emit(), 220);
    function emit() { onChange(R.map(r => r.slice())); }
    wrap.set = rows2 => { R = rows2.map(r => [String(r[0]), String(r[1])]); draw(); emit(); };
    wrap.setRow = (k, x, y) => {
      if (!R[k]) return;
      R[k] = [x, y];
      const ins = grid.querySelectorAll('input');
      if (ins[2 * k]) ins[2 * k].value = x;
      if (ins[2 * k + 1]) ins[2 * k + 1].value = y;
    };
    wrap.mark = bad => grid.querySelectorAll('input').forEach((el, idx) => el.classList.toggle('bad', bad.has(Math.floor(idx / 2) + ',' + (idx % 2))));
    wrap.heads = (a, b) => { hx = a; hy = b; const hs = grid.querySelectorAll('.w4-pe-h'); if (hs[1]) { hs[1].innerHTML = 'x: ' + user(hx); hs[1].title = blank(hx); } if (hs[2]) { hs[2].innerHTML = 'y: ' + user(hy); hs[2].title = blank(hy); } };
    wrap.hot = k => {
      hotK = k;
      grid.querySelectorAll('input').forEach((el, idx) => el.classList.toggle('hot', Math.floor(idx / 2) === k));
    };
    draw();
    return wrap;
  }

  /* ================================================================== tab 2: point-biserial */
  function pbTab(root, stAll, save, S, restart) {
    const st = stAll.pb;
    const { side, main } = K.layout(root, 'w4s');
    root.classList.add('w4pb');
    const ctl = {}, P = {};
    let D = null;
    const V = q => S.vt(q), NT = q => S.nt(q), P_ = t => S.par(t), eq = q => S.eqt(q);
    const D6 = q => (S.exact(q) ? V(q) : S.decStr(q, 6));
    const root6 = q => { const r = S.sqrtExact(q); return r ? { ex: true, t: V(r) } : { ex: false, t: S.sqrtDec(q, 6) }; };
    const rTex = (sign, r2) => { const r = S.sqrtExact(r2); return r ? (sign < 0 && !r.isZero() ? '=-' : '=') + V(r) : '\\approx ' + (sign < 0 ? '-' : '') + S.sqrtDec(r2, 4); };
    const rTxt = (sign, r2) => { const r = S.sqrtExact(r2); return r ? (sign < 0 && !r.isZero() ? '−' : '') + S.ht(r) : '≈ ' + (sign < 0 ? '−' : '') + S.sqrtDec(r2, 4); };
    const g0 = () => user(st.g0name), g1 = () => user(st.g1name);

    /* ---------------- controls */
    side.appendChild(K.group('1 · Your two variables'));
    ctl.xName = K.textField({ label: 'Numerical variable ' + tx('X'), value: st.xName, mono: false, onChange: v => { st.xName = v; save(); draw(); } });
    ctl.yName = K.textField({ label: 'Two-category variable ' + tx('Y') + ' (dichotomous)', value: st.yName, mono: false, onChange: v => { st.yName = v; save(); draw(); } });
    side.append(ctl.xName, ctl.yName);
    side.appendChild(K.group('2 · The two groups'));
    ctl.g0name = K.textField({ label: 'Category coded ' + tx('Y=0'), value: st.g0name, mono: false, onChange: v => { st.g0name = v; save(); draw(); } });
    ctl.g0 = K.listField({ label: tx('X') + ' values in group ' + tx('Y=0'), value: st.g0, rows: 3, onChange: () => { st.g0 = ctl.g0.input.value; save(); draw(); } });
    ctl.g1name = K.textField({ label: 'Category coded ' + tx('Y=1'), value: st.g1name, mono: false, onChange: v => { st.g1name = v; save(); draw(); } });
    ctl.g1 = K.listField({ label: tx('X') + ' values in group ' + tx('Y=1'), value: st.g1, rows: 3, onChange: () => { st.g1 = ctl.g1.input.value; save(); draw(); } });
    side.append(ctl.g0name, ctl.g0, ctl.g1name, ctl.g1);
    side.appendChild(h('div', { class: 'pl-chips' }, Lab.button('Swap the codes 0 ↔ 1', () => {
      const a = [st.g0name, st.g0], b = [st.g1name, st.g1];
      [st.g0name, st.g0] = b; [st.g1name, st.g1] = a;
      ctl.g0name.input.value = st.g0name; ctl.g1name.input.value = st.g1name;
      ctl.g0.set(st.g0); ctl.g1.set(st.g1);
      save(); draw();
    }, 'btn xs')));
    side.appendChild(K.note('L4.9: which category is coded 0 is your choice; swapping the codes flips the sign of ' + tx('r_{pb}') + ' and keeps its size.'));
    side.appendChild(K.presets({ label: 'Examples (lecture and made-up)', items: PB_PRESETS, onPick: it => {
      Object.assign(st, { xName: it.xName, yName: it.yName, g0name: it.g0name, g1name: it.g1name, g0: it.g0, g1: it.g1 });
      ctl.xName.input.value = it.xName; ctl.yName.input.value = it.yName; ctl.g0name.input.value = it.g0name; ctl.g1name.input.value = it.g1name;
      ctl.g0.set(it.g0); ctl.g1.set(it.g1);
      save(); draw();
    } }));
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start this tab again</span>', () => { stAll.pb = DEF_PB(); save(); restart(); }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = K.answer();
    P.pic = K.panel('Your data, coded 0 and 1');
    P.groups = K.panel('Group sizes, proportions and means');
    P.sd = K.panel('The standard deviation of ' + tx('X') + ': population ' + tx('\\sigma_x') + ' (and from the sample ' + tx('s') + ')');
    P.rpb = K.panel('Point-biserial correlation, with your numbers');
    main.append(P.answer, P.pic, P.groups, P.sd, P.rpb);
    P.picBox = h('div', { class: 'w4-chart' });
    P.pic.body.append(h('div', { class: 'w4-legend' },
      h('span', {}, h('i', { class: 'w4-key g0' }), h('span', { html: 'group ' + tx('Y=0') })), h('span', {}, h('i', { class: 'w4-key g1' }), h('span', { html: 'group ' + tx('Y=1') })),
      h('span', {}, h('i', { class: 'w4-key mean' }), P.meanKey = h('span', { html: 'mean of all ' + tx('X') }))), P.picBox);
    const onResize = Lab.debounce(() => { if (!root.isConnected) { window.removeEventListener('resize', onResize); return; } if (D && !D.err) drawPic(); }, 200);
    window.addEventListener('resize', onResize);

    function compute() {
      const a = S.parseList(st.g0), b = S.parseList(st.g1);
      if (a.bad.length || b.bad.length) return { err: 'Not a number: ' + a.bad.concat(b.bad).slice(0, 3).map(esc).join(', ') };
      if (!a.vals.length || !b.vals.length) return { err: 'Each group needs at least one value.' };
      const g0v = a.vals, g1v = b.vals, n0 = g0v.length, n1 = g1v.length, n = n0 + n1, N = S.int(n);
      if (n > 1000) return { err: 'This lab works with up to 1000 values.' };
      const s0 = S.sumR(g0v), s1 = S.sumR(g1v), m0 = s0.div(S.int(n0)), m1 = s1.div(S.int(n1));
      const all = g0v.concat(g1v), sum = s0.add(s1), mean = sum.div(N);
      const dev2 = all.map(x => x.sub(mean).mul(x.sub(mean)));
      const ss = S.sumR(dev2);
      const v = ss.div(N), sv = n > 1 ? ss.div(S.int(n - 1)) : null;
      const p0 = S.frac(n0, n), p1 = S.frac(n1, n), diff = m0.sub(m1);
      const r2 = v.isZero() ? null : diff.mul(diff).mul(p0).mul(p1).div(v);
      // Pearson r between X and the 0/1 codes, from scratch
      const codes = g0v.map(() => S.R0).concat(g1v.map(() => S.R1));
      const cbar = p1;
      const Sxc = S.sumR(all.map((x, i) => x.sub(mean).mul(codes[i].sub(cbar))));
      const Scc = S.sumR(codes.map(c => c.sub(cbar).mul(c.sub(cbar))));
      const pr2 = v.isZero() ? null : Sxc.mul(Sxc).div(ss.mul(Scc));
      return { g0v, g1v, n0, n1, n, N, s0, s1, m0, m1, all, sum, mean, dev2, ss, v, sv, p0, p1, diff, r2, codes, Sxc, Scc, pr2 };
    }

    function draw() {
      const d = compute();
      if (d.err) {
        if (!D || D.err) { K.setAnswer(P.answer, { ev: '<span class="cbad">' + d.err + '</span>' }); return; }
        const old = P.answer.querySelector('.w4-stale');
        if (old) old.remove();
        P.answer.prepend(h('div', { class: 'w4-stale', html: '<span class="cbad">' + d.err + '</span> Everything below still shows your last valid data.' }));
        return;
      }
      D = d;
      drawAnswer(); drawPic(); drawGroups(); drawSD(); drawRpb();
      const s = q => (q == null ? null : q.toString());
      root.dataset.w4pb = JSON.stringify({ n0: d.n0, n1: d.n1, m0: s(d.m0), m1: s(d.m1), p0: s(d.p0), p1: s(d.p1), mean: s(d.mean), ss: s(d.ss), v: s(d.v), sv: s(d.sv), r2: s(d.r2), r: d.r2 ? rTxt(d.diff.sign(), d.r2) : null, pr2: s(d.pr2), Sxc: s(d.Sxc) });
    }

    function drawAnswer() {
      const d = D;
      const ev = tx('X') + ' = ' + user(st.xName) + ' (numerical) · ' + tx('Y') + ' = ' + user(st.yName) + ': ' + tx('Y=0') + ' for “' + g0() + '” (' + d.n0 + ' value' + (d.n0 === 1 ? '' : 's') + '), ' + tx('Y=1') + ' for “' + g1() + '” (' + d.n1 + ').';
      if (!d.r2) { K.setAnswer(P.answer, { ev, sub: 'All ' + d.n + ' values of ' + tx('X') + ' are equal, so ' + tx('\\sigma_x=0') + ' and ' + tx('r_{pb}') + ' divides by 0: not defined.' }); return; }
      const sign = d.diff.sign();
      K.setAnswer(P.answer, {
        ev,
        big: 'r_{pb}=\\frac{\\bar Y_0-\\bar Y_1}{\\sigma_x}\\sqrt{p_0p_1}' + rTex(sign, d.r2),
        sub: 'Size ' + tx('|r_{pb}|' + rTex(1, d.r2)) + ' → ' + readWord(d) + '. The sign only says which group has the larger mean: ' + (sign > 0 ? '“' + g0() + '” (coded 0)' : sign < 0 ? '“' + g1() + '” (coded 1)' : 'neither (the two means are equal)') + '.',
      });
    }
    function readWord(d) {
      const b = bandOf(S, d.r2);
      return b.k === 0 ? '<b>close to 0: little or no association</b> (L4.9)' : b.k === 3 ? '<b>close to 1: strong association</b> (L4.9)' : '<b>' + b.word + ' association</b> on the L4.7 scale';
    }

    /* the lecture's picture: the codes across, X up */
    function drawPic() {
      const d = D, box = P.picBox;
      const W = S.chartWidth(box), H = 318, pl = 54, pr = 16, pt = 26, pb = 62;
      const nums = d.all.map(q => q.num());
      const [y0, y1] = S.domain(nums.concat([d.m0.num(), d.m1.num()]), 0.1);
      const Y = v => pt + (1 - (v - y0) / (y1 - y0)) * (H - pt - pb);
      const cx = [pl + (W - pl - pr) * 0.3, pl + (W - pl - pr) * 0.7];
      const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w4-svg', role: 'img', 'aria-label': 'the values of X for Y = 0 and Y = 1' });
      const yt = S.niceTicks(y0, y1, 5);
      yt.ticks.filter(t => t >= y0 && t <= y1).forEach(t => {
        s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 'w4-grid' }));
        s.appendChild(svg('text', { x: pl - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'w4-tick' }, S.tickFmt(t, yt.step)));
      });
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: H - pb, y2: H - pb, class: 'w4-axis' }));
      s.appendChild(svg('text', { x: 6, y: 15, class: 'w4-name' }, '↑ X: ' + blank(st.xName)));
      [[0, st.g0name, d.m0], [1, st.g1name, d.m1]].forEach(([c, nm, m]) => {
        s.appendChild(svg('text', { x: cx[c], y: H - pb + 18, 'text-anchor': 'middle', class: 'w4-name' }, 'Y = ' + c + ': ' + blank(nm)));
        s.appendChild(svg('text', { x: cx[c], y: H - pb + 35, 'text-anchor': 'middle', class: 'w4-tick' }, (W < 520 ? '' : 'mean ') + (c ? 'Ȳ₁ ' : 'Ȳ₀ ') + eqTxt(S, m)));
      });
      s.appendChild(svg('text', { x: W - pr, y: H - 4, 'text-anchor': 'end', class: 'w4-tick' }, 'Y: ' + blank(st.yName) + ' (coded)'));
      const yAll = Y(d.mean.num());
      s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: yAll, y2: yAll, class: 'w4-meanl' }));
      Lab.setHTML(P.meanKey, 'mean of all ' + tx('X') + ' ' + tx(S.eqt(d.mean).replace(/^=/, '= ')));
      [[d.g0v, 0], [d.g1v, 1]].forEach(([vals, c]) => {
        const seen = {};
        const order = vals.map((v, i) => ({ v, i })).sort((a, b) => a.v.cmp(b.v));
        order.forEach(({ v }) => {
          const k = v.toString(); seen[k] = (seen[k] || 0) + 1;
          const j = seen[k] - 1, off = (j % 2 ? -1 : 1) * Math.ceil(j / 2) * 9;
          s.appendChild(svg('circle', { cx: cx[c] + off, cy: Y(v.num()), r: 5, class: 'w4-d' + c }, svg('title', {}, 'Y = ' + c + ': ' + S.ht(v))));
        });
        const m = c ? d.m1 : d.m0, ym = Y(m.num());
        s.appendChild(svg('line', { x1: cx[c] - 42, x2: cx[c] + 42, y1: ym, y2: ym, class: 'w4-m' + c }));
      });
      const ya = Y(d.m0.num()), yb = Y(d.m1.num()), xm = (cx[0] + cx[1]) / 2;
      if (Math.abs(ya - yb) > 6) {
        s.appendChild(svg('path', { d: 'M' + (xm - 6) + ',' + ya + ' H' + xm + ' V' + yb + ' H' + (xm - 6), class: 'w4-brk' }));
        s.appendChild(svg('text', { x: xm + 6, y: (ya + yb) / 2 + 4, class: 'w4-lab' }, 'Ȳ₀ − Ȳ₁ ' + eqTxt(S, d.diff)));
      }
      Lab.clear(box);
      box.appendChild(s);
    }

    function drawGroups() {
      const d = D, body = P.groups.body;
      Lab.clear(body);
      P.groups.sub('L4.9: split the data into the two groups of ' + tx('Y') + ', then find each group’s size, proportion and mean. The course writes ' + tx('\\bar Y_0') + ' and ' + tx('\\bar Y_1') + ' for the mean of ' + tx('X') + ' in each group.');
      const w0 = d.n0 <= 15 ? S.sumTex(d.g0v) + '=' : '', w1 = d.n1 <= 15 ? S.sumTex(d.g1v) + '=' : '';
      const steps = [
        { html: '<b>Sizes.</b> Count the values typed in each group:', math: 'n_0=' + d.n0 + ',\\quad n_1=' + d.n1 + ',\\quad n=n_0+n_1=' + d.n0 + '+' + d.n1 + '=' + d.n },
        { html: '<b>Proportions</b> of the ' + tx('n=' + d.n) + ' observations in each group:', block: S.mathLines('p_0=\\frac{n_0}{n}=\\frac{' + d.n0 + '}{' + d.n + '}' + eq(d.p0) + ',\\qquad p_1=\\frac{n_1}{n}=\\frac{' + d.n1 + '}{' + d.n + '}' + eq(d.p1)), note: 'Check: ' + tx('p_0+p_1=1') + ' ✓' },
        { html: '<b>Group means.</b> Mean of the ' + tx('X') + ' values in group “' + g0() + '” (' + tx('Y=0') + ') and in group “' + g1() + '” (' + tx('Y=1') + '):',
          block: S.mathLines('\\bar Y_0=\\frac{' + (w0 ? w0.replace(/=$/, '') : '\\text{sum of group 0}') + '}{' + d.n0 + '}' + (w0 ? '=' + S.overTex(d.s0, d.n0, d.m0) : '=' + S.overTex(d.s0, d.n0, d.m0)),
            '\\bar Y_1=\\frac{' + (w1 ? w1.replace(/=$/, '') : '\\text{sum of group 1}') + '}{' + d.n1 + '}' + (w1 ? '=' + S.overTex(d.s1, d.n1, d.m1) : '=' + S.overTex(d.s1, d.n1, d.m1))) },
        { html: '<b>Difference of the means</b> (group 0 minus group 1, as in the course formula):', math: '\\bar Y_0-\\bar Y_1=' + NT(d.m0) + '-' + P_(NT(d.m1)) + eq(d.diff) },
      ];
      body.appendChild(S.steps(steps));
    }

    function drawSD() {
      const d = D, body = P.sd.body, n = d.n;
      Lab.clear(body);
      P.sd.sub('The course formula uses the <b>population</b> standard deviation of all ' + tx('n') + ' values of ' + tx('X') + ' (both groups together). If you are given the sample SD ' + tx('s') + ' (Sheets STDEV), convert it with ' + tx('n\\sigma_x^2=(n-1)s^2') + '.');
      const meanCheck = d.p0.mul(d.m0).add(d.p1.mul(d.m1));
      const steps = [];
      steps.push({ html: '<b>Mean of all ' + n + ' values</b>:', block: S.mathLines('\\bar x=\\frac{\\sum x_i}{n}=\\frac{' + V(d.s0) + '+' + P_(V(d.s1)) + '}{' + n + '}=' + S.overTex(d.sum, n, d.mean)), note: 'Check: ' + tx('p_0\\bar Y_0+p_1\\bar Y_1=' + NT(d.p0) + '\\times ' + P_(NT(d.m0)) + '+' + NT(d.p1) + '\\times ' + P_(NT(d.m1)) + eq(meanCheck)) + ' ✓' });
      const rows = d.all.map((x, i) => [String(i + 1), i < d.n0 ? '0' : '1', S.ht(x), S.ht(x.sub(d.mean)), S.ht(d.dev2[i])]);
      const t = S.table([tx('i'), tx('Y'), tx('x_i'), tx('x_i-\\bar x'), tx('(x_i-\\bar x)^2')], rows, { foot: [tx('\\sum'), '', S.ht(d.sum), '0', S.ht(d.ss)], scroll: n > 12, cls: 'w4-num' });
      steps.push({ html: '<b>Squared deviations</b> of every value from ' + tx('\\bar x') + ', added up:', block: t, math: '\\sum(x_i-\\bar x)^2' + eq(d.ss) });
      steps.push({ html: '<b>Population SD</b> (divide by ' + tx('n=' + n) + ') — the one the formula needs:', block: S.mathLines('\\sigma_x^2=\\frac{\\sum(x_i-\\bar x)^2}{n}=' + S.overTex(d.ss, n, d.v), '\\sigma_x=\\sqrt{' + NT(d.v) + '}' + S.sqrtEq(d.v)) });
      if (d.sv) {
        const conv = S.int(n - 1).mul(d.sv);
        steps.push({
          html: '<b>Sample SD</b> (divide by ' + tx('n-1=' + (n - 1)) + '), and the conversion between the two:',
          block: S.mathLines('s^2=\\frac{\\sum(x_i-\\bar x)^2}{n-1}=' + S.overTex(d.ss, n - 1, d.sv) + ',\\quad s=\\sqrt{' + NT(d.sv) + '}' + S.sqrtEq(d.sv),
            'n\\sigma_x^2=' + n + '\\times ' + P_(NT(d.v)) + eq(d.ss) + ',\\qquad (n-1)s^2=' + (n - 1) + '\\times ' + P_(NT(d.sv)) + eq(conv),
            '\\sigma_x=s\\sqrt{\\frac{n-1}{n}}' + (S.sqrtExact(d.sv) ? '=' : '\\approx ') + root6(d.sv).t + '\\times\\sqrt{\\frac{' + (n - 1) + '}{' + n + '}}' + S.sqrtEq(d.v)),
          note: 'Both products equal the sum of squares, so ' + tx('n\\sigma_x^2=(n-1)s^2') + ' ✓.',
        });
      }
      body.appendChild(S.steps(steps));
    }

    function drawRpb() {
      const d = D, body = P.rpb.body, n = d.n;
      Lab.clear(body);
      P.rpb.sub('Course notes, Week 4 (L4.9): ' + tx('r_{pb}=\\dfrac{\\bar Y_0-\\bar Y_1}{\\sigma_x}\\sqrt{p_0p_1}') + ', with ' + tx('\\sigma_x') + ' the population SD of ' + tx('X') + '.');
      if (!d.r2) { body.appendChild(K.note('All values of ' + tx('X') + ' are equal, so ' + tx('\\sigma_x=0') + ' and the formula divides by 0: ' + tx('r_{pb}') + ' is not defined.')); return; }
      const sign = d.diff.sign();
      const pp = d.p0.mul(d.p1), sq = root6(pp), sg = root6(d.v);
      const steps = [];
      steps.push({ html: '<b>Put in your numbers</b> (from the two panels above):',
        block: S.mathLines('r_{pb}=\\frac{\\bar Y_0-\\bar Y_1}{\\sigma_x}\\sqrt{p_0p_1}=\\frac{' + NT(d.diff) + '}{' + (sg.ex ? sg.t : '\\sqrt{' + NT(d.v) + '}') + '}\\sqrt{' + NT(d.p0) + '\\times ' + NT(d.p1) + '}=\\frac{' + NT(d.diff) + '}{' + (sg.ex ? sg.t : '\\sqrt{' + NT(d.v) + '}') + '}\\sqrt{' + NT(pp) + '}',
          (sq.ex && sg.ex && S.exact(d.diff) ? '=' : '\\approx ') + '\\frac{' + D6(d.diff) + '}{' + sg.t + '}\\times ' + sq.t + rTex(sign, d.r2)),
        note: 'Square roots are kept to 6 decimal places inside the step; ' + tx('r_{pb}') + ' itself is rounded from the exact value ' + tx('r_{pb}^2=\\frac{(\\bar Y_0-\\bar Y_1)^2p_0p_1}{\\sigma_x^2}' + eq(d.r2)) + '.' });
      steps.push({ html: '<b>Absolute form</b> (course notes): use the absolute difference of the two group means, so the order of the codes does not matter:', math: '|r_{pb}|=\\frac{|\\bar Y_0-\\bar Y_1|}{\\sigma_x}\\sqrt{p_0p_1}' + rTex(1, d.r2) });
      if (d.sv) {
        const sc = d.n0 * d.n1, den = n * (n - 1), ss = root6(d.sv), sqc = root6(S.frac(sc, den));
        steps.push({ html: '<b>Same number from the sample SD ' + tx('s') + '.</b> L4.9: “some books” use ' + tx('s') + ' with the sample correction ' + tx('\\frac{n_0}{n-1}\\cdot\\frac{n_1}{n}') + ' in place of ' + tx('p_0p_1') + ':',
          math: '\\frac{\\bar Y_0-\\bar Y_1}{s}\\sqrt{\\frac{n_0}{n-1}\\cdot\\frac{n_1}{n}}\\approx\\frac{' + D6(d.diff) + '}{' + ss.t + '}\\sqrt{\\frac{' + d.n0 + '}{' + (n - 1) + '}\\cdot\\frac{' + d.n1 + '}{' + n + '}}\\approx\\frac{' + D6(d.diff) + '}{' + ss.t + '}\\times ' + sqc.t + rTex(sign, d.r2),
          note: 'The same ✓, because ' + tx('s\\sqrt{\\tfrac{n-1}{n}}=\\sigma_x') + '. What you must not do is mix them: ' + tx('\\frac{\\bar Y_0-\\bar Y_1}{s}\\sqrt{p_0p_1}') + rTexMix(d) + ' — a different (wrong) number.' });
      }
      const pSign = d.Sxc.sign();
      steps.push({ html: '<b>Check with Pearson’s ' + tx('r') + '.</b> Treat the codes 0/1 as a second variable and use the Week 4 formula on the ' + n + ' pairs ' + tx('(x_i,\\ \\text{code}_i)') + ':',
        math: 'r=\\frac{\\sum(x_i-\\bar x)(c_i-\\bar c)}{\\sqrt{\\sum(x_i-\\bar x)^2\\sum(c_i-\\bar c)^2}}=\\frac{' + NT(d.Sxc) + '}{\\sqrt{' + P_(NT(d.ss)) + '\\times ' + P_(NT(d.Scc)) + '}}' + rTex(pSign, d.pr2),
        note: 'Here ' + tx('\\bar c=p_1' + eq(d.p1)) + '. Same size as ' + tx('r_{pb}') + (d.diff.isZero() ? '' : ', opposite sign') + ': the course formula subtracts ' + tx('\\bar Y_1') + ' from ' + tx('\\bar Y_0') + ', while Pearson’s ' + tx('r') + ' grows when the group coded 1 has the larger values. Only the size ' + tx('|r_{pb}|') + ' measures the strength.' });
      const b = bandOf(S, d.r2);
      steps.push({ html: '<b>Reading it.</b> ' + tx('|r_{pb}|' + rTex(1, d.r2)) + ': ' + readWord(d) + '. L4.9: “in absolute terms this would lie between 0 and 1”; close to 0 means no association, close to 1 means the groups differ a lot compared with the spread of ' + tx('X') + '.' + (b.k > 0 && b.k < 3 ? ' (In between, the lab uses the L4.7 scale as a rough guide: ' + tx(b.range) + '.)' : '') });
      body.appendChild(S.steps(steps));
    }
    function rTexMix(d) {
      const r2 = d.diff.mul(d.diff).mul(d.p0).mul(d.p1).div(d.sv);
      return tx(rTex(d.diff.sign(), r2));
    }

    draw();
    return () => window.removeEventListener('resize', onResize);
  }

  Lab.lab({
    id: 'lab-s1-scatter', course: 's1', week: 4, order: 2,
    title: 'Scatter, covariance and correlation lab', sub: 'Week 4 · numerical association',
    topics: ['scatterplot', 'covariance (pop & sample)', 'computational form', 'Pearson r', 'fitted line', 'R² = r²', 'direction · form · strength · outliers', 'point-biserial'],
    desc: 'Type paired data or drag points. See the mean lines and signed rectangles, the deviations table, both covariances and the shortcut, s_x and s_y, Pearson’s r, the least-squares line with R² = r², a generated description — and the point-biserial correlation for a numerical and a two-category variable.',
    render: host => scatterLab(host),
  });
})();
