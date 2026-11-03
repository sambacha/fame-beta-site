import type { ReactNode } from "react"

/** Hairline panel wrapping a chart: Oxide title conventions + figure/figcaption a11y. */
export function ChartCard({
  title,
  description,
  footnote,
  children,
}: {
  title: string
  description?: string
  footnote: string
  children: ReactNode
}) {
  return (
    <figure className="rounded-tremor-default border border-stroke-default bg-surface-raise p-5 shadow-border-small">
      <figcaption>
        <p className="text-sm font-medium text-content-default">{title}</p>
        {description && (
          <p className="mt-1 text-xs leading-relaxed text-content-tertiary">{description}</p>
        )}
      </figcaption>
      <div className="mt-4">{children}</div>
      <p className="mt-3 font-mono text-[11px] leading-relaxed text-content-tertiary">{footnote}</p>
    </figure>
  )
}
