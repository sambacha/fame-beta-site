/**
 * Agentic-SEO content source generator.
 *
 * Serializes the typed content modules the UI renders (blog-content.ts,
 * site-content.ts, analysis-data.ts via markdown.ts) into indexable text
 * artifacts that ship inside the static export:
 *
 *   public/sources/home.md                 — landing-page canonical content
 *   public/sources/analysis/<slug>.md      — full article + data appendix
 *   public/llms.txt                        — agent index (llms.txt convention)
 *   public/llms-full.txt                   — everything, one plain-text file
 *
 * Run automatically by `prebuild` (and on demand via `bun run sources`).
 * Deterministic output: identical inputs → identical bytes.
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { ARTICLES } from "../src/lib/blog-content"
import { articleToMarkdown, homeToMarkdown } from "../src/lib/markdown"

const ROOT = resolve(import.meta.dir, "..")
const PUBLIC = join(ROOT, "public")

const SITE_URL = (process.env.VITE_SITE_URL ?? "https://sambacha.github.io").replace(/\/+$/, "")
const BASE_PATH = (process.env.VITE_BASE_PATH ?? "").replace(/\/+$/, "")

const url = (path: string) => `${SITE_URL}${BASE_PATH}${path}`

/* ── Sources tree ─────────────────────────────────────────────────────────── */
mkdirSync(join(PUBLIC, "sources", "analysis"), { recursive: true })

const home = homeToMarkdown(SITE_URL, BASE_PATH)
writeFileSync(join(PUBLIC, "sources", "home.md"), home)

const articleDocs = ARTICLES.map((article) => ({
  slug: article.slug,
  markdown: articleToMarkdown(article, SITE_URL, BASE_PATH),
}))
for (const doc of articleDocs) {
  writeFileSync(join(PUBLIC, "sources", "analysis", `${doc.slug}.md`), doc.markdown)
}

/* ── llms.txt — the agent entry point ─────────────────────────────────────── */
const llms = [
  "# FAME Protocol",
  "",
  "> One curve. No insiders. Formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs.",
  "",
  "This site ships markdown mirrors of every indexable page so research agents can read the canonical content without rendering JavaScript. Figures marked illustrative are deterministic design parameters — verify from primary sources (program accounts, public invariant repository).",
  "",
  "## Pages",
  "",
  `- [Home](${url("/")}): landing page — protocol stability anchor, problem/solution narrative, parametric order flow, request access.`,
  ...ARTICLES.map((a) => `- [${a.seoTitle}](${url(`/journal/${a.slug}`)}): ${a.seoDescription}`),
  "",
  "## Markdown sources",
  "",
  `- [Home (markdown)](${url("/sources/home.md")}): the complete landing-page content as markdown.`,
  ...ARTICLES.map(
    (a) =>
      `- [${a.seoTitle} (markdown)](${url(`/sources/analysis/${a.slug}.md`)}): full article with data appendix.`,
  ),
  "",
  "## Machine-readable",
  "",
  `- [llms-full.txt](${url("/llms-full.txt")}): all of the above content in one plain-text file.`,
  `- [Sitemap](${url("/sitemap.xml")}): every canonical URL.`,
  `- [robots.txt](${url("/robots.txt")}): crawl policy (allow all).`,
  `- [Repository](${process.env.VITE_REPO_URL ?? "https://github.com/sambacha/fame-beta-site"}): program source, invariant set, audit folder.`,
  "",
].join("\n")
writeFileSync(join(PUBLIC, "llms.txt"), llms)

/* ── llms-full.txt — everything, one file ─────────────────────────────────── */
const divider = (title: string) =>
  [
    "",
    "════════════════════════════════════════════════════════════════════",
    `  ${title}`,
    "════════════════════════════════════════════════════════════════════",
    "",
  ].join("\n")

const full = [
  "FAME PROTOCOL — FULL CONTENT FOR AGENTS (llms-full.txt)",
  `Canonical index: ${url("/llms.txt")}`,
  `${divider("HOME")}`,
  home,
  ...articleDocs.flatMap((doc) => [divider(`JOURNAL — ${doc.slug}`), doc.markdown]),
].join("\n")
writeFileSync(join(PUBLIC, "llms-full.txt"), full)

console.info(
  `[sources] wrote sources/home.md, sources/analysis/${ARTICLES.map((a) => a.slug).join(", ")}.md, llms.txt, llms-full.txt`,
)

/* ── sitemap.xml — every canonical URL (replaces the old app/sitemap.ts) ──── */
const today = new Date().toISOString().slice(0, 10)
const sitemapUrls = [
  { loc: `${url("/")}`, priority: "1.0" },
  { loc: `${url("/journal")}`, priority: "0.8" },
  ...ARTICLES.map((a) => ({ loc: url(`/journal/${a.slug}`), priority: "0.7" })),
]
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...sitemapUrls.flatMap((entry) => [
    "  <url>",
    `    <loc>${entry.loc}</loc>`,
    `    <lastmod>${today}</lastmod>`,
    `    <priority>${entry.priority}</priority>`,
    "  </url>",
  ]),
  "</urlset>",
  "",
].join("\n")
writeFileSync(join(PUBLIC, "sitemap.xml"), sitemap)

/* ── robots.txt — allow all, point at the sitemap (replaces app/robots.ts) ── */
const robots = ["User-agent: *", "Allow: /", "", `Sitemap: ${url("/sitemap.xml")}`, ""].join("\n")
writeFileSync(join(PUBLIC, "robots.txt"), robots)

console.info(
  `[sources] wrote sources/*, llms.txt, llms-full.txt, sitemap.xml (${sitemapUrls.length} URLs), robots.txt`,
)
