/** Explicit Supertaskr source-CI contract. This is not an installed project
 * default; configured effect paths must use committed project settings. */
/** @satisfies {Readonly<Record<string, import("./gate-run.mjs").Suite>>} */
export const SOURCE_CI_SUITES = Object.freeze({
  parser: {
    id: "parser",
    cwd: "lib/parser",
    sentinel: "package.json",
    argv: ["npx", "vitest", "run"],
    family: "vitest",
    solo: false,
    why: "C-06's parser suite, including authored source-only document fixtures.",
  },
  app: {
    id: "app",
    cwd: "app",
    sentinel: "package.json",
    argv: ["npm", "test"],
    family: "vitest",
    solo: false,
    why: "C-05's model-store unit tests (T-003).",
  },
  rust: {
    id: "rust",
    cwd: "app/src-tauri",
    sentinel: "Cargo.toml",
    argv: ["cargo", "test", "--no-fail-fast"],
    family: "cargo",
    solo: true,
    why:
      "Both workspace crates via default-members. --no-fail-fast is NOT " +
      "optional here: without it a crate-scope count silently describes " +
      "one target (instance 4, and the exit code is 101 either way). " +
      "solo: T-088-s4's cache cliff reds startup_arm under contention.",
  },
  e2e: {
    id: "e2e",
    cwd: "tools/e2e",
    sentinel: "playwright.config.ts",
    argv: ["npx", "playwright", "test"],
    family: "playwright",
    solo: true,
    why:
      "The real-input lane; workers 1, retries 0, no skips. solo: its " +
      "wall time is a health band (suite/e2e-seconds), so a run beside " +
      "another is a reading of the contention, not of the suite.",
  },
});
