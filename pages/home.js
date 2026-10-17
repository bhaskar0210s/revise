/* Revise — the first page chooses a course; each course page lists its labs by week. */
(function () {
  const { h } = Lab;
  const icon = Lab.icon;
  const COURSES = [
    { key: 's2', name: 'Statistics II', full: 'Statistics for Data Science II', ic: 'sigma', term: 'This term',
      blurb: 'Joint, marginal and conditional distributions, independence, functions of random variables, sums, maxima and minima.',
      weeks: { 1: 'Multiple random variables: joint, marginal and conditional PMFs', 2: 'Independence, and functions of random variables' } },
    { key: 'm2', name: 'Mathematics II', full: 'Mathematics for Data Science II', ic: 'grid', term: 'This term',
      blurb: 'Vectors and matrices, determinants, Cramer’s rule and inverses, row reduction, vector spaces and linear dependence.',
      weeks: { 1: 'Vectors, matrices, linear systems and determinants', 2: 'Determinants, Cramer’s rule and row reduction', 3: 'Vector spaces, linear dependence and independence' } },
    { key: 'e2', name: 'English II', full: 'English II', ic: 'book', term: 'This term',
      blurb: 'Figures of speech, discourse markers, rhythm and intonation, adverbs, tenses, passives, clauses and sentence patterns.',
      weeks: { 1: 'Patterns in sentences: figures of speech, discourse, rhythm and pitch', 2: 'Patterns in sentences: adverbs, tenses, passives, adjectives', 3: 'Patterns in sentences: clauses, complements and adjuncts' } },
    { key: 's1', name: 'Statistics I', full: 'Statistics for Data Science I', ic: 'sigma', term: 'Foundation',
      blurb: 'Data and scales, describing one and two variables, counting, probability, conditional probability, random variables and their distributions.',
      weeks: { 1: 'Types of data and scales of measurement', 2: 'Describing categorical data', 3: 'Describing numerical data', 4: 'Association between two variables', 5: 'Counting and permutations', 6: 'Combinations', 7: 'Probability: events and axioms', 8: 'Conditional probability, independence, Bayes', 9: 'Random variables, PMF, CDF', 10: 'Expectation and variance', 11: 'Binomial, hypergeometric, Poisson', 12: 'Continuous random variables and the normal' } },
    { key: 'm1', name: 'Mathematics I', full: 'Mathematics for Data Science I', ic: 'grid', term: 'Foundation',
      blurb: 'Sets, relations and functions, straight lines, quadratics, polynomials, exponentials and logarithms, limits, derivatives, integrals and graphs.',
      weeks: { 1: 'Number systems, sets, relations and functions', 2: 'Coordinates and straight lines', 3: 'Quadratic functions and equations', 4: 'Polynomials: arithmetic and graphs', 5: 'One-to-one functions, exponentials, composition and inverses', 6: 'Logarithms', 7: 'Functions, limits and continuity', 8: 'Derivatives and their uses', 9: 'Areas and integrals', 10: 'Graphs: BFS, DFS and DAGs', 11: 'Longest and shortest paths, spanning trees', 12: 'Revision' } },
    { key: 'e1', name: 'English I', full: 'English I', ic: 'book', term: 'Foundation',
      blurb: 'Speech sounds, parts of speech and articles, vocabulary and idioms, spoken English, tenses and agreement, reading, listening, stress, presentations, common errors and writing.',
      weeks: { 1: 'Speech sounds: vowels, consonants, clusters', 2: 'Parts of speech and articles', 3: 'Vocabulary, modal verbs, phrases and idioms', 4: 'Spoken English preliminaries', 5: 'Tenses and subject–verb agreement', 6: 'Reading: skimming, scanning, SQ3R, critical reading', 7: 'Listening', 8: 'Stress, aspiration and syllables', 9: 'Presentations, group discussions, storytelling', 10: 'Common errors and written expression', 11: 'Fundamentals of writing', 12: 'Professional writing' } },
  ];
  const weeksOf = l => (l.weeks && l.weeks.length ? l.weeks : [l.week]);
  const labsOf = key => (Lab.labs || []).filter(l => l.course === key);
  const current = () => Lab.store.get('course', null);
  /** Remember the course; the sidebar then lists only its weeks. */
  function choose(key) {
    if (current() === key) return;
    Lab.store.set('course', key);
    if (Lab.rebuildSidebar) Lab.rebuildSidebar();
  }
  Lab.course.pickCourse = current;
  Lab.course.labsIndex = def => 'p/course-' + def.course;   // "All labs" on a lab page returns to its course
  Lab.course.onLabOpen = def => choose(def.course);

  const CSS = [
    '.rv-courses { display: grid; gap: 14px; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); margin: 6px 0 10px; }',
    '.rv-rev .lab-course, .page .lab-course:first-of-type { margin-top: 18px; }',
    '.rv-course { display: grid; grid-template-columns: 52px minmax(0, 1fr) 22px; gap: 16px; align-items: center; padding: 20px 18px 20px 20px; border-radius: var(--r-xl); background: var(--bg-elev); border: 1px solid var(--line); box-shadow: var(--shadow-1); color: var(--ink); transition: border-color .15s, box-shadow .15s, transform .15s; }',
    '.rv-course:hover { text-decoration: none; border-color: var(--accent-line); box-shadow: var(--shadow-2); transform: translateY(-1px); }',
    '.rv-course:active { transform: scale(.995); }',
    '.rv-course.current { border-color: var(--accent-line); }',
    '.rv-course-ic { width: 52px; height: 52px; border-radius: 16px; display: grid; place-items: center; background: var(--accent-soft); color: var(--accent-ink); }',
    '.rv-course-ic svg { width: 26px; height: 26px; }',
    '.rv-course-sub { font-size: 12.5px; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; color: var(--ink-3); }',
    '.rv-course h2 { margin: 2px 0 6px; font-family: var(--font-serif); font-size: 26px; font-weight: 600; line-height: 1.15; }',
    '.rv-course p { margin: 0 0 8px; color: var(--ink-2); font-size: 15px; line-height: 1.5; }',
    '.rv-course-meta { font-size: 13px; color: var(--ink-3); }',
    '.rv-course-meta b { color: var(--accent-ink); font-weight: 650; }',
    '.rv-course-go { color: var(--ink-3); } .rv-course-go svg { width: 22px; height: 22px; }',
    '.rv-switch { margin: 2px 0 18px; max-width: 420px; }',
    '@media (max-width: 560px) { .rv-course { grid-template-columns: 44px minmax(0, 1fr) 20px; gap: 12px; padding: 18px 14px 18px 16px; } .rv-course-ic { width: 44px; height: 44px; border-radius: 14px; } .rv-course-ic svg { width: 22px; height: 22px; } .rv-course h2 { font-size: 23px; } }',
  ].join('\n');

  const card = L => h('a', { class: 'lab-card', href: '#/p/' + L.id },
    h('div', { class: 'lc-top' }, h('span', { class: 'lc-ic', html: icon(L.ic || 'flask') }), h('div', {}, h('div', { class: 'lc-sub', text: L.sub || '' }), h('h3', { text: L.title }))),
    h('p', { text: L.desc || '' }),
    L.topics ? h('div', { class: 'lc-topics' }, L.topics.map(t => h('span', { text: t }))) : null);

  function courseList(el, c) {
    const labs = labsOf(c.key);
    [...new Set(labs.flatMap(weeksOf))].sort((a, b) => a - b).forEach(w => {
      el.appendChild(h('div', { class: 'lab-week' }, h('b', { text: 'Week ' + w }), h('span', { text: c.weeks[w] || '' })));
      el.appendChild(h('div', { class: 'lab-grid' }, labs.filter(l => weeksOf(l).includes(w)).sort((a, b) => (a.order || 0) - (b.order || 0)).map(card)));
    });
  }

  Lab.page('labs-home', {
    title: 'Courses',
    render(el) {
      Lab.pageHead(el, 'Revise', 'Which course today?', 'Pick a course to see its labs. Every lab takes your own numbers and works out every step.');
      const groups = [...new Set(COURSES.map(c => c.term))];
      groups.forEach(term => {
      el.appendChild(h('div', { class: 'lab-course', text: term }));
      const grid = h('div', { class: 'rv-courses' });
      COURSES.filter(c => c.term === term).forEach(c => {
        const labs = labsOf(c.key);
        const ws = [...new Set(labs.flatMap(weeksOf))].sort((a, b) => a - b);
        const last = current() === c.key;
        grid.appendChild(h('a', { class: 'rv-course' + (last ? ' current' : ''), href: '#/p/course-' + c.key, 'aria-label': c.name + ', ' + labs.length + ' labs' },
          h('div', { class: 'rv-course-ic', html: icon(c.ic) }),
          h('div', {},
            h('div', { class: 'rv-course-sub', text: c.full }),
            h('h2', { text: c.name }),
            h('p', { text: c.blurb }),
            h('div', { class: 'rv-course-meta', html: labs.length + ' labs · Week' + (ws.length > 1 ? 's ' : ' ') + Lab.esc(ws.join(', ')) + (last ? ' · <b>last opened</b>' : '') })),
          h('span', { class: 'rv-course-go', html: icon('arrowRight') })));
      });
      el.appendChild(grid);
      });
      const ios = /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone;
      if (ios) el.appendChild(h('div', { class: 'callout note rv-install', html: '<p><b>Add it to your Home Screen</b>: tap the Share button in Safari, then <b>Add to Home Screen</b>. It opens full screen and works offline after the first visit.</p>' }));
      el.appendChild(h('style', { text: CSS }));
    },
  });

  COURSES.forEach(c => Lab.page('course-' + c.key, {
    title: c.name,
    render(el) {
      choose(c.key);
      Lab.pageHead(el, 'Revise · ' + c.full, c.name, 'Labs by week. Change any value and every table, chart and step updates, with each number worked out.');
      const sw = Lab.seg(COURSES.map(x => ({ label: x.name, value: x.key })), c.key, v => { if (v !== c.key) location.hash = '#/p/course-' + v; });
      sw.classList.add('rv-switch');
      sw.setAttribute('aria-label', 'Course');
      el.appendChild(sw);
      if (!labsOf(c.key).length) el.appendChild(h('div', { class: 'callout note', html: '<p>The labs for this course are being built. Check back soon.</p>' }));
      courseList(el, c);
      el.appendChild(h('style', { text: CSS }));
    },
  }));
})();
