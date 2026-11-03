# Oxide Design-System Adherence — Two-Pass Review Record

Methodology: **Polya's four-step framework** (Understand → Devise a plan → Carry
out → Look back), with the explicitly requested **second pass**: after the first
review, beliefs and priors are re-examined against evidence, revised, and only
then implemented. Every revision below is backed by a source opened during this
session (the uploaded Oxide landing page, the canonical
`@oxide/design-system@6.8.0` package, the Tremor 3.18.7 dist, WCAG math).

---

## Pass 1 — Initial review (priors formed)

Scope given: *"Review all the coloring and make sure we strictly adhere to the
Oxide Design System."*

### P1 findings — token drift (src/app/globals.css vs. ground truth)

| Token (ours) | Our value | Oxide ground truth | Delta |
| --- | --- | --- | --- |
| `--color-brand-green` | `oklch(0.8 0.15 162)` | green-800 `oklch(0.77 0.1919 163.7)` | L +0.03, C −0.042, hue −1.7° |
| `--color-brand-coral` | `oklch(0.66 0.19 25)` | red-800 `oklch(0.712 0.185 11.3)` | hue +13.7° |
| `--color-brand-amber` | `oklch(0.8 0.14 85)` | yellow-800 `oklch(0.837 0.14 75)` | hue +10° |
| `--color-brand-blue` | `oklch(0.68 0.13 255)` | blue-800 `oklch(0.71 0.15 272)` | hue −17° |
| `--color-surface-dim` | `oklch(0.155 0.008 240)` | neutral-0 `oklch(0.162 0.01 260)` | hue −20° |
| all surfaces / content / strokes | hue 240, invented L steps | 15-step neutral scale, hue 260 | every value off-scale |
| `--color-content-primary` | `oklch(0.93 0.006 240)` | content-default = neutral-800 `oklch(0.79 0.0011 260)` | text far too bright |

### P1 findings — behavioral rules violated (from the Oxide design doc)

1. **"Body text never recolors on hover"** — violated everywhere:
   `hover:text-brand-green` / `group-hover:text-brand-green` on nav links,
   article titles, footer links, info icons, secondary buttons.
2. **"No gradients anywhere except the modal scrim: flat fills only"** —
   hero uses a `radial-gradient` wash; `.flow-edge::after` animates a
   `linear-gradient`.
3. **Focus ring**: spec is a 2px ring in `outline-accent-secondary`, **offset 0**.
   Ours: `outline: 2px solid green; outline-offset: 2px`.
4. **Hierarchy through tier, not opacity** — scattered alphas
   (`/15`, `/25`, `/10`, `/[0.04]`, `/[0.06]`, `/22`, `/32`, `/45`) instead of
   Oxide's tuned `surface-accent` (accent-200) / `-secondary` (accent-400) tiers.
5. **Accent rationing** — accent used decoratively in ~30 places.
6. **Palette-foreign colors** — Tremor `emerald/sky/amber/rose/teal/gray` series
   and `bg-emerald-500` / `bg-teal-400` / `bg-gray-500` legend dots resolve to
   the Tailwind default palette, not Oxide scales.
7. **`font-semibold` (600)** used as default emphasis; Oxide ships 400/500 only,
   hierarchy from tone (`text-raise`) not weight.

---

## Pass 2 — Beliefs and priors updated, then revised

Each prior from Pass 1 was re-examined against primary evidence. Priors that
survived are marked ✅; revisions explain what changed.

### Revision 1 — "Fix the token values in place" → **"Adopt the canonical package"** ✅➕

Installing `@oxide/design-system@6.8.0` revealed the full canonical system:
a 15-step neutral scale and 12-step hue scales in `styles/main.css`, semantic
role resolution in `styles/dark.css`, themeable accents via `--theme-accent-*`,
type (`text-mono-*`, `text-sans-*`, `heading-*`) and elevation (`shadow-*`)
utilities. **Decision**: depend on the package and `@import` its styles — zero
hand-maintained color values remain in this repo. Our globals.css becomes a thin
bridge: semantic color utilities for Tailwind's namespace, Tremor palette
aliases, and font overrides. Package updates now flow through `bun`.

### Revision 2 — "surface-base = n100, surface-raised = n200" → package semantics

The uploaded marketing HTML suggested raise=n100, hover=n200. The canonical
`dark.css` resolves **`surface-raise` = neutral-50 (0.195)**,
`surface-secondary` = neutral-100 (0.216), `surface-hover` = neutral-200,
`surface-tertiary` = neutral-300, and content tiers
raise=n900 / default=n800 / secondary=n700 / tertiary=n600 / quaternary=n500.
**Decision**: map our classes onto the package's roles, not the marketing HTML
(`bg-surface-raise` for cards, `bg-surface-secondary` for inset wells/inputs,
`bg-surface-hover` for hover fills, popovers get `bg-surface-raise` +
`shadow-menu`).

### Revision 3 — "themeColor should be #0b0f11 (from the uploaded HTML)" → **keep #0b0e12** ❌➡✅

`sRGB(oklch(0.162 0.01 260))` computes to exactly `#0b0e12`
(scripts/color-math.py). The current `layout.tsx` value already matches
neutral-0; the uploaded page's `#0b0f11` is a different (non-canonical) surface.
No change.

### Revision 4 — "Strict adherence is only about color values" → **behavior + vocabulary**

Also enforced: hover = surface step (never text recolor); focus ring offset-0
in `stroke-accent-secondary`; flat fills (hero wash deleted, flow edge becomes a
solid accent dash — `linear` motion for constant movement per the motion rules);
opacity fakes replaced by Oxide tier roles (`bg-surface-accent` for selected
tab/washes, `border-stroke-accent-*` quaternary/tertiary/secondary for the old
`border-brand-green/NN`); `font-semibold` → `font-medium` (500) with heading
emphasis via `text-content-raise`; chart area gradients off
(`showGradient={false}`).

### Revision 5 — "Tremor colors are fine as-is" → **alias layer with measured shades**

Tremor's `lib/theme.js` (`colorPalette`) and dist grep show exactly which shades
are emitted: background 500/600, iconText 600/700, iconRing 500, chart
stroke/fill 400/500. Oxide's `tailwind.css` runs `--color-*: initial`, which
clears the default palette — so we alias **only the used names/shades** onto
`--theme-*` vars (emerald→accent, rose→error, amber→notice, sky→info,
teal→accent-600/700 tonal step, gray/red→neutral/error steps). Additionally:
Tremor 3.x uses Tailwind v3 `bg-opacity-*` utilities that no longer exist in
v4 — tinted badges would render at full opacity — so badge tints are passed
explicitly (`bg-content-accent/10`, v4 color-mix form).

### Revision 6 — "Articles live in dialogs; SEO pointing at /journal/<slug> is aspirational" → **real pages**

`seo.ts` already emits BlogPosting JSON-LD at `/journal/<slug>` and the sitemap
ships `/#journal/<slug>` fragments (never indexable). **Decision**: build the
real `/journal` index + `/journal/[slug]` article pages (the user's request)
with per-page metadata, canonical URLs, BlogPosting + BreadcrumbList + FAQPage
JSON-LD, own charts/comparison components, and markdown/txt sources. Sitemap
gains real URLs. Dialog usage stays showcased in the order-flow summary.

### Revision 7 — "Markdown sources are hand-written duplicates" → **generated from the typed source of truth**

Dual-maintained prose drifts. The generator (`scripts/generate-content-sources.mts`,
run by Bun which imports TS directly) serializes the same modules the UI renders
(`blog-content.ts`, `site-content.ts`, `analysis-data.ts`) into
`sources/home.md`, `sources/analysis/<slug>.md`, `llms.txt`, `llms-full.txt`.
Artifact verifier updated: `.md` debris stays forbidden everywhere **except** the
allowlisted `sources/` tree; docs budget added.

### Revision 8 — "CI is corrupted (`branches: ain]`)" → **it never was — verify bytes, not rendered text**

Tool output rendered the workflow trigger as `branches: ain]` on every read.
An octal dump proved the files contain the correct `branches: [main]` — the
`[m` was being swallowed as an ANSI-reset artifact by the output renderer.
Method lesson recorded: byte-level verification (`od -c`) before believing a
displayed value. No change required.

### Revision 9 — "10 KB runtime budget from the original spec" → **session-3 budgets govern**

The build pivoted to Next 16 static export with calibrated gzip budgets
(docs/DEPLOYMENT.md). Article pages must fit `htmlSingleGzip ≤ 40 KB`; a new
`docsTotalGzip` ceiling covers the markdown sources; total budget recalibrated
after measurement with a documented reason.

### Revision 10 — "Persona toggle should rewrite article copy" → **journal is persona-neutral**

Research pages address a risk/verification audience by definition; the
Institutional/Retail switch remains a home-page surface. Nav links become
route-aware (`/#stability`, `/#build`, `/journal`) so they work from article
pages.

---

## Phase III — Final architecture (carried out)

```
globals.css
├─ @import "tailwindcss" / "tw-animate-css"
├─ @import @oxide/design-system/styles/{tailwind,main,dark}.css   ← canonical scales, roles, type, shadows
├─ FAME bridge @theme inline
│   ├─ --color-content-*     → text roles   (raise/default/secondary/tertiary/quaternary/accent/…)
│   ├─ --color-surface-*     → bg roles     (default/raise/hover/secondary/tertiary/accent/…-inverse/scrim)
│   └─ --color-stroke-*      → 1px roles    (default/raise/secondary/tertiary/accent/…)
├─ Tremor alias @theme        → emerald/rose/amber/sky/teal/gray/red → --theme-* steps
├─ font override              → Inter / JetBrains Mono via next/font vars
└─ base + components          → focus ring, cv-auto, flow-edge (solid), keyframes on tokens
```

WCAG 2.1 results for the adopted scale (scripts/color-math.py):
content-default on bg-default **9.97:1 AAA** · content-secondary **6.69:1 AA** ·
content-accent (green-800) on bg-default **10.35:1 AAA** · accent fill with
inverse text **10.35:1 AAA** · error **6.94:1 AA** · notice **11.47:1 AAA** ·
info **7.30:1 AAA** · content-tertiary 3.22:1 (AA-large — reserved for
non-essential metadata per the design doc).

## Phase IV — Look back

Verified by: `bun run lint && bun run typecheck && bun run build &&
node scripts/verify-artifacts.mjs && node scripts/smoke.mjs`, plus a rendered
screenshot pass of every page (desktop + mobile). Results are recorded at the
bottom of this file as they land.

## Phase IV — Results (measured)

- Gates: lint ✓ · typecheck ✓ · build:pages ✓ · verify-artifacts ✓ (88 files,
  953.9 KB gz: js 422 KB ≤ 550 · css 17 KB ≤ 40 · docs 17 KB ≤ 80 · total
  976 KB ≤ 1.4 MB) · smoke ✓ (85 assertions, Pages-mounted routing).
- Rendered pass: home (hero/blotter/order flow), journal index, both analysis
  pages, mobile 390px — surfaces on the neutral-260 scale, accent rationed to
  primary actions, hover = surface steps, focus rings offset-0 accent
  secondary, flat fills everywhere, chart series resolve through the alias
  layer (emerald→green-800, rose→red-800, amber→yellow-800, sky→blue-800).
- Incidents found and fixed during the look-back:
  1. **Tremor dynamic color classes** — `stroke-${color}-${shade}` is invisible
     to the scanner, so chart series rendered colorless. Fixed with
     `@source inline()` safelists covering exactly the shades Tremor's
     colorPalette emits.
  2. **`out/journal/` directory shadowed `journal.html`** in the Pages-routing
     dev server — added the sibling-`.html` fallback to scripts/serve.mjs.
  3. **Plain `<a href="/llms.txt">` bypassed basePath** — wrapped every
     machine-source link in `withBasePath()`.
  4. **y-axis clipping** on ratio charts — yAxisWidth 44→56 plus
     `autoMinValue` so the floor/breaker band reads correctly.
