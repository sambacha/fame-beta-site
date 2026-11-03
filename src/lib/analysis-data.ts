/**
 * Deterministic datasets for the journal analysis pages.
 * Every series is generated from a seeded PRNG (same discipline as
 * market-data.ts) so server and client render identical markup and the
 * markdown sources can embed the exact numbers.
 *
 * All figures are ILLUSTRATIVE — derived from the protocol's published design
 * parameters (1.20 floor, 1.10 breaker, 1,000,000,000 FAME cap, 214
 * invariants, 48h timelock), not from a live chain.
 */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = Math.imul(t ^ (t >>> 14), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/* ── Article 1 — liquidity ratios & emission caps ─────────────────────────── */

export type RatioPoint = { slot: string; ratio: number }

/** Healthy window: ratio drifts between 1.28 and 1.40, floor at 1.20. */
export function buildLiquidityRatioSeries(points = 48): RatioPoint[] {
  const rand = mulberry32(311_202)
  const out: RatioPoint[] = []
  let ratio = 1.34
  for (let i = points; i > 0; i -= 1) {
    ratio = Math.min(1.42, Math.max(1.26, ratio + (rand() - 0.5) * 0.02))
    out.push({
      slot: `${284_100 + i}`,
      ratio: Number(ratio.toFixed(3)),
    })
  }
  return out
}

export type BreakerPoint = { slot: string; ratio: number; deposits: "open" | "halted" }

/**
 * Stress episode: backing drains below the 1.10 breaker — deposits and
 * emissions halt in the same slot — then recover above the floor.
 */
export function buildBreakerEpisode(): BreakerPoint[] {
  const path = [
    1.36, 1.33, 1.31, 1.28, 1.24, 1.19, 1.15, 1.12, 1.09, 1.08, 1.08, 1.08, 1.11, 1.16, 1.21, 1.26,
    1.3, 1.33,
  ]
  return path.map((ratio, index) => ({
    slot: `${301_400 + index}`,
    ratio,
    deposits: ratio <= 1.1 ? "halted" : "open",
  }))
}

export type EmissionPoint = {
  month: string
  incentives: number
  contributors: number
  treasury: number
  total: number
}

/**
 * Emission schedule — cumulative supply by sleeve (millions of FAME) against
 * the immutable 1,000,000,000 cap over 48 months.
 */
export function buildEmissionSchedule(): EmissionPoint[] {
  const out: EmissionPoint[] = []
  let incentives = 0
  let contributors = 0
  let treasury = 0
  for (let month = 1; month <= 48; month += 1) {
    // front-loaded incentive curve, linear vesting, step treasury
    incentives = Math.min(560, incentives + 24 * Math.exp(-month / 18) + 2)
    contributors = Math.min(280, contributors + 5.8)
    if (month % 6 === 0) treasury = Math.min(100, treasury + 12)
    const total = incentives + contributors + treasury
    out.push({
      month: `M${month}`,
      incentives: Number(incentives.toFixed(1)),
      contributors: Number(contributors.toFixed(1)),
      treasury: Number(treasury.toFixed(1)),
      total: Number(total.toFixed(1)),
    })
  }
  return out
}

/** Structural comparison backing the "reading the risk surface" section. */
export const PEER_COMPARISON: {
  dimension: string
  fame: string
  typicalFairLaunch: string
  typicalPresale: string
}[] = [
  {
    dimension: "Liquidity ratio source",
    fame: "Program-owned account, recomputable every slot",
    typicalFairLaunch: "Frontend dashboard, operator-computed",
    typicalPresale: "Not published",
  },
  {
    dimension: "Backing floor",
    fame: "1.20 design floor · 1.10 auto-breaker",
    typicalFairLaunch: "None — deposits always open",
    typicalPresale: "None",
  },
  {
    dimension: "Supply cap",
    fame: "Immutable program constant, mint authority burned",
    typicalFairLaunch: "Mutable mint authority behind a multisig",
    typicalPresale: "Unlimited or undisclosed",
  },
  {
    dimension: "Insider allocation",
    fame: "Zero by construction",
    typicalFairLaunch: "Team + vesting typically 15–30%",
    typicalPresale: "Presale + OTC before public",
  },
  {
    dimension: "Upgrade path",
    fame: "48h public timelock, CI-gated proof re-run",
    typicalFairLaunch: "Instant upgrade authority",
    typicalPresale: "Undisclosed",
  },
  {
    dimension: "Withdrawal priority under stress",
    fame: "Existing rights settle first, by program rule",
    typicalFairLaunch: "First-come, first-served",
    typicalPresale: "Treasury discretion",
  },
]

/** Backing multiple per launch type (design floor; illustrative). */
export const BACKING_COMPARISON = [
  { launch: "FAME (floor enforced)", multiple: 1.2 },
  { launch: "Fair launch (typical)", multiple: 1.0 },
  { launch: "Presale launch (typical)", multiple: 0.6 },
]

/* ── Article 2 — formal verification ──────────────────────────────────────── */

/** The 214 machine-checked invariants by family (sums to 214). */
export const INVARIANT_COVERAGE = [
  { family: "Solvency", count: 58 },
  { family: "Parley concentration", count: 49 },
  { family: "Cap conservation", count: 41 },
  { family: "Breaker liveness", count: 33 },
  { family: "Account & authority", count: 33 },
]

/** Invariant ratchet — proof set grows and can only merge if it still passes. */
export type RatchetPoint = { release: string; invariants: number }

export function buildInvariantRatchet(): RatchetPoint[] {
  const counts = [24, 47, 68, 92, 104, 129, 147, 168, 183, 196, 208, 214]
  return counts.map((invariants, index) => ({
    release: `v0.${index + 1}`,
    invariants,
  }))
}

/**
 * Detection profile by defect class — what a time-boxed audit samples versus
 * what an exhaustive machine check covers, inside the program boundary
 * (illustrative, synthesized from public post-mortem taxonomies).
 */
export const AUDIT_VS_PROOF = [
  { defect: "Arithmetic overflow", audit: 35, proof: 100 },
  { defect: "State-transition gaps", audit: 30, proof: 100 },
  { defect: "Authority misuse", audit: 60, proof: 100 },
  { defect: "Economic invariant breach", audit: 15, proof: 100 },
]

/** What the proof set covers — and what it honestly does not. */
export const PROOF_SCOPE = [
  {
    domain: "Program state transitions",
    covered: true,
    note: "Every reachable state checked against the invariant set on every deploy.",
  },
  {
    domain: "Solvency & cap conservation",
    covered: true,
    note: "Backing ≥ floor and emissions ≤ 1,000,000,000 FAME are theorem-level properties.",
  },
  {
    domain: "Parley concentration bounds",
    covered: true,
    note: "Correlated-leg exposure provably stays inside the margin bound.",
  },
  {
    domain: "Oracle feeds",
    covered: false,
    note: "Inputs from outside the program boundary — priced by risk policy, not proofs.",
  },
  {
    domain: "Bridge custody",
    covered: false,
    note: "Assets in flight across bridges sit outside the verified program.",
  },
  {
    domain: "Market risk",
    covered: false,
    note: "A verified protocol can still lose value on the underlying assets.",
  },
]

/** CI verification pipeline — the deploy gate, step by step. */
export const PROOF_PIPELINE = [
  {
    step: "Specification",
    detail: "Invariants stated as machine-checkable properties in the public repository.",
  },
  {
    step: "Proof run",
    detail: "Full state-space check against the candidate program build.",
  },
  {
    step: "CI gate",
    detail: "Merge blocked unless all 214 invariants re-verify on the exact bytecode.",
  },
  {
    step: "Timelock",
    detail: "48-hour public countdown with a verifiable exit window before activation.",
  },
]
