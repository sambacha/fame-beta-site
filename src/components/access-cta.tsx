"use client"

import { Field } from "@base-ui-components/react/field"
import { Select } from "@base-ui-components/react/select"
import { type FormEvent, useRef, useState } from "react"
import { usePersona } from "@/components/persona-context"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type FormValues = {
  name: string
  email: string
  org: string
  notional: string | null
}

const INITIAL_VALUES: FormValues = { name: "", email: "", org: "", notional: null }

const NOTIONAL_BANDS = ["Under $1M", "$1M – $10M", "$10M+"] as const

function validateName(value: string): string | null {
  return value.trim().length >= 2 ? null : "Enter your full name (at least 2 characters)."
}

function validateEmail(value: string): string | null {
  return EMAIL_RE.test(value.trim())
    ? null
    : "Enter a valid work email — we send access credentials here."
}

const CONTROL_CLASS =
  "min-h-11 w-full rounded-tremor-default border border-stroke-strong bg-surface-inset px-3 py-2.5 text-base text-content-primary placeholder:text-content-faint focus:border-brand-green focus:outline-none"

/**
 * Request Access — the conversion CTA. Base-UI Field primitives give us
 * blur-time validation with automatic aria-invalid + aria-describedby wiring,
 * 16px controls prevent iOS focus zoom, and a polite live region announces
 * both error and success outcomes (WCAG 2.1 AA 3.3.1 / 4.1.3).
 */
export function AccessCTA() {
  const { persona } = usePersona()
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle")
  const [announcement, setAnnouncement] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof FormValues, value: string | null) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const institutional = persona === "institutional"

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const nameError = validateName(values.name)
    const emailError = validateEmail(values.email)
    if (nameError || emailError) {
      setStatus("error")
      const summary = [nameError, emailError].filter(Boolean).join(" ")
      setAnnouncement(`The form needs attention. ${summary}`)
      const firstInvalid = nameError ? nameRef.current : emailRef.current
      firstInvalid?.focus()
      return
    }
    setStatus("success")
    setAnnouncement(
      "Request received. We will contact you within two business days with onboarding details.",
    )
  }

  const resetForm = () => {
    setValues(INITIAL_VALUES)
    setStatus("idle")
    setAnnouncement("")
  }

  return (
    <section
      id="access"
      aria-labelledby="access-title"
      className="cv-auto border-b border-stroke-dim"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="font-mono text-xs tracking-[0.25em] text-brand-green">REQUEST ACCESS</p>
          <h2
            id="access-title"
            className="mt-3 text-3xl font-semibold tracking-tight text-content-primary sm:text-4xl"
          >
            {institutional ? "Talk to the protocol team." : "Get on the list."}
          </h2>
          <p className="mt-4 max-w-md text-content-secondary">
            {institutional
              ? "Notional onboarding for parley vaults is gated to keep the curve fair. Bring your mandate; we bring the proof pack — program constants, invariant set, and the audit folder."
              : "Retail access opens in waves so the curve stays honest. Join the list and you will get a plain-language walkthrough before you ever commit capital."}
          </p>
          <ul className="mt-8 space-y-4">
            {(institutional
              ? [
                  "Proof pack within 48 hours: constants, invariants, CI configuration.",
                  "Vault desk for size — OTC settlement with slot-level proofs.",
                  "Risk API: recompute the liquidity ratio from raw chain state.",
                ]
              : [
                  "No minimum size on the public curve.",
                  "Plain-language guides before any leg is opened.",
                  "Your exit rights always settle first — by program rule.",
                ]
            ).map((item) => (
              <li key={item} className="flex gap-3 text-sm text-content-secondary">
                <span aria-hidden="true" className="mt-0.5 text-brand-green">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-tremor-default border border-stroke-dim bg-surface-base p-6 sm:p-8">
          {status === "success" ? (
            <div className="flex min-h-80 flex-col items-start justify-center">
              <p className="font-mono text-[11px] uppercase tracking-widest text-brand-green">
                Request received
              </p>
              <p className="mt-3 text-2xl font-semibold text-content-primary">
                {institutional ? "Your desk is in the queue." : "You're on the list."}
              </p>
              <p className="mt-3 max-w-sm text-sm text-content-secondary">
                We reply within two business days. Meanwhile, the journal below covers how the risk
                engine and proof set actually work.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-strong px-4 font-mono text-sm text-content-secondary transition-colors hover:border-brand-green hover:text-brand-green"
              >
                Submit another request ↺
              </button>
            </div>
          ) : (
            <form ref={formRef} noValidate onSubmit={handleSubmit} className="grid gap-5">
              <Field.Root
                name="name"
                validate={(value) => validateName(String(value ?? ""))}
                validationMode="onBlur"
                className="flex flex-col gap-1.5"
              >
                <Field.Label className="text-sm font-medium text-content-secondary">
                  Full name{" "}
                  <span className="text-brand-coral" aria-hidden="true">
                    *
                  </span>
                </Field.Label>
                <Field.Control
                  ref={nameRef}
                  required
                  aria-required="true"
                  value={values.name}
                  onChange={(event) => set("name", event.target.value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  className={CONTROL_CLASS}
                />
                <Field.Error className="text-xs text-brand-coral" />
              </Field.Root>

              <Field.Root
                name="email"
                validate={(value) => validateEmail(String(value ?? ""))}
                validationMode="onBlur"
                className="flex flex-col gap-1.5"
              >
                <Field.Label className="text-sm font-medium text-content-secondary">
                  Work email{" "}
                  <span className="text-brand-coral" aria-hidden="true">
                    *
                  </span>
                </Field.Label>
                <Field.Control
                  ref={emailRef}
                  required
                  aria-required="true"
                  type="email"
                  inputMode="email"
                  value={values.email}
                  onChange={(event) => set("email", event.target.value)}
                  placeholder="risk@fund.example"
                  autoComplete="email"
                  className={CONTROL_CLASS}
                />
                <Field.Error className="text-xs text-brand-coral" />
              </Field.Root>

              <Field.Root name="org" className="flex flex-col gap-1.5">
                <Field.Label className="text-sm font-medium text-content-secondary">
                  {institutional ? "Fund / organisation" : "Nickname (optional)"}
                </Field.Label>
                <Field.Control
                  value={values.org}
                  onChange={(event) => set("org", event.target.value)}
                  placeholder={institutional ? "Parlay Capital LP" : "satoshi_fan"}
                  autoComplete="organization"
                  className={CONTROL_CLASS}
                />
              </Field.Root>

              <Field.Root name="notional" className="flex flex-col gap-1.5">
                <Field.Label className="text-sm font-medium text-content-secondary">
                  Intended notional
                </Field.Label>
                <Select.Root
                  items={NOTIONAL_BANDS.map((band) => ({ value: band, label: band }))}
                  value={values.notional}
                  onValueChange={(value) =>
                    set("notional", typeof value === "string" ? value : null)
                  }
                >
                  <Select.Trigger
                    aria-label="Intended notional band"
                    className={`${CONTROL_CLASS} inline-flex items-center justify-between gap-3`}
                  >
                    <Select.Value>
                      <span className={values.notional ? "" : "text-content-faint"}>
                        {values.notional ?? "Select a band…"}
                      </span>
                    </Select.Value>
                    <Select.Icon className="text-content-faint">
                      <span aria-hidden="true">▾</span>
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Positioner sideOffset={6} className="z-60 outline-none">
                      <Select.Popup className="min-w-56 rounded-tremor-default border border-stroke-dim bg-surface-raised p-1 shadow-tremor-dropdown">
                        {NOTIONAL_BANDS.map((band) => (
                          <Select.Item
                            key={band}
                            value={band}
                            className="cursor-pointer rounded-sm px-3 py-2.5 text-sm text-content-primary outline-none data-[highlighted]:bg-brand-green/10"
                          >
                            <Select.ItemText>{band}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Popup>
                    </Select.Positioner>
                  </Select.Portal>
                </Select.Root>
              </Field.Root>

              <button
                type="submit"
                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-tremor-default bg-brand-green px-6 text-sm font-semibold text-surface-inset transition-colors hover:bg-brand-green-emphasis"
              >
                {institutional ? "Request vault access" : "Join the waitlist"}
              </button>
              <p className="text-[11px] leading-relaxed text-content-faint">
                No token sale, no spam. We use the address only for onboarding correspondence.
              </p>
            </form>
          )}

          <div role="status" aria-live="polite" className="sr-only">
            {announcement}
          </div>
        </div>
      </div>
    </section>
  )
}
