/**
 * Deterministic market simulation for the hero blotter.
 * All series are generated from a seeded PRNG so server and client render
 * identical markup (zero hydration drift); live updates mutate from the seed.
 */

export type BlotterRow = {
  id: string
  time: string
  market: string
  side: "BUY" | "SELL"
  notionalUsd: number
  correlation: number
  price: number
  deltaPct: number
  spark: number[]
  status: "SETTLED" | "ROUTING" | "PROOF"
}

export type VolumePoint = {
  label: string
  institutional: number
  retail: number
}

export type MetricStat = {
  label: string
  value: string
  deltaPct: number
  hint: string
}

export type TrackerSlot = {
  color: "emerald" | "amber" | "rose"
  tooltip: string
}

/** mulberry32 — small, fast, seedable. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const MARKETS = [
  "ETH/USD",
  "BTC/USD",
  "SOL/USD",
  "ETH/BTC",
  "AVAX/USD",
  "LINK/USD",
  "ARB/USD",
  "OP/USD",
] as const

const VENUE_SEEDS = ["parley-vault-01", "parley-vault-02", "parley-vault-03", "parley-vault-04"]

function sparkFrom(rand: () => number, base: number, points = 16): number[] {
  const out: number[] = []
  let v = base
  for (let i = 0; i < points; i += 1) {
    v = Math.max(0.2, v * (1 + (rand() - 0.48) * 0.03))
    out.push(Number(v.toFixed(4)))
  }
  return out
}

function buildRow(rand: () => number, index: number, minute: number): BlotterRow {
  const market = MARKETS[index % MARKETS.length]
  const priceBase = market.startsWith("ETH")
    ? 3184
    : market.startsWith("BTC")
      ? 92410
      : market.startsWith("SOL")
        ? 214
        : market.startsWith("AVAX")
          ? 41
          : market.startsWith("LINK")
            ? 22
            : market.startsWith("ARB")
              ? 0.86
              : 1.92
  const price = Number((priceBase * (1 + (rand() - 0.5) * 0.02)).toFixed(priceBase < 2 ? 4 : 2))
  const statuses: BlotterRow["status"][] = ["SETTLED", "PROOF", "ROUTING", "SETTLED"]
  return {
    id: `row-${index}-${minute}`,
    time: `${String(9 + (index % 6)).padStart(2, "0")}:${String((minute * 7 + index * 11) % 60).padStart(2, "0")}:${String((index * 13) % 60).padStart(2, "0")}`,
    market,
    side: rand() > 0.48 ? "BUY" : "SELL",
    notionalUsd: Math.round((80_000 + rand() * 3_400_000) / 1000) * 1000,
    correlation: Number((rand() * 1.7 - 0.85).toFixed(2)),
    price,
    deltaPct: Number((rand() * 4.4 - 1.9).toFixed(2)),
    spark: sparkFrom(rand, price),
    status: statuses[index % statuses.length],
  }
}

export function buildInitialBlotter(count = 8): BlotterRow[] {
  const rand = mulberry32(20261030)
  const rows: BlotterRow[] = []
  for (let i = 0; i < count; i += 1) {
    rows.push(buildRow(rand, i, 0))
  }
  return rows.reverse()
}

export const BLOTTER_VENUES = VENUE_SEEDS

/** Advance the blotter by one tick — pure, so it is trivially testable. */
export function tickBlotter(rows: BlotterRow[], tick: number): BlotterRow[] {
  const rand = mulberry32(97_000 + tick * 7919)
  const drifted = rows.map((row, index) => {
    if (index % 3 !== tick % 3) return row
    const move = (rand() - 0.5) * 0.006
    const price = Number((row.price * (1 + move)).toFixed(row.price < 2 ? 4 : 2))
    return {
      ...row,
      price,
      deltaPct: Number((row.deltaPct + move * 100).toFixed(2)),
      spark: [...row.spark.slice(1), price],
    }
  })
  const fresh = buildRow(rand, Math.floor(rand() * 8), tick)
  return [fresh, ...drifted.slice(0, -1)]
}

export function buildVolumeSeries(points = 48): VolumePoint[] {
  const rand = mulberry32(42_424)
  const out: VolumePoint[] = []
  let inst = 24
  let retail = 9
  for (let i = points; i > 0; i -= 1) {
    inst = Math.min(58, Math.max(12, inst + (rand() - 0.46) * 4.2))
    retail = Math.min(26, Math.max(4, retail + (rand() - 0.44) * 2.1))
    const minutesAgo = i * 15
    const hoursAgo = minutesAgo / 60
    const label = hoursAgo >= 24 ? `-${Math.floor(hoursAgo / 24)}d` : `-${Math.round(minutesAgo)}m`
    out.push({
      label,
      institutional: Number(inst.toFixed(1)),
      retail: Number(retail.toFixed(1)),
    })
  }
  return out
}

export const HERO_METRICS: MetricStat[] = [
  {
    label: "Total value locked",
    value: "$412.8M",
    deltaPct: 3.2,
    hint: "Program-owned liquidity across all live parley vaults.",
  },
  {
    label: "24h parley notional",
    value: "$18.4M",
    deltaPct: 7.9,
    hint: "Two-leg parametric orders routed in the last 24 hours.",
  },
  {
    label: "Settlement success",
    value: "99.98%",
    deltaPct: 0.1,
    hint: "Slot-level settlement proofs verified on-chain since genesis.",
  },
  {
    label: "Emission headroom",
    value: "412.6M FAME",
    deltaPct: -0.4,
    hint: "Remaining supply under the 1,000,000,000 FAME immutable cap.",
  },
]

export const LIQUIDITY_MIX = [64, 24, 12]

export function buildUptimeSlots(count = 30): TrackerSlot[] {
  const rand = mulberry32(8080)
  const slots: TrackerSlot[] = []
  for (let i = 0; i < count; i += 1) {
    const r = rand()
    const color: TrackerSlot["color"] = r > 0.97 ? "amber" : "emerald"
    slots.push({
      color,
      tooltip: `Slot 284,${String(119_200 + i).padStart(3, "0")} · ${color === "emerald" ? "settled" : "breaker armed, deposits paused"}`,
    })
  }
  return slots
}

export const formatUsd = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n >= 1000 ? 0 : 2,
  }).format(n)

export const formatCompactUsd = (n: number): string =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n)

export const formatPct = (n: number): string => `${n > 0 ? "+" : ""}${n.toFixed(2)}%`
