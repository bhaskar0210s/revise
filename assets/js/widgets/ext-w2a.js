/* Revise — widgets for Week 2, lessons L2.1–L2.5 (independence, functions of one random variable).
   W.indepCheck  joint table next to the product table f_X(t1) f_Y(t2); check cells one by one
   W.stemMorph   the lecture's stem plots: PMF of X on top, PMF of Y = g(X) below; stems slide and stack
   W.graphG      graph of g on the values of X with a horizontal line: how many x give the same y */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const W = (Lab.W = Lab.W || {});
  const tn = n => String(n).replace(/(\d+)$/, '_{$1}');

  function compileG(g, vars) {
    if (typeof g === 'function') return g;
    const f = Lab.expr.compile(g);
    return (...a) => { const env = {}; vars.forEach((v, k) => (env[v] = a[k])); return f(env); };
  }
  function texOfExpr(src) {
    let s = String(src).replace(/\s+/g, '');
    s = s.replace(/\*/g, '\\cdot ').replace(/\^(\d+|\w)/g, '^{$1}');
    s = s.replace(/max\(/g, '\\max(').replace(/min\(/g, '\\min(').replace(/abs\(([^()]*)\)/g, '|$1|');
    s = s.replace(/\bmod\(([^,]+),([^)]+)\)/g, '$1 \\bmod $2');
    return s;
  }

  /* ------------------------------------------------------------------ indepCheck */
  /**
   * W.indepCheck({J, x, y, masked, clickable, buttons})
   * Left: the joint PMF with its marginals. Right: the table the marginals would give if X and Y were
   * independent, f_X(t1) f_Y(t2). Checking a cell compares the two and marks it ✓ or ✗.
   * API: checkCell(i, j, {animate}), checkAll({animate}), reset(), setJ(J), result
   */
  W.indepCheck = function (opts) {
    const o = Object.assign({ masked: true, clickable: true, buttons: true }, opts);
    o.x = Object.assign({ name: 'X' }, o.x);
    o.y = Object.assign({ name: 'Y' }, o.y);
    let J = o.J, root, left, right, readout, verdict, res, done;
    const xn = () => tn(o.x.name), yn = () => tn(o.y.name);
    const self = {
      mount(el) { root = el; build(); },
      checkCell, checkAll, reset() { build(); }, setJ(nj) { J = nj; if (root) build(); },
      get result() { return res; }, left: () => left, right: () => right,
    };
    function build() {
      Lab.clear(root);
      root.classList.add('w-indep');
      res = Lab.P.independence(J);
      done = J.xs.map(() => J.ys.map(() => null));
      const L = h('div', { class: 'ic-side' }), R = h('div', { class: 'ic-side' });
      L.appendChild(h('div', { class: 'ws-title', html: 'The joint PMF ' + Lab.tex('f_{' + xn() + yn() + '}(t_1,t_2)') }));
      R.appendChild(h('div', { class: 'ws-title', html: 'If independent, each cell would be ' + Lab.tex('f_{' + xn() + '}(t_1)\\,f_{' + yn() + '}(t_2)') }));
      const lh = h('div'), rh = h('div');
      L.appendChild(lh); R.appendChild(rh);
      root.appendChild(h('div', { class: 'ic-pair' }, L, R));
      left = W.joint({ J, x: o.x, y: o.y, margins: 'shown', caption: false, hover: false, sum: false });
      right = W.joint({ J: res.prod, x: o.x, y: o.y, margins: 'shown', caption: false, hover: false, sum: false, masked: o.masked });
      left.mount(lh);
      right.mount(rh);
      if (o.clickable) {
        J.xs.forEach((_, i) => J.ys.forEach((_, j) => {
          [left.cell(i, j), right.cell(i, j)].forEach(c => {
            c.classList.add('ic-click');
            c.addEventListener('click', () => checkCell(i, j));
          });
        }));
      }
      readout = h('div', { class: 'ws-readout ic-readout' });
      root.appendChild(readout);
      if (o.buttons) {
        root.appendChild(h('div', { class: 'btn-row' },
          Lab.button('Check every cell', () => checkAll(), 'btn primary sm'),
          Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => build(), 'btn ghost sm')));
      }
      verdict = h('div', { class: 'ic-verdict' });
      root.appendChild(verdict);
      readout.innerHTML = '<span class="muted">' + (o.clickable ? 'Tap any cell to compare it with (its column total) × (its row total).' : 'Each check compares a cell with (its column total) × (its row total).') + '</span>';
      paintVerdict();
    }
    function line(i, j) {
      const a = J.p[i][j], b = res.mx.p[i], c = res.my.p[j], d = res.prod.p[i][j];
      const ok = a.eq(d);
      const t1 = Lab.fmtVal(J.xs[i]), t2 = Lab.fmtVal(J.ys[j]);
      let html = '<div>' + Lab.tex('f_{' + xn() + yn() + '}(' + t1 + ',' + t2 + ') = ' + a.tex()) + '</div>' +
        '<div>' + Lab.tex('f_{' + xn() + '}(' + t1 + ')\\,f_{' + yn() + '}(' + t2 + ') = ' + b.tex() + '\\times' + c.tex() + ' = ' + d.tex()) + '</div>' +
        '<div>' + (ok ? '<b class="cgood">✓ Equal</b> — this cell passes.' : '<b class="cbad">✗ Not equal</b> (' + Lab.tex(a.tex() + '\\neq' + d.tex()) + ') — this cell fails, so ' + Lab.tex(xn()) + ' and ' + Lab.tex(yn()) + ' are dependent.') + '</div>';
      if (!ok && a.isZero()) html += '<div class="xs muted">A zero cell whose column and row totals are both above 0: each value can happen on its own, but never together. That is the quick sign of dependence.</div>';
      return { ok, html };
    }
    function checkCell(i, j, opt = {}) {
      const { ok, html } = line(i, j);
      done[i][j] = ok;
      [left, right].forEach(w => { w.unmark('pick'); const c = w.cell(i, j); c.classList.remove('good', 'bad'); });
      right.revealCell(i, j, { animate: opt.animate !== false });
      left.mark([[i, j]], ok ? 'good' : 'bad');
      right.mark([[i, j]], ok ? 'good' : 'bad');
      left.mark([[i, j]], 'pick'); right.mark([[i, j]], 'pick');
      readout.innerHTML = html;
      paintVerdict();
      return ok;
    }
    async function checkAll(opt = {}) {
      const animate = opt.animate !== false;
      const n = J.xs.length * J.ys.length;
      for (let j = 0; j < J.ys.length; j++) {
        for (let i = 0; i < J.xs.length; i++) {
          checkCell(i, j, { animate });
          if (animate) await Lab.sleep(n > 12 ? 60 : 170);
        }
      }
      left.unmark('pick'); right.unmark('pick');
      const bad = [];
      J.xs.forEach((_, i) => J.ys.forEach((_, j) => { if (done[i][j] === false) bad.push([i, j]); }));
      if (bad.length) {
        const [i, j] = bad[0];
        readout.innerHTML = line(i, j).html;
        left.mark([[i, j]], 'pick'); right.mark([[i, j]], 'pick');
      } else {
        readout.innerHTML = 'Every cell equals the product of its two marginals.';
      }
      paintVerdict();
    }
    function paintVerdict() {
      const all = done.flat();
      const n = all.length, checked = all.filter(v => v !== null).length, bad = all.filter(v => v === false).length;
      if (bad > 0) verdict.innerHTML = '<b class="cbad">Dependent.</b> ' + (bad === 1 ? '1 cell fails' : bad + ' cells fail') + ' the product rule. One failing cell is already enough to prove dependence.';
      else if (checked === n) verdict.innerHTML = '<b class="cgood">Independent.</b> All ' + n + ' cells equal the product of their marginals — and to prove independence, all of them had to.';
      else if (checked > 0) verdict.innerHTML = '<span class="muted">' + checked + ' of ' + n + ' cells checked, all equal so far. Independence needs every cell to pass.</span>';
      else verdict.innerHTML = '';
    }
    return self;
  };

  /* ------------------------------------------------------------------ stemMorph */
  /**
   * W.stemMorph({dists:[{label, dist}], presets:[{label, g, tex}], editable, xName, yName})
   * Top: stem plot of X. Bottom: stem plot of Y = g(X) on its own axis. "Apply g" slides every stem
   * to its new value; stems that land on the same value stack (their probabilities add).
   * API: apply({animate}), showResult(), setG(src), setDist(d), reset()
   */
  W.stemMorph = function (opts) {
    const o = Object.assign({ xName: 'X', yName: 'Y', editable: false }, opts);
    let entry = o.dists[0], dist = entry.dist, gSrc = o.presets ? o.presets[0].g : o.g, gFn, res, root, stage, svgEl, readout, errEl, layerG, state = 'before', busy = false, runId = 0;
    const fmtP = p => { if (entry.den && p instanceof Lab.Frac && !p.approx) { const c = p.over(entry.den); if (c) return c.n + '/' + c.d; } return Lab.fmt(p); };
    const texP = p => { if (entry.den && p instanceof Lab.Frac && !p.approx) { const c = p.over(entry.den); if (c) return '\\tfrac{' + c.n + '}{' + c.d + '}'; } return Lab.fmtTex(p); };
    const self = { mount(el) { root = el; build(); }, apply, showResult, setG, setDist, reset() { state = 'before'; draw(); }, get result() { return res; } };
    const Wd = 680, H = 420, padL = 44, padR = 24;
    const yA = 158, yB = 392, hMax = 112, strip = 212;

    function build() {
      Lab.clear(root);
      root.classList.add('w-stem');
      const ctr = h('div', { class: 'controls' });
      if (o.dists.length > 1) ctr.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', html: Lab.tex(o.xName) + ' is' }), (self.dseg = Lab.seg(o.dists.map((d, k) => ({ label: d.label, value: k })), 0, k => setDist(o.dists[k])))));
      if (o.presets && o.presets.length > 1) ctr.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', html: Lab.tex('g(x)=') }), (self.seg = Lab.seg(o.presets.map((p, k) => ({ label: Lab.tex(p.tex || texOfExpr(p.g)), value: k })), 0, k => setG(o.presets[k].g, true)))));
      if (ctr.childNodes.length) root.appendChild(ctr);
      if (o.editable) {
        const input = h('input', { class: 'field mono', value: gSrc, spellcheck: 'false', autocomplete: 'off', 'aria-label': 'your own g(x)' });
        errEl = h('span', { class: 'xs cbad' });
        input.addEventListener('input', Lab.debounce(() => { if (self.seg) self.seg.set(-1); setG(input.value, false); }, 250));
        self.input = input;
        root.appendChild(h('div', { class: 'control map-edit' }, h('span', { class: 'lbl', text: 'Or type your own:' }), h('span', { html: Lab.tex('g(x)=') }), input, errEl));
      }
      stage = h('div', { class: 'stem-stage' });
      root.appendChild(stage);
      readout = h('div', { class: 'ws-readout' });
      root.appendChild(readout);
      root.appendChild(h('div', { class: 'btn-row' },
        Lab.button('Apply g: move the stems', () => apply(), 'btn primary sm'),
        Lab.button('Show the result', () => showResult(), 'btn sm'),
        Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => { state = 'before'; draw(); }, 'btn ghost sm')));
      compute();
      draw();
    }
    function compute() {
      try {
        gFn = compileG(gSrc, ['x']);
        res = Lab.P.map(dist, x => gFn(x));
        if (res.vals.some(v => !isFinite(v))) throw new Error('g gives an undefined value for some x');
        if (errEl) errEl.textContent = '';
        return true;
      } catch (e) { if (errEl) errEl.textContent = e.message; return false; }
    }
    function setG(src, fromPreset) {
      gSrc = src;
      if (self.input) self.input.value = src;
      if (self.seg && o.presets) self.seg.set(o.presets.findIndex(p => p.g === src));
      if (compute()) { state = 'before'; draw(); }
    }
    /** d: one of o.dists (or its index), or a bare distribution */
    function setDist(d) {
      if (typeof d === 'number') d = o.dists[d];
      const k = o.dists.indexOf(d);
      entry = k >= 0 ? d : { dist: d.dist || d, den: d.den };
      dist = entry.dist;
      if (self.dseg) self.dseg.set(k);
      if (compute()) { state = 'before'; draw(); }
    }

    function scale(vals) {
      const lo = Math.min(...vals), hi = Math.max(...vals);
      if (lo === hi) return v => (padL + Wd - padR) / 2;
      const pad = (hi - lo) * 0.04;
      return v => padL + ((v - lo + pad) / (hi - lo + 2 * pad)) * (Wd - padL - padR);
    }
    function labels(g, positions, y, cls) {
      // value labels under an axis, skipping ones that would overlap
      let last = -1e9;
      positions.forEach(([x, text]) => {
        const wpx = String(text).length * 7 + 6;
        if (x - last < wpx) return;
        g.appendChild(svg('text', { x, y, 'text-anchor': 'middle', class: 'stem-tick ' + cls }, String(text).replace(/^-/, '−')));
        last = x;
      });
    }
    function draw() {
      runId++;
      busy = false;
      Lab.clear(stage);
      if (!res) return;
      const xv = dist.vals.map(Number), yv = res.vals.map(Number);
      const sx = scale(xv), sy = scale(yv);
      const pmax = Math.max(...dist.p.map(Number), ...res.p.map(Number));
      const ht = p => (Number(p) / pmax) * hMax;
      svgEl = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'stem-svg', role: 'img', 'aria-label': 'stem plots of X and of g(X)' });
      svgEl.appendChild(svg('text', { x: padL - 30, y: 22, class: 'stem-head x' }, 'PMF of ' + o.xName));
      svgEl.appendChild(svg('text', { x: padL - 30, y: strip + 32, class: 'stem-head z' }, 'PMF of ' + o.yName + ' = g(' + o.xName + ')'));
      // axes
      svgEl.appendChild(svg('line', { x1: padL - 10, x2: Wd - padR + 10, y1: yA, y2: yA, class: 'stem-axis' }));
      svgEl.appendChild(svg('line', { x1: padL - 10, x2: Wd - padR + 10, y1: yB, y2: yB, class: 'stem-axis' }));
      // links from each x to where g(x) lands
      const links = svg('g', { class: 'stem-links' });
      dist.vals.forEach((x, k) => {
        const y = Number(gFn(x));
        links.appendChild(svg('path', { d: 'M' + sx(Number(x)) + ',' + (yA + 20) + ' C' + sx(Number(x)) + ',' + (yA + 46) + ' ' + sy(y) + ',' + (strip - 26) + ' ' + sy(y) + ',' + strip, class: 'stem-link', dataset: { k } }));
      });
      svgEl.appendChild(links);
      svgEl.appendChild(svg('line', { x1: padL - 10, x2: Wd - padR + 10, y1: strip, y2: strip, class: 'stem-strip' }));
      yv.forEach(y => svgEl.appendChild(svg('circle', { cx: sy(y), cy: strip, r: 2.6, class: 'stem-land' })));
      // top stems
      const tops = dist.vals.map((x, k) => {
        const g = svg('g', { class: 'stem x', dataset: { k } });
        const hh = ht(dist.p[k]);
        g.appendChild(svg('rect', { x: sx(Number(x)) - 3.5, y: yA - hh, width: 7, height: Math.max(hh, 0.5), rx: 3, class: 'stem-bar x' }));
        g.appendChild(svg('title', {}, o.xName + ' = ' + Lab.fmtVal(x) + ': probability ' + fmtP(dist.p[k])));
        g.addEventListener('mouseenter', () => hoverX(k));
        svgEl.appendChild(g);
        return g;
      });
      const xl = svg('g', {});
      labels(xl, dist.vals.map(x => [sx(Number(x)), Lab.fmtVal(x)]), yA + 16, 'x');
      svgEl.appendChild(xl);
      const yl = svg('g', {});
      labels(yl, res.vals.map(y => [sy(Number(y)), Lab.fmtVal(y)]), yB + 16, 'z');
      svgEl.appendChild(yl);
      // bottom stems (result), drawn as stacked segments
      layerG = svg('g', { class: 'stem-result' });
      svgEl.appendChild(layerG);
      self.geom = { sx, sy, ht, tops };
      if (state === 'after') drawResult(true);
      stage.appendChild(svgEl);
      const many = res.groups.some(g => g.from.length > 1);
      readout.innerHTML = '<span class="muted">' + (many
        ? 'Some links end at the same point: this g is <b>many-to-one</b>. Those stems will stack — their probabilities add.'
        : 'Every link ends at a different point: this g is <b>one-to-one</b>. Each stem keeps its height; only its position (its label) changes.') +
        ' Press <b>Apply g</b>.</span>';
    }
    function drawResult(withLabels) {
      Lab.clear(layerG);
      const { sy, ht } = self.geom;
      res.groups.forEach((grp, r) => {
        let base = yB;
        grp.from.forEach((k, q) => {
          const hh = ht(dist.p[k]);
          layerG.appendChild(svg('rect', { x: sy(grp.value) - 3.5, y: base - hh, width: 7, height: Math.max(hh, 0.5), rx: 2, class: 'stem-bar z' + (q % 2 ? ' alt' : '') }));
          base -= hh;
        });
        const g = svg('rect', { x: sy(grp.value) - 9, y: base - 4, width: 18, height: yB - base + 4, class: 'stem-hit', dataset: { r } });
        g.appendChild(svg('title', {}, o.yName + ' = ' + Lab.fmtVal(grp.value) + ': probability ' + fmtP(grp.p)));
        g.addEventListener('mouseenter', () => hoverY(r));
        layerG.appendChild(g);
      });
      if (withLabels !== false) {
        let last = -1e9;
        res.groups.forEach(grp => {
          const x = sy(grp.value);
          const text = fmtP(grp.p);
          if (x - last < text.length * 6.5 + 10) return;
          const top = yB - ht(grp.p);
          layerG.appendChild(svg('text', { x, y: top - 7, 'text-anchor': 'middle', class: 'stem-p' }, text));
          last = x;
        });
      }
    }
    function hoverX(k) {
      if (busy) return;
      const x = dist.vals[k], y = gFn(x);
      Lab.$$('.stem-link', svgEl).forEach(p => p.classList.toggle('hot', Number(p.dataset.k) === k));
      readout.innerHTML = Lab.tex(o.xName + '=' + Lab.fmtVal(x) + '\\ \\Rightarrow\\ ' + o.yName + '=g(' + Lab.fmtVal(x) + ')=' + Lab.fmtVal(Lab.expr.num(y))) + ' &nbsp; <span class="muted">carries probability</span> ' + Lab.tex(texP(dist.p[k]));
    }
    function hoverY(r) {
      if (busy) return;
      const grp = res.groups[r];
      Lab.$$('.stem-link', svgEl).forEach(p => p.classList.toggle('hot', grp.from.includes(Number(p.dataset.k))));
      const parts = grp.from.map(k => 'P(' + o.xName + '=' + Lab.fmtVal(dist.vals[k]) + ')');
      const nums = grp.from.map(k => texP(dist.p[k]));
      readout.innerHTML = Lab.tex('P(' + o.yName + '=' + Lab.fmtVal(grp.value) + ') = ' + parts.join('+') + (grp.from.length > 1 ? ' = ' + nums.join('+') : '') + ' = ' + texP(grp.p));
    }
    async function apply(opt = {}) {
      if (busy) return;
      state = 'before';
      draw();
      busy = true;
      const my = runId;
      const animate = opt.animate !== false && !Lab.reducedMotion();
      const { sx, sy, ht, tops } = self.geom;
      if (!animate) { busy = false; showResult(); return; }
      const stacks = {};
      const jobs = [];
      for (let k = 0; k < dist.vals.length; k++) {
        if (my !== runId) return;
        const x = Number(dist.vals[k]);
        const y = Number(gFn(dist.vals[k]));
        const key = String(y);
        const off = stacks[key] || 0;
        const hh = ht(dist.p[k]);
        stacks[key] = off + hh;
        const piece = svg('rect', { x: sx(x) - 3.5, y: yA - hh, width: 7, height: Math.max(hh, 0.5), rx: 2, class: 'stem-bar moving' });
        svgEl.appendChild(piece);
        tops[k].classList.add('gone');
        Lab.$$('.stem-link', svgEl).forEach(p => { if (Number(p.dataset.k) === k) p.classList.add('hot'); });
        const dx = sy(y) - sx(x), dy = (yB - off) - yA;
        jobs.push(Lab.tween(900, t => piece.setAttribute('transform', 'translate(' + (dx * t).toFixed(2) + ',' + (dy * t).toFixed(2) + ')'), Lab.ease.inOut).then(() => {
          piece.classList.remove('moving');
          piece.classList.add('landed');
        }));
        await Lab.sleep(dist.vals.length > 14 ? 50 : 140);
      }
      await Promise.all(jobs);
      if (my !== runId) return;
      Lab.$$('.stem-bar.landed', svgEl).forEach(p => p.remove());
      busy = false;
      state = 'after';
      drawResult(true);
      Lab.$$('.stem-link', svgEl).forEach(p => p.classList.remove('hot'));
      tops.forEach(t => t.classList.remove('gone'));
      readout.innerHTML = 'Done. Each value ' + Lab.tex('y') + ' collected the stems of every ' + Lab.tex('x') + ' with ' + Lab.tex('g(x)=y') + ': ' + Lab.tex('P(' + o.yName + '=y)=\\sum_{x:\\,g(x)=y}P(' + o.xName + '=x)') + '. Point at a stem to read it.';
    }
    function showResult() {
      if (busy) return;
      state = 'after';
      draw();
      readout.innerHTML = 'Point at a stem of ' + Lab.tex(o.yName) + ' to see which values of ' + Lab.tex(o.xName) + ' it came from.';
    }
    return self;
  };

  /* ------------------------------------------------------------------ graphG */
  /**
   * W.graphG({dist, presets:[{label, g, tex}], xName, yName, level})
   * The points (x, g(x)) for every value x of X, joined by a faint curve, plus a horizontal line
   * at a chosen output value. The x's on the line are exactly the x's that give that output.
   */
  W.graphG = function (opts) {
    const o = Object.assign({ xName: 'X', yName: 'Y' }, opts);
    let dist = o.dist, gSrc = o.presets ? o.presets[0].g : o.g, res, gFn, level = null, root, host, readout, levelHost;
    const self = { mount(el) { root = el; build(); }, setLevel(v) { level = v; draw(); }, reset() { level = null; draw(); } };
    function build() {
      Lab.clear(root);
      root.classList.add('w-graphg');
      if (o.presets && o.presets.length > 1) root.appendChild(h('div', { class: 'controls' }, h('div', { class: 'control' }, h('span', { class: 'lbl', html: Lab.tex('g(x)=') }), Lab.seg(o.presets.map((p, k) => ({ label: Lab.tex(p.tex || texOfExpr(p.g)), value: k })), 0, k => { gSrc = o.presets[k].g; level = null; compute(); draw(); }))));
      host = h('div', { class: 'gg-stage' });
      root.appendChild(host);
      levelHost = h('div', { class: 'control gg-levels' });
      root.appendChild(levelHost);
      readout = h('div', { class: 'ws-readout' });
      root.appendChild(readout);
      compute();
      if (o.level != null) level = o.level;
      draw();
    }
    function compute() {
      gFn = compileG(gSrc, ['x']);
      res = Lab.P.map(dist, x => gFn(x));
    }
    function draw() {
      Lab.clear(host);
      const xs = dist.vals.map(Number), ys = xs.map(x => Number(Lab.expr.num(gFn(x))));
      if (level != null && !res.vals.some(v => Lab.sameVal(v, level))) level = null; // e.g. after g changed
      const Wd = 600, H = 284, padL = 52, padR = 20, padT = 30, padB = 34;
      const xlo = Math.min(...xs), xhi = Math.max(...xs), ylo = Math.min(...ys), yhi = Math.max(...ys);
      const X = v => padL + (xhi === xlo ? 0.5 : (v - xlo) / (xhi - xlo)) * (Wd - padL - padR);
      const Y = v => padT + (1 - (yhi === ylo ? 0.5 : (v - ylo) / (yhi - ylo))) * (H - padT - padB);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'gg-svg', role: 'img', 'aria-label': 'graph of g' });
      s.appendChild(svg('line', { x1: padL - 8, x2: Wd - padR + 6, y1: H - padB + 8, y2: H - padB + 8, class: 'stem-axis' }));
      s.appendChild(svg('line', { x1: padL - 8, x2: padL - 8, y1: padT - 6, y2: H - padB + 8, class: 'stem-axis' }));
      // ticks
      let last = -1e9;
      xs.forEach(x => { const px = X(x); if (px - last < 22) return; s.appendChild(svg('text', { x: px, y: H - 8, 'text-anchor': 'middle', class: 'stem-tick x' }, Lab.fmtVal(x))); last = px; });
      let lastY = 1e9;
      res.vals.slice().sort((a, b) => a - b).forEach(v => { const py = Y(Number(v)); if (lastY - py < 14) return; s.appendChild(svg('text', { x: padL - 14, y: py + 4, 'text-anchor': 'end', class: 'stem-tick z' }, Lab.fmtVal(v))); lastY = py; });
      s.appendChild(svg('text', { x: Wd - padR, y: H - padB - 2, 'text-anchor': 'end', class: 'gg-axis x' }, 'x'));
      s.appendChild(svg('text', { x: padL - 8, y: 13, class: 'gg-axis z' }, 'g(x)'));
      // faint curve
      s.appendChild(svg('path', { d: xs.map((x, k) => (k ? 'L' : 'M') + X(x) + ',' + Y(ys[k])).join(' '), class: 'gg-curve' }));
      if (level != null) {
        s.appendChild(svg('line', { x1: padL - 8, x2: Wd - padR + 6, y1: Y(Number(level)), y2: Y(Number(level)), class: 'gg-level' }));
      }
      xs.forEach((x, k) => {
        const on = level != null && Lab.sameVal(ys[k], level);
        const c = svg('circle', { cx: X(x), cy: Y(ys[k]), r: on ? 7 : 5, class: 'gg-pt' + (on ? ' on' : '') + (level != null && !on ? ' dim' : '') });
        c.appendChild(svg('title', {}, 'x = ' + Lab.fmtVal(x) + ', g(x) = ' + Lab.fmtVal(ys[k])));
        c.addEventListener('click', () => { level = ys[k]; draw(); });
        s.appendChild(c);
      });
      host.appendChild(s);
      // level chooser
      Lab.clear(levelHost);
      levelHost.appendChild(h('span', { class: 'lbl', text: 'Draw the line at y =' }));
      const seg = Lab.seg(res.vals.map(v => ({ label: Lab.fmtVal(v), value: v })), level, v => { level = v; draw(); });
      levelHost.appendChild(seg);
      // readout
      if (level == null) { readout.innerHTML = '<span class="muted">Pick a value of y (or tap a point) to draw a horizontal line at that height.</span>'; return; }
      const grp = res.groups.find(g => Lab.sameVal(g.value, level));
      const xsOn = grp.from.map(k => Lab.fmtVal(dist.vals[k]));
      const terms = grp.from.map(k => 'P(' + o.xName + '=' + Lab.fmtVal(dist.vals[k]) + ')');
      const nums = grp.from.map(k => Lab.fmtTex(dist.p[k]));
      readout.innerHTML = 'The line ' + Lab.tex('y=' + Lab.fmtVal(level)) + ' meets the points at ' + Lab.tex('x=' + xsOn.join(',\\ ')) + ' — ' +
        (grp.from.length === 1 ? 'only <b>one</b> value of ' + o.xName + '.' : '<b>' + grp.from.length + '</b> values of ' + o.xName + '.') +
        '<div>' + Lab.tex('P(' + o.yName + '=' + Lab.fmtVal(level) + ')=' + terms.join('+') + (grp.from.length > 1 ? '=' + nums.join('+') : '') + '=' + Lab.fmtTex(grp.p)) + '</div>';
    }
    return self;
  };
})();
