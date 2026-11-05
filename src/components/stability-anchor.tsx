import { Card, ProgressBar, Tracker } from "@/components/charts"
import { usePersona } from "@/components/persona-context"
import { Tooltip } from "@/components/ui/tooltip"
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
                <Tooltip
                  hint={stat.definition}
                  ariaLabel={`What does ${stat.term} mean?`}
                  popupClass="max-w-72"
                />
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
              className="mt-4 [&>div:nth-child(2)>div]:!bg-content-accent"
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
