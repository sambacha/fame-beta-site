import { useEffect, useRef } from "preact/compat"
import { createPortal } from "preact/compat"
import type { ComponentChildren, JSX } from "preact"

/**
 * Modal dialog — the pure-Preact replacement for Base-UI Dialog.
 * Portal to <body>, Escape + backdrop dismissal, focus capture on open with
 * focus restoration on close, body scroll lock, and role="dialog"
 * aria-modal="true" wiring.
 */

type DialogProps = {
  open: boolean
  onClose: (open: boolean) => void
  children: ComponentChildren
}

export function Dialog({ open, onClose, children }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation()
        onClose(false)
      }
    }
    document.addEventListener("keydown", onKeyDown)

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      restoreRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div data-fame-dialog="">
      <div
        class="fixed inset-0 z-50 bg-surface-scrim"
        aria-hidden="true"
        onClick={() => onClose(false)}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        class="outline-none"
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

/** Forward Escape/Enter semantics are handled by the root; the close button is plain. */
export function DialogClose({
  onClose,
  children,
  className = "",
}: {
  onClose: (open: boolean) => void
  children: ComponentChildren
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => onClose(false)}
      className={className}
    >
      {children}
    </button>
  )
}

export type DialogKeyboardEvent = JSX.TargetedKeyboardEvent<HTMLDivElement>
