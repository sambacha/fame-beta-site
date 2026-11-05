import { SITE, withBasePath } from "@/lib/seo"
import { Link } from "@/router"

/**
 * Footer — sticks to the bottom of short viewports (mt-auto inside the
 * layout's min-h-dvh flex column). Links: research pages, machine-readable
 * sources for agents, and the protocol anchors on the home route.
 */
export function Footer() {
  return (
    <footer className="mt-auto border-t border-stroke-default bg-surface-secondary pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div>
          <p className="font-mono text-lg font-medium tracking-tight text-content-raise">
            FAME<span className="text-content-accent">{"//"}</span>
          </p>
          <p className="mt-2 max-w-xs text-sm text-content-tertiary">{SITE.tagline}</p>
          <p className="mt-4 flex items-center gap-2 font-mono text-[11px] text-content-tertiary">
            <span
              className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-content-accent"
              aria-hidden="true"
            />
            All systems nominal · slot 284,119,204
          </p>
        </div>

        <nav aria-label="Research">
          <p className="text-mono-xs text-content-tertiary">RESEARCH</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link
                href="/journal"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                Journal
              </Link>
            </li>
            <li>
              <Link
                href="/journal/liquidity-ratios-emission-caps"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                Liquidity ratios &amp; emission caps
              </Link>
            </li>
            <li>
              <Link
                href="/journal/formal-verification-defi-safety"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                Formal verification as a safety layer
              </Link>
            </li>
            <li>
              <a
                href={SITE.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                GitHub — fame-program
              </a>
            </li>
          </ul>
        </nav>

        <nav aria-label="Protocol and sources">
          <p className="text-mono-xs text-content-tertiary">PROTOCOL</p>
          <ul className="mt-3 space-y-1 text-sm">
            <li>
              <Link
                href="/#stability"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                Safety model
              </Link>
            </li>
            <li>
              <Link
                href="/#build"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                Parametric order flow
              </Link>
            </li>
            <li>
              <Link
                href="/#access"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                Request access
              </Link>
            </li>
            <li>
              <a
                href={withBasePath("/llms.txt")}
                type="text/plain"
                className="inline-flex min-h-11 items-center text-content-secondary transition-colors hover:text-content-default"
              >
                llms.txt — sources for agents
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-stroke-secondary">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 font-mono text-[11px] text-content-tertiary sm:px-6">
          <span>© 2026 FAME Protocol. Figures illustrative — verify from primary sources.</span>
          <span>Formal verification: CI-gated · mint authority: burned</span>
        </div>
      </div>
    </footer>
  )
}
