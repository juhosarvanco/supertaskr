import type { DocsModelState } from "@/lib/docs-model";

/**
 * Genesis lens derivation (T-024, C-13): pure mapping from the existing
 * watcher state to the model the genesis pane renders. No React, no
 * Tauri, no IO, no wall clock — time enters exclusively as the `nowMs`
 * argument, so every state (including "writing", a time-window state)
 * is deterministic under test.
 *
 * Data source: `DocsModelState.effective` — every docs file's current
 * renderable text (model inputs carry their last-good fallback, so a
 * torn task file keeps its stale content here while the parse-chip
 * machinery reports the failure) — plus the parsed `model` for backbone
 * features. C-10 machinery is read, never driven.
 *
 * ADR-009: collections keyed by file-derived strings are Maps, never
 * object literals.
 */

// ---- the banking map (normative transcription) --------------------------

/**
 * Transcribed VERBATIM from method/interview/plan-interview.md § Output
 * (v0.1.5, T-023) — the stage → artifact banking table. That table is
 * normative: programs transcribe it as written, changing it is a method
 * version bump, and code reading it must be kept in sync
 * (docs/CONVENTIONS.md gotcha). test/genesis-derive.test.ts re-reads
 * the method file and asserts every cell below still matches, so a
 * table edit fails the suite instead of silently drifting this lens.
 */
export interface BankingStage {
  /** The table's Stage cell. */
  stage: number;
  /** The table's "Interview step" cell, verbatim. */
  step: string;
  /** The table's "Banks into" cell, verbatim. */
  banks: string;
}

export const BANKING_MAP: readonly BankingStage[] = [
  {
    stage: 0,
    step: "scaffold (pre-Q1)",
    // T-265: `.supertaskr/` here is a VERBATIM transcription of
    // method/interview/plan-interview.md's stage table, and `every cell of
    // the 9-row table matches plan-interview.md verbatim` reds the moment
    // the two disagree. This cell moves WITH that file, never ahead of it
    // — T-264 held it at the pre-rename spelling for exactly that reason,
    // and this lane moves both in one commit (ADR-022 decision 2).
    banks:
      "docs/ tree copied verbatim from docs-templates/ + empty docs/decisions/ docs/tasks/ docs/rooms/ + adapter files at project root + .gitignore carrying `.supertaskr/` + git init if absent + docs/STATE.md stamped (Updated, In progress = next stage)",
  },
  { stage: 1, step: "Q1 problem & person", banks: "docs/NORTH_STAR.md § Vision + § Users" },
  { stage: 2, step: "Q2 success", banks: "docs/NORTH_STAR.md § Success criteria" },
  { stage: 3, step: "Q3 non-goals", banks: "docs/NORTH_STAR.md § Non-goals" },
  { stage: 4, step: "Q4 constraints", banks: "docs/NORTH_STAR.md § Hard constraints" },
  {
    stage: 5,
    step: "Q5 stack & why",
    banks: "docs/decisions/001-stack.md (+ one ADR per contested choice)",
  },
  { stage: 6, step: "Q6 riskiest assumption", banks: "docs/NORTH_STAR.md § Riskiest assumption" },
  {
    stage: 7,
    step: "Q7 first slice",
    banks:
      "docs/ROADMAP.md § Backbone (ordered as the USER experiences the product) + § Milestones (milestone 1 goal)",
  },
  {
    stage: 8,
    step: "decomposition",
    banks:
      "docs/tasks/T-*.md (see decomposition.md; every task passes the dispatchability test) + docs/ARCHITECTURE.md first draft + docs/ROADMAP.md § Milestones (task list) + § Parked + docs/STATE.md § Next up",
  },
];

/** Footer-friendly step names, one per banking stage (drops the Q-number
 * prefixes; "the riskiest assumption" phrasing follows the design's own
 * footer line). */
const STEP_DISPLAY: readonly string[] = [
  "scaffold",
  "problem & person",
  "success",
  "non-goals",
  "constraints",
  "stack & why",
  "the riskiest assumption",
  "first slice",
  "decomposition",
];

// ---- model types --------------------------------------------------------

export type ArtifactStatus = "expected" | "written" | "writing";

export interface GenesisArtifact {
  /** Display path — a real docs path, or the banking map's glob when the
   * stage has not produced files yet (e.g. `docs/tasks/T-*.md`). */
  path: string;
  status: ArtifactStatus;
  /** Occurrences of the literal `[?]` marker in the file's effective
   * content, HTML comments stripped (a comment ABOUT the convention is
   * not an unresolved claim — the streak tree's four constraint
   * assumptions count 4, not 5). Always 0 for `expected`. */
  assumptions: number;
  /** First banking-map stage that banks into this artifact (row order). */
  stage: number;
}

export type ChipKind = "person" | "success" | "non-goal";

export interface NorthStarChip {
  kind: ChipKind;
  text: string;
}

export interface NorthStarCard {
  /** First sentence of § Vision. */
  title: string;
  /** person / success / non-goal extracts, in that order; a chip is
   * absent when its section is missing or template-empty. */
  chips: NorthStarChip[];
}

export type BackboneEntry =
  | { kind: "built"; id: string; name: string }
  | { kind: "forming"; id: string };

export interface GenesisModel {
  /** Count of .md files under docs/ in the applied snapshot (the header's
   * "docs/ · N files written"). */
  filesWritten: number;
  /**
   * APPROXIMATE stage: the highest banking-map stage whose artifacts
   * exist (criterion 1's designed approximation) — null when nothing is
   * on disk yet. "Exist" is template-empty-aware for section artifacts
   * (the resume rule's reading): a scaffolded heading with only comment
   * guidance under it does not exist yet. Recorded approximations:
   * stage 7 collapses "Backbone + Milestones" to ≥1 parsed feature;
   * stage 8 collapses its four-artifact row to ≥1 task file present;
   * a gap (later artifact exists, earlier missing) reads as the higher
   * stage — highest-wins is the criterion's own choice.
   */
  approxStage: number | null;
  /** Display name of the approximate stage's step (STEP_DISPLAY). */
  stageStep: string | null;
  /** Footer sentence naming what the banking map says comes next. */
  nextLine: string;
  /** Footer-right stage line, tilde-marked as the approximation. */
  stageLine: string;
  northStar: NorthStarCard | null;
  backbone: BackboneEntry[];
  artifacts: GenesisArtifact[];
  /**
   * Milliseconds until the earliest `writing` artifact falls back to
   * `written` with no further snapshot — null when nothing is writing.
   * The pane schedules exactly one re-derivation at this horizon; pure
   * callers (tests) ignore it or advance their injected clock.
   */
  nextTransitionMs: number | null;
}

// ---- change tracking (feeds the "writing" window) -----------------------

/** How long a change keeps its artifact in the `writing` state — the
 * criterion's "changed within the last few seconds". */
export const WRITING_WINDOW_MS = 5000;

/**
 * Pure change log across observed states: per-path content plus the
 * injected-clock timestamp of the last observed content change. The
 * FIRST observed snapshot is a baseline — nothing is stamped, so
 * opening an existing project never renders a wall of false "writing"
 * pulses; from then on a path stamps when it appears or its bytes
 * change.
 */
export interface GenesisChangeLog {
  /** Seq of the last observed state (identity guard). */
  seq: number;
  /** Project the log belongs to; a switch re-baselines (same-named
   * paths in another project must never read as "just written"). */
  projectDir: string;
  /** True once a baseline snapshot has been recorded. */
  primed: boolean;
  contents: ReadonlyMap<string, string>;
  changedAtMs: ReadonlyMap<string, number>;
}

export const EMPTY_CHANGE_LOG: GenesisChangeLog = {
  seq: 0,
  projectDir: "",
  primed: false,
  contents: new Map(),
  changedAtMs: new Map(),
};

/**
 * Observe one docs state. Returns `prev` by identity for the pre-project
 * empty state (seq 0) and for already-observed / stale seqs, so
 * StrictMode double-renders and unrelated re-renders never re-stamp.
 * The first snapshot of a project — including after a project switch —
 * is a BASELINE: contents are recorded, nothing is stamped, so opening
 * or resuming an existing tree never renders a wall of false "writing"
 * pulses. From then on a path stamps when it appears or its bytes
 * change. Deterministic: same (prev, docs, nowMs) → same result.
 */
export function observeDocsChange(
  prev: GenesisChangeLog,
  docs: DocsModelState,
  nowMs: number,
): GenesisChangeLog {
  if (docs.seq === 0) return prev; // nothing applied yet
  const sameProject = prev.primed && docs.projectDir === prev.projectDir;
  if (sameProject && docs.seq <= prev.seq) return prev; // observed or stale
  const baseline = !sameProject;
  const contents = new Map<string, string>();
  const changedAtMs = new Map<string, number>();
  for (const [path, content] of docs.effective) {
    contents.set(path, content);
    if (baseline) continue; // record, never stamp
    const before = prev.contents.get(path);
    if (before === content) {
      const kept = prev.changedAtMs.get(path);
      if (kept !== undefined) changedAtMs.set(path, kept);
    } else {
      changedAtMs.set(path, nowMs); // new or changed bytes
    }
  }
  return { seq: docs.seq, projectDir: docs.projectDir, primed: true, contents, changedAtMs };
}

// ---- NORTH_STAR parsing (absent-tolerant) -------------------------------

/** Strip HTML comments (multi-line, non-greedy; an unclosed comment
 * strips to the end — mid-write tolerance, never a crash). */
export function stripHtmlComments(text: string): string {
  return text.replace(/<!--[\s\S]*?(?:-->|$)/g, "");
}

/** Split a markdown document into `## ` sections: heading text (lowercased)
 * → body text. Content before the first `## ` heading is ignored. Later
 * duplicate headings win (last write is what's on disk). */
export function splitSections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split(/\r?\n/);
  let current: string | null = null;
  let body: string[] = [];
  const flush = (): void => {
    if (current !== null) sections.set(current, body.join("\n"));
  };
  for (const line of lines) {
    const heading = /^##\s+(.*)$/.exec(line);
    if (heading !== null) {
      flush();
      current = (heading[1] ?? "").trim().toLowerCase();
      body = [];
    } else if (current !== null) {
      body.push(line);
    }
  }
  flush();
  return sections;
}

/** A section "exists" (resume-rule reading) when it has non-comment,
 * non-whitespace content under its heading. */
function sectionText(sections: Map<string, string>, name: string): string {
  return stripHtmlComments(sections.get(name) ?? "").trim();
}

/** First content unit of a section body: the first bullet / numbered item's
 * text when the body is a list, else the first sentence. */
function firstUnit(body: string): string {
  const lines = body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const first = lines[0] ?? "";
  const bullet = /^(?:[-*]|\d+\.)\s+(.*)$/.exec(first);
  if (bullet !== null) {
    // A wrapped bullet continues until the next bullet line.
    const rest: string[] = [bullet[1] ?? ""];
    for (const line of lines.slice(1)) {
      if (/^(?:[-*]|\d+\.)\s+/.test(line)) break;
      rest.push(line);
    }
    return firstSentence(rest.join(" "));
  }
  return firstSentence(lines.join(" "));
}

/** First sentence of a prose blob (whitespace collapsed). */
function firstSentence(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  const match = /^[\s\S]*?[.!?](?=\s|$)/.exec(collapsed);
  return (match?.[0] ?? collapsed).trim();
}

/** Clip chip text to a glanceable length on a word boundary. */
const CHIP_CLIP = 44;
function clip(text: string): string {
  if (text.length <= CHIP_CLIP) return text;
  const cut = text.slice(0, CHIP_CLIP);
  const space = cut.lastIndexOf(" ");
  return `${cut.slice(0, space > 24 ? space : CHIP_CLIP).trimEnd()}…`;
}

/** Count unresolved-claim markers: literal `[?]` occurrences after HTML
 * comments are stripped (comments about the convention don't count). */
export function countAssumptions(content: string): number {
  return stripHtmlComments(content).split("[?]").length - 1;
}

// ---- artifact + stage derivation ---------------------------------------

const NORTH_STAR_FILE = "docs/NORTH_STAR.md";
const ROADMAP_FILE = "docs/ROADMAP.md";
const STATE_FILE = "docs/STATE.md";
const CONVENTIONS_FILE = "docs/CONVENTIONS.md";
const ARCHITECTURE_FILE = "docs/ARCHITECTURE.md";
const STACK_DECISION_FILE = "docs/decisions/001-stack.md";

const isDocsMarkdown = (path: string): boolean =>
  path.startsWith("docs/") && path.endsWith(".md");
const isTaskPath = (path: string): boolean =>
  /^docs\/tasks\/[^/]+\.md$/.test(path);
const isDecisionPath = (path: string): boolean =>
  /^docs\/decisions\/[^/]+\.md$/.test(path);

/** NORTH_STAR section names per banking stage (lowercased headings). */
const NS_SECTION_BY_STAGE: ReadonlyMap<number, string> = new Map([
  [1, "vision"], // + users, checked separately
  [2, "success criteria"],
  [3, "non-goals"],
  [4, "hard constraints"],
  [6, "riskiest assumption"],
]);

/**
 * Derive the pane's whole model. Pure and deterministic: same
 * (docs, log, nowMs) → deep-equal result.
 */
export function deriveGenesis(
  docs: DocsModelState,
  log: GenesisChangeLog,
  nowMs: number,
): GenesisModel {
  const effective = docs.effective;
  const docsMd = [...effective.keys()].filter(isDocsMarkdown).sort();
  const filesWritten = docsMd.length;

  // -- writing-state helper (the injected clock is the only time source)
  const writingSince = (path: string): number | undefined => log.changedAtMs.get(path);
  const isWriting = (path: string): boolean => {
    const at = writingSince(path);
    return at !== undefined && nowMs - at < WRITING_WINDOW_MS;
  };

  // -- north star
  const nsRaw = effective.get(NORTH_STAR_FILE);
  const nsSections = nsRaw !== undefined ? splitSections(nsRaw) : new Map<string, string>();
  const nsText = (name: string): string => sectionText(nsSections, name);
  const vision = nsText("vision");
  let northStar: NorthStarCard | null = null;
  if (vision.length > 0) {
    const chips: NorthStarChip[] = [];
    const person = nsText("users");
    const success = nsText("success criteria");
    const nonGoal = nsText("non-goals");
    if (person.length > 0) chips.push({ kind: "person", text: clip(firstUnit(person)) });
    if (success.length > 0) chips.push({ kind: "success", text: clip(firstUnit(success)) });
    if (nonGoal.length > 0) chips.push({ kind: "non-goal", text: clip(firstUnit(nonGoal)) });
    northStar = { title: firstSentence(vision), chips };
  }

  // -- backbone (parsed ROADMAP model; forming = ROADMAP mid-write)
  const features = docs.model.features;
  const backbone: BackboneEntry[] = features.map((f) => ({
    kind: "built",
    id: f.id,
    name: f.name,
  }));
  if (isWriting(ROADMAP_FILE)) {
    backbone.push({ kind: "forming", id: nextFeatureId(features.map((f) => f.id)) });
  }

  // -- stage inference (approximation as designed; see GenesisModel docs)
  const has = (path: string): boolean => effective.has(path);
  const taskPaths = docsMd.filter(isTaskPath);
  const stageExists = (stage: number): boolean => {
    switch (stage) {
      case 0:
        return filesWritten > 0;
      case 1:
        return nsText("vision").length > 0 && nsText("users").length > 0;
      case 5:
        return has(STACK_DECISION_FILE);
      case 7:
        return features.length > 0;
      case 8:
        return taskPaths.length > 0;
      default: {
        const section = NS_SECTION_BY_STAGE.get(stage);
        return section !== undefined && nsText(section).length > 0;
      }
    }
  };
  let approxStage: number | null = null;
  for (const row of BANKING_MAP) {
    if (stageExists(row.stage)) approxStage = row.stage;
  }

  // -- artifact rows, banking-map order (stage of first bank; the
  //    CONVENTIONS seam rides stage 5 per the table's footnote)
  const artifacts: GenesisArtifact[] = [];
  const row = (path: string, stage: number): void => {
    const content = effective.get(path);
    if (content === undefined) {
      artifacts.push({ path, status: "expected", assumptions: 0, stage });
      return;
    }
    artifacts.push({
      path,
      status: isWriting(path) ? "writing" : "written",
      assumptions: countAssumptions(content),
      stage,
    });
  };
  row(STATE_FILE, 0);
  row(NORTH_STAR_FILE, 1);
  const decisionPaths = docsMd.filter(isDecisionPath);
  if (decisionPaths.length === 0) {
    artifacts.push({ path: STACK_DECISION_FILE, status: "expected", assumptions: 0, stage: 5 });
  } else {
    for (const path of decisionPaths) row(path, 5);
  }
  row(CONVENTIONS_FILE, 5);
  row(ROADMAP_FILE, 7);
  if (taskPaths.length === 0) {
    artifacts.push({ path: "docs/tasks/T-*.md", status: "expected", assumptions: 0, stage: 8 });
  } else {
    for (const path of taskPaths) row(path, 8);
  }
  row(ARCHITECTURE_FILE, 8);

  // -- footer lines from the banking map
  const nextLine = nextLineForStage(approxStage);
  const stageLine =
    approxStage === null
      ? "stage —"
      : `stage ~${approxStage} · ${STEP_DISPLAY[approxStage] ?? ""}`;

  // -- earliest writing → written horizon (pure; the pane's one timer)
  let nextTransitionMs: number | null = null;
  for (const artifact of artifacts) {
    if (artifact.status !== "writing") continue;
    const at = writingSince(artifact.path);
    if (at === undefined) continue;
    const remaining = at + WRITING_WINDOW_MS - nowMs;
    if (nextTransitionMs === null || remaining < nextTransitionMs) {
      nextTransitionMs = remaining;
    }
  }
  // The forming backbone card rides ROADMAP's own writing window, which
  // the ROADMAP artifact row already schedules.

  return {
    filesWritten,
    approxStage,
    stageStep: approxStage === null ? null : (STEP_DISPLAY[approxStage] ?? null),
    nextLine,
    stageLine,
    northStar,
    backbone,
    artifacts,
    nextTransitionMs,
  };
}

/** Next sequential F-NN id after the parsed ones (the design's forming
 * card carries the id the interview is about to bank). */
function nextFeatureId(ids: string[]): string {
  let max = 0;
  for (const id of ids) {
    const n = /^F-(\d+)$/.exec(id);
    if (n !== null) max = Math.max(max, Number(n[1]));
  }
  return `F-${String(max + 1).padStart(2, "0")}`;
}

/** The footer's "next" sentence, straight off the banking map: the one
 * or two steps after the approximate stage; the design's "cards rain
 * into the board" flourish belongs to decomposition. Exported pure so
 * the suite pins the whole stage table without fixture gymnastics. */
export function nextLineForStage(approxStage: number | null): string {
  const s = approxStage ?? -1;
  if (s >= 8) return "Milestone 1 decomposed — the board is live.";
  const next = STEP_DISPLAY[s + 1] ?? "";
  if (s + 1 === 8) return `Next: ${next} — cards rain into the board.`;
  const after = STEP_DISPLAY[s + 2] ?? "";
  const tail = s + 2 === 8 ? " — cards rain into the board" : "";
  return `Next: ${next}, then ${after}${tail}.`;
}
