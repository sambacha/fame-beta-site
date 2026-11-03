/**
 * Markdown serializers — the bridge between the typed content modules and the
 * indexable markdown/txt sources. Used by scripts/generate-content-sources.mts
 * (Bun imports this file directly); kept dependency-free and deterministic so
 * the emitted sources are byte-stable across builds.
 */
import {
  AUDIT_VS_PROOF,
  BACKING_COMPARISON,
  buildBreakerEpisode,
  buildEmissionSchedule,
  buildInvariantRatchet,
  buildLiquidityRatioSeries,
  INVARIANT_COVERAGE,
  PEER_COMPARISON,
  PROOF_PIPELINE,
  PROOF_SCOPE,
} from "@/lib/analysis-data"
import type { Article } from "@/lib/blog-content"
import {
  ACCESS_CONTENT,
  INSTITUTIONAL_STATS,
  NARRATIVES,
  ORDER_FLOW_SUMMARY,
  RETAIL_STATS,
  STABILITY_INTRO,
} from "@/lib/site-content"

const table = (headers: string[], rows: (string | number)[][]): string => {
  const cell = (v: string | number) => `| ${String(v).replace(/\|/g, "\\|")} `
  return [
    `${headers.map(cell).join("")}|`,
    `${headers.map(() => "| --- ").join("")}|`,
    ...rows.map((row) => `${row.map(cell).join("")}|`),
  ].join("\n")
}

/* ── Per-article data appendices (agentic research wants the numbers) ─────── */

function articleAppendix(slug: string): string {
  switch (slug) {
    case "liquidity-ratios-emission-caps": {
      const healthy = buildLiquidityRatioSeries()
        .filter((_, i) => i % 6 === 0)
        .map((p) => [p.slot, p.ratio, "open"])
      const episode = buildBreakerEpisode().map((p) => [p.slot, p.ratio, p.deposits])
      const schedule = buildEmissionSchedule().filter((_, i) => i % 6 === 5)
      return [
        "## Data appendix (illustrative, deterministic)",
        "",
        "### Liquidity ratio · healthy window (every 6th slot)",
        table(["slot", "liquidity_ratio", "deposits"], healthy),
        "",
        "### Circuit-breaker stress episode",
        table(["slot", "liquidity_ratio", "deposits"], episode),
        "",
        "### Emission schedule · cumulative by sleeve (millions of FAME, every 6th month)",
        table(
          ["month", "incentives", "contributors", "treasury", "cumulative_total"],
          schedule.map((p) => [p.month, p.incentives, p.contributors, p.treasury, p.total]),
        ),
        "",
        "Cap reference: total supply can never exceed 1,000,000,000 FAME (immutable program constant).",
        "",
        "### Structural comparison",
        table(
          ["dimension", "FAME Protocol", "Typical fair launch", "Typical presale launch"],
          PEER_COMPARISON.map((r) => [r.dimension, r.fame, r.typicalFairLaunch, r.typicalPresale]),
        ),
        "",
        "### Backing multiple by launch type (design floor)",
        table(
          ["launch_type", "backing_multiple"],
          BACKING_COMPARISON.map((r) => [r.launch, r.multiple]),
        ),
      ].join("\n")
    }
    case "formal-verification-defi-safety": {
      return [
        "## Data appendix (illustrative, deterministic)",
        "",
        "### Machine-checked invariant families (214 total)",
        table(
          ["family", "invariants"],
          INVARIANT_COVERAGE.map((r) => [r.family, r.count]),
        ),
        "",
        "### Invariant ratchet by release",
        table(
          ["release", "invariants_reverified"],
          buildInvariantRatchet().map((r) => [r.release, r.invariants]),
        ),
        "",
        "### Audit sampling vs. exhaustive proof coverage by defect class (%)",
        table(
          ["defect_class", "time_boxed_audit", "machine_checked_proof"],
          AUDIT_VS_PROOF.map((r) => [r.defect, r.audit, r.proof]),
        ),
        "",
        "### Proof boundary",
        table(
          ["domain", "inside_proof_set", "note"],
          PROOF_SCOPE.map((r) => [r.domain, r.covered ? "yes" : "no", r.note]),
        ),
        "",
        "### CI verification pipeline",
        table(
          ["step", "detail"],
          PROOF_PIPELINE.map((r) => [r.step, r.detail]),
        ),
      ].join("\n")
    }
    default:
      return ""
  }
}

/* ── Article → markdown ───────────────────────────────────────────────────── */

export function articleToMarkdown(article: Article, siteUrl: string, basePath = ""): string {
  const url = `${siteUrl}${basePath}/journal/${article.slug}`
  const frontMatter = [
    "---",
    `title: "${article.seoTitle}"`,
    `description: "${article.seoDescription}"`,
    `canonical: ${url}`,
    `date_published: ${article.datePublished}`,
    `date_modified: ${article.dateModified}`,
    `read_minutes: ${article.readMinutes}`,
    `keywords: ${article.keywords.join(", ")}`,
    `format: text/markdown`,
    "---",
    "",
  ].join("\n")

  const body = [
    `# ${article.title}`,
    "",
    `> ${article.lead}`,
    "",
    article.sections
      .map((section) =>
        [
          `## ${section.heading}`,
          "",
          ...section.paragraphs.map((p) => `${p}\n`),
          ...(section.bullets ? section.bullets.map((b) => `- ${b}`) : []),
        ].join("\n"),
      )
      .join("\n\n"),
    "",
    "## FAQ",
    "",
    ...article.faq.map((item) => `### ${item.q}\n\n${item.a}`),
    "",
    articleAppendix(article.slug),
    "",
    "---",
    "",
    `Canonical HTML version: ${url}`,
    `Site index for agents: ${siteUrl}${basePath}/llms.txt`,
    "",
    "Figures marked illustrative are deterministic design parameters, not live chain state. Verify from primary sources: program accounts and the public invariant repository.",
  ].join("\n")

  return `${frontMatter}${body}\n`
}

/* ── Landing page → markdown ──────────────────────────────────────────────── */

export function homeToMarkdown(siteUrl: string, basePath = ""): string {
  const url = `${siteUrl}${basePath}/`
  const inst = NARRATIVES.institutional
  const ret = NARRATIVES.retail
  const statRow = (s: { term: string; value: string; detail: string }) => [
    s.term,
    s.value,
    s.detail,
  ]

  return [
    "---",
    `title: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure"`,
    `description: "FAME Protocol is formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs."`,
    `canonical: ${url}`,
    `format: text/markdown`,
    "---",
    "",
    "# FAME Protocol",
    "",
    "> One curve. No insiders.",
    "",
    "FAME Protocol is formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs.",
    "",
    "## Protocol stability anchor",
    "",
    STABILITY_INTRO.lede,
    "",
    "### Institutional view",
    "",
    table(["term", "value", "detail"], [...INSTITUTIONAL_STATS].map(statRow)),
    "",
    "### Retail view",
    "",
    table(["term", "value", "detail"], [...RETAIL_STATS].map(statRow)),
    "",
    "Design parameters: liquidity floor 1.20 · breaker 1.10 · emission cap 1,000,000,000 FAME (immutable, mint authority burned) · 48h upgrade timelock · 214 invariants re-verified in CI on every deploy.",
    "",
    "## Why FAME — institutional narrative",
    "",
    `### ${inst.problemTitle}`,
    "",
    ...inst.problemBullets.map((b) => `- ${b}`),
    "",
    `### ${inst.solutionTitle}`,
    "",
    ...inst.solutionBullets.map((b) => `- ${b}`),
    "",
    "## Why FAME — retail narrative",
    "",
    `### ${ret.problemTitle}`,
    "",
    ...ret.problemBullets.map((b) => `- ${b}`),
    "",
    `### ${ret.solutionTitle}`,
    "",
    ...ret.solutionBullets.map((b) => `- ${b}`),
    "",
    "## Parametric order flow",
    "",
    ORDER_FLOW_SUMMARY.lede,
    "",
    table(
      ["node", "behaviour"],
      ORDER_FLOW_SUMMARY.steps.map((s) => [s.name, s.detail]),
    ),
    "",
    `Ticket bounds: ${ORDER_FLOW_SUMMARY.bounds.minTicketUsd}. ${ORDER_FLOW_SUMMARY.bounds.liquidityGuard}`,
    "",
    "## Request access",
    "",
    ACCESS_CONTENT.institutionalLede,
    "",
    ...ACCESS_CONTENT.institutional.items.map((b) => `- ${b}`),
    "",
    ACCESS_CONTENT.retailLede,
    "",
    ...ACCESS_CONTENT.retail.items.map((b) => `- ${b}`),
    "",
    "---",
    "",
    `Canonical HTML version: ${url}`,
    `Research journal: ${siteUrl}${basePath}/journal`,
    `Site index for agents: ${siteUrl}${basePath}/llms.txt`,
    "",
    "All figures illustrative unless derived from program constants — verify from primary sources.",
  ].join("\n")
}
