"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"

export type Persona = "institutional" | "retail"

type PersonaContextValue = {
  persona: Persona
  setPersona: (next: Persona) => void
}

const STORAGE_KEY = "fame-persona"

const PersonaContext = createContext<PersonaContextValue | null>(null)

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersonaState] = useState<Persona>("institutional")
  const [announcement, setAnnouncement] = useState("")

  // Restore the persisted perspective after hydration (no SSR mismatch).
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === "retail" || stored === "institutional") {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration storage restore is the sanctioned way to avoid SSR mismatch
        setPersonaState(stored)
      }
    } catch {
      // Storage unavailable (private mode) — keep the default view.
    }
  }, [])

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
