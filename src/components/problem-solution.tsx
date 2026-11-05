"use client"

import { usePersona } from "@/components/persona-context"
import { NARRATIVES } from "@/lib/site-content"
import { Link } from "@/router"

/**
 * Problem / Solution narrative — the conversion core of the page. Copy lives
 * in site-content.ts (single source, mirrored into the markdown sources) and
 * switches on the persona toggle. Accent stays rationed: the solution panel
 * wears the accent-wash tier; the problem panel stays neutral with the error
 * hue only on the ✕ markers.
 */
export function ProblemSolution() {
  const { persona } = usePersona()
  const narrative = NARRATIVES[persona]

  return (
    <section
      id="why-fame"
      aria-labelledby="why-title"
      className="cv-auto border-b border-stroke-default"
    >
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <p className="text-mono-xs text-content-accent">WHY FAME</p>
        <h2
          id="why-title"
          className="mt-3 max-w-3xl text-3xl font-medium tracking-tight text-content-raise sm:text-4xl"
        >
          {persona === "institutional"
            ? "Structured yield built like infrastructure, not like a promise."
            : "Structured crypto returns built so you can check everything yourself."}
        </h2>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <article className="rounded-tremor-default border border-stroke-default bg-surface-raise p-6 shadow-border-small">
            <p className="text-mono-xs text-content-error">The problem</p>
            <h3 className="mt-2 text-xl font-medium text-content-raise">
              {narrative.problemTitle}
            </h3>
            <ul className="mt-5 space-y-4">
              {narrative.problemBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 text-sm leading-relaxed text-content-secondary"
                >
                  <span aria-hidden="true" className="mt-0.5 text-content-error">
                    ✕
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-tremor-default border border-stroke-accent-quaternary bg-surface-accent/40 p-6">
            <p className="text-mono-xs text-content-accent">The FAME answer</p>
            <h3 className="mt-2 text-xl font-medium text-content-raise">
              {narrative.solutionTitle}
            </h3>
            <ul className="mt-5 space-y-4">
              {narrative.solutionBullets.map((bullet) => (
                <li
                  key={bullet}
                  className="flex gap-3 text-sm leading-relaxed text-content-secondary"
                >
                  <span aria-hidden="true" className="mt-0.5 text-content-accent">
                    ✓
                  </span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/#build"
              className="mt-6 inline-flex min-h-11 items-center font-mono text-sm text-content-accent-secondary transition-colors hover:text-content-accent"
            >
              See how a parley is built →
            </Link>
          </article>
        </div>
      </div>
    </section>
  )
}
