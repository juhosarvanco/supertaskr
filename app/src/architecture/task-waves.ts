import type { ProjectParseResult, TaskScheduleModel, WaveLayering } from "@supertaskr/parser/pure";
import { selectTaskSchedule } from "@supertaskr/parser/pure";
import { rejectedVerdictCount } from "@/lib/verdicts";

/**
 * The map pane's SECOND lens (T-034): the same board tasks, ordered by
 * dependency instead of story.
 *
 * THE ANALYSIS MOVED AT T-137 AND IS NOT COPIED HERE. Waves, the critical
 * path, transitive holds, the worst blocker, the schedule word and the
 * three summary sentences now live in `@supertaskr/parser/pure`
 * (`lib/parser/src/task-waves.ts`) — ONE implementation (T-057), so a
 * terminal session and this pane can never disagree about which card is
 * ready. This file re-exports them unchanged and keeps the two things
 * that are a SCREEN's and not a library's:
 *
 *   - GEOMETRY — card boxes, wave pitch, elbow routing, the layout;
 *   - INK — the Tailwind class tables and the ghost/emphasis order.
 *
 * WHAT THE ONE APP-LOCAL IMPORT BECAME. `task-waves.ts` used to open with
 * `import { rejectedVerdictCount } from "@/lib/verdicts";` and spend it on
 * ONE line. That import is still HERE, in the app, and the count is now
 * PASSED IN to the pure selector through `rejectedCountOf` — a pure
 * function does not import a lens (T-137 criterion 1). `verdicts.ts` is
 * C-16 and did not have to move for the analysis to.
 *
 * The design bundle's "map · tasks" screen is the spec of record
 * (docs/design/claudedesign_handoff/"supertaskr app.dc.html", the `isDeps`
 * screen; README §5). Its hand-laid card coordinates are illustrative —
 * it draws 15 cards while claiming 18 — so the RULES are normative and
 * the mock's geometry is the source for the constants (240×58 cards,
 * 300px wave pitch, the 120px median row pitch).
 *
 * The two carrying rules of the pane still hold:
 *   - nothing moves except on a change of STRUCTURE (waves are a pure
 *     function of ids + blocked_by; a status flip repaints, never moves);
 *   - same graph → same picture (every ordering is by id).
 */

export {
  byTaskId,
  criticalPath,
  criticalPathText,
  isRenderedTask,
  layerWaves,
  readSchedule,
  readyNowText,
  scheduleWord,
  selectTaskSchedule,
  transitiveHolds,
  waveStatus,
  worstBlockerText,
  type ScheduleReading,
  type ScheduleState,
  type SelectScheduleOptions,
  type TaskScheduleModel,
  type UnmetBlocker,
  type WaveCard,
  type WaveEdge,
  type WaveInput,
  type WaveLayering,
  type WaveStatus,
} from "@supertaskr/parser/pure";

import type { WaveCard, WaveEdge, WaveStatus } from "@supertaskr/parser/pure";

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

export interface LaidWaveEdge extends WaveEdge {
  /** SVG path data (orthogonal elbows — no curves). */
  path: string;
}

export interface TaskWaveLayout {
  nodes: ReadonlyMap<string, WaveNode>;
  edges: readonly LaidWaveEdge[];
  /** Wave index → label ("wave 0 · foundation", "wave 1", …). */
  waveLabels: readonly { wave: number; label: string; x: number }[];
  width: number;
  height: number;
}

/** The pure schedule plus this pane's laid-out geometry. */
export interface TaskWaveModel extends TaskScheduleModel {
  layout: TaskWaveLayout;
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
    ids.sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
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
// The whole model — the pure schedule, laid out
// ---------------------------------------------------------------------

/**
 * The tasks lens's whole model: the parser's schedule plus this pane's
 * geometry. THE ONE LINE THAT USED TO REACH FOR THE LENS IS NOW THE ONE
 * LINE THAT HANDS ITS ANSWER IN.
 */
export function selectTaskWaves(model: ProjectParseResult): TaskWaveModel {
  const schedule = selectTaskSchedule(model, {
    rejectedCountOf: (task) => rejectedVerdictCount(task.sections.verdicts),
  });

  const layout = layoutWaves(schedule.layering);
  const criticalPairs = new Set<string>();
  const path = schedule.criticalPath;
  for (let i = 1; i < path.length; i += 1) {
    criticalPairs.add(`${path[i - 1] as string}\u0000${path[i] as string}`);
  }
  const edges = layout.edges.map((edge) => ({
    ...edge,
    critical: criticalPairs.has(`${edge.from}\u0000${edge.to}`),
  }));

  return { ...schedule, layout: { ...layout, edges } };
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
