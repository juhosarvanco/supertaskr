import { useEffect, useState, useSyncExternalStore } from "react";
import { MapView } from "@/architecture/MapView";
import { Board } from "@/components/board/Board";
import { PaneRail, type PaneId } from "@/components/shell/PaneRail";
import { Button } from "@/components/ui/button";
import { skipReasonPhrase } from "@/lib/docs-model";
import {
  getShellState,
  isTauriRuntime,
  keepCurrentProject,
  pickProjectFolder,
  runIndexRepo,
  selectScreen,
  startDocsWatcher,
  subscribeShell,
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

/** Friendly empty state (T-007): no project resolved at launch, the
 * launch-resolved repo has no docs/, or a picked folder was rejected —
 * always with the message naming what was looked for and a re-pick
 * affordance. T-006 dresses it as the front door from the open-a-folder
 * mockup: hero wordmark, the docs/ pitch, and the no-plan card (an
 * empty folder is an invitation, never an error). Pure presentational;
 * DOM-tested in test/project-shell.test.tsx. */
export function EmptyState({
  message,
  picking,
  canKeepCurrent,
  onPick,
  onKeepCurrent,
}: {
  message: string;
  picking: boolean;
  canKeepCurrent: boolean;
  onPick: () => void;
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
        <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 shadow-card">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-semibold tracking-heading">no board to show</h3>
            <p data-testid="empty-state-message" className="text-sm text-secondary-foreground">
              {message}
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button data-testid="pick-folder" disabled={picking} onClick={onPick}>
              {picking ? "choosing…" : "Open a project folder…"}
            </Button>
            {canKeepCurrent && (
              <Button data-testid="keep-current" variant="outline" onClick={onKeepCurrent}>
                keep current project
              </Button>
            )}
          </div>
        </div>
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
          {screen.screen === "board" && isTauriRuntime() && (
            <Button
              variant="outline"
              data-testid="open-folder"
              disabled={shell.picking}
              onClick={() => void pickProjectFolder()}
            >
              Open folder…
            </Button>
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
          message={screen.message}
          picking={shell.picking}
          canKeepCurrent={screen.canKeepCurrent}
          onPick={() => void pickProjectFolder()}
          onKeepCurrent={keepCurrentProject}
        />
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
