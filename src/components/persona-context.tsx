import type { ComponentChildren } from "preact"
import { createContext, useCallback, useContext, useMemo, useState } from "preact/compat"

export type Persona = "institutional" | "retail"

type PersonaContextValue = {
  persona: Persona
  setPersona: (next: Persona) => void
}

const STORAGE_KEY = "fame-persona"

const PersonaContext = createContext<PersonaContextValue | null>(null)

function initialPersona(): Persona {
  // Client-only app: reading storage at first render is safe (no SSR drift).
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "retail" || stored === "institutional") return stored
  } catch {
    // Storage unavailable (private mode) — keep the default view.
  }
  return "institutional"
}

export function PersonaProvider({ children }: { children: ComponentChildren }) {
  const [persona, setPersonaState] = useState<Persona>(initialPersona)
  const [announcement, setAnnouncement] = useState("")

  const setPersona = useCallback((next: Persona) => {
    setPersonaState(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Non-fatal: the toggle still applies for this session.
    }
    setAnnouncement(
      next === "institutional"
        ? "Institutional view selected. Liquidity ratios, emission caps and settlement proofs are now emphasised."
        : "Retail view selected. Simplified yield and safety information is now emphasised.",
    )
  }, [])

  const value = useMemo(() => ({ persona, setPersona }), [persona, setPersona])

  return (
    <PersonaContext.Provider value={value}>
      {children}
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>
    </PersonaContext.Provider>
  )
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext)
  if (!ctx) {
    throw new Error("usePersona must be used inside <PersonaProvider>")
  }
  return ctx
}
