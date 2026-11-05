# FAME Protocol — Landing Page

High-conversion landing surface for the FAME Protocol (formally verified parametric
parlay infrastructure), built with Next.js 16 (App Router) + TypeScript, Tremor UI
and Base-UI primitives. Deploys as a **pure static export** to GitHub Pages and
Cloudflare Pages behind a strict quality-gate pipeline.

## Quickstart

```bash
bun install          # deps
bun run dev          # dev server on :3000 (sandbox preview)
bun run lint         # ESLint + Biome (strict)
bun run typecheck    # tsc --noEmit
bun run build        # static export → out/
bun run test         # verify artifacts + 85 smoke assertions against out/
bun run start        # serve out/ locally (Pages-style routing)
```

## Quality gates (pre-deployment, enforced in CI)

| Gate | Script | What it proves |
| --- | --- | --- |
| Lint | `bun run lint` | ESLint strict + Biome recommended across `src/` and `scripts/` |
| Types | `bun run typecheck` | No TS escape hatches (`ignoreBuildErrors` is off) |
| Build | `bun run build` | Static export compiles with zero type errors |
| Artifact verify | `bun run verify:artifacts` | Structure, gzip budgets, JSON-LD, OG, canonical, basePath scope, headers/redirects, manifest |
| Smoke | `bun run test:smoke` | 85 HTTP assertions against the artifact served with Pages-style routing |

Deployment workflows re-run every gate before shipping, then smoke the **live**
URL after it lands.

## Deployment

### GitHub Pages (project site)

- Workflow: `.github/workflows/deploy-pages.yml` (push to `main` or manual).
- Builds with `NEXT_PUBLIC_BASE_PATH=/<repo>` and
  `NEXT_PUBLIC_SITE_URL=https://<owner>.github.io/<repo>` (computed from
  `github.repository`), verifies, smokes, then deploys via
  `actions/deploy-pages` and re-smokes the live URL.
- One-time setup: **Settings → Pages → Build and deployment → Source:
  "GitHub Actions"**.

### Cloudflare Pages (direct upload)

- Workflow: `.github/workflows/deploy-cloudflare.yml` (push to `main` or manual).
- Script option (same gates, run locally): `bun run deploy:cloudflare` —
  lint → typecheck → domain-root build → verify → smoke → `wrangler pages
  deploy out`. Requires `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` in
  the environment; `bun run deploy:cloudflare:dry-run` runs the gates only.
- Builds at the domain root with `NEXT_PUBLIC_SITE_URL=https://fame-protocol.pages.dev`
  (edit the workflow env when attaching a custom domain), verifies, smokes, then
  `wrangler pages deploy out --project-name=fame-protocol`.
- Required repo secrets: `CLOUDFLARE_API_TOKEN` (Pages: Edit permission),
  `CLOUDFLARE_ACCOUNT_ID`.
- Edge headers/redirects come from `public/_headers` and `public/_redirects`.

Full decision record and Polya problem-solving walkthrough:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Architecture notes

- **Sections as islands**: every landing block (blotter hero, stability anchor,
  problem/solution, order flow, access CTA, journal) is wrapped in a
  retry-armed `SectionBoundary` — a crash degrades locally, never page-wide.
- **Parametric Order Flow**: `useOrderBuilder` state machine
  (`IDLE → TRADE_A_SELECTED → TRADE_B_SELECTED → PARLEY_READY → SUBMITTED`)
  fused with the `orderData` derivation pattern — the amount input is state,
  the second leg (`performCalculation`) and payoff summary
  (`generateSummary`) are pure derivatives. Lazy-mounted in view
  (`next/dynamic`, `ssr: false`) with memoised leg components.
- **Design tokens**: OKLCH variables in `globals.css` (`--color-brand-green`,
  `--surface-dim`, …) consumed through Tailwind theme tokens.
- **SEO**: JSON-LD `@graph` (Organization, WebSite, SoftwareApplication,
  2× BlogPosting), OpenGraph/Twitter cards, `sitemap.xml` + `robots.txt`
  generated from `src/lib/seo.ts` at build time.
- **A11y**: WAI-ARIA patterns via Base-UI (Select, RadioGroup, Dialog, Field),
  `aria-live` announcements, blur validation, ≥44px targets, skip link,
  WCAG 2.1 AA target.

## Research journal & agentic SEO

- **/journal** index + two analysis pages with their own chart suites
  (Tremor Area/Bar/Line on the Oxide palette), comparison tables and
  FAQ — each statically exported, canonicalized and JSON-LD'd
  (BlogPosting + BreadcrumbList + FAQPage).
- **Markdown mirrors** for every indexable page:
  `sources/home.md`, `sources/analysis/<slug>.md`, plus `llms.txt` and
  `llms-full.txt` for research agents. Generated from the same typed
  modules the UI renders (`bun run sources`) — HTML and sources cannot
  drift.
- **Canonical Oxide design system**: `@oxide/design-system` styles are
  imported directly; this repo hand-maintains no color values. See
  docs/COLOR-AUDIT.md for the two-pass adherence review and the
  third-party (Tremor) alias layer.
