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

/** The body sections of a task file. Absent heading = absent key. */
export interface TaskSections {
  /**
   * Body text BEFORE the first `##` heading (T-019, absorbing T-002-s2):
   * the context paragraph a suggestion's entire content lives in
   * (TASK-FORMAT.md: "title, one paragraph of context"). Preserved for
   * every status, trimmed; absent when there is no such text. Optional so
   * pre-T-019 hand-built sections stay valid (the T-008 precedent).
   */
  preamble?: string;
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

/**
 * Component statuses (docs/design/map-technical-plan.md §2): `auto`
 * (default — derive from the tasks touching the component, T-011) or one
 * of the six pinnable task statuses. `suggested` and `parked` are task-only.
 */
export const COMPONENT_STATUSES = [
  'auto',
  'planned',
  'building',
  'verifying',
  'rejected',
  'merging',
  'done',
] as const;

export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];

/**
 * One architecture intent file (ADR-014):
 * docs/architecture/components/C-xx-<slug>.md — frontmatter + prose,
 * one component per file, same C-namespace as docs/ARCHITECTURE.md
 * (plan §0.0 item 8). Parsed here per ADR-015 so the map's derivation
 * (T-011) never grows a second frontmatter parser.
 */
export interface ComponentRecord {
  /** Component id, pattern `C-\d{2,}`, unique across files. */
  id: string;
  name: string;
  /** Free-form grouping/lane label; optional. */
  layer?: string;
  /** Non-empty gitignore-style globs relative to the repo root. */
  paths: string[];
  /**
   * Declared, directional dependencies (this component → those C-ids).
   * Entries naming no known component are PRESERVED (never dropped) so
   * derivation can draw placeholder nodes; the parser flags them with a
   * `dangling-reference` issue at set level.
   */
  dependsOn: string[];
  /** Linked decision records (ids resolve to docs/decisions/*). */
  decisions: string[];
  /**
   * Task-intersection slugs per the ARCHITECTURE.md mapping (plan §0.0
   * item 4): tasks whose `touches` intersect these roll up into this
   * component's derived status.
   */
  touchSlugs: string[];
  /** `auto` = derive from tasks (T-011); any other value pins the node. */
  status: ComponentStatus;
  /** Body prose — the component's responsibility, shown verbatim. */
  responsibility: string;
  /**
   * Frontmatter keys outside the component format, preserved verbatim.
   * Never silently deleted (archaeology convention); empty when none.
   */
  extra: Record<string, unknown>;
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
 * Which id space an issue is about (T-053). The three spaces this
 * convention numbers independently: the component registry
 * (`docs/architecture/components/C-*.md`), task files
 * (`docs/tasks/T-*.md`, `-sN` suffix included) and the ROADMAP backbone
 * (`- F-NN:` bullets). Carried as a FIELD rather than split into three
 * issue kinds so a consumer can tell them apart without parsing prose —
 * see the `aliased-id` member for the reasoning.
 */
export type IdSpace = 'component' | 'task' | 'feature';

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
  /**
   * The same id string is declared twice; both paths listed, first seen
   * first. Both records are kept — flagging, not hiding.
   *
   * `space` says WHICH id space (T-076), the same required field its
   * sibling `aliased-id` gained at T-053 and for the same reason: this
   * kind spans all three spaces from four emit sites (the component
   * registry, the task disk layer, the task pure layer and the ROADMAP
   * backbone), and until T-076 the only way to tell them apart was to
   * read the prose or guess from the shape of `id` — exactly what T-053
   * ruled out for the very same concept. A consumer that can filter
   * aliases by space could not filter duplicates by it.
   *
   * `files` is index-aligned but NOT always distinct: both backbone
   * declarations live in `docs/ROADMAP.md`, so for `space: 'feature'` it
   * is the same path twice and the MESSAGE carries the line numbers that
   * actually locate them — the shape the feature `aliased-id` already
   * uses, so the two say the same kind of thing the same way.
   */
  | { kind: 'duplicate-id'; space: IdSpace; id: string; files: [string, string]; message: string }
  /**
   * Two or more DIFFERENT id strings whose numeric value is equal — zero
   * padding aliasing one slot (`C-05` and `C-005`; T-030 absorbing
   * T-008-s3). A SIBLING of `duplicate-id` rather than the same kind: the
   * ids differ as strings, so there is no single `id` to name, and the
   * ordering comparator (compareComponentIds) can only break the numeric
   * tie by string order — a winner nobody declared. ONE issue per numeric
   * slot, never one per pair: the aliasing is a single root cause however
   * many spellings share it (the T-019 one-root-cause discipline).
   * `ids`/`files` are index-aligned, in comparator order. Every record is
   * kept — flagging, not hiding.
   *
   * `space` says WHICH id space aliased (T-053, promoting T-030-s3): all
   * three are checked now — components, tasks (`-sN` suffix included, its
   * digits aliasing like any others) and backbone features. It is a field
   * rather than three kinds for the reason `dangling-reference` carries a
   * `field` and `duplicate-id` spans all three spaces already: the root
   * cause is ONE concept, and a consumer that wants only task aliases
   * filters on a value instead of learning three kind names. Prose is
   * never the discriminator.
   *
   * `files` is index-aligned but NOT always distinct: both backbone
   * declarations live in `docs/ROADMAP.md`, so for `space: 'feature'` it
   * is the same path twice and the MESSAGE carries the line numbers that
   * actually locate them.
   */
  | { kind: 'aliased-id'; space: IdSpace; ids: string[]; files: string[]; message: string }
  /** Roadmap structure problem (no backbone section, malformed F-line). */
  | { kind: 'roadmap-error'; file: string; message: string }
  /** A file or directory could not be read. */
  | { kind: 'io-error'; file: string; message: string }
  /**
   * A reference field names an id no parsed record declares (e.g. a
   * component's `depends_on` entry, a task's `blocked_by` entry, or a
   * task's `feature` against the roadmap backbone — the latter two from
   * validateProject, T-019). The reference is preserved on the record
   * (placeholder rendering / unresolved chips), never dropped.
   *
   * `nearMiss` is a HINT, not a second kind (T-076): the DECLARED ids
   * that occupy the reference's numeric slot without being it — `T-001`
   * when the reference reads `T-01`. Because the slot key strips leading
   * zeros and nothing else, a non-empty `nearMiss` means exactly one
   * thing: these ids differ from the reference in zero padding alone.
   * Without it the message is true and useless in the one case that
   * matters, telling an author that an id does not exist while the
   * padding variant of it sits one line away.
   *
   * It is a FIELD as well as a sentence because a consumer offering the
   * fix needs the id, and prose is never the discriminator in this union
   * (T-053's rule, applied to a hint rather than a kind). It is ABSENT
   * rather than empty when there is no near miss — the ordinary case —
   * and its absence can only mean that. Always in model order; several
   * spellings can qualify at once when the declared space is itself
   * aliased, and naming one of them would be a guess dressed as a fix.
   * All three emit sites carry it: `blocked_by`, `feature` and a
   * component's `depends_on`.
   */
  | {
      kind: 'dangling-reference';
      file: string;
      field: string;
      id: string;
      nearMiss?: string[];
      message: string;
    }
  /**
   * A task's declared `id` disagrees with the id its filename encodes
   * (`docs/tasks/T-NNN[-sN]-slug.md` — validateProject, T-019). `id` is
   * the frontmatter value, `expected` the filename-derived one. The
   * record keeps its declared id: frontmatter is the model's truth, the
   * filename the convention being violated — flagging, not hiding.
   */
  | { kind: 'id-mismatch'; file: string; id: string; expected: string; message: string }
  /**
   * An id-bearing task file whose BASENAME encodes no id at all
   * (`T-banana.md` declaring `id: T-901` — T-030 absorbing T-019-s2).
   * Distinct from `id-mismatch`, which compares two ids: here there is no
   * filename-derived id to compare, so `expected` would have to repeat
   * `id` and read as agreement. Id-LESS files (the suggestion shape) stay
   * legitimately free-form beyond the `T-` prefix and are never flagged.
   * The record keeps its declared id — flagging, not hiding.
   */
  | { kind: 'filename-id-missing'; file: string; id: string; message: string }
  /**
   * A `blocked_by` cycle: every member is reachable from every other, so
   * no member can ever be unblocked (T-030 absorbing T-019-s3). ONE issue
   * per cycle naming every member, never one per member — the T-019
   * one-root-cause discipline. A self-reference (`T-901` blocked_by
   * `T-901`) is the one-member case. `ids`/`files` are index-aligned in
   * model order; `field` is always `blocked_by` (the only cyclic reference
   * space today). Every record is kept and every reference preserved.
   */
  | { kind: 'dependency-cycle'; field: string; ids: string[]; files: string[]; message: string }
  /**
   * Two components' `paths` provably claim the same files; first by
   * component id order (`ids[0]`) wins file mapping. `ids`/`files`/
   * `patterns` are index-aligned. Emitted at parse time only for
   * matcher-agnostic certain overlaps (identical patterns, `P/**` prefix
   * containment); file-level detection against a real tree is derivation's
   * job (T-011), which reports through this same variant.
   */
  | {
      kind: 'ambiguous-mapping';
      ids: [string, string];
      files: [string, string];
      patterns: [string, string];
      message: string;
    };

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

/** Result of parsing one component file. `component` is absent when the
 * file's identity (a valid `C-\d{2,}` id plus a name) could not be
 * established; field-level issues may accompany a returned record. */
export interface ComponentParseResult {
  component?: ComponentRecord;
  issues: ParseIssue[];
}

/** Result of parsing a component-file set (directory or in-memory). */
export interface ComponentSetResult {
  components: ComponentRecord[];
  issues: ParseIssue[];
}

/** Result of parsing a whole project (tasks directory + roadmap +
 * architecture component files). */
export interface ProjectParseResult {
  tasks: TaskRecord[];
  features: FeatureRecord[];
  /**
   * Architecture components (T-008). Optional so pre-T-008 hand-built
   * models stay valid; every parser entry point always sets it. Absent
   * docs/architecture/components/ is a legal state (plan §6.5) and yields
   * `[]` with no issue — unlike the required roadmap.
   */
  components?: ComponentRecord[];
  issues: ParseIssue[];
}
