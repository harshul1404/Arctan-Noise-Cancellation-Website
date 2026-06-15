# Duna.com — Design System Reference

A reverse-engineered design specification of [duna.com](https://duna.com), captured for building visually faithful marketing pages. Duna is **Made in Framer**, so every asset lives on the `framerusercontent.com` CDN and the visual language follows Framer's typographic + spacing conventions.

---

## 1. Brand Identity

| Aspect | Value |
| --- | --- |
| Product category | Voice intelligence / financial-ops platform |
| Visual tone | Premium, editorial, high-contrast, "quiet luxury" tech |
| Personality | Confident, minimal, warm-neutral with a single electric accent |
| Signature move | Warm near-black hero + cream body + one acid-lime CTA color |

The identity rests on a **two-temperature neutral palette** (warm dark + warm cream) punctuated by a single saturated lime-green. Nothing competes with the lime — it is reserved almost exclusively for primary CTAs and micro-accents.

---

## 2. Color System

### Core tokens

| Token | Value | RGB | Usage |
| --- | --- | --- | --- |
| `heroBg` | `#160F0C` | `rgb(22,15,12)` | Dark hero, footers, dark feature sections |
| `cream` | `#EDECE7` | `rgb(237,236,231)` | Primary light section background |
| `white` | `#FFFFFF` | — | Cards, alternating sections |
| `darkCard` | `#1A1210` | — | Slightly raised cards on dark bg |
| `ink` | `rgb(27,6,36)` | `#1B0624` | Primary text (dark purple-black) |
| `inkSub` | `rgba(27,6,36,0.6)` | — | Secondary/body text |
| `muted` | `rgb(137,134,131)` | `#898683` | Eyebrows, captions, meta |
| `bodyText` | `rgb(41,36,33)` | `#292421` | Long-form body copy |
| `lime` | `#AEEC1D` | — | **Signature CTA / accent** |
| `teal` | `rgb(70,131,140)` | `#46838C` | Secondary accent, eyebrow labels |
| `tealBg` | `rgba(70,131,140,0.15)` | — | Teal accent fills |

### Borders & dividers

| Token | Value | Context |
| --- | --- | --- |
| `border` | `rgba(27,6,36,0.1)` | Hairlines on light backgrounds |
| `borderW` | `rgba(255,255,255,0.12)` | Hairlines on dark backgrounds |

### Usage rules

- **One accent at a time.** Lime appears on primary CTAs, a single stat card, and small tokens (NEW badge, bullets). Never two lime elements fighting in one viewport.
- **Text is never pure black.** Primary text is `rgb(27,6,36)` — a desaturated purple-black that reads softer than `#000`.
- **Backgrounds alternate** white ↔ cream ↔ dark to create rhythm between sections.
- On dark sections, text steps down in opacity: `white` → `rgba(255,255,255,0.85)` (subhead) → `rgba(255,255,255,0.6)` (body) → `rgba(255,255,255,0.45)` (meta).

---

## 3. Typography

### Font families

| Role | Font | Source |
| --- | --- | --- |
| Primary | **Inter** | Google Fonts — weights 400, 500, 600, 700, 800 |
| Monospace / labels | **Fragment Mono** | Google Fonts — regular + italic |

```
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fragment+Mono:ital@0;1&display=swap');
```

Fragment Mono is used **only** for eyebrow labels, badges (`NEW`), code, metrics units, and small technical accents — never for body or headings.

### Type scale

| Element | Size | Weight | Letter-spacing | Line-height |
| --- | --- | --- | --- | --- |
| Hero H1 | `clamp(44px, 6.5vw, 80px)` | 700 | `-0.03em` | 1.1 |
| Section H2 | 48px | 700 | `-0.03em` | 1.15 |
| Feature H2 | 40px | 700 | `-0.03em` | 1.15 |
| Big stat number | 56px | 700 | `-0.04em` | 1.0 |
| Card H3 | 17px | 600 | `-0.02em` | 1.4 |
| Lead/subtitle | 18px | 400 | — | 1.65 |
| Body | 14–16px | 400 | — | 1.6–1.75 |
| Eyebrow label | 11–14px | 500–600 | `0.04–0.06em` | — `UPPERCASE` |
| Badge (mono) | 12px | — | `0.02em` | — |

### Typographic principles

- **Tight negative tracking on headings** (`-0.03em` to `-0.04em`) is the single biggest "Duna feel" signal. Large type always pulls letters together.
- **Generous line-height on body** (1.65–1.75) keeps long copy airy.
- **Eyebrows are uppercase, tracked-out, muted or teal**, often in Fragment Mono.
- Headlines frequently break with explicit `<br/>` into 2 balanced lines.

---

## 4. Spacing & Layout

| Token | Value |
| --- | --- |
| Content max-width | `1100px` (sections), `1200px` (nav) |
| Section padding (vertical) | `100px` standard, `80px` compact |
| Section padding (horizontal) | `40px` |
| Nav height | `64px` (fixed) |
| Card padding | `36–44px` |
| Grid gap (features) | `80px` (2-col), `40px` (3-col stats), `24px` (cards) |

### Layout patterns

- **Centered hero**, everything else is a `maxWidth: 1100` centered column.
- **Alternating 2-column feature rows** — image left/right, copy on the other side, swapping each section.
- **3-column stat/feature grids** with a top border; the first column gets a 2px lime top border, the rest a 1px hairline.
- **Bento-style testimonial grid** — one tall card spanning 2 rows + stacked stat cards beside it.

---

## 5. Components

### Buttons

| Variant | Style |
| --- | --- |
| Primary | `background: #AEEC1D`, `color: ink`, `borderRadius: 99`, `padding: 13px 28px`, `fontWeight: 600` |
| Secondary (dark) | `background: rgba(255,255,255,0.08)`, `1px` white-12% border, white text |
| Dark pill | `background: ink`, white text — used for inline "Explore →" links |

All buttons are **fully rounded** (`borderRadius: 99`). Arrows (`→`) are common trailing affordances.

### Nav

- Fixed, transparent over the dark hero, transitioning to `rgba(255,255,255,0.96)` + `blur(20px)` + hairline on scroll.
- Logo (28px rounded square) + wordmark left, link cluster center, Log-in + primary pill right.
- Link color shifts from `rgba(255,255,255,0.78)` (over hero) to `inkSub` (scrolled).
- **Hydration note:** scroll-dependent nav styling must be gated behind a `mounted` flag so server and first client render match.

### Cards

- `borderRadius: 16–20px`, `1px` hairline border, white or cream fill.
- Image cards clip with `overflow: hidden`.
- Dark stat cards (`heroBg`) and a single lime stat card create accent rhythm in the bento grid.

### Badges & pills

- Announcement pill: rounded, `rgba(255,255,255,0.06)` fill, Fragment-Mono `NEW` in lime + text + `→`.
- Compliance/feature chips: `cream` fill, hairline border, `borderRadius: 99`, 13px medium text.

### Eyebrow labels

`Fragment Mono`, 11px, teal or muted, `letterSpacing: 0.06em`, `UPPERCASE` — sits above every section H2.

---

## 6. Imagery

- **All assets on `framerusercontent.com`** — publicly accessible (HTTP 200), usable directly in `<img>` tags.
- Hero uses a wide **painterly landscape illustration** (warm, atmospheric) rather than a UI screenshot — distinctive choice.
- Feature images are product UI screenshots / webp, clipped into rounded cards.
- Partner logos rendered as **72px rounded squares**, desaturated + `opacity 0.55`, in a centered strip on cream.
- People/testimonial photos: rounded avatars (48px) + larger landscape crop in the tall bento card.

---

## 7. Motion & Interaction

- Subtle and restrained — Duna avoids heavy animation.
- Nav transition: `all 0.25s ease`.
- Hover: opacity/transform shifts (`transition: 0.15s`), image `transform: scale` on news cards.
- `scroll-behavior: smooth` globally.
- Where richer motion is added (e.g. our Arctan build): bar visualizers, scroll-triggered bar charts via `IntersectionObserver`, and glow pulses — all easing on `cubic-bezier(0.4,0,0.2,1)`.

---

## 8. Section Architecture (page order)

1. **Nav** — fixed, transparent → blur on scroll
2. **Hero** — dark, centered, announcement pill + H1 + subtitle + dual CTA + large image bleeding off bottom
3. **Logo strip** — cream, "trusted by" + grayscale logos
4. **Stats** — white, 3-col metric grid with lime top accent
5. **Feature rows** — alternating white/cream, 2-col image + copy (×4)
6. **Benchmarks / data** — dark, table or animated bar chart
7. **Architecture / pipeline** — visual flow diagram
8. **Testimonial bento** — cream, tall quote card + stat cards
9. **Dark capability grid** — heroBg, icon cards
10. **CTA / contact** — dark, headline + form or button pair
11. **Footer** — heroBg, 4-col link grid + legal row

---

## 9. Implementation Notes

- Built as a single `'use client'` React/Next.js component using **inline style objects** (matches Framer's atomic styling; no Tailwind needed for fidelity).
- Use a central `D` design-token object and an `IMG` asset registry (both defined once at module top).
- TypeScript: cast string-literal style values (`textTransform`, `flexWrap`, etc.) with `as const`.
- Avoid duplicate keys in inline style objects (TS will error).
- Gate any `window.scrollY`-derived styling behind a `mounted` boolean to prevent hydration mismatch.

---

## 10. Quick-Start Token Block

```ts
const D = {
  heroBg:   '#160F0C',
  cream:    '#EDECE7',
  white:    '#FFFFFF',
  darkCard: '#1A1210',
  ink:      'rgb(27,6,36)',
  inkSub:   'rgba(27,6,36,0.6)',
  muted:    'rgb(137,134,131)',
  bodyText: 'rgb(41,36,33)',
  lime:     '#AEEC1D',
  teal:     'rgb(70,131,140)',
  tealBg:   'rgba(70,131,140,0.15)',
  border:   'rgba(27,6,36,0.1)',
  borderW:  'rgba(255,255,255,0.12)',
}
```

```css
/* Fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Fragment+Mono:ital@0;1&display=swap');
/* Headings: Inter 700, letter-spacing -0.03em */
/* Eyebrows/badges/code: Fragment Mono, uppercase, +0.06em */
```
