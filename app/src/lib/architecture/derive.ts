/**
 * The derivation engine (T-011): intent ⨝ reality ⨝ tasks.
 *
 * Pure, DOM-free TypeScript — the T-004 selector pattern. Inputs are the
 * already-parsed layers (component records from @nputer/parser, the graph
 * from ./graph, the task model); the output is everything the map pane
 * renders. Nothing here touches Tauri, React, or IO, which is also what
 * satisfies the live-update criterion: the derived model is a pure
 * function of the docs snapshot's parse results, so recomputing it on the
 * existing T-003 snapshot path (T-012's wiring) needs no new IPC.
 *
 * Spec: docs/design/map-technical-plan.md §4 as revised by §0.0 (items 1
 * and 4 bind here), ADR-013/014/015/016. ADR-009 holds throughout: every
 * collection keyed by file-derived strings (component ids, paths, edge
 * keys, package ids, top-level dirs) is a Map/Set, never a plain object.
 */

import {
  compareComponentIds,
  type ComponentRecord,
  type ComponentStatus,
  type ParseIssue,
  type ReviewMode,
  type TaskRecord,
  type TaskStatus,
} from "@nputer/parser/pure";
import { claimingPattern, claimsDirContents, claimsPath } from "./glob";
import type { ArchGraph } from "./graph";
import type { ArchRollup } from "./rollup";

/** The synthetic catch-all node for files no component claims (plan §4.1). */
export const UNMAPPED_ID = "unmapped";

/** Effective component status: the six task statuses (never `auto`). */
export type DerivedStatus = Exclude<ComponentStatus, "auto">;

/**
 * Provenance rollup per §4.4 — the weakest guarantee among done tasks.
 * Three-way review data is PRESERVED here (`independent` vs `same-model`
 * vs `self-verified`): ADR-016 collapses to two visual marks at display
 * time (T-012), never in the data. `unreviewed` marks a done task with no
 * review stamp at all — weaker than self-verified (nothing was checked);
 * it renders as the no-mark state.
 */
export type DerivedProvenance = ReviewMode | "unreviewed";

/**
 * Edge relation per §4.2. `confirmed` = declared ∧ observed; `planned` =
 * declared only; `undeclared` = observed only — DRIFT, always amber.
 * `observed` appears ONLY in the inferred (no-components) degraded mode,
 * where no intent layer exists to confirm or contradict: reality-only
 * edges are not drift, so the undeclared ⇒ drift invariant stays safe for
 * renderers in every mode.
 */
export type EdgeRelation = "confirmed" | "planned" | "undeclared" | "observed";

/** One file-level edge behind a component edge (panel drill-down, §6.3). */
export interface ObservedFileEdge {
  /** Source file path. */
  from: string;
  /** Target file path — or the package's repo path for package joins. */
  to: string;
  /** Present when the edge went through a package node (`p:` id). */
  package?: string;
}

export interface DerivedEdge {
  from: string;
  to: string;
  relation: EdgeRelation;
  /** True when the source component declares this dependency. */
  declared: boolean;
  /** Number of file-level import edges behind it (0 for planned). */
  observedCount: number;
  fileEdges: ObservedFileEdge[];
}

export type DerivedComponentKind =
  /** A registry component (docs/architecture/components/). */
  | "declared"
  /** Top-level-directory pseudo-component (no-components degraded mode). */
  | "inferred"
  /** The synthetic unmapped node. */
  | "unmapped"
  /** Target of a dangling depends_on — drawn so the edge stays visible. */
  | "placeholder";

/** One task behind a component's rollup (panel list, newest first). */
export interface DerivedTaskRef {
  id?: string;
  title: string;
  status: TaskStatus;
  review?: ReviewMode;
  file: string;
  /**
   * False for `suggested`/`parked` tasks: they are listed for the panel
   * but do not participate in the status rollup (§4.3 names the six
   * committed statuses; an untriaged ghost or a deliberate not-now must
   * not drag a component's color).
   */
  inRollup: boolean;
}

export interface DerivedComponent {
  id: string;
  name: string;
  kind: DerivedComponentKind;
  layer?: string;
  /** Effective status: the pin when pinned, else the §4.3 rollup. */
  status: DerivedStatus;
  /** True when the component file pins `status:` (≠ auto). */
  pinned: boolean;
  /** What the rollup says regardless of the pin (panel explainability). */
  autoStatus: DerivedStatus;
  /** §4.4 rollup; absent when the component has no done tasks. */
  provenance?: DerivedProvenance;
  /**
   * Matched graph file paths (graph order = path-sorted).
   *
   * **EMPTY AT REST SINCE T-140-s1, AND THAT IS THE SHAPE.** When the
   * reality side comes from the rollup channel this array is empty and
   * [`fileCount`] carries the number; the paths arrive on a PULL, for the
   * one component the user opened. Read `fileCount` for a count and never
   * `files.length` — the two agree only in the graph-derived mode, and a
   * renderer that reads the length is a renderer that reports zero files
   * for a component that has hundreds.
   */
  files: string[];
  /**
   * How many indexed files this component claims — the count that is true
   * in EVERY mode. Equals `files.length` when the model was derived from
   * a graph, and comes from the rollup otherwise.
   */
  fileCount: number;
  /**
   * Present only when a PULL's file list was clipped at the channel's
   * cap (T-140-s1 verifier, correction 2): `shown` paths arrived of
   * `total` — the panel owes the reader the difference in words.
   */
  pulledTruncated?: { shown: number; total: number };
  /** Declared component whose globs match no indexed file (full mode). */
  declaredOnly: boolean;
  /**
   * The component file's opt-in `non_code:` flag (T-033 decision 2), read
   * straight off the record — never inferred here from `files.length`.
   * `declaredOnly && nonCode` is "nothing here is walkable"; `declaredOnly
   * && !nonCode` is still the honest not-yet-built amber.
   */
  nonCode: boolean;
  /** §4.5: source of a D1, or has a NON-informational D3/D5, or is
   * unmapped with D2. An informational D3 (non_code) is deliberately not
   * drift — that is the whole downgrade. */
  hasDrift: boolean;
  /** Tasks whose touches/component: pull them into this component. */
  tasks: DerivedTaskRef[];
  /** The source record (responsibility prose etc.); declared kind only. */
  record?: ComponentRecord;
}

/**
 * TRUE when a finding counts as DRIFT (T-033 decision 2). Every finding
 * does except an INFORMATIONAL D3 — a component whose file opts into
 * `non_code:`, where "declared but matching no indexed file" is a
 * statement about what the component IS rather than a divergence. The
 * finding is still reported and still explained; it just stops lighting
 * amber.
 *
 * IT LIVES HERE, IN THE ENGINE, AND THE RENDERER RE-EXPORTS IT. The first
 * cut of this change put it in `map-visuals.ts` and left `hasDrift` below
 * testing `!finding.informational` inline, which is TWO implementations of
 * one rule — T-057's disease. The drill found it: mutating the visuals
 * copy reddened the ring tests and left the dogfood's `hasDrift`
 * assertion green, which is the two copies disagreeing in miniature.
 */
export function isDriftFinding(finding: DriftFinding): boolean {
  return !(finding.rule === "D3" && finding.informational);
}

/**
 * Drift findings (§4.5), each with a stable content-derived id.
 *
 * **THE FILE-KEYED MEMBERS CARRY A COUNT SINCE T-140-s1.** D1's
 * `fileEdges`, D2's `files` and D4's `path`/`ids` are file-level detail:
 * they are populated in the graph-derived mode and EMPTY in the rollup
 * mode, where the count travels instead. Every renderer reads the count
 * and falls back to the list — `map-visuals.ts`'s `findingText` is the
 * one place that decides how each degrades, and it does so per rule.
 */
export type DriftFinding =
  | {
      rule: "D1";
      id: string;
      from: string;
      to: string;
      fileEdges: ObservedFileEdge[];
      /** File-level import edges behind it — true in both modes. */
      observedCount: number;
    }
  | { rule: "D2"; id: string; files: string[]; count: number }
  /** D3 declared-only. `informational` is set from the component file's
   * opt-in `non_code:` flag: the finding is still REPORTED (the fact is
   * true and explainable) but stops counting as drift. */
  | { rule: "D3"; id: string; component: string; informational: boolean }
  /** D4 ambiguous mapping. One finding per path in the graph-derived
   * mode; ONE TALLY (`path: ""`, `ids: []`) in the rollup mode, where the
   * per-path bodies are the pull's. */
  | { rule: "D4"; id: string; path: string; ids: string[]; count: number }
  | { rule: "D5"; id: string; from: string; to: string };

export type DerivedMode = "full" | "no-graph" | "no-components" | "empty";

export interface DerivedArchitecture {
  mode: DerivedMode;
  /** Graph absent/unreadable: declared intent only, "index not run". */
  indexNotRun: boolean;
  /** No declared components: pseudo-components inferred from top dirs. */
  inferred: boolean;
  components: DerivedComponent[];
  edges: DerivedEdge[];
  findings: DriftFinding[];
  /**
   * Every indexed file path → owning component id (ADR-009 Map).
   *
   * EMPTY in the rollup mode — the join happened in Rust and the paths
   * did not travel. Read [`indexedFileCount`] for "how many files", never
   * `fileComponent.size`.
   */
  fileComponent: ReadonlyMap<string, string>;
  /** Indexed files the reality layer knows about, true in every mode. */
  indexedFileCount: number;
  /**
   * Unclaimed territory, byte-sorted (grouped by the D2 finding): file
   * paths no component claims, plus repo-internal package paths (the
   * §6.6 file:-dep seam) no component owns. EMPTY in the rollup mode —
   * see [`unmappedCount`], which is true in both.
   */
  unmappedFiles: string[];
  /** How many paths no component claims, true in every mode. */
  unmappedCount: number;
  /**
   * Derivation-level issues in lib-parser's ParseIssue shape — file-level
   * `ambiguous-mapping` lands here (the T-008 charter: parse time flags
   * provable pattern overlap; derivation flags real-tree overlap through
   * the same kind).
   */
  issues: ParseIssue[];
}

export interface DeriveInputs {
  /** Parsed registry (empty array = no architecture declared). */
  components: readonly ComponentRecord[];
  /** Parsed graph, or undefined when absent/unreadable. */
  graph?: ArchGraph;
  /**
   * The RESTING payload from the map channel (T-140-s1), when it
   * answered. **It wins over `graph`**: it is the reality side computed
   * where the file list already lives, it is flat in project size, and it
   * is available for projects whose graph is too large to deliver over
   * the docs watcher — which is the whole wall this shape removes. The
   * graph stays as the fallback for a browser bundle, which has no
   * channel, and for the dev harness.
   */
  rollup?: ArchRollup;
  /** Parsed task model (the board's same input). */
  tasks: readonly TaskRecord[];
}

/** Deterministic text order (numeric-aware for T-9 < T-10 style ids). */
const byText = (a: string, b: string): number => a.localeCompare(b, "en", { numeric: true });

/** Byte order for paths — the committed graph's own sort convention. */
const byPath = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const KIND_ORDER: Record<DerivedComponentKind, number> = {
  declared: 0,
  inferred: 0,
  placeholder: 1,
  unmapped: 2,
};

/** The six committed statuses participate in the rollup; ghosts don't. */
const ROLLUP_STATUSES: ReadonlySet<TaskStatus> = new Set([
  "planned",
  "building",
  "verifying",
  "rejected",
  "merging",
  "done",
]);

/** §4.3 rollup, first rule that fires wins. */
export function rollupStatus(statuses: readonly TaskStatus[]): DerivedStatus {
  const committed = statuses.filter((status) => ROLLUP_STATUSES.has(status));
  if (committed.includes("rejected")) return "rejected";
  if (committed.includes("verifying")) return "verifying";
  if (committed.includes("building")) return "building";
  if (committed.includes("merging")) return "merging";
  if (committed.length > 0 && committed.every((status) => status === "done")) return "done";
  return "planned";
}

const PROVENANCE_RANK: Record<DerivedProvenance, number> = {
  independent: 3,
  "same-model": 2,
  "self-verified": 1,
  unreviewed: 0,
};

/** §4.4: weakest guarantee among done tasks; undefined when none done. */
export function rollupProvenance(tasks: readonly DerivedTaskRef[]): DerivedProvenance | undefined {
  let weakest: DerivedProvenance | undefined;
  for (const task of tasks) {
    if (task.status !== "done") continue;
    const provenance: DerivedProvenance = task.review ?? "unreviewed";
    if (weakest === undefined || PROVENANCE_RANK[provenance] < PROVENANCE_RANK[weakest]) {
      weakest = provenance;
    }
  }
  return weakest;
}

/** `component:` values from a task's preserved extra frontmatter. */
function componentRefs(task: TaskRecord): string[] {
  const raw = task.extra["component"];
  if (typeof raw === "string") return [raw.trim()];
  if (Array.isArray(raw)) {
    return raw.filter((entry): entry is string => typeof entry === "string").map((e) => e.trim());
  }
  return [];
}

/** Newest first: numeric-aware id desc, id-less last, then file asc. */
function byNewestTask(a: DerivedTaskRef, b: DerivedTaskRef): number {
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return byText(b.id, a.id);
  if ((a.id === undefined) !== (b.id === undefined)) return a.id === undefined ? 1 : -1;
  return byText(a.file, b.file);
}

function toTaskRef(task: TaskRecord): DerivedTaskRef {
  const ref: DerivedTaskRef = {
    title: task.title,
    status: task.status,
    file: task.file,
    inRollup: ROLLUP_STATUSES.has(task.status),
  };
  if (task.id !== undefined) ref.id = task.id;
  if (task.review !== undefined) ref.review = task.review;
  return ref;
}

/** Tasks pulled into a component: touches ∩ touch_slugs, or component:. */
function tasksForComponent(component: ComponentRecord, tasks: readonly TaskRecord[]): DerivedTaskRef[] {
  const slugs = new Set(component.touchSlugs);
  const refs: DerivedTaskRef[] = [];
  for (const task of tasks) {
    const bySlug = task.touches.some((slug) => slugs.has(slug));
    const byField = componentRefs(task).includes(component.id);
    if (bySlug || byField) refs.push(toTaskRef(task));
  }
  refs.sort(byNewestTask);
  return refs;
}

interface MutableEdge {
  from: string;
  to: string;
  declared: boolean;
  fileEdges: ObservedFileEdge[];
}

const edgeKey = (from: string, to: string): string => `${from}\u0000${to}`;

const compareEdges = (a: DerivedEdge, b: DerivedEdge): number =>
  compareComponentIds(a.from, b.from) || compareComponentIds(a.to, b.to);

const compareFileEdges = (a: ObservedFileEdge, b: ObservedFileEdge): number =>
  byPath(a.from, b.from) || byPath(a.to, b.to);

/**
 * Derive the architecture model. Total over its inputs: any combination
 * of absent layers degrades per plan §6.5 — never a crash, never a blank.
 */
export function deriveArchitecture(inputs: DeriveInputs): DerivedArchitecture {
  const { graph, rollup, tasks } = inputs;
  const hasComponents = inputs.components.length > 0;
  const hasGraph = graph !== undefined;

  if (hasComponents) {
    const components = [...inputs.components].sort((a, b) => compareComponentIds(a.id, b.id));
    // The channel wins when it answered: it is the reality side computed
    // where the file list lives, and it is available for trees whose
    // graph cannot ride the docs watcher.
    if (rollup !== undefined) return deriveFromRollup(components, rollup, tasks);
    return deriveDeclared(components, graph, tasks);
  }
  if (hasGraph) return deriveInferred(graph);
  return {
    mode: "empty",
    indexNotRun: true,
    inferred: false,
    components: [],
    edges: [],
    findings: [],
    fileComponent: new Map(),
    indexedFileCount: 0,
    unmappedFiles: [],
    unmappedCount: 0,
    issues: [],
  };
}

/** Declared-intent modes: `full` (with graph) and `no-graph`. */
function deriveDeclared(
  components: ComponentRecord[],
  graph: ArchGraph | undefined,
  tasks: readonly TaskRecord[],
): DerivedArchitecture {
  const issues: ParseIssue[] = [];
  const findings: DriftFinding[] = [];
  const declaredIds = new Set(components.map((component) => component.id));

  // --- File → component mapping (§4.1) + file-level D4 (T-008 charter).
  const fileComponent = new Map<string, string>();
  const filesPerComponent = new Map<string, string[]>();
  // Unclaimed territory (feeds D2 and the synthetic node): indexed files
  // no component claims, plus repo-internal package paths no component
  // owns — both are reality the intent layer does not account for.
  const unclaimed = new Set<string>();
  const ambiguous: { path: string; ids: string[] }[] = [];
  if (graph !== undefined) {
    for (const file of graph.files) {
      const claimants = components.filter((c) => claimsPath(c.paths, file.path)).map((c) => c.id);
      const winner = claimants[0];
      if (winner === undefined) {
        fileComponent.set(file.path, UNMAPPED_ID);
        unclaimed.add(file.path);
        continue;
      }
      fileComponent.set(file.path, winner);
      const bucket = filesPerComponent.get(winner);
      if (bucket === undefined) filesPerComponent.set(winner, [file.path]);
      else bucket.push(file.path);
      if (claimants.length > 1) ambiguous.push({ path: file.path, ids: claimants });
    }
  }

  const byId = new Map(components.map((component) => [component.id, component]));
  for (const { path, ids } of ambiguous) {
    findings.push({ rule: "D4", id: `D4:${path}`, path, ids, count: 1 });
    const winner = byId.get(ids[0] as string) as ComponentRecord;
    for (const loserId of ids.slice(1)) {
      const loser = byId.get(loserId) as ComponentRecord;
      issues.push({
        kind: "ambiguous-mapping",
        ids: [winner.id, loser.id],
        files: [winner.file, loser.file],
        patterns: [
          claimingPattern(winner.paths, path) ?? "",
          claimingPattern(loser.paths, path) ?? "",
        ],
        message:
          `${JSON.stringify(path)} is claimed by both ${winner.id} and ${loser.id}; ` +
          `first by component id order wins (${winner.id})`,
      });
    }
  }

  // --- Observed component edges (§4.2): file→file imports crossing a
  // boundary, plus the package.path join (T-009 §6.6 seam): a package
  // node with a repo-internal path belongs to the component that owns
  // that directory, so app-file → package edges materialize here. This
  // is what turns the C-0x → C-06 file: dependency into a real observed
  // edge instead of a silently-absent one.
  const edgesByKey = new Map<string, MutableEdge>();
  const observe = (from: string, to: string, fileEdge: ObservedFileEdge): void => {
    const key = edgeKey(from, to);
    let edge = edgesByKey.get(key);
    if (edge === undefined) {
      edge = { from, to, declared: false, fileEdges: [] };
      edgesByKey.set(key, edge);
    }
    edge.fileEdges.push(fileEdge);
  };

  if (graph !== undefined) {
    const dirOwnerCache = new Map<string, string | undefined>();
    const dirOwner = (dir: string): string | undefined => {
      if (dirOwnerCache.has(dir)) return dirOwnerCache.get(dir);
      const owner = components.find((c) => claimsDirContents(c.paths, dir))?.id;
      dirOwnerCache.set(dir, owner);
      return owner;
    };
    for (const edge of graph.edges) {
      if (edge.kind !== "import") continue;
      if (!edge.from.startsWith("f:")) continue; // imports originate in files
      const fromFile = graph.filesById.get(edge.from);
      if (fromFile === undefined) continue;
      const fromComponent = fileComponent.get(fromFile.path);
      if (fromComponent === undefined) continue;
      let toComponent: string;
      let fileEdge: ObservedFileEdge;
      if (edge.to.startsWith("f:")) {
        const toFile = graph.filesById.get(edge.to);
        if (toFile === undefined) continue;
        toComponent = fileComponent.get(toFile.path) ?? UNMAPPED_ID;
        fileEdge = { from: fromFile.path, to: toFile.path };
      } else if (edge.to.startsWith("p:")) {
        const pkg = graph.packagesById.get(edge.to);
        if (pkg === undefined || pkg.path === undefined) continue; // external package: no component edge
        const owner = dirOwner(pkg.path);
        if (owner === undefined) unclaimed.add(pkg.path); // unowned territory → D2
        toComponent = owner ?? UNMAPPED_ID;
        fileEdge = { from: fromFile.path, to: pkg.path, package: pkg.id };
      } else {
        continue; // symbol-level edges feed T2, not component edges
      }
      if (fromComponent === toComponent) continue;
      observe(fromComponent, toComponent, fileEdge);
    }
  }

  // --- Declared edges + D5 placeholders (§2: dangling edges are drawn,
  // never dropped).
  const placeholderIds = new Set<string>();
  for (const component of components) {
    for (const target of new Set(component.dependsOn)) {
      if (!declaredIds.has(target)) {
        findings.push({
          rule: "D5",
          id: `D5:${component.id}->${target}`,
          from: component.id,
          to: target,
        });
        placeholderIds.add(target);
      }
      const key = edgeKey(component.id, target);
      const edge = edgesByKey.get(key);
      if (edge === undefined) {
        edgesByKey.set(key, { from: component.id, to: target, declared: true, fileEdges: [] });
      } else {
        edge.declared = true;
      }
    }
  }

  // --- Relations (§4.2 table; unmapped edges are always undeclared —
  // a depends_on naming the literal string "unmapped" is a dangling
  // reference, never a declaration of the synthetic node).
  const edges: DerivedEdge[] = [...edgesByKey.values()]
    .map((edge) => {
      const observed = edge.fileEdges.length > 0;
      const touchesUnmapped = edge.from === UNMAPPED_ID || edge.to === UNMAPPED_ID;
      const relation: EdgeRelation =
        observed && (touchesUnmapped || !edge.declared)
          ? "undeclared"
          : observed
            ? "confirmed"
            : "planned";
      return {
        from: edge.from,
        to: edge.to,
        relation,
        declared: edge.declared,
        observedCount: edge.fileEdges.length,
        fileEdges: [...edge.fileEdges].sort(compareFileEdges),
      };
    })
    .sort(compareEdges);

  // --- D1 (undeclared dependency): drift between declared components.
  // Edges touching the synthetic unmapped node are covered by D2 — the
  // files, not the components, are the finding there.
  for (const edge of edges) {
    if (edge.relation !== "undeclared") continue;
    if (!declaredIds.has(edge.from) || !declaredIds.has(edge.to)) continue;
    findings.push({
      rule: "D1",
      id: `D1:${edge.from}->${edge.to}`,
      from: edge.from,
      to: edge.to,
      fileEdges: edge.fileEdges,
      observedCount: edge.fileEdges.length,
    });
  }

  // --- D2 (unclaimed territory, one grouped finding) and D3 (declared-only).
  const unmappedFiles = [...unclaimed].sort(byPath);
  if (unmappedFiles.length > 0) {
    findings.push({
      rule: "D2",
      id: `D2:${UNMAPPED_ID}`,
      files: [...unmappedFiles],
      count: unmappedFiles.length,
    });
  }
  if (graph !== undefined) {
    for (const component of components) {
      if (!filesPerComponent.has(component.id)) {
        findings.push({
          rule: "D3",
          id: `D3:${component.id}`,
          component: component.id,
          // READ, never inferred: `!filesPerComponent.has(id)` is the
          // condition we are already inside, so deriving the flag from it
          // here would make EVERY D3 informational and erase the
          // not-yet-built signal entirely.
          informational: component.nonCode,
        });
      }
    }
  }

  findings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // --- Drift flags per component (§4.5 definition).
  const driftSources = new Set<string>();
  for (const finding of findings) {
    if (finding.rule === "D1" || finding.rule === "D5") driftSources.add(finding.from);
    else if (finding.rule === "D3" && isDriftFinding(finding)) driftSources.add(finding.component);
    else if (finding.rule === "D2") driftSources.add(UNMAPPED_ID);
  }

  // --- Nodes: declared components (+ placeholders, + unmapped last).
  const derivedComponents: DerivedComponent[] = components.map((component) => {
    const componentTasks = tasksForComponent(component, tasks);
    const autoStatus = rollupStatus(
      componentTasks.filter((task) => task.inRollup).map((task) => task.status),
    );
    const pinned = component.status !== "auto";
    const derived: DerivedComponent = {
      id: component.id,
      name: component.name,
      kind: "declared",
      status: pinned ? (component.status as DerivedStatus) : autoStatus,
      pinned,
      autoStatus,
      files: filesPerComponent.get(component.id) ?? [],
      fileCount: filesPerComponent.get(component.id)?.length ?? 0,
      declaredOnly: graph !== undefined && !filesPerComponent.has(component.id),
      nonCode: component.nonCode,
      hasDrift: driftSources.has(component.id),
      tasks: componentTasks,
      record: component,
    };
    if (component.layer !== undefined) derived.layer = component.layer;
    const provenance = rollupProvenance(componentTasks);
    if (provenance !== undefined) derived.provenance = provenance;
    return derived;
  });

  for (const id of [...placeholderIds].sort(compareComponentIds)) {
    // A dangling depends_on naming the literal synthetic id must not
    // duplicate the unmapped node created below.
    if (id === UNMAPPED_ID && unmappedFiles.length > 0) continue;
    derivedComponents.push({
      id,
      name: id,
      kind: "placeholder",
      status: "planned",
      pinned: false,
      autoStatus: "planned",
      files: [],
      fileCount: 0,
      declaredOnly: false,
      nonCode: false,
      hasDrift: false,
      tasks: [],
    });
  }

  if (unmappedFiles.length > 0) {
    derivedComponents.push({
      id: UNMAPPED_ID,
      name: UNMAPPED_ID,
      kind: "unmapped",
      status: "planned",
      pinned: false,
      autoStatus: "planned",
      files: [...unmappedFiles],
      fileCount: unmappedFiles.length,
      declaredOnly: false,
      nonCode: false,
      hasDrift: true,
      tasks: [],
    });
  }

  derivedComponents.sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || compareComponentIds(a.id, b.id),
  );

  return {
    mode: graph !== undefined ? "full" : "no-graph",
    indexNotRun: graph === undefined,
    inferred: false,
    components: derivedComponents,
    edges,
    findings,
    fileComponent,
    indexedFileCount: fileComponent.size,
    unmappedFiles,
    unmappedCount: unmappedFiles.length,
    issues,
  };
}

/**
 * T-140-s1 — the resting derivation, from the CHANNEL rather than from
 * the graph.
 *
 * **WHAT MOVED AND WHAT DID NOT.** The reality side — file→component
 * mapping, observed component edges with counts, the relation table, the
 * findings — was computed in Rust by `nputer-index`'s `arch` module,
 * which has reproduced this file's answer on this repository's live tree
 * row for row since T-014. What did NOT move, and must not, is
 * everything ADR-015 assigns to TypeScript: the status rollup, the
 * provenance rollup, the task join, the `component:` field, ADR-016's
 * marks and the `non_code:` downgrade. Those are computed HERE, over the
 * same registry records and task records `deriveDeclared` uses, from the
 * same functions — `tasksForComponent`, `rollupStatus`,
 * `rollupProvenance`, `isDriftFinding`. There is one implementation of
 * each, and this path calls it.
 *
 * **WHAT IS ABSENT AND WHY THAT IS THE POINT.** No file paths. `files` is
 * empty on every component, `fileComponent` is empty, `unmappedFiles` is
 * empty — and the corresponding COUNTS are exact. A pane that wants the
 * paths asks for them, for the one thing on screen (`loadDetail`), which
 * is the trade the whole card is: the resting payload stops growing with
 * the project, and the price is a request when somebody drills in.
 */
function deriveFromRollup(
  components: ComponentRecord[],
  rollup: ArchRollup,
  tasks: readonly TaskRecord[],
): DerivedArchitecture {
  const declaredIds = new Set(components.map((component) => component.id));
  const byId = new Map(components.map((component) => [component.id, component]));

  const edges: DerivedEdge[] = rollup.edges
    .map((edge) => ({
      from: edge.from,
      to: edge.to,
      // The relation is Rust's, not recomputed: two implementations of
      // one rule is T-057's disease, and this is the side that owns it.
      relation: edge.relation as EdgeRelation,
      declared: edge.declared,
      observedCount: edge.observed,
      fileEdges: [] as ObservedFileEdge[],
    }))
    .sort(compareEdges);

  const findings: DriftFinding[] = [];
  const placeholderIds = new Set<string>();
  for (const finding of rollup.findings) {
    switch (finding.rule) {
      case "D1":
        if (finding.from !== undefined && finding.to !== undefined) {
          findings.push({
            rule: "D1",
            id: finding.id,
            from: finding.from,
            to: finding.to,
            fileEdges: [],
            observedCount:
              rollup.edges.find((e) => e.from === finding.from && e.to === finding.to)?.observed ?? 0,
          });
        }
        break;
      case "D2":
        findings.push({
          rule: "D2",
          id: finding.id,
          files: [],
          count: finding.count ?? 0,
        });
        break;
      case "D3":
        if (finding.component !== undefined) {
          findings.push({
            rule: "D3",
            id: finding.id,
            component: finding.component,
            // READ from the component file, never inferred from the
            // count — the exact rule `deriveDeclared` states, and the
            // reason the intent side stays TypeScript's.
            informational: byId.get(finding.component)?.nonCode ?? false,
          });
        }
        break;
      case "D4":
        findings.push({
          rule: "D4",
          id: finding.id,
          path: "",
          ids: [],
          count: finding.count ?? 0,
        });
        break;
      case "D5":
        if (finding.from !== undefined && finding.to !== undefined) {
          findings.push({ rule: "D5", id: finding.id, from: finding.from, to: finding.to });
          if (!declaredIds.has(finding.to)) placeholderIds.add(finding.to);
        }
        break;
      default:
        break; // a rule this build has not learned is dropped, never guessed
    }
  }
  findings.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const driftSources = new Set<string>();
  for (const finding of findings) {
    if (finding.rule === "D1" || finding.rule === "D5") driftSources.add(finding.from);
    else if (finding.rule === "D3" && isDriftFinding(finding)) driftSources.add(finding.component);
    else if (finding.rule === "D2") driftSources.add(UNMAPPED_ID);
  }

  const derivedComponents: DerivedComponent[] = components.map((component) => {
    const componentTasks = tasksForComponent(component, tasks);
    const autoStatus = rollupStatus(
      componentTasks.filter((task) => task.inRollup).map((task) => task.status),
    );
    const pinned = component.status !== "auto";
    const fileCount = rollup.filesByComponent.get(component.id) ?? 0;
    const derived: DerivedComponent = {
      id: component.id,
      name: component.name,
      kind: "declared",
      status: pinned ? (component.status as DerivedStatus) : autoStatus,
      pinned,
      autoStatus,
      files: [],
      fileCount,
      declaredOnly: fileCount === 0,
      nonCode: component.nonCode,
      hasDrift: driftSources.has(component.id),
      tasks: componentTasks,
      record: component,
    };
    if (component.layer !== undefined) derived.layer = component.layer;
    const provenance = rollupProvenance(componentTasks);
    if (provenance !== undefined) derived.provenance = provenance;
    return derived;
  });

  const unmappedCount = rollup.stats.unmapped;
  for (const id of [...placeholderIds].sort(compareComponentIds)) {
    if (id === UNMAPPED_ID && unmappedCount > 0) continue;
    derivedComponents.push({
      id,
      name: id,
      kind: "placeholder",
      status: "planned",
      pinned: false,
      autoStatus: "planned",
      files: [],
      fileCount: 0,
      declaredOnly: false,
      nonCode: false,
      hasDrift: false,
      tasks: [],
    });
  }

  if (unmappedCount > 0) {
    derivedComponents.push({
      id: UNMAPPED_ID,
      name: UNMAPPED_ID,
      kind: "unmapped",
      status: "planned",
      pinned: false,
      autoStatus: "planned",
      files: [],
      fileCount: unmappedCount,
      declaredOnly: false,
      nonCode: false,
      hasDrift: true,
      tasks: [],
    });
  }

  derivedComponents.sort(
    (a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || compareComponentIds(a.id, b.id),
  );

  return {
    // `full` is right: the map has its intent layer AND its reality
    // layer. WHERE the reality came from is not a degradation, and
    // reporting it as one would put the pane's own banner over a map that
    // is complete.
    mode: "full",
    indexNotRun: false,
    inferred: false,
    components: derivedComponents,
    edges,
    findings,
    fileComponent: new Map(),
    indexedFileCount: rollup.stats.files,
    unmappedFiles: [],
    unmappedCount,
    // `ambiguous-mapping` is a per-path issue and the paths did not
    // travel; the D4 TALLY above carries the fact, and the paths are one
    // pull away. Inventing an issue with no file to name would be worse
    // than the honest absence.
    issues: [],
  };
}

/**
 * Reality-only degraded mode (plan §6.5): no declared components, so the
 * graph is grouped into top-level-directory pseudo-components, clearly
 * flagged `inferred` (ghost-kin rendering is T-012's). No intent layer
 * exists, so there is no drift to find: findings stay empty and edges
 * carry the `observed` relation. Tasks play no part: pseudo-components
 * declare no touch_slugs, so nothing can roll up (status stays planned).
 */
function deriveInferred(graph: ArchGraph): DerivedArchitecture {
  const fileComponent = new Map<string, string>();
  const filesPerDir = new Map<string, string[]>();
  const topDir = (path: string): string => {
    const slash = path.indexOf("/");
    return slash === -1 ? "." : path.slice(0, slash);
  };
  for (const file of graph.files) {
    const dir = topDir(file.path);
    const id = `dir:${dir}`;
    fileComponent.set(file.path, id);
    const bucket = filesPerDir.get(dir);
    if (bucket === undefined) filesPerDir.set(dir, [file.path]);
    else bucket.push(file.path);
  }

  const edgesByKey = new Map<string, MutableEdge>();
  for (const edge of graph.edges) {
    if (edge.kind !== "import") continue;
    if (!edge.from.startsWith("f:")) continue;
    const fromFile = graph.filesById.get(edge.from);
    if (fromFile === undefined) continue;
    const from = fileComponent.get(fromFile.path) as string;
    let to: string;
    let fileEdge: ObservedFileEdge;
    if (edge.to.startsWith("f:")) {
      const toFile = graph.filesById.get(edge.to);
      if (toFile === undefined) continue;
      to = fileComponent.get(toFile.path) as string;
      fileEdge = { from: fromFile.path, to: toFile.path };
    } else if (edge.to.startsWith("p:")) {
      const pkg = graph.packagesById.get(edge.to);
      if (pkg === undefined || pkg.path === undefined) continue;
      const dir = topDir(pkg.path);
      if (!filesPerDir.has(dir)) continue; // package dir holds no indexed files
      to = `dir:${dir}`;
      fileEdge = { from: fromFile.path, to: pkg.path, package: pkg.id };
    } else {
      continue;
    }
    if (from === to) continue;
    const key = edgeKey(from, to);
    let mutable = edgesByKey.get(key);
    if (mutable === undefined) {
      mutable = { from, to, declared: false, fileEdges: [] };
      edgesByKey.set(key, mutable);
    }
    mutable.fileEdges.push(fileEdge);
  }

  const components: DerivedComponent[] = [...filesPerDir.entries()]
    .sort(([a], [b]) => byPath(a, b))
    .map(([dir, files]) => ({
      id: `dir:${dir}`,
      name: dir === "." ? "(repo root)" : `${dir}/`,
      kind: "inferred" as const,
      status: "planned" as const,
      pinned: false,
      autoStatus: "planned" as const,
      files,
      fileCount: files.length,
      declaredOnly: false,
      nonCode: false,
      hasDrift: false,
      tasks: [],
    }));

  const edges: DerivedEdge[] = [...edgesByKey.values()]
    .map((edge) => ({
      from: edge.from,
      to: edge.to,
      relation: "observed" as const,
      declared: false,
      observedCount: edge.fileEdges.length,
      fileEdges: [...edge.fileEdges].sort(compareFileEdges),
    }))
    .sort(compareEdges);

  return {
    mode: "no-components",
    indexNotRun: false,
    inferred: true,
    components,
    edges,
    findings: [],
    fileComponent,
    indexedFileCount: fileComponent.size,
    unmappedFiles: [],
    unmappedCount: 0,
    issues: [],
  };
}
