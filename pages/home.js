/* Revise — home: every lab, grouped by course and week. */
(function () {
  const { h } = Lab;
  const icon = Lab.icon;
  const WEEKS = {
    s2: { 1: 'Multiple random variables: joint, marginal and conditional PMFs', 2: 'Independence, and functions of random variables' },
    m2: { 1: 'Vectors, matrices, linear systems and determinants', 2: "Determinants, Cramer's rule and row reduction", 3: 'Vector spaces, linear dependence and independence' },
  };
  const NAMES = { s2: 'Statistics II', m2: 'Mathematics II' };

  Lab.page('labs-home', {
    title: 'Labs',
    render(el) {
      Lab.pageHead(el, 'Statistics II · Mathematics II', 'Revise',
        'Labs where every number is yours. Change any value and every table, chart and step updates, with each number worked out.');
      const card = L => h('a', { class: 'lab-card', href: '#/p/' + L.id },
        h('div', { class: 'lc-top' }, h('span', { class: 'lc-ic', html: icon(L.ic || 'flask') }), h('div', {}, h('div', { class: 'lc-sub', text: L.sub || '' }), h('h3', { text: L.title }))),
        h('p', { text: L.desc || '' }),
        L.topics ? h('div', { class: 'lc-topics' }, L.topics.map(t => h('span', { text: t }))) : null);
      (Lab.course.labSections || []).forEach(([c]) => {
        const labs = (Lab.labs || []).filter(l => l.course === c);
        if (!labs.length) return;
        el.appendChild(h('div', { class: 'lab-course', text: NAMES[c] || c }));
        const weeksOf = l => (l.weeks && l.weeks.length ? l.weeks : [l.week]);
        [...new Set(labs.flatMap(weeksOf))].sort((a, b) => a - b).forEach(w => {
          el.appendChild(h('div', { class: 'lab-week' }, h('b', { text: 'Week ' + w }), h('span', { text: (WEEKS[c] || {})[w] || '' })));
          el.appendChild(h('div', { class: 'lab-grid' }, labs.filter(l => weeksOf(l).includes(w)).sort((a, b) => (a.order || 0) - (b.order || 0)).map(card)));
        });
      });
      const ios = /iPhone|iPad/.test(navigator.userAgent) && !navigator.standalone;
      if (ios) el.appendChild(h('div', { class: 'callout note rv-install', html: '<p><b>Add it to your Home Screen</b>: tap the Share button in Safari, then <b>Add to Home Screen</b>. It opens full screen and works offline after the first visit.</p>' }));
    },
  });
})();
