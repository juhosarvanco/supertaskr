import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * T-051 — THE WINDOW MANIFEST, and the one thing about it that is
 * cheaper to catch here than anywhere else.
 *
 * `app/src-tauri/tauri.conf.json`'s window block deserializes into
 * tauri-utils' `WindowConfig`, which is
 * `#[serde(rename_all = "camelCase", deny_unknown_fields)]`. A misspelled
 * or kebab-cased key is therefore not ignored — it is a HARD config parse
 * failure, and the app does not launch at all. That is precisely T-040's
 * class: a one-line manifest regression that every `cargo test`, `cargo
 * build` and full suite is perfectly happy with. The BOOT GATE
 * (CONVENTIONS) is the instrument that actually catches it; this file is
 * the cheap one that runs on every `npm test`.
 *
 * NOTHING HERE ASSERTS A SIZE AGAINST A NUMBER WRITTEN IN THIS FILE.
 * The one assertion about a size compares the manifest against the
 * SHIPPED STYLESHEET — two independently produced artifacts on disk — so
 * it cannot pass by agreeing with itself. The measurements at those
 * sizes live where layout is real: `tools/e2e/tests/window-contract.spec.ts`.
 */

interface WindowBlock {
  title: string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
}

const MANIFEST = resolve("src-tauri/tauri.conf.json");

function windowBlock(): Record<string, unknown> {
  const raw = JSON.parse(readFileSync(MANIFEST, "utf8")) as {
    app?: { windows?: Record<string, unknown>[] };
  };
  const windows = raw.app?.windows;
  expect(windows, `${MANIFEST} declares no app.windows`).toBeDefined();
  expect(windows!.length, "the app opens exactly one window").toBe(1);
  return windows![0];
}

describe("the window the app opens", () => {
  it("declares exactly the keys the schema knows, and nothing else", () => {
    // `deny_unknown_fields`: an unknown key here is a launch failure, not
    // a no-op. Pinned as a SET so a rename, a typo or a kebab-cased key
    // has to be reconciled deliberately — changed, never loosened.
    expect(Object.keys(windowBlock()).sort()).toEqual(
      ["height", "minHeight", "minWidth", "title", "width"].sort(),
    );
  });

  it("declares four whole, positive logical sizes", () => {
    const win = windowBlock();
    for (const key of ["width", "height", "minWidth", "minHeight"] as const) {
      const value = win[key];
      expect(typeof value, `${key} must be a number`).toBe("number");
      expect(Number.isInteger(value), `${key} must be whole`).toBe(true);
      expect(value as number, `${key} must be positive`).toBeGreaterThan(0);
    }
  });

  it("cannot open below its own floor", () => {
    const win = windowBlock() as unknown as WindowBlock;
    expect(win.width, "the default width must clear its own minimum").toBeGreaterThanOrEqual(
      win.minWidth,
    );
    expect(win.height, "the default height must clear its own minimum").toBeGreaterThanOrEqual(
      win.minHeight,
    );
  });
});

/**
 * The link between the manifest and the screen it was raised for. T-027's
 * split renders the lens behind ONE responsive utility on
 * `genesis-pane-slot`; below that breakpoint the flagship screen shows
 * the chat alone. A window minimum below the breakpoint puts that state
 * back inside the window's legal range, which is the whole of T-051
 * criterion 2.
 *
 * Read from the BUILT stylesheet rather than from the source, for the
 * reason T-034's lens probe reads it: an unmapped utility is silently
 * dead here (index.css disables the default scales), so what a class
 * NAME says is not evidence about what the browser does.
 */
describe("the floor clears T-027's split breakpoint", () => {
  // Assembled, never written as a literal: Tailwind v4's automatic source
  // detection scans test files, so a literal utility string in here would
  // MINT the very rule this test claims to observe (T-012's recorded
  // scanner-hygiene trap, and here it would make the assertion vacuous).
  const util = (...parts: string[]): string => parts.join(":");
  const escaped = (name: string): string => "." + name.replace(/:/g, "\\:");

  function builtCss(): { css: string; newest: number } {
    const dir = resolve("dist/assets");
    let names: string[];
    try {
      names = readdirSync(dir);
    } catch {
      throw new Error(
        `no build output at ${dir} — run \`npm run build\` in app/ first. This ` +
          "assertion is about the SHIPPED stylesheet and cannot be answered " +
          "without one; it does not skip.",
      );
    }
    const files = names.filter((n) => n.endsWith(".css")).map((n) => join(dir, n));
    expect(files.length).toBeGreaterThan(0);
    return {
      css: files.map((f) => readFileSync(f, "utf8")).join("\n"),
      newest: Math.max(...files.map((f) => statSync(f).mtimeMs)),
    };
  }

  it("the build is newer than the screen it is evidence about", () => {
    const { newest } = builtCss();
    for (const rel of ["src/components/shell/GenesisScreen.tsx", "src/styles/tokens.css"]) {
      expect(
        newest,
        `dist/ predates ${rel} — rebuild before trusting this probe`,
      ).toBeGreaterThanOrEqual(statSync(resolve(rel)).mtimeMs);
    }
  });

  /** The min-width, in CSS px, of the media query that carries the rule
   * gating the lens. Walks BACK from the rule to its enclosing `@media`,
   * so it reads the breakpoint the build actually emitted rather than a
   * breakpoint name. */
  function breakpointPx(css: string): number {
    const rule = escaped(util("lg", "flex")) + "{display:flex}";
    const at = css.indexOf(rule);
    expect(at, `the built sheet has no ${rule} rule — the lens's gate moved`).toBeGreaterThan(
      -1,
    );
    const open = css.lastIndexOf("@media", at);
    expect(open, "the gating rule is not inside a media query at all").toBeGreaterThan(-1);
    const head = css.slice(open, css.indexOf("{", open));
    const match = /min-width:\s*([0-9.]+)(rem|px)/.exec(head);
    expect(match, `could not read a min-width out of \`${head}\``).not.toBeNull();
    const value = Number(match![1]);
    if (match![2] === "px") return value;
    // rem, so the root font size decides. Nothing in the shipped sheet
    // moves it, which is asserted rather than assumed below.
    return value * 16;
  }

  it("the shipped sheet leaves the root font size alone, so rem is 16px", () => {
    const { css } = builtCss();
    const overrides = [...css.matchAll(/(?:^|})\s*(?:html|:root)[^{]*\{[^}]*?font-size:/g)];
    expect(
      overrides.map((m) => m[0].slice(0, 80)),
      "a root font-size override would change what the lg breakpoint means in px",
    ).toEqual([]);
  });

  it("minWidth is at or above the breakpoint the build emitted", () => {
    const { css } = builtCss();
    const px = breakpointPx(css);
    const win = windowBlock() as unknown as WindowBlock;
    expect(
      win.minWidth,
      `the lens is gated at ${px}px CSS in the shipped stylesheet; a minWidth ` +
        "below it lets the window be dragged into a size where T-027's split " +
        "silently renders one half (T-051 criterion 2)",
    ).toBeGreaterThanOrEqual(px);
    // …and the DEFAULT clears it too, with the lens wider than the 639px
    // T-027's plan calls the design's geometry. The chat is 640 with its
    // 1px rule inside it (border-box), so the lens gets width - 640.
    expect(win.width - 640, "the default leaves the lens the design's 639").toBeGreaterThanOrEqual(
      639,
    );
  });
});
