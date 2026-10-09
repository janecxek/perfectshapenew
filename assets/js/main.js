/* Perfect Shape Zürich – Interaktionen (Lenis für Smooth-Scroll, sonst ohne Abhängigkeiten) */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || doc).querySelectorAll(sel)); };

  /* ---------- Smooth Scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    try {
      lenis = new window.Lenis({ duration: 1.15, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }, smoothWheel: true });
      var raf = function (time) { lenis.raf(time); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    } catch (e) { lenis = null; }
  }
  function stopScroll() { if (lenis) lenis.stop(); doc.body.classList.add('menu-open'); }
  function startScroll() { if (lenis) lenis.start(); doc.body.classList.remove('menu-open'); }
  function headerOffset() { return (($('.hdr') || {}).offsetHeight || 0) + (($('.toc') || {}).offsetHeight || 0) + 16; }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -headerOffset(), duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - headerOffset(), behavior: reduceMotion ? 'auto' : 'smooth' });
  }
  doc.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a[href^="#"]') : null;
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var el = doc.getElementById(decodeURIComponent(id.slice(1)));
    if (!el) return;
    e.preventDefault();
    scrollToEl(el);
    if (history.replaceState) history.replaceState(null, '', id);
  });
  if (location.hash && location.hash.length > 1) {
    window.addEventListener('load', function () {
      var el = doc.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) setTimeout(function () { scrollToEl(el); }, 60);
    });
  }

  /* ---------- Header, Aktionsleiste, Parallax ---------- */
  var hdr = $('.hdr');
  var mbar = $('.mbar');
  var heroPar = $('[data-hero-parallax]');
  var hero = $('.hero');
  var bands = $$('[data-parallax]');
  var lastY = 0;
  function onFrame() {
    var y = window.pageYOffset || root.scrollTop;
    var vh = window.innerHeight;
    if (hdr) {
      var solidAt = doc.body.classList.contains('has-hero') ? 40 : 0;
      hdr.classList.toggle('is-solid', y > solidAt || !doc.body.classList.contains('has-hero'));
      var hide = y > vh && y > lastY + 2 && !doc.body.classList.contains('menu-open');
      if (y < lastY - 2 || y < vh) hide = false;
      if (Math.abs(y - lastY) > 2) hdr.classList.toggle('is-hidden', hide);
    }
    if (mbar) mbar.classList.toggle('is-visible', y > vh * 0.6);
    if (!reduceMotion) {
      if (heroPar && hero && y < hero.offsetHeight) heroPar.style.transform = 'translate3d(0,' + (y * 0.28).toFixed(1) + 'px,0)';
      for (var i = 0; i < bands.length; i++) {
        var r = bands[i].parentNode.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) continue;
        var p = (r.top + r.height / 2 - vh / 2) / (vh + r.height);
        bands[i].style.transform = 'translate3d(0,' + (p * -18).toFixed(2) + '%,0)';
      }
    }
    lastY = y;
  }
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { onFrame(); words(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', onFrame);

  /* ---------- Text Wort für Wort einblenden ---------- */
  var wordEls = $$('[data-words]');
  wordEls.forEach(function (el) {
    if (reduceMotion) return;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = doc.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(doc.createTextNode(part)); return; }
            var s = doc.createElement('span'); s.className = 'w'; s.textContent = part; frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    el._w = $$('.w', el);
  });
  function words() {
    var vh = window.innerHeight;
    wordEls.forEach(function (el) {
      if (!el._w) return;
      var r = el.getBoundingClientRect();
      var p = (vh * 0.88 - r.top) / (r.height + vh * 0.35);
      p = Math.max(0, Math.min(1, p));
      var n = Math.round(p * el._w.length);
      for (var i = 0; i < el._w.length; i++) el._w[i].classList.toggle('on', i < n);
    });
  }
  onFrame(); words();

  /* ---------- Mobile Navigation ---------- */
  var burger = $('.burger');
  var mnav = $('#mnav');
  function setMenu(open) {
    if (!burger || !mnav) return;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', burger.getAttribute(open ? 'data-label-close' : 'data-label-open') || '');
    if (open) {
      mnav.hidden = false;
      stopScroll();
      if (hdr) hdr.classList.remove('is-hidden');
      requestAnimationFrame(function () { requestAnimationFrame(function () { mnav.classList.add('is-open'); }); });
    } else {
      mnav.classList.remove('is-open');
      startScroll();
      setTimeout(function () { if (!mnav.classList.contains('is-open')) mnav.hidden = true; }, reduceMotion ? 0 : 700);
    }
  }
  if (burger) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    window.addEventListener('resize', function () { if (window.innerWidth > 1024 && burger.getAttribute('aria-expanded') === 'true') setMenu(false); });
  }

  /* ---------- Mega-Menü (Desktop) ---------- */
  $$('.has-mega').forEach(function (item) {
    var link = $('.nav__link', item);
    function state(open) { link.setAttribute('aria-expanded', String(open)); }
    item.addEventListener('mouseenter', function () { item.classList.remove('is-closed'); state(true); });
    item.addEventListener('mouseleave', function () { state(false); });
    item.addEventListener('focusin', function () { item.classList.remove('is-closed'); state(true); });
    item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) state(false); });
    item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { item.classList.add('is-closed'); state(false); link.focus(); } });
  });

  /* ---------- Reveal beim Scrollen ---------- */
  var revealEls = $$('[data-reveal]');
  var io = null;
  function reveal(el) { el.classList.add('is-in'); if (io) io.unobserve(el); }
  if ('IntersectionObserver' in window && !reduceMotion) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) reveal(en.target); });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.01 });
    revealEls.forEach(function (el) { io.observe(el); });
    var pending = false;
    var sweep = function () {
      pending = false;
      var vh = window.innerHeight;
      revealEls = revealEls.filter(function (el) {
        if (el.classList.contains('is-in')) return false;
        if (el.getBoundingClientRect().top < vh * 0.92) { reveal(el); return false; }
        return true;
      });
      if (!revealEls.length) window.removeEventListener('scroll', onSweep);
    };
    var onSweep = function () { if (!pending) { pending = true; setTimeout(sweep, 150); } };
    window.addEventListener('scroll', onSweep, { passive: true });
    window.addEventListener('load', sweep);
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Behandlungsliste: Bildvorschau ---------- */
  $$('[data-tl-list]').forEach(function (list) {
    var rows = $$('.tl__row', list);
    var imgs = $$('[data-tl-img]', list);
    if (!imgs.length) return;
    function show(i) {
      rows.forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-tl') === String(i)); });
      imgs.forEach(function (f) { f.classList.toggle('is-active', f.getAttribute('data-tl-img') === String(i)); });
    }
    rows.forEach(function (r) {
      var i = r.getAttribute('data-tl');
      r.addEventListener('mouseenter', function () { show(i); });
      r.addEventListener('focus', function () { show(i); });
    });
  });

  /* ---------- Bewertungs-Slider ---------- */
  $$('[data-slider]').forEach(function (slider) {
    var slides = $$('.review', slider);
    var cur = $('[data-current]', slider);
    var i = 0, timer = null;
    if (slides.length < 2) return;
    function go(n) {
      slides[i].classList.remove('is-active'); slides[i].setAttribute('aria-hidden', 'true');
      i = (n + slides.length) % slides.length;
      slides[i].classList.add('is-active'); slides[i].setAttribute('aria-hidden', 'false');
      if (cur) cur.textContent = i + 1;
    }
    function auto() { if (reduceMotion) return; clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 9000); }
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
        anim = body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 380, easing: 'cubic-bezier(.22,.61,.36,1)' });
        anim.onfinish = function () { det.open = false; anim = null; if (lenis) lenis.resize(); };
      } else {
        det.open = true;
        anim = body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 480, easing: 'cubic-bezier(.16,1,.3,1)' });
        anim.onfinish = function () { anim = null; if (lenis) lenis.resize(); };
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
    stopScroll();
    setTimeout(function () { var c = $('.modal__close', modal); if (c) c.focus(); }, 30);
    return true;
  }
  function closeBooking() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    if (!mnav || mnav.hidden) startScroll();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  doc.addEventListener('click', function (e) {
    var trigger = e.target.closest ? e.target.closest('[data-book]') : null;
    if (trigger) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      if (mnav && !mnav.hidden) setMenu(false);
      if (openBooking()) e.preventDefault();
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
      f.title = box.getAttribute('data-map-title') || 'Google Maps';
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      f.setAttribute('allowfullscreen', '');
      f.setAttribute('data-lenis-prevent', '');
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
    var ids = Object.keys(map);
    if (ids.length) {
      var tio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (a) { a.classList.remove('is-active'); });
          var a = map[en.target.id];
          if (a) {
            a.classList.add('is-active');
            var bar = a.parentNode;
            if (bar.scrollTo) bar.scrollTo({ left: a.offsetLeft - bar.clientWidth / 2 + a.clientWidth / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
          }
        });
      }, { rootMargin: '-35% 0px -60% 0px' });
      ids.forEach(function (id) { tio.observe(doc.getElementById(id)); });
      var firstSec = doc.getElementById(ids[0]);
      window.addEventListener('scroll', function () {
        if (firstSec.getBoundingClientRect().top > window.innerHeight * 0.4) links.forEach(function (l) { l.classList.remove('is-active'); });
      }, { passive: true });
    }
  }

  /* ---------- Kontaktformular ---------- */
  var form = $('#contactForm');
  if (form) {
    var status = $('.form__status', form);
    var isEn = form.getAttribute('data-lang') === 'en';
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
        status.textContent = isEn ? 'Please fill in all required fields (*) correctly.' : 'Bitte füllen Sie alle Pflichtfelder (*) korrekt aus.';
        status.className = 'form__status is-error';
        return;
      }
      var d = new FormData(form);
      var topic = d.get('topic') || (isEn ? 'General enquiry' : 'Allgemeine Anfrage');
      var body = 'Name: ' + d.get('name') + '\nE-Mail: ' + d.get('email') + '\n' + (isEn ? 'Phone' : 'Telefon') + ': ' + (d.get('phone') || '–') + '\n' + (isEn ? 'Treatment' : 'Behandlung') + ': ' + topic + '\n\n' + d.get('message');
      window.location.href = 'mailto:' + form.getAttribute('data-mailto') + '?subject=' + encodeURIComponent((isEn ? 'Website enquiry – ' : 'Anfrage Website – ') + topic) + '&body=' + encodeURIComponent(body);
      status.textContent = isEn ? 'Your email app has been opened – please send the message from there. You can also reach us by phone.' : 'Ihr E-Mail-Programm wurde geöffnet – bitte senden Sie die Nachricht dort ab. Alternativ erreichen Sie uns telefonisch.';
      status.className = 'form__status is-ok';
    });
    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('.field') || e.target.closest('.check');
      if (wrap) wrap.classList.remove('is-invalid');
    });
  }

  /* ---------- Logo: auf derselben Seite sanft nach oben ---------- */
  $$('[data-top]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;
      var target = a.pathname.replace(/\/$/, '') || '/';
      var here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
      if (target === here) {
        e.preventDefault();
        if (burger && burger.getAttribute('aria-expanded') === 'true') setMenu(false);
        if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', location.pathname);
      }
    });
  });

  /* ---------- Sprachumschalter: Animation vor dem Seitenwechsel ---------- */
  $$('.lang').forEach(function (sw) {
    $$('a', sw).forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (e.metaKey || e.ctrlKey || e.shiftKey || a.hasAttribute('aria-current')) { if (a.hasAttribute('aria-current')) e.preventDefault(); return; }
        e.preventDefault();
        sw.setAttribute('data-active', a.getAttribute('data-lang'));
        $$('a', sw).forEach(function (x) { x.removeAttribute('aria-current'); });
        a.setAttribute('aria-current', 'true');
        try { localStorage.setItem('ps-lang', a.getAttribute('data-lang')); } catch (err) {}
        setTimeout(function () { location.href = a.href; }, reduceMotion ? 0 : 260);
      });
    });
  });

  /* ---------- Jahr im Footer ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
  if (!finePointer) root.classList.add('touch');
})();
