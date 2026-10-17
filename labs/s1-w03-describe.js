/* Playground lab — Statistics I, Week 3: describe a numerical dataset (lab-s1-describe).
   The learner types any list of numbers; every panel is recomputed from that list:
   sorted data with positions, mean / median / mode, range / variance / SD (deviations table and the
   computational form), percentiles by BOTH course methods (lecture np-method, Sheets interpolation),
   quartiles, IQR, fences, outliers, box plot, dot plot, shift and scale, and the effect of one far value.
   Arithmetic is exact (BigInt fractions). A value is printed exactly when it has at most 6 decimal places,
   otherwise as a fraction and/or rounded to 4 decimal places with "≈".
   Course rules: Statistics I revision notes, Week 3 (L3.1–L3.5).
   This file also defines Lab.play.stat1 (exact numbers, statistics, table and chart helpers),
   which labs/s1-w03-freq.js uses too (it reads it at render time, after every file has loaded). */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg } = Lab;

  /* ======================================================================
     Week 3 kit — shared with labs/s1-w03-freq.js through Lab.play.stat1
     ====================================================================== */
  const S = K.stat1 || (K.stat1 = makeStat());

  function makeStat() {
    const TEN = 10n;
    const bgcd = (a, b) => { if (a < 0n) a = -a; if (b < 0n) b = -b; while (b) { const t = a % b; a = b; b = t; } return a; };

    /** Exact rational number n/d (BigInt, d > 0, lowest terms). */
    class R {
      constructor(n, d) {
        if (d === undefined) d = 1n;
        if (d === 0n) throw new Error('Division by zero');
        if (d < 0n) { n = -n; d = -d; }
        const g = bgcd(n, d);
        if (g > 1n) { n /= g; d /= g; }
        this.n = n; this.d = d;
      }
      add(o) { return new R(this.n * o.d + o.n * this.d, this.d * o.d); }
      sub(o) { return new R(this.n * o.d - o.n * this.d, this.d * o.d); }
      mul(o) { return new R(this.n * o.n, this.d * o.d); }
      div(o) { if (o.n === 0n) throw new Error('Division by zero'); return new R(this.n * o.d, this.d * o.n); }
      neg() { return new R(-this.n, this.d); }
      abs() { return this.n < 0n ? this.neg() : this; }
      cmp(o) { const x = this.n * o.d - o.n * this.d; return x < 0n ? -1 : x > 0n ? 1 : 0; }
      eq(o) { return this.n === o.n && this.d === o.d; }
      isInt() { return this.d === 1n; }
      isZero() { return this.n === 0n; }
      sign() { return this.n < 0n ? -1 : this.n > 0n ? 1 : 0; }
      floor() { let q = this.n / this.d; if (this.n < 0n && q * this.d !== this.n) q -= 1n; return q; }
      ceil() { let q = this.n / this.d; if (this.n > 0n && q * this.d !== this.n) q += 1n; return q; }
      num() { const v = Number(this.n) / Number(this.d); return Number.isFinite(v) ? v : Number(decStr(this, 12)); }
      valueOf() { return this.num(); }
      toString() { return this.d === 1n ? String(this.n) : this.n + '/' + this.d; }
    }
    const int = k => new R(BigInt(k));
    const frac = (a, b) => new R(BigInt(a), BigInt(b));
    const R0 = int(0), R1 = int(1), R2 = int(2);
    const sumR = arr => arr.reduce((a, b) => a.add(b), R0);

    /** Exact value of a decimal string ("160.5", "-3", "2.5e3"); null if it is not one. */
    function parseDec(s) {
      const m = String(s).trim().replace(/^−/, '-').match(/^([+-]?)(\d*)(?:\.(\d*))?(?:e([+-]?\d+))?$/i);
      if (!m || (!m[2] && !m[3])) return null;
      let n = BigInt((m[2] || '0') + (m[3] || ''));
      let d = TEN ** BigInt((m[3] || '').length);
      const e = m[4] ? parseInt(m[4], 10) : 0;
      if (Math.abs(e) > 300) return null;
      if (e > 0) n *= TEN ** BigInt(e); else if (e < 0) d *= TEN ** BigInt(-e);
      return new R(m[1] === '-' ? -n : n, d);
    }
    /** Any number-like value (R, Lab.Frac, number, "7/2") → R. */
    function from(x) {
      if (x instanceof R) return x;
      if (typeof x === 'bigint') return new R(x);
      if (typeof x === 'number') { if (!Number.isFinite(x)) throw new Error('Not a finite number'); return parseDec(String(x)); }
      if (x instanceof Lab.Frac) return x.approx ? parseDec(String(Number(x))) : new R(BigInt(x.n), BigInt(x.d));
      const r = parseDec(x);
      if (r) return r;
      const f = K.parseNum(x);
      if (f == null) throw new Error('Not a number: ' + x);
      return from(f);
    }
    /** Read a typed list of numbers (commas, spaces or semicolons between them). → {vals: R[], bad: [token]} */
    function parseList(text) {
      const toks = String(text).replace(/−/g, '-').split(/[\s,;]+/).map(t => t.trim()).filter(Boolean);
      const vals = [], bad = [];
      toks.forEach(t => {
        let v = parseDec(t);
        if (!v) { try { const f = K.parseNum(t); v = f == null ? null : from(f); } catch (e) { v = null; } }
        if (v) vals.push(v); else bad.push(t);
      });
      return { vals, bad };
    }
    /** A slider value (a float such as 1.8000000000000003) → the short decimal it stands for. */
    const fromSlider = v => parseDec(String(+Number(v).toFixed(6)));
    /** One typed number ("2.5", "-3", "7/2") → R, or null. */
    function readNum(s) {
      const t = String(s).trim().replace(/−/g, '-');
      if (!t) return null;
      const r = parseDec(t);
      if (r) return r;
      try { const f = K.parseNum(t); return f == null ? null : from(f); } catch (e) { return null; }
    }
    /** Decimal string that reads back as the same number (exact up to 12 places). */
    const str = q => decStr(q, places(q) <= 12 ? places(q) : 12);

    /**
     * Number box + slider. Unlike numField, a typed value is used exactly as typed (no rounding to the
     * slider step, and it may lie outside the slider range). onChange(R, text).
     */
    function freeField({ label, min, max, step, value, onChange, hint }) {
      let lo = min, hi = max;
      const input = h('input', { class: 'field mono pl-num w3-free', type: 'text', inputmode: 'decimal', value: String(value), spellcheck: 'false', autocomplete: 'off' });
      const range = h('input', { class: 'slider pl-range', type: 'range', min: lo, max: hi, step, value: Number(value) });
      const lab = h('label', { class: 'pl-label' });
      Lab.setHTML(lab, label);
      const hintEl = h('div', { class: 'pl-hint' });
      if (hint) Lab.setHTML(hintEl, hint);
      const wrap = h('div', { class: 'pl-field' }, lab, h('div', { class: 'pl-row' }, input, range), hintEl);
      const paint = v => { const c = Math.max(lo, Math.min(hi, v)); range.value = c; range.style.setProperty('--pct', (hi > lo ? ((c - lo) / (hi - lo)) * 100 : 0) + '%'); };
      input.addEventListener('input', () => {
        const r = readNum(input.value);
        if (!r) { input.classList.add('bad'); return; }
        input.classList.remove('bad');
        paint(r.num());
        onChange(r, input.value.trim());
      });
      range.addEventListener('input', () => {
        const s = String(+Number(range.value).toFixed(6));
        input.value = s;
        input.classList.remove('bad');
        paint(Number(s));
        onChange(parseDec(s), s);
      });
      paint(Number(value));
      wrap.set = v => { input.value = String(v); input.classList.remove('bad'); const r = readNum(v); paint(r ? r.num() : lo); };
      wrap.setRange = (a, b, s) => { lo = a; hi = b; range.min = a; range.max = b; if (s) range.step = s; const r = readNum(input.value); paint(r ? r.num() : lo); };
      wrap.input = input;
      wrap.hint = html => Lab.setHTML(hintEl, html || '');
      return wrap;
    }

    /* ---------------------------------------------------------- printing */
    /** Number of decimal places of q if it is a terminating decimal, else Infinity. */
    function places(q) { let d = q.d, a = 0, b = 0; while (d % 2n === 0n) { d /= 2n; a++; } while (d % 5n === 0n) { d /= 5n; b++; } return d === 1n ? Math.max(a, b) : Infinity; }
    /** q rounded to dp places (half away from zero), trailing zeros dropped, ASCII minus. */
    function decStr(q, dp) {
      const neg = q.n < 0n, a = neg ? -q.n : q.n;
      const scale = TEN ** BigInt(dp);
      let s = ((2n * a * scale + q.d) / (2n * q.d)).toString();
      if (dp > 0) {
        s = s.padStart(dp + 1, '0');
        s = (s.slice(0, s.length - dp) + '.' + s.slice(s.length - dp)).replace(/0+$/, '').replace(/\.$/, '');
      }
      return neg && s !== '0' ? '-' + s : s;
    }
    const MAXP = 6;
    /** true when q is a decimal with at most 6 places (printed exactly). */
    const exact = q => places(q) <= MAXP;
    function group(s, sep) {
      const m = s.match(/^(-?)(\d+)(\.\d+)?$/);
      if (!m || m[2].length < 5) return s;
      return m[1] + m[2].replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (m[3] || '');
    }
    const decOf = q => decStr(q, exact(q) ? places(q) : 4);
    /** TeX: exact decimal, or rounded to 4 places (only where "≈" is said nearby). */
    const vt = q => group(decOf(q), '{,}');
    function fracOk(q) { const a = q.n < 0n ? -q.n : q.n; return q.d <= 100000n && a <= 1000000000n; }
    function fracTex(q) { const neg = q.n < 0n; return (neg ? '-' : '') + '\\frac{' + (neg ? -q.n : q.n) + '}{' + q.d + '}'; }
    /** TeX: shortest exact form (decimal, else fraction, else 4-place decimal). */
    const nt = q => (exact(q) ? vt(q) : fracOk(q) ? fracTex(q) : vt(q));
    /** TeX for a value on its own: "65.2", or "\frac{979}{15}\approx 65.2667", or "\approx 65.2667". */
    const full = q => (exact(q) ? vt(q) : (fracOk(q) ? fracTex(q) : '') + '\\approx ' + vt(q));
    /** TeX for "= value" (or "≈ value"). */
    const eqt = q => { const f = full(q); return f.indexOf('\\approx') === 0 ? f : '=' + f; };
    /** Plain text: exact decimal, or "≈ " + 4 places. Unicode minus, thousands commas from 10 000. */
    const ht = q => (exact(q) ? '' : '≈ ') + group(decOf(q), ',').replace(/^-/, '−');
    /** Wrap a negative TeX number in brackets (inside sums and products). */
    const par = t => (t.charAt(0) === '-' ? '(' + t + ')' : t);
    /** TeX for q ÷ m: a fraction bar when q is a short decimal, else "q \div m". */
    const divTex = (q, m) => (exact(q) ? '\\frac{' + vt(q) + '}{' + m + '}' : par(nt(q)) + '\\div ' + m);
    /** TeX of a written-out sum; long sums keep the first and last terms. */
    function sumTex(qs, f, max) {
      f = f || (q => par(vt(q)));
      max = max || 40;
      const t = qs.map(f);
      return t.length > max ? t.slice(0, max - 6).join('+') + '+\\cdots+' + t.slice(-5).join('+') : t.join('+');
    }

    /* ------------------------------------------------------ square roots */
    function isqrt(n) { if (n < 2n) return n; let x = n, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + n / x) / 2n; } return x; }
    function sqrtExact(q) { if (q.n < 0n) return null; const a = isqrt(q.n), b = isqrt(q.d); return a * a === q.n && b * b === q.d ? new R(a, b) : null; }
    /** √q to dp places, correctly rounded (from the floor of √q to dp + 2 places). */
    function sqrtDec(q, dp = 4) { const k = BigInt(dp + 2); return decStr(new R(isqrt(q.n * TEN ** (2n * k) / q.d), TEN ** k), dp); }
    const sqrtFull = q => { const r = sqrtExact(q); return r ? full(r) : '\\approx ' + group(sqrtDec(q), '{,}'); };
    const sqrtEq = q => { const f = sqrtFull(q); return f.indexOf('\\approx') === 0 ? f : '=' + f; };
    const sqrtHt = q => { const r = sqrtExact(q); return r ? ht(r) : '≈ ' + group(sqrtDec(q), ',').replace(/^-/, '−'); };

    /* -------------------------------------------------------- statistics */
    const sorted = vals => vals.slice().sort((a, b) => a.cmp(b));
    function medianOf(xs) {
      const n = xs.length;
      if (n % 2) { const k = (n + 1) / 2; return { odd: true, pos: [k], value: xs[k - 1] }; }
      const k = n / 2;
      return { odd: false, pos: [k, k + 1], value: xs[k - 1].add(xs[k]).div(R2) };
    }
    /** Frequencies of a sorted list. modes = values with the top count (none when no value repeats). */
    function modesOf(xs) {
      const groups = [];
      xs.forEach(x => { const g = groups[groups.length - 1]; if (g && g.v.eq(x)) g.f++; else groups.push({ v: x, f: 1 }); });
      const top = groups.reduce((m, g) => Math.max(m, g.f), 0);
      return { groups, top, modes: top > 1 ? groups.filter(g => g.f === top).map(g => g.v) : [] };
    }
    /** Everything Week 3 needs about one list (vals in typed order). */
    function describe(vals) {
      const n = vals.length, N = int(n);
      const xs = sorted(vals);
      const sum = sumR(xs);
      const sumsq = sumR(xs.map(x => x.mul(x)));
      const mean = sum.div(N);
      const devs = xs.map(x => x.sub(mean));
      const dev2 = devs.map(d => d.mul(d));
      const ss = sumR(dev2);
      return {
        n, vals, xs, sum, sumsq, mean, devs, dev2, ss,
        pvar: ss.div(N), svar: n > 1 ? ss.div(int(n - 1)) : null,
        med: medianOf(xs), mo: modesOf(xs), min: xs[0], max: xs[n - 1], range: xs[n - 1].sub(xs[0]),
      };
    }
    /** Lecture / textbook percentile: np not whole → position ⌈np⌉; np whole → average of positions np and np+1. */
    function pctLecture(xs, p) {
      const n = xs.length, np = int(n).mul(p);
      if (np.isInt()) {
        const k = Number(np.n);
        if (k >= 1 && k < n) return { np, whole: true, pos: [k, k + 1], value: xs[k - 1].add(xs[k]).div(R2) };
        const j = Math.min(Math.max(k, 1), n);
        return { np, whole: true, edge: true, pos: [j], value: xs[j - 1] };
      }
      const c = Number(np.ceil());
      return { np, whole: false, pos: [c], value: xs[c - 1] };
    }
    /** Google Sheets / tutorial percentile: rank = p(n−1)+1 = i + f → x[i] + f·(x[i+1] − x[i]). */
    function pctSheets(xs, p) {
      const n = xs.length, rank = p.mul(int(n - 1)).add(R1);
      const i = Number(rank.floor()), f = rank.sub(int(i));
      if (f.isZero() || i >= n) return { rank, i, f, pos: [i], value: xs[i - 1] };
      const lo = xs[i - 1], hi = xs[i];
      return { rank, i, f, lo, hi, pos: [i, i + 1], value: lo.add(f.mul(hi.sub(lo))) };
    }
    const PCT = { lec: pctLecture, sheets: pctSheets };
    /** Quartiles, IQR, fences, outliers and whisker ends by one method ('lec' | 'sheets'). xs sorted. */
    function boxStats(xs, method) {
      const P = PCT[method] || pctLecture;
      const q = [frac(1, 4), frac(1, 2), frac(3, 4)].map(p => P(xs, p));
      const q1 = q[0].value, q2 = q[1].value, q3 = q[2].value;
      const iqr = q3.sub(q1), step = iqr.mul(frac(3, 2));
      const lo = q1.sub(step), hi = q3.add(step);
      const outs = xs.filter(x => x.cmp(lo) < 0 || x.cmp(hi) > 0);
      const ins = xs.filter(x => x.cmp(lo) >= 0 && x.cmp(hi) <= 0);
      return { q, q1, q2, q3, iqr, step, lo, hi, outs, ins, wLo: ins.length ? ins[0] : q1, wHi: ins.length ? ins[ins.length - 1] : q3 };
    }

    /* ---------------------------------------------------- tables, charts */
    /** Plain table (no KaTeX needed in the body). rows: arrays of HTML, or {cells, cls}. opts: foot, cls, scroll. */
    function table(head, rows, opts = {}) {
      const t = h('table', { class: 'tbl w3-tbl' + (opts.cls ? ' ' + opts.cls : '') });
      if (head) { const tr = h('tr'); head.forEach(c => tr.appendChild(h('th', { html: c }))); t.appendChild(h('thead', {}, tr)); }
      const tb = h('tbody');
      rows.forEach(r => { const tr = h('tr', { class: r.cls || null }); (r.cells || r).forEach(c => tr.appendChild(h('td', { html: c }))); tb.appendChild(tr); });
      t.appendChild(tb);
      if (opts.foot) { const tr = h('tr'); opts.foot.forEach(c => tr.appendChild(h('td', { html: c }))); t.appendChild(h('tfoot', {}, tr)); }
      return h('div', { class: 'tbl-wrap w3-tw' + (opts.scroll ? ' w3-scrolly' : '') }, t);
    }
    function chartWidth(el) { const w = el ? el.clientWidth : 0; // layout px: stays right under the text-size zoom
    return Math.round(Math.max(280, Math.min(1000, w || 640))); }
    function niceStep(raw) { const mag = Math.pow(10, Math.floor(Math.log10(raw))); const e = raw / mag; return (e >= 7.5 ? 10 : e >= 3.5 ? 5 : e >= 1.5 ? 2 : 1) * mag; }
    function niceTicks(lo, hi, target) {
      const step = niceStep((hi - lo) / Math.max(1, target));
      const out = [];
      for (let k = Math.ceil(lo / step - 1e-9); k * step <= hi + step * 1e-9; k++) out.push(+(k * step).toPrecision(12));
      return { ticks: out, step };
    }
    function tickFmt(v, step) {
      const dp = Math.max(0, Math.min(6, -Math.floor(Math.log10(step) + 1e-9)));
      let s = v.toFixed(dp);
      if (/^-0(\.0+)?$/.test(s)) s = s.slice(1);
      return group(s, ',').replace(/^-/, '−');
    }
    /** [lo, hi] around some numbers, with a little air on both sides. */
    function domain(nums, padFrac = 0.06) {
      let lo = Math.min(...nums), hi = Math.max(...nums);
      if (!(hi > lo)) { const d = Math.max(1, Math.abs(lo) * 0.1); lo -= d; hi += d; }
      const pad = (hi - lo) * padFrac;
      return [lo - pad, hi + pad];
    }
    const textW = (s, px = 12) => String(s).length * px * 0.6;
    /** Give each label a row so that none overlap. items: [{x, w}] → item.row, item.cx. Returns the row count. */
    function placeRows(items, W, gap = 8) {
      const ends = [];
      items.slice().sort((a, b) => a.x - b.x).forEach(it => {
        const left = Math.min(Math.max(2, it.x - it.w / 2), W - 2 - it.w);
        let r = 0;
        while (ends[r] != null && left < ends[r] + gap) r++;
        ends[r] = left + it.w; it.row = r; it.cx = left + it.w / 2;
      });
      return ends.length;
    }
    const ordinal = k => { const t = k % 100; return k + (t >= 11 && t <= 13 ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' }[k % 10] || 'th')); };
    /** The answer box's big line as separate formulas that wrap on a narrow screen. */
    const bigLine = texs => h('div', { class: 'pl-ans-big w3-bigs' }, texs.map(t => h('span', { html: Lab.tex(t, true) })));

    /** Cut a TeX chain "a=b=c\approx d" just before each top-level "=" and "\approx". */
    function splitEq(t) {
      const out = [];
      let depth = 0, cur = '';
      for (let i = 0; i < t.length; i++) {
        const c = t[i];
        if (depth === 0 && cur.trim() && (c === '=' || t.startsWith('\\approx', i))) { out.push(cur); cur = ''; }
        if (c === '\\') {
          const cmd = t.slice(i).match(/^\\([a-zA-Z]+|.)/)[0];
          if (cmd === '\\left') depth++; else if (cmd === '\\right') depth--;
          cur += cmd; i += cmd.length - 1;
          continue;
        }
        if (c === '{') depth++; else if (c === '}') depth--;
        cur += c;
      }
      if (cur.trim()) out.push(cur);
      return out;
    }
    /** A display formula that wraps before its "=" signs when the screen is narrow. */
    const chain = t => h('div', { class: 's-math w3-chain' }, splitEq(t).map(p => h('span', { html: Lab.tex(p, true) })));
    /** Several display formulas, one per line (each may wrap). */
    const mathLines = (...ts) => h('div', { class: 'w3-mlines' }, ts.filter(Boolean).map(chain));
    /** Numbered steps: html, then math (wrapping chain), then block, then note. */
    function steps(list) {
      const ol = h('ol', { class: 'pl-steps' });
      list.filter(Boolean).forEach((s, k) => {
        const body = h('div', { class: 's-body' });
        ol.appendChild(h('li', {}, h('span', { class: 's-num', text: String(k + 1) }), body));
        if (s.html) body.appendChild(K.note(s.html, ''));
        if (s.math) body.appendChild(chain(s.math));
        if (s.block) Lab.mountBlock(s.block, body);
        if (s.note) body.appendChild(K.note(s.note, 'small muted'));
      });
      return ol;
    }
    /**
     * Examples menu in groups (lecture examples first): groups [{label, items: [{label, source, …}]}].
     * Option values are positions in the flat list; the chosen item's source is shown under the menu.
     */
    function presetMenu({ label = 'Examples', groups, onPick }) {
      const sel = h('select', { class: 'field pl-select', 'aria-label': 'examples' });
      sel.appendChild(h('option', { value: '', text: '— choose an example —' }));
      const all = [];
      groups.forEach(g => {
        const og = h('optgroup', { label: g.label });
        g.items.forEach(it => { og.appendChild(h('option', { value: String(all.length), text: it.label })); all.push(it); });
        sel.appendChild(og);
      });
      const src = h('div', { class: 'pl-hint w3-src' });
      sel.addEventListener('change', () => {
        if (sel.value === '') { Lab.setHTML(src, ''); return; }
        const it = all[+sel.value];
        Lab.setHTML(src, it.source || '');
        onPick(it);
      });
      const lab = h('label', { class: 'pl-label' });
      Lab.setHTML(lab, label);
      const wrap = h('div', { class: 'pl-field' }, lab, sel, src);
      wrap.select = sel;
      return wrap;
    }

    /** Table cell: one formula per line; a line may wrap only before its "=" / "≈" signs. */
    const cellLines = (...ts) => ts.filter(Boolean).map(t => '<div class="w3-l">' + splitEq(t).map(p => '<span>' + Lab.tex(p) + '</span>').join('') + '</div>').join('');
    /** TeX "\frac{total}{m} = value", without repeating a fraction that is already in lowest terms. */
    function overTex(total, m, q) {
      const base = exact(total) ? '\\frac{' + vt(total) + '}{' + m + '}' : par(nt(total)) + '\\div ' + m;
      if (!exact(q) && fracOk(q) && total.isInt() && q.d === BigInt(m)) return base + '\\approx ' + vt(q);
      return base + eqt(q);
    }

    return {
      bigLine, splitEq, chain, mathLines, steps, cellLines, overTex, presetMenu,
      R, int, frac, R0, R1, R2, sumR, parseDec, from, parseList, fromSlider, readNum, str, freeField,
      places, decStr, exact, vt, nt, full, eqt, ht, par, divTex, sumTex, fracTex, fracOk,
      sqrtExact, sqrtDec, sqrtFull, sqrtEq, sqrtHt,
      sorted, medianOf, modesOf, describe, pctLecture, pctSheets, PCT, boxStats,
      table, chartWidth, niceStep, niceTicks, tickFmt, domain, textW, placeRows, ordinal,
    };
  }

  /* ======================================================================
     Charts for this lab (SVG, drawn at the real width of their box)
     ====================================================================== */
  const tex = s => Lab.tex(s);

  /**
   * Dot plot on a number line. xs: R[] (sorted). Repeated or close values stack upwards.
   * o: {marks: [{v: R, kind: 'mean'|'med', label}], lo, hi (fixed domain), cls(i) → extra class, title(i), onPick(i)}
   * Returns {inv(px) → value} for dragging.
   */
  function dotPlot(host, xs, o = {}) {
    const W = S.chartWidth(host);
    const nums = xs.map(x => x.num());
    let lo = o.lo, hi = o.hi;
    if (lo == null || hi == null) [lo, hi] = S.domain(nums.concat((o.marks || []).map(m => m.v.num())));
    const pl = 16, pr = 16;
    const X = v => pl + ((v - lo) / (hi - lo)) * (W - pl - pr);
    let rad = 6, lv = [], nLev = 1;
    for (const r of [6, 4.5, 3, 2]) {
      rad = r;
      const last = [];
      lv = nums.map(v => { const x = X(v); let L = 0; while (last[L] != null && x - last[L] < 2 * r + 0.5) L++; last[L] = x; return L; });
      nLev = Math.max(1, last.length);
      if (nLev * (2 * r + 1) <= 150) break;
    }
    const marks = (o.marks || []).map(m => ({ ...m, x: X(m.v.num()), w: S.textW(m.label) + 18 }));
    const nRows = marks.length ? S.placeRows(marks, W) : 0;
    const rowH = 18, top = 6 + nRows * rowH;
    const axisY = top + 8 + nLev * (2 * rad + 1) + 4;
    const H = axisY + 26;
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w3-svg', role: 'img', 'aria-label': 'dot plot of the ' + xs.length + ' values' });
    const { ticks, step } = S.niceTicks(lo, hi, Math.max(3, Math.floor(W / 95)));
    ticks.forEach(t => {
      const x = X(t);
      s.appendChild(svg('line', { x1: x, x2: x, y1: axisY, y2: axisY + 5, class: 'w3-tk' }));
      s.appendChild(svg('text', { x, y: axisY + 19, 'text-anchor': 'middle', class: 'w3-tick' }, S.tickFmt(t, step)));
    });
    s.appendChild(svg('line', { x1: pl - 6, x2: W - pr + 6, y1: axisY, y2: axisY, class: 'w3-axis' }));
    marks.forEach(m => { m.y = 6 + m.row * rowH + 13; s.appendChild(svg('line', { x1: m.x, x2: m.x, y1: m.y + 4, y2: axisY, class: 'w3-mark ' + m.kind })); });
    marks.forEach(m => {
      const kx = m.cx - m.w / 2;
      s.appendChild(svg('line', { x1: kx, x2: kx + 12, y1: m.y - 4, y2: m.y - 4, class: 'w3-mark key ' + m.kind }));
      s.appendChild(svg('text', { x: kx + 16, y: m.y, class: 'w3-lab' }, m.label));
    });
    nums.forEach((v, i) => {
      const c = svg('circle', { cx: X(v), cy: axisY - 4 - rad - lv[i] * (2 * rad + 1), r: rad, class: 'w3-dot' + (o.cls ? ' ' + (o.cls(i) || '') : '') });
      if (o.title) c.appendChild(svg('title', {}, o.title(i)));
      if (o.onPick) { c.addEventListener('pointerenter', () => o.onPick(i)); c.addEventListener('click', () => o.onPick(i)); }
      s.appendChild(c);
    });
    Lab.clear(host);
    host.appendChild(s);
    return { inv: px => lo + ((px - pl) / (W - pl - pr)) * (hi - lo), W };
  }

  /** Horizontal box plot. b = S.boxStats(...). Whiskers reach the most extreme values inside the fences. */
  function boxPlot(host, xs, b) {
    const W = S.chartWidth(host);
    const nums = xs.map(x => x.num());
    const [lo, hi] = S.domain(nums.concat([b.lo.num(), b.hi.num()]), 0.05);
    const pl = 16, pr = 16;
    const X = v => pl + ((Number(v) - lo) / (hi - lo)) * (W - pl - pr);
    const above = [
      { x: X(b.q2), label: 'median Q₂ = ' + S.ht(b.q2) },
      { x: X(b.lo), label: 'lower fence ' + S.ht(b.lo) },
      { x: X(b.hi), label: 'upper fence ' + S.ht(b.hi) },
    ];
    const below = [
      { x: X(b.q1), label: 'Q₁ = ' + S.ht(b.q1) },
      { x: X(b.q3), label: 'Q₃ = ' + S.ht(b.q3) },
      { x: X(b.wLo), label: (b.wLo.eq(xs[0]) ? 'min ' : 'whisker ') + S.ht(b.wLo) },
      { x: X(b.wHi), label: (b.wHi.eq(xs[xs.length - 1]) ? 'max ' : 'whisker ') + S.ht(b.wHi) },
    ];
    const outVals = [];
    b.outs.forEach(v => { if (!outVals.some(u => u.eq(v))) outVals.push(v); });
    if (outVals.length <= 4) outVals.forEach(v => below.push({ x: X(v), label: 'outlier ' + S.ht(v) }));
    [...above, ...below].forEach(it => { it.w = S.textW(it.label); });
    const rowH = 17;
    const nA = S.placeRows(above, W), nB = S.placeRows(below, W);
    const boxTop = 8 + nA * rowH + 8, boxH = 38, boxBot = boxTop + boxH, mid = boxTop + boxH / 2;
    const belowTop = boxBot + 10;
    const axisY = belowTop + nB * rowH + 10;
    const H = axisY + 26;
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w3-svg', role: 'img', 'aria-label': 'box plot' });
    const { ticks, step } = S.niceTicks(lo, hi, Math.max(3, Math.floor(W / 95)));
    ticks.forEach(t => {
      const x = X(t);
      s.appendChild(svg('line', { x1: x, x2: x, y1: boxTop - 4, y2: axisY, class: 'w3-grid' }));
      s.appendChild(svg('text', { x, y: axisY + 19, 'text-anchor': 'middle', class: 'w3-tick' }, S.tickFmt(t, step)));
    });
    s.appendChild(svg('line', { x1: pl - 6, x2: W - pr + 6, y1: axisY, y2: axisY, class: 'w3-axis' }));
    [b.lo, b.hi].forEach(f => s.appendChild(svg('line', { x1: X(f), x2: X(f), y1: boxTop - 8, y2: boxBot + 8, class: 'w3-fence' })));
    s.appendChild(svg('line', { x1: X(b.wLo), x2: X(b.q1), y1: mid, y2: mid, class: 'w3-whisk' }));
    s.appendChild(svg('line', { x1: X(b.q3), x2: X(b.wHi), y1: mid, y2: mid, class: 'w3-whisk' }));
    [b.wLo, b.wHi].forEach(v => s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: mid - 10, y2: mid + 10, class: 'w3-whisk' })));
    const bx = svg('rect', { x: X(b.q1), y: boxTop, width: Math.max(1.5, X(b.q3) - X(b.q1)), height: boxH, rx: 4, class: 'w3-box' });
    bx.appendChild(svg('title', {}, 'Box from Q1 = ' + S.ht(b.q1) + ' to Q3 = ' + S.ht(b.q3) + ' (IQR = ' + S.ht(b.iqr) + ')'));
    s.appendChild(bx);
    s.appendChild(svg('line', { x1: X(b.q2), x2: X(b.q2), y1: boxTop, y2: boxBot, class: 'w3-medline' }));
    outVals.forEach(v => {
      const k = b.outs.filter(u => u.eq(v)).length;
      for (let j = 0; j < k; j++) {
        const c = svg('circle', { cx: X(v), cy: mid + (j - (k - 1) / 2) * 11, r: 5, class: 'w3-outdot' });
        c.appendChild(svg('title', {}, 'outlier ' + S.ht(v)));
        s.appendChild(c);
      }
    });
    above.forEach(it => {
      const y = 8 + (nA - 1 - it.row) * rowH + 12;
      s.appendChild(svg('line', { x1: it.x, x2: it.x, y1: y + 4, y2: boxTop - 8, class: 'w3-lead' }));
      s.appendChild(svg('text', { x: it.cx, y, 'text-anchor': 'middle', class: 'w3-lab' }, it.label));
    });
    below.forEach(it => {
      const y = belowTop + it.row * rowH + 12;
      s.appendChild(svg('line', { x1: it.x, x2: it.x, y1: boxBot + (it.label.indexOf('outlier') === 0 ? 6 : 2), y2: y - 11, class: 'w3-lead' }));
      s.appendChild(svg('text', { x: it.cx, y, 'text-anchor': 'middle', class: 'w3-lab' }, it.label));
    });
    Lab.clear(host);
    host.appendChild(s);
  }

  /** Mean and median as one value v moves: two lines over the slider range. cfg: {lo, hi, rest (sorted numbers), n, sumRest, v, v0} */
  function sweepChart(host, cfg) {
    const W = S.chartWidth(host), H = 230;
    const pl = 52, pr = 70, pt = 14, pb = 36;
    const { lo, hi, rest, n } = cfg;
    const medAt = v => {
      let r = 0;
      while (r < rest.length && rest[r] < v) r++;
      const at = p => (p <= r ? rest[p - 1] : p === r + 1 ? v : rest[p - 2]);
      return n % 2 ? at((n + 1) / 2) : (at(n / 2) + at(n / 2 + 1)) / 2;
    };
    const meanAt = v => (cfg.sumRest + v) / n;
    const M = 160;
    const pts = [];
    for (let j = 0; j <= M; j++) { const v = lo + ((hi - lo) * j) / M; pts.push({ v, mean: meanAt(v), med: medAt(v) }); }
    [cfg.v, cfg.v0].forEach(v => pts.push({ v, mean: meanAt(v), med: medAt(v) }));
    pts.sort((a, b) => a.v - b.v);
    const ys = pts.flatMap(p => [p.mean, p.med]);
    const [ylo, yhi] = S.domain(ys, 0.08);
    const X = v => pl + ((v - lo) / (hi - lo)) * (W - pl - pr);
    const Y = v => pt + (1 - (v - ylo) / (yhi - ylo)) * (H - pt - pb);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 'w3-svg w3-sweep', role: 'img', 'aria-label': 'mean and median against the moved value' });
    const yt = S.niceTicks(ylo, yhi, 4), xt = S.niceTicks(lo, hi, Math.max(3, Math.floor((W - pl - pr) / 90)));
    yt.ticks.forEach(t => { s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: Y(t), y2: Y(t), class: 'w3-grid' })); s.appendChild(svg('text', { x: pl - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'w3-tick' }, S.tickFmt(t, yt.step))); });
    xt.ticks.forEach(t => { s.appendChild(svg('line', { x1: X(t), x2: X(t), y1: H - pb, y2: H - pb + 5, class: 'w3-tk' })); s.appendChild(svg('text', { x: X(t), y: H - pb + 18, 'text-anchor': 'middle', class: 'w3-tick' }, S.tickFmt(t, xt.step))); });
    s.appendChild(svg('line', { x1: pl, x2: W - pr, y1: H - pb, y2: H - pb, class: 'w3-axis' }));
    s.appendChild(svg('text', { x: (pl + W - pr) / 2, y: H - 4, 'text-anchor': 'middle', class: 'w3-tick' }, 'v = the new value of the moved data point'));
    const path = key => pts.map((p, j) => (j ? 'L' : 'M') + X(p.v).toFixed(1) + ',' + Y(p[key]).toFixed(1)).join(' ');
    s.appendChild(svg('path', { d: path('mean'), class: 'w3-line mean' }));
    s.appendChild(svg('path', { d: path('med'), class: 'w3-line med' }));
    const end = pts[pts.length - 1];
    const ly = [{ y: Y(end.mean), t: 'mean', k: 'mean' }, { y: Y(end.med), t: 'median', k: 'med' }].sort((a, b) => a.y - b.y);
    if (ly[1].y - ly[0].y < 15) { const c = (ly[0].y + ly[1].y) / 2; ly[0].y = c - 8; ly[1].y = c + 8; }
    ly.forEach(l => s.appendChild(svg('text', { x: W - pr + 8, y: l.y + 4, class: 'w3-lab' }, l.t)));
    s.appendChild(svg('path', { d: 'M' + X(cfg.v0) + ',' + (H - pb) + ' l-5,9 h10 z', class: 'w3-orig' }));
    s.appendChild(svg('line', { x1: X(cfg.v), x2: X(cfg.v), y1: pt, y2: H - pb, class: 'w3-now' }));
    s.appendChild(svg('circle', { cx: X(cfg.v), cy: Y(meanAt(cfg.v)), r: 5, class: 'w3-nowdot mean' }));
    s.appendChild(svg('circle', { cx: X(cfg.v), cy: Y(medAt(cfg.v)), r: 5, class: 'w3-nowdot med' }));
    Lab.clear(host);
    host.appendChild(s);
    return { inv: px => lo + ((px - pl) / (W - pl - pr)) * (hi - lo), W };
  }

  /** Pointer dragging on a chart host: calls onValue(value) with the value under the pointer. */
  function draggable(host, getInv, onValue) {
    let on = false;
    const at = e => {
      const r = host.getBoundingClientRect();
      const m = getInv();
      if (!m || !r.width) return;
      onValue(m.inv(((e.clientX - r.left) / r.width) * m.W));
    };
    host.addEventListener('pointerdown', e => { on = true; try { host.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ } at(e); });
    host.addEventListener('pointermove', e => { if (on) at(e); });
    const stop = () => { on = false; };
    host.addEventListener('pointerup', stop);
    host.addEventListener('pointercancel', stop);
  }

  /** Small legend row: [{kind, text}] with a line key (or a dot) in the series colour beside ink text. */
  function legend(items) {
    const box = h('div', { class: 'w3-legend' });
    items.forEach(it => box.appendChild(h('span', {}, h('i', { class: 'w3-key ' + it.kind }), h('span', { html: it.text }))));
    return box;
  }

  /** Sorted values as chips with their positions. cls(i) → extra class for position i (1-based). */
  function chips(xs, cls, from, to) {
    from = from || 1; to = to || xs.length;
    const box = h('div', { class: 'w3-chips' });
    if (from > 1) box.appendChild(h('span', { class: 'w3-more', text: '…' }));
    for (let i = from; i <= to; i++) box.appendChild(h('span', { class: 'w3-chip ' + ((cls && cls(i)) || '') }, h('i', { text: String(i) }), h('b', { text: S.ht(xs[i - 1]) })));
    if (to < xs.length) box.appendChild(h('span', { class: 'w3-more', text: '…' }));
    return box;
  }
  /** Chips around some positions (two either side), the positions themselves highlighted. */
  function chipWindow(xs, pos, cls = 'pos') {
    const a = Math.max(1, Math.min(...pos) - 2), b = Math.min(xs.length, Math.max(...pos) + 2);
    return chips(xs, i => (pos.includes(i) ? cls : ''), a, b);
  }
  /** "= 65.2" or "≈ 65.2667" for SVG labels (plain text). */
  const eqTxt = q => { const t = S.ht(q); return t.charAt(0) === '≈' ? t : '= ' + t; };
  const mathLines = S.mathLines;

  /* ======================================================================
     The lab
     ====================================================================== */
  /* Lecture and tutorial examples: every number below was read from the lecture slides / sheets
     (frames checked) and re-checked with exact fractions. Times are minute marks in the YouTube videos. */
  const LEC = {
    L1: 'Lecture W3_L1 (Frequency tables for numerical data)', L2: 'Lecture W3_L2 (Mean)', L3: 'Lecture W3_L3 (Median and mode)',
    L4: 'Lecture W3_L4 (Measures of dispersion)', L5: 'Lecture W3_L5 (Percentiles, quartiles and interquartile range)',
  };
  const MARKS10 = '68, 79, 38, 68, 35, 70, 61, 47, 58, 66';
  const LECTURE_PRESETS = [
    { label: 'Marks of 10 students: mean, then +5 and ×0.4', data: MARKS10, c: '5', k: '0.4', source: LEC.L2 + ', at 07:30: x̄ = 590/10 = 59. At 15:30 the teacher adds 5 marks to everyone: ȳ = 640/10 = 64 = 59 + 5. At 20:30 every mark is multiplied by 0.4: ȳ = 236/10 = 23.6 = 0.4 × 59. The shift-and-scale panel below is set to c = 5 and k = 0.4.' },
    { label: 'Marks of 10 students: median and mode', data: MARKS10, c: '5', k: '0.4', source: LEC.L3 + ', at 08:00: sorted, n = 10 is even, median = (61 + 66)/2 = 63.5; adding 5 gives 68.5 (09:00); ×0.4 gives (24.4 + 26.4)/2 = 25.4 (12:30). At 18:00: mode 68 (twice), then 73 and 27.2.' },
    { label: 'Marks of 10 students: variance and SD', data: MARKS10, c: '5', k: '0.4', source: LEC.L4 + ', at 12:30: Σ(x − x̄)² = 1898, population variance 1898/10 = 189.8, sample variance 1898/9: the professor writes 210.88 (her sheet shows 210.8888889; here ≈ 210.8889), s = 14.522 (≈ 14.5220). Adding 5 keeps 210.88 (19:30). At 23:00, ×0.4: Σ = 303.68, variance 303.68/9 written 33.74 (≈ 33.7422), SD written 5.808 (≈ 5.8088: she drops the last digit).' },
    { label: 'Marks of 10 students: percentiles, lecture method', data: MARKS10, pp: 10, qm: 'lec', source: LEC.L5 + ', at 06:00: sorted 35, 38, 47, 58, 61, 66, 68, 68, 70, 79. p = 0.1: np = 1 (whole), (35 + 38)/2 = 36.5. p = 0.25: np = 2.5 → 3rd value 47. p = 0.5: 63.5. p = 0.75: np = 7.5 → 8th value 68. p = 1: 79.' },
    { label: 'Marks of 10 students: Google Sheets percentiles and IQR', data: MARKS10, pp: 25, qm: 'sheets', source: LEC.L5 + ', at 11:00: rank = p(n − 1) + 1. 10th: rank 1.9 → 35 + 0.9 × 3 = 37.7. 25th: rank 3.25 → 47 + 0.25 × 11 = 49.75. 30th: 54.7. 90th: 70.9. At 20:30, QUARTILE gives Q1 = 49.75, Q3 = 68, IQR = 18.25.' },
    { label: 'Data set 1: 2, 12, 5, 7, 6, 7, 3', data: '2, 12, 5, 7, 6, 7, 3', source: LEC.L2 + ', at 05:30: x̄ = 42/7 = 6. ' + LEC.L3 + ': median = 4th of 7 sorted values = 6 (03:00); 7 occurs twice, so the mode is 7 (15:00).' },
    { label: 'Data set 2: the 12 becomes 105', data: '2, 105, 5, 7, 6, 7, 3', source: LEC.L2 + ', at 06:00: x̄ = 135/7, written 19.285 (she cuts it after 3 decimals; ≈ 19.2857). ' + LEC.L3 + ': the median stays 6 (04:30) and the mode stays 7: the mean is sensitive to the outlier, the median is not.' },
    { label: 'Data set 3: six values', data: '2, 105, 5, 7, 6, 3', source: LEC.L2 + ', at 06:30: x̄ = 128/6, written 21.33 (≈ 21.3333). ' + LEC.L3 + ', at 05:30: n = 6 is even, median = (5 + 6)/2 = 5.5, which is not one of the values; at 15:30: all six values are different, so there is no mode.' },
    { label: 'Data set 3, 3, 3, 3, 3 (no spread)', data: '3, 3, 3, 3, 3', source: LEC.L4 + ', at 00:30: mean 3, median 3, mode 3 and range 3 − 3 = 0. Compare with 1, 2, 3, 4, 5, which has the same mean and median.' },
    { label: 'Data set 1, 2, 3, 4, 5', data: '1, 2, 3, 4, 5', source: LEC.L4 + ', at 01:00: mean 15/5 = 3, median 3, no mode, range 5 − 1 = 4 (04:30). At 08:00 the deviations from 3 are −2, −1, 0, 1, 2 and add up to 0.' },
    { label: 'Data set 1, 2, 3, 4, 15 (range and an outlier)', data: '1, 2, 3, 4, 15', source: LEC.L4 + ', at 05:00: range 15 − 1 = 14 against 4 for 1, 2, 3, 4, 5 — only one value changed, so the range is sensitive to outliers.' },
    { label: 'Household sizes of 15 people', data: '2, 1, 3, 4, 5, 2, 3, 3, 3, 4, 4, 1, 2, 3, 4', source: LEC.L1 + ', at 07:00 (frequency table); ' + LEC.L2 + ', at 09:30: Σf·x = 2 + 6 + 15 + 16 + 5 = 44, x̄ = 44/15, written 2.93 (≈ 2.9333); at 12:00 the sheet’s AVERAGE gives the same.' },
    { label: 'Rajan’s class: 80th percentile of 12 marks', data: '46, 85, 68, 93, 84, 70, 38, 66, 78, 75, 55, 60', pp: 80, qm: 'lec', source: 'W3_Tutorial 6, at 00:30: np = 12 × 0.8 = 9.6, not whole, so take the 10th sorted value: 84. (The Sheets method would give 82.8.)' },
    { label: 'Tomato prices per kg (box plot)', data: '12, 16, 22, 8, 36, 34, 40, 32, 28', qm: 'lec', source: 'Week 3 - Box plot Tutorial, at 00:00: sorted 8, 12, 16, 22, 28, 32, 34, 36, 40 (n = 9). At 06:30: 25% of 9 = 2.25 → 3rd value 16, 6.75 → 7th value 34, median 28: the box runs from 16 to 34, the whiskers to 8 and 40.' },
    { label: 'Salaries of 16 staff (₹ thousand): outlier 55', data: '16, 19, 26, 26, 27, 28, 29, 29, 30, 34, 35, 36, 37, 39, 42, 55', qm: 'lec', source: 'Outliers tutorial, at 00:30: Q1 = (26 + 27)/2 = 26.5, Q3 = (36 + 37)/2 = 36.5, IQR = 10 (03:00), fences 11.5 and 51.5 (04:00), so 55 is the only outlier. Mean 508/16 = 31.75 (05:30), median (29 + 30)/2 = 29.5 (07:00), modes 26 and 29 (08:00).' },
    { label: 'Salaries of 15 staff: the outlier removed', data: '16, 19, 26, 26, 27, 28, 29, 29, 30, 34, 35, 36, 37, 39, 42', qm: 'lec', source: 'Outliers tutorial, at 06:00: without 55 the mean is 453/15 = 30.2 (it decreases), the median is the 8th value 29 (07:30), and the modes are still 26 and 29.' },
    { label: 'Class attendance over 17 days', data: '11, 12, 14, 20, 25, 26, 27, 31, 32, 33, 37, 38, 40, 41, 43, 45, 52', source: 'W3_Tutorial 3, at 00:00 (stem-and-leaf, key 1 | 4 = 14): total 527 over 17 days, mean 527/17 = 31 (03:30).' },
    { label: '30 rolls of a die (typed out from its table)', data: '1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5, 6, 6, 6, 6, 6', source: 'W3_Tutorial 5, at 00:00 (table 1:4, 2:6, 3:7, 4:5, 5:3, 6:5): x̄ = 102/30 = 3.4, Σ(x − x̄)² = 79.2, s² = 79.2/29 written 2.731 (≈ 2.7310), s written 1.6525 (≈ 1.6526: the tutor rounded 2.731 first and then cut a digit), mode 3.' },
  ];
  const SRC = 'Made for this lab in the style of the Week 3 questions (not from a lecture)';
  const OWN_PRESETS = [
    { label: 'Test marks: the quartile methods disagree on 90', data: '45, 62, 58, 71, 62, 80, 55, 62, 90, 67', source: SRC + '. Watch the value 90: the two quartile methods disagree about whether it is an outlier.' },
    { label: 'Heights of 9 people (cm)', data: '152, 160.5, 158, 171, 165, 149, 162, 168, 155', source: SRC + '. Odd n, one decimal value, and no value repeats (no mode).' },
    { label: 'Quiz times with one outlier (minutes)', data: '12, 15, 14, 13, 16, 15, 14, 58', source: SRC + '. One student took 58 minutes: compare the mean with the median.' },
    { label: 'Shoe sizes: three modes', data: '6, 7, 7, 8, 8, 9, 9, 10', source: SRC + '. Three values tie for the most repeats (multimodal).' },
    { label: 'Minimum temperatures (°C), with negatives', data: '-3, 2, 0, -1, 4, 2, -5, 1', source: SRC + '. Negative values; the mean is exactly 0.' },
    { label: 'Six numbers to check by hand', data: '2, 4, 4, 5, 7, 9', source: SRC + '. Small enough to redo every step on paper.' },
  ];
  const QM = [{ label: 'Lecture (np) method', value: 'lec' }, { label: 'Sheets (rank) method', value: 'sheets' }];
  const QM_NAME = { lec: 'lecture (np) method', sheets: 'Sheets (rank) method' };
  const KEY = 'lab:s1-describe';
  const DEF = { data: MARKS10, pp: 25, qm: 'lec', c: '5', k: '0.4', oi: -1, ov: '', ovFor: '' };
  const MAXN = 1000;

  function describeLab(host) {
    if (host.w3Off) host.w3Off();
    const st = Object.assign({}, DEF, Lab.store.get(KEY, {}));
    const save = () => Lab.store.set(KEY, st);
    let D = null;
    const ctl = {}, P = {};
    const { side, main } = K.layout(host, 's1w3');
    host.classList.add('w3-describe');
    const onResize = Lab.debounce(() => {
      if (!host.isConnected) { window.removeEventListener('resize', onResize); return; }
      if (D) { drawData(); drawQuart(); drawOut(); }
    }, 200);
    window.addEventListener('resize', onResize);
    host.w3Off = () => window.removeEventListener('resize', onResize);

    /* ---------------- controls column */
    side.appendChild(K.group('1 · Your data'));
    ctl.data = K.listField({
      label: 'Type your numbers, with commas or spaces between them',
      value: st.data, rows: 4,
      hint: nums => Lab.tex('n=' + nums.length) + ' value' + (nums.length === 1 ? '' : 's') + '. Decimals (160.5), negatives (−3) and fractions (7/2) are fine.',
      onChange: () => { st.data = ctl.data.input.value; onData(); },
    });
    side.appendChild(ctl.data);
    side.appendChild(S.presetMenu({
      label: 'Examples: the professor’s first',
      groups: [{ label: 'From the Week 3 lectures and tutorials', items: LECTURE_PRESETS }, { label: 'Made for this lab', items: OWN_PRESETS }],
      onPick: it => {
        if (it.pp) { st.pp = it.pp; ctl.pp.set(it.pp); }
        if (it.qm) { st.qm = it.qm; ctl.qm.set(it.qm); ctl.qm2.set(it.qm); }
        if (it.c) { st.c = it.c; ctl.c.set(it.c); }
        if (it.k) { st.k = it.k; ctl.k.set(it.k); }
        save();
        ctl.data.set(it.data);
      },
    }));
    side.appendChild(K.group('2 · Quartile method'));
    ctl.qm = Lab.seg(QM, st.qm, v => setQm(v));
    side.appendChild(h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'IQR, fences, outliers and the box plot use' }), ctl.qm));
    side.appendChild(K.note('Both course methods are worked out side by side in the percentile and quartile panels; this switch picks the one the box plot uses.'));
    side.appendChild(K.group('3 · Go to'));
    const nav = h('div', { class: 'pl-chips w3-nav' });
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
      Lab.store.set(KEY, {});
      describeLab(host);
    }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = K.answer();
    P.data = K.panel('Your data, sorted');
    P.centre = K.panel('Centre: mean, median and mode', 'How each one is computed, with your numbers.');
    P.spread = K.panel('Spread: range, variance and standard deviation', 'Population variance ' + Lab.tex('\\sigma^2') + ' divides by ' + Lab.tex('n') + '; sample variance ' + Lab.tex('s^2') + ' divides by ' + Lab.tex('n-1') + ' (course notes, Week 3).');
    P.pct = K.panel('Percentiles: both course methods', 'The lecture (np) method and the Google Sheets (interpolation) method, step by step. They need not agree — use the one the question asks for.');
    P.quart = K.panel('Quartiles, IQR, fences and the box plot', Lab.tex('Q_1') + ' = 25th, ' + Lab.tex('Q_2') + ' = 50th (the median), ' + Lab.tex('Q_3') + ' = 75th percentile. Points outside the fences ' + Lab.tex('Q_1-1.5\\,\\mathrm{IQR}') + ' and ' + Lab.tex('Q_3+1.5\\,\\mathrm{IQR}') + ' are outliers.');
    P.shift = K.panel('Shift and scale: ' + Lab.tex('y_i=x_i+c') + ' and ' + Lab.tex('y_i=k\\,x_i'), 'Every measure below is computed again from the new values, then compared with the rule from the notes.');
    P.out = K.panel('Outlier effect: move one value', 'Pick one value and move it (type, slide, or drag in the charts). The mean follows it; the median hardly moves.');
    main.append(P.answer, P.data, P.centre, P.spread, P.pct, P.quart, P.shift, P.out);
    [['Sorted data', P.data], ['Mean, median, mode', P.centre], ['Variance, SD', P.spread], ['Percentiles', P.pct], ['Quartiles, box plot', P.quart], ['Shift and scale', P.shift], ['Outlier effect', P.out]]
      .forEach(([t, p]) => nav.appendChild(Lab.button(t, () => p.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn xs')));

    /* percentile panel controls */
    ctl.pp = K.numField({ label: 'Which percentile? Type ' + Lab.tex('100p') + ' (1 to 99)', min: 1, max: 99, step: 1, value: st.pp, onChange: v => { st.pp = v; save(); drawPct(); expose(); } });
    const ppChips = h('div', { class: 'pl-chips' }, [10, 25, 50, 75, 90].map(v => Lab.button(S.ordinal(v), () => { st.pp = v; ctl.pp.set(v); save(); drawPct(); expose(); }, 'btn xs')));
    P.pctOut = h('div', { class: 'w3-out' });
    P.pct.body.append(h('div', { class: 'w3-ctl' }, ctl.pp, ppChips), P.pctOut);
    /* quartile panel controls */
    ctl.qm2 = Lab.seg(QM, st.qm, v => setQm(v));
    P.quartOut = h('div', { class: 'w3-out' });
    P.quart.body.append(h('div', { class: 'w3-ctl' }, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Box plot, IQR and fences by the' }), ctl.qm2)), P.quartOut);
    /* shift and scale controls */
    ctl.c = S.freeField({ label: 'Shift: add ' + Lab.tex('c') + ' to every value', min: -100, max: 100, step: 0.5, value: st.c, onChange: (r, s) => { st.c = s; save(); drawShift(); }, hint: 'Type any number, or slide.' });
    ctl.k = S.freeField({ label: 'Scale: multiply every value by ' + Lab.tex('k'), min: -10, max: 10, step: 0.1, value: st.k, onChange: (r, s) => { st.k = s; save(); drawShift(); }, hint: 'Negative and fractional ' + Lab.tex('k') + ' are allowed.' });
    P.shiftOut = h('div', { class: 'w3-out' });
    P.shift.body.append(h('div', { class: 'w3-ctl w3-ctl2' }, ctl.c, ctl.k), P.shiftOut);
    /* outlier controls */
    ctl.oi = K.selectField({ label: 'Value to move', options: [], value: '', onChange: v => { st.oi = +v; st.ov = ''; save(); syncOut(); drawOut(); } });
    ctl.ov = S.freeField({ label: 'Move it to ' + Lab.tex('v'), min: 0, max: 1, step: 1, value: '0', onChange: (r, s) => { st.ov = s; save(); drawOut(); } });
    const outBtns = h('div', { class: 'pl-chips' },
      Lab.button('Far to the right', () => setV(outRange().hi), 'btn xs'),
      Lab.button('Far to the left', () => setV(outRange().lo), 'btn xs'),
      Lab.button('Back to where it was', () => setV(D.xs[curOi()]), 'btn xs'));
    P.outOut = h('div', { class: 'w3-out' });
    P.sweep = h('div', { class: 'w3-chart w3-drag' });
    P.strip = h('div', { class: 'w3-chart w3-drag' });
    P.outApply = h('div', { class: 'btn-row' });
    P.out.body.append(h('div', { class: 'w3-ctl w3-ctl2' }, ctl.oi, h('div', {}, ctl.ov, outBtns)), P.outOut,
      legend([{ kind: 'mean', text: 'mean ' + Lab.tex('\\bar x') }, { kind: 'med', text: 'median' }, { kind: 'now', text: 'your ' + Lab.tex('v') }, { kind: 'orig', text: 'where the value was' }]),
      P.sweep, h('div', { class: 'pl-hint', text: 'Drag across either chart to move the value.' }), P.strip, P.outApply);
    let sweepMap = null, stripMap = null;
    draggable(P.sweep, () => sweepMap, v => setV(v));
    draggable(P.strip, () => stripMap, v => setV(v));

    function setQm(v) { st.qm = v; ctl.qm.set(v); ctl.qm2.set(v); save(); drawAnswer(); drawQuart(); drawShift(); }

    /* ---------------- data → everything */
    function onData() {
      const { vals, bad } = S.parseList(st.data);
      if (bad.length || !vals.length) return;
      if (vals.length > MAXN) { K.setAnswer(P.answer, { ev: '<span class="cbad">You typed ' + vals.length + ' numbers. This lab works with up to ' + MAXN + ' values — the pictures below still show your last valid list.</span>' }); return; }
      D = S.describe(vals);
      if (st.ovFor !== st.data) { st.oi = -1; st.ov = ''; st.ovFor = st.data; }
      if (!S.readNum(st.c)) st.c = DEF.c;
      if (!S.readNum(st.k)) st.k = DEF.k;
      save();
      const mx = Math.max(Math.abs(D.min.num()), Math.abs(D.max.num()), 1), ms = S.niceStep(mx);
      const bound = Math.max(10, Math.ceil(mx / ms) * ms);
      ctl.c.setRange(-bound, bound, S.niceStep(bound / 200));
      syncOut();
      drawAll();
    }
    function drawAll() { drawAnswer(); drawData(); drawCentre(); drawSpread(); drawPct(); drawQuart(); drawShift(); drawOut(); expose(); }
    /** Exact results as fractions in a data attribute (read by the test scripts; nothing on screen). */
    function expose() {
      const d = D, p = S.frac(st.pp, 100), s = q => (q ? q.toString() : null);
      const bx = m => { const b = S.boxStats(d.xs, m); return { q1: s(b.q1), q2: s(b.q2), q3: s(b.q3), iqr: s(b.iqr), lo: s(b.lo), hi: s(b.hi), outs: b.outs.map(s), wLo: s(b.wLo), wHi: s(b.wHi) }; };
      host.dataset.w3 = JSON.stringify({
        n: d.n, sum: s(d.sum), sumsq: s(d.sumsq), mean: s(d.mean), median: s(d.med.value), modes: d.mo.modes.map(s), range: s(d.range),
        ss: s(d.ss), pvar: s(d.pvar), svar: s(d.svar), sd: S.sqrtHt(d.pvar), ssd: d.svar ? S.sqrtHt(d.svar) : null,
        pp: st.pp, pLec: s(S.pctLecture(d.xs, p).value), pGs: s(S.pctSheets(d.xs, p).value), lec: bx('lec'), sheets: bx('sheets'),
        c: st.c, k: st.k, ov: st.ov, oi: curOi(),
      });
    }

    /* ---------------- answer box */
    function drawAnswer() {
      const d = D, n = d.n, md = d.med, mo = d.mo;
      const modeTxt = !mo.modes.length ? 'no mode (no value repeats)'
        : mo.modes.length === 1 ? 'mode ' + Lab.tex(S.vt(mo.modes[0])) + ' (it appears ' + mo.top + ' times)'
          : (mo.modes.length === 2 ? 'bimodal: ' : 'multimodal: ') + 'modes ' + mo.modes.map(m => Lab.tex(S.vt(m))).join(', ') + ' (each appears ' + mo.top + ' times)';
      K.setAnswer(P.answer, {
        ev: 'Your data: ' + Lab.tex('n=' + n) + ' value' + (n === 1 ? '' : 's') + ', from ' + Lab.tex('x_{[1]}=' + S.vt(d.min)) + ' (smallest) to ' + Lab.tex('x_{[' + n + ']}=' + S.vt(d.max)) + ' (largest).',
        sub:'Mean = total ÷ ' + Lab.tex('n') + ' = ' + Lab.tex(S.vt(d.sum) + '\\div ' + n) + '. Median = ' + (md.odd ? 'the value at position ' + Lab.tex('\\tfrac{n+1}{2}=' + md.pos[0]) : 'the average of positions ' + Lab.tex('\\tfrac n2=' + md.pos[0]) + ' and ' + Lab.tex(String(md.pos[1]))) + ' of the sorted list. ' +
          modeTxt.charAt(0).toUpperCase() + modeTxt.slice(1) + '. Range ' + Lab.tex(S.vt(d.max) + '-' + S.par(S.vt(d.min)) + '=' + S.vt(d.range)) +
          (d.svar ? '; sample SD ' + Lab.tex('s' + S.sqrtEq(d.svar)) : '') + '; population SD ' + Lab.tex('\\sigma' + S.sqrtEq(d.pvar)) + '.',
      });
      P.answer.insertBefore(S.bigLine(['\\bar x' + S.eqt(d.mean), '\\text{median}' + S.eqt(md.value)]), P.answer.lastChild);
    }

    /* ---------------- sorted data + dot plot */
    function drawData() {
      const d = D, n = d.n, body = P.data.body;
      Lab.clear(body);
      P.data.sub('You typed ' + Lab.tex('n=' + n) + ' value' + (n === 1 ? '' : 's') + '. Sorted from smallest to largest they are ' + Lab.tex('x_{[1]}\\le x_{[2]}\\le\\cdots\\le x_{[' + n + ']}') + '; the small number on each chip is the position ' + Lab.tex('i') + ' of ' + Lab.tex('x_{[i]}') + '.');
      const medPos = d.med.pos;
      body.appendChild(chips(d.xs, i => (medPos.includes(i) ? 'med' : '')));
      body.appendChild(K.note('Teal ring = the middle position' + (medPos.length > 1 ? 's ' + medPos[0] + ' and ' + medPos[1] : ' ' + medPos[0]) + ', used for the median.'));
      body.appendChild(legend([{ kind: 'dot', text: 'one value (equal or close values stack up)' }, { kind: 'mean', text: 'mean ' + Lab.tex('\\bar x' + S.eqt(d.mean)) }, { kind: 'med', text: 'median ' + Lab.tex(S.full(d.med.value)) }]));
      const chart = h('div', { class: 'w3-chart' });
      const read = h('div', { class: 'w3-read pl-hint', text: 'Point at a dot to read its value and position.' });
      body.append(chart, read);
      dotPlot(chart, d.xs, {
        marks: [{ v: d.mean, kind: 'mean', label: 'mean ' + eqTxt(d.mean) }, { v: d.med.value, kind: 'med', label: 'median ' + eqTxt(d.med.value) }],
        title: i => 'x[' + (i + 1) + '] = ' + S.ht(d.xs[i]),
        onPick: i => Lab.setHTML(read, Lab.tex('x_{[' + (i + 1) + ']}=' + S.vt(d.xs[i])) + ': position ' + (i + 1) + ' of ' + n + ' in the sorted list' + (d.xs[i].eq(d.mean) ? ' (equal to the mean)' : ', ' + (d.xs[i].cmp(d.mean) > 0 ? 'above' : 'below') + ' the mean by ' + Lab.tex(S.full(d.xs[i].sub(d.mean).abs()))) + '.'),
      });
    }

    /* ---------------- centre */
    function drawCentre() {
      const d = D, n = d.n, body = P.centre.body, md = d.med, mo = d.mo;
      Lab.clear(body);
      const steps = [];
      steps.push({
        html: '<b>Mean.</b> Add all ' + Lab.tex('n=' + n) + ' values (in the order you typed them):<div class="w3-long">' + Lab.tex('\\sum x_i=' + S.sumTex(d.vals) + '=' + S.vt(d.sum)) + '</div>' + (n > 40 ? '<div class="small muted">(All ' + n + ' values are added; only the first and last few are written out.)</div>' : '') + 'then divide the total by ' + Lab.tex('n') + ':',
        math: '\\bar x=\\frac{\\sum x_i}{n}=' + S.overTex(d.sum, n, d.mean),
      });
      if (md.odd) {
        steps.push({ html: '<b>Median.</b> Use the sorted list. ' + Lab.tex('n=' + n) + ' is odd, so there is one middle value, at position ' + Lab.tex('\\frac{n+1}{2}=\\frac{' + n + '+1}{2}=' + md.pos[0]) + ':', math: '\\text{median}=x_{[' + md.pos[0] + ']}' + S.eqt(md.value), block: chipWindow(d.xs, md.pos, 'med') });
      } else {
        const [k, k1] = md.pos, a = d.xs[k - 1], b = d.xs[k1 - 1];
        steps.push({ html: '<b>Median.</b> Use the sorted list. ' + Lab.tex('n=' + n) + ' is even, so there are two middle values, at positions ' + Lab.tex('\\frac n2=\\frac{' + n + '}{2}=' + k) + ' and ' + Lab.tex('\\frac n2+1=' + k1) + '. The median is their average:', math: '\\text{median}=\\frac{x_{[' + k + ']}+x_{[' + k1 + ']}}{2}=\\frac{' + S.vt(a) + '+' + S.par(S.vt(b)) + '}{2}=\\frac{' + S.vt(a.add(b)) + '}{2}' + S.eqt(md.value), block: chipWindow(d.xs, md.pos, 'med') });
      }
      const many = mo.groups.length > 16;
      const shown = many ? mo.groups.filter(g => g.f > 1) : mo.groups;
      const countTbl = shown.length ? S.table([Lab.tex('x'), 'times it appears'], shown.map(g => ({ cells: [S.ht(g.v), String(g.f)], cls: g.f === mo.top && mo.top > 1 ? 'hl-row' : null }))) : null;
      const list = mo.modes.map(m => Lab.tex(S.vt(m))).join(', ');
      const verdict = !mo.modes.length
        ? 'Every one of the ' + n + ' values appears exactly once. <b>No value repeats, so there is no mode</b> (course rule).'
        : mo.modes.length === 1
          ? 'The value ' + list + ' appears ' + mo.top + ' times, more often than any other value: <b>mode = ' + list + '</b>.'
          : mo.modes.length + ' values tie for the most repeats (' + mo.top + ' times each): ' + list + '. The data are <b>' + (mo.modes.length === 2 ? 'bimodal' : 'multimodal') + '</b>; the modes are ' + list + '.';
      steps.push({ html: '<b>Mode.</b> Count how often each value appears' + (many ? ' (only the values that appear more than once are listed; the other ' + (mo.groups.length - shown.length) + ' distinct values appear once each)' : '') + ':', block: countTbl || K.note('No value appears more than once.'), note: verdict });
      const diff = d.mean.sub(md.value);
      steps.push({ html: '<b>Mean compared with median.</b> ' + (diff.isZero() ? 'They are equal here: ' + Lab.tex('\\bar x-\\text{median}=0') + '.' : Lab.tex('\\bar x-\\text{median}=' + S.par(S.nt(d.mean)) + '-' + S.par(S.nt(md.value)) + S.eqt(diff)) + ': the mean is ' + (diff.sign() > 0 ? 'above' : 'below') + ' the median.') + ' The mean uses the size of every value, so it is sensitive to outliers; the median only looks at the middle position(s), so it is not (course notes). Try the outlier panel at the end.' });
      body.appendChild(S.steps(steps));
    }

    /* ---------------- spread */
    function drawSpread() {
      const d = D, n = d.n, body = P.spread.body;
      Lab.clear(body);
      const rounded = !S.exact(d.mean) || d.xs.some(x => !S.exact(x));
      const rows = d.xs.map((x, k) => [String(k + 1), S.ht(x), S.ht(d.devs[k]), S.ht(d.dev2[k]), S.ht(x.mul(x))]);
      const tbl = S.table([Lab.tex('i'), Lab.tex('x_{[i]}'), Lab.tex('x_{[i]}-\\bar x'), Lab.tex('(x_{[i]}-\\bar x)^2'), Lab.tex('x_{[i]}^2')], rows,
        { foot: [Lab.tex('\\sum'), S.ht(d.sum), '0', S.ht(d.ss), S.ht(d.sumsq)], scroll: n > 14, cls: 'w3-num' });
      const steps = [];
      steps.push({ html: '<b>Range</b> = largest − smallest:', math: '\\text{Range}=x_{[n]}-x_{[1]}=x_{[' + n + ']}-x_{[1]}=' + S.vt(d.max) + '-' + S.par(S.vt(d.min)) + '=' + S.vt(d.range), note: 'The range uses only the two extreme values, so one outlier changes it completely.' });
      steps.push({ html: '<b>Deviations.</b> Subtract the mean ' + Lab.tex('\\bar x' + S.eqt(d.mean)) + ' from each value, then square. The last column (each value squared) is for the shortcut in step 6.', block: tbl,
        note: 'Column 3 always adds up to exactly 0: the values above the mean balance those below it.' + (rounded ? ' Entries marked ≈ are rounded to 4 decimal places; every total is computed exactly from your values, not from the rounded entries.' : '') });
      steps.push({ html: '<b>Sum of squared deviations</b> (the total of column 4):', math: '\\sum (x_i-\\bar x)^2' + S.eqt(d.ss) });
      steps.push({ html: '<b>Population variance</b> divides by ' + Lab.tex('n=' + n) + ':', math: '\\sigma^2=\\frac{\\sum (x_i-\\bar x)^2}{n}=' + S.overTex(d.ss, n, d.pvar) });
      if (d.svar) steps.push({ html: '<b>Sample variance</b> divides by ' + Lab.tex('n-1=' + n + '-1=' + (n - 1)) + ':', math: 's^2=\\frac{\\sum (x_i-\\bar x)^2}{n-1}=' + S.overTex(d.ss, n - 1, d.svar) });
      else steps.push({ html: '<b>Sample variance</b> needs at least 2 values: with ' + Lab.tex('n=1') + ' the divisor ' + Lab.tex('n-1') + ' is 0, so ' + Lab.tex('s^2') + ' is not defined.' });
      const N = S.int(n), nx2 = d.sum.mul(d.sum).div(N);
      const nx2Tex = S.exact(d.mean)
        ? 'n\\bar x^2=' + n + '\\times ' + S.par(S.vt(d.mean)) + '^2=' + n + '\\times ' + S.vt(d.mean.mul(d.mean)) + S.eqt(nx2)
        : 'n\\bar x^2=\\frac{(\\sum x_i)^2}{n}=\\frac{' + S.par(S.vt(d.sum)) + '^2}{' + n + '}=\\frac{' + S.vt(d.sum.mul(d.sum)) + '}{' + n + '}' + S.eqt(nx2);
      steps.push({
        html: '<b>Shortcut (computational form)</b>: no need to form each ' + Lab.tex('x_i-\\bar x') + '. Square each value and add (column 5):<div class="w3-long">' + Lab.tex('\\sum x_i^2=' + S.sumTex(d.xs, q => S.par(S.vt(q)) + '^2') + '=' + S.vt(d.sumsq)) + '</div>' + (S.exact(d.mean) ? '' : 'Here ' + Lab.tex('\\bar x') + ' is not a short decimal, so use ' + Lab.tex('n\\bar x^2=\\frac{(\\sum x_i)^2}{n}') + ' (the same number, with no rounding):'),
        block: h('div', {}, mathLines(nx2Tex, '\\sum x_i^2-n\\bar x^2=' + S.vt(d.sumsq) + '-' + S.par(S.nt(nx2)) + S.eqt(d.ss), d.svar ? 's^2=\\frac{\\sum x_i^2-n\\bar x^2}{n-1}=' + S.overTex(d.ss, n - 1, d.svar) : ''),
          K.note('The same total as column 4 (' + Lab.tex(S.full(d.ss)) + '), so the same variance. ✓', 'small muted')),
      });
      steps.push({ html: '<b>Standard deviation</b> = the square root of the variance. It has the same units as the data.', block: mathLines('\\sigma=\\sqrt{\\sigma^2}=\\sqrt{' + S.nt(d.pvar) + '}' + S.sqrtEq(d.pvar), d.svar ? 's=\\sqrt{s^2}=\\sqrt{' + S.nt(d.svar) + '}' + S.sqrtEq(d.svar) : '') });
      body.appendChild(S.steps(steps));
    }

    /* ---------------- percentiles */
    function drawPct() {
      const d = D, n = d.n, out = P.pctOut, pp = st.pp, p = S.frac(pp, 100);
      Lab.clear(out);
      out.appendChild(K.note('You chose the <b>' + S.ordinal(pp) + ' percentile</b>, so ' + Lab.tex('p=\\frac{' + pp + '}{100}=' + S.vt(p)) + '. Both methods start from the sorted list ' + Lab.tex('x_{[1]}\\le\\cdots\\le x_{[' + n + ']}') + ' with ' + Lab.tex('n=' + n) + '.', 'w3-lead-in'));
      const L = S.pctLecture(d.xs, p), G = S.pctSheets(d.xs, p);
      const lec = [];
      lec.push({ html: 'Multiply:', math: 'np=' + n + '\\times ' + S.vt(p) + '=' + S.vt(L.np) });
      if (!L.whole) {
        const c = L.pos[0];
        lec.push({ html: Lab.tex('np=' + S.vt(L.np)) + ' is not a whole number, so round it <b>up</b>: ' + Lab.tex('\\lceil ' + S.vt(L.np) + '\\rceil=' + c) + '. Take the value at position ' + c + ':', math: 'x_{[' + c + ']}=' + S.vt(L.value), block: chipWindow(d.xs, L.pos) });
      } else {
        const [k, k1] = L.pos;
        lec.push({ html: Lab.tex('np=' + S.vt(L.np)) + ' is a whole number, so average the values at positions ' + Lab.tex('np=' + k) + ' and ' + Lab.tex('np+1=' + k1) + ':', math: '\\frac{x_{[' + k + ']}+x_{[' + k1 + ']}}{2}=\\frac{' + S.vt(d.xs[k - 1]) + '+' + S.par(S.vt(d.xs[k1 - 1])) + '}{2}' + S.eqt(L.value), block: chipWindow(d.xs, L.pos) });
      }
      const le = d.xs.filter(x => x.cmp(L.value) <= 0).length, ge = d.xs.filter(x => x.cmp(L.value) >= 0).length;
      const pc = c => S.int(c * 100).div(S.int(n));
      const vL = S.vt(L.value);
      lec.push({ html: 'Check with the definition (at least ' + Lab.tex('100p\\%') + ' of the data ' + Lab.tex('\\le') + ' it, at least ' + Lab.tex('100(1-p)\\%') + ' ' + Lab.tex('\\ge') + ' it):' +
        '<div class="w3-check">' + Lab.tex('\\le ' + vL) + ': ' + le + ' of ' + n + ' values ' + Lab.tex('=' + S.full(pc(le)) + '\\%\\ge ' + pp + '\\%') + ' ✓</div>' +
        '<div class="w3-check">' + Lab.tex('\\ge ' + vL) + ': ' + ge + ' of ' + n + ' values ' + Lab.tex('=' + S.full(pc(ge)) + '\\%\\ge ' + (100 - pp) + '\\%') + ' ✓</div>' });
      const gs = [];
      const pn = p.mul(S.int(n - 1));
      gs.push({ html: 'Rank:', block: mathLines('\\text{rank}=p(n-1)+1', '=' + S.vt(p) + '\\times(' + n + '-1)+1', '=' + S.vt(p) + '\\times ' + (n - 1) + '+1=' + S.vt(pn) + '+1=' + S.vt(G.rank)) });
      gs.push({ html: 'Split the rank into its integer part ' + Lab.tex('i=' + G.i) + ' and fractional part ' + Lab.tex('f=' + S.vt(G.rank) + '-' + G.i + '=' + S.vt(G.f)) + '.' });
      if (G.f.isZero() || G.pos.length === 1) {
        gs.push({ html: Lab.tex('f=0') + ', so there is nothing to interpolate: take the value at position ' + Lab.tex('i=' + G.i) + ':', math: 'x_{[' + G.i + ']}=' + S.vt(G.value), block: chipWindow(d.xs, G.pos) });
      } else {
        const i = G.i, gap = G.hi.sub(G.lo), fg = G.f.mul(gap);
        gs.push({ html: 'Go the fraction ' + Lab.tex('f=' + S.vt(G.f)) + ' of the way from ' + Lab.tex('x_{[' + i + ']}') + ' to ' + Lab.tex('x_{[' + (i + 1) + ']}') + ':',
          block: h('div', {}, mathLines('x_{[i]}+f\\times(x_{[i+1]}-x_{[i]})', '=x_{[' + i + ']}+' + S.vt(G.f) + '\\times(x_{[' + (i + 1) + ']}-x_{[' + i + ']})',
            '=' + S.vt(G.lo) + '+' + S.vt(G.f) + '\\times(' + S.vt(G.hi) + '-' + S.par(S.vt(G.lo)) + ')', '=' + S.vt(G.lo) + '+' + S.vt(G.f) + '\\times ' + S.par(S.vt(gap)), '=' + S.vt(G.lo) + '+' + S.par(S.nt(fg)) + S.eqt(G.value)), chipWindow(d.xs, G.pos)) });
      }
      const two = h('div', { class: 'w3-two' });
      const box = (title, cls, steps, value) => h('div', { class: 'w3-method ' + cls }, h('div', { class: 'w3-mhead', html: title }), S.steps(steps), h('div', { class: 'w3-mres', html: 'Result: ' + Lab.tex(S.ordinal(pp).replace(/(\d+)(\D+)/, '$1\\text{$2}') + '\\text{ percentile}' + S.eqt(value)) }));
      two.append(box('Lecture / textbook: the ' + Lab.tex('np') + ' method', 'lec', lec, L.value), box('Google Sheets / tutorial: interpolation', 'gs', gs, G.value));
      out.appendChild(two);
      const same = L.value.eq(G.value);
      out.appendChild(h('div', { class: 'w3-verdict ' + (same ? 'same' : 'differ'), html: same
        ? 'Both methods give ' + Lab.tex(S.full(L.value)) + ' for the ' + S.ordinal(pp) + ' percentile of your data.'
        : '<b>The two methods differ here:</b> ' + Lab.tex(S.full(L.value)) + ' (lecture) and ' + Lab.tex(S.full(G.value)) + ' (Sheets), a difference of ' + Lab.tex(S.full(G.value.sub(L.value).abs())) + '. The course notes: the two methods need not agree — use the one the question specifies.' }));
    }

    /* ---------------- quartiles, fences, box plot */
    function drawQuart() {
      const d = D, n = d.n, out = P.quartOut;
      Lab.clear(out);
      const rowsQ = [[1, 4, 'Q_1', 25], [1, 2, 'Q_2', 50], [3, 4, 'Q_3', 75]].map(([a, b, name, pc]) => {
        const p = S.frac(a, b), L = S.pctLecture(d.xs, p), G = S.pctSheets(d.xs, p);
        const two = S.cellLines;
        const lecT = L.whole
          ? two('np=' + n + '\\times ' + S.vt(p) + '=' + S.vt(L.np) + '\\ \\text{(whole)}', '\\tfrac{x_{[' + L.pos[0] + ']}+x_{[' + L.pos[1] + ']}}{2}=\\tfrac{' + S.vt(d.xs[L.pos[0] - 1]) + '+' + S.par(S.vt(d.xs[L.pos[1] - 1])) + '}{2}' + S.eqt(L.value))
          : two('np=' + n + '\\times ' + S.vt(p) + '=' + S.vt(L.np) + ',\\ \\lceil ' + S.vt(L.np) + '\\rceil=' + L.pos[0], 'x_{[' + L.pos[0] + ']}=' + S.vt(L.value));
        const gsT = G.pos.length === 1
          ? two('\\text{rank}=' + S.vt(p) + '\\times ' + (n - 1) + '+1=' + S.vt(G.rank), 'x_{[' + G.i + ']}=' + S.vt(G.value))
          : two('\\text{rank}=' + S.vt(p) + '\\times ' + (n - 1) + '+1=' + S.vt(G.rank), S.vt(G.lo) + '+' + S.vt(G.f) + '\\times(' + S.vt(G.hi) + '-' + S.par(S.vt(G.lo)) + ')' + S.eqt(G.value));
        return { cells: [Lab.tex(name) + '<div class="small muted">' + pc + 'th, ' + Lab.tex('p=' + S.vt(p)) + '</div>', lecT, gsT, L.value.eq(G.value) ? '<span class="cgood">same</span>' : '<span class="cbad">differ</span>'], cls: null };
      });
      out.appendChild(S.table(['Quartile', 'Lecture (np) method', 'Sheets (rank) method', ''], rowsQ, { cls: 'w3-qt' }));
      const b = S.boxStats(d.xs, st.qm), other = S.boxStats(d.xs, st.qm === 'lec' ? 'sheets' : 'lec');
      const outList = vs => vs.map(v => Lab.tex(S.vt(v))).join(', ');
      const steps = [];
      steps.push({ html: 'With the <b>' + QM_NAME[st.qm] + '</b>: ' + Lab.tex('Q_1=' + S.full(b.q1)) + ', ' + Lab.tex('Q_3=' + S.full(b.q3)) + '. The interquartile range is the width of the middle half of the data:', math: '\\mathrm{IQR}=Q_3-Q_1=' + S.vt(b.q3) + '-' + S.par(S.vt(b.q1)) + '=' + S.vt(b.iqr) });
      steps.push({ html: 'One and a half IQRs:', math: '1.5\\times\\mathrm{IQR}=1.5\\times ' + S.par(S.vt(b.iqr)) + '=' + S.vt(b.step) });
      steps.push({ html: 'The fences:', block: mathLines('\\text{lower fence}=Q_1-1.5\\,\\mathrm{IQR}=' + S.vt(b.q1) + '-' + S.par(S.vt(b.step)) + '=' + S.vt(b.lo), '\\text{upper fence}=Q_3+1.5\\,\\mathrm{IQR}=' + S.vt(b.q3) + '+' + S.par(S.vt(b.step)) + '=' + S.vt(b.hi)) });
      steps.push({ html: '<b>Outliers</b> are the values below ' + Lab.tex(S.vt(b.lo)) + ' or above ' + Lab.tex(S.vt(b.hi)) + ': ' + (b.outs.length ? outList(b.outs) + ' (' + b.outs.length + ' value' + (b.outs.length > 1 ? 's' : '') + ').' : '<b>none</b>.') + ' A value exactly on a fence is not outside it.' });
      steps.push({ html: '<b>Whiskers</b> reach the most extreme values that are not outliers: the smallest value ' + Lab.tex('\\ge ' + S.vt(b.lo)) + ' is ' + Lab.tex(S.vt(b.wLo)) + ', the largest value ' + Lab.tex('\\le ' + S.vt(b.hi)) + ' is ' + Lab.tex(S.vt(b.wHi)) + '.' });
      steps.push({ html: '<b>Five-number summary</b> (min, ' + Lab.tex('Q_1') + ', ' + Lab.tex('Q_2') + ', ' + Lab.tex('Q_3') + ', max):', math: '(' + [d.min, b.q1, b.q2, b.q3, d.max].map(S.vt).join(',\\ ') + ')' + ([b.q1, b.q2, b.q3].some(q => !S.exact(q)) ? '\\ \\text{(rounded)}' : '') });
      out.appendChild(S.steps(steps));
      out.appendChild(legend([{ kind: 'box', text: 'box: ' + Lab.tex('Q_1') + ' to ' + Lab.tex('Q_3') }, { kind: 'med', text: 'median ' + Lab.tex('Q_2') }, { kind: 'whisk', text: 'whiskers' }, { kind: 'fence', text: 'fences' }, { kind: 'out', text: 'outlier' }]));
      const chart = h('div', { class: 'w3-chart' });
      out.appendChild(chart);
      boxPlot(chart, d.xs, b);
      const sameOut = b.outs.length === other.outs.length && b.outs.every((v, j) => v.eq(other.outs[j]));
      if (!sameOut) out.appendChild(h('div', { class: 'w3-verdict differ', html: '<b>The verdict depends on the method.</b> With the ' + QM_NAME[st.qm === 'lec' ? 'sheets' : 'lec'] + ' the quartiles are ' + Lab.tex(S.vt(other.q1)) + ' and ' + Lab.tex(S.vt(other.q3)) + ', the fences ' + Lab.tex(S.vt(other.lo)) + ' and ' + Lab.tex(S.vt(other.hi)) + ', and the outliers are ' + (other.outs.length ? outList(other.outs) : 'none') + '. Switch the method above to see its box plot.' }));
    }

    /* ---------------- shift and scale */
    function drawShift() {
      const d = D, n = d.n, out = P.shiftOut;
      Lab.clear(out);
      const c = S.readNum(st.c) || S.R0, k = S.readNum(st.k) || S.R1, ka = k.abs();
      const yS = d.vals.map(x => x.add(c)), yK = d.vals.map(x => x.mul(k));
      const dS = S.describe(yS), dK = S.describe(yK);
      const bX = S.boxStats(d.xs, st.qm), bS = S.boxStats(dS.xs, st.qm), bK = S.boxStats(dK.xs, st.qm);
      const vc = S.vt(c), vk = S.vt(k), k2 = k.mul(k);
      const L = S.cellLines;
      const ok = b => (b ? '<span class="cgood" title="the value computed from the new data equals the rule">✓</span>' : '<span class="cbad">✗ differs</span>');
      const modeT = ms => (ms.length ? ms.map(S.vt).join(',\\ ') : '\\text{none}');
      const listOf = (ys, cap = 24) => ys.slice(0, cap).map(S.ht).join(', ') + (ys.length > cap ? ', … (' + ys.length + ' values)' : '');
      const sdRow = (sym, vx, vy, mult) => {
        const pred = mult ? vx.mul(mult) : vx;
        return [Lab.tex(sym), L(sym + '_x' + S.sqrtEq(vx)), L(sym + '_y=\\sqrt{' + S.nt(vy) + '}', S.sqrtEq(vy)),
          mult ? L(sym + '_y=|k|\\,' + sym + '_x=\\sqrt{k^2' + sym + '_x^2}', '=\\sqrt{' + S.par(vk) + '^2\\times ' + S.par(S.nt(vx)) + '}', '=\\sqrt{' + S.nt(pred) + '}' + S.sqrtEq(pred)) : L(sym + '_y=' + sym + '_x') + 'unchanged', ok(vy.eq(pred))];
      };
      const head = ['Measure', 'Your data ' + Lab.tex('x'), 'New data ' + Lab.tex('y') + ', computed from the ' + Lab.tex('y') + ' values', 'Rule from the course notes', ''];
      // shift table
      out.appendChild(K.note('<b>Shift.</b> You chose ' + Lab.tex('c=' + vc) + '. New data ' + Lab.tex('y_i=x_i+' + S.par(vc)) + ' (sorted): ' + listOf(dS.xs) + '.', 'w3-lead-in'));
      const rowsS = [
        ['mean', L('\\bar x' + S.eqt(d.mean)), L('\\bar y=' + S.overTex(dS.sum, n, dS.mean)), L('\\bar y=\\bar x+c', '=' + S.par(S.nt(d.mean)) + '+' + S.par(vc) + S.eqt(d.mean.add(c))), ok(dS.mean.eq(d.mean.add(c)))],
        ['median', L(S.full(d.med.value)), L(S.full(dS.med.value)), L(S.vt(d.med.value) + '+' + S.par(vc) + S.eqt(d.med.value.add(c))), ok(dS.med.value.eq(d.med.value.add(c)))],
        ['mode', L(modeT(d.mo.modes)), L(modeT(dS.mo.modes)), d.mo.modes.length ? L(d.mo.modes.map(m => S.vt(m) + '+' + S.par(vc)).join(',\\ '), '\\to ' + modeT(d.mo.modes.map(m => m.add(c)))) : 'still no mode', ok(dS.mo.modes.length === d.mo.modes.length && dS.mo.modes.every((m, j) => m.eq(d.mo.modes[j].add(c))))],
        ['range', L(S.vt(d.range)), L(S.vt(dS.max) + '-' + S.par(S.vt(dS.min)) + '=' + S.vt(dS.range)), 'unchanged', ok(dS.range.eq(d.range))],
        ['IQR', L(S.full(bX.iqr)), L(S.vt(bS.q3) + '-' + S.par(S.vt(bS.q1)) + '=' + S.vt(bS.iqr)), 'unchanged', ok(bS.iqr.eq(bX.iqr))],
        [Lab.tex('\\sigma^2'), L(S.full(d.pvar)), L(S.full(dS.pvar)), 'unchanged', ok(dS.pvar.eq(d.pvar))],
        [Lab.tex('s^2'), d.svar ? L(S.full(d.svar)) : '—', dS.svar ? L(S.full(dS.svar)) : '—', 'unchanged', d.svar ? ok(dS.svar.eq(d.svar)) : ''],
        sdRow('\\sigma', d.pvar, dS.pvar, null),
      ];
      if (d.svar) rowsS.push(sdRow('s', d.svar, dS.svar, null));
      out.appendChild(S.table(head, rowsS, { cls: 'w3-st' }));
      out.appendChild(K.note('Adding ' + Lab.tex('c') + ' slides every value by the same amount: the centre moves by ' + Lab.tex('c') + ', the gaps between values do not change, so the spread does not change. ✓ = the value computed from the new data is exactly what the rule predicts.'));
      // scale table
      out.appendChild(K.note('<b>Scale.</b> You chose ' + Lab.tex('k=' + vk) + ', so ' + Lab.tex('|k|=' + S.vt(ka)) + ' and ' + Lab.tex('k^2=' + S.par(vk) + '^2=' + S.vt(k2)) + '. New data ' + Lab.tex('y_i=' + S.par(vk) + '\\times x_i') + ' (sorted): ' + listOf(dK.xs) + '.', 'w3-lead-in'));
      const kModes = S.sorted(d.mo.modes.map(m => m.mul(k)));
      const rowsK = [
        ['mean', L('\\bar x' + S.eqt(d.mean)), L('\\bar y=' + S.overTex(dK.sum, n, dK.mean)), L('\\bar y=k\\,\\bar x', '=' + S.par(vk) + '\\times ' + S.par(S.nt(d.mean)) + S.eqt(d.mean.mul(k))), ok(dK.mean.eq(d.mean.mul(k)))],
        ['median', L(S.full(d.med.value)), L(S.full(dK.med.value)), L(S.par(vk) + '\\times ' + S.par(S.vt(d.med.value)) + S.eqt(d.med.value.mul(k))), ok(dK.med.value.eq(d.med.value.mul(k)))],
        ['mode', L(modeT(d.mo.modes)), L(modeT(dK.mo.modes)), d.mo.modes.length ? L(d.mo.modes.map(m => S.par(vk) + '\\times ' + S.par(S.vt(m))).join(',\\ '), '\\to ' + modeT(kModes)) : (k.isZero() ? 'no rule: with ' + Lab.tex('k=0') + ' every value becomes 0' : 'still no mode'),
          !d.mo.modes.length && k.isZero() ? '' : ok(dK.mo.modes.length === kModes.length && kModes.every((m, j) => m.eq(dK.mo.modes[j])))],
        ['range', L(S.vt(d.range)), L(S.vt(dK.max) + '-' + S.par(S.vt(dK.min)) + '=' + S.vt(dK.range)), L('|k|\\times\\text{range}', '=' + S.vt(ka) + '\\times ' + S.par(S.vt(d.range)) + '=' + S.vt(d.range.mul(ka))), ok(dK.range.eq(d.range.mul(ka)))],
        ['IQR', L(S.full(bX.iqr)), L(S.vt(bK.q3) + '-' + S.par(S.vt(bK.q1)) + '=' + S.vt(bK.iqr)), L('|k|\\times\\mathrm{IQR}', '=' + S.vt(ka) + '\\times ' + S.par(S.vt(bX.iqr)) + '=' + S.vt(bX.iqr.mul(ka))), ok(bK.iqr.eq(bX.iqr.mul(ka)))],
        [Lab.tex('\\sigma^2'), L(S.full(d.pvar)), L(S.full(dK.pvar)), L('k^2\\sigma_x^2=' + S.vt(k2) + '\\times ' + S.par(S.nt(d.pvar)), S.eqt(d.pvar.mul(k2))), ok(dK.pvar.eq(d.pvar.mul(k2)))],
        [Lab.tex('s^2'), d.svar ? L(S.full(d.svar)) : '—', dK.svar ? L(S.full(dK.svar)) : '—', d.svar ? L('k^2 s_x^2=' + S.vt(k2) + '\\times ' + S.par(S.nt(d.svar)), S.eqt(d.svar.mul(k2))) : '—', d.svar ? ok(dK.svar.eq(d.svar.mul(k2))) : ''],
        sdRow('\\sigma', d.pvar, dK.pvar, k2),
      ];
      if (d.svar) rowsK.push(sdRow('s', d.svar, dK.svar, k2));
      out.appendChild(S.table(head, rowsK, { cls: 'w3-st' }));
      out.appendChild(K.note('Multiplying by ' + Lab.tex('k') + ' stretches every gap by ' + Lab.tex('|k|') + ' (a negative ' + Lab.tex('k') + ' also flips the order, which is why ranges and SDs use ' + Lab.tex('|k|') + '); squared distances grow by ' + Lab.tex('k^2') + '.'));
    }

    /* ---------------- outlier effect */
    function curOi() { return st.oi >= 0 && st.oi < D.n ? st.oi : D.n - 1; }
    function outRange() {
      const span = Math.max(D.range.num(), Math.abs(D.mean.num()) * 0.2, 1);
      const step = S.niceStep(span / 40);
      const lo = Math.floor((D.min.num() - 2 * span) / step) * step, hi = Math.ceil((D.max.num() + 3 * span) / step) * step;
      return { lo: +lo.toPrecision(12), hi: +hi.toPrecision(12), step, span };
    }
    function curV() {
      const typed = st.ov !== '' ? S.readNum(st.ov) : null;
      if (typed) return typed;
      const i = curOi(), r = outRange();
      return i === D.n - 1 ? S.fromSlider(Math.min(r.hi, D.max.num() + 2 * r.span)) : D.xs[i];
    }
    function syncOut() {
      const sel = ctl.oi.select;
      Lab.clear(sel);
      D.xs.forEach((x, i) => sel.appendChild(h('option', { value: String(i), text: 'position ' + (i + 1) + ': ' + S.ht(x) + (i === 0 ? ' (smallest)' : i === D.n - 1 ? ' (largest)' : '') })));
      sel.value = String(curOi());
      const r = outRange();
      ctl.ov.set(S.str(curV()));
      ctl.ov.setRange(r.lo, r.hi, r.step);
    }
    /** v: a number from a drag (snapped to the slider step, kept inside the slider range) or an exact R. */
    function setV(v) {
      let q = v;
      if (typeof v === 'number') {
        const r = outRange();
        q = S.fromSlider(Math.max(r.lo, Math.min(r.hi, Math.round(v / r.step) * r.step)));
      }
      st.ov = S.str(q);
      ctl.ov.set(st.ov);
      save();
      drawOut();
    }
    function drawOut() {
      const d = D, n = d.n, out = P.outOut;
      Lab.clear(out);
      const i = curOi(), x0 = d.xs[i], v = curV();
      const rest = d.xs.filter((_, j) => j !== i);
      const newVals = rest.concat([v]);
      const dn = S.describe(newVals);
      const dMean = dn.mean.sub(d.mean), dMed = dn.med.value.sub(d.med.value);
      const moved = !v.eq(x0);
      out.appendChild(K.note('You picked ' + Lab.tex('x_{[' + (i + 1) + ']}=' + S.vt(x0)) + (moved ? ' and moved it to ' + Lab.tex('v=' + S.vt(v)) + ' (a change of ' + Lab.tex(S.vt(v) + '-' + S.par(S.vt(x0)) + '=' + S.vt(v.sub(x0))) + ').' : '. It has not moved yet: type a new ' + Lab.tex('v') + ', use the slider, or drag in a chart.'), 'w3-lead-in'));
      const signed = q => (q.sign() > 0 ? '+' : '') + S.full(q);
      const rows = [
        ['mean ' + Lab.tex('\\bar x'), Lab.tex(S.full(d.mean)), Lab.tex(S.full(dn.mean)), Lab.tex(signed(dMean))],
        ['median', Lab.tex(S.full(d.med.value)), Lab.tex(S.full(dn.med.value)), Lab.tex(signed(dMed))],
      ];
      out.appendChild(S.table(['', 'before', 'after', 'change'], rows, { cls: 'w3-ot' }));
      const N = S.int(n);
      const meanWhy = 'The total changes by ' + Lab.tex('v-x_{[' + (i + 1) + ']}=' + S.vt(v) + '-' + S.par(S.vt(x0)) + '=' + S.vt(v.sub(x0))) + ', and the mean is the total ÷ ' + Lab.tex('n=' + n) + ', so the mean changes by ' + Lab.tex('\\frac{v-x_{[' + (i + 1) + ']}}{n}=\\frac{' + S.vt(v.sub(x0)) + '}{' + n + '}' + S.eqt(v.sub(x0).div(N))) + '. Every unit the value moves drags the mean ' + Lab.tex('\\tfrac1{n}=\\tfrac1{' + n + '}') + ' of a unit.';
      const mp = dn.med.pos;
      const midVals = mp.map(p => S.vt(dn.xs[p - 1]));
      const medWhy = 'The median only reads the middle position' + (mp.length > 1 ? 's ' + mp[0] + ' and ' + mp[1] : ' ' + mp[0]) + ' of the sorted list. After the move ' + (mp.length > 1 ? 'they hold ' + Lab.tex(midVals[0]) + ' and ' + Lab.tex(midVals[1]) : 'it holds ' + Lab.tex(midVals[0])) + ', so the median is ' + Lab.tex(S.full(dn.med.value)) + ' (before: ' + Lab.tex(S.full(d.med.value)) + '). ' +
        (dMed.isZero() ? 'Unchanged.' : 'It changed because the moved value was in, or moved across, the middle of the sorted list.') + ' Far from the middle the teal line is flat: once a value is past the middle, how far it goes does not matter.';
      out.appendChild(S.steps([{ html: '<b>Mean.</b> ' + meanWhy }, { html: '<b>Median.</b> ' + medWhy }]));
      const r = outRange();
      const lo = Math.min(r.lo, v.num()), hi = Math.max(r.hi, v.num());
      const restNums = rest.map(q => q.num());
      sweepMap = sweepChart(P.sweep, { lo, hi, rest: restNums, n, sumRest: restNums.reduce((a, b) => a + b, 0), v: v.num(), v0: x0.num() });
      const nx = S.sorted(newVals);
      const movedIdx = nx.findIndex(q => q.eq(v));
      stripMap = dotPlot(P.strip, nx, {
        lo: Math.min(lo, d.min.num()), hi: Math.max(hi, d.max.num()),
        marks: [{ v: dn.mean, kind: 'mean', label: 'mean ' + eqTxt(dn.mean) }, { v: dn.med.value, kind: 'med', label: 'median ' + eqTxt(dn.med.value) }],
        cls: j => (j === movedIdx ? 'moved' : ''),
        title: j => S.ht(nx[j]) + (j === movedIdx ? ' (the moved value)' : ''),
      });
      Lab.clear(P.outApply);
      if (moved) P.outApply.appendChild(Lab.button('Use these ' + n + ' numbers as my data', () => {
        const typed = d.vals.slice();
        const at = typed.findIndex(q => q.eq(x0));
        typed[at] = v;
        const txt = typed.map(S.str).join(', ');
        ctl.data.set(txt);
        P.data.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' });
      }, 'btn sm'));
    }
  }

  Lab.lab({
    id: 'lab-s1-describe', course: 's1', week: 3, order: 1,
    title: 'Describe a dataset lab', sub: 'Week 3 · centre, spread, position',
    topics: ['mean', 'median', 'mode', 'variance', 'SD', 'percentiles (2 methods)', 'quartiles', 'IQR', 'box plot', 'outliers', 'shift & scale'],
    desc: 'Type your own numbers. See them sorted with positions, then the mean, median and mode, the variance and SD (deviations table and shortcut), any percentile by both course methods, quartiles, fences and a box plot, shift and scale, and what one far value does to the mean and the median.',
    render: host => describeLab(host),
  });
})();
