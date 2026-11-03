import type { NextConfig } from "next"

/**
 * FAME Protocol — build matrix.
 *
 * - `bun run dev` (sandbox preview): no env vars → dev server, unchanged.
 * - `bun run build` (static hosting):
 *     STATIC_EXPORT=1            → `output: "export"`, emits a pure static `out/`
 *                                  deployable to GitHub Pages and Cloudflare Pages.
 *     NEXT_PUBLIC_BASE_PATH=X    → project-site subpath (GitHub Pages serves
 *                                  https://<owner>.github.io/<repo>/). Leave unset
 *                                  for Cloudflare Pages root deployments.
 *     NEXT_PUBLIC_SITE_URL=X     → canonical/OG/sitemap absolute origin (see seo.ts).
 *
 * The production bundle is typed strictly: type errors fail the build, which is
 * one of the quality gates that runs before any deployment is allowed.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""
const staticExport = process.env.STATIC_EXPORT === "1"

const nextConfig: NextConfig = {
  // Static export builds into a dedicated distDir so a concurrently running
  // dev server (which owns `.next/`) is never disturbed.
  ...(staticExport ? { output: "export" as const, distDir: ".next-export" } : {}),
  ...(basePath !== "" ? { basePath } : {}),
  images: { unoptimized: true },
  reactStrictMode: false,
  typescript: { ignoreBuildErrors: false },
}

export default nextConfig
