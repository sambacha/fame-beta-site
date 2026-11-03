/**
 * Journal content — two SEO-optimised research pieces distilled from the
 * FAME protocol documentation. Rendered in accessible dialog readers and
 * mirrored as BlogPosting JSON-LD for indexing.
 */

export type ArticleSection = {
  heading: string
  paragraphs: string[]
  bullets?: string[]
}

export type Article = {
  slug: string
  title: string
  seoTitle: string
  description: string
  seoDescription: string
  keywords: string[]
  datePublished: string
  dateModified: string
  readMinutes: number
  lead: string
  sections: ArticleSection[]
  faq: { q: string; a: string }[]
}

export const ARTICLES: Article[] = [
  {
    slug: "liquidity-ratios-emission-caps",
    title: "Inside FAME's risk engine: liquidity ratios & emission caps",
    seoTitle: "Liquidity Ratios & Emission Caps: Inside FAME's Risk Engine",
    description:
      "The two numbers that constrain everything else in FAME: liquid backing per slot, and a supply cap written in program constants.",
    seoDescription:
      "How the FAME Protocol computes liquid backing per slot, why the 1,000,000,000 FAME emission cap is an immutable constant rather than a vote, and a five-step institutional due-diligence checklist for fair-launch DeFi.",
    keywords: [
      "liquidity ratio",
      "emission cap",
      "DeFi risk management",
      "institutional crypto",
      "fair launch",
      "Solana",
    ],
    datePublished: "2026-10-30",
    dateModified: "2026-10-30",
    readMinutes: 7,
    lead: "Two numbers constrain everything else in the protocol: how much liquid backing stands behind every withdrawable claim, and how much supply can ever exist. Here is how each is computed, enforced, and — when it matters — broken.",
    sections: [
      {
        heading: "The liquidity ratio, defined without hand-waving",
        paragraphs: [
          "For any launch, at any slot: liquidity_ratio = liquid_backing ÷ withdrawable_liabilities. Liquid backing is the value held in the launch's program-derived liquidity vault in assets that can be settled immediately — not staked positions, not vested allocations, not IOUs. Withdrawable liabilities is what participants could redeem right now under the launch's own rules: curve holdings above any published lock, plus committed exits.",
          "The ratio is computed on-chain by the program at every slot and written to a program-owned account. That last clause does the heavy lifting: because the computation lives in the same program that enforces the result, any observer can recompute it from raw chain data. There is no official dashboard to trust — the launch console is a view, not a source of truth.",
          "FAME operates the metric as a floor system (figures illustrative): the design floor is 1.20 — backing must exceed claims by at least 20% — and a circuit breaker arms at 1.10. Between the two, the launch accumulates a public warning trail. Below the breaker, the program halts new deposits and emissions automatically. Existing withdrawal rights keep priority; nothing needs to be voted, signed, or negotiated in the middle of a stress event.",
        ],
      },
      {
        heading: "Why the emission cap is a constant, not a vote",
        paragraphs: [
          "Most token supply caps are promises with a mint authority still attached. A cap that a multisig can raise is not a cap; it is a mood. FAME's supply ceiling — 1,000,000,000 FAME — is written into the program's immutable constants, and the mint authority is burned at genesis. There is no governance path that raises it. The only way supply logic changes is a full program upgrade, which is gated by a 48-hour public timelock: holders get a verifiable exit window before any change lands.",
          "The cap matters to more than token price. Emissions are the protocol's expenditure budget — the only thing it can spend on liquidity incentives, contributor vesting, or treasury programs. A hard cap turns will-we-be-diluted from a governance question into arithmetic: every emission event is a readable transaction against a known schedule, and the sum can never exceed the constant. For a treasury allocating size, that converts dilution risk from a narrative into a line item.",
        ],
      },
      {
        heading: "Reading the risk surface",
        paragraphs: [
          "The institutional view of the safety page exposes five numbers per launch: the two above, plus three operational ones. All five are derived from chain state or repository artifacts. If your risk team cannot reproduce a number from primary sources, treat it as marketing until they can.",
        ],
        bullets: [
          "Audit coverage — independent reviews of the program with findings tracked to closure; reports are published in the repository's audit folder.",
          "Upgrade timelock — the public countdown any upgrade must wait out; long enough to exit, short enough to patch.",
          "Invariant re-verification — the proof set re-runs on every deploy in CI, so upgrades cannot quietly void the guarantees.",
        ],
      },
      {
        heading: "An institutional due-diligence checklist",
        paragraphs: [
          "Before allocating to any fair launch — FAME-deployed or otherwise — five checks take an afternoon and catch most of what matters:",
        ],
        bullets: [
          "1. Recompute the ratio from program accounts, not the frontend. Compare with the published floor and breaker thresholds.",
          "2. Verify the mint authority is actually burned, and the supply cap is an immutable constant — not a parameter a signer can edit.",
          "3. Read the timelock: who can schedule an upgrade, how long is the window, and can you exit inside it?",
          "4. Count the insider supply: team allocations, presales and OTC deals all show up as curve asymmetries. On FAME the answer is zero by construction — verify, don't assume.",
          "5. Re-run the proofs: ask which invariants are machine-checked and whether re-verification is CI-gated on every deploy.",
        ],
      },
    ],
    faq: [
      {
        q: "Where is the liquidity ratio computed?",
        a: "On-chain, by the FAME program itself, every slot — derived from program-owned accounts so any observer can recompute it without trusting a dashboard.",
      },
      {
        q: "What happens when the circuit breaker trips?",
        a: "New deposits and emissions halt automatically below the breaker threshold. Existing withdrawal rights keep priority; the launch resumes only when backing is restored above the floor.",
      },
      {
        q: "How is the emission cap enforced?",
        a: "As an immutable program constant with the mint authority burned at genesis. No vote, multisig, or parameter change can raise it — only a full redeployment, gated by the 48-hour public timelock.",
      },
    ],
  },
  {
    slug: "formal-verification-defi-safety",
    title: "Formal verification is DeFi's missing safety layer",
    seoTitle: "Formal Verification Is DeFi's Missing Safety Layer | FAME Protocol",
    description:
      "Audits sample code; proofs exclude bugs. What formal verification delivers for a launch protocol — and where it honestly stops.",
    seoDescription:
      "Why audits sample code while formal verification proves it: the invariants FAME machine-checks on every deploy, the honest limits of verified DeFi, and the five questions to ask any protocol claiming mathematical guarantees.",
    keywords: [
      "formal verification",
      "DeFi security",
      "smart contract invariants",
      "audits vs proofs",
      "parametric parlays",
      "on-chain settlement",
    ],
    datePublished: "2026-10-22",
    dateModified: "2026-10-22",
    readMinutes: 6,
    lead: "Audits sample code; proofs exclude it. What mathematical guarantees actually deliver for DeFi launch protocols — and the honest limits of verified.",
    sections: [
      {
        heading: "The numbers that should bother you",
        paragraphs: [
          "DeFi loses billions a year to bugs that a checklist would have caught. The industry's answer is audits: two or three humans reading code for two weeks and issuing a PDF. An audit is a sample, not a proof — it tells you the auditor did not find what they were looking for, not that it was not there.",
          "Formal verification is a different instrument. Instead of sampling executions, it enumerates the state space the program can occupy and checks that a stated property holds in every one of them. The output is not an opinion; it is a machine-checked derivation that an invariant — for example, the program's liquidity ratio can never be written below the breaker threshold without halting deposits — holds for all reachable states.",
        ],
      },
      {
        heading: "How FAME applies it — and where the proof ends",
        paragraphs: [
          "Every invariant that matters to settlement is machine-checked: solvency (liquid backing ≥ withdrawable liabilities at floor), cap conservation (total emitted supply ≤ the 1,000,000,000 constant), parley concentration (exposure between correlated legs stays inside the margin bound), and breaker liveness (below the threshold, deposits halt in the same slot).",
          "The proofs run in CI on every deploy. An upgrade cannot merge without re-verifying the full set, which closes the quiet path most incidents take: not a hostile change, but an innocent refactor that voids a guarantee nobody re-checked. The proof set is published in the repository, so your own team can re-run it rather than take our word for it.",
          "Where the proof ends is equally important to state. Formal verification covers the program, not the world: it says nothing about oracle feeds outside the program boundary, bridge custody, or the market risk of the underlying assets. A verified protocol can still lose money — it just loses money for reasons that were chosen and disclosed, not for reasons hidden in a corner of the state space.",
        ],
      },
      {
        heading: "What this means for a launch you're evaluating",
        paragraphs: [
          "Ask five questions. Which invariants are machine-checked, and can you read the statements? Do the proofs re-run in CI on every deploy, or once before launch? Are the properties checked against the deployed program bytecode or a snapshot? What is explicitly out of scope? Who maintains the specification when the code changes?",
          "A protocol that cannot answer should be priced as unaudited, regardless of what the marketing page says. FAME's thesis is that fair launches don't need more trust, more audits or more promises — they need fewer doors: one public curve, liquidity that provably stays, and emissions that can't outrun a constant.",
        ],
      },
    ],
    faq: [
      {
        q: "What is the difference between an audit and formal verification?",
        a: "An audit is a manual, time-boxed review — a sample of behaviours. Formal verification enumerates the reachable state space and machine-checks that stated invariants hold in all of it. FAME re-runs its proof set in CI on every deploy.",
      },
      {
        q: "Does formal verification make a protocol risk-free?",
        a: "No. It covers the program, not the world: oracle inputs, bridges and market risk sit outside the proof boundary. It removes a class of failure, not the concept of risk.",
      },
      {
        q: "Which FAME invariants are machine-checked?",
        a: "Solvency at the 1.20 floor, the 1,000,000,000 FAME cap conservation, parley concentration bounds between correlated legs, and breaker liveness when backing falls below 1.10.",
      },
    ],
  },
]

export function findArticle(slug: string): Article | undefined {
  return ARTICLES.find((article) => article.slug === slug)
}
