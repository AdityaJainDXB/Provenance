# Provenance

**A gallery of verified makers.** A curated, gallery-like marketplace for authentic,
handmade cultural artisan goods — built as a deliberate answer to the "counterfeit
culture" imitations that flood the market and undercut real artisans.

Every product is tied to a verified artisan and their story. Established and new
makers are both given fair visibility by design.

🔗 **Live site:** https://adityajaindxb.github.io/Provenance/

---

## What's in here

A hand-built static frontend — no framework, no build step. Plain HTML, one
stylesheet, self-contained SVG artwork (no external images, no tracking) — plus an
**optional Supabase backend** for the authenticated video platform (see below).

| Page | File | Purpose |
|---|---|---|
| Home | `index.html` | Rotating curated exhibit (no infinite scroll) + a separate *Newly Discovered Artisans* rotation |
| Gallery | `gallery.html` | Every piece on offer, **paginated** six to a page, filterable by craft |
| Product | `product.html` | Large imagery, a maker's card, quiet verification markers, *"Acquire this piece"* |
| Artisan | `artisan.html` | An editorial feature — story, process film, process stills. No follower or like counts |
| **AURA Studios** | `studios.html` | A **full-screen vertical feed** (Reels-style) of 15–60s process films. Ambient audio only, floating glass product card with *Acquire Piece*, and **zero vanity metrics**. Bounded, not infinite. *Unchanged.* |
| Verification | `verification.html` | The three markers, the recommendation ceiling (500 daily sales **or** 50 high-rated feed allocations), the new-artisan rotation + 1,000-impression guarantee, the private 10-star evaluation |
| Formats | `formats.html` | The three selling formats — video-backed static listing, short-form process clip, live studio broadcast — all in the same calm frame |
| About | `about.html` | The anti-counterfeit-culture mission and the platform's commitments |
| **Sign in** | `auth.html` | One door for everyone — *Continue with Apple* / *Continue with Google*, plus an *"I have studio access"* panel (Google + access code) for makers and curators |
| **Onboarding** | `onboarding.html` | A three-step taste quiz — crafts, look, regions, pace, price ceiling — that seeds the feed algorithm. Skippable |
| **Shorts** | `feed.html` | The new **infinite, algorithmically ranked** vertical video feed of admin-uploaded maker films. Shorts-style action rail (appreciate / save / share / sound), kept in the muted Provenance palette |
| **Studio** | `admin.html` | Admin-only panel: drag-and-drop video upload with auto-captured poster, style tagging, publish / unpublish / remove, and per-film view / appreciation / save counts |

### Shorts vs AURA Studios

They're deliberately different surfaces. **AURA Studios** (`studios.html`) is
untouched — bounded, no metrics, sample content. **Shorts** (`feed.html`) is the
new admin-driven product: real uploaded video, a true infinite feed, a ranking
algorithm built around each viewer's stated interests, and a Shorts-style
engagement rail. Both are linked from the nav.

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

## The video platform (accounts, Studio, Shorts)

This is layered on so the site works **with or without a server**.

### Demo mode — the default, zero setup

Leave `assets/js/config.js` blank and everything runs in the browser:

- **Auth is simulated.** *Continue with Apple / Google* creates a local guest
  session. New collectors go to `onboarding.html`, then `feed.html`.
- **Studio access:** open *"I have studio access"*, continue as studio, and enter
  the demo code — **`PROVENANCE-STUDIO`** (set in `config.js`). You land on
  `admin.html`.
- **Uploads are real, but local.** A published clip is stored as a Blob in this
  browser's IndexedDB (metadata in `localStorage`) and plays back in `feed.html`
  on the same device. The auto-captured first-frame poster is used as the
  thumbnail.
- **The ranking algorithm is real.** `assets/js/rank.js` scores every clip
  against your quiz answers — style-tag match (Jaccard) is the dominant signal,
  then engagement, freshness, a new-maker visibility boost, and a little
  exploration jitter; clips you've finished sink so the feed keeps moving.
- Seed sample films appear in the feed before you upload anything, so it's never
  empty. They're marked *"Sample film"* and can be removed from the Studio.

### Live mode — real OAuth + cloud storage

Fill in two values in `assets/js/config.js` (`SUPABASE_URL`,
`SUPABASE_ANON_KEY`) and the same UI switches to **Supabase**: real Apple/Google
sign-in, video in Supabase Storage, Postgres for metadata and engagement, Row
Level Security for the admin/consumer split, and two Edge Functions —
`redeem-admin-code` (verifies the studio code, promotes the user) and `rank-feed`
(the server-side twin of `rank.js`). No other frontend file changes.

**Full walkthrough: [`supabase/README.md`](./supabase/README.md)** — project
creation, `schema.sql`, storage buckets, Google & Apple provider setup, the
hashed access code, and function deployment.

#### Why Supabase

It's the one platform that covers all four needs — **auth with Apple + Google
built in, file storage, a relational database for a ranking query, and
serverless functions** — on a free tier, from a single dashboard, while the
frontend stays static on GitHub Pages. Firebase can do it but Apple sign-in and
video are fiddlier and a ranked feed is easier in SQL; a custom Node + S3 +
Postgres stack is more control and much more to run.

### Architecture at a glance

```
GitHub Pages (static)                         Supabase (live mode only)
  auth.html ─┐                                  Auth ── Google / Apple OAuth
  onboarding.html                               Postgres
  feed.html ── assets/js/backend.js ──┬── live ─→  profiles / style_preferences
  admin.html                          │           videos / video_events
                                      │           video_stats (view)
                                      └── demo ─→ localStorage + IndexedDB
  assets/js/rank.js  ── mirrors ──  supabase/functions/rank-feed
                                     supabase/functions/redeem-admin-code
                                     Storage buckets: videos / posters
```

### New/changed frontend files

`config.js` · `backend.js` (dual-mode data layer) · `idb-store.js` (demo blob
store) · `rank.js` · `auth.js` · `onboarding.js` · `feed.js` · `admin.js`.
`main.js` gained the nav account pill and the *Shorts* link; every standard page
now loads `config.js` + `backend.js`.

## Running locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Demo mode works fully offline. For live mode locally, add
`http://localhost:8000/auth.html` to the Supabase redirect URLs.

## Deployment

Pushed to GitHub Pages. The included workflow (`.github/workflows/pages.yml`) builds
and deploys the repository root on every push to `main`. `.nojekyll` is present so all
files are served as-is.

## Artwork

The illustrations in `assets/img/` are procedurally generated SVGs (see
`gen_svgs.py` in the commit history if regeneration is ever needed). They stand in for
photography and keep the site fully self-contained and offline-capable.
