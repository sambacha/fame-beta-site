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
