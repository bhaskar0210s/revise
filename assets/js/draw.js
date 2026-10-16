/* Revise — small drawings of concrete things: dice, coins, playing cards, number tiles. */
(function () {
  'use strict';
  const { svg, h } = Lab;
  const D = (Lab.draw = {});

  const PIPS = {
    1: [[12, 12]],
    2: [[7, 7], [17, 17]],
    3: [[7, 7], [12, 12], [17, 17]],
    4: [[7, 7], [17, 7], [7, 17], [17, 17]],
    5: [[7, 7], [17, 7], [12, 12], [7, 17], [17, 17]],
    6: [[7, 6.5], [17, 6.5], [7, 12], [17, 12], [7, 17.5], [17, 17.5]],
  };
  /** A die face (1..6) as SVG. tone: 'x' | 'y' | 'z' | null */
  D.die = function (face, opts = {}) {
    const size = opts.size || 26;
    const el = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, class: 'die' + (opts.tone ? ' tone-' + opts.tone : ''), role: 'img', 'aria-label': 'die showing ' + face });
    el.appendChild(svg('rect', { x: 1, y: 1, width: 22, height: 22, rx: 5.5, class: 'die-body' }));
    (PIPS[face] || []).forEach(([cx, cy]) => el.appendChild(svg('circle', { cx, cy, r: 2.1, class: 'die-pip' })));
    if (!PIPS[face]) el.appendChild(svg('text', { x: 12, y: 16, 'text-anchor': 'middle', class: 'die-num' }, String(face)));
    return el;
  };
  /** A coin showing 'H' or 'T'. */
  D.coin = function (side, opts = {}) {
    const size = opts.size || 24;
    const el = svg('svg', { viewBox: '0 0 24 24', width: size, height: size, class: 'coin coin-' + (side === 'H' ? 'h' : 't'), role: 'img', 'aria-label': side === 'H' ? 'heads' : 'tails' });
    el.appendChild(svg('circle', { cx: 12, cy: 12, r: 11, class: 'coin-rim' }));
    el.appendChild(svg('circle', { cx: 12, cy: 12, r: 8.6, class: 'coin-face' }));
    el.appendChild(svg('text', { x: 12, y: 16.2, 'text-anchor': 'middle', class: 'coin-letter' }, side));
    return el;
  };
  /** A playing card. */
  D.card = function (rank, suit, opts = {}) {
    const w = opts.size || 30;
    const red = suit === '♥' || suit === '♦';
    const el = svg('svg', { viewBox: '0 0 30 42', width: w, height: (w * 42) / 30, class: 'pcard' + (red ? ' red' : ''), role: 'img', 'aria-label': rank + ' of ' + suit });
    el.appendChild(svg('rect', { x: 0.75, y: 0.75, width: 28.5, height: 40.5, rx: 4, class: 'pcard-body' }));
    el.appendChild(svg('text', { x: 4, y: 11, class: 'pcard-rank' }, rank));
    el.appendChild(svg('text', { x: 15, y: 30, 'text-anchor': 'middle', class: 'pcard-suit' }, suit));
    return el;
  };
  /** A number tile like "23". */
  D.tile = function (text, opts = {}) {
    return h('span', { class: 'ntile' + (opts.tone ? ' tone-' + opts.tone : ''), text: String(text) });
  };
  /** Draw an outcome from Lab.P spaces. */
  D.outcome = function (o, opts = {}) {
    const size = opts.size;
    const wrap = h('span', { class: 'oc oc-' + (o.kind || 'x') });
    if (o.kind === 'coins') [...o.v].forEach((c, i) => wrap.appendChild(D.coin(c, { size: size || 22, tone: opts.tones && opts.tones[i] })));
    else if (o.kind === 'dice') o.v.forEach((f, i) => wrap.appendChild(D.die(f, { size: size || 24, tone: opts.tones ? opts.tones[i] : i === 0 ? 'x' : i === 1 ? 'y' : 'z' })));
    else if (o.kind === 'card') wrap.appendChild(D.card(o.v.rank, o.v.suit, { size: size || 26 }));
    else wrap.appendChild(D.tile(o.label));
    return wrap;
  };
})();
