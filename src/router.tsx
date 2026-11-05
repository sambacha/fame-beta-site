import type { ComponentChildren, JSX } from "preact"
import { createContext, useContext, useEffect, useState } from "preact/compat"

/**
 * Tiny history-API router — the whole app is client-side, so routing is a
 * pathname parse + popstate subscription. The deployment base path (set at
 * build time) is stripped before matching; unknown paths fall through to the
 * branded 404 (this is also how `404.html` deep links resolve).
 */

const BASE_PATH = (
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_BASE_PATH ?? ""
).replace(/\/+$/, "")

export type Route =
  | { name: "home" }
  | { name: "journal" }
  | { name: "article"; slug: string }
  | { name: "not-found"; path: string }

/** Strip the deployment base path, then normalize to an internal path. */
export function currentPath(): string {
  const pathname = window.location.pathname
  if (BASE_PATH !== "") {
    if (pathname === BASE_PATH) return "/"
    if (pathname.startsWith(`${BASE_PATH}/`)) return pathname.slice(BASE_PATH.length)
  }
  return pathname
}

export function parseRoute(path: string): Route {
  const normalized = path.replace(/\/+$/, "") || "/"
  if (normalized === "/") return { name: "home" }
  if (normalized === "/journal") return { name: "journal" }
  const article = normalized.match(/^\/journal\/([a-z0-9-]+)$/)
  if (article) return { name: "article", slug: article[1] }
  return { name: "not-found", path: normalized }
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseRoute(currentPath()))

  useEffect(() => {
    const sync = () => setRoute(parseRoute(currentPath()))
    window.addEventListener("popstate", sync)
    window.addEventListener("fame:navigate", sync)
    return () => {
      window.removeEventListener("popstate", sync)
      window.removeEventListener("fame:navigate", sync)
    }
  }, [])

  return route
}

/** Client-side navigation: pushState + re-render + scroll restoration. */
export function navigate(href: string, { replace = false } = {}): void {
  const url = href.startsWith(BASE_PATH) ? href : `${BASE_PATH}${href}`
  if (replace) window.history.replaceState(null, "", url)
  else window.history.pushState(null, "", url)
  window.dispatchEvent(new Event("fame:navigate"))
}

type LinkProps = {
  href: string
  className?: string
  children: ComponentChildren
  ariaLabel?: string
  ariaCurrent?: "page" | true | "location"
  target?: string
  rel?: string
  type?: string
}

/**
 * Internal link that intercepts plain left-clicks and routes client-side.
 * Modifier-clicks, external URLs and hash-only hrefs keep native behaviour
 * (middle-click, cmd-click and pure anchors never navigate).
 */
export function Link({
  href,
  className,
  children,
  ariaLabel,
  ariaCurrent,
  target,
  rel,
  type,
}: LinkProps) {
  const isHashOnly = href.startsWith("#")
  const isExternal = /^[a-z]+:/i.test(href)

  const onClick = (event: JSX.TargetedMouseEvent<HTMLAnchorElement>) => {
    if (isHashOnly || isExternal || target === "_blank") return
    if (event.defaultPrevented) return
    if (event.button !== 0) return
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    // Same-document anchors ("/#build") stay on the page and scroll.
    const hashIndex = href.indexOf("#")
    if (hashIndex > 0) {
      const current = currentPath()
      if (href.slice(0, hashIndex) === (current === "" ? "/" : current)) {
        window.history.pushState(null, "", `${BASE_PATH}${href}`)
        window.dispatchEvent(new Event("fame:navigate"))
        document.getElementById(href.slice(hashIndex + 1))?.scrollIntoView({ behavior: "smooth" })
        return
      }
    }
    navigate(href)
  }

  return (
    <a
      href={href.startsWith(BASE_PATH) || isHashOnly || isExternal ? href : `${BASE_PATH}${href}`}
      class={className}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      target={target}
      rel={rel}
      type={type}
      onClick={onClick}
    >
      {children}
    </a>
  )
}

/** Scroll management: top on page change, hash target when a hash is present. */
export function useScrollRestoration(): void {
  useEffect(() => {
    const hash = window.location.hash
    if (hash.length > 1) {
      document.getElementById(hash.slice(1))?.scrollIntoView()
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior })
    }
  }, [])
}

export const RouterContext = createContext<Route>({ name: "home" })

export function useRouter(): Route {
  return useContext(RouterContext)
}
