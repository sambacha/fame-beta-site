/**
 * Parametric order builder domain model.
 * Node A (primary trade) → Node B (second leg) → Node C (parley summary).
 * Compatibility is declarative: each second leg states whether it can form
 * a valid parametric parley with the primary trade and why.
 */

import { formatCompactUsd } from "@/lib/market-data"

export type RiskLevel = "conservative" | "balanced" | "aggressive"

export type TradeOption = {
  id: string
  label: string
  strategy: string
  apr: number
  maxNotionalUsd: number
  venue: string
  risk: RiskLevel
}

export type LegOption = {
  id: string
  label: string
  correlation: number
  apr: number
  compatible: boolean
  constraint?: string
}

export type ParleySummary = {
  legs: string
  combinedApr: number
  correlation: number
  maxLeverage: string
  settlement: string
  feeBps: number
}

export const TRADE_A_OPTIONS: TradeOption[] = [
  {
    id: "long-eth",
    label: "Long ETH/USD",
    strategy: "Perp ladder · hourly fence",
    apr: 14.2,
    maxNotionalUsd: 5_000_000,
    venue: "parley-vault-01",
    risk: "balanced",
  },
  {
    id: "short-btc",
    label: "Short BTC/USD",
    strategy: "Funding carry · slot-settled",
    apr: 11.6,
    maxNotionalUsd: 8_000_000,
    venue: "parley-vault-02",
    risk: "balanced",
  },
  {
    id: "range-eth",
    label: "Range Accrual ETH/USD",
    strategy: "Bounded accrual 2,900–3,400",
    apr: 19.8,
    maxNotionalUsd: 2_500_000,
    venue: "parley-vault-03",
    risk: "aggressive",
  },
  {
    id: "long-sol",
    label: "Long SOL/USD",
    strategy: "Momentum fence · hourly",
    apr: 16.4,
    maxNotionalUsd: 1_800_000,
    venue: "parley-vault-04",
    risk: "aggressive",
  },
]

export const SECOND_LEGS: Record<string, LegOption[]> = {
  "long-eth": [
    {
      id: "btc-delta-hedge",
      label: "Δ-neutral BTC perp hedge",
      correlation: -0.12,
      apr: 11.4,
      compatible: true,
    },
    {
      id: "lst-basis",
      label: "LST basis harvest",
      correlation: 0.83,
      apr: 18.2,
      compatible: true,
    },
    {
      id: "sol-momentum",
      label: "Short SOL momentum",
      correlation: 0.35,
      apr: 13.7,
      compatible: true,
    },
    {
      id: "eth-inverse",
      label: "Inverse ETH perp (2x)",
      correlation: -0.98,
      apr: 0.4,
      compatible: false,
      constraint:
        "Correlation −0.98 fully cancels the primary leg — margin engine rejects self-neutralising parlays.",
    },
  ],
  "short-btc": [
    {
      id: "eth-long-hedge",
      label: "Long ETH beta balance",
      correlation: 0.41,
      apr: 12.8,
      compatible: true,
    },
    {
      id: "funding-arb",
      label: "Cross-venue funding arb",
      correlation: 0.07,
      apr: 9.6,
      compatible: true,
    },
    {
      id: "btc-long",
      label: "Long BTC/USD (spot)",
      correlation: -0.94,
      apr: 2.1,
      compatible: false,
      constraint:
        "Spot BTC against short BTC is a zero-width box — the program enforces |ρ| ≤ 0.90 between legs.",
    },
  ],
  "range-eth": [
    {
      id: "btc-vol-basis",
      label: "BTC vol carry",
      correlation: 0.22,
      apr: 15.1,
      compatible: true,
    },
    {
      id: "stable-basis",
      label: "Stablecoin basis sleeve",
      correlation: 0.02,
      apr: 7.9,
      compatible: true,
    },
    {
      id: "alt-range",
      label: "Range Accrual SOL/USD",
      correlation: 0.71,
      apr: 21.3,
      compatible: false,
      constraint:
        "Two bounded accruals on correlated assets breach the parley concentration invariant (Σ exposure ≤ 0.6).",
    },
  ],
  "long-sol": [
    {
      id: "eth-beta-pair",
      label: "ETH beta pairing",
      correlation: 0.63,
      apr: 13.9,
      compatible: true,
    },
    {
      id: "arb-basis",
      label: "ARB ecosystem basis",
      correlation: 0.44,
      apr: 12.2,
      compatible: true,
    },
    {
      id: "inverse-sol",
      label: "Inverse SOL perp (2x)",
      correlation: -0.97,
      apr: 0.6,
      compatible: false,
      constraint:
        "Correlation −0.97 self-neutralises the momentum fence — pick a diversifying leg instead.",
    },
  ],
}

export function findTrade(id: string | null): TradeOption | null {
  return TRADE_A_OPTIONS.find((trade) => trade.id === id) ?? null
}

export function findLeg(tradeAId: string | null, legId: string | null): LegOption | null {
  if (!tradeAId || !legId) return null
  const legs = SECOND_LEGS[tradeAId] ?? []
  return legs.find((leg) => leg.id === legId) ?? null
}

const PARLAY_KICKER = 0.8

export function computeParlay(trade: TradeOption, leg: LegOption): ParleySummary {
  const combinedApr = Math.round((trade.apr * 0.55 + leg.apr * 0.45 + PARLAY_KICKER) * 10) / 10
  return {
    legs: `${trade.label} × ${leg.label}`,
    combinedApr,
    correlation: leg.correlation,
    maxLeverage: `${(Math.abs(leg.correlation) > 0.6 ? 2 : 3).toFixed(1)}×`,
    settlement: "Hourly · proof-verified",
    feeBps: 15,
  }
}

export function parleyTicket(tick: number): string {
  return `FAME-${(240_000 + ((tick * 7919) % 100_000)).toString(36).toUpperCase()}`
}

/* ────────────────────────────────────────────────────────────────────────────
   Parametric Order Configuration — dependent-leg sizing + payoff projection.
   The amount box is the source of truth; the second leg and the payoff chart
   are pure derivatives of it (amount → performCalculation → generateSummary),
   so the input, read-only field and chart can never drift apart.
   ──────────────────────────────────────────────────────────────────────── */

/** Protocol liquidity bound: below this the margin engine cannot size a leg. */
export const MIN_TICKET_USD = 1_000

/** Reference notional used to project the curve before a ticket is typed. */
export const REFERENCE_NOTIONAL_USD = 10_000

/** 30-day σ from a 38% annualised vol assumption (38% / √12 ≈ 11%). */
const SIGMA_30D = 0.11

/** Range-accrual width and accrual intensity for the bounded strategy. */
const RANGE_WIDTH = 0.18
const RANGE_ACCRUAL = 0.06

const TENOR_DAYS = 30

export type LegTwoComputed = {
  legId: string | null
  label: string
  notionalUsd: number
  ratio: string
} | null

export type PayoffPoint = {
  move: string
  "Parley P&L": number
  "Upper 1σ": number
  "Lower 1σ": number
}

export type ConfigSummary = {
  notionalUsd: number
  basis: "ticket" | "reference"
  liquidityBoundUsd: number
  utilizationPct: number
  riskLabel: "LOW" | "MED" | "HIGH"
  maturity: string
  breakevenMovePct: number
  maxGainUsd: number
  maxLossUsd: number
  curve: PayoffPoint[]
}

export type OrderConfig = {
  amount: number | null
  legOne: string
  legTwo: LegTwoComputed
  summary: ConfigSummary | null
}

export { formatCompactUsd }
export const formatSignedUsd = (value: number): string => {
  const abs = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Math.abs(value))
  return value >= 0 ? `+${abs}` : `−${abs}`
}

function primaryDirection(label: string): "long" | "short" | "range" {
  if (label.startsWith("Long")) return "long"
  if (label.startsWith("Short")) return "short"
  return "range"
}

/**
 * Dependent-leg sizing: the hedge notional scales with residual exposure
 * (1 − |ρ|) so highly correlated legs carry a larger offsetting position.
 */
export function performCalculation(
  amount: number,
  trade: TradeOption | null,
  leg: LegOption | null,
): LegTwoComputed {
  if (!trade || !leg || amount <= 0) return null
  const residual = 1 - Math.abs(leg.correlation)
  const notionalUsd = Math.round((amount * residual) / 1_000) * 1_000
  return {
    legId: leg.id,
    label: leg.label,
    notionalUsd,
    ratio: `ρ ${leg.correlation.toFixed(2)} · ${(residual * 1.0).toFixed(2)}× sizing`,
  }
}

/**
 * Payoff at settlement vs. primary-underlying spot, with a 1σ volatility
 * band. Pure and deterministic — the chart is a view over this function.
 */
export function generateSummary(
  amount: number | null,
  trade: TradeOption | null,
  leg: LegOption | null,
): ConfigSummary | null {
  if (!trade) return null

  const basis: "ticket" | "reference" = amount && amount > 0 ? "ticket" : "reference"
  const notionalUsd = basis === "ticket" ? (amount as number) : REFERENCE_NOTIONAL_USD

  const legApr = leg?.apr ?? trade.apr * 0.45
  const combinedApr = trade.apr * 0.55 + legApr * 0.45 + PARLAY_KICKER
  const carry = notionalUsd * (combinedApr / 100) * (TENOR_DAYS / 365)
  const fees = -notionalUsd * (15 / 10_000)

  const residual = leg ? 1 - Math.abs(leg.correlation) : 1
  const hedgeNotional = notionalUsd * residual
  const primaryLeverage = trade.risk === "aggressive" ? 1.6 : 1
  const direction = primaryDirection(trade.label)
  const sigma = notionalUsd * SIGMA_30D * primaryLeverage

  const curve: PayoffPoint[] = []
  for (let pct = -25; pct <= 25; pct += 5) {
    const move = pct / 100
    let primary: number
    if (direction === "long") {
      primary = notionalUsd * primaryLeverage * move
    } else if (direction === "short") {
      primary = -notionalUsd * primaryLeverage * move
    } else {
      primary = notionalUsd * RANGE_ACCRUAL * Math.max(0, 1 - Math.abs(move) / RANGE_WIDTH)
    }
    // The second leg offsets residual exposure in proportion to ρ.
    const hedge = leg ? -leg.correlation * hedgeNotional * move : 0
    const parley = primary + hedge + carry + fees
    curve.push({
      move: `${pct > 0 ? "+" : ""}${pct}%`,
      "Parley P&L": Math.round(parley),
      "Upper 1σ": Math.round(parley + sigma),
      "Lower 1σ": Math.round(parley - sigma),
    })
  }

  const pnls = curve.map((point) => point["Parley P&L"])
  const riskLabel: ConfigSummary["riskLabel"] =
    trade.risk === "aggressive" || (leg && Math.abs(leg.correlation) > 0.7)
      ? "HIGH"
      : trade.risk === "balanced"
        ? "MED"
        : "LOW"

  return {
    notionalUsd,
    basis,
    liquidityBoundUsd: trade.maxNotionalUsd,
    utilizationPct: Math.min(100, (notionalUsd / trade.maxNotionalUsd) * 100),
    riskLabel,
    maturity: `${TENOR_DAYS}D · hourly slot settlement`,
    breakevenMovePct: Math.round((-fees / (notionalUsd * primaryLeverage)) * 1_000) / 10,
    maxGainUsd: Math.max(...pnls),
    maxLossUsd: Math.min(...pnls),
    curve,
  }
}

/**
 * Instant amount validation against the protocol's liquidity bounds.
 * Returns the parsed ticket size plus a field-level error message; empty
 * input stays neutral so untouched forms never shout at the user.
 */
export function validateAmount(
  raw: string,
  trade: TradeOption | null,
): { amount: number | null; error: string | null } {
  const trimmed = raw.trim()
  if (trimmed === "") return { amount: null, error: null }
  const value = Number(trimmed)
  if (!Number.isFinite(value) || value <= 0) {
    return { amount: null, error: "Enter the ticket size in US dollars — digits only." }
  }
  if (!trade) return { amount: value, error: null }
  if (value < MIN_TICKET_USD) {
    return {
      amount: null,
      error: `Minimum ticket is $${MIN_TICKET_USD.toLocaleString("en-US")} — below this the margin engine cannot allocate a second leg.`,
    }
  }
  if (value > trade.maxNotionalUsd) {
    return {
      amount: null,
      error: `Exceeds the liquidity bound for ${trade.label} — max ${formatCompactUsd(trade.maxNotionalUsd)} per ticket.`,
    }
  }
  return { amount: Math.round(value), error: null }
}
