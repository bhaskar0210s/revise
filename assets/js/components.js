/* Revise — building blocks for lesson cards.
   A lesson card's body is a list of blocks. A block is either an HTML string (prose with LaTeX)
   or an object with mount(el, ctx). Everything here returns such blocks. */
(function () {
  'use strict';
  const { h, T } = Lab;

  /* ---------------------------------------------------------------- icons */
  const I = {
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.2 4.2L19 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
    chevronDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowLeft: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 8 5.5z"/></svg>',
    video: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.25 5 12 5 12 5s-6.25 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.76 1.77C5.75 19 12 19 12 19s6.25 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15V9l5.2 3z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    cards: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="6" width="14" height="14" rx="3"/><path d="M7 3h11a3 3 0 0 1 3 3v11"/></svg>',
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 11L12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/></svg>',
    sigma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 5H6l6 7-6 7h12"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 3.5v17M14.5 3.5v17"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3"/><path d="M7.5 14h9"/></svg>',
    target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>',
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/></svg>',
    sliders: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8"/><circle cx="16" cy="7" r="2"/><circle cx="10" cy="17" r="2"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    key: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.6 5.6L20.5 9l-4.3 4.1 1.1 5.9L12 16.2 6.7 19l1.1-5.9L3.5 9l5.9-.4z"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5L2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.1"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.1"/></svg>',
    bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    list: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 6h11M9 12h11M9 18h11M4.5 6h.1M4.5 12h.1M4.5 18h.1"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.8a2 2 0 0 0-1.1-1.8l-1.8-.9A2 2 0 0 1 15 10.8V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>',
    pinOff: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M15 9.3V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H7.9"/><path d="M2 2l20 20"/><path d="M9 9v1.8a2 2 0 0 1-1.1 1.8l-1.8.9A2 2 0 0 0 5 15.2V16a1 1 0 0 0 1 1h11"/></svg>',
    sideClose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M16 15l-3-3 3-3"/></svg>',
    sideOpen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l3 3-3 3"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    minus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
    dice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3.5" y="3.5" width="17" height="17" rx="4"/><circle cx="8.5" cy="8.5" r="1.3" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/></svg>',
  };
  Lab.icon = name => I[name] || '';
  const icon = (name, cls) => { const s = h('span', { class: 'ic' + (cls ? ' ' + cls : ''), html: I[name] || '' }); s.style.display = 'inline-flex'; return s; };
  Lab.iconEl = icon;

  /* ------------------------------------------------------- block mounting */
  /** Mount one block into a parent element. */
  Lab.mountBlock = function (block, parent, ctx) {
    if (block == null || block === false) return;
    if (typeof block === 'string') {
      const el = h('div', { class: 'prose' });
      Lab.setHTML(el, block);
      parent.appendChild(el);
      return el;
    }
    if (block instanceof Node) { parent.appendChild(block); Lab.renderMath(block); return block; }
    if (typeof block.mount === 'function') {
      const el = h('div', { class: 'block' + (block.cls ? ' ' + block.cls : '') });
      parent.appendChild(el);
      try { block.mount(el, ctx || {}); }
      catch (e) {
        console.error(e);
        el.appendChild(h('div', { class: 'callout warn' }, 'This interactive part failed to load: ' + e.message));
      }
      return el;
    }
    if (Array.isArray(block)) { block.forEach(b => Lab.mountBlock(b, parent, ctx)); return parent; }
    console.warn('Unknown block', block);
  };
  /** Wrap any mount function as a block. */
  Lab.block = (mount, cls) => ({ mount, cls });

  /* -------------------------------------------------------------- callouts */
  const CALLOUT = {
    key: ['key', 'Key idea'], warn: ['alert', 'Careful'], lecture: ['video', 'In the lecture'],
    note: ['info', 'Note'], good: ['check', 'Why this works'], x: ['info', 'Note'], y: ['info', 'Note'],
    tip: ['bulb', 'Tip'],
  };
  Lab.callout = function (kind, html, title) {
    const [ic, def] = CALLOUT[kind] || CALLOUT.note;
    return Lab.block(el => {
      const box = h('div', { class: 'callout ' + (kind === 'tip' ? 'key' : kind) },
        h('div', { class: 'c-title', html: I[ic] + '<span>' + (title || def) + '</span>' }),
        h('div', { class: 'c-body' }));
      Lab.setHTML(box.lastChild, html);
      el.appendChild(box);
    });
  };
  /** Display formula block. `tex` is LaTeX (no delimiters). */
  Lab.formula = function (tex, opts = {}) {
    return Lab.block(el => {
      const box = h('div', { class: 'formula' + (opts.boxed ? ' boxed' : '') });
      if (opts.label) box.appendChild(h('div', { class: 'f-label', text: opts.label }));
      box.appendChild(h('div', { html: Lab.tex(tex, true) }));
      if (opts.note) { const n = h('div', { class: 'f-note' }); Lab.setHTML(n, opts.note); box.appendChild(n); }
      el.appendChild(box);
    });
  };
  /** Two side-by-side panels, e.g. "In words" / "In symbols". */
  Lab.duo = function (a, b) {
    return Lab.block(el => {
      const wrap = h('div', { class: 'duo' });
      [a, b].forEach(([label, html]) => {
        const d = h('div', {}, h('div', { class: 'd-label', text: label }), h('div', { class: 'prose' }));
        Lab.setHTML(d.lastChild, html);
        d.lastChild.style.fontSize = '16.5px';
        wrap.appendChild(d);
      });
      el.appendChild(wrap);
    });
  };
  /** Click-to-open explanation. */
  Lab.reveal = function (label, body, opts = {}) {
    return Lab.block(el => {
      const box = h('div', { class: 'reveal' + (opts.open ? ' open' : '') });
      const btn = h('button', { type: 'button', html: I.chevron + '<span></span>' });
      Lab.setHTML(btn.lastChild, label);
      const inner = h('div', { class: 'r-body' });
      let mounted = false;
      const mountBody = () => {
        if (mounted) return; mounted = true;
        (Array.isArray(body) ? body : [body]).forEach(b => Lab.mountBlock(b, inner));
      };
      if (opts.open) mountBody();
      btn.addEventListener('click', () => { mountBody(); box.classList.toggle('open'); });
      btn.setAttribute('aria-expanded', String(!!opts.open));
      box.append(btn, inner);
      el.appendChild(box);
    });
  };
  /** Plain HTML table. rows: arrays of cell html. opts: {head, highlight: rowIndex, align} */
  Lab.table = function (head, rows, opts = {}) {
    return Lab.block(el => {
      const wrap = h('div', { class: 'tbl-wrap' });
      const t = h('table', { class: 'tbl' });
      if (head) t.appendChild(h('thead', {}, h('tr', {}, head.map(c => h('th', { html: c })))));
      const tb = h('tbody');
      rows.forEach((r, i) => tb.appendChild(h('tr', { class: opts.highlight === i ? 'hl-row' : null }, r.map(c => h('td', { html: c })))));
      t.appendChild(tb);
      wrap.appendChild(t);
      el.appendChild(wrap);
      Lab.renderMath(wrap);
      if (opts.center) wrap.style.margin = '0 auto';
    });
  };

  /* ------------------------------------------------------------------ steps */
  /**
   * Step-by-step reveal. opts:
   *  title: header text ("Worked example")
   *  steps: [html | {html, math, on(widget, {animate}), note}]
   *  widget: optional widget block; each step's on() can drive it
   *  split: put the widget beside the steps on wide cards
   *  start: number of steps visible at first (default 1)
   */
  Lab.steps = function (opts) {
    return Lab.block((el, ctx) => {
      const steps = opts.steps.map(s => (typeof s === 'string' ? { html: s } : s));
      let shown = 0;
      let busy = false;
      const wrap = h('div', { class: 'walk' + (opts.split ? ' split' : '') });
      let widgetBlock = opts.widget || null;
      if (widgetBlock) {
        const wEl = h('div', { class: 'walk-widget' });
        wrap.appendChild(wEl);
        Lab.mountBlock(widgetBlock, wEl, ctx);
      }
      const box = h('div', { class: 'steps' });
      const count = h('span', { class: 's-count' });
      const sTitle = h('span', { class: 's-title' });
      Lab.setHTML(sTitle, opts.title || 'Step by step');
      box.appendChild(h('div', { class: 'steps-head' }, sTitle, count));
      const list = h('ol', { class: 'steps-list' });
      const answered = steps.map(s => !s.ask);
      const askers = [];
      const items = steps.map((s, i) => {
        const li = h('li', { class: 'step', hidden: true },
          h('span', { class: 's-num', text: String(i + 1) }),
          h('div', { class: 's-body' }));
        const body = li.lastChild;
        if (s.html) { const p = h('div', { class: 'prose', style: { fontSize: '16.5px' } }); Lab.setHTML(p, s.html); body.appendChild(p); }
        if (s.math) body.appendChild(h('div', { class: 's-math', html: Lab.tex(s.math, true) }));
        if (s.note) { const n = h('div', { class: 'xs muted' }); Lab.setHTML(n, s.note); body.appendChild(n); }
        if (s.block) Lab.mountBlock(s.block, body, ctx);
        if (s.ask) {
          const a = s.ask;
          const input = h('input', { class: 'field mono', type: 'text', autocomplete: 'off', spellcheck: 'false', placeholder: a.placeholder || 'your answer, e.g. 3/36' });
          const go = h('button', { class: 'btn primary sm', type: 'button', text: 'Check' });
          const show = h('button', { class: 'btn ghost sm', type: 'button', text: 'Show me' });
          const fbk = h('div', { class: 'step-fb' });
          body.append(h('div', { class: 'step-ask' }, a.prompt ? h('div', { class: 'small', html: '' }) : null, h('div', { class: 'answer-row' }, input, go, show)), fbk);
          if (a.prompt) Lab.setHTML(body.querySelector('.step-ask .small'), a.prompt);
          const finish = (ok) => {
            answered[i] = true; input.disabled = true; go.disabled = true; show.hidden = true;
            input.classList.toggle('good', ok);
            const exact = Lab.F(a.answer);
            const m = typeof a.answer === 'string' && a.answer.match(/^\s*(-?\d+)\s*\/\s*(\d+)\s*$/);
            let ansTex = exact.approx ? Lab.fmtDec(exact.valueOf()) : exact.tex();
            if (m && (+m[1] !== exact.n || +m[2] !== exact.d)) ansTex = '\\frac{' + m[1] + '}{' + m[2] + '}=' + ansTex;
            fbk.className = 'step-fb ' + (ok ? 'good' : 'info');
            Lab.setHTML(fbk, (ok ? '<b class="cgood">✓ Correct.</b> ' : '<b>Answer:</b> ' + Lab.tex(ansTex) + '. ') + (a.explain || ''));
            paint();
          };
          go.addEventListener('click', () => {
            const r = Lab.answerMatches(input.value, a.answer, a.tol);
            if (r.error) { fbk.className = 'step-fb info'; Lab.setHTML(fbk, Lab.esc(r.error)); return; }
            if (r.ok) finish(true);
            else { input.classList.add('bad'); fbk.className = 'step-fb bad'; Lab.setHTML(fbk, a.hint || 'Not yet — check the previous step and try again.'); }
          });
          input.addEventListener('keydown', e => { if (e.key === 'Enter') go.click(); });
          show.addEventListener('click', () => { input.value = Lab.fmt(Lab.F(a.answer)); finish(false); });
          askers[i] = () => { if (!answered[i]) show.click(); };
        }
        list.appendChild(li);
        return li;
      });
      box.appendChild(list);
      const back = h('button', { class: 'btn ghost sm', type: 'button', html: I.arrowLeft + '<span>Back</span>' });
      const all = h('button', { class: 'btn ghost sm', type: 'button', text: 'Show all steps' });
      const next = h('button', { class: 'btn primary sm', type: 'button', html: '<span>Next step</span>' + I.arrowRight });
      const restart = h('button', { class: 'btn ghost sm', type: 'button', html: I.refresh + '<span>Replay</span>' });
      box.appendChild(h('div', { class: 'steps-foot' }, h('div', { class: 'btn-row' }, back, all), h('div', { class: 'btn-row' }, restart, next)));
      wrap.appendChild(box);
      el.appendChild(wrap);

      const W = () => (widgetBlock && widgetBlock.api) || widgetBlock;
      function paint() {
        items.forEach((li, i) => { li.hidden = i >= shown; li.classList.toggle('current', i === shown - 1); });
        count.textContent = shown + ' / ' + steps.length;
        back.disabled = shown <= 1;
        const blocked = shown > 0 && !answered[shown - 1];
        next.disabled = shown >= steps.length || blocked;
        next.title = blocked ? 'Answer this step first (or press Show me)' : '';
        all.hidden = shown >= steps.length;
        restart.hidden = shown < steps.length;
        next.hidden = shown >= steps.length;
        if (shown >= steps.length && ctx.onDone) ctx.onDone();
      }
      async function run(i, animate) {
        const s = steps[i];
        if (s && typeof s.on === 'function' && widgetBlock) {
          try { await s.on(W(), { animate }); } catch (e) { console.error(e); }
        }
      }
      async function replayTo(n) {
        if (widgetBlock && W() && typeof W().reset === 'function') W().reset();
        for (let i = 0; i < n; i++) await run(i, false);
      }
      async function go(n, animateLast) {
        if (busy) return; busy = true;
        try {
          const prev = shown;
          const target = Math.max(1, Math.min(steps.length, n));
          shown = target;
          if (target > prev && prev > 0 && animateLast) {
            paint();
            const li = items[target - 1];
            li.classList.add('enter');
            li.addEventListener('animationend', () => li.classList.remove('enter'), { once: true });
            for (let i = prev; i < target; i++) await run(i, i === target - 1);
          } else {
            await replayTo(shown);
            paint();
          }
          const cur = items[shown - 1];
          if (cur && animateLast && opts.scroll !== false) {
            const r = cur.getBoundingClientRect();
            if (r.bottom > window.innerHeight - 40) cur.scrollIntoView({ block: 'nearest', behavior: Lab.reducedMotion() ? 'auto' : 'smooth' });
          }
        } finally { busy = false; }
      }
      next.addEventListener('click', () => go(shown + 1, true));
      back.addEventListener('click', () => go(shown - 1, false));
      all.addEventListener('click', () => { askers.forEach(f => f && f()); go(steps.length, false); });
      restart.addEventListener('click', async () => { shown = 0; await go(1, false); });
      // first step
      shown = 0;
      (async () => { shown = Math.min(opts.start || 1, steps.length); await replayTo(shown); paint(); })();
    }, 'steps-block');
  };

  /* ----------------------------------------------------------------- checks */
  /**
   * Quick question with instant feedback. opts:
   *  q: question html
   *  type: 'mcq' (default when options given) | 'num' | 'multi'
   *  options: [html]           (mcq / multi)
   *  answer: index | [indices] | value ('1/12', 0.25, Frac)
   *  explain: html shown once answered correctly or revealed
   *  hint: html shown after a wrong attempt
   *  wrong: {index: html}     per-option feedback for mcq
   *  solution: [step html]    full worked solution behind "Show solution"
   *  label: small label above the question ("Quick check", "Predict")
   *  placeholder, suffix
   */
  Lab.check = function (opts) {
    return Lab.block((el, ctx) => {
      const type = opts.type || (opts.options ? (Array.isArray(opts.answer) ? 'multi' : 'mcq') : 'num');
      const box = h('div', { class: 'check' });
      if (Lab.dev) { box.dataset.type = type; box.dataset.answer = JSON.stringify(opts.answer instanceof Lab.Frac ? opts.answer.toString() : opts.answer); }
      const label = opts.label || (opts.predict ? 'Predict first' : 'Quick check');
      box.appendChild(h('div', { class: 'q-label', html: (opts.predict ? I.eye : I.target).replace('<svg', '<svg width="14" height="14"') + '<span>' + label + '</span>' }));
      const q = h('div', { class: 'q prose' }); Lab.setHTML(q, opts.q); box.appendChild(q);
      const fb = h('div');
      let attempts = 0, solved = false;
      if (ctx.gate) ctx.gate(box);

      function feedback(kind, title, html) {
        Lab.clear(fb);
        const f = h('div', { class: 'fb ' + kind }, h('div', { class: 'fb-title', html: (kind === 'good' ? I.check : kind === 'bad' ? I.x : I.info) + '<span>' + title + '</span>' }));
        if (html) { const d = h('div'); Lab.setHTML(d, html); f.appendChild(d); }
        fb.appendChild(f);
      }
      function done(correct) {
        if (ctx.ungate) ctx.ungate(box);
        if (correct) { solved = true; box.classList.add('solved'); }
      }
      function showSolution() {
        const parts = [];
        if (opts.explain) parts.push(opts.explain);
        feedback('info', 'Solution', parts.join(''));
        if (opts.solution) {
          const host = h('div', { style: { marginTop: '10px' } });
          fb.firstChild.appendChild(host);
          Lab.mountBlock(Lab.steps({ title: 'Solution, step by step', steps: opts.solution, scroll: false }), host, {});
        }
        done(false);
      }
      const actions = h('div', { class: 'check-actions' });
      const solBtn = h('button', { class: 'btn ghost sm', type: 'button', text: 'Show solution', hidden: true });
      solBtn.addEventListener('click', () => { solBtn.hidden = true; showSolution(); lock(); });
      let lock = () => {};

      if (type === 'mcq' || type === 'multi') {
        const wrap = h('div', { class: 'options' });
        const picked = new Set();
        const keys = 'ABCDEFGH';
        const btns = opts.options.map((o, i) => {
          const b = h('button', { class: 'opt', type: 'button' }, h('span', { class: 'o-key', text: keys[i] }), h('span', { class: 'o-text' }));
          Lab.setHTML(b.lastChild, o);
          b.addEventListener('click', () => {
            if (solved) return;
            if (type === 'mcq') { picked.clear(); btns.forEach(x => x.classList.remove('sel', 'wrong')); picked.add(i); b.classList.add('sel'); submit(); }
            else { if (picked.has(i)) { picked.delete(i); b.classList.remove('sel'); } else { picked.add(i); b.classList.add('sel'); } btns.forEach(x => x.classList.remove('wrong')); }
          });
          wrap.appendChild(b);
          return b;
        });
        box.appendChild(wrap);
        let submitBtn = null;
        if (type === 'multi') {
          submitBtn = h('button', { class: 'btn primary sm', type: 'button', text: 'Check' });
          submitBtn.addEventListener('click', submit);
          actions.appendChild(submitBtn);
          box.appendChild(h('div', { class: 'xs muted', style: { marginTop: '8px' }, text: 'Select every option that is true, then press Check.' }));
        }
        actions.appendChild(solBtn);
        box.appendChild(actions);
        lock = () => { btns.forEach((b, i) => { b.disabled = true; const right = type === 'mcq' ? i === opts.answer : opts.answer.includes(i); if (right) b.classList.add('right'); }); if (submitBtn) submitBtn.disabled = true; };
        function submit() {
          attempts++;
          let ok;
          if (type === 'mcq') ok = picked.has(opts.answer);
          else { const ans = new Set(opts.answer); ok = picked.size === ans.size && [...picked].every(i => ans.has(i)); }
          if (ok) {
            btns.forEach((b, i) => { if (picked.has(i)) { b.classList.remove('sel'); b.classList.add('right'); } b.disabled = true; });
            if (submitBtn) submitBtn.disabled = true;
            solBtn.hidden = true;
            feedback('good', opts.predict ? 'Good prediction' : 'Correct', opts.explain || '');
            done(true);
          } else {
            picked.forEach(i => { btns[i].classList.remove('sel'); btns[i].classList.add('wrong'); });
            const specific = type === 'mcq' && opts.wrong && opts.wrong[[...picked][0]];
            feedback('bad', opts.predict ? 'Not quite — keep this guess in mind' : 'Not yet', specific || opts.hint || 'Not quite. Read the question once more and try another option.');
            solBtn.hidden = false;
            if (opts.predict && ctx.ungate) ctx.ungate(box);
          }
        }
      } else {
        const input = h('input', { class: 'field mono', type: 'text', inputmode: 'decimal', autocomplete: 'off', spellcheck: 'false', placeholder: opts.placeholder || 'e.g. 3/36 or 0.083' });
        const go = h('button', { class: 'btn primary sm', type: 'button', text: 'Check' });
        const row = h('div', { class: 'answer-row' }, input, go);
        if (opts.suffix) row.appendChild(h('span', { class: 'unit', html: opts.suffix }));
        box.appendChild(row);
        actions.appendChild(solBtn);
        box.appendChild(actions);
        lock = () => { input.disabled = true; go.disabled = true; };
        function submit() {
          const res = Lab.answerMatches(input.value, opts.answer, opts.tol);
          if (res.error) { feedback('info', 'Can\'t read that', Lab.esc(res.error) + ' You can type a fraction like <code>3/36</code>, a decimal like <code>0.0833</code>, or an expression like <code>1/6*1/6</code>.'); return; }
          attempts++;
          input.classList.toggle('good', res.ok); input.classList.toggle('bad', !res.ok);
          if (res.ok) {
            const exact = Lab.F(opts.answer);
            const extra = !exact.approx && exact.d !== 1 ? '<p class="small muted">Exact value: ' + Lab.tex(exact.tex()) + ' ≈ ' + Lab.fmtDec(exact.valueOf(), 4) + '</p>' : '';
            feedback('good', 'Correct', (opts.explain || '') + extra);
            lock(); solBtn.hidden = true; done(true);
          } else {
            feedback('bad', 'Not yet', opts.hint || 'Check each step once more.');
            solBtn.hidden = false;
          }
        }
        go.addEventListener('click', submit);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      }
      box.appendChild(fb);
      el.appendChild(box);
    }, 'check-block');
  };

  /** "Words & symbols" list: [[TeX symbol, html meaning], ...] */
  Lab.words = function (items) {
    return Lab.block(el => {
      const box = h('div', { class: 'words' });
      items.forEach(([sym, meaning]) => {
        const row = h('div', { class: 'w-row' }, h('div', { class: 'w-sym', html: Lab.tex(sym) }), h('div', { class: 'w-mean' }));
        Lab.setHTML(row.lastChild, meaning);
        box.appendChild(row);
      });
      el.appendChild(box);
    });
  };

  /* --------------------------------------------------------------- lecture */
  /** Link into a YouTube lecture at a minute mark. */
  Lab.vlink = function (id, min, label) {
    const sec = Math.round(min * 60);
    return '<a class="vlink" href="https://www.youtube.com/watch?v=' + id + '&amp;t=' + sec + 's" target="_blank" rel="noopener">' + I.play + '<span>' + (label || (Math.floor(min) + ':' + String(Math.round((min % 1) * 60)).padStart(2, '0'))) + '</span></a>';
  };
  /** Block: list of [minute, html] marks for a lecture video. */
  Lab.timeline = function (id, marks) {
    return Lab.block(el => {
      const ol = h('ol', { class: 'timeline' });
      marks.forEach(([min, html]) => {
        const li = h('li', {}, h('span', { class: 'tl-time', html: Lab.vlink(id, min, Math.floor(min) + ':' + String(Math.round((min % 1) * 60)).padStart(2, '0')) }), h('span', { class: 'tl-text' }));
        Lab.setHTML(li.lastChild, html);
        ol.appendChild(li);
      });
      el.appendChild(ol);
    });
  };

  /* --------------------------------------------------------------- controls */
  /** Segmented control. items: [{label, value}] or strings. */
  Lab.seg = function (items, value, onChange) {
    const wrap = h('div', { class: 'seg', role: 'tablist' });
    const norm = items.map(it => (typeof it === 'object' ? it : { label: String(it), value: it }));
    const btns = norm.map(it => {
      const b = h('button', { type: 'button', role: 'tab' });
      Lab.setHTML(b, it.label);
      b.addEventListener('click', () => { set(it.value); onChange && onChange(it.value); });
      wrap.appendChild(b);
      return b;
    });
    function set(v) { value = v; btns.forEach((b, i) => { const on = Lab.sameVal(norm[i].value, v) || norm[i].value === v; b.classList.toggle('on', on); b.setAttribute('aria-selected', String(on)); }); }
    set(value);
    wrap.set = set;
    return wrap;
  };
  /** Range slider with label and live value. */
  Lab.slider = function ({ label, min, max, step = 1, value, fmt, onInput }) {
    const val = h('span', { class: 'val' });
    const input = h('input', { class: 'slider', type: 'range', min, max, step, value });
    const lbl = h('span', { class: 'lbl' });
    Lab.setHTML(lbl, label);
    const wrap = h('label', { class: 'control' }, lbl, input, val);
    function paint() {
      const v = parseFloat(input.value);
      val.textContent = fmt ? fmt(v) : String(v);
      input.style.setProperty('--pct', ((v - min) / (max - min)) * 100 + '%');
    }
    input.addEventListener('input', () => { paint(); onInput && onInput(parseFloat(input.value)); });
    paint();
    wrap.input = input;
    wrap.set = v => { input.value = v; paint(); };
    wrap.setRange = (lo, hi) => { min = lo; max = hi; input.min = lo; input.max = hi; paint(); };
    return wrap;
  };
  /** − value + stepper */
  Lab.numStepper = function ({ label, min, max, value, onChange }) {
    const span = h('span', { text: String(value) });
    const minus = h('button', { type: 'button', text: '−', 'aria-label': 'decrease' });
    const plus = h('button', { type: 'button', text: '+', 'aria-label': 'increase' });
    const lbl = h('span', { class: 'lbl' }); Lab.setHTML(lbl, label || '');
    const wrap = h('div', { class: 'control' }, lbl, h('div', { class: 'stepper-num' }, minus, span, plus));
    function set(v) { value = Math.max(min, Math.min(max, v)); span.textContent = String(value); minus.disabled = value <= min; plus.disabled = value >= max; }
    minus.addEventListener('click', () => { set(value - 1); onChange && onChange(value); });
    plus.addEventListener('click', () => { set(value + 1); onChange && onChange(value); });
    set(value);
    wrap.set = set;
    wrap.setRange = (lo, hi) => { min = lo; max = hi; set(value); };
    return wrap;
  };
  Lab.button = function (label, onClick, cls = 'btn sm') {
    const b = h('button', { class: cls, type: 'button' });
    Lab.setHTML(b, label);
    b.addEventListener('click', onClick);
    return b;
  };
})();
