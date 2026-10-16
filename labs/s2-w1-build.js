/* Revise — Statistics II · Week 1 playground lab (L1.4).
   'lab-s2-build': build a joint PMF from two pieces — the marginal of the first variable and, for each of its values,
   the conditional distribution of the second — with f_XY(t,t') = f_X(t) f_{Y|X=t}(t'); then add to get the other marginal.
   Uses Lab.play.t1 (number-formatting helpers from labs/s2-w1-joint.js), looked up when the lab renders. */
(function () {
  'use strict';
  const { h, F } = Lab;
  const Frac = Lab.Frac;
  const K = Lab.play;
  const tx = s => Lab.tex(s);
  const esc = Lab.esc;
  const KEY = 'lab:s2-build';
  const link = (id, code) => '' + code + '';

  const PRESETS = [
    { label: 'L1.4 · Example 1: throw a die, toss a fair coin that many times',
      source: link('l1-4', 'L1.4') + ', Example 1 (from about 1 min): ' + tx('X') + ' = number on the die, ' + tx('Y') + ' = number of heads; ' + tx('Y\\mid X=t\\sim\\text{Binomial}(t,\\tfrac12)') + '. Change the die’s faces (' + tx('b') + ') or the coin’s ' + tx('p') + '.',
      st: { first: 'x', xName: 'X', yName: 'Y', xLabel: 'number on the die', yLabel: 'number of heads', marg: { fam: 'uniform', q: { a: 1, b: 6 } }, kind: 'binom', p: '1/2', fmt: 'count', pick: 3 } },
    { label: 'L1.4 · Example 2: N ~ Poisson(λ) tosses, X = heads',
      source: link('l1-4', 'L1.4') + ', Example 2 (from about 7 min): ' + tx('N\\sim\\text{Poisson}(\\lambda)') + '; toss a coin ' + tx('N') + ' times; ' + tx('X') + ' = number of heads. The lecture finds ' + tx('X\\sim\\text{Poisson}(\\lambda/2)') + ' for a fair coin — with ' + tx('P(\\text{H})=p') + ' it is ' + tx('\\text{Poisson}(\\lambda p)') + '.',
      st: { first: 'x', xName: 'N', yName: 'X', xLabel: 'number of tosses', yLabel: 'number of heads', marg: { fam: 'poisson', q: { 'λ': 4, 'shown up to k': 12 } }, kind: 'binom', p: '1/2', fmt: 'dec', pick: 4 } },
    { label: 'L1.4 · Example 3: IPL over — wickets Y first, then runs X',
      source: link('l1-4', 'L1.4') + ', Example 3 (from about 21 min), as on the slide: ' + tx('f_Y=(\\tfrac{13}{16},\\tfrac18,\\tfrac1{16})') + ' for 0, 1, 2 wickets; runs ' + tx('X\\mid Y=0') + ' uniform on ' + tx('\\{6,\\dots,12\\}') + ', ' + tx('X\\mid Y=1') + ' on ' + tx('\\{2,\\dots,8\\}') + ', ' + tx('X\\mid Y=2') + ' on ' + tx('\\{0,\\dots,6\\}') + '.',
      st: { first: 'y', xName: 'X', yName: 'Y', xLabel: 'runs in the over', yLabel: 'wickets in the over', marg: { fam: 'custom' }, cust: { vals: ['0', '1', '2'], probs: ['13/16', '1/8', '1/16'] }, kind: 'typed', rows: { 0: '6..12', 1: '2..8', 2: '0..6' }, fmt: 'count', pick: 1 } },
    { label: 'L1.4 lesson warm-up · spinner shows 1 or 2, then that many tosses',
      source: link('l1-4', 'L1.4') + ' lesson page, the warm-up tree — a lesson exercise, not a lecture example. ' + tx('X') + ' = spinner (1 or 2, half–half), ' + tx('Y') + ' = heads.',
      st: { first: 'x', xName: 'X', yName: 'Y', xLabel: 'spinner', yLabel: 'number of heads', marg: { fam: 'custom' }, cust: { vals: ['1', '2'], probs: ['1/2', '1/2'] }, kind: 'binom', p: '1/2', fmt: 'frac', pick: 2 } },
    { label: 'L1.4 lesson exercise · die: 1–2 → one coin, 3–6 → two coins',
      source: link('l1-4', 'L1.4') + ' lesson page, “Your turn” — a lesson exercise, not a lecture example. ' + tx('X') + ' = coins tossed: ' + tx('f_X(1)=\\tfrac26') + ' (die shows 1 or 2), ' + tx('f_X(2)=\\tfrac46') + '; ' + tx('Y') + ' = heads.',
      st: { first: 'x', xName: 'X', yName: 'Y', xLabel: 'coins tossed', yLabel: 'number of heads', marg: { fam: 'custom' }, cust: { vals: ['1', '2'], probs: ['2/6', '4/6'] }, kind: 'binom', p: '1/2', fmt: 'frac', pick: 2 } },
    { label: 'L2.10 · Example 2 (minute 3): random rectangle — length L, then breadth B',
      source: link('l2-10', 'L2.10') + ', Example 2 (minutes 3–6): the length ' + tx('L') + ' is uniform on ' + tx('\\{5,7,9,11\\}') + '; given ' + tx('L=l') + ', the breadth ' + tx('B') + ' is uniform on ' + tx('\\{l-3,\\,l-2,\\,l-1\\}') + ' (typed here as lo = <code>t-3</code>, hi = <code>t-1</code>). So each of the ' + tx('4\\times 3=12') + ' pairs has ' + tx('\\tfrac14\\cdot\\tfrac13=\\tfrac1{12}') + '. The captions say “{5, 7, 9, 1}”; the lecture’s “for 11, B can be 10, 9, 8” shows the last length is 11. For the area ' + tx('A=LB') + ', use the <a href="#/p/lab-s2-gxy">function of two random variables lab</a> with ' + tx('g(x,y)=xy') + '.',
      st: { first: 'x', xName: 'L', yName: 'B', xLabel: 'length', yLabel: 'breadth', marg: { fam: 'custom' }, cust: { vals: ['5', '7', '9', '11'], probs: ['1/4', '1/4', '1/4', '1/4'] }, kind: 'unif', lo: 't-3', hi: 't-1', fmt: 'count', pick: 7 } },
  ];
  const DEF = () => Object.assign({
    fmt: 'auto', lo: '0', hi: 't', rows: {}, cust: { vals: ['1', '2'], probs: ['1/2', '1/2'] }, t: {}, pick: 3,
    loaded: { label: PRESETS[0].label },
  }, JSON.parse(JSON.stringify(PRESETS[0].st)));

  function buildLab() {
    const U = K.t1;
    if (!U) throw new Error('labs/s2-w1-joint.js must load first: it holds the shared helpers (Lab.play.t1).');
    const st = Object.assign(DEF(), Lab.store.get(KEY, {}));
    if (!st.marg || (!K.FAMILIES[st.marg.fam] && st.marg.fam !== 'custom')) st.marg = { fam: 'uniform', q: { a: 1, b: 6 } };
    if (!['binom', 'unif', 'typed'].includes(st.kind)) st.kind = 'binom';
    st.rows = st.rows || {};
    let root, ctl = {}, P = {}, good = null, lastD = null, dump = {}, pickSig = '', fmtSig = '', rowsSig = '', fLo = null, fHi = null;
    const W = Lab.W;
    const save = () => Lab.store.set(KEY, st);
    const isX = () => st.first === 'x';
    const nX = () => U.tn(st.xName), nY = () => U.tn(st.yName);
    const nA = () => (isX() ? nX() : nY()), nB = () => (isX() ? nY() : nX());
    const aS = () => (isX() ? 't' : "t'"), bS = () => (isX() ? "t'" : 't');
    const fXY = () => 'f_{' + nX() + nY() + '}';
    const cellTex = (a, b) => fXY() + '(' + (isX() ? a + ',' + b : b + ',' + a) + ')';
    const condF = a => 'f_{' + nB() + '\\mid ' + nA() + '=' + a + '}';
    const rule = () => fXY() + "(t,t')=f_{" + nA() + '}(' + aS() + ')\\,' + condF(aS()) + '(' + bS() + ')';
    const paren = v => (Number(v) < 0 ? '(' + U.val(v) + ')' : U.val(v));
    const toFrac = v => (v instanceof Frac ? v : Frac.fromNumber(Number(v)));
    const oneMinus = f => (U.isExact(f) ? F(1).sub(f) : 1 - Number(f));

    /* ------------------------------------------------------------ compute */
    function margOf() {
      const M = st.marg;
      if (M.fam === 'custom') {
        const c = st.cust || { vals: [], probs: [] };
        const vals = c.vals.map(s => K.parseNum(s)), ps = c.probs.map(s => K.parseNum(s));
        if (!vals.length) return { err: 'Type at least one value.' };
        if (vals.some(v => v == null)) return { err: 'Every value of ' + st[isX() ? 'xName' : 'yName'] + ' must be a number.' };
        if (ps.some(p => p == null || Number(p) < 0)) return { err: 'Every probability must be a number from 0 up (1/6, 0.25, 20%).' };
        const vn = vals.map(Number);
        if (new Set(vn).size !== vn.length) return { err: 'Each value may appear only once.' };
        const total = U.sum(ps);
        if (!U.isOne(total)) return { err: 'Your stage-1 probabilities add up to ' + Lab.fmt(total) + ', not 1. Press “Rescale to total 1” or edit them.' };
        const order = vn.map((_, i) => i).sort((a, b) => vn[a] - vn[b]);
        return { fam: 'custom', vals: order.map(i => vn[i]), p: order.map(i => ps[i]), truncated: false, total, texName: '\\text{your PMF}', typed: order.map(i => c.probs[i]) };
      }
      const FAM = K.FAMILIES[M.fam];
      const q = {};
      FAM.params.forEach(([name, def]) => { const v = M.q && M.q[name] != null ? M.q[name] : def; q[name] = typeof def === 'string' ? (K.parseProb(v) || F(1, 2)) : Number(v); });
      const d = FAM.make(q);
      const p = d.float ? d.p.map(Number) : d.p.map(x => F(x));
      const total = U.sum(p);
      return { fam: M.fam, q, vals: d.vals.slice(), p, truncated: !!FAM.truncated, total, texName: FAM.tex(q) };
    }
    function parseRow(s) {
      s = String(s == null ? '' : s).trim();
      if (!s) throw new Error('type its PMF, e.g. 0:1/2, 1:1/2 — or 0..3 for uniform on 0, 1, 2, 3');
      const m = s.match(/^(-?\d+)\s*\.\.\s*(-?\d+)$/);
      if (m) {
        const lo = +m[1], hi = +m[2];
        if (lo > hi) throw new Error(lo + '..' + hi + ' is empty: write the smaller number first');
        if (hi - lo > 200) throw new Error('at most 201 values');
        const d = Lab.P.uniform(lo, hi);
        return { vals: d.vals, p: d.p, range: [lo, hi] };
      }
      const vals = [], ps = [];
      for (const part of s.split(/[,;]+/).map(x => x.trim()).filter(Boolean)) {
        const mm = part.match(/^(.+?)\s*[:=]\s*(.+)$/);
        if (!mm) throw new Error('“' + part + '” is not value:probability');
        const v = K.parseNum(mm[1]), p = K.parseNum(mm[2]);
        if (v == null) throw new Error('“' + mm[1].trim() + '” is not a number');
        if (p == null || Number(p) < 0) throw new Error('“' + mm[2].trim() + '” is not a probability');
        vals.push(Number(v)); ps.push(p);
      }
      if (new Set(vals).size !== vals.length) throw new Error('a value appears twice');
      const tot = U.sum(ps);
      if (!U.isOne(tot)) throw new Error('its probabilities add up to ' + Lab.fmt(tot) + ', not 1');
      const order = vals.map((_, i) => i).sort((a, b) => vals[a] - vals[b]);
      return { vals: order.map(i => vals[i]), p: order.map(i => ps[i]) };
    }
    const setTex = (lo, hi) => (hi - lo <= 2 ? '\\{' + Lab.range(lo, hi).map(U.val).join(',') + '\\}' : '\\{' + U.val(lo) + ',\\dots,' + U.val(hi) + '\\}');
    function condOf(a) {
      const A = isX() ? st.xName : st.yName;
      if (st.kind === 'binom') {
        if (!Number.isInteger(a) || a < 0) return { err: 'Binomial(t, p) needs t = 0, 1, 2, … (a number of tosses), but ' + A + ' can be ' + Lab.fmtVal(a) + '.' };
        if (a > 60) return { err: 'Binomial(t, p) with t = ' + a + ' is too big to show (at most 60).' };
        const p = K.parseProb(st.p);
        if (!p) return { err: 'Type p as a number from 0 to 1 (1/2, 0.3, 30%).' };
        const d = Lab.P.binomial(a, p);
        return { vals: d.vals, p: d.p, desc: '\\text{Bin}(' + U.val(a) + ',' + U.tf(p) + ')' };
      }
      if (st.kind === 'unif') {
        let lo, hi;
        try { lo = U.numVal(fLo({ t: a })); hi = U.numVal(fHi({ t: a })); } catch (e) { return { err: 'For t = ' + Lab.fmtVal(a) + ': ' + e.message + '.' }; }
        if (!Number.isInteger(lo) || !Number.isInteger(hi)) return { err: 'For t = ' + Lab.fmtVal(a) + ' the range is ' + Lab.fmtVal(lo) + ' to ' + Lab.fmtVal(hi) + ' — both ends must be whole numbers.' };
        if (lo > hi) return { err: 'For t = ' + Lab.fmtVal(a) + ': lo(t) = ' + lo + ' is bigger than hi(t) = ' + hi + ', so the range is empty.' };
        if (hi - lo > 200) return { err: 'For t = ' + Lab.fmtVal(a) + ' the range has ' + (hi - lo + 1) + ' values (at most 201).' };
        const d = Lab.P.uniform(lo, hi);
        return { vals: d.vals, p: d.p, lo, hi, desc: '\\text{Uniform}' + setTex(lo, hi) };
      }
      try {
        const r = parseRow(st.rows[String(a)]);
        return Object.assign(r, { desc: r.range ? '\\text{Uniform}' + setTex(r.range[0], r.range[1]) : '\\text{your PMF}' });
      } catch (e) { return { err: 'Row for ' + A + ' = ' + Lab.fmtVal(a) + ': ' + e.message + '.' }; }
    }
    function compute() {
      const res = {};
      const m = margOf();
      if (m.err) { res.errM = m.err; return res; }
      res.m = m;
      if (m.vals.length > 41) { res.errM = 'The first variable takes ' + m.vals.length + ' values; at most 41 fit in a table.'; return res; }
      if (st.kind === 'unif') {
        try { fLo = U.compile(st.lo, ['t']); } catch (e) { res.errC = 'lo(t): ' + e.message; return res; }
        try { fHi = U.compile(st.hi, ['t']); } catch (e) { res.errC = 'hi(t): ' + e.message; return res; }
      }
      const conds = [];
      for (const a of m.vals) { const c = condOf(a); if (c.err) { res.errC = c.err; return res; } conds.push(c); }
      const bvals = [...new Set(conds.flatMap(c => c.vals.map(Number)))].sort((x, y) => x - y);
      if (bvals.length > 61) { res.errC = 'The second variable takes ' + bvals.length + ' values; at most 61 fit in a table.'; return res; }
      const cp = conds.map(c => bvals.map(b => { const k = c.vals.findIndex(v => Lab.sameVal(v, b)); return k >= 0 ? c.p[k] : F(0); }));
      const prod = m.vals.map((_, i) => bvals.map((_, k) => U.mul(m.p[i], cp[i][k])));
      const fB = bvals.map((_, k) => U.sum(prod.map(r => r[k])));
      const all = prod.flat();
      const exact = all.every(U.isExact) && m.p.every(U.isExact);
      Object.assign(res, { ok: true, conds, cp, bvals, prod, fB, exact, D: exact ? U.lcd(all, 10000) : null, total: U.sum(all) });
      res.J = isX() ? { xs: m.vals, ys: bvals, p: prod.map(r => r.map(toFrac)) } : { xs: bvals, ys: m.vals, p: bvals.map((_, k) => prod.map(r => toFrac(r[k]))) };
      res.pois = m.fam === 'poisson' && st.kind === 'binom';
      return res;
    }
    function fmtCtx(d) {
      let mode = st.fmt === 'auto' ? (d.exact ? (d.D > 1 ? 'count' : 'frac') : 'dec') : st.fmt;
      if (mode === 'count' && !(d.D > 1)) mode = 'frac';
      return { mode, D: d.D };
    }
    function pickIndex(g) {
      let k = g.m.vals.findIndex(v => Lab.sameVal(v, st.pick));
      if (k < 0) { k = Math.max(0, g.m.p.findIndex(f => Number(f) > 0)); st.pick = g.m.vals[k]; }
      return k;
    }

    /* ----------------------------------------------------------- controls */
    function touched() {
      if (st.loaded) { st.loaded = null; if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); } }
    }
    function loadPreset(it) {
      const d = JSON.parse(JSON.stringify(it.st));
      // lo(t), hi(t) belong to the example that sets them (the random rectangle); the others start from 0 … t
      Object.assign(st, { xLabel: '', yLabel: '', t: {}, lo: '0', hi: 't' }, d);
      st.loaded = { label: it.label };
      buildSide();
      draw();
      Lab.setHTML(ctl.pre.lastChild, 'From: ' + it.source);
    }
    function serial(q) { const o = {}; Object.keys(q || {}).forEach(k => (o[k] = q[k] instanceof Frac ? q[k].toString() : q[k])); return o; }
    function buildSide() {
      const box = ctl.dyn;
      Lab.clear(box);
      ctl.g1 = K.group('1 · The two stages');
      box.appendChild(ctl.g1);
      ctl.first = firstSeg();
      ctl.firstWrap = h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Which variable do you describe first (stage 1)?' }), ctl.first);
      box.appendChild(ctl.firstWrap);
      const mkName = axis => {
        const f = K.textField({ label: axis === 'x' ? 'Column variable' : 'Row variable', value: axis === 'x' ? st.xName : st.yName, onChange: v => setName(axis, v, f) });
        return f;
      };
      box.appendChild(h('div', { class: 't1-two' }, mkName('x'), mkName('y')));
      box.appendChild(h('div', { class: 't1-two' },
        K.textField({ label: 'What ' + tx(nX()) + ' means', value: st.xLabel, mono: false, onChange: v => { st.xLabel = v; draw(); } }),
        K.textField({ label: 'What ' + tx(nY()) + ' means', value: st.yLabel, mono: false, onChange: v => { st.yLabel = v; draw(); } })));
      ctl.g2 = K.group(''); ctl.stage1 = h('div', { class: 't1-dyn' });
      ctl.g3 = K.group(''); ctl.stage2 = h('div', { class: 't1-dyn' });
      ctl.pickBox = h('div', { class: 't1-dyn' });
      ctl.fmtBox = h('div', { class: 'pl-field' });
      box.append(ctl.g2, ctl.stage1, ctl.g3, ctl.stage2, K.group('4 · Look closely at one value'), ctl.pickBox, K.group('5 · How numbers are written'), ctl.fmtBox);
      groupTitles();
      buildStage1();
      buildStage2();
      pickSig = ''; fmtSig = '';
    }
    function firstSeg() {
      const seg = Lab.seg([{ label: tx(nX()) + ' first, then ' + tx(nY() + '\\mid ' + nX()), value: 'x' }, { label: tx(nY()) + ' first, then ' + tx(nX() + '\\mid ' + nY()), value: 'y' }], st.first, v => { if (v === st.first) return; st.first = v; st.pick = null; touched(); buildSide(); draw(); });
      const bs = seg.querySelectorAll('button');
      bs[0].setAttribute('aria-label', st.xName + ' first, then ' + st.yName + ' given ' + st.xName);
      bs[1].setAttribute('aria-label', st.yName + ' first, then ' + st.xName + ' given ' + st.yName);
      return seg;
    }
    function groupTitles() {
      const A = isX() ? st.xName : st.yName, B = isX() ? st.yName : st.xName;
      ctl.g2.textContent = '2 · Stage 1: the marginal of ' + A;
      ctl.g3.textContent = '3 · Stage 2: ' + B + ' given ' + A + ' = ' + (isX() ? 't' : 't′');
    }
    function setName(axis, v, f) {
      const nm = U.name(v, null), other = axis === 'x' ? st.yName : st.xName;
      if (!nm || nm === other) { f.input.classList.add('bad'); f.hint('<span class="cbad">' + (nm ? 'Use a name different from ' + esc(other) + '.' : '1–3 letters or digits, starting with a letter (X, N, Y1).') + '</span>'); return; }
      f.input.classList.remove('bad'); f.hint('');
      if (axis === 'x') st.xName = nm; else st.yName = nm;
      groupTitles();
      const seg = firstSeg();
      ctl.first.replaceWith(seg); ctl.first = seg;
      buildStage1();
      buildStage2();
      draw();
    }
    function buildStage1() {
      Lab.clear(ctl.stage1);
      const fam = st.marg.fam;
      const params = {};
      if (fam !== 'custom') params[fam] = Object.assign({}, st.marg.q || {});
      const custom = { vals: (st.cust || {}).vals || ['1', '2'], probs: (st.cust || {}).probs || ['1/2', '1/2'] };
      ctl.marg = K.distPicker({ label: 'Distribution of ' + tx(nA()), value: fam, params, custom, xName: nA(), onChange: onMarg });
      ctl.margMsg = K.note('', 'pl-hint');
      ctl.stage1.append(ctl.marg, ctl.margMsg);
    }
    function onMarg(r) {
      const before = JSON.stringify([st.marg, st.cust]);
      if (r.fam) st.marg = { fam: r.fam, q: serial(r.q) };
      else {
        st.marg = { fam: 'custom' };
        const rows = Lab.$$('.pe-row', ctl.marg).map(row => [...row.querySelectorAll('input')].map(i => i.value));
        st.cust = { vals: rows.map(x => x[0]), probs: rows.map(x => x[1]) };
      }
      if (JSON.stringify([st.marg, st.cust]) === before) return;
      touched();
      draw();
    }
    function prefillRows() {
      const m = margOf();
      if (m.err) return;
      if (st.kind === 'unif') { try { fLo = U.compile(st.lo, ['t']); fHi = U.compile(st.hi, ['t']); } catch (e) { return; } }
      m.vals.forEach(a => {
        const c = condOf(a);
        st.rows[String(a)] = c.err ? '0:1' : c.vals.map((v, k) => U.val(v).replace('−', '-') + ':' + (U.isExact(c.p[k]) ? c.p[k].toString() : Lab.fmtDec(Number(c.p[k]), 6))).join(', ');
      });
    }
    function buildStage2() {
      Lab.clear(ctl.stage2);
      rowsSig = '';
      ctl.rowsBox = null; ctl.lo = null; ctl.hi = null; ctl.p = null;
      const A = nA(), B = nB();
      ctl.kind = K.selectField({
        label: 'Distribution of ' + tx(B + '\\mid ' + A + '=' + aS()),
        options: [{ value: 'binom', label: 'Binomial(t, p) — t tosses, chance p of heads' }, { value: 'unif', label: 'Uniform on {lo(t), …, hi(t)}' }, { value: 'typed', label: 'Type each conditional PMF' }],
        value: st.kind,
        onChange: v => { if (v === 'typed') prefillRows(); st.kind = v; touched(); buildStage2(); draw(); },
      });
      ctl.stage2.appendChild(ctl.kind);
      ctl.condMsg = K.note('', 'pl-hint');
      if (st.kind === 'binom') {
        ctl.p = K.probField({ label: 'Chance of heads on one toss ' + tx('p'), value: st.p, onChange: () => { st.p = ctl.p.querySelector('input').value; touched(); draw(); } });
        ctl.stage2.append(ctl.p, K.note(tx(B + '\\mid ' + A + '=' + aS()) + ' counts heads in ' + tx(aS()) + ' tosses, so ' + tx(aS()) + ' must be 0, 1, 2, …', 'pl-hint'));
      } else if (st.kind === 'unif') {
        ctl.lo = K.textField({ label: 'Smallest value ' + tx('\\text{lo}(t)') + ', a formula in ' + tx('t') + ' (the value of ' + tx(A) + ')', value: st.lo, onChange: v => { st.lo = v; touched(); draw(); } });
        ctl.hi = K.textField({ label: 'Largest value ' + tx('\\text{hi}(t)'), value: st.hi, onChange: v => { st.hi = v; touched(); draw(); } });
        ctl.stage2.append(ctl.lo, ctl.hi, K.note('Each of the ' + tx('\\text{hi}(t)-\\text{lo}(t)+1') + ' values gets the same chance. Examples: lo = <code>0</code>, hi = <code>t</code>; or lo = <code>t</code>, hi = <code>2*t</code>.', 'pl-hint'));
      } else {
        ctl.rowsBox = h('div', { class: 't1-rows' });
        ctl.stage2.append(K.note('One line per value of ' + tx(A) + ': <code>value:probability</code> pairs such as <code>0:1/4, 1:1/2, 2:1/4</code>, or <code>a..b</code> for uniform on a, a+1, …, b.', 'pl-hint'), ctl.rowsBox);
      }
      ctl.stage2.appendChild(ctl.condMsg);
    }
    function typedRows(m) {
      if (st.kind !== 'typed' || !ctl.rowsBox) return;
      const vals = m ? m.vals : [];
      const sig = vals.join(',') + '|' + st.xName + st.yName + st.first;
      if (sig === rowsSig) return;
      rowsSig = sig;
      Lab.clear(ctl.rowsBox);
      if (vals.length > 15) { ctl.rowsBox.appendChild(K.note('<span class="cbad">The first variable has ' + vals.length + ' values — too many rows to type (at most 15). Use Binomial or Uniform instead.</span>', 'pl-hint')); return; }
      vals.forEach(a => {
        const key = String(a);
        if (st.rows[key] == null) st.rows[key] = '0:1';
        const f = K.textField({ label: tx(nB() + '\\mid ' + nA() + '=' + U.val(a)), value: st.rows[key], onChange: v => { st.rows[key] = v; touched(); draw(); } });
        f.dataset.t = key;
        ctl.rowsBox.appendChild(f);
      });
    }
    function sideMessages(d) {
      Lab.setHTML(ctl.margMsg, d.errM ? '<span class="cbad">' + esc(d.errM) + '</span>' : '');
      Lab.setHTML(ctl.condMsg, d.errC ? '<span class="cbad">' + esc(d.errC) + '</span>' : '');
      if (ctl.rowsBox) Lab.$$('.pl-field', ctl.rowsBox).forEach(f => { let bad = false; try { parseRow(st.rows[f.dataset.t]); } catch (e) { bad = true; } f.querySelector('input').classList.toggle('bad', bad); });
      if (st.kind === 'unif' && ctl.lo) [[ctl.lo, st.lo], [ctl.hi, st.hi]].forEach(([fl, src]) => { let bad = false; try { U.compile(src, ['t']); } catch (e) { bad = true; } fl.input.classList.toggle('bad', bad); });
    }
    function pickControls(g) {
      const sig = [g.m.vals.join(','), st.pick, st.xName, st.yName, st.first].join('|');
      if (sig === pickSig) return;
      pickSig = sig;
      Lab.clear(ctl.pickBox);
      ctl.pickBox.append(K.selectField({ label: 'Value ' + tx(aS()) + ' of ' + tx(nA()) + ' — shown in ②, ③ and the graphs', options: g.m.vals.map(v => ({ value: String(v), label: Lab.fmtVal(v) })), value: String(st.pick), onChange: v => { st.pick = Number(v); save(); draw(); } }),
        K.note('You can also tap a small chart in ②.', 'pl-hint'));
    }
    function fmtControls(g) {
      const D = g.D > 1 ? g.D : null;
      const sig = [st.fmt, D, g.exact].join('|');
      if (sig === fmtSig) return;
      fmtSig = sig;
      Lab.clear(ctl.fmtBox);
      const items = [{ label: 'Fractions', value: 'frac' }].concat(D ? [{ label: 'Counts over ' + D, value: 'count' }] : [], [{ label: 'Decimals', value: 'dec' }]);
      const seg = Lab.seg(items, fmtCtx(g).mode, v => { st.fmt = v; fmtSig = ''; draw(); });
      seg.classList.add('t1-seg3');
      ctl.fmtBox.append(seg, K.note(!g.exact ? 'Your model has decimals that do not end (from ' + tx('e^{-\\lambda}') + '), so they are rounded to 4 places.' : D ? 'Counts over ' + D + ': the joint cells and ' + tx('f_{' + nB() + '}') + ' written with their common denominator ' + D + '. The inputs ① and ② stay as fractions.' : 'Fractions are exact.', 'pl-hint'));
    }

    /* ---------------------------------------------------------------- draw */
    function draw() {
      save();
      const d = (lastD = compute());
      if (d.ok) good = d;
      typedRows(d.m || (good && good.m));
      sideMessages(d);
      if (!good) {
        K.setAnswer(P.answer, { ev: '<span class="cbad">' + esc(d.errM || d.errC || 'Not ready yet.') + '</span>' });
        Object.values(P).filter(p => p !== P.answer).forEach(p => { Lab.clear(p.body); p.body.appendChild(K.note('Fix the input on the left; this panel fills in as soon as both stages are valid.', 'small muted')); });
        return;
      }
      fmtControls(good);
      pickIndex(good);
      pickControls(good);
      const c = fmtCtx(good);
      drawAnswer(d, good, c);
      drawMarg(good);
      drawConds(good);
      drawProd(good, c);
      drawJoint(good, c);
      drawOther(good, c);
      drawGraphs(good, c);
      drawSteps(good, c);
      drawPois(good);
      root.querySelector('.pl-main').classList.toggle('t1-stale', !d.ok);
    }
    const truncNote = m => (m.truncated ? 'The values shown, ' + tx(nA() + '=' + U.val(m.vals[0]) + ',\\dots,' + U.val(m.vals[m.vals.length - 1])) + ', hold ' + tx('\\sum f_{' + nA() + '}=' + Lab.fmtDec(Number(m.total), 6)) + ' of the probability; the other ' + tx('1-' + Lab.fmtDec(Number(m.total), 6) + '=' + U.fl(1 - Number(m.total))) + ' belongs to larger values and is left out of every table below (raise “shown up to k” to include more).' : '');
    function condWords() {
      const A = nA(), B = nB();
      if (st.kind === 'binom') return tx(B + '\\mid ' + A + '=' + aS() + '\\sim\\text{Bin}(' + aS() + ',' + U.tf(K.parseProb(st.p) || F(1, 2)) + ')');
      if (st.kind === 'unif') return tx(B + '\\mid ' + A + '=' + aS()) + ' uniform on ' + tx('\\{\\text{lo}(t),\\dots,\\text{hi}(t)\\}') + ' with lo = <code>' + esc(st.lo) + '</code>, hi = <code>' + esc(st.hi) + '</code>';
      return tx(B + '\\mid ' + A + '=' + aS()) + ' typed for each value';
    }

    function drawAnswer(d, g, c) {
      const A = nA(), B = nB(), m = g.m;
      const tot = U.sum(g.fB);
      const lines = ['f_{' + B + '}&=' + U.tuple(g.fB, c), 'T_{' + B + '}&=' + U.set(g.bvals)];
      let pois = '';
      if (g.pois) {
        const lam = m.q['λ'], p = K.parseProb(st.p) || F(1, 2), lp = lam * Number(p);
        lines.unshift(B + '&\\sim\\text{Poisson}(\\lambda p)=\\text{Poisson}(' + Lab.fmtDec(lam, 4) + '\\cdot ' + U.tf(p) + ')=\\text{Poisson}(' + Lab.fmtDec(lp, 4) + ')');
        pois = ' The first line is exact (the derivation is below, with your ' + tx('\\lambda') + ' and ' + tx('p') + '); the list comes from the table, which stops at ' + tx(A + '=' + m.vals[m.vals.length - 1]) + ', so its last values are too small.';
      }
      dump = { fB: g.fB.map(String), bvals: g.bvals, m: m.vals, fA: m.p.map(String), J: g.J.p.map(r => r.map(String)), total: String(g.total) };
      const ev = (st.loaded ? 'Lecture example: <b>' + esc(st.loaded.label) + '</b>. ' : '') +
        'Stage 1: ' + tx(A + '\\sim ' + m.texName) + (m.fam === 'custom' ? ' (' + tx(A) + ' takes ' + tx(U.set(m.vals)) + ')' : '') + '. Stage 2: ' + condWords() + '. Joint: ' + tx(rule()) + '.' +
        (d.ok ? '' : ' <span class="cbad">' + esc(d.errM || d.errC) + ' Everything below shows your last valid model.</span>');
      const sub = 'Read ' + tx('f_{' + B + '}') + ' in the order of ' + tx('T_{' + B + '}') + '. It is ' + tx('f_{' + B + '}(' + bS() + ')=\\sum_{' + aS() + '}f_{' + A + '}(' + aS() + ')\\,' + condF(aS()) + '(' + bS() + ')') + ': multiply ① × ② cell by cell (③), then add ' + (isX() ? 'along each row' : 'down each column') + ' of the joint table (④ → ⑤). ' +
        'Total ' + tx('\\sum f_{' + B + '}=' + U.res(tot, c)) + (U.isOne(tot) ? ' <span class="cgood">✓</span>' : ' — less than 1 because stage 1 was cut off (see ①).') + pois;
      K.setAnswer(P.answer, { ev, big: '\\begin{aligned}' + lines.join('\\\\') + '\\end{aligned}', sub });
    }

    function margFormula(m, k) {
      const t = m.vals[k], f = m.p[k], q = m.q || {};
      switch (m.fam) {
        case 'uniform': { const a = Math.min(q.a, q.b), b = Math.max(q.a, q.b); return '\\dfrac{1}{b-a+1}=\\dfrac{1}{' + b + '-' + paren(a) + '+1}=' + U.tf(f); }
        case 'bernoulli': return t === 1 ? 'p=' + U.tf(f) : '1-p=1-' + U.tf(q.p) + '=' + U.tf(f);
        case 'binomial': { const p = q.p, r = F(1).sub(p); return '\\binom{' + q.n + '}{' + t + '}p^{' + t + '}(1-p)^{' + (q.n - t) + '}=' + Lab.math.choose(q.n, t) + '\\cdot ' + U.tf(p.pow(t)) + '\\cdot ' + U.tf(r.pow(q.n - t)) + '=' + U.tf(f); }
        case 'geometric': { const p = q.p, r = F(1).sub(p); return '(1-p)^{' + (t - 1) + '}p=' + U.tf(r.pow(t - 1)) + '\\cdot ' + U.tf(p) + '=' + U.tf(f); }
        case 'poisson': { const lam = Lab.fmtDec(q['λ'], 4); return 'e^{-\\lambda}\\dfrac{\\lambda^{' + t + '}}{' + t + '!}=e^{-' + lam + '}\\dfrac{' + lam + '^{' + t + '}}{' + t + '!}=' + U.fl(f); }
        default: { const s = String((m.typed && m.typed[k]) || '').trim(); const safe = s.replace(/[^0-9./%+*() -]/g, '').replace(/%/g, '\\%'); return '\\text{you typed }' + (safe && s !== f.toString() ? safe + '=' : '') + U.tf(f); }
      }
    }
    function drawMarg(g) {
      const body = P.marg.body;
      Lab.clear(body);
      const m = g.m, A = nA();
      const fr = { mode: 'frac' };
      U.title(P.marg, '① Stage 1 — the marginal of ' + tx(A));
      const q = m.q || {};
      const words = {
        uniform: () => 'Uniform on ' + tx('\\{a,\\dots,b\\}') + ' with ' + tx('a=' + Math.min(q.a, q.b)) + ', ' + tx('b=' + Math.max(q.a, q.b)) + ': each of the ' + tx('b-a+1=' + (Math.abs(q.b - q.a) + 1)) + ' values gets the same chance.',
        bernoulli: () => 'Bernoulli with ' + tx('p=' + U.tf(q.p)) + ': the value 1 with chance ' + tx('p') + ', the value 0 with chance ' + tx('1-p') + '.',
        binomial: () => 'Binomial with ' + tx('n=' + q.n) + ' tosses and ' + tx('p=' + U.tf(q.p)) + ': ' + tx('P(' + A + '=t)=\\binom{n}{t}p^t(1-p)^{n-t}') + '.',
        geometric: () => 'Geometric with ' + tx('p=' + U.tf(q.p)) + ': the toss of the first head, ' + tx('P(' + A + '=t)=(1-p)^{t-1}p') + ' for ' + tx('t=1,2,\\dots') + ' — no largest value.',
        poisson: () => 'Poisson with ' + tx('\\lambda=' + Lab.fmtDec(q['λ'], 4)) + ': ' + tx('P(' + A + '=t)=e^{-\\lambda}\\lambda^t/t!') + ' for ' + tx('t=0,1,2,\\dots') + ' — no largest value.',
        custom: () => 'Your own PMF: the values and probabilities you typed (they add up to 1).',
      }[m.fam];
      P.marg.sub(words() + ' Every value below is a probability of stage 1 alone.');
      body.appendChild(K.pmfChart(m.vals.map((x, k) => ({ x, p: m.p[k], label: U.p(m.p[k], fr), hot: Lab.sameVal(x, st.pick) })), { xName: A, tone: isX() ? 'x' : 'y', height: 150 }));
      const host = h('div');
      body.appendChild(host);
      Lab.mountBlock(Lab.table([tx(aS()), tx('f_{' + A + '}(' + aS() + ')') + ' with your numbers'], m.vals.map((x, k) => [U.nw(U.val(x)), U.nw('f_{' + A + '}(' + U.val(x) + ')=' + margFormula(m, k))])), host);
      body.appendChild(K.note(m.truncated ? truncNote(m) : 'Check: ' + tx('\\sum_' + (isX() ? 't' : "{t'}") + ' f_{' + A + '}=' + U.sumLine(m.p, m.total, fr)) + (U.isOne(m.total) ? ' <span class="cgood">✓</span>' : ''), 'small'));
    }

    function drawConds(g) {
      const body = P.conds.body;
      Lab.clear(body);
      const m = g.m, A = nA(), B = nB();
      const fr = { mode: 'frac' };
      const k0 = pickIndex(g);
      U.title(P.conds, '② Stage 2 — the conditional of ' + tx(B) + ' given ' + tx(A + '=' + aS()));
      P.conds.sub('One distribution for every value of ' + tx(A) + ': ' + condWords() + '. Tap a chart to look closely at it.');
      const many = m.vals.length > 16;
      const grid = h('div', { class: 't1-minis' });
      m.vals.forEach((a, i) => {
        if (many && i !== k0) return;
        const c = g.conds[i];
        const card = h('div', { class: 't1-mini' + (i === k0 ? ' sel' : '') + (c.vals.length > 8 ? ' crowd' : ''), role: 'button', tabindex: '0', 'aria-label': 'look closely at ' + (isX() ? st.xName : st.yName) + ' = ' + Lab.fmtVal(a) });
        card.appendChild(h('div', { class: 't1-mini-t', html: tx(B + '\\mid ' + A + '=' + U.val(a)) + '<br>' + tx('\\sim ' + c.desc) }));
        card.appendChild(K.pmfChart(c.vals.map((x, q) => ({ x, p: c.p[q] })), { height: 70, tone: isX() ? 'y' : 'x', showValues: false }));
        const go = () => { st.pick = a; save(); draw(); };
        card.addEventListener('click', go);
        card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
        grid.appendChild(card);
      });
      body.appendChild(h('div', { class: 't1-minis-scroll' }, grid));
      if (many) body.appendChild(K.note(A + ' has ' + m.vals.length + ' values, so only the chosen one is drawn; choose another in step 4.', 'small muted'));
      // the chosen one, every value
      const a = m.vals[k0], c = g.conds[k0];
      const rows = c.vals.map((v, q) => [U.nw(U.val(v)), U.nw(condF(U.val(a)) + '(' + U.val(v) + ')=' + condFormula(a, v, c.p[q], c))]);
      const steps = [
        { html: 'Look closely at ' + tx(A + '=' + U.val(a)) + ': ' + tx(B + '\\mid ' + A + '=' + U.val(a) + '\\sim ' + c.desc) + '. Its range is ' + tx(U.set(c.vals)) + (c.vals.length < g.bvals.length ? ' — smaller than the ' + g.bvals.length + ' values ' + tx(B) + ' can take overall, so the other cells of this ' + (isX() ? 'column' : 'row') + ' will be 0.' : '.'),
          block: Lab.table([tx(bS()), 'with your numbers'], rows) },
        { html: 'Check: it is a full PMF, so it adds up to 1:', math: '\\sum_{' + bS() + '}' + condF(U.val(a)) + '(' + bS() + ')=' + U.sumLine(c.p, U.sum(c.p), fr) + (U.isOne(U.sum(c.p)) ? '\\ \\checkmark' : '') },
      ];
      body.appendChild(K.steps(steps));
    }
    function condFormula(a, v, f, c) {
      if (st.kind === 'binom') {
        const p = K.parseProb(st.p), r = F(1).sub(p);
        return '\\binom{' + U.val(a) + '}{' + U.val(v) + '}(' + U.tf(p) + ')^{' + U.val(v) + '}(' + U.tf(r) + ')^{' + (a - v) + '}=' + Lab.math.choose(a, v) + '\\cdot ' + U.tf(p.pow(v)) + '\\cdot ' + U.tf(r.pow(a - v)) + '=' + U.tf(f);
      }
      if (st.kind === 'unif') return '\\dfrac{1}{\\text{hi}-\\text{lo}+1}=\\dfrac{1}{' + U.val(c.hi) + '-' + paren(c.lo) + '+1}=' + U.tf(f);
      if (c.range) return '\\dfrac{1}{' + U.val(c.range[1]) + '-' + paren(c.range[0]) + '+1}=' + U.tf(f);
      return '\\text{typed}=' + U.tf(f);
    }

    function drawProd(g, c) {
      const body = P.prod.body;
      Lab.clear(body);
      const m = g.m, A = nA(), B = nB(), J = g.J;
      const k0 = pickIndex(g);
      U.title(P.prod, '③ Multiply, cell by cell');
      P.prod.sub('Every cell of the joint table is stage 1 × stage 2: ' + tx(rule()) + '. A cell is 0 when ' + tx(bS()) + ' is outside the range of ' + tx(B + '\\mid ' + A + '=' + aS()) + '.' + (c.mode === 'count' ? ' Products are written over ' + c.D + '.' : ''));
      const nCells = J.xs.length * J.ys.length;
      const one = (i, kb) => {
        const cp = g.cp[i][kb];
        if (Number(cp) === 0) return '<span class="t1-zero">0</span>';
        return U.nw(U.tf(m.p[i]) + '\\cdot ' + U.tf(cp) + '=' + U.p(g.prod[i][kb], c));
      };
      if (nCells > 300) {
        const a = m.vals[k0];
        body.appendChild(K.note('The table has ' + nCells + ' cells — too many to write out. Here are the products for ' + tx(A + '=' + U.val(a)) + ' (choose another value in step 4):', 'small'));
        const host = h('div');
        body.appendChild(host);
        Lab.mountBlock(Lab.table([tx(bS()), tx(cellTex(U.val(a), bS()) + '=f_{' + A + '}(' + U.val(a) + ')\\cdot ' + condF(U.val(a)) + '(' + bS() + ')')], g.bvals.map((b, kb) => [U.nw(U.val(b)), one(k0, kb)]).filter((_, kb) => Number(g.cp[k0][kb]) !== 0)), host);
        return;
      }
      const t = h('table', { class: 'tbl t1-prod' });
      const head = h('tr', {}, h('th', { class: 't1-corner', html: tx(nY() + '\\,\\backslash\\,' + nX()) }));
      J.xs.forEach((x, i) => head.appendChild(h('th', { class: 't1-hx' + (isX() && i === k0 ? ' t1-sel' : ''), html: U.nw(U.val(x)) + (isX() ? '<div class="t1-fa">' + U.nw('f_{' + A + '}=' + U.tf(m.p[i])) + '</div>' : '') })));
      t.appendChild(h('thead', {}, head));
      const tb = h('tbody');
      J.ys.forEach((y, j) => {
        const tr = h('tr', {}, h('th', { class: 't1-hy' + (!isX() && j === k0 ? ' t1-sel' : ''), html: U.nw(U.val(y)) + (!isX() ? '<div class="t1-fa">' + U.nw('f_{' + A + '}=' + U.tf(m.p[j])) + '</div>' : '') }));
        J.xs.forEach((x, i) => {
          const ia = isX() ? i : j, kb = isX() ? j : i;
          tr.appendChild(h('td', { class: ia === k0 ? 't1-sel' : '', html: one(ia, kb) }));
        });
        tb.appendChild(tr);
      });
      t.appendChild(tb);
      body.appendChild(h('div', { class: 'tbl-wrap t1-prod-wrap' }, t));
      const a = m.vals[k0];
      const kb0 = g.cp[k0].findIndex(v => Number(v) > 0);
      if (kb0 >= 0) body.appendChild(K.note('For example (violet): ' + tx(cellTex(U.val(a), U.val(g.bvals[kb0])) + '=f_{' + A + '}(' + U.val(a) + ')\\cdot ' + condF(U.val(a)) + '(' + U.val(g.bvals[kb0]) + ')=' + U.tf(m.p[k0]) + '\\cdot ' + U.tf(g.cp[k0][kb0]) + '=' + U.res(g.prod[k0][kb0], c)) + '.', 'small'));
    }

    function drawJoint(g, c) {
      const body = P.joint.body;
      Lab.clear(body);
      const m = g.m, A = nA(), B = nB();
      const k0 = pickIndex(g);
      U.title(P.joint, '④ The joint PMF ' + tx(fXY() + "(t,t')"));
      P.joint.sub('The products of ③ as a table, ' + tx(nX()) + ' across and ' + tx(nY()) + ' down. The ' + (isX() ? 'right' : 'bottom') + ' margin is ' + tx('f_{' + B + '}') + ' — the marginal this lab is after (⑤). The ' + (isX() ? 'bottom' : 'right') + ' margin gives back ' + tx('f_{' + A + '}') + ', because every conditional adds up to 1.' + (c.mode === 'count' ? ' Counts over ' + c.D + ', the smallest common denominator of the cells.' : ''));
      const host = h('div');
      body.appendChild(host);
      const o = { J: g.J, x: { name: st.xName, label: st.xLabel }, y: { name: st.yName, label: st.yLabel }, margins: 'shown', fmt: c.mode === 'count' ? 'count' : c.mode === 'dec' || !g.exact ? 'dec' : 'frac', hover: true };
      if (c.mode === 'count') o.den = c.D;
      const jt = W.joint(o);
      jt.mount(host);
      jt.mark(g.bvals.map((_, kb) => (isX() ? [k0, kb] : [kb, k0])));
      const a = m.vals[k0];
      const nz = g.prod[k0].filter(v => Number(v) !== 0);
      const back = U.sum(g.prod[k0]);
      body.appendChild(K.steps([
        { html: 'The ' + (isX() ? 'column' : 'row') + ' ' + tx(A + '=' + U.val(a)) + ' (violet) adds up to ' + tx('f_{' + A + '}(' + U.val(a) + ')') + ' again — the factor ' + tx('f_{' + A + '}(' + U.val(a) + ')') + ' is common to its cells and the conditional adds up to 1:',
          math: "\\sum_{" + bS() + '}' + cellTex(U.val(a), bS()) + '=' + (nz.length ? U.sumLine(nz, back, c) : '0') + '=f_{' + A + '}(' + U.val(a) + ')\\cdot 1' + (Math.abs(Number(back) - Number(m.p[k0])) < 1e-12 ? '\\ \\checkmark' : '') },
        { html: 'All the cells together: ' + tx('\\sum\\sum ' + fXY() + '=' + U.res(g.total, c)) + (U.isOne(g.total) ? ' <span class="cgood">✓</span> — a valid joint PMF.' : ' — less than 1 because stage 1 stops at ' + tx(A + '=' + U.val(m.vals[m.vals.length - 1])) + ' (see ①).') },
      ]));
    }

    function drawOther(g, c) {
      const body = P.other.body;
      Lab.clear(body);
      const m = g.m, A = nA(), B = nB();
      U.title(P.other, '⑤ The marginal of ' + tx(B) + ': add ' + (isX() ? 'along each row' : 'down each column'));
      P.other.sub('From ' + link('l1-2', 'L1.2') + ': fix a value of ' + tx(B) + ' and add over every value of ' + tx(A) + ' (marginalize ' + tx(A) + ' out). Zero cells add nothing, so only the non-zero ones are written.');
      const rows = g.bvals.map((b, kb) => {
        const terms = m.vals.map((a, i) => ({ a, v: g.prod[i][kb] })).filter(r => Number(r.v) !== 0);
        const zeroA = m.vals.filter((a, i) => Number(g.prod[i][kb]) === 0);
        const line = 'f_{' + B + '}(' + U.val(b) + ')=' + (terms.length ? U.sumLine(terms.map(r => r.v), g.fB[kb], c) : '0');
        const from = terms.length <= 6 ? tx(A + '=' + terms.map(r => U.val(r.a)).join(',')) : terms.length + ' cells';
        return [U.nw(U.val(b)), U.nw(line) + '<div class="t1-used">cells used: ' + from + (zeroA.length ? '; the cell' + (zeroA.length > 1 ? 's' : '') + ' for ' + tx(A + (zeroA.length > 6 ? '\\in' + U.set(zeroA) : '=' + zeroA.map(U.val).join(','))) + ' ' + (zeroA.length > 1 ? 'are' : 'is') + ' 0' : '') + '</div>'];
      });
      const tot = U.sum(g.fB);
      const steps = [
        { html: 'The rule, with ' + tx(bS()) + ' fixed:', math: 'f_{' + B + '}(' + bS() + ')=\\sum_{' + aS() + '}' + cellTex(aS(), bS()) + '=\\sum_{' + aS() + '}f_{' + A + '}(' + aS() + ')\\,' + condF(aS()) + '(' + bS() + ')' },
        { html: 'Every value of ' + tx(B) + ', with your numbers:', block: Lab.table([tx(bS()), 'the non-zero cells added'], rows) },
        { html: 'Check: ' + tx('f_{' + B + '}') + ' is a PMF' + (m.truncated ? ' — up to the part cut off in ①' : '') + ':', math: '\\sum_{' + bS() + '}f_{' + B + '}(' + bS() + ')=' + U.sumLine(g.fB, tot, c) + (U.isOne(tot) ? '\\ \\checkmark' : ''), note: m.truncated ? 'Short of 1 by ' + tx(U.fl(1 - Number(tot))) + ' — exactly the stage-1 probability left out in ①.' : '' },
      ];
      if (!g.exact) steps[1].note = 'Decimals are rounded to 4 places, so the written terms may not add up exactly to the rounded total; the totals are computed before rounding.';
      body.appendChild(K.steps(steps));
    }

    function drawGraphs(g, c) {
      const m = g.m, A = nA(), B = nB();
      const fr = { mode: 'frac' };
      U.title(P.gB, 'PMF and CDF of ' + tx(B) + ' (computed)');
      P.gB.sub(tx('f_{' + B + '}') + ' from ⑤. The CDF ' + tx('F_{' + B + '}(t)=P(' + B + '\\le t)') + ' adds the bars up to ' + tx('t') + '.');
      Lab.clear(P.gB.body);
      U.graphs(P.gB.body, { vals: g.bvals, p: g.fB }, { name: B, tone: isX() ? 'y' : 'x', c, t: st.t.b, onT: v => { st.t.b = v; save(); }, truncated: m.truncated });
      U.title(P.gA, 'PMF and CDF of ' + tx(A) + ' (your stage 1)');
      P.gA.sub(tx('f_{' + A + '}') + ' from ①.' + (m.truncated ? ' Cut off at ' + tx(A + '=' + U.val(m.vals[m.vals.length - 1])) + '.' : ''));
      Lab.clear(P.gA.body);
      U.graphs(P.gA.body, { vals: m.vals, p: m.p }, { name: A, tone: isX() ? 'x' : 'y', c: fr, t: st.t.a, onT: v => { st.t.a = v; save(); }, truncated: m.truncated });
      const k0 = pickIndex(g), a = m.vals[k0], cd = g.conds[k0];
      U.title(P.gC, 'PMF and CDF of ' + tx(B + '\\mid ' + A + '=' + U.val(a)));
      P.gC.sub('The conditional you chose in step 4: ' + tx(B + '\\mid ' + A + '=' + U.val(a) + '\\sim ' + cd.desc) + '.');
      Lab.clear(P.gC.body);
      U.graphs(P.gC.body, { vals: cd.vals, p: cd.p }, { name: B, given: A + '=' + U.val(a), tone: isX() ? 'y' : 'x', c: fr, t: st.t.c, onT: v => { st.t.c = v; save(); } });
    }

    function drawSteps(g, c) {
      const body = P.steps.body;
      Lab.clear(body);
      const m = g.m, A = nA(), B = nB();
      const k0 = pickIndex(g), a = m.vals[k0];
      const kb0 = Math.max(0, g.cp[k0].findIndex(v => Number(v) > 0));
      const b0 = g.bvals[kb0];
      const terms = m.vals.map((_, i) => g.prod[i][kb0]).filter(v => Number(v) !== 0);
      U.title(P.steps, 'How it is computed, with your numbers');
      P.steps.sub('The loop from ' + link('l1-4', 'L1.4') + ': marginal + conditional → joint → the other marginal. One cell and one sum are worked here; ③ and ⑤ show all of them.');
      body.appendChild(K.steps([
        { html: '<b>Stage 1</b> gives the marginal of ' + tx(A) + ' (①). For your value ' + tx(aS() + '=' + U.val(a)) + ':', math: 'f_{' + A + '}(' + U.val(a) + ')=' + margFormula(m, k0) },
        { html: '<b>Stage 2</b> gives, for each value of ' + tx(A) + ', the conditional of ' + tx(B) + ' (②). With ' + tx(A + '=' + U.val(a)) + ' and ' + tx(bS() + '=' + U.val(b0)) + ':', math: condF(U.val(a)) + '(' + U.val(b0) + ')=' + condFormula(a, b0, g.cp[k0][kb0], g.conds[k0]) },
        { html: '<b>Multiply</b> (the product rule of ' + link('l1-3', 'L1.3') + '): joint = marginal × conditional (③, ④).', math: rule() + '\\ \\Rightarrow\\ ' + cellTex(U.val(a), U.val(b0)) + '=' + U.tf(m.p[k0]) + '\\cdot ' + U.tf(g.cp[k0][kb0]) + '=' + U.res(g.prod[k0][kb0], c) },
        { html: '<b>Add</b> over the values of ' + tx(A) + ' to get the other marginal (⑤). For ' + tx(bS() + '=' + U.val(b0)) + ':', math: 'f_{' + B + '}(' + U.val(b0) + ')=\\sum_{' + aS() + '}' + cellTex(aS(), U.val(b0)) + '=' + (terms.length ? U.sumLine(terms, g.fB[kb0], c) : '0') },
        { html: '<b>Check</b>: ' + tx('\\sum f_{' + B + '}=' + U.res(U.sum(g.fB), c)) + (U.isOne(U.sum(g.fB)) ? ' <span class="cgood">✓</span>' : ' — the part of stage 1 left out in ① is missing.') + ' Started from ' + tx('f_{' + A + '}') + ' and ' + tx(B + '\\mid ' + A) + '; ended with ' + tx('f_{' + B + '}') + '. From the joint you could also go on to ' + tx(A + '\\mid ' + B) + ' (open the joint table in the ' + '<a href="#/p/lab-s2-joint">joint, marginal &amp; conditional lab</a>).' },
      ]));
    }

    function drawPois(g) {
      P.pois.hidden = !g.pois;
      if (!g.pois) return;
      const body = P.pois.body;
      Lab.clear(body);
      const m = g.m, A = nA(), B = nB();
      const lamN = m.q['λ'], lam = Lab.fmtDec(lamN, 4);
      const p = K.parseProb(st.p) || F(1, 2), r = F(1).sub(p);
      const ps = U.tf(p), rs = U.tf(r);
      const lp = lamN * Number(p), lq = lamN * Number(r);
      const lpS = Lab.fmtDec(lp, 4), lqS = Lab.fmtDec(lq, 4);
      const Kmax = m.vals[m.vals.length - 1];
      const nn = 'n', kk = 'k';
      const fA = 'f_{' + A + '}', fB = 'f_{' + B + '}', fAB = 'f_{' + A + B + '}';
      const cF = 'f_{' + B + '\\mid ' + A + '=n}';
      U.title(P.pois, 'Why ' + tx(B + '\\sim\\text{Poisson}(\\lambda p)') + ': the derivation with your ' + tx('\\lambda=' + lam) + ' and ' + tx('p=' + ps));
      P.pois.sub('From ' + link('l1-4', 'L1.4') + ', Example 2. The lecture uses ' + tx('n') + ' for the value of ' + tx(A) + ' and ' + tx('k') + ' for the value of ' + tx(B) + '; so does this panel. The sum over ' + tx('n') + ' never ends, so the tables above stop at ' + tx('n=' + Kmax) + ' — the algebra below has no cut-off.');
      const steps = [
        { html: '<b>Marginal</b> of ' + tx(A) + ' (given):', math: fA + '(n)=e^{-\\lambda}\\dfrac{\\lambda^{n}}{n!}=e^{-' + lam + '}\\dfrac{' + lam + '^{n}}{n!},\\qquad n=0,1,2,\\dots' },
        { html: '<b>Conditional</b> of ' + tx(B) + ' given ' + tx(A + '=n') + ': ' + tx('n') + ' tosses, each heads with chance ' + tx('p') + ':', math: cF + '(k)=\\binom{n}{k}p^{k}(1-p)^{n-k}=\\binom{n}{k}\\left(' + ps + '\\right)^{k}\\left(' + rs + '\\right)^{n-k},\\qquad k=0,\\dots,n' },
        { html: '<b>Joint</b> = marginal × conditional:', math: fAB + '(n,k)=e^{-\\lambda}\\dfrac{\\lambda^{n}}{n!}\\binom{n}{k}p^{k}(1-p)^{n-k},\\qquad 0\\le k\\le n' },
        { html: '<b>Marginalize ' + tx(A) + ' out</b>. With fewer than ' + tx('k') + ' tosses you cannot get ' + tx('k') + ' heads, so every term with ' + tx('n<k') + ' is 0 and the sum starts at ' + tx('n=k') + ':', math: fB + '(k)=\\sum_{n=0}^{\\infty}' + fAB + '(n,k)=\\sum_{n=k}^{\\infty}e^{-\\lambda}\\dfrac{\\lambda^{n}}{n!}\\binom{n}{k}p^{k}(1-p)^{n-k}' },
        { html: '<b>Expand</b> ' + tx('\\binom{n}{k}=\\dfrac{n!}{k!\\,(n-k)!}') + '; the ' + tx('n!') + ' cancels:', math: fB + '(k)=\\sum_{n=k}^{\\infty}e^{-\\lambda}\\dfrac{\\lambda^{n}p^{k}(1-p)^{n-k}}{k!\\,(n-k)!}' },
        { html: '<b>Split</b> ' + tx('\\lambda^{n}=\\lambda^{k}\\lambda^{n-k}') + ' and pull out everything that does not change with ' + tx('n') + ':', math: fB + '(k)=e^{-\\lambda}\\dfrac{(\\lambda p)^{k}}{k!}\\sum_{n=k}^{\\infty}\\dfrac{\\big(\\lambda(1-p)\\big)^{n-k}}{(n-k)!}', note: 'With your numbers: ' + tx('\\lambda p=' + lam + '\\cdot ' + ps + '=' + lpS) + ' and ' + tx('\\lambda(1-p)=' + lam + '\\cdot ' + rs + '=' + lqS) + '.' },
        { html: '<b>The exponential series</b> ' + tx('\\sum_{m=0}^{\\infty}\\dfrac{a^{m}}{m!}=e^{a}') + ', with ' + tx('m=n-k') + ' and ' + tx('a=\\lambda(1-p)=' + lqS) + ':', math: '\\sum_{n=k}^{\\infty}\\dfrac{(' + lqS + ')^{n-k}}{(n-k)!}=e^{' + lqS + '}' },
        { html: '<b>Combine</b> the exponentials: ' + tx('e^{-\\lambda}e^{\\lambda(1-p)}=e^{-\\lambda p}') + ', here ' + tx('e^{-' + lam + '}e^{' + lqS + '}=e^{-' + lpS + '}') + '. So, for every ' + tx('k=0,1,2,\\dots') + ':', math: fB + '(k)=e^{-\\lambda p}\\dfrac{(\\lambda p)^{k}}{k!}=e^{-' + lpS + '}\\dfrac{' + lpS + '^{k}}{k!}\\qquad\\Longrightarrow\\qquad ' + B + '\\sim\\text{Poisson}(' + lpS + ')' },
      ];
      const pois = k => Math.exp(-lp + k * Math.log(lp) - Lab.range(1, k).reduce((s, i) => s + Math.log(i), 0));
      const rows = g.bvals.map((k, kb) => {
        const tab = Number(g.fB[kb]), ex = lp > 0 ? pois(k) : (k === 0 ? 1 : 0);
        return [U.nw(String(k)), U.nw('\\sum_{n=' + k + '}^{' + Kmax + '}' + fAB + '(n,' + k + ')=' + U.fl(tab)), U.nw('e^{-' + lpS + '}\\dfrac{' + lpS + '^{' + k + '}}{' + k + '!}=' + U.fl(ex)), U.nw(U.fl(ex - tab))];
      });
      const left = 1 - Number(m.total);
      steps.push({ html: '<b>Check with numbers.</b> Left: the row sums of the table above, which stop at ' + tx('n=' + Kmax) + '. Right: the exact formula. The difference is the part of the sum with ' + tx('n>' + Kmax) + ' that the table leaves out; it is never more than ' + tx('P(' + A + '>' + Kmax + ')=1-\\sum_{n\\le ' + Kmax + '}' + fA + '(n)=' + U.fl(left)) + ', and it is largest for ' + tx('k') + ' near ' + Kmax + ' (there only a few terms are kept). Raise “shown up to k” in stage 1 to shrink it.',
        block: Lab.table([tx('k'), 'the table (cut at ' + tx('n=' + Kmax) + ')', 'exact ' + tx('\\text{Poisson}(' + lpS + ')'), 'difference'], rows) });
      body.appendChild(K.steps(steps));
    }

    /* --------------------------------------------------------------- mount */
    function mount(el) {
      root = el;
      const { side, main } = K.layout(root, 't1-build');
      side.appendChild(K.group('Lecture examples'));
      ctl.pre = K.presets({ items: PRESETS, onPick: loadPreset });
      side.appendChild(ctl.pre);
      ctl.dyn = h('div', { class: 't1-dyn' });
      side.appendChild(ctl.dyn);
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
        Lab.store.set(KEY, {});
        Object.keys(st).forEach(k => delete st[k]);
        Object.assign(st, DEF());
        ctl.pre.select.value = '0'; Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[0].source);
        buildSide(); draw();
      }, 'btn ghost sm')));
      P.answer = K.answer();
      P.marg = K.panel('① Stage 1');
      P.conds = K.panel('② Stage 2');
      P.prod = K.panel('③ Multiply');
      P.joint = K.panel('④ The joint PMF');
      P.other = K.panel('⑤ The other marginal');
      P.gB = K.panel('PMF and CDF');
      P.gA = K.panel('PMF and CDF');
      P.gC = K.panel('PMF and CDF');
      P.steps = K.panel('How it is computed, with your numbers');
      P.pois = K.panel('The Poisson derivation');
      main.append(P.answer, P.marg, P.conds, P.prod, P.joint, P.other, P.gB, P.gA, P.gC, P.steps, P.pois);
      root.__t1 = { get st() { return st; }, get good() { return good; }, get dump() { return dump; } };
      buildSide();
      draw();
      if (st.loaded) {
        const k = PRESETS.findIndex(p => p.label === st.loaded.label);
        if (k >= 0) { ctl.pre.select.value = String(k); Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[k].source); }
      }
    }
    return { mount };
  }

  Lab.lab({
    id: 'lab-s2-build', course: 's2', week: 1, order: 2,
    title: 'Build a joint PMF from pieces', sub: 'Week 1 · L1.4',
    topics: ['marginal × conditional', 'joint PMF', 'other marginal', 'Binomial', 'Poisson thinning', 'PMF', 'CDF'],
    desc: 'Choose the marginal of the first variable and, for each of its values, the conditional of the second. Watch every cell being multiplied, the joint table filling in, and the other marginal being added up — the die-and-coins, Poisson, IPL and random-rectangle (L2.10) examples included.',
    render: el => buildLab().mount(el),
  });
})();
