import { useHead } from "@/head"
import { SITE } from "@/lib/seo"
import { Link } from "@/router"

/**
 * Branded 404 — served as `dist/404.html` by GitHub Pages and Cloudflare
 * Pages for unmatched routes (and rendered client-side for bad in-app
 * navigations). The static shell carries the same heading as no-JS fallback.
 */
export function NotFoundPage({ path = "" }: { path?: string }) {
  useHead({
    title: "Page not found | FAME Protocol",
    description: "The slot you requested is not part of the ledger.",
    canonicalPath: "/",
    ogType: "website",
  })

  return (
    <main id="main">
      <section className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-start justify-center px-4 py-24">
        <p className="text-mono-xs text-content-notice">HTTP 404 · SLOT NOT FOUND</p>
        <h1 className="mt-4 text-4xl font-medium tracking-tight text-content-raise sm:text-5xl">
          This page never settled.
        </h1>
        <p className="mt-4 max-w-md text-content-secondary">
          {path ? (
            <>
              <code className="font-mono text-sm text-content-tertiary">{path}</code> is not part of
              the ledger.
            </>
          ) : (
            "The slot you requested is not part of the ledger."
          )}{" "}
          The main curve is still live — every route below settles back to the homepage.
        </p>
        <ul className="mt-8 flex flex-wrap gap-3">
          <li>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center rounded-tremor-default bg-surface-accent-inverse px-6 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
            >
              ← Back to the main curve
            </Link>
          </li>
          <li>
            <Link
              href="/#build"
              className="inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-raise px-6 font-mono text-sm text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-default"
            >
              Open the order builder
            </Link>
          </li>
        </ul>
        <p className="mt-6 font-mono text-[11px] text-content-tertiary">{SITE.tagline}</p>
      </section>
    </main>
  )
}
