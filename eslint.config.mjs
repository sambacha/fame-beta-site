import nextCoreWebVitals from "eslint-config-next/core-web-vitals"
import nextTypescript from "eslint-config-next/typescript"
import globals from "globals"
import { dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/**
 * Strict ESLint policy for the FAME Protocol landing page.
 * Biome (see biome.json) enforces formatting + a second strict pass;
 * this config keeps the framework-aware rules and blocks all escapes hatches.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // TypeScript — no escape hatches
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/prefer-as-const": "error",

      // React correctness
      "react-hooks/exhaustive-deps": "error",
      "react/no-unescaped-entities": "error",
      "react/display-name": "error",
      "react-compiler/react-compiler": "off",

      // Next.js
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",

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
  {
    // Deployment/verification tooling — same strict bar as first-party app code.
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: { ...globals.node },
    },
  },
  {
    // Scaffold-shipped primitives (shadcn/ui + hooks) — relax the React
    // Compiler-era rules that third-party skeleton code trips on; strict
    // enforcement applies to all first-party code above.
    files: ["src/components/ui/**", "src/hooks/**"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "skills/**",
      "download/**",
      "upload/**",
    ],
  },
]

export default eslintConfig
