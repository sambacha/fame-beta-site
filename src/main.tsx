import { render } from "preact"
import { App } from "@/app-shell"

// Self-hosted variable fonts (font-display: swap, CSP stays 'self'-only).
import "@fontsource-variable/inter"
import "@fontsource-variable/jetbrains-mono"
import "@/index.css"

/**
 * Client-side only bootstrap: the static shells carry meta + JSON-LD; this
 * module mounts the entire interactive UI. No hydration, no SSR.
 */
const mount = document.getElementById("app")
if (mount) {
  render(<App />, mount)
}
