"use client"

import { Tooltip } from "@base-ui-components/react/tooltip"
import {
  AreaChart,
  Badge,
  BadgeDelta,
  Card,
  CategoryBar,
  Metric,
  SparkAreaChart,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Tracker,
} from "@tremor/react"
import { useEffect, useRef, useState } from "react"
import { usePersona } from "@/components/persona-context"
import { useInView, useReducedMotion } from "@/lib/hooks"
import {
  type BlotterRow,
  buildInitialBlotter,
  buildUptimeSlots,
  buildVolumeSeries,
  formatCompactUsd,
  formatPct,
  HERO_METRICS,
  LIQUIDITY_MIX,
  tickBlotter,
} from "@/lib/market-data"

const STATUS_COLORS = {
  SETTLED: "emerald",
  PROOF: "sky",
  ROUTING: "amber",
} as const

const UPTIME_SLOTS = buildUptimeSlots()

type Flash = { id: string; dir: "up" | "down" } | null

function MetricHint({ label, hint }: { label: string; hint: string }) {
  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger
          aria-label={`About ${label}`}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-tremor-default text-content-tertiary transition-colors hover:text-content-default"
        >
          <span aria-hidden="true" className="text-sm">
            ⓘ
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner sideOffset={8} className="z-60">
            <Tooltip.Popup className="max-w-64 rounded-tremor-default border border-stroke-default bg-surface-raised p-3 text-xs leading-relaxed text-content-secondary shadow-tremor-dropdown">
              {hint}
            </Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

function Spark({ data }: { data: number[] }) {
  const points = data.map((value, index) => ({ i: index, v: value }))
  const rising = data[data.length - 1] >= data[0]
  return (
    <SparkAreaChart
      data={points}
      index="i"
      categories={["v"]}
      colors={[rising ? "emerald" : "rose"]}
      className="h-8 w-24"
      showGradient={false}
    />
  )
}

/**
 * Hero = live market blotter (Tremor UI). Streams simulated parley fills,
 * pauses when the tab is hidden or the section scrolls off-screen, and
 * suppresses row flashes under prefers-reduced-motion.
 */
export function HeroBlotter() {
  const { persona } = usePersona()
  const { ref, inView } = useInView<HTMLElement>()
  const reducedMotion = useReducedMotion()
  const [rows, setRows] = useState<BlotterRow[]>(() => buildInitialBlotter())
  const [flash, setFlash] = useState<Flash>(null)
  const [tabVisible, setTabVisible] = useState(true)
  const rowsRef = useRef(rows)
  const tickRef = useRef(0)
  const flashTimer = useRef<number | null>(null)

  useEffect(() => {
    const onVisibility = () => {
      setTabVisible(document.visibilityState === "visible")
    }
    document.addEventListener("visibilitychange", onVisibility, { passive: true })
    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
    }
  }, [])

  // The feed is "live" only while visible — derived, not stored.
  const live = inView && tabVisible

  useEffect(() => {
    if (!inView || !tabVisible) {
      return
    }
    const timer = window.setInterval(() => {
      tickRef.current += 1
      const next = tickBlotter(rowsRef.current, tickRef.current)
      const prevPrices = new Map(rowsRef.current.map((row) => [row.id, row.price]))
      const changed = next.find((row) => {
        const before = prevPrices.get(row.id)
        return before !== undefined && before !== row.price
      })
      if (changed && !reducedMotion) {
        const dir = changed.price > (prevPrices.get(changed.id) ?? 0) ? "up" : "down"
        setFlash({ id: changed.id, dir })
        if (flashTimer.current) window.clearTimeout(flashTimer.current)
        flashTimer.current = window.setTimeout(() => setFlash(null), 950)
      }
      rowsRef.current = next
      setRows(next)
    }, 2400)
    return () => {
      window.clearInterval(timer)
      if (flashTimer.current) window.clearTimeout(flashTimer.current)
    }
  }, [inView, tabVisible, reducedMotion])

  const institutional = persona === "institutional"

  return (
    <section
      ref={ref}
      id="top"
      aria-labelledby="hero-title"
      className="relative overflow-hidden border-b border-stroke-default"
    >
      <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="text-mono-xs text-content-accent">
              FAME {"//"} PARAMETRIC PARLAY INFRASTRUCTURE
            </p>
            <h1
              id="hero-title"
              className="mt-4 text-balance text-4xl font-medium leading-tight tracking-tight text-content-raise sm:text-5xl"
            >
              {institutional
                ? "Parametric parlays with formal settlement guarantees."
                : "Two-leg crypto strategies, without the guesswork."}
            </h1>
            <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-content-secondary">
              {institutional
                ? "Route delta-aware two-leg orders into program-owned vaults. Every leg settles against a formally verified invariant set, a 1.20 liquidity floor and a hard emission cap — arithmetic, not promises."
                : "Pick a view, add a second leg, and let the protocol do the risk math. Backed by on-chain liquidity you can recompute yourself — no insiders, no presale, no rug geometry."}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#access"
                className="inline-flex min-h-11 items-center rounded-tremor-default bg-surface-accent-inverse px-6 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
              >
                Request access
              </a>
              <a
                href="#build"
                className="inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-raise px-6 font-mono text-sm text-content-default transition-colors hover:bg-surface-hover"
              >
                Build a parley ↓
              </a>
            </div>
          </div>

          <div className="rounded-tremor-default border border-stroke-default bg-surface-secondary/60 p-5">
            <p className="text-mono-xs text-content-tertiary">
              {institutional ? "Risk envelope · illustrative" : "What you get · plain terms"}
            </p>
            {institutional ? (
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 font-mono text-sm">
                {[
                  ["Liquidity floor", "1.20"],
                  ["Breaker armed", "1.10"],
                  ["Emission cap", "1.0B FAME"],
                  ["Upgrade timelock", "48h public"],
                ].map(([term, value]) => (
                  <div key={term}>
                    <dt className="text-[11px] uppercase tracking-wider text-content-tertiary">
                      {term}
                    </dt>
                    <dd className="mt-1 text-lg text-content-accent">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <ul className="mt-4 space-y-3 text-sm text-content-secondary">
                <li className="flex gap-3">
                  <span aria-hidden="true" className="text-content-accent">
                    ✓
                  </span>
                  One public curve — everyone gets the same price, same slot.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="text-content-accent">
                    ✓
                  </span>
                  Liquidity stays in the program — you can check it every two seconds.
                </li>
                <li className="flex gap-3">
                  <span aria-hidden="true" className="text-content-accent">
                    ✓
                  </span>
                  Supply can never exceed 1,000,000,000 FAME. It is math, not a promise.
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* ── Metrics strip ─────────────────────────────────────────────── */}
        <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {HERO_METRICS.map((stat) => (
            <Card key={stat.label} className="!bg-surface-raise !p-5 !ring-stroke-default">
              <div className="flex items-start justify-between gap-2">
                <p className="text-tremor-label text-tremor-content-subtle">{stat.label}</p>
                <MetricHint label={stat.label} hint={stat.hint} />
              </div>
              <div className="mt-2 flex items-center gap-3">
                <Metric className="!text-content-default">{stat.value}</Metric>
                <BadgeDelta
                  deltaType={stat.deltaPct >= 0 ? "moderateIncrease" : "moderateDecrease"}
                  className={
                    stat.deltaPct >= 0
                      ? "!bg-content-accent/10 !text-content-accent !ring-content-accent/20"
                      : "!bg-content-error/10 !text-content-error !ring-content-error/20"
                  }
                >
                  {formatPct(stat.deltaPct)}
                </BadgeDelta>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Charts row ────────────────────────────────────────────────── */}
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="!bg-surface-raise !p-5 !ring-stroke-default lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-tremor-default font-medium text-tremor-content-emphasis">
                  Parley notional · rolling 12h window
                </p>
                <p className="text-tremor-label text-tremor-content-subtle">
                  USD millions · institutional vs retail sleeves
                </p>
              </div>
              <Badge
                color="emerald"
                className="!bg-content-accent/10 !text-content-accent !ring-content-accent/20"
              >
                HEALTHY
              </Badge>
            </div>
            <AreaChart
              data={buildVolumeSeries()}
              index="label"
              categories={["institutional", "retail"]}
              colors={["emerald", "gray"]}
              valueFormatter={(value) => `$${value}M`}
              className="mt-4 h-44"
              showLegend
              showGradient={false}
            />
          </Card>

          <Card className="!bg-surface-raise !p-5 !ring-stroke-default">
            <p className="text-tremor-default font-medium text-tremor-content-emphasis">
              Liquidity composition
            </p>
            <CategoryBar
              values={LIQUIDITY_MIX}
              colors={["emerald", "teal", "gray"]}
              className="mt-4"
              showAnimation={false}
            />
            <ul className="mt-4 space-y-2 font-mono text-xs text-content-secondary">
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
                Program-owned · 64%
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-teal-400" aria-hidden="true" />
                Vaulted parley margin · 24%
              </li>
              <li className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-gray-500" aria-hidden="true" />
                External MM commitments · 12%
              </li>
            </ul>
            <p className="mt-5 text-tremor-default font-medium text-tremor-content-emphasis">
              Settlement uptime · 30 slots
            </p>
            <Tracker data={UPTIME_SLOTS} className="mt-3" />
          </Card>
        </div>

        {/* ── Live blotter ──────────────────────────────────────────────── */}
        <Card className="mt-4 !bg-surface-raise !p-0 !ring-stroke-default">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke-default px-5 py-4">
            <div className="flex items-center gap-3">
              <h2 className="font-mono text-sm font-medium tracking-widest text-content-default">
                PARLAY BLOTTER
              </h2>
              {live ? (
                <span className="inline-flex items-center gap-2 rounded-tremor-full border border-stroke-accent-quaternary bg-surface-accent px-2.5 py-1 font-mono text-[10px] tracking-widest text-content-accent">
                  <span
                    className="live-dot h-1.5 w-1.5 rounded-full bg-content-accent"
                    aria-hidden="true"
                  />
                  LIVE
                </span>
              ) : (
                <Badge
                  color="gray"
                  className="!bg-content-tertiary/10 !text-content-secondary !ring-stroke-default"
                >
                  PAUSED
                </Badge>
              )}
            </div>
            <p className="font-mono text-[11px] text-content-tertiary">
              {institutional
                ? "ρ = leg correlation · slot-settled"
                : "Simulated fills for demonstration"}
            </p>
          </div>

          <p className="sr-only">
            Live simulated trading feed; rows update every 2.4 seconds while this section is on
            screen.
          </p>
          <div className="overflow-x-auto">
            <Table className="[&_table]:w-full">
              <TableHead>
                <TableRow className="!border-stroke-default">
                  <TableRowCells institutional={institutional} />
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} className="!border-stroke-default">
                    {institutional && (
                      <>
                        <TableCell className="!px-5 font-mono text-xs text-content-tertiary">
                          {row.time}
                        </TableCell>
                        <TableCell className="!px-5 font-mono text-sm text-content-default">
                          {row.market}
                        </TableCell>
                        <TableCell className="!px-5">
                          <Badge
                            color={row.side === "BUY" ? "emerald" : "rose"}
                            className={`!rounded-tremor-small font-mono ${
                              row.side === "BUY"
                                ? "!bg-content-accent/10 !text-content-accent !ring-content-accent/20"
                                : "!bg-content-error/10 !text-content-error !ring-content-error/20"
                            }`}
                          >
                            {row.side}
                          </Badge>
                        </TableCell>
                        <TableCell className="!px-5 text-right font-mono text-sm tabular-nums text-content-secondary">
                          {formatCompactUsd(row.notionalUsd)}
                        </TableCell>
                        <TableCell className="!px-5 text-right font-mono text-sm tabular-nums text-content-secondary">
                          {row.correlation.toFixed(2)}
                        </TableCell>
                      </>
                    )}
                    {!institutional && (
                      <TableCell className="!px-5 font-mono text-sm text-content-default">
                        {row.market}
                      </TableCell>
                    )}
                    <TableCell
                      className={`!px-5 text-right font-mono text-sm tabular-nums text-content-default ${
                        flash?.id === row.id ? (flash.dir === "up" ? "flash-up" : "flash-down") : ""
                      }`}
                    >
                      {row.price.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="!px-5 text-right font-mono text-sm tabular-nums">
                      <span
                        className={row.deltaPct >= 0 ? "text-content-accent" : "text-content-error"}
                      >
                        {formatPct(row.deltaPct)}
                      </span>
                    </TableCell>
                    <TableCell className="!px-5">
                      <Spark data={row.spark} />
                    </TableCell>
                    {institutional && (
                      <TableCell className="!px-5">
                        <Badge
                          color={STATUS_COLORS[row.status]}
                          className={`!rounded-tremor-small font-mono ${
                            row.status === "SETTLED"
                              ? "!bg-content-accent/10 !text-content-accent !ring-content-accent/20"
                              : row.status === "PROOF"
                                ? "!bg-content-info/10 !text-content-info !ring-content-info/20"
                                : "!bg-content-notice/10 !text-content-notice !ring-content-notice/20"
                          }`}
                        >
                          {row.status}
                        </Badge>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </section>
  )
}

function TableRowCells({ institutional }: { institutional: boolean }) {
  const heads = institutional
    ? ["Time", "Market", "Side", "Notional", "ρ", "Price", "Δ", "Trend", "Status"]
    : ["Market", "Price", "Δ 24h", "Trend"]
  return (
    <>
      {heads.map((head) => (
        <TableHeaderCell
          key={head}
          className="!bg-surface-secondary !px-5 !py-3 font-mono !text-[11px] uppercase tracking-widest !text-content-tertiary"
        >
          {head}
        </TableHeaderCell>
      ))}
    </>
  )
}
