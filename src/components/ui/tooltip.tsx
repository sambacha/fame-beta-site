import { useEffect, useRef, useState } from "preact/compat"
import { createPortal } from "preact/compat"
import type { ComponentChild } from "preact"

/**
 * Hover/focus tooltip — the pure-Preact replacement for Base-UI Tooltip.
 * The popup is portalled and positioned with fixed coordinates taken from
 * the trigger rect (never clipped by ancestor overflow), flips below when
 * there is no room above, and announces itself via aria-describedby.
 * Touch gets the same popup on first tap; a second tap (or scrolling)
 * dismisses it.
 */

type TooltipProps = {
  /** Popup text. */
  hint: string
  /** Accessible name of the trigger button. */
  ariaLabel: string
  /** Extra classes for the popup box (max-width etc.). */
  popupClass?: string
  children?: ComponentChild
}

export function Tooltip({ hint, ariaLabel, popupClass = "max-w-64", children }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, placement: "top" as "top" | "bottom" })
  const triggerRef = useRef<HTMLButtonElement>(null)

  const place = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const below = rect.bottom > window.innerHeight - 220
    setPosition({
      top: below ? rect.bottom + 8 : Math.max(8, rect.top - 8),
      left: Math.min(Math.max(8, rect.left + rect.width / 2 - 130), window.innerWidth - 268),
      placement: below ? "bottom" : "top",
    })
  }

  useEffect(() => {
    if (!open) return
    place()
    const onScroll = () => setOpen(false)
    window.addEventListener("scroll", onScroll, { passive: true, capture: true })
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true })
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        aria-label={ariaLabel}
        aria-describedby={open ? "fame-tooltip" : undefined}
        aria-expanded={open}
        data-open={open ? "true" : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false)
        }}
        onClick={() => setOpen((state) => !state)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-tremor-default text-content-tertiary transition-colors hover:text-content-default"
      >
        {children ?? (
          <span aria-hidden="true" className="text-sm">
            ⓘ
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            id="fame-tooltip"
            role="tooltip"
            className={`pointer-events-none fixed z-60 rounded-tremor-default border border-stroke-default bg-surface-raise p-3 text-xs leading-relaxed text-content-secondary shadow-menu ${popupClass}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: position.placement === "top" ? "translateY(-100%)" : "none",
              width: "16rem",
            }}
          >
            {hint}
          </div>,
          document.body,
        )}
    </>
  )
}
