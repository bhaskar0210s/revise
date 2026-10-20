/* Graph algorithms lab: Mathematics 1, Weeks 10 and 11 (lectures 10.1–10.10 and 11.1–11.10).

   A graph is typed as an edge list, items separated by commas (the link value g):
     0-1      an edge (an undirected graph)        0>1      an arrow (a directed graph; there 0-1 means arrows both ways)
     0-1:10   an edge of weight 10                 0>1:-4   an arrow of weight −4 (whole numbers, −9999 to 9999)
     5        a vertex with no edges (also fixes the order of named vertices)
   At most 12 vertices (lecture 10.6's graph has 12) and 40 edges. Vertices are numbers (taken smallest first, as the
   lectures do) or names of up to 8 letters and digits (taken in the order they first appear). Whenever an algorithm
   has a choice, it takes the vertex or edge that comes first in that order.
   Every topic steps through its algorithm with Previous/Next and a slider; "Show all steps" lists every step.
   Link values shared by every topic: g = the edge list; at = the drawing (a lecture's own positions: air, comp, conn,
   dir8, topo, office, courses, dij, kr7, bf8, mst5, sq4, trap, negc; empty or any other value: the vertices on a
   circle); step = the step shown (1 = the start); all = 1 to list every step. Each topic's own values are written
   above it. The "Try" graphs are the lectures' examples, read off the slides; the lab's own telling cases say so. */
(function () {
  'use strict';
  const K = REV.kit;
  const { h } = K;
  const MAXN = 12, MAXM = 40, MAXW = 9999, VR = 15;

  /* ================================================================== styles (added once) */
  const CSS = `
.gl-out > * { min-width: 0; }
@media (min-width: 861px) { .lk-controls.gl-controls { max-height: calc(100vh - 80px); overflow-y: auto; } }
.gl-g { min-height: 80px; font-family: var(--mono); line-height: 1.45; resize: vertical; }
.gl-g.bad { border-color: var(--bad); }
.gl-try { min-height: 44px; line-height: 1.25; padding: 6px 12px; text-align: left; }
.gl-pic { overflow-x: auto; }
.gl-svg { width: 100%; max-width: 520px; height: auto; display: block; margin: 4px auto; }
.gl-svg .e { fill: none; stroke: var(--ink-4); stroke-width: 1.7; }
.gl-svg .ah { fill: var(--ink-4); stroke: none; }
.gl-svg .e.tree { stroke: var(--accent); stroke-width: 3.4; } .gl-svg .ah.tree { fill: var(--accent); }
.gl-svg .e.hot { stroke: var(--pick); stroke-width: 3.6; } .gl-svg .ah.hot { fill: var(--pick); }
.gl-svg .e.look { stroke: var(--pick); stroke-width: 2.2; stroke-dasharray: 2 4; stroke-linecap: round; } .gl-svg .ah.look { fill: var(--pick); }
.gl-svg .e.skip { stroke: var(--bad); stroke-width: 2.6; stroke-dasharray: 7 5; } .gl-svg .ah.skip { fill: var(--bad); }
.gl-svg .e.non { stroke: var(--warn); stroke-width: 2.4; stroke-dasharray: 6 4; } .gl-svg .ah.non { fill: var(--warn); }
.gl-svg .e.cyc { stroke: var(--bad); stroke-width: 3.6; } .gl-svg .ah.cyc { fill: var(--bad); }
.gl-svg .e.tent { stroke: var(--accent); stroke-width: 2.2; stroke-dasharray: 6 4; } .gl-svg .ah.tent { fill: var(--accent); }
.gl-svg .e.fwd { stroke: var(--good); stroke-width: 2.6; stroke-dasharray: 7 4; } .gl-svg .ah.fwd { fill: var(--good); }
.gl-svg .e.crs { stroke: var(--warn); stroke-width: 2.6; stroke-dasharray: 3 3; } .gl-svg .ah.crs { fill: var(--warn); }
.gl-svg .e.dim, .gl-svg .ah.dim { opacity: .25; }
.gl-svg .w { fill: var(--ink-2); font: 650 12.5px var(--font); paint-order: stroke; stroke: var(--bg-elev); stroke-width: 4px; stroke-linejoin: round; }
.gl-svg .w.hot { fill: var(--pick); } .gl-svg .w.tree { fill: var(--accent-ink); } .gl-svg .w.skip, .gl-svg .w.cyc { fill: var(--bad); } .gl-svg .w.dim { opacity: .35; }
.gl-svg .v > circle, .gl-svg .v > rect { fill: var(--bg-elev); stroke: var(--ink-3); stroke-width: 1.7; }
.gl-svg .v > text { fill: var(--ink); font: 700 13px var(--font); }
.gl-svg .v.done > circle, .gl-svg .v.done > rect { fill: var(--accent-soft); stroke: var(--accent); }
.gl-svg .v.wait > circle, .gl-svg .v.wait > rect { stroke: var(--accent); stroke-width: 2.2; stroke-dasharray: 4 3; }
.gl-svg .v.new > circle, .gl-svg .v.new > rect { fill: var(--pick-soft); stroke: var(--pick); stroke-width: 2.6; }
.gl-svg .v.cur > circle, .gl-svg .v.cur > rect { fill: var(--pick); stroke: var(--pick); }
.gl-svg .v.cur > text { fill: var(--bg-elev); }
.gl-svg .v.src > circle, .gl-svg .v.src > rect { stroke-width: 3.4; }
.gl-svg .v.off { opacity: .38; }
.gl-svg .v.bad > circle, .gl-svg .v.bad > rect { stroke: var(--bad); stroke-width: 3; }
.gl-svg .v.k0 > circle, .gl-svg .v.k0 > rect { fill: color-mix(in srgb, var(--x) 24%, var(--bg-elev)); stroke: var(--x); }
.gl-svg .v.k1 > circle, .gl-svg .v.k1 > rect { fill: color-mix(in srgb, var(--y) 24%, var(--bg-elev)); stroke: var(--y); }
.gl-svg .v.k2 > circle, .gl-svg .v.k2 > rect { fill: color-mix(in srgb, var(--z) 24%, var(--bg-elev)); stroke: var(--z); }
.gl-svg .v.k3 > circle, .gl-svg .v.k3 > rect { fill: color-mix(in srgb, var(--pick) 24%, var(--bg-elev)); stroke: var(--pick); }
.gl-svg .v.k4 > circle, .gl-svg .v.k4 > rect { fill: color-mix(in srgb, var(--good) 24%, var(--bg-elev)); stroke: var(--good); }
.gl-svg .v.k5 > circle, .gl-svg .v.k5 > rect { fill: color-mix(in srgb, var(--warn) 24%, var(--bg-elev)); stroke: var(--warn); }
.gl-svg .v.k6 > circle, .gl-svg .v.k6 > rect { fill: color-mix(in srgb, var(--bad) 24%, var(--bg-elev)); stroke: var(--bad); }
.gl-svg .v.k7 > circle, .gl-svg .v.k7 > rect { fill: color-mix(in srgb, var(--accent) 24%, var(--bg-elev)); stroke: var(--accent); }
.gl-svg .v.k8 > circle, .gl-svg .v.k8 > rect, .gl-svg .v.k9 > circle, .gl-svg .v.k9 > rect, .gl-svg .v.k10 > circle, .gl-svg .v.k10 > rect, .gl-svg .v.k11 > circle, .gl-svg .v.k11 > rect { fill: var(--bg-sunk-2); stroke: var(--ink-2); }
.gl-svg .tag { font: 750 12px var(--font); fill: var(--ink-2); paint-order: stroke; stroke: var(--bg-elev); stroke-width: 3.5px; stroke-linejoin: round; }
.gl-svg .tag .pre { fill: var(--pick); } .gl-svg .tag .post { fill: var(--z); } .gl-svg .tag .lv { fill: var(--accent-ink); }
.gl-svg .tag .in { fill: var(--bad); } .gl-svg .tag .lp { fill: var(--x); } .gl-svg .tag .chg { fill: var(--pick); } .gl-svg .tag .dull { fill: var(--ink-3); }
.gl-legend { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 13px; color: var(--ink-2); margin: 2px 0 6px; }
.gl-key { display: inline-block; width: 20px; height: 0; border-top: 3px solid var(--ink-4); margin-right: 6px; vertical-align: 4px; }
.gl-key.tree { border-color: var(--accent); } .gl-key.hot { border-color: var(--pick); } .gl-key.cyc { border-color: var(--bad); }
.gl-key.non { border-top-style: dashed; border-color: var(--warn); } .gl-key.skip { border-top-style: dashed; border-color: var(--bad); }
.gl-key.tent { border-top-style: dashed; border-color: var(--accent); } .gl-key.look { border-top-style: dotted; border-color: var(--pick); }
.gl-key.fwd { border-top-style: dashed; border-color: var(--good); } .gl-key.crs { border-top-style: dotted; border-color: var(--warn); } .gl-key.dim { opacity: .35; }
.gl-dot { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--ink-3); margin-right: 6px; vertical-align: -2px; background: var(--bg-elev); }
.gl-dot.done { background: var(--accent-soft); border-color: var(--accent); } .gl-dot.cur { background: var(--pick); border-color: var(--pick); }
.gl-dot.new { background: var(--pick-soft); border-color: var(--pick); } .gl-dot.wait { border-color: var(--accent); border-style: dashed; } .gl-dot.off { opacity: .4; }
.gl-dot.k0 { background: color-mix(in srgb, var(--x) 24%, var(--bg-elev)); border-color: var(--x); } .gl-dot.k1 { background: color-mix(in srgb, var(--y) 24%, var(--bg-elev)); border-color: var(--y); }
.gl-dot.k2 { background: color-mix(in srgb, var(--z) 24%, var(--bg-elev)); border-color: var(--z); } .gl-dot.k3 { background: color-mix(in srgb, var(--pick) 24%, var(--bg-elev)); border-color: var(--pick); }
.gl-dot.k4 { background: color-mix(in srgb, var(--good) 24%, var(--bg-elev)); border-color: var(--good); } .gl-dot.k5 { background: color-mix(in srgb, var(--warn) 24%, var(--bg-elev)); border-color: var(--warn); }
.gl-dot.k6 { background: color-mix(in srgb, var(--bad) 24%, var(--bg-elev)); border-color: var(--bad); } .gl-dot.k7 { background: color-mix(in srgb, var(--accent) 24%, var(--bg-elev)); border-color: var(--accent); }
.gl-navrow { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 8px; align-items: center; }
.gl-nav { min-height: 44px; min-width: 44px; padding: 0 14px; }
.gl-nav[disabled] { opacity: .4; cursor: default; }
.gl-snum { text-align: center; font-weight: 750; font-variant-numeric: tabular-nums; }
.gl-range { width: 100%; height: 44px; margin: 0; accent-color: var(--accent); }
.gl-desc { margin: 2px 0 10px; padding: 10px 12px; border-radius: 12px; background: var(--bg-sunk); }
.gl-head { font-weight: 750; }
.gl-desc .lk-step-t { margin-top: 4px; color: var(--ink-2); }
.gl-list > li { cursor: pointer; border-radius: 10px; padding: 4px 6px; }
.gl-list > li.cur { background: var(--pick-soft); }
.gl-q { display: flex; flex-wrap: wrap; align-items: center; gap: 5px; margin: 8px 0; }
.gl-ql { font-size: 13px; font-weight: 750; color: var(--ink-2); margin-right: 2px; }
.gl-qc { min-width: 34px; height: 34px; padding: 0 6px; display: inline-grid; place-items: center; border: 1.6px solid var(--line-2); border-radius: 8px; background: var(--bg-elev); font: 750 14px var(--font); }
.gl-qc.in { border-color: var(--pick); background: var(--pick-soft); }
.gl-qc.out { border-style: dashed; color: var(--ink-3); text-decoration: line-through; }
.gl-qe { color: var(--ink-3); font-size: 14px; font-style: italic; }
.gl-qend { font-size: 12px; color: var(--ink-3); }
.gl-sub { font-size: 13.5px; font-weight: 750; color: var(--ink-2); margin: 12px 0 2px; }
.lk-table.gl-t td.z { color: var(--ink-4); }
.lk-table.gl-t td.inf { color: var(--ink-3); }
.lk-table.gl-t td.new, .lk-table.gl-t th.new { background: var(--pick-soft); color: var(--ink); font-weight: 750; }
.lk-table.gl-t td.done, .lk-table.gl-t th.done { background: var(--accent-soft); }
.lk-table.gl-t td.pick { box-shadow: inset 0 0 0 2px var(--pick); }
.lk-table.gl-t td.bad { background: var(--bad-soft); color: var(--bad); font-weight: 700; }
.lk-table.gl-t td.good { color: var(--good); font-weight: 700; }
.lk-table.gl-t tr.cur > td, .lk-table.gl-t tr.cur > th { background: var(--pick-soft); }
.lk-table.gl-t tr.off > td, .lk-table.gl-t tr.off > th { color: var(--ink-4); }
.lk-table.gl-t td.left { text-align: left; white-space: normal; min-width: 8em; }
.lk-table.gl-t td.cell { cursor: pointer; }
.gl-vn { font-weight: 750; }
.gl-ok { color: var(--good); font-weight: 750; }
.gl-no { color: var(--bad); font-weight: 750; }
`;
  if (!document.getElementById('gl-css')) document.head.append(h('style', { id: 'gl-css', text: CSS }));

  /* ================================================================== small helpers */
  const range = n => Array.from({ length: n }, (_, i) => i);
  const safe = s => REV.esc(String(s)).replace(/\$/g, '&#36;');
  const and = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const pl = (k, w, ws) => k + ' ' + (k === 1 ? w : ws || w + 's');
  const minus = x => String(x).replace(/^-/, '−');                                  // a number for text: −4
  const dH = x => (x === Infinity ? '∞' : minus(x));                                // a distance for text
  const dT = x => (x === Infinity ? '\\infty' : String(x));                          // a distance for TeX
  const pT = x => (x === Infinity ? '\\infty' : x < 0 ? '(' + x + ')' : String(x));  // a term inside a sum, for TeX
  const lT = l => (/^\d+$/.test(l) ? l : '\\text{' + l + '}');                       // a vertex name for TeX
  const OK = ' <span class="gl-ok">✓</span>', NO = ' <span class="gl-no">✗</span>';
  /** a display formula that may break after "=", "+" or "," on a narrow phone (as the kit's K.steps does) */
  const kxW = src => (/\\begin\{|\\\\/.test(src) ? K.kx(src, true) : '<span class="lk-wrap">' + K.kx('\\displaystyle ' + src, false) + '</span>');
  /** names of the vertices of G in text, in bold, in TeX, as sets and as paths */
  const nm = G => ({
    n: i => G.labels[i],
    b: i => '<span class="gl-vn">' + G.labels[i] + '</span>',
    t: i => lT(G.labels[i]),
    set: l => '{' + l.map(i => G.labels[i]).join(', ') + '}',
    setT: l => (l.length ? '\\{' + l.map(i => lT(G.labels[i])).join(', ') + '\\}' : '\\varnothing'),
    path: l => l.map(i => G.labels[i]).join(' → '),
    pathT: l => l.map(i => lT(G.labels[i])).join(' \\to '),
    e: (u, v) => '(' + G.labels[u] + ',\u00a0' + G.labels[v] + ')',   // a no-break space: a pair never splits across lines
    eT: (u, v) => '(' + lT(G.labels[u]) + ', ' + lT(G.labels[v]) + ')',
    list: l => and(l.map(i => '<span class="gl-vn">' + G.labels[i] + '</span>')),
  });

  /* ================================================================== reading a graph */
  /** the edge list → { n, labels, idx, directed, weighted, edges, arcs, out, inn, W (weights), E (edge numbers), m }
      or { err } with a message in words */
  function parseGraph(src) {
    const text = String(src == null ? '' : src).replace(/[→⟶➝]/g, '>').replace(/[−–—]/g, '-').replace(/\s*-\s*>\s*/g, '>').replace(/\s*([>:-])\s*/g, '$1');
    const items = text.split(/[\s,;]+/).filter(Boolean);
    if (!items.length) return { err: 'Type at least one edge, such as 0-1 or 0>1.' };
    const labels = [], seen = new Set(), list = [];
    const name = tok => (/^\d+$/.test(tok) ? String(parseInt(tok, 10)) : tok);
    const addV = l => { if (!seen.has(l)) { seen.add(l); labels.push(l); } };
    let directed = false, anyW = false, missingW = false;
    for (const it of items) {
      let m = /^([A-Za-z0-9]+)$/.exec(it);
      if (m) {
        if (m[1].length > 8) return { err: '“' + it + '”: a vertex name has at most 8 letters or digits.' };
        addV(name(m[1]));
        continue;
      }
      m = /^([A-Za-z0-9]+)([>-])([A-Za-z0-9]+)(?::([+-]?\d+))?$/.exec(it);
      if (!m) return { err: '“' + it + '” is not an edge. Write 0-1 (an edge), 0>1 (an arrow) or 0-1:5 (an edge of weight 5); separate them with commas.' };
      if (m[1].length > 8 || m[3].length > 8) return { err: '“' + it + '”: a vertex name has at most 8 letters or digits.' };
      const u = name(m[1]), v = name(m[3]);
      if (u === v) return { err: '“' + it + '” joins ' + u + ' to itself. The lectures allow no edge from a vertex to itself.' };
      let w = 1;
      if (m[4] != null) {
        w = parseInt(m[4], 10);
        if (Math.abs(w) > MAXW) return { err: '“' + it + '”: keep weights between −' + MAXW + ' and ' + MAXW + '.' };
        anyW = true;
      } else missingW = true;
      if (m[2] === '>') directed = true;
      addV(u); addV(v);
      list.push({ u, v, dir: m[2] === '>', w, it });
    }
    if (labels.length > MAXN) return { err: labels.length + ' vertices: the lab takes at most ' + MAXN + '.' };
    if (list.length > MAXM) return { err: list.length + ' edges: the lab takes at most ' + MAXM + '.' };
    if (labels.every(l => /^\d+$/.test(l))) labels.sort((a, b) => a - b);
    const n = labels.length, idx = new Map(labels.map((l, i) => [l, i]));
    const W = range(n).map(() => Array(n).fill(null)), E = range(n).map(() => Array(n).fill(-1)), edges = [];
    for (const x of list) {
      const u = idx.get(x.u), v = idx.get(x.v);
      if (directed) {
        for (const [a, b] of x.dir ? [[u, v]] : [[u, v], [v, u]]) {
          if (W[a][b] != null) return { err: 'The arrow ' + labels[a] + '>' + labels[b] + ' is listed twice' + (x.dir ? '' : ' (in a directed graph ' + x.it + ' means arrows both ways)') + '.' };
          W[a][b] = x.w; E[a][b] = edges.length; edges.push({ u: a, v: b, w: x.w });
        }
      } else {
        if (W[u][v] != null) return { err: 'The edge ' + x.u + '-' + x.v + ' is listed twice.' };
        W[u][v] = W[v][u] = x.w; E[u][v] = E[v][u] = edges.length;
        edges.push(u < v ? { u, v, w: x.w } : { u: v, v: u, w: x.w });
      }
    }
    const out = range(n).map(() => []), inn = range(n).map(() => []);
    edges.forEach((e, k) => {
      out[e.u].push({ u: e.u, v: e.v, w: e.w, e: k }); inn[e.v].push({ u: e.u, v: e.v, w: e.w, e: k });
      if (!directed) { out[e.v].push({ u: e.v, v: e.u, w: e.w, e: k }); inn[e.u].push({ u: e.v, v: e.u, w: e.w, e: k }); }
    });
    out.forEach(a => a.sort((x, y) => x.v - y.v));
    inn.forEach(a => a.sort((x, y) => x.u - y.u));
    const arcs = [].concat(...out);   // every arc (j, k): j in order, then k in order (lecture 11.6: for each vertex j, for each edge (j, k))
    const key = (directed ? 'd' : 'u') + '|' + labels.join(',') + '|' + arcs.map(a => a.u + '>' + a.v + ':' + a.w).join(',');
    return {
      n, labels, idx, directed, weighted: anyW, edges, arcs, out, inn, W, E, m: edges.length, key,
      note: anyW && missingW ? 'Some edges have no weight: they count 1.' : '',
    };
  }

  /* ================================================================== the lectures' graphs, read off the slides */
  const AIR_D = '0>1,0-4,1>2,2>0,3-4,3>6,4-7,5>3,5>7,6>5,7>8,8>5,8-9';              // 10.1, 10.3, 11.2: airline routes
  const AIR_U = '0-1,0-2,0-4,1-2,3-4,3-5,3-6,4-7,5-6,5-7,5-8,7-8,8-9';              // 10.3–10.5: every route both ways
  const COMP12 = '0-1,0-4,4-8,4-9,8-9,2-3,2-6,2-7,3-7,6-7,6-10,7-10,7-11,5';        // 10.6: three components
  const CONN5 = '0-1,0-2,2-3,2-4,3-4', TREE5 = '0-1,0-2,2-3,2-4';                    // 10.6: connected; acyclic (a tree)
  const DIR8 = '0>1,0>2,0>5,1>4,2>3,3>0,3>6,4>5,4>6,4>7,5>1,5>7,6>7';               // 10.7: directed cycles, edge types, SCCs
  const TOPO8 = '0>2,0>3,0>4,1>2,1>7,2>5,3>5,3>7,4>7,5>6,6>7';                      // 10.10 and 11.1
  const OFFICE = 'CondE,CondT,Tiling,Plaster,Paint,Wiring,Cabling,Fittings,CondE>Tiling,CondE>Plaster,CondT>Tiling,CondT>Plaster,Tiling>Paint,Plaster>Paint,Paint>Wiring,Paint>Cabling,Wiring>Fittings';   // 10.9
  const COURSES = 'M1>M2,S1>S2,M2>ML,S2>ML';                                          // 10.7: prerequisites
  const K5 = '0-1,0-2,0-3,0-4,1-2,1-3,1-4,2-3,2-4,3-4';                              // 10.8: a complete graph
  const TC6 = '0>1,0>4,1>2,2>0,3>4,4>0,4>3,5>3';                                      // 11.3: the Boolean matrix
  const DIJ7 = '0-1:10,0-2:80,1-2:6,1-4:20,2-3:70,4-5:50,4-6:5,5-6:10';              // 11.4, 11.5
  const BF8 = '0>1:10,0>7:8,1>5:2,2>1:1,2>3:1,3>4:3,4>5:-1,5>2:-2,6>1:-4,6>5:-1,7>6:1';   // 11.6, 11.7
  const MST5 = '0-1:10,0-3:18,1-2:20,1-3:6,2-4:8,3-4:70';                            // 11.8, 11.9, 11.10
  const KR7 = '0-1:10,0-2:18,1-2:6,1-4:20,2-3:70,4-5:10,4-6:10,5-6:5';               // 11.10
  const TRI3 = '0-1:3,0-2:3,1-2:3', SQ4 = '0-1,1-2,2-3,0-3,0-2,1-3';                 // 11.10: equal weights
  const NEGC = '0>1:4,1>2:-3,2>3:2,3>4:-1,4>1:1,2>5:3';     // 11.4's cycle −3, +2, −1, +1 (the way in and out is the lab's)
  const TRAP = '0>1:2,0>2:5,2>1:-4,1>3:1';                   // the lab's own: a negative edge that Dijkstra misses
  const LAYOUTS = {
    air: { 0: [782, 127], 1: [851, 162], 2: [712, 196], 3: [921, 231], 4: [677, 266], 5: [851, 301], 6: [991, 266], 7: [816, 405], 8: [921, 388], 9: [782, 474] },
    comp: { 0: [740, 412], 1: [810, 412], 2: [880, 412], 3: [950, 412], 4: [740, 482], 5: [810, 482], 6: [880, 482], 7: [950, 482], 8: [740, 552], 9: [810, 552], 10: [880, 552], 11: [950, 552] },
    conn: { 0: [813, 160], 1: [883, 160], 2: [813, 230], 3: [813, 300], 4: [883, 300] },
    dir8: { 0: [582, 160], 1: [476, 160], 2: [688, 160], 3: [688, 266], 4: [476, 266], 5: [582, 266], 6: [688, 371], 7: [582, 371] },
    topo: { 0: [820, 188], 1: [1073, 188], 2: [728, 295], 3: [843, 375], 4: [1005, 322], 5: [660, 456], 6: [889, 456], 7: [1118, 456] },
    office: { CondE: [764, 130], CondT: [993, 130], Tiling: [764, 246], Plaster: [993, 246], Paint: [878, 361], Wiring: [764, 475], Cabling: [993, 475], Fittings: [764, 590] },
    courses: { M1: [0, 0], S1: [240, 0], M2: [0, 90], S2: [240, 90], ML: [120, 180] },
    dij: { 0: [413, 302], 1: [630, 302], 2: [522, 176], 3: [738, 176], 4: [846, 302], 5: [1062, 302], 6: [954, 428] },
    kr7: { 0: [523, 262], 1: [682, 262], 2: [602, 172], 3: [761, 172], 4: [840, 262], 5: [998, 262], 6: [919, 352] },
    bf8: { 0: [366, 72], 1: [456, 72], 2: [502, 108], 3: [502, 180], 4: [456, 216], 5: [366, 216], 6: [321, 180], 7: [321, 108] },
    mst5: { 0: [300, 126], 1: [376, 126], 2: [448, 126], 3: [340, 72], 4: [412, 72] },
    sq4: { 0: [0, 0], 1: [120, 0], 2: [120, 120], 3: [0, 120] },
    trap: { 0: [0, 60], 1: [100, 0], 2: [100, 120], 3: [200, 0] },
    negc: { 0: [0, 0], 1: [100, 0], 2: [200, 0], 3: [200, 100], 4: [100, 100], 5: [300, 0] },
  };
  // a typed graph equal to a lecture's graph gets that lecture's drawing even without at=…
  const OWN_LAYOUT = [[AIR_D, 'air'], [AIR_U, 'air'], [COMP12, 'comp'], [CONN5, 'conn'], [TREE5, 'conn'], [DIR8, 'dir8'], [TOPO8, 'topo'], [OFFICE, 'office'],
    [COURSES, 'courses'], [DIJ7, 'dij'], [KR7, 'kr7'], [BF8, 'bf8'], [MST5, 'mst5'], [SQ4, 'sq4'], [TRAP, 'trap'], [NEGC, 'negc']];
  let layoutKeys = null, airKey = null;
  const isAirD = G => G.key === (airKey || (airKey = parseGraph(AIR_D).key));

  /* ================================================================== drawing */
  /** each vertex's shape: a circle for short names, a rounded box for longer ones (hw, hh = half width and height) */
  const shapes = G => G.labels.map(l => (l.length <= 2 ? { pill: false, hw: VR, hh: VR } : { pill: true, hw: Math.round(8 + 3.9 * l.length), hh: 13 }));
  /** where the vertices go: the lecture's own positions (at, or a graph equal to a lecture's), else on a circle */
  function layoutFor(G, at) {
    const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
    const S = shapes(G), fits = lay => lay && Object.keys(lay).length === G.n && G.labels.every(l => own(lay, l));
    let lay = own(LAYOUTS, at) && fits(LAYOUTS[at]) ? LAYOUTS[at] : null;
    if (!lay) {
      if (!layoutKeys) layoutKeys = new Map(OWN_LAYOUT.map(([g, id]) => [parseGraph(g).key, id]));
      const id = layoutKeys.get(G.key);
      if (id && fits(LAYOUTS[id])) lay = LAYOUTS[id];
    }
    const W = 360, padX = Math.max(...S.map(s => s.hw)) + 16, padY = 36;
    let P, H;
    if (lay && G.n > 1) {
      const src = G.labels.map(l => lay[l]), xs = src.map(p => p[0]), ys = src.map(p => p[1]);
      const x0 = Math.min(...xs), y0 = Math.min(...ys), dx = Math.max(1, Math.max(...xs) - x0), dy = Math.max(1, Math.max(...ys) - y0);
      const sc = Math.min((W - 2 * padX) / dx, (400 - 2 * padY) / dy, 2.2);
      H = Math.max(150, Math.round(dy * sc + 2 * padY));
      const ox = (W - dx * sc) / 2, oy = (H - dy * sc) / 2;
      P = src.map(([x, y]) => [ox + (x - x0) * sc, oy + (y - y0) * sc]);
    } else {
      H = G.n <= 2 ? 170 : 310;
      const R = G.n === 1 ? 0 : Math.min(W / 2 - padX, H / 2 - padY);
      P = range(G.n).map(i => { const a = -Math.PI / 2 + (2 * Math.PI * i) / G.n; return [W / 2 + R * Math.cos(a), H / 2 + R * Math.sin(a)]; });
    }
    return { W, H, P, S };
  }
  const RANK = ['cyc', 'hot', 'skip', 'tree', 'tent', 'fwd', 'crs', 'non', 'look', '', 'dim'];
  const stronger = (a, b) => (RANK.indexOf(a || '') <= RANK.indexOf(b || '') ? a : b);
  const fx = p => p[0].toFixed(1) + ' ' + p[1].toFixed(1);
  /** the graph as an SVG picture. o.v(i) → vertex classes (cur, new, wait, done, src, off, bad, k0…), o.tag(i) → a small
      label above the vertex ([[text, class], …] or text), o.e(k) → the class of edge k (tree, hot, look, skip, non, cyc,
      tent, dim), o.noW → hide the weights */
  function drawGraph(G, L, o = {}) {
    const { W, H, P, S } = L;
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'gl-svg', role: 'img', 'aria-label': o.aria || 'The graph: ' + G.n + ' vertices and ' + G.m + (G.directed ? ' arrows' : ' edges') });
    const gE = K.sv('g', {}), gW = K.sv('g', {}), gV = K.sv('g', {});
    const ecl = k => (o.e ? o.e(k) || '' : '');
    const unit = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [dx / l, dy / l]; };
    const edgeOf = (i, d) => { const s = S[i]; if (!s.pill) return s.hw; return Math.min(s.hw / Math.max(1e-6, Math.abs(d[0])), s.hh / Math.max(1e-6, Math.abs(d[1]))); };
    const cut = (i, c) => { const d = unit(P[i], c), r = edgeOf(i, d); return [P[i][0] + d[0] * r, P[i][1] + d[1] * r]; };
    const toward = (p, c, d) => { const u = unit(p, c); return [p[0] + u[0] * d, p[1] + u[1] * d]; };
    const head = (tip, c, cls) => { const d = unit(c, tip), n = [-d[1], d[0]], b = [tip[0] - d[0] * 10, tip[1] - d[1] * 10];
      return K.sv('path', { d: 'M' + fx(tip) + ' L' + fx([b[0] + n[0] * 5.2, b[1] + n[1] * 5.2]) + ' L' + fx([b[0] - n[0] * 5.2, b[1] - n[1] * 5.2]) + ' Z', class: 'ah ' + (cls || '') }); };
    function line(k, twin, bend) {
      const e = G.edges[k], p = P[e.u], q = P[e.v], len = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
      const ux = (q[0] - p[0]) / len, uy = (q[1] - p[1]) / len, nx = -uy, ny = ux;
      if (!bend) for (let i = 0; i < G.n; i++) {   // a vertex in the way: bend the edge around it
        if (i === e.u || i === e.v) continue;
        const along = (P[i][0] - p[0]) * ux + (P[i][1] - p[1]) * uy, off = (P[i][0] - p[0]) * nx + (P[i][1] - p[1]) * ny;
        if (along > 10 && along < len - 10 && Math.abs(off) < S[i].hw + 7) { bend = off > 0 ? -28 : 28; break; }
      }
      const c = [(p[0] + q[0]) / 2 + nx * bend, (p[1] + q[1]) / 2 + ny * bend];
      const a = cut(e.u, c), b = cut(e.v, c), hB = G.directed, hA = G.directed && twin >= 0;
      const cls = ecl(k), clsT = twin >= 0 ? ecl(twin) : cls, lc = stronger(cls, clsT);
      const a2 = hA ? toward(a, c, 9) : a, b2 = hB ? toward(b, c, 9) : b;
      gE.append(K.sv('path', { d: 'M' + fx(a2) + (bend ? ' Q' + fx(c) + ' ' : ' L') + fx(b2), class: 'e ' + lc }));
      if (hB) gE.append(head(b, c, cls));
      if (hA) gE.append(head(a, c, clsT));
      if (G.weighted && !o.noW) {
        const m = [0.25 * p[0] + 0.5 * c[0] + 0.25 * q[0], 0.25 * p[1] + 0.5 * c[1] + 0.25 * q[1]];
        gW.append(K.sv('text', { x: m[0].toFixed(1), y: (m[1] + 4.5).toFixed(1), 'text-anchor': 'middle', class: 'w ' + lc }, minus(e.w)));
      }
    }
    const drawn = new Set();
    G.edges.forEach((e, k) => {
      if (drawn.has(k)) return;
      const twin = G.directed ? G.E[e.v][e.u] : -1;
      if (twin >= 0 && G.edges[twin].w === e.w) { drawn.add(twin); line(k, twin, 0); }   // one line, a head at each end
      else line(k, -1, twin >= 0 ? 14 : 0);                                              // arrows both ways with different weights: two curves
    });
    G.labels.forEach((l, i) => {
      const [x, y] = P[i], s = S[i], g = K.sv('g', { class: 'v ' + (o.v ? o.v(i) || '' : '') });
      g.append(s.pill ? K.sv('rect', { x: (x - s.hw).toFixed(1), y: (y - s.hh).toFixed(1), width: 2 * s.hw, height: 2 * s.hh, rx: s.hh }) : K.sv('circle', { cx: x.toFixed(1), cy: y.toFixed(1), r: VR }));
      g.append(K.sv('text', { x: x.toFixed(1), y: (y + 4.6).toFixed(1), 'text-anchor': 'middle' }, l));
      const tg = o.tag ? o.tag(i) : null;
      if (tg != null && tg !== '' && !(Array.isArray(tg) && !tg.length)) {
        const tx = K.sv('text', { x: x.toFixed(1), y: (y - s.hh - 6).toFixed(1), 'text-anchor': 'middle', class: 'tag' });
        (Array.isArray(tg) ? tg : [[String(tg), '']]).forEach(([v, c]) => tx.append(K.sv('tspan', { class: c || null }, v)));
        g.append(tx);
      }
      gV.append(g);
    });
    svg.append(gE, gW, gV);
    return h('div', { class: 'lk-chart-wrap gl-pic' }, svg);
  }
  /** a key to the colours: [['v' | 'e', class, words], …] */
  const legend = items => h('div', { class: 'gl-legend' }, items.map(([kind, cls, text]) => h('span', {}, h('i', { class: (kind === 'v' ? 'gl-dot ' : 'gl-key ') + cls }), text)));

  /* ================================================================== tables, queues and stacks */
  /** head = [html], rows = [[cell]]; a cell is html or { h: html, c: class, k: key for opt.click }; the first cell of a
      row is a heading; opt.rowCls(i) → the row's class */
  function tbl(head, rows, opt = {}) {
    const cell = (x, tag) => {
      const o = x != null && typeof x === 'object' ? x : { h: x };
      const el = h(tag, { class: o.c || null, html: K.rich(o.h == null ? '' : String(o.h)) });
      if (opt.click && tag === 'td' && o.k != null) { el.classList.add('cell'); el.addEventListener('click', () => opt.click(o.k)); }
      return el;
    };
    const t = h('table', { class: 'lk-table gl-t' + (opt.compact ? ' compact' : '') },
      head ? h('thead', {}, h('tr', {}, head.map(x => cell(x, 'th')))) : null,
      h('tbody', {}, rows.map((r, i) => h('tr', { class: opt.rowCls ? opt.rowCls(i) || null : null }, r.map((x, j) => cell(x, j === 0 ? 'th' : 'td'))))));
    return h('div', { class: 'lk-tbl' }, t);
  }
  /** an n × n table with the vertex names on top and on the left; cell(i, j) → html or { h, c, k } */
  const matTable = (G, cell, opt = {}) => tbl([opt.corner || ''].concat(G.labels.map((l, j) => (opt.colCls ? { h: l, c: opt.colCls(j) } : l))),
    range(G.n).map(i => [opt.rowCls ? { h: G.labels[i], c: opt.rowCls(i) } : G.labels[i]].concat(range(G.n).map(j => cell(i, j)))), { compact: true, click: opt.click });
  /** a row of boxes (a queue or a stack): items = [{ v: text, c: 'in' | 'out' }] */
  const boxes = (label, items, opt = {}) => h('div', { class: 'gl-q', role: 'group', 'aria-label': label },
    h('span', { class: 'gl-ql', text: label }),
    items.length && opt.left ? h('span', { class: 'gl-qend', text: opt.left }) : null,
    items.length ? items.map(x => h('span', { class: 'gl-qc ' + (x.c || ''), text: x.v })) : h('span', { class: 'gl-qe', text: opt.empty || 'empty' }),
    items.length && opt.right ? h('span', { class: 'gl-qend', text: opt.right }) : null);
  const sub = text => h('div', { class: 'gl-sub', html: K.rich(text) });

  /* ================================================================== the step-by-step card */
  const texs = tex => [].concat(tex || []).filter(Boolean).map(x => h('div', { class: 'lk-step-m', html: kxW(x) }));
  const desc = s => h('div', { class: 'gl-desc' }, h('div', { class: 'gl-head', html: K.rich(s.head) }), s.text ? h('div', { class: 'lk-step-t', html: K.rich(s.text) }) : null, ...texs(s.tex));
  /** Previous / Next, a slider, the words and maths of the step, its picture and tables (render(k) for step k = 0, 1, …),
      and "Show all steps" (every step's words and maths; tap one to go there). The step is kept in the link. */
  function stepCard(t, title, steps, render) {
    const n = steps.length;
    let k = Math.min(n, Math.max(1, Math.round(+t.s.v.step) || 1));
    const where = h('div', { class: 'gl-snum', 'aria-live': 'polite' });
    const prev = h('button', { class: 'btn gl-nav', type: 'button', 'aria-label': 'Previous step', text: '◀ Previous', onclick: () => go(k - 1) });
    const next = h('button', { class: 'btn gl-nav', type: 'button', 'aria-label': 'Next step', text: 'Next ▶', onclick: () => go(k + 1) });
    const slider = h('input', { class: 'gl-range', type: 'range', min: 1, max: Math.max(1, n), step: 1, value: k, 'aria-label': 'Step number' });
    slider.addEventListener('input', () => go(+slider.value));
    const body = h('div', { class: 'gl-sbody' }), list = h('ol', { class: 'lk-steps gl-list' });
    const allBox = K.check({ label: 'Show all ' + n + ' steps', value: +t.s.v.all === 1, onChange: on => { t.s.set({ all: on ? 1 : 0 }, true); fill(on); } });
    const card = K.card(title, h('div', { class: 'gl-navrow' }, prev, where, next), n > 1 ? slider : null, body, allBox, list);
    function fill(on) {
      list.innerHTML = '';
      list.hidden = !on;
      if (on) steps.forEach((s, i) => list.append(h('li', { onclick: () => { go(i + 1); card.scrollIntoView({ block: 'start' }); } },
        h('div', { class: 'lk-step-t', html: K.rich('<b>' + s.head + '</b>' + (s.text ? ' ' + s.text : '')) }), ...texs(s.tex))));
      mark();
    }
    function mark() { [...list.children].forEach((li, i) => li.classList.toggle('cur', i === k - 1)); }
    function go(i) { k = Math.min(n, Math.max(1, i)); t.s.set({ step: k }, true); paint(); }
    function paint() {
      where.textContent = 'Step ' + k + ' of ' + n;
      prev.disabled = k <= 1; next.disabled = k >= n; slider.value = k;
      body.innerHTML = '';
      body.append(desc(steps[k - 1]), ...[].concat(render(k - 1) || []).filter(Boolean));
      mark();
    }
    paint();
    fill(+t.s.v.all === 1);
    return card;
  }

  /* ================================================================== the frame every topic shares */
  /** rebuild the controls, keeping the keyboard focus on the same control */
  function refill(box, fill) {
    const all = () => [...box.querySelectorAll('button, input, select, textarea')];
    const i = all().indexOf(document.activeElement);
    box.innerHTML = '';
    fill();
    const el = i >= 0 ? all()[i] : null;
    if (el) el.focus({ preventScroll: true });
  }
  /** values from the link (checked by fix(v, G), G = the graph or null when it has a mistake), the controls built by
      ui (which may set t.dyn and t.dynFill: the controls that depend on the vertices), the output by draw(G) */
  function topic(el, query, ctx, defaults, fix) {
    const t = { ui: () => {}, draw: () => {}, dyn: null, dynFill: null };
    t.s = K.state(ctx, defaults, query, () => t.draw());
    t.fix = () => {
      const v = t.s.v;
      v.g = String(v.g == null ? '' : v.g).slice(0, 1200);
      v.at = String(v.at || '');
      v.step = Math.max(1, Math.round(+v.step) || 1);
      v.all = +v.all === 1 ? 1 : 0;
      t.G = parseGraph(v.g);
      fix(v, t.G.err ? null : t.G);
    };
    t.fix();
    const f = K.layout(el);
    f.controls.classList.add('gl-controls');
    f.out.classList.add('gl-out');
    t.controls = f.controls; t.out = f.out;
    /** new values (a Try graph): check them, rebuild the controls, redraw */
    t.load = patch => { t.s.set(Object.assign({ step: 1 }, patch), true); t.fix(); t.s.set({}, true); refill(t.controls, t.ui); t.draw(); };
    /** the typed graph changed: rebuild only the controls that depend on its vertices, redraw */
    t.regraph = text => { t.s.set({ g: text, step: 1 }, true); t.fix(); t.s.set({}, true); if (t.dyn) { t.dyn.innerHTML = ''; if (t.dynFill) t.dynFill(); } t.draw(); };   // the second set writes the checked values back to the link
    t.start = (ui, draw) => {
      t.ui = ui;
      t.draw = () => {
        t.out.innerHTML = '';
        if (t.G.err) { t.out.append(K.note('Your graph has a mistake: ' + safe(t.G.err), 'warn')); return; }
        draw(t.G);
      };
      refill(t.controls, ui);
      t.draw();
    };
    return t;
  }
  const HELP = 'Separate edges with commas. <code>0-1</code> an edge, <code>0>1</code> an arrow (then <code>0-1</code> means arrows both ways), <code>0-1:10</code> weight 10, a lone <code>5</code> a vertex with no edges. At most ' + MAXN + ' vertices and ' + MAXM + ' edges.';
  /** the box where the graph is typed (applied after a short pause, or when the box is left) */
  function graphBox(t, label) {
    const ta = h('textarea', { class: 'field gl-g', rows: 3, spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', 'aria-label': 'The graph as an edge list' });
    ta.value = t.s.v.g.replace(/,(?=\S)/g, ', ');   // a space after each comma, so lines break between edges, not inside one
    const err = h('div', { class: 'lk-err', hidden: t.G.err ? null : true, text: t.G.err || '' });
    if (t.G.err) ta.classList.add('bad');
    let timer = 0;
    const apply = () => {
      clearTimeout(timer);
      const v = ta.value.trim().replace(/\s*,\s*/g, ',');   // kept compact in the link
      if (v === t.s.v.g) return;
      t.regraph(v);
      err.hidden = !t.G.err; err.textContent = t.G.err || '';
      ta.classList.toggle('bad', !!t.G.err);
    };
    ta.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 450); });
    ta.addEventListener('change', apply);
    const id = 'gl-g' + Math.random().toString(36).slice(2, 8);
    ta.id = id;
    return h('div', { class: 'lk-field' }, h('label', { for: id, html: K.rich(label || 'Your graph') }), ta, h('div', { class: 'lk-help', html: HELP }), err);
  }
  /** "Try" chips: each loads a lecture's graph or a telling case ([label, values, tooltip]) */
  const tries = (list, load) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }),
    h('div', { class: 'lk-presets' }, list.map(([label, patch, title]) => h('button', { type: 'button', class: 'lk-chip gl-try', text: label, title: title || null, onclick: () => load(patch) }))));
  const vselect = (label, G, value, onChange, extra) => K.select({ label, options: (extra || []).concat(G.labels.map(l => [l, l])), value: String(value), onChange });
  const vOr = (G, x, d) => (G.idx.has(String(x)) ? String(x) : G.idx.has(String(d)) ? String(d) : G.labels[0]);

  /* ================================================================== algorithms */
  /** breadth-first search from s (lecture 10.4): visited, level, parent and the queue at every step; with forest, it
      starts again at the first unvisited vertex with the next component number until every vertex is visited (10.6) */
  function runBFS(G, s, forest) {
    const n = G.n, vis = Array(n).fill(false), lev = Array(n).fill(-1), par = Array(n).fill(-1), comp = Array(n).fill(-1), order = [];
    let Q = [], c = 0, start = s;
    const snap = () => ({ vis: vis.slice(), lev: lev.slice(), par: par.slice(), comp: comp.slice(), Q: Q.slice() });
    const steps = [];
    while (start != null) {
      vis[start] = true; lev[start] = 0; comp[start] = c; Q = [start]; order.push(start);
      steps.push({ kind: 'start', u: start, c, fresh: [start], looked: [], ...snap() });
      while (Q.length) {
        const u = Q.shift(), looked = [], fresh = [];
        for (const a of G.out[u]) {
          if (vis[a.v]) { looked.push({ v: a.v, e: a.e, old: true }); continue; }
          vis[a.v] = true; lev[a.v] = lev[u] + 1; par[a.v] = u; comp[a.v] = c; Q.push(a.v); order.push(a.v); fresh.push(a.v);
          looked.push({ v: a.v, e: a.e, old: false });
        }
        steps.push({ kind: 'explore', u, c, fresh, looked, ...snap() });
      }
      start = forest ? range(n).find(i => !vis[i]) : undefined;
      if (start != null) c++;
    }
    return { steps, vis, lev, par, comp, order, count: c + 1 };
  }
  /** depth-first search from s (lectures 10.5–10.7): the stack of suspended vertices and one counter for the pre and post
      numbers; with forest, it starts again at the first unvisited vertex until every vertex is visited (lecture 10.6) */
  function runDFS(G, s, forest) {
    const n = G.n, vis = Array(n).fill(false), pre = Array(n).fill(null), post = Array(n).fill(null), par = Array(n).fill(-1), comp = Array(n).fill(-1);
    let c = 0, cur = s, tree = 0;
    const stack = [], steps = [];
    const snap = () => ({ vis: vis.slice(), pre: pre.slice(), post: post.slice(), par: par.slice(), comp: comp.slice(), stack: stack.slice(), cur });
    const begin = v => { vis[v] = true; pre[v] = c++; comp[v] = tree; cur = v; };
    begin(s);
    steps.push({ kind: 'start', u: s, first: true, tree, ...snap() });
    for (let guard = 0; guard < 4 * n + 4; guard++) {
      const u = cur, nb = G.out[u], j = nb.findIndex(a => !vis[a.v]);
      if (j >= 0) {
        const a = nb[j], skipped = nb.slice(0, j).map(x => x.v);
        stack.push(u); par[a.v] = u; begin(a.v);
        steps.push({ kind: 'enter', u, v: a.v, e: a.e, skipped, resumed: pre[u] !== c - 2, tree, ...snap() });
        continue;
      }
      post[u] = c++;
      const back = stack.length ? stack.pop() : -1;
      if (back >= 0) cur = back;
      const rest = back < 0 && forest ? range(n).find(i => !vis[i]) : undefined;
      steps.push({ kind: 'finish', u, back, nbs: nb.map(x => x.v), tree, more: rest != null, ...snap() });
      if (back >= 0) continue;
      if (rest == null) break;
      tree++; begin(rest);
      steps.push({ kind: 'start', u: rest, first: false, tree, ...snap() });
    }
    return { steps, pre, post, par, comp, trees: tree + 1, vis, last: c - 1 };
  }
  /** shortest distances from s by Bellman–Ford with every edge counting 1 (a second way to get the BFS levels) */
  function unitDist(G, s) {
    let D = Array(G.n).fill(Infinity); D[s] = 0;
    for (let r = 1; r < G.n; r++) { const N = D.slice(); G.arcs.forEach(a => { if (D[a.u] + 1 < N[a.v]) N[a.v] = D[a.u] + 1; }); D = N; }
    return D;
  }
  /** the tree path from a to b (parents par): a, up to their common ancestor, down to b */
  function treePath(par, a, b) {
    const up = x => { const r = []; while (x >= 0) { r.push(x); x = par[x]; } return r; };
    const A = up(a), B = up(b), inB = new Set(B), top = A.find(x => inB.has(x));
    if (top == null) return null;
    return A.slice(0, A.indexOf(top) + 1).concat(B.slice(0, B.indexOf(top)).reverse());
  }
  const pathTo = (par, v) => { const p = []; for (let x = v, g = 0; x >= 0 && g < 64; x = par[x], g++) p.unshift(x); return p; };
  /** which vertices each vertex reaches by one or more arrows (BFS from each vertex) */
  function reachAll(G) {
    return range(G.n).map(s => {
      const r = Array(G.n).fill(false), Q = [];
      G.out[s].forEach(a => { if (!r[a.v]) { r[a.v] = true; Q.push(a.v); } });
      while (Q.length) { const u = Q.shift(); G.out[u].forEach(a => { if (!r[a.v]) { r[a.v] = true; Q.push(a.v); } }); }
      return r;
    });
  }
  /** lecture 10.10's argument: among the vertices not yet removed, all of in-degree ≥ 1, walk backwards along arrows
      coming in; with finitely many vertices one repeats, and the repeated stretch, read forwards, is a cycle */
  function backCycle(G, removed) {
    let x = range(G.n).find(i => !removed[i]);
    const walk = [], at = new Map();
    while (!at.has(x)) { at.set(x, walk.length); walk.push(x); x = G.inn[x].find(a => !removed[a.u]).u; }
    return { walk: walk.concat([x]), cyc: rotate(walk.slice(at.get(x)).reverse()) };
  }
  /** a cycle v0 → v1 → … → v0 (given without the last v0), started at its smallest vertex and closed */
  function rotate(c) { const m = c.indexOf(Math.min(...c)); const r = c.slice(m).concat(c.slice(0, m)); return r.concat([r[0]]); }
  /** topological sort by listing and removing a vertex of in-degree 0 (lecture 10.10), and the longest path to each
      vertex, worked out at the same time (lecture 11.1). tie: 'small', 'large' or 'order' (pref: the preferred order) */
  function runTopo(G, tie, pref) {
    const n = G.n, indeg = Array(n).fill(0), done = Array(n).fill(false), order = [], L = Array(n).fill(0), via = Array(n).fill(-1);
    G.arcs.forEach(a => indeg[a.v]++);
    const avail = () => range(n).filter(i => !done[i] && indeg[i] === 0), rank = new Map(pref.map((v, i) => [v, i]));
    const pick = A => (tie === 'large' ? A[A.length - 1] : tie === 'order' ? A.slice().sort((a, b) => (rank.has(a) ? rank.get(a) : 1e3 + a) - (rank.has(b) ? rank.get(b) : 1e3 + b))[0] : A[0]);
    const snap = () => ({ indeg: indeg.slice(), L: L.slice(), via: via.slice(), done: done.slice(), order: order.slice() });
    const steps = [{ kind: 'start', avail: avail(), ...snap() }];
    while (order.length < n) {
      const A = avail();
      if (!A.length) { const cyc = backCycle(G, done); steps.push({ kind: 'stuck', cyc, ...snap() }); return { steps, order, ok: false, L, via, cyc }; }
      const v = pick(A), dec = [];
      done[v] = true; order.push(v);
      for (const a of G.out[v]) {
        const from = indeg[a.v], old = L[a.v], cand = L[v] + (G.weighted ? a.w : 1);
        indeg[a.v]--;
        if (cand > old) { L[a.v] = cand; via[a.v] = v; }
        dec.push({ w: a.v, e: a.e, wt: a.w, from, to: indeg[a.v], old, cand, now: L[a.v] });
      }
      steps.push({ kind: 'list', v, A, dec, avail: avail(), ...snap() });
    }
    return { steps, order, ok: true, L, via };
  }
  /** how many topological orders there are (counted over the subsets of vertices already listed) */
  function countOrders(G) {
    const n = G.n, need = range(n).map(v => G.inn[v].reduce((m, a) => m | (1 << a.u), 0)), f = new Float64Array(1 << n);
    f[0] = 1;
    for (let S = 0; S < 1 << n; S++) { if (!f[S]) continue; for (let v = 0; v < n; v++) if (!((S >> v) & 1) && (need[v] & S) === need[v]) f[S | (1 << v)] += f[S]; }
    return f[(1 << n) - 1];
  }
  const prefOf = (G, ord) => String(ord || '').split(/[\s,;>]+/).filter(Boolean).map(x => (/^\d+$/.test(x) ? String(parseInt(x, 10)) : x)).filter(x => G.idx.has(x)).map(x => G.idx.get(x));
  /** the controls of the two topics built on topological sort: which vertex of in-degree 0 to take when there is a choice */
  function tieControls(t) {
    const s = t.s, ordBox = h('div', { hidden: s.v.tie === 'order' ? null : true });
    ordBox.append(K.text({ label: 'My order (vertices separated by commas)', value: s.v.ord, placeholder: 'e.g. 1, 0, 3, 2', onChange: x => { s.set({ ord: x.slice(0, 200), step: 1 }, true); t.draw(); } }));
    return [K.select({ label: 'When several vertices have in-degree 0, take', value: s.v.tie, options: [['small', 'the smallest first'], ['large', 'the largest first'], ['order', 'the first one in my order']],
      onChange: x => { s.set({ tie: x, step: 1 }, true); ordBox.hidden = x !== 'order'; t.draw(); } }), ordBox];
  }
  /** the edges from each parent to its child */
  const treeEdges = (G, par) => { const set = new Set(); par.forEach((p, v) => { if (p >= 0) set.add(G.E[p][v]); }); return set; };
  /** pre/post numbers above a vertex, coloured as on the slides */
  const prePost = (st, i) => (st.pre[i] == null ? null : st.post[i] == null ? [[String(st.pre[i]), 'pre']] : [[String(st.pre[i]), 'pre'], ['/', 'dull'], [String(st.post[i]), 'post']]);

  /* ------------------------------------------------------------------ BFS and DFS, step by step (shared by three topics) */
  /** the words and maths of every BFS step; forest: the search starts again with a new component number */
  function bfsSteps(G, X, R, forest) {
    const word = G.directed ? 'the arrows out of ' : 'the neighbours of ', lead = G.directed ? 'lead to ' : 'are ';
    return R.steps.map((st, idx) => {
      if (st.kind === 'start') {
        if (idx === 0) return { head: (forest ? 'Component 0: mark ' : 'Mark ') + X.n(st.u) + ' and add it to the queue',
          text: (forest ? 'Start at the first vertex, ' + X.b(st.u) + ', with component number 0: ' : 'Start at ' + X.b(st.u) + ': ') + 'visited(' + X.b(st.u) + ') = True, its level is 0 (it is 0 edges from itself) and it has no parent. No other vertex is visited yet (level −1).',
          tex: '\\text{level}(' + X.t(st.u) + ') = 0' + (forest ? ', \\ \\text{component}(' + X.t(st.u) + ') = 0' : '') };
        const left = range(G.n).filter(i => !R.steps[idx - 1].vis[i]);
        return { head: 'Component ' + st.c + ': start again at ' + X.n(st.u),
          text: 'The queue is empty, but ' + X.list(left) + (left.length === 1 ? ' is' : ' are') + ' not visited, so ' + (left.length === 1 ? 'it is' : 'they are') + ' outside the components found so far. Take the smallest, ' + X.b(st.u) + ', add 1 to the component number and start a new BFS there.',
          tex: '\\text{component}(' + X.t(st.u) + ') = ' + st.c + ', \\ \\text{level}(' + X.t(st.u) + ') = 0' };
      }
      const nbs = G.out[st.u].map(a => a.v), old = st.looked.filter(x => x.old).map(x => x.v), lv = st.lev[st.u];
      let text = 'Take ' + X.b(st.u) + ' from the front of the queue and explore it: ' + word + X.b(st.u) + ' (smallest first) ' + lead + (nbs.length ? X.list(nbs) : 'nothing') + '. ';
      if (old.length) text += X.list(old) + (old.length === 1 ? ' is' : ' are') + ' already visited: nothing to do. ';
      if (st.fresh.length) text += X.list(st.fresh) + (st.fresh.length === 1 ? ' is new: mark it visited, with' : ' are new: mark them visited, with') + ' level one more than that of ' + X.b(st.u) + ' and parent ' + X.b(st.u) + (forest ? ', in component ' + st.c : '') + ', and add ' + (st.fresh.length === 1 ? 'it' : 'them') + ' to the back of the queue.';
      else text += 'No new vertex.';
      if (!st.Q.length) text += forest ? ' The queue is empty: component ' + st.c + ' is complete.' : ' The queue is now empty, so BFS stops: every vertex reachable from ' + X.b(R.steps[0].u) + ' has been visited and explored.';
      return { head: 'Explore ' + X.n(st.u) + (st.fresh.length ? ', visit ' + X.set(st.fresh) : ': nothing new'), text,
        tex: st.fresh.map(v => '\\text{level}(' + X.t(v) + ') = \\text{level}(' + X.t(st.u) + ') + 1 = ' + lv + ' + 1 = ' + (lv + 1)) };
    });
  }
  /** the picture, queue and table of BFS step k */
  function bfsView(G, X, L, R, k, forest) {
    const st = R.steps[k], inQ = new Set(st.Q), fresh = new Set(st.fresh), tE = treeEdges(G, st.par), src = R.steps[0].u;
    const hot = new Map(st.looked.map(x => [x.e, x.old ? 'look' : 'hot'])), exploring = st.kind === 'explore' ? st.u : -1;
    return [
      drawGraph(G, L, {
        v: i => (i === src ? 'src ' : '') + (i === exploring ? 'cur' : fresh.has(i) ? 'new' : inQ.has(i) ? 'wait' : st.vis[i] ? (forest ? 'k' + (st.comp[i] % 8) : 'done') : ''),
        tag: i => (st.lev[i] >= 0 ? [[String(st.lev[i]), 'lv']] : null),
        e: k2 => hot.get(k2) || (tE.has(k2) ? 'tree' : ''),
      }),
      legend([['v', 'cur', 'explored now'], ['v', 'new', 'visited now'], ['v', 'wait', 'in the queue'], forest ? ['v', 'k0', 'explored (colour = component)'] : ['v', 'done', 'explored'], ['e', 'tree', 'parent → child'], ['e', 'look', 'already visited']]),
      K.p('<small>Small numbers above the vertices: their levels.</small>'),
      boxes('Queue', (exploring >= 0 ? [{ v: X.n(exploring), c: 'out' }] : []).concat(st.Q.map(v => ({ v: X.n(v), c: fresh.has(v) ? 'in' : '' }))), { left: 'front', right: 'back', empty: forest ? 'empty' : 'empty: BFS is over' }),
      tbl(['', 'visited'].concat(forest ? ['component'] : [], ['level', 'parent']), range(G.n).map(i => {
        const c = fresh.has(i) ? 'new' : '';
        return [G.labels[i], { h: st.vis[i] ? 'True' : 'False', c: c || (st.vis[i] ? '' : 'z') }].concat(forest ? [{ h: st.comp[i] >= 0 ? String(st.comp[i]) : '—', c }] : [],
          [{ h: st.lev[i] >= 0 ? String(st.lev[i]) : '−1', c: c || (st.lev[i] >= 0 ? '' : 'z') }, { h: st.par[i] >= 0 ? G.labels[st.par[i]] : '—', c }]);
      }), { compact: true, rowCls: i => (i === exploring ? 'cur' : '') }),
    ];
  }
  /** the words and maths of every DFS step; mode '' (one search), 'comp' (again and again, components) or 'tree'
      (again and again in a directed graph: a DFS forest) */
  function dfsSteps(G, X, R, mode) {
    const word = G.directed ? 'arrows out of ' : 'neighbours of ', S = R.steps[0].u;
    return R.steps.map((st, idx) => {
      if (st.kind === 'start') {
        if (st.first) return { head: (mode === 'comp' ? 'Component 0: start at ' : 'Start at ') + X.n(st.u), text: 'Mark ' + X.b(st.u) + ' visited' + (mode === 'comp' ? ' (component number 0)' : '') + '. The counter starts at 0, so ' + X.b(st.u) + ' gets the pre number 0.', tex: '\\text{pre}(' + X.t(st.u) + ') = 0' };
        const left = range(G.n).filter(i => !R.steps[idx - 1].vis[i]);
        return { head: (mode === 'comp' ? 'Component ' + st.tree + ': start again at ' : 'Start a new DFS tree at ') + X.n(st.u),
          text: 'The stack is empty, but ' + X.list(left) + (left.length === 1 ? ' is' : ' are') + ' not visited yet. Start a new DFS at the smallest, ' + X.b(st.u) + (mode === 'comp' ? ', with the next component number, ' + st.tree : '') + '. The counter goes on from where it stopped.',
          tex: '\\text{pre}(' + X.t(st.u) + ') = ' + st.pre[st.u] };
      }
      if (st.kind === 'enter') {
        const one = st.skipped.length === 1, sk = X.list(st.skipped);
        const pickTxt = G.directed
          ? (st.skipped.length ? 'The arrow' + (one ? '' : 's') + ' from ' + X.b(st.u) + ' to ' + sk + ' lead' + (one ? 's' : '') + ' to visited vertices, so the' : 'The') + ' first arrow to an unvisited vertex goes to ' + X.b(st.v) + '.'
          : (st.skipped.length ? 'Its neighbour' + (one ? ' ' : 's ') + sk + (one ? ' is' : ' are') + ' visited already, so the' : 'The') + ' first unvisited neighbour of ' + X.b(st.u) + ' is ' + X.b(st.v) + '.';
        return { head: 'Suspend ' + X.n(st.u) + ', explore ' + X.n(st.v),
          text: (st.resumed ? 'Back at ' + X.b(st.u) + '. ' : '') + pickTxt + ' Suspend ' + X.b(st.u) + ' (push it on the stack) and go to ' + X.b(st.v) + ': mark it visited, make ' + X.b(st.u) + ' its parent, and give it the next counter value.',
          tex: '\\text{pre}(' + X.t(st.v) + ') = ' + st.pre[st.v] };
      }
      const all = !st.nbs.length ? X.b(st.u) + ' has no ' + (G.directed ? 'arrows going out' : 'neighbours')
        : G.directed ? 'Every arrow out of ' + X.b(st.u) + ' (to ' + X.list(st.nbs) + ') leads to a visited vertex' : 'All the neighbours of ' + X.b(st.u) + ' (' + X.list(st.nbs) + ') are visited';
      let end = '';
      if (st.back >= 0) end = 'Backtrack: take ' + X.b(st.back) + ' from the top of the stack (the vertex suspended most recently) and go on exploring it.';
      else if (mode) end = 'The stack is empty: this ' + (mode === 'comp' ? 'component' : 'DFS tree') + ' is complete' + (st.more ? '.' : ', and every vertex is visited.');
      else { const lost = range(G.n).filter(i => !st.vis[i]); end = 'The stack is empty: DFS from ' + X.b(S) + ' is over.' + (lost.length ? ' It never reached ' + X.list(lost) + '.' : ''); }
      return { head: 'Finish ' + X.n(st.u) + (st.back >= 0 ? ', backtrack to ' + X.n(st.back) : ''), text: all + ', so ' + X.b(st.u) + ' is finished: it gets the next counter value as its post number. ' + end, tex: '\\text{post}(' + X.t(st.u) + ') = ' + st.post[st.u] };
    });
  }
  /** the picture, stack and table of DFS step k */
  function dfsView(G, X, L, R, k, mode) {
    const st = R.steps[k], onS = new Set(st.stack), tE = treeEdges(G, st.par), src = R.steps[0].u, over = st.kind === 'finish' && st.back < 0;
    const hotE = st.kind === 'enter' ? st.e : st.kind === 'finish' && st.back >= 0 ? G.E[st.back][st.u] : -1, pushed = st.kind === 'enter' ? st.u : -1;
    return [
      drawGraph(G, L, {
        v: i => (i === src ? 'src ' : '') + (i === st.cur && !over ? 'cur' : onS.has(i) ? 'wait' : st.post[i] != null ? (mode === 'comp' ? 'k' + (st.comp[i] % 8) : 'done') : ''),
        tag: i => prePost(st, i),
        e: k2 => (k2 === hotE ? 'hot' : tE.has(k2) ? 'tree' : ''),
      }),
      legend([['v', 'cur', 'exploring now'], ['v', 'wait', 'suspended (on the stack)'], mode === 'comp' ? ['v', 'k0', 'finished (colour = component)'] : ['v', 'done', 'finished'], ['e', 'tree', 'tree edge'], ['e', 'hot', 'this move']]),
      K.p('<small>Above each vertex: its <b style="color:var(--pick)">pre</b>/<b style="color:var(--z)">post</b> numbers.</small>'),
      boxes('Stack of suspended vertices', st.stack.map(v => ({ v: X.n(v), c: v === pushed ? 'in' : '' })).concat(st.kind === 'finish' && st.back >= 0 ? [{ v: X.n(st.back), c: 'out' }] : []), { left: 'bottom', right: 'top', empty: 'empty' }),
      tbl(['', 'visited'].concat(mode === 'comp' ? ['component'] : [], ['pre', 'post', 'parent']), range(G.n).map(i => {
        const nw = (st.kind === 'enter' && i === st.v) || (st.kind === 'start' && i === st.u), fin = st.kind === 'finish' && i === st.u;
        return [G.labels[i], { h: st.vis[i] ? 'True' : 'False', c: nw ? 'new' : st.vis[i] ? '' : 'z' }].concat(mode === 'comp' ? [{ h: st.comp[i] >= 0 ? String(st.comp[i]) : '—', c: nw ? 'new' : '' }] : [],
          [{ h: st.pre[i] == null ? '—' : String(st.pre[i]), c: nw ? 'new' : '' }, { h: st.post[i] == null ? '—' : String(st.post[i]), c: fin ? 'new' : '' }, { h: st.par[i] >= 0 ? G.labels[st.par[i]] : '—', c: nw ? 'new' : '' }]);
      }), { compact: true, rowCls: i => (i === st.cur && !over ? 'cur' : '') }),
    ];
  }

  /* ------------------------------------------------------------------ shortest paths and spanning trees (Week 11) */
  /** Dijkstra (lectures 11.5, 11.6): B = burnt, T = expected burn time (EBT); burn the unburnt vertex with the smallest
      EBT (the first in order on a tie), then lower the EBT of its unburnt neighbours */
  function runDijkstra(G, s) {
    const n = G.n, T = Array(n).fill(Infinity), B = Array(n).fill(false), par = Array(n).fill(-1);
    T[s] = 0;
    const snap = () => ({ T: T.slice(), B: B.slice(), par: par.slice() });
    const steps = [{ kind: 'start', ...snap() }];
    for (let r = 0; r < n; r++) {
      const UB = range(n).filter(i => !B[i]);
      let j = UB[0];
      UB.forEach(i => { if (T[i] < T[j]) j = i; });
      if (T[j] === Infinity) { steps.push({ kind: 'stuck', UB, ...snap() }); break; }
      B[j] = true;
      const upd = [];
      for (const a of G.out[j]) {
        const cand = T[j] + a.w;
        if (B[a.v]) { upd.push({ k: a.v, e: a.e, w: a.w, burnt: true, cand, old: T[a.v] }); continue; }
        const old = T[a.v];
        if (cand < old) { T[a.v] = cand; par[a.v] = j; }
        upd.push({ k: a.v, e: a.e, w: a.w, old, cand, now: T[a.v] });
      }
      steps.push({ kind: 'burn', j, UB, upd, ...snap() });
    }
    return { steps, T, par };
  }
  /** Bellman–Ford as in lecture 11.6's table: each round compares every edge (j, k), using the distances of the round
      before; rounds 1 to n − 1, then round n as the check for a negative cycle */
  function runBF(G, s) {
    const n = G.n, cols = [], rounds = [], par = Array(n).fill(-1), pars = [];
    let D = Array(n).fill(Infinity);
    D[s] = 0; cols.push(D.slice()); pars.push(par.slice());
    for (let r = 1; r <= n; r++) {
      const prev = D, next = D.slice(), via = Array(n).fill(null), tries = [];
      for (const a of G.arcs) {
        const cand = prev[a.u] === Infinity ? Infinity : prev[a.u] + a.w;
        tries.push({ a, cand });
        if (cand < next[a.v]) { next[a.v] = cand; via[a.v] = a; }
      }
      const changed = range(n).filter(k => next[k] < prev[k]);
      changed.forEach(k => { par[k] = via[k].u; });
      rounds.push({ r, prev, next, tries, via, changed });
      D = next; cols.push(D.slice()); pars.push(par.slice());
    }
    const neg = rounds[n - 1].changed.length > 0;
    let cycle = null;
    if (neg) {   // walk back from a vertex that still dropped in round n: the walk has n edges, so a vertex repeats
      const seq = [];
      let r = n, k = rounds[n - 1].changed[0];
      while (seq.length <= n + 1) {
        let rr = r;
        while (rr > 0 && !rounds[rr - 1].changed.includes(k)) rr--;
        seq.push(k);
        if (rr === 0) break;
        k = rounds[rr - 1].via[k].u; r = rr - 1;
      }
      const at = new Map();
      for (let i = 0; i < seq.length && !cycle; i++) { if (at.has(seq[i])) cycle = rotate(seq.slice(at.get(seq[i]), i).reverse()); else at.set(seq[i], i); }
    }
    const still = rounds.findIndex(x => !x.changed.length);
    return { cols, rounds, pars, D: cols[Math.max(0, n - 1)], par: pars[Math.max(0, n - 1)], neg, cycle, settled: still < 0 ? null : still + 1 };
  }
  /** Floyd–Warshall (lecture 11.7): SP⁰ = W (∞ where there is no edge, also on the diagonal); allowing vertex k as a stop,
      SPᵏ⁺¹[i, j] = min(SPᵏ[i, j], SPᵏ[i, k] + SPᵏ[k, j]) */
  function runFW(G) {
    const n = G.n, mats = [range(n).map(i => range(n).map(j => (G.W[i][j] == null ? Infinity : G.W[i][j])))], changes = [];
    for (let k = 0; k < n; k++) {
      const P = mats[k], N = P.map(r => r.slice()), ch = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        if (P[i][k] === Infinity || P[k][j] === Infinity) continue;
        const via = P[i][k] + P[k][j];
        if (via < P[i][j]) { N[i][j] = via; ch.push({ i, j, old: P[i][j], a: P[i][k], b: P[k][j], via }); }
      }
      mats.push(N); changes.push(ch);
    }
    return { mats, changes };
  }
  /** the edges by weight, equal weights by their end points (lecture 11.10) */
  const sortEdges = G => G.edges.map((e, k) => ({ ...e, k })).sort((a, b) => a.w - b.w || a.u - b.u || a.v - b.v);
  /** Prim (lecture 11.9): TV, TE; start with the smallest edge (from = -1) or a vertex; again and again add the smallest
      edge with one end in TV and the other outside */
  function runPrim(G, from) {
    const n = G.n, sorted = sortEdges(G), inT = Array(n).fill(false), TV = [], TE = [], steps = [{ kind: 'start', TV: [], TE: [], cost: 0 }];
    let cost = 0;
    const snap = () => ({ TV: TV.slice(), TE: TE.slice(), cost });
    if (from < 0 && sorted.length) { const e = sorted[0]; inT[e.u] = inT[e.v] = true; TV.push(e.u, e.v); TE.push({ a: e.u, b: e.v, w: e.w, k: e.k }); cost = e.w; steps.push({ kind: 'first', e, ...snap() }); }
    else { const v = from < 0 ? 0 : from; inT[v] = true; TV.push(v); steps.push({ kind: 'vertex', v, ...snap() }); }
    while (TV.length < n) {
      const cand = sorted.filter(e => inT[e.u] !== inT[e.v]);
      if (!cand.length) { steps.push({ kind: 'stuck', ...snap() }); break; }
      const e = cand[0], a = inT[e.u] ? e.u : e.v, b = inT[e.u] ? e.v : e.u;
      const list = cand.map(x => ({ k: x.k, a: inT[x.u] ? x.u : x.v, b: inT[x.u] ? x.v : x.u, w: x.w }));
      const inside = sorted.filter(x => inT[x.u] && inT[x.v] && !TE.some(y => y.k === x.k) && sorted.indexOf(x) < sorted.indexOf(e));
      inT[b] = true; TV.push(b); TE.push({ a, b, w: e.w, k: e.k }); cost += e.w;
      steps.push({ kind: 'add', e, a, b, cand: list, inside, ...snap() });
    }
    return { steps, TE, TV, cost, complete: TV.length === n };
  }
  /** Kruskal (lecture 11.10): scan the sorted edges; add an edge when its ends are in different components, else skip it */
  function runKruskal(G) {
    const n = G.n, sorted = sortEdges(G), comp = range(n), TE = [], steps = [];
    let cost = 0;
    const groups = () => { const m = new Map(); range(n).forEach(i => { if (!m.has(comp[i])) m.set(comp[i], []); m.get(comp[i]).push(i); }); return [...m.values()]; };
    steps.push({ kind: 'sort', sorted, groups: groups(), TE: [], cost: 0 });
    sorted.forEach((e, i) => {
      const cu = comp[e.u], cv = comp[e.v], gu = groups().find(g => g.includes(e.u)), gv = groups().find(g => g.includes(e.v));
      if (cu !== cv) { range(n).forEach(x => { if (comp[x] === cv) comp[x] = cu; }); TE.push({ a: e.u, b: e.v, w: e.w, k: e.k }); cost += e.w; steps.push({ kind: 'add', i, e, gu, gv, groups: groups(), TE: TE.slice(), cost }); }
      else steps.push({ kind: 'skip', i, e, gu, groups: groups(), TE: TE.slice(), cost });
    });
    return { steps, sorted, TE, cost, complete: TE.length === n - 1 };
  }
  /** every spanning tree, when there are not too many choices of n − 1 edges: their number, the least cost, how many
      reach it */
  function allTrees(G, cap) {
    const n = G.n, m = G.m, need = n - 1;
    let comb = 1;
    for (let i = 0; i < need; i++) comb = (comb * (m - i)) / (i + 1);
    if (need < 1 || comb > cap) return null;
    let best = Infinity, nBest = 0, count = 0;
    const pick = [];
    const rec = start => {
      if (pick.length === need) {
        const p = range(n), f = x => (p[x] === x ? x : (p[x] = f(p[x])));
        let cost = 0;
        for (const k of pick) { const e = G.edges[k], a = f(e.u), b = f(e.v); if (a === b) return; p[a] = b; cost += e.w; }
        count++;
        if (cost < best) { best = cost; nBest = 1; } else if (cost === best) nBest++;
        return;
      }
      for (let k = start; k <= m - (need - pick.length); k++) { pick.push(k); rec(k + 1); pick.pop(); }
    };
    rec(0);
    return { count, best, nBest, comb };
  }
  const supU = x => String(x).split('').map(d => '⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  const subU = x => String(x).split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('');
  /** a cell of a distance table: ∞ faint */
  const dCell = (x, c) => ({ h: dH(x), c: ((c || '') + (x === Infinity ? ' inf' : '')).trim() });

  REV.lab('graphs', {
    /* ---------------------------------------------------------------- representation */
    // ?g=0>1,0-4,…&at=air&v=6&step=1&all=0   v = the vertex whose row, column and list are read (a vertex of g);
    //   step = 1 (empty) to m + 1 (filling the matrix and the lists one edge at a time)
    representation(el, query, ctx) {
      const t = topic(el, query, ctx, { g: AIR_D, at: 'air', v: '6', step: 1, all: 0 }, (v, G) => { if (G) v.v = vOr(G, v.v, '6'); });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('A program cannot look at a picture. It keeps a graph as an <b>adjacency matrix</b> (row $i$, column $j$ holds 1 when there is an edge from $i$ to $j$, else 0) or as <b>adjacency lists</b> (each vertex with the list of its neighbours). Type a graph and watch both being filled in, one edge at a time.'),
          graphBox(t),
          t.dyn = h('div', { class: 'lk-field' }),
          tries([
            ['Lecture 10.3: airline routes (directed)', { g: AIR_D, at: 'air', v: '6' }, 'Delhi is 0 and Madurai is 9. The drawing has arrows both ways between 4 and 7 (lecture 11.2’s matrix has both); the matrix on the 10.3 slide leaves out 7 → 4.'],
            ['Lecture 10.3: every route both ways', { g: AIR_U, at: 'air', v: '6' }, 'Undirected: the neighbours of 6 are 3 and 5, and the matrix is symmetric.'],
            ['Lecture 10.8: complete graph on 5 vertices', { g: K5, at: '', v: '0' }, 'Every vertex has degree n − 1 = 4; there are n(n − 1)/2 = 10 edges.'],
            ['Lecture 10.6: a tree (n − 1 edges)', { g: TREE5, at: 'conn', v: '2' }],
            ['Lecture 11.4: a weighted graph', { g: DIJ7, at: 'dij', v: '4' }, 'The weight goes in place of the 1: row 4, column 5 holds 50.'],
          ], t.load));
        t.dynFill = () => { if (!t.G.err) t.dyn.append(vselect('Read the row, column and list of vertex', t.G, s.v.v, x => { s.set({ v: x }, true); t.draw(); })); };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, m = G.m, out = t.out, vi = G.idx.get(s.v.v), dir = G.directed;
        const listN = dir ? m : 2 * m, val = w => (G.weighted ? minus(w) : '1');
        out.append(K.answer('Space for $n = ' + n + '$ vertices and $m = ' + m + '$ ' + (dir ? 'arrows' : 'edges'),
          '\\text{matrix: } n^2 = ' + n + '^2 = ' + n * n + ', \\quad \\text{lists: } n + ' + (dir ? 'm' : '2m') + ' = ' + n + ' + ' + listN + ' = ' + (n + listN),
          dir ? 'Each arrow is one entry of the matrix and one entry of a list; the matrix has $n^2$ places whatever $m$ is.' : 'Each edge is two entries of the matrix, at $(i, j)$ and $(j, i)$, and two list entries; the matrix has $n^2$ places whatever $m$ is.'));
        if (G.note) out.append(K.note(G.note));
        if (isAirD(G)) out.append(K.note('On the 10.3 slide, the matrix and the lists give 7 only the arrow to 8, but the drawing has arrows both ways between 4 and 7, and lecture 10.4 points out the missing entry (lecture 11.2’s matrix has it). The lab follows the drawing: 7 → 4 is in.'));
        const steps = [{ head: 'Start: a table of 0s and empty lists', text: 'The vertices in order: ' + G.labels.join(', ') + '. Make an $' + n + ' \\times ' + n + '$ table with a row and a column for each vertex, all 0, and an empty list for each vertex.', tex: 'A[i, j] = 0 \\text{ for every } i, j' }];
        G.edges.forEach(e => {
          const u = X.t(e.u), v = X.t(e.v), wTxt = G.weighted ? ' (weight ' + minus(e.w) + ')' : '';
          steps.push(dir
            ? { head: 'Arrow ' + X.n(e.u) + ' → ' + X.n(e.v) + wTxt, text: 'Rows hold the arrows going out: put ' + (G.weighted ? 'its weight' : 'a 1') + ' in row ' + X.b(e.u) + ', column ' + X.b(e.v) + ', and add ' + X.b(e.v) + ' to the list of ' + X.b(e.u) + '.', tex: 'A[' + u + ', ' + v + '] = ' + (G.weighted ? e.w : 1) }
            : { head: 'Edge ' + X.n(e.u) + '–' + X.n(e.v) + wTxt, text: 'An undirected edge goes both ways: put ' + (G.weighted ? 'its weight' : 'a 1') + ' in row ' + X.b(e.u) + ', column ' + X.b(e.v) + ' and in row ' + X.b(e.v) + ', column ' + X.b(e.u) + '; add ' + X.b(e.v) + ' to the list of ' + X.b(e.u) + ' and ' + X.b(e.u) + ' to the list of ' + X.b(e.v) + '.', tex: 'A[' + u + ', ' + v + '] = A[' + v + ', ' + u + '] = ' + (G.weighted ? e.w : 1) });
        });
        const fillTo = k => {   // the matrix and the lists after the first k edges
          const M = range(n).map(() => Array(n).fill(null)), lists = range(n).map(() => []);
          G.edges.slice(0, k).forEach((e, j) => { M[e.u][e.v] = { w: e.w, j }; lists[e.u].push({ v: e.v, w: e.w, j }); if (!dir) { M[e.v][e.u] = { w: e.w, j }; lists[e.v].push({ v: e.u, w: e.w, j }); } });
          lists.forEach(l => l.sort((a, b) => a.v - b.v));
          return { M, lists };
        };
        const listCell = (l, cur) => '{' + l.map(x => (x.j === cur ? '<b class="gl-no" style="color:var(--pick)">' : '') + G.labels[x.v] + (G.weighted ? ' (' + minus(x.w) + ')' : '') + (x.j === cur ? '</b>' : '')).join(', ') + '}';
        out.append(stepCard(t, 'Step by step: fill in the matrix and the lists', steps, k => {
          const cur = k - 1, { M, lists } = fillTo(k), ce = cur >= 0 ? G.edges[cur] : null;
          return [
            drawGraph(G, L, { e: j => (j === cur ? 'hot' : j < k ? 'tree' : 'dim'), v: i => (ce && (ce.u === i || ce.v === i) ? 'new' : '') }),
            legend([['e', 'hot', 'this ' + (dir ? 'arrow' : 'edge')], ['e', 'tree', 'already written down'], ['e', 'dim', 'still to come']]),
            sub('Adjacency matrix' + (G.weighted ? ' (weights in place of the 1s, as in lecture 11.4)' : '')),
            matTable(G, (i, j) => (M[i][j] ? { h: val(M[i][j].w), c: M[i][j].j === cur ? 'new' : '' } : { h: '0', c: 'z' })),
            sub('Adjacency lists'),
            tbl(['vertex', dir ? 'arrows go to' : 'neighbours'], range(n).map(i => [G.labels[i], { h: listCell(lists[i], cur), c: 'left' + (lists[i].some(x => x.j === cur) ? ' new' : '') }])),
          ];
        }));
        // reading the graph back
        const { M, lists } = fillTo(m);
        const outD = range(n).map(i => G.out[i].length), inD = range(n).map(i => G.inn[i].length);
        const rowN = G.out[vi].map(a => a.v), colN = G.inn[vi].map(a => a.u);
        const readSteps = [
          { text: 'From the matrix: scan the whole row ' + X.b(vi) + ', all ' + n + ' entries (even when most are 0), and keep the columns that hold ' + (G.weighted ? 'a weight' : 'a 1') + ': ' + (rowN.length ? X.list(rowN) : 'none') + '. That is $n = ' + n + '$ look-ups.', tex: '\\text{row } ' + X.t(vi) + ': \\ ' + range(n).map(j => (M[vi][j] ? val(M[vi][j].w).replace('−', '-') : '0')).join(',\\ ') },
          { text: 'From the lists: read the list of ' + X.b(vi) + ': ' + X.set(rowN) + '. That is only ' + pl(rowN.length, 'look-up') + ', one for each ' + (dir ? 'arrow out of' : 'neighbour of') + ' ' + X.b(vi) + '.' },
        ];
        if (dir) readSteps.push({ text: 'Arrows coming <i>in</i> to ' + X.b(vi) + ' are in column ' + X.b(vi) + ' of the matrix: ' + (colN.length ? X.list(colN) : 'none') + '. The lists keep only arrows going out, so finding the arrows into ' + X.b(vi) + ' means searching every list.', tex: '\\text{column } ' + X.t(vi) + ': \\ ' + range(n).map(i => (M[i][vi] ? val(M[i][vi].w).replace('−', '-') : '0')).join(',\\ ') });
        out.append(K.card('Reading the graph back: vertex ' + X.n(vi),
          matTable(G, (i, j) => (M[i][j] ? { h: val(M[i][j].w), c: i === vi || (dir && j === vi) ? 'new' : '' } : { h: '0', c: 'z' + (i === vi || (dir && j === vi) ? ' done' : '') }), { rowCls: i => (i === vi ? 'new' : ''), colCls: j => (dir && j === vi ? 'new' : '') }),
          K.steps(readSteps)));
        // degrees
        const sumOut = outD.reduce((a, b) => a + b, 0), sumIn = inD.reduce((a, b) => a + b, 0), odd = range(n).filter(i => outD[i] % 2 === 1);
        const degRows = range(n).map(i => (dir ? [G.labels[i], String(outD[i]), String(inD[i])] : [G.labels[i], String(outD[i])]));
        const degSteps = dir
          ? [
            { text: 'Each arrow leaves one vertex and enters one vertex, so it adds 1 to one out-degree and 1 to one in-degree. Both sums are the number of arrows $m$ (lecture 10.8):', tex: '\\sum \\text{out-degrees} = ' + outD.join(' + ') + ' = ' + sumOut },
            { tex: '\\sum \\text{in-degrees} = ' + inD.join(' + ') + ' = ' + sumIn + (sumIn === m && sumOut === m ? ' = m' : '') },
          ]
          : [
            { text: 'Each edge adds 1 to the degree of both its ends, so the degrees add up to twice the number of edges (lecture 10.8):', tex: '\\sum \\deg = ' + outD.join(' + ') + ' = ' + sumOut + ' = 2 \\times ' + m },
            { text: 'Vertices of odd degree: ' + (odd.length ? X.list(odd) : 'none') + '. Their number must be even, since odd degrees must pair up to make the even total ' + sumOut + '.', tex: '\\text{odd-degree vertices: } ' + odd.length },
            { text: 'Every degree lies between 0 (no neighbour) and $n - 1 = ' + (n - 1) + '$ (joined to every other vertex), as lecture 10.3 says.' },
          ];
        const okDeg = dir ? sumIn === m && sumOut === m : sumOut === 2 * m && odd.length % 2 === 0 && outD.every(d => d <= n - 1);
        out.append(K.card(dir ? 'In-degree and out-degree' : 'Degrees',
          K.p(dir ? 'The <b>out-degree</b> of a vertex is the number of arrows leaving it (the 1s in its row); the <b>in-degree</b> is the number of arrows coming in (the 1s in its column).' : 'The <b>degree</b> of a vertex is the number of edges at it: the 1s in its row (or column; the matrix is symmetric), or the length of its list.'),
          tbl(dir ? ['vertex', 'out-degree (row)', 'in-degree (column)'] : ['vertex', 'degree'], degRows, { compact: true }),
          K.steps(degSteps),
          K.note(okDeg ? (dir ? 'Both sums equal $m = ' + m + '$ ✓' : 'The sum is $2m = ' + 2 * m + '$ and the number of odd-degree vertices is even ✓') : 'The degrees do not add up ✗', okDeg ? 'good' : 'warn')));
        // size and time
        out.append(K.card('Which representation, and why',
          tbl(['', 'adjacency matrix', 'adjacency lists'], [
            ['space', '$n^2 = ' + n * n + '$', '$n + ' + (dir ? 'm' : '2m') + ' = ' + (n + listN) + '$'],
            ['is there an edge $(i, j)$?', 'one look at $A[i, j]$', 'walk down the list of $i$'],
            ['all neighbours of $i$', 'scan the row: $n$ steps', 'read the list: $\\deg(i)$ steps'],
            ['BFS or DFS (lecture 10.8)', '$n \\times n = ' + n * n + '$ steps', '$n + ' + (dir ? 'm' : '2m') + ' = ' + (n + listN) + '$ steps'],
          ]),
          K.p('Most of the matrix is 0 when $m$ is small (here ' + (n * n - (dir ? m : 2 * m)) + ' of the ' + n * n + ' entries are 0). A graph can have up to $' + (dir ? 'n(n-1) = ' + n * (n - 1) : '\\tfrac{n(n-1)}{2} = ' + (n * (n - 1)) / 2) + '$ ' + (dir ? 'arrows' : 'edges') + ', but most graphs have far fewer, so the lists usually save space and time.')));
      }
    },

    /* ---------------------------------------------------------------- bfs */
    // ?g=…&at=air&src=7&to=2&step=1&all=0   src = the start vertex, to = the vertex whose path is traced back through the
    //   parents (both vertices of g); step = 1 to (number of reachable vertices) + 1
    bfs(el, query, ctx) {
      const t = topic(el, query, ctx, { g: AIR_U, at: 'air', src: '7', to: '2', step: 1, all: 0 }, (v, G) => { if (G) { v.src = vOr(G, v.src, '7'); v.to = vOr(G, v.to, G.labels[G.n - 1]); } });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('<b>Breadth-first search</b> (BFS) explores a graph level by level: first the start, then its neighbours, then their neighbours. A <b>queue</b> (first in, first out) holds the vertices that are visited but not yet explored.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn', style: 'display:grid;gap:14px' }),
          tries([
            ['Lecture 10.4: BFS from 7', { g: AIR_U, at: 'air', src: '7', to: '2' }, 'Explore 7, visit {4, 5, 8}; explore 4, visit {0, 3}; … The path to 2 is 7, 4, 0, 2.'],
            ['Lecture 10.3: Madurai (9) to Delhi (0), one-way routes', { g: AIR_D, at: 'air', src: '9', to: '0' }],
            ['Lecture 10.6: a graph in pieces', { g: COMP12, at: 'comp', src: '0', to: '11' }, 'BFS from 0 never reaches the other components.'],
            ['Lecture 10.7: directed, from 0', { g: DIR8, at: 'dir8', src: '0', to: '7' }],
          ], t.load));
        t.dynFill = () => {
          if (t.G.err) return;
          t.dyn.append(vselect('Start vertex', t.G, s.v.src, x => { s.set({ src: x, step: 1 }, true); t.draw(); }),
            vselect('Trace the path to', t.G, s.v.to, x => { s.set({ to: x }, true); t.draw(); }));
        };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, out = t.out, S = G.idx.get(s.v.src), T = G.idx.get(s.v.to), R = runBFS(G, S, false);
        if (G.note) out.append(K.note(G.note));
        const order = X.path(R.order).replace(/ → /g, ', ');
        if (R.vis[T]) out.append(K.answer('Fewest ' + (G.directed ? 'arrows' : 'edges') + ' from ' + X.n(S) + ' to ' + X.n(T), X.pathT(pathTo(R.par, T)) + ' \\quad (\\text{level of } ' + X.t(T) + ' = ' + R.lev[T] + ')', 'BFS visits ' + order + '.'));
        else out.append(K.answer(X.n(T) + ' cannot be reached from ' + X.n(S), '\\text{level}(' + X.t(T) + ') = -1', 'BFS from ' + X.n(S) + ' visits only ' + order + '.'));
        if (G.weighted) out.append(K.note('BFS ignores the weights: it counts edges. For weighted shortest paths see Dijkstra (lecture 11.5).'));
        out.append(stepCard(t, 'Step by step: the queue, visited, level and parent', bfsSteps(G, X, R, false), k => bfsView(G, X, L, R, k, false)));
        // the result
        const tE = treeEdges(G, R.par), maxL = Math.max(...R.lev), byLevel = range(maxL + 1).map(l => range(n).filter(i => R.lev[i] === l)), lost = range(n).filter(i => !R.vis[i]);
        out.append(K.card('The BFS tree and the levels',
          drawGraph(G, L, { v: i => (i === S ? 'src done' : R.vis[i] ? 'done' : 'off'), tag: i => (R.lev[i] >= 0 ? [[String(R.lev[i]), 'lv']] : null), e: k => (tE.has(k) ? 'tree' : 'dim') }),
          K.p('The edges from each parent to its child form a <b>tree</b>: ' + (n - lost.length - 1) + ' edges joining the ' + (n - lost.length) + ' visited vertices. The <b>level</b> of a vertex is the number of edges on the shortest path from ' + X.b(S) + '.'),
          tbl(['level', 'vertices'], byLevel.map((l, i) => [String(i), { h: X.set(l), c: 'left' }]).concat(lost.length ? [['not reached', { h: X.set(lost), c: 'left bad' }]] : []), { compact: true })));
        if (R.vis[T]) {
          const p = pathTo(R.par, T), back = p.slice().reverse();
          const st2 = back.slice(0, -1).map(v => ({ text: X.b(v) + ' was visited from ' + X.b(R.par[v]) + ':', tex: '\\text{parent}(' + X.t(v) + ') = ' + X.t(R.par[v]) }));
          st2.push({ text: X.b(S) + ' has no parent: it is the start. Read the chain backwards:', tex: X.pathT(p) + ' \\quad (' + (p.length - 1) + ' \\text{ edges} = \\text{level}(' + X.t(T) + '))' });
          out.append(K.card('The path from ' + X.n(S) + ' to ' + X.n(T) + ', by the parents', K.p('Each vertex remembers the vertex it was reached from. Follow the parents from ' + X.b(T) + ' back to ' + X.b(S) + ' (lecture 10.4):'), K.steps(st2)));
        }
        const D = unitDist(G, S), agree = range(n).every(i => (R.lev[i] < 0 ? D[i] === Infinity : D[i] === R.lev[i]));
        out.append(K.card('Check: levels are shortest distances',
          K.p('Count the fewest edges to each vertex another way: Bellman–Ford (lecture 11.6) with every edge counting 1.'),
          tbl(['vertex', 'BFS level', 'fewest edges'], range(n).map(i => [G.labels[i], R.lev[i] >= 0 ? String(R.lev[i]) : 'not reached', dH(D[i])]), { compact: true }),
          K.note(agree ? 'The same for every vertex ✓' : 'They differ ✗', agree ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- dfs */
    // ?g=…&at=air&src=4&to=7&step=1&all=0   src = the start vertex, to = the vertex whose DFS path is compared with the
    //   shortest one (both vertices of g); step = 1 to 2 × (number of reachable vertices)
    dfs(el, query, ctx) {
      const t = topic(el, query, ctx, { g: AIR_U, at: 'air', src: '4', to: '7', step: 1, all: 0 }, (v, G) => { if (G) { v.src = vOr(G, v.src, '4'); v.to = vOr(G, v.to, G.labels[G.n - 1]); } });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('<b>Depth-first search</b> (DFS) goes as deep as it can: from a vertex it goes to the first unvisited neighbour, and only when it is stuck does it come back. The vertices it has left half-done wait on a <b>stack</b> (last in, first out). A counter gives each vertex a <b>pre</b> number when DFS enters it and a <b>post</b> number when it finishes it.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn', style: 'display:grid;gap:14px' }),
          tries([
            ['Lecture 10.5: DFS from 4', { g: AIR_U, at: 'air', src: '4', to: '7' }, 'Mark 4, suspend 4, explore 0; suspend 0, explore 1; … The DFS path to 7 is 4, 3, 5, 7.'],
            ['Lecture 10.7: directed, from 0', { g: DIR8, at: 'dir8', src: '0', to: '7' }, 'Pre and post numbers 0 to 15.'],
            ['Lecture 10.6: DFS from 0', { g: COMP12, at: 'comp', src: '0', to: '9' }],
            ['Lecture 10.3: one-way routes from 9', { g: AIR_D, at: 'air', src: '9', to: '0' }],
          ], t.load));
        t.dynFill = () => {
          if (t.G.err) return;
          t.dyn.append(vselect('Start vertex', t.G, s.v.src, x => { s.set({ src: x, step: 1 }, true); t.draw(); }),
            vselect('Compare the path to', t.G, s.v.to, x => { s.set({ to: x }, true); t.draw(); }));
        };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, out = t.out, S = G.idx.get(s.v.src), T = G.idx.get(s.v.to), R = runDFS(G, S, false);
        const seen = range(n).filter(i => R.vis[i]), byPre = seen.slice().sort((a, b) => R.pre[a] - R.pre[b]), byPost = seen.slice().sort((a, b) => R.post[a] - R.post[b]);
        if (G.note) out.append(K.note(G.note));
        out.append(K.answer('DFS from ' + X.n(S) + ' enters the vertices in this order', byPre.map(i => X.t(i)).join(',\\ '), 'It finishes them in the order ' + byPost.map(i => X.n(i)).join(', ') + '. The counter ends at ' + R.last + ' = 2 × ' + seen.length + ' − 1.'));
        out.append(stepCard(t, 'Step by step: the stack, the counter and the tree', dfsSteps(G, X, R, ''), k => dfsView(G, X, L, R, k, '')));
        // the result
        const tE = treeEdges(G, R.par), non = G.edges.map((e, k) => k).filter(k => !tE.has(k) && R.vis[G.edges[k].u] && R.vis[G.edges[k].v]);
        out.append(K.card('The DFS tree',
          drawGraph(G, L, { v: i => (i === S ? 'src done' : R.vis[i] ? 'done' : 'off'), tag: i => prePost(R, i), e: k => (tE.has(k) ? 'tree' : non.includes(k) ? 'non' : 'dim') }),
          legend([['e', 'tree', 'tree edges'], ['e', 'non', 'not used by the DFS (non-tree)']]),
          tbl(['vertex', 'pre', 'post', 'parent'], range(n).map(i => [G.labels[i], R.pre[i] == null ? '—' : String(R.pre[i]), R.post[i] == null ? '—' : String(R.post[i]), R.par[i] >= 0 ? G.labels[R.par[i]] : '—']), { compact: true, rowCls: i => (R.vis[i] ? '' : 'off') }),
          K.p('Non-tree edges: ' + (non.length ? non.map(k => X.e(G.edges[k].u, G.edges[k].v)).join(', ') : 'none') + '.' + (G.directed ? '' : ' In an undirected graph each one closes a cycle (lecture 10.6).'))));
        if (R.vis[T] && T !== S) {
          const p = pathTo(R.par, T), D = unitDist(G, S);
          out.append(K.card('The DFS path is not always the shortest',
            K.steps([
              { text: 'Follow the parents from ' + X.b(T) + ' back to ' + X.b(S) + ': the path DFS found has ' + pl(p.length - 1, 'edge') + '.', tex: X.pathT(p) },
              { text: 'BFS (or Bellman–Ford with every edge counting 1) finds the fewest edges:', tex: '\\text{fewest edges from } ' + X.t(S) + ' \\text{ to } ' + X.t(T) + ' = ' + D[T] },
            ]),
            K.note(p.length - 1 === D[T] ? 'Here the DFS path happens to be a shortest one.' : 'DFS went the long way round (lecture 10.5): it finds paths, not shortest paths. Its numbering is what makes it useful.')));
        }
        const nested = range(n).every(v => R.par[v] < 0 || (R.pre[R.par[v]] < R.pre[v] && R.post[v] < R.post[R.par[v]]));
        const okLast = R.last === 2 * seen.length - 1;
        out.append(K.card('Check the numbering',
          K.steps([
            { text: 'The counter goes up once when DFS enters a vertex and once when it leaves, so ' + seen.length + ' visited vertices use the numbers 0 to $2 \\times ' + seen.length + ' - 1$ (lecture 10.7).', tex: '\\text{last number} = ' + R.last + (okLast ? ' = 2 \\times ' + seen.length + ' - 1' : '') },
            { text: 'A child is entered after its parent and finished before it, so for every tree edge the child’s interval [pre, post] lies inside the parent’s.' },
          ]),
          K.note((okLast ? 'The last number is right ✓ ' : 'The last number is wrong ✗ ') + (nested ? 'and every child’s interval lies inside its parent’s ✓' : 'but some intervals do not nest ✗'), okLast && nested ? 'good' : 'warn')));
      }
    },
    /* ---------------------------------------------------------------- components */
    // ?g=…&at=comp&by=bfs&step=1&all=0   by = bfs | dfs: the search repeated from the smallest unvisited vertex in an
    //   undirected graph (a directed graph always uses DFS, for its pre/post numbers); step = 1 to the number of steps
    components(el, query, ctx) {
      const t = topic(el, query, ctx, { g: COMP12, at: 'comp', by: 'bfs', step: 1, all: 0 }, v => { if (v.by !== 'dfs') v.by = 'bfs'; });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('Search again and again: a BFS or DFS from the smallest unvisited vertex finds one <b>connected component</b>, everything reachable from it. Number it, then start again. The edges a search does not use reveal the <b>cycles</b>, and BFS levels tell whether <b>two colours</b> are enough. In a directed graph, DFS numbers sort the other edges into forward, back and cross edges: a back edge means a cycle.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn' }),
          tries([
            ['Lecture 10.6: three components', { g: COMP12, at: 'comp', by: 'bfs' }, 'Components 0, 1, 2 start at 0, 2 and 5. BFS leaves out the edges 8–9, 3–7, 6–7 and 7–10, and each closes a cycle.'],
            ['Lecture 10.6: the same by DFS, numbers 0 to 23', { g: COMP12, at: 'comp', by: 'dfs' }],
            ['Lecture 10.6: connected, one cycle', { g: CONN5, at: 'conn', by: 'bfs' }],
            ['Lecture 10.6: acyclic (a tree)', { g: TREE5, at: 'conn', by: 'bfs' }],
            ['Lecture 10.7: directed: forward, back and cross edges', { g: DIR8, at: 'dir8', by: 'dfs' }, 'Forward 0 → 5 and 4 → 7, back 5 → 1 and 3 → 0, cross 6 → 7 and 3 → 6; components {1, 4, 5}, {0, 2, 3}, {6}, {7}.'],
            ['An even cycle: two colours work (the lab’s own)', { g: '0-1,1-2,2-3,3-4,4-5,5-0', at: '', by: 'bfs' }],
          ], t.load));
        t.dynFill = () => { if (!t.G.err && !t.G.directed) t.dyn.append(K.seg({ label: 'Search with', options: [['bfs', 'BFS'], ['dfs', 'DFS']], value: s.v.by, onChange: x => { s.set({ by: x, step: 1 }, true); t.draw(); } })); };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at);
        if (G.note) t.out.append(K.note(G.note));
        if (G.directed) directed(G, X, L); else undirected(G, X, L);
      }
      function undirected(G, X, L) {
        const out = t.out, n = G.n, useB = s.v.by === 'bfs', R = useB ? runBFS(G, 0, true) : runDFS(G, 0, true);
        const comp = R.comp, C = Math.max(...comp) + 1, groups = range(C).map(c => range(n).filter(i => comp[i] === c));
        const tE = treeEdges(G, R.par), non = range(G.m).filter(k => !tE.has(k));
        const B = useB ? R : runBFS(G, 0, true), col = range(n).map(i => B.lev[i] % 2), clash = range(G.m).filter(k => col[G.edges[k].u] === col[G.edges[k].v]);
        out.append(K.answer(pl(C, 'connected component'), groups.map((g, c) => 'C_{' + c + '} = ' + X.setT(g)).join(',\\quad '),
          (non.length ? 'It has cycles: ' + pl(non.length, 'edge') + (non.length === 1 ? ' lies' : ' lie') + ' outside the search trees. ' : 'No cycles: every component is a tree. ') + (clash.length ? 'Two colours are not enough.' : 'Two colours are enough.')));
        out.append(stepCard(t, 'Step by step: ' + (useB ? 'BFS' : 'DFS') + ' again and again, with component numbers', useB ? bfsSteps(G, X, R, true) : dfsSteps(G, X, R, 'comp'), k => (useB ? bfsView(G, X, L, R, k, true) : dfsView(G, X, L, R, k, 'comp'))));
        const lone = groups.filter(g => g.length === 1).map(g => g[0]);
        out.append(K.card('The connected components',
          drawGraph(G, L, { v: i => 'k' + (comp[i] % 8), tag: i => [['C' + comp[i], 'dull']] }),
          legend(groups.map((g, c) => ['v', 'k' + (c % 8), 'component ' + c + ': ' + X.set(g)])),
          K.p('Two vertices are joined by a path exactly when they have the same component number, so after the searches this is a single look-up (lecture 10.6). ' + (C === 1 ? 'Here every vertex is in component 0: the graph is <b>connected</b>.' : '') + (lone.length ? ' ' + X.list(lone) + (lone.length === 1 ? ' has' : ' have') + ' no edges: a component of one vertex.' : ''))));
        const nTree = n - C, cyc = non.map(k => { const e = G.edges[k], p = treePath(R.par, e.u, e.v); return { e, p }; });
        out.append(K.card('Search trees and cycles',
          drawGraph(G, L, { v: i => 'k' + (comp[i] % 8), e: k => (tE.has(k) ? 'tree' : 'non') }),
          legend([['e', 'tree', 'used by the ' + (useB ? 'BFS' : 'DFS') + ': tree edges'], ['e', 'non', 'not used: non-tree edges']]),
          K.steps([
            { text: 'A component with $k$ vertices gets a tree with $k - 1$ edges (lecture 10.6: a tree on $k$ vertices has $k - 1$ edges). So the ' + pl(C, 'tree') + ' together have', tex: 'n - c = ' + n + ' - ' + C + ' = ' + nTree + ' \\text{ tree edges}' },
            { text: 'The graph has $m = ' + G.m + '$ edges, so the searches leave out', tex: 'm - (n - c) = ' + G.m + ' - ' + nTree + ' = ' + non.length + ' \\text{ non-tree edges}' },
            ...cyc.map(x => ({ text: 'The non-tree edge ' + X.e(x.e.u, x.e.v) + ' joins two vertices that the tree already joins; tree path plus edge make a cycle:', tex: X.pathT(x.p.concat([x.p[0]])) })),
          ]),
          K.note(non.length ? 'There are non-tree edges, so the graph has cycles. With none, it would be acyclic (a forest).' : 'Every edge is a tree edge: the graph is acyclic, a forest of ' + pl(C, 'tree') + ' ✓', non.length ? '' : 'good')));
        const blue = range(n).filter(i => col[i] === 0), orange = range(n).filter(i => col[i] === 1);
        let tail;
        if (clash.length) {
          const e = G.edges[clash[0]], p = treePath(B.par, e.u, e.v), len = p.length;
          tail = [K.steps([
            { text: 'The edge ' + X.e(e.u, e.v) + ' joins two vertices of the same level, ' + B.lev[e.u] + ', so both ends get the same colour.' },
            { text: 'With the BFS tree path between its ends it makes a cycle with ' + len + ' edges, an odd number:', tex: X.pathT(p.concat([p[0]])) },
            { text: 'Around a cycle the colours must take turns, which needs an even number of edges. An odd cycle can never be coloured with two colours, however you try.' },
          ]), K.note('Two colours are not enough: the graph has an odd cycle.', 'warn')];
        } else tail = [K.p('Blue: ' + X.set(blue) + '. Orange: ' + X.set(orange) + '.'), K.note('Every edge joins a blue and an orange vertex: two colours are enough ✓', 'good')];
        out.append(K.card('Two colours? (colouring, lecture 10.2)',
          K.p('A <b>colouring</b> gives every vertex a colour so that the two ends of every edge differ (lecture 10.2). For two colours, use the BFS levels: even levels blue, odd levels orange. A BFS edge joins equal or neighbouring levels, so only an edge inside one level can clash.'),
          drawGraph(G, L, { v: i => 'k' + col[i], tag: i => [[String(B.lev[i]), 'lv']], e: k => (clash.includes(k) ? 'cyc' : '') }),
          legend([['v', 'k0', 'even level'], ['v', 'k1', 'odd level']].concat(clash.length ? [['e', 'cyc', 'same colour at both ends']] : [])),
          ...tail));
      }
      function directed(G, X, L) {
        const out = t.out, n = G.n, R = runDFS(G, 0, true), tE = treeEdges(G, R.par);
        const kind = G.edges.map((e, k) => {
          if (tE.has(k)) return 'tree';
          const pu = R.pre[e.u], qu = R.post[e.u], pv = R.pre[e.v], qv = R.post[e.v];
          return pu < pv && qv < qu ? 'forward' : pv < pu && qu < qv ? 'back' : 'cross';
        });
        const back = range(G.m).filter(k => kind[k] === 'back');
        const cycOf = k => { const e = G.edges[k], p = []; for (let x = e.u; x >= 0; x = R.par[x]) { p.unshift(x); if (x === e.v) break; } return p.concat([e.v]); };
        const reach = reachAll(G), seen = new Set(), scc = [];
        range(n).forEach(i => { if (seen.has(i)) return; const g = range(n).filter(j => j === i || (reach[i][j] && reach[j][i])); g.forEach(j => seen.add(j)); scc.push(g); });
        const sccOf = range(n).map(i => scc.findIndex(g => g.includes(i)));
        out.append(back.length
          ? K.answer('It has a directed cycle', X.pathT(cycOf(back[0])), 'Found by the back edge ' + X.e(G.edges[back[0]].u, G.edges[back[0]].v) + '. Strongly connected components: ' + scc.map(g => X.set(g)).join(', ') + '.')
          : K.answer('No directed cycle: the graph is a DAG', '\\text{no back edges}', 'Every strongly connected component is a single vertex.'));
        out.append(stepCard(t, 'Step by step: DFS with pre and post numbers', dfsSteps(G, X, R, 'tree'), k => dfsView(G, X, L, R, k, 'tree')));
        const ecls = { tree: 'tree', forward: 'fwd', back: 'cyc', cross: 'crs' };
        out.append(K.card('Tree edges and the three other kinds',
          drawGraph(G, L, { v: () => 'done', tag: i => prePost(R, i), e: k => ecls[kind[k]] }),
          legend([['e', 'tree', 'tree'], ['e', 'fwd', 'forward'], ['e', 'cyc', 'back'], ['e', 'crs', 'cross']]),
          K.p('Each vertex has an interval [pre, post]: DFS was busy with it from pre to post. For a non-tree arrow $(u, v)$ (lecture 10.7):'),
          K.steps([
            { text: '<b>Forward</b> edge: it jumps down the tree, so the interval of $u$ contains that of $v$: $\\text{pre}(u) < \\text{pre}(v)$ and $\\text{post}(v) < \\text{post}(u)$.' },
            { text: '<b>Back</b> edge: it goes up to an ancestor, so the interval of $v$ contains that of $u$.' },
            { text: '<b>Cross</b> edge: it goes to a vertex already finished in another branch, so the intervals do not overlap.' },
          ]),
          tbl(['arrow', 'kind', 'intervals of $u$ and $v$'], G.edges.map((e, k) => {
            const iu = '[' + R.pre[e.u] + ', ' + R.post[e.u] + ']', iv = '[' + R.pre[e.v] + ', ' + R.post[e.v] + ']';
            const rel = kind[k] === 'back' ? iu + ' inside ' + iv : kind[k] === 'cross' ? iu + ', ' + iv + ': apart' : iu + ' contains ' + iv;
            return [X.e(e.u, e.v), { h: kind[k], c: kind[k] === 'back' ? 'bad' : '' }, rel];
          }), { compact: true })));
        out.append(K.card('Cycles',
          K.p('A forward or cross edge never closes a cycle; a back edge always does: it returns to an ancestor, and the tree path leads from that ancestor back down (lecture 10.7).'),
          back.length ? K.steps(back.map(k => ({ text: 'Back edge ' + X.e(G.edges[k].u, G.edges[k].v) + ': the tree path from ' + X.b(G.edges[k].v) + ' down to ' + X.b(G.edges[k].u) + ', then the back edge:', tex: X.pathT(cycOf(k)) }))) : null,
          K.note(back.length ? pl(back.length, 'back edge') + ', so the graph has a directed cycle.' : 'No back edges, so no directed cycle: the graph is a DAG ✓', back.length ? '' : 'good')));
        out.append(K.card('Strongly connected components',
          K.p('Two vertices are <b>strongly connected</b> when each can reach the other along the arrows. The graph splits into groups of strongly connected vertices, its <b>strongly connected components</b> (lecture 10.7). The lab finds them from the reachability of each pair (BFS from every vertex).'),
          drawGraph(G, L, { v: i => 'k' + (sccOf[i] % 8) }),
          legend(scc.map((g, c) => ['v', 'k' + (c % 8), X.set(g)])),
          K.note(scc.length === n ? 'Every vertex is alone in its component: no vertex can leave and come back, as in a DAG.' : pl(scc.length, 'strongly connected component') + '.')));
      }
    },

    /* ---------------------------------------------------------------- topological */
    // ?g=…&at=topo&tie=order&ord=1,0,3,2,5,6,4,7&step=1&all=0   tie = small | large | order: which vertex of in-degree 0 to
    //   list when several are free (the smallest, the largest, or the first in ord); ord = vertices separated by commas
    topological(el, query, ctx) {
      const t = topic(el, query, ctx, { g: TOPO8, at: 'topo', tie: 'order', ord: '1,0,3,2,5,6,4,7', step: 1, all: 0 }, v => { if (!['small', 'large', 'order'].includes(v.tie)) v.tie = 'small'; v.ord = String(v.ord == null ? '' : v.ord).slice(0, 200); });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('A <b>topological sort</b> lists the vertices of a directed graph so that every arrow goes from an earlier vertex to a later one: a schedule in which every task comes after the tasks it depends on. Repeat: list a vertex with no arrows coming in (<b>in-degree</b> 0), then remove it with its arrows.'),
          graphBox(t),
          ...tieControls(t),
          tries([
            ['Lecture 10.10: the lecture’s choices', { g: TOPO8, at: 'topo', tie: 'order', ord: '1,0,3,2,5,6,4,7' }, 'The lecture lists 1, 0, 3, 2, 5, 6, 4, 7.'],
            ['Same graph, smallest first', { g: TOPO8, at: 'topo', tie: 'small', ord: '' }],
            ['Lecture 10.9: setting up the office', { g: OFFICE, at: 'office', tie: 'small', ord: '' }, 'Conduits, then tiling and plastering, painting, wiring and cabling, fittings.'],
            ['Lecture 10.7: maths and stats courses', { g: COURSES, at: 'courses', tie: 'small', ord: '' }],
            ['Lecture 10.7: a graph with a cycle', { g: DIR8, at: 'dir8', tie: 'small', ord: '' }, 'Not a DAG: the sort gets stuck.'],
          ], t.load));
      }, draw);
      function draw(G) {
        const out = t.out;
        if (!G.directed) { out.append(K.note('A topological sort needs arrows. Write the edges as arrows, like 0>1 ("0 must come before 1"). An undirected edge would mean each end must come before the other.', 'warn')); return; }
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, pref = prefOf(G, s.v.ord), R = runTopo(G, s.v.tie, pref);
        if (G.note) out.append(K.note(G.note));
        if (R.ok) {
          const N = countOrders(G);
          out.append(K.answer('A topological order', R.order.map(i => X.t(i)).join(',\\ '), 'Every arrow goes from an earlier vertex to a later one. ' + (N > 1 ? 'It is one of ' + N.toLocaleString('en-IN') + ' possible orders.' : 'It is the only possible order.')));
        } else out.append(K.answer('No topological order: there is a cycle', X.pathT(R.cyc.cyc), 'Each vertex of a cycle would have to come before itself.'));
        const rule = { small: 'take the smallest', large: 'take the largest', order: 'take the one that comes first in your order' }[s.v.tie];
        const steps = R.steps.map(st => {
          if (st.kind === 'start') return { head: 'Find the in-degrees', text: 'The in-degree of a vertex is the number of arrows coming into it: the number of 1s in its column of the adjacency matrix (lecture 10.10). In-degree 0 means it depends on nothing: ' + (st.avail.length ? X.list(st.avail) : 'none') + '.', tex: '\\text{in-degrees: } ' + range(n).map(i => st.indeg[i]).join(' + ') + ' = ' + G.m + ' = m' };
          if (st.kind === 'stuck') {
            const left = range(n).filter(i => !st.done[i]);
            return { head: 'Stuck: no vertex has in-degree 0', text: 'The vertices left, ' + X.list(left) + ', all have arrows coming in. Walk backwards along such arrows, as in the lecture’s proof: ' + X.path(st.cyc.walk.slice().reverse()).replace(/ → /g, ' ← ') + '. A vertex repeats, so the walk went round a cycle. A cycle can never be sorted, so this graph has no topological order.', tex: X.pathT(st.cyc.cyc) };
          }
          const choose = st.A.length > 1 ? 'Vertices with in-degree 0: ' + X.list(st.A) + '; ' + rule + ': ' + X.b(st.v) + '.' : 'Only ' + X.b(st.v) + ' has in-degree 0.';
          const drop = st.dec.length ? ' Remove it and its arrows: the in-degree of ' + X.list(st.dec.map(d => d.w)) + ' drops by 1.' : ' Remove it; no arrows leave it.';
          const freed = st.dec.filter(d => d.to === 0).map(d => d.w);
          return { head: 'List ' + X.n(st.v) + ', remove it', text: choose + ' List it as number ' + st.order.length + '.' + drop + (freed.length ? ' Now ' + X.list(freed) + (freed.length === 1 ? ' has' : ' have') + ' in-degree 0.' : ''), tex: st.dec.map(d => '\\text{indeg}(' + X.t(d.w) + ') = ' + d.from + ' - 1 = ' + d.to) };
        });
        out.append(stepCard(t, 'Step by step: in-degrees, list, remove', steps, k => {
          const st = R.steps[k], v = st.kind === 'list' ? st.v : -1, free = new Set(st.kind === 'stuck' ? [] : st.avail), hotE = new Set(st.kind === 'list' ? st.dec.map(d => d.e) : []);
          const cycE = new Set(); if (st.kind === 'stuck') st.cyc.cyc.slice(0, -1).forEach((x, i) => cycE.add(G.E[x][st.cyc.cyc[i + 1]]));
          const changed = new Set(st.kind === 'list' ? st.dec.map(d => d.w) : []);
          const parts = [
            drawGraph(G, L, {
              v: i => (i === v ? 'cur' : st.done[i] ? 'off' : free.has(i) ? 'new' : ''),
              tag: i => (st.done[i] && i !== v ? null : [[String(st.indeg[i]), 'in']]),
              e: k2 => (hotE.has(k2) ? 'hot' : cycE.has(k2) ? 'cyc' : st.done[G.edges[k2].u] ? 'dim' : ''),
            }),
            legend([['v', 'cur', 'listed now'], ['v', 'new', 'in-degree 0: free to list'], ['v', 'off', 'listed and removed'], ['e', 'hot', 'arrows removed now']]),
            K.p('<small>Red numbers: the in-degree that is left.</small>'),
            boxes('Listed', st.order.map(i => ({ v: X.n(i), c: i === v ? 'in' : '' })), { empty: 'nothing yet' }),
          ];
          if (st.kind === 'start') parts.push(sub('In-degree = the 1s in each column'), tbl([''].concat(G.labels), range(n).map(i => [G.labels[i]].concat(range(n).map(j => (G.W[i][j] != null ? '1' : { h: '0', c: 'z' })))).concat([[{ h: 'in-degree', c: 'new' }].concat(range(n).map(j => ({ h: String(st.indeg[j]), c: 'new' })))]), { compact: true }));
          else parts.push(tbl(['vertex', 'in-degree', 'listed as'], range(n).map(i => [G.labels[i], { h: st.done[i] && i !== v ? '—' : String(st.indeg[i]), c: changed.has(i) ? 'new' : '' }, st.done[i] ? 'number ' + (st.order.indexOf(i) + 1) : '']), { compact: true, rowCls: i => (i === v ? 'cur' : st.done[i] ? 'off' : '') }));
          return parts;
        }));
        if (!R.ok) return;
        const pos = new Map(R.order.map((v, i) => [v, i])), fwd = G.edges.filter(e => pos.get(e.u) < pos.get(e.v));
        out.append(K.card('Check the order',
          K.p('Every arrow must go from an earlier vertex to a later one. Number the vertices by their place in the order:'),
          tbl(['place'].concat(R.order.map((_, i) => String(i + 1))), [['vertex'].concat(R.order.map(i => G.labels[i]))], { compact: true }),
          K.steps(G.edges.map(e => ({ text: 'Arrow ' + X.n(e.u) + ' → ' + X.n(e.v) + ': place ' + (pos.get(e.u) + 1) + ' before place ' + (pos.get(e.v) + 1) + (pos.get(e.u) < pos.get(e.v) ? OK : NO) }))),
          K.note(fwd.length === G.m ? 'All ' + G.m + ' arrows point forward ✓' : 'Some arrows point backward ✗', fwd.length === G.m ? 'good' : 'warn'),
          K.p('Other choices at the ties give other orders, all correct (lecture 10.10): for $n$ tasks with no dependencies at all, every one of the $n!$ orders works.')));
      }
    },

    /* ---------------------------------------------------------------- longest-path */
    // ?g=…&at=topo&tie=order&ord=1,0,3,2,5,6,4,7&step=1&all=0   tie and ord as in topological (any order of a DAG gives the
    //   same longest paths); edges with weights add their weights, edges without count 1
    'longest-path'(el, query, ctx) {
      const t = topic(el, query, ctx, { g: TOPO8, at: 'topo', tie: 'order', ord: '1,0,3,2,5,6,4,7', step: 1, all: 0 }, v => { if (!['small', 'large', 'order'].includes(v.tie)) v.tie = 'small'; v.ord = String(v.ord == null ? '' : v.ord).slice(0, 200); });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('If tasks with no dependency between them can be done at the same time (say, courses in one semester), how many rounds are needed? The <b>longest path</b> to each vertex answers it. Work it out while sorting topologically: a vertex’s longest path is 1 more than the largest among the vertices that point to it.'),
          graphBox(t),
          ...tieControls(t),
          tries([
            ['Lecture 11.1: courses and semesters', { g: TOPO8, at: 'topo', tie: 'order', ord: '1,0,3,2,5,6,4,7' }, 'Longest path to 7: 4, so 5 semesters.'],
            ['Lecture 10.9: setting up the office', { g: OFFICE, at: 'office', tie: 'small', ord: '' }, 'Five tasks in a row: conduits, plastering, painting, wiring, fittings.'],
            ['Lecture 10.7: maths and stats courses', { g: COURSES, at: 'courses', tie: 'small', ord: '' }],
            ['Tasks with durations (the lab’s own)', { g: 'A>B:3,A>C:2,B>D:4,C>D:1,D>E:2', at: '', tie: 'small', ord: '' }, 'With weights, a path’s length is the sum of its weights.'],
          ], t.load));
      }, draw);
      function draw(G) {
        const out = t.out;
        if (!G.directed) { out.append(K.note('Longest paths are worked out in a DAG, a directed graph with no cycle. Write the edges as arrows, like 0>1.', 'warn')); return; }
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, pref = prefOf(G, s.v.ord), R = runTopo(G, s.v.tie, pref), wt = G.weighted;
        if (G.note) out.append(K.note(G.note));
        if (!R.ok) {
          out.append(K.answer('Not a DAG: there is a cycle', X.pathT(R.cyc.cyc), 'Going round a cycle never ends, so this easy method needs a DAG. For graphs with cycles, the longest path that repeats no vertex is a hard problem: no fast method is known (lecture 11.1).'));
          out.append(K.note('The topological sort gets stuck. See the Topological sort topic for the steps.', 'warn'));
          return;
        }
        const best = Math.max(...R.L), end = range(n).find(i => R.L[i] === best), path = pathTo(R.via, end);
        out.append(K.answer('The longest path: ' + (wt ? 'length ' + best : pl(best, 'edge')), X.pathT(path) + (wt ? ' \\quad (' + path.slice(1).map((v, i) => pT(G.W[path[i]][v])).join(' + ') + ' = ' + best + ')' : ''),
          wt ? 'The earliest time each task can start is its longest-path value; everything can finish once the last task, ' + X.n(end) + ', starts.' : 'So, doing free tasks together, ' + (best + 1) + ' rounds are needed (in lecture 11.1, semesters).'));
        const lpT = i => '\\text{lp}(' + X.t(i) + ')';
        const steps = R.steps.map(st => {
          if (st.kind === 'start') return { head: 'In-degrees, and longest-path-to = 0 everywhere', text: 'Find the in-degrees as for a topological sort. Write lp(i) for the longest path to i (the lecture’s longest-path-to), and start with 0 for every vertex: a vertex with in-degree 0 can be done at once.', tex: '\\text{lp}(i) = 0 \\text{ for every } i' };
          const rule = st.A.length > 1 ? 'Vertices with in-degree 0: ' + X.list(st.A) + '; list ' + X.b(st.v) + '.' : 'Only ' + X.b(st.v) + ' has in-degree 0: list it.';
          const upd = st.dec.length ? ' Its lp is now final: ' + st.L[st.v] + '. For each arrow ' + X.b(st.v) + ' → w, the in-degree of w drops by 1, and lp(w) becomes the larger of its old value and lp(' + X.b(st.v) + ') + ' + (wt ? 'the weight' : '1') + '.' : ' Its lp is final: ' + st.L[st.v] + '. No arrows leave it.';
          return { head: 'List ' + X.n(st.v) + ' (lp ' + st.L[st.v] + ')', text: rule + upd,
            tex: [].concat(...st.dec.map(d => ['\\text{indeg}(' + X.t(d.w) + ') = ' + d.from + ' - 1 = ' + d.to, lpT(d.w) + ' = \\max(' + d.old + ', ' + st.L[st.v] + ' + ' + pT(wt ? d.wt : 1) + ') = ' + d.now])) };
        });
        out.append(stepCard(t, 'Step by step: in-degree (red) and longest path (blue)', steps, k => {
          const st = R.steps[k], v = st.kind === 'list' ? st.v : -1, free = new Set(st.avail || []), hotE = new Set(st.kind === 'list' ? st.dec.map(d => d.e) : []);
          const changed = new Set(st.kind === 'list' ? st.dec.map(d => d.w) : []), grew = new Set(st.kind === 'list' ? st.dec.filter(d => d.now > d.old).map(d => d.w) : []);
          return [
            drawGraph(G, L, {
              v: i => (i === v ? 'cur' : st.done[i] ? 'off' : free.has(i) ? 'new' : ''),
              tag: i => (st.done[i] && i !== v ? [[String(st.L[i]), 'lp']] : [[String(st.indeg[i]), 'in'], [' ', ''], [String(st.L[i]), 'lp']]),
              e: k2 => (hotE.has(k2) ? 'hot' : st.done[G.edges[k2].u] ? 'dim' : ''),
            }),
            legend([['v', 'cur', 'listed now'], ['v', 'new', 'in-degree 0'], ['v', 'off', 'listed'], ['e', 'hot', 'arrows used now']]),
            K.p('<small>Above each vertex: <b style="color:var(--bad)">in-degree</b> and <b style="color:var(--x)">longest path</b>, as on the lecture’s slide.</small>'),
            tbl(['topological order'].concat(st.order.map(i => ({ h: G.labels[i], c: i === v ? 'new' : '' }))), [['longest path to'].concat(st.order.map(i => ({ h: String(st.L[i]), c: i === v ? 'new' : '' })))], { compact: true }),
            tbl(['vertex', 'in-degree', 'longest path to'], range(n).map(i => [G.labels[i], { h: st.done[i] && i !== v ? '—' : String(st.indeg[i]), c: changed.has(i) ? 'new' : '' }, { h: String(st.L[i]), c: grew.has(i) ? 'new' : st.done[i] ? 'done' : '' }]), { compact: true, rowCls: i => (i === v ? 'cur' : '') }),
          ];
        }));
        const onPath = new Set(path.slice(1).map((v, i) => G.E[path[i]][v]));
        const rounds = range(best + 1).map(r => range(n).filter(i => R.L[i] === r)).filter(g => g.length);
        out.append(K.card('The longest path and the schedule',
          drawGraph(G, L, { v: i => (path.includes(i) ? 'done' : ''), tag: i => [[String(R.L[i]), 'lp']], e: k => (onPath.has(k) ? 'tree' : '') }),
          K.p('Follow back, from ' + X.b(end) + ', the vertex that gave each its largest value: ' + X.path(path) + '.' + (rounds.length && !wt ? '' : '')),
          wt ? tbl(['task', 'earliest start (lp)'], range(n).map(i => [G.labels[i], String(R.L[i])]), { compact: true })
            : tbl(['round', 'longest path', 'can be done then'], range(best + 1).map(r => [String(r + 1), String(r), { h: X.set(range(n).filter(i => R.L[i] === r)), c: 'left' }]), { compact: true }),
          wt ? null : K.p('A vertex with longest path $k$ needs $k$ earlier rounds, so it goes in round $k + 1$; everything is done after ' + (best + 1) + ' rounds, and no schedule is shorter because the ' + (best + 1) + ' vertices of the longest path must come one after another.')));
        // check: the formula, worked out recursively over the incoming arrows
        const memo = Array(n).fill(null), f = i => (memo[i] != null ? memo[i] : (memo[i] = G.inn[i].length ? Math.max(0, ...G.inn[i].map(a => f(a.u) + (wt ? a.w : 1))) : 0));
        const agree = range(n).every(i => f(i) === R.L[i]);
        out.append(K.card('Check: the formula directly',
          K.p('Lecture 11.1: lp(i) = 0 if nothing points to $i$; otherwise lp(i) = 1 + the largest lp(j) over the arrows $(j, i)$' + (wt ? ' (here: the largest lp(j) + weight)' : '') + '. Worked out vertex by vertex, asking for each incoming vertex first:'),
          tbl(['vertex', 'arrows in from', 'formula', 'during the sort'], range(n).map(i => [G.labels[i], { h: G.inn[i].length ? X.set(G.inn[i].map(a => a.u)) : '—', c: 'left' }, String(f(i)), String(R.L[i])]), { compact: true }),
          K.note(agree ? 'The same for every vertex ✓' : 'They differ ✗', agree ? 'good' : 'warn')));
      }
    },
    /* ---------------------------------------------------------------- transitive-closure */
    // ?g=…&at=&i=0&j=0&step=1&all=0   i, j = the entry worked out at every step (vertices of g; tapping a matrix cell picks
    //   it too); step = 1 to n (the powers A¹ … Aⁿ)
    'transitive-closure'(el, query, ctx) {
      const t = topic(el, query, ctx, { g: TC6, at: '', i: '0', j: '0', step: 1, all: 0 }, (v, G) => { if (G) { v.i = vOr(G, v.i, G.labels[0]); v.j = vOr(G, v.j, G.labels[0]); } });
      const { s } = t;
      const pick = (G, i, j) => { s.set({ i: G.labels[i], j: G.labels[j] }, true); if (t.dyn) { t.dyn.innerHTML = ''; t.dynFill(); } t.draw(); };
      t.start(() => {
        t.controls.append(
          K.p('A relation joins $i$ to $j$ when there is an arrow $i \\to j$ (say, parent to child). Its <b>transitive closure</b> $R^+$ joins $i$ to $j$ when a chain of one or more arrows leads from $i$ to $j$ (ancestor to descendant): when $j$ is <b>reachable</b> from $i$. The adjacency matrix $A$ shows the paths of length 1; Boolean products give $A^2, A^3, \\dots$, the paths of length 2, 3, …; and $A^+ = A + A^2 + \\dots$ collects them. Here $+$ means OR and $\\times$ means AND, so $1 + 1 = 1$.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn', style: 'display:grid;gap:14px' }),
          tries([
            ['Lecture 11.3: the 6 × 6 matrix', { g: TC6, at: '', i: '0', j: '0' }, 'Why is A²[0, 0] = 1? Because A[0, 4] = 1 and A[4, 0] = 1.'],
            ['Lecture 11.2: airline routes', { g: AIR_D, at: 'air', i: '0', j: '7' }, 'Row 0 of A² has 1s at 0, 2, 3 and 7.'],
            ['Lecture 10.10: a DAG (the powers die out)', { g: TOPO8, at: 'topo', i: '0', j: '7' }],
            ['A cycle through all 4 vertices (the lab’s own)', { g: '0>1,1>2,2>3,3>0', at: '', i: '0', j: '0' }, 'Back to the start takes n = 4 arrows, so only A⁴ puts 1s on the diagonal.'],
          ], t.load));
        t.dynFill = () => {
          if (t.G.err) return;
          t.dyn.append(vselect('Work out the entry in row $i$ =', t.G, s.v.i, x => { s.set({ i: x }, true); t.draw(); }),
            vselect('and column $j$ =', t.G, s.v.j, x => { s.set({ j: x }, true); t.draw(); }));
        };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, out = t.out, I = G.idx.get(s.v.i), J = G.idx.get(s.v.j);
        const A = range(n).map(i => range(n).map(j => (G.W[i][j] != null ? 1 : 0))), P = [null, A];
        for (let l = 2; l <= n; l++) P.push(range(n).map(i => range(n).map(j => (range(n).some(k => P[l - 1][i][k] && A[k][j]) ? 1 : 0))));
        const plus = [range(n).map(() => Array(n).fill(0))];
        for (let l = 1; l <= n; l++) plus.push(plus[l - 1].map((r, i) => r.map((x, j) => x | P[l][i][j])));
        const Ap = plus[n], ones = M => M.reduce((a, r) => a + r.reduce((x, y) => x + y, 0), 0);
        const first = (i, j) => { for (let l = 1; l <= n; l++) if (P[l][i][j]) return l; return 0; };
        const pw = l => (l === 1 ? 'A' : 'A^{' + l + '}');
        if (G.note) out.append(K.note(G.note));
        if (G.weighted) out.append(K.note('Weights play no part here: only whether there is an edge.'));
        if (isAirD(G)) out.append(K.note('The $A^2$ table on the 11.2 slide has slips. Worked out from the slide’s own $A$, row 2 is {1, 4} (the lecturer corrects this aloud), and rows 3, 4, 7, 8 and 9 are {0, 3, 5, 7}, {1, 4, 6, 8}, {0, 3, 5, 7, 9}, {3, 7, 8} and {5, 9}. The lab works every entry out.'));
        out.append(K.answer('Can ' + X.n(J) + ' be reached from ' + X.n(I) + '?', 'A^+[' + X.t(I) + ', ' + X.t(J) + '] = ' + Ap[I][J],
          (Ap[I][J] ? 'Yes: the shortest way has ' + pl(first(I, J), 'arrow') + '. ' : 'No: no power of $A$ has a 1 there. ') + 'In all, $A^+$ has ' + ones(Ap) + ' ones out of $' + n * n + '$: the pairs of $R^+$.'));
        const walk = (l, i, j) => { if (!P[l][i][j]) return null; const p = [j]; let cur = j; for (let m = l; m >= 2; m--) { const k = range(n).find(q => P[m - 1][i][q] && A[q][cur]); p.unshift(k); cur = k; } p.unshift(i); return p; };
        const pairList = list => list.slice(0, 12).map(([i, j]) => X.e(i, j)).join(', ') + (list.length > 12 ? ' and ' + (list.length - 12) + ' more' : '');
        const steps = range(n).map(k => {
          const l = k + 1, newP = [];
          range(n).forEach(i => range(n).forEach(j => { if (plus[l][i][j] && !plus[l - 1][i][j]) newP.push([i, j]); }));
          if (l === 1) return { head: 'A¹ = A: paths of length 1', text: '$A[i, j] = 1$ exactly when there is an arrow from $i$ to $j$: a path of length 1. So far $A^+ = A$, with ' + ones(A) + ' ones.', tex: 'A[' + X.t(I) + ', ' + X.t(J) + '] = ' + A[I][J] };
          const via = range(n).filter(q => P[l - 1][I][q] && A[q][J]);
          let text = 'A path of length ' + l + ' from $i$ to $j$ is a path of length ' + (l - 1) + ' from $i$ to some $k$, then one more arrow from $k$ to $j$. So $' + pw(l) + '[i, j] = 1$ when $' + pw(l - 1) + '[i, k] = 1$ and $A[k, j] = 1$ for some $k$: an OR of ANDs, which is the product $' + pw(l - 1) + ' \\times A$. ';
          text += 'For row ' + X.b(I) + ', column ' + X.b(J) + ': ' + (via.length ? '$k = ' + via.map(q => X.t(q)).join(', ') + '$ give' + (via.length === 1 ? 's' : '') + ' $1 \\times 1$.' : 'no $k$ gives $1 \\times 1$.') + ' ';
          text += newP.length ? 'New in $A^+$: ' + pairList(newP) + '.' : 'Nothing new for $A^+$.';
          if (l === n && n > 1) text += ' The lecture stops at $A^{n-1}$: a path that repeats no vertex has at most $n - 1$ arrows. A way back to the start (a cycle) can need $n$ arrows, so the lab takes $A^n$ too; it can only add 1s on the diagonal' + (newP.length ? '.' : ', and here it adds none.');
          return { head: 'A' + supU(l) + ' = A' + (l - 1 === 1 ? '' : supU(l - 1)) + ' × A: paths of length ' + l, text,
            tex: pw(l) + '[' + X.t(I) + ', ' + X.t(J) + '] = \\sum_{k} ' + pw(l - 1) + '[' + X.t(I) + ', k] \\times A[k, ' + X.t(J) + '] = ' + range(n).map(q => '{' + P[l - 1][I][q] + ' \\times ' + A[q][J] + '}').join(' + ') + ' = ' + P[l][I][J] };
        });
        out.append(stepCard(t, 'Step by step: the powers of $A$', steps, k => {
          const l = k + 1, path = walk(l, I, J), pe = new Set();
          if (path) path.slice(1).forEach((v, i) => pe.add(G.E[path[i]][v]));
          const isNew = range(n).map(i => range(n).map(j => plus[l][i][j] && !plus[l - 1][i][j]));
          const cell = (M, i, j, fresh) => ({ h: String(M[i][j]), c: [M[i][j] ? '' : 'z', fresh && fresh[i][j] ? 'new' : '', i === I && j === J ? 'pick' : ''].filter(Boolean).join(' '), k: [i, j] });
          const click = ([i, j]) => pick(G, i, j);
          return [
            drawGraph(G, L, { v: i => (i === I ? 'cur' : i === J ? 'new' : ''), e: k2 => (pe.has(k2) ? 'hot' : '') }),
            K.p(path ? 'A path of length ' + l + ' from ' + X.b(I) + ' to ' + X.b(J) + ' (purple): ' + X.path(path) + (new Set(path).size < path.length ? ' (it repeats a vertex: the powers count every walk)' : '') + '.' : 'No path of length ' + l + ' from ' + X.b(I) + ' to ' + X.b(J) + '.'),
            sub('$' + pw(l) + '$: paths of length ' + l + ' (tap a cell to work it out)'),
            matTable(G, (i, j) => cell(P[l], i, j, null), { click }),
            sub('$A^+$ so far $= ' + (l <= 4 ? range(l).map(x => pw(x + 1)).join(' + ') : 'A + A^2 + \\cdots + A^{' + l + '}') + '$ (new 1s shaded)'),
            matTable(G, (i, j) => cell(plus[l], i, j, isNew), { click }),
          ];
        }));
        const R = reachAll(G), agree = range(n).every(i => range(n).every(j => !!R[i][j] === !!Ap[i][j]));
        const lect = plus[Math.max(1, n - 1)], extra = range(n).filter(i => Ap[i][i] && !lect[i][i]);
        out.append(K.card('Check against BFS from every vertex',
          K.p('BFS from each vertex $i$, following the arrows, finds every vertex reachable from $i$ in one or more steps (lecture 11.2 suggests this way too). That set should be the 1s in row $i$ of $A^+$.'),
          tbl(['$i$', 'reachable from $i$ (BFS)', 'row $i$ of $A^+$', ''], range(n).map(i => {
            const r = range(n).filter(j => R[i][j]), a = range(n).filter(j => Ap[i][j]), ok = r.length === a.length && r.every(j => Ap[i][j]);
            return [G.labels[i], { h: X.set(r), c: 'left' }, { h: X.set(a), c: 'left' }, ok ? { h: '✓', c: 'good' } : { h: '✗', c: 'bad' }];
          }), { compact: true }),
          K.note(agree ? 'Every row agrees ✓' : 'Some rows differ ✗', agree ? 'good' : 'warn'),
          extra.length ? K.p('The lecture’s sum $A + \\dots + A^{n-1}$ would miss the diagonal 1s of ' + X.list(extra) + ': ' + (extra.length === 1 ? 'it lies' : 'they lie') + ' on a cycle through all $n$ vertices, which needs $n$ arrows.') : null));
      }
    },

    /* ---------------------------------------------------------------- dijkstra */
    // ?g=…&at=dij&src=0&to=5&step=1&all=0   src = the source, to = the vertex whose shortest path is traced back (vertices
    //   of g); step = 1 to (number of vertices burnt) + 1
    dijkstra(el, query, ctx) {
      const t = topic(el, query, ctx, { g: DIJ7, at: 'dij', src: '0', to: '5', step: 1, all: 0 }, (v, G) => { if (G) { v.src = vOr(G, v.src, G.labels[0]); v.to = vOr(G, v.to, G.labels[G.n - 1]); } });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('<b>Dijkstra’s algorithm</b> finds the shortest distance from one vertex to every other when no edge is negative. Lecture 11.5’s picture: the vertices are oil tanks and the edges pipelines of those lengths. Set fire to the source; the fire spreads at a steady speed and reaches each tank at its shortest distance. Keep an <b>expected burn time</b> (EBT) for each vertex; again and again, burn the unburnt vertex with the smallest EBT, then update its neighbours.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn', style: 'display:grid;gap:14px' }),
          tries([
            ['Lecture 11.5: from 0', { g: DIJ7, at: 'dij', src: '0', to: '5' }, 'Burn times 0, 10, 16, 30, 35, 45, 86; the way to 5 is 0, 1, 4, 6, 5, not 0, 1, 4, 5.'],
            ['A negative edge: Dijkstra goes wrong (the lab’s own)', { g: TRAP, at: 'trap', src: '0', to: '3' }, '1 burns at 2, but 0 → 2 → 1 costs 5 − 4 = 1.'],
            ['Lecture 11.6’s graph: negative edges, no harm here', { g: BF8, at: 'bf8', src: '0', to: '4' }],
            ['No weights: the airline graph', { g: AIR_U, at: 'air', src: '7', to: '2' }, 'Every edge counts 1: the burn times are the BFS levels.'],
          ], t.load));
        t.dynFill = () => {
          if (t.G.err) return;
          t.dyn.append(vselect('Source (set on fire)', t.G, s.v.src, x => { s.set({ src: x, step: 1 }, true); t.draw(); }),
            vselect('Trace the path to', t.G, s.v.to, x => { s.set({ to: x }, true); t.draw(); }));
        };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, out = t.out, S = G.idx.get(s.v.src), T = G.idx.get(s.v.to), R = runDijkstra(G, S);
        const negE = G.edges.filter(e => e.w < 0);
        if (G.note) out.append(K.note(G.note));
        if (!G.weighted) out.append(K.note('No weights: every edge counts 1, so the burn times are the BFS levels.'));
        const pathT = pathTo(R.par, T);
        out.append(R.T[T] === Infinity
          ? K.answer(X.n(T) + ' never burns', '\\text{EBT}(' + X.t(T) + ') = \\infty', 'No path leads from ' + X.n(S) + ' to ' + X.n(T) + '.')
          : K.answer('Shortest distance from ' + X.n(S) + ' to ' + X.n(T) + (negE.length ? ', by Dijkstra' : ''), 'd(' + X.t(S) + ', ' + X.t(T) + ') = ' + R.T[T] + ' \\quad \\text{along } ' + X.pathT(pathT), 'Every vertex: ' + range(n).map(i => X.n(i) + ': ' + dH(R.T[i])).join(', ') + '.'));
        if (negE.length) out.append(K.note('This graph has ' + pl(negE.length, 'negative edge') + '. Dijkstra assumes there are none, so its answer may be wrong: see the check at the end.', 'warn'));
        const steps = R.steps.map((st, idx) => {
          if (st.kind === 'start') return { head: 'Start: EBT(' + X.n(S) + ') = 0, every other EBT = ∞', text: 'No vertex is burnt yet: B(i) = False for every vertex, so the set of unburnt vertices UB is all of them. The fire starts at ' + X.b(S) + ' at time 0. For the others nothing is known yet, so their EBT is ∞.', tex: '\\text{EBT}(' + X.t(S) + ') = 0' };
          if (st.kind === 'stuck') return { head: 'The rest never burn', text: 'The unburnt vertices ' + X.list(st.UB) + ' all have EBT = ∞: no edge leads to them from a burnt vertex, so the fire never reaches them. They cannot be reached from ' + X.b(S) + '.' };
          const before = R.steps[idx - 1].T, known = st.UB.filter(i => before[i] < Infinity), tie = known.filter(i => before[i] === before[st.j]).length > 1;
          let text = 'Unburnt vertices and their EBT: ' + known.map(i => X.b(i) + ' ' + dH(before[i])).join(', ') + (known.length < st.UB.length ? ' (the rest ∞)' : '') + '. The smallest is ' + dH(before[st.j]) + ', at ' + X.b(st.j) + (tie ? ' (the first of the equal ones)' : '') + ': it burns now, and its time is final. ';
          const live = st.upd.filter(u => !u.burnt), missed = st.upd.filter(u => u.burnt && u.cand < u.old);
          text += live.length ? 'Fire now runs from ' + X.b(st.j) + ' along its edges to the unburnt ' + X.list(live.map(u => u.k)) + ': each EBT becomes the smaller of its old value and EBT(' + X.b(st.j) + ') + the edge’s weight.' : 'No edge from ' + X.b(st.j) + ' leads to an unburnt vertex.';
          if (missed.length) text += ' The edge ' + X.e(st.j, missed[0].k) + ' would give ' + X.b(missed[0].k) + ' the time ' + dH(missed[0].cand) + ', less than its ' + dH(missed[0].old) + ', but ' + X.b(missed[0].k) + ' is burnt already and Dijkstra never looks at it again: this is how a negative edge fools it (lecture 11.6).';
          return { head: 'Burn ' + X.n(st.j) + ' at time ' + dH(before[st.j]), text, tex: live.map(u => '\\text{EBT}(' + X.t(u.k) + ') = \\min(' + dT(u.old) + ', ' + before[st.j] + ' + ' + pT(u.w) + ') = ' + dT(u.now)) };
        });
        out.append(stepCard(t, 'Step by step: burn, then update the neighbours', steps, k => {
          const st = R.steps[k], j = st.kind === 'burn' ? st.j : -1, upd = st.kind === 'burn' ? st.upd : [];
          const improved = new Set(upd.filter(u => !u.burnt && u.now < u.old).map(u => u.k)), ecl = new Map();
          st.par.forEach((p, v) => { if (p >= 0) ecl.set(G.E[p][v], st.B[v] ? 'tree' : 'tent'); });
          upd.forEach(u => ecl.set(u.e, u.burnt ? (u.cand < u.old ? 'skip' : 'look') : u.now < u.old ? 'hot' : 'look'));
          const rows = R.steps.slice(0, k + 1).map((x, r) => {
            const bj = x.kind === 'burn' ? x.j : -1, imp = new Set(x.kind === 'burn' ? x.upd.filter(u => !u.burnt && u.now < u.old).map(u => u.k) : []);
            return [bj >= 0 ? G.labels[bj] : 'start'].concat(range(n).map(i => dCell(x.T[i], i === bj ? 'pick' : x.B[i] ? 'done' : imp.has(i) ? 'new' : '')));
          });
          return [
            drawGraph(G, L, { v: i => (i === S ? 'src ' : '') + (i === j ? 'cur' : st.B[i] ? 'done' : improved.has(i) ? 'new' : ''), tag: i => [[dH(st.T[i]), st.B[i] ? 'lv' : improved.has(i) ? 'chg' : 'dull']], e: k2 => ecl.get(k2) || '' }),
            legend([['v', 'cur', 'burns now'], ['v', 'done', 'burnt'], ['v', 'new', 'EBT lowered now'], ['e', 'hot', 'lowers an EBT'], ['e', 'look', 'no help'], ['e', 'tree', 'shortest-path tree'], ['e', 'tent', 'best so far']].concat(upd.some(u => u.burnt && u.cand < u.old) ? [['e', 'skip', 'ignored: ends at a burnt vertex']] : [])),
            K.p('<small>Numbers above the vertices: their EBT.</small>'),
            sub('EBT after each step, one row per vertex burnt (shaded: burnt before; outlined: burns in that row)'),
            tbl(['burn'].concat(G.labels), rows, { compact: true, rowCls: i => (i === k ? 'cur' : '') }),
          ];
        }));
        const tE = treeEdges(G, R.par);
        out.append(K.card('The shortest-path tree',
          drawGraph(G, L, { v: i => (i === S ? 'src done' : R.T[i] < Infinity ? 'done' : 'off'), tag: i => [[dH(R.T[i]), 'lv']], e: k => (tE.has(k) ? 'tree' : 'dim') }),
          K.p('Each vertex keeps the edge that gave it its final time. These edges form a tree: every shortest path extends a shorter shortest path (lecture 11.5).'),
          tbl(['vertex', 'distance', 'path'], range(n).map(i => [G.labels[i], dCell(R.T[i]), { h: R.T[i] < Infinity ? X.path(pathTo(R.par, i)) : '—', c: 'left' }]), { compact: true })));
        const B = runBF(G, S), same = range(n).every(i => B.D[i] === R.T[i]);
        let verdict;
        if (B.neg) verdict = K.note('Bellman–Ford finds a negative cycle reachable from ' + X.b(S) + ', so shortest distances are not even defined (lecture 11.4).', 'warn');
        else if (same) verdict = K.note(negE.length ? 'The same ✓, by luck: with negative edges Dijkstra is not guaranteed to be right.' : 'The same for every vertex ✓ With no negative edge, a burnt vertex can never get a shorter time later (lecture 11.5’s argument).', 'good');
        else verdict = K.note('Dijkstra is wrong for ' + X.list(range(n).filter(i => B.D[i] !== R.T[i])) + ': ' + 'it burnt them before a negative edge could lower their time (lecture 11.6). Bellman–Ford keeps updating every vertex, so it is right.', 'warn');
        out.append(K.card('Check with Bellman–Ford',
          K.p('Bellman–Ford (lecture 11.6) does not freeze any vertex, so it also works with negative edges.'),
          B.neg ? null : tbl(['vertex', 'Dijkstra', 'Bellman–Ford', ''], range(n).map(i => [G.labels[i], dCell(R.T[i]), dCell(B.D[i]), B.D[i] === R.T[i] ? { h: '✓', c: 'good' } : { h: '✗', c: 'bad' }]), { compact: true }),
          verdict));
      }
    },

    /* ---------------------------------------------------------------- bellman-ford */
    // ?g=…&at=bf8&src=0&step=1&all=0   src = the source (a vertex of g); step = 1 (the start) to n + 1 (round n, the check)
    'bellman-ford'(el, query, ctx) {
      const t = topic(el, query, ctx, { g: BF8, at: 'bf8', src: '0', step: 1, all: 0 }, (v, G) => { if (G) v.src = vOr(G, v.src, G.labels[0]); });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('<b>Bellman–Ford</b> finds the shortest distances from one vertex even when some edges are negative (but no cycle is). Start with $D(\\text{source}) = 0$ and every other $D = \\infty$. Then, $n - 1$ times, take every edge $(j, k)$ and let $D(k)$ become the smaller of $D(k)$ and $D(j) + W(j, k)$. One more round is the check: if anything still drops, there is a negative cycle.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn' }),
          tries([
            ['Lecture 11.6: negative edges, from 0', { g: BF8, at: 'bf8', src: '0' }, 'After 7 rounds: 0, 5, 5, 6, 9, 7, 9, 8.'],
            ['Lecture 11.4: a negative cycle (−3, +2, −1, +1)', { g: NEGC, at: 'negc', src: '0' }, 'The cycle 1 → 2 → 3 → 4 → 1 weighs −1; the way in from 0 and out to 5 is the lab’s.'],
            ['Lecture 11.5’s graph (no negative edges)', { g: DIJ7, at: 'dij', src: '0' }],
            ['Dijkstra’s trap (the lab’s own)', { g: TRAP, at: 'trap', src: '0' }, 'Bellman–Ford gets d(1) = 1 and d(3) = 2.'],
          ], t.load));
        t.dynFill = () => { if (!t.G.err) t.dyn.append(vselect('Source', t.G, s.v.src, x => { s.set({ src: x, step: 1 }, true); t.draw(); })); };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, out = t.out, S = G.idx.get(s.v.src), R = runBF(G, S);
        if (G.note) out.append(K.note(G.note));
        if (!G.directed && G.edges.some(e => e.w < 0)) out.append(K.note('An undirected edge with a negative weight is a negative cycle by itself: go along it and come back.', 'warn'));
        const cw = R.cycle ? R.cycle.slice(1).map((v, i) => G.W[R.cycle[i]][v]) : [];
        if (R.neg) out.append(K.answer('A negative cycle can be reached from ' + X.n(S), X.pathT(R.cycle) + ' \\quad (' + cw.map(pT).join(' + ') + ' = ' + cw.reduce((a, b) => a + b, 0) + ')', 'Going round it again and again makes paths as short as you like, so shortest distances are not defined (lecture 11.4).'));
        else out.append(K.answer('Shortest distances from ' + X.n(S), range(n).map(i => 'd(' + X.t(i) + ') = ' + dT(R.D[i])).join(',\\ '), (R.settled && R.settled > 1 ? 'Nothing changes after round ' + (R.settled - 1) + '. ' : '') + 'The check round $n = ' + n + '$ changes nothing: no negative cycle.'));
        const steps = [{ head: 'Start: D(' + X.n(S) + ') = 0, every other D = ∞', text: 'D(v) is the shortest distance from ' + X.b(S) + ' to v known so far. At the start only the source is known (column 0 of the table).', tex: 'D(' + X.t(S) + ') = 0' }];
        R.rounds.forEach(rd => {
          const check = rd.r === n, ch = rd.changed;
          const lines = ch.map(k => 'D(' + X.t(k) + ') = \\min(' + [dT(rd.prev[k])].concat(G.inn[k].filter(a => rd.prev[a.u] < Infinity).map(a => rd.prev[a.u] + ' + ' + pT(a.w))).join(', ') + ') = ' + rd.next[k]);
          let text = check
            ? 'After $n - 1 = ' + (n - 1) + '$ rounds every shortest distance is found, if no negative cycle can be reached: round $r$ finds every shortest path with at most $r$ edges, and a shortest path never needs more than $n - 1$ edges. One more round checks: '
            : 'Take every edge $(j, k)$ and compare $D(k)$ with $D(j) + W(j, k)$, using the distances of round ' + (rd.r - 1) + ' (the previous column, as in the lecture’s table). ';
          if (check) text += ch.length ? 'D still drops for ' + X.list(ch) + ', so a negative cycle can be reached from ' + X.b(S) + ': ' + X.path(R.cycle) + '.' : 'nothing changes, so no negative cycle can be reached from ' + X.b(S) + ' ✓';
          else text += ch.length ? 'D drops for ' + X.list(ch) + ' (shaded in the table).' : 'Nothing changes: the distances are final already.';
          steps.push({ head: check ? 'Round ' + n + ': the check' : 'Round ' + rd.r + (ch.length ? ': D drops for ' + X.set(ch) : ': no change'), text, tex: lines });
        });
        out.append(stepCard(t, 'Step by step: one column of D per round', steps, k => {
          const col = R.cols[k], rd = k >= 1 ? R.rounds[k - 1] : null, ch = new Set(rd ? rd.changed : []), par = R.pars[k], ecl = new Map();
          par.forEach((p, v) => { if (p >= 0 && col[v] < Infinity) ecl.set(G.E[p][v], 'tree'); });
          if (rd) rd.changed.forEach(v => ecl.set(rd.via[v].e, 'hot'));
          const head = ['$v$'].concat(range(k + 1).map(c => ({ h: c === n ? 'check' : String(c), c: c === k ? 'new' : '' })));
          const parts = [
            drawGraph(G, L, { v: i => (i === S ? 'src ' : '') + (ch.has(i) ? 'new' : col[i] < Infinity ? 'done' : ''), tag: i => [[dH(col[i]), ch.has(i) ? 'chg' : 'lv']], e: k2 => ecl.get(k2) || '' }),
            legend([['v', 'new', 'D drops this round'], ['e', 'hot', 'the edge that lowers it'], ['e', 'tree', 'last edge of the best path so far']]),
            sub('$D(v)$ after each round (column 0 = the start)'),
            tbl(head, range(n).map(i => [G.labels[i]].concat(range(k + 1).map(c => dCell(R.cols[c][i], c === k ? (ch.has(i) ? 'new' : 'done') : ''))))),
          ];
          if (rd) {
            const tried = rd.tries.filter(x => x.cand < Infinity), skipped = rd.tries.length - tried.length;
            parts.push(sub('Round ' + rd.r + ': the edges $(j, k)$ whose start $j$ has a distance'),
              tried.length ? tbl(['edge', '$D(j) + W(j, k)$', '$D(k)$ before', '$D(k)$ after the round'], tried.map(x => {
                const best = ch.has(x.a.v) && rd.via[x.a.v] === x.a;
                return [X.e(x.a.u, x.a.v), { h: dH(rd.prev[x.a.u]) + ' + ' + (x.a.w < 0 ? '(' + minus(x.a.w) + ')' : x.a.w) + ' = ' + dH(x.cand), c: best ? 'new' : '' }, dCell(rd.prev[x.a.v]), dCell(rd.next[x.a.v], best ? 'new' : '')];
              }), { compact: true }) : null,
              skipped ? K.p('<small>' + pl(skipped, 'other edge') + ' start' + (skipped === 1 ? 's' : '') + ' at a vertex whose D is still ∞; ∞ + W(j, k) = ∞ changes nothing.</small>') : null);
          }
          return parts;
        }));
        if (R.neg) {
          const cyE = new Set(R.cycle.slice(1).map((v, i) => G.E[R.cycle[i]][v]));
          out.append(K.card('The negative cycle',
            drawGraph(G, L, { v: i => (R.cycle.includes(i) ? 'bad' : ''), e: k => (cyE.has(k) ? 'cyc' : '') }),
            K.steps([{ text: 'Follow, from a vertex that still dropped in round ' + n + ', the edges that lowered each value, back through the rounds. That walk has $n$ edges, so a vertex repeats; the stretch between is this cycle:', tex: X.pathT(R.cycle) }, { text: 'Its total weight is negative:', tex: cw.map(pT).join(' + ') + ' = ' + cw.reduce((a, b) => a + b, 0) }])));
          return;
        }
        const tE = new Set(); R.par.forEach((p, v) => { if (p >= 0) tE.add(G.E[p][v]); });
        out.append(K.card('The shortest paths',
          drawGraph(G, L, { v: i => (i === S ? 'src done' : R.D[i] < Infinity ? 'done' : 'off'), tag: i => [[dH(R.D[i]), 'lv']], e: k => (tE.has(k) ? 'tree' : 'dim') }),
          tbl(['vertex', 'distance', 'path'], range(n).map(i => [G.labels[i], dCell(R.D[i]), { h: R.D[i] < Infinity ? X.path(pathTo(R.par, i)) : '—', c: 'left' }]), { compact: true })));
        const F = runFW(G).mats[n], agree = range(n).every(i => i === S || F[S][i] === R.D[i]);
        out.append(K.card('Check with Floyd–Warshall',
          K.p('Floyd–Warshall (lecture 11.7) finds every pair at once, in a different way. Its row ' + X.b(S) + ' should give the same distances (its diagonal entry is the shortest cycle through ' + X.b(S) + ', not 0).'),
          tbl(['vertex', 'Bellman–Ford', 'Floyd–Warshall', ''], range(n).filter(i => i !== S).map(i => [G.labels[i], dCell(R.D[i]), dCell(F[S][i]), F[S][i] === R.D[i] ? { h: '✓', c: 'good' } : { h: '✗', c: 'bad' }]), { compact: true }),
          K.note(agree ? 'The same for every vertex ✓' : 'They differ ✗', agree ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- floyd-warshall */
    // ?g=…&at=bf8&i=0&j=5&step=1&all=0   i, j = the entry worked out at every step (vertices of g; tapping a cell picks it
    //   too); step = 1 (SP⁰ = W) to n + 1 (every vertex allowed)
    'floyd-warshall'(el, query, ctx) {
      const t = topic(el, query, ctx, { g: BF8, at: 'bf8', i: '0', j: '5', step: 1, all: 0 }, (v, G) => { if (G) { v.i = vOr(G, v.i, G.labels[0]); v.j = vOr(G, v.j, G.labels[G.n - 1]); } });
      const { s } = t;
      const pick = (G, i, j) => { s.set({ i: G.labels[i], j: G.labels[j] }, true); if (t.dyn) { t.dyn.innerHTML = ''; t.dynFill(); } t.draw(); };
      t.start(() => {
        t.controls.append(
          K.p('<b>Floyd–Warshall</b> finds the shortest distance between every pair at once. $SP^k[i, j]$ is the length of the shortest path from $i$ to $j$ that may stop only at the first $k$ vertices. $SP^0$ is the weight matrix $W$, with $\\infty$ where there is no edge. Allowing one more vertex $k$: a shortest path either avoids it, or goes from $i$ to $k$ and on to $j$. Take the smaller.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn', style: 'display:grid;gap:14px' }),
          tries([
            ['Lecture 11.7: the graph of 11.6', { g: BF8, at: 'bf8', i: '0', j: '5' }, 'Allowing 1 changes column 5: 0 → 5 becomes 10 + 2 = 12, 2 → 5 becomes 3, 6 → 5 becomes −2.'],
            ['Lecture 11.5’s graph', { g: DIJ7, at: 'dij', i: '0', j: '5' }],
            ['Lecture 11.4: a negative cycle', { g: NEGC, at: 'negc', i: '1', j: '1' }],
            ['No weights: the airline routes', { g: AIR_D, at: 'air', i: '9', j: '0' }, 'Every arrow counts 1: the fewest flights between any two cities.'],
          ], t.load));
        t.dynFill = () => {
          if (t.G.err) return;
          t.dyn.append(vselect('Work out the entry from $i$ =', t.G, s.v.i, x => { s.set({ i: x }, true); t.draw(); }),
            vselect('to $j$ =', t.G, s.v.j, x => { s.set({ j: x }, true); t.draw(); }));
        };
        t.dynFill();
      }, draw);
      function draw(G) {
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, out = t.out, I = G.idx.get(s.v.i), J = G.idx.get(s.v.j), R = runFW(G), F = R.mats[n];
        const spT = (t2, i, j) => 'SP^{' + t2 + '}[' + X.t(i) + ', ' + X.t(j) + ']', negD = range(n).filter(i => F[i][i] < 0);
        if (G.note) out.append(K.note(G.note));
        if (!G.weighted) out.append(K.note('No weights: every edge counts 1, so the distances count edges.'));
        if (negD.length) out.append(K.answer('A negative cycle', spT(n, negD[0], negD[0]) + ' = ' + F[negD[0]][negD[0]] + ' < 0', 'A vertex with a negative diagonal entry lies on a negative cycle: ' + X.list(negD) + '. Distances through them are not defined (lecture 11.4), so the other numbers here mean little.'));
        else out.append(K.answer('Shortest distance from ' + X.n(I) + ' to ' + X.n(J), spT(n, I, J) + ' = ' + dT(F[I][J]), I === J ? 'On the diagonal: the shortest cycle through ' + X.n(I) + (F[I][I] === Infinity ? ' (∞: none).' : '.') : ''));
        const steps = [{ head: 'SP⁰ = W: no stops allowed', text: 'With no vertex allowed in between, the only paths are single edges: $SP^0[i, j] = W[i, j]$, the weight of the edge from $i$ to $j$, and $\\infty$ where there is no edge (also from a vertex to itself, as in the lecture).', tex: spT(0, I, J) + ' = ' + dT(R.mats[0][I][J]) }];
        R.changes.forEach((ch, k) => {
          const P = R.mats[k], N = R.mats[k + 1], allowed = range(k + 1).map(x => G.labels[x]).join(', ');
          let text = 'Now the paths may also stop at ' + X.b(k) + ' (allowed: ' + allowed + '). A shortest path from $i$ to $j$ either avoids ' + X.b(k) + ', and is $SP^{' + k + '}[i, j]$, or goes from $i$ to ' + X.b(k) + ' and from ' + X.b(k) + ' to $j$, each part using only the earlier vertices. Take the smaller: ';
          text += ch.length ? pl(ch.length, 'entry', 'entries') + ' get smaller (shaded).' : 'nothing gets smaller' + (!G.inn[k].length ? ' (no edge comes into ' + X.b(k) + ', so no path can pass through it)' : !G.out[k].length ? ' (no edge leaves ' + X.b(k) + ')' : '') + '.';
          const watch = spT(k + 1, I, J) + ' = \\min(' + spT(k, I, J) + ', ' + spT(k, I, k) + ' + ' + spT(k, k, J) + ') = \\min(' + dT(P[I][J]) + ', ' + dT(P[I][k]) + ' + ' + pT(P[k][J]) + ') = ' + dT(N[I][J]);
          const others = ch.filter(c => !(c.i === I && c.j === J));
          if (others.length > 8) text += ' The first 8 are worked out below; all are shaded in the table.';
          steps.push({ head: 'SP' + supU(k + 1) + ': allow ' + X.n(k), text, tex: [watch].concat(others.slice(0, 8).map(c => spT(k + 1, c.i, c.j) + ' = \\min(' + dT(c.old) + ', ' + c.a + ' + ' + pT(c.b) + ') = ' + c.via)) });
        });
        // a shortest path for the watched entry: through the vertex that last improved it
        const mids = [range(n).map(() => Array(n).fill(-1))];
        R.changes.forEach((ch, k) => { const M = mids[k].map(r => r.slice()); ch.forEach(c => { M[c.i][c.j] = k; }); mids.push(M); });
        const route = (t2, i, j, depth) => { if (depth > 2 * n || R.mats[t2][i][j] === Infinity) return null; const m = mids[t2][i][j]; if (m < 0) return G.W[i][j] != null ? [i, j] : null; const a = route(t2, i, m, depth + 1), b = route(t2, m, j, depth + 1); return a && b ? a.concat(b.slice(1)) : null; };
        out.append(stepCard(t, 'Step by step: allow one more vertex at a time', steps, k => {
          const M = R.mats[k], ch = k ? R.changes[k - 1] : [], chg = new Set(ch.map(c => c.i * n + c.j)), via = k - 1, path = route(k, I, J, 0), pe = new Set();
          if (path) path.slice(1).forEach((v, x) => pe.add(G.E[path[x]][v]));
          const click = ([i, j]) => pick(G, i, j);
          return [
            drawGraph(G, L, { v: i => (i === via ? 'cur' : i === I || i === J ? 'new' : i < via ? 'done' : ''), e: k2 => (pe.has(k2) ? 'hot' : '') }),
            legend([['v', 'cur', 'allowed now'], ['v', 'done', 'allowed before'], ['v', 'new', 'the entry you watch'], ['e', 'hot', 'its shortest path so far']]),
            K.p(path ? 'Shortest path from ' + X.b(I) + ' to ' + X.b(J) + ' so far: ' + X.path(path) + ', length ' + dH(M[I][J]) + '.' : 'No path from ' + X.b(I) + ' to ' + X.b(J) + ' yet with these stops.'),
            sub('$SP^{' + k + '}$ (shaded: changed now; tap a cell to watch it)'),
            matTable(G, (i, j) => ({ h: dH(M[i][j]), c: [M[i][j] === Infinity ? 'inf' : '', chg.has(i * n + j) ? 'new' : (i === via || j === via) && k ? 'done' : '', i === I && j === J ? 'pick' : ''].filter(Boolean).join(' '), k: [i, j] }), { click, corner: 'from \\ to' }),
          ];
        }));
        if (negD.length) return;
        const rows = range(n).map(src => ({ src, B: runBF(G, src) })), bad = rows.filter(r => r.B.neg);
        const agree = !bad.length && rows.every(r => range(n).every(j => j === r.src || r.B.D[j] === F[r.src][j]));
        out.append(K.card('Check with Bellman–Ford from every vertex',
          K.p('Run Bellman–Ford (lecture 11.6) from each vertex in turn: row $i$ of $SP^{' + n + '}$ should match the distances from $i$ (apart from the diagonal, which here is the shortest cycle through $i$).'),
          tbl(['from', 'Bellman–Ford: distances to ' + G.labels.join(', '), ''], rows.map(r => {
            const ok = !r.B.neg && range(n).every(j => j === r.src || r.B.D[j] === F[r.src][j]);
            return [G.labels[r.src], { h: r.B.D.map((d, j) => (j === r.src ? '·' : dH(d))).join(', '), c: 'left' }, ok ? { h: '✓', c: 'good' } : { h: '✗', c: 'bad' }];
          }), { compact: true }),
          K.note(agree ? 'Every row agrees ✓' : 'Some rows differ ✗', agree ? 'good' : 'warn')));
      }
    },

    /* ---------------------------------------------------------------- spanning-tree */
    // ?g=…&at=mst5&alg=prim&from=edge&step=1&all=0   alg = prim | kruskal (the one stepped through; both are compared);
    //   from = edge (Prim starts with the smallest edge, as lecture 11.9 does first) or a vertex of g to start Prim at
    'spanning-tree'(el, query, ctx) {
      const t = topic(el, query, ctx, { g: MST5, at: 'mst5', alg: 'prim', from: 'edge', step: 1, all: 0 }, (v, G) => { if (v.alg !== 'kruskal') v.alg = 'prim'; v.from = String(v.from); if (G && v.from !== 'edge' && !G.idx.has(v.from)) v.from = 'edge'; });
      const { s } = t;
      t.start(() => {
        t.controls.append(
          K.p('A <b>spanning tree</b> keeps just enough edges to join every vertex: it is connected and has no cycle, so it has $n - 1$ edges. With costs on the edges we want the <b>minimum cost spanning tree</b>. <b>Prim</b> grows one tree, adding the cheapest edge that leaves it; <b>Kruskal</b> takes the edges from cheapest up and adds each one that does not close a cycle.'),
          graphBox(t),
          t.dyn = h('div', { class: 'gl-dyn', style: 'display:grid;gap:14px' }),
          tries([
            ['Lecture 11.9: Prim, cost 44', { g: MST5, at: 'mst5', alg: 'prim', from: 'edge' }, 'TE = {(1, 3), (1, 0), (1, 2), (2, 4)}; the edge 18 is refused: 0 and 3 are both in the tree.'],
            ['Lecture 11.10: Kruskal on the same graph', { g: MST5, at: 'mst5', alg: 'kruskal', from: 'edge' }, 'Adds 6, 8, 10, skips 18, adds 20.'],
            ['Lecture 11.10: Kruskal, three edges of weight 10', { g: KR7, at: 'kr7', alg: 'kruskal', from: 'edge' }, 'Sorted: (5,6), (1,2), (0,1), (4,5), (4,6), (0,2), (1,4), (2,3); skips (4,6) and (0,2).'],
            ['Lecture 11.9: Prim from vertex 0', { g: MST5, at: 'mst5', alg: 'prim', from: '0' }],
            ['Lecture 11.10: equal weights in a triangle', { g: TRI3, at: '', alg: 'kruskal', from: 'edge' }, 'Three minimum trees, each of cost 6.'],
            ['Lecture 11.10: a square and both diagonals', { g: SQ4, at: 'sq4', alg: 'prim', from: 'edge' }, 'No weights: every spanning tree is a minimum one; there are 16.'],
          ], t.load));
        t.dynFill = () => {
          if (t.G.err || t.G.directed) return;
          const fromBox = h('div', { hidden: s.v.alg === 'prim' ? null : true });
          fromBox.append(K.select({ label: 'Prim starts with', value: s.v.from, options: [['edge', 'the smallest edge (lecture 11.9)']].concat(t.G.labels.map(l => [l, 'vertex ' + l])), onChange: x => { s.set({ from: x, step: 1 }, true); t.draw(); } }));
          t.dyn.append(K.seg({ label: 'Step through', options: [['prim', 'Prim'], ['kruskal', 'Kruskal']], value: s.v.alg, onChange: x => { s.set({ alg: x, step: 1 }, true); fromBox.hidden = x !== 'prim'; t.draw(); } }), fromBox);
        };
        t.dynFill();
      }, draw);
      function draw(G) {
        const out = t.out;
        if (G.directed) { out.append(K.note('Spanning trees are for undirected graphs (lecture 11.8). Write the edges with a dash, like 0-1:10.', 'warn')); return; }
        const X = nm(G), L = layoutFor(G, s.v.at), n = G.n, from = s.v.from === 'edge' ? -1 : G.idx.get(s.v.from), P = runPrim(G, from), Kr = runKruskal(G), prim = s.v.alg === 'prim';
        const eOnly = (a, b) => '(' + G.labels[a] + ', ' + G.labels[b] + ')', eTxt = (a, b, w) => eOnly(a, b) + (G.weighted ? ' ' + minus(w) : '');
        const teT = TE => TE.map(e => X.eT(e.a, e.b)).join(', '), costT = TE => (TE.length > 1 ? TE.map(e => pT(e.w)).join(' + ') + ' = ' : '') + TE.reduce((a, e) => a + e.w, 0);
        if (G.note) out.append(K.note(G.note));
        if (!G.weighted) out.append(K.note('No weights: every edge costs 1, so every spanning tree costs $n - 1 = ' + (n - 1) + '$.'));
        const best = prim ? P : Kr;
        out.append(best.complete
          ? K.answer('A minimum cost spanning tree (' + (prim ? 'Prim' : 'Kruskal') + ')', 'TE = \\{' + teT(best.TE) + '\\}, \\quad \\text{cost} = ' + costT(best.TE), (prim ? 'Kruskal' : 'Prim') + ' finds cost ' + (prim ? Kr.cost : P.cost) + ' too.')
          : K.answer('No spanning tree: the graph is not connected', '\\text{cost of the spanning forest} = ' + Kr.cost, 'Kruskal still joins each component by a tree.'));
        const primSteps = P.steps.map(st => {
          if (st.kind === 'start') return { head: 'Start: TV = TE = ∅', text: 'TV will hold the tree vertices and TE the tree edges (lecture 11.9). A vertex being in TV does not mean every edge between tree vertices is in TE.', tex: 'TV = TE = \\varnothing' };
          if (st.kind === 'first') return { head: 'The smallest edge: ' + eTxt(st.e.u, st.e.v, st.e.w), text: 'Start with the smallest edge of the whole graph' + (G.weighted ? '' : ' (all equal: the first one)') + '. On its own it is a tree.', tex: 'TV = ' + X.setT(st.TV) + ',\\ TE = \\{' + teT(st.TE) + '\\},\\ \\text{cost} = ' + st.cost };
          if (st.kind === 'vertex') return { head: 'Start at vertex ' + X.n(st.v), text: 'Start with the single vertex ' + X.b(st.v) + '. Any vertex will do: the cheapest edge at a vertex belongs to every minimum tree (the minimum separator lemma, lecture 11.9).', tex: 'TV = \\{' + X.t(st.v) + '\\},\\ TE = \\varnothing' };
          if (st.kind === 'stuck') return { head: 'No edge leaves the tree', text: 'Every edge has both ends in the tree or both outside, so ' + X.list(range(n).filter(i => !st.TV.includes(i))) + ' can never be joined. The graph is not connected: it has no spanning tree.' };
          let text = 'Edges with one end in TV and the other outside, cheapest first: ' + st.cand.map(c => eTxt(c.a, c.b, c.w)).join(', ') + '. Take the cheapest, ' + eTxt(st.a, st.b, st.e.w) + ': add ' + X.b(st.b) + ' to TV and the edge to TE.';
          if (st.inside.length) { const one = st.inside.length === 1, cheaper = st.inside.every(x => x.w < st.e.w); text += ' ' + st.inside.map(x => eTxt(x.u, x.v, x.w)).join(', ') + (one ? (cheaper ? ' is cheaper' : ' comes earlier in the order') + ', but both its ends are' : (cheaper ? ' are cheaper' : ' come earlier in the order') + ', but both ends of each are') + ' already in the tree: adding ' + (one ? 'it' : 'one') + ' would close a cycle, so ' + (one ? 'it is' : 'they are') + ' not allowed.'; }
          return { head: 'Add ' + eTxt(st.a, st.b, st.e.w), text, tex: 'TV = ' + X.setT(st.TV) + ',\\ \\text{cost} = ' + costT(st.TE) };
        });
        const krSteps = Kr.steps.map(st => {
          if (st.kind === 'sort') return { head: 'Sort the edges, cheapest first', text: 'Sort the edges by weight; equal weights go by their end points (lecture 11.10): ' + st.sorted.map((e, i) => 'e' + subU(i) + ' = ' + eTxt(e.u, e.v, e.w)).join(', ') + '. Start with every vertex in a component of its own and TE = ∅.', tex: st.sorted.length ? st.sorted.map(e => pT(e.w)).join(' \\le ') : '\\text{no edges}' };
          const e = st.e, name = 'e' + subU(st.i) + ' = ' + eTxt(e.u, e.v, e.w);
          if (st.kind === 'add') return { head: 'Add ' + name, text: X.b(e.u) + ' is in ' + X.set(st.gu) + ' and ' + X.b(e.v) + ' in ' + X.set(st.gv) + ': different components, so this edge joins them without closing a cycle. Add it to TE; the two components become one.' + (st.TE.length === n - 1 ? ' TE now has $n - 1 = ' + (n - 1) + '$ edges: the tree is complete, and every later edge will be skipped.' : ''), tex: '\\text{cost} = ' + costT(st.TE) };
          return { head: 'Skip ' + name, text: X.b(e.u) + ' and ' + X.b(e.v) + ' are already in the same component, ' + X.set(st.gu) + ': this edge would close a cycle. Skip it.' };
        });
        const primView = k => {
          const st = P.steps[k], inTV = new Set(st.TV), tE = new Set(st.TE.map(e => e.k)), cand = new Set((st.cand || []).map(c => c.k)), ins = new Set((st.inside || []).map(x => x.k));
          const hotK = st.kind === 'add' || st.kind === 'first' ? st.e.k : -1, nv = st.kind === 'add' ? st.b : st.kind === 'vertex' ? st.v : -1;
          return [
            drawGraph(G, L, { v: i => (i === nv ? 'new' : inTV.has(i) ? 'done' : ''), e: k2 => (k2 === hotK ? 'hot' : tE.has(k2) ? 'tree' : ins.has(k2) ? 'skip' : cand.has(k2) ? 'look' : '') }),
            legend([['e', 'hot', 'added now'], ['e', 'tree', 'in TE'], ['e', 'look', 'other edges leaving the tree'], ['e', 'skip', 'would close a cycle'], ['v', 'done', 'in TV']]),
            st.kind === 'add' ? tbl(['edge leaving the tree', 'weight', ''], st.cand.map(c => [eOnly(c.a, c.b), minus(c.w), c.k === st.e.k ? { h: 'cheapest', c: 'good' } : '']), { compact: true, rowCls: i => (st.cand[i].k === st.e.k ? 'cur' : '') }) : null,
            K.p('$TV = ' + X.setT(st.TV) + '$, $TE = \\{' + teT(st.TE) + '\\}$, cost so far ' + st.cost + '.'),
          ];
        };
        const krView = k => {
          const st = Kr.steps[k], tE = new Set(st.TE.map(e => e.k)), cur = st.kind === 'sort' ? -1 : st.e.k, gi = range(n).map(v => st.groups.findIndex(g => g.includes(v))), upto = st.kind === 'sort' ? -1 : st.i;
          return [
            drawGraph(G, L, { v: i => 'k' + (gi[i] % 8), e: k2 => (k2 === cur ? (st.kind === 'add' ? 'hot' : 'skip') : tE.has(k2) ? 'tree' : '') }),
            legend([['e', 'hot', 'added now'], ['e', 'skip', 'skipped now'], ['e', 'tree', 'in TE'], ['v', 'k0', 'colour = component']]),
            tbl(['', 'edge', 'weight', 'decision'], Kr.sorted.map((e, i) => {
              const d = i <= upto ? (tE.has(e.k) ? 'add' : 'skip') : '';
              return ['e' + subU(i), eOnly(e.u, e.v), minus(e.w), { h: d, c: d === 'add' ? 'good' : d ? 'bad' : '' }];
            }), { compact: true, rowCls: i => (i === upto ? 'cur' : i > upto ? 'off' : '') }),
            K.p('Components: ' + st.groups.map(g => X.set(g)).join(', ') + '. Cost so far ' + st.cost + '.'),
          ];
        };
        out.append(prim ? stepCard(t, 'Step by step: Prim', primSteps, primView) : stepCard(t, 'Step by step: Kruskal', krSteps, krView));
        const sameSet = P.TE.length === Kr.TE.length && P.TE.every(e => Kr.TE.some(f => f.k === e.k)), tE = new Set(best.TE.map(e => e.k));
        out.append(K.card('Prim and Kruskal compared',
          drawGraph(G, L, { v: () => 'done', e: k => (tE.has(k) ? 'tree' : 'dim') }),
          tbl(['', 'edges in the order added', 'cost'], [['Prim', { h: P.TE.map(e => eOnly(e.a, e.b)).join(', ') || '—', c: 'left' }, String(P.cost)], ['Kruskal', { h: Kr.TE.map(e => eOnly(e.a, e.b)).join(', ') || '—', c: 'left' }, String(Kr.cost)]], { compact: true }),
          K.steps([
            { text: 'Both trees have $n - 1 = ' + (n - 1) + '$ edges' + (P.complete && Kr.complete ? ', join all ' + n + ' vertices and close no cycle: by lecture 11.8, any two of these three facts make a tree.' : '; this graph is not connected, so neither can join every vertex.') },
            { text: 'Both are right for the same reason, the <b>minimum separator lemma</b> (lectures 11.9, 11.10): split the vertices into two groups; the cheapest edge between the groups belongs to every minimum tree. Prim’s groups are the tree and the rest; Kruskal’s are the component of one end and the rest.' },
          ]),
          K.note(P.complete && Kr.complete && P.cost === Kr.cost ? (sameSet ? 'The same tree and the same cost ✓' : 'Different edges, the same cost ✓ Equal weights allow several minimum trees, and the two algorithms may pick different ones (lecture 11.10).') : P.complete && Kr.complete ? 'The costs differ ✗' : 'No spanning tree: the graph is not connected.', P.complete && Kr.complete && P.cost === Kr.cost ? 'good' : 'warn')));
        const all = allTrees(G, 200000);
        if (all && best.complete) out.append(K.card('Check: every spanning tree',
          K.steps([
            { text: 'Try every choice of $n - 1 = ' + (n - 1) + '$ edges out of $m = ' + G.m + '$ and keep those that make a tree:', tex: '\\binom{' + G.m + '}{' + (n - 1) + '} = ' + Math.round(all.comb) + ' \\text{ choices}, \\ ' + all.count + ' \\text{ spanning trees}' },
            { text: 'The cheapest of them costs ' + all.best + ', and ' + pl(all.nBest, 'tree') + (all.nBest === 1 ? ' has' : ' have') + ' that cost.' },
          ]),
          K.note(all.best === best.cost ? 'The algorithms’ cost ' + best.cost + ' is the least possible ✓' : 'The algorithm’s cost is not the least ✗', all.best === best.cost ? 'good' : 'warn')));
      }
    },
  });
})();
