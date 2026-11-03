import Link from "next/link"

/**
 * Branded 404 — statically exported as `out/404.html`, which both GitHub Pages
 * and Cloudflare Pages serve automatically for unmatched routes.
 */
export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col items-start justify-center px-4 py-24">
      <p className="font-mono text-xs tracking-[0.25em] text-brand-amber">
        HTTP 404 · SLOT NOT FOUND
      </p>
      <h1 className="mt-4 text-4xl font-semibold tracking-tight text-content-primary sm:text-5xl">
        This page never settled.
      </h1>
      <p className="mt-4 max-w-md text-content-secondary">
        The slot you requested is not part of the ledger. The main curve is still live — every route
        below settles back to the homepage.
      </p>
      <ul className="mt-8 flex flex-wrap gap-3">
        <li>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center rounded-tremor-default bg-brand-green px-6 text-sm font-semibold text-surface-inset transition-colors hover:bg-brand-green-emphasis"
          >
            ← Back to the main curve
          </Link>
        </li>
        <li>
          <Link
            href="/#build"
            className="inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-strong px-6 font-mono text-sm text-content-secondary transition-colors hover:border-brand-green hover:text-brand-green"
          >
            Open the order builder
          </Link>
        </li>
      </ul>
    </section>
  )
}
