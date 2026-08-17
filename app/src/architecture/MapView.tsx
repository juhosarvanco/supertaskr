import { useEffect, useMemo, useRef, useState } from "react";
import type { ProjectParseResult } from "@nputer/parser/pure";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel";
import type { TaskRef } from "@/lib/task-detail";
import type { IndexOutcomePayload } from "@/lib/watcher-store";
import {
  deriveArchitecture,
  type DerivedArchitecture,
  type DerivedStatus,
} from "@/lib/architecture/derive";
import { parseGraph, type GraphParseResult } from "@/lib/architecture/graph";
import {
  layoutKey,
  layoutMap,
  type LayoutComponentInput,
  type LayoutEdgeInput,
  type LayoutNode,
  type MapLayout,
} from "./map-layout";
import {
  driftFooter,
  edgeVisual,
  MAP_OVERLAYS,
  type MapOverlay,
} from "./map-visuals";
import { searchMap } from "./map-search";
import { MapEdge, MapEdgeMarkers, edgeKey } from "./MapEdge";
import { MapNode } from "./MapNode";
import { MapPanel } from "./MapPanel";
import { TasksLens } from "./TasksLens";
import { MAP_LENSES, type MapLens } from "./map-lens";

/**
 * The map pane (T-012): T0 architecture map — T-011's derived model
 * rendered as HTML nodes over an SVG edge layer inside ONE transformed
 * wrapper (the mock's own construction). Pan/zoom is translate+scale on
 * the wrapper — scale only, never re-layout. Layout recomputes only
 * when the STRUCTURE changes (layoutKey); status flips repaint, never
 * move. View state (overlay, selection, viewport) is session-ephemeral
 * by design — persistence is T-022's charter (plan §3 seam).
 */

/** Zoom clamp (recorded silence: 0.25–3). */
const MIN_SCALE = 0.25;
const MAX_SCALE = 3;
/** The docs collector's per-file cap — over it, the graph silently
 * leaves the snapshot; the header hint says so after a manual index. */
const COLLECTOR_CAP_BYTES = 1_048_576;

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

type PanelState =
  | { kind: "component"; id: string }
  | { kind: "task"; ref: TaskRef }
  | null;

/** Pure viewport math for select-and-center (tested headlessly): the
 * node never moves, the viewport does. */
export function centerViewport(
  node: Pick<LayoutNode, "x" | "y">,
  containerWidth: number,
  containerHeight: number,
  scale: number,
): { x: number; y: number } {
  return {
    x: containerWidth / 2 - (node.x + 96) * scale,
    y: containerHeight / 2 - (node.y + 33) * scale,
  };
}

/** Relative-time text for the indexed-at hint. */
export function relativeTime(thenMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - thenMs) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** The header hint renders from the IN-SESSION outcome — never the
 * file (ADR-014: the committed payload carries no volatile stats). */
export function indexHint(
  outcome: IndexOutcomePayload | null,
  derived: DerivedArchitecture,
  nowMs: number,
): string {
  if (outcome?.kind === "indexed") {
    const base = `indexed ${relativeTime(outcome.indexedAtMs, nowMs)} · ${outcome.files} files`;
    return outcome.graphBytes > COLLECTOR_CAP_BYTES
      ? `${base} · over the snapshot cap`
      : base;
  }
  if (derived.indexNotRun) return "index not run";
  return `committed graph · ${derived.fileComponent.size} files`;
}

export function MapView({
  model,
  graphContent,
  indexing,
  indexOutcome,
  onRunIndex,
}: {
  model: ProjectParseResult;
  graphContent?: string;
  indexing: boolean;
  indexOutcome: IndexOutcomePayload | null;
  onRunIndex: () => void;
}) {
  // --- derivation (pure over the docs snapshot; memo hits on value-
  // stable graph bytes) -------------------------------------------------
  const parsed: GraphParseResult = useMemo(
    () => (graphContent === undefined ? { issues: [] } : parseGraph(graphContent)),
    [graphContent],
  );
  const derived = useMemo(
    () =>
      deriveArchitecture({
        components: model.components ?? [],
        tasks: model.tasks,
        ...(parsed.graph !== undefined ? { graph: parsed.graph } : {}),
      }),
    [model, parsed],
  );

  // --- layout: recomputes only when the structural key changes (rule 7
  // — status flips repaint, never move) ---------------------------------
  const structural = useMemo(() => {
    const components: LayoutComponentInput[] = derived.components.map((c) => ({
      id: c.id,
      kind: c.kind,
    }));
    const edges: LayoutEdgeInput[] = derived.edges.map((e) => ({
      from: e.from,
      to: e.to,
      declared: e.declared,
    }));
    return { components, edges, key: layoutKey(components, edges) };
  }, [derived]);
  const layoutCache = useRef<{ key: string; layout: MapLayout } | null>(null);
  if (layoutCache.current === null || layoutCache.current.key !== structural.key) {
    layoutCache.current = {
      key: structural.key,
      layout: layoutMap(structural.components, structural.edges),
    };
  }
  const layout = layoutCache.current.layout;

  // --- view state (session-ephemeral; T-022 owns persistence) ----------
  const [lens, setLens] = useState<MapLens>("architecture");
  const [overlay, setOverlay] = useState<MapOverlay>("status");
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<PanelState>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [focusedNode, setFocusedNode] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, scale: 1 });

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());

  // --- the turn to teal: one-shot per planned→…→done transition --------
  const prevStatuses = useRef<ReadonlyMap<string, DerivedStatus> | null>(null);
  const wipeNonce = useRef(0);
  const [wipes, setWipes] = useState<ReadonlyMap<string, { from: DerivedStatus; key: number }>>(
    new Map(),
  );
  useEffect(() => {
    const current = new Map<string, DerivedStatus>();
    for (const component of derived.components) {
      if (component.kind === "declared") current.set(component.id, component.status);
    }
    const previous = prevStatuses.current;
    prevStatuses.current = current;
    if (previous === null) return; // first render exempt
    const next = new Map(wipes);
    let changed = false;
    for (const [id, status] of current) {
      const before = previous.get(id);
      if (before !== undefined && before !== "done" && status === "done") {
        wipeNonce.current += 1;
        next.set(id, { from: before, key: wipeNonce.current });
        changed = true;
      }
    }
    if (changed) setWipes(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived]);

  // --- ⌘F focuses the search field while the map is mounted ------------
  // T-034: the chord is CLAIMED only while there is a field to focus.
  // The tasks lens renders no search, so claiming ⌘F there would swallow
  // a key and do nothing — T-049's "an absent entry is left completely
  // alone", applied at the moment the pane first gained a state where
  // the field is absent. Architecture behaviour is unchanged: the guard
  // reads true on every render of that lens.
  const lensRef = useRef(lens);
  lensRef.current = lens;
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (lensRef.current !== "architecture") return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        searchRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // --- interactions ----------------------------------------------------
  const select = (id: string): void => {
    setSelected(id);
    setPanel({ kind: "component", id });
  };
  const closePanel = (): void => {
    setPanel(null);
    setSelected(null); // Esc closes panel + clears selection (one state)
  };

  const centerOn = (id: string): void => {
    const node = layout.nodes.get(id);
    const container = canvasRef.current;
    if (node === undefined || container === null) return;
    setViewport((v) => ({
      ...v,
      ...centerViewport(node, container.clientWidth, container.clientHeight, v.scale),
    }));
  };

  const onWheel = (event: React.WheelEvent<HTMLDivElement>): void => {
    if (event.ctrlKey || event.metaKey) {
      // Pinch/ctrl-wheel zooms around the cursor; scale only, never
      // re-layout.
      const container = canvasRef.current;
      if (container === null) return;
      const rect = container.getBoundingClientRect();
      const px = event.clientX - rect.left;
      const py = event.clientY - rect.top;
      setViewport((v) => {
        const scale = Math.min(
          MAX_SCALE,
          Math.max(MIN_SCALE, v.scale * Math.exp(-event.deltaY * 0.01)),
        );
        const ratio = scale / v.scale;
        return { scale, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio };
      });
    } else {
      setViewport((v) => ({ ...v, x: v.x - event.deltaX, y: v.y - event.deltaY }));
    }
  };

  /** Arrow-key walking (settled silence): ↑/↓ previous/next slot in the
   * column; →/← first outgoing/incoming edge partner by id ascending.
   * The bundle's `→ = expand` collision belongs to T-013 (it owns
   * expansion). */
  const onNodeKeyDown = (event: React.KeyboardEvent, id: string): void => {
    const node = layout.nodes.get(id);
    if (node === undefined) return;
    let target: string | undefined;
    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const column = [...layout.nodes.values()]
        .filter((n) => n.col === node.col)
        .sort((a, b) => a.row - b.row);
      const index = column.findIndex((n) => n.id === id);
      target = column[event.key === "ArrowUp" ? index - 1 : index + 1]?.id;
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      const partners = layout.edges
        .filter((e) => (event.key === "ArrowRight" ? e.from === id : e.to === id))
        .map((e) => (event.key === "ArrowRight" ? e.to : e.from));
      target = partners.find((p) => layout.nodes.has(p));
    } else {
      return;
    }
    if (target !== undefined) {
      event.preventDefault();
      nodeRefs.current.get(target)?.focus();
    }
  };

  // --- render inputs ---------------------------------------------------
  const lit = hoveredNode ?? focusedNode;
  const litNeighborhood = lit !== null ? layout.neighborhood.get(lit) : undefined;
  const results = searchOpen ? searchMap(derived, query) : [];
  const truncatedFiles = parsed.graph?.stats?.truncatedFiles;
  const graphUnreadable = graphContent !== undefined && parsed.graph === undefined;

  const edgeUi = (from: string, to: string) => {
    const key = `${from}->${to}`;
    const liftedByNode = lit !== null && (from === lit || to === lit);
    const lifted = liftedByNode || hoveredEdge === key;
    return {
      lifted,
      backgrounded: lit !== null && !lifted,
      overlay,
    };
  };

  return (
    <section data-testid="map-view" data-overlay={overlay} className="flex min-h-0 flex-1 flex-col">
      {/* Pane header — chrome is panel-exempt (T-017 mechanism): using
          the overlay control, search, or Re-index must not cost an open
          panel. */}
      <div
        data-panel-exempt
        className="flex items-center justify-between gap-4 border-b border-hairline px-5 pt-3.5 pb-3.25"
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <h2 className="font-mono text-2xl font-bold tracking-wordmark">
            {lens === "tasks" ? "map · tasks" : "map"}
          </h2>
          {/* Lens control (architecture · tasks) — T-034. It keeps ONE
              home across both lenses (the README's pane-header order:
              wordmark · lens · search); the design's tasks screen parks
              it on the far right instead, and a segmented control that
              jumps across the header when you use it is a defect, not a
              design (recorded deviation). */}
          <div
            data-testid="map-lens-control"
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary p-0.75"
          >
            {MAP_LENSES.map((mode) => (
              <button
                key={mode}
                type="button"
                data-testid={`map-lens-${mode}`}
                aria-pressed={lens === mode}
                onClick={() => setLens(mode)}
                className={cn(
                  "rounded-chip px-2.75 py-1.25 font-mono text-xs",
                  lens === mode
                    ? "bg-primary text-primary-foreground"
                    : "text-secondary-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          {lens === "tasks" && (
            <p data-testid="map-lens-subtitle" className="truncate text-sm text-muted-foreground">
              what has to happen before what · the same {model.tasks.length} tasks, ordered by
              dependency instead of story
            </p>
          )}
          {lens === "architecture" && (
          <div className="relative">
            <span className="flex w-57.5 items-center gap-2 rounded-lg border border-border bg-sidebar px-2.75 py-1.5">
              <span aria-hidden="true" className="size-2.25 rounded-full icon-stroke border-muted-foreground" />
              <input
                ref={searchRef}
                data-testid="map-search"
                value={query}
                placeholder="components · files"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setSearchOpen(false)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    // Search closes itself FIRST; the panel's Esc stays
                    // layered underneath (stopPropagation).
                    event.stopPropagation();
                    setSearchOpen(false);
                    setQuery("");
                    event.currentTarget.blur();
                  } else if (event.key === "Enter" && results.length > 0) {
                    const first = results[0];
                    if (first !== undefined) {
                      select(first.componentId);
                      centerOn(first.componentId);
                      setSearchOpen(false);
                    }
                  }
                }}
                className="min-w-0 flex-1 bg-transparent font-mono text-xs outline-none placeholder:text-muted-foreground"
              />
            </span>
            {searchOpen && query.trim() !== "" && (
              <div
                data-testid="map-search-results"
                className="absolute top-full left-0 z-20 mt-1.5 w-80 overflow-hidden rounded-lg border border-map-node-border bg-popover shadow-map-popover"
              >
                {results.length === 0 ? (
                  <p className="px-3 py-2 font-mono text-xs text-muted-foreground">no matches</p>
                ) : (
                  results.map((result) => (
                    <button
                      key={`${result.kind}:${result.text}`}
                      type="button"
                      data-card-trigger
                      // onMouseDown beats the input's blur closing the list.
                      onMouseDown={(event) => {
                        event.preventDefault();
                        select(result.componentId);
                        centerOn(result.componentId);
                        setSearchOpen(false);
                        searchRef.current?.blur();
                      }}
                      className="flex w-full items-center gap-2.25 px-3 py-2 text-left hover:bg-muted"
                    >
                      <span className="min-w-0 flex-1 truncate font-mono text-xs">
                        {result.text}
                      </span>
                      <span
                        className={cn(
                          "shrink-0 font-mono text-map-meta",
                          result.warning ? "text-warning" : "text-muted-foreground",
                        )}
                      >
                        {result.tag}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          )}
        </div>
        {/* Search, the overlay control, the indexed-at hint and Re-index
            are ARCHITECTURE chrome: search runs over components and
            files, the overlay modes are the architecture model's layers,
            and Re-index regenerates graph.json — none of which the tasks
            lens reads. The design's tasks screen draws none of them
            either. */}
        {lens === "architecture" && (
        <div className="flex shrink-0 items-center gap-3">
          <div
            data-testid="map-overlay-control"
            className="flex items-center gap-1 rounded-lg bg-secondary p-0.75"
          >
            {/* status · provenance · drift — churn is ABSENT until
                T-013 supplies its git data (a disabled segment has no
                designed treatment). */}
            {MAP_OVERLAYS.map((mode) => (
              <button
                key={mode}
                type="button"
                data-testid={`map-overlay-${mode}`}
                aria-pressed={overlay === mode}
                onClick={() => setOverlay(mode)}
                className={cn(
                  "rounded-chip px-2.5 py-1.25 font-mono text-xs",
                  overlay === mode
                    ? "border border-map-node-border bg-background text-foreground"
                    : "text-secondary-foreground",
                )}
              >
                {mode}
              </button>
            ))}
          </div>
          {indexing ? (
            <span
              data-testid="map-index-hint"
              className="rounded-md border border-border bg-muted px-2.5 py-1.25 font-mono text-xs text-muted-foreground"
            >
              indexing…
            </span>
          ) : indexOutcome?.kind === "error" ? (
            <span
              data-testid="map-index-hint"
              title={indexOutcome.message}
              className="max-w-70 truncate rounded-md border border-border bg-muted px-2.5 py-1.25 font-mono text-xs text-muted-foreground"
            >
              index failed: {indexOutcome.message}
            </span>
          ) : (
            <span data-testid="map-index-hint" className="font-mono text-xs text-muted-foreground">
              {indexHint(indexOutcome, derived, Date.now())}
            </span>
          )}
          <Button
            variant="outline"
            data-testid="map-reindex"
            disabled={indexing}
            onClick={onRunIndex}
          >
            Re-index
          </Button>
        </div>
        )}
      </div>

      {lens === "tasks" && (
        <TasksLens model={model} onOpenTask={(ref) => setPanel({ kind: "task", ref })} />
      )}

      {lens === "architecture" && (
      <>
      {/* Degraded-state banners (never an error, never blank). */}
      {derived.mode !== "full" && (
        <div
          data-testid="map-degraded"
          data-mode={derived.mode}
          className="mx-5 mt-3 flex flex-col gap-2 rounded-lg border border-border bg-map-canvas px-3.5 py-3"
        >
          {(derived.mode === "no-components" || derived.mode === "empty") && (
            <p className="text-sm">
              <span className="font-semibold">no architecture declared</span>{" "}
              <span className="text-secondary-foreground">
                — looked in{" "}
                <span className="rounded-sm bg-muted px-1 font-mono text-xs">
                  docs/architecture/components/
                </span>
                {derived.mode === "no-components" &&
                  "; drawing inferred pseudo-components from the code instead"}
              </span>
            </p>
          )}
          {derived.indexNotRun && (
            <div className="flex items-center gap-2.5">
              <p className="text-sm text-secondary-foreground">
                {graphUnreadable
                  ? "graph.json is unreadable — re-indexing regenerates it (it is never hand-edited)"
                  : "index not run — declared components only, every edge planned"}
              </p>
              <Button
                variant="outline"
                data-testid="map-run-index"
                disabled={indexing}
                onClick={onRunIndex}
              >
                Run index
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Canvas: one transformed wrapper; HTML nodes over the SVG edge
          layer. Edge layer takes no pointer events; hit paths do. */}
      <div
        ref={canvasRef}
        data-testid="map-canvas"
        onWheel={onWheel}
        className="map-canvas-grid relative min-h-0 flex-1 overflow-hidden px-6 pt-5.5 pb-4.5"
      >
        {derived.components.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            nothing to draw yet — declare components or run the index
          </p>
        ) : (
          <div
            data-testid="map-transform"
            className="relative"
            style={{
              width: layout.width,
              height: layout.height,
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
              transformOrigin: "0 0",
            }}
          >
            <svg
              width={layout.width}
              height={layout.height}
              className="absolute top-0 left-0 overflow-visible"
              aria-hidden="true"
            >
              <MapEdgeMarkers />
              {derived.edges.map((edge) => {
                const laid = layout.edges.find(
                  (l) => l.from === edge.from && l.to === edge.to,
                );
                if (laid === undefined) return null;
                return (
                  <MapEdge
                    key={edgeKey(edge)}
                    edge={edge}
                    layout={laid}
                    ui={edgeUi(edge.from, edge.to)}
                    onHover={setHoveredEdge}
                  />
                );
              })}
            </svg>
            {/* Observed-count chips at the elbow anchors (lifted edges). */}
            {derived.edges.map((edge) => {
              const ui = edgeUi(edge.from, edge.to);
              const visual = edgeVisual(edge.relation, edge.observedCount, ui);
              if (!visual.showCount || edge.observedCount === 0) return null;
              const laid = layout.edges.find((l) => l.from === edge.from && l.to === edge.to);
              if (laid === undefined) return null;
              return (
                <span
                  key={`count:${edgeKey(edge)}`}
                  data-testid="map-edge-count"
                  className={cn(
                    "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 bg-map-canvas px-0.75 font-mono text-map-meta",
                    edge.relation === "undeclared" ? "text-warning" : "text-secondary-foreground",
                  )}
                  style={{ left: laid.labelAnchor.x, top: laid.labelAnchor.y }}
                >
                  {edge.observedCount}
                </span>
              );
            })}
            {derived.components.map((component) => {
              const node = layout.nodes.get(component.id);
              if (node === undefined) return null;
              const wipe = wipes.get(component.id);
              return (
                <MapNode
                  key={component.id}
                  component={component}
                  node={node}
                  findings={derived.findings}
                  ui={{
                    hovered: hoveredNode === component.id,
                    selected: selected === component.id,
                    focused: focusedNode === component.id,
                    dimmed:
                      lit !== null &&
                      lit !== component.id &&
                      litNeighborhood !== undefined &&
                      !litNeighborhood.has(component.id),
                    overlay,
                  }}
                  {...(wipe !== undefined ? { wipe } : {})}
                  buttonRef={(el) => {
                    if (el === null) nodeRefs.current.delete(component.id);
                    else nodeRefs.current.set(component.id, el);
                  }}
                  tabbable={
                    focusedNode === component.id ||
                    (focusedNode === null && component.id === derived.components[0]?.id)
                  }
                  onSelect={select}
                  onHover={setHoveredNode}
                  onFocus={setFocusedNode}
                  onKeyDown={onNodeKeyDown}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Legend strip — follows the active overlay mode. */}
      <div
        data-panel-exempt
        data-testid="map-legend"
        className="mx-5 flex flex-wrap items-center gap-5 border-t border-hairline pt-3 pb-3.5"
      >
        <span className="font-mono text-map-id tracking-overline text-muted-foreground uppercase">
          legend · {overlay}
        </span>
        {overlay === "status" && (
          <>
            <LegendLine label="confirmed">
              <svg width="22" height="4" aria-hidden="true">
                <line x1="0" y1="2" x2="22" y2="2" stroke="var(--map-edge)" strokeWidth="2" />
              </svg>
            </LegendLine>
            <LegendLine label="planned">
              <svg width="22" height="4" aria-hidden="true">
                <line
                  x1="1"
                  y1="2"
                  x2="22"
                  y2="2"
                  stroke="var(--map-legend-planned)"
                  strokeWidth="1.5"
                  strokeDasharray="0.1 4"
                  strokeLinecap="round"
                />
              </svg>
            </LegendLine>
            <LegendLine label="drift">
              <svg width="22" height="4" aria-hidden="true">
                <line
                  x1="0"
                  y1="2"
                  x2="22"
                  y2="2"
                  stroke="var(--warning)"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                />
              </svg>
            </LegendLine>
            <LegendLine label="unmapped">
              <span className="size-3.25 rounded-sm border border-dashed border-map-edge-planned bg-map-unmapped" />
            </LegendLine>
            <LegendLine label="declared-only">
              <span className="size-3.25 rounded-sm border border-dashed border-map-declared-only-border" />
            </LegendLine>
          </>
        )}
        {overlay === "provenance" && (
          <>
            <LegendLine label="checked">
              <svg viewBox="0 0 15 15" width="12" height="12" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="7.5" fill="var(--review-disc)" />
                <path
                  d="M4.4 7.8 6.5 9.9 10.6 5.4"
                  fill="none"
                  stroke="var(--review-mark)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </LegendLine>
            <LegendLine label="self">
              <svg viewBox="0 0 15 15" width="12" height="12" aria-hidden="true">
                <circle cx="7.5" cy="7.5" r="6.75" fill="none" stroke="var(--review-disc)" strokeWidth="1.5" />
                <path d="M7.5 0.75 A6.75 6.75 0 0 0 7.5 14.25 Z" fill="var(--review-disc)" />
              </svg>
            </LegendLine>
            <LegendLine label="unverified">
              <svg viewBox="0 0 15 15" width="12" height="12" aria-hidden="true">
                <circle
                  cx="7.5"
                  cy="7.5"
                  r="6.75"
                  fill="none"
                  stroke="var(--provenance-unverified)"
                  strokeWidth="1.5"
                  strokeDasharray="2.4 2.4"
                />
              </svg>
            </LegendLine>
          </>
        )}
        {overlay === "drift" && (
          <span data-testid="map-drift-footer" className="font-mono text-xs text-secondary-foreground">
            {driftFooter(derived.findings, derived.unmappedFiles)}
          </span>
        )}
        <span className="ml-auto flex items-center gap-4">
          {truncatedFiles !== undefined && truncatedFiles > 0 && (
            <span data-testid="map-truncation-note" className="font-mono text-map-id text-muted-foreground">
              symbols truncated for {truncatedFiles} files
            </span>
          )}
          <span className="font-mono text-map-id text-muted-foreground">
            time-machine scrubber lands here
          </span>
        </span>
      </div>
      </>
      )}

      {/* Panel: component drawer, or the REAL task detail on re-target. */}
      {panel?.kind === "component" && (
        <MapPanel
          derived={derived}
          componentId={panel.id}
          model={model}
          onOpenTask={(ref) => setPanel({ kind: "task", ref })}
          onClose={closePanel}
        />
      )}
      {panel?.kind === "task" && (
        <TaskDetailPanel
          model={model}
          taskRef={panel.ref}
          onOpen={(ref) => setPanel({ kind: "task", ref })}
          onClose={closePanel}
        />
      )}
    </section>
  );
}

function LegendLine({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.75 text-sm text-secondary-foreground">
      {children}
      {label}
    </span>
  );
}
