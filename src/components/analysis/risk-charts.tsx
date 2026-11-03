"use client"

import { AreaChart, BarChart, LineChart } from "@tremor/react"
import {
  BACKING_COMPARISON,
  buildBreakerEpisode,
  buildEmissionSchedule,
  buildLiquidityRatioSeries,
} from "@/lib/analysis-data"

/**
 * Chart suite for "Inside FAME's risk engine: liquidity ratios & emission caps".
 * Series colors resolve through the Tremor alias layer in globals.css — every
 * shade lands on an Oxide OKLCH step. Gradients are off: flat fills only.
 */

const RATIO_SERIES = buildLiquidityRatioSeries()
const EPISODE = buildBreakerEpisode()
const EMISSION = buildEmissionSchedule()

function ratioFormatter(value: number): string {
  return `${value.toFixed(2)}×`
}

export function LiquidityRatioChart() {
  const data = RATIO_SERIES.map((point) => ({
    slot: point.slot,
    ratio: point.ratio,
    floor: 1.2,
    breaker: 1.1,
  }))
  return (
    <LineChart
      data={data}
      index="slot"
      categories={["ratio", "floor", "breaker"]}
      colors={["emerald", "gray", "rose"]}
      valueFormatter={ratioFormatter}
      startEndOnly
      showLegend
      autoMinValue
      yAxisWidth={56}
      className="h-56"
    />
  )
}

export function BreakerEpisodeChart() {
  return (
    <LineChart
      data={EPISODE}
      index="slot"
      categories={["ratio"]}
      colors={["emerald"]}
      valueFormatter={ratioFormatter}
      startEndOnly
      autoMinValue
      yAxisWidth={56}
      className="h-56"
      customTooltip={({ active, payload, label }) => {
        if (!active || !payload?.length) return null
        const point = EPISODE.find((p) => String(p.slot) === String(label))
        return (
          <div className="rounded-tremor-default border border-stroke-default bg-surface-raise p-3 shadow-menu text-xs">
            <p className="font-mono text-content-tertiary">slot {label}</p>
            <p className="mt-1 font-mono text-content-default tabular-nums">
              ratio {ratioFormatter(Number(payload[0].value))}
            </p>
            <p className="mt-1 font-mono text-content-notice">
              {point?.deposits === "halted" ? "■ deposits + emissions halted" : "□ deposits open"}
            </p>
          </div>
        )
      }}
    />
  )
}

export function EmissionChart() {
  return (
    <AreaChart
      data={EMISSION}
      index="month"
      categories={["incentives", "contributors", "treasury", "total"]}
      colors={["teal", "gray", "sky", "emerald"]}
      valueFormatter={(value) => `${value}M`}
      showLegend
      showGradient={false}
      yAxisWidth={56}
      className="h-64"
    />
  )
}

export function BackingComparisonChart() {
  return (
    <BarChart
      data={BACKING_COMPARISON}
      index="launch"
      categories={["multiple"]}
      colors={["emerald"]}
      valueFormatter={(value) => `${value.toFixed(2)}×`}
      showLegend={false}
      yAxisWidth={56}
      className="h-48"
    />
  )
}
