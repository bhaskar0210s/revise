/* Playground lab — Statistics I, Week 9 (L9.1–L9.6): random variables, PMF and CDF.   id 'lab-s1-pmf'
   X is made three ways:
     (a) from an experiment (one or two dice, n coins, one card, a box of tickets you type), with X typed as
         a formula of the outcome — the outcomes are sorted into the values of X;
     (b) a PMF you type;
     (c) a PMF formula with an unknown constant c, solved from Σp = 1 (finite sum written out, or an infinite
         geometric series a/(1 − r)).
   Panels: answer · outcomes sorted into values · PMF · the PMF rules checked · CDF with a and b ·
   probability calculator · how it is built · discrete vs continuous.  Rules: LABS.md. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const Fr = Lab.Frac;
  const STORE = 'lab:lab-s1-pmf';
  const tex = s => Lab.tex(s);
  const esc = s => Lab.esc(String(s));
  const clone = o => JSON.parse(JSON.stringify(o));

  /* ------------------------------------------------------- numbers: exact fractions when possible */
  const ex = v => v instanceof Fr && !v.approx;
  const fin = v => (v instanceof Fr && v.approx ? Number(v) : v);
  function toQ(v) {
    if (v instanceof Fr) return v.approx ? Number(v) : v;
    if (typeof v !== 'number' || !Number.isFinite(v)) return v;
    if (Number.isInteger(v)) return Number.isSafeInteger(v) ? F(v) : v;
    const f = Fr.fromDecimal(v);
    return f.approx ? v : f;
  }
  const add = (a, b) => (ex(a) && ex(b) ? fin(a.add(b)) : Number(a) + Number(b));
  const sub = (a, b) => (ex(a) && ex(b) ? fin(a.sub(b)) : Number(a) - Number(b));
  const mul = (a, b) => (ex(a) && ex(b) ? fin(a.mul(b)) : Number(a) * Number(b));
  const div = (a, b) => (ex(a) && ex(b) ? fin(a.div(b)) : Number(a) / Number(b));
  const sum = arr => arr.reduce((s, v) => add(s, v), F(0));
  const pw = (v, k) => { let r = F(1); for (let i = 0; i < k; i++) r = mul(r, v); return r; };
  const isZero = v => (ex(v) ? v.isZero() : Math.abs(Number(v)) < 1e-12);
  const same = (a, b) => (ex(a) && ex(b) ? a.eq(b) : Math.abs(Number(a) - Number(b)) <= 1e-9 * Math.max(1, Math.abs(Number(a))));
  const LE = (a, b) => Number(a) <= Number(b) + 1e-9;
  const LT = (a, b) => Number(a) < Number(b) - 1e-9;
  const EQ = (a, b) => Math.abs(Number(a) - Number(b)) <= 1e-9;
  const dec = (v, dp = 4) => Lab.fmtDec(Number(v), dp);
  const shortDec = v => Math.abs(Number(dec(v)) - Number(v)) < 1e-12;
  /** 1.524\times 10^{-4} */
  function sci(x, sig = 4) { const [m, e] = Number(x).toExponential(sig - 1).split('e'); return m.replace(/\.?0+$/, '') + '\\times 10^{' + Number(e) + '}'; }
  /** A decimal as TeX that stays honest for tiny values (scientific) and values just below 1. */
  function decStr(x, dp = 4) {
    x = Number(x);
    if (x === 0) return '0';
    const a = Math.abs(x);
    if (a < 0.001) return sci(x);
    if (a < 1 && 1 - a < Math.pow(10, -dp)) return (x < 0 ? '-' : '') + '(1-' + sci(1 - a, 3) + ')';
    return Lab.fmtDec(x, dp);
  }
  /** TeX of a number: the exact fraction when there is one, else a decimal. */
  const tx = v => (ex(v) ? (v.d === 1 ? String(v.n) : v.tex()) : decStr(v, 6));
  /** "=0.25" or "\approx 0.3333" after an exact non-whole fraction; empty otherwise. */
  const decTail = v => (ex(v) && v.d !== 1 ? (shortDec(v) ? '=' : '\\approx ') + decStr(v) : '');
  const par = v => (Number(v) < 0 ? '\\left(' + tx(v) + '\\right)' : tx(v));
  /** A number used as the base of a power: brackets unless it is a whole number ≥ 0. */
  const pbase = v => (ex(v) && v.d === 1 && v.n >= 0 ? tx(v) : '\\left(' + tx(v) + '\\right)');
  /** "x-1", "x", "x+2": the exponent x − s written simply. */
  const xMinus = s0 => (s0 === 0 ? 'x' : s0 > 0 ? 'x-' + s0 : 'x+' + -s0);
  /** A value as plain text (for SVG labels, code and hover text). */
  const vp = v => (ex(v) ? v.toString() : Lab.fmtDec(Number(v), 4)).replace(/^-/, '−');
  function listTex(vals, max = 10) {
    const t = vals.map(tx);
    return t.length <= max ? t.join(',\\ ') : t.slice(0, max - 3).join(',\\ ') + ',\\ \\dots,\\ ' + t.slice(-2).join(',\\ ');
  }
  function niceStep(x) {
    const p = Math.pow(10, Math.floor(Math.log10(x)));
    const m = x / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }
  /** Put numbers in place of the names in a typed formula: "max(d1,d2)" with d1 = 3, d2 = 4 → "max(3,4)". */
  function subst(src, vars) {
    return String(src).replace(/[A-Za-z_][A-Za-z_0-9]*/g, w => {
      if (!Object.prototype.hasOwnProperty.call(vars, w)) return w;
      const v = toQ(vars[w]);
      const s = vp(v).replace('−', '-');
      return Number(v) < 0 || !Number.isInteger(Number(v)) ? '(' + s + ')' : s;
    });
  }
  const varsIn = src => { try { return Lab.expr.vars(src); } catch (e) { return []; } };

  /* --------------------------------------------------------------------- tiny views */
  function table(head, rows, opts = {}) {
    const wrap = h('div', { class: 'tbl-wrap s6-tblw' + (opts.scroll ? ' s6-scrolly' : '') });
    const t = h('table', { class: 'tbl s6-tbl' });
    t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
    const tb = h('tbody');
    rows.forEach((r, i) => tb.appendChild(h('tr', { class: opts.hl && opts.hl(i) ? 'hl-row' : null }, r.map(c => h('td', { html: c })))));
    t.appendChild(tb);
    if (opts.foot) t.appendChild(h('tfoot', {}, h('tr', {}, opts.foot.map(c => h('td', { html: c })))));
    wrap.appendChild(t);
    return wrap;
  }
  /** K.steps, but each formula is inline \\displaystyle maths, so long lines wrap at = and + instead of scrolling. */
  const stepsW = list => K.steps(list.filter(Boolean).map(st0 => (st0.math ? Object.assign({}, st0, { html: (st0.html || '') + '<div class="s6-math">' + Lab.tex('\\displaystyle ' + st0.math) + '</div>', math: null }) : st0)));
  const checkItem = (state, title, body) => {
    const li = h('li', { class: state }, h('span', { class: 's6-mark', text: state === 'ok' ? '✓' : state === 'bad' ? '✗' : '–' }), h('div'));
    Lab.setHTML(li.lastChild, '<b>' + title + '</b> ' + body);
    return li;
  };
  /** Text box that accepts 7, 7.5, −2 or 7/2, plus a slider. onChange(string) only for readable input. */
  function pointField({ label, name, value, onChange }) {
    let lo = 0, hi = 10;
    const input = h('input', { class: 'field mono pl-num', type: 'text', value: String(value), spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': name });
    const range = h('input', { class: 'slider pl-range', type: 'range', min: lo, max: hi, step: 0.5, value: 0, 'aria-label': name + ' slider' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const msg = h('div', { class: 'pl-hint' });
    const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), msg);
    const paint = v => { const c = Math.max(lo, Math.min(hi, v)); range.value = c; range.style.setProperty('--pct', (hi > lo ? ((c - lo) / (hi - lo)) * 100 : 0) + '%'); };
    input.addEventListener('input', () => {
      const f = K.parseNum(input.value);
      if (f == null) { input.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Type a number, for example 4, 4.5, −2 or 7/2.</span>'); return; }
      input.classList.remove('bad');
      paint(Number(f));
      onChange(input.value.trim());
    });
    range.addEventListener('input', () => { const s = Lab.fmtDec(parseFloat(range.value), 4); input.value = s; input.classList.remove('bad'); paint(Number(s)); onChange(s); });
    wrap.setRange = (a, b, step) => { lo = a; hi = b; range.min = a; range.max = b; range.step = step; const f = K.parseNum(input.value); paint(f == null ? lo : Number(f)); };
    wrap.set = s => { input.value = s; input.classList.remove('bad'); const f = K.parseNum(s); if (f != null) paint(Number(f)); };
    wrap.hint = html => Lab.setHTML(msg, html || '');
    return wrap;
  }

  /* -------------------------------------------------------------------- experiments */
  const SUIT_NO = { '♠': 1, '♥': 2, '♦': 3, '♣': 4 };
  /** "c1+2*(1-c1)*c2+3*(1-c1)*(1-c2)*c3": the toss of the first head, 0 when there is none. */
  const firstHead = n => Lab.range(1, n).map(i => (i === 1 ? '' : i + '*') + Lab.range(1, i - 1).map(j => '(1-c' + j + ')*').join('') + 'c' + i).join('+');
  const coinSeqs = n => { const out = []; for (let m = 0; m < 1 << n; m++) { let s = ''; for (let k = n - 1; k >= 0; k--) s += (m >> k) & 1 ? 'T' : 'H'; out.push(s); } return out; };
  const ticket = v => h('span', { class: 's6-ticket', text: vp(toQ(v)) });
  function coinDraw(s) {
    if (s.length >= 5) return h('span', { class: 's6-seq' }, [...s].map(c => h('i', { class: c === 'H' ? 'h' : 't', text: c })));
    return h('span', { class: 's6-coins' }, [...s].map(c => Lab.draw.coin(c, { size: 15 })));
  }
  const EXPS = {
    die1: {
      label: 'One die',
      vars: () => ['d'],
      names: () => '<code>d</code> = the face shown (1 to ' + tex('k') + ')',
      chips: () => [['d', 'the face'], ['d^2', 'face squared'], ['mod(d,2)', '1 if odd'], ['abs(d-3)', 'distance from 3'], ['min(d,4)', '5 and 6 count as 4']],
      space(st) {
        const k = st.faces;
        const outs = Lab.range(1, k).map(d => ({ label: String(d), vars: { d }, p: F(1, k), draw: () => Lab.draw.die(d, { size: 22 }) }));
        return { outs, N: k, eqLikely: true, words: 'one die with ' + tex('k=' + k) + ' faces',
          size: 'You chose one die with ' + tex('k=' + k) + ' faces: one outcome per face, so ' + tex('N=k=' + k) + ' outcomes, each with probability ' + tex('\\frac{1}{k}=\\frac{1}{' + k + '}') + '.' };
      },
    },
    dice2: {
      label: 'Two dice',
      vars: () => ['d1', 'd2'],
      names: () => '<code>d1</code> = first die, <code>d2</code> = second die (each 1 to ' + tex('k') + ')',
      chips: () => [['d1+d2', 'sum'], ['max(d1,d2)', 'larger'], ['min(d1,d2)', 'smaller'], ['abs(d1-d2)', 'difference'], ['d1*d2', 'product'], ['d1-d2', 'first − second']],
      space(st) {
        const k = st.faces, N = k * k, outs = [];
        for (let a = 1; a <= k; a++) for (let b = 1; b <= k; b++) outs.push({ label: '(' + a + ', ' + b + ')', vars: { d1: a, d2: b }, p: F(1, N), draw: () => h('span', { class: 's6-dd' }, Lab.draw.die(a, { size: 19 }), Lab.draw.die(b, { size: 19 })) });
        return { outs, N, eqLikely: true, words: 'two dice with ' + tex('k=' + k) + ' faces each',
          size: 'You chose two dice with ' + tex('k=' + k) + ' faces each. The first die has ' + k + ' faces and so does the second, so there are ' + tex('N=k\\cdot k=' + k + '\\cdot ' + k + '=' + N) + ' ordered outcomes ' + tex('(d_1,d_2)') + ' — ' + tex('(1,2)') + ' and ' + tex('(2,1)') + ' are different — each with probability ' + tex('\\frac{1}{' + N + '}') + '.' };
      },
    },
    coins: {
      label: 'n coin tosses',
      vars: st => ['h', 't', 'n'].concat(Lab.range(1, st.n).map(i => 'c' + i)),
      names: st => '<code>h</code> = number of heads, <code>t</code> = number of tails, <code>n</code> = tosses, <code>c1</code> … <code>c' + st.n + '</code> = 1 if that toss is H (else 0)',
      chips: st => [['h', 'heads'], ['t', 'tails'], ['h-t', 'heads − tails'], ['c1', '1 if toss 1 is H'], ['max(h,t)', 'larger count'], [firstHead(st.n), 'toss of the first head (0 = none)']],
      space(st) {
        const n = st.n, p = K.parseProb(st.pH) || F(1, 2), q = F(1).sub(p), N = 1 << n;
        const fair = p.eq(F(1, 2));
        const outs = coinSeqs(n).map(s => {
          const hh = [...s].filter(c => c === 'H').length;
          const vars = { h: hh, t: n - hh, n };
          [...s].forEach((c, i) => (vars['c' + (i + 1)] = c === 'H' ? 1 : 0));
          return { label: s, vars, p: fin(p.pow(hh).mul(q.pow(n - hh))), draw: () => coinDraw(s) };
        });
        return { outs, N, eqLikely: fair, p, q, words: tex('n=' + n) + ' tosses of a coin with ' + tex('P(H)=p=' + tx(p)),
          size: 'You chose ' + tex('n=' + n) + ' tosses; each toss is H or T, so there are ' + tex('N=2^{n}=2^{' + n + '}=' + N) + ' sequences. ' +
            (fair ? 'With a fair coin each sequence has probability ' + tex('\\left(\\tfrac12\\right)^{' + n + '}=\\tfrac{1}{' + N + '}') + '.'
              : 'With ' + tex('p=' + tx(p)) + ' a sequence with ' + tex('h') + ' heads has probability ' + tex('p^{h}(1-p)^{n-h}=\\left(' + tx(p) + '\\right)^{h}\\left(' + tx(q) + '\\right)^{' + n + '-h}') + ' — they are <b>not</b> equally likely, so probabilities are added, not counted (the bar under each outcome shows its probability).') };
      },
    },
    card: {
      label: 'One card from a deck',
      vars: () => ['r', 'red', 'face', 's'],
      names: () => '<code>r</code> = rank (A = 1, 2–10, J = 11, Q = 12, K = 13), <code>red</code> = 1 for ♥ ♦ (else 0), <code>face</code> = 1 for J, Q, K (else 0), <code>s</code> = suit number (♠ 1, ♥ 2, ♦ 3, ♣ 4)',
      chips: () => [['r', 'rank'], ['red', '1 if red'], ['face', '1 if J, Q, K'], ['min(r,10)', 'J, Q, K count 10'], ['s', 'suit number']],
      space() {
        const outs = Lab.P.deck().map(o => ({ label: o.label, vars: { r: o.v.r, red: o.v.color === 'red' ? 1 : 0, face: o.v.face ? 1 : 0, s: SUIT_NO[o.v.suit] }, p: F(1, 52), draw: () => Lab.draw.card(o.v.rank, o.v.suit, { size: 19 }) }));
        return { outs, N: 52, eqLikely: true, words: 'one card from a shuffled 52-card deck',
          size: 'One card from a shuffled deck: 4 suits × 13 ranks gives ' + tex('N=4\\cdot 13=52') + ' outcomes, each with probability ' + tex('\\frac{1}{52}') + '.' };
      },
    },
    box: {
      label: 'A box of numbered tickets',
      vars: st => (st.draws === 2 ? ['t1', 't2'] : ['t']),
      names: st => (st.draws === 2 ? '<code>t1</code> = number on the first ticket, <code>t2</code> = number on the second' : '<code>t</code> = the number on the ticket drawn'),
      chips: st => (st.draws === 2 ? [['t1+t2', 'sum'], ['max(t1,t2)', 'larger'], ['min(t1,t2)', 'smaller'], ['abs(t1-t2)', 'difference'], ['t1*t2', 'product']] : [['t', 'the number'], ['t^2', 'number squared'], ['mod(t,2)', '1 if odd'], ['abs(t-2)', 'distance from 2']]),
      space(st) {
        const { nums, bad } = K.parseList(st.tickets);
        if (bad.length || !nums.length) return { err: 'Type the ticket numbers, for example 1, 2, 2, 3.' };
        if (nums.length > 12) return { err: 'Use at most 12 tickets (you typed ' + nums.length + ').' };
        const m = nums.length, outs = [];
        const typed = nums.map(v => vp(toQ(v))).join(', ');
        const intro = 'You typed ' + tex('m=' + m) + ' ticket' + (m > 1 ? 's' : '') + ': ' + esc(typed) + '. ';
        if (st.draws === 1) {
          nums.forEach((v, i) => outs.push({ label: 'ticket ' + (i + 1) + ' (number ' + vp(toQ(v)) + ')', vars: { t: v }, p: F(1, m), draw: () => ticket(v) }));
          return { outs, N: m, eqLikely: true, words: 'one ticket from a box with ' + tex('m=' + m) + ' tickets',
            size: intro + 'One ticket is drawn: one outcome per ticket, so ' + tex('N=m=' + m) + ' outcomes, each with probability ' + tex('\\frac{1}{' + m + '}') + '. Two tickets with the same number are still two different outcomes.' };
        }
        if (!st.repl && m < 2) return { err: 'Two draws without replacement need at least 2 tickets.' };
        for (let i = 0; i < m; i++) for (let j = 0; j < m; j++) {
          if (!st.repl && i === j) continue;
          outs.push({ label: 'ticket ' + (i + 1) + ' then ticket ' + (j + 1) + ' (numbers ' + vp(toQ(nums[i])) + ', ' + vp(toQ(nums[j])) + ')', vars: { t1: nums[i], t2: nums[j] }, p: null, draw: () => h('span', { class: 's6-dd' }, ticket(nums[i]), ticket(nums[j])) });
        }
        const N = outs.length;
        outs.forEach(o => (o.p = F(1, N)));
        return { outs, N, eqLikely: true, words: 'two tickets ' + (st.repl ? 'with' : 'without') + ' replacement from a box with ' + tex('m=' + m) + ' tickets',
          size: intro + (st.repl ? 'Draw one, put it back, draw again: ' + tex('N=m\\cdot m=' + m + '\\cdot ' + m + '=' + N) : 'Draw two different tickets (no replacement): ' + tex('N=m(m-1)=' + m + '\\cdot ' + (m - 1) + '=' + N)) +
            ' ordered pairs (first ticket, second ticket), each with probability ' + tex('\\frac{1}{' + N + '}') + '.' };
      },
    },
  };
  const expKey = st => (st.exp === 'box' ? 'box' + st.draws : st.exp);

  /* -------------------------------------------------------------- building the model */
  function modelExp(st) {
    const E = EXPS[st.exp];
    const sp = E.space(st);
    if (sp.err) return { ok: false, err: sp.err };
    const src = String(st.xs[expKey(st)] || '').trim();
    let fn;
    try {
      if (!src) throw new Error('type a formula for X');
      const bad = Lab.expr.vars(src).filter(v => !E.vars(st).includes(v));
      if (bad.length) throw new Error('unknown name ' + bad.join(', '));
      fn = Lab.expr.compile(src);
    } catch (e) { return { ok: false, err: 'Your formula for X is not readable: ' + esc(e.message) + '.' }; }
    for (const o of sp.outs) {
      let v;
      try { const env = {}; Object.keys(o.vars).forEach(k => (env[k] = toQ(o.vars[k]))); v = fin(fn(env)); }
      catch (e) { return { ok: false, err: 'X cannot be worked out for the outcome ' + esc(o.label) + ': ' + esc(e.message) + '.' }; }
      if (!Number.isFinite(Number(v))) return { ok: false, err: 'X is not a finite number for the outcome ' + esc(o.label) + '.' };
      o.x = v; o.xn = Number(v);
    }
    const map = new Map();
    sp.outs.forEach(o => {
      const key = String(Math.round(o.xn * 1e9) / 1e9);
      if (!map.has(key)) map.set(key, { x: o.x, xn: o.xn, members: [], p: F(0) });
      const g = map.get(key);
      g.members.push(o);
      g.p = add(g.p, o.p);
    });
    const rows = [...map.values()].sort((a, b) => a.xn - b.xn);
    rows.forEach(r => (r.count = r.members.length));
    const chip = E.chips(st).find(c => c[0].replace(/\s/g, '') === src.replace(/\s/g, ''));
    return { ok: true, M: { kind: 'exp', rows, N: sp.N, eqLikely: sp.eqLikely, sp, src, used: varsIn(src),
      words: sp.words + ', ' + tex('X') + ' = <code>' + esc(src) + '</code>' + (chip ? ' (' + chip[1] + ')' : ''), inexact: rows.some(r => !ex(r.p)) } };
  }

  function readPmf(st, res) {
    if (res) return res;
    const vals = st.pmf.vals.map(v => K.parseNum(v)), ps = st.pmf.probs.map(p => K.parseNum(p));
    if (vals.some(v => v == null) || ps.some(p => p == null || Number(p) < 0)) return { vals: [], p: [], ok: false, total: null };
    const nv = vals.map(Number);
    if (new Set(nv).size !== nv.length) return { vals: [], p: [], ok: false, total: null };
    const order = nv.map((v, i) => i).sort((i, j) => nv[i] - nv[j]);
    const total = F.sum(ps);
    return { vals: order.map(i => nv[i]), p: order.map(i => ps[i]), ok: total.eq(1), total };
  }
  function modelPmf(st, res) {
    const r = readPmf(st, res);
    if (!r.vals.length) return { ok: false, err: 'Fix the red boxes in your PMF: each value is a number (no value twice) and each probability is 0 or more (1/6, 0.25 or 20%).', checks: { bad: true } };
    const rows = r.vals.map((v, i) => ({ x: v, xn: v, p: fin(r.p[i]) }));
    if (!r.ok) return { ok: false, err: 'Your probabilities add up to ' + tex(tx(fin(r.total))) + ', not 1. A PMF must total 1: press “Rescale to total 1” or edit a probability.', checks: { rows, total: fin(r.total) } };
    return { ok: true, M: { kind: 'pmf', rows, eqLikely: false, words: 'the PMF you typed (' + rows.length + ' value' + (rows.length > 1 ? 's' : '') + ')', inexact: rows.some(x => !ex(x.p)) } };
  }

  const cTerm = (a, b) => {
    const ca = isZero(a) ? '' : same(a, F(1)) ? 'c' : same(a, F(-1)) ? '-c' : tx(a) + '\\,c';
    if (isZero(b)) return ca || '0';
    return ca ? ca + (Number(b) < 0 ? '-' + tx(mul(b, F(-1))) : '+' + tx(b)) : tx(b);
  };
  /** a·c + b with the number c put in: "\frac{1}{10}\cdot 2" style. */
  const cVal = (a, b, c) => {
    let s = isZero(a) ? '' : same(a, F(1)) ? par(c) : par(a) + '\\cdot ' + par(c);
    if (!isZero(b)) s = s ? s + (Number(b) < 0 ? '-' + tx(mul(b, F(-1))) : '+' + tx(b)) : tx(b);
    return s || '0';
  };
  function modelFormula(st) {
    const src = String(st.f || '').trim();
    let fn;
    try {
      if (!src) throw new Error('type a formula for p(x)');
      const bad = Lab.expr.vars(src).filter(v => v !== 'x' && v !== 'c');
      if (bad.length) throw new Error('unknown name ' + bad.join(', ') + ' (use x and c)');
      fn = Lab.expr.compile(src);
    } catch (e) { return { ok: false, err: 'Your formula is not readable: ' + esc(e.message) + '.' }; }
    let xs, inf = false;
    if (st.sup === 'range') {
      if (st.to < st.from) return { ok: false, err: 'The last value ' + st.to + ' is smaller than the first value ' + st.from + '.' };
      if (st.to - st.from + 1 > 60) return { ok: false, err: 'Keep the range to at most 60 values (you chose ' + (st.to - st.from + 1) + ').' };
      xs = Lab.range(st.from, st.to);
    } else if (st.sup === 'list') {
      const { nums, bad } = K.parseList(st.list);
      if (bad.length || !nums.length) return { ok: false, err: 'Type the values of x as numbers, for example 1, 2, 3, 4.' };
      xs = [...new Set(nums)].sort((p, q) => p - q);
      if (xs.length > 60) return { ok: false, err: 'Use at most 60 values of x.' };
    } else { inf = true; xs = Lab.range(st.start, st.start + 40); }
    const A = [], B = [];
    for (const x of xs) {
      let p0, p1, p2;
      try { const xq = toQ(x); p0 = fin(fn({ x: xq, c: F(0) })); p1 = fin(fn({ x: xq, c: F(1) })); p2 = fin(fn({ x: xq, c: F(2) })); }
      catch (e) { return { ok: false, err: 'p(x) cannot be worked out at x = ' + vp(toQ(x)) + ': ' + esc(e.message) + '.' }; }
      if (![p0, p1, p2].every(v => Number.isFinite(Number(v)))) return { ok: false, err: 'p(' + vp(toQ(x)) + ') is not a finite number.' };
      const a1 = sub(p1, p0);
      if (!same(p2, add(p0, mul(F(2), a1)))) return { ok: false, err: 'The lab solves for c when p(x) is linear in c — c times something, plus something — like c*x, c*(x^2+1) or (x+c)/10. At x = ' + vp(toQ(x)) + ' yours is not.' };
      A.push(a1); B.push(p0);
    }
    return inf ? solveInf(st, src, xs, A, B) : solveFinite(st, src, xs, A, B);
  }
  function supWords(st, xs) {
    if (st.sup === 'range') return tex('x=' + listTex(xs.map(toQ), 8)) + ' (from ' + st.from + ' to ' + st.to + ': ' + tex(st.to + '-' + par(F(st.from)) + '+1=' + xs.length) + ' values)';
    return tex('x=' + listTex(xs.map(toQ), 8)) + ' (' + xs.length + ' value' + (xs.length > 1 ? 's' : '') + ')';
  }
  function solveFinite(st, src, xs, A, B) {
    const hasB = B.some(b => !isZero(b));
    const SA = sum(A), SB = sum(B);
    const steps = [];
    const show = xs.length <= 12 ? xs.map((x, i) => i) : Lab.range(0, 8).concat(['…', xs.length - 2, xs.length - 1]);
    steps.push({ html: 'Your formula: <code>p(x) = ' + esc(src) + '</code>, for ' + supWords(st, xs) + '. The constant ' + tex('c') + ' is unknown.' });
    steps.push({ html: 'Put each ' + tex('x') + ' into your formula. Each ' + tex('p(x)') + ' comes out as a number times ' + tex('c') + (hasB ? ', plus a number' : '') + ':',
      block: table(['x', 'your formula with x put in', 'p(x)'], show.map(i => (i === '…' ? ['…', '', ''] : [vp(toQ(xs[i])), '<code>' + esc(subst(src, { x: xs[i] })) + '</code>', tex(cTerm(A[i], B[i]))]))) });
    const terms = xs.map((x, i) => cTerm(A[i], B[i]));
    const sumTxt = terms.length <= 8 ? terms.join('+') : terms.slice(0, 3).join('+') + '+\\dots+' + terms[terms.length - 1];
    steps.push({ html: 'A PMF must add up to 1. Add all ' + xs.length + ' probabilities and set the total equal to 1:', math: '\\sum_x p(x)=' + sumTxt.replace(/\+-/g, '-') + '=1' });
    const At = A.map(tx), Bt = B.map(tx);
    const short = arr => (arr.length <= 8 ? arr.join('+') : arr.slice(0, 3).join('+') + '+\\dots+' + arr[arr.length - 1]).replace(/\+-/g, '-');
    steps.push({ html: 'Collect the ' + tex('c') + ' parts' + (hasB ? ' and the plain numbers' : '') + ':', math: 'c\\left(' + short(At) + '\\right)' + (hasB ? '+\\left(' + short(Bt) + '\\right)' : '') + '=1\\;\\Longrightarrow\\;' + (same(SA, F(1)) ? '' : tx(SA) + '\\,') + 'c' + (hasB ? (Number(SB) < 0 ? '-' + tx(mul(SB, F(-1))) : '+' + tx(SB)) : '') + '=1' });
    if (isZero(SA)) return { ok: false, err: 'The parts multiplying c add up to 0, so the total does not depend on c — no c can make it 1.', solve: steps };
    const c = div(sub(F(1), SB), SA);
    steps.push({ html: 'Solve for ' + tex('c') + ':', math: 'c=' + (hasB ? '\\frac{1-' + par(SB) + '}{' + tx(SA) + '}=\\frac{' + tx(sub(F(1), SB)) + '}{' + tx(SA) + '}' : '\\frac{1}{' + tx(SA) + '}') + '=' + tx(c) + decTail(c) });
    const ps = A.map((a, i) => add(mul(c, a), B[i]));
    const rows = xs.map((x, i) => ({ x, xn: x, p: ps[i] }));
    const negs = rows.filter(r => LT(r.p, 0));
    steps.push({ html: 'Put ' + tex('c=' + tx(c)) + ' back into every ' + tex('p(x)') + ':',
      block: table(['x', 'p(x)', '≥ 0 ?'], show.map(i => (i === '…' ? ['…', '', ''] : [vp(toQ(xs[i])), tex(cVal(A[i], B[i], c) + '=' + tx(ps[i])), LT(ps[i], 0) ? '<span class="cbad">no</span>' : '<span class="cgood">yes</span>']))) });
    if (negs.length) return { ok: false, err: 'With ' + tex('c=' + tx(c)) + ', ' + tex('p(' + tx(toQ(negs[0].x)) + ')=' + tx(negs[0].p)) + ' is negative, so no constant c turns this formula into a PMF on these values.', solve: steps, checks: { neg: negs[0], c } };
    return { ok: true, M: { kind: 'formula', rows, c, src, solve: steps, eqLikely: false, inexact: rows.some(r => !ex(r.p)),
      words: '<code>p(x) = ' + esc(src) + '</code> for ' + supWords(st, xs), sum: { terms: ps } } };
  }
  function solveInf(st, src, xs, A, B) {
    const s = st.start, steps = [];
    steps.push({ html: 'Your formula: <code>p(x) = ' + esc(src) + '</code>, for ' + tex('x=' + s + ',\\ ' + (s + 1) + ',\\ ' + (s + 2) + ',\\ \\dots') + ' — the values never stop.' });
    if (B.some(b => !isZero(b))) return { ok: false, err: 'For a list of values that never stops, write p(x) as c times something (for example c*(1/2)^x): then the total is c times one series.', solve: steps };
    const a = A[0];
    if (isZero(a)) return { ok: false, err: 'At the first value x = ' + s + ' your formula gives 0·c. Start the values where the formula is not 0.', solve: steps };
    steps.push({ html: 'Put in the first values. Each is a number times ' + tex('c') + ':', math: [0, 1, 2, 3].map(k => 'p(' + (s + k) + ')=' + cTerm(A[k], F(0))).join(',\\quad ') + ',\\quad\\dots' });
    steps.push({ html: 'A PMF must add up to 1:', math: '\\sum_{x=' + s + '}^{\\infty}p(x)=c\\left(' + [0, 1, 2, 3].map(k => tx(A[k])).join('+').replace(/\+-/g, '-') + '+\\cdots\\right)=1' });
    const r = div(A[1], a);
    const badK = Lab.range(1, A.length - 2).find(k => !same(A[k + 1], mul(A[k], r)));
    if (badK != null) {
      const E = expSeries(s, A);
      if (E) return solveExp(st, src, s, A, steps, E, r);
      return { ok: false, err: 'Your terms are not a geometric series (the second term is ' + tex(tx(r)) + ' times the first, but term ' + (badK + 2) + ' is not ' + tex(tx(r)) + ' times term ' + (badK + 1) + ') and not the exponential series ' + tex('K\\lambda^x/x!') + '. The lab adds a list that never stops only for these two series.', solve: steps };
    }
    steps.push({ html: 'The bracket is a <b>geometric series</b>. Its first term is ' + tex('a=' + tx(a)) + '. Each term is the one before times the ratio', math: 'r=\\frac{' + tx(A[1]) + '}{' + tx(a) + '}=' + tx(r), note: 'The lab checked that each of the first 40 terms is ' + tex('r=' + tx(r)) + ' times the term before it.' });
    if (!LT(Math.abs(Number(r)), 1)) return { ok: false, err: 'The ratio is ' + tex('r=' + tx(r)) + ' and ' + tex('|r|\\ge 1') + ': the terms do not shrink, the series has no finite sum, and no c can make the total 1.', solve: steps };
    const S = div(a, sub(F(1), r)), c = div(F(1), S);
    steps.push({ html: 'Because ' + tex('|r|=' + tx(Math.abs(Number(r)) === Number(r) ? r : mul(r, F(-1))) + '<1') + ', the series adds up to a finite number:', math: 'S_\\infty=\\frac{a}{1-r}=\\frac{' + tx(a) + '}{1-' + par(r) + '}=\\frac{' + tx(a) + '}{' + tx(sub(F(1), r)) + '}=' + tx(S) + decTail(S) });
    steps.push({ html: 'So the total is ' + tex('c\\cdot S_\\infty') + '. Set it equal to 1:', math: 'c\\cdot ' + tx(S) + '=1\\;\\Longrightarrow\\;c=\\frac{1}{' + tx(S) + '}=' + tx(c) + decTail(c) });
    const ps = A.map(x => mul(c, x));
    const neg = ps.findIndex(p => LT(p, 0));
    const ca = mul(c, a);
    steps.push({ html: 'Put ' + tex('c') + ' back: ' + tex('p(x)=c\\cdot a\\cdot r^{\\,' + xMinus(s) + '}=' + tx(ca) + '\\cdot ' + pbase(r) + '^{\\,' + xMinus(s) + '}') + ', because ' + tex('c\\cdot a=1-r=' + tx(ca)) + '. The first values:', math: [0, 1, 2, 3].map(k => 'p(' + (s + k) + ')=' + tx(ps[k])).join(',\\quad ') + ',\\quad\\dots' });
    if (neg >= 0) return { ok: false, err: 'With ' + tex('c=' + tx(c)) + ', ' + tex('p(' + (s + neg) + ')=' + tx(ps[neg])) + ' is negative (the ratio r is negative), so this is not a PMF.', solve: steps, checks: { neg: { x: s + neg, p: ps[neg] }, c } };
    const nShow = Math.max(3, Math.min(41, st.showN));
    const rows = Lab.range(0, nShow - 1).map(k => ({ x: s + k, xn: s + k, p: ps[k] }));
    return { ok: true, M: { kind: 'formula', rows, c, src, solve: steps, eqLikely: false, inexact: rows.some(x => !ex(x.p)),
      inf: { s, kind: 'geo', a, r, S, c, ca }, words: '<code>p(x) = ' + esc(src) + '</code> for ' + tex('x=' + s + ',\\ ' + (s + 1) + ',\\ \\dots') + ' (never stops)' } };
  }
  /** Are the terms K·λ^x/x! (the exponential series)? Then each term is λ/(x+1) times the one before. */
  function expSeries(s, A) {
    // exact zeros only: the terms λ^x/x! become tiny (2^30/30! ≈ 4·10⁻²⁴) but are not 0
    if (s < 0 || A.some(v => Number(v) === 0)) return null;
    const lam = mul(div(A[1], A[0]), F(s + 1));
    for (let k = 1; k < A.length - 1; k++) {
      if (Math.abs(Number(A[k + 1])) < 1e-290) break;          // below this, floating point cannot divide reliably
      if (!same(mul(div(A[k + 1], A[k]), F(s + k + 1)), lam)) return null;
    }
    if (!(Number(lam) > 0)) return null;
    let fs = F(1);
    for (let i = 2; i <= s; i++) fs = mul(fs, F(i));
    return { lam, K: div(mul(A[0], fs), pw(lam, s)) };
  }
  function solveExp(st, src, s, A, steps, E, r1) {
    const { lam, K } = E, L = Number(lam);
    const Kt = same(K, F(1)) ? '' : tx(K) + '\\cdot ';
    let head = 0, t = 1;
    for (let i = 0; i < s; i++) { head += t; t *= L / (i + 1); }
    const S = Number(K) * (Math.exp(L) - head);
    steps.push({ html: 'This bracket is <b>not</b> a geometric series: the second term is ' + tex(tx(r1)) + ' times the first, but that ratio changes. Instead each term is the one before times ' + tex('\\frac{\\lambda}{x+1}') + ' with ' + tex('\\lambda=' + tx(lam)) + ': the terms are ' + tex(Kt + '\\frac{\\lambda^{x}}{x!}') + ' — the <b>exponential series</b>.',
      math: '\\sum_{x=0}^{\\infty}\\frac{\\lambda^{x}}{x!}=1+\\lambda+\\frac{\\lambda^{2}}{2!}+\\frac{\\lambda^{3}}{3!}+\\cdots=e^{\\lambda}', note: 'The lab checked the ' + tex('\\lambda/(x+1)') + ' pattern for each of the first 40 terms.' });
    steps.push({ html: 'With your ' + tex('\\lambda=' + tx(lam)) + (s > 0 ? ', and the list starting at ' + tex('x=' + s) + ' so the first ' + s + ' term' + (s > 1 ? 's are' : ' is') + ' missing' : '') + ':',
      math: 'S_\\infty=' + Kt + (s > 0 ? '\\left(e^{' + tx(lam) + '}-' + decStr(head, 6) + '\\right)' : 'e^{' + tx(lam) + '}') + '\\approx ' + decStr(S, 6) });
    const c = 1 / S;
    const cTex = s === 0 && same(K, F(1)) ? 'e^{-' + tx(lam) + '}' : '';
    steps.push({ html: 'So the total is ' + tex('c\\cdot S_\\infty') + '. Set it equal to 1:', math: 'c=\\frac{1}{S_\\infty}' + (cTex ? '=' + cTex : '') + '\\approx ' + decStr(c, 6), note: 'An irrational number: from here on the probabilities are decimals (rounded to 6 places).' });
    const ps = A.map(v => c * Number(v));
    steps.push({ html: 'Put ' + tex('c') + ' back: ' + tex('p(x)=c\\cdot ' + Kt + '\\frac{' + tx(lam) + '^{x}}{x!}') + '. The first values:', math: [0, 1, 2, 3].map(k => 'p(' + (s + k) + ')\\approx ' + decStr(ps[k], 4)).join(',\\quad ') + ',\\quad\\dots' });
    const nShow = Math.max(3, Math.min(41, st.showN));
    const rows = Lab.range(0, nShow - 1).map(k => ({ x: s + k, xn: s + k, p: ps[k] }));
    return { ok: true, M: { kind: 'formula', rows, c, cTex, src, solve: steps, eqLikely: false, inexact: true,
      inf: { s, kind: 'exp', lam, K, S, c }, words: '<code>p(x) = ' + esc(src) + '</code> for ' + tex('x=' + s + ',\\ ' + (s + 1) + ',\\ \\dots') + ' (never stops)' } };
  }

  /* ------------------------------------------------------------ CDF and questions */
  function Fat(M, t) {
    const tn = Number(t), last = M.rows[M.rows.length - 1].xn;
    if (M.inf && tn > last + 1e-9) {
      if (M.inf.kind === 'geo') { const k = Math.floor(tn - M.inf.s + 1e-9) + 1; return sub(F(1), pw(M.inf.r, k)); }
      let acc = Number(sum(M.rows.map(r => r.p)));
      for (let x = last + 1; x <= Math.min(Math.floor(tn + 1e-9), M.inf.s + 400); x++) acc += Number(pAt(M, x));
      return acc;
    }
    return sum(M.rows.filter(r => LE(r.xn, tn)).map(r => r.p));
  }
  function pAt(M, t) {
    const r = M.rows.find(x => EQ(x.xn, t));
    if (r) return r.p;
    const tn = Number(t);
    if (M.inf && Number.isInteger(Math.round(tn * 1e9) / 1e9) && tn >= M.inf.s) {
      const x = Math.round(tn);
      if (M.inf.kind === 'geo') return mul(M.inf.ca, pw(M.inf.r, x - M.inf.s));
      let v = Number(M.inf.c) * Number(M.inf.K);                     // c·K·λ^x/x!
      for (let i = 1; i <= x; i++) v *= Number(M.inf.lam) / i;
      return v;
    }
    return F(0);
  }
  /** A probability in the model's own units: a count over N when the outcomes are equally likely. */
  function pq(M, v) {
    if (isZero(v)) return '0';
    if (M.eqLikely && ex(v)) { const c = v.mul(M.N); if (c.d === 1) return '\\frac{' + c.n + '}{' + M.N + '}'; }
    return tx(v);
  }
  /** After pq: the reduced fraction (when different) and the decimal. */
  function pqTail(M, v) {
    let s = '';
    if (M.eqLikely && ex(v) && !isZero(v) && v.mul(M.N).d === 1 && v.d !== M.N) s = '=' + tx(v);
    return s + decTail(v);
  }
  const QS = {
    le: { opt: 'P(X ≤ a): at most a', two: false, sym: a => 'P(X\\le ' + a + ')', rule: 'F(a)', test: (x, a) => LE(x, a) },
    lt: { opt: 'P(X < a): less than a', two: false, sym: a => 'P(X<' + a + ')', rule: 'F(a)-P(X=a)', test: (x, a) => LT(x, a) },
    gt: { opt: 'P(X > a): more than a', two: false, sym: a => 'P(X>' + a + ')', rule: '1-F(a)', test: (x, a) => LT(a, x) },
    eq: { opt: 'P(X = a): exactly a', two: false, sym: a => 'P(X=' + a + ')', rule: 'p(a)', test: (x, a) => EQ(x, a) },
    between: { opt: 'P(a < X ≤ b)', two: true, sym: (a, b) => 'P(' + a + '<X\\le ' + b + ')', rule: 'F(b)-F(a)', test: (x, a, b) => LT(a, x) && LE(x, b) },
    closed: { opt: 'P(a ≤ X ≤ b)', two: true, sym: (a, b) => 'P(' + a + '\\le X\\le ' + b + ')', rule: 'F(b)-F(a)+P(X=a)', test: (x, a, b) => LE(a, x) && LE(x, b) },
  };
  const QKEYS = ['le', 'lt', 'gt', 'eq', 'between', 'closed'];
  function question(M, st, key = st.q) {
    const ra = K.parseNum(st.a), rb = K.parseNum(st.b);
    const a = ra == null ? F(0) : toQ(fin(ra));
    const b = rb == null ? F(0) : toQ(fin(rb));
    const shown = (raw, v) => (String(raw).includes('/') || !ex(v) || v.d === 1 ? tx(v) : Lab.fmtDec(Number(v), 6));
    const at = shown(st.a, a), bt = shown(st.b, b);
    const Fa = Fat(M, a), Fb = Fat(M, b), pa = pAt(M, a), Fa_ = sub(Fa, pa);
    const d = QS[key];
    let val, line, empty = false;
    switch (key) {
      case 'le': val = Fa; line = 'F(' + at + ')=' + pq(M, Fa); break;
      case 'lt': val = Fa_; line = 'F(' + at + ')-P(X=' + at + ')=' + pq(M, Fa) + '-' + pq(M, pa) + '=' + pq(M, val); break;
      case 'gt': val = sub(F(1), Fa); line = '1-F(' + at + ')=1-' + pq(M, Fa) + '=' + pq(M, val); break;
      case 'eq': val = pa; line = 'p(' + at + ')=' + pq(M, pa); break;
      case 'between':
        if (LT(a, b)) { val = sub(Fb, Fa); line = 'F(' + bt + ')-F(' + at + ')=' + pq(M, Fb) + '-' + pq(M, Fa) + '=' + pq(M, val); }
        else { val = F(0); empty = true; line = '0'; }
        break;
      default:
        if (LE(a, b)) { val = add(sub(Fb, Fa), pa); line = 'F(' + bt + ')-F(' + at + ')+P(X=' + at + ')=' + pq(M, Fb) + '-' + pq(M, Fa) + '+' + pq(M, pa) + '=' + pq(M, val); }
        else { val = F(0); empty = true; line = '0'; }
    }
    const test = r => d.test(r.xn, Number(a), Number(b));
    let used = M.rows.filter(test), unbounded = false, capped = false;
    if (M.inf) {
      // the values of X go on for ever: list the ones in the event, also beyond the values drawn
      const s0 = M.inf.s, last = M.rows[M.rows.length - 1].xn;
      let top = Math.floor(Math.max(last, Number(a), Number(b))) + 1;
      if (top > s0 + 400) { top = s0 + 400; capped = true; }
      used = [];
      for (let x = s0; x <= top; x++) if (d.test(x, Number(a), Number(b))) used.push({ x: F(x), xn: x, p: pAt(M, x) });
      unbounded = key === 'gt';
    }
    return { key, d, a, b, at, bt, Fa, Fb, pa, Fa_, val, empty, test, used, unbounded, capped, sym: d.sym(at, bt), full: d.sym(at, bt) + '=' + line + (empty ? '' : pqTail(M, val)) };
  }

  /** "5, 6, 7, 8" — the values of X inside the event (", …" when they never stop). */
  function valsWords(Q, max = 9) {
    if (Q.empty || !Q.used.length) return 'none';
    return tex(listTex(Q.used.map(r => r.x), max)) + (Q.unbounded || Q.capped ? ', …' : '');
  }

  /* ------------------------------------------------------------------- the CDF picture */
  function cdfPicture(M, Q) {
    let rows = M.rows;
    if (M.inf) { // draw the steps on to a and b when they lie past the values drawn
      const last = rows[rows.length - 1].xn, top = Math.min(M.inf.s + 80, Math.floor(Math.max(Number(Q.a), Number(Q.b))) + 1);
      const extra = [];
      for (let x = last + 1; x <= top; x++) extra.push({ x: F(x), xn: x, p: pAt(M, x) });
      rows = rows.concat(extra);
    }
    const vals = rows.map(r => r.xn);
    const lo0 = vals[0], hi0 = vals[vals.length - 1];
    const span = Math.max(1, hi0 - lo0);
    const pad = vals.every(v => Number.isInteger(Math.round(v * 1e9) / 1e9)) ? Math.max(1, Math.round(span / 10)) : span / 10;
    let lo = lo0 - pad, hi = hi0 + pad;
    const marks = [Q.a].concat(Q.d.two ? [Q.b] : []);
    marks.forEach(v => { lo = Math.min(lo, Number(v) - pad / 2); hi = Math.max(hi, Number(v) + pad / 2); });
    const Wd = 680, H = 262, pl = 46, pr = 112, pt = 16, pb = 38;
    const X = v => pl + ((v - lo) / (hi - lo)) * (Wd - pl - pr);
    const Y = v => pt + (1 - v) * (H - pt - pb);
    const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'cdf-svg pl-cdf s6-cdf', role: 'img', 'aria-label': 'CDF staircase of X with a' + (Q.d.two ? ' and b' : '') });
    [0, 0.25, 0.5, 0.75, 1].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr + 10, y1: Y(v), y2: Y(v), class: 'grid' })); s.appendChild(svg('text', { x: pl - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v))); });
    let acc = 0, prevX = X(lo);
    const every = vals.length > 16 ? Math.ceil(vals.length / 16) : 1;
    rows.forEach((r, k) => {
      const pv = Number(r.p);
      s.appendChild(svg('line', { x1: prevX, x2: X(r.xn), y1: Y(acc), y2: Y(acc), class: 'step' }));
      s.appendChild(svg('line', { x1: X(r.xn), x2: X(r.xn), y1: Y(acc), y2: Y(acc + pv), class: 'jump' }));
      if (vals.length <= 12 && pv > 0.03) s.appendChild(svg('text', { x: X(r.xn) + 5, y: (Y(acc) + Y(acc + pv)) / 2 + 4, class: 'jump-lab' }, '+' + (M.eqLikely && r.count ? r.count + '/' + M.N : vp(r.p))));
      s.appendChild(svg('circle', { cx: X(r.xn), cy: Y(acc), r: 3.4, class: 'open' }));
      acc += pv;
      s.appendChild(svg('circle', { cx: X(r.xn), cy: Y(acc), r: 3.4, class: 'closed' }));
      if (k % every === 0) s.appendChild(svg('text', { x: X(r.xn), y: H - 18, 'text-anchor': 'middle', class: 'tick' }, vp(r.x)));
      prevX = X(r.xn);
    });
    s.appendChild(svg('line', { x1: prevX, x2: X(hi), y1: Y(acc), y2: Y(acc), class: M.inf ? 'step s6-more' : 'step' }));
    if (M.inf) s.appendChild(svg('text', { x: X(hi) - 4, y: Y(acc) + 30, 'text-anchor': 'end', class: 'tick' }, '… still rising towards 1'));
    // markers for a and b
    const mk = (v, cls, name) => {
      const Fv = Number(Fat(M, v));
      s.appendChild(svg('line', { x1: X(Number(v)), x2: X(Number(v)), y1: Y(0), y2: Y(Fv), class: cls === 'a' ? 'marker' : 's6-mk-b' }));
      s.appendChild(svg('line', { x1: pl, x2: X(Number(v)), y1: Y(Fv), y2: Y(Fv), class: cls === 'a' ? 'marker' : 's6-mk-b' }));
      s.appendChild(svg('circle', { cx: X(Number(v)), cy: Y(Fv), r: 5.2, class: cls === 'a' ? 'marker-dot' : 's6-dot-b' }));
      s.appendChild(svg('text', { x: X(Number(v)), y: H - 3, 'text-anchor': 'middle', class: cls === 'a' ? 's6-albl' : 's6-blbl' }, name + ' = ' + vp(v)));
    };
    mk(Q.a, 'a', 'a');
    if (Q.d.two) mk(Q.b, 'b', 'b');
    if (['lt', 'eq', 'closed'].includes(Q.key) && !isZero(Q.pa)) s.appendChild(svg('circle', { cx: X(Number(Q.a)), cy: Y(Number(Q.Fa_)), r: 5, class: 's6-lim' }));
    // the bracket: the probability asked for, as a height on the staircase
    let low, high, at, lab;
    switch (Q.key) {
      case 'le': low = 0; high = Q.Fa; at = Q.a; lab = 'F(a)'; break;
      case 'lt': low = 0; high = Q.Fa_; at = Q.a; lab = 'P(X<a)'; break;
      case 'gt': low = Q.Fa; high = 1; at = Q.a; lab = '1 − F(a)'; break;
      case 'eq': low = Q.Fa_; high = Q.Fa; at = Q.a; lab = 'P(X=a)'; break;
      case 'between': low = Q.Fa; high = Q.Fb; at = Q.b; lab = 'F(b) − F(a)'; break;
      default: low = Q.Fa_; high = Q.Fb; at = Q.b; lab = 'P(a≤X≤b)';
    }
    if (!Q.empty && Number(high) - Number(low) > 1e-9) {
      const bx = Wd - pr + 16;
      s.appendChild(svg('line', { x1: X(Number(at)), x2: bx, y1: Y(Number(high)), y2: Y(Number(high)), class: 's6-guide' }));
      s.appendChild(svg('line', { x1: Q.key === 'between' || Q.key === 'closed' || Q.key === 'gt' ? X(Number(Q.a)) : pl, x2: bx, y1: Y(Number(low)), y2: Y(Number(low)), class: 's6-guide' }));
      s.appendChild(svg('rect', { x: bx, y: Y(Number(high)), width: 9, height: Math.max(1.5, Y(Number(low)) - Y(Number(high))), rx: 3, class: 's6-br' }));
      s.appendChild(svg('text', { x: bx + 14, y: (Y(Number(high)) + Y(Number(low))) / 2 + 4, class: 's6-brl' }, lab));
    }
    return s;
  }
  function fLine(M, t) {
    const tt = tx(t);
    if (M.inf && M.inf.kind === 'exp' && Number(t) > M.rows[M.rows.length - 1].xn + 1e-9) {
      const top = Math.floor(Number(t) + 1e-9);
      return 'F(' + tt + ')=\\sum_{x=' + M.inf.s + '}^{' + top + '}p(x)\\approx ' + decStr(Fat(M, t), 6);
    }
    if (M.inf && Number(t) > M.rows[M.rows.length - 1].xn + 1e-9) {
      const k = Math.floor(Number(t) - M.inf.s + 1e-9) + 1;
      return 'F(' + tt + ')=\\sum_{x=' + M.inf.s + '}^{' + (M.inf.s + k - 1) + '}p(x)=1-r^{' + k + '}=1-' + pbase(M.inf.r) + '^{' + k + '}=' + tx(Fat(M, t)) + decTail(Fat(M, t));
    }
    const used = M.rows.filter(r => LE(r.xn, t));
    if (!used.length) return 'F(' + tt + ')=P(X\\le ' + tt + ')=0';
    const Ft = Fat(M, t);
    let s = 'F(' + tt + ')=P(X\\le ' + tt + ')=' + (used.length <= 5 ? used.map(r => 'p(' + tx(r.x) + ')').join('+') : '\\sum_{x\\le ' + tt + '}p(x)');
    if (used.length > 1) {
      if (M.eqLikely && used.length <= 14) s += '=\\frac{' + used.map(r => r.count).join('+') + '}{' + M.N + '}';
      else if (used.length <= 8) s += '=' + used.map(r => pq(M, r.p)).join('+');
    }
    return s + '=' + pq(M, Ft) + pqTail(M, Ft);
  }

  /* ------------------------------------------------------------------ the lab */
  const DEF = {
    mode: 'exp', exp: 'dice2', faces: 6, n: 3, pH: '1/2', tickets: '1, 2, 2, 3, 3, 3', draws: 1, repl: true,
    xs: { die1: 'd', dice2: 'd1+d2', coins: 'h', card: 'r', box1: 't', box2: 't1+t2' },
    pmf: { vals: [0, 1, 2, 3], probs: ['1/8', '3/8', '3/8', '1/8'] },
    f: 'c*x', sup: 'range', from: 1, to: 4, list: '1, 2, 3, 4', start: 1, showN: 8,
    q: 'between', a: '4', b: '8', preset: '',
  };
  const NOTES = 'Statistics I course notes, Week 9';
  const TYPICAL = 'a typical Statistics I exercise (Weeks 7–9), not one specific lecture example';
  const L1 = 'Lecture: Random variables — introduction', L2 = 'Lecture: Random variables — application', L3 = 'Lecture: Discrete and continuous random variables',
    L4 = 'Lecture: Probability mass function — properties', L5 = 'Lecture: Graph of the probability mass function', L6 = 'Lecture: Cumulative distribution function',
    L91 = 'Lecture: Discrete random variable — application', TUT = 'Tutorial on random variables', SER = 'Tutorial: Infinite series';
  const pmfSet = (vals, probs, q, a, b) => ({ mode: 'pmf', pmf: { vals, probs }, q, a: String(a), b: String(b == null ? a : b) });
  const PRESETS = [
    // ---- the professor's examples, in lecture order
    { group: L1, label: 'Two dice, X = sum: P(X = 7) = 6/36', source: L1 + ', at 22:00 (the PMF 1/36 … 6/36 … 1/36 is listed at 20:30)', set: { mode: 'exp', exp: 'dice2', faces: 6, xs: { dice2: 'd1+d2' }, q: 'eq', a: '7', b: '9' } },
    { group: L1, label: 'Two dice, Y = the smaller face', source: L1 + ', at 28:30: P(Y = 1), …, P(Y = 6) = 11/36, 9/36, 7/36, 5/36, 3/36, 1/36; the question “smaller outcome is 3” is asked at 08:30', set: { mode: 'exp', exp: 'dice2', faces: 6, xs: { dice2: 'min(d1,d2)' }, q: 'eq', a: '3', b: '4' } },
    { group: L1, label: 'Three coins, X = number of heads', source: L1 + ', at 38:00: P(X = 0, 1, 2, 3) = 1/8, 3/8, 3/8, 1/8', set: { mode: 'exp', exp: 'coins', n: 3, pH: '1/2', xs: { coins: 'h' }, q: 'eq', a: '2', b: '3' } },
    { group: L1, label: 'Three coins, Y = toss of the first head', source: L1 + ', at 43:30: P(Y = 1, 2, 3) = 4/8, 2/8, 1/8 and 1/8 for “nil” (no head). The lecture writes nil; here nil is coded as 0', set: { mode: 'exp', exp: 'coins', n: 3, pH: '1/2', xs: { coins: firstHead(3) }, q: 'eq', a: '1', b: '2' } },
    { group: L2, label: 'Life insurance: X = payout (₹ lakh)', source: L2 + ', at 10:30–13:00: P(younger dies) = 0.05, P(older dies) = 0.1, independent, so P(X = 0) = 0.95 · 0.9 = 0.855, P(X = 1) = 0.05 · 0.9 + 0.95 · 0.1 = 0.14, P(X = 2) = 0.05 · 0.1 = 0.005', set: pmfSet([0, 1, 2], ['0.855', '0.14', '0.005'], 'gt', 0, 2) },
    { group: L3, label: 'Apartment complex: X = number of bedrooms', source: L3 + ', at 08:00: 12 apartments (4 floors × a 1-, 2- and 3-bedroom flat), one chosen at random; the lecture lists the values 1, 2, 3 — the probabilities 4/12 come from the 12 equally likely apartments', set: { mode: 'exp', exp: 'box', tickets: '1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3', draws: 1, xs: { box1: 't' }, q: 'eq', a: '2', b: '3' } },
    { group: L3, label: 'Apartment complex: Y = floor number', source: L3 + ', at 09:30: floors 1–4 with 3 apartments each; the probabilities 3/12 come from the 12 equally likely apartments', set: { mode: 'exp', exp: 'box', tickets: '1, 1, 1, 2, 2, 2, 3, 3, 3, 4, 4, 4', draws: 1, xs: { box1: 't' }, q: 'le', a: '2', b: '3' } },
    { group: L4, label: 'A PMF: 1/4, 1/2, 1/4 on x = 0, 1, 2', source: L4 + ', at 07:30 (graphed in “Graph of the probability mass function” at 05:00)', set: pmfSet([0, 1, 2], ['1/4', '1/2', '1/4'], 'le', 1, 2) },
    { group: L4, label: 'Is it a PMF? 0.4, 0.1, 0.2, 0.1, 0.3', source: L4 + ', at 09:30: x = 1, …, 5. Answer in the lecture: no — the probabilities add up to 1.1', set: pmfSet([1, 2, 3, 4, 5], ['0.4', '0.1', '0.2', '0.1', '0.3'], 'le', 2, 4) },
    { group: L4, label: 'Is it a PMF? 0.2, 0.3, 0.4, −0.1, 0.2', source: L4 + ', at 11:00: x = 1, …, 5. Answer in the lecture: no — P(X = 4) = −0.1 is negative (the total is 1)', set: pmfSet([1, 2, 3, 4, 5], ['0.2', '0.3', '0.4', '-0.1', '0.2'], 'le', 2, 4) },
    { group: L4, label: 'Is it a PMF? 0.3, 0.1, 0.2, 0.4, 0', source: L4 + ', at 12:30: x = 1, …, 5. Answer in the lecture: yes', set: pmfSet([1, 2, 3, 4, 5], ['0.3', '0.1', '0.2', '0.4', '0'], 'le', 3, 4) },
    { group: L4, label: 'p(i) = c·λⁱ/i!, i = 0, 1, 2, … (λ = 2 here)', source: L4 + ', at 15:00–19:00: c = e^(−λ). The lecture keeps λ general; λ = 2 is chosen here so the lab can draw it (type another λ in the formula)', set: { mode: 'formula', f: 'c*2^x/fact(x)', sup: 'inf', start: 0, showN: 9, q: 'le', a: '2', b: '4' } },
    { group: L5, label: 'A PMF: 0.5, 0.25, 0.25 on x = 0, 1, 2', source: L5 + ', at 07:30 (not symmetric, unlike 0.25, 0.5, 0.25)', set: pmfSet([0, 1, 2], ['0.5', '0.25', '0.25'], 'eq', 0, 1) },
    { group: L5, label: 'A PMF: 0.35, 0.55, 0.10 on x = 0, 1, 2', source: L5 + ', at 08:30 (no pattern)', set: pmfSet([0, 1, 2], ['0.35', '0.55', '0.10'], 'eq', 1, 2) },
    { group: L5, label: 'Positively skewed: 0.4, 0.3, 0.2, 0.1', source: L5 + ', at 09:00: x = 1, 2, 3, 4', set: pmfSet([1, 2, 3, 4], ['0.4', '0.3', '0.2', '0.1'], 'le', 2, 3) },
    { group: L5, label: 'Negatively skewed: 0.1, 0.2, 0.3, 0.4', source: L5 + ', at 10:30: x = 1, 2, 3, 4', set: pmfSet([1, 2, 3, 4], ['0.1', '0.2', '0.3', '0.4'], 'le', 2, 3) },
    { group: L5, label: 'One fair die: every bar 1/6', source: L5 + ', at 12:00 (a uniform shape)', set: { mode: 'exp', exp: 'die1', faces: 6, xs: { die1: 'd' }, q: 'le', a: '3', b: '5' } },
    { group: L5, label: 'One fair coin: H = 1, T = 0', source: L5 + ', at 17:30–19:30: P(X = 0) = P(X = 1) = 0.5', set: { mode: 'exp', exp: 'coins', n: 1, pH: '1/2', xs: { coins: 'h' }, q: 'eq', a: '1', b: '1' } },
    { group: L6, label: 'Three coins: at most 1 head, at least 1 head', source: L6 + ', at 02:00: P(X ≤ 1) and P(X ≥ 1) for X = number of heads (see P(X > 0) in the calculator for “at least 1”)', set: { mode: 'exp', exp: 'coins', n: 3, pH: '1/2', xs: { coins: 'h' }, q: 'le', a: '1', b: '2' } },
    { group: L6, label: 'CDF of X with 1/4, 3/4 on x = 0, 1', source: L6 + ', at 04:30: F = 1/4 on 0 ≤ a < 1, then 1', set: pmfSet([0, 1], ['1/4', '3/4'], 'le', 0.5, 1) },
    { group: L6, label: 'CDF steps: 1/4, 1/2, 1/8, 1/8 on x = 1, …, 4', source: L6 + ', at 07:30–12:30: F(a) = 0, 1/4, 3/4, 7/8, 1; each step is P(X = x)', set: pmfSet([1, 2, 3, 4], ['1/4', '1/2', '1/8', '1/8'], 'between', 1, 3) },
    { group: L91, label: 'Credit cards: P(X = 0) or P(X ≥ 2)?', source: L91 + ', at 04:00 (PMF 0.42, 0.36, 0.14, 0.06, 0.02 on 0–4) and 08:00 (P(X = 0) = 0.42 > P(X ≥ 2) = 0.22)', set: pmfSet([0, 1, 2, 3, 4], ['0.42', '0.36', '0.14', '0.06', '0.02'], 'gt', 1, 4) },
    { group: TUT, label: 'α·pˣ on x = 0, 1, 2, … (p = 1/2 here)', source: TUT + ', question 2, at 03:30–05:00: α + αp + αp² + … = α/(1 − p) = 1, so α = 1 − p (α > 0, 0 ≤ p < 1). The tutorial keeps p general; p = 1/2 is chosen here', set: { mode: 'formula', f: 'c*(1/2)^x', sup: 'inf', start: 0, showN: 8, q: 'le', a: '1', b: '3' } },
    { group: TUT, label: 'e^(−λ)·λⁿ/n! is a PMF (λ = 2 here): c = 1', source: TUT + ', question 3, at 02:30: the terms add up to e^(−λ)·e^λ = 1, so no extra constant is needed (λ = 2 chosen here)', set: { mode: 'formula', f: 'c*exp(-2)*2^x/fact(x)', sup: 'inf', start: 0, showN: 9, q: 'le', a: '2', b: '4' } },
    { group: TUT, label: 'Y = X² + 2: the PMF and CDF of Y', source: TUT + ', question 5, at 00:00–04:00: the printed PMF of X is 0.1, 0.2, 0.4, 0.3 at x = 0, 1, −2, 3, so Y = 2, 3, 6, 11 with 0.1, 0.2, 0.4, 0.3. (The tutor’s handwritten working swaps 0.4 and 0.3; this preset follows the printed question.)', set: pmfSet([2, 3, 6, 11], ['0.1', '0.2', '0.4', '0.3'], 'le', 6, 11) },
    { group: TUT, label: 'From a CDF back to the PMF', source: TUT + ', question 6, at 04:00–06:30: F jumps to 4/10 at 1, stays 4/10 at 2, 7/10 at 3 and 1 at 10, so P(X = 1, 3, 10) = 4/10, 3/10, 3/10 and P(X = 2) = 0', set: pmfSet([1, 3, 10], ['4/10', '3/10', '3/10'], 'eq', 2, 3) },
    { group: SER, label: 'a = r = 1/2: 1/2 + 1/4 + 1/8 + … = 1', source: SER + ', at 03:30–04:30: with a = r = 0.5 the terms 1/2 + 1/4 + 1/8 + 1/16 + … settle on a/(1 − r) = 1; the formula needs |r| < 1 (the video’s on-screen correction of “r < 1”)', set: { mode: 'formula', f: 'c*(1/2)^x', sup: 'inf', start: 1, showN: 8, q: 'gt', a: '3', b: '5' } },
    // ---- earlier examples (course notes and typical exercises)
    { group: 'More examples (course notes and typical exercises)', label: 'Two dice, X = sum: six pairs give 7', source: NOTES + ' · Random variable: “six dice pairs give X = sum = 7”', set: { mode: 'exp', exp: 'dice2', faces: 6, xs: { dice2: 'd1+d2' }, q: 'eq', a: '7', b: '9' } },
    { group: 'More examples (course notes and typical exercises)', label: 'p(x) = c·x for x = 1, 2, 3, 4', source: NOTES + ' · PMF: “unknown constant in a formula for p is fixed by Σp = 1”', set: { mode: 'formula', f: 'c*x', sup: 'range', from: 1, to: 4, q: 'between', a: '1', b: '3' } },
    { group: 'More examples (course notes and typical exercises)', label: 'p(x) = c·(1/2)^x for x = 1, 2, 3, …', source: NOTES + ' · PMF: infinite geometric series a + ar + ar² + … = a/(1 − r), |r| < 1, “used to check Σp = 1 on an infinite discrete support”', set: { mode: 'formula', f: 'c*(1/2)^x', sup: 'inf', start: 1, showN: 8, q: 'gt', a: '3', b: '5' } },
    { group: 'More examples (course notes and typical exercises)', label: 'Three fair coins, X = number of heads', source: TYPICAL, set: { mode: 'exp', exp: 'coins', n: 3, pH: '1/2', xs: { coins: 'h' }, q: 'gt', a: '1', b: '3' } },
    { group: 'More examples (course notes and typical exercises)', label: 'Two dice, X = the larger face', source: TYPICAL, set: { mode: 'exp', exp: 'dice2', faces: 6, xs: { dice2: 'max(d1,d2)' }, q: 'le', a: '3', b: '5' } },
    { group: 'More examples (course notes and typical exercises)', label: 'One card, X = 1 if it is J, Q or K', source: TYPICAL, set: { mode: 'exp', exp: 'card', xs: { card: 'face' }, q: 'eq', a: '1', b: '1' } },
    { group: 'More examples (course notes and typical exercises)', label: 'Box with tickets 1, 2, 2, 3, 3, 3: draw one', source: TYPICAL, set: { mode: 'exp', exp: 'box', tickets: '1, 2, 2, 3, 3, 3', draws: 1, xs: { box1: 't' }, q: 'closed', a: '2', b: '3' } },
    { group: 'More examples (course notes and typical exercises)', label: 'Two tickets from 1, 2, 3, 4 (no replacement), X = sum', source: TYPICAL, set: { mode: 'exp', exp: 'box', tickets: '1, 2, 3, 4', draws: 2, repl: false, xs: { box2: 't1+t2' }, q: 'between', a: '4', b: '6' } },
    { group: 'More examples (course notes and typical exercises)', label: 'A typed PMF: 0.1, 0.3, 0.4, 0.2 on x = 1, 2, 3, 4', source: TYPICAL, set: { mode: 'pmf', pmf: { vals: [1, 2, 3, 4], probs: ['0.1', '0.3', '0.4', '0.2'] }, q: 'between', a: '1', b: '3' } },
    { group: 'More examples (course notes and typical exercises)', label: 'p(x) = c(x² + 1) for x = 0, 1, 2, 3', source: TYPICAL, set: { mode: 'formula', f: 'c*(x^2+1)', sup: 'range', from: 0, to: 3, q: 'le', a: '1', b: '2' } },
    { group: 'More examples (course notes and typical exercises)', label: 'p(x) = c·(2/3)^x for x = 0, 1, 2, …', source: TYPICAL, set: { mode: 'formula', f: 'c*(2/3)^x', sup: 'inf', start: 0, showN: 8, q: 'le', a: '2', b: '4' } },
  ];
  const F_CHIPS = [['c*x', 'c·x'], ['c*(x^2+1)', 'c(x²+1)'], ['c/x', 'c/x'], ['(x+c)/10', '(x+c)/10'], ['c*(1/2)^x', 'c·(1/2)ˣ'], ['c*(2/3)^x', 'c·(2/3)ˣ']];

  /** Put the example menu's options into one <optgroup> per lecture (the option values stay the item indexes). */
  function groupOptions(sel, items) {
    let grp = null, name = null;
    Array.from(sel.options).forEach(o => {
      if (o.value === '') return;
      const g = items[+o.value].group || 'Examples';
      if (g !== name) { name = g; grp = h('optgroup', { label: g.replace(/^Lecture: /, '') }); sel.appendChild(grp); }
      grp.appendChild(o);
    });
  }

  Lab.lab({
    id: 'lab-s1-pmf', course: 's1', week: 9, order: 1,
    title: 'Random variable, PMF and CDF lab', sub: 'Week 9 · random variables',
    topics: ['random variable', 'outcomes → values', 'PMF', 'unknown c', 'geometric series', 'CDF', 'F(b) − F(a)', 'discrete vs continuous'],
    desc: 'Make X three ways: from dice, coins, a card or a box of tickets (type X as a formula of the outcome), by typing a PMF, or from a formula with an unknown c. See the outcomes sorted into values, the PMF, the CDF staircase and every probability worked out from F.',
    render: host => run(host),
  });

  function run(host) {
    const st = Object.assign(clone(DEF), Lab.store.get(STORE, {}) || {});
    st.xs = Object.assign(clone(DEF.xs), st.xs || {});
    if (!st.pmf || !Array.isArray(st.pmf.vals) || !Array.isArray(st.pmf.probs) || st.pmf.vals.length !== st.pmf.probs.length) st.pmf = clone(DEF.pmf);
    if (!EXPS[st.exp]) st.exp = DEF.exp;
    if (!QS[st.q]) st.q = DEF.q;
    let side, main, P = {}, ctl = {}, last = null, pmfRes = null, sig = '';
    const save = () => Lab.store.set(STORE, st);
    let pending = false;
    /** Rebuild the controls after the current event has finished (never remove a control inside its own handler). */
    const rebuild = () => { if (pending) return; pending = true; setTimeout(() => { pending = false; buildSide(); draw(); }, 0); };
    build();

    function build() {
      ({ side, main } = K.layout(host, 's6-pmf'));
      host.classList.add('s6-lab');
      P.err = h('div', { class: 's6-err', role: 'status' });
      P.err.hidden = true;
      P.answer = K.answer();
      P.space = K.panel('Outcomes sorted into values of ' + tex('X'));
      P.pmf = K.panel('The PMF of ' + tex('X'));
      P.checks = K.panel('Is it a valid PMF? The three rules, checked');
      P.cdf = K.panel('The CDF of ' + tex('X') + ' with your ' + tex('a') + ' and ' + tex('b'));
      P.calc = K.panel('Probability calculator: every rule uses ' + tex('F'));
      P.steps = K.panel('How it is built, with your numbers');
      P.dvc = K.panel('Discrete or continuous?');
      main.append(P.err, P.answer, P.space, P.pmf, P.checks, P.cdf, P.calc, P.steps, P.dvc);
      buildSide();
      draw();
    }
    function changed() {
      if (st.preset === '') return;
      st.preset = '';
      if (ctl.pre) { ctl.pre.select.value = ''; Lab.setHTML(ctl.pre.lastChild, ''); }
    }
    function applyPreset(k) {
      const it = PRESETS[k];
      Object.keys(it.set).forEach(key => { if (key === 'xs') Object.assign(st.xs, it.set.xs); else st[key] = clone(it.set[key]); });
      st.preset = String(k);
      pmfRes = null;
      rebuild();
    }

    /* ---------------- controls */
    function buildSide() {
      Lab.clear(side);
      ctl = {};
      ctl.pre = K.presets({ label: 'Examples — the professor’s first', items: PRESETS, onPick: it => applyPreset(PRESETS.indexOf(it)) });
      groupOptions(ctl.pre.select, PRESETS);
      if (st.preset !== '' && PRESETS[+st.preset]) { ctl.pre.select.value = st.preset; Lab.setHTML(ctl.pre.lastChild, 'From: ' + PRESETS[+st.preset].source); }
      side.appendChild(ctl.pre);
      side.appendChild(K.group('1 · How X is made'));
      side.appendChild(K.selectField({ label: 'Define the random variable ' + tex('X'), value: st.mode,
        options: [{ value: 'exp', label: 'From an experiment (X = a formula of the outcome)' }, { value: 'pmf', label: 'Type the PMF yourself' }, { value: 'formula', label: 'A PMF formula with an unknown c' }],
        onChange: v => { st.mode = v; changed(); rebuild(); } }));
      if (st.mode === 'exp') sideExp(); else if (st.mode === 'pmf') sidePmf(); else sideFormula();
      side.appendChild(K.group('3 · Your question'));
      ctl.q = K.selectField({ label: 'Probability to find', value: st.q, options: QKEYS.map(k => ({ value: k, label: QS[k].opt })), onChange: v => { st.q = v; changed(); syncQ(); draw(); } });
      ctl.a = pointField({ label: tex('a'), name: 'a', value: st.a, onChange: s => { st.a = s; changed(); draw(); } });
      ctl.b = pointField({ label: tex('b'), name: 'b', value: st.b, onChange: s => { st.b = s; changed(); draw(); } });
      side.append(ctl.q, ctl.a, ctl.b);
      syncQ();
      side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => { Lab.store.set(STORE, {}); Object.keys(st).forEach(k => delete st[k]); Object.assign(st, clone(DEF)); pmfRes = null; last = null; sig = ''; build(); }, 'btn ghost sm')));
    }
    function syncQ() { ctl.b.hidden = !QS[st.q].two; }
    function sideExp() {
      const E = EXPS[st.exp];
      side.appendChild(K.group('2 · The experiment and your X'));
      side.appendChild(K.selectField({ label: 'Experiment', value: st.exp, options: Object.keys(EXPS).map(k => ({ value: k, label: EXPS[k].label })), onChange: v => { st.exp = v; changed(); rebuild(); } }));
      if (st.exp === 'die1' || st.exp === 'dice2') side.appendChild(K.numField({ label: 'Faces on ' + (st.exp === 'die1' ? 'the die' : 'each die') + ' ' + tex('k'), min: 2, max: 12, value: st.faces, hint: tex('k=6') + ' is an ordinary die.', onChange: v => { st.faces = v; changed(); draw(); } }));
      if (st.exp === 'coins') {
        side.appendChild(K.numField({ label: 'Number of tosses ' + tex('n'), min: 1, max: 6, value: st.n, onChange: v => { st.n = v; changed(); rebuild(); } }));
        const pf = K.probField({ label: 'Chance of heads on one toss ' + tex('p'), value: st.pH, onChange: () => { st.pH = pf.querySelector('input').value.trim(); changed(); draw(); } });
        side.appendChild(pf);
      }
      if (st.exp === 'box') {
        const lf = K.listField({ label: 'Numbers on the tickets (one number per ticket, repeats allowed)', value: st.tickets, rows: 2, hint: nums => tex('m=' + nums.length) + ' ticket' + (nums.length > 1 ? 's' : ''), onChange: () => { const s = lf.input.value; if (s !== st.tickets) { st.tickets = s; changed(); draw(); } } });
        side.appendChild(lf);
        side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'How many tickets are drawn?' }), Lab.seg([{ label: 'One ticket', value: 1 }, { label: 'Two tickets', value: 2 }], st.draws, v => { st.draws = v; changed(); rebuild(); })));
        if (st.draws === 2) side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Is the first ticket put back?' }), Lab.seg([{ label: 'With replacement', value: true }, { label: 'Without replacement', value: false }], st.repl, v => { st.repl = v; changed(); draw(); })));
      }
      const key = expKey(st);
      ctl.x = K.exprField({ label: tex('X') + ' = (type a formula of the outcome)', value: st.xs[key], vars: E.vars(st), onChange: (fn, src) => { if (src !== st.xs[key]) { st.xs[key] = src; changed(); } draw(); } });
      side.appendChild(ctl.x);
      side.appendChild(K.note('Names you can use: ' + E.names(st) + '.'));
      const chips = h('div', { class: 'pl-chips' });
      E.chips(st).forEach(([src, lab]) => { const b = Lab.button(lab, () => ctl.x.set(src), 'btn xs'); b.title = 'X = ' + src; chips.appendChild(b); });
      side.appendChild(chips);
    }
    function sidePmf() {
      side.appendChild(K.group('2 · Your PMF'));
      ctl.pe = K.pmfEditor({ label: 'Values ' + tex('x') + ' and probabilities ' + tex('p(x)=P(X=x)'), vals: st.pmf.vals, probs: st.pmf.probs, onChange: r => {
        pmfRes = r;
        if (r.vals.length) {
          const nv = { vals: r.vals, probs: r.p.map(String) };
          const sameP = nv.vals.length === st.pmf.vals.length && nv.vals.every((v, i) => EQ(v, K.parseNum(st.pmf.vals[i]))) && nv.probs.every((p, i) => { const q = K.parseNum(st.pmf.probs[i]); return q != null && F(p).eq(q); });
          if (!sameP) { st.pmf = nv; changed(); }
        }
        draw();
      } });
      side.appendChild(ctl.pe);
    }
    function sideFormula() {
      side.appendChild(K.group('2 · Your PMF formula'));
      ctl.f = K.exprField({ label: tex('p(x)=') + ' (use ' + tex('x') + ' and the unknown ' + tex('c') + ')', value: st.f, vars: ['x', 'c'], placeholder: 'e.g. c*x', onChange: (fn, src) => { if (src !== st.f) { st.f = src; changed(); } draw(); } });
      side.appendChild(ctl.f);
      const chips = h('div', { class: 'pl-chips' });
      F_CHIPS.forEach(([src, lab]) => { const b = Lab.button(lab, () => ctl.f.set(src), 'btn xs'); b.title = 'p(x) = ' + src; chips.appendChild(b); });
      side.appendChild(chips);
      side.appendChild(K.selectField({ label: 'The values ' + tex('x') + ' can take', value: st.sup,
        options: [{ value: 'range', label: 'Whole numbers from … to …' }, { value: 'list', label: 'A list of values I type' }, { value: 'inf', label: 'x = s, s+1, s+2, … (never stops)' }],
        onChange: v => { st.sup = v; changed(); rebuild(); } }));
      if (st.sup === 'range') {
        side.appendChild(K.numField({ label: 'First value', min: -20, max: 40, value: st.from, onChange: v => { st.from = v; changed(); draw(); } }));
        side.appendChild(K.numField({ label: 'Last value', min: -20, max: 60, value: st.to, onChange: v => { st.to = v; changed(); draw(); } }));
      } else if (st.sup === 'list') {
        const lf = K.listField({ label: 'Values of ' + tex('x'), value: st.list, rows: 2, onChange: () => { const s = lf.input.value; if (s !== st.list) { st.list = s; changed(); draw(); } } });
        side.appendChild(lf);
      } else {
        side.appendChild(K.numField({ label: 'First value ' + tex('s'), min: -5, max: 10, value: st.start, onChange: v => { st.start = v; changed(); draw(); } }));
        side.appendChild(K.numField({ label: 'How many values to draw', min: 3, max: 41, value: st.showN, hint: 'Only for the pictures: ' + tex('c') + ' and every probability use the whole infinite list.', onChange: v => { st.showN = v; changed(); draw(); } }));
      }
    }
    function syncAB(M) {
      const xs = M.rows.map(r => r.xn);
      const lo = xs[0], hi = xs[xs.length - 1];
      const allInt = xs.every(v => Number.isInteger(Math.round(v * 1e9) / 1e9));
      const span = Math.max(1, hi - lo);
      const step = allInt ? 0.5 : niceStep(span / 100);
      const m = allInt ? 1 : span / 10;
      const rlo = lo - m, rhi = hi + m;
      const s2 = [lo, hi, xs.length, M.kind].join('|');
      if (s2 !== sig) {
        const inR = s => { const f = K.parseNum(s); return f != null && Number(f) >= rlo && Number(f) <= rhi; };
        if (sig && (!inR(st.a) || !inR(st.b))) {
          const mid = xs[Math.floor((xs.length - 1) / 2)], top = xs[Math.min(xs.length - 1, Math.floor((xs.length - 1) / 2) + Math.max(1, Math.floor(xs.length / 4)))];
          st.a = vp(toQ(mid)).replace('−', '-'); st.b = vp(toQ(top)).replace('−', '-');
          ctl.a.set(st.a); ctl.b.set(st.b);
        }
        sig = s2;
      }
      ctl.a.setRange(rlo, rhi, step);
      ctl.b.setRange(rlo, rhi, step);
      ctl.a.hint('Values of ' + tex('X') + ': ' + tex(listTex(M.rows.map(r => r.x), 9) + (M.inf ? ',\\ \\dots' : '')) + '. Any number works: the CDF is defined everywhere.');
    }

    /* ---------------- drawing */
    function model() {
      if (st.mode === 'pmf') return modelPmf(st, pmfRes);
      if (st.mode === 'formula') return modelFormula(st);
      return modelExp(st);
    }
    function draw() {
      save();
      const m = model();
      if (m.ok) last = m.M;
      P.err.hidden = m.ok;
      if (!m.ok) Lab.setHTML(P.err, '<b>Not redrawn yet.</b> ' + m.err + (last ? ' The pictures below still show your last valid ' + tex('X') + '.' : ''));
      drawChecks(m);
      if (!last) { [P.answer, P.space, P.pmf, P.cdf, P.calc, P.steps, P.dvc].forEach(p => (p.hidden = true)); return; }
      [P.answer, P.pmf, P.cdf, P.calc, P.steps, P.dvc].forEach(p => (p.hidden = false));
      // panels that still show the last valid X are dimmed while the current input is not valid
      [P.answer, P.space, P.pmf, P.cdf, P.calc, P.dvc].forEach(p => p.classList.toggle('s6-stale', !m.ok));
      P.steps.classList.toggle('s6-stale', !m.ok && !m.solve);
      const M = last;
      syncAB(M);
      const Q = question(M, st);
      drawAnswer(M, Q); drawSpace(M, Q); drawPmf(M, Q); drawCdf(M, Q); drawCalc(M, Q); drawSteps(m.ok ? M : null, m, Q); drawDvc(M, Q);
    }

    function drawAnswer(M, Q) {
      const box = P.answer;
      Lab.clear(box);
      box.appendChild(K.note('Your ' + tex('X') + ': ' + M.words + '. Your question: ' + tex(Q.sym) + ', with ' + tex('a=' + Q.at) + (Q.d.two ? ' and ' + tex('b=' + Q.bt) : '') + '.', 'pl-ans-ev'));
      if (M.kind === 'formula') box.appendChild(h('div', { class: 'pl-ans-big s6-big', html: Lab.tex('\\displaystyle c=' + (M.cTex ? M.cTex + '\\approx ' + decStr(M.c, 6) : tx(M.c) + decTail(M.c))) }));
      box.appendChild(h('div', { class: 'pl-ans-big s6-big', html: Lab.tex('\\displaystyle ' + Q.full) }));
      const valTxt = valsWords(Q);
      let why;
      switch (Q.key) {
        case 'le': why = tex('F(' + Q.at + ')') + ' adds ' + tex('p(x)') + ' over every value ' + tex('x\\le ' + Q.at) + ': ' + valTxt + '.'; break;
        case 'lt': why = 'Strictly less than ' + tex('a') + ': take ' + tex('F(' + Q.at + ')') + ' and remove the jump at ' + tex('a') + ' itself, ' + tex('P(X=' + Q.at + ')=' + pq(M, Q.pa)) + (isZero(Q.pa) ? ' (' + tex('a') + ' is not a value of ' + tex('X') + ', so nothing is removed)' : '') + '. Values kept: ' + valTxt + '.'; break;
        case 'gt': why = tex('X>' + Q.at) + ' is the complement of ' + tex('X\\le ' + Q.at) + ', so subtract ' + tex('F(' + Q.at + ')') + ' from the total 1. Values counted: ' + valTxt + '.'; break;
        case 'eq': why = isZero(Q.pa) ? tex('a=' + Q.at) + ' is not a value of ' + tex('X') + ', so ' + tex('P(X=' + Q.at + ')=0') + ' (the staircase has no jump there).' : 'The height of the jump of the staircase at ' + tex('a=' + Q.at) + '.'; break;
        case 'between': why = Q.empty ? 'Here ' + tex('a\\ge b') + ': no value can be ' + tex('>a') + ' and ' + tex('\\le b') + ' at once, so the probability is 0.' : tex('F(' + Q.bt + ')') + ' adds ' + tex('p(x)') + ' up to ' + tex(Q.bt) + ', ' + tex('F(' + Q.at + ')') + ' up to ' + tex(Q.at) + '; the difference keeps the values ' + tex('x') + ' with ' + tex(Q.at + '<x\\le ' + Q.bt) + ': ' + valTxt + '.'; break;
        default: why = Q.empty ? 'Here ' + tex('a>b') + ', so no value lies between them: the probability is 0.' : 'Like ' + tex('F(b)-F(a)') + ', but ' + tex('a') + ' itself is included, so add ' + tex('P(X=' + Q.at + ')=' + pq(M, Q.pa)) + '. Values kept: ' + valTxt + '.';
      }
      if (M.eqLikely && !Q.empty) { const cnt = Q.used.reduce((s, r) => s + r.count, 0); why += ' That is ' + cnt + ' of the ' + M.N + ' equally likely outcomes.'; }
      box.appendChild(K.note(why, 'pl-ans-sub'));
    }

    function drawSpace(M, Q) {
      P.space.hidden = M.kind !== 'exp';
      if (M.kind !== 'exp') return;
      const body = P.space.body;
      Lab.clear(body);
      const stackNote = Math.max(...M.rows.map(r => r.count)) <= 8 && M.eqLikely ? ' Under each box: ' + tex('p(x)') + ' = (outcomes in the box) ÷ ' + tex('N=' + M.N) + '.' : '';
      P.space.sub(M.sp.size + ' Each box holds the outcomes that give the same value of ' + tex('X') + ' — several outcomes can share one value.' + stackNote + ' Violet boxes are inside your event ' + tex(Q.sym) + '. Point at (or tap) an outcome to see ' + tex('X') + ' worked out.');
      const stack = Math.max(...M.rows.map(r => r.count)) <= 8;
      const maxP = Math.max(...M.sp.outs.map(o => Number(o.p)));
      const cols = h('div', { class: 's6-cols' + (stack ? ' stack' : '') });
      const info = h('div', { class: 'ws-readout s6-info' });
      M.rows.forEach(r => {
        const inE = Q.test(r);
        const col = h('div', { class: 's6-col' + (inE ? ' in' : '') });
        col.appendChild(h('div', { class: 's6-col-head', html: Lab.tex('X=' + tx(r.x)) + (stack && M.eqLikely ? '' : '<span>' + r.count + ' outcome' + (r.count > 1 ? 's' : '') + '</span>') }));
        const tiles = h('div', { class: 's6-tiles' });
        r.members.forEach(o => {
          const t = h('button', { class: 's6-tile', type: 'button', title: o.label + ': X = ' + vp(o.x) });
          t.appendChild(o.draw());
          if (!M.eqLikely) { const bar = h('span', { class: 's6-mass' }); bar.style.width = Math.max(6, (Number(o.p) / maxP) * 100) + '%'; t.appendChild(bar); }
          const show = () => { Lab.$$('.s6-tile.on', cols).forEach(z => z.classList.remove('on')); t.classList.add('on'); tileInfo(M, o, info); };
          t.addEventListener('mouseenter', show);
          t.addEventListener('focus', show);
          t.addEventListener('click', show);
          tiles.appendChild(t);
        });
        col.appendChild(tiles);
        col.appendChild(h('div', { class: 's6-col-foot', title: 'p(' + vp(r.x) + ') = ' + vp(r.p), html: Lab.tex((stack && M.eqLikely ? '' : 'p(' + tx(r.x) + ')=') + pq(M, r.p)) }));
        cols.appendChild(col);
      });
      body.appendChild(cols);
      Lab.setHTML(info, '<span class="muted">Point at any outcome: you will see its numbers put into your formula for ' + tex('X') + '.</span>');
      body.appendChild(info);
    }
    function tileInfo(M, o, info) {
      const names = M.used.filter(k => Object.prototype.hasOwnProperty.call(o.vars, k));
      const assigns = names.map(k => '<code>' + k + '</code> = ' + vp(toQ(o.vars[k])));
      Lab.setHTML(info, '<b>' + esc(o.label) + '</b>: ' + (assigns.length ? assigns.join(', ') + ', so ' : '') + tex('X') + ' = <code>' + esc(M.src) + '</code>' + (names.length ? ' = <code>' + esc(subst(M.src, o.vars)) + '</code>' : '') + ' = <b>' + vp(o.x) + '</b>. This outcome has probability ' + tex(tx(o.p)) + '.');
    }

    function drawPmf(M, Q) {
      const body = P.pmf.body;
      Lab.clear(body);
      P.pmf.sub('Bar height ' + tex('=p(x)=P(X=x)') + '. Violet bars are the values in your event ' + tex(Q.sym) + '.');
      body.appendChild(K.pmfChart(M.rows.map(r => ({ x: r.xn, p: r.p, label: pq(M, r.p), part: Q.test(r) ? r.p : null })), { xName: 'X', height: 200 }));
      let note;
      if (M.kind === 'exp') note = M.eqLikely ? 'Each bar is a count over ' + tex('N=' + M.N) + ': ' + tex('p(x)') + ' = (number of outcomes with ' + tex('X=x') + ') ÷ ' + M.N + '.' : 'Each bar adds the probabilities of the outcomes with that value (they are not equally likely here).';
      else if (M.kind === 'pmf') note = 'The bars are the probabilities you typed.';
      else note = 'Each bar is ' + tex('p(x)') + ' from your formula with ' + tex('c=' + tx(M.c)) + '.' + (M.inf ? ' Only ' + tex('x=' + M.inf.s + ',\\dots,' + M.rows[M.rows.length - 1].xn) + ' are drawn; the rest, ' + (M.inf.kind === 'geo' ? tex('P(X>' + M.rows[M.rows.length - 1].xn + ')=r^{' + M.rows.length + '}=' + pbase(M.inf.r) + '^{' + M.rows.length + '}=' + tx(pw(M.inf.r, M.rows.length)) + decTail(pw(M.inf.r, M.rows.length))) : tex('P(X>' + M.rows[M.rows.length - 1].xn + ')=1-F(' + M.rows[M.rows.length - 1].xn + ')\\approx ' + decStr(1 - Number(Fat(M, M.rows[M.rows.length - 1].xn)), 6))) + ', is spread over the values after.' : '');
      if (M.inexact) note += ' Your numbers have no exact fraction, so decimals are rounded to 6 places.';
      body.appendChild(K.note(note, 'small muted'));
    }

    function drawChecks(m) {
      const body = P.checks.body;
      Lab.clear(body);
      const ul = h('ul', { class: 's6-checks' });
      const sumLine = (M, rows) => {
        if (M && M.inf && M.inf.kind === 'exp') return '\\sum_{x=' + M.inf.s + '}^{\\infty}p(x)=c\\cdot S_\\infty=\\frac{1}{S_\\infty}\\cdot S_\\infty=1';
        if (M && M.inf) return '\\sum_{x=' + M.inf.s + '}^{\\infty}p(x)=c\\cdot S_\\infty=' + tx(M.c) + '\\cdot ' + tx(M.inf.S) + '=1';
        if (M && M.eqLikely) return '\\sum_x p(x)=\\frac{' + (rows.length <= 16 ? rows.map(r => r.count).join('+') : '\\dots') + '}{' + M.N + '}=\\frac{' + M.N + '}{' + M.N + '}=1';
        const ps = rows.map(r => r.p);
        const tot = sum(ps);
        return '\\sum_x p(x)=' + (ps.length <= 8 ? ps.map(tx).join('+') + '=' : ps.length > 1 ? ps.slice(0, 3).map(tx).join('+') + '+\\dots+' + tx(ps[ps.length - 1]) + '=' : '') + tx(tot);
      };
      if (m.ok) {
        const M = m.M, rows = M.rows;
        const min = rows.reduce((a, r) => (Number(r.p) < Number(a.p) ? r : a), rows[0]);
        const off = rows.length > 1 ? toQ((rows[0].xn + rows[1].xn) / 2) : toQ(rows[0].xn + 1);
        ul.appendChild(checkItem('ok', 'Every p(x) ≥ 0.', 'The smallest drawn is ' + tex('p(' + tx(min.x) + ')=' + pq(M, min.p)) + '.' + (M.kind === 'exp' ? ' (A count of outcomes over ' + tex('N') + ' can never be negative.)' : M.inf && M.inf.kind === 'geo' ? ' Every term is ' + tex('c\\cdot a\\cdot r^{k}') + ' with ' + tex('c\\cdot a=' + tx(M.inf.ca) + '>0') + ' and ' + tex('r=' + tx(M.inf.r) + '\\ge 0') + '.' : M.inf ? ' Every term is ' + tex('c\\cdot K\\cdot\\lambda^{x}/x!') + ' with ' + tex('c\\cdot K>0') + ' and ' + tex('\\lambda=' + tx(M.inf.lam) + '>0') + '.' : '')));
        ul.appendChild(checkItem('ok', 'The probabilities add up to 1.', tex(sumLine(M, rows)) + (M.kind === 'exp' ? ' — every one of the ' + M.N + ' outcomes lands on exactly one value of ' + tex('X') + '.' : M.kind === 'formula' ? ' — that is how ' + tex('c') + ' was chosen.' : '')));
        ul.appendChild(checkItem('ok', 'p(x) = 0 for every other x.', 'For example ' + tex('P(X=' + (ex(off) && off.d !== 1 && shortDec(off) ? dec(off) : tx(off)) + ')=0') + (M.kind === 'exp' ? ': no outcome gives that value.' : ': it is not one of the values of ' + tex('X') + '.')));
      } else if (m.checks && m.checks.bad) {
        // read the boxes themselves, so the failing rule can be named (e.g. a negative probability)
        const raw = ctl.pe ? Lab.$$('.pe-row', ctl.pe).map(r => { const ins = r.querySelectorAll('input'); return { v: K.parseNum(ins[0].value), p: K.parseNum(ins[1].value), sv: ins[0].value, sp: ins[1].value }; }) : [];
        const unread = raw.filter(z => z.v == null || z.p == null);
        const negs = raw.filter(z => z.v != null && z.p != null && Number(z.p) < 0);
        const vals = raw.filter(z => z.v != null).map(z => Number(z.v));
        const dup = vals.length !== new Set(vals).size;
        if (unread.length) ul.appendChild(checkItem('bad', 'Every p(x) ≥ 0.', 'Not checked: ' + unread.length + ' box' + (unread.length > 1 ? 'es are' : ' is') + ' not a number (' + unread.slice(0, 3).map(z => '<code>' + esc(z.v == null ? z.sv : z.sp) + '</code>').join(', ') + ').'));
        else if (negs.length) ul.appendChild(checkItem('bad', 'Every p(x) ≥ 0.', 'No: ' + negs.map(z => tex('p(' + tx(toQ(Number(z.v))) + ')=' + tx(fin(z.p)) + '<0')).join(', ') + '. A probability can never be negative, so this is <b>not</b> a PMF.'));
        else ul.appendChild(checkItem('ok', 'Every p(x) ≥ 0.', 'Yes, every probability you typed is 0 or more.'));
        if (!unread.length) {
          const tot = sum(raw.map(z => fin(z.p)));
          const terms = raw.map(z => tx(fin(z.p))).map((t0, i) => (i && t0.startsWith('-') ? '\\left(' + t0 + '\\right)' : t0));
          ul.appendChild(checkItem(same(tot, F(1)) ? 'ok' : 'bad', 'The probabilities add up to 1.', tex('\\sum p=' + (terms.length <= 8 ? terms.join('+') + '=' : '') + tx(tot) + (same(tot, F(1)) ? '' : '\\ne 1')) + (same(tot, F(1)) && negs.length ? ' — the total is right, but that cannot rescue a negative entry: both rules must hold.' : '')));
        } else ul.appendChild(checkItem('skip', 'The probabilities add up to 1.', 'Fix the boxes that are not numbers first.'));
        ul.appendChild(checkItem(dup ? 'bad' : 'ok', 'p(x) = 0 for every other x.', dup ? 'A value appears twice in your table; each value gets one row.' : 'Values not in your table get probability 0.'));
      } else if (m.checks && m.checks.rows) {
        const rows = m.checks.rows;
        const min = rows.reduce((a, r) => (Number(r.p) < Number(a.p) ? r : a), rows[0]);
        ul.appendChild(checkItem('ok', 'Every p(x) ≥ 0.', 'The smallest is ' + tex('p(' + tx(min.x) + ')=' + tx(min.p)) + '.'));
        ul.appendChild(checkItem('bad', 'The probabilities add up to 1.', tex(sumLine(null, rows) + '\\ne 1') + '. “Rescale to total 1” divides every probability by this total ' + tex(tx(m.checks.total)) + '.'));
        ul.appendChild(checkItem('ok', 'p(x) = 0 for every other x.', 'Values not in your table get probability 0.'));
      } else if (m.checks && m.checks.neg) {
        ul.appendChild(checkItem('bad', 'Every p(x) ≥ 0.', 'With ' + tex('c=' + tx(m.checks.c)) + ', ' + tex('p(' + tx(toQ(m.checks.neg.x)) + ')=' + tx(m.checks.neg.p) + '<0') + '. A probability can never be negative.'));
        ul.appendChild(checkItem('ok', 'The probabilities add up to 1.', 'Yes — ' + tex('c') + ' was chosen to make the total 1, but that is not enough.'));
        ul.appendChild(checkItem('ok', 'p(x) = 0 for every other x.', 'Values outside your list get probability 0.'));
      } else {
        ul.appendChild(checkItem('skip', 'Not checked.', 'Your input cannot be read yet — see the red message above.'));
      }
      body.appendChild(ul);
      P.checks.sub('From the notes: ' + tex('p(x_i)\\ge 0') + ', ' + tex('p(x)=0') + ' off the list of values, and ' + tex('\\sum_i p(x_i)=1') + '.' + (m.ok ? '' : ' (These checks follow what you typed just now.)'));
    }

    function drawCdf(M, Q) {
      const body = P.cdf.body;
      Lab.clear(body);
      P.cdf.sub(tex('F(a)=P(X\\le a)') + ': add ' + tex('p(x)') + ' for every value ' + tex('x\\le a') + '. It is a staircase — flat between values, jumping up by ' + tex('p(x)') + ' at each value (the filled dot is the value ' + tex('F') + ' takes there). Violet: ' + tex('a') + (Q.d.two ? '; teal: ' + tex('b') : '') + '; the violet bar at the right is your probability as a height. Move ' + tex('a') + (Q.d.two ? ' and ' + tex('b') : '') + ' in the controls (3 · Your question).');
      body.appendChild(h('div', { class: 'cdf-host' }, cdfPicture(M, Q)));
      const read = h('div', { class: 'ws-readout s6-read' });
      Lab.setHTML(read, Lab.tex(fLine(M, Q.a)) + (Q.d.two ? '<br>' + Lab.tex(fLine(M, Q.b)) : ''));
      body.appendChild(read);
      let acc = F(0);
      const rows = M.rows.map((r, k) => {
        const prev = acc;
        acc = add(acc, r.p);
        const how = k ? 'F(' + tx(r.x) + ')=F(' + tx(M.rows[k - 1].x) + ')+p(' + tx(r.x) + ')=' + pq(M, prev) + '+' + pq(M, r.p) + '=' + pq(M, acc) : 'F(' + tx(r.x) + ')=p(' + tx(r.x) + ')=' + pq(M, acc);
        return [Lab.tex(tx(r.x)), Lab.tex(pq(M, r.p)), Lab.tex(how)];
      });
      body.appendChild(K.note('The staircase as a table — each step adds the next ' + tex('p(x)') + ' to the running total:', 'small muted'));
      body.appendChild(table([tex('x'), tex('p(x)'), tex('F(x)=F(\\text{previous})+p(x)')], rows, { scroll: rows.length > 12 }));
      if (M.inf) body.appendChild(K.note('After ' + tex('x=' + M.rows[M.rows.length - 1].xn) + ' the staircase keeps climbing' + (M.inf.kind === 'geo' ? ': ' + tex('F(x)=1-r^{\\,' + xMinus(M.inf.s - 1) + '}') : ', one step ' + tex('p(x)') + ' at a time,') + ' and gets closer and closer to 1 but never jumps past it.', 'small muted'));
      body.appendChild(cdfRules(M, Q));
    }

    /** The rules every CDF follows (Week 9 notes), each one worked out on the learner's own F. */
    function cdfRules(M, Q) {
      const rows = M.rows, n = rows.length;
      const Fs = [];
      let acc = F(0);
      rows.forEach(r => { acc = add(acc, r.p); Fs.push(acc); });
      const FT = v => pq(M, v);
      /** a cut-off t as TeX: a short decimal stays a decimal (6.9, not 69/10) */
      const tt = q => (ex(q) && q.d !== 1 && shortDec(q) ? dec(q) : tx(q));
      const gapTex = (t0, g) => '1-F(' + tt(t0) + ')' + (ex(g) ? '=' + tx(g) + decTail(g) : '\\approx ' + decStr(g));
      const x1 = rows[0], xk = rows[n - 1];
      const ul = h('ul', { class: 's6-checks' });
      // 1. never goes down
      const up = Fs.every((f, k) => !k || !LT(f, Fs[k - 1]));
      const minR = rows.reduce((a, r) => (Number(r.p) < Number(a.p) ? r : a), rows[0]);
      const show = n <= 6 ? Lab.range(0, n - 1) : [0, 1, 2, '…', n - 1];
      const chain = show.map(k => (k === '…' ? '\\cdots' : 'F(' + tx(rows[k].x) + ')=' + FT(Fs[k]))).join('\\le ') + (M.inf ? '\\le\\cdots' : '');
      ul.appendChild(checkItem(up ? 'ok' : 'bad', 'F never goes down.', 'Each step adds the next ' + tex('p(x)\\ge 0') + ' (your smallest is ' + tex('p(' + tx(minR.x) + ')=' + FT(minR.p)) + '), so ' + tex('F') + ' stays level or goes up: ' + tex(chain) + '.'));
      // 2. 0 on the far left
      const tL = toQ(x1.xn - 1), FL = Fat(M, tL);
      ul.appendChild(checkItem(isZero(FL) ? 'ok' : 'bad', 'F(t) = 0 to the left of the smallest value.', 'Your smallest value is ' + tex('x=' + tx(x1.x)) + '. For any ' + tex('t<' + tx(x1.x)) + ' no value of ' + tex('X') + ' is ' + tex('\\le t') + ', so ' + tex('F(t)=P(X\\le t)=0') + ' — for example ' + tex('F(' + tt(tL) + ')=' + FT(FL)) + ' — and it stays 0 all the way to the left, as ' + tex('t\\to-\\infty') + ' (the flat line at height 0 in the picture).'));
      // 3. 1 on the far right (or closer and closer to 1 when the values never stop)
      if (!M.inf) {
        const tR = toQ(xk.xn + 1), Fk = Fs[n - 1], FR = Fat(M, tR);
        ul.appendChild(checkItem(same(Fk, F(1)) && same(FR, F(1)) ? 'ok' : 'bad', 'F(t) = 1 from the largest value on.', 'Your largest value is ' + tex('x=' + tx(xk.x)) + ', and by then every ' + tex('p(x)') + ' has been added: ' + tex('F(' + tx(xk.x) + ')=' + FT(Fk) + (FT(Fk) === '1' ? '' : '=1')) + '. For any ' + tex('t\\ge ' + tx(xk.x)) + ', ' + tex('F(t)=1') + ' — for example ' + tex('F(' + tt(tR) + ')=' + FT(FR) + (FT(FR) === '1' ? '' : '=1')) + ' — and it stays 1 as ' + tex('t\\to\\infty') + ' (the flat line at height 1 in the picture).'));
      } else {
        const t2 = toQ(xk.xn + 10);
        // λ^x/x! terms are decimals: add the tail itself, since 1 − F loses digits when F is very close to 1
        const tailSum = t0 => { let s0 = 0; for (let x = Math.floor(Number(t0) + 1e-9) + 1, j = 0; j < 400; x++, j++) { const pv = Number(pAt(M, x)); s0 += pv; if (pv === 0 || (j > 5 && pv < s0 * 1e-17)) break; } return s0; };
        const g1 = M.inf.kind === 'exp' ? tailSum(xk.xn) : sub(F(1), Fs[n - 1]);
        const g2 = M.inf.kind === 'exp' ? tailSum(t2) : sub(F(1), Fat(M, t2));
        ul.appendChild(checkItem(LT(g2, g1) ? 'ok' : 'bad', 'F(t) gets closer and closer to 1.', 'Your ' + tex('X') + ' has no largest value, so ' + tex('F') + ' never reaches 1 exactly, but the gap ' + tex('1-F(t)') + ' shrinks towards 0 as ' + tex('t\\to\\infty') + ': ' + tex(gapTex(xk.x, g1)) + ', and 10 further on ' + tex(gapTex(t2, g2)) + '.'));
      }
      // 4. at a jump F takes the upper value: continuous from the right
      let k = rows.findIndex(r => EQ(r.xn, Q.a) && Number(r.p) > 0);
      const atA = k >= 0;
      if (!atA) k = rows.reduce((b, r, i) => (Number(r.p) > Number(rows[b].p) ? i : b), 0);
      const v = rows[k], prevF = k ? Fs[k - 1] : F(0);
      const lo = k ? rows[k - 1].xn : v.xn - 1, hi = k < n - 1 ? rows[k + 1].xn : v.xn + 1;
      const eps = Math.min(0.1, (v.xn - lo) / 2, (hi - v.xn) / 2);
      const tm = toQ(+(v.xn - eps).toPrecision(12)), tp = toQ(+(v.xn + eps).toPrecision(12));
      const Fm = Fat(M, tm), Fv = Fat(M, v.x), Fp = Fat(M, tp);
      const rc = same(Fm, prevF) && same(Fv, Fs[k]) && same(Fp, Fs[k]);
      ul.appendChild(checkItem(rc ? 'ok' : 'bad', 'At a jump, F takes the upper value (F is right-continuous).', 'At ' + (atA ? 'your ' + tex('a=' + tx(v.x)) : tex('x=' + tx(v.x)) + ', the biggest jump') + ': ' + tex('F(' + tt(tm) + ')=' + FT(Fm) + ',\\quad F(' + tx(v.x) + ')=' + FT(Fv) + ',\\quad F(' + tt(tp) + ')=' + FT(Fp)) + '. Just below ' + tex(tx(v.x)) + ' the staircase is still at ' + tex(FT(prevF)) + ' (the open dot); at ' + tex(tx(v.x)) + ' itself it is already at the top of the jump (the filled dot), and it stays there just to the right. So ' + tex('F(' + tx(v.x) + ')') + ' already counts ' + tex('p(' + tx(v.x) + ')=' + FT(Fs[k]) + '-' + FT(prevF) + '=' + FT(v.p)) + '.'));
      // 5. P(a < X ≤ b) = F(b) − F(a), with the learner's a and b (taken in order)
      const ra = K.parseNum(st.a), rb = K.parseNum(st.b);
      const inOrder = ra == null || rb == null || Number(ra) <= Number(rb);
      const Q2 = question(M, inOrder ? st : Object.assign({}, st, { a: st.b, b: st.a }), 'between');
      let line5, ok5 = true;
      if (Q2.empty) line5 = ' With ' + tex('a=b') + ' no value can be ' + tex('>a') + ' and ' + tex('\\le b') + ' at once, and ' + tex('F(b)-F(a)=0') + ' too.';
      else if (Q2.capped) line5 = '';
      else {
        const direct = sum(Q2.used.map(r => r.p));
        ok5 = same(direct, Q2.val);
        const terms = Q2.used.map(r => 'p(' + tx(r.x) + ')');
        line5 = Q2.used.length
          ? ' Adding the PMF directly over the values ' + valsWords(Q2) + ': ' + tex((terms.length <= 6 ? terms.join('+') : '\\sum p(x)') + '=' + pq(M, direct) + pqTail(M, direct)) + (ok5 ? ' ✓ the same.' : ' — different.')
          : ' No value of ' + tex('X') + ' lies above ' + tex('a') + ' and up to ' + tex('b') + ', so adding the PMF directly gives 0 too' + (ok5 ? ' ✓' : ' — different') + '.';
      }
      ul.appendChild(checkItem(ok5 ? 'ok' : 'bad', 'P(a < X ≤ b) = F(b) − F(a).', 'The values up to ' + tex('b') + ', minus the values up to ' + tex('a') + ', leave the values above ' + tex('a') + ' and up to ' + tex('b') + '. With your ' + tex('a=' + Q2.at) + ' and ' + tex('b=' + Q2.bt) + (inOrder ? '' : ' (your ' + tex('a') + ' and ' + tex('b') + ' taken in order)') + ': ' + tex(Q2.full) + '.' + line5));
      return h('div', { class: 's6-cdfrules' }, K.note('<b>The rules every CDF follows</b> (Week 9 notes), checked on your ' + tex('F') + ':', ''), ul);
    }

    function drawCalc(M, Q) {
      const body = P.calc.body;
      Lab.clear(body);
      P.calc.sub('You chose ' + tex('a=' + Q.at) + ' and ' + tex('b=' + Q.bt) + ' (change them in 3 · Your question). Your question’s row is violet.');
      const list = h('div', { class: 's6-qlist' });
      QKEYS.forEach(k => {
        const q = k === Q.key ? Q : question(M, st, k);
        const words = q.empty ? 'none (' + tex(k === 'between' ? 'a\\ge b' : 'a>b') + ')' : valsWords(q);
        const row = h('div', { class: 's6-q' + (k === Q.key ? ' on' : '') });
        row.appendChild(h('div', { class: 's6-q-rule', html: Lab.tex(QS[k].sym('a', 'b') + '=' + QS[k].rule) }));
        row.appendChild(h('div', { class: 's6-q-num', html: Lab.tex(q.full) }));
        row.appendChild(K.note('Values of ' + tex('X') + ' included: ' + words, 's6-q-vals'));
        list.appendChild(row);
      });
      body.appendChild(list);
      const terms = Q.used.map(r => 'p(' + tx(r.x) + ')');
      let check;
      if (Q.empty) check = 'No value of ' + tex('X') + ' satisfies the condition, so the direct sum is empty: 0.';
      else if (Q.unbounded || Q.capped) check = 'Adding ' + tex('p(x)') + ' directly would need infinitely many terms; that is why ' + tex('1-F(a)') + ' is the way.';
      else if (!Q.used.length) check = 'No value of ' + tex('X') + ' satisfies the condition, so the direct sum is 0.';
      else {
        const s = sum(Q.used.map(r => r.p));
        check = 'Check by adding the PMF directly: ' + tex(Q.sym + '=' + (terms.length <= 6 ? terms.join('+') + (terms.length > 1 ? '=' + Q.used.map(r => pq(M, r.p)).join('+') : '') : '\\sum p(x)') + '=' + pq(M, s) + pqTail(M, s)) + ' ' + (same(s, Q.val) ? '<span class="cgood">✓ same</span>' : '<span class="cbad">differs</span>');
      }
      body.appendChild(K.note(check, 'small'));
    }

    function drawSteps(M, m, Q) {
      const body = P.steps.body;
      Lab.clear(body);
      let steps = [];
      if (!M && m.solve) { P.steps.hidden = false; steps = m.solve.slice(); body.appendChild(stepsW(steps)); return; }
      if (!M) M = last;
      if (M.kind === 'exp') {
        const ex0 = M.rows.reduce((a, r) => (r.count > a.count ? r : a), M.rows[0]);
        const o = ex0.members[ex0.members.length > 1 ? 1 : 0];
        steps.push({ html: '<b>The sample space.</b> ' + M.sp.size });
        steps.push({ html: '<b>' + tex('X') + ' is a function:</b> it reads one outcome and gives one number. Yours is ' + tex('X') + ' = <code>' + esc(M.src) + '</code>. Example: the outcome <b>' + esc(o.label) + '</b> gives ' + tex('X') + ' = <code>' + esc(subst(M.src, o.vars)) + '</code> = ' + vp(o.x) + '.' });
        steps.push({ html: '<b>Several outcomes can give the same number.</b> Sorting all ' + M.N + ' outcomes by their value gives ' + M.rows.length + ' different value' + (M.rows.length > 1 ? 's' : '') + ': ' + tex(listTex(M.rows.map(r => r.x), 12)) + '.' });
        const list = ex0.members.slice(0, 8).map(z => esc(z.label)).join('; ') + (ex0.members.length > 8 ? '; …' : '');
        steps.push({ html: '<b>The PMF.</b> ' + (M.eqLikely ? 'All ' + tex('N=' + M.N) + ' outcomes are equally likely, so ' + tex('p(x)') + ' = (number of outcomes with ' + tex('X=x') + ') ÷ ' + tex('N') + '. For the most common value:' : 'Add the probabilities of the outcomes that give each value. For the most common value:'),
          math: 'p(' + tx(ex0.x) + ')=P(X=' + tx(ex0.x) + ')=' + (M.eqLikely ? '\\frac{' + ex0.count + '}{' + M.N + '}' + pqTail(M, ex0.p) : (ex0.members.length > 1 && ex0.members.length <= 6 ? ex0.members.map(z => tx(z.p)).join('+') + '=' : '') + tx(ex0.p) + decTail(ex0.p)),
          note: 'Its ' + ex0.count + ' outcome' + (ex0.count > 1 ? 's' : '') + ': ' + list + '.' });
        steps.push({ html: '<b>Check.</b> Every outcome is counted exactly once, so the PMF adds up to 1 (see “The three rules, checked”).' });
      } else if (M.kind === 'pmf') {
        steps.push({ html: '<b>Your table.</b> ' + tex('X') + ' takes ' + M.rows.length + ' value' + (M.rows.length > 1 ? 's' : '') + ': ' + tex(listTex(M.rows.map(r => r.x), 12)) + ', with ' + tex(M.rows.slice(0, 8).map(r => 'p(' + tx(r.x) + ')=' + tx(r.p)).join(',\\ ') + (M.rows.length > 8 ? ',\\ \\dots' : '')) + '.' });
        steps.push({ html: '<b>The three rules</b> hold (see the panel above): no negative probability, total ' + tex('1') + ', and 0 for any other value.' });
      } else {
        steps = M.solve.slice();
      }
      steps.push({ html: '<b>The CDF</b> adds the PMF from the left, ' + tex('F(a)=\\sum_{x\\le a}p(x)') + '. With your ' + tex('a=' + Q.at) + ':', math: fLine(M, Q.a) });
      if (Q.d.two) steps.push({ html: 'With your ' + tex('b=' + Q.bt) + ':', math: fLine(M, Q.b) });
      steps.push({ html: '<b>Your question</b> uses the rule ' + tex(Q.sym + '=' + Q.d.rule.replace(/\ba\b/g, Q.at).replace(/\bb\b/g, Q.bt)) + ':', math: Q.full });
      body.appendChild(stepsW(steps));
    }

    function drawDvc(M, Q) {
      const body = P.dvc.body;
      Lab.clear(body);
      const grid = h('div', { class: 's6-dvc' });
      const d1 = h('div', { class: 'you' }), d2 = h('div');
      Lab.setHTML(d1, '<b>Discrete</b> (your ' + tex('X') + '). The possible values are separate points with gaps between them — typically <b>counts</b> (number of items, a route number). Each value has ' + tex('P(X=x)>0') + '; the PMF lists them; the CDF is a staircase with jumps.');
      Lab.setHTML(d2, '<b>Continuous.</b> The possible values fill a whole interval — typically <b>measurements</b> (weight, time, distance). ' + tex('P(X=x)=0') + ' for every single number ' + tex('x') + '; probability is an area under a density (Week 12); the CDF rises smoothly with no jumps.');
      grid.append(d1, d2);
      body.appendChild(grid);
      const n = M.rows.length;
      const yours = M.inf ? 'Your ' + tex('X') + ' takes the values ' + tex(listTex(M.rows.slice(0, 4).map(r => r.x)) + ',\\ \\dots') + ' — infinitely many, but still separate points you can list one by one, so it is <b>discrete</b>.'
        : 'Your ' + tex('X') + ' takes ' + n + ' separate value' + (n > 1 ? 's' : '') + ' (' + tex(listTex(M.rows.map(r => r.x), 8)) + ') and nothing in between, so it is <b>discrete</b>.';
      body.appendChild(K.note(yours, 'small'));
      body.appendChild(K.note('From the lectures: counts such as the number of people in a household, languages a person speaks, attempts at a test, accidents at an intersection or spelling mistakes in a report are discrete; measurements such as temperature, height, speed, the time to write an exam or to reach the office are continuous (<i>Discrete and continuous random variables</i>, 14:30–16:00). In the apartment-complex data the number of bedrooms and the floor are discrete, while the size (900 to 1800 sq ft) and the distance from the left (324 to 505 m) are continuous (same lecture, 08:00–13:00). In a Week 8 tutorial the number of sand grains in a fist is discrete, and their weight is continuous unless every grain weighs exactly the same.', 'small muted'));
      const pa = Q.pa;
      const le = Q.Fa, lt = Q.Fa_;
      body.appendChild(K.note(isZero(pa)
        ? 'See why it matters, with your ' + tex('a=' + Q.at) + ': it is not a value of ' + tex('X') + ', so there is no jump at ' + tex('a') + ' and ' + tex('P(X\\le ' + Q.at + ')=P(X<' + Q.at + ')=' + pq(M, le)) + '. Move ' + tex('a') + ' onto a value of ' + tex('X') + ' to see them differ.'
        : 'See why it matters, with your ' + tex('a=' + Q.at) + ': ' + tex('P(X\\le ' + Q.at + ')=F(' + Q.at + ')=' + pq(M, le)) + ' but ' + tex('P(X<' + Q.at + ')=F(' + Q.at + ')-P(X=' + Q.at + ')=' + pq(M, le) + '-' + pq(M, pa) + '=' + pq(M, lt)) + '. For a discrete ' + tex('X') + ' “≤” and “<” differ by the jump ' + tex('P(X=a)') + '; for a continuous ' + tex('X') + ' they are always equal, because ' + tex('P(X=a)=0') + '.', 'small'));
    }
  }
})();
