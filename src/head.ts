import { useEffect } from "preact/hooks"

/**
 * Client-side head manager. The static shells carry per-route meta baked at
 * build time (for crawlers and no-JS agents); this hook keeps the document
 * head in sync across client-side navigations so in-app state never diverges
 * from the address bar.
 */

export type HeadSpec = {
  title: string
  description: string
  /** Canonical path relative to the deployment root, e.g. "/journal". */
  canonicalPath: string
  ogType: "website" | "article"
  ogTitle?: string
  ogDescription?: string
  publishedTime?: string
  modifiedTime?: string
  tags?: readonly string[]
  /** JSON-LD @graph serialized for this route. */
  jsonLd?: string
  /** rel=alternate type=text/markdown href (public path, base included). */
  markdownAlternate?: string
}

const BASE_PATH = (
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_BASE_PATH ?? ""
).replace(/\/+$/, "")
const SITE_URL = (
  (import.meta as { env?: Record<string, string | undefined> }).env?.VITE_SITE_URL ??
  "https://fairmeme3.github.io"
).replace(/\/+$/, "")

function upsertMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement("meta")
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.setAttribute("content", content)
}

export function useHead(spec: HeadSpec): void {
  useEffect(() => {
    const absolute = `${SITE_URL}${BASE_PATH}${spec.canonicalPath}`

    document.title = spec.title
    upsertMeta('meta[name="description"]', "name", "description", spec.description)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement("link")
      canonical.rel = "canonical"
      document.head.appendChild(canonical)
    }
    canonical.href = absolute

    upsertMeta('meta[property="og:title"]', "property", "og:title", spec.ogTitle ?? spec.title)
    upsertMeta(
      'meta[property="og:description"]',
      "property",
      "og:description",
      spec.ogDescription ?? spec.description,
    )
    upsertMeta('meta[property="og:type"]', "property", "og:type", spec.ogType)
    upsertMeta('meta[property="og:url"]', "property", "og:url", absolute)

    if (spec.ogType === "article") {
      if (spec.publishedTime) {
        upsertMeta(
          'meta[property="article:published_time"]',
          "property",
          "article:published_time",
          spec.publishedTime,
        )
      }
      if (spec.modifiedTime) {
        upsertMeta(
          'meta[property="article:modified_time"]',
          "property",
          "article:modified_time",
          spec.modifiedTime,
        )
      }
    }

    let markdown = document.head.querySelector<HTMLLinkElement>(
      'link[rel="alternate"][type="text/markdown"]',
    )
    if (spec.markdownAlternate) {
      if (!markdown) {
        markdown = document.createElement("link")
        markdown.rel = "alternate"
        markdown.type = "text/markdown"
        document.head.appendChild(markdown)
      }
      markdown.href = spec.markdownAlternate
    } else if (markdown) {
      markdown.remove()
    }

    let ld = document.getElementById("fame-route-ld")
    if (!spec.jsonLd) {
      ld?.remove()
    } else {
      if (!ld) {
        ld = document.createElement("script")
        ld.id = "fame-route-ld"
        ;(ld as HTMLScriptElement).type = "application/ld+json"
        document.head.appendChild(ld)
      }
      ld.textContent = spec.jsonLd
    }
  }, [
    spec.title,
    spec.description,
    spec.canonicalPath,
    spec.ogType,
    spec.ogTitle,
    spec.ogDescription,
    spec.publishedTime,
    spec.modifiedTime,
    spec.jsonLd,
    spec.markdownAlternate,
  ])
}
