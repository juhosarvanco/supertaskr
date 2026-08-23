// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * T-041 criterion 1 — THE GATE, looked at explicitly rather than
 * inherited. `window.__nputerShellHarness` is a test surface over the
 * shell's own state; it must not exist anywhere a user's app can reach
 * it, and "it sits next to a gated thing" is not evidence of that.
 *
 * The gate is `!isTauri && import.meta.env.DEV`, and it has two halves
 * that fail in different ways, so both are proved here separately:
 *
 *   RUNTIME half — under a Tauri runtime the block never runs, however
 *   the bundle was built. Driven by flipping `__TAURI_INTERNALS__` and
 *   re-importing the store (it decides `isTauri` at module load), then
 *   running the real `startDocsWatcher()` to completion.
 *
 *   BUILD half — in a production build vite replaces `import.meta.env.DEV`
 *   with `false`, so Rollup drops the block and nothing can install the
 *   harness even in a plain browser. Measured against the SHIPPED
 *   `dist/assets/*.js`, the same way T-037 measured the pane's arrival
 *   (genesis-mount.test.tsx) — a claim about the bundle is answered by
 *   reading the bundle.
 *
 * The positive half is here too, because a gate that fences off nothing
 * is also a failure: the browser DEV path installs the harness, and the
 * harness moves the ONE live shell (asserted through the store's own
 * public `getShellState`), not a private copy of it.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  listen: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    ipc.invoke(command);
    return Promise.resolve({ kind: "noProject" });
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (name: string) => {
    ipc.listen(name);
    return Promise.resolve(() => {});
  },
}));

type StoreModule = typeof import("../src/lib/watcher-store");

const TAURI = "__TAURI_INTERNALS__";

/** Load a FRESH copy of the store with the runtime flag set as asked —
 * `isTauri` is decided once at module load, so this is the only honest
 * way to exercise both branches in one file. */
async function loadStore(runtime: "tauri" | "browser"): Promise<StoreModule> {
  vi.resetModules();
  const w = window as unknown as Record<string, unknown>;
  if (runtime === "tauri") w[TAURI] = {};
  else delete w[TAURI];
  return import("../src/lib/watcher-store");
}

beforeEach(() => {
  delete window.__nputerDocsHarness;
  delete window.__nputerShellHarness;
});

afterEach(() => {
  delete (window as unknown as Record<string, unknown>)[TAURI];
  delete window.__nputerDocsHarness;
  delete window.__nputerShellHarness;
});

describe("the gate, runtime half: a Tauri runtime never defines the harness", () => {
  it("startDocsWatcher takes the IPC path and installs nothing on window", async () => {
    const store = await loadStore("tauri");
    expect(store.isTauriRuntime(), "the fixture must actually be the Tauri path").toBe(true);

    await store.startDocsWatcher();

    // It really went down the IPC path — otherwise "no harness" would be
    // true for the boring reason that nothing ran.
    expect(ipc.listen).toHaveBeenCalledWith("docs-changed");
    expect(ipc.invoke).toHaveBeenCalledWith("docs_snapshot");
    expect(store.getShellState().phase).toBe("noProject");

    expect(window.__nputerShellHarness, "the shell harness must not exist under Tauri").toBe(
      undefined,
    );
    expect(window.__nputerDocsHarness, "nor the docs harness it rides beside").toBe(undefined);
  });

  it("stays undefined after the picker and a status both run", async () => {
    const store = await loadStore("tauri");
    await store.startDocsWatcher();
    // Every other entry point the store has: none of them installs it.
    await store.pickProjectFolder();
    await store.pickGenesisFolder();
    await store.startGenesisHere();
    await store.runIndexRepo();
    store.keepCurrentProject();
    expect(window.__nputerShellHarness).toBe(undefined);
  });
});

describe("the gate, positive half: the browser DEV path installs it", () => {
  /**
   * T-050 CHANGED THIS TEST'S NAME AND ITS ONE ARRAY, and nothing else
   * in this file. The harness gained a FOURTH door,
   * `applyStartupFailure`, because T-050 added a state the SHIPPED app
   * can reach and a served bundle provably cannot — a browser awaits
   * neither `listen` nor `invoke`, so its startup cannot fail — which is
   * the exact hole T-041 exists to close. The assertion keeps its shape
   * and its strength: an EXACT key set, so a fifth door still reds here.
   * It is strengthened rather than loosened — every door must also BE a
   * function, which the old form never checked.
   */
  it("exposes exactly applyProjectStatus / applyPickOutcome / applyStartupFailure / getShell", async () => {
    const store = await loadStore("browser");
    expect(store.isTauriRuntime()).toBe(false);
    await store.startDocsWatcher();

    const harness = window.__nputerShellHarness;
    expect(harness, "the browser DEV bundle must expose the shell harness").toBeDefined();
    expect(Object.keys(harness ?? {}).sort()).toEqual([
      "applyPickOutcome",
      "applyProjectStatus",
      "applyStartupFailure",
      "getShell",
    ]);
    expect(
      Object.values(harness ?? {}).map((door) => typeof door),
      "every door is callable — a key that is not a function is not a door",
    ).toEqual(["function", "function", "function", "function"]);
    // getShell reports the PHASE (criterion 2) — a spec asserts on this,
    // not on a selector that could match a different screen.
    expect(harness?.getShell().phase).toBe("browser");
    expect(harness?.getShell().screen).toBe("browser");
  });

  it("drives the shell's OWN state — the store's public read sees every move", async () => {
    const store = await loadStore("browser");
    await store.startDocsWatcher();
    const harness = window.__nputerShellHarness;
    expect(harness).toBeDefined();

    const seen: string[] = [];
    const unsubscribe = store.subscribeShell(() => seen.push(store.getShellState().phase));

    const probe = { roadmap: false, tasks: false, architecture: true, git: true };
    harness?.applyProjectStatus({ kind: "noDocs", projectDir: "/tmp/no-plan", probe });
    expect(store.getShellState().phase).toBe("noDocs");
    expect(store.getShellState().resolvedProbe).toEqual(probe);
    expect(harness?.getShell()).toMatchObject({
      phase: "noDocs",
      screen: "empty",
      resolvedDir: "/tmp/no-plan",
    });

    harness?.applyPickOutcome({
      kind: "genesis",
      projectDir: "/tmp/sketchpad",
      seq: 7,
    });
    expect(store.getShellState().phase).toBe("genesis");
    expect(store.getShellState().genesisDir).toBe("/tmp/sketchpad");
    expect(harness?.getShell()).toMatchObject({ phase: "genesis", screen: "genesis" });

    // The reducers are the shipped ones, identity discipline included:
    // a cancelled pick changes nothing and notifies no one.
    const before = store.getShellState();
    harness?.applyPickOutcome({ kind: "cancelled" });
    expect(store.getShellState()).toBe(before);

    unsubscribe();
    // Two applies that changed something, one that did not.
    expect(seen).toEqual(["noDocs", "genesis"]);
  });

  it("reaches every phase the shipped shell can reach", async () => {
    const store = await loadStore("browser");
    await store.startDocsWatcher();
    const harness = window.__nputerShellHarness;
    const probe = { roadmap: false, tasks: false, architecture: false, git: true };

    harness?.applyProjectStatus({ kind: "noProject" });
    expect(harness?.getShell()).toMatchObject({ phase: "noProject", screen: "empty" });

    harness?.applyProjectStatus({ kind: "noDocs", projectDir: "/tmp/a", probe });
    expect(harness?.getShell()).toMatchObject({ phase: "noDocs", screen: "empty" });

    harness?.applyPickOutcome({ kind: "noDocs", path: "/tmp/b", probe });
    expect(harness?.getShell()).toMatchObject({
      phase: "noDocs",
      screen: "empty",
      rejectedPick: { path: "/tmp/b", message: null },
    });

    harness?.applyProjectStatus({
      kind: "open",
      snapshot: {
        seq: 9,
        projectDir: "/tmp/d",
        generatedAtMs: 1,
        files: [
          {
            path: "docs/tasks/T-501-a.md",
            content: "---\nid: T-501\ntitle: A\nfeature: F-01\nstatus: planned\n---\n",
          },
        ],
      },
    });
    // PHASE and SCREEN are not the same question, which is exactly why
    // criterion 2 asks for the phase: the rejected pick from two steps
    // ago still owns the screen while the project underneath is open.
    expect(harness?.getShell()).toMatchObject({
      phase: "open",
      screen: "empty",
      docs: { seq: 9, projectDir: "/tmp/d", fileCount: 1, taskCount: 1 },
    });
    store.keepCurrentProject();
    expect(harness?.getShell()).toMatchObject({ phase: "open", screen: "board" });

    harness?.applyPickOutcome({ kind: "genesis", projectDir: "/tmp/c", seq: 12 });
    expect(harness?.getShell()).toMatchObject({ phase: "genesis", screen: "genesis" });
  });

  /**
   * The order above is not arbitrary, and the reason is a real property
   * of the shipped shell rather than a harness quirk: once a project is
   * in genesis, `applyDocsPayload` deliberately KEEPS the phase (T-026 —
   * "the pipeline lighting up must not yank the interview away"), so an
   * `open` status delivered after a genesis switch does not reach the
   * board. The harness inherits that because it calls the same function;
   * pinning it here is what makes the inheritance visible.
   */
  it("keeps genesis when docs land under it, and only `picked` leaves for the board", async () => {
    const store = await loadStore("browser");
    await store.startDocsWatcher();
    const harness = window.__nputerShellHarness;
    const snapshot = (seq: number) => ({
      seq,
      projectDir: "/tmp/sketchpad",
      generatedAtMs: 1,
      files: [{ path: "docs/ROADMAP.md", content: "# Roadmap\n\n## Backbone\n" }],
    });

    harness?.applyPickOutcome({ kind: "genesis", projectDir: "/tmp/sketchpad", seq: 4 });
    harness?.applyProjectStatus({ kind: "open", snapshot: snapshot(5) });
    expect(harness?.getShell()).toMatchObject({
      phase: "genesis",
      screen: "genesis",
      docs: { seq: 5, fileCount: 1 },
    });

    harness?.applyPickOutcome({ kind: "picked", snapshot: snapshot(6) });
    expect(harness?.getShell()).toMatchObject({ phase: "open", screen: "board" });
  });
});

describe("the gate, build half: the harness is absent from the shipped bundle", () => {
  /**
   * Reads `app/dist/`, which `npm run build` writes and .gitignore keeps
   * out of the tree — a build-output assertion by design, the shape
   * T-037 established. It FAILS LOUDLY when dist is missing rather than
   * skipping: a probe that quietly passes on an absent build is worse
   * than no probe. The house order builds before testing (CONVENTIONS
   * § Build & test; ci.yml runs `npm run build` then `npm test`).
   */
  const DIST_ASSETS = resolve("dist/assets");
  /** The file whose gate this claim is about; a bundle older than it is
   * stale evidence, not evidence. */
  const SOURCE = "src/lib/watcher-store.ts";

  function bundles(): string[] {
    let names: string[];
    try {
      names = readdirSync(DIST_ASSETS);
    } catch {
      throw new Error(
        `no build output at ${DIST_ASSETS} — run \`npm run build\` in app/ first. ` +
          "This assertion is about the SHIPPED bundle (T-041 criterion 1) and cannot " +
          "be answered without one; it does not skip.",
      );
    }
    const js = names.filter((n) => n.endsWith(".js")).map((n) => join(DIST_ASSETS, n));
    if (js.length === 0) throw new Error(`no .js assets under ${DIST_ASSETS} — run npm run build`);
    return js;
  }

  it("is not stale: the build is at least as new as the store", () => {
    const newestBundle = Math.max(...bundles().map((f) => statSync(f).mtimeMs));
    expect(
      newestBundle,
      `dist/ predates ${SOURCE} — rebuild (npm run build) before trusting the bundle grep`,
    ).toBeGreaterThanOrEqual(statSync(resolve(SOURCE)).mtimeMs);
  });

  it("carries no harness name and no harness install", () => {
    const js = bundles()
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    // Assert on booleans, never on the ~440 KB haystack: a failing
    // toContain against the bundle prints the whole bundle.
    const has = (needle: string): boolean => js.includes(needle);

    expect(has("__nputerShellHarness"), "the shell harness must not reach production").toBe(
      false,
    );
    expect(has("__nputerDocsHarness"), "nor the docs harness beside it").toBe(false);
    expect(has("__nputerEchoes"), "nor the dev echo capture").toBe(false);
    // The whole DEV block went, not just the property names: its console
    // line is the block's own fingerprint.
    expect(has("browser dev harness active"), "the DEV block itself is dropped").toBe(false);

    /**
     * T-063 (folding T-041-s4 arm 2): THE MECHANISM, not only the
     * outcome. Everything above says the harness is ABSENT; this says
     * WHY it is absent — vite statically replaced `import.meta.env.DEV`
     * before Rollup ran, so the gate was resolved at BUILD time and the
     * block was eliminated rather than left for a runtime read to skip.
     *
     * What it discriminates, stated plainly because a gate whose reach is
     * unclear gets trusted for the wrong things. It CATCHES a build that
     * stopped folding the flag — a `define` removed, a bundler swapped, a
     * shim that turns `import.meta.env` into a runtime object — after
     * which the harness would be present-but-gated rather than gone. It
     * does NOT catch the one lever T-041-s4 names: measured 2026-08-18, a
     * `NODE_ENV=development npm run build` bundle carries
     * `__nputerShellHarness` and STILL contains zero `import.meta.env`,
     * because the flag was folded to `true` rather than left unfolded.
     * That lever is the assertion four lines up, which is exactly why the
     * two belong side by side. `import.meta.env` rather than bare
     * `import.meta`: `import.meta.url` is legitimate and a dependency may
     * ship it, so the narrower needle is the one that cannot false-red.
     */
    expect(
      has("import.meta.env"),
      "vite folded every DEV flag at build time — none was left to a runtime read",
    ).toBe(false);

    // Control: this IS the bundle that contains the store, so the two
    // absences above are about the gate and not about a bundle that
    // happens to be missing the module entirely.
    expect(has("no project open —"), "the store's shipped strings are present").toBe(true);
    expect(has("model-updated"), "the store's Tauri echo channel is present").toBe(true);
  });
});
