/**
 * Canonical landing-page content — the single source of truth for the copy
 * rendered by the home page AND serialized into the markdown/txt sources by
 * scripts/generate-content-sources.mts. Components import from here so the
 * HTML and the indexable sources can never drift.
 */

export type AnchorStat = {
  term: string
  value: string
  detail: string
  definition: string
}

export type Narrative = {
  problemTitle: string
  problemBullets: string[]
  solutionTitle: string
  solutionBullets: string[]
}

export type AccessPoint = { label: string; items: string[] }

export const STABILITY_INTRO = {
  eyebrow: "PROTOCOL STABILITY ANCHOR",
  institutionalTitle: "The guarantees, in numbers you can recompute.",
  retailTitle: "The safety numbers, in plain figures.",
  lede: "Every metric below is derived from program accounts or repository artifacts — not dashboards. Hover any term for its definition; then verify it from primary sources.",
  ratioCard: {
    title: "Liquidity ratio vs. floor",
    meta: "floor 1.20 · breaker 1.10",
    progressValue: 89,
    footnote: "1.34 current · +11.7% above floor · warning trail empty · deposits open",
  },
  trackerCard: {
    title: "Settlement proofs · recent slots",
    footnote: "19 settled · 1 breaker-armed · 0 violations",
  },
} as const

export const INSTITUTIONAL_STATS: AnchorStat[] = [
  {
    term: "Liquidity floor",
    value: "1.20",
    detail: "Current ratio 1.34 · breaker arms at 1.10",
    definition:
      "liquid_backing ÷ withdrawable_liabilities, computed on-chain every slot. Below the design floor of 1.20 the launch accumulates a public warning trail; at 1.10 deposits and emissions halt automatically.",
  },
  {
    term: "Emission cap",
    value: "1.0B",
    detail: "Immutable constant · mint authority burned",
    definition:
      "The 1,000,000,000 FAME ceiling lives in the program's immutable constants section. No governance vote, multisig or parameter edit can raise it — only a full redeployment behind the 48-hour timelock.",
  },
  {
    term: "Upgrade timelock",
    value: "48h",
    detail: "Public countdown before any program change",
    definition:
      "Every program upgrade waits out a 48-hour public timelock. Holders get a verifiable exit window; risk teams get a predictable change calendar instead of surprise migrations.",
  },
  {
    term: "Invariants re-verified",
    value: "214",
    detail: "Proof set re-runs in CI on every deploy",
    definition:
      "Solvency, cap conservation, parley concentration and breaker liveness are machine-checked against every change. Upgrades cannot merge unless the full proof set passes again.",
  },
]

export const RETAIL_STATS: AnchorStat[] = [
  {
    term: "Backed",
    value: "120%",
    detail: "Every claim exceeds its backing by 20%",
    definition:
      "For every 1.00 you could withdraw, the program holds at least 1.20 in immediately settleable assets — checked on-chain every two seconds, not in a monthly blog post.",
  },
  {
    term: "Supply cap",
    value: "1.0B",
    detail: "No hidden printer — the mint key is destroyed",
    definition:
      "Total supply can never exceed 1,000,000,000 FAME. The mint authority was burned at genesis, so nobody — not even the team — can create more.",
  },
  {
    term: "Exit window",
    value: "48h",
    detail: "Public notice before any code change",
    definition:
      "Any upgrade to the program is announced 48 hours in advance and publicly visible. If you disagree, you have two verifiable days to leave.",
  },
  {
    term: "Proof checks",
    value: "214",
    detail: "Automatic safety tests run on every update",
    definition:
      "The program's safety rules are checked by automated proofs every time the code changes — the same idea as a smoke detector that re-tests itself after any rewiring.",
  },
]

export const NARRATIVES: Record<"institutional" | "retail", Narrative> = {
  institutional: {
    problemTitle: "Structured products, trust-me settlement",
    problemBullets: [
      "Counterparty opacity — you see NAV prints, not the vault; repricing happens inside someone else's black box.",
      "Discretionary emissions — treasuries dilute on a vote, and your allocation model eats the variance.",
      "Audits as theater — a two-week code sample is treated as a guarantee, until the day it isn't.",
      "Upgrade risk — parameters move between quarters, under signatures you never see.",
    ],
    solutionTitle: "Arithmetic instead of assurances",
    solutionBullets: [
      "Slot-level liquidity ratio — liquid_backing ÷ withdrawable_liabilities computed on-chain every slot; the 1.20 floor and 1.10 breaker are constants, not policies.",
      "A cap that cannot move — 1,000,000,000 FAME in the program's immutable constants, mint authority burned at genesis. Dilution becomes a line item.",
      "Proofs over PDFs — 214 invariants (solvency, cap conservation, parley concentration, breaker liveness) re-verified in CI on every deploy.",
      "Change calendar, not surprises — every upgrade waits out a 48-hour public timelock with a verifiable exit window.",
    ],
  },
  retail: {
    problemTitle: "Crypto strategies, casino odds",
    problemBullets: [
      "Insiders get the good entry — presales and OTC deals price before you even see the chart.",
      "Liquidity that vanishes — the moment you need out, the pool is a puddle and the devs are quiet.",
      "Jargon as a moat — 'impermanent loss hedging' that means nobody can check anything.",
      "Unlimited printers — supply caps that turn out to be a multisig vote away from nothing.",
    ],
    solutionTitle: "One curve. No insiders.",
    solutionBullets: [
      "Everyone buys the same public curve at the same slot — no presale, no team allocation, no OTC desk.",
      "The money stays in the program — 1.20× backing behind every withdrawable claim, recomputable by you every two seconds.",
      "Plain numbers on the page — backed %, supply cap, exit window. If a term confuses you, hover it for the definition.",
      "Supply is capped at 1,000,000,000 FAME and the mint key is destroyed. It is math, not a promise.",
    ],
  },
}

export const ACCESS_CONTENT = {
  eyebrow: "REQUEST ACCESS",
  institutionalTitle: "Talk to the protocol team.",
  retailTitle: "Get on the list.",
  institutionalLede:
    "Notional onboarding for parley vaults is gated to keep the curve fair. Bring your mandate; we bring the proof pack — program constants, invariant set, and the audit folder.",
  retailLede:
    "Retail access opens in waves so the curve stays honest. Join the list and you will get a plain-language walkthrough before you ever commit capital.",
  institutional: {
    label: "For institutions",
    items: [
      "Proof pack within 48 hours: constants, invariants, CI configuration.",
      "Vault desk for size — OTC settlement with slot-level proofs.",
      "Risk API: recompute the liquidity ratio from raw chain state.",
    ],
  },
  retail: {
    label: "For retail",
    items: [
      "No minimum size on the public curve.",
      "Plain-language guides before any leg is opened.",
      "Your exit rights always settle first — by program rule.",
    ],
  },
} as const

/** Compact order-builder facts for the indexable sources (mirrors lib/order-data.ts). */
export const ORDER_FLOW_SUMMARY = {
  eyebrow: "PARAMETRIC ORDER FLOW",
  title: "Build a parley the way the program settles it.",
  lede: "Three nodes, one state machine: pick the primary trade, filter the second leg by correlation, review the parametric summary. Amount changes recompute the second leg and the payoff automatically.",
  steps: [
    {
      name: "Primary trade",
      detail:
        "Base-UI Select over the liquid trade set — price, APR and liquidity shown per option.",
    },
    {
      name: "Second leg",
      detail:
        "RadioGroup filtered to correlation-safe legs for the chosen primary; read-only sizing derived from the amount.",
    },
    {
      name: "Parametric summary",
      detail:
        "Notional, both legs, aggregate correlation and the formally verified settlement path, with the payoff curve beneath.",
    },
  ],
  bounds: {
    minTicketUsd: "1,000 USD",
    liquidityGuard:
      "Orders beyond the FAME liquidity bound are rejected with a non-destructive notice — the builder never lets you size into an illiquid pair.",
  },
} as const
