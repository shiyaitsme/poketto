/* Poketto shared script: paper layers, dry-brush strokes and the POKETTO wordmark.
   Usage: <link rel="stylesheet" href="../assets/poketto.css"> + <script src="../assets/poketto.js" defer></script>
   Markup hooks: [data-pk-wordmark] gets the wordmark, .pk-head marks where the main stroke starts.
   Call Poketto.repaint() after the page height changes (it also repaints on resize automatically). */
(function () {
  var cv, ctx;

  function insertLayers() {
    var rail = function (side, dots) {
      var d = document.createElement('div'); d.className = 'pk-rail ' + side; d.setAttribute('aria-hidden', 'true');
      dots.forEach(function (t) { var i = document.createElement('i'); i.style.top = t[0]; if (t[1]) i.className = 'f'; d.appendChild(i); });
      return d;
    };
    var frag = document.createDocumentFragment();
    var stain = document.createElement('div'); stain.className = 'pk-stain'; stain.setAttribute('aria-hidden', 'true');
    cv = document.createElement('canvas'); cv.id = 'pk-brush'; cv.setAttribute('aria-hidden', 'true');
    var fib = document.createElement('div'); fib.className = 'pk-fibres'; fib.setAttribute('aria-hidden', 'true');
    var vig = document.createElement('div'); vig.className = 'pk-vig'; vig.setAttribute('aria-hidden', 'true');
    frag.appendChild(stain); frag.appendChild(cv); frag.appendChild(fib); frag.appendChild(vig);
    frag.appendChild(rail('l', [['4px', 1], ['30px', 0], ['24%', 0], ['46%', 1], ['63%', 1], ['65%', 0], ['94%', 0]]));
    frag.appendChild(rail('r', [['4px', 1], ['11%', 0], ['27%', 0], ['29%', 1], ['50%', 1], ['72%', 0], ['97%', 1]]));
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute'; svg.setAttribute('aria-hidden', 'true');
    svg.innerHTML =
      '<filter id="pk-rough" x="-2%" y="-2%" width="104%" height="104%">' +
        '<feTurbulence type="fractalNoise" baseFrequency=".018 .03" numOctaves="3" seed="3" result="w"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="w" scale="22" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="8" result="g"/>' +
        '<feDisplacementMap in="d" in2="g" scale="5" xChannelSelector="R" yChannelSelector="B"/></filter>' +
      '<filter id="pk-ink" x="-2%" y="-5%" width="104%" height="110%">' +
        '<feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" seed="5" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d"/>' +
        '<feTurbulence type="fractalNoise" baseFrequency="1.3" numOctaves="2" seed="1" result="m"/>' +
        '<feColorMatrix in="m" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.1 1.5" result="mask"/>' +
        '<feComposite in="d" in2="mask" operator="in"/></filter>' +
      '<filter id="pk-ink-s" x="-2%" y="-5%" width="104%" height="110%">' +
        '<feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="5" result="n"/>' +
        '<feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G"/></filter>';
    frag.appendChild(svg);
    document.body.insertBefore(frag, document.body.firstChild);
    ctx = cv.getContext('2d');
  }

  var WM = [['P', 1, 1.22], ['o', .74, 1.2], ['k', .82, 1.12], ['e', .74, 1.2], ['T', 1.02, 1.15], ['T', 1.02, 1.15], ['O', 1.02, 1.55]];
  var STAR = '<svg class="spark" viewBox="0 0 40 80"><path d="M20 0 C21.2 26 22.5 33 40 38 C22.5 43 21.2 52 20 80 C18.8 52 17.5 43 0 38 C17.5 33 18.8 26 20 0Z"/></svg>';
  function wordmark(el) {
    var wm = document.createElement('span'); wm.className = 'wm'; wm.setAttribute('aria-hidden', 'true');
    wm.innerHTML = WM.map(function (l, i) {
      return '<i style="--s:' + l[1] + ';--x:' + l[2] + '">' + l[0] + (i === WM.length - 1 ? STAR : '') + '</i>';
    }).join('');
    el.setAttribute('aria-label', 'POKETTO');
    el.appendChild(wm);
    el._wm = wm;
  }
  // transforms don't change layout width, so add the stretch back as margin (in em)
  function spaceWordmark(el) {
    var wm = el._wm; if (!wm) return;
    wm.querySelectorAll('i').forEach(function (i) {
      var fs = parseFloat(getComputedStyle(i).fontSize), x = parseFloat(i.style.getPropertyValue('--x')) || 1;
      i.style.marginRight = '0';
      i.style.marginRight = (((x - 1) * i.offsetWidth) / fs) + 'em';
    });
  }

  function rng(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  // Catmull-Rom through control points, sampled every ~3px
  function spline(pts) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const n = Math.max(2, Math.ceil(len / 3));
      for (let j = 0; j < n; j++) {
        const t = j / n, t2 = t * t, t3 = t2 * t;
        out.push([
          .5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          .5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  const LIGHT = ['#cfe86a', '#c0e052', '#b3dc48', '#d9ee8e'];
  const MID = ['#9fd03e', '#8ec84a', '#7fbf4f', '#a6cf6a'];
  const DEEP = ['#5fae5a', '#4e9a6a', '#58a468', '#3f8f63'];
  const pick = (r, a) => a[(r() * a.length) | 0];

  function brush(pts, width, seed) {
    const r = rng(seed);
    let path = spline(pts);
    // smooth the centreline so there are no kinks
    for (let pass = 0; pass < 3; pass++) {
      const k = 14, q = path.map(p => p.slice());
      for (let i = 0; i < path.length; i++) {
        let x = 0, y = 0, c = 0;
        for (let j = Math.max(0, i - k); j <= Math.min(path.length - 1, i + k); j++) { x += path[j][0]; y += path[j][1]; c++; }
        q[i] = [x / c, y / c];
      }
      path = q;
    }
    const N = path.length;
    const nx = new Float32Array(N), ny = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = path[Math.max(0, i - 6)], b = path[Math.min(N - 1, i + 6)];
      const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      nx[i] = -dy / l; ny[i] = dx / l;
    }
    const wob = () => { const f1 = .004 + r() * .01, f2 = .012 + r() * .03, p1 = r() * 50, p2 = r() * 50, a2 = .25 + r() * .4; return i => Math.sin(i * f1 + p1) + Math.sin(i * f2 + p2) * a2; };
    // pressure: swells in the middle, lifts at the end, with a few surges
    const sw = wob();
    const press = s => Math.min(1, s / .1, (1 - s) / .28) * (.82 + .18 * sw(s * N));

    function ribbon(off, wid, color, alpha, from, to, jitter) {
      const j = wob();
      ctx.beginPath();
      let first = true;
      for (let i = (from * N) | 0; i < (to * N) | 0; i++) {
        const s = i / N, p = press(s);
        const o = (off * width * .5 + j(i) * jitter * width) * p;
        const x = path[i][0] + nx[i] * o, y = path[i][1] + ny[i] * o;
        first ? ctx.moveTo(x, y) : ctx.lineTo(x, y); first = false;
      }
      ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = wid;
      ctx.stroke();
    }

    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'multiply';

    // 1. wet wash: wide, soft, uneven
    ctx.filter = 'blur(' + Math.round(width * .06) + 'px)';
    for (let k = 0; k < 7; k++) ribbon((r() - .5) * .9, width * (.3 + r() * .3), pick(r, k % 3 ? LIGHT : MID), .13, r() * .05, 1 - r() * .12, .12);
    ctx.filter = 'blur(2px)';
    // 2. body of the stroke: overlapping medium ribbons, each wandering on its own
    for (let k = 0; k < 26; k++) {
      const o = (r() * 2 - 1) * .8;
      const deep = Math.abs(o) > .45 && r() < .7;
      ribbon(o, width * (.05 + r() * .13), pick(r, deep ? DEEP : (r() < .5 ? MID : LIGHT)), .12 + r() * .16, r() * .12, 1 - r() * .22, .1 + r() * .1);
    }
    // 3. dark pooled paint along one edge
    ctx.filter = 'blur(' + Math.round(width * .03) + 'px)';
    for (let k = 0; k < 6; k++) ribbon(.45 + r() * .4, width * (.04 + r() * .08), pick(r, DEEP), .16, .1 + r() * .2, .6 + r() * .35, .07);
    ctx.filter = 'none';
    // 4. dry bristle streaks: thin, wandering, broken by paper tooth
    const B = Math.round(width * .9);
    for (let b = 0; b < B; b++) {
      const o = (r() * 2 - 1) * (.85 + r() * .25);
      const j = wob(), jit = .012 + r() * .03;
      const lw = .5 + r() * r() * 2.6;
      const dry = .2 + r() * .9, f = .008 + r() * .05, ph = r() * 99;
      const start = r() * .15, end = 1 - r() * .3;
      ctx.strokeStyle = r() < .3 ? pick(r, DEEP) : pick(r, MID);
      ctx.globalAlpha = .07 + r() * .2; ctx.lineWidth = lw;
      let pen = false; ctx.beginPath();
      for (let i = (start * N) | 0; i < (end * N) | 0; i++) {
        const g = Math.sin(i * f + ph) + Math.sin(i * f * 2.9 + ph * 1.7) * .6 + (r() - .5) * .5;
        if (g > dry) { pen = false; continue; }
        const p = press(i / N);
        const off = (o * width * .5 + j(i) * jit * width) * p;
        const x = path[i][0] + nx[i] * off, y = path[i][1] + ny[i] * off;
        if (pen) ctx.lineTo(x, y); else { ctx.moveTo(x, y); pen = true; }
      }
      ctx.stroke();
    }
    ctx.restore();
  }


  function paint() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = document.documentElement.clientWidth;
    var H = document.body.scrollHeight;
    cv.style.height = H + 'px';
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    var head = document.querySelector('.pk-head');
    var r = head ? head.getBoundingClientRect() : { top: 0, height: 240 };
    var hy = r.top + window.scrollY, hh = Math.max(180, r.height);
    var wide = Math.max(90, Math.min(W, 1300) * .22);
    // main stroke: enters top right, sweeps behind the title to the left margin
    brush([[W * 1.08, hy - 10], [W * .72, hy + hh * .35], [W * .34, hy + hh * .85], [W * .1, hy + hh * 1.5], [W * .04, hy + hh * 2.3]], wide, 11);
    // side stroke on the right, mid page
    brush([[W * 1.1, H * .42], [W * .9, H * .5], [W * .97, H * .64], [W * 1.08, H * .7]], wide * .6, 29);
    // tail near the footer
    brush([[-W * .1, H - 170], [W * .25, H - 120], [W * .55, H - 60], [W * 1.1, H - 110]], wide * .6, 42);
  }

  var tid;
  function layout() { document.querySelectorAll('[data-pk-wordmark]').forEach(spaceWordmark); paint(); }
  function init() {
    insertLayers();
    document.querySelectorAll('[data-pk-wordmark]').forEach(wordmark);
    layout();
    var again = function () { clearTimeout(tid); tid = setTimeout(layout, 120); };
    window.addEventListener('resize', again);
    if (window.ResizeObserver) new ResizeObserver(again).observe(document.body);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  }
  window.Poketto = { repaint: layout };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
