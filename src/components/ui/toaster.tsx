import { createPortal } from "preact/compat"
import { useToast } from "@/hooks/use-toast"

/**
 * Toast viewport — bottom-right on desktop, full-width on small screens
 * (mirrors the old Radix viewport geometry). Destructive toasts pair the
 * error surface with role="alert"; defaults use role="status".
 */
export function Toaster() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return createPortal(
    <section
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-0 right-0 z-100 flex w-full flex-col p-4 md:max-w-[420px]"
    >
      {toasts.map(({ id, title, description, variant, open }) => (
        <div
          key={id}
          role={variant === "destructive" ? "alert" : "status"}
          aria-live={variant === "destructive" ? "assertive" : "polite"}
          data-state={open ? "open" : "closed"}
          className={`pointer-events-auto relative flex w-full items-start justify-between gap-3 overflow-hidden rounded-md border p-4 shadow-toast transition-all data-[state=closed]:translate-x-4 data-[state=closed]:opacity-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 ${
            variant === "destructive"
              ? "border-stroke-error bg-surface-error text-content-error"
              : "border-stroke-default bg-surface-raise text-content-default"
          }`}
        >
          <div className="grid gap-1">
            {title && <p className="text-sm font-medium text-content-raise">{title}</p>}
            {description && <p className="text-sm text-content-secondary">{description}</p>}
          </div>
          <button
            type="button"
            onClick={() => dismiss(id)}
            aria-label="Dismiss notification"
            className="rounded-md p-1 text-content-tertiary transition-colors hover:text-content-default focus:outline-none"
          >
            <span aria-hidden="true" className="flex h-4 w-4 items-center justify-center text-sm">
              ✕
            </span>
          </button>
        </div>
      ))}
    </section>,
    document.body,
  )
}
