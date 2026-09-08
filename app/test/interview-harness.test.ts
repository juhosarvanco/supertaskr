// @vitest-environment jsdom
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * T-027's DEV gate, looked at explicitly rather than inherited.
 *
 * `window.__supertaskrInterviewHarness` is a test surface over the
 * interview's state; it must not exist anywhere a user's app can reach
 * it, and "it is written the same way as the one next door" is not
 * evidence of that. This file is `test/shell-harness.test.ts`'s protocol
 * applied to the second gate, because a second dev-gated window property
 * is a second gate to AUDIT — that is its whole cost, and this is the
 * payment.
 *
 *   RUNTIME half — under a Tauri runtime the block never runs, however
 *   the bundle was built. Driven by flipping `__TAURI_INTERNALS__` and
 *   re-importing (the module decides `isTauri` at load), then running
 *   the real `startInterviewSource()` to completion, with a POSITIVE
 *   CONTROL first so "absent" cannot pass for the boring reason that
 *   nothing ran.
 *
 *   BUILD half — in a production build vite replaces
 *   `import.meta.env.DEV` with `false`, so Rollup drops the block and
 *   nothing can install the harness even in a plain browser. Measured
 *   against the SHIPPED `dist/assets/*.js`, with in-bundle controls and
 *   T-037's staleness guard.
 *
 * The positive half is here too, because a gate that fences off nothing
 * is also a failure.
 */

const ipc = vi.hoisted(() => ({
  invoke: vi.fn(),
  listen: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (command: string) => {
    ipc.invoke(command);
    return Promise.resolve({
      phase: "idle",
      projectDir: "/tmp/p",
      turn: 0,
      nativeSessionId: null,
      cliVersion: null,
      methodVersion: "0.1.5",
      lastError: null,
      lastEventAtMs: null,
    });
  },
}));
vi.mock("@tauri-apps/api/event", () => ({
  emit: () => Promise.resolve(),
  listen: (name: string) => {
    ipc.listen(name);
    return Promise.resolve(() => {});
  },
}));

type SourceModule = typeof import("../src/genesis/interview-source");

const TAURI = "__TAURI_INTERNALS__";

/** Load a FRESH copy of the source with the runtime flag set as asked —
 * `isTauri` is decided once at module load, so this is the only honest
 * way to exercise both branches in one file. */
async function loadSource(runtime: "tauri" | "browser"): Promise<SourceModule> {
  vi.resetModules();
  const w = window as unknown as Record<string, unknown>;
  if (runtime === "tauri") w[TAURI] = {};
  else delete w[TAURI];
  return import("../src/genesis/interview-source");
}

beforeEach(() => {
  ipc.invoke.mockClear();
  ipc.listen.mockClear();
  delete window.__supertaskrInterviewHarness;
});

afterEach(() => {
  delete (window as unknown as Record<string, unknown>)[TAURI];
  delete window.__supertaskrInterviewHarness;
});

describe("the gate, runtime half: a Tauri runtime never defines the harness", () => {
  it("startInterviewSource takes the IPC path and installs nothing on window", async () => {
    const source = await loadSource("tauri");
    await source.startInterviewSource();

    // POSITIVE CONTROL FIRST: it really went down the IPC path.
    // Otherwise "no harness" would be true for the boring reason that
    // nothing ran at all.
    expect(ipc.listen, "the real channel was subscribed").toHaveBeenCalledWith("genesis-turn");
    expect(ipc.invoke, "and the mount-time status was pulled").toHaveBeenCalledWith(
      "genesis_status",
    );

    expect(
      window.__supertaskrInterviewHarness,
      "the interview harness must not exist under Tauri",
    ).toBe(undefined);
  });

  it("stays undefined after every other entry point this module has", async () => {
    const source = await loadSource("tauri");
    await source.startInterviewSource();
    await source.startInterview("/tmp/p");
    await source.sendAnswer("an answer");
    await source.retryTurn("/tmp/p", 1);
    source.cancelTurn();
    expect(window.__supertaskrInterviewHarness).toBe(undefined);
  });
});

describe("the gate, positive half: the browser DEV path installs it", () => {
  it("exposes exactly seven doors, every one callable", async () => {
    const source = await loadSource("browser");
    await source.startInterviewSource();

    const harness = window.__supertaskrInterviewHarness;
    expect(harness, "the browser DEV bundle must expose the interview harness").toBeDefined();
    // An EXACT key set, so an eighth door reds here — the shape
    // `shell-harness.test.ts` settled on after T-050 added a fourth.
    //
    // T-029 adds two, and both reach states a browser CANNOT otherwise
    // produce: `listenerFailed` (there is no `listen` to refuse) and
    // `rehydrate` (there is no `.supertaskr/` to read). Same argument
    // `recordStartupFailure` made for T-050's screen — the lane drives
    // the shipped field on the shipped state rather than an imitation.
    expect(Object.keys(harness ?? {}).sort()).toEqual([
      "get",
      "listenerFailed",
      "outcome",
      "push",
      "rehydrate",
      "sent",
      "status",
    ]);
    expect(
      Object.values(harness ?? {}).map((door) => typeof door),
      "every door is callable — a key that is not a function is not a door",
    ).toEqual(Array(7).fill("function"));
    // The browser path never reaches the boundary at all.
    expect(ipc.listen).not.toHaveBeenCalled();
    expect(ipc.invoke).not.toHaveBeenCalled();
  });

  it("folds events through THE SHIPPED reducer, identity discipline included", async () => {
    const source = await loadSource("browser");
    await source.startInterviewSource();
    const harness = window.__supertaskrInterviewHarness!;

    harness.push({ kind: "started", seq: 1, turn: 1 });
    harness.push({ kind: "textDelta", seq: 2, turn: 1, text: "Who feels " });
    harness.push({ kind: "textDelta", seq: 3, turn: 1, text: "the pain first?" });
    expect(harness.get().turns).toHaveLength(1);
    expect(harness.get().turns[0]?.text).toBe("Who feels the pain first?");
    expect(harness.get().phase).toBe("running");

    // The stale-drop contract is the STORE's, not a copy of it: a
    // duplicate seq comes back BY IDENTITY, which is what stops a
    // re-delivered event from re-rendering the chat.
    const before = harness.get();
    harness.push({ kind: "textDelta", seq: 3, turn: 1, text: "DUPLICATE" });
    expect(harness.get(), "identity, not deep equality").toBe(before);

    harness.push({
      kind: "completed",
      seq: 4,
      turn: 1,
      text: "Who feels the pain first?",
      truncatedRelay: false,
    });
    expect(harness.get().phase).toBe("idle");
    expect(harness.get().turns[0]?.status).toBe("completed");
  });

  it("the status door reaches the mount-time state the auto-start keys off", async () => {
    const source = await loadSource("browser");
    await source.startInterviewSource();
    const harness = window.__supertaskrInterviewHarness!;
    // Before it, the screen cannot know whether an interview is running,
    // so it must not start one.
    expect(harness.get().methodVersion).toBeNull();
    harness.status({
      phase: "idle",
      projectDir: "/tmp/p",
      turn: 0,
      nativeSessionId: null,
      cliVersion: "2.1.226 (Claude Code)",
      methodVersion: "0.1.5",
      lastError: null,
      lastEventAtMs: null,
    });
    expect(harness.get().methodVersion).toBe("0.1.5");
    expect(harness.get().cliVersion).toBe("2.1.226 (Claude Code)");
  });

  /**
   * THE SEND LEDGER, and why it exists at all.
   *
   * `sendGenesisTurn` returns before `invoke` on a non-Tauri runtime, so
   * a served bundle can prove a keystroke was CLAIMED but never that it
   * reached a command. Without this door the lane's "a real ⏎ sends the
   * typed text" assertion would be satisfied by a screen that quietly
   * dropped every answer. It is the cheapest of T-049-s1's three
   * remedies, scoped to this one screen.
   */
  it("records what the UI asked to send, in order, with the typed text", async () => {
    const source = await loadSource("browser");
    await source.startInterviewSource();
    const harness = window.__supertaskrInterviewHarness!;
    expect(harness.sent()).toEqual([]);
    await source.sendAnswer("Solo builders running agent CLIs.");
    await source.sendAnswer("skip");
    expect(harness.sent()).toEqual(["Solo builders running agent CLIs.", "skip"]);
    // A copy, not the ledger itself — a lane cannot corrupt the evidence.
    const first = harness.sent() as string[];
    first.push("forged");
    expect(harness.sent()).toHaveLength(2);
  });
});

describe("the two gates are the same gate, written the same way", () => {
  /**
   * A second dev-gated window property is a second gate to audit, and
   * T-041 argued for having one. The cost is paid by making the two
   * indistinguishable: the same two conditions, in the same nesting, in
   * the same order. A source-level assertion is the right instrument
   * here precisely because the RUNTIME behaviour is already covered
   * above — what this adds is that the two gates cannot DRIFT.
   */
  const gateOf = (file: string, property: string): { source: string; at: number } => {
    const source = readFileSync(resolve(file), "utf8");
    const at = source.indexOf(property);
    expect(at, `${file} must install ${property}`).toBeGreaterThan(-1);
    return { source, at };
  };

  it("both harnesses sit behind !isTauri AND import.meta.env.DEV, in that nesting", () => {
    for (const [file, property] of [
      ["src/lib/watcher-store.ts", "window.__supertaskrShellHarness ="],
      ["src/genesis/interview-source.ts", "window.__supertaskrInterviewHarness ="],
    ] as const) {
      const { source, at } = gateOf(file, property);
      // Search BACKWARDS from the install site: both files use
      // `import.meta.env.DEV` elsewhere, and the question is which gates
      // enclose THIS statement, not which appear first in the file.
      const runtimeGate = source.lastIndexOf("if (!isTauri)", at);
      const buildGate = source.lastIndexOf("if (import.meta.env.DEV)", at);
      expect(runtimeGate, `${file}: the runtime gate encloses the install`).toBeGreaterThan(-1);
      expect(buildGate, `${file}: the build gate encloses the install`).toBeGreaterThan(-1);
      // Runtime gate opens first, build gate inside it, install inside
      // both — the shape `runStartup` established.
      expect(runtimeGate, `${file}: runtime gate is the outer one`).toBeLessThan(buildGate);
      expect(buildGate, `${file}: the install is inside both`).toBeLessThan(at);
    }
  });
});

describe("the gate, build half: the harness is absent from the shipped bundle", () => {
  /**
   * Reads `app/dist/`, which `npm run build` writes and .gitignore keeps
   * out of the tree — a build-output assertion by design, the shape
   * T-037 established and T-041 reused. It FAILS LOUDLY when dist is
   * missing rather than skipping: a probe that quietly passes on an
   * absent build is worse than no probe.
   */
  const DIST_ASSETS = resolve("dist/assets");
  /** The file whose gate this claim is about; a bundle older than it is
   * stale evidence, not evidence. */
  const SOURCE = "src/genesis/interview-source.ts";

  function bundles(): string[] {
    let names: string[];
    try {
      names = readdirSync(DIST_ASSETS);
    } catch {
      throw new Error(
        `no build output at ${DIST_ASSETS} — run \`npm run build\` in app/ first. ` +
          "This assertion is about the SHIPPED bundle (T-027 §8) and cannot be " +
          "answered without one; it does not skip.",
      );
    }
    const js = names.filter((n) => n.endsWith(".js")).map((n) => join(DIST_ASSETS, n));
    if (js.length === 0) throw new Error(`no .js assets under ${DIST_ASSETS} — run npm run build`);
    return js;
  }

  it("is not stale: the build is at least as new as the source", () => {
    const newestBundle = Math.max(...bundles().map((f) => statSync(f).mtimeMs));
    expect(
      newestBundle,
      `dist/ predates ${SOURCE} — rebuild (npm run build) before trusting the bundle grep`,
    ).toBeGreaterThanOrEqual(statSync(resolve(SOURCE)).mtimeMs);
  });

  it("carries no harness name and no harness install, with controls proving it is the right bundle", () => {
    const js = bundles()
      .map((f) => readFileSync(f, "utf8"))
      .join("\n");
    // Assert on BOOLEANS, never on the ~470 KB haystack: a failing
    // toContain against the bundle prints the whole bundle.
    const has = (needle: string): boolean => js.includes(needle);

    expect(has("__supertaskrInterviewHarness"), "the interview harness must not ship").toBe(false);
    // The whole DEV block went, not just the property name: its console
    // line is the block's own fingerprint.
    expect(has("interview harness active"), "the DEV block itself is dropped").toBe(false);
    // Its two neighbours are still fenced too — this task must not have
    // loosened the gate it copied.
    expect(has("__supertaskrShellHarness")).toBe(false);
    expect(has("__supertaskrDocsHarness")).toBe(false);

    // CONTROLS, in the same file: this IS the bundle that contains the
    // interview, so the absences above are about the gate and not about
    // a bundle that happens to be missing the module entirely.
    expect(has("planning interview"), "the chat's own strings are present").toBe(true);
    expect(has("planner · pushing back"), "the challenge label ships").toBe(true);
    expect(has("one question at a time"), "the chat's own sentence ships").toBe(true);
    expect(has("genesis-turn"), "the real event channel ships").toBe(true);

    // T-172 — @human's two rulings from the 2026-08-30 genesis walk, in
    // the shipped bundle rather than only in the DOM. Both are NEGATIVE,
    // and each has its positive control named beside it, because a bare
    // "not present" is satisfied equally by a bundle that lost the whole
    // module.
    //
    // (1) *"this is unnecessary -> one question at a time · 6 of 7"*.
    // THE NEEDLE IS THE COUNT'S OWN PREFIX, NOT THE BARE PHRASE, and the
    // `"the chat's own sentence ships"` control above is why: the chat's
    // not-started paragraph says "The planner asks one question at a
    // time…" and still ships, so the bare phrase can never go `false`
    // here, and its `true` is what proves this `false` is about the
    // FOOTER's own spelling rather than about a bundle that lost the
    // module. Measured at fbeac77 before the change: both needles were
    // `true`.
    const footerNeedle = "one question at a time " + String.fromCharCode(0x00b7) + " ";
    expect(has(footerNeedle), "T-172: the per-message status line does not ship").toBe(false);

    // (2) *"'Bank answer' button should be just answer."* The three
    // `true` controls above are this one's positive control — this IS
    // the bundle carrying the interview, so the label's absence is a
    // rename and not a missing module. Measured at fbeac77 before the
    // change: `true`.
    expect(has("Bank answer"), "T-172: the old button label does not ship").toBe(false);
  });
});
