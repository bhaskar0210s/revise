/* Revision kit: labs for the language courses. A revision lab has no numbers to type; it holds what one lecture
   taught, in the order a revision needs it: the points to remember, the rules with the lecture's own examples,
   tricks to remember them, and a "spot it" check on the lecture's sentences (and your own).

   R.lab({ id, course, week, order, title, sub, desc, topics, video,
     minute: [html],                                   // "In one minute": 3–6 short points
     rules:  [{ term, def, examples: [{ text, note, at }], tip }],   // one card per rule or device
     tips:   [html],                                   // tricks to remember
     spot:   { options: [term], items: [{ text, answer, why, at }] },  // the quiz; answer is one of options
     check:  text => [{ term, why }],                  // optional: a rule-based look at a typed sentence
     compare: { head: [..], rows: [[..]] },            // optional: a small table (e.g. tenses side by side)
   })
   `at` is a minute mark in the lecture video: video is the YouTube id (or { id, label }). */
(function () {
  'use strict';
  const { h } = Lab;
  const R = (Lab.rev = Lab.rev || {});
  const COURSE = { e1: 'English I', e2: 'English II', s1: 'Statistics I', s2: 'Statistics II', m1: 'Mathematics I', m2: 'Mathematics II' };

  const html = (tag, attrs, content) => { const el = h(tag, attrs); Lab.setHTML(el, content || ''); return el; };
  const at = (def, min) => (def.video && min != null ? ' <span class="rv-at">(' + Lab.vlink(typeof def.video === 'string' ? def.video : def.video.id, min) + ')</span>' : '');
  const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };

  function section(title, sub, body, cls) {
    const s = h('section', { class: 'card rv-sec' + (cls ? ' ' + cls : '') });
    s.appendChild(h('h2', { class: 'card-title', text: title }));
    if (sub) s.appendChild(html('p', { class: 'rv-sub' }, sub));
    s.appendChild(body);
    return s;
  }

  function minute(def) {
    const ol = h('ol', { class: 'rv-minute' });
    def.minute.forEach(x => ol.appendChild(html('li', {}, x)));
    return section('In one minute', 'What this lecture adds. Read these first, and again before the exam.', ol);
  }

  function rules(def) {
    const grid = h('div', { class: 'rv-rules' });
    def.rules.forEach(r => {
      const c = h('article', { class: 'rv-rule' });
      c.appendChild(html('h3', {}, r.term));
      c.appendChild(html('p', { class: 'rv-def' }, r.def));
      if (r.examples && r.examples.length) {
        const ul = h('ul', { class: 'rv-ex' });
        r.examples.forEach(e => {
          const li = h('li');
          li.appendChild(html('q', {}, e.text));
          if (e.note || e.at != null) li.appendChild(html('span', { class: 'rv-note' }, (e.note || '') + at(def, e.at)));
          ul.appendChild(li);
        });
        c.appendChild(ul);
      }
      if (r.tip) c.appendChild(html('p', { class: 'rv-tip' }, '<b>Remember:</b> ' + r.tip));
      grid.appendChild(c);
    });
    return section('The rules, with the lecture’s examples', null, grid);
  }

  function tips(def) {
    const ul = h('ul', { class: 'rv-tips' });
    def.tips.forEach(x => ul.appendChild(html('li', {}, x)));
    return section('Tricks to remember', null, ul);
  }

  function compare(def) {
    const t = def.compare;
    const rows = t.rows.map(r => r.slice());
    const table = Lab.table ? Lab.table(t.head, rows) : null;
    const wrap = h('div', { class: 'tbl-wrap' });
    if (table) wrap.appendChild(table);
    return section(t.title || 'Side by side', t.sub || null, wrap);
  }

  /** The quiz: one sentence at a time, the options as buttons, the reason after each answer. */
  function spot(def) {
    const q = def.spot;
    const body = h('div', { class: 'rv-spot' });
    const items = shuffle(q.items);
    let k = 0, right = 0, answered = 0;
    const prog = h('div', { class: 'rv-prog' });
    const stage = h('div', { class: 'rv-stage' });
    const opts = h('div', { class: 'rv-opts' });
    const fb = h('div', { class: 'rv-fb', hidden: true });
    const next = Lab.button('Next sentence', () => { k++; show(); }, 'btn primary');
    const again = Lab.button('Start again', () => { items.splice(0, items.length, ...shuffle(q.items)); k = 0; right = 0; answered = 0; show(); }, 'btn ghost');
    function show() {
      fb.hidden = true; next.hidden = true;
      if (k >= items.length) {
        prog.textContent = 'Done: ' + right + ' of ' + items.length + ' right.';
        Lab.setHTML(stage, '<p class="rv-done">' + (right === items.length ? 'All of them. ' : '') + 'Go through the rules above once more for the ones you missed, then start again.</p>');
        Lab.clear(opts); return;
      }
      const it = items[k];
      prog.textContent = 'Sentence ' + (k + 1) + ' of ' + items.length + (answered ? ' · ' + right + ' right so far' : '');
      Lab.setHTML(stage, '<blockquote class="rv-q">' + it.text + '</blockquote><p class="rv-ask">' + (q.ask || 'Which one is it?') + '</p>');
      Lab.clear(opts);
      q.options.forEach(o => {
        const b = h('button', { class: 'btn sm rv-opt', type: 'button' });
        Lab.setHTML(b, o);
        b.addEventListener('click', () => {
          if (!fb.hidden) return;
          answered++;
          const ok = o === it.answer;
          if (ok) right++;
          b.classList.add(ok ? 'good' : 'bad');
          [...opts.children].forEach(x => { if (x.textContent === it.answer) x.classList.add('good'); x.disabled = true; });
          Lab.setHTML(fb, '<b>' + (ok ? 'Yes: ' : 'No, it is ') + Lab.esc(it.answer) + '.</b> ' + (it.why || '') + at(def, it.at));
          fb.hidden = false; next.hidden = false;
        });
        opts.appendChild(b);
      });
    }
    body.append(prog, stage, opts, fb, h('div', { class: 'rv-row' }, next, again));
    show();
    const sec = section('Spot it', q.sub || 'The lecture’s own sentences. Decide, then read why.', body);
    if (def.check) sec.appendChild(own(def));
    return sec;
  }

  /** "Your own sentence": a rule-based look, offered as hints, never as a verdict. */
  function own(def) {
    const box = h('div', { class: 'rv-own' });
    const ta = h('textarea', { class: 'field rv-ta', rows: 2, placeholder: 'Type a sentence of your own…' });
    const out = h('div', { class: 'rv-own-out' });
    const go = Lab.button('Look at it', () => {
      const found = def.check(ta.value || '') || [];
      Lab.setHTML(out, found.length
        ? '<ul>' + found.map(f => '<li><b>' + Lab.esc(f.term) + '</b>: ' + f.why + '</li>').join('') + '</ul><p class="rv-note">These are pattern hints from the rules above, not a verdict: meaning decides, and only you know what you meant.</p>'
        : '<p>No pattern from this lecture stands out in that sentence. Try one of the rules above on purpose.</p>');
    }, 'btn sm');
    box.append(h('h3', { text: 'Your own sentence' }), ta, go, out);
    return box;
  }

  R.mount = function (el, def) {
    const root = h('div', { class: 'rv-rev cards' });
    if (def.minute && def.minute.length) root.appendChild(minute(def));
    if (def.rules && def.rules.length) root.appendChild(rules(def));
    if (def.compare) root.appendChild(compare(def));
    if (def.tips && def.tips.length) root.appendChild(tips(def));
    if (def.spot && def.spot.items && def.spot.items.length) root.appendChild(spot(def));
    if (def.video) {
      const v = typeof def.video === 'string' ? { id: def.video } : def.video;
      root.appendChild(html('p', { class: 'rv-src' }, 'Built from the lecture video' + (v.label ? ' ' + Lab.esc(v.label) : '') + ': ' + Lab.vlink(v.id, 0, 'watch it') + '. Minute marks in brackets point into it.'));
    }
    el.appendChild(root);
    Lab.renderMath(root);
  };

  /** Register a revision lab. */
  R.lab = function (def) {
    if (!def.ic) def.ic = 'book';
    Lab.lab(Object.assign({}, def, { render: el => R.mount(el, def) }));
  };
  R.COURSE = COURSE;
})();
