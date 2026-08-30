import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ASSIGNMENT_PAIRS,
  readAssignment,
  satisfiesAssignment,
  stampModels,
} from '../src/assignment.js';
import { parseProject, parseTaskFile, validateProject } from '../src/index.js';
import type { AssignmentReading, ParseIssue, TaskRecord } from '../src/types.js';

/**
 * THE ASSIGNMENT VERDICT (T-169) — @human's D5 ruling, verified: "of
 * course the models the human assigns to different tasks do those tasks
 * as assigned". Where a spawn path cannot force the model, nputer checks.
 *
 * The live board is the fixture wherever it can be (the fence.test.ts
 * discipline, T-111-s3): the six stamps that motivated the comparison
 * rule are real cards, read by id off the live tree, so the rule's
 * measured reason cannot rot into a synthetic fixture that agrees with
 * it forever.
 */
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const project = parseProject(repoRoot);
const board = new Map<string, TaskRecord>();
for (const task of project.tasks) if (task.id !== undefined) board.set(task.id, task);

/** A card off the live board, by id — never by filename glob. */
function card(id: string): TaskRecord {
  const found = board.get(id);
  if (found === undefined) throw new Error(`no live card declares id ${id}`);
  return found;
}

/** A card built from frontmatter, so the fixture is the FORMAT rather
 * than a hand-assembled record the parser would never produce. */
function fixture(frontmatter: string, file = 'docs/tasks/T-900-fixture.md'): TaskRecord {
  const parsed = parseTaskFile(
    `---\nid: T-900\ntitle: Fixture\nstatus: done\nfeature: F-04\nmilestone: 4\npriority: 1\nsize: S\n${frontmatter}---\n\nbody\n`,
    file,
  );
  if (parsed.task === undefined) {
    throw new Error(`fixture did not parse: ${parsed.issues.map((i) => i.message).join('; ')}`);
  }
  return parsed.task;
}

function reading(task: TaskRecord, role: 'builder' | 'verifier'): AssignmentReading {
  const found = readAssignment(task).find((r) => r.role === role);
  if (found === undefined) throw new Error(`no reading for ${role}`);
  return found;
}

/** Every assignment violation the model carries, whatever else it says. */
function violations(issues: readonly ParseIssue[]) {
  return issues.filter((issue) => issue.kind === 'assignment-violation');
}

describe('stampModels — the model half of every model@vehicle a value names', () => {
  it('reads a bare model, and both spellings of the vehicle', () => {
    expect(stampModels('claude-opus-5')).toEqual(['claude-opus-5']);
    expect(stampModels('claude-opus-5@subagent')).toEqual(['claude-opus-5']);
    expect(stampModels('codex/gpt-5.2 @S3')).toEqual(['codex/gpt-5.2']);
  });

  it('reads every model a compound stamp names, deduplicated in order', () => {
    expect(
      stampModels('claude-fable-5 @fresh (WIP through 986431e) + claude-opus-5 @fresh (completion)'),
    ).toEqual(['claude-fable-5', 'claude-opus-5']);
    expect(
      stampModels('claude-opus-5 @T-110-verify — REJECTED — then claude-opus-5 @T-110-verify2'),
    ).toEqual(['claude-opus-5']);
  });

  it('skips @human — a note about a person is not a vehicle a model ran in', () => {
    // Without the skip the token before `@human` (`+`, `under`) would be
    // offered as a model; `+` fails the identifier shape but `under` does
    // not, and it would join the executed set as a phantom member.
    expect(stampModels('claude-fable-5 @fresh (2 passes) + @human (visual)')).toEqual([
      'claude-fable-5',
    ]);
    expect(stampModels('claude-opus-5 @T-110-verify3 — APPROVED under @human’s waiver')).toEqual(
      ['claude-opus-5'],
    );
  });

  it('rejects prose that is not shaped like a model identifier', () => {
    expect(stampModels('claude-opus-5 @T-013-verify (re-verified @T-013-verify2, 2026-08-23)')).toEqual(
      ['claude-opus-5'],
    );
  });
});

describe('the assignment verdict — GUARD RULES (T-169)', () => {
  it('FLAGS a mismatched builder pair — the positive control', () => {
    const task = fixture('builder: claude-opus-5@subagent\nbuilt_by: codex/gpt-5.2 @S3\n');
    const found = reading(task, 'builder');
    expect(found.verdict).toBe('violated');
    expect(found.missing).toEqual(['claude-opus-5']);
    const issues = violations(validateProject({ tasks: [task], features: [] }));
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      kind: 'assignment-violation',
      role: 'builder',
      assignedField: 'builder',
      executedField: 'built_by',
      assigned: 'claude-opus-5@subagent',
      executed: 'codex/gpt-5.2 @S3',
    });
  });

  it('FLAGS a mismatched verifier pair the same way', () => {
    const task = fixture('verifier: claude-opus-5\nverified_by: codex/gpt-5.6 @fresh\n');
    expect(reading(task, 'verifier').verdict).toBe('violated');
    expect(violations(validateProject({ tasks: [task], features: [] }))).toHaveLength(1);
  });

  it('shows BOTH values and says the fields DISAGREE, claiming nothing about why', () => {
    const task = fixture('builder: claude-opus-5@subagent\nbuilt_by: codex/gpt-5.2 @S3\n');
    const message = violations(validateProject({ tasks: [task], features: [] }))[0]?.message ?? '';
    expect(message).toContain('claude-opus-5@subagent');
    expect(message).toContain('codex/gpt-5.2 @S3');
    expect(message).toContain('the fields disagree');
    expect(message).toContain('a human question');
    // The words the parser has no standing to use: it knows the two
    // fields name different models and nothing at all about fault.
    for (const forbidden of ['unauthorised', 'unauthorized', 'wrong model', 'substituted']) {
      expect(message.toLowerCase(), forbidden).not.toContain(forbidden);
    }
  });

  it('does NOT flag a matching pair', () => {
    const task = fixture('builder: claude-opus-5\nbuilt_by: claude-opus-5\n');
    expect(reading(task, 'builder').verdict).toBe('honoured');
    expect(violations(validateProject({ tasks: [task], features: [] }))).toEqual([]);
  });

  it('does NOT flag the same model in a different vehicle — D5 constrains the model, not the seat', () => {
    const task = fixture(
      'builder: claude-opus-5@subagent\nbuilt_by: claude-opus-5 @T-169 — code commit abc1234\n' +
        'verifier: claude-opus-5 @fresh\nverified_by: claude-opus-5 @T-169-verify\n',
    );
    expect(readAssignment(task).map((r) => r.verdict)).toEqual(['honoured', 'honoured']);
    expect(violations(validateProject({ tasks: [task], features: [] }))).toEqual([]);
  });

  it('an EMPTY assignment constrains nothing, in either direction', () => {
    const none = fixture('');
    expect(readAssignment(none).map((r) => r.verdict)).toEqual([
      'unconstrained',
      'unconstrained',
    ]);
    // Assignment empty, execution stamped: the card records who ran and
    // nobody was assigned, so there is nothing to disagree with.
    const unassigned = fixture('built_by: codex/gpt-5.2 @S3\n');
    expect(reading(unassigned, 'builder').verdict).toBe('unconstrained');
    // Assignment stamped, execution empty: an unstamped card is its own
    // existing incompleteness, not this verdict's finding.
    const unstamped = fixture('builder: claude-opus-5\n');
    expect(reading(unstamped, 'builder').verdict).toBe('unconstrained');
    expect(violations(validateProject({ tasks: [none, unassigned, unstamped], features: [] }))).toEqual(
      [],
    );
  });

  it('reads both pairs on every card, always, in ASSIGNMENT_PAIRS order', () => {
    expect(ASSIGNMENT_PAIRS.map((p) => p.role)).toEqual(['builder', 'verifier']);
    expect(readAssignment(fixture('')).map((r) => r.role)).toEqual(['builder', 'verifier']);
  });

  it('compares by exact string — a longer model name never satisfies a shorter one', () => {
    const task = fixture('builder: claude-opus-5\nbuilt_by: claude-opus-5-mini @fresh\n');
    expect(reading(task, 'builder').verdict).toBe('violated');
    // The boundary is `/` and only `/`: a bare prefix is a different model.
    expect(satisfiesAssignment('claude-opus-5', 'claude-opus-5-mini')).toBe(false);
  });

  it('does NOT flag a / refinement of the assigned model — the package fixture’s own case', () => {
    // `test/fixtures/valid-project/docs/tasks/T-104-done.md` has stamped
    // exactly this pair since T-003 and expects zero issues: assigning the
    // agent and stamping the version it ran is the convention's worked
    // example of a correct done card, not a D5 violation.
    const task = fixture('builder: codex@fresh\nbuilt_by: codex/gpt-5.2 @S3\n');
    expect(reading(task, 'builder').verdict).toBe('honoured');
    expect(violations(validateProject({ tasks: [task], features: [] }))).toEqual([]);
  });

  it('FLAGS the refinement backwards — a stamp that drops the version testifies to nothing', () => {
    const task = fixture('builder: codex/gpt-5.2\nbuilt_by: codex @S3\n');
    expect(reading(task, 'builder').verdict).toBe('violated');
    expect(satisfiesAssignment('codex/gpt-5.2', 'codex')).toBe(false);
    expect(satisfiesAssignment('codex', 'codex/gpt-5.2')).toBe(true);
  });
});

describe('the rule’s measured reason — the six live stamps a representative model misreads', () => {
  /**
   * Comparing `ModelSession.model` (the representative model
   * model-session.ts computes) reports these as disagreements. They are
   * not: each execution stamp names the assigned model in plain sight.
   * The bodies below are the control for the rule that replaced it — if
   * somebody swaps the set comparison back for `.model` equality, the
   * board starts announcing violations on @human's own finished cards
   * and these reds say so by id.
   */
  const misread = ['T-001', 'T-013', 'T-081', 'T-084', 'T-085', 'T-110'] as const;

  it('the six cards exist, and a representative-model comparison WOULD disagree on them', () => {
    let wouldFlag = 0;
    for (const id of misread) {
      const task = card(id);
      for (const role of ['builder', 'verifier'] as const) {
        const assigned = role === 'builder' ? task.builder : task.verifier;
        const executed = role === 'builder' ? task.builtBy : task.verifiedBy;
        if (assigned === undefined || executed === undefined) continue;
        if (assigned.model !== executed.model) wouldFlag++;
      }
    }
    // Non-vacuous by assertion, not by hope (the POISON DRILL's clause):
    // if these cards were ever restamped, this figure moves and the body
    // reds rather than passing on an empty comparison.
    expect(wouldFlag).toBe(6);
  });

  it('and this rule reports none of them, because the stamps name the assigned model', () => {
    for (const id of misread) {
      const found = readAssignment(card(id)).filter((r) => r.verdict === 'violated');
      expect(found.map((r) => `${id}:${r.role}`)).toEqual([]);
    }
  });
});

describe('THE LIVE BOARD CENSUS at this lane’s ref — derived, never assumed', () => {
  const readings = project.tasks.flatMap((task) => readAssignment(task));
  const constrained = readings.filter((r) => r.verdict !== 'unconstrained');

  it('censuses CLEAN: zero assignment violations on the live board', () => {
    const found = readings.filter((r) => r.verdict === 'violated');
    // The enumeration IS the census: a failure prints every violation by
    // card and by pair, both values shown, so the reader never has to run
    // a second command to learn what redded.
    expect(
      found.map((r) => `${r.file} ${r.assignedField}=${r.assigned} ${r.executedField}=${r.executed}`),
    ).toEqual([]);
  });

  it('and the census is NOT vacuous — the live board really does constrain pairs', () => {
    expect(constrained.length).toBeGreaterThan(100);
    expect(constrained.every((r) => r.verdict === 'honoured')).toBe(true);
  });

  it('the project model carries no assignment-violation issue either', () => {
    expect(violations(project.issues).map((issue) => issue.message)).toEqual([]);
  });
});
