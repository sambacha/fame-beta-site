"use client"

import { Tabs } from "@base-ui-components/react/tabs"
import { usePersona } from "@/components/persona-context"

const NAV_LINKS = [
  { href: "#stability", label: "Stability" },
  { href: "#build", label: "Build" },
  { href: "#research", label: "Research" },
]

/**
 * Sticky Oxide-style top bar. The Institutional/Retail switch is a Base-UI
 * Tabs primitive: roving tabindex, arrow-key navigation and data-selected
 * styling — the persona re-announces through the provider's live region.
 */
export function Nav() {
  const { persona, setPersona } = usePersona()

  return (
    <header className="sticky top-0 z-50 border-b border-stroke-dim bg-surface-dim/85 backdrop-bar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a
          href="#top"
          className="flex min-h-11 items-center gap-2 font-mono text-lg font-semibold tracking-tight text-content-primary"
          aria-label="FAME Protocol home"
        >
          FAME<span className="text-brand-green">{"//"}</span>
        </a>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="inline-flex min-h-11 items-center rounded-tremor-default px-3 font-mono text-sm text-content-secondary transition-colors hover:text-brand-green"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Tabs.Root
            value={persona}
            onValueChange={(value) => {
              if (value === "institutional" || value === "retail") setPersona(value)
            }}
          >
            <Tabs.List
              aria-label="Content perspective"
              className="grid grid-flow-col auto-cols-fr rounded-tremor-default border border-stroke-dim bg-surface-inset p-1"
            >
              <Tabs.Tab
                value="institutional"
                className="min-h-11 cursor-pointer rounded-sm px-3 font-mono text-xs tracking-wide text-content-secondary transition-colors data-[selected]:bg-brand-green/15 data-[selected]:text-brand-green sm:px-4"
              >
                Institutional
              </Tabs.Tab>
              <Tabs.Tab
                value="retail"
                className="min-h-11 cursor-pointer rounded-sm px-3 font-mono text-xs tracking-wide text-content-secondary transition-colors data-[selected]:bg-brand-green/15 data-[selected]:text-brand-green sm:px-4"
              >
                Retail
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          <a
            href="#access"
            className="hidden min-h-11 items-center rounded-tremor-default bg-brand-green px-4 text-sm font-semibold text-surface-inset transition-colors hover:bg-brand-green-emphasis sm:inline-flex"
          >
            Request access
          </a>
        </div>
      </div>
    </header>
  )
}
