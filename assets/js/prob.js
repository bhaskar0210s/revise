/* Revise — probability models: sample spaces, PMFs, joint PMFs, functions of random variables.
   All probabilities are exact fractions (Lab.F) unless a distribution is irrational (Poisson). */
(function () {
  'use strict';
  const F = Lab.F;
  const P = (Lab.P = {});

  /* --------------------------------------------------------- sample spaces */
  /** n tosses of a coin. Outcome v = 'HTH'. p(H) can be given as a fraction. */
  P.coins = function (n, pH = F(1, 2)) {
    pH = F(pH);
    const out = [];
    for (let m = 0; m < 1 << n; m++) {
      let s = '', pr = F(1);
      for (let k = n - 1; k >= 0; k--) {
        const head = ((m >> k) & 1) === 0;
        s += head ? 'H' : 'T';
        pr = pr.mul(head ? pH : F(1).sub(pH));
      }
      out.push({ id: s, label: s, v: s, p: pr, kind: 'coins' });
    }
    return out;
  };
  /** n rolls of a fair die (faces 1..k). Outcome v = [d1, d2, ...]. */
  P.dice = function (n, faces = 6) {
    const out = [];
    const total = Math.pow(faces, n);
    for (let m = 0; m < total; m++) {
      const v = [];
      let r = m;
      for (let k = 0; k < n; k++) { v.unshift((r % faces) + 1); r = Math.floor(r / faces); }
      out.push({ id: v.join(','), label: '(' + v.join(', ') + ')', v, p: F(1, total), kind: 'dice' });
    }
    return out;
  };
  P.SUITS = [
    { s: '♠', name: 'spades', color: 'black' }, { s: '♥', name: 'hearts', color: 'red' },
    { s: '♦', name: 'diamonds', color: 'red' }, { s: '♣', name: 'clubs', color: 'black' },
  ];
  P.RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  /** One card from a 52-card deck. v = {rank, r (1..13), suit, color} */
  P.deck = function () {
    const out = [];
    P.SUITS.forEach(su => P.RANKS.forEach((rk, i) => out.push({
      id: rk + su.s, label: rk + su.s, v: { rank: rk, r: i + 1, suit: su.s, suitName: su.name, color: su.color, face: i >= 10 }, p: F(1, 52), kind: 'card',
    })));
    return out;
  };
  /** Numbers lo..hi chosen uniformly (e.g. 0..99). v = the number. */
  P.numbers = function (lo, hi, pad = 0) {
    const out = [];
    const n = hi - lo + 1;
    for (let k = lo; k <= hi; k++) out.push({ id: String(k), label: pad ? String(k).padStart(pad, '0') : String(k), v: k, p: F(1, n), kind: 'number' });
    return out;
  };

  /* ------------------------------------------------------------ one RV PMF */
  function sortVals(a, b) { return Number(a) - Number(b); }
  /** Build a distribution {vals, p, groups} from outcomes and a function X(outcome). */
  P.fromOutcomes = function (outcomes, X) {
    const map = new Map();
    outcomes.forEach((o, k) => {
      const x = X(o.v, o);
      const key = String(x);
      if (!map.has(key)) map.set(key, { value: x, p: F(0), members: [] });
      const g = map.get(key);
      g.p = g.p.add(o.p);
      g.members.push(k);
    });
    const groups = [...map.values()].sort((a, b) => sortVals(a.value, b.value));
    return { vals: groups.map(g => g.value), p: groups.map(g => g.p), groups };
  };
  /** Distribution from parallel arrays. */
  P.dist = function (vals, ps) { return { vals: vals.slice(), p: ps.map(x => F(x)) }; };
  P.total = d => F.sum(d.p);
  /** CDF values F(t) = P(X <= t) at each support point. */
  P.cdf = function (d) { let acc = F(0); return d.p.map(x => (acc = acc.add(x))); };
  P.expect = function (d, g = x => x) { return d.vals.reduce((s, v, i) => s + Number(g(v)) * Number(d.p[i]), 0); };
  P.variance = function (d) { const m = P.expect(d); return P.expect(d, v => (v - m) * (v - m)); };

  /* -------------------------------------------------------- named families */
  P.bernoulli = p => P.dist([0, 1], [F(1).sub(F(p)), F(p)]);
  P.uniform = (a, b) => P.dist(Lab.range(a, b), Lab.range(a, b).map(() => F(1, b - a + 1)));
  P.binomial = function (n, p) {
    p = F(p);
    const q = F(1).sub(p);
    return P.dist(Lab.range(0, n), Lab.range(0, n).map(k => F(Lab.math.choose(n, k)).mul(p.pow(k)).mul(q.pow(n - k))));
  };
  /** Geometric on {1,2,...}: P(X=k) = (1-p)^(k-1) p, truncated at kmax for display. */
  P.geometric = function (p, kmax = 10) {
    p = F(p);
    const q = F(1).sub(p);
    return P.dist(Lab.range(1, kmax), Lab.range(1, kmax).map(k => q.pow(k - 1).mul(p)));
  };
  /** Negative binomial on {r, r+1, ...}: the toss of the r-th success. P(S=s) = C(s-1, r-1) p^r (1-p)^(s-r), truncated at kmax. */
  P.negbin = function (r, p, kmax = r + 10) {
    p = F(p);
    const q = F(1).sub(p);
    const vals = Lab.range(r, Math.max(r, kmax));
    return P.dist(vals, vals.map(s => F(Lab.math.choose(s - 1, r - 1)).mul(p.pow(r)).mul(q.pow(s - r))));
  };
  /** Poisson(λ), floats, truncated at kmax. */
  P.poisson = function (lam, kmax = 12) {
    const vals = Lab.range(0, kmax);
    let term = Math.exp(-lam);
    const ps = vals.map(k => { const v = k === 0 ? term : (term = (term * lam) / k); return v; });
    return { vals, p: ps.map(x => x), float: true };
  };

  /* -------------------------------------------------------- joint of two RVs */
  /** Joint table {xs, ys, p[i][j] = P(X=xs[i], Y=ys[j]), cells[i][j] = outcome indices}. */
  P.joint = function (outcomes, X, Y) {
    const xs = [...new Set(outcomes.map(o => X(o.v, o)))].sort(sortVals);
    const ys = [...new Set(outcomes.map(o => Y(o.v, o)))].sort(sortVals);
    const p = xs.map(() => ys.map(() => F(0)));
    const cells = xs.map(() => ys.map(() => []));
    outcomes.forEach((o, k) => {
      const i = xs.findIndex(v => Lab.sameVal(v, X(o.v, o)));
      const j = ys.findIndex(v => Lab.sameVal(v, Y(o.v, o)));
      p[i][j] = p[i][j].add(o.p);
      cells[i][j].push(k);
    });
    return { xs, ys, p, cells };
  };
  /** Joint from an explicit table. p given as p[i][j] for xs[i], ys[j] (numbers, strings like '1/8', or Frac). */
  P.table = function (xs, ys, p) { return { xs: xs.slice(), ys: ys.slice(), p: p.map(r => r.map(v => F(v))) }; };
  /** Same table but written the way the lecture draws it: rows = Y values, columns = X values. */
  P.tableRowsY = function (xs, ys, rows) { return P.table(xs, ys, xs.map((_, i) => ys.map((_, j) => rows[j][i]))); };
  P.margX = J => ({ vals: J.xs.slice(), p: J.xs.map((_, i) => F.sum(J.p[i])) });
  P.margY = J => ({ vals: J.ys.slice(), p: J.ys.map((_, j) => F.sum(J.p.map(r => r[j]))) });
  P.jointTotal = J => F.sum(J.p.flat());
  /** Distribution of Y given X = xs[i] (null when P(X = xs[i]) = 0). */
  P.condYgivenX = function (J, i) {
    const px = F.sum(J.p[i]);
    if (px.isZero()) return null;
    return { vals: J.ys.slice(), p: J.p[i].map(v => v.div(px)), given: px };
  };
  P.condXgivenY = function (J, j) {
    const py = F.sum(J.p.map(r => r[j]));
    if (py.isZero()) return null;
    return { vals: J.xs.slice(), p: J.p.map(r => r[j].div(py)), given: py };
  };
  /** Product table f_X(x) f_Y(y): what the joint would be if X and Y were independent. */
  P.product = function (dx, dy) { return { xs: dx.vals.slice(), ys: dy.vals.slice(), p: dx.p.map(a => dy.p.map(b => F(a).mul(F(b)))) }; };
  /** Check independence cell by cell. Returns {independent, bad: [[i,j], ...], prod} */
  P.independence = function (J) {
    const mx = P.margX(J), my = P.margY(J);
    const prod = P.product(mx, my);
    const bad = [];
    J.xs.forEach((_, i) => J.ys.forEach((_, j) => { if (!J.p[i][j].eq(prod.p[i][j])) bad.push([i, j]); }));
    return { independent: bad.length === 0, bad, prod, mx, my };
  };

  /* --------------------------------------------------- functions of RVs */
  /** Distribution of g(X): groups list which X-values map to each output value. */
  P.map = function (d, g) {
    const m = new Map();
    d.vals.forEach((x, i) => {
      const y = g(x);
      const key = String(Lab.expr.num(y));
      if (!m.has(key)) m.set(key, { value: Lab.expr.num(y), raw: y, p: d.float ? 0 : F(0), from: [] });
      const e = m.get(key);
      e.p = d.float ? e.p + d.p[i] : e.p.add(d.p[i]);
      e.from.push(i);
    });
    const groups = [...m.values()].sort((a, b) => a.value - b.value);
    return { vals: groups.map(e => e.value), p: groups.map(e => e.p), groups, float: d.float };
  };
  /** Distribution of g(X, Y) from a joint table: groups list the (i, j) cells for each output value. */
  P.map2 = function (J, g) {
    const m = new Map();
    J.xs.forEach((x, i) => J.ys.forEach((y, j) => {
      const z = Lab.expr.num(g(x, y));
      const key = String(z);
      if (!m.has(key)) m.set(key, { value: z, p: F(0), cells: [] });
      const e = m.get(key);
      e.p = e.p.add(J.p[i][j]);
      e.cells.push([i, j]);
    }));
    const groups = [...m.values()].sort((a, b) => a.value - b.value);
    return { vals: groups.map(e => e.value), p: groups.map(e => e.p), groups };
  };

  /* ---------------------------------------------- joint of many RVs (rows) */
  /** rows: [{t: [t1, t2, ...], p}] — the lecture's "list of tuples" view of a joint PMF. */
  P.rows = function (outcomes, fns) {
    const m = new Map();
    outcomes.forEach((o, k) => {
      const t = fns.map(f => f(o.v, o));
      const key = t.join('|');
      if (!m.has(key)) m.set(key, { t, p: F(0), members: [] });
      const e = m.get(key);
      e.p = e.p.add(o.p);
      e.members.push(k);
    });
    return [...m.values()].sort((a, b) => { for (let i = 0; i < a.t.length; i++) { const d = Number(a.t[i]) - Number(b.t[i]); if (d) return d; } return 0; });
  };
  /** Keep only the variables at positions `keep` (sum over the rest). */
  P.marginalRows = function (rows, keep) {
    const m = new Map();
    rows.forEach(r => {
      const t = keep.map(k => r.t[k]);
      const key = t.join('|');
      if (!m.has(key)) m.set(key, { t, p: F(0), from: [] });
      const e = m.get(key);
      e.p = e.p.add(r.p);
      e.from.push(r);
    });
    return [...m.values()].sort((a, b) => { for (let i = 0; i < a.t.length; i++) { const d = Number(a.t[i]) - Number(b.t[i]); if (d) return d; } return 0; });
  };
  /** Condition on variables: given = {position: value}. Returns {rows (renormalised), total (P of the condition)}. */
  P.conditionRows = function (rows, given) {
    const keys = Object.keys(given).map(Number);
    const match = rows.filter(r => keys.every(k => Lab.sameVal(r.t[k], given[k])));
    const total = F.sum(match.map(r => r.p));
    if (total.isZero()) return { rows: [], total };
    return { rows: match.map(r => ({ t: r.t, p: r.p.div(total), raw: r.p })), total };
  };
})();
