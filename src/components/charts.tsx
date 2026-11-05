import type { ComponentChild, ComponentChildren, JSX } from "preact"
import { useEffect, useRef, useState } from "preact/compat"

/**
 * Pure-Preact SVG chart suite — the replacement for @tremor/react (which
 * wrapped recharts + headlessui). Series colors resolve through the palette
 * alias layer in src/index.css (emerald/teal/rose/… → Oxide OKLCH steps),
 * so every chart stays strictly on the design system. Flat fills only: the
 * design system bans gradients.
 */

export type ChartDatum = Record<string, string | number>

const SERIES_STROKE: Record<string, string> = {
  emerald: "stroke-emerald-500",
  rose: "stroke-rose-500",
  amber: "stroke-amber-500",
  sky: "stroke-sky-500",
  teal: "stroke-teal-500",
  gray: "stroke-gray-500",
}
const SERIES_FILL: Record<string, string> = {
  emerald: "fill-emerald-500",
  rose: "fill-rose-500",
  amber: "fill-amber-500",
  sky: "fill-sky-500",
  teal: "fill-teal-500",
  gray: "fill-gray-500",
}

const strokeClass = (color: string) => SERIES_STROKE[color] ?? SERIES_STROKE.gray
const fillClass = (color: string) => SERIES_FILL[color] ?? SERIES_FILL.gray

/** Observe an element's content width — crisp SVG text without viewBox distortion. */
function useWidth<T extends HTMLElement>(): { ref: preact.Ref<T>; width: number } {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) setWidth(entry.contentRect.width)
    })
    observer.observe(node)
    setWidth(node.clientWidth)
    return () => {
      observer.disconnect()
    }
  }, [])
  return { ref, width }
}

/** Catmull-Rom → cubic Bézier smoothing (tremor's curveType="natural"). */
function smoothPath(points: [number, number][]): string {
  if (points.length < 2) return points.length === 1 ? `M${points[0][0]},${points[0][1]}` : ""
  let path = `M${points[0][0]},${points[0][1]}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    path += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`
  }
  return path
}

function linearPath(points: [number, number][]): string {
  return points
    .map(
      (point, index) => `${index === 0 ? "M" : "L"}${point[0].toFixed(2)},${point[1].toFixed(2)}`,
    )
    .join(" ")
}

/** Nice round tick values covering [min, max]. */
function niceTicks(min: number, max: number, count = 4): number[] {
  if (min === max) return [min]
  const span = max - min
  const step = 10 ** Math.floor(Math.log10(span / count))
  const error = span / count / step
  const factor = error >= 7.5 ? 10 : error >= 3.5 ? 5 : error >= 1.5 ? 2 : 1
  const niceStep = step * factor
  const floor = Math.floor(min / niceStep) * niceStep
  const ticks: number[] = []
  for (let tick = floor; tick <= max + niceStep * 0.5; tick += niceStep) {
    ticks.push(Number(tick.toFixed(10)))
  }
  return ticks
}

const fmtTick = (value: number): string =>
  Math.abs(value) >= 1000 ? value.toLocaleString("en-US") : String(Number(value.toFixed(2)))

type AxisChartProps = {
  data: ChartDatum[]
  index: string
  categories: readonly string[]
  colors: readonly string[]
  valueFormatter?: (value: number) => string
  className?: string
  showLegend?: boolean
  startEndOnly?: boolean
  autoMinValue?: boolean
  curveType?: "linear" | "natural"
  yAxisWidth?: number
  /** Replaces the built-in tooltip body for the hovered index. */
  renderTooltip?: (args: { point: ChartDatum; label: string }) => ComponentChild
  showAnimation?: boolean
}

type HoverState = { index: number; x: number } | null

/**
 * Shared cartesian frame: measured width, y-ticks, gridlines, x labels,
 * hover crosshair + tooltip. `renderSeries` paints per-category geometry.
 */
function AxisChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = fmtTick,
  className = "",
  showLegend = false,
  startEndOnly = false,
  autoMinValue = false,
  curveType = "linear",
  yAxisWidth = 48,
  renderTooltip,
  showAnimation = false,
  kind,
}: AxisChartProps & { kind: "area" | "line" }) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<HoverState>(null)
  const height = 224
  const margin = { top: 12, right: 12, bottom: 24, left: 8 }
  const innerWidth = Math.max(0, width - yAxisWidth - margin.left - margin.right)
  const innerHeight = height - margin.top - margin.bottom

  const values = data.flatMap((point) => categories.map((category) => Number(point[category] ?? 0)))
  const rawMin = values.length > 0 ? Math.min(...values) : 0
  const rawMax = values.length > 0 ? Math.max(...values) : 1
  const ticks = niceTicks(autoMinValue ? rawMin : 0, rawMax)
  const yMin = ticks[0]
  const yMax = ticks[ticks.length - 1]
  const yScale = (value: number) =>
    margin.top + innerHeight - ((value - yMin) / (yMax - yMin || 1)) * innerHeight
  const xScale = (i: number) =>
    margin.left +
    yAxisWidth +
    (data.length <= 1 ? innerWidth / 2 : (i / (data.length - 1)) * innerWidth)

  const xLabelIndexes = startEndOnly
    ? data.length > 1
      ? [0, data.length - 1]
      : [0]
    : data
        .map((_, i) => i)
        .filter((i) => i % Math.ceil(data.length / 6) === 0 || i === data.length - 1)

  const onMove = (event: JSX.TargetedMouseEvent<SVGSVGElement>) => {
    if (data.length === 0) return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - bounds.left
    const ratio = (x - margin.left - yAxisWidth) / (innerWidth || 1)
    const index_ = Math.min(data.length - 1, Math.max(0, Math.round(ratio * (data.length - 1))))
    setHover({ index: index_, x: xScale(index_) })
  }

  const hoverPoint = hover ? data[hover.index] : null

  return (
    <div className={`relative ${className}`} ref={ref}>
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-hidden="true"
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={margin.left + yAxisWidth}
                x2={margin.left + yAxisWidth + innerWidth}
                y1={yScale(tick)}
                y2={yScale(tick)}
                class="stroke-stroke-secondary/60"
                stroke-width="1"
              />
              <text
                x={margin.left + yAxisWidth - 8}
                y={yScale(tick) + 3}
                text-anchor="end"
                class="fill-content-tertiary font-mono text-[10px] tabular-nums"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          ))}

          {kind === "area" &&
            categories.map((category, categoryIndex) => {
              const points = data.map(
                (point, i) => [xScale(i), yScale(Number(point[category] ?? 0))] as [number, number],
              )
              const line = curveType === "natural" ? smoothPath(points) : linearPath(points)
              const area = `${line} L${xScale(data.length - 1).toFixed(2)},${(margin.top + innerHeight).toFixed(2)} L${xScale(0).toFixed(2)},${(margin.top + innerHeight).toFixed(2)} Z`
              return (
                <g key={category}>
                  <path d={area} class={`${fillClass(colors[categoryIndex])} opacity-15`} />
                  <path
                    d={line}
                    fill="none"
                    class={strokeClass(colors[categoryIndex])}
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </g>
              )
            })}

          {kind === "line" &&
            categories.map((category, categoryIndex) => {
              const points = data.map(
                (point, i) => [xScale(i), yScale(Number(point[category] ?? 0))] as [number, number],
              )
              const line = curveType === "natural" ? smoothPath(points) : linearPath(points)
              return (
                <path
                  key={category}
                  d={line}
                  fill="none"
                  class={strokeClass(colors[categoryIndex])}
                  stroke-width="2"
                  stroke-linecap="round"
                />
              )
            })}

          {hover && hoverPoint && (
            <line
              x1={hover.x}
              x2={hover.x}
              y1={margin.top}
              y2={margin.top + innerHeight}
              class="stroke-content-quaternary"
              stroke-width="1"
              stroke-dasharray="3 3"
            />
          )}

          {xLabelIndexes.map((i) => (
            <text
              key={`${String(data[i]?.[index])}-${i}`}
              x={xScale(i)}
              y={height - 6}
              text-anchor={startEndOnly ? (i === 0 ? "start" : "end") : "middle"}
              class="fill-content-tertiary font-mono text-[10px]"
            >
              {String(data[i]?.[index] ?? "")}
            </text>
          ))}
        </svg>
      )}

      {hover && hoverPoint && renderTooltip && (
        <div
          class="pointer-events-none absolute top-2 z-10 min-w-36"
          style={{
            left: `${Math.min(Math.max(hover.x - 72, 0), Math.max(0, width - 160))}px`,
          }}
        >
          {renderTooltip({ point: hoverPoint, label: String(hoverPoint[index]) })}
        </div>
      )}

      {showLegend && (
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {categories.map((category, i) => (
            <li
              key={category}
              class="flex items-center gap-1.5 font-mono text-[11px] text-content-secondary"
            >
              <span class={`h-2 w-2 rounded-full ${fillClass(colors[i])}`} aria-hidden="true" />
              {category}
            </li>
          ))}
        </ul>
      )}
      {showAnimation ? null : null}
    </div>
  )
}

export function AreaChart(props: AxisChartProps) {
  return <AxisChart {...props} kind="area" />
}

export function LineChart(props: AxisChartProps) {
  return <AxisChart {...props} kind="line" />
}

export function BarChart({
  data,
  index,
  categories,
  colors,
  valueFormatter = fmtTick,
  className = "",
  showLegend = false,
  yAxisWidth = 48,
}: Omit<
  AxisChartProps,
  "curveType" | "startEndOnly" | "autoMinValue" | "renderTooltip" | "showAnimation"
>) {
  const { ref, width } = useWidth<HTMLDivElement>()
  const height = 224
  const margin = { top: 12, right: 12, bottom: 24, left: 8 }
  const innerWidth = Math.max(0, width - yAxisWidth - margin.left - margin.right)
  const innerHeight = height - margin.top - margin.bottom

  const values = data.flatMap((point) => categories.map((category) => Number(point[category] ?? 0)))
  const ticks = niceTicks(0, values.length > 0 ? Math.max(...values) : 1)
  const yMax = ticks[ticks.length - 1]
  const yScale = (value: number) => margin.top + innerHeight - (value / (yMax || 1)) * innerHeight

  const groupWidth = innerWidth / Math.max(1, data.length)
  const barWidth = Math.min(28, (groupWidth * 0.7) / Math.max(1, categories.length))

  return (
    <div className={`relative ${className}`} ref={ref}>
      {width > 0 && (
        <svg width={width} height={height} role="img" aria-hidden="true">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={margin.left + yAxisWidth}
                x2={margin.left + yAxisWidth + innerWidth}
                y1={yScale(tick)}
                y2={yScale(tick)}
                class="stroke-stroke-secondary/60"
                stroke-width="1"
              />
              <text
                x={margin.left + yAxisWidth - 8}
                y={yScale(tick) + 3}
                text-anchor="end"
                class="fill-content-tertiary font-mono text-[10px] tabular-nums"
              >
                {valueFormatter(tick)}
              </text>
            </g>
          ))}
          {data.map((point, i) =>
            categories.map((category, categoryIndex) => {
              const value = Number(point[category] ?? 0)
              const barHeight = Math.max(0, margin.top + innerHeight - yScale(value))
              const groupStart = margin.left + yAxisWidth + i * groupWidth
              const offset = (categoryIndex - (categories.length - 1) / 2) * (barWidth + 4)
              return (
                <rect
                  key={`${category}-${String(point[index])}`}
                  x={groupStart + groupWidth / 2 + offset - barWidth / 2}
                  y={yScale(value)}
                  width={barWidth}
                  height={barHeight}
                  rx="2"
                  class={fillClass(colors[categoryIndex])}
                />
              )
            }),
          )}
          {data.map((point, i) => (
            <text
              key={String(point[index])}
              x={margin.left + yAxisWidth + i * groupWidth + groupWidth / 2}
              y={height - 6}
              text-anchor="middle"
              class="fill-content-tertiary font-mono text-[10px]"
            >
              {String(point[index])}
            </text>
          ))}
        </svg>
      )}
      {showLegend && (
        <ul class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {categories.map((category, i) => (
            <li
              key={category}
              class="flex items-center gap-1.5 font-mono text-[11px] text-content-secondary"
            >
              <span class={`h-2 w-2 rounded-full ${fillClass(colors[i])}`} aria-hidden="true" />
              {category}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/** Axis-less sparkline (blotter trend column). */
export function SparkAreaChart({
  data,
  index,
  categories,
  colors,
  className = "h-8 w-24",
}: {
  data: ChartDatum[]
  index: string
  categories: readonly string[]
  colors: readonly string[]
  className?: string
}) {
  const category = categories[0]
  const values = data.map((point) => Number(point[category] ?? 0))
  const min = Math.min(...values)
  const max = Math.max(...values)
  const width = 96
  const height = 32
  const points = values.map(
    (value, i) =>
      [
        (i / Math.max(1, values.length - 1)) * width,
        height - 2 - ((value - min) / (max - min || 1)) * (height - 4),
      ] as [number, number],
  )
  const line = smoothPath(points)
  const area = `${line} L${width},${height} L0,${height} Z`
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <path d={area} class={`${fillClass(colors[0])} opacity-15`} />
      <path d={line} fill="none" class={strokeClass(colors[0])} stroke-width="1.5" />
      <title>{index}</title>
    </svg>
  )
}

/** Horizontal stacked mix bar (liquidity composition). */
export function CategoryBar({
  values,
  colors,
  className = "",
}: {
  values: number[]
  colors: string[]
  className?: string
}) {
  const total = values.reduce((sum, value) => sum + value, 0) || 1
  // Content-derived keys (color+value, disambiguated across repeats) instead
  // of array indexes: the strip is static, but this keeps reconciliation
  // correct even if the composition data is reordered or contains duplicates.
  const seen = new Map<string, number>()
  return (
    <div class={`flex h-2 w-full gap-0.5 overflow-hidden rounded-tremor-full ${className}`}>
      {values.map((value, i) => {
        const color = colors[i] ?? "gray"
        const base = `${color}-${value}`
        const occurrences = seen.get(base) ?? 0
        seen.set(base, occurrences + 1)
        return (
          <div
            key={occurrences === 0 ? base : `${base}·${occurrences + 1}`}
            class={`h-full ${fillClass(color)}`}
            style={{ width: `${(value / total) * 100}%` }}
          />
        )
      })}
    </div>
  )
}

/** Slot tracker — one colored bar per settlement slot. */
export function Tracker({
  data,
  className = "",
}: {
  data: { color: string; tooltip: string }[]
  className?: string
}) {
  return (
    <div class={`flex items-start gap-0.5 ${className}`}>
      {/* tooltip carries the slot identity (unique settlement-slot label) */}
      {data.map((slot) => (
        <div
          key={slot.tooltip}
          title={slot.tooltip}
          class={`h-8 flex-1 rounded-sm ${fillClass(slot.color)}`}
        />
      ))}
    </div>
  )
}

export function ProgressBar({
  value,
  className = "",
  color = "emerald",
}: {
  value: number
  className?: string
  color?: string
}) {
  return (
    <div
      class={className}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span class="sr-only">{value}%</span>
      <div class="h-2 w-full overflow-hidden rounded-tremor-full bg-tremor-background-subtle">
        <div
          class={`h-full rounded-tremor-full ${fillClass(color)}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

export function Metric({
  children,
  className = "",
}: {
  children: ComponentChild
  className?: string
}) {
  return <p class={`text-tremor-metric text-tremor-content-emphasis ${className}`}>{children}</p>
}

export function Card({
  children,
  className = "",
}: {
  children: ComponentChild
  className?: string
}) {
  return (
    <div
      class={`rounded-tremor-default ring-1 ring-tremor-border bg-tremor-background shadow-tremor-card ${className}`}
    >
      {children}
    </div>
  )
}

export function Badge({
  children,
  className = "",
}: {
  children: ComponentChild
  className?: string
}) {
  return (
    <span
      class={`inline-flex items-center justify-center whitespace-nowrap rounded-tremor-small px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      {children}
    </span>
  )
}

export function BadgeDelta({
  children,
  deltaType,
  className = "",
}: {
  children: ComponentChildren
  deltaType: "moderateIncrease" | "moderateDecrease"
  className?: string
}) {
  const arrow = deltaType === "moderateIncrease" ? "↑" : "↓"
  return (
    <span
      class={`inline-flex items-center justify-center gap-0.5 whitespace-nowrap rounded-tremor-small px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}
    >
      <span aria-hidden="true">{arrow}</span>
      {children}
    </span>
  )
}
