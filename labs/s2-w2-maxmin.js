/* Playground lab (s2-w2-maxmin): max and min of the learner's own independent X and Y, of n i.i.d. copies, or of
   any joint table (L2.9, L2.11). The L-shaped level sets on the grid, the CDF method step by step with the learner's
   numbers (independent inputs) or the three-case formula of L2.11 (a joint table, dependent or not), the PMFs and
   CDFs of max and min next to those of X, the "add over the L" and "count the L" cross-checks, and the geometric
   results (the min is geometric, the max is not).
   Uses Lab.play.t4b, defined in labs/s2-w2-sum.js (the manifest loads that file just before this one). */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, F } = Lab;
  const tex = s => Lab.tex(String(s));
  const U = K.t4b;
  const META = {
    id: 'lab-s2-maxmin', course: 's2', week: 2, order: 5,
    title: 'Maximum and minimum lab', sub: 'Week 2 · L2.9, L2.11',
    topics: ['max(X, Y)', 'min(X, Y)', 'L-shaped level sets', 'CDF method', 'F(z)ⁿ', 'P(X ≥ z)ⁿ', 'count the L', 'geometric min'],
    desc: 'Choose independent X and Y, n i.i.d. copies of one distribution, or type any joint table. See the L-shapes for max = z and min = z, the CDF method (or the three cases of L2.11 for a joint table) with your numbers, the PMFs and CDFs of max and min next to X, and the lecture’s cross-checks.',
  };
  if (!U) {
    Lab.lab(Object.assign({}, META, { render: host => host.appendChild(h('div', { class: 'callout warn', text: 'This lab needs labs/s2-w2-sum.js (shared helpers), which did not load.' })) }));
    return;
  }
  const STORE = 'lab:s2-maxmin';
  const { SHOW } = U;
  const R = U.range;
  const uni = (a, b) => ({ fam: 'uniform', q: { a, b } });
  const geo = (p, k) => ({ fam: 'geometric', q: { p, [SHOW]: k || 10 } });
  const LOADED = () => ({ fam: 'custom', custom: { vals: [1, 2, 3, 4, 5, 6], probs: ['1/10', '1/10', '1/10', '1/10', '1/10', '1/2'] } });
  // L2.6 lecture table: rows are Y = 0, 1, 2; columns are X = 0, 1
  const L26 = () => ({ xs: [0, 1], ys: [0, 1, 2], cells: [['1/2', '1/16'], ['1/4', '1/32'], ['1/8', '1/32']] });
  const DICE = () => ({ xs: [1, 2, 3, 4, 5, 6], ys: [1, 2, 3, 4, 5, 6], cells: [1, 2, 3, 4, 5, 6].map(() => [1, 2, 3, 4, 5, 6].map(() => '1/36')) });
  const DEF = () => ({ mode: 'two', X: uni(1, 6), Y: uni(1, 6), n: 3, z: 4, view: 'max', joint: L26() });
  const plural = (n, w, ws) => n + ' ' + (n === 1 ? w : ws || w + 's');
  // Rule 0: a preset whose numbers come from this site's lesson pages says so in its label
  const LESSON = n => ' — the L' + n + ' lesson (not a lecture slide)';

  const PRESETS = [
    { label: 'Two fair dice (L2.9 max, L2.11 min)', source: 'L2.9 and L2.11: X, Y i.i.d. Uniform{1, …, 6}. The max gives 1, 3, 5, 7, 9, 11 out of 36; the min gives 11, 9, 7, 5, 3, 1. At z = 4: P(max = 4) = 7/36, P(min = 4) = 5/36.', set: { mode: 'two', X: uni(1, 6), Y: uni(1, 6), z: 4 } },
    { label: 'Two Uniform{1, …, 10} (L2.9)', source: 'L2.9 (≈ 8–10 min): P(max = z) = (2z − 1)/n², drawn as a ramp for n = 10: P(max = 10) = 19/100.', set: { mode: 'two', X: uni(1, 10), Y: uni(1, 10), z: 10 } },
    { label: 'Two loaded dice' + LESSON('2.9'), source: 'The L2.9 lesson, “Uneven stars” (the lecture uses fair dice only): independent dice with P(6) = 1/2 and 1/10 for each other face. P(max = 6) = 1 − (1/2)(1/2) = 3/4.', set: { mode: 'two', X: LOADED(), Y: LOADED(), z: 6 } },
    { label: 'Fair die X, loaded die Y' + LESSON('2.11'), source: 'The L2.11 lesson, the CDF square with our loaded die (not from the lecture): X fair, Y loaded (P(6) = 1/2). The block {max ≤ z} has area F_X(z)·F_Y(z).', set: { mode: 'two', X: uni(1, 6), Y: LOADED(), z: 4 } },
    { label: 'Three dice, n = 3 i.i.d.' + LESSON('2.11'), source: 'The lecture states P(max ≤ z) = F_X(z)ⁿ with letters (L2.11 ≈ 10–12 min); three dice come from the L2.11 lesson, “Many i.i.d. variables”: P(largest ≤ 4) = (4/6)³ = 8/27 and P(largest = 6) = 1 − (5/6)³ = 91/216.', set: { mode: 'iid', X: uni(1, 6), n: 3, z: 6 } },
    { label: 'Four dice: smallest ≥ 5' + LESSON('2.11'), source: 'The lecture states P(min ≥ z) = P(X ≥ z)ⁿ with letters (L2.11 ≈ 10–12 min); this is a recall question of the L2.11 lesson: four dice, P(smallest ≥ 5) = (2/6)⁴ = 1/81.', set: { mode: 'iid', X: uni(1, 6), n: 4, z: 5 } },
    { label: 'Two Geometric(1/2) (L2.11)', source: 'L2.11 (≈ 12–16 min): min(X, Y) ~ Geometric(1 − (1 − p)²); the lecture keeps p as a letter, p = 1/2 here: Geometric(3/4). The max is not geometric (the lecture’s exercise): P(max = 1) = 1/4 but P(max = 2) = 5/16.', set: { mode: 'two', X: geo('1/2'), Y: geo('1/2'), z: 2 } },
    { label: 'Geometric(1/2) and Geometric(1/3) (L2.11)', source: 'L2.11 with different p₁ and p₂ (the lecture uses letters; 1/2 and 1/3 are an example): min ~ Geometric(1 − (1/2)(2/3)) = Geometric(2/3).', set: { mode: 'two', X: geo('1/2'), Y: geo('1/3'), z: 2 } },
    { label: 'The L2.6 lecture table: max and min by the three cases (L2.6, L2.11)', source: 'L2.6 (≈ 3–6 min), the given joint PMF: X ∈ {0, 1}, Y ∈ {0, 1, 2} with 1/2, 1/4, 1/8 (X = 0) and 1/16, 1/32, 1/32 (X = 1). The lecture finds the max: 16/32, 11/32, 5/32 for z = 0, 1, 2. The min, by the three cases of L2.11 (≈ 2–4 min), is worked out here: 15/16, 1/16, 0. X and Y are not independent, so F_X·F_Y would be wrong.', set: { mode: 'joint', joint: L26(), z: 1 } },
    { label: 'A die thrown twice, as a joint table: min by the three cases (L2.11)', source: 'L2.11 (≈ 4–6 min): every cell of the 6 × 6 table is 1/36; the min = z cells are the corner (z, z) plus the two arms up and right: 11, 9, 7, 5, 3, 1 out of 36. At z = 2: 1 + 4 + 4 = 9 cells, 9/36.', set: { mode: 'joint', joint: DICE(), z: 2, view: 'min' } },
  ];

  function maxminLab(host) {
    const clone = o => JSON.parse(JSON.stringify(o));
    let st, ctl = {}, P = {}, good = {}, errs = {}, lastRange = '';
    const save = () => Lab.store.set(STORE, st);
    const schedule = Lab.debounce(() => draw(), 40);
    load(Lab.store.get(STORE, null));
    build();

    function load(saved) {
      st = Object.assign(DEF(), saved && typeof saved === 'object' ? clone(saved) : {});
      if (!['two', 'iid', 'joint'].includes(st.mode)) st.mode = 'two';
      if (!['max', 'min', 'X', 'Y'].includes(st.view)) st.view = 'max';
      st.n = Math.max(2, Math.min(10, Math.round(+st.n) || 3));
      if (!Number.isFinite(+st.z)) st.z = 4;
      good = { X: null, Y: null, J: null }; errs = { X: '', Y: '', J: '' };
      ['X', 'Y'].forEach(nm => {
        const r = U.fromSpec(st[nm], nm);
        if (r.m) good[nm] = r.m;
        else { st[nm] = uni(1, 6); good[nm] = U.fromSpec(st[nm], nm).m; }
      });
      const rj = U.jointFrom(st.joint);
      if (rj.J) good.J = rj.J; else { st.joint = L26(); good.J = U.jointFrom(st.joint).J; }
    }

    /* ------------------------------------------------------------------ controls */
    function build(pre) {
      const { side, main } = K.layout(host, 't4b-lab');
      ctl = {}; P = {}; lastRange = '';
      side.appendChild(K.group('Lecture and lesson examples'));
      ctl.pre = K.presets({ label: 'Load an example (L2.6, L2.9, L2.11, or the lessons)', items: PRESETS, onPick: it => loadPreset(it) });
      side.appendChild(ctl.pre);
      if (pre != null) { ctl.pre.select.value = String(pre); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[pre].source); }

      side.appendChild(K.group('1 · How the variables are given'));
      ctl.mode = Lab.seg([{ label: 'Two: X and Y', value: 'two' }, { label: 'n i.i.d. copies of X', value: 'iid' }, { label: 'A joint table (any)', value: 'joint' }], st.mode, v => { st.mode = v; syncMode(); draw(); });
      ctl.mode.classList.add('t4b-seg3');
      side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Two independent variables, n independent copies of one distribution, or your own joint table (dependent or not)?' }), ctl.mode));
      ctl.xHost = h('div', { class: 't4b-px' });
      ctl.xTitle = K.group('2 · Your X');
      ctl.xBox = h('div', { class: 't4b-ctl' }, ctl.xTitle, ctl.xHost);
      side.appendChild(ctl.xBox);
      ctl.yHost = h('div', { class: 't4b-py' });
      ctl.yBox = h('div', { class: 't4b-ctl' }, K.group('3 · Your Y (independent of X)'), ctl.yHost);
      ctl.n = K.numField({ label: 'Number of copies ' + tex('n'), min: 2, max: 10, value: st.n, onChange: v => { st.n = v; draw(); } });
      ctl.n.classList.add('t4b-n');
      ctl.nBox = h('div', { class: 't4b-ctl' }, K.group('3 · How many copies'), ctl.n);
      ctl.jHost = h('div', { class: 't4b-pj' });
      ctl.jBox = h('div', { class: 't4b-ctl' }, K.group('2 · Your joint table'),
        K.note('Values of ' + tex('X') + ' across the top, values of ' + tex('Y') + ' down the left, ' + tex('f_{XY}(x,y)') + ' in the cells. Whole-number values; the cells must add up to 1. No independence is assumed: max and min come from the three cases of L2.11.'), ctl.jHost);
      side.append(ctl.yBox, ctl.nBox, ctl.jBox);
      mountPicker('X'); mountPicker('Y'); mountJoint();
      ctl.zTitle = K.group('4 · The value z');
      side.appendChild(ctl.zTitle);
      ctl.z = K.numField({ label: 'Value ' + tex('z') + ' for ' + tex('\\max=z') + ' and ' + tex('\\min=z'), min: 1, max: 6, value: st.z, onChange: v => { st.z = v; draw(); } });
      ctl.z.classList.add('t4b-z');
      side.appendChild(ctl.z);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); load(null); build(); }, 'btn ghost sm')));

      P.err = h('div', { class: 't4b-err', hidden: true });
      P.answer = K.answer();
      P.grid = K.panel('The L-shapes for ' + tex('\\max=z') + ' and ' + tex('\\min=z'));
      P.pmf = K.panel('PMFs: the max and the min, next to the inputs');
      P.cdf = K.panel('CDFs: the max and the min, next to the inputs');
      P.steps = K.panel('How it is computed (the CDF method), with your numbers');
      P.check = K.panel('Cross-checks and known results', 'Other ways to get the same numbers, from L2.9 and L2.11.');
      main.append(P.err, P.answer, P.grid, P.pmf, P.cdf, P.steps, P.check);
      syncMode();
      draw();
    }
    function mountPicker(nm) {
      const host = nm === 'X' ? ctl.xHost : ctl.yHost;
      Lab.clear(host);
      const s = st[nm];
      const params = {};
      if (s.fam !== 'custom' && s.q) params[s.fam] = Object.assign({}, s.q);
      const custom = s.custom ? { vals: s.custom.vals.slice(), probs: s.custom.probs.slice() } : undefined;
      host.appendChild(K.distPicker({ label: 'Distribution of ' + tex(nm), families: U.fams(), value: s.fam, params, custom, xName: nm, onChange: r => onPick(nm, r) }));
    }
    function onPick(nm, r) {
      if (!r.fam && !r.ok) {
        errs[nm] = 'The PMF of ' + nm + ' is not valid yet (see the message under it). The pictures still show your last valid ' + nm + '.';
        schedule();
        return;
      }
      const spec = U.specFromPick(r);
      const s = st[nm];
      s.fam = spec.fam;
      if (spec.fam === 'custom') s.custom = spec.custom; else s.q = spec.q;
      const res = U.fromSpec(s, nm);
      if (res.m) { good[nm] = res.m; errs[nm] = ''; } else errs[nm] = res.err + ' The pictures still show your last valid ' + nm + '.';
      schedule();
    }
    function mountJoint() {
      Lab.clear(ctl.jHost);
      const j = st.joint;
      ctl.grid = K.gridEditor({ label: 'Joint PMF ' + tex('f_{XY}(x,y)'), xs: j.xs, ys: j.ys, cells: j.cells, xName: 'X', yName: 'Y', onChange: onJoint });
      ctl.jHost.appendChild(ctl.grid);
    }
    function onJoint(r) {
      if (!r.ok) {
        errs.J = (r.total && !r.total.eq(1) ? 'The cells of the joint table add up to ' + U.txt(r.total) + ', not 1.' : 'Fix the red boxes in the joint table.') + ' The pictures still show your last valid table.';
        schedule();
        return;
      }
      const j = { xs: r.xs.slice(), ys: r.ys.slice(), cells: r.cells.map(row => row.map(c => String(c))) };
      const res = U.jointFrom(j);
      if (res.J) { good.J = res.J; errs.J = ''; st.joint = j; } else errs.J = res.err + ' The pictures still show your last valid table.';
      schedule();
    }
    function loadPreset(it) {
      const k = PRESETS.indexOf(it);
      load(Object.assign(DEF(), clone(it.set)));
      build(k);
    }
    function syncMode() {
      const two = st.mode === 'two', joint = st.mode === 'joint';
      ctl.xBox.hidden = joint;
      ctl.yBox.hidden = !two;
      ctl.nBox.hidden = st.mode !== 'iid';
      ctl.jBox.hidden = !joint;
      ctl.xTitle.textContent = two ? '2 · Your X' : '2 · Your X (each copy has this PMF)';
      ctl.zTitle.textContent = (joint ? '3' : '4') + ' · The value z';
    }
    function setZ(v) { st.z = v; ctl.z.set(v); draw(); }
    /** a panel's title (the panel stays alive, so a pinned copy keeps working) */
    function setTitle(panel, html) { const t = panel.querySelector('.pl-panel-head h3'); if (t) Lab.setHTML(t, html); }

    /* --------------------------------------------------------------- the numbers */
    /** a joint table, dependent or not: max and min from the three disjoint cases of L2.11 */
    function computeJoint() {
      const J = good.J;
      if (!J) return null;
      const xi = new Map(J.xs.map((x, i) => [x, i])), yk = new Map(J.ys.map((y, k) => [y, k]));
      const f = (x, y) => (xi.has(x) && yk.has(y) ? J.p[xi.get(x)][yk.get(y)] : F(0));
      const A = U.finite('X', J.xs, J.xs.map((_, i) => U.sum(J.p[i])));
      const B = U.finite('Y', J.ys, J.ys.map((_, k) => U.sum(J.p.map(r => r[k]))));
      A.tex = B.tex = '\\text{the marginal of your table}';
      const cells = [];
      J.xs.forEach((x, i) => J.ys.forEach((y, k) => cells.push({ x, y, p: J.p[i][k] })));
      const add = list => U.sum(list.map(c => c.p));
      // the pieces of each L: the corner, and the arms (only cells of the table; a missing cell is 0)
      const pieces = z => ({
        corner: f(z, z),
        down: cells.filter(c => c.x === z && c.y < z), left: cells.filter(c => c.y === z && c.x < z),
        up: cells.filter(c => c.x === z && c.y > z), right: cells.filter(c => c.y === z && c.x > z),
      });
      const pmax = z => { const q = pieces(z); return U.add(U.add(q.corner, add(q.down)), add(q.left)); };
      const pmin = z => { const q = pieces(z); return U.add(U.add(q.corner, add(q.up)), add(q.right)); };
      // the blocks: P(max ≤ z) and P(min ≥ z) are sums of cells (no product needed)
      const Fmax = z => add(cells.filter(c => c.x <= z && c.y <= z));
      const Smin = z => add(cells.filter(c => c.x >= z && c.y >= z));
      const zLo = Math.min(J.xs[0], J.ys[0]), zHi = Math.max(J.xs[J.xs.length - 1], J.ys[J.ys.length - 1]);
      const zs = R(zLo, zHi);
      let bad = null;
      J.xs.forEach(x => J.ys.forEach(y => { if (!bad && !U.same(f(x, y), U.mul(A.pmf(x), B.pmf(y)))) bad = { x, y }; }));
      return {
        joint: true, iid: false, J, f, cells, pieces, A, B, n: 2,
        FX: z => A.cdf(z), FY: z => B.cdf(z), SX: z => A.tail(z), SY: z => B.tail(z), Fmax, Smin, pmax, pmin,
        zLo, zHi, zs, infinite: false, maxs: zs.map(pmax), mins: zs.map(pmin), tailMax: F(0), tailMin: F(0),
        mx: '\\max(X,Y)', mn: '\\min(X,Y)', indep: !bad, bad,
        xs: R(J.xs[0], J.xs[J.xs.length - 1]), ys: R(J.ys[0], J.ys[J.ys.length - 1]),
      };
    }
    function compute() {
      if (st.mode === 'joint') return computeJoint();
      const iid = st.mode === 'iid';
      const A = good.X, B = iid ? good.X : good.Y;
      if (!A || !B) return null;
      const n = iid ? st.n : 2;
      const keep = v => (U.isEx(U.norm(v)) ? U.norm(v) : Math.max(0, U.num(v)));
      const FX = z => A.cdf(z), FY = z => B.cdf(z), SX = z => A.tail(z), SY = z => B.tail(z);
      const Fmax = z => keep(iid ? U.pow(FX(z), n) : U.mul(FX(z), FY(z)));
      const Smin = z => keep(iid ? U.pow(SX(z), n) : U.mul(SX(z), SY(z)));
      // P(max = z) = F_max(z) − F_max(z − 1), written without the subtraction so tiny values keep their digits:
      // two: f_X(z)F_Y(z) + F_X(z−1)f_Y(z);  n copies: (F(z−1) + f(z))^n − F(z−1)^n = Σ_j C(n,j) f(z)^j F(z−1)^(n−j)
      const fX = z => A.pmf(z), fY = z => B.pmf(z);
      const grow = (f, G) => { let s = F(0); for (let j = 1; j <= n; j++) s = U.add(s, U.mul(U.mul(U.fi(Lab.math.choose(n, j)), U.pow(f, j)), U.pow(G, n - j))); return s; };
      const pmax = z => keep(iid ? grow(fX(z), FX(z - 1)) : U.add(U.mul(fX(z), FY(z)), U.mul(FX(z - 1), fY(z))));
      const pmin = z => keep(iid ? grow(fX(z), SX(z + 1)) : U.add(U.mul(fX(z), SY(z)), U.mul(SX(z + 1), fY(z))));
      // P(max > zHi) = 1 − F_max(zHi), from the tails P(X > zHi), P(Y > zHi) (no cancellation)
      const tX = SX(Math.max(A.show, B.show) + 1), tY = SY(Math.max(A.show, B.show) + 1);
      const tailMax = iid
        ? (U.isEx(U.norm(tX)) ? U.sub(F(1), U.pow(U.sub(F(1), tX), n)) : -Math.expm1(n * Math.log1p(-U.num(tX))))
        : U.sub(U.add(tX, tY), U.mul(tX, tY));
      const zLo = Math.min(A.lo, B.lo), zHi = Math.max(A.show, B.show);
      const zs = R(zLo, zHi);
      const infinite = !A.finite || !B.finite;
      return {
        joint: false, iid, A, B, n, FX, FY, SX, SY, Fmax, Smin, pmax, pmin, zLo, zHi, zs, infinite,
        f: (x, y) => U.mul(A.pmf(x), B.pmf(y)), xs: R(A.lo, A.show), ys: R(B.lo, B.show),
        maxs: zs.map(pmax), mins: zs.map(pmin),
        tailMax: keep(tailMax), tailMin: Smin(zHi + 1),
        mx: iid ? '\\max(X_1,\\dots,X_{' + n + '})' : '\\max(X,Y)',
        mn: iid ? '\\min(X_1,\\dots,X_{' + n + '})' : '\\min(X,Y)',
      };
    }

    /* ------------------------------------------------------------------- drawing */
    function draw() {
      save();
      const list = st.mode === 'two' ? [errs.X, errs.Y] : st.mode === 'joint' ? [errs.J] : [errs.X];
      P.err.hidden = !list.some(Boolean);
      Lab.setHTML(P.err, list.filter(Boolean).map(m => '<div>' + Lab.esc(m) + '</div>').join(''));
      const D = compute();
      if (!D) return;
      const key = D.zLo + ':' + D.zHi;
      if (key !== lastRange) { lastRange = key; ctl.z.setRange(D.zLo, D.zHi); }
      const z0 = Math.max(D.zLo, Math.min(D.zHi, Math.round(+st.z)));
      if (z0 !== st.z) { st.z = z0; ctl.z.set(z0); save(); }
      ctl.z.hint('From ' + D.zLo + ' (the smallest value of ' + (D.iid ? tex('X') : tex('X') + ' or ' + tex('Y')) + (D.joint ? ' in your table' : '') + ') to ' + D.zHi + (D.infinite ? ' (the largest value drawn; there is no largest value)' : ' (the largest value)') + '.');
      setTitle(P.steps, D.joint ? 'How it is computed (the three cases of L2.11), with your numbers' : 'How it is computed (the CDF method), with your numbers');
      drawAnswer(D); drawGrid(D); drawPmf(D); drawCdf(D); drawSteps(D); drawCheck(D);
    }

    function drawAnswer(D) {
      const z = st.z;
      if (D.joint) {
        const q = D.pieces(z), t = v => U.tx(v), add = list => U.sum(list.map(c => c.p));
        const ev = 'Your joint table ' + tex('f_{XY}') + ': values of ' + tex('X') + ' ' + tex('\\{' + D.J.xs.join(',') + '\\}') + ', values of ' + tex('Y') + ' ' + tex('\\{' + D.J.ys.join(',') + '\\}') + '. No independence is assumed' + (D.indep ? ' (your table happens to be independent)' : ' — and your table is <b>not</b> independent') + '. You chose ' + tex('z=' + z) + '.';
        const big = '\\begin{aligned}P(' + D.mx + '=' + z + ')&' + U.rel(D.pmax(z)) + '\\\\ P(' + D.mn + '=' + z + ')&' + U.rel(D.pmin(z)) + '\\end{aligned}';
        const sub = 'Three pieces of each L that cannot happen together (L2.11): the corner ' + tex('f_{XY}(' + z + ',' + z + ')') + ' and two arms. ' +
          tex('P(\\max=' + z + ')=' + t(q.corner) + '+' + t(add(q.down)) + '+' + t(add(q.left))) + ' (corner + arm ' + tex('X=' + z + ',\\,Y<' + z) + ' + arm ' + tex('X<' + z + ',\\,Y=' + z) + '); ' +
          tex('P(\\min=' + z + ')=' + t(q.corner) + '+' + t(add(q.up)) + '+' + t(add(q.right))) + ' (arms with ' + tex('>') + '). Steps below.';
        K.setAnswer(P.answer, { ev, big, sub });
        P.answer.dataset.plain = 'z=' + z + ';max=' + U.plain(D.pmax(z)) + ';min=' + U.plain(D.pmin(z)) + ';Fmax=' + U.plain(D.Fmax(z)) + ';Smin=' + U.plain(D.Smin(z)) + ';zHi=' + D.zHi + ';indep=' + D.indep + ';maxs=' + D.maxs.map(U.plain).join(',') + ';mins=' + D.mins.map(U.plain).join(',');
        return;
      }
      const ev = D.iid
        ? tex('X_1,\\dots,X_{' + D.n + '}') + ' i.i.d. ' + tex(D.A.tex) + ' (you chose ' + tex('n=' + D.n) + ' copies, each with your PMF of ' + tex('X') + '). You chose ' + tex('z=' + z) + '.'
        : 'Your ' + tex('X\\sim ' + D.A.tex) + ' and ' + tex('Y\\sim ' + D.B.tex) + ', independent. You chose ' + tex('z=' + z) + '.';
      const big = '\\begin{aligned}P(' + D.mx + '=' + z + ')&' + U.rel(D.pmax(z)) + '\\\\ P(' + D.mn + '=' + z + ')&' + U.rel(D.pmin(z)) + '\\end{aligned}';
      const sub = 'The CDF method (steps below): ' + tex('P(\\max=' + z + ')=F_{\\max}(' + z + ')-F_{\\max}(' + (z - 1) + ')=' + U.tx(D.Fmax(z)) + '-' + U.tx(D.Fmax(z - 1))) + ' and ' +
        tex('P(\\min=' + z + ')=P(\\min\\ge ' + z + ')-P(\\min\\ge ' + (z + 1) + ')=' + U.tx(D.Smin(z)) + '-' + U.tx(D.Smin(z + 1))) + '.';
      K.setAnswer(P.answer, { ev, big, sub });
      P.answer.dataset.plain = 'z=' + z + ';max=' + U.plain(D.pmax(z)) + ';min=' + U.plain(D.pmin(z)) + ';Fmax=' + U.plain(D.Fmax(z)) + ';Smin=' + U.plain(D.Smin(z)) + ';zHi=' + D.zHi + ';tailMax=' + U.plain(D.tailMax) + ';tailMin=' + U.plain(D.tailMin);
    }

    /* the grid: two L's (two variables), or one strip per copy (n ≥ 3 copies) */
    function drawGrid(D) {
      const body = P.grid.body;
      Lab.clear(body);
      const z = st.z;
      if (D.n > 2) {
        P.grid.sub('With ' + tex('n=' + D.n) + ' copies the pairs grid would need ' + D.n + ' dimensions. The CDF method only needs this: the max is ' + tex('\\le z') + ' when <b>every</b> copy is ' + tex('\\le z') + ', and the min is ' + tex('\\ge z') + ' when <b>every</b> copy is ' + tex('\\ge z') + '. Teal = the allowed values.');
        const two = h('div', { class: 't4b-two' });
        two.append(stripsBox(D, 'max'), stripsBox(D, 'min'));
        body.appendChild(two);
        return;
      }
      const A = D.A, B = D.B;
      const xs = D.xs, ys = D.ys, f = D.f;
      P.grid.sub(D.joint
        ? 'A star for every cell of your table with ' + tex('f_{XY}(x,y)>0') + ' (' + tex('x') + ' across, ' + tex('y') + ' up); a bigger star means a bigger probability, read straight from your table. Violet: the stars with ' + tex('\\max=' + z) + ' (left) and ' + tex('\\min=' + z) + ' (right) — each L is the corner plus two arms, the three cases of L2.11. Teal shading: the block ' + tex('\\{\\max\\le ' + z + '\\}') + ' and ' + tex('\\{\\min\\ge ' + z + '\\}') + '; dashed: the same block one step further. Tap a star to choose its value.'
        : 'A star for every pair ' + tex('(x,y)') + ' that can happen' + (D.iid ? ' (here ' + tex('X_1') + ' across, ' + tex('X_2') + ' up)' : ' (' + tex('x') + ' across, ' + tex('y') + ' up)') + '; its probability is ' + tex('f_X(x)\\,f_Y(y)') + ' (independent), and a bigger star means a bigger probability. Violet: the stars with ' + tex('\\max=' + z) + ' (left) and ' + tex('\\min=' + z) + ' (right). Teal shading: the block ' + tex('\\{\\max\\le ' + z + '\\}') + ' and ' + tex('\\{\\min\\ge ' + z + '\\}') + '; dashed: the same block one step further. Tap a star to choose its value.');
      const two = h('div', { class: 't4b-two' });
      [['max', 'down and left', (x, y) => Math.max(x, y), (x, y) => x <= z && y <= z],
        ['min', 'up and right', (x, y) => Math.min(x, y), (x, y) => x >= z && y >= z]].forEach(([kind, arms, g, blk]) => {
        const box = h('div', { class: 't4b-chart' });
        box.appendChild(h('div', { class: 't4b-cap', html: tex('\\' + kind + '(x,y)=' + z) + ': an L with corner ' + tex('(' + z + ',' + z + ')') + ', arms ' + arms }));
        const stage = h('div', { class: 't4b-stage' });
        stage.appendChild(U.starGrid({ xs, ys, f, g, gName: kind + '(x, y)', on: (x, y) => g(x, y) === z, blk, shape: kind, z, prev: true, maxPx: 330, onPick: (x, y) => setZ(g(x, y)), aria: 'grid with the L-shape ' + kind + '(x, y) = ' + z }));
        box.appendChild(stage);
        const onL = [];
        xs.forEach(x => ys.forEach(y => { if (g(x, y) === z && U.num(f(x, y)) > 0) onL.push({ x, y }); }));
        const p = kind === 'max' ? D.pmax(z) : D.pmin(z);
        let html = plural(onL.length, 'star') + ' on this L' + (onL.length ? ': ' + U.pairsHtml(onL) : '') + '. ';
        if (kind === 'min' && (!A.finite || !B.finite)) html += 'Its arms go on past the drawn grid. ';
        html += 'Their probabilities add up to ' + tex('P(\\' + kind + '=' + z + ')' + U.rel(p)) + (D.joint ? ' (worked out in the steps below).' : ' (worked out in the cross-checks below).');
        box.appendChild(h('div', { class: 'ws-readout', html }));
        two.appendChild(box);
      });
      body.appendChild(two);
      [A, B].filter((m, i) => !m.finite && !(D.iid && i === 1)).forEach(m => body.appendChild(K.note('Your ' + tex(m.nm + '\\sim ' + m.tex) + ' has no largest value; the grid stops at ' + tex(m.show) + ' (your “shown up to k”). The stars beyond hold ' + tex('P(' + m.nm + '>' + m.show + ')' + U.rel(m.notDrawn)) + ' of its probability.', 'pl-hint t4b-trunc')));
    }
    function stripsBox(D, kind) {
      const A = D.A, n = D.n, z = st.z;
      const vals = R(A.lo, A.show);
      const ok = v => (kind === 'max' ? v <= z : v >= z);
      const pv = kind === 'max' ? D.FX(z) : D.SX(z);
      const box = h('div', { class: 't4b-chart' });
      box.appendChild(h('div', { class: 't4b-cap', html: kind === 'max' ? tex('\\{\\max\\le ' + z + '\\}') + ': every copy ' + tex('\\le ' + z) : tex('\\{\\min\\ge ' + z + '\\}') + ': every copy ' + tex('\\ge ' + z) }));
      const wrap = h('div', { class: 't4b-strips' });
      for (let i = 1; i <= n; i++) {
        const cells = h('div', { class: 't4b-cells' }, vals.map(v => h('span', { class: 't4b-cell' + (ok(v) && !U.isZero(A.pmf(v)) ? ' ok' : ''), text: String(v) })));
        if (!A.finite) cells.appendChild(h('span', { class: 't4b-cell' + (kind === 'min' ? ' ok' : ''), text: '…' }));
        wrap.appendChild(h('div', { class: 't4b-strip' }, h('span', { class: 't4b-strip-name', html: tex('X_{' + i + '}') }), cells));
      }
      box.appendChild(wrap);
      const one = kind === 'max' ? 'P(X_i\\le ' + z + ')=F_X(' + z + ')' : 'P(X_i\\ge ' + z + ')';
      const all = kind === 'max' ? 'P(\\max\\le ' + z + ')' : 'P(\\min\\ge ' + z + ')';
      const tot = kind === 'max' ? D.Fmax(z) : D.Smin(z);
      box.appendChild(h('div', { class: 'ws-readout', html: 'Each copy: ' + tex(one + U.rel(pv)) + '. All ' + n + ' copies at once (independent, so multiply): ' + tex(all + '=\\left(' + U.tx(pv) + '\\right)^{' + n + '}' + U.rel(tot)) + '.' }));
      return box;
    }

    function drawPmf(D) {
      const body = P.pmf.body;
      Lab.clear(body);
      const z = st.z;
      const two = h('div', { class: 't4b-two' });
      if (D.joint) {
        two.appendChild(U.pmfBox('PMF of ' + tex('X') + ' (marginal: add each column of your table)', D.A, 'x', { hot: z }));
        two.appendChild(U.pmfBox('PMF of ' + tex('Y') + ' (marginal: add each row of your table)', D.B, 'y', { hot: z }));
      } else {
        two.appendChild(U.pmfBox('PMF of ' + tex('X\\sim ' + D.A.tex) + (D.iid ? ' (each copy)' : ''), D.A, 'x', { hot: z }));
        if (!D.iid) two.appendChild(U.pmfBox('PMF of ' + tex('Y\\sim ' + D.B.tex), D.B, 'y', { hot: z }));
      }
      [['max', D.maxs, D.tailMax, D.mx], ['min', D.mins, D.tailMin, D.mn]].forEach(([kind, ps, tail, name]) => {
        const rows = D.zs.map((v, i) => ({ x: v, p: ps[i], hot: v === z, label: U.barLab(ps[i]) }));
        const box = h('div', { class: 't4b-chart' });
        box.appendChild(h('div', { class: 'ws-title', html: 'PMF of ' + tex(name) + ' — violet: your ' + tex('z=' + z) + '; tap a bar to choose ' + tex('z') }));
        box.appendChild(U.pmfChart(rows, { xName: 'z', tone: 'z', height: 150, showValues: rows.length <= 16, xPlain: kind, onPick: v => setZ(v) }));
        const drawn = U.sum(ps);
        box.appendChild(K.note(U.num(tail) > 0
          ? 'The drawn bars add up to ' + tex(U.tx(drawn)) + '; not drawn: ' + tex('P(\\' + kind + '>' + D.zHi + ')' + U.rel(tail)) + '.'
          : 'The bars add up to ' + tex(U.tx(drawn)) + (U.same(drawn, F(1), 1e-9) ? ' ✓' : '') + '.', 'pl-hint' + (U.num(tail) > 0 ? ' t4b-trunc' : '')));
        two.appendChild(box);
      });
      body.appendChild(two);
      body.appendChild(K.note('Compare the shapes: the max piles up on large values (it needs only <b>one</b> large value), the min on small values (it needs only one small value).', 'pl-hint'));
    }

    function drawCdf(D) {
      const body = P.cdf.body;
      Lab.clear(body);
      const z = st.z;
      if (D.iid && st.view === 'Y') st.view = 'X';
      const opts = [{ label: 'max', value: 'max' }, { label: 'min', value: 'min' }, { label: 'X', value: 'X' }];
      if (!D.iid) opts.push({ label: 'Y', value: 'Y' });
      const seg = Lab.seg(opts, st.view, v => { st.view = v; save(); drawCdf(D); });
      body.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Draw the CDF of' }), seg));
      let vals, ps, name, trunc;
      if (st.view === 'max' || st.view === 'min') {
        vals = D.zs; ps = st.view === 'max' ? D.maxs : D.mins; name = st.view === 'max' ? D.mx : D.mn;
        trunc = U.num(st.view === 'max' ? D.tailMax : D.tailMin) > 0;
      } else {
        const m = st.view === 'X' ? D.A : D.B;
        vals = R(m.lo, m.finite ? m.hi : m.show); ps = vals.map(v => m.pmf(v)); name = m.nm; trunc = !m.finite;
      }
      body.appendChild(K.cdfChart(U.cdfDist(vals, ps), { xName: name, t: z, truncated: trunc }));
      body.appendChild(K.note(D.joint
        ? 'All the values side by side. For your table, ' + tex('P(\\max\\le z)') + ' and ' + tex('P(\\min\\ge z)') + ' are block sums of cells. The products ' + tex('F_X(z)F_Y(z)') + ' and ' + tex('P(X\\ge z)P(Y\\ge z)') + ' agree with them only for an independent table (✓/✗). Tap a row to choose ' + tex('z') + '.'
        : 'All the CDF values side by side. The max uses ' + tex('F') + ' (“at most”); the min uses the tail ' + tex('P(\\cdot\\ge z)') + ' (“at least”). Tap a row to choose ' + tex('z') + '.', 'pl-hint'));
      body.appendChild(cdfTable(D));
    }
    function cdfTable(D) {
      const z = st.z, n = D.n;
      const c = v => tex(U.tx(v, 9999));
      if (D.joint) {
        const mk = ok => (ok ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>');
        const rowsJ = D.zs.map((v, i) => {
          const pa = U.mul(D.FX(v), D.FY(v)), pb = U.mul(D.SX(v), D.SY(v));
          return { cls: v === z ? 't4b-on' : null, onClick: () => setZ(v), cells: [tex(String(v)), c(D.Fmax(v)), c(pa), mk(U.same(pa, D.Fmax(v))), c(D.maxs[i]), c(D.Smin(v)), c(pb), mk(U.same(pb, D.Smin(v))), c(D.mins[i])] };
        });
        return U.table([tex('z'), tex('P(\\max\\le z)') + ' (block)', tex('F_X(z)F_Y(z)'), 'same?', tex('P(\\max=z)'), tex('P(\\min\\ge z)') + ' (block)', tex('P(X\\ge z)P(Y\\ge z)'), 'same?', tex('P(\\min=z)')], rowsJ, { tall: rowsJ.length > 12 });
      }
      const head = D.iid
        ? [tex('z'), tex('F_X(z)'), tex('F_{\\max}(z)=F_X(z)^{' + n + '}'), tex('P(\\max=z)'), tex('P(X\\ge z)'), tex('P(\\min\\ge z)=P(X\\ge z)^{' + n + '}'), tex('P(\\min=z)')]
        : [tex('z'), tex('F_X(z)'), tex('F_Y(z)'), tex('F_{\\max}=F_XF_Y'), tex('P(\\max=z)'), tex('P(X\\ge z)'), tex('P(Y\\ge z)'), tex('P(\\min\\ge z)'), tex('P(\\min=z)')];
      const rows = D.zs.map((v, i) => ({
        cls: v === z ? 't4b-on' : null, onClick: () => setZ(v),
        cells: D.iid
          ? [tex(String(v)), c(D.FX(v)), c(D.Fmax(v)), c(D.maxs[i]), c(D.SX(v)), c(D.Smin(v)), c(D.mins[i])]
          : [tex(String(v)), c(D.FX(v)), c(D.FY(v)), c(D.Fmax(v)), c(D.maxs[i]), c(D.SX(v)), c(D.SY(v)), c(D.Smin(v)), c(D.mins[i])],
      }));
      return U.table(head, rows, { tall: rows.length > 12 });
    }

    /** a joint table: the three disjoint cases of L2.11 with the learner's cells, then the block check */
    function stepsJoint(D) {
      const body = P.steps.body;
      const z = st.z, q = D.pieces(z), t = v => U.tx(v);
      const add = list => U.sum(list.map(c => c.p));
      const cell = c => 'f_{XY}(' + c.x + ',' + c.y + ')';
      const hasCorner = D.J.xs.includes(z) && D.J.ys.includes(z);
      const cornerLine = 'f_{XY}(' + z + ',' + z + ')=' + t(q.corner) + (hasCorner ? '' : '\\quad(\\text{not a cell of your table})');
      // one arm: its cells, their values, their total ("= 0" when the arm has no cells)
      const armLine = (sym, list) => {
        if (!list.length) return sym + '=0';
        const names = list.length <= 4 ? list.map(cell).join('+') + '=' : '';
        const vals = list.length <= 6 ? list.map(c => t(c.p)).join('+') : list.slice(0, 3).map(c => t(c.p)).join('+') + '+\\dots+' + t(list[list.length - 1].p);
        return sym + '=' + names + vals + (list.length > 1 ? U.rel(add(list)) : '');
      };
      const al = lines => '\\begin{aligned}' + lines.map(l => l.replace('=', '&=')).join('\\\\') + '\\end{aligned}';
      body.appendChild(h('div', { class: 't4b-sub', html: 'The maximum: corner + arm down + arm left' }));
      body.appendChild(K.steps([
        { html: tex('\\max(X,Y)=' + z) + ' happens in three ways that cannot happen together (L2.11 ≈ 2–4 min; the lecture works the min and leaves the max as an exercise): both are ' + tex(z) + ' (the corner); ' + tex('X=' + z) + ' and ' + tex('Y<' + z) + ' (the arm going down); ' + tex('X<' + z) + ' and ' + tex('Y=' + z) + ' (the arm going left). Each piece is read straight from your table — no independence needed:', math: '\\begin{aligned}P(\\max(X,Y)=z)&=f_{XY}(z,z)\\\\&\\quad+\\sum_{y<z}f_{XY}(z,y)+\\sum_{x<z}f_{XY}(x,z)\\end{aligned}' },
        { html: 'Your cells at ' + tex('z=' + z) + ' (' + plural(q.down.length, 'cell') + ' in the arm down, ' + plural(q.left.length, 'cell') + ' in the arm left):', math: al([cornerLine, armLine('\\sum_{y<' + z + '}f_{XY}(' + z + ',y)', q.down), armLine('\\sum_{x<' + z + '}f_{XY}(x,' + z + ')', q.left)]) },
        { html: 'Add the three pieces:', math: '\\begin{aligned}P(\\max=' + z + ')&=' + t(q.corner) + '+' + t(add(q.down)) + '+' + t(add(q.left)) + '\\\\&' + U.rel(D.pmax(z)) + '\\end{aligned}' },
      ]));
      body.appendChild(h('div', { class: 't4b-sub', html: 'The minimum: corner + arm up + arm right' }));
      body.appendChild(K.steps([
        { html: tex('\\min(X,Y)=' + z) + ' means one of them is ' + tex(z) + ' and the other is ' + tex('\\ge ' + z) + ' (L2.11 ≈ 2–3 min): both ' + tex(z) + '; ' + tex('X=' + z) + ' and ' + tex('Y>' + z) + ' (arm up); ' + tex('X>' + z) + ' and ' + tex('Y=' + z) + ' (arm right):', math: '\\begin{aligned}P(\\min(X,Y)=z)&=f_{XY}(z,z)\\\\&\\quad+\\sum_{y>z}f_{XY}(z,y)+\\sum_{x>z}f_{XY}(x,z)\\end{aligned}' },
        { html: 'Your cells at ' + tex('z=' + z) + ' (' + plural(q.up.length, 'cell') + ' in the arm up, ' + plural(q.right.length, 'cell') + ' in the arm right):', math: al([cornerLine, armLine('\\sum_{y>' + z + '}f_{XY}(' + z + ',y)', q.up), armLine('\\sum_{x>' + z + '}f_{XY}(x,' + z + ')', q.right)]) },
        { html: 'Add the three pieces:', math: '\\begin{aligned}P(\\min=' + z + ')&=' + t(q.corner) + '+' + t(add(q.up)) + '+' + t(add(q.right)) + '\\\\&' + U.rel(D.pmin(z)) + '\\end{aligned}' },
      ]));
      body.appendChild(h('div', { class: 't4b-sub', html: 'Check with blocks of cells' }));
      body.appendChild(K.steps([
        { html: tex('\\{\\max\\le ' + z + '\\}') + ' is the block of cells with ' + tex('x\\le ' + z) + ' and ' + tex('y\\le ' + z) + ' (teal in the grid). Take away the block one step down and exactly the L is left:', math: '\\begin{aligned}P(\\max=' + z + ')&=P(\\max\\le ' + z + ')-P(\\max\\le ' + (z - 1) + ')\\\\&=' + t(D.Fmax(z)) + '-' + t(D.Fmax(z - 1)) + U.rel(U.sub(D.Fmax(z), D.Fmax(z - 1))) + '\\end{aligned}', note: U.same(U.sub(D.Fmax(z), D.Fmax(z - 1)), D.pmax(z)) ? '<span class="cgood">Same as the three cases ✓</span>' : '' },
        { html: tex('\\{\\min\\ge ' + z + '\\}') + ' is the block with ' + tex('x\\ge ' + z) + ' and ' + tex('y\\ge ' + z) + '; take away the block one step up:', math: '\\begin{aligned}P(\\min=' + z + ')&=P(\\min\\ge ' + z + ')-P(\\min\\ge ' + (z + 1) + ')\\\\&=' + t(D.Smin(z)) + '-' + t(D.Smin(z + 1)) + U.rel(U.sub(D.Smin(z), D.Smin(z + 1))) + '\\end{aligned}', note: U.same(U.sub(D.Smin(z), D.Smin(z + 1)), D.pmin(z)) ? '<span class="cgood">Same as the three cases ✓</span>' : '' },
      ]));
    }
    function drawSteps(D) {
      const body = P.steps.body;
      Lab.clear(body);
      if (D.joint) { stepsJoint(D); return; }
      const z = st.z, A = D.A, B = D.B, n = D.n;
      const al = lines => '\\begin{aligned}' + lines.map(l => l.replace('=', '&=')).join('\\\\') + '\\end{aligned}';
      body.appendChild(h('div', { class: 't4b-sub', html: 'The maximum: multiply CDFs' }));
      const maxSteps = [
        { html: 'The event: the largest value is at most ' + tex('z') + ' exactly when <b>every</b> value is at most ' + tex('z') + ':', math: D.iid ? '\\{' + D.mx + '\\le z\\}=\\{X_1\\le z,\\ \\dots,\\ X_{' + n + '}\\le z\\}' : '\\{\\max(X,Y)\\le z\\}=\\{X\\le z\\text{ and }Y\\le z\\}' },
        { html: (D.iid ? 'Independent copies: “and” becomes a product. Identical copies: the same factor ' + tex('n=' + n) + ' times:' : 'Independent: “and” becomes a product:'), math: D.iid ? 'F_{\\max}(z)=P(X_1\\le z)\\cdots P(X_{' + n + '}\\le z)=F_X(z)^{' + n + '}' : 'F_{\\max}(z)=P(X\\le z)\\,P(Y\\le z)=F_X(z)\\,F_Y(z)' },
        { html: 'Your CDF' + (D.iid ? '' : 's') + ' at ' + tex('z=' + z) + ' and one step down, ' + tex('z-1=' + (z - 1)) + ':', math: al(D.iid ? [A.cdfTex(z), A.cdfTex(z - 1)] : [A.cdfTex(z), A.cdfTex(z - 1), B.cdfTex(z), B.cdfTex(z - 1)]) },
        { html: D.iid ? 'Raise to the power ' + tex('n=' + n) + ':' : 'Multiply:', math: D.iid
          ? al(['F_{\\max}(' + z + ')=F_X(' + z + ')^{' + n + '}=\\left(' + U.tx(D.FX(z)) + '\\right)^{' + n + '}' + U.rel(D.Fmax(z)), 'F_{\\max}(' + (z - 1) + ')=F_X(' + (z - 1) + ')^{' + n + '}=\\left(' + U.tx(D.FX(z - 1)) + '\\right)^{' + n + '}' + U.rel(D.Fmax(z - 1))])
          : al(['F_{\\max}(' + z + ')=F_X(' + z + ')\\,F_Y(' + z + ')=' + U.tx(D.FX(z)) + '\\cdot ' + U.tx(D.FY(z)) + U.rel(D.Fmax(z)), 'F_{\\max}(' + (z - 1) + ')=F_X(' + (z - 1) + ')\\,F_Y(' + (z - 1) + ')=' + U.tx(D.FX(z - 1)) + '\\cdot ' + U.tx(D.FY(z - 1)) + U.rel(D.Fmax(z - 1))]) },
        { html: '“Exactly ' + tex('z') + '” is “at most ' + tex('z') + '” but not “at most ' + tex('z-1') + '”: ' + tex('\\{\\max\\le ' + z + '\\}') + ' is ' + tex('\\{\\max\\le ' + (z - 1) + '\\}') + ' plus ' + tex('\\{\\max=' + z + '\\}') + ', with no overlap. Subtract:', math: 'P(\\max=' + z + ')=F_{\\max}(' + z + ')-F_{\\max}(' + (z - 1) + ')=' + U.tx(D.Fmax(z)) + '-' + U.tx(D.Fmax(z - 1)) + U.rel(D.pmax(z)) },
      ];
      body.appendChild(K.steps(maxSteps));
      body.appendChild(h('div', { class: 't4b-sub', html: 'The minimum: multiply the tails' }));
      const minSteps = [
        { html: 'For the min, “' + tex('\\le') + '” does not split into a product. Turn it around and use “at least” (L2.11): the smallest value is at least ' + tex('z') + ' exactly when <b>every</b> value is at least ' + tex('z') + ':', math: D.iid ? '\\{' + D.mn + '\\ge z\\}=\\{X_1\\ge z,\\ \\dots,\\ X_{' + n + '}\\ge z\\}' : '\\{\\min(X,Y)\\ge z\\}=\\{X\\ge z\\text{ and }Y\\ge z\\}' },
        { html: D.iid ? 'Independent and identical:' : 'Independent:', math: D.iid ? 'P(\\min\\ge z)=P(X\\ge z)^{' + n + '}' : 'P(\\min\\ge z)=P(X\\ge z)\\,P(Y\\ge z)' },
        { html: 'Your tail' + (D.iid ? '' : 's') + ' at ' + tex('z=' + z) + ' and one step up, ' + tex('z+1=' + (z + 1)) + '. For whole numbers, ' + tex('X\\ge z') + ' is the opposite of ' + tex('X\\le z-1') + ', so ' + tex('P(X\\ge z)=1-F_X(z-1)') + ':', math: al(D.iid ? [A.tailTex(z), A.tailTex(z + 1)] : [A.tailTex(z), A.tailTex(z + 1), B.tailTex(z), B.tailTex(z + 1)]) },
        { html: D.iid ? 'Raise to the power ' + tex('n=' + n) + ':' : 'Multiply:', math: D.iid
          ? al(['P(\\min\\ge ' + z + ')=\\left(' + U.tx(D.SX(z)) + '\\right)^{' + n + '}' + U.rel(D.Smin(z)), 'P(\\min\\ge ' + (z + 1) + ')=\\left(' + U.tx(D.SX(z + 1)) + '\\right)^{' + n + '}' + U.rel(D.Smin(z + 1))])
          : al(['P(\\min\\ge ' + z + ')=' + U.tx(D.SX(z)) + '\\cdot ' + U.tx(D.SY(z)) + U.rel(D.Smin(z)), 'P(\\min\\ge ' + (z + 1) + ')=' + U.tx(D.SX(z + 1)) + '\\cdot ' + U.tx(D.SY(z + 1)) + U.rel(D.Smin(z + 1))]) },
        { html: '“Exactly ' + tex('z') + '” is “at least ' + tex('z') + '” but not “at least ' + tex('z+1') + '”. Subtract:', math: 'P(\\min=' + z + ')=P(\\min\\ge ' + z + ')-P(\\min\\ge ' + (z + 1) + ')=' + U.tx(D.Smin(z)) + '-' + U.tx(D.Smin(z + 1)) + U.rel(D.pmin(z)) },
      ];
      body.appendChild(K.steps(minSteps));
    }

    /* ---------------------------------------------------------- cross-checks */
    function drawCheck(D) {
      const body = P.check.body;
      Lab.clear(body);
      if (D.joint) { body.appendChild(jointCheck(D)); return; }
      if (D.n === 2) body.appendChild(lSection(D));
      const uniSec = uniformSection(D);
      if (uniSec) body.appendChild(uniSec);
      if (D.A.fam === 'geometric' && D.B.fam === 'geometric') body.appendChild(geoSection(D));
      if (!uniSec && !(D.A.fam === 'geometric' && D.B.fam === 'geometric') && D.n > 2) {
        body.appendChild(K.note('For ' + tex('n=' + D.n) + ' copies the shortcuts in this panel are for uniform inputs (counting tuples) and geometric inputs (the min is geometric). Choose one of those, or a lecture example.', ''));
      }
    }
    /** a joint table: is the product rule of L2.11 allowed? (only when the table is independent) */
    function jointCheck(D) {
      const z = st.z, t = v => U.tx(v), A = D.A, B = D.B;
      const prodMax = U.mul(D.FX(z), D.FY(z)), prodMin = U.mul(D.SX(z), D.SY(z));
      const wrongPmax = U.sub(prodMax, U.mul(D.FX(z - 1), D.FY(z - 1)));
      const wrongPmin = U.sub(prodMin, U.mul(D.SX(z + 1), D.SY(z + 1)));
      const cmp = (a, b) => (U.same(a, b) ? '=' : '\\ne ');
      if (D.indep) {
        const sec = U.section('Your table is independent, so the CDF method works too',
          'Every cell of your table equals ' + tex('f_X(x)\\,f_Y(y)') + ' (the column total times the row total). Then the blocks factor, as in L2.11 (≈ 7–10 min), and the two other modes of this lab give the same numbers:');
        sec.appendChild(K.steps([
          { html: 'The max block:', math: 'P(\\max\\le ' + z + ')=F_X(' + z + ')\\,F_Y(' + z + ')=' + t(D.FX(z)) + '\\cdot ' + t(D.FY(z)) + U.rel(prodMax), note: U.same(prodMax, D.Fmax(z)) ? '<span class="cgood">Same as the block sum ✓</span>' : '' },
          { html: 'The min block:', math: 'P(\\min\\ge ' + z + ')=P(X\\ge ' + z + ')\\,P(Y\\ge ' + z + ')=' + t(D.SX(z)) + '\\cdot ' + t(D.SY(z)) + U.rel(prodMin), note: U.same(prodMin, D.Smin(z)) ? '<span class="cgood">Same as the block sum ✓</span>' : '' },
        ]));
        return sec;
      }
      const b = D.bad, fx = A.pmf(b.x), fy = B.pmf(b.y);
      const sec = U.section('Your table is not independent: do not multiply CDFs',
        'L2.11 (≈ 7–10 min) gets ' + tex('F_{\\max}=F_XF_Y') + ' and ' + tex('P(\\min\\ge z)=P(X\\ge z)P(Y\\ge z)') + ' from independence, and warns that without it “you cannot write it like this”. Your table shows why. The three cases above (and the block sums) need no independence.');
      const prevMax = U.mul(D.FX(z - 1), D.FY(z - 1)), nextMin = U.mul(D.SX(z + 1), D.SY(z + 1));
      sec.appendChild(K.steps([
        { html: 'Not independent: one cell is enough (L2.1). The marginals add the columns and rows of your table:', math: '\\begin{aligned}f_{XY}(' + b.x + ',' + b.y + ')&=' + t(D.f(b.x, b.y)) + '\\\\&\\ne ' + t(U.mul(fx, fy)) + '=' + t(fx) + '\\cdot ' + t(fy) + '\\\\&=f_X(' + b.x + ')\\,f_Y(' + b.y + ')\\end{aligned}' },
        { html: 'The product of the marginal CDFs against the true block at ' + tex('z=' + z) + ':', math: '\\begin{aligned}F_X(' + z + ')\\,F_Y(' + z + ')&=' + t(D.FX(z)) + '\\cdot ' + t(D.FY(z)) + '=' + t(prodMax) + '\\\\&' + cmp(prodMax, D.Fmax(z)) + t(D.Fmax(z)) + '\\\\&=P(\\max\\le ' + z + ')\\\\ P(X\\ge ' + z + ')\\,P(Y\\ge ' + z + ')&=' + t(D.SX(z)) + '\\cdot ' + t(D.SY(z)) + '=' + t(prodMin) + '\\\\&' + cmp(prodMin, D.Smin(z)) + t(D.Smin(z)) + '\\\\&=P(\\min\\ge ' + z + ')\\end{aligned}' },
        { html: 'What the product rule would give for the PMFs at ' + tex('z=' + z) + ', against the three cases:', math: '\\begin{aligned}&F_X(' + z + ')F_Y(' + z + ')-F_X(' + (z - 1) + ')F_Y(' + (z - 1) + ')\\\\&\\quad=' + t(prodMax) + '-' + t(prevMax) + '=' + t(wrongPmax) + '\\\\&\\quad' + cmp(wrongPmax, D.pmax(z)) + t(D.pmax(z)) + '=P(\\max=' + z + ')\\\\&P(X\\ge ' + z + ')P(Y\\ge ' + z + ')\\\\&\\quad-P(X\\ge ' + (z + 1) + ')P(Y\\ge ' + (z + 1) + ')\\\\&\\quad=' + t(prodMin) + '-' + t(nextMin) + '=' + t(wrongPmin) + '\\\\&\\quad' + cmp(wrongPmin, D.pmin(z)) + t(D.pmin(z)) + '=P(\\min=' + z + ')\\end{aligned}', note: U.same(wrongPmax, D.pmax(z)) && U.same(wrongPmin, D.pmin(z)) ? 'At this ' + tex('z') + ' the two happen to agree. Try other values of ' + tex('z') + ': the table under “CDFs” marks each one ✓ or ✗.' : 'The product rule is wrong here; the three cases are right.' },
      ]));
      return sec;
    }
    /** P(max = z) and P(min = z) as the sum over the L: corner + two arms (L2.11, three disjoint cases) */
    function lSection(D) {
      const z = st.z, A = D.A, B = D.B;
      const fx = A.pmf(z), fy = B.pmf(z), Fx1 = A.cdf(z - 1), Fy1 = B.cdf(z - 1), Sx1 = A.tail(z + 1), Sy1 = B.tail(z + 1);
      const c1 = U.mul(fx, fy), a1 = U.mul(fx, Fy1), b1 = U.mul(Fx1, fy);
      const maxL = U.add(U.add(c1, a1), b1);
      const a2 = U.mul(fx, Sy1), b2 = U.mul(Sx1, fy);
      const minL = U.add(U.add(c1, a2), b2);
      const sec = U.section('Add over the L: corner + two arms',
        'The L for ' + tex('\\max=' + z) + ' splits into three pieces that cannot happen together (L2.11): the corner ' + tex('(' + z + ',' + z + ')') + ', the arm where ' + tex('X=' + z) + ' and ' + tex('Y<' + z) + ', and the arm where ' + tex('X<' + z) + ' and ' + tex('Y=' + z) + '. Independence makes each piece a product. The min is the same with “' + tex('>') + '”.');
      const t = v => U.tx(v);
      sec.appendChild(K.steps([
        { html: 'The maximum:', math: '\\begin{aligned}P(\\max=' + z + ')&=f_X(' + z + ')f_Y(' + z + ')+f_X(' + z + ')F_Y(' + (z - 1) + ')+F_X(' + (z - 1) + ')f_Y(' + z + ')\\\\&=' + t(fx) + '\\cdot ' + t(fy) + '+' + t(fx) + '\\cdot ' + t(Fy1) + '+' + t(Fx1) + '\\cdot ' + t(fy) + '\\\\&=' + t(c1) + '+' + t(a1) + '+' + t(b1) + U.rel(maxL) + '\\end{aligned}', note: U.same(maxL, D.pmax(z), 1e-9) ? '<span class="cgood">Same as the CDF method ✓</span>' : 'CDF method: ' + tex(U.dec(D.pmax(z))) },
        { html: 'The minimum (arms going up and right, so ' + tex('Y>' + z) + ' and ' + tex('X>' + z) + '):', math: '\\begin{aligned}P(\\min=' + z + ')&=f_X(' + z + ')f_Y(' + z + ')+f_X(' + z + ')P(Y>' + z + ')+P(X>' + z + ')f_Y(' + z + ')\\\\&=' + t(fx) + '\\cdot ' + t(fy) + '+' + t(fx) + '\\cdot ' + t(Sy1) + '+' + t(Sx1) + '\\cdot ' + t(fy) + '\\\\&=' + t(c1) + '+' + t(a2) + '+' + t(b2) + U.rel(minL) + '\\end{aligned}', note: (U.same(minL, D.pmin(z), 1e-9) ? '<span class="cgood">Same as the CDF method ✓</span>' : 'CDF method: ' + tex(U.dec(D.pmin(z)))) + ' Here ' + tex('P(Y>' + z + ')=P(Y\\ge ' + (z + 1) + ')') + ' and ' + tex('P(X>' + z + ')=P(X\\ge ' + (z + 1) + ')') + '.' },
      ]));
      return sec;
    }
    /** uniform inputs: count the L (two variables) or count the tuples (n copies) */
    function uniformSection(D) {
      const A = D.A, B = D.B, z = st.z, n = D.n;
      if (A.fam !== 'uniform' || B.fam !== 'uniform') return null;
      const a = A.params.a, b = A.params.b, N = A.params.n;
      const sameRange = B.params.a === a && B.params.b === b;
      if (n === 2 && sameRange) {
        const k = z - a + 1;                 // position of z among the values (1 … N)
        const inR = z >= a && z <= b;
        const cMax = inR ? 2 * k - 1 : 0, cMin = inR ? 2 * (b - z) + 1 : 0;
        const sec = U.section('Count the L (L2.9): uniform on ' + tex('\\{' + U.setTex(a, b) + '\\}') + ', ' + tex('N=' + N) + ' values',
          'All ' + tex('N^2=' + N + '^2=' + N * N) + ' pairs have the same probability ' + tex('\\frac{1}{' + N * N + '}') + ', so ' + tex('P=\\frac{\\text{stars on the L}}{' + N * N + '}') + '.');
        const lec = a === 1;
        sec.appendChild(K.steps([
          { html: 'Max: from the corner ' + tex('(' + z + ',' + z + ')') + ' there are ' + tex(k - 1) + ' stars below it and ' + tex(k - 1) + ' to its left' + (k > 1 ? ' (the values ' + tex(U.setTex(a, z - 1)) + ')' : '') + ', plus the corner:', math: (k - 1) + '+' + (k - 1) + '+1=' + cMax + '\\quad\\Rightarrow\\quad P(\\max=' + z + ')=' + U.overTex(cMax, N * N), note: (lec ? 'The lecture’s formula with ' + tex('n=' + N) + ': ' + tex('\\frac{2z-1}{n^2}=\\frac{2\\cdot' + z + '-1}{' + N * N + '}=\\frac{' + (2 * z - 1) + '}{' + N * N + '}') + '. ' : '') + (U.same(F(cMax, N * N), D.pmax(z)) ? '<span class="cgood">Same as the CDF method ✓</span>' : '') },
          { html: 'Min: from the corner there are ' + tex(b - z) + ' stars above it and ' + tex(b - z) + ' to its right' + (b > z ? ' (the values ' + tex(U.setTex(z + 1, b)) + ')' : '') + ', plus the corner:', math: (b - z) + '+' + (b - z) + '+1=' + cMin + '\\quad\\Rightarrow\\quad P(\\min=' + z + ')=' + U.overTex(cMin, N * N), note: (lec ? 'The lecture’s formula with ' + tex('n=' + N) + ': ' + tex('\\frac{2n-2z+1}{n^2}=\\frac{2\\cdot' + N + '-2\\cdot' + z + '+1}{' + N * N + '}=\\frac{' + (2 * N - 2 * z + 1) + '}{' + N * N + '}') + '. ' : '') + (U.same(F(cMin, N * N), D.pmin(z)) ? '<span class="cgood">Same as the CDF method ✓</span>' : '') },
          { html: 'All the L’s, for ' + tex('z=' + a + ',\\dots,' + b) + ': max ' + tex(R(1, N).map(j => 2 * j - 1).join(',')) + '; min ' + tex(R(1, N).map(j => 2 * (N - j) + 1).join(',')) + '. Each list adds up to ' + tex(N * N) + ' — the nested L’s fill the square.' },
        ]));
        return sec;
      }
      if (n === 2) {
        // two uniforms on different ranges: count the L cell by cell
        const nx = A.params.n, ny = B.params.n;
        const inX = v => v >= A.params.a && v <= A.params.b, inY = v => v >= B.params.a && v <= B.params.b;
        const cntBelow = (lo, v) => Math.max(0, Math.min(v - 1, lo.b) - lo.a + 1);
        const corner = inX(z) && inY(z) ? 1 : 0;
        const armD = inX(z) ? cntBelow(B.params, z) : 0, armL = inY(z) ? cntBelow(A.params, z) : 0;
        const cntAbove = (r, v) => Math.max(0, r.b - Math.max(v + 1, r.a) + 1);
        const armU = inX(z) ? cntAbove(B.params, z) : 0, armR = inY(z) ? cntAbove(A.params, z) : 0;
        const NN = nx * ny;
        const sec = U.section('Count the L (L2.9): two uniforms',
          'Every pair has the same probability ' + tex('\\frac{1}{' + nx + '}\\cdot\\frac{1}{' + ny + '}=\\frac{1}{' + NN + '}') + ', so ' + tex('P=\\frac{\\text{stars on the L}}{' + NN + '}') + '.');
        sec.appendChild(K.steps([
          { html: 'Max: corner ' + tex(corner) + ' + arm down ' + tex(armD) + ' (values of ' + tex('Y') + ' below ' + z + ', if ' + z + ' is a value of ' + tex('X') + ') + arm left ' + tex(armL) + ':', math: corner + '+' + armD + '+' + armL + '=' + (corner + armD + armL) + '\\quad\\Rightarrow\\quad P(\\max=' + z + ')=' + U.overTex(corner + armD + armL, NN), note: U.same(F(corner + armD + armL, NN), D.pmax(z)) ? '<span class="cgood">Same as the CDF method ✓</span>' : '' },
          { html: 'Min: corner ' + tex(corner) + ' + arm up ' + tex(armU) + ' + arm right ' + tex(armR) + ':', math: corner + '+' + armU + '+' + armR + '=' + (corner + armU + armR) + '\\quad\\Rightarrow\\quad P(\\min=' + z + ')=' + U.overTex(corner + armU + armR, NN), note: U.same(F(corner + armU + armR, NN), D.pmin(z)) ? '<span class="cgood">Same as the CDF method ✓</span>' : '' },
        ]));
        return sec;
      }
      // n i.i.d. uniform copies: count the tuples
      const k = z - a + 1, T = Math.pow(N, n);
      const inR = z >= a && z <= b;
      const cMax = inR ? Math.pow(k, n) - Math.pow(k - 1, n) : 0;
      const cMin = inR ? Math.pow(b - z + 1, n) - Math.pow(b - z, n) : 0;
      const sec = U.section('Count the tuples: ' + n + ' copies of uniform ' + tex('\\{' + U.setTex(a, b) + '\\}'),
        'All ' + tex('N^{n}=' + N + '^{' + n + '}=' + K.intTex(T)) + ' tuples ' + tex('(x_1,\\dots,x_{' + n + '})') + ' are equally likely.');
      const fr = (c, t) => tex(U.overTex(c, t));
      sec.appendChild(K.steps([
        { html: 'Max ' + tex('=z') + ': all values ' + tex('\\le ' + z) + ' (' + plural(k, 'choice') + ' each) minus all values ' + tex('\\le ' + (z - 1)) + ' (' + plural(k - 1, 'choice') + ' each):', math: k + '^{' + n + '}-' + (k - 1) + '^{' + n + '}=' + K.intTex(Math.pow(k, n)) + '-' + K.intTex(Math.pow(k - 1, n)) + '=' + K.intTex(cMax), note: 'So ' + tex('P(\\max=' + z + ')=') + fr(cMax, T) + (U.same(F(cMax, T), D.pmax(z), 1e-9) ? ' <span class="cgood">— same as the CDF method ✓</span>' : '') },
        { html: 'Min ' + tex('=z') + ': all values ' + tex('\\ge ' + z) + ' (' + plural(b - z + 1, 'choice') + ' each) minus all values ' + tex('\\ge ' + (z + 1)) + ' (' + plural(b - z, 'choice') + ' each):', math: (b - z + 1) + '^{' + n + '}-' + (b - z) + '^{' + n + '}=' + K.intTex(Math.pow(b - z + 1, n)) + '-' + K.intTex(Math.pow(b - z, n)) + '=' + K.intTex(cMin), note: 'So ' + tex('P(\\min=' + z + ')=') + fr(cMin, T) + (U.same(F(cMin, T), D.pmin(z), 1e-9) ? ' <span class="cgood">— same as the CDF method ✓</span>' : '') },
      ]));
      return sec;
    }
    /** geometric inputs: the min is geometric (shown numerically), the max is not (ratio test) */
    function geoSection(D) {
      const A = D.A, B = D.B, n = D.n;
      const q1 = A.params.q, q2 = B.params.q;
      const qq = D.iid ? U.pow(q1, n) : U.mul(q1, q2);
      const r = U.sub(F(1), qq);
      const sec = U.section('Geometric inputs: the min is geometric, the max is not',
        D.iid ? 'Each copy is ' + tex(A.tex) + ' on ' + tex('\\{1,2,\\dots\\}') + ', so ' + tex('P(X\\ge k)=(1-p)^{k-1}') + '.'
          : 'Both are geometric on ' + tex('\\{1,2,\\dots\\}') + ': ' + tex('X\\sim ' + A.tex) + ', ' + tex('Y\\sim ' + B.tex) + '. A geometric tail is ' + tex('P(X\\ge k)=(1-p)^{k-1}') + ' (the first ' + tex('k-1') + ' trials all fail).');
      const K8 = Math.min(8, D.zHi);
      const ks = R(1, K8);
      const geoPmf = k => U.mul(U.pow(qq, k - 1), r);
      sec.appendChild(K.steps([
        { html: 'Tail of the min:', math: D.iid ? 'P(\\min\\ge k)=P(X\\ge k)^{' + n + '}=\\left((1-p)^{k-1}\\right)^{' + n + '}=\\left((1-p)^{' + n + '}\\right)^{k-1}' : '\\begin{aligned}P(\\min\\ge k)&=P(X\\ge k)\\,P(Y\\ge k)=(1-p_X)^{k-1}(1-p_Y)^{k-1}\\\\&=\\big((1-p_X)(1-p_Y)\\big)^{k-1}\\end{aligned}' },
        { html: 'Call that base ' + tex('c') + '. With your numbers:', math: D.iid ? 'c=(1-p)^{' + n + '}=\\left(' + U.tx(q1) + '\\right)^{' + n + '}' + U.rel(qq) : 'c=(1-p_X)(1-p_Y)=' + U.tx(q1) + '\\cdot ' + U.tx(q2) + U.rel(qq) },
        { html: 'Subtract one step: ' + tex('P(\\min=k)=c^{k-1}-c^{k}=c^{k-1}(1-c)') + ' — the Geometric PMF with success probability ' + tex('1-c') + ':', math: '\\min\\sim\\text{Geometric}(1-c)=\\text{Geometric}\\left(1-' + U.tx(qq) + '\\right)=\\text{Geometric}\\left(' + U.tx(r) + '\\right)' },
      ]));
      const rows = ks.map(k => {
        const pm = D.pmin(k), g = geoPmf(k), pmx = D.pmax(k);
        const ratio = (a, b) => (U.num(b) > 0 ? U.dec(U.num(a) / U.num(b)) : '\\text{—}');
        return {
          cls: k === st.z ? 't4b-on' : null, onClick: () => setZ(k),
          cells: [tex(String(k)), tex(U.tx(pm)), tex(U.tx(g)), U.same(pm, g, 1e-9) ? '<span class="cgood">✓</span>' : '<span class="cbad">✗</span>', tex(ratio(D.pmin(k + 1), pm)), tex(U.tx(pmx)), tex(ratio(D.pmax(k + 1), pmx))],
        };
      });
      sec.appendChild(K.note('The ratio test: a geometric PMF shrinks by the <b>same</b> factor at every step, ' + tex('\\frac{P(k+1)}{P(k)}=1-r') + '. Compare the two ratio columns:', 'pl-hint'));
      sec.appendChild(U.table([tex('k'), tex('P(\\min=k)') + ' (CDF method)', tex('r(1-r)^{k-1}') + ', ' + tex('r=' + U.tx(r)), 'same?', tex('\\frac{P(\\min=k+1)}{P(\\min=k)}'), tex('P(\\max=k)'), tex('\\frac{P(\\max=k+1)}{P(\\max=k)}')], rows));
      const r1 = U.num(D.pmax(2)) / U.num(D.pmax(1)), r2 = U.num(D.pmax(3)) / U.num(D.pmax(2));
      sec.appendChild(K.note('The min ratio is always ' + tex('c' + U.rel(qq)) + ': the min is geometric. The max ratios change (' + tex(U.dec(r1)) + ', then ' + tex(U.dec(r2)) + ', …), so the max is <b>not</b> geometric' + (r1 > 1 ? ' — it even grows from ' + tex('k=1') + ' to ' + tex('k=2') + ', which a geometric PMF never does' : '') + '. Its CDF is ' + tex(D.iid ? '\\big(1-(1-p)^{k}\\big)^{' + n + '}' : '\\big(1-(1-p_X)^{k}\\big)\\big(1-(1-p_Y)^{k}\\big)') + '.', ''));
      return sec;
    }
  }

  Lab.lab(Object.assign({}, META, { render: host => maxminLab(host) }));
})();
