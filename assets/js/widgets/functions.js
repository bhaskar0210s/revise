/* Revise — functions of random variables.
   W.mapping: Y = g(X). Each value of X sends its probability along an arrow to g(x).
   W.grid2:   Z = g(X, Y). Points (x, y) on a grid; all points with the same g value pool their mass. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const W = (Lab.W = Lab.W || {});
  const tn = n => n.replace(/(\d+)$/, '_{$1}');

  function compileG(g, vars) {
    if (typeof g === 'function') return { fn: g, src: null };
    const f = Lab.expr.compile(g);
    return { fn: (...a) => { const env = {}; vars.forEach((v, k) => (env[v] = a[k])); return f(env); }, src: g };
  }
  function prettyExpr(src, vars) {
    // light TeX version of a typed expression: x^2 -> x^{2}, * -> \cdot, abs bars kept
    let s = src.replace(/\s+/g, '');
    s = s.replace(/\*/g, '\\cdot ').replace(/\^(\d+|\w)/g, '^{$1}');
    s = s.replace(/max\(/g, '\\max(').replace(/min\(/g, '\\min(').replace(/abs\(([^()]*)\)/g, '|$1|');
    s = s.replace(/\bmod\(([^,]+),([^)]+)\)/g, '$1 \\bmod $2');
    return s;
  }

  /**
   * W.mapping(opts)
   *  dists     [{label, dist}] choices for X (first is used)
   *  presets   [{label, g: 'x-5'}] choices for g
   *  editable  allow typing your own g(x)
   *  xName, yName
   *  table     show the "table method" below (default true)
   *  showBars  show the PMF of Y as bars (default true)
   */
  W.mapping = function (opts) {
    const o = Object.assign({ xName: 'X', yName: 'Y', table: true, showBars: true, editable: true }, opts);
    let dist = o.dists[0].dist, gSrc = o.presets ? o.presets[0].g : o.g, gFn, res, root, stage, svgEl, left, right, layer, tableHost, barsHost, errEl, readout, flowing = false;
    const self = { mount(el) { root = el; build(); }, flow, setG, setDist, reset() { draw(); }, get result() { return res; } };

    function build() {
      Lab.clear(root);
      root.classList.add('w-map');
      const ctrls = h('div', { class: 'controls map-controls' });
      if (o.dists.length > 1) ctrls.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', html: Lab.tex(o.xName) + ' is' }), Lab.seg(o.dists.map((d, k) => ({ label: d.label, value: k })), 0, k => setDist(o.dists[k].dist))));
      if (o.presets) ctrls.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', html: Lab.tex('g(x) =') }), (self.presetSeg = Lab.seg(o.presets.map((p, k) => ({ label: Lab.tex(p.tex || prettyExpr(p.g)), value: k })), 0, k => setG(o.presets[k].g, true)))));
      root.appendChild(ctrls);
      if (o.editable) {
        const input = h('input', { class: 'field mono', value: gSrc, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'your own g(x)' });
        errEl = h('span', { class: 'xs cbad' });
        input.addEventListener('input', Lab.debounce(() => setG(input.value, false), 250));
        self.input = input;
        root.appendChild(h('div', { class: 'control map-edit' }, h('span', { class: 'lbl', text: 'Or type your own:' }), h('span', { class: 'mono-pre', html: Lab.tex('g(x)=') }), input, errEl));
      }
      stage = h('div', { class: 'map-stage' });
      root.appendChild(stage);
      readout = h('div', { class: 'ws-readout' });
      root.appendChild(readout);
      root.appendChild(h('div', { class: 'btn-row' }, Lab.button('Send the probability along the arrows', () => flow(), 'btn primary sm'), Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => draw(), 'btn ghost sm')));
      if (o.showBars) { barsHost = h('div', { class: 'map-bars' }); root.appendChild(barsHost); }
      if (o.table) { tableHost = h('div', { class: 'map-table' }); root.appendChild(tableHost); }
      compute();
      draw();
    }
    function compute() {
      try {
        gFn = compileG(gSrc, ['x']).fn;
        res = Lab.P.map(dist, x => gFn(x));
        if (res.vals.some(v => !isFinite(v))) throw new Error('g gives an undefined value somewhere');
        if (errEl) errEl.textContent = '';
        return true;
      } catch (e) { if (errEl) errEl.textContent = e.message; return false; }
    }
    function setG(src, fromPreset) {
      gSrc = src;
      if (fromPreset && self.input) self.input.value = src;
      if (!fromPreset && self.presetSeg) self.presetSeg.set(-1);
      if (compute()) draw();
    }
    function setDist(d) { dist = d; if (compute()) draw(); }

    function draw() {
      if (!res) return;
      flowing = false;
      Lab.clear(stage);
      const nL = dist.vals.length, nR = res.vals.length;
      const row = 34, padT = 30;
      const H = padT + Math.max(nL, nR) * row + 10;
      const Wd = 660;
      const xL = 150, xR = 470;
      const offL = padT + ((Math.max(nL, nR) - nL) * row) / 2;
      const offR = padT + ((Math.max(nL, nR) - nR) * row) / 2;
      const yL = k => offL + k * row + row / 2;
      const yR = k => offR + k * row + row / 2;
      const pmaxL = Math.max(...dist.p.map(Number)), pmaxR = Math.max(...res.p.map(Number));
      const barMax = 90;
      svgEl = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'map-svg', role: 'img', 'aria-label': 'mapping diagram' });
      svgEl.appendChild(svg('text', { x: xL, y: 16, 'text-anchor': 'end', class: 'map-head x' }, 'values of ' + o.xName));
      svgEl.appendChild(svg('text', { x: xR, y: 16, 'text-anchor': 'start', class: 'map-head z' }, 'values of ' + o.yName + ' = g(' + o.xName + ')'));
      const arrows = svg('g', { class: 'arrows' });
      svgEl.appendChild(arrows);
      left = dist.vals.map((x, k) => {
        const yv = yL(k);
        const g = svg('g', { class: 'map-l', dataset: { k } });
        const w = (Number(dist.p[k]) / pmaxL) * barMax;
        g.appendChild(svg('rect', { x: xL - 20 - w, y: yv - 9, width: Math.max(w, 1.5), height: 18, rx: 4, class: 'mbar x' }));
        g.appendChild(svg('text', { x: xL - 4, y: yv + 5, 'text-anchor': 'end', class: 'map-val x' }, Lab.fmtVal(x)));
        g.appendChild(svg('text', { x: xL - 26 - w, y: yv + 5, 'text-anchor': 'end', class: 'map-p' }, Lab.fmt(dist.p[k])));
        g.appendChild(svg('circle', { cx: xL + 8, cy: yv, r: 3.5, class: 'map-dot x' }));
        g.addEventListener('mouseenter', () => focus(k));
        g.addEventListener('mouseleave', () => focus(null));
        svgEl.appendChild(g);
        return { g, y: yv, bar: g.firstChild };
      });
      right = res.vals.map((z, k) => {
        const yv = yR(k);
        const g = svg('g', { class: 'map-r', dataset: { k } });
        const rect = svg('rect', { x: xR + 26, y: yv - 9, width: 1.5, height: 18, rx: 4, class: 'mbar z' });
        g.appendChild(rect);
        g.appendChild(svg('text', { x: xR + 4, y: yv + 5, 'text-anchor': 'start', class: 'map-val z' }, Lab.fmtVal(z)));
        const pt = svg('text', { x: xR + 26 + barMax + 8, y: yv + 5, 'text-anchor': 'start', class: 'map-p' }, '');
        g.appendChild(pt);
        g.appendChild(svg('circle', { cx: xR - 8, cy: yv, r: 3.5, class: 'map-dot z' }));
        svgEl.appendChild(g);
        return { g, y: yv, rect, pt, full: (Number(res.p[k]) / pmaxR) * barMax, p: res.p[k] };
      });
      // arrows
      res.groups.forEach((grp, r) => grp.from.forEach(k => {
        const y1 = left[k].y, y2 = right[r].y;
        const path = svg('path', { d: 'M' + (xL + 12) + ',' + y1 + ' C' + (xL + 120) + ',' + y1 + ' ' + (xR - 120) + ',' + y2 + ' ' + (xR - 12) + ',' + y2, class: 'map-arrow', dataset: { k, r } });
        arrows.appendChild(path);
        left[k].arrow = path; left[k].r = r;
      }));
      stage.appendChild(svgEl);
      layer = h('div', { class: 'fx-layer' });
      stage.appendChild(layer);
      readout.innerHTML = '<span class="muted">' + (res.groups.some(g => g.from.length > 1)
        ? 'Some arrows meet at the same value: this g is <b>many-to-one</b>, so those probabilities will add up.'
        : 'Every value of ' + o.xName + ' lands on a different value: this g is <b>one-to-one</b>, so probabilities move without changing.') + ' Point at a value of ' + o.xName + ' to follow its arrow.</span>';
      if (barsHost) { Lab.clear(barsHost); barsHost.appendChild(h('div', { class: 'ws-title', html: 'PMF of ' + Lab.tex(o.yName + ' = g(' + o.xName + ')') })); const b = W.bars({ dist: { vals: res.vals, p: res.p }, tone: 'z', height: 130, xName: o.yName }); const host = h('div'); barsHost.appendChild(host); b.mount(host); }
      if (tableHost) drawTable();
    }
    function focus(k) {
      left.forEach((l, i) => { l.g.classList.toggle('dim', k != null && i !== k); if (l.arrow) l.arrow.classList.toggle('hot', i === k); });
      right.forEach((r, i) => r.g.classList.toggle('dim', k != null && i !== left[k].r));
      if (k == null) return;
      const x = dist.vals[k], z = res.vals[left[k].r];
      const others = res.groups[left[k].r].from.filter(i => i !== k).map(i => Lab.fmtVal(dist.vals[i]));
      readout.innerHTML = Lab.tex(o.xName + '=' + Lab.fmtVal(x) + '\\ \\Rightarrow\\ ' + o.yName + '=g(' + Lab.fmtVal(x) + ')=' + Lab.fmtVal(z)) +
        (others.length ? '<div class="xs muted">Also landing on ' + Lab.fmtVal(z) + ': ' + o.xName + ' = ' + others.join(', ') + '.</div>' : '<div class="xs muted">No other value of ' + o.xName + ' lands on ' + Lab.fmtVal(z) + '.</div>');
    }
    async function flow() {
      if (flowing) return;
      draw();
      flowing = true;
      const acc = res.vals.map(() => F(0));
      const pmaxR = Math.max(...res.p.map(Number));
      const jobs = [];
      for (let k = 0; k < left.length; k++) {
        const r = left[k].r;
        left[k].arrow && left[k].arrow.classList.add('hot');
        const tok = h('span', { class: 'map-tok', text: Lab.fmt(dist.p[k]) });
        const from = left[k].g.querySelector('.map-dot');
        const to = right[r].g.querySelector('.map-dot');
        jobs.push(Lab.fly(from, to, layer, { ms: 900, ghost: tok, scale: 1, arc: 0, fadeOut: false }).then(() => {
          acc[r] = dist.float ? acc[r] + dist.p[k] : acc[r].add(dist.p[k]);
          right[r].rect.setAttribute('width', Math.max(1.5, (Number(acc[r]) / pmaxR) * 90));
          right[r].pt.textContent = Lab.fmt(acc[r]);
          Lab.pulse(right[r].g);
        }));
        await Lab.sleep(170);
      }
      await Promise.all(jobs);
      readout.innerHTML = 'Done. Each value of ' + o.yName + ' collected the probability of every ' + o.xName + '-value whose arrow points to it: ' + Lab.tex('P(' + o.yName + '=y)=\\sum_{x:\\,g(x)=y} P(' + o.xName + '=x)');
    }
    function drawTable() {
      Lab.clear(tableHost);
      tableHost.appendChild(h('div', { class: 'ws-title', text: 'The table method (as in the lecture)' }));
      const t1 = h('table', { class: 'tbl' });
      t1.appendChild(h('thead', {}, h('tr', {}, h('th', { html: Lab.tex('x') }), h('th', { html: Lab.tex('P(' + o.xName + '=x)') }), h('th', { html: Lab.tex('g(x)') }))));
      const b1 = h('tbody');
      dist.vals.forEach((x, k) => b1.appendChild(h('tr', {}, h('td', { html: Lab.tex(Lab.fmtVal(x)) }), h('td', { html: Lab.tex(Lab.fmtTex(dist.p[k])) }), h('td', { html: Lab.tex(Lab.fmtVal(res.vals[left[k].r])) }))));
      t1.appendChild(b1);
      const t2 = h('table', { class: 'tbl' });
      t2.appendChild(h('thead', {}, h('tr', {}, h('th', { html: Lab.tex('y') }), h('th', { text: 'x-values with g(x) = y' }), h('th', { html: Lab.tex('P(' + o.yName + '=y)') }))));
      const b2 = h('tbody');
      res.groups.forEach((grp, r) => {
        const sum = grp.from.map(k => Lab.fmtTex(dist.p[k])).join('+');
        b2.appendChild(h('tr', {}, h('td', { html: Lab.tex(Lab.fmtVal(grp.value)) }), h('td', { html: Lab.tex(grp.from.map(k => Lab.fmtVal(dist.vals[k])).join(',\\ ')) }),
          h('td', { html: Lab.tex((grp.from.length > 1 ? sum + '=' : '') + Lab.fmtTex(grp.p)) })));
      });
      t2.appendChild(b2);
      tableHost.appendChild(h('div', { class: 'map-tables' }, h('div', { class: 'tbl-wrap' }, t1), h('div', { class: 'map-arrow-big', html: Lab.icon('arrowRight') }), h('div', { class: 'tbl-wrap' }, t2)));
    }
    return self;
  };

  /**
   * W.grid2(opts) — Z = g(X, Y) on a Cartesian grid of points (x right, y up), like the lecture's star grid.
   *  J         joint table; or dx + dy (independent), or dists: [{label, J}]
   *  presets   [{label, g:'x+y', shape:'sum'|'max'|'min'|'diff'}]
   *  editable  type your own g(x, y)
   *  xName, yName, zName
   */
  W.grid2 = function (opts) {
    const o = Object.assign({ xName: 'X', yName: 'Y', zName: 'Z', editable: true, showValues: true }, opts);
    let J = o.J || (o.dists ? o.dists[0].J : Lab.P.product(o.dx, o.dy));
    let preset = o.presets ? o.presets[0] : { g: o.g };
    let gSrc = preset.g, res, root, stage, svgEl, pts = [], bars, barsHost, readout, errEl, layer, selected = null, busy = false;
    const self = { mount(el) { root = el; build(); }, select, collect, setG, setJ, reset() { select(null); }, get result() { return res; } };

    function build() {
      Lab.clear(root);
      root.classList.add('w-grid2');
      const ctrls = h('div', { class: 'controls' });
      if (o.dists && o.dists.length > 1) ctrls.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', text: 'Joint PMF:' }), Lab.seg(o.dists.map((d, k) => ({ label: d.label, value: k })), 0, k => setJ(o.dists[k].J))));
      if (o.presets) ctrls.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', html: Lab.tex(o.zName + '=') }), (self.seg = Lab.seg(o.presets.map((p, k) => ({ label: Lab.tex(p.tex || prettyExpr(p.g)), value: k })), 0, k => { preset = o.presets[k]; setG(preset.g, true); }))));
      root.appendChild(ctrls);
      if (o.editable) {
        const input = h('input', { class: 'field mono', value: gSrc, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'your own g(x, y)' });
        errEl = h('span', { class: 'xs cbad' });
        input.addEventListener('input', Lab.debounce(() => { preset = { g: input.value }; if (self.seg) self.seg.set(-1); setG(input.value, false); }, 250));
        self.input = input;
        root.appendChild(h('div', { class: 'control map-edit' }, h('span', { class: 'lbl', text: 'Or type your own:' }), h('span', { html: Lab.tex('g(x,y)=') }), input, errEl));
      }
      stage = h('div', { class: 'g2-stage' });
      root.appendChild(stage);
      readout = h('div', { class: 'ws-readout' });
      root.appendChild(readout);
      root.appendChild(h('div', { class: 'btn-row' }, Lab.button('Collect every value', () => collect(), 'btn primary sm'), Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => { select(null); draw(); }, 'btn ghost sm')));
      barsHost = h('div', { class: 'g2-bars' });
      root.appendChild(barsHost);
      compute();
      draw();
    }
    function compute() {
      try {
        const g = compileG(gSrc, ['x', 'y']).fn;
        res = Lab.P.map2(J, (x, y) => g(x, y));
        if (res.vals.some(v => !isFinite(v))) throw new Error('g gives an undefined value somewhere');
        if (errEl) errEl.textContent = '';
        return true;
      } catch (e) { if (errEl) errEl.textContent = e.message; return false; }
    }
    function setG(src, fromPreset) { gSrc = src; if (fromPreset && self.input) self.input.value = src; if (compute()) { selected = null; draw(); } }
    function setJ(nj) { J = nj; if (compute()) { selected = null; draw(); } }
    function levelOf(i, j) { return res.groups.findIndex(gr => gr.cells.some(([a, b]) => a === i && b === j)); }

    function draw() {
      Lab.clear(stage);
      const nx = J.xs.length, ny = J.ys.length;
      const step = Math.max(38, Math.min(64, 420 / Math.max(nx, ny)));
      const padL = 46, padB = 40, padT = 34, padR = 18;
      const Wd = padL + (nx - 1) * step + padR + 24, H = padT + (ny - 1) * step + padB + 12;
      const X = i => padL + 12 + i * step, Y = j => padT + 6 + (ny - 1 - j) * step;
      const pmax = Math.max(...J.p.flat().map(Number));
      svgEl = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'g2-svg', style: 'max-width:' + Wd + 'px', role: 'img', 'aria-label': 'grid of (x, y) points' });
      J.xs.forEach((x, i) => svgEl.appendChild(svg('text', { x: X(i), y: H - 14, 'text-anchor': 'middle', class: 'g2-tick x' }, Lab.fmtVal(x))));
      J.ys.forEach((y, j) => svgEl.appendChild(svg('text', { x: padL - 8, y: Y(j) + 4, 'text-anchor': 'end', class: 'g2-tick y' }, Lab.fmtVal(y))));
      svgEl.appendChild(svg('text', { x: X(nx - 1) + 18, y: H - 14, class: 'g2-axis x' }, o.xName));
      svgEl.appendChild(svg('text', { x: padL - 8, y: 14, 'text-anchor': 'end', class: 'g2-axis y' }, o.yName));
      self.contour = svg('g', { class: 'g2-contour' });
      svgEl.appendChild(self.contour);
      const nLevels = res.vals.length;
      pts = [];
      J.xs.forEach((x, i) => J.ys.forEach((y, j) => {
        const p = Number(J.p[i][j]);
        const lv = levelOf(i, j);
        const g = svg('g', { class: 'g2-pt' + (p === 0 ? ' zero' : ''), dataset: { i, j } });
        const r = p === 0 ? 3 : 5 + 11 * Math.sqrt(p / pmax);
        const c = svg('circle', { cx: X(i), cy: Y(j), r, class: 'g2-dot' });
        c.style.setProperty('--lv', (0.25 + 0.65 * (nLevels > 1 ? lv / (nLevels - 1) : 1)).toFixed(3));
        g.appendChild(c);
        if (o.showValues) g.appendChild(svg('text', { x: X(i), y: Y(j) - r - 4, 'text-anchor': 'middle', class: 'g2-g' }, Lab.fmtVal(res.vals[lv])));
        g.addEventListener('mouseenter', () => hoverPt(i, j));
        g.addEventListener('click', () => select(lv));
        svgEl.appendChild(g);
        pts.push({ g, i, j, cx: X(i), cy: Y(j), lv, dot: c });
      }));
      self.X = X; self.Y = Y; self.step = step;
      stage.appendChild(svgEl);
      layer = h('div', { class: 'fx-layer' });
      stage.appendChild(layer);
      Lab.clear(barsHost);
      barsHost.appendChild(h('div', { class: 'ws-title', html: 'PMF of ' + Lab.tex(o.zName + '=g(' + o.xName + ',' + o.yName + ')') + ' <span class="muted">— tap a bar to see where it comes from</span>' }));
      const host = h('div');
      barsHost.appendChild(host);
      // show counts over a common denominator (e.g. 9/36 for dice) when it is small
      const lcm = (a, b) => (a / Lab.math.gcd(a, b)) * b;
      const flat = J.p.flat().filter(v => v instanceof Lab.Frac && !v.approx);
      let den = flat.length === J.p.flat().length ? flat.reduce((m, v) => lcm(m, v.d), 1) : null;
      if (o.den === false || (den && den > 400) || den === 1) den = null;
      if (o.den) den = o.den;
      bars = W.bars({ dist: { vals: res.vals, p: res.p }, tone: 'z', height: 140, xName: o.zName, onPick: k => select(k), den });
      bars.mount(host);
      readout.innerHTML = '<span class="muted">Each dot is a pair ' + Lab.tex('(x,y)') + '; its size shows ' + Lab.tex('f_{' + o.xName + o.yName + '}(x,y)') + ' and the number above it is ' + Lab.tex('g(x,y)') + '. Tap a dot or a bar.</span>';
      if (selected != null) select(selected);
    }
    function hoverPt(i, j) {
      if (selected != null) return;
      const x = J.xs[i], y = J.ys[j], lv = levelOf(i, j);
      readout.innerHTML = Lab.tex('(x,y)=(' + Lab.fmtVal(x) + ',' + Lab.fmtVal(y) + '):\\quad f_{' + o.xName + o.yName + '}=' + Lab.fmtTex(J.p[i][j]) + ',\\quad g(x,y)=' + Lab.fmtVal(res.vals[lv]));
    }
    function drawContour(lv) {
      Lab.clear(self.contour);
      if (lv == null) return;
      const cells = res.groups[lv].cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      if (cells.length < 2) return;
      const shape = preset && preset.shape;
      let order = cells;
      if (shape === 'max') { // L: up the right edge then along the top: points with x = z (y increasing) and y = z
        order = cells.slice().sort((a, b) => (a[1] - b[1]) || (a[0] - b[0]));
        const z = res.vals[lv];
        const vert = cells.filter(([i]) => Lab.sameVal(J.xs[i], z)).sort((a, b) => a[1] - b[1]);
        const horiz = cells.filter(([i, j]) => Lab.sameVal(J.ys[j], z) && !Lab.sameVal(J.xs[i], z)).sort((a, b) => b[0] - a[0]);
        order = vert.concat(horiz);
      } else if (shape === 'min') {
        const z = res.vals[lv];
        const vert = cells.filter(([i]) => Lab.sameVal(J.xs[i], z)).sort((a, b) => b[1] - a[1]);
        const horiz = cells.filter(([i, j]) => Lab.sameVal(J.ys[j], z) && !Lab.sameVal(J.xs[i], z)).sort((a, b) => a[0] - b[0]);
        order = vert.concat(horiz);
      } else if (shape !== 'sum' && shape !== 'diff') {
        cells.forEach(([i, j]) => self.contour.appendChild(svg('circle', { cx: self.X(i), cy: self.Y(j), r: self.step * 0.42, class: 'g2-halo' })));
        return;
      }
      const d = order.map(([i, j], k) => (k ? 'L' : 'M') + self.X(i) + ',' + self.Y(j)).join(' ');
      self.contour.appendChild(svg('path', { d, class: 'g2-line' }));
    }
    function select(lv) {
      selected = lv;
      pts.forEach(p => { p.g.classList.toggle('on', lv != null && p.lv === lv); p.g.classList.toggle('dim', lv != null && p.lv !== lv); });
      if (bars) { bars.clearHighlight(); if (lv != null) bars.highlight([lv]); }
      drawContour(lv);
      if (lv == null) { readout.innerHTML = '<span class="muted">Tap a dot or a bar.</span>'; return; }
      const grp = res.groups[lv];
      const z = grp.value;
      const terms = grp.cells.map(([i, j]) => 'f_{' + o.xName + o.yName + '}(' + Lab.fmtVal(J.xs[i]) + ',' + Lab.fmtVal(J.ys[j]) + ')');
      const nums = grp.cells.map(([i, j]) => Lab.fmtTex(J.p[i][j]));
      readout.innerHTML = '<div>' + Lab.tex('P(' + o.zName + '=' + Lab.fmtVal(z) + ') = ' + (terms.length > 5 ? '\\sum_{g(x,y)=' + Lab.fmtVal(z) + '} f_{' + o.xName + o.yName + '}(x,y)' : terms.join('+'))) + '</div>' +
        '<div>' + Lab.tex('= ' + (nums.length > 1 ? nums.join('+') + ' = ' : '') + Lab.fmtTex(grp.p)) + '</div>' +
        '<div class="xs muted">' + grp.cells.length + ' point' + (grp.cells.length > 1 ? 's' : '') + ' with ' + Lab.tex('g(x,y)=' + Lab.fmtVal(z)) + '.</div>';
    }
    async function collect() {
      if (busy) return; busy = true;
      try {
        const acc = res.vals.map(() => F(0));
        await bars.set({ vals: res.vals, p: acc }, { animate: false });
        for (let lv = 0; lv < res.vals.length; lv++) {
          select(lv);
          const grp = res.groups[lv];
          const target = bars.bar(lv);
          const jobs = grp.cells.map(([i, j], k) => Lab.sleep(k * 60).then(() => {
            const p = pts.find(q => q.i === i && q.j === j);
            return Lab.fly(p.dot, target, layer, { ms: 600, scale: 0.6, ghost: h('span', { class: 'g2-tok' }) });
          }));
          await Promise.all(jobs);
          acc[lv] = grp.p;
          await bars.set({ vals: res.vals, p: acc.map((v, k) => (k <= lv ? res.p[k] : F(0))) }, { animate: true, ms: 280 });
          await Lab.sleep(220);
        }
        select(null);
      } finally { busy = false; }
    }
    return self;
  };
})();
