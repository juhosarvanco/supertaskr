import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { extractFrontmatter, parseTaskFile, splitSections, type TaskSections } from '../src/index.js';

const FILE = 'docs/tasks/T-016-audit-log.md';
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));

/** The pre-T-055 splitter, retained only to prove live-fixture equivalence. */
function splitSectionsBeforeInertPass(body: string): TaskSections {
  const keys: Record<string, keyof TaskSections> = Object.assign(Object.create(null), {
    'acceptance criteria': 'acceptanceCriteria',
    'implementation notes': 'implementationNotes',
    verdicts: 'verdicts',
  });
  const sections: TaskSections = {};
  const lines = body.split(/\r?\n/);
  let sawHeading = false;
  let current: keyof TaskSections | undefined = 'preamble';
  let buffer: string[] = [];

  const flush = (): void => {
    if (current === undefined) return;
    const text = buffer.join('\n').trim();
    if (current === 'preamble' && text === '') return;
    sections[current] =
      sections[current] === undefined || sections[current] === ''
        ? text
        : `${sections[current]}\n\n${text}`.trim();
  };

  for (const line of lines) {
    const heading = /^##\s+(.+?)\s*$/.exec(line);
    if (heading && heading[1] !== undefined) {
      flush();
      sawHeading = true;
      current = keys[heading[1].toLowerCase().replace(/\s+/g, ' ')];
      buffer = [];
      continue;
    }
    if (!sawHeading || current !== undefined) buffer.push(line);
  }
  flush();
  return sections;
}

const VALID = `---
id: T-016
title: Audit log
feature: F-03            # story map column
milestone: 2             # above/below the slice line
priority: 2              # position in column; 1 = top = next
size: M                  # S | M | L
status: planned          # suggested | planned | building | verifying |
                         # rejected | merging | done | parked
blocked_by: [T-015]
touches: [C-03, src/egress/]
suggested_by:
builder: codex@S3
verifier: claude-fable-5
built_by:
verified_by:
review:
---

## Acceptance criteria
- WHEN an egress event occurs THE system SHALL log it
- IF the log is unavailable THEN THE system SHALL fail closed

## Implementation notes

## Verdicts
`;

describe('parseTaskFile — valid task', () => {
  it('parses every frontmatter field of a valid task with zero issues', () => {
    const { task, issues } = parseTaskFile(VALID, FILE);
    expect(issues).toEqual([]);
    expect(task).toBeDefined();
    expect(task).toMatchObject({
      id: 'T-016',
      title: 'Audit log',
      feature: 'F-03',
      milestone: 2,
      priority: 2,
      size: 'M',
      status: 'planned',
      blockedBy: ['T-015'],
      touches: ['C-03', 'src/egress/'],
      file: FILE,
    });
    expect(task?.suggestedBy).toBeUndefined();
    expect(task?.builtBy).toBeUndefined();
    expect(task?.verifiedBy).toBeUndefined();
    expect(task?.review).toBeUndefined();
    expect(task?.extra).toEqual({});
  });

  it('parses model@session in builder and verifier', () => {
    const { task } = parseTaskFile(VALID, FILE);
    expect(task?.builder).toEqual({
      raw: 'codex@S3',
      model: 'codex',
      session: 'S3',
      policy: 'resume',
    });
    expect(task?.verifier).toEqual({
      raw: 'claude-fable-5',
      model: 'claude-fable-5',
      policy: 'default',
    });
  });

  it('parses stamped built_by/verified_by and the review guarantee', () => {
    const stamped = VALID.replace('built_by:', 'built_by: codex/gpt-5.2 @S3')
      .replace('verified_by:', 'verified_by: claude-fable-5 @fresh')
      .replace('review:', 'review: independent')
      .replace('status: planned', 'status: done   ');
    const { task, issues } = parseTaskFile(stamped, FILE);
    expect(issues).toEqual([]);
    expect(task?.status).toBe('done');
    expect(task?.builtBy?.model).toBe('codex/gpt-5.2');
    expect(task?.builtBy?.session).toBe('S3');
    expect(task?.builtBy?.policy).toBe('resume');
    expect(task?.verifiedBy?.model).toBe('claude-fable-5');
    expect(task?.verifiedBy?.policy).toBe('fresh');
    expect(task?.review).toBe('independent');
  });

  it('extracts the three body sections', () => {
    const { task } = parseTaskFile(VALID, FILE);
    expect(task?.sections.acceptanceCriteria).toContain(
      'WHEN an egress event occurs THE system SHALL log it',
    );
    expect(task?.sections.implementationNotes).toBe('');
    expect(task?.sections.verdicts).toBe('');
  });

  it('keeps ### subheadings inside their section and skips unknown ## headings', () => {
    const body = `---
id: T-020
title: Sections
feature: F-01
milestone: 1
priority: 1
size: S
status: planned
---

## Acceptance criteria
- THE system SHALL work

### Nested detail
still acceptance content

## Some unknown section
ignored entirely

## Verdicts
2026-08-14 — APPROVED
`;
    const { task, issues } = parseTaskFile(body, FILE);
    expect(issues).toEqual([]);
    expect(task?.sections.acceptanceCriteria).toContain('### Nested detail');
    expect(task?.sections.acceptanceCriteria).toContain('still acceptance content');
    expect(task?.sections.acceptanceCriteria).not.toContain('ignored entirely');
    expect(task?.sections.implementationNotes).toBeUndefined();
    expect(task?.sections.verdicts).toBe('2026-08-14 — APPROVED');
  });

  it('treats `## __proto__` and `## constructor` headings as unknown, ignored', () => {
    // Fix-pass regression test (2026-08-14): on a plain-object heading map
    // these lookups returned INHERITED values (Object.prototype / the Object
    // constructor), minting garbage section keys like '[object Object]'.
    const hostile = `---
id: T-021
title: Hostile headings
feature: F-01
milestone: 1
priority: 1
size: S
status: planned
---

## __proto__
leaked

## constructor
leaked

## Verdicts
clean
`;
    const { task, issues } = parseTaskFile(hostile, FILE);
    expect(issues).toEqual([]);
    expect(Object.keys(task?.sections ?? {})).toEqual(['verdicts']);
    expect(task?.sections.verdicts).toBe('clean');
  });

  it('preserves unknown frontmatter keys in extra instead of dropping them', () => {
    const withExtra = VALID.replace('review:', 'review:\nfuture_field: kept');
    const { task, issues } = parseTaskFile(withExtra, FILE);
    expect(issues).toEqual([]);
    expect(task?.extra).toEqual({ future_field: 'kept' });
  });
});

describe('splitSections — shared inert-span view (T-055)', () => {
  it('a commented-out heading neither opens nor closes a section', () => {
    const body = [
      'context',
      '',
      '## Acceptance criteria',
      'real before',
      '<!--',
      '## Verdicts',
      'not a verdict',
      '-->',
      'real after',
      '',
      '## Verdicts',
      'real verdict',
    ].join('\n');
    expect(splitSections(body)).toEqual({
      preamble: 'context',
      acceptanceCriteria: 'real before\n<!--\n## Verdicts\nnot a verdict\n-->\nreal after',
      verdicts: 'real verdict',
    });
  });

  it('keeps T-020, T-030, and T-055 as committed section-key regression fixtures', () => {
    const files = [
      'docs/tasks/T-020-ci-real-input-lane.md',
      'docs/tasks/T-030-parser-strictness-pass.md',
      'docs/tasks/T-055-one-answer-to-what-content-is.md',
    ];
    const sectionKeys = files.map((file) => {
      const source = readFileSync(join(repoRoot, file), 'utf8');
      const body = extractFrontmatter(source, file).body;
      return {
        file,
        before: Object.keys(splitSectionsBeforeInertPass(body)),
        after: Object.keys(splitSections(body)),
      };
    });
    expect(sectionKeys).toEqual(
      files.map((file) => ({
        file,
        before: ['preamble', 'acceptanceCriteria', 'implementationNotes', 'verdicts'],
        after: ['preamble', 'acceptanceCriteria', 'implementationNotes', 'verdicts'],
      })),
    );
  });

  it('keeps every live task section split byte-identical to the pre-pass result', () => {
    const taskDir = join(repoRoot, 'docs/tasks');
    const moved = readdirSync(taskDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => {
        const file = `docs/tasks/${entry.name}`;
        const source = readFileSync(join(taskDir, entry.name), 'utf8');
        const body = extractFrontmatter(source, file).body;
        return {
          file,
          before: splitSectionsBeforeInertPass(body),
          after: splitSections(body),
        };
      })
      .filter(({ before, after }) => JSON.stringify(before) !== JSON.stringify(after));
    expect(moved).toEqual([]);
  });
});

describe('parseTaskFile — malformed input', () => {
  it('missing required field: structured issue naming file and field', () => {
    const noSize = VALID.replace('size: M                  # S | M | L\n', '');
    const { task, issues } = parseTaskFile(noSize, FILE);
    expect(issues).toEqual([
      {
        kind: 'missing-field',
        file: FILE,
        field: 'size',
        message: expect.stringContaining(FILE),
      },
    ]);
    // identity still holds, so the card is returned alongside its issue
    expect(task?.id).toBe('T-016');
    expect(task?.size).toBeUndefined();
  });

  it('missing title (identity field): issue named, no task returned', () => {
    const noTitle = VALID.replace('title: Audit log\n', '');
    const { task, issues } = parseTaskFile(noTitle, FILE);
    expect(task).toBeUndefined();
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'missing-field', file: FILE, field: 'title' }),
    );
  });

  it('broken YAML: structured yaml-error naming the file, no throw', () => {
    const broken = `---\nid: T-016\ntitle: "unterminated\nstatus: planned\n---\n\nbody\n`;
    const { task, issues } = parseTaskFile(broken, FILE);
    expect(task).toBeUndefined();
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ kind: 'yaml-error', file: FILE });
    expect(issues[0]?.message).toContain(FILE);
  });

  it('no frontmatter block at all', () => {
    const { task, issues } = parseTaskFile('# just markdown\n', FILE);
    expect(task).toBeUndefined();
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-frontmatter', file: FILE }),
    ]);
  });

  it('frontmatter that is not a mapping', () => {
    const { task, issues } = parseTaskFile('---\n- a\n- b\n---\n', FILE);
    expect(task).toBeUndefined();
    expect(issues).toEqual([expect.objectContaining({ kind: 'not-a-mapping', file: FILE })]);
  });

  it('invalid status value: invalid-field naming file and field', () => {
    const bad = VALID.replace(/status: planned.*\n/, 'status: in-progress\n');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(task).toBeUndefined();
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'status' }),
    );
  });

  it('scalar where a list is required: invalid-field, parsing still returns the task', () => {
    const bad = VALID.replace('blocked_by: [T-015]', 'blocked_by: T-015');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'blocked_by' }),
    );
    expect(task?.blockedBy).toEqual([]);
  });

  it('invalid review value: invalid-field', () => {
    const bad = VALID.replace('review:', 'review: rubber-stamped');
    const { issues } = parseTaskFile(bad, FILE);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'review' }),
    );
  });

  it('builder with empty session after @: invalid-field on builder', () => {
    const bad = VALID.replace('builder: codex@S3', 'builder: codex@');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toContainEqual(
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'builder' }),
    );
    expect(task?.builder).toBeUndefined();
  });
});

describe('parseTaskFile — id and feature FORMAT (T-019)', () => {
  it('id outside the T-NNN family: one structured invalid-field, no record for a planned task', () => {
    const bad = VALID.replace('id: T-016', 'id: banana');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'id' }),
    ]);
    expect(issues[0]?.message).toContain('banana');
    // Same loud-trap consequence as an absent id: identity requires a
    // usable id on non-suggested statuses (consistent with the `id: 007`
    // YAML-number probe in verifier-probes.test.ts).
    expect(task).toBeUndefined();
  });

  it('the family: T-NNN and T-NNN-sN pass; lookalikes fail (first-match — one issue per field)', () => {
    for (const good of ['T-1', 'T-016', 'T-016-s1', 'T-999-s12']) {
      const { task, issues } = parseTaskFile(VALID.replace('id: T-016', `id: ${good}`), FILE);
      expect(issues).toEqual([]);
      expect(task?.id).toBe(good);
    }
    for (const bad of ['t-016', 'T016', 'T-016-s', 'T-016-x1', 'T-016-s1-s2', '"T-016 extra"']) {
      const { task, issues } = parseTaskFile(VALID.replace('id: T-016', `id: ${bad}`), FILE);
      expect(issues).toEqual([
        expect.objectContaining({ kind: 'invalid-field', field: 'id', file: FILE }),
      ]);
      expect(task).toBeUndefined();
    }
  });

  it('a suggestion with a malformed id keeps its record (id is optional there) — flagged, not hidden', () => {
    const suggestion = `---
id: banana
title: Ghost with a broken id
status: suggested
suggested_by: verifier
---
`;
    const { task, issues } = parseTaskFile(suggestion, 'docs/tasks/T-016-s1-ghost.md');
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', field: 'id' }),
    ]);
    expect(task?.status).toBe('suggested');
    expect(task?.id).toBeUndefined();
  });

  it('feature outside F-NN: structured invalid-field; record still returned (same discipline)', () => {
    const bad = VALID.replace('feature: F-03            # story map column', 'feature: banana');
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'invalid-field', file: FILE, field: 'feature' }),
    ]);
    expect(task?.id).toBe('T-016');
    expect(task?.feature).toBeUndefined();
  });
});

describe('parseTaskFile — the suggestion preamble (T-019, absorbing T-002-s2)', () => {
  it('a heading-less body is ALL preamble — a suggestion\'s paragraph is its entire content', () => {
    const suggestion = `---
title: Cache parsed models
status: suggested
suggested_by: executor codex @T-101
---

Re-parsing the whole tree on every save is wasteful once projects grow;
a content-hash cache would make the watcher loop cheap.
`;
    const { task, issues } = parseTaskFile(suggestion, 'docs/tasks/T-101-s1-cache.md');
    expect(issues).toEqual([]);
    expect(task?.sections.preamble).toBe(
      'Re-parsing the whole tree on every save is wasteful once projects grow;\na content-hash cache would make the watcher loop cheap.',
    );
  });

  it('on a full task the text before the first heading is the preamble; sections are untouched', () => {
    const withPreamble = VALID.replace(
      '\n## Acceptance criteria',
      '\nAbsorbs: T-002-s1. Context paragraph kept verbatim.\n\n## Acceptance criteria',
    );
    const { task, issues } = parseTaskFile(withPreamble, FILE);
    expect(issues).toEqual([]);
    expect(task?.sections.preamble).toBe('Absorbs: T-002-s1. Context paragraph kept verbatim.');
    expect(task?.sections.acceptanceCriteria).toContain('WHEN an egress event occurs');
  });

  it('no preamble key when there is no pre-heading text (blank lines are not a preamble)', () => {
    const { task } = parseTaskFile(VALID, FILE);
    expect(task?.sections.preamble).toBeUndefined();
    expect('preamble' in (task?.sections ?? {})).toBe(false);
  });

  it('an empty body yields no preamble key either', () => {
    const headerOnly = VALID.split('\n\n## Acceptance criteria')[0] ?? '';
    const { task } = parseTaskFile(`${headerOnly}\n`, FILE);
    expect(task?.sections).toEqual({});
  });
});

describe('parseTaskFile — suggested and parked statuses', () => {
  it('suggested: minimal file (title, status, suggested_by; no id) is valid', () => {
    const suggestion = `---
title: Cache parsed models
status: suggested
suggested_by: executor codex @T-101
---

One paragraph of context.
`;
    const { task, issues } = parseTaskFile(suggestion, 'docs/tasks/T-101-s1-cache.md');
    expect(issues).toEqual([]);
    expect(task).toMatchObject({
      title: 'Cache parsed models',
      status: 'suggested',
      suggestedBy: 'executor codex @T-101',
      blockedBy: [],
      touches: [],
    });
    expect(task?.id).toBeUndefined();
  });

  it('suggested without suggested_by: missing-field (attribution is required)', () => {
    const bad = `---
title: Anonymous idea
status: suggested
---
`;
    const { task, issues } = parseTaskFile(bad, FILE);
    expect(issues).toEqual([
      expect.objectContaining({ kind: 'missing-field', field: 'suggested_by', file: FILE }),
    ]);
    expect(task?.status).toBe('suggested');
  });

  it('parked: placement fields are optional, id still required', () => {
    const parked = `---
id: T-050
title: Cost telemetry
status: parked
---

Backbone-level idea.
`;
    const { task, issues } = parseTaskFile(parked, FILE);
    expect(issues).toEqual([]);
    expect(task).toMatchObject({ id: 'T-050', status: 'parked' });
  });

  it('parked with full placement fields also parses', () => {
    const parked = VALID.replace(/status: planned.*\n/, 'status: parked\n');
    const { task, issues } = parseTaskFile(parked, FILE);
    expect(issues).toEqual([]);
    expect(task?.status).toBe('parked');
    expect(task?.feature).toBe('F-03');
  });
});
