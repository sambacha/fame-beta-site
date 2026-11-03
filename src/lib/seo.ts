/**
 * Central SEO constants + JSON-LD builders (schema.org @graph).
 * Organization and SoftwareApplication live in the root layout;
 * BlogPosting entries are injected alongside them for the two journal pieces.
 */

export const SITE = {
  name: "FAME Protocol",
  url: "https://fame-protocol.example",
  tagline: "One curve. No insiders.",
  description:
    "FAME Protocol is formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs.",
  ogImage: "/og-image.png",
  repo: "https://github.com/Fairmeme3/fame-program",
} as const

export type LdGraphNode = Record<string, unknown>

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

export function buildArticleLd(article: {
  slug: string
  seoTitle: string
  seoDescription: string
  keywords: string[]
  datePublished: string
  dateModified: string
}): LdGraphNode {
  const url = `${SITE.url}/journal/${article.slug}`
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
