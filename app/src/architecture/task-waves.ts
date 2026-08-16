import type { ProjectParseResult, ReviewMode, TaskStatus } from "@nputer/parser/pure";
import { rejectedVerdictCount } from "@/lib/verdicts";

/**
 * The map pane's SECOND lens (T-034): the same board tasks, ordered by
 * dependency instead of story. Everything here is PURE — waves, the
 * critical path, the schedule words, the summary strip and the elbow
 * geometry — so the whole model is unit-testable without a DOM, exactly
 * like map-layout.ts and map-visuals.ts for the architecture lens.
 *
 * The design bundle's "map · tasks" screen is the spec of record
 * (docs/design/claudedesign_handoff/"nputer app.dc.html", the `isDeps`
 * screen; README §5). Its hand-laid card coordinates are illustrative —
 * it draws 15 cards while claiming 18 — so the RULES below are
 * normative and the mock's geometry is the source for the constants
 * (240×58 cards, 300px wave pitch, the 120px median row pitch).
 *
 * The two carrying rules of the pane hold here too:
 *   - nothing moves except on a change of STRUCTURE (waves are a pure
 *     function of ids + blocked_by; a status flip repaints, never moves);
 *   - same graph → same picture (every ordering below is by id).
 *
 * ADR-009: every collection keyed by a file-derived string (task ids) is
 * a Map or a Set, never a plain object literal — a `blocked_by:
 * [__proto__]` entry must not resolve against inherited state.
 */

// ---------------------------------------------------------------------
// Geometry (design-extracted; see the notes' extraction table)
// ---------------------------------------------------------------------

/** Card box, measured off the mock's cards (240×58). */
export const TASK_CARD_W = 240;
export const TASK_CARD_H = 58;
/** Wave pitch: the mock's columns sit at 40 · 340 · 640 · 940. */
export const WAVE_PITCH = 300;
/** Gutter between a card's right edge and the next wave's left edge. */
export const WAVE_GUTTER = WAVE_PITCH - TASK_CARD_W;
/** Elbow stub = mid-gutter (the bundle's rule 6, at this gutter). */
export const TASK_STUB = WAVE_GUTTER / 2;
/** Row pitch: the MEDIAN of the mock's nine intra-wave gaps
 * (100·110·120·120·120·140·140·140·160). */
export const TASK_SLOT_H = 120;
/** First card's top inside the graph area (mock: 40). */
export const TASK_SLOT_TOP = 40;
/** Wave label baseline inside the graph area (mock: 12). */
export const WAVE_LABEL_TOP = 12;
/** Drop below a card for a tangled back-edge run. */
export const TASK_BACK_DROP = 30;

// ---------------------------------------------------------------------
// Model types
// ---------------------------------------------------------------------

/** The six statuses that carry a fill (the board's palette). `suggested`
 * and `parked` never reach a card face here — they are not drawn. */
export type WaveStatus =
  | "planned"
  | "building"
  | "verifying"
  | "rejected"
  | "done"
  | "merging";

/**
 * What the schedule says about a task, derived from `blocked_by`:
 * - `ready`     — not started and nothing unmet (the mock's grey `ready`);
 * - `waits`     — not started, and every unmet blocker is IN FLIGHT, so
 *                 the wait has a visible end (the mock's `waits on T-005`);
 * - `blocked`   — not started, and at least one unmet blocker is NOT in
 *                 flight (planned, parked, rejected, or a dangling id):
 *                 the wait has no end in sight. The mock draws exactly
 *                 this one as the dashed terracotta ghost;
 * - `underway`  — started or finished; the card shows its own status word.
 */
export type ScheduleState = "ready" | "waits" | "blocked" | "underway";

/** Statuses that mean "someone is on it right now". */
const IN_FLIGHT: ReadonlySet<TaskStatus> = new Set<TaskStatus>([
  "building",
  "verifying",
  "merging",
]);

/** The minimal shape the wave computation needs. Kept separate from
 * `TaskRecord` so the algorithm is testable from plain literals. */
export interface WaveInput {
  id: string;
  status: TaskStatus;
  blockedBy: readonly string[];
  /**
   * Drawn on the canvas. Parked and suggested tasks are KNOWN (they
   * resolve as blockers, so a task blocked by a parked one reads
   * `blocked`) but not drawn — the board does not render them as cards
   * either, and an undrawn blocker must not push a wave.
   */
  rendered: boolean;
}

export interface WaveEdge {
  /** The blocker. */
  from: string;
  /** The task it blocks. */
  to: string;
  /** True when the edge does not run forward between waves — i.e. it is
   * part of a cycle the layering had to cut. Still drawn. */
  tangled: boolean;
  /** True when both endpoints are consecutive links of the critical path. */
  critical: boolean;
}

export interface WaveNode {
  id: string;
  wave: number;
  row: number;
  /** Top-left corner in graph-area coordinates. */
  x: number;
  y: number;
  /** Released as part of a dependency cycle (all its members share a wave). */
  inCycle: boolean;
}

/** Everything the tasks lens draws for one card. */
export interface WaveCard {
  id: string;
  title: string;
  status: WaveStatus;
  /** Source file path — the panel ref falls back to it. */
  file: string;
  schedule: ScheduleState;
  /** The blocker named by `waits on <id>`; only set when schedule is `waits`. */
  waitsOn?: string;
  /** How many further unmet blockers beyond `waitsOn`. */
  extraWaits: number;
  /** `## Verdicts` REJECTED entries (the board's `rejected ×N` word). */
  rejectedCount: number;
  review?: ReviewMode;
  /** How many tasks this one transitively holds up. */
  holds: number;
  onCriticalPath: boolean;
  worstBlocker: boolean;
  inCycle: boolean;
}

export interface TaskWaveLayout {
  nodes: ReadonlyMap<string, WaveNode>;
  edges: readonly LaidWaveEdge[];
  /** Wave index → label ("wave 0 · foundation", "wave 1", …). */
  waveLabels: readonly { wave: number; label: string; x: number }[];
  width: number;
  height: number;
}

export interface LaidWaveEdge extends WaveEdge {
  /** SVG path data (orthogonal elbows — no curves). */
  path: string;
}

export interface TaskWaveModel {
  cards: readonly WaveCard[];
  layout: TaskWaveLayout;
  /** The chain, longest-first (see `criticalPath` below for the rule). */
  criticalPath: readonly string[];
  worstBlocker?: WaveCard;
  readyNow: readonly string[];
  /** True when at least one dependency cycle was released as one wave. */
  hasCycle: boolean;
  /** How many tasks are drawn. */
  total: number;
}

// ---------------------------------------------------------------------
// Ordering — numeric-aware so T-9 sorts before T-10 (board-model's rule)
// ---------------------------------------------------------------------

export const byTaskId = (a: string, b: string): number =>
  a.localeCompare(b, "en", { numeric: true });

// ---------------------------------------------------------------------
// Waves
// ---------------------------------------------------------------------

export interface WaveLayering {
  /** Task id → wave index. Total over every RENDERED input. */
  wave: ReadonlyMap<string, number>;
  /** Ids released as cycle members (they share one wave). */
  cycleMembers: ReadonlySet<string>;
  /** Blocker → blocked, deduped, deterministic order, rendered pairs only. */
  edges: readonly WaveEdge[];
}

/**
 * Topological LAYERING over `blocked_by`: a task's wave is one past the
 * deepest blocker it is drawn behind. Kahn peeling — O(V+E), and it
 * cannot recurse, so no input depth can overflow a stack.
 *
 * CYCLES (criterion 4). Kahn stalls exactly when a cycle remains. The
 * stall is resolved by releasing every remaining task that sits in a
 * strongly-connected component of size ≥ 2 as ONE wave, then peeling
 * on — so cycle members share a wave (defined), tasks downstream of a
 * cycle keep their own proper wave (useful), and the loop terminates
 * because a stall guarantees an SCC of size ≥ 2 exists, so each pass
 * removes at least two tasks. A final belt-and-braces release covers
 * the impossible case where it does not: this function never hangs.
 * Self-blocking (`blocked_by` naming its own id) is dropped at input, so
 * it can neither stall nor draw a loop.
 */
export function layerWaves(inputs: readonly WaveInput[]): WaveLayering {
  // ADR-009: ids come from files — Map/Set, never object literals.
  const rendered: string[] = [];
  const seen = new Set<string>();
  for (const input of inputs) {
    if (!input.rendered || seen.has(input.id)) continue;
    seen.add(input.id);
    rendered.push(input.id);
  }
  rendered.sort(byTaskId);
  const renderedSet = new Set(rendered);

  /** id → its drawn blockers (deduped, id-ordered, self dropped). */
  const blockers = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();
  for (const id of rendered) {
    blockers.set(id, []);
    dependents.set(id, []);
  }
  for (const input of inputs) {
    if (!renderedSet.has(input.id)) continue;
    const own = blockers.get(input.id);
    if (own === undefined) continue;
    const local = new Set<string>();
    for (const raw of input.blockedBy) {
      if (raw === input.id || !renderedSet.has(raw) || local.has(raw)) continue;
      local.add(raw);
    }
    for (const dep of [...local].sort(byTaskId)) {
      own.push(dep);
      dependents.get(dep)?.push(input.id);
    }
  }

  const wave = new Map<string, number>();
  const cycleMembers = new Set<string>();
  const remaining = new Set(rendered);
  const indegree = new Map<string, number>();
  for (const id of rendered) indegree.set(id, blockers.get(id)?.length ?? 0);

  let index = 0;
  while (remaining.size > 0) {
    let frontier = [...remaining].filter((id) => (indegree.get(id) ?? 0) <= 0);
    if (frontier.length === 0) {
      frontier = cycleMembersOf(remaining, blockers);
      for (const id of frontier) cycleMembers.add(id);
    }
    if (frontier.length === 0) {
      // Unreachable by the argument above; releasing everything is the
      // guarantee that this loop is total whatever the input does.
      frontier = [...remaining];
      for (const id of frontier) cycleMembers.add(id);
    }
    frontier.sort(byTaskId);
    for (const id of frontier) {
      wave.set(id, index);
      remaining.delete(id);
    }
    for (const id of frontier) {
      for (const next of dependents.get(id) ?? []) {
        if (remaining.has(next)) indegree.set(next, (indegree.get(next) ?? 0) - 1);
      }
    }
    index += 1;
  }

  const edges: WaveEdge[] = [];
  for (const id of rendered) {
    for (const from of blockers.get(id) ?? []) {
      const fromWave = wave.get(from) ?? 0;
      const toWave = wave.get(id) ?? 0;
      edges.push({ from, to: id, tangled: fromWave >= toWave, critical: false });
    }
  }
  edges.sort((a, b) => byTaskId(a.from, b.from) || byTaskId(a.to, b.to));

  return { wave, cycleMembers, edges };
}

/**
 * Every id in the induced subgraph that sits in a strongly-connected
 * component of size ≥ 2. Tarjan, ITERATIVE (a file-derived graph must
 * not overflow the stack) — the same shape map-layout.ts uses for
 * component cycles, over blocker edges instead of import edges.
 */
function cycleMembersOf(
  ids: ReadonlySet<string>,
  blockers: ReadonlyMap<string, readonly string[]>,
): string[] {
  const order = [...ids].sort(byTaskId);
  const out = new Map<string, string[]>();
  for (const id of order) {
    out.set(
      id,
      (blockers.get(id) ?? []).filter((b) => ids.has(b)),
    );
  }
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const members: string[] = [];
  let counter = 0;

  for (const start of order) {
    if (index.has(start)) continue;
    const frames: [string, number][] = [[start, 0]];
    index.set(start, counter);
    low.set(start, counter);
    counter += 1;
    stack.push(start);
    onStack.add(start);
    while (frames.length > 0) {
      const frame = frames[frames.length - 1] as [string, number];
      const node = frame[0];
      const targets = out.get(node) ?? [];
      if (frame[1] < targets.length) {
        const next = targets[frame[1]] as string;
        frame[1] += 1;
        if (!index.has(next)) {
          index.set(next, counter);
          low.set(next, counter);
          counter += 1;
          stack.push(next);
          onStack.add(next);
          frames.push([next, 0]);
        } else if (onStack.has(next)) {
          low.set(node, Math.min(low.get(node) as number, index.get(next) as number));
        }
      } else {
        frames.pop();
        const parent = frames[frames.length - 1];
        if (parent !== undefined) {
          low.set(parent[0], Math.min(low.get(parent[0]) as number, low.get(node) as number));
        }
        if (low.get(node) === index.get(node)) {
          const scc: string[] = [];
          for (;;) {
            const popped = stack.pop() as string;
            onStack.delete(popped);
            scc.push(popped);
            if (popped === node) break;
          }
          if (scc.length >= 2) members.push(...scc);
        }
      }
    }
  }
  return members.sort(byTaskId);
}

// ---------------------------------------------------------------------
// The critical path
// ---------------------------------------------------------------------

/**
 * THE CHOSEN DEFINITION (recorded in the task notes): the LONGEST chain
 * of tasks linked by `blocked_by` — the CPM sense of the term, the
 * sequence that no amount of parallelism can shorten. Ties are broken,
 * in order, by:
 *   1. the most tasks (the definition itself);
 *   2. the most tasks in the chain that are NOT done — of two chains of
 *      equal length, the one with more work left is the one actually
 *      holding the release, which is the question the pane's own caption
 *      asks ("what is holding the release");
 *   3. the lexicographically smallest id sequence — determinism, the
 *      pane's carrying rule (same graph → same picture).
 *
 * The most-blocking flavour of "critical" is deliberately NOT this cell:
 * the strip carries it in its own neighbouring cell (worst blocker), and
 * defining both the same way would make the first a restatement of the
 * second.
 *
 * Computed over the ACYCLIC view (tangled edges dropped), in wave order,
 * so it is a straight DP with no recursion and no possibility of a hang.
 */
export function criticalPath(
  layering: WaveLayering,
  statusOf: (id: string) => TaskStatus,
): string[] {
  const incoming = new Map<string, string[]>();
  for (const id of layering.wave.keys()) incoming.set(id, []);
  for (const edge of layering.edges) {
    if (edge.tangled) continue;
    incoming.get(edge.to)?.push(edge.from);
  }
  const order = [...layering.wave.keys()].sort(
    (a, b) =>
      (layering.wave.get(a) as number) - (layering.wave.get(b) as number) || byTaskId(a, b),
  );

  const unfinished = (chain: readonly string[]): number =>
    chain.filter((id) => statusOf(id) !== "done").length;

  /** True when `a` beats `b` under the ladder above. */
  const better = (a: readonly string[], b: readonly string[]): boolean => {
    if (a.length !== b.length) return a.length > b.length;
    const ua = unfinished(a);
    const ub = unfinished(b);
    if (ua !== ub) return ua > ub;
    for (let i = 0; i < a.length; i += 1) {
      const cmp = byTaskId(a[i] as string, b[i] as string);
      if (cmp !== 0) return cmp < 0;
    }
    return false;
  };

  const best = new Map<string, string[]>();
  for (const id of order) {
    let chain: string[] = [id];
    for (const from of (incoming.get(id) ?? []).slice().sort(byTaskId)) {
      const prefix = best.get(from);
      if (prefix === undefined) continue;
      const candidate = [...prefix, id];
      if (better(candidate, chain)) chain = candidate;
    }
    best.set(id, chain);
  }

  let winner: string[] = [];
  for (const id of order) {
    const chain = best.get(id) as string[];
    if (winner.length === 0 || better(chain, winner)) winner = chain;
  }
  // A single task is not a chain: with no edges at all there is no
  // critical path to name.
  return winner.length >= 2 ? winner : [];
}

/** Transitive dependents per task (how many tasks it holds up), over the
 * acyclic view. Reverse DP in reverse wave order — no recursion. */
export function transitiveHolds(layering: WaveLayering): ReadonlyMap<string, number> {
  const outgoing = new Map<string, string[]>();
  for (const id of layering.wave.keys()) outgoing.set(id, []);
  for (const edge of layering.edges) {
    if (edge.tangled) continue;
    outgoing.get(edge.from)?.push(edge.to);
  }
  const order = [...layering.wave.keys()].sort(
    (a, b) =>
      (layering.wave.get(b) as number) - (layering.wave.get(a) as number) || byTaskId(b, a),
  );
  const reach = new Map<string, Set<string>>();
  for (const id of order) {
    const set = new Set<string>();
    for (const next of outgoing.get(id) ?? []) {
      set.add(next);
      for (const deep of reach.get(next) ?? []) set.add(deep);
    }
    reach.set(id, set);
  }
  const holds = new Map<string, number>();
  for (const [id, set] of reach) holds.set(id, set.size);
  return holds;
}

// ---------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------

/** Orthogonal elbow routing (bundle rule 6: stub · mid-gutter vertical ·
 * stub; no curves). Total: any pair of nodes routes. */
function routeTaskEdge(src: WaveNode, dst: WaveNode): string {
  const sy = src.y + TASK_CARD_H / 2;
  const ty = dst.y + TASK_CARD_H / 2;
  if (dst.wave > src.wave) {
    const sx = src.x + TASK_CARD_W;
    const tx = dst.x;
    if (sy === ty) return `M${sx} ${sy} H${tx}`;
    const midX = sx + TASK_STUB;
    return `M${sx} ${sy} H${midX} V${ty} H${tx}`;
  }
  if (dst.wave === src.wave) {
    // A tangled same-wave edge bows beside the column, clear of every card.
    const x = src.x + TASK_CARD_W;
    const bowX = x + TASK_STUB;
    return `M${x} ${sy} H${bowX} V${ty} H${x}`;
  }
  // Tangled back edge: below the source's band, across, into the target.
  const sx = src.x + TASK_CARD_W / 2;
  const startY = src.y + TASK_CARD_H;
  const runY = startY + TASK_BACK_DROP;
  const tx = dst.x + TASK_CARD_W / 2;
  const targetEdgeY = dst.y >= runY ? dst.y : dst.y + TASK_CARD_H;
  return `M${sx} ${startY} V${runY} H${tx} V${targetEdgeY}`;
}

/** Wave 0 carries the design's word; the rest are bare. */
export function waveLabel(index: number): string {
  return index === 0 ? "wave 0 · foundation" : `wave ${index}`;
}

export function layoutWaves(layering: WaveLayering): TaskWaveLayout {
  const byWave = new Map<number, string[]>();
  for (const [id, wave] of layering.wave) {
    const bucket = byWave.get(wave);
    if (bucket === undefined) byWave.set(wave, [id]);
    else bucket.push(id);
  }
  const nodes = new Map<string, WaveNode>();
  for (const [wave, ids] of byWave) {
    // Rule 3's reasoning, verbatim: id ascending, never crossing-minimised
    // — ids are assigned once and never reused, so a new task appends to
    // the bottom of its wave and nothing above it moves.
    ids.sort(byTaskId);
    ids.forEach((id, row) => {
      nodes.set(id, {
        id,
        wave,
        row,
        x: wave * WAVE_PITCH,
        y: TASK_SLOT_TOP + row * TASK_SLOT_H,
        inCycle: layering.cycleMembers.has(id),
      });
    });
  }

  const edges: LaidWaveEdge[] = [];
  for (const edge of layering.edges) {
    const src = nodes.get(edge.from);
    const dst = nodes.get(edge.to);
    if (src === undefined || dst === undefined) continue;
    edges.push({ ...edge, path: routeTaskEdge(src, dst) });
  }

  const waveLabels = [...byWave.keys()]
    .sort((a, b) => a - b)
    .map((wave) => ({ wave, label: waveLabel(wave), x: wave * WAVE_PITCH }));

  let width = 0;
  let height = 0;
  for (const node of nodes.values()) {
    width = Math.max(width, node.x + TASK_CARD_W);
    height = Math.max(height, node.y + TASK_CARD_H);
  }
  return { nodes, edges, waveLabels, width, height };
}

// ---------------------------------------------------------------------
// The whole model
// ---------------------------------------------------------------------

/** Suggested and parked tasks are known but not drawn (see WaveInput). */
export function isRenderedTask(status: TaskStatus): boolean {
  return status !== "suggested" && status !== "parked";
}

/** TaskStatus → the six fills. Total, so a stray value cannot throw. */
export function waveStatus(status: TaskStatus): WaveStatus {
  return status === "suggested" || status === "parked" ? "planned" : status;
}

export interface ScheduleReading {
  schedule: ScheduleState;
  waitsOn?: string;
  extraWaits: number;
}

/**
 * The schedule word for one task. `statusOf` returns undefined for an id
 * that resolves to no task at all — a dangling `blocked_by` (the parser
 * already flags it). A dangling reference is treated as unmet AND not in
 * flight: nothing can be said about when it lands, so the honest reading
 * is `blocked`, never `ready`.
 */
export function readSchedule(
  status: TaskStatus,
  blockedBy: readonly string[],
  statusOf: (id: string) => TaskStatus | undefined,
  self: string,
): ScheduleReading {
  if (status !== "planned") return { schedule: "underway", extraWaits: 0 };
  const unmet: string[] = [];
  let allInFlight = true;
  const seen = new Set<string>();
  for (const raw of [...blockedBy].sort(byTaskId)) {
    if (raw === self || seen.has(raw)) continue;
    seen.add(raw);
    const blockerStatus = statusOf(raw);
    if (blockerStatus === "done") continue;
    unmet.push(raw);
    if (blockerStatus === undefined || !IN_FLIGHT.has(blockerStatus)) allInFlight = false;
  }
  if (unmet.length === 0) return { schedule: "ready", extraWaits: 0 };
  const reading: ScheduleReading = {
    schedule: allInFlight ? "waits" : "blocked",
    extraWaits: unmet.length - 1,
  };
  if (allInFlight) reading.waitsOn = unmet[0] as string;
  return reading;
}

/**
 * The tasks lens's whole model, derived from the parsed project. Pure —
 * no React, no IO — so every rule above is unit-testable and the lens
 * component stays a view.
 */
export function selectTaskWaves(model: ProjectParseResult): TaskWaveModel {
  const byId = new Map<string, (typeof model.tasks)[number]>();
  for (const task of model.tasks) {
    if (task.id === undefined || byId.has(task.id)) continue;
    byId.set(task.id, task);
  }

  const inputs: WaveInput[] = [];
  for (const [id, task] of byId) {
    inputs.push({
      id,
      status: task.status,
      blockedBy: task.blockedBy,
      rendered: isRenderedTask(task.status),
    });
  }
  inputs.sort((a, b) => byTaskId(a.id, b.id));

  const layering = layerWaves(inputs);
  const statusOf = (id: string): TaskStatus | undefined => byId.get(id)?.status;
  const path = criticalPath(layering, (id) => statusOf(id) ?? "planned");
  const pathSet = new Set(path);
  const holds = transitiveHolds(layering);

  const cards: WaveCard[] = [];
  for (const id of [...layering.wave.keys()].sort(byTaskId)) {
    const task = byId.get(id);
    if (task === undefined) continue;
    const reading = readSchedule(task.status, task.blockedBy, statusOf, id);
    const card: WaveCard = {
      id,
      title: task.title,
      status: waveStatus(task.status),
      file: task.file,
      schedule: reading.schedule,
      extraWaits: reading.extraWaits,
      rejectedCount: rejectedVerdictCount(task.sections.verdicts),
      holds: holds.get(id) ?? 0,
      onCriticalPath: pathSet.has(id),
      worstBlocker: false,
      inCycle: layering.cycleMembers.has(id),
    };
    if (reading.waitsOn !== undefined) card.waitsOn = reading.waitsOn;
    if (task.review !== undefined) card.review = task.review;
    cards.push(card);
  }

  // Worst blocker: the not-done task holding up the most work. The
  // tie-break ladder, each rung with its reason:
  //   1. the most holds — the measurement itself;
  //   2. NOT in flight before in flight — at equal weight the worse
  //      blocker is the one nobody is on, because nothing is moving it
  //      (the design's own example is a stuck `rejected ×2` task);
  //   3. the earlier wave — it gates more of the schedule behind it;
  //   4. the lower id — determinism, the pane's carrying rule.
  const waveOf = (id: string): number => layering.wave.get(id) ?? 0;
  const idle = (card: WaveCard): number =>
    IN_FLIGHT.has(card.status as TaskStatus) ? 0 : 1;
  let worst: WaveCard | undefined;
  for (const card of cards) {
    if (card.status === "done" || card.holds === 0) continue;
    if (worst === undefined) {
      worst = card;
      continue;
    }
    const rank = (c: WaveCard): [number, number, number] => [c.holds, idle(c), -waveOf(c.id)];
    const [ah, ai, aw] = rank(card);
    const [bh, bi, bw] = rank(worst);
    if (ah > bh || (ah === bh && (ai > bi || (ai === bi && aw > bw)))) worst = card;
    // Equal on all three: `cards` is id-ascending and the first wins.
  }
  if (worst !== undefined) worst.worstBlocker = true;

  const layout = layoutWaves(layering);
  const criticalPairs = new Set<string>();
  for (let i = 1; i < path.length; i += 1) {
    criticalPairs.add(`${path[i - 1] as string} ${path[i] as string}`);
  }
  const edges = layout.edges.map((edge) => ({
    ...edge,
    critical: criticalPairs.has(`${edge.from} ${edge.to}`),
  }));

  return {
    cards,
    layout: { ...layout, edges },
    criticalPath: path,
    ...(worst !== undefined ? { worstBlocker: worst } : {}),
    readyNow: cards.filter((c) => c.schedule === "ready").map((c) => c.id),
    hasCycle: layering.cycleMembers.size > 0,
    total: cards.length,
  };
}

// ---------------------------------------------------------------------
// Summary strip text (the three cells of the design's strip)
// ---------------------------------------------------------------------

export function criticalPathText(model: TaskWaveModel): string {
  if (model.criticalPath.length === 0) return "no dependency chain yet";
  const chain = model.criticalPath.join(" → ");
  const remaining = model.criticalPath.filter((id) => {
    const card = model.cards.find((c) => c.id === id);
    return card !== undefined && card.status !== "done";
  }).length;
  const tail =
    remaining === 0
      ? "every link is done"
      : `${remaining} of ${model.criticalPath.length} still to land`;
  return `${chain} · ${tail}`;
}

export function worstBlockerText(model: TaskWaveModel): string {
  const worst = model.worstBlocker;
  if (worst === undefined) return "nothing is holding anything up";
  const word = worst.rejectedCount > 0 ? `rejected ×${worst.rejectedCount}` : worst.status;
  return `${worst.id} ${worst.title} · ${word}, holds ${worst.holds}`;
}

export function readyNowText(model: TaskWaveModel): string {
  const count = model.readyNow.length;
  return `${count} task${count === 1 ? "" : "s"}, no unmet deps`;
}

/** The card's right-slot word (undefined when the mark carries the slot). */
export function scheduleWord(card: WaveCard): string | undefined {
  switch (card.schedule) {
    case "ready":
      return "ready";
    case "blocked":
      return "blocked";
    case "waits":
      return card.extraWaits > 0
        ? `waits on ${card.waitsOn} +${card.extraWaits}`
        : `waits on ${card.waitsOn}`;
    case "underway":
      return undefined;
  }
}

// ---------------------------------------------------------------------
// State → ink (pure table, same idiom as map-visuals.ts)
// ---------------------------------------------------------------------

const CARD_FILL: Record<WaveStatus, string> = {
  planned: "bg-status-planned border-status-planned-border",
  building: "bg-status-building border-status-building-border",
  verifying: "bg-status-verifying border-status-verifying-border",
  rejected: "bg-status-rejected border-status-rejected-border",
  done: "bg-status-done border-status-done-border",
  merging: "bg-status-merging border-status-merging-border",
};

const CARD_ID_INK: Record<WaveStatus, string> = {
  planned: "text-status-planned-foreground",
  building: "text-status-building-foreground",
  verifying: "text-status-verifying-foreground",
  rejected: "text-status-rejected-foreground",
  done: "text-status-done-foreground",
  merging: "text-status-merging-foreground",
};

const CARD_TITLE_INK: Record<WaveStatus, string> = {
  planned: "text-status-planned-title",
  building: "text-status-building-title",
  verifying: "text-status-verifying-title",
  rejected: "text-status-rejected-title",
  done: "text-status-done-title",
  merging: "text-status-merging-title",
};

/** Pulse dot, the board's measured pair (the lens's only ambient motion). */
const CARD_DOT: Partial<Record<WaveStatus, string>> = {
  verifying: "bg-chart-4",
  merging: "bg-chart-2",
};

export interface TaskCardVisual {
  /** Fill, border and elevation for the card box. */
  container: string;
  idInk: string;
  titleInk: string;
  /** Ink for the right-slot word. */
  wordInk: string;
  /** Scheduling words are mono at map-meta size; status words are sans xs. */
  wordMono: boolean;
  /** The 5px pulsing dot, verifying/merging only. */
  dot?: string;
  /** Done tasks show the ADR-016 review mark instead of a word. */
  mark: boolean;
}

/**
 * The card's whole visual state as one pure table (map-visuals' idiom).
 *
 * The design's two ghost/emphasis treatments compose in one defined
 * order: the WORST BLOCKER's solid 2px terracotta border wins over the
 * blocked ghost's 1px dashed one (a card can be both; the mock draws
 * them on two different cards, so the order is ours and recorded), while
 * the ghost FILL is kept either way — the emphasis says "this is what is
 * holding things", the fill still says "it cannot start".
 */
export function taskCardVisual(card: WaveCard): TaskCardVisual {
  const ghost = card.schedule === "blocked";
  const fill = ghost
    ? "bg-map-unmapped border-dashed border-status-rejected-meta"
    : `${CARD_FILL[card.status]} shadow-map-node`;
  const container = [
    fill,
    card.worstBlocker && "border-2 border-solid border-status-rejected-meta",
  ]
    .filter(Boolean)
    .join(" ");

  const idInk = ghost ? "text-status-planned-foreground" : CARD_ID_INK[card.status];
  const titleInk = ghost ? "text-status-planned-foreground" : CARD_TITLE_INK[card.status];

  let wordInk: string;
  if (card.schedule === "blocked") wordInk = "text-status-rejected-foreground";
  else if (card.schedule === "ready" || card.schedule === "waits") wordInk = "text-muted-foreground";
  else wordInk = CARD_ID_INK[card.status];

  const visual: TaskCardVisual = {
    container,
    idInk,
    titleInk,
    wordInk,
    wordMono: card.schedule !== "underway",
    mark: card.schedule === "underway" && card.status === "done",
  };
  const dot = ghost ? undefined : CARD_DOT[card.status];
  if (dot !== undefined) visual.dot = dot;
  return visual;
}
