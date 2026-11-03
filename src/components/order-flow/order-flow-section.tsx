"use client"

import dynamic from "next/dynamic"
import { useInView } from "@/lib/hooks"

/**
 * Skeleton reserves the builder's full height up-front — the lazy mount
 * below never causes layout shift (CLS ≈ 0 for this section).
 */
function OrderFlowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[720px] rounded-tremor-default border border-dashed border-stroke-dim bg-surface-inset/40 p-6"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((col) => (
          <div
            key={col}
            className="min-h-72 rounded-tremor-default border border-stroke-dim bg-surface-base p-5"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-surface-raised" />
            <div className="mt-6 h-3 w-full animate-pulse rounded bg-surface-raised" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-surface-raised" />
            <div className="mt-2 h-11 w-full animate-pulse rounded bg-surface-raised" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center font-mono text-xs text-content-faint">
        Loading parametric order engine…
      </p>
    </div>
  )
}

// Mirrors a Suspense-lazy boundary: the ~heavy builder (Tremor + Base-UI
// tree) is code-split and only hydrated once the section is in view.
const OrderFlowBuilder = dynamic(() => import("./order-flow").then((mod) => mod.OrderFlowBuilder), {
  ssr: false,
  loading: () => <OrderFlowSkeleton />,
})

export function OrderFlowSection() {
  const { ref, inView } = useInView<HTMLDivElement>("240px")

  return (
    <section id="build" aria-labelledby="build-title" className="border-b border-stroke-dim">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="font-mono text-xs tracking-[0.25em] text-brand-green">
          PARAMETRIC ORDER FLOW
        </p>
        <h2
          id="build-title"
          className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight text-content-primary sm:text-4xl"
        >
          Compose a parley the way the margin engine sees it.
        </h2>
        <p className="mt-4 max-w-2xl text-content-secondary">
          Three nodes, one state machine: pick a primary trade, add a compatible second leg, and the
          engine computes combined carry, leg correlation and margin bounds before you confirm.
          Keyboard-first — every node is a standard ARIA pattern.
        </p>

        <div ref={ref} className="mt-10">
          {inView ? <OrderFlowBuilder /> : <OrderFlowSkeleton />}
        </div>

        <p className="mt-4 font-mono text-[11px] text-content-faint">
          Simulated environment · figures illustrative · no orders are routed to production vaults
        </p>
      </div>
    </section>
  )
}
