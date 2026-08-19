import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { parseProject, parseProjectFromFiles, validateProject } from '../src/index.js';
import { validateProject as validateProjectPure } from '../src/pure.js';
import type { ParseIssue } from '../src/index.js';

/**
 * T-019 — cross-reference validation (absorbing T-002-s1/s3) and the
 * id-format family, at project level. validateProject flags what the
 * per-file parsers cannot see: blocked_by entries naming no parsed task,
 * feature ids the roadmap backbone does not declare, and declared ids
 * that disagree with the id their filename encodes. Everything is
 * collect-don't-throw and the flagged records STAY in `tasks` — the
 * T-002 contract (flagging, not hiding) extends across files.
 */

const ROADMAP = '# R\n\n## Backbone\n- F-01: One — thing\n- F-02: Two — thing\n';

type Field = [key: string, value: string];

const src = (fields: Field[], body = ''): string =>
  `---\n${fields.map(([k, v]) => `${k}: ${v}`).join('\n')}\n---\n${body}`;

const task = (id: string, extras: Field[] = []): string => {
  const fields = new Map<string, string>([
    ['id', id],
    ['title', `${id} title`],
    ['feature', 'F-01'],
    ['milestone', '1'],
    ['priority', '1'],
    ['size', 'S'],
    ['status', 'planned'],
  ]);
  for (const [key, value] of extras) fields.set(key, value);
  return src([...fields.entries()]);
};

const kinds = (issues: ParseIssue[]): string[] => issues.map((i) => i.kind);

describe('validateProject — blocked_by → missing task id (T-002-s1)', () => {
  it('flags each dangling entry, in task order then list order; records stay returned', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-alpha.md', task('T-901', [['blocked_by', '[T-902, T-777, T-888]']])],
        ['docs/tasks/T-902-beta.md', task('T-902')],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'dangling-reference',
        file: 'docs/tasks/T-901-alpha.md',
        field: 'blocked_by',
        id: 'T-777',
        message: expect.stringContaining("blocked_by names 'T-777'"),
      },
      {
        kind: 'dangling-reference',
        file: 'docs/tasks/T-901-alpha.md',
        field: 'blocked_by',
        id: 'T-888',
        message: expect.stringContaining("blocked_by names 'T-888'"),
      },
    ]);
    // Criterion 4: records with cross-reference findings still return.
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901', 'T-902']);
    // The reference itself is preserved on the record, never dropped.
    expect(result.tasks[0]?.blockedBy).toEqual(['T-902', 'T-777', 'T-888']);
  });

  it('a reference to a task that failed its identity gate dangles (the model is the truth)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-alpha.md', task('T-901', [['blocked_by', '[T-902]']])],
        // No title: identity fails, no record — so T-902 is not in the model.
        ['docs/tasks/T-902-beta.md', '---\nid: T-902\nstatus: planned\n---\n'],
      ]),
    );
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
    expect(result.issues).toContainEqual(
      expect.objectContaining({ kind: 'dangling-reference', field: 'blocked_by', id: 'T-902' }),
    );
  });

  it("ADR-009: hostile blocked_by ids (__proto__, constructor) never resolve via inheritance", () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-alpha.md', task('T-901', [['blocked_by', '[__proto__, constructor]']])],
      ]),
    );
    expect(
      result.issues.filter((i) => i.kind === 'dangling-reference' && i.field === 'blocked_by'),
    ).toHaveLength(2);
    expect(Object.prototype).not.toHaveProperty('polluted');
  });
});

describe('validateProject — feature → missing backbone id (T-002-s1)', () => {
  it('flags a feature the backbone does not declare; the record stays returned', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-alpha.md', task('T-901', [['feature', 'F-99']])],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'dangling-reference',
        file: 'docs/tasks/T-901-alpha.md',
        field: 'feature',
        id: 'F-99',
        message: expect.stringContaining('roadmap backbone does not declare'),
      },
    ]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
    expect(result.tasks[0]?.feature).toBe('F-99'); // preserved, never dropped
  });

  it('is skipped when the zero features come from a roadmap that REPORTED (missing → io-error)', () => {
    // Pinned pre-T-019: a missing roadmap yields exactly one io-error
    // (files.test.ts). Cascading one dangling-feature per task would
    // repeat that single already-reported root cause as noise. Narrowed
    // 2026-08-16 (rejection fix): the skip now requires the roadmap
    // layer's OWN report — zero features from a CLEAN parse check
    // normally (next tests).
    const result = parseProjectFromFiles(
      new Map([['docs/tasks/T-901-alpha.md', task('T-901')]]),
    );
    expect(kinds(result.issues)).toEqual(['io-error']);
  });

  it('is skipped when the roadmap has no Backbone heading (roadmap-error already loud)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# Roadmap\n\n## Milestones\n- F-01: Hidden\n'],
        ['docs/tasks/T-901-alpha.md', task('T-901')],
      ]),
    );
    expect(kinds(result.issues)).toEqual(['roadmap-error']);
  });

  it('is skipped when the backbone holds only malformed bullets (roadmap-error already loud)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# Roadmap\n\n## Backbone\n- F-XX: broken id\n'],
        ['docs/tasks/T-901-alpha.md', task('T-901')],
      ]),
    );
    expect(result.features).toEqual([]);
    expect(kinds(result.issues)).toEqual(['roadmap-error']);
  });

  it('fires against a well-formed EMPTY backbone — zero bullets is a reference space, not a report (2026-08-16 rejection)', () => {
    // The rejected hole, verbatim: `## Backbone` present and well-formed,
    // zero bullets under it → features: [] with NO roadmap issue
    // (roadmap.ts saw the heading), and the old zero-features skip then
    // silenced every feature dangler — total silence in exactly the
    // mid-genesis bootstrap state. Criterion 1 requires the dangler.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# Roadmap\n\n## Backbone\n\n(features to be decided)\n'],
        ['docs/tasks/T-901-a.md', task('T-901')], // feature: F-01
      ]),
    );
    expect(result.features).toEqual([]);
    expect(result.issues).toEqual([
      {
        kind: 'dangling-reference',
        file: 'docs/tasks/T-901-a.md',
        field: 'feature',
        id: 'F-01',
        message: expect.stringContaining("feature names 'F-01'"),
      },
    ]);
    // Flagged, not hidden: the record renders and keeps its reference.
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
    expect(result.tasks[0]?.feature).toBe('F-01');
  });

  it('an honestly-empty backbone stays silent when nothing references a feature', () => {
    const emptyBackbone = '# Roadmap\n\n## Backbone\n\n(features to be decided)\n';
    // No tasks at all: nothing to check, nothing to say.
    expect(
      parseProjectFromFiles(new Map([['docs/ROADMAP.md', emptyBackbone]])).issues,
    ).toEqual([]);
    // A feature-less suggestion alongside it: still zero issues — the
    // fix makes silent DANGLERS loud, never an honestly-empty project.
    const suggestion = src([
      ['title', 'Just a thought'],
      ['status', 'suggested'],
      ['suggested_by', 'verifier'],
    ]);
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', emptyBackbone],
        ['docs/tasks/T-901-s1-thought.md', suggestion],
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks).toHaveLength(1);
  });
});

describe('validateProject — id ↔ filename mismatch', () => {
  it('flags a declared id that disagrees with the id the filename encodes', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-902-beta.md', task('T-901')],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'id-mismatch',
        file: 'docs/tasks/T-902-beta.md',
        id: 'T-901',
        expected: 'T-902',
        message: expect.stringContaining("declares id 'T-901'"),
      },
    ]);
    // Flagged, not hidden — and the DECLARED id stays the model's truth.
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
  });

  it('derives the longest prefix: suggestion filenames encode T-NNN-sN, not T-NNN', () => {
    const suggestion = src([
      ['id', 'T-901-s1'],
      ['title', 'A suggestion with an id'],
      ['status', 'suggested'],
      ['suggested_by', 'verifier'],
    ]);
    const clean = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-s1-cache-models.md', suggestion],
        ['docs/tasks/T-901-simple.md', task('T-901')], // `-simple` is a slug, not -sN
      ]),
    );
    expect(clean.issues).toEqual([]);

    const wrong = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        // File encodes T-901-s2, frontmatter says T-901-s1.
        ['docs/tasks/T-901-s2-cache-models.md', suggestion],
      ]),
    );
    expect(wrong.issues).toEqual([
      expect.objectContaining({ kind: 'id-mismatch', id: 'T-901-s1', expected: 'T-901-s2' }),
    ]);
  });

  it('extension-only filenames still encode their id (T-901.md)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901.md', task('T-901')],
        ['docs/tasks/T-902.md', task('T-903')],
      ]),
    );
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: 'id-mismatch', file: 'docs/tasks/T-902.md', expected: 'T-902' }),
    ]);
  });

  it('skips id-less suggestions — free-form beyond the `T-` prefix, by design', () => {
    const idless = src([
      ['title', 'Ghost'],
      ['status', 'suggested'],
      ['suggested_by', 'verifier'],
    ]);
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-s9-ghost.md', idless], // no declared id → nothing to mismatch
        ['docs/tasks/T-banana-idea.md', idless], // encodes no id AND declares none → legal
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks).toHaveLength(2);
  });
});

describe('validateProject — an id-bearing file whose name encodes no id (T-030, T-019-s2)', () => {
  // FLIPPED 2026-08-17 (T-030): this exact input — `T-banana.md` declaring
  // `id: T-901` — was pinned above as producing ZERO issues, the
  // deliberate T-019 narrowness the suggestion asked to close. The
  // criterion now requires the flag: changed, never loosened.
  it('flags T-banana.md declaring id T-901, and keeps the record', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-banana.md', task('T-901')],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'filename-id-missing',
        file: 'docs/tasks/T-banana.md',
        id: 'T-901',
        message: expect.stringContaining('the filename encodes no id'),
      },
    ]);
    expect(result.issues[0]?.message).toContain("'T-NNN[-sN]-<slug>.md'");
    // Flagging, not hiding — the declared id stays the model's truth.
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
  });

  it('covers the shapes the encoder rejects, and only those', () => {
    const flagged = ['docs/tasks/T-901.bak.md', 'docs/tasks/T-9x1-slug.md', 'docs/tasks/T-.md'];
    for (const file of flagged) {
      const result = parseProjectFromFiles(
        new Map([
          ['docs/ROADMAP.md', ROADMAP],
          [file, task('T-901')],
        ]),
      );
      expect(kinds(result.issues), file).toEqual(['filename-id-missing']);
    }
    // ...while a well-formed name stays silent, and a WRONG id stays an
    // id-mismatch — one issue per root cause, never both.
    const ok = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901.md', task('T-901')],
      ]),
    );
    expect(ok.issues).toEqual([]);
    const wrong = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-902-beta.md', task('T-901')],
      ]),
    );
    expect(kinds(wrong.issues)).toEqual(['id-mismatch']);
  });

  it('fires identically through the disk layer', () => {
    const root = mkdtempSync(join(tmpdir(), 'nputer-fname-'));
    const tasks = join(root, 'docs', 'tasks');
    mkdirSync(tasks, { recursive: true });
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), ROADMAP);
    writeFileSync(join(tasks, 'T-banana.md'), task('T-901'));
    const result = parseProject(root);
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: 'filename-id-missing',
        file: join(tasks, 'T-banana.md'),
        id: 'T-901',
      }),
    ]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe('validateProject — numerically aliased task ids (T-053, promoting T-030-s3)', () => {
  const aliases = (issues: ParseIssue[]): ParseIssue[] =>
    issues.filter((i) => i.kind === 'aliased-id');

  it('T-01 beside T-001 is one slot spelled twice: one issue, both records kept', () => {
    // Used to parse with ZERO issues: duplicate-id compares strings
    // exactly, and each filename encodes its own declared spelling.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-001-b.md', task('T-001')],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'aliased-id',
        space: 'task',
        ids: ['T-001', 'T-01'],
        files: ['docs/tasks/T-001-b.md', 'docs/tasks/T-01-a.md'],
        message: expect.stringContaining('numerically equal task ids'),
      },
    ]);
    expect(result.issues[0]?.message).toContain("'T-001' (docs/tasks/T-001-b.md)");
    expect(result.issues[0]?.message).toContain("'T-01' (docs/tasks/T-01-a.md)");
    expect(result.issues[0]?.message).toContain('zero-padding aliases one task slot');
    // Flagging, not hiding: both cards stay on the board.
    expect(result.tasks.map((t) => t.id)).toEqual(['T-001', 'T-01']);
  });

  it('the space field discriminates without reading the prose', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', '# R\n\n## Backbone\n- F-1: One — a\n- F-01: One padded — b\n'],
        ['docs/tasks/T-01-a.md', task('T-01', [['feature', 'F-1']])],
        ['docs/tasks/T-001-b.md', task('T-001', [['feature', 'F-1']])],
      ]),
    );
    expect(aliases(result.issues).map((i) => (i.kind === 'aliased-id' ? i.space : null))).toEqual([
      'feature',
      'task',
    ]);
  });

  it('THE FOUR SUFFIX CASES: -sN digits alias, but a suggestion never merges into its parent', () => {
    // The suffix is part of task identity. A suffix-blind slot key would
    // put all five ids in ONE slot and report a single issue naming a
    // suggestion and its parent as the same task — worse than the bug
    // this rule exists to catch.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-001-b.md', task('T-001')],
        ['docs/tasks/T-01-s1-c.md', task('T-01-s1')],
        ['docs/tasks/T-001-s1-d.md', task('T-001-s1')],
        ['docs/tasks/T-01-s01-e.md', task('T-01-s01')],
      ]),
    );
    expect(aliases(result.issues).map((i) => (i.kind === 'aliased-id' ? i.ids : []))).toEqual([
      ['T-001', 'T-01'], // T-01 / T-001 alias
      ['T-001-s1', 'T-01-s01', 'T-01-s1'], // T-01-s1 / T-001-s1 and T-01-s01 / T-01-s1 alias
    ]);
    // …and NOT a single slot holding a parent and its suggestion.
    for (const issue of aliases(result.issues)) {
      if (issue.kind !== 'aliased-id') continue;
      const suffixed = issue.ids.filter((id) => id.includes('-s'));
      expect(suffixed.length === 0 || suffixed.length === issue.ids.length).toBe(true);
    }
  });

  it('T-01 and T-01-s1 alone are NOT an alias — zero issues (the case a blind key breaks)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-parent.md', task('T-01')],
        ['docs/tasks/T-01-s1-idea.md', task('T-01-s1')],
      ]),
    );
    expect(result.issues).toEqual([]);
  });

  it('slot equality is textual, so task ids past 2^53 do not collide by floating point', () => {
    const big = '9007199254740993'; // 2^53 + 1 — Number() cannot tell these apart
    const other = '9007199254740992';
    expect(Number(big)).toBe(Number(other));

    const distinct = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        [`docs/tasks/T-${big}-a.md`, task(`T-${big}`)],
        [`docs/tasks/T-${other}-b.md`, task(`T-${other}`)],
      ]),
    );
    expect(distinct.issues).toEqual([]);

    // …while a zero-padded spelling of the same huge id still aliases.
    const padded = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        [`docs/tasks/T-${big}-a.md`, task(`T-${big}`)],
        [`docs/tasks/T-0${big}-b.md`, task(`T-0${big}`)],
      ]),
    );
    expect(aliases(padded.issues).map((i) => (i.kind === 'aliased-id' ? i.ids : []))).toEqual([
      [`T-0${big}`, `T-${big}`],
    ]);

    // The suffix digits are just as unbounded, and just as textual.
    const suffix = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        [`docs/tasks/T-01-s${big}-a.md`, task(`T-01-s${big}`)],
        [`docs/tasks/T-01-s${other}-b.md`, task(`T-01-s${other}`)],
      ]),
    );
    expect(suffix.issues).toEqual([]);
  });

  it('THE HARM, reproduced: an unpadded sibling silently re-points a blocked_by edge', () => {
    // Before the sibling exists the reference is LOUD.
    const alone = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-001-b.md', task('T-001', [['blocked_by', '[T-01]']])],
      ]),
    );
    expect(kinds(alone.issues)).toEqual(['dangling-reference']);

    // Adding T-01 resolves that very edge to a different task — which used
    // to happen in SILENCE. The dangling-reference disappears (correctly:
    // the reference now resolves) and the aliasing is what says so.
    const both = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-001-b.md', task('T-001', [['blocked_by', '[T-01]']])],
      ]),
    );
    expect(kinds(both.issues)).toEqual(['aliased-id']);
    expect(both.tasks.find((t) => t.id === 'T-001')?.blockedBy).toEqual(['T-01']);
  });

  it('ONE issue per slot, not one per pair — three spellings report once', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-001-b.md', task('T-001')],
        ['docs/tasks/T-0001-c.md', task('T-0001')],
      ]),
    );
    const aliased = aliases(result.issues);
    expect(aliased).toHaveLength(1);
    expect(aliased[0]).toMatchObject({ space: 'task', ids: ['T-0001', 'T-001', 'T-01'] });
  });

  it('distinct slots, exact duplicates and id-less suggestions stay out of it', () => {
    const distinct = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-10-b.md', task('T-10')],
        ['docs/tasks/T-100-c.md', task('T-100')],
      ]),
    );
    expect(distinct.issues).toEqual([]);

    // The same id twice is duplicate-id's business, never aliased-id's.
    const dup = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-01-b.md', task('T-01')],
      ]),
    );
    expect(kinds(dup.issues)).toEqual(['duplicate-id']);

    // An id-less suggestion has no slot to occupy.
    const idless = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        [
          'docs/tasks/T-an-idea.md',
          src([
            ['title', 'An idea'],
            ['status', 'suggested'],
            ['suggested_by', 'executor'],
          ]),
        ],
      ]),
    );
    expect(idless.issues).toEqual([]);
  });

  it('comes after every per-task finding and before cycles', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01', [['blocked_by', '[T-777]']])],
        ['docs/tasks/T-001-b.md', task('T-001', [['blocked_by', '[T-001]']])],
      ]),
    );
    expect(kinds(result.issues)).toEqual(['dangling-reference', 'aliased-id', 'dependency-cycle']);
  });

  it('fires identically through the disk layer', () => {
    const root = mkdtempSync(join(tmpdir(), 'nputer-alias-'));
    const tasks = join(root, 'docs', 'tasks');
    mkdirSync(tasks, { recursive: true });
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), ROADMAP);
    writeFileSync(join(tasks, 'T-01-a.md'), task('T-01'));
    writeFileSync(join(tasks, 'T-001-b.md'), task('T-001'));
    const result = parseProject(root);
    expect(result.issues).toEqual([
      {
        kind: 'aliased-id',
        space: 'task',
        ids: ['T-001', 'T-01'],
        files: [join(tasks, 'T-001-b.md'), join(tasks, 'T-01-a.md')],
        message: expect.stringContaining('numerically equal task ids'),
      },
    ]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe('validateProject — blocked_by cycles (T-030, absorbing T-019-s3)', () => {
  const cycleIssues = (issues: ParseIssue[]): ParseIssue[] =>
    issues.filter((i) => i.kind === 'dependency-cycle');

  it('a self-reference is a cycle: one issue, the record and the reference kept', () => {
    // Used to resolve SILENTLY — the reference names a task that exists,
    // so nothing dangled and nothing was said.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-901]']])],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'dependency-cycle',
        field: 'blocked_by',
        ids: ['T-901'],
        files: ['docs/tasks/T-901-a.md'],
        message: expect.stringContaining("'T-901' lists itself"),
      },
    ]);
    expect(result.tasks[0]?.blockedBy).toEqual(['T-901']);
  });

  it('ONE issue per cycle, not one per member (two-task ring)', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-902]']])],
        ['docs/tasks/T-902-b.md', task('T-902', [['blocked_by', '[T-901]']])],
      ]),
    );
    expect(result.issues).toEqual([
      {
        kind: 'dependency-cycle',
        field: 'blocked_by',
        ids: ['T-901', 'T-902'],
        files: ['docs/tasks/T-901-a.md', 'docs/tasks/T-902-b.md'],
        message: expect.stringContaining('T-901, T-902 block each other'),
      },
    ]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901', 'T-902']);
  });

  it('a three-task ring is still one issue, naming every member in model order', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-903-c.md', task('T-903', [['blocked_by', '[T-901]']])],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-902]']])],
        ['docs/tasks/T-902-b.md', task('T-902', [['blocked_by', '[T-903]']])],
      ]),
    );
    expect(cycleIssues(result.issues)).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ ids: ['T-901', 'T-902', 'T-903'] });
  });

  it('two rings sharing a member are ONE root cause, not two overlapping reports', () => {
    // Figure-eight: T-901↔T-902 and T-901↔T-903. Reporting each simple
    // ring would name T-901 twice; the strongly connected component names
    // it once. (Enumerating simple rings is also exponential — no parser
    // should be.)
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-902, T-903]']])],
        ['docs/tasks/T-902-b.md', task('T-902', [['blocked_by', '[T-901]']])],
        ['docs/tasks/T-903-c.md', task('T-903', [['blocked_by', '[T-901]']])],
      ]),
    );
    expect(cycleIssues(result.issues)).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ ids: ['T-901', 'T-902', 'T-903'] });
  });

  it('two independent cycles are two issues, ordered by their first member', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-902]']])],
        ['docs/tasks/T-902-b.md', task('T-902', [['blocked_by', '[T-901]']])],
        ['docs/tasks/T-903-c.md', task('T-903', [['blocked_by', '[T-903]']])],
      ]),
    );
    expect(cycleIssues(result.issues).map((i) => ('ids' in i ? i.ids : []))).toEqual([
      ['T-901', 'T-902'],
      ['T-903'],
    ]);
  });

  it('acyclic graphs stay silent, however long the chain', () => {
    const files = new Map([['docs/ROADMAP.md', ROADMAP]]);
    for (let n = 901; n <= 940; n++) {
      const blocked = n === 901 ? '' : `T-${n - 1}`;
      files.set(`docs/tasks/T-${n}-x.md`, task(`T-${n}`, [['blocked_by', `[${blocked}]`]]));
    }
    // A diamond too: two paths to one root is not a cycle.
    files.set('docs/tasks/T-950-d.md', task('T-950', [['blocked_by', '[T-901, T-902]']]));
    expect(parseProjectFromFiles(files).issues).toEqual([]);
  });

  it('a dangling reference is not an edge — it dangles, and cycles come after', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-902, T-777]']])],
        ['docs/tasks/T-902-b.md', task('T-902', [['blocked_by', '[T-901]']])],
      ]),
    );
    // Per-task findings first (the pinned order), cycles last.
    expect(kinds(result.issues)).toEqual(['dangling-reference', 'dependency-cycle']);
  });

  it('a 5000-member ring does not blow the stack (iterative by construction)', () => {
    const tasks = [];
    for (let n = 0; n < 5000; n++) {
      tasks.push({
        id: `T-${n}`,
        title: 'x',
        status: 'planned' as const,
        blockedBy: [`T-${(n + 1) % 5000}`],
        touches: [],
        extra: {},
        sections: {},
        file: `docs/tasks/T-${n}-x.md`,
      });
    }
    const issues = validateProject({ tasks, features: [] });
    expect(issues).toHaveLength(1);
    const first = issues[0];
    expect(first?.kind).toBe('dependency-cycle');
    expect(first && 'ids' in first ? first.ids : []).toHaveLength(5000);
  });

  it('ADR-009: a hostile id cannot resolve through inherited state', () => {
    const hostile = {
      tasks: [
        {
          id: '__proto__',
          title: 'x',
          status: 'planned' as const,
          blockedBy: ['__proto__'],
          touches: [],
          extra: {},
          sections: {},
          file: 'docs/tasks/T-901-a.md',
        },
      ],
      features: [],
    };
    // The id-mismatch is the filename check doing its job on a hand-built
    // model (`T-901-a.md` does not encode `__proto__`); the point here is
    // the cycle resolving through a Map, not through Object.prototype.
    expect(kinds(validateProject(hostile))).toEqual(['id-mismatch', 'dependency-cycle']);
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('fires identically through the disk layer', () => {
    const root = mkdtempSync(join(tmpdir(), 'nputer-cycle-'));
    const tasks = join(root, 'docs', 'tasks');
    mkdirSync(tasks, { recursive: true });
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), ROADMAP);
    writeFileSync(join(tasks, 'T-901-a.md'), task('T-901', [['blocked_by', '[T-902]']]));
    writeFileSync(join(tasks, 'T-902-b.md'), task('T-902', [['blocked_by', '[T-901]']]));
    const result = parseProject(root);
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: 'dependency-cycle',
        ids: ['T-901', 'T-902'],
        files: [join(tasks, 'T-901-a.md'), join(tasks, 'T-902-b.md')],
      }),
    ]);
    rmSync(root, { recursive: true, force: true });
  });
});

describe('validateProject — the standalone export (both entries)', () => {
  const model = {
    tasks: [
      {
        id: 'T-901',
        title: 'Hand-built',
        status: 'planned' as const,
        feature: 'F-99',
        blockedBy: ['T-777'],
        touches: [],
        extra: {},
        sections: {},
        file: 'docs/tasks/T-902-wrong.md',
      },
    ],
    features: [{ id: 'F-01', name: 'One', description: '', line: 4, file: 'docs/ROADMAP.md' }],
  };

  it('runs all three checks over a hand-built model, in field order per task', () => {
    expect(kinds(validateProject(model))).toEqual([
      'dangling-reference', // blocked_by T-777
      'dangling-reference', // feature F-99
      'id-mismatch', // T-901 vs T-902
    ]);
  });

  it('is the same function from the root and pure entries, and mutates nothing', () => {
    expect(validateProjectPure).toBe(validateProject);
    const before = JSON.stringify(model);
    validateProject(model);
    expect(JSON.stringify(model)).toBe(before);
  });

  it('an empty model validates to zero issues', () => {
    expect(validateProject({ tasks: [], features: [] })).toEqual([]);
  });

  it('with zero features it is loud by default, quiet only when told the roadmap reported (2026-08-16 rejection)', () => {
    // A hand-built model has no roadmap layer to have reported, so the
    // default must be the loud path — silence here was the rejected hole.
    const zeroFeatures = { tasks: model.tasks, features: [] };
    expect(kinds(validateProject(zeroFeatures))).toEqual([
      'dangling-reference', // blocked_by T-777
      'dangling-reference', // feature F-99 — checked against the empty space
      'id-mismatch', // T-901 vs T-902
    ]);
    // roadmapReported is the assemblers' cascade suppression: the roadmap
    // layer's own io-error/roadmap-error already reported the one root
    // cause, so ONLY the feature check goes quiet — nothing else does.
    expect(kinds(validateProject(zeroFeatures, { roadmapReported: true }))).toEqual([
      'dangling-reference', // blocked_by T-777
      'id-mismatch',
    ]);
    // With features present the flag is inert — never a silencer.
    expect(kinds(validateProject(model, { roadmapReported: true }))).toEqual([
      'dangling-reference',
      'dangling-reference',
      'id-mismatch',
    ]);
  });
});

describe('validateProject — wired into the disk layer identically', () => {
  const dir = mkdtempSync(join(tmpdir(), 'nputer-validate-'));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it('parseProject reports cross-reference issues after per-layer ones and keeps the records', () => {
    const root = join(dir, 'xref-project');
    const tasks = join(root, 'docs', 'tasks');
    mkdirSync(tasks, { recursive: true });
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), ROADMAP);
    writeFileSync(
      join(tasks, 'T-901-alpha.md'),
      task('T-901', [['blocked_by', '[T-777]'], ['feature', 'F-99']]),
    );
    const result = parseProject(root);
    expect(kinds(result.issues)).toEqual(['dangling-reference', 'dangling-reference']);
    expect(result.issues.every((i) => 'file' in i && i.file === join(tasks, 'T-901-alpha.md'))).toBe(
      true,
    );
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']); // still rendered
  });

  it('an empty-but-clean backbone on disk fires the same danglers as the pure layer (2026-08-16 rejection)', () => {
    const root = join(dir, 'empty-backbone-project');
    const tasks = join(root, 'docs', 'tasks');
    mkdirSync(tasks, { recursive: true });
    writeFileSync(
      join(root, 'docs', 'ROADMAP.md'),
      '# Roadmap\n\n## Backbone\n\n(features to be decided)\n',
    );
    writeFileSync(join(tasks, 'T-901-a.md'), task('T-901')); // feature: F-01
    const result = parseProject(root);
    expect(result.features).toEqual([]);
    expect(result.issues).toEqual([
      expect.objectContaining({
        kind: 'dangling-reference',
        field: 'feature',
        id: 'F-01',
        file: join(tasks, 'T-901-a.md'),
      }),
    ]);
    expect(result.tasks.map((t) => t.id)).toEqual(['T-901']);
  });
});

describe('validateProject — the near-miss HINT on a dangling reference (T-076)', () => {
  const dangling = (issues: ParseIssue[]): ParseIssue[] =>
    issues.filter((i) => i.kind === 'dangling-reference');

  it('THE CARD\'S REPRODUCTION: blocked_by T-01 beside a declared T-001', () => {
    // Before T-076 this said only "no task in the model declares it" —
    // true, and it sends the author hunting a task that does not exist
    // while the padding variant sits in the very same file.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-001-a.md', task('T-001', [['blocked_by', '[T-01]']])],
      ]),
    );
    // Still ONE issue and still the SAME KIND — a hint, never a new kind.
    expect(kinds(result.issues)).toEqual(['dangling-reference']);
    expect(result.issues[0]).toEqual({
      kind: 'dangling-reference',
      file: 'docs/tasks/T-001-a.md',
      field: 'blocked_by',
      id: 'T-01',
      nearMiss: ['T-001'],
      message:
        "docs/tasks/T-001-a.md: blocked_by names 'T-01' but no task in the model declares it — 'T-001' is declared and differs only in zero padding (reference preserved on the record)",
    });
    // The reference is still preserved and the record still returns.
    expect(result.tasks[0]?.blockedBy).toEqual(['T-01']);
  });

  it('fires on the FEATURE side too: feature F-1 against a backbone F-01', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['feature', 'F-1']])],
      ]),
    );
    expect(kinds(result.issues)).toEqual(['dangling-reference']);
    expect(result.issues[0]).toMatchObject({
      field: 'feature',
      id: 'F-1',
      nearMiss: ['F-01'],
    });
    expect(result.issues[0]?.message).toBe(
      "docs/tasks/T-901-a.md: feature names 'F-1' but the roadmap backbone does not declare it — 'F-01' is declared and differs only in zero padding (reference preserved on the record)",
    );
  });

  it('is ABSENT, not empty, when the reference is simply not there', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-a.md', task('T-901', [['blocked_by', '[T-777]'], ['feature', 'F-99']])],
      ]),
    );
    const found = dangling(result.issues);
    expect(found).toHaveLength(2);
    for (const issue of found) {
      expect(issue).not.toHaveProperty('nearMiss');
      expect(issue.message).not.toContain('zero padding');
    }
  });

  it('the -sN suffix is part of the slot, so a hint never crosses it', () => {
    // The subtlety T-053 called the one most likely to be got wrong,
    // inherited by the hint: a padded BASE and a padded SUFFIX each earn
    // one, and a DIFFERENT suffix earns none however many neighbours are
    // declared.
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-016-a.md', task('T-016')],
        ['docs/tasks/T-016-s2-b.md', task('T-016-s2')],
        ['docs/tasks/T-901-c.md', task('T-901', [['blocked_by', '[T-16, T-16-s02, T-016-s3]']])],
      ]),
    );
    const found = dangling(result.issues);
    expect(found.map((i) => (i.kind === 'dangling-reference' ? i.id : ''))).toEqual([
      'T-16',
      'T-16-s02',
      'T-016-s3',
    ]);
    expect(found[0]).toMatchObject({ nearMiss: ['T-016'] }); // padded base
    expect(found[1]).toMatchObject({ nearMiss: ['T-016-s2'] }); // padded suffix
    // A different suggestion number is a different slot: no hint, even
    // though T-016 and T-016-s2 are both declared one file away. A
    // suffix-blind key would have named one of them here.
    expect(found[2]).not.toHaveProperty('nearMiss');
  });

  it('names EVERY declared spelling when the task space is itself aliased', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-01-a.md', task('T-01')],
        ['docs/tasks/T-001-b.md', task('T-001')],
        ['docs/tasks/T-901-c.md', task('T-901', [['blocked_by', '[T-0001]']])],
      ]),
    );
    const found = dangling(result.issues);
    expect(found).toHaveLength(1);
    // Model order, which is path-sorted: T-001-b.md precedes T-01-a.md.
    expect(found[0]).toMatchObject({ id: 'T-0001', nearMiss: ['T-001', 'T-01'] });
    expect(found[0]?.message).toContain(
      "'T-001', 'T-01' are declared and differ only in zero padding",
    );
    // The aliasing itself is still reported alongside: the hint explains a
    // symptom, it never replaces the root cause.
    expect(kinds(result.issues)).toEqual(['dangling-reference', 'aliased-id']);
  });

  it('ADR-009: a hostile reference gets no near miss out of inherited state', () => {
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        [
          'docs/tasks/T-901-a.md',
          task('T-901', [['blocked_by', '[__proto__, constructor, toString]']]),
        ],
      ]),
    );
    const found = dangling(result.issues);
    expect(found).toHaveLength(3);
    for (const issue of found) expect(issue).not.toHaveProperty('nearMiss');
    expect(Object.prototype).not.toHaveProperty('polluted');
  });

  it('fires identically through the disk layer', () => {
    const root = mkdtempSync(join(tmpdir(), 'nputer-nearmiss-'));
    const tasks = join(root, 'docs', 'tasks');
    mkdirSync(tasks, { recursive: true });
    writeFileSync(join(root, 'docs', 'ROADMAP.md'), ROADMAP);
    writeFileSync(join(tasks, 'T-001-a.md'), task('T-001', [['blocked_by', '[T-01]']]));
    const result = parseProject(root);
    expect(dangling(result.issues)).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({ id: 'T-01', nearMiss: ['T-001'] });
    rmSync(root, { recursive: true, force: true });
  });
});
