/**
 * Parametric order builder domain model.
 * Node A (primary trade) → Node B (second leg) → Node C (parley summary).
 * Compatibility is declarative: each second leg states whether it can form
 * a valid parametric parley with the primary trade and why.
 */

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
