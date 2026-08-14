/**
 * Typed model for the nputer file convention (method/tasks/TASK-FORMAT.md):
 * task files in docs/tasks/T-*.md and backbone feature lines in
 * docs/ROADMAP.md. This package is C-06 (lib-parser): a pure library —
 * it turns files into this model and nothing else.
 */

/** The eight task lifecycle statuses, per TASK-FORMAT.md. */
export const TASK_STATUSES = [
  'suggested',
  'planned',
  'building',
  'verifying',
  'rejected',
  'merging',
  'done',
  'parked',
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

/** Task sizes; size sets the ceremony tier (S | M | L). */
export const TASK_SIZES = ['S', 'M', 'L'] as const;

export type TaskSize = (typeof TASK_SIZES)[number];

/** Which verification guarantee actually held, stamped on done. */
export const REVIEW_MODES = ['independent', 'same-model', 'self-verified'] as const;

export type ReviewMode = (typeof REVIEW_MODES)[number];

/**
 * Session policy derived from `model[@session]` syntax:
 * `codex` = default session policy (fresh unless nputer.yaml says else),
 * `codex@fresh` = explicit fresh, `codex@S3` = resume registered session S3.
 */
export type SessionPolicy = 'default' | 'fresh' | 'resume';

/**
 * A parsed `model[@session]` value. Accepts both the compact form used in
 * builder/verifier (`codex@S3`) and the stamped form used in
 * built_by/verified_by (`codex/gpt-5.2 @S3`, space before the `@`).
 */
export interface ModelSession {
  /** The original string, untouched (trimmed). */
  raw: string;
  /** Model (or agent CLI) identifier, e.g. `codex`, `claude-fable-5`, `codex/gpt-5.2`. */
  model: string;
  /** Session part after `@`, e.g. `fresh` or `S3`. Absent = default policy. */
  session?: string;
  /** Interpretation of `session` per TASK-FORMAT.md session syntax. */
  policy: SessionPolicy;
}

/** The three body sections of a task file. Absent heading = absent key. */
export interface TaskSections {
  /** Raw markdown under `## Acceptance criteria` (EARS lines). */
  acceptanceCriteria?: string;
  /** Raw markdown under `## Implementation notes` (executor appends). */
  implementationNotes?: string;
  /** Raw markdown under `## Verdicts` (verifier appends). */
  verdicts?: string;
}

/**
 * One task file, typed. Field requiredness is status-aware:
 * - every file needs `title` and a valid `status`;
 * - `id` is required except on `status: suggested` (suggestions are minimal
 *   files; the architect renumbers them at triage);
 * - `feature`, `milestone`, `priority`, `size` are required except on
 *   `suggested`/`parked` (both may be minimal, backbone-level notes);
 * - `suggested_by` is required on `status: suggested`.
 */
export interface TaskRecord {
  /** Task id, e.g. `T-016`. Optional only for suggestions. */
  id?: string;
  title: string;
  status: TaskStatus;
  /** Story map column, e.g. `F-03`. */
  feature?: string;
  /** Above/below the slice line. */
  milestone?: number;
  /** Position in column; 1 = top = next. */
  priority?: number;
  size?: TaskSize;
  /** Task ids this task is blocked by. Defaults to []. */
  blockedBy: string[];
  /** Expected blast radius (component ids / path slugs). Defaults to []. */
  touches: string[];
  /** Attribution on suggestions (role, model@session, or human). Kept raw. */
  suggestedBy?: string;
  /** Planned builder; absent = nputer.yaml default. */
  builder?: ModelSession;
  /** Planned verifier; absent = default (independent). */
  verifier?: ModelSession;
  /** Stamped on completion, e.g. `codex/gpt-5.2 @S3`. */
  builtBy?: ModelSession;
  /** Stamped on completion, e.g. `claude-fable-5 @fresh`. */
  verifiedBy?: ModelSession;
  review?: ReviewMode;
  /**
   * Frontmatter keys outside TASK-FORMAT.md, preserved verbatim.
   * Never silently deleted (archaeology convention); empty when none.
   */
  extra: Record<string, unknown>;
  sections: TaskSections;
  /** Path of the source file, as given to the parser. */
  file: string;
}

/** One `- F-NN: Name — description` backbone line from docs/ROADMAP.md. */
export interface FeatureRecord {
  /** Feature id, e.g. `F-02`. */
  id: string;
  /** Text before the em-dash separator. */
  name: string;
  /** Text after the em-dash separator; '' when the line has no em dash. */
  description: string;
  /** 1-based line number of the bullet in the roadmap file. */
  line: number;
  /** Path of the roadmap file, as given to the parser. */
  file: string;
}

/**
 * Structured validation issues. Parsing never throws on bad input:
 * issues are collected and parsing continues with the remaining files.
 */
export type ParseIssue =
  /** File does not begin with a `---` frontmatter block. */
  | { kind: 'missing-frontmatter'; file: string; message: string }
  /** Frontmatter block is not valid YAML (message carries parser detail). */
  | { kind: 'yaml-error'; file: string; message: string }
  /** Frontmatter parsed but is not a key/value mapping. */
  | { kind: 'not-a-mapping'; file: string; message: string }
  /** A required frontmatter field is absent (requiredness is status-aware). */
  | { kind: 'missing-field'; file: string; field: string; message: string }
  /** A frontmatter field is present but malformed for its type. */
  | { kind: 'invalid-field'; file: string; field: string; message: string }
  /** The same id appears in two files; both paths listed, first seen first. */
  | { kind: 'duplicate-id'; id: string; files: [string, string]; message: string }
  /** Roadmap structure problem (no backbone section, malformed F-line). */
  | { kind: 'roadmap-error'; file: string; message: string }
  /** A file or directory could not be read. */
  | { kind: 'io-error'; file: string; message: string };

/** Result of parsing one task file. `task` is absent when the file's
 * identity (title + valid status, id where required) could not be
 * established; field-level issues may accompany a returned task. */
export interface TaskParseResult {
  task?: TaskRecord;
  issues: ParseIssue[];
}

/** Result of parsing a roadmap file. */
export interface RoadmapParseResult {
  features: FeatureRecord[];
  issues: ParseIssue[];
}

/** Result of parsing a whole project (tasks directory + roadmap). */
export interface ProjectParseResult {
  tasks: TaskRecord[];
  features: FeatureRecord[];
  issues: ParseIssue[];
}
