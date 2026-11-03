"use client"

import { Tooltip } from "@base-ui-components/react/tooltip"
import { Card, ProgressBar, Tracker } from "@tremor/react"
import { usePersona } from "@/components/persona-context"
import { buildUptimeSlots } from "@/lib/market-data"

const SLOTS = buildUptimeSlots(20)

type AnchorStat = {
  term: string
  value: string
  detail: string
  definition: string
}

const INSTITUTIONAL_STATS: AnchorStat[] = [
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

const RETAIL_STATS: AnchorStat[] = [
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

/**
 * Protocol Stability anchor — the formal-verification metrics block that
 * follows the hero. Every term is explained on first use via a tooltip
 * (WCAG: jargon must not assume context).
 */
export function StabilityAnchor() {
  const { persona } = usePersona()
  const stats = persona === "institutional" ? INSTITUTIONAL_STATS : RETAIL_STATS

  return (
    <section
      id="stability"
      aria-labelledby="stability-title"
      className="border-b border-stroke-dim"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="font-mono text-xs tracking-[0.25em] text-brand-green">
          PROTOCOL STABILITY ANCHOR
        </p>
        <h2
          id="stability-title"
          className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-content-primary sm:text-4xl"
        >
          {persona === "institutional"
            ? "The guarantees, in numbers you can recompute."
            : "The safety numbers, in plain figures."}
        </h2>
        <p className="mt-4 max-w-2xl text-content-secondary">
          Every metric below is derived from program accounts or repository artifacts — not
          dashboards. Hover any term for its definition; then verify it from primary sources.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.term} className="!bg-surface-base !p-5 !ring-stroke-dim">
              <div className="flex items-start justify-between gap-2">
                <p className="font-mono text-[11px] uppercase tracking-widest text-content-faint">
                  {stat.term}
                </p>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      aria-label={`What does ${stat.term} mean?`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-tremor-default text-content-faint transition-colors hover:text-brand-green"
                    >
                      <span aria-hidden="true" className="text-sm">
                        ⓘ
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={8} className="z-60">
                        <Tooltip.Popup className="max-w-72 rounded-tremor-default border border-stroke-dim bg-surface-raised p-3 text-xs leading-relaxed text-content-secondary shadow-tremor-dropdown">
                          {stat.definition}
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
              <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-brand-green">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-content-secondary">{stat.detail}</p>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="!bg-surface-base !p-5 !ring-stroke-dim lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-tremor-default font-medium text-tremor-content-emphasis">
                Liquidity ratio vs. floor
              </p>
              <p className="font-mono text-xs text-content-faint">floor 1.20 · breaker 1.10</p>
            </div>
            <ProgressBar
              value={89}
              color="emerald"
              className="mt-4 [&>_div:nth-child(2)_div]:!bg-brand-green"
              showAnimation={false}
            />
            <p className="mt-3 font-mono text-xs text-content-secondary">
              1.34 current · +11.7% above floor · warning trail empty · deposits open
            </p>
          </Card>
          <Card className="!bg-surface-base !p-5 !ring-stroke-dim">
            <p className="text-tremor-default font-medium text-tremor-content-emphasis">
              Settlement proofs · recent slots
            </p>
            <Tracker data={SLOTS} className="mt-4" />
            <p className="mt-3 font-mono text-xs text-content-secondary">
              19 settled · 1 breaker-armed · 0 violations
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
