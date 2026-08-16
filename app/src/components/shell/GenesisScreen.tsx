import type { DocsModelState } from "@/lib/docs-model";

/**
 * The genesis screen (T-026 criterion 2): what the shell shows while a
 * folder with no plan is open for an interview. Full-bleed by design —
 * the pane rail stays board|map, which are the panes an OPEN project has;
 * an interview is not a pane.
 *
 * THIS IS A PLACEHOLDER, and deliberately a thin one. T-027 fills the
 * screen with the split view (conversation left, the project-so-far
 * right) and T-024 builds the lens that renders `docs` — this task only
 * has to get you HERE, prove the watcher is armed, and leave a seam the
 * other two can compose at without either editing the other's files.
 *
 * THE SEAM (read this before wiring T-024/T-027): everything this screen
 * needs is already in its two props — `projectDir` (the genesis root) and
 * `docs` (the live DocsModelState the watcher feeds). T-024's lens takes
 * a DocsModelState too, so mounting it is one import plus one element
 * inside the marked region below; nothing else here has to move, and no
 * new IPC exists to wire. Until then this region is honest about being
 * empty rather than pretending to be a product.
 */
export function GenesisScreen({
  projectDir,
  docs,
}: {
  projectDir: string;
  docs: DocsModelState;
}) {
  const fileCount = docs.fileCount;
  const started = fileCount > 0;
  return (
    <section
      data-testid="genesis-screen"
      data-genesis-files={fileCount}
      className="flex flex-1 flex-col gap-6 px-10 py-9"
    >
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
          interview
        </span>
        <h2 className="text-2xl font-semibold tracking-heading">
          Starting a plan in{" "}
          <span data-testid="genesis-project-dir" className="font-mono text-xl">
            {projectDir}
          </span>
        </h2>
        <p className="max-w-120 text-sm text-secondary-foreground">
          The planner writes into{" "}
          <span className="rounded-sm bg-muted px-1.5 font-mono text-sm">docs/</span> and this
          screen renders whatever lands — nothing is copied, nothing is imported.
        </p>
      </div>

      {/* ---- T-024's lens mounts HERE (see the seam note above) ------- */}
      <div
        data-testid="genesis-pane-slot"
        className="flex flex-col gap-2 rounded-lg border border-border bg-card p-6 shadow-card"
      >
        <p data-testid="genesis-docs-count" className="font-mono text-sm text-muted-foreground">
          {started
            ? `docs/ · ${fileCount} file${fileCount === 1 ? "" : "s"} written`
            : "docs/ · nothing written yet"}
        </p>
        <p className="text-sm text-secondary-foreground">
          {started
            ? "The watcher is live: every file the planner writes shows up here."
            : "An empty folder is an invitation. The watcher is armed on this folder — the first file written to docs/ appears here with no re-pick."}
        </p>
      </div>
    </section>
  );
}
