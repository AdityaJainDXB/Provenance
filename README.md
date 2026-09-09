# Provenance

**A gallery of verified makers.** A curated, gallery-like marketplace for authentic,
handmade cultural artisan goods — built as a deliberate answer to the "counterfeit
culture" imitations that flood the market and undercut real artisans.

Every product is tied to a verified artisan and their story. Established and new
makers are both given fair visibility by design.

🔗 **Live site:** https://adityajaindxb.github.io/provenance/

---

## What's in here

A hand-built static site — no framework, no build step. Plain HTML, one stylesheet,
one small script, and self-contained SVG artwork (no external images, no tracking).

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Rotating curated exhibit (no infinite scroll) + a separate *Newly Discovered Artisans* rotation |
| Gallery | `gallery.html` | Every piece on offer, **paginated** six to a page, filterable by craft |
| Product | `product.html` | Large imagery, a maker's card, quiet verification markers, *"Acquire this piece"* |
| Artisan | `artisan.html` | An editorial feature — story, process film, process stills. No follower or like counts |
| **AURA Studios** | `studios.html` | A **full-screen vertical feed** (Reels-style) of 15–60s process films. Ambient audio only, floating glass product card with *Acquire Piece*, and **zero vanity metrics** — no views, likes, comments or followers. Bounded, not infinite |
| Verification | `verification.html` | The three markers, the recommendation ceiling (500 daily sales **or** 50 high-rated feed allocations), the new-artisan rotation + 1,000-impression guarantee, the private 10-star evaluation |
| Formats | `formats.html` | The three selling formats — video-backed static listing, short-form process clip (AURA Studios), live studio broadcast — all in the same calm frame |
| About | `about.html` | The anti-counterfeit-culture mission and the platform's commitments |

## Design direction

- Muted, natural palette — earth tones and neutrals, no saturated "app" colour
- Display serif (**Fraunces**) over a system sans for body and UI
- Generous whitespace, large imagery, strong typographic hierarchy
- Slow, deliberate browsing: **pagination over infinite scroll**
- Apple Human Interface Guidelines influence — clarity, deference to content, depth;
  purposeful motion that fully respects `prefers-reduced-motion`; visible focus states;
  semantic HTML and labelled controls
- Light and dark themes via `prefers-color-scheme`

## Key mechanics reflected in the interface

- **Verification markers** — *process video verified*, *cooperative endorsed*,
  *region of origin verified* — rendered as small, quiet discs, never a loud stamp.
- **Recommendation logic** — driven by completed purchases + private 10-star
  craftsmanship scores, never views or engagement. Vertical-feed rotation pauses at
  **500 daily sales or 50 high-rated feed allocations**, whichever comes first; low-scored
  pieces are suppressed from the feed regardless of views. Once capped, other artisans are
  surfaced. Shown as a meter on the Verification page.
- **New-maker window** — new artisans sit in a separate rotation *and* get a guaranteed
  baseline of **1,000 AURA Studios feed impressions** on onboarding, before the algorithm
  has any rating to weigh them on.
- **Ratings** — a single private **10-star** post-delivery score across material quality,
  cultural authenticity and craft execution. No public average, counter or review wall
  anywhere in the UI.
- **AURA Studios feed** — vertical, full-screen, scroll-snapped process films. Calm audio
  default, no music/voiceover/fast-cuts, no vanity metrics. Floating translucent product
  card with name, region, process badge, price and an *Acquire Piece* CTA on the overlay.

## Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deployment

Pushed to GitHub Pages. The included workflow (`.github/workflows/pages.yml`) builds
and deploys the repository root on every push to `main`. `.nojekyll` is present so all
files are served as-is.

## Artwork

The illustrations in `assets/img/` are procedurally generated SVGs (see
`gen_svgs.py` in the commit history if regeneration is ever needed). They stand in for
photography and keep the site fully self-contained and offline-capable.
