/* Revise — offline support. The first visit stores every file of the site; after that the labs open without a
   network. A new version of the site has a new cache name: its files are fetched once and the old ones deleted. */
const CACHE = 'revise-4f400a6e2951';
const FILES = [
  "./",
  "assets/css/base.css",
  "assets/css/ext-w1b.css",
  "assets/css/ext-w2a.css",
  "assets/css/ext-w2c.css",
  "assets/css/labs/s1.css",
  "assets/css/labs/s2.css",
  "assets/css/labs/s3.css",
  "assets/css/labs/s4.css",
  "assets/css/labs/s5.css",
  "assets/css/labs/s6.css",
  "assets/css/labs/s7.css",
  "assets/css/labs/t1.css",
  "assets/css/labs/t2.css",
  "assets/css/labs/t3.css",
  "assets/css/labs/t4a.css",
  "assets/css/labs/t4b.css",
  "assets/css/labs/w3-bounds.css",
  "assets/css/labs/w3-cov.css",
  "assets/css/labs/w3-expect.css",
  "assets/css/labs/w3-var.css",
  "assets/css/play.css",
  "assets/css/rev.css",
  "assets/css/ui.css",
  "assets/css/widgets.css",
  "assets/icons/favicon.svg",
  "assets/icons/icon-180.png",
  "assets/icons/icon-192.png",
  "assets/icons/icon-512.png",
  "assets/icons/icon.svg",
  "assets/js/app.js",
  "assets/js/components.js",
  "assets/js/core.js",
  "assets/js/draw.js",
  "assets/js/labkit.js",
  "assets/js/prob.js",
  "assets/js/revkit.js",
  "assets/js/widgets/charts.js",
  "assets/js/widgets/ext-w2a.js",
  "assets/js/widgets/functions.js",
  "assets/js/widgets/joint.js",
  "assets/js/widgets/more.js",
  "assets/js/widgets/play.js",
  "assets/js/widgets/sorter.js",
  "assets/vendor/katex/auto-render.min.js",
  "assets/vendor/katex/fonts/KaTeX_AMS-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Italic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2",
  "assets/vendor/katex/fonts/KaTeX_Math-Italic.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2",
  "assets/vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Script-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Size1-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Size2-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Size3-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Size4-Regular.woff2",
  "assets/vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2",
  "assets/vendor/katex/katex.min.css",
  "assets/vendor/katex/katex.min.js",
  "index.html",
  "labs/m2-cramer.js",
  "labs/m2-dependence.js",
  "labs/m2-matrix.js",
  "labs/m2-rowreduce.js",
  "labs/m2-vectors.js",
  "labs/s1-kit.js",
  "labs/s1-w01-data.js",
  "labs/s1-w02-categorical.js",
  "labs/s1-w03-describe.js",
  "labs/s1-w03-freq.js",
  "labs/s1-w04-scatter.js",
  "labs/s1-w04-table.js",
  "labs/s1-w05-arrange.js",
  "labs/s1-w06-choose.js",
  "labs/s1-w07-events.js",
  "labs/s1-w08-bayes.js",
  "labs/s1-w09-pmf.js",
  "labs/s1-w10-expect.js",
  "labs/s1-w11-discrete.js",
  "labs/s1-w12-continuous.js",
  "labs/s2-w1-build.js",
  "labs/s2-w1-joint.js",
  "labs/s2-w1-many.js",
  "labs/s2-w2-gx.js",
  "labs/s2-w2-gxy.js",
  "labs/s2-w2-indep.js",
  "labs/s2-w2-maxmin.js",
  "labs/s2-w2-sum.js",
  "labs/s2-w3-bounds.js",
  "labs/s2-w3-cov.js",
  "labs/s2-w3-expect.js",
  "labs/s2-w3-var.js",
  "manifest.webmanifest",
  "pages/home.js",
  "site.js"
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('revise-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(req, copy));
    }
    return res;
  }).catch(() => (req.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
