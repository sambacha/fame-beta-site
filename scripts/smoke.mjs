#!/usr/bin/env node
/**
 * Deployment smoke tests — the second pre-deployment gate.
 *
 * Boots the artifact tree on a loopback server that mirrors GitHub Pages /
 * Cloudflare Pages routing (see scripts/serve.mjs), then exercises it over
 * HTTP the way a browser and a crawler would:
 *   - every page, asset and sitemap URL answers 200;
 *   - unknown routes get the branded 404 with HTTP 404;
 *   - traversal, directory listing, mixed-content and placeholder regressions
 *     are impossible to ship.
 *
 * Also supports `--url <https://…>` to re-run the same assertions against a
 * live deployment after it lands (with retries while the CDN warms up).
 *
 * Exit code 1 = deployment must not proceed.
 */
import { existsSync } from "node:fs"
import { join, resolve } from "node:path"
import { startServer } from "./serve.mjs"

/* ── CLI ──────────────────────────────────────────────────────────────────── */
const args = process.argv.slice(2)
const readFlag = (name, fallback) => {
  const index = args.indexOf(`--${name}`)
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback
}
const ROOT = resolve(readFlag("root", "out"))
const MOUNT = readFlag("mount", "").replace(/\/+$/, "")
const SITE_URL = readFlag("site-url", "").replace(/\/+$/, "")
const REMOTE_URL = readFlag("url", "").replace(/\/+$/, "")
const RETRIES = Number.parseInt(readFlag("retries", REMOTE_URL ? "6" : "1"), 10)
const RETRY_DELAY_MS = Number.parseInt(readFlag("retry-delay-ms", "15000"), 10)

/* ── Harness ──────────────────────────────────────────────────────────────── */
const failures = []
let passed = 0
const check = (name, ok, detail = "") => {
  if (ok) passed += 1
  else failures.push(`${name}${detail ? ` — ${detail}` : ""}`)
}

const fetchWithRetry = async (url, attempts) => {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      // Follow redirects: GitHub Pages 301s /repo → /repo/ (trailing slash).
      const response = await fetch(url)
      if (response.status > 500) throw new Error(`HTTP ${response.status}`)
      return response
    } catch (error) {
      lastError = error
      if (attempt < attempts) {
        await new Promise((sleep) => setTimeout(sleep, RETRY_DELAY_MS))
      }
    }
  }
  throw lastError
}

/* ── Transport: local artifact server or remote deployment ───────────────── */
let baseUrl = REMOTE_URL
let closeServer = () => {}
if (!REMOTE_URL) {
  if (!existsSync(join(ROOT, "index.html"))) {
    console.error(`[smoke] No index.html under ${ROOT} — run \`bun run build\` first.`)
    process.exit(1)
  }
  const { server, port } = await startServer({ root: ROOT, mount: MOUNT, port: 0 })
  baseUrl = `http://127.0.0.1:${port}`
  closeServer = () => server.close()
}
const origin = new URL(baseUrl).origin

const get = async (path, attempts = RETRIES) => {
  // Refs harvested from a base-path build already carry the mount prefix —
  // never double it.
  const alreadyMounted = MOUNT !== "" && (path === MOUNT || path.startsWith(`${MOUNT}/`))
  const target = `${origin}${alreadyMounted ? "" : MOUNT}${path}`
  const response = await fetchWithRetry(target, attempts)
  return { response, body: await response.text(), target }
}

try {
  /* ── 1. The landing page ─────────────────────────────────────────────────── */
  const home = await get("/")
  check("GET / → 200", home.response.status === 200, String(home.response.status))
  check(
    "GET / → text/html",
    (home.response.headers.get("content-type") ?? "").includes("text/html"),
  )
  check(
    "/ starts with <!doctype html>",
    home.body.trimStart().toLowerCase().startsWith("<!doctype html>"),
  )
  check("/ has <h1>", /<h1[\s>]/.test(home.body))
  check('/ has <main id="main">', /<main[^>]*id="main"/.test(home.body))
  check("/ announces FAME Protocol", home.body.includes("FAME Protocol"))
  check("/ keeps polite aria-live regions", home.body.includes('aria-live="polite"'))
  check(
    "/ keeps the order-flow boundary",
    home.body.includes('data-boundary="parametric-order-flow"'),
  )
  check("/ keeps the blotter boundary", home.body.includes('data-boundary="market-blotter-hero"'))
  check("/ keeps the access boundary", home.body.includes('data-boundary="request-access"'))
  check("/ shows the Request Access CTA", /REQUEST ACCESS/i.test(home.body))
  check("/ has no localhost leak", !home.body.includes("localhost"))
  check("/ has no {{placeholder}} leftovers", !home.body.includes("{{"))
  check("/ has no insecure http:// refs", !/(src|href)="http:\/\//.test(home.body))

  const jsonLd = home.body.match(/<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/)
  check("/ embeds JSON-LD", Boolean(jsonLd))
  if (jsonLd) {
    try {
      const parsed = JSON.parse(jsonLd[1])
      const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed]
      const types = graph.map((node) => node["@type"])
      check("JSON-LD has Organization", types.includes("Organization"))
      check("JSON-LD has SoftwareApplication", types.includes("SoftwareApplication"))
    } catch (error) {
      check("JSON-LD parses", false, String(error))
    }
  }

  /* ── 2. Every referenced local asset resolves ────────────────────────────── */
  const collectRefs = (html, pagePath) =>
    [...html.matchAll(/(?:src|href)="([^"]+)"/g)]
      .map((match) => match[1])
      .filter((ref) => ref.startsWith("/") && !ref.startsWith("//"))
      .map((ref) => ({ ref, pagePath }))

  const refs = [...collectRefs(home.body, "/")]
  const seen = new Set()
  let assetFailures = 0
  for (const { ref } of refs) {
    if (seen.has(ref)) continue
    seen.add(ref)
    try {
      const asset = await get(ref)
      if (asset.response.status !== 200) {
        assetFailures += 1
        check(`asset ${ref} → 200`, false, `HTTP ${asset.response.status}`)
      }
    } catch (error) {
      assetFailures += 1
      check(`asset ${ref} → 200`, false, String(error))
    }
  }
  if (assetFailures === 0) check(`all ${seen.size} referenced assets → 200`, true)

  /* ── 3. Static support files ─────────────────────────────────────────────── */
  const png = await get("/og-image.png")
  check(
    "/og-image.png → 200 image/png",
    png.response.status === 200 &&
      (png.response.headers.get("content-type") ?? "").includes("image/png"),
  )
  check(
    "/og-image.png is non-trivial",
    Number.parseInt(png.response.headers.get("content-length") ?? "0", 10) > 20_000 ||
      png.body.length > 20_000,
  )

  const logo = await get("/logo.svg")
  check(
    "/logo.svg → 200 svg",
    logo.response.status === 200 &&
      (logo.response.headers.get("content-type") ?? "").includes("image/svg+xml"),
  )

  const robots = await get("/robots.txt")
  check(
    "/robots.txt → 200 with Sitemap line",
    robots.response.status === 200 && robots.body.includes("Sitemap:"),
  )

  const headersFile = await get("/_headers")
  check(
    "/_headers → 200 with CSP",
    headersFile.response.status === 200 && headersFile.body.includes("Content-Security-Policy"),
  )

  const redirects = await get("/_redirects")
  check("/_redirects → 200", redirects.response.status === 200)

  const nojekyll = await get("/.nojekyll")
  check("/.nojekyll → 200 (Jekyll disabled)", nojekyll.response.status === 200)

  const manifestFile = join(ROOT, "build-manifest.json")
  if (existsSync(manifestFile)) {
    const manifest = await get("/build-manifest.json")
    check("/build-manifest.json → 200 JSON", manifest.response.status === 200)
  }

  /* ── 4. Sitemap URLs all resolve ─────────────────────────────────────────── */
  const sitemap = await get("/sitemap.xml")
  check("/sitemap.xml → 200", sitemap.response.status === 200)
  const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1])
  check("sitemap lists ≥ 3 URLs", locs.length >= 3, `found ${locs.length}`)
  for (const loc of locs) {
    const path = new URL(loc).pathname
    if (path.includes("#")) continue
    try {
      const page = await get(path)
      check(
        `sitemap URL resolves: ${path}`,
        page.response.status === 200,
        `HTTP ${page.response.status}`,
      )
    } catch (error) {
      check(`sitemap URL resolves: ${path}`, false, String(error))
    }
  }

  /* ── 5. 404 behaviour, traversal, listing ────────────────────────────────── */
  const missing = await get("/definitely-not-a-route")
  check(
    "unknown route → HTTP 404",
    missing.response.status === 404,
    String(missing.response.status),
  )
  check("unknown route serves the branded 404", missing.body.includes("SLOT NOT FOUND"))

  // fetch() normalizes literal `../` segments, so probe with encoded dots —
  // the guard must reject them after server-side decoding.
  const traversal = await fetch(`${origin}${MOUNT}/%2e%2e/%2e%2e/package.json`, {
    redirect: "manual",
  }).catch((error) => ({ status: 0, error }))
  check("path traversal is rejected", traversal.status !== 200)

  const listing = await get("/_next/")
  check("directories are not listed", listing.response.status === 404)

  /* ── 6. Canonical origin ─────────────────────────────────────────────────── */
  const canonical = home.body.match(/<link\s+rel="canonical"\s+href="([^"]+)"/)
  check("/ has canonical link", Boolean(canonical))
  if (canonical) {
    check("canonical is https and absolute", canonical[1].startsWith("https://"))
    if (SITE_URL) {
      // Next normalizes a root-level canonical to the bare origin; subpath
      // builds keep the trailing slash — both forms are accepted.
      const canonicalOk = canonical[1] === SITE_URL || canonical[1] === `${SITE_URL}/`
      check(`canonical matches --site-url (${SITE_URL})`, canonicalOk, `canonical=${canonical[1]}`)
    } else {
      check(
        `canonical matches deployment origin (${origin})`,
        canonical[1].startsWith(origin),
        `canonical=${canonical[1]}`,
      )
    }
  }
} finally {
  closeServer()
}

/* ── Report ───────────────────────────────────────────────────────────────── */
console.info(`[smoke] target=${baseUrl}${MOUNT ? ` mount=${MOUNT}` : ""}`)
if (failures.length > 0) {
  console.error(`[smoke] FAILED — ${failures.length}/${passed + failures.length} assertions:`)
  for (const failure of failures) console.error(`  ✗ ${failure}`)
  process.exit(1)
}
console.info(`[smoke] PASSED — ${passed} assertions green`)
