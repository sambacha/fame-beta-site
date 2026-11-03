"use client"

import { useCallback, useEffect, useMemo, useReducer, useState } from "react"
import { findLeg, findTrade, parleyTicket } from "@/lib/order-data"

/**
 * Orchestrator state machine for the parametric order flow.
 * IDLE → TRADE_A_SELECTED → TRADE_B_SELECTED → PARLEY_READY → SUBMITTED,
 * with an INVALID_PAIR side-state that flags Node B (aria-invalid) until a
 * compatible leg is chosen. Announcements feed a polite aria-live region.
 */

export type OrderPhase =
  | "IDLE"
  | "TRADE_A_SELECTED"
  | "TRADE_B_SELECTED"
  | "INVALID_PAIR"
  | "PARLEY_READY"
  | "SUBMITTED"

export type OrderState = {
  phase: OrderPhase
  tradeAId: string | null
  legId: string | null
  ticket: string | null
  invalidReason: string | null
  attempts: number
}

type OrderAction =
  | { type: "SELECT_TRADE_A"; tradeAId: string }
  | { type: "SELECT_LEG_B"; legId: string }
  | { type: "VALIDATION_PASS" }
  | { type: "VALIDATION_FAIL"; reason: string }
  | { type: "SUBMIT"; ticket: string }
  | { type: "RESET" }

const initialState: OrderState = {
  phase: "IDLE",
  tradeAId: null,
  legId: null,
  ticket: null,
  invalidReason: null,
  attempts: 0,
}

function reducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "SELECT_TRADE_A":
      return {
        ...state,
        tradeAId: action.tradeAId,
        legId: null,
        phase: "TRADE_A_SELECTED",
        invalidReason: null,
        ticket: null,
      }
    case "SELECT_LEG_B":
      return { ...state, legId: action.legId, phase: "TRADE_B_SELECTED", invalidReason: null }
    case "VALIDATION_PASS":
      return state.phase === "TRADE_B_SELECTED" ? { ...state, phase: "PARLEY_READY" } : state
    case "VALIDATION_FAIL":
      return {
        ...state,
        phase: "INVALID_PAIR",
        legId: null,
        invalidReason: action.reason,
        attempts: state.attempts + 1,
      }
    case "SUBMIT":
      return { ...state, phase: "SUBMITTED", ticket: action.ticket }
    case "RESET":
      return { ...initialState, attempts: state.attempts }
  }
}

const VALIDATION_DELAY_MS = 900

export function useOrderBuilder() {
  const [state, dispatch] = useReducer(reducer, initialState)
  const [announcement, setAnnouncement] = useState("")

  const tradeA = useMemo(() => findTrade(state.tradeAId), [state.tradeAId])
  const leg = useMemo(() => findLeg(state.tradeAId, state.legId), [state.tradeAId, state.legId])

  // Simulated correlation/margin validation pass between Node B and Node C.
  useEffect(() => {
    if (state.phase !== "TRADE_B_SELECTED" || !state.tradeAId || !state.legId) {
      return
    }
    const legChecked = findLeg(state.tradeAId, state.legId)
    const timer = window.setTimeout(() => {
      if (legChecked?.compatible) {
        dispatch({ type: "VALIDATION_PASS" })
        setAnnouncement(
          `Correlation validated at ${legChecked.correlation.toFixed(2)}. Parley is ready — confirm to route.`,
        )
      } else {
        const reason = legChecked?.constraint ?? "The selected legs cannot form a valid parley."
        dispatch({ type: "VALIDATION_FAIL", reason })
        setAnnouncement(`Second leg rejected. ${reason}`)
      }
    }, VALIDATION_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [state.phase, state.tradeAId, state.legId])

  const selectTradeA = useCallback((id: string, label: string) => {
    dispatch({ type: "SELECT_TRADE_A", tradeAId: id })
    setAnnouncement(
      `Leg one selected: ${label}. Second leg unlocked — choose a compatible instrument.`,
    )
  }, [])

  const selectLegB = useCallback((id: string, label: string) => {
    dispatch({ type: "SELECT_LEG_B", legId: id })
    setAnnouncement(`Leg two selected: ${label}. Validating correlation and margin constraints.`)
  }, [])

  const submit = useCallback(() => {
    const ticket = parleyTicket(Date.now() % 9973)
    dispatch({ type: "SUBMIT", ticket })
    setAnnouncement(
      `Parametric order routed. Ticket ${ticket}. Settlement proofs post hourly against the vault.`,
    )
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: "RESET" })
    setAnnouncement("Order builder reset. Select a primary trade to begin again.")
  }, [])

  return { state, tradeA, leg, announcement, selectTradeA, selectLegB, submit, reset }
}
