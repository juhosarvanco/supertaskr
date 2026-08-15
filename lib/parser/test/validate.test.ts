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

  it('is SKIPPED when the model has zero features — the absent/failed roadmap already reported itself once', () => {
    // Pinned pre-T-019: a missing roadmap yields exactly one io-error
    // (files.test.ts). Cascading one dangling-feature per task would
    // repeat that single root cause as noise.
    const result = parseProjectFromFiles(
      new Map([['docs/tasks/T-901-alpha.md', task('T-901')]]),
    );
    expect(kinds(result.issues)).toEqual(['io-error']);
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

  it('skips id-less suggestions and filenames that encode no id', () => {
    const idless = src([
      ['title', 'Ghost'],
      ['status', 'suggested'],
      ['suggested_by', 'verifier'],
    ]);
    const result = parseProjectFromFiles(
      new Map([
        ['docs/ROADMAP.md', ROADMAP],
        ['docs/tasks/T-901-s9-ghost.md', idless], // no declared id → nothing to mismatch
        ['docs/tasks/T-banana.md', task('T-901')], // encodes no id → not this check's business
      ]),
    );
    expect(result.issues).toEqual([]);
    expect(result.tasks).toHaveLength(2);
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
});
