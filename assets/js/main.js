/* Perfect Shape Zürich – Interaktionen (Lenis für Smooth-Scroll, sonst ohne Abhängigkeiten)
   Jede Seite enthält zwei Sprachebenen (.lp--de / .lp--en). Alle Komponenten werden pro Ebene initialisiert;
   globale Ereignisse (Scroll, Tastatur) werden an die gerade sichtbare Ebene weitergereicht. */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

  /* ---------- Sprachebenen ---------- */
  var paneEls = $$('.lp');
  if (!paneEls.length) paneEls = [doc.body];
  var lang = function () { return root.classList.contains('lang-en') ? 'en' : 'de'; };
  var panes = {};
  function activePane() { return panes[lang()] || panes.de || panes[Object.keys(panes)[0]]; }

  function headerOffset() {
    var P = activePane().el;
    return (($('.hdr', P) || {}).offsetHeight || 0) + (($('.toc', P) || {}).offsetHeight || 0) + 16;
  }
  function scrollToEl(el) {
    if (lenis) lenis.scrollTo(el, { offset: -headerOffset(), duration: 1.4 });
    else window.scrollTo({ top: el.getBoundingClientRect().top + window.pageYOffset - headerOffset(), behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function initPane(P, key) {
    var api = { el: P };
    var hdr = $('.hdr', P);
    var mbar = $('.mbar', P);
    var heroPar = $('[data-hero-parallax]', P);
    var hero = $('.hero', P);
    var bands = $$('[data-parallax]', P);
    var lastY = window.pageYOffset;

    api.frame = function () {
      var y = window.pageYOffset || root.scrollTop;
      var vh = window.innerHeight;
      var hasHero = doc.body.classList.contains('has-hero');
      if (hdr) {
        hdr.classList.toggle('is-solid', !hasHero || y > 40);
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
      api.words();
    };

    /* Wort-für-Wort */
    var wordEls = $$('[data-words]', P);
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
    api.words = function () {
      var vh = window.innerHeight;
      wordEls.forEach(function (el) {
        if (!el._w) return;
        var r = el.getBoundingClientRect();
        var p = Math.max(0, Math.min(1, (vh * 0.88 - r.top) / (r.height + vh * 0.35)));
        var n = Math.round(p * el._w.length);
        for (var i = 0; i < el._w.length; i++) el._w[i].classList.toggle('on', i < n);
      });
    };

    /* Mobile Navigation */
    var burger = $('.burger', P);
    var mnav = $('.mnav', P);
    api.setMenu = function (open) {
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
    };
    api.menuOpen = function () { return !!burger && burger.getAttribute('aria-expanded') === 'true'; };
    if (burger) {
      burger.addEventListener('click', function () { api.setMenu(!api.menuOpen()); });
      $$('a', mnav).forEach(function (a) { a.addEventListener('click', function () { api.setMenu(false); }); });
    }

    /* Mega-Menü */
    $$('.has-mega', P).forEach(function (item) {
      var link = $('.nav__link', item);
      var state = function (open) { link.setAttribute('aria-expanded', String(open)); };
      item.addEventListener('mouseenter', function () { item.classList.remove('is-closed'); state(true); });
      item.addEventListener('mouseleave', function () { state(false); });
      item.addEventListener('focusin', function () { item.classList.remove('is-closed'); state(true); });
      item.addEventListener('focusout', function (e) { if (!item.contains(e.relatedTarget)) state(false); });
      item.addEventListener('keydown', function (e) { if (e.key === 'Escape') { item.classList.add('is-closed'); state(false); link.focus(); } });
    });

    /* Behandlungsliste: Bildvorschau */
    $$('[data-tl-list]', P).forEach(function (list) {
      var rows = $$('.tl__row', list);
      var imgs = $$('[data-tl-img]', list);
      if (!imgs.length) return;
      var show = function (i) {
        rows.forEach(function (r) { r.classList.toggle('is-active', r.getAttribute('data-tl') === String(i)); });
        imgs.forEach(function (f) { f.classList.toggle('is-active', f.getAttribute('data-tl-img') === String(i)); });
      };
      rows.forEach(function (r) {
        var i = r.getAttribute('data-tl');
        r.addEventListener('mouseenter', function () { show(i); });
        r.addEventListener('focus', function () { show(i); });
      });
    });

    /* Kategorien: aufklappen (immer nur eine offen) */
    $$('[data-cats]', P).forEach(function (wrap) {
      var cats = $$('.cat', wrap);
      var set = function (cat, open) {
        cat.classList.toggle('is-open', open);
        $('.cat__btn', cat).setAttribute('aria-expanded', String(open));
      };
      cats.forEach(function (cat) {
        var btn = $('.cat__btn', cat);
        var panel = $('.cat__panel', cat);
        btn.addEventListener('click', function () {
          var open = !cat.classList.contains('is-open');
          var before = btn.getBoundingClientRect().top;
          cats.forEach(function (c) { if (c !== cat) set(c, false); });
          set(cat, open);
          panel.addEventListener('transitionend', function done(e) {
            if (e.target !== panel) return;
            panel.removeEventListener('transitionend', done);
            if (lenis) lenis.resize();
          });
          // Wenn eine Kategorie darüber zuklappt, Position halten bzw. sanft nachführen
          if (open) setTimeout(function () {
            var top = btn.getBoundingClientRect().top;
            if (top < headerOffset() || top > window.innerHeight * .6) scrollToEl(cat);
          }, before < headerOffset() ? 0 : 720);
        });
      });
    });

    /* Studio: Hintergrundbilder überblenden */
    $$('[data-studio]', P).forEach(function (sec) {
      var slides = $$('[data-slide]', sec), dots = $$('[data-dot]', sec);
      var i = 0, timer = null, visible = false, T = 6000;
      sec.style.setProperty('--studio-t', T + 'ms');
      var go = function (n) {
        slides[i].classList.remove('is-active'); dots[i].classList.remove('is-active'); dots[i].setAttribute('aria-pressed', 'false');
        i = (n + slides.length) % slides.length;
        slides[i].classList.add('is-active'); dots[i].classList.add('is-active'); dots[i].setAttribute('aria-pressed', 'true');
        // Fortschrittsbalken neu starten
        var bar = $('i', dots[i]); bar.style.display = 'none'; void bar.offsetWidth; bar.style.display = '';
      };
      var stop = function () { clearInterval(timer); timer = null; sec.classList.add('is-paused'); };
      var start = function () {
        if (reduceMotion || timer || !visible) return;
        sec.classList.remove('is-paused');
        timer = setInterval(function () { go(i + 1); }, T);
      };
      dots.forEach(function (d, k) { d.addEventListener('click', function () { stop(); go(k); start(); }); });
      if (reduceMotion) sec.classList.add('is-paused');
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) {
          visible = es[0].isIntersecting;
          if (visible) { go(i); start(); } else stop();
        }, { threshold: 0.25 }).observe(sec);
      } else { visible = true; start(); }
    });

    /* Bewertungs-Slider */
    $$('[data-slider]', P).forEach(function (slider) {
      var slides = $$('.review', slider);
      var cur = $('[data-current]', slider);
      var i = 0, timer = null;
      if (slides.length < 2) return;
      var go = function (n) {
        slides[i].classList.remove('is-active'); slides[i].setAttribute('aria-hidden', 'true');
        i = (n + slides.length) % slides.length;
        slides[i].classList.add('is-active'); slides[i].setAttribute('aria-hidden', 'false');
        if (cur) cur.textContent = i + 1;
      };
      var auto = function () { if (reduceMotion) return; clearInterval(timer); timer = setInterval(function () { if (lang() === key) go(i + 1); }, 9000); };
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

    /* FAQ */
    $$('.faq__item', P).forEach(function (det) {
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

    /* Buchungs-Modal */
    var modal = $('.modal', P);
    var lastFocus = null;
    api.openBooking = function () {
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
    };
    api.closeBooking = function () {
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      if (!api.menuOpen()) startScroll();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    };
    api.keydown = function (e) {
      if (e.key === 'Escape') {
        if (modal && !modal.hidden) api.closeBooking();
        else if (api.menuOpen()) { api.setMenu(false); burger.focus(); }
      }
      if (e.key === 'Tab' && modal && !modal.hidden) {
        var f = $$('a[href], button, iframe', modal).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    /* Google Maps erst nach Klick */
    $$('[data-map]', P).forEach(function (box) {
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

    /* Inhaltsnavigation */
    var toc = $('.toc', P);
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

    /* Kontaktformular */
    var form = $('form.form', P);
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

    return api;
  }

  paneEls.forEach(function (el) { panes[el.getAttribute('data-pane') || 'de'] = initPane(el, el.getAttribute('data-pane') || 'de'); });

  /* ---------- Globale Ereignisse → sichtbare Ebene ---------- */
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(function () { activePane().frame(); ticking = false; }); }
  }, { passive: true });
  window.addEventListener('resize', function () {
    activePane().frame();
    if (window.innerWidth > 1024) Object.keys(panes).forEach(function (k) { if (panes[k].menuOpen()) panes[k].setMenu(false); });
  });
  doc.addEventListener('keydown', function (e) { activePane().keydown(e); });

  doc.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    var lpEl = e.target.closest('.lp');
    var pane = (lpEl && panes[lpEl.getAttribute('data-pane')]) || activePane();
    // Buchung
    var trigger = e.target.closest('[data-book]');
    if (trigger) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
      if (pane.menuOpen()) pane.setMenu(false);
      if (pane.openBooking()) e.preventDefault();
      return;
    }
    if (e.target.closest('[data-close]')) { pane.closeBooking(); return; }
    // Logo → nach oben
    var top = e.target.closest('[data-top]');
    if (top && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
      var target = top.pathname.replace(/\/$/, '') || '/';
      var here = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
      if (target === here) {
        e.preventDefault();
        if (pane.menuOpen()) pane.setMenu(false);
        if (lenis) lenis.scrollTo(0, { duration: 1.4 }); else window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      return;
    }
    // Sprachumschalter
    var sw = e.target.closest('[data-set-lang]');
    if (sw) { setLang(sw.getAttribute('data-set-lang')); return; }
    // Anker
    var a = e.target.closest('a[href^="#"]');
    if (a) {
      var id = a.getAttribute('href');
      if (id.length < 2) return;
      var el = doc.getElementById(decodeURIComponent(id.slice(1)));
      if (!el) return;
      e.preventDefault();
      scrollToEl(el);
    }
  });

  /* ---------- Sprache wechseln (auf derselben Seite) ---------- */
  function applyMeta(l) {
    root.lang = l === 'en' ? 'en' : 'de-CH';
    var t = root.getAttribute('data-title-' + l);
    var d = root.getAttribute('data-desc-' + l);
    if (t) doc.title = t;
    var m = $('meta[name="description"]');
    if (m && d) m.setAttribute('content', d);
  }
  function syncPanes(l) {
    paneEls.forEach(function (el) {
      if (!el.getAttribute('data-pane')) return;
      var off = el.getAttribute('data-pane') !== l;
      el.hidden = off;
      var m = el.querySelector('main');
      if (m) m.hidden = off;
    });
  }
  function syncSwitches(l) {
    $$('.lang').forEach(function (g) {
      g.setAttribute('data-active', l);
      $$('[data-set-lang]', g).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-set-lang') === l)); });
    });
  }
  function setLang(l) {
    if (l === lang()) return;
    var from = activePane();
    if (from.menuOpen()) from.setMenu(false);
    syncSwitches(l);
    try { localStorage.setItem('ps-lang', l); } catch (err) {}
    var swap = function () {
      root.classList.toggle('lang-en', l === 'en');
      syncPanes(l);
      applyMeta(l);
      if (lenis) lenis.resize();
      activePane().frame();
      // bereits sichtbare Elemente der neuen Ebene sofort zeigen
      var vh = window.innerHeight;
      $$('[data-reveal]', activePane().el).forEach(function (el) { if (el.getBoundingClientRect().top < vh) el.classList.add('is-in'); });
      requestAnimationFrame(function () { root.classList.remove('lang-fading'); });
    };
    if (reduceMotion) { swap(); return; }
    setTimeout(function () { root.classList.add('lang-fading'); setTimeout(swap, 280); }, 160);
  }
  syncPanes(lang());
  syncSwitches(lang());
  applyMeta(lang());

  /* ---------- Reveal beim Scrollen ---------- */
  var revealEls = $$('[data-reveal]');
  var io = null;
  var reveal = function (el) { el.classList.add('is-in'); if (io) io.unobserve(el); };
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
        var r = el.getBoundingClientRect();
        if (r.height === 0 && r.width === 0) return true; // in verborgener Sprachebene
        if (r.top < vh * 0.92) { reveal(el); return false; }
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

  /* ---------- Anker beim Laden ---------- */
  if (location.hash && location.hash.length > 1) {
    window.addEventListener('load', function () {
      var id = decodeURIComponent(location.hash.slice(1));
      if (lang() === 'en' && !/-en$/.test(id)) id += '-en';
      var el = doc.getElementById(id);
      if (el) setTimeout(function () { scrollToEl(el); }, 60);
    });
  }

  activePane().frame();
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
