import type { ComponentChild } from "preact"
import { useEffect, useState } from "preact/hooks"

/**
 * Toast store — module-level singleton with a preact subscription hook.
 * Same contract the order flow relies on: `toast({ title, description })`
 * returns `{ id, dismiss, update }`, and callers own the auto-dismiss timer.
 */

const TOAST_LIMIT = 1

export type ToasterToast = {
  id: string
  title?: ComponentChild
  description?: ComponentChild
  variant?: "default" | "destructive"
  open: boolean
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "UPDATE_TOAST"; toast: Partial<ToasterToast> & { id: string } }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string }

let count = 0
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const listeners: Array<(state: State) => void> = []

type State = { toasts: ToasterToast[] }

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  for (const listener of listeners) listener(memoryState)
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((candidate) =>
          candidate.id === action.toast.id ? { ...candidate, ...action.toast } : candidate,
        ),
      }
    case "DISMISS_TOAST": {
      const { toastId } = action
      return {
        ...state,
        toasts: state.toasts.map((candidate) =>
          candidate.id === toastId || toastId === undefined
            ? { ...candidate, open: false }
            : candidate,
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) return { ...state, toasts: [] }
      return {
        ...state,
        toasts: state.toasts.filter((candidate) => candidate.id !== action.toastId),
      }
  }
}

export type ToastInput = Omit<ToasterToast, "id" | "open">

function toast(props: ToastInput) {
  const id = genId()

  const update = (next: Partial<ToasterToast>) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...next, id } })
  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
    // Give the exit animation a beat, then drop the node.
    window.setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), 240)
  }

  dispatch({
    type: "ADD_TOAST",
    toast: { ...props, id, open: true },
  })

  return { id, dismiss, update }
}

function useToast() {
  const [state, setState] = useState<State>(memoryState)

  useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) listeners.splice(index, 1)
    }
  }, [])

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

export { toast, useToast }
