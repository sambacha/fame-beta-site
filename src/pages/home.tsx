import { AccessCTA } from "@/components/access-cta"
import { BlogPreview } from "@/components/blog-preview"
import { HeroBlotter } from "@/components/hero-blotter"
import { OrderFlowSection } from "@/components/order-flow/order-flow-section"
import { ProblemSolution } from "@/components/problem-solution"
import { SectionBoundary } from "@/components/section-boundary"
import { StabilityAnchor } from "@/components/stability-anchor"
import { useHead } from "@/head"
import { ARTICLES } from "@/lib/blog-content"
import { buildArticleLd, buildLdGraph, SITE, withBasePath } from "@/lib/seo"

/**
 * Landing page — Oxide-inspired conversion surface. Every block is wrapped
 * in its own retry-armed error boundary so a crash in one module degrades
 * locally instead of taking down the page.
 */
export function HomePage() {
  const articleLd = ARTICLES.map((article) => buildArticleLd(article))

  useHead({
    title: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure",
    description: SITE.description,
    canonicalPath: "/",
    ogType: "website",
    jsonLd: buildLdGraph(articleLd),
    markdownAlternate: withBasePath("/sources/home.md"),
  })

  return (
    <main id="main">
      <SectionBoundary sectionName="market-blotter-hero">
        <HeroBlotter />
      </SectionBoundary>

      <SectionBoundary sectionName="protocol-stability-anchor">
        <StabilityAnchor />
      </SectionBoundary>

      <SectionBoundary sectionName="problem-solution">
        <ProblemSolution />
      </SectionBoundary>

      <SectionBoundary sectionName="parametric-order-flow">
        <OrderFlowSection />
      </SectionBoundary>

      <SectionBoundary sectionName="request-access">
        <AccessCTA />
      </SectionBoundary>

      <SectionBoundary sectionName="research-journal">
        <BlogPreview />
      </SectionBoundary>
    </main>
  )
}
