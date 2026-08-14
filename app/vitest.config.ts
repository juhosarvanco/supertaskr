import { defineConfig } from "vitest/config";

// Minimal test runner for app-side pure logic (T-003: the docs-model
// reducer). Deliberately independent of vite.config.ts — the store logic
// under test is DOM-free TypeScript, so no jsdom, no React plugin, no
// Tailwind involvement.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
