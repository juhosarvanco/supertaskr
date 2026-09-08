import { invoke } from "@tauri-apps/api/core";
import { emit, listen } from "@tauri-apps/api/event";
import {
  applySnapshot,
  emptyState,
  type DocsModelState,
  type DocsSnapshotPayload,
} from "./docs-model";

/**
 * Tauri glue around the pure docs-model reducer: subscribes to the Rust
 * watcher, exposes the state to React via subscribe/getState
 * (useSyncExternalStore shape), and echoes every applied snapshot back to
 * Rust as a `model-updated` event so the change -> parsed-model round trip
 * is observable on stdout (how the ≤1s criterion is measured).
 *
 * T-007 adds the shell layer around that model: which project is open
 * (none resolved at launch / a repo without docs/ / a live board), the
 * folder picker flow, and the project-switch reset. The picker never
 * sends a path — `pick_project_folder` is a zero-argument command whose
 * native dialog, validation, and watcher re-arm all live in Rust; this
 * side only receives typed outcomes.
 *
 * Outside Tauri (the vite bundle opened in a plain browser) there is no
 * IPC; in dev builds the store then exposes a window harness instead, so
 * the same bundle's DOM behavior can be driven and verified in a browser —
 * the T-001 verification precedent. The harness does not exist in
 * production builds.
 */

/** Compact summary of an applied snapshot, echoed to Rust for stdout. */
export interface ModelUpdateEcho {
  seq: number;
  appliedAtMs: number;
  generatedAtMs: number;
  taskCount: number;
  featureCount: number;
  issueCount: number;
  taskIds: string[];
  parseFailures: string[];
  /** T-018: collector skips applied with this snapshot (honest total,
   * not the clipped list) and whether the file cap truncated it — the
   * round trip's evidence that the frontend SAW the blind spots. */
  skippedTotal: number;
  truncated: boolean;
}

/** Mirror of Rust's `PlanProbe` (T-026): what the front door looked for
 * in a folder, and what it found. Booleans only — the checklist's ○/✓
 * marks are measured, and no path the user did not choose is disclosed. */
export interface PlanProbePayload {
  roadmap: boolean;
  tasks: boolean;
  architecture: boolean;
  git: boolean;
}

/** Nothing found — the honest default when no probe rode a payload. */
export const EMPTY_PROBE: PlanProbePayload = {
  roadmap: false,
  tasks: false,
  architecture: false,
  git: false,
};

/** Mirror of Rust's `ProjectStatus` (src-tauri/src/docs_watch.rs). */
export type ProjectStatusPayload =
  | { kind: "noProject" }
  | { kind: "noDocs"; projectDir: string; probe: PlanProbePayload }
  | { kind: "open"; snapshot: DocsSnapshotPayload };

/** Mirror of Rust's `PickOutcome` (src-tauri/src/docs_watch.rs). */
export type PickOutcomePayload =
  | { kind: "cancelled" }
  | { kind: "busy" }
  | { kind: "noDocs"; path: string; probe: PlanProbePayload }
  | { kind: "error"; path: string; message: string }
  | { kind: "picked"; snapshot: DocsSnapshotPayload }
  /** T-026: opened as a genesis project — no plan there yet, the watcher
   * is armed on the root sentinel, and `seq` is the switch's ordering
   * stamp (what makes late emits from the previous project provably
   * stale).
   *
   * T-042 criterion 1: `snapshot` is the folder's CURRENT docs tree when
   * it already has one — "no plan" is a weaker condition than "no docs/",
   * so a lone `docs/ARCHITECTURE.md` or a `docs/decisions/` tree is
   * genesis-eligible and the pane must render what is actually written
   * there. `null` means the folder genuinely has no docs/ yet. Rust
   * always sends the key; it is declared OPTIONAL here for the same
   * reason T-018's `skipped`/`truncated` are — a payload minted before
   * the field existed stays valid, and absent reads as "no tree", never
   * as a claim about one.
   *
   * T-064 criterion 5: `probe` IS GONE from this variant, and its
   * absence is what makes the switch tell ONE story. Rust reads the
   * folder twice — a stat sweep before the arming rendezvous, the
   * collected tree after it — and only the second reading crosses the
   * boundary, so the payload can no longer describe one folder two ways
   * at two moments. The field had no reader on this side: the genesis
   * case below sets `resolvedProbe: null`, and the genesis SCREEN
   * renders `genesisDir` plus the docs model. `PlanProbePayload` is
   * untouched and keeps both its live consumers — `noDocs` above and
   * `ProjectStatusPayload`'s `noDocs`, which are what the front door's
   * "No plan in <folder>" checklist reads. */
  | {
      kind: "genesis";
      projectDir: string;
      seq: number;
      snapshot?: DocsSnapshotPayload | null;
    };

/** Mirror of Rust's `IndexOutcome` (src-tauri/src/index_cmd.rs) —
 * T-012's zero-argument index_repo command. Volatile stats live here,
 * in session state, never in the committed graph (ADR-014). */
export type IndexOutcomePayload =
  | { kind: "noProject" }
  | { kind: "noDocs"; projectDir: string }
  | {
      kind: "indexed";
      changed: boolean;
      files: number;
      symbols: number;
      edges: number;
      truncated: boolean;
      graphBytes: number;
      durationMs: number;
      indexedAtMs: number;
    }
  | { kind: "error"; message: string };

/**
 * Where the shell is, project-wise:
 * - "loading": Tauri runtime, startup status not yet answered
 * - "browser": no Tauri IPC (plain-browser dev; harness may apply payloads)
 * - "noProject": launch resolved no repo and nothing has been picked
 * - "noDocs": launch resolved a repo (resolvedDir) that has no docs/
 * - "genesis": a folder with no plan is open for an interview (T-026);
 *   the docs model still tracks whatever lands, so the pipeline lighting
 *   up does NOT yank the screen away mid-interview
 * - "open": a project is open; `docs` holds its live model
 */
export type ShellPhase =
  | "loading"
  | "browser"
  | "noProject"
  | "noDocs"
  | "genesis"
  | "open";

/**
 * T-050: which of `startDocsWatcher`'s two awaits broke. Naming the step
 * is the difference between "startup failed" and a sentence the user can
 * act on — and the two are genuinely different situations: a refused
 * SUBSCRIBE leaves no live watcher at all, while a refused SNAPSHOT
 * leaves the subscription up, so the next file change can still bring
 * the app to life on its own.
 *
 * T-063 adds a THIRD, and it is not a refusal at all: `"deadline"` is a
 * boundary call that has not come back. A HANG and a REJECTION looked
 * identical to the user and are opposite in mechanism — the latch hands
 * the SAME promise to every later caller (rightly: that is what keeps
 * React's double-effect from opening two subscriptions), so "Try again"
 * during an in-flight attempt is a no-op BY CONSTRUCTION and the screen
 * goes on saying "waiting for the first docs snapshot…", which is TRUE
 * and is exactly what @human's screenshot showed. A deadline is what
 * turns that true sentence into an actionable one.
 */
export type StartupStep = "subscribe" | "snapshot" | "deadline";

/**
 * T-063 criterion 4: how long a startup attempt may take before the app
 * says so. MEASURED, NOT GUESSED — the figures and the margin are in
 * T-063's implementation notes; the short version is here, because a
 * constant a reader cannot defend is a constant the next reader changes
 * for the wrong reason.
 *
 * MEASURED 2026-08-18 on this machine, five `npm run tauri dev` launches
 * out of a worktree of this repo (docs/ = 159 files / 2.9 MB), the first
 * of them immediately after a cold cargo build. Two figures, because
 * only one of them is the thing this constant governs:
 *
 *   THE WINDOW THIS DEADLINE COVERS — `listen("docs-changed")` plus
 *   `invoke("docs_snapshot")`, the latter including Rust's walk and read
 *   of the whole docs/ tree: 72 / 66 / 68 / 70 / 69 ms. Worst 72 ms.
 *
 *   A PADDED UPPER BOUND that additionally swallows webview boot — the
 *   `[supertaskr] window "main" created` line to the applied snapshot, which
 *   strictly CONTAINS the window above and is therefore the conservative
 *   number: 778 / 657 / 601 / 710 / 607 ms. Worst 778 ms.
 *
 * 8 s is 111x the worst measured window and 10x the worst padded bound.
 * BOTH halves of the criterion's warning are respected, and the margin
 * is deliberately lopsided towards "too long", because the two errors do
 * not cost the same: a premature failure screen is a claim the user has
 * no way to check and no way to act on, while a late one merely arrives
 * after they have already started wondering. What bounds the worst
 * HONEST case is Rust-side and known — the collector caps at 2 000 files
 * and 1 MiB each (`docs_watch.rs`) — so a repo at the file cap is ~13x
 * this one's tree, which even on a machine several times slower than
 * this one leaves single-digit seconds of headroom rather than none.
 *
 * AND THE FALSE POSITIVE IS NOT FATAL, which is what makes a bounded
 * figure acceptable at all: the raced-out attempt is NOT cancelled. It
 * keeps running behind the failure screen, and if it answers, the app
 * comes up and the failure clears itself (see `runHandshake`). So the
 * cost of erring in the "too short" direction is a screen that was
 * pessimistic for a moment, not a user who has to do anything.
 */
export const STARTUP_DEADLINE_MS = 8_000;

/**
 * T-192: the bound on `index_repo`, and it is A DIFFERENT DEADLINE FROM
 * THE ONE ABOVE rather than a second spelling of it. `STARTUP_DEADLINE_MS`
 * covers the startup handshake — `listen("docs-changed")` plus the first
 * snapshot — and this covers one `index_repo` round trip. Two windows,
 * two measurements, two numbers; one constant serving both would make
 * either figure a lie about the other's work.
 *
 * WHY THE COMMAND NEEDS A BOUND AT ALL. `runIndexRepo` takes the
 * `indexing` latch synchronously, awaits the command, and releases in a
 * `finally` — and a `finally` runs when a promise SETTLES. A rejection is
 * handled (the `catch` beside it); an ABSENCE is not, because the `await`
 * never returns, so the latch is never released and the early return
 * refuses every later press. The map's "Re-index" button is
 * `disabled={indexing}` (`src/architecture/MapView.tsx`), so the cost is
 * a permanently greyed button under a hint reading "indexing…" for the
 * rest of the session, with no error anywhere. THE ONLY HONEST REPAIR IS
 * TO STOP WAITING — T-184's sentence, and this is its sibling defect.
 *
 * WHERE THE NUMBER COMES FROM, so it is derived rather than picked, and
 * IT IS NOT T-184's NUMBER. That bound is 30 s because the agent runner
 * sets `start_timeout: 30s` and `probe_timeout: 10s` in
 * `src-tauri/src/agent/runner.rs`, and a command that waits on the probe
 * must not give up before the Rust side has had its budget. `index_repo`
 * NEVER TOUCHES THE RUNNER and has no Rust-side deadline of any kind: it
 * is `spawn_blocking(run_index).await` with no timeout
 * (`src-tauri/src/lib.rs`) and `IndexOptions` carries no time field, so
 * there is no runner deadline here to sit above. Borrowing 30 s would be
 * a derivation from a subsystem this command never enters.
 *
 * What the tree DOES state about this window is the indexer's own
 * performance criterion: `crates/supertaskr-index/tests/perf.rs` asserts a
 * cold index under 1 500 ms and calls that its own "generous 3x ceiling"
 * over a 500 ms criterion. Measured here on this repository at
 * `57c1b39`, five `index --check` runs off a release build: 670 ms cold,
 * then 243 / 245 / 243 / 244 ms warm.
 *
 * 15 s is 10x the crate's own cold ceiling and 22x the worst run measured
 * here — the same ratio `STARTUP_DEADLINE_MS` above takes over its own
 * worst padded bound, and taken for the same reason. The margin is
 * deliberately lopsided towards "too long": a premature "index failed" is
 * a claim about a run that was going to succeed, while a late one merely
 * arrives after the user has started wondering.
 *
 * AND THE FALSE POSITIVE IS CHEAP, which is what makes a bounded figure
 * acceptable at all. The command's own answer carries only volatile
 * stats — the refreshed graph arrives independently, as a `docs-changed`
 * snapshot (see `runIndexRepo`) — so a raced-out run that lands anyway
 * still delivers its graph. What the bound costs is that run's counts in
 * the header hint, and nothing else.
 */
export const INDEX_ANSWER_BOUND_MS = 15_000;

/** The answer this side gives on behalf of an `index_repo` that did not
 * (T-192). `error` is already a member of `IndexOutcomePayload`, so the
 * bound needs no new outcome arm and the map's existing
 * `indexOutcome.kind === "error"` branch puts it on screen unchanged. The
 * wording follows `startupStepPhrase`'s deadline arm: about TIME, not
 * blame, because nothing was refused. */
export const UNANSWERED_INDEX_MESSAGE =
  "the indexer did not answer within 15 seconds. It has not been " +
  "refused — it may still be running, and re-indexing is safe.";

/**
 * T-063: the event that carries a startup failure to the Tauri process's
 * stdio, where a WKWebView `console.error` provably cannot reach. The
 * listener is `app.listen(STARTUP_FAILED_EVENT, …)` in
 * `app/src-tauri/src/lib.rs`, and the two strings are pinned against
 * each other by an exact-literal assertion on each side. An EVENT, not a
 * command: no new IPC surface, no new grant, and nothing here is
 * invokable.
 */
const STARTUP_FAILED_EVENT = "startup-failed";

/** A startup attempt that did not finish. `message` is a stringified
 * rejection — rendered as a TEXT NODE, never as markup. */
export interface StartupFailure {
  step: StartupStep;
  message: string;
  /** Which attempt this was (1 on the first). Makes "the retry ran and
   * failed again" distinguishable from "the retry never ran". */
  attempt: number;
}

/** A picker choice Rust rejected. message === null means "no docs/ there"
 * — the front door's "No plan in <folder>" card, whose checklist renders
 * from `probe`; otherwise it is a re-arm/dialog error explanation. */
export interface RejectedPick {
  path: string;
  message: string | null;
  probe: PlanProbePayload | null;
}

export interface ShellState {
  phase: ShellPhase;
  /** Launch-resolved project root when phase === "noDocs". */
  resolvedDir: string | null;
  /** What the launch-resolved root was probed for (T-026), when known. */
  resolvedProbe: PlanProbePayload | null;
  /** The genesis project's root when phase === "genesis" (T-026). */
  genesisDir: string | null;
  /** Last rejected pick, until dismissed or a pick succeeds. */
  rejectedPick: RejectedPick | null;
  /** Native folder dialog currently open. */
  picking: boolean;
  /** T-050: a startup attempt is in flight (single-flight like
   * `picking`, and for the same reason — the retry affordance must not
   * stack attempts). */
  starting: boolean;
  /** T-050: why the last startup attempt failed, or null while one is
   * running / after one has succeeded. This is the whole of layer 2:
   * the rejection used to become an unhandled promise and nothing else,
   * so the user was told nothing. */
  startupFailure: StartupFailure | null;
  /**
   * T-064, closing T-063-s3: was a live `docs-changed` subscription
   * still attached when `startupFailure` was recorded?
   *
   * THE SECOND FACT ABOUT THE SUBSCRIPTION THIS SHELL NOW HOLDS, and it
   * is here because the alternative is a sentence that is false in a
   * state this repo pins GREEN on purpose. `startupStepPhrase`'s
   * subscribe copy says "the watcher subscription was refused, so no
   * file change can reach the board." The first clause is always true.
   * The second is false whenever a refused RE-subscribe leaves attempt
   * 1's subscription attached — the state
   * `a refused re-subscribe does not tear down the subscription that
   * still works` exists to protect, because turning a live watcher into
   * no watcher in the name of retrying is strictly worse than doing
   * nothing. The user is then told the app cannot recover on its own
   * while the next file change will in fact bring it up.
   *
   * WRITTEN BY THE SAME `setShell` THAT RECORDS THE FAILURE, from the
   * store's own `unlistenDocs` handle — which is the fact, not a second
   * copy of it — and MEANINGFUL ONLY WHILE `startupFailure` IS NON-NULL.
   * It is read by exactly one thing: the fork in that sentence's second
   * clause.
   */
  watcherLive: boolean;
  /** index_repo in flight (T-012; single-flight like `picking`). */
  indexing: boolean;
  /** Last index_repo outcome THIS SESSION (drives the map header hint —
   * rendered from this state, never from the committed file; null until
   * an in-session index runs). Session-ephemeral by design. */
  indexOutcome: IndexOutcomePayload | null;
  /** T-003 docs model of the open project. */
  docs: DocsModelState;
}

// ---- pure helpers (unit-tested in test/watcher-store.test.ts) ----------

/**
 * Reset for a project switch: forget the previous project's model,
 * last-good contents, and failures — same-named paths in the new project
 * must NEVER fall back to another project's content — but KEEP the seq
 * watermark. The Rust seq counter is global and monotonic across
 * switches, so any late delivery from the previous project carries a seq
 * at or below the watermark and drops as stale.
 */
export function resetDocsForProjectSwitch(prev: DocsModelState): DocsModelState {
  return { ...emptyState(), seq: prev.seq };
}

/**
 * The measurement a docs payload ANNOUNCES: WHICH folder was read, the
 * ordering stamp Rust drew BEFORE reading it, and when that reading
 * FINISHED — `null` where no collection produced one (a genesis switch
 * onto a folder with no docs/ yet). A `DocsSnapshotPayload` IS one of
 * these structurally, which is what lets an emit, the startup pull and a
 * pick reply all be asked the same question by `readingIsOvertaken`
 * below.
 */
interface SnapshotReading {
  projectDir: string;
  seq: number;
  generatedAtMs: number | null;
}

/**
 * HAS THIS READING ALREADY BEEN OVERTAKEN? — THE ONE PLACE THE QUESTION
 * IS ANSWERED, for every path that applies a docs payload.
 *
 * WHAT "OVERTAKEN" MEANS, IN THE TWO STAMPS RUST SENDS, AND WHY ONE OF
 * THEM IS NOT ENOUGH. `WatchState::next_seq` draws BEFORE the collect on
 * every path, so `seq` dates the START of a collection and never its
 * content; `snapshot_from` stamps `generated_at_ms` from `now_ms()`
 * AFTER the walk returns, so `generatedAtMs` dates the reading itself.
 * The two can disagree whenever two producers draw from the one global
 * counter and walk for different lengths of time: the one that drew
 * FIRST and walked LONGEST carries a LOWER seq with NEWER bytes, while
 * the one that drew later and finished earlier carries a HIGHER seq with
 * an OLDER read. Compared by seq alone the latter looks fresh, it is
 * applied, and the newer tree is discarded until the next fs event under
 * that folder — with the watermark advanced past the reading that
 * carried it. So a reading is NEWER only when BOTH stamps agree that it
 * is: its ordering stamp advanced AND its collection did not finish
 * earlier than the one the model already holds.
 *
 * THE TWO PRODUCERS THAT ACTUALLY RACE, named rather than left abstract.
 * (a) A pick or genesis REPLY against a `docs-changed` emit for the same
 * folder — Rust arms the watch on the new root BEFORE the command that
 * announces it commits and stamps (T-064, T-018-s5); see
 * `switchIsOvertaken`. (b) The startup `docs_snapshot` PULL against an
 * emit — `project_status` calls `build_snapshot(&root, state.next_seq())`
 * on a COMMAND thread while `handle_fs_batch` draws, collects and sinks
 * on the debouncer thread, so the pull can draw a seq after an emit drew
 * its own, finish its walk first, and hand `reduceDocs` a higher-seq
 * older read (T-018-s6). Two EMITS cannot overtake each other — one
 * ordered thread produces them — which is why the residual this closes
 * is narrower than T-018-s5's and is not empty.
 *
 * BOTH CONJUNCTS OF THE FIRST TEST ARE LOAD-BEARING and they answer
 * different questions. The projectDir equality answers "is this the SAME
 * folder?" — a reading of ANOTHER folder is never an overtake, however
 * old, because the model must follow the project the user opened; a
 * guard without it strands them on the folder they left. The stamp
 * comparison answers "is this reading OLDER?" — re-reading the
 * currently-open folder takes a NEW, higher seq and a NEW collection, so
 * it is not an overtake and must apply normally.
 *
 * NO COLLECTION, NO CONTENT TIME — T-018-s6. `null` (a snapshot-less
 * genesis switch) and `0` mean the same thing here and are handled the
 * same way: nothing walked a tree to produce this payload, so it carries
 * no reading time and the clock has nothing to compare. `0` is the
 * project's own tell for that (`snapshot_from` stamps `now_ms()`, which
 * is never 0 — see `outcomeCarriesSnapshot` and
 * `test/genesis-switch-truth.test.ts`), and both the dev harness and
 * pre-T-042 fixtures mint it. Read naively by `<` a zero compares as
 * OLDER THAN EVERYTHING, so every such payload would be dropped behind
 * any real reading; abstaining instead leaves the ordering stamp to
 * decide, which is what those payloads have always been decided on.
 *
 * THE `<` ON THE CLOCK IS STRICT, DELIBERATELY. Two collections that
 * finish inside one millisecond are not ordered by their clock at all,
 * so the seq stamp decides and the reading applies — which is what keeps
 * this from dropping a re-read of a small tree on a fast machine, and
 * what a fixture stamping one constant `generatedAtMs` across a run
 * relies on. THE RESIDUAL, STATED RATHER THAN LEFT TO BE FOUND:
 * `now_ms()` is a wall clock, so a backwards clock step can make a
 * genuinely newer reading look older and hold a tree back until the next
 * fs event under that folder. That is the SAME window an unguarded path
 * left open on EVERY overtake, entered far more rarely, and it is
 * bounded by the same recovery.
 */
function readingIsOvertaken(prev: DocsModelState, reading: SnapshotReading): boolean {
  if (prev.projectDir !== reading.projectDir) return false;
  if (reading.seq <= prev.seq) return true;
  if (reading.generatedAtMs === null || reading.generatedAtMs === 0) return false;
  return reading.generatedAtMs < prev.generatedAtMs;
}

/**
 * Apply one snapshot payload to the docs model, resetting first when the
 * payload comes from a different project root (T-007 switch). Stale or
 * duplicate payloads — including anything from a previously open project —
 * return `prev` by identity, so callers skip re-renders and echoes.
 */
export function reduceDocs(
  prev: DocsModelState,
  payload: DocsSnapshotPayload,
): DocsModelState {
  if (payload.seq <= prev.seq) return prev; // stale/duplicate: identity
  // T-018-s6: AND A HIGHER SEQ IS NOT BY ITSELF A LATER READING. The
  // line above is the T-007 stale-drop invariant and it stays FIRST and
  // unchanged, because it is the one that must hold ACROSS projects: a
  // late delivery from the folder the user just left carries a seq at or
  // below the watermark and has to return `prev` BY IDENTITY, which the
  // predicate below deliberately does not do for another folder (its
  // first conjunct answers `false` there). This second question is the
  // one `seq` cannot answer at all — the startup `docs_snapshot` pull
  // draws from the same global counter on a command thread, so it can
  // draw AFTER an emit and finish its walk BEFORE it, arriving with a
  // higher seq over older bytes. It is the SAME decision the pick
  // reply's `switchIsOvertaken` asks, asked through the same expression
  // rather than a second copy of it; `applyDocsPayload` and
  // `applyProjectStatus`'s `"open"` arm add no ordering rule of their
  // own and inherit this one by routing through here.
  if (readingIsOvertaken(prev, payload)) return prev;
  const base =
    prev.seq > 0 && payload.projectDir !== prev.projectDir
      ? resetDocsForProjectSwitch(prev)
      : prev;
  return applySnapshot(base, payload);
}

/** What criterion (c)'s message points at: the convention layout. Kept
 * verbatim from T-007 — the "No plan in <folder>" card carries it as its
 * footnote, so redesigning the state lost none of what it said. */
export const CONVENTION_HINT =
  "an supertaskr project keeps its board in docs/tasks/, decisions in docs/decisions/";

/** One row of the "No plan in <folder>" checklist (T-026): a path the
 * front door looked for, and whether it is there. */
export interface PlanChecklistRow {
  path: string;
  found: boolean;
  /** Extra clause the design gives a found row (only .git has one). */
  note?: string;
}

/** The design's checklist, marks measured from the Rust-side probe. The
 * paths are exactly what the shell looks for — the T-007 message's
 * enumeration, now itemized and answered per row. */
export function planChecklist(probe: PlanProbePayload | null): PlanChecklistRow[] {
  const p = probe ?? EMPTY_PROBE;
  return [
    { path: "docs/ROADMAP.md", found: p.roadmap },
    { path: "docs/tasks/*.md", found: p.tasks },
    { path: "docs/ARCHITECTURE.md", found: p.architecture },
    ...(p.git
      ? [{ path: ".git", found: true, note: "it is a repo, so the plan can live here" }]
      : [{ path: ".git", found: false }]),
  ];
}

/**
 * What the front door says about the folder it is looking at.
 * - "noPlan": a folder is named and has no plan — the design's "No plan
 *   in <folder>" card, with the checklist and "Start an interview here".
 * - "message": nothing is named yet (no project open), or a pick failed
 *   for a reason worth spelling out.
 */
export type FrontDoorNotice =
  | { kind: "noPlan"; path: string; probe: PlanProbePayload }
  | { kind: "message"; message: string };

/** Which screen the shell shows. Empty screens carry their notice and
 * whether "keep the current project" is a meaningful escape hatch. */
export type ScreenModel =
  | { screen: "loading" }
  /** T-050: startup rejected and the app is NOT still waiting. The
   * failure rides the screen so the renderer needs no second opinion
   * about what went wrong — and since T-064 so does `watcherLive`, for
   * the same reason: the subscribe sentence's second clause depends on
   * whether a subscription SURVIVED the refusal, which is a fact about
   * the store and not about the step. */
  | { screen: "startupFailed"; failure: StartupFailure; watcherLive: boolean }
  | { screen: "browser" }
  | { screen: "empty"; notice: FrontDoorNotice; canKeepCurrent: boolean }
  /** T-026: a genesis project is open — full-bleed, no rail (the rail
   * stays board|map, which are the panes an OPEN project has). */
  | { screen: "genesis" }
  | { screen: "board" };

export function selectScreen(shell: ShellState): ScreenModel {
  if (shell.rejectedPick !== null) {
    const { path, message, probe } = shell.rejectedPick;
    return {
      screen: "empty",
      notice:
        message === null
          ? { kind: "noPlan", path, probe: probe ?? EMPTY_PROBE }
          : {
              kind: "message",
              message: `could not open ${path || "the chosen folder"}: ${message}`,
            },
      // A genesis project is something to keep, exactly like an open one.
      canKeepCurrent: shell.phase === "open" || shell.phase === "genesis",
    };
  }
  // T-050: a startup that FAILED is not a startup that is still going,
  // and the screen must stop claiming it is waiting. Shown only while
  // nothing is open BY ANY ROUTE — "loading" and "browser" are exactly
  // the two phases a failure can survive into, because every other
  // phase is an ANSWER a completed startup (or a pick) produced. That
  // gate is what makes criterion 3's escape arrive somewhere: a
  // successful pick or interview from this very screen moves the phase
  // and the board/genesis takes over. It sits BELOW the rejected-pick
  // block deliberately — a folder the user just chose and had refused
  // is the more immediate answer, and that screen has its own ways in.
  if (
    shell.startupFailure !== null &&
    (shell.phase === "loading" || shell.phase === "browser")
  ) {
    return {
      screen: "startupFailed",
      failure: shell.startupFailure,
      watcherLive: shell.watcherLive,
    };
  }
  switch (shell.phase) {
    case "loading":
      return { screen: "loading" };
    case "browser":
      return { screen: "browser" };
    case "noProject":
      return {
        screen: "empty",
        notice: { kind: "message", message: `no project open — ${CONVENTION_HINT}` },
        canKeepCurrent: false,
      };
    case "noDocs":
      // The launch-resolved repo has no plan: the same card a rejected
      // pick shows, which is the first-launch genesis entry.
      return {
        screen: "empty",
        notice: {
          kind: "noPlan",
          path: shell.resolvedDir ?? "the resolved folder",
          probe: shell.resolvedProbe ?? EMPTY_PROBE,
        },
        canKeepCurrent: false,
      };
    case "genesis":
      return { screen: "genesis" };
    case "open":
      return { screen: "board" };
  }
}

/**
 * T-064 CRITERION 1, GENERALISED BY T-018-s5: HAS THIS SWITCH ALREADY
 * BEEN OVERTAKEN?
 *
 * Rust arms the watch on the new root BEFORE the command that announces
 * it commits and stamps — `arm_genesis` before `apply_genesis_folder`
 * (pinned by name in `docs_watch.rs`'s
 * `the_watch_is_armed_before_the_switch_commits_so_an_emit_can_overtake_the_reply`),
 * and the `Rearm` rendezvous before `open_as_project`'s commit. So a
 * `docs-changed` emit for the NEW root can reach this store before the
 * invoke reply that announced the switch. When it does, `prev.docs` is
 * already a model OF THE FOLDER THE REPLY IS ANNOUNCING, read LATER
 * than the reply's own reading.
 *
 * What the genesis case used to do with that is throw it away:
 * `resetDocsForProjectSwitch` empties the model and KEEPS the seq
 * watermark (the T-007 stale-drop invariant), and `applySnapshot` opens
 * with `if (payload.seq <= prev.seq) return prev` — so the fresher tree
 * was replaced by nothing and the pane rendered "0 files written" over a
 * docs/ that is not empty. Measured through the real reducers by T-042's
 * verifier: `emit@8 -> fileCount=3`, then `switch@7 -> fileCount=0`.
 *
 * ONE PREDICATE, BOTH BRANCHES — T-018-s5, AND WHY IT IS SPELLED ONCE.
 * This guard was `genesisSwitchIsOvertaken` and only the `"genesis"`
 * branch asked it. The `"picked"` branch — the ordinary pick, the one
 * the front door's folder picker actually runs — asked nothing: it
 * called `reduceDocs(prev.docs, outcome.snapshot)` unconditionally. The
 * overtake is DESIGNED on both paths (`open_as_project` arms before it
 * commits exactly as `apply_genesis_folder` does), so a guard on one of
 * them was an asymmetry with no argument behind it, and two spellings
 * of one rule is the T-057 failure this project names by number. WHERE
 * THE TWO CASES REALLY DIFFER IS THE SHAPE OF THE READING, NOT THE
 * RULE: a `picked` reply always carries a snapshot, a genesis switch
 * onto a folder with no docs/ yet carries none. That difference is read
 * off the outcome below; the comparison happens in one place.
 *
 * WHERE THE RULE ITSELF LIVES — T-018-s6 MOVED IT, AND THIS FUNCTION IS
 * NOW THE SWITCH'S ADAPTER ONTO IT. Everything about what "overtaken"
 * MEANS — the two stamps Rust sends and why one of them is not enough,
 * why both conjuncts are load-bearing, why the `<` on the clock is
 * strict, and what a payload with no content time means — is written
 * once on `readingIsOvertaken` above `reduceDocs`, because the startup
 * `docs_snapshot` pull asks the very same question of the very same
 * stamps and a second copy of the rule here would be the T-057 failure
 * this project names by number. What is left in THIS function is the
 * only thing that is actually about a switch: reading the announced
 * measurement off a pick outcome, whose two variants carry it
 * differently.
 */
export function switchIsOvertaken(
  prev: DocsModelState,
  outcome: Extract<PickOutcomePayload, { kind: "picked" } | { kind: "genesis" }>,
): boolean {
  // THE READING IS THE SNAPSHOT'S WHEN THERE IS ONE. Rust stamps a
  // carried snapshot with the switch's own seq, so the two are the same
  // number whenever both exist; spelling it this way covers the
  // snapshot-less genesis branch too, which had the same defect plus a
  // second one — it ASSIGNED `outcome.seq`, so an overtaking emit at a
  // higher seq was followed by the watermark going backwards.
  const reading: SnapshotReading =
    outcome.kind === "picked"
      ? {
          projectDir: outcome.snapshot.projectDir,
          seq: outcome.snapshot.seq,
          generatedAtMs: outcome.snapshot.generatedAtMs,
        }
      : {
          projectDir: outcome.projectDir,
          seq: outcome.snapshot?.seq ?? outcome.seq,
          generatedAtMs: outcome.snapshot?.generatedAtMs ?? null,
        };
  return readingIsOvertaken(prev, reading);
}

/**
 * Apply one picker outcome to the shell (T-026, pure and unit-tested —
 * the three picker commands share it). Returns `prev` BY IDENTITY when
 * nothing changed, which is criterion 6 made mechanical: a cancelled
 * dialog and a refused concurrent claim cannot touch the open project,
 * and a rejected choice only adds a notice.
 */
export function reducePickOutcome(
  prev: ShellState,
  outcome: PickOutcomePayload,
): ShellState {
  switch (outcome.kind) {
    case "cancelled":
      return prev; // criterion 6: nothing changed, nothing to show
    case "busy":
      // T-021's Rust latch refused a concurrent pick. This store's own
      // `picking` gate makes it near-unreachable from here; either way,
      // nothing changed.
      return prev;
    case "noDocs":
      return { ...prev, rejectedPick: { path: outcome.path, message: null, probe: outcome.probe } };
    case "error":
      return {
        ...prev,
        rejectedPick: { path: outcome.path, message: outcome.message, probe: null },
      };
    case "picked":
      return {
        ...prev,
        // T-018-s5: THE SAME QUESTION THE GENESIS BRANCH ASKS, asked by
        // the same predicate. `open_as_project` arms the watch on the
        // new root before it commits and stamps, so an emit for THIS
        // folder can reach the store ahead of this reply and be the
        // LATER reading. Unguarded, `reduceDocs` applied the reply on
        // its `seq` alone — and `seq` dates the START of a collection —
        // so an older read overwrote a newer tree and the watermark
        // advanced past the emit that carried it, discarding it until
        // the next fs event under that folder. A pure identity return
        // also suppresses the `model-updated` echo (`commitPickOutcome`
        // echoes on `next.docs !== before.docs`) — correctly, because
        // the emit already echoed the model it produced. The SCREEN
        // still moves: this is a switch, and the phase is what the
        // switch is FOR.
        docs: switchIsOvertaken(prev.docs, outcome)
          ? prev.docs
          : reduceDocs(prev.docs, outcome.snapshot),
        phase: "open",
        genesisDir: null,
        rejectedPick: null,
        resolvedDir: null,
        resolvedProbe: null,
      };
    case "genesis": {
      // T-064 criterion 1: THE LATER READING WINS. An emit that
      // overtook the invoke reply is a measurement of THIS folder taken
      // after the switch's own, so it is kept rather than reset away.
      // See `switchIsOvertaken` for why both conjuncts are load-bearing
      // and why the `"picked"` branch above asks the very same one; this
      // branch is a pure identity return, so it also suppresses the
      // `model-updated` echo (`commitPickOutcome` echoes on
      // `next.docs !== before.docs`) — correctly, because the emit
      // already echoed the model it produced.
      let docs: DocsModelState;
      if (switchIsOvertaken(prev.docs, outcome)) {
        docs = prev.docs;
      } else {
        // The previous project's model is cleared HERE — same-named
        // paths in the new folder must never fall back to another
        // project's content — while `resetDocsForProjectSwitch` KEEPS
        // the seq watermark and the switch's own seq advances it past
        // every pre-switch emit (the T-007 stale-drop invariant).
        const switched = resetDocsForProjectSwitch(prev.docs);
        // T-042 criterion 1: a genesis folder can already HAVE a docs/
        // (no plan is weaker than no docs/), and when it does the switch
        // carries that tree. Rust stamps the snapshot with the switch's
        // own seq, so applying it advances the watermark to exactly the
        // value the other branch sets by hand — one stamp either way.
        const snapshot = outcome.snapshot ?? null;
        docs =
          snapshot === null
            ? // T-064: `Math.max`, not an ASSIGNMENT. The watermark is
              // the T-007 stale-drop invariant and it may only ever go
              // UP; this branch used to write `outcome.seq` over it,
              // which walks it BACKWARDS whenever an applied emit is
              // already past the switch. Unreachable in production
              // today — Rust's seq counter is global and monotonic, so a
              // switch always stamps itself above every prior emit — but
              // this is a pure reducer and nothing here can see that,
              // and `applySnapshot` (the other branch) has always
              // behaved this way.
              { ...switched, seq: Math.max(switched.seq, outcome.seq) }
            : applySnapshot(switched, snapshot);
      }
      return {
        ...prev,
        docs,
        phase: "genesis",
        genesisDir: outcome.projectDir,
        rejectedPick: null,
        resolvedDir: null,
        resolvedProbe: null,
      };
    }
  }
}

/**
 * T-028: the genesis handoff — the interview's own project, on the board.
 *
 * A SCREEN CHANGE, NOT A PROJECT CHANGE, and that distinction is the
 * whole reason this is four lines of local state rather than a command.
 * The folder the interview has been writing into IS the watched project:
 * Rust armed the watcher on it at the genesis switch, every snapshot
 * since has come from it, and `applyDocsPayload` has been feeding the
 * same model the board renders. So there is nothing to open, nothing to
 * re-arm, nothing to re-read and nobody to ask. Moving the phase is the
 * entire operation — which is why criterion 3's "zero new IPC" is a
 * property of the design here and not a promise about it.
 *
 * Pure and exported for its own test (the `reducePickOutcome` idiom):
 * returns `prev` BY IDENTITY when there is nothing to hand over — a
 * phase that is not `genesis`, or a genesis project no snapshot has ever
 * been applied for, which would land the user on a board with nothing on
 * it. The rail comes back on its own: `App` renders it for screen
 * `board`, and `selectScreen` gives phase `open` exactly that.
 */
export function openBoardFromGenesis(prev: ShellState): ShellState {
  if (prev.phase !== "genesis") return prev;
  if (prev.docs.projectDir === "") return prev;
  return { ...prev, phase: "open", genesisDir: null, rejectedPick: null };
}

/**
 * T-042 criterion 3: did a REAL SNAPSHOT produce this outcome's model?
 *
 * The `model-updated` echo exists to report what the frontend PARSED out
 * of a snapshot Rust collected. The guard it used to sit behind —
 * "the docs seq advanced" — reads as provenance and is not: the genesis
 * case deliberately advances the watermark so late emits from the
 * previous project are provably stale, Rust's seq counter is global and
 * monotonic, so a switch seq is ALWAYS greater than the last emit's and
 * the guard was ALWAYS true. A snapshot-less switch echoed
 * `{"seq":7,"generatedAtMs":0,…}` — the zero timestamp being the tell
 * that no collection made it — and the app's own stdout carried a
 * model-update line for a model nothing produced (T-026-s6).
 *
 * Provenance is a property of the OUTCOME, so it is read from the
 * outcome. Exported because a rule this easy to re-break deserves its
 * own name and its own test.
 */
export function outcomeCarriesSnapshot(outcome: PickOutcomePayload): boolean {
  switch (outcome.kind) {
    case "picked":
      return true;
    case "genesis":
      // Exactly the shape that HAS a tree; `?? null` so an older payload
      // without the field reads as "no tree" rather than throwing.
      return (outcome.snapshot ?? null) !== null;
    default:
      return false;
  }
}

/**
 * What `__supertaskrShellHarness.getShell()` answers (T-041). Deliberately a
 * SUMMARY rather than `ShellState` itself: the harness is read across the
 * browser boundary (`page.evaluate` structured-clones its return value)
 * and `DocsModelState` carries two `ReadonlyMap`s, which do not survive
 * that trip. Every field here is a plain JSON value.
 *
 * `phase` is the point of the whole thing: a spec asserts on the shell's
 * OWN phase, not on a selector that could just as well match a different
 * screen. `screen` rides along so a spec can bind the two together
 * (it is exactly what `App` stamps as `data-screen`).
 */
export interface ShellHarnessSnapshot {
  phase: ShellPhase;
  screen: ScreenModel["screen"];
  resolvedDir: string | null;
  resolvedProbe: PlanProbePayload | null;
  genesisDir: string | null;
  rejectedPick: RejectedPick | null;
  picking: boolean;
  /** T-050: the startup state, so a spec can assert on the shell's own
   * account of it rather than on a selector. */
  starting: boolean;
  startupFailure: StartupFailure | null;
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

// ---- store --------------------------------------------------------------

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
    /** Dev-only browser harness (absent in Tauri and in prod builds). */
    __supertaskrDocsHarness?: {
      apply: (payload: DocsSnapshotPayload) => void;
      getState: () => DocsModelState;
    };
    /**
     * Dev-only shell harness (T-041) — absent in Tauri and in prod
     * builds, behind the SAME `!isTauri && import.meta.env.DEV` gate as
     * `__supertaskrDocsHarness` and installed in the same statement, so
     * there is one gate to audit rather than two that could drift.
     *
     * A test surface over the shell's OWN state, never new IPC: both
     * `applyProjectStatus` and `applyPickOutcome` are the very functions
     * the Tauri path calls once a command has answered — `applyPickOutcome`
     * is `commitPickOutcome`, i.e. `runPicker` minus the `invoke`. What
     * this adds is a way to hand the store the payloads Rust would have
     * sent; it adds no way to make Rust send anything, no command, and no
     * grant. In a packaged app the whole block is unreachable (isTauri)
     * and absent from the bundle (DEV).
     */
    __supertaskrShellHarness?: {
      applyProjectStatus: (status: ProjectStatusPayload) => void;
      applyPickOutcome: (outcome: PickOutcomePayload) => void;
      /** T-050: `recordStartupFailure` itself — what the store's own
       * catch calls when `listen` or `invoke` rejects. Without it the
       * served bundle cannot reach a state the shipped app CAN reach
       * (a browser never awaits either), which is precisely the hole
       * T-041 exists to close. It fakes no IPC: it hands the shell the
       * failure Rust's boundary would have produced, exactly as
       * `applyProjectStatus` hands it the status. */
      applyStartupFailure: (step: StartupStep, reason: unknown) => void;
      getShell: () => ShellHarnessSnapshot;
    };
    /** Dev-only echo capture used by the browser harness. */
    __supertaskrEchoes?: ModelUpdateEcho[];
  }
}

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

let shell: ShellState = {
  phase: isTauri ? "loading" : "browser",
  resolvedDir: null,
  resolvedProbe: null,
  genesisDir: null,
  rejectedPick: null,
  picking: false,
  starting: false,
  startupFailure: null,
  watcherLive: false,
  indexing: false,
  indexOutcome: null,
  docs: emptyState(),
};
const listeners = new Set<() => void>();

/**
 * THE STARTUP LATCH (T-050). Holds the attempt that is in flight, or the
 * one that SUCCEEDED; `null` means "nothing is running and nothing has
 * succeeded", i.e. the next call genuinely re-attempts.
 *
 * A promise, rather than the boolean it replaces, because the two
 * properties this must have pull in opposite directions and a boolean
 * set before the awaits can only have one of them:
 *
 *  - RETRYABLE. The old `started = true` sat above both awaits and was
 *    never reset anywhere, so one transient rejection stranded the app
 *    forever — every later call returned at the guard without touching
 *    the boundary. The latch is now released in the failure path, so a
 *    retry really re-subscribes.
 *  - SINGLE-FLIGHT. The old code's one virtue was that a synchronous
 *    latch made React's double-effect harmless. That survives: the
 *    assignment below is synchronous — it happens in the same turn as
 *    the call, before any await inside can resume — so a second call
 *    arriving while the first is still running gets THE SAME promise
 *    and starts no second subscription.
 *
 * Holding the promise (rather than a `"starting" | "started" | "idle"`
 * enum, the other honest shape) buys one thing the enum does not: a
 * concurrent caller can AWAIT the attempt already in progress instead of
 * returning immediately having done nothing. The retry affordance and
 * the tests both want that.
 */
let startup: Promise<void> | null = null;
/** Attempts made this session — the failure card's honest count. */
let startupAttempts = 0;

/**
 * T-063 criterion 1, AND THE PREREQUISITE FOR THE OTHER TWO HALVES OF
 * THIS CARD. `await listen(…)` resolves to an UNLISTEN FUNCTION, and the
 * store used to throw it away. Holding it is what makes a retry a
 * REPLACEMENT rather than an addition:
 *
 *  - after a refused SNAPSHOT the subscription is LIVE (that asymmetry
 *    is the whole of T-050's finding), so a retry that subscribes again
 *    without tearing the first one down leaves two handlers on one
 *    channel, and every `docs-changed` event is then reduced twice.
 *    Downstream identity guards HIDE that — the second reduction returns
 *    `prev` by seq — so it is invisible from outside and can only be
 *    caught by counting, which is what the test does.
 *  - and a raced-out attempt (criterion 5) is still running when a newer
 *    one starts. When its `listen` finally answers, its handle has to go
 *    somewhere, and "somewhere" is this variable or a leak.
 */
let unlistenDocs: (() => void) | null = null;

/**
 * Which attempt is the CURRENT one. Bumped once per `runStartup`, and
 * read by the handshake after every await to answer one question: "am I
 * still the attempt whose answers matter?" A deadline lets `runStartup`
 * settle while its boundary calls are still outstanding, so from that
 * moment on this is the only thing that separates a live attempt from a
 * ghost — and a ghost may neither write shell state nor keep a
 * subscription.
 */
let startupToken = 0;

export function subscribeShell(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getShellState(): ShellState {
  return shell;
}

export function isTauriRuntime(): boolean {
  return isTauri;
}

function setShell(patch: Partial<ShellState>): void {
  shell = { ...shell, ...patch };
  for (const callback of listeners) callback();
}

/**
 * The dev harness's read side (T-041): the live shell, flattened to
 * plain JSON. `screen` comes from the real `selectScreen`, not from a
 * second opinion about what the phase means.
 */
function shellHarnessSnapshot(): ShellHarnessSnapshot {
  return {
    phase: shell.phase,
    screen: selectScreen(shell).screen,
    resolvedDir: shell.resolvedDir,
    resolvedProbe: shell.resolvedProbe,
    genesisDir: shell.genesisDir,
    rejectedPick: shell.rejectedPick,
    picking: shell.picking,
    starting: shell.starting,
    startupFailure: shell.startupFailure,
    indexing: shell.indexing,
    docs: {
      seq: shell.docs.seq,
      projectDir: shell.docs.projectDir,
      fileCount: shell.docs.fileCount,
      taskCount: shell.docs.model.tasks.length,
      featureCount: shell.docs.model.features.length,
      failureCount: shell.docs.failures.length,
    },
  };
}

function buildEcho(next: DocsModelState): ModelUpdateEcho {
  return {
    seq: next.seq,
    appliedAtMs: Date.now(),
    generatedAtMs: next.generatedAtMs,
    taskCount: next.model.tasks.length,
    featureCount: next.model.features.length,
    issueCount: next.model.issues.length,
    taskIds: next.model.tasks.map((t) => t.id ?? "(suggested)"),
    parseFailures: next.failures.map((f) => f.path),
    skippedTotal: next.skippedTotal,
    truncated: next.truncated,
  };
}

function applyDocsPayload(payload: DocsSnapshotPayload): void {
  const next = reduceDocs(shell.docs, payload);
  if (next === shell.docs) return; // stale/duplicate: no re-render, no echo
  // A snapshot only ever describes an open project; deliberately does NOT
  // clear rejectedPick — a background update must not yank the empty
  // state away while the user is deciding what to do about a bad pick.
  //
  // T-026: nor does it yank a GENESIS project onto the board. The model
  // updates underneath (that IS the pipeline lighting up — criteria 3
  // and 4), while the screen stays where the interview is; the front
  // door's stale "no docs/ found" claim is what an emit replaces.
  setShell({ docs: next, phase: shell.phase === "genesis" ? "genesis" : "open" });
  sendEcho(next);
}

/** The `model-updated` round trip (T-003): every applied snapshot is
 * echoed back to Rust for stdout, or captured by the dev harness. */
function sendEcho(next: DocsModelState): void {
  const echo = buildEcho(next);
  if (isTauri) {
    emit("model-updated", echo).catch((err) => {
      console.error("[supertaskr] model-updated echo failed", err);
    });
  } else if (import.meta.env.DEV) {
    (window.__supertaskrEchoes ??= []).push(echo);
  }
}

function applyProjectStatus(status: ProjectStatusPayload): void {
  // T-063: A STATUS PULL MUST NOT YANK AN INTERVIEW AWAY, and until this
  // card nothing had to say so, because `docs_snapshot` was only ever
  // pulled at startup — when the phase is `loading` or `browser` and
  // there is no interview to lose. Criterion 2 pulls it again AFTER a
  // pick, and a genesis folder legitimately has no `docs/` YET, so Rust
  // answers `noDocs` about the very folder the user is interviewing in;
  // applying that would drop them on the front door's "No plan in
  // <folder>" card mid-interview. `applyDocsPayload` has held the same
  // rule since T-026 for the same reason ("the pipeline lighting up must
  // not yank the interview away"); this is that rule on the other two
  // arms of the same payload.
  if (shell.phase === "genesis" && status.kind !== "open") return;
  switch (status.kind) {
    case "open":
      applyDocsPayload(status.snapshot);
      break;
    case "noDocs":
      setShell({
        phase: "noDocs",
        resolvedDir: status.projectDir,
        resolvedProbe: status.probe,
      });
      break;
    case "noProject":
      setShell({ phase: "noProject" });
      break;
  }
}

/**
 * Record a startup attempt that did not finish (T-050). THE one place a
 * rejection becomes shell state — the store's own catch calls it, and so
 * does the dev harness, so what the lane renders is what the app
 * renders and not a second copy of it.
 */
function recordStartupFailure(step: StartupStep, reason: unknown): void {
  // THE INVARIANT, held here rather than only in the catch below: a
  // recorded failure ALWAYS means the latch is open, so the retry the
  // screen offers is never a no-op. Released BEFORE the notify, because
  // a subscriber woken by it may call `startDocsWatcher` synchronously.
  // Starting a fresh attempt in that window is safe: the catch releases
  // by IDENTITY, so a late rejection cannot unlatch the newer attempt.
  startup = null;
  // `String(reason)` is the store's existing idiom for a rejected
  // boundary call (runPicker, runIndexRepo). It is put on screen as a
  // text node; nothing from it is ever interpreted as markup.
  const failure: StartupFailure = {
    step,
    message: String(reason),
    attempt: startupAttempts,
  };
  // T-064 (T-063-s3): recorded IN THE SAME WRITE as the failure, from
  // the handle that IS the fact. A refused `listen` on attempt 2 leaves
  // attempt 1's subscription attached, and the copy must not tell the
  // user no file change can reach the board while one still can.
  setShell({
    starting: false,
    startupFailure: failure,
    watcherLive: unlistenDocs !== null,
  });
  // The message is an ARGUMENT, never interpolated into the line — the
  // same discipline as the `model-updated` echo's error log.
  console.error("[supertaskr] startup failed at", step, reason);
  // T-063: AND THE LINE ABOVE IS WHERE THIS USED TO END, which is the
  // defect the only real user report in this backlog is about. A
  // WKWebView `console.error` never reaches the Tauri process's stdout,
  // so on 2026-08-16 @human hit a startup dead end, sent a screenshot
  // AND their log, and the log was healthy through seq 22 — because the
  // one thing that broke had no way to write to it.
  //
  // The same `emit` the `model-updated` echo has used since T-003, on a
  // second channel, caught the same way: a failed emit must not become a
  // second unhandled rejection on the path whose whole subject is
  // unhandled rejections.
  if (isTauri) {
    emit(STARTUP_FAILED_EVENT, failure).catch((err) => {
      console.error("[supertaskr] startup-failed emit failed", err);
    });
  }
}

/**
 * THE BOUNDARY WORK OF ONE ATTEMPT: subscribe to `docs-changed` first,
 * then pull the startup status (the seq guard settles any ordering race
 * between the two — that order is deliberate and unchanged).
 *
 * NEVER REJECTS and never throws: every exit records what happened, or
 * deliberately records nothing because a newer attempt owns the screen.
 * It is separated from `runStartup` (T-063) because the two now have
 * different lifetimes — `runStartup` settles at the deadline, and THIS
 * keeps running afterwards. Which is the honest thing for it to do: the
 * boundary call was never cancelled, so pretending it was would be a
 * second lie on the screen that exists to stop the first one.
 *
 * `attempt` is the token this run was started with. It is re-read
 * against `startupToken` after EVERY await, and the two answers it can
 * give are both load-bearing:
 *   - still current  -> write shell state, keep the subscription;
 *   - superseded     -> write NOTHING, and unlisten anything acquired,
 *                       which is criterion 5: a raced-out attempt is
 *                       still running and must not leak a subscription.
 */
async function runHandshake(attempt: number): Promise<void> {
  let unlisten: () => void;
  try {
    unlisten = await listen<DocsSnapshotPayload>("docs-changed", (event) =>
      applyDocsPayload(event.payload),
    );
  } catch (err) {
    if (attempt === startupToken) recordStartupFailure("subscribe", err);
    return;
  }
  if (attempt !== startupToken) {
    // Superseded while the subscribe was in flight. The channel really
    // was opened — dropping the handle here is precisely the leak
    // criterion 1 exists to make answerable.
    unlisten();
    return;
  }
  // A RETRY REPLACES, IT DOES NOT STACK. After a refused SNAPSHOT the
  // previous attempt's subscription is still live, so without this the
  // second attempt would leave two handlers on one channel.
  unlistenDocs?.();
  unlistenDocs = unlisten;

  let status: ProjectStatusPayload;
  try {
    status = await invoke<ProjectStatusPayload>("docs_snapshot");
  } catch (err) {
    if (attempt === startupToken) recordStartupFailure("snapshot", err);
    return;
  }
  if (attempt !== startupToken) return;
  // `startupFailure: null` matters for exactly one interleaving: this
  // attempt already blew its deadline, the screen said so, and then the
  // boundary answered anyway. The app HAS started; saying otherwise
  // would be the same class of untruth in the opposite direction.
  setShell({ starting: false, startupFailure: null });
  applyProjectStatus(status);
}

/**
 * One startup attempt. Settles when the handshake settles OR when the
 * deadline expires, whichever is first — and the second case is the
 * whole of T-063 criterion 3.
 *
 * WHY A DEADLINE RATHER THAN A CANCELLATION. Nothing here can cancel a
 * Tauri boundary call, and nothing should pretend to: the subscribe may
 * still land. What the deadline changes is the app's ACCOUNT of itself.
 * Before it, an attempt that hung and an attempt that was refused looked
 * identical from the screen — "waiting for the first docs snapshot…",
 * true in both cases and actionable in neither — while "Try again"
 * silently did nothing, because the latch correctly hands every later
 * caller the promise already in flight. After it, the latch is released,
 * the button does what its label says, and the raced-out attempt is
 * still allowed to heal the app behind the failure screen if it comes
 * back.
 */
async function runStartup(): Promise<void> {
  startupAttempts += 1;
  const attempt = (startupToken += 1);
  // A fresh attempt: the previous failure is no longer the current
  // truth, so the screen goes back to waiting while this one runs.
  setShell({ starting: true, startupFailure: null });

  if (!isTauri) {
    if (import.meta.env.DEV) {
      window.__supertaskrDocsHarness = {
        apply: applyDocsPayload,
        getState: () => shell.docs,
      };
      // T-041: the same gate, the same statement — a served DEV bundle
      // can reach every shell phase the shipped app reaches, because it
      // is handed the payloads Rust would have sent and runs the shell's
      // own reducers on them. Nothing here is new IPC and nothing here
      // exists in a packaged app: `isTauri` fences the runtime and
      // `import.meta.env.DEV` fences the build (vite replaces it with
      // `false` for `npm run build`, so Rollup drops the whole block —
      // asserted against the built bundle in test/shell-harness.test.ts).
      //
      // T-063 (folding T-041-s4): WHY `DEV` IS FALSE FOR A BUILD, written
      // down here so the next reader does not measure it a third time.
      // Vite forces `NODE_ENV=production` for `vite build` BEFORE the
      // config loads, whenever NODE_ENV is unset — so the flag is a
      // property of the COMMAND, not of the mode. `--mode development`
      // does NOT change it: measured 2026-08-18 on this tree,
      // `npm run build` and `npx vite build --mode development` produce a
      // sha-IDENTICAL asset (index-ByWKsUIt.js, 488 805 B, sha256
      // 3aec41b1…). The ONE lever that does change it is an INHERITED
      // `NODE_ENV=development`, which yields a visibly larger bundle
      // carrying `__supertaskrShellHarness` — and `tauri.conf.json`'s
      // `beforeBuildCommand` IS `npm run build`, so a packaging run that
      // inherits it embeds this block. That is the case for having TWO
      // layers rather than one: the runtime `isTauri` guard above still
      // prevents installation inside that very bundle, and
      // test/shell-harness.test.ts reds on the next `npm test`. The
      // ci.yml arm of this (a step asserting NODE_ENV before the build)
      // is deliberately NOT here — it belongs to T-054, which owns that
      // file.
      window.__supertaskrShellHarness = {
        applyProjectStatus,
        applyPickOutcome: commitPickOutcome,
        applyStartupFailure: recordStartupFailure,
        getShell: shellHarnessSnapshot,
      };
      console.info("[supertaskr] no Tauri IPC detected — browser dev harness active");
    }
    setShell({ starting: false });
    return;
  }

  // THE RACE, written out rather than expressed as `Promise.race`,
  // because the losing side here is not discarded — it keeps running,
  // and `runHandshake`'s token checks are what govern it afterwards.
  return new Promise<void>((resolve) => {
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const settle = (): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(() => {
      // The boundary has not answered. Record it — which releases the
      // latch, so the retry the screen offers is real — and let the
      // caller go. The handshake below is untouched and still running.
      recordStartupFailure(
        "deadline",
        `no answer from the docs watcher within ${STARTUP_DEADLINE_MS} ms`,
      );
      settle();
    }, STARTUP_DEADLINE_MS);
    void runHandshake(attempt).finally(settle);
  });
}

/**
 * Start the live pipeline. Idempotent while an attempt is in flight or
 * has succeeded (StrictMode double-effects, and the retry affordance),
 * and genuinely re-attempts once one has FAILED — see the `startup`
 * latch above for why it is a promise.
 *
 * NEVER REJECTS, by contract: a failed attempt is recorded in shell
 * state and rendered, so no caller can leave an unhandled rejection
 * behind. That is layer 2 of T-050 fixed at the callee, which is the
 * only place that knows WHICH await broke.
 */
export function startDocsWatcher(): Promise<void> {
  const inFlight = startup;
  if (inFlight !== null) return inFlight;
  // THE LATCH CLOSES BEFORE THE ATTEMPT RUNS, and that order is the
  // whole guard. `runStartup`'s first act is a synchronous
  // `setShell({ starting: true })`, which NOTIFIES — so if the latch
  // were assigned from `runStartup(...)`'s return value, a subscriber
  // woken by that notify and calling back in would read a still-null
  // latch and open a SECOND subscription (measured: `listen` called
  // twice). So `attempt` is a placeholder resolved when the real work
  // settles, latched first, and the work chained onto it in the same
  // synchronous turn. A second call arriving at any point while this
  // one is in flight — re-entrant or not — gets THIS promise back.
  let finish!: () => void;
  const attempt = new Promise<void>((resolve) => {
    finish = resolve;
  });
  startup = attempt;
  void runStartup()
    .catch(() => {
      // `runStartup` already recorded which await broke and why (the
      // shell state the screen renders). All that is left here is the
      // latch, released so the NEXT call genuinely re-attempts —
      // guarded by identity so a late rejection can never unlatch a
      // newer attempt.
      if (startup === attempt) startup = null;
    })
    .finally(finish);
  return attempt;
}

/**
 * Open the native folder picker (T-007). Zero arguments cross the IPC
 * boundary; Rust owns the dialog, validation, and watcher re-arm. A
 * rejected pick surfaces as the empty state's message and never touches
 * the open project's model or watch.
 */
export async function pickProjectFolder(): Promise<void> {
  await runPicker("pick_project_folder");
}

/**
 * T-026: "Start an interview" (⌘N) — the genesis variant of the picker.
 * Zero arguments again: Rust opens the dialog, validates the choice, and
 * decides what it MEANS (a folder with no plan opens for genesis; one
 * that already has a plan opens as the normal project it is — there is
 * no overwrite path in this app).
 */
export async function pickGenesisFolder(): Promise<void> {
  await runPicker("pick_genesis_folder");
}

/**
 * T-026: "Start an interview here" — genesis in the folder the front door
 * is already naming, with no dialog. Still zero arguments: Rust knows
 * which folder that is (the user's own last dialog choice, or the open
 * project), so the path never crosses the boundary in either direction.
 */
export async function startGenesisHere(): Promise<void> {
  await runPicker("start_genesis_here");
}

/**
 * The one picker pipeline behind all three commands: single-flight
 * webview-side (the Rust latch is the real gate — T-021), invoke, then
 * the pure `reducePickOutcome`. A snapshot that lands this way is echoed
 * exactly like a watcher push (T-003's round-trip contract) — and only a
 * snapshot is: a genesis switch onto a folder with no docs/ yet carries
 * no tree, so there is nothing for it to report and it echoes nothing.
 * One onto a folder that DOES have a docs/ carries that tree and echoes
 * it like any other snapshot (T-042 criterion 3; the echo is emitted by
 * `commitPickOutcome`, which is this function minus the `invoke`).
 */
async function runPicker(command: string): Promise<void> {
  // T-192: DELIBERATELY NOT BOUNDED, and the reason is recorded here
  // because the sibling latch a few functions down IS bounded and the
  // next reader will otherwise take this for the oversight it looks like.
  //
  // **THIS ONE `await` IS THREE RUST COMMANDS, AND THEY ARE NOT ALIKE.**
  // `pick_project_folder` and `pick_genesis_folder` open a native dialog
  // and await `rx.recv()`. **`start_genesis_here` OPENS NO DIALOG** — its
  // own doc comment in `src-tauri/src/lib.rs` says so; it claims the
  // flight guard, reads `genesis_target()` out of Rust's own memory, and
  // awaits `spawn_blocking(apply_genesis_folder)`. That is `index_repo`'s
  // shape wearing this latch, with nobody being asked anything.
  //
  // SO THE HUMAN-AT-A-DIALOG ARGUMENT COVERS TWO OF THE THREE AND MUST
  // NOT BE STATED AS COVERING ALL THREE. It is true and it is not the
  // load-bearing reason. **THE REASON THAT COVERS ALL THREE IS LATCH
  // PARITY**: every one of them claims the SAME Rust latch —
  // `begin_pick()` at three sites in `lib.rs` — and Rust's `PickInFlight`
  // is the real gate (T-021), this flag only its webview mirror. A bound
  // HERE releases the mirror while Rust still holds the original, so the
  // next press reaches `begin_pick`, gets `Busy`, and `reducePickOutcome`
  // maps `busy` to `prev` BY IDENTITY: a button that silently does
  // nothing — the T-171/T-183 family this card exists to close. Bounding
  // the webview half of a two-latch pair does not shorten the wait, it
  // only desynchronises the pair.
  //
  // THE RESIDUAL, STATED RATHER THAN LEFT TO BE FOUND: because
  // `start_genesis_here` really can never answer, its latch really can
  // strand. That is an ACCEPTED residual, not a closed case — the repair
  // available at this seat is worse than the defect, and the repair that
  // is not (a Rust-side bound that releases `PickInFlight` with it) is a
  // different change in a different language. Routed in the notes.
  //
  // AND HOW THE THIRD COMMAND WAS MISSED, because the next sweep should
  // not repeat it: this card's own thesis is that the defect is decided
  // per RUST COMMAND, and the first class sweep used the `await invoke(`
  // CALL SITE as its unit — so all three counted once and the odd one
  // hid behind the shared `await`. **A sweep whose unit is coarser than
  // its thesis reports a closure it has not measured.**
  if (!isTauri || shell.picking) return;
  setShell({ picking: true });
  try {
    commitPickOutcome(await invoke<PickOutcomePayload>(command));
  } catch (err) {
    setShell({ rejectedPick: { path: "", message: String(err), probe: null } });
  } finally {
    setShell({ picking: false });
  }
}

/**
 * Apply one picker outcome to the LIVE shell: the pure reducer, then the
 * notify and echo the store owes. Split out of `runPicker` (T-041) so the
 * dev harness can drive the same code the real picker drives — everything
 * after `invoke` answers, and nothing before it. A harness with its own
 * copy of this would prove nothing about the shipped shell.
 */
function commitPickOutcome(outcome: PickOutcomePayload): void {
  const before = shell;
  const next = reducePickOutcome(before, outcome);
  if (next === before) return;
  shell = next;
  for (const callback of listeners) callback();
  // T-042 criterion 3: the echo reports what the frontend parsed out of a
  // snapshot, so it fires for a payload A REAL SNAPSHOT PRODUCED — read
  // from the outcome's own provenance, never from the seq. The seq guard
  // that used to stand here was always true for a switch (see
  // `outcomeCarriesSnapshot`), so the app's stdout carried model-update
  // lines with `generatedAtMs: 0` for models nothing had generated. The
  // identity check stays: a stale or duplicate snapshot reduces to `prev`
  // by identity and must not echo twice.
  if (next.docs !== before.docs && outcomeCarriesSnapshot(outcome)) {
    sendEcho(next.docs);
  }
  // T-063 criterion 2: AFTER A REFUSED SUBSCRIBE, THIS BOARD IS A
  // PHOTOGRAPH. T-050 put "Open a folder…" and "Start an interview" on
  // the failure screen and they work — `pick_project_folder` re-arms the
  // RUST watcher and answers a snapshot, so a real project appears. But
  // the webview never subscribed, so no `docs-changed` event has anywhere
  // to land: the user is looking at a working app that has silently
  // stopped tracking their files, which is WORSE than the honest error
  // screen they escaped from, precisely because it looks fine.
  //
  // Only after a SUBSCRIBE failure. A refused `snapshot` left the
  // subscription live (T-050's asymmetry), so that case is already
  // self-healing and re-running startup would buy nothing. The latch is
  // open because recording a failure releases it, so this is a real
  // attempt and not a no-op.
  //
  // It cannot fight the pick's own snapshot: `docs_snapshot` mints a
  // fresh seq from the same global monotonic counter the pick just used,
  // so the pull is either strictly newer (applies, one extra echo of a
  // genuinely newer tree) or dropped by `reduceDocs` BY IDENTITY, with
  // no re-render and no echo. The interleaving is pinned in
  // test/startup-recovery.test.ts rather than argued here.
  //
  // T-018-s6 CORRECTED THIS PARAGRAPH RATHER THAN DELETING IT, because
  // the conclusion was right and the REASON was not. It used to say the
  // pull was dropped "by `reduceDocs`'s SEQ guard", and the seq guard
  // cannot do that job: the pull draws from the shared counter on a
  // COMMAND thread, so it can draw after an emit and finish its walk
  // before it, arriving with a HIGHER seq over an OLDER read — which the
  // seq guard waves through. T-018-s5 measured that same conclusion to
  // be false one door over, for the pick reply. What drops the pull now
  // is `readingIsOvertaken`, which reads the content time as well.
  if (
    before.startupFailure?.step === "subscribe" &&
    (outcome.kind === "picked" || outcome.kind === "genesis")
  ) {
    void startDocsWatcher();
  }
}

/**
 * T-028's ONE CTA: leave the interview for the board it just produced.
 * The live half of `openBoardFromGenesis` — the pure reducer, the
 * identity check, the notify, and nothing else. No `invoke`, no event,
 * no boundary; a browser can run this, which is why the lane can click
 * the real button instead of simulating it.
 */
export function openGenesisBoard(): void {
  const next = openBoardFromGenesis(shell);
  if (next === shell) return;
  shell = next;
  for (const callback of listeners) callback();
}

/** Dismiss a rejected pick and return to whatever was open before. */
export function keepCurrentProject(): void {
  if (shell.rejectedPick !== null) setShell({ rejectedPick: null });
}

/**
 * Run the indexer over the open project (T-012). Zero arguments cross
 * the IPC boundary; Rust owns root resolution, containment, and the
 * atomic graph write. Single-flight (the `picking` pattern) — a raced
 * double-run would be benign anyway (byte-determinism + atomic writes,
 * T-009's concurrent-writers note), but the button should not stack
 * runs. The refreshed graph arrives on its own as a `docs-changed`
 * snapshot; an unchanged tree produces no snapshot at all (the pinned
 * loop-termination brake), which is why the outcome — not the file —
 * feeds the header hint.
 */
export async function runIndexRepo(): Promise<void> {
  if (!isTauri || shell.indexing) return;
  setShell({ indexing: true });
  // T-192: THE BOUND. The race is written out here rather than imported,
  // and that is a component-boundary answer rather than a preference —
  // see `INDEX_ANSWER_BOUND_MS` for the number and the notes on T-192 for
  // why `agent-store.ts`'s `withAnswerBound` is not imported (it would add
  // a file edge to the `C-10 -> C-14` tangle @human ruled must be
  // EXTRACTED rather than declared — C-10's own file, 2026-08-25). The
  // duplication is real and is routed, not denied.
  //
  // The loser is DISCARDED, unlike `runStartup`'s hand-written race above,
  // and the difference is what each loser HOLDS: that one is carrying a
  // live subscription and can still heal the app, so it must be governed
  // rather than dropped. This one carries volatile counts whose graph
  // arrives by another road, so dropping it costs the header hint and
  // nothing else — and dropping it is what makes a late answer unable to
  // overwrite a newer run's stats, which is T-184's stale-answer defect
  // declined rather than re-invented.
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    const outcome = await Promise.race([
      invoke<IndexOutcomePayload>("index_repo"),
      new Promise<IndexOutcomePayload>((resolve) => {
        timer = setTimeout(
          () => resolve({ kind: "error", message: UNANSWERED_INDEX_MESSAGE }),
          INDEX_ANSWER_BOUND_MS,
        );
      }),
    ]);
    setShell({ indexOutcome: outcome });
  } catch (err) {
    // A REJECTION IS NOT AN ABSENCE and still lands here unchanged, so a
    // refused index keeps reporting the refusal rather than the bound.
    setShell({ indexOutcome: { kind: "error", message: String(err) } });
  } finally {
    // Cleared on every exit — answered, unanswered or thrown. A dangling
    // fifteen-second timer per press would make the bound observable in a
    // way it should not be; the pending-timer count is asserted back to
    // its pre-call value in `startup-recovery.test.ts`.
    if (timer !== undefined) clearTimeout(timer);
    setShell({ indexing: false });
  }
}
