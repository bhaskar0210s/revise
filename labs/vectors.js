/* Vector lab: arrows from the origin in ℝ¹, ℝ² and ℝ³, their linear combinations and what they span.

   A vector is an arrow with its tail at the origin. Its entries say how to walk to the tip: x along the x-axis, then y
   parallel to the y-axis, then z parallel to the z-axis, that is x·î + y·ĵ + z·k̂ with î, ĵ, k̂ the basis unit vectors.
   The span of some vectors is every combination c₁v₁ + c₂v₂ + …: only the origin, a line or a plane through the
   origin, or all of ℝⁿ. Rank, dependence and the equation of the line or plane are worked out with exact fractions
   (K.F); the drawing uses ordinary numbers. ℝ⁴ cannot be drawn; the Matrix lab works out span and independence there.

   Link: ?n=2&v=2,1;-1,2&on=1,2&show=bws&c=1,-0.5
     n     the space: 1, 2 or 3
     v     the vectors, ";" between vectors and "," between entries (3, -2/3, 0.5); up to 6 vectors, entries up to 100
     on    the vectors ticked for the span and the combination, numbered from 1 ("1,3"); empty for all, "-" for none
     show  b: î, ĵ, k̂ · w: the walk to the tip of the vector picked in the list · s: the span · c: the combination with
           a slider per ticked vector; "-" for none
     c     the scalars of the combination, one per vector, from −3 to 3 (missing ones are 1) */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, h, sv } = K;
  const Z = F(0), ONE = F(1);
  const MAXV = 6, MAXE = 100, CMAX = 3, AMP = 1.5;      // vectors, size of an entry, slider range, "Turn the knobs" swing
  const SUBS = '₀₁₂₃₄₅₆₇₈₉', sub = i => String(i).replace(/\d/g, d => SUBS[d]);
  const AX = ['x', 'y', 'z'], HAT = ['î', 'ĵ', 'k̂'], HATX = ['\\hat{\\imath}', '\\hat{\\jmath}', '\\hat{k}'];
  const YAW0 = -2.25, PITCH0 = 0.5;                     // ℝ³ seen from the front left, a little from above

  /* ------------------------------------------------------------------ styles (added once) */
  const CSS = `
.vl { --k0: var(--x); --k1: var(--y); --k2: var(--z); --k3: var(--pick); --k4: #c2378a; --k5: #6f7f00;
  display: grid; gap: 14px; grid-template-columns: minmax(0, 1fr); grid-template-areas: "stage" "panel" "more"; align-items: start; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .vl { --k4: #ff7cc6; --k5: #c2d24e; } }
:root[data-theme="dark"] .vl { --k4: #ff7cc6; --k5: #c2d24e; }
@media (min-width: 760px) {
  .vl { grid-template-columns: minmax(0, 330px) minmax(0, 1fr); grid-template-rows: auto 1fr; grid-template-areas: "panel stage" "panel more"; }
}
.vl .k0 { --c: var(--k0); } .vl .k1 { --c: var(--k1); } .vl .k2 { --c: var(--k2); }
.vl .k3 { --c: var(--k3); } .vl .k4 { --c: var(--k4); } .vl .k5 { --c: var(--k5); }
.vl .kr { --c: var(--ink); } .vl .kb { --c: var(--ink-3); }
.vl-stage, .vl-panel { padding: 14px; border-radius: var(--r-lg); background: var(--bg-elev); border: 1px solid var(--line); min-width: 0; }
.vl-stage { grid-area: stage; display: grid; gap: 10px; padding: 12px; }
.vl-panel { grid-area: panel; display: grid; gap: 12px; }
.vl-more { grid-area: more; display: grid; gap: 14px; min-width: 0; align-self: start; }
.vl-top { display: flex; gap: 8px; align-items: center; }
.vl-top .seg { flex: 1; }
.vl-top .seg button { padding: 0 4px; }
.vl-svg { display: block; width: 100%; height: auto; border-radius: 12px; border: 1px solid var(--line); background: var(--bg-elev);
  touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
.vl-svg.d3 { touch-action: none; cursor: grab; }
.vl-svg.d3.turning { cursor: grabbing; }
.vl-svg .vl-hit { fill: transparent; cursor: grab; touch-action: none; }
.vl-svg .vl-grid { stroke: var(--line); stroke-width: 1; }
.vl-svg .vl-axis { stroke: var(--ink-4); stroke-width: 1.5; }
.vl-svg .vl-axis.neg { stroke-dasharray: 4 4; opacity: .7; }
.vl-svg .vl-tk { fill: var(--ink-3); font: 11px var(--font); font-variant-numeric: tabular-nums; }
.vl-svg .vl-ax { fill: var(--ink-2); font: italic 600 14px var(--serif); }
.vl-svg .vl-shaft { stroke: var(--c); stroke-width: 3.2; stroke-linecap: round; fill: none; }
.vl-svg .vl-head { fill: var(--c); }
.vl-svg .kb .vl-shaft, .vl-svg .kb.vl-shaft { stroke-width: 2.2; }
.vl-svg .vl-dash .vl-shaft, .vl-svg .vl-shaft.vl-dash { stroke-width: 2; stroke-dasharray: 6 5; }
.vl-svg .off { opacity: .32; }
.vl-svg .vl-lb { fill: var(--c); font: 700 14px var(--font); paint-order: stroke; stroke: var(--bg-elev); stroke-width: 4px; stroke-linejoin: round; }
.vl-svg .vl-lb.sm { font-size: 12px; font-weight: 650; }
.vl-svg .vl-leg { stroke: var(--c); stroke-width: 1.8; stroke-dasharray: 5 4; fill: none; }
.vl-svg .vl-unit { fill: var(--c); }
.vl-svg .vl-span-fill { fill: color-mix(in srgb, var(--accent) 11%, transparent); }
.vl-svg .vl-span-plane { fill: color-mix(in srgb, var(--accent) 11%, transparent); stroke: color-mix(in srgb, var(--accent) 50%, transparent); stroke-width: 1.2; }
.vl-svg .vl-span-grid { stroke: color-mix(in srgb, var(--accent) 24%, transparent); stroke-width: 1; }
.vl-svg .vl-span-line { stroke: color-mix(in srgb, var(--accent) 30%, transparent); stroke-width: 10; stroke-linecap: round; }
.vl-svg .vl-span-mid { stroke: var(--accent); stroke-width: 1.2; opacity: .7; }
.vl-svg .vl-span-cube { stroke: color-mix(in srgb, var(--accent) 50%, transparent); stroke-width: 1.2; fill: none; }
.vl-svg .vl-span-dot { fill: color-mix(in srgb, var(--accent) 30%, transparent); stroke: var(--accent); stroke-width: 1.2; }
.vl-svg .vl-tag rect { fill: var(--bg-elev); stroke: var(--accent-line); }
.vl-svg .vl-tag text { fill: var(--accent-ink); font: 650 12.5px var(--font); }
.vl-svg .vl-trail { fill: color-mix(in srgb, var(--ink) 50%, transparent); }
.vl-svg .vl-origin { fill: var(--ink-2); }
.vl-hint { margin: 0; font-size: 13px; color: var(--ink-3); }
.vl-list { display: grid; }
.vl-row { display: grid; grid-template-columns: 26px 34px minmax(0, 1fr) 40px; gap: 4px 8px; align-items: center; padding: 8px 4px; border-top: 1px solid var(--line); border-radius: 10px; }
.vl-row.vl-head { border-top: 0; padding: 0 4px 4px; font-size: 12px; font-weight: 700; color: var(--ink-3); }
.vl-row.vl-head .vl-ins span { text-align: center; }
.vl-row.focus { background: var(--bg-sunk); }
.vl-tick { width: 20px; height: 20px; margin: 0; accent-color: var(--c); }
.vl-name { border: 0; padding: 0; background: none; color: var(--c); font: 700 17px var(--font); cursor: pointer; min-height: 44px; text-align: left; }
.vl-ins { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr); gap: 6px; }
.vl-in { min-width: 0; height: 44px; padding: 0 4px; text-align: center; font-variant-numeric: tabular-nums; }
.vl-in.bad { border-color: var(--bad); }
.vl-del { width: 40px; height: 40px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg-sunk); color: var(--ink-3); font-size: 20px; line-height: 1; cursor: pointer; }
.vl-del:disabled { opacity: .35; cursor: default; }
.vl-read { grid-column: 2 / 4; font-size: 14.5px; color: var(--ink-2); overflow-x: auto; }
.vl-read .vl-err { color: var(--bad); font-size: 13px; }
.vl-add { justify-self: start; }
.vl-opts { display: grid; }
.vl-try { display: flex; flex-wrap: wrap; gap: 6px; }
.vl-try .lk-chip { min-height: 40px; line-height: 1.25; padding: 6px 12px; text-align: left; color: var(--ink-2); }
.vl-note { margin: 0; font-size: 13px; color: var(--ink-3); }
.vl-combo { display: grid; gap: 8px; }
.vl [hidden] { display: none !important; }
.vl-crow { display: grid; grid-template-columns: 34px minmax(0, 1fr) 46px; gap: 8px; align-items: center; min-height: 44px; }
.vl-cname { color: var(--c); font-weight: 700; }
.vl-range { width: 100%; min-width: 0; accent-color: var(--c); height: 32px; }
.vl-cval { text-align: right; font-variant-numeric: tabular-nums; font-weight: 650; }
.vl-sum { min-width: 0; overflow-x: auto; color: var(--ink-2); }
.vl-sum .lk-wrap { margin: .1em 0; }
.vl-ok { color: var(--good); font-weight: 700; }
.vl-no { color: var(--bad); font-weight: 700; }
`;
  if (!document.getElementById('vl-css')) document.head.append(h('style', { id: 'vl-css', text: CSS }));

  /* ------------------------------------------------------------------ exact arithmetic */
  const babs = x => (x < 0n ? -x : x);
  const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  /** a number for maths: a decimal when it ends within 3 places (0.5), else a fraction */
  const tx = f => (f.isInt() || f.exactDecimal(3) ? f.dec(3) : f.tex());
  /** the same as plain text, with a real minus sign */
  const pt = f => (f.isInt() || f.exactDecimal(3) ? f.dec(3) : f.str()).replace('-', '−');
  const tup = fs => '(' + fs.map(tx).join(', ') + ')';
  const tupPlain = fs => '(' + fs.map(pt).join(', ') + ')';
  /** c₁a₁ + c₂a₂ + … in TeX; zero terms left out, 1 and −1 written as + a and − a */
  function comb(cs, names) {
    let out = '';
    cs.forEach((c, i) => {
      if (c.isZero()) return;
      const neg = c.cmp(Z) < 0, a = neg ? c.neg() : c;
      out += (out ? (neg ? ' - ' : ' + ') : neg ? '-' : '') + (a.eq(ONE) ? '' : tx(a)) + names[i];
    });
    return out || '0';
  }
  /** the columns (vectors) reduced: rank, the pivot columns, and each other column as a combination of earlier ones */
  function reduce(cols, n) {
    const k = cols.length, A = [];
    for (let i = 0; i < n; i++) A.push(cols.map(v => v[i]));
    const piv = [];
    let r = 0;
    for (let c = 0; c < k && r < n; c++) {
      let p = r;
      while (p < n && A[p][c].isZero()) p++;
      if (p === n) continue;
      [A[r], A[p]] = [A[p], A[r]];
      const inv = ONE.div(A[r][c]);
      A[r] = A[r].map(x => x.mul(inv));
      for (let i = 0; i < n; i++) if (i !== r && !A[i][c].isZero()) { const f = A[i][c]; A[i] = A[i].map((x, j) => x.sub(f.mul(A[r][j]))); }
      piv.push(c);
      r++;
    }
    // in the reduced form, a column without a leading 1 holds the multiples of the pivot columns before it
    const rel = [];
    for (let j = 0; j < k; j++) if (!piv.includes(j)) rel.push({ j, terms: piv.map((pc, t) => ({ i: pc, c: A[t][j] })).filter(x => x.i < j && !x.c.isZero()) });
    return { rank: r, piv, rel };
  }
  /** fractions → the smallest whole numbers in the same ratio, the first non-zero one positive */
  function ints(fs) {
    const L = fs.reduce((a, f) => (a / bgcd(a, f.d)) * f.d, 1n);
    let v = fs.map(f => f.n * (L / f.d));
    const g = v.reduce((a, x) => bgcd(a, x), 0n) || 1n;
    v = v.map(x => x / g);
    if ((v.find(x => x !== 0n) || 0n) < 0n) v = v.map(x => -x);
    return v;
  }
  const cross = (a, b) => [a[1].mul(b[2]).sub(a[2].mul(b[1])), a[2].mul(b[0]).sub(a[0].mul(b[2])), a[0].mul(b[1]).sub(a[1].mul(b[0]))];
  /** a·x + b·y + c·z = 0 from whole numbers, in TeX and as plain text */
  function equation(cs) {
    let t = '', p = '';
    cs.forEach((c, i) => {
      if (c === 0n) return;
      const neg = c < 0n, a = babs(c), coef = a === 1n ? '' : String(a);
      t += (t ? (neg ? ' - ' : ' + ') : neg ? '-' : '') + coef + AX[i];
      p += (p ? (neg ? ' − ' : ' + ') : neg ? '−' : '') + coef + AX[i];
    });
    return { tex: t + ' = 0', plain: p + ' = 0' };
  }
  const AXIS = ['the $x$-axis', 'the $y$-axis', 'the $z$-axis'], PLANE = ['the $yz$-plane', 'the $xz$-plane', 'the $xy$-plane'];
  /** what the span of the vectors cols in ℝⁿ is: { rank, piv, rel, shape, tex (an equation or a set), plain, name } */
  function spanOf(cols, n) {
    const red = reduce(cols, n), r = red.rank, out = { ...red };
    if (r === 0) return Object.assign(out, { shape: 'only the origin', tex: '\\{\\mathbf{0}\\}', plain: 'only 0', tag: 'span = {0}' });
    if (r === n) return Object.assign(out, { shape: n === 1 ? 'the whole number line' : n === 2 ? 'the whole plane' : 'all of space', tex: '\\mathbb{R}^{' + n + '}', plain: 'ℝ' + '¹²³'[n - 1], tag: 'span = ℝ' + '¹²³'[n - 1] });
    const p = red.piv.map(i => cols[i]);
    if (r === 1) {
      const d = ints(p[0]);
      if (n === 2) {   // the line b·x − a·y = 0 through the origin and (a, b)
        const [a, b] = p[0];
        if (a.isZero()) return Object.assign(out, { shape: 'a line through the origin', tex: 'x = 0', plain: 'x = 0', tag: 'span: the line x = 0', name: AXIS[1] });
        const m = b.div(a), one = m.eq(ONE) ? 'x' : m.eq(F(-1)) ? '-x' : null;
        const frac = !m.isInt() && !m.exactDecimal(3), mp0 = pt(m);
        const mx = m.isZero() ? '0' : one || tx(m) + 'x', mp = m.isZero() ? '0' : one ? one.replace('-', '−') : frac ? (mp0[0] === '−' ? '−(' + mp0.slice(1) + ')x' : '(' + mp0 + ')x') : mp0 + 'x';
        return Object.assign(out, { shape: 'a line through the origin', tex: 'y = ' + mx, plain: 'y = ' + mp, tag: 'span: the line y = ' + mp, name: m.isZero() ? AXIS[0] : null });
      }
      const axis = d.filter(x => x !== 0n).length === 1 ? AXIS[d.findIndex(x => x !== 0n)] : null;
      const dir = '(' + d.join(', ') + ')';
      return Object.assign(out, { shape: 'a line through the origin', tex: '\\{\\, t\\,' + dir + ' : t \\in \\mathbb{R} \\,\\}', plain: 'the line t·' + dir.replace(/-/g, '−'), tag: 'span: the line t·' + dir.replace(/-/g, '−'), name: axis, dir: d });
    }
    const nrm = ints(cross(p[0], p[1])), eq = equation(nrm);
    const plane = nrm.filter(x => x !== 0n).length === 1 ? PLANE[nrm.findIndex(x => x !== 0n)] : null;
    return Object.assign(out, { shape: 'a plane through the origin', tex: eq.tex, plain: eq.plain, tag: 'span: the plane ' + eq.plain, name: plane, normal: nrm });
  }

  /* ------------------------------------------------------------------ drawing helpers */
  const q = v => Math.round(v * 10) / 10;
  const LADDER2 = [3.5, 5, 7, 10, 14, 20, 30, 50, 70, 100, 140, 200, 300];
  const LADDER3 = [3, 4, 5, 6, 8, 10, 12, 15, 20, 30, 40, 50, 100, 150, 200, 300];
  const step3 = L => (L <= 6 ? 1 : L <= 12 ? 2 : L <= 30 ? 5 : L <= 100 ? 10 : 50);
  const gridStep = sc => [1, 2, 5, 10, 20, 50, 100].find(s => s * sc >= 18) || 100;
  const fmtTick = v => String(+v.toFixed(6)).replace('-', '−');
  /** an arrow from (x1, y1) to (x2, y2) in screen units */
  function arrow(g, x1, y1, x2, y2, cls, head = 13) {
    const L = Math.hypot(x2 - x1, y2 - y1), gr = sv('g', { class: cls });
    if (L < 2) { gr.append(sv('circle', { cx: q(x2), cy: q(y2), r: 4, class: 'vl-head' })); g.append(gr); return gr; }
    const ux = (x2 - x1) / L, uy = (y2 - y1) / L, hl = Math.min(head, L * 0.55), hw = hl * 0.5, bx = x2 - ux * hl, by = y2 - uy * hl;
    gr.append(sv('line', { x1: q(x1), y1: q(y1), x2: q(bx + ux * 2), y2: q(by + uy * 2), class: 'vl-shaft' }));
    gr.append(sv('path', { d: 'M' + q(x2) + ' ' + q(y2) + 'L' + q(bx - uy * hw) + ' ' + q(by + ux * hw) + 'L' + q(bx + uy * hw) + ' ' + q(by - ux * hw) + 'Z', class: 'vl-head' }));
    g.append(gr);
    return gr;
  }
  function label(g, x, y, text, cls, W, H, anchor) {
    const pad = 10;
    x = Math.max(pad, Math.min(W - pad, x)); y = Math.max(pad + 2, Math.min(H - pad, y));
    const t = sv('text', { x: q(x), y: q(y), 'text-anchor': anchor || 'middle', 'dominant-baseline': 'middle', class: 'vl-lb ' + (cls || '') });
    String(text).split('k̂').forEach((part, i, all) => {
      if (i) t.append(sv('tspan', { dx: '0.06em', dy: '0.16em' }, part)); else if (part) t.append(part);
      if (i < all.length - 1) t.append(sv('tspan', {}, 'k'), sv('tspan', { dx: '-0.5em', dy: '-0.16em' }, 'ˆ'));
    });
    g.append(t);
  }
  /** a label just past the tip of an arrow from (x1, y1) to (x2, y2) */
  function tipLabel(g, x1, y1, x2, y2, text, cls, W, H) {
    const L = Math.hypot(x2 - x1, y2 - y1) || 1, ux = (x2 - x1) / L, uy = (y2 - y1) / L;
    label(g, x2 + ux * 16 + (L < 4 ? 12 : 0), y2 + uy * 16 - (L < 4 ? 12 : 0), text, cls, W, H);
  }
  /** a pill in the top left corner saying what the span is */
  function tag(g, text) {
    const w = 14 + text.length * 7.1, gr = sv('g', { class: 'vl-tag' });
    gr.append(sv('rect', { x: 8, y: 8, width: q(w), height: 24, rx: 12 }), sv('text', { x: 15, y: 20.5, 'dominant-baseline': 'middle' }, text));
    g.append(gr);
  }
  /** the 3D camera: turn by yaw about the z-axis, then tilt by pitch; orthographic */
  function camera(yaw, pitch, sc, ox, oy) {
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const P = p => {
      const x1 = p[0] * cy - p[1] * sy, y1 = p[0] * sy + p[1] * cy, up = p[2] * cp + y1 * sp;
      return [ox + x1 * sc, oy - up * sc, y1 * cp - p[2] * sp];     // screen x, screen y, depth (larger is further away)
    };
    // the point at height z0 under the screen point (X, Y): for moving a tip level with the floor
    P.floor = (X, Y, z0) => {
      if (Math.abs(sp) < 0.2) return null;
      const x1 = (X - ox) / sc, y1 = ((oy - Y) / sc - z0 * cp) / sp;
      return [x1 * cy + y1 * sy, -x1 * sy + y1 * cy];
    };
    return P;
  }
  /** the part of the line a + t·d inside the cube [−L, L]³, or null */
  function clipCube(a, d, L) {
    let t0 = -Infinity, t1 = Infinity;
    for (let i = 0; i < 3; i++) {
      if (Math.abs(d[i]) < 1e-12) { if (Math.abs(a[i]) > L) return null; continue; }
      let u = (-L - a[i]) / d[i], v = (L - a[i]) / d[i];
      if (u > v) [u, v] = [v, u];
      t0 = Math.max(t0, u); t1 = Math.min(t1, v);
    }
    return t0 < t1 ? [a.map((x, i) => x + t0 * d[i]), a.map((x, i) => x + t1 * d[i])] : null;
  }
  const CORNERS = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) CORNERS.push([x, y, z]);
  const EDGES = [];
  CORNERS.forEach((a, i) => CORNERS.forEach((b, j) => { if (j > i && a.filter((x, k) => x !== b[k]).length === 1) EDGES.push([i, j]); }));
  /** the polygon where the plane n·p = 0 cuts the cube [−L, L]³, in order around it */
  function planeInCube(nrm, L) {
    const C = CORNERS.map(c => c.map(x => x * L)), f = p => nrm[0] * p[0] + nrm[1] * p[1] + nrm[2] * p[2];
    const pts = [];
    EDGES.forEach(([i, j]) => {
      const a = C[i], b = C[j], fa = f(a), fb = f(b);
      if (Math.abs(fa) < 1e-9) pts.push(a);
      if ((fa < -1e-9 && fb > 1e-9) || (fa > 1e-9 && fb < -1e-9)) { const t = fa / (fa - fb); pts.push(a.map((x, k) => x + t * (b[k] - x))); }
    });
    const uniq = pts.filter((p, i) => pts.findIndex(o => Math.hypot(o[0] - p[0], o[1] - p[1], o[2] - p[2]) < 1e-6) === i);
    const nn = Math.hypot(...nrm), u = Math.abs(nrm[0]) < 0.9 * nn ? [1, 0, 0] : [0, 1, 0];
    const e1 = norm3(cross3(nrm, u)), e2 = norm3(cross3(nrm, e1));
    return uniq.sort((p, o) => Math.atan2(dot3(p, e2), dot3(p, e1)) - Math.atan2(dot3(o, e2), dot3(o, e1)));
  }
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm3 = a => { const l = Math.hypot(...a) || 1; return a.map(x => x / l); };
  /** convex hull of screen points (for the shaded cube) */
  function hull(ps) {
    ps = ps.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of ps) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (const p of ps.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  /* ------------------------------------------------------------------ starting values */
  const DEF = { 1: { v: '3;-1.5', on: '' }, 2: { v: '2,1;-1,2', on: '' }, 3: { v: '-1,0,2;2,-1,0;1,1,1', on: '1,2' } };
  // "Add a vector" takes the first of these that is not in the list yet
  const NEXT = {
    1: ['1', '-2', '2.5', '-1', '4', '0.5', '-3'],
    2: ['1,3', '-2,1', '3,-1', '-1,-2', '2,2', '0,-3', '-3,0'],
    3: ['1,1,2', '-1,2,0', '0,0,2', '2,-1,1', '1,1,1', '-2,0,1', '0,-2,-1'],
  };
  const TRY = {
    1: [['A vector and its opposite', '3;-1.5', ''], ['Only the zero vector', '0', '']],
    2: [['Two directions: all of ℝ²', '2,1;-1,2', ''], ['Both on one line', '2,1;-4,-2', ''], ['Both zero: stuck at 0', '0,0;0,0', ''], ['Three vectors in ℝ²', '2,1;-1,2;1,3', '']],
    3: [['Two vectors: a plane', '-1,0,2;2,-1,0;1,1,1', '1,2'], ['A third in that plane', '-1,0,2;2,-1,0;1,-1,2', ''], ['A third outside: all of ℝ³', '-1,0,2;2,-1,0;1,1,1', ''], ['Just $\\hat\\imath$, $\\hat\\jmath$ and $\\hat k$', '1,0,0;0,1,0;0,0,1', ''], ['All on one line', '1,2,2;-2,-4,-4', '']],
  };

  REV.lab('vectors', {
    /* ---------------------------------------------------------------- arrows, combinations and span */
    // ?n=2&v=2,1;-1,2&on=1,2&show=bws&c=1,1
    span(el, query, ctx) {
      const s = K.state(ctx, { n: 2, v: '', on: '', show: 'bws', c: '' }, query, null);
      let n = [1, 2, 3].includes(s.v.n) ? s.v.n : 2;
      const show = new Set(s.v.show === '-' ? [] : String(s.v.show).split('').filter(x => 'bwsc'.includes(x)));
      let V = [], on = [], C = [], focus = 0, warn = '', info = null;
      let yaw = YAW0, pitch = PITCH0, view = null, frozen = false, drag = null, trail = [], play = null, frame = 0;
      const mem = {};
      const ticked = () => V.map((_, i) => i).filter(i => on[i]);
      const num = v => v.e.map(x => x.num());

      /* ---- the values: from the link, and back into it */
      function load(vstr, onstr, cstr) {
        warn = '';
        const groups = String(vstr || '').split(';').map(g => g.trim()).filter(Boolean);
        if (groups.length > MAXV) warn = 'Only the first ' + MAXV + ' vectors are used.';
        V = groups.slice(0, MAXV).map(g => {
          const parts = g.split(','), e = [], st = [];
          for (let j = 0; j < n; j++) {
            const t = (parts[j] || '').trim() || '0';
            try { const f = F.parse(t); if (Math.abs(f.num()) > MAXE) throw new Error('big'); e.push(f); st.push(t); }
            catch (err) { e.push(Z); st.push('0'); warn = 'Some entries in the link were not numbers from −' + MAXE + ' to ' + MAXE + ', so they are 0 here.'; }
          }
          return { e, s: st };
        });
        if (!V.length) { V = DEF[n].v.split(';').map(g => { const st = g.split(','); return { e: st.map(x => F.parse(x)), s: st }; }); onstr = DEF[n].on; }
        const ids = onstr === '-' ? [] : !onstr ? V.map((_, i) => i + 1) : String(onstr).split(',').map(Number);
        on = V.map((_, i) => ids.includes(i + 1));
        const cs = String(cstr || '').split(',');
        C = V.map((_, i) => { const x = parseFloat(cs[i]); return isFinite(x) ? Math.max(-CMAX, Math.min(CMAX, Math.round(x * 100) / 100)) : 1; });
        focus = Math.max(0, Math.min(focus, V.length - 1));
      }
      const vStr = () => V.map(v => v.s.map(t => t.replace(/\s+/g, '')).join(',')).join(';');
      const onStr = () => (on.every(Boolean) ? '' : on.some(Boolean) ? on.map((x, i) => (x ? i + 1 : 0)).filter(Boolean).join(',') : '-');
      const showStr = () => (show.size ? 'bwsc'.split('').filter(x => show.has(x)).join('') : '-');
      const cStr = () => (C.every(c => c === 1) ? '' : C.map(c => +c.toFixed(2)).join(','));
      const link = () => s.set({ n, v: vStr(), on: onStr(), show: showStr(), c: cStr() }, true);

      /* ---- the page */
      const root = h('div', { class: 'vl' });
      const segBox = h('div', { class: 'vl-segbox', style: 'flex: 1; min-width: 0' });
      const resetBtn = h('button', { type: 'button', class: 'btn sm', text: 'Reset view', onclick: () => { yaw = YAW0; pitch = PITCH0; draw(); } });
      const svg = sv('svg', { class: 'vl-svg', role: 'img' });
      const combo = h('div', { class: 'vl-combo', hidden: true });
      const hint = h('p', { class: 'vl-hint' });
      const stage = h('section', { class: 'vl-stage', 'aria-label': 'The drawing' }, h('div', { class: 'vl-top' }, segBox, resetBtn), svg, combo, hint);
      const list = h('div', { class: 'vl-list' });
      const addBtn = h('button', { type: 'button', class: 'btn sm vl-add', text: '+ Add a vector', onclick: add });
      const opts = h('div', { class: 'vl-opts' });
      const tries = h('div', { class: 'vl-try' });
      const note4 = h('p', { class: 'vl-note' });
      const panel = h('section', { class: 'vl-panel', 'aria-label': 'Your vectors' }, h('h2', { class: 'lk-h', text: 'Your vectors' }), list, addBtn, opts, h('div', { class: 'lk-label', text: 'Try' }), tries, note4);
      const more = h('div', { class: 'vl-more' });
      root.append(stage, panel, more);
      el.append(root);

      function build() {
        segBox.replaceChildren(REV.seg([[1, 'ℝ¹ line'], [2, 'ℝ² plane'], [3, 'ℝ³ space']], n, v => switchTo(+v)));
        resetBtn.hidden = n !== 3;
        svg.classList.toggle('d3', n === 3);
        hint.textContent = n === 1 ? 'Drag a tip to move it along the line.' : n === 2 ? 'Drag a tip to move it, or type its entries in the list.' : 'Drag the space to turn it. Drag a tip to slide it level with the floor; type z in the list.';
        buildList(); buildOpts(); buildTries(); buildCombo();
        const vs = V.map(v => v.s.join(',')).join(';');
        note4.innerHTML = K.rich('ℝ⁴ and beyond cannot be drawn: we can only see three directions at once. The algebra is the same, and the <a href="#/labs/matrix/independence?v=' + encodeURIComponent(vs).replace(/%2C/g, ',').replace(/%3B/g, ';').replace(/%2F/g, '/') + '">Matrix lab</a> works it out step by step, in ℝ⁴ too.');
        refresh();
      }
      function refresh() {
        const idx = ticked();
        info = idx.length ? spanOf(idx.map(i => V[i].e), n) : null;
        draw(); verdict(); readings(); sumLine();
      }
      function switchTo(m) {
        if (m === n) return;
        stopPlay();
        mem[n] = { v: vStr(), on: onStr(), c: cStr() };
        n = m;
        const d = mem[n] || { v: DEF[n].v, on: DEF[n].on, c: '' };
        focus = 0; trail = []; view = null;
        load(d.v, d.on, d.c);
        build(); link();
      }

      /* ---- the list of vectors */
      let rows = [];
      function buildList() {
        rows = [];
        const head = h('div', { class: 'vl-row vl-head', 'aria-hidden': 'true' }, h('span', { text: 'span' }), h('span'), h('div', { class: 'vl-ins' }, AX.slice(0, n).map(a => h('span', { text: a }))), h('span'));
        list.replaceChildren(head, ...V.map((_, i) => rowOf(i)));
        addBtn.disabled = V.length >= MAXV;
      }
      function rowOf(i) {
        const k = 'k' + i, nm = 'v' + sub(i + 1);
        const tick = h('input', { type: 'checkbox', class: 'vl-tick ' + k, checked: on[i] ? true : null, 'aria-label': nm + ' in the span' });
        tick.addEventListener('change', () => { on[i] = tick.checked; stopPlay(); trail = []; buildCombo(); refresh(); link(); });
        const name = h('button', { type: 'button', class: 'vl-name ' + k, text: nm, title: 'Show how to walk to the tip of ' + nm, onclick: () => { focus = i; if (!show.has('w')) { show.add('w'); buildOpts(); } refresh(); link(); } });
        const err = h('div', { class: 'vl-err', hidden: true });
        const ins = V[i].s.map((t, j) => {
          const inp = h('input', { class: 'field vl-in', type: 'text', value: t, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next', 'aria-label': nm + ', entry ' + AX[j] });
          inp.addEventListener('focus', () => { if (focus !== i) { focus = i; refresh(); } });
          inp.addEventListener('input', () => {
            try {
              const f = F.parse(inp.value);
              if (Math.abs(f.num()) > MAXE) throw new Error('Keep entries from −' + MAXE + ' to ' + MAXE + '.');
              inp.classList.remove('bad'); err.hidden = true;
              V[i].e[j] = f; V[i].s[j] = inp.value.trim(); focus = i; trail = []; view = null;
              refresh(); link();
            } catch (e) { inp.classList.add('bad'); err.textContent = e.message === 'empty' ? 'Type a number.' : e.message; err.hidden = false; }
          });
          return inp;
        });
        const del = h('button', { type: 'button', class: 'vl-del', 'aria-label': 'Remove ' + nm, text: '×', disabled: V.length < 2 ? true : null, onclick: () => remove(i) });
        const read = h('span', { class: 'vl-math' });
        const row = h('div', { class: 'vl-row' + (i === focus ? ' focus' : '') }, tick, name, h('div', { class: 'vl-ins' }, ins), del, h('div', { class: 'vl-read' }, read, err));
        rows[i] = { row, ins, read };
        return row;
      }
      /** under each vector: how it is built from the basis unit vectors */
      function readings() {
        rows.forEach((r, i) => {
          if (!r) return;
          r.row.classList.toggle('focus', i === focus);
          r.read.innerHTML = K.kx('= ' + comb(V[i].e, HATX.slice(0, n)));
        });
      }
      function add() {
        if (V.length >= MAXV) return;
        stopPlay();
        const key = e => e.map(x => x.str()).join(','), have = new Set(V.map(v => key(v.e)));
        const pick = NEXT[n].find(t => !have.has(key(t.split(',').map(x => F.parse(x))))) || NEXT[n][0];
        const st = pick.split(',');
        V.push({ e: st.map(x => F.parse(x)), s: st });
        on.push(true); C.push(1);
        focus = V.length - 1; trail = []; view = null;
        buildList(); buildCombo(); refresh(); link();
      }
      function remove(i) {
        if (V.length < 2) return;
        stopPlay();
        V.splice(i, 1); on.splice(i, 1); C.splice(i, 1);
        focus = Math.min(focus > i ? focus - 1 : focus, V.length - 1); trail = []; view = null;
        buildList(); buildCombo(); refresh(); link();
      }

      /* ---- what is drawn */
      function buildOpts() {
        const hats = '$' + HATX.slice(0, n).join(', ') + '$';
        const walk = '$' + AX.slice(0, n).map((a, j) => a + HATX[j]).join(' + ') + '$';
        const item = (key, text) => K.check({ label: text, value: show.has(key), onChange: v => {
          if (v) show.add(key); else show.delete(key);
          if (key === 'c') { stopPlay(); trail = []; buildCombo(); view = null; }
          refresh(); link();
        } });
        opts.replaceChildren(
          item('b', (n === 1 ? 'The basis unit vector ' : 'The basis unit vectors ') + hats),
          item('w', 'The walk to the tip: ' + walk),
          item('s', 'The span of the ticked vectors'),
          item('c', 'Combine them: $c_1v_1 + c_2v_2 + \\dots$'));
      }
      function buildTries() {
        tries.replaceChildren(...TRY[n].map(([text, v, onl]) => h('button', { type: 'button', class: 'lk-chip', html: K.rich(text), onclick: () => {
          stopPlay(); focus = 0; trail = []; view = null;
          load(v, onl, '');
          show.add('s');
          build(); link();
        } })));
      }

      /* ---- the combination: a slider per ticked vector */
      let sliders = [], sum = null, playBtn = null;
      const fmtC = c => (c < 0 ? '−' : '') + String(+Math.abs(c).toFixed(2));
      function buildCombo() {
        sliders = []; sum = null; playBtn = null;
        combo.hidden = !show.has('c');
        if (combo.hidden) { combo.replaceChildren(); return; }
        const idx = ticked();
        if (!idx.length) { combo.replaceChildren(h('p', { class: 'vl-hint', text: 'Tick a vector in the list to combine it.' })); return; }
        const crows = idx.map(i => {
          const r = h('input', { type: 'range', min: -CMAX, max: CMAX, step: 0.1, value: C[i], class: 'vl-range k' + i, 'aria-label': 'c' + sub(i + 1) + ', the number that scales v' + sub(i + 1) });
          const val = h('output', { class: 'vl-cval', text: fmtC(C[i]) });
          r.addEventListener('input', () => { stopPlay(); C[i] = +r.value; val.textContent = fmtC(C[i]); addTrail(); draw(); sumLine(); });
          r.addEventListener('change', link);
          sliders[i] = { r, val };
          return h('label', { class: 'vl-crow' }, h('span', { class: 'vl-cname k' + i, html: K.kx('c_{' + (i + 1) + '}') }), r, val);
        });
        sum = h('div', { class: 'vl-sum' });
        playBtn = h('button', { type: 'button', class: 'btn sm', text: '▶ Turn the knobs', onclick: () => (play ? stopPlay() : startPlay()) });
        const clear = h('button', { type: 'button', class: 'btn sm', text: 'Clear the trail', onclick: () => { trail = []; draw(); } });
        combo.replaceChildren(h('div', {}, crows), sum, h('div', { class: 'lk-row' }, playBtn, clear));
        sumLine();
      }
      /** c₁v₁ + c₂v₂ = 1.5(2, 1) + (−1)(0, 3) = (3, −1.5), exact for the rounded scalars shown */
      function sumLine() {
        if (!sum) return;
        const idx = ticked(), cs = idx.map(i => F.parse(C[i].toFixed(2)));
        const res = [0, 1, 2].slice(0, n).map(j => idx.reduce((a, i, t) => a.add(cs[t].mul(V[i].e[j])), Z));
        const par = c => (c.cmp(Z) < 0 ? '(' + tx(c) + ')' : tx(c));
        sum.innerHTML = K.wrap(idx.map(i => 'c_{' + (i + 1) + '}v_{' + (i + 1) + '}').join(' + ') + ' = ' + idx.map((i, t) => par(cs[t]) + '\\,' + tup(V[i].e)).join(' + ') + ' = ' + tup(res));
      }
      function result() {
        const r = [0, 0, 0];
        ticked().forEach(i => V[i].e.forEach((x, j) => { r[j] += C[i] * x.num(); }));
        return r.slice(0, n);
      }
      function addTrail() {
        if (!show.has('c') || !ticked().length) return;
        trail.push(result());
        if (trail.length > 1200) trail.splice(0, trail.length - 1200);
      }
      function startPlay() {
        const idx = ticked();
        if (!idx.length || play) return;
        const W0 = [0.9, 1.31, 1.73, 2.21, 2.67, 3.11], t0 = performance.now();
        // how far the tip can reach in each direction with every knob at 1, and how much room the drawing has
        const reach = [0, 1, 2].slice(0, n).map(j => idx.reduce((a, i) => a + Math.abs(V[i].e[j].num()), 0));
        const room = n === 3 ? reach.map(() => 1.15 * view.L) : [view.W / 2 / view.sc * 0.92, view.H / 2 / view.sc * 0.92];
        const amp = Math.min(AMP, ...reach.map((r, j) => (r > 1e-9 ? room[j] / r : Infinity)));
        const ph = idx.map(i => Math.asin(Math.max(-1, Math.min(1, C[i] / amp))));   // start from where the sliders are
        play = { raf: 0 };
        playBtn.textContent = '❚❚ Stop';
        const tick = now => {
          if (!play) return;
          if (!svg.isConnected) { play = null; return; }
          const t = (now - t0) / 1000;
          idx.forEach((i, k) => {
            C[i] = amp * Math.sin(ph[k] + W0[k] * t);
            if (sliders[i]) { sliders[i].r.value = C[i]; sliders[i].val.textContent = fmtC(C[i]); }
          });
          addTrail(); draw(); sumLine();
          play.raf = requestAnimationFrame(tick);
        };
        play.raf = requestAnimationFrame(tick);
      }
      function stopPlay() {
        if (!play) return;
        cancelAnimationFrame(play.raf);
        play = null;
        C = C.map(c => Math.round(c * 10) / 10);
        sliders.forEach((x, i) => { if (x) { x.r.value = C[i]; x.val.textContent = fmtC(C[i]); } });
        if (playBtn) playBtn.textContent = '▶ Turn the knobs';
        view = null;
        draw(); sumLine(); link();
      }

      /* ---- the verdict on the span */
      function verdict() {
        more.replaceChildren();
        if (warn) more.append(K.note(warn, 'warn'));
        if (!show.has('s')) return;
        const idx = ticked();
        if (!idx.length) { more.append(K.card('Span', K.p('Tick vectors in the list (the boxes on the left) to see what they span.'))); return; }
        const r = info.rank, k = idx.length, Rn = '$\\mathbb{R}^{' + n + '}$', names = idx.map(i => 'v_{' + (i + 1) + '}');
        const set = '\\operatorname{span}\\{' + names.join(', ') + '\\}';
        const nameOf = j => '$v_{' + (idx[j] + 1) + '}$', list = js => js.map(nameOf).join(', ').replace(/, ([^,]*)$/, ' and $1');
        const ans = r === n ? set + ' = \\mathbb{R}^{' + n + '}' : r === 0 ? set + ' = \\{\\mathbf{0}\\}' : info.tex;
        const head = r === n ? 'The span is all of ' + Rn : 'The span is ' + info.shape + (info.name ? ', ' + info.name : '');
        const covers = r === n
          ? '<span class="vl-ok">✓ Covers ' + Rn + '.</span> Every vector of ' + Rn + ' is some combination of ' + list(idx.map((_, j) => j)) + '.'
          : '<span class="vl-no">✗ Does not cover ' + Rn + '.</span> ' + (r === 0 ? 'Every combination of zero vectors is $\\mathbf{0}$.' : 'It has ' + r + ' independent direction' + (r > 1 ? 's' : '') + '; ' + Rn + ' needs ' + n + '.') + (k < n ? ' Fewer than ' + n + ' vectors can never cover ' + Rn + '.' : '');
        const lines = [];
        if (r && r === k) lines.push(k === 1 ? 'One non-zero vector: its multiples $t' + names[0] + '$ fill ' + (n === 1 ? 'the whole line' : 'a line through the origin') + '.' : 'No ticked vector is a combination of the others, so each one adds a new direction: they are <b>linearly independent</b>.');
        info.rel.forEach(({ j, terms }) => {
          const v = nameOf(j);
          if (!terms.length) lines.push(v + ' is the zero vector, so it adds nothing.');
          else lines.push('$v_{' + (idx[j] + 1) + '} = ' + comb(terms.map(x => x.c), terms.map(x => 'v_{' + (idx[x.i] + 1) + '}')) + '$: already in the span of ' + list(terms.map(x => x.i)) + ', so it adds nothing. Remove it and the span stays the same.');
        });
        if (r < k) lines.push('So the ticked vectors are <b>linearly dependent</b>.');
        if (r === n && k === n) lines.push('Independent and covering ' + Rn + ': ' + list(idx.map((_, j) => j)) + (k === 1 ? ' is' : ' are') + ' a <b>basis</b> of ' + Rn + '. Each vector of ' + Rn + ' is exactly one combination of ' + (k === 1 ? 'it' : 'them') + '.');
        else if (r === n) lines.push('They cover ' + Rn + ' but are not a basis: ' + (n === 1 ? 'two or more vectors in ' + Rn + ' are' : 'more than ' + n + ' vectors in ' + Rn + ' are') + ' always dependent. ' + list(info.piv) + ' alone ' + (n === 1 ? 'is' : 'are') + ' a basis.');
        else if (r) lines.push('Not a basis of ' + Rn + ': that needs ' + n + ' independent vectors. ' + list(info.piv) + (r === 1 ? ' is a basis of the line.' : ' are a basis of the plane.'));
        more.append(K.card('Span', K.answer(head, ans, covers), ...lines.map(t => K.p(t))));
      }

      /* ---- the drawing */
      function points() {
        const ps = V.map(num);
        if (show.has('c')) {
          let at = [0, 0, 0].slice(0, n);
          ticked().forEach(i => { at = at.map((x, j) => x + C[i] * V[i].e[j].num()); ps.push(at); });
        }
        return ps;
      }
      function draw() {
        const W = Math.max(240, Math.round(svg.getBoundingClientRect().width || 600));
        const H = n === 1 ? 92 + 30 * V.length + (show.has('c') ? 18 + 12 * ticked().length : 0) : Math.round(Math.max(280, Math.min(560, W * 0.78)));
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
        const g = sv('g', {});
        if (n === 1) draw1(g, W, H); else if (n === 2) draw2(g, W, H); else draw3(g, W, H);
        svg.replaceChildren(g);
        const vs = V.map((v, i) => 'v' + sub(i + 1) + ' = ' + tupPlain(v.e)).join(', ');
        svg.setAttribute('aria-label', vs + (info && show.has('s') ? '. Span of the ticked vectors: ' + info.shape + '.' : ''));
      }
      /** ℝ²: a grid, the axes, then the span, î and ĵ, the walk, the vectors and the combination */
      function draw2(g, W, H) {
        if (!((frozen || play) && view)) {
          const ps = points();
          let R = LADDER2.find(R => { const sc = Math.min(W, H) / (2 * R); return ps.every(p => Math.abs(p[0]) * sc <= 0.42 * W && Math.abs(p[1]) * sc <= 0.42 * H); }) || LADDER2[LADDER2.length - 1];
          view = { sc: Math.min(W, H) / (2 * R), W, H };
        }
        const sc = view.sc, ox = W / 2, oy = H / 2, X = x => ox + x * sc, Y = y => oy - y * sc;
        view.toWorld = (px, py) => [(px - ox) / sc, (oy - py) / sc];
        const st = gridStep(sc), x0 = -ox / sc, x1 = (W - ox) / sc, y0 = -(H - oy) / sc, y1 = oy / sc;
        for (let k = Math.ceil(x0 / st); k * st <= x1; k++) if (k) g.append(sv('line', { x1: q(X(k * st)), x2: q(X(k * st)), y1: 0, y2: H, class: 'vl-grid' }));
        for (let k = Math.ceil(y0 / st); k * st <= y1; k++) if (k) g.append(sv('line', { y1: q(Y(k * st)), y2: q(Y(k * st)), x1: 0, x2: W, class: 'vl-grid' }));
        if (info && show.has('s')) {
          if (info.rank === 2) g.append(sv('rect', { x: 0, y: 0, width: W, height: H, class: 'vl-span-fill' }));
          else if (info.rank === 1) {
            const d = num(V[ticked()[info.piv[0]]]), T = (W + H) / sc / Math.hypot(...d);
            g.append(sv('line', { x1: q(X(-T * d[0])), y1: q(Y(-T * d[1])), x2: q(X(T * d[0])), y2: q(Y(T * d[1])), class: 'vl-span-line' }));
          } else g.append(sv('circle', { cx: q(X(0)), cy: q(Y(0)), r: 9, class: 'vl-span-dot' }));
        }
        g.append(sv('line', { x1: 0, x2: W, y1: q(Y(0)), y2: q(Y(0)), class: 'vl-axis' }), sv('line', { x1: q(X(0)), x2: q(X(0)), y1: 0, y2: H, class: 'vl-axis' }));
        const every = st * sc >= 30 ? 1 : 2;
        for (let k = Math.ceil(x0 / st); k * st <= x1; k++) if (k && k % every === 0 && Math.abs(X(k * st) - W) > 14) g.append(sv('text', { x: q(X(k * st)), y: q(Math.min(H - 5, Math.max(12, Y(0) + 15))), 'text-anchor': 'middle', class: 'vl-tk' }, fmtTick(k * st)));
        for (let k = Math.ceil(y0 / st); k * st <= y1; k++) if (k && k % every === 0 && Y(k * st) > 14) g.append(sv('text', { x: q(Math.max(4, Math.min(W - 4, X(0) - 6))), y: q(Y(k * st) + 4), 'text-anchor': X(0) - 6 < 20 ? 'start' : 'end', class: 'vl-tk' }, fmtTick(k * st)));
        g.append(sv('text', { x: W - 12, y: q(Y(0) - 10), class: 'vl-ax', 'text-anchor': 'end' }, 'x'), sv('text', { x: q(X(0) + 10), y: 18, class: 'vl-ax' }, 'y'));
        const P = p => [X(p[0]), Y(p[1])];
        common(g, W, H, P, 2);
        if (info && show.has('s')) tag(g, info.tag);
      }
      /** ℝ¹: the number line, each vector on its own level above it */
      function draw1(g, W, H) {
        const k = V.length, axisY = 46 + 30 * k;   // levels from y = 46 down; the pill is above them
        if (!((frozen || play) && view)) {
          const ps = points();
          let R = LADDER2.find(R => { const sc = W / (2 * R); return ps.every(p => Math.abs(p[0]) * sc <= 0.43 * W); }) || LADDER2[LADDER2.length - 1];
          view = { sc: W / (2 * R), W, H };
        }
        const sc = view.sc, ox = W / 2, X = x => ox + x * sc;
        view.toWorld = px => [(px - ox) / sc];
        const st = gridStep(sc), every = st * sc >= 30 ? 1 : 2;
        if (info && show.has('s')) {
          if (info.rank === 1) g.append(sv('line', { x1: 6, x2: W - 6, y1: axisY, y2: axisY, class: 'vl-span-line' }));
          else g.append(sv('circle', { cx: q(X(0)), cy: axisY, r: 9, class: 'vl-span-dot' }));
        }
        g.append(sv('line', { x1: 0, x2: W, y1: axisY, y2: axisY, class: 'vl-axis' }), sv('line', { x1: q(X(0)), x2: q(X(0)), y1: 34, y2: axisY, class: 'vl-axis neg' }));
        for (let i = Math.ceil(-ox / sc / st); i * st <= (W - ox) / sc; i++) {
          g.append(sv('line', { x1: q(X(i * st)), x2: q(X(i * st)), y1: axisY - 4, y2: axisY + 4, class: 'vl-axis' }));
          if (i % every === 0) g.append(sv('text', { x: q(X(i * st)), y: axisY + 18, 'text-anchor': 'middle', class: 'vl-tk' }, fmtTick(i * st)));
        }
        g.append(sv('text', { x: W - 10, y: axisY - 9, class: 'vl-ax', 'text-anchor': 'end' }, 'x'));
        // vector i sits on its own level; the walk and î lie on the line itself
        const P = (p, level) => [X(p[0]), level == null ? axisY : level];
        common(g, W, H, P, 1, i => axisY - 30 * (k - i), axisY);
        if (info && show.has('s')) tag(g, info.tag);
      }
      /** ℝ³: the floor grid (z = 0), the axes, the span, then the arrows from back to front */
      function draw3(g, W, H) {
        if (!((frozen || play) && view)) {
          const m = Math.max(0, ...points().flat().map(Math.abs));
          const L = LADDER3.find(L => m <= L * 0.92) || LADDER3[LADDER3.length - 1];
          view = { L, sc: Math.min(W, H) / 2 / (1.3 * L), W, H };
        }
        const { L, sc } = view, P = camera(yaw, pitch, sc, W / 2, H / 2 + 6);
        view.cam = P;
        const seg = (a, b, cls) => { const p = P(a), r = P(b); g.append(sv('line', { x1: q(p[0]), y1: q(p[1]), x2: q(r[0]), y2: q(r[1]), class: cls })); };
        const st = step3(L);
        for (let k = -L; k <= L + 1e-9; k += st) { seg([k, -L, 0], [k, L, 0], 'vl-grid'); seg([-L, k, 0], [L, k, 0], 'vl-grid'); }
        if (info && show.has('s')) {
          const ps = ticked().map(i => num(V[i]));
          if (info.rank === 3) {
            const cs = CORNERS.map(c => P(c.map(x => x * L)));
            g.append(sv('polygon', { points: hull(cs).map(p => q(p[0]) + ',' + q(p[1])).join(' '), class: 'vl-span-fill' }));
            EDGES.forEach(([i, j]) => g.append(sv('line', { x1: q(cs[i][0]), y1: q(cs[i][1]), x2: q(cs[j][0]), y2: q(cs[j][1]), class: 'vl-span-cube' })));
          } else if (info.rank === 2) {
            const nrm = info.normal.map(Number), poly = planeInCube(nrm, L);
            g.append(sv('polygon', { points: poly.map(p => P(p)).map(p => q(p[0]) + ',' + q(p[1])).join(' '), class: 'vl-span-plane' }));
            // lines one unit apart across the plane, so that it reads as a flat sheet
            const e1 = norm3(cross3(nrm, Math.abs(nrm[2]) < 0.9 * Math.hypot(...nrm) ? [0, 0, 1] : [1, 0, 0])), e2 = norm3(cross3(nrm, e1));
            for (const [a, b] of [[e1, e2], [e2, e1]]) for (let t = -2 * L; t <= 2 * L; t += st) {
              const cl = clipCube(b.map(x => x * t), a, L);
              if (cl) seg(cl[0], cl[1], 'vl-span-grid');
            }
          } else if (info.rank === 1) {
            const d = ps[info.piv[0]], cl = clipCube([0, 0, 0], d, L);
            if (cl) { seg(cl[0], cl[1], 'vl-span-line'); seg(cl[0], cl[1], 'vl-span-mid'); }
          } else { const o = P([0, 0, 0]); g.append(sv('circle', { cx: q(o[0]), cy: q(o[1]), r: 9, class: 'vl-span-dot' })); }
        }
        for (let a = 0; a < 3; a++) {
          const e = [0, 0, 0];
          e[a] = -L; seg(e, [0, 0, 0], 'vl-axis neg');
          e[a] = L; seg([0, 0, 0], e, 'vl-axis');
          e[a] = L * 1.1;
          const p = P(e);
          g.append(sv('text', { x: q(p[0]), y: q(p[1]), 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'vl-ax' }, AX[a]));
          for (let k = st; k <= L - 1e-9; k += st * (L / st > 6 ? 2 : 1)) {
            const t = [0, 0, 0];
            t[a] = k;
            const r = P(t);
            g.append(sv('text', { x: q(r[0] + (a === 2 ? 9 : 0)), y: q(r[1] + (a === 2 ? 0 : 13)), 'text-anchor': a === 2 ? 'start' : 'middle', 'dominant-baseline': 'middle', class: 'vl-tk' }, fmtTick(k)));
          }
        }
        common(g, W, H, P, 3);
        if (info && show.has('s')) tag(g, info.tag);
      }
      /** what every space draws: î ĵ k̂, the walk to the focused tip, the vectors with their handles, the combination.
          P maps a point to the screen ([x, y, depth] in ℝ³); in ℝ¹, level(i) is the height of vector i */
      function common(g, W, H, P, dim, level, axisY) {
        const items = [];   // [depth, draw] so that ℝ³ draws from back to front
        const O = P([0, 0, 0]);
        const at = (p, i) => (dim === 1 && level ? P(p, level(i)) : P(p));
        const put = (depth, fn) => items.push([depth, fn]);
        const depth = (...ps) => (dim === 3 ? ps.reduce((a, p) => a + P(p)[2], 0) / ps.length : 0);
        if (show.has('b')) for (let a = 0; a < dim; a++) {
          const e = [0, 0, 0].slice(0, dim);
          e[a] = 1;
          put(depth([0, 0, 0], e) + 0.01, () => {
            const t = P(e);
            arrow(g, O[0], O[1], t[0], t[1], 'kb', 10);
            const dx = t[0] - O[0], dy = t[1] - O[1], l = Math.hypot(dx, dy) || 1;
            if (dim === 1) label(g, t[0] + 4, t[1] - 11, HAT[a], 'kb sm', W, H);
            else label(g, t[0] + (dx / l) * 6 + (dy / l) * 11, t[1] + (dy / l) * 6 - (dx / l) * 11, HAT[a], 'kb sm', W, H);
          });
        }
        if (show.has('w') && V[focus]) {
          const v = num(V[focus]), f = focus, cls = 'k' + f, pts = [[0, 0, 0].slice(0, dim)];
          for (let a = 0; a < dim; a++) { const p = pts[a].slice(); p[a] = v[a]; pts.push(p); }
          for (let a = 0; a < dim; a++) {
            if (Math.abs(v[a]) < 1e-12) continue;
            const A = pts[a], B = pts[a + 1];
            put(depth(A, B) + 0.02, () => {
              const p = P(A), r = P(B), gr = sv('g', { class: cls });
              const yy = dim === 1 ? axisY + 0 : null;
              gr.append(sv('line', { x1: q(p[0]), y1: q(yy == null ? p[1] : yy), x2: q(r[0]), y2: q(yy == null ? r[1] : yy), class: 'vl-leg' }));
              const whole = Math.floor(Math.abs(v[a]) + 1e-9), sgn = Math.sign(v[a]);
              for (let u = 1; u <= whole && u <= 60; u++) {
                const m = A.slice(); m[a] += sgn * u;
                const c = P(m);
                gr.append(sv('circle', { cx: q(c[0]), cy: q(yy == null ? c[1] : yy), r: 2.6, class: 'vl-unit' }));
              }
              g.append(gr);
              const mid = A.map((x, j) => (x + B[j]) / 2), c = P(mid), dx = r[0] - p[0], dy = r[1] - p[1], l = Math.hypot(dx, dy) || 1;
              const off = dim === 1 ? [0, -11] : [(dy / l) * 13, -(dx / l) * 13];
              label(g, c[0] + off[0], (yy == null ? c[1] : yy) + off[1], pt(V[f].e[a]) + HAT[a], cls + ' sm', W, H);
            });
          }
        }
        const comboOn = show.has('c') && ticked().length;
        const faded = i => (show.has('s') || comboOn) && !on[i];
        V.forEach((v, i) => {
          const p = num(v);
          put(depth([0, 0, 0].slice(0, dim), p), () => {
            const o = dim === 1 ? at([0], i) : O, t = at(p, i);
            if (dim === 1) g.append(sv('line', { x1: q(t[0]), x2: q(t[0]), y1: q(t[1]), y2: axisY, class: 'vl-leg k' + i, style: 'stroke-dasharray: 2 4; stroke-width: 1.4' }));
            arrow(g, o[0], o[1], t[0], t[1], 'k' + i + (faded(i) ? ' off' : ''));
            tipLabel(g, o[0], o[1], t[0], t[1], 'v' + sub(i + 1), 'k' + i + (faded(i) ? ' off' : ''), W, H);
          });
        });
        if (comboOn) {
          let at0 = [0, 0, 0].slice(0, dim);
          const idx = ticked();
          idx.forEach((i, t) => {
            const step = num(V[i]).map(x => x * C[i]), to = at0.map((x, j) => x + step[j]);
            const from = at0;
            put(depth(from, to) - 0.01, () => {
              const a = P(from), b = P(to), lift1 = dim === 1 ? axisY + 34 + 12 * t : null;
              arrow(g, a[0], lift1 == null ? a[1] : lift1, b[0], lift1 == null ? b[1] : lift1, 'k' + i + ' vl-dash', 9);
            });
            at0 = to;
          });
          const res = at0;
          trail.forEach(p => { const c = P(p); g.append(sv('circle', { cx: q(c[0]), cy: q(c[1]), r: 2, class: 'vl-trail' })); });
          put(depth([0, 0, 0].slice(0, dim), res) - 0.02, () => {
            const b = P(res);
            arrow(g, O[0], O[1], b[0], b[1], 'kr', 14);
            tipLabel(g, O[0], O[1], b[0], b[1], '(' + res.map(x => fmtTick(Math.round(x * 100) / 100)).join(', ') + ')', 'kr sm', W, H);
          });
        }
        items.sort((a, b) => b[0] - a[0]).forEach(([, fn]) => fn());
        g.append(sv('circle', { cx: q(O[0]), cy: q(O[1]), r: 3, class: 'vl-origin' }));
        // the handles: wide invisible circles on the tips, drawn last so that they are on top
        V.forEach((v, i) => { const t = at(num(v), i); g.append(sv('circle', { cx: q(t[0]), cy: q(t[1]), r: 20, class: 'vl-hit', 'data-tip': i })); });
      }

      /* ---- dragging a tip, turning the space */
      const svgPoint = e => { const b = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal; return [(e.clientX - b.left) * vb.width / b.width, (e.clientY - b.top) * vb.height / b.height]; };
      const snap = (x, st) => Math.round(x / st) * st;
      function later() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; refresh(); }); }
      svg.addEventListener('pointerdown', e => {
        if (e.button > 0) return;
        const hit = e.target.closest && e.target.closest('[data-tip]');
        if (hit) { drag = { kind: 'tip', i: +hit.getAttribute('data-tip') }; focus = drag.i; }
        else if (n === 3) { drag = { kind: 'turn', x: e.clientX, y: e.clientY, yaw, pitch }; svg.classList.add('turning'); }
        else return;
        stopPlay();
        frozen = true;
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* capture is a nicety */ }
        e.preventDefault();
      });
      svg.addEventListener('touchstart', e => { if (n === 3 || (e.target.closest && e.target.closest('[data-tip]'))) e.preventDefault(); }, { passive: false });
      svg.addEventListener('pointermove', e => {
        if (!drag) return;
        if (drag.kind === 'turn') {
          yaw = drag.yaw + (e.clientX - drag.x) * 0.0085;
          pitch = Math.max(-1.5, Math.min(1.5, drag.pitch + (e.clientY - drag.y) * 0.0085));
          if (!frame) frame = requestAnimationFrame(() => { frame = 0; draw(); });
          return;
        }
        const i = drag.i, [px, py] = svgPoint(e);
        let p;
        if (n === 3) {
          const fl = view.cam && view.cam.floor(px, py, V[i].e[2].num());
          if (!fl) return;
          const lim = view.L;
          p = fl.map(x => Math.max(-lim, Math.min(lim, snap(x, 0.5))));
        } else {
          const w = view.toWorld(px, py), lim = view.sc ? [view.W / 2 / view.sc, view.H / 2 / view.sc] : [MAXE, MAXE];
          p = w.map((x, j) => Math.max(-lim[j], Math.min(lim[j], snap(x, view.sc * 0.5 < 9 ? 1 : 0.5))));
        }
        let changed = false;
        p.forEach((x, j) => {
          const t = String(+x.toFixed(2));
          if (t === V[i].s[j] && V[i].e[j].num() === x) return;
          V[i].e[j] = F.parse(t); V[i].s[j] = t; changed = true;
          const inp = rows[i] && rows[i].ins[j];
          if (inp) { inp.value = t; inp.classList.remove('bad'); }
        });
        if (changed) { trail = []; later(); }
      });
      const end = () => {
        if (!drag) return;
        const was = drag.kind;
        drag = null; frozen = false;
        svg.classList.remove('turning');
        if (was === 'tip') { view = null; refresh(); link(); }
      };
      svg.addEventListener('pointerup', end);
      svg.addEventListener('pointercancel', end);
      svg.addEventListener('lostpointercapture', end);
      const ro = new ResizeObserver(() => { if (!svg.isConnected) { ro.disconnect(); return; } if (!drag) { view = null; draw(); } });
      ro.observe(svg);

      load(s.v.v || DEF[n].v, s.v.v ? s.v.on : DEF[n].on, s.v.c);
      build();
      link();
    },
  });
})();
