import { useEffect, useRef, useState } from "preact/compat"
import type { ComponentChildren, JSX } from "preact"

/**
 * Accessible listbox (combobox pattern) — the pure-Preact replacement for
 * Base-UI Select. Emits the same state hooks the stylesheet keys on:
 * `data-popup-open` on the trigger and `data-highlighted` on options, so
 * every existing `data-[popup-open]:*` / `data-[highlighted]:*` class keeps
 * working. Focus stays on the trigger; Arrow keys move the highlighted
 * option (aria-activedescendant), Enter/Space commit, Escape closes and
 * Home/End jump. Outside pointer events close the popup.
 */

export type SelectItem = {
  value: string
  node: ComponentChildren
}

type SelectProps = {
  items: SelectItem[]
  value: string | null
  onValueChange: (value: string) => void
  ariaLabel: string
  id?: string
  /** Trigger content (caller renders the selected representation). */
  children?: ComponentChildren
  triggerClass?: string
  popupClass?: string
  itemClass?: string
}

export function Select({
  items,
  value,
  onValueChange,
  ariaLabel,
  id,
  children,
  triggerClass = "",
  popupClass = "",
  itemClass = "",
}: SelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listId = `${id ?? "fame-select"}-listbox`

  const selectedIndex = items.findIndex((item) => item.value === value)

  useEffect(() => {
    if (open) setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex])

  // Outside pointer + focus-out dismissal.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("pointerdown", onPointerDown, true)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true)
    }
  }, [open])

  // Keep the highlighted option in view while arrowing through the list.
  useEffect(() => {
    if (!open) return
    const node = document.getElementById(`${id ?? "fame-select"}-opt-${activeIndex}`)
    node?.scrollIntoView({ block: "nearest" })
  }, [activeIndex, open, id])

  const commit = (index: number) => {
    const item = items[index]
    if (!item) return
    onValueChange(item.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (event: JSX.TargetedKeyboardEvent<HTMLButtonElement>) => {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(event.key)) {
        event.preventDefault()
        setOpen(true)
      }
      return
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        setActiveIndex((index) => Math.min(items.length - 1, index + 1))
        break
      case "ArrowUp":
        event.preventDefault()
        setActiveIndex((index) => Math.max(0, index - 1))
        break
      case "Home":
        event.preventDefault()
        setActiveIndex(0)
        break
      case "End":
        event.preventDefault()
        setActiveIndex(items.length - 1)
        break
      case "Enter":
      case " ":
        event.preventDefault()
        commit(activeIndex)
        break
      case "Escape":
        event.preventDefault()
        setOpen(false)
        break
      case "Tab":
        setOpen(false)
        break
    }
  }

  return (
    <div ref={rootRef} class="relative">
      <button
        type="button"
        ref={triggerRef}
        id={id}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${id ?? "fame-select"}-opt-${activeIndex}` : undefined}
        data-popup-open={open ? "true" : undefined}
        onClick={() => setOpen((state) => !state)}
        onKeyDown={onKeyDown}
        class={triggerClass}
      >
        {children}
        <span aria-hidden="true" class="text-content-tertiary">
          ▾
        </span>
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          class={`absolute left-0 top-full z-60 mt-1.5 outline-none ${popupClass}`}
          style={{ minWidth: "min(20rem, 100%)" }}
        >
          {items.map((item, index) => {
            const selected = item.value === value
            return (
              <li
                key={item.value}
                id={`${id ?? "fame-select"}-opt-${index}`}
                role="option"
                aria-selected={selected}
                data-highlighted={index === activeIndex ? "true" : undefined}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => commit(index)}
                class={`cursor-pointer outline-none ${itemClass}`}
              >
                {item.node}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
