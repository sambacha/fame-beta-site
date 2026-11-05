---
title: "Formal Verification Is DeFi's Missing Safety Layer | FAME Protocol"
description: "Why audits sample code while formal verification proves it: the invariants FAME machine-checks on every deploy, the honest limits of verified DeFi, and the five questions to ask any protocol claiming mathematical guarantees."
canonical: https://sambacha.github.io/fame-beta-site/fame-beta-site/journal/formal-verification-defi-safety
date_published: 2026-10-22
date_modified: 2026-10-22
read_minutes: 6
keywords: formal verification, DeFi security, smart contract invariants, audits vs proofs, parametric parlays, on-chain settlement
format: text/markdown
---
# Formal verification is DeFi's missing safety layer

> Audits sample code; proofs exclude it. What mathematical guarantees actually deliver for DeFi launch protocols — and the honest limits of verified.

## The numbers that should bother you

DeFi loses billions a year to bugs that a checklist would have caught. The industry's answer is audits: two or three humans reading code for two weeks and issuing a PDF. An audit is a sample, not a proof — it tells you the auditor did not find what they were looking for, not that it was not there.

Formal verification is a different instrument. Instead of sampling executions, it enumerates the state space the program can occupy and checks that a stated property holds in every one of them. The output is not an opinion; it is a machine-checked derivation that an invariant — for example, the program's liquidity ratio can never be written below the breaker threshold without halting deposits — holds for all reachable states.


## How FAME applies it — and where the proof ends

Every invariant that matters to settlement is machine-checked: solvency (liquid backing ≥ withdrawable liabilities at floor), cap conservation (total emitted supply ≤ the 1,000,000,000 constant), parley concentration (exposure between correlated legs stays inside the margin bound), and breaker liveness (below the threshold, deposits halt in the same slot).

The proofs run in CI on every deploy. An upgrade cannot merge without re-verifying the full set, which closes the quiet path most incidents take: not a hostile change, but an innocent refactor that voids a guarantee nobody re-checked. The proof set is published in the repository, so your own team can re-run it rather than take our word for it.

Where the proof ends is equally important to state. Formal verification covers the program, not the world: it says nothing about oracle feeds outside the program boundary, bridge custody, or the market risk of the underlying assets. A verified protocol can still lose money — it just loses money for reasons that were chosen and disclosed, not for reasons hidden in a corner of the state space.


## What this means for a launch you're evaluating

Ask five questions. Which invariants are machine-checked, and can you read the statements? Do the proofs re-run in CI on every deploy, or once before launch? Are the properties checked against the deployed program bytecode or a snapshot? What is explicitly out of scope? Who maintains the specification when the code changes?

A protocol that cannot answer should be priced as unaudited, regardless of what the marketing page says. FAME's thesis is that fair launches don't need more trust, more audits or more promises — they need fewer doors: one public curve, liquidity that provably stays, and emissions that can't outrun a constant.


## FAQ

### What is the difference between an audit and formal verification?

An audit is a manual, time-boxed review — a sample of behaviours. Formal verification enumerates the reachable state space and machine-checks that stated invariants hold in all of it. FAME re-runs its proof set in CI on every deploy.
### Does formal verification make a protocol risk-free?

No. It covers the program, not the world: oracle inputs, bridges and market risk sit outside the proof boundary. It removes a class of failure, not the concept of risk.
### Which FAME invariants are machine-checked?

Solvency at the 1.20 floor, the 1,000,000,000 FAME cap conservation, parley concentration bounds between correlated legs, and breaker liveness when backing falls below 1.10.

## Data appendix (illustrative, deterministic)

### Machine-checked invariant families (214 total)
| family | invariants |
| --- | --- |
| Solvency | 58 |
| Parley concentration | 49 |
| Cap conservation | 41 |
| Breaker liveness | 33 |
| Account & authority | 33 |

### Invariant ratchet by release
| release | invariants_reverified |
| --- | --- |
| v0.1 | 24 |
| v0.2 | 47 |
| v0.3 | 68 |
| v0.4 | 92 |
| v0.5 | 104 |
| v0.6 | 129 |
| v0.7 | 147 |
| v0.8 | 168 |
| v0.9 | 183 |
| v0.10 | 196 |
| v0.11 | 208 |
| v0.12 | 214 |

### Audit sampling vs. exhaustive proof coverage by defect class (%)
| defect_class | time_boxed_audit | machine_checked_proof |
| --- | --- | --- |
| Arithmetic overflow | 35 | 100 |
| State-transition gaps | 30 | 100 |
| Authority misuse | 60 | 100 |
| Economic invariant breach | 15 | 100 |

### Proof boundary
| domain | inside_proof_set | note |
| --- | --- | --- |
| Program state transitions | yes | Every reachable state checked against the invariant set on every deploy. |
| Solvency & cap conservation | yes | Backing ≥ floor and emissions ≤ 1,000,000,000 FAME are theorem-level properties. |
| Parley concentration bounds | yes | Correlated-leg exposure provably stays inside the margin bound. |
| Oracle feeds | no | Inputs from outside the program boundary — priced by risk policy, not proofs. |
| Bridge custody | no | Assets in flight across bridges sit outside the verified program. |
| Market risk | no | A verified protocol can still lose value on the underlying assets. |

### CI verification pipeline
| step | detail |
| --- | --- |
| Specification | Invariants stated as machine-checkable properties in the public repository. |
| Proof run | Full state-space check against the candidate program build. |
| CI gate | Merge blocked unless all 214 invariants re-verify on the exact bytecode. |
| Timelock | 48-hour public countdown with a verifiable exit window before activation. |

---

Canonical HTML version: https://sambacha.github.io/fame-beta-site/fame-beta-site/journal/formal-verification-defi-safety
Site index for agents: https://sambacha.github.io/fame-beta-site/fame-beta-site/llms.txt

Figures marked illustrative are deterministic design parameters, not live chain state. Verify from primary sources: program accounts and the public invariant repository.
