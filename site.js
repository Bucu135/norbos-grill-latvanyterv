/* Norbo's Grill — látványterv · viselkedés */
(function () {
  'use strict';
  var root = document.documentElement;
  var L = window.NG_LOCALE || {};
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nyelv: a magyar alap a HTML-ből jön, így nem csúszhat el a szótártól ---------- */
  var nodes = [].slice.call(document.querySelectorAll('[data-i18n]'));
  var hu = {};
  nodes.forEach(function (n) { var k = n.dataset.i18n; if (!(k in hu)) hu[k] = n.textContent; });
  Object.keys(L.hu_extra || {}).forEach(function (k) { hu[k] = L.hu_extra[k]; });
  var dicts = { hu: hu, ro: L.ro || {}, en: L.en || {} };
  var lang = localStorage.getItem('ng-lang') || 'hu';
  function t(k) { return (dicts[lang] && dicts[lang][k]) || hu[k] || ''; }
  function setLang(l) {
    lang = dicts[l] ? l : 'hu';
    root.lang = lang;
    nodes.forEach(function (n) { var v = t(n.dataset.i18n); if (v) n.textContent = v; });
    document.querySelectorAll('.lang button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.lang === lang)); });
    localStorage.setItem('ng-lang', lang);
    status();
    renderBuilder();
  }
  document.querySelectorAll('.lang button').forEach(function (b) { b.addEventListener('click', function () { setLang(b.dataset.lang); }); });

  /* ---------- élő nyitva/zárva (Europe/Bucharest, 12–20) ---------- */
  var statusEl = document.getElementById('status');
  function status() {
    var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Bucharest', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
    var h = +parts.find(function (p) { return p.type === 'hour'; }).value % 24;
    var key = h >= 12 && h < 20 ? 'st.open' : (h < 12 ? 'st.soon' : 'st.closed');
    statusEl.textContent = t(key);
    document.body.classList.toggle('is-closed', key !== 'st.open');
  }

  /* ---------- fejléc: görgetésre halványít, lefelé elbújik ---------- */
  var hdr = document.getElementById('hdr'), dock = document.querySelector('.dock');
  var lastY = 0, ticking = false, builderSec = document.getElementById('osszerako');
  // a tál-összerakóban mobilon a fejléc és a lebegő gomb félreáll, hogy a serpenyő és a gombok látsszanak
  function inBuilder() { if (!builderSec || innerWidth > 900) return false; var r = builderSec.getBoundingClientRect(); return r.top < innerHeight * .5 && r.bottom > innerHeight * .5; }
  function onScroll() {
    var y = scrollY;
    hdr.classList.toggle('is-scrolled', y > 40);
    var inB = inBuilder();
    hdr.classList.toggle('is-hidden', (inB || (y > 500 && y > lastY)) && !menuOpen);
    dock.classList.toggle('is-on', y > innerHeight * .7 && !inB);
    lastY = y; ticking = false;
    if (!reduce) parallax(y);
  }
  addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });

  /* ---------- nyitókép parallax (csak a kép mozdul) ---------- */
  var heroImg = document.querySelector('.hero-media img'), plateImg = document.querySelector('.hero-plate img');
  function parallax(y) {
    if (y > innerHeight * 1.2) return;
    if (heroImg) heroImg.style.transform = 'translate3d(0,' + (y * .12).toFixed(1) + 'px,0) scale(1.06)';
    if (plateImg) plateImg.style.transform = 'rotate(' + (y * .03).toFixed(2) + 'deg) scale(1.04)';
  }

  /* ---------- mobil menü ---------- */
  var burger = document.querySelector('.burger'), mnav = document.getElementById('mnav'), menuOpen = false;
  function toggleMenu(open) {
    menuOpen = open; burger.setAttribute('aria-expanded', String(open));
    mnav.classList.toggle('is-open', open); mnav.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { toggleMenu(!menuOpen); });
  mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', function () { toggleMenu(false); }); });
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) toggleMenu(false); });

  /* ---------- reveal: be- és kifelé is ---------- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('shown', e.isIntersecting); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  /* ---------- számláló ---------- */
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, to = +el.dataset.to, t0 = null;
      if (reduce) { el.textContent = to; return; }
      (function step(ts) {
        t0 = t0 || ts; var p = Math.min(1, (ts - t0) / 1400), k = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * k);
        if (p < 1) requestAnimationFrame(step);
      })(performance.now());
    });
  }, { threshold: .6 });
  document.querySelectorAll('.count').forEach(function (el) { cio.observe(el); });

  /* ---------- menü-kiemelés görgetés szerint ---------- */
  var navLinks = [].slice.call(document.querySelectorAll('.hdr-nav a'));
  var sio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['talak', 'helyszinek', 'norbo', 'csapat', 'kapcsolat'].forEach(function (id) { var s = document.getElementById(id); if (s) sio.observe(s); });

  /* ---------- csapatasztal-űrlap (látványterv: nem küld) ---------- */
  var form = document.getElementById('crew-form'), note = form.querySelector('.form-note');
  var d = new Date(Date.now() + 864e5 * 3); form.datum.value = d.toISOString().slice(0, 10); form.datum.min = new Date().toISOString().slice(0, 10);
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var bad = false;
    [form.nev, form.tel, form.datum, form.fo].forEach(function (f) { var ok = f.checkValidity() && f.value.trim() !== ''; f.setAttribute('aria-invalid', String(!ok)); if (!ok) bad = true; });
    note.textContent = t(bad ? 'form.err' : 'form.ok');
  });

  /* ---------- tál-összerakó ---------- */
  var pan = document.getElementById('pan');
  var foBtns = [].slice.call(document.querySelectorAll('#seg-fo button')), chipBtns = [].slice.call(document.querySelectorAll('#chips button'));
  var sumEl = document.getElementById('builder-sum'), sendBtn = document.getElementById('builder-send');
  var steam = pan && pan.querySelector('.steam');
  var SIZE = { 2: .66, 4: .8, 6: .9, 8: 1 }, filled = false, thudT;
  function fo() { var b = foBtns.filter(function (x) { return x.getAttribute('aria-pressed') === 'true'; })[0]; return b ? +b.dataset.fo : 4; }
  function picked() { return chipBtns.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }); }
  function fill(s, n, list) { return s.replace('{n}', n === 8 ? '8+' : n).replace('{list}', list); }
  function ingOf(b) { return pan.querySelector('.ing[data-ing="' + b.dataset.i18n.slice(2) + '"]'); }
  // ha valami bekerül: a serpenyő megrezzen és gőzölög
  function sizzle() {
    if (reduce) return;
    clearTimeout(thudT);
    pan.classList.remove('thud'); steam.classList.remove('go'); void pan.offsetWidth;
    thudT = setTimeout(function () { pan.classList.add('thud'); steam.classList.add('go'); }, 380);
  }
  function renderBuilder() {
    if (!pan) return;
    var n = fo(), items = picked(), names = items.map(function (b) { return b.textContent; });
    pan.parentNode.style.setProperty('--size', SIZE[n]);
    document.getElementById('pan-fo').textContent = n === 8 ? '8+' : n;
    if (filled) chipBtns.forEach(function (b) { var g = ingOf(b); if (g) g.classList.toggle('on', b.getAttribute('aria-pressed') === 'true'); });
    sumEl.innerHTML = items.length ? fill(t('b.sum'), n, '<b>' + names.join(', ') + '</b>') : t('b.empty');
    sendBtn.setAttribute('aria-disabled', String(!items.length));
  }
  // első érkezéskor a kiválasztott hozzávalók egymás után beesnek
  if (pan) new IntersectionObserver(function (es, o) {
    if (!es[0].isIntersecting) return;
    o.disconnect(); filled = true;
    picked().forEach(function (b, i) { setTimeout(function () { var g = ingOf(b); if (g && b.getAttribute('aria-pressed') === 'true') g.classList.add('on'); }, reduce ? 0 : 250 + i * 280); });
    setTimeout(sizzle, reduce ? 0 : 250 + picked().length * 280);
  }, { threshold: .45 }).observe(pan);
  foBtns.forEach(function (b) { b.addEventListener('click', function () { foBtns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); renderBuilder(); }); });
  chipBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      var on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on));
      filled = true; renderBuilder();
      if (on) sizzle();
    });
  });
  sendBtn.addEventListener('click', function (e) {
    var items = picked();
    if (!items.length) { e.preventDefault(); return; }
    var msg = fill(t('b.msg'), fo(), items.map(function (b) { return b.textContent.toLowerCase(); }).join(', '));
    if (navigator.clipboard) navigator.clipboard.writeText(msg).then(function () { sumEl.textContent = t('b.copied'); }, function () {});
  });

  /* ---------- parázs a nyitóképen (csak ha látszik) ---------- */
  var cv = document.querySelector('.embers');
  if (cv && !reduce) {
    var cx = cv.getContext('2d'), sparks = [], W = 0, H = 0, run = false, dpr = Math.min(2, devicePixelRatio || 1);
    var COUNT = innerWidth < 700 ? 22 : 46;
    function size() { W = cv.offsetWidth; H = cv.offsetHeight; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    function spawn(s, fresh) {
      s.x = W * (.35 + Math.random() * .6); s.y = fresh ? Math.random() * H : H + 10;
      s.vy = .35 + Math.random() * .9; s.vx = (Math.random() - .5) * .3; s.r = .8 + Math.random() * 2;
      s.life = 0; s.max = 260 + Math.random() * 320; s.ph = Math.random() * 6.28; return s;
    }
    function frame() {
      if (!run) return;
      cx.clearRect(0, 0, W, H); cx.globalCompositeOperation = 'lighter';
      sparks.forEach(function (s) {
        s.life++; s.y -= s.vy; s.x += s.vx + Math.sin((s.life + s.ph * 40) / 40) * .35;
        var k = s.life / s.max, a = k < .15 ? k / .15 : 1 - (k - .15) / .85;
        if (k >= 1 || s.y < -10) spawn(s, false);
        var g = cx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        g.addColorStop(0, 'rgba(255,214,140,' + (a * .95).toFixed(3) + ')');
        g.addColorStop(.35, 'rgba(240,140,40,' + (a * .55).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(200,70,10,0)');
        cx.fillStyle = g; cx.beginPath(); cx.arc(s.x, s.y, s.r * 4, 0, 6.283); cx.fill();
      });
      requestAnimationFrame(frame);
    }
    size(); for (var i = 0; i < COUNT; i++) sparks.push(spawn({}, true));
    addEventListener('resize', size);
    new IntersectionObserver(function (es) { var on = es[0].isIntersecting && !document.hidden; if (on && !run) { run = true; requestAnimationFrame(frame); } else if (!on) run = false; }).observe(cv);
  }

  setLang(lang);
  onScroll();
})();
