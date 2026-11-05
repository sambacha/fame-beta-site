---
title: "Liquidity Ratios & Emission Caps: Inside FAME's Risk Engine"
description: "How the FAME Protocol computes liquid backing per slot, why the 1,000,000,000 FAME emission cap is an immutable constant rather than a vote, and a five-step institutional due-diligence checklist for fair-launch DeFi."
canonical: https://sambacha.github.io/fame-beta-site/fame-beta-site/journal/liquidity-ratios-emission-caps
date_published: 2026-10-30
date_modified: 2026-10-30
read_minutes: 7
keywords: liquidity ratio, emission cap, DeFi risk management, institutional crypto, fair launch, Solana
format: text/markdown
---
# Inside FAME's risk engine: liquidity ratios & emission caps

> Two numbers constrain everything else in the protocol: how much liquid backing stands behind every withdrawable claim, and how much supply can ever exist. Here is how each is computed, enforced, and — when it matters — broken.

## The liquidity ratio, defined without hand-waving

For any launch, at any slot: liquidity_ratio = liquid_backing ÷ withdrawable_liabilities. Liquid backing is the value held in the launch's program-derived liquidity vault in assets that can be settled immediately — not staked positions, not vested allocations, not IOUs. Withdrawable liabilities is what participants could redeem right now under the launch's own rules: curve holdings above any published lock, plus committed exits.

The ratio is computed on-chain by the program at every slot and written to a program-owned account. That last clause does the heavy lifting: because the computation lives in the same program that enforces the result, any observer can recompute it from raw chain data. There is no official dashboard to trust — the launch console is a view, not a source of truth.

FAME operates the metric as a floor system (figures illustrative): the design floor is 1.20 — backing must exceed claims by at least 20% — and a circuit breaker arms at 1.10. Between the two, the launch accumulates a public warning trail. Below the breaker, the program halts new deposits and emissions automatically. Existing withdrawal rights keep priority; nothing needs to be voted, signed, or negotiated in the middle of a stress event.


## Why the emission cap is a constant, not a vote

Most token supply caps are promises with a mint authority still attached. A cap that a multisig can raise is not a cap; it is a mood. FAME's supply ceiling — 1,000,000,000 FAME — is written into the program's immutable constants, and the mint authority is burned at genesis. There is no governance path that raises it. The only way supply logic changes is a full program upgrade, which is gated by a 48-hour public timelock: holders get a verifiable exit window before any change lands.

The cap matters to more than token price. Emissions are the protocol's expenditure budget — the only thing it can spend on liquidity incentives, contributor vesting, or treasury programs. A hard cap turns will-we-be-diluted from a governance question into arithmetic: every emission event is a readable transaction against a known schedule, and the sum can never exceed the constant. For a treasury allocating size, that converts dilution risk from a narrative into a line item.


## Reading the risk surface

The institutional view of the safety page exposes five numbers per launch: the two above, plus three operational ones. All five are derived from chain state or repository artifacts. If your risk team cannot reproduce a number from primary sources, treat it as marketing until they can.

- Audit coverage — independent reviews of the program with findings tracked to closure; reports are published in the repository's audit folder.
- Upgrade timelock — the public countdown any upgrade must wait out; long enough to exit, short enough to patch.
- Invariant re-verification — the proof set re-runs on every deploy in CI, so upgrades cannot quietly void the guarantees.

## An institutional due-diligence checklist

Before allocating to any fair launch — FAME-deployed or otherwise — five checks take an afternoon and catch most of what matters:

- 1. Recompute the ratio from program accounts, not the frontend. Compare with the published floor and breaker thresholds.
- 2. Verify the mint authority is actually burned, and the supply cap is an immutable constant — not a parameter a signer can edit.
- 3. Read the timelock: who can schedule an upgrade, how long is the window, and can you exit inside it?
- 4. Count the insider supply: team allocations, presales and OTC deals all show up as curve asymmetries. On FAME the answer is zero by construction — verify, don't assume.
- 5. Re-run the proofs: ask which invariants are machine-checked and whether re-verification is CI-gated on every deploy.

## FAQ

### Where is the liquidity ratio computed?

On-chain, by the FAME program itself, every slot — derived from program-owned accounts so any observer can recompute it without trusting a dashboard.
### What happens when the circuit breaker trips?

New deposits and emissions halt automatically below the breaker threshold. Existing withdrawal rights keep priority; the launch resumes only when backing is restored above the floor.
### How is the emission cap enforced?

As an immutable program constant with the mint authority burned at genesis. No vote, multisig, or parameter change can raise it — only a full redeployment, gated by the 48-hour public timelock.

## Data appendix (illustrative, deterministic)

### Liquidity ratio · healthy window (every 6th slot)
| slot | liquidity_ratio | deposits |
| --- | --- | --- |
| 284148 | 1.347 | open |
| 284142 | 1.338 | open |
| 284136 | 1.351 | open |
| 284130 | 1.336 | open |
| 284124 | 1.342 | open |
| 284118 | 1.348 | open |
| 284112 | 1.356 | open |
| 284106 | 1.359 | open |

### Circuit-breaker stress episode
| slot | liquidity_ratio | deposits |
| --- | --- | --- |
| 301400 | 1.36 | open |
| 301401 | 1.33 | open |
| 301402 | 1.31 | open |
| 301403 | 1.28 | open |
| 301404 | 1.24 | open |
| 301405 | 1.19 | open |
| 301406 | 1.15 | open |
| 301407 | 1.12 | open |
| 301408 | 1.09 | halted |
| 301409 | 1.08 | halted |
| 301410 | 1.08 | halted |
| 301411 | 1.08 | halted |
| 301412 | 1.11 | open |
| 301413 | 1.16 | open |
| 301414 | 1.21 | open |
| 301415 | 1.26 | open |
| 301416 | 1.3 | open |
| 301417 | 1.33 | open |

### Emission schedule · cumulative by sleeve (millions of FAME, every 6th month)
| month | incentives | contributors | treasury | cumulative_total |
| --- | --- | --- | --- | --- |
| M6 | 131.1 | 34.8 | 12 | 177.9 |
| M12 | 228.4 | 69.6 | 24 | 322 |
| M18 | 301.6 | 104.4 | 36 | 442 |
| M24 | 357.4 | 139.2 | 48 | 544.6 |
| M30 | 400.8 | 174 | 60 | 634.8 |
| M36 | 435.3 | 208.8 | 72 | 716.1 |
| M42 | 463.4 | 243.6 | 84 | 791 |
| M48 | 486.9 | 278.4 | 96 | 861.3 |

Cap reference: total supply can never exceed 1,000,000,000 FAME (immutable program constant).

### Structural comparison
| dimension | FAME Protocol | Typical fair launch | Typical presale launch |
| --- | --- | --- | --- |
| Liquidity ratio source | Program-owned account, recomputable every slot | Frontend dashboard, operator-computed | Not published |
| Backing floor | 1.20 design floor · 1.10 auto-breaker | None — deposits always open | None |
| Supply cap | Immutable program constant, mint authority burned | Mutable mint authority behind a multisig | Unlimited or undisclosed |
| Insider allocation | Zero by construction | Team + vesting typically 15–30% | Presale + OTC before public |
| Upgrade path | 48h public timelock, CI-gated proof re-run | Instant upgrade authority | Undisclosed |
| Withdrawal priority under stress | Existing rights settle first, by program rule | First-come, first-served | Treasury discretion |

### Backing multiple by launch type (design floor)
| launch_type | backing_multiple |
| --- | --- |
| FAME (floor enforced) | 1.2 |
| Fair launch (typical) | 1 |
| Presale launch (typical) | 0.6 |

---

Canonical HTML version: https://sambacha.github.io/fame-beta-site/fame-beta-site/journal/liquidity-ratios-emission-caps
Site index for agents: https://sambacha.github.io/fame-beta-site/fame-beta-site/llms.txt

Figures marked illustrative are deterministic design parameters, not live chain state. Verify from primary sources: program accounts and the public invariant repository.
