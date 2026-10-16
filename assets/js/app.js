/* Revise — app shell: registry, loader, router, sidebar, home and lesson pages. */
(function () {
  'use strict';
  const { h, $, clear } = Lab;
  const icon = Lab.icon;

  /* ------------------------------------------------------------- registry */
  const lessons = {};
  const pages = {};
  Lab.lessons = lessons;
  Lab.pages = pages;
  /** Register a lesson (called by each file in lessons/). */
  Lab.lesson = function (def) {
    if (!def || !def.id) throw new Error('Lesson needs an id');
    lessons[def.id] = def;
  };
  /** Register a standalone page: Lab.page('formulas', {title, nav, icon, render(view)}) */
  Lab.page = function (id, def) { pages[id] = Object.assign({ id }, def); };

  const KIND = {
    explore: 'Explore', concept: 'Concept', predict: 'Predict', example: 'Worked example', try: 'Your turn',
    check: 'Check', pitfall: 'Watch out', summary: 'Summary', lecture: 'In the lecture', recap: 'Recap', recall: 'Recall', words: 'Words & symbols',
  };

  /* -------------------------------------------------------------- progress */
  function prog(id) { return Lab.store.get('p:' + id, { reached: 0, done: false }); }
  function setProg(id, p) { Lab.store.set('p:' + id, p); Lab.emit('progress', id); }
  Lab.progress = { get: prog, set: setProg };

  function unitOf(id) { return Lab.course.units.find(u => u.lessons.includes(id)); }
  function orderedIds() { return Lab.course.units.flatMap(u => u.lessons).filter(id => lessons[id]); }
  function lessonStatus(id) {
    const L = lessons[id]; if (!L) return { cls: '', pct: 0 };
    const p = prog(id);
    if (p.done) return { cls: 'done', pct: 100 };
    if (p.reached > 0) return { cls: 'started', pct: Math.round((p.reached / Math.max(1, L.cards.length)) * 100) };
    return { cls: '', pct: 0 };
  }

  /* ----------------------------------------------------------------- theme */
  function applyTheme() {
    const t = Lab.store.get('theme', 'auto');
    if (t === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', t);
  }
  applyTheme();

  /* ------------------------------------------ text size, page width, sidebar */
  function applyView() {
    const d = document.documentElement;
    d.setAttribute('data-width', Lab.store.get('width', 'full'));
    const hidden = !!Lab.store.get('sideHidden', false);
    if (hidden) d.setAttribute('data-side', 'hidden'); else d.removeAttribute('data-side');
    d.style.setProperty('--zoom', Lab.store.get('zoom', 1));
    const dw = Lab.store.get('dockW', 0);
    if (dw) d.style.setProperty('--dock-w', dw + 'px'); else d.style.removeProperty('--dock-w');
    Lab.$$('.side-btn').forEach(b => {
      b.innerHTML = icon(hidden ? 'sideOpen' : 'sideClose');
      b.title = hidden ? 'Show the sidebar and keep it open' : 'Hide the sidebar (touch the left edge to see it again)';
      b.setAttribute('aria-label', b.title);
    });
    Lab.$$('.side-lock').forEach(b => {
      b.innerHTML = icon(hidden ? 'lock' : 'sideClose');
      b.title = hidden ? 'Lock the sidebar open' : 'Hide the sidebar (touch the left edge to see it again)';
      b.setAttribute('aria-label', b.title);
    });
  }
  function setSideHidden(v) {
    Lab.store.set('sideHidden', v);
    document.body.classList.remove('side-peek');
    applyView();
    window.dispatchEvent(new Event('resize'));
  }
  applyView();

  /* --------------------------------------------------------------- sidebar */
  function buildSidebar() {
    const side = $('#sidebar');
    clear(side);
    side.appendChild(h('a', { class: 'brand', href: '#/' },
      h('span', { class: 'brand-mark', html: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.1" stroke-linecap="round"><path d="M4 19V11M9.33 19V6M14.66 19V9M20 19V13"/></svg>' }),
      h('span', {}, h('div', { class: 'brand-name', text: Lab.course.brand || 'Revise' }), h('div', { class: 'brand-sub', text: Lab.course.subtitle }))));
    const links = h('nav', { class: 'side-links' });
    const pageLinks = [{ href: '#/', label: 'Overview', ic: 'home', key: 'home' }]
      .concat(Object.values(pages).filter(p => p.nav).sort((a, b) => (a.order || 0) - (b.order || 0)).map(p => ({ href: '#/p/' + p.id, label: p.nav, ic: p.icon || 'book', key: 'p:' + p.id })));
    pageLinks.forEach(l => links.appendChild(h('a', { class: 'side-link', href: l.href, dataset: { key: l.key }, html: icon(l.ic) + '<span>' + l.label + '</span>' })));
    side.appendChild(links);
    const nav = h('nav', { class: 'course-nav sk-nav' });
    const collapsed = Lab.store.get('collapsed', {});
    const shown = new Set();
    const ring = st => { const s = h('span', { class: 'status ' + st.cls }); if (st.cls === 'started') s.style.setProperty('--pct', st.pct + '%'); return s; };
    const item = (attrs, ic, title, sub, st) => h('a', attrs, h('span', { class: 'sk-ic', html: icon(ic) }), h('span', { class: 'sk-t' }, h('span', { class: 'sk-title', text: title }), h('span', { class: 'sk-sub', text: sub })), st ? ring(st) : attrs.target === '_blank' ? h('span', { class: 'sk-ext', text: '↗' }) : null);
    const lessonItem = (id, sub) => { shown.add(id); const L = lessons[id]; return item({ class: 'sk-item nav-lesson', href: '#/l/' + id, dataset: { id } }, /^F/.test(L.code) ? 'book' : 'play', L.code + ': ' + L.title, sub || 'Lesson', lessonStatus(id)); };
    const pageItem = (id, ic, title, sub, st) => item({ class: 'sk-item nav-page', href: '#/p/' + id, dataset: { page: id } }, ic, title, sub, st);
    const extItem = (it, sub) => item({ class: 'sk-item ext', href: it.link, target: '_blank', rel: 'noopener' }, it.video ? 'video' : 'book', it.title, sub, null);
    /** One collapsible section, like a week on the course portal. */
    function section(key, title, rows, defCollapsed) {
      if (!rows.length) return;
      const isCol = Object.prototype.hasOwnProperty.call(collapsed, key) ? collapsed[key] : defCollapsed;
      const sec = h('div', { class: 'unit sk-sec' + (isCol ? ' collapsed' : ''), dataset: { key } });
      const stats = rows.map(r => r.querySelector && r.querySelector('.status')).filter(Boolean);
      const done = stats.filter(s => s.classList.contains('done')).length;
      const head = h('button', { class: 'unit-head sk-head', type: 'button' }, h('span', { text: title }),
        h('span', { class: 'count', html: (stats.length ? done + '/' + stats.length + ' ' : '') + '<i class="sk-pm"></i>' }));
      head.addEventListener('click', () => { sec.classList.toggle('collapsed'); const c = Lab.store.get('collapsed', {}); c[key] = sec.classList.contains('collapsed'); Lab.store.set('collapsed', c); });
      const list = h('div', { class: 'unit-lessons sk-list' });
      rows.forEach(r => list.appendChild(r));
      sec.append(head, list);
      nav.appendChild(sec);
    }
    const divider = text => h('div', { class: 'sk-div', text });
    const QB = Lab.qbank;
    const units = Lab.course.units;
    const refresher = units.find(u => u.id === 'f');
    if (refresher) section('sk:f', refresher.tag + (refresher.short ? ' · ' + refresher.short : ''), refresher.lessons.filter(id => lessons[id]).map(id => lessonItem(id)), true);
    const many = QB && Object.keys(QB.weeks).length > 1;   // name the course on each week only when two courses share the sidebar
    const COURSE_NAME = { s2: many ? 'Stats II · ' : '', m2: many ? 'Maths II · ' : '' };
    const weeks = QB ? ['s2', 'm2'].flatMap(c => (QB.weeks[c] || []).slice().sort((a, b) => a.order - b.order)) : [];
    weeks.forEach(w => {
      const rows = [];
      const wk = /^Week (\d+)$/.exec(w.title);
      w.items.forEach(it => {
        if (it.kind === 'L') {
          const m = /^L(\d+\.\d+)/.exec(it.title);
          const L = m && Object.values(lessons).find(x => (x.course || 's2') === w.course && x.code === 'L' + m[1]);
          if (L) rows.push(lessonItem(L.id, 'Lesson · lecture video inside'));
          else if (it.link) rows.push(extItem(it, it.video ? 'Video on YouTube' : 'PDF on Google Drive'));
          return;
        }
        if (it.missing) return;   // the portal has nothing for it
        const sub = QB.SHORT[it.kind] + (it.open ? ' · open until ' + QB.istDate(it.due) : it.count ? ' · ' + it.count + ' questions' + (it.kind === 'GA' ? ' · closed' : '') : ' · not available');
        rows.push(pageItem(it.id, it.kind === 'GA' ? 'target' : 'list', it.title.replace(/\s*-\s*Not\s*Graded/i, '').replace(/\s*-\s*Non\s*graded/i, ''), sub, it.open ? { cls: '', pct: 0 } : QB.status(it)));
      });
      if (wk && w.course === 'm2') {
        const labs = (Lab.labs || []).filter(l => l.course === 'm2' && (l.week === +wk[1] || (l.weeks && l.weeks.includes(+wk[1])))).sort((a, b) => (a.order || 0) - (b.order || 0));
        if (labs.length) { rows.push(divider('On this site')); labs.forEach(l => rows.push(pageItem(l.id, 'flask', l.title, 'Lab · type your own values', null))); }
      }
      if (wk && w.course === 's2') {
        const unit = units.find(u => u.tag === 'Week ' + wk[1]);
        const extra = unit ? unit.lessons.filter(id => lessons[id] && !shown.has(id)) : [];
        const labs = (Lab.labs || []).filter(l => l.course === 's2' && l.week === +wk[1]).sort((a, b) => (a.order || 0) - (b.order || 0));
        if (extra.length || labs.length) rows.push(divider('On this site'));
        extra.forEach(id => rows.push(lessonItem(id, 'Practice set')));
        labs.forEach(l => rows.push(pageItem(l.id, 'flask', l.title, 'Lab · type your own values', null)));
      }
      section('sk:' + w.course + ':' + w.title, COURSE_NAME[w.course] + w.title, rows, true);
    });
    // lessons of units that have no portal week yet (or when the question bank is not loaded)
    units.filter(u => u.id !== 'f').forEach(u => {
      const rest = u.lessons.filter(id => lessons[id] && !shown.has(id));
      if (rest.length) section('sk:' + u.id, u.tag + (u.short ? ' · ' + u.short : ''), rest.map(id => lessonItem(id)), false);
    });
    // labs-only sites (no lessons, no question bank): one section per course and week, listing its labs
    (Lab.course.labSections || []).forEach(([c, name]) => {
      const labs = (Lab.labs || []).filter(l => l.course === c);
      const weeksOf = l => (l.weeks && l.weeks.length ? l.weeks : [l.week]);
      [...new Set(labs.flatMap(weeksOf))].sort((a, b) => a - b).forEach(w => {
        const rows = labs.filter(l => weeksOf(l).includes(w)).sort((a, b) => (a.order || 0) - (b.order || 0))
          .map(l => pageItem(l.id, 'flask', l.title, l.sub || 'Lab', null));
        section('sk:labs:' + c + ':' + w, name + ' · Week ' + w, rows, false);
      });
    });
    const s1 = (Lab.labs || []).filter(l => l.course === 's1').sort((a, b) => (a.week - b.week) || ((a.order || 0) - (b.order || 0)));
    if (s1.length) section('sk:s1labs', 'Statistics I · labs (Weeks 1–12)', s1.map(l => pageItem(l.id, 'flask', 'W' + l.week + ' · ' + l.title, 'Lab · type your own values', null)), true);
    if (Lab.course.soon) nav.appendChild(h('div', { class: 'nav-soon', text: Lab.course.soon }));
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'side-foot', html: Lab.course.foot || 'Watch the lecture first, then try it here with your own numbers.' }));
    const lock = h('button', { class: 'icon-btn side-lock', type: 'button' });
    lock.addEventListener('click', () => setSideHidden(!Lab.store.get('sideHidden', false)));
    side.appendChild(lock);
    applyView();
    markActive();
  }
  function markActive() {
    const r = parseRoute();
    Lab.$$('.nav-lesson').forEach(a => a.classList.toggle('active', r.type === 'lesson' && a.dataset.id === r.id));
    Lab.$$('.nav-page').forEach(a => a.classList.toggle('active', r.type === 'page' && a.dataset.page === r.id));
    Lab.$$('.side-link').forEach(a => a.classList.toggle('active', (r.type === 'home' && a.dataset.key === 'home') || (r.type === 'page' && (a.dataset.key === 'p:' + r.id || (pages[r.id] && pages[r.id].parent && a.dataset.key === 'p:' + pages[r.id].parent)))));
    const act = $('.nav-lesson.active') || $('.nav-page.active');
    if (act) { const unit = act.closest('.unit'); if (unit) unit.classList.remove('collapsed'); if (!markActive.done) { markActive.done = true; setTimeout(() => act.scrollIntoView({ block: 'nearest' }), 50); } }
  }
  Lab.on('progress', () => { buildSidebar(); });

  /* ---------------------------------------------------------------- router */
  function parseRoute() {
    const hsh = location.hash.replace(/^#\/?/, '');
    const [kind, id] = hsh.split('/');
    if (kind === 'l' && id) return { type: 'lesson', id: decodeURIComponent(id) };
    if (kind === 'p' && id) return { type: 'page', id: decodeURIComponent(id) };
    return { type: 'home' };
  }
  let cleanup = [];
  Lab.rerender = () => route();
  function route() {
    cleanup.forEach(fn => { try { fn(); } catch (e) {} });
    cleanup = [];
    clearPins();
    document.body.classList.remove('side-peek');
    const view = $('#view');
    clear(view);
    setTopProgress(null);
    const r = parseRoute();
    document.body.classList.remove('nav-open');
    if (r.type === 'lesson' && lessons[r.id]) renderLesson(lessons[r.id], view);
    else if (r.type === 'page' && pages[r.id]) renderPage(pages[r.id], view);
    else if (Lab.course.homePage && pages[Lab.course.homePage]) renderPage(pages[Lab.course.homePage], view);
    else renderHome(view);
    markActive();
    window.scrollTo(0, 0);
  }
  Lab.onCleanup = fn => cleanup.push(fn);

  function setCrumbs(html) { const c = $('#crumbs'); if (c) c.innerHTML = html; }
  function setTopProgress(frac, label) {
    const bar = $('#tb-bar i'), lab = $('#tb-progress');
    if (bar) bar.style.width = frac == null ? '0' : Math.round(frac * 100) + '%';
    if (lab) lab.textContent = label || '';
  }

  /* ------------------------------------------------------------------ home */
  function ring(pct) {
    const r = 18, c = 2 * Math.PI * r;
    return '<svg class="ring" viewBox="0 0 44 44"><circle class="bg" cx="22" cy="22" r="' + r + '"/><circle class="fg" cx="22" cy="22" r="' + r +
      '" stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + (c * (1 - pct / 100)).toFixed(2) + '" transform="rotate(-90 22 22)"/><text x="22" y="26" text-anchor="middle">' + pct + '%</text></svg>';
  }
  function renderHome(view) {
    document.title = (Lab.course.brand || 'Revise') + ' — ' + Lab.course.subtitle;
    setCrumbs('<b>Overview</b>');
    const home = h('div', { class: 'home' });
    const ids = orderedIds();
    const last = Lab.store.get('last', null);
    let next = last && lessons[last] && !prog(last).done ? last : ids.find(id => !prog(id).done && !(lessons[id].unit === 'f' && !prog(id).reached));
    if (!next) next = ids.find(id => !prog(id).done);
    const hero = h('section', { class: 'hero' },
      h('div', { class: 'eyebrow', text: Lab.course.title }),
      h('h1', { html: Lab.course.heroTitle }),
      h('p', { html: Lab.course.heroText }));
    const row = h('div', { class: 'btn-row' });
    const firstW1 = (Lab.course.units.find(u => u.id === 'w1') || {}).lessons;
    if (firstW1 && lessons[firstW1[0]]) row.appendChild(h('a', { class: 'btn primary', href: '#/l/' + firstW1[0], html: '<span>Start Week 1</span>' + icon('arrowRight') }));
    const firstF = (Lab.course.units.find(u => u.id === 'f') || {}).lessons;
    if (firstF && lessons[firstF[0]]) row.appendChild(h('a', { class: 'btn', href: '#/l/' + firstF[0], text: 'Refresh the basics first' }));
    hero.appendChild(row);
    home.appendChild(hero);
    if (next && (prog(next).reached > 0 || last)) {
      const L = lessons[next];
      home.appendChild(h('a', { class: 'continue-card', href: '#/l/' + next },
        h('div', {}, h('div', { class: 'cc-label', text: prog(next).reached > 0 ? 'Continue where you stopped' : 'Up next' }), h('div', { class: 'cc-title', text: L.code + ' · ' + L.title })),
        h('span', { class: 'cc-go', html: icon('arrowRight') })));
    }
    home.appendChild(h('div', { class: 'section-title', text: 'How each lesson works' }));
    const how = h('div', { class: 'how' });
    Lab.course.how.forEach((x, i) => how.appendChild(h('div', {}, h('div', { class: 'h-num', text: String(i + 1) }), h('b', { text: x[0] }), h('div', { class: 'h-text', html: x[1] }))));
    home.appendChild(how);
    if (Lab.course.planBlock) {
      home.appendChild(h('div', { class: 'section-title', text: 'Your plan' }));
      const pc = h('div', { class: 'map-card' });
      home.appendChild(pc);
      Lab.mountBlock(Lab.course.planBlock, pc);
    }
    if (Lab.course.mapBlock) {
      home.appendChild(h('div', { class: 'section-title', text: 'The big picture' }));
      const mc = h('div', { class: 'map-card' });
      home.appendChild(mc);
      Lab.mountBlock(Lab.course.mapBlock, mc);
    }
    home.appendChild(h('div', { class: 'section-title', text: 'Course map' }));
    const grid = h('div', { class: 'unit-grid' });
    Lab.course.units.forEach(u => {
      const have = u.lessons.filter(id => lessons[id]);
      if (!have.length) return;
      const pct = Math.round((have.filter(id => prog(id).done).length / have.length) * 100);
      const mins = have.reduce((s, id) => s + (lessons[id].minutes || 0), 0);
      const left = have.filter(id => !prog(id).done).reduce((s, id) => s + (lessons[id].minutes || 0), 0);
      const hm = m => (m >= 60 ? Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') + ' m' : m + ' min');
      const card = h('div', { class: 'unit-card' },
        h('div', { class: 'u-top' }, h('div', {}, h('div', { class: 'u-tag', text: u.tag }), h('h3', { text: u.title })), h('span', { html: ring(pct) })),
        h('p', { class: 'u-desc', html: u.desc }),
        h('div', { class: 'u-meta', text: have.length + ' lessons · about ' + hm(mins) + (left && left < mins ? ' · ' + hm(left) + ' left' : '') }));
      const ol = h('ol');
      have.forEach(id => {
        const L = lessons[id], st = lessonStatus(id);
        const status = h('span', { class: 'status ' + st.cls });
        if (st.cls === 'started') status.style.setProperty('--pct', st.pct + '%');
        ol.appendChild(h('li', {}, h('a', { href: '#/l/' + id }, status, h('span', { class: 'code', text: L.code }), h('span', { text: L.title }), h('span', { class: 'mins', text: L.minutes ? L.minutes + 'm' : '' }))));
      });
      card.appendChild(ol);
      grid.appendChild(card);
    });
    home.appendChild(grid);
    view.appendChild(home);
    Lab.renderMath(home);
  }

  /* ---------------------------------------------------------------- lesson */
  function renderLesson(L, view) {
    document.title = L.code + ' · ' + L.title + ' — ' + (Lab.course.brand || 'Revise');
    const unit = unitOf(L.id);
    setCrumbs((unit ? unit.tag + ' · ' : '') + '<b>' + Lab.esc(L.code + ' ' + L.title) + '</b>');
    Lab.store.set('last', L.id);
    const p = prog(L.id);
    const reviewAll = Lab.store.get('reviewAll', false);
    const art = h('article', { class: 'lesson' });
    const head = h('header', { class: 'lesson-head' });
    const eb = h('div', { class: 'eyebrow' }, h('span', { text: unit ? unit.tag : '' }), h('span', { class: 'dot' }), h('span', { text: L.code }));
    if (L.kicker) eb.append(h('span', { class: 'dot' }), h('span', { class: 'muted', text: L.kicker }));
    head.appendChild(eb);
    const h1 = h('h1'); Lab.setHTML(h1, L.title); head.appendChild(h1);
    if (L.lede) { const lede = h('p', { class: 'lede' }); Lab.setHTML(lede, L.lede); head.appendChild(lede); }
    const meta = h('div', { class: 'lesson-meta' });
    if (L.video) meta.appendChild(h('a', { class: 'chip video', href: 'https://www.youtube.com/watch?v=' + L.video.id, target: '_blank', rel: 'noopener', html: icon('video') + '<span>Lecture video · ' + L.video.len + '</span>' }));
    if (L.minutes) meta.appendChild(h('span', { class: 'chip', html: icon('clock') + '<span>≈ ' + L.minutes + ' min here</span>' }));
    meta.appendChild(h('span', { class: 'chip', html: icon('cards') + '<span>' + L.cards.length + ' cards</span>' }));
    const skip = h('button', { class: 'chip chip-btn', type: 'button', html: icon('target') + '<span>Skip to the questions</span>' });
    const outlineBtn = h('button', { class: 'chip chip-btn', type: 'button', html: icon('list') + '<span>Outline</span>' });
    meta.append(skip, outlineBtn);
    head.appendChild(meta);
    const outline = h('ol', { class: 'outline', hidden: true });
    L.cards.forEach((c, i) => {
      const b = h('button', { type: 'button' }, h('span', { class: 'o-kind', text: c.label || KIND[c.kind || 'concept'] || c.kind }), h('span', { class: 'o-title' }));
      Lab.setHTML(b.lastChild, c.title || '');
      b.addEventListener('click', () => jumpTo(i));
      outline.appendChild(h('li', {}, b));
    });
    head.appendChild(outline);
    outlineBtn.addEventListener('click', () => { outline.hidden = !outline.hidden; });
    art.appendChild(head);

    const toggle = h('div', { class: 'view-toggle' });
    const seg = Lab.seg([{ label: 'One card at a time', value: false }, { label: 'Show every card', value: true }], reviewAll, v => { Lab.store.set('reviewAll', v); route(); });
    toggle.appendChild(seg);
    art.appendChild(toggle);

    const cardsWrap = h('div', { class: 'cards' });
    art.appendChild(cardsWrap);
    const endWrap = h('div');
    art.appendChild(endWrap);
    view.appendChild(art);

    const total = L.cards.length;
    let shown = 0;
    const cardEls = [];

    function updateTop() { setTopProgress(shown / total, shown + ' / ' + total); }

    function mountCard(i, animate) {
      const c = L.cards[i];
      const kind = c.kind || 'concept';
      const sec = h('section', { class: 'card' + (c.wide ? ' wide' : '') + (animate ? ' enter' : ''), dataset: { kind }, id: 'card-' + (i + 1) });
      sec.appendChild(h('div', { class: 'card-kicker', html: '<i></i><span>' + (c.label || KIND[kind] || kind) + '</span><span class="num">' + (i + 1) + ' / ' + total + '</span>' }));
      if (c.title) { const t = h('h2', { class: 'card-title' }); Lab.setHTML(t, c.title); sec.appendChild(t); }
      const body = h('div', { class: 'card-body' });
      sec.appendChild(body);
      const pending = new Set();
      const foot = h('footer', { class: 'card-foot' });
      const hint = h('span', { class: 'hint' });
      const isLast = i === total - 1;
      const btn = h('button', { class: 'btn primary', type: 'button', html: '<span>' + (isLast ? 'Finish lesson' : 'Continue') + '</span>' + icon(isLast ? 'check' : 'arrowRight') });
      foot.append(hint, btn);
      const ctx = {
        lesson: L, card: c, index: i,
        gate(key) { if (i < p.reached) return; pending.add(key); refresh(); },
        ungate(key) { pending.delete(key); refresh(); },
      };
      function refresh() {
        btn.disabled = pending.size > 0;
        hint.textContent = pending.size > 0 ? 'Answer the question above to continue (or open its solution).' : '';
      }
      (typeof c.body === 'function' ? c.body() : c.body || []).forEach(b => Lab.mountBlock(b, body, ctx));
      sec.appendChild(foot);
      refresh();
      btn.addEventListener('click', () => advance(i));
      cardsWrap.appendChild(sec);
      cardEls[i] = sec;
      return sec;
    }
    function setFootVisibility() {
      cardEls.forEach((el, i) => { if (el) el.classList.toggle('done-card', i < shown - 1 || reviewAll); });
    }
    function advance(i) {
      if (i < shown - 1) return;
      if (i === total - 1) { finish(); return; }
      shown = i + 2;
      const sec = mountCard(i + 1, true);
      setFootVisibility();
      const pr = prog(L.id);
      if (shown > pr.reached) setProg(L.id, { reached: shown, done: pr.done });
      updateTop();
      requestAnimationFrame(() => sec.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }));
    }
    function finish() {
      setProg(L.id, { reached: total, done: true });
      cardEls.forEach(el => el && el.classList.add('done-card'));
      showEnd(true);
    }
    function showEnd(scroll) {
      clear(endWrap);
      const ids = orderedIds();
      const k = ids.indexOf(L.id);
      const nextId = ids[k + 1], prevId = ids[k - 1];
      const end = h('div', { class: 'lesson-end' },
        h('div', { class: 'badge', html: icon('check') }),
        h('h3', { text: 'Lesson complete' }),
        h('p', { class: 'muted', html: L.endNote || 'Nice work. If anything felt shaky, scroll up and replay the steps — they are all still live.' }));
      endWrap.appendChild(end);
      endWrap.appendChild(pager(prevId, nextId));
      if (scroll) requestAnimationFrame(() => end.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'center' }));
    }
    function pager(prevId, nextId) {
      const nav = h('nav', { class: 'lesson-pager' });
      nav.appendChild(prevId ? h('a', { class: 'pager-link', href: '#/l/' + prevId }, h('div', { class: 'dir', text: '← Previous' }), h('div', { class: 't', text: lessons[prevId].code + ' · ' + lessons[prevId].title })) : h('span'));
      nav.appendChild(nextId ? h('a', { class: 'pager-link next', href: '#/l/' + nextId }, h('div', { class: 'dir', text: 'Next →' }), h('div', { class: 't', text: lessons[nextId].code + ' · ' + lessons[nextId].title })) : h('span'));
      return nav;
    }

    function revealAllNow() {
      for (let i = shown; i < total; i++) mountCard(i, false);
      shown = total;
      setFootVisibility();
      const pr = prog(L.id);
      if (pr.reached < total) setProg(L.id, { reached: total, done: pr.done });
      updateTop();
    }
    function jumpTo(i) {
      if (i >= shown) revealAllNow();
      const el = cardEls[i];
      if (el) el.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    }
    skip.addEventListener('click', () => {
      const target = L.cards.findIndex(c => ['check', 'try', 'recall'].includes(c.kind));
      jumpTo(target >= 0 ? target : total - 1);
    });
    shown = reviewAll ? total : Math.max(1, Math.min(total, p.reached || 1));
    for (let i = 0; i < shown; i++) mountCard(i, false);
    setFootVisibility();
    if (shown > p.reached) setProg(L.id, { reached: shown, done: p.done });
    if (p.done || reviewAll) {
      if (p.done) showEnd(false);
      else { const ids = orderedIds(); const k = ids.indexOf(L.id); endWrap.appendChild(pager(ids[k - 1], ids[k + 1])); }
    }
    updateTop();
    const onScroll = () => $('#topbar').classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    Lab.onCleanup(() => window.removeEventListener('scroll', onScroll));
  }

  /* ------------------------------------------------------------------ pages */
  function renderPage(P, view) {
    document.title = P.title + ' — ' + (Lab.course.brand || 'Revise');
    setCrumbs((P.parent && pages[P.parent] ? Lab.esc(pages[P.parent].title) + ' · ' : '') + '<b>' + Lab.esc(P.title) + '</b>');
    const page = h('div', { class: 'page' });
    view.appendChild(page);
    try { P.render(page); } catch (e) { console.error(e); page.appendChild(h('div', { class: 'callout warn', text: 'This page failed to load: ' + e.message })); }
    Lab.renderMath(page);
  }
  /** Standard page header */
  Lab.pageHead = function (el, eyebrow, title, lede) {
    const head = h('header', { class: 'page-head' }, h('div', { class: 'eyebrow', text: eyebrow }));
    const h1 = h('h1'); Lab.setHTML(h1, title); head.appendChild(h1);
    if (lede) { const p = h('p', { class: 'lede' }); Lab.setHTML(p, lede); head.appendChild(p); }
    el.appendChild(head);
    return head;
  };

  /* -------------------------------------------------------------- settings */
  function buildTopbar() {
    const tb = $('#topbar');
    const menu = h('button', { class: 'icon-btn menu-btn', type: 'button', 'aria-label': 'Open menu', html: icon('menu') });
    menu.addEventListener('click', () => document.body.classList.toggle('nav-open'));
    const sideBtn = h('button', { class: 'icon-btn side-btn', type: 'button' });
    sideBtn.addEventListener('click', () => setSideHidden(!Lab.store.get('sideHidden', false)));
    const crumbs = h('div', { class: 'crumbs', id: 'crumbs' });
    const progress = h('span', { class: 'tb-progress', id: 'tb-progress' });
    const setBtn = h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Settings', html: icon('sliders') });
    const pop = h('div', { class: 'pop', hidden: true });
    const themeSeg = Lab.seg([{ label: 'Auto', value: 'auto' }, { label: 'Light', value: 'light' }, { label: 'Dark', value: 'dark' }], Lab.store.get('theme', 'auto'), v => { Lab.store.set('theme', v); applyTheme(); Lab.emit('theme'); });
    const speedSeg = Lab.seg([{ label: 'Slow', value: 0.5 }, { label: 'Normal', value: 1 }, { label: 'Fast', value: 2 }], Lab.store.get('speed', 1), v => Lab.store.set('speed', v));
    const relayout = () => { applyView(); window.dispatchEvent(new Event('resize')); };
    const zoomSeg = Lab.seg([{ label: '90%', value: 0.9 }, { label: '100%', value: 1 }, { label: '115%', value: 1.15 }, { label: '130%', value: 1.3 }, { label: '150%', value: 1.5 }], Lab.store.get('zoom', 1), v => { Lab.store.set('zoom', v); relayout(); });
    const widthSeg = Lab.seg([{ label: 'Reading', value: 'comfortable' }, { label: 'Wide', value: 'wide' }, { label: 'Full', value: 'full' }], Lab.store.get('width', 'full'), v => { Lab.store.set('width', v); relayout(); });
    const reset = Lab.button('Reset all progress', () => {
      if (reset.dataset.armed) { Lab.store.reset(); applyTheme(); applyView(); zoomSeg.set(1); widthSeg.set('full'); buildSidebar(); route(); pop.hidden = true; return; }
      reset.dataset.armed = '1'; reset.textContent = 'Press again to confirm';
      setTimeout(() => { delete reset.dataset.armed; reset.textContent = 'Reset all progress'; }, 3000);
    }, 'btn sm ghost');
    pop.append(h('div', {}, h('label', { text: 'Text size' }), zoomSeg), h('div', {}, h('label', { text: 'Page width' }), widthSeg),
      h('div', {}, h('label', { text: 'Appearance' }), themeSeg), h('div', {}, h('label', { text: 'Animation speed' }), speedSeg), h('div', {}, reset));
    setBtn.addEventListener('click', e => { e.stopPropagation(); pop.hidden = !pop.hidden; });
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== setBtn) pop.hidden = true; });
    tb.append(menu, sideBtn, crumbs, progress, setBtn, pop, h('div', { class: 'tb-bar', id: 'tb-bar' }, h('i')));
    applyView();
    window.addEventListener('scroll', () => tb.classList.toggle('scrolled', window.scrollY > 8), { passive: true });
  }

  /* -------------------------------------------------- sideways-scroll cue */
  // Wide tables, charts and formulas scroll sideways on small screens. Fade the right edge while more is hidden.
  const SCROLLERS = '.wb-scroll, .katex-display, .jt-wrap, .tbl-wrap, .map-stage, .g2-stage, .mo-host, .formula, .w-sym, .step .s-math';
  function markOne(el) {
    const more = el.scrollWidth > el.clientWidth + 2 && el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    el.classList.toggle('more-right', more);
  }
  const markAll = Lab.debounce(() => Lab.$$(SCROLLERS, $('#view')).forEach(markOne), 120);
  Lab.markScrollers = markAll;
  document.addEventListener('scroll', e => { const t = e.target; if (t && t.matches && t.matches(SCROLLERS)) markOne(t); }, true);
  window.addEventListener('resize', markAll);

  /* ------------------------------------------------------- pin to the side */
  // Any lesson card or lab panel can be pinned: it moves (live, still interactive) into a column on the right
  // that stays in view while the page scrolls. A dashed placeholder keeps its place; Unpin puts it back.
  const PINNABLE = '.cards > .card, .pl-panel, .pl-answer';
  const pinned = [];
  function dockList() {
    const dock = $('#dock');
    if (!dock.firstChild) {
      const all = h('button', { class: 'btn xs ghost', type: 'button', text: 'Unpin all' });
      all.addEventListener('click', () => pinned.slice().forEach(p => unpin(p.el)));
      const min = h('button', { class: 'icon-btn dock-min', type: 'button', 'aria-label': 'Make the pinned area small', html: icon('minus') });
      min.addEventListener('click', () => dock.classList.toggle('min'));
      const grip = h('div', { class: 'dock-grip', title: 'Drag to make the pinned area wider or narrower' });
      dragGrip(grip);
      dock.append(grip,
        h('div', { class: 'dock-head' }, h('b', { text: 'Pinned' }), h('span', { text: 'stays in view while you scroll' }), h('span', { class: 'sp' }), all, min),
        h('div', { class: 'dock-body' }, h('div', { class: 'dock-zoom' })));
    }
    return dock.querySelector('.dock-zoom');
  }
  function titleOf(el) {
    const t = el.querySelector(':scope > .card-title, :scope > .pl-panel-head h3');
    return t ? t.textContent.trim() : el.classList.contains('pl-answer') ? 'The answer' : 'This card';
  }
  /** Empty copies of the original ancestors (classes only), so lab and lesson CSS still applies in the dock. */
  function ancestorShell(from) {
    const chain = [];
    for (let a = from.parentElement; a && a.id !== 'view'; a = a.parentElement) chain.unshift(a);
    let outer = null, inner = null;
    chain.forEach(a => { const w = h('div', { class: 'dock-anc ' + a.className }); if (inner) inner.appendChild(w); else outer = w; inner = w; });
    return { outer, inner };
  }
  function pin(el) {
    if (pinned.some(p => p.el === el)) return;
    const list = dockList();
    const back = h('button', { class: 'btn xs', type: 'button', text: 'Unpin' });
    back.addEventListener('click', () => unpin(el));
    const ph = h('div', { class: 'pin-ph', html: icon('pin') }, h('span', { html: '<b>' + Lab.esc(titleOf(el)) + '</b> is pinned on the right.' }), h('span', { class: 'sp' }), back);
    el.parentNode.insertBefore(ph, el);
    const { outer, inner } = ancestorShell(ph);
    const item = h('section', { class: 'dock-item' });
    if (outer) { inner.appendChild(el); item.appendChild(outer); } else item.appendChild(el);
    list.appendChild(item);
    el.classList.add('is-pinned');
    pinned.push({ el, ph, item });
    syncPin(el);
    dockChanged();
  }
  function unpin(el) {
    const i = pinned.findIndex(p => p.el === el);
    if (i < 0) return;
    const { ph, item } = pinned[i];
    pinned.splice(i, 1);
    if (ph.isConnected) ph.parentNode.replaceChild(el, ph); else el.remove();
    item.remove();
    el.classList.remove('is-pinned');
    syncPin(el);
    dockChanged();
  }
  function clearPins() {
    pinned.splice(0).forEach(p => { p.item.remove(); p.ph.remove(); });
    dockChanged();
  }
  function dockChanged() {
    const dock = $('#dock'), on = pinned.length > 0;
    if (!dock) return;
    dock.hidden = !on;
    $('#work').classList.toggle('has-dock', on);
    if (!on) dock.classList.remove('min');
    window.dispatchEvent(new Event('resize'));
  }
  function syncPin(el) {
    const b = el.querySelector(':scope > .pin-btn');
    if (!b) return;
    const on = el.classList.contains('is-pinned');
    b.innerHTML = icon(on ? 'pinOff' : 'pin');
    b.title = on ? 'Unpin: put it back in the page' : 'Pin to the side: keep this in view while you scroll';
    b.setAttribute('aria-label', b.title);
  }
  function addPins() {
    Lab.$$(PINNABLE, $('#work')).forEach(el => {
      if (el.querySelector(':scope > .pin-btn')) return;
      const b = h('button', { class: 'icon-btn pin-btn', type: 'button' });
      b.addEventListener('click', e => { e.stopPropagation(); if (el.classList.contains('is-pinned')) unpin(el); else pin(el); });
      el.appendChild(b);
      syncPin(el);
    });
    // a lab that rebuilt its panels leaves the pinned copy stale: drop it
    pinned.filter(p => !p.ph.isConnected).forEach(p => { pinned.splice(pinned.indexOf(p), 1); p.item.remove(); });
    if (!pinned.length && !$('#dock').hidden) dockChanged();
  }
  function dragGrip(grip) {
    grip.addEventListener('pointerdown', e => {
      e.preventDefault();
      grip.setPointerCapture(e.pointerId);
      grip.classList.add('drag');
      const root = document.documentElement;
      const move = ev => {
        const r = $('#work').getBoundingClientRect();
        root.style.setProperty('--dock-w', Math.round(Math.min(r.width * 0.75, Math.max(280, r.right - ev.clientX))) + 'px');
      };
      const up = () => {
        grip.classList.remove('drag');
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', up);
        const w = parseInt(getComputedStyle(root).getPropertyValue('--dock-w'), 10);
        if (w) Lab.store.set('dockW', w);
        window.dispatchEvent(new Event('resize'));
      };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', up);
    });
  }
  Lab.pin = { pin, unpin, clear: clearPins, list: () => pinned.map(p => p.el) };

  /* ------------------------------------------------------------------- boot */
  Lab.boot = function () {
    buildTopbar();
    buildSidebar();
    $('#scrim').addEventListener('click', () => document.body.classList.remove('nav-open'));
    const pinsSoon = Lab.debounce(addPins, 150);
    if (window.MutationObserver) new MutationObserver(() => { markAll(); pinsSoon(); }).observe($('#work'), { childList: true, subtree: true });
    // hidden sidebar: it slides in when the mouse touches the left edge, and slides away when the mouse leaves it
    let peekT = 0;
    $('#side-hot').addEventListener('mouseenter', () => { clearTimeout(peekT); document.body.classList.add('side-peek'); });
    $('#sidebar').addEventListener('mouseenter', () => clearTimeout(peekT));
    $('#sidebar').addEventListener('mouseleave', () => { peekT = setTimeout(() => document.body.classList.remove('side-peek'), 300); });
    window.addEventListener('hashchange', route);
    route();
    document.documentElement.classList.add('booted');
  };

  /** Load every lesson/page file listed in the manifest, in order, then boot. */
  Lab.load = function () {
    const files = (Lab.course.files || []).slice();
    if (/[?&]dev\b/.test(location.search)) { Lab.dev = true; files.push('lessons/_dev-widgets.js'); }
    let left = files.length;
    const failed = [];
    if (!left) { Lab.boot(); return; }
    files.forEach(f => {
      const s = document.createElement('script');
      s.src = f;
      s.async = false;
      s.onload = s.onerror = ev => {
        if (ev.type === 'error') { failed.push(f); console.error('Could not load ' + f); }
        if (--left === 0) { Lab.boot(); if (failed.length) console.warn('Missing files:', failed); }
      };
      document.body.appendChild(s);
    });
  };
})();
