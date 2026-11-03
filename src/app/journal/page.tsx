import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumb } from "@/components/analysis/primitives"
import { ARTICLES } from "@/lib/blog-content"
import { buildBreadcrumbLd, SITE, withBasePath } from "@/lib/seo"

export const metadata: Metadata = {
  title: "Research journal",
  description:
    "FAME Protocol research: how the liquidity ratio and emission cap are enforced, and what formal verification honestly covers. Markdown mirrors ship with every piece.",
  alternates: {
    canonical: "/journal",
    types: { "text/plain": withBasePath("/llms.txt") },
  },
  openGraph: {
    type: "website",
    url: "/journal",
    siteName: SITE.name,
    title: "FAME Protocol — Research journal",
    description:
      "How the risk engine and the proof set actually work, written for people who verify.",
    images: [
      { url: SITE.ogImage, width: 1200, height: 630, alt: "FAME Protocol research journal" },
    ],
  },
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}

const HIGHLIGHTS: Record<string, string[]> = {
  "liquidity-ratios-emission-caps": ["1.20 floor", "1.10 breaker", "1.0B immutable cap"],
  "formal-verification-defi-safety": ["214 invariants", "CI-gated proofs", "48h timelock"],
}

export default function JournalIndexPage() {
  const breadcrumbLd = JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      buildBreadcrumbLd([
        { name: "Home", path: "/" },
        { name: "Research journal", path: "/journal" },
      ]),
      {
        "@type": "CollectionPage",
        "@id": `${SITE.url}/journal#page`,
        name: "FAME Protocol — Research journal",
        url: `${SITE.url}/journal`,
        isPartOf: { "@id": `${SITE.url}/#website` },
        publisher: { "@id": `${SITE.url}/#org` },
      },
    ],
  })

  return (
    <main id="main" className="border-b border-stroke-default">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: breadcrumbLd }} />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-3xl">
          <Breadcrumb
            trail={[
              { name: "Home", href: "/" },
              { name: "Research journal", href: "/journal" },
            ]}
          />
          <header className="mt-8">
            <p className="text-mono-xs text-content-accent">RESEARCH JOURNAL</p>
            <h1 className="mt-3 text-3xl font-medium tracking-tight text-content-raise sm:text-4xl">
              Read the risk engine before you trust it.
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-lg leading-relaxed text-content-secondary">
              Long-form analysis with the numbers visualized — every piece ships with its own
              charts, comparison matrices and a markdown mirror for research agents.
            </p>
          </header>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/journal/${article.slug}`}
              className="group flex min-h-11 flex-col rounded-tremor-default border border-stroke-default bg-surface-raise p-6 shadow-border-small transition-colors hover:border-stroke-accent-quaternary hover:bg-surface-hover"
            >
              <p className="font-mono text-[11px] text-content-tertiary">
                {formatDate(article.datePublished)} · {article.readMinutes} min read
              </p>
              <h2 className="mt-3 text-xl font-medium leading-snug text-content-raise">
                {article.title}
              </h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-content-secondary">
                {article.description}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {(HIGHLIGHTS[article.slug] ?? []).map((item) => (
                  <li
                    key={item}
                    className="rounded-tremor-small border border-stroke-default bg-surface-secondary px-2 py-1 font-mono text-[11px] text-content-accent"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center gap-2 font-mono text-sm text-content-accent-secondary group-hover:text-content-accent">
                Read analysis →
                <span className="text-content-tertiary group-hover:text-content-secondary">
                  · markdown mirror included
                </span>
              </span>
            </Link>
          ))}
        </div>

        <aside
          aria-label="Agent sources"
          className="mx-auto mt-10 max-w-3xl rounded-tremor-default border border-stroke-default bg-surface-secondary p-4"
        >
          <p className="text-mono-xs text-content-tertiary">FOR RESEARCH AGENTS</p>
          <p className="mt-2 text-xs leading-relaxed text-content-secondary">
            Every indexable page ships a markdown mirror, a{" "}
            <a href={withBasePath("/llms.txt")} type="text/plain" className="accent-link">
              llms.txt index
            </a>{" "}
            and a{" "}
            <a href={withBasePath("/llms-full.txt")} type="text/plain" className="accent-link">
              llms-full.txt
            </a>{" "}
            aggregate — read the canonical content without rendering JavaScript.
          </p>
        </aside>
      </div>
    </main>
  )
}
