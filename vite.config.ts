import { defineConfig } from "vite"
import preact from "@preact/preset-vite"
import tailwindcss from "@tailwindcss/vite"
import { resolve } from "node:path"

/**
 * FAME Protocol — build matrix (Vite + Preact, client-side only).
 *
 * - `bun run dev`: no env vars → dev server on :3000, GitHub Pages defaults.
 * - `bun run build`: static SPA bundle into `dist/`.
 *     VITE_SITE_URL    → canonical/OG/sitemap absolute origin (seo.ts).
 *     VITE_BASE_PATH   → project-site subpath, e.g. /fame-beta-site (GitHub
 *                        Pages). Leave unset for Cloudflare root deploys.
 *
 * The client reads both through `import.meta.env` (statically replaced at
 * build time); the Bun post-build scripts read the same vars from
 * `process.env`, so one convention covers bundler and scripts.
 */
const basePath = (process.env.VITE_BASE_PATH ?? "").replace(/\/+$/, "")

export default defineConfig({
  base: basePath === "" ? "/" : `${basePath}/`,
  plugins: [preact(), tailwindcss()],
  resolve: {
    alias: { "@": resolve(import.meta.dirname, "src") },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        // One hashed entry chunk + one chunk per dynamically imported module.
        manualChunks: undefined,
      },
    },
  },
})
