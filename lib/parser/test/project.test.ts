import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseProject, parseTaskDirectory } from '../src/index.js';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));

describe('parseProject — valid fixture project', () => {
  // 2026-08-16 (T-019): the fixture gains T-100-genesis.md — T-101's
  // blocked_by: [T-100] had no target, which the new cross-reference pass
  // rightly flags as dangling. A "valid project" now means references
  // resolve too, so the fixture was made genuinely valid (4 → 5 tasks).
  it('parses all tasks (full, suggested, parked, stamped) and features with zero issues', () => {
    const result = parseProject(fixture('valid-project'));
    expect(result.issues).toEqual([]);
    expect(result.tasks).toHaveLength(5);

    const alpha = result.tasks.find((t) => t.id === 'T-101');
    expect(alpha).toMatchObject({
      title: 'Alpha task',
      feature: 'F-01',
      milestone: 1,
      priority: 1,
      size: 'M',
      status: 'building',
      blockedBy: ['T-100'],
      touches: ['C-03', 'src/egress/'],
    });
    expect(alpha?.builder).toMatchObject({ model: 'codex', session: 'S3', policy: 'resume' });
    expect(alpha?.verifier).toMatchObject({ model: 'claude-fable-5', policy: 'default' });
    expect(alpha?.sections.acceptanceCriteria).toContain('WHEN a thing happens');
    expect(alpha?.sections.implementationNotes).toContain('flux capacitor');
    expect(alpha?.sections.implementationNotes).toContain('### Detail');
    expect(alpha?.sections.verdicts).toContain('APPROVED');

    const suggestion = result.tasks.find((t) => t.status === 'suggested');
    expect(suggestion).toMatchObject({
      title: 'Cache parsed models between reloads',
      suggestedBy: 'executor codex @T-101',
    });
    expect(suggestion?.id).toBeUndefined();

    const parked = result.tasks.find((t) => t.status === 'parked');
    expect(parked).toMatchObject({ id: 'T-103', title: 'Cost telemetry' });

    const done = result.tasks.find((t) => t.id === 'T-104');
    expect(done?.builder).toMatchObject({ model: 'codex', policy: 'fresh' });
    expect(done?.verifier).toMatchObject({ model: 'claude-fable-5', session: 'S7', policy: 'resume' });
    expect(done?.builtBy).toMatchObject({ model: 'codex/gpt-5.2', session: 'S3', policy: 'resume' });
    expect(done?.verifiedBy).toMatchObject({ model: 'claude-fable-5', policy: 'fresh' });
    expect(done?.review).toBe('independent');

    expect(result.features.map((f) => f.id)).toEqual(['F-01', 'F-02', 'F-03']);
    expect(result.features[1]?.description).toBe(
      'Tauri app, read-only story map rendered beautifully from files',
    );
  });
});

describe('parseProject — broken files never stop the rest', () => {
  it('reports the broken file and the missing field, still returns the good tasks', () => {
    const root = fixture('broken-project');
    const result = parseProject(root);

    // the two good files still parse
    expect(result.tasks.map((t) => t.id)).toEqual(['T-201', 'T-203']);

    // broken YAML: structured error naming the file
    const yamlIssue = result.issues.find((i) => i.kind === 'yaml-error');
    expect(yamlIssue?.file).toBe(join(root, 'docs', 'tasks', 'T-202-broken-yaml.md'));

    // missing required field: error names file and field
    const missing = result.issues.find((i) => i.kind === 'missing-field');
    expect(missing).toMatchObject({
      field: 'size',
      file: join(root, 'docs', 'tasks', 'T-203-missing-size.md'),
    });

    expect(result.issues).toHaveLength(2);
  });
});

describe('parseTaskDirectory — duplicate ids', () => {
  // 2026-08-16 (T-019): fixture files renamed T-301-first/T-302-second →
  // T-300-first/T-300-second so their names encode the id they both
  // declare — dup-project stays about exactly ONE violation now that
  // validateProject also flags id ↔ filename mismatches at project level.
  it('reports a duplicate-id issue listing both file paths', () => {
    const dir = join(fixture('dup-project'), 'docs', 'tasks');
    const { tasks, issues } = parseTaskDirectory(dir);

    // MOVED AT T-076 (2026-08-19, executor claude-opus-5 @fresh), one
    // line: `space: 'task'`. Criterion 3 makes `space` REQUIRED on
    // duplicate-id at all four emit sites; this is the DISK task layer's.
    // Changed, never loosened: whole-object toEqual, everything else
    // byte-identical, plus the discriminator.
    expect(issues).toEqual([
      {
        kind: 'duplicate-id',
        space: 'task',
        id: 'T-300',
        files: [join(dir, 'T-300-first.md'), join(dir, 'T-300-second.md')],
        message: expect.stringContaining('T-300-first.md'),
      },
    ]);
    expect(issues[0]?.message).toContain('T-300-second.md');
    // both records stay visible — flagged, not hidden
    expect(tasks).toHaveLength(2);
  });
});

describe('parseProject — missing inputs are io-errors, not throws', () => {
  it('missing tasks dir and roadmap produce io-error issues', () => {
    const result = parseProject(fixture('does-not-exist'));
    expect(result.tasks).toEqual([]);
    expect(result.features).toEqual([]);
    expect(result.issues).toHaveLength(2);
    expect(result.issues.every((i) => i.kind === 'io-error')).toBe(true);
  });
});
