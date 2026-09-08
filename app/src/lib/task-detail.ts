import type {
  ProjectParseResult,
  ReviewMode,
  TaskRecord,
  TaskSize,
  TaskStatus,
} from "@supertaskr/parser/pure";
import {
  assignmentByFile,
  issuesByFile,
  selectDispositions,
  statusVisual,
  type AssignmentDisclosure,
  type BoardCard,
  type DispatchReading,
  type Disposition,
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

// ---- the dispatch brief (T-112) --------------------------------------
//
// **THE PANEL RENDERS A BRIEF ONLY FOR A CARD YOU MAY ACTUALLY
// DISPATCH.** A brief for a card whose fence a live lane holds is an
// invitation to break that fence, so the gate is T-111's disposition and
// the alternative is the disposition's own REASON — the sentence a human
// can argue with — rather than a blank space that says nothing.
//
// **THIS IS `selectDispositions`' FIRST CONSUMER IN `app/src`**, which
// is why the judgement is TAKEN here and not re-derived: a second
// implementation of "is this dispatchable" is two chances to disagree
// (T-057), and the frontier's own module is where that question is
// already answered with a pin under every arm.
//
// The brief itself is assembled Rust-side (C-15,
// `app/src-tauri/src/dispatch/brief.rs`) because it reads `method/`,
// the root adapter and CONVENTIONS — files the app's watched `docs/`
// snapshot does not carry. What arrives here is that answer, mirrored
// STRUCTURALLY: importing `dispatch-store.ts` would declare a C-17 ->
// C-15 component edge the registry does not carry, for a type, which is
// the same trade `board-model.ts` refuses one module over.

/** Where one brief line came from. Structurally satisfied by C-15's
 * `BriefProvenanceWire`. */
export type BriefProvenance =
  | { readonly kind: "tree"; readonly source: string }
  | { readonly kind: "live"; readonly source: string }
  | { readonly kind: "composed"; readonly from: readonly string[] };

/** One line of one row. */
export interface BriefLineView {
  readonly label: string;
  readonly text: string;
  readonly provenance: BriefProvenance;
}

/** One row: the contract's own three columns, plus content. */
export interface BriefRowView {
  readonly number: number;
  readonly carries: string;
  readonly assembledFrom: string;
  readonly ifAbsent: string;
  readonly lines: readonly BriefLineView[];
  /** A residual the CONTRACT carries, surfaced rather than papered over. */
  readonly residual: string | null;
}

/** The assembler's typed answer, as this layer consumes it. */
export type BriefOutcomeView =
  | {
      readonly kind: "assembled";
      readonly brief: {
        readonly role: string;
        readonly roleFile: string;
        readonly taskId: string;
        readonly cardPath: string;
        readonly rows: readonly BriefRowView[];
        readonly marker: string | null;
      };
    }
  | { readonly kind: "contractUnreadable"; readonly source: string }
  | { readonly kind: "contractMissing"; readonly source: string }
  | {
      readonly kind: "unassemblable";
      readonly rows: readonly { readonly number: number; readonly source: string; readonly path: string }[];
    }
  | { readonly kind: "noSuchCard"; readonly taskId: string };

/**
 * What the panel puts on screen.
 *
 * Three answers and no two of them are the same silence: a brief you may
 * copy, a REASON you may not, and an assembler that could not tell you.
 */
/**
 * The sentence the drawer shows when the lane scan was TRUNCATED — the
 * dispatch half of the shell's own docs note, *"docs truncated · showing
 * first N files"* (T-018, `App.tsx`).
 *
 * **THIS REPOSITORY ALREADY RULED THE CASE, AND THE DISPATCH SCAN WAS THE
 * ONE TRUNCATION WITH NO WAY TO SAY SO (T-185).** The two are the same
 * case — a bounded read whose answer is a floor, shown to a human who
 * would otherwise take it for a count — and the ONLY reason the dispatch
 * scan got no note is that the type it reached had no field for one.
 */
const FLOOR_NOTE =
  "lane list truncated · this is a FLOOR, not a count — the reader hit its entry ceiling, " +
  "so this card was cleared against the lanes it could see";

export type BriefPanel =
  | {
      readonly kind: "copyable";
      readonly taskId: string;
      readonly text: string;
      /**
       * {@link FLOOR_NOTE} when the lane scan was a floor, `null` when it
       * was a count.
       *
       * **IT RIDES ON THIS ARM AND NOT ON THE OTHER TWO, WHICH IS A
       * CHOICE RATHER THAN AN OMISSION.** `withheld` and `unavailable`
       * already carry a sentence saying why nothing may be dispatched,
       * and a floor cannot make a refusal wrong — lanes the scan missed
       * can only make it more certain. `copyable` is the one arm that
       * invites an ACT, and it is exactly the invitation a floor
       * undermines: the card was cleared against a SUBSET of the lanes,
       * so a fence it appears to clear may be held by one the scan never
       * reached.
       *
       * `string | null` rather than optional, for the reason
       * `DispatchReading.truncated` is required one module over: an
       * omitted note and a scan that was complete must not be one value.
       */
      readonly floor: string | null;
    }
  | {
      readonly kind: "withheld";
      readonly disposition: Disposition;
      readonly reason: string;
    }
  | { readonly kind: "unavailable"; readonly sentence: string };

/** One provenance, rendered as the suffix a reader can check. */
function provenanceSuffix(provenance: BriefProvenance): string {
  switch (provenance.kind) {
    case "tree":
      return `<- ${provenance.source}`;
    case "live":
      return `<- LIVE at dispatch, re-read it: ${provenance.source}`;
    case "composed":
      return `<- composed from: ${provenance.from.join(", ")}`;
  }
}

/**
 * The brief as the block a human copies into whatever agent they have.
 *
 * **EVERY LINE CARRIES WHERE IT CAME FROM**, which is what makes the
 * pasted brief and a spawned one indistinguishable: nothing here is the
 * only copy of itself, so the session reading it can check every line
 * against the repository. The rows are the assembler's — this function
 * chooses no content and drops none.
 */
export function renderBrief(outcome: Extract<BriefOutcomeView, { kind: "assembled" }>): string {
  const { brief } = outcome;
  const out: string[] = [
    `# THE DISPATCH BRIEF — ${brief.taskId}, for the ${brief.role}`,
    `# role file: ${brief.roleFile}`,
    `# card: ${brief.cardPath} — READ IT IN FULL`,
    "# every row below is assembled from the source that row itself names;",
    "# no figure is stamped here, so re-derive at your own ref (row 13).",
  ];
  for (const row of brief.rows) {
    out.push("", `ROW ${row.number} — ${row.carries}`, `  assembled from: ${row.assembledFrom}`);
    for (const line of row.lines) {
      out.push(`  ${line.label}: ${line.text}  ${provenanceSuffix(line.provenance)}`);
    }
    if (row.residual !== null) out.push(`  OPEN RESIDUAL: ${row.residual}`);
  }
  if (brief.marker !== null) out.push("", brief.marker);
  return out.join("\n");
}

/** The sentence a typed refusal reaches the reader as. */
function refusalSentence(outcome: BriefOutcomeView): string {
  switch (outcome.kind) {
    case "assembled":
      return "";
    case "contractMissing":
      return `the brief's own contract could not be read: ${outcome.source} is missing, so no row can be transcribed from it`;
    case "contractUnreadable":
      return `the normative table in ${outcome.source} could not be parsed, so the row set is unknown — a shorter brief would be a brief whose missing rows the session fills in by guessing`;
    case "noSuchCard":
      return `no card on this board carries the id ${outcome.taskId}`;
    case "unassemblable":
      return (
        "the brief is incomplete and is therefore not shown — a brief with a silently missing row is worse than no brief. " +
        outcome.rows
          .map((r) => `row ${r.number} could not be assembled from ${r.path === "" ? r.source : r.path}`)
          .join("; ")
      );
  }
}

/**
 * What the detail panel shows in its dispatch block for one card.
 *
 * `reading` is the lane reader's answer and `outcome` the assembler's.
 * Both come from C-15 through the board root; neither is derived here.
 */
export function selectBriefPanel(
  model: ProjectParseResult,
  ref: TaskRef,
  reading: DispatchReading,
  outcome: BriefOutcomeView | undefined,
): BriefPanel {
  const dispositions = selectDispositions(model, reading);
  if (dispositions.kind === "undecidable") {
    // The frontier refused to classify, so no card may be called
    // dispatchable and no brief may be offered. Its sentence says why.
    return { kind: "unavailable", sentence: dispositions.sentence };
  }
  const task = findTask(model, ref);
  const id = task?.id;
  if (id === undefined) {
    return {
      kind: "unavailable",
      sentence:
        "this card carries no id, so the dispatch frontier has no answer for it — a suggestion is triaged into a card before it is dispatched",
    };
  }
  const card = dispositions.cards.get(id);
  if (card === undefined) {
    return {
      kind: "unavailable",
      sentence: `the dispatch frontier returned no answer for ${id}`,
    };
  }
  if (card.disposition !== "dispatchable") {
    return {
      kind: "withheld",
      disposition: card.disposition,
      reason:
        card.reason ??
        `${id} is ${card.disposition}, and this disposition deliberately carries no reason`,
    };
  }
  if (outcome === undefined) {
    return {
      kind: "unavailable",
      sentence:
        "the assembler has not answered for this card yet — the brief is assembled from files the app reads Rust-side",
    };
  }
  if (outcome.kind !== "assembled") {
    return { kind: "unavailable", sentence: refusalSentence(outcome) };
  }
  return {
    kind: "copyable",
    taskId: id,
    text: renderBrief(outcome),
    // TAKEN, never re-derived: `scanIsFloor` is the reading's own
    // `truncated` carried through the frontier, and asking a second
    // question here about whether the scan was bounded would be the
    // T-057 divergence this whole seam is built to avoid.
    floor: dispositions.scanIsFloor ? FLOOR_NOTE : null,
  };
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
