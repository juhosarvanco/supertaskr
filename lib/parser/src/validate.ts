import { assignmentIssues } from './assignment.js';
import { aliasedIdSlots, idSlotIndex, nearMissClause, slotNearMisses } from './id-slot.js';
import type { ParseIssue, ProjectParseResult, TaskRecord } from './types.js';

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
 *    Since T-076 a dangling reference whose numeric SLOT is occupied by a
 *    declared id carries that id, in `nearMiss` and in the message: the
 *    reference and the declaration differ in zero padding and nothing
 *    else, which is a different thing to tell an author than "it does not
 *    exist". Same for check 2 against the backbone. It is a HINT on the
 *    existing kind, never a new kind — the reference genuinely dangles.
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
 *    has no id (id-less suggestions — the dominant live pattern; the
 *    parse layer already polices id FORMAT, so records only ever carry
 *    well-formed ids).
 * 4. declared `id` ↔ a basename encoding NO id (`filename-id-missing`,
 *    T-030 absorbing T-019-s2): `T-banana.md` declaring `id: T-901` used
 *    to slip check 3 entirely — the narrowness was deliberate at T-019
 *    and is closed here. The rule is exactly as narrow as its reason:
 *    only an ID-BEARING file is flagged. An id-LESS file is a suggestion
 *    the architect has not numbered yet, and TASK-FORMAT.md leaves those
 *    free-form beyond the `T-` prefix the glob already demands — flagging
 *    them would make the convention stricter than it is written.
 * 5a. numerically equal task ids spelled differently (`aliased-id`,
 *    space `task` — T-053 promoting T-030-s3): `T-01` beside `T-001` is
 *    one slot spelled twice. Nothing rejected the pair before, because
 *    every rule here compares id strings exactly: `duplicate-id` sees two
 *    different strings, the filename rule is satisfied (each file encodes
 *    its own spelling), and a `blocked_by: [T-01]` that USED to be a loud
 *    dangling-reference silently starts resolving the moment an unpadded
 *    sibling appears — a dependency quietly meaning something other than
 *    its author meant, in the graph T-034 renders as waves and a critical
 *    path. The `-sN` suffix is part of the identity: its digits alias
 *    (`T-01-s1` / `T-001-s1`, `T-01-s01` / `T-01-s1`) while a suggestion
 *    never aliases its parent (`T-01` is NOT `T-01-s1`). ONE issue per
 *    slot; both records kept.
 * 5. `blocked_by` cycles (`dependency-cycle`, T-030 absorbing T-019-s3):
 *    a self-reference or any ring of tasks blocking each other is
 *    unsatisfiable — no member can ever start — yet it resolved silently,
 *    because every reference in a cycle points at a task that DOES exist.
 *    ONE issue per cycle naming every member, never one per member (the
 *    T-019 one-root-cause discipline). Cycles are strongly connected
 *    components of the blocked_by graph: an SCC is exactly "every member
 *    reaches every other", which is one root cause however many simple
 *    rings weave through it — and enumerating simple rings is exponential
 *    in the worst case, which no parser should be. Dangling references
 *    are not edges (check 1 already owns them).
 * 6. assignment vs execution (`assignment-violation`, T-169): the card's
 *    `builder:`/`verifier:` against its `built_by:`/`verified_by:`, on
 *    the MODEL half of `model@vehicle`. THE EXACT COMPARISON RULE IS AT
 *    ITS DEFINITION SITE in assignment.ts — it is not restated here,
 *    because a rule written in two places is two chances to disagree
 *    (T-057). The check is per-task and reference-free: it reads only the
 *    record's own fields, so no cascade suppression applies to it.
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
  // id -> first file declaring it, in model order (ADR-009: a Map, so an
  // id literally named `__proto__` cannot resolve against inherited state).
  const fileOfTask = new Map<string, string>();
  for (const task of project.tasks) {
    if (task.id === undefined) continue;
    taskIds.add(task.id);
    if (!fileOfTask.has(task.id)) fileOfTask.set(task.id, task.file);
  }
  const featureIds = new Set<string>();
  for (const feature of project.features) featureIds.add(feature.id);
  // The feature reference space is absent (not merely empty) only when
  // the roadmap layer failed AND said so — see check 2 in the module doc.
  const skipFeatureCheck = featureIds.size === 0 && options.roadmapReported === true;

  // Slot indexes over the two DECLARED spaces, built once each rather
  // than per reference — a 10k-task model with a 10k-long blocked_by list
  // is a file anyone can write, and this check must not be quadratic in
  // it. Maps, never object literals (ADR-009, via idSlotIndex): a
  // `blocked_by: [__proto__]` must not acquire a near miss out of
  // inherited state any more than it may resolve out of it.
  const taskSlots = idSlotIndex(taskIds);
  const featureSlots = idSlotIndex(featureIds);

  for (const task of project.tasks) {
    for (const ref of task.blockedBy) {
      if (!taskIds.has(ref)) {
        // T-076: `blocked_by: [T-01]` in a file that declares `T-001` used
        // to report only that nothing declares T-01 — true, and it sends
        // the author hunting a task that does not exist rather than at the
        // padding one line away.
        const nearMiss = slotNearMisses(ref, taskSlots);
        issues.push({
          kind: 'dangling-reference',
          file: task.file,
          field: 'blocked_by',
          id: ref,
          ...(nearMiss.length > 0 ? { nearMiss } : {}),
          message: `${task.file}: blocked_by names '${ref}' but no task in the model declares it${nearMissClause(nearMiss)} (reference preserved on the record)`,
        });
      }
    }

    if (task.feature !== undefined && !skipFeatureCheck && !featureIds.has(task.feature)) {
      const nearMiss = slotNearMisses(task.feature, featureSlots);
      issues.push({
        kind: 'dangling-reference',
        file: task.file,
        field: 'feature',
        id: task.feature,
        ...(nearMiss.length > 0 ? { nearMiss } : {}),
        message: `${task.file}: feature names '${task.feature}' but the roadmap backbone does not declare it${nearMissClause(nearMiss)} (reference preserved on the record)`,
      });
    }

    if (task.id !== undefined) {
      const encoded = filenameId(task.file);
      if (encoded === undefined) {
        issues.push({
          kind: 'filename-id-missing',
          file: task.file,
          id: task.id,
          message: `${task.file}: declares id '${task.id}' but the filename encodes no id — an id-bearing task file is named 'T-NNN[-sN]-<slug>.md' (declared id kept as the model's truth)`,
        });
      } else if (encoded !== task.id) {
        issues.push({
          kind: 'id-mismatch',
          file: task.file,
          id: task.id,
          expected: encoded,
          message: `${task.file}: declares id '${task.id}' but the filename encodes '${encoded}' (declared id kept as the model's truth)`,
        });
      }
    }

    // 6. assignment vs execution (`assignment-violation`, T-169 —
    //    @human's D5 ruling: assignment is BINDING). Last of the per-task
    //    checks, so every issue order pinned before this card is untouched.
    //    It reads only THIS record's own four fields, so unlike checks 1-2
    //    it needs no reference space and cannot cascade; it lives here
    //    rather than in parseTaskFile because that layer reports what a
    //    FIELD is malformed about, and both these fields are well-formed —
    //    what disagrees is the pair, which is a verdict over a record.
    issues.push(...assignmentIssues(task));
  }

  // The two project-shaped checks follow every per-task finding, so the
  // pinned per-task issue order is untouched. Aliases precede cycles
  // deliberately: an aliased slot makes every blocked_by edge below it
  // ambiguous, so it is the root cause a reader wants first.
  for (const ids of aliasedIdSlots(fileOfTask.keys())) {
    const files = ids.map((id) => fileOfTask.get(id) ?? '');
    const named = ids.map((id, i) => `'${id}' (${files[i] ?? ''})`).join(', ');
    issues.push({
      kind: 'aliased-id',
      space: 'task',
      ids,
      files,
      message: `numerically equal task ids ${named} — zero-padding aliases one task slot; every reference resolves by exact string, so a blocked_by naming one spelling silently means that record alone and the board reads the pair as two tasks`,
    });
  }

  issues.push(...blockedByCycles(project.tasks, taskIds));

  return issues;
}

/**
 * One issue per `blocked_by` cycle, in model order.
 *
 * Tarjan's SCC algorithm, iterative — the recursion depth of a real task
 * graph is small, but a parser must not blow the stack on hostile input
 * (a 10k-long blocked_by chain is a file anyone can write). Deterministic
 * throughout: nodes are visited in model order (path-sorted from both
 * collection layers), edges in declared list order, members are reported
 * in model order, and cycles in the order of their first member.
 *
 * A one-member SCC is a cycle only when the member names ITSELF — the
 * self-reference case the criterion calls out. Every other one-member SCC
 * is just an ordinary task.
 *
 * ADR-009: every id-keyed collection here is a Map/Set, so a task literally
 * named `__proto__` cannot resolve against inherited state.
 */
function blockedByCycles(
  tasks: readonly TaskRecord[],
  taskIds: ReadonlySet<string>,
): ParseIssue[] {
  const order = new Map<string, number>(); // id -> model position
  const fileOf = new Map<string, string>(); // id -> first file declaring it
  const edges = new Map<string, string[]>(); // id -> blocked_by targets in the model
  for (const task of tasks) {
    const { id } = task;
    if (id === undefined) continue;
    if (!order.has(id)) {
      order.set(id, order.size);
      fileOf.set(id, task.file);
    }
    const outgoing = edges.get(id) ?? [];
    // Dangling references are not edges — check 1 owns them, and a
    // reference to nothing cannot close a ring.
    for (const ref of task.blockedBy) if (taskIds.has(ref)) outgoing.push(ref);
    edges.set(id, outgoing);
  }

  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const components: string[][] = [];
  let counter = 0;

  const open = (node: string): void => {
    index.set(node, counter);
    low.set(node, counter);
    counter += 1;
    stack.push(node);
    onStack.add(node);
  };

  for (const root of order.keys()) {
    if (index.has(root)) continue;
    open(root);
    const work: { node: string; edge: number }[] = [{ node: root, edge: 0 }];
    while (work.length > 0) {
      const frame = work[work.length - 1];
      if (frame === undefined) break; // unreachable: length checked
      const outgoing = edges.get(frame.node) ?? [];
      const next = frame.edge < outgoing.length ? outgoing[frame.edge] : undefined;
      if (next !== undefined) {
        frame.edge += 1;
        if (!index.has(next)) {
          open(next);
          work.push({ node: next, edge: 0 });
        } else if (onStack.has(next)) {
          const seen = index.get(next) ?? 0;
          low.set(frame.node, Math.min(low.get(frame.node) ?? seen, seen));
        }
        continue;
      }
      work.pop();
      const parent = work[work.length - 1];
      const frameLow = low.get(frame.node) ?? 0;
      if (parent !== undefined) {
        low.set(parent.node, Math.min(low.get(parent.node) ?? frameLow, frameLow));
      }
      if (frameLow === index.get(frame.node)) {
        const members: string[] = [];
        for (;;) {
          const popped = stack.pop();
          if (popped === undefined) break; // unreachable: node is on the stack
          onStack.delete(popped);
          members.push(popped);
          if (popped === frame.node) break;
        }
        components.push(members);
      }
    }
  }

  const issues: ParseIssue[] = [];
  const cycles = components.filter((members) => {
    if (members.length > 1) return true;
    const only = members[0];
    return only !== undefined && (edges.get(only) ?? []).includes(only);
  });
  const position = (id: string): number => order.get(id) ?? Number.MAX_SAFE_INTEGER;
  for (const members of cycles) members.sort((a, b) => position(a) - position(b));
  cycles.sort((a, b) => position(a[0] ?? '') - position(b[0] ?? ''));

  for (const members of cycles) {
    const files = members.map((id) => fileOf.get(id) ?? '');
    const first = files[0] ?? '';
    const named = members.join(', ');
    const detail =
      members.length === 1
        ? `'${named}' lists itself, so it can never be unblocked`
        : `${named} block each other, directly or transitively, so no member can ever be unblocked`;
    issues.push({
      kind: 'dependency-cycle',
      field: 'blocked_by',
      ids: members,
      files,
      message: `${first}: blocked_by cycle — ${detail} (one issue per cycle, not per member; every reference preserved)`,
    });
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
