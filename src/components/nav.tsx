"use client"

import { Tabs } from "@base-ui-components/react/tabs"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePersona } from "@/components/persona-context"

const NAV_LINKS = [
  { href: "/#stability", label: "Stability" },
  { href: "/#build", label: "Build" },
  { href: "/journal", label: "Research" },
]

/**
 * Sticky Oxide-style top bar. Hover shifts text one tier up (never recolors
 * to accent); the Institutional/Retail switch is a Base-UI Tabs primitive with
 * the accent-wash selected state.
 */
export function Nav() {
  const { persona, setPersona } = usePersona()
  const pathname = usePathname()
  const isHome = pathname === "/"

  return (
    <header className="sticky top-0 z-50 border-b border-stroke-default bg-surface-default/85 backdrop-bar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2 font-mono text-lg font-medium tracking-tight text-content-raise"
          aria-label="FAME Protocol home"
        >
          FAME<span className="text-content-accent">{"//"}</span>
        </Link>

        <nav aria-label="Primary" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = link.href === "/journal" && !isHome
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={`inline-flex min-h-11 items-center rounded-tremor-default px-3 font-mono text-sm transition-colors hover:text-content-default ${
                      active ? "text-content-accent" : "text-content-secondary"
                    }`}
                  >
                    {link.label}
                  </Link>
                </li>
              )
            })}
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
              className="grid auto-cols-fr grid-flow-col rounded-tremor-default border border-stroke-default bg-surface-secondary p-1"
            >
              <Tabs.Tab
                value="institutional"
                className="min-h-11 cursor-pointer rounded-sm px-3 text-mono-xs text-content-secondary transition-colors hover:text-content-default data-[selected]:bg-surface-accent data-[selected]:text-content-accent sm:px-4"
              >
                Institutional
              </Tabs.Tab>
              <Tabs.Tab
                value="retail"
                className="min-h-11 cursor-pointer rounded-sm px-3 text-mono-xs text-content-secondary transition-colors hover:text-content-default data-[selected]:bg-surface-accent data-[selected]:text-content-accent sm:px-4"
              >
                Retail
              </Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>

          <Link
            href="/#access"
            className="hidden min-h-11 items-center rounded-tremor-default bg-surface-accent-inverse px-4 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover sm:inline-flex"
          >
            Request access
          </Link>
        </div>
      </div>
    </header>
  )
}
