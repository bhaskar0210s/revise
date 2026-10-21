/* Dice lab, part 2: the Statistics 2 topics, with two dice or many, fair or loaded.
   sum, max-min, joint, independence, function, covariance, inequalities, continuous, lln, clt, estimate, chi-square
   (ids in labs.json; dice.js holds the Statistics 1 topics). Each topic reads its values from the link and keeps them
   there; its link parameters are listed in the comment above it. Lecture numbers are Statistics 2 lectures. */
(function () {
  'use strict';
  const K = REV.kit;
  const { F, T, h } = K;

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
  const sv = K.sv, rich = K.rich;

  /* ================================================================== numbers */
  const bgcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) [a, b] = [b, a % b]; return a; };
  const clampInt = (v, lo, hi, d) => { const x = Math.round(Number(v)); return Number.isFinite(x) ? Math.max(lo, Math.min(hi, x)) : d; };
  const fsum = list => list.reduce((a, b) => a.add(b), F(0));
  const r4 = (x, k = 4) => { const r = +Number(x).toFixed(k); return String(Object.is(r, -0) ? 0 : r); };
  /** a decimal in TeX; tiny values as 3.2 \times 10^{-7} */
  const dx = (x, k = 4) => {
    if (!Number.isFinite(x)) return x > 0 ? '\\infty' : '-\\infty';
    if (x !== 0 && Math.abs(x) < 0.5 * Math.pow(10, -k)) { const [m, e] = x.toExponential(2).split('e'); return m + ' \\times 10^{' + Number(e) + '}'; }
    return r4(x, k);
  };
  /** TeX of an exact fraction and its decimal: \frac{5}{36} \approx 0.1389 */
  const TX = (fr, k = 4) => { fr = F(fr); if (fr.isInt()) return fr.tex(); return fr.tex() + (fr.exactDecimal(k) ? ' = ' : ' \\approx ') + dx(fr.num(), k); };
  /** "= \\frac{a}{b} \\approx 0.12", or "\\approx 0.123457" when the exact fraction has too many digits to read */
  const eqTX = (fr, k = 4) => { fr = F(fr); return String(fr.d).length > 12 ? '\\approx ' + dx(fr.num(), Math.max(k, 6)) : '= ' + TX(fr, k); };
  /** a fraction as TeX, in brackets when it is negative (for products like 3 \cdot (-\frac12)) */
  const TP = fr => { fr = F(fr); return fr.cmp(0) < 0 ? '\\left(' + fr.tex() + '\\right)' : fr.tex(); };
  const floorF = fr => { let q = fr.n / fr.d; if (fr.n < 0n && q * fr.d !== fr.n) q -= 1n; return F(q); };
  const sortF = arr => arr.sort((u, v) => u.cmp(v));
  const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));
  /** several lines of maths lined up at their & marks (keeps long sums inside a phone screen) */
  const al = (...lines) => '\\begin{aligned}' + lines.join(' \\\\ ') + '\\end{aligned}';
  /** lhs = def = t1 + t2 + … = total, a few terms per line so a long sum fits a phone screen */
  const sumLines = (lhs, terms, total, { per = 3, def } = {}) => {
    const lines = [];
    let head = lhs + ' &= ';
    if (def) { lines.push(head + def); head = '&= '; }
    if (terms.length > 1) {
      for (let i = 0; i < terms.length; i += per) lines.push((i === 0 ? head : '&\\quad + ') + terms.slice(i, i + per).join(' + '));
      lines.push('&' + eqTX(total));
    } else {
      const one = terms.length && terms[0] !== T(total) ? terms[0] + ' ' : '';
      lines.push(one ? head + one + eqTX(total) : head.replace(/&= $/, '&') + eqTX(total));   // never "= = …"
    }
    return al(...lines);
  };
  /** the terms alone, a few per line: = t1 + t2 + t3 \\ + t4 … */
  const termLines = (terms, per = 3) => { const lines = []; for (let i = 0; i < terms.length; i += per) lines.push((i === 0 ? '&= ' : '&\\quad + ') + terms.slice(i, i + per).join(' + ')); return al(...lines); };
  /** x^2 with brackets when x is a fraction or negative */
  const sq = fr => { fr = F(fr); return fr.isInt() && fr.cmp(0) >= 0 ? fr.tex() + '^2' : '\\left(' + fr.tex() + '\\right)^2'; };

  /* ================================================================== a die: faces and weights */
  const WHELP = 'Weights: leave empty for a fair die, or give one number per face, like $1,1,1,1,1,3$ (the last face three times as likely as each other face).';
  /** faces lo … lo+f−1; weights typed as "1,1,1,1,1,3" (empty = fair); chance of a face = its weight / total weight */
  function makeDie(f, wtext, lo = 1) {
    const raw = String(wtext == null ? '' : wtext).trim();
    let ws;
    if (!raw) ws = Array.from({ length: f }, () => F(1));
    else {
      const parts = raw.split(/[\s,;]+/).filter(Boolean);
      if (parts.length !== f) throw new Error('Give ' + f + ' weights, one for each face (you gave ' + parts.length + ').');
      ws = parts.map(s => { const v = F.parse(s); if (v.cmp(0) < 0) throw new Error('A weight cannot be negative (“' + s + '”).'); return v; });
      if (ws.every(v => v.isZero())) throw new Error('At least one weight must be more than 0.');
    }
    const total = fsum(ws);
    let L = 1n; for (const v of ws) L = L / bgcd(L, v.d) * v.d;
    let w = ws.map(v => v.n * (L / v.d)), g = 0n;
    for (const x of w) g = bgcd(g, x);
    w = w.map(x => x / g);
    const W = w.reduce((a, b) => a + b, 0n);
    return { f, lo, faces: Array.from({ length: f }, (_, i) => lo + i), ws, total, w, W, p: w.map(x => F(x, W)), fair: w.every(x => x === w[0]), text: raw };
  }
  const dieMean = d => fsum(d.faces.map((x, i) => d.p[i].mul(x)));
  const dieE2 = d => fsum(d.faces.map((x, i) => d.p[i].mul(x * x)));
  const pAt = (d, v) => { const i = v - d.lo; return i >= 0 && i < d.f ? d.p[i] : F(0); };
  const cdfAt = (d, v) => fsum(d.p.filter((_, i) => d.faces[i] <= v));     // P(X ≤ v)
  const tailAt = (d, v) => fsum(d.p.filter((_, i) => d.faces[i] >= v));    // P(X ≥ v)
  /** where each chance of a die comes from: one line (fair) or a small table (loaded) */
  function dieInfo(name, d) {
    if (d.fair) return K.p(name + ' has ' + d.f + ' faces ($' + d.faces[0] + '$ to $' + d.faces[d.f - 1] + '$) and is fair, so each face has chance $' + T(F(1, d.f)) + '$.');
    return h('div', {},
      K.p(name + ' has ' + d.f + ' faces and is loaded: a face\'s chance is its weight divided by the total weight $' + T(d.total) + '$.'),
      K.table(['face'].concat(d.faces.map(String)), [['weight'].concat(d.ws.map(v => '$' + T(v) + '$')), ['chance'].concat(d.p.map(q => '$' + T(q) + '$'))], { rowHead: true, compact: true }));
  }

  /* ================================================================== controls */
  let uid = 0;
  /** faces (a stepper) and weights (typed) of one die; onChange(f, w) after every valid change */
  function dieControls({ title, f, w, minF = 2, maxF = 20, lo = 1, onChange, help = WHELP }) {
    let faces = f;
    const id = 'dk' + (++uid);
    const err = h('div', { class: 'lk-err', hidden: true });
    const winput = h('input', { id, class: 'field lk-frac', type: 'text', value: w || '', placeholder: 'fair', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const apply = () => {
      const wt = winput.value.trim();
      try { makeDie(faces, wt, lo); err.hidden = true; winput.classList.remove('bad'); onChange(faces, wt); }
      catch (e) { err.textContent = e.message; err.hidden = false; winput.classList.add('bad'); }
    };
    const facesF = K.int({ label: 'Faces', value: f, min: minF, max: maxF, onChange: v => {
      faces = v;
      const wt = winput.value.trim();   // keep one weight per face: add 1s or cut
      if (wt) { const parts = wt.split(/[\s,;]+/).filter(Boolean); while (parts.length < v) parts.push('1'); parts.length = v; winput.value = parts.join(','); }
      apply();
    } });
    winput.addEventListener('input', apply);
    return h('div', { class: 'lk-field' },
      h('div', { class: 'lk-label', style: 'font-size:14px;color:var(--ink)', html: rich(title) }),
      h('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:end' }, facesF, h('div', { class: 'lk-field' }, h('label', { for: id, text: 'Weights' }), winput)),
      help ? h('div', { class: 'lk-help', html: rich(help) }) : null, err);
  }
  /** "Try" chips: each loads a lecture example or a telling case */
  const tries = (list, go) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', text: 'Try' }),
    h('div', { class: 'lk-presets' }, list.map(([label, patch]) => h('button', { type: 'button', class: 'lk-chip', style: 'min-height:44px;line-height:1.25;padding:6px 12px;text-align:left', html: rich(label), onclick: () => go(patch) }))));
  /** start the topic again with new values (a Try chip changes several controls at once) */
  const again = (fn, el, ctx, s) => patch => {
    s.set(patch, true);
    el.innerHTML = '';
    fn(el, Object.assign({}, s.v), ctx);
    const out = el.querySelector('.lk-out');
    if (out && window.matchMedia && matchMedia('(max-width: 860px)').matches) window.scrollTo(0, Math.max(0, out.getBoundingClientRect().top + window.scrollY - 70));
  };
  /** K.answer that never widens the page: as a grid item it may shrink, and its maths scrolls inside it */
  const answer = (...a) => { const el = flowAnswer(...a); el.style.minWidth = '0'; return el; };
  /** keep KaTeX's hidden copy of each formula (position: absolute) inside its scroll box: without a positioned box it
      escapes, and a wide table makes the whole page scroll sideways on a phone */
  const contain = box => {
    const fix = () => box.querySelectorAll('.lk-tbl, .lk-step-m, .lk-answer-v, .lk-md, .lk-chart-wrap').forEach(e => { if (!e.style.position) e.style.position = 'relative'; });
    new MutationObserver(fix).observe(box, { childList: true, subtree: true });
    fix();
  };
  const field = (label, control) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', html: rich(label) }), control);
  const row2 = (...kids) => h('div', { style: 'display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;align-items:end' }, ...kids);

  /* ================================================================== typed formulas: g(x), or X and Y from two dice */
  // numbers, the variables, + − × / ^, mod (or %), |…|, abs min max floor ceil sign, and comparisons (true = 1, false = 0)
  const FNS = { abs: [1, 1], min: [2, 9], max: [2, 9], floor: [1, 1], ceil: [1, 1], sign: [1, 1], mod: [2, 2] };
  function lex(src) {
    const s = String(src).replace(/[−–]/g, '-').replace(/[×·∙]/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/≤/g, '<=').replace(/≥/g, '>=').replace(/≠/g, '!=');
    const out = [];
    let i = 0, m;
    while (i < s.length) {
      const c = s[i], rest = s.slice(i);
      if (/\s/.test(c)) { i++; continue; }
      if ((m = /^(\d+\.?\d*|\.\d+)/.exec(rest))) { out.push({ t: 'num', v: m[0].replace(/\.$/, '') }); i += m[0].length; continue; }
      if ((m = /^[A-Za-z_][A-Za-z_0-9]*/.exec(rest))) { out.push({ t: 'id', v: m[0].toLowerCase() }); i += m[0].length; continue; }
      if ((m = /^(<=|>=|==|!=|<>)/.exec(rest))) { out.push({ t: 'op', v: m[0] === '<>' ? '!=' : m[0] }); i += 2; continue; }
      if ('+-*/^%()|,<>='.includes(c)) { out.push({ t: 'op', v: c === '=' ? '==' : c }); i++; continue; }
      throw new Error('“' + c + '” is not allowed. Use numbers, + − * / ^, mod, |…|, abs, min, max.');
    }
    return out;
  }
  /** parse a formula in the variables vars (like ['x'] or ['d1', 'd2']) */
  function parseF(src, vars) {
    const toks = lex(src);
    if (!toks.length) throw new Error('Type a formula.');
    let i = 0;
    const peek = () => toks[i];
    const isOp = v => toks[i] && toks[i].t === 'op' && toks[i].v === v;
    const expect = v => { if (!isOp(v)) throw new Error(i < toks.length ? 'Expected “' + v + '” before “' + toks[i].v + '”.' : 'Expected “' + v + '” at the end.'); i++; };
    const expr = () => cmp();
    function cmp() {
      let a = add();
      const t = peek();
      if (t && t.t === 'op' && ['<', '>', '<=', '>=', '==', '!='].includes(t.v)) { i++; a = { k: 'cmp', op: t.v, a, b: add() }; }
      return a;
    }
    function add() { let a = mul(); while (isOp('+') || isOp('-')) { const op = toks[i++].v; a = { k: 'bin', op, a, b: mul() }; } return a; }
    function mul() {
      let a = unary();
      for (;;) {
        const t = peek();
        if (t && t.t === 'op' && (t.v === '*' || t.v === '/' || t.v === '%')) { i++; a = { k: 'bin', op: t.v === '%' ? 'mod' : t.v, a, b: unary() }; }
        else if (t && t.t === 'id' && t.v === 'mod') { i++; a = { k: 'bin', op: 'mod', a, b: unary() }; }
        else if (t && (t.t === 'num' || t.t === 'id' || (t.t === 'op' && t.v === '('))) a = { k: 'bin', op: '*', a, b: unary(), implicit: true };   // 2x, 2(x+1)
        else return a;
      }
    }
    function unary() { if (isOp('-')) { i++; return { k: 'neg', a: unary() }; } if (isOp('+')) { i++; return unary(); } return pow(); }
    function pow() { const a = atom(); if (isOp('^')) { i++; return { k: 'bin', op: '^', a, b: unary() }; } return a; }
    function atom() {
      const t = toks[i++];
      if (!t) throw new Error('The formula stops too early.');
      if (t.t === 'num') return { k: 'num', v: F.parse(t.v), src: t.v };
      if (t.t === 'id') {
        if (vars.includes(t.v)) return { k: 'var', name: t.v };
        if (FNS[t.v]) {
          expect('(');
          const args = [expr()];
          while (isOp(',')) { i++; args.push(expr()); }
          expect(')');
          const [lo, hi] = FNS[t.v];
          if (args.length < lo || args.length > hi) throw new Error(t.v + '( ) takes ' + (lo === hi ? lo : lo + ' or more') + ' value' + (lo === 1 && hi === 1 ? '' : 's') + '.');
          return { k: 'fn', name: t.v, args };
        }
        throw new Error('“' + t.v + '” is not known here. Use ' + vars.join(' and ') + ', numbers, and abs, min, max, mod, floor, ceil.');
      }
      if (t.v === '(') { const e = expr(); expect(')'); return { k: 'par', a: e }; }
      if (t.v === '|') { const e = expr(); expect('|'); return { k: 'fn', name: 'abs', args: [e], bars: true }; }
      throw new Error('“' + t.v + '” cannot start a term.');
    }
    const e = expr();
    if (i < toks.length) throw new Error('Unexpected “' + toks[i].v + '”.');
    return e;
  }
  /** the value of a formula, exactly, for the values env = { x: Frac } */
  function evalF(e, env) {
    switch (e.k) {
      case 'num': return e.v;
      case 'var': return env[e.name];
      case 'par': return evalF(e.a, env);
      case 'neg': return evalF(e.a, env).neg();
      case 'cmp': {
        const c = evalF(e.a, env).cmp(evalF(e.b, env));
        return F({ '<': c < 0, '>': c > 0, '<=': c <= 0, '>=': c >= 0, '==': c === 0, '!=': c !== 0 }[e.op] ? 1 : 0);
      }
      case 'bin': {
        const a = evalF(e.a, env), b = evalF(e.b, env);
        switch (e.op) {
          case '+': return a.add(b);
          case '-': return a.sub(b);
          case '*': return a.mul(b);
          case '/': if (b.isZero()) throw new Error('divides by 0'); return a.div(b);
          case 'mod': if (b.isZero()) throw new Error('takes mod 0'); return a.sub(b.mul(floorF(a.div(b))));
          case '^': {
            if (!b.isInt()) throw new Error('has a power that is not a whole number (the answer would not be exact)');
            const k = Number(b.n);
            if (Math.abs(k) > 60) throw new Error('has a power bigger than 60');
            if (k < 0 && a.isZero()) throw new Error('divides by 0');
            return a.pow(k);
          }
        }
        break;
      }
      case 'fn': {
        const v = e.args.map(x => evalF(x, env));
        switch (e.name) {
          case 'abs': return v[0].cmp(0) < 0 ? v[0].neg() : v[0];
          case 'min': return v.reduce((p, q) => (q.cmp(p) < 0 ? q : p));
          case 'max': return v.reduce((p, q) => (q.cmp(p) > 0 ? q : p));
          case 'floor': return floorF(v[0]);
          case 'ceil': return floorF(v[0].neg()).neg();
          case 'sign': return F(v[0].cmp(0));
          case 'mod': if (v[1].isZero()) throw new Error('takes mod 0'); return v[0].sub(v[1].mul(floorF(v[0].div(v[1]))));
        }
      }
    }
    throw new Error('cannot be worked out');
  }
  const usedVars = (e, set = new Set()) => { if (e.k === 'var') set.add(e.name); ['a', 'b'].forEach(k => e[k] && usedVars(e[k], set)); (e.args || []).forEach(x => usedVars(x, set)); return set; };
  /** TeX of a formula; names maps each variable to TeX (like 'X') or to a value (a fraction, put in) */
  function texF(e, names) {
    const P = x => {        // how tightly a node binds once the values are put in
      if (x.k === 'var') { const v = names[x.name]; return F.is(v) && v.cmp(0) < 0 ? 3 : 5; }
      if (x.k === 'num') return x.v.cmp(0) < 0 ? 3 : 5;
      if (x.k === 'cmp') return 0;
      if (x.k === 'neg') return 3;
      if (x.k === 'bin') return { '+': 1, '-': 1, '*': 2, '/': 5, mod: 0.5, '^': 4 }[x.op];
      return 5;
    };
    const W = (x, wrap) => (wrap ? '\\left(' + texF(x, names) + '\\right)' : texF(x, names));
    const isVal = x => x.k === 'var' && F.is(names[x.name]);
    switch (e.k) {
      case 'num': return e.v.isInt() ? e.v.tex() : e.src;
      case 'var': { const v = names[e.name]; return F.is(v) ? v.tex() : v; }
      case 'par': return '\\left(' + texF(e.a, names) + '\\right)';
      case 'neg': return '-' + W(e.a, P(e.a) <= 3);
      case 'cmp': return texF(e.a, names) + ' ' + { '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge', '==': '=', '!=': '\\ne' }[e.op] + ' ' + texF(e.b, names);
      case 'fn': {
        const a = e.args.map(x => texF(x, names));
        if (e.name === 'abs') return '\\left|' + a[0] + '\\right|';
        if (e.name === 'floor') return '\\left\\lfloor ' + a[0] + ' \\right\\rfloor';
        if (e.name === 'ceil') return '\\left\\lceil ' + a[0] + ' \\right\\rceil';
        if (e.name === 'mod') return W(e.args[0], P(e.args[0]) < 1) + ' \\bmod ' + W(e.args[1], P(e.args[1]) < 4);
        return (e.name === 'sign' ? '\\operatorname{sign}' : '\\' + e.name) + '\\left(' + a.join(', ') + '\\right)';
      }
      case 'bin': {
        const { op, a, b } = e;
        if (op === '+') return W(a, P(a) < 1) + ' + ' + W(b, P(b) < 1 || P(b) === 3);
        if (op === '-') return W(a, P(a) < 1) + ' - ' + W(b, P(b) <= 1 || P(b) === 3);
        if (op === '*') {
          const juxt = e.implicit && a.k === 'num' && !isVal(b) && (b.k === 'var' || b.k === 'par' || b.k === 'fn');
          return W(a, P(a) < 2) + (juxt ? '' : ' \\cdot ') + W(b, P(b) < 2 || P(b) === 3);
        }
        if (op === 'mod') return W(a, P(a) < 1) + ' \\bmod ' + W(b, P(b) < 4);
        if (op === '/') return '\\frac{' + texF(a, names) + '}{' + texF(b, names) + '}';
        if (op === '^') return W(a, P(a) < 5 || (isVal(a) && !names[a.name].isInt()) || (a.k === 'num' && !a.v.isInt())) + '^{' + texF(b, names) + '}';
      }
    }
    return '?';
  }
  /** a typed formula with quick chips; onChange(text) only when it parses */
  function formulaField({ label, value, vars, chips, onChange, help }) {
    const id = 'fk' + (++uid);
    const input = h('input', { id, class: 'field lk-frac', type: 'text', value, autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
    const err = h('div', { class: 'lk-err', hidden: true });
    const apply = () => {
      try { parseF(input.value, vars); err.hidden = true; input.classList.remove('bad'); onChange(input.value.trim()); }
      catch (e) { err.textContent = e.message; err.hidden = false; input.classList.add('bad'); }
    };
    input.addEventListener('input', apply);
    return h('div', { class: 'lk-field' }, h('label', { for: id, html: rich(label) }), input,
      chips ? h('div', { class: 'lk-presets' }, chips.map(([t, v]) => h('button', { type: 'button', class: 'lk-chip', html: rich(t), onclick: () => { input.value = v; apply(); } }))) : null,
      help ? h('div', { class: 'lk-help', html: rich(help) }) : null, err);
  }
  // X and Y made from two dice D1 and D2 (typed as d1 and d2)
  const PAIR_VARS = ['d1', 'd2'];
  const PAIR_NAMES = { d1: 'D_1', d2: 'D_2' };
  const PAIR_CHIPS = [['$D_1$', 'd1'], ['$D_2$', 'd2'], ['$D_1{+}D_2$', 'd1+d2'], ['$D_1{-}D_2$', 'd1-d2'], ['$|D_1{-}D_2|$', '|d1-d2|'], ['max', 'max(d1,d2)'], ['min', 'min(d1,d2)'], ['$D_1D_2$', 'd1*d2'], ['$D_1$ odd', 'd1 mod 2'], ['sum odd', '(d1+d2) mod 2'], ['doubles', 'd1==d2']];
  const PAIR_HELP = 'Type with <code>d1</code> (first die) and <code>d2</code> (second die), and <code>+ - * / ^ mod |…|</code>, <code>max( )</code>, <code>min( )</code>. A comparison like <code>d1 > d2</code> gives 1 when true and 0 when false.';
  const pairTex = src => texF(parseF(src, PAIR_VARS), PAIR_NAMES);
  const PAIR_WORDS = { d1: 'the first die', d2: 'the second die', 'd1+d2': 'the sum', 'd2+d1': 'the sum', 'd1-d2': 'the difference', '|d1-d2|': 'the gap between them', 'abs(d1-d2)': 'the gap between them',
    'max(d1,d2)': 'the larger number', 'min(d1,d2)': 'the smaller number', 'd1*d2': 'the product', 'd1mod2': '1 when the first die is odd', '(d1+d2)mod2': '1 when the sum is odd', 'd1==d2': '1 for doubles' };
  /** "$X = D_1$ (the first die)": the formula, with plain words when it is a common one */
  const pairSay = (name, src) => { const w = PAIR_WORDS[String(src).replace(/\s+/g, '').toLowerCase()]; let t; try { t = pairTex(src); } catch (e) { t = '?'; } return '$' + name + ' = ' + t + '$' + (w ? ' (' + w + ')' : ''); };

  /** the joint PMF of X = gx(D1, D2) and Y = gy(D1, D2) for two independent dice */
  function jointPMF(d1, d2, ex, ey) {
    const cell = new Map(), xsM = new Map(), ysM = new Map(), outs = [];
    for (let i = 0; i < d1.f; i++) for (let j = 0; j < d2.f; j++) {
      const p = d1.p[i].mul(d2.p[j]);
      if (p.isZero()) continue;
      const a = F(d1.faces[i]), b = F(d2.faces[j]), env = { d1: a, d2: b };
      let x, y;
      try { x = evalF(ex, env); } catch (e) { throw new Error('$X$ cannot be worked out when $D_1 = ' + a.tex() + '$ and $D_2 = ' + b.tex() + '$: it ' + e.message + '.'); }
      try { y = evalF(ey, env); } catch (e) { throw new Error('$Y$ cannot be worked out when $D_1 = ' + a.tex() + '$ and $D_2 = ' + b.tex() + '$: it ' + e.message + '.'); }
      outs.push({ a: d1.faces[i], b: d2.faces[j], p, x, y });
      xsM.set(x.str(), x); ysM.set(y.str(), y);
      const k = x.str() + '|' + y.str();
      cell.set(k, (cell.get(k) || F(0)).add(p));
    }
    const xs = sortF([...xsM.values()]), ys = sortF([...ysM.values()]);
    const P = (x, y) => cell.get(x.str() + '|' + y.str()) || F(0);
    const fx = xs.map(x => fsum(ys.map(y => P(x, y)))), fy = ys.map(y => fsum(xs.map(x => P(x, y))));
    return { xs, ys, P, fx, fy, outs };
  }

  /* ================================================================== pictures */
  const TINT = ['color-mix(in srgb, var(--x) 12%, transparent)', 'color-mix(in srgb, var(--z) 15%, transparent)'];
  const STRONG = 'color-mix(in srgb, var(--pick) 34%, transparent)';
  const GOODBG = 'color-mix(in srgb, var(--good) 16%, transparent)', BADBG = 'color-mix(in srgb, var(--bad) 18%, transparent)';
  const PALETTE = ['var(--x)', 'var(--y)', 'var(--z)', 'var(--pick)', 'var(--good)', 'var(--warn)', 'var(--bad)', 'var(--accent)'];
  const BAR = 'color-mix(in srgb, var(--accent) 55%, var(--bg-elev))', BARHI = 'var(--pick)';
  /** 0 … top in 3–5 round steps */
  function niceTicks(max, count = 4) {
    if (!(max > 0)) return [0, 1];
    const raw = max / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= raw * (1 - 1e-9));
    const out = [];
    for (let k = 0; k * step <= max * (1 + 1e-9); k++) out.push(+(k * step).toPrecision(12));
    if (out[out.length - 1] < max * (1 - 1e-9)) out.push(+(out.length * step).toPrecision(12));
    return out;
  }
  /** an SVG chart on number axes: bars [{x, y, w, fill, hi, title}], lines [{pts, style}], areas [{pts, style}],
      rules [{x | y, style, label}], dots [{x, y, r, style, title}]; x labels are thinned so they never overlap */
  function chart(o) {
    const W = o.W || 380, H = o.H || 220, L = o.L || 44, R = 12, Tp = 12, B = o.xName ? 36 : 22;
    const { x0, x1 } = o, y0 = o.y0 || 0, y1 = o.y1;
    const X = v => L + (v - x0) / (x1 - x0) * (W - L - R);
    const Y = v => H - B - (v - y0) / (y1 - y0) * (H - B - Tp);
    const pts = list => list.map(([x, y]) => X(x).toFixed(1) + ',' + Y(y).toFixed(1)).join(' ');
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': o.aria || o.xName || 'chart' });
    (o.yt || []).forEach(v => svg.append(sv('line', { x1: L, x2: W - R, y1: Y(v), y2: Y(v), class: 'grid' }), sv('text', { x: L - 5, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, o.yl ? o.yl(v) : r4(v, 3))));
    (o.areas || []).forEach(a => svg.append(sv('polygon', { points: pts(a.pts), style: a.style })));
    (o.bars || []).forEach(b => {
      let xa = X(b.x - b.w / 2), xb = X(b.x + b.w / 2);
      if (xb - xa < 2) { const c = (xa + xb) / 2; xa = c - 1; xb = c + 1; }
      const ya = Y(Math.max(y0, Math.min(y1, b.y)));
      // not class "bar": the page's top-bar rule (.bar { height: 52px }) would also size an SVG rect
      svg.append(sv('rect', { x: xa.toFixed(1), y: ya.toFixed(1), width: (xb - xa).toFixed(1), height: Math.max(0, Y(y0) - ya).toFixed(1), rx: Math.min(3, (xb - xa) / 4).toFixed(1), class: 'lk-bar', style: 'fill:' + (b.fill || (b.hi ? BARHI : BAR)) }, b.title ? sv('title', {}, b.title) : null));
    });
    (o.lines || []).forEach(l => svg.append(sv('polyline', { points: pts(l.pts), fill: 'none', style: l.style || 'stroke:var(--accent);stroke-width:2;fill:none' })));
    (o.rules || []).forEach(r => {
      if (r.x != null) svg.append(sv('line', { x1: X(r.x), x2: X(r.x), y1: Y(y0), y2: Tp, style: r.style || 'stroke:var(--pick);stroke-width:1.5;stroke-dasharray:4 3' }));
      else svg.append(sv('line', { x1: L, x2: W - R, y1: Y(r.y), y2: Y(r.y), style: r.style || 'stroke:var(--pick);stroke-width:1.5;stroke-dasharray:4 3' }));
      if (r.label) svg.append(sv('text', r.x != null ? { x: X(r.x) + 4, y: Tp + 10, class: 'tick', style: 'fill:var(--ink-2)' } : { x: L + 3, y: Y(r.y) - 4, class: 'tick', style: 'fill:var(--ink-2)' }, r.label));
    });
    (o.dots || []).forEach(d => svg.append(sv('circle', { cx: X(d.x).toFixed(1), cy: Y(d.y).toFixed(1), r: d.r || 3, style: d.style || 'fill:var(--accent)' }, d.title ? sv('title', {}, d.title) : null)));
    let last = -Infinity;
    (o.xt || []).forEach(v => {
      const px = X(v), lab = o.xl ? o.xl(v) : r4(v, 3), need = 8 + 6.4 * String(lab).length;
      if (px - last < need) return;
      last = px;
      svg.append(sv('text', { x: px.toFixed(1), y: H - B + 15, 'text-anchor': 'middle', class: 'tick' }, lab));
    });
    if (o.xName) svg.append(sv('text', { x: (L + W - R) / 2, y: H - 5, 'text-anchor': 'middle', class: 'axis' }, o.xName));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** a PMF as bars at the values xs (numbers, any spacing); hi: indexes to colour; fill(i): a colour or null */
  function barChart({ xs, ys, hi = [], fill, xName, H = 210, xl, rules, lines, W }) {
    const n = xs.length, top = Math.max(1e-12, ...ys), yt = niceTicks(top);
    let gap = Infinity;
    for (let i = 1; i < n; i++) gap = Math.min(gap, xs[i] - xs[i - 1]);
    if (!Number.isFinite(gap) || gap <= 0) gap = 1;
    const bars = xs.map((x, i) => ({ x, y: ys[i], w: gap * 0.72, hi: hi.includes(i), fill: fill ? fill(i) : null, title: (xName || 'x') + ' = ' + (xl ? xl(x) : r4(x, 4)) + ': ' + r4(ys[i], 6) }));
    return chart({ W, H, x0: xs[0] - gap * 0.6, x1: xs[n - 1] + gap * 0.6, y1: yt[yt.length - 1], yt, xt: xs, xl, xName, bars, rules, lines });
  }
  /** the grid of two dice: rows = first die, columns = second die; cell(x, y, i, j) → { html, bg, strong, dim, title } */
  function diceGrid(d1, d2, cell, corner, pad) {
    const ps = pad ? 'padding:' + pad + ';' : '';
    const head = h('tr', {}, h('th', { style: ps || null, html: rich(corner || '') }), d2.faces.map(y => h('th', { style: ps || null, text: String(y) })));
    const rows = d1.faces.map((x, i) => h('tr', {}, h('th', { style: ps || null, text: String(x) }), d2.faces.map((y, j) => {
      const c = cell(x, y, i, j);
      return h('td', { class: c.strong ? 'hi' : c.dim ? 'dim' : '', style: ps + (c.bg ? 'background:' + c.bg + ';' : '') + (c.strong ? 'font-weight:700;' : ''), title: c.title || null, html: c.html });
    })));
    return h('div', { class: 'lk-tbl' }, h('table', { class: 'lk-grid' }, h('thead', {}, head), h('tbody', {}, rows)));
  }
  const small = s => '<div style="font-size:11px;line-height:1.2;color:var(--ink-3);font-weight:400">' + s + '</div>';
  /** round tick values from lo to hi */
  function ticksBetween(lo, hi, count = 5) {
    if (!(hi > lo)) return [lo];
    const raw = (hi - lo) / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(st => st >= raw * (1 - 1e-9));
    const out = [];
    for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi * (1 + 1e-12) + 1e-12; k++) out.push(+(k * step).toPrecision(12));
    return out;
  }
  /** the joint table f_XY(t1, t2) as in the lectures: values of X across (t1), values of Y down (t2), marginals at the edges.
      cell(i, j) → { bg, strong } styles one cell */
  function jointTable(J, cell) {
    const plain = J.xs.length * J.ys.length > 120;   // many cells: plain fractions, quicker and narrower
    const fmt = fr => (fr.isZero() ? '<span style="color:var(--ink-4)">0</span>' : plain ? fr.str() : '$' + T(fr) + '$');
    const th = html => h('th', { html: rich(html) });
    const edge = 'background:var(--bg-sunk);';
    const head = h('tr', {}, th('$t_2 \\backslash t_1$'), J.xs.map(x => th('$' + T(x) + '$')), th('$f_Y(t_2)$'));
    const rows = J.ys.map((y, j) => h('tr', {}, th('$' + T(y) + '$'), J.xs.map((x, i) => {
      const c = cell ? cell(i, j) || {} : {};
      return h('td', { style: (c.bg ? 'background:' + c.bg + ';' : '') + (c.strong ? 'font-weight:700;outline:2px solid var(--pick);outline-offset:-2px;' : ''), html: rich(fmt(J.P(x, y))) });
    }), h('td', { style: edge, html: rich(fmt(J.fy[j])) })));
    const foot = h('tr', {}, th('$f_X(t_1)$'), J.fx.map(v => h('td', { style: edge, html: rich(fmt(v)) })), h('td', { style: edge, html: rich('$1$') }));
    return h('div', { class: 'lk-tbl' }, h('table', { class: 'lk-table compact' }, h('thead', {}, head), h('tbody', {}, rows, foot)));
  }
  /** the outcome grid of two dice, each cell showing the pair (X, Y) it gives */
  function outcomeGrid(d1, d2, ex, ey, on) {
    return diceGrid(d1, d2, (a, b, i, j) => {
      const p = d1.p[i].mul(d2.p[j]);
      if (p.isZero()) return { html: '–', dim: true };
      const env = { d1: F(a), d2: F(b) }, x = evalF(ex, env), y = evalF(ey, env), hit = on && on(x, y);
      return { html: x.str() + ',' + y.str() + (d1.fair && d2.fair ? '' : small(p.str())), bg: hit ? STRONG : null, strong: hit, title: 'D1 = ' + a + ', D2 = ' + b + ': X = ' + x.str() + ', Y = ' + y.str() };
    }, '$d_1 \\backslash d_2$', '6px 5px');
  }
  const isqrt = n => { if (n < 2n) return n; let x = n, y = (x + 1n) >> 1n; while (y < x) { x = y; y = (x + n / x) >> 1n; } return x; };
  /** TeX of the square root of a fraction: exact when it is a perfect square */
  const sqrtTex = fr => {
    const a = isqrt(fr.n), b = isqrt(fr.d);
    if (a * a === fr.n && b * b === fr.d) return F(a, b).tex();
    return '\\sqrt{' + fr.tex() + '} \\approx ' + r4(Math.sqrt(fr.num()), 4);
  };
  const qs = o => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v)).join('&');
  /** independence cell by cell, in reading order (rows = values of Y, left to right): every cell with its product */
  function cellChecks(J) {
    const list = [];
    J.ys.forEach((y, j) => J.xs.forEach((x, i) => { const pj = J.P(x, y), pr = J.fx[i].mul(J.fy[j]); list.push({ i, j, x, y, pj, pr, ok: pj.eq(pr) }); }));
    return list;
  }

  /* ================================================================== sum: Z = X + Y */
  // ?f1=6&w1=&f2=6&w2=&z=8   f1, f2 faces (2–20); w1, w2 weights like 1,1,1,1,1,3 (empty = fair); z the total asked about
  function sum(el, query, ctx) {
    const s = K.state(ctx, { f1: 6, w1: '', f2: 6, w2: '', z: 8 }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    controls.append(
      K.p('Roll two dice. $X$ is the first number and $Y$ the second. Their total is $Z = X + Y$.'),
      dieControls({ title: 'First die $X$', f: clampInt(s.v.f1, 2, 20, 6), w: s.v.w1, onChange: (f, w) => s.set({ f1: f, w1: w }) }),
      dieControls({ title: 'Second die $Y$', f: clampInt(s.v.f2, 2, 20, 6), w: s.v.w2, help: null, onChange: (f, w) => s.set({ f2: f, w2: w }) }),
      K.int({ label: 'The total $z$ you ask about', value: clampInt(s.v.z, 2, 40, 8), min: 2, max: 40, onChange: v => s.set({ z: v }) }),
      tries([
        ['Lecture 2.7: two fair dice, $z = 8$', { f1: 6, w1: '', f2: 6, w2: '', z: 8 }],
        ['Lecture 2.9: $P(\\text{sum} = 6)$', { f1: 6, w1: '', f2: 6, w2: '', z: 6 }],
        ['Lecture 2.8: two fair 10-sided dice, $z = 11$', { f1: 10, w1: '', f2: 10, w2: '', z: 11 }],
        ['Loaded: a 6 three times as likely', { f1: 6, w1: '1,1,1,1,1,3', f2: 6, w2: '', z: 9 }],
        ['A 6-sided and a 4-sided die', { f1: 6, w1: '', f2: 4, w2: '', z: 7 }],
      ], again(sum, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      let X, Y;
      try { X = makeDie(clampInt(s.v.f1, 2, 20, 6), s.v.w1); Y = makeDie(clampInt(s.v.f2, 2, 20, 6), s.v.w2); }
      catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const z = clampInt(s.v.z, 2, 40, 8);
      const zmin = X.faces[0] + Y.faces[0], zmax = X.faces[X.f - 1] + Y.faces[Y.f - 1];
      const zs = [], pz = [], cnt = [];
      for (let t = zmin; t <= zmax; t++) {
        let pr = F(0), c = 0;
        X.faces.forEach((x, i) => { const j = t - x - Y.lo; if (j >= 0 && j < Y.f) { pr = pr.add(X.p[i].mul(Y.p[j])); c++; } });
        zs.push(t); pz.push(pr); cnt.push(c);
      }
      const pairs = X.faces.map((x, i) => [x, i, z - x - Y.lo]).filter(([, , j]) => j >= 0 && j < Y.f);
      const pZ = fsum(pairs.map(([, i, j]) => X.p[i].mul(Y.p[j])));
      const both = X.fair && Y.fair;
      const who = both ? (X.f === Y.f ? 'two fair ' + X.f + '-sided dice' : 'a fair ' + X.f + '-sided and a fair ' + Y.f + '-sided die') : 'your two dice';
      out.append(answer('$P(Z = ' + z + ')$ for ' + who, 'P(Z = ' + z + ') = ' + TX(pZ)));

      out.append(K.card('The two dice', dieInfo('The first die $X$', X), dieInfo('The second die $Y$', Y),
        K.p('The dice do not affect each other (they are <b>independent</b>), so one pair $(x, y)$ has chance $P(X = x)\\,P(Y = y)$.' + (both ? ' Here every pair has chance $' + T(F(1, X.f)) + ' \\times ' + T(F(1, Y.f)) + ' = ' + T(F(1, X.f * Y.f)) + '$.' : ''))));

      out.append(K.card('The grid: one cell for each pair $(x, y)$',
        K.p('Rows are the first die, columns the second. Each cell shows its total $x + y$' + (both ? '' : ' and, under it, the chance of that pair') + '. Cells with the same total lie on one slanting line $x + y = z$; the stripes show these lines. The line $x + y = ' + z + '$ is the dark one (lecture 2.7 slides this line across the grid).'),
        diceGrid(X, Y, (x, y, i, j) => {
          const t = x + y, on = t === z;
          return { html: String(t) + (both ? '' : small(X.p[i].mul(Y.p[j]).str())), bg: on ? STRONG : TINT[t % 2], strong: on, title: '(' + x + ', ' + y + '): total ' + t };
        }, '$x \\backslash y$'),
        K.p(pairs.length ? 'The dark line holds ' + plural(pairs.length, 'cell') + ': ' + pairs.map(([x]) => '$(' + x + ', ' + (z - x) + ')$').join(', ') + '.' : 'No cell has total ' + z + ': the totals go from ' + zmin + ' to ' + zmax + '.')));

      const st = [{ text: 'Which totals can happen? The smallest is $' + X.faces[0] + ' + ' + Y.faces[0] + ' = ' + zmin + '$ and the largest is $' + X.faces[X.f - 1] + ' + ' + Y.faces[Y.f - 1] + ' = ' + zmax + '$.', tex: 'Z \\in \\{' + zmin + ', ' + (zmin + 1) + ', \\dots, ' + zmax + '\\}' }];
      if (!pairs.length) st.push({ text: 'Your total $z = ' + z + '$ is outside this range, so no pair gives it.', tex: 'P(Z = ' + z + ') = 0' });
      else {
        st.push({ text: 'Find the pairs with $x + y = ' + z + '$. For each first number $x$, the second must be $y = ' + z + ' - x$, and $y$ must be a face of the second die (' + Y.faces[0] + ' to ' + Y.faces[Y.f - 1] + '). So $x$ goes from ' + pairs[0][0] + ' to ' + pairs[pairs.length - 1][0] + ':', tex: pairs.map(([x]) => '(' + x + ', ' + (z - x) + ')').join(',\\ ') });
        st.push({ text: 'The dice are independent, so each pair has chance $P(X = x)\\,P(Y = y)$. These pairs cannot happen together, so add their chances. This sum is called the <b>convolution</b> (lecture 2.9):', tex: 'P(Z = ' + z + ') = \\sum_{x} P(X = x)\\,P(Y = ' + z + ' - x)' });
        st.push({ text: 'One term for each pair, first die then second die:', tex: termLines(pairs.map(([, i, j]) => T(X.p[i]) + '\\cdot ' + T(Y.p[j])), 3) });
        st.push({ text: 'Multiply inside each term:', tex: termLines(pairs.map(([, i, j]) => T(X.p[i].mul(Y.p[j]))), 5) });
        st.push({ text: 'Add them up:', tex: '= ' + TX(pZ) });
        if (both) st.push({ text: 'Check by counting: with fair dice every pair has the same chance, so the answer is (pairs on the line) ÷ (all pairs).', tex: '\\frac{' + pairs.length + '}{' + X.f + ' \\times ' + Y.f + '} = \\frac{' + pairs.length + '}{' + (X.f * Y.f) + '} = ' + T(pZ) });
      }
      out.append(K.card('Every step', flowSteps(st)));

      const k = zs.indexOf(z), hiSet = k >= 0 ? [k] : [];
      const EX = dieMean(X), EY = dieMean(Y), EZ = fsum(zs.map((t, i) => pz[i].mul(t)));
      const checks = [{ text: 'The chances add up to 1:', tex: '\\sum_z P(Z = z) = ' + T(fsum(pz)) },
        { text: 'The mean of $Z$ from this table equals $E[X] + E[Y]$ (expectation adds up):', tex: al('\\textstyle\\sum_z z\\,P(Z = z) &= ' + TX(EZ), 'E[X] + E[Y] &= ' + T(EX) + ' + ' + T(EY) + ' = ' + TX(EX.add(EY))) }];
      if (both && X.f === Y.f && k >= 0) {
        const n = X.f, num = z <= n + 1 ? z - 1 : 2 * n - z + 1;
        checks.push({ text: 'Lecture 2.8 gives a formula for two fair $n$-sided dice: $\\frac{z-1}{n^2}$ up to $z = n + 1$, then $\\frac{2n-z+1}{n^2}$. Here $n = ' + n + '$:', tex: 'P(Z = ' + z + ') = ' + (z <= n + 1 ? '\\frac{' + z + ' - 1}{' + n + '^2}' : '\\frac{2\\cdot ' + n + ' - ' + z + ' + 1}{' + n + '^2}') + ' = \\frac{' + num + '}{' + n * n + '} = ' + T(F(num, n * n)) });
      }
      out.append(K.card('The whole distribution of $Z$',
        K.p('The same steps for every total. The bar for $z = ' + z + '$ is coloured.' + (both && X.f === Y.f ? ' Two fair dice give a triangle: the middle totals have the most pairs (lecture 2.8).' : '')),
        barChart({ xs: zs, ys: pz.map(v => v.num()), hi: hiSet, xName: 'z = x + y' }),
        K.table(['$z$', 'pairs', '$P(Z = z)$'], zs.map((t, i) => ['$' + t + '$', String(cnt[i]), '$' + TX(pz[i]) + '$']), { hi: new Set(hiSet), compact: true }),
        flowSteps(checks)));
    }
    draw();
  }

  /* ================================================================== max-min */
  // ?f1=6&w1=&f2=6&w2=&m=max&z=3   m = max or min; z the value asked about; dice as in sum
  function maxMin(el, query, ctx) {
    const s = K.state(ctx, { f1: 6, w1: '', f2: 6, w2: '', m: 'max', z: 3 }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    controls.append(
      K.p('Roll two dice, $X$ and $Y$. The larger number is $M = \\max(X, Y)$ and the smaller is $N = \\min(X, Y)$ (equal numbers: both are that number).'),
      dieControls({ title: 'First die $X$', f: clampInt(s.v.f1, 2, 20, 6), w: s.v.w1, onChange: (f, w) => s.set({ f1: f, w1: w }) }),
      dieControls({ title: 'Second die $Y$', f: clampInt(s.v.f2, 2, 20, 6), w: s.v.w2, help: null, onChange: (f, w) => s.set({ f2: f, w2: w }) }),
      K.seg({ label: 'Look at', options: [['max', 'Larger: max'], ['min', 'Smaller: min']], value: s.v.m === 'min' ? 'min' : 'max', onChange: v => s.set({ m: v }) }),
      K.int({ label: 'The value $z$ you ask about', value: clampInt(s.v.z, 1, 20, 3), min: 1, max: 20, onChange: v => s.set({ z: v }) }),
      tries([
        ['Lecture 2.8: max of two fair dice, $z = 3$', { f1: 6, w1: '', f2: 6, w2: '', m: 'max', z: 3 }],
        ['Lecture 2.10: min of two fair dice, $z = 1$', { f1: 6, w1: '', f2: 6, w2: '', m: 'min', z: 1 }],
        ['Lecture 2.8: max of two 10-sided dice', { f1: 10, w1: '', f2: 10, w2: '', m: 'max', z: 7 }],
        ['Loaded: 6 three times as likely', { f1: 6, w1: '1,1,1,1,1,3', f2: 6, w2: '1,1,1,1,1,3', m: 'max', z: 6 }],
        ['A 6-sided and a 4-sided die', { f1: 6, w1: '', f2: 4, w2: '', m: 'min', z: 2 }],
      ], again(maxMin, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      let X, Y;
      try { X = makeDie(clampInt(s.v.f1, 2, 20, 6), s.v.w1); Y = makeDie(clampInt(s.v.f2, 2, 20, 6), s.v.w2); }
      catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const isMax = s.v.m !== 'min', z = clampInt(s.v.z, 1, 20, 3);
      const g = isMax ? Math.max : Math.min, V = isMax ? 'M' : 'N', fn = isMax ? '\\max' : '\\min';
      const lo = isMax ? Math.max(X.faces[0], Y.faces[0]) : Math.min(X.faces[0], Y.faces[0]);
      const hi = isMax ? Math.max(X.faces[X.f - 1], Y.faces[Y.f - 1]) : Math.min(X.faces[X.f - 1], Y.faces[Y.f - 1]);
      const vals = [], pv = [], cnt = [];
      for (let v = lo; v <= hi; v++) {
        let pr = F(0), c = 0;
        X.faces.forEach((x, i) => Y.faces.forEach((y, j) => { if (g(x, y) === v) { pr = pr.add(X.p[i].mul(Y.p[j])); c++; } }));
        vals.push(v); pv.push(pr); cnt.push(c);
      }
      const k = vals.indexOf(z), pz = k >= 0 ? pv[k] : F(0);
      const both = X.fair && Y.fair;
      out.append(answer('$P(' + V + ' = ' + z + ')$ where $' + V + ' = ' + fn + '(X, Y)$', 'P(' + V + ' = ' + z + ') = ' + TX(pz)));

      out.append(K.card('The two dice', dieInfo('The first die $X$', X), dieInfo('The second die $Y$', Y),
        K.p('The dice are independent: a pair $(x, y)$ has chance $P(X = x)\\,P(Y = y)$.')));

      const cells = [];
      out.append(K.card('The grid: the L shape where $' + V + ' = ' + z + '$',
        K.p('Each cell shows $' + fn + '(x, y)$. The cells with the same value form an L shape' + (isMax ? ': the corner $(z, z)$, the cells to its left in row $z$ and the cells above it in column $z$.' : ': the corner $(z, z)$, the cells to its right in row $z$ and the cells below it in column $z$.') + ' The dark L is $' + V + ' = ' + z + '$.'),
        diceGrid(X, Y, (x, y, i, j) => {
          const v = g(x, y), on = v === z;
          if (on) cells.push([x, y, X.p[i].mul(Y.p[j])]);
          return { html: String(v) + (both ? '' : small(X.p[i].mul(Y.p[j]).str())), bg: on ? STRONG : TINT[v % 2], strong: on, title: '(' + x + ', ' + y + '): ' + (isMax ? 'max ' : 'min ') + v };
        }, '$x \\backslash y$'),
        K.p(cells.length ? 'The dark L has ' + plural(cells.length, 'cell') + ': ' + cells.map(c => '$(' + c[0] + ', ' + c[1] + ')$').join(', ') + '.' : 'No cell has the value ' + z + ': $' + V + '$ goes from ' + lo + ' to ' + hi + '.')));

      // the direct way: three cases that cannot happen together (lecture 2.10)
      const pX = pAt(X, z), pY = pAt(Y, z);
      const aX = isMax ? cdfAt(X, z - 1) : tailAt(X, z + 1), aY = isMax ? cdfAt(Y, z - 1) : tailAt(Y, z + 1);
      const lt = isMax ? '<' : '>', le = isMax ? '\\le ' + (z - 1) : '\\ge ' + (z + 1);
      const t1 = pX.mul(pY), t2 = pX.mul(aY), t3 = aX.mul(pY);
      out.append(K.card('Every step: add up the L',
        flowSteps([
          { text: '$' + V + ' = ' + z + '$ happens in three ways that cannot happen together (lecture 2.10): both dice show ' + z + '; the first shows ' + z + ' and the second is ' + (isMax ? 'smaller' : 'bigger') + '; the first is ' + (isMax ? 'smaller' : 'bigger') + ' and the second shows ' + z + '. They are the corner and the two arms of the L.',
            tex: al('P(' + V + ' = ' + z + ') &= P(X = ' + z + ', Y = ' + z + ')', '&\\quad + P(X = ' + z + ', Y ' + lt + ' ' + z + ')', '&\\quad + P(X ' + lt + ' ' + z + ', Y = ' + z + ')') },
          { text: 'The dice are independent, so each part is a product of two chances:', tex: al('&= P(X = ' + z + ')\\,P(Y = ' + z + ')', '&\\quad + P(X = ' + z + ')\\,P(Y ' + le + ')', '&\\quad + P(X ' + le + ')\\,P(Y = ' + z + ')') },
          { text: 'Read the chances from the dice' + (isMax ? ' ($P(Y \\le ' + (z - 1) + ')$ adds the faces up to ' + (z - 1) + ')' : ' ($P(Y \\ge ' + (z + 1) + ')$ adds the faces from ' + (z + 1) + ' up)') + ':', tex: '= ' + T(pX) + '\\cdot ' + T(pY) + ' + ' + T(pX) + '\\cdot ' + T(aY) + ' + ' + T(aX) + '\\cdot ' + T(pY) },
          { text: 'Multiply, then add:', tex: '= ' + T(t1) + ' + ' + T(t2) + ' + ' + T(t3) + ' = ' + TX(pz) },
        ])));

      // the CDF shortcut (lecture 2.10)
      let st;
      if (isMax) {
        const Fz = cdfAt(X, z).mul(cdfAt(Y, z)), Fz1 = cdfAt(X, z - 1).mul(cdfAt(Y, z - 1));
        st = [
          { text: 'The larger number is at most $' + z + '$ exactly when <b>both</b> numbers are at most $' + z + '$:', tex: '\\{M \\le ' + z + '\\} = \\{X \\le ' + z + '\\} \\cap \\{Y \\le ' + z + '\\}' },
          { text: 'Independence lets us multiply. So the CDF of the max is the product of the two CDFs (lecture 2.10):', tex: al('F_M(' + z + ') &= F_X(' + z + ')\\,F_Y(' + z + ')', '&= ' + T(cdfAt(X, z)) + '\\cdot ' + T(cdfAt(Y, z)) + ' = ' + T(Fz)) },
          { text: 'The same for $' + (z - 1) + '$:', tex: al('F_M(' + (z - 1) + ') &= F_X(' + (z - 1) + ')\\,F_Y(' + (z - 1) + ')', '&= ' + T(cdfAt(X, z - 1)) + '\\cdot ' + T(cdfAt(Y, z - 1)) + ' = ' + T(Fz1)) },
          { text: 'The chance of exactly $' + z + '$ is the jump of the CDF at $' + z + '$. It agrees with the L shape:', tex: al('P(M = ' + z + ') &= F_M(' + z + ') - F_M(' + (z - 1) + ')', '&= ' + T(Fz) + ' - ' + T(Fz1) + ' = ' + TX(Fz.sub(Fz1))) },
        ];
      } else {
        const Gz = tailAt(X, z).mul(tailAt(Y, z)), Gz1 = tailAt(X, z + 1).mul(tailAt(Y, z + 1));
        st = [
          { text: 'The smaller number is at least $' + z + '$ exactly when <b>both</b> numbers are at least $' + z + '$ (for the min, use "at least", not "at most"):', tex: '\\{N \\ge ' + z + '\\} = \\{X \\ge ' + z + '\\} \\cap \\{Y \\ge ' + z + '\\}' },
          { text: 'Independence lets us multiply:', tex: al('P(N \\ge ' + z + ') &= P(X \\ge ' + z + ')\\,P(Y \\ge ' + z + ')', '&= ' + T(tailAt(X, z)) + '\\cdot ' + T(tailAt(Y, z)) + ' = ' + T(Gz)) },
          { text: 'The same for $' + (z + 1) + '$:', tex: al('P(N \\ge ' + (z + 1) + ') &= P(X \\ge ' + (z + 1) + ')\\,P(Y \\ge ' + (z + 1) + ')', '&= ' + T(tailAt(X, z + 1)) + '\\cdot ' + T(tailAt(Y, z + 1)) + ' = ' + T(Gz1)) },
          { text: '"At least ' + z + '" minus "at least ' + (z + 1) + '" leaves exactly $' + z + '$. It agrees with the L shape:', tex: al('P(N = ' + z + ') &= P(N \\ge ' + z + ') - P(N \\ge ' + (z + 1) + ')', '&= ' + T(Gz) + ' - ' + T(Gz1) + ' = ' + TX(Gz.sub(Gz1))) },
        ];
      }
      out.append(K.card('The CDF shortcut', flowSteps(st)));

      const cdfV = []; let c = F(0); pv.forEach(p => { c = c.add(p); cdfV.push(c); });
      const checks = [{ text: 'The chances add up to 1:', tex: '\\sum_z P(' + V + ' = z) = ' + T(fsum(pv)) }];
      if (both && X.f === Y.f && k >= 0) {
        const n = X.f, num = isMax ? 2 * z - 1 : 2 * (n - z) + 1;
        checks.push({ text: isMax ? 'Lecture 2.8: for two fair $n$-sided dice the L for $z$ has $2z - 1$ cells, so $P(M = z) = \\frac{2z-1}{n^2}$:' : 'For two fair $n$-sided dice the L for the min $z$ has $2(n - z) + 1$ cells (lecture 2.10 counts $11, 9, 7, 5, 3, 1$ for six faces):',
          tex: 'P(' + V + ' = ' + z + ') = \\frac{' + num + '}{' + n + '^2} = ' + T(F(num, n * n)) });
      }
      out.append(K.card('The whole distribution of $' + V + '$',
        K.p('The bar for $z = ' + z + '$ is coloured. ' + (isMax ? 'With fair dice the max leans to the high values: big L shapes are near the bottom-right.' : 'With fair dice the min leans to the low values.')),
        barChart({ xs: vals, ys: pv.map(v => v.num()), hi: k >= 0 ? [k] : [], xName: 'z = ' + (isMax ? 'max' : 'min') + '(x, y)' }),
        K.table(['$z$', 'cells', '$P(' + V + ' = z)$', '$P(' + V + ' \\le z)$'], vals.map((v, i) => ['$' + v + '$', String(cnt[i]), '$' + TX(pv[i]) + '$', '$' + T(cdfV[i]) + '$']), { hi: new Set(k >= 0 ? [k] : []), compact: true }),
        K.cdf({ xs: vals, ps: pv, xName: 'CDF of ' + V, mark: k >= 0 ? z : null }),
        flowSteps(checks)));
    }
    draw();
  }

  /** "a + b + c = total", or just the total when there is one term */
  const sumTex = (terms, total) => (terms.length > 1 ? terms.join(' + ') + ' = ' : '') + TX(total);
  const listAnd = arr => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);
  const pairDice = (s, maxF) => [makeDie(clampInt(s.v.f1, 2, maxF, 6), s.v.w1), makeDie(clampInt(s.v.f2, 2, maxF, 6), s.v.w2)];
  /** the controls shared by joint, independence and covariance: two dice and the formulas for X and Y */
  const pairControls = s => [
    dieControls({ title: 'First die $D_1$', f: clampInt(s.v.f1, 2, 12, 6), maxF: 12, w: s.v.w1, onChange: (f, w) => s.set({ f1: f, w1: w }) }),
    dieControls({ title: 'Second die $D_2$', f: clampInt(s.v.f2, 2, 12, 6), maxF: 12, w: s.v.w2, help: null, onChange: (f, w) => s.set({ f2: f, w2: w }) }),
    formulaField({ label: '$X =$', value: s.v.x, vars: PAIR_VARS, chips: PAIR_CHIPS.slice(0, 7), onChange: v => s.set({ x: v }) }),
    formulaField({ label: '$Y =$', value: s.v.y, vars: PAIR_VARS, chips: PAIR_CHIPS, help: PAIR_HELP, onChange: v => s.set({ y: v }) }),
  ];
  const FAIR2 = { f1: 6, w1: '', f2: 6, w2: '' };

  /* ================================================================== joint */
  // ?f1=6&w1=&f2=6&w2=&x=d1&y=d1%2Bd2&t=2&u=7   faces 2–12; x, y formulas in d1, d2 (the two dice); t a value of X and
  // u a value of Y: the cell the steps use
  function joint(el, query, ctx) {
    const s = K.state(ctx, { f1: 6, w1: '', f2: 6, w2: '', x: 'd1', y: 'd1+d2', t: '2', u: '7' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    // the first sentence follows the formulas chosen for X and Y (it is redrawn with the rest)
    const intro = K.p('');
    const say = () => { intro.innerHTML = rich('Roll two dice, $D_1$ and $D_2$, and make two random variables from them: ' + pairSay('X', s.v.x) + ' and ' + pairSay('Y', s.v.y) + '. The <b>joint PMF</b> gives the chance of each pair of values of $X$ and $Y$.'); };
    controls.append(
      intro,
      ...pairControls(s),
      tries([
        ['$X$ = first die, $Y$ = sum', Object.assign({ x: 'd1', y: 'd1+d2', t: '2', u: '7' }, FAIR2)],
        ['$Y$ = the larger number', Object.assign({ x: 'd1', y: 'max(d1,d2)', t: '3', u: '3' }, FAIR2)],
        ['$Y$ = the gap $|D_1 - D_2|$', Object.assign({ x: 'd1', y: '|d1-d2|', t: '1', u: '0' }, FAIR2)],
        ['$X$ = smaller, $Y$ = larger', Object.assign({ x: 'min(d1,d2)', y: 'max(d1,d2)', t: '2', u: '5' }, FAIR2)],
        ['Second die loaded', Object.assign({}, FAIR2, { w2: '1,1,1,1,1,3', x: 'd1', y: 'd1+d2', t: '6', u: '12' })],
      ], again(joint, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      say();
      let d1, d2, ex, ey, J;
      try { [d1, d2] = pairDice(s, 12); ex = parseF(s.v.x, PAIR_VARS); ey = parseF(s.v.y, PAIR_VARS); J = jointPMF(d1, d2, ex, ey); }
      catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const XT = texF(ex, PAIR_NAMES), YT = texF(ey, PAIR_NAMES);
      const find = (list, v) => { try { const q = F.parse(v); return list.findIndex(w => w.eq(q)); } catch (e) { return -1; } };
      let ti = find(J.xs, s.v.t); if (ti < 0) ti = 0;
      let uj = find(J.ys, s.v.u); if (uj < 0) uj = Math.max(0, J.ys.findIndex(y => !J.P(J.xs[ti], y).isZero()));
      const t = J.xs[ti], u = J.ys[uj], ptu = J.P(t, u), fxt = J.fx[ti], fyu = J.fy[uj];
      const tT = T(t), uT = T(u);
      out.append(answer('One cell of the joint PMF of $X = ' + XT + '$ and $Y = ' + YT + '$', 'P(X = ' + tT + ', Y = ' + uT + ') = ' + TX(ptu),
        'Given $X = ' + tT + '$, the chance of $Y = ' + uT + '$ is $' + TX(ptu.div(fxt)) + '$.'));
      out.append(K.card('Pick a cell', K.p('The steps below use the cell $X = t$, $Y = u$.'),
        row2(K.select({ label: '$t$, a value of $X$', options: J.xs.map(v => [v.str(), v.str()]), value: t.str(), onChange: v => s.set({ t: v }) }),
          K.select({ label: '$u$, a value of $Y$', options: J.ys.map(v => [v.str(), v.str()]), value: u.str(), onChange: v => s.set({ u: v }) }))));

      const hits = J.outs.filter(o => o.x.eq(t) && o.y.eq(u));
      out.append(K.card('Each outcome gives a pair of values',
        K.p('Rows are the first die $d_1$, columns the second $d_2$. Each cell shows the values of $X$ and $Y$ for that outcome' + (d1.fair && d2.fair ? ' (every outcome has chance $' + T(F(1, d1.f * d2.f)) + '$)' : ', and its chance under them') + '. The dark cells give $X = ' + tT + '$ and $Y = ' + uT + '$.'),
        outcomeGrid(d1, d2, ex, ey, (x, y) => x.eq(t) && y.eq(u))));

      const st = hits.length ? [
        { text: 'Find the outcomes $(d_1, d_2)$ that give $X = ' + tT + '$ and $Y = ' + uT + '$:', tex: hits.map(o => '(' + o.a + ', ' + o.b + ')').join(',\\ ') },
        { text: 'Each outcome has chance $P(D_1 = d_1)\\,P(D_2 = d_2)$, because the dice are independent. These outcomes cannot happen together, so add their chances:', tex: 'f_{XY}(' + tT + ', ' + uT + ') = ' + sumTex(hits.map(o => T(o.p)), ptu) },
      ] : [{ text: 'No outcome gives $X = ' + tT + '$ and $Y = ' + uT + '$ together, so this cell is 0.', tex: 'f_{XY}(' + tT + ', ' + uT + ') = 0' }];
      out.append(K.card('The joint table $f_{XY}(t_1, t_2)$',
        K.p('Each cell is the chance of one pair: $f_{XY}(t_1, t_2) = P(X = t_1, Y = t_2)$. Values of $X$ go across ($t_1$) and values of $Y$ go down ($t_2$), as in the lectures. Your cell is outlined; its column and row are shaded.'),
        jointTable(J, (i, j) => (i === ti && j === uj ? { bg: STRONG, strong: true } : i === ti || j === uj ? { bg: TINT[0] } : null)),
        flowSteps(st)));

      const col = J.ys.map(y => J.P(t, y)).filter(v => !v.isZero()), row = J.xs.map(x => J.P(x, u)).filter(v => !v.isZero());
      out.append(K.card('Marginals: add a column or a row',
        flowSteps([
          { text: 'The chance of $X = ' + tT + '$ on its own: add down the column $t_1 = ' + tT + '$ (the zero cells add nothing):', tex: sumLines('f_X(' + tT + ')', col.map(T), fxt, { per: 5, def: '\\sum_{t_2} f_{XY}(' + tT + ', t_2)' }) },
          { text: 'The chance of $Y = ' + uT + '$ on its own: add along the row $t_2 = ' + uT + '$:', tex: sumLines('f_Y(' + uT + ')', row.map(T), fyu, { per: 5, def: '\\sum_{t_1} f_{XY}(t_1, ' + uT + ')' }) },
          { text: 'These column totals and row totals are the <b>marginal PMFs</b>, on the edges of the table. Each adds up to 1:', tex: '\\textstyle\\sum_{t_1} f_X(t_1) = ' + T(fsum(J.fx)) + ', \\quad \\sum_{t_2} f_Y(t_2) = ' + T(fsum(J.fy)) },
        ])));

      const condRows = (vals, getCell, total, pick) => vals.map((v, k) => [k, getCell(v)]).filter(([k, c]) => !c.isZero() || k === pick)
        .map(([k, c]) => ['$' + T(vals[k]) + '$', '$' + T(c) + '$', '$' + T(c) + ' \\div ' + T(total) + ' = ' + T(c.div(total)) + '$']);
      out.append(K.card('Conditional PMF of $Y$ given $X = ' + tT + '$',
        K.p('Keep only the outcomes with $X = ' + tT + '$: the column $t_1 = ' + tT + '$. Its cells add up to $f_X(' + tT + ') = ' + T(fxt) + '$, so divide each one by that; the new chances add up to 1 (lecture 1.3). Values of $Y$ not listed have chance 0 here.'),
        K.table(['$t_2$', '$f_{XY}(' + tT + ', t_2)$', '$f_{Y \\mid X = ' + tT + '}(t_2)$'], condRows(J.ys, y => J.P(t, y), fxt, uj), { compact: true }),
        flowSteps([{ text: 'For your $u$:', tex: al('P(Y = ' + uT + ' \\mid X = ' + tT + ') &= \\frac{f_{XY}(' + tT + ', ' + uT + ')}{f_X(' + tT + ')}', '&= ' + T(ptu) + ' \\div ' + T(fxt) + ' = ' + TX(ptu.div(fxt))) }])));
      out.append(K.card('Conditional PMF of $X$ given $Y = ' + uT + '$',
        K.p('The same with the row $t_2 = ' + uT + '$: divide each of its cells by $f_Y(' + uT + ') = ' + T(fyu) + '$.'),
        K.table(['$t_1$', '$f_{XY}(t_1, ' + uT + ')$', '$f_{X \\mid Y = ' + uT + '}(t_1)$'], condRows(J.xs, x => J.P(x, u), fyu, ti), { compact: true }),
        flowSteps([{ text: 'For your $t$:', tex: al('P(X = ' + tT + ' \\mid Y = ' + uT + ') &= \\frac{f_{XY}(' + tT + ', ' + uT + ')}{f_Y(' + uT + ')}', '&= ' + T(ptu) + ' \\div ' + T(fyu) + ' = ' + TX(ptu.div(fyu))) }])));

      const checks = cellChecks(J), bad = checks.filter(c => !c.ok), prod = fxt.mul(fyu);
      out.append(K.card('Are $X$ and $Y$ independent?',
        flowSteps([
          { text: 'If they were, every cell would be the product of its two marginals (lecture 2.1). For your cell:', tex: al('f_X(' + tT + ')\\,f_Y(' + uT + ') &= ' + T(fxt) + ' \\cdot ' + T(fyu) + ' = ' + T(prod), '&' + (prod.eq(ptu) ? '=' : '\\ne') + ' ' + T(ptu) + ' = f_{XY}(' + tT + ', ' + uT + ')') },
          { text: bad.length ? 'So $X$ and $Y$ are <b>dependent</b>: ' + bad.length + ' of the ' + checks.length + ' cells fail.' + (prod.eq(ptu) ? ' Your cell passes, but one failing cell is enough.' : '') : 'All ' + checks.length + ' cells pass, so $X$ and $Y$ are <b>independent</b>.' },
        ]),
        h('p', { class: 'lk-p' }, h('a', { href: '#/labs/dice/independence?' + qs({ f1: d1.f, w1: s.v.w1, f2: d2.f, w2: s.v.w2, x: s.v.x, y: s.v.y }), html: rich('Check every cell in <b>Independent random variables</b> →') }))));
    }
    draw();
  }

  /* ================================================================== independence */
  // ?f1=6&w1=&f2=6&w2=&x=d1&y=d1%2Bd2   faces 2–12; x, y formulas in d1 and d2 (the two dice)
  function independence(el, query, ctx) {
    const s = K.state(ctx, { f1: 6, w1: '', f2: 6, w2: '', x: 'd1', y: 'd1+d2' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    controls.append(
      K.p('Roll two dice, $D_1$ and $D_2$, and make two random variables $X$ and $Y$ from them. They are <b>independent</b> when knowing one never changes the chances of the other.'),
      ...pairControls(s),
      tries([
        ['Two different dice: $X = D_1$, $Y = D_2$', Object.assign({ x: 'd1', y: 'd2' }, FAIR2)],
        ['$X = D_1$, $Y = D_1 + D_2$', Object.assign({ x: 'd1', y: 'd1+d2' }, FAIR2)],
        ['Is $D_1$ odd? Is the sum odd?', Object.assign({ x: 'd1 mod 2', y: '(d1+d2) mod 2' }, FAIR2)],
        ['The same, second die loaded', Object.assign({}, FAIR2, { w2: '1,1,1,1,1,3', x: 'd1 mod 2', y: '(d1+d2) mod 2' })],
        ['Larger and smaller', Object.assign({ x: 'max(d1,d2)', y: 'min(d1,d2)' }, FAIR2)],
      ], again(independence, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      let d1, d2, ex, ey, J;
      try { [d1, d2] = pairDice(s, 12); ex = parseF(s.v.x, PAIR_VARS); ey = parseF(s.v.y, PAIR_VARS); J = jointPMF(d1, d2, ex, ey); }
      catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const XT = texF(ex, PAIR_NAMES), YT = texF(ey, PAIR_NAMES);
      const checks = cellChecks(J), bad = checks.filter(c => !c.ok), first = bad[0], nx = J.xs.length;
      const cellT = c => '(' + T(c.x) + ', ' + T(c.y) + ')';
      out.append(answer('Are $X = ' + XT + '$ and $Y = ' + YT + '$ independent?',
        first ? al('\\text{No: }\\ f_{XY}' + cellT(first) + ' &= ' + T(first.pj), '&\\ne ' + T(first.pr) + ' = f_X(' + T(first.x) + ')\\,f_Y(' + T(first.y) + ')') : al('\\text{Yes: all ' + checks.length + ' cells pass:}', 'f_{XY}(t_1, t_2) = f_X(t_1)\\,f_Y(t_2)'),
        first ? 'One failing cell is enough: they are dependent.' : null));
      out.append(K.card('The rule (lecture 2.1)', flowSteps([
        { text: '$X$ and $Y$ are independent exactly when every cell of the joint table equals the product of its column total and its row total (the marginals):', tex: 'f_{XY}(t_1, t_2) = f_X(t_1)\\,f_Y(t_2) \\quad \\text{for every } t_1, t_2' },
        { text: 'So check the cells one by one. One cell that fails is enough to say <b>dependent</b>. To say <b>independent</b>, all ' + checks.length + ' cells must pass.' },
      ])));
      out.append(K.card('The joint table, cell by cell',
        K.p('The joint table of $X$ and $Y$ (each cell adds the chances of the outcomes of the two dice that give it; see the topic Joint table). Green: the cell equals $f_X(t_1)\\,f_Y(t_2)$. Red: it does not.' + (first ? ' The outlined cell is the first that fails, reading row by row.' : '')),
        jointTable(J, (i, j) => { const c = checks[j * nx + i]; return { bg: c.ok ? GOODBG : BADBG, strong: c === first }; })));
      const upto = first ? checks.indexOf(first) + 1 : checks.length, shown = checks.slice(0, Math.min(upto, 40));
      out.append(K.card(first ? 'Cell by cell, up to the first that fails' : 'Cell by cell',
        K.table(['cell $(t_1, t_2)$', '$f_{XY}(t_1, t_2)$', '', '$f_X(t_1)\\,f_Y(t_2)$'], shown.map(c => ['$' + cellT(c) + '$', '$' + T(c.pj) + '$', c.ok ? '$=$' : '$\\ne$', '$' + T(J.fx[c.i]) + ' \\cdot ' + T(J.fy[c.j]) + ' = ' + T(c.pr) + '$']), { hi: new Set(first && upto <= 40 ? [upto - 1] : []), compact: true }),
        upto > shown.length ? K.p(first ? 'The ' + (upto - 1) + ' cells before it all pass; the table shows the first 40.' : 'The other ' + (checks.length - shown.length) + ' cells pass too.') : null));
      if (first) {
        const outs = J.outs.filter(o => o.x.eq(first.x) && o.y.eq(first.y)), fxi = J.fx[first.i], fyj = J.fy[first.j];
        const st = [
          { text: 'Look at the cell $X = ' + T(first.x) + '$, $Y = ' + T(first.y) + '$. ' + (outs.length ? 'The outcomes that give it: ' + outs.map(o => '$(' + o.a + ', ' + o.b + ')$').join(', ') + '. Add their chances:' : 'No outcome of the dice gives this pair, so its chance is 0:'), tex: 'f_{XY}' + cellT(first) + ' = ' + (outs.length ? sumTex(outs.map(o => T(o.p)), first.pj) : '0') },
          { text: 'Its column total and its row total (the marginals):', tex: 'f_X(' + T(first.x) + ') = ' + T(fxi) + ', \\qquad f_Y(' + T(first.y) + ') = ' + T(fyj) },
          { text: 'If $X$ and $Y$ were independent, the cell would be the product:', tex: 'f_X(' + T(first.x) + ')\\,f_Y(' + T(first.y) + ') = ' + T(fxi) + ' \\cdot ' + T(fyj) + ' = ' + T(first.pr) },
          { text: 'But the cell is $' + T(first.pj) + '$, not $' + T(first.pr) + '$. In words: knowing $X = ' + T(first.x) + '$ changes the chance of $Y = ' + T(first.y) + '$:', tex: al('P(Y = ' + T(first.y) + ' \\mid X = ' + T(first.x) + ') &= ' + T(first.pj) + ' \\div ' + T(fxi), '&= ' + TX(first.pj.div(fxi)), 'P(Y = ' + T(first.y) + ') &= ' + TX(fyj)) },
          { text: 'So $X$ and $Y$ are <b>dependent</b>. Altogether ' + bad.length + ' of the ' + checks.length + ' cells fail.' },
        ];
        const zero = checks.find(c => c.pj.isZero());
        if (zero) st.push({ text: 'A quick giveaway (lecture 2.1): the cell $' + cellT(zero) + '$ is 0, while its column total $' + T(J.fx[zero.i]) + '$ and row total $' + T(J.fy[zero.j]) + '$ are not, so their product is not 0. A 0 inside the table always means dependent.' });
        out.append(K.card('The first failing cell, explained', flowSteps(st)));
      } else {
        const ux = usedVars(ex), uy = usedVars(ey), dn = v => (v === 'd1' ? 'the first die' : 'the second die');
        const sep = ux.size && uy.size && [...ux].every(v => !uy.has(v));
        out.append(K.card('Why they are independent', K.p(
          sep ? '$X$ uses only ' + dn([...ux][0]) + ' and $Y$ uses only ' + dn([...uy][0]) + '. The dice do not affect each other, and functions of independent random variables stay independent (lecture 2.9). So this was expected, and every cell confirms it.'
            : !ux.size || !uy.size ? 'One of them does not use the dice at all: it is a constant, and a constant is independent of anything.'
              : 'Both use the same die, yet every cell passes: the chances fit exactly. Such a fit can break when a die is loaded (try the chip "The same, second die loaded").')));
      }
    }
    draw();
  }

  /* ================================================================== function: Y = g(X) */
  /** arrows from each face x (top row) to its value g(x) (bottom row); arrows that meet share a colour */
  function arrowsPic(d, G) {
    const nT = d.f, nB = G.length, W = Math.max(340, 40 * Math.max(nT, nB) + 50), H = 200, L = 30, R = 10, yT = 54, yB = 144;
    const xT = i => L + (i + 0.5) * (W - L - R) / nT, xB = j => L + (j + 0.5) * (W - L - R) / nB;
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'arrows from each face to its value of g', style: W > 420 ? 'min-width:' + Math.round(W * 0.8) + 'px' : null });
    svg.append(sv('text', { x: 4, y: yT + 4, class: 'axis' }, 'X'), sv('text', { x: 4, y: yB + 4, class: 'axis' }, 'Y'));
    G.forEach((g, j) => g.idx.forEach(i => {
      const col = PALETTE[j % PALETTE.length], x1 = xT(i), y1 = yT + 14, x2 = xB(j), y2 = yB - 15, a = Math.atan2(y2 - y1, x2 - x1), ah = 7;
      svg.append(sv('line', { x1: x1.toFixed(1), y1, x2: (x2 - Math.cos(a) * ah * 0.8).toFixed(1), y2: (y2 - Math.sin(a) * ah * 0.8).toFixed(1), style: 'stroke:' + col + ';stroke-width:' + (g.idx.length > 1 ? 2.6 : 1.6) }));
      svg.append(sv('polygon', { points: [[x2, y2], [x2 - ah * Math.cos(a - 0.45), y2 - ah * Math.sin(a - 0.45)], [x2 - ah * Math.cos(a + 0.45), y2 - ah * Math.sin(a + 0.45)]].map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' '), style: 'fill:' + col }));
    }));
    d.faces.forEach((x, i) => {
      const zero = d.p[i].isZero();
      svg.append(sv('circle', { cx: xT(i).toFixed(1), cy: yT, r: 13, style: 'fill:var(--bg-elev);stroke:var(--ink-3);stroke-width:1.4' + (zero ? ';opacity:.4' : '') }));
      svg.append(sv('text', { x: xT(i).toFixed(1), y: yT + 4.5, 'text-anchor': 'middle', style: 'font:700 12px var(--font);fill:var(--ink)' }, String(x)));
      svg.append(sv('text', { x: xT(i).toFixed(1), y: yT - 21, 'text-anchor': 'middle', class: 'tick' }, d.p[i].str()));
    });
    G.forEach((g, j) => {
      const col = PALETTE[j % PALETTE.length], lab = g.y.str(), w = Math.max(28, 10 + 7.2 * lab.length);
      svg.append(sv('rect', { x: (xB(j) - w / 2).toFixed(1), y: yB - 13, width: w.toFixed(1), height: 26, rx: 8, style: 'fill:var(--bg-elev);stroke:' + col + ';stroke-width:2' }));
      svg.append(sv('text', { x: xB(j).toFixed(1), y: yB + 4.5, 'text-anchor': 'middle', style: 'font:700 12px var(--font);fill:var(--ink)' }, lab));
      svg.append(sv('text', { x: xB(j).toFixed(1), y: yB + 33, 'text-anchor': 'middle', class: 'tick', style: 'fill:' + col + ';font-weight:700' }, g.p.str()));
    });
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  // ?f=6&lo=1&w=&g=(x-3)%5E2   f faces (2–30); lo the first face (1, or 0 for faces 0 … f−1); w weights; g a formula in x
  function func(el, query, ctx) {
    const s = K.state(ctx, { f: 6, lo: 1, w: '', g: '(x-3)^2' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    const lo0 = Number(s.v.lo) === 0 ? 0 : 1;
    controls.append(
      K.p('Roll one die; $X$ is the number. A function $g$ turns each number into a new one, so $Y = g(X)$ is a new random variable. Which values can $Y$ take, and with what chances?'),
      dieControls({ title: 'The die $X$', f: clampInt(s.v.f, 2, 30, 6), maxF: 30, lo: lo0, w: s.v.w, onChange: (f, w) => s.set({ f, w }) }),
      K.seg({ label: 'Faces numbered', options: [['1', '1 to f'], ['0', '0 to f − 1']], value: String(lo0), onChange: v => s.set({ lo: +v }) }),
      formulaField({ label: '$Y = g(X) =$', value: s.v.g, vars: ['x'], chips: [['$(x-3)^2$', '(x-3)^2'], ['$|x-3|$', '|x-3|'], ['$x \\bmod 2$', 'x mod 2'], ['$2x+1$', '2x+1'], ['$\\min(x, 4)$', 'min(x,4)'], ['$x > 4$', 'x > 4'], ['$x^2$', 'x^2']],
        help: 'Type with <code>x</code> and <code>+ - * / ^ mod |…|</code>, <code>min( )</code>, <code>max( )</code>. A comparison like <code>x > 4</code> gives 1 when true and 0 when false.', onChange: v => s.set({ g: v }) }),
      tries([
        ['Lecture 2.4: $X$ uniform on $0, \\dots, 10$ and $Y = (X - 5)^2$', { f: 11, lo: 0, w: '', g: '(x-5)^2' }],
        ['Lecture 2.3: $Y = X - 5$ (one-to-one)', { f: 11, lo: 0, w: '', g: 'x-5' }],
        ['Lecture 2.3: $Y = 2^X$', { f: 11, lo: 0, w: '', g: '2^x' }],
        ['Loaded die, $Y = |X - 3|$', { f: 6, lo: 1, w: '1,1,1,1,1,3', g: '|x-3|' }],
        ['Odd or even: $X \\bmod 2$', { f: 6, lo: 1, w: '', g: 'x mod 2' }],
      ], again(func, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      const lo = Number(s.v.lo) === 0 ? 0 : 1;
      let d, e;
      try { d = makeDie(clampInt(s.v.f, 2, 30, 6), s.v.w, lo); e = parseF(s.v.g, ['x']); }
      catch (er) { out.append(K.note(er.message, 'warn')); return; }
      const GT = texF(e, { x: 'X' }), gv = [];
      for (const x of d.faces) {
        try { gv.push(evalF(e, { x: F(x) })); }
        catch (er) { out.append(K.note('$g(' + x + ')$ cannot be worked out: it ' + er.message + '. Change $g$ or the faces.', 'warn')); return; }
      }
      const byY = new Map();
      d.faces.forEach((x, i) => { if (d.p[i].isZero()) return; const k = gv[i].str(); if (!byY.has(k)) byY.set(k, { y: gv[i], idx: [] }); byY.get(k).idx.push(i); });
      const G = sortF([...byY.values()].map(g => g.y)).map(y => byY.get(y.str()));
      G.forEach(g => { g.p = fsum(g.idx.map(i => d.p[i])); });
      const merged = G.filter(g => g.idx.length > 1);
      // one small table per 4 values, side by side on a laptop and under each other on a phone (one wide table would scroll)
      const four = Array.from({ length: Math.ceil(G.length / 4) }, (_, i) => G.slice(4 * i, 4 * i + 4));
      const pmf = answer('The PMF of $Y = ' + GT + '$', '', merged.length ? 'Faces that give the same value collide, and their chances add.' : '$g$ is one-to-one here: each face keeps its own chance, only the values move.');
      pmf.querySelector('.lk-answer-v').innerHTML = four.map(c => '<span class="lk-wrap" style="display: inline-block; margin: .2em 1.5em .5em 0">' +
        K.kx('\\displaystyle \\begin{array}{c|' + 'c'.repeat(c.length) + '} y & ' + c.map(g => T(g.y)).join(' & ') + ' \\\\ \\hline P(Y = y) & ' + c.map(g => T(g.p)).join(' & ') + ' \\end{array}', false) + '</span>').join('');
      out.append(pmf);
      out.append(K.card('Where each face goes',
        K.p('Top: the faces of the die with their chances. Bottom: the values of $Y$. Each arrow goes from $x$ to $g(x)$. ' + (merged.length ? 'Thick arrows meet at the same value: those chances are added (lecture 2.4).' : 'No two arrows meet: $g$ is one-to-one (lecture 2.3).')),
        arrowsPic(d, G)));
      const facesOf = g => listAnd(g.idx.map(i => '$' + d.faces[i] + '$'));
      const st = [{ text: 'Work out $g(x)$ for every face. The table also lists each face\'s chance.' }];
      merged.forEach(g => st.push({ text: '$Y = ' + T(g.y) + '$ when $X$ is ' + facesOf(g) + ': ' + g.idx.length + ' faces collide, so add their chances:', tex: sumLines('P(Y = ' + T(g.y) + ')', g.idx.map(i => T(d.p[i])), g.p, { per: 5, def: g.idx.map(i => 'P(X = ' + d.faces[i] + ')').join(' + ') }) }));
      const single = G.filter(g => g.idx.length === 1);
      if (single.length) st.push({ text: (merged.length ? 'Every other value' : 'Every value') + ' of $Y$ comes from one face only, so it keeps that face\'s chance: ' + single.slice(0, 8).map(g => '$P(Y = ' + T(g.y) + ') = P(X = ' + d.faces[g.idx[0]] + ') = ' + T(g.p) + '$').join(', ') + (single.length > 8 ? ', and so on' : '') + '.' });
      st.push({ text: 'Check: the chances of $Y$ add up to 1.', tex: '\\sum_y P(Y = y) = ' + T(fsum(G.map(g => g.p))) });
      out.append(K.card('Every step',
        K.table(['$x$', '$P(X = x)$', '$g(x)$'], d.faces.map((x, i) => ['$' + x + '$', '$' + T(d.p[i]) + '$', '$' + texF(e, { x: F(x) }) + ' = ' + T(gv[i]) + '$']), { compact: true }),
        flowSteps(st)));
      out.append(K.card('The PMF of $Y$',
        K.p('Each bar stands at a value of $Y$, at its true place on the number line. ' + (merged.length ? 'Compared with the flat or smooth PMF of $X$, values merge and some bars grow (lecture 2.4).' : 'The bars keep their heights; they only move to new places (lecture 2.3).')),
        barChart({ xs: G.map(g => g.y.num()), ys: G.map(g => g.p.num()), xName: 'y = g(x)', xl: v => r4(v, 3) }),
        K.table(['$y$', 'from $x =$', '$P(Y = y)$'], G.map(g => ['$' + T(g.y) + '$', g.idx.map(i => d.faces[i]).join(', '), '$' + TX(g.p) + '$']), { compact: true })));
      const EY1 = fsum(G.map(g => g.p.mul(g.y))), EY2 = fsum(d.faces.map((x, i) => d.p[i].mul(gv[i]))), EX = dieMean(d);
      const mean = [
        { text: 'From the PMF of $Y$:', tex: sumLines('E[Y]', G.map(g => TP(g.y) + '\\cdot ' + T(g.p)), EY1, { def: '\\sum_y y\\,P(Y = y)' }) },
        { text: 'Straight from $X$, without the PMF of $Y$: weight each $g(x)$ by the chance of $x$. The two ways agree.', tex: sumLines('E[g(X)]', d.faces.map((x, i) => TP(gv[i]) + '\\cdot ' + T(d.p[i])), EY2, { def: '\\sum_x g(x)\\,P(X = x)' }) },
      ];
      try {
        const gm = evalF(e, { x: EX });
        mean.push({ text: 'Careful: putting the mean $E[X] = ' + T(EX) + '$ into $g$ ' + (gm.eq(EY2) ? 'happens to give the same number here, but in general it does not:' : 'gives a different number. In general $E[g(X)] \\ne g(E[X])$:'), tex: 'g(E[X]) = g\\left(' + T(EX) + '\\right) = ' + TX(gm) });
      } catch (er) { /* g cannot take the mean (like mod 0); skip the remark */ }
      out.append(K.card('The mean of $Y$, two ways', flowSteps(mean)));
    }
    draw();
  }

  /* ================================================================== covariance */
  /** a bubble for each cell of the joint table (area ∝ chance), with dashed lines at the means */
  function scatterPic(cells, EX, EY) {
    const xv = cells.map(c => c.x.num()), yv = cells.map(c => c.y.num()), mx = EX.num(), my = EY.num();
    const xlo = Math.min(...xv), xhi = Math.max(...xv), ylo = Math.min(...yv), yhi = Math.max(...yv);
    const px = (xhi - xlo) * 0.1 || 0.6, py = (yhi - ylo) * 0.1 || 0.6, pmax = Math.max(...cells.map(c => c.p.num()));
    const dots = cells.map(c => {
      const sg = (c.x.num() - mx) * (c.y.num() - my);
      return { x: c.x.num(), y: c.y.num(), r: (2.5 + 8 * Math.sqrt(c.p.num() / pmax)).toFixed(1), style: 'fill:' + (sg > 1e-12 ? 'var(--good)' : sg < -1e-12 ? 'var(--bad)' : 'var(--ink-4)') + ';fill-opacity:.8', title: '(' + c.x.str() + ', ' + c.y.str() + '): ' + c.p.str() };
    });
    const xs = [...new Set(xv)].sort((a, b) => a - b);
    return chart({ H: 250, x0: xlo - px, x1: xhi + px, y0: ylo - py, y1: yhi + py, xt: xs, yt: ticksBetween(ylo, yhi, 5), xName: 'X (across)  ·  Y (up)', dots, rules: [{ x: mx, label: 'E[X]' }, { y: my, label: 'E[Y]' }] });
  }
  // ?f1=6&w1=&f2=6&w2=&x=d1&y=d1%2Bd2   faces 2–12; x, y formulas in d1 and d2 (the two dice)
  function covariance(el, query, ctx) {
    const s = K.state(ctx, { f1: 6, w1: '', f2: 6, w2: '', x: 'd1', y: 'd1+d2' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    controls.append(
      K.p('Roll two dice, $D_1$ and $D_2$, and make $X$ and $Y$ from them. The <b>covariance</b> says whether $X$ and $Y$ tend to be big together (positive) or one big when the other is small (negative). The <b>correlation</b> puts this on a scale from $-1$ to $1$.'),
      ...pairControls(s),
      tries([
        ['$X = D_1$, $Y = D_1 + D_2$', Object.assign({ x: 'd1', y: 'd1+d2' }, FAIR2)],
        ['Two different dice: $\\Cov(D_1, D_2) = 0$', Object.assign({ x: 'd1', y: 'd2' }, FAIR2)],
        ['Sum and difference: 0, yet dependent', Object.assign({ x: 'd1+d2', y: 'd1-d2' }, FAIR2)],
        ['Larger and smaller', Object.assign({ x: 'max(d1,d2)', y: 'min(d1,d2)' }, FAIR2)],
        ['$Y = 7 - D_1$: exactly opposite', Object.assign({ x: 'd1', y: '7-d1' }, FAIR2)],
      ], again(covariance, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      let d1, d2, ex, ey, J;
      try { [d1, d2] = pairDice(s, 12); ex = parseF(s.v.x, PAIR_VARS); ey = parseF(s.v.y, PAIR_VARS); J = jointPMF(d1, d2, ex, ey); }
      catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const XT = texF(ex, PAIR_NAMES), YT = texF(ey, PAIR_NAMES);
      const EX = fsum(J.xs.map((x, i) => x.mul(J.fx[i]))), EY = fsum(J.ys.map((y, j) => y.mul(J.fy[j])));
      const cells = [];
      J.ys.forEach((y, j) => J.xs.forEach((x, i) => { const p = J.P(x, y); if (!p.isZero()) cells.push({ x, y, p, i, j }); }));
      const EXY = fsum(cells.map(c => c.x.mul(c.y).mul(c.p))), cov = EXY.sub(EX.mul(EY));
      const covDef = fsum(cells.map(c => c.x.sub(EX).mul(c.y.sub(EY)).mul(c.p)));
      const EX2 = fsum(J.xs.map((x, i) => x.mul(x).mul(J.fx[i]))), EY2 = fsum(J.ys.map((y, j) => y.mul(y).mul(J.fy[j])));
      const VX = EX2.sub(EX.mul(EX)), VY = EY2.sub(EY.mul(EY));
      let rhoT = null, rho2 = null;
      if (!VX.isZero() && !VY.isZero()) {
        rho2 = cov.mul(cov).div(VX.mul(VY));
        const a = isqrt(rho2.n), b = isqrt(rho2.d), neg = cov.cmp(0) < 0 ? '-' : '';
        rhoT = a * a === rho2.n && b * b === rho2.d ? neg + F(a, b).tex() : neg + '\\sqrt{' + rho2.tex() + '} \\approx ' + r4((neg ? -1 : 1) * Math.sqrt(rho2.num()), 4);
      }
      out.append(answer('For $X = ' + XT + '$ and $Y = ' + YT + '$', al('\\Cov(X, Y) &= ' + TX(cov), '\\rho_{XY} &= ' + (rhoT || '\\text{not defined}')),
        rhoT ? null : 'The correlation needs both variances to be more than 0; here one of them never changes.'));
      out.append(K.card('The joint table',
        K.p('First the joint table of $X$ and $Y$: each cell adds the chances of the outcomes of the two dice that give it (see the topic Joint table). The edges are the marginals.'),
        jointTable(J)));
      out.append(K.card('Step 1: the two means', flowSteps([
        { text: 'Weight each value of $X$ by its chance (bottom edge of the table):', tex: sumLines('E[X]', J.xs.map((x, i) => TP(x) + '\\cdot ' + T(J.fx[i])), EX, { def: '\\sum_{t_1} t_1\\, f_X(t_1)' }) },
        { text: 'The same for $Y$ (right edge of the table):', tex: sumLines('E[Y]', J.ys.map((y, j) => TP(y) + '\\cdot ' + T(J.fy[j])), EY, { def: '\\sum_{t_2} t_2\\, f_Y(t_2)' }) },
      ])));
      const byCell = cells.length <= 40;
      const groups = J.xs.map((x, i) => { const cs = cells.filter(c => c.i === i), inner = fsum(cs.map(c => c.y.mul(c.p))); return { x, cs, inner, part: x.mul(inner) }; });
      out.append(K.card('Step 2: $E[XY]$, cell by cell',
        K.p(byCell ? 'For every cell that is not 0, multiply its two values and its chance. Then add the last column.' : 'There are many cells, so group them by column: inside column $t_1$, add $t_2\\, f_{XY}(t_1, t_2)$; then multiply by $t_1$.'),
        byCell ? K.table(['$t_1$', '$t_2$', '$f_{XY}(t_1, t_2)$', '$t_1\\, t_2\\, f_{XY}$'], cells.map(c => ['$' + T(c.x) + '$', '$' + T(c.y) + '$', '$' + T(c.p) + '$', '$' + T(c.x.mul(c.y).mul(c.p)) + '$']).concat([['', '', '<b>total</b>', '<b>$' + T(EXY) + '$</b>']]), { compact: true })
          : K.table(['$t_1$', '$\\sum_{t_2} t_2 f_{XY}(t_1, t_2)$', '$t_1 \\times$ that'], groups.map(g => ['$' + T(g.x) + '$', '$' + T(g.inner) + '$', '$' + T(g.part) + '$']).concat([['', '<b>total</b>', '<b>$' + T(EXY) + '$</b>']]), { compact: true }),
        flowSteps([{ text: 'The total is the mean of the product:', tex: 'E[XY] = \\sum_{t_1, t_2} t_1\\, t_2\\, f_{XY}(t_1, t_2) = ' + TX(EXY) }])));
      out.append(K.card('Step 3: the covariance', flowSteps([
        { text: 'The short formula (lecture 3.5): the mean of the product minus the product of the means.', tex: '\\Cov(X, Y) = E[XY] - E[X]\\,E[Y]' },
        { text: 'Put in the numbers:', tex: al('&= ' + T(EXY) + ' - ' + TP(EX) + ' \\cdot ' + TP(EY), '&= ' + T(EXY) + ' - ' + TP(EX.mul(EY)) + ' = ' + TX(cov)) },
        { text: 'Check with the definition: add $(t_1 - E[X])(t_2 - E[Y])\\, f_{XY}(t_1, t_2)$ over all cells. Same answer:', tex: al('&E\\big[(X - E[X])(Y - E[Y])\\big]', '&= ' + TX(covDef)) },
      ])));
      const vst = [
        { text: 'Variance of $X$: the mean of $X^2$ minus the square of the mean.', tex: al('E[X^2] &= \\textstyle\\sum t_1^2 f_X(t_1) = ' + T(EX2), '\\Var(X) &= E[X^2] - (E[X])^2', '&= ' + T(EX2) + ' - ' + sq(EX) + ' = ' + TX(VX)) },
        { text: 'Variance of $Y$, the same way:', tex: al('E[Y^2] &= \\textstyle\\sum t_2^2 f_Y(t_2) = ' + T(EY2), '\\Var(Y) &= E[Y^2] - (E[Y])^2', '&= ' + T(EY2) + ' - ' + sq(EY) + ' = ' + TX(VY)) },
      ];
      if (rhoT) vst.push(
        { text: 'The correlation divides the covariance by both standard deviations (lecture 3.6), so it has no units and lies between $-1$ and $1$:', tex: al('\\rho_{XY} &= \\frac{\\Cov(X, Y)}{\\SD(X)\\,\\SD(Y)}', '&= \\frac{\\Cov(X, Y)}{\\sqrt{\\Var(X)\\,\\Var(Y)}}') },
        { text: 'Square it to keep the numbers exact:', tex: al('\\rho_{XY}^2 &= \\frac{\\Cov(X, Y)^2}{\\Var(X)\\,\\Var(Y)}', '&= ' + sq(cov) + ' \\div \\left(' + T(VX) + ' \\cdot ' + T(VY) + '\\right)', '&= ' + T(rho2)) },
        { text: 'Take the square root, with the sign of the covariance:', tex: '\\rho_{XY} = ' + rhoT });
      else vst.push({ text: 'One variance is 0 (that variable never changes), so the correlation is not defined.' });
      out.append(K.card('Step 4: variances and correlation', flowSteps(vst)));
      out.append(K.card('A picture',
        K.p('One bubble per cell; a bigger bubble means a bigger chance. The dashed lines cross at the means. Green bubbles (up-right or down-left of the cross) push the covariance up; red ones (the other two corners) pull it down; grey ones sit on a line and add nothing.'),
        scatterPic(cells, EX, EY)));
      const checks = cellChecks(J), bad = checks.find(c => !c.ok);
      out.append(K.card('Covariance and independence',
        !bad ? K.note('$X$ and $Y$ are independent (every cell of the joint table is the product of its marginals), so $E[XY] = E[X]\\,E[Y]$ and the covariance is 0, as it must be.', 'good')
          : cov.isZero() ? K.note('The covariance is 0, but $X$ and $Y$ are <b>dependent</b>: the cell $(' + T(bad.x) + ', ' + T(bad.y) + ')$ is $' + T(bad.pj) + '$, not $' + T(bad.pr) + '$. Zero covariance does not mean independent (lecture 3.5).', 'warn')
            : K.p('The covariance is not 0, so $X$ and $Y$ cannot be independent: independent variables always have covariance 0. (The cell $(' + T(bad.x) + ', ' + T(bad.y) + ')$ shows it: $' + T(bad.pj) + ' \\ne ' + T(bad.pr) + '$.)')));
    }
    draw();
  }

  /* ================================================================== numbers for many dice, simulations and tests */
  const convCache = new Map();
  /** the total of n dice with whole-number weights w, exactly: P(S = n·lo + i) = c[i] / W^n (one die added at a time) */
  function sumCounts(w, n) {
    const key = w.join(',');
    let list = convCache.get(key);
    if (!list) { list = [[1n]]; convCache.set(key, list); if (convCache.size > 24) convCache.delete(convCache.keys().next().value); }
    while (list.length <= n) {
      const c = list[list.length - 1], nc = new Array(c.length + w.length - 1).fill(0n);
      for (let i = 0; i < c.length; i++) { const ci = c[i]; if (ci === 0n) continue; for (let j = 0; j < w.length; j++) if (w[j] !== 0n) nc[i + j] += ci * w[j]; }
      list.push(nc);
    }
    return list[n];
  }
  const bsum = (arr, from = 0, to = arr.length - 1) => { let t = 0n; for (let i = Math.max(0, from); i <= Math.min(arr.length - 1, to); i++) t += arr[i]; return t; };
  /** a fraction for a table cell: exact, or "≈ decimal" when its digits are too long to read */
  const TXs = (fr, k = 4) => (String(fr.d).length > 12 ? '\\approx ' + dx(fr.num(), Math.max(k, 6)) : TX(fr, k));
  /** standard normal CDF (Marsaglia's series) and density */
  const PHI = z => { if (z < -9) return 0; if (z > 9) return 1; let s = z, t = 0, b = z, i = 1; const q = z * z; while (s !== t) { t = s; i += 2; b *= q / i; s = t + b; } return 0.5 + s * Math.exp(-0.5 * q - 0.91893853320467274178); };
  const phi = z => Math.exp(-0.5 * z * z) / Math.sqrt(2 * Math.PI);
  const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
  /** log Γ(z) (Lanczos) */
  function lnGamma(z) {
    if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
    z -= 1;
    let x = LG[0];
    for (let i = 1; i < 9; i++) x += LG[i] / (z + i);
    const t = z + 7.5;
    return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
  }
  /** P(χ²_ν ≤ x) by the series e^{−x/2} Σ_m (x/2)^{ν/2+m} / Γ(ν/2+m+1): each term is the last times (x/2)/(ν/2+m+1).
      Returns the value, how many terms were added and the first three terms. */
  function chi2cdf(x, nu) {
    if (!(x > 0)) return { cdf: 0, terms: 1, first: [0] };
    const a = nu / 2, hx = x / 2, logT0 = a * Math.log(hx) - hx - lnGamma(a + 1), t0 = Math.exp(logT0);
    let rel = 1, sum = 1, logScale = 0, m = 0;
    const first = [t0];
    while (m < 400000) {
      m++;
      rel *= hx / (a + m);
      sum += rel;
      if (first.length < 3) first.push(t0 * rel);
      if (sum > 1e250) { sum /= 1e250; rel /= 1e250; logScale += 250 * Math.LN10; }
      if (m > hx && rel < sum * 1e-17) break;
    }
    return { cdf: Math.min(1, Math.exp(logT0 + logScale + Math.log(sum))), terms: m + 1, first };
  }
  /** the critical value c with P(χ²_ν ≥ c) = α, by halving the interval (bisection) */
  function chi2crit(alpha, nu) {
    let lo = 0, hi = nu + 20 * Math.sqrt(2 * nu) + 60;
    for (let i = 0; i < 80; i++) { const mid = (lo + hi) / 2; if (1 - chi2cdf(mid, nu).cdf > alpha) lo = mid; else hi = mid; }
    return (lo + hi) / 2;
  }
  /** a p-value: 4 decimals, or 2 significant digits with a power of ten when it is small */
  const pfmt = x => (x >= 0.001 ? r4(x, 4) : (([m, e]) => m + ' \\times 10^{' + Number(e) + '}')(x.toExponential(1).split('e')));
  const chi2pdf = (x, nu) => (x <= 0 ? 0 : Math.exp((nu / 2 - 1) * Math.log(x) - x / 2 - (nu / 2) * Math.LN2 - lnGamma(nu / 2)));
  /** rolls of the die d, drawn with the random numbers rnd */
  function roller(d, rnd) {
    if (d.fair) return () => d.lo + Math.floor(rnd() * d.f);
    const W = Number(d.W), cum = [];
    let c = 0;
    d.w.forEach(x => { c += Number(x) / W; cum.push(c); });
    return () => { const u = rnd(); let lo = 0, hi = cum.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (u < cum[mid]) hi = mid; else lo = mid + 1; } return d.lo + lo; };
  }
  const rollBtn = (s, label = 'Roll again') => h('div', { class: 'lk-row' }, h('button', { type: 'button', class: 'btn sm', style: 'min-height:44px', text: label, onclick: () => s.set({ seed: clampInt(s.v.seed, 1, 1e9, 1) + 1 }) }));
  /** quick-value chips that restart the topic (for steppers with a wide range) */
  const quick = (label, list, go) => h('div', { class: 'lk-field' }, h('div', { class: 'lk-label', html: rich(label) }), h('div', { class: 'lk-presets' }, list.map(([t, patch]) => h('button', { type: 'button', class: 'lk-chip', style: 'min-height:44px', html: rich(t), onclick: () => go(patch) }))));
  /** one die: its mean and variance, worked out */
  function dieMoments(d) {
    const mu = dieMean(d), e2 = dieE2(d), v = e2.sub(mu.mul(mu));
    const st = d.fair && d.lo === 1 ? [
      { text: 'One fair die with faces $1$ to $' + d.f + '$: its mean is the middle face, $\\frac{f+1}{2}$, and its variance is $\\frac{f^2-1}{12}$ (the sums $1 + \\dots + f$ and $1^2 + \\dots + f^2$ give these).', tex: al('\\mu = E[X] &= \\frac{' + d.f + ' + 1}{2} = ' + TX(mu), '\\sigma^2 = \\Var(X) &= \\frac{' + d.f + '^2 - 1}{12} = ' + TX(v)) },
    ] : [
      { text: 'One die: weight each face by its chance for the mean, and use $\\Var(X) = E[X^2] - (E[X])^2$ for the variance.', tex: al('\\mu = E[X] &= \\textstyle\\sum_x x\\,P(X = x) = ' + TX(mu), 'E[X^2] &= \\textstyle\\sum_x x^2\\,P(X = x) = ' + T(e2), '\\sigma^2 = \\Var(X) &= ' + T(e2) + ' - ' + sq(mu) + ' = ' + TX(v)) },
    ];
    return { mu, e2, v, st };
  }

  /* ================================================================== inequalities: Markov and Chebyshev */
  // ?n=2&f=6&w=&a=10   n dice (1–30); f faces (2–20) and w weights of each die; a the value in P(S ≥ a)
  function inequalities(el, query, ctx) {
    const s = K.state(ctx, { n: 2, f: 6, w: '', a: 10 }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    controls.append(
      K.p('Roll $n$ dice and add them: $S = X_1 + \\dots + X_n$. How likely is a big total, $P(S \\ge a)$? Markov and Chebyshev give quick upper limits from the mean and the variance alone. Here they meet the exact chance.'),
      K.int({ label: 'Number of dice $n$', value: clampInt(s.v.n, 1, 30, 2), min: 1, max: 30, onChange: v => s.set({ n: v }) }),
      dieControls({ title: 'Each die', f: clampInt(s.v.f, 2, 20, 6), w: s.v.w, onChange: (f, w) => s.set({ f, w }) }),
      K.int({ label: 'The value $a$ in $P(S \\ge a)$', value: clampInt(s.v.a, 1, 600, 10), min: 1, max: 600, onChange: v => s.set({ a: v }) }),
      tries([
        ['Lecture 3.7: the sum of a pair of dice', { n: 2, f: 6, w: '', a: 10 }],
        ['Two dice, $a = 12$', { n: 2, f: 6, w: '', a: 12 }],
        ['10 dice, $a = 45$', { n: 10, f: 6, w: '', a: 45 }],
        ['30 dice, $a = 120$', { n: 30, f: 6, w: '', a: 120 }],
        ['$a$ below the mean: no help', { n: 2, f: 6, w: '', a: 5 }],
      ], again(inequalities, el, ctx, s)));
    function draw() {
      out.innerHTML = '';
      let d;
      try { d = makeDie(clampInt(s.v.f, 2, 20, 6), s.v.w); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const n = clampInt(s.v.n, 1, 30, 2), a = clampInt(s.v.a, 1, 600, 10);
      const cnt = sumCounts(d.w, n), Wn = d.W ** BigInt(n), smin = n * d.lo, smax = smin + cnt.length - 1;
      const { mu: mu1, v: v1, st: oneSt } = dieMoments(d);
      const mu = mu1.mul(n), v = v1.mul(n), sd = Math.sqrt(v.num());
      const pTail = F(bsum(cnt, a - smin), Wn);
      const markov = mu.div(a), c = F(a).sub(mu), cheb = c.cmp(0) > 0 ? v.div(c.mul(c)) : null;
      let two = 0n;
      cnt.forEach((x, i) => { const dist = F(smin + i).sub(mu); if ((dist.cmp(0) < 0 ? dist.neg() : dist).cmp(c) >= 0) two += x; });
      const pTwo = F(two, Wn), useless = x => x.cmp(1) >= 0;
      out.append(answer('$P(S \\ge ' + a + ')$ for the total of ' + plural(n, 'die', 'dice'),
        al('\\text{exact} &' + eqTX(pTail), '\\text{Markov} &\\le ' + TX(markov), '\\text{Chebyshev} &\\le ' + (cheb ? TX(cheb) : '\\text{(no limit)}')),
        'Both limits are true, but they can be far above the exact chance: they use only the mean and the variance.'));
      const colors = cnt.map((_, i) => (smin + i >= a ? BARHI : c.cmp(0) > 0 && F(smin + i).cmp(mu.sub(c)) <= 0 ? 'var(--y)' : null));
      out.append(K.card('The total $S$',
        flowSteps(oneSt.concat([
          { text: 'The dice are independent, so the means add up and the variances add up too:', tex: al('E[S] &= n\\mu = ' + n + ' \\cdot ' + TP(mu1) + ' = ' + TX(mu), '\\Var(S) &= n\\sigma^2 = ' + n + ' \\cdot ' + TP(v1) + ' = ' + TX(v), '\\SD(S) &= \\sqrt{' + T(v) + '} \\approx ' + r4(sd)) },
          { text: 'The exact PMF of $S$ comes from adding one die at a time (the convolution of the topic Sum of two dice). Purple bars: $S \\ge ' + a + '$.' + (cheb ? ' Orange bars: the other side, at least as far below the mean (Chebyshev counts both sides).' : '') },
        ])),
        barChart({ xs: cnt.map((_, i) => smin + i), ys: cnt.map(x => Number(x) / Number(Wn)), fill: i => colors[i], xName: 's (total of ' + n + ' dice)', rules: [{ x: mu.num(), label: 'E[S]' }] })));
      const tailTerms = [];
      for (let t = Math.max(a, smin); t <= smax && tailTerms.length < 7; t++) tailTerms.push(T(F(cnt[t - smin], Wn)));
      const nTail = Math.max(0, smax - Math.max(a, smin) + 1);
      out.append(K.card('The exact chance', flowSteps([
        { text: a > smax ? 'The largest total is ' + smax + ', so $S \\ge ' + a + '$ cannot happen.' : 'Add the chances of the totals from ' + Math.max(a, smin) + ' to ' + smax + (nTail > 7 ? ' (' + nTail + ' totals; the first 7 are shown)' : '') + ':',
          tex: a > smax ? 'P(S \\ge ' + a + ') = 0' : sumLines('P(S \\ge ' + a + ')', nTail > 7 ? tailTerms.concat(['\\dots']) : tailTerms, pTail, { per: 3, def: '\\sum_{s=' + Math.max(a, smin) + '}^{' + smax + '} P(S = s)' }) },
        d.fair ? { text: 'With fair dice every one of the $' + d.f + '^{' + n + '}$ outcomes is equally likely, so this is (outcomes with total at least ' + a + ') ÷ (all outcomes):', tex: '\\frac{' + bsum(cnt, a - smin) + '}{' + Wn + '}' + (pTail.isZero() ? ' = 0' : '') } : null,
      ].filter(Boolean))));
      out.append(K.card('Markov\'s inequality (lecture 3.7)', flowSteps([
        { text: 'It needs a variable that is never negative. $S$ is at least ' + smin + ', so it qualifies:', tex: 'P(S \\ge a) \\le \\frac{E[S]}{a}' },
        { text: 'Put in the numbers:', tex: 'P(S \\ge ' + a + ') \\le \\frac{' + T(mu) + '}{' + a + '} = ' + TX(markov) },
        { text: useless(markov) ? 'The limit is 1 or more, so it says nothing new: every chance is at most 1 anyway. Markov helps only for $a$ well above the mean.'
          : 'The exact chance $' + dx(pTail.num()) + '$ is below the limit $' + dx(markov.num()) + '$, as it must be. Markov knows only the mean, so the limit is loose.' },
      ])));
      out.append(K.card('Chebyshev\'s inequality (lecture 3.7)', cheb ? flowSteps([
        { text: '$S \\ge ' + a + '$ means $S$ is at least $c$ above its mean, where', tex: 'c = a - E[S] = ' + a + ' - ' + TP(mu) + ' = ' + T(c) },
        { text: 'Being $c$ above the mean is one part of being at least $c$ away from it on either side:', tex: 'P(S \\ge ' + a + ') \\le P(|S - E[S]| \\ge c)' },
        { text: 'Chebyshev limits the two-sided chance with the variance:', tex: al('P(|S - E[S]| \\ge c) &\\le \\frac{\\Var(S)}{c^2}', '&= ' + T(v) + ' \\div ' + sq(c), '&= ' + TX(cheb)) },
        { text: 'The exact two-sided chance (purple and orange bars) is $' + TXs(pTwo) + '$; the one-sided one is $' + TXs(pTail) + '$. ' + (useless(cheb) ? 'Here the limit is 1 or more, so it says nothing.' : 'Chebyshev uses the variance as well as the mean, so it is often (not always) tighter than Markov.') },
      ]) : K.note('Chebyshev needs $a$ above the mean $E[S] = ' + T(mu) + '$, so that $S \\ge a$ is a distance from the mean. Here $a \\le E[S]$, so it gives no limit.')));
      const ks = [1, 1.5, 2, 2.5, 3];
      const rows = ks.map(k => {
        let cc = 0n;
        cnt.forEach((x, i) => { if (Math.abs(smin + i - mu.num()) >= k * sd - 1e-9) cc += x; });
        const p = F(cc, Wn);
        return ['$' + k + '$' + small(r4(mu.num() - k * sd, 2) + ' to ' + r4(mu.num() + k * sd, 2)), '$' + TXs(p) + '$', '$' + TX(F(4, Math.round(4 * k * k))) + '$'];
      });
      out.append(K.card('Within $k$ standard deviations',
        K.p('Chebyshev with $c = k\\,\\SD(S)$ reads $P(|S - E[S]| \\ge k\\,\\SD(S)) \\le \\frac{1}{k^2}$. The exact chances outside $E[S] \\pm k\\,\\SD(S)$ are much smaller. ' + (n === 2 && d.fair && d.f === 6 ? 'Lecture 3.7 finds $\\frac13$ for $k = 1$ and $\\frac{2}{36}$ for $k = 2$ with this pair of dice.' : '')),
        K.table(['$k$ (and the interval)', 'exact chance outside', 'limit $\\frac{1}{k^2}$'], rows, { compact: true })));
    }
    draw();
  }

  /* ================================================================== continuous: the endless die */
  /** the unit square with the region u1 + u2 ≤ t shaded; with N ≤ 20, the N × N points (i/N, j/N) of two N-faced dice */
  function squarePic(t, N) {
    const S = 250, P = 34, W = S + P + 14, H = S + P + 14, X = u => P + u * S, Y = u => 10 + (1 - u) * S;
    const svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, class: 'lk-chart', role: 'img', 'aria-label': 'the unit square with the region u1 + u2 at most t', style: 'max-width:340px' });
    svg.append(sv('rect', { x: X(0), y: Y(1), width: S, height: S, style: 'fill:var(--bg-sunk);stroke:var(--ink-3);stroke-width:1.2' }));
    const tv = t.num(), poly = [];
    if (tv > 0) {
      if (tv <= 1) poly.push([0, 0], [tv, 0], [0, tv]);
      else if (tv < 2) poly.push([0, 0], [1, 0], [1, tv - 1], [tv - 1, 1], [0, 1]);
      else poly.push([0, 0], [1, 0], [1, 1], [0, 1]);
      svg.append(sv('polygon', { points: poly.map(([u, v]) => X(u).toFixed(1) + ',' + Y(v).toFixed(1)).join(' '), style: 'fill:color-mix(in srgb, var(--pick) 30%, transparent);stroke:var(--pick);stroke-width:1.5' }));
    }
    if (N <= 20) for (let i = 1; i <= N; i++) for (let j = 1; j <= N; j++) svg.append(sv('circle', { cx: X(i / N).toFixed(1), cy: Y(j / N).toFixed(1), r: N <= 10 ? 3 : 2, style: 'fill:' + ((i + j) / N <= tv + 1e-12 ? 'var(--pick)' : 'var(--ink-4)') }));
    [[0, '0'], [0.5, '½'], [1, '1']].forEach(([u, l]) => svg.append(sv('text', { x: X(u), y: Y(0) + 16, 'text-anchor': 'middle', class: 'tick' }, l), sv('text', { x: X(0) - 6, y: Y(u) + 4, 'text-anchor': 'end', class: 'tick' }, l)));
    svg.append(sv('text', { x: X(1), y: Y(0) + 30, 'text-anchor': 'end', class: 'axis' }, 'u₁'), sv('text', { x: X(0) + 4, y: Y(1) + 12, class: 'axis' }, 'u₂'));
    return h('div', { class: 'lk-chart-wrap' }, svg);
  }
  /** pairs (i, j), 1 ≤ i, j ≤ N, with i + j ≤ m */
  const pairsUpTo = (N, m) => { let c = 0; for (let i = 1; i <= N; i++) c += Math.max(0, Math.min(N, m - i)); return c; };
  // ?N=10&a=1/4&b=3/5&t=1/2   N faces (2–1000), face k reads k/N; 0 ≤ a < b ≤ 1 for P(a < U ≤ b); 0 ≤ t ≤ 2 for P(U1 + U2 ≤ t)
  function continuous(el, query, ctx) {
    const s = K.state(ctx, { N: 10, a: '1/4', b: '3/5', t: '1/2' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    const go = again(continuous, el, ctx, s);
    controls.append(
      K.p('Take a fair die with $N$ faces and read face $k$ as the number $k/N$. With more and more faces these numbers fill the whole interval from 0 to 1: an "endless die" $U$ that can show any number in $[0, 1]$.'),
      K.int({ label: 'Faces $N$', value: clampInt(s.v.N, 2, 1000, 10), min: 2, max: 1000, onChange: v => s.set({ N: v }) }),
      quick('Jump to', [['$N = 6$', { N: 6 }], ['$10$', { N: 10 }], ['$100$', { N: 100 }], ['$1000$', { N: 1000 }]], go),
      row2(K.prob({ label: 'From $a$', value: s.v.a, min: 0, max: 1, presets: ['0', '1/4', '1/3'], onChange: v => s.set({ a: v }) }),
        K.prob({ label: 'to $b$', value: s.v.b, min: 0, max: 1, presets: ['1/2', '3/5', '1'], onChange: v => s.set({ b: v }) })),
      K.prob({ label: 'Two endless dice: $t$ in $P(U_1 + U_2 \\le t)$', value: s.v.t, min: 0, max: 2, presets: ['1/2', '1', '3/2'], onChange: v => s.set({ t: v }) }),
      tries([
        ['Lecture 4.3: uniform on $1, \\dots, 100$ and $P(3.2 < X \\le 10.6)$', { N: 100, a: '0.032', b: '0.106', t: '1/2' }],
        ['Lecture 4.3: $P(X \\le 17.3)$', { N: 100, a: '0', b: '0.173', t: '1/2' }],
        ['$t = 3/2$: the square minus a corner', { t: '3/2' }],
      ], go));
    function draw() {
      out.innerHTML = '';
      let a, b, t;
      try { a = F.parse(s.v.a); b = F.parse(s.v.b); t = F.parse(s.v.t); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
      if (a.cmp(0) < 0 || b.cmp(1) > 0 || a.cmp(b) >= 0) { out.append(K.note('Choose $0 \\le a < b \\le 1$.', 'warn')); return; }
      if (t.cmp(0) < 0 || t.cmp(2) > 0) { out.append(K.note('Choose $t$ from 0 to 2: $U_1 + U_2$ is always between 0 and 2.', 'warn')); return; }
      const N = clampInt(s.v.N, 2, 1000, 10);
      const aN = a.mul(N), bN = b.mul(N), kLo = Number(floorF(aN).n) + 1, kHi = Number(floorF(bN).n), count = Math.max(0, kHi - kLo + 1);
      const pDisc = F(count, N), pCont = b.sub(a);
      const tv = t.num(), corner = F(2).sub(t), pT = tv <= 0 ? F(0) : tv <= 1 ? t.mul(t).div(2) : tv < 2 ? F(1).sub(corner.mul(corner).div(2)) : F(1);
      out.append(answer('One endless die, then two', al('P(' + T(a) + ' < U \\le ' + T(b) + ') &= ' + TX(pCont), 'P(U_1 + U_2 \\le ' + T(t) + ') &= ' + TX(pT)),
        'With ' + N + ' faces the first chance is $' + TX(pDisc) + '$ instead: close, and closer as $N$ grows.'));

      const spikes = [];
      for (let k = 1; k <= N; k++) spikes.push({ x: k / N, y: 1 / N, w: Math.min(0.6 / N, 0.012), fill: k >= kLo && k <= kHi ? BARHI : BAR });
      out.append(K.card('A die with $N = ' + N + '$ faces, read as $k/N$',
        K.p('Each spike is one face: it stands at $k/N$ and its height is its chance $\\frac{1}{' + N + '}$. Purple spikes are inside $(a, b]$. The scale stays fixed: with more faces the spikes get shorter, and with 1000 faces they almost vanish.'),
        chart({ x0: 0, x1: 1.02, y1: 0.5, yt: [0, 0.1, 0.2, 0.3, 0.4, 0.5], xt: [0, 0.25, 0.5, 0.75, 1], xName: 'u = k/N', bars: spikes, H: 190 })));
      const blocks = N <= 200 ? Array.from({ length: N }, (_, i) => ({ x: (i + 0.5) / N, y: 1, w: 1 / N * 0.98, fill: i + 1 >= kLo && i + 1 <= kHi ? BARHI : BAR })) : [];
      out.append(K.card('Chance per unit length: the density',
        flowSteps([
          { text: 'Spread each face\'s chance over its own little piece of the line, from $\\frac{k-1}{N}$ to $\\frac{k}{N}$. Each piece has length $\\frac{1}{N}$. Chance divided by length is the height:', tex: '\\frac{1/' + N + '}{1/' + N + '} = 1' },
          { text: 'So the pieces make a flat block of height 1, for every $N$. While the spikes shrink to nothing, the block stays: the endless die has the <b>density</b> (lectures 4.4–4.5)', tex: 'f_U(u) = 1 \\quad \\text{for } 0 \\le u \\le 1, \\qquad F_U(u) = P(U \\le u) = u' },
        ]),
        chart({ x0: 0, x1: 1.02, y1: 1.25, yt: [0, 0.5, 1], xt: [0, 0.25, 0.5, 0.75, 1], xName: 'u', bars: blocks, H: 170,
          areas: N > 200 ? [{ pts: [[0, 0], [1, 0], [1, 1], [0, 1]], style: 'fill:' + BAR }, { pts: [[a.num(), 0], [b.num(), 0], [b.num(), 1], [a.num(), 1]], style: 'fill:' + BARHI }] : [] })));
      const tbl = [10, 100, 1000, 10000].concat(N).filter((v, i, arr) => arr.indexOf(v) === i).sort((x, y) => x - y).map(M => {
        const c = Math.max(0, Number(floorF(b.mul(M)).n) - Number(floorF(a.mul(M)).n)), pd = F(c, M);
        return ['$' + M + '$' + (M === N ? ' (yours)' : ''), '$\\frac{' + c + '}{' + M + '}' + (pd.exactDecimal(4) ? ' = ' : ' \\approx ') + dx(pd.num()) + '$', '$' + dx(Math.abs(pd.num() - pCont.num())) + '$'];
      });
      out.append(K.card('$P(a < U \\le b)$ two ways',
        flowSteps([
          { text: 'With ' + N + ' faces: count the faces $k$ with $a < \\frac{k}{N} \\le b$, that is $aN < k \\le bN$:', tex: al('aN &= ' + T(a) + ' \\cdot ' + N + ' = ' + T(aN), 'bN &= ' + T(b) + ' \\cdot ' + N + ' = ' + T(bN), 'k &= ' + (count ? kLo + ', \\dots, ' + kHi + '\\quad (' + count + '\\text{ faces})' : '\\text{none}')) },
          { text: 'Each face has chance $\\frac{1}{' + N + '}$:', tex: 'P(a < U_N \\le b) = \\frac{' + count + '}{' + N + '} = ' + TX(pDisc) },
          { text: 'The endless die: the chance is the area under the density from $a$ to $b$, a rectangle of width $b - a$ and height 1. With the CDF it is $F_U(b) - F_U(a)$:', tex: al('P(a < U \\le b) &= (b - a) \\cdot 1', '&= ' + T(b) + ' - ' + T(a) + ' = ' + TX(pCont)) },
          { text: 'The two answers differ by less than $\\frac{1}{N}$ (one face at most), so more faces bring them together. Lecture 4.3 makes the same comparison for a uniform die on $1, \\dots, 100$ and the line $F(x) = x/100$: $P(3.2 < X \\le 10.6)$ is exactly $\\frac{7}{100}$, the line gives $\\frac{7.4}{100}$.' },
        ]),
        K.table(['faces $N$', '$P(a < U_N \\le b)$', 'gap to $b - a$'], tbl, { compact: true, hi: new Set([tbl.findIndex(r => r[0].includes('yours'))]) })));

      const st = [{ text: 'Roll two endless dice. The point $(U_1, U_2)$ lands anywhere in the unit square, every spot equally likely: the joint density is 1 on the square (lecture 6.1 pictures a block of height 1 on it). So the chance of a region is its area.' }];
      if (tv <= 0) st.push({ text: 'With $t = 0$ the region is a single point, with area 0.', tex: 'P(U_1 + U_2 \\le 0) = 0' });
      else if (tv <= 1) st.push(
        { text: 'The line $u_1 + u_2 = ' + T(t) + '$ cuts off the bottom-left corner: a right triangle with both legs $t = ' + T(t) + '$.' },
        { text: 'Area of a triangle = $\\frac12$ × base × height:', tex: al('P(U_1 + U_2 \\le ' + T(t) + ') &= \\tfrac12 \\cdot ' + T(t) + ' \\cdot ' + T(t), '&= \\tfrac{t^2}{2} = ' + TX(pT)) });
      else if (tv < 2) st.push(
        { text: 'Now the line $u_1 + u_2 = ' + T(t) + '$ cuts off the top-right corner instead. The region is the whole square (area 1) minus that corner, where $u_1 + u_2 > ' + T(t) + '$.' },
        { text: 'The corner is a right triangle with both legs $2 - t = ' + T(corner) + '$:', tex: '\\tfrac12 (2 - t)^2 = \\tfrac12 \\cdot ' + sq(corner) + ' = ' + T(corner.mul(corner).div(2)) },
        { text: 'Square minus corner:', tex: 'P(U_1 + U_2 \\le ' + T(t) + ') = 1 - ' + T(corner.mul(corner).div(2)) + ' = ' + TX(pT) });
      else st.push({ text: 'With $t = 2$ the whole square is inside.', tex: 'P(U_1 + U_2 \\le 2) = 1' });
      const m = Number(floorF(t.mul(N)).n), cN = pairsUpTo(N, m);
      st.push({ text: 'Check with two ' + N + '-faced dice: count the pairs $(i, j)$ with $\\frac{i + j}{N} \\le t$, that is $i + j \\le ' + m + '$, out of $N^2$' + (N <= 20 ? ' (the purple dots)' : '') + ':', tex: '\\frac{' + cN + '}{' + N + '^2} = ' + TX(F(cN, N * N)) + ' \\quad\\text{vs the area } ' + TX(pT) });
      out.append(K.card('Two endless dice: $P(U_1 + U_2 \\le t)$', squarePic(t, N), flowSteps(st),
        K.table(['faces $N$', 'share of the $N^2$ pairs with $i + j \\le tN$'], [10, 100, 1000].map(M => { const mm = Number(floorF(t.mul(M)).n), cc = pairsUpTo(M, mm), sh = F(cc, M * M); return ['$' + M + '$', '$\\frac{' + cc + '}{' + M + '^2}' + (sh.exactDecimal(4) ? ' = ' : ' \\approx ') + dx(sh.num()) + '$']; }), { compact: true }),
        K.p('As $N$ grows the share of dots in the region becomes its area, $' + TX(pT) + '$.')));
    }
    draw();
  }

  /* ================================================================== lln: the law of large numbers */
  // ?f=6&w=&n=1000&seed=1&d=1/2   one die (f faces 2–100, weights w); n rolls (1–100000); seed picks the rolls; d = δ
  function lln(el, query, ctx) {
    const s = K.state(ctx, { f: 6, w: '', n: 1000, seed: 1, d: '1/2' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    const go = again(lln, el, ctx, s);
    controls.append(
      K.p('Roll one die again and again. After each roll, take the average of all the rolls so far. The <b>law of large numbers</b> says this running average settles at the mean of the die: $\\frac{f+1}{2}$ for a fair die with faces $1$ to $f$.'),
      dieControls({ title: 'The die', f: clampInt(s.v.f, 2, 100, 6), maxF: 100, w: s.v.w, onChange: (f, w) => s.set({ f, w }) }),
      K.int({ label: 'Number of rolls $n$', value: clampInt(s.v.n, 1, 100000, 1000), min: 1, max: 100000, onChange: v => s.set({ n: v }) }),
      quick('Jump to', [['$n = 10$', { n: 10 }], ['$100$', { n: 100 }], ['$1000$', { n: 1000 }], ['$100\\,000$', { n: 100000 }]], go),
      K.prob({ label: 'Distance $\\delta$ for the weak law', value: s.v.d, min: 0, max: 100, presets: ['1/2', '1/4', '0.1'], onChange: v => s.set({ d: v }) }),
      rollBtn(s, 'Roll again (new rolls)'),
      tries([
        ['Lecture 3.3 idea: 1000 rolls of a fair die', { f: 6, w: '', n: 1000, seed: 1 }],
        ['A 2-faced die (a coin with 1 and 2)', { f: 2, w: '', n: 1000, seed: 1 }],
        ['Loaded: 6 three times as likely', { f: 6, w: '1,1,1,1,1,3', n: 1000, seed: 1 }],
        ['A 20-sided die, 10 000 rolls', { f: 20, w: '', n: 10000, seed: 1 }],
      ], go));
    function draw() {
      out.innerHTML = '';
      let d, dl;
      try { d = makeDie(clampInt(s.v.f, 2, 100, 6), s.v.w); dl = F.parse(s.v.d); if (dl.cmp(0) <= 0) throw new Error('Choose a distance $\\delta$ above 0.'); }
      catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const n = clampInt(s.v.n, 1, 100000, 1000), seed = clampInt(s.v.seed, 1, 1e9, 1);
      const roll = roller(d, K.rng(seed * 7919 + d.f * 31 + 7)), rolls = new Int32Array(n), avg = new Float64Array(n);
      let sum = 0;
      for (let k = 0; k < n; k++) { rolls[k] = roll(); sum += rolls[k]; avg[k] = sum / (k + 1); }
      const { mu, v: v1, st: oneSt } = dieMoments(d), muN = mu.num(), dN = dl.num();
      let lastOut = -1;
      for (let k = 0; k < n; k++) if (Math.abs(avg[k] - muN) >= dN) lastOut = k;
      out.append(answer('The average of ' + plural(n, 'roll') + ' (rolls set ' + seed + ')', al('\\bar X_{' + n + '} &= \\frac{' + sum + '}{' + n + '} \\approx ' + r4(sum / n, 4), '\\mu = E[X] &= ' + TX(mu)),
        'The average is ' + r4(Math.abs(sum / n - muN), 4) + ' away from the mean. Press "Roll again" for new rolls.'));
      const first = Array.from(rolls.slice(0, Math.min(10, n)));
      let run = 0;
      out.append(K.card('The first rolls, step by step',
        h('div', { class: 'lk-outcomes', html: first.map(v => K.die(v, d.f <= 6 && d.lo === 1 ? 6 : 0, 30)).join('') }),
        K.table(['roll $k$', 'value', 'sum so far', 'average $\\bar X_k$'], first.map((v, k) => { run += v; return ['$' + (k + 1) + '$', '$' + v + '$', '$' + run + '$', '$\\frac{' + run + '}{' + (k + 1) + '} ' + (Number.isInteger(run / (k + 1)) ? '= ' : '\\approx ') + r4(run / (k + 1), 3) + '$']; }), { compact: true }),
        K.p('The running average after $k$ rolls is (sum of the first $k$ rolls) ÷ $k$. Early on, one roll moves it a lot.')));
      const step = Math.max(1, Math.ceil(n / 700)), pts = [];
      for (let k = 0; k < n; k += step) pts.push([k + 1, avg[k]]);
      if (pts[pts.length - 1][0] !== n) pts.push([n, avg[n - 1]]);
      let lo = Math.min(muN - dN, ...pts.slice(Math.min(3, pts.length - 1)).map(p => p[1])), hi = Math.max(muN + dN, ...pts.slice(Math.min(3, pts.length - 1)).map(p => p[1]));
      lo = Math.max(lo, d.faces[0]); hi = Math.min(hi, d.faces[d.f - 1]);
      const pad = (hi - lo) * 0.08 || 0.5;
      out.append(K.card('The running average',
        K.p('The line is $\\bar X_k$ after each roll $k$. The dashed line is the mean $\\mu = ' + r4(muN, 3) + '$ and the shaded band is $\\mu \\pm \\delta = ' + r4(muN, 3) + ' \\pm ' + r4(dN, 3) + '$. ' + (lastOut < 0 ? 'The average stayed inside the band all the time.' : lastOut === n - 1 ? 'At the end the average is still outside the band: roll more.' : 'After roll ' + (lastOut + 1) + ' the average never left the band again.')),
        chart({ x0: 1, x1: Math.max(2, n), y0: lo - pad, y1: hi + pad, xt: ticksBetween(1, n, 4).filter(x => x >= 1), yt: ticksBetween(lo - pad, hi + pad, 4), xName: 'number of rolls k', H: 230,
          areas: [{ pts: [[1, muN - dN], [n, muN - dN], [n, muN + dN], [1, muN + dN]], style: 'fill:color-mix(in srgb, var(--good) 16%, transparent)' }],
          lines: [{ pts: pts.map(([x, y]) => [x, Math.max(lo - pad, Math.min(hi + pad, y))]), style: 'stroke:var(--accent);stroke-width:1.8;fill:none' }],
          rules: [{ y: muN, style: 'stroke:var(--good);stroke-width:1.5;stroke-dasharray:5 3' }] })));
      const vbar = v1.div(n), bound = v1.div(dl.mul(dl).mul(n));
      out.append(K.card('Why it settles (lecture 7.4)', flowSteps(oneSt.concat([
        { text: 'The average of $n$ independent rolls has the same mean, and a variance $n$ times smaller:', tex: al('E[\\bar X_n] &= \\mu = ' + T(mu), '\\Var(\\bar X_n) &= \\frac{\\sigma^2}{n} = ' + T(v1) + ' \\div ' + n, '&= ' + TX(vbar)) },
        { text: 'Chebyshev\'s inequality on the average gives the <b>weak law of large numbers</b>:', tex: al('P\\big(|\\bar X_n - \\mu| \\ge \\delta\\big) &\\le \\frac{\\sigma^2}{n\\,\\delta^2}', '&= ' + T(v1) + ' \\div \\big(' + n + ' \\cdot ' + sq(dl) + '\\big)', '&= ' + TX(bound)) },
        { text: bound.cmp(1) >= 0 ? 'With only ' + n + ' rolls this limit is 1 or more, so it promises nothing yet. It shrinks like $\\frac1n$: more rolls make it small.' : 'So after ' + n + ' rolls the average is within ' + r4(dN, 3) + ' of ' + r4(muN, 3) + ' with chance at least $1 - ' + dx(bound.num()) + ' = ' + dx(1 - bound.num()) + '$. As $n$ grows the limit goes to 0: the average is almost sure to be close to $\\mu$.' },
      ]))));
      const R = Math.max(20, Math.min(400, Math.floor(1e6 / n))), sim = roller(d, K.rng(seed * 104729 + 13));
      let outside = 0;
      for (let r = 0; r < R; r++) { let t = 0; for (let k = 0; k < n; k++) t += sim(); if (Math.abs(t / n - muN) >= dN) outside++; }
      out.append(K.card('Many runs of ' + plural(n, 'roll'),
        K.p('The lab repeated the whole experiment ' + R + ' times. In ' + outside + ' of them (' + r4(100 * outside / R, 1) + '%) the final average was at least $\\delta = ' + r4(dN, 3) + '$ away from $\\mu$. The weak law promised at most ' + (bound.cmp(1) >= 0 ? '100%' : r4(100 * bound.num(), 2) + '%') + '. The true share is usually far below the promise: Chebyshev is a safe limit, not an estimate.')));
    }
    draw();
  }

  /* ================================================================== clt: the central limit theorem */
  // ?n=10&f=6&w=&a=30&b=40&cc=0   n dice (1–30); f faces (2–20) and w weights of each die; a ≤ S ≤ b the range asked
  // about; cc=1 uses the half-step (continuity) correction
  function clt(el, query, ctx) {
    const s = K.state(ctx, { n: 10, f: 6, w: '', a: 30, b: 40, cc: 0 }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    const go = again(clt, el, ctx, s);
    controls.append(
      K.p('Roll $n$ dice and add them: $S = X_1 + \\dots + X_n$ (their average is $\\bar X = S/n$). The <b>central limit theorem</b> says that for large $n$ the shape of $S$ is close to the normal (bell) curve, whatever the die looks like.'),
      K.int({ label: 'Number of dice $n$', value: clampInt(s.v.n, 1, 30, 10), min: 1, max: 30, onChange: v => s.set({ n: v }) }),
      dieControls({ title: 'Each die', f: clampInt(s.v.f, 2, 20, 6), w: s.v.w, onChange: (f, w) => s.set({ f, w }) }),
      row2(K.int({ label: 'From $a$', value: clampInt(s.v.a, 0, 600, 30), min: 0, max: 600, onChange: v => s.set({ a: v }) }),
        K.int({ label: 'to $b$', value: clampInt(s.v.b, 0, 600, 40), min: 0, max: 600, onChange: v => s.set({ b: v }) })),
      K.check({ label: 'Use the half-step (continuity) correction', value: !!Number(s.v.cc), onChange: v => s.set({ cc: v ? 1 : 0 }) }),
      tries([
        ['One die: flat, not a bell', { n: 1, f: 6, w: '', a: 3, b: 4, cc: 0 }],
        ['Lecture 2.8: two dice make a triangle', { n: 2, f: 6, w: '', a: 6, b: 8, cc: 0 }],
        ['10 dice', { n: 10, f: 6, w: '', a: 30, b: 40, cc: 0 }],
        ['30 dice', { n: 30, f: 6, w: '', a: 100, b: 110, cc: 0 }],
        ['30 lopsided dice: 1 and 6 five times as likely', { n: 30, f: 6, w: '5,1,1,1,1,5', a: 100, b: 110, cc: 0 }],
        ['30 two-faced dice (like coins)', { n: 30, f: 2, w: '', a: 42, b: 48, cc: 0 }],
      ], go));
    function draw() {
      out.innerHTML = '';
      let d;
      try { d = makeDie(clampInt(s.v.f, 2, 20, 6), s.v.w); } catch (e) { out.append(K.note(e.message, 'warn')); return; }
      const n = clampInt(s.v.n, 1, 30, 10), cc = !!Number(s.v.cc);
      let a = clampInt(s.v.a, 0, 600, 30), b = clampInt(s.v.b, 0, 600, 40);
      if (a > b) [a, b] = [b, a];
      const { mu: mu1, v: v1, st: oneSt } = dieMoments(d);
      if (v1.isZero()) { out.append(K.note('This die always shows the same number, so the total never varies: there is no spread for a bell curve.', 'warn')); return; }
      const cnt = sumCounts(d.w, n), Wn = d.W ** BigInt(n), smin = n * d.lo, smax = smin + cnt.length - 1;
      const mu = mu1.mul(n), v = v1.mul(n), sd = Math.sqrt(v.num()), muN = mu.num();
      const pEx = F(bsum(cnt, a - smin, b - smin), Wn);
      const h0 = cc ? 0.5 : 0, za = (a - h0 - muN) / sd, zb = (b + h0 - muN) / sd, pN = PHI(zb) - PHI(za);
      out.append(answer('$P(' + a + ' \\le S \\le ' + b + ')$ for the total of ' + plural(n, 'die', 'dice'), al('\\text{exact} &' + eqTX(pEx), '\\text{normal} &\\approx ' + r4(pN, 4)),
        'They differ by ' + r4(Math.abs(pEx.num() - pN), 4) + (cc ? ', with the half-step correction.' : '. Tick the half-step correction to bring them closer.')));
      const ps = cnt.map(x => Number(x) / Number(Wn)), hiIdx = [];
      for (let t = Math.max(a, smin); t <= Math.min(b, smax); t++) hiIdx.push(t - smin);
      const curve = [];
      for (let k = 0; k <= 160; k++) { const x = smin - 1 + (smax - smin + 2) * k / 160; curve.push([x, phi((x - muN) / sd) / sd]); }
      out.append(K.card('The exact distribution of $S$',
        flowSteps(oneSt.concat([
          { text: 'Add one die at a time. Each step is a convolution (lecture 2.9): a new total $s$ collects the old totals $s - x$, each times the chance of the new face $x$.', tex: al('P(S_{k+1} = s) &= \\sum_x P(S_k = s - x)', '&\\qquad \\times P(X = x)') },
          { text: 'Doing this ' + plural(n - 1, 'time') + ' gives the exact PMF of $S$' + (d.fair ? ': (number of ways to make $s$) ÷ $' + d.f + '^{' + n + '}$' : '') + '. The means and the variances add up:', tex: al('E[S] &= n\\mu = ' + TX(mu), '\\Var(S) &= n\\sigma^2 = ' + TX(v), '\\SD(S) &= \\sqrt{n}\\,\\sigma \\approx ' + r4(sd)) },
        ])),
        K.p('Purple bars: $' + a + ' \\le S \\le ' + b + '$. The orange curve is the normal density with the same mean and SD.'),
        barChart({ xs: cnt.map((_, i) => smin + i), ys: ps, hi: hiIdx, top: Math.max(...curve.map(p => p[1])), xName: 's (total of ' + plural(n, 'die', 'dice') + ')', lines: [{ pts: curve, style: 'stroke:var(--y);stroke-width:2;fill:none' }] })));
      const zs = cnt.map((_, i) => (smin + i - muN) / sd), hs = ps.map(p => p * sd), zc = [];
      for (let k = 0; k <= 160; k++) { const z = -4 + 8 * k / 160; zc.push([z, phi(z)]); }
      let gap = 0;
      zs.forEach((z, i) => { gap = Math.max(gap, Math.abs(hs[i] - phi(z))); });
      const top = Math.max(0.42, ...hs), yt = niceTicks(top, 5);
      out.append(K.card('Standardise and compare with the bell curve',
        flowSteps([
          { text: 'Move the centre to 0 and measure in standard deviations (lectures 7.6 and 8.2):', tex: 'Z = \\frac{S - n\\mu}{\\sqrt{n}\\,\\sigma} = \\frac{S - ' + T(mu) + '}{' + r4(sd) + '}' },
          { text: 'Each bar is now $1/\\SD(S)$ wide, so its height becomes $P(S = s) \\times \\SD(S)$, keeping its area. The central limit theorem says the bars approach the standard normal density:', tex: '\\phi(z) = \\frac{1}{\\sqrt{2\\pi}}\\,e^{-z^2/2}' },
          { text: 'The largest gap between a bar top and the curve is ' + r4(gap, 4) + '. Try $n = 1, 2, 10, 30$: the gap shrinks.' },
        ]),
        chart({ x0: -4.2, x1: 4.2, y1: yt[yt.length - 1], yt, xt: [-4, -3, -2, -1, 0, 1, 2, 3, 4], xName: 'z = (s − nμ) / (√n σ)', H: 210,
          bars: zs.map((z, i) => ({ x: z, y: hs[i], w: 0.85 / sd, hi: hiIdx.includes(i) })).filter(bb => bb.x > -4.3 && bb.x < 4.3),
          lines: [{ pts: zc, style: 'stroke:var(--y);stroke-width:2;fill:none' }] })));
      const exTerms = hiIdx.length <= 5 ? hiIdx.map(i => T(F(cnt[i], Wn))) : [];
      const st = [
        { text: 'Exact: add the chances of the totals from ' + a + ' to ' + b + ' (the purple bars).', tex: hiIdx.length ? sumLines('P(' + a + ' \\le S \\le ' + b + ')', exTerms, pEx, { per: 2, def: '\\sum_{s=' + Math.max(a, smin) + '}^{' + Math.min(b, smax) + '} P(S = s)' }) : 'P(' + a + ' \\le S \\le ' + b + ') = 0' },
        { text: 'Normal: standardise both ends' + (cc ? ', after widening the range by ½ on each side' : '') + ':', tex: al('z_a &= \\frac{' + (cc ? a + ' - \\frac12' : a) + ' - ' + r4(muN) + '}{' + r4(sd) + '} \\approx ' + r4(za), 'z_b &= \\frac{' + (cc ? b + ' + \\frac12' : b) + ' - ' + r4(muN) + '}{' + r4(sd) + '} \\approx ' + r4(zb)) },
        { text: 'Then use the standard normal CDF $\\Phi$ (a table or a calculator):', tex: al('P &\\approx \\Phi(z_b) - \\Phi(z_a)', '&= ' + r4(PHI(zb), 4) + ' - ' + r4(PHI(za), 4) + ' = ' + r4(pN, 4)) },
        cc ? { text: 'Why the half-step: $S$ takes whole numbers, and on the bell curve the bar for $s$ covers $s - \\frac12$ to $s + \\frac12$. So the range becomes $' + (a - 0.5) + '$ to $' + (b + 0.5) + '$. (The lectures use the plain version; this is a common refinement.)' }
          : { text: 'This plain version is the one in lecture 8.2. It cuts the two end bars in half, so it usually comes out too low; the half-step correction (the tick box) fixes most of that.' },
        { text: 'For the average $\\bar X = S/n$ the same event reads $' + r4(a / n, 3) + ' \\le \\bar X \\le ' + r4(b / n, 3) + '$, with the same chance.' },
      ];
      const within = [1, 2, 5, 10, 20, 30].map(m => {
        const c2 = sumCounts(d.w, m), W2 = d.W ** BigInt(m), lo2 = m * d.lo, mu2 = mu1.num() * m, sd2 = Math.sqrt(v1.num() * m);
        let tot = 0n;
        c2.forEach((x, i) => { if (Math.abs(lo2 + i - mu2) <= sd2 + 1e-9) tot += x; });
        return ['$' + m + '$' + (m === n ? ' (yours)' : ''), '$' + r4(Number(tot) / Number(W2), 4) + '$', '$0.6827$'];
      });
      out.append(K.card('Exact versus normal', flowSteps(st),
        K.p('Another view: the chance that $S$ lands within one SD of its mean, $|S - n\\mu| \\le \\sqrt{n}\\,\\sigma$, for more and more dice. The normal curve says 0.6827 for every $n$.'),
        K.table(['dice $n$', 'exact', 'normal'], within, { compact: true })));
    }
    draw();
  }

  /* ================================================================== estimate: how many faces? */
  // ?mode=roll&N=12&n=10&seed=1   a hidden fair die with N faces (2–1000) rolled n times (1–1000); seed picks the rolls
  // ?mode=type&r=1,1,8           or your own rolls (whole numbers from 1 up)
  function estimate(el, query, ctx) {
    const s = K.state(ctx, { mode: 'roll', N: 12, n: 10, seed: 1, r: '' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    const go = again(estimate, el, ctx, s), typed = s.v.mode === 'type';
    controls.append(
      K.p('A fair die has $N$ faces, numbered $1$ to $N$, but nobody tells you $N$. You only see some rolls. Two ways to guess $N$: the <b>method of moments</b> and <b>maximum likelihood</b> (lecture 9.8).'),
      K.seg({ label: 'The rolls', options: [['roll', 'Roll a hidden die'], ['type', 'Type my rolls']], value: typed ? 'type' : 'roll', onChange: v => go({ mode: v }) }),
      ...(typed ? [K.text({ label: 'Your rolls (whole numbers from 1 up)', value: s.v.r, placeholder: '3, 7, 2, 11', onChange: v => s.set({ r: v }) })]
        : [K.int({ label: 'The hidden number of faces $N$', value: clampInt(s.v.N, 2, 1000, 12), min: 2, max: 1000, onChange: v => s.set({ N: v }) }),
          K.int({ label: 'Number of rolls $n$', value: clampInt(s.v.n, 1, 1000, 10), min: 1, max: 1000, onChange: v => s.set({ n: v }) }),
          rollBtn(s)]),
      tries([
        ['Lecture 9.8 idea: the rolls $1, 1, 8$', { mode: 'type', r: '1, 1, 8' }],
        ['Hidden $N = 12$, 10 rolls', { mode: 'roll', N: 12, n: 10, seed: 1 }],
        ['Only 3 rolls of $N = 20$', { mode: 'roll', N: 20, n: 3, seed: 1 }],
        ['200 rolls of $N = 50$', { mode: 'roll', N: 50, n: 200, seed: 1 }],
      ], go));
    function draw() {
      out.innerHTML = '';
      const warn = m => out.append(K.note(m, 'warn'));
      let rolls, N = null;
      if (s.v.mode === 'type') {
        const parts = String(s.v.r || '').split(/[\s,;]+/).filter(Boolean);
        if (!parts.length) return warn('Type your rolls, like $3, 7, 2, 11$.');
        if (parts.length > 1000) return warn('At most 1000 rolls, please.');
        rolls = [];
        for (const p of parts) { if (!/^\d+$/.test(p) || +p < 1 || +p > 1e6) return warn('“' + p + '” is not a roll: use whole numbers from 1 up.'); rolls.push(+p); }
      } else {
        N = clampInt(s.v.N, 2, 1000, 12);
        const n0 = clampInt(s.v.n, 1, 1000, 10), rnd = K.rng(clampInt(s.v.seed, 1, 1e9, 1) * 104729 + N * 31 + 17);
        rolls = Array.from({ length: n0 }, () => 1 + Math.floor(rnd() * N));
      }
      const n = rolls.length, total = rolls.reduce((x, y) => x + y, 0), M = Math.max(...rolls), mean = F(total, n), mom = mean.mul(2).sub(1);
      out.append(answer('Two guesses for $N$ from ' + plural(n, 'roll'), al('\\hat N_{\\text{MoM}} &= 2\\bar x - 1 ' + eqTX(mom), '\\hat N_{\\text{ML}} &= \\max(x_1, \\dots, x_n) = ' + M), N ? 'The hidden die had $N = ' + N + '$ faces.' : null));
      out.append(K.card('Your rolls',
        h('div', { class: 'lk-outcomes' }, rolls.slice(0, 60).map(v => h('span', { class: 'lk-outcome' + (v === M ? ' hi' : ''), style: 'min-width:30px;justify-content:center', text: String(v) }))),
        n > 60 ? K.p('… and ' + (n - 60) + ' more.') : null,
        flowSteps([{ text: 'Their mean: add them up and divide by how many there are.', tex: '\\bar x = ' + (mean.n === BigInt(total) && mean.d === BigInt(n) ? TX(mean) : '\\frac{' + total + '}{' + n + '} ' + eqTX(mean)) }, { text: 'The largest roll (outlined) is $' + M + '$.' }])));
      const st = [
        { text: 'For a fair die with faces 1 to $N$ each face has chance $\\frac1N$, so its mean is the middle face:', tex: al('E[X] &= \\frac{1 + 2 + \\dots + N}{N}', '&= \\frac{N(N+1)/2}{N} = \\frac{N+1}{2}') },
        { text: 'The method of moments makes the die\'s mean equal to the mean of the rolls (lecture 9.5):', tex: '\\frac{N + 1}{2} = \\bar x = ' + T(mean) },
        { text: 'Solve for $N$: multiply by 2, then subtract 1.', tex: al('\\hat N_{\\text{MoM}} &= 2\\bar x - 1', '&= 2 \\cdot ' + TP(mean) + ' - 1 ' + eqTX(mom)) },
        mom.cmp(M) < 0 ? { text: '<b>But</b> a ' + M + ' was rolled, so the die has at least ' + M + ' faces: this guess is impossible. Lecture 9.8 shows the same flaw for a uniform on $[0, \\theta]$: the samples $\\tfrac12, \\tfrac12, 8$ give $\\hat\\theta = 2\\bar x = 6$, below the 8 that was seen.' }
          : { text: 'Why it makes sense: rolls of a fair die sit around the middle face $\\frac{N+1}{2}$ on average, so twice the average, minus 1, points at $N$. The guess need not be a whole number.' },
      ];
      out.append(K.card('Method of moments', flowSteps(st)));
      const xs = [], ys = [];
      for (let g = Math.max(1, M - 3); g <= M + 12; g++) { xs.push(g); ys.push(g < M ? 0 : Math.pow(M / g, n)); }
      out.append(K.card('Maximum likelihood', flowSteps([
        { text: 'Take a guess $N$. One roll $x$ has chance $\\frac1N$ if $x \\le N$, and chance 0 if $x > N$ (that face does not exist).' },
        { text: 'The rolls are independent, so the chance of all ' + n + ' rolls together, the <b>likelihood</b>, is the product (lecture 9.6):', tex: 'L(N) = \\begin{cases} \\left(\\dfrac{1}{N}\\right)^{' + n + '} & \\text{if } N \\ge ' + M + ' \\\\[4pt] 0 & \\text{if } N < ' + M + ' \\end{cases}' },
        { text: 'Below ' + M + ' the likelihood is 0. From ' + M + ' up it shrinks as $N$ grows (each roll becomes less likely). So it is largest at the smallest allowed $N$:', tex: '\\hat N_{\\text{ML}} = \\max(x_1, \\dots, x_n) = ' + M },
      ]),
        K.p('The bars show $L(N) \\div L(' + M + ') = (' + M + '/N)^{' + n + '}$ for guesses near ' + M + '.'),
        barChart({ xs, ys, hi: [xs.indexOf(M)], xName: 'guess N' })));
      const bst = [{ text: 'In one line: the largest roll is never above $N$ and is often below it, so on average the ML guess is too small (biased low), while the method of moments has no bias:', tex: al('E[\\hat N_{\\text{ML}}] &= N - \\sum_{j=1}^{N-1} \\left(\\tfrac{j}{N}\\right)^n < N', 'E[\\hat N_{\\text{MoM}}] &= 2 \\cdot \\tfrac{N+1}{2} - 1 = N') }];
      if (N) { let sj = 0; for (let j = 1; j < N; j++) sj += Math.pow(j / N, n); bst.push({ text: 'For your hidden die ($N = ' + N + '$, ' + plural(n, 'roll') + '):', tex: 'E[\\hat N_{\\text{ML}}] \\approx ' + r4(N - sj, 3) + ', \\quad \\text{a bias of } ' + r4(-sj, 3) }); }
      out.append(K.card('Bias of the ML guess', flowSteps(bst)));
    }
    draw();
  }

  /* ================================================================== chi-square: is the die fair? */
  /** the chi-square density with df degrees of freedom: the area right of T shaded, the critical value c marked */
  function chi2Pic(df, Tv, c) {
    const xmax = Math.max(c * 1.35, Tv * 1.15, df + 4 * Math.sqrt(2 * df)), pts = [];
    for (let k = 0; k <= 200; k++) { const x = xmax * k / 200; pts.push([x, chi2pdf(x, df)]); }
    const peak = Math.max(...pts.slice(df <= 2 ? 4 : 0).map(p => p[1])), yt = niceTicks(Math.min(0.6, peak) * 1.08, 3), y1 = yt[yt.length - 1];
    const cl = ([x, y]) => [x, Math.min(y, y1)], tail = pts.filter(p => p[0] >= Tv);
    return chart({ x0: 0, x1: xmax, y1, yt, xt: ticksBetween(0, xmax, 5), xName: 'value of T', H: 200,
      areas: tail.length ? [{ pts: [[Tv, 0], cl([Tv, chi2pdf(Tv, df)])].concat(tail.map(cl), [[xmax, 0]]), style: 'fill:color-mix(in srgb, var(--pick) 35%, transparent)' }] : [],
      lines: [{ pts: pts.map(cl), style: 'stroke:var(--accent);stroke-width:2;fill:none' }],
      rules: [{ x: c, label: 'c', style: 'stroke:var(--bad);stroke-width:1.5;stroke-dasharray:5 3' }, { x: Tv, label: 'T', style: 'stroke:var(--pick);stroke-width:2' }] });
  }
  // ?mode=sim&f=6&w=1,1,1,1,1,2&n=120&seed=1&alpha=0.05   roll a die with true weights w (f faces 2–20) n times (12–100000);
  // with no f and no w in the link the die is 1,1,1,1,1,2 (loaded); with f but no w it is fair
  // ?mode=type&c=18,22,16,25,19,20&alpha=0.05             or type the observed counts; alpha is 0.1, 0.05 or 0.01
  function chiSquare(el, query, ctx) {
    // the default die is loaded (6 twice as likely); a link that sets the faces but no weights means a fair die
    const wDefault = query && query.f != null && query.f !== '' ? '' : '1,1,1,1,1,2';
    const s = K.state(ctx, { mode: 'sim', f: 6, w: wDefault, n: 120, seed: 1, c: '', alpha: '0.05' }, query, draw);
    const { controls, out } = K.layout(el);
    contain(out);
    const go = again(chiSquare, el, ctx, s), typed = s.v.mode === 'type';
    const alphaOf = v => (['0.1', '0.05', '0.01'].includes(String(v)) ? String(v) : '0.05');
    controls.append(
      K.p('Is the die fair? Roll it many times and count each face. A fair die gives about the same count for every face. The <b>chi-square test</b> measures how far the counts are from that, and how surprising such a gap would be for a fair die (lecture 12.9).'),
      K.seg({ label: 'The counts', options: [['sim', 'Simulate rolls'], ['type', 'Type counts']], value: typed ? 'type' : 'sim', onChange: v => go({ mode: v }) }),
      ...(typed ? [K.text({ label: 'Observed counts, one per face', value: s.v.c, placeholder: '18, 22, 16, 25, 19, 20', onChange: v => s.set({ c: v }) })]
        : [dieControls({ title: 'The die you roll (its true weights)', f: clampInt(s.v.f, 2, 20, 6), w: s.v.w, help: 'The test never sees these weights, only the counts. Leave them empty for a truly fair die.', onChange: (f, w) => s.set({ f, w }) }),
          K.int({ label: 'Number of rolls $n$', value: clampInt(s.v.n, 12, 100000, 120), min: 12, max: 100000, onChange: v => s.set({ n: v }) }),
          rollBtn(s)]),
      K.select({ label: 'Significance level $\\alpha$', options: [['0.1', '0.10'], ['0.05', '0.05'], ['0.01', '0.01']], value: alphaOf(s.v.alpha), onChange: v => s.set({ alpha: v }) }),
      tries([
        ['A fair die, 120 rolls', { mode: 'sim', f: 6, w: '', n: 120, seed: 1 }],
        ['6 twice as likely, 120 rolls', { mode: 'sim', f: 6, w: '1,1,1,1,1,2', n: 120, seed: 1 }],
        ['Slightly loaded, only 60 rolls', { mode: 'sim', f: 6, w: '4,4,4,4,4,5', n: 60, seed: 1 }],
        ['Typed counts $18, 22, 16, 25, 19, 20$', { mode: 'type', c: '18, 22, 16, 25, 19, 20' }],
      ], go));
    function draw() {
      out.innerHTML = '';
      const warn = m => out.append(K.note(m, 'warn'));
      let Y, die = null;
      if (s.v.mode === 'type') {
        const parts = String(s.v.c || '').split(/[\s,;]+/).filter(Boolean);
        if (parts.length < 2) return warn('Type at least two counts, one per face, like $18, 22, 16, 25, 19, 20$.');
        if (parts.length > 50) return warn('At most 50 faces, please.');
        Y = [];
        for (const p of parts) { if (!/^\d+$/.test(p) || +p > 1e9) return warn('“' + p + '” is not a count: use whole numbers from 0 up.'); Y.push(+p); }
        if (!Y.some(y => y > 0)) return warn('The counts add up to 0: roll the die first.');
      } else {
        try { die = makeDie(clampInt(s.v.f, 2, 20, 6), s.v.w); } catch (e) { return warn(e.message); }
        const nr = clampInt(s.v.n, 12, 100000, 120), roll = roller(die, K.rng(clampInt(s.v.seed, 1, 1e9, 1) * 15485863 + die.f * 7 + 3));
        Y = new Array(die.f).fill(0);
        for (let i = 0; i < nr; i++) Y[roll() - 1]++;
      }
      const k = Y.length, n = Y.reduce((x, y) => x + y, 0), e = F(n, k), df = k - 1, alpha = Number(alphaOf(s.v.alpha));
      const terms = Y.map(y => F(y).sub(e).mul(F(y).sub(e)).div(e)), Tst = fsum(terms), Tv = Tst.num();
      const { cdf, terms: nTerms, first } = chi2cdf(Tv, df), p = Math.max(0, 1 - cdf), c = chi2crit(alpha, df), reject = Tv > c;
      const pTex = p < 1e-10 ? 'p &< 10^{-10}' : 'p &\\approx ' + pfmt(p);
      const cdfT = p < 5e-7 ? '0.99999\\ldots' : dx(cdf, 6);   // 6 decimals would round it to 1
      out.append(answer('Is the die fair? The chi-square test at $\\alpha = ' + alpha + '$', al('T &' + eqTX(Tst, 3), pTex),
        reject ? '$T$ is above the critical value $c \\approx ' + r4(c, 3) + '$ (so $p < \\alpha$): reject "the die is fair".' : '$T$ is not above the critical value $c \\approx ' + r4(c, 3) + '$ (so $p \\ge \\alpha$): no evidence against a fair die.'));
      out.append(K.card('Observed and expected counts',
        flowSteps([
          { text: 'The null hypothesis $H_0$: the die is fair. Then each of the ' + k + ' faces has chance $p_i = \\frac{1}{' + k + '}$, and in $n = ' + n + '$ rolls it is expected $np_i$ times:', tex: 'np_i = ' + n + ' \\cdot \\tfrac{1}{' + k + '} = ' + TX(e) },
          { text: 'The observed counts $Y_i$ are what really happened' + (die ? ' (the lab rolled your die ' + n + ' times)' : '') + '. Compare them face by face; the dashed line is the expected count.' },
        ]),
        barChart({ xs: Y.map((_, i) => i + 1), ys: Y, xName: 'face', rules: [{ y: e.num(), label: 'expected ' + r4(e.num(), 2), style: 'stroke:var(--bad);stroke-width:1.5;stroke-dasharray:5 3' }] }),
        K.table(['face $i$', '$Y_i$', '$np_i$', '$Y_i - np_i$', '$\\frac{(Y_i - np_i)^2}{np_i}$'], Y.map((y, i) => ['$' + (i + 1) + '$', '$' + y + '$', '$' + T(e) + '$', '$' + T(F(y).sub(e)) + '$', '$' + TX(terms[i], 3) + '$']), { compact: true })));
      out.append(K.card('The statistic $T$, term by term', flowSteps([
        { text: 'Square each gap, divide by the expected count, and add them (lecture 12.9). Big gaps make $T$ big; a perfect fit gives 0.', tex: 'T = \\sum_{i=1}^{' + k + '} \\frac{(Y_i - np_i)^2}{np_i}' },
        { text: 'Term by term:', tex: termLines(Y.map(y => '\\frac{(' + y + ' - ' + T(e) + ')^2}{' + T(e) + '}'), 2) },
        { text: 'Work out each term (the last column of the table) and add:', tex: sumLines('T', terms.map(x => T(x)), Tst, { per: 4 }) },
        { text: 'Degrees of freedom: the ' + k + ' counts must add up to $n = ' + n + '$, so once ' + df + ' of them are known the last one is fixed. Only ' + df + ' are free:', tex: 'k - 1 = ' + k + ' - 1 = ' + df },
      ])));
      const pst = [
        { text: 'If $H_0$ is true, $T$ follows (approximately) the chi-square distribution with ' + df + ' degrees of freedom, $\\chi^2_{' + df + '}$. The <b>p-value</b> is the chance of a $T$ at least as large as yours: the shaded area right of $T$.' },
        { text: 'There is no short formula for this area, so the lab adds up a series, term by term, until the terms are too small to matter. Each term is the one before times $\\frac{T/2}{' + df + '/2 + m}$:', tex: al('P(\\chi^2_{' + df + '} \\le T) &= e^{-T/2} \\sum_{m=0}^{\\infty} \\frac{(T/2)^{' + df + '/2 + m}}{\\Gamma(' + df + '/2 + m + 1)}', first[0] > 1e-12 ? '&= ' + first.slice(0, 2).map(x => pfmt(x)).join(' + ') : '&= \\dots', first[0] > 1e-12 ? '&\\quad + ' + pfmt(first[2] || 0) + ' + \\dots' : '&\\quad', '&\\approx ' + cdfT + '\\quad (' + nTerms + '\\text{ terms})') },
        { text: 'The p-value is the rest of the total area 1:', tex: 'p = 1 - ' + cdfT + (p < 1e-10 ? ' < 10^{-10}' : ' \\approx ' + pfmt(p)) },
      ];
      out.append(K.card('The p-value', chi2Pic(df, Tv, c), flowSteps(pst)));
      const minE = e.num();
      out.append(K.card('Decision at $\\alpha = ' + alpha + '$', flowSteps([
        { text: 'The critical value $c$ leaves area $\\alpha$ to its right. The lab finds it with the same series, halving an interval until the area is $' + alpha + '$:', tex: 'P(\\chi^2_{' + df + '} \\ge c) = ' + alpha + ' \\quad\\Rightarrow\\quad c \\approx ' + r4(c, 3) },
        { text: 'Reject $H_0$ when $T$ is above $c$, which is the same as $p < \\alpha$ (lecture 12.9):', tex: 'T \\approx ' + dx(Tv, 3) + (reject ? ' > ' : ' \\le ') + r4(c, 3) + ', \\qquad p ' + (reject ? '<' : '\\ge') + ' ' + alpha },
        { text: reject ? '<b>Reject $H_0$</b>: counts this uneven would be rare for a fair die.' : '<b>Do not reject $H_0$</b>: a fair die often gives counts this uneven. This does not prove the die is fair; it only finds no evidence against it.' },
        die ? { text: 'Here you know the truth: the die was ' + (die.fair ? 'fair' : 'loaded') + '. So the decision is ' + (die.fair ? (reject ? 'a <b>Type I error</b> (rejecting a true $H_0$), which happens with chance about $\\alpha$. Press "Roll again".' : 'right.') : (reject ? 'right: the test caught the loading.' : 'a <b>Type II error</b> (missing a real loading). More rolls make it less likely.')) } : null,
      ].filter(Boolean)),
        minE < 5 ? K.note('The expected counts are below 5, so the chi-square curve is only a rough guide here. Roll more.', 'warn') : null));
    }
    draw();
  }

  REV.lab('dice', { sum, 'max-min': maxMin, joint, independence, function: func, covariance, inequalities, continuous, lln, clt, estimate, 'chi-square': chiSquare });
})();
