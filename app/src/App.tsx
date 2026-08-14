import { useEffect, useSyncExternalStore } from "react";
import { Button } from "@/components/ui/button";
import {
  getDocsModelState,
  isTauriRuntime,
  startDocsWatcher,
  subscribeDocsModel,
} from "@/lib/watcher-store";

// T-003 shell: a live, read-only lens over the project's docs/ tree.
// Layout stays deliberately plain — T-004 brings the story map, T-006 the
// design language. Everything styles itself via tokens.css utilities.

/** Non-blocking parse-error badge (criterion 3). Renders only while at
 * least one changed file fails to parse; the model below keeps showing
 * each failing file's last valid state meanwhile. */
function ParseErrorBadge({ failures }: { failures: ReturnType<typeof getDocsModelState>["failures"] }) {
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

function App() {
  const state = useSyncExternalStore(subscribeDocsModel, getDocsModelState);

  useEffect(() => {
    void startDocsWatcher();
  }, []);

  const { model, failures, seq } = state;

  return (
    <main
      className="flex min-h-screen flex-col gap-4 p-6"
      data-testid="docs-model"
      data-seq={seq}
      data-task-count={model.tasks.length}
      data-failure-count={failures.length}
    >
      <header className="flex items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-mono text-2xl font-semibold">nputer</h1>
          <ParseErrorBadge failures={failures} />
        </div>
        <Button
          variant="outline"
          onClick={() => document.documentElement.classList.toggle("dark")}
        >
          Toggle theme
        </Button>
      </header>

      {seq === 0 ? (
        <p className="text-sm text-muted-foreground">
          {isTauriRuntime()
            ? "waiting for the first docs snapshot…"
            : "no Tauri IPC — dev harness active, no snapshot applied yet"}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-1">
            <p className="font-mono text-xs text-muted-foreground">{state.projectDir}</p>
            <p className="text-sm text-muted-foreground" data-testid="model-counts">
              {model.tasks.length} tasks · {model.features.length} features ·{" "}
              {model.issues.length} issues · seq {seq} · updated{" "}
              {new Date(state.generatedAtMs).toLocaleTimeString()}
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

          <ul className="flex flex-col gap-1" data-testid="task-list">
            {model.tasks.map((task) => (
              <li
                key={task.file}
                data-task-id={task.id ?? ""}
                className="flex items-baseline gap-2 rounded-md border border-border px-3 py-2"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {task.id ?? "s"}
                </span>
                <span className="text-sm">{task.title}</span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">
                  {task.status}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

export default App;
