/**
 * Central SEO constants + JSON-LD builders (schema.org @graph).
 * Organization and SoftwareApplication live in the app shell; BlogPosting
 * entries are injected alongside them for the two journal pieces.
 *
 * Deployment-awareness: VITE_SITE_URL sets the canonical origin at build
 * time (GitHub Pages project site vs. Cloudflare Pages root), and
 * VITE_BASE_PATH prefixes public-file paths so OG images resolve under
 * https://<owner>.github.io/<repo>/ subpath hosting. Bun post-build scripts
 * (emit-shells.mts) supply the same values via process.env.
 */

/** Read a build-time env var: Vite's import.meta.env first, then process.env (Bun scripts). */
function envValue(key: string): string | undefined {
  const vite = (import.meta as { env?: Record<string, string | undefined> }).env
  if (vite && key in vite) return vite[key]
  if (typeof process !== "undefined") return process.env[key]
  return undefined
}

const BASE_PATH = (envValue("VITE_BASE_PATH") ?? "").replace(/\/+$/, "")

/** Prefix a public-file path with the deployment base path (no-op at domain root). */
export function withBasePath(path: string): string {
  return `${BASE_PATH}${path}`
}

export const SITE = {
  name: "FAME Protocol",
  url: envValue("VITE_SITE_URL") ?? "https://sambacha.github.io",
  tagline: "One curve. No insiders.",
  description:
    "FAME Protocol is formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs.",
  ogImage: withBasePath("/og-image.png"),
  repo: "https://github.com/sambacha/fame-beta-site",
} as const

export type LdGraphNode = Record<string, unknown>

export const JOURNAL_PATH = "/journal"

/** Absolute URL of a journal article page (the JSON-LD @id / canonical form). */
export function journalArticleUrl(slug: string): string {
  return `${SITE.url}${BASE_PATH}/journal/${slug}`
}

export function buildOrganizationLd(): LdGraphNode {
  return {
    "@type": "Organization",
    "@id": `${SITE.url}/#org`,
    name: SITE.name,
    url: SITE.url,
    description: SITE.tagline,
    logo: `${SITE.url}/logo.svg`,
    sameAs: [SITE.repo],
  }
}

export function buildWebSiteLd(): LdGraphNode {
  return {
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    url: SITE.url,
    name: SITE.name,
    publisher: { "@id": `${SITE.url}/#org` },
  }
}

export function buildSoftwareApplicationLd(): LdGraphNode {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE.url}/#app`,
    name: "FAME Parametric Parlay Engine",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web (Solana)",
    description:
      "Institutional-grade parametric parlay execution with formally verified settlement invariants, program-owned liquidity and a hard-capped emission schedule.",
    url: SITE.url,
    publisher: { "@id": `${SITE.url}/#org` },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description:
        "Protocol access is permissionless; the Request Access flow gates large notional onboarding.",
    },
  }
}

export function buildLdGraph(extraNodes: LdGraphNode[]): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      buildOrganizationLd(),
      buildWebSiteLd(),
      buildSoftwareApplicationLd(),
      ...extraNodes,
    ],
  })
}

/** FAQPage node — built from an article's FAQ so rich results can surface it. */
export function buildFaqLd(faq: { q: string; a: string }[]): LdGraphNode {
  return {
    "@type": "FAQPage",
    "@id": `${SITE.url}${BASE_PATH}/journal#faq`,
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  }
}

/** BreadcrumbList for / and /journal/<slug>. */
export function buildBreadcrumbLd(trail: { name: string; path: string }[]): LdGraphNode {
  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: `${SITE.url}${BASE_PATH}${crumb.path}`,
    })),
  }
}

export function buildArticleLd(article: {
  slug: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  datePublished: string
  dateModified: string
}): LdGraphNode {
  const url = journalArticleUrl(article.slug)
  return {
    "@type": "BlogPosting",
    "@id": `${url}#post`,
    headline: article.seoTitle,
    description: article.seoDescription,
    keywords: article.keywords.join(", "),
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: "en",
    author: { "@id": `${SITE.url}/#org` },
    publisher: { "@id": `${SITE.url}/#org` },
    mainEntityOfPage: url,
    isPartOf: { "@id": `${SITE.url}/#website` },
  }
}
