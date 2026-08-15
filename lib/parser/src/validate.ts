import type { ParseIssue, ProjectParseResult } from './types.js';

/**
 * Cross-reference validation over an assembled project model (T-019,
 * absorbing T-002-s1/s3). Pure and read-only: takes parsed records,
 * returns structured issues, never throws, never drops or mutates a
 * record — the parser's job is flagging, not hiding (the T-002
 * contract), so a task whose references dangle still renders as a card
 * carrying its issues.
 *
 * Three checks, in task order (deterministic — tasks arrive path-sorted
 * from both collection layers), fields per task in this order:
 *
 * 1. `blocked_by` → each entry must be the id of a parsed task
 *    (`dangling-reference`, field `blocked_by`). Files under
 *    docs/tasks/rejected/ are not model inputs (T-016), so a reference
 *    into rejected territory dangles — deliberately.
 * 2. `feature` → must be a backbone id from the roadmap
 *    (`dangling-reference`, field `feature`). The parsed backbone is the
 *    reference space WHATEVER its size: a well-formed `## Backbone` with
 *    zero bullets parses clean to zero features, and every task feature
 *    then dangles against it, loudly — that is the mid-genesis
 *    accidentally-emptied-backbone state the 2026-08-16 rejection proved
 *    was end-to-end silent under the old zero-features skip. The check
 *    is skipped ONLY when the zero features are explained by the roadmap
 *    layer itself having failed and reported (`options.roadmapReported`:
 *    the roadmap's own io-error / roadmap-error — behavior pinned before
 *    T-019): with no backbone there is no reference space at all, and
 *    repeating that one already-reported root cause per task would be
 *    noise, not findings. Standalone callers omitting the option get the
 *    loud path — a hand-built model has no roadmap layer to have
 *    reported, so silence would just re-create the rejected hole.
 * 3. declared `id` ↔ filename (`id-mismatch`): the basename of a task
 *    file encodes its id (`T-NNN[-sN]-slug.md`); when the declared id
 *    and the encoded id disagree, the declared id stays the model's
 *    truth and the disagreement becomes an issue. Skipped when the task
 *    has no id (id-less suggestions — the dominant live pattern) or the
 *    basename encodes none (not this check's business; the parse layer
 *    already polices id FORMAT, so records only ever carry well-formed
 *    ids).
 *
 * Both project assemblers (parseProject, parseProjectFromFiles) run this
 * and append its issues after their own (task → roadmap → component →
 * cross-reference order); it is exported standalone from both package
 * entries for callers holding a hand-built model.
 *
 * ADR-009: ids are file-derived strings — membership lives in Sets,
 * never object literals, so `blocked_by: [__proto__]` cannot resolve
 * against inherited state.
 */
export interface ValidateProjectOptions {
  /**
   * True when the roadmap layer ALREADY reported its own failure — the
   * roadmap file's io-error or a roadmap-error from parsing it. Only the
   * assembler holding the roadmap layer's own issue list can assert this
   * precisely (a task-file or component io-error in the merged project
   * list must never spoof it), which is why it arrives as a distilled
   * flag instead of validateProject re-detecting roadmap-ness from mixed
   * issues. With zero features AND this flag, the feature check is
   * skipped (cascade suppression — one root cause, one report); in every
   * other state the flag is inert. Default false: loud.
   */
  roadmapReported?: boolean;
}

export function validateProject(
  project: Pick<ProjectParseResult, 'tasks' | 'features'>,
  options: ValidateProjectOptions = {},
): ParseIssue[] {
  const issues: ParseIssue[] = [];

  const taskIds = new Set<string>();
  for (const task of project.tasks) {
    if (task.id !== undefined) taskIds.add(task.id);
  }
  const featureIds = new Set<string>();
  for (const feature of project.features) featureIds.add(feature.id);
  // The feature reference space is absent (not merely empty) only when
  // the roadmap layer failed AND said so — see check 2 in the module doc.
  const skipFeatureCheck = featureIds.size === 0 && options.roadmapReported === true;

  for (const task of project.tasks) {
    for (const ref of task.blockedBy) {
      if (!taskIds.has(ref)) {
        issues.push({
          kind: 'dangling-reference',
          file: task.file,
          field: 'blocked_by',
          id: ref,
          message: `${task.file}: blocked_by names '${ref}' but no task in the model declares it (reference preserved on the record)`,
        });
      }
    }

    if (task.feature !== undefined && !skipFeatureCheck && !featureIds.has(task.feature)) {
      issues.push({
        kind: 'dangling-reference',
        file: task.file,
        field: 'feature',
        id: task.feature,
        message: `${task.file}: feature names '${task.feature}' but the roadmap backbone does not declare it (reference preserved on the record)`,
      });
    }

    if (task.id !== undefined) {
      const encoded = filenameId(task.file);
      if (encoded !== undefined && encoded !== task.id) {
        issues.push({
          kind: 'id-mismatch',
          file: task.file,
          id: task.id,
          expected: encoded,
          message: `${task.file}: declares id '${task.id}' but the filename encodes '${encoded}' (declared id kept as the model's truth)`,
        });
      }
    }
  }

  return issues;
}

/**
 * The id a task filename encodes, or undefined when it encodes none.
 * Longest-prefix by construction: `T-009-s1-graph-regen.md` encodes
 * `T-009-s1` (the greedy `-sN` arm wins over stopping at `T-009`), while
 * `T-009-simple.md` encodes `T-009` (`-simple` is a slug, not `-s\d+`).
 * The prefix must be followed by a `-slug` or be the whole stem
 * (`T-010.md`); anything else — `T-banana.md`, `T-010.bak.md` — encodes
 * nothing and is skipped. Both path flavors (POSIX from the pure layer,
 * platform-joined from the disk layer) reduce to a basename here.
 */
function filenameId(file: string): string | undefined {
  const basename = file.split(/[\\/]/).pop() ?? file;
  const match = /^(T-\d+(?:-s\d+)?)(?=-|\.md$)/.exec(basename);
  return match?.[1];
}
