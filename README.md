# Perfect Shape Zürich – strona www

Nowa wersja strony **perfectshape-zuerich.ch** – studio estetyki i medycyny laserowej, Bahnhofstrasse 94, Zürich.
Statyczna strona (HTML/CSS/JS bez frameworków i bez jQuery, płynny scroll: Lenis – MIT) generowana jednym skryptem Node, hostowana na Vercel.

## Struktura

| Ścieżka | Co to jest |
| --- | --- |
| `scripts/content.mjs` | **Wszystkie treści DE**: dane kontaktowe, zabiegi, ceny, FAQ, zespół, opinie, AGB, zdjęcia strony głównej (`HOME`) |
| `scripts/content.en.mjs` | Treści angielskie |
| `scripts/build.mjs` | Generator: layout, header/footer, podstrony, JSON-LD, sitemap.xml, robots.txt |
| `assets/css/style.css` | Style (źródło) → build tworzy `style.min.css` |
| `assets/js/main.js` | Interakcje: płynny scroll, header nad hero, paralaksa, menu, lista zabiegów z podglądem, slider, FAQ, modal rezerwacji, mapa, formularz |
| `assets/js/lenis.min.js` | Biblioteka płynnego przewijania (MIT) |
| `assets/img/` | Zoptymalizowane obrazy WebP (480–2560 px) + JPG fallback, logo wektorowe (`logo.svg`, `logo-white.svg`), OG-image |
| `assets/fonts/` | Fonty self-hosted (Inter Tight, Instrument Serif – licencja OFL) |
| `*.html`, `sitemap.xml`, `robots.txt` | **Wygenerowane** – nie edytować ręcznie |
| `vercel.json` | Czyste URL-e, przekierowania 301 ze starych adresów, cache, nagłówki bezpieczeństwa |

## Podmiana zdjęć (hero itd.)

1. Przygotuj zdjęcie (najlepiej min. 2400 px szerokości) i uruchom:
   `python3 scripts/add-image.py moje-zdjecie.jpg nazwa-zdjecia` (wymaga Pillow: `pip install Pillow`) – skrypt sam utworzy wszystkie rozmiary WebP/JPG i wpis w `imgmeta.json`.
2. W `scripts/content.mjs` w obiekcie `HOME` zmień nazwę obrazu:
   - `heroImage` – pełnoekranowe zdjęcie na stronie głównej (`heroPos` / `heroPosMobile` = kadrowanie, np. `'40% 50%'`)
   - `bandImage` – zdjęcie w sekcji „Natürlich schön”
   - `ctaImage` – zdjęcie w końcowym CTA „Ihr Termin wartet auf Sie”
   - `aboutHero`, `treatmentsHero` – hero podstron „Über uns” i „Behandlungen”
   - zdjęcia zabiegów: pole `image` przy każdym zabiegu
3. `node scripts/build.mjs`

## Wersja angielska

- Niemiecki (de-CH) jest językiem głównym (adresy w katalogu głównym), angielski jest pod `/en/...` z angielskimi adresami pod SEO (np. `/en/thread-lift-zurich`).
- Treści EN: `scripts/content.en.mjs` (klucz = niemiecki slug zabiegu, ceny liczbowe brane automatycznie z wersji DE). Teksty interfejsu i strony głównej: `STR` i bloki `de ? … : …` w `scripts/build.mjs`.
- Każda strona ma `hreflang` (de-CH / en / x-default), sitemap zawiera alternatywy językowe. Przełącznik DE/EN prowadzi do odpowiednika aktualnej strony.
- AGB, Datenschutz i Impressum są tylko po niemiecku (wersja prawnie wiążąca) – w EN stopka linkuje do nich z dopiskiem „(DE)”.

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
- Lighthouse (lokalnie, mobile, bez kompresji): SEO 100 · Best Practices 100 · Performance 92–97
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
