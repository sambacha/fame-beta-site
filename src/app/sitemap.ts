import type { MetadataRoute } from "next"
import { SITE } from "@/lib/seo"

const ARTICLE_FRAGMENTS = [
  "journal/liquidity-ratios-emission-caps",
  "journal/formal-verification-defi-safety",
]

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    {
      url: SITE.url,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...ARTICLE_FRAGMENTS.map((fragment) => ({
      url: `${SITE.url}/#${fragment}`,
      lastModified,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ]
}
