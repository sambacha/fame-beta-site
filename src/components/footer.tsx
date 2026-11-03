import { SITE } from "@/lib/seo"

/**
 * Footer — sticks to the bottom of short viewports (mt-auto inside the
 * layout's min-h-dvh flex column) and is pushed down naturally on long ones.
 * Safe-area inset keeps it clear of the iOS home indicator.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-stroke-dim bg-surface-inset pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-mono text-lg font-semibold tracking-tight">
            FAME<span className="text-brand-green">{"//"}</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-content-faint">{SITE.tagline}</p>
          <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-content-faint">
            <span
              className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-brand-green"
              aria-hidden="true"
            />
            All systems nominal · slot 284,119,204
          </p>
        </div>

        <nav aria-label="Research">
          <p className="font-mono text-xs uppercase tracking-widest text-content-faint">Research</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a
                href="#research"
                className="inline-flex min-h-8 items-center text-content-secondary hover:text-brand-green"
              >
                Journal
              </a>
            </li>
            <li>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-8 items-center text-content-secondary hover:text-brand-green"
              >
                GitHub — fame-program
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Protocol">
          <p className="font-mono text-xs uppercase tracking-widest text-content-faint">Protocol</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <a
                href="#stability"
                className="inline-flex min-h-8 items-center text-content-secondary hover:text-brand-green"
              >
                Safety model
              </a>
            </li>
            <li>
              <a
                href="#build"
                className="inline-flex min-h-8 items-center text-content-secondary hover:text-brand-green"
              >
                Parametric order flow
              </a>
            </li>
            <li>
              <a
                href="#access"
                className="inline-flex min-h-8 items-center text-content-secondary hover:text-brand-green"
              >
                Request access
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-stroke-dim/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-content-faint sm:px-6">
          <span>© 2026 FAME Protocol. Figures illustrative — verify from primary sources.</span>
          <span>Formal verification: CI-gated · mint authority: burned</span>
        </div>
      </div>
    </footer>
  )
}
