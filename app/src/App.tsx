import { useEffect, useState, useSyncExternalStore } from "react";
import { MapView } from "@/architecture/MapView";
import { Board } from "@/components/board/Board";
import { GenesisScreen } from "@/components/shell/GenesisScreen";
import { PaneRail, type PaneId } from "@/components/shell/PaneRail";
import { Button } from "@/components/ui/button";
import { useAccelerators } from "@/components/shell/accelerators";
import { skipReasonPhrase } from "@/lib/docs-model";
import {
  CONVENTION_HINT,
  getShellState,
  isTauriRuntime,
  keepCurrentProject,
  pickGenesisFolder,
  pickProjectFolder,
  planChecklist,
  runIndexRepo,
  selectScreen,
  startDocsWatcher,
  startGenesisHere,
  subscribeShell,
  type FrontDoorNotice,
  type PlanChecklistRow,
} from "@/lib/watcher-store";

// A live, read-only lens over the project's docs/ tree: T-003's watcher
// feeds the store; T-004's story map board renders it (home pane); T-007
// decides WHICH project is open (launch resolution + folder picker) and
// shows a friendly empty state when there is no board to show. T-006
// brings the design language. T-012 adds the pane rail (board | map) and
// the architecture map. Everything styles itself via tokens.css
// utilities.

/** Non-blocking parse-error chip (criterion 3; T-006 look — the
 * terracotta chip from the board mockup). Renders only while at least
 * one changed file fails to parse; the model below keeps showing each
 * failing file's last valid state meanwhile — the chip says so. */
function ParseErrorBadge({ failures }: { failures: ReturnType<typeof getShellState>["docs"]["failures"] }) {
  if (failures.length === 0) return null;
  // Parser issue messages already name the file; no path prefix needed.
  const detail = failures
    .map((f) => f.issues[0]?.message ?? `${f.path}: unparsable`)
    .join("\n");
  const lastValid = failures.some((f) => f.showingLastGood);
  return (
    <span
      data-testid="parse-error-badge"
      title={detail}
      className="flex items-center gap-1.75 rounded-md border border-status-rejected-border bg-status-rejected px-2.5 py-1.25 font-mono text-xs text-destructive"
    >
      {failures.length} parse error{failures.length === 1 ? "" : "s"}
      {lastValid && <span className="text-status-rejected-foreground">· last valid state</span>}
    </span>
  );
}

/** T-018 sibling of the parse-error chip, same family: files the
 * collector could not ship (oversize, non-UTF-8, too deep, over the file
 * cap, unreadable). A skipped record keeps rendering its last valid
 * state below — never a phantom deletion — and the chip says so. The
 * count is the snapshot's honest total: when the Rust report clips at
 * its cap, the number still tells the truth and the tooltip lists what
 * was reported. */
function SkippedFilesBadge({
  skipped,
  skippedTotal,
}: {
  skipped: ReturnType<typeof getShellState>["docs"]["skipped"];
  skippedTotal: number;
}) {
  if (skipped.length === 0) return null;
  const count = Math.max(skipped.length, skippedTotal);
  const detail = skipped
    .map((s) => `${s.path}: skipped — ${skipReasonPhrase(s.reason)}`)
    .concat(count > skipped.length ? [`…and ${count - skipped.length} more`] : [])
    .join("\n");
  const lastValid = skipped.some((s) => s.showingLastGood);
  return (
    <span
      data-testid="skipped-files-badge"
      title={detail}
      className="flex items-center gap-1.75 rounded-md border border-status-rejected-border bg-status-rejected px-2.5 py-1.25 font-mono text-xs text-destructive"
    >
      {count} skipped file{count === 1 ? "" : "s"}
      {lastValid && <span className="text-status-rejected-foreground">· last valid state</span>}
    </span>
  );
}

/** The design's ○ / ✓ marks for one looked-for path (T-026). The mark is
 * measured Rust-side (PlanProbe), never decorative. */
function ChecklistRow({ row }: { row: PlanChecklistRow }) {
  return (
    <li className="flex items-center gap-2.25">
      <span
        aria-hidden="true"
        className={row.found ? "text-review-disc" : "text-muted-foreground"}
      >
        {row.found ? "✓" : "○"}
      </span>
      <span className={row.found ? "text-foreground" : undefined}>
        {row.path}
        {row.note !== undefined && ` — ${row.note}`}
      </span>
    </li>
  );
}

/** Front door (T-007, redressed by T-026 to the design's open-a-folder
 * screen): no project resolved at launch, the launch-resolved repo has no
 * plan, or a picked folder was rejected. Two ways in — "Open a folder…"
 * (⌘O) and "Start an interview" (⌘N) — over the hero wordmark and the
 * docs/ pitch; when the shell knows WHICH folder has no plan, the card
 * becomes the design's "No plan in <folder>": the checklist of what was
 * looked for, answered per row, and "Start an interview here".
 *
 * "Adopt existing code" is deliberately ABSENT in v1 (fenced to
 * archaeology), and with it the design's Adopt footnote — the footnote
 * slot carries T-007's convention hint instead, so redesigning this state
 * dropped none of what it used to say.
 *
 * PURELY PRESENTATIONAL since T-049. The ⌘O / ⌘N listener used to live
 * here, which is exactly why the chords this screen advertises stopped
 * working the moment a project opened: the listener unmounted with the
 * screen. It now lives once at the root (`useAccelerators` in `App`,
 * components/shell/accelerators.ts) — replaced, not supplemented, so
 * this component registers no window listener at all. DOM-tested in
 * test/project-shell.test.tsx; the accelerators in
 * test/accelerators.test.tsx. */
export function EmptyState({
  notice,
  picking,
  canKeepCurrent,
  onPick,
  onStartInterview,
  onStartInterviewHere,
  onKeepCurrent,
}: {
  notice: FrontDoorNotice;
  picking: boolean;
  canKeepCurrent: boolean;
  onPick: () => void;
  onStartInterview: () => void;
  onStartInterviewHere: () => void;
  onKeepCurrent: () => void;
}) {
  return (
    <section
      data-testid="empty-state"
      className="flex flex-1 items-center justify-center px-10 py-12"
    >
      <div className="flex w-full max-w-150 flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h2 className="font-mono text-3xl font-bold tracking-wordmark">nputer</h2>
          <p className="max-w-120 text-base text-secondary-foreground">
            Point it at a repo. It reads{" "}
            <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span> and
            renders the plan as a board. Nothing is copied, nothing is imported — if nputer
            disappears, the project is still there.
          </p>
        </div>

        {/* The two ways in, side by side, with the accelerators named. */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button size="lg" data-testid="pick-folder" disabled={picking} onClick={onPick}>
            {picking ? "choosing…" : "Open a folder…"}
          </Button>
          <Button
            size="lg"
            variant="outline"
            data-testid="start-interview"
            disabled={picking}
            onClick={onStartInterview}
          >
            Start an interview
          </Button>
          <span data-testid="shortcut-hint" className="ml-1 font-mono text-xs text-muted-foreground">
            ⌘O · ⌘N
          </span>
        </div>

        {notice.kind === "noPlan" ? (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-2">
              <h3 data-testid="no-plan-heading" className="text-xl font-semibold tracking-heading">
                No plan in <span className="font-mono text-lg">{notice.path}</span>
              </h3>
              <p data-testid="empty-state-message" className="text-sm text-secondary-foreground">
                Not a problem — there&apos;s just nothing to render yet. Here&apos;s where it
                looked:
              </p>
            </div>
            <ul
              data-testid="plan-checklist"
              className="flex flex-col gap-1.5 font-mono text-sm text-secondary-foreground"
            >
              {planChecklist(notice.probe).map((row) => (
                <ChecklistRow key={row.path} row={row} />
              ))}
            </ul>
            <div className="flex flex-wrap items-center gap-2.25">
              <Button
                data-testid="start-interview-here"
                disabled={picking}
                onClick={onStartInterviewHere}
              >
                Start an interview here
              </Button>
              {canKeepCurrent && (
                <Button data-testid="keep-current" variant="outline" onClick={onKeepCurrent}>
                  keep current project
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{CONVENTION_HINT}</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold tracking-heading">no board to show</h3>
              <p data-testid="empty-state-message" className="text-sm text-secondary-foreground">
                {notice.message}
              </p>
            </div>
            {canKeepCurrent && (
              <div className="flex items-center gap-2.25">
                <Button data-testid="keep-current" variant="outline" onClick={onKeepCurrent}>
                  keep current project
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/** The board header's right-edge milestone counter: milestone-1 real
 * tasks (ghosts and parked never count), done only. */
function milestoneLine(model: ReturnType<typeof getShellState>["docs"]["model"]): string | undefined {
  const real = model.tasks.filter(
    (t) => t.milestone === 1 && t.status !== "suggested" && t.status !== "parked",
  );
  if (real.length === 0) return undefined;
  const done = real.filter((t) => t.status === "done").length;
  return `milestone 1 · ${done} of ${real.length} done`;
}

function App() {
  const shell = useSyncExternalStore(subscribeShell, getShellState);

  useEffect(() => {
    void startDocsWatcher();
  }, []);

  // T-049: THE app's accelerators, registered once at the root so ⌘O and
  // ⌘N reach the same commands from every screen the app can show — the
  // board, the map, the interview and every empty state — instead of
  // only while the front door happens to be mounted. There is exactly
  // one keydown path in this app for these chords (see
  // components/shell/accelerators.ts, and the enumeration in
  // test/accelerators.test.tsx that would fail if a second appeared).
  // Both commands are the store's own single-flight picker entries, so a
  // chord fired while a native dialog is already open does nothing —
  // T-021's guard respected, not re-implemented.
  useAccelerators({
    openFolder: () => void pickProjectFolder(),
    startInterview: () => void pickGenesisFolder(),
  });

  // T-012 pane state: session-ephemeral by design (defaults each
  // launch — persistence is T-022's charter). The board pane's behavior
  // is byte-compatible; the map mounts/unmounts (layout is
  // deterministic, remount is free).
  const [pane, setPane] = useState<PaneId>("board");

  const { model, failures, skipped, truncated, fileCount, seq } = shell.docs;
  const screen = selectScreen(shell);
  const milestone = milestoneLine(model);

  return (
    <main
      className="flex min-h-screen"
      data-testid="docs-model"
      data-screen={screen.screen}
      data-pane={pane}
      data-seq={seq}
      data-task-count={model.tasks.length}
      data-failure-count={failures.length}
      data-skipped-count={skipped.length}
      data-truncated={truncated ? "true" : "false"}
    >
      {/* The rail renders only when a project is open; front door /
          loading / browser screens stay full-bleed. */}
      {screen.screen === "board" && <PaneRail active={pane} onSelect={setPane} />}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-hairline px-6 pt-4.5 pb-3.5">
        <div className="flex items-baseline gap-3.5">
          <h1 className="font-mono text-3xl font-bold tracking-wordmark">nputer</h1>
          {screen.screen === "board" && (
            <p className="font-mono text-sm text-muted-foreground">{shell.docs.projectDir}</p>
          )}
        </div>
        {/* T-017 (T-005-s3): header controls are app chrome, not board
            surface — pressing the theme toggle (or any sibling control)
            while the detail panel is open must not dismiss it. The
            single data-panel-exempt attribute on this container is the
            attribute mechanism from panel-dismissal.ts (pointerdown
            walks closest()), so controls added here inherit the
            exemption; blank header space still closes the panel. */}
        <div className="flex items-center gap-2.25" data-panel-exempt>
          {/* T-018 quiet truncation note — the map's "symbols truncated"
              pattern in the shell's chip strip: muted, factual, never a
              chip. fileCount is what actually rode the snapshot. */}
          {truncated && (
            <span
              data-testid="docs-truncation-note"
              className="font-mono text-xs text-muted-foreground"
            >
              docs truncated · showing first {fileCount} files
            </span>
          )}
          <SkippedFilesBadge skipped={skipped} skippedTotal={shell.docs.skippedTotal} />
          <ParseErrorBadge failures={failures} />
          {/* T-049: the front door's two ways in, in the header's own
              idiom — same verbs, same order (open first, interview
              second), the quiet outline control both header buttons
              already use. Before this, genesis from an open project took
              four steps (Open folder… → a folder with no docs/ → the "No
              plan in <folder>" card → Start an interview here), the first
              of which is a picker; now it is one, and the capability is
              discoverable without knowing a chord. Both are the same
              commands ⌘O / ⌘N reach, and both carry the picker's
              single-flight disable. */}
          {screen.screen === "board" && isTauriRuntime() && (
            <>
              <Button
                variant="outline"
                data-testid="open-folder"
                disabled={shell.picking}
                onClick={() => void pickProjectFolder()}
              >
                Open folder…
              </Button>
              <Button
                variant="outline"
                data-testid="header-start-interview"
                disabled={shell.picking}
                onClick={() => void pickGenesisFolder()}
              >
                Start an interview
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => document.documentElement.classList.toggle("dark")}
          >
            Toggle theme
          </Button>
        </div>
      </header>

      {screen.screen === "loading" && (
        <p className="px-6 py-3 text-sm text-muted-foreground">
          waiting for the first docs snapshot…
        </p>
      )}

      {screen.screen === "browser" && (
        <p className="px-6 py-3 text-sm text-muted-foreground">
          no Tauri IPC — dev harness active, no snapshot applied yet
        </p>
      )}

      {screen.screen === "empty" && (
        <EmptyState
          notice={screen.notice}
          picking={shell.picking}
          canKeepCurrent={screen.canKeepCurrent}
          onPick={() => void pickProjectFolder()}
          onStartInterview={() => void pickGenesisFolder()}
          onStartInterviewHere={() => void startGenesisHere()}
          onKeepCurrent={keepCurrentProject}
        />
      )}

      {/* T-026: a genesis project — full-bleed, no rail (see the rail
          condition above). T-027 fills this screen; T-024's lens mounts
          inside GenesisScreen's marked slot. */}
      {screen.screen === "genesis" && (
        <GenesisScreen projectDir={shell.genesisDir ?? ""} docs={shell.docs} />
      )}

      {screen.screen === "board" && pane === "board" && (
        <>
          <div className="flex items-baseline justify-between gap-4 px-6 pt-2.75 pb-3.5">
            <p className="text-sm text-muted-foreground" data-testid="model-counts">
              {model.tasks.length} tasks · {model.features.length} features ·{" "}
              {model.issues.length} issues · seq {seq} · updated{" "}
              {new Date(shell.docs.generatedAtMs).toLocaleTimeString()}
            </p>
            {milestone !== undefined && (
              <p className="font-mono text-xs text-muted-foreground">{milestone}</p>
            )}
          </div>

          {(failures.length > 0 || skipped.length > 0) && (
            <ul
              data-testid="parse-error-details"
              className="mx-6 mb-3.5 flex flex-col gap-1 rounded-lg border border-status-rejected-border bg-status-rejected p-3 text-xs"
            >
              {failures.map((f) => (
                <li key={f.path} className="font-mono text-status-rejected-foreground">
                  {f.issues[0]?.message ?? `${f.path}: unparsable`}
                  {f.showingLastGood ? " (showing last valid state)" : ""}
                </li>
              ))}
              {/* T-018: collector skips ride the same strip — a file the
                  watcher cannot read is a fact about the board, not a
                  silent disappearance. */}
              {skipped.map((s) => (
                <li key={`skip:${s.path}`} className="font-mono text-status-rejected-foreground">
                  {s.path}: skipped — {skipReasonPhrase(s.reason)}
                  {s.showingLastGood ? " (showing last valid state)" : ""}
                </li>
              ))}
            </ul>
          )}

          <div className="px-6 pb-7.5">
            <Board model={model} />
          </div>
        </>
      )}

      {screen.screen === "board" && pane === "map" && (
        <MapView
          model={model}
          {...(shell.docs.graphContent !== undefined
            ? { graphContent: shell.docs.graphContent }
            : {})}
          indexing={shell.indexing}
          indexOutcome={shell.indexOutcome}
          onRunIndex={() => void runIndexRepo()}
        />
      )}
      </div>
    </main>
  );
}

export default App;
