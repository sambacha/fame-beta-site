"use client"

import { Tooltip } from "@base-ui-components/react/tooltip"
import { Card, ProgressBar, Tracker } from "@tremor/react"
import { usePersona } from "@/components/persona-context"
import { buildUptimeSlots } from "@/lib/market-data"
import { INSTITUTIONAL_STATS, RETAIL_STATS, STABILITY_INTRO } from "@/lib/site-content"

const SLOTS = buildUptimeSlots(20)

/**
 * Protocol Stability anchor — the formal-verification metrics block that
 * follows the hero. Copy comes from site-content.ts (single source, mirrored
 * into the markdown sources). Hover shifts the surface, never the text color.
 */
export function StabilityAnchor() {
  const { persona } = usePersona()
  const view = persona === "institutional" ? INSTITUTIONAL_STATS : RETAIL_STATS

  return (
    <section
      id="stability"
      aria-labelledby="stability-title"
      className="border-b border-stroke-default"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-mono-xs text-content-accent">{STABILITY_INTRO.eyebrow}</p>
        <h2
          id="stability-title"
          className="mt-3 max-w-2xl text-3xl font-medium tracking-tight text-content-raise sm:text-4xl"
        >
          {persona === "institutional"
            ? STABILITY_INTRO.institutionalTitle
            : STABILITY_INTRO.retailTitle}
        </h2>
        <p className="mt-4 max-w-2xl text-content-secondary">{STABILITY_INTRO.lede}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {view.map((stat) => (
            <Card key={stat.term} className="!bg-surface-raise !p-5 !ring-stroke-default">
              <div className="flex items-start justify-between gap-2">
                <p className="text-mono-xs text-content-tertiary">{stat.term}</p>
                <Tooltip.Provider>
                  <Tooltip.Root>
                    <Tooltip.Trigger
                      aria-label={`What does ${stat.term} mean?`}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-tremor-default text-content-tertiary transition-colors hover:text-content-default"
                    >
                      <span aria-hidden="true" className="text-sm">
                        ⓘ
                      </span>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Positioner sideOffset={8} className="z-60">
                        <Tooltip.Popup className="max-w-72 rounded-tremor-default border border-stroke-default bg-surface-raise p-3 text-xs leading-relaxed text-content-secondary shadow-menu">
                          {stat.definition}
                        </Tooltip.Popup>
                      </Tooltip.Positioner>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
              <p className="mt-3 font-mono text-4xl font-medium tracking-tight text-content-accent tabular-nums">
                {stat.value}
              </p>
              <p className="mt-2 text-sm text-content-secondary">{stat.detail}</p>
            </Card>
          ))}
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <Card className="!bg-surface-raise !p-5 !ring-stroke-default lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-content-default">
                {STABILITY_INTRO.ratioCard.title}
              </p>
              <p className="font-mono text-xs text-content-tertiary">
                {STABILITY_INTRO.ratioCard.meta}
              </p>
            </div>
            <ProgressBar
              value={STABILITY_INTRO.ratioCard.progressValue}
              color="emerald"
              className="mt-4 [&>_div:nth-child(2)_div]:!bg-content-accent"
              showAnimation={false}
            />
            <p className="mt-3 font-mono text-xs text-content-secondary">
              {STABILITY_INTRO.ratioCard.footnote}
            </p>
          </Card>
          <Card className="!bg-surface-raise !p-5 !ring-stroke-default">
            <p className="text-sm font-medium text-content-default">
              {STABILITY_INTRO.trackerCard.title}
            </p>
            <Tracker data={SLOTS} className="mt-4" />
            <p className="mt-3 font-mono text-xs text-content-secondary">
              {STABILITY_INTRO.trackerCard.footnote}
            </p>
          </Card>
        </div>
      </div>
    </section>
  )
}
