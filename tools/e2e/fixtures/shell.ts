import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { repoRoot } from "../preflight";
import type { DocsSnapshotPayload } from "./board";

/**
 * The shell-harness payloads (T-041). `window.__supertaskrShellHarness` is a
 * DEV-only, non-Tauri surface over the shell's own reducers — the same
 * `applyProjectStatus` / `commitPickOutcome` the Tauri path calls once a
 * command has answered — so driving it with these payloads is exactly
 * what the app does when Rust replies. Before it existed the served
 * bundle could only ever land on phase "open" (the docs harness's
 * `apply` is `applyDocsPayload`), which is why T-024's and T-026's
 * served-bundle probes could not be written.
 *
 * Structural copies, as with `board.ts`. SOURCE OF TRUTH:
 * `ProjectStatusPayload`, `PickOutcomePayload`, `PlanProbePayload` and
 * `ShellHarnessSnapshot` in app/src/lib/watcher-store.ts. tools/e2e
 * deliberately imports neither package (ADR-011 addendum), so the shapes
 * are mirrored here; a drift shows up as a spec that cannot reach the
 * phase it names, never as a silent pass.
 *
 * The wire tags below are the ones Rust CERTIFIES it emits:
 * `genesis_and_no_docs_wire_shapes_are_pinned`
 * (app/src-tauri/src/docs_watch.rs) asserts the serialized JSON for
 * `PickOutcome::Genesis`, `PickOutcome::NoDocs` and
 * `ProjectStatus::NoDocs` literally, probe field for probe field. What
 * nothing compares today is that pin against this mirror — recorded as
 * T-041-s2 rather than papered over: the lane proves the SHELL handles
 * these payloads, not that Rust is still the thing that sends them.
 */

export interface PlanProbePayload {
  roadmap: boolean;
  tasks: boolean;
  architecture: boolean;
  git: boolean;
}

export type ProjectStatusPayload =
  | { kind: "noProject" }
  | { kind: "noDocs"; projectDir: string; probe: PlanProbePayload }
  | { kind: "open"; snapshot: DocsSnapshotPayload };

export type PickOutcomePayload =
  | { kind: "cancelled" }
  | { kind: "busy" }
  | { kind: "noDocs"; path: string; probe: PlanProbePayload }
  | { kind: "error"; path: string; message: string }
  | { kind: "picked"; snapshot: DocsSnapshotPayload }
  | { kind: "genesis"; projectDir: string; seq: number; probe: PlanProbePayload };

/** T-050: which of the two startup awaits refused. */
export type StartupStep = "subscribe" | "snapshot";

/** What `getShell()` answers — the shell's own PHASE first, so a spec
 * asserts on the phase rather than on a selector that could pass on a
 * different screen. */
export interface ShellHarnessSnapshot {
  phase: "loading" | "browser" | "noProject" | "noDocs" | "genesis" | "open";
  screen: "loading" | "startupFailed" | "browser" | "empty" | "genesis" | "board";
  resolvedDir: string | null;
  resolvedProbe: PlanProbePayload | null;
  genesisDir: string | null;
  rejectedPick: { path: string; message: string | null } | null;
  picking: boolean;
  /** T-050: the startup attempt's own state. `startupFailed` is a SCREEN
   * with no phase of its own — it rides "loading" in the shipped app and
   * "browser" in a served bundle, which is exactly why `expectPhase`
   * takes both and a spec about it asserts on this field too. */
  starting: boolean;
  startupFailure: { step: StartupStep; message: string; attempt: number } | null;
  indexing: boolean;
  docs: {
    seq: number;
    projectDir: string;
    fileCount: number;
    taskCount: number;
    featureCount: number;
    failureCount: number;
  };
}

/** Nothing found — four ○ rows on the front door's checklist. */
export const NOTHING_FOUND: PlanProbePayload = {
  roadmap: false,
  tasks: false,
  architecture: false,
  git: false,
};

/**
 * A folder with docs/ARCHITECTURE.md and a .git, but no plan — the shape
 * that makes the card's marks worth measuring, since two rows answer ○
 * and two answer ✓ off the SAME probe. (T-026's probe: `has_plan =
 * roadmap || tasks`, so this folder is genesis-eligible.)
 */
export const ARCHITECTURE_AND_GIT: PlanProbePayload = {
  roadmap: false,
  tasks: false,
  architecture: true,
  git: true,
};

// ---- T-024's dry-run tree, read from where T-024 landed it -------------

/**
 * `app/test/fixtures/genesis/streak/docs` — the T-023 dry-run tree,
 * harvested byte-faithfully at T-024 (12 files, 343 `.md` lines, its
 * NORTH_STAR/ROADMAP byte-identical to T-023's certified quotes). The
 * lane reads the REAL fixture rather than carrying a copy: a copy would
 * make "the genesis screen renders T-024's lens with the streak fixture"
 * true of something else, and would silently rot the day the fixture
 * moves. Reading files is not importing a package — tools/e2e still
 * imports neither (ADR-011 addendum).
 */
const STREAK_DOCS = path.join(
  repoRoot,
  "app",
  "test",
  "fixtures",
  "genesis",
  "streak",
  "docs",
);

function walk(dir: string, prefix: string): { path: string; content: string }[] {
  const out: { path: string; content: string }[] = [];
  for (const name of readdirSync(dir).sort()) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, `${prefix}/${name}`));
    else out.push({ path: `${prefix}/${name}`, content: readFileSync(full, "utf8") });
  }
  return out;
}

/** The streak tree as one snapshot payload. Fails loudly, naming the
 * fixture, if T-024's tree is not where it landed (criterion 4's rule:
 * a lane that cannot run says why — it never skips). */
export function streakFixture(seq: number, projectDir = "/e2e/streak"): DocsSnapshotPayload {
  let files: { path: string; content: string }[];
  try {
    files = walk(STREAK_DOCS, "docs");
  } catch (err) {
    throw new Error(
      `cannot read T-024's dry-run fixture at ${STREAK_DOCS} (${String(err)}) — ` +
        "this spec renders THAT tree through the genesis lens; it does not " +
        "substitute a copy and it does not skip.",
    );
  }
  if (files.length !== 9) {
    throw new Error(
      `expected 9 markdown files under ${STREAK_DOCS}, found ${files.length} — ` +
        "the streak fixture moved; the pane's file count assertion is about " +
        "T-024's harvested tree, so reconcile rather than loosen.",
    );
  }
  return { seq, projectDir, generatedAtMs: 1_755_400_000_000 + seq, files };
}

/**
 * The same tree ONE TURN BEFORE DECOMPOSITION — everything except
 * `docs/tasks/`. Six files.
 *
 * T-028 needs it because the crescendo switches the interview's right
 * half from T-024's lens to the REAL board the moment a task file
 * parses: the full streak tree is a FINISHED plan, so it no longer
 * renders the lens at all. Specs whose subject is the LENS take this
 * tree; specs whose subject is the BOARD take `streakFixture`. Nothing
 * is lost either way — the state each spec describes is now nameable,
 * which it was not while one tree had to stand for both.
 *
 * The subtraction is CHECKED rather than assumed, in the same spirit as
 * the file-count guard above: a fixture that stops carrying exactly
 * three task files fails LOUDLY here instead of quietly changing what
 * the lens specs mean.
 */
export function streakMidInterview(seq: number, projectDir = "/e2e/streak"): DocsSnapshotPayload {
  const full = streakFixture(seq, projectDir);
  const files = full.files.filter((f) => !f.path.startsWith("docs/tasks/"));
  if (full.files.length - files.length !== 3) {
    throw new Error(
      `expected exactly 3 files under docs/tasks/ in the streak fixture, found ` +
        `${full.files.length - files.length} — reconcile the lens specs' counts ` +
        "rather than loosening them.",
    );
  }
  return { ...full, files };
}
