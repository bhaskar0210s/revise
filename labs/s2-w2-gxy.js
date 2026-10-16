/* Playground lab (s2-w2-gxy) — Function of two random variables lab: Z = g(X, Y).  Week 2 · L2.6–L2.7.
   (X, Y) from a typed joint table (K.gridEditor) or two independent distributions (two K.distPicker).
   g(x, y) is typed (K.exprField). Panels: answer, the grid of points (x, y) with g-values, the contour g = c or the
   region g ≤ c drawn on the whole plane, PMF and CDF of Z, PMF and CDF of the inputs X and Y (margins of the table
   or the chosen distributions), where f_XY comes from, the table method (pairs → contours → sums), and the CDF of Z
   built from regions. Uses Lab.t4a (helpers from labs/s2-w2-gx.js). */
(function () {
  'use strict';
  const { h, svg, F, T } = Lab;
  const K = Lab.play;
  const tex = (s, d) => Lab.tex(s, d);
  const isF = v => v instanceof Lab.Frac;
  const STORE = 'lab:s2-gxy';
  const LEC_TABLE = { xs: ['0', '1'], ys: ['0', '1', '2'], cells: [['1/2', '1/16'], ['1/4', '1/32'], ['1/8', '1/32']] };
  const DEFAULTS = () => ({
    src: 'table', table: LEC_TABLE,
    dx: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } }, custom: null },
    dy: { fam: 'uniform', params: { uniform: { a: 1, b: 6 } }, custom: null },
    g: 'max(x,y)', mode: 'contour', c: 1, levels: true, useD: null,
  });
  const QUICK = [['x+y', 'x+y'], ['x-y', 'x-y'], ['max(x,y)', '\\max(x,y)'], ['min(x,y)', '\\min(x,y)'], ['x*y', 'x\\cdot y'], ['abs(x-y)', '|x-y|'], ['x^2+y^2', 'x^2+y^2']];
  const dice = { fam: 'uniform', q: { a: 1, b: 6 } };
  const bit = { fam: 'uniform', q: { a: 0, b: 1 } };
  /* L2.10 example 2 (min 03–06): length L ~ Uniform{5, 7, 9, 11}; given L = l, breadth B ~ Uniform{l−3, l−2, l−1}.
     Joint = marginal × conditional = 1/4 · 1/3 = 1/12 on the 12 pairs; X = L across, Y = B down. */
  const RECT = (() => {
    const ls = [5, 7, 9, 11], bs = [2, 3, 4, 5, 6, 7, 8, 9, 10];
    return { xs: ls.map(String), ys: bs.map(String), cells: bs.map(b => ls.map(l => (b >= l - 3 && b <= l - 1 ? '1/12' : '0'))) };
  })();
  const LESSON = 'The L2.7 lesson (not a lecture slide)';
  const PRESETS = [
    { label: 'L2.6 · X, Y i.i.d. Uniform{0,1}, Z = X + Y', src: 'indep', dx: bit, dy: bit, g: 'x+y', c: 1, mode: 'contour',
      source: T`L2.6, example 1 (min 01–03): \(X,Y\) i.i.d. Uniform\(\{0,1\}\), so each pair has \(\tfrac12\cdot\tfrac12=\tfrac14\). The lecture gets \(P(Z=0)=\tfrac14\), \(P(Z=1)=\tfrac14+\tfrac14=\tfrac12\), \(P(Z=2)=\tfrac14\).` },
    { label: 'L2.6 · the lecture’s joint table, Z = max(X, Y)', src: 'table', table: LEC_TABLE, g: 'max(x,y)', c: 1, mode: 'contour',
      source: T`L2.6, example 2 (min 03–06): the joint PMF given in the lecture. \(P(Z=0)=\tfrac12\), \(P(Z=1)=\tfrac14+\tfrac1{16}+\tfrac1{32}=\tfrac{11}{32}\), \(P(Z=2)=\tfrac18+\tfrac1{32}=\tfrac5{32}\).` },
    { label: LESSON + ' · two dice, Z = X + Y', src: 'indep', dx: dice, dy: dice, g: 'x+y', c: 7, mode: 'contour',
      source: T`The L2.7 lesson, card “Back to random variables: contours on the dice grid”, not a lecture slide: the L2.7 lecture draws \(x+y=c\) on the plane (min 04–07) and uses no dice. On the dice grid the contours of \(x+y\) are lines of slope \(-1\); \(x+y=7\) passes through 6 of the 36 points, so \(P(Z=7)=\tfrac6{36}\). The lecture that works out the sum of two dice is L2.8 (min 02–12).` },
    { label: LESSON + ' · two dice, Z = max(X, Y)', src: 'indep', dx: dice, dy: dice, g: 'max(x,y)', c: 4, mode: 'contour',
      source: T`The L2.7 lesson (dice-grid card), not a lecture slide: the L2.7 lecture draws the L-shaped contour \(\max(x,y)=c\) on the plane (min 07–08, with \(c=2\)): corner at \((c,c)\), arms going left and down. On the dice grid \(\max(x,y)=4\) meets 7 points, so \(P(Z=4)=\tfrac7{36}\). The lecture that works out the max of two dice is L2.9 (min 00–03).` },
    { label: LESSON + ' · two dice, Z = min(X, Y)', src: 'indep', dx: dice, dy: dice, g: 'min(x,y)', c: 3, mode: 'contour',
      source: T`The L2.7 lesson (dice-grid card), not a lecture slide: the L2.7 lecture draws the L-shaped contour \(\min(x,y)=c\) on the plane (min 09–10, with \(c=2\)): corner at \((c,c)\), arms going right and up. On the dice grid \(\min(x,y)=3\) meets 7 points, so \(P(Z=3)=\tfrac7{36}\). The lecture that works out the min of two dice is L2.11 (min 04–06).` },
    { label: LESSON + ' · two dice, Z = X² + Y² (circles)', src: 'indep', dx: dice, dy: dice, g: 'x^2+y^2', c: 25, mode: 'contour',
      source: T`The L2.7 lesson (dice-grid card and its check question), not a lecture slide: the L2.7 lecture shows the circles \(x^2+y^2=c\) "just for fun" (min 09), on the plane. On the dice grid only \((3,4)\) and \((4,3)\) lie on \(x^2+y^2=25\), so \(P(Z=25)=\tfrac{2}{36}=\tfrac1{18}\).` },
    { label: 'L2.10 (min 03–06) · random rectangle, area Z = X·Y', src: 'table', table: RECT, g: 'x*y', c: 20, mode: 'contour',
      source: T`L2.10, example 2 (min 03–06), a random rectangle: the length \(L\sim\text{Uniform}\{5,7,9,11\}\); given \(L=l\), the breadth \(B\) is uniform on \(\{l-3,\,l-2,\,l-1\}\). Here \(X=L\) (across) and \(Y=B\) (down). \(B\) is chosen after \(L\) and depends on it, so the joint table is typed, not built from two independent PMFs: marginal × conditional, \(f(l,b)=\tfrac14\cdot\tfrac13=\tfrac1{12}\) in the 12 cells with \(b\in\{l-3,l-2,l-1\}\), and 0 in the other 24. The area \(Z=XY\) takes 12 different values \(10,15,20,28,35,42,54,63,72,88,99,110\), each with probability \(\tfrac1{12}\) (the lecture: \(P(A=20)=P(A=72)=\tfrac1{12}\)).` },
  ];

  function gxyLab(host) {
    const U = Lab.t4a;
    if (!U || !U.exprTex) { host.appendChild(h('div', { class: 'callout warn', text: 'This lab needs the helpers in labs/s2-w2-gx.js, which did not load.' })); return; }
    const saved = Lab.store.get(STORE, null) || {};
    const D0 = DEFAULTS();
    const st = Object.assign(D0, saved);
    st.dx = Object.assign(DEFAULTS().dx, saved.dx || {});
    st.dy = Object.assign(DEFAULTS().dy, saved.dy || {});
    const save = () => Lab.store.set(STORE, { src: st.src, table: st.table, dx: st.dx, dy: st.dy, g: st.g, mode: st.mode, c: st.c, levels: st.levels, useD: st.useD });
    let tableIn = null, xIn = null, yIn = null, gSrc = null, model = null, batch = false, pendingC = null, G = null, hoverLock = false;

    const { side, main } = K.layout(host, 'gxy-lab');
    host.classList.add('t4-lab');

    /* ---------------- controls */
    side.appendChild(K.group('1 · Your pair (X, Y)'));
    const srcSeg = Lab.seg([{ label: 'Type the joint table', value: 'table' }, { label: 'X and Y independent', value: 'indep' }], st.src, v => { setSrc(v); if (!batch) { clearPreset(); update(); } });
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Where does the joint PMF come from?' }), srcSeg));
    const tableBox = h('div', { class: 'pl-field' });
    const grid = K.gridEditor({ label: 'Joint PMF ' + tex('f_{XY}(x,y)') + ' — ' + tex('X') + ' across, ' + tex('Y') + ' down', xs: st.table.xs, ys: st.table.ys, cells: st.table.cells, onChange: r => onTable(r) });
    tableBox.append(grid, K.note('Cells accept ' + tex('\\tfrac18') + ' as <code>1/8</code>, or <code>0.125</code>. Labels must be numbers.', 'pl-hint'));
    const indepBox = h('div', { class: 'pl-field t4-indep' });
    const pickX = K.distPicker({ label: 'Distribution of ' + tex('X'), value: st.dx.fam, params: JSON.parse(JSON.stringify(st.dx.params || {})), custom: st.dx.custom || undefined, xName: 'X', onChange: r => onPick('x', r) });
    const pickY = K.distPicker({ label: 'Distribution of ' + tex('Y'), value: st.dy.fam, params: JSON.parse(JSON.stringify(st.dy.params || {})), custom: st.dy.custom || undefined, xName: 'Y', onChange: r => onPick('y', r) });
    indepBox.append(pickX, pickY, K.note('Independent: every cell of the joint table is ' + tex('f_{XY}(x,y)=f_X(x)\\,f_Y(y)') + '.', 'pl-hint'));
    side.append(tableBox, indepBox);
    side.appendChild(K.group('2 · Your function g'));
    const gField = K.exprField({ label: 'Type ' + tex('g(x,y)') + ' using ' + tex('x') + ' and ' + tex('y'), value: st.g, vars: ['x', 'y'], placeholder: 'e.g. max(x,y)', onChange: (fn, src) => onG(fn, src) });
    const chips = h('div', { class: 'pl-chips t4-chips' });
    QUICK.forEach(([src, t]) => chips.appendChild(Lab.button(tex(t), () => gField.set(src), 'btn xs')));
    side.append(gField, K.note('Quick choices:', 'pl-hint'), chips);
    side.appendChild(K.group('3 · Contour or region at level c'));
    const modeSeg = Lab.seg([{ label: 'Contour ' + tex('g=c'), value: 'contour' }, { label: 'Region ' + tex('g\\le c'), value: 'region' }], st.mode, v => { st.mode = v; save(); if (model) drawC(); });
    modeSeg.classList.add('gxy-mode');
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Show the points where' }), modeSeg));
    const cBox = makeCControl();
    side.appendChild(cBox.el);
    const lvToggle = K.toggle({ label: 'Draw every other contour ' + tex('g=z') + ' faintly', value: st.levels, onChange: v => { st.levels = v; save(); if (model) drawC(); } });
    side.appendChild(lvToggle);
    side.appendChild(K.group('4 · Lecture and lesson examples'));
    const presetBox = K.presets({ label: 'Lecture and lesson examples', items: PRESETS, onPick: it => applyPreset(it) });
    side.appendChild(presetBox);
    side.appendChild(K.group('5 · Fractions'));
    const dToggle = K.toggle({ label: '', value: true, onChange: v => { st.useD = v; save(); if (model) drawAll(); } });
    const dNote = K.note('', 'pl-hint');
    side.append(dToggle, dNote);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); gxyLab(host); }, 'btn ghost sm')));

    /* ---------------- panels */
    const msg = h('div', { class: 't4-msg', hidden: true });
    const ans = K.answer();
    const P = {
      grid: K.panel('The grid of points ' + tex('(x,y)') + ' and the level ' + tex('c'), 'One dot per pair; its size shows ' + tex('f_{XY}(x,y)') + ' and the teal number is ' + tex('g(x,y)') + '. The violet curve is the contour ' + tex('g(x,y)=c') + ' on the whole plane (L2.7). Tap a dot to move ' + tex('c') + ' to its value.'),
      pmf: K.panel('PMF and CDF of ' + tex('Z=g(X,Y)'), 'Tap a bar to move ' + tex('c') + ' there. The CDF’s ' + tex('t') + ' moves ' + tex('c') + ' too.'),
      inputs: K.panel('PMF and CDF of ' + tex('X') + ' and of ' + tex('Y') + ', the inputs of ' + tex('g')),
      joint: K.panel('Your joint PMF ' + tex('f_{XY}')),
      table: K.panel('How the PMF of ' + tex('Z') + ' is computed: the table method', 'As in L2.6: list every pair with its probability and its value of ' + tex('z=g(x,y)') + ', then add the pairs that share a value. Each group of pairs is one contour.'),
      cdf: K.panel('The CDF of ' + tex('Z') + ' from regions', tex('F_Z(c)=P(Z\\le c)=P\\big(g(X,Y)\\le c\\big)') + ': add ' + tex('f_{XY}') + ' over the region ' + tex('\\{(x,y):g(x,y)\\le c\\}') + '. Moving ' + tex('c') + ' up past a value ' + tex('z') + ' adds that whole contour.'),
    };
    main.append(msg, ans, P.grid, P.pmf, P.inputs, P.joint, P.table, P.cdf);
    Lab.setHTML(ans, '<div class="pl-ans-ev muted">Loading your table and g…</div>');
    setSrc(st.src);

    /* ---------------- the level-c control: box (any number) + slider through the values of Z and the gaps */
    function makeCControl() {
      const input = h('input', { class: 'field mono pl-num', type: 'text', inputmode: 'decimal', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'level c' });
      const range = h('input', { class: 'slider pl-range', type: 'range', min: 0, max: 2, step: 1, value: 1, 'aria-label': 'level c slider' });
      const hint = h('div', { class: 'pl-hint' });
      const prev = Lab.button('← previous value', () => jump(-1), 'btn xs');
      const next = Lab.button('next value →', () => jump(1), 'btn xs');
      const lab = h('label', { class: 'pl-label' });
      Lab.setHTML(lab, 'Level ' + tex('c') + ' (type any number, or slide through the values of ' + tex('Z') + ')');
      const el = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), h('div', { class: 'gxy-cbar' }, prev, next), hint);
      let stops = [0];
      function positions() {
        const zs = model ? model.levelsAll.map(g => g.value) : [0];
        const out = [];
        const gap = zs.length > 1 ? Math.min(...zs.slice(1).map((z, k) => z - zs[k])) : 1;
        out.push(zs[0] - Math.max(gap, 1e-9) / 2);
        zs.forEach((z, k) => { out.push(z); out.push(k + 1 < zs.length ? (z + zs[k + 1]) / 2 : z + Math.max(gap, 1e-9) / 2); });
        return out;
      }
      function paint() {
        const c = st.c;
        input.value = U.exact(st.cRaw) && st.cRaw.d !== 1 ? st.cRaw.toString() : String(Number(Number(c).toPrecision(10)));
        let best = 0;
        stops.forEach((s, k) => { if (Math.abs(s - c) < Math.abs(stops[best] - c)) best = k; });
        range.value = best;
        range.style.setProperty('--pct', (stops.length > 1 ? (best / (stops.length - 1)) * 100 : 0) + '%');
        input.classList.remove('bad');
      }
      function refresh() { stops = positions(); range.max = String(stops.length - 1); paint(); }
      function jump(dir) {
        if (!model) return;
        const zs = model.levelsAll;
        const c = st.c;
        let g = null;
        if (dir > 0) g = zs.find(z => z.value > c + 1e-9);
        else for (let k = zs.length - 1; k >= 0; k--) if (zs[k].value < c - 1e-9) { g = zs[k]; break; }
        if (g) setC(g.value, 'jump', g.raw);
      }
      range.addEventListener('input', () => {
        const k = +range.value, v = stops[k];
        const g = model && model.levelsAll.find(z => Math.abs(z.value - v) < 1e-12);
        setC(v, 'range', g ? g.raw : undefined);
      });
      input.addEventListener('input', Lab.debounce(() => {
        const f = K.parseNum(input.value);
        if (f == null || !isFinite(Number(f))) { input.classList.add('bad'); Lab.setHTML(hint, '<span class="cbad">Type a number, for example 3, 2.5 or 1/3.</span>'); return; }
        setC(Number(f), 'box', U.exact(f) ? f : undefined);
      }, 300));
      return { el, refresh, paint, hint };
    }

    /* ---------------- input handlers */
    function problem(text) {
      msg.hidden = false;
      Lab.setHTML(msg, '<b>Not drawn yet:</b> ' + text + (model ? ' <span class="muted">The panels below still show your last valid choice.</span>' : ''));
    }
    function setSrc(v) {
      st.src = v;
      srcSeg.set(v);
      tableBox.hidden = v !== 'table';
      indepBox.hidden = v !== 'indep';
    }
    function clearPreset() {
      if (batch) return;
      presetBox.select.value = '';
      const s = presetBox.querySelector('.pl-hint');
      if (s) s.textContent = '';
    }
    function serialQ(q) { const o = {}; Object.keys(q || {}).forEach(k => (o[k] = isF(q[k]) ? q[k].toString() : q[k])); return o; }
    function onTable(r) {
      tableIn = r;
      if (r.ok) st.table = { xs: r.xs.map(String), ys: r.ys.map(String), cells: r.cells.map(row => row.map(f => f.toString())) };
      if (!batch && st.src === 'table') { clearPreset(); update(); }
    }
    function onPick(which, r) {
      const fam = r.fam || 'custom';
      const d = which === 'x' ? st.dx : st.dy;
      if (r.ok) {
        d.fam = fam;
        if (fam === 'custom') d.custom = { vals: r.dist.vals.slice(), probs: r.dist.p.map(p => p.toString()) };
        else { d.params = d.params || {}; d.params[fam] = serialQ(r.q); }
      }
      if (which === 'x') xIn = Object.assign({}, r, { fam }); else yIn = Object.assign({}, r, { fam });
      if (!batch && st.src === 'indep') { clearPreset(); update(); }
    }
    function onG(fn, src) {
      if (!fn) { gSrc = null; problem(tex('g(x,y)') + ' cannot be read yet: see the red message under the box.'); return; }
      gSrc = src; st.g = src;
      if (!batch) { clearPreset(); update(); }
    }
    function applyPreset(it) {
      batch = true;
      try {
        setSrc(it.src);
        if (it.src === 'table') grid.set(it.table.xs, it.table.ys, it.table.cells);
        else { pickX.setFamily(it.dx.fam, Object.assign({}, it.dx.q)); pickY.setFamily(it.dy.fam, Object.assign({}, it.dy.q)); }
        gField.set(it.g);
        st.mode = it.mode; modeSeg.set(it.mode);
      } finally { batch = false; }
      pendingC = it.c;
      update();
    }

    /* ---------------- the joint PMF */
    function jointFromInputs() {
      if (st.src === 'table') {
        const r = tableIn;
        if (!r) return null;
        if (!r.ok) throw new Error('your joint table is not valid yet' + (r.total && !r.total.eq(1) ? ' (its cells add up to ' + tex(U.pTex(r.total)) + ', not 1 — press “Rescale to total 1”)' : ' (fix the red boxes, and keep the labels different)') + '.');
        const xs = r.xs.map(Number), ys = r.ys.map(Number);
        if (xs.some(v => !isFinite(v)) || ys.some(v => !isFinite(v))) throw new Error('the labels of ' + tex('X') + ' and ' + tex('Y') + ' must be numbers, so that ' + tex('g(x,y)') + ' can be computed.');
        const xi = xs.map((x, i) => i).sort((a, b) => xs[a] - xs[b]);
        const yi = ys.map((y, j) => j).sort((a, b) => ys[a] - ys[b]);
        const p = xi.map(i => yi.map(j => r.cells[j][i]));
        const float = p.some(row => row.some(q => !U.exact(q)));
        return { xs: xi.map(i => xs[i]), ys: yi.map(j => ys[j]), p: float ? p.map(row => row.map(Number)) : p, float, src: 'table' };
      }
      if (!xIn || !yIn) return null;
      if (!xIn.ok || !yIn.ok) throw new Error('your PMF of ' + tex(!xIn.ok ? 'X' : 'Y') + ' is not valid yet (its probabilities must add up to 1).');
      const dx = xIn.dist, dy = yIn.dist;
      const float = !!dx.float || !!dy.float || dx.p.some(q => !U.exact(q)) || dy.p.some(q => !U.exact(q));
      const fx = float ? dx.p.map(Number) : dx.p.slice(), fy = float ? dy.p.map(Number) : dy.p.slice();
      const p = dx.vals.map((_, i) => dy.vals.map((_, j) => U.mul(fx[i], fy[j])));
      return { xs: dx.vals.map(Number), ys: dy.vals.map(Number), p, float, src: 'indep', fx, fy, xi: xIn, yi: yIn };
    }

    /* ---------------- the model */
    function build(J, src) {
      const nx = J.xs.length, ny = J.ys.length;
      if (!nx || !ny) throw new Error('the table needs at least one value of X and one of Y.');
      if (nx * ny > 2500) throw new Error('that is ' + K.fmtInt(nx * ny) + ' points — too many to draw here. Make the ranges smaller (at most 2,500 points).');
      const fn = U.compile(src, ['x', 'y']);
      const cells = [];
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = J.xs[i], y = J.ys[j];
        let r;
        try { r = fn(U.toF(x), U.toF(y)); }
        catch (e) { throw new Error('g(' + Lab.fmtVal(x) + ', ' + Lab.fmtVal(y) + ') cannot be computed (' + Lab.esc(e.message) + '). Change g or the values.'); }
        const z = Lab.expr.num(r);
        if (typeof z !== 'number' || !isFinite(z)) throw new Error('g(' + Lab.fmtVal(x) + ', ' + Lab.fmtVal(y) + ') is not a finite number. Change g or the values.');
        cells.push({ i, j, x, y, p: J.p[i][j], z, raw: r, pos: Number(J.p[i][j]) > 0 });
      }
      const map = new Map();
      cells.forEach((c, k) => {
        const key = String(Number(c.z.toPrecision(12)));
        let e = map.get(key);
        if (!e) { e = { value: c.z, raw: c.raw, cells: [], pos: [], p: F(0) }; map.set(key, e); }
        e.cells.push(k);
        if (c.pos) { e.pos.push(k); e.p = U.add(e.p, c.p); }
        c.key = key;
      });
      const levelsAll = [...map.values()].sort((a, b) => a.value - b.value);
      const groups = levelsAll.filter(g => g.pos.length);
      const zFloat = J.float || groups.some(g => !U.exact(g.p));
      const allP = cells.map(c => c.p).concat(groups.map(g => g.p));
      const D = zFloat ? null : U.commonDen(allP, 1e6);
      const total = U.sum(groups.map(g => g.p));
      return { J, src, fn, cells, levelsAll, groups, nx, ny, D, zFloat, total, npos: cells.filter(c => c.pos).length };
    }
    function update() {
      let J;
      try { J = jointFromInputs(); if (!J || !gSrc) return; model = build(J, gSrc); }
      catch (e) { problem(e.message); return; }
      msg.hidden = true;
      const zs = model.levelsAll;
      if (pendingC != null) { const g = zs.find(z => Math.abs(z.value - pendingC) < 1e-9); st.c = pendingC; st.cRaw = g ? g.raw : undefined; pendingC = null; }
      else if (!(st.c >= zs[0].value - 1 && st.c <= zs[zs.length - 1].value + 1)) { const g = model.groups[Math.floor((model.groups.length - 1) / 2)] || zs[0]; st.c = g.value; st.cRaw = g.raw; }
      else { const g = zs.find(z => Math.abs(z.value - st.c) < 1e-9); st.cRaw = g ? g.raw : undefined; }
      G = null;
      save();
      drawAll();
    }
    function setC(v, from, raw) {
      st.c = v; st.cRaw = raw;
      save();
      if (from !== 'box') cBox.paint();
      if (model) drawC(from);
    }
    function dState(m) {
      if (!m.D || m.D === 1) return { D: null, useful: false };
      const ps = m.cells.map(c => c.p).concat(m.groups.map(g => g.p)).filter(p => U.exact(p) && !p.isZero());
      const useful = ps.some(p => p.d !== 1 && p.d !== m.D);
      if (!useful) return { D: m.D, useful };
      const on = st.useD == null ? m.D <= 4096 : st.useD;
      return { D: on ? m.D : null, useful, on };
    }

    /* ---------------- text helpers */
    const vT = (v, raw) => U.vTex(v, raw);
    const pairT = c => '(' + vT(c.x) + ',' + vT(c.y) + ')';
    const fT = c => 'f_{XY}' + pairT(c);
    const gSub = c => 'g' + pairT(c) + '=' + U.exprTex(model.src, { x: c.x, y: c.y }) + U.eqv(c.z, c.raw) + vT(c.z, c.raw);
    const cT = () => vT(st.c, st.cRaw);
    const near = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
    /** sum of cell probabilities: symbols, numbers, total */
    function cellSum(ks, D) {
      const m = model, cs = ks.map(k => m.cells[k]);
      const terms = cs.map(c => U.pTex(c.p, D));
      const tot = U.sum(cs.map(c => c.p));
      const sym = cs.length <= 4 ? cs.map(fT).join('+') : null;
      const nums = cs.length > 8 && terms.every(t => t === terms[0]) ? cs.length + '\\times ' + terms[0] : U.sumTex(terms);
      const rel = U.exact(tot) ? '=' : '\\approx ';
      let s = (cs.length > 1 ? nums + rel : '') + U.pTex(tot, D);
      if (D && U.exact(tot) && tot.d !== 1 && tot.d !== D) s += '=' + U.fracTex(tot);
      return { sym, s, tot };
    }
    const listPairs = (ks, max = 8) => {
      const cs = ks.map(k => model.cells[k]);
      if (cs.length <= max) return cs.map(pairT).join(',\\ ');
      return cs.slice(0, 4).map(pairT).join(',\\ ') + ',\\ \\dots,\\ ' + pairT(cs[cs.length - 1]) + '\\ {\\scriptstyle(' + cs.length + '\\text{ pairs})}';
    };
    function contourInfo(D) {
      const m = model, c = st.c;
      const onK = [], inK = [], onAll = [];
      m.cells.forEach((cell, k) => { if (near(cell.z, c)) { onAll.push(k); if (cell.pos) onK.push(k); } if (cell.z <= c + 1e-9 && cell.pos) inK.push(k); });
      return { onK, inK, onAll };
    }

    /* ---------------- drawing */
    function drawAll() {
      const m = model;
      const ds = dState(m);
      dToggle.hidden = !ds.useful;
      if (ds.useful) {
        dToggle.querySelector('input').checked = !!ds.on;
        Lab.setHTML(dToggle.querySelector('.pl-tlabel'), 'Write every probability out of ' + tex(U.bigTex(m.D)) + ', the common denominator (as the lecture does)');
        const eg = m.groups.find(g => g.pos.length > 1 && U.exact(g.p) && g.p.d !== m.D) || m.groups.find(g => g.pos.length > 1);
        const egT = eg ? eg.pos.slice(0, 3).map(k => U.pTex(m.cells[k].p, m.D)).join('+') + (eg.pos.length > 3 ? '+\\dots' : '') + '=' + U.pTex(eg.p, m.D) + (eg.p.d !== m.D ? '=' + U.fracTex(eg.p) : '') : '';
        Lab.setHTML(dNote, ds.on ? 'Adding over one denominator keeps the arithmetic visible' + (egT ? ', e.g. ' + tex(egT) : '') + '. Switch off for reduced fractions.' : 'Showing reduced fractions. Switch on to write them over ' + tex(U.bigTex(m.D)) + '.');
      } else Lab.setHTML(dNote, m.zFloat ? 'These probabilities are decimals (4 places), not fractions.' : 'Every probability here is already written over the same denominator.');
      cBox.refresh();
      drawInputs(m, ds.D);
      drawJoint(m, ds.D);
      drawTable(m, ds.D);
      drawC();
    }
    /** everything that depends on c */
    function drawC(from) {
      const m = model, D = dState(m).D;
      drawAnswer(m, D);
      drawGrid(m, D);
      drawPmf(m, D, from);
      drawRegions(m, D);
    }

    function srcWords(m, D) {
      const J = m.J;
      if (J.src === 'table') return 'your joint table (' + m.nx + ' values of ' + tex('X') + ' × ' + m.ny + ' values of ' + tex('Y') + ' = ' + (m.nx * m.ny) + ' cells, ' + m.npos + ' of them non-zero)';
      const d = (r, n) => (r.fam === 'custom' ? tex(n) + ' with your typed PMF' : tex(n + '\\sim ' + r.tex));
      const cut = [J.xi, J.yi].filter(r => r.truncated).length;
      return d(J.xi, 'X') + ' and ' + d(J.yi, 'Y') + ', <b>independent</b>, so ' + tex('f_{XY}(x,y)=f_X(x)f_Y(y)') + ' (' + (m.nx * m.ny) + ' cells' + (cut ? '; values after “shown up to k” are left out, so the cells add up to ' + tex((U.exact(m.total) ? '' : '\\approx ') + U.pTex(m.total, D)) + ', not 1' : '') + ')';
    }
    function cLine(m, D) {
      const info = contourInfo(D);
      const c = cT();
      if (st.mode === 'contour') {
        if (!info.onK.length) return tex('P(Z=' + c + ')=0') + ': no pair with positive probability has ' + tex('g(x,y)=' + c) + (info.onAll.length ? ' (the contour only meets cells with ' + tex('f_{XY}=0') + ')' : '') + '.';
        const s = cellSum(info.onK, D);
        return 'On the contour ' + tex('g(x,y)=' + c) + ': ' + info.onK.length + ' pair' + (info.onK.length > 1 ? 's' : '') + ', so ' + tex('P(Z=' + c + ')=' + (s.sym ? s.sym + '=' : '') + s.s) + '.';
      }
      if (!info.inK.length) return 'Region ' + tex('g(x,y)\\le ' + c) + ': no pair is inside, so ' + tex('F_Z(' + c + ')=P(Z\\le ' + c + ')=0') + '.';
      const s = cellSum(info.inK, D);
      return 'Region ' + tex('g(x,y)\\le ' + c) + ': ' + info.inK.length + ' pair' + (info.inK.length > 1 ? 's' : '') + ' inside, so ' + tex('F_Z(' + c + ')=P(Z\\le ' + c + ')=' + s.s) + '.';
    }
    function drawAnswer(m, D) {
      const ev = 'Your ' + tex('(X,Y)') + ': ' + srcWords(m, D) + '. Your function: ' + tex('g(x,y)=' + U.exprTex(m.src)) + '. So ' + tex('Z=g(X,Y)=' + U.exprTex(m.src, { x: { tex: 'X' }, y: { tex: 'Y' } })) + ', with ' + m.groups.length + ' possible value' + (m.groups.length > 1 ? 's' : '') + '.';
      K.setAnswer(ans, { ev, big: U.casesTex(m.groups, D, 'Z', 'z'), sub: cLine(m, D) + ' <span class="muted">(Level ' + tex('c=' + cT()) + ', set in the controls.)</span>' });
      // machine-readable copy of the result (exact strings), for checking
      const str = v => (U.exact(v) ? v.toString() : String(Number(v)));
      const info = contourInfo(D);
      ans.dataset.pmf = JSON.stringify(m.groups.map(g => [U.exact(g.raw) ? g.raw.toString() : String(g.value), str(g.p)]));
      ans.dataset.c = String(st.c) + '|' + st.mode + '|' + str(U.sum((st.mode === 'contour' ? info.onK : info.inK).map(k => m.cells[k].p)));
    }

    /* --- the grid picture */
    function spacing(vals) { let s = Infinity; for (let k = 1; k < vals.length; k++) s = Math.min(s, vals[k] - vals[k - 1]); return isFinite(s) && s > 0 ? s : 1; }
    function geometry(m, avail) {
      const J = m.J, xs = J.xs, ys = J.ys;
      const sx = spacing(xs), sy = spacing(ys);
      const x0 = xs[0] - 0.6 * sx, x1 = xs[xs.length - 1] + 0.6 * sx, y0 = ys[0] - 0.6 * sy, y1 = ys[ys.length - 1] + 0.6 * sy;
      const spanX = x1 - x0, spanY = y1 - y0, ratio = spanY / spanX;
      const maxW = Math.max(190, Math.min(470, avail - 70)), maxH = Math.max(190, Math.min(430, avail - 40));
      const equal = ratio >= 0.5 && ratio <= 2;
      let ux, uy;
      if (equal) ux = uy = Math.min(maxW / spanX, maxH / spanY, 120 / Math.min(sx, sy));
      else { ux = Math.min(maxW / spanX, 120 / sx); uy = Math.min(maxH / spanY, 120 / sy); }
      const ml = 46, mr = 26, mt = 22, mb = 36;
      const pw = spanX * ux, ph = spanY * uy;
      return { x0, x1, y0, y1, sx, sy, ux, uy, equal, ml, mt, pw, ph, W: ml + pw + mr, H: mt + ph + mb, X: x => ml + (x - x0) * ux, Y: y => mt + (y1 - y) * uy };
    }
    /** sample g on a lattice over the drawn rectangle (nodes on the integers when the values are integers) */
    function sample(m, geo) {
      const J = m.J;
      const ints = J.xs.every(Number.isInteger) && J.ys.every(Number.isInteger);
      let hx, hy, x0, y0, nx, ny;
      if (ints && geo.equal) {
        const k = Math.max(1, Math.round(90 / Math.max(geo.x1 - geo.x0, geo.y1 - geo.y0)));
        hx = hy = 1 / k;
        x0 = Math.floor(geo.x0 * k) / k; y0 = Math.floor(geo.y0 * k) / k;
        nx = Math.ceil((geo.x1 - x0) * k) + 1; ny = Math.ceil((geo.y1 - y0) * k) + 1;
      } else {
        nx = ny = 91; x0 = geo.x0; y0 = geo.y0; hx = (geo.x1 - geo.x0) / 90; hy = (geo.y1 - geo.y0) / 90;
      }
      const f = Lab.expr.compile(m.src);
      const snap = v => { const r = Math.round(v * 1e9) / 1e9; return Math.abs(r - Math.round(r)) < 1e-9 ? Math.round(r) : r; };
      const at = (x, y) => { try { const r = Lab.expr.num(f({ x: snap(x), y: snap(y) })); return typeof r === 'number' && isFinite(r) ? r : NaN; } catch (e) { return NaN; } };
      const v = new Float64Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = at(x0 + i * hx, y0 + j * hy);
      return { nx, ny, x0, y0, hx, hy, v, at, key: m.src + '|' + geo.x0 + '|' + geo.y0 + '|' + geo.x1 + '|' + geo.y1 + '|' + geo.ux + '|' + geo.uy };
    }
    /** marching squares: the curve g = c (violet line) and the region g ≤ c (shaded). Jumps of g are not drawn as curves. */
    function march(S, geo, c, wantFill, wantFlat) {
      const { nx, ny, x0, y0, hx, hy, v, at } = S;
      const X = geo.X, Y = geo.Y, f1 = n => n.toFixed(1);
      const P = (x, y) => f1(X(x)) + ',' + f1(Y(y));
      let line = '', fill = '', flat = '';
      const tol = 1e-9 * Math.max(1, Math.abs(c));
      // a crossing is real when g really passes through c there (no jump): g(p) is about c, and halfway to the
      // high end g is about halfway between c and the high value
      const real = p => {
        const g = at(p[0], p[1]);
        if (!isFinite(g) || Math.abs(g - c) > 0.3 * Math.abs(p[3] - p[2]) + tol) return false;
        const hiX = p[5], hiY = p[6], vh = p[4];
        const gm = at((p[0] + hiX) / 2, (p[1] + hiY) / 2);
        return isFinite(gm) && Math.abs(gm - (c + vh) / 2) <= 0.35 * Math.abs(vh - c) + tol;
      };
      for (let j = 0; j < ny - 1; j++) {
        const ya = y0 + j * hy, yb = ya + hy;
        let run = -1;
        for (let i = 0; i <= nx - 1; i++) {
          if (i === nx - 1) { if (run >= 0 && wantFill) fill += 'M' + P(x0 + run * hx, ya) + 'H' + f1(X(x0 + i * hx)) + 'V' + f1(Y(yb)) + 'H' + f1(X(x0 + run * hx)) + 'Z'; break; }
          const xa = x0 + i * hx, xb = xa + hx;
          const a = v[j * nx + i], b = v[j * nx + i + 1], cc = v[(j + 1) * nx + i + 1], d = v[(j + 1) * nx + i];
          const ins = [a, b, cc, d].map(q => q <= c + tol);
          const full = ins.every(Boolean) && [a, b, cc, d].every(isFinite);
          if (wantFlat && [a, b, cc, d].every(q => Math.abs(q - c) <= tol)) flat += 'M' + P(xa, ya) + 'H' + f1(X(xb)) + 'V' + f1(Y(yb)) + 'H' + f1(X(xa)) + 'Z';
          if (wantFill) {
            if (full) { if (run < 0) run = i; }
            else {
              if (run >= 0) { fill += 'M' + P(x0 + run * hx, ya) + 'H' + f1(X(xa)) + 'V' + f1(Y(yb)) + 'H' + f1(X(x0 + run * hx)) + 'Z'; run = -1; }
              const pts = [[xa, ya, a], [xb, ya, b], [xb, yb, cc], [xa, yb, d]];
              const poly = [];
              for (let k = 0; k < 4; k++) {
                const p = pts[k], q = pts[(k + 1) % 4];
                const pin = isFinite(p[2]) && p[2] <= c + tol, qin = isFinite(q[2]) && q[2] <= c + tol;
                if (pin) poly.push([p[0], p[1]]);
                if (pin !== qin) {
                  const t = isFinite(p[2]) && isFinite(q[2]) && q[2] !== p[2] ? Math.min(1, Math.max(0, (c - p[2]) / (q[2] - p[2]))) : 0.5;
                  poly.push([p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])]);
                }
              }
              if (poly.length >= 3) fill += 'M' + poly.map(p => P(p[0], p[1])).join('L') + 'Z';
            }
          }
          if (![a, b, cc, d].every(isFinite)) continue;
          const idx = (a > c + tol ? 1 : 0) | (b > c + tol ? 2 : 0) | (cc > c + tol ? 4 : 0) | (d > c + tol ? 8 : 0);
          if (idx === 0 || idx === 15) continue;
          // crossing on an edge: [x, y, v0, v1, v_high, x_high, y_high]
          const cross = (x1, y1, v1, x2, y2, v2) => { const t = (c - v1) / (v2 - v1); return v2 > v1 ? [x1 + t * (x2 - x1), y1 + t * (y2 - y1), v1, v2, v2, x2, y2] : [x1 + t * (x2 - x1), y1 + t * (y2 - y1), v1, v2, v1, x1, y1]; };
          const E = [
            () => cross(xa, ya, a, xb, ya, b),
            () => cross(xb, ya, b, xb, yb, cc),
            () => cross(xa, yb, d, xb, yb, cc),
            () => cross(xa, ya, a, xa, yb, d),
          ];
          const centre = (a + b + cc + d) / 4 > c + tol;
          const TABLE = { 1: [[3, 0]], 2: [[0, 1]], 3: [[3, 1]], 4: [[1, 2]], 5: centre ? [[0, 1], [2, 3]] : [[3, 0], [1, 2]], 6: [[0, 2]], 7: [[3, 2]], 8: [[2, 3]], 9: [[0, 2]], 10: centre ? [[3, 0], [1, 2]] : [[0, 1], [2, 3]], 11: [[1, 2]], 12: [[3, 1]], 13: [[0, 1]], 14: [[3, 0]] };
          TABLE[idx].forEach(([e1, e2]) => {
            const p = E[e1](), q = E[e2]();
            if (!real(p) || !real(q)) return;
            line += 'M' + P(p[0], p[1]) + 'L' + P(q[0], q[1]);
          });
        }
      }
      return { line, fill, flat };
    }
    function drawGrid(m, D) {
      const body = P.grid.body;
      Lab.clear(body);
      hoverLock = false;
      const stage = h('div', { class: 'gxy-stage' });
      body.appendChild(stage);
      const avail = stage.clientWidth || 600;
      const geo = geometry(m, avail);
      if (!G || G.key.indexOf(m.src + '|') !== 0 || G.geoKey !== [geo.x0, geo.y0, geo.x1, geo.y1, geo.ux, geo.uy].join('|') || G.model !== m) {
        G = sample(m, geo);
        G.geoKey = [geo.x0, geo.y0, geo.x1, geo.y1, geo.ux, geo.uy].join('|');
        G.model = m;
      }
      const s = svg('svg', { viewBox: '0 0 ' + geo.W.toFixed(1) + ' ' + geo.H.toFixed(1), width: Math.round(geo.W), class: 'gxy-svg', role: 'img', 'aria-label': 'the points (x, y) with the contour g = c' });
      const clipId = Lab.uid('gxyclip');
      s.appendChild(svg('defs', {}, svg('clipPath', { id: clipId }, svg('rect', { x: geo.ml, y: geo.mt, width: geo.pw, height: geo.ph }))));
      s.appendChild(svg('rect', { x: geo.ml, y: geo.mt, width: geo.pw, height: geo.ph, rx: 6, class: 'gxy-frame' }));
      const J = m.J;
      const every = arr => Math.max(1, Math.ceil(arr.length / 14));
      J.xs.forEach((x, i) => {
        s.appendChild(svg('line', { x1: geo.X(x), x2: geo.X(x), y1: geo.mt, y2: geo.mt + geo.ph, class: 'gxy-gridline' }));
        if (i % every(J.xs) === 0) s.appendChild(svg('text', { x: geo.X(x), y: geo.mt + geo.ph + 17, 'text-anchor': 'middle', class: 'gxy-tick x' }, U.vTxt(x)));
      });
      J.ys.forEach((y, j) => {
        s.appendChild(svg('line', { x1: geo.ml, x2: geo.ml + geo.pw, y1: geo.Y(y), y2: geo.Y(y), class: 'gxy-gridline' }));
        if (j % every(J.ys) === 0) s.appendChild(svg('text', { x: geo.ml - 8, y: geo.Y(y) + 4, 'text-anchor': 'end', class: 'gxy-tick y' }, U.vTxt(y)));
      });
      s.appendChild(svg('text', { x: geo.ml + geo.pw + 6, y: geo.mt + geo.ph + 17, class: 'gxy-axis x' }, 'x'));
      s.appendChild(svg('text', { x: geo.ml - 8, y: geo.mt - 7, 'text-anchor': 'end', class: 'gxy-axis y' }, 'y'));
      const layer = svg('g', { 'clip-path': 'url(#' + clipId + ')' });
      s.appendChild(layer);
      const c = st.c, region = st.mode === 'region';
      const levels = m.levelsAll.filter(z => z.pos.length);
      if (st.levels && levels.length <= 24) {
        G.lev = G.lev || {};
        let d = '';
        levels.forEach(z => { if (near(z.value, c)) return; const key = String(z.value); if (G.lev[key] == null) G.lev[key] = march(G, geo, z.value, false).line; d += G.lev[key]; });
        if (d) layer.appendChild(svg('path', { d, class: 'gxy-level' }));
      }
      const mm = march(G, geo, c, region, !region);
      if (region && mm.fill) layer.appendChild(svg('g', { class: 'gxy-region-g' }, svg('path', { d: mm.fill, class: 'gxy-region' })));
      if (!region && mm.flat) layer.appendChild(svg('g', { class: 'gxy-flat-g' }, svg('path', { d: mm.flat, class: 'gxy-region' })));
      if (mm.line) layer.appendChild(svg('path', { d: mm.line, class: 'gxy-line' }));
      // the points
      const pmax = Math.max(...m.cells.map(q => Number(q.p)), 1e-300);
      const cellPx = Math.min(geo.ux * geo.sx, geo.uy * geo.sy);
      const rmax = Math.max(3, Math.min(15, 0.4 * cellPx)), rmin = Math.min(3.5, rmax * 0.45);
      const showG = m.cells.length <= 196 && cellPx >= 24;
      const pts = [];
      m.cells.forEach((q, k) => {
        const on = near(q.z, c), inside = q.z <= c + 1e-9;
        const r = q.pos ? rmin + (rmax - rmin) * Math.sqrt(Number(q.p) / pmax) : Math.max(2.5, rmin * 0.8);
        const cls = 'gxy-pt' + (q.pos ? '' : ' zero') + (region ? (inside ? ' in' : ' dim') : (on ? ' on' : ' dim'));
        const g = svg('g', { class: cls, tabindex: '-1' });
        if (!region && on) g.appendChild(svg('circle', { cx: geo.X(q.x), cy: geo.Y(q.y), r: r + 3.5, class: 'gxy-ring' }));
        g.appendChild(svg('circle', { cx: geo.X(q.x), cy: geo.Y(q.y), r, class: 'gxy-dot' }));
        if (showG) g.appendChild(svg('text', { x: geo.X(q.x) + r * 0.72 + 2, y: geo.Y(q.y) - r * 0.72 - 2, class: 'gxy-g' }, U.vTxt(q.z, q.raw)));
        g.appendChild(svg('title', {}, '(' + U.vTxt(q.x) + ', ' + U.vTxt(q.y) + '): f = ' + U.pTxt(q.p, D) + ', g = ' + U.vTxt(q.z, q.raw)));
        g.addEventListener('mouseenter', () => hoverPt(k, D));
        g.addEventListener('mouseleave', () => { hoverLock = false; paintRead(D); });
        g.addEventListener('click', () => setC(q.z, 'pt', q.raw));
        s.appendChild(g);
        pts.push(g);
      });
      stage.appendChild(s);
      const legend = h('div', { class: 'gxy-legend' });
      Lab.setHTML(legend, region
        ? '<span><i class="on"></i>inside the region ' + tex('g\\le c') + '</span><span><i class="off"></i>outside</span><span><i class="line"></i>the edge ' + tex('g=c') + ' on the plane</span>' + (st.levels ? '<span><i class="lev"></i>other contours</span>' : '')
        : '<span><i class="on"></i>on the contour ' + tex('g=c') + '</span><span><i class="off"></i>not on it</span><span><i class="line"></i>' + tex('g(x,y)=c') + ' on the whole plane</span>' + (st.levels ? '<span><i class="lev"></i>the other contours ' + tex('g=z') + '</span>' : ''));
      const read = h('div', { class: 'ws-readout gxy-read' });
      body.append(legend, read);
      P.grid.read = read;
      if (!geo.equal) body.appendChild(K.note('The two axes use different scales here (the ranges are very different), so slopes look different from the real ones.', 'small muted'));
      if (!showG) body.appendChild(K.note('Too many points to print every ' + tex('g(x,y)') + '; point at a dot to read it.', 'small muted'));
      if (!region && mm.flat) body.appendChild(K.note('Here ' + tex('g') + ' is constant on whole patches of the plane, so ' + tex('\\{g=' + cT() + '\\}') + ' is a shaded patch, not a thin curve.', 'small muted'));
      paintRead(D);
    }
    function paintRead(D) {
      const read = P.grid.read;
      if (!read || hoverLock) return;
      const m = model, info = contourInfo(D), c = cT();
      const gT = U.exprTex(m.src);
      let html;
      if (st.mode === 'contour') {
        html = 'Contour ' + tex('\\{(x,y):\\ ' + gT + '=' + c + '\\}') + ': ';
        if (!info.onK.length) {
          html += info.onAll.length ? 'it meets only cells with ' + tex('f_{XY}=0') + ', so ' + tex('P(Z=' + c + ')=0') + '.' : 'no point of the grid lies on it, so ' + tex('P(Z=' + c + ')=0') + ' — ' + tex(c) + ' is not a value of ' + tex('Z') + '.';
          html += '<div class="xs muted">The values of ' + tex('Z') + ' are ' + tex('\\{' + U.listTex(m.groups.map(g => g.value), m.groups.map(g => g.raw), 10) + '\\}') + '. Use “next value →”.</div>';
        } else {
          const s = cellSum(info.onK, D);
          html += 'it passes through ' + info.onK.length + ' of the ' + m.npos + ' points with positive probability: ' + tex(listPairs(info.onK)) + '.' +
            '<div>' + tex('P(Z=' + c + ')=' + (s.sym ? s.sym : '\\sum_{g(x,y)=' + c + '}f_{XY}(x,y)') + '=' + s.s) + '</div>';
        }
      } else {
        html = 'Region ' + tex('\\{(x,y):\\ ' + gT + '\\le ' + c + '\\}') + ': ';
        if (!info.inK.length) html += 'no point with positive probability is inside, so ' + tex('F_Z(' + c + ')=0') + '.';
        else {
          const s = cellSum(info.inK, D);
          const zs = m.groups.filter(g => g.value <= st.c + 1e-9);
          const viaPmf = U.sumTex(zs.map(g => U.pTex(g.p, D)), 8);
          html += info.inK.length + ' of the ' + m.npos + ' points are inside (violet).' +
            '<div>' + tex('F_Z(' + c + ')=P(Z\\le ' + c + ')=\\sum_{g(x,y)\\le ' + c + '}f_{XY}(x,y)=' + s.s) + '</div>' +
            '<div class="small">Same as adding the PMF of ' + tex('Z') + ' up to ' + tex(c) + ': ' + tex('\\sum_{z\\le ' + c + '}P(Z=z)=' + viaPmf + (zs.length > 1 ? (U.exact(s.tot) ? '=' : '\\approx ') + U.pTex(s.tot, D) : '')) + ' ✓</div>';
        }
      }
      Lab.setHTML(read, html);
    }
    function hoverPt(k, D) {
      const m = model, q = m.cells[k], read = P.grid.read;
      if (!read) return;
      hoverLock = true;
      const J = m.J;
      const src = J.src === 'indep' ? '=f_X(' + vT(q.x) + ')\\,f_Y(' + vT(q.y) + ')=' + U.pTex(J.fx[q.i]) + '\\cdot ' + U.pTex(J.fy[q.j]) : '';
      const rel = st.mode === 'contour' ? (near(q.z, st.c) ? 'on the contour ' + tex('g=' + cT()) : 'not on the contour ' + tex('g=' + cT())) : (q.z <= st.c + 1e-9 ? 'inside the region ' + tex('g\\le ' + cT()) : 'outside the region ' + tex('g\\le ' + cT()));
      read.innerHTML = tex(pairT(q).replace(/^\(/, '(x,y)=(')) + ': ' + tex(fT(q) + src + '=' + U.pTex(q.p, D)) + (q.pos ? '' : ' (zero: it adds nothing)') + '<div>' + tex(gSub(q)) + ' — ' + rel + '. Tap to set ' + tex('c=' + vT(q.z, q.raw)) + '.</div>';
    }

    /* --- PMF and CDF of Z */
    function drawPmf(m, D, from) {
      const body = P.pmf.body;
      const c = st.c, region = st.mode === 'region';
      const hot = z => (region ? z <= c + 1e-9 : near(z, c));
      let pm = body.querySelector('.gxy-pmf');
      const pmNew = h('div', { class: 'gxy-pmf' });
      pmNew.appendChild(h('div', { class: 't4-sub', html: 'PMF of ' + tex('Z') + ': ' + tex('P(Z=z)=\\sum_{(x,y):\\,g(x,y)=z}f_{XY}(x,y)') + ', ' + m.groups.length + ' value' + (m.groups.length > 1 ? 's' : '') + (region ? ' — violet: the values ' + tex('z\\le c') : ' — violet: ' + tex('z=c')) }));
      const rows = m.groups.map(g => ({ x: g.value, raw: g.raw, p: g.p, label: U.pTex(g.p, D), hot: hot(g.value) }));
      if (rows.length <= 40) pmNew.appendChild(K.pmfChart(rows, { xName: 'Z', tone: 'z', height: 170, xPlain: 'Z', onPick: x => { const g = m.groups.find(q => near(q.value, x)); setC(x, 'bar', g ? g.raw : undefined); } }));
      else pmNew.appendChild(U.stemChart(rows, { tone: 'z', name: 'Z', D, hot: r => hot(r.x), caption: 'values of ' + tex('Z') + ' — ' + rows.length + ' stems at their true positions' }));
      if (pm) pm.replaceWith(pmNew); else body.appendChild(pmNew);
      if (from === 'cdf' && body.querySelector('.gxy-cdf')) return;
      const cd = body.querySelector('.gxy-cdf');
      const cdNew = h('div', { class: 'gxy-cdf' });
      cdNew.appendChild(h('div', { class: 't4-sub', html: 'CDF of ' + tex('Z') + ': ' + tex('F_Z(t)=P(Z\\le t)') + ' (here ' + tex('t') + ' is the same as ' + tex('c') + ')' }));
      cdNew.appendChild(K.cdfChart({ vals: m.groups.map(g => g.value), p: m.groups.map(g => g.p), float: m.zFloat }, { xName: 'Z', t: c, onT: v => setC(v, 'cdf') }));
      if (cd) cd.replaceWith(cdNew); else body.appendChild(cdNew);
    }

    /* --- PMF and CDF of the inputs X and Y: the margins of the typed table, or the two chosen distributions */
    function marginals(m) {
      const J = m.J;
      // each chosen PMF as the picker gives it (exact 1/16 for a binomial even when Y is a Poisson with decimals)
      if (J.src === 'indep') return { fx: J.xi.dist.p, fy: J.yi.dist.p };
      return {
        fx: J.xs.map((_, i) => U.sum(J.ys.map((_, j) => J.p[i][j]))),
        fy: J.ys.map((_, j) => U.sum(J.xs.map((_, i) => J.p[i][j]))),
      };
    }
    /** where one bar of f_X or f_Y comes from, with the numbers */
    function inputLine(m, D, name, k, vals, ps, r) {
      const J = m.J, v = vals[k], p = ps[k], vt = vT(v), lower = name.toLowerCase();
      const fs = 'f_' + name + '(' + vt + ')';
      if (J.src === 'table') {
        const part = name === 'X' ? 'column' : 'row';
        const cells = name === 'X' ? J.ys.map((y, j) => [k, j]) : J.xs.map((x, i) => [i, k]);
        const nz = cells.filter(([i, j]) => Number(J.p[i][j]) > 0), zero = cells.length - nz.length;
        if (!nz.length) return tex(fs + '=0') + ': every cell in the ' + part + ' ' + tex(lower + '=' + vt) + ' of your table is 0, so ' + tex(name) + ' never takes the value ' + tex(vt) + '.';
        const cell = ([i, j]) => 'f_{XY}(' + vT(J.xs[i]) + ',' + vT(J.ys[j]) + ')';
        const sym = nz.length <= 4 ? nz.map(cell).join('+') : '\\sum_{' + (name === 'X' ? 'y' : 'x') + '}f_{XY}(' + (name === 'X' ? vt + ',y' : 'x,' + vt) + ')';
        const first = J.p[nz[0][0]][nz[0][1]];
        const nums = nz.length > 8 && nz.every(([i, j]) => U.peq(J.p[i][j], first)) ? nz.length + '\\times ' + U.pTex(first, D) : U.sumTex(nz.map(([i, j]) => U.pTex(J.p[i][j], D)));
        let line = fs + '=' + sym + '=' + (nz.length > 1 ? nums + (U.exact(p) ? '=' : '\\approx ') : '') + U.pTex(p, D);
        if (D && U.exact(p) && p.d !== 1 && p.d !== D) line += '=' + U.fracTex(p);
        return 'Add the ' + part + ' ' + tex(lower + '=' + vt) + ' of your table: ' + tex(line) + (zero ? ' <span class="muted">(' + (zero > 1 ? 'the other ' + zero + ' cells of this ' + part + ' are 0' : 'the other cell of this ' + part + ' is 0') + ')</span>' : '') + '.';
      }
      if (r.fam === 'custom') return tex(fs + '=P(' + name + '=' + vt + ')=' + U.pTex(p, D)) + ', as you typed it in your PMF of ' + tex(name) + '.';
      return 'From your ' + tex(name + '\\sim ' + r.tex) + ': ' + tex(U.famLine(name, r, v, p, D)) + '.';
    }
    function drawInputs(m, D) {
      const body = P.inputs.body;
      Lab.clear(body);
      const J = m.J, M = marginals(m), table = J.src === 'table';
      const str = v => (U.exact(v) ? v.toString() : String(Number(v)));
      P.inputs.sub(table
        ? 'From your joint table: ' + tex('f_X(x)=\\sum_y f_{XY}(x,y)') + ' adds the column of ' + tex('x') + ', and ' + tex('f_Y(y)=\\sum_x f_{XY}(x,y)') + ' adds the row of ' + tex('y') + ' (the margins of “Your joint PMF” below). Tap a bar to see its sum.'
        : 'Your two distributions from the controls. The joint table multiplies them, ' + tex('f_{XY}(x,y)=f_X(x)\\,f_Y(y)') + '. Tap a bar to see where its probability comes from.');
      [['X', J.xs, M.fx, 'x', J.xi], ['Y', J.ys, M.fy, 'y', J.yi]].forEach(([name, vals, ps, tone, r]) => {
        // a typed table keeps the lab's common denominator; a chosen distribution uses its own (1/6, not 6/36)
        const Dv = table ? D : D ? U.commonDen(ps, 4096) : null;
        const lower = name.toLowerCase();
        const box = h('div', { class: 'gxy-in tone-' + tone });
        box.appendChild(h('div', { class: 't4-sub', html: 'PMF of ' + tex(name) + ': ' + (table ? tex('f_' + name + '(' + lower + ')') + ', the ' + (name === 'X' ? 'column' : 'row') + ' sums of your table' : r.fam === 'custom' ? 'the PMF you typed' : tex(name + '\\sim ' + r.tex)) + ', ' + vals.length + ' value' + (vals.length > 1 ? 's' : '') }));
        const rows = vals.map((v, k) => ({ x: v, p: ps[k], label: U.pTex(ps[k], Dv) }));
        const read = h('div', { class: 'ws-readout gxy-in-read' });
        let chart;
        const show = k => {
          if (k < 0) return;
          if (rows.length <= 40) chart.querySelectorAll('.pd-col').forEach((c, i) => c.classList.toggle('hot', i === k));
          Lab.setHTML(read, inputLine(m, Dv, name, k, vals, ps, r));
        };
        chart = rows.length <= 40
          ? K.pmfChart(rows, { xName: name, tone, height: 150, xPlain: name, onPick: x => show(vals.findIndex(v => near(v, Number(x)))) })
          : U.stemChart(rows, { tone, name, D: Dv, caption: 'values of ' + tex(name) + ' — ' + rows.length + ' stems at their true positions (too many for bars)' });
        box.append(chart, read);
        // start with an interesting bar: the longest sum (table) or the middle value
        let k0 = Math.floor((vals.length - 1) / 2);
        if (table) {
          const cnt = vals.map((_, k) => (name === 'X' ? J.ys.filter((y, j) => Number(J.p[k][j]) > 0) : J.xs.filter((x, i) => Number(J.p[i][k]) > 0)).length);
          k0 = cnt.indexOf(Math.max(...cnt));
        }
        show(k0);
        const tot = U.sum(ps), exact = U.exact(tot);
        const cut = !table && r && r.truncated;
        box.appendChild(K.note('Total: ' + tex('\\sum_{' + lower + '}f_' + name + '(' + lower + ')=' + U.sumTex(ps.map(p => U.pTex(p, Dv)), 8) + (exact ? '=' : '\\approx ') + U.pTex(tot, Dv) + (exact && tot.eq(1) ? '\\ \\checkmark' : '')) +
          (cut ? ' <span class="muted">(the values after “shown up to k” are left out; they hold ' + tex(exact ? '1-' + U.pTex(tot, Dv) + '=' + U.pTex(F(1).sub(tot)) : '\\approx ' + U.dec(1 - Number(tot))) + ')</span>' : ''), 'small'));
        box.appendChild(h('div', { class: 't4-sub', html: 'CDF of ' + tex(name) + ': ' + tex('F_' + name + '(t)=P(' + name + '\\le t)') }));
        box.appendChild(K.cdfChart({ vals, p: ps, float: ps.some(p => !U.exact(p)) }, { xName: name, truncated: !!cut }));
        body.appendChild(box);
      });
      // machine-readable copy (exact strings), for checking
      body.dataset.fx = JSON.stringify(J.xs.map((x, i) => [x, str(M.fx[i])]));
      body.dataset.fy = JSON.stringify(J.ys.map((y, j) => [y, str(M.fy[j])]));
    }

    /* --- where f_XY comes from */
    function drawJoint(m, D) {
      const body = P.joint.body;
      Lab.clear(body);
      const J = m.J;
      const big = m.nx > 10 || m.ny > 12;
      if (J.src === 'indep') {
        P.joint.sub('Source: two <b>independent</b> distributions, so every cell is a product, ' + tex('f_{XY}(x,y)=f_X(x)\\,f_Y(y)') + '. The marginals are your two PMFs.');
        if (big) {
          const ex = [[0, 0], [Math.floor(m.nx / 2), Math.floor(m.ny / 2)], [m.nx - 1, m.ny - 1]];
          body.appendChild(K.note(m.nx + ' × ' + m.ny + ' = ' + K.fmtInt(m.nx * m.ny) + ' cells — too many for one table. Every cell is computed the same way, for example:', ''));
          const line = ([i, j]) => 'f_{XY}(' + vT(J.xs[i]) + ',' + vT(J.ys[j]) + ')&=f_X(' + vT(J.xs[i]) + ')\\,f_Y(' + vT(J.ys[j]) + ')=' + U.pTex(J.fx[i]) + '\\cdot ' + U.pTex(J.fy[j]) + (U.exact(J.p[i][j]) ? '=' : '\\approx ') + U.pTex(J.p[i][j], D);
          body.appendChild(U.mathEl('\\begin{aligned}' + ex.map(line).join('\\\\') + '\\end{aligned}'));
          return;
        }
        const head = [tex('y\\,\\backslash\\,x')].concat(J.xs.map(x => '<span class="cx">' + tex(vT(x)) + '</span>'), [tex('f_Y(y)')]);
        const rows = J.ys.map((y, j) => [{ html: tex(vT(y)), cls: 'cy' }].concat(J.xs.map((x, i) => tex(U.pTex(J.fx[i]) + '\\cdot ' + U.pTex(J.fy[j]) + (U.exact(J.p[i][j]) ? '=' : '\\approx ') + U.pTex(J.p[i][j], D))), [{ html: tex(U.pTex(J.fy[j])), cls: 'mg' }]));
        rows.push([{ html: tex('f_X(x)'), cls: 'l' }].concat(J.xs.map((x, i) => ({ html: tex(U.pTex(J.fx[i])), cls: 'mg' })), ['']));
        body.appendChild(U.tbl(head, rows, { cls: 'gxy-jt' }));
        body.appendChild(K.note('Each cell: ' + tex('f_X(x)\\cdot f_Y(y)') + ', the column’s ' + tex('f_X(x)') + ' (bottom row) times the row’s ' + tex('f_Y(y)') + ' (right column)' + (D ? ', with the product written out of ' + tex(U.bigTex(D)) : '') + '.', 'small muted'));
        return;
      }
      const tot = U.sum(m.cells.map(q => q.p));
      P.joint.sub('Source: <b>your typed table</b>. ' + (U.exact(tot) && tot.eq(1) ? 'Its ' + m.cells.length + ' cells add up to 1 ✓.' : ''));
      if (big) { body.appendChild(K.note('The table is in the controls (' + m.nx + ' × ' + m.ny + ' cells).', 'small muted')); return; }
      const M = marginals(m);
      const head = [tex('y\\,\\backslash\\,x')].concat(J.xs.map(x => '<span class="cx">' + tex(vT(x)) + '</span>'), [tex('f_Y(y)')]);
      const rows = J.ys.map((y, j) => [{ html: tex(vT(y)), cls: 'cy' }].concat(J.xs.map((x, i) => tex(U.pTex(J.p[i][j], D))), [{ html: tex(U.pTex(M.fy[j], D)), cls: 'mg' }]));
      rows.push([{ html: tex('f_X(x)'), cls: 'l' }].concat(J.xs.map((x, i) => ({ html: tex(U.pTex(M.fx[i], D)), cls: 'mg' })), [{ html: tex(U.pTex(tot, D)), cls: 'mg' }]));
      body.appendChild(U.tbl(head, rows, { cls: 'gxy-jt' }));
      body.appendChild(K.note('Margins: the bottom row adds each column, ' + tex('f_X(x)=\\sum_y f_{XY}(x,y)') + '; the right column adds each row, ' + tex('f_Y(y)=\\sum_x f_{XY}(x,y)') + '. These are the PMFs of ' + tex('X') + ' and ' + tex('Y') + ' drawn above.', 'small muted'));
      body.appendChild(U.mathEl('\\sum_{x,y}f_{XY}(x,y)=' + U.sumTex(m.cells.map(q => U.pTex(q.p, D)), 12) + (U.exact(tot) ? '=' : '\\approx ') + U.pTex(tot, D)));
    }

    /* --- the table method */
    const fullBtn = (label, onClick) => h('div', { class: 'btn-row t4-full' }, Lab.button(label, onClick, 'btn sm'));
    function drawTable(m, D, full) {
      const body = P.table.body;
      Lab.clear(body);
      const steps = [];
      const posK = m.cells.map((q, k) => k).filter(k => m.cells[k].pos).sort((a, b) => m.cells[a].x - m.cells[b].x || m.cells[a].y - m.cells[b].y);
      const zeroN = m.cells.length - posK.length;
      if (posK.length <= 40 || full) {
        const rows = posK.map(k => { const q = m.cells[k]; return [tex(vT(q.x)), tex(vT(q.y)), tex(U.pTex(q.p, D)), { html: tex(U.exprTex(m.src, { x: q.x, y: q.y }) + U.eqv(q.z, q.raw) + vT(q.z, q.raw)), cls: 'z' }]; });
        const blk = h('div', {}, U.tbl([tex('x'), tex('y'), tex('f_{XY}(x,y)'), tex('z=g(x,y)')], rows));
        if (full && posK.length > 40) blk.appendChild(fullBtn('Show the short version again', () => drawTable(m, D, false)));
        steps.push({ html: '<b>List the pairs.</b> One row per pair ' + tex('(x,y)') + ' with ' + tex('f_{XY}(x,y)>0') + ' — ' + posK.length + ' row' + (posK.length > 1 ? 's' : '') + (zeroN ? '. The ' + zeroN + ' cell' + (zeroN > 1 ? 's' : '') + ' with ' + tex('f_{XY}=0') + ' are left out: they add nothing' : '') + '. Then fill the column ' + tex('z=g(x,y)=' + U.exprTex(m.src)) + '.', block: blk });
      } else {
        steps.push({ html: '<b>The pairs.</b> There are ' + K.fmtInt(posK.length) + ' pairs with ' + tex('f_{XY}(x,y)>0') + ' — too many to list by hand, which is exactly the lecture’s point in L2.6 (36 pairs for two dice, ' + tex('10^4') + ' for two numbers from 1 to 100). The grouping below still uses every one of them.', block: posK.length <= 2500 ? fullBtn('List all ' + K.fmtInt(posK.length) + ' pairs anyway', () => drawTable(m, D, true)) : null });
      }
      // group by z = one contour each
      const many = m.groups.length > 30 && !full;
      const shown = many ? m.groups.slice(0, 20).concat([null], m.groups.slice(-6)) : m.groups;
      const rowsZ = shown.map(g => {
        if (!g) { const hid = m.groups.slice(20, -6); return { gap: '⋮ ' + hid.length + ' more values ' + tex('z=' + U.listTex(hid.map(q => q.value), hid.map(q => q.raw))) + ' (press “Show all”)' }; }
        const ks = g.pos.slice().sort((a, b) => m.cells[a].x - m.cells[b].x || m.cells[a].y - m.cells[b].y);
        const s = cellSum(ks, D);
        return { cells: [{ html: tex(vT(g.value, g.raw)), cls: 'z' }, { html: tex(listPairs(ks, 6)), cls: 'l' }, String(ks.length), tex(s.s)], cls: ks.length > 1 ? 'hl-row' : '' };
      });
      const blkZ = h('div', {}, U.tbl([tex('z'), 'pairs on the contour ' + tex('g(x,y)=z'), 'how many', tex('P(Z=z)')], rowsZ));
      if (m.groups.length > 30) blkZ.appendChild(full ? fullBtn('Show the short table again', () => drawTable(m, D, false)) : fullBtn('Show all ' + m.groups.length + ' values of Z', () => drawTable(m, D, true)));
      const zeroOnly = m.levelsAll.filter(g => !g.pos.length);
      steps.push({
        html: '<b>Group the pairs by ' + tex('z') + ' and add.</b> The pairs with the same value ' + tex('z') + ' are exactly the points on the contour ' + tex('g(x,y)=z') + ', and the events ' + tex('\\{X=x,Y=y\\}') + ' never overlap, so:',
        math: 'P(Z=z)=\\sum_{(x,y):\\ g(x,y)=z}f_{XY}(x,y)',
        block: blkZ,
        note: (m.groups.some(g => g.pos.length > 1) ? 'Violet rows: two or more pairs land on the same ' + tex('z') + ' — many-to-one, which is normal for two variables. ' : 'Every value of ' + tex('z') + ' comes from one pair here: ' + tex('g') + ' is one-to-one on these pairs. ') +
          (zeroOnly.length ? 'Values met only at cells with ' + tex('f_{XY}=0') + ' (' + tex(U.listTex(zeroOnly.map(g => g.value), zeroOnly.map(g => g.raw), 6)) + ') have probability 0, so they are not values of ' + tex('Z') + '.' : ''),
      });
      // check
      const tot = m.total, exact = U.exact(tot);
      let numLine = '';
      if (D && exact && m.groups.every(g => U.exact(g.p) && D % g.p.d === 0)) {
        const parts = m.groups.map(g => U.bigTex(g.p.n * (D / g.p.d)));
        if (parts.length <= 14) numLine = '=\\frac{' + parts.join('+') + '}{' + U.bigTex(D) + '}' + (tot.d === 1 ? '=\\frac{' + U.bigTex(tot.n * D) + '}{' + U.bigTex(D) + '}' : '');
      }
      steps.push({ html: '<b>Check:</b> the probabilities of ' + tex('Z') + ' add up to the total of the joint table.', math: '\\sum_z P(Z=z)=' + U.sumTex(m.groups.map(g => U.pTex(g.p, D)), 10) + numLine + (exact ? '=' : '\\approx ') + U.pTex(tot, D) + (exact && tot.eq(1) ? '\\ \\checkmark' : ''), note: J_trunc(m) });
      body.appendChild(K.steps(steps));
    }
    function J_trunc(m) {
      const J = m.J;
      if (J.src !== 'indep') return '';
      const t = [J.xi, J.yi].filter(r => r.truncated);
      return t.length ? 'This total is below 1 because ' + t.map(r => tex(r === J.xi ? 'X' : 'Y')).join(' and ') + ' ' + (t.length > 1 ? 'are' : 'is') + ' cut off at “shown up to k”: the left-out values are not on the grid.' : '';
    }

    /* --- CDF of Z from regions */
    function drawRegions(m, D) {
      const body = P.cdf.body;
      Lab.clear(body);
      const gs = m.groups;
      const many = gs.length > 30;
      const idx = many ? [...Array(20).keys()].concat([-1], [...Array(6).keys()].map(k => gs.length - 6 + k)) : gs.map((g, k) => k);
      let acc = F(0);
      const accs = gs.map(g => (acc = U.add(acc, g.p)));
      const rows = idx.map(k => {
        if (k < 0) return { gap: '⋮ ' + (gs.length - 26) + ' more values (the running total keeps adding one contour at a time)' };
        const g = gs[k], prev = k ? accs[k - 1] : null, cur = accs[k];
        const exact = U.exact(cur);
        const calc = k === 0 ? U.pTex(g.p, D) : 'F_Z(' + vT(gs[k - 1].value, gs[k - 1].raw) + ')+P(Z=' + vT(g.value, g.raw) + ')=' + U.pTex(prev, D) + '+' + U.pTex(g.p, D) + (exact ? '=' : '\\approx ') + U.pTex(cur, D);
        const isC = st.mode === 'region' ? g.value <= st.c + 1e-9 : near(g.value, st.c);
        return { cells: [{ html: tex(vT(g.value, g.raw)), cls: 'z' }, { html: tex('\\{g\\le ' + vT(g.value, g.raw) + '\\}') + ' adds the contour ' + tex('g=' + vT(g.value, g.raw)) + ' (' + g.pos.length + ' pair' + (g.pos.length > 1 ? 's' : '') + ')', cls: 'l' }, tex(calc)], cls: isC ? 'hl-row' : '' };
      });
      body.appendChild(U.tbl([tex('z'), 'region', tex('F_Z(z)=P(Z\\le z)')], rows));
      const c = cT();
      const below = gs.filter(g => g.value <= st.c + 1e-9);
      body.appendChild(K.note('Between two values of ' + tex('Z') + ' the region gains no new points, so ' + tex('F_Z') + ' stays flat — that is the staircase above. At your level ' + tex('c=' + c) + ': ' + tex('F_Z(' + c + ')' + (below.length ? (U.exact(accs[below.length - 1]) ? '=' : '\\approx ') + U.pTex(accs[below.length - 1], D) : '=0')) + (st.mode === 'region' ? ' (violet rows: the contours inside the region).' : '. Switch to <b>Region</b> mode to see the region on the grid.'), 'small'));
    }
  }

  Lab.lab({
    id: 'lab-s2-gxy', course: 's2', week: 2, order: 4, ic: 'grid',
    title: 'Function of two random variables lab', sub: 'Week 2 · L2.6–L2.7',
    topics: ['Z = g(X, Y)', 'joint table', 'independent X, Y', 'contours', 'regions', 'table method', 'PMF and CDF of Z'],
    desc: 'Type a joint table or pick two independent distributions, then type any g(x, y). See the grid of points with g-values, slide a level c to light up the contour g = c or the region g ≤ c, and get the PMF of Z (each value as a sum over its contour) and its CDF (sums over regions).',
    render: host => gxyLab(host),
  });
})();
