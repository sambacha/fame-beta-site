import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import reactHooks from "eslint-plugin-react-hooks"
import globals from "globals"

/**
 * Strict ESLint policy for the FAME Protocol landing page (Preact + Vite).
 * Biome (see biome.json) enforces formatting + a second strict pass; this
 * config keeps type-aware TS rules and the hooks rules, and blocks all
 * escape hatches.
 */
export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "out/**",
      "build/**",
      ".next/**",
      "tool-results/**",
      "skills/**",
      "download/**",
      "upload/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Deployment/verification tooling — same strict bar as first-party app code.
    files: ["scripts/**/*.{mjs,mts}"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "react-hooks": reactHooks },
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // Hooks correctness (works for preact hooks too)
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",

      // TypeScript — no escape hatches
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/prefer-as-const": "error",

      // General JavaScript
      "prefer-const": "error",
      "no-console": ["error", { allow: ["warn", "error", "info"] }],
      "no-debugger": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      "eqeqeq": ["error", "smart"],
      "no-irregular-whitespace": "error",
      "no-var": "error",
    },
  },
)
