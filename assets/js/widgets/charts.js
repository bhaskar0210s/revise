/* Revise — PMF bar charts (HTML, so fractions stay crisp) and CDF staircase. */
(function () {
  'use strict';
  const { h, F } = Lab;
  const W = (Lab.W = Lab.W || {});

  /**
   * W.bars(opts) — a PMF as bars.
   *  dist        {vals, p}
   *  tone        'mass' | 'x' | 'y' | 'z' | 'pick'
   *  height      plot height in px (default 170)
   *  max         fixed top of the y-axis (e.g. 1); default: tallest bar
   *  valueLabels show the probability above each bar (default true)
   *  fmt         'frac' | 'dec'
   *  xName       axis name under the values (TeX), e.g. 'X' or 'X+Y'
   *  compare     a second distribution drawn as outlines (e.g. the true PMF)
   *  onPick      fn(k) when a bar is clicked
   *  minSlot     min width per bar in px
   */
  W.bars = function (opts) {
    const o = Object.assign({ tone: 'mass', height: 170, valueLabels: true, fmt: 'frac', minSlot: 34 }, opts);
    let dist = o.dist, compare = o.compare || null;
    let root, plot, axis, cols = [];
    const self = {
      mount(el) { root = el; build(); },
      set, setCompare, highlight, clearHighlight, bar: k => cols[k] && cols[k].bar, col: k => cols[k] && cols[k].col,
      label: k => cols[k] && cols[k].val, get dist() { return dist; }, reset() { clearHighlight(); },
      root: () => root,
    };
    const fmt = v => {
      if (v == null) return '';
      if (o.fmt === 'dec' || dist.float || (v instanceof Lab.Frac && v.approx)) return '<span class="fr-int">' + Lab.fmtSmall(v) + '</span>';
      if (o.den && v instanceof Lab.Frac) { const c = v.over(o.den); if (c) return c.n === 0 ? '<span class="fr-int">0</span>' : '<span class="fr"><span class="fr-n">' + c.n + '</span><span class="fr-d">' + c.d + '</span></span>'; }
      return Lab.fmtHtml(v);
    };
    function top() {
      if (o.max) return o.max;
      const all = dist.p.map(Number).concat(compare ? compare.p.map(Number) : []);
      return Math.max(...all, 1e-9) * 1.08;
    }
    function build() {
      Lab.clear(root);
      root.classList.add('w-bars', 'tone-' + o.tone);
      plot = h('div', { class: 'wb-plot' });
      plot.style.height = o.height + 'px';
      axis = h('div', { class: 'wb-axis' });
      cols = dist.vals.map((v, k) => {
        const val = h('div', { class: 'wb-val' });
        const bar = h('div', { class: 'wb-bar' });
        const ghost = h('div', { class: 'wb-ghost' });
        const col = h('div', { class: 'wb-col', dataset: { k } }, h('div', { class: 'wb-stack' }, ghost, bar), val);
        col.style.minWidth = o.minSlot + 'px';
        if (o.onPick) { col.classList.add('pickable'); col.addEventListener('click', () => o.onPick(k)); }
        plot.appendChild(col);
        const tick = h('div', { class: 'wb-tick', html: Lab.tex(Lab.fmtVal(v)) });
        tick.style.minWidth = o.minSlot + 'px';
        axis.appendChild(tick);
        return { col, bar, val, ghost, tick };
      });
      const sc = h('div', { class: 'wb-scroll' }, h('div', { class: 'wb-inner' }, plot, axis));
      root.appendChild(sc);
      if (o.xName) root.appendChild(h('div', { class: 'wb-name', html: 'values of ' + Lab.tex(o.xName) }));
      paint(false);
    }
    function paint(animate, ms = 600) {
      const t = top();
      const d = animate ? Lab.dur(ms) : 0;
      cols.forEach((c, k) => {
        const p = Number(dist.p[k] || 0);
        c.bar.style.transition = d ? 'height ' + d + 'ms cubic-bezier(.3,.7,.2,1)' : 'none';
        c.bar.style.height = Math.max(0, (p / t) * 100) + '%';
        c.bar.classList.toggle('zero', p === 0);
        c.val.innerHTML = o.valueLabels ? fmt(dist.p[k]) : '';
        c.val.style.bottom = 'calc(' + Math.min(100, (p / t) * 100) + '% + 4px)';
        c.val.style.transition = d ? 'bottom ' + d + 'ms cubic-bezier(.3,.7,.2,1)' : 'none';
        if (compare && compare.p[k] != null) {
          c.ghost.hidden = false;
          c.ghost.style.height = (Number(compare.p[k]) / t) * 100 + '%';
        } else c.ghost.hidden = true;
      });
      return new Promise(r => setTimeout(r, d + 20));
    }
    /** Replace the distribution. Same support → bars morph; different support → rebuild. */
    function set(nd, opt = {}) {
      const same = nd.vals.length === dist.vals.length && nd.vals.every((v, k) => Lab.sameVal(v, dist.vals[k]));
      dist = nd;
      if (!root) return Promise.resolve();
      if (!same) { build(); return Promise.resolve(); }
      return paint(opt.animate !== false, opt.ms);
    }
    function setCompare(cd) { compare = cd; if (root) paint(false); }
    function highlight(ks, cls = 'pick') { cols.forEach((c, k) => c.col.classList.toggle(cls, ks.includes(k))); }
    function clearHighlight() { cols.forEach(c => c.col.classList.remove('pick', 'dim', 'hot')); }
    return self;
  };

  /**
   * W.cdf(opts) — CDF staircase for a discrete distribution, with an optional marker at t.
   *  dist, tone, height, xName, t (marker position), showPmf (faint bars)
   */
  W.cdf = function (opts) {
    const o = Object.assign({ tone: 'mass', height: 180 }, opts);
    let dist = o.dist, root, svgEl, marker = o.t;
    const self = { mount(el) { root = el; draw(); }, set(d) { dist = d; draw(); }, mark(t) { marker = t; draw(); }, reset() { marker = o.t; draw(); } };
    function draw() {
      Lab.clear(root);
      root.classList.add('w-cdf', 'tone-' + o.tone);
      const vals = dist.vals.map(Number);
      const cum = Lab.P.cdf(dist).map(Number);
      const Wd = 560, H = o.height, padL = 40, padR = 16, padT = 14, padB = 34;
      const lo = vals[0] - 1, hi = vals[vals.length - 1] + 1;
      const X = v => padL + ((v - lo) / (hi - lo)) * (Wd - padL - padR);
      const Y = p => padT + (1 - p) * (H - padT - padB);
      svgEl = Lab.svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'cdf-svg', role: 'img', 'aria-label': 'CDF staircase' });
      [0, 0.25, 0.5, 0.75, 1].forEach(p => {
        svgEl.appendChild(Lab.svg('line', { x1: padL, x2: Wd - padR, y1: Y(p), y2: Y(p), class: 'grid' }));
        svgEl.appendChild(Lab.svg('text', { x: padL - 8, y: Y(p) + 4, 'text-anchor': 'end', class: 'tick' }, String(p)));
      });
      let prevP = 0, prevX = X(lo);
      vals.forEach((v, k) => {
        svgEl.appendChild(Lab.svg('line', { x1: prevX, x2: X(v), y1: Y(prevP), y2: Y(prevP), class: 'step' }));
        svgEl.appendChild(Lab.svg('line', { x1: X(v), x2: X(v), y1: Y(prevP), y2: Y(cum[k]), class: 'jump' }));
        svgEl.appendChild(Lab.svg('circle', { cx: X(v), cy: Y(prevP), r: 3.5, class: 'open' }));
        svgEl.appendChild(Lab.svg('circle', { cx: X(v), cy: Y(cum[k]), r: 3.5, class: 'closed' }));
        svgEl.appendChild(Lab.svg('text', { x: X(v), y: H - 12, 'text-anchor': 'middle', class: 'tick' }, Lab.fmtVal(vals[k])));
        prevP = cum[k]; prevX = X(v);
      });
      svgEl.appendChild(Lab.svg('line', { x1: prevX, x2: X(hi), y1: Y(prevP), y2: Y(prevP), class: 'step' }));
      if (marker != null) {
        const k = vals.filter(v => v <= marker).length - 1;
        const pv = k >= 0 ? cum[k] : 0;
        svgEl.appendChild(Lab.svg('line', { x1: X(marker), x2: X(marker), y1: Y(0), y2: Y(pv), class: 'marker' }));
        svgEl.appendChild(Lab.svg('circle', { cx: X(marker), cy: Y(pv), r: 5, class: 'marker-dot' }));
      }
      root.appendChild(svgEl);
      if (o.xName) root.appendChild(h('div', { class: 'wb-name', html: Lab.tex('F_{' + o.xName + '}(t) = P(' + o.xName + '\\le t)') }));
    }
    return self;
  };
})();
