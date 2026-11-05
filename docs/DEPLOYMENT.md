# Deployment Record — GitHub Pages & Cloudflare Pages

This document is the problem-solving record for the FAME Protocol deployment
work, structured explicitly along **Polya's four-step framework**. It doubles as
the runbook: if a future change breaks a gate, start at phase IV.

---

## Phase I — Understand the problem

**Goal.** Take the existing Next.js 16 landing page and ship it to two static
hosts — GitHub Pages (project site) and Cloudflare Pages — with verifiable
quality: smoke tests and compiled-artifact verification must run *before* any
deployment, and the codebase had to be cleaned first.

**Constraints discovered during the audit.**

| # | Finding | Consequence |
| --- | --- | --- |
| 1 | `next.config.ts` used `output: "standalone"` (server deployment) | Static hosts need `output: "export"` |
| 2 | `SITE.url` was the placeholder `https://fame-protocol.example` | Canonical/OG/sitemap would ship wrong URLs |
| 3 | GitHub Pages project sites serve under `/<repo>/` | Needs `basePath` + base-path-aware asset URLs |
| 4 | GitHub Pages runs Jekyll by default | `_next/` (underscore dirs) would be invisible → `.nojekyll` required |
| 5 | Cloudflare Pages reads `_headers` / `_redirects` from the artifact root | CSP, HSTS, cache rules shipped as files |
| 6 | Scaffold debris: `examples/`, `tests/`, `tool-results/`, `scripts/spike*`, oxide CSS probes, `src/app/api` (hello-world route), `src/lib/db.ts`, `prisma/`, `db/`, stale `download/fame-protocol/` snapshot | Cleanup required; the API route would also break `output: "export"` |
| 7 | `robots.ts` / `sitemap.ts` lacked `dynamic = "force-static"` | Build fails under export mode (Next 16 requirement) |
| 8 | The sandbox auto-runs `next dev`, which owns `.next/` | Static builds must use a separate `distDir` to avoid clobbering the dev server |
| 9 | Metadata icon hrefs are **not** basePath-prefixed by Next; link rewrites produce `<base>#hash` forms | Needs `withBasePath` on the icon + a verifier that accepts the real rewrite forms |
| 10 | Tremor/recharts tree produces a ~168 KB gz chart chunk | Budgets must be calibrated from measured reality, not wishful numbers |

## Phase II — Devise a plan

1. **Architecture**: single build system (`STATIC_EXPORT=1 next build`) emits a
   pure static `out/`; host differences resolved at build time via env vars —
   `NEXT_PUBLIC_BASE_PATH` (Pages: `/<repo>`; Cloudflare: unset) and
   `NEXT_PUBLIC_SITE_URL` (canonical origin per host).
2. **Canonical origin**: `src/lib/seo.ts` defaults to the real GitHub Pages
   URL (`https://fairmeme3.github.io/fame-program`, derived from the repo
   recorded in `SITE.repo`); Cloudflare workflow overrides it to
   `https://fame-protocol.pages.dev`.
3. **Artifact dir**: normalize the export to `out/` in the build script
   (Next 16 writes the export into its `distDir`; the build script moves it and
   strips `*.map` files).
4. **Host parity in tests**: `scripts/serve.mjs` replicates Pages asset routing
   (directory pretty-URLs, `.html` fallback, branded 404, no listings) and can
   mount the artifact under a subpath to simulate GH Pages before shipping.
5. **Gates pipeline** (identical in CI and both deploy workflows):
   `install → lint → typecheck → build → verify-artifacts → smoke → deploy →
   post-deploy smoke (live URL, with retries while the CDN warms)`.
6. **Budget policy**: gzip ceilings calibrated from the 1.0.0 build with
   ~25–30% headroom; regressions fail the pipeline, deliberate raises require a
   documented reason here.
7. **Cleanup**: delete everything not needed by the landing page; keep
   shadcn/ui primitives (they are the component library) and the uploaded Oxide
   reference.

## Phase III — Carry out the plan

**Cleanup (done).** Removed: `examples/`, `tests/`, `tool-results/`,
`scripts/spike/`, `scripts/oxide-*.css`, `scripts/probe-flow.mjs`,
`src/app/api/`, `src/lib/db.ts`, `prisma/`, `db/`, `mini-services/`,
`download/fame-protocol/` (stale snapshot); design screenshots archived to
`docs/screenshots/`. Lint scope extended to `scripts/**` in both ESLint and
Biome so the new tooling meets the same strict bar.

**Build reconfiguration (done).**
- `next.config.ts`: env-gated `output: "export"` + `distDir: ".next-export"` +
  `basePath`; `images.unoptimized`; `typescript.ignoreBuildErrors: false`.
- `src/lib/seo.ts`: env-driven `SITE.url`, `withBasePath()` helper applied to
  OG image and (in `layout.tsx`) the favicon icon.
- `robots.ts` / `sitemap.ts`: `export const dynamic = "force-static"`.
- `src/app/not-found.tsx`: branded 404 (exports as `404.html`).
- `public/`: `.nojekyll`, `_headers` (CSP, HSTS, nosniff, COOP, immutable
  cache for `/_next/static/*`), `_redirects` (anchor aliases).

**Verification tooling (done).**
- `scripts/serve.mjs` — Pages-routing static server (also powers `bun run start`).
- `scripts/verify-artifacts.mjs` — ~70 checks: required files, forbidden files,
  gzip budgets, JSON-LD graph, OG/Twitter tags, canonical, basePath scope of
  every `src`/`href`, `_headers`/`_redirects` content, PNG/SVG integrity,
  robots/sitemap correctness, `build-manifest.json` (SHA-256 per file).
- `scripts/smoke.mjs` — 38 HTTP assertions: page + all referenced assets 200,
  JSON-LD types, sitemap URLs resolve, branded 404 with HTTP 404, traversal
  rejected, no directory listings, no localhost/http:// leaks, canonical match;
  runs locally or against a live deployment (`--url`, retries).

**Pipelines (done).** `.github/workflows/ci.yml` (PR/main gates),
`deploy-pages.yml` (gates → deploy → post-deploy smoke),
`deploy-cloudflare.yml` (gates → wrangler → post-deploy smoke),
`wrangler.jsonc`.

## Phase IV — Look back (verification & fixes)

Every gate was executed locally in **both deployment variants**.

**GitHub Pages variant** (`NEXT_PUBLIC_BASE_PATH=/fame-program`,
`NEXT_PUBLIC_SITE_URL=https://fairmeme3.github.io/fame-program`):

| Gate | Result |
| --- | --- |
| ESLint + Biome (strict, `src` + `scripts`) | ✅ pass |
| `tsc --noEmit` | ✅ pass |
| Static export build | ✅ 5 routes prerendered |
| verify-artifacts | ✅ 60 files · 836.9 KB gz total |
| smoke (subpath mount) | ✅ 38/38 assertions |

**Cloudflare variant** (no basePath, `NEXT_PUBLIC_SITE_URL=https://fame-protocol.pages.dev`):

| Gate | Result |
| --- | --- |
| Build → verify-artifacts | ✅ 60 files · 836.6 KB gz |
| smoke (root routing) | ✅ 38/38 assertions |

**Defects found by the gates and fixed (root causes, not symptoms):**

1. `robots.ts`/`sitemap.ts` broke export mode → added `dynamic = "force-static"`.
2. A `.js.map` leaked into the artifact → build strips `*.map`.
3. `User-Agent` casing in `robots.txt` broke a case-sensitive check →
   case-insensitive assertion.
4. Sitemap anchor URLs (`/#journal/…`) were resolved as page paths →
   hash-aware resolution; base-path prefix stripped before resolution.
5. Favicon href lacked the base path (Next does not prefix metadata icons) →
   `withBasePath("/logo.svg")`.
6. `/#build` links legitimately rewrite to `<base>#build` → verifier accepts
   the real rewrite forms (`<base>`, `<base>/…`, `<base>#…`, `<base>?…`).
7. Root-level canonical normalizes to the bare origin under Next → verifier +
   smoke accept both `SITE_URL` and `SITE_URL/`.
8. Undeclared `SITE_URL` in `smoke.mjs` and an unused parameter in `serve.mjs`
   — caught by Biome's second pass; fixed.
9. Statically-unassertable a11y wiring (aria-errormessage on a conditional
   error state; client-mounted order-flow internals) → artifact checks assert
   the static shell markers, and the interactive wiring is exercised in the
   browser verification step instead.

**Measured artifact (calibration baseline):** total 853 KB gz · JS 428 KB gz
(largest single chunk 168 KB gz — the Tremor chart tree) · CSS 24 KB gz ·
`index.html` 14 KB gz. Budgets in `scripts/verify-artifacts.mjs` are set from
these numbers with ~25–30% headroom.

**Browser verification (agent-browser, both surfaces):**
- Dev server: title/SEO head correct, zero page errors; order-flow golden path
  exercised end-to-end — Select (Node A) → RadioGroup (Node B, per-trade
  filtered) → invalid leg rejected with constraint text + polite announcement →
  amount `$25,000` auto-populated the read-only second leg
  (`$22,000 = 25,000 × (1 − |−0.12|)`) and re-scaled the AreaChart bounds →
  `PARLEY_READY` → confirm Dialog → `ORDER ROUTED` (full state machine incl.
  `INVALID_PAIR` side-state); `aria-invalid="true"` + `aria-errormessage=
  "amount-error"` verified on a `$500` ticket; Request Access blur validation
  errors, submit and success announcement verified; Institutional/Retail tabs
  carry `aria-selected` state.
- Static artifact (`out/` served with Pages routing): hydrates cleanly, the
  lazy order-flow builder mounts, zero page errors.

**Residual assumptions (explicit):**
- Canonical origin for Cloudflare defaults to `https://fame-protocol.pages.dev`;
  if the project name is taken or a custom domain is attached, edit
  `NEXT_PUBLIC_SITE_URL` in `deploy-cloudflare.yml`.
- GitHub Pages requires the one-time "Source: GitHub Actions" setting.
- CSP allows `'unsafe-inline'` for `script-src`/`style-src` because App Router
  ships inline RSC flight payloads; no third-party origins are allowed.

**Rollback:** deployments are versioned by the hosts (Pages deployments list;
Cloudflare Pages rollback). Re-running the workflow re-deploys `main`; the
gates make a red build undeployable by construction.

---

## 1.1.0 — Journal pages, agentic sources, canonical Oxide integration

Polya record for the second deployment-surface change (see docs/COLOR-AUDIT.md
for the full two-pass review):

1. **Understand** — the "read analysis" targets were dialogs; JSON-LD pointed
   at /journal/<slug> URLs that did not exist; the sitemap shipped only hash
   fragments; colors were near-Oxide but drifted on every token.
2. **Plan** — real /journal routes (static-export SSG), markdown/txt mirrors
   generated from the typed content modules (single source, zero drift),
   canonical @oxide/design-system adoption via style imports + a bridge.
3. **Carry out** — routes /journal and /journal/<slug>; generator
   scripts/generate-content-sources.mts wired into prebuild; verifier gained
   required sources/llms artifacts, a docs budget, JSON-LD integrity checks
   per article and a no-stray-markdown rule (allowlist: sources/); smoke
   gained 30+ assertions (journal pages, md mirrors, llms.txt, canonicals);
   local gate now builds with GitHub Pages coordinates (`bun run test`).
4. **Look back** — budgets re-measured: total 976 KB gz (≤ 1.4 MB), js
   422 KB (≤ 550), css 17 KB (≤ 40), docs 17 KB (≤ 80), html pages ≤ 40 KB
   each. All host workflows unchanged apart from CI now building with Pages
   coordinates.

---

## 1.1.1 — Deployment-readiness review (GitHub Pages focus)

Polya cycle for the "review the codebase and make corrections to deploy a
fully working version using GitHub Pages" pass. Everything was re-verified
from zero rather than trusted from prior records.

1. **Understand** — full inventory + gate re-execution: lint ✅, typecheck ✅,
   Pages-coordinate build ✅ (8 pages prerendered), verify-artifacts ✅
   (88 files · 953.7 KB gz), smoke ✅ (85 assertions). Workflow YAMLs parsed
   and job graphs confirmed. Hidden-file audit: `.nojekyll`, `_headers`,
   `_redirects` present in `public/` and shipped in `out/`; `.gitignore`
   excludes `out/`, `.env*`, build debris.
2. **Plan** — the review found the artifact itself fully functional but the
   repository not push-ready: **no `origin` remote existed**, so
   `deploy-pages.yml` (which triggers on push to `main`) could never fire.
   Corrections: add the remote, validate all three workflow YAMLs, exercise
   the live-mode (`--url`) code path of the smoke suite, record the cycle,
   commit.
3. **Carry out** — `origin` → `https://github.com/Fairmeme3/fame-program.git`;
   YAML validation (ci.yml: 1 job · deploy-pages.yml: build → deploy →
   post-deploy-smoke · deploy-cloudflare.yml: deploy → post-deploy-smoke);
   smoke.mjs `--url`/`--retries` live mode confirmed present (redirect-
   following for Pages 301s, 5xx/network retry loop).
4. **Look back** — browser verification of the static artifact served with
   Pages routing at the `/fame-program` mount: home hydrates with zero page
   errors and zero console noise; 15 chart SVGs render; order-flow golden
   path exercised end-to-end (Select → 4 second-leg radios → `$25,000` →
   read-only leg auto-derived `$22K hedge notional` = 25,000 × (1 − 0.12) →
   summary + 4 payoff chart SVGs → `data-pulse` CTA armed); journal article
   renders 12 chart SVGs + comparison table with a base-path-aware canonical;
   unknown routes serve the branded 404 with HTTP 404. The empty regions in
   full-page screenshots are a `content-visibility: auto` capture artifact,
   not missing content (DOM probes and viewport screenshots confirm).

**Deployment checklist for the owner** (the only steps the sandbox cannot do):

```bash
git push -u origin main          # first push fires ci.yml + both deploy workflows
# then, one time in the GitHub UI:
#   Settings → Pages → Build and deployment → Source: "GitHub Actions"
# Cloudflare (optional second surface):
#   repo secrets CLOUDFLARE_API_TOKEN (Pages: Edit) + CLOUDFLARE_ACCOUNT_ID
```

Residual notes: the untracked `.env` (`DATABASE_URL` pointing at a deleted
`db/` dir) is scaffold debris ignored by `.gitignore` — it never reaches the
artifact or the repo; `out/build-manifest.json` ships in the artifact by
design (SHA-256 provenance for the verified build).

---

## 1.2.0 — Dependency audit, script-side Cloudflare deploy, mobile hardening

Polya cycle for the "fix all dependencies + Cloudflare deploy option in
scripts + mobile/iOS/Safari optimization + completeness (build locally, no
test files/frameworks/unnecessary packages)" pass.

1. **Understand** — a mechanical import-graph audit (every `from` in `src/`
   and `scripts/` vs. `package.json`) exposed the gap between the 1.1.x
   records and disk reality: **48 shadcn/ui scaffold components were still
   tracked** (only `toast`/`toaster` are used), importing ~20 Radix packages,
   `cmdk`, `vaul`, `sonner`, `recharts`, `lucide-react`,
   `class-variance-authority`, `embla-carousel-react`, `react-hook-form`,
   `react-day-picker`, `react-resizable-panels`, `input-otp`, `next-themes`
   that are **not direct dependencies** (phantom deps that resolve only via
   hoisted transitives). Also still tracked despite the 1.0 cleanup records:
   `src/app/api/` (hello-world route — breaks `output: export`),
   `src/lib/db.ts` (`@prisma/client`, `next/server` phantoms),
   `scripts/probe-flow.mjs` (`jsdom` phantom), `scripts/oxide-*.css` +
   `scripts/spike/`, `examples/`, `db/`, `mini-services/`, `tests/`,
   `components.json`, `tailwind.config.ts` (Tailwind 4 is CSS-first; no
   `@config` reference), plus owner-local material (`.env`, `upload/`,
   `download/`, `.zscripts/`, `Caddyfile`). The deployment hardening already
   shipped (font `display: swap` via `next/font`, `touch-action:
   manipulation`, `-webkit-tap-highlight-color`, 16px input floor,
   `-webkit-backdrop-filter`, `text-size-adjust`, `content-visibility` +
   `contain-intrinsic-size`, `prefers-reduced-motion`, passive listeners, no
   `<img>` elements) was verified line-by-line.
2. **Plan** — (a) delete every unused importer so the phantom-dependency
   surface disappears; untrack owner-local material (kept on disk, ignored);
   (b) `bun update` all deps within range (next 16.4.5, react 19.3.1,
   tailwindcss 4.3.4, radix-toast 1.3.1, tailwind-merge 3.7.0, biome 2.6.5 +
   schema migrate); (c) add a script-side Cloudflare deploy option
   (`scripts/deploy-cloudflare.mjs` + `deploy:cloudflare` /
   `deploy:cloudflare:dry-run`) running the identical gate sequence, with
   `--dry-run` for credential-free verification — GitHub Pages stays
   workflow-driven (Actions runtime + OIDC); (d) close the remaining mobile
   gaps: `overscroll-behavior: contain` + `-webkit-overflow-scrolling: touch`
   on inner scroll areas, a `100vh` body fallback under the `min-h-dvh`
   utility (iOS < 15.4), and safe-area insets on the sticky nav
   (`env(safe-area-inset-left/right)`, footer already handled the bottom).
3. **Carry out** — 58 tracked files deleted or untracked; lockfile refreshed
   (543 packages installed on a clean `bun install --frozen-lockfile`, down
   from 627); new deploy script committed; CSS/nav patches applied.
4. **Look back** — from the clean install: lint ✅, typecheck ✅,
   `bun run test` ✅ (Pages build → 76-file artifact verify, 955.5 KB gz →
   85 smoke assertions), `deploy:cloudflare:dry-run` ✅ (same gates at
   domain-root coordinates, nothing deployed). Browser verification at
   390×844 (iPhone 14): zero horizontal overflow on `/` and the article,
   15/12 chart SVGs render, ≥44px primary targets. Remaining phantom-import
   check: every `from` in `src/` + `scripts/` now resolves to a package.json
   entry or `node:` builtin.

---

## 1.2.1 — Rebuild verification + final dependency sweep

Polya cycle for "rebuild the entire project, fix all dependencies, fix all
build issues".

1. **Understand** — full-gate baseline from a clean tree: lint ✅, typecheck ✅,
   `build:pages` ✅ (8 static pages), `verify:artifacts` ✅ (76 files, 955.5 KB
   gz), smoke ✅ (85 assertions) — the build was already green, so the pass
   focused on dependency currency and residue. Mechanical audit against the
   import graph: all 9 runtime + 10 dev deps genuinely used; `bun outdated`
   reported exactly two majors behind (eslint 9→10, typescript 5.9→7.0);
   residue still on disk from the 1.0/1.2.0 cleanups: `prisma/schema.prisma`
   (tracked, zero prisma dependency, no importer — and `verify-artifacts.mjs`
   actively forbids `prisma/` inside artifacts), the untracked `.env` holding
   only a dead `DATABASE_URL` → deleted `db/custom.db` (loaded by every build:
   "Environments: .env"), and `bun-types` (referenced by nothing; `tsc`'s
   include patterns never type-check `scripts/*.mts`).
2. **Plan** — delete the residue; drop `bun-types`; attempt both majors with
   gate evidence, keep each only if the full gate suite stays green; fix the
   stale README gate table (38 → 85 smoke assertions).
3. **Carry out** — `prisma/` and `.env` deleted; `bun-types` removed (also
   drops its transitive `@types/node` + `undici-types` from the lockfile);
   **eslint ^9 → ^10.14.0 kept** (lint + typecheck green); **typescript
   ^5.9.3 → 7.0.2 attempted and reverted** — `tsc --noEmit` and `next build`'s
   own TS step pass on 7.0.2, but the lint gate cannot load:
   `Error: typescript-eslint does not support TS 7.0.` (thrown from
   `typescript-eslint/dist/index.js` via `eslint-config-next`), so 7.x is
   held back until `typescript-eslint` / `eslint-config-next` declare
   support; README counts corrected.
4. **Look back** — final toolchain: next 16.4.5 / react 19.3.1 / eslint
   10.14.0 / typescript 5.9.3 / tailwindcss 4.3.4 / biome 2.6.5. Re-run from
   the final tree: `bun run test` ✅ (Pages build → 76-file verify, 955.5 KB
   gz → 85 smoke assertions) and `deploy:cloudflare:dry-run` ✅ (gates at
   domain-root coordinates — lint, typecheck, root build, verify 954.5 KB,
   85 smoke assertions, nothing deployed). `bun outdated` now lists only
   typescript 7.0.2 as available-but-blocked, with the failure mode on
   record. Local rebuild of the whole site: proven, every gate.

---

## 2.0.0 — Next.js removed: pure-Preact client-side SPA + gh-pages deploy

Polya cycle for "refactor the entire project to remove Next.js, use only
Preact, client-side only, and create a GitHub Pages deploy script using the
`gh-pages` npm package".

1. **Understand** — the Next.js layer contributed: routing/SSG (8 static
   pages), per-route metadata + JSON-LD, next/font (display=swap +
   size-adjusted fallbacks), the App Router file conventions, and the
   `out/` static export consumed by both deploy paths. The UI ran on
   Base-UI (Select/Dialog/Field/Radio/Tabs/Tooltip), Tremor+recharts
   (charts/table/metric/tracker) and Radix toast — all React-ecosystem
   packages. The CSS bridge (Oxide tokens → Tailwind namespaces) and every
   utility class were framework-independent and fully reusable.
2. **Plan** — (a) runtime: `preact` only; hand-rolled pure-Preact
   replacements for every React-library dependency, emitting the same
   `data-*` state hooks (`data-popup-open`, `data-highlighted`,
   `data-checked`, `data-disabled`, `data-status`, `data-pulse`) so the
   existing class layer carries over 1:1; charts become a hand-rolled SVG
   suite (area/line/bar/spark/category/tracker/progress/metric) on the
   alias palette. (b) tooling: Vite + @preact/preset-vite + @tailwindcss/vite;
   self-hosted @fontsource-variable fonts keep `font-display: swap` and the
   CSP `'self'`-only. (c) routing: tiny history-API router + per-route
   static shells (baked title/description/canonical/OG/JSON-LD/markdown
   alternates by `scripts/emit-shells.mts`) so deep links stay HTTP 200 on
   Pages without relying on 404-fallback semantics; 404.html keeps a
   no-JS "SLOT NOT FOUND" fallback inside #app plus noindex. (d) SEO data:
   sitemap.xml/robots.txt move into the sources generator (VITE_ env
   convention replaces NEXT_PUBLIC_*; VITE_SITE_URL is the bare origin).
   (e) deploys: new `scripts/deploy-pages.mjs` — gates → `gh-pages.publish
   ("dist", {dotfiles: true})`; Pages source must be "Deploy from a branch:
   gh-pages"; deploy-pages.yml now runs that same script (contents: write);
   Cloudflare path switched to `build:root` + `dist`.
3. **Carry out** — deleted: next/react/react-dom/@base-ui-components/react/
   @radix-ui/react-toast/@tremor/react/@types/react*/eslint-config-next/
   postcss.config.mjs/next.config.ts/src/app (globals.css → src/index.css,
   minus the Tremor scanner lines). Added: preact, vite, @preact/preset-vite,
   @tailwindcss/vite, gh-pages, @fontsource-variable/{inter,jetbrains-mono},
   typescript-eslint + eslint-plugin-react-hooks (flat config rewritten).
   47 modules transformed per build; dist/ = 32 files.
4. **Look back** — gates from the final tree: lint ✅ (5 non-fatal Biome
   warnings), typecheck ✅, `build:pages` ✅, verify:artifacts ✅
   (32 files, **422.1 KB gz total — js 46.9 KB gz, css 13.8 KB gz**; the
   1.2.0 build was 955.5 KB / 426 KB js — a 2.3× total / 9× JS reduction),
   smoke ✅ (73 assertions), `deploy:pages:dry-run` ✅,
   `deploy:cloudflare:dry-run` ✅. Browser verification of the Pages-mount
   artifact: home renders (6 boundaries, 9 hero SVGs, live blotter), persona
   toggle persists, order-flow golden path end-to-end (keyboard-driven
   Select: Enter→↓×2→Enter commits; $22K hedge = 25,000 × (1−0.12);
   PARLEY_READY pulse; confirm dialog; ticket FAME-72CG; reset), rejection
   path toasts + REJECTED node, client-side routing + popstate, fresh
   deep-link loads (baked titles, 3-4 chart SVGs per article), branded 404,
   Escape/outside-click dismissal, mobile 390×844 and desktop 1440×900
   screenshots match the Oxide design language.

---

## 2.0.1 — Lint warnings closed + repo re-coordinated to sambacha/fame-beta-site

Polya cycle for "fix the errors" (the 5 Biome warnings left by 2.0.0) and
"change our github to https://sambacha.github.io/fame-beta-site/".

1. **Understand** — 2.0.0 shipped with `lint ✅ (5 non-fatal Biome warnings)`:
   4× `lint/suspicious/noArrayIndexKey` in `charts.tsx` (BarChart rect/text
   keys, CategoryBar segments, Tracker slots) and 1×
   `lint/a11y/useSemanticElements` in `nav.tsx` (`div role="group"`).
   Separately the project's GitHub coordinates moved from
   `Fairmeme3/fame-program` to `sambacha/fame-beta-site`, which changes the
   Pages origin, base path and every baked canonical/OG/sitemap URL.
2. **Plan** — (a) keys: replace every index-derived key with content-derived
   identity — BarChart rects key on `` `${category}-${point[index]}` ``
   (category ∪ axis label = unique), BarChart x-labels on `point[index]`,
   Tracker on `slot.tooltip` (unique settlement-slot label), CategoryBar on
   `color-value` with an occurrence-disambiguation Map (survives duplicate
   segments without leaking the index back into the key); (b) nav: semantic
   `<fieldset aria-label>` (Tailwind 4 preflight resets fieldset
   margin/padding/border, so the visual is unchanged); (c) coordinates:
   `build:pages` / `verify:artifacts` / `test:smoke` scripts,
   `deploy-pages.mjs` preflight+gates+publish message,
   `deploy-pages.yml` env, seo/head/generator defaults, footer label,
   `package.json` repository field + remote URL — ci.yml needs no edit
   (derives owner/repo from `GITHUB_REPOSITORY`).
3. **Carry out** — 14 files edited; `git remote set-url origin
   https://github.com/sambacha/fame-beta-site.git`; sitemap.xml/robots.txt/
   llms*.txt regenerated by `bun run sources` during the build.
4. **Look back** — `bun run deploy:pages:dry-run` (the full gate pipeline at
   the new coordinates): lint ✅ **42 files checked, 0 warnings** (was 5),
   typecheck ✅, build:pages ✅ (5 shells, base=/fame-beta-site, site=
   https://sambacha.github.io), verify-artifacts ✅ (32 files, 422.1 KB gz —
   js 46.9 KB, css 13.8 KB), smoke ✅ (73 assertions), nothing published.
   Live URL after push: https://sambacha.github.io/fame-beta-site/ (Pages
   source: "Deploy from a branch: gh-pages / (root)").
