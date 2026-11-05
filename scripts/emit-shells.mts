/**
 * Static shell emitter — the post-build step that turns the Vite SPA shell
 * into per-route HTML files.
 *
 * The site is client-side only: every route is the same empty mount point
 * plus a script tag. What differs per route is the HEAD — title, meta
 * description, canonical, Open Graph, the markdown alternate and the JSON-LD
 * graph — which is baked in here at build time so crawlers, agents and
 * no-JS clients get accurate metadata with a clean HTTP 200 at every
 * canonical URL (GitHub Pages serves /journal/<slug>/ from
 * journal/<slug>/index.html).
 *
 * Reads __FAME_*__ tokens from dist/index.html (see /index.html) and writes:
 *   dist/index.html                — home route
 *   dist/journal/index.html        — journal index
 *   dist/journal/<slug>/index.html — one per article
 *   dist/404.html                  — branded 404 (noindex + static fallback)
 *
 * Env: VITE_SITE_URL, VITE_BASE_PATH (same values the Vite build used).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { ARTICLES } from "../src/lib/blog-content"
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd, buildLdGraph, SITE } from "../src/lib/seo"

const ROOT = join(import.meta.dir, "..")
const DIST = join(ROOT, "dist")

const SITE_URL = (process.env.VITE_SITE_URL ?? "https://sambacha.github.io").replace(/\/+$/, "")
const BASE_PATH = (process.env.VITE_BASE_PATH ?? "").replace(/\/+$/, "")

const shell = readFileSync(join(DIST, "index.html"), "utf8")
if (!shell.includes("__FAME_TITLE__")) {
  console.error(
    "[shells] dist/index.html has no __FAME_*__ tokens — run `bun run build` (vite build) first.",
  )
  process.exit(1)
}

const ogImage = `${SITE_URL}${BASE_PATH}/og-image.png`

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
}

type RouteMeta = {
  title: string
  description: string
  canonicalPath: string
  ogType: "website" | "article"
  ogTitle: string
  ogDescription: string
  jsonLd: string
  /** Full <link rel="alternate" type="text/markdown"> tag or "". */
  alternateMd: string
  /** Extra head tags appended verbatim (noindex for the 404). */
  extraHead?: string
  /** Static no-JS fallback content injected inside #app (before <noscript>). */
  staticFallback?: string
}

const routes: { path: string | null; meta: RouteMeta }[] = [
  {
    path: null, // dist/index.html
    meta: {
      title: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure",
      description: SITE.description,
      canonicalPath: "/",
      ogType: "website",
      ogTitle: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure",
      ogDescription: SITE.description,
      jsonLd: buildLdGraph(ARTICLES.map((article) => buildArticleLd(article))),
      alternateMd: "",
    },
  },
  {
    path: "journal/index.html",
    meta: {
      title: "Research journal | FAME Protocol",
      description:
        "FAME Protocol research: how the liquidity ratio and emission cap are enforced, and what formal verification honestly covers. Markdown mirrors ship with every piece.",
      canonicalPath: "/journal",
      ogType: "website",
      ogTitle: "FAME Protocol — Research journal",
      ogDescription:
        "How the risk engine and the proof set actually work, written for people who verify.",
      jsonLd: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          buildBreadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Research journal", path: "/journal" },
          ]),
          {
            "@type": "CollectionPage",
            "@id": `${SITE.url}${BASE_PATH}/journal#page`,
            name: "FAME Protocol — Research journal",
            url: `${SITE_URL}${BASE_PATH}/journal`,
            isPartOf: { "@id": `${SITE.url}/#website` },
            publisher: { "@id": `${SITE.url}/#org` },
            hasPart: ARTICLES.map((a) => ({
              "@type": "BlogPosting",
              "@id": `${SITE_URL}${BASE_PATH}/journal/${a.slug}#post`,
              headline: a.seoTitle,
              url: `${SITE_URL}${BASE_PATH}/journal/${a.slug}`,
            })),
          },
        ],
      }),
      alternateMd: "",
    },
  },
  ...ARTICLES.map((article) => ({
    path: `journal/${article.slug}/index.html`,
    meta: {
      title: `${article.seoTitle} | FAME Protocol`,
      description: article.seoDescription,
      canonicalPath: `/journal/${article.slug}`,
      ogType: "article" as const,
      ogTitle: article.seoTitle,
      ogDescription: article.seoDescription,
      jsonLd: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          buildArticleLd(article),
          buildBreadcrumbLd([
            { name: "Home", path: "/" },
            { name: "Research journal", path: "/journal" },
            { name: article.title, path: `/journal/${article.slug}` },
          ]),
          buildFaqLd(article.faq),
        ],
      }),
      alternateMd: `<link rel="alternate" type="text/markdown" href="${SITE_URL}${BASE_PATH}/sources/analysis/${article.slug}.md" />`,
    },
  })),
  {
    path: "404.html",
    meta: {
      title: "Page not found | FAME Protocol",
      description: "The slot you requested is not part of the ledger.",
      canonicalPath: "/",
      ogType: "website",
      ogTitle: "FAME Protocol — Page not found",
      ogDescription: "The slot you requested is not part of the ledger.",
      jsonLd: "",
      alternateMd: "",
      extraHead: '<meta name="robots" content="noindex" />',
      staticFallback: [
        '<section style="max-width:48rem;margin:0 auto;padding:6rem 1rem">',
        '<p style="font-family:monospace;letter-spacing:0.1em">HTTP 404 · SLOT NOT FOUND</p>',
        '<h1 style="font-size:1.75rem;margin:1rem 0">This page never settled.</h1>',
        `<p style="max-width:28rem">The slot you requested is not part of the ledger. The main curve is still live — <a href="${BASE_PATH}/">settle back to the homepage</a>.</p>`,
        "</section>",
      ].join(""),
    },
  },
]

function renderShell(meta: RouteMeta): string {
  const canonical = `${SITE_URL}${BASE_PATH}${meta.canonicalPath === "/" ? "/" : meta.canonicalPath}`
  const jsonLd =
    meta.jsonLd ||
    JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [],
    })
  let html = shell
    .replaceAll("__FAME_TITLE__", escapeHtml(meta.title))
    .replaceAll("__FAME_DESCRIPTION__", escapeHtml(meta.description))
    .replaceAll("__FAME_BASE__", BASE_PATH)
    .replaceAll("__FAME_CANONICAL__", escapeHtml(canonical))
    .replaceAll("__FAME_ALTERNATE_MD__", meta.alternateMd)
    .replaceAll("__FAME_OG_TYPE__", meta.ogType)
    .replaceAll("__FAME_OG_TITLE__", escapeHtml(meta.ogTitle))
    .replaceAll("__FAME_OG_DESCRIPTION__", escapeHtml(meta.ogDescription))
    .replaceAll("__FAME_OG_URL__", escapeHtml(canonical))
    .replaceAll("__FAME_OG_IMAGE__", escapeHtml(ogImage))
    .replaceAll("__FAME_LD_JSON__", () => jsonLd.replaceAll("</", "<\\/"))

  if (meta.extraHead) {
    html = html.replace("</title>", `</title>${meta.extraHead}`)
  }
  if (meta.staticFallback) {
    html = html.replace(/(<noscript>)/, `${meta.staticFallback}$1`)
  }
  // Guard: no leftover tokens may ship.
  if (html.includes("__FAME_")) {
    throw new Error("[shells] unresolved __FAME_*__ token after rendering")
  }
  return html
}

let written = 0
for (const route of routes) {
  const target = join(DIST, route.path ?? "index.html")
  mkdirSync(join(target, ".."), { recursive: true })
  writeFileSync(target, renderShell(route.meta))
  written += 1
}

console.info(`[shells] wrote ${written} route shells (base=${BASE_PATH || "/"}, site=${SITE_URL})`)
