import { useEffect, useRef, type ReactNode } from "react";
import type { ProjectParseResult } from "@nputer/parser/pure";
import { cn } from "@/lib/utils";
import { attachPanelDismissal } from "@/components/board/panel-dismissal";
import type { TaskRef } from "@/lib/task-detail";
import type { DerivedArchitecture, DerivedTaskRef } from "@/lib/architecture/derive";
import { UNMAPPED_ID } from "@/lib/architecture/derive";
import type { ChurnAttribution } from "@/lib/architecture/churn";
import {
  churnAge,
  findingText,
  panelFindings,
  provenanceLabel,
  STATUS_CHIP,
} from "./map-visuals";
import type { ChurnState } from "./churn-source";
import { churnDisabledSentence } from "./churn-source";
import { fileDetail, type EdgeRow } from "./map-zoom";
import type { ArchGraph } from "@/lib/architecture/graph";

/**
 * The component detail panel (T-012, §6.3): the T-005 drawer PRIMITIVE
 * pattern — fixed right aside, focus-in/focus-restore, and
 * attachPanelDismissal reused VERBATIM (C-09's trusted-input contract:
 * pointerdown, never click — the CONVENTIONS gotcha binds here).
 * 480px wide per the measured spec (the board's task panel keeps its
 * own 600px).
 *
 * Every empty section renders a placeholder line, never an error
 * (T-005 rule). Task rows are data-card-trigger buttons whose click
 * re-targets the pane's panel state to the REAL TaskDetailPanel.
 */
export function MapPanel({
  derived,
  componentId,
  model,
  churn,
  churnState,
  onOpenTask,
  onOpenFile,
  onClose,
}: {
  derived: DerivedArchitecture;
  componentId: string;
  model: ProjectParseResult;
  churn: ChurnAttribution;
  churnState: ChurnState;
  onOpenTask: (ref: TaskRef) => void;
  /** T-013 T2: a file row opens the symbol panel. */
  onOpenFile: (path: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => attachPanelDismissal(document, () => panelRef.current, onClose), [onClose]);

  // Focus the panel on open/re-target; restore focus on close.
  const openerRef = useRef<Element | null>(null);
  useEffect(() => {
    openerRef.current = document.activeElement;
    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  useEffect(() => {
    panelRef.current?.focus();
  }, [componentId]);

  const component = derived.components.find((c) => c.id === componentId);
  const findings = component !== undefined ? panelFindings(derived.findings, component.id) : [];

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      data-testid="map-panel"
      data-component-id={componentId}
      aria-label={component?.name ?? componentId}
      className="fixed inset-y-0 right-0 z-10 flex w-120 max-w-full flex-col overflow-y-auto border-l border-border bg-background text-foreground shadow-map-panel"
    >
      <div className="flex items-start justify-between gap-3.5 border-b border-hairline px-5.5 pt-4.5 pb-3.5">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-baseline gap-2.5">
            <p className="shrink-0 font-mono text-sm text-muted-foreground">
              {component?.kind === "unmapped" ? "—" : componentId}
            </p>
            {component !== undefined && (
              <h2 className="min-w-0 truncate text-2xl font-semibold tracking-heading">
                {component.name}
              </h2>
            )}
          </div>
          {component !== undefined && (
            <div className="flex flex-wrap items-center gap-1.75">
              <span
                data-testid="map-panel-status"
                className={cn(
                  "rounded-chip border px-2.25 py-0.75 text-xs font-medium",
                  STATUS_CHIP[component.status],
                )}
              >
                {component.status}
              </span>
              {component.layer !== undefined && (
                <span className="rounded-chip border border-ghost-border px-1.75 py-0.5 font-mono text-xs text-secondary-foreground">
                  {component.layer}
                </span>
              )}
              {findings.length > 0 && (
                <span
                  data-testid="map-panel-drift-chip"
                  className="rounded-chip border border-warning-chip-border bg-warning-chip px-1.75 py-0.5 font-mono text-xs font-semibold text-warning"
                >
                  {findings.length} drift finding{findings.length === 1 ? "" : "s"}
                </span>
              )}
              {component.pinned && (
                <span className="rounded-chip border border-ghost-border px-1.75 py-0.5 font-mono text-xs text-muted-foreground">
                  status pinned
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          data-testid="map-panel-esc"
          onClick={onClose}
          className="shrink-0 rounded-md border border-input px-2 py-0.75 font-mono text-sm text-muted-foreground hover:bg-muted"
        >
          esc
        </button>
      </div>

      {component === undefined ? (
        <p className="px-5.5 py-4 text-sm text-muted-foreground">
          {componentId} is no longer part of the derived architecture.
        </p>
      ) : (
        <div className="flex flex-col gap-4.5 px-5.5 pt-4 pb-4.5">
          <Section label="responsibility">
            {component.record !== undefined && component.record.responsibility.trim() !== "" ? (
              <p className="text-base leading-relaxed text-secondary-foreground">
                {component.record.responsibility}
              </p>
            ) : component.kind === "unmapped" ? (
              <Placeholder>
                the synthetic bucket for files no component claims — claiming them in the
                registry drains it
              </Placeholder>
            ) : component.kind === "inferred" ? (
              <Placeholder>
                inferred from the directory layout — no component file declares this
              </Placeholder>
            ) : (
              <Placeholder>no responsibility prose</Placeholder>
            )}
          </Section>

          {component.pinned && (
            <p
              data-testid="map-panel-pin-note"
              className="font-mono text-xs text-muted-foreground"
            >
              status pinned by the architect — the task rollup says “{component.autoStatus}”
            </p>
          )}

          {component.provenance !== undefined && (
            <Section label="provenance">
              <p className="text-sm text-secondary-foreground">
                weakest done task: {provenanceLabel(component.provenance)}
              </p>
            </Section>
          )}

          <Section label="drift findings">
            {findings.length === 0 ? (
              <Placeholder>no drift findings</Placeholder>
            ) : (
              <div className="flex flex-col gap-2.25" data-testid="map-panel-findings">
                {findings.map((finding) => {
                  const text = findingText(finding);
                  return (
                    <div
                      key={finding.id}
                      className="flex flex-col gap-1.25 border-l-2 border-warning-chip-border pl-3"
                    >
                      <div className="flex items-baseline gap-2.25">
                        <span className="shrink-0 font-mono text-xs text-warning whitespace-nowrap">
                          {text.label}
                        </span>
                        <span className="text-base leading-snug">{text.sentence}</span>
                      </div>
                      {text.evidence !== undefined && (
                        <span className="font-mono text-xs leading-relaxed text-muted-foreground">
                          {text.evidence}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Section>

          <Section label="dependencies">
            <DependencyGrid derived={derived} componentId={component.id} />
          </Section>

          <Section label="tasks touching this component">
            {component.tasks.length === 0 ? (
              <Placeholder>no tasks touch this component</Placeholder>
            ) : (
              <div className="flex flex-col gap-1.5" data-testid="map-panel-tasks">
                {component.tasks.map((task) => (
                  <TaskRow
                    key={task.id ?? task.file}
                    task={task}
                    model={model}
                    onOpen={onOpenTask}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section label="decisions">
            {component.record !== undefined && component.record.decisions.length > 0 ? (
              // Non-clickable mono text: no in-app decisions surface
              // exists yet (recorded silence).
              <p className="font-mono text-sm text-secondary-foreground">
                {component.record.decisions.join(" · ")}
              </p>
            ) : (
              <Placeholder>no linked decisions</Placeholder>
            )}
          </Section>

          <Section label="files">
            {component.files.length === 0 ? (
              <Placeholder>
                {component.declaredOnly || component.kind === "placeholder"
                  ? "declared · no files yet"
                  : "no indexed files"}
              </Placeholder>
            ) : (
              <FileGroups files={component.files} onOpenFile={onOpenFile} />
            )}
          </Section>

          <Section label={churnLabel(churnState)}>
            <ChurnSection component={component.id} churn={churn} churnState={churnState} />
          </Section>
        </div>
      )}
    </aside>
  );
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1.75">
      <h3 className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
        {label}
      </h3>
      {children}
    </section>
  );
}

function Placeholder({ children }: { children: ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

/** The declared | observed two-column grid (§6.3): one row per
 * dependency target; observed-only rows show — on the left and the
 * warning ink on the right. */
function DependencyGrid({
  derived,
  componentId,
}: {
  derived: DerivedArchitecture;
  componentId: string;
}) {
  const outgoing = derived.edges.filter((edge) => edge.from === componentId);
  if (outgoing.length === 0) {
    return <Placeholder>no dependencies — declared or observed</Placeholder>;
  }
  const nameOf = (id: string): string =>
    id === UNMAPPED_ID
      ? "unmapped"
      : (derived.components.find((c) => c.id === id)?.name ?? id);
  return (
    <div
      data-testid="map-panel-dependencies"
      className="grid grid-cols-2 overflow-hidden rounded-lg border border-hairline"
    >
      <div className="border-r border-b border-hairline bg-sidebar px-3 py-2.25 font-mono text-xs tracking-overline text-muted-foreground uppercase">
        declared
      </div>
      <div className="border-b border-hairline bg-sidebar px-3 py-2.25 font-mono text-xs tracking-overline text-muted-foreground uppercase">
        observed
      </div>
      {outgoing.map((edge) => {
        const label = `${edge.to === UNMAPPED_ID ? "unmapped" : edge.to}`;
        const observedCell =
          edge.observedCount > 0 ? (
            <>
              {label}{" "}
              <span className="font-mono text-sm">
                · {edge.observedCount} import{edge.observedCount === 1 ? "" : "s"}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">—</span>
          );
        return (
          <div key={`${edge.from}->${edge.to}`} className="contents">
            <div className="border-r border-hairline px-3 py-2.25 text-sm">
              {edge.declared ? (
                `${label} ${nameOf(edge.to)}`
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
            <div
              className={cn(
                "px-3 py-2.25 text-sm",
                !edge.declared && edge.observedCount > 0 && "text-warning",
              )}
            >
              {observedCell}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Files grouped by directory (§6.3). Clicking a leaf is T-013's T2:
 * the row re-targets the pane's panel to that file's symbols, and
 * `data-card-trigger` keeps the press from dismissing the panel it is
 * about to replace (the T-005 primitive's exemption). */
function FileGroups({
  files,
  onOpenFile,
}: {
  files: readonly string[];
  onOpenFile: (path: string) => void;
}) {
  const groups = new Map<string, string[]>();
  for (const path of files) {
    const slash = path.lastIndexOf("/");
    const dir = slash === -1 ? "(root)" : path.slice(0, slash + 1);
    const leafName = slash === -1 ? path : path.slice(slash + 1);
    const bucket = groups.get(dir);
    if (bucket === undefined) groups.set(dir, [leafName]);
    else bucket.push(leafName);
  }
  return (
    <div className="flex flex-col gap-2" data-testid="map-panel-files">
      {[...groups.entries()].map(([dir, leaves]) => (
        <div key={dir} className="flex flex-col gap-0.75">
          <span className="font-mono text-xs tracking-overline text-muted-foreground uppercase">
            {dir}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.75">
            {leaves.map((leaf) => (
              <button
                key={leaf}
                type="button"
                data-card-trigger
                data-testid="map-panel-file"
                data-file-path={`${dir === "(root)" ? "" : dir}${leaf}`}
                onClick={() => onOpenFile(`${dir === "(root)" ? "" : dir}${leaf}`)}
                className="rounded-sm font-mono text-sm leading-relaxed text-secondary-foreground underline decoration-hairline underline-offset-2 hover:bg-muted hover:text-foreground"
              >
                {leaf}
              </button>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

/** The churn section's own heading — the window when there is one, and
 * the plain word when there is not (never "30d" over a disabled read). */
function churnLabel(state: ChurnState): string {
  return state.kind === "measured" ? `churn · ${state.windowDays}d` : "churn";
}

/** The panel's churn facts for one component. A disabled read shows the
 * ONE fixed sentence for its reason (churn-source.ts owns that
 * vocabulary) — never a string git produced. */
function ChurnSection({
  component,
  churn,
  churnState,
}: {
  component: string;
  churn: ChurnAttribution;
  churnState: ChurnState;
}) {
  if (churnState.kind === "loading") return <Placeholder>reading git…</Placeholder>;
  if (churnState.kind === "disabled") {
    return (
      <Placeholder>
        <span data-testid="map-panel-churn-off">
          churn is off — {churnDisabledSentence(churnState.reason)}
        </span>
      </Placeholder>
    );
  }
  const entry = churn.byComponent.get(component);
  if (entry === undefined) {
    return <Placeholder>nothing here moved in the last {churnState.windowDays} days</Placeholder>;
  }
  return (
    <p data-testid="map-panel-churn" className="text-sm text-secondary-foreground">
      {entry.edits} edit{entry.edits === 1 ? "" : "s"} across {entry.files} file
      {entry.files === 1 ? "" : "s"} · last {churnAge(entry.lastCommitMs, Date.now())}
    </p>
  );
}

/** Short model word for the task-row badge — a local twin of
 * board-model's shortModelName (board-model is C-08 territory; the §2
 * amendment deliberately declares only C-05/C-09 imports, so importing
 * it would ship a born-drifted C-12→C-08 edge — same reasoning as the
 * provenance mark twin). */
function modelWord(model: string): string {
  const trimmed = model.trim();
  const base = (trimmed.split("/")[0] ?? trimmed).trim();
  if (base === "") return trimmed;
  const segments = base.split("-");
  while (segments.length > 1 && /^v?\d+(\.\d+)*$/i.test(segments[segments.length - 1] ?? "")) {
    segments.pop();
  }
  if (segments.length > 1 && (segments[0] ?? "").toLowerCase() === "claude") {
    segments.shift();
  }
  const short = segments.join("-");
  return short === "" ? base : short;
}

/** Compact task row: id · title · status chip · model badge; the click
 * re-targets to the real TaskDetailPanel (data-card-trigger keeps the
 * press from dismissing the panel it is about to replace). */
function TaskRow({
  task,
  model,
  onOpen,
}: {
  task: DerivedTaskRef;
  model: ProjectParseResult;
  onOpen: (ref: TaskRef) => void;
}) {
  const record = model.tasks.find((t) =>
    task.id !== undefined ? t.id === task.id : t.file === task.file,
  );
  const doneish = task.status === "done" || task.status === "merging";
  const session =
    record === undefined
      ? undefined
      : doneish
        ? (record.builtBy ?? record.builder)
        : (record.builder ?? record.builtBy);
  const ref: TaskRef =
    task.id !== undefined ? { kind: "id", id: task.id } : { kind: "file", file: task.file };
  return (
    <button
      type="button"
      data-card-trigger
      data-testid="map-panel-task"
      data-task-ref={task.id ?? task.file}
      onClick={() => onOpen(ref)}
      className="flex w-full items-center gap-2.25 rounded-md border border-hairline px-2.5 py-1.75 text-left hover:bg-muted"
    >
      <span className="shrink-0 font-mono text-xs text-muted-foreground">{task.id ?? "—"}</span>
      <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
      <span
        className={cn(
          "shrink-0 rounded-chip border px-1.75 py-0.25 font-mono text-xs",
          task.status === "suggested" || task.status === "parked"
            ? "border-dashed border-ghost-border text-muted-foreground"
            : STATUS_CHIP[task.status as keyof typeof STATUS_CHIP],
        )}
      >
        {task.status}
      </span>
      {session !== undefined && (
        <span
          title={session.raw}
          className="shrink-0 rounded-chip border border-ghost-border px-1.75 py-0.25 font-mono text-xs text-secondary-foreground"
        >
          {modelWord(session.model)}
        </span>
      )}
    </button>
  );
}


// ---------------------------------------------------------------------
// T2 — a file selected (T-013)
// ---------------------------------------------------------------------

/**
 * The file panel: symbols and their RESOLVED edges, in the panel and
 * never on the canvas (plan §1.2 — canvas symbol nodes would double the
 * graph and stop it being a map; the bundle's T2 card says the same).
 *
 * Drawn as the bundle's T2 section: visibility in the left gutter, name,
 * then kind and reference count on the right; the file's resolved edges
 * last, each with the component it resolves to. Rows are NOT clickable
 * in v1 — the bundle reserves that for opening an editor in v2 — so this
 * panel is the leaf of the drill-down, which is also why its own header
 * carries the way back up to the component.
 *
 * Same drawer PRIMITIVE as the component panel above (T-005): fixed
 * right aside, focus-in and focus-restore, `attachPanelDismissal` reused
 * verbatim, and every empty section a placeholder rather than an error.
 */
export function MapFilePanel({
  derived,
  graph,
  path,
  onOpenComponent,
  onClose,
}: {
  derived: DerivedArchitecture;
  graph: ArchGraph | undefined;
  path: string;
  onOpenComponent: (id: string) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => attachPanelDismissal(document, () => panelRef.current, onClose), [onClose]);

  const openerRef = useRef<Element | null>(null);
  useEffect(() => {
    openerRef.current = document.activeElement;
    return () => {
      const opener = openerRef.current;
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);
  useEffect(() => {
    panelRef.current?.focus();
  }, [path]);

  const detail = fileDetail(path, derived, graph);
  const leaf = path.slice(path.lastIndexOf("/") + 1);

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      data-testid="map-file-panel"
      data-file-path={path}
      aria-label={leaf}
      className="fixed inset-y-0 right-0 z-10 flex w-120 max-w-full flex-col overflow-y-auto border-l border-border bg-background text-foreground shadow-map-panel"
    >
      <div className="flex items-start justify-between gap-3.5 border-b border-hairline px-5.5 pt-4.5 pb-3.5">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="min-w-0 truncate font-mono text-sm" title={path}>
            {path}
          </p>
          <div className="flex flex-wrap items-center gap-1.75">
            {detail.component !== undefined && (
              <button
                type="button"
                data-card-trigger
                data-testid="map-file-panel-component"
                onClick={() => onOpenComponent(detail.component as string)}
                className="rounded-chip border border-ghost-border px-1.75 py-0.5 font-mono text-xs text-secondary-foreground hover:bg-muted"
              >
                {detail.component === UNMAPPED_ID ? "unmapped" : detail.component}
              </button>
            )}
            {detail.lang !== undefined && (
              <span className="rounded-chip border border-ghost-border px-1.75 py-0.5 font-mono text-xs text-muted-foreground">
                {detail.lang} · {detail.loc} loc
              </span>
            )}
            {detail.claimedBy.length > 1 && (
              <span
                data-testid="map-file-panel-claimed"
                className="rounded-chip border border-warning-chip-border bg-warning-chip px-1.75 py-0.5 font-mono text-xs font-semibold text-warning"
              >
                claimed by {detail.claimedBy.join(", ")}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          data-testid="map-file-panel-esc"
          onClick={onClose}
          className="shrink-0 rounded-md border border-input px-2 py-0.75 font-mono text-sm text-muted-foreground hover:bg-muted"
        >
          esc
        </button>
      </div>

      {detail.missing ? (
        <p className="px-5.5 py-4 text-sm text-muted-foreground">
          the index has no record of this file — re-indexing regenerates the graph
        </p>
      ) : (
        <div className="flex flex-col gap-4.5 px-5.5 pt-4 pb-4.5">
          <Section label="symbols">
            {detail.symbols.length === 0 ? (
              <Placeholder>
                {detail.symbolsTruncated
                  ? "symbols truncated for this file — the indexer was over its budget"
                  : "no symbols declared"}
              </Placeholder>
            ) : (
              <div className="flex flex-col" data-testid="map-file-symbols">
                {detail.symbols.map((symbol) => (
                  <div
                    key={`${symbol.name}:${symbol.range[0]}`}
                    data-testid="map-file-symbol"
                    className="flex items-center gap-2.5 rounded-sm px-1 py-1.25 odd:bg-sidebar"
                  >
                    <span className="w-8 shrink-0 font-mono text-map-meta text-muted-foreground">
                      {symbol.exported ? "pub" : "—"}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-mono text-sm">
                      {symbol.name}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-muted-foreground">
                      {symbol.kind} · {symbol.refs} ref{symbol.refs === 1 ? "" : "s"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section label="resolved edges">
            {detail.edges.length === 0 ? (
              <Placeholder>this file resolves to nothing the graph knows</Placeholder>
            ) : (
              <div className="flex flex-col" data-testid="map-file-edges">
                {detail.edges.map((edge) => (
                  <EdgeLine key={`${edge.kind}:${edge.target}`} edge={edge} />
                ))}
              </div>
            )}
          </Section>

          <Section label="unresolved">
            {detail.unresolved.length === 0 ? (
              <Placeholder>every specifier resolved</Placeholder>
            ) : (
              <p
                data-testid="map-file-unresolved"
                className="font-mono text-sm leading-relaxed text-secondary-foreground"
              >
                {detail.unresolved.join(" · ")}
              </p>
            )}
          </Section>
        </div>
      )}
    </aside>
  );
}

function EdgeLine({ edge }: { edge: EdgeRow }) {
  return (
    <div
      data-testid="map-file-edge"
      data-edge-kind={edge.kind}
      className="flex items-center gap-2.5 rounded-sm px-1 py-1.25 odd:bg-sidebar"
    >
      <span className="w-8 shrink-0 font-mono text-map-meta text-muted-foreground">
        {edge.kind === "import" ? "use" : edge.kind === "call" ? "call" : "type"}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-sm" title={edge.target}>
        {edge.label}
      </span>
      <span className="shrink-0 font-mono text-xs text-muted-foreground">
        {edge.component === undefined
          ? "—"
          : edge.component === UNMAPPED_ID
            ? "unmapped"
            : edge.component}
      </span>
    </div>
  );
}
