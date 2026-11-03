/* Revise: the app shell. Hash routes, pages loaded on demand as script files (so the site works from the disk
   as well as from GitHub Pages), progress kept in this browser only.

   #/                       home: the two terms, the labs, the formulas
   #/term/2                 a term: its courses
   #/stats1                 a course: its weeks and the all-weeks revision
   #/stats1/w03[/section]   a week (or /all), optionally scrolled to a section
   #/labs[/coin[/binomial]][?n=10&p=1/2]   the labs, a lab, a topic with its values
   #/formulas[/stats1]      every formula, or one course's
   #/search?q=…             search headings and formulas
   #/practice…              the private copy only: Seek's questions to attempt, timed (practice.js) */
(function () {
  'use strict';
  const REV = (window.REV = window.REV || {});
  const $ = (s, r = document) => r.querySelector(s);
  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat(Infinity)) if (k != null && k !== false) el.append(k.nodeType ? k : document.createTextNode(String(k)));
    return el;
  };
  REV.h = h;
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  REV.esc = esc;

  /* ------------------------------------------------------------------ storage */
  const KEY = 'revise.v1';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  let store = load();
  REV.store = {
    get: (k, d) => (k in store ? store[k] : d),
    set: (k, v) => { store[k] = v; try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode: keep in memory */ } },
  };
  const isDone = id => !!(REV.store.get('done', {})[id]);
  const setDone = (id, v) => { const d = { ...REV.store.get('done', {}) }; if (v) d[id] = Date.now(); else delete d[id]; REV.store.set('done', d); };

  /* ------------------------------------------------------------------ data loading */
  let SITE = null;
  REV.site = data => { SITE = data; };
  REV.siteData = () => SITE;
  const pages = new Map(), waiting = new Map();
  REV.page = p => { const id = p.course + '/' + p.id; pages.set(id, p); (waiting.get(id) || []).forEach(f => f(p)); waiting.delete(id); };
  let FORMULAS = null, SEARCH = null;
  const dataWait = { formulas: [], search: [] };
  REV.formulas = list => { FORMULAS = list; dataWait.formulas.splice(0).forEach(f => f(list)); };
  REV.search = list => { SEARCH = list; dataWait.search.splice(0).forEach(f => f(list)); };
  const script = src => new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('could not load ' + src)); document.body.appendChild(s); });
  function getPage(course, id) {
    const key = course + '/' + id;
    if (pages.has(key)) return Promise.resolve(pages.get(key));
    return new Promise((res, rej) => {
      if (!waiting.has(key)) { waiting.set(key, []); script('p/' + course + '-' + id + '.js').catch(e => { waiting.delete(key); rej(e); }); }
      waiting.get(key).push(res);
    });
  }
  function getData(name) {
    const have = name === 'formulas' ? FORMULAS : SEARCH;
    if (have) return Promise.resolve(have);
    return new Promise((res, rej) => { if (!dataWait[name].length) script('data/' + name + '.js').catch(rej); dataWait[name].push(res); });
  }

  /* ------------------------------------------------------------------ icons */
  const I = {
    sigma: '<path d="M17 5H7l6 7-6 7h10"/>',
    grid: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h16M12 4v16"/>',
    curve: '<path d="M4 19c3-10 6-14 8-14s4 6 8 14"/>',
    book: '<path d="M5 4h9a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4z"/><path d="M5 16a4 4 0 0 1 4-4h9"/>',
    quote: '<path d="M7 7h4v4c0 3-2 5-4 6M14 7h4v4c0 3-2 5-4 6"/>',
    code: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
    flask: '<path d="M10 4h4M10 4v5l-5 9a1.5 1.5 0 0 0 1.3 2.2h11.4A1.5 1.5 0 0 0 19 18l-5-9V4"/><path d="M7.5 14h9"/>',
    formula: '<path d="M7 20c2 0 2-2 3-8s1-8 3-8M7 11h7"/><path d="M15 15l4 4M19 15l-4 4"/>',
    coin: '<circle cx="12" cy="12" r="8"/><path d="M12 8v8M9.5 10h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4"/>',
    dice: '<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="9" cy="9" r="1.2"/><circle cx="15" cy="15" r="1.2"/><circle cx="15" cy="9" r="1.2"/><circle cx="9" cy="15" r="1.2"/>',
    venn: '<circle cx="9.5" cy="12" r="5.5"/><circle cx="14.5" cy="12" r="5.5"/>',
    graph: '<circle cx="6" cy="7" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="12" cy="18" r="2"/><path d="M8 7h8M7 9l4 7M17 9l-4 7"/>',
    matrix: '<path d="M7 4H5v16h2M17 4h2v16h-2"/><path d="M9 9h1M14 9h1M9 15h1M14 15h1"/>',
    surface: '<path d="M3 16c3-4 6-6 9-6s6 2 9 6"/><path d="M5 19c3-3 5-4 7-4s4 1 7 4"/><path d="M8 12c1-3 2-5 4-5s3 2 4 5"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    arrow: '<path d="M9 5l7 7-7 7"/>',
    play: '<path d="M8 5.5v13l10-6.5z"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    find: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  };
  const icon = (name, cls) => '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true">' + (I[name] || I.book) + '</svg>';
  REV.icon = icon;

  /* ------------------------------------------------------------------ routing */
  function parse() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [p, q] = raw.split('?');
    // a hand-typed link may hold a raw % ("p=37%"): keep the text as it is rather than fail
    const dec = t => { try { return decodeURIComponent(t); } catch (e) { return t; } };
    const parts = p.split('/').filter(Boolean).map(dec);
    const query = {};
    (q || '').split('&').filter(Boolean).forEach(kv => { const i = kv.indexOf('='); query[dec(i < 0 ? kv : kv.slice(0, i))] = i < 0 ? '' : dec(kv.slice(i + 1)); });
    return { parts, query };
  }
  REV.go = (hash, replace) => { if (replace) history.replaceState(null, '', hash); else location.hash = hash; if (replace) route(); };
  REV.setQuery = (base, query) => {
    const q = Object.entries(query).filter(([, v]) => v !== '' && v != null).map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v).replace(/%2F/g, '/').replace(/%2C/g, ',').replace(/%3B/g, ';')).join('&');
    history.replaceState(null, '', base + (q ? '?' + q : ''));
  };

  const view = () => $('#view');
  let current = '';
  function route() {
    const { parts, query } = parse();
    const key = parts.join('/');
    const sameView = key.split('/').slice(0, 2).join('/') === current.split('/').slice(0, 2).join('/') && pages.size && /^\w+\/(w\d\d|all)/.test(key);
    closeSheet();
    if (sameView && parts[2]) { scrollToSection(parts[2]); current = key; return; }
    current = key;
    const v = view();
    v.innerHTML = '';
    v.className = '';
    document.body.dataset.route = parts[0] || 'home';
    if (parts[0] !== 'labs' || !parts[1]) labFind.lab = '';   // a lab opened from elsewhere starts with an empty find box
    try {
      if (!SITE) v.append(h('p', { class: 'empty', text: 'The site data did not load. Reload the page.' }));
      else if (!parts.length) home(v);
      else if (parts[0] === 'labs') labsRoute(v, parts, query);
      else if (parts[0] === 'formulas') formulas(v, parts[1], query.q || '');
      else if (parts[0] === 'search') search(v, query.q || '');
      else if (parts[0] === 'term') { const t = (SITE.terms || []).find(x => x.id === parts[1]); if (t) term(v, t); else notFound(v); }
      else if (parts[0] === 'practice' && SITE.practice) practiceRoute(v, parts, query);
      else {
        const c = SITE.courses.find(x => x.key === parts[0]);
        if (!c) notFound(v);
        else if (!parts[1]) course(v, c);
        else week(v, c, parts[1], parts[2]);
      }
    } catch (e) {
      console.error(e);
      v.append(h('div', { class: 'callout warn', text: 'This page could not be shown: ' + e.message }));
    }
    setBack(parts);
    panelState();
    if (!(parts[2] && /^(w\d\d|all)$/.test(parts[1] || ''))) window.scrollTo(0, 0);
  }
  // The panel button in the bar (wide screens) hides the page's side panel so the page fills the window: a week's
  // "On this page" rail (html.rail-off) or a lab's topic list (html.lab-nav-off). Each is kept in this browser for
  // every page of its kind; index.html sets both before the first paint.
  const PANELS = {
    rail: { cls: 'rail-off', key: 'railOff', show: ['Show the contents', 'Show “On this page”'], hide: ['Hide the contents', 'Hide “On this page”: the text fills the window'] },
    lab: { cls: 'lab-nav-off', key: 'labNavOff', show: ['Show the topics', 'Show the list of topics'], hide: ['Hide the topics', 'Hide the list of topics: the lab fills the window'] },
  };
  const panel = () => (document.querySelector('#view .lab-wrap') ? PANELS.lab : PANELS.rail);
  function panelState() {
    const btn = $('#rail-btn'), p = panel(), off = document.documentElement.classList.contains(p.cls), [label, tip] = off ? p.show : p.hide;
    if (!btn) return;
    btn.setAttribute('aria-expanded', off ? 'false' : 'true');
    btn.setAttribute('aria-label', label);
    btn.title = tip;
  }
  function setBack(parts) {
    const back = $('#back');
    let to = '#/';
    const c = SITE && SITE.courses.find(x => x.key === parts[0]);
    if (parts[0] === 'labs' && parts[1]) to = '#/labs';
    else if (parts[0] === 'practice' && parts[1]) to = parts[2] ? '#/practice/' + parts[1] : '#/practice';
    else if (c) to = parts[1] ? '#/' + c.key : c.term ? '#/term/' + c.term : '#/';
    back.href = to;
    back.hidden = !parts.length;
    document.body.classList.toggle('at-home', !parts.length);
  }
  const title = (t, bar) => { document.title = t ? t + ' · Revise' : 'Revise'; $('#bar-title').textContent = bar || ''; };
  REV.title = title;
  REV.script = script;

  /* ------------------------------------------------------------------ home */
  function home(v) {
    title('', '');
    v.className = 'home';
    v.append(h('header', { class: 'hero' },
      h('h1', { text: 'Revise' }),
      h('p', { text: 'Week by week, every topic from the lectures, explained from the basics with every step. Labs to play with, and every formula in one place.' })));
    const grid = h('div', { class: 'tiles' });
    for (const t of SITE.terms || []) {
      const cs = t.courses.map(k => SITE.courses.find(c => c.key === k)).filter(Boolean);
      const weeks = cs.reduce((a, c) => a + c.weeks.length, 0);
      const done = cs.reduce((a, c) => a + c.weeks.filter(w => isDone(c.key + '/' + w.id)).length, 0);
      grid.append(h('a', { class: 'tile tile-term', href: '#/term/' + t.id },
        h('span', { class: 'tile-ic tile-num', text: t.id }),
        h('span', { class: 'tile-t' }, h('b', { text: t.name }), h('small', { text: t.when })),
        h('span', { class: 'tile-meta tile-list' }, cs.map(c => h('span', { class: 'chip', html: icon(c.icon) + esc(c.name) }))),
        h('span', { class: 'tile-meta' }, h('span', { text: cs.length + ' courses · ' + weeks + ' weeks' + (done ? ' · ' + done + ' revised' : '') })),
        done ? h('span', { class: 'tile-bar', style: '--p:' + Math.round(100 * done / weeks) + '%' }) : null));
    }
    v.append(grid);
    const more = h('div', { class: 'tiles tiles-more' });
    if (SITE.practice) {
      const n = Object.values(SITE.practice).reduce((a, sets) => a + sets.length, 0);
      more.append(h('a', { class: 'tile tile-wide', href: '#/practice' },
        h('span', { class: 'tile-ic', html: icon('check') }),
        h('span', { class: 'tile-t' }, h('b', { text: 'Practice' }), h('small', { text: 'Seek’s activity questions and assignments, timed' })),
        h('span', { class: 'tile-meta' }, h('span', { text: n + ' sets' }))));
    }
    const nFormulas = SITE.formulaCount || null;
    more.append(h('a', { class: 'tile tile-wide', href: '#/labs' },
      h('span', { class: 'tile-ic', html: icon('flask') }),
      h('span', { class: 'tile-t' }, h('b', { text: 'Labs' }), h('small', { text: SITE.labs.map(l => l.title.replace(/ lab$/, '')).join(' · ') })),
      h('span', { class: 'tile-meta' }, h('span', { text: SITE.labs.length + ' labs, ' + SITE.labs.reduce((a, l) => a + l.topics.length, 0) + ' topics' }))));
    more.append(h('a', { class: 'tile tile-wide', href: '#/formulas' },
      h('span', { class: 'tile-ic', html: icon('formula') }),
      h('span', { class: 'tile-t' }, h('b', { text: 'Formulas' }), h('small', { text: 'Every formula of every week, searchable' })),
      h('span', { class: 'tile-meta' }, h('span', { text: nFormulas ? nFormulas + ' formulas' : 'Statistics, Mathematics, Python' }))));
    v.append(more);
    const ios = /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone;
    if (ios) v.append(h('p', { class: 'install', html: 'On your iPhone: tap <b>Share</b>, then <b>Add to Home Screen</b>. It opens full screen and works offline after the first visit.' }));
  }

  /* ------------------------------------------------------------------ term */
  function term(v, t) {
    title(t.name, t.name + ' · ' + t.when);
    v.className = 'home';
    v.append(h('header', { class: 'phead' }, h('div', { class: 'eyebrow', text: t.when }), h('h1', { text: t.name })));
    const grid = h('div', { class: 'tiles' });
    for (const c of t.courses.map(k => SITE.courses.find(x => x.key === k)).filter(Boolean)) {
      const ready = c.weeks.filter(w => w.ready).length + (c.all && c.all.ready ? 1 : 0);
      const total = c.weeks.length + 1;
      const done = c.weeks.filter(w => isDone(c.key + '/' + w.id)).length;
      grid.append(h('a', { class: 'tile', href: '#/' + c.key },
        h('span', { class: 'tile-ic', html: icon(c.icon) }),
        h('span', { class: 'tile-t' }, h('b', { text: c.name }), h('small', { text: c.full })),
        h('span', { class: 'tile-meta' }, h('span', { text: ready < total ? ready + ' of ' + total + ' pages ready' : c.weeks.length + ' weeks' + (done ? ' · ' + done + ' revised' : '') })),
        done ? h('span', { class: 'tile-bar', style: '--p:' + Math.round(100 * done / c.weeks.length) + '%' }) : null));
    }
    v.append(grid);
  }

  // the private copy's practice mode lives in practice.js, loaded on first use
  function practiceRoute(v, parts, query) {
    if (REV.practice) return REV.practice(v, parts, query);
    v.append(h('div', { class: 'loading', text: 'Loading…' }));
    const hash = location.hash;
    script('practice.js').then(() => { if (location.hash === hash) route(); })
      .catch(e => { v.innerHTML = ''; v.append(h('p', { class: 'empty', text: 'Practice did not load (' + e.message + ').' })); });
  }

  /* ------------------------------------------------------------------ course */
  function course(v, c) {
    title(c.name, c.name);
    v.className = 'course';
    v.append(h('header', { class: 'phead' },
      h('div', { class: 'eyebrow', text: c.full + ' · ' + ((SITE.terms || []).find(t => t.id === c.term) || { name: c.group }).name }),
      h('h1', { text: c.name }),
      c.blurb ? h('p', { class: 'lede', text: c.blurb }) : null));
    const list = h('ol', { class: 'weeks' });
    const row = (w, label, href) => h('li', { class: 'wk' + (w.ready ? '' : ' wk-soon') + (isDone(c.key + '/' + w.id) ? ' wk-done' : '') },
      h(w.ready ? 'a' : 'div', { class: 'wk-a', href: w.ready ? href : null },
        h('span', { class: 'wk-n', text: label }),
        h('span', { class: 'wk-t' }, h('b', { text: w.title }),
          h('small', { text: w.ready ? (w.topics || []).slice(0, 4).join(' · ') + ((w.topics || []).length > 4 ? ' …' : '') : 'Being written' })),
        h('span', { class: 'wk-s', html: isDone(c.key + '/' + w.id) ? icon('check') : w.ready ? icon('arrow') : '' })));
    for (const w of c.weeks) list.append(row(w, String(w.n), '#/' + c.key + '/' + w.id));
    v.append(list);
    if (c.all) {
      v.append(h('h2', { class: 'sec', text: 'All weeks' }));
      const all = h('ol', { class: 'weeks' });
      all.append(row({ ...c.all, title: 'Complete revision of every week' }, '∑', '#/' + c.key + '/all'));
      v.append(all);
    }
    const fm = h('a', { class: 'pill-link', href: '#/formulas/' + c.key, html: icon('formula') + '<span>' + esc(c.name) + ' formulas</span>' });
    const labsFor = SITE.labs.filter(l => l.topics.some(t => (t.for || []).some(f => f.startsWith(c.key + '/'))));
    v.append(h('div', { class: 'course-links' }, fm, labsFor.map(l => h('a', { class: 'pill-link', href: '#/labs/' + l.id, html: icon(l.icon) + '<span>' + esc(l.title) + '</span>' }))));
  }

  /* ------------------------------------------------------------------ week */
  function week(v, c, id, anchor) {
    const w = id === 'all' ? c.all : c.weeks.find(x => x.id === id);
    if (!w) return notFound(v);
    const label = id === 'all' ? 'All weeks' : 'Week ' + w.n;
    title(c.name + ' ' + label, c.name + ' · ' + label);
    v.className = 'week';
    if (!w.ready) {
      v.append(h('header', { class: 'phead' }, h('div', { class: 'eyebrow', text: c.name + ' · ' + label }), h('h1', { text: w.title }),
        h('p', { class: 'lede', text: 'This page is being written. The lectures of this week:' })), lectures(w.lectures));
      return;
    }
    v.append(h('div', { class: 'loading', text: 'Loading…' }));
    getPage(c.key, id).then(p => {
      if (current.split('/').slice(0, 2).join('/') !== c.key + '/' + id) return;
      v.innerHTML = '';
      const key = c.key + '/' + id;
      const toc = h('nav', { class: 'toc', 'aria-label': 'On this page' },
        h('ol', {}, p.toc.filter(t => t.level === 2).map(t => h('li', {}, h('a', { href: '#/' + key + '/' + t.id, 'data-id': t.id, text: t.title })))));
      // the rail's heading sits outside the nav, so the Contents sheet (which shows a copy of the nav) has one heading
      const rail = h('aside', { class: 'rail' }, h('div', { class: 'toc-h', text: 'On this page' }), toc);
      const done = h('button', { class: 'btn done-btn' + (isDone(key) ? ' on' : ''), type: 'button', html: icon('check') + '<span>' + (isDone(key) ? 'Revised' : 'Mark as revised') + '</span>' });
      done.addEventListener('click', () => { const on = !isDone(key); setDone(key, on); done.classList.toggle('on', on); done.lastChild.textContent = on ? 'Revised' : 'Mark as revised'; });
      const idx = c.weeks.findIndex(x => x.id === id);
      const prev = id === 'all' ? c.weeks[c.weeks.length - 1] : c.weeks[idx - 1];
      const next = id === 'all' ? null : (c.weeks[idx + 1] || (c.all && c.all.ready ? c.all : null));
      const nav = h('nav', { class: 'pager' },
        prev ? h('a', { href: '#/' + c.key + '/' + prev.id, class: 'pg' }, h('small', { text: '← ' + (prev.n ? 'Week ' + prev.n : 'All weeks') }), h('b', { text: prev.title })) : h('span'),
        next ? h('a', { href: '#/' + c.key + '/' + next.id, class: 'pg pg-next' }, h('small', { text: (next.n ? 'Week ' + next.n : 'All weeks') + ' →' }), h('b', { text: next.title })) : h('span'));
      const article = h('article', { class: 'doc', html: p.html });
      const tocBtn = h('button', { class: 'toc-fab', type: 'button', html: icon('list') + '<span>Contents</span>' });
      tocBtn.addEventListener('click', () => openSheet(toc.cloneNode(true), 'On this page'));
      const sets = SITE.practice && id !== 'all' ? (SITE.practice[c.key] || []).filter(x => x.week === w.n) : [];
      const ga = sets.find(x => x.kind === 'GA');
      const practiceLinks = sets.length ? h('div', { class: 'pr-links' },
        h('a', { class: 'pill-link', href: '#/practice/' + c.key + '?w=' + w.n, html: icon('check') + '<span>Activity &amp; practice questions · ' + sets.filter(x => x.kind !== 'GA').length + ' sets</span>' }),
        ga ? h('a', { class: 'pill-link', href: '#/practice/' + c.key + '/' + ga.id, html: icon('check') + '<span>Graded assignment</span>' }) : null) : null;
      v.append(
        h('header', { class: 'phead' }, h('div', { class: 'eyebrow', text: c.name + ' · ' + label }), h('h1', { text: p.title }), p.summary ? h('p', { class: 'lede', text: p.summary }) : null,
          practiceLinks, p.lectures && p.lectures.length ? lectures(p.lectures) : null),
        h('div', { class: 'doc-wrap' }, article, rail),
        h('div', { class: 'doc-end' }, done), nav, tocBtn);
      wireDoc(article, key);
      spy(article, toc);
      // arriving at a section: jump there once the fonts have loaded (they change the height of the text above)
      if (anchor) requestAnimationFrame(() => { article.getBoundingClientRect(); document.fonts.ready.then(() => scrollToSection(anchor, true)); });
    }).catch(e => { v.innerHTML = ''; v.append(h('div', { class: 'callout warn', text: 'This page could not be loaded (' + e.message + '). Check the connection and reload.' })); });
  }
  function lectures(list) {
    const fmt = s => s ? Math.floor(s / 60) + ' min' : '';
    return h('details', { class: 'lects' }, h('summary', { html: icon('play') + '<span>' + list.length + ' lecture' + (list.length === 1 ? '' : 's') + ' this week</span>' }),
      h('ol', {}, list.map(l => h('li', {}, h('a', { href: 'https://www.youtube.com/watch?v=' + l.video, target: '_blank', rel: 'noopener' },
        h('span', { class: 'lc-code', text: l.code }), h('span', { class: 'lc-t', text: l.title }), h('span', { class: 'lc-d', text: fmt(l.seconds) }))))));
  }
  /** In-page links (#section, #f3) scroll inside the page instead of changing the route. */
  function wireDoc(article, key) {
    article.addEventListener('click', e => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (href.startsWith('#') && !href.startsWith('#/')) { e.preventDefault(); history.replaceState(null, '', '#/' + key + '/' + href.slice(1)); scrollToSection(href.slice(1)); }
    });
  }
  function scrollToSection(id, jump) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 64;
    window.scrollTo({ top, behavior: jump || matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1400);
  }
  /** Keep the line being read where it is while the text reflows to a new width (the contents rail hidden or shown):
      find the innermost block under the line just below the top bar, and scroll so the same point of it stays there. */
  function keepPlace(article, change) {
    if (!article) return change();
    const line = 72;
    let el = article;
    for (let i = 0; i < 12; i++) {
      const kid = [...el.children].find(k => { const b = k.getBoundingClientRect(); return b.height > 0 && b.bottom > line; });
      if (!kid) break;
      el = kid;
      if (kid.getBoundingClientRect().top >= line || kid.matches('p, li, h2, h3, h4, pre, tr, summary, .md, svg, img')) break;
    }
    const a = el.getBoundingClientRect();
    const f = a.height ? Math.min(1, Math.max(0, (line - a.top) / a.height)) : 0;
    change();
    const b = el.getBoundingClientRect();
    window.scrollBy(0, (b.top + f * b.height) - (a.top + f * a.height));
  }
  /** How far down the page: while the reader moves the page (wheel, touch, a scroll key or the scroll bar), a tag beside
      the scroll bar's thumb shows the share of the page above the window, 0% at the top and 100% at the bottom, and
      fades a moment after the page stops. The page's own jumps (a new page, a contents link, the panel button) show none. */
  function scrollTag() {
    const root = document.documentElement, tag = h('div', { id: 'scroll-pct', 'aria-hidden': 'true' });
    document.body.append(tag);
    const KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);
    let moved = -1e9, held = false, frame = 0, idle = 0;
    const move = () => { moved = performance.now(); };
    addEventListener('wheel', move, { passive: true });
    addEventListener('touchmove', move, { passive: true });
    addEventListener('keydown', e => { if (KEYS.has(e.key) && !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) move(); });
    // a press on the page's scroll bar lands on <html>, or at the window's right edge where a floating bar sits
    addEventListener('pointerdown', e => { held = e.target === root || e.clientX >= root.clientWidth - 14 || e.button === 1; }, true);
    addEventListener('pointerup', () => { held = false; }, true);
    addEventListener('pointercancel', () => { held = false; }, true);
    // a new page starts at its top without the tag, even straight after a scroll
    addEventListener('hashchange', () => { moved = -1e9; tag.classList.remove('on'); });
    const show = () => {
      frame = 0;
      const H = innerHeight, full = root.scrollHeight, max = full - H;
      if (max < 1) return;
      const y = scrollY, f = Math.min(1, Math.max(0, y / max));
      const thumb = Math.max(32, H * H / full);   // the thumb's length, near enough
      const top = $('#bar').getBoundingClientRect().bottom + 6;
      const fab = $('.toc-fab'), fb = fab && fab.getBoundingClientRect();
      const bottom = (fb && fb.height ? fb.top : H) - 6;
      const th = tag.offsetHeight;
      tag.textContent = (y >= max - 2 ? 100 : Math.floor(f * 100)) + '%';
      tag.style.setProperty('--sb', innerWidth - root.clientWidth + 'px');
      tag.style.transform = 'translateY(' + Math.round(Math.max(top, Math.min(bottom - th, thumb / 2 + f * (H - thumb) - th / 2))) + 'px)';
      tag.classList.add('on');
      clearTimeout(idle);
      idle = setTimeout(() => tag.classList.remove('on'), 900);
    };
    addEventListener('scroll', () => {
      if (!frame && (held || tag.classList.contains('on') || performance.now() - moved < 700)) frame = requestAnimationFrame(show);
    }, { passive: true });
  }
  /** Highlight the section being read in the table of contents. */
  function spy(article, toc) {
    if (!('IntersectionObserver' in window)) return;
    const links = new Map([...toc.querySelectorAll('a[data-id]')].map(a => [a.dataset.id, a]));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { links.forEach(a => a.classList.remove('on')); const a = links.get(en.target.id); if (a) a.classList.add('on'); } });
    }, { rootMargin: '-70px 0px -70% 0px' });
    article.querySelectorAll('h2[id]').forEach(el => io.observe(el));
  }

  /* ------------------------------------------------------------------ labs */
  const labLoads = new Map();   // lab script → its loading promise; a lab's scripts load the first time it is opened
  function labsRoute(v, parts, query) {
    if (!parts[1]) return labsIndex(v);
    const def = SITE.labs.find(l => l.id === parts[1]);
    if (!def) return notFound(v);
    const files = (SITE.labFiles || {})[def.id] || [];
    if (files.some(f => !labLoads.has(f) || !labLoads.get(f).done)) {
      v.append(h('div', { class: 'loading', text: 'Loading the lab…' }));
      const hash = location.hash;
      Promise.all(files.map(f => {
        if (!labLoads.has(f)) { const pr = script(f).then(() => { pr.done = true; }); labLoads.set(f, pr); }
        return labLoads.get(f);
      })).then(() => { if (location.hash === hash) route(); })
        .catch(e => { v.innerHTML = ''; v.append(h('p', { class: 'empty', text: 'This lab did not load (' + e.message + '). Check the connection and reload.' })); });
      return;
    }
    const impl = REV.labs && REV.labs[def.id];
    const topic = def.topics.find(t => t.id === parts[2]) || def.topics[0];
    title(def.title + ' · ' + topic.title, def.title);
    v.className = 'lab';
    if (labFind.lab !== def.id) Object.assign(labFind, { lab: def.id, q: '', top: 0 });
    const nav = labNav(def, topic);
    const body = h('div', { class: 'lab-body' });
    const main = h('div', { class: 'lab-main' }, h('header', { class: 'phead' }, h('div', { class: 'eyebrow', text: def.group + ' · ' + def.title }), h('h1', { text: topic.title })), body);
    const topicsBtn = h('button', { class: 'toc-fab', type: 'button', html: icon('list') + '<span>Topics</span>' });
    topicsBtn.addEventListener('click', () => openSheet(labNav(def, topic), def.title));
    v.append(h('div', { class: 'lab-wrap' }, nav, main), topicsBtn);
    // the list stays where it was scrolled to while the reader moves between this lab's topics; arriving from
    // another lab or page, it shows the topic that is open
    const on = nav.querySelector('a.on');
    if (labFind.top) nav.scrollTop = labFind.top;
    else if (on && on.offsetTop + on.offsetHeight > nav.clientHeight) nav.scrollTop = on.offsetTop - nav.clientHeight / 3;
    nav.addEventListener('scroll', () => { labFind.top = nav.scrollTop; }, { passive: true });
    if (!impl || !impl.topics || !impl.topics[topic.id]) { body.append(h('div', { class: 'callout note', text: 'This lab topic is being built.' })); return; }
    const ctx = { base: '#/labs/' + def.id + '/' + topic.id, def, topic, used: new Set() };
    try { impl.topics[topic.id](body, query, ctx); }
    catch (e) { console.error(e); body.append(h('div', { class: 'callout warn', text: 'This lab could not start: ' + e.message })); }
    // a link from a page whose values the topic never reads opens it with its defaults instead (tools/check.mjs --links)
    const unread = Object.keys(query || {}).filter(k => ctx.used.size && !ctx.used.has(k));
    if (unread.length) console.warn('[lab] ' + def.id + '/' + topic.id + ' does not read the link value(s): ' + unread.join(', '));
    const used = (topic.for || []).map(f => { const [ck, wid] = f.split('/'); const c = SITE.courses.find(x => x.key === ck); const w = c && c.weeks.find(x => x.id === wid); return c && w ? h('a', { class: 'pill-link sm', href: '#/' + ck + '/' + wid, text: c.name + ' · Week ' + w.n }) : null; }).filter(Boolean);
    if (used.length) main.append(h('div', { class: 'used-in' }, h('span', { text: 'Revise it in' }), used));
  }
  // A lab's topics: down the side on wide screens (the panel button in the bar hides the list: html.lab-nav-off), in a
  // sheet from the Topics button on narrow ones. The box finds topics by the words of their titles, their search words
  // (labs.json "keys") and their weeks; other labs' topics that match are listed under it. What was typed is kept
  // while the reader moves between the topics of one lab (labFind).
  const labFind = { lab: '', q: '', top: 0 };
  const words = s => String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(Boolean);
  let labIndex = null;
  function labTopics() {
    if (!labIndex) labIndex = SITE.labs.flatMap(l => l.topics.map(t => {
      const weeks = (t.for || []).flatMap(f => { const [ck, wid] = f.split('/'), n = Number(wid.slice(1)), c = SITE.courses.find(x => x.key === ck); return c ? [c.name, ck, 'week ' + n, 'w' + n, wid] : []; });
      const own = words([t.title, t.keys || '', ...weeks].join(' '));
      // a topic of another lab is also found by its lab's name ("coin binomial"); in its own lab that name finds them all
      return { l, t, href: '#/labs/' + l.id + '/' + t.id, own, all: own.concat(words(l.title)) };
    }));
    return labIndex;
  }
  // every word typed starts a word of the topic ("order" finds "ordered"); a number must be the whole number
  const finds = (ws, q) => q.every(w => (/^\d+$/.test(w) ? ws.includes(w) : ws.some(t => t.startsWith(w))));
  function labNav(def, topic) {
    const all = labTopics(), mine = all.filter(x => x.l === def), others = all.filter(x => x.l !== def);
    const link = (x, text) => { const on = x.l === def && x.t === topic; return h('a', { href: x.href, class: on ? 'on' : null, 'aria-current': on ? 'page' : null, text: text || x.t.title }); };
    const input = h('input', { class: 'field ln-in', type: 'search', placeholder: 'Find a topic', value: labFind.q, autocomplete: 'off', spellcheck: 'false', 'aria-label': 'Find a topic of the ' + def.title });
    const count = h('div', { class: 'toc-h' });
    const items = mine.map(x => h('li', {}, link(x)));
    const none = h('p', { class: 'ln-none' });
    const elseH = h('div', { class: 'toc-h ln-else', text: 'Other labs' }), elseList = h('ol', { class: 'ln-list' });
    const nav = h('nav', { class: 'lab-nav', 'aria-label': def.title + ' topics' },
      h('div', { class: 'ln-find', html: icon('find') }, input), count, h('ol', { class: 'ln-list' }, items), none, elseH, elseList);
    const draw = () => {
      const q = words(input.value);
      let shown = 0;
      mine.forEach((x, i) => { const hit = !q.length || finds(x.own, q); items[i].hidden = !hit; if (hit) shown++; });
      count.textContent = q.length ? shown + ' of ' + mine.length + ' topics' : mine.length + ' topics';
      none.hidden = shown > 0;
      none.textContent = 'No topic here matches “' + input.value.trim() + '”.';
      const more = q.length ? others.filter(x => finds(x.all, q)).slice(0, 8) : [];
      elseList.replaceChildren(...more.map(x => h('li', {}, link(x, x.l.title.replace(/ lab$/, '') + ' · ' + x.t.title))));
      elseH.hidden = elseList.hidden = !more.length;
      labFind.q = input.value;
    };
    const shownLinks = () => [...nav.querySelectorAll('li:not([hidden]) > a')];
    input.addEventListener('input', draw);
    // Enter opens the first topic found; the arrow keys walk down and up the list; Escape empties the box
    nav.addEventListener('keydown', e => {
      const links = shownLinks();
      if (e.target === input) {
        if (e.key === 'Enter' && links.length) { e.preventDefault(); location.hash = links[0].getAttribute('href'); }
        else if (e.key === 'ArrowDown' && links.length) { e.preventDefault(); links[0].focus(); }
        else if (e.key === 'Escape' && input.value) { e.stopPropagation(); input.value = ''; draw(); }
        return;
      }
      const i = links.indexOf(e.target);
      if (i < 0 || (e.key !== 'ArrowDown' && e.key !== 'ArrowUp')) return;
      e.preventDefault();
      if (e.key === 'ArrowUp' && i === 0) input.focus();
      else links[Math.max(0, Math.min(links.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)))].focus();
    });
    draw();
    return nav;
  }
  function labsIndex(v) {
    title('Labs', 'Labs');
    v.className = 'labs';
    v.append(h('header', { class: 'phead' }, h('h1', { text: 'Labs' }), h('p', { class: 'lede', text: 'Play with the ideas. Pick a lab, then a topic; change any value and every step is worked out again.' })));
    for (const g of [...new Set(SITE.labs.map(l => l.group))]) {
      v.append(h('h2', { class: 'sec', text: g }));
      const grid = h('div', { class: 'labgrid' });
      SITE.labs.filter(l => l.group === g).forEach(l => grid.append(h('section', { class: 'labtile' },
        h('a', { class: 'labtile-h', href: '#/labs/' + l.id }, h('span', { class: 'tile-ic', html: icon(l.icon) }), h('span', {}, h('b', { text: l.title }), h('small', { text: l.blurb }))),
        h('div', { class: 'chips wrap' }, l.topics.map(t => h('a', { class: 'chip', href: '#/labs/' + l.id + '/' + t.id, text: t.title }))))));
      v.append(grid);
    }
  }

  /* ------------------------------------------------------------------ formulas */
  function formulas(v, only, q) {
    title('Formulas', 'Formulas');
    v.className = 'formulas';
    v.append(h('header', { class: 'phead' }, h('h1', { text: 'Formulas' }), h('p', { class: 'lede', text: 'Every formula of every week, with a link back to where it is explained.' })));
    const withF = SITE.courses.filter(c => c.weeks.some(w => w.ready));
    const chips = h('div', { class: 'chips' }, h('a', { class: 'chip' + (!only ? ' on' : ''), href: '#/formulas', text: 'All' }),
      withF.map(c => h('a', { class: 'chip' + (only === c.key ? ' on' : ''), href: '#/formulas/' + c.key, text: c.name })));
    const input = h('input', { class: 'field search-in', type: 'search', placeholder: 'Find a formula…', value: q, 'aria-label': 'Find a formula' });
    const out = h('div', { class: 'fm-list' }, h('div', { class: 'loading', text: 'Loading…' }));
    v.append(chips, input, out);
    getData('formulas').then(list => {
      const draw = () => {
        const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
        out.innerHTML = '';
        let n = 0;
        for (const c of SITE.courses) {
          if (only && c.key !== only) continue;
          const mine = list.filter(f => f.c === c.key && words.every(wd => (f.t + ' ' + f.wt).toLowerCase().includes(wd)));
          if (!mine.length) continue;
          out.append(h('h2', { class: 'sec', text: c.name }));
          for (const wkn of [...new Set(mine.map(f => f.w))].sort((a, b) => (a || 99) - (b || 99))) {
            const fs = mine.filter(f => f.w === wkn);
            out.append(h('h3', { class: 'fm-week' }, h('a', { href: '#/' + c.key + '/' + fs[0].p, text: (wkn ? 'Week ' + wkn + ' · ' : '') + fs[0].wt })));
            fs.forEach(f => { n++; const card = h('div', { class: 'fm-item', html: f.html }); card.append(h('a', { class: 'fm-go', href: '#/' + c.key + '/' + f.p + '/' + f.id, text: 'Where it is explained →' })); out.append(card); });
          }
        }
        if (!n) out.append(h('p', { class: 'empty', text: words.length ? 'No formula matches “' + input.value + '”.' : 'No formulas yet.' }));
      };
      input.addEventListener('input', () => { REV.setQuery('#/formulas' + (only ? '/' + only : ''), { q: input.value }); draw(); });
      draw();
    }).catch(() => { out.innerHTML = '<p class="empty">The formulas could not be loaded.</p>'; });
  }

  /* ------------------------------------------------------------------ search */
  function search(v, q) {
    title('Search', 'Search');
    v.className = 'search';
    const input = h('input', { class: 'field search-in', type: 'search', placeholder: SITE.practice ? 'Search topics, formulas, labs and Seek questions…' : 'Search topics, formulas and labs…', value: q, 'aria-label': 'Search' });
    const out = h('div', { class: 'results' });
    v.append(h('header', { class: 'phead' }, h('h1', { text: 'Search' })), input, out);
    setTimeout(() => input.focus(), 50);
    getData('search').then(list => {
      const labsList = SITE.labs.flatMap(l => l.topics.map(t => ({ lab: l, t })));
      const draw = () => {
        const words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
        out.innerHTML = '';
        if (!words.length) return;
        const hit = s => words.every(wd => s.toLowerCase().includes(wd));
        const labHits = labsList.filter(x => hit(x.t.title + ' ' + x.lab.title)).slice(0, 8);
        const pageHits = list.filter(x => x.p !== 'practice' && hit(x.t)).slice(0, 60);
        // the private copy also finds Seek's sets and questions (by title, kind or words of the question)
        const practiceHits = list.filter(x => x.p === 'practice' && hit(x.t + ' ' + x.k + ' ' + (x.s || ''))).sort((a, b) => !!a.s - !!b.s).slice(0, 60);
        if (labHits.length) out.append(h('h2', { class: 'sec', text: 'Labs' }), h('div', { class: 'chips wrap' }, labHits.map(x => h('a', { class: 'chip', href: '#/labs/' + x.lab.id + '/' + x.t.id, text: x.lab.title.replace(/ lab$/, '') + ': ' + x.t.title }))));
        if (pageHits.length) {
          out.append(h('h2', { class: 'sec', text: 'In the weeks' }));
          const ul = h('ul', { class: 'hits' });
          pageHits.forEach(x => { const c = SITE.courses.find(cc => cc.key === x.c); ul.append(h('li', {}, h('a', { href: '#/' + x.c + '/' + x.p + '/' + x.a }, h('b', { text: x.t }), h('small', { text: (c ? c.name : x.c) + ' · ' + (x.w ? 'Week ' + x.w : 'All weeks') + (x.f ? ' · formula' : '') })))); });
          out.append(ul);
        }
        if (practiceHits.length) {
          out.append(h('h2', { class: 'sec', text: 'Practice' }));
          const ul = h('ul', { class: 'hits' });
          practiceHits.forEach(x => { const c = SITE.courses.find(cc => cc.key === x.c); ul.append(h('li', {}, h('a', { href: '#/practice/' + x.c + '/' + x.a }, h('b', { text: x.s ? x.s : x.t }), h('small', { text: (c ? c.name : x.c) + ' · Week ' + x.w + ' · ' + x.k + (x.s ? ' · ' + x.t.slice(0, 90) + (x.t.length > 90 ? '…' : '') : '') })))); });
          out.append(ul);
        }
        if (!labHits.length && !pageHits.length && !practiceHits.length) out.append(h('p', { class: 'empty', text: 'Nothing found for “' + input.value + '”.' }));
      };
      input.addEventListener('input', () => { REV.setQuery('#/search', { q: input.value }); draw(); });
      draw();
    });
  }

  function notFound(v) { title('Not found', ''); v.append(h('header', { class: 'phead' }, h('h1', { text: 'Not found' }), h('p', { class: 'lede', html: 'That page does not exist. <a href="#/">Go home</a>.' }))); }

  /* ------------------------------------------------------------------ sheet + settings */
  // a sheet from the bottom, or with an anchor a dropdown under that button (settings)
  function openSheet(content, heading, anchor) {
    closeSheet();
    const sheet = h('div', { class: 'sheet' + (anchor ? ' drop' : ''), role: 'dialog', 'aria-label': heading },
      h('div', { class: 'sheet-bar' }, h('i', { class: 'sheet-handle' }), h('b', { text: heading }), h('button', { class: 'btn sm', type: 'button', text: 'Done', onclick: closeSheet })),
      h('div', { class: 'sheet-body' }, content));
    sheet.addEventListener('click', e => { if (e.target.closest('a[href^="#/"]')) setTimeout(closeSheet, 0); });
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      sheet.style.top = Math.round(r.bottom + 8) + 'px';
      sheet.style.right = Math.max(8, Math.round(innerWidth - r.right)) + 'px';
    }
    document.body.append(sheet);
    // a drop-down under a button far from the right edge (a phone) is moved left only as far as the screen allows
    if (anchor) sheet.style.right = Math.max(8, Math.min(parseFloat(sheet.style.right), innerWidth - sheet.offsetWidth - 8)) + 'px';
    $('#scrim').hidden = false;
    $('#scrim').classList.toggle('clear', !!anchor);
    requestAnimationFrame(() => sheet.classList.add('open'));
  }
  function closeSheet() { document.querySelectorAll('.sheet').forEach(s => s.remove()); const sc = $('#scrim'); if (sc) sc.hidden = true; }
  REV.openSheet = openSheet; REV.closeSheet = closeSheet;
  function seg(options, value, onPick) {
    const g = h('div', { class: 'seg', role: 'radiogroup' });
    options.forEach(([v, label]) => g.append(h('button', { type: 'button', class: String(v) === String(value) ? 'on' : '', 'aria-pressed': String(v) === String(value) ? 'true' : 'false', text: label,
      onclick: e => { g.querySelectorAll('button').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); }); e.currentTarget.classList.add('on'); e.currentTarget.setAttribute('aria-pressed', 'true'); onPick(v); } })));
    return g;
  }
  REV.seg = seg;
  function settings() {
    const d = document.documentElement;
    const body = h('div', { class: 'settings' },
      h('label', { text: 'Appearance' }), seg([['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']], REV.store.get('theme', 'auto'), v => { REV.store.set('theme', v); if (v === 'auto') d.removeAttribute('data-theme'); else d.setAttribute('data-theme', v); }),
      h('label', { text: 'Text size' }), seg([['0.9', 'Small'], ['1', 'Normal'], ['1.12', 'Large'], ['1.25', 'Larger']], REV.store.get('size', '1'), v => { REV.store.set('size', v); d.style.setProperty('--size', v); }),
      h('label', { text: 'Progress' }), h('button', { class: 'btn sm ghost', type: 'button', text: 'Clear all “revised” marks', onclick: e => { if (e.currentTarget.dataset.armed) { REV.store.set('done', {}); closeSheet(); route(); } else { e.currentTarget.dataset.armed = '1'; e.currentTarget.textContent = 'Tap again to clear'; } } }),
      h('p', { class: 'small', text: 'Everything is kept in this browser only.' }));
    openSheet(body, 'Settings', $('#settings-btn'));
  }

  /* ------------------------------------------------------------------ one scroll bar: the page's */
  // Nothing inside a page scrolls up and down, as in the labs: a box with a few pixels of vertical overflow (tall maths
  // in a solution) would catch the trackpad and stop the page. Every box that scrolls is marked: data-one-scroll="x"
  // (it scrolls sideways: keep that, never up and down) or "y" (a capped box: let it grow); app.css turns the marks
  // into styles. Panes keep their own scrolling: the sticky contents rail, the timers, sheets (outside #view), fields.
  function oneScroll() {
    const root = view(), scrolls = v => v === 'auto' || v === 'scroll';
    const check = el => {
      if (el.hasAttribute('data-one-scroll') || el.matches('.rail, .pr-panel, textarea, select, input')) return;
      const cs = getComputedStyle(el);
      const x = scrolls(cs.overflowX), y = scrolls(cs.overflowY);
      if (!x && !y) return;
      if (cs.position === 'fixed' || cs.position === 'sticky') return;
      el.setAttribute('data-one-scroll', x ? 'x' : 'y');
    };
    // KaTeX output and drawings never scroll; skip their insides (most of the nodes on a page)
    const inert = el => el.matches('.katex, svg');
    const scan = node => {
      if (node.nodeType !== 1 || !node.isConnected || inert(node)) return;
      check(node);
      const walk = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, { acceptNode: n => (inert(n) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      for (let n = walk.nextNode(); n; n = walk.nextNode()) check(n);
    };
    const pending = new Set();
    let frame = 0;
    new MutationObserver(list => {
      list.forEach(m => m.addedNodes.forEach(n => { if (n.nodeType === 1) pending.add(n); }));
      if (pending.size && !frame) frame = requestAnimationFrame(() => { frame = 0; pending.forEach(scan); pending.clear(); });
    }).observe(root, { childList: true, subtree: true });
    scan(root);
    // a box can start scrolling at another width (phone rules), or when a style sheet arrives (the solutions' own)
    let wait = 0;
    addEventListener('resize', () => { clearTimeout(wait); wait = setTimeout(() => scan(root), 250); });
    document.addEventListener('load', e => { if (e.target.tagName === 'LINK') scan(root); }, true);
  }

  /* ------------------------------------------------------------------ a revision */
  /* "Start revision" (the bar) starts a stopwatch that follows the reader over every page until "Finish". The time goes
     to the page being read (a week, a lab topic, a practice set, the formulas…) and, within it, to the section at the
     reading line (a third of the way down the window; lower near the end, so the last short sections are reached). A
     page's sections are its h2 and h3 headings, each running to the next; the text above the first counts with the
     first, and a page without headings is one section. A new section takes the time only after the reader has stayed
     on it 3 s; till then the time stays with the section before, so sections scrolled past get none. Time away
     (another tab or app, the phone locked, the Mac asleep) counts for the section left when the reader is back within
     15 min; a longer absence is a break and none of it counts. 15 min on the page without touching it is a break too
     (those 15 min are taken back).
     The strip beside the scroll bar maps the page: a block per section, in page order and in proportion, hollow until
     read, then a deeper orange (a brighter one in dark mode) the longer it was read; the section at the reading line is
     ringed; pointing at a block (tapping it on a phone) names it with its time. The bar button opens a panel: Pause,
     Finish, the page's sections with their times, the other pages of the revision and earlier revisions of the page.
     Kept apart from REV.store, under revise.rev.cur / revise.rev.past, read fresh and written by one tab at a time
     (the visible tab the reader last touched), so open tabs never overwrite each other's data. */
  const RV = { cur: 'revise.rev.cur', past: 'revise.rev.past', dwell: 3000, away: 15 * 60e3 };
  const rvTab = Math.random().toString(36).slice(2);
  const rvMem = {};
  const rvGet = k => { try { const s = localStorage.getItem(k); return s ? JSON.parse(s) : null; } catch (e) { return rvMem[k] || null; } };
  const rvPut = (k, v) => { rvMem[k] = v; try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode: memory only */ } };
  const clock = ms => { const s = Math.floor(ms / 1000), hh = Math.floor(s / 3600), mm = Math.floor(s / 60) % 60;
    return (hh ? hh + ':' + String(mm).padStart(2, '0') : mm) + ':' + String(s % 60).padStart(2, '0'); };
  const rvMins = ms => (ms < 60e3 ? Math.round(ms / 1000) + ' s' : Math.round(ms / 60e3) + ' min');
  const rvPage = () => { const p = parse().parts; return (/^(labs|practice)$/.test(p[0]) ? p.slice(0, 3) : p.slice(0, 2)).join('/') || 'home'; };
  const rvTitle = () => document.title.replace(/\s*·\s*Revise$/, '') || 'Revise';
  let rvSecs = null, rvStrip = null, rvTip = null, rvPanelEl = null;
  let rvCand = null, rvPend = 0, rvIdle = 0, rvInput = Date.now(), rvBreak = false, rvOwn = true;

  /** The page's sections: its h2 and h3 headings in page order (not those of the contents, the lab list or a sheet). */
  function rvFind() {
    const v = view(), seen = new Map();
    if (!v) return [];
    return [...v.querySelectorAll('h2, h3')].filter(el => el.offsetParent !== null && !el.closest('.rail, .toc, .lab-nav, .sheet, .phead')).map(el => {
      const c = el.cloneNode(true);
      c.querySelectorAll('.katex-mathml').forEach(x => x.remove());
      const title = c.textContent.replace(/\s+/g, ' ').trim();
      let key = el.id || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 's';
      const n = (seen.get(key) || 0) + 1;
      seen.set(key, n);
      if (n > 1) key += '~' + n;
      return { key, title, el };
    });
  }
  /** Where the time goes now: the page and the section at the reading line. */
  function rvWhere() {
    const page = rvPage(), list = rvSecs && rvSecs.page === page ? rvSecs.list : [];
    if (!list.length || !list[0].el) return { page, sec: '', title: rvTitle() };
    const H = innerHeight, left = document.documentElement.scrollHeight - H - scrollY;
    const line = Math.max(H * 0.3, H * 0.85 - left);
    let sec = list[0].key;
    for (const s of list) { if (s.el.getBoundingClientRect().top <= line) sec = s.key; else break; }
    return { page, sec, title: rvTitle() };
  }
  function rvAdd(r, at, ms) {
    if (!at || !ms) return;
    r.ms = Math.max(0, r.ms + ms);
    const p = r.pages[at.page] || (r.pages[at.page] = { title: at.title || at.page, ms: 0, s: {} });
    if (at.title) p.title = at.title;
    p.ms = Math.max(0, p.ms + ms);
    if (at.sec) p.s[at.sec] = Math.max(0, (p.s[at.sec] || 0) + ms);
  }
  /** Lay the strip out for the page on screen (its sections in proportion to the page), or hide it. */
  function rvLayout(r) {
    if (!rvStrip) return;
    if (r === undefined) r = rvGet(RV.cur);
    rvSecs = null;
    rvStrip.textContent = '';
    rvStrip.hidden = !r;
    document.documentElement.classList.toggle('rv-on', !!r);
    if (!r) { rvTip.classList.remove('on'); return; }
    const found = rvFind(), full = document.documentElement.scrollHeight, y0 = scrollY;
    const list = found.length ? found : [{ key: '', title: 'This page', el: null }];
    const tops = list.map((s, i) => (i && s.el ? s.el.getBoundingClientRect().top + y0 : 0));
    list.forEach((s, i) => {
      s.a = tops[i];
      s.b = i + 1 < list.length ? tops[i + 1] : full;
      s.blk = h('i', { class: 'rv-b' });
      s.blk.style.top = (s.a / full * 100).toFixed(3) + '%';
      s.blk.style.height = (Math.max(0, s.b - s.a) / full * 100).toFixed(3) + '%';
      rvStrip.append(s.blk);
    });
    rvSecs = { page: rvPage(), list, full };
    rvPaint(r);
  }
  /** Each block's heat (its time against the page's longest-read section, at least a minute) and the ring. */
  function rvPaint(r) {
    if (!rvSecs) return;
    const p = r && r.pages[rvSecs.page], s = (p && p.s) || {}, one = !rvSecs.list[0].el;
    rvSecs.list.forEach(x => { x.ms = one ? (p ? p.ms : 0) : s[x.key] || 0; });
    const top = Math.max(60e3, ...rvSecs.list.map(x => x.ms)), here = rvWhere().sec;
    rvSecs.list.forEach(x => {
      x.blk.classList.toggle('read', x.ms > 0);
      x.blk.style.setProperty('--t', (x.ms / top).toFixed(3));
      x.blk.classList.toggle('on', x.key === here);
    });
  }
  function rvTick() {
    const r = rvGet(RV.cur), now = Date.now();
    if (r && rvStrip && (!rvSecs || rvSecs.page !== rvPage() || rvSecs.list.some(x => x.el && !x.el.isConnected))) rvLayout(r);
    if (r && r.on && r.tab === rvTab && document.visibilityState === 'visible') {
      const dt = now - r.last;
      if (dt > 5000 || dt < 0) {                       // this page was not running: away, hidden or asleep
        if (dt > 0 && dt <= RV.away) rvAdd(r, r.at, dt); // back within 15 min: it counts for the section left
        rvCand = null; rvPend = 0;
      } else if (now - rvInput > RV.away) {            // 15 min without touching the page: a break from its start
        if (rvIdle) { rvAdd(r, r.at, -rvIdle); rvIdle = 0; }
        rvBreak = true;
      } else {
        const w = rvWhere();
        if (!r.at || w.page !== r.at.page) { if (rvPend) rvAdd(r, r.at, rvPend); r.at = w; rvCand = null; rvPend = 0; rvAdd(r, r.at, dt); }
        else if (w.sec === r.at.sec) { if (rvPend) rvAdd(r, r.at, rvPend); rvCand = null; rvPend = 0; rvAdd(r, r.at, dt); }
        else {
          if (!rvCand || rvCand.sec !== w.sec) { if (rvPend) rvAdd(r, r.at, rvPend); rvCand = { sec: w.sec, since: now - dt }; rvPend = 0; }
          rvPend += dt;
          if (now - rvCand.since >= RV.dwell) { r.at = w; rvAdd(r, r.at, rvPend); rvCand = null; rvPend = 0; }
        }
        rvIdle += dt;
      }
      r.last = now;
      rvPut(RV.cur, r);
    }
    rvShow(r);
  }
  /** Settle the time up to now (leaving the page, pausing): what was waiting for the 3 s goes to the section before. */
  function rvSettle(r, now) {
    if (!r.on || r.tab !== rvTab) return;
    if (rvPend) rvAdd(r, r.at, rvPend);
    const dt = now - r.last;
    if (dt > 0 && dt <= 5000) rvAdd(r, r.at, dt);
    rvCand = null; rvPend = 0;
    r.last = now;
  }
  function rvStart() {
    const now = Date.now();
    rvCand = null; rvPend = 0; rvIdle = 0; rvInput = now; rvBreak = false;
    const r = { start: now, on: true, ms: 0, pages: {}, at: null, last: now, tab: rvTab };
    rvLayout(r);
    r.at = rvWhere();
    rvPut(RV.cur, r);
    rvShow(r);
  }
  function rvHold(on) {
    const r = rvGet(RV.cur), now = Date.now();
    if (!r) return null;
    rvSettle(r, now);
    rvIdle = 0; rvInput = now; rvBreak = false;
    r.on = on; r.last = now; r.tab = rvTab;
    if (on) r.at = rvWhere();
    rvPut(RV.cur, r);
    rvShow(r);
    return r;
  }
  function rvFinish() {
    const r = rvHold(false);
    if (!r) return null;
    const done = { start: r.start, end: Date.now(), ms: r.ms, pages: r.pages };
    rvPut(RV.past, [done, ...(rvGet(RV.past) || [])].slice(0, 60));
    rvPut(RV.cur, null);
    rvShow(null);
    return done;
  }
  function rvShow(r) {
    rvOwn = !r || r.tab === rvTab;
    const btn = $('#rv-btn');
    if (btn) {
      const held = !!r && (!r.on || rvBreak);
      btn.classList.toggle('run', !!r && !held);
      btn.classList.toggle('held', held);
      btn.querySelector('.rv-t').textContent = r ? clock(r.ms) : 'Start revision';
      btn.setAttribute('aria-label', r ? 'Revision ' + (!r.on ? 'paused' : rvBreak ? 'on a break' : 'running') + ', ' + rvMins(r.ms) + ': open the revision panel' : 'Start revision');
      btn.title = r ? 'This revision: ' + clock(r.ms) : 'Start a revision: the time on each section is counted';
    }
    if (!!r !== !!rvSecs) rvLayout(r); else rvPaint(r);
    if (rvPanelEl && rvPanelEl.isConnected) rvFill(r);
  }
  function rvOpen() {
    rvPanelEl = h('div', { class: 'rv-panel' });
    openSheet(rvPanelEl, 'Revision', $('#rv-btn'));
    rvFill(rvGet(RV.cur));
  }
  /** The panel: its buttons are made again only when the state changes (so a click is never lost); the lists each second. */
  function rvFill(r) {
    const el = rvPanelEl, page = rvPage(), rec = r || el.done;
    const kind = r ? (r.on ? 'run' : 'held') : el.done ? 'done' : 'none';
    if (el.dataset.kind !== kind) {
      el.dataset.kind = kind;
      el.textContent = '';
      const acts = h('div', { class: 'rv-acts' });
      if (r) acts.append(
        h('button', { class: 'btn sm', type: 'button', text: r.on ? 'Pause' : 'Resume', onclick: () => { const c = rvGet(RV.cur); if (c) rvHold(!c.on); } }),
        h('button', { class: 'btn sm ghost', type: 'button', text: 'Finish', onclick: () => { el.done = rvFinish(); rvFill(null); } }));
      else acts.append(h('button', { class: 'btn sm', type: 'button', text: el.done ? 'Start a new revision' : 'Start revision', onclick: () => { el.done = null; rvStart(); } }));
      el.append(h('div', { class: 'rv-now' }, h('b', { class: 'rv-big' }), h('span', { class: 'rv-st' })), acts, h('div', { class: 'rv-lists' }));
    }
    const fmtDay = t => new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + new Date(t).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    const here = r && r.at && rvSecs && rvSecs.page === r.at.page ? (rvSecs.list.find(x => x.key === r.at.sec) || {}).title : '';
    el.querySelector('.rv-big').textContent = rec ? clock(rec.ms) : '0:00';
    el.querySelector('.rv-st').textContent = !rec ? 'Start it when you begin: each section counts after 3 s on it.'
      : !r ? 'Finished · ' + fmtDay(rec.start) + ' – ' + new Date(rec.end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      : !r.on ? 'Paused' : rvBreak ? 'On a break: 15 min without touching the page' : 'Counting' + (here ? ' · ' + here : '');
    const lists = el.querySelector('.rv-lists'), p = rec && rec.pages[page];
    lists.textContent = '';
    if (rec) {
      lists.append(h('div', { class: 'rv-h' }, 'This page', h('span', { text: clock(p ? p.ms : 0) })));
      const secs = rvSecs && rvSecs.page === page ? rvSecs.list : rvFind();   // after Finish the strip is gone
      if (secs.length && secs[0].el) {
        const s = (p && p.s) || {}, top = Math.max(60e3, ...secs.map(x => s[x.key] || 0));
        lists.append(h('ol', { class: 'rv-rows' }, secs.map(x => {
          const ms = s[x.key] || 0, sw = h('i', { class: 'rv-sw' + (ms ? ' read' : '') });
          sw.style.setProperty('--t', (ms / top).toFixed(3));
          return h('li', { class: r && r.at && x.key === r.at.sec && r.at.page === page ? 'on' : null }, sw, h('span', { text: x.title }), h('span', { class: 'tm', text: ms ? clock(ms) : '–' }));
        })));
      }
      const others = Object.entries(rec.pages).filter(([k]) => k !== page).sort((a, b) => b[1].ms - a[1].ms);
      if (others.length) lists.append(h('div', { class: 'rv-h', text: 'Other pages in this revision' }),
        h('ol', { class: 'rv-rows' }, others.map(([, q]) => h('li', { class: 'np' }, h('span', { text: q.title }), h('span', { class: 'tm', text: clock(q.ms) })))));
    }
    const earlier = (rvGet(RV.past) || []).filter(x => x !== el.done && !(el.done && x.start === el.done.start) && x.pages[page]).slice(0, 5);
    if (earlier.length) lists.append(h('div', { class: 'rv-h', text: 'Earlier revisions of this page' }),
      h('ol', { class: 'rv-rows' }, earlier.map(x => h('li', { class: 'np' }, h('span', { text: fmtDay(x.start) }),
        h('span', { class: 'tm', text: rvMins(x.pages[page].ms) + ' here · ' + rvMins(x.ms) + ' in all' })))));
    lists.append(h('p', { class: 'rv-key', text: 'The strip beside the scroll bar is this page: a block for each section, hollow until you read it, then a deeper orange (brighter in dark mode) the longer you stay. Point at a block, or tap it, for its name and time. Time away counts if you are back within 15 minutes.' }));
  }
  function rvInit() {
    rvStrip = h('div', { id: 'rv-strip', hidden: true, 'aria-hidden': 'true' });
    rvTip = h('div', { id: 'rv-tip', 'aria-hidden': 'true' });
    document.body.append(rvStrip, rvTip);
    let tipT = 0;
    const tipAt = y => {
      if (!rvSecs) return;
      const at = y / innerHeight * rvSecs.full, list = rvSecs.list;
      const x = list.find(s => at >= s.a && at < s.b) || list[list.length - 1];
      rvTip.replaceChildren(h('span', { text: x.title }), h('b', { text: x.ms ? clock(x.ms) : 'not read yet' }));   // a long name gives way, never the time
      const th = rvTip.offsetHeight || 26;
      rvTip.style.transform = 'translateY(' + Math.round(Math.min(innerHeight - th - 6, Math.max(6, y - th / 2))) + 'px)';
      rvTip.classList.add('on');
    };
    rvStrip.addEventListener('pointermove', e => { if (e.pointerType === 'mouse') tipAt(e.clientY); });
    rvStrip.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') rvTip.classList.remove('on'); });
    rvStrip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') { tipAt(e.clientY); clearTimeout(tipT); tipT = setTimeout(() => rvTip.classList.remove('on'), 2500); } });
    // the reader's own input: it keeps the 15-minute break away, and the tab touched last is the one that counts
    const touch = () => {
      rvInput = Date.now(); rvIdle = 0; rvBreak = false;
      if (!rvOwn && document.visibilityState === 'visible') { const r = rvGet(RV.cur); if (r && r.tab !== rvTab) { r.tab = rvTab; rvPut(RV.cur, r); } rvOwn = true; }
    };
    ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(t => addEventListener(t, touch, { passive: true, capture: true }));
    document.addEventListener('visibilitychange', () => {
      const r = rvGet(RV.cur);
      if (!r) return;
      if (document.visibilityState === 'hidden') { if (r.on && r.tab === rvTab) { rvSettle(r, Date.now()); rvPut(RV.cur, r); } }
      else { rvInput = Date.now(); rvIdle = 0; rvBreak = false; if (r.tab !== rvTab) { r.tab = rvTab; rvPut(RV.cur, r); } rvTick(); }
    });
    // a new page, an answer opened, the window resized: lay the strip out again (once a frame at most)
    let lay = 0, mark = 0;
    const relayout = () => { if (rvSecs && !lay) lay = requestAnimationFrame(() => { lay = 0; rvLayout(); }); };
    new MutationObserver(relayout).observe(view(), { childList: true, subtree: true });
    if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(view());
    addEventListener('resize', relayout);
    addEventListener('hashchange', () => { if (rvGet(RV.cur)) rvLayout(); });
    addEventListener('scroll', () => {
      if (rvSecs && !mark) mark = requestAnimationFrame(() => { mark = 0; if (!rvSecs) return; const here = rvWhere().sec; rvSecs.list.forEach(x => x.blk.classList.toggle('on', x.key === here)); });
    }, { passive: true });
    addEventListener('storage', e => { if (e.key === RV.cur) rvShow(rvGet(RV.cur)); });
    $('#rv-btn').addEventListener('click', () => { if (rvGet(RV.cur)) rvOpen(); else rvStart(); });
    const r = rvGet(RV.cur);
    if (r && document.visibilityState === 'visible') { r.tab = rvTab; rvPut(RV.cur, r); }
    rvShow(r);
    setInterval(rvTick, 1000);
  }

  /* ------------------------------------------------------------------ start */
  REV.start = function () {
    oneScroll();
    $('#settings-btn').addEventListener('click', settings);
    $('#search-btn').addEventListener('click', () => { location.hash = '#/search'; });
    $('#scrim').addEventListener('click', closeSheet);
    // the panel button in the bar: the line being read stays put while the page widens or narrows
    const root = document.documentElement;
    for (const p of Object.values(PANELS)) root.classList.toggle(p.cls, !!REV.store.get(p.key, false));
    $('#rail-btn').addEventListener('click', () => {
      const p = panel(), off = !root.classList.contains(p.cls);
      REV.store.set(p.key, off);
      keepPlace(p === PANELS.lab ? $('#view .lk-out') || $('#view .lab-main') : $('article.doc'), () => { root.classList.toggle(p.cls, off); panelState(); });
    });
    addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); location.hash = '#/search'; } });
    addEventListener('hashchange', route);
    let last = 0;
    addEventListener('scroll', () => { const y = window.scrollY; document.body.classList.toggle('scrolled', y > 8); last = y; }, { passive: true });
    scrollTag();
    rvInit();
    route();
  };
})();
