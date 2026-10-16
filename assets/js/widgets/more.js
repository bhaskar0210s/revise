/* Revise — more widgets:
   W.mosaic   independence as area: columns sized by P(X=x), split by P(Y=y | X=x)
   W.slices   a joint PMF of three variables as one table per value of Z; sum or pick slices
   W.rows     the lecture's "list of tuples" view of a joint PMF, with marginalising / conditioning
   W.events   sample space grid with events A and B (conditional probability by zooming)
   W.tree     two-stage probability tree
   W.editJoint an editable joint table (weights → probabilities) for free play */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const W = (Lab.W = Lab.W || {});
  const tn = n => n.replace(/(\d+)$/, '_{$1}');

  /* ------------------------------------------------------------- mosaic */
  /**
   * W.mosaic({J, x, y, compare: true})
   * Unit square. Column widths = f_X(x). Inside each column the pieces are f_{Y|X=x}(y).
   * If X and Y are independent, every column is cut at the same heights.
   */
  W.mosaic = function (opts) {
    const o = Object.assign({ showProduct: false }, opts);
    o.x = Object.assign({ name: 'X' }, o.x); o.y = Object.assign({ name: 'Y' }, o.y);
    let J = o.J, root, host, info, mode = 'actual';
    const self = { mount(el) { root = el; build(); }, setJ(nj) { J = nj; draw(); }, setMode(m) { mode = m; draw(); }, reset() { mode = 'actual'; draw(); } };
    function build() {
      Lab.clear(root);
      root.classList.add('w-mosaic');
      if (o.toggle !== false) root.appendChild(h('div', { class: 'controls' }, Lab.seg([{ label: 'Actual joint PMF', value: 'actual' }, { label: 'If independent: ' + Lab.tex('f_' + tn(o.x.name) + '\\,f_' + tn(o.y.name)), value: 'product' }], mode, m => { mode = m; draw(); })));
      host = h('div', { class: 'mo-host' });
      root.appendChild(host);
      info = h('div', { class: 'ws-readout' });
      root.appendChild(info);
      draw();
    }
    function draw() {
      Lab.clear(host);
      const ind = Lab.P.independence(J);
      const T = mode === 'product' ? ind.prod : J;
      const mx = Lab.P.margX(T);
      const Wd = 520, H = 300, padL = 40, padB = 46, padT = 8;
      const s = svg('svg', { viewBox: '0 0 ' + (Wd + padL + 70) + ' ' + (H + padB + padT), class: 'mo-svg', role: 'img', 'aria-label': 'mosaic plot' });
      let x0 = padL;
      const colors = ['--y', '--y-2', '--y-3', '--y-4', '--y-5', '--y-6'];
      T.xs.forEach((xv, i) => {
        const w = Number(mx.p[i]) * Wd;
        const colTot = Number(mx.p[i]);
        let y0 = padT + H;
        T.ys.forEach((yv, j) => {
          const hh = colTot ? (Number(T.p[i][j]) / colTot) * H : 0;
          y0 -= hh;
          if (hh > 0 && w > 0) {
            const r = svg('rect', { x: x0 + 1, y: y0 + 1, width: Math.max(0, w - 2), height: Math.max(0, hh - 2), rx: 4, class: 'mo-cell lv' + (j % 6) });
            const tip = svg('title', {}, 'X=' + Lab.fmtVal(xv) + ', Y=' + Lab.fmtVal(yv) + ': P = ' + Lab.fmt(T.p[i][j]) + ', P(Y=' + Lab.fmtVal(yv) + ' | X=' + Lab.fmtVal(xv) + ') = ' + Lab.fmt(F(T.p[i][j]).div(mx.p[i])));
            r.appendChild(tip);
            s.appendChild(r);
            if (w > 34 && hh > 18) s.appendChild(svg('text', { x: x0 + w / 2, y: y0 + hh / 2 + 4, 'text-anchor': 'middle', class: 'mo-lab' }, Lab.fmt(T.p[i][j])));
          }
        });
        s.appendChild(svg('text', { x: x0 + w / 2, y: padT + H + 18, 'text-anchor': 'middle', class: 'mo-tick x' }, o.x.name + '=' + Lab.fmtVal(xv)));
        s.appendChild(svg('text', { x: x0 + w / 2, y: padT + H + 36, 'text-anchor': 'middle', class: 'mo-sub' }, 'width ' + Lab.fmt(mx.p[i])));
        x0 += w;
      });
      // legend for Y
      T.ys.forEach((yv, j) => {
        const ly = padT + H - (j + 1) * 22;
        s.appendChild(svg('rect', { x: padL + Wd + 12, y: ly, width: 14, height: 14, rx: 3, class: 'mo-cell lv' + (j % 6) }));
        s.appendChild(svg('text', { x: padL + Wd + 32, y: ly + 11.5, class: 'mo-tick y' }, o.y.name + '=' + Lab.fmtVal(yv)));
      });
      host.appendChild(s);
      host.appendChild(h('div', { class: 'xs muted mo-note', html: 'How to read it: each column is one value of ' + Lab.tex(tn(o.x.name)) + ', as wide as ' + Lab.tex('P(' + tn(o.x.name) + '=x)') + '. Inside a column, each piece is as tall as ' + Lab.tex('P(' + tn(o.y.name) + '=y\\mid ' + tn(o.x.name) + '=x)') + ' (' + Lab.tex(tn(o.y.name) + '=0') + ' at the bottom). The number on a piece is its area, the joint probability ' + Lab.tex('f_{' + tn(o.x.name) + tn(o.y.name) + '}(x,y)') + '. Point at a piece for its conditional height.' }));
      if (mode === 'product') info.innerHTML = 'This is what the table would be <b>if</b> ' + o.x.name + ' and ' + o.y.name + ' were independent: every column is cut at the same heights, because ' + Lab.tex('f_{' + tn(o.y.name) + '\\mid ' + tn(o.x.name) + '=t}=f_{' + tn(o.y.name) + '}') + ' for every ' + Lab.tex('t') + '.';
      else info.innerHTML = ind.independent
        ? '<span class="cgood">The cuts line up across all columns</span> — the distribution of ' + o.y.name + ' is the same whichever column you are in. ' + o.x.name + ' and ' + o.y.name + ' are <b>independent</b>.'
        : '<span class="cbad">The cuts do not line up</span> — knowing ' + o.x.name + ' changes the distribution of ' + o.y.name + '. ' + o.x.name + ' and ' + o.y.name + ' are <b>not independent</b>.' + (o.toggle !== false ? ' Switch to the second view to see what independence would look like.' : '');
    }
    return self;
  };

  /* -------------------------------------------------------------- rows */
  /**
   * W.rows({rows, names, given, keep}) — joint PMF of several variables as a list of tuples.
   *  rows   [{t:[...], p}]   (Lab.P.rows / custom)
   *  names  ['X1','X2','X3']
   *  mode   'joint' | 'marginal' | 'condition'
   * API: marginal(keep, {animate}), condition(given, {animate}), reset()
   */
  W.rows = function (opts) {
    const o = Object.assign({}, opts);
    let root, tbl, out, rowsEls = [];
    const self = { mount(el) { root = el; build(); }, marginal, condition, reset: build, highlight };
    function build() {
      Lab.clear(root);
      root.classList.add('w-rows');
      const t = h('table', { class: 'tbl rows-tbl' });
      t.appendChild(h('thead', {}, h('tr', {}, o.names.map((n, k) => h('th', { class: 'v' + (k % 3), html: Lab.tex(tn(n)) })), h('th', { html: Lab.tex('f_{' + o.names.map(tn).join('') + '}') }))));
      const tb = h('tbody');
      rowsEls = o.rows.map(r => {
        const tr = h('tr', {}, r.t.map(v => h('td', { html: Lab.tex(Lab.fmtVal(v)) })), h('td', { class: 'pcol', html: Lab.fmtHtml(r.p) }));
        tb.appendChild(tr);
        return tr;
      });
      t.appendChild(tb);
      tbl = h('div', { class: 'tbl-wrap' }, t);
      out = h('div', { class: 'rows-out' });
      root.appendChild(h('div', { class: 'rows-stage' }, tbl, out));
      root.appendChild(h('div', { class: 'xs muted', style: { marginTop: '6px' }, text: o.rows.length + ' rows · total probability ' + Lab.fmt(F.sum(o.rows.map(r => r.p))) }));
    }
    function highlight(pred, cls = 'hl-row') { rowsEls.forEach((tr, k) => tr.classList.toggle(cls, !!pred && pred(o.rows[k].t))); }
    async function marginal(keep, opt = {}) {
      const animate = opt.animate !== false;
      Lab.clear(out);
      const res = Lab.P.marginalRows(o.rows, keep);
      const names = keep.map(k => tn(o.names[k]));
      out.appendChild(h('div', { class: 'ws-title', html: 'Keep ' + Lab.tex(names.join(',')) + ', sum over the rest' }));
      const t = h('table', { class: 'tbl' });
      t.appendChild(h('thead', {}, h('tr', {}, names.map(n => h('th', { html: Lab.tex(n) })), h('th', { html: Lab.tex('f_{' + names.join('') + '}') }), h('th', { text: 'which rows add up' }))));
      const tb = h('tbody');
      t.appendChild(tb);
      out.appendChild(h('div', { class: 'tbl-wrap' }, t));
      for (const r of res) {
        const tr = h('tr', {}, r.t.map(v => h('td', { html: Lab.tex(Lab.fmtVal(v)) })), h('td', { html: '<b>' + Lab.fmtHtml(r.p) + '</b>' }), h('td', { class: 'small', html: Lab.tex(r.from.map(x => Lab.fmtTex(x.p)).join('+')) }));
        tb.appendChild(tr);
        if (animate) {
          highlight(t2 => keep.every((k, q) => Lab.sameVal(t2[k], r.t[q])));
          tr.classList.add('enter-row');
          await Lab.sleep(650);
        }
      }
      highlight(null);
      return res;
    }
    async function condition(given, opt = {}) {
      const animate = opt.animate !== false;
      Lab.clear(out);
      const res = Lab.P.conditionRows(o.rows, given);
      const gtxt = Object.keys(given).map(k => tn(o.names[k]) + '=' + Lab.fmtVal(given[k])).join(',\\ ');
      highlight(t2 => Object.keys(given).every(k => Lab.sameVal(t2[k], given[k])));
      out.appendChild(h('div', { class: 'ws-title', html: 'Keep only rows with ' + Lab.tex(gtxt) + ', then divide by their total' }));
      if (res.total.isZero()) { out.appendChild(h('div', { class: 'callout warn', text: 'No row matches: the condition has probability 0.' })); return res; }
      out.appendChild(h('div', { class: 'small', html: Lab.tex('P(' + gtxt + ') = ' + res.rows.map(r => Lab.fmtTex(r.raw)).join('+') + ' = ' + res.total.tex()) }));
      if (animate) await Lab.sleep(600);
      const free = o.names.map((_, k) => k).filter(k => !(k in given));
      const t = h('table', { class: 'tbl' });
      t.appendChild(h('thead', {}, h('tr', {}, free.map(k => h('th', { html: Lab.tex(tn(o.names[k])) })), h('th', { text: 'row value' }), h('th', { html: Lab.tex('\\div ' + res.total.tex()) }))));
      const tb = h('tbody');
      res.rows.forEach(r => tb.appendChild(h('tr', {}, free.map(k => h('td', { html: Lab.tex(Lab.fmtVal(r.t[k])) })), h('td', { html: Lab.fmtHtml(r.raw) }), h('td', { html: '<b>' + Lab.fmtHtml(r.p) + '</b>' }))));
      t.appendChild(tb);
      out.appendChild(h('div', { class: 'tbl-wrap' }, t));
      return res;
    }
    return self;
  };

  /* ------------------------------------------------------------- slices */
  /**
   * W.slices({outcomes, fns:[X,Y,Z], names:['X','Y','Z']}) — three variables as one X–Y table per value of Z.
   * Buttons: stack the slices (marginalise Z) or pick one slice and rescale it (condition on Z).
   */
  W.slices = function (opts) {
    const o = Object.assign({ names: ['X', 'Y', 'Z'] }, opts);
    let root, host, out;
    const rows = o.rows || Lab.P.rows(o.outcomes, o.fns);
    const zs = [...new Set(rows.map(r => r.t[2]))].sort((a, b) => a - b);
    const xs = [...new Set(rows.map(r => r.t[0]))].sort((a, b) => a - b);
    const ys = [...new Set(rows.map(r => r.t[1]))].sort((a, b) => a - b);
    const sliceJ = z => ({ xs, ys, p: xs.map(x => ys.map(y => { const r = rows.find(q => Lab.sameVal(q.t[0], x) && Lab.sameVal(q.t[1], y) && Lab.sameVal(q.t[2], z)); return r ? r.p : F(0); })) });
    const self = { mount(el) { root = el; build(); }, stack, pick, reset: build };
    let tables = [];
    function build() {
      Lab.clear(root);
      root.classList.add('w-slices');
      host = h('div', { class: 'sl-host' });
      tables = zs.map(z => {
        const box = h('div', { class: 'sl-box' }, h('div', { class: 'sl-title', html: 'Slice ' + Lab.tex(tn(o.names[2]) + '=' + Lab.fmtVal(z)) }));
        const w = W.joint({ J: sliceJ(z), x: { name: o.names[0] }, y: { name: o.names[1] }, caption: false, hover: false });
        const hostJ = h('div');
        box.appendChild(hostJ);
        w.mount(hostJ);
        host.appendChild(box);
        return { z, box, w };
      });
      root.appendChild(host);
      const ctr = h('div', { class: 'btn-row' });
      ctr.appendChild(Lab.button('Stack the slices (sum over ' + Lab.tex(tn(o.names[2])) + ')', () => stack(), 'btn primary sm'));
      zs.forEach((z, k) => ctr.appendChild(Lab.button('Given ' + Lab.tex(tn(o.names[2]) + '=' + Lab.fmtVal(z)), () => pick(k), 'btn sm')));
      ctr.appendChild(Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => build(), 'btn ghost sm'));
      root.appendChild(ctr);
      out = h('div', { class: 'sl-out' });
      root.appendChild(out);
    }
    async function stack(opt = {}) {
      Lab.clear(out);
      tables.forEach(t => t.box.classList.remove('dim', 'on'));
      const sum = { xs, ys, p: xs.map((_, i) => ys.map((_, j) => F.sum(tables.map(t => t.w.J.p[i][j])))) };
      out.appendChild(h('div', { class: 'ws-title', html: 'Add the slices cell by cell → joint PMF of ' + Lab.tex('(' + tn(o.names[0]) + ',' + tn(o.names[1]) + ')') }));
      const w = W.joint({ J: { xs, ys, p: xs.map(() => ys.map(() => F(0))) }, x: { name: o.names[0] }, y: { name: o.names[1] }, caption: false, hover: false });
      const hostJ = h('div');
      out.appendChild(hostJ);
      w.mount(hostJ);
      if (opt.animate === false) { w.setJ(sum); return; }
      const acc = { xs, ys, p: xs.map(() => ys.map(() => F(0))) };
      for (const t of tables) {
        t.box.classList.add('on');
        const jobs = [];
        xs.forEach((_, i) => ys.forEach((_, j) => jobs.push(Lab.fly(t.w.cell(i, j).querySelector('.v'), w.cell(i, j), root, { ms: 650 }))));
        await Promise.all(jobs);
        xs.forEach((_, i) => ys.forEach((_, j) => { acc.p[i][j] = acc.p[i][j].add(t.w.J.p[i][j]); }));
        w.setJ({ xs, ys, p: acc.p.map(r => r.slice()) });
        t.box.classList.remove('on');
        await Lab.sleep(200);
      }
    }
    async function pick(k, opt = {}) {
      Lab.clear(out);
      tables.forEach((t, q) => { t.box.classList.toggle('dim', q !== k); t.box.classList.toggle('on', q === k); });
      const J = tables[k].w.J;
      const tot = Lab.P.jointTotal(J);
      out.appendChild(h('div', { class: 'ws-title', html: 'Only the slice ' + Lab.tex(tn(o.names[2]) + '=' + Lab.fmtVal(zs[k])) + ' survives. Its total is ' + Lab.tex('P(' + tn(o.names[2]) + '=' + Lab.fmtVal(zs[k]) + ')=' + tot.tex()) + '; divide every cell by it.' }));
      const cond = { xs, ys, p: J.p.map(r => r.map(v => (tot.isZero() ? F(0) : v.div(tot)))) };
      const w = W.joint({ J, x: { name: o.names[0] }, y: { name: o.names[1] }, caption: false, hover: false });
      const hostJ = h('div');
      out.appendChild(hostJ);
      w.mount(hostJ);
      if (opt.animate !== false) await Lab.sleep(700);
      w.setJ(cond);
      out.appendChild(h('div', { class: 'small', html: 'This is ' + Lab.tex('f_{' + tn(o.names[0]) + tn(o.names[1]) + '\\mid ' + tn(o.names[2]) + '=' + Lab.fmtVal(zs[k]) + '}(t_1,t_2)') + ' — it sums to 1 again.' }));
    }
    return self;
  };

  /* ------------------------------------------------------------- events */
  /**
   * W.events({outcomes, cols, events:[{name:'A', label:'sum is 7', test:(v)=>...}], mode:'cond'|'union'})
   * Grid of equally likely outcomes. Shows P(A), P(B), P(A and B), P(A | B) by counting tiles.
   */
  W.events = function (opts) {
    const o = Object.assign({ cols: 6 }, opts);
    let root, tiles, info, aIdx = 0, bIdx = o.events.length > 1 ? 1 : -1, zoom = false;
    const self = { mount(el) { root = el; build(); }, setZoom(z) { zoom = z; paint(); }, reset() { zoom = false; paint(); } };
    function build() {
      Lab.clear(root);
      root.classList.add('w-events');
      const ctr = h('div', { class: 'controls' });
      if (o.events.length > 2) {
        ctr.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', text: 'A:' }), Lab.seg(o.events.map((e, k) => ({ label: e.label, value: k })), aIdx, k => { aIdx = k; paint(); })));
        ctr.appendChild(h('div', { class: 'control' }, h('span', { class: 'lbl', text: 'B:' }), Lab.seg(o.events.map((e, k) => ({ label: e.label, value: k })), bIdx, k => { bIdx = k; paint(); })));
      }
      if (bIdx >= 0 && o.zoom !== false) ctr.appendChild(Lab.seg([{ label: 'Whole sample space', value: false }, { label: 'Zoom into B', value: true }], zoom, z => { zoom = z; paint(); }));
      root.appendChild(ctr);
      const grid = h('div', { class: 'ev-grid' });
      grid.style.gridTemplateColumns = 'repeat(' + o.cols + ', auto)';
      tiles = o.outcomes.map(q => { const t = h('div', { class: 'ev-tile', title: q.label }, Lab.draw.outcome(q, { size: o.size })); grid.appendChild(t); return t; });
      root.appendChild(grid);
      info = h('div', { class: 'ev-info' });
      root.appendChild(info);
      paint();
    }
    function paint() {
      const A = o.events[aIdx], B = bIdx >= 0 ? o.events[bIdx] : null;
      let nA = 0, nB = 0, nAB = 0;
      o.outcomes.forEach((q, k) => {
        const a = A.test(q.v, q), b = B ? B.test(q.v, q) : false;
        nA += a; nB += b; nAB += a && b;
        tiles[k].classList.toggle('in-a', a);
        tiles[k].classList.toggle('in-b', b);
        tiles[k].classList.toggle('out', zoom && B && !b);
      });
      const N = o.outcomes.length;
      const rows = [];
      // n/N, plus its reduced form only when that is different (6/36 = 1/6, but not 5/36 = 5/36)
      const frac = (n, d) => '\\frac{' + n + '}{' + d + '}' + (n && d && F(n, d).d !== d ? '=' + F(n, d).tex() : '');
      rows.push('<div><span class="ev-key a"></span>' + Lab.tex('A') + ' = ' + A.label + ': ' + Lab.tex('P(A)=' + frac(nA, N)) + '</div>');
      if (B) {
        rows.push('<div><span class="ev-key b"></span>' + Lab.tex('B') + ' = ' + B.label + ': ' + Lab.tex('P(B)=' + frac(nB, N)) + '</div>');
        rows.push('<div><span class="ev-key ab"></span>' + Lab.tex('A\\cap B') + ': ' + Lab.tex('P(A\\cap B)=' + frac(nAB, N)) + '</div>');
        if (zoom) rows.push('<div class="ev-cond">Inside ' + Lab.tex('B') + ' there ' + (nB === 1 ? 'is 1 outcome' : 'are ' + nB + ' outcomes') + ', and ' + nAB + ' of ' + (nB === 1 ? 'it is' : 'them ' + (nAB === 1 ? 'is' : 'are')) + ' in ' + Lab.tex('A') + ': ' + Lab.tex('P(A\\mid B)=' + (nB ? frac(nAB, nB) : '?') + '=\\frac{P(A\\cap B)}{P(B)}') + '</div>');
      }
      info.innerHTML = rows.join('');
    }
    return self;
  };

  /* --------------------------------------------------------------- tree */
  /**
   * W.tree({stage1:[{label, p}], stage2: (k) => [{label, p}], names:['First','Second']})
   * Probabilities multiply along a path.
   */
  W.tree = function (opts) {
    let root;
    const self = { mount(el) { root = el; draw(); }, reset() { draw(); } };
    const tw = (t, px = 7.4) => String(t).length * px;   // rough text width for 13px labels
    function draw() {
      Lab.clear(root);
      root.classList.add('w-tree');
      const s1 = opts.stage1.map(a => Object.assign({}, a, { p: F(a.p) }));
      const leaves = [];
      s1.forEach((a, i) => opts.stage2(i).forEach((b, j) => leaves.push({ i, j, a, b: Object.assign({}, b, { p: F(b.p) }) })));
      const leafText = l => Lab.fmt(l.a.p) + ' × ' + Lab.fmt(l.b.p) + ' = ' + Lab.fmt(l.a.p.mul(l.b.p));
      const w1 = Math.max(...s1.map(a => tw(a.label)));
      const w2 = Math.max(...leaves.map(l => tw(l.b.label)));
      const wl = Math.max(...leaves.map(l => tw(leafText(l), 7.2)));
      const rowH = 34;
      const x0 = 16, x1 = 170, b1 = x1 + w1 + 16, x2 = b1 + 170, lx = x2 + w2 + 28;
      const Wd = Math.max(640, lx + wl + 12), H = Math.max(leaves.length * rowH + 20, 120);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'tree-svg', role: 'img', 'aria-label': 'probability tree' });
      const y0 = H / 2;
      const leafY = k => 10 + rowH * k + rowH / 2;
      s.appendChild(svg('circle', { cx: x0, cy: y0, r: 4, class: 'tr-root' }));
      s1.forEach((a, i) => {
        const ks = leaves.map((l, k) => (l.i === i ? k : -1)).filter(k => k >= 0);
        const ym = (leafY(ks[0]) + leafY(ks[ks.length - 1])) / 2;
        s.appendChild(svg('path', { d: 'M' + x0 + ',' + y0 + ' C' + (x0 + 70) + ',' + y0 + ' ' + (x1 - 70) + ',' + ym + ' ' + (x1 - 4) + ',' + ym, class: 'tr-edge' }));
        s.appendChild(svg('text', { x: (x0 + x1) / 2, y: (y0 + ym) / 2 - 6, 'text-anchor': 'middle', class: 'tr-p' }, Lab.fmt(a.p)));
        s.appendChild(svg('text', { x: x1, y: ym + 4, class: 'tr-node' }, a.label));
        ks.forEach(k => {
          const l = leaves[k];
          s.appendChild(svg('path', { d: 'M' + b1 + ',' + ym + ' C' + (b1 + 60) + ',' + ym + ' ' + (x2 - 60) + ',' + leafY(k) + ' ' + (x2 - 4) + ',' + leafY(k), class: 'tr-edge' }));
          s.appendChild(svg('text', { x: b1 + 0.68 * (x2 - b1), y: ym + 0.86 * (leafY(k) - ym) - 6, 'text-anchor': 'middle', class: 'tr-p' }, Lab.fmt(l.b.p)));
          s.appendChild(svg('text', { x: x2, y: leafY(k) + 4, class: 'tr-node' }, l.b.label));
          s.appendChild(svg('text', { x: lx, y: leafY(k) + 4, class: 'tr-leaf' }, leafText(l)));
        });
      });
      root.appendChild(s);
    }
    return self;
  };

  /* ------------------------------------------------------- editable joint */
  /**
   * W.editJoint({xs, ys, weights, x, y}) — tap + / − on cells to change weights; probabilities = weight / total.
   * Shows marginals, independence verdict and lets you pick a column/row for a conditional.
   */
  W.editJoint = function (opts) {
    const o = Object.assign({}, opts);
    let xs = o.xs.slice(), ys = o.ys.slice();
    let wts = o.weights ? o.weights.map(r => r.slice()) : xs.map(() => ys.map(() => 1));
    let root, jw, verdict, hostJ, mos;
    const self = { mount(el) { root = el; build(); }, reset() { wts = o.weights ? o.weights.map(r => r.slice()) : xs.map(() => ys.map(() => 1)); refresh(); } };
    function J() {
      const tot = wts.flat().reduce((a, b) => a + b, 0) || 1;
      return { xs, ys, p: wts.map(r => r.map(w => F(w, tot))) };
    }
    function build() {
      Lab.clear(root);
      root.classList.add('w-edit');
      root.appendChild(h('div', { class: 'small muted', html: 'Each cell holds a <b>weight</b> (a count of equally likely outcomes). Tap a cell to add one, or right-click / long-press to remove one. Probabilities are weight ÷ total weight, so the table always sums to 1.' }));
      hostJ = h('div');
      root.appendChild(hostJ);
      jw = W.joint({ J: J(), x: o.x, y: o.y, margins: 'shown', pick: null, hover: true, controls: ['fmt'] });
      jw.mount(hostJ);
      wire();
      verdict = h('div', { class: 'ws-readout' });
      root.appendChild(verdict);
      const mhost = h('div');
      root.appendChild(mhost);
      if (o.mosaic !== false) { mos = W.mosaic({ J: J(), x: o.x, y: o.y }); mos.mount(mhost); }
      root.appendChild(h('div', { class: 'btn-row' },
        Lab.button('Make all weights 1', () => { wts = xs.map(() => ys.map(() => 1)); refresh(); }, 'btn sm'),
        Lab.button('Make it independent', () => { const a = xs.map((_, i) => wts[i].reduce((s, v) => s + v, 0)); const b = ys.map((_, j) => wts.reduce((s, r) => s + r[j], 0)); wts = xs.map((_, i) => ys.map((_, j) => a[i] * b[j])); refresh(); }, 'btn sm'),
        Lab.button('Random weights', () => { wts = xs.map(() => ys.map(() => Lab.rand.int(0, 5))); if (!wts.flat().some(v => v)) wts[0][0] = 1; refresh(); }, 'btn sm'),
        Lab.button(Lab.icon('refresh') + '<span>Reset</span>', () => self.reset(), 'btn ghost sm')));
      refresh();
    }
    function wire() {
      xs.forEach((_, i) => ys.forEach((_, j) => {
        const c = jw.cell(i, j);
        c.classList.add('editable');
        c.title = 'tap: +1 weight · right-click: −1';
        c.addEventListener('click', () => { wts[i][j]++; refresh(); });
        c.addEventListener('contextmenu', e => { e.preventDefault(); if (wts[i][j] > 0 && wts.flat().reduce((a, b) => a + b, 0) > 1) { wts[i][j]--; refresh(); } });
        let timer;
        c.addEventListener('touchstart', () => { timer = setTimeout(() => { if (wts[i][j] > 0) { wts[i][j]--; refresh(); } }, 550); }, { passive: true });
        c.addEventListener('touchend', () => clearTimeout(timer));
      }));
    }
    function refresh() {
      const j = J();
      jw.setJ(j);
      xs.forEach((_, i) => ys.forEach((_, jj) => { const c = jw.cell(i, jj); let b = c.querySelector('.wt'); if (!b) { b = h('span', { class: 'wt' }); c.appendChild(b); } b.textContent = '×' + wts[i][jj]; }));
      if (mos) mos.setJ(j);
      const ind = Lab.P.independence(j);
      verdict.innerHTML = ind.independent
        ? '<span class="cgood">Independent.</span> Every cell equals (its column marginal) × (its row marginal).'
        : '<span class="cbad">Not independent.</span> For example cell ' + Lab.tex('(' + Lab.fmtVal(xs[ind.bad[0][0]]) + ',' + Lab.fmtVal(ys[ind.bad[0][1]]) + ')') + ': ' +
          Lab.tex(j.p[ind.bad[0][0]][ind.bad[0][1]].tex() + '\\neq' + ind.mx.p[ind.bad[0][0]].tex() + '\\times' + ind.my.p[ind.bad[0][1]].tex() + '=' + ind.prod.p[ind.bad[0][0]][ind.bad[0][1]].tex());
    }
    return self;
  };
})();
