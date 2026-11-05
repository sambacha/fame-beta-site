import { ChartCard } from "@/components/analysis/chart-card"
import {
  ArticleCta,
  Breadcrumb,
  ComparisonTable,
  FaqSection,
  KeyTakeaways,
  SourcesNote,
  StatStrip,
} from "@/components/analysis/primitives"
import {
  BackingComparisonChart,
  BreakerEpisodeChart,
  EmissionChart,
  LiquidityRatioChart,
} from "@/components/analysis/risk-charts"
import {
  AuditVsProofChart,
  InvariantCoverageChart,
  InvariantRatchetChart,
} from "@/components/analysis/verification-charts"
import { useHead } from "@/head"
import { PEER_COMPARISON, PROOF_PIPELINE, PROOF_SCOPE } from "@/lib/analysis-data"
import { ARTICLES, type Article, findArticle } from "@/lib/blog-content"
import { buildArticleLd, buildBreadcrumbLd, buildFaqLd, withBasePath } from "@/lib/seo"

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}

const slugify = (heading: string): string =>
  heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

/* ── Per-article composition: stats, takeaways, charts, comparisons ──────── */

const COMPOSITION = {
  "liquidity-ratios-emission-caps": {
    stats: [
      { label: "Design floor", value: "1.20", hint: "Backing must exceed claims by 20%." },
      {
        label: "Circuit breaker",
        value: "1.10",
        hint: "Deposits and emissions halt automatically.",
      },
      {
        label: "Emission cap",
        value: "1.0B FAME",
        hint: "Immutable constant; mint authority burned.",
      },
      {
        label: "Upgrade timelock",
        value: "48h",
        hint: "Public countdown, verifiable exit window.",
      },
    ],
    takeaways: [
      "The liquidity ratio is computed on-chain by the program itself at every slot — any observer can recompute it from raw state, no dashboard trusted.",
      "Between the 1.20 floor and the 1.10 breaker the launch accumulates a public warning trail; below 1.10 deposits and emissions halt without a vote.",
      "The 1,000,000,000 FAME cap lives in the program's immutable constants — dilution is arithmetic, not a governance mood.",
      "Five due-diligence checks (recompute, verify the burn, read the timelock, count insiders, re-run proofs) take an afternoon and catch most of what matters.",
    ],
    charts: (
      <>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Liquidity ratio vs. floor and breaker"
            description="Slot-level ratio drifting in the healthy band. The 1.20 design floor and 1.10 breaker are program constants, not policies."
            footnote="Deterministic reconstruction of the design envelope — figures illustrative."
          >
            <LiquidityRatioChart />
          </ChartCard>
          <ChartCard
            title="Circuit-breaker stress episode"
            description="Backing drains through the floor, the breaker arms, deposits and emissions halt in the same slot — then recover. No vote, no signature, no negotiation."
            footnote="Tooltip marks the halted window. Existing withdrawal rights keep priority throughout."
          >
            <BreakerEpisodeChart />
          </ChartCard>
        </div>
        <ChartCard
          title="Emission schedule against the immutable cap"
          description="Cumulative supply by sleeve (millions of FAME). The total can approach — never cross — the 1,000,000,000 constant."
          footnote="Front-loaded incentive curve, linear contributor vesting, step treasury program."
        >
          <EmissionChart />
        </ChartCard>
        <ChartCard
          title="Backing multiple by launch type"
          description="FAME enforces a 1.20 floor; a typical fair launch floats near 1.0 with no floor at all; presale structures commonly settle below."
          footnote="Design floors, illustrative — recompute from program accounts before allocating."
        >
          <BackingComparisonChart />
        </ChartCard>
      </>
    ),
    comparison: {
      headers: ["Dimension", "FAME Protocol", "Typical fair launch", "Typical presale launch"],
      rows: PEER_COMPARISON.map((row) => ({
        dimension: row.dimension,
        values: [row.fame, row.typicalFairLaunch, row.typicalPresale],
      })),
      caption:
        "Structural comparison across launch designs. The FAME column is marked with the accent dot and header tier — verify every cell from primary sources, never from this table alone.",
      emphasizeColumn: 1,
    },
  },
  "formal-verification-defi-safety": {
    stats: [
      {
        label: "Invariants machine-checked",
        value: "214",
        hint: "Re-verified in CI on every deploy.",
      },
      {
        label: "Solvency family",
        value: "58",
        hint: "Largest proof family: backing ≥ floor in all reachable states.",
      },
      {
        label: "Proof boundary",
        value: "3 out",
        hint: "Oracle feeds, bridge custody and market risk are disclosed exclusions.",
      },
      {
        label: "Deploy gate",
        value: "CI-blocked",
        hint: "Merges cannot skip the proof re-run on the exact bytecode.",
      },
    ],
    takeaways: [
      "An audit is a sample; a proof is an exclusion. Formal verification enumerates the reachable state space and checks the invariant in every state.",
      "FAME's four settlement-critical families — solvency, cap conservation, parley concentration, breaker liveness — are theorem-level properties, re-run on every deploy.",
      "The ratchet matters as much as the set: an upgrade cannot merge unless the full proof set passes on the exact bytecode that ships.",
      "The honest boundary: proofs cover the program, not the world. Oracle feeds, bridges and market risk remain priced risks, not verified guarantees.",
    ],
    charts: (
      <>
        <div className="grid gap-4 lg:grid-cols-2">
          <ChartCard
            title="Machine-checked invariants by family"
            description="214 invariants across five families. Solvency and parley concentration carry the settlement guarantees."
            footnote="Counts from the public invariant set — re-run the proofs yourself from the repository."
          >
            <InvariantCoverageChart />
          </ChartCard>
          <ChartCard
            title="The invariant ratchet"
            description="The proof set only grows — and every release must re-verify the full set before it can merge. Guarantees cannot quietly lapse."
            footnote="Re-verified invariants per release; CI blocks the merge if any one fails."
          >
            <InvariantRatchetChart />
          </ChartCard>
        </div>
        <ChartCard
          title="Audit sampling vs. exhaustive proof coverage"
          description="What a time-boxed manual audit samples versus what a machine check covers, by defect class, inside the program boundary."
          footnote="Illustrative profile synthesized from public post-mortem taxonomies — audits remain necessary, just not sufficient."
        >
          <AuditVsProofChart />
        </ChartCard>
      </>
    ),
    pipeline: PROOF_PIPELINE,
    comparison: {
      headers: ["Domain", "Inside the proof set", "Note"],
      rows: PROOF_SCOPE.map((row) => ({
        dimension: row.domain,
        values: [row.covered ? "covered" : "not covered", row.note],
      })),
      caption:
        "The proof boundary, stated honestly. 'Not covered' means priced by risk policy and disclosure — never by a mathematical guarantee.",
    },
  },
} as const

type CompositionKey = keyof typeof COMPOSITION

export function JournalArticlePage({ slug }: { slug: string }) {
  const article: Article | undefined = findArticle(slug)

  // Unknown slugs render the branded 404 (the static shells only exist for
  // known slugs, but a bad client-side navigation still lands somewhere sane).
  if (!article) {
    return <NotFoundFallback slug={slug} />
  }
  return <ArticleView article={article} />
}

function ArticleView({ article }: { article: Article }) {
  const slug = article.slug
  const composition = COMPOSITION[slug as CompositionKey]
  const currentIndex = ARTICLES.findIndex((a) => a.slug === slug)
  const next = ARTICLES[(currentIndex + 1) % ARTICLES.length]
  const articleLd = buildArticleLd(article)
  const breadcrumbLd = buildBreadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Research journal", path: "/journal" },
    { name: article.title, path: `/journal/${article.slug}` },
  ])
  const faqLd = buildFaqLd(article.faq)
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [articleLd, breadcrumbLd, faqLd],
  })

  useHead({
    title: `${article.seoTitle} | FAME Protocol`,
    description: article.seoDescription,
    canonicalPath: `/journal/${article.slug}`,
    ogType: "article",
    ogTitle: article.seoTitle,
    ogDescription: article.seoDescription,
    publishedTime: new Date(`${article.datePublished}T00:00:00Z`).toISOString(),
    modifiedTime: new Date(`${article.dateModified}T00:00:00Z`).toISOString(),
    tags: article.keywords,
    jsonLd,
    markdownAlternate: withBasePath(`/sources/analysis/${article.slug}.md`),
  })

  return (
    <main id="main" className="border-b border-stroke-default">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <Breadcrumb
            trail={[
              { name: "Home", href: "/" },
              { name: "Research journal", href: "/journal" },
              { name: article.title, href: `/journal/${article.slug}` },
            ]}
          />

          <header className="mt-8">
            <p className="text-mono-xs text-content-accent">FAME PROTOCOL RESEARCH</p>
            <h1 className="mt-3 text-balance text-3xl font-medium leading-tight tracking-tight text-content-raise sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-pretty text-lg leading-relaxed text-content-secondary">
              {article.lead}
            </p>
            <p className="mt-4 font-mono text-[11px] text-content-tertiary">
              {formatDate(article.datePublished)} · updated {formatDate(article.dateModified)} ·{" "}
              {article.readMinutes} min read
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {article.keywords.map((keyword) => (
                <li
                  key={keyword}
                  className="rounded-tremor-small border border-stroke-default bg-surface-secondary px-2 py-1 text-mono-xs text-content-secondary"
                >
                  {keyword}
                </li>
              ))}
            </ul>
          </header>

          <div className="mt-10 space-y-4">
            <StatStrip stats={composition.stats} />
            <KeyTakeaways items={composition.takeaways} />
          </div>

          <div className="mt-12 space-y-10">
            {article.sections.map((section) => (
              <section
                key={section.heading}
                aria-label={section.heading}
                id={slugify(section.heading)}
              >
                <h2 className="heading-lg text-content-raise">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="mt-4 text-pretty text-sans-md leading-relaxed text-content-secondary"
                  >
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((bullet) => (
                      <li
                        key={bullet.slice(0, 40)}
                        className="flex gap-2.5 text-sm leading-relaxed text-content-secondary"
                      >
                        <span aria-hidden="true" className="mt-0.5 font-mono text-content-accent">
                          ▸
                        </span>
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-14 max-w-5xl space-y-4">
          <p className="text-mono-xs text-content-tertiary">THE NUMBERS, VISUALIZED</p>
          {composition.charts}
        </div>

        <div className="mx-auto mt-12 max-w-5xl space-y-8">
          <ComparisonTable
            headers={composition.comparison.headers}
            rows={composition.comparison.rows}
            caption={composition.comparison.caption}
            emphasizeColumn={
              "emphasizeColumn" in composition.comparison
                ? composition.comparison.emphasizeColumn
                : undefined
            }
          />
          {"pipeline" in composition && (
            <section aria-label="CI verification pipeline">
              <p className="text-mono-xs text-content-tertiary">CI VERIFICATION PIPELINE</p>
              <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {composition.pipeline.map((stage, index) => (
                  <li
                    key={stage.step}
                    className="rounded-tremor-default border border-stroke-default bg-surface-raise p-4"
                  >
                    <p className="font-mono text-content-accent">
                      {String(index + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-2 text-sm font-medium text-content-default">{stage.step}</p>
                    <p className="mt-1 text-xs leading-relaxed text-content-secondary">
                      {stage.detail}
                    </p>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          <FaqSection faq={article.faq} />
          <SourcesNote mdPath={withBasePath(`/sources/analysis/${article.slug}.md`)} />
          <ArticleCta next={{ title: next.title, href: `/journal/${next.slug}` }} />
        </div>
      </div>
    </main>
  )
}

/** Client-side navigation to an unknown slug — same brand voice as 404.html. */
function NotFoundFallback({ slug }: { slug: string }) {
  useHead({
    title: "Article not found | FAME Protocol",
    description: "The requested research article does not exist.",
    canonicalPath: "/journal",
    ogType: "website",
  })
  return (
    <main id="main" className="border-b border-stroke-default">
      <section className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-start justify-center px-4 py-24">
        <p className="text-mono-xs text-content-notice">HTTP 404 · ARTICLE NOT FOUND</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-content-raise">
          No article “{slug}”.
        </h1>
        <p className="mt-4 max-w-md text-content-secondary">
          The requested research piece is not part of the journal. The index below lists everything
          that is.
        </p>
        <a
          href="/journal"
          className="mt-8 inline-flex min-h-11 items-center rounded-tremor-default bg-surface-accent-inverse px-6 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
        >
          ← Back to the journal
        </a>
      </section>
    </main>
  )
}
