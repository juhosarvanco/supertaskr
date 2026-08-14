import type {
  ProjectParseResult,
  ReviewMode,
  TaskRecord,
  TaskSize,
  TaskStatus,
} from "@nputer/parser/pure";

/**
 * Story map board model (T-004): a pure function of the T-003 store's
 * DocsModel. No React, no Tauri, no IO — `selectBoard(model)` derives
 * everything the board renders, so grouping, ordering, slice-line
 * placement, unmapped routing, ghost/parked partition, and badge
 * derivation are unit-testable without a DOM. Components stay thin
 * views over this result.
 *
 * Rendering semantics per the T-004 implementation plan
 * (docs/tasks/T-004-story-map-board.md) and docs/design/dashboard.md.
 *
 * ADR-009: collections keyed by file-derived strings (feature ids) are
 * Maps, never plain object literals.
 */

/** The six statuses that render as real cards, each with its own
 * `--status-<token>-bg/fg` pair in tokens.css. `suggested` (ghost) and
 * `parked` (collapsed row) render differently and have no pair. */
export type StatusToken =
  | "planned"
  | "building"
  | "verifying"
  | "rejected"
  | "done"
  | "merging";

export interface StatusVisual {
  /** Which token pair colors the card. */
  token: StatusToken;
  /** True for verifying and merging: the card pulses (motion-safe). */
  pulse: boolean;
}

/**
 * Status → visual treatment. planned gray · building amber · verifying
 * amber + pulse · rejected red · done teal · merging teal + pulse (the
 * plan's decision for the sixth status the criterion doesn't name).
 * Total over TaskStatus so a stray call cannot throw; suggested/parked
 * fall back to the planned pair but are never rendered as real cards.
 */
export function statusVisual(status: TaskStatus): StatusVisual {
  switch (status) {
    case "planned":
      return { token: "planned", pulse: false };
    case "building":
      return { token: "building", pulse: false };
    case "verifying":
      return { token: "verifying", pulse: true };
    case "rejected":
      return { token: "rejected", pulse: false };
    case "done":
      return { token: "done", pulse: false };
    case "merging":
      return { token: "merging", pulse: true };
    case "suggested":
    case "parked":
      return { token: "planned", pulse: false };
  }
}

/**
 * Short display name for the model badge: `claude-fable-5` → `fable`,
 * `codex` → `codex`, `codex/gpt-5.2` → `codex` (stamped combo shows the
 * agent-CLI part). Heuristic: take the segment before any `/`, drop a
 * trailing version tail (`-5`, `-5.2`, `-v2`), then drop a leading
 * `claude` vendor prefix. Falls back to the input when stripping would
 * leave nothing. The full raw value stays available for hover.
 */
export function shortModelName(model: string): string {
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

/** Model badge content, or undefined when the card shows none. */
export interface ModelBadgeInfo {
  /** Short display name, e.g. `fable`. */
  short: string;
  /** Full raw model[@session] value, for hover. */
  full: string;
}

/** One renderable card (real or ghost). Everything the card face needs,
 * derived once here so components stay logic-free. */
export interface BoardCard {
  /** Stable render key: the source file path (unique per snapshot). */
  key: string;
  id?: string;
  title: string;
  status: TaskStatus;
  size?: TaskSize;
  priority?: number;
  milestone?: number;
  visual: StatusVisual;
  /** Model badge: builder pre-done, built_by once done/merging (with
   * fallback to whichever is set). Absent when neither is. */
  model?: ModelBadgeInfo;
  /** Verification badge; present only on done cards with review: set. */
  review?: ReviewMode;
  file: string;
}

export interface BoardColumn {
  /** Stable render key: feature id, or "unmapped". */
  key: string;
  /** Backbone feature id (F-NN); absent for the unmapped column. */
  featureId?: string;
  /** Header text: feature name, or "unmapped". */
  name: string;
  description: string;
  /** Real cards (not suggested/parked) in display order: milestone-1
   * block first, then later; priority asc within each block. */
  cards: BoardCard[];
  /** Index into `cards` where the milestone slice line renders:
   * cards[0..sliceIndex) are milestone 1, the rest are later. */
  sliceIndex: number;
  /** Suggested tasks, rendered as dashed ghosts below all real cards. */
  ghosts: BoardCard[];
  /** Parked tasks collapsed into one "N parked" row at the bottom. */
  parkedCount: number;
}

export interface BoardModel {
  /** Backbone order, plus a trailing unmapped column only when needed. */
  columns: BoardColumn[];
  /** True when there is nothing to render at all (no backbone features
   * and no tasks): the board shows a minimal "no features found" line. */
  empty: boolean;
}

const isDoneish = (status: TaskStatus): boolean => status === "done" || status === "merging";

function modelBadge(task: TaskRecord): ModelBadgeInfo | undefined {
  const chosen = isDoneish(task.status)
    ? (task.builtBy ?? task.builder)
    : (task.builder ?? task.builtBy);
  if (chosen === undefined) return undefined;
  return { short: shortModelName(chosen.model), full: chosen.raw };
}

function toCard(task: TaskRecord): BoardCard {
  return {
    key: task.file,
    id: task.id,
    title: task.title,
    status: task.status,
    size: task.size,
    priority: task.priority,
    milestone: task.milestone,
    visual: statusVisual(task.status),
    model: modelBadge(task),
    // Plan: the verification badge renders on done cards, from review:.
    review: task.status === "done" ? task.review : undefined,
    file: task.file,
  };
}

/** Deterministic id/file ordering; numeric-aware so T-9 < T-10. */
const byText = (a: string, b: string): number => a.localeCompare(b, "en", { numeric: true });

/** priority asc (missing last) → id asc (missing last) → file asc. */
function byPriority(a: BoardCard, b: BoardCard): number {
  const pa = a.priority ?? Number.POSITIVE_INFINITY;
  const pb = b.priority ?? Number.POSITIVE_INFINITY;
  if (pa !== pb) return pa - pb;
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return byText(a.id, b.id);
  if ((a.id === undefined) !== (b.id === undefined)) return a.id === undefined ? 1 : -1;
  return byText(a.file, b.file);
}

/** Ghost order: id asc (missing last) → file asc (no priority on ghosts). */
function byIdThenFile(a: BoardCard, b: BoardCard): number {
  if (a.id !== undefined && b.id !== undefined && a.id !== b.id) return byText(a.id, b.id);
  if ((a.id === undefined) !== (b.id === undefined)) return a.id === undefined ? 1 : -1;
  return byText(a.file, b.file);
}

interface MutableColumn {
  key: string;
  featureId?: string;
  name: string;
  description: string;
  real: BoardCard[];
  ghosts: BoardCard[];
  parkedCount: number;
}

/** Column key/name for the trailing catch-all column. */
export const UNMAPPED_KEY = "unmapped";

/**
 * Derive the board from a parsed project model.
 *
 * - Columns = backbone features in ROADMAP order (duplicate backbone ids
 *   collapse into the first occurrence — the parser already flags the
 *   duplicate as an issue; a second identical column adds nothing).
 * - A task routes to its feature's column; tasks whose feature is unset
 *   or not in the backbone land in the trailing "unmapped" column
 *   (criterion 4 — nothing is ever dropped), which appears only when
 *   non-empty. Feature-less suggestions land there too.
 * - Within a column: parked → count, suggested → ghosts, the rest →
 *   real cards ordered milestone-1 block first (slice line between the
 *   blocks stays a single boundary even if priorities interleave across
 *   milestones), priority asc / id asc / file asc within each block.
 *   Status never affects position: done cards keep their slot.
 */
export function selectBoard(model: ProjectParseResult): BoardModel {
  // ADR-009: feature ids come from files — keyed collection is a Map.
  const byFeature = new Map<string, MutableColumn>();
  const featureColumns: MutableColumn[] = [];

  for (const feature of model.features) {
    if (byFeature.has(feature.id)) continue; // duplicate backbone id: first wins, issue already flagged
    const column: MutableColumn = {
      key: feature.id,
      featureId: feature.id,
      name: feature.name,
      description: feature.description,
      real: [],
      ghosts: [],
      parkedCount: 0,
    };
    byFeature.set(feature.id, column);
    featureColumns.push(column);
  }

  const unmapped: MutableColumn = {
    key: UNMAPPED_KEY,
    name: UNMAPPED_KEY,
    description: "tasks whose feature is not in the backbone",
    real: [],
    ghosts: [],
    parkedCount: 0,
  };

  for (const task of model.tasks) {
    const column =
      (task.feature !== undefined ? byFeature.get(task.feature) : undefined) ?? unmapped;
    if (task.status === "parked") {
      column.parkedCount += 1;
      continue;
    }
    const card = toCard(task);
    if (task.status === "suggested") {
      column.ghosts.push(card);
    } else {
      column.real.push(card);
    }
  }

  const hasContent =
    unmapped.real.length > 0 || unmapped.ghosts.length > 0 || unmapped.parkedCount > 0;
  const all = hasContent ? [...featureColumns, unmapped] : featureColumns;

  const columns: BoardColumn[] = all.map((column) => {
    const milestone1 = column.real.filter((c) => c.milestone === 1).sort(byPriority);
    const later = column.real.filter((c) => c.milestone !== 1).sort(byPriority);
    return {
      key: column.key,
      featureId: column.featureId,
      name: column.name,
      description: column.description,
      cards: [...milestone1, ...later],
      sliceIndex: milestone1.length,
      ghosts: [...column.ghosts].sort(byIdThenFile),
      parkedCount: column.parkedCount,
    };
  });

  return { columns, empty: columns.length === 0 };
}
