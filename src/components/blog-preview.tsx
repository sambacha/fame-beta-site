"use client"

import { Dialog } from "@base-ui-components/react/dialog"
import { Badge } from "@tremor/react"
import { ARTICLES, type Article } from "@/lib/blog-content"

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`))
}

/**
 * Full article reader inside an accessible Base-UI Dialog: focus-trapped,
 * modal-labelled, and the long body scrolls in a thin custom scrollbar
 * region capped at 85dvh.
 */
function ArticleDialog({ article }: { article: Article }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="group flex h-full min-h-11 cursor-pointer flex-col rounded-tremor-default border border-stroke-dim bg-surface-base p-6 text-left transition-colors hover:border-brand-green/50">
        <p className="font-mono text-[11px] uppercase tracking-widest text-content-faint">
          {formatDate(article.datePublished)} · {article.readMinutes} min read
        </p>
        <h3 className="mt-3 text-xl font-semibold leading-snug text-content-primary transition-colors group-hover:text-brand-green">
          {article.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-content-secondary">
          {article.description}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {article.keywords.slice(0, 3).map((keyword) => (
            <Badge key={keyword} color="gray" className="!rounded-tremor-small font-mono">
              {keyword}
            </Badge>
          ))}
        </div>
        <span className="mt-5 inline-flex items-center font-mono text-sm text-brand-green">
          Read analysis →
        </span>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 flex max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-tremor-default border border-stroke-dim bg-surface-base shadow-tremor-dropdown">
          <header className="flex items-start justify-between gap-4 border-b border-stroke-dim p-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-brand-green">
                FAME Protocol Research
              </p>
              <Dialog.Title className="mt-2 text-xl font-semibold leading-snug text-content-primary">
                {article.title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-content-secondary">
                {article.lead}
              </Dialog.Description>
              <p className="mt-3 font-mono text-[11px] text-content-faint">
                {formatDate(article.datePublished)} · updated {formatDate(article.dateModified)} ·{" "}
                {article.readMinutes} min
              </p>
            </div>
            <Dialog.Close
              aria-label="Close article"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-tremor-default border border-stroke-dim text-content-secondary transition-colors hover:border-brand-green hover:text-brand-green"
            >
              <span aria-hidden="true">✕</span>
            </Dialog.Close>
          </header>

          <div className="scroll-area overflow-y-auto p-6">
            <article className="max-w-prose space-y-8">
              {article.sections.map((section) => (
                <section key={section.heading} aria-label={section.heading}>
                  <h2 className="text-lg font-semibold text-content-primary">{section.heading}</h2>
                  {section.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.slice(0, 40)}
                      className="mt-3 text-sm leading-relaxed text-content-secondary"
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
                          <span aria-hidden="true" className="mt-0.5 text-brand-green">
                            ▸
                          </span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}

              <section aria-label="Frequently asked questions">
                <h2 className="text-lg font-semibold text-content-primary">FAQ</h2>
                {article.faq.map((item) => (
                  <div key={item.q} className="mt-4">
                    <h3 className="text-sm font-semibold text-content-primary">{item.q}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-content-secondary">
                      {item.a}
                    </p>
                  </div>
                ))}
              </section>

              <footer className="border-t border-stroke-dim pt-5">
                <p className="text-sm text-content-secondary">
                  Evaluate the guarantees yourself: recompute the liquidity ratio from program
                  accounts and re-run the invariant set from the public repository.
                </p>
                <a
                  href="#access"
                  className="mt-4 inline-flex min-h-11 items-center rounded-tremor-default bg-brand-green px-5 text-sm font-semibold text-surface-inset transition-colors hover:bg-brand-green-emphasis"
                >
                  Request access
                </a>
              </footer>
            </article>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export function BlogPreview() {
  return (
    <section id="research" aria-labelledby="research-title" className="cv-auto">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="font-mono text-xs tracking-[0.25em] text-brand-green">RESEARCH JOURNAL</p>
        <h2
          id="research-title"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-content-primary sm:text-4xl"
        >
          Read the risk engine before you trust it.
        </h2>
        <p className="mt-4 max-w-2xl text-content-secondary">
          Two pieces distilled from the protocol documentation — how the liquidity ratio and
          emission cap are enforced, and what formal verification honestly covers.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {ARTICLES.map((article) => (
            <ArticleDialog key={article.slug} article={article} />
          ))}
        </div>
      </div>
    </section>
  )
}
