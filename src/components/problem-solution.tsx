"use client"

import { usePersona } from "@/components/persona-context"

type Narrative = {
  problemTitle: string
  problemBullets: string[]
  solutionTitle: string
  solutionBullets: string[]
}

const INSTITUTIONAL: Narrative = {
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
}

const RETAIL: Narrative = {
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
}

/**
 * Problem / Solution narrative — the conversion core of the page.
 * Copy switches on the persona toggle so each audience reads the frame
 * written for them (institutions: risk math; retail: fairness).
 */
export function ProblemSolution() {
  const { persona } = usePersona()
  const narrative = persona === "institutional" ? INSTITUTIONAL : RETAIL

  return (
    <section
      id="why-fame"
      aria-labelledby="why-title"
      className="cv-auto border-b border-stroke-dim"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="font-mono text-xs tracking-[0.25em] text-brand-green">WHY FAME</p>
        <h2
          id="why-title"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-content-primary sm:text-4xl"
        >
          {persona === "institutional"
            ? "Structured yield built like infrastructure, not like a promise."
            : "Structured crypto returns built so you can check everything yourself."}
        </h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-tremor-default border border-stroke-dim bg-surface-base p-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand-coral">
              The problem
            </p>
            <h3 className="mt-2 text-xl font-semibold text-content-primary">
              {narrative.problemTitle}
            </h3>
            <ul className="mt-5 space-y-4">
              {narrative.problemBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 text-sm leading-relaxed text-content-secondary"
                >
                  <span aria-hidden="true" className="mt-0.5 text-brand-coral">
                    ✕
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-tremor-default border border-brand-green/25 bg-brand-green/[0.04] p-6">
            <p className="font-mono text-[11px] uppercase tracking-widest text-brand-green">
              The FAME answer
            </p>
            <h3 className="mt-2 text-xl font-semibold text-content-primary">
              {narrative.solutionTitle}
            </h3>
            <ul className="mt-5 space-y-4">
              {narrative.solutionBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 text-sm leading-relaxed text-content-secondary"
                >
                  <span aria-hidden="true" className="mt-0.5 text-brand-green">
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <a
              href="#build"
              className="mt-6 inline-flex min-h-11 items-center font-mono text-sm text-brand-green transition-colors hover:text-brand-green-emphasis"
            >
              See how a parley is built →
            </a>
          </article>
        </div>
      </div>
    </section>
  )
}
