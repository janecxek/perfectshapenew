# Perfect Shape Zürich – strona www

Nowa wersja strony **perfectshape-zuerich.ch** – studio estetyki i medycyny laserowej, Bahnhofstrasse 94, Zürich.
Statyczna strona (HTML/CSS/JS bez frameworków i bez jQuery) generowana jednym skryptem Node, hostowana na Vercel.

## Struktura

| Ścieżka | Co to jest |
| --- | --- |
| `scripts/content.mjs` | **Wszystkie treści**: dane kontaktowe, zabiegi, ceny, FAQ, zespół, opinie, AGB |
| `scripts/build.mjs` | Generator: layout, header/footer, podstrony, JSON-LD, sitemap.xml, robots.txt |
| `assets/css/style.css` | Style (źródło) → build tworzy `style.min.css` |
| `assets/js/main.js` | Interakcje: menu, mega-menu, animacje, filtr, slider, FAQ, modal rezerwacji, mapa, formularz |
| `assets/img/` | Zoptymalizowane obrazy WebP (480–1600 px) + JPG fallback, logo, OG-image |
| `assets/fonts/` | Fonty self-hosted (Inter Tight, Instrument Serif – licencja OFL) |
| `*.html`, `sitemap.xml`, `robots.txt` | **Wygenerowane** – nie edytować ręcznie |
| `vercel.json` | Czyste URL-e, przekierowania 301 ze starych adresów, cache, nagłówki bezpieczeństwa |

## Zmiana treści / cen

1. Edytuj `scripts/content.mjs` (np. cenę w `prices`, pytanie w `faq`).
2. Uruchom `node scripts/build.mjs` (Node 18+).
3. Commit + push → Vercel wdroży automatycznie.

## Podstrony (URL-e pod SEO)

`/`, `/behandlungen`, `/preise`, `/ueber-uns`, `/kontakt`, `/agb`, `/datenschutz`, `/impressum` oraz 13 stron zabiegów:
`/fadenlifting-zuerich`, `/hyaluron-zuerich`, `/mesotherapie-zuerich`, `/biostimulatoren-zuerich`,
`/prp-vampirelifting-zuerich`, `/laser-haarentfernung-zuerich`, `/endolift-zuerich`, `/rf-needling-zuerich`,
`/microdermabrasion-zuerich`, `/carbon-laser-peeling-zuerich`, `/klassische-massage-zuerich`,
`/anti-cellulite-massage-zuerich`, `/fruchtsaeure-peeling-zuerich`.

Wszystkie stare adresy (np. `/pdofaden.html`, `/permamente haarentfernung.html`, `/uberuns.html`) mają przekierowania 301 w `vercel.json`, więc dotychczasowa pozycja w Google zostaje przeniesiona.

## SEO – co jest zrobione

- Unikalne `title` (≤ 60 znaków) i `meta description` (≤ 160) z frazą „… Zürich” i ceną dla każdej podstrony
- Jeden `h1` na stronę, semantyczne nagłówki, breadcrumbs, linkowanie wewnętrzne („Weitere Behandlungen”)
- JSON-LD: `BeautySalon`/`MedicalBusiness` (adres, telefon, mapa, oferta z cenami, `ReserveAction`), `WebSite`, `Service` + `Offer` dla każdego zabiegu, `FAQPage`, `BreadcrumbList`, `Person` (zespół)
- `canonical`, `hreflang="de-CH"`, Open Graph + Twitter Card z dedykowanym obrazem 1200×630
- `sitemap.xml` (z obrazami) + `robots.txt`, plik weryfikacyjny Google Search Console zachowany
- Wydajność: WebP + `srcset`, preload obrazu hero i fontów, lazy-loading, brak zewnętrznych bibliotek, CLS = 0
- Lighthouse (lokalnie, mobile): SEO 100 · Best Practices 100 · Accessibility 100 · Performance ~95
- Prywatność (nDSG): fonty lokalnie, brak cookies śledzących, Google Maps ładowane dopiero po kliknięciu

## Po wdrożeniu (ważne dla pozycji w Google)

1. **Google Search Console** → dodać `https://perfectshape-zuerich.ch/sitemap.xml` i poprosić o indeksowanie strony głównej.
2. **Profil Firmy w Google (Google Business Profile)** → ustawić link do strony, kategorie (np. „Kosmetikstudio”, „Klinik für ästhetische Chirurgie/Medizin”), godziny otwarcia, zdjęcia, regularnie zbierać opinie – to najważniejszy czynnik dla wyników lokalnych („… Zürich”).
3. Sprawdzić dane strukturalne: https://search.google.com/test/rich-results

## Do uzupełnienia przez klientkę

- **Godziny otwarcia** – nie było ich na starej stronie (teraz: „Termine nach Vereinbarung”). Po uzupełnieniu warto dodać `openingHoursSpecification` w `businessSchema()` w `build.mjs`.
- **Impressum** – nazwa prawna firmy / właścicielka i ewentualny numer UID (CHE-…).
- **WhatsApp** – przyciski prowadzą do `wa.me/41766086161`; potwierdzić, że numer ma WhatsApp.
- **Formularz kontaktowy** działa przez `mailto:` (otwiera program pocztowy). Jeśli formularz ma wysyłać wiadomości bezpośrednio, można podłączyć np. Formspree/Web3Forms.
