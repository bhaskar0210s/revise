/* Revise — where probabilities come from.
   W.sorter: every outcome of the experiment is carried to the value(s) its random variable(s) give it.
   W.sim:    the experiment is actually run many times; counts become relative frequencies. */
(function () {
  'use strict';
  const { h, F } = Lab;
  const W = (Lab.W = Lab.W || {});
  const tn = n => n.replace(/(\d+)$/, '_{$1}');

  function zeroDist(vals) { return { vals: vals.slice(), p: vals.map(() => F(0)) }; }
  function valuesOf(outcomes, fn) { return [...new Set(outcomes.map(o => fn(o.v, o)))].sort((a, b) => Number(a) - Number(b)); }

  /**
   * W.sorter(opts)
   *  outcomes  list from Lab.P (coins, dice, numbers, deck, or custom {label, v, p, kind})
   *  X, Y      functions (v, outcome) → number. With Y, the target is a joint table.
   *  x, y      {name, label}
   *  cols      columns in the outcome grid
   *  tones     colour per coin/die position, e.g. ['x','y']
   *  why       fn(outcome) → html explaining the mapping for that outcome
   *  size      drawing size
   */
  W.sorter = function (opts) {
    const o = Object.assign({ cols: null, size: null }, opts);
    o.x = Object.assign({ name: 'X', label: '' }, o.x);
    o.y = Object.assign({ name: 'Y', label: '' }, o.y);
    const two = typeof o.Y === 'function';
    let root, tiles = [], target, readout, nextBtn, allBtn, resetBtn, idx = 0, busy = false, acc, total;
    const xs = valuesOf(o.outcomes, o.X);
    const ys = two ? valuesOf(o.outcomes, o.Y) : null;
    const self = { mount(el) { root = el; build(); }, reset, sortAll, sortNext, get target() { return target; } };

    function build() {
      Lab.clear(root);
      root.classList.add('w-sorter');
      const n = o.outcomes.length;
      const same = o.outcomes.every(q => q.p.eq(o.outcomes[0].p));
      const omega = h('div', { class: 'ws-omega' });
      omega.appendChild(h('div', { class: 'ws-title', html: 'Sample space ' + Lab.tex('\\Omega') + ' · ' + n + ' outcomes' + (same ? ', each with probability ' + Lab.tex(o.outcomes[0].p.tex()) : '') }));
      const grid = h('div', { class: 'ws-grid' });
      if (o.cols) grid.style.gridTemplateColumns = 'repeat(' + o.cols + ', auto)';
      tiles = o.outcomes.map((q, k) => {
        const t = h('div', { class: 'ws-tile', title: q.label }, Lab.draw.outcome(q, { size: o.size, tones: o.tones }));
        if (!same) t.appendChild(h('span', { class: 'ws-p', html: Lab.fmtHtml(q.p) }));
        t.addEventListener('mouseenter', () => explain(k, false));
        grid.appendChild(t);
        return t;
      });
      omega.appendChild(grid);
      const tgt = h('div', { class: 'ws-target' });
      tgt.appendChild(h('div', { class: 'ws-title', html: two
        ? 'Joint PMF table of ' + Lab.tex('(' + tn(o.x.name) + ',' + tn(o.y.name) + ')') + ' — filling up'
        : 'PMF of ' + Lab.tex(tn(o.x.name)) + ' — filling up' }));
      const host = h('div');
      tgt.appendChild(host);
      if (two) {
        acc = { xs, ys, p: xs.map(() => ys.map(() => F(0))) };
        target = W.joint({ J: acc, x: o.x, y: o.y, hover: false, caption: true, mass: true, den: same && o.counts !== false ? n : null });
      } else {
        acc = zeroDist(xs);
        target = W.bars({ dist: acc, tone: 'x', height: 150, max: Math.max(...Lab.P.fromOutcomes(o.outcomes, o.X).p.map(Number)) * 1.1, xName: o.x.name, den: same && o.counts !== false ? n : null });
      }
      target.mount(host);
      const layer = h('div', { class: 'fx-layer' });
      const top = h('div', { class: 'ws-top' + (n > 16 ? ' stack' : '') }, omega, tgt);
      root.append(h('div', { class: 'ws-stage' }, top, layer));
      readout = h('div', { class: 'ws-readout' });
      root.appendChild(readout);
      nextBtn = Lab.button('Sort one outcome', () => sortNext(), 'btn sm');
      allBtn = Lab.button('Sort them all', () => sortAll(), 'btn primary sm');
      resetBtn = Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => reset(), 'btn ghost sm');
      root.appendChild(h('div', { class: 'btn-row' }, allBtn, nextBtn, resetBtn));
      total = F(0);
      idx = 0;
      readout.innerHTML = '<span class="muted">Each outcome will travel to the ' + (two ? 'cell' : 'value') + ' its random variable' + (two ? 's give' : ' gives') + ' it. Point at an outcome to see where it goes.</span>';
      self.layer = layer;
    }
    function valuesFor(k) {
      const q = o.outcomes[k];
      return { x: o.X(q.v, q), y: two ? o.Y(q.v, q) : null };
    }
    function explain(k, sorted) {
      const q = o.outcomes[k];
      const { x, y } = valuesFor(k);
      const lab = '<span class="oc-lab">' + Lab.esc(q.label) + '</span>';
      const fx = (name, v) => Lab.tex(tn(name)) + '(' + lab + ')' + Lab.tex('=' + Lab.fmtVal(v));
      let html = fx(o.x.name, x) + (two ? '&nbsp;&nbsp;&nbsp;' + fx(o.y.name, y) : '');
      if (o.why) html += '<div class="xs muted">' + o.why(q) + '</div>';
      if (sorted) html += '<div class="xs muted">→ goes to ' + (two ? 'cell ' + Lab.tex('(' + Lab.fmtVal(x) + ',' + Lab.fmtVal(y) + ')') : 'the bar at ' + Lab.tex(Lab.fmtVal(x))) + ', adding ' + Lab.tex(q.p.tex()) + '</div>';
      readout.innerHTML = html;
    }
    function destination(k) {
      const { x, y } = valuesFor(k);
      const i = xs.findIndex(v => Lab.sameVal(v, x));
      if (two) { const j = ys.findIndex(v => Lab.sameVal(v, y)); return { el: target.cell(i, j), i, j }; }
      return { el: target.col(i).querySelector('.wb-bar'), i };
    }
    function addMass(k, dest) {
      const q = o.outcomes[k];
      total = total.add(q.p);
      if (two) { acc.p[dest.i][dest.j] = acc.p[dest.i][dest.j].add(q.p); target.setJ(acc); Lab.pulse(dest.el); }
      else { acc.p[dest.i] = acc.p[dest.i].add(q.p); target.set(acc, { animate: true, ms: 260 }); }
    }
    async function flyOne(k, animate) {
      const dest = destination(k);
      const tile = tiles[k];
      tile.classList.add('moving');
      if (animate) await Lab.fly(tile.firstChild, dest.el, self.layer, { ms: 700, scale: 0.55 });
      tile.classList.remove('moving');
      tile.classList.add('sorted');
      addMass(k, dest);
    }
    async function sortNext() {
      if (busy || idx >= tiles.length) return;
      busy = true;
      const k = idx++;
      explain(k, true);
      await flyOne(k, true);
      busy = false;
      if (idx >= tiles.length) finished();
    }
    async function sortAll(opt = {}) {
      if (busy) return;
      busy = true;
      const animate = opt.animate !== false;
      const n = tiles.length;
      const gap = n > 30 ? 70 : n > 12 ? 110 : 220;
      const jobs = [];
      for (let k = idx; k < n; k++) {
        if (animate) { explain(k, true); jobs.push(flyOne(k, true)); await Lab.sleep(gap); }
        else flyOne(k, false);
      }
      idx = n;
      await Promise.all(jobs);
      busy = false;
      finished();
    }
    function finished() {
      readout.innerHTML = 'All ' + tiles.length + ' outcomes sorted. Total probability collected: ' + Lab.tex(total.tex()) + '. ' +
        (two ? 'Each cell now holds ' + Lab.tex('P(' + tn(o.x.name) + '=t_1,\\ ' + tn(o.y.name) + '=t_2)') + ': the total probability of the outcomes inside it.' : 'Each bar is ' + Lab.tex('P(' + tn(o.x.name) + '=t)') + ': the total probability of the outcomes it collected.');
      allBtn.disabled = true; nextBtn.disabled = true;
    }
    function reset() {
      if (busy) return;
      build();
    }
    return self;
  };

  /**
   * W.sim(opts) — run the experiment for real (random draws), N times.
   *  outcomes, X, Y (optional), x, y, log (rows to keep), runs: [1, 10, 100, 1000]
   */
  W.sim = function (opts) {
    const o = Object.assign({ runs: [1, 10, 100, 1000], log: 6 }, opts);
    o.x = Object.assign({ name: 'X' }, o.x);
    o.y = Object.assign({ name: 'Y' }, o.y);
    const two = typeof o.Y === 'function';
    const xs = valuesOf(o.outcomes, o.X);
    const ys = two ? valuesOf(o.outcomes, o.Y) : null;
    const truth = two ? Lab.P.joint(o.outcomes, o.X, o.Y) : Lab.P.fromOutcomes(o.outcomes, o.X);
    let root, logBody, nEl, view, counts, N = 0, showTrue = false, trials = [];
    const probs = o.outcomes.map(q => Number(q.p));
    const self = { mount(el) { root = el; build(); }, reset, run };

    function build() {
      Lab.clear(root);
      root.classList.add('w-sim');
      const btns = h('div', { class: 'btn-row' });
      o.runs.forEach((r, k) => btns.appendChild(Lab.button('Run ' + (r === 1 ? 'once' : r.toLocaleString() + '×'), () => run(r), k === 1 ? 'btn primary sm' : 'btn sm')));
      btns.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => reset(), 'btn ghost sm'));
      nEl = h('div', { class: 'sim-n' });
      const logT = h('table', { class: 'tbl sim-log' });
      logT.appendChild(h('thead', {}, h('tr', {}, h('th', { text: 'Trial' }), h('th', { text: 'Outcome' }), h('th', { html: Lab.tex(tn(o.x.name)) }), two ? h('th', { html: Lab.tex(tn(o.y.name)) }) : null)));
      logBody = h('tbody');
      logT.appendChild(logBody);
      const left = h('div', { class: 'sim-left' }, h('div', { class: 'ws-title', text: 'Raw data: one row per trial' }), h('div', { class: 'tbl-wrap' }, logT));
      const right = h('div', { class: 'sim-right' });
      const head = h('div', { class: 'ws-title sim-head' });
      head.appendChild(h('span', { html: two ? 'Relative frequency of each pair' : 'Relative frequency of each value' }));
      const tog = Lab.seg([{ label: 'Data', value: false }, { label: 'True PMF', value: true }], false, v => { showTrue = v; paint(); });
      head.appendChild(tog);
      right.appendChild(head);
      const host = h('div');
      right.appendChild(host);
      if (two) view = W.joint({ J: zeroJ(), x: o.x, y: o.y, fmt: 'dec', hover: false, caption: false });
      else view = W.bars({ dist: { vals: xs, p: xs.map(() => 0) }, tone: 'x', height: 150, fmt: 'dec', max: Math.max(...truth.p.map(Number)) * 1.35, compare: truth, xName: o.x.name });
      view.mount(host);
      root.appendChild(h('div', { class: 'btn-row sim-controls' }, btns, nEl));
      root.appendChild(h('div', { class: 'sim-grid' }, left, right));
      reset(true);
    }
    function zeroJ() { return { xs, ys, p: xs.map(() => ys.map(() => F(0))) }; }
    function reset(first) {
      N = 0; trials = [];
      counts = two ? xs.map(() => ys.map(() => 0)) : xs.map(() => 0);
      Lab.clear(logBody);
      logBody.appendChild(h('tr', {}, h('td', { colspan: two ? 4 : 3, class: 'muted', text: 'No trials yet — press Run.' })));
      if (!first) paint(); else paintN();
    }
    function run(r) {
      for (let t = 0; t < r; t++) {
        const k = Lab.rand.weighted(probs);
        const q = o.outcomes[k];
        const x = o.X(q.v, q), y = two ? o.Y(q.v, q) : null;
        const i = xs.findIndex(v => Lab.sameVal(v, x));
        if (two) { const j = ys.findIndex(v => Lab.sameVal(v, y)); counts[i][j]++; } else counts[i]++;
        N++;
        trials.push({ n: N, q, x, y });
        if (trials.length > o.log) trials.shift();
      }
      Lab.clear(logBody);
      trials.slice().reverse().forEach((tr, k) => {
        const row = h('tr', { class: k === 0 ? 'new' : '' }, h('td', { class: 'muted', text: '#' + tr.n.toLocaleString() }), h('td', {}, Lab.draw.outcome(tr.q, { size: 18, tones: o.tones })), h('td', { text: Lab.fmtVal(tr.x) }), two ? h('td', { text: Lab.fmtVal(tr.y) }) : null);
        logBody.appendChild(row);
      });
      paint();
    }
    function paintN() { nEl.innerHTML = 'Trials so far: <b>' + N.toLocaleString() + '</b>'; }
    function paint() {
      paintN();
      if (two) {
        if (showTrue) view.setJ(truth);
        else view.setJ({ xs, ys, p: counts.map(r => r.map(c => (N ? F(c, N) : F(0)))) });
      } else {
        if (showTrue) view.set({ vals: xs, p: truth.p }, { animate: true, ms: 300 });
        else view.set({ vals: xs, p: counts.map(c => (N ? c / N : 0)) }, { animate: true, ms: 300 });
      }
    }
    return self;
  };
})();
