#!/usr/bin/env node
import { createReadStream, existsSync, statSync } from "node:fs"
/**
 * Minimal static-file server for verified build artifacts.
 *
 * Mirrors the asset-routing behaviour of the two deployment targets so the
 * smoke suite exercises the same code paths production traffic will hit:
 *   /path            → path/index.html   (directory pretty URL — GitHub Pages)
 *   /path            → path.html         (Cloudflare Pages pretty URL)
 *   unmatched route  → 404.html served with HTTP 404
 *   directories      → never listed
 *   traversal        → rejected
 *
 * Used by scripts/smoke.mjs and by `bun run start` for local artifact preview.
 */
import { createServer } from "node:http"
import { extname, join, normalize, resolve, sep } from "node:path"

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
}

/** Resolve a request URL to an absolute path inside `rootDir`, or null on traversal. */
function resolveWithin(rootDir, mountPrefix, rawUrl) {
  let pathname = decodeURIComponent((rawUrl ?? "/").split("?")[0])
  if (mountPrefix && pathname === mountPrefix) {
    pathname = "/"
  } else if (mountPrefix && pathname.startsWith(`${mountPrefix}/`)) {
    pathname = pathname.slice(mountPrefix.length)
  }
  const normalized = normalize(pathname).replace(/^(\.\.[/\\])+/, "")
  const absolute = normalize(join(rootDir, normalized))
  if (absolute !== rootDir && !absolute.startsWith(rootDir + sep)) return null
  return absolute
}

/** Map a resolved path to the file to serve, mirroring Pages-style routing. */
function route(absolute) {
  if (absolute === null) return null
  if (existsSync(absolute)) {
    if (statSync(absolute).isFile()) return { path: absolute, status: 200 }
    const index = join(absolute, "index.html")
    if (existsSync(index)) return { path: index, status: 200 }
    // A directory that also exists as a flat .html asset (Next exports both
    // out/journal.html and out/journal/<slug>.html) must not shadow it.
    const asSiblingHtml = `${absolute}.html`
    if (existsSync(asSiblingHtml)) return { path: asSiblingHtml, status: 200 }
    return null // directories are never listed
  }
  const asHtml = `${absolute}.html`
  if (existsSync(asHtml)) return { path: asHtml, status: 200 }
  return null
}

/**
 * Start the artifact server. Resolves once listening; the caller owns shutdown.
 * @param {{ root: string, mount?: string, port?: number }} options
 */
export function startServer({ root, mount = "", port = 0 }) {
  const rootDir = resolve(root)
  if (!existsSync(rootDir)) {
    return Promise.reject(new Error(`Artifact root not found: ${rootDir}`))
  }
  const mountPrefix = mount.replace(/\/+$/, "")

  const server = createServer((req, res) => {
    const found = route(resolveWithin(rootDir, mountPrefix, req.url))
    if (!found) {
      const notFoundPage = join(rootDir, "404.html")
      res.writeHead(404, { "Content-Type": MIME[".html"] })
      if (existsSync(notFoundPage)) {
        createReadStream(notFoundPage).pipe(res)
      } else {
        res.end("404 Not Found")
      }
      return
    }
    res.writeHead(found.status, {
      "Content-Type": MIME[extname(found.path)] ?? "application/octet-stream",
    })
    createReadStream(found.path).pipe(res)
  })

  return new Promise((resolveListening) => {
    server.listen(port, "127.0.0.1", () => {
      const address = server.address()
      resolveListening({ server, port: address.port })
    })
  })
}

const invokedDirectly =
  process.argv[1] && import.meta.url.endsWith(process.argv[1].split(sep).pop())

if (invokedDirectly) {
  const args = process.argv.slice(2)
  const readFlag = (name, fallback) => {
    const index = args.indexOf(`--${name}`)
    return index >= 0 && args[index + 1] ? args[index + 1] : fallback
  }
  const root = readFlag("root", "out")
  const mount = readFlag("mount", "")
  const port = Number.parseInt(readFlag("port", "8788"), 10)
  const { server, port: bound } = await startServer({ root, mount, port })
  const prefix = mount ? ` (mounted at ${mount.replace(/\/+$/, "")})` : ""
  console.info(`[serve] ${resolve(root)}${prefix} → http://127.0.0.1:${bound}/`)
  const shutdown = () => server.close(() => process.exit(0))
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}
