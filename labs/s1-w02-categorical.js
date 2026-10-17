/* Playground lab — Statistics I, Week 2: describing categorical data (lab-s1-categorical).
   The learner types raw values ("A, B, A, O, …") or categories with counts, and may declare the variable
   ordinal with an order they set (up / down buttons or drag). Every panel is recomputed from that data:
   the frequency table (f_i, f_i/n as a fraction and a decimal, percent, pie angle = f_i/n × 360°) with sum
   checks and a rounding note, a bar chart (bars apart), a pie chart (angles from 12 o'clock), a Pareto chart
   (sorted by frequency; ordinal data keep their order), the mode (bimodal / multimodal / none), the
   ordinal median by position, and misleading graphs (truncated baseline, uneven axis, area principle).
   Ground truth: Statistics I revision notes, Week 2 (L2.1–L2.5); W2 Tutorial 1 (playlist genres) and
   W2 Tutorial 2 (course enrolments chart, farewell-food pie).
   Arithmetic is exact (Lab.F fractions); rounding is round-half-up done on exact fractions. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const esc = Lab.esc;
  const KEY = 'lab:s1-categorical';
  const VERSION = 1;
  const MAX_VALUES = 5000, MAX_CATS = 30, SLOTS = 8;
  const tx = s => Lab.tex(s);
  const DEG = '^{\\circ}';

  /* ====================================================================
     Exact numbers and rounding
     ==================================================================== */
  const P10 = k => 10n ** BigInt(k);
  /** Round-half-up of a fraction ≥ 0 to dp places, as a scaled BigInt (1/3 at dp 2 → 33n). */
  function roundScaled(f, dp) {
    const N = BigInt(f.n), D = BigInt(f.d);
    if (N < 0n) return -roundScaled(f.neg(), dp);
    return (2n * N * P10(dp) + D) / (2n * D);
  }
  /** A scaled BigInt as decimal text: (33n, 2) → "0.33". */
  function scaledTxt(q, dp) {
    const neg = q < 0n;
    let s = (neg ? -q : q).toString();
    if (dp > 0) { s = s.padStart(dp + 1, '0'); s = s.slice(0, -dp) + '.' + s.slice(-dp); }
    return (neg ? '-' : '') + s;
  }
  const exactAt = (f, dp) => (BigInt(f.n) * P10(dp)) % BigInt(f.d) === 0n;
  /** Shortest exact decimal of f when it ends within dp places, else null. */
  function decStr(f, dp = 6) {
    if (f.approx) return null;
    for (let k = 0; k <= dp; k++) if (exactAt(f, k)) return scaledTxt(BigInt(f.n) * P10(k) / BigInt(f.d), k);
    return null;
  }
  /** What the table shows for f at dp places: exact text, or rounded text marked ≈. q = the shown value × 10^dp. */
  function shown(f, dp) {
    const e = decStr(f, dp);
    return { txt: e != null ? e : scaledTxt(roundScaled(f, dp), dp), exact: e != null, q: roundScaled(f, dp) };
  }
  const relTex = (s) => (s.exact ? '=' : '\\approx ') + s.txt;
  /** "=0.4" / "\approx 0.3333" for any fraction (4 places when not exact). */
  function eqTex(f) { const d = decStr(f, 6); return d != null ? '=' + d : '\\approx ' + scaledTxt(roundScaled(f, 4), 4); }
  function eqTxt(f) { const d = decStr(f, 6); return d != null ? '= ' + d : '≈ ' + scaledTxt(roundScaled(f, 4), 4); }
  function shortTxt(f) { const d = decStr(f, 6); return d != null ? d : '≈ ' + scaledTxt(roundScaled(f, 4), 4); }
  /** A percent: exact when it ends within 4 places, else ≈ 2 places ("40", "≈ 26.67"). */
  function pctTxt(f) { const d = decStr(f, 4); return d != null ? d : '≈ ' + scaledTxt(roundScaled(f, 2), 2); }
  /** a/b with its reduced form only when it differs, then its decimal: "\frac{24}{7}\approx 3.4286", "\frac{4000}{2800}=\frac{10}{7}\approx 1.4286". */
  function ratioTex(a, b) {
    const r = F(a, b);
    const base = '\\frac{' + a + '}{' + b + '}';
    const red = r.d === 1 ? '=' + r.n : (r.n !== a ? '=' + r.tex() : '');
    return base + red + (r.d === 1 ? '' : eqTex(r));
  }
  /** "\frac{8}{20}=\frac{2}{5}" (the reduced form only when it differs). */
  function fracTex(a, b) {
    const g = Lab.math.gcd(a, b);
    const base = '\\frac{' + a + '}{' + b + '}';
    if (g <= 1 || a === 0) return base + (a === 0 ? '=0' : '');
    return base + '=' + (b / g === 1 ? String(a / g) : '\\frac{' + a / g + '}{' + b / g + '}');
  }
  /** A fraction as TeX: "2", "\frac{10}{7}". */
  const fTex = f => (f.d === 1 ? String(f.n) : f.tex());
  /** A quotient with its decimal: "\frac{10}{7}\approx 1.4286", "4". */
  const qTex = f => (f.d === 1 ? String(f.n) : f.tex() + eqTex(f));
  const plural = (k, one, many) => k + ' ' + (k === 1 ? one : many || one + 's');
  const andList = arr => (arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);

  /* ====================================================================
     Word scales with a natural order (for the "looks ordinal" hint)
     ==================================================================== */
  const ORDERED = [
    ['very poor', 'poor', 'fair', 'average', 'satisfactory', 'good', 'very good', 'excellent', 'outstanding'],
    ['very low', 'low', 'medium', 'moderate', 'high', 'very high'],
    ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree'],
    ['very dissatisfied', 'dissatisfied', 'unsatisfied', 'neutral', 'satisfied', 'very satisfied'],
    ['never', 'rarely', 'seldom', 'sometimes', 'often', 'usually', 'always'],
    ['extra small', 'small', 'medium', 'large', 'extra large'],
    ['xs', 's', 'm', 'l', 'xl', 'xxl'],
    ['primary', 'secondary', 'higher secondary', 'diploma', 'undergraduate', 'graduate', 'postgraduate', 'doctorate'],
    ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'],
    ['mild', 'moderate', 'severe'],
    ['cold', 'cool', 'warm', 'hot'],
    ['bad', 'okay', 'ok', 'good', 'great'],
    ['bronze', 'silver', 'gold', 'platinum'],
  ];
  const low = s => String(s).toLowerCase().replace(/\s+/g, ' ').trim();
  function knownOrder(names) {
    if (names.length < 2) return null;
    for (const list of ORDERED) {
      const pos = v => list.indexOf(low(v));
      if (names.every(v => pos(v) >= 0)) return names.slice().sort((a, b) => pos(a) - pos(b));
    }
    return null;
  }

  /* ====================================================================
     Examples
     ==================================================================== */
  const PRESETS = [
    {
      key: 'letters10', label: 'Ten letters A–D (W2_L1)', mode: 'raw',
      raw: 'A, A, B, C, A, D, A, B, D, C',
      source: 'Lecture W2_L1 (frequency distributions), at 03:21: the first tally example, A 4, B 2, C 2, D 2 out of 10. W2_L2 at 02:27 draws its pie: 0.4 × 360° = 144° for A and 72° each for B, C and D.',
    },
    {
      key: 'letters15', label: 'Fifteen letters (W2_L1)', mode: 'raw',
      raw: 'A, A, B, C, A, D, A, B, D, C, A, B, C, D, A',
      source: 'Lecture W2_L1 (frequency distributions), at 05:28: A 6, B 3, C 3, D 3 out of 15. At 17:23 the professor compares it with the ten-letter example: different counts, the same relative frequencies 0.4, 0.2, 0.2, 0.2.',
    },
    {
      key: 'letters18', label: 'Eighteen letters (W2_L1)', mode: 'raw',
      raw: 'A, A, B, C, A, D, A, B, D, C, A, B, C, D, A, C, D, D',
      source: 'Lecture W2_L1 (frequency distributions), at 07:39: A 6, B 3, C 4, D 5 out of 18 (relative frequencies 6/18, 3/18, 4/18, 5/18 at 21:04).',
    },
    {
      key: 'blood30', label: 'Blood groups of 30 patients (W2_L2)', mode: 'counts',
      rows: [['O+', 5], ['A-', 2], ['O-', 5], ['A+', 6], ['B+', 4], ['B-', 3], ['AB+', 2], ['AB-', 3]],
      source: 'Lecture W2_L2 (charts of categorical data), at 07:00: the hospital data’s pie chart shows O+ 16.7%, A− 6.7%, O− 16.7%, A+ 20%, B+ 13.3%, B− 10%, AB+ 6.7%, AB− 10% of 30 people; these are the counts behind it (at 14:09: 6 people have A+, 2 have A−, 2 have AB+, 4 have B+).',
    },
    {
      key: 'pareto', label: 'Pareto chart: A 6, B 8, C 2, D 1 (W2_L2)', mode: 'counts',
      rows: [['A', 6], ['B', 8], ['C', 2], ['D', 1]],
      source: 'Lecture W2_L2 (charts of categorical data), at 16:55: sorted by frequency the bars run B 8, A 6, C 2, D 1. At 18:48 the same shape stands for students by region (8000, 6000, 2000, 1000).',
    },
    {
      key: 'tshirt', label: 'T-shirt sizes of 20 students (W2_L2, ordinal)', mode: 'counts', ordinal: true, order: ['small', 'medium', 'large'],
      rows: [['small', 7], ['medium', 8], ['large', 5]],
      source: 'Lecture W2_L2 (charts of categorical data), at 20:23: small 7, medium 8, large 5. At 22:09 the professor keeps the order small, medium, large in the chart because the sizes are ordinal.',
    },
    {
      key: 'grades19', label: 'Distribution of grades, 19 students: two modes (W2_L3)', mode: 'counts', order: ['D', 'C', 'B', 'A'],
      rows: [['A', 7], ['B', 3], ['C', 7], ['D', 2]],
      source: 'Lecture W2_L3 (best practices 1), at 12:29: A 7 (36.8%), B 3 (15.8%), C 7 (36.8%), D 2 (10.5%). A and C tie for the highest frequency, so the data are bimodal (W2_L5 at 15:50). Grades are ordinal (W2_L5 at 17:30): switch “ordinal” on to see the median.',
    },
    {
      key: 'grades15', label: 'Grades of 15 students: median B = mode B (W2_L5)', mode: 'counts', ordinal: true, order: ['D', 'C', 'B', 'A'],
      rows: [['A', 4], ['B', 6], ['C', 3], ['D', 2]],
      source: 'Lecture W2_L5 (mode and median), at 19:06–22:00: A 4, B 6, C 3, D 2. With n = 15 the median is the 8th grade in order, B; the mode is also B (at 25:38). The lecture lists A first and the lab lists the lowest grade first — the middle is the same.',
    },
    {
      key: 'grades14', label: 'Grades of 14 students: even n (W2_L5)', mode: 'counts', ordinal: true, order: ['D', 'C', 'B', 'A'],
      rows: [['A', 3], ['B', 6], ['C', 3], ['D', 2]],
      source: 'Lecture W2_L5 (mode and median), at 22:00–23:44: A 3, B 6, C 3, D 2. With n = 14 the 7th and 8th grades are both B, so the median is B.',
    },
    {
      key: 'modemed', label: 'Mode A but median B (W2_L5)', mode: 'counts', ordinal: true, order: ['D', 'C', 'B', 'A'],
      rows: [['A', 6], ['B', 4], ['C', 3], ['D', 2]],
      source: 'Lecture W2_L5 (mode and median), at 26:09–27:18: A 6, B 4, C 3, D 2 out of 15 — the mode is A but the median (the 8th grade in order) is B.',
    },
    {
      key: 'regions', label: 'Students by region: truncated chart (W2_L4)', mode: 'counts',
      rows: [['S', 146], ['W', 97], ['N', 146], ['E', 111]],
      source: 'Lecture W2_L4 (best practices 2), at 03:45–04:49: 500 students by region, S 146, W 97, N 146, E 111 (read off the slide). The slide’s bar chart starts at 75 instead of 0.',
      mis: { mode: 'trunc', base: 75, a: 'S', b: 'W' },
    },
    {
      key: 'songs', label: 'Songs in a playlist by genre (W2 Tutorial 1)', mode: 'counts',
      rows: [['Punjabi', 10], ['Hindustani', 15], ['Folk', 20], ['Film soundtrack', 14], ['Indian rock', 24], ['Indian pop', 7]],
      source: 'W2 Tutorial 1 (problems on charts and tables): the completed frequency table of a playlist, n = 90 songs.',
      mis: { mode: 'honest', base: 0, a: 'Indian rock', b: 'Indian pop' },
    },
    {
      key: 'enrol', label: 'Students enrolled in four courses (W2 Tutorial 2)', mode: 'counts',
      rows: [['Course 1', 4000], ['Course 2', 3000], ['Course 3', 2800], ['Course 4', 3500]],
      source: 'W2 Tutorial 2 (misleading graphs): the actual enrolments 4000, 3000, 2800 and 3500. The published bar chart started near 2400 instead of 0. The tutorial does not name the courses.',
      mis: { mode: 'trunc', base: 2400, a: 'Course 1', b: 'Course 3' },
    },
    {
      key: 'lmh', label: 'Satisfaction low / medium / high: two middle values (made up)', mode: 'raw', ordinal: true, order: ['low', 'medium', 'high'],
      raw: 'high, low, medium, high, low, high, medium, high, low, high',
      source: 'made up for this lab: n = 10 is even and the two middle positions (5 and 6) fall in different categories, so the median could be either of them (W2_L5 at 23:44).',
    },
    {
      key: 'thirds', label: 'Three equal groups: rounding (made up)', mode: 'counts',
      rows: [['Tea', 7], ['Coffee', 7], ['Juice', 7]],
      source: 'made up for this lab: each relative frequency is 7/21 = 1/3, which no decimal shows exactly — watch the rounded sums (W2_L5 at 00:14: round-off errors).',
    },
    {
      key: 'langs', label: 'Languages at home: 11 categories (made up)', mode: 'counts',
      rows: [['Hindi', 14], ['Tamil', 9], ['Telugu', 7], ['Bengali', 6], ['Marathi', 5], ['Kannada', 3], ['Malayalam', 2], ['Gujarati', 2], ['Punjabi', 1], ['Odia', 1], ['Urdu', 1]],
      source: 'made up for this lab: 11 categories, several tiny. W2_L3 at 15:44 shows such a cluttered chart and clubs the small categories into “Other” instead of dropping them.',
    },
    {
      key: 'cities', label: 'Home cities: every value once, no mode (made up)', mode: 'raw',
      raw: 'Chennai, Delhi, Mumbai, Kolkata, Pune',
      source: 'made up for this lab: no value repeats, so there is no mode (course notes).',
    },
  ];
  const PIE_DEFAULT = '29, 28, 15, 24';
  const PIE_SOURCE = 'W2 Tutorial 2: a farewell-party food survey pie labelled chilli potatoes 29%, spring rolls 28%, cheese corn balls 15%, nachos 24%.';

  function stateFrom(p) {
    const st = {
      v: VERSION, preset: p.key, mode: p.mode, edited: false,
      raw: p.raw || (p.rows ? p.rows.flatMap(([c, f]) => Array(f).fill(c)).slice(0, MAX_VALUES).join(', ') : ''),
      rows: p.rows ? p.rows.map(([c, f]) => ({ c, f: String(f) })) : [],
      ordinal: !!p.ordinal, order: p.order ? p.order.slice() : [],
      measure: 'f', dp: 3, cum: false, pie: PIE_DEFAULT,
      mis: Object.assign({ mode: 'honest', base: 0, a: '', b: '', picto: false, brk: false }, p.mis || {}),
    };
    if (p.mode === 'raw' && !p.rows) st.rows = countsOf(splitRaw(st.raw)).map(e => ({ c: e.name, f: String(e.f) }));
    return st;
  }
  /** Values typed by the learner: commas, semicolons or new lines separate them; with none of those, spaces do. */
  function splitRaw(text) {
    const s = String(text);
    const parts = /[,;\n]/.test(s) ? s.split(/[,;\n]+/) : s.split(/\s+/);
    return parts.map(t => t.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  function countsOf(toks) {
    const m = new Map();
    toks.forEach(t => m.set(t, (m.get(t) || 0) + 1));
    return [...m].map(([name, f]) => ({ name, f }));
  }

  /* ====================================================================
     Charts (drawn at the real width of their box)
     ==================================================================== */
  function niceStep(span, count) {
    const raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    return [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= count) || 10 * mag;
  }
  function niceTicks(lo, hi, count = 5) {
    if (!(hi > lo)) hi = lo + 1;
    const step = niceStep(hi - lo, count);
    const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
    const ticks = [];
    for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo: a, hi: b, ticks };
  }
  const tickTxt = (v, pct) => Lab.fmtDec(v, 4) + (pct ? '%' : '');
  const short = (s, k = 14) => (s.length > k ? s.slice(0, k - 1) + '…' : s);
  const colorOf = slot => (slot >= 0 ? 'var(--s1-c' + (slot + 1) + ')' : 'var(--s1-other)');
  function barPath(x, w, y0, y1) {
    const hgt = y0 - y1, r = Math.min(4, w / 2, Math.max(0, hgt));
    if (hgt < 0.5) return 'M' + x + ',' + y0 + 'h' + w;
    return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
  }
  /** Horizontal labels when the longest fits its band (no cutting); otherwise turned 40° and cut to 14 characters. */
  function xLabelPlan(labels, band) {
    const longest = Math.max(1, ...labels.map(s => s.length));
    const turn = longest * 6.6 > band - 6;
    return { turn, cut: turn ? 14 : 99, mb: turn ? Math.round(26 + Math.min(14, longest) * 4.6) : 30 };
  }
  /**
   * Vertical bars. items: [{label, v, slot, txt, title}]; axis: {ticks:[v], at(v) → 0…1 of the plot height, fmt(v)}.
   * opts: line (cumulative points 0…1 per item), ph (plot height), aria.
   */
  function barSvg(W, items, axis, opts = {}) {
    const ml = 54, mr = 12, mt = 24, PH = opts.ph || 200;
    const band = (W - ml - mr) / Math.max(1, items.length);
    const plan = xLabelPlan(items.map(it => it.label), band);
    const H = mt + PH + plan.mb;
    const Y = u => mt + (1 - u) * PH;
    const X = i => ml + band * (i + 0.5);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 's1c-svg', role: 'img', 'aria-label': opts.aria || 'bar chart' });
    axis.ticks.forEach(v => {
      s.appendChild(svg('line', { x1: ml, x2: W - mr, y1: Y(axis.at(v)), y2: Y(axis.at(v)), class: axis.at(v) === 0 ? 's1c-base' : 's1c-grid' }));
      s.appendChild(svg('text', { x: ml - 7, y: Y(axis.at(v)) + 4, 'text-anchor': 'end', class: 's1c-tick' }, axis.fmt(v)));
    });
    if (opts.brk) {
      // y-axis with a zigzag near the bottom: "this axis does not start at 0" (W2_L4 at 06:57)
      const x0 = ml - 3, y0 = Y(0);
      s.appendChild(svg('line', { x1: x0, x2: x0, y1: mt, y2: y0, class: 's1c-yaxis' }));
      s.appendChild(svg('rect', { x: x0 - 6, y: y0 - 26, width: 12, height: 16, class: 's1c-brkbg' }));
      s.appendChild(svg('path', { d: 'M' + x0 + ',' + (y0 - 10) + 'l-5,-3l10,-5l-10,-5l5,-3', class: 's1c-brk' }));
    }
    const bw = Math.max(6, Math.min(24, band * 0.6));
    items.forEach((it, i) => {
      const g = svg('g', { class: 's1c-mark' });
      g.appendChild(svg('title', {}, it.title || it.label + ': ' + it.txt));
      g.appendChild(svg('rect', { x: X(i) - band / 2, y: mt, width: band, height: PH, class: 's1c-hit' }));
      const u = Math.max(0, Math.min(1, axis.at(it.v)));
      g.appendChild(svg('path', { d: barPath(X(i) - bw / 2, bw, Y(0), Y(u)), class: 's1c-bar', style: 'fill:' + colorOf(it.slot) }));
      if (band >= 24 && it.txt != null) g.appendChild(svg('text', { x: X(i), y: Y(u) - 6, 'text-anchor': 'middle', class: 's1c-val' + (band < 40 ? ' tiny' : '') }, it.txt));
      s.appendChild(g);
    });
    if (opts.line) {
      s.appendChild(svg('path', { d: opts.line.map((u, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(u).toFixed(1)).join(' '), class: 's1c-cum' }));
      opts.line.forEach((u, i) => {
        const c = svg('circle', { cx: X(i), cy: Y(u), r: 4, class: 's1c-cumpt' });
        c.appendChild(svg('title', {}, 'cumulative: ' + opts.lineTxt[i]));
        s.appendChild(c);
      });
    }
    items.forEach((it, i) => {
      const y0 = mt + PH;
      s.appendChild(svg('text', plan.turn
        ? { x: X(i), y: y0 + 12, 'text-anchor': 'end', transform: 'rotate(-40 ' + X(i) + ' ' + (y0 + 12) + ')', class: 's1c-tick s1c-xl' }
        : { x: X(i), y: y0 + 18, 'text-anchor': 'middle', class: 's1c-tick s1c-xl' }, short(it.label, plan.cut)));
    });
    return s;
  }
  /** Pie: slices [{label, frac (Frac), slot, title, angTxt}] clockwise from 12 o'clock. */
  function pieSvg(W, slices) {
    const R = Math.max(70, Math.min(128, (W - 120) / 2)), cx = W / 2, cy = R + 26, H = 2 * R + 52;
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 's1c-svg', role: 'img', 'aria-label': 'pie chart' });
    const pt = (a, r) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
    let a0 = 0;
    slices.forEach(sl => {
      const fr = Number(sl.frac);
      if (fr <= 0) return;
      const a1 = a0 + fr * 2 * Math.PI;
      const g = svg('g', { class: 's1c-mark' });
      g.appendChild(svg('title', {}, sl.title));
      if (fr >= 1 - 1e-12) g.appendChild(svg('circle', { cx, cy, r: R, class: 's1c-slice', style: 'fill:' + colorOf(sl.slot) }));
      else {
        const [x0, y0] = pt(a0, R), [x1, y1] = pt(a1, R);
        g.appendChild(svg('path', { d: 'M' + cx + ',' + cy + 'L' + x0.toFixed(2) + ',' + y0.toFixed(2) + 'A' + R + ',' + R + ' 0 ' + (a1 - a0 > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(2) + ',' + y1.toFixed(2) + 'Z', class: 's1c-slice', style: 'fill:' + colorOf(sl.slot) }));
      }
      if (fr * 360 >= 14) {
        const mid = (a0 + a1) / 2, [lx, ly] = pt(mid, R + 16);
        g.appendChild(svg('text', { x: lx, y: ly + 4, 'text-anchor': Math.sin(mid) > 0.2 ? 'start' : Math.sin(mid) < -0.2 ? 'end' : 'middle', class: 's1c-plab' }, sl.angTxt));
      }
      s.appendChild(g);
      a0 = a1;
    });
    return s;
  }
  function fit(host, draw) { host.classList.add('s1c-fit'); host._draw = draw; paintFit(host); }
  function paintFit(host) {
    const w = host.clientWidth; // layout px: stays right when the page is zoomed with CSS zoom
    const W = Math.round(Math.max(280, Math.min(1100, w || 640)));
    Lab.clear(host);
    host.appendChild(host._draw(W));
  }

  /* ====================================================================
     The lab
     ==================================================================== */
  function catLab(host) {
    if (host.s1cOff) host.s1cOff();
    let st = Lab.store.get(KEY, null);
    if (!st || st.v !== VERSION || !Array.isArray(st.rows)) st = stateFrom(PRESETS[0]);
    const save = () => Lab.store.set(KEY, st);
    const ctl = {}, P = {};
    let D = null;
    const { side, main } = K.layout(host, 's1w2');
    host.classList.add('s1c-lab');
    const onResize = Lab.debounce(() => {
      if (!host.isConnected) { window.removeEventListener('resize', onResize); return; }
      Lab.$$('.s1c-fit', host).forEach(paintFit);
    }, 180);
    window.addEventListener('resize', onResize);
    host.s1cOff = () => window.removeEventListener('resize', onResize);
    if (Lab.onCleanup) Lab.onCleanup(host.s1cOff);

    /* ---------------- controls column */
    side.appendChild(K.group('1 · Your data'));
    ctl.presets = K.presets({ label: 'Examples', items: PRESETS, onPick: it => { st = stateFrom(it); save(); rebuild(); } });
    side.appendChild(ctl.presets);
    ctl.mode = Lab.seg([{ label: 'Raw values', value: 'raw' }, { label: 'Categories with counts', value: 'counts' }], st.mode, v => switchMode(v));
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Type the data as' }), ctl.mode));
    P.editor = h('div', { class: 's1c-editor' });
    P.msg = h('div', { class: 'pl-hint s1c-msg' });
    side.append(P.editor, P.msg);
    side.appendChild(K.group('2 · Nominal or ordinal'));
    ctl.ord = K.toggle({ label: 'The categories have a natural order (ordinal)', value: st.ordinal, onChange: v => { st.ordinal = v; if (v) initOrder(); save(); recompute(); } });
    P.orderBox = h('div', { class: 's1c-orderbox' });
    side.append(ctl.ord, P.orderBox);
    side.appendChild(K.group('3 · Rounding'));
    ctl.dp = Lab.seg([2, 3, 4].map(d => ({ label: d + ' places', value: d })), st.dp, v => { st.dp = v; save(); drawAll(); });
    ctl.dp.classList.add('s1c-seg3');
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Round decimals to' }), ctl.dp));
    side.appendChild(K.note('Percents keep two places fewer (0.333 → 33.3%). Exact values such as 0.4 are never rounded.'));
    side.appendChild(K.group('4 · Go to'));
    const nav = h('div', { class: 'pl-chips s1c-nav' });
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(KEY, null); catLab(host); }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = h('div', { class: 'pl-answer' });
    P.table = K.panel('Frequency table', 'A frequency distribution lists each category with its count ' + tx('f_i') + '. Relative frequency ' + tx('=\\frac{f_i}{n}') + '; slice angle ' + tx('=\\frac{f_i}{n}\\times 360' + DEG) + ' (course notes, Week 2; W2_L1 at 15:42).');
    P.bar = K.panel('Bar chart', 'Categories on one axis; frequency, relative frequency or percent on the other. Bars of equal width that do not touch: each category is a separate group (course notes; W2_L2 at 10:13). Label every bar (W2_L3 at 11:57).');
    P.pie = K.panel('Pie chart', 'Parts of a whole: each slice’s angle is its relative frequency × 360° (W2_L2 at 02:27). Slices start at 12 o’clock and go clockwise in table order.');
    P.pareto = K.panel('Pareto chart', 'A bar chart sorted by frequency, biggest first (W2_L2 at 17:32) — used in quality control to rank problems. Ordinal data keep their natural order instead (course notes; W2_L2 at 22:09).');
    P.mode = K.panel('Mode', 'The most frequent category: the longest bar, the widest slice, the first bar of a Pareto chart (W2_L5 at 10:42–13:46). A tie for first is bimodal / multimodal (W2_L5 at 15:50); if no value repeats there is no mode (course notes).');
    P.median = K.panel('Median (ordinal data only)', 'The category in the middle of the sorted list. Odd ' + tx('n') + ': position ' + tx('\\frac{n+1}{2}') + '. Even ' + tx('n') + ': the two middle positions ' + tx('\\frac n2') + ' and ' + tx('\\frac n2+1') + ', and the median could be either of those two values (W2_L5 at 18:32). Nominal data have a mode but no median (course notes; W2_L5 at 16:53).');
    P.mis = K.panel('Misleading graphs', 'Area principle: the area occupied by a part of the graph should match the amount of data it represents (W2_L4 at 00:14). A bar chart whose baseline is not 0 (W2_L4 at 03:09), or an axis with uneven steps, breaks it.');
    main.append(P.answer, P.table, P.bar, P.pie, P.pareto, P.mode, P.median, P.mis);
    [['Table', P.table], ['Bar', P.bar], ['Pie', P.pie], ['Pareto', P.pareto], ['Mode', P.mode], ['Median', P.median], ['Misleading', P.mis]]
      .forEach(([t, p]) => nav.appendChild(Lab.button(t, () => p.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn xs')));

    /* panel-local controls */
    ctl.measure = Lab.seg([{ label: 'Frequency ' + tx('f_i'), value: 'f' }, { label: 'Relative ' + tx('\\frac{f_i}{n}'), value: 'rel' }, { label: 'Percent', value: 'pct' }], st.measure, v => { st.measure = v; save(); drawBar(); });
    P.barOut = h('div', { class: 's1c-out' });
    P.bar.body.append(h('div', { class: 's1c-ctl' }, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Bar height shows' }), ctl.measure)), P.barOut);
    ctl.cum = K.toggle({ label: 'Add the cumulative-percent line (bars then show percent, so one axis serves both)', value: st.cum, onChange: v => { st.cum = v; save(); drawPareto(); } });
    P.parOut = h('div', { class: 's1c-out' });
    P.pareto.body.append(h('div', { class: 's1c-ctl' }, ctl.cum), P.parOut);
    P.pieOut = h('div', { class: 's1c-out' });
    P.pie.body.appendChild(P.pieOut);
    P.tableOut = h('div', { class: 's1c-out' });
    P.table.body.appendChild(P.tableOut);
    buildMis();

    /* ---------------- data entry */
    const soon = Lab.debounce(() => { st.edited = true; save(); recompute(); }, 200);
    function buildEditor() {
      Lab.clear(P.editor);
      if (st.mode === 'raw') {
        const ta = h('textarea', { class: 'field mono pl-area s1c-raw', rows: 5, spellcheck: 'false', 'aria-label': 'raw values' });
        ta.value = st.raw;
        ta.addEventListener('input', () => { st.raw = ta.value; soon(); });
        P.editor.append(h('label', { class: 'pl-label', text: 'One value per case, separated by commas (or new lines)' }), ta);
        return;
      }
      const list = h('div', { class: 's1c-rows' });
      list.appendChild(h('div', { class: 's1c-rhead' }, h('span', { text: 'Category' }), h('span', { html: 'Count ' + tx('f_i') }), h('span')));
      st.rows.forEach((r, i) => {
        const c = h('input', { class: 'field s1c-in', value: r.c, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'category ' + (i + 1) });
        const f = h('input', { class: 'field mono s1c-in s1c-f', value: r.f, inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'count of category ' + (i + 1) });
        const del = h('button', { class: 'icon-btn s1c-del', type: 'button', html: Lab.icon('x'), title: 'Remove this category', 'aria-label': 'remove category ' + (i + 1) });
        c.addEventListener('input', () => { r.c = c.value; soon(); });
        f.addEventListener('input', () => { r.f = f.value; soon(); });
        del.addEventListener('click', () => { if (st.rows.length <= 1) return; st.rows.splice(i, 1); st.edited = true; save(); buildEditor(); recompute(); });
        list.appendChild(h('div', { class: 's1c-row' }, c, f, del));
      });
      const add = Lab.button('+ category', () => {
        if (st.rows.length >= MAX_CATS) return;
        let k = st.rows.length + 1, name = 'Category ' + k;
        while (st.rows.some(r => r.c.trim() === name)) name = 'Category ' + ++k;
        st.rows.push({ c: name, f: '1' }); st.edited = true; save(); buildEditor(); recompute();
        const ins = Lab.$$('.s1c-row .s1c-in:not(.s1c-f)', P.editor); if (ins.length) ins[ins.length - 1].select();
      }, 'btn xs');
      P.editor.append(list, h('div', { class: 'pl-chips' }, add));
    }
    function switchMode(v) {
      if (v === st.mode) return;
      if (D && !D.error) {
        if (v === 'counts') st.rows = D.entries.map(e => ({ c: e.name, f: String(e.f) }));
        else {
          const tot = D.n;
          st.raw = tot <= MAX_VALUES ? D.cats.flatMap(c => Array(c.f).fill(c.name)).join(', ') : st.raw;
        }
      }
      st.mode = v; save(); buildEditor(); recompute();
    }

    /* ---------------- ordinal order */
    function initOrder() {
      const names = D && !D.error ? D.entries.map(e => e.name) : [];
      const known = knownOrder(names);
      const kept = st.order.filter(nm => names.includes(nm));
      st.order = kept.length === names.length ? kept : known || names;
    }
    function buildOrder(entries) {
      const box = P.orderBox;
      Lab.clear(box);
      const names = entries.map(e => e.name);
      const known = knownOrder(names);
      if (!st.ordinal) {
        if (known) box.appendChild(K.note('These categories look ordered: <b>' + known.map(esc).join(' &lt; ') + '</b>. If they are, switch “ordinal” on to get a median.', 'pl-hint s1c-hintbox'));
        else box.appendChild(K.note('Off: the categories are treated as <b>nominal</b> — labels with no order (course notes).', 'pl-hint'));
        return;
      }
      box.appendChild(K.note('Your order, lowest first. Use the arrows or drag a row.', 'pl-hint'));
      const list = h('ol', { class: 's1c-order' });
      let dragFrom = -1;
      st.order.forEach((nm, i) => {
        const up = h('button', { type: 'button', class: 'icon-btn s1c-mv', title: 'Move up (lower)', 'aria-label': 'move ' + nm + ' up', html: '↑' });
        const dn = h('button', { type: 'button', class: 'icon-btn s1c-mv', title: 'Move down (higher)', 'aria-label': 'move ' + nm + ' down', html: '↓' });
        up.disabled = i === 0; dn.disabled = i === st.order.length - 1;
        up.addEventListener('click', () => move(i, i - 1));
        dn.addEventListener('click', () => move(i, i + 1));
        const li = h('li', { class: 's1c-oi', draggable: 'true' }, h('span', { class: 's1c-grip', text: '⋮⋮' }), h('span', { class: 's1c-on', text: (i + 1) + '. ' + nm }), up, dn);
        li.addEventListener('dragstart', e => { dragFrom = i; li.classList.add('drag'); try { e.dataTransfer.setData('text/plain', String(i)); e.dataTransfer.effectAllowed = 'move'; } catch (err) { /* old browsers */ } });
        li.addEventListener('dragend', () => li.classList.remove('drag'));
        li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('over'); });
        li.addEventListener('dragleave', () => li.classList.remove('over'));
        li.addEventListener('drop', e => { e.preventDefault(); li.classList.remove('over'); if (dragFrom >= 0 && dragFrom !== i) move(dragFrom, i); dragFrom = -1; });
        list.appendChild(li);
      });
      box.appendChild(list);
      if (known && known.join('\u0001') !== st.order.join('\u0001')) box.appendChild(h('div', { class: 'pl-chips' }, Lab.button('Use the usual order: ' + known.join(' < '), () => { st.order = known.slice(); save(); recompute(); }, 'btn xs')));
    }
    function move(from, to) {
      if (to < 0 || to >= st.order.length) return;
      const [x] = st.order.splice(from, 1);
      st.order.splice(to, 0, x);
      save(); recompute();
    }

    /* ---------------- compute everything from the data */
    function compute() {
      const R = { warnings: [] };
      let entries;
      if (st.mode === 'raw') {
        const toks = splitRaw(st.raw);
        if (!toks.length) return { error: 'Type at least one value.' };
        if (toks.length > MAX_VALUES) return { error: 'You typed ' + toks.length + ' values; this lab handles up to ' + MAX_VALUES + '.' };
        entries = countsOf(toks);
        if (entries.length > MAX_CATS) return { error: 'You typed ' + entries.length + ' different categories; this lab handles up to ' + MAX_CATS + '.' };
        R.values = toks;
      } else {
        const ins = Lab.$$('.s1c-row', P.editor);
        let bad = false;
        entries = st.rows.map((r, i) => {
          const name = String(r.c).replace(/\s+/g, ' ').trim(), fs = String(r.f).trim();
          const okN = name !== '', okF = /^\d+$/.test(fs) && Number(fs) <= 1e7;
          const el = ins[i];
          if (el) { el.children[0].classList.toggle('bad', !okN); el.children[1].classList.toggle('bad', !okF); }
          if (!okN || !okF) bad = true;
          return { name, f: okF ? Number(fs) : 0 };
        });
        if (bad) return { error: 'Fix the red boxes: every category needs a name, and every count is a whole number 0, 1, 2, …' };
        const seen = new Set(), dup = entries.find(e => (seen.has(e.name) ? true : (seen.add(e.name), false)));
        if (dup) return { error: '“' + esc(dup.name) + '” appears twice — give each category one row.' };
        if (!entries.some(e => e.f > 0)) return { error: 'All counts are 0 — at least one category needs a count of 1 or more.' };
      }
      const names = entries.map(e => e.name);
      const lowSeen = new Map();
      names.forEach(nm => { const k = low(nm); if (lowSeen.has(k) && lowSeen.get(k) !== nm) R.warnings.push('“' + esc(lowSeen.get(k)) + '” and “' + esc(nm) + '” are counted as two different categories (capital letters or spaces differ).'); else lowSeen.set(k, nm); });
      // order for every table and chart: ordinal → the learner's order; nominal → the order typed
      if (st.ordinal) {
        const kept = st.order.filter(nm => names.includes(nm));
        st.order = kept.concat(names.filter(nm => !kept.includes(nm)));
      }
      const disp = st.ordinal ? st.order.map(nm => entries.find(e => e.name === nm)) : entries;
      const n = entries.reduce((a, e) => a + e.f, 0);
      // colours follow the category (its place in your input), never its rank; past 8 categories the 7 largest keep a colour
      const slot = new Map();
      if (entries.length <= SLOTS) entries.forEach((e, i) => slot.set(e.name, i));
      else entries.map((e, i) => ({ e, i })).sort((a, b) => b.e.f - a.e.f || a.i - b.i).slice(0, SLOTS - 1).sort((a, b) => a.i - b.i).forEach((x, k) => slot.set(x.e.name, k));
      const cats = disp.map((e, i) => {
        const rel = F(e.f, n);
        return { name: e.name, f: e.f, idx: i, inIdx: entries.indexOf(e), slot: slot.has(e.name) ? slot.get(e.name) : -1, rel, pct: rel.mul(100), ang: rel.mul(360) };
      });
      return Object.assign(R, { entries, cats, n, k: cats.length, ordinal: st.ordinal });
    }
    function recompute() {
      const R = compute();
      if (R.error) {
        Lab.setHTML(P.msg, '<span class="cbad">' + R.error + ' The pictures keep your last good data.</span>');
        if (D) buildOrder(D.entries);
        return;
      }
      D = R;
      Lab.setHTML(P.msg, (st.mode === 'raw' ? tx('n=' + D.n) + ' values in ' + tx('k=' + D.k) + ' categor' + (D.k === 1 ? 'y' : 'ies') + '.' : tx('k=' + D.k) + ' categor' + (D.k === 1 ? 'y' : 'ies') + ', ' + tx('n=\\sum f_i=' + D.n) + '.') + (D.warnings.length ? '<br><span class="s1c-warn">' + D.warnings.join('<br>') + '</span>' : ''));
      buildOrder(D.entries);
      drawAll();
    }
    function rebuild() {
      ctl.mode.set(st.mode);
      ctl.ord.querySelector('input').checked = st.ordinal;
      ctl.dp.set(st.dp);
      ctl.measure.set(st.measure);
      ctl.cum.querySelector('input').checked = st.cum;
      buildEditor();
      recompute();
      syncMisControls();
      showSource();
    }
    function showSource() {
      const i = PRESETS.findIndex(p => p.key === st.preset);
      if (i < 0) return;
      ctl.presets.select.value = String(i);
      Lab.setHTML(ctl.presets.lastChild, 'From: ' + PRESETS[i].source + (st.edited ? ' <b>You have edited the data since.</b>' : ''));
    }
    function drawAll() {
      if (!D) return;
      save();
      drawAnswer(); drawTable(); drawBar(); drawPie(); drawPareto(); drawMode(); drawMedian(); drawMis(); showSource(); expose();
    }

    /* ---------------- mode and median (shared by several panels) */
    function modeInfo() {
      const live = D.cats.filter(c => c.f > 0);
      const top = Math.max(...live.map(c => c.f));
      const modes = live.filter(c => c.f === top);
      const none = live.every(c => c.f === 1) && D.n > 1;
      const single = D.n === 1;
      return { live, top, modes, none: none || single, allTie: modes.length === live.length && live.length > 1 };
    }
    function medianInfo(cats) {
      const n = D.n;
      let cum = 0;
      const spans = cats.map(c => { const from = cum + 1; cum += c.f; return { c, from, to: cum }; });
      const at = p => spans.find(sp => sp.f !== 0 && p >= sp.from && p <= sp.to).c;
      const odd = n % 2 === 1;
      const pos = odd ? [(n + 1) / 2] : [n / 2, n / 2 + 1];
      const hit = pos.map(at);
      return { spans, odd, pos, hit, same: hit[0] === hit[hit.length - 1] };
    }
    const nameB = c => '<b>' + esc(c.name) + '</b>';

    /* ---------------- answer box */
    function drawAnswer() {
      const box = P.answer;
      Lab.clear(box);
      const M = modeInfo();
      const kinds = D.ordinal ? 'an <b>ordinal</b> variable (' + D.cats.map(c => esc(c.name)).join(' &lt; ') + ')' : 'a <b>nominal</b> variable (no order)';
      box.appendChild(K.note('Your data: ' + tx('n=' + D.n) + ' values in ' + tx('k=' + D.k) + ' categor' + (D.k === 1 ? 'y' : 'ies') + ', treated as ' + kinds + '.', 'pl-ans-ev'));
      const big = h('div', { class: 's1c-ansbig' });
      const modeHtml = M.none ? 'Mode: <b>none</b>' : (M.modes.length === 1 ? 'Mode: ' + nameB(M.modes[0]) : (M.modes.length === 2 ? 'Modes (bimodal): ' : 'Modes (multimodal): ') + andList(M.modes.map(nameB)));
      let medHtml;
      if (!D.ordinal) medHtml = 'Median: <b>none</b> <span class="s1c-why">(nominal)</span>';
      else { const md = medianInfo(D.cats); medHtml = md.same ? 'Median: ' + nameB(md.hit[0]) : 'Median: ' + nameB(md.hit[0]) + ' or ' + nameB(md.hit[1]); }
      Lab.setHTML(big, '<span>' + modeHtml + '</span><span>' + medHtml + '</span>');
      box.appendChild(big);
      let sub;
      if (M.none) sub = D.n === 1 ? 'With one value nothing repeats, so there is no mode.' : 'Every category appears exactly once (' + tx('f_i=1') + ' for all ' + D.live + '), so no value repeats: no mode (course notes).';
      else if (M.modes.length === 1) { const c = M.modes[0]; sub = esc(c.name) + ' is the most frequent category: ' + tx('f=' + c.f) + ' of ' + tx('n=' + D.n) + ', relative frequency ' + tx(fracTex(c.f, D.n) + eqTex(c.rel)) + ' (' + pctTxt(c.pct) + '%).'; }
      else sub = andList(M.modes.map(c => esc(c.name))) + ' tie for the highest frequency, ' + tx('f=' + M.top) + ' each (' + tx(fracTex(M.top, D.n)) + ' of the values each).';
      sub += D.ordinal ? ' The median comes from the sorted list — see the median panel.' : ' Nominal categories have no order, so there is no median (course notes).';
      box.appendChild(K.note(sub.replace(' for all ' + D.live, ' for all ' + M.live.length + ' categories'), 'pl-ans-sub'));
    }

    /* ---------------- frequency table with sum checks */
    function drawTable() {
      const out = P.tableOut;
      Lab.clear(out);
      const dp = st.dp, pdp = dp - 2, n = D.n;
      const t = h('table', { class: 'tbl s1c-ftab' });
      t.appendChild(h('thead', {}, h('tr', {},
        h('th', { class: 'l', text: 'Category' }),
        h('th', { html: 'Frequency ' + tx('f_i') }),
        h('th', { html: 'Relative frequency ' + tx('\\frac{f_i}{n}') }),
        h('th', { html: 'Decimal (' + dp + ' places)' }),
        h('th', { html: 'Percent ' + tx('\\frac{f_i}{n}\\times 100\\%') }),
        h('th', { html: 'Pie angle ' + tx('\\frac{f_i}{n}\\times 360' + DEG) }))));
      const tb = h('tbody');
      const decs = [], pcts = [], angs = [];
      D.cats.forEach(c => {
        const sd = shown(c.rel, dp), sp = shown(c.pct, Math.max(0, pdp)), sa = shown(c.ang, 2);
        decs.push(sd); pcts.push(sp); angs.push(sa);
        const relRed = c.rel.d === 1 ? String(c.rel.n) : '\\frac{' + c.rel.n + '}{' + c.rel.d + '}';
        tb.appendChild(h('tr', {},
          h('td', { class: 'l', html: '<span class="s1c-sw" style="background:' + colorOf(c.slot) + '"></span>' + esc(c.name) }),
          h('td', { text: String(c.f) }),
          h('td', { html: tx(fracTex(c.f, n)) }),
          h('td', { html: tx(relTex(sd)) }),
          h('td', { html: tx(relTex(sp) + '\\%') }),
          h('td', { html: tx(relRed + '\\times 360' + DEG + (sa.exact ? '=' + sa.txt + DEG : '\\approx ' + sa.txt + DEG)) })));
      });
      const sumQ = arr => arr.reduce((a, s) => a + s.q, 0n);
      const sDec = sumQ(decs), sPct = sumQ(pcts), sAng = sumQ(angs);
      const decTot = scaledTxt(sDec, dp), pctTot = scaledTxt(sPct, Math.max(0, pdp)), angTot = scaledTxt(sAng, 2);
      const okDec = sDec === P10(dp), okPct = sPct === 100n * P10(Math.max(0, pdp)), okAng = sAng === 360n * P10(2);
      const tf = h('tfoot', {}, h('tr', {},
        h('td', { class: 'l', text: 'Total' }),
        h('td', { html: tx('n=' + n) }),
        h('td', { html: tx('\\frac{' + n + '}{' + n + '}=1') }),
        h('td', { html: tx(decTot) + (okDec ? '' : ' <span class="s1c-flag">≠ 1</span>') }),
        h('td', { html: tx(pctTot + '\\%') + (okPct ? '' : ' <span class="s1c-flag">≠ 100%</span>') }),
        h('td', { html: tx(angTot.replace(/\.00$/, '') + DEG) + (okAng ? '' : ' <span class="s1c-flag">≠ 360°</span>') })));
      t.append(tb, tf);
      out.appendChild(h('div', { class: 'tbl-wrap s1c-tw' }, t));
      const fs = D.cats.map(c => c.f);
      const plus = arr => arr.join('+');
      // every term is written out; inline maths wraps at the + signs, so long sums fit a phone
      const line = tex => '<div class="s1c-sumline">' + tx(tex) + '</div>';
      const steps = [
        { html: 'Frequencies: every value is counted once, so they add up to ' + tx('n') + ':' + line('\\sum f_i=' + plus(fs) + '=' + n + '=n') },
        { html: 'Relative frequencies, as exact fractions, always add to 1:' + line('\\sum \\frac{f_i}{n}=\\frac{\\sum f_i}{n}=\\frac{' + n + '}{' + n + '}=1') },
      ];
      const decLine = decs.map(s => s.txt).join('+') + '=' + decTot;
      if (decs.every(s => s.exact)) steps.push({ html: 'Every decimal here is exact, so the decimals add to exactly 1:' + line(decLine) });
      else steps.push({ html: 'The decimals were rounded to ' + dp + ' places (half up). Added up they give' + line(decLine), note: okDec ? 'Here the rounding errors happen to cancel, so the sum is still 1.' : 'Not 1: each rounded decimal is off by a little, and the errors add up. The exact fractions still add to exactly 1 — round-off is why a pie’s labels can miss 100% (course notes).' });
      const pctLine = pcts.map(s => s.txt).join('+') + '=' + pctTot + '\\%';
      steps.push({ html: 'Percents (' + Math.max(0, pdp) + ' decimal place' + (pdp === 1 ? '' : 's') + '):' + line(pctLine), note: okPct ? null : 'Not 100% — again only because of rounding.' });
      const angLine = angs.map(s => s.txt.replace(/\.00$/, '')).join('+') + '=' + angTot.replace(/\.00$/, '') + DEG;
      steps.push({ html: 'Slice angles: ' + tx('\\sum \\frac{f_i}{n}\\times 360' + DEG + '=1\\times 360' + DEG + '=360' + DEG) + ', a full turn. As shown in the table:' + line(angLine), note: okAng ? null : 'The angles shown were rounded to 2 places; the exact angles add to exactly 360°.' });
      out.appendChild(K.steps(steps));
      out.appendChild(K.note('Same relative frequencies can come from a different ' + tx('n') + ' (course notes): W2_L1 at 17:23 compares 4, 2, 2, 2 out of 10 with 6, 3, 3, 3 out of 15 — both give 0.4, 0.2, 0.2, 0.2. That is why relative frequencies are used to compare data sets of different sizes.', 'small muted'));
      P.sums = { dec: decTot, pct: pctTot, ang: angTot, okDec, okPct, okAng };
    }

    /* ---------------- bar chart */
    function drawBar() {
      const out = P.barOut;
      Lab.clear(out);
      const n = D.n, m = st.measure, dp = st.dp;
      const val = c => (m === 'f' ? c.f : m === 'rel' ? Number(c.rel) : Number(c.pct));
      const txt = c => (m === 'f' ? String(c.f) : m === 'rel' ? (shown(c.rel, dp).exact ? '' : '≈') + shown(c.rel, dp).txt : (shown(c.pct, dp - 2).exact ? '' : '≈') + shown(c.pct, dp - 2).txt + '%');
      const top = Math.max(...D.cats.map(val));
      const nt = niceTicks(0, top > 0 ? top : 1, 5);
      const axis = { ticks: nt.ticks, at: v => v / nt.hi, fmt: v => tickTxt(v, m === 'pct') };
      const items = D.cats.map(c => ({ label: c.name, v: val(c), slot: c.slot, txt: txt(c), title: c.name + ': f = ' + c.f + ', ' + c.f + '/' + n + ' ' + eqTxt(c.rel) + ' = ' + shortTxt(c.pct) + '%' }));
      const chart = h('div', { class: 's1c-chart' });
      out.appendChild(chart);
      fit(chart, W => barSvg(W, items, axis, { aria: 'bar chart of the frequencies' }));
      out.appendChild(K.note({ f: 'Height = frequency ' + tx('f_i') + '.', rel: 'Height = relative frequency ' + tx('\\frac{f_i}{n}') + ': every frequency divided by the same ' + tx('n=' + n) + '.', pct: 'Height = percent ' + tx('\\frac{f_i}{n}\\times 100\\%') + '.' }[m] +
        ' Switching between frequency, relative frequency and percent only relabels the axis — every bar is scaled by the same factor, so the picture keeps its shape. ' + (D.ordinal ? 'Bars follow your order (' + D.cats.map(c => esc(c.name)).join(' &lt; ') + ').' : 'Bars follow the order the categories were typed in.'), 'small'));
    }

    /* ---------------- pie chart */
    function drawPie() {
      const out = P.pieOut;
      Lab.clear(out);
      const n = D.n;
      const live = D.cats.filter(c => c.f > 0);
      let slices = live.map(c => ({ c, label: c.name, frac: c.rel, slot: c.slot }));
      let other = null;
      if (live.length > SLOTS) {
        const keep = live.filter(c => c.slot >= 0), rest = live.filter(c => c.slot < 0);
        const fo = rest.reduce((a, c) => a + c.f, 0);
        other = { rest, f: fo, rel: F(fo, n) };
        slices = keep.map(c => ({ c, label: c.name, frac: c.rel, slot: c.slot }));
        slices.push({ c: null, label: 'Other', frac: other.rel, slot: -1 });
      }
      let acc = F(0);
      slices.forEach(sl => { sl.from = acc.mul(360); acc = acc.add(sl.frac); sl.to = acc.mul(360); const a = sl.frac.mul(360); sl.ang = a; const s2 = shown(a, 2); sl.angTxt = (s2.exact ? '' : '≈') + s2.txt.replace(/\.00$/, '') + '°'; sl.title = sl.label + ': ' + sl.angTxt + ' (' + shortTxt(sl.frac.mul(100)) + '% of the pie)'; });
      const chart = h('div', { class: 's1c-chart s1c-piebox' });
      out.appendChild(chart);
      fit(chart, W => pieSvg(Math.min(W, 520), slices));
      if (other) out.appendChild(K.note('You have ' + live.length + ' categories with values. A pie with many tiny slices is hard to read (course notes), so the pie shows the 7 largest and <b>combines the other ' + other.rest.length + '</b> (' + other.rest.map(c => esc(c.name) + ' ' + c.f).join(', ') + '; ' + tx('f=' + other.rest.map(c => c.f).join('+') + '=' + other.f) + ') into “Other”, as W2_L3 does at 16:16 (clubbing small categories instead of dropping them keeps all the data). The course notes ask you to say so whenever categories are combined. The table and the bar chart show every category.', 's1c-warnbox'));
      const zero = D.cats.filter(c => c.f === 0);
      if (zero.length) out.appendChild(K.note(andList(zero.map(c => esc(c.name))) + (zero.length === 1 ? ' has' : ' have') + ' frequency 0, so ' + (zero.length === 1 ? 'its slice has' : 'their slices have') + ' angle 0° and ' + (zero.length === 1 ? 'is' : 'are') + ' not drawn.', 'small muted'));
      const t = h('table', { class: 'tbl s1c-legend' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Slice' }), h('th', { html: 'Angle ' + tx('=\\frac{f_i}{n}\\times 360' + DEG) }), h('th', { text: 'From → to (clockwise from 12 o’clock)' }))));
      const tb = h('tbody');
      slices.forEach(sl => {
        const f = sl.c ? sl.c.f : other.f;
        const ex = s => { const v = shown(s, 2); return (v.exact ? '' : '≈ ') + v.txt.replace(/\.00$/, '') + '°'; };
        tb.appendChild(h('tr', {},
          h('td', { class: 'l', html: '<span class="s1c-sw" style="background:' + colorOf(sl.slot) + '"></span>' + esc(sl.label) }),
          h('td', { html: tx(fracTex(f, n).replace(/=.*$/, '') + '\\times 360' + DEG + (shown(sl.ang, 2).exact ? '=' + shown(sl.ang, 2).txt.replace(/\.00$/, '') + DEG : '\\approx ' + shown(sl.ang, 2).txt + DEG)) }),
          h('td', { text: ex(sl.from) + ' → ' + ex(sl.to) })));
      });
      t.appendChild(tb);
      out.appendChild(h('div', { class: 'tbl-wrap s1c-tw' }, t));
      out.appendChild(K.note('Point at a slice for its numbers. The last slice ends at exactly ' + tx('360' + DEG) + ' because the fractions add to 1. Use a pie to show parts of a whole; to compare groups, a bar chart is easier to read (course notes).', 'small muted'));
    }

    /* ---------------- Pareto chart */
    function drawPareto() {
      const out = P.parOut;
      Lab.clear(out);
      const n = D.n;
      const sorted = D.ordinal ? D.cats.slice() : D.cats.slice().sort((a, b) => b.f - a.f || a.idx - b.idx);
      if (D.ordinal) out.appendChild(K.note('Your variable is <b>ordinal</b> (' + D.cats.map(c => esc(c.name)).join(' &lt; ') + '), so the lab keeps this natural order instead of sorting by frequency: sorting would scramble the order that the categories carry (course notes, Week 2). The chart is then the ordinary bar chart.', 's1c-warnbox'));
      else {
        const ties = sorted.some((c, i) => i && c.f === sorted[i - 1].f);
        out.appendChild(K.note('Sorted by frequency, biggest first: ' + tx(sorted.map(c => c.f).join('\\ge ')) + (ties ? '. Equal frequencies keep the order of your table.' : '.') + ' The first bar is the mode; in quality control it is the problem to fix first.', 'small'));
      }
      const cum = [];
      let acc = 0;
      sorted.forEach(c => { acc += c.f; cum.push({ c, cf: acc, cp: F(acc, n).mul(100) }); });
      const useCum = st.cum;
      const items = sorted.map(c => ({ label: c.name, v: useCum ? Number(c.pct) : c.f, slot: c.slot, txt: useCum ? (shown(c.pct, 1).exact ? '' : '≈') + shown(c.pct, 1).txt + '%' : String(c.f), title: c.name + ': f = ' + c.f + ' (' + shortTxt(c.pct) + '%)' }));
      const top = useCum ? 100 : Math.max(...sorted.map(c => c.f));
      const nt = useCum ? { hi: 100, ticks: [0, 20, 40, 60, 80, 100] } : niceTicks(0, top || 1, 5);
      const axis = { ticks: nt.ticks, at: v => v / nt.hi, fmt: v => tickTxt(v, useCum) };
      const chart = h('div', { class: 's1c-chart' });
      if (useCum) out.appendChild(h('div', { class: 's1c-keys' }, h('span', {}, h('i', { class: 's1c-k bar' }), 'bars: percent of ' + 'n'), h('span', {}, h('i', { class: 's1c-k line' }), 'line: cumulative percent')));
      out.appendChild(chart);
      fit(chart, W => barSvg(W, items, axis, { aria: 'Pareto chart', line: useCum ? cum.map(x => Number(x.cp) / 100) : null, lineTxt: cum.map(x => shortTxt(x.cp) + '%') }));
      if (useCum) {
        const t = h('table', { class: 'tbl s1c-cumtab' });
        t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Category' }), h('th', { html: tx('f_i') }), h('th', { text: 'Cumulative frequency' }), h('th', { html: 'Cumulative percent ' + tx('=\\frac{\\text{cum. } f}{n}\\times 100\\%') }))));
        const tb = h('tbody');
        cum.forEach((x, i) => tb.appendChild(h('tr', {}, h('td', { class: 'l', html: '<span class="s1c-sw" style="background:' + colorOf(x.c.slot) + '"></span>' + esc(x.c.name) }), h('td', { text: String(x.c.f) }),
          h('td', { html: tx(i ? cum[i - 1].cf + '+' + x.c.f + '=' + x.cf : String(x.cf)) }),
          h('td', { html: tx('\\frac{' + x.cf + '}{' + n + '}\\times 100\\%' + (decStr(x.cp, 6) != null ? '=' + decStr(x.cp, 6) : '\\approx ' + scaledTxt(roundScaled(x.cp, 2), 2)) + '\\%') }))));
        t.appendChild(tb);
        out.appendChild(h('div', { class: 'tbl-wrap s1c-tw' }, t));
        out.appendChild(K.note('A cumulative line is common on Pareto charts in quality control; the course notes define the Pareto chart as the sorted bar chart. With the line on, the bars show percent so that bars and line share one axis (0–100%).', 'small muted'));
      }
      P.par = { order: sorted.map(c => c.name), cum: cum.map(x => x.cp.toString()) };
    }

    /* ---------------- mode */
    function drawMode() {
      const body = P.mode.body;
      Lab.clear(body);
      const M = modeInfo();
      const byF = M.live.slice().sort((a, b) => b.f - a.f || a.idx - b.idx);
      const t = h('div', { class: 's1c-rank' });
      byF.forEach(c => t.appendChild(h('span', { class: 's1c-rk' + (!M.none && c.f === M.top ? ' top' : '') }, h('i', { class: 's1c-sw', style: 'background:' + colorOf(c.slot) }), h('b', { text: c.name }), h('em', { text: 'f = ' + c.f }))));
      body.appendChild(t);
      let html;
      if (D.n === 1) html = 'Only one value: nothing can repeat, so there is <b>no mode</b>.';
      else if (M.none) html = 'Every category has ' + tx('f_i=1') + ': <b>no value repeats, so there is no mode</b> (course notes).';
      else if (M.modes.length === 1) {
        const second = byF.find(c => c.f < M.top);
        html = '<b>Mode: ' + esc(M.modes[0].name) + '</b>, with ' + tx('f=' + M.top) + (second ? ' — more than any other category (the next highest is ' + esc(second.name) + ' with ' + tx('f=' + second.f) + ')' : '') + '. One mode: <b>unimodal</b>.';
      } else {
        html = '<b>' + (M.modes.length === 2 ? 'Bimodal' : 'Multimodal') + '</b>: ' + andList(M.modes.map(c => '<b>' + esc(c.name) + '</b>')) + ' tie for first with ' + tx('f=' + M.top) + ' each — a tie for the highest frequency gives ' + (M.modes.length === 2 ? 'two modes' : M.modes.length + ' modes') + ' (course notes).';
        if (M.allTie) html += ' Here <i>every</i> category ties; the course notes still call this a tie for first, while some books say such data have no mode.';
      }
      body.appendChild(K.note(html, 's1c-verdict'));
      body.appendChild(K.note('The mode needs only counting, so it exists for nominal and ordinal data alike. It is the only “average” allowed for nominal data; the mean is not defined for categorical data (course notes).', 'small muted'));
    }

    /* ---------------- median */
    function chips(list, hiPos) {
      const wrap = h('div', { class: 's1c-chips' });
      if (list.length <= 60) list.forEach((v, i) => wrap.appendChild(h('span', { class: 's1c-chip' + (hiPos.includes(i + 1) ? ' mid' : '') }, h('i', { text: String(i + 1) }), h('b', { text: v }))));
      return wrap;
    }
    function drawMedian() {
      const body = P.median.body;
      Lab.clear(body);
      const n = D.n;
      if (!D.ordinal) {
        body.appendChild(K.note('Your variable is <b>nominal</b>: the categories have no natural order, so “the middle of the sorted list” depends only on how you choose to sort them — <b>nominal data have no median</b> (course notes). See for yourself: two equally arbitrary orders give two different middles.', 's1c-verdict'));
        const live = D.cats.filter(c => c.f > 0);
        const az = live.slice().sort((a, b) => a.name.localeCompare(b.name));
        const typed = live.slice().sort((a, b) => a.inIdx - b.inIdx);
        const big = live.slice().sort((a, b) => b.f - a.f || a.inIdx - b.inIdx);
        const cands = [['alphabetically, A → Z', az], ['alphabetically, Z → A', az.slice().reverse()], ['in the order typed', typed], ['in reverse typed order', typed.slice().reverse()], ['by frequency, largest first', big], ['by frequency, smallest first', big.slice().reverse()]];
        const key = cs => medianInfo(cs).hit.map(c => c.name).join('\u0001');
        let pair = [cands[0], cands[1]];
        if (key(cands[0][1]) === key(cands[1][1])) { const other = cands.slice(1).find(cd => key(cd[1]) !== key(cands[0][1])); if (other) pair = [cands[0], other]; }
        pair.forEach(([lab, cs]) => {
          const md = medianInfo(cs);
          const list = cs.flatMap(c => Array(c.f).fill(c.name));
          const holds = md.odd ? 'middle position ' + tx('\\frac{n+1}{2}=\\frac{' + n + '+1}{2}=' + md.pos[0]) + ' holds ' + nameB(md.hit[0])
            : 'middle positions ' + tx('\\frac n2=' + md.pos[0]) + ' and ' + tx('\\frac n2+1=' + md.pos[1]) + (md.same ? ' both hold ' + nameB(md.hit[0]) : ' hold ' + nameB(md.hit[0]) + ' and ' + nameB(md.hit[1]));
          body.appendChild(K.note('<b>Sorted ' + lab + '</b>: ' + holds + '.', 'small'));
          if (n <= 60) body.appendChild(chips(list, md.pos));
        });
        body.appendChild(K.note(key(pair[0][1]) === key(pair[1][1]) ? 'With these data every order the lab tried gives the same middle — but nothing makes one order of nominal labels the “right” one, so it is still not a median.' : 'Two arbitrary orders, two different “middles”: the answer depends on the sorting you chose, not on the data.', 'small'));
        body.appendChild(h('div', { class: 'btn-row' }, Lab.button('My categories do have an order — make it ordinal', () => { st.ordinal = true; ctl.ord.querySelector('input').checked = true; initOrder(); save(); recompute(); }, 'btn xs')));
        P.med = null;
        return;
      }
      const md = medianInfo(D.cats);
      const list = D.cats.flatMap(c => Array(c.f).fill(c.name));
      const t = h('table', { class: 'tbl s1c-medtab' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Category (low → high)' }), h('th', { html: tx('f_i') }), h('th', { text: 'Cumulative f' }), h('th', { text: 'Positions in the sorted list' }))));
      const tb = h('tbody');
      md.spans.forEach(sp => tb.appendChild(h('tr', { class: md.hit.includes(sp.c) ? 'hl-row' : '' }, h('td', { class: 'l', html: '<span class="s1c-sw" style="background:' + colorOf(sp.c.slot) + '"></span>' + esc(sp.c.name) }), h('td', { text: String(sp.c.f) }), h('td', { text: String(sp.to) }), h('td', { text: sp.c.f === 0 ? '—' : sp.from === sp.to ? String(sp.from) : sp.from + ' to ' + sp.to }))));
      t.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap s1c-tw' }, t));
      if (n <= 60) { body.appendChild(K.note('The sorted list (position above each value):', 'small')); body.appendChild(chips(list, md.pos)); }
      const where = c => { const sp = md.spans.find(x => x.c === c); return sp.from === sp.to ? 'position ' + sp.from : 'positions ' + sp.from + '–' + sp.to; };
      const steps = md.odd
        ? [{ html: tx('n=' + n) + ' is odd, so the median is the value at one middle position:', math: '\\frac{n+1}{2}=\\frac{' + n + '+1}{2}=' + md.pos[0] },
          { html: 'Position ' + md.pos[0] + ' lies in ' + nameB(md.hit[0]) + ' (' + where(md.hit[0]) + '). <b>Median = ' + esc(md.hit[0].name) + '</b>.' }]
        : [{ html: tx('n=' + n) + ' is even, so look at the two middle positions:', math: '\\frac n2=\\frac{' + n + '}{2}=' + md.pos[0] + '\\quad\\text{and}\\quad\\frac n2+1=' + md.pos[1] },
          md.same ? { html: 'Both lie in ' + nameB(md.hit[0]) + ' (' + where(md.hit[0]) + '). <b>Median = ' + esc(md.hit[0].name) + '</b>.' }
            : { html: 'Position ' + md.pos[0] + ' is ' + nameB(md.hit[0]) + ' and position ' + md.pos[1] + ' is ' + nameB(md.hit[1]) + '. The split falls between two categories: <b>the median is either ' + esc(md.hit[0].name) + ' or ' + esc(md.hit[1].name) + '</b> (W2_L5 at 23:44: “the median would have been either B or C”; course notes: the two middle categories, either side of the split). Ordinal labels cannot be averaged, so there is no single category in between.' }];
      body.appendChild(K.steps(steps));
      body.appendChild(K.note('The median uses only the <b>order</b>. Move a category in the order list and the median follows; the mode does not care about order at all.', 'small muted'));
      P.med = { pos: md.pos, hit: md.hit.map(c => c.name) };
    }

    /* ---------------- misleading graphs */
    function buildMis() {
      const body = P.mis.body;
      ctl.misA = K.selectField({ label: 'Bar A', options: [], value: '', onChange: v => { st.mis.a = v; save(); drawMis(); } });
      ctl.misB = K.selectField({ label: 'Bar B', options: [], value: '', onChange: v => { st.mis.b = v; save(); drawMis(); } });
      ctl.misMode = Lab.seg([{ label: 'Honest: starts at 0', value: 'honest' }, { label: 'Truncated baseline', value: 'trunc' }, { label: 'Uneven axis', value: 'uneven' }], st.mis.mode, v => { st.mis.mode = v; save(); syncMisControls(); drawMis(); });
      ctl.misBase = K.numField({ label: 'Value ' + tx('b'), min: 0, max: 100, step: 1, value: Number(st.mis.base) || 0, onChange: v => { st.mis.base = v; save(); drawMis(); } });
      ctl.picto = K.toggle({ label: 'Also draw the two values as pictures (area principle)', value: st.mis.picto, onChange: v => { st.mis.picto = v; save(); drawMis(); } });
      ctl.brk = K.toggle({ label: 'Mark the axis break, as W2_L4 recommends at 06:57', value: st.mis.brk, onChange: v => { st.mis.brk = v; save(); drawMis(); } });
      P.misOut = h('div', { class: 's1c-out' });
      ctl.pie = K.textField({ label: 'Percentages printed on a pie chart', value: st.pie, onChange: v => { st.pie = v; save(); drawPieCheck(); } });
      const pieChips = h('div', { class: 'pl-chips' }, [
        ['29, 28, 15, 24', 'Food survey: 96% (W2 Tutorial 2)'],
        ['23, 36, 13, 11, 19', 'Rounded labels: 102% (W2_L5, 01:52)'],
        ['22.5, 35.5, 12.5, 11, 18.5', 'The same before rounding: 100% (W2_L5, 01:52)'],
        ['20, 15, 14, 11, 10, 31', '101% (W2_L5, 02:59)'],
      ].map(([v, lab]) => Lab.button(lab, () => { st.pie = v; ctl.pie.input.value = v; save(); drawPieCheck(); }, 'btn xs')));
      P.pieCheck = h('div', { class: 's1c-out' });
      body.append(
        h('div', { class: 's1c-ctl' }, h('div', { class: 's1c-two' }, ctl.misA, ctl.misB), h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Draw the chart' }), ctl.misMode), ctl.misBase, ctl.brk, ctl.picto),
        P.misOut,
        h('h4', { class: 's1c-dh', text: 'Check a pie’s labels' }),
        K.note('A pie shows a whole, so its percentages must add to 100% — up to rounding: W2_L5 at 01:52 rounds 22.5, 35.5, 12.5, 11, 18.5 (which add to 100) to 23, 36, 13, 11, 19, which add to 102. Default: ' + PIE_SOURCE, 's1c-dsub'),
        h('div', { class: 's1c-ctl' }, ctl.pie, pieChips), P.pieCheck);
      drawPieCheck();
    }
    function syncMisControls() {
      ctl.misMode.set(st.mis.mode);
      ctl.picto.querySelector('input').checked = !!st.mis.picto;
      ctl.misBase.hidden = st.mis.mode === 'honest';
      ctl.brk.hidden = st.mis.mode !== 'trunc';
      ctl.brk.querySelector('input').checked = !!st.mis.brk;
      const lab = ctl.misBase.querySelector('.pl-label');
      Lab.setHTML(lab, st.mis.mode === 'uneven' ? 'Squeeze 0 to ' + tx('b') + ' into the bottom tenth of the axis: ' + tx('b') : 'Start the axis at the baseline ' + tx('b'));
    }
    function drawMis() {
      if (!D) return;
      const out = P.misOut;
      Lab.clear(out);
      const live = D.cats.filter(c => c.f > 0);
      if (live.length < 2) { out.appendChild(K.note('Type at least two categories with counts above 0 to compare two bars.', 'small muted')); return; }
      const names = live.map(c => c.name);
      [ctl.misA, ctl.misB].forEach(c => { Lab.clear(c.select); names.forEach(nm => c.select.appendChild(h('option', { value: nm, text: nm }))); });
      const byF = live.slice().sort((a, b) => b.f - a.f || a.idx - b.idx);
      if (!names.includes(st.mis.a)) st.mis.a = byF[0].name;
      if (!names.includes(st.mis.b) || st.mis.b === st.mis.a) st.mis.b = (byF.slice().reverse().find(c => c.name !== st.mis.a) || byF[1]).name;
      ctl.misA.select.value = st.mis.a; ctl.misB.select.value = st.mis.b;
      const A = live.find(c => c.name === st.mis.a), B = live.find(c => c.name === st.mis.b);
      const fa = A.f, fb = B.f, maxF = Math.max(fa, fb);
      const step = Math.max(1, Math.pow(10, Math.floor(Math.log10(Math.max(1, maxF))) - 1));
      ctl.misBase.setRange(0, Math.max(step, Math.floor((maxF - 1) / step) * step));
      let b = Math.min(Number(st.mis.base) || 0, maxF);
      st.mis.base = b;
      ctl.misBase.set(b);
      syncMisControls();
      const mode = st.mis.mode;
      const nt = niceTicks(0, maxF, 5);
      const topV = nt.hi;
      const items = [A, B].map(c => ({ label: c.name, v: c.f, slot: c.slot, txt: String(c.f), title: c.name + ': f = ' + c.f }));
      const honestAxis = { ticks: nt.ticks, at: v => v / topV, fmt: v => tickTxt(v) };
      const trueR = F(fa, fb);
      const steps = [{ html: 'True comparison:', math: '\\frac{f_A}{f_B}=' + ratioTex(fa, fb), note: esc(A.name) + ' is ' + shortTxt(trueR) + ' times ' + esc(B.name) + '.' }];
      let visR = null, misAxis = null, misNote = '';
      if (mode === 'trunc') {
        const ticksT = niceTicks(b, Math.max(maxF, b + 1), 5).ticks.filter(v => v >= b);
        // the baseline b is always labelled; a nice tick too close above it would print on top of it
        if (ticksT[0] !== b) { if (ticksT.length > 1 && ticksT[0] - b < (ticksT[1] - ticksT[0]) / 2) ticksT[0] = b; else ticksT.unshift(b); }
        const topT = Math.max(...ticksT, maxF);
        misAxis = { ticks: ticksT, at: v => (v - b) / (topT - b), fmt: v => tickTxt(v) };
        const va = fa - b, vb = fb - b;
        if (vb <= 0) steps.push({ html: 'Truncated at ' + tx('b=' + b) + ': bar B’s visible height is ' + tx(fb + '-' + b + '=' + (fb - b)) + ', so it <b>vanishes</b> — the chart suggests ' + esc(B.name) + ' has nothing at all.' });
        else {
          visR = F(va, vb);
          steps.push({ html: 'Truncated at ' + tx('b=' + b) + ': only the part of each bar above ' + b + ' is drawn, so the visible heights are ' + tx('f-b') + ':', math: '\\frac{f_A-b}{f_B-b}=\\frac{' + fa + '-' + b + '}{' + fb + '-' + b + '}=' + ratioTex(va, vb) });
        }
        misNote = st.mis.brk ? 'The break symbol on the axis tells the reader that it starts at ' + b + ', not 0 (W2_L4 at 06:57). The bar heights still exaggerate the gap, so compare the numbers, not the heights.' : 'The axis starts at ' + b + ', not 0 — the baseline is missing, and nothing warns the reader.';
      } else if (mode === 'uneven') {
        if (b <= 0 || b >= topV) { steps.push({ html: 'Choose ' + tx('b') + ' between 0 and ' + topV + ' to squeeze the bottom of the axis.' }); }
        else {
          const tenth = F(1, 10), nine = F(9, 10);
          const hgt = v => (v <= b ? tenth.mul(F(v, b)) : tenth.add(nine.mul(F(v - b, topV - b))));
          const upTicks = [1, 2, 3, 4].map(k => b + ((topV - b) * k) / 4);
          misAxis = { ticks: [0, b].concat(upTicks), at: v => Number(hgt(v)), fmt: v => tickTxt(v) };
          const ha = hgt(fa), hb = hgt(fb);
          // two lines per bar (the formula, then its value) so it fits a phone
          const hTex = (sym, v, hv) => sym + '&=' + (v <= b ? '\\tfrac{1}{10}\\cdot\\frac{' + v + '}{' + b + '}' : '\\tfrac{1}{10}+\\tfrac{9}{10}\\cdot\\frac{' + v + '-' + b + '}{' + topV + '-' + b + '}') + '\\\\&=' + qTex(hv);
          steps.push({ html: 'Uneven axis: 0 to ' + tx('b=' + b) + ' gets the bottom tenth of the height and ' + b + ' to ' + topV + ' gets the other nine tenths. Each bar’s height, as a fraction of the axis:', math: '\\begin{aligned}' + hTex('h_A', fa, ha) + '\\\\' + hTex('h_B', fb, hb) + '\\end{aligned}' });
          visR = ha.div(hb);
          steps.push({ html: 'Ratio of the drawn heights:', math: '\\frac{h_A}{h_B}=' + qTex(visR) });
          misNote = 'Equal gaps on the axis stand for 0 → ' + b + ' at the bottom but only ' + (topV - b) / 4 + ' per gap above — the scale is uneven.';
        }
      } else steps.push({ html: 'Honest chart (axis from 0, even steps): bar heights are proportional to the counts, so the drawn ratio is the true ratio ' + tx(qTex(trueR)) + '.' });
      if (visR) {
        const ex = visR.div(trueR);
        steps.push({ html: '<b>Exaggeration</b>: the picture makes ' + esc(A.name) + ' look ' + shortTxt(visR) + ' times ' + esc(B.name) + ', but it is ' + shortTxt(trueR) + ' times:', math: '\\frac{\\text{drawn ratio}}{\\text{true ratio}}=' + (visR.d === 1 && trueR.d === 1 ? '\\frac{' + fTex(visR) + '}{' + fTex(trueR) + '}' : fTex(visR) + '\\div ' + fTex(trueR)) + '=' + qTex(ex) });
      }
      const charts = h('div', { class: 's1c-pair' + (misAxis ? '' : ' one') });
      const cH = h('div', { class: 's1c-chart' }), cM = h('div', { class: 's1c-chart' });
      charts.appendChild(h('div', {}, h('div', { class: 's1c-ctitle', text: 'Honest: axis from 0' }), cH));
      const brk = mode === 'trunc' && !!st.mis.brk;
      if (misAxis) charts.appendChild(h('div', {}, h('div', { class: 's1c-ctitle bad', text: mode === 'trunc' ? (brk ? 'Truncated at ' + b + ', break marked' : 'Misleading: truncated at ' + b) : 'Misleading: uneven axis' }), cM, K.note(misNote, 'small s1c-badnote')));
      out.appendChild(charts);
      fit(cH, W => barSvg(W, items, honestAxis, { ph: 170, aria: 'honest bar chart of two categories' }));
      if (misAxis) fit(cM, W => barSvg(W, items, misAxis, { ph: 170, brk, aria: 'misleading bar chart of two categories' }));
      out.appendChild(K.steps(steps));
      out.appendChild(K.note('Area principle (course notes): with bars of equal width, area = width × height, so the area matches the data only when the heights are proportional to the counts — an axis from 0 with even steps.', 'small muted'));
      if (st.mis.picto) {
        const sideA = Math.sqrt(fa / maxF), sideB = Math.sqrt(fb / maxF);
        const pic = h('div', { class: 's1c-picto' });
        const sq = (s1, s2, title, cls) => {
          const S = 120;
          const sv = svg('svg', { viewBox: '0 0 ' + (2 * S + 40) + ' ' + (S + 30), class: 's1c-svg s1c-sq', role: 'img', 'aria-label': title });
          [[s1, A], [s2, B]].forEach(([sz, c], i) => {
            const x = 10 + i * (S + 20), w = Math.max(2, sz * S);
            sv.appendChild(svg('rect', { x, y: 10 + S - w, width: w, height: w, rx: 3, style: 'fill:' + colorOf(c.slot) }));
            sv.appendChild(svg('text', { x: x + S / 2, y: S + 26, 'text-anchor': 'middle', class: 's1c-tick' }, short(c.name, 16) + ': ' + c.f));
          });
          return h('div', { class: 's1c-sqbox ' + cls }, h('div', { class: 's1c-ctitle' + (cls === 'bad' ? ' bad' : ''), text: title }), sv);
        };
        pic.append(sq(sideA, sideB, 'Honest: area ∝ count (side ∝ √count)', 'good'), sq(fa / maxF, fb / maxF, 'Misleading: side ∝ count, so area ∝ count²', 'bad'));
        out.appendChild(pic);
        const r2 = trueR.mul(trueR);
        out.appendChild(K.steps([{ html: 'Scaling a picture’s height <b>and</b> width by the ratio multiplies its area by the ratio twice:', math: '\\left(\\frac{f_A}{f_B}\\right)^2=\\left(' + fTex(trueR) + '\\right)^2=' + qTex(r2), note: 'The right-hand pair looks ' + shortTxt(r2) + ' times as big although ' + esc(A.name) + ' is only ' + shortTxt(trueR) + ' times ' + esc(B.name) + '. Honest pictures scale the side by the square root, so the area grows like the count.' }]));
      }
      P.misRes = { a: A.name, b: B.name, fa, fb, base: b, mode, topV, trueR: trueR.toString(), visR: visR ? visR.toString() : null, picto: !!st.mis.picto, brk };
      expose();
    }
    function drawPieCheck() {
      const out = P.pieCheck;
      Lab.clear(out);
      const toks = String(st.pie).split(/[\s,;%]+/).map(t => t.trim()).filter(Boolean);
      const vals = toks.map(t => (/^\d+(\.\d+)?$/.test(t) ? F(t) : null));
      if (!toks.length || vals.some(v => !v)) { ctl.pie.input.classList.add('bad'); out.appendChild(K.note('<span class="cbad">Type the percentages as numbers, such as 29, 28, 15, 24.</span>', 'small')); return; }
      ctl.pie.input.classList.remove('bad');
      const sum = vals.reduce((a, v) => a.add(v), F(0));
      const d = Math.max(0, ...toks.map(t => (t.includes('.') ? t.split('.')[1].length : 0)));
      const half = F(5, Math.pow(10, d + 1));
      const bound = half.mul(vals.length);
      const off = sum.sub(100);
      const absOff = off.n < 0 ? off.neg() : off;
      const within = absOff.sub(bound).n <= 0;
      const lo = F(100).sub(bound), hi = F(100).add(bound);
      const steps = [
        { html: 'Add the labels:', math: toks.join('+') + '=' + (decStr(sum, 6) ?? sum.tex()) + '\\%' },
        { html: 'Each label is rounded to ' + plural(d, 'decimal place') + ', so each can be off by at most ' + tx(decStr(half, 6)) + '. With ' + vals.length + ' labels the total can be off by at most ' + tx(vals.length + '\\times ' + decStr(half, 6) + '=' + decStr(bound, 6)) + ': a correct pie adds to between ' + tx(decStr(lo, 6) + '\\%') + ' and ' + tx(decStr(hi, 6) + '\\%') + '.' },
      ];
      out.appendChild(K.steps(steps));
      out.appendChild(K.note(off.isZero() ? 'The labels add to exactly 100% — the pie can be right.' : within ? 'The labels add to ' + decStr(sum, 6) + '%, within the rounding allowance — the gap of ' + decStr(absOff, 6) + '% can be round-off alone.' : 'The labels add to ' + decStr(sum, 6) + '%, not 100%: ' + decStr(absOff, 6) + '% of the whole is ' + (off.n < 0 ? 'missing' : 'counted twice') + ' — more than rounding can explain. The pie is <b>misleading</b> (W2 Tutorial 2).', within || off.isZero() ? 's1c-verdict' : 's1c-warnbox'));
      P.pieRes = { labels: toks, sum: sum.toString(), bound: bound.toString(), within };
      if (D) expose();
    }

    /** Exact results in a data attribute for the test scripts (nothing on screen). */
    function expose() {
      const M = modeInfo();
      host.dataset.s1c = JSON.stringify({
        n: D.n, k: D.k, ordinal: D.ordinal, cats: D.cats.map(c => ({ name: c.name, f: c.f, rel: c.rel.toString(), pct: c.pct.toString(), ang: c.ang.toString(), slot: c.slot })),
        dp: st.dp, sums: P.sums, modes: M.none ? [] : M.modes.map(c => c.name), noMode: M.none, median: P.med || null, pareto: P.par || null, mis: P.misRes || null, pie: P.pieRes || null,
      });
    }

    buildEditor();
    rebuild();
  }

  Lab.lab({
    id: 'lab-s1-categorical', course: 's1', week: 2, order: 1,
    title: 'Categorical data and charts lab', sub: 'Week 2 · frequencies, charts, mode, median',
    topics: ['frequency table', 'relative frequency', 'pie angles', 'bar chart', 'Pareto chart', 'mode', 'ordinal median', 'misleading graphs'],
    desc: 'Type raw categories or categories with counts, and say whether they are ordinal. See the frequency table with every fraction, decimal, percent and pie angle worked out, the bar, pie and Pareto charts, the mode and the median by position — and how a truncated or uneven axis exaggerates a difference.',
    render: host => catLab(host),
  });
})();
