import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { ProjectParseResult } from "@supertaskr/parser/pure";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TaskDetailPanel } from "@/components/board/TaskDetailPanel";
import type { TaskRef } from "@/lib/task-detail";
import { UNANSWERED_INDEX_MESSAGE, type IndexOutcomePayload } from "@/lib/watcher-store";
import {
  deriveArchitecture,
  type DerivedArchitecture,
  type DerivedStatus,
} from "@/lib/architecture/derive";
import { parseGraph, type GraphParseResult } from "@/lib/architecture/graph";
import {
  componentTarget,
  fileTarget,
  partialGraph,
  type ArchDetail,
} from "@/lib/architecture/rollup";
import {
  getRollupState,
  loadDetail,
  loadRollup,
  subscribeRollup,
} from "./rollup-source";
import {
  layoutKey,
  layoutMap,
  type LayoutComponentInput,
  type LayoutEdgeInput,
  type LayoutNode,
  type MapLayout,
} from "./map-layout";
import {
  churnFooter,
  churnVisual,
  driftFooter,
  edgeVisual,
  MAP_OVERLAYS,
  type MapOverlay,
} from "./map-visuals";
import { attributeChurn, type ChurnAttribution } from "@/lib/architecture/churn";
import {
  churnDisabledSentence,
  getChurnState,
  loadChurn,
  subscribeChurn,
} from "./churn-source";
import { expansionFor, intraEdges, type Expansion } from "./map-zoom";
import { searchMap } from "./map-search";
import { MapEdge, MapEdgeMarkers, edgeKey } from "./MapEdge";
import { MapNode } from "./MapNode";
import { MapContainer } from "./MapContainer";
import { MapPanel, MapFilePanel } from "./MapPanel";
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
/* T-140-s4 — `COLLECTOR_CAP_BYTES` AND `graphSkip` ARE RETIRED HERE,
 * WITH `map-too-large`. THIS IS THE NOTE THAT OWES THE READER WHAT
 * SPEAKS NOW; the banner's own site below carries the ruling.
 *
 * All three said one thing in three places: *the committed graph is
 * subject to the docs collector's per-file cap, and may be withheld by
 * it.* `is_collected_docs_path` no longer admits the graph at any size
 * (docs_watch.rs), so that sentence is not merely unreachable — it is
 * FALSE, and a 1 MiB constant transcribed here would have gone on
 * printing "over the snapshot cap" about a file no snapshot carries.
 * `COLLECTOR_CAP_BYTES` was a second copy of `MAX_FILE_BYTES` living in
 * another language from the thing it claimed, which is the shape
 * CONVENTIONS' "a comment that restates a measured figure is a second
 * implementation" warns about; it is deleted rather than updated.
 *
 * WHAT THE PANE STILL READS ABOUT A GRAPH THAT COULD NOT FULLY ARRIVE:
 * `stats.truncatedSymbols` / `stats.truncatedFiles` in the graph itself,
 * rendered by the `no-graph`/oversize modes below and by the rollup's own
 * truncation flag. Those report DEGRADATION — symbols thin, files and
 * import edges intact — and degradation is the only failure this pipeline
 * still has. What left with the banner is the report of a CLIFF, and it
 * left because the cliff cannot happen: nothing between the emitter and
 * this pane discards the graph for being large. The cliff's remaining
 * cousin — the emitter spending its own budget — is reported outside the
 * app entirely, by `supertaskr_index::check`'s headroom alarm at
 * `index --check`.
 */

interface Viewport {
  x: number;
  y: number;
  scale: number;
}

type PanelState =
  | { kind: "component"; id: string }
  | { kind: "task"; ref: TaskRef }
  /** T-013 T2: a file's symbols and resolved edges, in the panel. */
  | { kind: "file"; path: string }
  | null;

/** Pure viewport math for select-and-center (tested headlessly): the
 * node never moves, the viewport does. */
export function centerViewport(
  node: Pick<LayoutNode, "x" | "y" | "h">,
  containerWidth: number,
  containerHeight: number,
  scale: number,
): { x: number; y: number } {
  return {
    x: containerWidth / 2 - (node.x + 96) * scale,
    // T-013: the box's own half-height, so centring an EXPANDED
    // container centres the container and not its title bar.
    y: containerHeight / 2 - (node.y + node.h / 2) * scale,
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
 * file (ADR-014: the committed payload carries no volatile stats).
 *
 * T-140-s4 took its fourth argument away. `graphSkip` was the one
 * STANDING fact it read, and it read it only where the outcome could not
 * answer (T-140): a graph the collector had withheld was indistinguishable
 * from an absent one in `derived`, so without it the hint said "index not
 * run" about a project whose index had run perfectly well. The collector
 * no longer withholds the graph — it no longer carries it — so the state
 * that argument existed to name cannot occur, and "index not run" is once
 * again the true answer whenever `derived` has no graph. The `· over the
 * snapshot cap` suffix went with it for the same reason and a sharper
 * one: it was still reachable, and after the removal it would have been
 * reachable and WRONG. */
export function indexHint(
  outcome: IndexOutcomePayload | null,
  derived: DerivedArchitecture,
  nowMs: number,
): string {
  if (outcome?.kind === "indexed") {
    return `indexed ${relativeTime(outcome.indexedAtMs, nowMs)} · ${outcome.files} files`;
  }
  if (derived.indexNotRun) return "index not run";
  return `committed graph · ${derived.indexedFileCount} files`;
}

/**
 * T-200: the `error` arm of `IndexOutcomePayload` carries TWO different
 * things, and only one of them is a failure.
 *
 * A REFUSAL is `index_repo` rejecting — `docs/architecture` is a symlink,
 * a read threw — and *"index failed"* is exactly right about it. An
 * ABSENCE is T-192's bound: the command did not answer inside
 * `INDEX_ANSWER_BOUND_MS`, so `runIndexRepo` settles the race itself and
 * releases the `indexing` latch rather than leaving the Re-index button
 * greyed for the rest of the session. Nothing was refused, the run may
 * still be in flight, and `UNANSWERED_INDEX_MESSAGE`'s own site says the
 * wording is about TIME, not blame — which this pane then contradicted in
 * its first three words, retracting itself inside one sentence.
 *
 * THE DISCRIMINATOR IS IDENTITY AGAINST THE CONSTANT, NEVER A SUBSTRING.
 * The bound's message is the one `runIndexRepo` writes, so this pane
 * compares against the exported constant itself: a reword moves both
 * sides in a single edit, and no rejection can sniff its way into the
 * calm arm the way `message.includes("did not answer")` would let one
 * (a real refusal quoting the indexer's own wording is the case that
 * breaks, and it is pinned in `map-view-dom.test.tsx`).
 *
 * WHY HERE AND NOT IN THE TYPE. Widening `IndexOutcomePayload` so an
 * absence is never spelled `error` is the cleaner shape and is NOT taken:
 * `watcher-store.ts` is C-10 (`app-shell`) and this card's fence is
 * `app-map` (C-12). Routed rather than widened — T-200's notes carry the
 * routing, and this comment is here so the next reader knows the shape
 * was chosen against an alternative rather than defaulted into.
 *
 * AND THE ABSENCE ARM DROPS THE MESSAGE FROM THE VISIBLE TEXT ON PURPOSE.
 * The chip is `max-w-70 truncate`, so a 130-character sentence is cut
 * around its fortieth character and the half that RETRACTS the blame is
 * reachable only by hovering — which is close to no retraction at all.
 * A short line that is still complete and true where it is cut beats a
 * long one whose correction never arrives; the whole sentence stays in
 * the `title`. A REFUSAL keeps its message inline, because there the
 * message IS the information and truncating it costs detail rather than
 * meaning.
 *
 * DELIBERATELY NOT EXPORTED, unlike `indexHint` above. This card's whole
 * subject is a sentence on a screen, and the acceptance criterion asks
 * for the RENDERED text rather than a return value — a body that could
 * call this directly would be pinning the same string one layer away from
 * the place it is wrong. Giving it no import surface is what keeps the
 * assertions in the DOM.
 */
function indexErrorText(message: string): string {
  if (message === UNANSWERED_INDEX_MESSAGE) return "no answer yet · re-index is safe";
  return `index failed: ${message}`;
}

export function MapView({
  model,
  graphContent,
  indexing,
  indexOutcome,
  onRunIndex,
}: {
  model: ProjectParseResult;
  /**
   * The whole committed graph, when something handed it over.
   *
   * **IT STAYS, AND T-140-s4 IS THE CARD THAT HAD TO DECIDE WHETHER IT
   * WOULD.** Removing the collector's `.json` branch and removing this
   * prop are two decisions, not one: the branch was the REAL APP's supply
   * of these bytes, and this prop is the input to the pane's documented
   * BROWSER fallback. `rollup-source.ts` answers `unavailable: notTauri`
   * in a served bundle — it has no `invoke` — and this pane then derives
   * from `graphContent` exactly as it did before the channel existed,
   * which is the honest degradation that module's own doc promises. The
   * feed is `window.__supertaskrDocsHarness.apply` (watcher-store.ts, DEV +
   * `!isTauri`), and `app/test/map-dogfood-render.test.tsx` drives this
   * path against the live repository's own graph on every `npm test`.
   *
   * So: undefined in the shipped desktop app from this card onward, and
   * load-bearing everywhere the channel cannot answer. Removing it would
   * remove the fallback, which nobody ruled.
   */
  graphContent?: string;
  indexing: boolean;
  indexOutcome: IndexOutcomePayload | null;
  onRunIndex: () => void;
}) {
  // --- the map channel (T-140-s1): the RESTING picture, and the pulled
  // slices of the graph the user has opened ------------------------------
  //
  // The rollup is asked for once per mount and re-asked on a project
  // switch by the store itself; `pulled` accumulates one detail answer
  // per target the user opened, and `partialGraph` assembles those into
  // the slice of the graph this pane is actually looking at. Everything
  // below then runs over an `ArchGraph` exactly as it did when the whole
  // file arrived over the docs watcher — one set of renderers, two
  // sources.
  const rollupState = useSyncExternalStore(subscribeRollup, getRollupState, getRollupState);
  useEffect(() => {
    void loadRollup();
  }, []);
  const [pulled, setPulled] = useState<ReadonlyMap<string, ArchDetail>>(new Map());
  const pull = (target: string): void => {
    void loadDetail(target).then((answer) => {
      if (answer.kind !== "answered") return;
      setPulled((prev) => {
        if (prev.get(target) === answer.detail) return prev;
        const next = new Map(prev);
        next.set(target, answer.detail);
        return next;
      });
    });
  };

  // --- derivation (pure over the docs snapshot; memo hits on value-
  // stable graph bytes) -------------------------------------------------
  const committed: GraphParseResult = useMemo(
    () => (graphContent === undefined ? { issues: [] } : parseGraph(graphContent)),
    [graphContent],
  );
  const slice: GraphParseResult | undefined = useMemo(
    // T-140-s1 verifier, correction 1: the sliced graph carries the
    // rollup's own truncation flag, so the oversize mode tells the
    // truth about symbols the emitter dropped.
    () =>
      partialGraph(
        pulled.values(),
        rollupState.kind === "ready" && rollupState.rollup.stats.truncatedSymbols,
      ),
    [pulled, rollupState],
  );
  /**
   * WHICH GRAPH THE T1/T2 RENDERERS READ. The committed file when it
   * arrived; otherwise the slice assembled from what has been pulled.
   * Never both: a half-committed, half-pulled graph would attribute file
   * edges against two different file sets, and the pane would draw an
   * edge between two components neither of which claims the file.
   */
  const parsed: GraphParseResult = committed.graph !== undefined ? committed : (slice ?? { issues: [] });
  const base = useMemo(
    () =>
      deriveArchitecture({
        components: model.components ?? [],
        tasks: model.tasks,
        ...(committed.graph !== undefined ? { graph: committed.graph } : {}),
        ...(rollupState.kind === "ready" ? { rollup: rollupState.rollup } : {}),
      }),
    [model, committed, rollupState],
  );
  /**
   * THE RESTING MODEL, HYDRATED WITH WHAT HAS BEEN PULLED (T-140-s1).
   *
   * `deriveFromRollup` leaves every `files` array empty and every count
   * exact — that is the shape. This memo patches the pulled paths back
   * in for the components the user has actually opened, so every
   * downstream reader (`expansionFor`, the panel's file list,
   * `searchMap`, `fileComponent` attribution) works from one model and
   * needs no idea where the paths came from. In the graph-derived mode
   * there is nothing to patch and this is the identity.
   */
  const derived = useMemo<DerivedArchitecture>(() => {
    if (pulled.size === 0 || base.mode !== "full") return base;
    const fileComponent = new Map(base.fileComponent);
    let touched = false;
    const components = base.components.map((component) => {
      const answer = pulled.get(componentTarget(component.id));
      const listAnswer =
        answer?.kind === "component" || answer?.kind === "unmapped" ? answer : undefined;
      const files = listAnswer?.files;
      if (listAnswer === undefined || files === undefined || component.files.length > 0)
        return component;
      touched = true;
      for (const path of files) fileComponent.set(path, component.id);
      // T-140-s1 verifier, correction 2: the channel clips at its cap
      // and says so (`total`, `truncated`); the derived component now
      // carries that honesty instead of dropping it here.
      return {
        ...component,
        files: [...files],
        ...(listAnswer.truncated
          ? { pulledTruncated: { shown: files.length, total: listAnswer.total } }
          : {}),
      };
    });
    if (!touched) return base;
    return {
      ...base,
      components,
      fileComponent,
      unmappedFiles:
        base.unmappedFiles.length > 0
          ? base.unmappedFiles
          : (components.find((c) => c.kind === "unmapped")?.files ?? base.unmappedFiles),
    };
  }, [base, pulled]);

  // --- T1: which components are open, and how tall each container is --
  // The heights are a pure function of the file lists, so they belong in
  // the STRUCTURAL key below: an expansion moves nodes, which is exactly
  // what rule 7 says may invalidate the layout cache.
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const expansions = useMemo(() => {
    const out = new Map<string, Expansion>();
    for (const component of derived.components) {
      if (!expanded.has(component.id)) continue;
      out.set(component.id, expansionFor(component.files));
    }
    return out;
  }, [derived, expanded]);
  const expandedHeights = useMemo(() => {
    const out = new Map<string, number>();
    for (const [id, expansion] of expansions) out.set(id, expansion.height);
    return out;
  }, [expansions]);

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
    return {
      components,
      edges,
      key: layoutKey(components, edges, expandedHeights),
    };
  }, [derived, expandedHeights]);
  const layoutCache = useRef<{ key: string; layout: MapLayout } | null>(null);
  if (layoutCache.current === null || layoutCache.current.key !== structural.key) {
    layoutCache.current = {
      key: structural.key,
      layout: layoutMap(structural.components, structural.edges, expandedHeights),
    };
  }
  const layout = layoutCache.current.layout;

  // --- churn (T-013): one command per mount, folded by the pane's own
  // source module. The store is read through useSyncExternalStore so the
  // pane holds no second copy of it. ------------------------------------
  const churnState = useSyncExternalStore(subscribeChurn, getChurnState, getChurnState);
  useEffect(() => {
    void loadChurn();
  }, []);
  const churn: ChurnAttribution = useMemo(
    () => attributeChurn(derived, churnState.kind === "measured" ? churnState.entries : []),
    [derived, churnState],
  );
  const churnAvailable = churnState.kind === "measured";

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

  // --- churn cannot be the active overlay while it is unavailable -----
  // (a disabled segment is unclickable, so this only fires when a
  // measured read is replaced by a disabled one — a project switch).
  useEffect(() => {
    if (!churnAvailable) setOverlay((mode) => (mode === "churn" ? "status" : mode));
  }, [churnAvailable]);

  // --- interactions ----------------------------------------------------
  //
  // T-140-s1: OPENING SOMETHING IS THE PULL'S TRIGGER, and it is wired at
  // exactly the three places that open something — selecting a component
  // (the panel lists its files), expanding one (T1 draws them as rows),
  // and opening a file (T2's symbols and edges). `loadDetail` is
  // single-flight per target and caches, so a second click on the same
  // node is free; when the pane already has the whole committed graph
  // these calls are answered from the cache-miss path and simply
  // overwrite nothing, because the hydration memo leaves a component that
  // already has its files alone.
  const select = (id: string): void => {
    setSelected(id);
    setPanel({ kind: "component", id });
    pull(componentTarget(id));
  };
  const openFile = (path: string): void => {
    setPanel({ kind: "file", path });
    pull(fileTarget(path));
  };
  const closePanel = (): void => {
    setPanel(null);
    setSelected(null); // Esc closes panel + clears selection (one state)
  };

  /** T1. A component with no files has nothing to open into, and a
   * container that says only "no indexed files" is a worse answer than
   * the panel's own placeholder. */
  const expandable = (id: string): boolean => {
    const component = derived.components.find((c) => c.id === id);
    // The COUNT, not the list: since T-140-s1 the list may be one pull
    // away, and a component with three hundred files must not read as
    // unexpandable because the paths have not arrived yet.
    return component !== undefined && component.fileCount > 0;
  };
  const expand = (id: string): void => {
    if (!expandable(id)) return;
    pull(componentTarget(id));
    setExpanded((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };
  const collapse = (id: string): void => {
    setExpanded((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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

  /**
   * Arrow-key walking, and T-013's reconciliation of the collision
   * T-012 left it.
   *
   * THE COLLISION: the bundle's interaction table maps `→` to EXPAND;
   * T-012 shipped `→`/`←` as "first outgoing/incoming edge partner".
   * Both survive, on the ARIA tree rule, which is what a reader already
   * knows from every file tree they have used: `→` on a COLLAPSED
   * expandable node opens it, and `→` on anything else walks the edge.
   * `←` collapses an OPEN one, and otherwise walks back. So the bundle's
   * mapping is honoured, edge-walking stays reachable (press `→` twice),
   * and neither behaviour has a key that silently does nothing.
   * `Esc` collapses too — the handoff's "Esc → collapse / deselect" —
   * and stops there, so it never also closes the panel in one press.
   */
  const onNodeKeyDown = (event: React.KeyboardEvent, id: string): void => {
    const node = layout.nodes.get(id);
    if (node === undefined) return;
    if (event.key === "Escape" && expanded.has(id)) {
      event.preventDefault();
      event.stopPropagation();
      collapse(id);
      return;
    }
    if (event.key === "ArrowRight" && !expanded.has(id) && expandable(id)) {
      event.preventDefault();
      expand(id);
      return;
    }
    if (event.key === "ArrowLeft" && expanded.has(id)) {
      event.preventDefault();
      collapse(id);
      return;
    }
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
            {/* status · provenance · drift · churn. T-012 left the churn
                segment ABSENT because a disabled one had no designed
                treatment; T-013's criterion asks for the opposite in as
                many words — "IF the project is not a git repo THEN the
                churn overlay SHALL be disabled, not broken" — so it is
                present and inert, with the ONE fixed sentence for its
                reason as the title. Absent would hide that churn exists;
                disabled says it exists and why it cannot answer here.
                The inert treatment (`cursor-not-allowed opacity-45`) is
                DESIGNED here, not reused: this is a raw segmented-control
                `<button>`, not the shadcn `Button` primitive Re-index is,
                so it cannot inherit that primitive's
                `disabled:pointer-events-none disabled:opacity-50` without
                becoming a Button and fighting the control's own styling.
                It is the smallest-reasonable choice for the state T-012's
                amendment asked to be designed, recorded as one rather
                than dressed up as a reuse. */}
            {MAP_OVERLAYS.map((mode) => {
              const off = mode === "churn" && !churnAvailable;
              return (
                <button
                  key={mode}
                  type="button"
                  data-testid={`map-overlay-${mode}`}
                  aria-pressed={overlay === mode}
                  disabled={off}
                  {...(off && churnState.kind === "disabled"
                    ? { title: `churn is off — ${churnDisabledSentence(churnState.reason)}` }
                    : {})}
                  {...(off ? { "data-disabled-reason": churnState.kind } : {})}
                  onClick={() => setOverlay(mode)}
                  className={cn(
                    "rounded-chip px-2.5 py-1.25 font-mono text-xs",
                    overlay === mode
                      ? "border border-map-node-border bg-background text-foreground"
                      : "text-secondary-foreground",
                    off && "cursor-not-allowed opacity-45",
                  )}
                >
                  {mode}
                </button>
              );
            })}
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
              {indexErrorText(indexOutcome.message)}
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
          {/* T-140-s4 — `map-too-large` STOOD HERE AND IS RETIRED BY
              @human's ruling of 2026-08-30 ("retire it"). THE RULING
              DID NOT DISCHARGE THE OBLIGATION, SO HERE IS THE SENTENCE
              IT OWES: what speaks now is `truncated_files` /
              `truncated_symbols` in the emitted graph and
              `supertaskr_index::check`'s headroom alarm at `index --check`,
              and both of those report DEGRADATION — symbols thinned,
              files and import edges kept. What vanishes with this banner
              is the report of a CLIFF that can no longer happen, because
              `is_collected_docs_path` no longer carries the graph at any
              size and a file that is never collected is never
              `SkipReason::Oversize`.

              WHAT IT SAID AND WHY IT MATTERED (T-140 built it as the
              answer to a measured silence): every other state in this
              banner has "Run index" as its remedy, and for a graph the
              collector had withheld that offer was the defect rather
              than the fix — the index HAD run, it wrote a correct graph,
              and the graph was larger than the channel carrying it, so
              pressing the button rewrote the same file. Silence was the
              behaviour before it and a false "index not run" was worse
              than silence. Both of those are gone with the state, not
              with the banner: "index not run" below is TRUE again
              whenever `derived` has no graph, and the arm that used to
              be its exception is the one this comment replaces. */}
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
          layer. Edge layer takes no pointer events; hit paths do.
          T-062 — `overflow-auto`, NOT `overflow-hidden`. This box is
          `min-h-0 flex-1`: it can shrink, and while it hid its overflow
          shrinking meant DELETING graph. Measured under a bounded frame
          before the fix, at 800x600: 446/392 with `overflow-y: hidden`
          — 54px of graph unreachable, no scrollbar anywhere, and not
          one assertion red (T-048 measured the same cell at 446/320
          before the pane header moved; the mechanism is the constant,
          not the number). It cost nothing while the shell was a growing
          page, because the canvas was never asked to shrink — which is
          exactly why nothing caught it. Fit-to-frame is deliberately
          NOT the answer here: T-012's layout is deterministic and
          pinned, and rescaling is a design decision (T-048-s2). */}
      <div
        ref={canvasRef}
        data-testid="map-canvas"
        onWheel={onWheel}
        className="map-canvas-grid relative min-h-0 flex-1 overflow-auto px-6 pt-5.5 pb-4.5"
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
              const churnFace =
                overlay === "churn" ? churnVisual(component, churn) : undefined;
              const expansion = expansions.get(component.id);
              const tabbable =
                focusedNode === component.id ||
                (focusedNode === null && component.id === derived.components[0]?.id);
              if (expansion !== undefined) {
                return (
                  <MapContainer
                    key={component.id}
                    component={component}
                    node={node}
                    expansion={expansion}
                    intra={intraEdges(component.id, derived, parsed.graph)}
                    {...(churnFace !== undefined ? { churn: churnFace } : {})}
                    selectedFile={panel?.kind === "file" ? panel.path : null}
                    onCollapse={collapse}
                    onSelectFile={openFile}
                    onSelectComponent={select}
                    containerRef={(el) => {
                      if (el === null) nodeRefs.current.delete(component.id);
                      else nodeRefs.current.set(component.id, el);
                    }}
                    tabbable={tabbable}
                    onKeyDown={onNodeKeyDown}
                    onFocus={setFocusedNode}
                    onHover={setHoveredNode}
                  />
                );
              }
              return (
                <MapNode
                  key={component.id}
                  component={component}
                  node={node}
                  findings={derived.findings}
                  {...(churnFace !== undefined ? { churn: churnFace } : {})}
                  expandable={component.fileCount > 0}
                  onExpand={expand}
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
                  tabbable={tabbable}
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
            {driftFooter(derived.findings, derived.unmappedCount)}
          </span>
        )}
        {overlay === "churn" && (
          <>
            <LegendLine label="edits">
              <span className="h-0.75 w-5.5 bg-muted-foreground" />
            </LegendLine>
            <LegendLine label="hottest">
              <span className="h-0.75 w-5.5 bg-secondary-foreground" />
            </LegendLine>
            <LegendLine label="nothing on paper">
              <span className="font-mono text-map-meta text-map-declared-only-foreground">
                —
              </span>
            </LegendLine>
            <span
              data-testid="map-churn-footer"
              className="font-mono text-xs text-secondary-foreground"
            >
              {churnState.kind === "measured"
                ? churnFooter(churnState.windowDays, churnState.commits, churn, {
                    truncated: churnState.truncated,
                    rejected: churnState.rejected,
                  })
                : churnState.kind === "disabled"
                  ? `churn is off — ${churnDisabledSentence(churnState.reason)}`
                  : "reading git…"}
            </span>
            {/* HOW OLD THAT NUMBER IS (T-116). The payload has carried
                `measuredAtMs` since T-013 and nothing rendered it, so a
                measurement taken this second and one taken before lunch
                read identically. It goes through `relativeTime` — the
                index hint's own function, one directory up in this same
                file — so the map has ONE spelling of "how old is this"
                and not a second (T-057).

                `measuredAtMs === 0` is what the boundary substitutes for
                a shape it could not read, so it renders NOTHING here: an
                age computed from the epoch would be a wrong timestamp,
                which is worse than no timestamp. */}
            {churnState.kind === "measured" && churnState.measuredAtMs > 0 && (
              <span
                data-testid="map-churn-age"
                className="font-mono text-xs text-muted-foreground"
              >
                measured {relativeTime(churnState.measuredAtMs, Date.now())}
              </span>
            )}
          </>
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
          churn={churn}
          churnState={churnState}
          onOpenTask={(ref) => setPanel({ kind: "task", ref })}
          onOpenFile={openFile}
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
      {panel?.kind === "file" && (
        <MapFilePanel
          derived={derived}
          {...(parsed.graph !== undefined ? { graph: parsed.graph } : { graph: undefined })}
          path={panel.path}
          onOpenComponent={select}
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
