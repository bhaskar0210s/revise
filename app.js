/* Revise: the app shell. Hash routes, pages loaded on demand as script files (so the site works from the disk
   as well as from GitHub Pages), progress kept in this browser only.

   #/                       home: the courses, the labs, the formulas
   #/stats1                 a course: its weeks and the all-weeks revision
   #/stats1/w03[/section]   a week (or /all), optionally scrolled to a section
   #/labs[/coin[/binomial]][?n=10&p=1/2]   the labs, a lab, a topic with its values
   #/formulas[/stats1]      every formula, or one course's
   #/search?q=…             search headings and formulas */
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
    try {
      if (!SITE) v.append(h('p', { class: 'empty', text: 'The site data did not load. Reload the page.' }));
      else if (!parts.length) home(v);
      else if (parts[0] === 'labs') labsRoute(v, parts, query);
      else if (parts[0] === 'formulas') formulas(v, parts[1], query.q || '');
      else if (parts[0] === 'search') search(v, query.q || '');
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
    if (!(parts[2] && /^(w\d\d|all)$/.test(parts[1] || ''))) window.scrollTo(0, 0);
  }
  function setBack(parts) {
    const back = $('#back');
    let to = '#/';
    if (parts[0] === 'labs' && parts[1]) to = '#/labs';
    else if (parts[0] && parts[0] !== 'labs' && parts[0] !== 'formulas' && parts[0] !== 'search' && parts[1]) to = '#/' + parts[0];
    back.href = to;
    back.hidden = !parts.length;
    document.body.classList.toggle('at-home', !parts.length);
  }
  const title = (t, bar) => { document.title = t ? t + ' · Revise' : 'Revise'; $('#bar-title').textContent = bar || ''; };

  /* ------------------------------------------------------------------ home */
  function home(v) {
    title('', '');
    v.className = 'home';
    v.append(h('header', { class: 'hero' },
      h('h1', { text: 'Revise' }),
      h('p', { text: 'Week by week, every topic from the lectures, explained from the basics with every step. Labs to play with, and every formula in one place.' })));
    const grid = h('div', { class: 'tiles' });
    for (const c of SITE.courses) {
      const ready = c.weeks.filter(w => w.ready).length + (c.all && c.all.ready ? 1 : 0);
      const total = c.weeks.length + 1;
      const done = c.weeks.filter(w => isDone(c.key + '/' + w.id)).length;
      grid.append(h('a', { class: 'tile', href: '#/' + c.key },
        h('span', { class: 'tile-ic', html: icon(c.icon) }),
        h('span', { class: 'tile-t' }, h('b', { text: c.name }), h('small', { text: c.full })),
        h('span', { class: 'tile-meta' }, h('span', { class: 'tag' + (c.group === 'This term' ? ' now' : ''), text: c.group }),
          h('span', { text: ready < total ? ready + ' of ' + total + ' pages ready' : c.weeks.length + ' weeks' + (done ? ' · ' + done + ' revised' : '') })),
        done ? h('span', { class: 'tile-bar', style: '--p:' + Math.round(100 * done / c.weeks.length) + '%' }) : null));
    }
    const nFormulas = SITE.formulaCount || null;
    grid.append(h('a', { class: 'tile tile-wide', href: '#/labs' },
      h('span', { class: 'tile-ic', html: icon('flask') }),
      h('span', { class: 'tile-t' }, h('b', { text: 'Labs' }), h('small', { text: SITE.labs.map(l => l.title.replace(/ lab$/, '')).join(' · ') })),
      h('span', { class: 'tile-meta' }, h('span', { text: SITE.labs.length + ' labs, ' + SITE.labs.reduce((a, l) => a + l.topics.length, 0) + ' topics' }))));
    grid.append(h('a', { class: 'tile tile-wide', href: '#/formulas' },
      h('span', { class: 'tile-ic', html: icon('formula') }),
      h('span', { class: 'tile-t' }, h('b', { text: 'Formulas' }), h('small', { text: 'Every formula of every week, searchable' })),
      h('span', { class: 'tile-meta' }, h('span', { text: nFormulas ? nFormulas + ' formulas' : 'Statistics, Mathematics, Python' }))));
    v.append(grid);
    const ios = /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone;
    if (ios) v.append(h('p', { class: 'install', html: 'On your iPhone: tap <b>Share</b>, then <b>Add to Home Screen</b>. It opens full screen and works offline after the first visit.' }));
  }

  /* ------------------------------------------------------------------ course */
  function course(v, c) {
    title(c.name, c.name);
    v.className = 'course';
    v.append(h('header', { class: 'phead' },
      h('div', { class: 'eyebrow', text: c.full + ' · ' + c.group }),
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
      const toc = h('nav', { class: 'toc', 'aria-label': 'On this page' }, h('div', { class: 'toc-h', text: 'On this page' }),
        h('ol', {}, p.toc.filter(t => t.level === 2).map(t => h('li', {}, h('a', { href: '#/' + key + '/' + t.id, 'data-id': t.id, text: t.title })))));
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
      v.append(
        h('header', { class: 'phead' }, h('div', { class: 'eyebrow', text: c.name + ' · ' + label }), h('h1', { text: p.title }), p.summary ? h('p', { class: 'lede', text: p.summary }) : null,
          p.lectures && p.lectures.length ? lectures(p.lectures) : null),
        h('div', { class: 'doc-wrap' }, article, h('aside', { class: 'rail' }, toc)),
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
    v.append(h('header', { class: 'phead' }, h('div', { class: 'eyebrow', text: def.group + ' · ' + def.title }), h('h1', { text: topic.title })));
    const chips = h('div', { class: 'chips', role: 'tablist', 'aria-label': 'Topics' }, def.topics.map(t => h('a', { class: 'chip' + (t.id === topic.id ? ' on' : ''), href: '#/labs/' + def.id + '/' + t.id, role: 'tab', 'aria-selected': t.id === topic.id ? 'true' : 'false', text: t.title })));
    v.append(chips);
    const body = h('div', { class: 'lab-body' });
    v.append(body);
    requestAnimationFrame(() => { const on = chips.querySelector('.on'); if (on) on.scrollIntoView({ block: 'nearest', inline: 'center' }); });
    if (!impl || !impl.topics || !impl.topics[topic.id]) { body.append(h('div', { class: 'callout note', text: 'This lab topic is being built.' })); return; }
    const ctx = { base: '#/labs/' + def.id + '/' + topic.id, def, topic, used: new Set() };
    try { impl.topics[topic.id](body, query, ctx); }
    catch (e) { console.error(e); body.append(h('div', { class: 'callout warn', text: 'This lab could not start: ' + e.message })); }
    // a link from a page whose values the topic never reads opens it with its defaults instead (tools/check.mjs --links)
    const unread = Object.keys(query || {}).filter(k => ctx.used.size && !ctx.used.has(k));
    if (unread.length) console.warn('[lab] ' + def.id + '/' + topic.id + ' does not read the link value(s): ' + unread.join(', '));
    const used = (topic.for || []).map(f => { const [ck, wid] = f.split('/'); const c = SITE.courses.find(x => x.key === ck); const w = c && c.weeks.find(x => x.id === wid); return c && w ? h('a', { class: 'pill-link sm', href: '#/' + ck + '/' + wid, text: c.name + ' · Week ' + w.n }) : null; }).filter(Boolean);
    if (used.length) v.append(h('div', { class: 'used-in' }, h('span', { text: 'Revise it in' }), used));
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
    const input = h('input', { class: 'field search-in', type: 'search', placeholder: 'Search topics, formulas and labs…', value: q, 'aria-label': 'Search' });
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
        const pageHits = list.filter(x => hit(x.t)).slice(0, 60);
        if (labHits.length) out.append(h('h2', { class: 'sec', text: 'Labs' }), h('div', { class: 'chips wrap' }, labHits.map(x => h('a', { class: 'chip', href: '#/labs/' + x.lab.id + '/' + x.t.id, text: x.lab.title.replace(/ lab$/, '') + ': ' + x.t.title }))));
        if (pageHits.length) {
          out.append(h('h2', { class: 'sec', text: 'In the weeks' }));
          const ul = h('ul', { class: 'hits' });
          pageHits.forEach(x => { const c = SITE.courses.find(cc => cc.key === x.c); ul.append(h('li', {}, h('a', { href: '#/' + x.c + '/' + x.p + '/' + x.a }, h('b', { text: x.t }), h('small', { text: (c ? c.name : x.c) + ' · ' + (x.w ? 'Week ' + x.w : 'All weeks') + (x.f ? ' · formula' : '') })))); });
          out.append(ul);
        }
        if (!labHits.length && !pageHits.length) out.append(h('p', { class: 'empty', text: 'Nothing found for “' + input.value + '”.' }));
      };
      input.addEventListener('input', () => { REV.setQuery('#/search', { q: input.value }); draw(); });
      draw();
    });
  }

  function notFound(v) { title('Not found', ''); v.append(h('header', { class: 'phead' }, h('h1', { text: 'Not found' }), h('p', { class: 'lede', html: 'That page does not exist. <a href="#/">Go home</a>.' }))); }

  /* ------------------------------------------------------------------ sheet + settings */
  function openSheet(content, heading) {
    closeSheet();
    const sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': heading },
      h('div', { class: 'sheet-bar' }, h('i', { class: 'sheet-handle' }), h('b', { text: heading }), h('button', { class: 'btn sm', type: 'button', text: 'Done', onclick: closeSheet })),
      h('div', { class: 'sheet-body' }, content));
    sheet.addEventListener('click', e => { if (e.target.closest('a[href^="#/"]')) setTimeout(closeSheet, 0); });
    document.body.append(sheet);
    $('#scrim').hidden = false;
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
    openSheet(body, 'Settings');
  }

  /* ------------------------------------------------------------------ start */
  REV.start = function () {
    $('#settings-btn').addEventListener('click', settings);
    $('#search-btn').addEventListener('click', () => { location.hash = '#/search'; });
    $('#scrim').addEventListener('click', closeSheet);
    addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); location.hash = '#/search'; } });
    addEventListener('hashchange', route);
    let last = 0;
    addEventListener('scroll', () => { const y = window.scrollY; document.body.classList.toggle('scrolled', y > 8); last = y; }, { passive: true });
    route();
  };
})();
