// Statischer Site-Generator für perfectshape-zuerich.ch
// Aufruf: node scripts/build.mjs  → schreibt alle HTML-Seiten, sitemap.xml und robots.txt ins Projekt-Root.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, CATEGORIES, TREATMENTS, TEAM, REVIEWS, HOME_FAQ, AGB } from './content.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = JSON.parse(readFileSync(join(ROOT, 'scripts/imgmeta.json'), 'utf8'));
const TODAY = new Date().toISOString().slice(0, 10);
const VERSION = Date.now().toString(36);

/* ---------- Helpers ---------- */
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const chf = (n) => 'CHF ' + n.toLocaleString('de-CH').replace(/[’']/g, '’');
const bySlug = Object.fromEntries(TREATMENTS.map((t) => [t.slug, t]));
const catById = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const minPrice = (t) => Math.min(...t.prices.filter((p) => p.price).map((p) => p.price));
const abs = (path) => SITE.url + (path === '/' ? '/' : path);

function pic(name, alt, { sizes = '100vw', eager = false, cls = '', imgCls = '' } = {}) {
  const m = IMG[name];
  if (!m) throw new Error('Bild fehlt: ' + name);
  const srcset = m.widths.map((w) => `/assets/img/${name}-${w}.webp ${w}w`).join(', ');
  const fw = Math.min(1200, m.w);
  const fh = Math.round(m.h * (fw / m.w));
  return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/webp" srcset="${srcset}" sizes="${sizes}"><img src="/assets/img/${name}.jpg" alt="${esc(alt)}" width="${fw}" height="${fh}"${imgCls ? ` class="${imgCls}"` : ''} ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async"></picture>`;
}

const ICONS = {
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  right: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  left: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
  mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" stroke="none"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
  heart: '<path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z"/>',
  leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6"/>',
  laser: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.3-1.8-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-1.8z" fill="currentColor" stroke="none"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  facebook: '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l.5-4H12V7.8c0-.5.4-.8.8-.8H15z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  route: '<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
};
const icon = (n, cls = '') => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

const bookBtn = (label = 'Termin buchen', cls = 'btn btn--primary') =>
  `<a class="${cls}" href="${esc(SITE.booking)}" target="_blank" rel="noopener" data-book><span>${label}</span>${icon('arrow')}</a>`;

const heading = (main, accent, { tag = 'h2', cls = '', eyebrow = '' } = {}) =>
  `${eyebrow ? `<p class="eyebrow" data-reveal>${esc(eyebrow)}</p>` : ''}<${tag} class="display${cls ? ' ' + cls : ''}" data-reveal>${esc(main)}${accent ? ` <em>${esc(accent)}</em>` : ''}</${tag}>`;

/* ---------- Strukturierte Daten ---------- */
const BUSINESS_ID = SITE.url + '/#business';
const businessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': ['BeautySalon', 'MedicalBusiness'],
  '@id': BUSINESS_ID,
  name: SITE.name,
  alternateName: 'Perfect Shape – Ästhetik & Lasermedizin',
  description: 'Studio für Ästhetik und Lasermedizin an der Bahnhofstrasse 94 in Zürich: Fadenlifting, Hyaluron, Laser-Haarentfernung, Endolift®, RF Needling, Peelings und Massagen – durchgeführt von geprüften Ärzten und Spezialistinnen.',
  url: SITE.url + '/',
  logo: SITE.url + '/assets/img/logo-perfect-shape-zuerich.png',
  image: [SITE.url + '/assets/img/og-image.jpg', SITE.url + '/assets/img/studio-perfect-shape-zuerich-empfang.jpg', SITE.url + '/assets/img/studio-perfect-shape-zuerich-behandlungsraum.jpg'],
  telephone: '+41766086161',
  email: SITE.email,
  priceRange: 'CHF 40 – CHF 1800',
  currenciesAccepted: 'CHF',
  paymentAccepted: 'Bargeld, Kreditkarte, TWINT',
  address: { '@type': 'PostalAddress', streetAddress: 'Bahnhofstrasse 94, 2. Etage', postalCode: '8001', addressLocality: 'Zürich', addressRegion: 'ZH', addressCountry: 'CH' },
  hasMap: SITE.googleMaps,
  areaServed: [{ '@type': 'City', name: 'Zürich' }, { '@type': 'State', name: 'Kanton Zürich' }],
  sameAs: [SITE.instagram, SITE.facebook, SITE.googleMaps],
  potentialAction: { '@type': 'ReserveAction', target: { '@type': 'EntryPoint', urlTemplate: SITE.booking, inLanguage: 'de-CH', actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'] }, result: { '@type': 'Reservation', name: 'Termin bei Perfect Shape Zürich' } },
  employee: TEAM.map((p) => ({ '@type': 'Person', name: p.name, jobTitle: p.roleShort })),
  knowsAbout: TREATMENTS.map((t) => t.navName),
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Behandlungen',
    itemListElement: CATEGORIES.map((c) => ({
      '@type': 'OfferCatalog',
      name: c.name,
      itemListElement: TREATMENTS.filter((t) => t.category === c.id).map((t) => ({
        '@type': 'Offer',
        priceCurrency: 'CHF',
        price: minPrice(t),
        url: abs('/' + t.slug),
        itemOffered: { '@type': 'Service', name: t.navName },
      })),
    })),
  },
});
const websiteSchema = () => ({ '@context': 'https://schema.org', '@type': 'WebSite', '@id': SITE.url + '/#website', url: SITE.url + '/', name: SITE.name, inLanguage: 'de-CH', publisher: { '@id': BUSINESS_ID } });
const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [['Startseite', '/'], ...items].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
});
const faqSchema = (faq) => ({ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) });

/* ---------- Layout ---------- */
function navMega() {
  return CATEGORIES.map((c) => `<div class="mega__col"><p class="mega__title">${esc(c.name)}</p><ul>${TREATMENTS.filter((t) => t.category === c.id).map((t) => `<li><a href="/${t.slug}">${esc(t.navName)}<span>ab ${chf(minPrice(t))}</span></a></li>`).join('')}</ul></div>`).join('');
}

function header(active) {
  const a = (k) => (active === k ? ' aria-current="page"' : '');
  return `
<a class="skip" href="#main">Zum Inhalt springen</a>
<div class="topbar">
  <div class="container topbar__in">
    <span>${icon('pin')} ${esc(SITE.street)}, ${SITE.zip} ${esc(SITE.city)}</span>
    <span class="topbar__right"><a href="${SITE.phoneHref}">${icon('phone')} ${esc(SITE.phone)}</a><a href="mailto:${SITE.email}">${icon('mail')} ${esc(SITE.email)}</a><a href="${esc(SITE.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a></span>
  </div>
</div>
<header class="hdr" id="top">
  <div class="container hdr__in">
    <a class="logo" href="/" aria-label="Perfect Shape Zürich – Startseite"><img src="/assets/img/logo-perfect-shape-zuerich-640.webp" alt="Perfect Shape Zürich" width="${IMG.logo.w}" height="${IMG.logo.h}" fetchpriority="high"></a>
    <nav class="nav" aria-label="Hauptnavigation">
      <ul class="nav__list">
        <li class="nav__item has-mega"><a href="/behandlungen" class="nav__link"${a('behandlungen')} aria-haspopup="true" aria-expanded="false">Behandlungen ${icon('chevron')}</a>
          <div class="mega"><div class="mega__in">${navMega()}<div class="mega__cta"><p class="display-sm">Unsicher, was <em>zu Ihnen passt?</em></p><p>Wir beraten Sie ehrlich – und raten auch ab, wenn etwas nicht ideal ist.</p>${bookBtn('Beratung buchen', 'btn btn--primary btn--sm')}</div></div></div>
        </li>
        <li class="nav__item"><a href="/preise" class="nav__link"${a('preise')}>Preise</a></li>
        <li class="nav__item"><a href="/ueber-uns" class="nav__link"${a('ueber-uns')}>Über uns</a></li>
        <li class="nav__item"><a href="/kontakt" class="nav__link"${a('kontakt')}>Kontakt</a></li>
      </ul>
    </nav>
    <div class="hdr__actions">
      <a class="hdr__phone" href="${SITE.phoneHref}" aria-label="Anrufen: ${esc(SITE.phone)}">${icon('phone')}<span>${esc(SITE.phone)}</span></a>
      ${bookBtn('Termin buchen', 'btn btn--primary btn--sm hdr__cta')}
      <button class="burger" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden>
  <div class="mnav__in">
    <nav aria-label="Mobile Navigation">
      <ul class="mnav__list">
        <li><a href="/">Startseite</a></li>
        <li><details><summary>Behandlungen ${icon('plus')}</summary>
          ${CATEGORIES.map((c) => `<p class="mnav__cat">${esc(c.name)}</p><ul>${TREATMENTS.filter((t) => t.category === c.id).map((t) => `<li><a href="/${t.slug}">${esc(t.navName)}</a></li>`).join('')}</ul>`).join('')}
          <p class="mnav__cat"><a href="/behandlungen">Alle Behandlungen ansehen →</a></p>
        </details></li>
        <li><a href="/preise">Preise</a></li>
        <li><a href="/ueber-uns">Über uns</a></li>
        <li><a href="/kontakt">Kontakt</a></li>
      </ul>
    </nav>
    <div class="mnav__foot">
      ${bookBtn('Termin online buchen', 'btn btn--primary btn--block')}
      <div class="mnav__row"><a class="btn btn--ghost" href="${SITE.phoneHref}">${icon('phone')} Anrufen</a><a class="btn btn--ghost" href="${SITE.whatsapp}" target="_blank" rel="noopener">${icon('whatsapp')} WhatsApp</a></div>
      <p class="mnav__addr">${esc(SITE.street)}, ${esc(SITE.floor)} · ${SITE.zip} ${esc(SITE.city)}</p>
    </div>
  </div>
</div>`;
}

function footer() {
  const col = (catIds) => TREATMENTS.filter((t) => catIds.includes(t.category)).map((t) => `<li><a href="/${t.slug}">${esc(t.navName)}</a></li>`).join('');
  return `
<section class="cta-band" aria-labelledby="cta-band-title">
  <div class="container cta-band__in">
    <div>
      <p class="eyebrow eyebrow--light" data-reveal>Bereit für Ihre Behandlung?</p>
      <h2 class="display display--light" id="cta-band-title" data-reveal>Ihr Termin <em>in 60 Sekunden</em></h2>
      <p class="cta-band__text" data-reveal>Buchen Sie jetzt online – rund um die Uhr. Oder rufen Sie uns an, wir beraten Sie gerne persönlich.</p>
    </div>
    <div class="cta-band__actions" data-reveal>
      ${bookBtn('Jetzt Termin buchen', 'btn btn--light btn--lg')}
      <a class="btn btn--outline-light btn--lg" href="${SITE.phoneHref}">${icon('phone')}<span>${esc(SITE.phone)}</span></a>
    </div>
  </div>
</section>
<footer class="ftr">
  <div class="ftr__marquee" aria-hidden="true"><div class="ftr__track"><span data-t="Perfect Shape"></span><span data-t="Zürich"></span><span data-t="Perfect Shape"></span><span data-t="Zürich"></span></div></div>
  <div class="container ftr__grid">
    <div class="ftr__brand">
      <a class="logo logo--ftr" href="/"><img src="/assets/img/logo-perfect-shape-zuerich-640.webp" alt="Perfect Shape Zürich" width="${IMG.logo.w}" height="${IMG.logo.h}" loading="lazy"></a>
      <p>Studio für Ästhetik &amp; Lasermedizin an der Bahnhofstrasse in Zürich. Behandlungen von geprüften Ärzten und Spezialistinnen.</p>
      <div class="ftr__social"><a href="${esc(SITE.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a><a href="${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a></div>
    </div>
    <div><p class="ftr__title">Ästhetische Medizin</p><ul>${col(['aesthetik'])}</ul></div>
    <div><p class="ftr__title">Laser, Haut &amp; Körper</p><ul>${col(['laser', 'apparativ', 'massage', 'peeling'])}</ul></div>
    <div>
      <p class="ftr__title">Kontakt</p>
      <address>
        <a href="${SITE.route}" target="_blank" rel="noopener">${icon('pin')}<span>${esc(SITE.street)}, ${esc(SITE.floor)}<br>${SITE.zip} ${esc(SITE.city)}</span></a>
        <a href="${SITE.phoneHref}">${icon('phone')}<span>${esc(SITE.phone)}</span></a>
        <a href="mailto:${SITE.email}">${icon('mail')}<span>${esc(SITE.email)}</span></a>
      </address>
      <p class="ftr__title ftr__title--sm">Studio</p>
      <ul class="ftr__inline"><li><a href="/preise">Preise</a></li><li><a href="/ueber-uns">Über uns</a></li><li><a href="/kontakt">Kontakt</a></li><li><a href="/behandlungen">Behandlungen</a></li></ul>
    </div>
  </div>
  <div class="container ftr__bottom">
    <p>© <span data-year>${new Date().getFullYear()}</span> Perfect Shape Zürich · Ästhetik &amp; Lasermedizin</p>
    <ul class="ftr__inline"><li><a href="/agb">AGB</a></li><li><a href="/datenschutz">Datenschutz</a></li><li><a href="/impressum">Impressum</a></li></ul>
  </div>
</footer>
<nav class="mbar" aria-label="Schnellkontakt">
  <a href="${SITE.phoneHref}" class="mbar__btn">${icon('phone')}<span>Anrufen</span></a>
  <a href="${SITE.whatsapp}" class="mbar__btn" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a>
  <a href="${esc(SITE.booking)}" class="mbar__btn mbar__btn--primary" target="_blank" rel="noopener" data-book>${icon('calendar')}<span>Termin buchen</span></a>
</nav>
<div class="modal" id="booking" role="dialog" aria-modal="true" aria-labelledby="booking-title" hidden>
  <div class="modal__backdrop" data-close></div>
  <div class="modal__box">
    <div class="modal__head">
      <p class="modal__title" id="booking-title">Termin <em>online buchen</em></p>
      <a class="modal__ext" href="${esc(SITE.booking)}" target="_blank" rel="noopener">In neuem Tab öffnen ${icon('arrow')}</a>
      <button class="modal__close" type="button" data-close aria-label="Schliessen">${icon('x')}</button>
    </div>
    <div class="modal__body"><div class="modal__loader" aria-hidden="true"><span></span></div><iframe title="Online-Terminbuchung Perfect Shape Zürich" data-src="${esc(SITE.bookingWidget)}" allow="payment" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
    <p class="modal__foot">Probleme mit der Buchung? Rufen Sie uns an: <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></p>
  </div>
</div>`;
}

function layout({ path, title, description, active = '', body, schemas = [], ogImage = '/assets/img/og-image.jpg', preload = '', noindex = false }) {
  const canonical = abs(path);
  const ld = [websiteSchema(), businessSchema(), ...schemas].map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  return `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="de-CH" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta name="theme-color" content="#f7f1eb">
<meta name="format-detection" content="telephone=no">
<meta name="geo.region" content="CH-ZH">
<meta name="geo.placename" content="Zürich">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_CH">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.url}${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE.url}${ogImage}">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preload" href="/assets/fonts/inter-tight-var.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/instrument-serif-italic.woff2" as="font" type="font/woff2" crossorigin>
${preload}
<link rel="stylesheet" href="/assets/css/style.min.css?v=${VERSION}">
<script>document.documentElement.classList.add('js')</script>
<script src="/assets/js/main.js?v=${VERSION}" defer></script>
${ld}
</head>
<body>
${header(active)}
<main id="main">
${body}
</main>
${footer()}
</body>
</html>
`;
}

function preloadImg(name, sizes) {
  const m = IMG[name];
  return `<link rel="preload" as="image" href="/assets/img/${name}-${m.widths[Math.min(1, m.widths.length - 1)]}.webp" imagesrcset="${m.widths.map((w) => `/assets/img/${name}-${w}.webp ${w}w`).join(', ')}" imagesizes="${sizes}" fetchpriority="high">`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Startseite</a></li>${items.map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${p}">${esc(n)}</a></li>`)).join('')}</ol></nav>`;

const faqList = (faq) => `<div class="faq">${faq.map(([q, a]) => `<details class="faq__item" data-reveal><summary><span>${esc(q)}</span><i aria-hidden="true">${icon('plus')}</i></summary><div class="faq__a"><p>${esc(a)}</p></div></details>`).join('')}</div>`;

function treatmentCard(t, { headingTag = 'h3' } = {}) {
  return `<article class="tcard" data-cat="${t.category}" data-reveal>
  <a href="/${t.slug}" class="tcard__link" aria-label="${esc(t.navName)} – mehr erfahren">
    <div class="tcard__media">${pic(t.image, t.imageAlt, { sizes: '(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 30vw' })}<span class="tcard__price">ab ${chf(minPrice(t))}</span></div>
    <div class="tcard__body">
      <p class="tcard__cat">${esc(catById[t.category].name)}</p>
      <${headingTag} class="tcard__title">${esc(t.navName)}</${headingTag}>
      <p class="tcard__text">${esc(t.card)}</p>
      <span class="tcard__more">Mehr erfahren <i class="circle-arrow">${icon('arrow')}</i></span>
    </div>
  </a>
</article>`;
}

const priceRow = (p, t) => `<li class="prow" data-reveal>
  <div class="prow__main"><p class="prow__name">${esc(p.name)}${p.detail ? ` <span>${esc(p.detail)}</span>` : ''}${p.featured ? ' <b class="badge">Beliebt</b>' : ''}</p><p class="prow__desc">${esc(p.desc)}</p>${p.extra ? `<p class="prow__extra">${icon('sparkle')} ${esc(p.extra)}</p>` : ''}</div>
  <div class="prow__side"><p class="prow__price">${p.priceText && p.price ? esc(p.priceText).replace(' · ', '<br>') : p.price ? `${p.from ? '<small>ab</small> ' : ''}${chf(p.price)}` : `<small>Preis</small> ${esc(p.priceText)}`}</p>${bookBtn('Buchen', 'btn btn--ghost btn--xs')}</div>
</li>`;

/* ---------- Seiten ---------- */
const pages = [];
const add = (file, path, html, { priority = '0.7', changefreq = 'monthly', sitemap = true } = {}) => pages.push({ file, path, html, priority, changefreq, sitemap });

/* Startseite */
{
  const featured = [
    { t: bySlug['fadenlifting-zuerich'], label: 'Bestseller', price: 'CHF 1700', name: 'Perfectshape V-Fadenlifting', text: 'Ganzes Gesicht inkl. Jawline – natürliches Lifting ohne OP, Ergebnis bis zu 18 Monate.', list: ['6 PDO-Fäden pro Seite', 'Jawline-Definition', 'Kollagenaufbau'], tone: 'sand' },
    { t: bySlug['hyaluron-zuerich'], label: 'Am häufigsten gebucht', price: 'ab CHF 160', name: 'Lippenaufbau mit Hyaluron', text: 'Präzises Modellieren für mehr Volumen und natürliche Konturen – ohne Overfilling.', list: ['0.5 ml CHF 160', '1.0 ml CHF 270', 'Sofort sichtbar'], tone: 'blush' },
    { t: bySlug['laser-haarentfernung-zuerich'], label: 'Dauerhaft glatt', price: 'ab CHF 40', name: 'Laser-Haarentfernung', text: 'Diodenlaser/SHR für alle Zonen – von der Oberlippe bis Full Body.', list: ['Achseln CHF 80', 'Ganze Beine CHF 200', 'Full Body CHF 400'], tone: 'stone' },
  ];
  const values = [
    ['shield', 'Ärztliche Kompetenz', 'Diagnostik und Behandlung durch geprüfte Ärzte und Spezialistinnen – sicher, sorgfältig, nach medizinischen Standards.'],
    ['laser', 'Innovative Technologien', 'Modernste Laser- und Gerätetechnologien wie Endolift®, Diodenlaser/SHR und RF Needling.'],
    ['heart', 'Ehrliche Beratung', 'Wir empfehlen nur, was wirklich zu Ihrer Haut passt – und raten offen ab, wenn etwas nicht sinnvoll ist.'],
    ['leaf', 'Natürliche Ergebnisse', 'Hochwertigste Materialien und Markenprodukte für Ergebnisse, die frisch und natürlich wirken.'],
  ];
  const body = `
<section class="hero">
  <div class="hero__blob" aria-hidden="true"></div>
  <div class="container hero__grid">
    <div class="hero__copy">
      <p class="eyebrow hero__eyebrow"><span class="dot"></span> Ärztlich geführtes Studio · Bahnhofstrasse 94</p>
      <h1 class="display display--xl hero__title"><span class="line"><span>Ästhetik &amp;</span></span> <span class="line"><span>Lasermedizin</span></span> <span class="line"><span><em>in Zürich</em></span></span></h1>
      <p class="hero__lead">Fadenlifting, Hyaluron, Laser-Haarentfernung, Endolift® und mehr – präzise durchgeführt von geprüften Ärzten und Spezialistinnen. Für Ergebnisse, die natürlich wirken.</p>
      <div class="hero__ctas">${bookBtn('Termin online buchen', 'btn btn--primary btn--lg')}<a class="btn btn--ghost btn--lg" href="/behandlungen"><span>Behandlungen entdecken</span></a></div>
      <ul class="hero__trust">
        <li>${icon('check')} Ärztlich geführt</li>
        <li>${icon('check')} Transparente Preise</li>
        <li>${icon('check')} Online buchen 24/7</li>
      </ul>
    </div>
    <div class="hero__visual">
      <div class="arch">${pic('aesthetik-lasermedizin-zuerich', 'Natürliches Facelifting – Ästhetik & Lasermedizin bei Perfect Shape Zürich', { sizes: '(max-width: 900px) 90vw, 44vw', eager: true })}</div>
      <div class="float-card float-card--a"><span class="float-card__icon">${icon('star')}</span><div><b>Ehrlich beraten</b><span>Wir empfehlen nur, was wirklich zu Ihnen passt.</span></div></div>
      <div class="float-card float-card--b"><b>ab CHF 40</b><span>Laser-Haarentfernung</span></div>
      <svg class="hero__ring" viewBox="0 0 200 200" aria-hidden="true"><defs><path id="ringPath" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0"/></defs><text><textPath href="#ringPath" textLength="486" lengthAdjust="spacing">PERFECT SHAPE · ZÜRICH · ÄSTHETIK · LASER ·</textPath></text></svg>
    </div>
  </div>
</section>

<div class="marquee" aria-hidden="true"><div class="marquee__track">${[...TREATMENTS, ...TREATMENTS].map((t) => `<span data-t="${esc(t.navName)}"></span><i>✦</i>`).join('')}</div></div>

<section class="section intro" aria-labelledby="intro-title">
  <div class="container">
    <div class="split-head">
      <div>${heading('Das Beauty Studio', 'auf höchstem Niveau', { eyebrow: 'Perfect Shape Zürich' }).replace('<h2 class="display"', '<h2 class="display" id="intro-title"')}</div>
      <div class="split-head__text" data-reveal>
        <p class="lead">Wohlfühlen in Ihrer Haut – das ist das Bestreben bei Perfect Shape. In unserem Studio für Ästhetik und Lasermedizin mitten in Zürich werden Diagnostik und Behandlung von geprüften Ärzten und Spezialistinnen durchgeführt, unter Einsatz innovativster Lasertechnologien und qualitativ hochwertigster Materialien.</p>
        <a class="link-arrow" href="/ueber-uns">Mehr über uns ${icon('right')}</a>
      </div>
    </div>
    <div class="values">
      ${values.map(([ic, t, d], i) => `<article class="value value--${i + 1}" data-reveal><span class="value__icon">${icon(ic)}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}
    </div>
  </div>
</section>

<section class="section section--cream" id="behandlungen" aria-labelledby="treat-title">
  <div class="container">
    <div class="section-head section-head--center">
      ${heading('Unsere', 'Behandlungen', { eyebrow: 'Ästhetik · Laser · Haut · Körper' }).replace('<h2 class="display"', '<h2 class="display" id="treat-title"')}
      <p class="section-head__text" data-reveal>Von natürlichem Fadenlifting bis zur dauerhaften Laser-Haarentfernung: Entdecken Sie Behandlungen, die individuell auf Sie abgestimmt werden.</p>
    </div>
    <div class="filters" role="group" aria-label="Behandlungen filtern" data-reveal>
      <button type="button" class="chip is-active" data-filter="all" aria-pressed="true">Alle</button>
      ${CATEGORIES.map((c) => `<button type="button" class="chip" data-filter="${c.id}" aria-pressed="false">${esc(c.name)}</button>`).join('')}
    </div>
    <div class="tgrid tgrid--rail" data-filter-grid>
      ${TREATMENTS.map((t) => treatmentCard(t)).join('')}
    </div>
    <p class="rail-hint" aria-hidden="true">Wischen für mehr ${icon('right')}</p>
  </div>
</section>

<section class="section statement" aria-labelledby="statement-title">
  <div class="container statement__grid">
    <div class="statement__media" data-reveal>
      <div class="oval">${pic('agnieszka-jaggy-behandlung', 'Apparative Kosmetik bei Perfect Shape Zürich – Behandlung mit modernster Technologie', { sizes: '(max-width: 900px) 80vw, 36vw' })}</div>
      <div class="statement__small">${pic('studio-perfect-shape-zuerich-zertifikate', 'Zertifikate und Diplome im Studio von Perfect Shape Zürich', { sizes: '(max-width: 900px) 40vw, 18vw' })}</div>
    </div>
    <div class="statement__copy">
      <p class="eyebrow" data-reveal>Ihre Haut. Ihr Weg.</p>
      <h2 class="statement__title" id="statement-title" data-reveal><span>Entdecken Sie die</span> <em>natürliche Schönheit,</em> <span>die bereits in Ihnen steckt.</span></h2>
      <p data-reveal>Schönheit bedeutet für uns nicht Perfektion, sondern Balance. Deshalb beginnt jede Behandlung mit einer ehrlichen Analyse: Was braucht Ihre Haut wirklich? Welche Methode bringt das beste Ergebnis – mit möglichst wenig Aufwand für Sie?</p>
      <p data-reveal>Ob sanftes Lifting, frischer Glow oder dauerhaft glatte Haut – wir begleiten Sie mit Fachwissen, modernster Technik und viel Herzlichkeit.</p>
      <div class="stats" data-reveal>
        <div><b data-count="13">13</b><span>Behandlungs&shy;methoden</span></div>
        <div><b data-count="5">5</b><span>Fachbereiche unter einem Dach</span></div>
        <div><b>24/7</b><span>Online-Terminbuchung</span></div>
      </div>
    </div>
  </div>
</section>

<section class="section section--soft" aria-labelledby="pricing-title">
  <div class="container">
    <div class="section-head split-head">
      <div>${heading('Beliebte', 'Behandlungen', { eyebrow: 'Transparente Preise' }).replace('<h2 class="display"', '<h2 class="display" id="pricing-title"')}</div>
      <div class="split-head__text" data-reveal><p>Keine versteckten Kosten: Unsere Richtpreise sehen Sie vorab. Den finalen Preis legen wir nach Ihrer persönlichen Beratung fest.</p><a class="link-arrow" href="/preise">Alle Preise ansehen ${icon('right')}</a></div>
    </div>
    <div class="pcards">
      ${featured.map((f, i) => `<article class="pcard pcard--${f.tone}" data-reveal style="--d:${i * 120}ms">
        <p class="pcard__label">${esc(f.label)}</p>
        <h3 class="pcard__name">${esc(f.name)}</h3>
        <p class="pcard__price">${esc(f.price)}</p>
        <p class="pcard__text">${esc(f.text)}</p>
        <ul>${f.list.map((l) => `<li>${icon('check')} ${esc(l)}</li>`).join('')}</ul>
        <div class="pcard__foot"><a href="/${f.t.slug}" class="link-arrow">Details ${icon('right')}</a><a class="circle-arrow circle-arrow--lg" href="${esc(SITE.booking)}" target="_blank" rel="noopener" data-book aria-label="${esc(f.name)} buchen">${icon('arrow')}</a></div>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="section team" aria-labelledby="team-title">
  <div class="container">
    <div class="section-head section-head--center">
      ${heading('Unsere', 'Expertinnen', { eyebrow: 'In besten Händen' }).replace('<h2 class="display"', '<h2 class="display" id="team-title"')}
    </div>
    <div class="team__grid">
      ${TEAM.map((p, i) => `<article class="member" data-reveal style="--d:${i * 150}ms">
        <div class="member__img">${pic(p.image, p.alt, { sizes: '(max-width: 700px) 80vw, 34vw' })}</div>
        <h3 class="member__name">${esc(p.name)}</h3>
        <p class="member__role">${esc(p.role)}</p>
        <ul class="member__facts">${p.facts.map((f) => `<li>${esc(f)}</li>`).join('')}</ul>
      </article>`).join('')}
    </div>
    <p class="center" data-reveal><a class="link-arrow" href="/ueber-uns">Zum ganzen Team ${icon('right')}</a></p>
  </div>
</section>

<section class="section section--cream reviews" aria-labelledby="reviews-title">
  <div class="container">
    <div class="section-head section-head--center">
      <p class="eyebrow" data-reveal>Bewertungen</p>
      <h2 class="display" id="reviews-title" data-reveal>Echte <em>Erfahrungen</em></h2>
    </div>
    <div class="slider" data-slider data-reveal>
      <div class="slider__viewport">
        ${REVIEWS.map((r, i) => `<figure class="review${i === 0 ? ' is-active' : ''}" aria-hidden="${i === 0 ? 'false' : 'true'}">
          <div class="review__stars" role="img" aria-label="5 von 5 Sternen">${icon('star')}${icon('star')}${icon('star')}${icon('star')}${icon('star')}</div>
          <blockquote><p>${esc(r.text)}</p></blockquote>
          <figcaption><b>${esc(r.name)}</b><span>${esc(r.tag)}</span></figcaption>
        </figure>`).join('')}
      </div>
      <div class="slider__nav">
        <button type="button" class="circle-arrow" data-prev aria-label="Vorherige Bewertung">${icon('left')}</button>
        <span class="slider__count" aria-live="polite"><b data-current>1</b> / ${REVIEWS.length}</span>
        <button type="button" class="circle-arrow" data-next aria-label="Nächste Bewertung">${icon('right')}</button>
      </div>
    </div>
    <p class="center" data-reveal><a class="link-arrow" href="${SITE.googleMaps}" target="_blank" rel="noopener">Alle Bewertungen auf Google ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section studio" aria-labelledby="studio-title">
  <div class="container">
    <div class="section-head split-head">
      <div>${heading('Unser', 'Studio', { eyebrow: 'Bahnhofstrasse 94 · 2. Etage' }).replace('<h2 class="display"', '<h2 class="display" id="studio-title"')}</div>
      <div class="split-head__text" data-reveal><p>Hell, ruhig und diskret – nur wenige Gehminuten vom Hauptbahnhof Zürich entfernt. Hier nehmen wir uns Zeit für Sie.</p><a class="link-arrow" href="${SITE.route}" target="_blank" rel="noopener">Route planen ${icon('right')}</a></div>
    </div>
    <div class="gallery">
      <figure class="gallery__a" data-reveal>${pic('studio-perfect-shape-zuerich-empfang', 'Empfang und Wartebereich von Perfect Shape an der Bahnhofstrasse Zürich', { sizes: '(max-width: 800px) 92vw, 56vw' })}</figure>
      <figure class="gallery__b" data-reveal>${pic('studio-perfect-shape-zuerich-behandlungsraum', 'Behandlungsraum für Ästhetik und Lasermedizin bei Perfect Shape Zürich', { sizes: '(max-width: 800px) 92vw, 36vw' })}</figure>
      <figure class="gallery__c" data-reveal>${pic('apparative-kosmetik-zuerich', 'Apparative Kosmetik – Gesichtsbehandlung bei Perfect Shape Zürich', { sizes: '(max-width: 800px) 92vw, 36vw' })}</figure>
    </div>
  </div>
</section>

<section class="section section--soft steps-sec" aria-labelledby="steps-title">
  <div class="container">
    <div class="section-head section-head--center">
      ${heading('In 3 Schritten', 'zu Ihrem Termin', { eyebrow: 'So einfach geht’s' }).replace('<h2 class="display"', '<h2 class="display" id="steps-title"')}
    </div>
    <ol class="steps steps--3">
      <li data-reveal><span class="steps__n">01</span><h3>Online buchen</h3><p>Wunschbehandlung und Termin wählen – rund um die Uhr, in weniger als einer Minute.</p></li>
      <li data-reveal style="--d:120ms"><span class="steps__n">02</span><h3>Persönliche Beratung</h3><p>Wir analysieren Ihre Haut und Ziele und besprechen ehrlich, was wirklich sinnvoll ist.</p></li>
      <li data-reveal style="--d:240ms"><span class="steps__n">03</span><h3>Behandlung &amp; Nachsorge</h3><p>Sorgfältig durchgeführt, mit klaren Empfehlungen – und wir bleiben für Fragen erreichbar.</p></li>
    </ol>
    <p class="center" data-reveal>${bookBtn('Jetzt Termin wählen', 'btn btn--primary btn--lg')}</p>
  </div>
</section>

<section class="section faq-sec" aria-labelledby="faq-title">
  <div class="container faq-sec__grid">
    <div class="faq-sec__head">
      ${heading('Häufige', 'Fragen', { eyebrow: 'FAQ' }).replace('<h2 class="display"', '<h2 class="display" id="faq-title"')}
      <p data-reveal>Ihre Frage ist nicht dabei? Schreiben Sie uns oder rufen Sie an – wir helfen gerne weiter.</p>
      <p data-reveal><a class="link-arrow" href="/kontakt">Kontakt aufnehmen ${icon('right')}</a></p>
    </div>
    ${faqList(HOME_FAQ)}
  </div>
</section>

${contactBlock()}
`;
  add('index.html', '/', layout({
    path: '/',
    title: 'Ästhetik & Lasermedizin Zürich | Perfect Shape',
    description: 'Fadenlifting, Hyaluron, Laser-Haarentfernung & Endolift® in Zürich – ärztlich geführt an der Bahnhofstrasse 94. Transparente Preise. Jetzt Termin buchen.',
    body,
    schemas: [faqSchema(HOME_FAQ)],
    preload: preloadImg('aesthetik-lasermedizin-zuerich', '(max-width: 900px) 90vw, 44vw'),
  }), { priority: '1.0', changefreq: 'weekly' });
}

function contactBlock() {
  return `<section class="section section--cream visit" aria-labelledby="visit-title">
  <div class="container visit__grid">
    <div class="visit__info">
      ${heading('Besuchen Sie', 'uns', { eyebrow: 'Kontakt & Anfahrt' }).replace('<h2 class="display"', '<h2 class="display" id="visit-title"')}
      <ul class="clist" data-reveal>
        <li>${icon('pin')}<div><b>Adresse</b><a href="${SITE.route}" target="_blank" rel="noopener">${esc(SITE.street)}, ${esc(SITE.floor)}<br>${SITE.zip} ${esc(SITE.city)}</a></div></li>
        <li>${icon('phone')}<div><b>Telefon</b><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></div></li>
        <li>${icon('whatsapp')}<div><b>WhatsApp</b><a href="${SITE.whatsapp}" target="_blank" rel="noopener">Nachricht schreiben</a></div></li>
        <li>${icon('mail')}<div><b>E-Mail</b><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></div></li>
        <li>${icon('clock')}<div><b>Termine</b><span>Nach Vereinbarung – online buchbar rund um die Uhr</span></div></li>
      </ul>
      <div class="visit__ctas" data-reveal>${bookBtn('Termin buchen', 'btn btn--primary')}<a class="btn btn--ghost" href="${SITE.route}" target="_blank" rel="noopener">${icon('route')}<span>Route planen</span></a></div>
    </div>
    <div class="map" data-map="${esc(SITE.mapEmbed)}" data-reveal>
      <div class="map__ph">
        <span class="map__pin">${icon('pin')}</span>
        <p><b>Perfect Shape Zürich</b><br>${esc(SITE.street)}, ${SITE.zip} ${esc(SITE.city)}</p>
        <button type="button" class="btn btn--light btn--sm" data-map-load>Karte laden</button>
        <small>Beim Laden der Karte werden Daten an Google übertragen. <a href="/datenschutz">Datenschutz</a></small>
      </div>
    </div>
  </div>
</section>`;
}

/* Behandlungsseiten */
for (const t of TREATMENTS) {
  const cat = catById[t.category];
  const path = '/' + t.slug;
  const from = minPrice(t);
  const related = t.related.map((s) => bySlug[s]);
  const body = `
<section class="phero">
  <div class="hero__blob hero__blob--sm" aria-hidden="true"></div>
  <div class="container">
    ${crumbs([['Behandlungen', '/behandlungen'], [t.navName, path]])}
    <div class="phero__grid">
      <div class="phero__copy">
        <p class="eyebrow">${esc(cat.name)} in Zürich</p>
        <h1 class="display display--lg"><span class="line"><span>${esc(t.h1)}</span></span> <span class="line"><span><em>${esc(t.h1Accent)}</em></span></span></h1>
        <p class="phero__lead">${esc(t.lead)}</p>
        <ul class="chips">${t.chips.map((c) => `<li>${icon('clock')} ${esc(c)}</li>`).join('')}</ul>
        <div class="phero__ctas">${bookBtn('Termin buchen', 'btn btn--primary btn--lg')}<a class="btn btn--ghost btn--lg" href="#preise"><span>Preise ab ${chf(from)}</span></a></div>
      </div>
      <div class="phero__visual">
        <div class="phero__img">${pic(t.image, t.imageAlt, { sizes: '(max-width: 900px) 92vw, 46vw', eager: true })}</div>
        <div class="float-card float-card--b"><b>ab ${chf(from)}</b><span>${esc(t.navName)}</span></div>
      </div>
    </div>
  </div>
</section>

<nav class="toc" aria-label="Auf dieser Seite">
  <div class="container toc__in">
    <a href="#was">Methode</a><a href="#indikationen">${esc(t.indications.title)}</a><a href="#ablauf">Ablauf</a><a href="#ergebnisse">Ergebnisse</a><a href="#preise">Preise</a><a href="#faq">FAQ</a>
    ${bookBtn('Buchen', 'btn btn--primary btn--xs toc__cta')}
  </div>
</nav>

<section class="section" id="was" aria-labelledby="was-title">
  <div class="container what">
    <div class="what__intro">
      <p class="eyebrow" data-reveal>${esc(t.keyword)}</p>
      <h2 class="display" id="was-title" data-reveal>${esc(t.what.title.split(' ').slice(0, -1).join(' '))} <em>${esc(t.what.title.split(' ').slice(-1)[0])}</em></h2>
    </div>
    <div class="what__text">
      <p class="lead" data-reveal>${esc(t.intro)}</p>
      <p data-reveal>${esc(t.what.text)}</p>
      <ul class="checks" data-reveal>${t.what.bullets.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="section section--cream" id="indikationen" aria-label="${esc(t.indications.title)} und ${esc(t.contra.title)}">
  <div class="container duo">
    <article class="duo__card duo__card--light" data-reveal>
      <span class="duo__icon">${icon('check')}</span>
      <h2 class="h3">${esc(t.indications.title)}</h2>
      <ul class="checks">${t.indications.items.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
    </article>
    <article class="duo__card ${t.contra.positive ? 'duo__card--sand' : 'duo__card--blush'}" data-reveal style="--d:120ms">
      <span class="duo__icon">${icon(t.contra.positive ? 'sparkle' : 'shield')}</span>
      <h2 class="h3">${esc(t.contra.title)}</h2>
      <ul class="checks ${t.contra.positive ? '' : 'checks--muted'}">${t.contra.items.map((b) => `<li>${icon(t.contra.positive ? 'check' : 'x')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <p class="note">${esc(t.contra.note)}</p>
    </article>
  </div>
</section>

<section class="section" id="ablauf" aria-labelledby="ablauf-title">
  <div class="container">
    <div class="section-head section-head--center">
      <p class="eyebrow" data-reveal>Ablauf</p>
      <h2 class="display" id="ablauf-title" data-reveal>Schritt <em>für Schritt</em></h2>
    </div>
    <ol class="steps steps--${t.steps.length}">
      ${t.steps.map(([h, d], i) => `<li data-reveal style="--d:${i * 100}ms"><span class="steps__n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(d)}</p></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section section--dark" id="ergebnisse" aria-labelledby="erg-title">
  <div class="container results">
    <div>
      <p class="eyebrow eyebrow--light" data-reveal>Was Sie erwarten können</p>
      <h2 class="display display--light" id="erg-title" data-reveal>${esc(t.results.title)}</h2>
      <ul class="checks checks--light" data-reveal>${t.results.items.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <p class="note note--light" data-reveal>${esc(t.results.note)}</p>
    </div>
    <div class="results__stats">
      ${t.results.stats.map(([v, l], i) => `<div class="rstat" data-reveal style="--d:${i * 120}ms"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}
    </div>
  </div>
</section>

<section class="section" id="preise" aria-labelledby="preise-title">
  <div class="container prices">
    <div class="prices__head">
      <p class="eyebrow" data-reveal>Preise ${esc(t.navName)}</p>
      <h2 class="display" id="preise-title" data-reveal>Transparente <em>Preise</em></h2>
      <p data-reveal>Richtwerte pro Behandlung. Die finalen Kosten legen wir nach Ihrer individuellen Beratung fest.</p>
      <div class="prices__cta" data-reveal>${bookBtn('Jetzt Termin sichern', 'btn btn--primary')}<a class="link-arrow" href="/preise">Alle Preise ${icon('right')}</a></div>
    </div>
    <div>
      <ul class="plist">${t.prices.map((p) => priceRow(p, t)).join('')}</ul>
      ${t.priceNote ? `<p class="note" data-reveal>${icon('sparkle')} ${esc(t.priceNote)}</p>` : ''}
    </div>
  </div>
</section>

<section class="section section--soft faq-sec" id="faq" aria-labelledby="faq-title">
  <div class="container faq-sec__grid">
    <div class="faq-sec__head">
      <p class="eyebrow" data-reveal>FAQ ${esc(t.navName)}</p>
      <h2 class="display" id="faq-title" data-reveal>Häufige <em>Fragen</em></h2>
      <p data-reveal>Noch Fragen? Wir beraten Sie gerne persönlich – telefonisch oder direkt im Studio.</p>
      <p data-reveal><a class="link-arrow" href="${SITE.phoneHref}">${esc(SITE.phone)} ${icon('right')}</a></p>
    </div>
    ${faqList(t.faq)}
  </div>
</section>

<section class="section" aria-labelledby="rel-title">
  <div class="container">
    <div class="section-head split-head">
      <div><p class="eyebrow" data-reveal>Passt gut dazu</p><h2 class="display" id="rel-title" data-reveal>Weitere <em>Behandlungen</em></h2></div>
      <div class="split-head__text" data-reveal><a class="link-arrow" href="/behandlungen">Alle Behandlungen ${icon('right')}</a></div>
    </div>
    <div class="tgrid tgrid--3">${related.map((r) => treatmentCard(r)).join('')}</div>
  </div>
</section>
`;
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': abs(path) + '#service',
    name: t.navName + ' in Zürich',
    serviceType: t.navName,
    category: cat.name,
    description: t.description,
    url: abs(path),
    image: SITE.url + `/assets/img/${t.image}.jpg`,
    provider: { '@id': BUSINESS_ID },
    areaServed: { '@type': 'City', name: 'Zürich' },
    offers: t.prices.filter((p) => p.price).map((p) => ({ '@type': 'Offer', name: p.name + (p.detail ? ` (${p.detail})` : ''), price: p.price, priceCurrency: 'CHF', url: abs(path) + '#preise', availability: 'https://schema.org/InStock', ...(p.from ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: p.price, priceCurrency: 'CHF' } } : {}) })),
  };
  add(t.slug + '.html', path, layout({
    path,
    title: t.title,
    description: t.description,
    active: 'behandlungen',
    body,
    schemas: [serviceSchema, faqSchema(t.faq), breadcrumbSchema([['Behandlungen', '/behandlungen'], [t.navName, path]])],
    ogImage: `/assets/img/${t.image}.jpg`,
    preload: preloadImg(t.image, '(max-width: 900px) 92vw, 46vw'),
  }), { priority: '0.9' });
}

/* Behandlungen Übersicht */
{
  const body = `
<section class="phero phero--simple">
  <div class="hero__blob hero__blob--sm" aria-hidden="true"></div>
  <div class="container">
    ${crumbs([['Behandlungen', '/behandlungen']])}
    <h1 class="display display--lg"><span class="line"><span>Behandlungen</span></span> <span class="line"><span><em>in Zürich</em></span></span></h1>
    <p class="phero__lead">Ästhetische Medizin, Laser, apparative Kosmetik, Peelings und Massagen – alle Behandlungen von Perfect Shape an der Bahnhofstrasse 94 im Überblick.</p>
    <div class="filters filters--left" role="navigation" aria-label="Kategorien">${CATEGORIES.map((c) => `<a class="chip" href="#${c.id}">${esc(c.name)}</a>`).join('')}</div>
  </div>
</section>
${CATEGORIES.map((c, i) => `<section class="section ${i % 2 ? 'section--cream' : ''}" id="${c.id}" aria-labelledby="cat-${c.id}">
  <div class="container">
    <div class="section-head split-head">
      <div><p class="eyebrow" data-reveal>${esc(c.short)}</p><h2 class="display" id="cat-${c.id}" data-reveal>${esc(c.name)}</h2></div>
      <div class="split-head__text" data-reveal>${bookBtn('Termin buchen', 'btn btn--ghost btn--sm')}</div>
    </div>
    <div class="tgrid tgrid--3">${TREATMENTS.filter((t) => t.category === c.id).map((t) => treatmentCard(t)).join('')}</div>
  </div>
</section>`).join('')}
`;
  add('behandlungen.html', '/behandlungen', layout({
    path: '/behandlungen',
    title: 'Alle Behandlungen – Ästhetik & Laser Zürich | Perfect Shape',
    description: 'Alle Behandlungen im Überblick: Fadenlifting, Hyaluron, Mesotherapie, PRP, Laser-Haarentfernung, Endolift®, RF Needling, Peelings & Massagen in Zürich.',
    active: 'behandlungen',
    body,
    schemas: [breadcrumbSchema([['Behandlungen', '/behandlungen']]), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: TREATMENTS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: abs('/' + t.slug), name: t.navName })) }],
  }), { priority: '0.9' });
}

/* Preise */
{
  const body = `
<section class="phero phero--simple">
  <div class="hero__blob hero__blob--sm" aria-hidden="true"></div>
  <div class="container">
    ${crumbs([['Preise', '/preise']])}
    <div class="phero__row">
      <div>
        <h1 class="display display--lg"><span class="line"><span>Preise</span></span> <span class="line"><span><em>transparent &amp; fair</em></span></span></h1>
        <p class="phero__lead">Richtwerte pro Behandlung in CHF inkl. MwSt. Die finalen Kosten legen wir nach Ihrer individuellen Beratung fest – ehrlich und ohne versteckte Kosten.</p>
      </div>
      <div class="phero__ctas">${bookBtn('Jetzt Termin sichern', 'btn btn--primary btn--lg')}</div>
    </div>
  </div>
</section>
<nav class="toc toc--prices" aria-label="Preiskategorien">
  <div class="container toc__in">${TREATMENTS.map((t) => `<a href="#${t.slug}">${esc(t.navName)}</a>`).join('')}</div>
</nav>
<section class="section section--tight">
  <div class="container pricepage">
    ${TREATMENTS.map((t) => `<article class="pgroup" id="${t.slug}" aria-labelledby="pg-${t.slug}">
      <div class="pgroup__head" data-reveal>
        <div class="pgroup__img">${pic(t.image, t.imageAlt, { sizes: '120px' })}</div>
        <div><p class="eyebrow">${esc(catById[t.category].name)}</p><h2 class="h2" id="pg-${t.slug}">${esc(t.navName)}</h2><a class="link-arrow" href="/${t.slug}">Zur Behandlung ${icon('right')}</a></div>
      </div>
      <ul class="plist">${t.prices.map((p) => priceRow(p, t)).join('')}</ul>
      ${t.priceNote ? `<p class="note">${icon('sparkle')} ${esc(t.priceNote)}</p>` : ''}
    </article>`).join('')}
    <p class="note">Alle Preise in Schweizer Franken (CHF) inkl. MwSt. Preisänderungen vorbehalten. Zahlung in bar, per Karte oder TWINT. Es gelten unsere <a href="/agb">AGB</a>.</p>
  </div>
</section>
`;
  add('preise.html', '/preise', layout({
    path: '/preise',
    title: 'Preise – Ästhetik & Laser Zürich | Perfect Shape',
    description: 'Transparente Preise in Zürich: Laser-Haarentfernung ab CHF 40, Lippenaufbau ab CHF 160, Fadenlifting ab CHF 240, Endolift® CHF 1800. Jetzt buchen.',
    active: 'preise',
    body,
    schemas: [breadcrumbSchema([['Preise', '/preise']])],
  }), { priority: '0.9' });
}

/* Über uns */
{
  const body = `
<section class="phero">
  <div class="hero__blob hero__blob--sm" aria-hidden="true"></div>
  <div class="container">
    ${crumbs([['Über uns', '/ueber-uns']])}
    <div class="phero__grid">
      <div class="phero__copy">
        <p class="eyebrow">Über Perfect Shape</p>
        <h1 class="display display--lg"><span class="line"><span>Das Beauty Studio</span></span> <span class="line"><span><em>auf höchstem Niveau</em></span></span></h1>
        <p class="phero__lead">Wohlfühlen in Ihrer Haut – das ist das Bestreben bei Perfect Shape. In unserem Studio für Ästhetik und Lasermedizin an der Bahnhofstrasse in Zürich werden Diagnostik und Behandlung von geprüften Ärzten und Spezialistinnen durchgeführt, unter Einsatz innovativster Lasertechnologien und qualitativ hochwertigster Materialien.</p>
        <div class="phero__ctas">${bookBtn('Termin buchen', 'btn btn--primary btn--lg')}<a class="btn btn--ghost btn--lg" href="#team"><span>Team kennenlernen</span></a></div>
      </div>
      <div class="phero__visual"><div class="phero__img phero__img--arch">${pic('studio-perfect-shape-zuerich-empfang', 'Studio von Perfect Shape an der Bahnhofstrasse 94 in Zürich', { sizes: '(max-width: 900px) 92vw, 46vw', eager: true })}</div></div>
    </div>
  </div>
</section>

<section class="section section--cream" id="team" aria-labelledby="team-title">
  <div class="container">
    <div class="section-head section-head--center">
      <p class="eyebrow" data-reveal>Unsere Expertinnen</p>
      <h2 class="display" id="team-title" data-reveal>Das <em>Team</em></h2>
    </div>
    ${TEAM.map((p, i) => `<article class="bio ${i % 2 ? 'bio--rev' : ''}">
      <div class="bio__img" data-reveal>${pic(p.image, p.alt, { sizes: '(max-width: 900px) 80vw, 38vw' })}</div>
      <div class="bio__text">
        <p class="eyebrow" data-reveal>${esc(p.roleShort)}</p>
        <h3 class="display display--md" data-reveal>${esc(p.name)}</h3>
        <p class="member__role" data-reveal>${esc(p.role)}</p>
        ${p.bio.map((b) => `<p data-reveal>${esc(b)}</p>`).join('')}
        <ul class="checks" data-reveal>${p.facts.map((f) => `<li>${icon('check')}<span>${esc(f)}</span></li>`).join('')}</ul>
      </div>
    </article>`).join('')}
  </div>
</section>

<section class="section" aria-labelledby="partner-title">
  <div class="container">
    <div class="section-head section-head--center">
      <p class="eyebrow" data-reveal>Qualität, der Sie vertrauen können</p>
      <h2 class="display" id="partner-title" data-reveal>Partner <em>&amp; Marken</em></h2>
      <p class="section-head__text" data-reveal>Wir arbeiten ausschliesslich mit geprüften Premium-Produkten und Technologien renommierter Hersteller.</p>
    </div>
    <ul class="partners" data-reveal>
      ${[['partner-endolift', 'Endolift® Laser'], ['partner-revolax', 'Revolax Hyaluron-Filler'], ['partner-vivacy', 'Vivacy Paris'], ['partner-dives-med', 'Dives Med']].map(([n, a]) => `<li><img src="/assets/img/${n}.webp" alt="${a}" width="${IMG[n].w}" height="${IMG[n].h}" loading="lazy"></li>`).join('')}
    </ul>
  </div>
</section>

<section class="section section--soft studio" aria-labelledby="studio-title">
  <div class="container">
    <div class="section-head split-head">
      <div><p class="eyebrow" data-reveal>Bahnhofstrasse 94 · 2. Etage</p><h2 class="display" id="studio-title" data-reveal>Unser <em>Studio</em></h2></div>
      <div class="split-head__text" data-reveal><p>Hell, ruhig und diskret – mitten in Zürich, nur wenige Gehminuten vom Hauptbahnhof.</p></div>
    </div>
    <div class="gallery">
      <figure class="gallery__a" data-reveal>${pic('studio-perfect-shape-zuerich-behandlungsraum', 'Moderner Behandlungsraum bei Perfect Shape Zürich', { sizes: '(max-width: 800px) 92vw, 56vw' })}</figure>
      <figure class="gallery__b" data-reveal>${pic('studio-perfect-shape-zuerich-zertifikate', 'Zertifikate und Diplome – geprüfte Qualifikation bei Perfect Shape Zürich', { sizes: '(max-width: 800px) 92vw, 36vw' })}</figure>
      <figure class="gallery__c" data-reveal>${pic('agnieszka-jaggy-behandlung', 'Agnieszka Jaggy bei einer apparativen Behandlung im Studio Zürich', { sizes: '(max-width: 800px) 92vw, 36vw' })}</figure>
    </div>
  </div>
</section>
${contactBlock()}
`;
  add('ueber-uns.html', '/ueber-uns', layout({
    path: '/ueber-uns',
    title: 'Über uns – Dr. med. Roya Jeyrani & Team | Perfect Shape',
    description: 'Perfect Shape Zürich: Dr. med. Roya Jeyrani und Agnieszka Jaggy – ärztliche Kompetenz, ehrliche Beratung und modernste Lasertechnologie an der Bahnhofstrasse.',
    active: 'ueber-uns',
    body,
    schemas: [breadcrumbSchema([['Über uns', '/ueber-uns']]), ...TEAM.map((p) => ({ '@context': 'https://schema.org', '@type': 'Person', name: p.name, jobTitle: p.roleShort, description: p.bio[0], image: SITE.url + `/assets/img/${p.image}.jpg`, worksFor: { '@id': BUSINESS_ID } }))],
  }), { priority: '0.8' });
}

/* Kontakt */
{
  const body = `
<section class="phero phero--simple">
  <div class="hero__blob hero__blob--sm" aria-hidden="true"></div>
  <div class="container">
    ${crumbs([['Kontakt', '/kontakt']])}
    <h1 class="display display--lg"><span class="line"><span>Kontakt</span></span> <span class="line"><span><em>&amp; Termin</em></span></span></h1>
    <p class="phero__lead">Schreiben Sie uns eine Nachricht oder buchen Sie direkt online einen Termin. Wir melden uns schnellstmöglich bei Ihnen.</p>
  </div>
</section>
<section class="section section--tight">
  <div class="container contact">
    <div class="contact__cards">
      <a class="ccard ccard--primary" href="${esc(SITE.booking)}" target="_blank" rel="noopener" data-book data-reveal>${icon('calendar')}<b>Online buchen</b><span>Rund um die Uhr – in 60 Sekunden</span><i class="circle-arrow">${icon('arrow')}</i></a>
      <a class="ccard" href="${SITE.phoneHref}" data-reveal>${icon('phone')}<b>Anrufen</b><span>${esc(SITE.phone)}</span></a>
      <a class="ccard" href="${SITE.whatsapp}" target="_blank" rel="noopener" data-reveal>${icon('whatsapp')}<b>WhatsApp</b><span>Schnell &amp; unkompliziert</span></a>
      <a class="ccard" href="mailto:${SITE.email}" data-reveal>${icon('mail')}<b>E-Mail</b><span>${esc(SITE.email)}</span></a>
      <a class="ccard" href="${SITE.route}" target="_blank" rel="noopener" data-reveal>${icon('pin')}<b>Adresse</b><span>${esc(SITE.street)}, ${esc(SITE.floor)}, ${SITE.zip} ${esc(SITE.city)}</span></a>
    </div>
    <div class="contact__form" data-reveal>
      <h2 class="display display--md">Nachricht <em>senden</em></h2>
      <form class="form" id="contactForm" novalidate data-mailto="${SITE.email}">
        <div class="form__row">
          <div class="field"><label for="cfName">Name *</label><input id="cfName" name="name" type="text" autocomplete="name" required placeholder="Vor- und Nachname"></div>
          <div class="field"><label for="cfEmail">E-Mail *</label><input id="cfEmail" name="email" type="email" autocomplete="email" required placeholder="name@beispiel.ch"></div>
        </div>
        <div class="form__row">
          <div class="field"><label for="cfPhone">Telefon</label><input id="cfPhone" name="phone" type="tel" autocomplete="tel" placeholder="+41 …"></div>
          <div class="field"><label for="cfTopic">Behandlung</label><select id="cfTopic" name="topic"><option value="">Bitte wählen (optional)</option>${TREATMENTS.map((t) => `<option>${esc(t.navName)}</option>`).join('')}<option>Allgemeine Frage</option></select></div>
        </div>
        <div class="field"><label for="cfMsg">Nachricht *</label><textarea id="cfMsg" name="message" rows="5" required placeholder="Wie können wir Ihnen helfen?"></textarea></div>
        <label class="check"><input type="checkbox" name="consent" required> <span>Ich stimme der Verarbeitung meiner Daten zur Bearbeitung meiner Anfrage zu (<a href="/datenschutz">Datenschutz</a>). *</span></label>
        <button class="btn btn--primary btn--lg" type="submit"><span>Nachricht senden</span>${icon('arrow')}</button>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>
${contactBlock()}
`;
  add('kontakt.html', '/kontakt', layout({
    path: '/kontakt',
    title: 'Kontakt & Termin – Perfect Shape Zürich',
    description: 'Kontaktieren Sie Perfect Shape Zürich: Bahnhofstrasse 94, 8001 Zürich · Tel. +41 76 608 61 61 · WhatsApp · E-Mail. Termin online buchen – rund um die Uhr.',
    active: 'kontakt',
    body,
    schemas: [breadcrumbSchema([['Kontakt', '/kontakt']]), { '@context': 'https://schema.org', '@type': 'ContactPage', url: abs('/kontakt'), name: 'Kontakt Perfect Shape Zürich', about: { '@id': BUSINESS_ID } }],
  }), { priority: '0.8' });
}

/* Rechtliches */
function legal(file, path, title, h1, accent, description, content) {
  const body = `
<section class="phero phero--simple">
  <div class="container">
    ${crumbs([[h1, path]])}
    <h1 class="display display--lg">${esc(h1)} <em>${esc(accent)}</em></h1>
  </div>
</section>
<section class="section section--tight"><div class="container prose">${content}</div></section>`;
  add(file, path, layout({ path, title, description, body, schemas: [breadcrumbSchema([[h1, path]])] }), { priority: '0.3', changefreq: 'yearly' });
}

legal('agb.html', '/agb', 'AGB – Allgemeine Geschäftsbedingungen | Perfect Shape Zürich', 'Allgemeine', 'Geschäftsbedingungen',
  'Allgemeine Geschäftsbedingungen von Perfect Shape Zürich: Terminvereinbarung, Stornierung, Preise, Zahlung, Haftung und Datenschutz.',
  AGB.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('') + `<p class="note">Stand: ${new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}</p>`);

legal('datenschutz.html', '/datenschutz', 'Datenschutzerklärung | Perfect Shape Zürich', 'Datenschutz', 'erklärung',
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
<p class="note">Stand: ${new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' })}</p>`);

legal('impressum.html', '/impressum', 'Impressum | Perfect Shape Zürich', 'Impres', 'sum',
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
add('404.html', '/404', layout({
  path: '/404',
  title: 'Seite nicht gefunden | Perfect Shape Zürich',
  description: 'Diese Seite existiert leider nicht. Entdecken Sie unsere Behandlungen für Ästhetik & Lasermedizin in Zürich.',
  noindex: true,
  body: `<section class="phero phero--simple nf"><div class="hero__blob" aria-hidden="true"></div><div class="container">
    <p class="nf__code">404</p>
    <h1 class="display display--lg">Seite <em>nicht gefunden</em></h1>
    <p class="phero__lead">Die gesuchte Seite existiert nicht oder wurde verschoben. Vielleicht finden Sie hier, was Sie suchen:</p>
    <div class="phero__ctas"><a class="btn btn--primary btn--lg" href="/"><span>Zur Startseite</span></a><a class="btn btn--ghost btn--lg" href="/behandlungen"><span>Alle Behandlungen</span></a></div>
  </div></section>`,
}), { sitemap: false });

/* ---------- CSS minifizieren ---------- */
const css = readFileSync(join(ROOT, 'assets/css/style.css'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\s+/g, ' ')
  .replace(/\s*([{};,>])\s*/g, '$1')
  .replace(/;}/g, '}')
  .trim();
writeFileSync(join(ROOT, 'assets/css/style.min.css'), css);

/* ---------- Schreiben ---------- */
for (const p of pages) writeFileSync(join(ROOT, p.file), p.html);

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${pages.filter((p) => p.sitemap).map((p) => {
  const t = TREATMENTS.find((x) => '/' + x.slug === p.path);
  return `  <url>
    <loc>${abs(p.path)}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>${t ? `
    <image:image><image:loc>${SITE.url}/assets/img/${t.image}.jpg</image:loc></image:image>` : ''}
  </url>`;
}).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`✓ ${pages.length} Seiten generiert`);
