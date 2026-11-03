#!/usr/bin/env node
/**
 * Cloudflare Pages deployment orchestrator — the script-side deploy option.
 *
 * Runs the exact same quality gates as CI (lint → typecheck → static export
 * at domain-root coordinates → artifact verification → smoke tests) and only
 * then hands the verified `out/` artifact to `wrangler pages deploy`.
 *
 * Usage:
 *   node scripts/deploy-cloudflare.mjs            # gates → deploy → live smoke
 *   node scripts/deploy-cloudflare.mjs --dry-run  # gates only, no deploy
 *
 * Required environment for an actual deploy (checked before any wrangler call):
 *   CLOUDFLARE_API_TOKEN   — token with "Cloudflare Pages — Edit" permission
 *   CLOUDFLARE_ACCOUNT_ID  — the target Cloudflare account id
 *
 * Optional environment:
 *   NEXT_PUBLIC_SITE_URL   — canonical origin (default: https://fame-protocol.pages.dev)
 *   CF_PROJECT             — Pages project name (default: fame-protocol)
 *   WRANGLER_VERSION       — wrangler semver range pulled via npx (default: 4)
 *
 * GitHub Pages is intentionally NOT script-deployable: its deploy action runs
 * inside GitHub's runtime with OIDC (see .github/workflows/deploy-pages.yml).
 */
import { spawnSync } from "node:child_process"
import { existsSync, rmSync } from "node:fs"
import { argv, env, exit } from "node:process"

const DRY_RUN = argv.includes("--dry-run")
const SITE_URL = (env.NEXT_PUBLIC_SITE_URL ?? "https://fame-protocol.pages.dev").replace(/\/+$/, "")
const PROJECT = env.CF_PROJECT ?? "fame-protocol"
const WRANGLER_VERSION = env.WRANGLER_VERSION ?? "4"

const step = (name) => console.info(`\n[deploy:cf] ▶ ${name}`)
const die = (message) => {
  console.error(`[deploy:cf] ✗ ${message}`)
  exit(1)
}

/** Run a command; on failure print its tail and abort before deploying. */
function run(name, command, args, { env: cmdEnv = {} } = {}) {
  step(name)
  const result = spawnSync(command, args, {
    stdio: ["ignore", "inherit", "inherit"],
    shell: process.platform === "win32",
    env: { ...env, ...cmdEnv },
  })
  if (result.status !== 0) die(`${name} failed (${command} ${args.join(" ")}) — nothing deployed`)
}

/* ── Preflight ────────────────────────────────────────────────────────────── */
if (!DRY_RUN && (!env.CLOUDFLARE_API_TOKEN || !env.CLOUDFLARE_ACCOUNT_ID)) {
  die("CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID must be set (or pass --dry-run)")
}

/* ── Quality gates (identical sequence to CI / deploy-pages.yml) ─────────── */
run("Lint (ESLint + Biome)", "bun", ["run", "lint"])
run("Typecheck", "bun", ["run", "typecheck"])
step(`Static export build (domain root, canonical ${SITE_URL})`)
rmSync("out", { recursive: true, force: true })
run("Build", "bun", ["run", "build"], {
  env: { NEXT_PUBLIC_SITE_URL: SITE_URL },
})
run("Verify compiled artifacts", "node", [
  "scripts/verify-artifacts.mjs",
  "--root",
  "out",
  "--site-url",
  SITE_URL,
])
run("Smoke tests (Pages routing)", "node", [
  "scripts/smoke.mjs",
  "--root",
  "out",
  "--site-url",
  SITE_URL,
])

if (DRY_RUN) {
  console.info("\n[deploy:cf] DRY-RUN PASSED — gates green, artifact verified, nothing deployed")
  exit(0)
}
if (!existsSync("out/index.html")) die("out/index.html missing after build — refusing to deploy")

/* ── Deploy the verified artifact ─────────────────────────────────────────── */
step(`Wrangler pages deploy out → project "${PROJECT}"`)
const deploy = spawnSync(
  "npx",
  [
    "--yes",
    `wrangler@${WRANGLER_VERSION}`,
    "pages",
    "deploy",
    "out",
    "--project-name",
    PROJECT,
    "--branch",
    "main",
    "--commit-dirty=true",
  ],
  { stdio: ["ignore", "inherit", "inherit"], shell: process.platform === "win32" },
)
if (deploy.status !== 0) die("wrangler pages deploy failed")

console.info(
  `\n[deploy:cf] ✓ Deployed — live smoke it at ${SITE_URL} (or the URL wrangler printed)`,
)
