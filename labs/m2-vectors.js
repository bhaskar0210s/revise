/* Maths II lab, Weeks 1 and 3 (L1.1, L3.1–L3.2): 'lab-m2-vectors'.
   Input: two vectors u, v in ℝⁿ (n = 2, 3, 4), two scalars a, b, a set V with its two operations (menu from L3.1)
   and a third element w. Output: a·u + b·v component by component with a drawing for ℝ² and ℝ³, the ten checks of
   the vector-space definition (two closure requirements and the lecture's rules 1–8) worked out with the learner's
   elements, every failure with the exact elements that break it, and the L3.2 properties (cancellation, unique 0,
   0·v = 0, (−c)·v = −(c·v) = c·(−v), c·0 = 0) with the learner's elements. All arithmetic is exact (Lab.F). */
(function () {
  'use strict';
  const { h, F } = Lab;
  const K = Lab.play;
  const KEY = 'lab:m2-vectors';

  /* ================================================================ TeX helpers */
  const memo = new Map();
  const tx = s => {
    let r = memo.get(s);
    if (r === undefined) { if (memo.size > 4000) memo.clear(); r = Lab.tex(s); memo.set(s, r); }
    return r;
  };
  /** A number as compact TeX: 5, -3, \tfrac{7}{3}. */
  const T = f => (f.d === 1 ? String(f.n) : (f.n < 0 ? '-' : '') + '\\tfrac{' + Math.abs(f.n) + '}{' + f.d + '}');
  /** The same, in brackets when negative (after an operator). */
  const par = f => (f.n < 0 ? '(' + T(f) + ')' : T(f));
  const tup = items => '\\left(' + items.join(',\\ ') + '\\right)';
  const mat22 = items => '\\begin{bmatrix}' + items[0] + '&' + items[1] + '\\\\' + items[2] + '&' + items[3] + '\\end{bmatrix}';
  const ok = '<span class="mv-ok">✓</span>';
  const bad = '<span class="mv-bad">✗</span>';
  const range = n => Array.from({ length: n }, (_, k) => k);
  const eqList = (x, y) => x.length === y.length && x.every((f, k) => f.eq(y[k]));
  /** A chain "A = B = C" as aligned lines, one "= …" per line, so a phone shows every part. */
  const al = s => { const p = s.split('='); return p.length > 2 ? '\\begin{aligned}' + p[0] + '&=' + p.slice(1).join('\\\\&=') + '\\end{aligned}' : s; };

  /* ================================================================ sources */
  const VID = { L11: '1So2VV9Tm_A', L31: 'dAttVL9a5Go', L32: 'yUISwV4LE20' };
  const at = (k, min) => Lab.vlink(VID[k], min);

  /* ================================================================ the sets V of L3.1 */
  // Every element is stored as a list of fractions; the set decides how it is shown and how + and · act.
  const SPACES = {
    rn: {
      name: n => 'ℝ' + ['', '', '²', '³', '⁴'][n] + ' with the usual + and ·',
      dim: n => n, show: tup, fails: [],
      addRule: '(x_1,\\dots,x_n)+(y_1,\\dots,y_n)=(x_1+y_1,\\dots,x_n+y_n)', mulRule: 'c\\,(x_1,\\dots,x_n)=(c\\,x_1,\\dots,c\\,x_n)',
      add: (x, y) => x.map((xi, k) => ({ v: xi.add(y[k]), w: T(xi) + '+' + par(y[k]) })),
      mul: (c, x) => x.map(xi => ({ v: c.mul(xi), w: par(c) + '\\cdot ' + par(xi) })),
      neg: x => x.map(xi => xi.neg()),
      src: k => 'L3.1 at ' + at('L31', 1.5) + ' (the operations) and ' + at('L31', 12) + ': “obviously an example of a vector space is ℝⁿ with the usual addition and scalar multiplication”.',
    },
    mat: {
      name: () => '2×2 matrices M₂ₓ₂ with the usual + and ·',
      dim: () => 4, show: mat22, fails: [],
      addRule: '(A+B)_{ij}=A_{ij}+B_{ij}', mulRule: '(c\\,A)_{ij}=c\\,A_{ij}',
      add: (x, y) => x.map((xi, k) => ({ v: xi.add(y[k]), w: T(xi) + '+' + par(y[k]) })),
      mul: (c, x) => x.map(xi => ({ v: c.mul(xi), w: par(c) + '\\cdot ' + par(xi) })),
      neg: x => x.map(xi => xi.neg()),
      src: () => 'L3.1 at ' + at('L31', 12) + ': the set of m×n matrices with real entries, added entry by entry and scaled entry by entry, is a vector space. Here m = n = 2; the four numbers of each box fill the matrix row by row.',
    },
    ce1: {
      name: () => 'ℝ² with (x₁, x₂) + (y₁, y₂) = (x₁ + y₁, x₂ − y₂)',
      dim: () => 2, show: tup, fails: [1, 2, 8],
      addRule: '(x_1,x_2)+(y_1,y_2)=(x_1+y_1,\\ x_2-y_2)', mulRule: 'c\\,(x_1,x_2)=(c\\,x_1,\\ c\\,x_2)',
      add: (x, y) => [{ v: x[0].add(y[0]), w: T(x[0]) + '+' + par(y[0]) }, { v: x[1].sub(y[1]), w: T(x[1]) + '-' + par(y[1]) }],
      mul: (c, x) => x.map(xi => ({ v: c.mul(xi), w: par(c) + '\\cdot ' + par(xi) })),
      neg: x => [x[0].neg(), x[1]],
      src: () => 'L3.1 at ' + at('L31', 20) + ': the first coordinate is added, the second is subtracted; scalar multiplication is the usual one. “Check that one, two and eight fail.” At ' + at('L31', 21.5) + ' the lecture shows rule 1 failing with (0, 0) + (1, 1) = (1, −1) but (1, 1) + (0, 0) = (1, 1).',
    },
    ce2: {
      name: () => 'ℝ² with (x₁, x₂) + (y₁, y₂) = (x₁ + y₁, 0)',
      dim: () => 2, show: tup, fails: [3, 4, 5],
      addRule: '(x_1,x_2)+(y_1,y_2)=(x_1+y_1,\\ 0)', mulRule: 'c\\,(x_1,x_2)=(c\\,x_1,\\ 0)',
      add: (x, y) => [{ v: x[0].add(y[0]), w: T(x[0]) + '+' + par(y[0]) }, { v: F(0), w: '0' }],
      mul: (c, x) => [{ v: c.mul(x[0]), w: par(c) + '\\cdot ' + par(x[0]) }, { v: F(0), w: '0' }],
      neg: x => [x[0].neg(), x[1].neg()],
      src: () => 'L3.1 at ' + at('L31', 22) + ': the second coordinate of every sum and every multiple is 0. “Check that the third, fourth and fifth axioms fail.”',
    },
  };
  const SPACE_KEYS = ['rn', 'mat', 'ce1', 'ce2'];

  /* ================================================================ presets (lecture examples only) */
  const PRESETS = [
    { label: 'L1.1 · parallelogram law: (1, 2) + (2, 1) = (3, 3)', n: 2, u: ['1', '2'], v: ['2', '1'], a: '1', b: '1', space: 'rn', w: ['1', '1'],
      source: 'L1.1 at ' + at('L11', 25) + ': the arrow (1, 2) is moved to start at the tip of (2, 1); the sum is the arrow to (3, 3), “exactly how we defined vector addition”.' },
    { label: 'L1.1 · Arun (3, 2) + Neela (5, 6) = (8, 8)', n: 2, u: ['3', '2'], v: ['5', '6'], a: '1', b: '1', space: 'rn', w: ['1', '1'],
      source: 'L1.1 at ' + at('L11', 9.5) + ': first component = kg of rice, second = kg of dal. Together they buy 3 + 5 = 8 kg of rice and 2 + 6 = 8 kg of dal.' },
    { label: 'L1.1 · the point (1, 2) as 1·i + 2·j', n: 2, u: ['1', '0'], v: ['0', '1'], a: '1', b: '2', space: 'rn', w: ['1', '1'],
      source: 'L1.1 at ' + at('L11', 21) + ': i is the arrow from (0, 0) to (1, 0), j the arrow to (0, 1); a·i + b·j is the arrow from the origin to the point (a, b). Here a = 1, b = 2.' },
    { label: 'L1.1 · buyer A twice: 2·(8, 8, 4, 10) (first four items)', n: 4, u: ['8', '8', '4', '10'], v: ['0', '0', '0', '0'], a: '2', b: '1', space: 'rn', w: ['1', '1', '1', '1'],
      source: 'L1.1 at ' + at('L11', 17.5) + ': buyer A buys the same items on two days, so the vector is added twice, which is 2 times each entry. The lecture’s vector has five items (8, 8, 4, 10, 4); this lab holds four, so the soap bars are left out.' },
    { label: 'L3.1 · rule 1 fails: (0, 0) + (1, 1) with (x₁ + y₁, x₂ − y₂)', n: 2, u: ['0', '0'], v: ['1', '1'], a: '2', b: '3', space: 'ce1', w: ['1', '2'],
      source: 'L3.1 at ' + at('L31', 21.5) + ': (0, 0) + (1, 1) = (1, −1) but (1, 1) + (0, 0) = (1, 1), so v + w ≠ w + v.' },
    { label: 'L3.1 · (x₁ + y₁, 0): rules 3, 4, 5 fail', n: 2, u: ['1', '2'], v: ['2', '1'], a: '2', b: '3', space: 'ce2', w: ['1', '1'],
      source: 'L3.1 at ' + at('L31', 22) + ': “check that the third, fourth and fifth axioms fail”. The lecture leaves the elements to you; these are (1, 2), (2, 1) and (1, 1).' },
    { label: 'L3.1 · 2×2 matrices are a vector space', n: 4, u: ['1', '2', '3', '4'], v: ['0', '1', '-1', '2'], a: '2', b: '-1', space: 'mat', w: ['1', '0', '0', '1'],
      source: 'L3.1 at ' + at('L31', 12) + ': matrices with the entry-wise operations. The lecture gives no numbers; these three matrices are the lab’s.' },
  ];
  const START = 0;
  const DEF = () => Object.assign({ loaded: PRESETS[START].label }, pick(PRESETS[START]));
  const pad = (arr, n) => range(n).map(k => (arr && arr[k] != null ? String(arr[k]) : '0'));
  const pick = p => ({ n: p.n, u: pad(p.u, 4), v: pad(p.v, 4), a: p.a, b: p.b, space: p.space, w: pad(p.w, 4) });

  /* ================================================================ parsing */
  const num = s => {
    const p = K.parseNum(s);
    if (p == null) return null;
    const f = p instanceof Lab.Frac ? p : Lab.Frac.fromNumber(Number(p));
    return f.approx ? null : f;
  };

  /* ================================================================ styles */
  const CSS = `
.mv-lab .mv-row { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
.mv-lab .mv-row .pl-label { flex: none; width: 2.2em; margin: 0; }
.mv-lab .mv-vec { width: 64px; height: 40px; font-size: 16px; text-align: center; flex: none; }
.mv-lab .mv-vec.cbad { border-color: var(--bad, #c0392b); }
.mv-lab .mv-eq { overflow-x: auto; max-width: 100%; padding: 4px 0; }
.mv-lab .mv-eq .katex-display { margin: 6px 0; }
.mv-ok { color: var(--good, #1a7f37); font-weight: 700; }
.mv-bad { color: var(--bad, #c0392b); font-weight: 700; }
.mv-lab .mv-check { border-top: 1px solid var(--line-2); padding: 10px 0; }
.mv-lab .mv-check:first-child { border-top: 0; }
.mv-lab .mv-check h4 { margin: 0 0 4px; font-size: 15px; }
.mv-lab .mv-fig { width: 100%; height: auto; display: block; margin: 8px 0; }
.mv-lab .mv-fig text { font-size: 12px; fill: var(--ink-2, #555); }
.mv-lab .mv-fig .ax { stroke: var(--ink-3, #999); stroke-width: 1; }
.mv-lab .mv-fig .gr { stroke: var(--line-2, #ddd); stroke-width: 0.5; }
.mv-lab .mv-u { stroke: #2563eb; } .mv-lab .mv-v { stroke: #ea580c; } .mv-lab .mv-s { stroke: #7c3aed; }
.mv-lab .mv-fig .dash { stroke-dasharray: 4 3; stroke-width: 1.2; opacity: .8; }
.mv-lab .mv-fig .arrow { stroke-width: 2.2; fill: none; }
.mv-lab .mv-legend > span { display: inline-block; margin-right: 12px; font-size: 14px; }
.mv-lab .pl-ans-big, .mv-lab .s-math { overflow-x: auto; overflow-y: hidden; max-width: 100%; }
@media (max-width: 600px) { .mv-lab .pl-controls .seg button { min-height: 44px; } .mv-lab .mv-vec { height: 44px; } }
.mv-lab .mv-legend i { display: inline-block; width: 14px; height: 3px; vertical-align: middle; margin-right: 5px; border-radius: 2px; }
`;
  function injectStyle() {
    if (document.getElementById('mv-style')) return;
    const s = document.createElement('style');
    s.id = 'mv-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ================================================================ drawing (L1.1: arrows from the origin) */
  const svgNS = 'http://www.w3.org/2000/svg';
  const sv = (tag, attrs) => { const e = document.createElementNS(svgNS, tag); Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k])); return e; };
  /** Arrows u, v, a·u, b·v and a·u + b·v in ℝ² (or ℝ³ in an oblique view), with the parallelogram of a·u and b·v. */
  function figure(n, pts) {
    const W = 460, H = 340;
    // ℝ³: the z-axis comes towards the viewer, drawn slanted (an oblique view); x right, y up.
    const proj = p => (n === 2 ? [p[0], p[1]] : [p[0] - 0.45 * p[2], p[1] - 0.35 * p[2]]);
    const all = Object.values(pts).map(proj);
    let R = 1;
    all.forEach(([x, y]) => { R = Math.max(R, Math.abs(x), Math.abs(y)); });
    R = Math.ceil(R * 1.15);
    const sc = Math.min((W - 40) / (2 * R), (H - 40) / (2 * R));
    const X = x => W / 2 + x * sc, Y = y => H / 2 - y * sc;
    const svg = sv('svg', { class: 'mv-fig', viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Arrows u, v and a·u + b·v' });
    const defs = sv('defs', {});
    ['u', 'v', 's'].forEach(k => {
      const m = sv('marker', { id: 'mv-head-' + k, markerWidth: 8, markerHeight: 8, refX: 6, refY: 4, orient: 'auto', markerUnits: 'userSpaceOnUse' });
      m.appendChild(sv('path', { d: 'M0,0 L8,4 L0,8 z', fill: { u: '#2563eb', v: '#ea580c', s: '#7c3aed' }[k] }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);
    const step = R > 8 ? Math.ceil(R / 8) : 1;
    for (let g = -R; g <= R; g += step) {
      if (g === 0) continue;
      svg.appendChild(sv('line', { class: 'gr', x1: X(g), y1: Y(-R), x2: X(g), y2: Y(R) }));
      svg.appendChild(sv('line', { class: 'gr', x1: X(-R), y1: Y(g), x2: X(R), y2: Y(g) }));
    }
    svg.appendChild(sv('line', { class: 'ax', x1: X(-R), y1: Y(0), x2: X(R), y2: Y(0) }));
    svg.appendChild(sv('line', { class: 'ax', x1: X(0), y1: Y(-R), x2: X(0), y2: Y(R) }));
    const lbl = (x, y, t, anchor) => { const e = sv('text', { x, y, 'text-anchor': anchor || 'start' }); e.textContent = t; svg.appendChild(e); };
    lbl(X(R) - 4, Y(0) - 6, 'x₁', 'end'); lbl(X(0) + 6, Y(R) + 12, 'x₂');
    lbl(X(step) - 3, Y(0) + 14, String(step)); lbl(X(0) + 5, Y(step) + 4, String(step));
    if (n === 3) {
      const z = proj([0, 0, R]);
      svg.appendChild(sv('line', { class: 'ax', x1: X(0), y1: Y(0), x2: X(z[0]), y2: Y(z[1]) }));
      lbl(X(z[0]) - 4, Y(z[1]) + 14, 'x₃', 'end');
    }
    const line = (p, q, cls) => { const a = proj(p), b = proj(q); svg.appendChild(sv('line', { class: cls, x1: X(a[0]), y1: Y(a[1]), x2: X(b[0]), y2: Y(b[1]) })); };
    const arrow = (p, k, name) => {
      const a = proj(p);
      if (Math.abs(a[0]) < 1e-9 && Math.abs(a[1]) < 1e-9) return;
      svg.appendChild(sv('line', { class: 'arrow mv-' + k, x1: X(0), y1: Y(0), x2: X(a[0]), y2: Y(a[1]), 'marker-end': 'url(#mv-head-' + k + ')' }));
      lbl(X(a[0]) + (a[0] >= 0 ? 6 : -6), Y(a[1]) - 6, name, a[0] >= 0 ? 'start' : 'end');
    };
    // the parallelogram: a·u moved to the tip of b·v and b·v moved to the tip of a·u (L1.1 at 23:30)
    line(pts.au, pts.s, 'dash mv-v'); line(pts.bv, pts.s, 'dash mv-u');
    if (!eqNum(pts.u, pts.au)) arrow(pts.u, 'u', 'u');
    if (!eqNum(pts.v, pts.bv)) arrow(pts.v, 'v', 'v');
    arrow(pts.au, 'u', eqNum(pts.u, pts.au) ? 'u' : 'a·u'); arrow(pts.bv, 'v', eqNum(pts.v, pts.bv) ? 'v' : 'b·v'); arrow(pts.s, 's', 'a·u + b·v');
    return svg;
  }
  const eqNum = (p, q) => p.every((x, k) => Math.abs(x - q[k]) < 1e-12);

  /* ================================================================ the lab */
  function vectorsLab() {
    let root, st;
    const ctl = {}, P = {};
    const save = () => Lab.store.set(KEY, st);
    const load = () => {
      const s = Object.assign(DEF(), Lab.store.get(KEY, {}));
      if (![2, 3, 4].includes(s.n)) s.n = 2;
      if (!SPACES[s.space]) s.space = 'rn';
      s.u = pad(s.u, 4); s.v = pad(s.v, 4); s.w = pad(s.w, 4);
      return s;
    };
    const touched = () => { st.loaded = null; showSource(); };

    /* ---------------------------------------------------------- controls */
    function vecRow(name, arr, cls) {
      const row = h('div', { class: 'mv-row' });
      const lab = h('span', { class: 'pl-label' });
      Lab.setHTML(lab, tx(name) + ' =');
      row.appendChild(lab);
      for (let k = 0; k < st.n; k++) {
        const inp = h('input', { class: 'field mv-vec ' + cls, type: 'text', inputmode: 'text', 'aria-label': name + ' component ' + (k + 1), value: arr[k] });
        inp.addEventListener('input', () => { arr[k] = inp.value; touched(); draw(); save(); });
        row.appendChild(inp);
      }
      return row;
    }
    function scalarRow(name, key) {
      const row = h('div', { class: 'mv-row' });
      const lab = h('span', { class: 'pl-label' });
      Lab.setHTML(lab, tx(name) + ' =');
      const inp = h('input', { class: 'field mv-vec mv-sc', type: 'text', 'aria-label': 'scalar ' + name, value: st[key] });
      inp.addEventListener('input', () => { st[key] = inp.value; touched(); draw(); save(); });
      row.append(lab, inp);
      return row;
    }
    function buildSide() {
      Lab.clear(ctl.dyn);
      const box = ctl.dyn;
      box.appendChild(K.group('1 · How many components'));
      box.appendChild(Lab.seg([{ label: 'ℝ²', value: 2 }, { label: 'ℝ³', value: 3 }, { label: 'ℝ⁴', value: 4 }], st.n, v => { st.n = Number(v); if (st.space !== 'rn' && st.space !== 'mat') st.space = 'rn'; touched(); buildSide(); draw(); save(); }));
      box.appendChild(K.note('L1.1 at ' + at('L11', 26) + ': a vector in ℝⁿ is a list of n real numbers. Here n = ' + st.n + '.', 'pl-hint'));
      box.appendChild(K.group('2 · Your vectors and scalars'));
      box.appendChild(vecRow('u', st.u, 'mv-u-in'));
      box.appendChild(vecRow('v', st.v, 'mv-v-in'));
      box.appendChild(scalarRow('a', 'a'));
      box.appendChild(scalarRow('b', 'b'));
      ctl.msg = h('div', { class: 'pl-hint' });
      box.appendChild(ctl.msg);
      box.appendChild(K.group('3 · The set V and its operations (L3.1)'));
      const sel = h('select', { class: 'field pl-select', 'aria-label': 'The set V' });
      SPACE_KEYS.forEach(k => {
        if ((k === 'ce1' || k === 'ce2') && st.n !== 2) return;
        if (k === 'mat' && st.n !== 4) return;
        sel.appendChild(h('option', { value: k, text: SPACES[k].name(st.n) }));
      });
      if (![...sel.options].some(o => o.value === st.space)) st.space = 'rn';
      sel.value = st.space;
      sel.addEventListener('change', () => { st.space = sel.value; touched(); draw(); save(); });
      box.appendChild(h('div', { class: 'pl-field' }, sel));
      box.appendChild(K.note(st.n === 2 ? 'The two sets with a changed + are the lecture’s counter-examples in ℝ².' : st.n === 4 ? 'Four numbers can also be read as a 2×2 matrix (row by row).' : 'The lecture’s counter-examples live in ℝ²; the matrices need four numbers.', 'pl-hint'));
      box.appendChild(vecRow('w', st.w, 'mv-w-in'));
      box.appendChild(K.note('The rules of L3.1 speak of three vectors; ' + tx('w') + ' is the third one, used in rule 2.', 'pl-hint'));
    }

    /* ---------------------------------------------------------- read the state */
    function read() {
      const n = st.n;
      const sp = SPACES[st.space] || SPACES.rn;
      const d = sp.dim(n);
      const bad = [];
      const vec = (arr, name) => range(n).map(k => { const f = num(arr[k]); if (!f) bad.push(name + '₍' + (k + 1) + '₎'); return f; });
      const u = vec(st.u, 'u'), v = vec(st.v, 'v'), w = vec(st.w, 'w');
      const a = num(st.a), b = num(st.b);
      if (!a) bad.push('a');
      if (!b) bad.push('b');
      root.querySelectorAll('.mv-vec').forEach(i => i.classList.remove('cbad'));
      if (bad.length) return { err: 'Not a number: ' + bad.join(', ') + '. Type whole numbers, decimals (0.5) or fractions (−3/4).' };
      return { n, sp, d, u, v, w, a, b, x: u.slice(0, d), y: v.slice(0, d), z: w.slice(0, d) };
    }

    /* ---------------------------------------------------------- draw everything */
    function draw() {
      const r = read();
      if (ctl.msg) Lab.setHTML(ctl.msg, r.err ? '<span class="cbad">' + r.err + '</span>' : 'Whole numbers, decimals or fractions. Every result is exact.');
      if (r.err) {
        K.setAnswer(P.answer, { ev: '<span class="cbad">' + r.err + '</span>' });
        ['comb', 'axioms', 'props'].forEach(k => { Lab.clear(P[k].body); P[k].body.appendChild(K.note('This fills in as soon as every box holds a number.', 'small muted')); });
        return;
      }
      drawAnswer(r); drawComb(r); drawAxioms(r); drawProps(r);
    }

    /* ---- answer box: a·u + b·v */
    const vecT = (x) => tup(x.map(T));
    const comb = (r) => {
      const au = r.u.map(ui => r.a.mul(ui)), bv = r.v.map(vi => r.b.mul(vi));
      const s = au.map((x, k) => x.add(bv[k]));
      return { au, bv, s };
    };
    function drawAnswer(r) {
      const { au, bv, s } = comb(r);
      const work = r.u.map((ui, k) => par(r.a) + '\\cdot ' + par(ui) + '+' + par(r.b) + '\\cdot ' + par(r.v[k]));
      const ev = 'You chose ' + tx('u=' + vecT(r.u)) + ', ' + tx('v=' + vecT(r.v)) + ', ' + tx('a=' + T(r.a)) + ' and ' + tx('b=' + T(r.b)) + '. Addition is component-wise and a scalar multiplies every component (L1.1 at ' + at('L11', 11) + ' and ' + at('L11', 19) + '), so:';
      const big = r.n === 2 ? al('a\\,u+b\\,v=' + tup(work) + '=' + vecT(s))
        : '\\begin{aligned}' + work.map((wk, k) => '(a\\,u+b\\,v)_' + (k + 1) + '&=' + wk + '=' + T(s[k]) + '\\\\').join('') + 'a\\,u+b\\,v&=' + vecT(s) + '\\end{aligned}';
      const sub = 'Component ' + tx('i') + ' of ' + tx('a\\,u+b\\,v') + ' is ' + tx('a\\,u_i+b\\,v_i') + '. ' + (r.n <= 3 ? 'The drawing below shows ' + tx('u') + ', ' + tx('v') + ', their multiples and the sum as arrows from the origin (L1.1 at ' + at('L11', 22) + ').' : 'With four components there is no arrow to draw (L1.1 at ' + at('L11', 26.5) + ': “you cannot really think of this in terms of arrows and geometry”), only the list.');
      K.setAnswer(P.answer, { ev, big, sub });
    }

    /* ---- panel: the combination, component by component, with the drawing */
    function drawComb(r) {
      const body = P.comb.body;
      Lab.clear(body);
      const { au, bv, s } = comb(r);
      P.comb.sub('L1.1 at ' + at('L11', 19) + ': ' + tx('c\\,(v_1,\\dots,v_n)=(c\\,v_1,\\dots,c\\,v_n)') + '; at ' + at('L11', 11) + ': vectors are added component-wise.');
      const steps = [
        { html: 'Scale ' + tx('u') + ' by ' + tx('a=' + T(r.a)) + ': every component is multiplied by ' + tx(T(r.a)) + '.', math: al('a\\,u=' + T(r.a) + '\\cdot' + vecT(r.u) + '=' + tup(r.u.map(ui => par(r.a) + '\\cdot ' + par(ui))) + '=' + vecT(au)) },
        { html: 'Scale ' + tx('v') + ' by ' + tx('b=' + T(r.b)) + '.', math: al('b\\,v=' + T(r.b) + '\\cdot' + vecT(r.v) + '=' + tup(r.v.map(vi => par(r.b) + '\\cdot ' + par(vi))) + '=' + vecT(bv)) },
        { html: 'Add the two results component by component.', math: al('a\\,u+b\\,v=' + vecT(au) + '+' + vecT(bv) + '=' + tup(au.map((x, k) => T(x) + '+' + par(bv[k]))) + '=' + vecT(s)) },
      ];
      body.appendChild(K.steps(steps));
      if (r.n <= 3) {
        const num3 = x => x.map(Number);
        body.appendChild(figure(r.n, { u: num3(r.u), v: num3(r.v), au: num3(au), bv: num3(bv), s: num3(s) }));
        const leg = h('div', { class: 'mv-legend' });
        leg.appendChild(h('span', { html: '<i style="background:#2563eb"></i>' + tx('u') + ' and ' + tx('a\\,u') }));
        leg.appendChild(h('span', { html: '<i style="background:#ea580c"></i>' + tx('v') + ' and ' + tx('b\\,v') }));
        leg.appendChild(h('span', { html: '<i style="background:#7c3aed"></i>' + tx('a\\,u+b\\,v') }));
        body.appendChild(leg);
        body.appendChild(K.note('Each arrow starts at the origin and ends at the point with the same numbers (L1.1 at ' + at('L11', 22) + '). The dashed lines complete the parallelogram of ' + tx('a\\,u') + ' and ' + tx('b\\,v') + ': ' + tx('b\\,v') + ' moved to start at the tip of ' + tx('a\\,u') + ', and ' + tx('a\\,u') + ' moved to the tip of ' + tx('b\\,v') + '. Its far corner is the sum (L1.1 at ' + at('L11', 23.5) + ').' + (r.n === 3 ? ' In ℝ³ the ' + tx('x_3') + ' axis is drawn slanted towards you, so the picture is a flat view of space.' : ''), 'small muted'));
      }
    }

    /* ---- panel: the ten checks */
    const names = { x: 'u', y: 'v', z: 'w' };
    function drawAxioms(r) {
      const body = P.axioms.body;
      Lab.clear(body);
      const sp = r.sp;
      P.axioms.sub('L3.1 at ' + at('L31', 6) + ': a vector space is a set ' + tx('V') + ' with two functions, ' + tx('+:V\\times V\\to V') + ' and ' + tx('\\cdot:\\mathbb{R}\\times V\\to V') + ', that satisfy rules 1 to 8 (' + at('L31', 8) + ' to ' + at('L31', 11.5) + '). Here ' + tx('V') + ' is <b>' + sp.name(r.n) + '</b>, with ' + tx(sp.addRule) + ' and ' + tx(sp.mulRule) + '.');
      body.appendChild(K.note('Source: ' + sp.src() + ' Your elements: ' + tx('u=' + sp.show(r.x.map(T))) + ', ' + tx('v=' + sp.show(r.y.map(T))) + ', ' + tx('w=' + sp.show(r.z.map(T))) + '; scalars ' + tx('a=' + T(r.a)) + ', ' + tx('b=' + T(r.b)) + '.', 'small'));
      const res = runChecks(sp, r.x, r.y, r.z, r.a, r.b);
      const failed = res.filter(c => !c.ok);
      body.appendChild(K.note(failed.length ? '<b>Not a vector space:</b> ' + failed.length + ' of the 10 checks fail (' + failed.map(c => c.short).join(', ') + '). One failing rule is enough.' : '<b>All 10 checks pass with your elements' + (sp.fails.length ? '' : ', and they hold for every choice') + ':</b> ' + (sp.fails.length ? 'but the rules must hold for all elements, and the lecture’s failing elements are shown below.' : sp.name(r.n) + ' is a vector space, as L3.1 says.'), 'pl-hint'));
      const list = h('div', { class: 'mv-checks' });
      res.forEach(c => {
        const d = h('div', { class: 'mv-check' });
        d.appendChild(h('h4', { html: c.title + ' ' + (c.ok ? ok : bad) }));
        d.appendChild(K.note(c.rule, 'small muted'));
        c.lines.forEach(l => d.appendChild(h('div', { class: 'mv-eq', html: Lab.tex(al(l), true) })));
        if (c.note) d.appendChild(K.note(c.note, 'small'));
        list.appendChild(d);
      });
      body.appendChild(list);
    }
    /** The ten checks with concrete elements. Each returns {title, short, rule, lines, ok, note}. */
    function runChecks(sp, x, y, z, a, b) {
      const show = sp.show;
      const S = l => show(l.map(T));
      const W = l => show(l.map(o => o.w));
      const V = l => l.map(o => o.v);
      const zero = range(sp.dim(x.length)).map(() => F(0));
      const nm = (k) => names[k];
      const same = (p, q) => eqList(p, q);
      const verdict = (p, q, L, R) => (same(p, q) ? 'Both sides are ' + tx(S(p)) + '. ' : tx(S(p)) + ' is not ' + tx(S(q)) + ': ' + L + ' and ' + R + ' differ. ');
      const checks = [];
      // closure
      { const s = sp.add(x, y); checks.push({ title: 'Closure of +: u + v is in V', short: 'closure of +', ok: true, rule: tx('+') + ' must give one element of ' + tx('V') + ' for every pair (L3.1 at ' + at('L31', 7) + ').', lines: ['u+v=' + S(x) + '+' + S(y) + '=' + W(s) + '=' + S(V(s))], note: 'A list of ' + zero.length + ' real numbers, so it is in ' + tx('V') + '.' }); }
      { const s = sp.mul(a, x); checks.push({ title: 'Closure of ·: a·u is in V', short: 'closure of ·', ok: true, rule: tx('\\cdot') + ' must give one element of ' + tx('V') + ' for every scalar and element (L3.1 at ' + at('L31', 7) + ').', lines: ['a\\,u=' + T(a) + '\\cdot' + S(x) + '=' + W(s) + '=' + S(V(s))], note: 'A list of ' + zero.length + ' real numbers, so it is in ' + tx('V') + '.' }); }
      const rule = (k, title, short, ruleTex, fn) => {
        const own = fn(x, y, z, a, b, 'u', 'v', 'w');
        let note = '';
        let okAll = own.ok;
        if (own.ok && sp.fails.includes(k)) {
          const wit = witness(fn, zero.length);
          if (wit) { okAll = false; note = 'With your elements both sides agree, but the rule must hold for <b>every</b> choice. It fails for ' + wit.text + ':'; own.lines = own.lines.concat(wit.lines); }
        }
        checks.push({ title: 'Rule ' + k + ': ' + title, short: 'rule ' + k, ok: okAll, rule: tx(ruleTex) + ' (L3.1 at ' + at('L31', [0, 8, 8.5, 9, 9.5, 9.75, 10, 10.75, 11.25][k]) + ').', lines: own.lines, note: (own.note || '') + note });
      };
      const two = (fn) => (x, y, z, a, b, X, Y, Z) => fn(x, y, z, a, b, X, Y, Z);
      rule(1, 'u + v = v + u', '', 'v_1+v_2=v_2+v_1', two((x, y, z, a, b, X, Y) => {
        const l = sp.add(x, y), rr = sp.add(y, x);
        return { ok: same(V(l), V(rr)), lines: [X + '+' + Y + '=' + W(l) + '=' + S(V(l)), Y + '+' + X + '=' + W(rr) + '=' + S(V(rr))], note: verdict(V(l), V(rr), tx(X + '+' + Y), tx(Y + '+' + X)) };
      }));
      rule(2, '(u + v) + w = u + (v + w)', '', '(v_1+v_2)+v_3=v_1+(v_2+v_3)', (x, y, z, a, b, X, Y, Z) => {
        const l1 = sp.add(x, y), l = sp.add(V(l1), z), r1 = sp.add(y, z), rr = sp.add(x, V(r1));
        return { ok: same(V(l), V(rr)), lines: ['(' + X + '+' + Y + ')+' + Z + '=' + S(V(l1)) + '+' + S(z) + '=' + W(l) + '=' + S(V(l)), X + '+(' + Y + '+' + Z + ')=' + S(x) + '+' + S(V(r1)) + '=' + W(rr) + '=' + S(V(rr))], note: verdict(V(l), V(rr), tx('(' + X + '+' + Y + ')+' + Z), tx(X + '+(' + Y + '+' + Z + ')')) };
      });
      rule(3, 'there is a 0 with v + 0 = v', '', '\\exists\\,0\\in V:\\ v+0=v\\ \\text{for every } v', (x, y, z, a, b, X) => {
        const s = sp.add(x, zero);
        const okk = same(V(s), x);
        let note = okk ? 'Adding the zero list gives back ' + tx(X) + '. ' : tx(X + '+0=' + S(V(s))) + ' is not ' + tx(X + '=' + S(x)) + '. ';
        if (!okk && sp === SPACES.ce2) note += 'No other element can work either: with this +, the second coordinate of ' + tx(X + '+e') + ' is 0 for every ' + tx('e') + ', but the second coordinate of ' + tx(X) + ' is ' + tx(T(x[1])) + '.';
        return { ok: okk, lines: [X + '+0=' + S(x) + '+' + S(zero) + '=' + W(s) + '=' + S(V(s))], note };
      });
      rule(4, 'every v has a v′ with v + v′ = 0', '', '\\forall v\\ \\exists\\,v\'\\in V:\\ v+v\'=0', (x, y, z, a, b, X) => {
        const ng = sp.neg(x), s = sp.add(x, ng);
        const zeroOk = same(V(sp.add(x, zero)), x);
        const okk = same(V(s), zero) && (zeroOk || sp.fails.indexOf(3) < 0);
        const note = (sp === SPACES.ce1 ? 'With this +, the candidate is ' + tx('v\'=(-x_1,\\ x_2)') + ', not ' + tx('(-x_1,-x_2)') + ': the second coordinates are subtracted. ' : 'The candidate is ' + tx('v\'=-' + X) + ', every component with its sign changed. ')
          + (same(V(s), zero) ? 'The sum is the zero list' + (okk ? '. ' : ', but rule 3 failed: there is no 0 in ' + tx('V') + ' for ' + tx('v\'') + ' to reach, so rule 4 cannot hold. ') : 'The sum ' + tx(S(V(s))) + ' is not 0. ');
        return { ok: okk, lines: [X + '+v\'=' + S(x) + '+' + S(ng) + '=' + W(s) + '=' + S(V(s))], note };
      });
      rule(5, '1·v = v', '', '1\\cdot v=v', (x, y, z, a, b, X) => {
        const s = sp.mul(F(1), x);
        return { ok: same(V(s), x), lines: ['1\\cdot ' + X + '=1\\cdot' + S(x) + '=' + W(s) + '=' + S(V(s))], note: same(V(s), x) ? 'The result is ' + tx(X) + ' itself. ' : tx(S(V(s))) + ' is not ' + tx(X + '=' + S(x)) + '. ' };
      });
      rule(6, '(ab)·v = a·(b·v)', '', '(ab)\\cdot v=a\\cdot(b\\cdot v)', (x, y, z, a, b, X) => {
        const ab = a.mul(b), l = sp.mul(ab, x), r1 = sp.mul(b, x), rr = sp.mul(a, V(r1));
        return { ok: same(V(l), V(rr)), lines: ['(ab)\\,' + X + '=(' + T(a) + '\\cdot' + par(b) + ')\\,' + X + '=' + T(ab) + '\\cdot' + S(x) + '=' + W(l) + '=' + S(V(l)), 'a\\,(b\\,' + X + ')=' + T(a) + '\\cdot' + S(V(r1)) + '=' + W(rr) + '=' + S(V(rr))], note: verdict(V(l), V(rr), tx('(ab)\\,' + X), tx('a\\,(b\\,' + X + ')')) };
      });
      rule(7, 'a·(u + v) = a·u + a·v', '', 'a\\cdot(v_1+v_2)=a\\cdot v_1+a\\cdot v_2', (x, y, z, a, b, X, Y) => {
        const s = sp.add(x, y), l = sp.mul(a, V(s)), r1 = sp.mul(a, x), r2 = sp.mul(a, y), rr = sp.add(V(r1), V(r2));
        return { ok: same(V(l), V(rr)), lines: ['a\\,(' + X + '+' + Y + ')=' + T(a) + '\\cdot' + S(V(s)) + '=' + W(l) + '=' + S(V(l)), 'a\\,' + X + '+a\\,' + Y + '=' + S(V(r1)) + '+' + S(V(r2)) + '=' + W(rr) + '=' + S(V(rr))], note: verdict(V(l), V(rr), tx('a\\,(' + X + '+' + Y + ')'), tx('a\\,' + X + '+a\\,' + Y)) };
      });
      rule(8, '(a + b)·v = a·v + b·v', '', '(a+b)\\cdot v=a\\cdot v+b\\cdot v', (x, y, z, a, b, X) => {
        const apb = a.add(b), l = sp.mul(apb, x), r1 = sp.mul(a, x), r2 = sp.mul(b, x), rr = sp.add(V(r1), V(r2));
        return { ok: same(V(l), V(rr)), lines: ['(a+b)\\,' + X + '=(' + T(a) + '+' + par(b) + ')\\,' + X + '=' + T(apb) + '\\cdot' + S(x) + '=' + W(l) + '=' + S(V(l)), 'a\\,' + X + '+b\\,' + X + '=' + S(V(r1)) + '+' + S(V(r2)) + '=' + W(rr) + '=' + S(V(rr))], note: verdict(V(l), V(rr), tx('(a+b)\\,' + X), tx('a\\,' + X + '+b\\,' + X)) };
      });
      return checks;
    }
    /** Elements that break a rule the lecture says fails, when the learner's own happen to satisfy it. */
    function witness(fn, dim) {
      const pool = [[1, 1], [0, 0], [1, 2], [2, 1], [0, 1], [1, 0]].map(p => range(dim).map(k => F(p[k] || 0)));
      const scal = [F(2), F(3)];
      for (const x of pool) for (const y of pool) for (const z of pool) for (const a of scal) for (const b of scal) {
        const r = fn(x, y, z, a, b, 'x', 'y', 'z');
        if (!r.ok) {
          const sp = SPACES[st.space] || SPACES.rn;
          return { lines: r.lines, text: tx('x=' + sp.show(x.map(T))) + ', ' + tx('y=' + sp.show(y.map(T))) + ', ' + tx('z=' + sp.show(z.map(T))) + ', ' + tx('a=' + T(a)) + ', ' + tx('b=' + T(b)) };
        }
      }
      return null;
    }

    /* ---- panel: properties of L3.2, in ℝⁿ with the usual operations */
    function drawProps(r) {
      const body = P.props.body;
      Lab.clear(body);
      const sp = SPACES.rn;
      const n = r.n, u = r.u, v = r.v, w = r.w, a = r.a;
      const S = l => tup(l.map(T));
      const W = l => tup(l.map(o => o.w));
      const V = l => l.map(o => o.v);
      const zero = range(n).map(() => F(0));
      P.props.sub('L3.2 proves these from the eight rules alone, “because really I do not know anything else” (' + at('L32', 4.5) + '). Here they are checked in ' + tx('\\mathbb{R}^' + n) + ' with the usual operations and your ' + tx('u') + ', ' + tx('v') + ', ' + tx('w') + ' and ' + tx('a') + '.');
      const steps = [];
      // cancellation law
      { const uw = sp.add(u, w), vw = sp.add(v, w), nw = sp.neg(w), back = sp.add(V(uw), nw);
        const sameUV = eqList(u, v);
        steps.push({ html: '<b>Cancellation law</b> (L3.2 at ' + at('L32', 0.5) + '): if ' + tx('v_1+v_3=v_2+v_3') + ' then ' + tx('v_1=v_2') + '. The proof adds ' + tx('v_3\'') + ', the negative of ' + tx('v_3') + ', to both sides (' + at('L32', 3.5) + '). With your ' + tx('u') + ', ' + tx('v') + ' and ' + tx('w') + ':',
          math: '\\begin{aligned}u+w&=' + W(uw) + '\\\\&=' + S(V(uw)) + '\\\\ v+w&=' + W(vw) + '\\\\&=' + S(V(vw)) + '\\end{aligned}',
          note: (eqList(V(uw), V(vw)) ? 'The two sums are equal, so the law says ' + tx('u=v') + ': indeed ' + tx('u=v=' + S(u)) + '. ' : 'The two sums differ, so nothing is cancelled here (' + tx('u\\ne v') + '). ') + 'The mechanism: adding ' + tx('w\'=-w=' + S(nw)) + ' to ' + tx('u+w') + ' gives ' + tx('(u+w)+w\'=' + S(V(uw)) + '+' + S(nw) + '=' + W(back) + '=' + S(V(back))) + ', which is ' + tx('u') + ' again' + (sameUV ? '.' : ', and the same step turns ' + tx('v+w') + ' back into ' + tx('v') + '.') });
      }
      // uniqueness of 0
      { const diff = u.map(ui => ({ v: ui.sub(ui), w: T(ui) + '-' + par(ui) }));
        steps.push({ html: '<b>The vector 0 is unique</b> (L3.2 at ' + at('L32', 5) + ', proof at ' + at('L32', 6) + '): if some ' + tx('w_0') + ' also satisfies ' + tx('v+w_0=v') + ' for every ' + tx('v') + ', then ' + tx('v+w_0=v+0') + ', and cancelling ' + tx('v') + ' gives ' + tx('w_0=0') + '. With your ' + tx('u=' + S(u)) + ': component ' + tx('i') + ' of ' + tx('w_0') + ' must satisfy ' + tx('u_i+w_{0,i}=u_i') + ', so',
          math: al('w_0=' + W(diff) + '=' + S(V(diff)) + '=0') });
      }
      // 0·v = 0
      { const s = sp.mul(F(0), u);
        steps.push({ html: '<b>' + tx('0\\cdot v=0') + '</b> for every ' + tx('v') + ' (L3.2 at ' + at('L32', 8) + ', proof at ' + at('L32', 8.75) + ': ' + tx('(0+0)\\,v=0\\,v+0\\,v') + ' and ' + tx('(0+0)\\,v=0\\,v') + ', then cancel ' + tx('0\\,v') + '). With your ' + tx('u') + ':',
          math: al('0\\cdot u=0\\cdot' + S(u) + '=' + W(s) + '=' + S(V(s)) + '=0'), note: eqList(V(s), zero) ? 'Every component is ' + tx('0\\cdot u_i=0') + '. ' + ok : '' });
      }
      // (−c)v = −(cv) = c(−v), with c = a
      { const na = a.neg(), l = sp.mul(na, u), m1 = sp.mul(a, u), m = sp.neg(V(m1)), nu = sp.neg(u), rr = sp.mul(a, nu);
        const all = eqList(V(l), m) && eqList(m, V(rr));
        steps.push({ html: '<b>' + tx('(-c)\\,v=-(c\\,v)=c\\,(-v)') + '</b> (L3.2 at ' + at('L32', 9.5) + '): since ' + tx('c\\,v+(-c)\\,v=(c+(-c))\\,v=0\\,v=0') + ', the vector ' + tx('(-c)\\,v') + ' is the negative of ' + tx('c\\,v') + '. With ' + tx('c=a=' + T(a)) + ' and your ' + tx('u') + ':',
          math: '\\begin{aligned}(-a)\\,u&=' + T(na) + '\\cdot' + S(u) + '\\\\&=' + W(l) + '\\\\&=' + S(V(l)) + '\\\\ -(a\\,u)&=-' + S(V(m1)) + '\\\\&=' + S(m) + '\\\\ a\\,(-u)&=' + T(a) + '\\cdot' + S(nu) + '\\\\&=' + W(rr) + '\\\\&=' + S(V(rr)) + '\\end{aligned}',
          note: (all ? 'All three are ' + tx(S(m)) + '. ' + ok : 'They differ ' + bad) + (a.eq(1) ? ' With ' + tx('c=1') + ' this is ' + tx('(-1)\\,u=-u') + ': the negative of ' + tx('u') + ' is ' + tx('-1') + ' times ' + tx('u') + '.' : ' With ' + tx('c=1') + ' it says ' + tx('(-1)\\,v=-v') + '.') });
      }
      // c·0 = 0
      { const s = sp.mul(a, zero);
        steps.push({ html: '<b>' + tx('c\\cdot 0=0') + '</b> for every scalar ' + tx('c') + ' (L3.2 at ' + at('L32', 10.5) + ', “in a very similar spirit”, left to you). With ' + tx('c=a=' + T(a)) + ':',
          math: al('a\\cdot 0=' + T(a) + '\\cdot' + S(zero) + '=' + W(s) + '=' + S(V(s)) + '=0') });
      }
      body.appendChild(K.steps(steps));
    }

    /* ---------------------------------------------------------- presets, reset, mount */
    function loadPreset(p) {
      Object.assign(st, pick(p), { loaded: p.label });
      buildSide(); draw(); save(); showSource();
    }
    function showSource() {
      const k = PRESETS.findIndex(p => p.label === st.loaded);
      if (!ctl.pre) return;
      ctl.pre.select.value = k >= 0 ? String(k) : '';
      Lab.setHTML(ctl.pre.lastChild, k >= 0 ? 'From: ' + PRESETS[k].source : '');
    }
    function reset() {
      Lab.store.set(KEY, {});
      st = DEF();
      buildSide(); draw(); showSource();
    }
    function mount(el) {
      injectStyle();
      root = el;
      st = load();
      const { side, main } = K.layout(root, 'mv-lab');
      side.appendChild(K.group('Examples'));
      ctl.pre = K.presets({ label: 'From the lectures', items: PRESETS, onPick: loadPreset });
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 'mv-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', reset, 'btn ghost sm')));
      P.answer = K.answer();
      P.comb = K.panel('Your combination a·u + b·v');
      P.axioms = K.panel('Is V a vector space? The ten checks');
      P.props = K.panel('Properties that follow from the rules (L3.2)');
      main.append(P.answer, P.comb, P.axioms, P.props);
      root.__mv = { get st() { return st; } };
      buildSide(); draw(); showSource();
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-m2-vectors', course: 'm2', week: 1, weeks: [1, 3], order: 1,
    title: 'Vectors and vector spaces lab', sub: 'Weeks 1 and 3 · L1.1, L3.1–L3.2',
    topics: ['vectors as lists', 'component-wise addition', 'scalar multiplication', 'parallelogram law', 'vector space', 'the eight rules', 'counter-examples', 'cancellation law', '0·v = 0', '(−1)·v = −v'],
    desc: 'Type two vectors u, v in ℝ², ℝ³ or ℝ⁴ and two scalars a, b. See a·u + b·v component by component and as arrows. Then pick a set V with its + and · from L3.1 (ℝⁿ, 2×2 matrices, or the lecture’s two changed additions) and watch the ten checks of the vector-space definition run on your own elements, every failure with the elements that break it, and the properties of L3.2 with your numbers.',
    render: el => vectorsLab().mount(el),
  });
})();
