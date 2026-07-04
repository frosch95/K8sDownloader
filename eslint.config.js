import eslint from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  // Global ignores
  {
    ignores: [
      "dist/",
      "dist-electron/",
      "dist-types/",
      "node_modules/",
      "release/",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
    ],
  },

  // Base recommended config
  eslint.configs.recommended,

  // TypeScript + React config
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "react-hooks": reactHooks,
    },
    rules: {
      // From @typescript-eslint/recommended
      ...tseslint.configs.recommended.rules,
      // From react-hooks/recommended
      ...reactHooks.configs.recommended.rules,
      // Custom rules
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "react-hooks/exhaustive-deps": "warn",
      // New in react-hooks v7 – existing codebase, demote to warning
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];
