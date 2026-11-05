import { ARTICLES } from "@/lib/blog-content"
import { Link } from "@/router"

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

/**
 * Research journal preview — cards navigate to the dedicated analysis pages
 * (/journal/<slug>), each carrying its own charts, comparison tables and a
 * markdown mirror. The old in-dialog reader is gone: pages index, dialogs
 * don't.
 */
export function BlogPreview() {
  return (
    <section id="research" aria-labelledby="research-title" className="cv-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-mono-xs text-content-accent">RESEARCH JOURNAL</p>
        <h2
          id="research-title"
          className="mt-3 max-w-3xl text-3xl font-medium tracking-tight text-content-raise sm:text-4xl"
        >
          Read the risk engine before you trust it.
        </h2>
        <p className="mt-4 max-w-2xl text-content-secondary">
          Two pieces distilled from the protocol documentation — each on its own page with charts,
          comparison tables and a markdown mirror for research agents.
        </p>

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
              <h3 className="mt-3 text-xl font-medium leading-snug text-content-raise">
                {article.title}
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-content-secondary">
                {article.description}
              </p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {(HIGHLIGHTS[article.slug] ?? article.keywords.slice(0, 3)).map((keyword) => (
                  <li
                    key={keyword}
                    className="rounded-tremor-small border border-stroke-default bg-surface-secondary px-2 py-1 font-mono text-[11px] text-content-accent"
                  >
                    {keyword}
                  </li>
                ))}
              </ul>
              <span className="mt-5 inline-flex items-center font-mono text-sm text-content-accent-secondary group-hover:text-content-accent">
                Read analysis →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
