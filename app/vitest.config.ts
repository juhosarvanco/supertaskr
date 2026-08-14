import { defineConfig } from "vitest/config";
import path from "node:path";

// Minimal test runner for app-side pure logic (T-003: the docs-model
// reducer) plus T-007's empty-state DOM tests. Deliberately independent
// of vite.config.ts. The default environment stays node (pure logic
// needs no DOM); the one DOM test file opts into jsdom via a
// `@vitest-environment` pragma.
export default defineConfig({
  resolve: {
    // Same "@" alias as vite.config.ts (App.tsx imports through it).
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  esbuild: {
    // .tsx test files (T-007 renders EmptyState); mirrors tsconfig's
    // react-jsx setting so vitest transforms JSX the same way vite does.
    jsx: "automatic",
  },
  test: {
    environment: "node",
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
