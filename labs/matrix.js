/* Matrix lab: vectors and matrices the learner types, worked out exactly (K.F fractions) with every step shown.

   In the link a matrix is its rows separated by ";" and the entries of each row by ",": ?A=1,2;3,4 is the matrix with
   rows (1, 2) and (3, 4). A list of vectors is written the same way, one vector per group: ?v=1,2;3,4 is v1 = (1, 2)
   and v2 = (3, 4). Entries are whole numbers, fractions or decimals (3, -2/3, 0.5). Matrices go up to 4 × 4; systems,
   row reduction, bases and null spaces up to 4 × 5. The link parameters of each topic are written above it.
   The "Try" examples are the Mathematics 2 lectures' own (lecture number and time given); course questions are never used. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, T, TD, h } = K;

  /* Maths a phone can wrap. The kit wraps a chain after =, + or × on a narrow phone, but shows an aligned block, or any
     formula with a matrix, as one display that can only scroll sideways. flow() gives each row of an aligned block a
     line of its own (a row that goes on with + or − joins the line before; one that goes on with = is indented), sets
     a formula with a matrix inline so that it can break between the matrices, and lets a list break after a comma
     outside brackets. flowSteps and flowAnswer are K.steps and K.answer with flow() for the maths. */
  const { flow, flowSteps, flowAnswer } = (() => {
    const TOK = /\\(?:begin|end)\{[^}]*\}|\\[A-Za-z]+|\\.|[\s\S]/y;
    const toks = s => { const a = []; for (TOK.lastIndex = 0; TOK.lastIndex < s.length;) a.push(TOK.exec(s)[0]); return a; };
    const depth = t => (t === '{' || t === '\\left' || t.startsWith('\\begin') ? 1 : t === '}' || t === '\\right' || t.startsWith('\\end') ? -1 : 0);
    const LEAD = /^(?:\s|~|\\(?:quad|qquad|[,;: ]))+/, BIN = /^(?:[+−-]|\\(?:times|cdot|pm|mp|div)(?![A-Za-z]))/;
    const REL = /^(?:[=<>]|\\(?:approx|le|leq|ge|geq|ne|neq|equiv|sim|to|Rightarrow|Longrightarrow|longrightarrow|iff|implies)(?![A-Za-z]))/;
    function lines(src) {
      const tk = toks(String(src)), out = [];
      let pre = '', d = 0, i = 0;
      while (i < tk.length) {
        let t = tk[i++];
        if (t !== '\\begin{aligned}' || d) { d += depth(t); pre += t; continue; }
        if (pre.trim()) out.push(pre.trim());
        pre = '';
        const rows = [[]];
        let cell = '', e = 0;
        for (; i < tk.length; i++) {
          t = tk[i];
          if (!e && t === '\\end{aligned}') { i++; break; }
          if (!e && t === '\\\\') {                                 // a new row; skip a spacing like \\[4pt]
            rows[rows.length - 1].push(cell); rows.push([]); cell = '';
            let k = i + 1;
            while (k < tk.length && /^\s$/.test(tk[k])) k++;
            if (tk[k] === '[') { while (k < tk.length && tk[k] !== ']') k++; i = k; }
            continue;
          }
          if (!e && t === '&') { rows[rows.length - 1].push(cell); cell = ''; continue; }
          e += depth(t);
          cell += t;
        }
        rows[rows.length - 1].push(cell);
        for (const c of rows) {
          if (!c.join('').trim()) continue;
          if (c.length > 2) { for (let k = 0; k < c.length; k += 2) { const p = (c[k] + ' ' + (c[k + 1] || '')).replace(LEAD, '').trim(); if (p) out.push(p); } continue; }
          const go = c.length === 2 && !c[0].trim() ? c[1].replace(LEAD, '').trim() : null;
          if (go && BIN.test(go) && out.length) out[out.length - 1] += ' ' + go;
          else out.push(go && REL.test(go) ? '\\quad ' + go : c.join(' ').trim());
        }
        while (i < tk.length && LEAD.test(tk[i])) i++;
      }
      if (pre.trim()) out.push(pre.trim());
      return out.map(line => {
        let s = '', b = 0, e = 0;
        for (const t of toks(line)) {
          if (t === '(' || t === '[') b++; else if (t === ')' || t === ']') b--; else e += depth(t);
          s += t + (t === ',' && !b && !e ? '\\allowbreak ' : '');
        }
        return s;
      });
    }
    // a little room above and below each unbreakable piece, so that tall fractions on wrapped lines do not touch
    const flow = tex => lines(tex).map(l => '<span class="lk-wrap">' + K.kx('\\displaystyle ' + l, false).replace(/<span class="base">/g, '<span class="base" style="margin: .15em 0">') + '</span>').join('');
    return {
      flow,
      flowSteps: list => h('ol', { class: 'lk-steps' }, list.map(x => h('li', {}, x.text ? h('div', { class: 'lk-step-t', html: K.rich(x.text) }) : null, x.tex ? h('div', { class: 'lk-step-m', html: flow(x.tex) }) : null))),
      flowAnswer: (label, tex, note) => h('div', { class: 'lk-answer' }, h('div', { class: 'lk-answer-k', html: K.rich(label) }), h('div', { class: 'lk-answer-v', html: flow(tex) }), note ? h('div', { class: 'lk-answer-n', html: K.rich(note) }) : null),
    };
  })();
  const Z = F(0), ONE = F(1);
  const MAXLEN = 14;

  /* ------------------------------------------------------------------ styles (added once) */
  const CSS = `
.mx-out > * { min-width: 0; }
.mx-out .lk-note { overflow-x: auto; }
.mx-ed { display: grid; gap: 10px; }
.mx-grid { display: grid; gap: 6px; align-items: center; }
.mx-grid .mx-in { min-width: 0; width: 100%; height: 44px; min-height: 44px; padding: 0 4px; text-align: center; font-variant-numeric: tabular-nums; }
.mx-rl { font-size: 14px; color: var(--ink-3); padding-right: 2px; white-space: nowrap; }
.mx-bar { align-self: stretch; width: 2px; border-radius: 1px; background: var(--ink-4); }
.mx-try { display: flex; flex-wrap: wrap; gap: 6px; }
.mx-try .lk-chip { min-height: 40px; line-height: 1.25; padding: 6px 12px; text-align: left; color: var(--ink-2); }
.mx-try .lk-chip.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.mx-more { margin: .5em 0 0; border-top: 1px solid var(--line); }
.mx-more > summary { display: flex; align-items: center; min-height: 44px; cursor: pointer; font-weight: 650; color: var(--accent-ink); }
.mx-ok { color: var(--good); font-weight: 700; }
.mx-no { color: var(--bad); font-weight: 700; }
.mx-plot { max-width: 440px; }
.mx-plot .gl { stroke: var(--line); stroke-width: 1; }
.mx-plot .ax { stroke: var(--ink-4); stroke-width: 1.4; }
.mx-plot .tk { fill: var(--ink-3); font: 11px var(--font); }
.mx-plot .ln { fill: none; stroke-width: 2.6; stroke-linecap: round; }
.mx-plot .ln.dash { stroke-width: 1.6; stroke-dasharray: 5 4; }
.mx-plot .lb { font: 650 13px var(--font); paint-order: stroke; stroke: var(--bg-elev); stroke-width: 3.5px; stroke-linejoin: round; }
.mx-plot .s1 { stroke: var(--x); } .mx-plot .f1 { fill: var(--x); }
.mx-plot .s2 { stroke: var(--y); } .mx-plot .f2 { fill: var(--y); }
.mx-plot .s3 { stroke: var(--z); } .mx-plot .f3 { fill: var(--z); }
.mx-plot .s4 { stroke: var(--pick); } .mx-plot .f4 { fill: var(--pick); }
.mx-plot .s5 { stroke: var(--ink-3); } .mx-plot .f5 { fill: var(--ink-3); }
.mx-plot .p4 { fill: color-mix(in srgb, var(--pick) 16%, transparent); stroke: var(--pick); stroke-width: 1.6; }
.mx-plot .p5 { fill: color-mix(in srgb, var(--ink-4) 12%, transparent); stroke: var(--ink-4); stroke-width: 1.4; stroke-dasharray: 4 3; }
`;
  if (!document.getElementById('mx-css')) document.head.append(h('style', { id: 'mx-css', text: CSS }));

  /* ------------------------------------------------------------------ small helpers */
  const safe = s => REV.esc(String(s)).replace(/\$/g, '&#36;');
  const range = (a, b) => { const r = []; for (let k = a; k <= b; k++) r.push(k); return r; };
  const and = a => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  const norm = x => String(x == null ? '' : x).replace(/\s+/g, '');
  const babs = x => (x < 0n ? -x : x);
  const bgcd = (a, b) => { a = babs(a); b = babs(b); while (b) [a, b] = [b, a % b]; return a; };
  const blcm = (a, b) => (a / bgcd(a, b)) * b;

  /* ------------------------------------------------------------------ reading matrices from the link and the boxes */
  /** "1,2;3,4" → [['1','2'],['3','4']] (no number checks) */
  const cellsOf = str => String(str == null ? '' : str).split(/[;\n]/).map(r => r.trim()).filter(Boolean).map(r => r.split(/[,\s]+/).filter(Boolean));
  const strOf = cells => cells.map(r => r.join(',')).join(';');
  function num(x) {
    const s = String(x).trim();
    if (s.length > MAXLEN) throw new Error('too long');
    return F.parse(s);
  }
  /** { M } or { err } with a message that never repeats what was typed */
  function readMat(str, name, { maxR = 4, maxC = 4, square = false } = {}) {
    const cells = cellsOf(str);
    if (!cells.length) return { err: name + ' is empty: type its entries.' };
    const c = cells[0].length;
    if (cells.some(r => r.length !== c)) return { err: 'Every row of ' + name + ' needs the same number of entries.' };
    if (cells.length > maxR || c > maxC) return { err: name + ' can have at most ' + maxR + ' rows and ' + maxC + ' columns here.' };
    if (square && cells.length !== c) return { err: name + ' must be square: as many rows as columns.' };
    try { return { M: cells.map(r => r.map(num)) }; }
    catch (e) { return { err: 'An entry of ' + name + ' is not a number: write 3, -2/3 or 0.5 (at most ' + MAXLEN + ' characters).' }; }
  }
  const readVecs = (str, name, maxR, maxC) => readMat(str, name, { maxR, maxC });

  /* ------------------------------------------------------------------ TeX */
  const tf = x => T(x).replace(/\\frac/g, '\\tfrac');
  /** a factor in a product: negatives in brackets */
  const P = x => (F(x).cmp(0) < 0 ? '(' + T(x) + ')' : T(x));
  /** signed terms written as a sum: 60 + 32 - 22 */
  const sumTex = a => a.map((x, i) => (i === 0 ? T(x) : x.cmp(0) < 0 ? ' - ' + T(x.neg()) : ' + ' + T(x))).join('');
  const xs = (n, s = 'x') => range(1, n).map(j => s + '_{' + j + '}');
  /** 3x_1 - x_2 + \tfrac12 x_3 ("0" when every coefficient is 0) */
  function lin(cs, names) {
    let out = '';
    cs.forEach((a, j) => {
      a = F(a);
      if (a.isZero()) return;
      const neg = a.cmp(0) < 0, m = neg ? a.neg() : a;
      out += (out ? (neg ? ' - ' : ' + ') : neg ? '-' : '') + (m.eq(1) ? '' : tf(m)) + names[j];
    });
    return out || '0';
  }
  /** colours inside KaTeX: a sentinel colour, swapped for the theme colour after rendering (paint) */
  const SENT = { pick: '#010203', accent: '#010204', good: '#010205', bad: '#010206', dim: '#010207', x: '#010208', y: '#010209', z: '#01020a' };
  const PAINT = { 'rgb(1, 2, 3)': 'var(--pick)', 'rgb(1, 2, 4)': 'var(--accent)', 'rgb(1, 2, 5)': 'var(--good)', 'rgb(1, 2, 6)': 'var(--bad)', 'rgb(1, 2, 7)': 'var(--ink-4)', 'rgb(1, 2, 8)': 'var(--x)', 'rgb(1, 2, 9)': 'var(--y)', 'rgb(1, 2, 10)': 'var(--z)' };
  const RAINBOW = ['x', 'y', 'z', 'pick'];
  const col = (c, s) => (c ? '\\textcolor{' + SENT[c] + '}{' + s + '}' : s);
  function paint(root) { root.querySelectorAll('.katex [style*="color"]').forEach(e => { const v = PAINT[e.style.color]; if (v) e.style.color = v; }); }
  /** a matrix in TeX. o: aug (columns after the bar), box (Set "i,j" of leading 1s), rows/cols/cells (Map → colour),
      dimR/dimC (Sets of rows/columns to grey out), fmt (entry → TeX) */
  /** an entry inside a matrix: fractions at full size (\dfrac), so they stay readable on a phone */
  const mT = x => (x.isInt() ? T(x) : T(x).replace('\\frac', '\\dfrac'));
  function mtex(M, o = {}) {
    const n = M[0].length;
    const body = M.map((r, i) => r.map((x, j) => {
      let s = (o.fmt || mT)(x);
      if (o.box && o.box.has(i + ',' + j)) s = '\\boxed{' + s + '}';
      const c = (o.cells && o.cells.get(i + ',' + j)) || (o.rows && o.rows.get(i)) || (o.cols && o.cols.get(j)) ||
        ((o.dimR && o.dimR.has(i)) || (o.dimC && o.dimC.has(j)) ? 'dim' : null);
      return col(c, s);
    }).join(' & ')).join(' \\\\ ');
    if (o.aug) return '\\left[\\begin{array}{' + 'c'.repeat(n - o.aug) + '|' + 'c'.repeat(o.aug) + '}' + body + '\\end{array}\\right]';
    return '\\begin{bmatrix}' + body + '\\end{bmatrix}';
  }
  const vcol = (v, o) => mtex(v.map(x => [x]), o);
  const vcolT = list => '\\begin{bmatrix}' + list.join(' \\\\ ') + '\\end{bmatrix}';
  /** a vector as a row: (1,\ 2 \mid 3) with a bar before the last aug entries */
  const tup = (v, aug = 0) => '(' + v.map((x, i) => (i === 0 ? '' : aug && i === v.length - aug ? ' \\mid ' : ',\\ ') + tf(x)).join('') + ')';
  /** a fraction as a float, also when its numerator and denominator are beyond float range */
  const fnum = x => { const q = Number(x.n) / Number(x.d); return isFinite(q) ? q : Number((x.n * 10n ** 18n) / x.d) / 1e18; };
  const dec = x => (x.isInt() ? T(x) : String(+fnum(x).toFixed(4)));
  const allExact = M => M.every(r => r.every(x => x.isInt() || x.exactDecimal(4)));
  const fracIn = M => M.some(r => r.some(x => !x.isInt()));
  /** "lhs = M" for an answer, with the decimals on a second line when some entries are fractions */
  const ansEq = (lhs, M) => (fracIn(M) ? '\\begin{aligned}' + lhs + ' &= ' + mtex(M) + ' \\\\[4pt] &' + (allExact(M) ? '=' : '\\approx') + ' ' + mtex(M, { fmt: dec }) + '\\end{aligned}' : lhs + ' = ' + mtex(M));
  const vAns = v => tup(v) + (fracIn([v]) ? (allExact([v]) ? ' = ' : ' \\approx ') + '(' + v.map(dec).join(',\\ ') + ')' : '');
  const size = M => M.length + '\\times ' + M[0].length;
  const R = i => 'R_{' + (i + 1) + '}';

  /* ------------------------------------------------------------------ matrix arithmetic (exact) */
  const clone = M => M.map(r => r.slice());
  const ident = n => range(0, n - 1).map(i => range(0, n - 1).map(j => (i === j ? ONE : Z)));
  const tr = M => M[0].map((_, j) => M.map(r => r[j]));
  const mul = (A, B) => A.map(r => B[0].map((_, j) => r.reduce((s, a, k) => s.add(a.mul(B[k][j])), Z)));
  const madd = (A, B) => A.map((r, i) => r.map((a, j) => a.add(B[i][j])));
  const msub = (A, B) => A.map((r, i) => r.map((a, j) => a.sub(B[i][j])));
  const mscale = (c, A) => A.map(r => r.map(a => a.mul(c)));
  const dot = (u, v) => u.reduce((s, a, i) => s.add(a.mul(v[i])), Z);
  const vadd = (u, v) => u.map((a, i) => a.add(v[i]));
  const vsub = (u, v) => u.map((a, i) => a.sub(v[i]));
  const vsc = (c, u) => u.map(a => a.mul(c));
  const isZeroV = v => v.every(x => x.isZero());
  const eqM = (A, B) => A.length === B.length && A.every((r, i) => r.length === B[i].length && r.every((x, j) => x.eq(B[i][j])));
  const minorOf = (M, i, j) => M.filter((_, r) => r !== i).map(row => row.filter((_, c) => c !== j));
  function det(M) {
    const n = M.length;
    if (n === 1) return M[0][0];
    if (n === 2) return M[0][0].mul(M[1][1]).sub(M[0][1].mul(M[1][0]));
    let s = Z;
    for (let j = 0; j < n; j++) if (!M[0][j].isZero()) { const t = M[0][j].mul(det(minorOf(M, 0, j))); s = j % 2 ? s.sub(t) : s.add(t); }
    return s;
  }
  const num2 = v => [fnum(v[0]), fnum(v[1])];

  /* ------------------------------------------------------------------ determinants written out */
  const dedupe = a => a.filter((x, i) => i === 0 || x !== a[i - 1]);
  /** ways of writing det M (1 × 1 to 3 × 3), each equal to the next; the last is the value */
  function detParts(M) {
    const n = M.length;
    if (n === 1) return [T(M[0][0])];
    if (n === 2) {
      const [[a, b], [c, d]] = M, ad = a.mul(d), bc = b.mul(c);
      return dedupe([P(a) + '\\cdot ' + P(d) + ' - ' + P(b) + '\\cdot ' + P(c), T(ad) + ' - ' + P(bc), T(ad.sub(bc))]);
    }
    const [[a, b, c], [d, e, f], [g, k, l]] = M;
    const m1 = e.mul(l).sub(f.mul(k)), m2 = d.mul(l).sub(f.mul(g)), m3 = d.mul(k).sub(e.mul(g));
    const two = (p, q, r, s) => P(p) + '\\cdot ' + P(q) + ' - ' + P(r) + '\\cdot ' + P(s);
    const t1 = a.mul(m1), t2 = b.mul(m2).neg(), t3 = c.mul(m3);
    // the first form is long: one term per line (always used inside an aligned block)
    return dedupe([P(a) + '(' + two(e, l, f, k) + ') \\\\ &\\qquad - ' + P(b) + '(' + two(d, l, f, g) + ') \\\\ &\\qquad + ' + P(c) + '(' + two(d, k, e, g) + ')',
      P(a) + '\\cdot ' + P(m1) + ' - ' + P(b) + '\\cdot ' + P(m2) + ' + ' + P(c) + '\\cdot ' + P(m3),
      sumTex([t1, t2, t3]), T(t1.add(t2).add(t3))]);
  }
  /** lhs = p1 = p2 … on one line, or one "= p" per line */
  function chain(lhs, parts, multi) {
    parts = dedupe(parts);
    if (!multi) return lhs + ' = ' + parts.join(' = ');
    return '\\begin{aligned}' + lhs + ' &= ' + parts.join(' \\\\ &= ') + '\\end{aligned}';
  }
  /** cofactor expansion along row or column k (0-based): every entry, sign, minor and term */
  function expansion(M, along, k) {
    const n = M.length, terms = [];
    for (let q = 0; q < n; q++) {
      const i = along === 'row' ? k : q, j = along === 'row' ? q : k;
      const a = M[i][j], sign = (i + j) % 2 ? -1 : 1, minor = minorOf(M, i, j);
      const md = a.isZero() ? null : det(minor);
      terms.push({ i, j, a, sign, minor, md, term: a.isZero() ? Z : a.mul(md).mul(sign) });
    }
    return { terms, value: terms.reduce((s, t) => s.add(t.term), Z) };
  }
  const signs = (n, along, k) => '\\begin{bmatrix}' + range(0, n - 1).map(i => range(0, n - 1).map(j => {
    const s = (i + j) % 2 ? '-' : '+';
    return (along === 'row' ? i === k : j === k) ? col('pick', s) : s;
  }).join(' & ')).join(' \\\\ ') + '\\end{bmatrix}';
  /** the expansion as steps, each minor worked out (n ≥ 2) */
  function expansionSteps(M, along, k, name, intro) {
    const n = M.length, { terms, value } = expansion(M, along, k), f = k + 1;
    const gen = along === 'row'
      ? '\\det ' + name + ' = \\sum_{j=1}^{' + n + '} (-1)^{' + f + '+j}\\, a_{' + f + 'j}\\, M_{' + f + 'j}'
      : '\\det ' + name + ' = \\sum_{i=1}^{' + n + '} (-1)^{i+' + f + '}\\, a_{i' + f + '}\\, M_{i' + f + '}';
    const steps = [{
      text: (intro || 'Go along ' + (along === 'row' ? 'row' : 'column') + ' $' + f + '$.') + ' Each entry is multiplied by its sign $(-1)^{i+j}$ (a checkerboard of $+$ and $-$) and by its <b>minor</b> $M_{ij}$: the determinant of the smaller matrix left after deleting the entry\'s row and column.',
      tex: '\\begin{aligned}&' + gen + ' \\\\[6pt] &\\text{signs } (-1)^{i+j}:\\ ' + signs(n, along, k) + '\\end{aligned}',
    }];
    terms.forEach(t => {
      const sub = (t.i + 1) + '' + (t.j + 1), sg = t.sign > 0 ? '+1' : '-1', pw = '(-1)^{' + (t.i + 1) + '+' + (t.j + 1) + '}';
      if (t.a.isZero()) { steps.push({ text: 'Entry $a_{' + sub + '} = 0$, so its term is $0$ whatever its minor is: no need to work the minor out.', tex: pw + '\\cdot 0\\cdot M_{' + sub + '} = 0' }); return; }
      const pic = mtex(M, { dimR: new Set([t.i]), dimC: new Set([t.j]), cells: new Map([[t.i + ',' + t.j, 'pick']]) });
      const mp = detParts(t.minor);
      steps.push({
        text: 'Entry $a_{' + sub + '} = ' + T(t.a) + '$ with sign $' + pw + ' = ' + sg + '$. Delete row $' + (t.i + 1) + '$ and column $' + (t.j + 1) + '$ (greyed); what is left gives the minor $M_{' + sub + '}$.',
        tex: '\\begin{aligned}&' + pic + ' \\\\ M_{' + sub + '} &= \\det' + mtex(t.minor) + (t.minor.length === 1 ? ' = ' + mp[0] : t.minor.length === 2 ? ' \\\\ &= ' + mp[0] + (mp.length > 1 ? ' \\\\ &= ' + mp.slice(1).join(' = ') : '') : ' \\\\ &= ' + mp.join(' \\\\ &= ')) +
          ' \\\\[4pt] \\text{term} &= ' + pw + 'a_{' + sub + '}M_{' + sub + '} \\\\ &= (' + sg + ')\\cdot ' + P(t.a) + '\\cdot ' + P(t.md) + ' = ' + T(t.term) + '\\end{aligned}',
      });
    });
    steps.push({ text: 'Add the ' + n + ' terms:', tex: '\\det ' + name + ' = ' + sumTex(terms.map(t => t.term)) + ' = ' + T(value) });
    return { steps, value, terms };
  }
  /** det M worked out in full: one step up to 3 × 3, a cofactor expansion along the row or column with most zeros for 4 × 4 */
  function detWork(M, name) {
    const n = M.length;
    if (n <= 3) {
      const text = n === 1 ? 'A $1\\times 1$ determinant is the entry itself.' : n === 2 ? 'For a $2\\times 2$ matrix, $\\det = ad - bc$:' : 'Expand along row $1$: each entry times the $2\\times 2$ determinant left after deleting its row and column, with signs $+,\\ -,\\ +$:';
      return { steps: [{ text, tex: chain('\\det ' + name, (n === 1 ? [] : ['\\det' + mtex(M)]).concat(detParts(M)), n === 3) }], value: det(M) };
    }
    let best = { along: 'row', k: 0, z: -1 };
    for (let q = 0; q < n; q++) {
      const zr = M[q].filter(x => x.isZero()).length, zc = M.filter(r => r[q].isZero()).length;
      if (zr > best.z) best = { along: 'row', k: q, z: zr };
      if (zc > best.z) best = { along: 'col', k: q, z: zc };
    }
    return expansionSteps(M, best.along, best.k, name, 'Expand along ' + (best.along === 'row' ? 'row' : 'column') + ' $' + (best.k + 1) + '$' + (best.z > 0 ? ', the one with the most zeros.' : '.'));
  }

  /* ------------------------------------------------------------------ row reduction (lecture 2.5) */
  function applyOp(M, kind, i, j, t) {
    const N = clone(M);
    if (kind === 'swap') { N[i] = M[j]; N[j] = M[i]; }
    else if (kind === 'scale') N[i] = M[i].map(x => x.mul(t));
    else N[i] = M[i].map((x, c) => x.add(M[j][c].mul(t)));
    return N;
  }
  /** The lecture's method: the leftmost non-zero column, a 1 at its top (swap if needed, then scale), zeros below;
      repeat below that row. With full, then zeros above every leading 1, starting from the rightmost one.
      cols = how many columns may hold a leading 1 (the A part of [A | b] or [A | I]). */
  function reduce(M0, cols, full) {
    let M = clone(M0);
    const m = M.length, ops = [], piv = [];
    const rec = (kind, i, j, t, phase, c) => { const before = M; M = applyOp(M, kind, i, j, t); ops.push({ kind, i, j, t, phase, c, before, after: M, piv: piv.slice() }); };
    let r = 0;
    for (let c = 0; c < cols && r < m; c++) {
      let p = -1;
      for (let i = r; i < m; i++) if (!M[i][c].isZero()) { p = i; break; }
      if (p < 0) continue;
      if (p !== r) rec('swap', r, p, null, 'down', c);
      piv.push([r, c]);
      if (!M[r][c].eq(1)) rec('scale', r, null, ONE.div(M[r][c]), 'down', c);
      for (let i = r + 1; i < m; i++) if (!M[i][c].isZero()) rec('add', i, r, M[i][c].neg(), 'down', c);
      r++;
    }
    const ref = M, nDown = ops.length;
    if (full) for (let q = piv.length - 1; q >= 0; q--) {
      const [pr, pc] = piv[q];
      for (let i = pr - 1; i >= 0; i--) if (!M[i][pc].isZero()) rec('add', i, pr, M[i][pc].neg(), 'up', pc);
    }
    return { ops, down: ops.slice(0, nDown), up: ops.slice(nDown), ref, rref: M, piv };
  }
  const coefTex = t => (t.eq(-1) ? '-' : tf(t));
  function opTex(o) {
    if (o.kind === 'swap') return R(o.i) + ' \\leftrightarrow ' + R(o.j);
    if (o.kind === 'scale') return R(o.i) + ' \\to ' + coefTex(o.t) + R(o.i);
    const neg = o.t.cmp(0) < 0, a = neg ? o.t.neg() : o.t;
    return R(o.i) + ' \\to ' + R(o.i) + (neg ? ' - ' : ' + ') + (a.eq(1) ? '' : tf(a)) + R(o.j);
  }
  /** the arithmetic on the changed row: [what is worked out, its result] */
  function opCalc(o, aug) {
    if (o.kind === 'swap') return null;
    if (o.kind === 'scale') return [coefTex(o.t) + tup(o.before[o.i], aug), tup(o.after[o.i], aug)];
    const neg = o.t.cmp(0) < 0, a = neg ? o.t.neg() : o.t;
    return [tup(o.before[o.i], aug) + (neg ? ' - ' : ' + ') + (a.eq(1) ? '' : tf(a)) + tup(o.before[o.j], aug), tup(o.after[o.i], aug)];
  }
  const rowW = i => 'row $' + (i + 1) + '$';
  function opWords(o) {
    const c = o.c + 1;
    if (o.kind === 'swap') return 'Column $' + c + '$ has $0$ in ' + rowW(o.i) + ', so swap ' + rowW(o.i) + ' with ' + rowW(o.j) + ', the first row below it with a non-zero entry in that column.';
    if (o.kind === 'scale') {
      const lead = o.before[o.i][o.c];
      return 'Make the leading entry of ' + rowW(o.i) + ' equal to $1$: ' + (lead.isInt() && !lead.eq(-1) ? 'divide the row by $' + T(lead) + '$' : 'multiply the row by $' + T(o.t) + '$') + '.';
    }
    const x = o.before[o.i][o.c], a = x.cmp(0) < 0 ? x.neg() : x, times = a.eq(1) ? '' : '$' + T(a) + '$ times ';
    return 'Clear the $' + T(x) + '$ ' + (o.phase === 'down' ? 'below' : 'above') + ' the leading $1$ of ' + rowW(o.j) + ' (column $' + c + '$): ' +
      (x.cmp(0) > 0 ? 'subtract ' + times + rowW(o.j) + ' from ' : 'add ' + times + rowW(o.j) + ' to ') + rowW(o.i) + '.';
  }
  /** one row operation as a step: words, the arithmetic on the changed row, the matrix after it (changed rows coloured, leading 1s boxed) */
  function opStep(o, aug = 0) {
    const box = new Set(o.piv.map(([r, c]) => r + ',' + c));
    const rows = new Map([[o.i, 'pick']]);
    if (o.kind === 'swap') rows.set(o.j, 'pick');
    const calc = opCalc(o, aug);
    // short lines for a phone: the operation, the row arithmetic, its result, then the matrix after it
    return { text: opWords(o), tex: '\\begin{aligned}&' + opTex(o) + (calc ? ': \\\\ &\\quad ' + calc[0] + ' \\\\ &\\quad = ' + calc[1] : '') + ' \\\\[6pt] &' + mtex(o.after, { aug, box, rows }) + '\\end{aligned}' };
  }
  const boxOf = piv => new Set(piv.map(([r, c]) => r + ',' + c));
  /** the four rules of the echelon forms (lecture 2.4), checked on M */
  function echelonRules(M) {
    const lead = M.map(r => r.findIndex(x => !x.isZero()));
    const out = [];
    const b1 = lead.findIndex((c, i) => c >= 0 && !M[i][c].eq(1));
    out.push({ name: 'The first non-zero entry of each non-zero row (its leading entry) is $1$.', ok: b1 < 0, why: b1 < 0 ? '' : 'Row $' + (b1 + 1) + '$ starts with $' + T(M[b1][lead[b1]]) + '$, not $1$.' });
    let why2 = '', last = -1, lastRow = -1;
    lead.forEach((c, i) => {
      if (why2 || c < 0) return;
      if (lastRow >= 0 && c <= last) why2 = 'The leading entry of row $' + (i + 1) + '$ (column $' + (c + 1) + '$) is not to the right of the one in row $' + (lastRow + 1) + '$ (column $' + (last + 1) + '$).';
      last = c; lastRow = i;
    });
    out.push({ name: 'Each leading entry is in a column to the right of the leading entry of the row above.', ok: !why2, why: why2 });
    const z = lead.findIndex((c, i) => c < 0 && lead.slice(i + 1).some(x => x >= 0));
    out.push({ name: 'Rows of zeros, if any, are at the bottom.', ok: z < 0, why: z < 0 ? '' : 'Row $' + (z + 1) + '$ is all zeros but a non-zero row comes after it.' });
    let why4 = '';
    lead.forEach((c, i) => {
      if (why4 || c < 0) return;
      const k = M.findIndex((r, q) => q !== i && !r[c].isZero());
      if (k >= 0) why4 = 'Column $' + (c + 1) + '$ holds the leading entry of row $' + (i + 1) + '$ but also $' + T(M[k][c]) + '$ in row $' + (k + 1) + '$.';
    });
    out.push({ name: 'Reduced form only: each leading $1$ is the only non-zero entry in its column.', ok: !why4, why: why4 });
    return out;
  }
  const mark = ok => (ok ? '<span class="mx-ok">✓ yes</span>' : '<span class="mx-no">✗ no</span>');

  /* ------------------------------------------------------------------ solving from an echelon form */
  const affScale = (e, t) => ({ c: e.c.mul(t), k: e.k.map(x => x.mul(t)) });
  const affSub = (a, b) => ({ c: a.c.sub(b.c), k: a.k.map((x, i) => x.sub(b.k[i])) });
  const affNum = e => e.k.every(x => x.isZero());
  function affTex(e, pn) {
    const t = lin(e.k, pn);
    if (t === '0') return T(e.c);
    if (e.c.isZero()) return t;
    return T(e.c) + (t.startsWith('-') ? ' - ' + t.slice(1) : ' + ' + t);
  }
  const affPar = (e, pn) => {
    if (affNum(e)) return P(e.c);
    const one = e.c.isZero() && e.k.filter(x => !x.isZero()).length === 1 && e.k.every(x => x.cmp(0) >= 0);
    return one ? affTex(e, pn) : '(' + affTex(e, pn) + ')';
  };
  /** Back substitution on an echelon form R of [A | b] (n unknowns, leading 1s at piv), from the last row up.
      → { kind: 'none'|'unique'|'many', bad, free, pn, val (one affine expression per unknown), steps } */
  function backSub(Rm, n, piv, names) {
    const bad = Rm.findIndex(r => r.slice(0, n).every(x => x.isZero()) && !r[n].isZero());
    if (bad >= 0) return { kind: 'none', bad };
    const pc = piv.map(([, c]) => c), free = range(0, n - 1).filter(j => !pc.includes(j));
    const pn = free.length === 1 ? ['t'] : free.map((_, q) => 't_{' + (q + 1) + '}');
    const val = Array(n).fill(null), steps = [];
    free.forEach((j, q) => { val[j] = { c: Z, k: free.map((_, w) => (w === q ? ONE : Z)) }; });
    if (free.length) steps.push({
      text: (free.length === 1 ? 'Column $' + (free[0] + 1) + '$ has' : 'Columns ' + and(free.map(j => '$' + (j + 1) + '$')) + ' have') + ' no leading $1$, so ' + and(free.map(j => '$' + names[j] + '$')) +
        (free.length === 1 ? ' is a <b>free</b> (independent) variable: it can take any value $t$.' : ' are <b>free</b> (independent) variables: each can take any value.') + ' The unknowns with a leading $1$ are the dependent variables.',
      tex: free.map((j, q) => names[j] + ' = ' + pn[q]).join(',\\qquad '),
    });
    for (let q = piv.length - 1; q >= 0; q--) {
      const [r, c] = piv[q];
      const others = range(c + 1, n - 1).filter(j => !Rm[r][j].isZero());
      let e = { c: Rm[r][n], k: free.map(() => Z) };
      others.forEach(j => { e = affSub(e, affScale(val[j], Rm[r][j])); });
      val[c] = e;
      const eq = lin(Rm[r].slice(0, n), names) + ' = ' + T(Rm[r][n]);
      let tex;
      if (others.length) {
        const cst = Rm[r][n];
        /** the right-hand side after moving the other unknowns across: "5 - 2x_4", "-x_3", "1 + \tfrac12 x_2" */
        const move = fmt => {
          let out = cst.isZero() ? '' : T(cst);
          others.forEach(j => { const a = Rm[r][j], neg = a.cmp(0) < 0, m = neg ? a.neg() : a; out += (out ? (neg ? ' + ' : ' - ') : neg ? '' : '-') + fmt(m, j); });
          return out;
        };
        const sym = move((m, j) => (m.eq(1) ? '' : tf(m)) + names[j]);
        const bare = others.every(j => val[j].c.isZero() && val[j].k.filter(x => !x.isZero()).length === 1 && val[j].k.some(x => x.eq(1)));
        const put = move((m, j) => (m.eq(1) ? '' : T(m) + '\\cdot ') + affPar(val[j], pn));
        // one chain, so that it wraps after "=" on a narrow phone (labkit kxWrap)
        tex = eq + '\\;\\Rightarrow\\; ' + names[c] + ' = ' + dedupe([sym, ...(bare ? [] : [put]), affTex(e, pn)]).join(' = ');
      } else tex = eq;
      steps.push({ text: 'Row $' + (r + 1) + '$ says ' + (others.length ? '' : 'directly ') + 'what $' + names[c] + '$ is' + (others.length ? ': move the other unknowns to the right and put in their values.' : '.'), tex });
    }
    return { kind: free.length ? 'many' : 'unique', free, pn, val, steps };
  }
  /** the general solution p + t1 d1 + … as TeX, and its pieces */
  function general(sol, n) {
    const p = sol.val.map(e => e.c), dirs = sol.free.map((_, q) => sol.val.map(e => e.k[q]));
    const vec = vcolT(sol.val.map(e => affTex(e, sol.pn)));
    const split = (isZeroV(p) ? '' : vcol(p)) + dirs.map((d, q) => (q || !isZeroV(p) ? ' + ' : '') + sol.pn[q] + vcol(d)).join('');
    return { p, dirs, tex: vec + (dirs.length ? ' = ' + split : '') };
  }

  /* ------------------------------------------------------------------ square roots */
  /** √x (x ≥ 0) as k·√r with r a square-free whole number */
  /** the whole square root of a BigInt (Newton's method from above: a few dozen steps even for 300-digit numbers) */
  const isqrt = n => {
    if (n < 2n) return n;
    let x = 1n << BigInt((n.toString(2).length >> 1) + 1);
    for (;;) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
  };
  function surd(x) {
    x = F(x);
    let p = x.n * x.d, out = 1n;
    const lim = p < 10n ** 24n ? 20000n : 1000n;   // square factors are only looked for up to this (beyond it the root is still right, just less simplified)
    for (let q = 2n; q * q <= p && q < lim; q++) { const qq = q * q; while (p % qq === 0n) { p /= qq; out *= q; } }
    const s = isqrt(p);
    if (s * s === p) { out *= s; p = 1n; }
    return { k: F(out, x.d), r: p };
  }
  function surdTex({ k, r }) {
    if (r === 1n || k.isZero()) return T(k);
    const neg = k.cmp(0) < 0, a = neg ? k.neg() : k, root = '\\sqrt{' + r + '}';
    const s = a.isInt() ? (a.eq(1) ? '' : T(a)) + root : '\\frac{' + (a.n === 1n ? '' : String(a.n)) + root + '}{' + a.d + '}';
    return (neg ? '-' : '') + s;
  }
  const surdNum = ({ k, r }) => fnum(k) * Math.sqrt(Number(r));
  const r4 = x => String(+x.toFixed(4));
  /** "\sqrt{10} \approx 3.1623", "5" */
  const rootTex = x => {
    const s = surd(x), first = '\\sqrt{' + T(x) + '}';
    if (s.r === 1n) return first + ' = ' + TD(s.k);
    return dedupe([first, surdTex(s)]).join(' = ') + ' \\approx ' + r4(surdNum(s));
  };
  /** x² with brackets when x is negative or a fraction */
  const sqT = x => (x.isInt() && x.cmp(0) >= 0 ? T(x) : '\\left(' + T(x) + '\\right)') + '^2';

  /* ------------------------------------------------------------------ drawings in the plane */
  const niceStep = x => { const p = 10 ** Math.floor(Math.log10(x)); const f = x / p; return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p; };
  /** o: vecs [{ from, to, c, label, dash }], polys [{ pts, c }], lines [{ a, b, c (ax + by = c), k, label }], dots [{ at, c, label }],
      arc { a0, a1, r }, extra (points to keep in view). Colours c: 1 blue, 2 orange, 3 teal, 4 purple, 5 grey. */
  function plot(o) {
    const W = 360, H = 290, PAD = 24, r2 = v => Math.round(v * 100) / 100;
    const pts = [[0, 0]];
    (o.vecs || []).forEach(v => { pts.push(v.to); if (v.from) pts.push(v.from); });
    (o.polys || []).forEach(p => pts.push(...p.pts));
    (o.dots || []).forEach(p => pts.push(p.at));
    (o.extra || []).forEach(p => pts.push(p));
    const good = pts.filter(p => isFinite(p[0]) && isFinite(p[1]));
    let x0 = Math.min(...good.map(p => p[0])), x1 = Math.max(...good.map(p => p[0])), y0 = Math.min(...good.map(p => p[1])), y1 = Math.max(...good.map(p => p[1]));
    const big = Math.max(x1 - x0, y1 - y0, 2), grow = (a, b) => (b - a < big * 0.4 ? [(a + b) / 2 - big * 0.2, (a + b) / 2 + big * 0.2] : [a, b]);
    [x0, x1] = grow(x0, x1); [y0, y1] = grow(y0, y1);
    const mx = (x1 - x0) * 0.12, my = (y1 - y0) * 0.12;
    x0 -= mx; x1 += mx; y0 -= my; y1 += my;
    const sc = Math.min((W - 2 * PAD) / (x1 - x0), (H - 2 * PAD) / (y1 - y0)), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const X = x => r2(W / 2 + (x - cx) * sc), Y = y => r2(H / 2 - (y - cy) * sc);
    const vx0 = cx - W / 2 / sc, vx1 = cx + W / 2 / sc, vy0 = cy - H / 2 / sc, vy1 = cy + H / 2 / sc;
    const svg = K.sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart mx-plot', role: 'img', 'aria-label': o.label || 'drawing in the plane' });
    const step = niceStep((vx1 - vx0) / 9), fmt = v => String(+v.toFixed(6));
    for (let q = Math.ceil(vx0 / step); q * step <= vx1; q++) svg.append(K.sv('line', { x1: X(q * step), x2: X(q * step), y1: 0, y2: H, class: 'gl' }));
    for (let q = Math.ceil(vy0 / step); q * step <= vy1; q++) svg.append(K.sv('line', { y1: Y(q * step), y2: Y(q * step), x1: 0, x2: W, class: 'gl' }));
    const xAxis = vy0 <= 0 && vy1 >= 0, yAxis = vx0 <= 0 && vx1 >= 0;
    if (xAxis) svg.append(K.sv('line', { x1: 0, x2: W, y1: Y(0), y2: Y(0), class: 'ax' }));
    if (yAxis) svg.append(K.sv('line', { y1: 0, y2: H, x1: X(0), x2: X(0), class: 'ax' }));
    const every = (vx1 - vx0) / step > 12 ? 2 : 1;
    for (let q = Math.ceil(vx0 / step); q * step <= vx1; q++) if (q && q % every === 0) svg.append(K.sv('text', { x: X(q * step), y: xAxis ? Math.min(H - 4, Y(0) + 14) : H - 4, 'text-anchor': 'middle', class: 'tk' }, fmt(q * step)));
    for (let q = Math.ceil(vy0 / step); q * step <= vy1; q++) if (q && q % every === 0) svg.append(K.sv('text', { x: yAxis ? Math.max(4, X(0) - 5) : 4, y: Y(q * step) + 4, 'text-anchor': yAxis ? 'end' : 'start', class: 'tk' }, fmt(q * step)));
    const label = (x, y, text, c) => svg.append(K.sv('text', { x: r2(x), y: r2(y), 'text-anchor': 'middle', 'dominant-baseline': 'middle', class: 'lb f' + c }, text));
    (o.polys || []).forEach(p => svg.append(K.sv('polygon', { points: p.pts.map(q => X(q[0]) + ',' + Y(q[1])).join(' '), class: 'p' + p.c })));
    (o.lines || []).forEach(l => {
      const P2 = [];
      if (Math.abs(l.b) > 1e-12) [vx0, vx1].forEach(x => { const y = (l.c - l.a * x) / l.b; if (y >= vy0 - 1e-9 && y <= vy1 + 1e-9) P2.push([x, y]); });
      if (Math.abs(l.a) > 1e-12) [vy0, vy1].forEach(y => { const x = (l.c - l.b * y) / l.a; if (x >= vx0 - 1e-9 && x <= vx1 + 1e-9) P2.push([x, y]); });
      if (P2.length < 2) return;
      let best = [P2[0], P2[1]], d = -1;
      P2.forEach(a => P2.forEach(b => { const e = Math.hypot(a[0] - b[0], a[1] - b[1]); if (e > d) { d = e; best = [a, b]; } }));
      svg.append(K.sv('line', { x1: X(best[0][0]), y1: Y(best[0][1]), x2: X(best[1][0]), y2: Y(best[1][1]), class: 'ln s' + l.k + (l.dash ? ' dash' : '') }));
      if (l.label) { const [a, b] = best[0][0] < best[1][0] ? best : [best[1], best[0]]; const t = 0.82; label(X(a[0] + (b[0] - a[0]) * t) , Y(a[1] + (b[1] - a[1]) * t) - 11, l.label, l.k); }
    });
    if (o.arc) {
      const { a0, a1, r } = o.arc, ox = X(0), oy = Y(0), pt = a => [r2(ox + r * Math.cos(a)), r2(oy - r * Math.sin(a))];
      const [p0, p1] = [pt(a0), pt(a1)];
      svg.append(K.sv('path', { d: 'M' + p0[0] + ' ' + p0[1] + 'A' + r + ' ' + r + ' 0 ' + (Math.abs(a1 - a0) > Math.PI ? 1 : 0) + ' ' + (a1 > a0 ? 0 : 1) + ' ' + p1[0] + ' ' + p1[1], class: 'ln dash s4' }));
      const am = (a0 + a1) / 2;
      label(ox + (r + 12) * Math.cos(am), oy - (r + 12) * Math.sin(am), 'θ', 4);
    }
    (o.vecs || []).forEach(v => {
      const from = v.from || [0, 0], xa = X(from[0]), ya = Y(from[1]), xb = X(v.to[0]), yb = Y(v.to[1]);
      const L = Math.hypot(xb - xa, yb - ya);
      if (L < 1) { svg.append(K.sv('circle', { cx: xb, cy: yb, r: 3.5, class: 'f' + v.c })); if (v.label) label(xb + 10, yb - 10, v.label, v.c); return; }
      const ux = (xb - xa) / L, uy = (yb - ya) / L, hl = Math.min(11, L * 0.45);
      svg.append(K.sv('line', { x1: xa, y1: ya, x2: r2(xb - ux * hl * 0.7), y2: r2(yb - uy * hl * 0.7), class: 'ln s' + v.c + (v.dash ? ' dash' : '') }));
      if (!v.dash) svg.append(K.sv('path', { d: 'M' + xb + ' ' + yb + 'L' + r2(xb - ux * hl - uy * hl * 0.45) + ' ' + r2(yb - uy * hl + ux * hl * 0.45) + 'L' + r2(xb - ux * hl + uy * hl * 0.45) + ' ' + r2(yb - uy * hl - ux * hl * 0.45) + 'Z', class: 'f' + v.c }));
      if (v.label) label(xb + ux * 13 - uy * 8, yb + uy * 13 + ux * 8, v.label, v.c);
    });
    (o.dots || []).forEach(p => { svg.append(K.sv('circle', { cx: X(p.at[0]), cy: Y(p.at[1]), r: 4.5, class: 'f' + p.c })); if (p.label) label(X(p.at[0]) + 12, Y(p.at[1]) - 12, p.label, p.c); });
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }

  /* ------------------------------------------------------------------ controls */
  const fit = (cells, r, c) => range(0, r - 1).map(i => range(0, c - 1).map(j => (cells[i] && cells[i][j] != null ? cells[i][j] : '0')));
  /** a matrix typed into a grid of boxes, with its size picked above it. value / onChange use the link form "1,2;3,4".
      o: label, value, rows [min, max], cols [min, max], square, aug (one more column after a bar), rowName (i → TeX),
      rowWord, colWord, help, onChange(text, sizeChanged) */
  function matEditor(o) {
    if (o.square || !o.cols) o.cols = o.rows;
    const extra = o.aug ? 1 : 0, clamp = (v, [lo, hi]) => Math.max(lo, Math.min(hi, v));
    let cells = cellsOf(o.value);
    let r = clamp(cells.length || o.rows[0], o.rows), c = clamp(((cells[0] || []).length || o.cols[0] + extra) - extra, o.cols);
    if (o.square) c = r;
    cells = fit(cells, r, c + extra);
    const grid = h('div', { class: 'mx-grid' }), err = h('div', { class: 'lk-err', hidden: true });
    const box = h('div', { class: 'lk-field mx-ed' }, h('div', { class: 'lk-label', html: K.rich(o.label) }));
    const seg = (label, [lo, hi], v, set) => K.seg({ label, options: range(lo, hi).map(k => [k, String(k)]), value: v, onChange: k => { set(+k); cells = fit(cells, r, c + extra); build(); emit(true); } });
    if (o.square) { if (o.rows[0] !== o.rows[1]) box.append(seg(o.rowWord || 'Size', o.rows, r, k => { r = c = k; })); }
    else {
      if (o.rows[0] !== o.rows[1]) box.append(seg(o.rowWord || 'Rows', o.rows, r, k => { r = k; }));
      if (o.cols[0] !== o.cols[1]) box.append(seg(o.colWord || 'Columns', o.cols, c, k => { c = k; }));
    }
    box.append(grid, err);
    if (o.help) box.append(h('div', { class: 'lk-help', html: K.rich(o.help) }));
    function build() {
      grid.innerHTML = '';
      grid.style.gridTemplateColumns = (o.rowName ? 'auto ' : '') + 'repeat(' + c + ', minmax(0, 1fr))' + (o.aug ? ' 2px minmax(0, 1fr)' : '');
      cells.forEach((row, i) => {
        if (o.rowName) grid.append(h('div', { class: 'mx-rl', html: K.kx(o.rowName(i)) }));
        row.forEach((v, j) => {
          if (o.aug && j === c) grid.append(h('div', { class: 'mx-bar', 'aria-hidden': 'true' }));
          const inp = h('input', { class: 'field lk-frac mx-in', type: 'text', value: v, autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'next', 'aria-label': 'row ' + (i + 1) + ', column ' + (j + 1) });
          inp.addEventListener('input', () => { cells[i][j] = inp.value.trim(); emit(false); });
          grid.append(inp);
        });
      });
    }
    function emit(sized) {
      const inputs = grid.querySelectorAll('input');
      let bad = 0, q = 0;
      cells.forEach(row => row.forEach(v => { const inp = inputs[q++]; let ok = true; try { num(v); } catch (e) { ok = false; } inp.classList.toggle('bad', !ok); if (!ok) bad++; }));
      if (bad) { err.textContent = (bad === 1 ? 'One box is' : bad + ' boxes are') + ' not a number yet: write 3, -2/3 or 0.5.'; err.hidden = false; if (!sized) return; }
      else err.hidden = true;
      if (!bad) o.onChange(strOf(cells), sized);
    }
    build();
    return box;
  }
  const qs = q => Object.entries(q).filter(([, v]) => v !== '' && v != null).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v).replace(/%2F/gi, '/').replace(/%2C/gi, ',').replace(/%3B/gi, ';')).join('&');
  const go = (ctx, q) => REV.go(ctx.base + '?' + qs(q), true);
  /** chips that load a lecture example (or a telling case) through the link */
  const tryChips = (ctx, items) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try an example' }),
    h('div', { class: 'mx-try' }, items.map(it => h('button', { type: 'button', class: 'lk-chip', html: K.rich(it.label), onclick: () => go(ctx, it.q) }))));
  /** "From the lectures: …" when the values are a lecture example */
  function fromNote(items, v) {
    const it = items.find(x => x.src && Object.entries(x.q).every(([k, val]) => norm(v[k]) === norm(val)));
    return it ? K.note('From the lectures: ' + it.src) : null;
  }
  const more = (summary, ...kids) => h('details', { class: 'mx-more' }, h('summary', { html: K.rich(summary) }), ...kids);
  /** K.layout, with the output column kept to the screen width (wide maths scrolls inside its own box) */
  const layout = el => { const L = K.layout(el); L.out.classList.add('mx-out'); return L; };
  const link = (topic, q, text) => '<a href="#/labs/matrix/' + topic + '?' + REV.esc(qs(q)) + '">' + text + '</a>';
  function guard(out, f) {
    try { f(); } catch (e) { console.error(e); out.append(K.note('These values could not be worked out (' + safe(e.message) + ').', 'warn')); }
    paint(out);
  }
  /** steps of a row reduction, or a sentence when nothing had to be done */
  /** the steps of a row reduction as one numbered list: an optional first step, every operation (or a sentence when
      nothing had to be done), an optional last step */
  const opSteps = (ops, aug, none, last, first) => flowSteps([first, ...(ops.length ? ops.map(o => opStep(o, aug)) : [{ text: none }]), last].filter(Boolean));
  /** the solution of Ax = 0 from the reduced form: dependent and free variables, the basis vectors */
  function nullBasis(Rr, piv, n) {
    const names = xs(n), aug = Rr.map(r => [...r, Z]);
    const sol = backSub(aug, n, piv, names);
    const g = general(sol, n);
    return { sol, names, basis: g.dirs, gen: g };
  }

  REV.lab('matrix', {
    /* ---------------------------------------------------------------- vectors and matrix operations */
    // vectors:  ?what=vec&op=sum|scalar|dot&u=3,2&v=5,6&c=2              (1 to 4 entries)
    // matrices: ?what=mat&op=sum|scalar|product|transpose&A=1,2;3,4&B=1,2,3;3,4,5&c=3&e=1,2   (up to 4 × 4; e = the entry of AB pictured)
    operations(el, query, ctx) {
      const s = K.state(ctx, { what: 'mat', op: 'product', u: '3,2', v: '5,6', A: '1,2;3,4', B: '1,2,3;3,4,5', c: '2', e: '1,1' }, query, draw);
      const { controls, out } = layout(el);
      const OPS = { vec: [['sum', 'u + v'], ['scalar', 'c·u'], ['dot', 'u · v']], mat: [['sum', 'A + B'], ['scalar', 'c·A'], ['product', 'AB'], ['transpose', 'Aᵀ']] };
      const TRY = [
        { label: 'L1.1 · $(3, 2) + (5, 6)$', q: { what: 'vec', op: 'sum', u: '3,2', v: '5,6' }, src: 'lecture 1.1 at 10:00 (rice and dal for two shoppers): $(3, 2) + (5, 6) = (8, 8)$.' },
        { label: 'L1.1 · $(1, 2) + (2, 1)$ head to tail', q: { what: 'vec', op: 'sum', u: '1,2', v: '2,1' }, src: 'lecture 1.1 at 25:00: joining the arrows head to tail, $(1, 2) + (2, 1) = (3, 3)$.' },
        { label: 'L7.3 · $(3, 4)\\cdot(2, 7)$', q: { what: 'vec', op: 'dot', u: '3,4', v: '2,7' }, src: 'lecture 7.3 at 00:30: $3\\cdot 2 + 4\\cdot 7 = 6 + 28 = 34$.' },
        { label: 'L7.3 · $(1, 2, 3)\\cdot(2, 0, 1)$', q: { what: 'vec', op: 'dot', u: '1,2,3', v: '2,0,1' }, src: 'lecture 7.3 at 10:00: $2 + 0 + 3 = 5$.' },
        { label: 'L1.2 · adding two $1\\times 3$', q: { what: 'mat', op: 'sum', A: '1/2,-3/4,3', B: '2,-3,-1' }, src: 'lecture 1.2 at 13:00: $\\tfrac12 + 2 = \\tfrac52$, $-\\tfrac34 - 3 = -\\tfrac{15}{4}$ and $3 - 1 = 2$.' },
        { label: 'L1.2 · $3$ times a $2\\times 3$', q: { what: 'mat', op: 'scalar', A: '1,2,3;4,5,6', c: '3' }, src: 'lecture 1.2 at 14:00: every entry is multiplied by $3$.' },
        { label: 'L1.2 · $2\\times 2$ times $2\\times 3$', q: { what: 'mat', op: 'product', A: '1,2;3,4', B: '1,2,3;3,4,5' }, src: 'lecture 1.2 at 15:30: the lecture works out $7$, $22$ and $13$ and leaves $10$, $15$ and $29$ to you.' },
        { label: 'L1.2 · times a column', q: { what: 'mat', op: 'product', A: '1,2;3,4', B: '5;6' }, src: 'lecture 1.2 at 18:30: $1\\cdot 5 + 2\\cdot 6 = 17$ and $3\\cdot 5 + 4\\cdot 6 = 39$.' },
        { label: 'L1.2 · a row times a $3\\times 2$', q: { what: 'mat', op: 'product', A: '1,2,3', B: '2,0.8;5,0.7;0.5,-2' }, src: 'lecture 1.2 at 22:00: the answer is $(13.5,\\ -3.8)$.' },
        { label: 'Transpose of a $2\\times 3$', q: { what: 'mat', op: 'transpose', A: '1,2,3;4,5,6' } },
      ];
      // other names a link may use: what=vectors|matrices, op=add|plus|mul|times|multiply|scale|t|dot|inner
      const WHAT = { vec: 'vec', vector: 'vec', vectors: 'vec', mat: 'mat', matrix: 'mat', matrices: 'mat' };
      const OP = { sum: 'sum', add: 'sum', plus: 'sum', scalar: 'scalar', scale: 'scalar', multiple: 'scalar', product: 'product', mul: 'product', times: 'product', multiply: 'product',
        transpose: 'transpose', t: 'transpose', dot: 'dot', inner: 'dot' };
      const q0 = query || {}, w0 = String(q0.what || '').toLowerCase(), o0 = String(s.v.op || '').toLowerCase();
      s.v.what = WHAT[w0] || ((q0.u || q0.v) && !q0.A ? 'vec' : 'mat');
      s.v.op = OP[o0] || '';
      if (s.v.what === 'vec' && s.v.op === 'product') s.v.op = 'dot';
      if (!OPS[s.v.what].some(o => o[0] === s.v.op)) s.v.op = OPS[s.v.what][s.v.what === 'vec' ? 0 : 2][0];
      function ui() {
        controls.innerHTML = '';
        const vec = s.v.what === 'vec';
        controls.append(
          K.p(vec ? 'A vector is a list of numbers. You can add two vectors entry by entry, stretch one by a number, or multiply matching entries and add them up (the dot product).'
            : 'A matrix is a table of numbers. You can add two matrices entry by entry, multiply every entry by a number, multiply two matrices row by column, or flip one over its diagonal (the transpose).'),
          K.seg({ label: 'Work with', options: [['vec', 'Vectors'], ['mat', 'Matrices']], value: s.v.what, onChange: v => { s.set({ what: v, op: OPS[v][v === 'vec' ? 0 : 2][0] }, true); ui(); draw(); } }),
          K.seg({ label: 'Operation', options: OPS[s.v.what], value: s.v.op, onChange: v => { s.set({ op: v }, true); ui(); draw(); } }));
        if (vec) controls.append(matEditor({ label: 'Vectors $u$ and $v$', value: s.v.u + ';' + s.v.v, rows: [2, 2], cols: [1, 4], colWord: 'Entries in each vector', rowName: i => (i ? 'v' : 'u'), onChange: str => { const [u, v] = str.split(';'); s.set({ u, v }); } }));
        else {
          controls.append(matEditor({ label: 'Matrix $A$', value: s.v.A, rows: [1, 4], cols: [1, 4], onChange: str => s.set({ A: str }) }));
          if (s.v.op === 'sum' || s.v.op === 'product') controls.append(matEditor({ label: 'Matrix $B$', value: s.v.B, rows: [1, 4], cols: [1, 4], onChange: str => s.set({ B: str }) }));
        }
        if (s.v.op === 'scalar') controls.append(K.prob({ label: 'The number $c$', value: s.v.c, min: -1e6, max: 1e6, presets: ['2', '3', '-1', '1/2'], onChange: v => s.set({ c: v }) }));
        controls.append(tryChips(ctx, TRY.filter(t => t.q.what === s.v.what)));
      }
      function draw() { out.innerHTML = ''; guard(out, () => { const src = fromNote(TRY, s.v); if (src) out.append(src); if (s.v.what === 'vec') drawVec(); else drawMat(); }); }
      function scalar() { try { return num(s.v.c); } catch (e) { return null; } }
      function drawVec() {
        const U = readVecs(s.v.u, '$u$', 1, 4), V = readVecs(s.v.v, '$v$', 1, 4);
        if (U.err || V.err) return out.append(K.note(U.err || V.err, 'warn'));
        const u = U.M[0], v = V.M[0], n = u.length;
        if (v.length !== n) return out.append(K.note('$u$ and $v$ need the same number of entries.', 'warn'));
        if (s.v.op === 'sum') {
          const w = vadd(u, v);
          out.append(flowAnswer('$u + v$', 'u + v = ' + vAns(w)),
            K.card('Add entry by entry', flowSteps([
              { text: 'Two vectors with the same number of entries are added <b>entry by entry</b>: first entry plus first entry, second plus second, and so on.', tex: 'u + v = (u_1 + v_1,\\ \\dots,\\ u_{' + n + '} + v_{' + n + '})' },
              { text: 'With your numbers:', tex: 'u + v = ' + tup(u) + ' + ' + tup(v) + ' = (' + u.map((a, i) => tf(a) + ' + ' + (v[i].cmp(0) < 0 ? '(' + tf(v[i]) + ')' : tf(v[i]))).join(',\\ ') + ') = ' + tup(w) },
              { text: 'Check: take $v$ away again and you are back at $u$.', tex: '(u + v) - v = ' + tup(w) + ' - ' + tup(v) + ' = ' + tup(vsub(w, v)) + ' = u\\ \\checkmark' },
            ])));
          if (n === 2) out.append(K.card('Picture: head to tail', K.p('Draw $u$ from the origin, then $v$ from the tip of $u$: you arrive at $u + v$, the diagonal of the parallelogram with sides $u$ and $v$.'),
            plot({ label: 'u, v and u + v', vecs: [{ from: num2(u), to: num2(w), c: 2, dash: true }, { from: num2(v), to: num2(w), c: 1, dash: true }, { to: num2(u), c: 1, label: 'u' }, { to: num2(v), c: 2, label: 'v' }, { to: num2(w), c: 4, label: 'u + v' }] })));
        } else if (s.v.op === 'scalar') {
          const c = scalar();
          if (!c) return out.append(K.note('Type the number $c$ (like 2, -1/2 or 0.5).', 'warn'));
          const w = vsc(c, u);
          const st = [
            { text: 'Multiplying a vector by a number $c$ (a <b>scalar</b>) multiplies every entry by $c$.', tex: 'c\\,u = (c\\,u_1,\\ \\dots,\\ c\\,u_{' + n + '})' },
            { text: 'With your numbers:', tex: P(c) + tup(u) + ' = (' + u.map(a => P(c) + '\\cdot ' + P(a)).join(',\\ ') + ') = ' + tup(w) },
          ];
          if (!c.isZero()) st.push({ text: 'Check: multiplying by $1/c$ undoes it.', tex: '\\tfrac{1}{c}(c\\,u) = ' + coefTex(ONE.div(c)) + tup(w) + ' = ' + tup(vsc(ONE.div(c), w)) + ' = u\\ \\checkmark' });
          out.append(flowAnswer('$c\\,u$', P(c) + 'u = ' + vAns(w)), K.card('Multiply every entry', flowSteps(st)));
          if (n === 2) out.append(K.card('Picture', K.p(c.cmp(0) < 0 ? 'A negative $c$ turns the arrow around and stretches it by $|c|$.' : 'The arrow keeps its direction and is stretched by $c$.'),
            plot({ label: 'u and c u', vecs: [{ to: num2(w), c: 4, label: 'cu' }, { to: num2(u), c: 1, label: 'u' }] })));
        } else {
          const prods = u.map((a, i) => a.mul(v[i])), d = dot(u, v);
          out.append(flowAnswer('$u\\cdot v$', 'u\\cdot v = ' + TD(d)),
            K.card('Multiply matching entries, then add', flowSteps([
              { text: 'The <b>dot product</b> multiplies the first entries, the second entries, and so on, then adds the products. The answer is a number, not a vector.', tex: 'u\\cdot v = u_1v_1 + \\dots + u_{' + n + '}v_{' + n + '}' },
              { text: 'Multiply matching entries:', tex: prods.map((p, i) => P(u[i]) + '\\cdot ' + P(v[i]) + ' = ' + T(p)).join(',\\qquad ') },
              { text: 'Add the products:', tex: 'u\\cdot v = ' + sumTex(prods) + ' = ' + T(d) },
              { text: 'Check: the order does not matter.', tex: 'v\\cdot u = ' + sumTex(v.map((a, i) => a.mul(u[i]))) + ' = ' + T(dot(v, u)) + '\\ \\checkmark' },
            ]),
            K.p(d.isZero() ? 'The dot product is $0$: the vectors are perpendicular (orthogonal).' : d.cmp(0) > 0 ? 'The dot product is positive: the angle between $u$ and $v$ is less than $90^\\circ$.' : 'The dot product is negative: the angle between $u$ and $v$ is more than $90^\\circ$.'),
            K.p('Lengths, the angle and projections are in ' + link('inner-product', { u: s.v.u, v: s.v.v }, 'Length, angle, projection') + '.')));
          if (n === 2) out.append(K.card('Picture', plot({ label: 'u and v', vecs: [{ to: num2(u), c: 1, label: 'u' }, { to: num2(v), c: 2, label: 'v' }] })));
        }
      }
      function drawMat() {
        const RA = readMat(s.v.A, '$A$');
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, m = A.length, n = A[0].length, op = s.v.op;
        let B = null;
        if (op === 'sum' || op === 'product') { const RB = readMat(s.v.B, '$B$'); if (RB.err) return out.append(K.note(RB.err, 'warn')); B = RB.M; }
        if (op === 'sum') {
          if (B.length !== m || B[0].length !== n) { out.append(flowAnswer('$A + B$', '\\text{not defined}'), K.note('Matrices are added entry by entry, so they must have the same size. Here $A$ is $' + size(A) + '$ and $B$ is $' + size(B) + '$.', 'warn')); return; }
          const S = madd(A, B);
          out.append(flowAnswer('$A + B$', ansEq('A + B', S)),
            K.card('Add entry by entry', flowSteps([
              { text: '$A$ and $B$ are both $' + size(A) + '$, so they can be added. Each entry of $A + B$ is the matching entry of $A$ plus the matching entry of $B$:', tex: '(A + B)_{ij} = a_{ij} + b_{ij}' },
              { text: 'Write every sum, then work it out:', tex: 'A + B = ' + mtex(A.map((r, i) => r.map((a, j) => [a, B[i][j]])), { fmt: ([a, b]) => T(a) + ' + ' + P(b) }) + ' = ' + mtex(S) },
              { text: 'Check: subtracting $B$ again gives back $A$.', tex: '(A + B) - B = ' + mtex(msub(S, B)) + ' = A\\ \\checkmark' },
            ])));
        } else if (op === 'scalar') {
          const c = scalar();
          if (!c) return out.append(K.note('Type the number $c$ (like 2, -1/2 or 0.5).', 'warn'));
          const S = mscale(c, A), st = [
            { text: 'Multiplying a matrix by a number $c$ multiplies <b>every</b> entry by $c$:', tex: '(cA)_{ij} = c\\,a_{ij}' },
            { text: 'With your numbers:', tex: P(c) + mtex(A) + ' = ' + mtex(A, { fmt: a => P(c) + '\\cdot ' + P(a) }) + ' = ' + mtex(S) },
          ];
          if (!c.isZero()) st.push({ text: 'Check: multiplying by $1/c$ undoes it.', tex: coefTex(ONE.div(c)) + '(cA) = ' + mtex(mscale(ONE.div(c), S)) + ' = A\\ \\checkmark' });
          out.append(flowAnswer('$c\\,A$', ansEq(P(c) + 'A', S)), K.card('Multiply every entry', flowSteps(st)));
        } else if (op === 'product') {
          const p = B.length, q = B[0].length;
          if (n !== p) { out.append(flowAnswer('$AB$', '\\text{not defined}'), K.note('$AB$ needs as many columns in $A$ as rows in $B$. Here $A$ is $' + size(A) + '$ (' + n + ' columns) and $B$ is $' + size(B) + '$ (' + p + ' rows).' + (q === m ? ' But $BA$ is defined: swap the two matrices.' : ''), 'warn')); return; }
          const C = mul(A, B);
          let [ei, ej] = String(s.v.e).split(',').map(x => parseInt(x, 10) - 1);
          ei = Math.min(Math.max(ei || 0, 0), m - 1); ej = Math.min(Math.max(ej || 0, 0), q - 1);
          const entry = (i, j, al) => {
            const pr = A[i].map((a, k) => a.mul(B[k][j]));
            const parts = dedupe([A[i].map((a, k) => P(a) + '\\cdot ' + P(B[k][j])).join(' + '), sumTex(pr), T(C[i][j])]);
            return '(AB)_{' + (i + 1) + (j + 1) + '} ' + (al ? '&' : '') + '= ' + parts.join(' = ');
          };
          out.append(flowAnswer('$AB$', ansEq('AB', C)));
          const chips = h('div', { class: 'mx-try' }, C.flatMap((r, i) => r.map((_, j) => h('button', { type: 'button', class: 'lk-chip' + (i === ei && j === ej ? ' on' : ''), text: '(' + (i + 1) + ', ' + (j + 1) + ')', 'aria-pressed': i === ei && j === ej ? 'true' : 'false', onclick: () => s.set({ e: (i + 1) + ',' + (j + 1) }) }))));
          out.append(K.card('Picture: one entry of $AB$', K.p('Tap an entry of $AB$ to see where it comes from:'), chips, flowSteps([
            { text: 'Entry $(' + (ei + 1) + ', ' + (ej + 1) + ')$ uses row $' + (ei + 1) + '$ of $A$ (blue) and column $' + (ej + 1) + '$ of $B$ (orange): multiply matching entries and add.', tex: mtex(A, { rows: new Map([[ei, 'x']]) }) + mtex(B, { cols: new Map([[ej, 'y']]) }) + ' = ' + mtex(C, { cells: new Map([[ei + ',' + ej, 'pick']]) }) },
            { tex: entry(ei, ej, false) },
          ])));
          out.append(K.card('Every entry: a row of $A$ times a column of $B$', flowSteps([
            { text: '$A$ is $' + size(A) + '$ and $B$ is $' + size(B) + '$. The inner sizes match ($' + n + ' = ' + p + '$), so $AB$ is defined and has the outer size $' + m + '\\times ' + q + '$. Entry $(i, j)$ is row $i$ of $A$ times column $j$ of $B$:', tex: '(AB)_{ij} = \\sum_{k=1}^{' + n + '} a_{ik}\\,b_{kj}' },
            ...C.map((r, i) => ({ text: 'Row $' + (i + 1) + '$ of $AB$: row $' + (i + 1) + '$ of $A$ times each column of $B$.', tex: '\\begin{aligned}' + r.map((_, j) => entry(i, j, true)).join(' \\\\ ') + '\\end{aligned}' })),
            { text: 'Check: the transpose of a product is the product of the transposes in the other order, so $B^TA^T$ must be the transpose of $AB$.', tex: 'B^TA^T = ' + mtex(tr(B)) + mtex(tr(A)) + ' = ' + mtex(mul(tr(B), tr(A))) + ' = (AB)^T\\ \\checkmark' },
          ])));
          if (m === q && n === p && m === n && !eqM(C, mul(B, A))) out.append(K.card('Order matters', flowSteps([{ text: 'Both $A$ and $B$ are square, so $BA$ is defined too, but it is a different matrix: in general $AB \\neq BA$.', tex: 'BA = ' + mtex(mul(B, A)) + ' \\neq AB' }])));
        } else {
          const At = tr(A), rows = new Map(A.map((_, i) => [i, RAINBOW[i % 4]])), cols = new Map(A.map((_, i) => [i, RAINBOW[i % 4]]));
          out.append(flowAnswer('$A^T$', ansEq('A^T', At)),
            K.card('Rows become columns', flowSteps([
              { text: 'The <b>transpose</b> flips $A$ over its main diagonal: row $i$ of $A$ becomes column $i$ of $A^T$, so an $' + m + '\\times ' + n + '$ matrix becomes $' + n + '\\times ' + m + '$.', tex: '(A^T)_{ij} = a_{ji}' },
              { text: 'Each row of $A$ in its own colour, and the same colours in the columns of $A^T$:', tex: 'A = ' + mtex(A, { rows }) + '\\quad\\Longrightarrow\\quad A^T = ' + mtex(At, { cols }) },
              { text: 'Check: transposing twice gives back $A$.', tex: '(A^T)^T = ' + mtex(tr(At)) + ' = A\\ \\checkmark' },
            ])));
          if (m === n) out.append(K.note(eqM(A, At) ? '$A^T = A$: your matrix is <b>symmetric</b>.' : 'The main diagonal stays where it is; the other entries swap places across it.'));
        }
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- determinant */
    // ?A=2,4,1;3,8,7;5,6,9&along=row|col&k=1&op=swap|scale|add&i=1&j=2&t=2
    //   A square up to 4 × 4; along, k: the row or column to expand along; op, i, j, t: the row operation tested (row i changes)
    determinant(el, query, ctx) {
      const s = K.state(ctx, { A: '2,4,1;3,8,7;5,6,9', along: 'row', k: 1, op: 'swap', i: 1, j: 2, t: '2' }, query, draw);
      s.v.along = /^c/i.test(String(s.v.along)) ? 'col' : 'row';   // also column, c
      s.v.op = { swap: 'swap', interchange: 'swap', scale: 'scale', multiply: 'scale', mul: 'scale', add: 'add' }[String(s.v.op).toLowerCase()] || 'swap';
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L1.4 · $2\\times 2$: $\\det = 2$', q: { A: '2,3;6,10' }, src: 'lecture 1.4 at 03:00: $2\\cdot 10 - 3\\cdot 6 = 20 - 18 = 2$.' },
        { label: 'L1.4 · with fractions', q: { A: '5,2/3;6,3/7' }, src: 'lecture 1.4 at 03:30: $\\tfrac{15}{7} - 4 = -\\tfrac{13}{7}$.' },
        { label: 'L1.4 · $3\\times 3$: $\\det = 70$', q: { A: '2,4,1;3,8,7;5,6,9' }, src: 'lecture 1.4 at 09:00: $2(72 - 42) - 4(27 - 35) + 1(18 - 40) = 70$. Lecture 2.1 shows that every row and column gives $70$.' },
        { label: 'L1.5 · triangular: $144$', q: { A: '2,4,3;0,8,7;0,0,9' }, src: 'lecture 1.5 at 02:30: $2\\cdot 72 = 144 = 2\\cdot 8\\cdot 9$, the product of the diagonal.' },
        { label: 'L1.4 · the identity', q: { A: '1,0,0;0,1,0;0,0,1' }, src: 'lecture 1.4 at 12:00: $\\det I_3 = 1\\cdot\\det I_2 = 1$.' },
        { label: 'A $4\\times 4$ with zeros', q: { A: '1,0,2,-1;3,0,0,5;2,1,4,-3;1,0,5,0', along: 'col', k: 2 } },
      ];
      function ui() {
        controls.innerHTML = '';
        const n = Math.max(1, Math.min(4, cellsOf(s.v.A).length));
        controls.append(
          K.p('The determinant is one number worked out from a square matrix. It is $0$ exactly when the matrix has no inverse.'),
          matEditor({ label: 'Square matrix $A$', value: s.v.A, rows: [1, 4], square: true, rowWord: 'Size $n\\times n$', onChange: (str, sized) => { s.set({ A: str }, sized); if (sized) { ui(); draw(); } } }),
          K.seg({ label: 'Expand along', options: [['row', 'a row'], ['col', 'a column']], value: s.v.along, onChange: v => s.set({ along: v }) }),
          K.seg({ label: 'Which one', options: range(1, n).map(k => [k, String(k)]), value: Math.min(Math.max(1, s.v.k | 0), n), onChange: v => s.set({ k: +v }) }),
          tryChips(ctx, TRY));
      }
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RA = readMat(s.v.A, '$A$', { square: true });
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, n = A.length, k = Math.min(Math.max(1, s.v.k | 0), n) - 1, along = s.v.along === 'col' ? 'col' : 'row';
        const d = det(A);
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        out.append(flowAnswer('$\\det A$', '\\det A = ' + TD(d), d.isZero() ? 'The determinant is $0$, so $A$ has no inverse.' : 'The determinant is not $0$, so $A$ has an inverse.'));
        if (n === 1) { out.append(K.card('A $1\\times 1$ matrix', flowSteps([{ text: 'The determinant of a $1\\times 1$ matrix $[a]$ is the number $a$ itself.', tex: '\\det' + mtex(A) + ' = ' + T(d) }]))); return; }
        const ex = expansionSteps(A, along, k, 'A');
        out.append(K.card('Cofactor expansion along ' + (along === 'row' ? 'row' : 'column') + ' $' + (k + 1) + '$', flowSteps(ex.steps)));
        // every row and column
        const rowsT = [];
        for (const al of ['row', 'col']) for (let q = 0; q < n; q++) { const e = expansion(A, al, q); rowsT.push([(al === 'row' ? 'Row ' : 'Column ') + '$' + (q + 1) + '$', '$' + sumTex(e.terms.map(t => t.term)) + ' = ' + T(e.value) + '$']); }
        out.append(K.card('Check: every row and column gives the same', K.p('Expanding along any row or any column gives $\\det A$ (lecture 2.1). The terms for each choice, yours highlighted:'),
          K.table(['Along', 'Terms added'], rowsT, { hi: new Set([along === 'row' ? k : n + k]) })));
        // shortcuts
        const sc = [];
        if (n === 2) sc.push({ text: 'For a $2\\times 2$ matrix: the product down the main diagonal minus the product of the other two entries.', tex: '\\det A = ad - bc = ' + detParts(A).join(' = ') });
        if (n === 3) {
          const [[a, b, c], [dd, e, f], [g, hh, i]] = A;
          const pr = [[a, e, i], [b, f, g], [c, dd, hh]], mn = [[c, e, g], [a, f, hh], [b, dd, i]];
          const vals = [...pr.map(t => t[0].mul(t[1]).mul(t[2])), ...mn.map(t => t[0].mul(t[1]).mul(t[2]).neg())];
          const w = t => t.map(P).join('\\cdot ');
          sc.push({ text: 'For a $3\\times 3$ matrix only (the rule of Sarrus): copy the first two columns to the right of $A$, add the three products going down to the right, and subtract the three going up to the right.',
            tex: '\\det A = (aei + bfg + cdh) - (ceg + afh + bdi) = (' + pr.map(w).join(' + ') + ') - (' + mn.map(w).join(' + ') + ') = (' + sumTex(vals.slice(0, 3)) + ') - (' + sumTex(vals.slice(3).map(x => x.neg())) + ') = ' + T(vals.slice(0, 3).reduce((x, y) => x.add(y), Z)) + ' - ' + P(vals.slice(3).reduce((x, y) => x.sub(y), Z)) + ' = ' + T(vals.reduce((x, y) => x.add(y), Z)) });
        }
        const upper = A.every((r, i) => r.every((x, j) => j >= i || x.isZero())), lower = A.every((r, i) => r.every((x, j) => j <= i || x.isZero()));
        if (upper || lower) sc.push({ text: 'Your matrix is ' + (upper && lower ? 'diagonal' : upper ? 'upper triangular (zeros below the diagonal)' : 'lower triangular (zeros above the diagonal)') + ', so its determinant is the product of the diagonal entries (lecture 1.5).', tex: '\\det A = ' + A.map((r, i) => P(r[i])).join('\\cdot ') + ' = ' + T(d) });
        const zr = A.findIndex(r => isZeroV(r)), zc = range(0, n - 1).find(j => A.every(r => r[j].isZero()));
        if (zr >= 0) sc.push({ text: 'Row $' + (zr + 1) + '$ is all zeros, so expanding along it gives $\\det A = 0$ at once.' });
        else if (zc != null) sc.push({ text: 'Column $' + (zc + 1) + '$ is all zeros, so expanding along it gives $\\det A = 0$ at once.' });
        let same = null;
        for (let p = 0; p < n && !same; p++) for (let q = p + 1; q < n && !same; q++) if (A[p].every((x, j) => x.eq(A[q][j]))) same = [p, q];
        if (same) sc.push({ text: 'Rows $' + (same[0] + 1) + '$ and $' + (same[1] + 1) + '$ are equal. Swapping them changes nothing, yet a swap must flip the sign, so $\\det A = -\\det A$, which forces $\\det A = 0$.' });
        if (!sc.length) sc.push({ text: 'No shortcut fits a general $4\\times 4$ matrix: expand along the row or column with the most zeros, or use row operations (below) to make zeros first.' });
        out.append(K.card('Shortcuts', flowSteps(sc)));
        rowOpCard(A, d);
      }
      function rowOpCard(A, d) {
        const n = A.length, op = ['swap', 'scale', 'add'].includes(s.v.op) ? s.v.op : 'swap';
        const clampRow = v => Math.min(Math.max(1, v | 0), n) - 1;
        let i = clampRow(s.v.i), j = clampRow(s.v.j);
        if (op !== 'scale' && i === j) j = i === 0 ? 1 : 0;
        let t; try { t = num(s.v.t); } catch (e) { t = F(2); }
        const rowsOpt = range(1, n).map(k => [k, String(k)]);
        const ctl = h('div', { class: 'mx-ed' },
          K.seg({ label: 'Row operation', options: [['swap', 'Swap two rows'], ['scale', 'Row × t'], ['add', 'Row + t × row']], value: op, onChange: v => s.set({ op: v }) }),
          K.seg({ label: op === 'add' ? 'Row $i$ (it changes)' : 'Row $i$', options: rowsOpt, value: i + 1, onChange: v => s.set({ i: +v }) }),
          op === 'scale' ? null : K.seg({ label: op === 'add' ? 'Row $j$ (its multiple is added)' : 'Row $j$', options: rowsOpt, value: j + 1, onChange: v => s.set({ j: +v }) }),
          op === 'swap' ? null : K.seg({ label: 'The number $t$', options: [['2', '2'], ['3', '3'], ['-1', '−1'], ['1/2', '½'], ['-2', '−2']], value: s.v.t, onChange: v => s.set({ t: v }) }));
        const card = K.card('What a row operation does to the determinant', K.p('Pick an operation; the new matrix $A\'$ and its determinant are worked out and compared with $\\det A$.'), ctl);
        out.append(card);
        if (op === 'scale' && t.isZero()) { card.append(K.note('Multiplying a row by $0$ is not a row operation: pick another $t$.', 'warn')); return; }
        const A2 = op === 'swap' ? applyOp(A, 'swap', i, j) : op === 'scale' ? applyOp(A, 'scale', i, null, t) : applyOp(A, 'add', i, j, t);
        const o = { kind: op, i, j, t: op === 'swap' ? null : t };
        const d2 = det(A2), expect = op === 'swap' ? d.neg() : op === 'scale' ? d.mul(t) : d;
        const rule = op === 'swap' ? ['Swapping two rows changes the sign of the determinant.', "\\det A' = -\\det A = " + T(d.neg())]
          : op === 'scale' ? ['Multiplying one row by $t$ multiplies the determinant by $t$.', "\\det A' = t\\cdot\\det A = " + P(t) + '\\cdot ' + P(d) + ' = ' + T(expect)]
            : ['Adding a multiple of one row to another row does not change the determinant.', "\\det A' = \\det A = " + T(d)];
        const w = detWork(A2, "A'");
        card.append(flowSteps([
          { text: 'Apply the operation; the changed row' + (op === 'swap' ? 's are' : ' is') + ' coloured.', tex: opTex(o) + ':\\qquad A = ' + mtex(A) + '\\ \\longrightarrow\\ A\' = ' + mtex(A2, { rows: new Map(op === 'swap' ? [[i, 'pick'], [j, 'pick']] : [[i, 'pick']]) }) },
          { text: 'Work out $\\det A\'$ directly (the steps are below):', tex: "\\det A' = " + T(d2) },
          { text: 'The rule (lectures 1.4 and 2.1): ' + rule[0], tex: rule[1] + (d2.eq(expect) ? '\\ \\checkmark' : '') },
        ]), more("How $\\det A'$ is worked out", flowSteps(w.steps)));
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- systems: Gaussian elimination */
    // ?A=4,-3;6,5&b=11,7    A: up to 4 equations × 4 unknowns; b: one number per equation
    system(el, query, ctx) {
      const s = K.state(ctx, { A: '4,-3;6,5', b: '11,7' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L2.2 · one solution', q: { A: '4,-3;6,5', b: '11,7' }, src: 'lecture 2.2 at 00:30: $4x_1 - 3x_2 = 11$ and $6x_1 + 5x_2 = 7$ have the unique solution $x_1 = 2$, $x_2 = -1$.' },
        { label: 'L2.3 · prices of rice, dal and oil', q: { A: '8,8,4;12,5,7;3,2,5', b: '1960,2215,1135' }, src: 'lecture 2.3 at 24:30: the prices are $x = (45,\\ 125,\\ 150)$.' },
        { label: 'L2.6 · infinitely many', q: { A: '3,2,1,1;1,1,0,0;0,7,1,1', b: '6,2,8' }, src: 'lecture 2.6 at 08:30 and 15:00: the lecture finds $x = (1,\\ 1,\\ 1 - c,\\ c)$ for every number $c$ (called $t$ here).' },
        { label: 'L2.6 · no solution', q: { A: '1,1,1;0,1,-3;2,1,5', b: '2,1,0' }, src: 'lecture 2.6 at 21:30: a row of zeros with a non-zero number after the bar, so there is no solution.' },
        { label: 'Two parallel lines', q: { A: '1,2;2,4', b: '3,5' } },
        { label: 'The same line twice', q: { A: '1,2;2,4', b: '3,6' } },
      ];
      const joined = () => { const a = cellsOf(s.v.A), b = cellsOf(s.v.b).flat(); return strOf(a.map((r, i) => [...r, b[i] != null ? b[i] : '0'])); };
      controls.append(
        K.p('A system of linear equations asks for numbers $x_1, x_2, \\dots$ that make every equation true at the same time. Type the coefficients of each equation and, after the bar, its right-hand side.'),
        matEditor({ label: 'Augmented matrix $[A \\mid b]$', value: joined(), rows: [1, 4], cols: [1, 4], aug: true, rowWord: 'Equations', colWord: 'Unknowns', onChange: str => { const c = cellsOf(str); s.set({ A: strOf(c.map(r => r.slice(0, -1))), b: c.map(r => r[r.length - 1]).join(',') }); } }),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RA = readMat(s.v.A, '$A$'), b0 = cellsOf(s.v.b).flat();
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, m = A.length, n = A[0].length;
        if (b0.length !== m) return out.append(K.note('$b$ needs one number for each of the ' + m + ' equations.', 'warn'));
        let b; try { b = b0.map(num); } catch (e) { return out.append(K.note('An entry of $b$ is not a number: write 3, -2/3 or 0.5.', 'warn')); }
        const names = xs(n), M = A.map((r, i) => [...r, b[i]]);
        const red = reduce(M, n, false), sol = backSub(red.ref, n, red.piv, names);
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        const eqs = '\\begin{aligned}' + A.map((r, i) => lin(r, names) + ' &= ' + T(b[i])).join(' \\\\ ') + '\\end{aligned}';
        let g = null;
        if (sol.kind === 'none') out.append(flowAnswer('No solution', '\\text{row } ' + (sol.bad + 1) + ':\\quad 0 = ' + T(red.ref[sol.bad][n]), 'After elimination one equation says $0 = ' + T(red.ref[sol.bad][n]) + '$, which is impossible.'));
        else if (sol.kind === 'unique') out.append(flowAnswer('One solution', '(' + names.join(',\\ ') + ') = ' + vAns(sol.val.map(e => e.c))));
        else { g = general(sol, n); out.append(flowAnswer('Infinitely many solutions: ' + sol.free.length + ' free variable' + (sol.free.length > 1 ? 's' : ''), 'x = ' + g.tex, 'One solution for every value of ' + and(sol.pn.map(p => '$' + p + '$')) + '.')); }
        out.append(K.card('The system as a matrix', flowSteps([
          { text: 'Your equations:', tex: eqs },
          { text: 'Write the coefficients as $A$ and the right-hand sides as $b$, side by side with a bar between them: the <b>augmented matrix</b>. Each row is one equation.', tex: '[A\\mid b] = ' + mtex(M, { aug: 1 }) },
        ])));
        out.append(K.card('Gaussian elimination', K.p('Row operations (swap two rows, multiply a row by a non-zero number, add a multiple of one row to another) never change the solutions. Following lecture 2.5: take the leftmost column that is not all zeros, get a $1$ at its top, clear the entries below it, then repeat on the rows below. Leading $1$s are boxed; the changed row is coloured.'),
          opSteps(red.down, 1, 'Nothing to do: your augmented matrix is already in row echelon form.', { text: 'This is a row echelon form of $[A\\mid b]$:', tex: mtex(red.ref, { aug: 1, box: boxOf(red.piv) }) })));
        const read = [];
        if (sol.kind === 'none') read.push({ text: 'Row $' + (sol.bad + 1) + '$ has only zeros before the bar but $' + T(red.ref[sol.bad][n]) + '$ after it. As an equation it says', tex: '0\\cdot ' + names.join(' + 0\\cdot ') + ' = ' + T(red.ref[sol.bad][n]) + ',\\quad\\text{that is}\\quad 0 = ' + T(red.ref[sol.bad][n]) },
          { text: 'No numbers can make $0$ equal to $' + T(red.ref[sol.bad][n]) + '$, so the system has <b>no solution</b>.' });
        else {
          read.push(...sol.steps);
          if (sol.kind === 'unique') read.push({ text: 'Every unknown has a leading $1$ and no row says $0 = $ (non-zero), so there is exactly <b>one solution</b>:', tex: '(' + names.join(',\\ ') + ') = ' + tup(sol.val.map(e => e.c)) });
          else read.push({ text: 'Some unknowns are free, so there are <b>infinitely many solutions</b>. Collect them as one vector, split into a fixed part and a part for each free variable:', tex: 'x = ' + g.tex });
        }
        out.append(K.card(sol.kind === 'none' ? 'Read the answer' : 'Back substitution: from the last row up', flowSteps(read)));
        out.append(K.card('The three kinds of answer', K.p('After elimination: a row $0 = c$ with $c \\neq 0$ means <b>no solution</b>. Otherwise, if every unknown has a leading $1$ there is <b>one solution</b>; if some unknown has none, it is free and there are <b>infinitely many</b>.')));
        // check
        if (sol.kind !== 'none') {
          const chk = [];
          if (sol.kind === 'unique') {
            const x = sol.val.map(e => e.c);
            chk.push({ text: 'Put the solution back into every original equation:', tex: '\\begin{aligned}' + A.map((r, i) => {
              const pr = r.map((a, j) => a.mul(x[j]));
              return r.map((a, j) => P(a) + '\\cdot ' + P(x[j])).join(' + ') + ' &= ' + sumTex(pr) + ' = ' + T(pr.reduce((p, q) => p.add(q), Z)) + (pr.reduce((p, q) => p.add(q), Z).eq(b[i]) ? '\\ \\checkmark' : '');
            }).join(' \\\\ ') + '\\end{aligned}' });
          } else {
            chk.push({ text: 'The fixed part solves the system (all free variables $0$):', tex: 'A' + vcol(g.p) + ' = ' + vcol(mul(A, g.p.map(x => [x])).map(r => r[0])) + ' = b\\ \\checkmark' });
            g.dirs.forEach((d, q) => chk.push({ text: 'The part for $' + sol.pn[q] + '$ gives $0$, so any multiple of it can be added:', tex: 'A' + vcol(d) + ' = ' + vcol(mul(A, d.map(x => [x])).map(r => r[0])) + '\\ \\checkmark' }));
          }
          out.append(K.card('Check', flowSteps(chk)));
        }
        if (n === 2) {
          const lines = A.map((r, i) => ({ a: fnum(r[0]), b: fnum(r[1]), c: fnum(b[i]), k: (i % 4) + 1, label: 'eq ' + (i + 1) })).filter(l => l.a || l.b);
          const extra = [];
          lines.forEach(l => { if (l.a) extra.push([l.c / l.a, 0]); if (l.b) extra.push([0, l.c / l.b]); });
          const dots = sol.kind === 'unique' ? [{ at: sol.val.map(e => fnum(e.c)), c: 4, label: '(' + sol.val.map(e => r4(fnum(e.c))).join(', ') + ')' }] : [];
          out.append(K.card('Picture: each equation is a line', K.p(sol.kind === 'unique' ? 'The lines cross at one point: the solution.' : sol.kind === 'none' ? 'The lines never all meet at one point (parallel lines never meet): no solution.' : 'The lines lie on top of each other: every point of that line is a solution.'),
            plot({ label: 'the equations as lines', lines, dots, extra: extra.filter(p => Math.abs(p[0]) < 1e3 && Math.abs(p[1]) < 1e3) })));
        }
      }
      draw();
    },

    /* ---------------------------------------------------------------- echelon forms */
    // ?A=3,2,1,1;1,1,0,0;0,7,1,1    any matrix up to 4 × 5
    echelon(el, query, ctx) {
      const s = K.state(ctx, { A: '3,2,1,1;1,1,0,0;0,7,1,1' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L2.5 · the lecture\'s example', q: { A: '3,2,1,1;1,1,0,0;0,7,1,1' }, src: 'lecture 2.5 at 04:30 to 17:00: $R_1/3$, $R_2 - R_1$, $3R_2$, $R_3 - 7R_2$, $R_3/8$, then $R_2 + R_3$, $R_1 - \\tfrac13R_3$ and $R_1 - \\tfrac23R_2$.' },
        { label: 'L2.5 · reduces to $I$', q: { A: '2,4,1;3,8,7;5,6,9' }, src: 'lecture 2.5 at 17:30: the reduced row echelon form is the identity matrix.' },
        { label: 'L2.4 · already reduced', q: { A: '1,0,2;0,1,3' }, src: 'lecture 2.4 at 02:00: this matrix is already in reduced row echelon form.' },
        { label: 'A zero row in the middle', q: { A: '1,2,3;0,0,0;0,1,4' } },
        { label: 'Needs a swap', q: { A: '0,2,4;1,1,1;2,0,1' } },
      ];
      controls.append(
        K.p('Row operations turn any matrix into a staircase of leading $1$s: first the row echelon form, then the reduced row echelon form. The steps follow lecture 2.5.'),
        matEditor({ label: 'Matrix $A$', value: s.v.A, rows: [1, 4], cols: [1, 5], onChange: str => s.set({ A: str }) }),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RA = readMat(s.v.A, '$A$', { maxC: 5 });
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, n = A[0].length, red = reduce(A, n, true), box = boxOf(red.piv);
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        out.append(flowAnswer('Row echelon form and reduced row echelon form (leading $1$s boxed)', '\\begin{aligned}\\text{REF} &= ' + mtex(red.ref, { box }) + ' \\\\[4pt] \\text{RREF} &= ' + mtex(red.rref, { box }) + '\\end{aligned}', 'Number of leading $1$s: $' + red.piv.length + '$ (the rank of $A$).'));
        const rA = echelonRules(A), rRef = echelonRules(red.ref), rR = echelonRules(red.rref);
        const isRef = rA.slice(0, 3).every(x => x.ok), isRref = isRef && rA[3].ok;
        out.append(K.card('Is your matrix in echelon form?', K.p('Lecture 2.4: a matrix is in <b>row echelon form</b> when rules 1–3 hold, and in <b>reduced</b> row echelon form when rule 4 holds as well.'),
          flowSteps(rA.map(x => ({ text: x.name }))),
          K.table(['', 'Your $A$', 'REF', 'RREF'], rA.map((x, q) => ['Rule ' + (q + 1), mark(x.ok), mark(rRef[q].ok), mark(rR[q].ok)]), { rowHead: true }),
          K.p(isRref ? 'Your matrix is already in reduced row echelon form.' : isRef ? 'Your matrix is in row echelon form but not reduced: ' + rA[3].why : 'Your matrix is not in row echelon form: ' + rA.slice(0, 3).filter(x => !x.ok).map(x => x.why).join(' '))));
        out.append(K.card('Forward phase: a leading $1$ in each row, zeros below it', K.p('Take the leftmost column that is not all zeros (in the rows still to do), bring a non-zero entry to the top by a swap if needed, divide to make it $1$, and clear every entry below it. Then repeat on the rows below.'),
          opSteps(red.down, 0, 'Nothing to do: the matrix is already in row echelon form.', { text: 'Rules 1–3 hold now: this is a <b>row echelon form</b>.', tex: mtex(red.ref, { box }) })));
        out.append(K.card('Backward phase: zeros above each leading $1$', K.p('Start with the rightmost leading $1$ and clear every entry above it, then move one leading $1$ to the left. The columns already cleared are not disturbed.'),
          opSteps(red.up, 0, 'Nothing to do: every leading $1$ already has zeros above it.', { text: 'Rule 4 holds as well: this is the <b>reduced row echelon form</b>. It is the same whatever row operations you use.', tex: mtex(red.rref, { box }) })));
        const pc = red.piv.map(([, c]) => c), other = range(0, n - 1).filter(j => !pc.includes(j));
        out.append(K.card('What the leading $1$s tell you', flowSteps([
          { text: 'There ' + (red.piv.length === 1 ? 'is $1$ leading $1$' : 'are $' + red.piv.length + '$ leading $1$s') + ', so the rank of $A$ is $' + red.piv.length + '$.', tex: '\\rank A = ' + red.piv.length },
          { text: pc.length ? 'Columns ' + and(pc.map(j => '$' + (j + 1) + '$')) + ' hold leading $1$s' + (other.length ? '; columns ' + and(other.map(j => '$' + (j + 1) + '$')) + ' do not' : '') + '. For $Ax = 0$ the unknowns of the columns without a leading $1$ are free.' : 'There are no leading $1$s: $A$ is the zero matrix.' },
        ]), K.p('See ' + link('null-space', { A: s.v.A }, 'Null space') + ' and ' + link('basis', { A: s.v.A }, 'Basis, rank and dimension') + ' for what to do with them.')));
      }
      draw();
    },

    /* ---------------------------------------------------------------- inverse and Cramer's rule */
    // ?A=1,2,3;0,2,8;5,6,0&how=adj|rows|cramer&b=1,1,1    A square up to 4 × 4; b (for Cramer's rule): one number per row
    inverse(el, query, ctx) {
      const s = K.state(ctx, { A: '1,2,3;0,2,8;5,6,0', how: 'adj', b: '1,1,1' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L2.3 · $\\begin{bmatrix}4&7\\\\2&6\\end{bmatrix}$', q: { A: '4,7;2,6', how: 'adj' }, src: 'lecture 2.3 at 02:00: the inverse is $\\begin{bmatrix}0.6&-0.7\\\\-0.2&0.4\\end{bmatrix}$.' },
        { label: 'L2.3 · the adjugate example', q: { A: '1,2,3;0,2,8;5,6,0', how: 'adj' }, src: 'lecture 2.3 at 12:00 to 17:30: $\\det A = 2$, the cofactor matrix, $\\adj A = C^T$ and the check $A\\cdot\\tfrac12\\adj A = I$.' },
        { label: 'L2.3 · prices, by row reduction', q: { A: '8,8,4;12,5,7;3,2,5', how: 'rows' }, src: 'lecture 2.3 at 24:30: $\\det A = -188$ (the lecture finds $A^{-1}$ by the adjugate).' },
        { label: 'L2.2 · Cramer, $2\\times 2$', q: { A: '4,-3;6,5', how: 'cramer', b: '11,7' }, src: 'lecture 2.2 at 02:30: $\\det A = 38$, $\\det A_{x_1} = 76$, $\\det A_{x_2} = -38$, so $x_1 = 2$ and $x_2 = -1$.' },
        { label: 'L2.2 · Cramer, $3\\times 3$', q: { A: '1,0,3;0,2,5;4,3,1', how: 'cramer', b: '0,2,1' }, src: 'lecture 2.2 at 11:30: $\\det A = -37$, and $\\det A_{x_1} = 12$, $\\det A_{x_2} = -27$, $\\det A_{x_3} = -4$.' },
        { label: '$\\det A = 0$: no inverse', q: { A: '1,2,3;4,5,6;7,8,9', how: 'adj' } },
      ];
      const HOW = [['adj', 'Adjugate'], ['rows', 'Row reduce [A | I]'], ['cramer', "Cramer's rule"]];
      // also how=adjugate, how=row|rref|gauss|gauss-jordan, how=cramers
      s.v.how = { adj: 'adj', adjugate: 'adj', adjoint: 'adj', rows: 'rows', row: 'rows', rref: 'rows', gauss: 'rows', 'gauss-jordan': 'rows', cramer: 'cramer', cramers: 'cramer' }[String(s.v.how).toLowerCase()] || 'adj';
      const bFit = n => { const b = cellsOf(s.v.b).flat(); return range(0, n - 1).map(i => (b[i] != null ? b[i] : '0')).join(','); };
      function ui() {
        controls.innerHTML = '';
        const n = Math.max(1, Math.min(4, cellsOf(s.v.A).length));
        controls.append(
          K.p('The inverse $A^{-1}$ undoes $A$: $AA^{-1} = A^{-1}A = I$. It exists exactly when $\\det A \\neq 0$. Cramer\'s rule uses determinants to solve $Ax = b$.'),
          matEditor({ label: 'Square matrix $A$', value: s.v.A, rows: [1, 4], square: true, rowWord: 'Size $n\\times n$', onChange: (str, sized) => { s.set({ A: str }, sized); if (sized) { s.set({ b: bFit(cellsOf(str).length) }, true); ui(); draw(); } } }),
          K.seg({ label: 'Method', options: HOW, value: s.v.how, onChange: v => { s.set({ how: v }, true); ui(); draw(); } }));
        if (s.v.how === 'cramer') controls.append(matEditor({ label: 'Right-hand side $b$ of $Ax = b$', value: bFit(n), rows: [1, 1], cols: [n, n], onChange: str => s.set({ b: str }) }));
        controls.append(tryChips(ctx, TRY));
      }
      function draw() { out.innerHTML = ''; guard(out, body); }
      function check(A, inv) {
        const I = mul(A, inv);
        return K.card('Check: $AA^{-1} = I$', flowSteps([{ text: 'Multiply $A$ by the inverse (each entry is a row of $A$ times a column of $A^{-1}$). The identity matrix comes out:', tex: mtex(A) + mtex(inv) + ' = ' + mtex(I) + (eqM(I, ident(A.length)) ? ' = I\\ \\checkmark' : '') }]));
      }
      function body() {
        const RA = readMat(s.v.A, '$A$', { square: true });
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, n = A.length, d = det(A), how = s.v.how;
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        if (how === 'adj') {
          const dw = detWork(A, 'A');
          if (d.isZero()) {
            out.append(flowAnswer('No inverse', '\\det A = 0'), K.card('The determinant', flowSteps(dw.steps)),
              K.note('$\\det A = 0$, so $A$ has no inverse: the formula $A^{-1} = \\frac{1}{\\det A}\\adj A$ would divide by $0$, and some non-zero $x$ has $Ax = 0$ (see ' + link('null-space', { A: s.v.A }, 'Null space') + ').', 'warn'));
            return;
          }
          const inv = n === 1 ? [[ONE.div(A[0][0])]] : mscale(ONE.div(d), tr(A.map((r, i) => r.map((_, j) => det(minorOf(A, i, j)).mul((i + j) % 2 ? -1 : 1)))));
          out.append(flowAnswer('$A^{-1}$', ansEq('A^{-1}', inv)));
          out.append(K.card('1. The determinant', flowSteps(dw.steps), K.p('$\\det A = ' + T(d) + ' \\neq 0$, so the inverse exists.')));
          if (n === 1) { out.append(K.card('2. The inverse of a $1\\times 1$ matrix', flowSteps([{ text: 'For $[a]$ with $a \\neq 0$ the inverse is $[1/a]$:', tex: 'A^{-1} = ' + mtex(inv) }])), check(A, inv)); return; }
          const C = A.map((r, i) => r.map((_, j) => det(minorOf(A, i, j)).mul((i + j) % 2 ? -1 : 1)));
          const cst = A.map((r, i) => ({
            text: 'Row $' + (i + 1) + '$ of cofactors: for each column $j$, delete row $' + (i + 1) + '$ and column $j$, take the determinant of what is left (the minor $M_{' + (i + 1) + 'j}$) and attach the sign $(-1)^{' + (i + 1) + '+j}$.',
            tex: '\\begin{aligned}' + r.map((_, j) => {
              const mn = minorOf(A, i, j), sg = (i + j) % 2 ? '(-1)' : '(+1)', parts = detParts(mn), md = det(mn), ij = (i + 1) + '' + (j + 1);
              if (mn.length === 1) return 'C_{' + ij + '} &= ' + sg + '\\det' + mtex(mn) + ' = ' + sg + '\\cdot ' + P(md) + ' = ' + T(C[i][j]);
              return 'M_{' + ij + '} &= \\det' + mtex(mn) + ' \\\\ &= ' + parts.join(mn.length === 3 ? ' \\\\ &= ' : ' = ') + ' \\\\ C_{' + ij + '} &= ' + sg + 'M_{' + ij + '} = ' + sg + '\\cdot ' + P(md) + ' = ' + T(C[i][j]);
            }).join(' \\\\[10pt] ') + '\\end{aligned}',
          }));
          out.append(K.card('2. Every minor and cofactor', K.p('The <b>cofactor</b> $C_{ij} = (-1)^{i+j}M_{ij}$ is the minor with the checkerboard sign.'), flowSteps(cst)));
          out.append(K.card('3. Adjugate, then divide by the determinant', flowSteps([
            { text: 'Put the cofactors in a matrix $C$:', tex: 'C = ' + mtex(C) },
            { text: 'The <b>adjugate</b> is its transpose: row $i$ of $C$ becomes column $i$.', tex: '\\adj A = C^T = ' + mtex(tr(C)) },
            { text: 'Divide every entry by $\\det A = ' + T(d) + '$ (lecture 2.3: $A^{-1} = \\frac{1}{\\det A}\\adj A$):', tex: 'A^{-1} = ' + coefTex(ONE.div(d)) + mtex(tr(C)) + ' = ' + mtex(inv) },
          ])), check(A, inv));
        } else if (how === 'rows') {
          const M = A.map((r, i) => [...r, ...ident(n)[i]]), red = reduce(M, n, true), ok = red.piv.length === n;
          const inv = red.rref.map(r => r.slice(n));
          out.append(ok ? flowAnswer('$A^{-1}$', ansEq('A^{-1}', inv)) : flowAnswer('No inverse', '\\text{a row of zeros appears on the left}'));
          out.append(K.card('Row reduce $[A \\mid I]$', K.p('Write $I$ next to $A$ and row reduce the whole thing. Whatever turns $A$ into $I$ turns $I$ into $A^{-1}$, because each row operation is a multiplication by an invertible matrix.'),
            opSteps(red.ops, n, 'Nothing to do: $A$ is already the identity.',
              ok ? { text: 'The left half is $I$, so the right half is $A^{-1}$:', tex: '[I\\mid A^{-1}] = ' + mtex(red.rref, { aug: n, box: boxOf(red.piv) }) }
                : { text: 'The left half has a row of zeros, so it can never become $I$: $A$ has no inverse (and $\\det A = 0$).', tex: mtex(red.rref, { aug: n, box: boxOf(red.piv) }) },
              { text: 'Start:', tex: '[A\\mid I] = ' + mtex(M, { aug: n }) })));
          if (ok) out.append(check(A, inv));
        } else {
          const bc = cellsOf(bFit(n)).flat();
          let b; try { b = bc.map(num); } catch (e) { return out.append(K.note('An entry of $b$ is not a number: write 3, -2/3 or 0.5.', 'warn')); }
          const dw = detWork(A, 'A');
          if (d.isZero()) {
            out.append(flowAnswer('Cramer\'s rule cannot be used', '\\det A = 0'), K.card('The determinant', flowSteps(dw.steps)),
              K.note('Cramer\'s rule divides by $\\det A$, so it needs $\\det A \\neq 0$. The system has no solution or infinitely many: solve it by elimination in ' + link('system', { A: s.v.A, b: bc.join(',') }, 'Systems: Gaussian elimination') + '.', 'warn'));
            return;
          }
          const Ai = range(0, n - 1).map(i => A.map((r, q) => r.map((x, j) => (j === i ? b[q] : x))));
          const di = Ai.map(det), x = di.map(v => v.div(d)), names = xs(n);
          out.append(flowAnswer('The solution of $Ax = b$', '(' + names.join(',\\ ') + ') = ' + vAns(x)));
          out.append(K.card('1. The determinant of $A$', flowSteps(dw.steps), K.p('$\\det A = ' + T(d) + ' \\neq 0$, so Cramer\'s rule applies (lecture 2.2).')));
          Ai.forEach((Mi, i) => {
            const nm = 'A_{x_{' + (i + 1) + '}}', w = detWork(Mi, nm);
            const st = [{ text: 'Replace column $' + (i + 1) + '$ of $A$ (the coefficients of $' + names[i] + '$) by $b$:', tex: nm + ' = ' + mtex(Mi, { cols: new Map([[i, 'pick']]) }) }];
            if (n <= 3) st.push(...w.steps);
            else st.push({ text: 'Its determinant (the expansion is below):', tex: '\\det ' + nm + ' = ' + T(di[i]) });
            st.push({ text: 'Divide by $\\det A$:', tex: names[i] + ' = \\frac{\\det ' + nm + '}{\\det A} = \\frac{' + T(di[i]) + '}{' + T(d) + '} = ' + TD(x[i]) });
            out.append(K.card((i + 2) + '. The unknown $' + names[i] + '$', flowSteps(st), n > 3 ? more('How $\\det ' + nm + '$ is worked out', flowSteps(w.steps)) : null));
          });
          const Ax = A.map(r => dot(r, x));
          out.append(K.card('Check: $Ax = b$', flowSteps([{ text: 'Multiply $A$ by the solution; the right-hand sides come out:', tex: mtex(A) + vcol(x) + ' = ' + vcol(Ax) + (Ax.every((v, i) => v.eq(b[i])) ? ' = b\\ \\checkmark' : '') }])));
        }
      }
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- linear independence and span */
    // ?v=1,2,0;0,2,4;3,0,0;1,2,3    1 to 5 vectors with 1 to 4 entries each, one vector per group
    independence(el, query, ctx) {
      const s = K.state(ctx, { v: '1,2,0;0,2,4;3,0,0;1,2,3' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L3.5 · $(1, 2), (1, 3), (3, 4)$', q: { v: '1,2;1,3;3,4' }, src: 'lecture 3.5 at 11:30: the solutions are $x_1 = -5c$, $x_2 = 2c$, $x_3 = c$, so the vectors are dependent.' },
        { label: 'L3.5 · $(1, 2, 0)$ and $(3, 3, 5)$', q: { v: '1,2,0;3,3,5' }, src: 'lecture 3.5 at 08:00 to 11:00: two vectors that are not multiples of each other, so independent.' },
        { label: 'L3.5 · three in $\\mathbb{R}^3$', q: { v: '1,2,0;0,2,4;3,0,0' }, src: 'lecture 3.5 at 14:00: the determinant is $24 \\neq 0$, so the three vectors are independent.' },
        { label: 'L3.5 · four in $\\mathbb{R}^3$', q: { v: '1,2,0;0,2,4;3,0,0;1,2,3' }, src: 'lecture 3.5 at 19:00 to 22:00: $x = (-\\tfrac c4, -\\tfrac{3c}4, -\\tfrac c4, c)$, and $c = 4$ gives $-(1,2,0) - 3(0,2,4) - (3,0,0) + 4(1,2,3) = 0$.' },
        { label: 'With the zero vector', q: { v: '1,1;0,0' } },
      ];
      controls.append(
        K.p('Vectors are <b>linearly independent</b> when none of them can be built from the others; then $c_1v_1 + \\dots + c_kv_k = 0$ only for $c_1 = \\dots = c_k = 0$.'),
        matEditor({ label: 'Vectors, one per row', value: s.v.v, rows: [1, 5], cols: [1, 4], rowWord: 'Number of vectors $k$', colWord: 'Entries in each vector $n$', rowName: i => 'v_{' + (i + 1) + '}', onChange: str => s.set({ v: str }) }),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RV = readVecs(s.v.v, 'the list of vectors', 5, 4);
        if (RV.err) return out.append(K.note(RV.err, 'warn'));
        const V = RV.M, k = V.length, n = V[0].length, M = tr(V), red = reduce(M, k, true), r = red.piv.length;
        const vn = range(1, k).map(i => 'v_{' + i + '}'), cn = xs(k, 'c'), pc = red.piv.map(([, c]) => c);
        const free = range(0, k - 1).filter(j => !pc.includes(j)), indep = !free.length;
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        // a dependence relation with whole numbers: the first free c set to a value, the other free ones 0
        let rel = null;
        if (!indep) {
          const f = free[0], c = range(0, k - 1).map(() => Z);
          c[f] = ONE;
          red.piv.forEach(([row, p]) => { c[p] = red.rref[row][f].neg(); });
          const L = c.reduce((a, x) => blcm(a, x.d), 1n), ints = c.map(x => x.mul(F(L)));
          const g = ints.reduce((a, x) => bgcd(a, x.n), 0n) || 1n;
          rel = { f, c: ints.map(x => x.div(F(g))) };
        }
        out.append(flowAnswer(indep ? 'Linearly independent' : 'Linearly dependent', indep ? 'c_1v_1 + \\dots + c_{' + k + '}v_{' + k + '} = 0 \\;\\Rightarrow\\; c_1 = \\dots = c_{' + k + '} = 0' : lin(rel.c, vn) + ' = 0'));
        out.append(K.card('Set up $c_1v_1 + \\dots + c_kv_k = 0$', flowSteps([
          { text: 'Ask which numbers $c_1, \\dots, c_{' + k + '}$ make the combination the zero vector:', tex: vn.map((x, i) => 'c_{' + (i + 1) + '}' + vcol(V[i])).join(' + ') + ' = ' + vcol(V[0].map(() => Z)) },
          { text: 'Entry by entry this is a system of ' + n + ' equation' + (n > 1 ? 's' : '') + ' in the unknowns $c_1, \\dots, c_{' + k + '}$. Its matrix $V$ has the vectors as its <b>columns</b>:', tex: '\\begin{aligned}' + M.map(row => lin(row, cn) + ' &= 0').join(' \\\\ ') + '\\end{aligned}\\qquad V = ' + mtex(M, { cols: new Map(range(0, k - 1).map(j => [j, RAINBOW[j % 4]])) }) },
          { text: 'The right-hand sides are all $0$ and stay $0$ under row operations, so row reduce $V$ alone (lecture 5.1 drops the zero column the same way).' },
        ])));
        out.append(K.card('Row reduce $V$', opSteps(red.ops, 0, 'Nothing to do: $V$ is already in reduced row echelon form.', { text: 'The reduced form, leading $1$s boxed:', tex: mtex(red.rref, { box: boxOf(red.piv) }) })));
        const st = [];
        if (indep) st.push({ text: 'Every column has a leading $1$, so no unknown is free: the only solution is all $c_i = 0$. The vectors are <b>linearly independent</b>.', tex: cn.join(' = ') + ' = 0' });
        else {
          st.push({ text: 'Column' + (free.length > 1 ? 's ' : ' ') + and(free.map(j => '$' + (j + 1) + '$')) + ' ha' + (free.length > 1 ? 've' : 's') + ' no leading $1$, so ' + and(free.map(j => '$c_{' + (j + 1) + '}$')) + (free.length > 1 ? ' are free' : ' is free') + ': there are solutions other than $0$. The vectors are <b>linearly dependent</b>.' });
          const f = rel.f;
          st.push({ text: 'Take $c_{' + (f + 1) + '} = ' + T(rel.c[f]) + '$' + (free.length > 1 ? ' and the other free unknowns $0$' : '') + ' (a value that avoids fractions); each leading-$1$ row then gives one $c$:', tex: cn.map((x, i) => x + ' = ' + T(rel.c[i])).join(',\\quad ') });
          st.push({ text: 'So this combination is the zero vector. Check it entry by entry:', tex: '\\begin{aligned}' + lin(rel.c, vn) + ' &= 0 \\\\ ' + range(0, n - 1).map(q => {
            const pr = V.map((v, i) => rel.c[i].mul(v[q]));
            return '\\text{entry ' + (q + 1) + '}:\\ ' + V.map((v, i) => P(rel.c[i]) + '\\cdot ' + P(v[q])).join(' + ') + ' &= ' + sumTex(pr) + ' = ' + T(pr.reduce((a, b) => a.add(b), Z));
          }).join(' \\\\ ') + '\\end{aligned}' });
          const others = range(0, k - 1).filter(i => i !== f && !rel.c[i].isZero());
          st.push({ text: 'Because $c_{' + (f + 1) + '} \\neq 0$, $v_{' + (f + 1) + '}$ is a combination of the others:', tex: 'v_{' + (f + 1) + '} = ' + (others.length ? lin(others.map(i => rel.c[i].neg().div(rel.c[f])), others.map(i => vn[i])) : '0') });
        }
        out.append(K.card('Read the answer', flowSteps(st)));
        // span
        const where = r === 0 ? 'only the zero vector' : r === n ? 'all of $\\mathbb{R}^{' + n + '}$' : r === 1 ? 'a line through the origin in $\\mathbb{R}^{' + n + '}$' : r === 2 ? 'a plane through the origin in $\\mathbb{R}^{' + n + '}$' : 'a ' + r + '-dimensional subspace of $\\mathbb{R}^{' + n + '}$';
        out.append(K.card('Span', K.p('The vectors span ' + where + ' (dimension $' + r + '$)' + (r ? '; ' + and(pc.map(j => '$v_{' + (j + 1) + '}$')) + (r === 1 ? ' alone spans' : ' already span') + ' it and ' + (r === 1 ? 'is a basis' : 'form a basis') + ' of the span.' : '.'))));
        // quick rules
        const qr = [];
        if (k > n) qr.push({ text: 'There are $' + k + '$ vectors in $\\mathbb{R}^{' + n + '}$ and $' + k + ' > ' + n + '$: more than $n$ vectors in $\\mathbb{R}^n$ are always dependent (lecture 3.5).' });
        const z = V.findIndex(isZeroV);
        if (z >= 0) qr.push({ text: '$v_{' + (z + 1) + '}$ is the zero vector, and any list containing $0$ is dependent: $1\\cdot 0 = 0$ with a non-zero coefficient.' });
        if (k === n) { const w = detWork(M, 'V'); qr.push({ text: 'Here $k = n = ' + n + '$, so $V$ is square and its determinant decides it: $\\det V \\neq 0$ exactly when the vectors are independent.', tex: '\\det V = ' + T(w.value) + (w.value.isZero() ? '\\ \\Rightarrow\\ \\text{dependent}' : '\\neq 0\\ \\Rightarrow\\ \\text{independent}') }); out.append(K.card('Quick checks', flowSteps(qr), more('How $\\det V$ is worked out', flowSteps(w.steps)))); }
        else if (qr.length) out.append(K.card('Quick checks', flowSteps(qr)));
        if (n === 2) out.append(K.card('Picture', K.p(r === 2 ? 'Two directions that are not on one line: together they reach every point of the plane.' : r === 1 ? 'All the arrows lie on one line through the origin.' : 'Only the zero vector.'),
          plot({ label: 'the vectors', vecs: V.map((v, i) => ({ to: num2(v), c: (i % 4) + 1, label: 'v' + '₁₂₃₄₅'[i] })) })));
      }
      draw();
    },

    /* ---------------------------------------------------------------- basis, rank, dimension */
    // ?A=1,3,-1,3;-2,1,-5,8;0,1,-1,2;4,0,8,-12    any matrix up to 4 × 5
    basis(el, query, ctx) {
      const s = K.state(ctx, { A: '1,3,-1,3;-2,1,-5,8;0,1,-1,2;4,0,8,-12' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L4.4 · column method, $\\mathbb{R}^4$', q: { A: '1,3,-1,3;-2,1,-5,8;0,1,-1,2;4,0,8,-12' }, src: 'lecture 4.4 at 17:30: the four vectors $(1,-2,0,4)$, $(3,1,1,0)$, $(-1,-5,-1,8)$, $(3,8,2,-12)$ as columns; the first two form a basis of their span.' },
        { label: 'L4.4 · column method, $\\mathbb{R}^3$', q: { A: '1,-2,3;0,-3,3;1,1,0' }, src: 'lecture 4.4 at 14:30: $(1,0,1)$, $(-2,-3,1)$, $(3,3,0)$ as columns; the first two form a basis.' },
        { label: 'L4.4 · row method, $\\mathbb{R}^3$', q: { A: '1,0,1;-2,-3,1;3,3,0' }, src: 'lecture 4.4 at 03:00: the same vectors as rows; the non-zero rows $(1,0,1)$ and $(0,1,-1)$ form a basis and the dimension is $2$.' },
        { label: 'L6.3 · a $3\\times 4$', q: { A: '2,4,6,8;1,3,0,5;1,1,6,3' }, src: 'lecture 6.3 at 03:30: the pivot columns $(2,1,1)$ and $(4,3,1)$ are a basis of the column space.' },
      ];
      controls.append(
        K.p('The <b>column space</b> of $A$ is everything you can build from its columns, the <b>row space</b> everything from its rows. One row reduction gives a basis of each, and their common dimension is the <b>rank</b>.'),
        matEditor({ label: 'Matrix $A$', value: s.v.A, rows: [1, 4], cols: [1, 5], onChange: str => s.set({ A: str }) }),
        K.p('To find a basis of the span of some vectors, type them as the columns (column method) or as the rows (row method), as in lecture 4.4.', 'lk-help'),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RA = readMat(s.v.A, '$A$', { maxC: 5 });
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, m = A.length, n = A[0].length, red = reduce(A, n, true), r = red.piv.length, pc = red.piv.map(([, c]) => c);
        const cols = tr(A), colsB = pc.map(j => cols[j]), rowsB = red.rref.slice(0, r);
        const set = vs => (vs.length ? '\\{' + vs.map(v => tup(v)).join(',\\ ') + '\\}' : '\\varnothing');
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        out.append(flowAnswer('Rank and bases', '\\begin{aligned}\\rank A &= ' + r + ' \\\\ \\text{column space: } &' + set(colsB) + ' \\\\ \\text{row space: } &' + set(rowsB) + '\\end{aligned}'));
        out.append(K.card('Row reduce $A$', opSteps(red.ops, 0, 'Nothing to do: $A$ is already in reduced row echelon form.', { text: 'The reduced form $R$, leading $1$s (pivots) boxed:', tex: 'R = ' + mtex(red.rref, { box: boxOf(red.piv) }) })));
        const hiC = new Map(pc.map((j, q) => [j, RAINBOW[q % 4]]));
        out.append(K.card('Column space: the pivot columns of $A$ itself', flowSteps([
          r ? { text: 'The leading $1$s of $R$ are in column' + (r > 1 ? 's ' : ' ') + and(pc.map(j => '$' + (j + 1) + '$')) + '. Take those columns of the <b>original</b> $A$ (not of $R$):', tex: 'A = ' + mtex(A, { cols: hiC }) + '\\quad\\Longrightarrow\\quad ' + colsB.map(v => vcol(v)).join(',\\ ') }
            : { text: '$A$ is the zero matrix: its column space is just $\\{0\\}$, with the empty basis.' },
          { text: 'Why the original columns: row operations change the columns, but not the relations between them. In $R$ every non-pivot column is a combination of the pivot columns and the pivot columns are independent, so the same holds in $A$ (lecture 4.4).' },
          { text: 'So the column space (a subspace of $\\mathbb{R}^{' + m + '}$) has dimension $' + r + '$.', tex: '\\dim(\\text{column space}) = ' + r },
        ])));
        out.append(K.card('Row space: the non-zero rows of $R$', flowSteps([
          r ? { text: 'Row operations only combine rows, so the rows of $R$ span the same row space as the rows of $A$. The non-zero rows of an echelon form are independent, so they form a basis:', tex: mtex(red.rref, { rows: new Map(range(0, r - 1).map(q => [q, 'pick'])), box: boxOf(red.piv) }) + '\\quad\\Longrightarrow\\quad ' + rowsB.map(v => tup(v)).join(',\\ ') }
            : { text: '$A$ is the zero matrix: its row space is $\\{0\\}$.' },
          { text: 'So the row space (a subspace of $\\mathbb{R}^{' + n + '}$) has dimension $' + r + '$, the same number.', tex: '\\dim(\\text{row space}) = ' + r + ' = \\rank A' },
        ])));
        const other = range(0, n - 1).filter(j => !pc.includes(j));
        const chk = other.map(j => {
          const coef = red.piv.map(([row]) => red.rref[row][j]), comb = colsB.reduce((acc, v, q) => vadd(acc, vsc(coef[q], v)), cols[j].map(() => Z));
          return { text: 'Column $' + (j + 1) + '$ of $R$ is $' + tup(red.rref.map(rw => rw[j])) + '$, so column $' + (j + 1) + '$ of $A$ is the same combination of the pivot columns:', tex: vcol(cols[j]) + ' = ' + (r ? coef.map((c, q) => P(c) + vcol(colsB[q])).join(' + ') : '0') + ' = ' + vcol(comb) + (eqM([comb], [cols[j]]) ? '\\ \\checkmark' : '') };
        });
        out.append(K.card('Check: the other columns are built from the pivot columns', chk.length ? flowSteps(chk) : K.p('Every column has a pivot: the columns of $A$ are independent and form a basis of the column space themselves.'),
          K.p('Rank $' + r + '$ with $' + n + '$ columns leaves $' + n + ' - ' + r + ' = ' + (n - r) + '$ free unknown' + (n - r === 1 ? '' : 's') + ' for $Ax = 0$: see ' + link('null-space', { A: s.v.A }, 'Null space') + '.')));
      }
      draw();
    },

    /* ---------------------------------------------------------------- null space */
    // ?A=1,2,0,3;2,3,0,3;1,1,1,2    any matrix up to 4 × 5
    'null-space'(el, query, ctx) {
      const s = K.state(ctx, { A: '1,2,0,3;2,3,0,3;1,1,1,2' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L5.1 · nullity $2$', q: { A: '1,1,1;2,2,2;3,3,3' }, src: 'lecture 5.1 at 13:00: $x_1$ is dependent, $x_2, x_3$ are independent, and $(-1, 1, 0)$, $(-1, 0, 1)$ is a basis.' },
        { label: 'L5.2 · a $3\\times 4$', q: { A: '1,2,0,3;2,3,0,3;1,1,1,2' }, src: 'lecture 5.2 at 00:00: the reduced form is $[1\\ 0\\ 0\\ {-3};\\ 0\\ 1\\ 0\\ 3;\\ 0\\ 0\\ 1\\ 2]$ and the basis is $(3, -3, -2, 1)$.' },
        { label: 'L6.3 · kernel of $T$', q: { A: '2,4,6,8;1,3,0,5;1,1,6,3' }, src: 'lecture 6.3 at 06:30: $x_3 = s$, $x_4 = t$ free, basis $(-9, 3, 1, 0)$ and $(-2, -1, 0, 1)$.' },
        { label: 'Invertible: only $0$', q: { A: '2,1;1,1' } },
      ];
      controls.append(
        K.p('The <b>null space</b> of $A$ is the set of all solutions of $Ax = 0$. Its dimension, the <b>nullity</b>, is the number of free (independent) variables.'),
        matEditor({ label: 'Matrix $A$', value: s.v.A, rows: [1, 4], cols: [1, 5], onChange: str => s.set({ A: str }) }),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RA = readMat(s.v.A, '$A$', { maxC: 5 });
        if (RA.err) return out.append(K.note(RA.err, 'warn'));
        const A = RA.M, n = A[0].length, red = reduce(A, n, true), r = red.piv.length, pc = red.piv.map(([, c]) => c);
        const { sol, names, basis, gen } = nullBasis(red.rref, red.piv, n), k = basis.length;
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        out.append(flowAnswer('Null space of $A$, nullity $' + k + '$', k ? 'N(A) = \\span\\{' + basis.map(v => tup(v)).join(',\\ ') + '\\}' : 'N(A) = \\{0\\}', 'Rank $' + r + '$ + nullity $' + k + '$ = $' + n + '$, the number of columns.'));
        out.append(K.card('Row reduce $A$', K.p('$Ax = 0$ has right-hand sides $0$, and they stay $0$ under row operations, so the zero column is left out (lecture 5.1).'), opSteps(red.ops, 0, 'Nothing to do: $A$ is already in reduced row echelon form.', { text: 'The reduced form $R$; $Ax = 0$ and $Rx = 0$ have the same solutions:', tex: 'R = ' + mtex(red.rref, { box: boxOf(red.piv) }) })));
        const fv = range(0, n - 1).filter(j => !pc.includes(j));
        out.append(K.card('Dependent and independent variables', flowSteps([
          { text: 'A column with a leading $1$ gives a <b>dependent</b> variable; every other column gives an <b>independent</b> (free) variable.', tex: '\\text{dependent: } ' + (pc.length ? pc.map(j => names[j]).join(',\\ ') : '\\text{none}') + '\\qquad \\text{independent: } ' + (fv.length ? fv.map(j => names[j]).join(',\\ ') : '\\text{none}') },
          { text: 'The nullity is the number of independent variables.', tex: '\\nullity A = ' + k },
        ])));
        if (!k) { out.append(K.card('Only the zero vector', K.p('Every variable is dependent, so $Rx = 0$ forces $x = 0$: the null space is $\\{0\\}$ and its basis is empty.'))); }
        else {
          out.append(K.card('Solve $Rx = 0$', flowSteps([...sol.steps, { text: 'All the solutions:', tex: 'x = ' + gen.tex }])));
          out.append(K.card('A basis: one vector per independent variable', flowSteps(sol.free.map((j, q) => ({
            text: 'Put $' + sol.pn[q] + ' = 1$' + (k > 1 ? ' and the other free values $0$' : '') + ':', tex: 'v_{' + (q + 1) + '} = ' + vcol(basis[q]),
          }))), K.p('Each basis vector has a $1$ where the others have $0$ (in its own free variable), so they are independent, and every solution is $' + sol.pn.map((p, q) => p + 'v_{' + (q + 1) + '}').join(' + ') + '$: they span the null space.')));
        }
        const chk = [{ text: 'Rank–nullity theorem: the rank (dependent variables) plus the nullity (independent variables) is the number of columns.', tex: '\\rank A + \\nullity A = ' + r + ' + ' + k + ' = ' + n + '\\ \\checkmark' }];
        basis.forEach((v, q) => chk.push({ text: 'Each basis vector solves $Ax = 0$:', tex: 'A v_{' + (q + 1) + '} = ' + mtex(A) + vcol(v) + ' = ' + vcol(A.map(row => dot(row, v))) + '\\ \\checkmark' }));
        out.append(K.card('Check', flowSteps(chk)));
      }
      draw();
    },

    /* ---------------------------------------------------------------- linear maps */
    // ?by=images&T=1,0;1,2       T(e1) = (1, 0), T(e2) = (1, 2): one image per group, up to 4 images of up to 4 entries
    // ?by=formula&f=(x+y,2y)     entries separated by commas; variables x, y, z, w or x1 … x4
    'linear-map'(el, query, ctx) {
      const s = K.state(ctx, { by: 'images', T: '1,0;1,2', f: '(x + y, 2y)' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L6.1 · $(x, y)\\mapsto(2x, y)$', q: { by: 'formula', f: '(x, y) -> (2x, y)' }, src: 'lecture 6.1 at 11:30: the matrix is $\\begin{bmatrix}2&0\\\\0&1\\end{bmatrix}$; lecture 6.2 at 03:30: the kernel is $\\{0\\}$ and the image is all of $\\mathbb{R}^2$.' },
        { label: 'L6.2 · $(x, y)\\mapsto(2x, 0)$', q: { by: 'formula', f: '(x, y) -> (2x, 0)' }, src: 'lecture 6.2 at 05:30: the kernel is the $y$-axis and the image is the $x$-axis.' },
        { label: 'L6.3 · $T:\\mathbb{R}^4\\to\\mathbb{R}^3$', q: { by: 'formula', f: '(2x1+4x2+6x3+8x4, x1+3x2+5x4, x1+x2+6x3+3x4)' }, src: 'lecture 6.3 at 03:30: kernel basis $(-9,3,1,0)$, $(-2,-1,0,1)$; image basis $(2,1,1)$, $(4,3,1)$.' },
        { label: 'Rotate by $90^\\circ$', q: { by: 'images', T: '0,1;-1,0' } },
        { label: 'Shear', q: { by: 'images', T: '1,0;1,1' } },
      ];
      // also by=image(s)|basis|formula|f; with no "by", a link with f= is a formula and one with T= gives images
      const by0 = String((query || {}).by || '').toLowerCase();
      s.v.by = /^(images?|basis)$/.test(by0) ? 'images' : /^(formula|f)$/.test(by0) ? 'formula' : (query || {}).f && !(query || {}).T ? 'formula' : 'images';
      function ui() {
        controls.innerHTML = '';
        controls.append(
          K.p('A <b>linear map</b> $T$ sends vectors to vectors and keeps sums and multiples: $T(u + v) = T(u) + T(v)$, $T(cu) = cT(u)$. It is fixed by where it sends $e_1, e_2, \\dots$, and those images are the columns of its matrix.'),
          K.seg({ label: 'Give the map by', options: [['images', 'Images of e₁, e₂, …'], ['formula', 'A formula']], value: s.v.by, onChange: v => { s.set({ by: v }, true); ui(); draw(); } }));
        if (s.v.by === 'images') controls.append(matEditor({ label: 'Images, one per row: row $j$ is $T(e_j)$', value: s.v.T, rows: [1, 4], cols: [1, 4], rowWord: 'Number of basis vectors $n$ (domain $\\mathbb{R}^n$)', colWord: 'Entries of each image $m$ (codomain $\\mathbb{R}^m$)', rowName: i => 'T(e_{' + (i + 1) + '})', onChange: str => s.set({ T: str }) }));
        else controls.append(K.text({ label: 'Formula for $T$', value: s.v.f, placeholder: '(x + y, 2y)', onChange: v => s.set({ f: v }), help: 'Entries separated by commas, each a sum of terms like $2x$, $-y$ or $\\tfrac12 z$. Variables $x, y, z, w$ or $x_1, \\dots, x_4$ (type x1). For example (x + y, 2y) or (2x1 + 4x2, x3). To keep an input the formula does not use, name the inputs first: (x, y) -> (2x, 0).' }));
        controls.append(tryChips(ctx, TRY));
      }
      /** "(x + y, 2y)" → { A (m × n) } or { err } */
      function parseMap(src) {
        let t = String(src || '').replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·*]/g, '');
        const arrow = Math.max(t.lastIndexOf('->'), t.lastIndexOf('↦'), t.lastIndexOf('→'), t.lastIndexOf('='));
        // the inputs, when named on the left ("(x, y) -> …" or "T(x, y) = …"), fix the domain even if a variable is unused
        let nIn = 0;
        if (arrow >= 0) {
          (t.slice(0, arrow).match(/[xyzw][1-4]?/g) || []).forEach(v => { nIn = Math.max(nIn, v.length > 1 ? +v[1] : { x: 1, y: 2, z: 3, w: 4 }[v]); });
          t = t.slice(arrow + (t[arrow] === '-' ? 2 : 1));
        }
        if (t.startsWith('(') && t.endsWith(')')) t = t.slice(1, -1);
        if (!t) return { err: 'Type a formula such as (x + y, 2y).' };
        const comps = t.split(',');
        if (comps.length > 4) return { err: 'At most 4 entries (a map into $\\mathbb{R}^4$).' };
        const VARS = { x: 1, y: 2, z: 3, w: 4 };
        let n = 0;
        const rows = [];
        for (let ci = 0; ci < comps.length; ci++) {
          const c = comps[ci];
          if (!c) return { err: 'Entry ' + (ci + 1) + ' is empty.' };
          const terms = c.match(/[+-]?[^+-]+/g);
          if (!terms || terms.join('') !== c) return { err: 'Entry ' + (ci + 1) + ' could not be read: write terms like 2x, -y or 1/2z.' };
          const row = [Z, Z, Z, Z];
          for (const tm of terms) {
            const mm = /^([+-]?)(\d+(?:\.\d+)?(?:\/\d+)?|\.\d+)?(?:([xyzw])([1-4])?)?$/.exec(tm);
            if (!mm || (!mm[2] && !mm[3])) return { err: 'Entry ' + (ci + 1) + ': write each term as a number times one variable, like 2x or -3/4y (no products like xy, no powers).' };
            let a = mm[2] ? num(mm[2]) : ONE;
            if (mm[1] === '-') a = a.neg();
            if (!mm[3]) { if (!a.isZero()) return { err: 'Entry ' + (ci + 1) + ' has a constant term. A linear map sends $0$ to $0$, so constants are not allowed.' }; continue; }
            const v = mm[4] ? +mm[4] : VARS[mm[3]];
            if (mm[4] && mm[3] !== 'x') return { err: 'Use x1, x2, x3, x4 (or x, y, z, w).' };
            row[v - 1] = row[v - 1].add(a);
            n = Math.max(n, v);
          }
          rows.push(row);
        }
        if (nIn && n > nIn) return { err: 'The formula uses a variable that is not among the inputs on the left.' };
        n = nIn || n || 1;
        return { A: rows.map(r => r.slice(0, n)) };
      }
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        let A, imgs = null;
        if (s.v.by === 'images') {
          const RT = readVecs(s.v.T, 'the list of images', 4, 4);
          if (RT.err) return out.append(K.note(RT.err, 'warn'));
          imgs = RT.M; A = tr(imgs);
        } else {
          let p; try { p = parseMap(s.v.f); } catch (e) { p = { err: 'A number in the formula could not be read.' }; }
          if (p.err) return out.append(K.note(p.err, 'warn'));
          A = p.A;
        }
        const m = A.length, n = A[0].length, names = n <= 3 ? ['x', 'y', 'z'].slice(0, n) : xs(n);
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        const red = reduce(A, n, true), r = red.piv.length, pc = red.piv.map(([, c]) => c);
        const { sol, basis } = nullBasis(red.rref, red.piv, n);
        const cols = tr(A), imB = pc.map(j => cols[j]);
        const set = vs => (vs.length ? '\\{' + vs.map(v => tup(v)).join(',\\ ') + '\\}' : '\\{0\\}');
        const formula = 'T' + tupNames(names) + ' = (' + A.map(row => lin(row, names)).join(',\\ ') + ')';
        out.append(flowAnswer('$T:\\mathbb{R}^{' + n + '}\\to\\mathbb{R}^{' + m + '}$', '\\begin{aligned}A &= ' + mtex(A) + ' \\\\ \\ker T &= ' + (basis.length ? '\\span' : '') + set(basis) + ' \\\\ \\Im T &= ' + (r ? '\\span' : '') + set(imB) + '\\end{aligned}'));
        // the matrix
        const e = j => range(0, n - 1).map(q => (q === j ? ONE : Z));
        const mst = [];
        if (imgs) {
          mst.push({ text: 'The matrix of $T$ (standard bases) has $T(e_j)$ as its column $j$ (lecture 6.1):', tex: 'A = [\\,T(e_1)\\ \\cdots\\ T(e_{' + n + '})\\,] = ' + mtex(A, { cols: new Map(range(0, n - 1).map(j => [j, RAINBOW[j % 4]])) }) });
          mst.push({ text: 'Any $x$ is $x_1e_1 + \\dots$, and $T$ keeps sums and multiples, so $T(x) = x_1T(e_1) + \\dots = Ax$. As a formula:', tex: 'T' + tupNames(names) + ' = ' + names.map((x, j) => x + vcol(cols[j])).join(' + ') + ' = ' + vcolT(A.map(row => lin(row, names))) });
        } else {
          /** one entry of the formula with the numbers of e_j put in: "1 + 0", "2\cdot 0" */
          const put = (row, vals) => {
            const used = row.map((a, q) => [a, q]).filter(([a]) => !a.isZero());
            if (!used.length) return '0';
            return used.map(([a, q], w) => { const neg = a.cmp(0) < 0, m = neg ? a.neg() : a; return (w ? (neg ? ' - ' : ' + ') : neg ? '-' : '') + (m.eq(1) ? P(vals[q]) : T(m) + '\\cdot ' + P(vals[q])); }).join('');
          };
          range(0, n - 1).forEach(j => {
            const ej = e(j);
            mst.push({ text: j === 0 ? 'Put each standard basis vector into the formula; $T(e_j)$ becomes column $j$ of the matrix (lecture 6.1).' : '', tex: 'T(e_{' + (j + 1) + '}) = T' + tup(ej) + ' = (' + A.map(row => put(row, ej)).join(',\\ ') + ') = ' + tup(cols[j]) });
          });
          mst.push({ text: 'Those images are the columns, and $T(x) = Ax$:', tex: 'A = ' + mtex(A) + ',\\qquad ' + formula });
        }
        out.append(K.card('The matrix of $T$', flowSteps(mst)));
        out.append(K.card('Kernel: everything $T$ sends to $0$', flowSteps([
          { text: '$\\ker T$ is the set of $x$ with $T(x) = 0$, that is $Ax = 0$: the null space of $A$. Row reduce $A$ (the steps are below):', tex: 'R = ' + mtex(red.rref, { box: boxOf(red.piv) }) },
          ...(basis.length ? [...sol.steps, { text: 'One basis vector per free variable (that one $1$, the others $0$):', tex: '\\ker T = \\span\\{' + basis.map(v => tup(v)).join(',\\ ') + '\\},\\qquad \\dim\\ker T = ' + basis.length }]
            : [{ text: 'Every column has a leading $1$: only $x = 0$ is sent to $0$.', tex: '\\ker T = \\{0\\},\\qquad \\dim\\ker T = 0' }]),
        ]), more('Row reduction steps', opSteps(red.ops, 0, 'Nothing to do: $A$ is already reduced.'))));
        out.append(K.card('Image: everything $T$ can reach', flowSteps([
          { text: '$\\Im T$ is the set of all $T(x) = Ax = x_1(\\text{column } 1) + \\dots$: the column space of $A$. The pivot columns of $A$ form a basis (lecture 6.3).', tex: r ? '\\Im T = \\span\\{' + imB.map(v => tup(v)).join(',\\ ') + '\\},\\qquad \\dim\\Im T = \\rank A = ' + r : '\\Im T = \\{0\\}' },
        ])));
        out.append(K.card('Check: rank–nullity', flowSteps([
          { text: 'The dimensions of the kernel and the image add up to the dimension of the domain $\\mathbb{R}^{' + n + '}$:', tex: '\\dim\\ker T + \\dim\\Im T = ' + basis.length + ' + ' + r + ' = ' + n + '\\ \\checkmark' },
          { text: (basis.length ? '$T$ is <b>not one-to-one</b>: the kernel is more than $\\{0\\}$.' : '$T$ is <b>one-to-one</b>: its kernel is $\\{0\\}$.') + ' ' + (r === m ? '$T$ is <b>onto</b>: the image is all of $\\mathbb{R}^{' + m + '}$.' : '$T$ is <b>not onto</b>: the image has dimension $' + r + ' < ' + m + '$.') },
        ])));
        if (m === 2 && n === 2) {
          const c1 = num2(cols[0]), c2 = num2(cols[1]), sum = [c1[0] + c2[0], c1[1] + c2[1]], d = det(A);
          out.append(K.card('Picture: the unit square and its image', K.p('The grey square has corners $0$, $e_1$, $e_1 + e_2$, $e_2$. $T$ sends it to the purple shape with corners $0$, $T(e_1)$, $T(e_1) + T(e_2)$, $T(e_2)$. Its area is $|\\det A| = ' + T(d.cmp(0) < 0 ? d.neg() : d) + '$ times the square\'s' + (d.isZero() ? ': it is squashed flat onto a line or a point.' : d.cmp(0) < 0 ? ', and the order of the corners is flipped (det is negative).' : '.')),
            plot({ label: 'unit square and its image', polys: [{ pts: [[0, 0], [1, 0], [1, 1], [0, 1]], c: 5 }, { pts: [[0, 0], c1, sum, c2], c: 4 }], vecs: [{ to: [1, 0], c: 1, label: 'e₁', dash: true }, { to: [0, 1], c: 2, label: 'e₂', dash: true }, { to: c1, c: 1, label: 'T(e₁)' }, { to: c2, c: 2, label: 'T(e₂)' }] })));
        } else out.append(K.note('The picture of the unit square needs a map from $\\mathbb{R}^2$ to $\\mathbb{R}^2$ (two images with two entries each).'));
      }
      const tupNames = names => '(' + names.join(',\\ ') + ')';
      ui();
      draw();
    },

    /* ---------------------------------------------------------------- length, angle, projection */
    // ?u=1,3&v=3,1    two vectors with 1 to 4 entries each
    'inner-product'(el, query, ctx) {
      const s = K.state(ctx, { u: '1,3', v: '3,1' }, query, draw);
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L8.3 · project $(1, 3)$ on $(3, 1)$', q: { u: '1,3', v: '3,1' }, src: 'lecture 8.3 at 15:00: the projection is $(1.8,\\ 0.6)$.' },
        { label: 'L7.3 · $(3, 4)$ and $(2, 7)$', q: { u: '3,4', v: '2,7' }, src: 'lecture 7.3 at 00:30 and 03:00: $(3, 4)\\cdot(2, 7) = 34$ and the length of $(3, 4)$ is $5$.' },
        { label: 'L7.3 · $45^\\circ$ in $\\mathbb{R}^3$', q: { u: '1,0,0', v: '1,0,1' }, src: 'lecture 7.3 at 16:30: $\\cos\\theta = \\tfrac{1}{\\sqrt2}$, so $\\theta = 45^\\circ$.' },
        { label: 'L7.3 · $(1, 0, 0)$ and $(1, 1, 1)$', q: { u: '1,0,0', v: '1,1,1' }, src: 'lecture 7.3 at 17:30: $\\cos\\theta = \\tfrac{1}{\\sqrt3}$, about $54^\\circ$.' },
        { label: 'Perpendicular', q: { u: '2,1', v: '-1,2' } },
      ];
      controls.append(
        K.p('The dot product $u\\cdot v$ gives lengths, the angle between two vectors, and the shadow (projection) of one vector on the line of the other.'),
        matEditor({ label: 'Vectors $u$ and $v$', value: s.v.u + ';' + s.v.v, rows: [2, 2], cols: [1, 4], colWord: 'Entries in each vector', rowName: i => (i ? 'v' : 'u'), onChange: str => { const [u, v] = str.split(';'); s.set({ u, v }); } }),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const U = readVecs(s.v.u, '$u$', 1, 4), V = readVecs(s.v.v, '$v$', 1, 4);
        if (U.err || V.err) return out.append(K.note(U.err || V.err, 'warn'));
        const u = U.M[0], v = V.M[0], n = u.length;
        if (v.length !== n) return out.append(K.note('$u$ and $v$ need the same number of entries.', 'warn'));
        const uv = dot(u, v), uu = dot(u, u), vv = dot(v, v), nu = surd(uu), nv = surd(vv);
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        const sq = (w, nm) => '\\|' + nm + '\\| = \\sqrt{' + nm + '\\cdot ' + nm + '} = \\sqrt{' + w.map(sqT).join(' + ') + '} = ' + rootTex(dot(w, w));
        let cosS = null, deg = null;
        if (!uu.isZero() && !vv.isZero()) {
          const S = surd(uu.mul(vv));
          cosS = { k: uv.div(S.k).div(F(S.r)), r: S.r };
          const c2 = uv.mul(uv).div(uu.mul(vv)), sg = uv.cmp(0);
          const exact = [[F(1), 0], [F(3, 4), 30], [F(1, 2), 45], [F(1, 4), 60], [Z, 90]].find(([q]) => q.eq(c2));
          deg = exact ? { exact: true, v: sg < 0 ? 180 - exact[1] : exact[1] } : { exact: false, v: Math.acos(Math.max(-1, Math.min(1, surdNum(cosS)))) * 180 / Math.PI };
        }
        const proj = vv.isZero() ? u.map(() => Z) : vsc(uv.div(vv), v), perp = vsub(u, proj);
        const degT = deg ? (deg.exact ? '= ' + deg.v + '^\\circ' : '\\approx ' + r4(deg.v) + '^\\circ') : '';
        out.append(flowAnswer('Dot product, lengths, angle, projection', '\\begin{aligned}u\\cdot v &= ' + T(uv) + ' \\\\ \\|u\\| &= ' + rootTex(uu) + ' \\\\ \\|v\\| &= ' + rootTex(vv) + ' \\\\ ' +
          (cosS ? '\\cos\\theta &= ' + surdTex(cosS) + ',\\quad \\theta ' + degT : '\\theta &\\ \\text{is not defined (a zero vector)}') + ' \\\\ \\operatorname{proj}_v u &= ' + vAns(proj) + '\\end{aligned}'));
        out.append(K.card('Dot product', flowSteps([{ text: 'Multiply matching entries and add:', tex: 'u\\cdot v = ' + u.map((a, i) => P(a) + '\\cdot ' + P(v[i])).join(' + ') + ' = ' + sumTex(u.map((a, i) => a.mul(v[i]))) + ' = ' + T(uv) }])));
        out.append(K.card('Lengths', flowSteps([
          { text: 'The length (norm) of a vector is the square root of its dot product with itself: Pythagoras in $' + n + '$ dimension' + (n > 1 ? 's' : '') + ' (lecture 7.3).', tex: sq(u, 'u') },
          { tex: sq(v, 'v') },
        ])));
        const ang = [];
        if (cosS) {
          const S = surd(uu.mul(vv));
          ang.push({ text: 'The angle $\\theta$ between $u$ and $v$ comes from', tex: '\\cos\\theta = \\frac{u\\cdot v}{\\|u\\|\\,\\|v\\|} = \\frac{' + T(uv) + '}{\\sqrt{' + T(uu) + '}\\,\\sqrt{' + T(vv) + '}} = \\frac{' + T(uv) + '}{\\sqrt{' + T(uu.mul(vv)) + '}}' + (S.r === 1n ? ' = \\frac{' + T(uv) + '}{' + T(S.k) + '}' : '') + ' = ' + surdTex(cosS) + (cosS.r === 1n && cosS.k.isInt() ? '' : ' \\approx ' + r4(surdNum(cosS))) });
          ang.push({ text: deg.exact ? 'This is a value from the table of cosines:' : 'Take the inverse cosine (a calculator gives degrees):', tex: '\\theta = \\cos^{-1}\\left(' + surdTex(cosS) + '\\right) ' + degT });
          ang.push({ text: uv.isZero() ? '$u\\cdot v = 0$: the vectors are <b>orthogonal</b> (perpendicular).' : 'The vectors are not orthogonal: $u\\cdot v = ' + T(uv) + ' \\neq 0$. ' + (uv.cmp(0) > 0 ? 'A positive dot product means $\\theta < 90^\\circ$.' : 'A negative dot product means $\\theta > 90^\\circ$.') });
        } else ang.push({ text: 'One of the vectors is the zero vector: it has no direction, so there is no angle. It is orthogonal to every vector, since its dot product with anything is $0$.' });
        out.append(K.card('Angle and orthogonality', flowSteps(ang)));
        const pst = [];
        if (vv.isZero()) pst.push({ text: '$v$ is the zero vector, so the projection on it is taken to be $0$ (lecture 8.3).', tex: '\\operatorname{proj}_v u = 0' });
        else {
          pst.push({ text: 'The projection of $u$ on $v$ is the point of the line through $v$ closest to $u$: the shadow of $u$ (lecture 8.3).', tex: '\\operatorname{proj}_v u = \\frac{u\\cdot v}{v\\cdot v}\\,v = \\frac{' + T(uv) + '}{' + T(vv) + '}' + tup(v) + ' = ' + tup(proj) });
          pst.push({ text: 'What is left, $u - \\operatorname{proj}_v u$, is perpendicular to $v$:', tex: 'u - \\operatorname{proj}_v u = ' + tup(u) + ' - ' + tup(proj) + ' = ' + tup(perp) + ',\\qquad (u - \\operatorname{proj}_v u)\\cdot v = ' + sumTex(perp.map((a, i) => a.mul(v[i]))) + ' = ' + T(dot(perp, v)) + '\\ \\checkmark' });
          pst.push({ text: 'Check with Pythagoras: the two pieces are perpendicular, so their squared lengths add up to $\\|u\\|^2$.', tex: '\\|\\operatorname{proj}_v u\\|^2 + \\|u - \\operatorname{proj}_v u\\|^2 = ' + T(dot(proj, proj)) + ' + ' + T(dot(perp, perp)) + ' = ' + T(dot(proj, proj).add(dot(perp, perp))) + ' = \\|u\\|^2\\ \\checkmark' });
        }
        if (cosS) pst.push({ text: 'Check the Cauchy–Schwarz inequality $|u\\cdot v| \\le \\|u\\|\\,\\|v\\|$, squared to avoid roots:', tex: '(u\\cdot v)^2 = ' + T(uv.mul(uv)) + ' \\le ' + T(uu) + '\\cdot ' + T(vv) + ' = ' + T(uu.mul(vv)) + '\\ \\checkmark' });
        out.append(K.card('Projection of $u$ on $v$', flowSteps(pst)));
        if (!uu.isZero() && !vv.isZero()) {
          let pu, pv, pp;
          if (n === 2) { pu = num2(u); pv = num2(v); pp = num2(proj); }
          else { const L = Math.sqrt(fnum(vv)), Lu = Math.sqrt(fnum(uu)), th = deg.v * Math.PI / 180; pv = [L, 0]; pu = [Lu * Math.cos(th), Lu * Math.sin(th)]; pp = [fnum(uv) / L, 0]; }
          const a0 = Math.atan2(pv[1], pv[0]), a1 = Math.atan2(pu[1], pu[0]);
          let lo = a0, hi = a1;
          if (hi - lo > Math.PI) lo += 2 * Math.PI; else if (lo - hi > Math.PI) hi += 2 * Math.PI;
          out.append(K.card('Picture', K.p(n === 2 ? 'The dashed line drops from the tip of $u$ to the line of $v$ at a right angle; it lands on the projection.' : 'Any two vectors lie in one plane through the origin. The drawing shows that plane with $v$ along the horizontal: same lengths, same angle.'),
            plot({ label: 'u, v and the projection', vecs: [{ from: pu, to: pp, c: 5, dash: true }, { to: pv, c: 2, label: 'v' }, { to: pu, c: 1, label: 'u' }, { to: pp, c: 4, label: 'proj' }], arc: { a0: lo, a1: hi, r: 30 } })));
        }
      }
      draw();
    },

    /* ---------------------------------------------------------------- Gram–Schmidt */
    // ?x=1,2,2;-1,0,2;0,0,1    2 to 4 vectors with 2 to 4 entries each, one vector per group
    'gram-schmidt'(el, query, ctx) {
      const s = K.state(ctx, { x: '1,2,2;-1,0,2;0,0,1' }, query, draw);
      if (query && !query.x && query.v) s.v.x = query.v;   // also ?v=…
      const { controls, out } = layout(el);
      const TRY = [
        { label: 'L8.4 · $(1,2,2), (-1,0,2), (0,0,1)$', q: { x: '1,2,2;-1,0,2;0,0,1' }, src: 'lecture 8.4 at 04:00 to 12:30: the orthonormal basis is $(\\tfrac13, \\tfrac23, \\tfrac23)$, $(-\\tfrac23, -\\tfrac13, \\tfrac23)$, $(\\tfrac23, -\\tfrac23, \\tfrac13)$.' },
        { label: 'Two vectors in $\\mathbb{R}^2$', q: { x: '3,1;2,2' } },
        { label: 'A dependent list', q: { x: '1,1,0;2,2,0;0,0,1' } },
        { label: 'Four in $\\mathbb{R}^4$', q: { x: '1,1,0,0;1,0,1,0;0,1,1,1;1,1,1,1' } },
      ];
      controls.append(
        K.p('Gram–Schmidt turns a list of independent vectors into perpendicular vectors of length $1$ (an orthonormal list) that span the same space: from each vector, subtract its shadows on the ones already made.'),
        matEditor({ label: 'Vectors $x_1, x_2, \\dots$, one per row', value: s.v.x, rows: [2, 4], cols: [2, 4], rowWord: 'Number of vectors', colWord: 'Entries in each vector', rowName: i => 'x_{' + (i + 1) + '}', onChange: str => s.set({ x: str }) }),
        tryChips(ctx, TRY));
      function draw() { out.innerHTML = ''; guard(out, body); }
      function body() {
        const RX = readVecs(s.v.x, 'the list of vectors', 4, 4);
        if (RX.err) return out.append(K.note(RX.err, 'warn'));
        const X = RX.M, k = X.length, n = X[0].length;
        const src = fromNote(TRY, s.v); if (src) out.append(src);
        const vs = [], cards = [];
        X.forEach((x, i) => {
          const st = [];
          if (!vs.length) {
            if (isZeroV(x)) { st.push({ text: '$x_{' + (i + 1) + '}$ is the zero vector: it adds no direction, so it is skipped.' }); cards.push(K.card('Vector $x_{' + (i + 1) + '}$', flowSteps(st))); return; }
            vs.push({ i, v: x });
            cards.push(K.card('Step 1: keep the first vector', flowSteps([{ text: 'The first vector keeps its direction:', tex: 'v_1 = x_{' + (i + 1) + '} = ' + tup(x) }])));
            return;
          }
          let w = x;
          const terms = vs.map((p, q) => {
            const a = dot(x, p.v), b = dot(p.v, p.v), c = a.div(b);
            st.push({ text: 'The shadow of $x_{' + (i + 1) + '}$ on $v_{' + (q + 1) + '}$ has coefficient $\\frac{x_{' + (i + 1) + '}\\cdot v_{' + (q + 1) + '}}{v_{' + (q + 1) + '}\\cdot v_{' + (q + 1) + '}}$:', tex: '\\frac{' + sumTex(x.map((e, j) => e.mul(p.v[j]))) + '}{' + sumTex(p.v.map(e => e.mul(e))) + '} = \\frac{' + T(a) + '}{' + T(b) + '} = ' + T(c) });
            w = vsub(w, vsc(c, p.v));
            return { c, q };
          });
          const wt = 'v_{' + (vs.length + 1) + '}';
          const sgn = t => { const m = t.c.cmp(0) < 0 ? t.c.neg() : t.c; return (t.c.cmp(0) < 0 ? ' + ' : ' - ') + (m.eq(1) ? '' : tf(m)); };
          st.push({ text: 'Subtract the shadows from $x_{' + (i + 1) + '}$:', tex: wt + ' = x_{' + (i + 1) + '}' + terms.map(t => sgn(t) + (t.c.isZero() ? '\\,' : '') + 'v_{' + (t.q + 1) + '}').join('') + ' = ' + tup(x) + terms.map(t => sgn(t) + tup(vs[t.q].v)).join('') + ' = ' + tup(w) });
          if (isZeroV(w)) {
            st.push({ text: 'Nothing is left: $x_{' + (i + 1) + '}$ lies in the span of the earlier vectors (the list is <b>dependent</b>), so it adds no new direction and is skipped.' });
            cards.push(K.card('Vector $x_{' + (i + 1) + '}$: nothing new', flowSteps(st)));
            return;
          }
          st.push({ text: 'Check: the new vector is perpendicular to every earlier one.', tex: vs.map((p, q) => wt + '\\cdot v_{' + (q + 1) + '} = ' + T(dot(w, p.v))).join(',\\qquad ') + '\\ \\checkmark' });
          vs.push({ i, v: w });
          cards.push(K.card('Step ' + vs.length + ': make $x_{' + (i + 1) + '}$ perpendicular to the earlier vectors', flowSteps(st)));
        });
        if (!vs.length) { out.append(K.note('Every vector is the zero vector: there is no direction to keep.', 'warn')); cards.forEach(c => out.append(c)); return; }
        const ws = vs.map(p => { const nn = surd(dot(p.v, p.v)); return { p, nn, w: p.v.map(e => ({ k: e.div(nn.k).div(F(nn.r)), r: nn.r })) }; });
        const wtex = w => '(' + w.map(surdTex).join(',\\ ') + ')';
        const wdec = w => '(' + w.map(e => r4(surdNum(e))).join(',\\ ') + ')';
        const rational = w => w.every(e => e.r === 1n);
        out.append(flowAnswer('An orthonormal basis of the span (' + vs.length + ' vector' + (vs.length > 1 ? 's' : '') + ')', '\\begin{aligned}' + ws.map((w, q) => 'w_{' + (q + 1) + '} &= ' + wtex(w.w) + (rational(w.w) && !fracIn([w.w.map(e => e.k)]) ? '' : ' \\\\ &\\approx ' + wdec(w.w))).join(' \\\\[4pt] ') + '\\end{aligned}',
          vs.length < k ? 'Only ' + vs.length + ' of your ' + k + ' vectors add a new direction: the list is dependent.' : 'Your ' + k + ' vectors are independent, so the span has dimension ' + k + '.'));
        out.append(K.card('The idea', K.p('The shadow (projection) of $x$ on $v$ is $\\frac{x\\cdot v}{v\\cdot v}v$ (lecture 8.3). Subtracting the shadows on all earlier vectors leaves a part perpendicular to all of them. The lecture\'s process (lecture 8.4) divides by the lengths as it goes, $v_i = x_i - \\sum_j (x_i\\cdot w_j)\\,w_j$; that gives the same vectors, since $(x\\cdot w)\\,w = \\frac{x\\cdot v}{v\\cdot v}v$ when $w = v/\\|v\\|$.')));
        cards.forEach(c => out.append(c));
        out.append(K.card('Normalise: divide each $v_i$ by its length', flowSteps(ws.map((w, q) => ({
          text: 'Length of $v_{' + (q + 1) + '}$, then $w_{' + (q + 1) + '} = v_{' + (q + 1) + '}/\\|v_{' + (q + 1) + '}\\|$:',
          tex: '\\|v_{' + (q + 1) + '}\\|^2 = ' + w.p.v.map(sqT).join(' + ') + ' = ' + T(dot(w.p.v, w.p.v)) + ',\\qquad \\|v_{' + (q + 1) + '}\\| = ' + rootTex(dot(w.p.v, w.p.v)) + ',\\qquad w_{' + (q + 1) + '} = ' + (w.nn.r === 1n ? (w.nn.k.eq(1) ? '' : coefTex(ONE.div(w.nn.k))) : '\\frac{1}{' + surdTex(w.nn) + '}') + tup(w.p.v) + ' = ' + wtex(w.w),
        })))));
        const G = vs.map(a => vs.map(b => dot(a.v, b.v)));
        out.append(K.card('Check: orthonormal', flowSteps([
          { text: 'All the dot products $v_i\\cdot v_j$ in a table: zeros off the diagonal mean the $v_i$ are mutually perpendicular; the diagonal holds the squared lengths.', tex: '[\\,v_i\\cdot v_j\\,] = ' + mtex(G, { cells: new Map(G.flatMap((r, i) => r.map((x, j) => [i + ',' + j, i === j ? 'x' : 'good']))) }) },
          { text: 'Dividing by the lengths keeps the zeros and turns the diagonal into $1$s, so $w_i\\cdot w_j = 0$ for $i \\neq j$ and $\\|w_i\\| = 1$:', tex: '[\\,w_i\\cdot w_j\\,] = ' + mtex(ident(vs.length)) + ' = I\\ \\checkmark' },
        ])));
        if (n === 2) out.append(K.card('Picture', K.p('The original vectors (dashed) and the orthonormal ones: perpendicular arrows of length $1$.'),
          plot({ label: 'Gram–Schmidt in the plane', vecs: [...X.map((x, i) => ({ to: num2(x), c: 5, dash: true, label: 'x' + '₁₂₃₄'[i] })), ...ws.map((w, q) => ({ to: w.w.map(surdNum), c: q ? 2 : 1, label: 'w' + '₁₂₃₄'[q] }))], extra: [[1, 1], [-1, -1]] })));
      }
      draw();
    },
  });
})();
