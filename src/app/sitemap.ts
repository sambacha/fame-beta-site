import type { MetadataRoute } from "next"
import { ARTICLES } from "@/lib/blog-content"
import { SITE } from "@/lib/seo"

// Required for `output: "export"` — the sitemap route is pre-rendered at build.
export const dynamic = "force-static"

/**
 * Real routes only — fragment URLs (`/#journal/...`) are never indexed, which
 * is exactly why the journal moved from dialogs to dedicated pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    {
      url: `${SITE.url}/`,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE.url}/journal`,
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...ARTICLES.map((article) => ({
      url: `${SITE.url}/journal/${article.slug}`,
      lastModified: new Date(`${article.dateModified}T00:00:00Z`),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ]
}
