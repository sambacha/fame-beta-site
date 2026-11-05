import { useRef } from "preact/compat"
import type { ComponentChildren, JSX } from "preact"

/**
 * Radio group — the pure-Preact replacement for Base-UI RadioGroup/Radio.
 * Emits `data-checked` / `data-disabled` on each option so the stylesheet's
 * `data-[checked]:*` / `data-[disabled]:*` variants keep working. Roving
 * tabindex with ArrowUp/ArrowLeft (previous) and ArrowDown/ArrowRight
 * (next), Space selects — WAI-ARIA radiogroup pattern.
 */

type RadioGroupProps = {
  value: string | null
  onValueChange: (value: string) => void
  ariaLabel: string
  ariaInvalid?: boolean
  children: ComponentChildren
  className?: string
}

type RadioContextValue = {
  value: string | null
  onValueChange: (value: string) => void
  name: string
  register: (id: string) => void
  focusSibling: (id: string, direction: 1 | -1) => void
}

import { createContext, useContext } from "preact/compat"

const RadioContext = createContext<RadioContextValue | null>(null)

export function RadioGroup({
  value,
  onValueChange,
  ariaLabel,
  ariaInvalid,
  children,
  className = "",
}: RadioGroupProps) {
  const groupRef = useRef<HTMLDivElement>(null)
  const orderRef = useRef<string[]>([])

  const context: RadioContextValue = {
    value,
    onValueChange,
    name: `fame-radio-${Math.random().toString(36).slice(2, 8)}`,
    register: (id) => {
      if (!orderRef.current.includes(id)) orderRef.current.push(id)
    },
    focusSibling: (id, direction) => {
      const order = orderRef.current
      const index = order.indexOf(id)
      if (index < 0) return
      for (let step = 1; step <= order.length; step += 1) {
        const next = order[(index + direction * step + order.length * step) % order.length]
        const node = groupRef.current?.querySelector<HTMLLabelElement>(`[data-radio-id="${next}"]`)
        if (node && !node.hasAttribute("data-disabled")) {
          node.focus()
          node.click()
          return
        }
      }
    },
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-label={ariaLabel}
      aria-invalid={ariaInvalid ? "true" : undefined}
      className={className}
    >
      <RadioContext.Provider value={context}>{children}</RadioContext.Provider>
    </div>
  )
}

type RadioProps = {
  value: string
  disabled?: boolean
  className?: string
  children: ComponentChildren
}

export function Radio({ value, disabled = false, className = "", children }: RadioProps) {
  const context = useContext(RadioContext)
  if (!context) {
    throw new Error("Radio must be used inside <RadioGroup>")
  }
  const checked = context.value === value
  context.register(value)

  const onClick = () => {
    if (!disabled) context.onValueChange(value)
  }

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLLabelElement>) => {
    if (disabled) return
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault()
      context.onValueChange(value)
      return
    }
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault()
      context.focusSibling(value, 1)
    }
    if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault()
      context.focusSibling(value, -1)
    }
  }

  return (
    <label
      data-radio-id={value}
      role="radio"
      aria-checked={checked}
      tabIndex={checked ? 0 : -1}
      data-checked={checked ? "true" : undefined}
      data-disabled={disabled ? "true" : undefined}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={className}
    >
      {children}
    </label>
  )
}
