import type { MetadataRoute } from "next"
import { SITE } from "@/lib/seo"

// Required for `output: "export"` — the robots route is pre-rendered at build.
export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
  }
}
