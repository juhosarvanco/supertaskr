import type {
  ProjectParseResult,
  ReviewMode,
  TaskRecord,
  TaskSize,
  TaskStatus,
} from "@nputer/parser/pure";
import {
  assignmentByFile,
  issuesByFile,
  statusVisual,
  type AssignmentDisclosure,
  type BoardCard,
  type StatusVisual,
} from "./board-model";

/**
 * Card detail model (T-005): a pure function of the T-003 store's
 * DocsModel, like board-model. No React, no Tauri, no IO —
 * `selectTaskDetail(model, ref)` derives everything the detail panel
 * renders, so the panel reflects live file changes by construction
 * (every new snapshot re-derives) and stays unit-testable without a DOM.
 *
 * ADR-009: task ids come from files — the id lookup is a Map, never a
 * plain object literal (a `blocked_by: [__proto__]` entry must not
 * resolve against inherited state).
 */

/**
 * How the panel identifies its task across snapshots:
 * - by ID for cards that have one (every non-suggested card does — the
 *   parser's identity gate requires it). Ids are the convention's stable
 *   identity: blocked_by links target ids, and an id survives a file
 *   rename, so an open panel follows the task, not the path.
 * - by FILE for id-less suggestion cards (suggestions are minimal files;
 *   the file path is their only identity within a snapshot).
 */
export type TaskRef = { kind: "id"; id: string } | { kind: "file"; file: string };

/** The ref a board card opens with (id when present, else file). */
export function cardRef(card: Pick<BoardCard, "id" | "file">): TaskRef {
  return card.id !== undefined ? { kind: "id", id: card.id } : { kind: "file", file: card.file };
}

/** Short display label for a ref (used by the panel's "no longer
 * present" state, where no record exists to take a title from). */
export function refLabel(ref: TaskRef): string {
  return ref.kind === "id" ? ref.id : ref.file;
}

/** One blocked_by entry, resolved against the current model. */
export interface BlockerLink {
  /** The blocked_by entry, verbatim. */
  id: string;
  /** True when a task with this id exists in the current model — only
   * then does the panel render it as a link that re-targets the panel. */
  resolved: boolean;
  /** Resolved target's title (hover text). */
  title?: string;
  /** Resolved target's status, and its visual token pair for the chip. */
  status?: TaskStatus;
  visual?: StatusVisual;
}

/** Everything the detail panel renders, derived once here so the
 * component stays logic-free. Section fields are the parser's raw
 * markdown, VERBATIM; `undefined` means visibly-empty (the heading is
 * absent or has no content — criterion 3 renders it as empty, never an
 * error). */
export interface TaskDetail {
  id?: string;
  title: string;
  status: TaskStatus;
  visual: StatusVisual;
  /** True for status:suggested — the panel renders its minimal variant
   * (no stamps block; suggested_by shown instead). */
  suggested: boolean;
  size?: TaskSize;
  /** Chip row (T-006): owning feature and priority, when set. */
  feature?: string;
  priority?: number;
  suggestedBy?: string;
  /** Body text before the first heading (T-019, absorbing T-002-s2) —
   * a suggestion's context paragraph is its ENTIRE content, so the
   * ghost panel variant renders this; undefined when absent or empty. */
  preamble?: string;
  /** Raw markdown under `## Acceptance criteria`; undefined when absent
   * or empty. */
  acceptanceCriteria?: string;
  /** Raw markdown under `## Implementation notes`, verbatim; undefined
   * when absent or empty. The panel renders it collapsed by default
   * (T-005-s2, the @human-confirmed taste call) — the builder's working
   * record is reachable without dominating the accountability surface. */
  implementationNotes?: string;
  /** Raw markdown under `## Verdicts`, verbatim; undefined when absent
   * or empty. */
  verdicts?: string;
  blockedBy: BlockerLink[];
  touches: string[];
  /**
   * The parser's own sentences about this task's file, VERBATIM and in
   * issue order (T-019-s1) — the panel lists them, the card face only
   * marks that they exist. Joined by `issuesByFile`, the ONE lens the
   * board face and this panel share, so the mark and the list can never
   * disagree about which card is flagged (the verdicts.ts rule applied
   * to a second derivation).
   *
   * `[]` rather than absent, matching `blockedBy` and `touches` in this
   * interface: the panel decides whether to render a section from the
   * length, and every other list here is always present.
   */
  issues: string[];
  /**
   * The assignment violations the parser found on this card (T-169) —
   * `builder:` naming a model `built_by:` does not, or the same for the
   * verifier pair. The panel prints BOTH values side by side in the
   * provenance block, so the assignment is visible next to the execution
   * instead of the board showing one of them and calling it the model.
   *
   * `[]` rather than absent, matching `issues`/`blockedBy`/`touches`
   * here: the panel decides whether to render from the length.
   */
  assignment: AssignmentDisclosure[];
  /** Raw `built_by` / `verified_by` stamp values (e.g. `codex/gpt-5.2
   * @S3`); undefined renders as a visibly empty stamp. */
  builtBy?: string;
  verifiedBy?: string;
  review?: ReviewMode;
  file: string;
}

/** Empty-normalize a section: absent heading and contentless heading
 * both render as visibly empty. */
function section(text: string | undefined): string | undefined {
  return text === undefined || text.trim() === "" ? undefined : text;
}

// ---- presentation derivations (T-006 design pass) ----------------------

/** One acceptance-criterion row for the panel's per-criterion marks. */
export interface CriterionLine {
  text: string;
  /** Task-level honesty: ✓ only when the task passed its verdict gate
   * (done/merging) — there is no per-criterion verification record. */
  met: boolean;
}

/**
 * Split raw `## Acceptance criteria` markdown into displayable rows:
 * top-level bullets become criterion rows (continuation lines fold in);
 * bare paragraphs keep one row each. Total — any text renders.
 */
export function criterionLines(raw: string, status: TaskStatus): CriterionLine[] {
  const met = status === "done" || status === "merging";
  const rows: CriterionLine[] = [];
  let current: string | undefined;
  const flush = (): void => {
    if (current !== undefined && current !== "") rows.push({ text: current, met });
    current = undefined;
  };
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    const bullet = /^[-*]\s+(.*)$/.exec(trimmed);
    if (bullet !== null) {
      flush();
      current = bullet[1] ?? "";
    } else if (trimmed === "") {
      flush();
    } else if (current !== undefined) {
      current += ` ${trimmed}`;
    } else {
      rows.push({ text: trimmed, met });
    }
  }
  flush();
  return rows;
}

function findTask(model: ProjectParseResult, ref: TaskRef): TaskRecord | undefined {
  if (ref.kind === "file") return model.tasks.find((t) => t.file === ref.file);
  // Duplicate ids: first occurrence wins (the parser already flags
  // duplicate-id; consistent with the board's duplicate-column rule).
  return model.tasks.find((t) => t.id === ref.id);
}

/**
 * Derive the detail panel's content for one task from the current model.
 * Returns undefined when the ref no longer resolves (task deleted, file
 * renamed away from a file-ref) — the panel shows a calm "no longer
 * present" state, and recovers by construction if the task returns.
 */
export function selectTaskDetail(model: ProjectParseResult, ref: TaskRef): TaskDetail | undefined {
  const task = findTask(model, ref);
  if (task === undefined) return undefined;

  // ADR-009: ids are file-derived strings — keyed lookup is a Map.
  const byId = new Map<string, TaskRecord>();
  for (const t of model.tasks) {
    if (t.id !== undefined && !byId.has(t.id)) byId.set(t.id, t);
  }

  const blockedBy: BlockerLink[] = task.blockedBy.map((id) => {
    const target = byId.get(id);
    if (target === undefined) return { id, resolved: false };
    return {
      id,
      resolved: true,
      title: target.title,
      status: target.status,
      visual: statusVisual(target.status),
    };
  });

  return {
    id: task.id,
    title: task.title,
    status: task.status,
    visual: statusVisual(task.status),
    suggested: task.status === "suggested",
    size: task.size,
    feature: task.feature,
    priority: task.priority,
    suggestedBy: task.suggestedBy,
    preamble: section(task.sections.preamble),
    acceptanceCriteria: section(task.sections.acceptanceCriteria),
    implementationNotes: section(task.sections.implementationNotes),
    verdicts: section(task.sections.verdicts),
    blockedBy,
    touches: task.touches,
    issues: issuesByFile(model.issues).get(task.file) ?? [],
    // T-169: the parser's own answer, joined by file exactly like the
    // sentences above — the panel and the card face can never disagree
    // about which card the assignment flag belongs to.
    assignment: assignmentByFile(model.issues).get(task.file) ?? [],
    builtBy: task.builtBy?.raw,
    verifiedBy: task.verifiedBy?.raw,
    review: task.review,
    file: task.file,
  };
}
