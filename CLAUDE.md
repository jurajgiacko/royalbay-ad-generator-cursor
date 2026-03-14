# Royal Bay Ad Creative Generator

> **ÚČEL:** Kompletné zadanie na interný nástroj na automatizované generovanie performance bannerov pre Royal Bay. Tento súbor slúži ako README.md aj ako CLAUDE.md (brand kontext pre Claude Code). Obsahuje všetko: project brief, brand config z oficiálneho brand manuálu, všetky veľkosti bannerov, a inštrukcie.

---

## 1. ČO STAVIAM

CLI nástroj + jednoduchý web preview, ktorý:

1. Načíta brand pravidlá z `brand/royalbay.json` (logo, farby, fonty — NEMENNÉ)
2. Načíta layout template z `templates/` (HTML + JSON config pre konkrétny rozmer)
3. Načíta campaign dáta z `campaigns/` (obrázok, claim, CTA — premenlivý obsah)
4. Zmerguje všetko, zvaliduje oproti brand pravidlám
5. Vyrenderuje finálne PNG/JPG bannery cez Puppeteer v presných px rozmeroch
6. Post-processing cez Sharp (kompresia pod file size limity)

---

## 2. TECH STACK

- **Node.js** (v18+)
- **Puppeteer** — HTML → screenshot renderovanie
- **Express** — lokálny web UI na preview (nízka priorita, najskôr CLI)
- **Handlebars** — merge brand + template + campaign premenných do HTML
- **Sharp** — post-processing, kompresia, formát konverzia

---

## 3. ADRESÁROVÁ ŠTRUKTÚRA

```
royalbay-ad-generator/
├── README.md
├── CLAUDE.md                          ← kópia tohto dokumentu (kontext pre Claude Code)
├── package.json
├── .env.example
│
├── brand/
│   └── royalbay.json                  ← brand config (viď sekcia 5)
│
├── assets/
│   ├── logos/
│   │   ├── logo-full-color.png        ← chevron(tyrkys) + ROYAL BAY + HIGH-TECH SPORTSWEAR (tmavý text), transparent BG
│   │   ├── logo-full-ondark.png       ← chevron(tyrkys) + ROYAL BAY + HIGH-TECH SPORTSWEAR (biely text), transparent BG
│   │   ├── logo-full-white.png        ← celé biele, transparent BG
│   │   ├── logo-rb-color.png          ← chevron(tyrkys) + RB (tmavý text), transparent BG
│   │   ├── logo-rb-ondark.png         ← chevron(tyrkys) + RB (biely text), transparent BG — TOTO je default pre bannery na fotkách
│   │   └── logo-rb-white.png          ← celé biele, transparent BG
│   ├── fonts/
│   │   ├── Klavika-Regular.woff2      ← primárny font (platený, ak dostupný)
│   │   ├── Klavika-Bold.woff2
│   │   ├── BankGothic-Md-BT.woff2    ← display font pre tagline
│   │   ├── Montserrat-Regular.woff2   ← fallback
│   │   └── Montserrat-Bold.woff2
│   └── photos/                        ← kampanové fotky
│
├── templates/
│   ├── _base.html                     ← spoločný HTML wrapper (fonty, CSS variables)
│   ├── landscape.html + .json         ← 1200×628, 1920×600 atď.
│   ├── square.html + .json            ← 1080×1080
│   ├── vertical-feed.html + .json     ← 1080×1350
│   ├── vertical-fullscreen.html + .json ← 1080×1920 (stories/reels)
│   ├── rectangle.html + .json         ← 300×250, 336×280
│   ├── leaderboard.html + .json       ← 728×90
│   ├── mobile-banner.html + .json     ← 320×100
│   ├── half-page.html + .json         ← 300×600
│   ├── skyscraper.html + .json        ← 160×600
│   ├── cube.html + .json              ← 300×300, 480×480
│   ├── billboard.html + .json         ← 970×310, 970×210
│   ├── web-hero.html + .json          ← 1920×600, 1920×800
│   ├── web-hero-mobile.html + .json   ← 750×750
│   ├── email-hero.html + .json        ← 1200×600 (retina)
│   └── email-strip.html + .json       ← 600×200
│
├── campaigns/
│   ├── _schema.json                   ← JSON Schema pre validáciu
│   └── example-campaign.json
│
├── validators/
│   └── brand-validator.js
│
├── engine/
│   ├── merge.js                       ← merge brand + template + campaign
│   ├── render.js                      ← Puppeteer HTML → PNG
│   ├── compress.js                    ← Sharp post-processing
│   └── batch.js                       ← batch generovanie + presety
│
├── server/
│   └── index.js                       ← Express preview (nízka priorita)
│
├── output/                            ← vygenerované bannery (gitignored)
│
└── docs/
    ├── how-to-add-campaign.md
    └── 2023_BRAND_MANUAL.pdf          ← originál brand manual
```

---

## 4. BRAND STORY (kontext)

ROYAL BAY = vavřín, vítězný věnec. HIGH-TECH SPORTSWEAR.

**Claim:** BETTER & FASTER — for better performance and faster recovery.

**Produkt:** Sportovní kompresní produkty (podkolenky, lýtkové návleky, stehenní návleky, ponožky).

**Zákazník:** 47% ženy, 53% muži. 67% vo veku 25-44 rokov. Dva segmenty:
- "Nadšený sportovec" — chce vedieť prínosy, vecný obsah
- "In-sportovec" — chce design a emócie

**Konkurencia:** CEP, Compressport, Bauerfeind Sports, 2XU.

**Materská spoločnosť:** ARIES, a.s. — Medical Compression Since 1991.

---

## 5. BRAND CONFIG — `brand/royalbay.json`

Zdroj: Oficiálny brand manual SD 13-002(R04), 01.03.2023 + extrakcia farieb z loga.

```json
{
  "brand": "Royal Bay",
  "fullName": "ROYAL BAY HIGH-TECH SPORTSWEAR",
  "claim": "BETTER & FASTER",

  "logo": {
    "variants": {
      "full_color":     { "file": "assets/logos/logo-full-color.png",    "desc": "Chevron(tyrkys) + ROYAL BAY + tagline, tmavý text, na svetlé pozadie" },
      "full_ondark":    { "file": "assets/logos/logo-full-ondark.png",   "desc": "Chevron(tyrkys) + ROYAL BAY + tagline, biely text, na tmavé/foto pozadie" },
      "full_white":     { "file": "assets/logos/logo-full-white.png",    "desc": "Celé biele, na tyrkysové pozadie" },
      "rb_color":       { "file": "assets/logos/logo-rb-color.png",      "desc": "Chevron(tyrkys) + RB, tmavý text, na svetlé pozadie" },
      "rb_ondark":      { "file": "assets/logos/logo-rb-ondark.png",     "desc": "Chevron(tyrkys) + RB, biely text — DEFAULT pre bannery na fotkách" },
      "rb_white":       { "file": "assets/logos/logo-rb-white.png",      "desc": "Celé biele, na tyrkysové pozadie" }
    },
    "selectionLogic": {
      "bannerWidth_gte_800":  "full_ondark (alebo full_color na bielom pozadí)",
      "bannerWidth_400_to_799": "rb_ondark (alebo rb_color na bielom pozadí)",
      "bannerWidth_lt_400":   "rb_ondark"
    },
    "minWidth": 80,
    "safeZone": "Výška chevron ikony na každej strane",
    "defaultPosition": "top-right"
  },

  "colors": {
    "turquoise":     { "hex": "#18AA9D", "pantone": "3272 C", "cmyk": [100,0,50,0], "note": "Extrahované z loga. Brand manual uvádza Pantone 3272 C." },
    "black":         { "hex": "#000000", "cmyk": [0,0,0,100] },
    "white":         { "hex": "#FFFFFF", "cmyk": [0,0,0,0] },
    "darkGray":      { "hex": "#1A1A1A" },
    "lightGray":     { "hex": "#F5F5F5" },
    "overlay":       "rgba(0, 0, 0, 0.45)"
  },

  "fonts": {
    "primary":       { "family": "Klavika", "fallback": "Montserrat, Arial, sans-serif", "weights": [400, 700] },
    "display":       { "family": "BankGothic Md BT", "fallback": "Rajdhani, Orbitron, sans-serif", "tracking": -50, "textTransform": "uppercase" }
  },

  "rules": {
    "logoAlwaysPresent": true,
    "logoNeverModified": true,
    "colorsOnlyFromPalette": true,
    "fontsOnlyKlavikaOrFallback": true,
    "claimMaxChars": 50,
    "subheadingMaxChars": 80,
    "maxTextCoveragePercent": 25,
    "photoMustShowDynamicMovement": true,
    "photoMustShowRoyalBayProduct": true
  }
}
```

---

## 6. VŠETKY VEĽKOSTI BANNEROV

### TIER 1 — Povinné

| ID                          | Rozmer (px)  | Platforma              | Template variant      |
|-----------------------------|-------------|------------------------|-----------------------|
| `landscape-1200x628`        | 1200×628    | Google RDA, Meta, Sklik komb. | landscape         |
| `square-1080x1080`          | 1080×1080   | Google RDA, Meta, Sklik komb. | square            |
| `meta-vertical-1080x1350`   | 1080×1350   | Meta Feed              | vertical-feed         |
| `meta-story-1080x1920`      | 1080×1920   | Meta Stories/Reels     | vertical-fullscreen   |
| `gdn-300x250`               | 300×250     | Google Display, Sklik  | rectangle             |
| `gdn-728x90`                | 728×90      | Google Display, Sklik  | leaderboard           |
| `gdn-320x100`               | 320×100     | Google Display, Sklik  | mobile-banner         |
| `gdn-300x600`               | 300×600     | Google Display, Sklik  | half-page             |
| `web-hero-1920x600`         | 1920×600    | Web e-shop             | web-hero              |
| `web-hero-mobile-750x750`   | 750×750     | Web e-shop mobile      | web-hero-mobile       |
| `email-retina-1200x600`     | 1200×600    | Ecomail newsletter     | email-hero            |

### TIER 2 — Odporúčané

| ID                          | Rozmer (px)  | Platforma              | Template variant      |
|-----------------------------|-------------|------------------------|-----------------------|
| `gdn-160x600`               | 160×600     | Google Display, Sklik  | skyscraper            |
| `gdn-336x280`               | 336×280     | Google Display         | rectangle             |
| `sklik-300x300`             | 300×300     | Sklik (CZ only)        | cube                  |
| `sklik-480x300`             | 480×300     | Sklik (CZ only)        | cube                  |
| `sklik-480x480`             | 480×480     | Sklik (CZ only)        | cube                  |
| `sklik-970x310`             | 970×310     | Sklik (CZ only)        | billboard             |
| `sklik-970x210`             | 970×210     | Sklik (CZ only)        | billboard             |
| `sklik-500x200`             | 500×200     | Sklik (CZ only)        | billboard             |
| `sklik-720x1280`            | 720×1280    | Sklik interscroller    | vertical-fullscreen   |
| `web-hero-1920x800`         | 1920×800    | Web e-shop             | web-hero              |
| `web-category-1200x400`     | 1200×400    | Web e-shop             | web-hero              |
| `web-promo-1200x300`        | 1200×300    | Web e-shop             | email-strip           |
| `email-retina-1200x800`     | 1200×800    | Ecomail newsletter     | email-hero            |
| `email-fullwidth-600x200`   | 600×200     | Ecomail newsletter     | email-strip           |

### File size limity — KRITICKÉ

| Platforma              | Max file size  | Formát          |
|------------------------|---------------|-----------------|
| Google Ads bannery     | **150 KB**    | JPG, PNG        |
| Sklik bannery          | **150 KB**    | JPG, PNG, WebP  |
| Sklik kombinovaná      | **1 MB**      | JPG, PNG        |
| Meta Ads               | **30 MB**     | JPG, PNG        |
| Web bannery            | **300 KB**    | JPG, WebP       |
| Ecomail                | **200 KB**    | JPG, PNG        |

### Responzívne assety (BEZ textu) vs Statické bannery (S textom)

Pre `1200×628` a `1080×1080` generovať DVE verzie:
1. **Clean** — iba fotka, bez textu/loga/CTA → pre Google RDA a Sklik kombinovanú
2. **Branded** — plný design s logom, claimom, badge, CTA → pre Meta feed a statické bannery

### Meta Stories/Reels safe zones

| Placement | Top          | Bottom       | Sides  |
|-----------|-------------|-------------|--------|
| Stories   | 250px (14%) | 340px (20%) | —      |
| Reels     | 14%         | 35%         | 6%     |

Logo a kľúčový text NESMÚ byť v týchto zónach.

### Presety pre CLI

```json
{
  "full_campaign_cz":  "21 formátov — kompletné CZ pokrytie (Google + Meta + Sklik + Web + Email)",
  "full_campaign_sk":  "15 formátov — kompletné SK pokrytie (bez Skliku)",
  "outlet_campaign":   "10 formátov — rýchly launch sale/outlet",
  "meta_only":         "4 formáty — iba Meta kampane",
  "sklik_top5":        "5 formátov — Sklik top podľa kliknutí",
  "web_only":          "10 formátov — web + email bez paid media",
  "minimum_viable":    "5 formátov — testovanie designu"
}
```

---

## 7. CAMPAIGN JSON — príklad

```json
{
  "campaign": "Royal Bay Outlet Jar 2026",
  "brand": "royalbay",
  "created": "2026-03-14",
  "author": "Karolína",

  "defaults": {
    "cta": "Nakúpiť teraz",
    "template": "landscape",
    "preset": "outlet_campaign"
  },

  "variants": [
    {
      "id": "outlet-01-trail",
      "image": "assets/photos/trail-runners-mountain.jpg",
      "claim": "SPOUŠTÍME OUTLET",
      "badge": "-30 %",
      "cta": "Objednať teraz"
    },
    {
      "id": "outlet-02-cycling",
      "image": "assets/photos/cyclist-forest.jpg",
      "claim": "JARNÍ VÝPRODEJ",
      "badge": "AŽ -40 %",
      "subheading": "Kompresní návleky a ponožky"
    }
  ]
}
```

---

## 8. VALIDÁTOR — pravidlá

Beží PRED renderom. Ak `"block"` → banner sa NEVYGENERUJE.

| Pravidlo               | Popis                                              | Severity |
|------------------------|------------------------------------------------------|----------|
| `logo_present`         | Logo musí byť v každom banneri                       | block    |
| `logo_min_size`        | Logo min. 80px šírka                                 | block    |
| `logo_not_modified`    | Logo neroztiahnuté, neotočené, neprefarbené          | block    |
| `claim_max_length`     | Claim max 50 znakov                                  | block    |
| `subheading_max_length`| Subheading max 80 znakov                             | warn     |
| `text_coverage`        | Text max 25% plochy                                  | warn     |
| `colors_from_palette`  | Farby z brand palety                                 | warn     |
| `fonts_from_brand`     | Klavika/Montserrat + BankGothic/Rajdhani             | block    |
| `file_size`            | Pod platformový limit po kompresii                   | block    |

---

## 9. RENDER ENGINE — Puppeteer flow

```
1. Načítaj brand/royalbay.json
2. Načítaj campaign JSON
3. Urči preset → zoznam size IDs
4. Pre každý variant × každý size:
   a. Vyber správny template HTML podľa templateVariant
   b. Merge brand + campaign premenné cez Handlebars
   c. Vyber logo variant podľa šírky banneru:
      - >= 800px → logo-full-ondark.png
      - 400-799px → logo-rb-ondark.png
      - < 400px → logo-rb-ondark.png
   d. Spusti validátor
   e. Ak BLOCK → skip, zapíš do reportu
   f. Ak OK/WARN → otvor HTML v Puppeteer
   g. Nastav viewport na presný rozmer (width × height)
   h. Screenshot → PNG
   i. Sharp kompresia:
      - Ak PNG > limit → konvertuj na JPG quality 85
      - Ak stále > limit → znižuj quality po 5 až kým neprejde
   j. Ulož do output/{campaign}/{variant}/{size}.{format}
5. Vygeneruj output/_manifest.json a _validation-report.json
```

---

## 10. CLI ROZHRANIE

```bash
# Generovanie s presetom
npm run generate -- --campaign campaigns/outlet-2026.json --preset outlet_campaign

# Generovanie konkrétneho variantu
npm run generate -- --campaign campaigns/outlet-2026.json --variant outlet-01-trail

# Generovanie konkrétnej veľkosti
npm run generate -- --campaign campaigns/outlet-2026.json --size 1080x1080

# Iba validácia
npm run validate -- --campaign campaigns/outlet-2026.json

# Preview v prehliadači
npm run preview -- --campaign campaigns/outlet-2026.json
```

---

## 11. CLAUDE.md — brand guardrails

Toto je zároveň obsah CLAUDE.md v roote projektu, čiže Claude Code ho automaticky číta pri každom tasku.

### IMMUTABLE RULES
- `brand/royalbay.json` je NEMENNÝ. Nikdy nemeň farby, fonty, logo pravidlá.
- Logo sa NIKDY nerozťahuje, neotáča, neprefarbuje. Vždy použi originálne PNG.
- Validátor beží VŽDY pred renderom. Ak neprejde s "block", banner sa nesmie vygenerovať.

### FARBY
- Primary turquoise: **#18AA9D** (Pantone 3272 C, CMYK 100,0,50,0)
- Čierna: #000000
- Biela: #FFFFFF
- Overlay: rgba(0,0,0,0.45)
- Žiadne iné farby.

### FONTY
- Primárny: **Klavika** (Regular 400, Bold 700). Fallback: Montserrat.
- Display: **BankGothic Md BT** (tracking -50, uppercase). Fallback: Rajdhani.
- Žiadne iné fonty.

### LOGO VARIANTY (PNG, transparent background)
- `logo-full-color.png` — chevron(tyrkys) + ROYAL BAY + tagline, tmavý text → na bielom pozadí
- `logo-full-ondark.png` — chevron(tyrkys) + ROYAL BAY + tagline, biely text → na foto/tmavom pozadí
- `logo-full-white.png` — celé biele → na tyrkysovom pozadí
- `logo-rb-color.png` — chevron(tyrkys) + RB, tmavý text → na bielom pozadí
- `logo-rb-ondark.png` — chevron(tyrkys) + RB, biely text → **DEFAULT pre performance bannery**
- `logo-rb-white.png` — celé biele → na tyrkysovom pozadí

### LAYOUT VZOR
- Text vždy vľavo, logo vždy top-right.
- Fotka full-bleed cover, športovec v dynamickom pohybe vpravo.
- Tmavý gradient overlay zľava pre čitateľnosť textu.
- Royal Bay kompresné produkty (ponožky, návleky) musia byť viditeľné na športovcovi.
- Badge (voliteľný) pod claimom — tyrkysový rounded rect s bielym textom.

### OUTPUT
- Všetky rozmery v px, žiadne relatívne jednotky.
- Template HTML self-contained, žiadne externé závislosti okrem fontov.
- Puppeteer viewport = presný rozmer banneru.
- File size limity: Google/Sklik max 150KB, Meta max 30MB, Web max 300KB, Email max 200KB.
- Každý output musí mať _manifest.json.

---

## 12. NÁVOD PRE TÍM

### Pre Karolínu, Jiřího, Štěpána, Adélu, Veroniku:

1. Skopíruj `campaigns/example-campaign.json` → `campaigns/moja-kampan.json`
2. Vyplň:
   - `campaign` — názov
   - `author` — tvoje meno
   - `preset` — vyber: `full_campaign_cz`, `full_campaign_sk`, `outlet_campaign`, `meta_only`, `web_only`
   - `variants` — pre každý variant:
     - `id` — unikátny (bez medzier, bez diakritiky)
     - `image` — cesta k fotke (nahraj do `assets/photos/`)
     - `claim` — hlavný text (**max 50 znakov!**)
     - `badge` — voliteľné ("-30 %", "NOVINKA")
     - `cta` — text tlačidla
3. `npm run validate -- --campaign campaigns/moja-kampan.json`
4. Oprav chyby
5. `npm run generate -- --campaign campaigns/moja-kampan.json`
6. Output v `output/moja-kampan/`

### Pravidlá:
- Claim max 50 znakov
- Fotka min. 1920px na dlhšej strane
- Športovec v DYNAMICKOM pohybe, Royal Bay produkt viditeľný
- Logo sa nepresúva — pozíciu určuje template
- Farby a fonty sa NEMENIA

---

## 13. ROZŠÍRENIA (backlog)

- [ ] AI claim generator — 5 variant claimov na základe produktu
- [ ] Auto-crop — inteligentný orez fotky podľa focal pointu pre rôzne formáty
- [ ] Brand switcher — podpora Enervit a VEDICI cez prepnutie brand.json
- [ ] Batch CSV import — hromadné generovanie z CSV
- [ ] A/B testing export — priamy upload do Meta Ads / Google Ads API
- [ ] Template builder UI — drag & drop editor
- [ ] CDN upload — automatický upload výstupov na cloud

---

## 14. SETUP

```bash
git clone https://github.com/vitar-sport/royalbay-ad-generator.git
cd royalbay-ad-generator
npm install
cp .env.example .env

# Logo PNG súbory sú už v assets/logos/
# Nahraj Klavika + BankGothic fonty do assets/fonts/ (alebo Montserrat + Rajdhani fallback)

npm run generate -- --campaign campaigns/example-campaign.json --preset minimum_viable
```

Požiadavky: Node.js 18+, Chromium (Puppeteer si stiahne automaticky).

---

## 15. PRVÝ KROK — Claude Code workflow

V Claude Code spusti:

```
Inicializuj projekt royalbay-ad-generator podľa CLAUDE.md:

1. npm init + nainštaluj dependencies (puppeteer, express, handlebars, sharp, commander)
2. Skopíruj CLAUDE.md do rootu
3. Vytvor brand/royalbay.json podľa sekcie 5
4. Logo PNG súbory sú už v assets/logos/
5. Vytvor templates/_base.html — spoločný HTML wrapper s CSS variables z brand configu
6. Vytvor prvý template: templates/landscape.html pre 1200×628
   - Full-bleed hero image
   - Tmavý gradient overlay zľava (rgba(0,0,0,0.45) → transparent)
   - Claim text vľavo (Montserrat Bold, uppercase, biely, max 2 riadky)
   - Badge pod claimom (tyrkysový #18AA9D rounded rect, biely text, voliteľný)
   - Logo top-right (logo-rb-ondark.png)
7. Vytvor campaigns/example-campaign.json s jedným test variantom
8. Vytvor engine/merge.js (Handlebars merge)
9. Vytvor engine/render.js (Puppeteer screenshot)
10. Vytvor engine/compress.js (Sharp, target < 150KB)
11. Vytvor validators/brand-validator.js
12. Otestuj: vygeneruj jeden 1200×628 banner do output/

Potom iteruj: template po template, size po size.
```
