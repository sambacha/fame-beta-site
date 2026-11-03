"use client"

import { AreaChart, BarChart } from "@tremor/react"
import { AUDIT_VS_PROOF, buildInvariantRatchet, INVARIANT_COVERAGE } from "@/lib/analysis-data"

/**
 * Chart suite for "Formal verification is DeFi's missing safety layer".
 * Flat fills, Oxide-palette series via the alias layer in globals.css.
 */

const RATCHET = buildInvariantRatchet()

export function InvariantCoverageChart() {
  return (
    <BarChart
      data={INVARIANT_COVERAGE}
      index="family"
      categories={["count"]}
      colors={["emerald"]}
      showLegend={false}
      yAxisWidth={56}
      className="h-56"
      valueFormatter={(value) => `${value}`}
    />
  )
}

export function InvariantRatchetChart() {
  return (
    <AreaChart
      data={RATCHET}
      index="release"
      categories={["invariants"]}
      colors={["emerald"]}
      showLegend={false}
      showGradient={false}
      startEndOnly
      yAxisWidth={56}
      className="h-56"
      valueFormatter={(value) => `${value}`}
    />
  )
}

export function AuditVsProofChart() {
  return (
    <BarChart
      data={AUDIT_VS_PROOF}
      index="defect"
      categories={["audit", "proof"]}
      colors={["gray", "emerald"]}
      showLegend
      valueFormatter={(value) => `${value}%`}
      yAxisWidth={56}
      className="h-60"
    />
  )
}
