"use client"

import { Dialog } from "@base-ui-components/react/dialog"
import { Radio } from "@base-ui-components/react/radio"
import { RadioGroup } from "@base-ui-components/react/radio-group"
import { Select } from "@base-ui-components/react/select"
import { Metric } from "@tremor/react"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  computeParlay,
  findTrade,
  type LegOption,
  SECOND_LEGS,
  TRADE_A_OPTIONS,
} from "@/lib/order-data"
import { type OrderState, useOrderBuilder } from "./use-order-builder"

const RISK_LABELS = { conservative: "LOW", balanced: "MED", aggressive: "HIGH" } as const

type NodeStatus = "idle" | "active" | "validating" | "complete" | "error"

const NODE_STYLES: Record<NodeStatus, string> = {
  idle: "border-stroke-dim opacity-70",
  active: "border-brand-green/50 shadow-[0_0_24px_oklch(0.8_0.15_162/0.08)]",
  validating: "border-brand-amber/60",
  complete: "border-brand-green/60",
  error: "border-brand-coral/70",
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
  children: React.ReactNode
}) {
  return (
    <li
      data-status={status}
      className={`flex h-full flex-col rounded-tremor-default border bg-surface-base p-5 transition-colors ${NODE_STYLES[status]}`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] uppercase tracking-widest text-content-faint">
          {step} · {title}
        </p>
        <p
          className={`font-mono text-[10px] tracking-widest ${
            status === "error"
              ? "text-brand-coral"
              : status === "validating"
                ? "text-brand-amber"
                : status === "complete"
                  ? "text-brand-green"
                  : "text-content-faint"
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

/** Node A — Base-UI Select over the primary trade. Memoised item renderer. */
const TradeSelect = memo(function TradeSelect({
  tradeAId,
  onSelect,
}: {
  tradeAId: string | null
  onSelect: (id: string, label: string) => void
}) {
  const items = useMemo(
    () => TRADE_A_OPTIONS.map((trade) => ({ value: trade.id, label: trade.label, trade })),
    [],
  )
  const selected = findTrade(tradeAId)

  return (
    <Select.Root
      items={items}
      value={tradeAId}
      onValueChange={(value) => {
        if (typeof value === "string") {
          const match = TRADE_A_OPTIONS.find((trade) => trade.id === value)
          if (match) onSelect(match.id, match.label)
        }
      }}
    >
      <Select.Trigger
        aria-label="Primary trade — leg one"
        className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-tremor-default border border-stroke-strong bg-surface-inset px-4 py-2.5 text-left transition-colors data-[popup-open]:border-brand-green"
      >
        <Select.Value>
          <span className="block truncate">
            {selected ? (
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-sm font-medium text-content-primary">{selected.label}</span>
                <span className="font-mono text-xs text-brand-green">{selected.apr}% APR</span>
              </span>
            ) : (
              <span className="text-sm text-content-secondary">Select primary trade…</span>
            )}
          </span>
        </Select.Value>
        <Select.Icon className="text-content-faint">
          <span aria-hidden="true">▾</span>
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={6} className="z-60 outline-none">
          <Select.Popup className="scroll-area max-h-96 min-w-80 overflow-y-auto rounded-tremor-default border border-stroke-dim bg-surface-raised p-1 shadow-tremor-dropdown">
            {TRADE_A_OPTIONS.map((trade) => (
              <Select.Item
                key={trade.id}
                value={trade.id}
                className="grid cursor-pointer grid-cols-[1fr_auto] items-center gap-3 rounded-sm px-3 py-2.5 text-left outline-none data-[highlighted]:bg-brand-green/10"
              >
                <Select.ItemText>
                  <span className="block">
                    <span className="block text-sm font-medium text-content-primary">
                      {trade.label}
                    </span>
                    <span className="block font-mono text-[11px] text-content-faint">
                      {trade.strategy} · {RISK_LABELS[trade.risk]} risk
                    </span>
                  </span>
                </Select.ItemText>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-xs text-brand-green">{trade.apr}%</span>
                  <Select.ItemIndicator className="text-brand-green">
                    <span aria-hidden="true">✓</span>
                  </Select.ItemIndicator>
                </span>
              </Select.Item>
            ))}
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  )
})

/** Node B — Base-UI RadioGroup over compatible second legs. */
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
    <Radio.Root
      value={leg.id}
      disabled={disabled}
      className="grid min-h-11 cursor-pointer grid-cols-[auto_1fr_auto] items-center gap-3 rounded-tremor-default border border-stroke-dim bg-surface-inset p-3 text-left transition-colors hover:border-stroke-strong data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40 data-[checked]:border-brand-green/70 data-[checked]:bg-brand-green/[0.06]"
    >
      <Radio.Indicator
        className="flex h-4 w-4 items-center justify-center rounded-full border border-stroke-strong data-[checked]:border-brand-green"
        render={(props, state) => (
          <span {...props}>
            {state.checked ? <span className="block h-2 w-2 rounded-full bg-brand-green" /> : null}
          </span>
        )}
      />
      <span>
        <span className="block text-sm font-medium text-content-primary">{leg.label}</span>
        <span className="block font-mono text-[11px] text-content-faint">
          pairs with {name} · margin engine pre-cleared
        </span>
      </span>
      <span className="text-right font-mono text-xs">
        <span className="block text-brand-green">{leg.apr}%</span>
        <span className="block text-content-faint">ρ {leg.correlation.toFixed(2)}</span>
      </span>
    </Radio.Root>
  )
})

/** Node C — parametric summary + confirm dialog. */
const SummaryPanel = memo(function SummaryPanel({
  phase,
  ticket,
  legs,
  correlation,
  combinedApr,
  onRoute,
}: {
  phase: OrderState["phase"]
  ticket: string | null
  legs: string
  correlation: number
  combinedApr: number
  onRoute: () => void
}) {
  const [dialogOpen, setDialogOpen] = useState(false)

  if (phase === "SUBMITTED") {
    return (
      <div className="flex flex-1 flex-col items-start justify-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-brand-green">
          Order routed
        </p>
        <p className="mt-2 font-mono text-2xl font-semibold text-content-primary">{ticket}</p>
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
        <p className="text-sm text-content-faint">
          Complete legs one and two to compute the parametric summary — correlation, combined carry
          and margin bounds.
        </p>
        <div aria-hidden="true" className="mt-4 space-y-2">
          <div className="h-3 w-3/4 rounded bg-surface-raised" />
          <div className="h-3 w-1/2 rounded bg-surface-raised" />
          <div className="h-3 w-2/3 rounded bg-surface-raised" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <p className="font-mono text-xs text-content-secondary">{legs}</p>
      <div className="mt-3 flex items-end gap-3">
        <Metric className="!text-brand-green">{combinedApr.toFixed(1)}%</Metric>
        <span className="pb-1.5 font-mono text-[11px] text-content-faint">
          combined APR · +0.8% parley kicker
        </span>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 font-mono text-xs">
        <div className="flex justify-between gap-2 border-b border-stroke-dim/60 pb-1">
          <dt className="text-content-faint">ρ legs</dt>
          <dd className="text-content-secondary">{correlation.toFixed(2)}</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-dim/60 pb-1">
          <dt className="text-content-faint">Vault fee</dt>
          <dd className="text-content-secondary">15 bps</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-dim/60 pb-1">
          <dt className="text-content-faint">Settlement</dt>
          <dd className="text-content-secondary">Hourly</dd>
        </div>
        <div className="flex justify-between gap-2 border-b border-stroke-dim/60 pb-1">
          <dt className="text-content-faint">Margin</dt>
          <dd className="text-content-secondary">Pre-cleared</dd>
        </div>
      </dl>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Trigger
          data-pulse={phase === "PARLEY_READY"}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-tremor-default bg-brand-green px-5 text-sm font-semibold text-surface-inset transition-colors hover:bg-brand-green-emphasis"
        >
          Confirm parametric order
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/70" />
          <Dialog.Popup className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-tremor-default border border-stroke-dim bg-surface-base p-6 shadow-tremor-dropdown">
            <Dialog.Title className="text-lg font-semibold text-content-primary">
              Route parametric order
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-content-secondary">
              {legs} · {combinedApr.toFixed(1)}% combined APR · ρ {correlation.toFixed(2)}. The
              margin engine will pre-clear both legs before the next slot.
            </Dialog.Description>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Dialog.Close className="inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-strong px-4 text-sm text-content-secondary transition-colors hover:text-content-primary">
                Back
              </Dialog.Close>
              <button
                type="button"
                onClick={() => {
                  onRoute()
                  setDialogOpen(false)
                }}
                className="inline-flex min-h-11 items-center rounded-tremor-default bg-brand-green px-5 text-sm font-semibold text-surface-inset transition-colors hover:bg-brand-green-emphasis"
              >
                Route order
              </button>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
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
  const { state, tradeA, leg, announcement, selectTradeA, selectLegB, submit, reset } =
    useOrderBuilder()
  const { toast, dismiss } = useToast()
  const lastAttemptRef = useRef(0)

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

  return (
    <div className="rounded-tremor-default border border-stroke-dim bg-surface-inset/40 p-4 sm:p-6">
      <ol className="grid list-none gap-4 p-0 lg:grid-cols-[1fr_1.5rem_1fr_1.5rem_1fr] lg:items-stretch lg:gap-0">
        <FlowNode step="01" title="Primary trade" status={nodeAStatus}>
          <p className="mb-4 text-sm text-content-secondary">
            Pick the primary leg. The margin engine unlocks compatible pairs for it.
          </p>
          <TradeSelect tradeAId={state.tradeAId} onSelect={selectTradeA} />
          {tradeA && (
            <p className="mt-4 font-mono text-[11px] text-content-faint">
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
            aria-label="Second leg selection"
            aria-invalid={state.phase === "INVALID_PAIR" ? "true" : undefined}
            value={state.legId ?? null}
            onValueChange={(value) => {
              if (typeof value === "string") {
                const match = legs.find((legOption) => legOption.id === value)
                if (match) selectLegB(match.id, match.label)
              }
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
                className="rounded-tremor-default border border-dashed border-stroke-dim p-4 text-sm text-content-faint"
              >
                Awaiting primary trade…
              </p>
            )}
          </RadioGroup>
          {state.phase === "INVALID_PAIR" && state.invalidReason && (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-brand-coral">
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
            onRoute={submit}
          />
          {state.phase === "SUBMITTED" && (
            <button
              type="button"
              onClick={reset}
              className="mt-5 inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-strong px-4 font-mono text-sm text-content-secondary transition-colors hover:border-brand-green hover:text-brand-green"
            >
              Build another parley ↺
            </button>
          )}
        </FlowNode>
      </ol>

      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}
