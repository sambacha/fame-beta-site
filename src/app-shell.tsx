import type { ComponentChild } from "preact"
import { Footer } from "@/components/footer"
import { Nav } from "@/components/nav"
import { PersonaProvider } from "@/components/persona-context"
import { SectionBoundary } from "@/components/section-boundary"
import { Toaster } from "@/components/ui/toaster"
import { HomePage } from "@/pages/home"
import { JournalArticlePage } from "@/pages/journal-article"
import { JournalIndexPage } from "@/pages/journal-index"
import { NotFoundPage } from "@/pages/not-found"
import { RouterContext, useRoute, useScrollRestoration } from "@/router"

/**
 * FAME Protocol — client-side application shell. Every route renders inside
 * this tree; the static HTML shells carry only meta/JSON-LD (baked at build
 * time) plus this mount point.
 */
export function App() {
  const route = useRoute()
  useScrollRestoration()

  let page: ComponentChild
  switch (route.name) {
    case "home":
      page = <HomePage />
      break
    case "journal":
      page = <JournalIndexPage />
      break
    case "article":
      page = <JournalArticlePage slug={route.slug} />
      break
    default:
      page = <NotFoundPage path={route.path} />
  }

  return (
    <RouterContext.Provider value={route}>
      <PersonaProvider>
        <a
          href="#main"
          className="skip-link rounded-tremor-default bg-surface-accent-inverse px-4 py-2 text-mono-sm text-content-inverse"
        >
          Skip to main content
        </a>
        <Nav />
        {page}
        <Footer />
      </PersonaProvider>
      <Toaster />
    </RouterContext.Provider>
  )
}

export { SectionBoundary }
