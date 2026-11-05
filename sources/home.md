---
title: "FAME Protocol — Formally Verified Parametric Parlay Infrastructure"
description: "FAME Protocol is formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs."
canonical: https://sambacha.github.io/fame-beta-site/
format: text/markdown
---

# FAME Protocol

> One curve. No insiders.

FAME Protocol is formally verified parametric parlay infrastructure: two-leg structured trades with on-chain liquidity ratios, a hard emission cap and slot-level settlement proofs.

## Protocol stability anchor

Every metric below is derived from program accounts or repository artifacts — not dashboards. Hover any term for its definition; then verify it from primary sources.

### Institutional view

| term | value | detail |
| --- | --- | --- |
| Liquidity floor | 1.20 | Current ratio 1.34 · breaker arms at 1.10 |
| Emission cap | 1.0B | Immutable constant · mint authority burned |
| Upgrade timelock | 48h | Public countdown before any program change |
| Invariants re-verified | 214 | Proof set re-runs in CI on every deploy |

### Retail view

| term | value | detail |
| --- | --- | --- |
| Backed | 120% | Every claim exceeds its backing by 20% |
| Supply cap | 1.0B | No hidden printer — the mint key is destroyed |
| Exit window | 48h | Public notice before any code change |
| Proof checks | 214 | Automatic safety tests run on every update |

Design parameters: liquidity floor 1.20 · breaker 1.10 · emission cap 1,000,000,000 FAME (immutable, mint authority burned) · 48h upgrade timelock · 214 invariants re-verified in CI on every deploy.

## Why FAME — institutional narrative

### Structured products, trust-me settlement

- Counterparty opacity — you see NAV prints, not the vault; repricing happens inside someone else's black box.
- Discretionary emissions — treasuries dilute on a vote, and your allocation model eats the variance.
- Audits as theater — a two-week code sample is treated as a guarantee, until the day it isn't.
- Upgrade risk — parameters move between quarters, under signatures you never see.

### Arithmetic instead of assurances

- Slot-level liquidity ratio — liquid_backing ÷ withdrawable_liabilities computed on-chain every slot; the 1.20 floor and 1.10 breaker are constants, not policies.
- A cap that cannot move — 1,000,000,000 FAME in the program's immutable constants, mint authority burned at genesis. Dilution becomes a line item.
- Proofs over PDFs — 214 invariants (solvency, cap conservation, parley concentration, breaker liveness) re-verified in CI on every deploy.
- Change calendar, not surprises — every upgrade waits out a 48-hour public timelock with a verifiable exit window.

## Why FAME — retail narrative

### Crypto strategies, casino odds

- Insiders get the good entry — presales and OTC deals price before you even see the chart.
- Liquidity that vanishes — the moment you need out, the pool is a puddle and the devs are quiet.
- Jargon as a moat — 'impermanent loss hedging' that means nobody can check anything.
- Unlimited printers — supply caps that turn out to be a multisig vote away from nothing.

### One curve. No insiders.

- Everyone buys the same public curve at the same slot — no presale, no team allocation, no OTC desk.
- The money stays in the program — 1.20× backing behind every withdrawable claim, recomputable by you every two seconds.
- Plain numbers on the page — backed %, supply cap, exit window. If a term confuses you, hover it for the definition.
- Supply is capped at 1,000,000,000 FAME and the mint key is destroyed. It is math, not a promise.

## Parametric order flow

Three nodes, one state machine: pick the primary trade, filter the second leg by correlation, review the parametric summary. Amount changes recompute the second leg and the payoff automatically.

| node | behaviour |
| --- | --- |
| Primary trade | Base-UI Select over the liquid trade set — price, APR and liquidity shown per option. |
| Second leg | RadioGroup filtered to correlation-safe legs for the chosen primary; read-only sizing derived from the amount. |
| Parametric summary | Notional, both legs, aggregate correlation and the formally verified settlement path, with the payoff curve beneath. |

Ticket bounds: 1,000 USD. Orders beyond the FAME liquidity bound are rejected with a non-destructive notice — the builder never lets you size into an illiquid pair.

## Request access

Notional onboarding for parley vaults is gated to keep the curve fair. Bring your mandate; we bring the proof pack — program constants, invariant set, and the audit folder.

- Proof pack within 48 hours: constants, invariants, CI configuration.
- Vault desk for size — OTC settlement with slot-level proofs.
- Risk API: recompute the liquidity ratio from raw chain state.

Retail access opens in waves so the curve stays honest. Join the list and you will get a plain-language walkthrough before you ever commit capital.

- No minimum size on the public curve.
- Plain-language guides before any leg is opened.
- Your exit rights always settle first — by program rule.

---

Canonical HTML version: https://sambacha.github.io/fame-beta-site/
Research journal: https://sambacha.github.io/fame-beta-site/journal
Site index for agents: https://sambacha.github.io/fame-beta-site/llms.txt

All figures illustrative unless derived from program constants — verify from primary sources.