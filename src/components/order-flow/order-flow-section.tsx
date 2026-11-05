import { lazy, Suspense } from "preact/compat"
import { useInView } from "@/lib/hooks"
import { ORDER_FLOW_SUMMARY } from "@/lib/site-content"

/**
 * Skeleton reserves the builder's full height up-front — the lazy mount
 * below never causes layout shift (CLS ≈ 0 for this section).
 */
function OrderFlowSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="min-h-[720px] rounded-tremor-default border border-dashed border-stroke-default bg-surface-secondary/40 p-6"
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((col) => (
          <div
            key={col}
            className="min-h-72 rounded-tremor-default border border-stroke-default bg-surface-raise p-5"
          >
            <div className="h-3 w-24 animate-pulse rounded bg-surface-hover" />
            <div className="mt-6 h-3 w-full animate-pulse rounded bg-surface-hover" />
            <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-surface-hover" />
            <div className="mt-2 h-11 w-full animate-pulse rounded bg-surface-hover" />
          </div>
        ))}
      </div>
      <p className="mt-6 text-center font-mono text-xs text-content-tertiary">
        Loading parametric order engine…
      </p>
    </div>
  )
}

// Mirrors a Suspense boundary: the heavy builder is code-split and only
// mounted once the section is in view (client-side only — no hydration).
const OrderFlowBuilder = lazy(async () => {
  const mod = await import("./order-flow")
  return { default: mod.OrderFlowBuilder }
})

export function OrderFlowSection() {
  const { ref, inView } = useInView<HTMLDivElement>("240px")

  return (
    <section id="build" aria-labelledby="build-title" className="border-b border-stroke-default">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-mono-xs text-content-accent">{ORDER_FLOW_SUMMARY.eyebrow}</p>
        <h2
          id="build-title"
          className="mt-3 max-w-3xl text-3xl font-medium tracking-tight text-content-raise sm:text-4xl"
        >
          {ORDER_FLOW_SUMMARY.title}
        </h2>
        <p className="mt-4 max-w-2xl text-content-secondary">{ORDER_FLOW_SUMMARY.lede}</p>

        <div ref={ref} className="mt-10">
          {inView ? (
            <Suspense fallback={<OrderFlowSkeleton />}>
              <OrderFlowBuilder />
            </Suspense>
          ) : (
            <OrderFlowSkeleton />
          )}
        </div>

        <p className="mt-4 font-mono text-[11px] text-content-tertiary">
          Simulated environment · figures illustrative · no orders are routed to production vaults
        </p>
      </div>
    </section>
  )
}
