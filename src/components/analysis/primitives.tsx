import Link from "next/link"
import type { ReactNode } from "react"
import { withBasePath } from "@/lib/seo"

/**
 * Shared primitives for the journal analysis pages — the Oxide layer:
 * mono eyebrows, hairline panels, tier-based text, no hover text-recolor.
 * All classes resolve through the @oxide/design-system bridge in globals.css.
 */

export function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="text-mono-xs text-content-accent">{children}</p>
}

export function Breadcrumb({ trail }: { trail: { name: string; href: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-mono-xs text-content-tertiary">
      <ol className="flex flex-wrap items-center gap-2">
        {trail.map((crumb, index) => (
          <li key={crumb.href} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="text-content-quaternary">
                /
              </span>
            )}
            {index < trail.length - 1 ? (
              <Link href={crumb.href} className="normal-case hover:text-content-default">
                {crumb.name}
              </Link>
            ) : (
              <span aria-current="page" className="normal-case text-content-secondary">
                {crumb.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}

export function StatStrip({
  stats,
}: {
  stats: readonly { label: string; value: string; hint: string }[]
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <li
          key={stat.label}
          className="rounded-tremor-default border border-stroke-default bg-surface-raise p-4 shadow-border-small"
        >
          <p className="text-mono-xs text-content-tertiary">{stat.label}</p>
          <p className="mt-2 font-mono text-2xl font-medium tracking-tight text-content-raise tabular-nums">
            {stat.value}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-content-secondary">{stat.hint}</p>
        </li>
      ))}
    </ul>
  )
}

export function KeyTakeaways({ items }: { items: readonly string[] }) {
  return (
    <section
      aria-label="Key takeaways"
      className="rounded-tremor-default border border-stroke-accent-quaternary bg-surface-accent/40 p-6"
    >
      <p className="text-mono-xs text-content-accent">KEY TAKEAWAYS</p>
      <ol className="mt-4 space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex gap-3 text-sm leading-relaxed text-content-secondary">
            <span aria-hidden="true" className="font-mono text-content-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}

export type ComparisonRow = (string | { dimension: string; value?: undefined })[]

/**
 * Side-by-side comparison matrix. First column is the dimension, the rest are
 * the compared subjects. Hairline strokes; the emphasized column (FAME) is
 * marked with the accent tier plus a dot — never color alone (the header and
 * first cell carry the text cue).
 */
export function ComparisonTable({
  headers,
  rows,
  caption,
  emphasizeColumn,
}: {
  headers: readonly string[]
  rows: readonly { dimension: string; values: readonly string[] }[]
  caption: string
  emphasizeColumn?: number
}) {
  return (
    <figure>
      <div className="scroll-area overflow-x-auto rounded-tremor-default border border-stroke-default">
        <table className="w-full min-w-[42rem] border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="bg-surface-secondary">
              {headers.map((header, index) => (
                <th
                  key={header}
                  scope="col"
                  className={`border-b border-stroke-default px-4 py-3 text-mono-xs ${
                    index === emphasizeColumn ? "text-content-accent" : "text-content-tertiary"
                  }`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.dimension} className="border-b border-stroke-secondary last:border-b-0">
                <th
                  scope="row"
                  className="px-4 py-3 align-top text-sm font-medium leading-relaxed text-content-default"
                >
                  {emphasizeColumn !== undefined && (
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-content-accent"
                    />
                  )}
                  {row.dimension}
                </th>
                {row.values.map((value, columnIndex) => (
                  <td
                    key={headers[columnIndex + 1] ?? columnIndex}
                    className={`px-4 py-3 align-top text-sm leading-relaxed ${
                      columnIndex + 1 === emphasizeColumn
                        ? "text-content-secondary"
                        : "text-content-tertiary"
                    }`}
                  >
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-content-tertiary">
        {caption}
      </figcaption>
    </figure>
  )
}

export function FaqSection({ faq }: { faq: { q: string; a: string }[] }) {
  return (
    <section aria-labelledby="faq-title">
      <h2 id="faq-title" className="heading-lg text-content-raise">
        FAQ
      </h2>
      <dl className="mt-6 space-y-6">
        {faq.map((item) => (
          <div key={item.q} className="border-l-2 border-stroke-accent-quaternary pl-4">
            <dt className="text-sm font-medium text-content-default">{item.q}</dt>
            <dd className="mt-1.5 text-sm leading-relaxed text-content-secondary">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** Links to the markdown mirror + plain-text sources of this page. */
export function SourcesNote({ mdPath }: { mdPath: string }) {
  return (
    <aside
      aria-label="Machine-readable sources"
      className="rounded-tremor-default border border-stroke-default bg-surface-secondary p-4"
    >
      <p className="text-mono-xs text-content-tertiary">READ AS DATA</p>
      <p className="mt-2 text-xs leading-relaxed text-content-secondary">
        This page ships markdown mirrors for search engines and research agents:
      </p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs">
        <li>
          <a href={mdPath} type="text/markdown" className="accent-link text-mono-xs">
            markdown source
          </a>
        </li>
        <li>
          <a
            href={withBasePath("/llms.txt")}
            type="text/plain"
            className="accent-link text-mono-xs"
          >
            llms.txt index
          </a>
        </li>
        <li>
          <a
            href={withBasePath("/llms-full.txt")}
            type="text/plain"
            className="accent-link text-mono-xs"
          >
            llms-full.txt
          </a>
        </li>
      </ul>
    </aside>
  )
}

export function ArticleCta({ next }: { next?: { title: string; href: string } }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-stroke-default pt-6">
      <Link
        href="/#access"
        className="inline-flex min-h-11 items-center rounded-tremor-default bg-surface-accent-inverse px-5 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
      >
        Request access
      </Link>
      {next && (
        <Link
          href={next.href}
          className="inline-flex min-h-11 items-center text-mono-sm text-content-accent-secondary hover:text-content-accent"
        >
          Next: {next.title} →
        </Link>
      )}
    </footer>
  )
}
