import type { ComponentChild, ComponentChildren } from "preact"
import { Component } from "preact"

type SectionBoundaryProps = {
  sectionName: string
  children: ComponentChildren
}

type SectionBoundaryState = {
  hasError: boolean
  retries: number
}

/**
 * Per-section error boundary with retry.
 * A crash in one landing-page block (blotter, order flow, form…) degrades to
 * a local fallback instead of taking down the whole page; "Retry" remounts
 * the subtree via a key bump, resetting the failed component tree.
 */
export class SectionBoundary extends Component<SectionBoundaryProps, SectionBoundaryState> {
  state: SectionBoundaryState = { hasError: false, retries: 0 }

  static getDerivedStateFromError(): Partial<SectionBoundaryState> {
    return { hasError: true }
  }

  componentDidCatch(error: unknown): void {
    console.error(`[FAME] Section "${this.props.sectionName}" crashed:`, error)
  }

  handleRetry = (): void => {
    this.setState((prev) => ({ hasError: false, retries: prev.retries + 1 }))
  }

  render(): ComponentChild {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="mx-auto w-full max-w-3xl rounded-md border border-stroke-default bg-surface-raise p-8 text-center"
        >
          <p className="text-mono-xs text-content-notice">
            MODULE DEGRADED — {this.props.sectionName.toUpperCase()}
          </p>
          <p className="mt-3 text-content-secondary">
            This section failed to render and was isolated. The rest of the page is unaffected.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-tremor-default border border-stroke-accent-tertiary bg-surface-accent px-5 font-mono text-sm text-content-accent transition-colors hover:bg-surface-accent-hover"
          >
            ⟳ Retry section
          </button>
          <p className="mt-3 font-mono text-[11px] text-content-tertiary">
            attempt {this.state.retries + 1} · error boundary v2
          </p>
        </div>
      )
    }

    return (
      <div key={this.state.retries} data-boundary={this.props.sectionName}>
        {this.props.children}
      </div>
    )
  }
}
