import { useCallback, useEffect, useMemo, useReducer, useState } from "preact/hooks"
import {
  findLeg,
  findTrade,
  generateSummary,
  type OrderConfig,
  parleyTicket,
  performCalculation,
  validateAmount,
} from "@/lib/order-data"

/**
 * Orchestrator state machine for the parametric order flow.
 * IDLE → TRADE_A_SELECTED → TRADE_B_SELECTED → PARLEY_READY → SUBMITTED,
 * with an INVALID_PAIR side-state that flags Node B (aria-invalid) until a
 * compatible leg is chosen. Announcements feed a polite aria-live region.
 *
 * The Parametric Order Configuration panel adds the second synchronized
 * surface: the ticket amount is state, while the dependent second leg and
 * the payoff summary are derived from it (amount → performCalculation →
 * generateSummary), so the input, read-only field and chart stay in lockstep.
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
  amountRaw: string
  amount: number | null
  amountError: string | null
}

type OrderAction =
  | { type: "SELECT_TRADE_A"; tradeAId: string }
  | { type: "SELECT_LEG_B"; legId: string }
  | { type: "SET_AMOUNT"; raw: string }
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
  amountRaw: "",
  amount: null,
  amountError: null,
}

function reducer(state: OrderState, action: OrderAction): OrderState {
  switch (action.type) {
    case "SELECT_TRADE_A": {
      // Re-validate the ticket against the new instrument's liquidity bound.
      const revalidated = validateAmount(state.amountRaw, findTrade(action.tradeAId))
      return {
        ...state,
        tradeAId: action.tradeAId,
        legId: null,
        phase: "TRADE_A_SELECTED",
        invalidReason: null,
        ticket: null,
        amount: revalidated.amount,
        amountError: revalidated.error,
      }
    }
    case "SELECT_LEG_B":
      return { ...state, legId: action.legId, phase: "TRADE_B_SELECTED", invalidReason: null }
    case "SET_AMOUNT": {
      const next = validateAmount(action.raw, findTrade(state.tradeAId))
      const ready = next.amount !== null && next.error === null
      return {
        ...state,
        amountRaw: action.raw,
        amount: next.amount,
        amountError: next.error,
        // A missing or out-of-bounds ticket revokes PARLEY_READY until fixed.
        phase: state.phase === "PARLEY_READY" && !ready ? "TRADE_B_SELECTED" : state.phase,
      }
    }
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
  // The pass now also requires a valid ticket size — PARLEY_READY means the
  // full parametric configuration is inside the protocol's liquidity bounds.
  useEffect(() => {
    if (state.phase !== "TRADE_B_SELECTED" || !state.tradeAId || !state.legId) {
      return
    }
    const legChecked = findLeg(state.tradeAId, state.legId)
    if (legChecked && !legChecked.compatible) {
      const timer = window.setTimeout(() => {
        const reason = legChecked.constraint ?? "The selected legs cannot form a valid parley."
        dispatch({ type: "VALIDATION_FAIL", reason })
        setAnnouncement(`Second leg rejected. ${reason}`)
      }, VALIDATION_DELAY_MS)
      return () => {
        window.clearTimeout(timer)
      }
    }
    if (state.amount === null || state.amountError !== null) {
      return
    }
    const ticketUsd = state.amount
    const timer = window.setTimeout(() => {
      dispatch({ type: "VALIDATION_PASS" })
      setAnnouncement(
        `Correlation validated at ${(legChecked?.correlation ?? 0).toFixed(2)} with notional ${ticketUsd.toLocaleString("en-US")} dollars. Parley is ready — confirm to route.`,
      )
    }, VALIDATION_DELAY_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [state.phase, state.tradeAId, state.legId, state.amount, state.amountError])

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

  /**
   * Generalised node-progress handler (the orchestrator contract):
   * handleNodeSelect("tradeA" | "legB", { id, label }).
   */
  const handleNodeSelect = useCallback(
    (nodeId: "tradeA" | "legB", data: { id: string; label: string }) => {
      if (nodeId === "tradeA") {
        selectTradeA(data.id, data.label)
      } else {
        selectLegB(data.id, data.label)
      }
    },
    [selectTradeA, selectLegB],
  )

  /** Amount box → recalculates the dependent second leg + payoff summary. */
  const handleAmountChange = useCallback(
    (raw: string) => {
      dispatch({ type: "SET_AMOUNT", raw })
      const next = validateAmount(raw, tradeA)
      if (raw.trim() === "") {
        setAnnouncement("Ticket amount cleared.")
      } else if (next.error) {
        setAnnouncement(`Amount rejected. ${next.error}`)
      } else if (next.amount !== null) {
        const legTwo = performCalculation(next.amount, tradeA, leg)
        setAnnouncement(
          `Notional set to ${next.amount.toLocaleString("en-US")} dollars.${
            legTwo
              ? ` Second leg auto-sized to ${legTwo.notionalUsd.toLocaleString("en-US")} dollars. Payoff bounds updated.`
              : " Select a second leg to complete the parley."
          }`,
        )
      }
    },
    [tradeA, leg],
  )

  /** Synchronized configuration view: amount is state, legs are derivatives. */
  const orderData: OrderConfig = useMemo(
    () => ({
      amount: state.amount,
      legOne: tradeA?.label ?? "",
      legTwo: state.amount !== null ? performCalculation(state.amount, tradeA, leg) : null,
      summary: generateSummary(state.amount, tradeA, leg),
    }),
    [state.amount, tradeA, leg],
  )

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

  const step =
    state.phase === "IDLE"
      ? 0
      : state.phase === "TRADE_A_SELECTED"
        ? 1
        : state.phase === "TRADE_B_SELECTED" || state.phase === "INVALID_PAIR"
          ? 2
          : state.phase === "PARLEY_READY"
            ? 3
            : 4

  return {
    state,
    step,
    tradeA,
    leg,
    orderData,
    announcement,
    selectTradeA,
    selectLegB,
    handleNodeSelect,
    handleAmountChange,
    submit,
    reset,
  }
}
