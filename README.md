# Royal Bay Ad Generator

Automated banner generator for Royal Bay outlet campaigns. Generates all ad formats (Meta, Google Ads, Sklik, Web, Email) from a single campaign JSON + photo.

## Quick Start

```bash
git clone https://github.com/jurajgiacko/royalbay-ad-generator-cursor.git
cd royalbay-ad-generator-cursor
npm install
```

## Usage

### Generate a campaign

```bash
# All formats for a campaign
node generate.js -c campaigns/outlet-posledni-kusy.json -p full_campaign_cz

# Only CZ variant
node generate.js -c campaigns/outlet-posledni-kusy.json -p full_campaign_cz -v posledni-kusy-CZ

# Only SK variant (without Sklik sizes)
node generate.js -c campaigns/outlet-posledni-kusy.json -p full_campaign_sk -v posledni-kusy-SK

# Quick test with 5 sizes
node generate.js -c campaigns/outlet-posledni-kusy.json -p minimum_viable

# Specific size only
node generate.js -c campaigns/outlet-posledni-kusy.json -s 1080x1080
```

### Available presets

| Preset | Sizes | Description |
|--------|:-----:|-------------|
| `full_campaign_cz` | 24 | All formats including Sklik |
| `full_campaign_sk` | 18 | All formats minus Sklik (CZ-only platform) |
| `outlet_campaign` | 10 | Core sizes for quick launch |
| `meta_only` | 4 | Meta ads only |
| `web_only` | 6 | Web + email banners |
| `minimum_viable` | 5 | Design testing |

### Available campaigns

| Campaign | File | Description |
|----------|------|-------------|
| Poslední kusy | `campaigns/outlet-posledni-kusy.json` | Urgency messaging, trail runner pink |
| Doprodej | `campaigns/outlet-doprodej.json` | -30% direct messaging, trail runners mountain |
| Top Cena | `campaigns/outlet-top-cena.json` | Limitované množství, socks closeup |

## Creating a new campaign

1. Add your photo to `assets/photos/`
2. Create a campaign JSON in `campaigns/`:

```json
{
  "campaign": "Campaign Name",
  "brand": "royalbay",
  "created": "2026-03-14",
  "author": "Your Name",
  "defaults": {
    "template": "landscape",
    "preset": "full_campaign_cz",
    "discount": "-30"
  },
  "variants": [
    {
      "id": "variant-CZ",
      "image": "assets/photos/your-photo.png",
      "focalPoint": { "x": 0.5, "y": 0.3 },
      "claim": "YOUR CLAIM<br>HERE",
      "badge": "BADGE TEXT",
      "subheading": "Subheading text",
      "cta": "CTA button text"
    }
  ]
}
```

3. Run: `node generate.js -c campaigns/your-campaign.json -p full_campaign_cz`

### Focal point (optional)

Protects photo subject from cropping. Values 0-1 where the key subject is:

```json
"focalPoint": { "x": 0.5, "y": 0.3 }
```
- `x=0` left edge, `x=1` right edge
- `y=0` top edge, `y=1` bottom edge

### Subject bounds (optional)

Rectangle where the subject body occupies in the photo:

```json
"subjectBounds": { "top": 0.1, "bottom": 0.9, "left": 0.2, "right": 0.7 }
```

## Output

Banners are saved to `output/<campaign-name>/<variant-id>/` with:
- PNG for Google/Sklik (under 150KB limit)
- JPG q90 for larger sizes (web, email)
- `_manifest.json` with all generated files
- `_validation-report.json` with brand/layout checks

## Built-in validators

- **Brand validator** — claim length, image presence
- **Layout validator** — detects element overlap (logo vs discount vs text)
- **Photo validator** — warns about subject cropping and overlay coverage

## Generated formats

| Platform | Sizes |
|----------|-------|
| Meta Feed | 1200×628, 1080×1080, 1080×1350 |
| Meta Stories | 1080×1920 |
| Google Display | 300×250, 728×90, 320×100, 300×600, 160×600, 336×280 |
| Sklik (CZ only) | 300×300, 480×300, 480×480, 970×310, 970×210, 500×200 |
| Web e-shop | 1920×600, 1920×800, 750×750, 1200×400, 1200×300 |
| Email (Ecomail) | 1200×600, 1200×800, 600×200 |

## Requirements

- Node.js 18+
- npm
