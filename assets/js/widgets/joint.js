/* Revise — the joint PMF table.
   Layout follows the lecture: values of X (t1) across the top, values of Y (t2) down the side,
   f_X in the bottom row (sum down each column), f_Y in the right column (sum along each row). */
(function () {
  'use strict';
  const { h, F } = Lab;
  const W = (Lab.W = Lab.W || {});

  function texName(n) { return n.replace(/(\d+)$/, '_{$1}'); }

  /**
   * W.joint(opts)
   *  J         joint table {xs, ys, p} (Lab.P.joint / table / tableRowsY)
   *  x, y      {name:'X', label:'units digit'}
   *  margins   'none' | 'hidden' | 'shown'
   *  mass      draw a square whose area is the probability (default true)
   *  fmt       'frac' | 'dec'
   *  outcomes  outcome list, to show which outcomes sit in each cell
   *  pick      null | 'cell' | 'col' | 'row' | 'any'  — learner can select
   *  onPick    fn({type, i, j})
   *  condPanel true → picking a column/row shows the conditional PMF
   *  controls  ['fmt', 'margins']
   *  caption   show the axis captions (default true)
   */
  W.joint = function (opts) {
    const o = Object.assign({ margins: 'none', mass: true, fmt: 'frac', pick: null, caption: true, controls: [], hover: true, sum: true }, opts);
    if (o.den && !opts.fmt) o.fmt = 'count';
    o.x = Object.assign({ name: 'X', label: '' }, o.x);
    o.y = Object.assign({ name: 'Y', label: '' }, o.y);
    let J = o.J;
    let root, grid, layer, readout, panel, cells, xh, yh, mxs, mys, corner, total, mhx, mhy;
    let marginState = o.margins;
    let sumEl = null;
    let selected = null;

    const self = {
      mount(el) { root = el; build(); },
      get J() { return J; },
      cell: (i, j) => cells[i][j],
      mx: i => mxs[i], my: j => mys[j],
      xHead: i => xh[i], yHead: j => yh[j],
      reset, mark, unmark, clearMarks, dimExcept, undim,
      showMargins, hideMargins, flowCol, flowRow, flowAll, condition, clearPanel, setJ, setFmt, select,
      setMarginValue, panel: () => panel, root: () => root, layer: () => layer,
      revealCell, revealAll, maskAll,
    };

    const fmtV = v => {
      if (o.fmt === 'dec') return '<span class="fr-int">' + Lab.fmtSmall(v) + '</span>';
      if (o.fmt === 'count' && o.den && v instanceof Lab.Frac && !v.approx) {
        const c = v.over(o.den);
        if (c) return c.n === 0 ? '<span class="fr-int">0</span>' : '<span class="fr"><span class="fr-n">' + c.n + '</span><span class="fr-d">' + c.d + '</span></span>';
      }
      return Lab.fmtHtml(v);
    };
    const fmtT = v => {
      if (o.fmt === 'count' && o.den && v instanceof Lab.Frac && !v.approx) { const c = v.over(o.den); if (c) return c.n === 0 ? '0' : '\\tfrac{' + c.n + '}{' + c.d + '}'; }
      return Lab.fmtTex(v);
    };
    const xn = () => texName(o.x.name), yn = () => texName(o.y.name);

    function build() {
      Lab.clear(root);
      root.classList.add('w-joint');
      const nx = J.xs.length, ny = J.ys.length;
      const wrap = h('div', { class: 'jt-wrap' });
      grid = h('div', { class: 'jt' + (nx >= 8 ? ' dense' : '') + (o.mass ? '' : ' nomass') });
      const withMy = marginState !== 'none';
      grid.style.gridTemplateColumns = 'auto repeat(' + nx + ', minmax(var(--jt-cell), max-content))' + (withMy ? ' minmax(var(--jt-margin), max-content)' : '');
      corner = h('div', { class: 'jt-corner', html: Lab.tex(yn() + '\\,\\backslash\\,' + xn()) });
      grid.appendChild(corner);
      xh = J.xs.map((x, i) => {
        const c = h('div', { class: 'jt-xh', html: Lab.tex(Lab.fmtVal(x)) });
        c.addEventListener('click', () => userPick('col', i));
        grid.appendChild(c);
        return c;
      });
      mhy = null;
      if (withMy) { mhy = h('div', { class: 'jt-mh jt-mh-y', html: Lab.tex('f_{' + yn() + '}') }); grid.appendChild(mhy); }
      cells = J.xs.map(() => []);
      mys = [];
      yh = [];
      J.ys.forEach((y, j) => {
        const r = h('div', { class: 'jt-yh', html: Lab.tex(Lab.fmtVal(y)) });
        r.addEventListener('click', () => userPick('row', j));
        grid.appendChild(r);
        yh[j] = r;
        J.xs.forEach((x, i) => {
          const c = h('div', { class: 'jt-cell', dataset: { i, j } }, h('span', { class: 'mass' }), h('span', { class: 'v' }));
          c.addEventListener('click', () => userPick('cell', i, j));
          c.addEventListener('mouseenter', () => hover(i, j));
          grid.appendChild(c);
          cells[i][j] = c;
        });
        if (withMy) { const m = h('div', { class: 'jt-m jt-my' }, h('span', { class: 'v' })); grid.appendChild(m); mys[j] = m; }
      });
      mxs = [];
      if (withMy) {
        mhx = h('div', { class: 'jt-mh jt-mh-x', html: Lab.tex('f_{' + xn() + '}') });
        grid.appendChild(mhx);
        J.xs.forEach((_, i) => { const m = h('div', { class: 'jt-m jt-mx' }, h('span', { class: 'v' })); grid.appendChild(m); mxs[i] = m; });
        total = h('div', { class: 'jt-m jt-total' }, h('span', { class: 'v' }));
        grid.appendChild(total);
      }
      grid.addEventListener('mouseleave', () => { if (selected) showSelection(); else hover(null); });
      layer = h('div', { class: 'fx-layer' });
      wrap.append(grid, layer);
      root.appendChild(wrap);
      if (o.caption) {
        const cap = h('div', { class: 'jt-caption' });
        cap.appendChild(h('span', { class: 'cap-x', html: '<i></i>' + Lab.tex(o.x.name.replace(/(\d+)$/, '_{$1}')) + (o.x.label ? ' = ' + Lab.esc(o.x.label) : '') + ' <span class="muted">(columns)</span>' }));
        cap.appendChild(h('span', { class: 'cap-y', html: '<i></i>' + Lab.tex(o.y.name.replace(/(\d+)$/, '_{$1}')) + (o.y.label ? ' = ' + Lab.esc(o.y.label) : '') + ' <span class="muted">(rows)</span>' }));
        if (o.sum) { sumEl = h('span', { class: 'jt-sumline' }); cap.appendChild(sumEl); }
        root.appendChild(cap);
      }
      if (o.hover || o.pick) {
        readout = h('div', { class: 'jt-readout' });
        root.appendChild(readout);
        hover(null);
      }
      if (o.controls.length) root.appendChild(buildControls());
      panel = h('div', { class: 'jt-panel', hidden: true });
      root.appendChild(panel);
      if (o.pick) root.classList.add('pickable-' + o.pick);
      if (o.masked && !masked) masked = J.xs.map(() => J.ys.map(() => true));
      render();
      applyMargins();
    }
    function buildControls() {
      const row = h('div', { class: 'controls jt-controls' });
      if (o.controls.includes('fmt')) row.appendChild(Lab.seg((o.den ? [{ label: 'Counts /' + o.den, value: 'count' }] : []).concat([{ label: 'Fractions', value: 'frac' }, { label: 'Decimals', value: 'dec' }]), o.fmt, v => setFmt(v)));
      if (o.controls.includes('margins') && marginState !== 'none') {
        const b = Lab.button('Show / hide marginals', () => {
          if (marginState === 'shown') hideMargins(); else showMargins();
        }, 'btn sm');
        row.appendChild(b);
      }
      if (o.controls.includes('mass')) {
        row.appendChild(Lab.seg([{ label: 'Mass squares', value: true }, { label: 'Numbers only', value: false }], o.mass, v => { o.mass = v; grid.classList.toggle('nomass', !v); }));
      }
      return row;
    }
    let masked = null;
    function maskAll() { masked = J.xs.map(() => J.ys.map(() => true)); render(); }
    function revealCell(i, j, opt = {}) { if (!masked) return; masked[i][j] = false; render(); if (opt.animate !== false) Lab.pulse(cells[i][j]); }
    function revealAll() { masked = null; render(); }
    function render() {
      grid.classList.toggle('decmode', o.fmt === 'dec');
      const flat = J.p.flat().map(Number);
      const pmax = Math.max(...flat, 1e-12);
      J.xs.forEach((_, i) => J.ys.forEach((_, j) => {
        const c = cells[i][j];
        const v = J.p[i][j];
        const hid = masked && masked[i][j];
        c.querySelector('.v').innerHTML = hid ? '<span class="q">?</span>' : fmtV(v);
        c.classList.toggle('zero', !hid && Number(v) === 0);
        c.classList.toggle('masked', !!hid);
        const s = hid ? 0 : Math.sqrt(Number(v) / pmax);
        c.querySelector('.mass').style.setProperty('--s', s.toFixed(4));
        c.style.setProperty('--t', hid ? 0 : (Number(v) / pmax).toFixed(4));
      }));
      if (sumEl) {
        const tot = Lab.P.jointTotal(J);
        sumEl.innerHTML = 'Σ all cells = ' + fmtV(tot) + (tot.eq(1) ? (o.fmt === 'count' && o.den && o.den !== 1 ? ' = 1' : '') + ' <span class="cgood">✓</span>' : '');
      }
      if (mxs.length) {
        const mx = Lab.P.margX(J), my = Lab.P.margY(J);
        mxs.forEach((m, i) => { m.querySelector('.v').innerHTML = fmtV(mx.p[i]); });
        mys.forEach((m, j) => { m.querySelector('.v').innerHTML = fmtV(my.p[j]); });
        total.querySelector('.v').innerHTML = fmtV(Lab.P.jointTotal(J));
      }
    }
    function applyMargins() {
      if (marginState === 'none') return;
      const hide = marginState === 'hidden';
      [...mxs, ...mys, total, mhx, mhy].forEach(el => el && el.classList.toggle('ghost', hide));
    }
    function setMarginValue(axis, k, html) {
      const el = axis === 'x' ? mxs[k] : mys[k];
      el.classList.remove('ghost');
      el.querySelector('.v').innerHTML = html;
    }
    function showMargins(which = 'both') {
      if (marginState === 'none') return;
      marginState = 'shown';
      render();
      const list = which === 'x' ? [...mxs, mhx] : which === 'y' ? [...mys, mhy] : [...mxs, ...mys, total, mhx, mhy];
      list.forEach(el => el && el.classList.remove('ghost'));
    }
    function hideMargins() { if (marginState === 'none') return; marginState = 'hidden'; applyMargins(); }

    /* --------------------------------------------------------- marks & dims */
    function mark(list, cls = 'pick') { list.forEach(([i, j]) => cells[i] && cells[i][j] && cells[i][j].classList.add(cls)); }
    function unmark(cls = 'pick') { Lab.$$('.' + cls, grid).forEach(e => e.classList.remove(cls)); }
    function clearMarks() { ['pick', 'pick2', 'good', 'bad', 'hot', 'sel'].forEach(unmark); undim(); }
    function dimExcept(list) {
      const keep = new Set(list.map(([i, j]) => i + ',' + j));
      J.xs.forEach((_, i) => J.ys.forEach((_, j) => cells[i][j].classList.toggle('dim', !keep.has(i + ',' + j))));
    }
    function undim() { Lab.$$('.dim', grid).forEach(e => e.classList.remove('dim')); }

    /* -------------------------------------------------------------- hover */
    function hover(i, j) {
      if (!readout) return;
      if (i == null) {
        readout.innerHTML = '<span class="muted">' + (o.pick ? (o.pick === 'any' ? 'Tap a cell, a column header or a row header to select it.' : o.pick === 'col' ? 'Tap a column (its header or any cell in it) to select it.' : o.pick === 'row' ? 'Tap a row (its header or any cell in it) to select it.' : 'Tap a cell to select it.') : 'Point at a cell to read it.') + '</span>';
        return;
      }
      const x = J.xs[i], y = J.ys[j], v = J.p[i][j];
      let html = Lab.tex('f_{' + xn() + yn() + '}(' + Lab.fmtVal(x) + ',' + Lab.fmtVal(y) + ') = P(' + xn() + '=' + Lab.fmtVal(x) + ',\\ ' + yn() + '=' + Lab.fmtVal(y) + ') = ' + fmtT(v) + (o.fmt === 'count' && o.den && fmtT(v) !== Lab.fmtTex(v) && !v.isZero() ? ' = ' + Lab.fmtTex(v) : ''));
      if (o.outcomes && J.cells) {
        const mem = J.cells[i][j].map(k => o.outcomes[k].label);
        html += mem.length ? '<div class="xs muted mem">' + mem.length + ' outcome' + (mem.length > 1 ? 's' : '') + ': ' + Lab.esc(mem.slice(0, 18).join('  ')) + (mem.length > 18 ? ' …' : '') + '</div>' : '<div class="xs muted mem">No outcome gives this pair — impossible, so probability 0.</div>';
      }
      readout.innerHTML = html;
    }

    /* -------------------------------------------------------------- picking */
    function userPick(type, i, j) {
      // type 'cell' (i, j) | 'col' (i) | 'row' (i = row index)
      if (!o.pick) return;
      if (o.pick === 'cell') { if (type === 'cell') select('cell', i, j, true); return; }
      if (o.pick === 'col') { if (type !== 'row') select('col', i, undefined, true); return; }
      if (o.pick === 'row') { if (type !== 'col') select('row', type === 'row' ? i : j, undefined, true); return; }
      if (type === 'cell') select('cell', i, j, true); else select(type, i, undefined, true);
    }
    /** Readout for the current selection (a cell's details, or a column/row total). */
    function showSelection() {
      if (!readout || !selected) return;
      const { type, i: a, j: b } = selected;
      if (type === 'cell') { hover(a, b); return; }
      const isCol = type === 'col';
      const v = isCol ? J.xs[a] : J.ys[a];
      const tot = isCol ? F.sum(J.p[a]) : F.sum(J.p.map(r => r[a]));
      readout.innerHTML = 'Selected: ' + (isCol ? 'column ' : 'row ') + Lab.tex((isCol ? xn() : yn()) + '=' + Lab.fmtVal(v)) + ', total ' + Lab.tex('P(' + (isCol ? xn() : yn()) + '=' + Lab.fmtVal(v) + ')=' + Lab.fmtTex(tot)) + '.';
    }
    function select(type, a, b, fromUser) {
      clearMarks();
      xh.forEach(e => e.classList.remove('sel')); yh.forEach(e => e.classList.remove('sel'));
      selected = { type, i: a, j: b };
      if (type === 'cell') { mark([[a, b]]); xh[a].classList.add('sel'); yh[b].classList.add('sel'); }
      if (type === 'col') { mark(J.ys.map((_, j) => [a, j])); xh[a].classList.add('sel'); }
      if (type === 'row') { mark(J.xs.map((_, i) => [i, a])); yh[a].classList.add('sel'); }
      showSelection();
      if (o.condPanel && (type === 'col' || type === 'row')) condition(type === 'col' ? 'x' : 'y', a, { animate: fromUser });
      if (o.onPick) o.onPick({ type, i: type === 'row' ? undefined : a, j: type === 'row' ? a : b, widget: self });
    }

    /* ------------------------------------------------------------ flowing */
    async function flowCol(i, opt = {}) {
      const animate = opt.animate !== false;
      mark(J.ys.map((_, j) => [i, j]));
      xh[i].classList.add('sel');
      const m = mxs[i];
      if (!m) return;
      m.classList.remove('ghost'); mhx && mhx.classList.remove('ghost');
      let acc = F(0);
      const v = m.querySelector('.v');
      if (!animate) { v.innerHTML = fmtV(F.sum(J.p[i])); m.classList.add('hot'); return; }
      v.innerHTML = '<span class="muted">…</span>';
      const flights = J.ys.map((_, j) => Lab.sleep(j * 140).then(() => Lab.fly(cells[i][j].querySelector('.v'), m, layer, { ms: 620 })).then(() => {
        acc = acc.add(J.p[i][j]);
        v.innerHTML = fmtV(acc);
        Lab.pulse(m);
      }));
      await Promise.all(flights);
      v.innerHTML = fmtV(F.sum(J.p[i]));
      m.classList.add('hot');
    }
    async function flowRow(j, opt = {}) {
      const animate = opt.animate !== false;
      mark(J.xs.map((_, i) => [i, j]));
      yh[j].classList.add('sel');
      const m = mys[j];
      if (!m) return;
      m.classList.remove('ghost'); mhy && mhy.classList.remove('ghost');
      let acc = F(0);
      const v = m.querySelector('.v');
      if (!animate) { v.innerHTML = fmtV(F.sum(J.p.map(r => r[j]))); m.classList.add('hot'); return; }
      v.innerHTML = '<span class="muted">…</span>';
      const flights = J.xs.map((_, i) => Lab.sleep(i * 110).then(() => Lab.fly(cells[i][j].querySelector('.v'), m, layer, { ms: 620 })).then(() => {
        acc = acc.add(J.p[i][j]);
        v.innerHTML = fmtV(acc);
        Lab.pulse(m);
      }));
      await Promise.all(flights);
      v.innerHTML = fmtV(F.sum(J.p.map(r => r[j])));
      m.classList.add('hot');
    }
    async function flowAll(axis, opt = {}) {
      const animate = opt.animate !== false;
      const n = axis === 'x' ? J.xs.length : J.ys.length;
      for (let k = 0; k < n; k++) {
        clearMarks();
        if (axis === 'x') await flowCol(k, { animate }); else await flowRow(k, { animate });
      }
      clearMarks();
      if (axis === 'x' && total) total.classList.remove('ghost');
    }

    /* --------------------------------------------------------- conditional */
    function clearPanel() { if (panel) { panel.hidden = true; Lab.clear(panel); } }
    async function condition(axis, k, opt = {}) {
      const animate = opt.animate !== false;
      clearMarks();
      const isX = axis === 'x';
      const keep = isX ? J.ys.map((_, j) => [k, j]) : J.xs.map((_, i) => [i, k]);
      dimExcept(keep);
      mark(keep);
      (isX ? xh[k] : yh[k]).classList.add('sel');
      const d = isX ? Lab.P.condYgivenX(J, k) : Lab.P.condXgivenY(J, k);
      Lab.clear(panel);
      panel.hidden = false;
      const given = isX ? xn() + '=' + Lab.fmtVal(J.xs[k]) : yn() + '=' + Lab.fmtVal(J.ys[k]);
      const other = isX ? yn() : xn();
      const slice = isX ? J.p[k] : J.p.map(r => r[k]);
      const vals = isX ? J.ys : J.xs;
      const tot = F.sum(slice);
      panel.appendChild(h('div', { class: 'jp-title', html: 'Slice where ' + Lab.tex(given) + ', then rescale it to total 1' }));
      if (!d) {
        panel.appendChild(h('div', { class: 'callout warn', html: '<div class="c-body">' + Lab.tex('P(' + given + ') = 0') + ': this never happens, so there is nothing to condition on.</div>' }));
        return;
      }
      const chartHost = h('div', { class: 'jp-chart' });
      panel.appendChild(chartHost);
      const bars = W.bars({ dist: { vals, p: slice }, tone: isX ? 'y' : 'x', height: 150, valueLabels: true, max: Math.max(...d.p.map(Number)) * 1.12, xName: other });
      bars.mount(chartHost);
      const rows = vals.map((v, t) => [
        Lab.tex(Lab.fmtVal(v)),
        Lab.tex(Lab.fmtTex(slice[t])),
        Lab.tex('\\div ' + Lab.fmtTex(tot)),
        '<b>' + Lab.tex(Lab.fmtTex(Number(tot) ? slice[t].div(tot) : F(0))) + '</b>',
      ]);
      const tbl = h('div', { class: 'tbl-wrap jp-table' });
      const t = h('table', { class: 'tbl' });
      t.appendChild(h('thead', {}, h('tr', {},
        h('th', { html: Lab.tex('t') }),
        h('th', { html: Lab.tex('f_{' + xn() + yn() + '}' + (isX ? '(' + Lab.fmtVal(J.xs[k]) + ',t)' : '(t,' + Lab.fmtVal(J.ys[k]) + ')')) }),
        h('th', { html: 'divide by ' + Lab.tex('f_{' + (isX ? xn() : yn()) + '}(' + Lab.fmtVal(isX ? J.xs[k] : J.ys[k]) + ')') }),
        h('th', { html: Lab.tex('f_{' + other + '\\mid ' + given + '}(t)') }))));
      const tb = h('tbody');
      rows.forEach(r => tb.appendChild(h('tr', {}, r.map(c => h('td', { html: c })))));
      t.appendChild(tb);
      tbl.appendChild(t);
      const sumLine = h('div', { class: 'jp-sum small', html: 'Slice total ' + Lab.tex('= ' + slice.map(v => Lab.fmtTex(v)).join(' + ') + ' = ' + Lab.fmtTex(tot)) });
      panel.appendChild(sumLine);
      panel.appendChild(tbl);
      tbl.style.opacity = animate ? '0' : '1';
      if (animate) {
        await Lab.sleep(500);
        bars.setCompare({ vals, p: slice });
        await bars.set({ vals, p: d.p }, { animate: true, ms: 900 });
        tbl.style.transition = 'opacity .4s';
        tbl.style.opacity = '1';
      } else {
        bars.setCompare({ vals, p: slice });
        bars.set({ vals, p: d.p }, { animate: false });
      }
      panel.appendChild(h('div', { class: 'xs muted', html: 'Dashed outlines: the slice before rescaling. Solid bars: after dividing by ' + Lab.tex(Lab.fmtTex(tot)) + ' — they now add up to 1.' }));
    }

    /* -------------------------------------------------------------- misc */
    function setJ(newJ) {
      const sameShape = newJ.xs.length === J.xs.length && newJ.ys.length === J.ys.length;
      J = newJ;
      if (!sameShape || !cells) { if (root) build(); return; }
      render();
      if (selected && o.condPanel && (selected.type === 'col' || selected.type === 'row')) condition(selected.type === 'col' ? 'x' : 'y', selected.i, { animate: false });
    }
    function setFmt(f) { o.fmt = f; render(); }
    function reset() {
      masked = o.masked ? J.xs.map(() => J.ys.map(() => true)) : null;
      clearMarks();
      xh.forEach(e => e.classList.remove('sel')); yh.forEach(e => e.classList.remove('sel'));
      [...(mxs || []), ...(mys || []), total].forEach(e => e && e.classList.remove('hot'));
      marginState = o.margins;
      render();
      applyMargins();
      clearPanel();
      selected = null;
      if (layer) Lab.clear(layer);
    }
    return self;
  };
})();
