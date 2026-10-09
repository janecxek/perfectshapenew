// Statischer Site-Generator für perfectshape-zuerich.ch (Deutsch = Hauptsprache, Englisch unter /en)
// Aufruf: node scripts/build.mjs  → schreibt alle HTML-Seiten, sitemap.xml und robots.txt ins Projekt-Root.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as DE from './content.mjs';
import { EN_CATEGORIES, EN_TREATMENTS, EN_TEAM, EN_REVIEW_TAGS, EN_HOME_FAQ } from './content.en.mjs';

const { SITE, HOME, AGB } = DE;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = JSON.parse(readFileSync(join(ROOT, 'scripts/imgmeta.json'), 'utf8'));
const TODAY = new Date().toISOString().slice(0, 10);
const VERSION = Date.now().toString(36);
const LOGO_W = 184, LOGO_H = 33;

/* ---------- Sprachdaten ---------- */
const DATA = {
  de: { TREATMENTS: DE.TREATMENTS, CATEGORIES: DE.CATEGORIES, TEAM: DE.TEAM, REVIEWS: DE.REVIEWS, HOME_FAQ: DE.HOME_FAQ },
  en: {
    TREATMENTS: DE.TREATMENTS.map((t) => {
      const e = EN_TREATMENTS[t.slug];
      return { ...t, ...e, deSlug: t.slug, prices: t.prices.map((p, i) => ({ ...p, priceText: undefined, ...e.prices[i] })) };
    }),
    CATEGORIES: DE.CATEGORIES.map((c) => ({ ...c, ...EN_CATEGORIES[c.id] })),
    TEAM: DE.TEAM.map((p, i) => ({ ...p, ...EN_TEAM[i] })),
    REVIEWS: DE.REVIEWS.map((r, i) => ({ ...r, tag: EN_REVIEW_TAGS[i] })),
    HOME_FAQ: EN_HOME_FAQ,
  },
};
DATA.de.TREATMENTS = DATA.de.TREATMENTS.map((t) => ({ ...t, deSlug: t.slug }));

// Seiten-Schlüssel → Pfade je Sprache (für hreflang & Sprachumschalter)
const PATHS = {
  home: { de: '/' },
  treatments: { de: '/behandlungen' },
  prices: { de: '/preise' },
  about: { de: '/ueber-uns' },
  contact: { de: '/kontakt' },
  agb: { de: '/agb' },
  privacy: { de: '/datenschutz' },
  imprint: { de: '/impressum' },
};
for (const t of DE.TREATMENTS) PATHS['t:' + t.slug] = { de: '/' + t.slug };

/* ---------- UI-Texte ---------- */
const STR = {
  de: {
    htmlLang: 'de-CH', ogLocale: 'de_CH', skip: 'Zum Inhalt springen', homeAria: 'Perfect Shape Zürich – Startseite', mainNav: 'Hauptnavigation',
    nav: { treatments: 'Behandlungen', prices: 'Preise', about: 'Über uns', contact: 'Kontakt', home: 'Startseite' },
    book: 'Termin buchen', bookOnline: 'Termin online buchen', bookNow: 'Jetzt Termin buchen', bookSecure: 'Jetzt Termin sichern', bookShort: 'Buchen', consult: 'Beratung buchen',
    megaTitle: 'Unsicher?', megaAccent: 'Wir beraten Sie.', megaText: 'Ehrlich und persönlich – wir raten auch ab, wenn etwas nicht zu Ihnen passt.',
    from: 'ab', call: 'Anrufen', allTreatments: 'Alle Behandlungen ansehen →', menuOpen: 'Menü öffnen', menuClose: 'Menü schliessen', mobileNav: 'Mobile Navigation', quick: 'Schnellkontakt',
    floor: '2. Etage', city: 'Zürich',
    ctaEyebrow: 'Bereit für Ihre Behandlung?', ctaTitle: 'Ihr Termin', ctaAccent: 'wartet auf Sie', ctaText: 'Wählen Sie Behandlung und Wunschtermin online – in weniger als einer Minute. Oder rufen Sie uns an, wir beraten Sie gerne.', ctaSmall: ['Online buchbar rund um die Uhr', 'Kostenlose Umbuchung bis 24 h vorher', 'Bahnhofstrasse 94, Zürich'],
    ftrText: 'Studio für Ästhetik &amp; Lasermedizin an der Bahnhofstrasse in Zürich. Behandlungen von geprüften Ärzten und Spezialistinnen.', ftrAesthetic: 'Ästhetische Medizin', ftrOther: 'Laser, Haut &amp; Körper', ftrContact: 'Kontakt', ftrStudio: 'Studio', ftrCopy: 'Ästhetik &amp; Lasermedizin',
    legal: [['agb', 'AGB'], ['privacy', 'Datenschutz'], ['imprint', 'Impressum']],
    modalTitle: 'Termin', modalAccent: 'online buchen', modalExt: 'In neuem Tab öffnen', close: 'Schliessen', modalIframe: 'Online-Terminbuchung Perfect Shape Zürich', modalFoot: 'Probleme mit der Buchung? Rufen Sie uns an:',
    crumbs: 'Breadcrumb', more: 'Mehr erfahren',
    visitEyebrow: 'Kontakt &amp; Anfahrt', visitTitle: 'In Kontakt', visitAccent: 'kommen', address: 'Adresse', phone: 'Telefon', email: 'E-Mail', appointments: 'Termine', hours: 'Öffnungszeiten', appointmentsText: 'Nach Vereinbarung – online rund um die Uhr', whatsappText: 'Nachricht schreiben', route: 'Route planen',
    mapLoad: 'Karte laden', mapNote: 'Beim Laden der Karte werden Daten an Google übertragen.', privacy: 'Datenschutz', mapTitle: 'Google Maps – Perfect Shape Zürich, Bahnhofstrasse 94', mapAria: 'Karte',
    langLabel: 'Sprache wählen',
  },
  en: {
    htmlLang: 'en', ogLocale: 'en_GB', skip: 'Skip to content', homeAria: 'Perfect Shape Zurich – Home', mainNav: 'Main navigation',
    nav: { treatments: 'Treatments', prices: 'Prices', about: 'About', contact: 'Contact', home: 'Home' },
    book: 'Book now', bookOnline: 'Book online', bookNow: 'Book your appointment', bookSecure: 'Secure your appointment', bookShort: 'Book', consult: 'Book a consultation',
    megaTitle: 'Not sure?', megaAccent: 'We’ll advise you.', megaText: 'Honest and personal – we even advise against what doesn’t suit you.',
    from: 'from', call: 'Call', allTreatments: 'View all treatments →', menuOpen: 'Open menu', menuClose: 'Close menu', mobileNav: 'Mobile navigation', quick: 'Quick contact',
    floor: '2nd floor', city: 'Zurich',
    ctaEyebrow: 'Ready for your treatment?', ctaTitle: 'Your visit', ctaAccent: 'awaits you', ctaText: 'Choose your treatment and preferred time online – in less than a minute. Or give us a call, we’re happy to advise you.', ctaSmall: ['Online booking 24/7', 'Free rescheduling up to 24 h before', 'Bahnhofstrasse 94, Zurich'],
    ftrText: 'Studio for aesthetics &amp; laser medicine on Bahnhofstrasse in Zurich. Treatments by certified physicians and specialists.', ftrAesthetic: 'Aesthetic Medicine', ftrOther: 'Laser, Skin &amp; Body', ftrContact: 'Contact', ftrStudio: 'Studio', ftrCopy: 'Aesthetics &amp; Laser Medicine',
    legal: [['agb', 'Terms (DE)'], ['privacy', 'Privacy (DE)'], ['imprint', 'Imprint (DE)']],
    modalTitle: 'Book', modalAccent: 'online', modalExt: 'Open in new tab', close: 'Close', modalIframe: 'Online booking Perfect Shape Zurich', modalFoot: 'Trouble booking? Give us a call:',
    crumbs: 'Breadcrumb', more: 'Learn more',
    visitEyebrow: 'Contact &amp; directions', visitTitle: 'Get in', visitAccent: 'touch', address: 'Address', phone: 'Phone', email: 'Email', appointments: 'Appointments', hours: 'Opening hours', appointmentsText: 'By appointment – online booking around the clock', whatsappText: 'Send a message', route: 'Get directions',
    mapLoad: 'Load map', mapNote: 'Loading the map transfers data to Google.', privacy: 'Privacy', mapTitle: 'Google Maps – Perfect Shape Zurich, Bahnhofstrasse 94', mapAria: 'Map',
    langLabel: 'Choose language',
  },
};

/* ---------- Aktiver Sprachkontext ---------- */
let LANG = 'de';
let S = STR.de;
let D = DATA.de;
const P = (key) => (PATHS[key] && PATHS[key].de) || '/'; // eine URL pro Seite – beide Sprachen auf derselben Seite
const tPath = (t) => P('t:' + t.deSlug);

/* ---------- Helpers ---------- */
const SMALL = new Set(['a', 'an', 'the', 'and', 'or', 'of', 'in', 'with', 'by', 'for', 'to', 'from', 'on', 'at', '&']);
const titleCase = (str) => str.split(' ').map((w, i) => (i > 0 && SMALL.has(w.toLowerCase()) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chf = (n) => 'CHF ' + n.toLocaleString('de-CH').replace(/[’']/g, '’');
const minPrice = (t) => Math.min(...t.prices.filter((p) => p.price).map((p) => p.price));
const abs = (path) => SITE.url + (path === '/' ? '/' : path);
const imgUrl = (name) => `${SITE.url}/assets/img/${name}.jpg`;
const bySlug = () => Object.fromEntries(D.TREATMENTS.map((t) => [t.deSlug, t]));
const catById = () => Object.fromEntries(D.CATEGORIES.map((c) => [c.id, c]));
const addr = () => `${esc(SITE.street)}, ${esc(S.floor)}, ${SITE.zip} ${esc(S.city)}`;

function srcset(name) {
  const m = IMG[name];
  if (!m) throw new Error('Bild fehlt: ' + name);
  return m.widths.map((w) => `/assets/img/${name}-${w}.webp ${w}w`).join(', ');
}
function pic(name, alt, { sizes = '100vw', eager = false } = {}) {
  const m = IMG[name];
  if (!m) throw new Error('Bild fehlt: ' + name);
  const fw = Math.min(1200, m.w);
  const fh = Math.round(m.h * (fw / m.w));
  // Optionaler Hochformat-Ausschnitt (<name>-portrait) für Smartphones im Hochformat
  const portrait = IMG[name + '-portrait'] ? `<source media="(orientation: portrait)" type="image/webp" srcset="${srcset(name + '-portrait')}" sizes="${PORTRAIT_SIZES}">` : '';
  return `<picture>${portrait}<source type="image/webp" srcset="${srcset(name)}" sizes="${portrait ? '100vw' : sizes}"><img src="/assets/img/${name}.jpg" alt="${esc(alt)}" width="${fw}" height="${fh}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const HERO_SIZES = '(orientation: portrait) 160vh, 100vw';
const PORTRAIT_SIZES = '(max-aspect-ratio: 9/16) 57vh, 100vw';
function preloadImg(name) {
  const m = IMG[name];
  const link = (n, sizes, media) => `<link rel="preload" as="image" href="/assets/img/${n}-${IMG[n].widths[Math.min(2, IMG[n].widths.length - 1)]}.webp" imagesrcset="${srcset(n)}" imagesizes="${sizes}"${media ? ` media="${media}"` : ''} fetchpriority="high">`;
  if (IMG[name + '-portrait']) return link(name + '-portrait', PORTRAIT_SIZES, '(orientation: portrait)') + '\n' + link(name, '100vw', '(orientation: landscape)');
  return link(name, HERO_SIZES);
}

const ICONS = {
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" stroke="none"/>',
  whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.3-1.8-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-1.8z" fill="currentColor" stroke="none"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  facebook: '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l.5-4H12V7.8c0-.5.4-.8.8-.8H15z"/>',
};
const icon = (n) => `<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

const bk = () => (LANG === 'de' ? SITE.booking : SITE.booking.replace('locale=de-DE', 'locale=en-GB'));
const bookBtn = (label = S.book, cls = 'btn btn--dark') =>
  `<a class="${cls}" href="${esc(bk())}" target="_blank" rel="noopener" data-book><span>${label}</span>${icon('arrow')}</a>`;
const title = (main, accent, { tag = 'h2', cls = '', id = '' } = {}) =>
  `<${tag} class="title${cls ? ' ' + cls : ''}"${id ? ` id="${id}"` : ''} data-reveal>${esc(main)}${accent ? ` <em>${esc(accent)}</em>` : ''}</${tag}>`;

const BRANDS = [['partner-endolift', 'Endolift®'], ['partner-revolax', 'Revolax'], ['partner-vivacy', 'Vivacy Paris'], ['partner-dives-med', 'Dives Med']];
const brands = (label) => `<div class="brands" data-reveal><p>${label}</p><ul>${BRANDS.map(([n, a]) => `<li><img src="/assets/img/${n}.webp" alt="${a}" width="${IMG[n].w}" height="${IMG[n].h}" loading="lazy"></li>`).join('')}</ul></div>`;

/* ---------- Strukturierte Daten ---------- */
const BUSINESS_ID = SITE.url + '/#business';
const businessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['BeautySalon', 'MedicalBusiness'],
  '@id': BUSINESS_ID,
  name: SITE.name,
  alternateName: LANG === 'de' ? 'Perfect Shape – Ästhetik & Lasermedizin' : 'Perfect Shape – Aesthetics & Laser Medicine Zurich',
  description: LANG === 'de'
    ? 'Studio für Ästhetik und Lasermedizin an der Bahnhofstrasse 94 in Zürich: Fadenlifting, Hyaluron, Laser-Haarentfernung, Endolift®, RF Needling, Peelings und Massagen – durchgeführt von geprüften Ärzten und Spezialistinnen.'
    : 'Studio for aesthetics and laser medicine at Bahnhofstrasse 94 in Zurich: thread lifts, hyaluronic acid, laser hair removal, Endolift®, RF microneedling, peels and massages – performed by certified physicians and specialists.',
  url: abs(P('home')),
  logo: SITE.url + '/assets/img/logo-perfect-shape-zuerich.png',
  image: [SITE.url + '/assets/img/og-image.jpg', imgUrl('studio-perfect-shape-zuerich-empfang'), imgUrl('studio-perfect-shape-zuerich-behandlungsraum')],
  telephone: '+41766086161',
  email: SITE.email,
  priceRange: 'CHF 40 – CHF 1800',
  ...(SITE.hours.length ? { openingHoursSpecification: SITE.hours.map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.days.map((d) => `https://schema.org/${{ Mo: 'Monday', Tu: 'Tuesday', We: 'Wednesday', Th: 'Thursday', Fr: 'Friday', Sa: 'Saturday', Su: 'Sunday' }[d]}`), opens: h.opens, closes: h.closes })) } : {}),
  currenciesAccepted: 'CHF',
  paymentAccepted: LANG === 'de' ? 'Bargeld, Kreditkarte, TWINT' : 'Cash, credit card, TWINT',
  address: { '@type': 'PostalAddress', streetAddress: 'Bahnhofstrasse 94, 2. Etage', postalCode: '8001', addressLocality: 'Zürich', addressRegion: 'ZH', addressCountry: 'CH' },
  hasMap: SITE.googleMaps,
  availableLanguage: ['de', 'en'],
  areaServed: [{ '@type': 'City', name: 'Zürich' }, { '@type': 'State', name: 'Kanton Zürich' }],
  sameAs: [SITE.instagram, SITE.facebook, SITE.googleMaps],
  potentialAction: { '@type': 'ReserveAction', target: { '@type': 'EntryPoint', urlTemplate: SITE.booking, actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] }, result: { '@type': 'Reservation', name: 'Perfect Shape Zürich' } },
  employee: D.TEAM.map((p) => ({ '@type': 'Person', name: p.name, jobTitle: p.roleShort })),
  knowsAbout: D.TREATMENTS.map((t) => t.navName),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: S.nav.treatments,
    itemListElement: D.CATEGORIES.map((c) => ({
      '@type': 'OfferCatalog',
      name: c.name,
      itemListElement: D.TREATMENTS.filter((t) => t.category === c.id).map((t) => ({ '@type': 'Offer', priceCurrency: 'CHF', price: minPrice(t), url: abs(tPath(t)), itemOffered: { '@type': 'Service', name: t.navName } })),
    })),
  },
});
const websiteSchema = () => ({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE.url + '/#website', url: SITE.url + '/', name: SITE.name, inLanguage: ['de-CH', 'en'], publisher: { '@id': BUSINESS_ID } });
const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [[S.nav.home, P('home')], ...items].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
const faqSchema = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', inLanguage: S.htmlLang, mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

/* ---------- Layout ---------- */
const logoImgs = () => `<img class="logo__color" src="/assets/img/logo.svg" alt="Perfect Shape Zürich" width="${LOGO_W}" height="${LOGO_H}"><img class="logo__white" src="/assets/img/logo-white.svg" alt="" width="${LOGO_W}" height="${LOGO_H}" aria-hidden="true">`;

function langSwitch() {
  const item = (l, label) => `<button type="button" lang="${STR[l].htmlLang}" data-set-lang="${l}" aria-pressed="${l === LANG}">${label}</button>`;
  return `<div class="lang" role="group" data-active="${LANG}" aria-label="${S.langLabel}">${item('de', 'DE')}${item('en', 'EN')}</div>`;
}

function header(active, key) {
  const a = (k) => (active === k ? ' aria-current="page"' : '');
  return `
<a class="skip" href="#main">${S.skip}</a>
<header class="hdr" id="top">
  <div class="container hdr__in">
    <a class="logo" href="${P('home')}" aria-label="${S.homeAria}" data-top>${logoImgs()}</a>
    <nav class="nav" aria-label="${S.mainNav}">
      <ul class="nav__list">
        <li class="nav__item has-mega"><a href="${P('treatments')}" class="nav__link"${a('treatments')} aria-haspopup="true" aria-expanded="false">${S.nav.treatments} ${icon('chevron')}</a>
          <div class="mega"><div class="mega__in">
            ${D.CATEGORIES.map((c) => `<div class="mega__col"><p class="mega__title">${esc(c.name)}</p><ul>${D.TREATMENTS.filter((t) => t.category === c.id).map((t) => `<li><a href="${tPath(t)}">${esc(t.navName)}<span>${S.from} ${chf(minPrice(t))}</span></a></li>`).join('')}</ul></div>`).join('')}
            <div class="mega__cta"><p class="title">${esc(S.megaTitle)} <em>${esc(S.megaAccent)}</em></p><p>${esc(S.megaText)}</p>${bookBtn(S.consult, 'btn btn--dark btn--sm')}</div>
          </div></div>
        </li>
        <li class="nav__item"><a href="${P('prices')}" class="nav__link"${a('prices')}>${S.nav.prices}</a></li>
        <li class="nav__item"><a href="${P('about')}" class="nav__link"${a('about')}>${S.nav.about}</a></li>
        <li class="nav__item"><a href="${P('contact')}" class="nav__link"${a('contact')}>${S.nav.contact}</a></li>
      </ul>
    </nav>
    <div class="hdr__actions">
      ${langSwitch()}
      <a class="hdr__phone" href="${SITE.phoneHref}" aria-label="${S.call}: ${esc(SITE.phone)}">${icon('phone')}<span>${esc(SITE.phone)}</span></a>
      ${bookBtn(S.book, 'btn btn--dark hdr__cta')}
      <button class="burger" type="button" aria-label="${S.menuOpen}" data-label-open="${S.menuOpen}" data-label-close="${S.menuClose}" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden data-lenis-prevent>
  <div class="mnav__in">
    <nav aria-label="${S.mobileNav}">
      <ul class="mnav__list">
        <li><a href="${P('home')}">${S.nav.home}</a></li>
        <li><details><summary>${S.nav.treatments} ${icon('plus')}</summary>
          ${D.CATEGORIES.map((c) => `<p class="mnav__cat">${esc(c.name)}</p><ul>${D.TREATMENTS.filter((t) => t.category === c.id).map((t) => `<li><a href="${tPath(t)}">${esc(t.navName)}<span>${S.from} ${chf(minPrice(t))}</span></a></li>`).join('')}</ul>`).join('')}
          <p class="mnav__cat"><a href="${P('treatments')}">${S.allTreatments}</a></p>
        </details></li>
        <li><a href="${P('prices')}">${S.nav.prices}</a></li>
        <li><a href="${P('about')}">${S.nav.about}</a></li>
        <li><a href="${P('contact')}">${S.nav.contact}</a></li>
      </ul>
    </nav>
    <div class="mnav__foot">
      ${bookBtn(S.bookOnline, 'btn btn--dark btn--lg btn--block')}
      <div class="mnav__row"><a class="btn btn--line" href="${SITE.phoneHref}">${icon('phone')}<span>${S.call}</span></a><a class="btn btn--line" href="${SITE.whatsapp}" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a></div>
      <p class="mnav__addr">${addr()}</p>
    </div>
  </div>
</div>`;
}

function ctaBand() {
  return `
<section class="band band--cta" aria-labelledby="cta-title">
  <div class="band__media" data-parallax>${pic(HOME.ctaImage, LANG === 'de' ? HOME.ctaAlt : 'Relaxing treatment at Perfect Shape Zurich')}</div>
  <div class="container band__in">
    <p class="eyebrow eyebrow--light" data-reveal>${S.ctaEyebrow}</p>
    <h2 class="title title--lg title--light" id="cta-title" data-reveal>${esc(S.ctaTitle)} <em>${esc(S.ctaAccent)}</em></h2>
    <p data-reveal>${esc(S.ctaText)}</p>
    <div class="hero__ctas" data-reveal>${bookBtn(S.bookNow, 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="${SITE.phoneHref}">${icon('phone')}<span>${esc(SITE.phone)}</span></a></div>
    <p class="band__small" data-reveal>${S.ctaSmall.map((x) => `<span>${esc(x)}</span>`).join('')}</p>
  </div>
</section>`;
}

function footer({ cta = true } = {}) {
  const col = (catIds) => D.TREATMENTS.filter((t) => catIds.includes(t.category)).map((t) => `<li><a href="${tPath(t)}">${esc(t.navName)}</a></li>`).join('');
  return `${cta ? ctaBand() : ''}
<footer class="ftr">
  <div class="container">
    <div class="ftr__top">
      <div class="ftr__brand">
        <a class="logo" href="${P('home')}" aria-label="${S.homeAria}" data-top><img src="/assets/img/logo-white.svg" alt="Perfect Shape Zürich" width="${LOGO_W}" height="${LOGO_H}" loading="lazy"></a>
        <p>${S.ftrText}</p>
        <div class="ftr__social"><a href="${esc(SITE.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a><a href="${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a></div>
      </div>
      <div><p class="ftr__title">${S.ftrAesthetic}</p><ul>${col(['aesthetik'])}</ul></div>
      <div><p class="ftr__title">${S.ftrOther}</p><ul>${col(['laser', 'apparativ', 'massage', 'peeling'])}</ul></div>
      <div>
        <p class="ftr__title">${S.ftrContact}</p>
        <address>
          <a href="${SITE.route}" target="_blank" rel="noopener">${esc(SITE.street)}, ${esc(S.floor)}<br>${SITE.zip} ${esc(S.city)}</a>
          <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a>
          <a href="mailto:${SITE.email}">${esc(SITE.email)}</a>
        </address>
        <p class="ftr__title" style="margin-top:28px">${S.ftrStudio}</p>
        <ul class="ftr__inline"><li><a href="${P('prices')}">${S.nav.prices}</a></li><li><a href="${P('about')}">${S.nav.about}</a></li><li><a href="${P('contact')}">${S.nav.contact}</a></li><li><a href="${P('treatments')}">${S.nav.treatments}</a></li></ul>
      </div>
    </div>
  </div>
  <p class="ftr__word" aria-hidden="true">Perfect <em>Shape</em></p>
  <div class="container ftr__bottom">
    <p>© <span data-year>${new Date().getFullYear()}</span> Perfect Shape Zürich · ${S.ftrCopy}</p>
    <ul class="ftr__inline">${S.legal.map(([k, l]) => `<li><a href="${P(k)}"${LANG !== 'de' ? ' hreflang="de-CH"' : ''}>${l}</a></li>`).join('')}</ul>
  </div>
</footer>
<nav class="mbar" aria-label="${S.quick}">
  <a href="${SITE.phoneHref}" class="mbar__btn">${icon('phone')}<span>${S.call}</span></a>
  <a href="${SITE.whatsapp}" class="mbar__btn" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a>
  <a href="${esc(bk())}" class="mbar__btn mbar__btn--primary" target="_blank" rel="noopener" data-book>${icon('calendar')}<span>${S.book}</span></a>
</nav>
<div class="modal" id="booking" role="dialog" aria-modal="true" aria-labelledby="booking-title" hidden data-lenis-prevent>
  <div class="modal__backdrop" data-close></div>
  <div class="modal__box">
    <div class="modal__head">
      <p class="modal__title" id="booking-title">${S.modalTitle} <em>${S.modalAccent}</em></p>
      <a class="modal__ext" href="${esc(bk())}" target="_blank" rel="noopener">${S.modalExt} ${icon('arrow')}</a>
      <button class="modal__close" type="button" data-close aria-label="${S.close}">${icon('x')}</button>
    </div>
    <div class="modal__body"><div class="modal__loader" aria-hidden="true"><span></span></div><iframe title="${S.modalIframe}" data-src="${esc(SITE.bookingWidget.replace('locale=de-DE', LANG === 'de' ? 'locale=de-DE' : 'locale=en-GB'))}" allow="payment" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
    <p class="modal__foot">${S.modalFoot} <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></p>
  </div>
</div>`;
}

function layout({ key, title: pageTitle, description, active = '', body, schemas = [], ogImage = '/assets/img/og-image.jpg', preload = '', noindex = false, hasHero = false, cta = true }) {
  return {
    title: pageTitle, description, ogImage, preload, noindex, hasHero,
    ld: [websiteSchema(), businessSchema(), ...schemas].map((x) => `<script type="application/ld+json">${JSON.stringify(x)}</script>`).join('\n'),
    inner: `${header(active, key)}\n<main id="main">\n${body}\n</main>\n${footer({ cta })}`,
  };
}

// IDs der englischen Ebene eindeutig machen (beide Sprachen liegen im selben Dokument)
function suffixIds(html) {
  return html
    .replace(/\sid="([^"]+)"/g, ' id="$1-en"')
    .replace(/\s(aria-labelledby|aria-controls|for)="([^"]+)"/g, ' $1="$2-en"')
    .replace(/href="#([^"]+)"/g, 'href="#$1-en"');
}

// Weiche Trennstellen für lange Wörter in grossen Überschriften (kleine Smartphones)
const SHY = ['Micro|derm|abrasion', 'Bio|stimula|toren', 'Bio|stimula|tors', 'Meso|therapie', 'Meso|therapy', 'Madero|therapie', 'Madero|therapy', 'Laser|behandlungen', 'Laser|behandlung', 'Haar|entfernung', 'Hyaluron|säure', 'Micro|needling', 'Faden|lifting', 'Laser|medizin', 'Behand|lungen', 'Kontra|indikationen', 'Contra|indications', 'Vampire|lifting', 'Frucht|säure', 'Kollagen|aufbau', 'Nebenwir|kungen', 'Erholungs|zeit', 'Ausfall|zeiten', 'Empfeh|lungen', 'Expertin|nen', 'Erfahrun|gen', 'Endo|lift', 'Massa|gen'];
const SHY_RE = new RegExp(`(${SHY.map((w) => w.replace(/\|/g, '')).join('|')})`, 'g');
const SHY_MAP = Object.fromEntries(SHY.map((w) => [w.replace(/\|/g, ''), w.replace(/\|/g, '\u00AD')]));
const shyHeadings = (html) => html.replace(/(<h[12][^>]*>)([\s\S]*?)(<\/h[12]>)/g, (m, a, inner, z) => a + inner.replace(/(^|>)([^<]+)/g, (mm, gt, txt) => gt + txt.replace(SHY_RE, (w) => SHY_MAP[w])) + z);

function compose(key, de, en) {
  const canonical = abs(P(key));
  return `<!doctype html>
<html lang="de-CH" data-title-de="${esc(de.title)}" data-title-en="${esc(en.title)}" data-desc-de="${esc(de.description)}" data-desc-en="${esc(en.description)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<script>(function(){var d=document.documentElement;d.classList.add('js');try{var q=new URLSearchParams(location.search).get('lang');if(q==='en'||q==='de')localStorage.setItem('ps-lang',q);if(localStorage.getItem('ps-lang')==='en'){d.classList.add('lang-en');d.lang='en';}}catch(e){}})()</script>
<title>${esc(de.title)}</title>
<meta name="description" content="${esc(de.description)}">
${de.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<link rel="canonical" href="${canonical}">
<meta name="theme-color" content="#faf8f5">
<meta name="format-detection" content="telephone=no">
<meta name="geo.region" content="CH-ZH">
<meta name="geo.placename" content="Zürich">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_CH">
<meta property="og:locale:alternate" content="en_GB">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(de.title)}">
<meta property="og:description" content="${esc(de.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.url}${de.ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(de.title)}">
<meta name="twitter:description" content="${esc(de.description)}">
<meta name="twitter:image" content="${SITE.url}${de.ogImage}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/inter-tight-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>
${de.preload}
<link rel="stylesheet" href="/assets/css/style.min.css?v=${VERSION}">
<script src="/assets/js/lenis.min.js?v=${VERSION}" defer></script>
<script src="/assets/js/main.js?v=${VERSION}" defer></script>
${de.ld}
</head>
<body${de.hasHero ? ' class="has-hero"' : ''}>
<div class="lp lp--de" data-pane="de" lang="de-CH">
${de.inner}
</div>
<div class="lp lp--en" data-pane="en" lang="en" hidden>
${suffixIds(en.inner).replace('<main id="main-en">', '<main id="main-en" hidden>')}
</div>
</body>
</html>
`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="${S.crumbs}"><ol><li><a href="${P('home')}">${S.nav.home}</a></li>${items.map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${p}">${esc(n)}</a></li>`)).join('')}</ol></nav>`;

const faqList = (faq) => `<div class="faq" data-reveal>${faq.map(([q, a]) => `<details class="faq__item"><summary><span>${esc(q)}</span><i aria-hidden="true"></i></summary><div class="faq__a"><p>${esc(a)}</p></div></details>`).join('')}</div>`;

// Minimalistische Behandlungsliste: Nummer · Name · Preis · Pfeil (+ Bildvorschau beim Hover)
function treatmentList(list, { preview = true, groups = true, headingTag = 'h3' } = {}) {
  const ordered = groups ? D.CATEGORIES.flatMap((c) => list.filter((t) => t.category === c.id)) : list;
  const row = (t) => {
    const idx = ordered.indexOf(t);
    return `<a class="tl__row${idx === 0 ? ' is-active' : ''}" href="${tPath(t)}" data-tl="${idx}">
      <span class="tl__num">${String(idx + 1).padStart(2, '0')}</span>
      <${headingTag} class="tl__name">${esc(t.navName)}</${headingTag}>
      <span class="tl__price">${S.from} ${chf(minPrice(t))}</span>
      <span class="tl__arrow">${icon('arrow')}</span>
    </a>`;
  };
  const rows = groups
    ? D.CATEGORIES.map((c) => {
        const items = list.filter((t) => t.category === c.id);
        if (!items.length) return '';
        return `<div class="tl__group" data-reveal><p class="tl__cat">${esc(c.name)}</p>${items.map(row).join('')}</div>`;
      }).join('')
    : `<div class="tl__group" data-reveal>${list.map(row).join('')}</div>`;
  return `<div class="tl"${preview ? ' data-tl-list' : ''}>
    <div class="tl__list">${rows}</div>
    ${preview ? `<div class="tl__preview" aria-hidden="true">${ordered.map((t, k) => `<figure class="${k === 0 ? 'is-active' : ''}" data-tl-img="${k}">${pic(t.image, '', { sizes: '(max-width: 1024px) 1px, 34vw' })}</figure>`).join('')}</div>` : ''}
  </div>`;
}

// Kategorien als aufklappbare Bildkarten → Behandlungen → Unterseite
function categoryList(list, { catTag = 'h3', itemTag = 'h4', open = -1 } = {}) {
  const de = LANG === 'de';
  const count = (n) => (de ? `${n} ${n === 1 ? 'Behandlung' : 'Behandlungen'}` : `${n} ${n === 1 ? 'treatment' : 'treatments'}`);
  return `<div class="cats" data-cats>${D.CATEGORIES.map((c, i) => {
    const items = list.filter((t) => t.category === c.id);
    if (!items.length) return '';
    const from = Math.min(...items.map(minPrice));
    const isOpen = i === open;
    return `<div class="cat${isOpen ? ' is-open' : ''}" data-reveal>
      <${catTag} class="cat__h"><button type="button" class="cat__btn" aria-expanded="${isOpen}" aria-controls="cat-${c.id}">
        <span class="cat__img">${pic(c.image, '', { sizes: '(max-width: 640px) 96px, 240px' })}</span>
        <span class="cat__num">${String(i + 1).padStart(2, '0')}</span>
        <span class="cat__body"><span class="cat__name">${esc(c.name)}</span><span class="cat__short">${esc(c.short)}</span></span>
        <span class="cat__meta"><span>${count(items.length)}</span><span>${S.from} ${chf(from)}</span></span>
        <span class="cat__plus" aria-hidden="true"></span>
      </button></${catTag}>
      <div class="cat__panel" id="cat-${c.id}" role="region" aria-label="${esc(c.name)}"><div class="cat__inner"><ul class="cat__list">${items.map((t) => `<li><a class="cat__item" href="${tPath(t)}">
        <span class="cat__thumb">${pic(t.image, '', { sizes: '80px' })}</span>
        <div class="cat__txt"><${itemTag} class="cat__iname">${esc(t.navName)}</${itemTag}><p class="cat__card">${esc(t.card)}</p></div>
        <span class="cat__price">${S.from} ${chf(minPrice(t))}</span>
        <span class="cat__arrow">${icon('arrow')}</span>
      </a></li>`).join('')}</ul></div></div>
    </div>`;
  }).join('')}</div>`;
}

const priceRow = (p) => `<li class="prow">
  <div><p class="prow__name">${esc(p.name)}${p.detail ? ` <span>· ${esc(p.detail)}</span>` : ''}${p.featured ? `<b class="badge">${LANG === 'de' ? 'Beliebt' : 'Popular'}</b>` : ''}</p><p class="prow__desc">${esc(p.desc)}</p>${p.extra ? `<p class="prow__extra">${esc(p.extra)}</p>` : ''}</div>
  <div class="prow__side"><p class="prow__price">${p.priceText && p.price ? esc(p.priceText).replace(' · ', '<br>') : p.price ? `${p.from ? `<small>${S.from}</small> ` : ''}${chf(p.price)}` : esc(p.priceText)}</p>${bookBtn(S.bookShort, 'btn btn--line btn--xs')}</div>
</li>`;

function heroMedia(name, alt, pos = '50% 50%', posM = '') {
  return `<div class="hero__media" style="--pos:${pos};${posM ? `--pos-m:${posM}` : ''}"><div class="hero__parallax" data-hero-parallax>${pic(name, alt, { sizes: HERO_SIZES, eager: true })}</div></div>`;
}

const mapBox = () => `<div class="map" data-map="${esc(SITE.mapEmbed)}" data-map-title="${esc(S.mapTitle)}" data-reveal>
      <div class="map__ph">
        <span class="map__pin">${icon('pin')}</span>
        <p><b>Perfect Shape Zürich</b><br>${esc(SITE.street)}, ${SITE.zip} ${esc(S.city)}</p>
        <button type="button" class="btn btn--dark btn--sm" data-map-load>${S.mapLoad}</button>
        <small>${S.mapNote} <a href="${P('privacy')}">${S.privacy}</a></small>
      </div>
    </div>`;

function visitBlock() {
  return `<section class="section" aria-labelledby="visit-title">
  <div class="container visit">
    <div>
      <p class="eyebrow" data-reveal>${S.visitEyebrow}</p>
      ${title(S.visitTitle, S.visitAccent, { id: 'visit-title' })}
      <ul class="clist" data-reveal>
        <li><b>${S.address}</b><a href="${SITE.route}" target="_blank" rel="noopener">${addr()}</a></li>
        <li><b>${S.phone}</b><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></li>
        <li><b>WhatsApp</b><a href="${SITE.whatsapp}" target="_blank" rel="noopener">${S.whatsappText}</a></li>
        <li><b>${S.email}</b><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></li>
        ${SITE.hours.length ? `<li><b>${S.hours}</b><span>${SITE.hours.map((h) => `${esc(h[LANG])} ${h.opens}–${h.closes}`).join('<br>')}</span></li>` : `<li><b>${S.appointments}</b><span>${S.appointmentsText}</span></li>`}
      </ul>
      <div class="visit__ctas" data-reveal>${bookBtn()}<a class="btn btn--line" href="${SITE.route}" target="_blank" rel="noopener"><span>${S.route}</span>${icon('arrow')}</a></div>
    </div>
    ${mapBox()}
  </div>
</section>`;
}

/* ---------- Seiten ---------- */
const PAGES = {};
const add = (key, parts, { priority = '0.7', changefreq = 'monthly', sitemap = true, file } = {}) => {
  const path = P(key);
  PAGES[key] = PAGES[key] || { key, path, file: file || (path === '/' ? 'index.html' : path.slice(1) + '.html'), priority, changefreq, sitemap };
  PAGES[key][LANG] = parts;
};

function buildLang(lang) {
  LANG = lang; S = STR[lang]; D = DATA[lang];
  const de = lang === 'de';
  const B = bySlug();
  const CAT = catById();
  const TR = D.TREATMENTS;

  /* Startseite – Reihenfolge nach Entscheidungsweg: Angebot → Vertrauen → Ablauf → Einwände → Abschluss */
  {
    const H = de ? {
      l1: 'Ästhetik &amp;', l2: 'Lasermedizin', l3: 'in Zürich',
      second: 'Behandlungen ansehen',
      aEyebrow: 'Perfect Shape Zürich', aTitle: 'Das Beauty Studio', aAccent: 'auf höchstem Niveau',
      aText: 'Wohlfühlen in Ihrer Haut – darum geht es bei Perfect Shape. Diagnostik und Behandlung liegen bei geprüften Ärzten und Spezialistinnen, mit modernster Lasertechnologie und hochwertigsten Materialien.',
      aLink: 'Über uns', aAlt: 'Natürliches Facelifting – Ästhetik &amp; Lasermedizin bei Perfect Shape Zürich',
      facts: [['Ärztlich', 'Geprüfte Ärzte und Spezialistinnen'], ['13', 'Behandlungen unter einem Dach'], ['Zentral', 'Bahnhofstrasse 94, nahe Hauptbahnhof']],
      brands: 'Premium-Marken &amp; Technologien',
      tEyebrow: 'Behandlungen', tTitle: 'Unsere', tAccent: 'Behandlungen', tText: 'Fadenlifting, Hyaluron, Laser-Haarentfernung &amp; Endolift® – präzise durchgeführt von geprüften Ärzten und Spezialistinnen. Für Ergebnisse, die natürlich wirken.', allPrices: 'Alle Preise',
      sEyebrow: 'Bahnhofstrasse 94 · 2. Etage', sTitle: 'Unser', sAccent: 'Studio', sText: 'Hell, ruhig und diskret – nur wenige Gehminuten vom Hauptbahnhof Zürich entfernt.', route: 'Route planen',
      g: ['Empfang und Wartebereich von Perfect Shape an der Bahnhofstrasse Zürich', 'Behandlungsraum bei Perfect Shape Zürich', 'Zertifikate und Diplome bei Perfect Shape Zürich'],
      cEyebrow: 'Online-Termin', cTitle: 'Bereit für Ihre', cAccent: 'Behandlung?', cText: 'Buchen Sie jetzt schnell und einfach Ihren Termin online – oder rufen Sie uns an, wir beraten Sie gerne.', cAlt: HOME.ctaAlt,
      teamEyebrow: 'In besten Händen', teamTitle: 'Unsere', teamAccent: 'Expertinnen', teamText: 'Medizinisches Fachwissen, zertifizierte Lasersicherheit und jahrelange Erfahrung in der ästhetischen Medizin.', teamLink: 'Das Team kennenlernen',
      revEyebrow: 'Kundenbewertungen', revTitle: 'Echte', revAccent: 'Erfahrungen', stars: '5 von 5 Sternen', prev: 'Vorherige Bewertung', next: 'Nächste Bewertung', google: 'Alle Bewertungen auf Google',
      fTitle: 'Häufige', fAccent: 'Fragen', fText: 'Ihre Frage ist nicht dabei? Rufen Sie uns an oder schreiben Sie uns – wir helfen gerne.', fLink: 'Kontakt aufnehmen',
      title: 'Ästhetik & Lasermedizin Zürich | Perfect Shape', description: 'Fadenlifting, Hyaluron, Laser-Haarentfernung & Endolift® in Zürich – ärztlich geführt an der Bahnhofstrasse 94. Transparente Preise. Jetzt Termin buchen.',
      heroAlt: HOME.heroAlt,
      gReviews: 'Google-Bewertungen', studioNav: ['Empfang', 'Behandlungsraum', 'Zertifikate'], studioShow: 'Bild anzeigen:',
    } : {
      l1: 'Aesthetic &amp;', l2: 'Laser Clinic', l3: 'in Zurich',
      second: 'View treatments',
      aEyebrow: 'Perfect Shape Zurich', aTitle: 'The Beauty Studio', aAccent: 'at the highest level',
      aText: 'Feeling good in your skin – that is what Perfect Shape is about. Diagnosis and treatment are in the hands of certified physicians and specialists, using state-of-the-art laser technology and the finest materials.',
      aLink: 'About us', aAlt: 'Natural facelift – aesthetics &amp; laser medicine at Perfect Shape Zurich',
      facts: [['Medical', 'Certified physicians and specialists'], ['13', 'Treatments under one roof'], ['Central', 'Bahnhofstrasse 94, near the main station']],
      brands: 'Premium brands &amp; technologies',
      tEyebrow: 'Treatments', tTitle: 'Our', tAccent: 'Treatments', tText: 'Thread lifts, hyaluronic acid, laser hair removal &amp; Endolift® – performed with precision by certified physicians and specialists. For results that look natural.', allPrices: 'All prices',
      sEyebrow: 'Bahnhofstrasse 94 · 2nd floor', sTitle: 'Our', sAccent: 'Studio', sText: 'Bright, calm and discreet – just a few minutes’ walk from Zurich main station.', route: 'Get directions',
      g: ['Reception and waiting area at Perfect Shape on Bahnhofstrasse Zurich', 'Treatment room at Perfect Shape Zurich', 'Certificates and diplomas at Perfect Shape Zurich'],
      cEyebrow: 'Online booking', cTitle: 'Ready for your', cAccent: 'treatment?', cText: 'Book your appointment online – quickly and easily. Or give us a call, we’re happy to advise you.', cAlt: 'Relaxing treatment at Perfect Shape Zurich',
      teamEyebrow: 'In the best hands', teamTitle: 'Our', teamAccent: 'Experts', teamText: 'Medical expertise, certified laser safety and many years of experience in aesthetic medicine.', teamLink: 'Meet the team',
      revEyebrow: 'Client reviews', revTitle: 'Real', revAccent: 'Experiences', stars: '5 out of 5 stars', prev: 'Previous review', next: 'Next review', google: 'All reviews on Google',
      fTitle: 'Frequent', fAccent: 'Questions', fText: 'Your question isn’t listed? Call or write to us – we’re happy to help.', fLink: 'Get in touch',
      title: 'Aesthetic & Laser Clinic Zurich | Perfect Shape', description: 'Thread lifts, lip fillers, laser hair removal & Endolift® in Zurich – at Bahnhofstrasse 94. Transparent prices, honest advice. Book your appointment online.',
      heroAlt: 'Relaxed woman in the bright Perfect Shape studio overlooking Zurich',
      gReviews: 'Google reviews', studioNav: ['Reception', 'Treatment room', 'Certificates'], studioShow: 'Show image:',
    };
    const body = `
<section class="hero" aria-labelledby="hero-title">
  ${heroMedia(HOME.heroImage, H.heroAlt, HOME.heroPos, HOME.heroPosMobile)}
  <div class="container hero__content">
    <div class="hero__grid">
      <h1 class="title title--xl title--light hero__title" id="hero-title"><span class="ln"><span>${H.l1}</span></span><span class="ln"><span>${H.l2}</span></span><span class="ln"><span><em>${H.l3}</em></span></span></h1>
      <div class="hero__side">
        <div class="hero__ctas fade-up d1">${bookBtn(S.book, 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="#behandlungen"><span>${H.second}</span></a></div>
      </div>
    </div>
  </div>
</section>

<section class="section section--alt" id="behandlungen" aria-labelledby="treat-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>${H.tEyebrow}</p>${title(H.tTitle, H.tAccent, { id: 'treat-title' })}</div>
      <div class="head__text" data-reveal><p>${H.tText}</p></div>
    </div>
    ${categoryList(TR)}
    <div class="tl__more" data-reveal>${bookBtn()}<a class="btn btn--line" href="${P('prices')}"><span>${H.allPrices}</span>${icon('arrow')}</a></div>
  </div>
</section>

<section class="studio" id="perfect-shape" aria-labelledby="about-title" data-studio>
  <div class="studio__media">
    ${['studio-perfect-shape-zuerich-empfang', 'studio-perfect-shape-zuerich-behandlungsraum', 'studio-perfect-shape-zuerich-zertifikate'].map((img, i) => `<figure class="studio__slide${i === 0 ? ' is-active' : ''}" data-slide>${pic(img, H.g[i], { sizes: '100vw' })}</figure>`).join('')}
  </div>
  <div class="container studio__in">
    <div class="studio__text">
      <p class="eyebrow eyebrow--light" data-reveal>${H.sEyebrow}</p>
      ${title(H.aTitle, H.aAccent, { id: 'about-title', cls: 'title--light' })}
      <p data-reveal>${H.aText}</p>
      <div class="studio__links"><a class="link link--light" href="${P('about')}">${H.aLink} ${icon('right')}</a><a class="link link--light" href="${SITE.route}" target="_blank" rel="noopener">${H.route} ${icon('arrow')}</a></div>
    </div>
    <div class="studio__nav">${H.studioNav.map((n, i) => `<button type="button" class="studio__dot${i === 0 ? ' is-active' : ''}" data-dot="${i}" aria-label="${H.studioShow} ${n}" aria-pressed="${i === 0}"><i></i><span>${n}</span></button>`).join('')}</div>
  </div>
</section>

<section class="section" aria-labelledby="team-title">
  <div class="container experts-grid">
    <div class="experts-grid__head">
      <p class="eyebrow" data-reveal>${H.teamEyebrow}</p>
      ${title(H.teamTitle, H.teamAccent, { id: 'team-title' })}
      <p data-reveal>${H.teamText}</p>
      <p data-reveal><a class="link" href="${P('about')}">${H.teamLink} ${icon('right')}</a></p>
    </div>
    <ul class="experts">
      ${D.TEAM.map((p, i) => `<li data-reveal${i ? ` style="--d:120ms"` : ''}><a class="expert" href="${P('about')}">
        <span class="expert__img">${pic(p.image, p.alt, { sizes: '160px' })}</span>
        <div class="expert__txt"><span class="expert__num">0${i + 1}</span><h3 class="expert__name">${esc(p.name)}</h3><span class="expert__role">${esc(p.role)}</span></div>
        <span class="arrow-circle">${icon('arrow')}</span>
      </a></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section section--alt" aria-labelledby="reviews-title">
  <div class="container reviews">
    <p class="eyebrow" data-reveal>${H.revEyebrow}</p>
    ${title(H.revTitle, H.revAccent, { id: 'reviews-title' })}
    <div class="slider" data-slider data-reveal style="margin-top:56px">
      <div class="stars" role="img" aria-label="${H.stars}">${icon('star').repeat(5)}</div>
      <div class="slider__viewport">
        ${D.REVIEWS.map((r, i) => `<figure class="review${i === 0 ? ' is-active' : ''}" aria-hidden="${i === 0 ? 'false' : 'true'}">
          <blockquote${i === 1 ? ' lang="en"' : ' lang="de-CH"'}><p>„${esc(r.text)}“</p></blockquote>
          <figcaption><b>${esc(r.name)}</b> <span>· ${esc(r.tag)}</span></figcaption>
        </figure>`).join('')}
      </div>
      <div class="slider__nav">
        <button type="button" class="arrow-circle" data-prev aria-label="${H.prev}">${icon('left')}</button>
        <span class="slider__count" aria-live="polite"><b data-current>1</b> / ${D.REVIEWS.length}</span>
        <button type="button" class="arrow-circle" data-next aria-label="${H.next}">${icon('right')}</button>
      </div>
    </div>
    <p class="reviews__google" data-reveal><a class="link" href="${SITE.googleMaps}" target="_blank" rel="noopener">${SITE.googleRating && SITE.googleReviewCount ? `${String(SITE.googleRating).replace('.', de ? ',' : '.')} / 5 · ${SITE.googleReviewCount} ${H.gReviews}` : H.google} ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <div class="faq-grid__head">
      <p class="eyebrow" data-reveal>FAQ</p>
      ${title(H.fTitle, H.fAccent, { id: 'faq-title' })}
      <p data-reveal>${H.fText}</p>
      <p data-reveal><a class="link" href="${P('contact')}">${H.fLink} ${icon('right')}</a></p>
    </div>
    ${faqList(D.HOME_FAQ)}
  </div>
</section>

<section class="band band--cta" aria-labelledby="ready-title">
  <div class="band__media" data-parallax>${pic(HOME.ctaImage, H.cAlt)}</div>
  <div class="container band__in">
    <p class="eyebrow eyebrow--light" data-reveal>${H.cEyebrow}</p>
    <h2 class="title title--lg title--light" id="ready-title" data-reveal>${esc(H.cTitle)} <em>${esc(H.cAccent)}</em></h2>
    <p data-reveal>${H.cText}</p>
    <div class="hero__ctas" data-reveal>${bookBtn(S.bookNow, 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="${SITE.phoneHref}">${icon('phone')}<span>${esc(SITE.phone)}</span></a></div>
    <p class="band__small" data-reveal>${S.ctaSmall.map((x) => `<span>${esc(x)}</span>`).join('')}</p>
  </div>
</section>

${visitBlock()}
`;
    add('home', layout({ key: 'home', title: H.title, description: H.description, body, hasHero: true, cta: false, schemas: [faqSchema(D.HOME_FAQ)], preload: preloadImg(HOME.heroImage) }), { priority: '1.0', changefreq: 'weekly' });
  }

  /* Behandlungsseiten */
  const TP = de ? {
    inCity: 'in Zürich', prices: 'Preise', toc: ['Methode', 'Ablauf', 'Ergebnisse', 'Preise', 'FAQ'], tocAria: 'Auf dieser Seite',
    forWhom: 'Für wen', plus: 'Ihr Plus', goodToKnow: 'Gut zu wissen', process: 'Ablauf', pTitle: 'Schritt', pAccent: 'für Schritt', pText: 'Transparent von der ersten Beratung bis zur Nachsorge – damit Sie genau wissen, was Sie erwartet.',
    expect: 'Was Sie erwarten können', pricesOf: 'Preise', prTitle: 'Transparente', prAccent: 'Preise', prText: 'Richtwerte pro Behandlung in CHF inkl. MwSt. Die finalen Kosten legen wir nach Ihrer individuellen Beratung fest.', allPrices: 'Alle Preise',
    faqOf: 'FAQ', fTitle: 'Häufige', fAccent: 'Fragen', fText: 'Noch Fragen? Wir beraten Sie gerne persönlich – telefonisch oder direkt im Studio.',
    relEyebrow: 'Passt gut dazu', relTitle: 'Weitere', relAccent: 'Behandlungen', allT: 'Alle Behandlungen', and: 'und',
  } : {
    inCity: 'in Zurich', prices: 'Prices', toc: ['Method', 'Process', 'Results', 'Prices', 'FAQ'], tocAria: 'On this page',
    forWhom: 'Who it’s for', plus: 'Your benefits', goodToKnow: 'Good to know', process: 'Process', pTitle: 'Step', pAccent: 'by Step', pText: 'Transparent from the first consultation to aftercare – so you know exactly what to expect.',
    expect: 'What to expect', pricesOf: 'Prices', prTitle: 'Transparent', prAccent: 'Prices', prText: 'Guide prices per treatment in CHF incl. VAT. The final cost is confirmed after your individual consultation.', allPrices: 'All prices',
    faqOf: 'FAQ', fTitle: 'Frequent', fAccent: 'Questions', fText: 'Any questions? We’re happy to advise you personally – by phone or in the studio.',
    relEyebrow: 'Goes well with', relTitle: 'More', relAccent: 'Treatments', allT: 'All treatments', and: 'and',
  };
  for (const t of TR) {
    const cat = CAT[t.category];
    const key = 't:' + t.deSlug;
    const path = tPath(t);
    const from = minPrice(t);
    const related = t.related.map((s) => B[s]);
    const words = t.what.title.replace(/\?$/, '').split(' ');
    const whatMain = words.slice(0, 2).join(' ');
    const whatAccent = words.slice(2).join(' ') + '?';
    const accent = de ? t.h1Accent : titleCase(t.h1Accent);
    const body = `
<section class="hero hero--page" aria-labelledby="t-title">
  ${heroMedia(t.image, t.imageAlt)}
  <div class="container hero__content">
    ${crumbs([[S.nav.treatments, P('treatments')], [t.navName, path]])}
    <p class="eyebrow eyebrow--light fade-up">${esc(cat.name)} ${TP.inCity}</p>
    <div class="hero__grid">
      <h1 class="title title--lg title--light hero__title" id="t-title"><span class="ln"><span>${esc(t.h1)}</span></span><span class="ln"><span><em>${esc(accent)}</em></span></span></h1>
      <div class="hero__side">
        <p class="price-tag fade-up d1"><span>${S.from}</span><b>${chf(from)}</b></p>
        <p class="fade-up d1">${esc(t.lead)}</p>
        <div class="hero__ctas fade-up d2">${bookBtn(S.book, 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="#preise"><span>${TP.prices}</span></a></div>
      </div>
    </div>
    <div class="hero__bar fade-up d3"><ul class="chips">${t.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
  </div>
</section>

<nav class="toc" aria-label="${TP.tocAria}">
  <div class="container toc__in">
    <a href="#was">${TP.toc[0]}</a><a href="#indikationen">${esc(t.indications.title)}</a><a href="#ablauf">${TP.toc[1]}</a><a href="#ergebnisse">${TP.toc[2]}</a><a href="#preise">${TP.toc[3]}</a><a href="#faq">${TP.toc[4]}</a>
    ${bookBtn(S.book, 'btn btn--dark btn--xs toc__cta')}
  </div>
</nav>

<section class="section" id="was" aria-labelledby="was-title">
  <div class="container split">
    <div class="split__head">
      <p class="eyebrow" data-reveal>${esc(t.keyword)}</p>
      ${title(whatMain, whatAccent, { id: 'was-title' })}
    </div>
    <div class="split__body">
      <p class="lead" data-reveal>${esc(t.intro)}</p>
      <p data-reveal>${esc(t.what.text)}</p>
      <ul class="checks" data-reveal>${t.what.bullets.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="section section--alt" id="indikationen" aria-label="${esc(t.indications.title)} ${TP.and} ${esc(t.contra.title)}">
  <div class="container duo">
    <div data-reveal>
      <p class="eyebrow">${TP.forWhom}</p>
      <h2>${esc(t.indications.title)}</h2>
      <ul class="checks">${t.indications.items.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
    </div>
    <div data-reveal style="--d:120ms">
      <p class="eyebrow">${t.contra.positive ? TP.plus : TP.goodToKnow}</p>
      <h2>${esc(t.contra.title)}</h2>
      <ul class="checks ${t.contra.positive ? '' : 'checks--x'}">${t.contra.items.map((b) => `<li>${icon(t.contra.positive ? 'check' : 'x')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <p class="note">${esc(t.contra.note)}</p>
    </div>
  </div>
</section>

<section class="section" id="ablauf" aria-labelledby="ablauf-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>${TP.process}</p>${title(TP.pTitle, TP.pAccent, { id: 'ablauf-title' })}</div>
      <div class="head__text" data-reveal><p>${TP.pText}</p></div>
    </div>
    <ol class="steps steps--${t.steps.length === 3 ? 3 : 4}">
      ${t.steps.map(([h, d], i) => `<li data-reveal style="--d:${i * 100}ms"><span class="steps__n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(d)}</p></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section section--dark" id="ergebnisse" aria-labelledby="erg-title">
  <div class="container results">
    <div>
      <p class="eyebrow eyebrow--light" data-reveal>${TP.expect}</p>
      ${title(t.results.title.split(' & ')[0], t.results.title.includes(' & ') ? '& ' + t.results.title.split(' & ')[1] : '', { id: 'erg-title', cls: 'title--light' })}
      <ul class="checks checks--light" data-reveal>${t.results.items.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <p class="note" style="color:rgba(255,255,255,.62)" data-reveal>${esc(t.results.note)}</p>
    </div>
    <div>${t.results.stats.map(([v, l], i) => `<div class="rstat" data-reveal style="--d:${i * 120}ms"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
  </div>
</section>

<section class="section" id="preise" aria-labelledby="preise-title">
  <div class="container prices">
    <div class="prices__head">
      <p class="eyebrow" data-reveal>${TP.pricesOf} ${esc(t.navName)}</p>
      ${title(TP.prTitle, TP.prAccent, { id: 'preise-title' })}
      <p data-reveal>${TP.prText}</p>
      <div class="prices__cta" data-reveal>${bookBtn(S.bookSecure)}<a class="link" href="${P('prices')}">${TP.allPrices} ${icon('right')}</a></div>
    </div>
    <div data-reveal>
      <ul class="plist">${t.prices.map(priceRow).join('')}</ul>
      ${t.priceNote ? `<p class="note">${esc(t.priceNote)}</p>` : ''}
    </div>
  </div>
</section>

<section class="section section--alt" id="faq" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <div class="faq-grid__head">
      <p class="eyebrow" data-reveal>${TP.faqOf} ${esc(t.navName)}</p>
      ${title(TP.fTitle, TP.fAccent, { id: 'faq-title' })}
      <p data-reveal>${TP.fText}</p>
      <p data-reveal><a class="link" href="${SITE.phoneHref}">${esc(SITE.phone)} ${icon('right')}</a></p>
    </div>
    ${faqList(t.faq)}
  </div>
</section>

<section class="section" aria-labelledby="rel-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>${TP.relEyebrow}</p>${title(TP.relTitle, TP.relAccent, { id: 'rel-title' })}</div>
      <div class="head__text" data-reveal><a class="link" href="${P('treatments')}">${TP.allT} ${icon('right')}</a></div>
    </div>
    ${treatmentList(related, { groups: false })}
  </div>
</section>
`;
    const serviceSchema = {
      '@context': 'https://schema.org', '@type': 'Service', '@id': abs(path) + '#service',
      name: t.navName + (de ? ' in Zürich' : ' in Zurich'), serviceType: t.navName, category: cat.name, description: t.description,
      url: abs(path), image: imgUrl(t.image), provider: { '@id': BUSINESS_ID }, areaServed: { '@type': 'City', name: 'Zürich' }, inLanguage: S.htmlLang,
      offers: t.prices.filter((p) => p.price).map((p) => ({ '@type': 'Offer', name: p.name + (p.detail ? ` (${p.detail})` : ''), price: p.price, priceCurrency: 'CHF', url: abs(path) + '#preise', availability: 'https://schema.org/InStock', ...(p.from ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: p.price, priceCurrency: 'CHF' } } : {}) })),
    };
    add(key, layout({
      key, title: t.title, description: t.description, active: 'treatments', body, hasHero: true,
      schemas: [serviceSchema, faqSchema(t.faq), breadcrumbSchema([[S.nav.treatments, P('treatments')], [t.navName, path]])],
      ogImage: `/assets/img/${t.image}.jpg`, preload: preloadImg(t.image),
    }), { priority: de ? '0.9' : '0.8' });
  }

  /* Behandlungen Übersicht */
  {
    const T = de
      ? { l1: 'Behandlungen', l2: 'in Zürich', text: 'Ästhetische Medizin, Laser, apparative Kosmetik, Peelings und Massagen – alle 13 Behandlungen von Perfect Shape an der Bahnhofstrasse 94 im Überblick.', alt: 'Behandlungsraum bei Perfect Shape Zürich', title: 'Alle Behandlungen – Ästhetik & Laser Zürich | Perfect Shape', description: 'Alle Behandlungen im Überblick: Fadenlifting, Hyaluron, Mesotherapie, PRP, Laser-Haarentfernung, Endolift®, RF Needling, Peelings & Massagen in Zürich.' }
      : { l1: 'Treatments', l2: 'in Zurich', text: 'Aesthetic medicine, laser, device-based skincare, peels and massages – all 13 treatments at Perfect Shape, Bahnhofstrasse 94, at a glance.', alt: 'Treatment room at Perfect Shape Zurich', title: 'All Treatments – Aesthetics & Laser Zurich | Perfect Shape', description: 'All treatments at a glance: thread lift, fillers, mesotherapy, PRP, laser hair removal, Endolift®, RF microneedling, peels & massages in Zurich.' };
    const body = `
<section class="hero hero--page" aria-labelledby="b-title">
  ${heroMedia(HOME.treatmentsHero, T.alt)}
  <div class="container hero__content">
    ${crumbs([[S.nav.treatments, P('treatments')]])}
    <div class="hero__grid">
      <h1 class="title title--lg title--light hero__title" id="b-title"><span class="ln"><span>${T.l1}</span></span><span class="ln"><span><em>${T.l2}</em></span></span></h1>
      <div class="hero__side"><p class="fade-up d1">${T.text}</p><div class="hero__ctas fade-up d2">${bookBtn(S.book, 'btn btn--light btn--lg')}</div></div>
    </div>
  </div>
</section>
<section class="section"><div class="container">${categoryList(TR, { catTag: 'h2', itemTag: 'h3', open: 0 })}</div></section>
`;
    add('treatments', layout({
      key: 'treatments', title: T.title, description: T.description, active: 'treatments', body, hasHero: true, preload: preloadImg(HOME.treatmentsHero),
      schemas: [breadcrumbSchema([[S.nav.treatments, P('treatments')]]), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: TR.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(tPath(t)), name: t.navName })) }],
    }), { priority: de ? '0.9' : '0.8' });
  }

  /* Preise */
  {
    const T = de
      ? { l1: 'Preise', l2: 'transparent &amp; fair', text: 'Richtwerte pro Behandlung in CHF inkl. MwSt. Die finalen Kosten legen wir nach Ihrer individuellen Beratung fest – ehrlich und ohne versteckte Kosten.', toc: 'Preiskategorien', to: 'Zur Behandlung', note: 'Alle Preise in Schweizer Franken (CHF) inkl. MwSt. Preisänderungen vorbehalten. Zahlung in bar, per Karte oder TWINT. Es gelten unsere', terms: 'AGB', title: 'Preise – Ästhetik & Laser Zürich | Perfect Shape', description: 'Transparente Preise in Zürich: Laser-Haarentfernung ab CHF 40, Lippenaufbau ab CHF 160, Fadenlifting ab CHF 240, Endolift® CHF 1800. Jetzt buchen.' }
      : { l1: 'Prices', l2: 'transparent &amp; fair', text: 'Guide prices per treatment in CHF incl. VAT. The final cost is confirmed after your individual consultation – honest and without hidden costs.', toc: 'Price categories', to: 'View treatment', note: 'All prices in Swiss francs (CHF) incl. VAT. Prices subject to change. Payment in cash, by card or TWINT. Our', terms: 'terms (German) apply', title: 'Prices – Aesthetic Treatments Zurich | Perfect Shape', description: 'Transparent prices in Zurich: laser hair removal from CHF 40, lip fillers from CHF 160, thread lifts from CHF 240, Endolift® CHF 1800. Book online now.' };
    const body = `
<section class="phead">
  <div class="container">
    ${crumbs([[S.nav.prices, P('prices')]])}
    <div class="phead__row">
      <h1 class="title title--lg hero__title"><span class="ln"><span>${T.l1}</span></span><span class="ln"><span><em>${T.l2}</em></span></span></h1>
      <div><p class="lead fade-up d1">${T.text}</p><div class="hero__ctas fade-up d2" style="margin-top:24px">${bookBtn(S.bookSecure)}</div></div>
    </div>
  </div>
</section>
<nav class="toc" aria-label="${T.toc}">
  <div class="container toc__in">${TR.map((t) => `<a href="#${t.deSlug}">${esc(t.navName)}</a>`).join('')}</div>
</nav>
<section class="section section--tight">
  <div class="container">
    ${TR.map((t) => `<article class="pgroup" id="${t.deSlug}" aria-labelledby="pg-${t.deSlug}">
      <div class="pgroup__head" data-reveal>
        <div class="pgroup__img">${pic(t.image, t.imageAlt, { sizes: '(max-width: 900px) 92vw, 26vw' })}</div>
        <p class="eyebrow">${esc(CAT[t.category].name)}</p>
        <h2 id="pg-${t.deSlug}">${esc(t.navName)}</h2>
        <a class="link" href="${tPath(t)}">${T.to} ${icon('right')}</a>
      </div>
      <div data-reveal><ul class="plist">${t.prices.map(priceRow).join('')}</ul>${t.priceNote ? `<p class="note">${esc(t.priceNote)}</p>` : ''}</div>
    </article>`).join('')}
    <p class="note">${T.note} <a href="${P('agb')}" style="text-decoration:underline">${T.terms}</a>.</p>
  </div>
</section>
`;
    add('prices', layout({ key: 'prices', title: T.title, description: T.description, active: 'prices', body, schemas: [breadcrumbSchema([[S.nav.prices, P('prices')]])] }), { priority: de ? '0.9' : '0.8' });
  }

  /* Über uns */
  {
    const T = de
      ? { l1: 'Das Beauty Studio', l2: 'auf höchstem Niveau', text: 'Ärztliche Kompetenz, ehrliche Beratung und modernste Lasertechnologie – mitten in Zürich.', team: 'Team', alt: 'Studio von Perfect Shape an der Bahnhofstrasse 94 in Zürich', eyebrow: 'Über Perfect Shape', intro: 'Wohlfühlen in Ihrer Haut – das ist unser Bestreben. In unserem Studio werden Diagnostik und Behandlung von geprüften Ärzten und Spezialistinnen durchgeführt, mit innovativsten Lasertechnologien und <em>hochwertigsten</em> Materialien.', tEyebrow: 'Unsere Expertinnen', tTitle: 'Das', tAccent: 'Team', partners: 'Partner &amp; Marken', sEyebrow: 'Bahnhofstrasse 94 · 2. Etage', sTitle: 'Unser', sAccent: 'Studio', sText: 'Hell, ruhig und diskret – mitten in Zürich, nur wenige Gehminuten vom Hauptbahnhof.', g: ['Moderner Behandlungsraum bei Perfect Shape Zürich', 'Zertifikate und Diplome bei Perfect Shape Zürich', 'Agnieszka Jaggy bei einer apparativen Behandlung'], title: 'Über uns – Dr. med. Roya Jeyrani & Team | Perfect Shape', description: 'Perfect Shape Zürich: Dr. med. Roya Jeyrani und Agnieszka Jaggy – ärztliche Kompetenz, ehrliche Beratung und modernste Lasertechnologie an der Bahnhofstrasse.' }
      : { l1: 'The Beauty Studio', l2: 'at the highest level', text: 'Medical expertise, honest advice and state-of-the-art laser technology – in the heart of Zurich.', team: 'Team', alt: 'Perfect Shape studio at Bahnhofstrasse 94 in Zurich', eyebrow: 'About Perfect Shape', intro: 'Feeling good in your skin – that is our aim. In our studio, diagnosis and treatment are carried out by certified physicians and specialists, using the most innovative laser technologies and the <em>highest-quality</em> materials.', tEyebrow: 'Our experts', tTitle: 'The', tAccent: 'Team', partners: 'Partners &amp; brands', sEyebrow: 'Bahnhofstrasse 94 · 2nd floor', sTitle: 'Our', sAccent: 'Studio', sText: 'Bright, calm and discreet – in the heart of Zurich, just a few minutes’ walk from the main station.', g: ['Modern treatment room at Perfect Shape Zurich', 'Certificates and diplomas at Perfect Shape Zurich', 'Agnieszka Jaggy during a device-based treatment'], title: 'About Us – Dr. med. Roya Jeyrani & Team | Perfect Shape Zurich', description: 'Perfect Shape Zurich: Dr. med. Roya Jeyrani and Agnieszka Jaggy – medical expertise, honest advice and state-of-the-art laser technology on Bahnhofstrasse.' };
    const body = `
<section class="hero hero--page" aria-labelledby="u-title">
  ${heroMedia(HOME.aboutHero, T.alt)}
  <div class="container hero__content">
    ${crumbs([[S.nav.about, P('about')]])}
    <div class="hero__grid">
      <h1 class="title title--lg title--light hero__title" id="u-title"><span class="ln"><span>${T.l1}</span></span><span class="ln"><span><em>${T.l2}</em></span></span></h1>
      <div class="hero__side"><p class="fade-up d1">${T.text}</p><div class="hero__ctas fade-up d2">${bookBtn(S.book, 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="#team"><span>${T.team}</span></a></div></div>
    </div>
  </div>
</section>
<section class="section"><div class="container"><p class="eyebrow" data-reveal>${T.eyebrow}</p><p class="intro__text words" data-words>${T.intro}</p></div></section>
<section class="section section--alt" id="team" aria-labelledby="team-title">
  <div class="container">
    <div class="head"><div><p class="eyebrow" data-reveal>${T.tEyebrow}</p>${title(T.tTitle, T.tAccent, { id: 'team-title' })}</div></div>
    ${D.TEAM.map((p) => `<article class="bio">
      <div class="bio__img" data-reveal="img">${pic(p.image, p.alt, { sizes: '(max-width: 900px) 92vw, 36vw' })}</div>
      <div class="bio__text">
        <p class="eyebrow" data-reveal>${esc(p.roleShort)}</p>
        ${title(p.name, '', { tag: 'h3', cls: 'title--md' })}
        <p class="bio__role" data-reveal>${esc(p.role)}</p>
        ${p.bio.map((b) => `<p data-reveal>${esc(b)}</p>`).join('')}
        <ul class="checks" data-reveal>${p.facts.map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>
      </div>
    </article>`).join('')}
  </div>
</section>
<section class="section section--tight"><div class="container">${brands(T.partners)}</div></section>
<section class="section" aria-labelledby="studio-title">
  <div class="container">
    <div class="head"><div><p class="eyebrow" data-reveal>${T.sEyebrow}</p>${title(T.sTitle, T.sAccent, { id: 'studio-title' })}</div><div class="head__text" data-reveal><p>${T.sText}</p></div></div>
    <div class="gallery">
      <figure class="gallery__a" data-reveal="img">${pic('studio-perfect-shape-zuerich-behandlungsraum', T.g[0], { sizes: '(max-width: 900px) 92vw, 56vw' })}</figure>
      <figure class="gallery__b" data-reveal="img">${pic('studio-perfect-shape-zuerich-zertifikate', T.g[1], { sizes: '(max-width: 900px) 92vw, 36vw' })}</figure>
      <figure class="gallery__c" data-reveal="img">${pic('agnieszka-jaggy-behandlung', T.g[2], { sizes: '(max-width: 900px) 92vw, 36vw' })}</figure>
    </div>
  </div>
</section>
${visitBlock()}
`;
    add('about', layout({
      key: 'about', title: T.title, description: T.description, active: 'about', body, hasHero: true, preload: preloadImg(HOME.aboutHero),
      schemas: [breadcrumbSchema([[S.nav.about, P('about')]]), ...D.TEAM.map((p) => ({ '@context': 'https://schema.org', '@type': 'Person', name: p.name, jobTitle: p.roleShort, description: p.bio[0], image: imgUrl(p.image), worksFor: { '@id': BUSINESS_ID } }))],
    }), { priority: de ? '0.8' : '0.7' });
  }

  /* Kontakt */
  {
    const T = de
      ? { l1: 'Kontakt', l2: '&amp; Termin', text: 'Am schnellsten geht’s online. Oder schreiben Sie uns – wir melden uns schnellstmöglich bei Ihnen.', direct: 'Direkt erreichen', online: 'Online', onlineText: 'Termin buchen – rund um die Uhr', send: 'Nachricht senden', name: 'Name', namePh: 'Vor- und Nachname', emailPh: 'name@beispiel.ch', topic: 'Behandlung', topicPh: 'Bitte wählen (optional)', general: 'Allgemeine Frage', msg: 'Nachricht', msgPh: 'Wie können wir Ihnen helfen?', consent: 'Ich stimme der Verarbeitung meiner Daten zur Bearbeitung meiner Anfrage zu', title: 'Kontakt & Termin – Perfect Shape Zürich', description: 'Kontaktieren Sie Perfect Shape Zürich: Bahnhofstrasse 94, 8001 Zürich · Tel. +41 76 608 61 61 · WhatsApp · E-Mail. Termin online buchen – rund um die Uhr.' }
      : { l1: 'Contact', l2: '&amp; booking', text: 'Booking online is fastest. Or send us a message – we’ll get back to you as soon as possible.', direct: 'Reach us directly', online: 'Online', onlineText: 'Book an appointment – 24/7', send: 'Send a message', name: 'Name', namePh: 'First and last name', emailPh: 'name@example.com', topic: 'Treatment', topicPh: 'Please choose (optional)', general: 'General question', msg: 'Message', msgPh: 'How can we help you?', consent: 'I agree to the processing of my data to handle my enquiry', title: 'Contact & Booking – Perfect Shape Zurich', description: 'Contact Perfect Shape Zurich: Bahnhofstrasse 94, 8001 Zurich · Phone +41 76 608 61 61 · WhatsApp · Email. Book your appointment online 24/7.' };
    const body = `
<section class="phead">
  <div class="container">
    ${crumbs([[S.nav.contact, P('contact')]])}
    <div class="phead__row">
      <h1 class="title title--lg hero__title"><span class="ln"><span>${T.l1}</span></span><span class="ln"><span><em>${T.l2}</em></span></span></h1>
      <p class="lead fade-up d1">${T.text}</p>
    </div>
  </div>
</section>
<section class="section section--tight">
  <div class="container contact">
    <div data-reveal>
      <p class="eyebrow">${T.direct}</p>
      <ul class="clist" style="margin-top:0">
        <li><b>${T.online}</b><a href="${esc(bk())}" target="_blank" rel="noopener" data-book>${T.onlineText}</a></li>
        <li><b>${S.phone}</b><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></li>
        <li><b>WhatsApp</b><a href="${SITE.whatsapp}" target="_blank" rel="noopener">${S.whatsappText}</a></li>
        <li><b>${S.email}</b><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></li>
        <li><b>${S.address}</b><a href="${SITE.route}" target="_blank" rel="noopener">${addr()}</a></li>
      </ul>
      <div class="contact__quick">${bookBtn(S.bookOnline, 'btn btn--dark btn--lg')}</div>
    </div>
    <div data-reveal style="--d:120ms">
      <p class="eyebrow">${T.send}</p>
      <form class="form" id="contactForm" novalidate data-mailto="${SITE.email}" data-lang="${LANG}">
        <div class="form__row">
          <div class="field"><label for="cfName">${T.name} *</label><input id="cfName" name="name" type="text" autocomplete="name" required placeholder="${T.namePh}"></div>
          <div class="field"><label for="cfEmail">${S.email} *</label><input id="cfEmail" name="email" type="email" autocomplete="email" required placeholder="${T.emailPh}"></div>
        </div>
        <div class="form__row">
          <div class="field"><label for="cfPhone">${S.phone}</label><input id="cfPhone" name="phone" type="tel" autocomplete="tel" placeholder="+41 …"></div>
          <div class="field"><label for="cfTopic">${T.topic}</label><select id="cfTopic" name="topic"><option value="">${T.topicPh}</option>${TR.map((t) => `<option>${esc(t.navName)}</option>`).join('')}<option>${T.general}</option></select></div>
        </div>
        <div class="field"><label for="cfMsg">${T.msg} *</label><textarea id="cfMsg" name="message" rows="4" required placeholder="${T.msgPh}"></textarea></div>
        <label class="check"><input type="checkbox" name="consent" required> <span>${T.consent} (<a href="${P('privacy')}">${S.privacy}</a>). *</span></label>
        <button class="btn btn--dark btn--lg" type="submit"><span>${T.send}</span>${icon('arrow')}</button>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>
<section class="section section--tight" aria-label="${S.mapAria}"><div class="container">${mapBox()}</div></section>
`;
    add('contact', layout({
      key: 'contact', title: T.title, description: T.description, active: 'contact', body, cta: false,
      schemas: [breadcrumbSchema([[S.nav.contact, P('contact')]]), { '@context': 'https://schema.org', '@type': 'ContactPage', url: abs(P('contact')), name: T.title, about: { '@id': BUSINESS_ID } }],
    }), { priority: de ? '0.8' : '0.7' });
  }

  /* Rechtliches (Inhalt nur auf Deutsch – rechtlich verbindlich) */
  const stand = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });
  const legal = (key, pageTitle, h1, description, content) => {
    const body = `
<section class="phead"><div class="container">${crumbs([[h1, P(key)]])}<h1 class="title title--lg">${esc(h1)}</h1></div></section>
<section class="section section--tight"><div class="container prose">${content}</div></section>`;
    add(key, layout({ key, title: pageTitle, description, body, cta: false, schemas: [breadcrumbSchema([[h1, P(key)]])] }), { priority: '0.3', changefreq: 'yearly' });
  };
  legal('agb', 'AGB – Allgemeine Geschäftsbedingungen | Perfect Shape Zürich', 'AGB',
    'Allgemeine Geschäftsbedingungen von Perfect Shape Zürich: Terminvereinbarung, Stornierung, Preise, Zahlung, Haftung und Datenschutz.',
    AGB.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('') + `<p class="note">Stand: ${stand}</p>`);
  legal('privacy', 'Datenschutzerklärung | Perfect Shape Zürich', 'Datenschutz',
    'Datenschutzerklärung von Perfect Shape Zürich gemäss Schweizer Datenschutzgesetz (DSG): welche Daten wir bearbeiten, wofür und welche Rechte Sie haben.',
    `<p>Der Schutz Ihrer Personendaten ist uns wichtig. In dieser Datenschutzerklärung informieren wir Sie darüber, welche Personendaten wir im Zusammenhang mit unserer Website und unseren Dienstleistungen bearbeiten. Massgebend ist das Schweizer Bundesgesetz über den Datenschutz (DSG).</p>
<h2>1. Verantwortliche Stelle</h2>
<p>Perfect Shape Zürich<br>${esc(SITE.street)}, ${esc(SITE.floor)}<br>${SITE.zip} ${esc(SITE.city)}, Schweiz<br>E-Mail: <a href="mailto:${SITE.email}">${esc(SITE.email)}</a><br>Telefon: <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></p>
<h2>2. Besuch der Website</h2>
<p>Beim Aufruf unserer Website werden durch unseren Hosting-Anbieter technisch notwendige Daten (z. B. IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Browsertyp) in Server-Logfiles verarbeitet. Diese Daten dienen ausschliesslich dem sicheren und stabilen Betrieb der Website. Unsere Website wird bei Vercel Inc. (USA) gehostet; dabei kann eine Übermittlung von Daten in die USA erfolgen, die durch geeignete Garantien (z. B. Standardvertragsklauseln) abgesichert ist.</p>
<p>Wir verwenden keine Tracking- oder Marketing-Cookies. Schriftarten werden lokal von unserem Server geladen – es findet keine Verbindung zu Google Fonts statt.</p>
<h2>3. Kontaktaufnahme</h2>
<p>Wenn Sie uns per E-Mail, Telefon, WhatsApp oder über das Kontaktformular kontaktieren, bearbeiten wir Ihre Angaben (z. B. Name, E-Mail-Adresse, Telefonnummer, Nachricht) ausschliesslich zur Beantwortung Ihrer Anfrage. Das Kontaktformular öffnet Ihr E-Mail-Programm; die Nachricht wird erst versendet, wenn Sie diese dort abschicken. Bei Nutzung von WhatsApp gelten zusätzlich die Datenschutzbestimmungen von WhatsApp/Meta.</p>
<h2>4. Online-Terminbuchung</h2>
<p>Für die Online-Terminbuchung nutzen wir den Dienst TIMIFY (TIMIFY GmbH, Deutschland). Wenn Sie einen Termin buchen, werden die von Ihnen eingegebenen Daten (z. B. Name, Kontaktdaten, gewünschte Behandlung, Termin) an TIMIFY übermittelt und dort zur Terminverwaltung gespeichert. Das Buchungsfenster wird erst geladen, wenn Sie aktiv auf «Termin buchen» klicken.</p>
<h2>5. Google Maps</h2>
<p>Auf unserer Website können Sie eine Karte von Google Maps (Google Ireland Ltd. / Google LLC) einblenden. Die Karte wird erst nach Ihrem Klick auf «Karte laden» geladen. Dabei werden Daten (insbesondere Ihre IP-Adresse) an Google übertragen, möglicherweise auch in die USA.</p>
<h2>6. Social Media</h2>
<p>Auf unserer Website verlinken wir auf unsere Profile bei Instagram und Facebook. Es handelt sich um einfache Links; Daten werden erst übertragen, wenn Sie den Links folgen.</p>
<h2>7. Kundendaten &amp; Gesundheitsdaten</h2>
<p>Im Rahmen von Beratungen und Behandlungen bearbeiten wir auch besonders schützenswerte Personendaten (Gesundheitsdaten), soweit dies für eine sichere Behandlung erforderlich ist. Diese Daten behandeln wir streng vertraulich und geben sie nicht ohne Ihre ausdrückliche Einwilligung an Dritte weiter, sofern keine gesetzliche Pflicht besteht.</p>
<h2>8. Aufbewahrung</h2>
<p>Wir speichern Personendaten nur so lange, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.</p>
<h2>9. Ihre Rechte</h2>
<p>Sie haben das Recht, Auskunft über Ihre bei uns gespeicherten Personendaten zu verlangen sowie deren Berichtigung, Löschung oder Herausgabe zu beantragen. Wenden Sie sich dazu an <a href="mailto:${SITE.email}">${esc(SITE.email)}</a>. Zudem können Sie sich an den Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB) wenden.</p>
<h2>10. Änderungen</h2>
<p>Wir können diese Datenschutzerklärung jederzeit anpassen. Es gilt die jeweils aktuelle, auf dieser Website veröffentlichte Fassung.</p>
<p class="note">Stand: ${stand}</p>`);
  legal('imprint', 'Impressum | Perfect Shape Zürich', 'Impressum',
    'Impressum von Perfect Shape Zürich – Studio für Ästhetik & Lasermedizin, Bahnhofstrasse 94, 8001 Zürich.',
    `<h2>Kontaktadresse</h2>
<p>Perfect Shape Zürich<br>Studio für Ästhetik &amp; Lasermedizin<br>${esc(SITE.street)}, ${esc(SITE.floor)}<br>${SITE.zip} ${esc(SITE.city)}<br>Schweiz</p>
<p>Telefon: <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a><br>E-Mail: <a href="mailto:${SITE.email}">${esc(SITE.email)}</a></p>
<h2>Haftungsausschluss</h2>
<p>Die Inhalte dieser Website wurden mit grösster Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen. Die Informationen auf dieser Website ersetzen keine persönliche ärztliche Beratung. Angegebene Preise sind Richtwerte; massgeblich ist das individuelle Beratungsgespräch.</p>
<h2>Haftung für Links</h2>
<p>Verweise und Links auf Websites Dritter liegen ausserhalb unseres Verantwortungsbereichs. Für deren Inhalte sind ausschliesslich die jeweiligen Betreiber verantwortlich.</p>
<h2>Urheberrechte</h2>
<p>Die Urheber- und alle anderen Rechte an Inhalten, Bildern, Fotos oder anderen Dateien auf dieser Website gehören ausschliesslich Perfect Shape Zürich oder den speziell genannten Rechteinhabern. Für die Reproduktion jeglicher Elemente ist die schriftliche Zustimmung im Voraus einzuholen.</p>`);

  /* 404 */
  PATHS.notfound = { de: '/404' };
  add('notfound', layout({
    key: 'notfound', title: de ? 'Seite nicht gefunden | Perfect Shape Zürich' : 'Page not found | Perfect Shape Zurich', description: de ? 'Diese Seite existiert leider nicht. Entdecken Sie unsere Behandlungen für Ästhetik & Lasermedizin in Zürich.' : 'This page does not exist. Discover our aesthetic and laser treatments in Zurich.', noindex: true, cta: false,
    body: `<section class="phead" style="min-height:70vh"><div class="container">
    <p class="nf__code">404</p>
    <h1 class="title title--lg">${de ? 'Seite <em>nicht gefunden</em>' : 'Page <em>not found</em>'}</h1>
    <p class="lead" style="margin:24px 0 30px;max-width:560px">${de ? 'Die gesuchte Seite existiert nicht oder wurde verschoben.' : 'The page you are looking for doesn’t exist or has been moved.'}</p>
    <div class="hero__ctas"><a class="btn btn--dark btn--lg" href="/"><span>${de ? 'Zur Startseite' : 'Back to home'}</span></a><a class="btn btn--line btn--lg" href="${P('treatments')}"><span>${de ? 'Alle Behandlungen' : 'All treatments'}</span></a></div>
  </div></section>`,
  }), { sitemap: false, file: '404.html' });
}

buildLang('de');
buildLang('en');

/* ---------- CSS minifizieren ---------- */
const css = readFileSync(join(ROOT, 'assets/css/style.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
writeFileSync(join(ROOT, 'assets/css/style.min.css'), css);

/* ---------- Schreiben ---------- */
const pages = Object.values(PAGES);
for (const p of pages) writeFileSync(join(ROOT, p.file), shyHeadings(compose(p.key, p.de, p.en)));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.filter((p) => p.sitemap).map((p) => {
  const t = p.key.startsWith('t:') ? DE.TREATMENTS.find((x) => 't:' + x.slug === p.key) : null;
  return `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${t ? `
    <image:image><image:loc>${imgUrl(t.image)}</image:loc></image:image>` : ''}
  </url>`;
}).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`✓ ${pages.length} Seiten generiert (je DE + EN auf derselben Seite)`);
