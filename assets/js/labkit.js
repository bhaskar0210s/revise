/* Revise — lab kit: the shared pieces every playground lab is built from.
   Loaded after widgets/play.js (which provides numField, probField, selectField, textField, toggle, panel, pTex).
   Read LABS.md for the rules every lab follows. */
(function () {
  'use strict';
  const { h, svg, F } = Lab;
  const K = (Lab.play = Lab.play || {});
  const fmtInt = n => (Number.isFinite(n) ? Math.round(n).toLocaleString('en-US') : String(n));
  K.fmtInt = fmtInt;
  /** TeX for an integer with thin thousands separators. */
  K.intTex = n => fmtInt(n).replace(/,/g, '{,}');

  /* ------------------------------------------------------------ registry */
  const LABS = (Lab.labs = Lab.labs || []);
  /**
   * Register a lab. It gets its own page #/p/<id> under the Playground.
   *  id      'lab-s2-joint'           course  's1' (Statistics I) | 's2' (Statistics II)
   *  week    number (course week)     order   sort key inside the week
   *  title   'Joint PMF lab'          sub     short kicker ('Week 1 · L1.1–L1.3')
   *  desc    one sentence             topics  ['joint PMF', 'marginal', …] (shown on the card)
   *  render(host)                     builds the lab inside host
   */
  Lab.lab = function (def) {
    if (!def || !def.id) throw new Error('lab needs an id');
    const i = LABS.findIndex(l => l.id === def.id);
    if (i >= 0) LABS.splice(i, 1);
    LABS.push(def);
    Lab.page(def.id, {
      title: def.title, parent: 'playground',
      render(el) {
        el.classList.add('lab-page');
        if (Lab.course.onLabOpen) Lab.course.onLabOpen(def);
        const li = Lab.course.labsIndex;   // a site may give one index per course
        const idx = typeof li === 'function' ? li(def) : li != null ? li : 'p/playground';
        el.appendChild(h('a', { class: 'lab-back', href: '#/' + idx, html: Lab.icon('arrowLeft') + '<span>All labs</span>' }));
        Lab.pageHead(el, ({ s1: 'Statistics I', s2: 'Statistics II', m2: 'Mathematics II' }[def.course] || 'Statistics II') + ' · ' + (def.sub || 'Week ' + def.week), def.title, def.desc);
        const host = h('div', { class: 'lab-host' });
        el.appendChild(host);
        def.render(host);
      },
    });
  };

  /* -------------------------------------------------------------- layout */
  /** Two columns: controls on the left (sticky), panels on the right. Returns {side, main}. */
  K.layout = function (root, cls) {
    Lab.clear(root);
    root.classList.add('pl-lab');
    if (cls) root.classList.add(cls);
    const side = h('aside', { class: 'pl-controls', 'aria-label': 'Your values' });
    const main = h('div', { class: 'pl-main' });
    // On phones the controls become a bottom sheet: the results stay in view while the values change.
    const done = Lab.button('Done', () => root.classList.remove('sheet-open'), 'btn sm');
    side.appendChild(h('div', { class: 'pl-sheet-bar' }, h('i', { class: 'pl-handle' }), h('b', { text: 'Your values' }), done));
    const fab = h('button', { class: 'btn primary pl-fab', type: 'button', html: Lab.icon('sliders') + '<span>Change values</span>' });
    fab.addEventListener('click', () => root.classList.add('sheet-open'));
    root.append(side, main, fab);
    return { side, main };
  };
  K.group = text => h('div', { class: 'pl-group-title', text });
  /** Small paragraph that may hold LaTeX. */
  K.note = (html, cls = 'pl-hint') => { const d = h('div', { class: cls }); Lab.setHTML(d, html); return d; };
  /** The big answer box: setAnswer(box, {ev, big (TeX), sub}) */
  K.answer = () => h('div', { class: 'pl-answer' });
  K.setAnswer = function (box, { ev, big, sub }) {
    Lab.clear(box);
    if (ev) box.appendChild(K.note(ev, 'pl-ans-ev'));
    if (big) box.appendChild(h('div', { class: 'pl-ans-big', html: Lab.tex(big, true) }));
    if (sub) box.appendChild(K.note(sub, 'pl-ans-sub'));
  };
  /** Numbered steps: [{html, math (TeX), note, block}] → <ol>. */
  K.steps = function (list) {
    const ol = h('ol', { class: 'pl-steps' });
    list.filter(Boolean).forEach((s, k) => {
      const li = h('li', {}, h('span', { class: 's-num', text: String(k + 1) }), h('div', { class: 's-body' }));
      const body = li.lastChild;
      if (s.html) body.appendChild(K.note(s.html, ''));
      if (s.math) body.appendChild(h('div', { class: 's-math', html: Lab.tex(s.math, true) }));
      if (s.note) body.appendChild(K.note(s.note, 'small muted'));
      if (s.block) Lab.mountBlock(s.block, body);
      ol.appendChild(li);
    });
    return ol;
  };
  /** Presets menu: [{label, source, apply()}]. Shows the lecture source under the menu. */
  K.presets = function ({ label = 'Lecture examples', items, onPick }) {
    const sel = h('select', { class: 'field pl-select' });
    sel.appendChild(h('option', { value: '', text: '— choose an example —' }));
    // A site with Lab.course.lectureOnly lists only the lecture's examples, not the course's questions
    // (labels "AQ2.3 Q1 · …", "PA1 Q4 · …"). Option values stay the indices into items.
    const hide = it => Lab.course && Lab.course.lectureOnly && /^(AQ|TQ|PA|GA|PPA|GrPA)\s?\d/.test(it.label || '');
    items.forEach((it, k) => { if (!hide(it)) sel.appendChild(h('option', { value: String(k), text: it.label })); });
    const src = h('div', { class: 'pl-hint' });
    sel.addEventListener('change', () => {
      if (sel.value === '') { src.textContent = ''; return; }
      const it = items[+sel.value];
      Lab.setHTML(src, it.source ? 'From: ' + it.source : '');
      onPick(it);
    });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const wrap = h('div', { class: 'pl-field' }, lab, sel, src);
    wrap.select = sel;
    return wrap;
  };

  /* ------------------------------------------------------------- parsing */
  /** Parse one number: integers, decimals, fractions (3/8), %, simple expressions (1/6*1/6). Exact when possible. */
  K.parseNum = function (s) {
    s = String(s).trim();
    if (!s) return null;
    try {
      if (/%$/.test(s)) return F(s.slice(0, -1).trim()).div(100);
      // scientific notation 1e-3, 2.5E4 (the expression parser would read e as 2.718…)
      const sci = s.match(/^([-+]?)(\d*)(?:\.(\d*))?[eE]([-+]?\d+)$/);
      if (sci && (sci[2] || sci[3])) {
        const frac = sci[3] || '', exp = parseInt(sci[4], 10) - frac.length;
        const n = parseInt((sci[2] || '') + frac || '0', 10) * (sci[1] === '-' ? -1 : 1);
        return exp >= 0 ? F(n * Math.pow(10, exp)) : new Lab.Frac(n, Math.pow(10, -exp));
      }
      const v = Lab.expr.evaluate(s.replace(/^\./, '0.'));
      if (v instanceof Lab.Frac) return v;
      if (typeof v === 'number' && Number.isFinite(v)) return F.isFrac(v) ? v : Lab.Frac.fromNumber(v);
      return null;
    } catch (e) { return null; }
  };
  /** Parse a list "3, 5, 7.5" or "3 5 7.5" → [numbers]; returns {nums, bad: [tokens]} */
  K.parseList = function (s) {
    const toks = String(s).split(/[\s,;]+/).map(t => t.trim()).filter(Boolean);
    const nums = [], bad = [];
    toks.forEach(t => { const f = K.parseNum(t); if (f == null) bad.push(t); else nums.push(Number(f)); });
    return { nums, bad };
  };

  /* --------------------------------------------------------- list input */
  /** Textarea of numbers. onChange(nums) only when every token is a number. */
  K.listField = function ({ label, value, onChange, rows = 3, hint }) {
    const ta = h('textarea', { class: 'field mono pl-area', rows, spellcheck: 'false' });
    ta.value = value;
    const msg = h('div', { class: 'pl-hint' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const wrap = h('div', { class: 'pl-field' }, lab, ta, msg);
    const run = () => {
      const { nums, bad } = K.parseList(ta.value);
      if (bad.length) { ta.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Not a number: ' + bad.slice(0, 3).map(Lab.esc).join(', ') + '</span>'); return; }
      if (!nums.length) { ta.classList.add('bad'); Lab.setHTML(msg, '<span class="cbad">Type at least one number.</span>'); return; }
      ta.classList.remove('bad');
      Lab.setHTML(msg, hint ? hint(nums) : Lab.tex('n=' + nums.length) + ' values');
      onChange(nums);
    };
    ta.addEventListener('input', Lab.debounce(run, 200));
    wrap.input = ta;
    wrap.set = v => { ta.value = v; run(); };
    setTimeout(run, 0);
    return wrap;
  };

  /* ---------------------------------------------------------- PMF editor */
  /**
   * Editable PMF: rows of (value, probability). Probabilities accept 1/6, 0.2, 20%.
   * onChange({vals, p (Frac[]), ok, total}) — ok is true when every entry is valid and the total is 1.
   * opts: label, vals, probs (strings), xName
   */
  K.pmfEditor = function ({ label = 'Your PMF', vals, probs, onChange, xName = 'X' }) {
    let rows = vals.map((v, k) => ({ v: String(v), p: String(probs[k]) }));
    const wrap = h('div', { class: 'pl-field pmf-ed' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const tbl = h('div', { class: 'pe-rows' });
    const msg = h('div', { class: 'pl-hint' });
    const tools = h('div', { class: 'pl-chips' });
    wrap.append(lab, tbl, msg, tools);
    tools.append(
      Lab.button('+ row', () => { const last = rows.length ? Number(K.parseNum(rows[rows.length - 1].v)) : -1; rows.push({ v: String(Number.isFinite(last) ? last + 1 : rows.length), p: '0' }); draw(); emit(); }, 'btn xs'),
      Lab.button('Make all equal', () => { rows.forEach(r => (r.p = '1/' + rows.length)); draw(); emit(); }, 'btn xs'),
      Lab.button('Rescale to total 1', () => { const ps = rows.map(r => K.parseNum(r.p)); if (ps.some(x => x == null)) return; const tot = F.sum(ps); if (tot.isZero()) return; rows.forEach((r, k) => (r.p = ps[k].div(tot).toString())); draw(); emit(); }, 'btn xs'));
    function draw() {
      Lab.clear(tbl);
      tbl.appendChild(h('div', { class: 'pe-head' }, h('span', { html: Lab.tex('x') }), h('span', { html: Lab.tex('P(' + xName + '=x)') }), h('span')));
      rows.forEach((r, k) => {
        const vi = h('input', { class: 'field mono pe-in', value: r.v, spellcheck: 'false', 'aria-label': 'value ' + (k + 1) });
        const pi = h('input', { class: 'field mono pe-in', value: r.p, spellcheck: 'false', 'aria-label': 'probability ' + (k + 1) });
        const del = h('button', { class: 'icon-btn pe-del', type: 'button', html: Lab.icon('x'), 'aria-label': 'remove row', title: 'remove row' });
        vi.addEventListener('input', () => { r.v = vi.value; emitSoon(); });
        pi.addEventListener('input', () => { r.p = pi.value; emitSoon(); });
        del.addEventListener('click', () => { if (rows.length > 1) { rows.splice(k, 1); draw(); emit(); } });
        tbl.appendChild(h('div', { class: 'pe-row' }, vi, pi, del));
      });
    }
    const emitSoon = Lab.debounce(() => emit(), 160);
    function emit() {
      const inputs = Lab.$$('.pe-row', tbl);
      let ok = true;
      const parsed = rows.map((r, k) => {
        const v = K.parseNum(r.v), p = K.parseNum(r.p);
        const [vi, pi] = inputs[k] ? inputs[k].querySelectorAll('input') : [];
        if (vi) vi.classList.toggle('bad', v == null);
        if (pi) pi.classList.toggle('bad', p == null || Number(p) < 0);
        if (v == null || p == null || Number(p) < 0) ok = false;
        return { v: v == null ? null : Number(v), p };
      });
      const dupe = ok && new Set(parsed.map(x => x.v)).size !== parsed.length;
      if (dupe) ok = false;
      const total = ok ? F.sum(parsed.map(x => x.p)) : null;
      const sorted = ok ? parsed.slice().sort((a, b) => a.v - b.v) : [];
      const good = ok && total.eq(1);
      Lab.setHTML(msg, !ok ? '<span class="cbad">' + (dupe ? 'Each value may appear only once.' : 'Fix the red boxes: values are numbers, probabilities are 0 or more (e.g. 1/6, 0.25, 20%).') + '</span>'
        : 'Total ' + Lab.tex('\\sum P=' + K.pTex(total)) + (good ? ' <span class="cgood">✓</span>' : ' <span class="cbad">— a PMF must total 1. Press "Rescale to total 1" or edit.</span>'));
      onChange({ vals: sorted.map(x => x.v), p: sorted.map(x => x.p), ok: good, total });
    }
    draw();
    setTimeout(emit, 0);
    wrap.set = (vs, ps) => { rows = vs.map((v, k) => ({ v: String(v), p: String(ps[k]) })); draw(); emit(); };
    return wrap;
  };

  /* --------------------------------------------------------- grid editor */
  /**
   * Editable table (joint PMF or contingency table). X values across (columns), Y values down (rows) — like the lecture.
   * cells[j][i] = string for row y_j, column x_i. Labels editable when editLabels is true.
   * onChange({xs, ys, cells: Frac[j][i] | null, ok}) ; add/remove rows/columns.
   */
  K.gridEditor = function ({ label, xs, ys, cells, onChange, xName = 'X', yName = 'Y', editLabels = true, mode = 'prob' }) {
    let X = xs.map(String), Y = ys.map(String), C = cells.map(r => r.map(String));
    const wrap = h('div', { class: 'pl-field grid-ed' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label || (mode === 'prob' ? 'Your joint table' : 'Your counts'));
    const box = h('div', { class: 'ge-scroll' });
    const msg = h('div', { class: 'pl-hint' });
    const tools = h('div', { class: 'pl-chips' });
    wrap.append(lab, box, msg, tools);
    tools.append(
      Lab.button('+ column', () => { X.push(String(nextLabel(X))); C.forEach(r => r.push('0')); draw(); emit(); }, 'btn xs'),
      Lab.button('− column', () => { if (X.length > 1) { X.pop(); C.forEach(r => r.pop()); draw(); emit(); } }, 'btn xs'),
      Lab.button('+ row', () => { Y.push(String(nextLabel(Y))); C.push(X.map(() => '0')); draw(); emit(); }, 'btn xs'),
      Lab.button('− row', () => { if (Y.length > 1) { Y.pop(); C.pop(); draw(); emit(); } }, 'btn xs'));
    if (mode === 'prob') tools.append(Lab.button('Rescale to total 1', () => { const ps = C.flat().map(K.parseNum); if (ps.some(x => x == null)) return; const tot = F.sum(ps); if (tot.isZero()) return; C = C.map(r => r.map(v => K.parseNum(v).div(tot).toString())); draw(); emit(); }, 'btn xs'));
    function nextLabel(arr) { const nums = arr.map(Number).filter(Number.isFinite); return nums.length === arr.length ? Math.max(...nums) + 1 : 'v' + (arr.length + 1); }
    function draw() {
      Lab.clear(box);
      const g = h('div', { class: 'ge-grid' });
      g.style.gridTemplateColumns = 'auto repeat(' + X.length + ', minmax(64px, 1fr))';
      g.appendChild(h('div', { class: 'ge-corner', html: Lab.tex(yName + '\\,\\backslash\\,' + xName) }));
      X.forEach((x, i) => {
        const inp = h('input', { class: 'field mono ge-x', value: x, spellcheck: 'false', 'aria-label': xName + ' value ' + (i + 1) });
        inp.disabled = !editLabels;
        inp.addEventListener('input', () => { X[i] = inp.value; emitSoon(); });
        g.appendChild(inp);
      });
      Y.forEach((y, j) => {
        const inp = h('input', { class: 'field mono ge-y', value: y, spellcheck: 'false', 'aria-label': yName + ' value ' + (j + 1) });
        inp.disabled = !editLabels;
        inp.addEventListener('input', () => { Y[j] = inp.value; emitSoon(); });
        g.appendChild(inp);
        X.forEach((_, i) => {
          const c = h('input', { class: 'field mono ge-c', value: C[j][i], spellcheck: 'false', 'aria-label': 'cell ' + (i + 1) + ',' + (j + 1) });
          c.addEventListener('input', () => { C[j][i] = c.value; emitSoon(); });
          g.appendChild(c);
        });
      });
      box.appendChild(g);
    }
    const emitSoon = Lab.debounce(() => emit(), 160);
    function emit() {
      let ok = true;
      const cellIns = Lab.$$('.ge-c', box);
      const parsed = C.map((r, j) => r.map((v, i) => {
        const f = K.parseNum(v);
        const bad = f == null || Number(f) < 0;
        const el = cellIns[j * X.length + i];
        if (el) el.classList.toggle('bad', bad);
        if (bad) ok = false;
        return bad ? null : f;
      }));
      const xv = X.map(s => { const f = K.parseNum(s); return f == null ? s.trim() : Number(f); });
      const yv = Y.map(s => { const f = K.parseNum(s); return f == null ? s.trim() : Number(f); });
      if (new Set(xv.map(String)).size !== xv.length || new Set(yv.map(String)).size !== yv.length) ok = false;
      const total = ok ? F.sum(parsed.flat()) : null;
      if (mode === 'prob') {
        Lab.setHTML(msg, !ok ? '<span class="cbad">Fix the red boxes (numbers ≥ 0, e.g. 1/8, 0.125) and keep the labels different.</span>'
          : 'Total of all cells ' + Lab.tex('=' + K.pTex(total)) + (total.eq(1) ? ' <span class="cgood">✓</span>' : ' <span class="cbad">— a joint PMF must total 1. Press "Rescale to total 1".</span>'));
      } else {
        Lab.setHTML(msg, !ok ? '<span class="cbad">Fix the red boxes (counts ≥ 0) and keep the labels different.</span>' : 'Total count ' + Lab.tex('n=' + K.pTex(total)));
      }
      onChange({ xs: xv, ys: yv, cells: parsed, ok: ok && (mode !== 'prob' || total.eq(1)), total });
    }
    draw();
    setTimeout(emit, 0);
    wrap.set = (xs2, ys2, cells2) => { X = xs2.map(String); Y = ys2.map(String); C = cells2.map(r => r.map(String)); draw(); emit(); };
    return wrap;
  };
  /** Convert a gridEditor result to a joint object {xs, ys, p[i][j]} used by Lab.P / Lab.W.joint. */
  K.gridToJoint = g => ({ xs: g.xs, ys: g.ys, p: g.xs.map((_, i) => g.ys.map((_, j) => g.cells[j][i])) });

  /* ------------------------------------------------------ distribution picker */
  const FAMILIES = {
    uniform: { label: 'Uniform on {a, …, b}', params: [['a', 1, -20, 20, 1], ['b', 6, -20, 20, 1]], make: q => Lab.P.uniform(Math.min(q.a, q.b), Math.max(q.a, q.b)), tex: q => '\\text{Uniform}\\{' + Math.min(q.a, q.b) + ',\\dots,' + Math.max(q.a, q.b) + '\\}' },
    bernoulli: { label: 'Bernoulli(p)', params: [['p', '1/2']], make: q => Lab.P.bernoulli(q.p), tex: q => '\\text{Bernoulli}(' + K.pTex(q.p) + ')' },
    binomial: { label: 'Binomial(n, p)', params: [['n', 4, 1, 20, 1], ['p', '1/2']], make: q => Lab.P.binomial(q.n, q.p), tex: q => '\\text{Bin}(' + q.n + ',' + K.pTex(q.p) + ')' },
    geometric: { label: 'Geometric(p) on {1, 2, …}', params: [['p', '1/2'], ['shown up to k', 10, 3, 30, 1]], make: q => Lab.P.geometric(q.p, q['shown up to k']), tex: q => '\\text{Geometric}(' + K.pTex(q.p) + ')', truncated: true },
    negbin: { label: 'Negative binomial(r, p) on {r, r+1, …}', params: [['r', 2, 1, 20, 1], ['p', '1/2'], ['shown up to k', 12, 3, 60, 1]], make: q => Lab.P.negbin(q.r, q.p, Math.max(q.r, q['shown up to k'])), tex: q => '\\text{NegBin}(' + q.r + ',' + K.pTex(q.p) + ')', truncated: true },
    poisson: { label: 'Poisson(λ)', params: [['λ', 2, 0.1, 20, 0.1], ['shown up to k', 12, 3, 40, 1]], make: q => Lab.P.poisson(q['λ'], q['shown up to k']), tex: q => '\\text{Poisson}(' + q['λ'] + ')', truncated: true },
  };
  K.FAMILIES = FAMILIES;
  /**
   * Pick a named family and its parameters, or type your own PMF.
   * onChange({dist, tex, name, ok}). families: list of keys plus 'custom'.
   */
  K.distPicker = function ({ label = 'Distribution', families = ['uniform', 'bernoulli', 'binomial', 'geometric', 'poisson', 'custom'], value = 'uniform', params = {}, ranges = {}, custom, onChange, xName = 'X' }) {
    const st = { fam: value, q: {} };
    const wrap = h('div', { class: 'pl-field dist-pick' });
    const famSel = K.selectField({ label, options: families.map(f => ({ value: f, label: f === 'custom' ? 'Type your own PMF' : FAMILIES[f].label })), value, onChange: v => { st.fam = v; buildParams(); emit(); } });
    const box = h('div', { class: 'dp-params' });
    wrap.append(famSel, box);
    let pe = null;
    function buildParams() {
      // a box that still has focus would report its old value after the family changed
      if (box.contains(document.activeElement)) document.activeElement.blur();
      Lab.clear(box);
      pe = null;
      st.q = {};
      const fam = st.fam;
      if (st.fam === 'custom') {
        const c = custom || { vals: [0, 1, 2], probs: ['1/4', '1/2', '1/4'] };
        pe = K.pmfEditor({ label: 'Values and probabilities', vals: c.vals, probs: c.probs, xName, onChange: r => { st.customRes = r; emit(); } });
        box.appendChild(pe);
        return;
      }
      FAMILIES[st.fam].params.forEach(([name, def, lo, hi, step]) => {
        const rg = ranges[st.fam] && ranges[st.fam][name];
        if (rg) [lo, hi] = rg;
        const start = params[st.fam] && params[st.fam][name] != null ? params[st.fam][name] : def;
        if (typeof def === 'string') {
          st.q[name] = K.parseProb(start) || F(1, 2);
          box.appendChild(K.probField({ label: Lab.tex(name), value: start, onChange: f => { if (st.fam !== fam) return; st.q[name] = f; emit(); } }));
        } else {
          st.q[name] = start;
          box.appendChild(K.numField({ label: name === 'λ' ? Lab.tex('\\lambda') : name.length === 1 ? Lab.tex(name) : name, min: lo, max: hi, step, value: start, onChange: v => { if (st.fam !== fam) return; st.q[name] = v; emit(); } }));
        }
      });
    }
    function emit() {
      if (st.fam === 'custom') {
        const r = st.customRes;
        if (!r) return;
        onChange({ dist: { vals: r.vals, p: r.p }, tex: xName, name: 'your PMF', ok: r.ok });
        return;
      }
      const Fm = FAMILIES[st.fam];
      const dist = Fm.make(st.q);
      onChange({ dist, tex: Fm.tex(st.q), name: Fm.label, ok: true, truncated: !!Fm.truncated, q: Object.assign({}, st.q), fam: st.fam });
    }
    buildParams();
    setTimeout(emit, 0);
    wrap.setFamily = (fam, q) => { st.fam = fam; famSel.select.value = fam; if (q) params[fam] = q; buildParams(); emit(); };
    return wrap;
  };

  /* -------------------------------------------------------- expression input */
  /** Type a function of the given variables. onChange(fn | null, src). */
  K.exprField = function ({ label, value, vars = ['x'], onChange, placeholder }) {
    const input = h('input', { class: 'field mono pl-text', value, spellcheck: 'false', autocomplete: 'off', placeholder: placeholder || '' });
    const msg = h('div', { class: 'pl-hint' });
    const lab = h('label', { class: 'pl-label' });
    Lab.setHTML(lab, label);
    const wrap = h('div', { class: 'pl-field' }, lab, input, msg);
    const run = () => {
      try {
        const used = Lab.expr.vars(input.value).filter(v => !vars.includes(v));
        if (used.length) throw new Error('Unknown name: ' + used.join(', ') + ' (use ' + vars.join(', ') + ')');
        const f = Lab.expr.compile(input.value);
        const env = {}; vars.forEach(v => (env[v] = 1)); f(env);
        input.classList.remove('bad');
        Lab.setHTML(msg, 'You can use + − * / ^, abs(), min(), max(), floor(), mod(a,b), |x|, and comparisons like (x >= 5), which give 1 or 0.');
        onChange(a => { const e = {}; vars.forEach((v, k) => (e[v] = a[k])); return Lab.expr.num(f(e)); }, input.value);
      } catch (e) {
        input.classList.add('bad');
        Lab.setHTML(msg, '<span class="cbad">' + Lab.esc(e.message) + '</span>');
        onChange(null, input.value);
      }
    };
    input.addEventListener('input', Lab.debounce(run, 220));
    wrap.input = input;
    wrap.set = v => { input.value = v; run(); };
    setTimeout(run, 0);
    return wrap;
  };

  /* -------------------------------------------------------------- charts */
  /**
   * PMF bar chart. rows: [{x, p (Frac|number), part?, label?}] — part (optional) is drawn violet inside the bar.
   * opts: xName (TeX), height, showValues, tone ('mass'|'x'|'y'|'z'), onPick(x)
   */
  K.pmfChart = function (rows, opts = {}) {
    const wrap = h('div', { class: 'kc-pmf tone-' + (opts.tone || 'mass') });
    const max = Math.max(...rows.map(r => Number(r.p)), 1e-12);
    const chart = h('div', { class: 'pd-chart' });
    chart.style.height = (opts.height || 190) + 'px';
    const axis = h('div', { class: 'pd-axis' });
    rows.forEach(r => {
      const col = h('div', { class: 'pd-col' + (r.hot ? ' hot' : '') });
      const stack = h('div', { class: 'pd-stack' });
      const val = h('div', { class: 'pd-val', html: opts.showValues === false ? '' : Lab.tex(r.label != null ? r.label : K.pTex(r.p)) });
      const bar = h('div', { class: 'pd-bar' });
      bar.style.height = (Number(r.p) / max) * 80 + '%';
      if (r.part != null) { const part = h('div', { class: 'pd-part' }); part.style.height = Number(r.p) ? (Number(r.part) / Number(r.p)) * 100 + '%' : '0'; bar.appendChild(part); }
      stack.append(val, bar);
      col.appendChild(stack);
      if (opts.onPick) { col.classList.add('pickable'); col.addEventListener('click', () => opts.onPick(r.x)); }
      col.title = 'P(' + (opts.xPlain || 'X') + ' = ' + r.x + ') = ' + (r.p instanceof Lab.Frac && !r.p.approx ? r.p.toString() : Lab.fmtSmall(r.p));
      chart.appendChild(col);
      axis.appendChild(h('div', { class: 'pd-x', html: Lab.tex(Lab.fmtVal(r.x)) }));
    });
    wrap.appendChild(h('div', { class: 'pd-scroll' }, h('div', { class: 'pd-inner' }, chart, axis)));
    if (opts.xName) wrap.appendChild(h('div', { class: 'pd-name', html: 'values of ' + Lab.tex(opts.xName) }));
    return wrap;
  };
  /**
   * CDF staircase with a movable t. dist {vals, p}. opts: xName, t, onT(t), step (slider step), float (decimals)
   * Returns an element; the readout explains F(t) as a sum.
   */
  K.cdfChart = function (dist, opts = {}) {
    const xn = opts.xName || 'X';
    // the summation letter follows the variable: X → x, Y → y, X_1 → x_1 (never t, which is the cutoff)
    let ix = opts.sumVar || (/^[A-Z](_.*)?$/.test(xn) ? xn[0].toLowerCase() + xn.slice(1) : 'v');
    if (ix[0] === 't') ix = 'u' + ix.slice(1);
    const vals = dist.vals.map(Number);
    const lo = vals[0], hi = vals[vals.length - 1];
    const span = Math.max(1, hi - lo);
    const pad = Math.max(1, Math.round(span / 10));
    let t = opts.t != null ? opts.t : vals[Math.floor(vals.length / 2)];
    const wrap = h('div', { class: 'kc-cdf' });
    const tCtl = K.numField({ label: 'Move ' + Lab.tex('t') + ' (any number)', min: lo - pad, max: hi + pad, step: opts.step || (span > 40 ? 1 : 0.5), value: t, onChange: v => { t = v; paint(); if (opts.onT) opts.onT(v); } });
    const host = h('div', { class: 'cdf-host' });
    const read = h('div', { class: 'ws-readout cdf-read' });
    wrap.append(tCtl, host, read);
    function paint() {
      const Wd = 640, H = 230, pl = 44, pr = 16, pt = 14, pb = 34;
      const X = v => pl + ((v - (lo - pad)) / ((hi + pad) - (lo - pad))) * (Wd - pl - pr);
      const Y = v => pt + (1 - v) * (H - pt - pb);
      const s = svg('svg', { viewBox: '0 0 ' + Wd + ' ' + H, class: 'cdf-svg pl-cdf' });
      [0, 0.25, 0.5, 0.75, 1].forEach(v => { s.appendChild(svg('line', { x1: pl, x2: Wd - pr, y1: Y(v), y2: Y(v), class: 'grid' })); s.appendChild(svg('text', { x: pl - 8, y: Y(v) + 4, 'text-anchor': 'end', class: 'tick' }, String(v))); });
      let acc = 0, prevX = X(lo - pad);
      // x-axis labels: the values themselves when they fit side by side, else round numbers
      const labW = str => str.length * 7.2 + 10;
      const shown = new Set();
      if (vals.length <= 24) {
        const lastK = vals.length - 1, txt = vals.map(v => Lab.fmtVal(v));
        const lastLeft = X(vals[lastK]) - labW(txt[lastK]) / 2;
        let right = -Infinity;
        vals.forEach((v, k) => {
          const x = X(v), w = labW(txt[k]);
          if (x - w / 2 < right) return;
          if (k < lastK && k > 0 && x + w / 2 > lastLeft) return;
          shown.add(k); right = x + w / 2;
        });
      } else {
        const raw = (hi - lo) / 7, mag = Math.pow(10, Math.floor(Math.log10(raw))), nrm = raw / mag;
        const stp = (nrm < 1.5 ? 1 : nrm < 3 ? 2 : nrm < 7 ? 5 : 10) * mag;
        for (let k = Math.ceil(lo / stp); k * stp <= hi + 1e-9; k++) {
          const v = +(k * stp).toPrecision(12);
          s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: Y(0), y2: Y(0) + 5, class: 'grid' }));
          s.appendChild(svg('text', { x: X(v), y: H - 14, 'text-anchor': 'middle', class: 'tick' }, Lab.fmtVal(v)));
        }
      }
      vals.forEach((v, k) => {
        const pv = Number(dist.p[k]);
        s.appendChild(svg('line', { x1: prevX, x2: X(v), y1: Y(acc), y2: Y(acc), class: 'step' }));
        s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: Y(acc), y2: Y(acc + pv), class: 'jump' }));
        if (vals.length <= 12 && pv > 0.02) s.appendChild(svg('text', { x: X(v) + 5, y: (Y(acc) + Y(acc + pv)) / 2 + 4, class: 'jump-lab' }, '+' + Lab.fmt(dist.p[k], 3)));
        s.appendChild(svg('circle', { cx: X(v), cy: Y(acc), r: 3.4, class: 'open' }));
        acc += pv;
        s.appendChild(svg('circle', { cx: X(v), cy: Y(acc), r: 3.4, class: 'closed' }));
        if (shown.has(k)) s.appendChild(svg('text', { x: X(v), y: H - 14, 'text-anchor': 'middle', class: 'tick' }, Lab.fmtVal(v)));
        prevX = X(v);
      });
      s.appendChild(svg('line', { x1: prevX, x2: X(hi + pad), y1: Y(acc), y2: Y(acc), class: 'step' }));
      const used = vals.map((v, k) => ({ v, p: dist.p[k] })).filter(r => r.v <= t);
      const Ft = dist.float ? used.reduce((a, r) => a + Number(r.p), 0) : F.sum(used.map(r => F(r.p)));
      s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: Y(0), y2: Y(Number(Ft)), class: 'marker' }));
      s.appendChild(svg('line', { x1: pl, x2: X(t), y1: Y(Number(Ft)), y2: Y(Number(Ft)), class: 'marker' }));
      s.appendChild(svg('circle', { cx: X(t), cy: Y(Number(Ft)), r: 5.5, class: 'marker-dot' }));
      Lab.clear(host);
      host.appendChild(s);
      const tt = Lab.fmtVal(t);
      const gv = opts.given ? '\\mid ' + opts.given : '';
      const terms = used.map(r => 'P(' + xn + '=' + Lab.fmtVal(r.v) + gv + ')');
      const nums = used.map(r => K.pTex(r.p));
      // with decimal inputs, "=" only when the shown digits are exact, else "≈"
      const isNum = typeof Ft === 'number';
      const eqDec = (v, dp) => (Math.abs(+Lab.fmtDec(v, dp) - v) > 1e-12 ? '\\approx ' : '=');
      const FtTex = isNum ? Lab.fmtDec(Ft, 4) : K.pTexApprox(Ft);
      const rest = isNum ? Lab.fmtDec(1 - Ft, 4) : K.pTex(F(1).sub(Ft));
      const termsEq = used.some(r => typeof r.p === 'number' && eqDec(r.p, 6) !== '=') ? '\\approx ' : '=';
      Lab.setHTML(read, used.length
        ? Lab.tex('F(' + tt + ')=P(' + xn + '\\le ' + tt + gv + ')=' + (terms.length > 4 ? '\\sum_{' + ix + '\\le ' + tt + '}P(' + xn + '=' + ix + gv + ')' : terms.join('+'))) + '<br>' + Lab.tex((nums.length > 1 && nums.length <= 8 ? termsEq + nums.join('+') : '') + (isNum ? eqDec(Ft, 4) : '=') + FtTex) +
          '<div class="small muted">Values of ' + Lab.tex(xn) + ' that are ' + Lab.tex('\\le ' + tt) + ': ' + (used.length > 12 ? used.slice(0, 12).map(r => Lab.fmtVal(r.v)).join(', ') + ', …' : used.map(r => Lab.fmtVal(r.v)).join(', ')) + '. And ' + Lab.tex('P(' + xn + '>' + tt + gv + ')=1-F(' + tt + ')' + (isNum ? eqDec(1 - Ft, 4) : '=') + rest) + '.' + (opts.truncated ? ' (The chart stops at the last value shown; the rest of the probability lies further right.)' : '') + '</div>'
        : Lab.tex('F(' + tt + ')=P(' + xn + '\\le ' + tt + gv + ')=0') + ' — no value of ' + Lab.tex(xn) + ' is ' + Lab.tex('\\le ' + tt) + ' (the smallest is ' + Lab.fmtVal(lo) + ').');
    }
    paint();
    return wrap;
  };
  /** True when the fraction has a short exact decimal (denominator 2^a·5^b and ≤ 4 places). */
  K.exactDecimal = function (f) {
    if (!(f instanceof Lab.Frac) || f.approx) return false;
    let d = f.d;
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1 && Math.abs(Number(f) * 1e4 - Math.round(Number(f) * 1e4)) < 1e-9;
  };
  K.pTexApprox = function (f) {
    if (typeof f === 'number') return Lab.fmtDec(f, 6);
    const t = K.pTex(f);
    if (f instanceof Lab.Frac && !f.approx && f.d !== 1 && f.d <= 1e7) return t + (K.exactDecimal(f) ? '=' : '\\approx ') + Lab.fmtDec(Number(f), 4);
    return t;
  };
})();
