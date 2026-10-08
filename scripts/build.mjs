// Statischer Site-Generator für perfectshape-zuerich.ch
// Aufruf: node scripts/build.mjs  → schreibt alle HTML-Seiten, sitemap.xml und robots.txt ins Projekt-Root.
import { writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, CATEGORIES, TREATMENTS, TEAM, REVIEWS, HOME_FAQ, AGB, HOME } from './content.mjs';

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
const imgUrl = (name) => `${SITE.url}/assets/img/${name}.jpg`;

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
  return `<picture><source type="image/webp" srcset="${srcset(name)}" sizes="${sizes}"><img src="/assets/img/${name}.jpg" alt="${esc(alt)}" width="${fw}" height="${fh}" ${eager ? 'fetchpriority="high" loading="eager"' : 'loading="lazy"'} decoding="async"></picture>`;
}
function preloadImg(name, sizes = '(orientation: portrait) 160vh, 100vw') {
  const m = IMG[name];
  return `<link rel="preload" as="image" href="/assets/img/${name}-${m.widths[Math.min(2, m.widths.length - 1)]}.webp" imagesrcset="${srcset(name)}" imagesizes="${sizes}" fetchpriority="high">`;
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
  chevron: '<path d="m6 9 6 6 6-6"/>',
  star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" fill="currentColor" stroke="none"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
  whatsapp: '<path d="M3 21l1.7-5A8.5 8.5 0 1 1 8 19.4z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1.2-1.3-1.8-1-1 .8a4 4 0 0 1-2.2-2.2l.8-1-1-1.8z" fill="currentColor" stroke="none"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6" fill="currentColor"/>',
  facebook: '<path d="M15 3h-2.5A4.5 4.5 0 0 0 8 7.5V10H5.5v4H8v7h4v-7h3l.5-4H12V7.8c0-.5.4-.8.8-.8H15z"/>',
};
const icon = (n, cls = '') => `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[n]}</svg>`;

const bookBtn = (label = 'Termin buchen', cls = 'btn btn--dark') =>
  `<a class="${cls}" href="${esc(SITE.booking)}" target="_blank" rel="noopener" data-book><span>${label}</span>${icon('arrow')}</a>`;

// Zweizeiliger Titel im Stil der Vorlage: SANS (Versalien) + Serif kursiv
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
  alternateName: 'Perfect Shape – Ästhetik & Lasermedizin',
  description: 'Studio für Ästhetik und Lasermedizin an der Bahnhofstrasse 94 in Zürich: Fadenlifting, Hyaluron, Laser-Haarentfernung, Endolift®, RF Needling, Peelings und Massagen – durchgeführt von geprüften Ärzten und Spezialistinnen.',
  url: SITE.url + '/',
  logo: SITE.url + '/assets/img/logo-perfect-shape-zuerich.png',
  image: [SITE.url + '/assets/img/og-image.jpg', imgUrl('studio-perfect-shape-zuerich-empfang'), imgUrl('studio-perfect-shape-zuerich-behandlungsraum')],
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
        '@type': 'Offer', priceCurrency: 'CHF', price: minPrice(t), url: abs('/' + t.slug),
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
const logoImgs = () => `<img class="logo__color" src="/assets/img/logo-perfect-shape-zuerich-640.webp" alt="Perfect Shape Zürich" width="${IMG.logo.w}" height="${IMG.logo.h}"><img class="logo__white" src="/assets/img/logo-perfect-shape-zuerich-white-640.webp" alt="" width="${IMG.logo.w}" height="${IMG.logo.h}" aria-hidden="true">`;

function header(active) {
  const a = (k) => (active === k ? ' aria-current="page"' : '');
  return `
<a class="skip" href="#main">Zum Inhalt springen</a>
<header class="hdr" id="top">
  <div class="container hdr__in">
    <a class="logo" href="/" aria-label="Perfect Shape Zürich – Startseite">${logoImgs()}</a>
    <nav class="nav" aria-label="Hauptnavigation">
      <ul class="nav__list">
        <li class="nav__item has-mega"><a href="/behandlungen" class="nav__link"${a('behandlungen')} aria-haspopup="true" aria-expanded="false">Behandlungen ${icon('chevron')}</a>
          <div class="mega"><div class="mega__in">
            ${CATEGORIES.map((c) => `<div class="mega__col"><p class="mega__title">${esc(c.name)}</p><ul>${TREATMENTS.filter((t) => t.category === c.id).map((t) => `<li><a href="/${t.slug}">${esc(t.navName)}<span>ab ${chf(minPrice(t))}</span></a></li>`).join('')}</ul></div>`).join('')}
            <div class="mega__cta"><p class="title">Unsicher? <em>Wir beraten Sie.</em></p><p>Ehrlich und persönlich – wir raten auch ab, wenn etwas nicht zu Ihnen passt.</p>${bookBtn('Beratung buchen', 'btn btn--dark btn--sm')}</div>
          </div></div>
        </li>
        <li class="nav__item"><a href="/preise" class="nav__link"${a('preise')}>Preise</a></li>
        <li class="nav__item"><a href="/ueber-uns" class="nav__link"${a('ueber-uns')}>Über uns</a></li>
        <li class="nav__item"><a href="/kontakt" class="nav__link"${a('kontakt')}>Kontakt</a></li>
      </ul>
    </nav>
    <div class="hdr__actions">
      <a class="hdr__phone" href="${SITE.phoneHref}" aria-label="Anrufen: ${esc(SITE.phone)}">${icon('phone')}<span>${esc(SITE.phone)}</span></a>
      ${bookBtn('Termin buchen', 'btn btn--dark hdr__cta')}
      <button class="burger" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
    </div>
  </div>
</header>
<div class="mnav" id="mnav" hidden data-lenis-prevent>
  <div class="mnav__in">
    <nav aria-label="Mobile Navigation">
      <ul class="mnav__list">
        <li><a href="/">Startseite</a></li>
        <li><details><summary>Behandlungen ${icon('plus')}</summary>
          ${CATEGORIES.map((c) => `<p class="mnav__cat">${esc(c.name)}</p><ul>${TREATMENTS.filter((t) => t.category === c.id).map((t) => `<li><a href="/${t.slug}">${esc(t.navName)}<span>ab ${chf(minPrice(t))}</span></a></li>`).join('')}</ul>`).join('')}
          <p class="mnav__cat"><a href="/behandlungen">Alle Behandlungen ansehen →</a></p>
        </details></li>
        <li><a href="/preise">Preise</a></li>
        <li><a href="/ueber-uns">Über uns</a></li>
        <li><a href="/kontakt">Kontakt</a></li>
      </ul>
    </nav>
    <div class="mnav__foot">
      ${bookBtn('Termin online buchen', 'btn btn--dark btn--lg btn--block')}
      <div class="mnav__row"><a class="btn btn--line" href="${SITE.phoneHref}">${icon('phone')}<span>Anrufen</span></a><a class="btn btn--line" href="${SITE.whatsapp}" target="_blank" rel="noopener">${icon('whatsapp')}<span>WhatsApp</span></a></div>
      <p class="mnav__addr">${esc(SITE.street)}, ${esc(SITE.floor)} · ${SITE.zip} ${esc(SITE.city)}</p>
    </div>
  </div>
</div>`;
}

function ctaBand() {
  return `
<section class="band band--cta" aria-labelledby="cta-title">
  <div class="band__media" data-parallax>${pic(HOME.ctaImage, HOME.ctaAlt)}</div>
  <div class="container band__in">
    <p class="eyebrow eyebrow--light" data-reveal>Bereit für Ihre Behandlung?</p>
    <h2 class="title title--lg title--light" id="cta-title" data-reveal>Ihr Termin <em>wartet auf Sie</em></h2>
    <p data-reveal>Wählen Sie Behandlung und Wunschtermin online – in weniger als einer Minute. Oder rufen Sie uns an, wir beraten Sie gerne.</p>
    <div class="hero__ctas" data-reveal>${bookBtn('Jetzt Termin buchen', 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="${SITE.phoneHref}">${icon('phone')}<span>${esc(SITE.phone)}</span></a></div>
    <p class="band__small" data-reveal><span>Online buchbar rund um die Uhr</span><span>Kostenlose Umbuchung bis 24 h vorher</span><span>Bahnhofstrasse 94, Zürich</span></p>
  </div>
</section>`;
}

function footer({ cta = true } = {}) {
  const col = (catIds) => TREATMENTS.filter((t) => catIds.includes(t.category)).map((t) => `<li><a href="/${t.slug}">${esc(t.navName)}</a></li>`).join('');
  return `${cta ? ctaBand() : ''}
<footer class="ftr">
  <div class="container">
    <div class="ftr__top">
      <div class="ftr__brand">
        <a class="logo" href="/" aria-label="Perfect Shape Zürich – Startseite"><img src="/assets/img/logo-perfect-shape-zuerich-white-640.webp" alt="Perfect Shape Zürich" width="${IMG.logo.w}" height="${IMG.logo.h}" loading="lazy"></a>
        <p>Studio für Ästhetik &amp; Lasermedizin an der Bahnhofstrasse in Zürich. Behandlungen von geprüften Ärzten und Spezialistinnen.</p>
        <div class="ftr__social"><a href="${esc(SITE.instagram)}" target="_blank" rel="noopener" aria-label="Instagram">${icon('instagram')}</a><a href="${esc(SITE.facebook)}" target="_blank" rel="noopener" aria-label="Facebook">${icon('facebook')}</a><a href="${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a></div>
      </div>
      <div><p class="ftr__title">Ästhetische Medizin</p><ul>${col(['aesthetik'])}</ul></div>
      <div><p class="ftr__title">Laser, Haut &amp; Körper</p><ul>${col(['laser', 'apparativ', 'massage', 'peeling'])}</ul></div>
      <div>
        <p class="ftr__title">Kontakt</p>
        <address>
          <a href="${SITE.route}" target="_blank" rel="noopener">${esc(SITE.street)}, ${esc(SITE.floor)}<br>${SITE.zip} ${esc(SITE.city)}</a>
          <a href="${SITE.phoneHref}">${esc(SITE.phone)}</a>
          <a href="mailto:${SITE.email}">${esc(SITE.email)}</a>
        </address>
        <p class="ftr__title" style="margin-top:28px">Studio</p>
        <ul class="ftr__inline"><li><a href="/preise">Preise</a></li><li><a href="/ueber-uns">Über uns</a></li><li><a href="/kontakt">Kontakt</a></li><li><a href="/behandlungen">Behandlungen</a></li></ul>
      </div>
    </div>
  </div>
  <p class="ftr__word" aria-hidden="true">Perfect <em>Shape</em></p>
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
<div class="modal" id="booking" role="dialog" aria-modal="true" aria-labelledby="booking-title" hidden data-lenis-prevent>
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

function layout({ path, title: pageTitle, description, active = '', body, schemas = [], ogImage = '/assets/img/og-image.jpg', preload = '', noindex = false, hasHero = false, cta = true }) {
  const canonical = abs(path);
  const ld = [websiteSchema(), businessSchema(), ...schemas].map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join('\n');
  return `<!doctype html>
<html lang="de-CH">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(pageTitle)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="de-CH" href="${canonical}">
<link rel="alternate" hreflang="x-default" href="${canonical}">
<meta name="theme-color" content="#faf8f5">
<meta name="format-detection" content="telephone=no">
<meta name="geo.region" content="CH-ZH">
<meta name="geo.placename" content="Zürich">
<meta property="og:type" content="website">
<meta property="og:locale" content="de_CH">
<meta property="og:site_name" content="${esc(SITE.name)}">
<meta property="og:title" content="${esc(pageTitle)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${SITE.url}${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(pageTitle)}">
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
<script src="/assets/js/lenis.min.js?v=${VERSION}" defer></script>
<script src="/assets/js/main.js?v=${VERSION}" defer></script>
${ld}
</head>
<body${hasHero ? ' class="has-hero"' : ''}>
${header(active)}
<main id="main">
${body}
</main>
${footer({ cta })}
</body>
</html>
`;
}

const crumbs = (items) => `<nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="/">Startseite</a></li>${items.map(([n, p], i) => (i === items.length - 1 ? `<li aria-current="page">${esc(n)}</li>` : `<li><a href="${p}">${esc(n)}</a></li>`)).join('')}</ol></nav>`;

const faqList = (faq) => `<div class="faq" data-reveal>${faq.map(([q, a]) => `<details class="faq__item"><summary><span>${esc(q)}</span><i aria-hidden="true"></i></summary><div class="faq__a"><p>${esc(a)}</p></div></details>`).join('')}</div>`;

// Minimalistische Behandlungsliste mit Bildvorschau (wie „Service“-Liste der Vorlage)
function treatmentList(list, { preview = true, groups = true, headingTag = 'h3' } = {}) {
  const ordered = groups ? CATEGORIES.flatMap((c) => list.filter((t) => t.category === c.id)) : list;
  const row = (t) => {
    const idx = ordered.indexOf(t);
    return `<a class="tl__row${idx === 0 ? ' is-active' : ''}" href="/${t.slug}" data-tl="${idx}">
      <div><${headingTag} class="tl__name">${esc(t.navName)}</${headingTag}><p class="tl__desc">${esc(t.card)}</p></div>
      <span class="tl__price">ab ${chf(minPrice(t))}</span>
      <span class="arrow-circle">${icon('arrow')}</span>
    </a>`;
  };
  const rows = groups
    ? CATEGORIES.map((c) => {
        const items = list.filter((t) => t.category === c.id);
        if (!items.length) return '';
        return `<div class="tl__group" data-reveal><p class="tl__cat"><span>${esc(c.name)}</span><span>${String(items.length).padStart(2, '0')}</span></p>${items.map(row).join('')}</div>`;
      }).join('')
    : `<div class="tl__group" data-reveal>${list.map(row).join('')}</div>`;
  return `<div class="tl"${preview ? ' data-tl-list' : ''}>
    <div>${rows}</div>
    ${preview ? `<div class="tl__preview" aria-hidden="true">${ordered.map((t, k) => `<figure class="${k === 0 ? 'is-active' : ''}" data-tl-img="${k}">${pic(t.image, '', { sizes: '(max-width: 1024px) 1px, 34vw' })}<figcaption>${esc(t.navName)}</figcaption></figure>`).join('')}</div>` : ''}
  </div>`;
}

const priceRow = (p) => `<li class="prow">
  <div><p class="prow__name">${esc(p.name)}${p.detail ? ` <span>· ${esc(p.detail)}</span>` : ''}${p.featured ? '<b class="badge">Beliebt</b>' : ''}</p><p class="prow__desc">${esc(p.desc)}</p>${p.extra ? `<p class="prow__extra">${esc(p.extra)}</p>` : ''}</div>
  <div class="prow__side"><p class="prow__price">${p.priceText && p.price ? esc(p.priceText).replace(' · ', '<br>') : p.price ? `${p.from ? '<small>ab</small> ' : ''}${chf(p.price)}` : esc(p.priceText)}</p>${bookBtn('Buchen', 'btn btn--line btn--xs')}</div>
</li>`;

function heroMedia(name, alt, pos = '50% 50%', posM = '') {
  return `<div class="hero__media" style="--pos:${pos};${posM ? `--pos-m:${posM}` : ''}"><div class="hero__parallax" data-hero-parallax>${pic(name, alt, { sizes: '(orientation: portrait) 160vh, 100vw', eager: true })}</div></div>`;
}

function mapBlock() {
  return `<section class="section section--tight" aria-label="Karte"><div class="container"><div class="map" data-map="${esc(SITE.mapEmbed)}" data-reveal>
      <div class="map__ph">
        <span class="map__pin">${icon('pin')}</span>
        <p><b>Perfect Shape Zürich</b><br>${esc(SITE.street)}, ${SITE.zip} ${esc(SITE.city)}</p>
        <button type="button" class="btn btn--dark btn--sm" data-map-load>Karte laden</button>
        <small>Beim Laden der Karte werden Daten an Google übertragen. <a href="/datenschutz">Datenschutz</a></small>
      </div>
    </div></div></section>`;
}

function visitBlock() {
  return `<section class="section" aria-labelledby="visit-title">
  <div class="container visit">
    <div>
      <p class="eyebrow" data-reveal>Kontakt &amp; Anfahrt</p>
      ${title('Besuchen Sie', 'uns in Zürich', { id: 'visit-title' })}
      <ul class="clist" data-reveal>
        <li><b>Adresse</b><a href="${SITE.route}" target="_blank" rel="noopener">${esc(SITE.street)}, ${esc(SITE.floor)}, ${SITE.zip} ${esc(SITE.city)}</a></li>
        <li><b>Telefon</b><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></li>
        <li><b>WhatsApp</b><a href="${SITE.whatsapp}" target="_blank" rel="noopener">Nachricht schreiben</a></li>
        <li><b>E-Mail</b><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></li>
        <li><b>Termine</b><span>Nach Vereinbarung – online rund um die Uhr</span></li>
      </ul>
      <div class="visit__ctas" data-reveal>${bookBtn('Termin buchen')}<a class="btn btn--line" href="${SITE.route}" target="_blank" rel="noopener"><span>Route planen</span>${icon('arrow')}</a></div>
    </div>
    <div class="map" data-map="${esc(SITE.mapEmbed)}" data-reveal>
      <div class="map__ph">
        <span class="map__pin">${icon('pin')}</span>
        <p><b>Perfect Shape Zürich</b><br>${esc(SITE.street)}, ${SITE.zip} ${esc(SITE.city)}</p>
        <button type="button" class="btn btn--dark btn--sm" data-map-load>Karte laden</button>
        <small>Beim Laden der Karte werden Daten an Google übertragen. <a href="/datenschutz">Datenschutz</a></small>
      </div>
    </div>
  </div>
</section>`;
}

/* ---------- Seiten ---------- */
const pages = [];
const add = (file, path, html, { priority = '0.7', changefreq = 'monthly', sitemap = true } = {}) => pages.push({ file, path, html, priority, changefreq, sitemap });

/* Startseite */
{
  const featured = [
    { t: bySlug['fadenlifting-zuerich'], label: 'Bestseller', price: '1’700', from: false, name: 'Perfectshape V-Fadenlifting', text: 'Ganzes Gesicht inkl. Jawline – natürliches Lifting ohne Operation, Ergebnis bis zu 18 Monate.', list: ['6 PDO-Fäden pro Seite', 'Definierte Jawline', 'Kollagenaufbau'] },
    { t: bySlug['hyaluron-zuerich'], label: 'Am häufigsten gebucht', price: '160', from: true, name: 'Lippenaufbau mit Hyaluron', text: 'Präzises Modellieren für mehr Volumen und natürliche Konturen – ohne Overfilling.', list: ['0.5 ml CHF 160', '1.0 ml CHF 270', 'Sofort sichtbar'] },
    { t: bySlug['laser-haarentfernung-zuerich'], label: 'Dauerhaft glatt', price: '40', from: true, name: 'Laser-Haarentfernung', text: 'Diodenlaser/SHR für alle Zonen – von der Oberlippe bis Full Body.', list: ['Achseln CHF 80', 'Ganze Beine CHF 200', 'Full Body CHF 400'] },
  ];
  const body = `
<section class="hero" aria-labelledby="hero-title">
  ${heroMedia(HOME.heroImage, HOME.heroAlt, HOME.heroPos, HOME.heroPosMobile)}
  <div class="container hero__content">
    <p class="eyebrow eyebrow--light fade-up">Ärztlich geführtes Studio · Bahnhofstrasse 94, Zürich</p>
    <div class="hero__grid">
      <h1 class="title title--xl title--light hero__title" id="hero-title"><span class="ln"><span>Ästhetik &amp;</span></span><span class="ln"><span>Lasermedizin</span></span><span class="ln"><span><em>in Zürich</em></span></span></h1>
      <div class="hero__side">
        <p class="fade-up d1">Fadenlifting, Hyaluron, Laser-Haarentfernung &amp; Endolift® – präzise durchgeführt von geprüften Ärzten und Spezialistinnen. Für Ergebnisse, die natürlich wirken.</p>
        <div class="hero__ctas fade-up d2">${bookBtn('Termin buchen', 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="#behandlungen"><span>Behandlungen</span></a></div>
      </div>
    </div>
    <div class="hero__bar fade-up d3">
      <ul class="hero__trust"><li>${icon('shield')} Ärztlich geführt</li><li>${icon('check')} Transparente Preise ab CHF 40</li><li>${icon('calendar')} Online buchen 24/7</li></ul>
      <span class="hero__scroll" aria-hidden="true"><i></i> Scroll</span>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="intro-label">
  <div class="container">
    <p class="eyebrow" id="intro-label" data-reveal>Perfect Shape Zürich</p>
    <p class="intro__text words" data-words>Wohlfühlen in Ihrer Haut – mit ärztlicher Präzision, ehrlicher Beratung und modernster Lasertechnologie. Für Ergebnisse, die <em>natürlich</em> wirken. Nicht gemacht.</p>
    <ul class="facts">
      <li data-reveal><b>Ärztlich</b><span>Diagnostik &amp; Behandlung durch geprüfte Ärzte und Spezialistinnen</span></li>
      <li data-reveal style="--d:120ms"><b>13</b><span>Behandlungen – von Fadenlifting bis Laser-Haarentfernung</span></li>
      <li data-reveal style="--d:240ms"><b>Zentral</b><span>Bahnhofstrasse 94 – wenige Gehminuten vom Hauptbahnhof</span></li>
    </ul>
  </div>
</section>

<div class="container">${brands('Premium-Marken &amp; Technologien')}</div>

<section class="section" id="behandlungen" aria-labelledby="treat-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>Behandlungen</p>${title('Was wir', 'für Sie tun', { id: 'treat-title' })}</div>
      <div class="head__text" data-reveal><p>Jede Behandlung wird individuell auf Sie abgestimmt – mit transparenten Richtpreisen und ehrlicher Beratung vorab.</p></div>
    </div>
    ${treatmentList(TREATMENTS)}
    <div class="tl__more" data-reveal>${bookBtn('Termin buchen')}<a class="btn btn--line" href="/preise"><span>Alle Preise</span>${icon('arrow')}</a></div>
  </div>
</section>

<section class="band" aria-labelledby="band-title">
  <div class="band__media" data-parallax>${pic(HOME.bandImage, HOME.bandAlt)}</div>
  <div class="container band__in">
    <div class="band__grid">
      <h2 class="band__giant" id="band-title" data-reveal><em>Natürlich</em>Schön</h2>
      <p data-reveal>Schönheit bedeutet für uns nicht Perfektion, sondern Balance. Deshalb beginnt jede Behandlung mit einer ehrlichen Analyse: Was braucht Ihre Haut wirklich – und was nicht?</p>
    </div>
    <ul class="promises">
      <li data-reveal><b>Ehrliche Beratung</b><span>Wir empfehlen nur, was zu Ihnen passt – und raten offen ab, wenn etwas nicht sinnvoll ist.</span></li>
      <li data-reveal style="--d:120ms"><b>Transparente Preise</b><span>Richtpreise vorab online – keine versteckten Kosten, keine Überraschungen.</span></li>
      <li data-reveal style="--d:240ms"><b>Flexibel buchen</b><span>Online rund um die Uhr. Kostenlose Umbuchung bis 24 Stunden vor dem Termin.</span></li>
    </ul>
  </div>
</section>

<section class="section" aria-labelledby="team-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>In besten Händen</p>${title('Unsere', 'Expertinnen', { id: 'team-title' })}</div>
      <div class="head__text" data-reveal><p>Medizinisches Fachwissen, zertifizierte Lasersicherheit und jahrelange Erfahrung in der ästhetischen Medizin.</p><a class="link" href="/ueber-uns">Das Team kennenlernen ${icon('right')}</a></div>
    </div>
    <div class="team">
      ${TEAM.map((p) => `<a class="member" href="/ueber-uns" data-reveal>
        <div class="member__img" data-reveal="img">${pic(p.image, p.alt, { sizes: '(max-width: 900px) 48vw, 44vw' })}</div>
        <div class="member__row"><div><h3 class="member__name">${esc(p.name)}</h3><p class="member__role">${esc(p.role)}</p></div><span class="arrow-circle">${icon('arrow')}</span></div>
      </a>`).join('')}
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="reviews-title">
  <div class="container reviews">
    <p class="eyebrow" data-reveal>Bewertungen</p>
    ${title('Echte', 'Erfahrungen', { id: 'reviews-title' })}
    <div class="slider" data-slider data-reveal style="margin-top:56px">
      <div class="stars" role="img" aria-label="5 von 5 Sternen">${icon('star').repeat(5)}</div>
      <div class="slider__viewport">
        ${REVIEWS.map((r, i) => `<figure class="review${i === 0 ? ' is-active' : ''}" aria-hidden="${i === 0 ? 'false' : 'true'}">
          <blockquote><p>„${esc(r.text)}“</p></blockquote>
          <figcaption><b>${esc(r.name)}</b> <span>· ${esc(r.tag)}</span></figcaption>
        </figure>`).join('')}
      </div>
      <div class="slider__nav">
        <button type="button" class="arrow-circle" data-prev aria-label="Vorherige Bewertung">${icon('left')}</button>
        <span class="slider__count" aria-live="polite"><b data-current>1</b> / ${REVIEWS.length}</span>
        <button type="button" class="arrow-circle" data-next aria-label="Nächste Bewertung">${icon('right')}</button>
      </div>
    </div>
    <p class="reviews__google" data-reveal><a class="link" href="${SITE.googleMaps}" target="_blank" rel="noopener">Alle Bewertungen auf Google ${icon('arrow')}</a></p>
  </div>
</section>

<section class="section" aria-labelledby="pricing-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>Preise</p>${title('Transparent', '& fair', { id: 'pricing-title' })}</div>
      <div class="head__text" data-reveal><p>Unsere beliebtesten Behandlungen – mit Richtpreisen vorab. Den finalen Preis legen wir nach Ihrer persönlichen Beratung fest.</p><a class="link" href="/preise">Alle Preise ansehen ${icon('right')}</a></div>
    </div>
    <div class="pcards">
      ${featured.map((f, i) => `<article class="pcard" data-reveal style="--d:${i * 120}ms">
        <p class="pcard__label">${esc(f.label)}</p>
        <h3 class="pcard__name">${esc(f.name)}</h3>
        <p class="pcard__price">${f.from ? '<small>ab </small>' : ''}<small>CHF </small>${f.price}</p>
        <p class="pcard__text">${esc(f.text)}</p>
        <ul>${f.list.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>
        <div class="pcard__foot"><a href="/${f.t.slug}" class="link">Details</a><a class="arrow-circle" href="${esc(SITE.booking)}" target="_blank" rel="noopener" data-book aria-label="${esc(f.name)} buchen">${icon('arrow')}</a></div>
      </article>`).join('')}
    </div>
  </div>
</section>

<section class="section section--alt" aria-labelledby="steps-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>So einfach geht’s</p>${title('In 3 Schritten', 'zu Ihrem Termin', { id: 'steps-title' })}</div>
      <div class="head__text" data-reveal><p>Keine Wartezeit am Telefon: Termin online wählen – den Rest besprechen wir persönlich.</p></div>
    </div>
    <ol class="steps steps--3">
      <li data-reveal><span class="steps__n">01</span><h3>Online buchen</h3><p>Behandlung und Wunschtermin wählen – rund um die Uhr, in weniger als einer Minute.</p></li>
      <li data-reveal style="--d:120ms"><span class="steps__n">02</span><h3>Persönliche Beratung</h3><p>Wir analysieren Haut und Ziele und besprechen ehrlich, was wirklich sinnvoll ist.</p></li>
      <li data-reveal style="--d:240ms"><span class="steps__n">03</span><h3>Behandlung &amp; Nachsorge</h3><p>Sorgfältig durchgeführt, mit klaren Empfehlungen – wir bleiben für Fragen erreichbar.</p></li>
    </ol>
    <div class="steps-cta" data-reveal>${bookBtn('Jetzt Termin wählen', 'btn btn--dark btn--lg')}</div>
  </div>
</section>

<section class="section" aria-labelledby="faq-title">
  <div class="container faq-grid">
    <div class="faq-grid__head">
      <p class="eyebrow" data-reveal>FAQ</p>
      ${title('Häufige', 'Fragen', { id: 'faq-title' })}
      <p data-reveal>Ihre Frage ist nicht dabei? Rufen Sie uns an oder schreiben Sie uns – wir helfen gerne.</p>
      <p data-reveal><a class="link" href="/kontakt">Kontakt aufnehmen ${icon('right')}</a></p>
    </div>
    ${faqList(HOME_FAQ)}
  </div>
</section>

${visitBlock()}
`;
  add('index.html', '/', layout({
    path: '/',
    title: 'Ästhetik & Lasermedizin Zürich | Perfect Shape',
    description: 'Fadenlifting, Hyaluron, Laser-Haarentfernung & Endolift® in Zürich – ärztlich geführt an der Bahnhofstrasse 94. Transparente Preise. Jetzt Termin buchen.',
    body,
    hasHero: true,
    schemas: [faqSchema(HOME_FAQ)],
    preload: preloadImg(HOME.heroImage),
  }), { priority: '1.0', changefreq: 'weekly' });
}

/* Behandlungsseiten */
for (const t of TREATMENTS) {
  const cat = catById[t.category];
  const path = '/' + t.slug;
  const from = minPrice(t);
  const related = t.related.map((s) => bySlug[s]);
  const words = t.what.title.split(' ');
  const body = `
<section class="hero hero--page" aria-labelledby="t-title">
  ${heroMedia(t.image, t.imageAlt)}
  <div class="container hero__content">
    ${crumbs([['Behandlungen', '/behandlungen'], [t.navName, path]])}
    <p class="eyebrow eyebrow--light fade-up">${esc(cat.name)} in Zürich</p>
    <div class="hero__grid">
      <h1 class="title title--lg title--light hero__title" id="t-title"><span class="ln"><span>${esc(t.h1)}</span></span><span class="ln"><span><em>${esc(t.h1Accent)}</em></span></span></h1>
      <div class="hero__side">
        <p class="price-tag fade-up d1"><span>ab</span><b>${chf(from)}</b></p>
        <p class="fade-up d1">${esc(t.lead)}</p>
        <div class="hero__ctas fade-up d2">${bookBtn('Termin buchen', 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="#preise"><span>Preise</span></a></div>
      </div>
    </div>
    <div class="hero__bar fade-up d3"><ul class="chips">${t.chips.map((c) => `<li>${esc(c)}</li>`).join('')}</ul><span class="hero__scroll" aria-hidden="true"><i></i> Scroll</span></div>
  </div>
</section>

<nav class="toc" aria-label="Auf dieser Seite">
  <div class="container toc__in">
    <a href="#was">Methode</a><a href="#indikationen">${esc(t.indications.title)}</a><a href="#ablauf">Ablauf</a><a href="#ergebnisse">Ergebnisse</a><a href="#preise">Preise</a><a href="#faq">FAQ</a>
    ${bookBtn('Termin buchen', 'btn btn--dark btn--xs toc__cta')}
  </div>
</nav>

<section class="section" id="was" aria-labelledby="was-title">
  <div class="container split">
    <div class="split__head">
      <p class="eyebrow" data-reveal>${esc(t.keyword)}</p>
      ${title(words.slice(0, -1).join(' '), words.slice(-1)[0], { id: 'was-title' })}
    </div>
    <div class="split__body">
      <p class="lead" data-reveal>${esc(t.intro)}</p>
      <p data-reveal>${esc(t.what.text)}</p>
      <ul class="checks" data-reveal>${t.what.bullets.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
    </div>
  </div>
</section>

<section class="section section--alt" id="indikationen" aria-label="${esc(t.indications.title)} und ${esc(t.contra.title)}">
  <div class="container duo">
    <div data-reveal>
      <p class="eyebrow">Für wen</p>
      <h2>${esc(t.indications.title)}</h2>
      <ul class="checks">${t.indications.items.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
    </div>
    <div data-reveal style="--d:120ms">
      <p class="eyebrow">${t.contra.positive ? 'Ihr Plus' : 'Gut zu wissen'}</p>
      <h2>${esc(t.contra.title)}</h2>
      <ul class="checks ${t.contra.positive ? '' : 'checks--x'}">${t.contra.items.map((b) => `<li>${icon(t.contra.positive ? 'check' : 'x')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <p class="note">${esc(t.contra.note)}</p>
    </div>
  </div>
</section>

<section class="section" id="ablauf" aria-labelledby="ablauf-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>Ablauf</p>${title('Schritt', 'für Schritt', { id: 'ablauf-title' })}</div>
      <div class="head__text" data-reveal><p>Transparent von der ersten Beratung bis zur Nachsorge – damit Sie genau wissen, was Sie erwartet.</p></div>
    </div>
    <ol class="steps steps--${t.steps.length === 3 ? 3 : 4}">
      ${t.steps.map(([h, d], i) => `<li data-reveal style="--d:${i * 100}ms"><span class="steps__n">0${i + 1}</span><h3>${esc(h)}</h3><p>${esc(d)}</p></li>`).join('')}
    </ol>
  </div>
</section>

<section class="section section--dark" id="ergebnisse" aria-labelledby="erg-title">
  <div class="container results">
    <div>
      <p class="eyebrow eyebrow--light" data-reveal>Was Sie erwarten können</p>
      ${title(t.results.title, '', { id: 'erg-title', cls: 'title--light' })}
      <ul class="checks checks--light" data-reveal>${t.results.items.map((b) => `<li>${icon('check')}<span>${esc(b)}</span></li>`).join('')}</ul>
      <p class="note" style="color:rgba(255,255,255,.55)" data-reveal>${esc(t.results.note)}</p>
    </div>
    <div>${t.results.stats.map(([v, l], i) => `<div class="rstat" data-reveal style="--d:${i * 120}ms"><b>${esc(v)}</b><span>${esc(l)}</span></div>`).join('')}</div>
  </div>
</section>

<section class="section" id="preise" aria-labelledby="preise-title">
  <div class="container prices">
    <div class="prices__head">
      <p class="eyebrow" data-reveal>Preise ${esc(t.navName)}</p>
      ${title('Transparente', 'Preise', { id: 'preise-title' })}
      <p data-reveal>Richtwerte pro Behandlung in CHF inkl. MwSt. Die finalen Kosten legen wir nach Ihrer individuellen Beratung fest.</p>
      <div class="prices__cta" data-reveal>${bookBtn('Jetzt Termin sichern')}<a class="link" href="/preise">Alle Preise ${icon('right')}</a></div>
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
      <p class="eyebrow" data-reveal>FAQ ${esc(t.navName)}</p>
      ${title('Häufige', 'Fragen', { id: 'faq-title' })}
      <p data-reveal>Noch Fragen? Wir beraten Sie gerne persönlich – telefonisch oder direkt im Studio.</p>
      <p data-reveal><a class="link" href="${SITE.phoneHref}">${esc(SITE.phone)} ${icon('right')}</a></p>
    </div>
    ${faqList(t.faq)}
  </div>
</section>

<section class="section" aria-labelledby="rel-title">
  <div class="container">
    <div class="head">
      <div><p class="eyebrow" data-reveal>Passt gut dazu</p>${title('Weitere', 'Behandlungen', { id: 'rel-title' })}</div>
      <div class="head__text" data-reveal><a class="link" href="/behandlungen">Alle Behandlungen ${icon('right')}</a></div>
    </div>
    ${treatmentList(related, { groups: false })}
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
    image: imgUrl(t.image),
    provider: { '@id': BUSINESS_ID },
    areaServed: { '@type': 'City', name: 'Zürich' },
    offers: t.prices.filter((p) => p.price).map((p) => ({ '@type': 'Offer', name: p.name + (p.detail ? ` (${p.detail})` : ''), price: p.price, priceCurrency: 'CHF', url: abs(path) + '#preise', availability: 'https://schema.org/InStock', ...(p.from ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: p.price, priceCurrency: 'CHF' } } : {}) })),
  };
  add(t.slug + '.html', path, layout({
    path, title: t.title, description: t.description, active: 'behandlungen', body, hasHero: true,
    schemas: [serviceSchema, faqSchema(t.faq), breadcrumbSchema([['Behandlungen', '/behandlungen'], [t.navName, path]])],
    ogImage: `/assets/img/${t.image}.jpg`,
    preload: preloadImg(t.image),
  }), { priority: '0.9' });
}

/* Behandlungen Übersicht */
{
  const body = `
<section class="hero hero--page" aria-labelledby="b-title">
  ${heroMedia(HOME.treatmentsHero, 'Behandlungsraum bei Perfect Shape Zürich')}
  <div class="container hero__content">
    ${crumbs([['Behandlungen', '/behandlungen']])}
    <div class="hero__grid">
      <h1 class="title title--lg title--light hero__title" id="b-title"><span class="ln"><span>Behandlungen</span></span><span class="ln"><span><em>in Zürich</em></span></span></h1>
      <div class="hero__side"><p class="fade-up d1">Ästhetische Medizin, Laser, apparative Kosmetik, Peelings und Massagen – alle 13 Behandlungen von Perfect Shape an der Bahnhofstrasse 94 im Überblick.</p><div class="hero__ctas fade-up d2">${bookBtn('Termin buchen', 'btn btn--light btn--lg')}</div></div>
    </div>
  </div>
</section>
<section class="section">
  <div class="container">
    ${treatmentList(TREATMENTS, { headingTag: 'h2' })}
  </div>
</section>
`;
  add('behandlungen.html', '/behandlungen', layout({
    path: '/behandlungen',
    title: 'Alle Behandlungen – Ästhetik & Laser Zürich | Perfect Shape',
    description: 'Alle Behandlungen im Überblick: Fadenlifting, Hyaluron, Mesotherapie, PRP, Laser-Haarentfernung, Endolift®, RF Needling, Peelings & Massagen in Zürich.',
    active: 'behandlungen', body, hasHero: true, preload: preloadImg(HOME.treatmentsHero),
    schemas: [breadcrumbSchema([['Behandlungen', '/behandlungen']]), { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: TREATMENTS.map((t, i) => ({ '@type': 'ListItem', position: i + 1, url: abs('/' + t.slug), name: t.navName })) }],
  }), { priority: '0.9' });
}

/* Preise */
{
  const body = `
<section class="phead">
  <div class="container">
    ${crumbs([['Preise', '/preise']])}
    <div class="phead__row">
      <h1 class="title title--lg hero__title"><span class="ln"><span>Preise</span></span><span class="ln"><span><em>transparent &amp; fair</em></span></span></h1>
      <div><p class="lead fade-up d1">Richtwerte pro Behandlung in CHF inkl. MwSt. Die finalen Kosten legen wir nach Ihrer individuellen Beratung fest – ehrlich und ohne versteckte Kosten.</p><div class="hero__ctas fade-up d2" style="margin-top:24px">${bookBtn('Jetzt Termin sichern')}</div></div>
    </div>
  </div>
</section>
<nav class="toc" aria-label="Preiskategorien">
  <div class="container toc__in">${TREATMENTS.map((t) => `<a href="#${t.slug}">${esc(t.navName)}</a>`).join('')}</div>
</nav>
<section class="section section--tight">
  <div class="container">
    ${TREATMENTS.map((t) => `<article class="pgroup" id="${t.slug}" aria-labelledby="pg-${t.slug}">
      <div class="pgroup__head" data-reveal>
        <div class="pgroup__img">${pic(t.image, t.imageAlt, { sizes: '(max-width: 900px) 92vw, 26vw' })}</div>
        <p class="eyebrow">${esc(catById[t.category].name)}</p>
        <h2 id="pg-${t.slug}">${esc(t.navName)}</h2>
        <a class="link" href="/${t.slug}">Zur Behandlung ${icon('right')}</a>
      </div>
      <div data-reveal><ul class="plist">${t.prices.map(priceRow).join('')}</ul>${t.priceNote ? `<p class="note">${esc(t.priceNote)}</p>` : ''}</div>
    </article>`).join('')}
    <p class="note">Alle Preise in Schweizer Franken (CHF) inkl. MwSt. Preisänderungen vorbehalten. Zahlung in bar, per Karte oder TWINT. Es gelten unsere <a href="/agb" style="text-decoration:underline">AGB</a>.</p>
  </div>
</section>
`;
  add('preise.html', '/preise', layout({
    path: '/preise',
    title: 'Preise – Ästhetik & Laser Zürich | Perfect Shape',
    description: 'Transparente Preise in Zürich: Laser-Haarentfernung ab CHF 40, Lippenaufbau ab CHF 160, Fadenlifting ab CHF 240, Endolift® CHF 1800. Jetzt buchen.',
    active: 'preise', body,
    schemas: [breadcrumbSchema([['Preise', '/preise']])],
  }), { priority: '0.9' });
}

/* Über uns */
{
  const body = `
<section class="hero hero--page" aria-labelledby="u-title">
  ${heroMedia(HOME.aboutHero, 'Studio von Perfect Shape an der Bahnhofstrasse 94 in Zürich')}
  <div class="container hero__content">
    ${crumbs([['Über uns', '/ueber-uns']])}
    <div class="hero__grid">
      <h1 class="title title--lg title--light hero__title" id="u-title"><span class="ln"><span>Das Beauty Studio</span></span><span class="ln"><span><em>auf höchstem Niveau</em></span></span></h1>
      <div class="hero__side"><p class="fade-up d1">Ärztliche Kompetenz, ehrliche Beratung und modernste Lasertechnologie – mitten in Zürich.</p><div class="hero__ctas fade-up d2">${bookBtn('Termin buchen', 'btn btn--light btn--lg')}<a class="btn btn--line-light btn--lg" href="#team"><span>Team</span></a></div></div>
    </div>
  </div>
</section>

<section class="section">
  <div class="container">
    <p class="eyebrow" data-reveal>Über Perfect Shape</p>
    <p class="intro__text words" data-words>Wohlfühlen in Ihrer Haut – das ist unser Bestreben. In unserem Studio werden Diagnostik und Behandlung von geprüften Ärzten und Spezialistinnen durchgeführt, mit innovativsten Lasertechnologien und <em>hochwertigsten</em> Materialien.</p>
  </div>
</section>

<section class="section section--alt" id="team" aria-labelledby="team-title">
  <div class="container">
    <div class="head"><div><p class="eyebrow" data-reveal>Unsere Expertinnen</p>${title('Das', 'Team', { id: 'team-title' })}</div></div>
    ${TEAM.map((p) => `<article class="bio">
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

<section class="section section--tight"><div class="container">${brands('Partner &amp; Marken')}</div></section>

<section class="section" aria-labelledby="studio-title">
  <div class="container">
    <div class="head"><div><p class="eyebrow" data-reveal>Bahnhofstrasse 94 · 2. Etage</p>${title('Unser', 'Studio', { id: 'studio-title' })}</div><div class="head__text" data-reveal><p>Hell, ruhig und diskret – mitten in Zürich, nur wenige Gehminuten vom Hauptbahnhof.</p></div></div>
    <div class="gallery">
      <figure class="gallery__a" data-reveal="img">${pic('studio-perfect-shape-zuerich-behandlungsraum', 'Moderner Behandlungsraum bei Perfect Shape Zürich', { sizes: '(max-width: 900px) 92vw, 56vw' })}</figure>
      <figure class="gallery__b" data-reveal="img">${pic('studio-perfect-shape-zuerich-zertifikate', 'Zertifikate und Diplome bei Perfect Shape Zürich', { sizes: '(max-width: 900px) 92vw, 36vw' })}</figure>
      <figure class="gallery__c" data-reveal="img">${pic('agnieszka-jaggy-behandlung', 'Agnieszka Jaggy bei einer apparativen Behandlung', { sizes: '(max-width: 900px) 92vw, 36vw' })}</figure>
    </div>
  </div>
</section>
${visitBlock()}
`;
  add('ueber-uns.html', '/ueber-uns', layout({
    path: '/ueber-uns',
    title: 'Über uns – Dr. med. Roya Jeyrani & Team | Perfect Shape',
    description: 'Perfect Shape Zürich: Dr. med. Roya Jeyrani und Agnieszka Jaggy – ärztliche Kompetenz, ehrliche Beratung und modernste Lasertechnologie an der Bahnhofstrasse.',
    active: 'ueber-uns', body, hasHero: true, preload: preloadImg(HOME.aboutHero),
    schemas: [breadcrumbSchema([['Über uns', '/ueber-uns']]), ...TEAM.map((p) => ({ '@context': 'https://schema.org', '@type': 'Person', name: p.name, jobTitle: p.roleShort, description: p.bio[0], image: imgUrl(p.image), worksFor: { '@id': BUSINESS_ID } }))],
  }), { priority: '0.8' });
}

/* Kontakt */
{
  const body = `
<section class="phead">
  <div class="container">
    ${crumbs([['Kontakt', '/kontakt']])}
    <div class="phead__row">
      <h1 class="title title--lg hero__title"><span class="ln"><span>Kontakt</span></span><span class="ln"><span><em>&amp; Termin</em></span></span></h1>
      <p class="lead fade-up d1">Am schnellsten geht’s online. Oder schreiben Sie uns – wir melden uns schnellstmöglich bei Ihnen.</p>
    </div>
  </div>
</section>
<section class="section section--tight">
  <div class="container contact">
    <div data-reveal>
      <p class="eyebrow">Direkt erreichen</p>
      <ul class="clist" style="margin-top:0">
        <li><b>Online</b><a href="${esc(SITE.booking)}" target="_blank" rel="noopener" data-book>Termin buchen – rund um die Uhr</a></li>
        <li><b>Telefon</b><a href="${SITE.phoneHref}">${esc(SITE.phone)}</a></li>
        <li><b>WhatsApp</b><a href="${SITE.whatsapp}" target="_blank" rel="noopener">Nachricht schreiben</a></li>
        <li><b>E-Mail</b><a href="mailto:${SITE.email}">${esc(SITE.email)}</a></li>
        <li><b>Adresse</b><a href="${SITE.route}" target="_blank" rel="noopener">${esc(SITE.street)}, ${esc(SITE.floor)}, ${SITE.zip} ${esc(SITE.city)}</a></li>
      </ul>
      <div class="contact__quick">${bookBtn('Termin online buchen', 'btn btn--dark btn--lg')}</div>
    </div>
    <div data-reveal style="--d:120ms">
      <p class="eyebrow">Nachricht senden</p>
      <form class="form" id="contactForm" novalidate data-mailto="${SITE.email}">
        <div class="form__row">
          <div class="field"><label for="cfName">Name *</label><input id="cfName" name="name" type="text" autocomplete="name" required placeholder="Vor- und Nachname"></div>
          <div class="field"><label for="cfEmail">E-Mail *</label><input id="cfEmail" name="email" type="email" autocomplete="email" required placeholder="name@beispiel.ch"></div>
        </div>
        <div class="form__row">
          <div class="field"><label for="cfPhone">Telefon</label><input id="cfPhone" name="phone" type="tel" autocomplete="tel" placeholder="+41 …"></div>
          <div class="field"><label for="cfTopic">Behandlung</label><select id="cfTopic" name="topic"><option value="">Bitte wählen (optional)</option>${TREATMENTS.map((t) => `<option>${esc(t.navName)}</option>`).join('')}<option>Allgemeine Frage</option></select></div>
        </div>
        <div class="field"><label for="cfMsg">Nachricht *</label><textarea id="cfMsg" name="message" rows="4" required placeholder="Wie können wir Ihnen helfen?"></textarea></div>
        <label class="check"><input type="checkbox" name="consent" required> <span>Ich stimme der Verarbeitung meiner Daten zur Bearbeitung meiner Anfrage zu (<a href="/datenschutz">Datenschutz</a>). *</span></label>
        <button class="btn btn--dark btn--lg" type="submit"><span>Nachricht senden</span>${icon('arrow')}</button>
        <p class="form__status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </div>
</section>
${mapBlock()}
`;
  add('kontakt.html', '/kontakt', layout({
    path: '/kontakt',
    title: 'Kontakt & Termin – Perfect Shape Zürich',
    description: 'Kontaktieren Sie Perfect Shape Zürich: Bahnhofstrasse 94, 8001 Zürich · Tel. +41 76 608 61 61 · WhatsApp · E-Mail. Termin online buchen – rund um die Uhr.',
    active: 'kontakt', body, cta: false,
    schemas: [breadcrumbSchema([['Kontakt', '/kontakt']]), { '@context': 'https://schema.org', '@type': 'ContactPage', url: abs('/kontakt'), name: 'Kontakt Perfect Shape Zürich', about: { '@id': BUSINESS_ID } }],
  }), { priority: '0.8' });
}

/* Rechtliches */
function legal(file, path, pageTitle, h1, description, content) {
  const body = `
<section class="phead">
  <div class="container">
    ${crumbs([[h1, path]])}
    <h1 class="title title--lg">${esc(h1)}</h1>
  </div>
</section>
<section class="section section--tight"><div class="container prose">${content}</div></section>`;
  add(file, path, layout({ path, title: pageTitle, description, body, cta: false, schemas: [breadcrumbSchema([[h1, path]])] }), { priority: '0.3', changefreq: 'yearly' });
}
const stand = new Date().toLocaleDateString('de-CH', { month: 'long', year: 'numeric' });

legal('agb.html', '/agb', 'AGB – Allgemeine Geschäftsbedingungen | Perfect Shape Zürich', 'AGB',
  'Allgemeine Geschäftsbedingungen von Perfect Shape Zürich: Terminvereinbarung, Stornierung, Preise, Zahlung, Haftung und Datenschutz.',
  AGB.map(([h, p]) => `<h2>${esc(h)}</h2><p>${esc(p)}</p>`).join('') + `<p class="note">Stand: ${stand}</p>`);

legal('datenschutz.html', '/datenschutz', 'Datenschutzerklärung | Perfect Shape Zürich', 'Datenschutz',
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

legal('impressum.html', '/impressum', 'Impressum | Perfect Shape Zürich', 'Impressum',
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
  noindex: true, cta: false,
  body: `<section class="phead" style="min-height:70vh"><div class="container">
    <p class="nf__code">404</p>
    <h1 class="title title--lg">Seite <em>nicht gefunden</em></h1>
    <p class="lead" style="margin:24px 0 30px;max-width:560px">Die gesuchte Seite existiert nicht oder wurde verschoben. Vielleicht finden Sie hier, was Sie suchen:</p>
    <div class="hero__ctas"><a class="btn btn--dark btn--lg" href="/"><span>Zur Startseite</span></a><a class="btn btn--line btn--lg" href="/behandlungen"><span>Alle Behandlungen</span></a></div>
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
    <image:image><image:loc>${imgUrl(t.image)}</image:loc></image:image>` : ''}
  </url>`;
}).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);
writeFileSync(join(ROOT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /scripts/\n\nSitemap: ${SITE.url}/sitemap.xml\n`);

console.log(`✓ ${pages.length} Seiten generiert`);
