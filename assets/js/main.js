/* Perfect Shape Zürich – Interaktionen (ohne Abhängigkeiten) */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- Header-Zustand & mobile Aktionsleiste ---------- */
  var hdr = $('.hdr');
  var mbar = $('.mbar');
  var ticking = false;
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (hdr) hdr.classList.toggle('is-scrolled', y > 10);
    if (mbar) mbar.classList.toggle('is-visible', y > 480);
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* ---------- Mobile Navigation ---------- */
  var burger = $('.burger');
  var mnav = $('#mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Menü schliessen' : 'Menü öffnen');
    doc.body.classList.toggle('menu-open', open);
    if (open) {
      mnav.hidden = false;
      requestAnimationFrame(function () { requestAnimationFrame(function () { mnav.classList.add('is-open'); }); });
    } else {
      mnav.classList.remove('is-open');
      setTimeout(function () { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, reduceMotion ? 0 : 350);
    }
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024) setMenu(false); });
  }

  /* ---------- Mega-Menü (Desktop) ---------- */
  $$('.has-mega').forEach(function (item) {
    var link = $('.nav__link', item);
    function state(open) { link.setAttribute('aria-expanded', String(open)); }
    item.addEventListener('mouseenter', function () { item.classList.remove('is-closed'); state(true); });
    item.addEventListener('mouseleave', function () { state(false); });
    item.addEventListener('focusin', function () { item.classList.remove('is-closed'); state(true); });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) state(false); });
    item.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { item.classList.add('is-closed'); state(false); link.focus(); }
    });
  });

  /* ---------- Reveal beim Scrollen ---------- */
  var revealEls = $$('[data-reveal]');
  function reveal(el) { el.classList.add('is-in'); if (io) io.unobserve(el); }
  var io = null;
  if ('IntersectionObserver' in window && !reduceMotion) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) reveal(en.target); });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    revealEls.forEach(function (el) { io.observe(el); });
    // Sicherheitsnetz: alles, was bereits oberhalb/innerhalb des Viewports liegt (z. B. nach Sprung zu einem Anker), sofort zeigen
    var pending = false;
    var sweep = function () {
      pending = false;
      var vh = window.innerHeight;
      revealEls = revealEls.filter(function (el) {
        if (el.classList.contains('is-in')) return false;
        if (el.getBoundingClientRect().top < vh * 0.94) { reveal(el); return false; }
        return true;
      });
      if (!revealEls.length) window.removeEventListener('scroll', onSweep);
    };
    var onSweep = function () { if (!pending) { pending = true; setTimeout(sweep, 120); } };
    window.addEventListener('scroll', onSweep, { passive: true });
    window.addEventListener('load', sweep);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Zähler ---------- */
  var counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window && !reduceMotion) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, end = parseInt(el.getAttribute('data-count'), 10), t0 = null;
        cio.unobserve(el);
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 1400, 1);
          el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  /* ---------- Behandlungs-Filter ---------- */
  var grid = $('[data-filter-grid]');
  if (grid) {
    var chips = $$('[data-filter]');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var f = chip.getAttribute('data-filter');
        chips.forEach(function (c) {
          var on = c === chip;
          c.classList.toggle('is-active', on);
          c.setAttribute('aria-pressed', String(on));
        });
        $$('.tcard', grid).forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-cat') === f;
          card.classList.toggle('is-hidden', !show);
          if (show && !reduceMotion && card.animate) {
            card.classList.add('is-in');
            card.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: 500, easing: 'cubic-bezier(.2,.7,.1,1)' });
          }
        });
      });
    });
  }

  /* ---------- Bewertungs-Slider ---------- */
  $$('[data-slider]').forEach(function (slider) {
    var slides = $$('.review', slider);
    var cur = $('[data-current]', slider);
    var i = 0, timer = null;
    if (slides.length < 2) return;
    function go(n) {
      slides[i].classList.remove('is-active');
      slides[i].setAttribute('aria-hidden', 'true');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active');
      slides[i].setAttribute('aria-hidden', 'false');
      if (cur) cur.textContent = i + 1;
    }
    function auto() { if (reduceMotion) return; clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 8000); }
    $('[data-next]', slider).addEventListener('click', function () { go(i + 1); auto(); });
    $('[data-prev]', slider).addEventListener('click', function () { go(i - 1); auto(); });
    slider.addEventListener('mouseenter', function () { clearInterval(timer); });
    slider.addEventListener('mouseleave', auto);
    var x0 = null;
    slider.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    slider.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) { go(dx < 0 ? i + 1 : i - 1); auto(); }
      x0 = null;
    });
    auto();
  });

  /* ---------- FAQ: weiches Auf- und Zuklappen ---------- */
  $$('.faq__item').forEach(function (det) {
    var sum = $('summary', det), body = $('.faq__a', det), anim = null;
    if (!sum || !body || reduceMotion || !body.animate) return;
    sum.addEventListener('click', function (e) {
      e.preventDefault();
      if (anim) anim.cancel();
      if (det.open) {
        var h = body.offsetHeight;
        anim = body.animate([{ height: h + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease' });
        det.classList.add('is-closing');
        anim.onfinish = function () { det.open = false; det.classList.remove('is-closing'); anim = null; };
      } else {
        det.open = true;
        var full = body.offsetHeight;
        anim = body.animate([{ height: '0px', opacity: 0 }, { height: full + 'px', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.7,.1,1)' });
        anim.onfinish = function () { anim = null; };
      }
    });
  });

  /* ---------- Buchungs-Modal (TIMIFY) ---------- */
  var modal = $('#booking');
  var lastFocus = null;
  function openBooking() {
    if (!modal) return false;
    var frame = $('iframe', modal);
    var loader = $('.modal__loader', modal);
    if (frame && !frame.getAttribute('src')) {
      frame.addEventListener('load', function () { if (loader) loader.hidden = true; }, { once: true });
      frame.setAttribute('src', frame.getAttribute('data-src'));
    }
    lastFocus = doc.activeElement;
    modal.hidden = false;
    doc.body.classList.add('menu-open');
    setTimeout(function () { var c = $('.modal__close', modal); if (c) c.focus(); }, 30);
    return true;
  }
  function closeBooking() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (!mnav || mnav.hidden) doc.body.classList.remove('menu-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  doc.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('[data-book]') : null;
    if (trigger) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      if (openBooking()) { e.preventDefault(); if (mnav && !mnav.hidden) setMenu(false); }
      return;
    }
    if (e.target.closest && e.target.closest('[data-close]')) closeBooking();
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (modal && !modal.hidden) closeBooking();
      else if (burger && burger.getAttribute('aria-expanded') === 'true') { setMenu(false); burger.focus(); }
    }
    if (e.key === 'Tab' && modal && !modal.hidden) {
      var f = $$('a[href], button, iframe', modal).filter(function (el) { return el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Google Maps erst nach Klick laden ---------- */
  $$('[data-map]').forEach(function (box) {
    var btn = $('[data-map-load]', box);
    if (!btn) return;
    btn.addEventListener('click', function () {
      var f = doc.createElement('iframe');
      f.src = box.getAttribute('data-map');
      f.title = 'Google Maps – Perfect Shape Zürich, Bahnhofstrasse 94';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      box.appendChild(f);
      var ph = $('.map__ph', box);
      if (ph) ph.remove();
    });
  });

  /* ---------- Inhaltsnavigation: aktiver Abschnitt ---------- */
  var toc = $('.toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = $$('a[href^="#"]', toc);
    var map = {};
    links.forEach(function (a) { var s = doc.getElementById(a.getAttribute('href').slice(1)); if (s) map[s.id] = a; });
    var tio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        var a = map[en.target.id];
        if (a) {
          a.classList.add('is-active');
          var bar = a.parentNode;
          var left = a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2;
          if (bar.scrollTo) bar.scrollTo({ left: left, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    Object.keys(map).forEach(function (id) { tio.observe(doc.getElementById(id)); });
    var firstSec = doc.getElementById(Object.keys(map)[0]);
    window.addEventListener('scroll', function () {
      if (firstSec && firstSec.getBoundingClientRect().top > window.innerHeight * 0.4) links.forEach(function (l) { l.classList.remove('is-active'); });
    }, { passive: true });
  }

  /* ---------- Kontaktformular ---------- */
  var form = $('#contactForm');
  if (form) {
    var status = $('.form__status', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('[required]', form).forEach(function (el) {
        var wrap = el.closest('.field') || el.closest('.check');
        var valid = el.type === 'checkbox' ? el.checked : el.value.trim() !== '' && (el.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(el.value.trim()));
        if (wrap) wrap.classList.toggle('is-invalid', !valid);
        if (!valid && ok) { ok = false; el.focus(); }
      });
      if (!ok) {
        status.textContent = 'Bitte füllen Sie alle Pflichtfelder (*) korrekt aus.';
        status.className = 'form__status is-error';
        return;
      }
      var d = new FormData(form);
      var topic = d.get('topic') || 'Allgemeine Anfrage';
      var body = 'Name: ' + d.get('name') + '\nE-Mail: ' + d.get('email') + '\nTelefon: ' + (d.get('phone') || '–') + '\nBehandlung: ' + topic + '\n\n' + d.get('message');
      window.location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent('Anfrage Website – ' + topic) + '&body=' + encodeURIComponent(body);
      status.textContent = 'Ihr E-Mail-Programm wurde geöffnet – bitte senden Sie die Nachricht dort ab. Alternativ erreichen Sie uns telefonisch.';
      status.className = 'form__status is-ok';
    });
    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field') || e.target.closest('.check');
      if (wrap) wrap.classList.remove('is-invalid');
    });
  }

  /* ---------- Jahr im Footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
