import { useEffect, useSyncExternalStore } from "react";
import { Board } from "@/components/board/Board";
import { Button } from "@/components/ui/button";
import {
  getShellState,
  isTauriRuntime,
  keepCurrentProject,
  pickProjectFolder,
  selectScreen,
  startDocsWatcher,
  subscribeShell,
} from "@/lib/watcher-store";

// A live, read-only lens over the project's docs/ tree: T-003's watcher
// feeds the store; T-004's story map board renders it (home pane); T-007
// decides WHICH project is open (launch resolution + folder picker) and
// shows a friendly empty state when there is no board to show. T-006
// brings the design language. Everything styles itself via tokens.css
// utilities.

/** Non-blocking parse-error badge (criterion 3). Renders only while at
 * least one changed file fails to parse; the model below keeps showing
 * each failing file's last valid state meanwhile. */
function ParseErrorBadge({ failures }: { failures: ReturnType<typeof getShellState>["docs"]["failures"] }) {
  if (failures.length === 0) return null;
  // Parser issue messages already name the file; no path prefix needed.
  const detail = failures
    .map((f) => f.issues[0]?.message ?? `${f.path}: unparsable`)
    .join("\n");
  return (
    <span
      data-testid="parse-error-badge"
      title={detail}
      className="rounded-md border border-destructive px-2 py-1 font-mono text-xs text-destructive"
    >
      {failures.length} parse error{failures.length === 1 ? "" : "s"}
    </span>
  );
}

/** Friendly empty state (T-007): no project resolved at launch, the
 * launch-resolved repo has no docs/, or a picked folder was rejected —
 * always with the message naming what was looked for and a re-pick
 * affordance. Pure presentational; DOM-tested in
 * test/project-shell.test.tsx. */
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
      className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center"
    >
      <h2 className="font-mono text-lg font-semibold">no board to show</h2>
      <p data-testid="empty-state-message" className="max-w-96 text-sm text-muted-foreground">
        {message}
      </p>
      <div className="flex items-center gap-2">
        <Button data-testid="pick-folder" disabled={picking} onClick={onPick}>
          {picking ? "choosing…" : "Open a project folder…"}
        </Button>
        {canKeepCurrent && (
          <Button data-testid="keep-current" variant="ghost" onClick={onKeepCurrent}>
            keep current project
          </Button>
        )}
      </div>
    </section>
  );
}

function App() {
  const shell = useSyncExternalStore(subscribeShell, getShellState);

  useEffect(() => {
    void startDocsWatcher();
  }, []);

  const { model, failures, seq } = shell.docs;
  const screen = selectScreen(shell);

  return (
    <main
      className="flex min-h-screen flex-col gap-4 p-6"
      data-testid="docs-model"
      data-screen={screen.screen}
      data-seq={seq}
      data-task-count={model.tasks.length}
      data-failure-count={failures.length}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">nputer</h1>
          <ParseErrorBadge failures={failures} />
        </div>
        <div className="flex items-center gap-2">
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
        <p className="text-sm text-muted-foreground">waiting for the first docs snapshot…</p>
      )}

      {screen.screen === "browser" && (
        <p className="text-sm text-muted-foreground">
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

      {screen.screen === "board" && (
        <>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-muted-foreground">{shell.docs.projectDir}</p>
            <p className="text-sm text-muted-foreground" data-testid="model-counts">
              {model.tasks.length} tasks · {model.features.length} features ·{" "}
              {model.issues.length} issues · seq {seq} · updated{" "}
              {new Date(shell.docs.generatedAtMs).toLocaleTimeString()}
            </p>
          </div>

          {failures.length > 0 && (
            <ul
              data-testid="parse-error-details"
              className="flex flex-col gap-1 rounded-md border border-destructive p-3 text-xs"
            >
              {failures.map((f) => (
                <li key={f.path} className="font-mono text-destructive">
                  {f.issues[0]?.message ?? `${f.path}: unparsable`}
                  {f.showingLastGood ? " (showing last valid state)" : ""}
                </li>
              ))}
            </ul>
          )}

          <Board model={model} />
        </>
      )}
    </main>
  );
}

export default App;
