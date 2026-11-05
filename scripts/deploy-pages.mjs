#!/usr/bin/env node
/**
 * GitHub Pages deployment — the `gh-pages` npm-package deploy option.
 *
 * Runs the exact same quality gates as CI (lint → typecheck → static SPA
 * build at GitHub Pages coordinates → artifact verification → smoke tests)
 * and only then publishes the verified `dist/` tree to the `gh-pages`
 * branch with the `gh-pages` package (https://github.com/tschaub/gh-pages).
 *
 * Usage:
 *   bun run deploy:pages             # gates → publish gh-pages branch
 *   bun run deploy:pages:dry-run     # gates only, nothing pushed
 *   node scripts/deploy-pages.mjs --dry-run
 *
 * Notes:
 *   - `--dotfiles` ships `.nojekyll` (and any other dotfiles) — required so
 *     GitHub Pages serves hashed assets as-is instead of running Jekyll.
 *   - One-time setup: Settings → Pages → Build and deployment → Source:
 *     "Deploy from a branch" → branch `gh-pages`, folder `/ (root)`.
 *   - In GitHub Actions (deploy-pages.yml) actions/checkout persists the
 *     token credentials, so the same script pushes with no extra setup
 *     (requires `permissions: contents: write`).
 */
import { spawnSync } from "node:child_process"
import { existsSync, rmSync } from "node:fs"
import { argv, env, exit } from "node:process"
import ghpages from "gh-pages"

const DRY_RUN = argv.includes("--dry-run")

const step = (name) => console.info(`\n[deploy:gh] ▶ ${name}`)
const die = (message) => {
  console.error(`[deploy:gh] ✗ ${message}`)
  exit(1)
}

/** Run a command; on failure print a marker and abort before publishing. */
function run(name, command, args, cmdEnv = {}) {
  step(name)
  const result = spawnSync(command, args, {
    stdio: ["ignore", "inherit", "inherit"],
    shell: process.platform === "win32",
    env: { ...env, ...cmdEnv },
  })
  if (result.status !== 0) die(`${name} failed (${command} ${args.join(" ")}) — nothing published`)
}

/* ── Preflight ────────────────────────────────────────────────────────────── */
if (!existsSync("package.json")) die("run from the repository root")
if (!DRY_RUN && !/sambacha\.github\.io/.test(env.VITE_SITE_URL ?? "")) {
  die(
    "VITE_SITE_URL does not look like GitHub Pages coordinates — " +
      "use `bun run deploy:pages` (which sets them) or export VITE_SITE_URL manually",
  )
}

/* ── Quality gates (identical sequence to CI / deploy-cloudflare.mjs) ─────── */
run("Lint (ESLint + Biome)", "bun", ["run", "lint"])
run("Typecheck", "bun", ["run", "typecheck"])
step("Static SPA build (GitHub Pages coordinates)")
rmSync("dist", { recursive: true, force: true })
run("Build", "bun", ["run", "build:pages"])
run("Verify compiled artifacts", "node", [
  "scripts/verify-artifacts.mjs",
  "--root",
  "dist",
  "--base",
  "/fame-beta-site",
  "--site-url",
  "https://sambacha.github.io/fame-beta-site",
])
run("Smoke tests (Pages routing)", "node", [
  "scripts/smoke.mjs",
  "--root",
  "dist",
  "--mount",
  "/fame-beta-site",
  "--site-url",
  "https://sambacha.github.io/fame-beta-site",
])

if (DRY_RUN) {
  console.info("\n[deploy:gh] DRY-RUN PASSED — gates green, artifact verified, nothing published")
  exit(0)
}

/* ── Publish ──────────────────────────────────────────────────────────────── */
step("Publishing dist/ → gh-pages branch (gh-pages package)")
ghpages.publish(
  "dist",
  {
    branch: "gh-pages",
    dest: ".",
    dotfiles: true, // ships .nojekyll — Jekyll must stay off
    verbose: true,
  },
  (error) => {
    if (error) die(`gh-pages publish failed: ${error.message}`)
    console.info(
      "\n[deploy:gh] PUBLISHED — gh-pages branch updated." +
        "\n           Live at https://sambacha.github.io/fame-beta-site/ (CDN warm-up may take a minute)." +
        '\n           Pages source must be "Deploy from a branch: gh-pages / (root)".',
    )
  },
)
