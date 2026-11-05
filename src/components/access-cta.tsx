import type { JSX } from "preact"
import { useRef, useState } from "preact/hooks"
import { usePersona } from "@/components/persona-context"
import { Select } from "@/components/ui/select"
import { ACCESS_CONTENT } from "@/lib/site-content"

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
  "min-h-11 w-full rounded-tremor-default border border-stroke-raise bg-surface-secondary px-3 py-2.5 text-base text-content-default placeholder:text-content-tertiary focus:outline-none focus:border-stroke-accent-secondary"

/**
 * Request Access — the conversion CTA. Blur-time validation with manual
 * aria-invalid + aria-describedby wiring (replacing Base-UI Field), 16px
 * controls prevent iOS focus zoom, and a polite live region announces both
 * error and success outcomes (WCAG 2.1 AA 3.3.1 / 4.1.3).
 */
export function AccessCTA() {
  const { persona } = usePersona()
  const [values, setValues] = useState<FormValues>(INITIAL_VALUES)
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle")
  const [touched, setTouched] = useState<{ name: boolean; email: boolean }>({
    name: false,
    email: false,
  })
  const [announcement, setAnnouncement] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  const set = (key: keyof FormValues, value: string | null) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const institutional = persona === "institutional"
  const points = institutional ? ACCESS_CONTENT.institutional : ACCESS_CONTENT.retail

  const nameError = validateName(values.name)
  const emailError = validateEmail(values.email)

  const handleSubmit = (event: JSX.TargetedEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouched({ name: true, email: true })
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
    setTouched({ name: false, email: false })
    setAnnouncement("")
  }

  return (
    <section
      id="access"
      aria-labelledby="access-title"
      className="cv-auto border-b border-stroke-default"
    >
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="text-mono-xs text-content-accent">{ACCESS_CONTENT.eyebrow}</p>
          <h2
            id="access-title"
            className="mt-3 text-3xl font-medium tracking-tight text-content-raise sm:text-4xl"
          >
            {institutional ? ACCESS_CONTENT.institutionalTitle : ACCESS_CONTENT.retailTitle}
          </h2>
          <p className="mt-4 max-w-md text-content-secondary">
            {institutional ? ACCESS_CONTENT.institutionalLede : ACCESS_CONTENT.retailLede}
          </p>
          <ul className="mt-8 space-y-4">
            {points.items.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-content-secondary">
                <span aria-hidden="true" className="mt-0.5 text-content-accent">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-tremor-default border border-stroke-default bg-surface-raise p-6 shadow-border-small sm:p-8">
          {status === "success" ? (
            <div className="flex min-h-80 flex-col items-start justify-center">
              <p className="text-mono-xs text-content-accent">Request received</p>
              <p className="mt-3 text-2xl font-medium text-content-raise">
                {institutional ? "Your desk is in the queue." : "You're on the list."}
              </p>
              <p className="mt-3 max-w-sm text-sm text-content-secondary">
                We reply within two business days. Meanwhile, the journal covers how the risk engine
                and proof set actually work.
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-6 inline-flex min-h-11 items-center rounded-tremor-default border border-stroke-raise px-4 font-mono text-sm text-content-secondary transition-colors hover:bg-surface-hover hover:text-content-default"
              >
                Submit another request ↺
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={handleSubmit} className="grid gap-5">
              <div className="flex flex-col gap-1.5">
                <label for="access-name" className="text-sm font-medium text-content-secondary">
                  Full name{" "}
                  <span className="text-content-error" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  ref={nameRef}
                  id="access-name"
                  name="name"
                  required
                  aria-required="true"
                  value={values.name}
                  onBlur={() => setTouched((prev) => ({ ...prev, name: true }))}
                  onInput={(event) => set("name", (event.target as HTMLInputElement).value)}
                  placeholder="Ada Lovelace"
                  autoComplete="name"
                  aria-invalid={touched.name && nameError ? "true" : undefined}
                  aria-describedby={touched.name && nameError ? "name-error" : undefined}
                  className={`${CONTROL_CLASS} ${touched.name && nameError ? "border-stroke-error focus:border-stroke-error" : ""}`}
                />
                {touched.name && nameError && (
                  <p id="name-error" aria-live="polite" className="text-xs text-content-error">
                    {nameError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label for="access-email" className="text-sm font-medium text-content-secondary">
                  Work email{" "}
                  <span className="text-content-error" aria-hidden="true">
                    *
                  </span>
                </label>
                <input
                  ref={emailRef}
                  id="access-email"
                  name="email"
                  type="email"
                  inputMode="email"
                  required
                  aria-required="true"
                  value={values.email}
                  onBlur={() => setTouched((prev) => ({ ...prev, email: true }))}
                  onInput={(event) => set("email", (event.target as HTMLInputElement).value)}
                  placeholder="risk@fund.example"
                  autoComplete="email"
                  aria-invalid={touched.email && emailError ? "true" : undefined}
                  aria-describedby={touched.email && emailError ? "email-error" : undefined}
                  className={`${CONTROL_CLASS} ${touched.email && emailError ? "border-stroke-error focus:border-stroke-error" : ""}`}
                />
                {touched.email && emailError && (
                  <p id="email-error" aria-live="polite" className="text-xs text-content-error">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label for="access-org" className="text-sm font-medium text-content-secondary">
                  {institutional ? "Fund / organisation" : "Nickname (optional)"}
                </label>
                <input
                  id="access-org"
                  name="org"
                  value={values.org}
                  onInput={(event) => set("org", (event.target as HTMLInputElement).value)}
                  placeholder={institutional ? "Parlay Capital LP" : "satoshi_fan"}
                  autoComplete="organization"
                  className={CONTROL_CLASS}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span id="notional-label" className="text-sm font-medium text-content-secondary">
                  Intended notional
                </span>
                <Select
                  ariaLabel="Intended notional band"
                  id="access-notional"
                  items={NOTIONAL_BANDS.map((band) => ({
                    value: band,
                    node: (
                      <span className="block px-3 py-2.5 text-sm text-content-default">{band}</span>
                    ),
                  }))}
                  value={values.notional}
                  onValueChange={(value) => set("notional", value)}
                  triggerClass={`${CONTROL_CLASS} inline-flex items-center justify-between gap-3 text-left`}
                  popupClass="min-w-56 rounded-tremor-default border border-stroke-default bg-surface-raise p-1 shadow-menu"
                  itemClass="rounded-sm outline-none data-[highlighted]:bg-surface-accent"
                >
                  <span className={values.notional ? "" : "text-content-tertiary"}>
                    {values.notional ?? "Select a band…"}
                  </span>
                </Select>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex min-h-11 items-center justify-center rounded-tremor-default bg-surface-accent-inverse px-6 text-mono-sm text-content-inverse transition-colors hover:bg-surface-accent-inverse-hover"
              >
                {institutional ? "Request vault access" : "Join the waitlist"}
              </button>
              <p className="text-[11px] leading-relaxed text-content-tertiary">
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
