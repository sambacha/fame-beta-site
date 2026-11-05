import type { ComponentChild, JSX } from "preact"
import { memo, useEffect, useMemo, useRef, useState } from "preact/compat"
import { AreaChart, Metric } from "@/components/charts"
import { Dialog } from "@/components/ui/dialog"
import { Radio, RadioGroup } from "@/components/ui/radio-group"
import { Select } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useReducedMotion } from "@/lib/hooks"
import {
  computeParlay,
  findTrade,
  formatCompactUsd,
  formatSignedUsd,
  type LegOption,
  MIN_TICKET_USD,
  type OrderConfig,
  type PayoffPoint,
  SECOND_LEGS,
  TRADE_A_OPTIONS,
} from "@/lib/order-data"
import { type OrderState, useOrderBuilder } from "./use-order-builder"

const RISK_LABELS = { conservative: "LOW", balanced: "MED", aggressive: "HIGH" } as const

const CONTROL_CLASS =
  "min-h-11 w-full rounded-tremor-default border border-stroke-raise bg-surface-secondary px-3 py-2.5 text-base text-content-default placeholder:text-content-tertiary focus:outline-none"

type NodeStatus = "idle" | "active" | "validating" | "complete" | "error"

const NODE_STYLES: Record<NodeStatus, string> = {
  idle: "border-stroke-default opacity-70",
  active: "border-stroke-accent-tertiary node-active-glow",
  validating: "border-stroke-notice",
  complete: "border-stroke-accent-secondary",
  error: "border-stroke-error",
}

const STATUS_TEXT: Record<NodeStatus, string> = {
  idle: "WAITING",
  active: "IN PROGRESS",
  validating: "VALIDATING",
  complete: "COMPLETE",
  error: "REJECTED",
}

function FlowNode({
  step,
  title,
  status,
  children,
}: {
  step: string
  title: string
  status: NodeStatus
  children: ComponentChild
}) {
  return (
    <li
      data-status={status}
      className={`flex h-full flex-col rounded-tremor-default border bg-surface-raise p-5 transition-colors ${NODE_STYLES[status]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-mono-xs text-content-tertiary">
          {step} · {title}
        </p>
        <p
          className={`font-mono text-[10px] tracking-widest ${
            status === "error"
              ? "text-content-error"
              : status === "validating"
                ? "text-content-notice"
                : status === "complete"
                  ? "text-content-accent"
                  : "text-content-tertiary"
          }`}
        >
          {STATUS_TEXT[status]}
        </p>
      </div>
      <div className="mt-4 flex flex-1 flex-col">{children}</div>
    </li>
  )
}

function FlowEdge({ active }: { active: boolean }) {
  return (
    <li
      aria-hidden="true"
      className="flow-edge h-10 w-px justify-self-center lg:h-full lg:w-full"
      data-active={active}
    >
      <span className="sr-only">{active ? "flow active" : ""}</span>
    </li>
  )
}

/** Node A — listbox Select over the primary trade. Memoised item renderer. */
const TradeSelect = memo(function TradeSelect({
  tradeAId,
  onSelect,
}: {
  tradeAId: string | null
  onSelect: (id: string, label: string) => void
}) {
  const items = useMemo(
    () =>
      TRADE_A_OPTIONS.map((trade) => ({
        value: trade.id,
        node: (
          <span className="grid grid-cols-[1fr_auto] items-center gap-3 px-3 py-2.5 text-left">
            <span className="block">
              <span className="block text-sm font-medium text-content-default">{trade.label}</span>
              <span className="block font-mono text-[11px] text-content-tertiary">
                {trade.strategy} · {RISK_LABELS[trade.risk]} risk
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="font-mono text-xs text-content-accent">{trade.apr}%</span>
              {trade.id === tradeAId && (
                <span className="text-content-accent" aria-hidden="true">
                  ✓
                </span>
              )}
            </span>
          </span>
        ),
      })),
    [tradeAId],
  )
  const selected = findTrade(tradeAId)

  return (
    <Select
      items={items}
      value={tradeAId}
      onValueChange={(value) => {
        const match = TRADE_A_OPTIONS.find((trade) => trade.id === value)
        if (match) onSelect(match.id, match.label)
      }}
      ariaLabel="Primary trade — leg one"
      id="trade-a-select"
      triggerClass="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-tremor-default border border-stroke-raise bg-surface-secondary px-4 py-2.5 text-left transition-colors data-[popup-open]:border-stroke-accent-secondary"
      popupClass="scroll-area max-h-96 overflow-y-auto rounded-tremor-default border border-stroke-default bg-surface-raise p-1 shadow-menu"
      itemClass="rounded-sm"
    >
      <span className="block truncate">
        {selected ? (
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-medium text-content-default">{selected.label}</span>
            <span className="font-mono text-xs text-content-accent">{selected.apr}% APR</span>
          </span>
        ) : (
          <span className="text-sm text-content-secondary">Select primary trade…</span>
        )}
      </span>
    </Select>
  )
})

/** Node B — RadioGroup over compatible second legs. */
const LegRadio = memo(function LegRadio({
  leg,
  name,
  disabled,
}: {
  leg: LegOption
  name: string
  disabled: boolean
}) {
  return (
    <Radio
      value={leg.id}
      disabled={disabled}
      className="group grid min-h-11 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-tremor-default border border-stroke-default bg-surface-secondary p-3 text-left transition-colors hover:border-stroke-raise data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[checked]:border-stroke-accent-secondary data-[checked]:bg-surface-accent/40"
    >
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-stroke-raise group-data-[checked]:border-stroke-accent-secondary"
      >
        <RadioDot />
      </span>
      <span>
        <span className="block text-sm font-medium text-content-default">{leg.label}</span>
        <span className="block font-mono text-[11px] text-content-tertiary">
          pairs with {name} · margin engine pre-cleared
        </span>
      </span>
      <span className="text-right font-mono text-xs">
        <span className="block text-content-accent">{leg.apr}%</span>
        <span className="block text-content-tertiary">ρ {leg.correlation.toFixed(2)}</span>
      </span>
    </Radio>
  )
})

/** The dot inside the radio indicator — needs the parent's data-checked state. */
function RadioDot() {
  return (
    <span
      aria-hidden="true"
      className="hidden h-2 w-2 rounded-full bg-content-accent group-data-[checked]:block"
    />
  )
}

/* ── Parametric Order Configuration ────────────────────────────────────────
   Amount (input) → dependent second leg (read-only) → payoff projection.
   All three derive from one synchronized `orderData` object in the hook, so
   the read-only field and the chart can never disagree with the ticket. */

const AmountField = memo(function AmountField({
  raw,
  error,
  maxUsd,
  tradeLabel,
  onChange,
}: {
  raw: string
  error: string | null
  maxUsd: number
  tradeLabel: string
  onChange: (raw: string) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label for="amount-input" className="text-sm font-medium text-content-secondary">
        Amount (USD){" "}
        <span aria-hidden="true" className="text-content-error">
          *
        </span>
      </label>
      <input
        id="amount-input"
        type="number"
        inputMode="decimal"
        required
        aria-required="true"
        min={MIN_TICKET_USD}
        max={maxUsd}
        step={1000}
        value={raw}
        onInput={(event: JSX.TargetedEvent<HTMLInputElement>) =>
          onChange((event.target as HTMLInputElement).value)
        }
        placeholder="50,000"
        aria-invalid={error ? "true" : undefined}
        aria-errormessage={error ? "amount-error" : undefined}
        aria-describedby={error ? "amount-error" : "amount-hint"}
        className={`${CONTROL_CLASS} ${error ? "border-stroke-error focus:border-stroke-error" : "focus:border-stroke-accent-secondary"}`}
      />
      {error ? (
        <p
          id="amount-error"
          aria-live="polite"
          className="text-xs leading-relaxed text-content-error"
        >
          {error}
        </p>
      ) : (
        <p id="amount-hint" className="font-mono text-[11px] text-content-tertiary">
          Liquidity bound for {tradeLabel}: {formatCompactUsd(maxUsd)} per ticket · min{" "}
          {formatCompactUsd(MIN_TICKET_USD)}
        </p>
      )}
    </div>
  )
})

const LegTwoField = memo(function LegTwoField({
  legTwo,
  legLabel,
}: {
  legTwo: OrderConfig["legTwo"]
  legLabel: string | null
}) {
  const value = legTwo
    ? `${legTwo.label} — ${formatCompactUsd(legTwo.notionalUsd)} hedge notional`
    : legLabel
      ? `${legLabel} — awaiting ticket amount`
      : "Select a second leg to populate"
  return (
    <div className="flex flex-col gap-1.5">
      <label for="leg-two-input" className="text-sm font-medium text-content-secondary">
        Secondary leg (auto-populated)
      </label>
      <input
        id="leg-two-input"
        readOnly
        value={value}
        aria-readonly="true"
        className={`${CONTROL_CLASS} cursor-default text-content-secondary`}
      />
      <p className="font-mono text-[11px] text-content-tertiary" aria-live="polite">
        {legTwo
          ? `${legTwo.ratio} · offsets the primary leg's residual exposure`
          : "Sizing = ticket × (1 − |ρ|) — the residual exposure offset"}
      </p>
    </div>
  )
})

const ConfigSummaryBlock = memo(function ConfigSummaryBlock({
  summary,
}: {
  summary: OrderConfig["summary"]
}) {
  if (!summary) return null
  const cells: [string, string][] = [
    [
      "Liquidity",
      `${summary.utilizationPct.toFixed(0)}% of ${formatCompactUsd(summary.liquidityBoundUsd)}`,
    ],
    ["Risk", summary.riskLabel],
    ["Expected maturity", summary.maturity],
    [
      "Breakeven",
      `${summary.breakevenMovePct > 0 ? "+" : ""}${summary.breakevenMovePct.toFixed(1)}% spot`,
    ],
  ]
  return (
    <div aria-live="polite">
      <p className="sr-only">
        Configuration summary — updates automatically as the ticket and legs change.
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
        {cells.map(([term, value]) => (
          <div
            key={term}
            className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1"
          >
            <dt className="text-content-tertiary">{term}</dt>
            <dd className="text-right text-content-secondary">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-[11px] leading-relaxed text-content-tertiary">
        {summary.basis === "ticket"
          ? `Projected on your ${formatCompactUsd(summary.notionalUsd)} ticket · max gain ${formatSignedUsd(summary.maxGainUsd)} · max loss ${formatSignedUsd(summary.maxLossUsd)}.`
          : `Projected at the ${formatCompactUsd(summary.notionalUsd)} reference ticket — enter an amount to resize the projection.`}
      </p>
    </div>
  )
})

const PayoffChart = memo(function PayoffChart({
  curve,
  reducedMotion,
  hasTicket,
}: {
  curve: PayoffPoint[]
  reducedMotion: boolean
  hasTicket: boolean
}) {
  return (
    <figure className="m-0">
      <figcaption className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-tremor-default font-medium text-tremor-content-emphasis">
          Payoff at settlement vs. spot
        </p>
        <p className="font-mono text-[11px] text-content-tertiary">
          {hasTicket ? "ticket basis" : "$10k reference basis"}
        </p>
      </figcaption>
      <AreaChart
        data={curve}
        index="move"
        categories={["Parley P&L", "Upper 1σ", "Lower 1σ"]}
        colors={["emerald", "teal", "rose"]}
        valueFormatter={(value) => formatSignedUsd(value)}
        className="mt-3 h-64"
        autoMinValue
        showAnimation={!reducedMotion}
        showLegend
        curveType="natural"
      />
      <figcaption className="mt-2 text-[11px] leading-relaxed text-content-tertiary">
        Two-leg projection: primary exposure ± correlation-offset hedge + 30-day carry − 15 bps
        venue fee. Band = ±1σ from a 38% annualised vol assumption. Illustrative — not investment
        advice.
      </figcaption>
    </figure>
  )
})

const OrderConfigPanel = memo(function OrderConfigPanel({
  tradeA,
  leg,
  orderData,
  amountRaw,
  amountError,
  reducedMotion,
  onAmountChange,
}: {
  tradeA: ReturnType<typeof findTrade>
  leg: LegOption | null
  orderData: OrderConfig
  amountRaw: string
  amountError: string | null
  reducedMotion: boolean
  onAmountChange: (raw: string) => void
}) {
  if (!tradeA) {
    return (
      <section
        aria-labelledby="config-title"
        className="mt-4 rounded-tremor-default border border-dashed border-stroke-default bg-surface-secondary/40 p-5 sm:p-6"
      >
        <h3
          id="config-title"
          className="font-mono text-sm font-medium uppercase tracking-widest text-content-tertiary"
        >
          Parametric Order Configuration
        </h3>
        <p aria-live="polite" className="mt-2 text-sm text-content-tertiary">
          Locked — select a primary trade to size the ticket and project payoff bounds.
        </p>
      </section>
    )
  }

  return (
    <section
      aria-labelledby="config-title"
      className="mt-4 rounded-tremor-default border border-stroke-default bg-surface-raise/60 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3
          id="config-title"
          className="font-mono text-sm font-medium uppercase tracking-widest text-content-default"
        >
          Parametric Order Configuration
        </h3>
        <p className="font-mono text-[11px] text-content-tertiary">
          leg one {orderData.legOne || "—"} · bound {formatCompactUsd(tradeA.maxNotionalUsd)}
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
        <div className="flex flex-col gap-5">
          <AmountField
            raw={amountRaw}
            error={amountError}
            maxUsd={tradeA.maxNotionalUsd}
            tradeLabel={tradeA.label}
            onChange={onAmountChange}
          />
          <LegTwoField legTwo={orderData.legTwo} legLabel={leg?.label ?? null} />
          <ConfigSummaryBlock summary={orderData.summary} />
        </div>
        <PayoffChart
          curve={orderData.summary?.curve ?? []}
          reducedMotion={reducedMotion}
          hasTicket={orderData.summary?.basis === "ticket"}
        />
      </div>
    </section>
  )
})

/** Node C — parametric summary + confirm dialog. */
const SummaryPanel = memo(function SummaryPanel({
  phase,
  ticket,
  legs,
  correlation,
  combinedApr,
  notionalUsd,
  utilizationPct,
  onRoute,
}: {
  phase: OrderState["phase"]
  ticket: string | null
  legs: string
  correlation: number
  combinedApr: number
  notionalUsd: number | null
  utilizationPct: number | null
  onRoute: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const closeDialog = () => setDialogOpen(false)

  if (phase === "SUBMITTED") {
    return (
      <div className="flex flex-1 flex-col items-start justify-center">
        <p className="text-mono-xs text-content-accent">Order routed</p>
        <p className="mt-2 font-mono text-2xl font-medium text-content-default">{ticket}</p>
        <p className="mt-2 text-sm text-content-secondary">
          Two legs locked. Settlement proofs post hourly against the vault — recompute them any time
          from program accounts.
        </p>
      </div>
    )
  }

  if (phase !== "PARLEY_READY") {
    return (
      <div className="flex flex-1 flex-col justify-center">
        <p className="text-sm text-content-tertiary">
          Complete legs one and two, then set the ticket notional in the configuration panel —
          correlation, combined carry and margin bounds follow.
        </p>
        <div aria-hidden="true" className="mt-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-surface-raise" />
          <div className="h-3 w-1/2 rounded bg-surface-raise" />
          <div className="h-3 w-2/3 rounded bg-surface-raise" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="font-mono text-xs text-content-secondary">{legs}</p>
      <div className="mt-3 flex items-end gap-3">
        <Metric className="!text-content-accent">{combinedApr.toFixed(1)}%</Metric>
        <span className="pb-1.5 font-mono text-[11px] text-content-tertiary">
          combined APR · +0.8% parley kicker
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
        <div className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1">
          <dt className="text-content-tertiary">ρ legs</dt>
          <dd className="text-content-secondary">{correlation.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1">
          <dt className="text-content-tertiary">Vault fee</dt>
          <dd className="text-content-secondary">15 bps</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1">
          <dt className="text-content-tertiary">Settlement</dt>
          <dd className="text-content-secondary">Hourly</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1">
          <dt className="text-content-tertiary">Margin</dt>
          <dd className="text-content-secondary">Pre-cleared</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1">
          <dt className="text-content-tertiary">Notional</dt>
          <dd className="text-content-secondary">
            {notionalUsd !== null ? formatCompactUsd(notionalUsd) : "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-secondary/60 pb-1">
          <dt className="text-content-tertiary">Utilization</dt>
          <dd className="text-content-secondary">
            {utilizationPct !== null ? `${utilizationPct.toFixed(0)}% of bound` : "—"}
          </dd>
        </div>
      </dl>

      <Dialog open={dialogOpen} onClose={closeDialog}>
        <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-tremor-default border border-stroke-default bg-surface-raise p-6 shadow-menu outline-none">
          <h3 className="text-lg font-medium text-content-default">Route parametric order</h3>
          <p className="mt-2 text-sm text-content-secondary">
            {legs} · {combinedApr.toFixed(1)}% combined APR · ρ {correlation.toFixed(2)}. The margin
            engine will pre-clear both legs before the next slot.
          </p>
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              className="inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-raise px-4 text-sm text-content-secondary transition-colors hover:text-content-default"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => {
                onRoute()
                closeDialog()
              }}
              className="inline-flex min-h-11 items-center rounded-tremor-default bg-surface-accent-inverse px-5 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
            >
              Route order
            </button>
          </div>
        </div>
      </Dialog>

      <button
        type="button"
        data-pulse={phase === "PARLEY_READY"}
        onClick={() => setDialogOpen(true)}
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-tremor-default bg-surface-accent-inverse px-5 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
      >
        Confirm parametric order
      </button>
    </div>
  )
})

/**
 * Parametric Order Flow — a sequential, react-flow-style builder rendered as
 * an accessible component pipeline: Node A (Select) → Node B (RadioGroup) →
 * Node C (summary + confirm Dialog), connected by animated pseudo-element
 * edges that respect prefers-reduced-motion.
 */
export function OrderFlowBuilder() {
  const {
    state,
    tradeA,
    leg,
    orderData,
    announcement,
    handleNodeSelect,
    handleAmountChange,
    submit,
    reset,
  } = useOrderBuilder()
  const { toast, dismiss } = useToast()
  const reducedMotion = useReducedMotion()
  const lastAttemptRef = useRef(0)
  const lastAmountErrorRef = useRef<string | null>(null)

  const legs: LegOption[] = tradeA ? (SECOND_LEGS[tradeA.id] ?? []) : []

  // Non-destructive constraint toast when the margin engine rejects a pair.
  useEffect(() => {
    if (state.phase !== "INVALID_PAIR" || !state.invalidReason) return
    if (lastAttemptRef.current === state.attempts) return
    lastAttemptRef.current = state.attempts
    const { id } = toast({
      title: "Parley rejected by margin engine",
      description: state.invalidReason,
    })
    const timer = window.setTimeout(() => dismiss(id), 6500)
    return () => {
      window.clearTimeout(timer)
    }
  }, [state.phase, state.invalidReason, state.attempts, toast, dismiss])

  // Non-destructive toast when the ticket breaches the protocol's liquidity
  // bounds — fires once per new constraint, never on every keystroke.
  useEffect(() => {
    const previous = lastAmountErrorRef.current
    lastAmountErrorRef.current = state.amountError
    if (!state.amountError || state.amountError === previous) return
    const { id } = toast({
      title: "Notional outside liquidity bounds",
      description: state.amountError,
    })
    const timer = window.setTimeout(() => dismiss(id), 6500)
    return () => {
      window.clearTimeout(timer)
    }
  }, [state.amountError, toast, dismiss])

  const nodeAStatus: NodeStatus = state.tradeAId ? "complete" : "active"
  const nodeBStatus: NodeStatus =
    state.phase === "INVALID_PAIR"
      ? "error"
      : state.phase === "TRADE_B_SELECTED"
        ? "validating"
        : state.phase === "IDLE"
          ? "idle"
          : state.phase === "TRADE_A_SELECTED"
            ? "active"
            : "complete"
  const nodeCStatus: NodeStatus =
    state.phase === "SUBMITTED" ? "complete" : state.phase === "PARLEY_READY" ? "active" : "idle"

  const parley = tradeA && leg && state.phase === "PARLEY_READY" ? computeParlay(tradeA, leg) : null
  const ticketBasis = orderData.summary?.basis === "ticket" ? orderData.summary : null

  return (
    <div className="rounded-tremor-default border border-stroke-default bg-surface-secondary/40 p-4 sm:p-6">
      <ol className="grid list-none gap-4 p-0 lg:grid-cols-[1fr_1.5rem_1fr_1.5rem_1fr] lg:items-stretch lg:gap-0">
        <FlowNode step="01" title="Primary trade" status={nodeAStatus}>
          <p className="mb-4 text-sm text-content-secondary">
            Pick the primary leg. The margin engine unlocks compatible pairs for it.
          </p>
          <TradeSelect
            tradeAId={state.tradeAId}
            onSelect={(id, label) => handleNodeSelect("tradeA", { id, label })}
          />
          {tradeA && (
            <p className="mt-4 font-mono text-[11px] text-content-tertiary">
              venue {tradeA.venue} · max notional ${(tradeA.maxNotionalUsd / 1_000_000).toFixed(1)}M
              · {RISK_LABELS[tradeA.risk]} risk
            </p>
          )}
        </FlowNode>

        <FlowEdge active={Boolean(state.tradeAId)} />

        <FlowNode step="02" title="Second leg" status={nodeBStatus}>
          <p className="mb-4 text-sm text-content-secondary">
            {tradeA
              ? "Instruments below are pre-filtered for a valid parametric parley."
              : "Unlocks after the primary trade is selected."}
          </p>
          <RadioGroup
            ariaLabel="Second leg selection"
            ariaInvalid={state.phase === "INVALID_PAIR"}
            value={state.legId ?? null}
            onValueChange={(value) => {
              const match = legs.find((legOption) => legOption.id === value)
              if (match) handleNodeSelect("legB", { id: match.id, label: match.label })
            }}
            className="grid gap-2"
          >
            {legs.length > 0 ? (
              legs.map((legOption) => (
                <LegRadio
                  key={legOption.id}
                  leg={legOption}
                  name={tradeA?.label ?? "—"}
                  disabled={!tradeA}
                />
              ))
            ) : (
              <p
                aria-live="polite"
                className="rounded-tremor-default border border-dashed border-stroke-default p-4 text-sm text-content-tertiary"
              >
                Awaiting primary trade…
              </p>
            )}
          </RadioGroup>
          {state.phase === "INVALID_PAIR" && state.invalidReason && (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-content-error">
              {state.invalidReason}
            </p>
          )}
        </FlowNode>

        <FlowEdge active={state.phase === "PARLEY_READY" || state.phase === "SUBMITTED"} />

        <FlowNode step="03" title="Parley summary" status={nodeCStatus}>
          <SummaryPanel
            phase={state.phase}
            ticket={state.ticket}
            legs={parley?.legs ?? ""}
            correlation={leg?.correlation ?? 0}
            combinedApr={parley?.combinedApr ?? 0}
            notionalUsd={ticketBasis?.notionalUsd ?? null}
            utilizationPct={ticketBasis?.utilizationPct ?? null}
            onRoute={submit}
          />
          {state.phase === "SUBMITTED" && (
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-raise px-4 font-mono text-sm text-content-secondary transition-colors hover:border-stroke-accent-secondary hover:text-content-default"
            >
              Build another parley ↺
            </button>
          )}
        </FlowNode>
      </ol>

      {/* Amount → dependent second leg → payoff projection, one synchronized surface. */}
      <OrderConfigPanel
        tradeA={tradeA}
        leg={leg}
        orderData={orderData}
        amountRaw={state.amountRaw}
        amountError={state.amountError}
        reducedMotion={reducedMotion}
        onAmountChange={handleAmountChange}
      />

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}
