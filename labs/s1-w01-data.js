/* Playground lab — Statistics I, Week 1: kinds of data (lab-s1-data).
   The learner types a small dataset (rows = cases, columns = variables) and classifies every column:
   categorical or numerical, discrete or continuous, and its scale (nominal, ordinal, interval, ratio).
   The lab makes its own suggestion from the column name and the values, says why, and checks the
   learner's choice ("sure" rules are marked right or wrong; "likely" rules accept both with the reason).
   Live demonstrations: the "average" of nominal codes, ordinal codes with unequal gaps, °C → °F ratios
   (interval) and cm → inch ratios (ratio). Population vs sample with a seeded random sample, and
   cross-sectional vs time-series with a timeplot of the learner's values.
   Ground truth: Statistics I revision notes, Week 1 (L1.1–L1.4) and the W1_L1 lecture (population,
   sample, descriptive vs inferential, the cricket data set).
   Arithmetic is exact (Lab.F fractions): a value is printed exactly when its decimal ends within
   6 places, otherwise as a fraction with "≈" and 4 decimal places. */
(function () {
  'use strict';
  const K = Lab.play;
  const { h, svg, F } = Lab;
  const esc = Lab.esc;
  const KEY = 'lab:s1-data';
  const VERSION = 1;
  const MAX_ROWS = 30, MAX_COLS = 10, MAX_POP = 200;

  /* ====================================================================
     Exact numbers
     ==================================================================== */
  const NUM_RE = /^-?(\d+\.?\d*|\.\d+)$/;
  /** A typed cell → exact fraction, or null when it is not a plain number ("158.5", "-3", "40"). */
  function numOf(s) {
    let t = String(s == null ? '' : s).trim().replace(/[−–]/g, '-').replace(/^\+/, '');
    if (!NUM_RE.test(t)) return null;
    t = t.replace(/\.$/, '');
    if (/^-?\./.test(t)) t = t.replace('.', '0.');
    try { return F(t); } catch (e) { return null; }
  }
  /** Exact decimal text of a fraction when it ends within dp places, else null. */
  function decStr(f, dp = 6) {
    if (!(f instanceof Lab.Frac) || f.approx) return null;
    let d = f.d, a = 0, b = 0;
    while (d % 2 === 0) { d /= 2; a++; }
    while (d % 5 === 0) { d /= 5; b++; }
    if (d !== 1) return null;
    const p = Math.max(a, b);
    if (p > dp) return null;
    let s = (BigInt(Math.abs(f.n)) * 10n ** BigInt(p) / BigInt(f.d)).toString();
    if (p > 0) { s = s.padStart(p + 1, '0'); s = s.slice(0, -p) + '.' + s.slice(-p); }
    return (f.n < 0 ? '-' : '') + s;
  }
  const minus = s => String(s).replace(/^-/, '−');
  const r4 = x => Lab.fmtDec(x, 4);
  /** A data value as TeX / as text, exactly as typed (158.5, −3, 7/2). */
  const vTex = f => decStr(f, 8) ?? f.tex();
  const vTxt = f => minus(decStr(f, 8) ?? f.toString());
  /** "=1.625" or "\approx 1.5294": the relation sign and the decimal of a computed value. */
  function eqTex(f) { const d = decStr(f, 6); return d != null ? '=' + d : '\\approx ' + r4(Number(f)); }
  function eqTxt(f) { const d = decStr(f, 6); return d != null ? '= ' + minus(d) : '≈ ' + minus(r4(Number(f))); }
  /** A computed quotient: "2", "\frac{13}{8}=1.625", "\frac{26}{17}\approx 1.5294". */
  function qTex(f) {
    if (f.approx) return r4(Number(f));
    if (f.d === 1) return String(f.n);
    return f.tex() + eqTex(f);
  }
  /** Short text of a computed value: "1.625", "≈ 1.5294". */
  function shortTxt(f) { const d = decStr(f, 6); return d != null ? minus(d) : '≈ ' + minus(r4(Number(f))); }
  const fsum = arr => arr.reduce((a, b) => a.add(b), F(0));
  /** "72+91+(-3)" as TeX, "72 + 91 + (−3)" as text. */
  const termsTex = arr => arr.map((f, i) => (i && f.n < 0 ? '(' + vTex(f) + ')' : vTex(f))).join('+');
  const termsTxt = arr => arr.map((f, i) => (i && f.n < 0 ? '(' + vTxt(f) + ')' : vTxt(f))).join(' + ');
  /** Mean of codes: Σ f_i c_i / n with every product written out; two lines when there are more than 3 categories. */
  function meanTex(f, C, tot, mean, n) {
    const head = '\\frac{\\sum f_i\\,c_i}{n}';
    const mid = '\\frac{' + f.map((fi, i) => fi + '\\cdot ' + (C[i].n < 0 ? '(' + vTex(C[i]) + ')' : vTex(C[i]))).join('+') + '}{' + n + '}';
    const tail = '\\frac{' + vTex(tot) + '}{' + n + '}' + (mean.d === 1 && !mean.approx ? '=' + mean.n : eqTex(mean));
    return f.length > 3 ? '\\begin{aligned}' + head + '&=' + mid + '\\\\&=' + tail + '\\end{aligned}' : head + '=' + mid + '=' + tail;
  }
  const tx = s => Lab.tex(s);
  const DEGC = '\\,{}^{\\circ}\\mathrm{C}', DEGF = '\\,{}^{\\circ}\\mathrm{F}';
  const plural = (k, one, many) => k + ' ' + (k === 1 ? one : many || one + 's');
  /** Exact binomial coefficient as BigInt. */
  function chooseBig(n, k) { let r = 1n; for (let i = 1; i <= k; i++) r = r * BigInt(n - k + i) / BigInt(i); return r; }
  const bigTxt = b => b.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  /* ====================================================================
     Seeded random sample (so a drawn sample survives a reload)
     ==================================================================== */
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  /** Simple random sample: n of the positions 0 … N−1 without replacement (partial Fisher–Yates). */
  function drawIdx(N, n, seed) {
    const r = rng(seed), idx = Array.from({ length: N }, (_, i) => i);
    for (let i = 0; i < n; i++) { const j = i + Math.floor(r() * (N - i)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return idx.slice(0, n).sort((a, b) => a - b);
  }
  const newSeed = () => 1 + Math.floor(Math.random() * 2147483646);

  /* ====================================================================
     The lab's classifier: column name + values → suggestion with reasons
     ==================================================================== */
  const norm = s => String(s).toLowerCase().replace(/[()[\]{},.:;!?\/\\_'"’–—-]+/g, ' ').replace(/\s+/g, ' ').trim();
  const KW = {
    count: /\bnumber of\b|\bno of\b|\bhow many\b|\bcount\b|\bsiblings?\b|\bchildren\b|\bkids\b|\bmembers\b|\bgoals?\b|\bwickets?\b|\bmatches\b|\bruns\b|\bvisits\b|\bpets\b|\bdefects?\b|\bcases\b|\bemployees\b|\bbooks\b|\bcars\b/,
    label: /\bid\b|\bcode\b|\bpin\b|\bpincode\b|\bzip\b|\bphone\b|\bmobile\b|\bjersey\b|\baadhaar\b|\baccount\b|\broll\b|\bregistration\b|\bserial\b|\bcard\b|\bsl no\b|\bs no\b|\bvehicle\b/,
    rank: /\brank|\bposition\b|\bplace\b/,
    rating: /\brating|\bstars?\b|\blevel\b|\blikert\b/,
    temp: /temp|°c|°f|celsius|fahrenheit/,
    year: /\byear\b|\bdate\b|\bdob\b|\bborn\b/,
    notesRatio: /\bheight|\bweight|\bage\b/,
    marks: /\bmarks?\b|\bscore|\bpoints?\b/,
    money: /\bincome|\bsalary|\bprice|\bcost|\bamount\b|\bsales\b|\bexpenditure|\bwage|\brent\b|\bfees?\b/,
    avg: /\baverage\b|\bavg\b|\bmean\b|\brate\b/,
    gpa: /\bgpa\b|\bgrade point/,
    measure: /\blength|\bdistance|\btime\b|\bduration|\bhours?\b|\bminutes?\b|\bseconds?\b|\bspeed|\barea\b|\bvolume|\bmass\b|\brainfall|\bkwh\b|\belectricity|\bwidth|\bdepth|\bbmi\b|\bkm\b|\bcm\b|\bkg\b/,
    nominal: /\bname\b|\bgender|\bsex\b|\bblood|\bboard\b|\bcity|\btown|\bstate\b|\bcountry|\bcolou?r|\bbrand|\breligion|\bnationality|\blanguage|\bdepartment|\bsubject|\bcourse\b|\bgenre|\btype\b|\brole\b|\bstyle\b|\bplayer|\bstudent\b|\bteam\b|\bbranch\b|\bschool\b|\bcollege\b|\bdistrict\b|\bmethod\b|\bmobile\b|\bphone\b|\bjersey\b|\broll\b|\bid\b|\bcode\b/,
    notesNom: /\bname\b|\bgender|\bsex\b|\bblood|\bboard\b/,
  };
  /** Word scales with a natural order (lowest first). `needs`: the column name must match too. */
  const ORDERED = [
    { list: ['very poor', 'poor', 'fair', 'average', 'satisfactory', 'good', 'very good', 'excellent', 'outstanding'] },
    { list: ['very low', 'low', 'medium', 'moderate', 'high', 'very high'] },
    { list: ['strongly disagree', 'disagree', 'neutral', 'agree', 'strongly agree'] },
    { list: ['very dissatisfied', 'dissatisfied', 'unsatisfied', 'neutral', 'satisfied', 'very satisfied'] },
    { list: ['never', 'rarely', 'seldom', 'sometimes', 'often', 'usually', 'always'] },
    { list: ['extra small', 'small', 'medium', 'large', 'extra large'] },
    { list: ['xs', 's', 'm', 'l', 'xl', 'xxl'], needs: /size/ },
    { list: ['primary', 'secondary', 'higher secondary', 'diploma', 'undergraduate', 'graduate', 'postgraduate', 'doctorate'] },
    { list: ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'] },
    { list: ['1st', '2nd', '3rd', '4th', '5th', '6th'] },
    { list: ['freshman', 'sophomore', 'junior', 'senior'] },
    { list: ['mild', 'moderate', 'severe'] },
    { list: ['cold', 'cool', 'warm', 'hot'] },
    { list: ['bad', 'okay', 'ok', 'good', 'great'] },
    { list: ['bronze', 'silver', 'gold', 'platinum'] },
    { list: ['u', 'f', 'e', 'd', 'c', 'b', 'a', 's'], needs: /grade/ },
  ];
  /** The natural order of a set of words, lowest first, when the lab knows one (else null). */
  function orderOf(distinct, nm) {
    if (distinct.length < 2) return null;
    for (const sc of ORDERED) {
      if (sc.needs && !sc.needs.test(nm)) continue;
      const pos = v => sc.list.indexOf(norm(v));
      if (distinct.every(v => pos(v) >= 0)) return distinct.slice().sort((a, b) => pos(a) - pos(b));
    }
    return null;
  }
  const KIND_W = { cat: 'categorical', num: 'numerical', text: 'free text (unstructured)' };
  const DC_W = { disc: 'discrete', cont: 'continuous' };
  const SC_W = { nom: 'nominal', ord: 'ordinal', int: 'interval', rat: 'ratio' };

  /** Cells that mean "not available": dashes or NA (W1_L2 at 24:17 — not the same as 0). */
  const MISSING = /^(-{1,9}|–+|—+|na|n\/a|not available)$/i;
  /** Facts about one column's values. */
  function analyse(name, cells) {
    const raw = cells.map(c => String(c == null ? '' : c).trim());
    const vals = raw.filter(v => v !== '' && !MISSING.test(v));
    const A = { name, n: vals.length, blanks: raw.filter(v => v === '').length, na: raw.filter(v => v !== '' && MISSING.test(v)).length, vals, counts: new Map() };
    vals.forEach(v => A.counts.set(v, (A.counts.get(v) || 0) + 1));
    A.distinct = [...A.counts.keys()];
    const nums = vals.map(numOf);
    A.nNum = nums.filter(Boolean).length;
    A.allNum = A.n > 0 && A.nNum === A.n;
    A.mixed = A.nNum > 0 && A.nNum < A.n;
    if (A.allNum) {
      A.nums = nums;
      A.decimals = nums.filter(f => f.d !== 1).length;
      A.negatives = nums.filter(f => f.n < 0).length;
      A.min = nums.reduce((a, b) => (Number(b) < Number(a) ? b : a));
      A.max = nums.reduce((a, b) => (Number(b) > Number(a) ? b : a));
    }
    const words = vals.map(v => v.split(/\s+/).length).sort((a, b) => a - b);
    A.medWords = words.length ? words[Math.floor((words.length - 1) / 2)] : 0;
    A.constant = A.n >= 2 && A.distinct.length === 1;
    A.sug = suggest(name, A);
    if (A.sug && A.constant) A.sug.constNote = 'Every case has the same value, ' + esc(A.distinct[0]) + ': this characteristic does not vary across these cases, so here it is not really a variable — a variable is a characteristic that varies across the cases (W1_L2 at 18:33, where every student pays the same fee).';
    return A;
  }
  /** "2 blank cells and 1 marked not available" (or ''). */
  function missingTxt(A) {
    const parts = [];
    if (A.blanks) parts.push(plural(A.blanks, 'blank cell'));
    if (A.na) parts.push(A.na + ' marked “not available”');
    return parts.join(' and ');
  }

  /** The lab's classification with reasons. *Sure = a safe rule; otherwise the suggestion is "likely". */
  function suggest(name, A) {
    if (!A.n) return null;
    const nm = norm(name);
    const every = re => A.vals.every(v => re.test(v));
    if (!A.allNum && every(/^\d{1,2}:\d{2}(:\d{2})?$/)) {
      return { kind: 'num', kindSure: true, kindWhy: 'clock times (such as ' + esc(A.vals[0]) + ') are points on a time scale: <b>numerical</b>.',
        dc: 'cont', dcSure: true, dcWhy: 'time is measured and can take any value in between (8:12, 8:12:30, …): <b>continuous</b>.',
        scale: 'int', scaleSure: true, scaleWhy: '0:00 (midnight) is not “no time”, so the zero is arbitrary: a difference such as 9:00 − 7:30 = 1 h 30 min means something, a ratio of two clock times does not — <b>interval</b>.' };
    }
    if (!A.allNum && every(/^\d{1,2}[-\/.]\d{1,2}([-\/.]\d{2,4})?$/)) {
      const forms = [...new Set(A.vals.map(v => v.split(/[-\/.]/).length))];
      return { kind: 'num', kindSure: true, kindWhy: 'calendar dates (such as ' + esc(A.vals[0]) + ') are points on a time scale: <b>numerical</b>.',
        dc: 'disc', dcSure: false, dcWhy: 'dates go in whole days: <b>discrete</b> (time itself flows continuously, so continuous can also be argued).',
        scale: 'int', scaleSure: true, scaleWhy: 'a calendar has no true zero, so dividing two dates means nothing, while the number of days between them does: <b>interval</b>.',
        note: forms.length > 1 ? 'The dates are not written the same way in every cell (' + esc(A.vals.find(v => v.split(/[-\/.]/).length === forms[0])) + ' and ' + esc(A.vals.find(v => v.split(/[-\/.]/).length === forms[1])) + ') — each variable should hold the same type of value in every row (W1_L2 at 28:41).' : null };
    }
    if (!A.allNum && every(/^\d+(\.\d+)?\s*\/\s*\d+(\.\d+)?$/)) {
      return { kind: 'num', kindSure: true, kindWhy: 'each cell holds two measured numbers (such as ' + esc(A.vals[0]) + ', blood pressure as systolic / diastolic in mmHg): <b>numerical</b>. Strictly these are two variables; a tidy table would give each one its own column.',
        dc: 'cont', dcSure: true, dcWhy: 'pressure is measured: <b>continuous</b>.',
        scale: 'rat', scaleSure: false, scaleWhy: '0 mmHg would mean no pressure at all, so ratios make sense: <b>ratio</b>.' };
    }
    if (!A.allNum) {
      if (!A.mixed && A.n >= 3 && A.distinct.length === A.n && A.medWords >= 6) {
        return { kind: 'text', why: 'every value is a different sentence of free text: this is <b>unstructured</b> data (course notes, Week 1: text, images, audio, video, comments). It cannot be counted, ordered or averaged until you turn it into a variable — for example “positive / negative”.' };
      }
      const S = { kind: 'cat', kindSure: !A.mixed };
      if (A.mixed) {
        const nonNum = A.vals.filter(v => !numOf(v)), isNum = A.vals.filter(v => numOf(v));
        const odd = isNum.length >= nonNum.length ? nonNum : isNum;
        S.kindWhy = 'this column mixes ' + plural(isNum.length, 'plain number') + ' with ' + plural(nonNum.length, 'other entry', 'other entries') + '; the odd one' + (odd.length === 1 ? '' : 's') + ' out: ' + odd.slice(0, 3).map(v => '“' + esc(v) + '”').join(', ') + (odd.length > 3 ? ', …' : '') +
          '. One variable holds one type of value (W1_L2 at 29:53: a mark cannot suddenly be written as a percentage) — fix the cell' + (odd.length === 1 ? '' : 's') + '. Until then the lab treats the column as categorical.';
      } else S.kindWhy = 'the values are words that put each case into a group: <b>categorical</b>' + (KW.notesNom.test(nm) ? ' (course notes: board, gender and blood group are categorical; W1_L3 at 05:10: a categorical variable gives group membership).' : ' (group membership, no unit — W1_L3 at 05:10).');
      const ord = orderOf(A.distinct, nm);
      if (ord && !A.mixed) {
        S.scale = 'ord'; S.scaleSure = true; S.order = ord;
        S.scaleWhy = 'the words have a natural order — ' + ord.map(esc).join(' &lt; ') + ' — but the gaps between them are not measured: <b>ordinal</b> (W1_L4 at 07:17: a restaurant rating bad / good / excellent).';
      } else if (KW.nominal.test(nm) && !A.mixed) {
        S.scale = 'nom'; S.scaleSure = true;
        S.scaleWhy = 'labels with no natural order: <b>nominal</b>' + (KW.notesNom.test(nm) ? ' (W1_L4 at 02:59: name, board, gender and blood group are nominal).' : /jersey|mobile|phone|roll/.test(nm) ? ' (W1_L4 at 06:17: a jersey number is nominal).' : '.');
      } else {
        S.scale = 'nom'; S.scaleSure = false;
        S.scaleWhy = 'the lab knows no natural order for these words, so <b>nominal</b>. If they do have one (like small &lt; medium &lt; large), ordinal is right.';
      }
      return S;
    }
    const dec = A.decimals > 0, neg = A.negatives > 0;
    const S = { kind: 'num', kindSure: true };
    const numKind = what => 'the values are ' + what + ': <b>numerical</b> (course notes: quantities with a unit, such as height, marks, income).';
    const ratioWhy = what => '0 means ' + what + ', so “twice as much” makes sense: <b>ratio</b>.';
    if (KW.count.test(nm)) {
      S.kindWhy = numKind('counts (how many)');
      S.dc = 'disc'; S.dcSure = !dec;
      S.dcWhy = dec ? 'a count should be a whole number, but some values have decimals — check them. Counts are <b>discrete</b>.' : 'counts go 0, 1, 2, … with nothing in between: <b>discrete</b> (course notes: discrete = counts; W1_L3 at 09:01: matches played is a whole number such as 463).';
      S.scale = 'rat'; S.scaleSure = !neg;
      S.scaleWhy = neg ? 'a count cannot be negative — check the values. Counts are <b>ratio</b> (0 means none).' : ratioWhy('none of it') + (/wicket|runs/.test(nm) ? ' (W1_L4 at 15:36: 100 wickets is twice 50 wickets.)' : '');
    } else if (KW.label.test(nm)) {
      return { kind: 'cat', kindSure: true, kindWhy: 'these numbers are labels (codes, IDs): adding or averaging two of them means nothing, so the variable is <b>categorical</b> (W1_L3 at 04:08: jersey numbers 10, 18, 7 “have no meaning” as numbers).', scale: 'nom', scaleSure: true, scaleWhy: 'the numbers only name the cases — their order and size carry no meaning: <b>nominal</b> (W1_L4 at 06:17: a jersey number is nominal).' };
    } else if (KW.rank.test(nm)) {
      return { kind: 'cat', kindSure: true, kindWhy: 'the numbers are positions (1st, 2nd, 3rd, …), not amounts: <b>categorical</b> (ordered labels).', scale: 'ord', scaleSure: true, scaleWhy: 'the order means something, but the gap between 1st and 2nd need not equal the gap between 2nd and 3rd: <b>ordinal</b>.' };
    } else if (KW.rating.test(nm)) {
      return { kind: 'cat', kindSure: false, kindWhy: 'a rating such as 1–5 stars is usually treated as an ordered label, not an amount: <b>categorical</b>.', scale: 'ord', scaleSure: false, scaleWhy: '4 stars is better than 2 stars, but not “twice as good”: <b>ordinal</b> (the usual choice; some books treat ratings as interval).' };
    } else if (KW.temp.test(nm)) {
      S.kindWhy = numKind('temperatures with a unit (°C or °F)');
      S.dc = 'cont'; S.dcSure = true; S.dcWhy = 'temperature is measured, so it can take any value in a range (such as 36.6): <b>continuous</b> (course notes: continuous = measurements).';
      S.scale = 'int'; S.scaleSure = true; S.scaleWhy = '0 °C is not “no temperature”, so the zero is arbitrary: differences mean something, ratios do not — <b>interval</b> (W1_L4 at 12:45 and 14:29: °C and °F have no absolute zero).';
    } else if (KW.year.test(nm)) {
      S.kindWhy = numKind('calendar years');
      S.dc = 'disc'; S.dcSure = false; S.dcWhy = 'whole years in steps of 1: <b>discrete</b> (time itself flows continuously, so continuous can also be argued).';
      S.scale = 'int'; S.scaleSure = true; S.scaleWhy = 'year 0 is not “no time”, so dividing two years means nothing, while a difference (2006 − 2003 = 3 years) does: <b>interval</b>.';
    } else if (KW.gpa.test(nm)) {
      S.kindWhy = numKind('grade points');
      S.dc = 'cont'; S.dcSure = false; S.dcWhy = 'an average of grade points can take values in between (such as 8.25): <b>continuous</b>.';
      S.scale = 'int'; S.scaleSure = true; S.scaleWhy = 'a 4 GPA is not twice as good as a 2 GPA (W1_L4 at 18:16): differences mean something, ratios do not — <b>interval</b>.';
    } else if (KW.notesRatio.test(nm)) {
      const age = /\bage\b/.test(nm);
      S.kindWhy = numKind('measured amounts');
      S.dc = 'cont'; S.dcSure = !age;
      S.dcWhy = age ? 'age is measured time: <b>continuous</b>, even when it is written in whole years (then it only looks discrete).' : 'a measurement can take any value in a range (such as 158.5 cm): <b>continuous</b> (course notes: continuous = measurements).';
      S.scale = 'rat'; S.scaleSure = true; S.scaleWhy = '0 means none of it, so “twice as tall / heavy / old” makes sense: <b>ratio</b> (W1_L4 at 15:36 and 17:45: age, height, weight and marks are ratio).';
    } else if (KW.marks.test(nm)) {
      const marks = /\bmarks?\b/.test(nm);
      S.kindWhy = numKind(marks ? 'marks (points)' : 'scores (points)');
      S.dc = dec ? 'cont' : 'disc'; S.dcSure = false;
      S.dcWhy = dec ? 'some values have decimals (such as 72.5), so here they behave like a measurement: <b>continuous</b>. The course notes do not decide marks either way.' : 'whole-number ' + (marks ? 'marks' : 'scores') + ' are counted points: <b>discrete</b>. If half marks were possible they are often called continuous — the course notes do not decide this.';
      S.scale = 'rat'; S.scaleSure = marks && !neg;
      S.scaleWhy = marks ? '0 marks means no marks, so “twice the marks” makes sense: <b>ratio</b> (W1_L4 at 15:36: 300 marks is twice 150 marks).' : ratioWhy('no points') + ' (W1_L4 at 15:36: a highest score of 200 is twice 100 runs.)';
    } else if (KW.money.test(nm) || KW.avg.test(nm) || KW.measure.test(nm)) {
      const money = KW.money.test(nm), avg = !money && KW.avg.test(nm);
      S.kindWhy = numKind('measured amounts');
      S.dc = 'cont'; S.dcSure = !money && !avg;
      S.dcWhy = money ? 'money is usually treated as <b>continuous</b> (it is counted in paise, so discrete can also be argued).'
        : avg ? 'an average can take any value in between (such as 48.21): <b>continuous</b> (W1_L3 at 09:01: a batting average can take any value, even fractions).'
          : 'a measurement can take any value in a range: <b>continuous</b> (course notes: continuous = measurements).';
      S.scale = neg ? 'int' : 'rat'; S.scaleSure = !neg && !avg;
      S.scaleWhy = neg ? 'some values are negative, so 0 is not “none of it”: <b>interval</b>.' : ratioWhy('none of it');
    } else {
      S.kindSure = false;
      S.kindWhy = 'every value is a number. If they are amounts the variable is <b>numerical</b>; if they only name things (like roll numbers) it is categorical — the column name gives the lab no hint.';
      S.dc = dec ? 'cont' : 'disc'; S.dcSure = false;
      S.dcWhy = dec ? 'decimals such as 2.5 come from measuring: <b>continuous</b>.' : 'only whole numbers, as counts would be: <b>discrete</b> (a measurement rounded to whole units would still be continuous).';
      S.scale = neg ? 'int' : 'rat'; S.scaleSure = false;
      S.scaleWhy = neg ? 'some values are negative, so 0 is not “none of it”: <b>interval</b> (like °C).' : 'if 0 means “none of it”, ratios make sense: <b>ratio</b>. If 0 is just a point on the scale (like 0 °C), choose interval.';
    }
    return S;
  }
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  /** Check the learner's choices against the suggestion. → [{cls, html}] */
  function checks(S, ch) {
    const out = [];
    if (!S || S.kind === 'text' || !ch) return out;
    const grade = (ok, sure, mine, why, labWord) => (ok ? { cls: 'ok', html: '<b>✓</b> ' + mine + ' ' + cap(why) }
      : !sure ? { cls: 'maybe', html: '<b>?</b> ' + mine + ' The lab suggests <b>' + labWord + '</b>: ' + why + ' Both can be argued — decide from what the values measure.' }
        : { cls: 'no', html: '<b>✗</b> ' + mine + ' The lab says <b>' + labWord + '</b>: ' + why });
    if (ch.kind) out.push(grade(ch.kind === S.kind, S.kindSure, 'You chose ' + KIND_W[ch.kind] + '.', S.kindWhy, KIND_W[S.kind]));
    if (ch.kind === 'num' && S.kind === 'num' && ch.dc) out.push(grade(ch.dc === S.dc, S.dcSure, 'You chose ' + DC_W[ch.dc] + '.', S.dcWhy, DC_W[S.dc]));
    if (ch.scale) out.push(grade(ch.scale === S.scale, S.scaleSure, 'You chose ' + SC_W[ch.scale] + '.', S.scaleWhy, SC_W[S.scale]));
    if (ch.kind && ch.scale && (ch.kind === 'cat') !== (ch.scale === 'nom' || ch.scale === 'ord'))
      out.push({ cls: 'no', html: '<b>✗</b> Your answers do not fit together: categorical data are nominal or ordinal (labels); numerical data are interval or ratio (numbers) — course notes, scales table.' });
    return out;
  }
  /** Status of a choice: 'none' | 'ok' (all asked parts right) | 'maybe' | 'no' */
  function status(S, ch) {
    if (!S || S.kind === 'text' || !ch || !ch.kind || !ch.scale || (ch.kind === 'num' && !ch.dc)) return 'none';
    const c = checks(S, ch);
    return c.some(x => x.cls === 'no') ? 'no' : c.some(x => x.cls === 'maybe') ? 'maybe' : 'ok';
  }

  /** What each scale allows (course notes table + Week 2 mode/median rules). */
  const OPS = [
    { label: 'Count each value; find the mode', ok: ['nom', 'ord', 'int', 'rat'], why: 'every scale: counting needs only “same or different” (course notes: nominal data have a mode).' },
    { label: 'Put values in order; find the median', ok: ['ord', 'int', 'rat'], why: 'needs an order — nominal labels have none (course notes: nominal data have a mode, not a median).' },
    { label: 'Subtract: a difference means something', ok: ['int', 'rat'], why: 'needs equal steps between values — ordinal gaps are not measured (course notes: interval allows +, −).' },
    { label: 'Add up and divide by n: the mean', ok: ['int', 'rat'], why: 'adding needs numbers with equal steps (course notes: the mean is not defined for categorical data).' },
    { label: 'Divide: ratios such as “twice as much”', ok: ['rat'], why: 'needs a true zero — interval zeros are arbitrary (course notes: ratio allows +, −, ×, ÷).' },
  ];

  /* ====================================================================
     Presets
     ==================================================================== */
  const DATASETS = [
    {
      key: 'class', focus: 'c3', label: 'Class list: name, gender, blood group, grade, °C, height, marks, siblings',
      source: 'made up for this lab. The variables are the course-notes examples for Week 1 (name, gender, blood group; excellent / good / poor; °C; height and marks); the 8 students and their values are invented.',
      cols: ['Name', 'Gender', 'Blood group', 'Grade', 'Home-town temperature (°C)', 'Height (cm)', 'Marks (out of 100)', 'Number of siblings'],
      rows: [
        ['Asha', 'Female', 'O', 'good', '31', '158.5', '72', '1'],
        ['Ravi', 'Male', 'A', 'excellent', '40', '171', '91', '0'],
        ['Meena', 'Female', 'B', 'poor', '20', '152', '38', '2'],
        ['Karthik', 'Male', 'O', 'good', '33', '176.5', '65', '1'],
        ['Fatima', 'Female', 'AB', 'excellent', '28', '163', '88', '3'],
        ['John', 'Male', 'O', 'good', '35', '180', '70', '0'],
        ['Priya', 'Female', 'A', 'poor', '24', '160', '45', '1'],
        ['Divya', 'Female', 'B', 'good', '29', '155', '59', '2'],
      ],
    },
    {
      key: 'students', focus: 'c4', label: 'Student data (lectures W1_L2–W1_L4)',
      source: 'Lecture W1_L2 (understanding data), at 14:30, and W1_L3 (classification of data), at 00:51: the professor’s “student data” sheet, its first 9 rows (dates of birth left out). Varsha’s class-10 mark is typed as 92% exactly as on the sheet; in W1_L3 at 00:51 the professor replaces it with 565. Mobile numbers are masked on the sheet.',
      cols: ['Name', 'Gender', 'Marks in class 10', 'Board (class 10)', 'Marks in class 12', 'Board (class 12)', 'Mobile number'],
      rows: [
        ['Anjali', 'F', '484', 'State Board', '394', 'CBSE', 'xxx7252826'],
        ['Pradeep', 'M', '514', 'ICSE', '437', 'ICSE', 'xxx5243748'],
        ['Varsha', 'F', '92%', 'CBSE', '442', 'CBSE', 'xxx5242824'],
        ['Divya', 'F', '397', 'State Board', '401', 'State Board', 'xxx6546889'],
        ['Thomas', 'M', '562', 'CBSE', '451', 'CBSE', 'xxx4242736'],
        ['Sarita', 'F', '533', 'ICSE', '462', 'ICSE', 'xxx5242577'],
        ['Prashant', 'M', '496', 'CBSE', '413', 'CBSE', 'xxx3352630'],
        ['Harsha', 'M', '436', 'CBSE', '375', 'CBSE', 'xxx1702737'],
        ['Rafiq', 'M', '501', 'ICSE', '423', 'CBSE', 'xxx0026248'],
      ],
    },
    {
      key: 'hospital', focus: 'c7', label: 'Hospital data (lecture W1_L2)',
      source: 'Lecture W1_L2 (understanding data), at 16:20: the professor’s “Hospital Data” sheet, its first 9 patients, values exactly as on screen — including the date typed as 02-03-2020 in row 3 and the unusual temperatures 78.5 °F and 110 °F.',
      cols: ['Date (day-month)', 'Time (IST)', 'Height (cm)', 'Gender', 'Weight (kg)', 'Blood group', 'Body temperature (°F)', 'Blood pressure'],
      rows: [
        ['02-03', '7:30', '178', 'M', '75', 'O+', '100', '118/80'],
        ['02-03', '8:00', '150', 'F', '57.5', 'A-', '98.4', '125/85'],
        ['02-03-2020', '8:12', '162', 'M', '61', 'O-', '98.2', '120/80'],
        ['02-03', '8:52', '145', 'M', '65', 'B+', '78.5', '123/82'],
        ['02-03', '9:00', '180', 'M', '72', 'A+', '95.5', '109/86'],
        ['02-03', '9:09', '175', 'M', '98', 'O+', '110', '155/95'],
        ['02-03', '10:00', '157', 'M', '69', 'B-', '94', '116/80'],
        ['02-03', '10:10', '165', 'F', '59', 'O-', '93', '115/80'],
        ['03-03', '7:40', '169', 'M', '65', 'A+', '96', '130/85'],
      ],
    },
    {
      key: 'players', focus: 'c2', label: 'Cricket players, ODI (lecture W1_L2)',
      source: 'Lecture W1_L2 (understanding data), at 22:24: the professor’s “players data odi” sheet, 9 of its 19 rows, values as on screen. “----” means not available (Uthappa has not bowled), which is not the same as Gambhir’s 0 wickets (W1_L2 at 23:08–24:17).',
      cols: ['Player name', 'Jersey no.', 'Matches played', 'Role', 'Runs', 'Batting avg', 'Highest score', 'Wickets', 'Bowling avg'],
      rows: [
        ['Sachin Tendulkar', '10', '463', 'Batsman', '18426', '44.83', '200', '154', '44.48'],
        ['Virat Kohli', '18', '248', 'Batsman', '11867', '59.34', '183', '4', '166.25'],
        ['MS Dhoni', '7', '350', 'Batsman, WK', '10773', '50.58', '183', '1', '31'],
        ['Gambhir', '5', '147', 'Batsman', '5238', '39.68', '150', '0', '0'],
        ['Yuvraj', '12', '304', 'All-rounder', '8701', '36.56', '150', '111', '45.48'],
        ['R Jadeja', '8', '165', 'All-rounder', '2296', '31.89', '87', '187', '44.8'],
        ['Zaheer Khan', '34', '200', 'Bowler', '792', '12', '34', '282', '29.4'],
        ['Bumrah', '93', '64', 'Bowler', '39', '3.7', '10', '104', '24.43'],
        ['Robin Uthappa', '6', '46', 'Batsman', '934', '25.94', '86', '----', '-----'],
      ],
    },
    {
      key: 'fees', focus: 'c2', label: 'Fees paid: a column that does not vary (lecture W1_L2)',
      source: 'Lecture W1_L2 (understanding data), at 17:26: a B.Sc. Computer Science class where everyone pays the same fee, INR 30000, so fees paid does not vary and is not a variable, while the marks do vary (75, 83, 92, 66).',
      cols: ['Name', 'Fees paid (INR)', 'Marks (out of 100)'],
      rows: [['Anjali', '30000', '75'], ['Bernard', '30000', '83'], ['Callum', '30000', '92'], ['Deepak', '30000', '66']],
    },
    {
      key: 'codes', focus: 'c1', label: 'Numbers that are labels, ranks, years, GPA',
      source: 'made up for this lab: roll numbers and PIN codes are numbers used as names (nominal, like jersey numbers in W1_L4 at 06:17), a rank and a star rating only give an order (ordinal), a year of birth and a GPA have no true zero (interval; GPA in W1_L4 at 18:16), and age has one (ratio, W1_L4 at 17:45).',
      cols: ['Roll number', 'PIN code', 'Rank in class', 'Rating (1–5 stars)', 'Year of birth', 'GPA (out of 10)', 'Age (years)'],
      rows: [
        ['1001', '600036', '3', '4', '2005', '8.2', '21'],
        ['1002', '110016', '1', '5', '2004', '9.1', '22'],
        ['1003', '400076', '6', '2', '2006', '7.4', '20'],
        ['1004', '560012', '2', '5', '2005', '8.8', '21'],
        ['1005', '721302', '5', '3', '2003', '6.9', '23'],
        ['1006', '208016', '4', '4', '2006', '7.9', '20'],
      ],
    },
    {
      key: 'feedback', focus: 'c4', label: 'Course feedback with free-text comments',
      source: 'made up for this lab. The comment column is unstructured data (course notes, Week 1: text and comments; W1_L2 at 02:17: comments are data too); the other columns are structured.',
      cols: ['Student', 'Rating', 'Hours studied per week', 'Comment'],
      rows: [
        ['S1', 'good', '6.5', 'The lectures were clear but the weekly assignments took far too long'],
        ['S2', 'excellent', '9', 'Loved the worked examples on frequency tables and pie charts'],
        ['S3', 'poor', '2', 'I could not follow the probability part without more practice questions'],
        ['S4', 'average', '4.5', 'Good pace overall, though some slides had small typing mistakes'],
        ['S5', 'good', '7', 'More live sessions before the quiz would really help students like me'],
      ],
    },
    {
      key: 'empty', label: 'Empty table: 3 cases × 3 variables',
      source: 'an empty table: name your variables (columns) and type the values for each case (row).',
      cols: ['Variable 1', 'Variable 2', 'Variable 3'],
      rows: [['', '', ''], ['', '', ''], ['', '', '']],
    },
  ];
  const POP_DEFAULT = '18426, 11867, 10773, 9115, 8273, 5238, 8701, 2296, 792, 1237, 39, 145, 675, 118, 5, 951, 1389, 1752, 934';
  const POP_SOURCE = 'runs of all 19 players in the lecture’s “players data odi” sheet (W1_L2 at 22:24). W1_L1 at 10:25 calls that table itself a sample of Indian cricketing data: what counts as the population depends on the question';
  const POP_MADE = '72, 91, 38, 65, 88, 70, 45, 59, 81, 67, 54, 76, 62, 49, 85, 58, 73, 66, 94, 41';
  const POP_MADE_SRC = 'marks of all 20 students of one class — made up for this lab';
  const TS = [
    {
      key: 'potato', label: 'Potatoes procured (W1_L3)', name: 'Potatoes procured (kg)', unit: 'kg', only: 'time',
      time: { labels: '01-Mar, 02-Mar, 03-Mar, 04-Mar, 05-Mar, 06-Mar, 08-Mar, 09-Mar, 10-Mar, 11-Mar, 12-Mar, 13-Mar, 15-Mar, 16-Mar, 17-Mar, 18-Mar, 19-Mar, 20-Mar, 22-Mar, 23-Mar, 24-Mar, 25-Mar, 26-Mar, 27-Mar, 29-Mar, 30-Mar', values: '0, 1350, 675, 0, 675, 675, 20, 900, 900, 0, 900, 1125, 1125, 1125, 1125, 1125, 1125, 675, 675, 0, 0, 675, 675, 1125, 540, 0', who: 'at one retail outlet, 1–30 March' },
      source: 'Lecture W1_L3 (classification of data), at 11:40: the time-series example — the quantity of potatoes (kg) a retail outlet procured each day, as on the slide (the sheet has no rows for 7, 14, 21 and 28 March).',
    },
    {
      key: 'temp', label: 'Temperature', name: 'Maximum temperature (°C)', unit: '°C',
      cross: { labels: 'Chennai, Delhi, Mumbai, Kolkata, Bengaluru, Shimla', values: '33, 34, 31, 32, 28, 18', when: 'on 1 October' },
      time: { labels: '1 Oct, 2 Oct, 3 Oct, 4 Oct, 5 Oct, 6 Oct, 7 Oct, 8 Oct, 9 Oct, 10 Oct', values: '33, 34, 32, 31, 33, 35, 34, 32, 30, 31', who: 'in Chennai' },
      source: 'made-up values (the course notes give daily temperature as a time-series example). Chennai on 1 October is 33 °C in both views.',
    },
    {
      key: 'kwh', label: 'Electricity (kWh)', name: 'Electricity used (kWh)', unit: 'kWh',
      cross: { labels: 'Home 1, Home 2, Home 3, Home 4, Home 5', values: '240, 310, 185, 275, 220', when: 'in October' },
      time: { labels: 'Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec', values: '210, 195, 230, 280, 330, 350, 310, 290, 270, 240, 215, 205', who: 'by Home 1' },
      source: 'made-up values (the course notes give monthly kWh as a time-series example). Home 1 in October is 240 kWh in both views.',
    },
    {
      key: 'cases', label: 'District case counts', name: 'New cases reported', unit: 'cases',
      cross: { labels: 'District A, District B, District C, District D, District E', values: '120, 85, 240, 60, 150', when: 'on one day' },
      time: { labels: 'Day 1, Day 2, Day 3, Day 4, Day 5, Day 6, Day 7, Day 8', values: '120, 132, 150, 141, 168, 190, 176, 205', who: 'in District A' },
      source: 'made-up numbers in the shape of the course example (district COVID counts on 1 Mar 2021 are cross-sectional). District A on day 1 is 120 in both views.',
    },
  ];

  const DEF = () => ({
    v: VERSION, preset: 'class', focus: null, showAll: false, ch: {}, reveal: {},
    nom: {}, ord: {}, tU: 'C', tA: '40', tB: '20', hA: '180', hB: '90',
    pop: POP_DEFAULT, popSrc: POP_SOURCE, n: 5, seed: 20261014, many: 0,
    ts: { key: 'temp', mode: 'time', sort: false, name: TS[1].name, unit: TS[1].unit, cross: Object.assign({}, TS[1].cross), time: Object.assign({}, TS[1].time) },
  });
  function tableFrom(ds) {
    const cols = ds.cols.map((name, j) => ({ id: 'c' + (j + 1), name }));
    return { cols, rows: ds.rows.map(r => r.slice()), nextId: cols.length + 1 };
  }

  /* ====================================================================
     Charts (drawn at the real width of their box, so text stays 12 px)
     ==================================================================== */
  function niceTicks(lo, hi, count = 5) {
    if (!(hi > lo)) { hi = lo + 1; }
    const span = hi - lo, raw = span / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => span / s <= count) || 10 * mag;
    const a = Math.floor(lo / step + 1e-9) * step, b = Math.ceil(hi / step - 1e-9) * step;
    const ticks = [];
    for (let v = a; v <= b + step / 2; v += step) ticks.push(+v.toFixed(10));
    return { lo: a, hi: b, ticks };
  }
  const tickTxt = v => minus(Lab.fmtDec(v, 4));
  const short = (s, k = 14) => (s.length > k ? s.slice(0, k - 1) + '…' : s);
  /** Bar top with a 4 px rounded data end; square at the baseline. */
  function barPath(x, w, y0, y1) {
    const up = y1 <= y0, hgt = Math.abs(y0 - y1), r = Math.min(4, w / 2, hgt);
    if (hgt < 0.5) return 'M' + x + ',' + y0 + 'h' + w;
    return up
      ? 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z'
      : 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
  }
  /** x-axis labels: horizontal when they fit, else turned 40°. Returns the bottom margin needed. */
  /** Horizontal labels when the longest fits its band (no cutting); otherwise turned 40° and cut to 14 characters. */
  function xLabelPlan(labels, band) {
    const longest = Math.max(1, ...labels.map(s => s.length));
    const turn = longest * 6.6 > band - 6;
    return { turn, cut: turn ? 14 : 99, mb: turn ? Math.round(26 + Math.min(14, longest) * 4.6) : 30 };
  }
  function axisY(s, W, ml, mr, nt, Y) {
    nt.ticks.forEach(v => {
      s.appendChild(svg('line', { x1: ml, x2: W - mr, y1: Y(v), y2: Y(v), class: v === 0 ? 's1d-base' : 's1d-grid' }));
      s.appendChild(svg('text', { x: ml - 7, y: Y(v) + 4, 'text-anchor': 'end', class: 's1d-tick' }, tickTxt(v)));
    });
  }
  function xLabels(s, items, X, yTop, plan, every = 1) {
    items.forEach((it, i) => {
      if (i % every) return;
      const t = svg('text', plan.turn
        ? { x: X(i), y: yTop + 12, 'text-anchor': 'end', transform: 'rotate(-40 ' + X(i) + ' ' + (yTop + 12) + ')', class: 's1d-tick s1d-xl' }
        : { x: X(i), y: yTop + 18, 'text-anchor': 'middle', class: 's1d-tick s1d-xl' }, short(it.label, plan.cut));
      s.appendChild(t);
    });
  }
  /** Vertical bars for one series, baseline at 0. items: [{label, v (number), txt, title}] */
  function barChart(W, items, opts = {}) {
    const vals = items.map(it => it.v);
    const nt = niceTicks(Math.min(0, ...vals), Math.max(0, ...vals), 5);
    const ml = 48, mr = 10, mt = 22, PH = 190;
    const band = (W - ml - mr) / items.length;
    const plan = xLabelPlan(items.map(it => it.label), band);
    const H = mt + PH + plan.mb;
    const Y = v => mt + ((nt.hi - v) / (nt.hi - nt.lo)) * PH;
    const X = i => ml + band * (i + 0.5);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 's1d-svg', role: 'img', 'aria-label': opts.aria || 'bar chart' });
    axisY(s, W, ml, mr, nt, Y);
    const bw = Math.max(6, Math.min(24, band * 0.62));
    items.forEach((it, i) => {
      const g = svg('g', { class: 's1d-mark' });
      g.appendChild(svg('title', {}, it.title || it.label + ': ' + it.txt));
      g.appendChild(svg('rect', { x: X(i) - band / 2, y: mt, width: band, height: PH, class: 's1d-hit' }));
      g.appendChild(svg('path', { d: barPath(X(i) - bw / 2, bw, Y(0), Y(it.v)), class: 's1d-bar' }));
      if (band >= 26) g.appendChild(svg('text', { x: X(i), y: it.v >= 0 ? Y(it.v) - 6 : Y(it.v) + 14, 'text-anchor': 'middle', class: 's1d-val' }, it.txt));
      s.appendChild(g);
    });
    xLabels(s, items, X, mt + PH, plan);
    return s;
  }
  /** Timeplot: one series joined in the order given (chronological). */
  function lineChart(W, items, opts = {}) {
    const vals = items.map(it => it.v);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = hi > lo ? (hi - lo) * 0.08 : Math.max(1, Math.abs(hi) * 0.1);
    // never pad a non-negative series below 0 (a quantity of −500 kg would be nonsense on the axis)
    const nt = niceTicks(lo >= 0 ? Math.max(0, lo - pad) : lo - pad, hi + pad, 5);
    const ml = 48, mr = 14, mt = 22, PH = 190;
    const band = (W - ml - mr) / items.length;
    const plan = xLabelPlan(items.map(it => it.label), Math.max(band, 1));
    const every = plan.turn && band < 16 ? Math.ceil(16 / band) : 1;
    const H = mt + PH + plan.mb;
    const Y = v => mt + ((nt.hi - v) / (nt.hi - nt.lo)) * PH;
    const X = i => ml + band * (i + 0.5);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 's1d-svg', role: 'img', 'aria-label': opts.aria || 'timeplot' });
    axisY(s, W, ml, mr, nt, Y);
    s.appendChild(svg('path', { d: items.map((it, i) => (i ? 'L' : 'M') + X(i).toFixed(1) + ',' + Y(it.v).toFixed(1)).join(' '), class: 's1d-line' + (opts.wrong ? ' wrong' : '') }));
    items.forEach((it, i) => {
      const g = svg('g', { class: 's1d-mark' });
      g.appendChild(svg('title', {}, it.title || it.label + ': ' + it.txt));
      g.appendChild(svg('rect', { x: X(i) - band / 2, y: mt, width: band, height: PH, class: 's1d-hit' }));
      g.appendChild(svg('circle', { cx: X(i), cy: Y(it.v), r: 4.5, class: 's1d-pt' }));
      if (band >= 30 || items.length <= 12) g.appendChild(svg('text', { x: X(i), y: Y(it.v) - 9, 'text-anchor': 'middle', class: 's1d-val' + (band < 30 ? ' tiny' : '') }, it.txt));
      s.appendChild(g);
    });
    xLabels(s, items, X, mt + PH, plan, every);
    return s;
  }
  /** Sample means as dots on a number line, with μ marked. */
  function stripChart(W, pop, means, mu) {
    const lo = Math.min(...pop), hi = Math.max(...pop);
    const nt = niceTicks(lo, hi, 6);
    const ml = 16, mr = 16, H = 132, axisY0 = 96;
    const X = v => ml + ((v - nt.lo) / (nt.hi - nt.lo)) * (W - ml - mr);
    const s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, class: 's1d-svg', role: 'img', 'aria-label': 'sample means on a number line' });
    s.appendChild(svg('line', { x1: ml, x2: W - mr, y1: axisY0, y2: axisY0, class: 's1d-base' }));
    nt.ticks.forEach(v => {
      s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: axisY0, y2: axisY0 + 5, class: 's1d-base' }));
      s.appendChild(svg('text', { x: X(v), y: axisY0 + 19, 'text-anchor': 'middle', class: 's1d-tick' }, tickTxt(v)));
    });
    pop.forEach(v => s.appendChild(svg('line', { x1: X(v), x2: X(v), y1: axisY0 - 6, y2: axisY0, class: 's1d-poptick' })));
    s.appendChild(svg('line', { x1: X(mu), x2: X(mu), y1: 12, y2: axisY0, class: 's1d-mu' }));
    s.appendChild(svg('text', { x: X(mu), y: 9, 'text-anchor': 'middle', class: 's1d-mulab' }, 'μ = ' + Lab.fmtDec(mu, 4)));
    means.forEach((m, k) => {
      const jit = 20 + ((k * 37) % 61);
      const c = svg('circle', { cx: X(m), cy: jit, r: 4, class: 's1d-mdot' });
      c.appendChild(svg('title', {}, 'sample ' + (k + 1) + ': x̄ = ' + Lab.fmtDec(m, 4)));
      s.appendChild(c);
    });
    return s;
  }
  /** Draw an SVG at the box's real width; the lab redraws every such box on resize. */
  function fit(host, draw) {
    host.classList.add('s1d-fit');
    host._draw = draw;
    paintFit(host);
  }
  function paintFit(host) {
    const w = host.clientWidth; // layout px: stays right when the page is zoomed with CSS zoom
    const W = Math.round(Math.max(280, Math.min(1100, w || 640)));
    Lab.clear(host);
    host.appendChild(host._draw(W));
  }

  /* ====================================================================
     The lab
     ==================================================================== */
  function dataLab(host) {
    if (host.s1dOff) host.s1dOff();
    let st = Object.assign(DEF(), Lab.store.get(KEY, {}));
    if (st.v !== VERSION || !st.table || !Array.isArray(st.table.cols)) { st = Object.assign(DEF(), { table: tableFrom(DATASETS[0]), focus: DATASETS[0].focus }); }
    const save = () => Lab.store.set(KEY, st);
    const ctl = {}, P = {}, refs = { badge: {}, card: {} };
    let D = { cols: [] };
    const { side, main } = K.layout(host, 's1w1');
    host.classList.add('s1d-lab');
    const onResize = Lab.debounce(() => {
      if (!host.isConnected) { window.removeEventListener('resize', onResize); return; }
      Lab.$$('.s1d-fit', host).forEach(paintFit);
    }, 180);
    window.addEventListener('resize', onResize);
    host.s1dOff = () => window.removeEventListener('resize', onResize);
    if (Lab.onCleanup) Lab.onCleanup(host.s1dOff);

    /* ---------------- controls column */
    side.appendChild(K.group('1 · Your dataset'));
    ctl.presets = K.presets({ label: 'Examples', items: DATASETS, onPick: it => loadDataset(it) });
    side.appendChild(ctl.presets);
    /** Keep the menu on the loaded example and say where its values come from. */
    function showSource() {
      const i = DATASETS.findIndex(d => d.key === st.preset);
      if (i < 0) return;
      ctl.presets.select.value = String(i);
      Lab.setHTML(ctl.presets.lastChild, 'From: ' + DATASETS[i].source + (st.edited ? ' <b>You have edited the table since.</b>' : ''));
    }
    side.appendChild(K.note('Type in any cell of the table: each <b>row</b> is a case, each <b>column</b> a variable. Rename a variable in its header. Use the buttons under the table to add rows and columns.'));
    side.appendChild(K.group('2 · Variable in focus'));
    ctl.focus = K.selectField({ label: 'The answer box and the “allowed” table follow this variable', options: [], value: '', onChange: v => setFocus(v) });
    side.appendChild(ctl.focus);
    ctl.showAll = K.toggle({ label: 'Show the lab’s answers before I choose', value: st.showAll, onChange: v => { st.showAll = v; save(); drawCards(); updateBadges(); } });
    side.appendChild(ctl.showAll);
    side.appendChild(K.note('Off: classify each variable yourself first, then press “Show the lab’s answer” on its card.'));
    side.appendChild(K.group('3 · Go to'));
    const nav = h('div', { class: 'pl-chips s1d-nav' });
    side.appendChild(nav);
    side.appendChild(h('div', { class: 'pl-reset' }, Lab.button(Lab.icon('refresh') + '<span>Start again</span>', () => {
      Lab.store.set(KEY, {});
      dataLab(host);
    }, 'btn ghost sm')));

    /* ---------------- panels */
    P.answer = K.answer();
    P.table = K.panel('Your dataset: cases and variables', 'A <b>case</b> (observation) is one unit the data are collected from — one row. A <b>variable</b> is a characteristic that varies across cases — one column (course notes, Week 1).');
    P.cards = K.panel('Classify each variable', 'For every column choose: categorical or numerical; for numerical, discrete (counts) or continuous (measurements); and the scale of measurement. The lab checks each choice and says why.');
    P.scales = K.panel('What each scale allows', 'Nominal: identity only. Ordinal: order. Interval: + and −, arbitrary zero. Ratio: +, −, ×, ÷ with a true zero (course notes, Week 1). The demonstrations below use your table.');
    P.pop = K.panel('Population and sample', 'Population = the whole collection of elements of interest, size ' + tx('N') + '. Sample = a subgroup studied in detail, size ' + tx('n') + ' (course notes, Week 1).');
    P.time = K.panel('Cross-sectional or time-series', 'Cross-sectional: several cases at <b>one</b> time. Time-series: the <b>same</b> variable over time; a timeplot graphs it in chronological order (course notes, Week 1).');
    main.append(P.answer, P.table, P.cards, P.scales, P.pop, P.time);
    [['Dataset', P.table], ['Classify', P.cards], ['Allowed per scale', P.scales], ['Population & sample', P.pop], ['Cross-section & time', P.time]]
      .forEach(([t, p]) => nav.appendChild(Lab.button(t, () => p.scrollIntoView({ behavior: Lab.reducedMotion() ? 'auto' : 'smooth', block: 'start' }), 'btn xs')));

    /* ---------------- dataset */
    function loadDataset(ds) {
      st.table = tableFrom(ds);
      st.preset = ds.key;
      st.ch = {}; st.reveal = {}; st.focus = ds.focus || null; st.nom = {}; st.ord = {}; st.edited = false;
      if (ds.key === 'class') { st.tA = '40'; st.tB = '20'; st.hA = '180'; st.hB = '90'; }
      save();
      afterStructure();
    }
    function afterStructure() { buildTable(); refresh(); }
    const soon = Lab.debounce(() => { st.edited = true; save(); refresh(); }, 160);
    function analyseAll() {
      D = { cols: st.table.cols.map((c, j) => Object.assign({ id: c.id, idx: j }, { A: analyse(c.name, st.table.rows.map(r => r[j])) })) };
    }
    function colById(id) { return D.cols.find(c => c.id === id); }
    function focusCol() {
      let c = colById(st.focus);
      if (!c) { c = D.cols.find(x => x.A.sug && x.A.sug.kind !== 'text') || D.cols[0]; st.focus = c ? c.id : null; }
      return c;
    }
    function setFocus(id) {
      st.focus = id; save();
      Lab.$$('.s1d-h, .s1d-table td', P.table.body).forEach(el => el.classList.toggle('focus', el.dataset.col === id));
      Lab.$$('.s1d-hfoc', P.table.body).forEach(b => b.classList.toggle('on', b.dataset.col === id));
      ctl.focus.select.value = id;
      drawAnswer(); drawCards(); drawMatrix();
    }
    function refresh() {
      analyseAll();
      const fc = focusCol();
      const sel = ctl.focus.select;
      Lab.clear(sel);
      D.cols.forEach((c, j) => sel.appendChild(h('option', { value: c.id, text: (j + 1) + '. ' + (c.A.name.trim() || 'Variable ' + (j + 1)) })));
      if (fc) sel.value = fc.id;
      drawAnswer(); drawInfo(); updateBadges(); drawCards(); drawScales(); drawPop(); showSource(); expose();
    }

    function buildTable() {
      const body = P.table.body;
      Lab.clear(body);
      refs.badge = {};
      const T = st.table;
      const t = h('table', { class: 's1d-table' });
      const hr = h('tr', {}, h('th', { class: 's1d-corner', text: 'Case' }));
      T.cols.forEach((c, j) => {
        const name = h('input', { class: 'field s1d-hname', value: c.name, spellcheck: 'false', autocomplete: 'off', size: Math.min(30, Math.max(9, c.name.length + 1)), 'aria-label': 'Name of variable ' + (j + 1) });
        name.addEventListener('input', () => { c.name = name.value; name.size = Math.min(30, Math.max(9, name.value.length + 1)); soon(); });
        const foc = h('button', { type: 'button', class: 's1d-hfoc' + (st.focus === c.id ? ' on' : ''), title: 'Put this variable in focus', 'aria-label': 'Put variable ' + (j + 1) + ' in focus', html: Lab.icon('target'), dataset: { col: c.id } });
        foc.addEventListener('click', () => setFocus(c.id));
        const del = h('button', { type: 'button', class: 's1d-hdel', title: 'Remove this variable (column)', 'aria-label': 'Remove variable ' + (j + 1), html: Lab.icon('x') });
        del.addEventListener('click', () => { if (T.cols.length <= 1) return; T.cols.splice(j, 1); T.rows.forEach(r => r.splice(j, 1)); delete st.ch[c.id]; st.edited = true; save(); afterStructure(); });
        const badge = h('div', { class: 's1d-badge' });
        refs.badge[c.id] = badge;
        hr.appendChild(h('th', { class: 's1d-h' + (st.focus === c.id ? ' focus' : ''), dataset: { col: c.id } }, h('div', { class: 's1d-hrow' }, name, foc, del), badge));
      });
      const tb = h('tbody');
      T.rows.forEach((r, i) => {
        const del = h('button', { type: 'button', class: 's1d-rdel', title: 'Remove case ' + (i + 1), 'aria-label': 'Remove case ' + (i + 1), html: Lab.icon('x') });
        del.addEventListener('click', () => { if (T.rows.length <= 1) return; T.rows.splice(i, 1); st.edited = true; save(); afterStructure(); });
        const tr = h('tr', {}, h('th', { class: 's1d-rnum' }, h('span', { text: String(i + 1) }), del));
        T.cols.forEach((c, j) => {
          const inp = h('input', { class: 'field s1d-cell', value: r[j] == null ? '' : r[j], spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Case ' + (i + 1) + ', ' + (c.name || 'variable ' + (j + 1)) });
          inp.addEventListener('input', () => { r[j] = inp.value; soon(); });
          inp.addEventListener('keydown', e => {
            if (e.key !== 'Enter') return;
            e.preventDefault();
            const next = Lab.$$('.s1d-cell', tb)[(i + 1) * T.cols.length + j];
            if (next) next.focus();
          });
          tr.appendChild(h('td', { class: st.focus === c.id ? 'focus' : '', dataset: { col: c.id } }, inp));
        });
        tb.appendChild(tr);
      });
      t.append(h('thead', {}, hr), tb);
      const tools = h('div', { class: 'btn-row' },
        Lab.button('+ case (row)', () => { if (T.rows.length >= MAX_ROWS) return; T.rows.push(T.cols.map(() => '')); st.edited = true; save(); afterStructure(); Lab.$$('.s1d-table tbody tr:last-child .s1d-cell', P.table.body)[0]?.focus(); }, 'btn xs'),
        Lab.button('+ variable (column)', () => { if (T.cols.length >= MAX_COLS) return; T.cols.push({ id: 'c' + T.nextId++, name: 'Variable ' + (T.cols.length + 1) }); T.rows.forEach(r => r.push('')); st.edited = true; save(); afterStructure(); }, 'btn xs'));
      P.tableInfo = h('div', { class: 's1d-info' });
      body.append(h('div', { class: 's1d-tw' }, t), tools, P.tableInfo);
    }
    function drawInfo() {
      const T = st.table, nR = T.rows.length, nC = T.cols.length;
      const blanks = D.cols.reduce((a, c) => a + c.A.blanks + c.A.na, 0), naCells = D.cols.reduce((a, c) => a + c.A.na, 0), cells = nR * nC;
      const text = D.cols.filter(c => c.A.sug && c.A.sug.kind === 'text');
      Lab.setHTML(P.tableInfo,
        '<p>Your table: ' + tx('n=' + nR) + ' case' + (nR === 1 ? '' : 's') + ' (rows) and ' + tx('k=' + nC) + ' variable' + (nC === 1 ? '' : 's') + ' (columns), so ' + tx(nR + '\\times ' + nC + '=' + cells) + ' cells' +
        (blanks ? '; ' + plural(blanks, 'cell') + ' ' + (blanks === 1 ? 'is' : 'are') + ' blank or marked not available, so ' + tx(cells + '-' + blanks + '=' + (cells - blanks)) + ' values are filled in.' + (naCells ? ' “Not available” (such as ----) is not the same as 0: Gambhir took 0 wickets after bowling, Uthappa never bowled (W1_L2 at 24:17).' : '') : ', all filled in.') +
        (nR >= MAX_ROWS ? ' (30 rows is the limit here.)' : '') + (nC >= MAX_COLS ? ' (10 columns is the limit here.)' : '') + '</p>' +
        '<p class="small muted">' + (text.length
          ? 'Structured data sit in rows and columns like this table. But <b>' + text.map(c => esc(c.A.name)).join(', ') + '</b> holds free text — that part is <b>unstructured</b> data (course notes: text, images, audio, video, comments are unstructured).'
          : 'This is <b>structured</b> data: every value sits in one row (a case) and one column (a variable), so it is easy to search and analyse. Text, images, audio, video and comments are <b>unstructured</b> (course notes, Week 1).') + '</p>');
    }
    function chOf(id) { return st.ch[id] || (st.ch[id] = { kind: null, dc: null, scale: null }); }
    function badgeHtml(c) {
      const S = c.A.sug, ch = st.ch[c.id];
      if (!S) return '<span class="muted">empty</span>';
      if (S.kind === 'text') return '<span class="s1d-tag text">free text</span>';
      const stt = status(S, ch);
      if (ch && ch.kind) {
        const words = [KIND_W[ch.kind], ch.kind === 'num' && ch.dc ? DC_W[ch.dc] : null, ch.scale ? SC_W[ch.scale] : null].filter(Boolean).join(' · ');
        return '<span class="s1d-tag ' + stt + '">' + words + (stt === 'ok' ? ' ✓' : stt === 'no' ? ' ✗' : stt === 'maybe' ? ' ?' : '') + '</span>';
      }
      if (st.showAll || st.reveal[c.id]) return '<span class="s1d-tag lab">lab: ' + KIND_W[S.kind] + ' · ' + SC_W[S.scale] + '</span>';
      return '<span class="muted">not classified yet</span>';
    }
    function updateBadges() { D.cols.forEach(c => { const b = refs.badge[c.id]; if (b) b.innerHTML = badgeHtml(c); }); }

    /* ---------------- answer box: the variable in focus */
    function valuesLine(A) {
      if (!A.n) return 'no values yet';
      const more = A.distinct.length - 6;
      const shown = A.distinct.slice(0, 6).map(v => '<b>' + esc(v) + '</b>').join(', ') + (more > 0 ? ' and ' + more + ' more' : '');
      if (A.allNum) return plural(A.n, 'value') + ', all numbers, from ' + tx(vTex(A.min)) + ' to ' + tx(vTex(A.max)) + (A.decimals ? ' (' + A.decimals + ' with decimals)' : '');
      return plural(A.n, 'value') + ', ' + plural(A.distinct.length, 'different value') + ': ' + shown;
    }
    function drawAnswer() {
      const c = focusCol();
      if (!c) { K.setAnswer(P.answer, { ev: 'Add a variable (column) to the table.' }); return; }
      const A = c.A, S = A.sug, k = D.cols.length;
      const ev = 'Variable in focus: <b>' + esc(A.name || 'Variable ' + (c.idx + 1)) + '</b> (column ' + (c.idx + 1) + ' of ' + k + ') — ' + valuesLine(A) + (missingTxt(A) ? '; ' + missingTxt(A) + ' left out' : '') + '.';
      if (!S) { K.setAnswer(P.answer, { ev, sub: 'Type some values in this column and the lab will classify it.' }); return; }
      if (S.kind === 'text') { K.setAnswer(P.answer, { ev, big: '\\text{free text: unstructured}', sub: cap(S.why) }); return; }
      const big = '\\text{' + KIND_W[S.kind] + (S.kind === 'num' ? ', ' + DC_W[S.dc] : '') + '}\\;\\to\\;\\text{' + SC_W[S.scale] + '}';
      const yes = OPS.filter(o => o.ok.includes(S.scale)).map(o => o.label.toLowerCase());
      const no = OPS.filter(o => !o.ok.includes(S.scale)).map(o => o.label.toLowerCase());
      const ch = st.ch[c.id], stt = status(S, ch);
      const mine = ch && ch.kind ? ' <b>Your answer</b>: ' + [KIND_W[ch.kind], ch.kind === 'num' && ch.dc ? DC_W[ch.dc] : null, ch.scale ? SC_W[ch.scale] : null].filter(Boolean).join(', ') +
        (stt === 'ok' ? ' <span class="cgood">✓ matches</span>' : stt === 'no' ? ' <span class="cbad">✗ see its card</span>' : stt === 'maybe' ? ' <span class="s1d-maybe">? arguable — see its card</span>' : ' (not finished)') + '.' : '';
      const hidden = !(st.showAll || st.reveal[c.id]) && !(ch && stt !== 'none');
      if (hidden) {
        K.setAnswer(P.answer, { ev, sub: 'Classify this variable on its card below (or switch on “Show the lab’s answers”) to see the lab’s verdict and what its scale allows.' + mine });
        return;
      }
      K.setAnswer(P.answer, {
        ev, big,
        sub: '<b>Why</b>: ' + (S.kind === 'num' ? S.kindWhy + ' ' + cap(S.dcWhy) + ' ' : S.kindWhy + ' ') + cap(S.scaleWhy) + (S.constNote || S.note ? '<br>' + [S.constNote, S.note].filter(Boolean).join(' ') : '') +
          '<br><b>Allowed</b> on a ' + SC_W[S.scale] + ' scale: ' + yes.join('; ') + '.' + (no.length ? ' <b>Not allowed</b>: ' + no.join('; ') + '.' : '') + mine,
      });
    }

    /* ---------------- classification cards */
    function drawCards() {
      const body = P.cards.body;
      Lab.clear(body);
      const usable = D.cols.filter(c => c.A.sug && c.A.sug.kind !== 'text');
      const done = usable.filter(c => status(c.A.sug, st.ch[c.id]) !== 'none');
      const right = done.filter(c => status(c.A.sug, st.ch[c.id]) === 'ok').length, arguable = done.filter(c => status(c.A.sug, st.ch[c.id]) === 'maybe').length;
      P.cardsSum = h('p', { class: 's1d-score' });
      Lab.setHTML(P.cardsSum, 'You have fully classified <b>' + done.length + '</b> of the <b>' + usable.length + '</b> variables that can be classified' +
        (done.length ? ': ' + right + ' match the lab' + (arguable ? ', ' + arguable + ' arguable' : '') + ', ' + (done.length - right - arguable) + ' to look at again.' : '.'));
      const grid = h('div', { class: 's1d-cards' });
      D.cols.forEach(c => { const el = card(c); refs.card[c.id] = el; grid.appendChild(el); });
      body.append(P.cardsSum, grid);
    }
    function redrawCard(c) {
      const old = refs.card[c.id];
      const el = card(c);
      refs.card[c.id] = el;
      if (old && old.parentNode) old.replaceWith(el);
      const usable = D.cols.filter(x => x.A.sug && x.A.sug.kind !== 'text');
      const done = usable.filter(x => status(x.A.sug, st.ch[x.id]) !== 'none');
      const right = done.filter(x => status(x.A.sug, st.ch[x.id]) === 'ok').length, arguable = done.filter(x => status(x.A.sug, st.ch[x.id]) === 'maybe').length;
      Lab.setHTML(P.cardsSum, 'You have fully classified <b>' + done.length + '</b> of the <b>' + usable.length + '</b> variables that can be classified' +
        (done.length ? ': ' + right + ' match the lab' + (arguable ? ', ' + arguable + ' arguable' : '') + ', ' + (done.length - right - arguable) + ' to look at again.' : '.'));
    }
    function card(c) {
      const A = c.A, S = A.sug;
      const el = h('div', { class: 's1d-card' + (st.focus === c.id ? ' focus' : ''), dataset: { col: c.id } });
      const foc = Lab.button(Lab.icon('target') + '<span>Focus</span>', () => setFocus(c.id), 'btn xs ghost');
      el.appendChild(h('div', { class: 's1d-chead' }, h('b', { text: (c.idx + 1) + '. ' + (A.name.trim() || 'Variable ' + (c.idx + 1)) }), foc));
      el.appendChild(K.note(valuesLine(A) + (missingTxt(A) ? ' · ' + missingTxt(A) : ''), 's1d-cvals'));
      if (S && (S.constNote || S.note)) el.appendChild(K.note([S.constNote, S.note].filter(Boolean).join(' '), 's1d-chk maybe'));
      if (!S) { el.appendChild(K.note('Empty: type some values in this column.', 'small muted')); return el; }
      if (S.kind === 'text') { el.appendChild(K.note(cap(S.why), 's1d-chk text')); return el; }
      const ch = chOf(c.id);
      const pick = (field, v) => { ch[field] = v; if (field === 'kind' && v === 'cat') ch.dc = null; save(); redrawCard(c); updateBadges(); if (st.focus === c.id) { drawAnswer(); drawMatrix(); } expose(); };
      const q = (label, items, value, field) => h('div', { class: 's1d-q' }, h('div', { class: 's1d-ql', text: label }), Lab.seg(items, value, v => pick(field, v)));
      el.appendChild(q('Categorical or numerical?', [{ label: 'Categorical', value: 'cat' }, { label: 'Numerical', value: 'num' }], ch.kind, 'kind'));
      if (ch.kind === 'num') el.appendChild(q('Discrete (counts) or continuous (measurements)?', [{ label: 'Discrete', value: 'disc' }, { label: 'Continuous', value: 'cont' }], ch.dc, 'dc'));
      el.appendChild(q('Scale of measurement?', [{ label: 'Nominal', value: 'nom' }, { label: 'Ordinal', value: 'ord' }, { label: 'Interval', value: 'int' }, { label: 'Ratio', value: 'rat' }], ch.scale, 'scale'));
      const cs = checks(S, ch);
      if (cs.length) el.appendChild(h('div', { class: 's1d-chks' }, cs.map(x => K.note(x.html, 's1d-chk ' + x.cls))));
      if (st.showAll || st.reveal[c.id]) {
        el.appendChild(K.note('<b>The lab:</b> ' + KIND_W[S.kind] + (S.kind === 'num' ? ', ' + DC_W[S.dc] : '') + ', ' + SC_W[S.scale] + '. ' +
          cap(S.kindWhy) + (S.kind === 'num' ? ' ' + cap(S.dcWhy) : '') + ' ' + cap(S.scaleWhy) + (S.kindSure && S.scaleSure && (S.kind !== 'num' || S.dcSure) ? '' : ' <span class="muted">(Parts marked “likely” in the rules can be argued either way.)</span>'), 's1d-labans'));
      } else {
        el.appendChild(h('div', { class: 'btn-row' }, Lab.button('Show the lab’s answer', () => { st.reveal[c.id] = true; save(); redrawCard(c); updateBadges(); if (st.focus === c.id) { drawAnswer(); drawMatrix(); } }, 'btn xs')));
      }
      return el;
    }

    /* ---------------- what each scale allows + demonstrations */
    function drawScales() {
      const body = P.scales.body;
      Lab.clear(body);
      P.matrix = h('div', {});
      P.demoNom = h('div', { class: 's1d-demo' });
      P.demoOrd = h('div', { class: 's1d-demo' });
      P.demoInt = h('div', { class: 's1d-demo' });
      P.demoRat = h('div', { class: 's1d-demo' });
      body.append(P.matrix, P.demoNom, P.demoOrd, P.demoInt, P.demoRat);
      drawMatrix(); demoNominal(); demoOrdinal(); demoInterval(); demoRatio();
    }
    function drawMatrix() {
      if (!P.matrix) return;
      const c = focusCol(), S = c && c.A.sug;
      const shown = S && S.kind !== 'text' && (st.showAll || st.reveal[c.id] || status(S, st.ch[c.id]) !== 'none');
      const hi = shown ? S.scale : null;
      const scales = ['nom', 'ord', 'int', 'rat'];
      const t = h('table', { class: 'tbl s1d-matrix' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Operation' }), scales.map(s => h('th', { class: s === hi ? 'hl' : '', html: '<span class="s1d-full">' + cap(SC_W[s]) + '</span><span class="s1d-abbr">' + { nom: 'Nom.', ord: 'Ord.', int: 'Int.', rat: 'Ratio' }[s] + '</span>' })))));
      const tb = h('tbody');
      OPS.forEach(o => tb.appendChild(h('tr', {}, h('td', { class: 'l', text: o.label }), scales.map(s => h('td', { class: (s === hi ? 'hl ' : '') + (o.ok.includes(s) ? 'yes' : 'no'), title: (o.ok.includes(s) ? 'Allowed: ' : 'Not allowed: ') + o.why, text: o.ok.includes(s) ? '✓' : '✗' })))));
      t.appendChild(tb);
      Lab.clear(P.matrix);
      P.matrix.appendChild(h('div', { class: 'tbl-wrap' }, t));
      P.matrix.appendChild(K.note(hi ? 'Highlighted: <b>' + SC_W[hi] + '</b>, the lab’s scale for <b>' + esc(c.A.name) + '</b> (the variable in focus). Each scale allows everything the scales to its left allow, and more. Point at a ✓ or ✗ for the reason.'
        : 'Each scale allows everything the scales to its left allow, and more. Classify the variable in focus (or show the lab’s answers) to highlight its column. Point at a ✓ or ✗ for the reason.', 'small muted'));
    }
    const demoHead = (box, title, sub) => { box.appendChild(h('h4', { class: 's1d-dh', text: title })); if (sub) box.appendChild(K.note(sub, 's1d-dsub')); };
    function codeInput(value, aria, onInput) {
      const inp = h('input', { class: 'field mono s1d-code', value, spellcheck: 'false', autocomplete: 'off', inputmode: 'decimal', 'aria-label': aria });
      inp.addEventListener('input', () => onInput(inp));
      return inp;
    }

    /* Nominal: the "average" of codes depends on the coding */
    function demoNominal() {
      const box = P.demoNom;
      Lab.clear(box);
      demoHead(box, 'Nominal: the “average” of codes is meaningless', 'Codes for nominal labels are arbitrary — Men = 1, Women = 2 is as valid as the reverse (course notes); W1_L4 at 04:45–05:16 codes male 0 and female 1, or the reverse, or man 2 and woman 3, or woman 5 and man 7, and calls every one of them valid. Give the same data two codings and compare the two “averages”.');
      const cands = D.cols.filter(c => c.A.sug && c.A.sug.kind === 'cat' && c.A.distinct.length >= 2 && c.A.distinct.length <= 10);
      if (!cands.length) { box.appendChild(K.note('Your table has no categorical column with 2 to 10 different values. Load the class list, or type words such as Male / Female in a column.', 'small muted')); return; }
      let col = cands.find(c => c.id === st.nom.col) || cands.find(c => /gender|sex/.test(norm(c.A.name))) || cands.find(c => c.A.sug.scale === 'nom') || cands[0];
      const cats = col.A.distinct, f = cats.map(v => col.A.counts.get(v)), n = col.A.n, kk = cats.length;
      const saved = st.nom.saved && st.nom.saved[col.id];
      const fresh = !saved || saved.cats.join('\u0001') !== cats.join('\u0001');
      const maleI = kk === 2 ? cats.findIndex(v => /^(m|male|man|men|boy)$/i.test(v.trim())) : -1;
      const notesCode = maleI >= 0;
      const first = notesCode ? cats.map((_, i) => (i === maleI ? '1' : '2')) : cats.map((_, i) => String(i + 1));
      const codes = fresh ? { cats: cats.slice(), a: first, b: first.slice().reverse() } : saved;
      st.nom.saved = Object.assign({}, st.nom.saved, { [col.id]: codes });
      const sel = K.selectField({ label: 'Column', options: cands.map(c => ({ value: c.id, label: c.A.name || 'Variable ' + (c.idx + 1) })), value: col.id, onChange: v => { st.nom.col = v; save(); demoNominal(); } });
      const t = h('table', { class: 'tbl s1d-ctab' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Category' }), h('th', { html: 'count ' + tx('f') }), h('th', { text: 'Coding A' }), h('th', { text: 'Coding B' }))));
      const tb = h('tbody');
      const out = h('div', { class: 's1d-out' });
      cats.forEach((v, i) => tb.appendChild(h('tr', {}, h('td', { class: 'l', html: '<b>' + esc(v) + '</b>' }), h('td', { text: String(f[i]) }),
        h('td', {}, codeInput(codes.a[i], 'Coding A for ' + v, inp => { codes.a[i] = inp.value; save(); calc(); })),
        h('td', {}, codeInput(codes.b[i], 'Coding B for ' + v, inp => { codes.b[i] = inp.value; save(); calc(); })))));
      t.appendChild(tb);
      const btns = h('div', { class: 'pl-chips' },
        Lab.button('B = A reversed', () => { codes.b = codes.a.slice().reverse(); save(); demoNominal(); }, 'btn xs'),
        Lab.button('Shuffle B', () => { const b = codes.a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } codes.b = b; save(); demoNominal(); }, 'btn xs'),
        Lab.button(notesCode ? 'A = course-notes coding' : 'A = 1, 2, 3, …', () => { codes.a = first.slice(); save(); demoNominal(); }, 'btn xs'),
        notesCode ? Lab.button('B: male 0, female 1 (W1_L4)', () => { codes.b = cats.map((_, i) => (i === maleI ? '0' : '1')); save(); demoNominal(); }, 'btn xs') : null,
        notesCode ? Lab.button('B: man 7, woman 5 (W1_L4)', () => { codes.b = cats.map((_, i) => (i === maleI ? '7' : '5')); save(); demoNominal(); }, 'btn xs') : null);
      box.append(h('div', { class: 's1d-ctl' }, cands.length > 1 ? sel : K.note('Column: <b>' + esc(col.A.name) + '</b>', 'small'), h('div', { class: 'tbl-wrap' }, t), btns,
        notesCode ? K.note('Coding A starts as the course-notes coding (' + esc(cats[maleI]) + ' = 1, ' + esc(cats[1 - maleI]) + ' = 2); coding B is its reverse.', 'small muted') : null), out);
      function calc() {
        Lab.$$('.s1d-code', t).forEach(inp => inp.classList.toggle('bad', numOf(inp.value) == null));
        const A = codes.a.map(numOf), B = codes.b.map(numOf);
        if (A.some(x => !x) || B.some(x => !x)) { out.querySelector('.cbad') || out.prepend(K.note('<span class="cbad">Every code must be a number (for example 1, 2 or 0.5). The last good result stays below.</span>', 'small')); return; }
        Lab.clear(out);
        const res = [A, B].map(C => {
          const tot = fsum(C.map((c2, i) => c2.mul(f[i])));
          const mean = tot.div(n);
          const dist = C.map(c2 => Math.abs(Number(c2) - Number(mean)));
          const best = Math.min(...dist);
          const near = cats.filter((_, i) => Math.abs(dist[i] - best) < 1e-12);
          return { C, tot, mean, near, exact: C.some(c2 => c2.eq(mean)) };
        });
        const lines = res.map((r, k) => ({
          html: '<b>Coding ' + 'AB'[k] + '</b>: ' + cats.map((v, i) => esc(v) + ' = ' + vTxt(r.C[i])).join(', ') + '. The “average code” is the sum of all ' + tx('n=' + n) + ' codes divided by ' + tx('n') + ':',
          math: meanTex(f, r.C, r.tot, r.mean, n),
          note: (r.exact ? 'This is exactly the code of ' : 'The nearest code belongs to ') + r.near.map(v => '<b>' + esc(v) + '</b>').join(' and ') + '.',
        }));
        out.appendChild(K.steps(lines));
        const same = res[0].mean.eq(res[1].mean);
        const flip = res[0].near.join('\u0001') !== res[1].near.join('\u0001');
        const modeF = Math.max(...f), modes = cats.filter((_, i) => f[i] === modeF);
        out.appendChild(K.note(same
          ? '<b>Both codings give ' + shortTxt(res[0].mean) + '</b> here — but that is luck of these codes and counts, not a property of the people. Change any one code (say ' + esc(cats[0]) + ' = 5) and the “average” moves while the data stay the same. So the mean of nominal codes is <b>meaningless</b>.'
          : 'Same ' + n + ' cases, two equally valid codings, two different “averages”: ' + shortTxt(res[0].mean) + ' and ' + shortTxt(res[1].mean) + '.' + (flip ? ' Coding A’s average is nearest to <b>' + res[0].near.map(esc).join(', ') + '</b>, coding B’s to <b>' + res[1].near.map(esc).join(', ') + '</b>.' : '') + ' The number describes the coding you chose, not the cases — the mean of nominal codes is <b>meaningless</b>.', 's1d-verdict'));
        const zeroOne = [A, B].findIndex(C => C.every(c2 => c2.isZero() || c2.eq(1)) && C.some(c2 => c2.isZero()) && C.some(c2 => c2.eq(1)));
        if (zeroOne >= 0) out.appendChild(K.note('With codes 0 and 1 (coding ' + 'AB'[zeroOne] + '), the “average” ' + shortTxt(res[zeroOne].mean) + ' is just the share of cases coded 1 — a relative frequency in disguise (Week 2), not an average gender.', 'small muted'));
        out.appendChild(K.note('What <i>is</i> allowed: counting. The mode is <b>' + modes.map(esc).join(' and ') + '</b>, with ' + tx('f=' + modeF) + ' of the ' + tx('n=' + n) + ' cases, under every coding.', 'small'));
        P.exNom = { col: col.A.name, cats, f, codes: [codes.a.slice(), codes.b.slice()], means: res.map(r => r.mean.toString()), near: res.map(r => r.near) };
        expose();
      }
      calc();
    }

    /* Ordinal: the median survives any order-keeping codes; the mean does not */
    function demoOrdinal() {
      const box = P.demoOrd;
      Lab.clear(box);
      demoHead(box, 'Ordinal: order yes, distances no', 'W1_L4 at 08:55: code bad = 1, good = 2, excellent = 3 — but the distance from bad to good need not equal the distance from good to excellent. Code your ordered labels twice, both times keeping the order, and compare the median with the mean.');
      const cands = D.cols.filter(c => c.A.sug && c.A.sug.kind === 'cat' && c.A.sug.scale === 'ord' && c.A.sug.order);
      if (!cands.length) { box.appendChild(K.note('Your table has no column of ordered words that the lab recognises (such as poor / good / excellent or low / medium / high). Load the class list, or type such words in a column.', 'small muted')); return; }
      const col = cands.find(c => c.id === st.ord.col) || cands[0];
      const cats = col.A.sug.order, f = cats.map(v => col.A.counts.get(v)), n = col.A.n, kk = cats.length;
      const saved = st.ord.saved && st.ord.saved[col.id];
      const fresh = !saved || saved.cats.join('\u0001') !== cats.join('\u0001');
      const codes = fresh ? { cats: cats.slice(), a: cats.map((_, i) => String(i + 1)), b: cats.map((_, i) => String(i === kk - 1 ? kk + 7 : i + 1)) } : saved;
      st.ord.saved = Object.assign({}, st.ord.saved, { [col.id]: codes });
      const sel = K.selectField({ label: 'Column', options: cands.map(c => ({ value: c.id, label: c.A.name || 'Variable ' + (c.idx + 1) })), value: col.id, onChange: v => { st.ord.col = v; save(); demoOrdinal(); } });
      const t = h('table', { class: 'tbl s1d-ctab' });
      t.appendChild(h('thead', {}, h('tr', {}, h('th', { class: 'l', text: 'Category (low → high)' }), h('th', { html: 'count ' + tx('f') }), h('th', { text: 'Coding A' }), h('th', { text: 'Coding B' }))));
      const tb = h('tbody');
      const out = h('div', { class: 's1d-out' });
      cats.forEach((v, i) => tb.appendChild(h('tr', {}, h('td', { class: 'l', html: '<b>' + esc(v) + '</b>' }), h('td', { text: String(f[i]) }),
        h('td', {}, codeInput(codes.a[i], 'Coding A for ' + v, inp => { codes.a[i] = inp.value; save(); calc(); })),
        h('td', {}, codeInput(codes.b[i], 'Coding B for ' + v, inp => { codes.b[i] = inp.value; save(); calc(); })))));
      t.appendChild(tb);
      box.append(h('div', { class: 's1d-ctl' }, cands.length > 1 ? sel : K.note('Column: <b>' + esc(col.A.name) + '</b>', 'small'), h('div', { class: 'tbl-wrap' }, t),
        h('div', { class: 'pl-chips' }, Lab.button('Reset the codes', () => { delete st.ord.saved[col.id]; save(); demoOrdinal(); }, 'btn xs'))), out);
      function calc() {
        Lab.$$('.s1d-code', t).forEach(inp => inp.classList.toggle('bad', numOf(inp.value) == null));
        const A = codes.a.map(numOf), B = codes.b.map(numOf);
        if (A.some(x => !x) || B.some(x => !x)) { out.querySelector('.cbad') || out.prepend(K.note('<span class="cbad">Every code must be a number. The last good result stays below.</span>', 'small')); return; }
        const inc = C => C.every((c2, i) => i === 0 || Number(c2) > Number(C[i - 1]));
        Lab.clear(out);
        // positions of each category in the sorted list
        let cum = 0;
        const span = cats.map((v, i) => { const from = cum + 1; cum += f[i]; return { v, from, to: cum }; });
        const at = p => span.find(sp => p >= sp.from && p <= sp.to).v;
        const odd = n % 2 === 1;
        const mid = odd ? [(n + 1) / 2] : [n / 2, n / 2 + 1];
        const medCats = mid.map(at);
        const medWord = medCats[0] === medCats[medCats.length - 1] ? '<b>' + esc(medCats[0]) + '</b>' : 'between <b>' + esc(medCats[0]) + '</b> and <b>' + esc(medCats[1]) + '</b>';
        const steps = [];
        steps.push({ html: 'Sorted from low to high, the ' + tx('n=' + n) + ' values fill positions ' + span.map(sp => esc(sp.v) + ' ' + (sp.from === sp.to ? sp.from : sp.from + '–' + sp.to)).filter((_, i) => f[i] > 0).join(', ') + '.' });
        steps.push(odd
          ? { html: tx('n=' + n) + ' is odd, so the median is at position ' + tx('\\frac{n+1}{2}=\\frac{' + n + '+1}{2}=' + mid[0]) + ': ' + medWord + '. This uses only the <b>order</b>, so it is the same under coding A and coding B.' }
          : { html: tx('n=' + n) + ' is even, so the median sits between positions ' + tx('\\frac{n}{2}=' + mid[0]) + ' and ' + tx('\\frac{n}{2}+1=' + mid[1]) + ': the median is ' + medWord + '. This uses only the <b>order</b>, so it is the same under coding A and coding B.' });
        const res = [A, B].map(C => { const tot = fsum(C.map((c2, i) => c2.mul(f[i]))); return { C, tot, mean: tot.div(n) }; });
        res.forEach((r, k) => steps.push({
          html: '<b>Coding ' + 'AB'[k] + '</b> (' + cats.map((v, i) => esc(v) + ' = ' + vTxt(r.C[i])).join(', ') + ')' + (inc(r.C) ? '' : ' <span class="cbad">does not keep the order: codes must increase from low to high</span>') + ' — mean code:',
          math: meanTex(f, r.C, r.tot, r.mean, n),
        }));
        out.appendChild(K.steps(steps));
        const same = res[0].mean.eq(res[1].mean);
        out.appendChild(K.note('<b>Median</b>: ' + medWord + ' under both codings — the order is all it needs, so the median is allowed for ordinal data. <b>Mean</b>: ' + shortTxt(res[0].mean) + ' under A and ' + shortTxt(res[1].mean) + ' under B' +
          (same ? ' — equal here only because of these codes; change one gap and they part.' : ' — it depends on the gaps you invented, so the mean is <b>not</b> meaningful for ordinal data.'), 's1d-verdict'));
        P.exOrd = { col: col.A.name, cats, f, codes: [codes.a.slice(), codes.b.slice()], median: medCats, means: res.map(r => r.mean.toString()) };
        expose();
      }
      calc();
    }

    /* Interval: changing between °C and °F changes ratios but keeps differences (up to the unit) */
    const unitOf = c => (/°f|fahrenheit|\bf$/.test(norm(c.A.name)) ? 'F' : 'C');
    function demoInterval() {
      const box = P.demoInt;
      Lab.clear(box);
      const U = st.tU === 'F' ? 'F' : 'C', O = U === 'C' ? 'F' : 'C';
      const DU = U === 'C' ? DEGC : DEGF, DO = U === 'C' ? DEGF : DEGC;
      demoHead(box, 'Interval: 40 °C is not “twice as hot” as 20 °C', 'W1_L4 at 12:45: a room at 20 °C and outdoors at 40 °C differ by 20 °C, but outdoors is not twice as hot. Type two temperatures; the lab converts them to the other scale with ' + tx('F=\\tfrac95C+32') + ' (so ' + tx('C=\\tfrac59(F-32)') + ') and compares.');
      const unit = Lab.seg([{ label: 'I type °C', value: 'C' }, { label: 'I type °F', value: 'F' }], U, v => { st.tU = v; save(); demoInterval(); });
      const a = K.textField({ label: 'Temperature ' + tx('a') + ' (°' + U + ')', value: st.tA, onChange: v => { st.tA = v; save(); calc(); } });
      const b = K.textField({ label: 'Temperature ' + tx('b') + ' (°' + U + ')', value: st.tB, onChange: v => { st.tB = v; save(); calc(); } });
      const chips = h('div', { class: 'pl-chips' });
      const setAB = (u, x, y) => { st.tU = u; st.tA = x; st.tB = y; save(); demoInterval(); };
      D.cols.filter(x => x.A.allNum && x.A.sug && x.A.sug.scale === 'int' && KW.temp.test(norm(x.A.name)) && x.A.n >= 2).forEach(c => chips.appendChild(Lab.button('Use the highest and lowest in “' + short(c.A.name, 26) + '”: ' + vTxt(c.A.max) + ' and ' + vTxt(c.A.min) + ' °' + unitOf(c), () => setAB(unitOf(c), vTxt(c.A.max).replace('−', '-'), vTxt(c.A.min).replace('−', '-')), 'btn xs')));
      chips.appendChild(Lab.button('40 °C and 20 °C (W1_L4, 12:45)', () => setAB('C', '40', '20'), 'btn xs'));
      chips.appendChild(Lab.button('28 °C and 14 °C (W1_L4, 12:45)', () => setAB('C', '28', '14'), 'btn xs'));
      const out = h('div', { class: 's1d-out' });
      box.append(h('div', { class: 's1d-ctl s1d-two' }, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Unit you type in' }), unit), a, b, chips), out);
      function calc() {
        const A = numOf(st.tA), B = numOf(st.tB);
        a.input.classList.toggle('bad', !A); b.input.classList.toggle('bad', !B);
        if (!A || !B) { out.querySelector('.cbad') || out.prepend(K.note('<span class="cbad">Type each temperature as a number, such as 40 or −5.5.</span>', 'small')); return; }
        Lab.clear(out);
        const nine5 = F(9, 5), five9 = F(5, 9), k = U === 'C' ? nine5 : five9;
        const conv = x => (U === 'C' ? x.mul(nine5).add(32) : x.sub(32).mul(five9));
        const vv = x => decStr(x, 6) ?? (x.tex() + '\\approx ' + r4(Number(x)));
        const vs = x => decStr(x, 6) ?? x.tex();
        const par = x => (x.n < 0 ? '(' + vTex(x) + ')' : vTex(x));
        const Ao = conv(A), Bo = conv(B);
        // two short lines instead of one long one, so the formula fits a phone
        const convTex = (sym, x, xo) => '\\begin{aligned}' + sym + '&=' + vTex(x) + DU + '\\\\&\\to ' +
          (U === 'C' ? '\\tfrac95\\cdot ' + par(x) + '+32=' + vs(x.mul(nine5)) + '+32=' : '\\tfrac59\\cdot(' + vTex(x) + '-32)=\\tfrac59\\cdot ' + (x.sub(32).n < 0 ? '(' + vs(x.sub(32)) + ')' : vs(x.sub(32))) + '=') + vv(xo) + DO + '\\end{aligned}';
        const steps = [];
        steps.push({ html: 'Convert ' + tx('a') + ' to °' + O + ' with ' + (U === 'C' ? tx('F=\\tfrac95C+32') : tx('C=\\tfrac59(F-32)')) + ':', math: convTex('a', A, Ao) });
        steps.push({ html: 'Convert ' + tx('b') + ' the same way:', math: convTex('b', B, Bo) });
        const dU = A.sub(B), dO = Ao.sub(Bo);
        steps.push({ html: '<b>Differences</b> agree once the unit is accounted for (a step of 1 °' + U + ' is a step of ' + tx(U === 'C' ? '\\tfrac95' : '\\tfrac59') + ' °' + O + '):',
          math: '\\begin{aligned}a-b&=' + vTex(A) + '-' + par(B) + '=' + vTex(dU) + DU + '\\\\' + vs(Ao) + '-' + (Bo.n < 0 ? '(' + vs(Bo) + ')' : vs(Bo)) + '&=' + vv(dO) + DO + '=' + (U === 'C' ? '\\tfrac95' : '\\tfrac59') + '\\cdot ' + par(dU) + '\\end{aligned}' });
        let rU = null, rO = null;
        if (B.isZero()) steps.push({ html: '<b>Ratio in °' + U + '</b>: ' + tx('a/b=' + vTex(A) + '/0') + ' cannot be computed — 0 °' + U + ' is not “no temperature” (W1_L4 at 13:55: 0 °C and 100 °C are just the freezing and boiling points of water; in °F they are 32 and 212).' });
        else { rU = A.div(B); steps.push({ html: '<b>Ratio in °' + U + '</b>:', math: '\\frac ab=\\frac{' + vTex(A) + '}{' + vTex(B) + '}=' + qTex(rU) }); }
        if (Bo.isZero()) steps.push({ html: '<b>Ratio in °' + O + '</b>: the second temperature is 0 °' + O + ', so the ratio cannot be computed.' });
        else { rO = Ao.div(Bo); steps.push({ html: '<b>Ratio in °' + O + '</b>:', math: (decStr(Ao, 6) != null && decStr(Bo, 6) != null ? '\\frac{' + vs(Ao) + '}{' + vs(Bo) + '}' : vs(Ao) + '\\div ' + (Bo.n < 0 ? '(' + vs(Bo) + ')' : vs(Bo))) + '=' + qTex(rO) }); }
        out.appendChild(K.steps(steps));
        let verdict;
        if (rU && rO && rU.eq(rO)) verdict = 'Here the two ratios happen to agree (both ' + shortTxt(rU) + ') — that only happens in special cases such as two equal temperatures. Try 40 °C and 20 °C: the ratio changes from 2 to ' + shortTxt(F(104, 68)) + '. A ratio that depends on the unit is not a fact about the temperatures: on an <b>interval</b> scale, ratios are not allowed.';
        else if (rU && rO) verdict = 'The ratio is ' + shortTxt(rU) + ' in °' + U + ' but ' + shortTxt(rO) + ' in °' + O + ': “' + vTxt(A) + ' °' + U + ' is ' + shortTxt(rU) + ' times as hot” is not a fact about the weather, only about the unit. The difference describes the same gap in both units: a gap of ' + vTxt(dU) + ' °' + U + ' is a gap of ' + shortTxt(dO) + ' °' + O + ', because ' + tx((U === 'C' ? '\\tfrac95' : '\\tfrac59') + '\\cdot ' + par(dU) + eqTex(dO)) + '. So on an <b>interval</b> scale differences are allowed and ratios are not — because the zero (0 °C, or 0 °F) is arbitrary.';
        else verdict = 'Even dividing by the second temperature fails here — the zero of an <b>interval</b> scale is arbitrary, so ratios are not allowed; differences are.';
        out.appendChild(K.note(verdict, 's1d-verdict'));
        const cA = U === 'C' ? A : Ao, cB = U === 'C' ? B : Bo;
        const kA = cA.add(F(27315, 100)), kB = cB.add(F(27315, 100));
        out.appendChild(K.note('W1_L4 at 14:29: only the Kelvin scale has a zero that means “absolutely no temperature”, so Kelvin is a ratio scale. With ' + tx('K=C+273.15') + ': ' + tx('a') + ' ' + eqTxt(kA) + ' K and ' + tx('b') + ' ' + eqTxt(kB) + ' K' + (kB.n <= 0 || kA.n < 0 ? '.' : ', ratio ' + tx(decStr(kA, 6) != null && decStr(kB, 6) != null ? '\\frac{' + decStr(kA, 6) + '}{' + decStr(kB, 6) + '}' + eqTex(kA.div(kB)) : qTex(kA.div(kB))) + '.'), 'small muted'));
        P.exInt = { unit: U, a: A.toString(), b: B.toString(), ao: Ao.toString(), bo: Bo.toString(), rU: rU ? rU.toString() : null, rO: rO ? rO.toString() : null, dU: dU.toString(), dO: dO.toString() };
        expose();
      }
      calc();
    }

    /* Ratio: cm → inches keeps ratios */
    function heightPair() {
      const c = D.cols.find(x => x.A.allNum && x.A.sug && x.A.sug.scale === 'rat' && /\bheight/.test(norm(x.A.name)) && /\bcm\b/.test(norm(x.A.name)));
      return c ? { c, hi: c.A.max, lo: c.A.min } : null;
    }
    function demoRatio() {
      const box = P.demoRat;
      Lab.clear(box);
      demoHead(box, 'Ratio: “twice as tall” survives any unit', 'W1_L4 at 15:36: a score of 300 is twice 150, 200 runs is twice 100, 100 wickets is twice 50 — on a ratio scale “twice” makes sense because 0 means none. Heights have a true zero too (0 cm = no height). Type two heights in cm; the lab converts them to inches (1 inch = 2.54 cm exactly).');
      const a = K.textField({ label: 'Height ' + tx('a') + ' (cm)', value: st.hA, onChange: v => { st.hA = v; save(); calc(); } });
      const b = K.textField({ label: 'Height ' + tx('b') + ' (cm)', value: st.hB, onChange: v => { st.hB = v; save(); calc(); } });
      const pair = heightPair();
      const chips = h('div', { class: 'pl-chips' });
      if (pair) chips.appendChild(Lab.button('Use the tallest and shortest in “' + short(pair.c.A.name, 26) + '”: ' + vTxt(pair.hi) + ' and ' + vTxt(pair.lo), () => { st.hA = vTxt(pair.hi); st.hB = vTxt(pair.lo); a.input.value = st.hA; b.input.value = st.hB; save(); calc(); }, 'btn xs'));
      chips.appendChild(Lab.button('180 and 90', () => { st.hA = '180'; st.hB = '90'; a.input.value = '180'; b.input.value = '90'; save(); calc(); }, 'btn xs'));
      const out = h('div', { class: 's1d-out' });
      box.append(h('div', { class: 's1d-ctl s1d-two' }, a, b, chips), out);
      function calc() {
        const A = numOf(st.hA), B = numOf(st.hB);
        const okA = A && A.n > 0, okB = B && B.n > 0;
        a.input.classList.toggle('bad', !okA); b.input.classList.toggle('bad', !okB);
        if (!okA || !okB) { out.querySelector('.cbad') || out.prepend(K.note('<span class="cbad">Type each height as a positive number of cm, such as 180 or 152.5.</span>', 'small')); return; }
        Lab.clear(out);
        const inch = F(254, 100);
        const Ai = A.div(inch), Bi = B.div(inch), r = A.div(B), ri = Ai.div(Bi);
        const inTex = (c, ci) => '\\frac{' + vTex(c) + '}{2.54}=' + qTex(ci) + '\\text{ in}';
        out.appendChild(K.steps([
          { html: '<b>Ratio in cm</b>:', math: '\\frac ab=\\frac{' + vTex(A) + '}{' + vTex(B) + '}=' + qTex(r) },
          { html: 'Convert ' + tx('a') + ' to inches (divide by 2.54):', math: 'a=' + inTex(A, Ai) },
          { html: 'Convert ' + tx('b') + ' the same way:', math: 'b=' + inTex(B, Bi) },
          { html: '<b>Ratio in inches</b> — the 2.54 cancels:', math: '\\frac{' + vTex(A) + '/2.54}{' + vTex(B) + '/2.54}=\\frac{' + vTex(A) + '}{' + vTex(B) + '}=' + qTex(ri) },
        ]));
        out.appendChild(K.note('The ratio is ' + shortTxt(r) + ' in cm and ' + shortTxt(ri) + ' in inches — <b>the same</b>, because changing the unit only multiplies every height by one number and 0 cm = 0 inches. So “' + vTxt(A) + ' cm is ' + shortTxt(r) + ' times as tall as ' + vTxt(B) + ' cm” is a fact about the people: on a <b>ratio</b> scale, ×, ÷ (and +, −) are allowed.', 's1d-verdict'));
        P.exRat = { a: A.toString(), b: B.toString(), aIn: Ai.toString(), bIn: Bi.toString(), r: r.toString(), rIn: ri.toString() };
        expose();
      }
      calc();
    }

    /* ---------------- population and sample */
    function popVals() {
      const { nums, bad } = K.parseList(st.pop);
      if (bad.length || !nums.length) return null;
      return nums.slice(0, MAX_POP).map(x => F(x));
    }
    function drawPop() {
      if (!P.popBuilt) buildPop();
      const vals = popVals();
      if (!vals) return;
      const N = vals.length;
      if (st.n > N) st.n = N;
      if (st.n < 1) st.n = 1;
      ctl.n.setRange(1, Math.max(1, N));
      ctl.n.set(st.n);
      const chips = h('div', { class: 'pl-chips' });
      D.cols.filter(c => c.A.allNum && c.A.n >= 2 && c.A.sug && c.A.sug.kind === 'num').forEach(c => chips.appendChild(Lab.button('Use “' + short(c.A.name, 24) + '” (' + c.A.n + ' values)', () => {
        st.pop = c.A.nums.map(vTxt).join(', ').replace(/−/g, '-'); st.popSrc = 'column “' + c.A.name + '” of your table'; st.n = Math.min(st.n, c.A.n); st.many = 0;
        ctl.pop.set(st.pop); save();
      }, 'btn xs')));
      chips.appendChild(Lab.button('Runs of the 19 players (W1_L2)', () => { st.pop = POP_DEFAULT; st.popSrc = POP_SOURCE; st.many = 0; ctl.pop.set(st.pop); save(); }, 'btn xs'));
      chips.appendChild(Lab.button('Marks of 20 students (made up)', () => { st.pop = POP_MADE; st.popSrc = POP_MADE_SRC; st.many = 0; ctl.pop.set(st.pop); save(); }, 'btn xs'));
      Lab.clear(P.popChips); P.popChips.appendChild(chips);
      const idx = drawIdx(N, st.n, st.seed);
      const sample = idx.map(i => vals[i]);
      const sumP = fsum(vals), mu = sumP.div(N), sumS = fsum(sample), xbar = sumS.div(st.n), diff = xbar.sub(mu);
      const body = P.popOut;
      Lab.clear(body);
      body.appendChild(K.note('Population: ' + esc(st.popSrc) + '.', 'small muted'));
      const strip = h('div', { class: 's1d-popchips' });
      vals.forEach((v, i) => strip.appendChild(h('span', { class: 's1d-pc' + (idx.includes(i) ? ' in' : ''), title: 'position ' + (i + 1) + (idx.includes(i) ? ' — in the sample' : '') }, h('i', { text: String(i + 1) }), h('b', { text: vTxt(v) }))));
      body.appendChild(strip);
      body.appendChild(K.note('Violet = in your sample.', 'small muted'));
      const ways = chooseBig(N, st.n);
      const wayTxt = ways.toString().length <= 24 ? bigTxt(ways) : 'about ' + Number(ways).toExponential(2).replace('e+', ' × 10^');
      const steps = [
        { html: 'Population size ' + tx('N=' + N) + ' (all the values you typed). Sample size ' + tx('n=' + st.n) + '. A simple random sample: every set of ' + st.n + ' positions is equally likely, and there are ' + tx('\\binom{N}{n}=\\binom{' + N + '}{' + st.n + '}') + ' = ' + wayTxt + ' such sets. This one is positions ' + idx.map(i => i + 1).join(', ') + '.' },
        { html: 'Population mean (notation from Week 3): add all ' + N + ' values — ' + '<span class="s1d-sum">' + termsTxt(vals) + ' = ' + vTxt(sumP) + '</span>', math: '\\mu=\\frac{\\sum x_i}{N}=\\frac{' + vTex(sumP) + '}{' + N + '}' + (mu.d === 1 ? '=' + mu.n : eqTex(mu)) },
        { html: 'Sample mean: add the ' + st.n + ' sampled values — <span class="s1d-sum">' + termsTxt(sample) + ' = ' + vTxt(sumS) + '</span>', math: '\\bar x=\\frac{\\sum x_i}{n}=\\frac{' + vTex(sumS) + '}{' + st.n + '}' + (xbar.d === 1 ? '=' + xbar.n : eqTex(xbar)) },
        { html: 'Difference:', math: '\\bar x-\\mu=' + (decStr(xbar, 6) ?? xbar.tex()) + '-' + (mu.n < 0 ? '(' + (decStr(mu, 6) ?? mu.tex()) + ')' : (decStr(mu, 6) ?? mu.tex())) + (decStr(diff, 6) != null ? '=' + decStr(diff, 6) : '\\approx ' + r4(Number(diff))), note: diff.isZero() ? 'This sample’s mean hits μ exactly — luck; draw again.' : 'The sample misses the population mean by ' + shortTxt(diff.n < 0 ? diff.neg() : diff) + ': a sample is only part of the population.' },
      ];
      body.appendChild(K.steps(steps));
      body.appendChild(h('div', { class: 's1d-two-sent' },
        K.note('<b>Descriptive</b> statistics describe the data in hand: ' + tx('\\mu' + eqTex(mu)) + ' summarises the population you typed, and ' + tx('\\bar x' + eqTex(xbar)) + ' summarises the sample.', 's1d-sent'),
        K.note('<b>Inferential</b> statistics use the sample to conclude about the population: seeing only the sample, you would estimate the unknown ' + tx('\\mu') + ' by ' + tx('\\bar x' + eqTex(xbar)) + ' — and, as W1_L1 says, such a conclusion carries an element of chance.', 's1d-sent')));
      // many samples
      Lab.clear(P.popMany);
      let manyOut = null;
      if (st.many) {
        const means = [];
        for (let k = 1; k <= 100; k++) { const ix = drawIdx(N, st.n, st.many + k); means.push(fsum(ix.map(i => vals[i])).div(st.n)); }
        const avg = fsum(means).div(100);
        const mn = means.reduce((x, y) => (Number(y) < Number(x) ? y : x)), mx = means.reduce((x, y) => (Number(y) > Number(x) ? y : x));
        const chart = h('div', { class: 's1d-chart' });
        P.popMany.append(K.note('100 samples of size ' + tx('n=' + st.n) + ': each dot is one sample mean ' + tx('\\bar x') + '; the grey ticks are the ' + N + ' population values; the line is ' + tx('\\mu') + '.', 'small'), chart);
        fit(chart, W => stripChart(W, vals.map(Number), means.map(Number), Number(mu)));
        P.popMany.appendChild(K.note('Smallest ' + tx('\\bar x' + eqTex(mn)) + ', largest ' + tx('\\bar x' + eqTex(mx)) + '. Their average: ' + tx('\\frac{\\bar x_1+\\dots+\\bar x_{100}}{100}' + eqTex(avg)) + ', close to ' + tx('\\mu' + eqTex(mu)) + '. Each sample gives a different ' + tx('\\bar x') + ', while ' + tx('\\mu') + ' stays fixed.', 'small'));
        manyOut = { min: mn.toString(), max: mx.toString(), avg: avg.toString() };
      }
      P.exPop = { N, n: st.n, idx: idx.map(i => i + 1), sum: sumP.toString(), mu: mu.toString(), sampleSum: sumS.toString(), xbar: xbar.toString(), many: manyOut, seed: st.seed, manySeed: st.many, values: vals.map(v => v.toString()) };
      expose();
    }
    function buildPop() {
      P.popBuilt = true;
      const box = P.pop.body;
      ctl.pop = K.listField({ label: 'Population: type all ' + tx('N') + ' values', value: st.pop, rows: 3, hint: nums => tx('N=' + Math.min(nums.length, MAX_POP)) + ' value' + (nums.length === 1 ? '' : 's') + (nums.length > MAX_POP ? ' (only the first 200 are used)' : '') + '.', onChange: () => { if (ctl.pop.input.value !== st.pop) { st.pop = ctl.pop.input.value; st.popSrc = 'values you typed'; st.many = 0; save(); } drawPop(); } });
      ctl.n = K.numField({ label: 'Sample size ' + tx('n'), min: 1, max: 20, value: st.n, onChange: v => { st.n = v; st.many = 0; save(); drawPop(); } });
      P.popChips = h('div', {});
      const btns = h('div', { class: 'btn-row' },
        Lab.button(Lab.icon('dice') + '<span>Draw a new sample</span>', () => { st.seed = newSeed(); st.many = 0; save(); drawPop(); }, 'btn primary sm'),
        Lab.button('Draw 100 samples', () => { st.many = newSeed(); save(); drawPop(); }, 'btn sm'));
      P.popOut = h('div', { class: 's1d-out' });
      P.popMany = h('div', { class: 's1d-out' });
      box.append(h('div', { class: 's1d-ctl' }, ctl.pop, P.popChips, ctl.n, btns), P.popOut, P.popMany);
    }

    /* ---------------- cross-sectional vs time-series */
    function buildTime() {
      const box = P.time.body;
      Lab.clear(box);
      const ts = st.ts;
      const mode = Lab.seg([{ label: 'Cross-sectional: many cases, one time', value: 'cross' }, { label: 'Time-series: one case over time', value: 'time' }], ts.mode, v => { ts.mode = v; save(); syncFields(); drawTime(); });
      const name = K.textField({ label: 'Variable', value: ts.name, mono: false, onChange: v => { ts.name = v; save(); drawTime(); } });
      const labels = K.textField({ label: 'Labels (cases or times), separated by commas', value: ts[ts.mode].labels, mono: false, onChange: v => { ts[ts.mode].labels = v; save(); drawTime(); } });
      const vals = K.listField({ label: 'Values, in the same order', value: ts[ts.mode].values, rows: 2, hint: nums => tx('n=' + nums.length) + ' values.', onChange: () => { if (vals.input.value !== ts[ts.mode].values) { ts[ts.mode].values = vals.input.value; save(); } drawTime(); } });
      const sort = K.toggle({ label: 'Sort the values (largest first)', value: ts.sort, onChange: v => { ts.sort = v; save(); drawTime(); } });
      const pre = h('div', { class: 'pl-chips' }, TS.map(p => Lab.button(p.label, () => {
        Object.assign(ts, { key: p.key, name: p.name, unit: p.unit, time: Object.assign({}, p.time) });
        ts.cross = p.cross ? Object.assign({}, p.cross) : { labels: '', values: '' };
        if (p.only) { ts.mode = p.only; mode.set(p.only); }
        name.input.value = p.name; save(); syncFields(); drawTime();
      }, 'btn xs')));
      function syncFields() { labels.input.value = ts[ts.mode].labels; vals.set(ts[ts.mode].values); labels.querySelector('.pl-label').textContent = ts.mode === 'cross' ? 'Cases (one label per case), separated by commas' : 'Times in chronological order, separated by commas'; }
      P.timeOut = h('div', { class: 's1d-out' });
      box.append(h('div', { class: 's1d-ctl' }, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Which kind of data?' }), mode), name, labels, vals, sort, h('div', { class: 'pl-field' }, h('label', { class: 'pl-label', text: 'Examples' }), pre)), P.timeOut);
      syncFields();
      drawTime();
    }
    function drawTime() {
      const ts = st.ts, M = ts[ts.mode];
      const out = P.timeOut;
      if (!String(M.values).trim()) {
        Lab.clear(out);
        out.appendChild(K.note(ts.mode === 'cross' ? 'This example has no cross-sectional view: the lecture’s table follows one case over time. Type your own cases and values above, or pick another example.' : 'Type the values above.', 's1d-lead'));
        return;
      }
      const { nums, bad } = K.parseList(M.values);
      if (bad.length || !nums.length) return;
      const vals = nums.map(x => F(x));
      const given = String(M.labels).split(',').map(s => s.trim()).filter(Boolean);
      const labels = vals.map((_, i) => given[i] || (ts.mode === 'time' ? 't = ' + (i + 1) : 'Case ' + (i + 1)));
      Lab.clear(out);
      const preset = TS.find(p => p.key === ts.key);
      const unit = ts.unit && preset && ts.name === preset.name ? ' ' + ts.unit : '';
      const miss = vals.length - given.length;
      if (miss) out.appendChild(K.note('<span class="cbad">' + given.length + ' label' + (given.length === 1 ? '' : 's') + ' for ' + vals.length + ' values' + (miss === 1 ? ': the missing label is called “' + esc(labels[given.length]) + '”' : miss > 1 ? ': the missing ' + miss + ' are called “' + esc(labels[given.length]) + '” to “' + esc(labels[vals.length - 1]) + '”' : ': the last ' + (-miss) + ' label' + (miss === -1 ? ' is' : 's are') + ' ignored') + '.</span>', 'small'));
      const items = labels.map((l, i) => ({ label: l, v: Number(vals[i]), f: vals[i], txt: vTxt(vals[i]), title: l + ': ' + vTxt(vals[i]) + unit }));
      const order = ts.sort ? items.slice().sort((x, y) => y.v - x.v) : items;
      const isTime = ts.mode === 'time';
      const nmHtml = '<b>' + esc(ts.name || 'the variable') + '</b>';
      const whenTxt = preset && ts.name === preset.name ? (isTime ? ' ' + preset.time.who : preset.cross ? ' ' + preset.cross.when : '') : '';
      out.appendChild(K.note(isTime
        ? '<b>Time-series</b>: ' + nmHtml + whenTxt + ' — one case, measured at ' + vals.length + ' times. A <b>timeplot</b> joins the values in chronological order (course notes: monthly kWh, daily temperature).'
        : '<b>Cross-sectional</b>: ' + nmHtml + whenTxt + ' — ' + vals.length + ' cases at one time. The cases have no natural order, so a bar chart in any order is fine (course notes: district COVID counts on 1 Mar 2021).', 's1d-lead'));
      if (ts.sort && isTime) out.appendChild(K.note('<b>This is not a timeplot any more.</b> Sorting by value puts the times out of order, so the line’s rises and falls no longer show change over time. A timeplot must keep chronological order — switch “Sort” off.', 's1d-warnbox'));
      if (ts.sort && !isTime) out.appendChild(K.note('Sorted by value, largest first. Fine for cross-sectional data: the cases have no natural order, so sorting only makes them easier to compare.', 'small muted'));
      const chart = h('div', { class: 's1d-chart' });
      out.appendChild(chart);
      fit(chart, W => (isTime ? lineChart(W, order, { aria: 'timeplot of ' + (ts.name || 'the values'), wrong: ts.sort }) : barChart(W, order, { aria: 'bar chart of ' + (ts.name || 'the values') })));
      const steps = [];
      if (isTime) {
        const first = items[0], last = items[items.length - 1];
        if (items.length >= 2) {
          const ch = last.f.sub(first.f);
          steps.push({ html: 'From the first time (' + esc(first.label) + ', ' + first.txt + ') to the last (' + esc(last.label) + ', ' + last.txt + '): change ' + tx(vTex(last.f) + '-' + (first.f.n < 0 ? '(' + vTex(first.f) + ')' : vTex(first.f)) + '=' + vTex(ch)) + unit + '.' });
          const moves = items.slice(1).map((it, i) => ({ from: items[i], to: it, d: it.f.sub(items[i].f) }));
          const best = Math.max(...moves.map(m => Number(m.d))), worst = Math.min(...moves.map(m => Number(m.d)));
          const ups = moves.filter(m => Number(m.d) === best), dns = moves.filter(m => Number(m.d) === worst);
          /** "4 Oct → 5 Oct: 33 − 31 = +2" for each tied move (all of them, up to 4). */
          const moveTxt = (ms, sign) => ms.slice(0, 4).map(m => esc(m.from.label) + ' → ' + esc(m.to.label) + ': ' + tx(vTex(m.to.f) + '-' + (m.from.f.n < 0 ? '(' + vTex(m.from.f) + ')' : vTex(m.from.f)) + '=' + sign + vTex(m.d)) + unit).join('; ') + (ms.length > 4 ? '; and ' + (ms.length - 4) + ' more' : '');
          if (best > 0) steps.push({ html: 'Largest rise from one time to the next' + (ups.length > 1 ? ' (' + ups.length + ' moves tie)' : '') + ': ' + moveTxt(ups, '+') + '.' });
          if (worst < 0) steps.push({ html: 'Largest fall' + (dns.length > 1 ? ' (' + dns.length + ' moves tie)' : '') + ': ' + moveTxt(dns, '') + '.' });
          if (best <= 0 && worst >= 0) steps.push({ html: 'The value never changes from one time to the next.' });
        } else steps.push({ html: 'One time only: a time series needs at least two times to show change.' });
      } else {
        const hiV = Math.max(...items.map(it => it.v)), loV = Math.min(...items.map(it => it.v));
        const his = items.filter(it => it.v === hiV), los = items.filter(it => it.v === loV);
        const names = arr => arr.map(it => esc(it.label)).join(', ');
        steps.push({ html: 'Highest: ' + names(his) + ' (' + his[0].txt + unit + '). Lowest: ' + names(los) + ' (' + los[0].txt + unit + '). Gap between them: ' + tx(vTex(his[0].f) + '-' + (los[0].f.n < 0 ? '(' + vTex(los[0].f) + ')' : vTex(los[0].f)) + '=' + vTex(his[0].f.sub(los[0].f))) + unit + '.' });
      }
      out.appendChild(K.steps(steps));
      if (preset && ts.name === preset.name && (isTime || preset.cross)) out.appendChild(K.note('Values: ' + preset.source, 'small muted'));
      P.exTs = { mode: ts.mode, n: vals.length, sorted: !!ts.sort, labels: order.map(it => it.label), values: order.map(it => it.f.toString()) };
      expose();
    }

    /** Exact results in a data attribute for the test scripts (nothing on screen). */
    function expose() {
      host.dataset.s1d = JSON.stringify({
        cols: D.cols.map(c => ({ name: c.A.name, n: c.A.n, kind: c.A.sug ? c.A.sug.kind : null, dc: c.A.sug ? c.A.sug.dc || null : null, scale: c.A.sug ? c.A.sug.scale || null : null, order: c.A.sug && c.A.sug.order ? c.A.sug.order : null, status: status(c.A.sug, st.ch[c.id]), mixed: !!c.A.mixed, constant: !!c.A.constant, na: c.A.na })),
        focus: st.focus, nom: P.exNom || null, ord: P.exOrd || null, int: P.exInt || null, rat: P.exRat || null, pop: P.exPop || null, ts: P.exTs || null,
      });
    }

    afterStructure();
    buildTime();
  }

  Lab.lab({
    id: 'lab-s1-data', course: 's1', week: 1, order: 1,
    title: 'Data types and scales lab', sub: 'Week 1 · kinds of data',
    topics: ['cases & variables', 'categorical / numerical', 'discrete / continuous', 'nominal · ordinal · interval · ratio', 'population & sample', 'descriptive / inferential', 'time-series & timeplot'],
    desc: 'Type your own dataset and classify every variable — the lab checks each choice and says why. See what each scale allows: average two codings of the same labels, convert 40 °C and 20 °C to °F, compare heights in cm and inches. Draw a random sample from your population, and plot a time series in chronological order.',
    render: host => dataLab(host),
  });
})();
